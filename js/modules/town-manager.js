/**
 * 城镇管理器 — 建筑升级、资源产出、战斗加成、集市交易
 */
var TownManager = {
  _state: {
    buildings: {
      town_hall:        { level: 1, buildEndTime: null, count: 1, buildType: null },
      lumber_camp:      { level: 0, buildEndTime: null, count: 0, buildType: null },
      quarry:           { level: 0, buildEndTime: null, count: 0, buildType: null },
      iron_mine:        { level: 0, buildEndTime: null, count: 0, buildType: null },
      farmland:         { level: 0, buildEndTime: null, count: 0, buildType: null },
      barracks:         { level: 0, buildEndTime: null, count: 0, buildType: null },
      training_ground:  { level: 0, buildEndTime: null, count: 0, buildType: null },
      blacksmith:       { level: 0, buildEndTime: null, count: 0, buildType: null },
      city_wall:        { level: 0, buildEndTime: null, count: 0, buildType: null },
      adventure_guild:  { level: 0, buildEndTime: null, count: 0, buildType: null },
      tavern:           { level: 0, buildEndTime: null, count: 0, buildType: null },
      warehouse:        { level: 0, buildEndTime: null, count: 0, buildType: null },
      market:           { level: 0, buildEndTime: null, count: 0, buildType: null },
      tax_office:       { level: 0, buildEndTime: null, count: 0, buildType: null },
      weapon_workshop:  { level: 0, buildEndTime: null, count: 0, buildType: null },
      stable:           { level: 0, buildEndTime: null, count: 0, buildType: null },
      academy:          { level: 0, buildEndTime: null, count: 0, buildType: null },
      watermill:        { level: 0, buildEndTime: null, count: 0, buildType: null },
      stone_mason:      { level: 0, buildEndTime: null, count: 0, buildType: null },
      smelter:          { level: 0, buildEndTime: null, count: 0, buildType: null },
      vegetable_garden: { level: 0, buildEndTime: null, count: 0, buildType: null },
      compost_pit:      { level: 0, buildEndTime: null, count: 0, buildType: null },
      seed_shop:        { level: 0, buildEndTime: null, count: 0, buildType: null },
      parking_lot:      { level: 0, buildEndTime: null, count: 0, buildType: null }
    },
    placements: {},
    roads: [],
    workers: 1,
    firstBuildingCompleted: false,
    buildQueue: []
  },

  /** 资源产出累加器（秒级精度 → 每分钟产出） */
  _productionAccum: { wood: 0, stone: 0, iron: 0, gold: 0 },

  init: function (saved) {
    var data = (saved && saved.town) ? saved.town : {};
    if (data.buildings) {
      this._state.buildings = {};
      var defaults = this._getDefaultBuildings();
      for (var id in defaults) {
        if (defaults.hasOwnProperty(id)) {
          if (data.buildings[id]) {
            this._state.buildings[id] = {
              level: data.buildings[id].level || 0,
              buildEndTime: data.buildings[id].buildEndTime || null,
              count: data.buildings[id].count !== undefined ? data.buildings[id].count : (data.buildings[id].level > 0 ? 1 : 0),
              buildType: data.buildings[id].buildType || null
            };
          } else {
            this._state.buildings[id] = Utils.deepClone(defaults[id]);
          }
        }
      }
    } else {
      this._state.buildings = this._getDefaultBuildings();
    }
    this._state.placements = (data && data.placements) ? data.placements : {};
    // Load roads from save or initialize empty
    if (data.roads && Array.isArray(data.roads)) {
      this._state.roads = data.roads.filter(function (r) {
        return r && typeof r.gx === 'number' && typeof r.gy === 'number'
            && r.gx >= 0 && r.gx < 40 && r.gy >= 0 && r.gy < 40;
      });
    } else {
      this._state.roads = [];
    }

    // ---- Worker system state ----
    if (data.workers !== undefined) {
      this._state.workers = data.workers;
      this._state.firstBuildingCompleted = !!data.firstBuildingCompleted;
      this._state.buildQueue = Array.isArray(data.buildQueue) ? data.buildQueue : [];
      this._state.tdBuildPending = Array.isArray(data.tdBuildPending) ? data.tdBuildPending : [];
    } else {
      // Migration: compute workers from current game state
      this._state.workers = 1;
      this._state.firstBuildingCompleted = false;
      for (var migId in this._state.buildings) {
        if (migId !== 'town_hall' && this._state.buildings.hasOwnProperty(migId) && this._state.buildings[migId].level >= 1) {
          this._state.firstBuildingCompleted = true;
          this._state.workers = 2;
          break;
        }
      }
      var migTH = this._state.buildings.town_hall ? this._state.buildings.town_hall.level : 1;
      if (migTH >= 3) this._state.workers = Math.max(this._state.workers, 3);
      if (migTH >= 5) this._state.workers = Math.max(this._state.workers, 4);
      if (migTH >= 7) this._state.workers = Math.max(this._state.workers, 5);
      if (this._state.workers > WORKER_CONFIG.MAX_WORKERS) this._state.workers = WORKER_CONFIG.MAX_WORKERS;
      this._state.buildQueue = [];
      this._state.tdBuildPending = [];
    }

    this._productionAccum = { wood: 0, stone: 0, iron: 0, gold: 0 };

    // Offline queue progression (complete expired builds + advance queue)
    this._processOfflineBuilds();

    // Defer initial road calculation to after TownWorld is initialized
    var self = this;
    setTimeout(function () { self.recalcRoads(); }, 100);
  },

  _getDefaultBuildings: function () {
    return {
      town_hall:        { level: 1, buildEndTime: null, count: 1, buildType: null },
      lumber_camp:      { level: 0, buildEndTime: null, count: 0, buildType: null },
      quarry:           { level: 0, buildEndTime: null, count: 0, buildType: null },
      iron_mine:        { level: 0, buildEndTime: null, count: 0, buildType: null },
      farmland:         { level: 0, buildEndTime: null, count: 0, buildType: null },
      barracks:         { level: 0, buildEndTime: null, count: 0, buildType: null },
      training_ground:  { level: 0, buildEndTime: null, count: 0, buildType: null },
      blacksmith:       { level: 0, buildEndTime: null, count: 0, buildType: null },
      city_wall:        { level: 0, buildEndTime: null, count: 0, buildType: null },
      adventure_guild:  { level: 0, buildEndTime: null, count: 0, buildType: null },
      tavern:           { level: 0, buildEndTime: null, count: 0, buildType: null },
      warehouse:        { level: 0, buildEndTime: null, count: 0, buildType: null },
      market:           { level: 0, buildEndTime: null, count: 0, buildType: null },
      tax_office:       { level: 0, buildEndTime: null, count: 0, buildType: null },
      weapon_workshop:  { level: 0, buildEndTime: null, count: 0, buildType: null },
      stable:           { level: 0, buildEndTime: null, count: 0, buildType: null },
      academy:          { level: 0, buildEndTime: null, count: 0, buildType: null },
      watermill:        { level: 0, buildEndTime: null, count: 0, buildType: null },
      stone_mason:      { level: 0, buildEndTime: null, count: 0, buildType: null },
      smelter:          { level: 0, buildEndTime: null, count: 0, buildType: null },
      vegetable_garden: { level: 0, buildEndTime: null, count: 0, buildType: null },
      compost_pit:      { level: 0, buildEndTime: null, count: 0, buildType: null },
      seed_shop:        { level: 0, buildEndTime: null, count: 0, buildType: null },
      parking_lot:      { level: 0, buildEndTime: null, count: 0, buildType: null }
    };
  },

  // ---------- Tick ----------

  onTick: function (dt) {
    var now = Date.now();

    // 1. 检查施工完成
    var buildCompleted = false;
    for (var id in this._state.buildings) {
      if (!this._state.buildings.hasOwnProperty(id)) continue;
      var b = this._state.buildings[id];
      if (b.buildEndTime && now >= b.buildEndTime) {
        if (b.buildType === 'copy') {
          // 副本建造完成
          b.count++;
          b.buildEndTime = null;
          b.buildType = null;
          EventBus.emit('town:building_upgraded', { buildingId: id, newLevel: b.level, count: b.count });
          EventBus.emit('toast:show', {
            type: 'success',
            message: BuildingData[id].emoji + ' ' + BuildingData[id].name + ' 第' + b.count + '个建造完成！'
          });
        } else {
          // 升级完成
          b.level++;
          if (b.count < 1) b.count = 1; // 首次建造
          b.buildEndTime = null;
          b.buildType = null;
          this._checkWorkerUnlock(id, b.level);
          EventBus.emit('town:building_upgraded', { buildingId: id, newLevel: b.level });
          EventBus.emit('toast:show', {
            type: 'success',
            message: BuildingData[id].emoji + ' ' + BuildingData[id].name + ' 升级到 Lv.' + b.level + '！'
          });
        }
        // Recalculate roads when a new building is constructed
        this.recalcRoads();
        buildCompleted = true;
      }
    }
    if (buildCompleted) this._processQueue();

    // 1b. 检查 TD 建造完成
    if (this._state.tdBuildPending && this._state.tdBuildPending.length > 0) {
      var tdCompleted = false;
      for (var tdi = this._state.tdBuildPending.length - 1; tdi >= 0; tdi--) {
        var tdItem = this._state.tdBuildPending[tdi];
        if (tdItem.buildEndTime && now >= tdItem.buildEndTime) {
          if (typeof TowerDefenseManager !== 'undefined') {
            TowerDefenseManager.buildTowerDirect(tdItem.tdType, tdItem.gridX, tdItem.gridY);
          }
          var tdData = typeof TDTowerData !== 'undefined' ? TDTowerData[tdItem.tdType] : null;
          var tdName = tdData ? tdData.name : tdItem.tdType;
          EventBus.emit('toast:show', { type: 'success', message: '🏰 ' + tdName + ' 建造完成！' });
          this._state.tdBuildPending.splice(tdi, 1);
          tdCompleted = true;
        }
      }
      if (tdCompleted) {
        this._processTDQueue();
        EventBus.emit('town:queue_updated');
      }
    }

    // 2. 资源产出（生产型建筑）
    var productionBuildings = ['lumber_camp', 'quarry', 'iron_mine', 'tax_office'];
    var boosterMap = { lumber_camp: 'watermill', quarry: 'stone_mason', iron_mine: 'smelter' };
    for (var i = 0; i < productionBuildings.length; i++) {
      var bId = productionBuildings[i];
      var lv = this._state.buildings[bId] ? this._state.buildings[bId].level : 0;
      if (lv <= 0) continue;
      var prod = BuildingData[bId].production(lv);
      var perSecond = prod.perMinute / 60;

      // 应用副本数倍率（线性）
      var copyCount = this.getBuildingCount(bId);
      if (copyCount > 1) perSecond *= copyCount;

      // 应用加成器乘数
      var boosterId = boosterMap[bId];
      if (boosterId) {
        var boosterLv = this._state.buildings[boosterId] ? this._state.buildings[boosterId].level : 0;
        if (boosterLv > 0) {
          var boostData = BuildingData[boosterId].boosts;
          var boosterCount = this.getBuildingCount(boosterId);
          perSecond *= (1 + boosterLv * boostData.bonusPerLevel * boosterCount);
        }
      }

      this._productionAccum[prod.resource] += perSecond * dt;

      // 当累积 >= 1 时，投放资源
      while (this._productionAccum[prod.resource] >= 1) {
        this._productionAccum[prod.resource] -= 1;
        ResourceManager.add(prod.resource, 1, 'production', bId, bId + '_lv' + lv);
      }
    }
  },

  // ---------- 查询 API ----------

  getBuildingLevel: function (buildingId) {
    var b = this._state.buildings[buildingId];
    return b ? b.level : 0;
  },

  getBuildingState: function (buildingId) {
    return this._state.buildings[buildingId] || null;
  },

  /** 获取建筑当前副本数 */
  getBuildingCount: function (buildingId) {
    var b = this._state.buildings[buildingId];
    if (!b || b.level <= 0) return 0;
    return b.count || 1;
  },

  /** 获取建筑当前等级下的最大副本数 */
  getMaxCount: function (buildingId) {
    var level = this.getBuildingLevel(buildingId);
    return BuildingData._getMaxCount(buildingId, level);
  },

  /** 获取下一个副本解锁所需等级，如果已经达到最大则返回 null */
  getNextCopyUnlockLevel: function (buildingId) {
    var level = this.getBuildingLevel(buildingId);
    var table = BuildingData._maxCountTable[buildingId];
    if (!table || table.length === 0) return null;
    var currentCount = this.getBuildingCount(buildingId);
    if (currentCount >= table.length) return null;
    return table[currentCount];
  },

  /** 获取建造副本的费用 */
  getCopyCost: function (buildingId) {
    var level = this.getBuildingLevel(buildingId);
    var count = this.getBuildingCount(buildingId);
    return BuildingData._getCopyCost(buildingId, level, count);
  },

  /** 获取建造副本的施工时间 */
  getCopyBuildTime: function (buildingId) {
    var level = this.getBuildingLevel(buildingId);
    return BuildingData._getCopyBuildTime(buildingId, level);
  },

  /** 获取建筑效果倍率（基于副本数）*/
  getCountMultiplier: function (buildingId) {
    var count = this.getBuildingCount(buildingId);
    if (count <= 1) return 1;
    var data = BuildingData[buildingId];
    // 生产建筑 & 加成器：线性倍率
    if (data && (data.production || data.boosts)) return count;
    // 仓库 & 农田（容量类）：线性倍率
    if (buildingId === 'warehouse' || buildingId === 'farmland') return count;
    // 战斗 & 功能建筑：递减倍率 1 + 0.5 × (count-1)
    return 1 + 0.5 * (count - 1);
  },

  /** 检查是否可以建造新副本 */
  canBuildCopy: function (buildingId) {
    var data = BuildingData[buildingId];
    if (!data) return { ok: false, reason: '未知建筑' };

    var bState = this._state.buildings[buildingId];
    var level = bState ? bState.level : 0;
    if (level <= 0) return { ok: false, reason: '需先建造该建筑' };

    var count = this.getBuildingCount(buildingId);
    var maxCount = this.getMaxCount(buildingId);
    if (count >= maxCount) {
      var nextLv = this.getNextCopyUnlockLevel(buildingId);
      if (nextLv) {
        return { ok: false, reason: '需升级到 Lv.' + nextLv + ' 解锁下一副本' };
      }
      return { ok: false, reason: '已达最大数量' };
    }

    // 检查建筑正在施工
    if (this.isBuilding(buildingId)) {
      return { ok: false, reason: '正在施工中' };
    }

    // 检查队列中是否已有该建筑
    for (var i = 0; i < this._state.buildQueue.length; i++) {
      if (this._state.buildQueue[i].buildingId === buildingId) {
        return { ok: false, reason: '该建筑已在队列中' };
      }
    }

    // 检查资源
    var cost = this.getCopyCost(buildingId);
    if (!ResourceManager.canAffordMultiple(cost)) {
      return { ok: false, reason: '资源不足' };
    }

    return { ok: true };
  },

  /** 将副本建造加入队列 */
  enqueueBuildCopy: function (buildingId) {
    if (this._state.buildQueue.length >= WORKER_CONFIG.MAX_QUEUE_SIZE) {
      return { ok: false, reason: '建造队列已满（最多6项）' };
    }

    var check = this.canBuildCopy(buildingId);
    if (!check.ok) return check;

    var cost = this.getCopyCost(buildingId);
    var buildTime = this.getCopyBuildTime(buildingId);

    ResourceManager.spendMultiple(cost, 'building', 'queue_reserve_copy', buildingId);

    var queueItem = {
      id: Utils.uid(),
      buildingId: buildingId,
      targetLevel: this.getBuildingLevel(buildingId),
      type: 'copy',
      cost: {},
      buildTime: buildTime,
      addedAt: Date.now()
    };
    for (var resType in cost) {
      if (cost.hasOwnProperty(resType) && cost[resType] > 0) {
        queueItem.cost[resType] = cost[resType];
      }
    }

    this._state.buildQueue.push(queueItem);
    EventBus.emit('town:queue_updated');
    this._processQueue();

    return { ok: true, queueItem: queueItem };
  },

  getUpgradeCost: function (buildingId) {
    var data = BuildingData[buildingId];
    if (!data) return null;
    var currentLevel = this.getBuildingLevel(buildingId);
    var targetLevel = currentLevel + 1;
    if (buildingId === 'town_hall' && currentLevel === 0) targetLevel = 2;
    return data.costFormula(targetLevel);
  },

  getBuildTime: function (buildingId) {
    var currentLevel = this.getBuildingLevel(buildingId);
    return BuildingData._getBuildTime(currentLevel + 1);
  },

  isBuilding: function (buildingId) {
    var b = this._state.buildings[buildingId];
    return b && b.buildEndTime !== null && Date.now() < b.buildEndTime;
  },

  getBuildingProgress: function (buildingId) {
    var b = this._state.buildings[buildingId];
    if (!b || !b.buildEndTime) return null;
    var now = Date.now();
    if (now >= b.buildEndTime) return 1;
    var buildTimeSec = this.getBuildTime(buildingId);
    var startTime = b.buildEndTime - buildTimeSec * 1000;
    var elapsed = now - startTime;
    return Math.min(1, Math.max(0, elapsed / (buildTimeSec * 1000)));
  },

  getRemainingBuildTime: function (buildingId) {
    var b = this._state.buildings[buildingId];
    if (!b || !b.buildEndTime) return 0;
    return Math.max(0, Math.ceil((b.buildEndTime - Date.now()) / 1000));
  },

  getActiveBuildCount: function () {
    var count = 0;
    for (var id in this._state.buildings) {
      if (this._state.buildings.hasOwnProperty(id) && this.isBuilding(id)) {
        count++;
      }
    }
    return count;
  },

  getWorkerCount: function () {
    return this._state.workers;
  },

  getBuildQueue: function () {
    return this._state.buildQueue.slice();
  },

  getMaxBuildSlots: function () {
    return this._state.workers;
  },

  canUpgrade: function (buildingId) {
    var data = BuildingData[buildingId];
    if (!data) return { ok: false, reason: '未知建筑' };

    var bState = this._state.buildings[buildingId];
    var currentLevel = bState ? bState.level : 0;

    // 检查建筑正在施工
    if (this.isBuilding(buildingId)) {
      return { ok: false, reason: '正在施工中' };
    }

    // 检查施工队列
    if (this.getActiveBuildCount() >= this.getMaxBuildSlots()) {
      return { ok: false, reason: '施工队列已满' };
    }

    // 检查等级上限（城主府控制）
    var thLevel = this.getBuildingLevel('town_hall');
    var thData = BuildingData._townHallUnlocks[thLevel];
    if (buildingId !== 'town_hall') {
      if (thData && currentLevel >= thData.levelCap) {
        return { ok: false, reason: '需升级城主府解锁更高等级' };
      }
    }

    // 检查最大等级
    if (currentLevel >= data.maxLevel) {
      return { ok: false, reason: '已达最大等级' };
    }

    // 检查城主府升级条件（通关要求）
    if (buildingId === 'town_hall') {
      var nextTH = BuildingData._townHallUnlocks[currentLevel + 1];
      if (nextTH && nextTH.unlockStage) {
        if (typeof BattleManager !== 'undefined' && !BattleManager.isStageCleared(nextTH.unlockStage)) {
          return { ok: false, reason: '需通关 ' + nextTH.unlockStage.replace('stage_', '').replace('_', '-') };
        }
      }
    }

    // 检查建筑前置依赖
    if (data.requires) {
      for (var reqId in data.requires) {
        if (data.requires.hasOwnProperty(reqId)) {
          var reqLevel = data.requires[reqId];
          if (this.getBuildingLevel(reqId) < reqLevel) {
            var reqData = BuildingData[reqId];
            return { ok: false, reason: '需要 ' + reqData.name + ' Lv.' + reqLevel };
          }
        }
      }
    }

    // 检查建筑槽解锁
    if (buildingId !== 'town_hall' && currentLevel === 0) {
      var unlockedCount = this._getUnlockedBuildingCount();
      if (thData && unlockedCount >= thData.slots) {
        return { ok: false, reason: '建筑槽不足，升级城主府解锁' };
      }
    }

    // 检查资源
    var cost = this.getUpgradeCost(buildingId);
    if (!ResourceManager.canAffordMultiple(cost)) {
      return { ok: false, reason: '资源不足' };
    }

    return { ok: true };
  },

  startUpgrade: function (buildingId) {
    // Check if building is already in build queue
    for (var qi = 0; qi < this._state.buildQueue.length; qi++) {
      if (this._state.buildQueue[qi].buildingId === buildingId) {
        return { ok: false, reason: '该建筑已在队列中' };
      }
    }

    var check = this.canUpgrade(buildingId);
    if (!check.ok) return check;

    var cost = this.getUpgradeCost(buildingId);
    var buildTime = this.getBuildTime(buildingId);

    ResourceManager.spendMultiple(cost, 'building', 'building_upgrade', buildingId);

    var b = this._state.buildings[buildingId];
    b.buildEndTime = Date.now() + buildTime * 1000;
    b.buildType = 'upgrade';

    EventBus.emit('town:building_started', { buildingId: buildingId, endTime: b.buildEndTime });
    return { ok: true };
  },

  speedUpBuild: function (buildingId) {
    var b = this._state.buildings[buildingId];
    if (!b || !b.buildEndTime) return false;

    var remainSec = this.getRemainingBuildTime(buildingId);
    var jadeCost = Math.ceil(remainSec / 60);
    if (jadeCost <= 0) return false;

    if (!ResourceManager.canAfford('jade', jadeCost)) return false;
    ResourceManager.spend('jade', jadeCost, 'building', 'speed_up', buildingId);
    b.buildEndTime = Date.now();
    return true;
  },

  _getUnlockedBuildingCount: function () {
    var count = 0;
    for (var id in this._state.buildings) {
      if (this._state.buildings.hasOwnProperty(id) && id !== 'town_hall') {
        if (this._state.buildings[id].level > 0 || this.isBuilding(id)) {
          count++;
        }
      }
    }
    return count;
  },

  // ---------- Worker & Queue System ----------

  _checkWorkerUnlock: function (buildingId, newLevel, silent) {
    var changed = false;
    // First building completion → 2 workers
    if (!this._state.firstBuildingCompleted && buildingId !== 'town_hall') {
      this._state.firstBuildingCompleted = true;
      if (this._state.workers < 2) {
        this._state.workers = 2;
        changed = true;
        EventBus.emit('town:worker_unlocked', { count: 2 });
        if (!silent) {
          EventBus.emit('toast:show', { type: 'success', message: '🎉 完成第一个建筑！获得额外工人！' });
        }
      }
    }
    // Town hall level unlocks
    if (buildingId === 'town_hall') {
      var unlocks = WORKER_CONFIG.WORKER_UNLOCKS;
      for (var i = 0; i < unlocks.length; i++) {
        if (unlocks[i].trigger === 'town_hall_level' && newLevel >= unlocks[i].requirement) {
          if (this._state.workers < unlocks[i].workerCount) {
            this._state.workers = unlocks[i].workerCount;
            changed = true;
            EventBus.emit('town:worker_unlocked', { count: this._state.workers });
            if (!silent) {
              EventBus.emit('toast:show', { type: 'success', message: '获得新工人！当前工人数：' + this._state.workers });
            }
          }
        }
      }
    }
    return changed;
  },

  _canEnqueue: function (buildingId) {
    var data = BuildingData[buildingId];
    if (!data) return { ok: false, reason: '未知建筑' };

    var bState = this._state.buildings[buildingId];
    var currentLevel = bState ? bState.level : 0;

    // Check: building is currently under construction
    if (this.isBuilding(buildingId)) {
      return { ok: false, reason: '正在施工中' };
    }

    // Check: building is already in queue
    for (var i = 0; i < this._state.buildQueue.length; i++) {
      if (this._state.buildQueue[i].buildingId === buildingId) {
        return { ok: false, reason: '该建筑已在队列中' };
      }
    }

    // Check max level
    if (currentLevel >= data.maxLevel) {
      return { ok: false, reason: '已达最大等级' };
    }

    // Check town hall level cap
    var thLevel = this.getBuildingLevel('town_hall');
    if (buildingId !== 'town_hall') {
      var thData = BuildingData._townHallUnlocks[thLevel];
      if (thData && currentLevel >= thData.levelCap) {
        return { ok: false, reason: '需升级城主府解锁更高等级' };
      }
    }

    // Check town hall upgrade prerequisite (stage clearing)
    if (buildingId === 'town_hall') {
      var nextTH = BuildingData._townHallUnlocks[currentLevel + 1];
      if (nextTH && nextTH.unlockStage) {
        if (typeof BattleManager !== 'undefined' && !BattleManager.isStageCleared(nextTH.unlockStage)) {
          return { ok: false, reason: '需通关 ' + nextTH.unlockStage.replace('stage_', '').replace('_', '-') };
        }
      }
    }

    // Check building prerequisites
    if (data.requires) {
      for (var reqId in data.requires) {
        if (data.requires.hasOwnProperty(reqId)) {
          var reqLevel = data.requires[reqId];
          if (this.getBuildingLevel(reqId) < reqLevel) {
            var reqData = BuildingData[reqId];
            return { ok: false, reason: '需要 ' + reqData.name + ' Lv.' + reqLevel };
          }
        }
      }
    }

    // Check building slot for new buildings
    if (buildingId !== 'town_hall' && currentLevel === 0) {
      var thData2 = BuildingData._townHallUnlocks[thLevel];
      var unlockedCount = this._getUnlockedBuildingCount();
      if (thData2 && unlockedCount >= thData2.slots) {
        return { ok: false, reason: '建筑槽不足，升级城主府解锁' };
      }
    }

    return { ok: true };
  },

  enqueueUpgrade: function (buildingId) {
    // Check queue capacity
    if (this._state.buildQueue.length >= WORKER_CONFIG.MAX_QUEUE_SIZE) {
      return { ok: false, reason: '建造队列已满（最多6项）' };
    }

    // Check enqueue prerequisites
    var check = this._canEnqueue(buildingId);
    if (!check.ok) return check;

    // Check resources
    var cost = this.getUpgradeCost(buildingId);
    if (!ResourceManager.canAffordMultiple(cost)) {
      return { ok: false, reason: '资源不足' };
    }

    // Reserve resources
    ResourceManager.spendMultiple(cost, 'building', 'queue_reserve', buildingId);

    // Create queue item
    var currentLevel = this.getBuildingLevel(buildingId);
    var targetLevel = currentLevel + 1;
    if (buildingId === 'town_hall' && currentLevel === 0) targetLevel = 2;
    var buildTime = this.getBuildTime(buildingId);
    var queueItem = {
      id: Utils.uid(),
      buildingId: buildingId,
      targetLevel: targetLevel,
      cost: {},
      buildTime: buildTime,
      addedAt: Date.now()
    };
    // Only include cost entries > 0
    for (var resType in cost) {
      if (cost.hasOwnProperty(resType) && cost[resType] > 0) {
        queueItem.cost[resType] = cost[resType];
      }
    }

    this._state.buildQueue.push(queueItem);
    EventBus.emit('town:queue_updated');

    // Try to start immediately if workers available
    this._processQueue();

    return { ok: true, queueItem: queueItem };
  },

  _processQueue: function () {
    var freeWorkers = this._state.workers - this.getActiveBuildCount() - this._getActiveTDBuildCount();
    var anyChanged = false;

    while (freeWorkers > 0 && this._state.buildQueue.length > 0) {
      var item = this._state.buildQueue[0];

      // Secondary validation
      if (!this._validateQueueItem(item)) {
        // Refund reserved resources
        ResourceManager.addMultiple(item.cost, 'building', 'queue_refund', item.buildingId);
        this._state.buildQueue.shift();
        var failData = BuildingData[item.buildingId];
        EventBus.emit('toast:show', { type: 'warning', message: '建造任务已失效：' + (failData ? failData.name : item.buildingId) });
        anyChanged = true;
        continue;
      }

      // Start construction
      var bState = this._state.buildings[item.buildingId];
      bState.buildEndTime = Date.now() + item.buildTime * 1000;
      bState.buildType = item.type === 'copy' ? 'copy' : 'upgrade';
      this._state.buildQueue.shift();
      freeWorkers--;
      anyChanged = true;
      EventBus.emit('town:building_started', { buildingId: item.buildingId, endTime: bState.buildEndTime });
    }

    if (anyChanged) {
      EventBus.emit('town:queue_updated');
    }
  },

  _validateQueueItem: function (item) {
    var b = this._state.buildings[item.buildingId];
    if (!b) return false;
    // Must not already be building
    if (b.buildEndTime) return false;

    if (item.type === 'copy') {
      // Validate copy build
      if (b.level <= 0) return false;
      var count = b.count || 1;
      var maxCount = BuildingData._getMaxCount(item.buildingId, b.level);
      if (count >= maxCount) return false;
    } else {
      // Validate upgrade
      // Level must match expected
      if (b.level !== item.targetLevel - 1) return false;
      // Town hall level cap
      var thLevel = this._state.buildings.town_hall ? this._state.buildings.town_hall.level : 1;
      if (item.buildingId !== 'town_hall') {
        var thData = BuildingData._townHallUnlocks[thLevel];
        if (thData && b.level >= thData.levelCap) return false;
      }
      // Prerequisites
      var data = BuildingData[item.buildingId];
      if (data && data.requires) {
        for (var reqId in data.requires) {
          if (data.requires.hasOwnProperty(reqId)) {
            var reqLv = this._state.buildings[reqId] ? this._state.buildings[reqId].level : 0;
            if (reqLv < data.requires[reqId]) return false;
          }
        }
      }
      // Building slot check for new buildings
      if (b.level === 0 && item.buildingId !== 'town_hall') {
        var thData2 = BuildingData._townHallUnlocks[thLevel];
        if (thData2 && this._getUnlockedBuildingCount() >= thData2.slots) return false;
      }
    }
    return true;
  },

  cancelQueueItem: function (queueItemId) {
    var idx = -1;
    for (var i = 0; i < this._state.buildQueue.length; i++) {
      if (this._state.buildQueue[i].id === queueItemId) {
        idx = i;
        break;
      }
    }
    if (idx === -1) return { ok: false, reason: '任务不存在' };

    var item = this._state.buildQueue.splice(idx, 1)[0];
    ResourceManager.addMultiple(item.cost, 'building', 'queue_refund', item.buildingId);
    EventBus.emit('town:queue_updated');
    return { ok: true, refunded: true };
  },

  cancelActiveBuilding: function (buildingId) {
    var b = this._state.buildings[buildingId];
    if (!b || !b.buildEndTime || Date.now() >= b.buildEndTime) {
      return { ok: false, reason: '该建筑未在施工' };
    }
    b.buildEndTime = null;
    EventBus.emit('town:building_cancelled', { buildingId: buildingId });
    this._processQueue();
    return { ok: true, refunded: false };
  },

  reorderQueue: function (queueItemId, newIndex) {
    var idx = -1;
    for (var i = 0; i < this._state.buildQueue.length; i++) {
      if (this._state.buildQueue[i].id === queueItemId) {
        idx = i;
        break;
      }
    }
    if (idx === -1) return false;

    // Clamp newIndex
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= this._state.buildQueue.length) newIndex = this._state.buildQueue.length - 1;

    var item = this._state.buildQueue.splice(idx, 1)[0];
    this._state.buildQueue.splice(newIndex, 0, item);
    EventBus.emit('town:queue_updated');
    return true;
  },

  _processOfflineBuilds: function () {
    var now = Date.now();
    var safety = 200;
    while (safety-- > 0) {
      // Find earliest expired build
      var earliestId = null;
      var earliestTime = Infinity;
      for (var id in this._state.buildings) {
        if (!this._state.buildings.hasOwnProperty(id)) continue;
        var b = this._state.buildings[id];
        if (b.buildEndTime && b.buildEndTime <= now) {
          if (b.buildEndTime < earliestTime) {
            earliestTime = b.buildEndTime;
            earliestId = id;
          }
        }
      }

      if (!earliestId) break;

      // Complete this build (silent — no toast for offline completions)
      var bld = this._state.buildings[earliestId];
      var completedAt = bld.buildEndTime;
      if (bld.buildType === 'copy') {
        bld.count++;
        bld.buildEndTime = null;
        bld.buildType = null;
      } else {
        bld.level++;
        if (bld.count < 1) bld.count = 1;
        bld.buildEndTime = null;
        bld.buildType = null;
        this._checkWorkerUnlock(earliestId, bld.level, true);
      }

      // Start queue items using freed worker
      var busy = 0;
      for (var cid in this._state.buildings) {
        if (this._state.buildings.hasOwnProperty(cid) && this._state.buildings[cid].buildEndTime) busy++;
      }
      var freeW = this._state.workers - busy;
      while (freeW > 0 && this._state.buildQueue.length > 0) {
        var qi = this._state.buildQueue[0];
        if (!this._validateQueueItem(qi)) {
          if (typeof ResourceManager !== 'undefined') {
            ResourceManager.addMultiple(qi.cost, 'building', 'queue_refund', qi.buildingId);
          }
          this._state.buildQueue.shift();
          continue;
        }
        var qb = this._state.buildings[qi.buildingId];
        qb.buildEndTime = completedAt + qi.buildTime * 1000;
        qb.buildType = qi.type === 'copy' ? 'copy' : 'upgrade';
        this._state.buildQueue.shift();
        freeW--;
      }
    }
    // Process offline TD builds
    if (this._state.tdBuildPending) {
      for (var otdi = this._state.tdBuildPending.length - 1; otdi >= 0; otdi--) {
        var otdItem = this._state.tdBuildPending[otdi];
        if (otdItem.buildEndTime && otdItem.buildEndTime <= now) {
          if (typeof TowerDefenseManager !== 'undefined') {
            TowerDefenseManager.buildTowerDirect(otdItem.tdType, otdItem.gridX, otdItem.gridY);
          }
          this._state.tdBuildPending.splice(otdi, 1);
        }
      }
    }
  },

  getAtkBonus: function () {
    var bonus = 0;
    var lv = this.getBuildingLevel('barracks');
    if (lv > 0) bonus += BuildingData.barracks.effects(lv).atkBonus * this.getCountMultiplier('barracks');
    // 武器工坊叠加
    var wwLv = this.getBuildingLevel('weapon_workshop');
    if (wwLv > 0) bonus += BuildingData.weapon_workshop.effects(wwLv).atkBonus * this.getCountMultiplier('weapon_workshop');
    return bonus;
  },

  getDefBonus: function () {
    var lv = this.getBuildingLevel('city_wall');
    if (lv <= 0) return 0;
    return BuildingData.city_wall.effects(lv).defBonus * this.getCountMultiplier('city_wall');
  },

  getHpBonus: function () {
    var lv = this.getBuildingLevel('city_wall');
    if (lv <= 0) return 0;
    return BuildingData.city_wall.effects(lv).hpBonus * this.getCountMultiplier('city_wall');
  },

  getExpBonus: function () {
    var bonus = 0;
    var lv = this.getBuildingLevel('training_ground');
    if (lv > 0) bonus += BuildingData.training_ground.effects(lv).expBonus * this.getCountMultiplier('training_ground');
    // 书院叠加
    var acLv = this.getBuildingLevel('academy');
    if (acLv > 0) bonus += BuildingData.academy.effects(acLv).expBonus * this.getCountMultiplier('academy');
    return bonus;
  },

  getOfflineEfficiency: function () {
    var lv = this.getBuildingLevel('adventure_guild');
    if (lv <= 0) return 0.50;
    // 离线效率有上限，副本不做倍率
    return BuildingData.adventure_guild.effects(lv).offlineEfficiency;
  },

  getRecruitDiscount: function () {
    var lv = this.getBuildingLevel('tavern');
    if (lv <= 0) return 0;
    return Math.min(0.5, BuildingData.tavern.effects(lv).recruitDiscount * this.getCountMultiplier('tavern'));
  },

  getDropRateBonus: function () {
    var lv = this.getBuildingLevel('adventure_guild');
    if (lv <= 0) return 0;
    return BuildingData.adventure_guild.effects(lv).dropRateBonus * this.getCountMultiplier('adventure_guild');
  },

  getSpdBonus: function () {
    var lv = this.getBuildingLevel('stable');
    if (lv <= 0) return 0;
    return BuildingData.stable.effects(lv).spdBonus * this.getCountMultiplier('stable');
  },

  getFirstStrikeChance: function () {
    var lv = this.getBuildingLevel('stable');
    if (lv <= 0) return 0;
    return Math.min(0.5, BuildingData.stable.effects(lv).firstStrikeChance * this.getCountMultiplier('stable'));
  },

  getEquipQualityBonus: function () {
    var lv = this.getBuildingLevel('weapon_workshop');
    if (lv <= 0) return 0;
    return BuildingData.weapon_workshop.effects(lv).equipQualityBonus * this.getCountMultiplier('weapon_workshop');
  },

  getSkillCooldownReduction: function () {
    var lv = this.getBuildingLevel('academy');
    if (lv <= 0) return 0;
    return Math.min(0.5, BuildingData.academy.effects(lv).skillCooldownReduction * this.getCountMultiplier('academy'));
  },

  getBoosterLevel: function (productionBuildingId) {
    var boosterMap = { lumber_camp: 'watermill', quarry: 'stone_mason', iron_mine: 'smelter' };
    var boosterId = boosterMap[productionBuildingId];
    if (!boosterId) return 0;
    return this.getBuildingLevel(boosterId);
  },

  getResourceCap: function (resourceType) {
    var baseCap = CONSTANTS.RESOURCE_BASE_CAP[resourceType];
    if (baseCap === undefined) return Infinity;

    // 仓库加成（副本线性叠加）
    var whLv = this.getBuildingLevel('warehouse');
    var whMul = this.getCountMultiplier('warehouse');
    var capBonus = whLv > 0 ? BuildingData.warehouse.effects(whLv).resourceCapBonus * whMul : 0;

    // 农田额外粮草上限（副本线性叠加）
    if (resourceType === 'food') {
      var flLv = this.getBuildingLevel('farmland');
      var flMul = this.getCountMultiplier('farmland');
      var foodExtra = flLv > 0 ? BuildingData.farmland.effects(flLv).foodCapBonus * flMul : 0;
      return baseCap + foodExtra + Math.floor(baseCap * capBonus);
    }

    return baseCap + Math.floor(baseCap * capBonus);
  },

  getProductionRate: function (resourceType) {
    var buildings = { wood: 'lumber_camp', stone: 'quarry', iron: 'iron_mine', gold: 'tax_office' };
    var bId = buildings[resourceType];
    if (!bId) return 0;
    var lv = this.getBuildingLevel(bId);
    if (lv <= 0) return 0;
    var baseRate = BuildingData[bId].production(lv).perMinute;

    // 应用副本数倍率（线性）
    var copyCount = this.getBuildingCount(bId);
    if (copyCount > 1) baseRate *= copyCount;

    // 应用加成器乘数
    var boosterMap = { lumber_camp: 'watermill', quarry: 'stone_mason', iron_mine: 'smelter' };
    var boosterId = boosterMap[bId];
    if (boosterId) {
      var boosterLv = this.getBuildingLevel(boosterId);
      if (boosterLv > 0) {
        var boostData = BuildingData[boosterId].boosts;
        var boosterCount = this.getBuildingCount(boosterId);
        baseRate *= (1 + boosterLv * boostData.bonusPerLevel * boosterCount);
      }
    }
    return baseRate;
  },

  // ---------- 集市交易 ----------

  canTrade: function (toResource) {
    var lv = this.getBuildingLevel('market');
    if (lv <= 0) return false;
    var fx = BuildingData.market.effects(lv);
    if (toResource === 'wood') return fx.canTradeWood;
    if (toResource === 'stone') return fx.canTradeStone;
    if (toResource === 'iron') return fx.canTradeIron;
    return false;
  },

  getTradeRate: function (toResource) {
    var lv = this.getBuildingLevel('market');
    if (lv <= 0) return Infinity;
    var fx = BuildingData.market.effects(lv);
    return fx.tradeRates[toResource] || Infinity;
  },

  executeTrade: function (toResource, amount) {
    if (!this.canTrade(toResource)) return false;
    var rate = this.getTradeRate(toResource);
    var goldCost = rate * amount;
    if (!ResourceManager.canAfford('gold', goldCost)) return false;

    ResourceManager.spend('gold', goldCost, 'trade', 'market_sell', toResource);
    ResourceManager.add(toResource, amount, 'trade', 'market_buy', toResource);

    EventBus.emit('town:trade', { from: 'gold', to: toResource, amount: amount });
    return true;
  },

  // ---------- 所有建筑列表（按类别） ----------

  getBuildingsByCategory: function () {
    var cats = { core: [], production: [], combat: [], functional: [] };
    for (var id in BuildingData) {
      if (!BuildingData.hasOwnProperty(id) || id.startsWith('_')) continue;
      var d = BuildingData[id];
      if (cats[d.category]) {
        cats[d.category].push(id);
      }
    }
    return cats;
  },

  // ---------- 道路系统 ----------

  /** 获取建筑入口点（底部中心外侧格） */
  _getBuildingEntrance: function (buildingId) {
    if (typeof TownWorld === 'undefined') return null;
    var placement = this._state.placements[buildingId] || TownWorld._defaultPositions[buildingId];
    if (!placement) return null;
    var size = TownWorld._buildingSizes[buildingId];
    if (!size) return null;

    var MAP_W = TownWorld.MAP_W;
    var MAP_H = TownWorld.MAP_H;

    // Try bottom center
    var egx = placement.gx + Math.floor(size.w / 2);
    var egy = placement.gy + size.h;
    if (egy < MAP_H && egx >= 0 && egx < MAP_W && !this._isBuildingAt(egx, egy, buildingId)) {
      return { gx: egx, gy: egy };
    }
    // Try right center
    egx = placement.gx + size.w;
    egy = placement.gy + Math.floor(size.h / 2);
    if (egx < MAP_W && egy >= 0 && egy < MAP_H && !this._isBuildingAt(egx, egy, buildingId)) {
      return { gx: egx, gy: egy };
    }
    // Try left center
    egx = placement.gx - 1;
    egy = placement.gy + Math.floor(size.h / 2);
    if (egx >= 0 && egy >= 0 && egy < MAP_H && !this._isBuildingAt(egx, egy, buildingId)) {
      return { gx: egx, gy: egy };
    }
    // Try top center
    egx = placement.gx + Math.floor(size.w / 2);
    egy = placement.gy - 1;
    if (egy >= 0 && egx >= 0 && egx < MAP_W && !this._isBuildingAt(egx, egy, buildingId)) {
      return { gx: egx, gy: egy };
    }
    return null; // All directions blocked
  },

  /** Check if a grid cell is occupied by any building other than excludeId */
  _isBuildingAt: function (gx, gy, excludeId) {
    if (typeof TownWorld === 'undefined') return false;
    var buildingIds = Object.keys(TownWorld._buildingSizes);
    for (var i = 0; i < buildingIds.length; i++) {
      var id = buildingIds[i];
      if (id === excludeId) continue;
      var b = this._state.buildings[id];
      if (!b || b.level <= 0) continue;
      var p = this._state.placements[id] || TownWorld._defaultPositions[id];
      var s = TownWorld._buildingSizes[id];
      if (!p || !s) continue;
      if (gx >= p.gx && gx < p.gx + s.w && gy >= p.gy && gy < p.gy + s.h) {
        return true;
      }
    }
    return false;
  },

  /** Check if a grid cell is occupied by any building */
  _isAnyBuildingAt: function (gx, gy) {
    return this._isBuildingAt(gx, gy, null);
  },

  /** Recalculate road network using MST */
  recalcRoads: function () {
    // 1. Collect entrance points for all built buildings
    var entrances = [];
    for (var id in this._state.buildings) {
      if (!this._state.buildings.hasOwnProperty(id)) continue;
      if (this._state.buildings[id].level <= 0) continue;
      var entrance = this._getBuildingEntrance(id);
      if (entrance) {
        entrances.push({ id: id, gx: entrance.gx, gy: entrance.gy });
      }
    }

    // 2. If < 2 buildings, no roads
    if (entrances.length < 2) {
      this._state.roads = [];
      EventBus.emit('town:roads_updated', { count: 0 });
      if (typeof TownWorld !== 'undefined' && TownWorld._buildRoadGrid) {
        TownWorld._buildRoadGrid();
      }
      return;
    }

    // 3. Compute MST using Prim's algorithm
    var n = entrances.length;
    var inMST = new Array(n);
    var minDist = new Array(n);
    var minEdge = new Array(n);
    for (var i = 0; i < n; i++) {
      inMST[i] = false;
      minDist[i] = Infinity;
      minEdge[i] = -1;
    }
    minDist[0] = 0;
    var mstEdges = [];

    for (var iter = 0; iter < n; iter++) {
      // Find minimum cost node not yet in MST
      var u = -1;
      for (var j = 0; j < n; j++) {
        if (!inMST[j] && (u === -1 || minDist[j] < minDist[u])) {
          u = j;
        }
      }
      inMST[u] = true;
      if (minEdge[u] !== -1) {
        mstEdges.push([minEdge[u], u]);
      }
      // Update distances
      for (var v = 0; v < n; v++) {
        if (inMST[v]) continue;
        var dist = Math.abs(entrances[u].gx - entrances[v].gx) + Math.abs(entrances[u].gy - entrances[v].gy);
        if (dist < minDist[v]) {
          minDist[v] = dist;
          minEdge[v] = u;
        }
      }
    }

    // 4. Lay L-shaped paths for each MST edge
    // Build a usage grid
    var MAP_W = typeof TownWorld !== 'undefined' ? TownWorld.MAP_W : 40;
    var MAP_H = typeof TownWorld !== 'undefined' ? TownWorld.MAP_H : 40;
    var usageGrid = [];
    for (var ry = 0; ry < MAP_H; ry++) {
      usageGrid[ry] = [];
      for (var rx = 0; rx < MAP_W; rx++) {
        usageGrid[ry][rx] = 0;
      }
    }

    var self = this;
    for (var e = 0; e < mstEdges.length; e++) {
      var a = entrances[mstEdges[e][0]];
      var b = entrances[mstEdges[e][1]];
      var path = self._layPath(a.gx, a.gy, b.gx, b.gy, usageGrid);
      for (var p = 0; p < path.length; p++) {
        usageGrid[path[p].gy][path[p].gx]++;
      }
    }

    // 5. Convert usage grid to roads array
    var roads = [];
    for (var yy = 0; yy < MAP_H; yy++) {
      for (var xx = 0; xx < MAP_W; xx++) {
        if (usageGrid[yy][xx] > 0) {
          roads.push({ gx: xx, gy: yy, usage: usageGrid[yy][xx] });
        }
      }
    }
    this._state.roads = roads;

    EventBus.emit('town:roads_updated', { count: roads.length });
    if (typeof TownWorld !== 'undefined' && TownWorld._buildRoadGrid) {
      TownWorld._buildRoadGrid();
    }
  },

  /** Lay an L-shaped Manhattan path between two points, prefer reusing existing road cells */
  _layPath: function (x1, y1, x2, y2, usageGrid) {
    // Try two L-shape variants: H-first and V-first
    var pathH = this._traceLPath(x1, y1, x2, y2, true);
    var pathV = this._traceLPath(x1, y1, x2, y2, false);

    // If either path is blocked by buildings, try BFS
    if (!pathH) pathH = [];
    if (!pathV) pathV = [];

    // Count reuse for each variant
    var reuseH = 0, reuseV = 0;
    for (var i = 0; i < pathH.length; i++) {
      if (usageGrid[pathH[i].gy][pathH[i].gx] > 0) reuseH++;
    }
    for (var j = 0; j < pathV.length; j++) {
      if (usageGrid[pathV[j].gy][pathV[j].gx] > 0) reuseV++;
    }

    // Choose variant with more reuse, or shorter if equal
    var chosen;
    if (pathH.length === 0 && pathV.length === 0) {
      // Both blocked — use BFS
      chosen = this._bfsPath(x1, y1, x2, y2);
    } else if (pathH.length === 0) {
      chosen = pathV;
    } else if (pathV.length === 0) {
      chosen = pathH;
    } else if (reuseH > reuseV) {
      chosen = pathH;
    } else if (reuseV > reuseH) {
      chosen = pathV;
    } else {
      chosen = pathH.length <= pathV.length ? pathH : pathV;
    }
    return chosen || [];
  },

  /** Trace an L-shaped path. hFirst=true means go horizontal first, then vertical. */
  _traceLPath: function (x1, y1, x2, y2, hFirst) {
    var path = [];
    var cx = x1, cy = y1;

    if (hFirst) {
      // Horizontal segment
      var dx = x2 > x1 ? 1 : -1;
      while (cx !== x2) {
        cx += dx;
        if (this._isAnyBuildingAt(cx, cy)) return null; // Blocked
        path.push({ gx: cx, gy: cy });
      }
      // Vertical segment
      var dy = y2 > y1 ? 1 : -1;
      while (cy !== y2) {
        cy += dy;
        if (this._isAnyBuildingAt(cx, cy)) return null; // Blocked
        path.push({ gx: cx, gy: cy });
      }
    } else {
      // Vertical segment
      var dy2 = y2 > y1 ? 1 : -1;
      while (cy !== y2) {
        cy += dy2;
        if (this._isAnyBuildingAt(cx, cy)) return null;
        path.push({ gx: cx, gy: cy });
      }
      // Horizontal segment
      var dx2 = x2 > x1 ? 1 : -1;
      while (cx !== x2) {
        cx += dx2;
        if (this._isAnyBuildingAt(cx, cy)) return null;
        path.push({ gx: cx, gy: cy });
      }
    }
    return path;
  },

  /** BFS shortest path between two points avoiding buildings, max 50 nodes */
  _bfsPath: function (x1, y1, x2, y2) {
    var MAP_W = typeof TownWorld !== 'undefined' ? TownWorld.MAP_W : 40;
    var MAP_H = typeof TownWorld !== 'undefined' ? TownWorld.MAP_H : 40;
    var key = function (gx, gy) { return gy * MAP_W + gx; };
    var queue = [{ gx: x1, gy: y1, path: [] }];
    var visited = {};
    visited[key(x1, y1)] = true;
    var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    var explored = 0;

    while (queue.length > 0 && explored < 50) {
      var cur = queue.shift();
      explored++;
      if (cur.gx === x2 && cur.gy === y2) {
        return cur.path;
      }
      for (var d = 0; d < dirs.length; d++) {
        var nx = cur.gx + dirs[d][0];
        var ny = cur.gy + dirs[d][1];
        if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
        var nk = key(nx, ny);
        if (visited[nk]) continue;
        if (this._isAnyBuildingAt(nx, ny)) continue;
        visited[nk] = true;
        var newPath = cur.path.slice();
        newPath.push({ gx: nx, gy: ny });
        if (nx === x2 && ny === y2) return newPath;
        queue.push({ gx: nx, gy: ny, path: newPath });
      }
    }
    return []; // No path found within limit
  },

  getCollisionGrid: function () {
    if (typeof TownWorld !== 'undefined' && TownWorld.getCollisionGrid) {
      return TownWorld.getCollisionGrid();
    }
    return null;
  },

  // ========== TD Building Integration ==========

  enqueueTDBuilding: function (typeId, gridX, gridY) {
    if (typeof TDTowerData === 'undefined') return { ok: false, reason: '塔防数据未加载' };
    var towerData = TDTowerData[typeId];
    if (!towerData) return { ok: false, reason: '未知的防御建筑类型' };

    // Check TD placement validity
    if (typeof TowerDefenseManager !== 'undefined') {
      var check = TowerDefenseManager.canBuildTower(typeId, gridX, gridY);
      if (!check.ok) return check;
    }

    // Check queue capacity
    if (this._state.buildQueue.length + (this._state.tdBuildPending ? this._state.tdBuildPending.length : 0) >= WORKER_CONFIG.MAX_QUEUE_SIZE) {
      return { ok: false, reason: '建造队列已满（最多6项）' };
    }

    // Check and spend resources
    if (typeof ResourceManager !== 'undefined') {
      if (!ResourceManager.canAffordMultiple(towerData.cost)) {
        return { ok: false, reason: '资源不足' };
      }
      ResourceManager.spendMultiple(towerData.cost, 'tower_defense', 'build_td', typeId);
    }

    // Build time based on tower cost
    var costTotal = (towerData.cost.gold || 0) + (towerData.cost.wood || 0) * 2 + (towerData.cost.stone || 0) * 2 + (towerData.cost.iron || 0) * 3;
    var buildTime = Math.max(5, Math.floor(costTotal / 10));

    var pendingItem = {
      id: Utils.uid(),
      tdType: typeId,
      gridX: gridX,
      gridY: gridY,
      cost: {},
      buildTime: buildTime,
      buildEndTime: null,
      addedAt: Date.now()
    };
    for (var resType in towerData.cost) {
      if (towerData.cost.hasOwnProperty(resType) && towerData.cost[resType] > 0) {
        pendingItem.cost[resType] = towerData.cost[resType];
      }
    }

    if (!this._state.tdBuildPending) this._state.tdBuildPending = [];
    this._state.tdBuildPending.push(pendingItem);

    this._processTDQueue();

    EventBus.emit('town:queue_updated');
    return { ok: true, pendingItem: pendingItem };
  },

  _processTDQueue: function () {
    if (!this._state.tdBuildPending) return;
    var freeWorkers = this._state.workers - this.getActiveBuildCount() - this._getActiveTDBuildCount();
    var now = Date.now();

    for (var i = 0; i < this._state.tdBuildPending.length; i++) {
      if (freeWorkers <= 0) break;
      var item = this._state.tdBuildPending[i];
      if (!item.buildEndTime) {
        item.buildEndTime = now + item.buildTime * 1000;
        freeWorkers--;
        EventBus.emit('town:building_started', { buildingId: 'td_' + item.tdType, endTime: item.buildEndTime });
      }
    }
  },

  _getActiveTDBuildCount: function () {
    if (!this._state.tdBuildPending) return 0;
    var count = 0;
    var now = Date.now();
    for (var i = 0; i < this._state.tdBuildPending.length; i++) {
      if (this._state.tdBuildPending[i].buildEndTime && this._state.tdBuildPending[i].buildEndTime > now) {
        count++;
      }
    }
    return count;
  },

  getTDBuildPending: function () {
    return (this._state.tdBuildPending || []).slice();
  },

  cancelTDBuild: function (pendingId) {
    if (!this._state.tdBuildPending) return false;
    for (var i = 0; i < this._state.tdBuildPending.length; i++) {
      if (this._state.tdBuildPending[i].id === pendingId) {
        var item = this._state.tdBuildPending.splice(i, 1)[0];
        if (typeof ResourceManager !== 'undefined') {
          ResourceManager.addMultiple(item.cost, 'tower_defense', 'td_build_refund', item.tdType);
        }
        EventBus.emit('town:queue_updated');
        return true;
      }
    }
    return false;
  },

  // ---------- 章节门禁检查 ----------

  /**
   * 检查是否满足指定章节的建筑门禁要求
   * @param {number} chapter - 章节号
   * @returns {{ ok: boolean, missing: Array<{id,name,emoji,current,required}> }}
   */
  checkChapterGate: function (chapter) {
    if (typeof ChapterGateData === 'undefined') return { ok: true, missing: [] };
    var gate = ChapterGateData[chapter];
    if (!gate) return { ok: true, missing: [] };

    var missing = [];
    for (var buildingId in gate) {
      if (!gate.hasOwnProperty(buildingId)) continue;
      var required = gate[buildingId];
      var current = this.getBuildingLevel(buildingId);
      if (current < required) {
        var data = BuildingData[buildingId];
        missing.push({
          id: buildingId,
          name: data ? data.name : buildingId,
          emoji: data ? data.emoji : '🏗',
          current: current,
          required: required
        });
      }
    }
    return { ok: missing.length === 0, missing: missing };
  },

  getState: function () {
    return Utils.deepClone(this._state);
  }
};
