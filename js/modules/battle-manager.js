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
  /** 战斗速度倍率：1/2/4 */
  _battleSpeed: 1,

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
    this._battleSpeed = data.battleSpeed || 1;
  },

  onTick: function (dt) {
    var bs = this._state.battleState;

    // 战斗中：累积时间（乘以速度倍率），每秒执行一回合
    if (bs && bs.phase === 'fighting') {
      this._battleTimer += dt * this._battleSpeed;
      while (this._battleTimer >= 1.0 && bs.phase === 'fighting') {
        this._battleTimer -= 1.0;
        this._executeRound();
      }
      return;
    }

    // 自动推图：胜利后延迟 1 秒开始下一关（也受加速影响）
    if (this._state.isAutoFight && bs && (bs.phase === 'victory')) {
      this._autoAdvanceDelay += dt * this._battleSpeed;
      if (this._autoAdvanceDelay >= 1.0) {
        this._autoAdvanceDelay = 0;
        var next = this._getNextStage(this._state.currentStage);
        if (next) {
          this._state.currentStage = next;
          this.startBattle();
        } else {
          // 无法推进（章节门禁/已到最后关卡）→ 自动停止
          this._state.isAutoFight = false;
          EventBus.emit('toast:show', {
            type: 'info',
            message: '⏹ 已到达最远关卡，自动战斗已停止'
          });
        }
      }
    }

    // 自动战斗：战败时自动停止
    if (this._state.isAutoFight && bs && bs.phase === 'defeat') {
      this._state.isAutoFight = false;
      EventBus.emit('toast:show', {
        type: 'info',
        message: '⏹ 战斗失败，自动战斗已停止'
      });
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

    // 章节门禁检查：进入新章节需满足建筑等级要求
    if (typeof TownManager !== 'undefined' && stage.stage === 1 && stage.chapter >= 2) {
      var gateCheck = TownManager.checkChapterGate(stage.chapter);
      if (!gateCheck.ok) {
        var names = gateCheck.missing.map(function (m) {
          return m.emoji + m.name + ' Lv.' + m.required;
        });
        EventBus.emit('toast:show', {
          type: 'warning',
          message: '🔒 进入第' + stage.chapter + '章需要：' + names.join('、')
        });
        return false;
      }
    }

    // 检查食物 — 新手首通免费 + 食物耗尽降低奖励而非阻止
    var cost = stage.foodCost || 0;
    var isFirstClear = this._state.clearedStages.indexOf(this._state.currentStage) === -1;
    var stageNum = parseInt((this._state.currentStage || '').replace(/\D/g, '') || '0');
    var isNewbieFree = isFirstClear && stageNum <= CONSTANTS.FOOD.NEWBIE_FREE_STAGES;
    var foodDepleted = false;

    if (cost > 0 && !isNewbieFree) {
      if (ResourceManager.canAfford(CONSTANTS.RESOURCE.FOOD, cost)) {
        ResourceManager.spend(CONSTANTS.RESOURCE.FOOD, cost);
      } else {
        // 食物耗尽：允许战斗但标记奖励衰减
        foodDepleted = true;
      }
    }

    // 构建队友单位（含建筑加成 + 料理加成 + 阵营羁绊加成）
    var atkBonus = typeof TownManager !== 'undefined' ? TownManager.getAtkBonus() : 0;
    var defBonus = typeof TownManager !== 'undefined' ? TownManager.getDefBonus() : 0;
    var hpBonus  = typeof TownManager !== 'undefined' ? TownManager.getHpBonus() : 0;

    // 阵营共鸣 & 武将羁绊
    var teamBonuses = typeof calculateTeamBonuses === 'function' ? calculateTeamBonuses(team) : null;
    if (teamBonuses) {
      atkBonus += teamBonuses.atkPercent;
      defBonus += teamBonuses.defPercent;
      hpBonus  += teamBonuses.hpPercent;
    }

    // 料理 Buff 加成
    var cookBuff = typeof FarmManager !== 'undefined' ? FarmManager.getActiveBuff() : null;
    if (cookBuff && cookBuff.effects) {
      var ce = cookBuff.effects;
      atkBonus += (ce.atkBonus || 0) + (ce.allBonus || 0);
      defBonus += (ce.defBonus || 0) + (ce.allBonus || 0);
      hpBonus  += (ce.hpBonus || 0) + (ce.allBonus || 0);
    }

    // 塔防永久加成
    var tdBuff = (typeof TowerDefenseManager !== 'undefined' && TowerDefenseManager.getPermanentBattleBuff)
      ? TowerDefenseManager.getPermanentBattleBuff() : null;
    if (tdBuff) {
      atkBonus += tdBuff.atkPercent;
      defBonus += tdBuff.defPercent;
      hpBonus  += tdBuff.hpPercent;
    }

    var allies = [];
    // Pre-calculate team-wide set bonuses (e.g. teamDefPercent)
    var teamDefPctFromSets = 0;
    for (var ti = 0; ti < team.length; ti++) {
      var setBonuses = typeof getHeroSetBonuses === 'function' ? getHeroSetBonuses(team[ti].equipment) : [];
      for (var sb = 0; sb < setBonuses.length; sb++) {
        if (setBonuses[sb].bonus.effects.teamDefPercent) {
          teamDefPctFromSets += setBonuses[sb].bonus.effects.teamDefPercent;
        }
      }
    }

    for (var i = 0; i < team.length; i++) {
      var hero = team[i];
      var template = HeroManager.getTemplate(hero.id);
      var stats = HeroManager.getHeroStats(hero.uid);
      if (!template || !stats) continue;

      // Calculate set bonuses for this hero
      var heroBonuses = typeof getHeroSetBonuses === 'function' ? getHeroSetBonuses(hero.equipment) : [];
      var setAtkPct = 0, setDefPct = 0, setHpPct = 0, setAllPct = 0;
      var setCritRate = 0, setDoubleDmg = 0, setSkillDmgPct = 0, setSkillCdRed = 0;
      var setHealInterval = 0, setHealPct = 0, setDeathImmunity = 0;
      for (var bi = 0; bi < heroBonuses.length; bi++) {
        var eff = heroBonuses[bi].bonus.effects;
        if (eff.atkPercent) setAtkPct += eff.atkPercent;
        if (eff.defPercent) setDefPct += eff.defPercent;
        if (eff.hpPercent) setHpPct += eff.hpPercent;
        if (eff.allStatsPercent) setAllPct += eff.allStatsPercent;
        if (eff.critRate) setCritRate += eff.critRate;
        if (eff.doubleDamageChance) setDoubleDmg += eff.doubleDamageChance;
        if (eff.skillDamagePercent) setSkillDmgPct += eff.skillDamagePercent;
        if (eff.skillCdReduction) setSkillCdRed += eff.skillCdReduction;
        if (eff.healAllInterval) setHealInterval = eff.healAllInterval;
        if (eff.healAllPercent) setHealPct = eff.healAllPercent;
        if (eff.deathImmunityChance) setDeathImmunity = eff.deathImmunityChance;
      }

      var finalAtk = Math.floor(stats.atk * (1 + atkBonus) * (1 + setAtkPct + setAllPct));
      var finalDef = Math.floor(stats.def * (1 + defBonus) * (1 + setDefPct + setAllPct + teamDefPctFromSets));
      var finalHp  = Math.floor(stats.hp * (1 + hpBonus) * (1 + setHpPct + setAllPct));

      // 构建战斗技能（多技能系统）
      var combatSkills = HeroManager.getCombatSkills(hero.uid);
      var skillData = combatSkills.length > 0 ? combatSkills[0] : (template.skill ? Utils.deepClone(template.skill) : null);
      if (setSkillCdRed > 0) {
        for (var ski = 0; ski < combatSkills.length; ski++) {
          var skCd = combatSkills[ski].cooldown !== undefined ? combatSkills[ski].cooldown : 3;
          combatSkills[ski].cooldown = Math.max(1, skCd - setSkillCdRed);
        }
        if (skillData && combatSkills.length === 0 && setSkillCdRed > 0) {
          var scd = skillData.cooldown !== undefined ? skillData.cooldown : (skillData.cd || 3);
          skillData.cooldown = Math.max(1, scd - setSkillCdRed);
        }
      }

      var cookSpdBonus = (cookBuff && cookBuff.effects.spdBonus) ? cookBuff.effects.spdBonus : 0;
      var spdBonus = cookSpdBonus + (teamBonuses ? teamBonuses.spdPercent : 0);
      // 个人羁绊加成（如吕布天下无双）
      var selfBonus = (teamBonuses && teamBonuses.selfBonuses[hero.id]) || null;
      if (selfBonus) {
        finalAtk = Math.floor(finalAtk * (1 + (selfBonus.atkPercent || 0)));
        finalDef = Math.floor(finalDef * (1 + (selfBonus.defPercent || 0)));
        spdBonus += selfBonus.spdPercent || 0;
      }
      var finalSpd = Math.floor(stats.spd * (1 + spdBonus));

      // 装备词缀战斗效果
      var combatAffixData = { lifesteal: 0, critRate: 0, critDamage: 0, thorns: 0, dodge: 0, healPerRound: 0 };
      if (typeof aggregateCombatAffixes === 'function' && hero.equipment) {
        var heroEquips = [];
        var eqSlots = Object.keys(hero.equipment);
        for (var eqi = 0; eqi < eqSlots.length; eqi++) {
          var eqUid = hero.equipment[eqSlots[eqi]];
          if (eqUid) {
            var eqItem = (typeof EquipmentManager !== 'undefined') ? EquipmentManager.getEquipment(eqUid) : null;
            if (eqItem) heroEquips.push(eqItem);
          }
        }
        combatAffixData = aggregateCombatAffixes(heroEquips);
      }

      // 终极技能数据
      var ultData = (typeof UltimateSkills !== 'undefined' && UltimateSkills[hero.id]) ? UltimateSkills[hero.id] : null;

      allies.push({
        uid: hero.uid,
        id: hero.id,
        name: template.name,
        emoji: template.emoji,
        currentHp: finalHp,
        maxHp: finalHp,
        atk: finalAtk,
        def: finalDef,
        spd: finalSpd,
        baseAtk: finalAtk,
        baseDef: finalDef,
        baseSpd: finalSpd,
        skill: skillData,
        skillCd: 0,
        skills: combatSkills,
        skillCds: combatSkills.map(function () { return 0; }),
        buffs: [],
        isAlive: true,
        isAlly: true,
        position: i,
        setCritRate: setCritRate + (cookBuff && cookBuff.effects.critRate ? cookBuff.effects.critRate : 0),
        setDoubleDmg: setDoubleDmg,
        setSkillDmgPct: setSkillDmgPct,
        setHealInterval: setHealInterval,
        setHealPct: setHealPct,
        setDeathImmunity: setDeathImmunity,
        deathImmunityUsed: false,
        // 装备词缀战斗效果
        affixLifesteal: combatAffixData.lifesteal,
        affixCritRate: combatAffixData.critRate,
        affixCritDmg: combatAffixData.critDamage,
        affixThorns: combatAffixData.thorns,
        affixDodge: combatAffixData.dodge,
        affixHealPerRound: combatAffixData.healPerRound,
        // 终极技能
        ultimate: ultData,
        energy: 0,
        energyMax: ultData ? (ultData.energyCost || 100) : 100,
        ultimateReady: false
      });
    }

    // 构建敌方单位（含羁绊减益）
    var enemyAtkMult = 1 - (teamBonuses ? teamBonuses.enemyAtkReduce : 0);
    var enemies = [];
    for (var j = 0; j < stage.enemies.length; j++) {
      var e = stage.enemies[j];
      var eAtk = Math.floor(e.atk * enemyAtkMult);
      enemies.push({
        uid: 'enemy_' + Utils.uid(),
        id: e.id,
        name: e.name,
        emoji: '',
        currentHp: e.hp,
        maxHp: e.hp,
        atk: eAtk,
        def: e.def,
        spd: e.spd,
        baseAtk: eAtk,
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
      log: [],
      foodDepleted: foodDepleted,
      teamBonuses: teamBonuses
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
    // 初始化回合内击杀计数器 (CAP-ERH-03)
    state._roundKillCount = 0;

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

    // 2.5 Set bonus: heal all interval (e.g. 卧龙星辰 4-piece)
    for (a = 0; a < state.allies.length; a++) {
      var ally = state.allies[a];
      if (ally.isAlive && ally.setHealInterval > 0 && ally.setHealPct > 0) {
        if (state.round % ally.setHealInterval === 0) {
          for (var hi = 0; hi < state.allies.length; hi++) {
            if (state.allies[hi].isAlive) {
              var heal = Math.floor(state.allies[hi].maxHp * ally.setHealPct);
              state.allies[hi].currentHp = Math.min(state.allies[hi].maxHp, state.allies[hi].currentHp + heal);
            }
          }
          this._addLog(state, '  ✨ 套装效果：全体回复 ' + Math.round(ally.setHealPct * 100) + '% HP');
          break; // Only trigger once per team
        }
      }
    }

    // 2.6 羁绊效果：每回合全体回血
    if (state.teamBonuses && state.teamBonuses.healPerRound > 0) {
      for (var bhi = 0; bhi < state.allies.length; bhi++) {
        if (state.allies[bhi].isAlive) {
          var bondHeal = Math.floor(state.allies[bhi].maxHp * state.teamBonuses.healPerRound);
          state.allies[bhi].currentHp = Math.min(state.allies[bhi].maxHp, state.allies[bhi].currentHp + bondHeal);
        }
      }
      this._addLog(state, '  🍑 羁绊效果：全体回复 ' + Math.round(state.teamBonuses.healPerRound * 100) + '% HP');
    }

    // 词缀回春效果
    for (var ahi = 0; ahi < state.allies.length; ahi++) {
      var aUnit = state.allies[ahi];
      if (aUnit.isAlive && aUnit.affixHealPerRound > 0) {
        var affixHeal = Math.floor(aUnit.maxHp * aUnit.affixHealPerRound / 100);
        aUnit.currentHp = Math.min(aUnit.maxHp, aUnit.currentHp + affixHeal);
      }
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
    var skillToUse = null;

    // 多技能系统：按优先级（大招→副技能→主技能）检查
    if (unit.skills && unit.skills.length > 0) {
      var usedIndex = -1;
      for (var si = unit.skills.length - 1; si >= 0; si--) {
        var sk = unit.skills[si];
        var skCd = sk.cooldown !== undefined ? sk.cooldown : (sk.cd || 3);
        if (unit.skillCds[si] >= skCd) {
          skillToUse = sk;
          usedIndex = si;
          useSkill = true;
          break;
        }
      }
      // 所有技能 CD 递增（使用的技能先置 0 再不递增）
      if (usedIndex >= 0) unit.skillCds[usedIndex] = 0;
      for (var sj = 0; sj < unit.skillCds.length; sj++) {
        if (sj !== usedIndex) unit.skillCds[sj]++;
      }
    }
    // 兼容：单技能系统（敌人等）
    else if (unit.skill) {
      var cd = unit.skill.cooldown !== undefined ? unit.skill.cooldown : (unit.skill.cd || 3);
      if (unit.skillCd >= cd) {
        useSkill = true;
        skillToUse = unit.skill;
        unit.skillCd = 0;
      } else {
        unit.skillCd++;
      }
    }

    if (useSkill && skillToUse) {
      this._performSkill(unit, skillToUse, friendlies, hostiles, state);
    } else {
      this._performNormalAttack(unit, hostiles, state);
    }
  },

  // ---------- 普通攻击 ----------

  _performNormalAttack: function (unit, hostiles, state) {
    var target = this._pickRandomAlive(hostiles);
    if (!target) return;

    var result = this._calculateDamage(unit, target, 1.0);

    // 闪避
    if (result.isDodge) {
      this._addLog(state, '[第' + state.round + '回合] ' + unit.name + ' 攻击 → ' + target.name + ' 🌀闪避！');
      BattleAnimations.playDodge(target.uid);
      return;
    }

    // Set bonus: double damage chance
    if (unit.setDoubleDmg && Math.random() < unit.setDoubleDmg) {
      result.damage = result.damage * 2;
      result.isDouble = true;
    }

    target.currentHp -= result.damage;

    // 吸血词缀
    if (unit.affixLifesteal && unit.isAlive) {
      var healAmt = Math.floor(result.damage * unit.affixLifesteal / 100);
      if (healAmt > 0) {
        unit.currentHp = Math.min(unit.maxHp, unit.currentHp + healAmt);
      }
    }

    // 荆棘词缀（反伤）
    if (target.affixThorns && target.isAlive && result.damage > 0) {
      var thornsDmg = Math.floor(result.damage * target.affixThorns / 100);
      if (thornsDmg > 0) {
        unit.currentHp -= thornsDmg;
        if (unit.currentHp <= 0) { unit.currentHp = 0; unit.isAlive = false; }
      }
    }

    // Set bonus: death immunity
    if (target.currentHp <= 0 && target.isAlly && target.setDeathImmunity && !target.deathImmunityUsed) {
      if (Math.random() < target.setDeathImmunity) {
        target.currentHp = 1;
        target.deathImmunityUsed = true;
        this._addLog(state, '  ✨ ' + target.name + ' 天命不灭！免疫致命伤害！');
        BattleAnimations.playAttack(unit.uid, target.uid, result.damage, result.isCrit);
        return;
      }
    }

    if (target.currentHp <= 0) {
      target.currentHp = 0;
      target.isAlive = false;
    }

    // Trigger attack animation
    BattleAnimations.playAttack(unit.uid, target.uid, result.damage, result.isCrit);

    // 能量积攒
    if (unit.ultimate) this._gainEnergy(unit, unit.ultimate.energyGainOnHit || 8);
    if (target.ultimate) this._gainEnergy(target, target.ultimate.energyGainOnHurt || 10);

    var critText = result.isCrit ? '💥暴击！' : '';
    var doubleText = result.isDouble ? '⚡双倍！' : '';
    this._addLog(state,
      '[第' + state.round + '回合] ' +
      unit.name + ' 攻击 → ' + target.name +
      ' 受到 ' + result.damage + ' 点伤害' + critText + doubleText
    );

    if (!target.isAlive) {
      BattleAnimations.playDeath(target.uid);
      this._addLog(state, '  💀 ' + target.name + ' 被击败！');
      this._onEnemyKilled(state);
    }
  },

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
    // Set bonus: skill damage percent
    var effectiveMultiplier = multiplier * (1 + (unit.setSkillDmgPct || 0));
    var targets;
    if (targetType === 'all') {
      targets = this._getAliveUnits(hostiles);
    } else {
      var t = this._pickRandomAlive(hostiles);
      targets = t ? [t] : [];
    }

    for (var i = 0; i < targets.length; i++) {
      var target = targets[i];
      var result = this._calculateDamage(unit, target, effectiveMultiplier);
      target.currentHp -= result.damage;
      if (target.currentHp <= 0) {
        target.currentHp = 0;
        target.isAlive = false;
      }

      // 能量积攒
      if (unit.ultimate) this._gainEnergy(unit, unit.ultimate.energyGainOnHit || 8);
      if (target.ultimate) this._gainEnergy(target, target.ultimate.energyGainOnHurt || 10);

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
        this._onEnemyKilled(state);
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
    // 闪避检查（词缀 dodge）
    var dodgeChance = (defender.affixDodge || 0) / 100;
    if (dodgeChance > 0 && Math.random() < dodgeChance) {
      return { damage: 0, isCrit: false, isDodge: true };
    }

    var randomFactor = 0.9 + Math.random() * 0.2;
    var baseDamage = Math.floor(attacker.atk * multiplier * randomFactor);
    var reduction = defender.def / (defender.def + 100);
    var damage = Math.max(1, Math.floor(baseDamage * (1 - reduction)));

    var critChance = 0.05 + (attacker.setCritRate || 0) + (attacker.affixCritRate || 0) / 100;
    var isCrit = Math.random() < critChance;
    if (isCrit) {
      var critMult = 1.5 + (attacker.affixCritDmg || 0) / 100;
      damage = Math.floor(damage * critMult);
    }

    return { damage: damage, isCrit: isCrit, isDodge: false };
  },

  // ---------- 连杀检测 (CAP-ERH-03) ----------

  /**
   * 击杀事件处理：递增回合击杀计数并在达到阈值时触发连杀飘字
   * @param {Object} state - 当前战斗状态
   */
  _onEnemyKilled: function (state) {
    state._roundKillCount = (state._roundKillCount || 0) + 1;
    var count = state._roundKillCount;
    // 仅在恰好达到 3/5/7 时触发（避免重复触发同一阈值）
    if (count === 3 || count === 5 || count === 7) {
      BattleAnimations.playMultiKill(count);
    }
  },

  // ---------- 能量系统 ----------

  _gainEnergy: function (unit, amount) {
    if (!unit.ultimate || !unit.isAlly) return;
    unit.energy = Math.min(unit.energyMax, (unit.energy || 0) + amount);
    if (unit.energy >= unit.energyMax && !unit.ultimateReady) {
      unit.ultimateReady = true;
      EventBus.emit('battle:ultimate_ready', { uid: unit.uid, name: unit.name, ultimate: unit.ultimate });
    }
  },

  /** 玩家手动触发终极技能 */
  triggerUltimate: function (uid) {
    var bs = this._state.battleState;
    if (!bs || bs.phase !== 'fighting') return false;

    var unit = null;
    for (var i = 0; i < bs.allies.length; i++) {
      if (bs.allies[i].uid === uid && bs.allies[i].isAlive) {
        unit = bs.allies[i];
        break;
      }
    }
    if (!unit || !unit.ultimate || unit.energy < unit.energyMax) return false;

    unit.energy = 0;
    unit.ultimateReady = false;
    this._executeUltimate(unit, bs);
    EventBus.emit('battle:ultimate_used', { uid: unit.uid, name: unit.name });

    var result = this._checkBattleEnd();
    if (result) {
      if (result === 'victory') this._handleVictory();
      else this._handleDefeat();
    }
    return true;
  },

  _executeUltimate: function (unit, state) {
    var ult = unit.ultimate;
    this._addLog(state, '  🌟 ' + unit.name + ' 释放终极技能【' + ult.name + '】！');

    var targets = unit.isAlly ? state.enemies : state.allies;
    var allies = unit.isAlly ? state.allies : state.enemies;

    if (ult.type === 'damage' || ult.type === 'damage_buff' || ult.type === 'damage_debuff' || ult.type === 'damage_dot' || ult.type === 'sacrifice_damage') {
      // 牺牲HP型
      if (ult.hpCostPercent) {
        var hpCost = Math.floor(unit.currentHp * ult.hpCostPercent);
        unit.currentHp = Math.max(1, unit.currentHp - hpCost);
      }

      if (ult.target === 'all') {
        for (var t = 0; t < targets.length; t++) {
          if (!targets[t].isAlive) continue;
          var dmg = this._calculateDamage(unit, targets[t], ult.multiplier);
          if (ult.forceCrit) { dmg.damage = Math.floor(dmg.damage * 1.5); dmg.isCrit = true; }
          targets[t].currentHp -= dmg.damage;
          BattleAnimations.playUltimate(unit.uid, targets[t].uid, ult, dmg.damage);
          if (targets[t].currentHp <= 0) {
            targets[t].currentHp = 0; targets[t].isAlive = false;
            BattleAnimations.playDeath(targets[t].uid);
            this._onEnemyKilled(state);
          }
          this._addLog(state, '    → ' + targets[t].name + ' 受到 ' + dmg.damage + ' 伤害' + (dmg.isCrit ? '💥' : ''));
        }
      } else if (ult.target === 'lowest_hp') {
        var lowest = null;
        for (var tl = 0; tl < targets.length; tl++) {
          if (targets[tl].isAlive && (!lowest || targets[tl].currentHp < lowest.currentHp)) lowest = targets[tl];
        }
        if (lowest) {
          var dmgL = this._calculateDamage(unit, lowest, ult.multiplier);
          if (ult.forceCrit) { dmgL.damage = Math.floor(dmgL.damage * 1.5); dmgL.isCrit = true; }
          lowest.currentHp -= dmgL.damage;
          BattleAnimations.playUltimate(unit.uid, lowest.uid, ult, dmgL.damage);
          if (lowest.currentHp <= 0) {
            lowest.currentHp = 0; lowest.isAlive = false;
            BattleAnimations.playDeath(lowest.uid);
            this._onEnemyKilled(state);
          }
          this._addLog(state, '    → ' + lowest.name + ' 受到 ' + dmgL.damage + ' 伤害' + (dmgL.isCrit ? '💥' : ''));
        }
      }

      // 附加buff/debuff
      if (ult.selfBuff) {
        this._applyBuff(unit, { stat: ult.selfBuff.stat, ratio: ult.selfBuff.percent, duration: ult.selfBuff.duration }, ult.name);
      }
      if (ult.debuffEffect) {
        for (var td = 0; td < targets.length; td++) {
          if (targets[td].isAlive) {
            var dStats = ult.debuffEffect.stats || [ult.debuffEffect.stat];
            for (var ds = 0; ds < dStats.length; ds++) {
              this._applyBuff(targets[td], { stat: dStats[ds], ratio: ult.debuffEffect.percent, duration: ult.debuffEffect.duration }, ult.name);
            }
          }
        }
      }
      if (ult.teamBuff) {
        for (var tb = 0; tb < allies.length; tb++) {
          if (allies[tb].isAlive) {
            var bStats = ult.teamBuff.stats || [ult.teamBuff.stat];
            for (var bs2 = 0; bs2 < bStats.length; bs2++) {
              this._applyBuff(allies[tb], { stat: bStats[bs2], ratio: ult.teamBuff.percent, duration: ult.teamBuff.duration }, ult.name);
            }
          }
        }
      }

    } else if (ult.type === 'multi_hit') {
      for (var mh = 0; mh < ult.hits; mh++) {
        var mTarget = this._pickRandomAlive(targets);
        if (!mTarget) break;
        var mDmg = this._calculateDamage(unit, mTarget, ult.multiplier);
        mTarget.currentHp -= mDmg.damage;
        BattleAnimations.playUltimate(unit.uid, mTarget.uid, ult, mDmg.damage);
        if (mTarget.currentHp <= 0) {
          mTarget.currentHp = 0; mTarget.isAlive = false;
          BattleAnimations.playDeath(mTarget.uid);
          this._onEnemyKilled(state);
        }
        this._addLog(state, '    → ' + mTarget.name + ' 受到 ' + mDmg.damage + ' 伤害');
      }

    } else if (ult.type === 'heal' || ult.type === 'heal_buff' || ult.type === 'heal_cleanse') {
      for (var ha = 0; ha < allies.length; ha++) {
        if (!allies[ha].isAlive) continue;
        var healAmt = Math.floor(allies[ha].maxHp * ult.healPercent);
        allies[ha].currentHp = Math.min(allies[ha].maxHp, allies[ha].currentHp + healAmt);
        if (ult.type === 'heal_cleanse') {
          allies[ha].buffs = allies[ha].buffs.filter(function (b) { return b.ratio >= 0; });
          this._recalcStats(allies[ha]);
        }
        this._addLog(state, '    → ' + allies[ha].name + ' 回复 ' + healAmt + ' HP');
      }
      if (ult.buffEffect) {
        for (var hb = 0; hb < allies.length; hb++) {
          if (allies[hb].isAlive) {
            this._applyBuff(allies[hb], { stat: ult.buffEffect.stat, ratio: ult.buffEffect.percent, duration: ult.buffEffect.duration }, ult.name);
          }
        }
      }

    } else if (ult.type === 'shield') {
      for (var sa = 0; sa < allies.length; sa++) {
        if (!allies[sa].isAlive) continue;
        var shieldAmt = Math.floor(allies[sa].maxHp * ult.shieldPercent);
        allies[sa].currentHp = Math.min(allies[sa].maxHp + shieldAmt, allies[sa].currentHp + shieldAmt);
        this._addLog(state, '    → ' + allies[sa].name + ' 获得 ' + shieldAmt + ' 护盾');
      }

    } else if (ult.type === 'debuff') {
      for (var da = 0; da < targets.length; da++) {
        if (targets[da].isAlive && ult.debuffEffect) {
          var dbStats = ult.debuffEffect.stats || [ult.debuffEffect.stat];
          for (var dbs = 0; dbs < dbStats.length; dbs++) {
            this._applyBuff(targets[da], { stat: dbStats[dbs], ratio: ult.debuffEffect.percent, duration: ult.debuffEffect.duration }, ult.name);
          }
        }
      }

    } else if (ult.type === 'steal_buff') {
      var totalStolen = 0;
      for (var st = 0; st < targets.length; st++) {
        if (targets[st].isAlive) {
          var stolen = Math.floor(targets[st].atk * ult.stealPercent);
          totalStolen += stolen;
          this._applyBuff(targets[st], { stat: 'atk', ratio: -ult.stealPercent, duration: ult.duration }, ult.name);
        }
      }
      var perAlly = Math.floor(totalStolen / Math.max(1, allies.filter(function(a){return a.isAlive;}).length));
      for (var sa2 = 0; sa2 < allies.length; sa2++) {
        if (allies[sa2].isAlive) {
          this._applyBuff(allies[sa2], { stat: 'atk', ratio: perAlly / Math.max(1, allies[sa2].baseAtk), duration: ult.duration }, ult.name);
        }
      }
      this._addLog(state, '    窃取了 ' + totalStolen + ' 点攻击力分配给全队');
    }

    EventBus.emit('battle:tick', { round: state.round });
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
    var stageId = this._state.currentStage;

    // 食物耗尽时奖励衰减
    var rewardMult = state.foodDepleted ? CONSTANTS.FOOD.DEPLETED_REWARD_RATE : 1;
    if (state.foodDepleted) {
      rewardSummary.push('⚠️粮草不足(-' + Math.round((1 - rewardMult) * 100) + '%)');
    }

    // 基础奖励（含校场 EXP 加成 + 料理 EXP 加成）
    var expBonusMult = 1 + (typeof TownManager !== 'undefined' ? TownManager.getExpBonus() : 0);
    var cookBuffReward = typeof FarmManager !== 'undefined' ? FarmManager.getActiveBuff() : null;
    if (cookBuffReward && cookBuffReward.effects && cookBuffReward.effects.expBonus) {
      expBonusMult += cookBuffReward.effects.expBonus;
    }

    if (rewards.gold) {
      var actualGold = Math.floor(rewards.gold * rewardMult);
      ResourceManager.add(CONSTANTS.RESOURCE.GOLD, actualGold, 'battle', 'stage_reward', stageId);
      rewardSummary.push('💰' + actualGold);
    }
    if (rewards.exp) {
      var actualExp = Math.floor(rewards.exp * expBonusMult * rewardMult);
      ResourceManager.add(CONSTANTS.RESOURCE.EXP, actualExp, 'battle', 'stage_reward', stageId);
      rewardSummary.push('⭐' + actualExp);
    }
    if (rewards.food) {
      var actualFood = Math.floor(rewards.food * rewardMult);
      ResourceManager.add(CONSTANTS.RESOURCE.FOOD, actualFood, 'battle', 'stage_reward', stageId);
      rewardSummary.push('🍖' + actualFood);
    }
    // 建筑资源掉落
    if (rewards.wood) {
      var actualWood = Math.floor(rewards.wood * rewardMult);
      ResourceManager.add(CONSTANTS.RESOURCE.WOOD, actualWood, 'battle', 'stage_reward', stageId);
      rewardSummary.push('🪵' + actualWood);
    }
    if (rewards.stone) {
      var actualStone = Math.floor(rewards.stone * rewardMult);
      ResourceManager.add(CONSTANTS.RESOURCE.STONE, actualStone, 'battle', 'stage_reward', stageId);
      rewardSummary.push('🪨' + actualStone);
    }
    if (rewards.iron) {
      var actualIron = Math.floor(rewards.iron * rewardMult);
      ResourceManager.add(CONSTANTS.RESOURCE.IRON, actualIron, 'battle', 'stage_reward', stageId);
      rewardSummary.push('⛏️' + actualIron);
    }

    // 首次通关奖励
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

    // 加入背包（通过公共接口）
    if (typeof EquipmentManager !== 'undefined' && typeof EquipmentManager.addToInventory === 'function') {
      EquipmentManager.addToInventory(equip);
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
      var next = StageData[idx + 1];
      // 自动推图到新章节时检查门禁
      if (typeof TownManager !== 'undefined' && next.stage === 1 && next.chapter >= 2) {
        var gateCheck = TownManager.checkChapterGate(next.chapter);
        if (!gateCheck.ok) {
          return null;
        }
      }
      return next.id;
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
    EventBus.emit('battle:log', text);
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

  // ---------- 战斗速度控制 ----------

  getBattleSpeed: function () {
    return this._battleSpeed;
  },

  cycleBattleSpeed: function () {
    if (this._battleSpeed === 1) this._battleSpeed = 2;
    else if (this._battleSpeed === 2) this._battleSpeed = 4;
    else this._battleSpeed = 1;
    EventBus.emit('battle:speed_changed', { speed: this._battleSpeed });
    return this._battleSpeed;
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

  isStageUnlocked: function (stageId) {
    for (var i = 0; i < StageData.length; i++) {
      if (StageData[i].id === stageId) {
        var cond = StageData[i].unlockCondition;
        return !cond || this._state.clearedStages.indexOf(cond) !== -1;
      }
    }
    return false;
  },

  getState: function () {
    return {
      currentStage: this._state.currentStage,
      isAutoFight: this._state.isAutoFight,
      clearedStages: this._state.clearedStages.slice(),
      battleSpeed: this._battleSpeed,
      battleState: null   // 不保存战中状态
    };
  }
};
