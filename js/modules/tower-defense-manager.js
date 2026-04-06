/**
 * 城防塔防管理器 — TowerDefenseManager
 * 
 * 规范引用：specs/product-specs/tower-defense-system.md (Active v0.3.0)
 * 执行计划：specs/exec-plans/tower-defense-system.md T4-T12
 */
var TowerDefenseManager = {

  // ========== 持久化状态 ==========
  _state: null,

  // ========== 运行时状态（非持久化） ==========
  _inDefenseMode: false,
  _battle: null,
  _towerRuntime: {},   // uid -> { currentTarget, lastAttackTime, kills }
  _heroSkillTimers: {}, // heroUid -> elapsed seconds since last skill
  _unlockListenersRegistered: false,
  _stageCleared: {},   // stageId -> true, tracked from battle:ended

  // ========== T4: 初始化 + 解锁检测 ==========

  _defaultState: function () {
    return {
      unlocked: false,
      era: 1,
      research: {
        era_2: { completed: false, startTime: null },
        era_3: { completed: false, startTime: null },
        era_4: { completed: false, startTime: null }
      },
      towers: [],
      wave: { current: 1, highest: 0, townHallHp: 0, townHallMaxHp: 0 },
      assignedHeroes: [],
      stats: { totalWavesCleared: 0, totalKills: 0, totalGoldEarned: 0 },
      tutorialSeen: false
    };
  },

  init: function (saved) {
    var data = (saved && saved.towerDefense) ? saved.towerDefense : null;
    if (data) {
      this._state = {
        unlocked: !!data.unlocked,
        era: data.era || 1,
        research: data.research || {
          era_2: { completed: false, startTime: null },
          era_3: { completed: false, startTime: null },
          era_4: { completed: false, startTime: null }
        },
        towers: data.towers || [],
        wave: data.wave || { current: 1, highest: 0, townHallHp: 0, townHallMaxHp: 0 },
        assignedHeroes: data.assignedHeroes || [],
        stats: data.stats || { totalWavesCleared: 0, totalKills: 0, totalGoldEarned: 0 },
        tutorialSeen: !!data.tutorialSeen
      };
      // §11.2: 存档恢复 — 补全 research 字段
      if (!this._state.research.era_2) this._state.research.era_2 = { completed: false, startTime: null };
      if (!this._state.research.era_3) this._state.research.era_3 = { completed: false, startTime: null };
      if (!this._state.research.era_4) this._state.research.era_4 = { completed: false, startTime: null };
    } else {
      this._state = this._defaultState();
    }

    // 初始化战斗运行时
    this._battle = this._defaultBattle();
    this._inDefenseMode = false;
    this._towerRuntime = {};
    this._heroSkillTimers = {};

    // 初始化城主府 HP
    this._initTownHallHp();

    // 离线科技研究补偿
    this._checkOfflineResearch();

    // 注册解锁事件监听（只注册一次）
    if (!this._unlockListenersRegistered) {
      var self = this;
      EventBus.on('battle:ended', function (data) {
        if (data && data.result === 'victory' && data.stageId) {
          self._stageCleared[data.stageId] = true;
        }
        self._checkUnlock();
      });
      EventBus.on('town:building_upgraded', function () {
        self._checkUnlock();
      });
      this._unlockListenersRegistered = true;
    }

    // 初始化时检查解锁条件（存档恢复 or 已满足条件）
    if (!this._state.unlocked) {
      this._checkUnlock();
    }
  },

  getState: function () {
    return Utils.deepClone(this._state);
  },

  isUnlocked: function () {
    return this._state.unlocked;
  },

  // §3.1: 解锁条件 — 通关 stage_2_10 AND 城主府 >= 3
  _checkUnlock: function () {
    if (this._state.unlocked) return;

    // 检查关卡进度：stage_2_10 通关
    var stageCleared = this._stageCleared['stage_2_10'];
    // 也检查 ResourceManager 统计的最高关卡
    if (!stageCleared && typeof ResourceManager !== 'undefined' && ResourceManager.getStats) {
      var stats = ResourceManager.getStats();
      if (stats.highestStage) {
        var highest = stats.highestStage;
        // 解析 stage_X_Y 格式，判断是否 >= stage_2_10
        var parts = highest.split('_');
        if (parts.length === 3) {
          var chapter = parseInt(parts[1], 10);
          var stage = parseInt(parts[2], 10);
          if (chapter > 2 || (chapter === 2 && stage >= 10)) {
            stageCleared = true;
          }
        }
      }
    }

    // 检查城主府等级
    var townHallLevel = 0;
    if (typeof TownManager !== 'undefined' && TownManager.getBuildingLevel) {
      townHallLevel = TownManager.getBuildingLevel('town_hall');
    }

    if (stageCleared && townHallLevel >= 3) {
      this._state.unlocked = true;
      this._initTownHallHp();
      EventBus.emit('td:unlocked');
      EventBus.emit('toast:show', { type: 'success', message: '城防系统已解锁！' });
    }
  },

  // CAP-TD-01: 进入/退出防守模式
  enterDefenseMode: function () {
    if (!this._state.unlocked) return false;
    this._inDefenseMode = true;
    this._initTownHallHp();
    return true;
  },

  exitDefenseMode: function () {
    if (this._battle && this._battle.active) {
      // 有活跃波次 — 返回需确认标志
      return { needConfirm: true };
    }
    this._inDefenseMode = false;
    this._stopBattleLoop();
    return { needConfirm: false };
  },

  forceExitDefenseMode: function () {
    this._inDefenseMode = false;
    this._stopBattleLoop();
    // 清除战斗状态
    this._battle = this._defaultBattle();
  },

  isInDefenseMode: function () {
    return this._inDefenseMode;
  },

  // ========== T5: 塔 CRUD ==========

  getMaxTowers: function () {
    var townHallLevel = 0;
    if (typeof TownManager !== 'undefined' && TownManager.getBuildingLevel) {
      townHallLevel = TownManager.getBuildingLevel('town_hall');
    }
    return 8 + townHallLevel * 3;
  },

  canBuildTower: function (typeId, gridX, gridY) {
    // 检查是否解锁
    if (!this._state.unlocked) return { ok: false, reason: '城防系统未解锁' };

    // 检查塔类型是否存在
    var towerData = TDTowerData[typeId];
    if (!towerData) return { ok: false, reason: '未知的塔类型' };

    // 检查科技时代
    if (towerData.era > this._state.era) return { ok: false, reason: '需要先研究 ' + TDTechTree[towerData.era].name + ' 科技' };

    // 检查容量
    if (this._state.towers.length >= this.getMaxTowers()) {
      return { ok: false, reason: '防御塔已达上限 (' + this.getMaxTowers() + ')' };
    }

    // 检查资源
    if (typeof ResourceManager !== 'undefined' && !ResourceManager.canAffordMultiple(towerData.cost)) {
      return { ok: false, reason: '资源不足' };
    }

    // 检查网格位置是否被占用
    var grid = this._getCollisionGrid();
    if (grid && grid[gridY] && grid[gridY][gridX] !== 0) {
      return { ok: false, reason: '无法放置：该位置已占用' };
    }

    // 检查是否已有塔占用该位置
    for (var i = 0; i < this._state.towers.length; i++) {
      var t = this._state.towers[i];
      if (t.gridX === gridX && t.gridY === gridY) {
        return { ok: false, reason: '无法放置：该位置已占用' };
      }
    }

    // 封路检测 — 只对墙体/非空中目标的建筑做检测
    var target = this._getTownHallGridPos();
    var spawnPoints = this._getSpawnPoints();
    if (target && spawnPoints.length > 0) {
      // 在当前碰撞网格中先加入已有塔
      var testGrid = this._getFullCollisionGrid();
      if (testGrid) {
        var canPass = Pathfinding.checkPathExists(testGrid, gridX, gridY, spawnPoints, target);
        if (!canPass) {
          return { ok: false, reason: '无法放置：不能完全封锁敌人路径' };
        }
      }
    }

    return { ok: true, reason: null };
  },

  buildTower: function (typeId, gridX, gridY) {
    var check = this.canBuildTower(typeId, gridX, gridY);
    if (!check.ok) return check;

    var towerData = TDTowerData[typeId];

    // 扣资源
    if (typeof ResourceManager !== 'undefined') {
      ResourceManager.spendMultiple(towerData.cost, 'tower_defense', 'build_tower', typeId);
    }

    // 创建塔实例
    var tower = {
      uid: Utils.uid(),
      type: typeId,
      level: 1,
      gridX: gridX,
      gridY: gridY
    };
    this._state.towers.push(tower);

    // 初始化运行时状态
    this._towerRuntime[tower.uid] = {
      currentTarget: null,
      lastAttackTime: 0,
      kills: 0
    };

    EventBus.emit('td:tower_built', { tower: { uid: tower.uid, type: typeId, gridX: gridX, gridY: gridY } });

    // 战斗中重算路径
    if (this._battle && this._battle.active) {
      this._recalcPaths();
    }

    return { ok: true, tower: tower };
  },

  canUpgradeTower: function (towerUid) {
    var tower = this._findTower(towerUid);
    if (!tower) return { ok: false, reason: '塔不存在' };
    if (tower.level >= TD_CONSTANTS.MAX_TOWER_LEVEL) return { ok: false, reason: '已满级' };

    var nextLevel = tower.level + 1;
    var upgradeCost = this.getUpgradeCost(towerUid);
    if (!upgradeCost) return { ok: false, reason: '无法计算升级费用' };

    if (typeof ResourceManager !== 'undefined' && !ResourceManager.canAffordMultiple(upgradeCost)) {
      return { ok: false, reason: '资源不足' };
    }

    return { ok: true };
  },

  upgradeTower: function (towerUid) {
    var check = this.canUpgradeTower(towerUid);
    if (!check.ok) return check;

    var tower = this._findTower(towerUid);
    var upgradeCost = this.getUpgradeCost(towerUid);

    if (typeof ResourceManager !== 'undefined') {
      ResourceManager.spendMultiple(upgradeCost, 'tower_defense', 'upgrade_tower', tower.type);
    }

    tower.level++;

    EventBus.emit('td:tower_upgraded', { uid: towerUid, type: tower.type, newLevel: tower.level });

    return { ok: true, newLevel: tower.level };
  },

  sellTower: function (towerUid) {
    var tower = this._findTower(towerUid);
    if (!tower) return { ok: false, reason: '塔不存在' };

    // 计算返还率
    var rate = (this._battle && this._battle.active) ? TD_CONSTANTS.SELL_RATE_ACTIVE : TD_CONSTANTS.SELL_RATE_IDLE;
    var towerData = TDTowerData[tower.type];
    if (!towerData) return { ok: false, reason: '塔数据不存在' };

    // 计算总投入 = 建造费 + 所有升级费用
    var totalCost = {};
    for (var res in towerData.cost) {
      if (towerData.cost.hasOwnProperty(res)) {
        totalCost[res] = towerData.cost[res];
      }
    }
    for (var lv = 2; lv <= tower.level; lv++) {
      var mul = TD_UPGRADE_TABLE[lv].costMul;
      for (var r in towerData.cost) {
        if (towerData.cost.hasOwnProperty(r)) {
          totalCost[r] = (totalCost[r] || 0) + Math.floor(towerData.cost[r] * mul);
        }
      }
    }

    // 返还
    var refund = {};
    for (var rr in totalCost) {
      if (totalCost.hasOwnProperty(rr)) {
        refund[rr] = Math.floor(totalCost[rr] * rate);
      }
    }

    // 返还资源
    if (typeof ResourceManager !== 'undefined') {
      for (var rt in refund) {
        if (refund.hasOwnProperty(rt) && refund[rt] > 0) {
          ResourceManager.add(rt, refund[rt], 'tower_defense', 'sell_tower', tower.type);
        }
      }
    }

    // 移除塔
    this._state.towers = this._state.towers.filter(function (t) { return t.uid !== towerUid; });
    delete this._towerRuntime[towerUid];

    EventBus.emit('td:tower_sold', { uid: towerUid, refund: refund });

    // 战斗中重算路径
    if (this._battle && this._battle.active) {
      this._recalcPaths();
    }

    return { ok: true, refund: refund };
  },

  getUpgradeCost: function (towerUid) {
    var tower = this._findTower(towerUid);
    if (!tower || tower.level >= TD_CONSTANTS.MAX_TOWER_LEVEL) return null;

    var towerData = TDTowerData[tower.type];
    if (!towerData) return null;

    var nextLevel = tower.level + 1;
    var mul = TD_UPGRADE_TABLE[nextLevel].costMul;
    var cost = {};
    for (var res in towerData.cost) {
      if (towerData.cost.hasOwnProperty(res)) {
        cost[res] = Math.floor(towerData.cost[res] * mul);
      }
    }
    return cost;
  },

  getTowerStats: function (towerUid) {
    var tower = this._findTower(towerUid);
    if (!tower) return null;

    var towerData = TDTowerData[tower.type];
    if (!towerData) return null;

    var upgrade = TD_UPGRADE_TABLE[tower.level];
    var heroBonus = 1 + this._calcHeroAtkBonus() / 100;

    // 雷达站增伤 — 检查范围内是否有雷达站
    var radarBonus = this._calcRadarBonus(tower);

    var atk = Math.floor(towerData.atk * upgrade.statMul * heroBonus * (1 + radarBonus));
    var hp = Math.floor(towerData.hp * upgrade.hpMul);
    var range = towerData.range;
    var attackSpeed = towerData.attackSpeed;

    return {
      uid: tower.uid,
      type: tower.type,
      name: towerData.name,
      level: tower.level,
      atk: atk,
      hp: hp,
      range: range,
      attackSpeed: attackSpeed,
      targets: towerData.targets,
      special: towerData.special,
      category: towerData.category,
      kills: (this._towerRuntime[tower.uid] || {}).kills || 0,
      dps: attackSpeed > 0 ? Math.floor(atk * attackSpeed * 10) / 10 : 0
    };
  },

  // ========== T6: 科技研究 ==========

  canStartResearch: function (era) {
    if (era < 2 || era > 4) return { ok: false, reason: '无效的时代' };

    var key = 'era_' + era;
    if (this._state.research[key].completed) return { ok: false, reason: '该时代已研究完成' };
    if (this._state.research[key].startTime !== null) return { ok: false, reason: '正在研究中' };

    var techData = TDTechTree[era];
    if (!techData || !techData.requires) return { ok: false, reason: '科技数据不存在' };

    // 检查前置时代
    if (this._state.era < techData.requires.era) {
      return { ok: false, reason: '需要先解锁 ' + TDTechTree[techData.requires.era].name };
    }

    // 检查波次要求
    if (this._state.wave.highest < techData.requires.wave) {
      return { ok: false, reason: '需要通关波次 ' + techData.requires.wave };
    }

    // 检查资源
    if (techData.cost && typeof ResourceManager !== 'undefined' && !ResourceManager.canAffordMultiple(techData.cost)) {
      return { ok: false, reason: '资源不足' };
    }

    return { ok: true };
  },

  startResearch: function (era) {
    var check = this.canStartResearch(era);
    if (!check.ok) return check;

    var techData = TDTechTree[era];
    var key = 'era_' + era;

    // 扣资源
    if (techData.cost && typeof ResourceManager !== 'undefined') {
      ResourceManager.spendMultiple(techData.cost, 'tower_defense', 'research', key);
    }

    this._state.research[key].startTime = Date.now();

    var endTime = this._state.research[key].startTime + this._getResearchDuration(era) * 1000;
    EventBus.emit('td:research_started', { era: era, endTime: endTime });

    return { ok: true };
  },

  getResearchProgress: function (era) {
    if (era < 2 || era > 4) return null;
    var key = 'era_' + era;
    var research = this._state.research[key];

    if (research.completed) return { completed: true, remaining: 0 };
    if (research.startTime === null) return { completed: false, remaining: null };

    var duration = this._getResearchDuration(era) * 1000; // ms
    var elapsed = Date.now() - research.startTime;
    var remaining = Math.max(0, duration - elapsed);

    return { completed: false, remaining: Math.ceil(remaining / 1000) };
  },

  _getResearchDuration: function (era) {
    var techData = TDTechTree[era];
    if (!techData) return 0;
    var townHallLevel = 0;
    if (typeof TownManager !== 'undefined' && TownManager.getBuildingLevel) {
      townHallLevel = TownManager.getBuildingLevel('town_hall');
    }
    return techData.time / (1 + townHallLevel * 0.05);
  },

  _tickResearch: function (dt) {
    for (var era = 2; era <= 4; era++) {
      var key = 'era_' + era;
      var research = this._state.research[key];
      if (research.completed || research.startTime === null) continue;

      var duration = this._getResearchDuration(era) * 1000;
      var elapsed = Date.now() - research.startTime;

      if (elapsed >= duration) {
        research.completed = true;
        research.startTime = null;
        this._state.era = era;
        EventBus.emit('td:era_unlocked', { era: era });
        EventBus.emit('toast:show', { type: 'success', message: TDTechTree[era].name + ' 科技解锁！' });
      }
    }
  },

  _checkOfflineResearch: function () {
    for (var era = 2; era <= 4; era++) {
      var key = 'era_' + era;
      var research = this._state.research[key];
      if (research.completed || research.startTime === null) continue;

      var duration = this._getResearchDuration(era) * 1000;
      var elapsed = Date.now() - research.startTime;

      if (elapsed >= duration) {
        research.completed = true;
        research.startTime = null;
        this._state.era = era;
        // 不emit事件，init中不触发UI（UI可能还没初始化）
      }
    }
  },

  // ========== T7: 武将派驻 ==========

  assignHero: function (heroUid) {
    if (!this._state.unlocked) return { ok: false, reason: '城防系统未解锁' };

    // 检查武将是否存在
    if (typeof HeroManager === 'undefined' || !HeroManager.getHeroStats) {
      return { ok: false, reason: '武将系统不可用' };
    }
    var heroStats = HeroManager.getHeroStats(heroUid);
    if (!heroStats) return { ok: false, reason: '武将不存在' };

    // 检查是否在出征队伍
    if (typeof HeroManager !== 'undefined' && HeroManager.isInTeam && HeroManager.isInTeam(heroUid)) {
      return { ok: false, reason: '该武将在出征队伍中，无法派驻' };
    }

    // 检查是否已派驻
    if (this._state.assignedHeroes.indexOf(heroUid) !== -1) {
      return { ok: false, reason: '该武将已派驻' };
    }

    // 检查上限
    if (this._state.assignedHeroes.length >= TD_CONSTANTS.MAX_ASSIGNED_HEROES) {
      // 替换最后一名
      var replaced = this._state.assignedHeroes[this._state.assignedHeroes.length - 1];
      this._state.assignedHeroes[this._state.assignedHeroes.length - 1] = heroUid;
      delete this._heroSkillTimers[replaced];
      this._heroSkillTimers[heroUid] = 0;
      EventBus.emit('td:hero_assigned', { heroUid: heroUid, slot: this._state.assignedHeroes.length - 1, replaced: replaced });
      return { ok: true, replaced: replaced };
    }

    var slot = this._state.assignedHeroes.length;
    this._state.assignedHeroes.push(heroUid);
    this._heroSkillTimers[heroUid] = 0;
    EventBus.emit('td:hero_assigned', { heroUid: heroUid, slot: slot });

    return { ok: true };
  },

  removeHero: function (heroUid) {
    var idx = this._state.assignedHeroes.indexOf(heroUid);
    if (idx === -1) return false;
    this._state.assignedHeroes.splice(idx, 1);
    delete this._heroSkillTimers[heroUid];
    return true;
  },

  getAssignedHeroes: function () {
    var result = [];
    for (var i = 0; i < this._state.assignedHeroes.length; i++) {
      var uid = this._state.assignedHeroes[i];
      if (typeof HeroManager !== 'undefined' && HeroManager.getHeroStats) {
        var stats = HeroManager.getHeroStats(uid);
        if (stats) {
          result.push({ uid: uid, stats: stats, slot: i });
        }
      }
    }
    return result;
  },

  _calcHeroAtkBonus: function () {
    var bonus = 0;
    for (var i = 0; i < this._state.assignedHeroes.length; i++) {
      var uid = this._state.assignedHeroes[i];
      if (typeof HeroManager !== 'undefined' && HeroManager.getHeroStats) {
        var stats = HeroManager.getHeroStats(uid);
        if (stats) {
          bonus += Math.floor(stats.atk / 10);
        }
      }
    }
    return bonus; // percentage, e.g. 15 means +15%
  },

  _getAvailableHeroes: function () {
    if (typeof HeroManager === 'undefined' || !HeroManager.getAll) return [];
    var all = HeroManager.getAll();
    var teamUids = (typeof HeroManager !== 'undefined' && HeroManager.getTeamUids) ? HeroManager.getTeamUids() : [];
    var assignedHeroes = this._state.assignedHeroes;
    return all.filter(function (h) {
      return teamUids.indexOf(h.uid) === -1 && assignedHeroes.indexOf(h.uid) === -1;
    });
  },

  // ========== T8: 自动防守 ==========

  _autoDefend: function (dt) {
    if (this._state.wave.current > TD_CONSTANTS.MAX_WAVE) return;

    var waveNum = this._state.wave.current;
    var waveData = TDWaveTable[waveNum];
    if (!waveData) return;

    // 计算 totalTowerDPS
    var totalDPS = this._calcTotalTowerDPS();
    if (totalDPS <= 0) return;

    // 计算 totalEnemyHP
    var totalEnemyHP = this._calcWaveTotalHP(waveNum);
    if (totalEnemyHP <= 0) return;

    // 简化胜率
    var winRate = Math.min(1.0, totalDPS * TD_CONSTANTS.WAVE_DURATION_ASSUMED / totalEnemyHP);

    if (winRate >= TD_CONSTANTS.AUTO_WIN_THRESHOLD) {
      // 自动通关
      var rewards = this._calcRewards(waveNum, false);

      // 发放 70% 奖励
      this._grantRewards(rewards, TD_CONSTANTS.AUTO_REWARD_RATE);

      // 推进波次
      this._state.stats.totalWavesCleared++;
      this._state.wave.highest = Math.max(this._state.wave.highest, waveNum);
      if (waveNum < TD_CONSTANTS.MAX_WAVE) {
        this._state.wave.current = waveNum + 1;
      }

      EventBus.emit('td:wave_cleared', { wave: waveNum, rewards: rewards, auto: true });
    }
    // winRate < 0.8: 不推进
  },

  _calcTotalTowerDPS: function () {
    var totalDPS = 0;
    for (var i = 0; i < this._state.towers.length; i++) {
      var stats = this.getTowerStats(this._state.towers[i].uid);
      if (stats && stats.dps > 0) {
        totalDPS += stats.dps;
      }
    }
    return totalDPS;
  },

  _calcWaveTotalHP: function (waveNum) {
    var waveData = TDWaveTable[waveNum];
    if (!waveData) return 0;

    var totalHP = 0;
    var isBoss = waveData.isBoss;

    for (var i = 0; i < waveData.enemies.length; i++) {
      var entry = waveData.enemies[i];
      var enemyData = TDEnemyData[entry.type];
      if (!enemyData) continue;

      for (var j = 0; j < entry.count; j++) {
        var hp;
        if (isBoss && (entry.type === 'td_siege_ram' || entry.type === 'td_burrower' ||
            entry.type === 'td_bomber' || entry.type === 'td_final_boss')) {
          // Boss 倍率替代类型倍率
          hp = waveData.baseHp * 3;
        } else {
          hp = Math.floor(waveData.baseHp * enemyData.hpMul);
        }
        totalHP += hp;
      }
    }
    return totalHP;
  },

  // ========== T9: 敌人生成 + A* 移动 ==========

  _defaultBattle: function () {
    return {
      active: false,
      phase: 'idle',  // idle | prep | active | settlement
      enemies: [],
      prepTimer: 0,
      rafId: null,
      lastFrameTime: 0,
      spawnQueue: [],
      spawnTimer: 0,
      spawnInterval: 0.5, // seconds between spawns
      wallInstances: []  // runtime wall hp tracking
    };
  },

  _startBattleLoop: function () {
    if (this._battle.rafId) return;
    this._battle.lastFrameTime = 0;
    var self = this;
    var loop = function (timestamp) {
      self._battleTick(timestamp);
      self._battle.rafId = requestAnimationFrame(loop);
    };
    this._battle.rafId = requestAnimationFrame(loop);
  },

  _stopBattleLoop: function () {
    if (this._battle.rafId) {
      cancelAnimationFrame(this._battle.rafId);
      this._battle.rafId = null;
    }
  },

  _battleTick: function (timestamp) {
    if (!this._battle.active) return;

    if (this._battle.lastFrameTime === 0) {
      this._battle.lastFrameTime = timestamp;
      return;
    }

    var dt = (timestamp - this._battle.lastFrameTime) / 1000;
    this._battle.lastFrameTime = timestamp;

    // Cap dt to avoid huge jumps
    if (dt > 0.1) dt = 0.1;

    if (this._battle.phase === 'prep') {
      this._battle.prepTimer -= dt;
      if (this._battle.prepTimer <= 0) {
        this._startActivePhase();
      }
      return;
    }

    if (this._battle.phase === 'active') {
      // Spawn enemies
      this._tickSpawning(dt);
      // Move enemies
      this._tickEnemies(dt);
      // Update towers
      this._updateTowers(dt);
      // Update traps
      this._updateTraps(dt);
      // Apply hero skills
      this._applyHeroSkills(dt);
      // Check win/lose
      this._checkBattleEnd();
    }
  },

  _tickSpawning: function (dt) {
    if (this._battle.spawnQueue.length === 0) return;

    this._battle.spawnTimer += dt;
    while (this._battle.spawnTimer >= this._battle.spawnInterval && this._battle.spawnQueue.length > 0) {
      this._battle.spawnTimer -= this._battle.spawnInterval;
      var enemyDef = this._battle.spawnQueue.shift();
      this._spawnSingleEnemy(enemyDef);
    }
  },

  _spawnSingleEnemy: function (enemyDef) {
    var enemyData = TDEnemyData[enemyDef.type];
    if (!enemyData) return;

    var waveData = TDWaveTable[this._state.wave.current];
    if (!waveData) return;

    // Calculate actual stats
    var isBoss = waveData.isBoss;
    var hp, atk, def;

    if (isBoss && (enemyDef.type === 'td_siege_ram' || enemyDef.type === 'td_burrower' ||
        enemyDef.type === 'td_bomber' || enemyDef.type === 'td_final_boss')) {
      // Boss: 倍率 ×3/×2/×2，替代类型倍率（但保留移速和特殊能力）
      hp = waveData.baseHp * 3;
      atk = waveData.baseAtk * 2;
      def = waveData.baseDef * 2;
    } else {
      // 普通: 基础属性 × 类型倍率  
      hp = Math.floor(waveData.baseHp * enemyData.hpMul);
      atk = Math.floor(waveData.baseAtk * enemyData.atkMul);
      def = Math.floor(waveData.baseDef * enemyData.defMul);
    }

    var spawnPoints = this._getSpawnPoints();
    var spawnPoint = spawnPoints[Utils.randInt(0, spawnPoints.length - 1)];
    if (!spawnPoint) return;

    var target = this._getTownHallGridPos();
    if (!target) return;

    // Calculate path
    var path = null;
    if (enemyData.category === 'air') {
      // Air enemies fly in a straight line
      path = [spawnPoint, target];
    } else {
      // Ground/underground: A* pathfinding
      var grid = this._getFullCollisionGrid();
      if (grid) {
        path = Pathfinding.findPath(grid, spawnPoint, target);
      }
    }

    if (!path || path.length === 0) {
      // Fallback: direct path
      path = [spawnPoint, target];
    }

    var enemy = {
      uid: Utils.uid(),
      type: enemyDef.type,
      hp: hp,
      maxHp: hp,
      atk: atk,
      def: def,
      speed: enemyData.speed,
      path: path,
      pathIndex: 0,
      x: spawnPoint.x * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2,
      y: spawnPoint.y * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2,
      detected: enemyData.category !== 'underground', // underground starts undetected
      category: enemyData.category,
      special: enemyData.special,
      status: 'moving',
      slowTimer: 0,    // slow effect remaining time
      slowFactor: 1.0,  // speed multiplier (1.0 = normal)
      burnTimer: 0,    // burn remaining
      burnDps: 0,       // burn damage per second
      wallTarget: null,  // uid of wall being attacked
      // Boss summon tracking
      summonTimer: 0,
      summonCount: 0
    };

    this._battle.enemies.push(enemy);
  },

  _tickEnemies: function (dt) {
    for (var i = this._battle.enemies.length - 1; i >= 0; i--) {
      var enemy = this._battle.enemies[i];
      if (enemy.status === 'dead') continue;

      // Apply status effects
      this._tickEnemyStatus(enemy, dt);

      // Boss special: summon infantry
      if (enemy.special === 'summon_infantry') {
        this._tickBossSummon(enemy, dt);
      }

      if (enemy.category === 'air') {
        this._moveAirEnemy(enemy, dt);
      } else if (enemy.status === 'attacking_wall') {
        this._enemyAttackWall(enemy, dt);
      } else {
        this._moveGroundEnemy(enemy, dt);
      }
    }
  },

  _tickEnemyStatus: function (enemy, dt) {
    // Slow timer
    if (enemy.slowTimer > 0) {
      enemy.slowTimer -= dt;
      if (enemy.slowTimer <= 0) {
        enemy.slowTimer = 0;
        enemy.slowFactor = 1.0;
      }
    }

    // Burn damage
    if (enemy.burnTimer > 0) {
      enemy.burnTimer -= dt;
      var burnDmg = enemy.burnDps * dt;
      enemy.hp -= burnDmg;
      if (enemy.hp <= 0) {
        this._killEnemy(enemy, null);
      }
    }
  },

  _tickBossSummon: function (enemy, dt) {
    if (enemy.summonCount >= 3) return;
    enemy.summonTimer += dt;
    if (enemy.summonTimer >= 5) { // every 5 seconds
      enemy.summonTimer -= 5;
      enemy.summonCount++;
      // Summon infantry at boss position
      var waveData = TDWaveTable[this._state.wave.current];
      if (!waveData) return;
      var infantryData = TDEnemyData['td_infantry'];
      if (!infantryData) return;

      var hp = Math.floor(waveData.baseHp * infantryData.hpMul);
      var atk = Math.floor(waveData.baseAtk * infantryData.atkMul);
      var def = Math.floor(waveData.baseDef * infantryData.defMul);

      var gridX = Math.floor(enemy.x / TD_CONSTANTS.TILE_SIZE);
      var gridY = Math.floor(enemy.y / TD_CONSTANTS.TILE_SIZE);
      var target = this._getTownHallGridPos();
      var grid = this._getFullCollisionGrid();
      var path = grid ? Pathfinding.findPath(grid, { x: gridX, y: gridY }, target) : [{ x: gridX, y: gridY }, target];

      var summon = {
        uid: Utils.uid(),
        type: 'td_infantry',
        hp: hp, maxHp: hp, atk: atk, def: def,
        speed: infantryData.speed,
        path: path || [{ x: gridX, y: gridY }, target],
        pathIndex: 0,
        x: enemy.x, y: enemy.y,
        detected: true,
        category: 'ground',
        special: null,
        status: 'moving',
        slowTimer: 0, slowFactor: 1.0,
        burnTimer: 0, burnDps: 0,
        wallTarget: null,
        summonTimer: 0, summonCount: 0
      };
      this._battle.enemies.push(summon);
    }
  },

  _moveGroundEnemy: function (enemy, dt) {
    if (!enemy.path || enemy.pathIndex >= enemy.path.length - 1) {
      // Reached destination (town hall)
      this._enemyReachTownHall(enemy);
      return;
    }

    var nextNode = enemy.path[enemy.pathIndex + 1];
    var targetX = nextNode.x * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
    var targetY = nextNode.y * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;

    // Check if next node has a wall
    var wallAtNext = this._findWallAt(nextNode.x, nextNode.y);
    if (wallAtNext && wallAtNext.hp > 0) {
      enemy.status = 'attacking_wall';
      enemy.wallTarget = wallAtNext.uid;
      return;
    }

    var dx = targetX - enemy.x;
    var dy = targetY - enemy.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    var moveSpeed = enemy.speed * enemy.slowFactor * TD_CONSTANTS.TILE_SIZE;
    var moveAmount = moveSpeed * dt;

    if (moveAmount >= dist) {
      enemy.x = targetX;
      enemy.y = targetY;
      enemy.pathIndex++;
      // Check if reached final node
      if (enemy.pathIndex >= enemy.path.length - 1) {
        this._enemyReachTownHall(enemy);
      }
    } else {
      enemy.x += (dx / dist) * moveAmount;
      enemy.y += (dy / dist) * moveAmount;
    }
  },

  _moveAirEnemy: function (enemy, dt) {
    // Air: fly in straight line to town hall
    var target = this._getTownHallGridPos();
    if (!target) return;
    var targetX = target.x * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
    var targetY = target.y * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;

    var dx = targetX - enemy.x;
    var dy = targetY - enemy.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    var moveSpeed = enemy.speed * enemy.slowFactor * TD_CONSTANTS.TILE_SIZE;
    var moveAmount = moveSpeed * dt;

    if (moveAmount >= dist || dist < 1) {
      this._enemyReachTownHall(enemy);
    } else {
      enemy.x += (dx / dist) * moveAmount;
      enemy.y += (dy / dist) * moveAmount;
    }
  },

  _enemyAttackWall: function (enemy, dt) {
    var wall = this._findWallByUid(enemy.wallTarget);
    if (!wall || wall.hp <= 0) {
      enemy.status = 'moving';
      enemy.wallTarget = null;
      // Wall destroyed — recalc paths
      this._recalcPaths();
      return;
    }

    // DPS = ATK × (1 - DEF/(DEF+100)), walls have DEF=0
    var wallDef = 0;
    var dmg = enemy.atk * (1 - wallDef / (wallDef + 100)) * dt;

    // Siege ram: wall_damage_x2
    if (enemy.special === 'wall_damage_x2') {
      dmg *= 2;
    }

    wall.hp -= dmg;
    if (wall.hp <= 0) {
      wall.hp = 0;
      // Remove wall tower from state
      this._state.towers = this._state.towers.filter(function (t) { return t.uid !== wall.uid; });
      delete this._towerRuntime[wall.uid];
      enemy.status = 'moving';
      enemy.wallTarget = null;
      this._recalcPaths();
    }
  },

  _enemyReachTownHall: function (enemy) {
    // §CAP-TD-06: dmg = enemyHP×10% + enemyATK
    var damage = Math.floor(enemy.hp * 0.1 + enemy.atk);
    // §6.3: 轰炸者对城主府伤害 ×2
    var enemyData = TDEnemyData[enemy.type];
    if (enemyData && enemyData.special === 'flying_tower_damage_x2') {
      damage *= 2;
    }
    this._damageTownHall(damage);

    enemy.status = 'dead';
    enemy.hp = 0;
    // Remove from active enemies
    this._battle.enemies = this._battle.enemies.filter(function (e) { return e.uid !== enemy.uid; });
  },

  _recalcPaths: function () {
    var grid = this._getFullCollisionGrid();
    var target = this._getTownHallGridPos();
    if (!grid || !target) return;

    for (var i = 0; i < this._battle.enemies.length; i++) {
      var enemy = this._battle.enemies[i];
      if (enemy.status === 'dead') continue;
      if (enemy.category === 'air') continue; // Air ignores obstacles

      var gridX = Math.floor(enemy.x / TD_CONSTANTS.TILE_SIZE);
      var gridY = Math.floor(enemy.y / TD_CONSTANTS.TILE_SIZE);

      var newPath = Pathfinding.findPath(grid, { x: gridX, y: gridY }, target);
      if (newPath) {
        enemy.path = newPath;
        enemy.pathIndex = 0;
        if (enemy.status === 'attacking_wall') {
          enemy.status = 'moving';
          enemy.wallTarget = null;
        }
      }
    }
  },

  _getSpawnPoints: function () {
    // Generate spawn points from map edges
    var grid = this._getCollisionGrid();
    if (!grid || grid.length === 0) return [{ x: 0, y: 0 }];

    var rows = grid.length;
    var cols = grid[0].length;
    var points = [];

    // Top edge
    for (var x = 0; x < cols; x++) {
      if (grid[0][x] === 0) points.push({ x: x, y: 0 });
    }
    // Bottom edge
    for (var x2 = 0; x2 < cols; x2++) {
      if (grid[rows - 1][x2] === 0) points.push({ x: x2, y: rows - 1 });
    }
    // Left edge
    for (var y = 1; y < rows - 1; y++) {
      if (grid[y][0] === 0) points.push({ x: 0, y: y });
    }
    // Right edge
    for (var y2 = 1; y2 < rows - 1; y2++) {
      if (grid[y2][cols - 1] === 0) points.push({ x: cols - 1, y: y2 });
    }

    if (points.length === 0) points.push({ x: 0, y: 0 });
    return points;
  },

  _selectSpawnPoints: function () {
    var all = this._getSpawnPoints();
    if (all.length <= 2) return all;
    // Pick 1-2 random spawn points
    var count = Utils.randInt(1, 2);
    var selected = [];
    var used = {};
    while (selected.length < count && selected.length < all.length) {
      var idx = Utils.randInt(0, all.length - 1);
      if (!used[idx]) {
        used[idx] = true;
        selected.push(all[idx]);
      }
    }
    return selected;
  },

  // ========== T10: 塔攻击系统 ==========

  _updateTowers: function (dt) {
    // First pass: detection towers reveal underground enemies
    this._updateDetection();

    for (var i = 0; i < this._state.towers.length; i++) {
      var tower = this._state.towers[i];
      var towerData = TDTowerData[tower.type];
      if (!towerData) continue;

      var runtime = this._towerRuntime[tower.uid];
      if (!runtime) {
        runtime = { currentTarget: null, lastAttackTime: 0, kills: 0 };
        this._towerRuntime[tower.uid] = runtime;
      }

      // Skip walls (they don't attack) — except electric_fence
      if (towerData.category === 'wall' && towerData.special !== 'contact_damage') continue;
      // Skip traps — handled separately
      if (towerData.category === 'trap') continue;
      // Skip support towers with no attack
      if (towerData.atk <= 0 && towerData.special !== 'detect' && towerData.special !== 'detect_atk_buff_20') continue;

      var stats = this.getTowerStats(tower.uid);
      if (!stats || stats.attackSpeed <= 0) continue;

      var attackInterval = 1 / stats.attackSpeed;
      runtime.lastAttackTime += dt;

      if (runtime.lastAttackTime >= attackInterval) {
        runtime.lastAttackTime -= attackInterval;

        // Multi-target (gatling)
        var maxTargets = 1;
        if (towerData.special === 'multi_2') maxTargets = 2;

        var targets = this._findTargets(tower, stats, maxTargets);
        for (var t = 0; t < targets.length; t++) {
          this._towerAttack(tower, stats, towerData, targets[t]);
        }
      }
    }

    // Electric fence: contact damage
    this._updateElectricFences(dt);
  },

  _updateDetection: function () {
    // Reset detection for all underground enemies
    for (var e = 0; e < this._battle.enemies.length; e++) {
      var enemy = this._battle.enemies[e];
      if (enemy.category === 'underground') {
        enemy.detected = false;
      }
    }

    // Detection towers reveal underground enemies in range
    for (var i = 0; i < this._state.towers.length; i++) {
      var tower = this._state.towers[i];
      var towerData = TDTowerData[tower.type];
      if (!towerData) continue;

      if (towerData.special === 'detect' || towerData.special === 'detect_atk_buff_20') {
        var stats = this.getTowerStats(tower.uid);
        var towerCenterX = tower.gridX * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
        var towerCenterY = tower.gridY * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
        var rangePixels = stats.range * TD_CONSTANTS.TILE_SIZE;

        for (var e2 = 0; e2 < this._battle.enemies.length; e2++) {
          var en = this._battle.enemies[e2];
          if (en.category !== 'underground' || en.status === 'dead') continue;

          var dx = en.x - towerCenterX;
          var dy = en.y - towerCenterY;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= rangePixels) {
            en.detected = true;
          }
        }
      }
    }
  },

  _findTargets: function (tower, stats, maxTargets) {
    var towerData = TDTowerData[tower.type];
    var towerCenterX = tower.gridX * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
    var towerCenterY = tower.gridY * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
    var rangePixels = stats.range * TD_CONSTANTS.TILE_SIZE;

    var candidates = [];

    for (var i = 0; i < this._battle.enemies.length; i++) {
      var enemy = this._battle.enemies[i];
      if (enemy.status === 'dead' || enemy.hp <= 0) continue;

      // Check target type compatibility
      if (towerData.targets.indexOf(enemy.category) === -1) continue;

      // Underground enemies: can only be targeted if detected (by detection towers)
      if (enemy.category === 'underground' && !enemy.detected) continue;

      // Check range
      var dx = enemy.x - towerCenterX;
      var dy = enemy.y - towerCenterY;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= rangePixels) {
        // Priority: closest to town hall (lowest remaining path distance)
        var remainingPath = this._calcRemainingPathDist(enemy);
        candidates.push({ enemy: enemy, remainingPath: remainingPath, dist: dist });
      }
    }

    // Sort by remaining path distance (ascending — closest to town hall first)
    candidates.sort(function (a, b) { return a.remainingPath - b.remainingPath; });

    var result = [];
    for (var j = 0; j < Math.min(maxTargets, candidates.length); j++) {
      result.push(candidates[j].enemy);
    }
    return result;
  },

  _calcRemainingPathDist: function (enemy) {
    if (!enemy.path || enemy.pathIndex >= enemy.path.length - 1) return 0;
    var remaining = 0;
    var px = enemy.x;
    var py = enemy.y;
    for (var i = enemy.pathIndex + 1; i < enemy.path.length; i++) {
      var nx = enemy.path[i].x * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
      var ny = enemy.path[i].y * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
      remaining += Math.sqrt((nx - px) * (nx - px) + (ny - py) * (ny - py));
      px = nx;
      py = ny;
    }
    return remaining;
  },

  _towerAttack: function (tower, stats, towerData, enemy) {
    var atk = stats.atk;
    var def = enemy.def;

    // Armor piercing: ignore 50% DEF
    if (towerData.special === 'armor_pierce_50') {
      def = Math.floor(def * 0.5);
    }

    var damage = this._calcDamage(atk, def);
    enemy.hp -= damage;

    // Splash damage
    if (towerData.special === 'splash_1' || towerData.special === 'homing_splash_1') {
      this._handleSplash(enemy, damage, 1);
    }

    // Pierce beam (laser): hit all enemies in a line
    if (towerData.special === 'pierce_beam') {
      this._handlePiercing(tower, stats, enemy);
    }

    if (enemy.hp <= 0) {
      this._killEnemy(enemy, tower.uid);
    }
  },

  _calcDamage: function (atk, def) {
    return atk * (1 - def / (def + 100));
  },

  _handleSplash: function (hitEnemy, damage, splashRange) {
    var splashDist = splashRange * TD_CONSTANTS.TILE_SIZE;
    for (var i = 0; i < this._battle.enemies.length; i++) {
      var e = this._battle.enemies[i];
      if (e.uid === hitEnemy.uid || e.status === 'dead' || e.hp <= 0) continue;

      var dx = e.x - hitEnemy.x;
      var dy = e.y - hitEnemy.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= splashDist) {
        var splashDmg = damage * 0.5; // 50% splash
        e.hp -= splashDmg;
        if (e.hp <= 0) {
          this._killEnemy(e, null);
        }
      }
    }
  },

  _handlePiercing: function (tower, stats, hitEnemy) {
    // Laser: damage all enemies in a line from tower to beyond hit enemy
    var towerCenterX = tower.gridX * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
    var towerCenterY = tower.gridY * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;

    var dx = hitEnemy.x - towerCenterX;
    var dy = hitEnemy.y - towerCenterY;
    var lineLen = Math.sqrt(dx * dx + dy * dy);
    if (lineLen < 1) return;

    var nx = dx / lineLen;
    var ny = dy / lineLen;
    var threshold = TD_CONSTANTS.TILE_SIZE * 0.5; // half tile proximity to line

    for (var i = 0; i < this._battle.enemies.length; i++) {
      var e = this._battle.enemies[i];
      if (e.uid === hitEnemy.uid || e.status === 'dead' || e.hp <= 0) continue;

      // Project enemy position onto line
      var ex = e.x - towerCenterX;
      var ey = e.y - towerCenterY;
      var proj = ex * nx + ey * ny;
      if (proj < 0) continue; // behind tower

      var perpX = ex - proj * nx;
      var perpY = ey - proj * ny;
      var perpDist = Math.sqrt(perpX * perpX + perpY * perpY);

      if (perpDist <= threshold) {
        var dmg = this._calcDamage(stats.atk, e.def);
        e.hp -= dmg;
        if (e.hp <= 0) {
          this._killEnemy(e, tower.uid);
        }
      }
    }
  },

  _updateTraps: function (dt) {
    for (var i = this._state.towers.length - 1; i >= 0; i--) {
      var tower = this._state.towers[i];
      var towerData = TDTowerData[tower.type];
      if (!towerData || towerData.category !== 'trap') continue;

      var runtime = this._towerRuntime[tower.uid];
      if (!runtime) {
        runtime = { currentTarget: null, lastAttackTime: 0, kills: 0, trapCooldown: 0, trapUsed: false };
        this._towerRuntime[tower.uid] = runtime;
      }

      var towerCenterX = tower.gridX * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
      var towerCenterY = tower.gridY * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;

      // Cooldown for reusable traps
      if (runtime.trapCooldown > 0) {
        runtime.trapCooldown -= dt;
        continue;
      }

      // Check for enemies on trap tile
      for (var e = 0; e < this._battle.enemies.length; e++) {
        var enemy = this._battle.enemies[e];
        if (enemy.status === 'dead' || enemy.hp <= 0) continue;
        if (enemy.category === 'air') continue; // Air ignores traps
        if (towerData.targets.indexOf(enemy.category) === -1) continue;

        var dx = enemy.x - towerCenterX;
        var dy = enemy.y - towerCenterY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= TD_CONSTANTS.TILE_SIZE * 0.6) { // within trap tile
          this._triggerTrap(tower, towerData, enemy, runtime);
          break; // One trigger per tick
        }
      }
    }
  },

  _triggerTrap: function (tower, towerData, enemy, runtime) {
    var stats = this.getTowerStats(tower.uid);
    var damage = this._calcDamage(stats.atk, enemy.def);

    if (towerData.special === 'slow_50_3s') {
      // 拒马: damage + slow 50% for 3s, one-time
      enemy.hp -= damage;
      enemy.slowTimer = 3;
      enemy.slowFactor = 0.5;
      if (enemy.hp <= 0) this._killEnemy(enemy, tower.uid);

      // Remove one-time trap
      this._state.towers = this._state.towers.filter(function (t) { return t.uid !== tower.uid; });
      delete this._towerRuntime[tower.uid];

    } else if (towerData.special === 'burn_5s_cd15') {
      // 火油池: burn 5s, cooldown 15s
      enemy.burnTimer = 5;
      enemy.burnDps = stats.atk;
      runtime.trapCooldown = 15;

    } else if (towerData.special === 'aoe_1') {
      // 地雷阵: AoE 1 tile, one-time
      enemy.hp -= damage;
      if (enemy.hp <= 0) this._killEnemy(enemy, tower.uid);

      // AoE to nearby enemies
      this._handleSplash(enemy, damage, 1);

      // Remove one-time trap
      this._state.towers = this._state.towers.filter(function (t) { return t.uid !== tower.uid; });
      delete this._towerRuntime[tower.uid];
    }
  },

  _updateElectricFences: function (dt) {
    for (var i = 0; i < this._state.towers.length; i++) {
      var tower = this._state.towers[i];
      var towerData = TDTowerData[tower.type];
      if (!towerData || towerData.special !== 'contact_damage') continue;

      var stats = this.getTowerStats(tower.uid);
      var towerCenterX = tower.gridX * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
      var towerCenterY = tower.gridY * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;

      for (var e = 0; e < this._battle.enemies.length; e++) {
        var enemy = this._battle.enemies[e];
        if (enemy.status === 'dead' || enemy.hp <= 0 || enemy.category === 'air') continue;

        var dx = enemy.x - towerCenterX;
        var dy = enemy.y - towerCenterY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= TD_CONSTANTS.TILE_SIZE * 0.8) {
          var dmg = stats.atk * dt; // ATK per second
          enemy.hp -= dmg;
          if (enemy.hp <= 0) {
            this._killEnemy(enemy, tower.uid);
          }
        }
      }
    }
  },

  _applyHeroSkills: function (dt) {
    if (this._state.assignedHeroes.length === 0) return;
    if (this._battle.enemies.length === 0) return;

    for (var i = 0; i < this._state.assignedHeroes.length; i++) {
      var heroUid = this._state.assignedHeroes[i];
      if (!this._heroSkillTimers[heroUid]) this._heroSkillTimers[heroUid] = 0;

      this._heroSkillTimers[heroUid] += dt;

      if (this._heroSkillTimers[heroUid] >= TD_CONSTANTS.HERO_SKILL_INTERVAL) {
        this._heroSkillTimers[heroUid] -= TD_CONSTANTS.HERO_SKILL_INTERVAL;

        // Get hero stats and template for skill coefficient
        if (typeof HeroManager === 'undefined' || !HeroManager.getHeroStats) continue;
        var heroStats = HeroManager.getHeroStats(heroUid);
        if (!heroStats) continue;

        var hero = HeroManager.getAll().find(function (h) { return h.uid === heroUid; });
        var skillCoeff = 1.0;
        if (hero && typeof HeroManager.getTemplate === 'function') {
          var template = HeroManager.getTemplate(hero.id);
          if (template && template.skillMultiplier) {
            skillCoeff = template.skillMultiplier;
          }
        }

        // Damage = heroATK × skillCoeff × 0.5
        var skillDmg = heroStats.atk * skillCoeff * TD_CONSTANTS.HERO_SKILL_COEFFICIENT;

        // Pick random alive enemy
        var alive = [];
        for (var e = 0; e < this._battle.enemies.length; e++) {
          if (this._battle.enemies[e].status !== 'dead' && this._battle.enemies[e].hp > 0) {
            alive.push(this._battle.enemies[e]);
          }
        }
        if (alive.length === 0) continue;
        var target = alive[Utils.randInt(0, alive.length - 1)];

        target.hp -= skillDmg;
        if (target.hp <= 0) {
          this._killEnemy(target, null);
        }
      }
    }
  },

  _killEnemy: function (enemy, killerTowerUid) {
    enemy.status = 'dead';
    enemy.hp = 0;
    this._state.stats.totalKills++;

    if (killerTowerUid && this._towerRuntime[killerTowerUid]) {
      this._towerRuntime[killerTowerUid].kills++;
    }

    EventBus.emit('td:enemy_killed', { enemyUid: enemy.uid, killerTowerUid: killerTowerUid });

    // Remove from array
    this._battle.enemies = this._battle.enemies.filter(function (e) { return e.uid !== enemy.uid; });
  },

  _calcRadarBonus: function (tower) {
    var bonus = 0;
    for (var i = 0; i < this._state.towers.length; i++) {
      var other = this._state.towers[i];
      if (other.uid === tower.uid) continue;
      var otherData = TDTowerData[other.type];
      if (!otherData || otherData.special !== 'detect_atk_buff_20') continue;

      var dx = (other.gridX - tower.gridX);
      var dy = (other.gridY - tower.gridY);
      var dist = Math.sqrt(dx * dx + dy * dy);
      var radarRange = otherData.range;

      if (dist <= radarRange) {
        bonus += 0.20; // +20% ATK
      }
    }
    return bonus;
  },

  // ========== T11: 波次生命周期 ==========
  // State machine: idle → prep → active → settlement → idle
  //                                     → failed → idle

  startWave: function () {
    if (!this._state.unlocked || !this._inDefenseMode) return false;
    if (this._battle.active) return false;
    if (this._state.wave.current > TD_CONSTANTS.MAX_WAVE) return false;

    // Init town hall HP for this wave
    this._initTownHallHp();

    this._battle.active = true;
    this._battle.phase = 'prep';
    this._battle.prepTimer = TD_CONSTANTS.PREP_TIME;
    this._battle.enemies = [];
    this._battle.spawnQueue = [];
    this._battle.spawnTimer = 0;

    // Init wall instances for hp tracking
    this._initWallInstances();

    // Start rAF loop
    this._startBattleLoop();

    return true;
  },

  skipPrep: function () {
    if (this._battle.phase !== 'prep') return false;
    this._battle.prepTimer = 0;
    this._startActivePhase();
    return true;
  },

  _startActivePhase: function () {
    this._battle.phase = 'active';

    var waveNum = this._state.wave.current;
    var waveData = TDWaveTable[waveNum];
    if (!waveData) return;

    // Build spawn queue
    this._battle.spawnQueue = [];
    for (var i = 0; i < waveData.enemies.length; i++) {
      var entry = waveData.enemies[i];
      for (var j = 0; j < entry.count; j++) {
        this._battle.spawnQueue.push({ type: entry.type });
      }
    }

    // Reset tower attack timers
    for (var uid in this._towerRuntime) {
      if (this._towerRuntime.hasOwnProperty(uid)) {
        this._towerRuntime[uid].lastAttackTime = 0;
        this._towerRuntime[uid].kills = 0;
      }
    }

    // Reset hero skill timers
    for (var h = 0; h < this._state.assignedHeroes.length; h++) {
      this._heroSkillTimers[this._state.assignedHeroes[h]] = 0;
    }

    EventBus.emit('td:wave_started', { wave: waveNum });
  },

  _checkBattleEnd: function () {
    if (this._battle.phase !== 'active') return;

    // Check town hall HP
    if (this._state.wave.townHallHp <= 0) {
      this._onWaveFailed();
      return;
    }

    // Check if all enemies cleared (and no more to spawn)
    if (this._battle.spawnQueue.length === 0 && this._battle.enemies.length === 0) {
      this._onAllEnemiesCleared();
    }
  },

  _onAllEnemiesCleared: function () {
    var waveNum = this._state.wave.current;
    this._battle.phase = 'settlement';

    // Calculate rewards (manual mode)
    var rewards = this._calcRewards(waveNum, true);

    // Grant full rewards
    this._grantRewards(rewards, 1.0);

    // Update wave state
    this._state.stats.totalWavesCleared++;
    this._state.wave.highest = Math.max(this._state.wave.highest, waveNum);

    if (waveNum < TD_CONSTANTS.MAX_WAVE) {
      this._state.wave.current = waveNum + 1;
    }

    EventBus.emit('td:wave_cleared', { wave: waveNum, rewards: rewards, auto: false });

    // Stop battle loop, return to idle
    this._battle.active = false;
    this._battle.phase = 'idle';
    this._stopBattleLoop();
  },

  _onWaveFailed: function () {
    var waveNum = this._state.wave.current;
    this._battle.phase = 'idle';
    this._battle.active = false;
    this._stopBattleLoop();

    // HP restores to full
    this._initTownHallHp();

    // Clear battle enemies
    this._battle.enemies = [];
    this._battle.spawnQueue = [];

    EventBus.emit('td:wave_failed', { wave: waveNum, townHallHpLost: this._state.wave.townHallMaxHp });
  },

  _calcRewards: function (waveNum, isManual) {
    var base = TDWaveRewards(waveNum);
    var rewards = {
      gold: base.gold,
      exp: base.exp
    };

    // Manual bonuses
    if (isManual) {
      rewards.gold = Math.floor(rewards.gold * TD_CONSTANTS.MANUAL_GOLD_BONUS);
      rewards.exp = Math.floor(rewards.exp * TD_CONSTANTS.MANUAL_EXP_BONUS);
    }

    // Jade
    if (base.jade) {
      rewards.jade = base.jade;
    } else if (base.jadeChance && Math.random() < base.jadeChance) {
      rewards.jade = base.jadeAmount || 1;
    }

    // Equipment drop
    if (base.equipChance && Math.random() < base.equipChance) {
      rewards.equipDrop = true;
      rewards.equipMinQuality = base.equipMinQuality || 3;
    }

    return rewards;
  },

  _grantRewards: function (rewards, multiplier) {
    if (typeof ResourceManager === 'undefined') return;

    var gold = Math.floor((rewards.gold || 0) * multiplier);
    var exp = Math.floor((rewards.exp || 0) * multiplier);

    if (gold > 0) {
      ResourceManager.add('gold', gold, 'tower_defense', 'wave_reward');
      this._state.stats.totalGoldEarned += gold;
    }
    if (exp > 0) {
      ResourceManager.add('exp', exp, 'tower_defense', 'wave_reward');
    }

    // Jade (full amount, not multiplied)
    if (rewards.jade && rewards.jade > 0) {
      ResourceManager.add('jade', rewards.jade, 'tower_defense', 'wave_reward');
    }

    // Equipment drop
    if (rewards.equipDrop && typeof EquipmentManager !== 'undefined' && EquipmentManager.addToInventory) {
      var minQ = rewards.equipMinQuality || 3;
      // Generate equipment — simplified, use EquipmentManager if available
      if (typeof EquipmentManager.generateEquipment === 'function') {
        var equip = EquipmentManager.generateEquipment(minQ);
        if (equip) EquipmentManager.addToInventory(equip);
      }
    }
  },

  getCurrentWavePreview: function () {
    var waveNum = this._state.wave.current;
    if (waveNum > TD_CONSTANTS.MAX_WAVE) return null;
    var waveData = TDWaveTable[waveNum];
    if (!waveData) return null;

    var preview = [];
    for (var i = 0; i < waveData.enemies.length; i++) {
      var entry = waveData.enemies[i];
      var enemyData = TDEnemyData[entry.type];
      preview.push({
        type: entry.type,
        name: enemyData ? enemyData.name : entry.type,
        count: entry.count,
        category: enemyData ? enemyData.category : 'ground'
      });
    }

    return {
      wave: waveNum,
      isBoss: waveData.isBoss,
      enemies: preview,
      rewards: TDWaveRewards(waveNum)
    };
  },

  // ========== T12: 城主府 HP ==========

  _initTownHallHp: function () {
    var townHallLevel = 0;
    if (typeof TownManager !== 'undefined' && TownManager.getBuildingLevel) {
      townHallLevel = TownManager.getBuildingLevel('town_hall');
    }
    var maxHp = 500 + townHallLevel * 200;
    this._state.wave.townHallMaxHp = maxHp;
    this._state.wave.townHallHp = maxHp;
  },

  _damageTownHall: function (amount) {
    this._state.wave.townHallHp -= amount;
    if (this._state.wave.townHallHp < 0) {
      this._state.wave.townHallHp = 0;
    }
  },

  // ========== onTick (game:tick, 1Hz) ==========

  onTick: function (dt) {
    if (!this._state) return;

    // 科技研究 tick
    if (this._state.unlocked) {
      this._tickResearch(dt);
    }

    // 自动防守：非防守模式 + 有塔 + 已解锁
    if (!this._inDefenseMode && this._state.unlocked && this._state.towers.length > 0) {
      this._autoDefend(dt);
    }
  },

  // ========== Helper Methods ==========

  _findTower: function (uid) {
    for (var i = 0; i < this._state.towers.length; i++) {
      if (this._state.towers[i].uid === uid) return this._state.towers[i];
    }
    return null;
  },

  _findWallAt: function (gridX, gridY) {
    // Check wall instances in battle
    for (var i = 0; i < this._battle.wallInstances.length; i++) {
      var w = this._battle.wallInstances[i];
      if (w.gridX === gridX && w.gridY === gridY && w.hp > 0) return w;
    }
    return null;
  },

  _findWallByUid: function (uid) {
    for (var i = 0; i < this._battle.wallInstances.length; i++) {
      if (this._battle.wallInstances[i].uid === uid) return this._battle.wallInstances[i];
    }
    return null;
  },

  _initWallInstances: function () {
    this._battle.wallInstances = [];
    for (var i = 0; i < this._state.towers.length; i++) {
      var tower = this._state.towers[i];
      var towerData = TDTowerData[tower.type];
      if (!towerData || towerData.category !== 'wall') continue;

      var stats = this.getTowerStats(tower.uid);
      this._battle.wallInstances.push({
        uid: tower.uid,
        gridX: tower.gridX,
        gridY: tower.gridY,
        hp: stats.hp,
        maxHp: stats.hp
      });
    }
  },

  _getCollisionGrid: function () {
    if (typeof TownManager !== 'undefined' && TownManager.getCollisionGrid) {
      return TownManager.getCollisionGrid();
    }
    return null;
  },

  _getFullCollisionGrid: function () {
    var baseGrid = this._getCollisionGrid();
    if (!baseGrid) return null;

    // Deep copy and add placed towers
    var grid = [];
    for (var y = 0; y < baseGrid.length; y++) {
      grid[y] = [];
      for (var x = 0; x < baseGrid[y].length; x++) {
        grid[y][x] = baseGrid[y][x];
      }
    }

    // Mark town hall as walkable for enemy pathfinding (enemies need to reach it)
    var thPos = this._getTownHallGridPos();
    if (thPos && thPos.y >= 0 && thPos.y < grid.length && thPos.x >= 0 && thPos.x < grid[0].length) {
      grid[thPos.y][thPos.x] = 0;
    }

    // Add existing towers as obstacles (walls and attack towers occupy grid)
    for (var i = 0; i < this._state.towers.length; i++) {
      var t = this._state.towers[i];
      var td = TDTowerData[t.type];
      // Walls and ground-occupying buildings block ground movement
      if (td && (td.category === 'wall' || td.category === 'attack' || td.category === 'support')) {
        if (t.gridY >= 0 && t.gridY < grid.length && t.gridX >= 0 && t.gridX < grid[0].length) {
          grid[t.gridY][t.gridX] = 1;
        }
      }
    }

    return grid;
  },

  _getTownHallGridPos: function () {
    // Try to find town hall from TownManager/TownWorld
    if (typeof TownWorld !== 'undefined' && TownWorld._placements) {
      var placements = TownWorld._placements;
      for (var id in placements) {
        if (placements.hasOwnProperty(id) && id === 'town_hall') {
          return { x: placements[id].x, y: placements[id].y };
        }
      }
    }
    // Fallback: center of map
    var grid = this._getCollisionGrid();
    if (grid && grid.length > 0) {
      return { x: Math.floor(grid[0].length / 2), y: Math.floor(grid.length / 2) };
    }
    return { x: 16, y: 16 };
  }
};
