/**
 * 战斗管理器 —— 自动挂机战斗逻辑
 *
 * 战斗流程：
 *   PREPARATION → COMBAT LOOP (1 round / tick) → SETTLEMENT
 *
 * 每回合按 SPD 降序排序所有存活单位，依次行动：
 *   CD 就绪 → 使用技能；否则 → 普通攻击
 *
 * 伤害公式：
 *   BaseDamage = floor(ATK × Multiplier × RandomFactor[0.9,1.1))
 *   Reduction  = DEF / (DEF + 100)
 *   Final      = max(1, floor(BaseDamage × (1 - Reduction)))
 *   暴击 5%，1.5× 倍率
 */
const BattleManager = {

  _state: {
    currentStage: 'stage_1_1',
    isAutoFight: false,
    clearedStages: [],
    battleState: null
  },

  /** 战斗计时器累加器，每满 1 秒执行一回合 */
  _battleTimer: 0,
  /** 自动推图胜利后等待延迟（秒） */
  _autoAdvanceDelay: 0,

  // ---------- 生命周期 ----------

  init: function (saved) {
    var data = (saved && saved.battle) ? saved.battle : (saved || {});
    this._state = {
      currentStage: data.currentStage || 'stage_1_1',
      isAutoFight: data.isAutoFight || false,
      clearedStages: data.clearedStages ? data.clearedStages.slice() : [],
      battleState: null
    };
    this._battleTimer = 0;
    this._autoAdvanceDelay = 0;
  },

  onTick: function (dt) {
    var bs = this._state.battleState;

    // 战斗中：累积时间，每秒执行一回合
    if (bs && bs.phase === 'fighting') {
      this._battleTimer += dt;
      while (this._battleTimer >= 1.0 && bs.phase === 'fighting') {
        this._battleTimer -= 1.0;
        this._executeRound();
      }
      return;
    }

    // 自动推图：胜利后延迟 1 秒开始下一关
    if (this._state.isAutoFight && bs && (bs.phase === 'victory')) {
      this._autoAdvanceDelay += dt;
      if (this._autoAdvanceDelay >= 1.0) {
        this._autoAdvanceDelay = 0;
        var next = this._getNextStage(this._state.currentStage);
        if (next) {
          this._state.currentStage = next;
          this.startBattle();
        }
      }
    }
  },

  // ---------- 开始战斗 ----------

  startBattle: function () {
    var team = HeroManager.getTeam();
    if (!team || team.length === 0) {
      EventBus.emit('toast:show', { type: 'warning', message: '请先编入队伍再出战！' });
      return false;
    }

    var stage = this.getCurrentStage();
    if (!stage) {
      EventBus.emit('toast:show', { type: 'error', message: '关卡数据异常' });
      return false;
    }

    // 检查食物
    var cost = stage.foodCost || 0;
    if (cost > 0 && !ResourceManager.canAfford(CONSTANTS.RESOURCE.FOOD, cost)) {
      EventBus.emit('toast:show', { type: 'warning', message: '粮草不足，无法出战！' });
      return false;
    }

    // 消耗食物（战斗开始时扣除）
    if (cost > 0) {
      ResourceManager.spend(CONSTANTS.RESOURCE.FOOD, cost);
    }

    // 构建队友单位（含建筑加成）
    var atkBonus = typeof TownManager !== 'undefined' ? TownManager.getAtkBonus() : 0;
    var defBonus = typeof TownManager !== 'undefined' ? TownManager.getDefBonus() : 0;
    var hpBonus  = typeof TownManager !== 'undefined' ? TownManager.getHpBonus() : 0;

    var allies = [];
    for (var i = 0; i < team.length; i++) {
      var hero = team[i];
      var template = HeroManager.getTemplate(hero.id);
      var stats = HeroManager.getHeroStats(hero.uid);
      if (!template || !stats) continue;

      var finalAtk = Math.floor(stats.atk * (1 + atkBonus));
      var finalDef = Math.floor(stats.def * (1 + defBonus));
      var finalHp  = Math.floor(stats.hp * (1 + hpBonus));

      allies.push({
        uid: hero.uid,
        id: hero.id,
        name: template.name,
        emoji: template.emoji || '',
        currentHp: finalHp,
        maxHp: finalHp,
        atk: finalAtk,
        def: finalDef,
        spd: stats.spd,
        baseAtk: finalAtk,
        baseDef: finalDef,
        baseSpd: stats.spd,
        skill: template.skill ? Utils.deepClone(template.skill) : null,
        skillCd: 0,
        buffs: [],
        isAlive: true,
        isAlly: true,
        position: i
      });
    }

    // 构建敌方单位
    var enemies = [];
    for (var j = 0; j < stage.enemies.length; j++) {
      var e = stage.enemies[j];
      enemies.push({
        uid: 'enemy_' + Utils.uid(),
        id: e.id,
        name: e.name,
        emoji: '',
        currentHp: e.hp,
        maxHp: e.hp,
        atk: e.atk,
        def: e.def,
        spd: e.spd,
        baseAtk: e.atk,
        baseDef: e.def,
        baseSpd: e.spd,
        skill: e.skill ? Utils.deepClone(e.skill) : null,
        skillCd: 0,
        buffs: [],
        isAlive: true,
        isAlly: false,
        position: j
      });
    }

    this._state.battleState = {
      phase: 'fighting',
      allies: allies,
      enemies: enemies,
      round: 0,
      log: []
    };
    this._battleTimer = 0;
    this._autoAdvanceDelay = 0;

    ResourceManager.addBattleCount();
    EventBus.emit('battle:started', { stageId: this._state.currentStage });
    return true;
  },

  // ---------- 执行一回合 ----------

  _executeRound: function () {
    var state = this._state.battleState;
    if (!state || state.phase !== 'fighting') return;

    state.round++;

    // 1. 处理 buff/debuff（递减持续时间，移除过期）
    this._processBuffs(state.allies);
    this._processBuffs(state.enemies);

    // 2. 收集所有存活单位，按 SPD 降序；同速时队友优先，再按位置
    var allUnits = [];
    var a, ei;
    for (a = 0; a < state.allies.length; a++) {
      if (state.allies[a].isAlive) allUnits.push(state.allies[a]);
    }
    for (ei = 0; ei < state.enemies.length; ei++) {
      if (state.enemies[ei].isAlive) allUnits.push(state.enemies[ei]);
    }

    allUnits.sort(function (x, y) {
      if (y.spd !== x.spd) return y.spd - x.spd;
      // 同速: 队友优先
      if (x.isAlly !== y.isAlly) return x.isAlly ? -1 : 1;
      return x.position - y.position;
    });

    // 3. 依次行动
    for (var u = 0; u < allUnits.length; u++) {
      var unit = allUnits[u];
      if (!unit.isAlive) continue;

      this._performAction(unit, state.allies, state.enemies, state);

      // 行动后检查战斗是否结束
      var result = this._checkBattleEnd();
      if (result) {
        if (result === 'victory') {
          this._handleVictory();
        } else {
          this._handleDefeat();
        }
        return;
      }
    }

    EventBus.emit('battle:tick', { round: state.round });
  },

  // ---------- 单位行动 ----------

  _performAction: function (unit, allAllies, allEnemies, state) {
    var friendlies = unit.isAlly ? allAllies : allEnemies;
    var hostiles = unit.isAlly ? allEnemies : allAllies;

    var useSkill = false;
    var skill = unit.skill;

    // 判断是否使用技能
    if (skill) {
      var cd = skill.cooldown !== undefined ? skill.cooldown : (skill.cd || 3);
      if (unit.skillCd >= cd) {
        useSkill = true;
        unit.skillCd = 0;
      } else {
        unit.skillCd++;
      }
    }

    if (useSkill) {
      this._performSkill(unit, skill, friendlies, hostiles, state);
    } else {
      this._performNormalAttack(unit, hostiles, state);
    }
  },

  // ---------- 普通攻击 ----------

  _performNormalAttack: function (unit, hostiles, state) {
    var target = this._pickRandomAlive(hostiles);
    if (!target) return;

    var result = this._calculateDamage(unit, target, 1.0);
    target.currentHp -= result.damage;
    if (target.currentHp <= 0) {
      target.currentHp = 0;
      target.isAlive = false;
    }

    // 触发攻击动画
    BattleAnimations.playAttack(unit.uid, target.uid, result.damage, result.isCrit);

    var critText = result.isCrit ? '💥暴击！' : '';
    this._addLog(state,
      '[第' + state.round + '回合] ' +
      unit.name + ' 攻击 → ' + target.name +
      ' 受到 ' + result.damage + ' 点伤害' + critText
    );

    if (!target.isAlive) {
      BattleAnimations.playDeath(target.uid);
      this._addLog(state, '  💀 ' + target.name + ' 被击败！');
    }
  },

  // ---------- 技能行动 ----------

  _performSkill: function (unit, skill, friendlies, hostiles, state) {
    var skillName = skill.name || '技能';
    var type = skill.type || 'damage';
    var multiplier = skill.multiplier || 1.0;
    var targetType = skill.target || 'single';

    switch (type) {
      case 'damage':
        this._skillDamage(unit, skillName, multiplier, targetType, hostiles, state);
        break;
      case 'heal':
        this._skillHeal(unit, skillName, multiplier, targetType, friendlies, state);
        break;
      case 'buff':
        this._skillBuff(unit, skillName, skill.effect, targetType, friendlies, state);
        break;
      case 'debuff':
        this._skillDebuff(unit, skillName, skill.effect, targetType, hostiles, state);
        break;
      default:
        this._skillDamage(unit, skillName, multiplier, targetType, hostiles, state);
    }
  },

  _skillDamage: function (unit, skillName, multiplier, targetType, hostiles, state) {
    var targets;
    if (targetType === 'all') {
      targets = this._getAliveUnits(hostiles);
    } else {
      var t = this._pickRandomAlive(hostiles);
      targets = t ? [t] : [];
    }

    for (var i = 0; i < targets.length; i++) {
      var target = targets[i];
      var result = this._calculateDamage(unit, target, multiplier);
      target.currentHp -= result.damage;
      if (target.currentHp <= 0) {
        target.currentHp = 0;
        target.isAlive = false;
      }

      // 触发技能动画
      BattleAnimations.playSkill(unit.uid, target.uid,
        { name: skillName, type: 'damage' }, result.damage);

      var critText = result.isCrit ? '💥暴击！' : '';
      this._addLog(state,
        '[第' + state.round + '回合] ' +
        unit.name + ' 使用 ' + skillName + ' → ' + target.name +
        ' 受到 ' + result.damage + ' 点伤害' + critText
      );

      if (!target.isAlive) {
        BattleAnimations.playDeath(target.uid);
        this._addLog(state, '  💀 ' + target.name + ' 被击败！');
      }
    }
  },

  _skillHeal: function (unit, skillName, multiplier, targetType, friendlies, state) {
    var targets;
    if (targetType === 'ally_lowest_hp') {
      var lowest = this._pickLowestHpAlive(friendlies);
      targets = lowest ? [lowest] : [];
    } else if (targetType === 'self') {
      targets = unit.isAlive ? [unit] : [];
    } else {
      targets = this._getAliveUnits(friendlies);
    }

    var healAmount = Math.floor(unit.atk * multiplier);

    for (var i = 0; i < targets.length; i++) {
      var target = targets[i];
      var before = target.currentHp;
      target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);
      var actual = target.currentHp - before;

      // 触发治疗动画
      BattleAnimations.playSkill(unit.uid, target.uid,
        { name: skillName, type: 'heal' }, actual);

      this._addLog(state,
        '[第' + state.round + '回合] ' +
        unit.name + ' 使用 ' + skillName + ' → ' + target.name +
        ' 恢复 ' + actual + ' 点生命'
      );
    }
  },

  _skillBuff: function (unit, skillName, effect, targetType, friendlies, state) {
    if (!effect) return;
    var targets;
    if (targetType === 'self') {
      targets = unit.isAlive ? [unit] : [];
    } else if (targetType === 'all') {
      targets = this._getAliveUnits(friendlies);
    } else {
      // single → 随机友军
      var t = this._pickRandomAlive(friendlies);
      targets = t ? [t] : [];
    }

    for (var i = 0; i < targets.length; i++) {
      this._applyBuff(targets[i], effect, skillName);
      BattleAnimations.playSkill(unit.uid, targets[i].uid,
        { name: skillName, type: 'buff' }, 0);
    }

    var statNames = { atk: '攻击', def: '防御', spd: '速度', hp: '生命' };
    var sign = effect.ratio > 0 ? '+' : '';
    var pct = Math.round(Math.abs(effect.ratio) * 100);
    var desc = (statNames[effect.stat] || effect.stat) + sign + pct + '%';

    this._addLog(state,
      '[第' + state.round + '回合] ' +
      unit.name + ' 使用 ' + skillName + ' → ' +
      (targetType === 'all' ? '全体队友' : targets[0].name) +
      ' ' + desc + ' 持续' + effect.duration + '回合'
    );
  },

  _skillDebuff: function (unit, skillName, effect, targetType, hostiles, state) {
    if (!effect) return;
    var targets;
    if (targetType === 'all') {
      targets = this._getAliveUnits(hostiles);
    } else {
      var t = this._pickRandomAlive(hostiles);
      targets = t ? [t] : [];
    }

    for (var i = 0; i < targets.length; i++) {
      this._applyBuff(targets[i], effect, skillName);
      BattleAnimations.playSkill(unit.uid, targets[i].uid,
        { name: skillName, type: 'debuff' }, 0);
    }

    var statNames = { atk: '攻击', def: '防御', spd: '速度', hp: '生命' };
    var pct = Math.round(Math.abs(effect.ratio) * 100);
    var desc = (statNames[effect.stat] || effect.stat) + '-' + pct + '%';

    this._addLog(state,
      '[第' + state.round + '回合] ' +
      unit.name + ' 使用 ' + skillName + ' → ' +
      (targetType === 'all' ? '全体敌人' : targets[0].name) +
      ' ' + desc + ' 持续' + effect.duration + '回合'
    );
  },

  // ---------- 伤害计算 ----------

  _calculateDamage: function (attacker, defender, multiplier) {
    var randomFactor = 0.9 + Math.random() * 0.2;
    var baseDamage = Math.floor(attacker.atk * multiplier * randomFactor);
    var reduction = defender.def / (defender.def + 100);
    var damage = Math.max(1, Math.floor(baseDamage * (1 - reduction)));

    var isCrit = Math.random() < 0.05;
    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }

    return { damage: damage, isCrit: isCrit };
  },

  // ---------- Buff / Debuff 系统 ----------

  _applyBuff: function (target, effect, sourceName) {
    var buff = {
      stat: effect.stat,
      ratio: effect.ratio,
      duration: effect.duration,
      source: sourceName || ''
    };
    target.buffs.push(buff);
    this._recalcStats(target);
  },

  _processBuffs: function (units) {
    for (var i = 0; i < units.length; i++) {
      var unit = units[i];
      if (!unit.isAlive || unit.buffs.length === 0) continue;

      // 递减持续时间
      for (var b = unit.buffs.length - 1; b >= 0; b--) {
        unit.buffs[b].duration--;
        if (unit.buffs[b].duration <= 0) {
          unit.buffs.splice(b, 1);
        }
      }
      this._recalcStats(unit);
    }
  },

  /** 根据 base 值和当前 buff 列表重算生效属性 */
  _recalcStats: function (unit) {
    var atkMod = 1;
    var defMod = 1;
    var spdMod = 1;

    for (var i = 0; i < unit.buffs.length; i++) {
      var b = unit.buffs[i];
      if (b.stat === 'atk') atkMod += b.ratio;
      if (b.stat === 'def') defMod += b.ratio;
      if (b.stat === 'spd') spdMod += b.ratio;
    }

    unit.atk = Math.max(1, Math.floor(unit.baseAtk * atkMod));
    unit.def = Math.max(1, Math.floor(unit.baseDef * defMod));
    unit.spd = Math.max(1, Math.floor(unit.baseSpd * spdMod));
  },

  // ---------- 胜负判定 ----------

  _checkBattleEnd: function () {
    var state = this._state.battleState;
    if (!state) return null;

    var alliesDead = true;
    for (var a = 0; a < state.allies.length; a++) {
      if (state.allies[a].isAlive) { alliesDead = false; break; }
    }

    var enemiesDead = true;
    for (var e = 0; e < state.enemies.length; e++) {
      if (state.enemies[e].isAlive) { enemiesDead = false; break; }
    }

    if (enemiesDead) return 'victory';
    if (alliesDead) return 'defeat';
    return null;
  },

  // ---------- 胜利结算 ----------

  _handleVictory: function () {
    var state = this._state.battleState;
    state.phase = 'victory';

    var stage = this.getCurrentStage();
    var rewards = stage ? stage.rewards : {};
    var rewardSummary = [];

    // 基础奖励（含校场 EXP 加成）
    var expBonusMult = 1 + (typeof TownManager !== 'undefined' ? TownManager.getExpBonus() : 0);

    if (rewards.gold) {
      ResourceManager.add(CONSTANTS.RESOURCE.GOLD, rewards.gold, 'battle', 'stage_reward', stageId);
      rewardSummary.push('💰' + rewards.gold);
    }
    if (rewards.exp) {
      var actualExp = Math.floor(rewards.exp * expBonusMult);
      ResourceManager.add(CONSTANTS.RESOURCE.EXP, actualExp, 'battle', 'stage_reward', stageId);
      rewardSummary.push('⭐' + actualExp);
    }
    if (rewards.food) {
      ResourceManager.add(CONSTANTS.RESOURCE.FOOD, rewards.food, 'battle', 'stage_reward', stageId);
      rewardSummary.push('🍖' + rewards.food);
    }
    // 建筑资源掉落
    if (rewards.wood) {
      ResourceManager.add(CONSTANTS.RESOURCE.WOOD, rewards.wood, 'battle', 'stage_reward', stageId);
      rewardSummary.push('🪵' + rewards.wood);
    }
    if (rewards.stone) {
      ResourceManager.add(CONSTANTS.RESOURCE.STONE, rewards.stone, 'battle', 'stage_reward', stageId);
      rewardSummary.push('🪨' + rewards.stone);
    }
    if (rewards.iron) {
      ResourceManager.add(CONSTANTS.RESOURCE.IRON, rewards.iron, 'battle', 'stage_reward', stageId);
      rewardSummary.push('⛏️' + rewards.iron);
    }

    // 首次通关奖励
    var stageId = this._state.currentStage;
    var isFirstClear = this._state.clearedStages.indexOf(stageId) === -1;
    if (isFirstClear) {
      this._state.clearedStages.push(stageId);
      if (stage && stage.firstClearReward) {
        if (stage.firstClearReward.jade) {
          ResourceManager.add(CONSTANTS.RESOURCE.JADE, stage.firstClearReward.jade, 'battle', 'first_clear', stageId);
          rewardSummary.push('💎' + stage.firstClearReward.jade);
        }
        if (stage.firstClearReward.hero) {
          HeroManager.addHero(stage.firstClearReward.hero);
          rewardSummary.push('🦸新武将');
        }
      }
    }

    // 更新最高关卡
    ResourceManager.setHighestStage(stageId);

    // 装备掉落（含探险公会加成）
    var droppedEquip = null;
    var dropBonus = typeof TownManager !== 'undefined' ? TownManager.getDropRateBonus() : 0;
    var effectiveDropRate = (rewards.equipDropRate || 0) * (1 + dropBonus);
    if (effectiveDropRate > 0 && Math.random() < effectiveDropRate) {
      droppedEquip = this._generateEquipDrop(stage);
      if (droppedEquip) {
        rewardSummary.push('🗡️装备');
      }
    }

    this._addLog(state,
      '[胜利!] 获得 ' + rewardSummary.join(' ')
    );

    EventBus.emit('battle:ended', {
      result: 'victory',
      stageId: stageId,
      rewards: rewardSummary,
      equipment: droppedEquip,
      isFirstClear: isFirstClear
    });
  },

  // ---------- 失败结算 ----------

  _handleDefeat: function () {
    var state = this._state.battleState;
    state.phase = 'defeat';

    this._addLog(state, '[战败] 我军全军覆没…');

    EventBus.emit('battle:ended', {
      result: 'defeat',
      stageId: this._state.currentStage
    });
  },

  // ---------- 装备掉落 ----------

  _generateEquipDrop: function (stage) {
    // 优先使用 EquipmentManager.generateDrop（如果已实现）
    if (typeof EquipmentManager !== 'undefined' &&
        typeof EquipmentManager.generateDrop === 'function') {
      return EquipmentManager.generateDrop(
        stage.chapter,
        stage.rewards.equipQualityWeights
      );
    }

    // 兜底：自行生成装备并加入背包
    var weights = stage.rewards.equipQualityWeights || { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 };
    var quality = this._rollQuality(weights);

    var candidates = [];
    for (var i = 0; i < EquipmentData.length; i++) {
      if (EquipmentData[i].quality === quality) {
        candidates.push(EquipmentData[i]);
      }
    }
    if (candidates.length === 0) return null;

    var template = candidates[Utils.randInt(0, candidates.length - 1)];
    var statValue = Utils.randInt(template.statRange[0], template.statRange[1]);
    var stats = {};
    stats[template.statType] = statValue;

    var equip = {
      uid: Utils.uid(),
      templateId: template.id,
      name: template.name,
      emoji: template.emoji || '',
      type: template.type,
      quality: template.quality,
      stats: stats,
      level: 0
    };

    // 加入背包
    if (typeof EquipmentManager !== 'undefined' && EquipmentManager._inventory) {
      EquipmentManager._inventory.push(equip);
    }

    return equip;
  },

  _rollQuality: function (weights) {
    var entries = [];
    var keys = Object.keys(weights);
    for (var i = 0; i < keys.length; i++) {
      var q = parseInt(keys[i], 10);
      var w = weights[keys[i]];
      if (w > 0) entries.push({ quality: q, weight: w });
    }
    if (entries.length === 0) return 1;

    var total = 0;
    for (var j = 0; j < entries.length; j++) total += entries[j].weight;
    var roll = Math.random() * total;
    var cum = 0;
    for (var k = 0; k < entries.length; k++) {
      cum += entries[k].weight;
      if (roll < cum) return entries[k].quality;
    }
    return entries[entries.length - 1].quality;
  },

  // ---------- 关卡导航 ----------

  _getNextStage: function (currentId) {
    var idx = -1;
    for (var i = 0; i < StageData.length; i++) {
      if (StageData[i].id === currentId) { idx = i; break; }
    }
    if (idx >= 0 && idx < StageData.length - 1) {
      return StageData[idx + 1].id;
    }
    return null;
  },

  getCurrentStage: function () {
    var id = this._state.currentStage;
    for (var i = 0; i < StageData.length; i++) {
      if (StageData[i].id === id) return StageData[i];
    }
    return null;
  },

  // ---------- 目标选取工具 ----------

  _pickRandomAlive: function (units) {
    var alive = [];
    for (var i = 0; i < units.length; i++) {
      if (units[i].isAlive) alive.push(units[i]);
    }
    if (alive.length === 0) return null;
    return alive[Utils.randInt(0, alive.length - 1)];
  },

  _pickLowestHpAlive: function (units) {
    var lowest = null;
    var lowestPct = 2;
    for (var i = 0; i < units.length; i++) {
      if (!units[i].isAlive) continue;
      var pct = units[i].currentHp / units[i].maxHp;
      if (pct < lowestPct) {
        lowestPct = pct;
        lowest = units[i];
      }
    }
    return lowest;
  },

  _getAliveUnits: function (units) {
    var alive = [];
    for (var i = 0; i < units.length; i++) {
      if (units[i].isAlive) alive.push(units[i]);
    }
    return alive;
  },

  // ---------- 战斗日志 ----------

  _addLog: function (state, text) {
    state.log.push(text);
    if (state.log.length > 50) {
      state.log.shift();
    }
  },

  // ---------- 公共 API ----------

  toggleAutoFight: function () {
    this._state.isAutoFight = !this._state.isAutoFight;
    return this._state.isAutoFight;
  },

  setCurrentStage: function (stageId) {
    this._state.currentStage = stageId;
  },

  isAutoFight: function () {
    return this._state.isAutoFight;
  },

  isFighting: function () {
    var bs = this._state.battleState;
    return bs ? bs.phase === 'fighting' : false;
  },

  getBattleState: function () {
    return this._state.battleState;
  },

  getClearedStages: function () {
    return this._state.clearedStages;
  },

  isStageCleared: function (stageId) {
    return this._state.clearedStages.indexOf(stageId) !== -1;
  },

  getState: function () {
    return {
      currentStage: this._state.currentStage,
      isAutoFight: this._state.isAutoFight,
      clearedStages: this._state.clearedStages.slice(),
      battleState: null   // 不保存战中状态
    };
  }
};
