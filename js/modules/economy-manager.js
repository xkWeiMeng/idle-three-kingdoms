/**
 * 经济管理器 — 事件日志、聚合分析、预警系统、智能建议
 */
var EconomyManager = {
  _state: {
    events: [],
    hourlyAggregates: [],
    dailyAggregates: [],
    lifetimeStats: {
      totalIncome:  { gold: 0, jade: 0, exp: 0, food: 0, wood: 0, stone: 0, iron: 0 },
      totalExpense: { gold: 0, jade: 0, exp: 0, food: 0, wood: 0, stone: 0, iron: 0 }
    },
    alerts: [],
    lastAlertCheck: 0
  },

  _tickCounter: 0,
  _lastHourKey: '',

  init: function (saved) {
    var data = (saved && saved.economy) ? saved.economy : {};
    this._state = {
      events: data.events ? data.events.slice() : [],
      hourlyAggregates: data.hourlyAggregates ? data.hourlyAggregates.slice() : [],
      dailyAggregates: data.dailyAggregates ? data.dailyAggregates.slice() : [],
      lifetimeStats: data.lifetimeStats ? Utils.deepClone(data.lifetimeStats) : {
        totalIncome:  { gold: 0, jade: 0, exp: 0, food: 0, wood: 0, stone: 0, iron: 0 },
        totalExpense: { gold: 0, jade: 0, exp: 0, food: 0, wood: 0, stone: 0, iron: 0 }
      },
      alerts: data.alerts ? data.alerts.slice() : [],
      lastAlertCheck: data.lastAlertCheck || 0
    };
    this._tickCounter = 0;
    this._lastHourKey = this._getHourKey();
  },

  onTick: function (dt) {
    this._tickCounter++;

    // 每 60 tick 检查预警
    if (this._tickCounter % 60 === 0) {
      this.checkAlerts();
    }

    // 每小时聚合
    var hourKey = this._getHourKey();
    if (hourKey !== this._lastHourKey) {
      this._aggregateHourly();
      this._lastHourKey = hourKey;
    }
  },

  // ---------- 事件记录 ----------

  logEvent: function (resourceType, amount, category, source, detail) {
    var evt = {
      id: 'evt_' + Utils.uid(),
      timestamp: Date.now(),
      resourceType: resourceType,
      amount: amount,
      balance: ResourceManager.get(resourceType),
      category: category || 'system',
      source: source || 'unknown',
      detail: detail || ''
    };

    this._state.events.push(evt);

    // 保留最近 1000 条
    if (this._state.events.length > 1000) {
      this._state.events = this._state.events.slice(-1000);
    }

    // 更新终身统计
    if (amount > 0) {
      this._state.lifetimeStats.totalIncome[resourceType] =
        (this._state.lifetimeStats.totalIncome[resourceType] || 0) + amount;
    } else {
      this._state.lifetimeStats.totalExpense[resourceType] =
        (this._state.lifetimeStats.totalExpense[resourceType] || 0) + Math.abs(amount);
    }

    EventBus.emit('economy:event_logged', { event: evt });
  },

  // ---------- 查询 API ----------

  getEvents: function (filter) {
    var events = this._state.events;
    if (!filter) return events.slice();

    return events.filter(function (e) {
      if (filter.resourceType && e.resourceType !== filter.resourceType) return false;
      if (filter.category && e.category !== filter.category) return false;
      if (filter.since && e.timestamp < filter.since) return false;
      if (filter.until && e.timestamp > filter.until) return false;
      if (filter.incomeOnly && e.amount <= 0) return false;
      if (filter.expenseOnly && e.amount >= 0) return false;
      return true;
    });
  },

  getRecentEvents: function (count) {
    return this._state.events.slice(-(count || 20));
  },

  getNetIncome: function (resourceType, minutes) {
    var since = Date.now() - (minutes || 10) * 60000;
    var events = this.getEvents({ resourceType: resourceType, since: since });

    var income = 0, expense = 0;
    for (var i = 0; i < events.length; i++) {
      if (events[i].amount > 0) income += events[i].amount;
      else expense += Math.abs(events[i].amount);
    }

    var period = (minutes || 10);
    return {
      income: income / period,
      expense: expense / period,
      net: (income - expense) / period
    };
  },

  getIncomeByCategory: function (resourceType, sinceMs) {
    var events = this.getEvents({
      resourceType: resourceType,
      since: sinceMs || (Date.now() - 3600000),
      incomeOnly: true
    });

    var cats = {};
    for (var i = 0; i < events.length; i++) {
      var cat = events[i].category;
      cats[cat] = (cats[cat] || 0) + events[i].amount;
    }
    return cats;
  },

  getExpenseByCategory: function (resourceType, sinceMs) {
    var events = this.getEvents({
      resourceType: resourceType,
      since: sinceMs || (Date.now() - 3600000),
      expenseOnly: true
    });

    var cats = {};
    for (var i = 0; i < events.length; i++) {
      var cat = events[i].category;
      cats[cat] = (cats[cat] || 0) + Math.abs(events[i].amount);
    }
    return cats;
  },

  getHourlyData: function (resourceType, hours) {
    var agg = this._state.hourlyAggregates;
    var cutoff = hours || 24;
    var result = agg.filter(function (a) {
      return !resourceType || a.resources[resourceType];
    }).slice(-cutoff);
    return result;
  },

  getLifetimeStats: function () {
    return Utils.deepClone(this._state.lifetimeStats);
  },

  // ---------- 预警系统 ----------

  checkAlerts: function () {
    var now = Date.now();
    // 10 分钟内不重复
    if (now - this._state.lastAlertCheck < 60000) return;
    this._state.lastAlertCheck = now;

    var newAlerts = [];
    var resources = ['gold', 'wood', 'stone', 'iron'];

    for (var i = 0; i < resources.length; i++) {
      var res = resources[i];
      var current = ResourceManager.get(res);
      var cap = ResourceManager.getCap(res);
      var net = this.getNetIncome(res, 5);

      // 资源即将耗尽（优先，抑制 negative_income）
      if (net.net < 0 && current > 0) {
        var minsLeft = current / Math.abs(net.net);
        if (minsLeft < 30) {
          newAlerts.push({
            id: 'alert_' + Utils.uid(),
            type: 'resource_depleting',
            severity: 'warning',
            resourceType: res,
            message: (CONSTANTS.RESOURCE_EMOJI[res] || '') + ' ' +
              this._getResourceName(res) + '将在约 ' + Math.ceil(minsLeft) + ' 分钟后耗尽',
            timestamp: now,
            dismissed: false
          });
          continue; // depleting 已处理，跳过 negative_income
        }
      }

      // 入不敷出（仅在未触发 depleting 时）
      if (net.net < 0) {
        newAlerts.push({
          id: 'alert_' + Utils.uid(),
          type: 'negative_income',
          severity: 'info',
          resourceType: res,
          message: (CONSTANTS.RESOURCE_EMOJI[res] || '') + ' ' +
            this._getResourceName(res) + '入不敷出 (' + Math.round(net.net) + '/分钟)',
          timestamp: now,
          dismissed: false
        });
      }

      // 仓库即满
      if (cap !== Infinity && current > cap * 0.9) {
        newAlerts.push({
          id: 'alert_' + Utils.uid(),
          type: 'near_cap',
          severity: 'info',
          resourceType: res,
          message: '📦 ' + this._getResourceName(res) + '即将满仓，请及时消耗',
          timestamp: now,
          dismissed: false
        });
      }
    }

    // 去重：同类型+同资源 10 分钟内不重复
    var filtered = [];
    for (var j = 0; j < newAlerts.length; j++) {
      var a = newAlerts[j];
      var duplicate = false;
      for (var k = 0; k < this._state.alerts.length; k++) {
        var existing = this._state.alerts[k];
        if (existing.type === a.type && existing.resourceType === a.resourceType &&
            now - existing.timestamp < 600000) {
          duplicate = true;
          break;
        }
      }
      if (!duplicate) {
        filtered.push(a);
        EventBus.emit('economy:alert', { alert: a });
      }
    }

    this._state.alerts = this._state.alerts.concat(filtered);
    // 保留最近 50 条
    if (this._state.alerts.length > 50) {
      this._state.alerts = this._state.alerts.slice(-50);
    }
  },

  getActiveAlerts: function () {
    return this._state.alerts.filter(function (a) { return !a.dismissed; })
      .sort(function (a, b) { return a.timestamp - b.timestamp; });
  },

  dismissAlert: function (alertId) {
    for (var i = 0; i < this._state.alerts.length; i++) {
      if (this._state.alerts[i].id === alertId) {
        this._state.alerts[i].dismissed = true;
        return;
      }
    }
  },

  // ---------- 智能建议 ----------

  getSuggestions: function () {
    var suggestions = [];

    // 1. 建筑 ROI 排序
    if (typeof TownManager !== 'undefined') {
      var bestROI = this._getBestBuildingROI();
      if (bestROI) {
        suggestions.push({
          type: 'building_priority',
          emoji: '📌',
          message: '最值得升级: ' + bestROI.name + '（约' + bestROI.paybackMin + '分钟回本）'
        });
      }
    }

    // 2. 区域建议
    if (typeof AdventureManager !== 'undefined') {
      var recommended = AdventureManager.getRecommendedRegion();
      var current = AdventureManager.getCurrentRegion();
      if (recommended && recommended !== current) {
        var rd = AdventureManager.getRegionData(recommended);
        if (rd) {
          suggestions.push({
            type: 'region_switch',
            emoji: '🗺',
            message: '切换到「' + rd.name + '」可优化资源产出'
          });
        }
      }
    }

    return suggestions;
  },

  _getBestBuildingROI: function () {
    if (typeof TownManager === 'undefined') return null;
    var bestPayback = Infinity;
    var bestBuilding = null;

    for (var id in BuildingData) {
      if (!BuildingData.hasOwnProperty(id) || id.startsWith('_')) continue;
      var data = BuildingData[id];
      if (!data.production) continue;

      var lv = TownManager.getBuildingLevel(id);
      if (lv <= 0 || lv >= data.maxLevel) continue;

      var cost = TownManager.getUpgradeCost(id);
      if (!cost) continue;

      var currentProd = data.production(lv);
      var nextProd = data.production(lv + 1);
      var increment = nextProd.perMinute - currentProd.perMinute;

      // 简单折算为金币
      var totalCost = (cost.gold || 0) + (cost.wood || 0) * 10 +
                      (cost.stone || 0) * 12 + (cost.iron || 0) * 18;
      var incrementGold = increment * (currentProd.resource === 'wood' ? 10 :
                           currentProd.resource === 'stone' ? 12 : 18);

      var payback = incrementGold > 0 ? totalCost / incrementGold : Infinity;

      if (payback < bestPayback) {
        bestPayback = payback;
        bestBuilding = { name: data.emoji + data.name, paybackMin: Math.round(payback) };
      }
    }
    return bestBuilding;
  },

  // ---------- 聚合 ----------

  _aggregateHourly: function () {
    var hourKey = this._getHourKey();
    var since = Date.now() - 3600000;
    var events = this.getEvents({ since: since });

    var agg = { hour: hourKey, resources: {} };
    var types = ['gold', 'jade', 'exp', 'food', 'wood', 'stone', 'iron'];
    for (var i = 0; i < types.length; i++) {
      var r = types[i];
      var inc = 0, exp = 0;
      for (var j = 0; j < events.length; j++) {
        if (events[j].resourceType === r) {
          if (events[j].amount > 0) inc += events[j].amount;
          else exp += Math.abs(events[j].amount);
        }
      }
      if (inc > 0 || exp > 0) {
        agg.resources[r] = { income: inc, expense: exp, net: inc - exp };
      }
    }

    this._state.hourlyAggregates.push(agg);
    // 保留 7 天 (168h)
    if (this._state.hourlyAggregates.length > 168) {
      this._state.hourlyAggregates = this._state.hourlyAggregates.slice(-168);
    }

    EventBus.emit('economy:hourly_update', { data: agg });
  },

  _getHourKey: function () {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0') + 'T' +
           String(d.getHours()).padStart(2, '0');
  },

  _getResourceName: function (type) {
    var names = {
      gold: '金币', jade: '玉璧', exp: '经验', food: '粮草',
      wood: '木材', stone: '石材', iron: '铁矿'
    };
    return names[type] || type;
  },

  getState: function () {
    return Utils.deepClone(this._state);
  }
};
