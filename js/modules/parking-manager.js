/**
 * 驿站管理器 — 坐骑购买、马厩管理、被动金币收入
 * CAP-PKG-01 ~ CAP-PKG-09
 */
var ParkingManager = {
  _state: {
    slots: [],
    vehicles: [],
    unlockedSlots: 0,
    totalIncomeEarned: 0,
    lastTickTime: null
  },
  _incomeAccum: 0,

  // ---------- Init ----------

  init: function (saved) {
    var data = (saved && saved.parking) ? saved.parking : null;
    if (data) {
      this._state.slots = data.slots || [];
      this._state.vehicles = data.vehicles || [];
      this._state.unlockedSlots = data.unlockedSlots || 0;
      this._state.totalIncomeEarned = data.totalIncomeEarned || 0;
      this._state.lastTickTime = data.lastTickTime || null;
    } else {
      this._state = {
        slots: [],
        vehicles: [],
        unlockedSlots: 0,
        totalIncomeEarned: 0,
        lastTickTime: null
      };
    }
    this._incomeAccum = 0;

    // If parking_lot is built (level >= 1) but no slots exist yet, initialize 2 slots
    var parkingLevel = this._getParkingLevel();
    if (parkingLevel >= 1 && this._state.unlockedSlots === 0) {
      this._state.unlockedSlots = 2;
      this._state.slots = [
        { status: 'empty', vehicleId: null },
        { status: 'empty', vehicleId: null }
      ];
    }

    // Consistency sync (§9.1)
    this._syncConsistency();

    // Listen for building upgrades to auto-init slots on first build
    EventBus.on('town:building_upgraded', this._onBuildingUpgraded.bind(this));
  },

  _syncConsistency: function () {
    // Reset vehicle parkedAt data based on slots (slots are source of truth)
    for (var v = 0; v < this._state.vehicles.length; v++) {
      this._state.vehicles[v].parkedAt = null;
    }

    for (var i = 0; i < this._state.slots.length; i++) {
      var slot = this._state.slots[i];
      if (slot.status === 'occupied' && slot.vehicleId) {
        var vehicle = this._findVehicle(slot.vehicleId);
        if (vehicle) {
          vehicle.parkedAt = i;
        } else {
          // Vehicle doesn't exist, reset slot
          slot.status = 'empty';
          slot.vehicleId = null;
        }
      }
    }
  },

  _onBuildingUpgraded: function (data) {
    if (data.buildingId !== 'parking_lot') return;
    // First build: initialize 2 slots
    if (data.newLevel === 1 && this._state.unlockedSlots === 0) {
      this._state.unlockedSlots = 2;
      this._state.slots = [
        { status: 'empty', vehicleId: null },
        { status: 'empty', vehicleId: null }
      ];
    }
  },

  // ---------- Tick (CAP-PKG-07) ----------

  onTick: function (dt) {
    var parkingLevel = this._getParkingLevel();
    if (parkingLevel < 1) return; // Not built

    this._state.lastTickTime = Date.now();

    var incomePerSecond = this._calcIncomePerSecond(parkingLevel);
    if (incomePerSecond <= 0) return;

    this._incomeAccum += incomePerSecond * dt;

    if (this._incomeAccum >= 1) {
      var amount = Math.floor(this._incomeAccum);
      this._incomeAccum -= amount;
      ResourceManager.add('gold', amount, 'production', 'parking_lot');
      this._state.totalIncomeEarned += amount;
      EventBus.emit('parking:income_collected', { amount: amount });
    }
  },

  // ---------- Slot Unlock (CAP-PKG-03) ----------

  canUnlockSlot: function () {
    if (this._getParkingLevel() < 1) return false;
    if (this._state.unlockedSlots >= 10) return false;
    var cost = this.getNextSlotCost();
    if (!cost) return false;
    return ResourceManager.canAffordMultiple(cost);
  },

  getNextSlotCost: function () {
    var nextIndex = this._state.unlockedSlots + 1;
    if (nextIndex > 10) return null;
    return SLOT_COSTS[nextIndex];
  },

  unlockSlot: function () {
    if (!this.canUnlockSlot()) return false;
    var cost = this.getNextSlotCost();
    var costs = {};
    if (cost.gold > 0) costs.gold = cost.gold;
    if (cost.jade > 0) costs.jade = cost.jade;

    if (Object.keys(costs).length > 0) {
      if (!ResourceManager.spendMultiple(costs, 'parking', 'slot_unlock')) return false;
    }

    this._state.unlockedSlots++;
    this._state.slots.push({ status: 'empty', vehicleId: null });

    EventBus.emit('parking:slot_unlocked', {
      slotIndex: this._state.unlockedSlots - 1,
      totalSlots: this._state.unlockedSlots
    });
    EventBus.emit('toast:show', {
      type: 'success',
      message: '车位 ' + this._state.unlockedSlots + ' 已解锁！'
    });
    return true;
  },

  // ---------- Buy Vehicle (CAP-PKG-04) ----------

  canBuyVehicle: function (tierId) {
    var vData = ParkingData[tierId];
    if (!vData) return false;
    var parkingLevel = this._getParkingLevel();
    if (parkingLevel < 1) return false;
    var maxTier = PARKING_TIER_CAPS[parkingLevel] || 4;
    if (vData.tier > maxTier) return false;

    // Check max vehicles (soft cap 50)
    if (this._state.vehicles.length >= 50) return false;

    var costs = {};
    if (vData.costGold > 0) costs.gold = vData.costGold;
    if (vData.costJade > 0) costs.jade = vData.costJade;
    return ResourceManager.canAffordMultiple(costs);
  },

  buyVehicle: function (tierId) {
    if (!this.canBuyVehicle(tierId)) return false;
    var vData = ParkingData[tierId];
    var costs = {};
    if (vData.costGold > 0) costs.gold = vData.costGold;
    if (vData.costJade > 0) costs.jade = vData.costJade;

    if (Object.keys(costs).length > 0) {
      if (!ResourceManager.spendMultiple(costs, 'parking', 'buy_vehicle')) return false;
    }

    var vehicle = {
      uid: Utils.uid(),
      tierId: tierId,
      parkedAt: null
    };
    this._state.vehicles.push(vehicle);

    EventBus.emit('parking:vehicle_acquired', { vehicleId: vehicle.uid });
    EventBus.emit('toast:show', {
      type: 'success',
      message: vData.emoji + ' ' + vData.name + ' 已入手！'
    });
    return true;
  },

  // ---------- Park / Remove Vehicle (CAP-PKG-05, CAP-PKG-06) ----------

  parkVehicle: function (vehicleUid, slotIndex) {
    var vehicle = this._findVehicle(vehicleUid);
    if (!vehicle) return false;
    if (vehicle.parkedAt !== null) return false; // Already parked

    if (slotIndex < 0 || slotIndex >= this._state.slots.length) return false;
    var slot = this._state.slots[slotIndex];
    if (slot.status !== 'empty') return false;

    slot.status = 'occupied';
    slot.vehicleId = vehicleUid;
    vehicle.parkedAt = slotIndex;

    EventBus.emit('parking:vehicle_parked', { vehicleId: vehicleUid, slotIndex: slotIndex });
    return true;
  },

  removeVehicle: function (slotIndex) {
    if (slotIndex < 0 || slotIndex >= this._state.slots.length) return false;
    var slot = this._state.slots[slotIndex];
    if (slot.status !== 'occupied' || !slot.vehicleId) return false;

    var vehicle = this._findVehicle(slot.vehicleId);
    var vehicleId = slot.vehicleId;

    slot.status = 'empty';
    slot.vehicleId = null;

    if (vehicle) {
      vehicle.parkedAt = null;
    }

    EventBus.emit('parking:vehicle_removed', { vehicleId: vehicleId, slotIndex: slotIndex });
    return true;
  },

  // ---------- Sell Vehicle (CAP-PKG-09) ----------

  canSellVehicle: function (vehicleUid) {
    var vehicle = this._findVehicle(vehicleUid);
    if (!vehicle) return false;
    if (vehicle.parkedAt !== null) return false; // Must remove first
    return true;
  },

  sellVehicle: function (vehicleUid) {
    if (!this.canSellVehicle(vehicleUid)) return false;
    var vehicle = this._findVehicle(vehicleUid);
    var vData = ParkingData[vehicle.tierId];
    if (!vData) return false;

    // Remove from vehicles array
    for (var i = 0; i < this._state.vehicles.length; i++) {
      if (this._state.vehicles[i].uid === vehicleUid) {
        this._state.vehicles.splice(i, 1);
        break;
      }
    }

    // Refund: 50% gold, 30% jade
    if (vData.costGold > 0) {
      var goldRefund = Math.floor(vData.costGold * 0.5);
      ResourceManager.add('gold', goldRefund, 'sell', 'parking_vehicle');
    }
    if (vData.costJade > 0) {
      var jadeRefund = Math.floor(vData.costJade * 0.3);
      ResourceManager.add('jade', jadeRefund, 'sell', 'parking_vehicle');
    }

    EventBus.emit('toast:show', {
      type: 'success',
      message: vData.emoji + ' ' + vData.name + ' 已出售'
    });

    return true;
  },

  // ---------- Offline Income (CAP-PKG-08) ----------

  calcOfflineIncome: function (offlineDt) {
    var parkingLevel = this._getParkingLevel();
    if (parkingLevel < 1) return 0;

    // Cap at 24 hours
    offlineDt = Math.min(offlineDt, 86400);

    var incomePerSecond = this._calcIncomePerSecond(parkingLevel);
    if (incomePerSecond <= 0) return 0;

    var rawIncome = incomePerSecond * offlineDt;

    // Apply offline efficiency from adventure_guild
    var efficiency = 0.50;
    if (typeof TownManager !== 'undefined' && TownManager.getOfflineEfficiency) {
      efficiency = TownManager.getOfflineEfficiency();
    }

    return Math.floor(rawIncome * efficiency);
  },

  // ---------- Query API ----------

  getIncomePerHour: function () {
    var parkingLevel = this._getParkingLevel();
    if (parkingLevel < 1) return 0;
    return this._calcIncomePerSecond(parkingLevel) * 3600;
  },

  getState: function () {
    return Utils.deepClone(this._state);
  },

  getVehicleData: function (tierId) {
    return ParkingData[tierId] || null;
  },

  getMaxVehicleTier: function () {
    var parkingLevel = this._getParkingLevel();
    return PARKING_TIER_CAPS[parkingLevel] || 0;
  },

  // ---------- Internal ----------

  _getParkingLevel: function () {
    if (typeof TownManager !== 'undefined') {
      return TownManager.getBuildingLevel('parking_lot');
    }
    return 0;
  },

  _calcIncomePerSecond: function (parkingLevel) {
    var total = 0;
    for (var i = 0; i < this._state.slots.length; i++) {
      var slot = this._state.slots[i];
      if (slot.status === 'occupied' && slot.vehicleId) {
        var vehicle = this._findVehicle(slot.vehicleId);
        if (vehicle) {
          var vData = ParkingData[vehicle.tierId];
          if (vData) {
            total += vData.goldPerHour / 3600;
          }
        }
      }
    }
    var multiplier = INCOME_MULTIPLIERS[parkingLevel] || 1.0;
    return total * multiplier;
  },

  _findVehicle: function (uid) {
    for (var i = 0; i < this._state.vehicles.length; i++) {
      if (this._state.vehicles[i].uid === uid) {
        return this._state.vehicles[i];
      }
    }
    return null;
  }
};
