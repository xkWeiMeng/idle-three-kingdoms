/**
 * 深渊管理器 —— 深渊副本挑战
 * 3 个深渊（虎牢关/赤壁/官渡），每个 5 层连续战斗
 */
var AbyssManager = {
  _state: {
    unlocked: false,
    instances: {},
    currentRun: null
  },

  init: function (saved) {
    var data = (saved && saved.abyss) ? saved.abyss : {};
    this._state.unlocked = data.unlocked || false;
    this._state.instances = data.instances || {};
    this._state.currentRun = null; // Never persist mid-run state

    // Initialize instance data for all abysses
    var abyssIds = Object.keys(AbyssData);
    for (var i = 0; i < abyssIds.length; i++) {
      var aid = abyssIds[i];
      if (!this._state.instances[aid]) {
        this._state.instances[aid] = {
          cleared: false,
          firstCleared: false,
          lastAttempt: 0,
          bestFloor: 0,
          totalAttempts: 0,
          mythicDropCount: 0
        };
      }
      // Backward compat: old saves with cleared but no firstCleared
      var inst = this._state.instances[aid];
      if (inst.cleared && inst.firstCleared === undefined) {
        inst.firstCleared = true;
      }
      if (inst.firstCleared === undefined) {
        inst.firstCleared = false;
      }
    }
  },

  onTick: function (dt) {
    // Check unlock condition
    if (!this._state.unlocked) {
      if (typeof BattleManager !== 'undefined') {
        var cleared = BattleManager.getClearedStages();
        if (cleared.indexOf('stage_4_10') !== -1) {
          this._state.unlocked = true;
          EventBus.emit('toast:show', { type: 'success', message: '⚔ 深渊挑战已解锁！' });
        }
      }
    }

    // Process active run combat
    if (this._state.currentRun && this._state.currentRun.phase === 'fighting') {
      this._processCombat(dt);
    }
  },

  /** Check if an abyss is unlocked */
  isAbyssUnlocked: function (abyssId) {
    var abyss = AbyssData[abyssId];
    if (!abyss) return false;
    if (typeof BattleManager === 'undefined') return false;
    var cleared = BattleManager.getClearedStages();
    return cleared.indexOf(abyss.unlockCondition.stage) !== -1;
  },

  /** Check if abyss is on cooldown — cooldown removed, always false */
  isOnCooldown: function (abyssId) {
    return false;
  },

  getCooldownRemaining: function (abyssId) {
    return 0;
  },

  /** Enter an abyss */
  enterAbyss: function (abyssId) {
    if (this._state.currentRun) {
      EventBus.emit('toast:show', { type: 'warning', message: '已有正在进行的深渊挑战' });
      return false;
    }

    var abyss = AbyssData[abyssId];
    if (!abyss) return false;

    if (!this.isAbyssUnlocked(abyssId)) {
      EventBus.emit('toast:show', { type: 'warning', message: '深渊尚未解锁' });
      return false;
    }

    var team = HeroManager.getTeam();
    if (!team || team.length === 0) {
      EventBus.emit('toast:show', { type: 'warning', message: '请先编入队伍！' });
      return false;
    }

    // Check ticket cost
    var cost = abyss.ticketCost;
    if (cost.jade && !ResourceManager.canAfford('jade', cost.jade)) {
      EventBus.emit('toast:show', { type: 'warning', message: '玉璧不足！需要💎×' + cost.jade });
      return false;
    }
    if (cost.gold && !ResourceManager.canAfford('gold', cost.gold)) {
      EventBus.emit('toast:show', { type: 'warning', message: '金币不足！需要💰×' + Utils.formatNumber(cost.gold) });
      return false;
    }
    if (cost.iron && !ResourceManager.canAfford('iron', cost.iron)) {
      EventBus.emit('toast:show', { type: 'warning', message: '铁矿不足！需要⛏️×' + cost.iron });
      return false;
    }

    // Deduct ticket cost
    if (cost.jade) ResourceManager.spend('jade', cost.jade);
    if (cost.gold) ResourceManager.spend('gold', cost.gold);
    if (cost.iron) ResourceManager.spend('iron', cost.iron);

    // Record attempt
    var inst = this._state.instances[abyssId];
    inst.lastAttempt = Math.floor(Date.now() / 1000);
    inst.totalAttempts++;

    // Build ally units
    var atkBonus = typeof TownManager !== 'undefined' ? TownManager.getAtkBonus() : 0;
    var defBonus = typeof TownManager !== 'undefined' ? TownManager.getDefBonus() : 0;
    var hpBonus  = typeof TownManager !== 'undefined' ? TownManager.getHpBonus() : 0;

    var allies = [];
    for (var i = 0; i < team.length; i++) {
      var hero = team[i];
      var template = HeroManager.getTemplate(hero.id);
      var stats = HeroManager.getHeroStats(hero.uid);
      if (!template || !stats) continue;

      var abyssCombatSkills = (typeof HeroManager.getCombatSkills === 'function') ? HeroManager.getCombatSkills(hero.uid) : [];

      allies.push({
        uid: hero.uid,
        id: hero.id,
        name: template.name,
        emoji: template.emoji || '',
        currentHp: Math.floor(stats.hp * (1 + hpBonus)),
        maxHp: Math.floor(stats.hp * (1 + hpBonus)),
        atk: Math.floor(stats.atk * (1 + atkBonus)),
        def: Math.floor(stats.def * (1 + defBonus)),
        spd: stats.spd,
        baseAtk: Math.floor(stats.atk * (1 + atkBonus)),
        baseDef: Math.floor(stats.def * (1 + defBonus)),
        baseSpd: stats.spd,
        skill: abyssCombatSkills.length > 0 ? abyssCombatSkills[0] : (template.skill ? Utils.deepClone(template.skill) : null),
        skillCd: 0,
        skills: abyssCombatSkills,
        skillCds: abyssCombatSkills.map(function () { return 0; }),
        buffs: [],
        isAlive: true,
        isAlly: true,
        position: i,
        deathImmunityUsed: false,
        element: hero.element || null
      });
    }

    this._state.currentRun = {
      abyssId: abyssId,
      currentFloor: 1,
      phase: 'fighting',
      allies: allies,
      enemies: [],
      round: 0,
      log: [],
      rewards: { gold: 0, exp: 0, iron: 0, jade: 0 },
      droppedEquipment: [],
      battleTimer: 0
    };

    this._setupFloor();
    EventBus.emit('abyss:entered', { abyssId: abyssId });
    return true;
  },

  _setupFloor: function () {
    var run = this._state.currentRun;
    var abyss = AbyssData[run.abyssId];
    var floorData = abyss.floors[run.currentFloor - 1];
    if (!floorData) return;

    var boss = floorData.boss;
    run.enemies = [{
      uid: 'abyss_enemy_' + Utils.uid(),
      id: boss.id,
      name: boss.name,
      emoji: '',
      currentHp: boss.hp,
      maxHp: boss.hp,
      atk: boss.atk,
      def: boss.def,
      spd: boss.spd,
      baseAtk: boss.atk,
      baseDef: boss.def,
      baseSpd: boss.spd,
      maxAtk: boss.atk,
      maxDef: boss.def,
      skill: boss.skill ? Utils.deepClone(boss.skill) : null,
      skillCd: 0,
      buffs: [],
      isAlive: true,
      isAlly: false,
      position: 0,
      element: boss.element || null,
      mechanics: boss.mechanics ? Utils.deepClone(boss.mechanics) : null
    }];
    run.round = 0;
    run.phase = 'fighting';
    run.battleTimer = 0;
  },

  _processCombat: function (dt) {
    var run = this._state.currentRun;
    if (!run || run.phase !== 'fighting') return;

    run.battleTimer += dt;
    while (run.battleTimer >= 1.0 && run.phase === 'fighting') {
      run.battleTimer -= 1.0;
      this._executeRound();
    }
  },

  _executeRound: function () {
    var run = this._state.currentRun;
    run.round++;

    // Process buffs at start of round (DoT ticks, duration countdown)
    this._tickBuffs(run);

    // Process boss mechanics before actions
    for (var mi = 0; mi < run.enemies.length; mi++) {
      var mechEnemy = run.enemies[mi];
      if (mechEnemy.isAlive && mechEnemy.mechanics) {
        this._processBossMechanics(mechEnemy, run.round, run);
      }
    }

    // Collect alive units, sort by SPD
    var allUnits = [];
    for (var a = 0; a < run.allies.length; a++) {
      if (run.allies[a].isAlive) allUnits.push(run.allies[a]);
    }
    for (var e = 0; e < run.enemies.length; e++) {
      if (run.enemies[e].isAlive) allUnits.push(run.enemies[e]);
    }
    allUnits.sort(function (x, y) {
      if (y.spd !== x.spd) return y.spd - x.spd;
      return x.isAlly ? -1 : 1;
    });

    for (var u = 0; u < allUnits.length; u++) {
      var unit = allUnits[u];
      if (!unit.isAlive) continue;

      var hostiles = unit.isAlly ? run.enemies : run.allies;
      var friendlies = unit.isAlly ? run.allies : run.enemies;

      var useSkill = false;
      var skillToUse = null;

      // Multi-skill system
      if (unit.skills && unit.skills.length > 0) {
        var usedIdx = -1;
        for (var si = unit.skills.length - 1; si >= 0; si--) {
          var sk = unit.skills[si];
          var skCd = sk.cooldown !== undefined ? sk.cooldown : 3;
          if (unit.skillCds[si] >= skCd) {
            skillToUse = sk;
            usedIdx = si;
            useSkill = true;
            break;
          }
        }
        if (usedIdx >= 0) unit.skillCds[usedIdx] = 0;
        for (var sj = 0; sj < unit.skillCds.length; sj++) {
          if (sj !== usedIdx) unit.skillCds[sj]++;
        }
      }
      // Legacy single skill
      else if (unit.skill) {
        var cd = unit.skill.cooldown !== undefined ? unit.skill.cooldown : 3;
        if (unit.skillCd >= cd) {
          useSkill = true;
          skillToUse = unit.skill;
          unit.skillCd = 0;
        } else {
          unit.skillCd++;
        }
      }

      if (useSkill && skillToUse) {
        this._performSkill(unit, skillToUse, hostiles, friendlies, run);
      } else {
        this._performAttack(unit, hostiles, run);
      }

      // Check floor end
      var result = this._checkFloorEnd(run);
      if (result) {
        if (result === 'victory') {
          this._handleFloorVictory();
        } else {
          this._handleAbyssDefeat();
        }
        return;
      }
    }
  },

  _performAttack: function (unit, hostiles, run) {
    var target = this._pickAlive(hostiles);
    if (!target) return;

    var dmg = this._calcDamage(unit, target, 1.0);
    this._applyDamage(target, dmg.damage);

    // Death immunity check (set bonus)
    if (!target.isAlive && target.isAlly && !target.deathImmunityUsed) {
      var hero = HeroManager.getHeroByUid(target.uid);
      if (hero) {
        var bonuses = getHeroSetBonuses(hero.equipment);
        for (var b = 0; b < bonuses.length; b++) {
          var eff = bonuses[b].bonus.effects;
          if (eff.deathImmunityChance && Math.random() < eff.deathImmunityChance) {
            target.currentHp = 1;
            target.isAlive = true;
            target.deathImmunityUsed = true;
            run.log.push('[第' + run.round + '回合] ✨ ' + target.name + ' 天命不灭！免疫致命伤害！');
            return;
          }
        }
      }
    }

    var critText = dmg.isCrit ? ' 💥暴击！' : '';
    var elemText = BattleManager._getElementText(unit.element, target.element, dmg.elementMult);
    if (elemText) elemText = ' ' + elemText;
    run.log.push('[第' + run.round + '回合] ' + unit.name + ' → ' + target.name +
      ' ' + dmg.damage + '伤害' + critText + elemText);
    if (run.log.length > 50) run.log.shift();
  },

  _performSkill: function (unit, skill, hostiles, friendlies, run) {
    var skillName = skill.name || '技能';
    var type = skill.type || 'damage';
    var multiplier = skill.multiplier || 1.0;

    if (type === 'heal') {
      var healTarget = unit;
      var healAmount = Math.floor(unit.atk * multiplier);
      healTarget.currentHp = Math.min(healTarget.maxHp, healTarget.currentHp + healAmount);
      run.log.push('[第' + run.round + '回合] ' + unit.name + ' 使用 ' + skillName + ' 回复 ' + healAmount + ' HP');
      return;
    }

    if (type === 'buff') {
      var effect = skill.effect;
      if (effect) {
        if (effect.type === 'taunt') {
          unit.buffs.push({ type: 'taunt', duration: effect.duration || 2 });
        } else if (effect.type === 'shield') {
          var shieldAmount = Math.floor(unit.atk * (effect.shieldMult || 1.5));
          var shieldTargets = (skill.target === 'all') ? this._getAlive(friendlies) : [unit];
          for (var sti = 0; sti < shieldTargets.length; sti++) {
            shieldTargets[sti].buffs.push({ type: 'shield', amount: shieldAmount, duration: effect.duration || 3 });
          }
        } else {
          unit.buffs.push({ stat: effect.stat, ratio: effect.ratio, duration: effect.duration });
        }
        this._recalcStats(unit);
        run.log.push('[第' + run.round + '回合] ' + unit.name + ' 使用 ' + skillName);
      }
      return;
    }

    if (type === 'cleanse') {
      var cleanseTargets = this._getAlive(friendlies);
      for (var ci = 0; ci < cleanseTargets.length; ci++) {
        var ct = cleanseTargets[ci];
        var removedCount = 0;
        var kept = [];
        for (var cb = 0; cb < ct.buffs.length; cb++) {
          var cbuff = ct.buffs[cb];
          var cbType = cbuff.type || 'stat';
          if (cbType === 'dot' || (cbType === 'stat' && cbuff.ratio < 0)) {
            removedCount++;
          } else {
            kept.push(cbuff);
          }
        }
        ct.buffs = kept;
        if (removedCount > 0) {
          this._recalcStats(ct);
          run.log.push('[第' + run.round + '回合] ' + unit.name + ' 使用 ' + skillName +
            ' → ' + ct.name + ' 净化了 ' + removedCount + ' 个负面效果');
        }
      }
      if (run.log.length > 50) run.log.shift();
      return;
    }

    // Damage skill
    var targets = [];
    var target = skill.target || 'single';
    if (target === 'all') {
      targets = this._getAlive(hostiles);
    } else if (target === 'random3') {
      var alive = this._getAlive(hostiles);
      for (var r = 0; r < 3 && alive.length > 0; r++) {
        targets.push(alive[Utils.randInt(0, alive.length - 1)]);
      }
    } else {
      var t = this._pickAlive(hostiles);
      if (t) targets.push(t);
    }

    for (var i = 0; i < targets.length; i++) {
      var tgt = targets[i];
      var dmg = this._calcDamage(unit, tgt, multiplier);
      this._applyDamage(tgt, dmg.damage);

      var aElemText = BattleManager._getElementText(unit.element, tgt.element, dmg.elementMult);
      if (aElemText) aElemText = ' ' + aElemText;
      run.log.push('[第' + run.round + '回合] ' + unit.name + ' [' + skillName + '] → ' +
        tgt.name + ' ' + dmg.damage + '伤害' + (dmg.isCrit ? ' 💥' : '') + aElemText);
    }
    if (run.log.length > 50) run.log.shift();
  },

  _calcDamage: function (attacker, defender, multiplier) {
    var rand = 0.9 + Math.random() * 0.2;
    var base = Math.floor(attacker.atk * multiplier * rand);

    // 元素克制倍率（在 DEF 减免之前）
    var elementMult = BattleManager._getElementMultiplier(attacker.element, defender.element);

    // Boss 属性护盾覆盖常规元素倍率
    if (defender._elementShield) {
      if (attacker.element === defender._elementShield.immuneElement) {
        elementMult = 0;
      } else if (attacker.element === defender._elementShield.weakElement) {
        elementMult = 2.0;
      }
    }

    base = Math.floor(base * elementMult);

    var reduction = defender.def / (defender.def + 100);
    var damage = Math.max(1, Math.floor(base * (1 - reduction)));
    var isCrit = Math.random() < 0.05;
    if (isCrit) damage = Math.floor(damage * 1.5);
    return { damage: damage, isCrit: isCrit, elementMult: elementMult };
  },

  _recalcStats: function (unit) {
    var atkMod = 1, defMod = 1, spdMod = 1;
    for (var i = 0; i < unit.buffs.length; i++) {
      var b = unit.buffs[i];
      var buffType = b.type || 'stat';
      if (buffType !== 'stat') continue;
      if (b.stat === 'atk') atkMod += b.ratio;
      if (b.stat === 'def') defMod += b.ratio;
      if (b.stat === 'spd') spdMod += b.ratio;
    }
    unit.atk = Math.max(1, Math.floor(unit.baseAtk * atkMod));
    unit.def = Math.max(1, Math.floor(unit.baseDef * defMod));
    unit.spd = Math.max(1, Math.floor(unit.baseSpd * spdMod));
  },

  /** Shield absorption for abyss combat */
  _applyDamage: function (target, damage) {
    var remaining = damage;
    var shields = [];
    for (var si = 0; si < target.buffs.length; si++) {
      if ((target.buffs[si].type || 'stat') === 'shield') {
        shields.push(target.buffs[si]);
      }
    }
    for (var s = 0; s < shields.length; s++) {
      if (remaining <= 0) break;
      var absorbed = Math.min(shields[s].amount, remaining);
      shields[s].amount -= absorbed;
      remaining -= absorbed;
      if (shields[s].amount <= 0) {
        shields[s].duration = 0;
      }
    }
    target.currentHp -= remaining;
    if (target.currentHp <= 0) {
      target.currentHp = 0;
      target.isAlive = false;
    }
    return { shieldAbsorbed: damage - remaining, hpDamage: remaining };
  },

  _checkFloorEnd: function (run) {
    var alliesAlive = false, enemiesAlive = false;
    for (var a = 0; a < run.allies.length; a++) {
      if (run.allies[a].isAlive) { alliesAlive = true; break; }
    }
    for (var e = 0; e < run.enemies.length; e++) {
      if (run.enemies[e].isAlive) { enemiesAlive = true; break; }
    }
    if (!enemiesAlive) return 'victory';
    if (!alliesAlive) return 'defeat';
    return null;
  },

  _handleFloorVictory: function () {
    var run = this._state.currentRun;
    var abyss = AbyssData[run.abyssId];
    var floorData = abyss.floors[run.currentFloor - 1];

    // Collect floor rewards
    if (floorData.rewards) {
      var rew = floorData.rewards;
      if (rew.gold) { run.rewards.gold += rew.gold; ResourceManager.add('gold', rew.gold); }
      if (rew.exp) { run.rewards.exp += rew.exp; ResourceManager.add('exp', rew.exp); }
      if (rew.iron) { run.rewards.iron += rew.iron; ResourceManager.add('iron', rew.iron); }
      if (rew.jade) { run.rewards.jade += rew.jade; ResourceManager.add('jade', rew.jade); }
    }

    // Equipment drop chance
    if (floorData.equipDrop) {
      var dropKeys = Object.keys(floorData.equipDrop);
      for (var d = 0; d < dropKeys.length; d++) {
        var q = parseInt(dropKeys[d]);
        if (Math.random() < floorData.equipDrop[q]) {
          var eq = EquipmentManager.generateDrop(5, { [q]: 100 });
          if (eq) run.droppedEquipment.push(eq);
        }
      }
    }

    // Mythic drop
    if (floorData.mythicDrop && Math.random() < floorData.mythicDrop.chance) {
      var pool = floorData.mythicDrop.pool;
      var mid = pool[Utils.randInt(0, pool.length - 1)];
      var mt = getMythicTemplate(mid);
      if (mt) {
        var sv = Utils.randInt(mt.statRange[0], mt.statRange[1]);
        var mythicEquip = {
          uid: Utils.uid(), id: mt.id, name: mt.name, type: mt.type,
          quality: 6, emoji: mt.emoji, description: mt.description,
          setId: mt.setId, unsellable: true,
          stats: {}, level: 0, equippedBy: null
        };
        mythicEquip.stats[mt.statType] = sv;
        EquipmentManager.addToInventory(mythicEquip);
        run.droppedEquipment.push(mythicEquip);
        this._state.instances[run.abyssId].mythicDropCount++;
        EventBus.emit('toast:show', { type: 'success', message: '🔴 神话装备掉落：' + mt.name + '！' });
      }
    }

    var inst = this._state.instances[run.abyssId];
    if (run.currentFloor > inst.bestFloor) inst.bestFloor = run.currentFloor;

    run.log.push('═══ 第 ' + run.currentFloor + ' 层通关！ ═══');

    // Check if last floor
    if (run.currentFloor >= abyss.floors.length) {
      EventBus.emit('abyss:floor_cleared', {
        abyssId: run.abyssId, floor: run.currentFloor, rewards: floorData.rewards
      });
      this._handleAbyssComplete();
      return;
    }

    // Heal allies 30% HP
    for (var h = 0; h < run.allies.length; h++) {
      if (run.allies[h].isAlive) {
        run.allies[h].currentHp = Math.min(run.allies[h].maxHp,
          run.allies[h].currentHp + Math.floor(run.allies[h].maxHp * 0.3));
      }
    }

    // Normal mode: set transition phase BEFORE emitting event
    // so the UI handler can render the transition zone
    if (!run.quickBattle) {
      run.phase = 'transition';
    }

    EventBus.emit('abyss:floor_cleared', {
      abyssId: run.abyssId, floor: run.currentFloor, rewards: floorData.rewards
    });

    // Quick battle: advance immediately (UI handler skips for quickBattle)
    if (run.quickBattle) {
      run.currentFloor++;
      this._setupFloor();
    }
  },

  _handleAbyssComplete: function () {
    var run = this._state.currentRun;
    var abyss = AbyssData[run.abyssId];
    var inst = this._state.instances[run.abyssId];

    // First clear rewards
    if (!inst.cleared) {
      inst.cleared = true;
      inst.firstCleared = true;
      var fcr = abyss.firstClearReward;
      if (fcr.gold) { ResourceManager.add('gold', fcr.gold); run.rewards.gold += fcr.gold; }
      if (fcr.jade) { ResourceManager.add('jade', fcr.jade); run.rewards.jade += fcr.jade; }
      if (fcr.blueprint && typeof ForgeManager !== 'undefined') {
        ForgeManager.addBlueprint(fcr.blueprint);
      }
      run.log.push('🏆 首通奖励！获得锻造图纸！');
    }

    run.phase = 'complete';
    run.log.push('════════════════════');
    run.log.push('🏆 深渊 ' + abyss.name + ' 通关！');

    EventBus.emit('abyss:completed', {
      abyssId: run.abyssId, rewards: run.rewards, droppedEquipment: run.droppedEquipment
    });
  },

  _handleAbyssDefeat: function () {
    var run = this._state.currentRun;
    run.phase = 'defeat';
    run.log.push('💀 全军覆没于第 ' + run.currentFloor + ' 层…');

    EventBus.emit('abyss:failed', { abyssId: run.abyssId, floor: run.currentFloor });
  },

  /** Quick battle — instantly run all floors for an already-cleared abyss */
  quickBattle: function (abyssId) {
    // Validate preconditions
    if (this._state.currentRun) {
      EventBus.emit('toast:show', { type: 'warning', message: '已有正在进行的深渊挑战' });
      return false;
    }

    var abyss = AbyssData[abyssId];
    if (!abyss) return false;

    if (!this.isAbyssUnlocked(abyssId)) {
      EventBus.emit('toast:show', { type: 'warning', message: '深渊尚未解锁' });
      return false;
    }

    var inst = this._state.instances[abyssId];
    if (!inst || !inst.firstCleared) {
      EventBus.emit('toast:show', { type: 'warning', message: '需要先通关一次才能使用快速战斗' });
      return false;
    }

    var team = HeroManager.getTeam();
    if (!team || team.length === 0) {
      EventBus.emit('toast:show', { type: 'warning', message: '请先编入队伍！' });
      return false;
    }

    // Check ticket cost
    var cost = abyss.ticketCost;
    if (cost.jade && !ResourceManager.canAfford('jade', cost.jade)) {
      EventBus.emit('toast:show', { type: 'warning', message: '玉璧不足！需要💎×' + cost.jade });
      return false;
    }
    if (cost.gold && !ResourceManager.canAfford('gold', cost.gold)) {
      EventBus.emit('toast:show', { type: 'warning', message: '金币不足！需要💰×' + Utils.formatNumber(cost.gold) });
      return false;
    }
    if (cost.iron && !ResourceManager.canAfford('iron', cost.iron)) {
      EventBus.emit('toast:show', { type: 'warning', message: '铁矿不足！需要⛏️×' + cost.iron });
      return false;
    }

    // Deduct ticket cost
    if (cost.jade) ResourceManager.spend('jade', cost.jade);
    if (cost.gold) ResourceManager.spend('gold', cost.gold);
    if (cost.iron) ResourceManager.spend('iron', cost.iron);

    // Record attempt
    inst.lastAttempt = Math.floor(Date.now() / 1000);
    inst.totalAttempts++;

    // Build ally units (same as enterAbyss)
    var atkBonus = typeof TownManager !== 'undefined' ? TownManager.getAtkBonus() : 0;
    var defBonus = typeof TownManager !== 'undefined' ? TownManager.getDefBonus() : 0;
    var hpBonus  = typeof TownManager !== 'undefined' ? TownManager.getHpBonus() : 0;

    var allies = [];
    for (var i = 0; i < team.length; i++) {
      var hero = team[i];
      var template = HeroManager.getTemplate(hero.id);
      var stats = HeroManager.getHeroStats(hero.uid);
      if (!template || !stats) continue;

      var abyssCombatSkills = (typeof HeroManager.getCombatSkills === 'function') ? HeroManager.getCombatSkills(hero.uid) : [];

      allies.push({
        uid: hero.uid,
        id: hero.id,
        name: template.name,
        emoji: template.emoji || '',
        currentHp: Math.floor(stats.hp * (1 + hpBonus)),
        maxHp: Math.floor(stats.hp * (1 + hpBonus)),
        atk: Math.floor(stats.atk * (1 + atkBonus)),
        def: Math.floor(stats.def * (1 + defBonus)),
        spd: stats.spd,
        baseAtk: Math.floor(stats.atk * (1 + atkBonus)),
        baseDef: Math.floor(stats.def * (1 + defBonus)),
        baseSpd: stats.spd,
        skill: abyssCombatSkills.length > 0 ? abyssCombatSkills[0] : (template.skill ? Utils.deepClone(template.skill) : null),
        skillCd: 0,
        skills: abyssCombatSkills,
        skillCds: abyssCombatSkills.map(function () { return 0; }),
        buffs: [],
        isAlive: true,
        isAlly: true,
        position: i,
        deathImmunityUsed: false,
        element: hero.element || null
      });
    }

    this._state.currentRun = {
      abyssId: abyssId,
      currentFloor: 1,
      phase: 'fighting',
      allies: allies,
      enemies: [],
      round: 0,
      log: [],
      rewards: { gold: 0, exp: 0, iron: 0, jade: 0 },
      droppedEquipment: [],
      battleTimer: 0,
      quickBattle: true
    };

    this._setupFloor();

    // Synchronous loop: execute all rounds for all floors
    var MAX_ROUNDS = 200; // Safety limit per floor
    var run = this._state.currentRun;
    while (run && (run.phase === 'fighting' || run.phase === 'transition')) {
      if (run.phase === 'transition') {
        // quickBattle transitions are handled automatically in _handleFloorVictory
        break; // Should not reach here for quickBattle, safety exit
      }
      var roundCount = 0;
      while (run.phase === 'fighting' && roundCount < MAX_ROUNDS) {
        this._executeRound();
        roundCount++;
      }
      // If run completed or defeated, stop
      if (!run || run.phase === 'complete' || run.phase === 'defeat') break;
    }

    EventBus.emit('abyss:entered', { abyssId: abyssId, quickBattle: true });
    return true;
  },

  // ---------- Boss 机制处理（深渊） ----------

  _processBossMechanics: function (boss, round, run) {
    if (!boss.mechanics || boss.mechanics.length === 0) return;
    var self = this;
    boss.mechanics.forEach(function (mech) {
      switch (mech.mechanic) {
        case 'enrage':        self._handleMechEnrage(boss, round, mech, run); break;
        case 'periodic_aoe':  self._handleMechPeriodicAoE(boss, round, mech, run); break;
        case 'high_armor':    self._handleMechHighArmor(boss, mech, run); break;
        case 'element_shield': self._handleMechElementShield(boss, mech, run); break;
        case 'dot_apply':     self._handleMechDotApply(boss, round, mech, run); break;
        case 'summon':        self._handleMechSummon(boss, round, mech, run); break;
        case 'execute':       self._handleMechExecute(boss, round, mech, run); break;
      }
    });
  },

  _handleMechEnrage: function (boss, round, mech, run) {
    if (round === mech.triggerRound) {
      boss.atk = Math.floor(boss.atk * (1 + mech.atkBoost));
      run.log.push('⏰ ' + boss.name + ' 进入狂暴状态！攻击力提升' + Math.round(mech.atkBoost * 100) + '%');
      mech._enraged = true;
    }
    if (mech._enraged && mech.escalation && round > mech.triggerRound && (round - mech.triggerRound) % mech.escalation.interval === 0) {
      boss.atk = Math.floor(boss.atk * (1 + mech.escalation.boost));
      run.log.push('⏰ ' + boss.name + ' 狂暴加剧！攻击力再提升' + Math.round(mech.escalation.boost * 100) + '%');
    }
    if (run.log.length > 50) run.log.shift();
  },

  _handleMechPeriodicAoE: function (boss, round, mech, run) {
    if (round > 0 && round % mech.interval === 0) {
      run.log.push('💥 ' + boss.name + ' 释放范围轰击！');
      var self = this;
      run.allies.forEach(function (unit) {
        if (!unit.isAlive) return;
        var dmg = Math.floor((mech.hpPercent || 0.25) * unit.maxHp);
        self._applyDamage(unit, dmg);
        run.log.push('  ' + unit.name + ' 受到 ' + dmg + ' 点轰击伤害');
        if (!unit.isAlive) {
          run.log.push('  💀 ' + unit.name + ' 阵亡');
        }
      });
      if (run.log.length > 50) run.log.shift();
    }
  },

  _handleMechHighArmor: function (boss, mech, run) {
    if (!mech._applied) {
      boss.def += mech.bonusDef;
      boss.baseDef = (boss.baseDef || boss.def);
      run.log.push('🛡️ ' + boss.name + ' 拥有超高护甲！防御力+' + mech.bonusDef);
      mech._applied = true;
      if (run.log.length > 50) run.log.shift();
    }
  },

  _handleMechElementShield: function (boss, mech, run) {
    if (!mech._applied) {
      boss._elementShield = { immuneElement: mech.immuneElement, weakElement: mech.weakElement };
      var info = (typeof CONSTANTS !== 'undefined' && CONSTANTS.ELEMENT_INFO) ? CONSTANTS.ELEMENT_INFO : {};
      var immuneName = (info[mech.immuneElement] && info[mech.immuneElement].name) ? info[mech.immuneElement].name : mech.immuneElement;
      var weakName = (info[mech.weakElement] && info[mech.weakElement].name) ? info[mech.weakElement].name : mech.weakElement;
      run.log.push('🔮 ' + boss.name + ' 展开属性护盾！免疫' + immuneName + '属性，弱点为' + weakName + '属性');
      mech._applied = true;
      if (run.log.length > 50) run.log.shift();
    }
  },

  _handleMechDotApply: function (boss, round, mech, run) {
    if (round > 0 && round % mech.interval === 0) {
      var aliveAllies = run.allies.filter(function (u) { return u.isAlive; });
      if (aliveAllies.length === 0) return;
      var target = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];
      var dot = { type: 'dot', subtype: mech.dot.subtype, hpPercentDrain: mech.dot.hpPercentDrain, duration: mech.dot.duration, source: boss.name };
      target.buffs.push(dot);
      var subtypeText = mech.dot.subtype === 'poison' ? '🟢中毒' : '🔥灼烧';
      run.log.push('☠️ ' + boss.name + ' 对 ' + target.name + ' 施加了' + subtypeText + '效果（' + mech.dot.duration + '回合）');
      if (run.log.length > 50) run.log.shift();
    }
  },

  _handleMechSummon: function (boss, round, mech, run) {
    if (mech._summoned) {
      if (mech._adds && mech.bossHealPerAdd) {
        var aliveAdds = mech._adds.filter(function (a) { return a.isAlive; }).length;
        if (aliveAdds > 0 && boss.isAlive) {
          var healAmt = Math.floor(boss.maxHp * mech.bossHealPerAdd * aliveAdds);
          boss.currentHp = Math.min(boss.maxHp, boss.currentHp + healAmt);
          run.log.push('🩹 增援为 ' + boss.name + ' 恢复 ' + healAmt + ' 生命值');
          if (run.log.length > 50) run.log.shift();
        }
      }
      return;
    }
    var hpRatio = boss.currentHp / boss.maxHp;
    if (hpRatio <= mech.hpThreshold) {
      mech._summoned = true;
      run.log.push('📢 ' + boss.name + ' 召唤增援！');
      mech._adds = [];
      var self = this;
      mech.adds.forEach(function (addDef) {
        var add = {
          uid: 'abyss_add_' + Utils.uid(),
          name: addDef.name,
          atk: Math.floor((boss.maxAtk || boss.baseAtk || boss.atk) * addDef.atk),
          def: Math.floor((boss.maxDef || boss.baseDef || boss.def) * addDef.def),
          currentHp: Math.floor(boss.maxHp * addDef.hp),
          maxHp: Math.floor(boss.maxHp * addDef.hp),
          baseAtk: Math.floor((boss.maxAtk || boss.baseAtk || boss.atk) * addDef.atk),
          baseDef: Math.floor((boss.maxDef || boss.baseDef || boss.def) * addDef.def),
          baseSpd: addDef.spd || 15,
          spd: addDef.spd || 15,
          isAlive: true,
          isAlly: false,
          buffs: [],
          element: boss.element || null,
          isAdd: true,
          position: run.enemies.length,
          skillCd: 0,
          skill: null
        };
        run.enemies.push(add);
        mech._adds.push(add);
        run.log.push('  🆕 ' + add.name + ' 出现！(HP:' + add.currentHp + ')');
      });
      if (run.log.length > 50) run.log.shift();
    }
  },

  _handleMechExecute: function (boss, round, mech, run) {
    if (!mech._lastExecuteRound) mech._lastExecuteRound = 0;
    if (round - mech._lastExecuteRound < mech.cooldown) return;

    var targets = run.allies.filter(function (u) {
      return u.isAlive && (u.currentHp / u.maxHp) < mech.hpThreshold;
    });
    if (targets.length > 0) {
      var target = targets[0];
      mech._lastExecuteRound = round;
      target.currentHp = 0;
      target.isAlive = false;
      run.log.push('⚡ ' + boss.name + ' 发动斩杀！' + target.name + ' 被处决（生命值低于' + Math.round(mech.hpThreshold * 100) + '%）');
      if (run.log.length > 50) run.log.shift();
    }
  },

  /** Tick buff durations (decrement and expire) */
  _tickBuffs: function (run) {
    var allUnits = run.allies.concat(run.enemies);
    for (var u = 0; u < allUnits.length; u++) {
      var unit = allUnits[u];
      if (!unit.isAlive || !unit.buffs || unit.buffs.length === 0) continue;

      // DoT ticks BEFORE duration countdown (RULE-DOT-1)
      for (var d = 0; d < unit.buffs.length; d++) {
        var buff = unit.buffs[d];
        var buffType = buff.type || 'stat';
        if (buffType === 'dot' && unit.isAlive) {
          var dotDmg = Math.floor(unit.maxHp * buff.hpPercentDrain);
          unit.currentHp = Math.max(1, unit.currentHp - dotDmg);
          var subtypeText = buff.subtype === 'poison' ? '🟢中毒' : '🔥灼烧';
          run.log.push(unit.name + ' 受到' + subtypeText + '伤害 ' + dotDmg);
          if (run.log.length > 50) run.log.shift();
        }
      }

      // Decrement durations + remove expired/broken shields
      for (var b = unit.buffs.length - 1; b >= 0; b--) {
        var bt = unit.buffs[b].type || 'stat';
        if (bt === 'shield' && unit.buffs[b].amount <= 0) {
          unit.buffs.splice(b, 1);
          continue;
        }
        unit.buffs[b].duration--;
        if (unit.buffs[b].duration <= 0) {
          unit.buffs.splice(b, 1);
        }
      }
      this._recalcStats(unit);
    }
  },

  /** Advance to next floor — only valid during 'transition' phase */
  advanceFloor: function () {
    var run = this._state.currentRun;
    if (!run || run.phase !== 'transition') return false;

    run.currentFloor++;
    this._setupFloor();
    EventBus.emit('abyss:floor_advanced', { abyssId: run.abyssId, floor: run.currentFloor });
    return true;
  },

  /** Clear the current run (after viewing results) */
  clearRun: function () {
    this._state.currentRun = null;
  },

  _pickAlive: function (units) {
    var alive = [];
    for (var i = 0; i < units.length; i++) { if (units[i].isAlive) alive.push(units[i]); }
    if (alive.length === 0) return null;

    // RULE-TAUNT-1: Check for taunt
    for (var t = 0; t < alive.length; t++) {
      if (alive[t].buffs && alive[t].buffs.some(function (b) {
        return (b.type || 'stat') === 'taunt' && b.duration > 0;
      })) {
        return alive[t];
      }
    }

    return alive[Utils.randInt(0, alive.length - 1)];
  },

  _getAlive: function (units) {
    var alive = [];
    for (var i = 0; i < units.length; i++) { if (units[i].isAlive) alive.push(units[i]); }
    return alive;
  },

  isUnlocked: function () { return this._state.unlocked; },
  getCurrentRun: function () { return this._state.currentRun; },
  getInstance: function (abyssId) { return this._state.instances[abyssId]; },

  getState: function () {
    return {
      unlocked: this._state.unlocked,
      instances: Utils.deepClone(this._state.instances)
    };
  }
};
