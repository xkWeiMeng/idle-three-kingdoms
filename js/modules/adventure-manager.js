/**
 * 冒险管理器 — 区域选择、挂机模式、会话统计、离线结算
 */
var AdventureManager = {
  _state: {
    currentRegion: 'region_1',
    adventureMode: 'push',       // 'push' | 'idle'
    idleSession: null,
    sessionHistory: [],
    unlockedRegions: ['region_1']
  },

  init: function (saved) {
    var data = (saved && saved.adventure) ? saved.adventure : {};
    this._state = {
      currentRegion: data.currentRegion || 'region_1',
      adventureMode: data.adventureMode || 'push',
      idleSession: data.idleSession || null,
      sessionHistory: data.sessionHistory ? data.sessionHistory.slice() : [],
      unlockedRegions: data.unlockedRegions ? data.unlockedRegions.slice() : ['region_1']
    };
    // 检查新解锁的区域
    this._checkUnlocks();
  },

  onTick: function (dt) {
    // 挂机模式：每 tick 累计资源
    if (this._state.adventureMode === 'idle' && this._state.idleSession) {
      this._processIdleTick(dt);
    }
  },

  // ---------- 区域管理 ----------

  selectRegion: function (regionId) {
    if (this._state.unlockedRegions.indexOf(regionId) === -1) return false;
    this._state.currentRegion = regionId;
    EventBus.emit('adventure:region_changed', { regionId: regionId });
    return true;
  },

  getUnlockedRegions: function () {
    return this._state.unlockedRegions.slice();
  },

  getCurrentRegion: function () {
    return this._state.currentRegion;
  },

  getRegionData: function (regionId) {
    for (var i = 0; i < RegionData.length; i++) {
      if (RegionData[i].id === regionId) return RegionData[i];
    }
    return null;
  },

  // ---------- 模式切换 ----------

  setMode: function (mode) {
    if (mode !== 'push' && mode !== 'idle') return;
    var oldMode = this._state.adventureMode;
    this._state.adventureMode = mode;

    if (mode === 'idle' && oldMode !== 'idle') {
      this.startIdleSession();
    } else if (mode === 'push' && oldMode === 'idle') {
      this.endIdleSession();
    }
    EventBus.emit('adventure:mode_changed', { mode: mode });
  },

  getMode: function () {
    return this._state.adventureMode;
  },

  // ---------- 挂机会话 ----------

  startIdleSession: function () {
    this._state.idleSession = {
      sessionId: Utils.uid(),
      region: this._state.currentRegion,
      startTime: Date.now(),
      battles: 0,
      wins: 0,
      losses: 0,
      resources: { gold: 0, exp: 0, wood: 0, stone: 0, iron: 0, food: 0 },
      drops: [],
      _tickAccum: 0
    };
  },

  getIdleSession: function () {
    return this._state.idleSession;
  },

  endIdleSession: function () {
    var session = this._state.idleSession;
    if (!session) return null;

    session.endTime = Date.now();
    delete session._tickAccum;

    // 保留最近 10 条历史
    this._state.sessionHistory.push(Utils.deepClone(session));
    if (this._state.sessionHistory.length > 10) {
      this._state.sessionHistory.shift();
    }

    this._state.idleSession = null;
    return session;
  },

  _processIdleTick: function (dt) {
    var session = this._state.idleSession;
    if (!session) return;

    // 每 5 秒结算一场战斗
    session._tickAccum = (session._tickAccum || 0) + dt;
    while (session._tickAccum >= 5) {
      session._tickAccum -= 5;
      this._processIdleBattle(session);
    }

    // 定期发送更新事件（每 10 场）
    if (session.battles > 0 && session.battles % 10 === 0) {
      EventBus.emit('adventure:session_update', { session: this._getSessionSummary() });
    }
  },

  _processIdleBattle: function (session) {
    var region = this.getRegionData(session.region);
    if (!region) return;

    // 找到该区域已通关的最高关卡
    var stageId = this._getBestIdleStage(region.chapter);
    if (!stageId) return;

    var stage = null;
    for (var i = 0; i < StageData.length; i++) {
      if (StageData[i].id === stageId) { stage = StageData[i]; break; }
    }
    if (!stage) return;

    // 检查粮草消耗
    if (stage.foodCost > 0 && !ResourceManager.canAfford('food', stage.foodCost)) {
      return; // 粮草不足，跳过
    }
    if (stage.foodCost > 0) {
      ResourceManager.spend('food', stage.foodCost, 'battle', 'food_cost', stageId);
    }

    session.battles++;

    // 挂机模式假设 95% 胜率（简化计算）
    var win = Math.random() < 0.95;
    if (win) {
      session.wins++;
      var mult = region.resourceMultipliers;
      var expBonus = 1 + (typeof TownManager !== 'undefined' ? TownManager.getExpBonus() : 0);

      var rewards = {
        gold: Math.floor((stage.rewards.gold || 0) * (mult.gold || 1)),
        exp:  Math.floor((stage.rewards.exp || 0) * (mult.exp || 1) * expBonus),
        wood: Math.floor((stage.rewards.wood || 0) * (mult.wood || 1)),
        stone: Math.floor((stage.rewards.stone || 0) * (mult.stone || 1)),
        iron: Math.floor((stage.rewards.iron || 0) * (mult.iron || 1))
      };

      // 发放奖励
      for (var res in rewards) {
        if (rewards[res] > 0) {
          ResourceManager.add(res, rewards[res], 'battle', 'stage_reward', stageId);
          session.resources[res] = (session.resources[res] || 0) + rewards[res];
        }
      }

      // 装备掉落
      var dropBonus = typeof TownManager !== 'undefined' ? TownManager.getDropRateBonus() : 0;
      var dropRate = (stage.rewards.equipDropRate || 0) * (1 + dropBonus) * (region.equipDropMultiplier || 1);
      if (Math.random() < dropRate) {
        if (typeof EquipmentManager !== 'undefined' && typeof EquipmentManager.generateDrop === 'function') {
          var equip = EquipmentManager.generateDrop(stage.chapter, stage.rewards.equipQualityWeights);
          if (equip) session.drops.push({ quality: equip.quality, type: equip.type });
        }
      }
    } else {
      session.losses++;
    }
  },

  _getBestIdleStage: function (chapter) {
    if (typeof BattleManager === 'undefined') return null;
    var cleared = BattleManager.getClearedStages();
    var best = null;
    for (var i = 0; i < cleared.length; i++) {
      var sId = cleared[i];
      // 匹配 stage_{chapter}_X
      if (sId.indexOf('stage_' + chapter + '_') === 0) {
        if (!best || sId > best) best = sId;
      }
    }
    return best;
  },

  _getSessionSummary: function () {
    var s = this._state.idleSession;
    if (!s) return null;
    return {
      sessionId: s.sessionId,
      region: s.region,
      startTime: s.startTime,
      battles: s.battles,
      wins: s.wins,
      losses: s.losses,
      resources: Utils.deepClone(s.resources),
      drops: s.drops.length,
      duration: Math.floor((Date.now() - s.startTime) / 1000)
    };
  },

  // ---------- 解锁检查 ----------

  _checkUnlocks: function () {
    if (typeof BattleManager === 'undefined') return;
    for (var i = 0; i < RegionData.length; i++) {
      var r = RegionData[i];
      if (this._state.unlockedRegions.indexOf(r.id) !== -1) continue;
      if (!r.unlockCondition || BattleManager.isStageCleared(r.unlockCondition)) {
        this._state.unlockedRegions.push(r.id);
      }
    }
  },

  // ---------- 推荐区域 ----------

  getRecommendedRegion: function () {
    var unlocked = this.getUnlockedRegions();
    if (unlocked.length <= 1) return unlocked[0] || 'region_1';

    // 分析资源需求：找下一个最想升级的建筑，看缺哪些资源
    var needs = this._analyzeResourceNeeds();
    var bestRegion = null;
    var bestScore = -1;

    for (var i = 0; i < unlocked.length; i++) {
      var rd = this.getRegionData(unlocked[i]);
      if (!rd) continue;
      var score = 0;
      for (var res in needs) {
        if (needs.hasOwnProperty(res) && rd.resourceMultipliers[res]) {
          score += needs[res] * rd.resourceMultipliers[res];
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestRegion = unlocked[i];
      }
    }
    return bestRegion || 'region_1';
  },

  _analyzeResourceNeeds: function () {
    var needs = { gold: 0.5, wood: 0.3, stone: 0.3, iron: 0.3, exp: 0.2 };
    if (typeof TownManager === 'undefined') return needs;

    // 遍历可升级建筑，找最便宜的
    var cheapest = null;
    var cheapestGold = Infinity;
    for (var id in BuildingData) {
      if (!BuildingData.hasOwnProperty(id) || id.startsWith('_')) continue;
      var check = TownManager.canUpgrade(id);
      if (check.ok || check.reason === '资源不足') {
        var cost = TownManager.getUpgradeCost(id);
        if (cost && cost.gold < cheapestGold) {
          cheapestGold = cost.gold;
          cheapest = cost;
        }
      }
    }

    if (cheapest) {
      var total = 0;
      for (var r in cheapest) {
        if (cheapest.hasOwnProperty(r)) total += cheapest[r];
      }
      if (total > 0) {
        for (var rt in cheapest) {
          if (cheapest.hasOwnProperty(rt)) {
            var have = ResourceManager.get(rt);
            var need = cheapest[rt];
            if (need > 0) {
              needs[rt] = Math.max(0, (need - have) / need);
            }
          }
        }
      }
    }
    return needs;
  },

  // ---------- 离线结算 ----------

  calculateOfflineRewards: function (lastSaveTime) {
    var offlineSec = Math.min((Date.now() - lastSaveTime) / 1000, 86400);
    if (offlineSec < 60) return null;

    var battleInterval = 5;
    var battles = Math.floor(offlineSec / battleInterval);
    var efficiency = typeof TownManager !== 'undefined' ? TownManager.getOfflineEfficiency() : 0.50;

    var region = this.getRegionData(this._state.currentRegion);
    if (!region) return null;

    var stageId = this._getBestIdleStage(region.chapter);
    if (!stageId) {
      // 没有该区域的通关记录，用区域1
      stageId = this._getBestIdleStage(1) || 'stage_1_1';
    }

    var stage = null;
    for (var i = 0; i < StageData.length; i++) {
      if (StageData[i].id === stageId) { stage = StageData[i]; break; }
    }
    if (!stage) return null;

    var mult = region ? region.resourceMultipliers : {};

    return {
      gold:  Math.floor((stage.rewards.gold || 0) * battles * efficiency * (mult.gold || 1)),
      exp:   Math.floor((stage.rewards.exp || 0) * battles * efficiency * (mult.exp || 1)),
      wood:  Math.floor((stage.rewards.wood || 0) * battles * efficiency * (mult.wood || 1)),
      stone: Math.floor((stage.rewards.stone || 0) * battles * efficiency * (mult.stone || 1)),
      iron:  Math.floor((stage.rewards.iron || 0) * battles * efficiency * (mult.iron || 1)),
      battles: battles,
      offlineSec: offlineSec,
      efficiency: efficiency,
      region: region ? region.name : ''
    };
  },

  getState: function () {
    var s = Utils.deepClone(this._state);
    // 清理内部累加器
    if (s.idleSession) delete s.idleSession._tickAccum;
    return s;
  }
};
