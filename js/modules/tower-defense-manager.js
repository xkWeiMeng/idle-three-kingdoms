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
      towers: [],
      wave: { current: 1, highest: 0, townHallHp: 0, townHallMaxHp: 0 },
      assignedHeroes: [],
      heroDeployments: [],
      stats: { totalWavesCleared: 0, totalKills: 0, totalGoldEarned: 0 },
      tutorialSeen: false,
      // 章节/关卡进度
      chapter: { current: 1, highestCleared: 0 },
      stageProgress: {},   // 'ch_st' → { cleared: true, stars: 0-3 }
      stamina: { current: 12, lastRecover: Date.now() },
      towerEvolutions: {},
      practiceMode: false
    };
  },

  init: function (saved) {
    var data = (saved && saved.towerDefense) ? saved.towerDefense : null;
    if (data) {
      this._state = {
        unlocked: !!data.unlocked,
        towers: data.towers || [],
        wave: data.wave || { current: 1, highest: 0, townHallHp: 0, townHallMaxHp: 0 },
        assignedHeroes: data.assignedHeroes || [],
        heroDeployments: data.heroDeployments || [],
        stats: data.stats || { totalWavesCleared: 0, totalKills: 0, totalGoldEarned: 0 },
        tutorialSeen: !!data.tutorialSeen,
        chapter: data.chapter || { current: 1, highestCleared: 0 },
        stageProgress: data.stageProgress || {},
        stamina: data.stamina || { current: 12, lastRecover: Date.now() },
        towerEvolutions: data.towerEvolutions || {},
        practiceMode: false
      };
    } else {
      this._state = this._defaultState();
    }

    // 存档迁移：dailyChallenges → stamina
    if (data && data.dailyChallenges && !data.stamina) {
      var remaining = Math.max(0, 12 - (data.dailyChallenges.used || 0));
      this._state.stamina = { current: remaining, lastRecover: Date.now() };
    }

    // 离线体力恢复
    this._recoverOfflineStamina();

    // 初始化战斗运行时
    this._battle = this._defaultBattle();
    this._inDefenseMode = false;
    this._towerRuntime = {};
    this._heroSkillTimers = {};
    this._currentStage = null;

    // 初始化城主府 HP
    this._initTownHallHp();

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

  /** 根据塔防最高波次计算永久战斗加成 */
  getPermanentBattleBuff: function () {
    if (!this._state || !this._state.unlocked) return null;
    var hw = (this._state.wave && this._state.wave.highest) || 0;
    if (hw <= 0) return null;
    // 每5波：ATK+1%, DEF+1%, HP+0.5%
    return {
      atkPercent: Math.floor(hw / 5) * 0.01,
      defPercent: Math.floor(hw / 5) * 0.01,
      hpPercent:  Math.floor(hw / 5) * 0.005,
      label: '城防加成(波' + hw + ')',
      highestWave: hw
    };
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
    this._currentStage = null;
    this._stopBattleLoop();
    return { needConfirm: false };
  },

  forceExitDefenseMode: function () {
    this._inDefenseMode = false;
    this._currentStage = null;
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
    // 使用 TDTowerCapacity 查表，默认 8
    if (typeof TDTowerCapacity !== 'undefined' && TDTowerCapacity[townHallLevel]) {
      return TDTowerCapacity[townHallLevel];
    }
    return 8 + Math.max(0, townHallLevel - 3) * 3;
  },

  canBuildTower: function (typeId, gridX, gridY) {
    // 检查是否解锁
    if (!this._state.unlocked) return { ok: false, reason: '城防系统未解锁' };

    // 检查塔类型是否存在
    var towerData = TDTowerData[typeId];
    if (!towerData) return { ok: false, reason: '未知的塔类型' };

    // 检查城主府等级解锁
    var townHallLevel = 0;
    if (typeof TownManager !== 'undefined' && TownManager.getBuildingLevel) {
      townHallLevel = TownManager.getBuildingLevel('town_hall');
    }
    if (towerData.requiredTownHall && townHallLevel < towerData.requiredTownHall) {
      return { ok: false, reason: '需要城主府 Lv.' + towerData.requiredTownHall + '（当前 Lv.' + townHallLevel + '）' };
    }

    // 检查容量
    if (this._state.towers.length >= this.getMaxTowers()) {
      return { ok: false, reason: '防御塔已达上限 (' + this.getMaxTowers() + ')' };
    }

    // 检查资源
    if (typeof ResourceManager !== 'undefined' && !ResourceManager.canAffordMultiple(towerData.cost)) {
      return { ok: false, reason: '资源不足' };
    }

    // 检查网格位置是否被占用（支持多格塔）
    var grid = this._getCollisionGrid();
    var towerSize = TDGetTowerSize(typeId);
    for (var sy = 0; sy < towerSize.h; sy++) {
      for (var sx = 0; sx < towerSize.w; sx++) {
        var cx = gridX + sx;
        var cy = gridY + sy;
        if (grid && grid[cy] && grid[cy][cx] !== 0) {
          return { ok: false, reason: '无法放置：该位置已占用' };
        }
      }
    }

    // 检查是否已有塔占用该位置（含多格塔）
    for (var i = 0; i < this._state.towers.length; i++) {
      var t = this._state.towers[i];
      var tSize = TDGetTowerSize(t.type);
      // 检查两个矩形是否重叠
      if (gridX < t.gridX + tSize.w && gridX + towerSize.w > t.gridX &&
          gridY < t.gridY + tSize.h && gridY + towerSize.h > t.gridY) {
        return { ok: false, reason: '无法放置：该位置已占用' };
      }
    }

    // 封路检测 — 只对墙体/非空中目标的建筑做检测
    var target = this._getTownHallGridPos();
    var spawnPoints = this._getSpawnPoints();
    if (target && spawnPoints.length > 0) {
      var testGrid = this._getFullCollisionGrid();
      if (testGrid) {
        // 标记新塔要占用的所有格子
        for (var ty = 0; ty < towerSize.h; ty++) {
          for (var tx = 0; tx < towerSize.w; tx++) {
            var bx = gridX + tx;
            var by = gridY + ty;
            if (by >= 0 && by < testGrid.length && bx >= 0 && bx < testGrid[0].length) {
              testGrid[by][bx] = 1;
            }
          }
        }
        // 检查所有出生点是否还能到达城主府
        for (var si = 0; si < spawnPoints.length; si++) {
          var sp = spawnPoints[si];
          if (Pathfinding.findPath(testGrid, sp, target) === null) {
            return { ok: false, reason: '无法放置：不能完全封锁敌人路径' };
          }
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

  // 由 TownManager 建造完成后调用 — 跳过资源检查（已在排队时扣除）
  buildTowerDirect: function (typeId, gridX, gridY) {
    var towerData = TDTowerData[typeId];
    if (!towerData) return { ok: false, reason: '未知塔类型' };

    var tower = {
      uid: Utils.uid(),
      type: typeId,
      level: 1,
      gridX: gridX,
      gridY: gridY
    };
    this._state.towers.push(tower);

    this._towerRuntime[tower.uid] = {
      currentTarget: null,
      lastAttackTime: 0,
      kills: 0
    };

    EventBus.emit('td:tower_built', { tower: { uid: tower.uid, type: typeId, gridX: gridX, gridY: gridY } });
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

  // ========== 武将主动战斗系统 ==========

  // 武将运行时状态（非持久化）
  _heroRuntime: {},  // heroUid -> { x, y, hp, maxHp, targetEnemy, lastAttackTime, skillCooldown, status }

  // 部署武将到地图位置
  deployHero: function (heroUid, gridX, gridY) {
    if (!this._state.unlocked) return { ok: false, reason: '城防系统未解锁' };

    if (typeof HeroManager === 'undefined' || !HeroManager.getHeroStats) {
      return { ok: false, reason: '武将系统不可用' };
    }
    var heroStats = HeroManager.getHeroStats(heroUid);
    if (!heroStats) return { ok: false, reason: '武将不存在' };

    // 检查是否在出征队伍
    if (typeof HeroManager !== 'undefined' && HeroManager.isInTeam && HeroManager.isInTeam(heroUid)) {
      return { ok: false, reason: '该武将在出征队伍中' };
    }

    // 检查上限
    var isAlreadyAssigned = this._state.assignedHeroes.indexOf(heroUid) !== -1;
    if (!isAlreadyAssigned && this._state.assignedHeroes.length >= TD_CONSTANTS.MAX_ASSIGNED_HEROES) {
      return { ok: false, reason: '防守武将已满（最多' + TD_CONSTANTS.MAX_ASSIGNED_HEROES + '名）' };
    }

    // 添加到 assignedHeroes
    if (!isAlreadyAssigned) {
      this._state.assignedHeroes.push(heroUid);
    }

    // 记录部署位置
    var deployment = null;
    for (var i = 0; i < this._state.heroDeployments.length; i++) {
      if (this._state.heroDeployments[i].uid === heroUid) {
        deployment = this._state.heroDeployments[i];
        break;
      }
    }
    if (deployment) {
      deployment.gridX = gridX;
      deployment.gridY = gridY;
    } else {
      this._state.heroDeployments.push({ uid: heroUid, gridX: gridX, gridY: gridY });
    }

    // 初始化运行时状态
    var TILE = TD_CONSTANTS.TILE_SIZE;
    this._heroRuntime[heroUid] = {
      x: gridX * TILE + TILE / 2,
      y: gridY * TILE + TILE / 2,
      homeX: gridX * TILE + TILE / 2,
      homeY: gridY * TILE + TILE / 2,
      hp: heroStats.hp * 2,
      maxHp: heroStats.hp * 2,
      targetEnemy: null,
      lastAttackTime: 0,
      skillCooldown: 0,
      status: 'idle',
      patrolRange: 4 * TILE
    };
    this._heroSkillTimers[heroUid] = 0;

    EventBus.emit('td:hero_assigned', { heroUid: heroUid, gridX: gridX, gridY: gridY });
    return { ok: true };
  },

  // 获取武将的运行时数据（用于渲染）
  getHeroRuntime: function () {
    var result = [];
    for (var i = 0; i < this._state.assignedHeroes.length; i++) {
      var uid = this._state.assignedHeroes[i];
      var runtime = this._heroRuntime[uid];
      if (!runtime) continue;

      var heroStats = null;
      var heroTemplate = null;
      if (typeof HeroManager !== 'undefined' && HeroManager.getHeroStats) {
        heroStats = HeroManager.getHeroStats(uid);
      }
      if (typeof HeroManager !== 'undefined' && HeroManager.getAll) {
        var all = HeroManager.getAll();
        for (var j = 0; j < all.length; j++) {
          if (all[j].uid === uid) {
            if (typeof HeroManager.getTemplate === 'function') {
              heroTemplate = HeroManager.getTemplate(all[j].id);
            }
            break;
          }
        }
      }

      result.push({
        uid: uid,
        x: runtime.x,
        y: runtime.y,
        hp: runtime.hp,
        maxHp: runtime.maxHp,
        status: runtime.status,
        skillCooldown: runtime.skillCooldown,
        name: heroStats ? heroStats.name : '武将',
        faction: heroTemplate ? heroTemplate.faction : 'other',
        level: heroStats ? heroStats.level : 1
      });
    }
    return result;
  },

  // 初始化所有武将的运行时状态（进入防守模式/开始波次时调用）
  _initHeroRuntime: function () {
    var TILE = TD_CONSTANTS.TILE_SIZE;
    for (var i = 0; i < this._state.assignedHeroes.length; i++) {
      var uid = this._state.assignedHeroes[i];
      var deploy = null;
      for (var d = 0; d < this._state.heroDeployments.length; d++) {
        if (this._state.heroDeployments[d].uid === uid) {
          deploy = this._state.heroDeployments[d];
          break;
        }
      }

      var heroStats = null;
      if (typeof HeroManager !== 'undefined' && HeroManager.getHeroStats) {
        heroStats = HeroManager.getHeroStats(uid);
      }

      var gx = deploy ? deploy.gridX : 16;
      var gy = deploy ? deploy.gridY : 16;
      var heroHp = heroStats ? heroStats.hp * 2 : 500;

      this._heroRuntime[uid] = {
        x: gx * TILE + TILE / 2,
        y: gy * TILE + TILE / 2,
        homeX: gx * TILE + TILE / 2,
        homeY: gy * TILE + TILE / 2,
        hp: heroHp,
        maxHp: heroHp,
        targetEnemy: null,
        lastAttackTime: 0,
        skillCooldown: 0,
        status: 'idle',
        patrolRange: 4 * TILE
      };
      this._heroSkillTimers[uid] = 0;
    }
  },

  // 武将战斗 Tick
  _tickHeroCombat: function (dt) {
    for (var i = 0; i < this._state.assignedHeroes.length; i++) {
      var uid = this._state.assignedHeroes[i];
      var hero = this._heroRuntime[uid];
      if (!hero || hero.status === 'retreated') continue;

      var heroStats = null;
      if (typeof HeroManager !== 'undefined' && HeroManager.getHeroStats) {
        heroStats = HeroManager.getHeroStats(uid);
      }
      if (!heroStats) continue;

      // 蓄力系统
      if (typeof hero.chargeProgress === 'undefined') {
        hero.chargeProgress = 0;
        hero.chargeReady = false;
        hero.autoReleaseTimer = 0;
      }
      var chargeTime = (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.SKILL_CHARGE.BASE_CHARGE_TIME : 10;
      var autoTimeout = (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.SKILL_CHARGE.AUTO_RELEASE_TIMEOUT : 5;

      if (!hero.chargeReady) {
        hero.chargeProgress += dt;
        if (hero.chargeProgress >= chargeTime) {
          hero.chargeReady = true;
          hero.autoReleaseTimer = autoTimeout;
          EventBus.emit('td:skill_charged', { heroUid: uid, ready: true });
        }
      } else {
        hero.autoReleaseTimer -= dt;
      }

      // 寻找最近的敌人（在巡逻范围内）
      var target = this._findNearestEnemy(hero.x, hero.y, hero.patrolRange);

      if (target) {
        hero.targetEnemy = target.uid;
        var dx = target.x - hero.x;
        var dy = target.y - hero.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        var attackRange = 1.5 * TD_CONSTANTS.TILE_SIZE;

        if (dist > attackRange) {
          // 移动向目标
          hero.status = 'moving';
          var moveSpeed = 2 * TD_CONSTANTS.TILE_SIZE; // 2格/秒
          var moveAmount = moveSpeed * dt;
          if (moveAmount < dist) {
            hero.x += (dx / dist) * moveAmount;
            hero.y += (dy / dist) * moveAmount;
          } else {
            hero.x = target.x;
            hero.y = target.y;
          }
        } else {
          // 攻击
          hero.status = 'attacking';
          hero.lastAttackTime += dt;

          // 普通攻击每秒1次
          if (hero.lastAttackTime >= 1.0) {
            hero.lastAttackTime -= 1.0;
            var damage = this._calcDamage(heroStats.atk, target.def);
            target.hp -= damage;

            // 添加弹道效果
            if (!this._battle.projectiles) this._battle.projectiles = [];
            this._battle.projectiles.push({
              type: 'hero_attack',
              x: hero.x, y: hero.y,
              targetX: target.x, targetY: target.y,
              progress: 0, speed: 5
            });

            if (target.hp <= 0) {
              this._killEnemy(target, null);
              hero.targetEnemy = null;
            }
          }

          // 自动释放技能（蓄满后超时 OR 手动释放在 manualReleaseSkill 中处理）
          if (hero.chargeReady && hero.autoReleaseTimer <= 0) {
            hero.manualRelease = false;
            this._heroUseSkill(uid, hero, heroStats, target);
            hero.chargeProgress = 0;
            hero.chargeReady = false;
            hero.autoReleaseTimer = 0;
            EventBus.emit('td:skill_released', { heroUid: uid, manual: false });
          }
        }
      } else {
        // 没有敌人 — 返回巡逻点
        hero.targetEnemy = null;
        var homeDx = hero.homeX - hero.x;
        var homeDy = hero.homeY - hero.y;
        var homeDist = Math.sqrt(homeDx * homeDx + homeDy * homeDy);

        if (homeDist > TD_CONSTANTS.TILE_SIZE * 0.5) {
          hero.status = 'moving';
          var homeSpeed = 1.5 * TD_CONSTANTS.TILE_SIZE;
          var homeMove = homeSpeed * dt;
          if (homeMove < homeDist) {
            hero.x += (homeDx / homeDist) * homeMove;
            hero.y += (homeDy / homeDist) * homeMove;
          } else {
            hero.x = hero.homeX;
            hero.y = hero.homeY;
          }
        } else {
          hero.status = 'idle';
        }
      }

      // 敌人对武将的伤害（近战范围内的敌人）
      this._heroTakeDamage(hero, heroStats, dt);
    }
  },

  _findNearestEnemy: function (x, y, range) {
    var nearest = null;
    var nearestDist = range;

    for (var i = 0; i < this._battle.enemies.length; i++) {
      var e = this._battle.enemies[i];
      if (e.status === 'dead' || e.hp <= 0) continue;

      var dx = e.x - x;
      var dy = e.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist) {
        nearest = e;
        nearestDist = dist;
      }
    }
    return nearest;
  },

  _heroUseSkill: function (uid, hero, heroStats, target) {
    var heroInstance = null;
    var template = null;
    if (typeof HeroManager !== 'undefined' && HeroManager.getAll) {
      var all = HeroManager.getAll();
      for (var j = 0; j < all.length; j++) {
        if (all[j].uid === uid) {
          heroInstance = all[j];
          if (typeof HeroManager.getTemplate === 'function') {
            template = HeroManager.getTemplate(all[j].id);
          }
          break;
        }
      }
    }

    if (!template || !template.skill) return;
    var skill = template.skill;
    var multiplier = skill.multiplier || 1.5;
    var skillDmg = heroStats.atk * multiplier;
    // 手动释放伤害加成
    if (hero.manualRelease && typeof TD_ENHANCEMENT !== 'undefined') {
      skillDmg *= TD_ENHANCEMENT.SKILL_CHARGE.MANUAL_SKILL_BONUS;
    }
    var cooldown = skill.cooldown || 3;

    hero.skillCooldown = cooldown;

    // 添加技能特效
    if (!this._battle.skillEffects) this._battle.skillEffects = [];

    if (skill.type === 'damage') {
      // 单体伤害
      target.hp -= skillDmg;
      this._battle.skillEffects.push({
        type: 'projectile_hit',
        x: hero.x, y: hero.y,
        targetX: target.x, targetY: target.y,
        progress: 0, duration: 0.5
      });
      if (target.hp <= 0) this._killEnemy(target, null);

    } else if (skill.type === 'aoe') {
      // 范围伤害
      var aoeRange = 2 * TD_CONSTANTS.TILE_SIZE;
      this._battle.skillEffects.push({
        type: 'aoe_ring',
        x: target.x, y: target.y,
        progress: 0, duration: 0.6, radius: aoeRange
      });
      for (var e = 0; e < this._battle.enemies.length; e++) {
        var enemy = this._battle.enemies[e];
        if (enemy.status === 'dead') continue;
        var dx = enemy.x - target.x;
        var dy = enemy.y - target.y;
        if (Math.sqrt(dx * dx + dy * dy) <= aoeRange) {
          enemy.hp -= skillDmg * 0.6;
          if (enemy.hp <= 0) this._killEnemy(enemy, null);
        }
      }

    } else if (skill.type === 'heal') {
      // 治疗自己
      hero.hp = Math.min(hero.maxHp, hero.hp + skillDmg);
      this._battle.skillEffects.push({
        type: 'heal_glow',
        x: hero.x, y: hero.y,
        progress: 0, duration: 0.5
      });

    } else {
      // 默认：单体伤害
      target.hp -= skillDmg;
      this._battle.skillEffects.push({
        type: 'slash_arc',
        x: hero.x, y: hero.y,
        progress: 0, duration: 0.4
      });
      if (target.hp <= 0) this._killEnemy(target, null);
    }
  },

  _heroTakeDamage: function (hero, heroStats, dt) {
    // 附近的敌人对武将造成伤害
    var damageRange = 1.0 * TD_CONSTANTS.TILE_SIZE;
    var totalDmg = 0;

    for (var i = 0; i < this._battle.enemies.length; i++) {
      var e = this._battle.enemies[i];
      if (e.status === 'dead' || e.hp <= 0) continue;

      var dx = e.x - hero.x;
      var dy = e.y - hero.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < damageRange) {
        // 每秒受到附近敌人ATK的伤害
        totalDmg += e.atk * 0.3 * dt;
      }
    }

    if (totalDmg > 0) {
      var heroDef = heroStats.def || 0;
      var actualDmg = totalDmg * (1 - heroDef / (heroDef + 200));
      hero.hp -= actualDmg;

      if (hero.hp <= 0) {
        hero.hp = 0;
        hero.status = 'retreated';
        EventBus.emit('toast:show', { type: 'warning', message: (heroStats.name || '武将') + ' 已撤退！' });
      }
    }
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
      wallInstances: [],  // runtime wall hp tracking
      projectiles: [],
      skillEffects: [],
      // Phase 1 增强
      speedMultiplier: 1.0,
      isPractice: false,
      damageTexts: [],
      killStreak: { count: 0, timer: 0, lastLevel: 0 },
      emergencySkills: {
        arrow_rain: { cd: 0 },
        battle_charge: { cd: 0, active: false, timer: 0 },
        iron_wall: { cd: 0, active: false, timer: 0 }
      },
      battleChargeActive: false,
      battleChargeTimer: 0,
      ironWallActive: false,
      ironWallTimer: 0,
      dyingEnemies: []
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

    // 原始dt（用于UI动画，不受速度影响）
    var rawDt = dt;
    // 速度倍率
    dt *= this._battle.speedMultiplier;

    // Cap dt to avoid huge jumps
    if (typeof TD_ENHANCEMENT !== 'undefined' && TD_ENHANCEMENT.SPEED) {
      if (dt > TD_ENHANCEMENT.SPEED.MAX_SCALED_DELTA) dt = TD_ENHANCEMENT.SPEED.MAX_SCALED_DELTA;
    } else {
      if (dt > 0.1) dt = 0.1;
    }

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
      this._tickHeroCombat(dt);
      // 更新弹道
      this._tickProjectiles(dt);
      // 更新技能特效
      this._tickSkillEffects(dt);
      // 更新攻城器械特殊行为
      this._tickSiegeEquipment(dt);
      // Phase 1 增强系统
      this._tickDamageTexts(rawDt);
      this._tickKillStreak(dt);
      this._tickDyingEnemies(rawDt);
      this._tickEmergencyBuffs(dt);
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

    // 获取波次数据（优先章节关卡）
    var waveData;
    if (this._currentStage) {
      waveData = this._getStageWaveData();
    } else {
      waveData = TDWaveTable[this._state.wave.current];
    }
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
      var waveData;
      if (this._currentStage) {
        waveData = this._getStageWaveData();
      } else {
        waveData = TDWaveTable[this._state.wave.current];
      }
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

    // Siege ram: wall_damage_x3 (攻城车)
    if (enemy.special === 'wall_damage_x3') {
      dmg *= 3;
    }
    // 保留旧的 wall_damage_x2 兼容
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
    var damage = Math.floor(enemy.hp * 0.1 + enemy.atk);
    var enemyData = TDEnemyData[enemy.type];
    // 冲城锤对城主府伤害×5
    if (enemyData && enemyData.special === 'townhall_damage_x5') {
      damage *= 5;
    }
    // 保留旧的 flying_tower_damage_x2 兼容
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
      if (towerData.atk <= 0 && towerData.special !== 'detect' && towerData.special !== 'detect_atk_buff_20' && towerData.special !== 'detect_atk_buff_15') continue;

      var stats = this.getTowerStats(tower.uid);
      if (!stats || stats.attackSpeed <= 0) continue;

      var attackInterval = 1 / stats.attackSpeed;
      if (this._battle.battleChargeActive) {
        var chargeBonus = (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.EMERGENCY_SKILLS.BATTLE_CHARGE.aspdMultiplier : 1.5;
        attackInterval /= chargeBonus;
      }
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

        // 火油塔持续区域灼烧
        if (towerData.special === 'burn_area_3s') {
          // 对射程内所有地面敌人施加灼烧
          // 已在常规攻击中处理伤害，此处添加灼烧状态
          if (targets.length > 0) {
            for (var bt = 0; bt < targets.length; bt++) {
              targets[bt].burnTimer = 3;
              targets[bt].burnDps = stats.atk * 0.3;
            }
          }
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

      if (towerData.special === 'detect' || towerData.special === 'detect_atk_buff_20' || towerData.special === 'detect_atk_buff_15') {
        var stats = this.getTowerStats(tower.uid);
        var tc = this._getTowerCenter(tower);
        var towerCenterX = tc.x;
        var towerCenterY = tc.y;
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
    var tc = this._getTowerCenter(tower);
    var towerCenterX = tc.x;
    var towerCenterY = tc.y;
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
    this._addDamageText(enemy.x, enemy.y, Math.floor(damage), 'normal');

    // 添加攻击弹道
    if (!this._battle.projectiles) this._battle.projectiles = [];
    var tc = this._getTowerCenter(tower);
    var projType = 'arrow';
    if (towerData.special === 'splash_1' || towerData.special === 'splash_1.5') projType = 'stone';
    if (towerData.special === 'multi_2') projType = 'multi_bolt';
    if (towerData.special === 'armor_pierce_30') projType = 'bolt';
    if (towerData.special === 'burn_area_3s') projType = 'oil_splash';
    this._battle.projectiles.push({
      type: projType,
      x: tc.x, y: tc.y,
      targetX: enemy.x, targetY: enemy.y,
      progress: 0, speed: 4
    });

    // Splash damage
    if (towerData.special === 'splash_1' || towerData.special === 'homing_splash_1') {
      this._handleSplash(enemy, damage, 1);
    }
    if (towerData.special === 'splash_1.5') {
      this._handleSplash(enemy, damage, 1.5);
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
    var tc = this._getTowerCenter(tower);
    var towerCenterX = tc.x;
    var towerCenterY = tc.y;

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

      var tc = this._getTowerCenter(tower);
      var towerCenterX = tc.x;
      var towerCenterY = tc.y;

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
      var tc = this._getTowerCenter(tower);
      var towerCenterX = tc.x;
      var towerCenterY = tc.y;

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

  // 弹道系统
  _tickProjectiles: function (dt) {
    if (!this._battle.projectiles) return;
    for (var i = this._battle.projectiles.length - 1; i >= 0; i--) {
      var p = this._battle.projectiles[i];
      p.progress += p.speed * dt;
      if (p.progress >= 1.0) {
        this._battle.projectiles.splice(i, 1);
      }
    }
  },

  // 技能特效系统
  _tickSkillEffects: function (dt) {
    if (!this._battle.skillEffects) return;
    for (var i = this._battle.skillEffects.length - 1; i >= 0; i--) {
      var e = this._battle.skillEffects[i];
      e.progress += dt / e.duration;
      if (e.progress >= 1.0) {
        this._battle.skillEffects.splice(i, 1);
      }
    }
  },

  // 攻城器械特殊行为
  _tickSiegeEquipment: function (dt) {
    for (var i = 0; i < this._battle.enemies.length; i++) {
      var enemy = this._battle.enemies[i];
      if (enemy.status === 'dead') continue;

      // 云梯：无视墙体
      if (enemy.special === 'ignore_wall' && enemy.status === 'attacking_wall') {
        enemy.status = 'moving';
        enemy.wallTarget = null;
        // 重新计算路径（忽略墙体）
        var target = this._getTownHallGridPos();
        if (target) {
          // 云梯直线移动到城主府
          enemy.path = [{ x: Math.floor(enemy.x / TD_CONSTANTS.TILE_SIZE), y: Math.floor(enemy.y / TD_CONSTANTS.TILE_SIZE) }, target];
          enemy.pathIndex = 0;
        }
      }

      // 投石车：远程攻击建筑
      if (enemy.special === 'ranged_attack_building') {
        var thPos = this._getTownHallGridPos();
        if (thPos) {
          var thX = thPos.x * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
          var thY = thPos.y * TD_CONSTANTS.TILE_SIZE + TD_CONSTANTS.TILE_SIZE / 2;
          var distToTH = Math.sqrt((enemy.x - thX) * (enemy.x - thX) + (enemy.y - thY) * (enemy.y - thY));

          // 在射程内（5格）停下来攻击
          if (distToTH < 5 * TD_CONSTANTS.TILE_SIZE && enemy.status === 'moving') {
            enemy.status = 'ranged_attacking';
          }

          if (enemy.status === 'ranged_attacking') {
            if (!enemy._rangedTimer) enemy._rangedTimer = 0;
            enemy._rangedTimer += dt;
            if (enemy._rangedTimer >= 3) { // 每3秒攻击一次
              enemy._rangedTimer -= 3;
              // 对城主府造成伤害
              this._damageTownHall(enemy.atk);
              // 弹道特效
              if (!this._battle.projectiles) this._battle.projectiles = [];
              this._battle.projectiles.push({
                type: 'stone',
                x: enemy.x, y: enemy.y,
                targetX: thX, targetY: thY,
                progress: 0, speed: 1.5
              });
            }
          }
        }
      }
    }
  },

  _killEnemy: function (enemy, killerTowerUid) {
    enemy.status = 'dying';
    enemy.hp = 0;
    enemy.deathTimer = 0.3;
    this._state.stats.totalKills++;

    if (killerTowerUid && this._towerRuntime[killerTowerUid]) {
      this._towerRuntime[killerTowerUid].kills++;
    }

    // 连杀更新
    this._updateKillStreak();

    // 生成击杀飘字
    this._addDamageText(enemy.x, enemy.y - 10, '击杀', 'kill');

    // 移到dying队列
    if (!this._battle.dyingEnemies) this._battle.dyingEnemies = [];
    this._battle.dyingEnemies.push(enemy);

    EventBus.emit('td:enemy_killed', { enemyUid: enemy.uid, killerTowerUid: killerTowerUid });

    // 从活跃敌人中移除
    this._battle.enemies = this._battle.enemies.filter(function (e) { return e.uid !== enemy.uid; });
  },

  _calcRadarBonus: function (tower) {
    var bonus = 0;
    for (var i = 0; i < this._state.towers.length; i++) {
      var other = this._state.towers[i];
      if (other.uid === tower.uid) continue;
      var otherData = TDTowerData[other.type];
      if (!otherData) continue;
      // 烽火台增伤
      if (otherData.special === 'detect_atk_buff_15') {
        var otherSize = TDGetTowerSize(other.type);
        var towerSize = TDGetTowerSize(tower.type);
        var dx = (other.gridX + otherSize.w / 2) - (tower.gridX + towerSize.w / 2);
        var dy = (other.gridY + otherSize.h / 2) - (tower.gridY + towerSize.h / 2);
        var dist = Math.sqrt(dx * dx + dy * dy);
        var radarRange = otherData.range;
        if (dist <= radarRange) {
          bonus += 0.15;
        }
      }
    }
    return bonus;
  },

  // ========== T11: 波次生命周期 ==========
  // State machine: idle → prep → active → settlement → idle
  //                                     → failed → idle

  startWave: function (options) {
    if (!this._state.unlocked || !this._inDefenseMode) return false;
    if (this._battle.active) return false;

    var isPractice = options && options.practice;

    if (!isPractice) {
      // 消耗体力
      var cost = (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.STAMINA.COST_NORMAL : 1;
      if (this._state.stamina.current < cost) {
        EventBus.emit('toast:show', { type: 'warning', message: '体力不足，请稍后再试' });
        return false;
      }
      this._state.stamina.current -= cost;
      this._state.stamina.lastRecover = this._state.stamina.lastRecover || Date.now();
      EventBus.emit('td:stamina_changed', { current: this._state.stamina.current, max: (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.STAMINA.MAX : 12 });
    } else {
      // 练习模式：检查关卡是否已通关
      if (this._currentStage) {
        var stageKey = this._currentStage.chapter + '_' + this._currentStage.stage;
        if (!this._state.stageProgress[stageKey] || !this._state.stageProgress[stageKey].cleared) {
          EventBus.emit('toast:show', { type: 'warning', message: '需要先通关此关卡才能练习' });
          return false;
        }
      }
    }

    this._battle.isPractice = !!isPractice;
    if (isPractice) EventBus.emit('td:practice_mode', { enabled: true });

    // Init town hall HP for this wave
    this._initTownHallHp();

    this._battle.active = true;
    this._battle.phase = 'prep';
    this._battle.prepTimer = TD_CONSTANTS.PREP_TIME;
    this._battle.enemies = [];
    this._battle.spawnQueue = [];
    this._battle.spawnTimer = 0;
    // 重置 Phase 1 运行时
    this._battle.damageTexts = [];
    this._battle.killStreak = { count: 0, timer: 0, lastLevel: 0 };
    this._battle.dyingEnemies = [];
    this._battle.speedMultiplier = 1.0;

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

    // 优先使用章节/关卡数据
    var waveData;
    var waveNum;
    if (this._currentStage) {
      waveData = this._getStageWaveData();
      waveNum = this._currentStage.chapter * 100 + this._currentStage.stage;
    } else {
      waveNum = this._state.wave.current;
      waveData = TDWaveTable[waveNum];
    }
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

    // 初始化武将运行时
    this._initHeroRuntime();
    // 初始化弹道和特效数组
    this._battle.projectiles = [];
    this._battle.skillEffects = [];
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
    this._battle.phase = 'settlement';

    var rewards;
    var waveNum;

    if (this._currentStage) {
      // 章节/关卡模式
      rewards = this._getStageRewards();
      rewards.gold = Math.floor(rewards.gold * TD_CONSTANTS.MANUAL_GOLD_BONUS);
      rewards.exp = Math.floor(rewards.exp * TD_CONSTANTS.MANUAL_EXP_BONUS);
      waveNum = this._currentStage.chapter * 100 + this._currentStage.stage;
      if (!this._battle.isPractice) {
        this._clearCurrentStage();
      }
    } else {
      waveNum = this._state.wave.current;
      rewards = this._calcRewards(waveNum, true);
    }

    // 练习模式奖励折扣
    var rewardMultiplier = 1.0;
    if (this._battle.isPractice) {
      rewardMultiplier = (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.PRACTICE.REWARD_RATIO : 0.25;
      // 练习模式无装备/玉石掉落
      delete rewards.jade;
      delete rewards.equipDrop;
    }

    // Grant rewards
    this._grantRewards(rewards, rewardMultiplier);

    // Update stats
    this._state.stats.totalWavesCleared++;
    if (!this._currentStage) {
      this._state.wave.highest = Math.max(this._state.wave.highest, waveNum);
      if (waveNum < TD_CONSTANTS.MAX_WAVE) {
        this._state.wave.current = waveNum + 1;
      }
    }

    EventBus.emit('td:wave_cleared', {
      wave: waveNum,
      rewards: rewards,
      auto: false,
      chapter: this._currentStage ? this._currentStage.chapter : null,
      stage: this._currentStage ? this._currentStage.stage : null
    });

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

    // 体力恢复
    this._tickStamina();

    // 自动防守：非防守模式 + 有塔 + 已解锁
    if (!this._inDefenseMode && this._state.unlocked && this._state.towers.length > 0) {
      this._autoDefend(dt);
    }
  },

  // ========== 章节/关卡系统 ==========

  // 获取当前可用章节列表
  getChapters: function () {
    var result = [];
    for (var ch = 1; ch <= 5; ch++) {
      var data = TDChapterData[ch];
      if (!data) continue;
      var unlocked = this._isChapterUnlocked(ch);
      var cleared = this._isChapterCleared(ch);
      result.push({
        id: ch,
        name: data.name,
        era: data.era,
        description: data.description,
        unlocked: unlocked,
        cleared: cleared,
        stages: this._getChapterStages(ch)
      });
    }
    return result;
  },

  _isChapterUnlocked: function (ch) {
    if (ch === 1) return this._state.unlocked;
    var data = TDChapterData[ch];
    if (!data || !data.unlockCondition) return false;
    if (data.unlockCondition.chapter && !this._isChapterCleared(data.unlockCondition.chapter)) return false;
    // 城主府等级要求替代科技时代
    if (data.unlockCondition.townHallLevel) {
      var townHallLevel = 0;
      if (typeof TownManager !== 'undefined' && TownManager.getBuildingLevel) {
        townHallLevel = TownManager.getBuildingLevel('town_hall');
      }
      if (townHallLevel < data.unlockCondition.townHallLevel) return false;
    }
    return true;
  },

  _isChapterCleared: function (ch) {
    var data = TDChapterData[ch];
    if (!data) return false;
    for (var s = 0; s < data.stages.length; s++) {
      var key = ch + '_' + data.stages[s].stage;
      if (!this._state.stageProgress[key] || !this._state.stageProgress[key].cleared) return false;
    }
    return true;
  },

  _getChapterStages: function (ch) {
    var data = TDChapterData[ch];
    if (!data) return [];
    var stages = [];
    for (var s = 0; s < data.stages.length; s++) {
      var sd = data.stages[s];
      var key = ch + '_' + sd.stage;
      var progress = this._state.stageProgress[key];
      stages.push({
        stage: sd.stage,
        name: sd.name,
        difficulty: sd.difficulty,
        isBoss: !!sd.isBoss,
        cleared: !!(progress && progress.cleared),
        stars: progress ? progress.stars : 0,
        // 前一关通过才能挑战（第1关直接可挑战）
        unlocked: sd.stage === 1 || !!(this._state.stageProgress[ch + '_' + (sd.stage - 1)] && this._state.stageProgress[ch + '_' + (sd.stage - 1)].cleared)
      });
    }
    return stages;
  },

  // 选择关卡并准备战斗
  selectStage: function (chapterId, stageNum) {
    if (!this._state.unlocked) return { ok: false, reason: '城防系统未解锁' };
    if (!this._isChapterUnlocked(chapterId)) return { ok: false, reason: '章节未解锁' };

    var chData = TDChapterData[chapterId];
    if (!chData) return { ok: false, reason: '章节不存在' };

    var stageData = null;
    for (var i = 0; i < chData.stages.length; i++) {
      if (chData.stages[i].stage === stageNum) { stageData = chData.stages[i]; break; }
    }
    if (!stageData) return { ok: false, reason: '关卡不存在' };

    // 检查前置关卡
    if (stageNum > 1) {
      var prevKey = chapterId + '_' + (stageNum - 1);
      if (!this._state.stageProgress[prevKey] || !this._state.stageProgress[prevKey].cleared) {
        return { ok: false, reason: '需要先通关前一关' };
      }
    }

    // 设置当前关卡（用于后续 startWave）
    this._currentStage = { chapter: chapterId, stage: stageNum, data: stageData };
    return { ok: true, stage: stageData };
  },

  // 当前关卡的波次数据（根据 difficulty 缩放）
  _getStageWaveData: function () {
    if (!this._currentStage) return null;
    var stageData = this._currentStage.data;
    var waveIndices = stageData.waves;
    var diffMul = stageData.difficulty;

    // 合并多个波次的敌人
    var allEnemies = [];
    for (var w = 0; w < waveIndices.length; w++) {
      var waveData = TDWaveTable[waveIndices[w]];
      if (!waveData) continue;
      for (var e = 0; e < waveData.enemies.length; e++) {
        allEnemies.push({ type: waveData.enemies[e].type, count: waveData.enemies[e].count });
      }
    }

    // 用第一个波次的基础属性 × difficulty 系数
    var baseWave = TDWaveTable[waveIndices[0]];
    if (!baseWave) return null;

    return {
      wave: 1,
      baseHp: Math.floor(baseWave.baseHp * diffMul),
      baseAtk: Math.floor(baseWave.baseAtk * diffMul),
      baseDef: Math.floor(baseWave.baseDef * diffMul),
      enemies: allEnemies,
      isBoss: !!stageData.isBoss
    };
  },

  // 获取关卡奖励（基于 difficulty）
  _getStageRewards: function () {
    if (!this._currentStage) return { gold: 0, exp: 0 };
    var diff = this._currentStage.data.difficulty;
    var ch = this._currentStage.chapter;

    var gold = Math.floor(100 * diff);
    var exp = Math.floor(30 * diff);
    var result = { gold: gold, exp: exp };

    // Boss 关卡额外奖励
    if (this._currentStage.data.isBoss) {
      result.gold = Math.floor(result.gold * 2);
      result.exp = Math.floor(result.exp * 1.5);
      result.jade = ch;
      result.equipChance = 0.3 + ch * 0.1;
      result.equipMinQuality = Math.min(5, 2 + ch);
    } else if (diff >= 10) {
      result.jadeChance = 0.1;
      result.jadeAmount = 1;
    }

    return result;
  },

  // 通关当前关卡
  _clearCurrentStage: function () {
    if (!this._currentStage) return;
    var key = this._currentStage.chapter + '_' + this._currentStage.stage;

    // 计算星级：按城主府剩余HP百分比
    var hpRatio = this._state.wave.townHallHp / this._state.wave.townHallMaxHp;
    var stars = hpRatio >= 0.8 ? 3 : (hpRatio >= 0.4 ? 2 : 1);

    var prev = this._state.stageProgress[key];
    this._state.stageProgress[key] = {
      cleared: true,
      stars: Math.max(stars, prev ? prev.stars : 0)
    };

    // 更新章节进度
    if (this._currentStage.chapter > this._state.chapter.highestCleared) {
      if (this._isChapterCleared(this._currentStage.chapter)) {
        this._state.chapter.highestCleared = this._currentStage.chapter;
      }
    }
  },

  // 体力信息（兼容旧接口名）
  getDailyChallengeInfo: function () {
    var sta = this.getStamina();
    return {
      used: sta.max - sta.current,
      limit: sta.max,
      remaining: sta.current
    };
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

  // 获取塔中心像素位置（支持多格塔）
  _getTowerCenter: function (tower) {
    var size = TDGetTowerSize(tower.type);
    var TILE = TD_CONSTANTS.TILE_SIZE;
    return {
      x: tower.gridX * TILE + size.w * TILE / 2,
      y: tower.gridY * TILE + size.h * TILE / 2
    };
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
        var tSize = TDGetTowerSize(t.type);
        for (var sy = 0; sy < tSize.h; sy++) {
          for (var sx = 0; sx < tSize.w; sx++) {
            var cx = t.gridX + sx;
            var cy = t.gridY + sy;
            if (cy >= 0 && cy < grid.length && cx >= 0 && cx < grid[0].length) {
              grid[cy][cx] = 1;
            }
          }
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
  },

  // ========== Phase 1: 速度控制 (CAP-TDE-01) ==========

  toggleSpeed: function () {
    if (!this._battle.active) return;
    var levels = (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.SPEED.LEVELS : [1.0, 2.0, 3.0];
    var current = this._battle.speedMultiplier;
    var idx = levels.indexOf(current);
    idx = (idx + 1) % levels.length;
    this._battle.speedMultiplier = levels[idx];
    EventBus.emit('td:speed_changed', { speed: this._battle.speedMultiplier });
  },

  getSpeed: function () {
    return this._battle ? this._battle.speedMultiplier : 1.0;
  },

  // ========== Phase 1: 体力系统 (CAP-TDE-02) ==========

  getStamina: function () {
    return {
      current: this._state.stamina.current,
      max: (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.STAMINA.MAX : 12
    };
  },

  _tickStamina: function () {
    if (typeof TD_ENHANCEMENT === 'undefined') return;
    var sta = this._state.stamina;
    var max = TD_ENHANCEMENT.STAMINA.MAX;
    if (sta.current >= max) {
      sta.lastRecover = Date.now();
      return;
    }
    var now = Date.now();
    var elapsed = (now - sta.lastRecover) / 60000; // minutes
    var interval = TD_ENHANCEMENT.STAMINA.RECOVER_INTERVAL_MIN;
    if (elapsed >= interval) {
      var recovered = Math.floor(elapsed / interval);
      sta.current = Math.min(max, sta.current + recovered * TD_ENHANCEMENT.STAMINA.RECOVER_AMOUNT);
      sta.lastRecover = now - ((elapsed % interval) * 60000);
      EventBus.emit('td:stamina_changed', { current: sta.current, max: max });
    }
  },

  _recoverOfflineStamina: function () {
    if (typeof TD_ENHANCEMENT === 'undefined') return;
    var sta = this._state.stamina;
    if (!sta.lastRecover) { sta.lastRecover = Date.now(); return; }
    var max = TD_ENHANCEMENT.STAMINA.MAX;
    if (sta.current >= max) return;
    var elapsed = (Date.now() - sta.lastRecover) / 60000;
    var interval = TD_ENHANCEMENT.STAMINA.RECOVER_INTERVAL_MIN;
    var recovered = Math.floor(elapsed / interval);
    if (recovered > 0) {
      sta.current = Math.min(max, sta.current + recovered * TD_ENHANCEMENT.STAMINA.RECOVER_AMOUNT);
      sta.lastRecover = Date.now();
    }
  },

  // ========== Phase 1: 飘字系统 (CAP-TDE-03) ==========

  _addDamageText: function (x, y, damage, type) {
    if (!this._battle.damageTexts) this._battle.damageTexts = [];
    var cfg = (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.DAMAGE_TEXT : { MERGE_WINDOW: 0.3, MAX_ONSCREEN: 15, DURATION: 0.8, FLOAT_DISTANCE: 30, RANDOM_OFFSET_X: 8 };

    // 合并窗口：相同位置附近 + 相同类型
    for (var i = 0; i < this._battle.damageTexts.length; i++) {
      var existing = this._battle.damageTexts[i];
      if (existing.type === type && existing.elapsed < cfg.MERGE_WINDOW) {
        var dx = existing.x - x;
        var dy = existing.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < TD_CONSTANTS.TILE_SIZE * 2) {
          if (typeof damage === 'number' && typeof existing.damage === 'number') {
            existing.damage += damage;
            existing.merged = (existing.merged || 1) + 1;
          }
          return;
        }
      }
    }

    // 超出上限移除最旧的
    while (this._battle.damageTexts.length >= cfg.MAX_ONSCREEN) {
      this._battle.damageTexts.shift();
    }

    var offsetX = (Math.random() - 0.5) * cfg.RANDOM_OFFSET_X * 2;
    this._battle.damageTexts.push({
      x: x + offsetX, y: y,
      damage: damage, type: type,
      elapsed: 0, duration: cfg.DURATION,
      floatDist: cfg.FLOAT_DISTANCE,
      merged: 1
    });
  },

  _tickDamageTexts: function (rawDt) {
    if (!this._battle.damageTexts) return;
    for (var i = this._battle.damageTexts.length - 1; i >= 0; i--) {
      this._battle.damageTexts[i].elapsed += rawDt;
      if (this._battle.damageTexts[i].elapsed >= this._battle.damageTexts[i].duration) {
        this._battle.damageTexts.splice(i, 1);
      }
    }
  },

  getDamageTexts: function () {
    return this._battle ? (this._battle.damageTexts || []) : [];
  },

  // ========== Phase 1: 击杀反馈 (CAP-TDE-04) ==========

  _tickDyingEnemies: function (rawDt) {
    if (!this._battle.dyingEnemies) return;
    for (var i = this._battle.dyingEnemies.length - 1; i >= 0; i--) {
      this._battle.dyingEnemies[i].deathTimer -= rawDt;
      if (this._battle.dyingEnemies[i].deathTimer <= 0) {
        this._battle.dyingEnemies.splice(i, 1);
      }
    }
  },

  getDyingEnemies: function () {
    return this._battle ? (this._battle.dyingEnemies || []) : [];
  },

  // ========== Phase 1: 武将技能手动释放 (CAP-TDE-05) ==========

  manualReleaseSkill: function (heroUid) {
    var hero = this._heroRuntime[heroUid];
    if (!hero || hero.status === 'retreated') return false;
    if (!hero.chargeReady) return false;

    hero.manualRelease = true;
    // 找当前目标释放技能
    var heroStats = null;
    if (typeof HeroManager !== 'undefined' && HeroManager.getHeroStats) {
      heroStats = HeroManager.getHeroStats(heroUid);
    }
    if (!heroStats) return false;

    var target = this._findNearestEnemy(hero.x, hero.y, hero.patrolRange);
    if (target) {
      this._heroUseSkill(heroUid, hero, heroStats, target);
    }
    hero.chargeProgress = 0;
    hero.chargeReady = false;
    hero.autoReleaseTimer = 0;
    hero.manualRelease = false;

    EventBus.emit('td:skill_released', { heroUid: heroUid, manual: true });
    return true;
  },

  // ========== Phase 1: 连杀系统 (CAP-TDE-06) ==========

  _updateKillStreak: function () {
    if (!this._battle.killStreak) this._battle.killStreak = { count: 0, timer: 0, lastLevel: 0 };
    var ks = this._battle.killStreak;
    var cfg = (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.KILL_STREAK : { WINDOW: 4, LEVELS: [] };

    ks.count++;
    ks.timer = cfg.WINDOW;

    // 检查连杀等级
    var currentLevel = 0;
    for (var i = cfg.LEVELS.length - 1; i >= 0; i--) {
      if (ks.count >= cfg.LEVELS[i].kills) {
        currentLevel = i + 1;
        break;
      }
    }

    if (currentLevel > ks.lastLevel && currentLevel > 0) {
      var levelData = cfg.LEVELS[currentLevel - 1];
      ks.lastLevel = currentLevel;
      EventBus.emit('td:kill_streak', {
        count: ks.count,
        level: currentLevel,
        name: levelData.name,
        text: levelData.text,
        color: levelData.color,
        fontSize: levelData.fontSize,
        goldBonus: levelData.goldBonus
      });

      // 更新最佳连杀
      if (ks.count > (this._state.stats.bestKillStreak || 0)) {
        this._state.stats.bestKillStreak = ks.count;
      }
    }
  },

  _tickKillStreak: function (dt) {
    if (!this._battle.killStreak) return;
    var ks = this._battle.killStreak;
    if (ks.timer > 0) {
      ks.timer -= dt;
      if (ks.timer <= 0) {
        ks.count = 0;
        ks.timer = 0;
        ks.lastLevel = 0;
      }
    }
  },

  getKillStreak: function () {
    return this._battle ? this._battle.killStreak : { count: 0, timer: 0, lastLevel: 0 };
  },

  // ========== Phase 1: 紧急技能 (CAP-TDE-08, Phase 2 但基础框架先建) ==========

  useEmergencySkill: function (skillId) {
    if (!this._battle.active || this._battle.phase !== 'active') return false;
    if (!this._battle.emergencySkills) return false;
    var sk = this._battle.emergencySkills[skillId];
    if (!sk || sk.cd > 0) return false;

    var cfg = (typeof TD_ENHANCEMENT !== 'undefined') ? TD_ENHANCEMENT.EMERGENCY_SKILLS : null;
    if (!cfg) return false;

    if (skillId === 'arrow_rain') {
      this._applyArrowRain(cfg.ARROW_RAIN);
      sk.cd = cfg.ARROW_RAIN.cooldown;
    } else if (skillId === 'battle_charge') {
      this._applyBattleCharge(cfg.BATTLE_CHARGE);
      sk.cd = cfg.BATTLE_CHARGE.cooldown;
    } else if (skillId === 'iron_wall') {
      this._applyIronWall(cfg.IRON_WALL);
      sk.cd = cfg.IRON_WALL.cooldown;
    } else {
      return false;
    }

    EventBus.emit('td:emergency_used', { skillId: skillId, cd: sk.cd });
    return true;
  },

  _applyArrowRain: function (cfg) {
    // 对全场敌人造成 baseHp × hpRatio 伤害
    var waveData = this._currentStage ? this._getStageWaveData() : TDWaveTable[this._state.wave.current];
    var baseHp = waveData ? waveData.baseHp : 100;
    var dmg = Math.floor(baseHp * cfg.hpRatio);
    for (var i = 0; i < this._battle.enemies.length; i++) {
      var e = this._battle.enemies[i];
      if (e.status === 'dead' || e.status === 'dying') continue;
      e.hp -= dmg;
      this._addDamageText(e.x, e.y, dmg, 'emergency');
      if (e.hp <= 0) this._killEnemy(e, null);
    }
  },

  _applyBattleCharge: function (cfg) {
    this._battle.battleChargeActive = true;
    this._battle.battleChargeTimer = cfg.duration;
  },

  _applyIronWall: function (cfg) {
    this._battle.ironWallActive = true;
    this._battle.ironWallTimer = cfg.wallInvincibleDuration;
    // 恢复城主府HP
    var healAmount = Math.floor(this._state.wave.townHallMaxHp * cfg.townhallHealRatio);
    this._state.wave.townHallHp = Math.min(
      this._state.wave.townHallMaxHp,
      this._state.wave.townHallHp + healAmount
    );
    this._addDamageText(16 * TD_CONSTANTS.TILE_SIZE, 16 * TD_CONSTANTS.TILE_SIZE, '+' + healAmount, 'heal');
  },

  _tickEmergencyBuffs: function (dt) {
    // 冲锋buff
    if (this._battle.battleChargeActive) {
      this._battle.battleChargeTimer -= dt;
      if (this._battle.battleChargeTimer <= 0) {
        this._battle.battleChargeActive = false;
        this._battle.battleChargeTimer = 0;
      }
    }
    // 铁壁buff
    if (this._battle.ironWallActive) {
      this._battle.ironWallTimer -= dt;
      if (this._battle.ironWallTimer <= 0) {
        this._battle.ironWallActive = false;
        this._battle.ironWallTimer = 0;
      }
    }
    // CD递减
    if (this._battle.emergencySkills) {
      for (var key in this._battle.emergencySkills) {
        if (this._battle.emergencySkills.hasOwnProperty(key)) {
          if (this._battle.emergencySkills[key].cd > 0) {
            this._battle.emergencySkills[key].cd -= dt;
            if (this._battle.emergencySkills[key].cd <= 0) {
              this._battle.emergencySkills[key].cd = 0;
              EventBus.emit('td:emergency_ready', { skillId: key });
            }
          }
        }
      }
    }
  },

  getEmergencySkills: function () {
    return this._battle ? this._battle.emergencySkills : {};
  }
};
