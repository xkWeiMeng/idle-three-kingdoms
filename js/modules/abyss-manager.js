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
        deathImmunityUsed: false
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
      skill: boss.skill ? Utils.deepClone(boss.skill) : null,
      skillCd: 0,
      buffs: [],
      isAlive: true,
      isAlly: false,
      position: 0
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
    target.currentHp -= dmg.damage;

    // Death immunity check (set bonus)
    if (target.currentHp <= 0 && target.isAlly && !target.deathImmunityUsed) {
      var hero = HeroManager.getHeroByUid(target.uid);
      if (hero) {
        var bonuses = getHeroSetBonuses(hero.equipment);
        for (var b = 0; b < bonuses.length; b++) {
          var eff = bonuses[b].bonus.effects;
          if (eff.deathImmunityChance && Math.random() < eff.deathImmunityChance) {
            target.currentHp = 1;
            target.deathImmunityUsed = true;
            run.log.push('[第' + run.round + '回合] ✨ ' + target.name + ' 天命不灭！免疫致命伤害！');
            return;
          }
        }
      }
    }

    if (target.currentHp <= 0) {
      target.currentHp = 0;
      target.isAlive = false;
    }

    var critText = dmg.isCrit ? ' 💥暴击！' : '';
    run.log.push('[第' + run.round + '回合] ' + unit.name + ' → ' + target.name +
      ' ' + dmg.damage + '伤害' + critText);
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
        unit.buffs.push({ stat: effect.stat, ratio: effect.ratio, duration: effect.duration });
        this._recalcStats(unit);
        run.log.push('[第' + run.round + '回合] ' + unit.name + ' 使用 ' + skillName);
      }
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
      tgt.currentHp -= dmg.damage;
      if (tgt.currentHp <= 0) { tgt.currentHp = 0; tgt.isAlive = false; }

      run.log.push('[第' + run.round + '回合] ' + unit.name + ' [' + skillName + '] → ' +
        tgt.name + ' ' + dmg.damage + '伤害' + (dmg.isCrit ? ' 💥' : ''));
    }
    if (run.log.length > 50) run.log.shift();
  },

  _calcDamage: function (attacker, defender, multiplier) {
    var rand = 0.9 + Math.random() * 0.2;
    var base = Math.floor(attacker.atk * multiplier * rand);
    var reduction = defender.def / (defender.def + 100);
    var damage = Math.max(1, Math.floor(base * (1 - reduction)));
    var isCrit = Math.random() < 0.05;
    if (isCrit) damage = Math.floor(damage * 1.5);
    return { damage: damage, isCrit: isCrit };
  },

  _recalcStats: function (unit) {
    var atkMod = 1, defMod = 1, spdMod = 1;
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

    EventBus.emit('abyss:floor_cleared', {
      abyssId: run.abyssId, floor: run.currentFloor, rewards: floorData.rewards
    });

    run.log.push('═══ 第 ' + run.currentFloor + ' 层通关！ ═══');

    // Check if last floor
    if (run.currentFloor >= abyss.floors.length) {
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

    // Quick battle: advance immediately; normal: pause for UI transition
    if (run.quickBattle) {
      run.currentFloor++;
      this._setupFloor();
    } else {
      run.phase = 'transition';
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
        deathImmunityUsed: false
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
        // Tick buff durations after each round
        this._tickBuffs(run);
        roundCount++;
      }
      // If run completed or defeated, stop
      if (!run || run.phase === 'complete' || run.phase === 'defeat') break;
    }

    EventBus.emit('abyss:entered', { abyssId: abyssId, quickBattle: true });
    return true;
  },

  /** Tick buff durations (decrement and expire) */
  _tickBuffs: function (run) {
    var allUnits = run.allies.concat(run.enemies);
    for (var u = 0; u < allUnits.length; u++) {
      var unit = allUnits[u];
      if (!unit.isAlive || !unit.buffs || unit.buffs.length === 0) continue;
      for (var b = unit.buffs.length - 1; b >= 0; b--) {
        unit.buffs[b].duration--;
        if (unit.buffs[b].duration <= 0) {
          unit.buffs.splice(b, 1);
        }
      }
      if (unit.buffs.length === 0 || unit.buffs.length !== unit.buffs.length) {
        this._recalcStats(unit);
      }
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
    return alive.length > 0 ? alive[Utils.randInt(0, alive.length - 1)] : null;
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
