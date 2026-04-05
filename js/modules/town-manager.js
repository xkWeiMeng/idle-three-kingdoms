/**
 * 城镇管理器 — 建筑升级、资源产出、战斗加成、集市交易
 */
var TownManager = {
  _state: {
    buildings: {
      town_hall:        { level: 1, buildEndTime: null },
      lumber_camp:      { level: 0, buildEndTime: null },
      quarry:           { level: 0, buildEndTime: null },
      iron_mine:        { level: 0, buildEndTime: null },
      farmland:         { level: 0, buildEndTime: null },
      barracks:         { level: 0, buildEndTime: null },
      training_ground:  { level: 0, buildEndTime: null },
      blacksmith:       { level: 0, buildEndTime: null },
      city_wall:        { level: 0, buildEndTime: null },
      adventure_guild:  { level: 0, buildEndTime: null },
      tavern:           { level: 0, buildEndTime: null },
      warehouse:        { level: 0, buildEndTime: null },
      market:           { level: 0, buildEndTime: null },
      tax_office:       { level: 0, buildEndTime: null },
      weapon_workshop:  { level: 0, buildEndTime: null },
      stable:           { level: 0, buildEndTime: null },
      academy:          { level: 0, buildEndTime: null },
      watermill:        { level: 0, buildEndTime: null },
      stone_mason:      { level: 0, buildEndTime: null },
      smelter:          { level: 0, buildEndTime: null },
      vegetable_garden: { level: 0, buildEndTime: null },
      compost_pit:      { level: 0, buildEndTime: null },
      seed_shop:        { level: 0, buildEndTime: null },
      parking_lot:      { level: 0, buildEndTime: null }
    },
    placements: {}
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
          this._state.buildings[id] = data.buildings[id]
            ? { level: data.buildings[id].level || 0, buildEndTime: data.buildings[id].buildEndTime || null }
            : Utils.deepClone(defaults[id]);
        }
      }
    } else {
      this._state.buildings = this._getDefaultBuildings();
    }
    this._state.placements = (data && data.placements) ? data.placements : {};
    this._productionAccum = { wood: 0, stone: 0, iron: 0, gold: 0 };
  },

  _getDefaultBuildings: function () {
    return {
      town_hall:        { level: 1, buildEndTime: null },
      lumber_camp:      { level: 0, buildEndTime: null },
      quarry:           { level: 0, buildEndTime: null },
      iron_mine:        { level: 0, buildEndTime: null },
      farmland:         { level: 0, buildEndTime: null },
      barracks:         { level: 0, buildEndTime: null },
      training_ground:  { level: 0, buildEndTime: null },
      blacksmith:       { level: 0, buildEndTime: null },
      city_wall:        { level: 0, buildEndTime: null },
      adventure_guild:  { level: 0, buildEndTime: null },
      tavern:           { level: 0, buildEndTime: null },
      warehouse:        { level: 0, buildEndTime: null },
      market:           { level: 0, buildEndTime: null },
      tax_office:       { level: 0, buildEndTime: null },
      weapon_workshop:  { level: 0, buildEndTime: null },
      stable:           { level: 0, buildEndTime: null },
      academy:          { level: 0, buildEndTime: null },
      watermill:        { level: 0, buildEndTime: null },
      stone_mason:      { level: 0, buildEndTime: null },
      smelter:          { level: 0, buildEndTime: null },
      vegetable_garden: { level: 0, buildEndTime: null },
      compost_pit:      { level: 0, buildEndTime: null },
      seed_shop:        { level: 0, buildEndTime: null },
      parking_lot:      { level: 0, buildEndTime: null }
    };
  },

  // ---------- Tick ----------

  onTick: function (dt) {
    var now = Date.now();

    // 1. 检查施工完成
    for (var id in this._state.buildings) {
      if (!this._state.buildings.hasOwnProperty(id)) continue;
      var b = this._state.buildings[id];
      if (b.buildEndTime && now >= b.buildEndTime) {
        b.level++;
        b.buildEndTime = null;
        EventBus.emit('town:building_upgraded', { buildingId: id, newLevel: b.level });
        EventBus.emit('toast:show', {
          type: 'success',
          message: BuildingData[id].emoji + ' ' + BuildingData[id].name + ' 升级到 Lv.' + b.level + '！'
        });
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

      // 应用加成器乘数
      var boosterId = boosterMap[bId];
      if (boosterId) {
        var boosterLv = this._state.buildings[boosterId] ? this._state.buildings[boosterId].level : 0;
        if (boosterLv > 0) {
          var boostData = BuildingData[boosterId].boosts;
          perSecond *= (1 + boosterLv * boostData.bonusPerLevel);
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

  getMaxBuildSlots: function () {
    // 城主府 lv5 解锁第 2 队列
    return this.getBuildingLevel('town_hall') >= 5 ? 2 : 1;
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
    var check = this.canUpgrade(buildingId);
    if (!check.ok) return check;

    var cost = this.getUpgradeCost(buildingId);
    var buildTime = this.getBuildTime(buildingId);

    ResourceManager.spendMultiple(cost, 'building', 'building_upgrade', buildingId);

    var b = this._state.buildings[buildingId];
    b.buildEndTime = Date.now() + buildTime * 1000;

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

  // ---------- 加成查询 ----------

  getAtkBonus: function () {
    var bonus = 0;
    var lv = this.getBuildingLevel('barracks');
    if (lv > 0) bonus += BuildingData.barracks.effects(lv).atkBonus;
    // 武器工坊叠加
    var wwLv = this.getBuildingLevel('weapon_workshop');
    if (wwLv > 0) bonus += BuildingData.weapon_workshop.effects(wwLv).atkBonus;
    return bonus;
  },

  getDefBonus: function () {
    var lv = this.getBuildingLevel('city_wall');
    if (lv <= 0) return 0;
    return BuildingData.city_wall.effects(lv).defBonus;
  },

  getHpBonus: function () {
    var lv = this.getBuildingLevel('city_wall');
    if (lv <= 0) return 0;
    return BuildingData.city_wall.effects(lv).hpBonus;
  },

  getExpBonus: function () {
    var bonus = 0;
    var lv = this.getBuildingLevel('training_ground');
    if (lv > 0) bonus += BuildingData.training_ground.effects(lv).expBonus;
    // 书院叠加
    var acLv = this.getBuildingLevel('academy');
    if (acLv > 0) bonus += BuildingData.academy.effects(acLv).expBonus;
    return bonus;
  },

  getOfflineEfficiency: function () {
    var lv = this.getBuildingLevel('adventure_guild');
    if (lv <= 0) return 0.50;
    return BuildingData.adventure_guild.effects(lv).offlineEfficiency;
  },

  getRecruitDiscount: function () {
    var lv = this.getBuildingLevel('tavern');
    if (lv <= 0) return 0;
    return BuildingData.tavern.effects(lv).recruitDiscount;
  },

  getDropRateBonus: function () {
    var lv = this.getBuildingLevel('adventure_guild');
    if (lv <= 0) return 0;
    return BuildingData.adventure_guild.effects(lv).dropRateBonus;
  },

  getSpdBonus: function () {
    var lv = this.getBuildingLevel('stable');
    if (lv <= 0) return 0;
    return BuildingData.stable.effects(lv).spdBonus;
  },

  getFirstStrikeChance: function () {
    var lv = this.getBuildingLevel('stable');
    if (lv <= 0) return 0;
    return BuildingData.stable.effects(lv).firstStrikeChance;
  },

  getEquipQualityBonus: function () {
    var lv = this.getBuildingLevel('weapon_workshop');
    if (lv <= 0) return 0;
    return BuildingData.weapon_workshop.effects(lv).equipQualityBonus;
  },

  getSkillCooldownReduction: function () {
    var lv = this.getBuildingLevel('academy');
    if (lv <= 0) return 0;
    return BuildingData.academy.effects(lv).skillCooldownReduction;
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

    // 仓库加成
    var whLv = this.getBuildingLevel('warehouse');
    var capBonus = whLv > 0 ? BuildingData.warehouse.effects(whLv).resourceCapBonus : 0;

    // 农田额外粮草上限
    if (resourceType === 'food') {
      var flLv = this.getBuildingLevel('farmland');
      var foodExtra = flLv > 0 ? BuildingData.farmland.effects(flLv).foodCapBonus : 0;
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

    // 应用加成器乘数
    var boosterMap = { lumber_camp: 'watermill', quarry: 'stone_mason', iron_mine: 'smelter' };
    var boosterId = boosterMap[bId];
    if (boosterId) {
      var boosterLv = this.getBuildingLevel(boosterId);
      if (boosterLv > 0) {
        var boostData = BuildingData[boosterId].boosts;
        baseRate *= (1 + boosterLv * boostData.bonusPerLevel);
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

  getState: function () {
    return Utils.deepClone(this._state);
  }
};
