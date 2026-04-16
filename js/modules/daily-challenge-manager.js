/**
 * 每日挑战管理器
 *
 * 每天生成固定种子的挑战关卡（所有玩家相同），奖励丰厚。
 * 每天 3 次挑战机会，难度逐级递增。
 */
var DailyChallengeManager = {

  _state: {
    lastDate: '',        // 'YYYY-MM-DD' 上次挑战日期
    attempts: 0,         // 今日已用次数
    maxAttempts: 3,
    bestScore: 0,        // 今日最高分
    totalDays: 0,        // 累计挑战天数
    currentBattle: null  // 当前战斗状态
  },

  init: function (saved) {
    var data = (saved && saved.dailyChallenge) ? saved.dailyChallenge : {};
    this._state.lastDate = data.lastDate || '';
    this._state.attempts = data.attempts || 0;
    this._state.bestScore = data.bestScore || 0;
    this._state.totalDays = data.totalDays || 0;
    this._state.currentBattle = null;
    this._checkDateReset();
  },

  getState: function () {
    return {
      lastDate: this._state.lastDate,
      attempts: this._state.attempts,
      bestScore: this._state.bestScore,
      totalDays: this._state.totalDays
    };
  },

  _checkDateReset: function () {
    var today = this._getToday();
    if (this._state.lastDate !== today) {
      this._state.lastDate = today;
      this._state.attempts = 0;
      this._state.bestScore = 0;
    }
  },

  _getToday: function () {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  /** 基于日期的伪随机种子 */
  _seedRandom: function (seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  },

  _dateSeed: function () {
    var today = this._getToday();
    var seed = 0;
    for (var i = 0; i < today.length; i++) {
      seed = seed * 31 + today.charCodeAt(i);
    }
    return seed;
  },

  getAttemptsLeft: function () {
    this._checkDateReset();
    return this._state.maxAttempts - this._state.attempts;
  },

  /** 开始每日挑战 */
  startChallenge: function () {
    this._checkDateReset();
    if (this._state.attempts >= this._state.maxAttempts) {
      EventBus.emit('toast:show', { type: 'warning', message: '今日挑战次数已用完！' });
      return false;
    }

    var team = (typeof HeroManager !== 'undefined') ? HeroManager.getTeam() : [];
    if (team.length === 0) {
      EventBus.emit('toast:show', { type: 'warning', message: '请先编队！' });
      return false;
    }

    this._state.attempts++;
    if (this._state.attempts === 1) this._state.totalDays++;

    // 构建友方
    var allies = [];
    for (var i = 0; i < team.length; i++) {
      var hero = team[i];
      var template = HeroManager.getTemplate(hero.id);
      var stats = HeroManager.getHeroStats(hero.uid);
      if (!template || !stats) continue;
      allies.push({
        uid: hero.uid, id: hero.id, name: template.name, emoji: template.emoji,
        currentHp: stats.hp, maxHp: stats.hp, atk: stats.atk, def: stats.def, spd: stats.spd,
        isAlive: true, isAlly: true, position: i,
        skill: template.skill ? Utils.deepClone(template.skill) : null,
        skillCd: 0, skills: [], skillCds: [], buffs: [],
        setCritRate: 0.05, setDoubleDmg: 0
      });
    }

    // 根据日期种子生成敌人
    var seed = this._dateSeed() + this._state.attempts;
    var enemies = this._generateDailyEnemies(seed, this._state.attempts);

    this._state.currentBattle = {
      allies: allies,
      enemies: enemies,
      round: 0,
      phase: 'fighting',
      log: [],
      attempt: this._state.attempts
    };

    EventBus.emit('daily:started', { attempt: this._state.attempts });
    return true;
  },

  /** 战斗 Tick */
  onTick: function (dt) {
    var b = this._state.currentBattle;
    if (!b || b.phase !== 'fighting') return;

    b.round++;
    var allUnits = [];
    for (var a = 0; a < b.allies.length; a++) { if (b.allies[a].isAlive) allUnits.push(b.allies[a]); }
    for (var e = 0; e < b.enemies.length; e++) { if (b.enemies[e].isAlive) allUnits.push(b.enemies[e]); }
    allUnits.sort(function (x, y) { return y.spd - x.spd; });

    for (var u = 0; u < allUnits.length; u++) {
      var unit = allUnits[u];
      if (!unit.isAlive) continue;
      var hostiles = unit.isAlly ? b.enemies : b.allies;
      var target = this._pickAlive(hostiles);
      if (!target) break;

      // 技能或普攻
      if (unit.skill && (unit.skillCd || 0) <= 0 && unit.skill.type === 'damage') {
        var sMult = unit.skill.multiplier || 1.3;
        var sDmg = this._calcDmg(unit, target, sMult);
        target.currentHp -= sDmg;
        unit.skillCd = unit.skill.cd || 3;
      } else {
        var dmg = this._calcDmg(unit, target, 1.0);
        target.currentHp -= dmg;
      }
      if (unit.skillCd > 0) unit.skillCd--;
      if (target.currentHp <= 0) { target.currentHp = 0; target.isAlive = false; }
    }

    // 回合上限：30 回合超时判负
    var alliesAlive = false, enemiesAlive = false;
    for (var ca = 0; ca < b.allies.length; ca++) { if (b.allies[ca].isAlive) alliesAlive = true; }
    for (var ce = 0; ce < b.enemies.length; ce++) { if (b.enemies[ce].isAlive) enemiesAlive = true; }

    EventBus.emit('daily:tick', { round: b.round });

    if (!enemiesAlive) {
      this._endBattle(true, b);
    } else if (!alliesAlive || b.round >= 30) {
      this._endBattle(false, b);
    }
  },

  _calcDmg: function (attacker, defender, mult) {
    var base = Math.floor(attacker.atk * mult * (0.9 + Math.random() * 0.2));
    var red = defender.def / (defender.def + 100);
    return Math.max(1, Math.floor(base * (1 - red)));
  },

  _pickAlive: function (units) {
    var alive = [];
    for (var i = 0; i < units.length; i++) { if (units[i].isAlive) alive.push(units[i]); }
    return alive.length > 0 ? alive[Math.floor(Math.random() * alive.length)] : null;
  },

  _endBattle: function (victory, b) {
    b.phase = 'ended';
    var score = victory ? b.round * 10 + 500 : b.round * 5;
    if (score > this._state.bestScore) this._state.bestScore = score;

    var rewards = {
      gold: victory ? 300 + b.attempt * 100 : 100,
      exp: victory ? 200 + b.attempt * 50 : 50,
      jade: victory ? 2 : 0
    };

    if (typeof ResourceManager !== 'undefined') {
      ResourceManager.add('gold', rewards.gold);
      ResourceManager.add('exp', rewards.exp);
      if (rewards.jade > 0) ResourceManager.add('jade', rewards.jade);
    }

    this._state.currentBattle = null;
    EventBus.emit('daily:ended', { victory: victory, score: score, rewards: rewards, attempt: b.attempt });
  },

  /** 根据种子生成每日敌人 */
  _generateDailyEnemies: function (seed, attempt) {
    var names = ['黄巾贼首', '山寨大王', '叛军首领', '异族勇士', '暗影刺客',
                 '铁甲将军', '火焰法师', '冰霜巫师', '毒蛇教主', '幽灵武将'];
    var emojis = ['👹', '🗡️', '⚔️', '🏹', '🥷', '🛡️', '🔥', '❄️', '🐍', '👻'];

    var count = 3 + attempt;  // 第1次4个，第2次5个，第3次6个
    var scaleMult = 0.8 + attempt * 0.4; // 越往后越强
    var enemies = [];

    for (var i = 0; i < count; i++) {
      var r = this._seedRandom(seed + i * 137);
      var idx = Math.floor(r * names.length);
      enemies.push({
        uid: 'daily_' + i,
        name: names[idx],
        emoji: emojis[idx],
        currentHp: Math.floor((200 + r * 150) * scaleMult),
        maxHp: Math.floor((200 + r * 150) * scaleMult),
        atk: Math.floor((25 + r * 15) * scaleMult),
        def: Math.floor((15 + r * 10) * scaleMult),
        spd: Math.floor(8 + r * 6),
        isAlive: true,
        isAlly: false,
        skill: attempt >= 2 ? { name: '猛击', type: 'damage', multiplier: 1.4, cd: 3 } : null,
        skillCd: 0,
        position: i
      });
    }
    return enemies;
  }
};
