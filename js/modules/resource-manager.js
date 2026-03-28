/**
 * 资源管理器 — 管理金币/玉璧/经验/粮草，统计数据，每日签到
 */
const ResourceManager = {
  _state: { gold: 0, jade: 0, exp: 0, food: 100 },
  _foodTimer: 0,
  _stats: {
    totalGoldEarned: 0,
    totalBattles: 0,
    totalPlayTime: 0,
    highestStage: '',
    loginDays: 0,
    lastLoginDate: '',
    dailyLoginClaimed: false
  },

  // 7日签到奖励循环
  _dailyRewards: [
    { gold: 500, jade: 20 },
    { gold: 500, jade: 20 },
    { gold: 1000, jade: 20, food: 20 },
    { gold: 500, jade: 20 },
    { gold: 500, jade: 20 },
    { gold: 1000, jade: 20, food: 20 },
    { gold: 2000, jade: 50, freeRecruit: true }
  ],

  init(saved) {
    if (saved && saved.resources) {
      const resSave = saved.resources;
      // getState() returns { resources: {...}, stats: {...} }
      if (resSave.resources) {
        this._state = resSave.resources;
        this._stats = resSave.stats || Utils.deepClone(this._stats);
      } else if (typeof resSave.gold === 'number') {
        // 直接就是资源对象
        this._state = resSave;
        this._stats = saved.stats || Utils.deepClone(this._stats);
      }
    } else if (saved && typeof saved.gold === 'number') {
      this._state = saved;
      this._stats = {
        totalGoldEarned: 0, totalBattles: 0, totalPlayTime: 0,
        highestStage: '', loginDays: 0, lastLoginDate: '', dailyLoginClaimed: false
      };
    } else {
      // 新游戏
      this._state = { gold: 500, jade: 0, exp: 0, food: 100 };
      this._stats = {
        totalGoldEarned: 0, totalBattles: 0, totalPlayTime: 0,
        highestStage: '', loginDays: 0, lastLoginDate: '', dailyLoginClaimed: false
      };
    }
    this._foodTimer = 0;
    this.checkDailyLogin();
  },

  onTick(dt) {
    // 粮草恢复：每30秒+1，上限200
    this._foodTimer += dt;
    while (this._foodTimer >= 30) {
      this._foodTimer -= 30;
      if (this._state.food < 200) {
        this._state.food = Math.min(this._state.food + 1, 200);
        EventBus.emit('resource:changed', 'food', this._state.food);
      }
    }
    // 累计在线时长
    this._stats.totalPlayTime += dt;
  },

  get(type) {
    return this._state[type] || 0;
  },

  add(type, amount) {
    if (amount <= 0) return;
    this._state[type] = (this._state[type] || 0) + amount;
    if (type === 'gold') {
      this._stats.totalGoldEarned += amount;
    }
    EventBus.emit('resource:changed', type, this._state[type]);
  },

  spend(type, amount) {
    if (!this.canAfford(type, amount)) return false;
    this._state[type] -= amount;
    EventBus.emit('resource:changed', type, this._state[type]);
    return true;
  },

  canAfford(type, amount) {
    return (this._state[type] || 0) >= amount;
  },

  getAll() {
    return { gold: this._state.gold, jade: this._state.jade, exp: this._state.exp, food: this._state.food };
  },

  // —— 统计 ——
  addBattleCount() { this._stats.totalBattles++; },
  setHighestStage(stageId) { this._stats.highestStage = stageId; },
  getStats() {
    return {
      totalGoldEarned: this._stats.totalGoldEarned,
      totalBattles: this._stats.totalBattles,
      totalPlayTime: this._stats.totalPlayTime,
      highestStage: this._stats.highestStage,
      loginDays: this._stats.loginDays,
      lastLoginDate: this._stats.lastLoginDate,
      dailyLoginClaimed: this._stats.dailyLoginClaimed
    };
  },

  // —— 每日签到 ——
  checkDailyLogin() {
    var today = new Date().toISOString().slice(0, 10);
    if (this._stats.lastLoginDate !== today) {
      this._stats.loginDays++;
      this._stats.lastLoginDate = today;
      this._stats.dailyLoginClaimed = false;
    }
    var idx = (this._stats.loginDays - 1) % 7;
    return {
      day: this._stats.loginDays,
      reward: this._dailyRewards[idx],
      claimed: this._stats.dailyLoginClaimed
    };
  },

  claimDailyReward() {
    if (this._stats.dailyLoginClaimed) return null;
    var idx = (this._stats.loginDays - 1) % 7;
    var reward = this._dailyRewards[idx];
    if (reward.gold)  this.add('gold', reward.gold);
    if (reward.jade)  this.add('jade', reward.jade);
    if (reward.food)  this.add('food', reward.food);
    this._stats.dailyLoginClaimed = true;
    return Utils.deepClone(reward);
  },

  getState() {
    return {
      resources: Utils.deepClone(this._state),
      stats: Utils.deepClone(this._stats)
    };
  }
};
