/**
 * Roguelike 无尽模式管理器
 *
 * 玩法：
 *   - 使用当前队伍进入无尽塔，HP 在层间保留
 *   - 每层随机生成敌人（强度随层数递增）
 *   - 每通过 5 层选择一个随机增益
 *   - 队伍全灭则结算（记录最高层）
 *   - 奖励基于到达层数
 */
var RoguelikeManager = {

  _state: {
    unlocked: false,
    bestFloor: 0,        // 历史最高层
    totalRuns: 0,
    currentRun: null     // { floor, allies, buffs, phase }
  },

  // 增益池
  _buffPool: [
    { id: 'atk_up',   name: '虎威',   icon: '🐯', desc: '全体攻击+15%', effect: { stat: 'atk', mult: 0.15 } },
    { id: 'def_up',   name: '龟甲',   icon: '🐢', desc: '全体防御+15%', effect: { stat: 'def', mult: 0.15 } },
    { id: 'hp_up',    name: '生机',   icon: '💚', desc: '全体HP+20%并回满', effect: { stat: 'hp', mult: 0.20, heal: true } },
    { id: 'spd_up',   name: '神速',   icon: '⚡', desc: '全体速度+20%', effect: { stat: 'spd', mult: 0.20 } },
    { id: 'crit_up',  name: '破军',   icon: '💀', desc: '暴击率+10%', effect: { combatKey: 'setCritRate', add: 0.10 } },
    { id: 'heal',     name: '妙手',   icon: '🩹', desc: '全体回复50%HP', effect: { healPercent: 0.50 } },
    { id: 'lifesteal', name: '嗜血',  icon: '🩸', desc: '吸血+8%', effect: { combatKey: 'affixLifesteal', add: 8 } },
    { id: 'thorns',   name: '荆棘',   icon: '🌵', desc: '反伤+10%', effect: { combatKey: 'affixThorns', add: 10 } },
    { id: 'double',   name: '连击',   icon: '⚔️', desc: '双击概率+8%', effect: { combatKey: 'setDoubleDmg', add: 0.08 } },
    { id: 'energy',   name: '气海',   icon: '🌀', desc: '初始能量+30', effect: { energyAdd: 30 } }
  ],

  init: function (saved) {
    var data = (saved && saved.roguelike) ? saved.roguelike : {};
    this._state.unlocked = data.unlocked || false;
    this._state.bestFloor = data.bestFloor || 0;
    this._state.totalRuns = data.totalRuns || 0;
    this._state.currentRun = data.currentRun || null;

    // 通关 stage_3_1 解锁
    var self = this;
    EventBus.on('battle:ended', function (d) {
      if (!self._state.unlocked && d && d.victory && d.stageId) {
        var p = d.stageId.split('_');
        if (p.length === 3 && (parseInt(p[1]) > 3 || (parseInt(p[1]) === 3 && parseInt(p[2]) >= 1))) {
          self._state.unlocked = true;
          EventBus.emit('toast:show', { type: 'success', message: '🏯 无尽试炼已解锁！' });
        }
      }
    });
  },

  getState: function () {
    return {
      unlocked: this._state.unlocked,
      bestFloor: this._state.bestFloor,
      totalRuns: this._state.totalRuns,
      currentRun: this._state.currentRun ? Utils.deepClone(this._state.currentRun) : null
    };
  },

  isUnlocked: function () { return this._state.unlocked; },
  getBestFloor: function () { return this._state.bestFloor; },
  getCurrentRun: function () { return this._state.currentRun; },

  /** 开始新的无尽试炼 */
  startRun: function () {
    var team = (typeof HeroManager !== 'undefined') ? HeroManager.getTeam() : [];
    if (team.length === 0) {
      EventBus.emit('toast:show', { type: 'warning', message: '请先编队！' });
      return false;
    }

    // 构建初始战斗单位（复用 HeroManager 属性）
    var allies = [];
    for (var i = 0; i < team.length; i++) {
      var hero = team[i];
      var template = HeroManager.getTemplate(hero.id);
      var stats = HeroManager.getHeroStats(hero.uid);
      if (!template || !stats) continue;

      allies.push({
        uid: hero.uid,
        id: hero.id,
        name: template.name,
        emoji: template.emoji,
        currentHp: stats.hp,
        maxHp: stats.hp,
        atk: stats.atk,
        def: stats.def,
        spd: stats.spd,
        baseAtk: stats.atk,
        baseDef: stats.def,
        baseSpd: stats.spd,
        isAlive: true,
        isAlly: true,
        skillCd: 0,
        skill: template.skill ? Utils.deepClone(template.skill) : null,
        skills: HeroManager.getCombatSkills ? HeroManager.getCombatSkills(hero.uid) : [],
        skillCds: [],
        buffs: [],
        position: i,
        setCritRate: 0.05,
        setDoubleDmg: 0,
        affixLifesteal: 0,
        affixThorns: 0,
        affixDodge: 0,
        affixHealPerRound: 0,
        affixCritRate: 0,
        affixCritDmg: 0,
        ultimate: (typeof UltimateSkills !== 'undefined' && UltimateSkills[hero.id]) ? UltimateSkills[hero.id] : null,
        energy: 0,
        energyMax: 100,
        ultimateReady: false
      });
      allies[allies.length - 1].skillCds = allies[allies.length - 1].skills.map(function () { return 0; });
    }

    this._state.currentRun = {
      floor: 0,
      allies: allies,
      buffs: [],
      phase: 'idle'  // idle | fighting | choosing | ended
    };
    this._state.totalRuns++;
    this._advanceFloor();
    return true;
  },

  /** 推进到下一层 */
  _advanceFloor: function () {
    var run = this._state.currentRun;
    if (!run) return;

    run.floor++;
    // 每 5 层选增益（第 1 层不选）
    if (run.floor > 1 && (run.floor - 1) % 5 === 0) {
      run.phase = 'choosing';
      run.choices = this._rollBuffChoices(3);
      EventBus.emit('roguelike:choose_buff', { floor: run.floor, choices: run.choices });
      return;
    }

    this._startFloorBattle();
  },

  /** 选择增益 */
  chooseBuff: function (buffId) {
    var run = this._state.currentRun;
    if (!run || run.phase !== 'choosing') return false;

    var chosen = null;
    for (var i = 0; i < run.choices.length; i++) {
      if (run.choices[i].id === buffId) { chosen = run.choices[i]; break; }
    }
    if (!chosen) return false;

    run.buffs.push(chosen.id);
    this._applyBuff(chosen.effect, run.allies);
    run.choices = null;
    EventBus.emit('toast:show', { type: 'success', message: chosen.icon + ' ' + chosen.name + '：' + chosen.desc });
    this._startFloorBattle();
    return true;
  },

  /** 生成敌人并开始战斗 */
  _startFloorBattle: function () {
    var run = this._state.currentRun;
    run.phase = 'fighting';
    run.enemies = this._generateEnemies(run.floor);
    run.battleLog = [];
    run.round = 0;
    EventBus.emit('roguelike:floor_start', { floor: run.floor, enemies: run.enemies });
  },

  /** 战斗 Tick（由 onTick 驱动） */
  onTick: function (dt) {
    var run = this._state.currentRun;
    if (!run || run.phase !== 'fighting') return;

    run.round++;
    var allUnits = [];
    for (var a = 0; a < run.allies.length; a++) {
      if (run.allies[a].isAlive) allUnits.push(run.allies[a]);
    }
    for (var e = 0; e < run.enemies.length; e++) {
      if (run.enemies[e].isAlive) allUnits.push(run.enemies[e]);
    }

    allUnits.sort(function (x, y) { return y.spd - x.spd; });

    // 回合内每个单位行动
    for (var u = 0; u < allUnits.length; u++) {
      var unit = allUnits[u];
      if (!unit.isAlive) continue;

      var friendlies = unit.isAlly ? run.allies : run.enemies;
      var hostiles = unit.isAlly ? run.enemies : run.allies;

      // 检查是否还有存活目标
      var hasTarget = false;
      for (var ht = 0; ht < hostiles.length; ht++) {
        if (hostiles[ht].isAlive) { hasTarget = true; break; }
      }
      if (!hasTarget) break;

      // 技能或普攻
      var usedSkill = false;
      if (unit.skills && unit.skills.length > 0) {
        for (var si = 0; si < unit.skills.length; si++) {
          if ((unit.skillCds[si] || 0) <= 0) {
            this._doSkillAttack(unit, unit.skills[si], hostiles, run);
            unit.skillCds[si] = unit.skills[si].cooldown || 3;
            usedSkill = true;
            break;
          }
        }
      }
      if (!usedSkill) {
        if (!usedSkill && unit.skill && (unit.skillCd || 0) <= 0) {
          this._doSkillAttack(unit, unit.skill, hostiles, run);
          unit.skillCd = unit.skill.cooldown || unit.skill.cd || 3;
        } else {
          this._doNormalAttack(unit, hostiles, run);
        }
      }

      // 减技能 CD
      if (unit.skills) { for (var ci = 0; ci < unit.skillCds.length; ci++) { if (unit.skillCds[ci] > 0) unit.skillCds[ci]--; } }
      if (unit.skillCd > 0) unit.skillCd--;
    }

    // 回合结束：检查胜败
    var alliesAlive = false, enemiesAlive = false;
    for (var ca = 0; ca < run.allies.length; ca++) { if (run.allies[ca].isAlive) alliesAlive = true; }
    for (var ce = 0; ce < run.enemies.length; ce++) { if (run.enemies[ce].isAlive) enemiesAlive = true; }

    EventBus.emit('roguelike:tick', { floor: run.floor, round: run.round });

    if (!enemiesAlive) {
      // 过关
      if (run.floor > this._state.bestFloor) this._state.bestFloor = run.floor;
      this._advanceFloor();
    } else if (!alliesAlive) {
      // 全灭，结算
      this._endRun();
    }
  },

  _doNormalAttack: function (unit, hostiles, run) {
    var target = this._pickAlive(hostiles);
    if (!target) return;
    var result = this._calcDamage(unit, target);
    if (result.isDodge) return;

    target.currentHp -= result.damage;
    // 吸血
    if (unit.affixLifesteal && unit.isAlive) {
      unit.currentHp = Math.min(unit.maxHp, unit.currentHp + Math.floor(result.damage * unit.affixLifesteal / 100));
    }
    // 荆棘
    if (target.affixThorns && target.isAlive) {
      var tDmg = Math.floor(result.damage * target.affixThorns / 100);
      unit.currentHp -= tDmg;
      if (unit.currentHp <= 0) { unit.currentHp = 0; unit.isAlive = false; }
    }
    if (target.currentHp <= 0) { target.currentHp = 0; target.isAlive = false; }

    // 能量
    if (unit.ultimate && unit.isAlly) {
      unit.energy = Math.min(unit.energyMax, (unit.energy || 0) + 8);
      if (unit.energy >= unit.energyMax) unit.ultimateReady = true;
    }
  },

  _doSkillAttack: function (unit, skill, hostiles, run) {
    var mult = skill.multiplier || 1.2;
    if (skill.type === 'heal' || skill.type === 'buff') {
      // 治疗技能
      var friendlies = unit.isAlly ? run.allies : run.enemies;
      for (var i = 0; i < friendlies.length; i++) {
        if (friendlies[i].isAlive) {
          var heal = Math.floor(unit.atk * mult * 0.5);
          friendlies[i].currentHp = Math.min(friendlies[i].maxHp, friendlies[i].currentHp + heal);
        }
      }
      return;
    }
    var target = this._pickAlive(hostiles);
    if (!target) return;
    var result = this._calcDamage(unit, target, mult);
    if (result.isDodge) return;
    target.currentHp -= result.damage;
    if (target.currentHp <= 0) { target.currentHp = 0; target.isAlive = false; }
  },

  _calcDamage: function (attacker, defender, multiplier) {
    multiplier = multiplier || 1.0;
    // 闪避
    if ((defender.affixDodge || 0) > 0 && Math.random() < defender.affixDodge / 100) {
      return { damage: 0, isCrit: false, isDodge: true };
    }
    var base = Math.floor(attacker.atk * multiplier * (0.9 + Math.random() * 0.2));
    var red = defender.def / (defender.def + 100);
    var dmg = Math.max(1, Math.floor(base * (1 - red)));
    var crit = Math.random() < (attacker.setCritRate || 0.05) + (attacker.affixCritRate || 0) / 100;
    if (crit) dmg = Math.floor(dmg * (1.5 + (attacker.affixCritDmg || 0) / 100));
    // 双击
    if ((attacker.setDoubleDmg || 0) > 0 && Math.random() < attacker.setDoubleDmg) dmg *= 2;
    return { damage: dmg, isCrit: crit, isDodge: false };
  },

  _pickAlive: function (units) {
    var alive = [];
    for (var i = 0; i < units.length; i++) { if (units[i].isAlive) alive.push(units[i]); }
    return alive.length > 0 ? alive[Utils.randInt(0, alive.length - 1)] : null;
  },

  /** 生成本层敌人（难度随层数增长） */
  _generateEnemies: function (floor) {
    var count = Math.min(5, 2 + Math.floor(floor / 5));
    var scaleMult = 1 + (floor - 1) * 0.12; // 每层+12%
    var names = ['山贼', '黄巾兵', '弓手', '铁甲卫', '巫师', '暗杀者', '重骑兵', '火焰术士', '毒蛇使', '战鼓手'];
    var emojis = ['🗡️', '🏹', '🛡️', '🔮', '🐍', '🥷', '🐎', '🔥', '☠️', '🥁'];
    var enemies = [];
    for (var i = 0; i < count; i++) {
      var idx = Utils.randInt(0, names.length - 1);
      var baseAtk = 15 + floor * 3;
      var baseDef = 8 + floor * 2;
      var baseHp = 80 + floor * 20;
      var baseSpd = 8 + Utils.randInt(0, 5);
      enemies.push({
        uid: 'rl_enemy_' + Utils.uid(),
        name: names[idx] + (floor > 10 ? '·精英' : ''),
        emoji: emojis[idx],
        currentHp: Math.floor(baseHp * scaleMult),
        maxHp: Math.floor(baseHp * scaleMult),
        atk: Math.floor(baseAtk * scaleMult),
        def: Math.floor(baseDef * scaleMult),
        spd: baseSpd,
        isAlive: true,
        isAlly: false,
        skill: floor >= 8 ? { name: '猛击', type: 'damage', multiplier: 1.3, cooldown: 3 } : null,
        skillCd: 0,
        skills: [],
        skillCds: [],
        position: i,
        setCritRate: 0,
        setDoubleDmg: 0,
        affixLifesteal: 0,
        affixThorns: 0,
        affixDodge: 0,
        affixHealPerRound: 0,
        affixCritRate: 0,
        affixCritDmg: 0
      });
    }
    // Boss 每 10 层
    if (floor % 10 === 0) {
      var bossIdx = Utils.randInt(0, names.length - 1);
      enemies.push({
        uid: 'rl_boss_' + Utils.uid(),
        name: '💀 ' + names[bossIdx] + '首领',
        emoji: '👹',
        currentHp: Math.floor(baseHp * scaleMult * 3),
        maxHp: Math.floor(baseHp * scaleMult * 3),
        atk: Math.floor(baseAtk * scaleMult * 1.8),
        def: Math.floor(baseDef * scaleMult * 1.5),
        spd: 15,
        isAlive: true,
        isAlly: false,
        skill: { name: '狂暴一击', type: 'damage', multiplier: 2.0, cooldown: 4 },
        skillCd: 0,
        skills: [],
        skillCds: [],
        position: count,
        setCritRate: 0.1,
        setDoubleDmg: 0,
        affixLifesteal: 0,
        affixThorns: 0,
        affixDodge: 0,
        affixHealPerRound: 0,
        affixCritRate: 0,
        affixCritDmg: 0
      });
    }
    return enemies;
  },

  /** 随机选 N 个不重复增益 */
  _rollBuffChoices: function (n) {
    var pool = this._buffPool.slice();
    var choices = [];
    for (var i = 0; i < n && pool.length > 0; i++) {
      var idx = Utils.randInt(0, pool.length - 1);
      choices.push(Utils.deepClone(pool[idx]));
      pool.splice(idx, 1);
    }
    return choices;
  },

  /** 应用增益到所有友军 */
  _applyBuff: function (effect, allies) {
    for (var i = 0; i < allies.length; i++) {
      var u = allies[i];
      if (!u.isAlive) continue;
      if (effect.stat) {
        var key = effect.stat;
        u[key] = Math.floor(u[key] * (1 + effect.mult));
        if (key === 'hp') {
          u.maxHp = Math.floor(u.maxHp * (1 + effect.mult));
          if (effect.heal) u.currentHp = u.maxHp;
        }
      }
      if (effect.combatKey) {
        u[effect.combatKey] = (u[effect.combatKey] || 0) + effect.add;
      }
      if (effect.healPercent) {
        u.currentHp = Math.min(u.maxHp, u.currentHp + Math.floor(u.maxHp * effect.healPercent));
      }
      if (effect.energyAdd && u.ultimate) {
        u.energy = Math.min(u.energyMax, (u.energy || 0) + effect.energyAdd);
        if (u.energy >= u.energyMax) u.ultimateReady = true;
      }
    }
  },

  /** 手动触发终极技能 */
  triggerUltimate: function (uid) {
    var run = this._state.currentRun;
    if (!run || run.phase !== 'fighting') return false;
    var unit = null;
    for (var i = 0; i < run.allies.length; i++) {
      if (run.allies[i].uid === uid && run.allies[i].isAlive && run.allies[i].ultimateReady) {
        unit = run.allies[i];
        break;
      }
    }
    if (!unit || !unit.ultimate) return false;

    var ult = unit.ultimate;
    unit.energy = 0;
    unit.ultimateReady = false;

    // 简化终极技能：对所有敌人造成大伤害
    var mult = ult.multiplier || 2.0;
    for (var e = 0; e < run.enemies.length; e++) {
      if (run.enemies[e].isAlive) {
        var dmg = Math.max(1, Math.floor(unit.atk * mult * (0.9 + Math.random() * 0.2) * (1 - run.enemies[e].def / (run.enemies[e].def + 100))));
        run.enemies[e].currentHp -= dmg;
        if (run.enemies[e].currentHp <= 0) { run.enemies[e].currentHp = 0; run.enemies[e].isAlive = false; }
      }
    }
    EventBus.emit('toast:show', { type: 'success', message: '🌟 ' + unit.name + ' 释放【' + ult.name + '】！' });
    return true;
  },

  /** 结算本次试炼 */
  _endRun: function () {
    var run = this._state.currentRun;
    run.phase = 'ended';

    var rewards = {
      gold: run.floor * 50,
      exp: run.floor * 30,
      jade: Math.floor(run.floor / 5)
    };

    if (typeof ResourceManager !== 'undefined') {
      ResourceManager.add('gold', rewards.gold);
      ResourceManager.add('exp', rewards.exp);
      if (rewards.jade > 0) ResourceManager.add('jade', rewards.jade);
    }

    EventBus.emit('roguelike:run_ended', {
      floor: run.floor,
      bestFloor: this._state.bestFloor,
      rewards: rewards,
      buffsChosen: run.buffs.length
    });
  },

  /** 放弃当前试炼 */
  abandonRun: function () {
    if (this._state.currentRun) {
      if (this._state.currentRun.floor > this._state.bestFloor) {
        this._state.bestFloor = this._state.currentRun.floor;
      }
      this._endRun();
    }
  }
};
