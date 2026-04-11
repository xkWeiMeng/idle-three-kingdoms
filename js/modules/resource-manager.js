/**
 * 资源管理器 — 管理 7 种资源，资源上限，统计数据，每日签到
 */
const ResourceManager = {
  _state: { gold: 0, jade: 0, exp: 0, food: 100, wood: 0, stone: 0, iron: 0 },
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

  _defaultResources: { gold: 500, jade: 0, exp: 0, food: 100, wood: 0, stone: 0, iron: 0 },

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
    var defaultStats = {
      totalGoldEarned: 0, totalBattles: 0, totalPlayTime: 0,
      highestStage: '', loginDays: 0, lastLoginDate: '', dailyLoginClaimed: false
    };

    if (saved && saved.resources) {
      var resSave = saved.resources;
      if (resSave.resources) {
        this._state = resSave.resources;
        this._stats = resSave.stats || Utils.deepClone(defaultStats);
      } else if (typeof resSave.gold === 'number') {
        this._state = resSave;
        this._stats = saved.stats || Utils.deepClone(defaultStats);
      }
    } else if (saved && typeof saved.gold === 'number') {
      this._state = saved;
      this._stats = Utils.deepClone(defaultStats);
    } else {
      this._state = Utils.deepClone(this._defaultResources);
      this._stats = Utils.deepClone(defaultStats);
    }

    // 确保新资源字段存在（旧存档兼容）
    if (this._state.wood === undefined) this._state.wood = 0;
    if (this._state.stone === undefined) this._state.stone = 0;
    if (this._state.iron === undefined) this._state.iron = 0;

    this._foodTimer = 0;
    this.checkDailyLogin();
  },

  onTick(dt) {
    // 粮草恢复：默认每30秒+1（农田会覆盖此逻辑）
    var foodCap = this.getCap('food');
    this._foodTimer += dt;
    while (this._foodTimer >= 30) {
      this._foodTimer -= 30;
      if (this._state.food < foodCap) {
        this._state.food = Math.min(this._state.food + 1, foodCap);
        EventBus.emit('resource:changed', 'food', this._state.food);
      }
    }
    this._stats.totalPlayTime += dt;
  },

  get(type) {
    return this._state[type] || 0;
  },

  /**
   * 获取资源上限（jade/exp 无上限返回 Infinity）
   */
  getCap(type) {
    var baseCap = CONSTANTS.RESOURCE_BASE_CAP[type];
    if (baseCap === undefined) return Infinity;
    // 仓库加成由 TownManager 提供
    if (typeof TownManager !== 'undefined' && TownManager.getResourceCap) {
      return TownManager.getResourceCap(type);
    }
    return baseCap;
  },

  /**
   * 增加资源
   * @param {string} type 资源类型
   * @param {number} amount 增加数量
   * @param {string} [category] 来源大类 (battle/production/offline/daily/sell/trade/system)
   * @param {string} [source] 具体来源
   * @param {string} [detail] 附加信息
   */
  add(type, amount, category, source, detail) {
    if (amount <= 0) return;
    // 应用资源上限（jade/exp 不受限）
    var cap = this.getCap(type);
    if (cap !== Infinity) {
      var current = this._state[type] || 0;
      amount = Math.min(amount, Math.max(0, cap - current));
      if (amount <= 0) return;
    }
    this._state[type] = (this._state[type] || 0) + amount;
    if (type === 'gold') {
      this._stats.totalGoldEarned += amount;
    }
    // 经济事件记录
    if (typeof EconomyManager !== 'undefined' && EconomyManager.logEvent) {
      EconomyManager.logEvent(type, amount, category || 'system', source || 'unknown', detail || '');
    }
    EventBus.emit('resource:changed', type, this._state[type]);
  },

  /**
   * 消耗资源
   * @param {string} type 资源类型
   * @param {number} amount 消耗数量
   * @param {string} [category] 去向大类
   * @param {string} [source] 具体去向
   * @param {string} [detail] 附加信息
   */
  spend(type, amount, category, source, detail) {
    if (!this.canAfford(type, amount)) return false;
    this._state[type] -= amount;
    if (typeof EconomyManager !== 'undefined' && EconomyManager.logEvent) {
      EconomyManager.logEvent(type, -amount, category || 'system', source || 'unknown', detail || '');
    }
    EventBus.emit('resource:changed', type, this._state[type]);
    return true;
  },

  /**
   * 批量消耗资源（原子操作，全部满足才扣除）
   * @param {Object} costs 例如 { gold: 500, wood: 100 }
   * @param {string} [category]
   * @param {string} [source]
   * @param {string} [detail]
   */
  spendMultiple(costs, category, source, detail) {
    // 先检查是否全部能支付
    for (var type in costs) {
      if (costs.hasOwnProperty(type) && costs[type] > 0) {
        if (!this.canAfford(type, costs[type])) return false;
      }
    }
    // 全部扣除
    for (var t in costs) {
      if (costs.hasOwnProperty(t) && costs[t] > 0) {
        this.spend(t, costs[t], category, source, detail);
      }
    }
    return true;
  },

  /**
   * 批量增加资源
   * @param {Object} amounts 例如 { gold: 500, wood: 100 }
   * @param {string} [category]
   * @param {string} [source]
   * @param {string} [detail]
   */
  addMultiple(amounts, category, source, detail) {
    for (var type in amounts) {
      if (amounts.hasOwnProperty(type) && amounts[type] > 0) {
        this.add(type, amounts[type], category, source, detail);
      }
    }
  },

  canAfford(type, amount) {
    return (this._state[type] || 0) >= amount;
  },

  canAffordMultiple(costs) {
    for (var type in costs) {
      if (costs.hasOwnProperty(type) && costs[type] > 0) {
        if (!this.canAfford(type, costs[type])) return false;
      }
    }
    return true;
  },

  getAll() {
    return {
      gold: this._state.gold, jade: this._state.jade,
      exp: this._state.exp, food: this._state.food,
      wood: this._state.wood, stone: this._state.stone, iron: this._state.iron
    };
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
    if (reward.gold)  this.add('gold', reward.gold, 'daily', 'daily_login');
    if (reward.jade)  this.add('jade', reward.jade, 'daily', 'daily_login');
    if (reward.food)  this.add('food', reward.food, 'daily', 'daily_login');
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
