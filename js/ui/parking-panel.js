/**
 * 停车场面板 UI — 车位网格 / 载具商店 / 我的车库
 * CAP-PKG-10
 */
var ParkingPanel = {
  _activeTab: 'slots',
  _refreshTimer: null,

  init: function () {
    EventBus.on('parking:slot_unlocked', this._onUpdate.bind(this));
    EventBus.on('parking:vehicle_acquired', this._onUpdate.bind(this));
    EventBus.on('parking:vehicle_parked', this._onUpdate.bind(this));
    EventBus.on('parking:vehicle_removed', this._onUpdate.bind(this));
    EventBus.on('parking:income_collected', this._onUpdate.bind(this));
    EventBus.on('town:building_upgraded', this._onBuildingUpgraded.bind(this));
  },

  _onUpdate: function () {
    var el = document.getElementById('parking-panel-content');
    if (el) this.show();
  },

  _onBuildingUpgraded: function (data) {
    if (data.buildingId === 'parking_lot') {
      var el = document.getElementById('parking-panel-content');
      if (el) this.show();
    }
  },

  show: function () {
    var html = this._render();
    OverlayPanel.show({
      title: '🅿️ 停车场',
      content: html,
      panelId: 'parking',
      height: 'full',
      onClose: function () {
        if (ParkingPanel._refreshTimer) {
          clearInterval(ParkingPanel._refreshTimer);
          ParkingPanel._refreshTimer = null;
        }
      }
    });
    this._bindEvents();
    this._startRefresh();
  },

  _startRefresh: function () {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    this._refreshTimer = setInterval(function () {
      var el = document.getElementById('parking-panel-content');
      if (!el) {
        clearInterval(ParkingPanel._refreshTimer);
        ParkingPanel._refreshTimer = null;
        return;
      }
      var incomeEl = document.getElementById('parking-income-display');
      if (incomeEl) {
        incomeEl.textContent = Utils.formatNumber(Math.floor(ParkingManager.getIncomePerHour()));
      }
    }, 1000);
  },

  _render: function () {
    var parkingLevel = typeof TownManager !== 'undefined' ? TownManager.getBuildingLevel('parking_lot') : 0;

    if (parkingLevel < 1) {
      return this._renderUnbuilt();
    }

    var state = ParkingManager.getState();
    var incomePerHour = Math.floor(ParkingManager.getIncomePerHour());
    var multiplier = INCOME_MULTIPLIERS[parkingLevel] || 1.0;

    var html = '<div id="parking-panel-content">';

    // Header
    html += '<div style="text-align:center;padding:8px;background:var(--color-surface);border-radius:8px;margin-bottom:10px;">';
    html += '<div style="font-size:1.1em;font-weight:bold;">🅿️ 停车场 Lv.' + parkingLevel + '</div>';
    html += '<div style="color:var(--color-gold);margin-top:4px;">收入倍率 ×' + multiplier.toFixed(2) + '</div>';
    html += '<div style="color:var(--color-success);margin-top:4px;">当前收入：<span id="parking-income-display">' + Utils.formatNumber(incomePerHour) + '</span> 金/小时</div>';
    html += '</div>';

    // Tab buttons
    html += '<div style="display:flex;gap:4px;margin-bottom:10px;">';
    var tabs = [
      { id: 'slots', label: '🚗 车位' },
      { id: 'shop', label: '🏪 商店' },
      { id: 'garage', label: '🔧 车库' }
    ];
    for (var t = 0; t < tabs.length; t++) {
      var active = this._activeTab === tabs[t].id;
      html += '<button class="btn" data-parking-tab="' + tabs[t].id + '" style="flex:1;padding:8px;';
      if (active) html += 'background:var(--color-primary);color:#fff;';
      else html += 'background:var(--color-surface);color:var(--color-text-dim);';
      html += '">' + tabs[t].label + '</button>';
    }
    html += '</div>';

    // Tab content
    if (this._activeTab === 'slots') {
      html += this._renderSlots(state, parkingLevel);
    } else if (this._activeTab === 'shop') {
      html += this._renderShop(state, parkingLevel);
    } else if (this._activeTab === 'garage') {
      html += this._renderGarage(state);
    }

    html += '</div>';
    return html;
  },

  _renderUnbuilt: function () {
    var html = '<div id="parking-panel-content" style="text-align:center;padding:40px 20px;">';
    html += '<div style="font-size:3em;">🅿️</div>';
    html += '<div style="font-size:1.2em;margin:16px 0;">停车场尚未建造</div>';
    html += '<div style="color:var(--color-text-dim);margin-bottom:16px;">';
    html += '需要：城主府 Lv.4 + 马厩 Lv.1';
    html += '</div>';
    html += '<div style="color:var(--color-text-dim);">';
    html += '在城镇中建造停车场后，可购买载具停入车位，被动产出金币收入。';
    html += '</div>';
    html += '</div>';
    return html;
  },

  _renderSlots: function (state, parkingLevel) {
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';

    for (var i = 0; i < 10; i++) {
      if (i < state.unlockedSlots) {
        var slot = state.slots[i];
        if (slot && slot.status === 'occupied' && slot.vehicleId) {
          // Find vehicle data
          var vehicle = null;
          for (var v = 0; v < state.vehicles.length; v++) {
            if (state.vehicles[v].uid === slot.vehicleId) {
              vehicle = state.vehicles[v];
              break;
            }
          }
          var vData = vehicle ? ParkingData[vehicle.tierId] : null;
          html += '<div class="card" style="text-align:center;padding:12px;cursor:pointer;" data-parking-remove="' + i + '">';
          html += '<div style="font-size:2em;">' + (vData ? vData.emoji : '?') + '</div>';
          html += '<div style="font-size:0.8em;margin-top:4px;">' + (vData ? vData.name : '未知') + '</div>';
          html += '<div style="font-size:0.7em;color:var(--color-gold);">' + (vData ? Utils.formatNumber(vData.goldPerHour) : '0') + ' 金/时</div>';
          html += '</div>';
        } else {
          // Empty slot
          html += '<div class="card" style="text-align:center;padding:12px;cursor:pointer;opacity:0.6;" data-parking-park="' + i + '">';
          html += '<div style="font-size:2em;">➕</div>';
          html += '<div style="font-size:0.8em;margin-top:4px;color:var(--color-text-dim);">空车位 ' + (i + 1) + '</div>';
          html += '</div>';
        }
      } else {
        // Locked slot
        var nextSlot = state.unlockedSlots + 1;
        if (i === state.unlockedSlots) {
          var cost = SLOT_COSTS[nextSlot];
          var canUnlock = ParkingManager.canUnlockSlot();
          html += '<div class="card" style="text-align:center;padding:12px;cursor:' + (canUnlock ? 'pointer' : 'default') + ';opacity:' + (canUnlock ? '1' : '0.5') + ';" data-parking-unlock="1">';
          html += '<div style="font-size:2em;">🔒</div>';
          html += '<div style="font-size:0.7em;margin-top:4px;">解锁车位 ' + nextSlot + '</div>';
          if (cost) {
            var costParts = [];
            if (cost.gold > 0) costParts.push(Utils.formatNumber(cost.gold) + ' 金');
            if (cost.jade > 0) costParts.push(cost.jade + ' 玉');
            html += '<div style="font-size:0.65em;color:var(--color-gold);">' + (costParts.length > 0 ? costParts.join(' + ') : '免费') + '</div>';
          }
          html += '</div>';
        } else {
          html += '<div class="card" style="text-align:center;padding:12px;opacity:0.3;">';
          html += '<div style="font-size:2em;">🔒</div>';
          html += '<div style="font-size:0.7em;margin-top:4px;color:var(--color-text-dim);">车位 ' + (i + 1) + '</div>';
          html += '</div>';
        }
      }
    }

    html += '</div>';

    // Slot summary
    if (state.unlockedSlots >= 10) {
      html += '<div style="text-align:center;color:var(--color-success);font-size:0.9em;">✅ 全部车位已解锁</div>';
    }

    return html;
  },

  _renderShop: function (state, parkingLevel) {
    var maxTier = PARKING_TIER_CAPS[parkingLevel] || 4;
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';

    var vehicleIds = Object.keys(ParkingData);
    for (var i = 0; i < vehicleIds.length; i++) {
      var vData = ParkingData[vehicleIds[i]];
      var locked = vData.tier > maxTier;
      var canBuy = ParkingManager.canBuyVehicle(vData.id);

      html += '<div class="card" style="display:flex;align-items:center;padding:10px;' + (locked ? 'opacity:0.5;' : '') + '">';

      // Emoji / icon
      html += '<div style="font-size:1.8em;width:44px;text-align:center;">' + vData.emoji + '</div>';

      // Info
      html += '<div style="flex:1;margin-left:8px;">';
      html += '<div style="font-weight:bold;">' + vData.name + '</div>';
      html += '<div style="font-size:0.75em;color:var(--color-gold);">💰 ' + Utils.formatNumber(vData.goldPerHour) + ' 金/时</div>';
      var priceParts = [];
      if (vData.costGold > 0) priceParts.push(Utils.formatNumber(vData.costGold) + ' 金');
      if (vData.costJade > 0) priceParts.push(vData.costJade + ' 玉');
      html += '<div style="font-size:0.7em;color:var(--color-text-dim);">价格：' + (priceParts.length > 0 ? priceParts.join(' + ') : '免费') + '</div>';
      html += '</div>';

      // Button
      if (locked) {
        html += '<div style="font-size:0.7em;color:var(--color-danger);">需停车场 Lv.' + vData.requiredLevel + '</div>';
      } else {
        html += '<button class="btn" data-parking-buy="' + vData.id + '" ' + (canBuy ? '' : 'disabled') + ' style="padding:6px 12px;font-size:0.8em;' + (canBuy ? 'background:var(--color-primary);' : 'opacity:0.5;') + '">购买</button>';
      }

      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  _renderGarage: function (state) {
    var html = '';

    var unparked = [];
    var parked = [];
    for (var i = 0; i < state.vehicles.length; i++) {
      if (state.vehicles[i].parkedAt !== null) {
        parked.push(state.vehicles[i]);
      } else {
        unparked.push(state.vehicles[i]);
      }
    }

    if (state.vehicles.length === 0) {
      html += '<div style="text-align:center;padding:30px;color:var(--color-text-dim);">';
      html += '车库为空，前往商店购买载具吧！';
      html += '</div>';
      return html;
    }

    // Unparked vehicles
    if (unparked.length > 0) {
      html += '<div style="font-weight:bold;margin-bottom:6px;color:var(--color-text-dim);font-size:0.85em;">🔧 待停入（' + unparked.length + '）</div>';
      html += '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">';
      for (var u = 0; u < unparked.length; u++) {
        var uv = unparked[u];
        var uvData = ParkingData[uv.tierId];
        if (!uvData) continue;

        html += '<div class="card" style="display:flex;align-items:center;padding:8px;">';
        html += '<div style="font-size:1.5em;width:36px;text-align:center;">' + uvData.emoji + '</div>';
        html += '<div style="flex:1;margin-left:8px;">';
        html += '<div>' + uvData.name + '</div>';
        html += '<div style="font-size:0.7em;color:var(--color-gold);">💰 ' + Utils.formatNumber(uvData.goldPerHour) + ' 金/时</div>';
        html += '</div>';

        // Check if there are empty slots
        var hasEmpty = false;
        for (var si = 0; si < state.slots.length; si++) {
          if (state.slots[si].status === 'empty') { hasEmpty = true; break; }
        }

        if (hasEmpty) {
          html += '<button class="btn" data-parking-auto-park="' + uv.uid + '" style="padding:4px 10px;font-size:0.75em;background:var(--color-primary);margin-right:4px;">停入</button>';
        }
        html += '<button class="btn" data-parking-sell="' + uv.uid + '" style="padding:4px 10px;font-size:0.75em;background:var(--color-danger);">出售</button>';
        html += '</div>';
      }
      html += '</div>';
    }

    // Parked vehicles
    if (parked.length > 0) {
      html += '<div style="font-weight:bold;margin-bottom:6px;color:var(--color-text-dim);font-size:0.85em;">🚗 已停入（' + parked.length + '）</div>';
      html += '<div style="display:flex;flex-direction:column;gap:6px;">';
      for (var p = 0; p < parked.length; p++) {
        var pv = parked[p];
        var pvData = ParkingData[pv.tierId];
        if (!pvData) continue;

        html += '<div class="card" style="display:flex;align-items:center;padding:8px;">';
        html += '<div style="font-size:1.5em;width:36px;text-align:center;">' + pvData.emoji + '</div>';
        html += '<div style="flex:1;margin-left:8px;">';
        html += '<div>' + pvData.name + ' <span style="font-size:0.7em;color:var(--color-success);">🅿️ 车位 ' + (pv.parkedAt + 1) + '</span></div>';
        html += '<div style="font-size:0.7em;color:var(--color-gold);">💰 ' + Utils.formatNumber(pvData.goldPerHour) + ' 金/时</div>';
        html += '</div>';
        html += '<button class="btn" data-parking-take-out="' + pv.uid + '|' + pv.parkedAt + '" style="padding:4px 10px;font-size:0.75em;background:var(--color-secondary);">取出</button>';
        html += '</div>';
      }
      html += '</div>';
    }

    return html;
  },

  _bindEvents: function () {
    var panel = document.getElementById('parking-panel-content');
    if (!panel) return;

    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-parking-tab]');
      if (btn) {
        ParkingPanel._activeTab = btn.getAttribute('data-parking-tab');
        ParkingPanel.show();
        return;
      }

      // Unlock slot
      btn = e.target.closest('[data-parking-unlock]');
      if (btn) {
        ParkingManager.unlockSlot();
        return;
      }

      // Buy vehicle
      btn = e.target.closest('[data-parking-buy]');
      if (btn) {
        var tierId = btn.getAttribute('data-parking-buy');
        ParkingManager.buyVehicle(tierId);
        return;
      }

      // Park vehicle (from slot view — open garage to pick)
      btn = e.target.closest('[data-parking-park]');
      if (btn) {
        // Switch to garage tab for user to pick a vehicle
        ParkingPanel._activeTab = 'garage';
        ParkingPanel.show();
        return;
      }

      // Auto park (from garage — find first empty slot)
      btn = e.target.closest('[data-parking-auto-park]');
      if (btn) {
        var uid = btn.getAttribute('data-parking-auto-park');
        var state = ParkingManager.getState();
        for (var s = 0; s < state.slots.length; s++) {
          if (state.slots[s].status === 'empty') {
            ParkingManager.parkVehicle(uid, s);
            break;
          }
        }
        return;
      }

      // Remove vehicle from slot (from slot grid)
      btn = e.target.closest('[data-parking-remove]');
      if (btn) {
        var slotIdx = parseInt(btn.getAttribute('data-parking-remove'), 10);
        ParkingManager.removeVehicle(slotIdx);
        return;
      }

      // Take out vehicle (from garage)
      btn = e.target.closest('[data-parking-take-out]');
      if (btn) {
        var parts = btn.getAttribute('data-parking-take-out').split('|');
        var slotIndex = parseInt(parts[1], 10);
        ParkingManager.removeVehicle(slotIndex);
        return;
      }

      // Sell vehicle
      btn = e.target.closest('[data-parking-sell]');
      if (btn) {
        var sellUid = btn.getAttribute('data-parking-sell');
        var vehicle = null;
        var st = ParkingManager.getState();
        for (var vi = 0; vi < st.vehicles.length; vi++) {
          if (st.vehicles[vi].uid === sellUid) {
            vehicle = st.vehicles[vi];
            break;
          }
        }
        if (!vehicle) return;

        var vData = ParkingData[vehicle.tierId];
        if (!vData) return;

        if (vehicle.parkedAt !== null) {
          EventBus.emit('toast:show', { type: 'warning', message: '请先将载具取出' });
          return;
        }

        var refundParts = [];
        if (vData.costGold > 0) refundParts.push(Utils.formatNumber(Math.floor(vData.costGold * 0.5)) + ' 金');
        if (vData.costJade > 0) refundParts.push(Math.floor(vData.costJade * 0.3) + ' 玉');

        Modal.show({
          title: '确认出售',
          content: '<p>确定出售 ' + vData.emoji + ' ' + vData.name + '？</p><p>将获得：' + (refundParts.length > 0 ? refundParts.join(' + ') : '无') + '</p>',
          confirmText: '确定出售',
          onConfirm: function () {
            ParkingManager.sellVehicle(sellUid);
            ParkingPanel.show();
          }
        });
        return;
      }
    });
  }
};
