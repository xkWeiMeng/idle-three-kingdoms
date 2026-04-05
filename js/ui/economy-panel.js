/**
 * 经济面板 UI — 仪表盘、图表、交易记录、预警
 */
var EconomyPanel = {
  _el: null,
  _currentChart: 'trend',
  _currentResource: 'gold',
  _currentTimeRange: '1h',
  _chartCanvas: null,

  init: function () {
    this._el = document.getElementById('panel-economy');
    if (!this._el) return;
    this._render();
    EventBus.on('economy:event_logged', () => this._debouncedUpdate());
    EventBus.on('economy:alert', () => this._updateAlerts());
    EventBus.on('tab:switched', (tabId) => {
      if (tabId === 'economy') this._render();
    });
  },

  _updateTimeout: null,
  _debouncedUpdate: function () {
    if (this._updateTimeout) return;
    this._updateTimeout = setTimeout(() => {
      this._updateTimeout = null;
      if (this._el && this._el.offsetParent !== null) {
        this._updateSummary();
        this._updateTransactionList();
      }
    }, 2000);
  },

  _render: function () {
    if (!this._el) return;

    var html = '<div class="eco-panel">';

    // 实时总览
    html += '<div class="eco-summary">';
    html += '<div class="eco-title">📊 经济仪表盘</div>';
    html += this._renderSummaryCards();
    html += '</div>';

    // 图表切换
    html += '<div class="eco-chart-tabs">';
    var charts = [
      { id: 'trend', label: '趋势图' },
      { id: 'income_expense', label: '收支图' },
      { id: 'source', label: '来源' }
    ];
    for (var i = 0; i < charts.length; i++) {
      html += '<button class="eco-chart-btn' + (this._currentChart === charts[i].id ? ' active' : '') +
        '" data-chart="' + charts[i].id + '">' + charts[i].label + '</button>';
    }
    html += '</div>';

    // Canvas 图表区域
    html += '<div class="eco-chart-container">' +
      '<canvas id="eco-chart-canvas" width="440" height="220"></canvas>' +
      '</div>';

    // 资源筛选
    html += '<div class="eco-filters">';
    var ranges = ['1h', '6h', '24h'];
    for (var ri = 0; ri < ranges.length; ri++) {
      html += '<button class="eco-range-btn' + (this._currentTimeRange === ranges[ri] ? ' active' : '') +
        '" data-range="' + ranges[ri] + '">' + ranges[ri] + '</button>';
    }
    html += '<select class="eco-resource-select" id="eco-res-select">';
    var resOptions = [
      { v: 'gold', l: '💰 金币' }, { v: 'wood', l: '🪵 木材' },
      { v: 'stone', l: '🪨 石材' }, { v: 'iron', l: '⛏️ 铁矿' }
    ];
    for (var oi = 0; oi < resOptions.length; oi++) {
      html += '<option value="' + resOptions[oi].v + '"' +
        (this._currentResource === resOptions[oi].v ? ' selected' : '') + '>' +
        resOptions[oi].l + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // 最近交易
    html += '<div class="eco-transactions">';
    html += '<div class="eco-section-title">── 最近交易 ──</div>';
    html += '<div id="eco-tx-list">' + this._renderTransactions() + '</div>';
    html += '</div>';

    // 预警
    html += '<div class="eco-alerts">';
    html += '<div class="eco-section-title">── 经济预警 ──</div>';
    html += '<div id="eco-alerts-list">' + this._renderAlerts() + '</div>';
    html += '</div>';

    // 建议
    html += this._renderSuggestions();

    html += '</div>';

    this._el.innerHTML = html;
    this._bindEvents();

    // 延迟绘制图表（等 DOM 渲染）
    setTimeout(() => this._renderChart(), 50);
  },

  _renderSummaryCards: function () {
    var resources = ['gold', 'wood', 'stone', 'iron'];
    var names = { gold: '💰', wood: '🪵', stone: '🪨', iron: '⛏️' };
    var html = '<div class="eco-summary-grid">';

    for (var i = 0; i < resources.length; i++) {
      var res = resources[i];
      var net = EconomyManager.getNetIncome(res, 5);
      var sign = net.net >= 0 ? '+' : '';
      var color = net.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)';

      html += '<div class="eco-summary-card">' +
        '<span class="eco-card-icon">' + names[res] + '</span>' +
        '<span class="eco-card-net" style="color:' + color + '">' +
        sign + Math.round(net.net) + '/分</span>' +
        '</div>';
    }
    html += '</div>';
    return html;
  },

  _renderTransactions: function () {
    var events = EconomyManager.getRecentEvents(10);
    if (events.length === 0) return '<div class="eco-empty">暂无交易记录</div>';

    var html = '';
    for (var i = events.length - 1; i >= 0; i--) {
      var e = events[i];
      var isIncome = e.amount > 0;
      var emoji = CONSTANTS.RESOURCE_EMOJI[e.resourceType] || '';
      var ago = this._timeAgo(e.timestamp);
      var sourceLabel = this._getSourceLabel(e.source);

      html += '<div class="eco-tx-row">' +
        '<span class="eco-tx-dir">' + (isIncome ? '⬆' : '⬇') + '</span>' +
        '<span class="eco-tx-amount" style="color:' +
          (isIncome ? 'var(--color-success)' : 'var(--color-danger)') + '">' +
          (isIncome ? '+' : '') + e.amount + '</span>' +
        '<span class="eco-tx-icon">' + emoji + '</span>' +
        '<span class="eco-tx-source">' + sourceLabel + '</span>' +
        '<span class="eco-tx-time">' + ago + '</span>' +
        '</div>';
    }
    return html;
  },

  _renderAlerts: function () {
    var alerts = EconomyManager.getActiveAlerts();
    if (alerts.length === 0) return '<div class="eco-empty">✅ 经济状况良好</div>';

    var html = '';
    for (var i = 0; i < Math.min(alerts.length, 5); i++) {
      var a = alerts[i];
      html += '<div class="eco-alert-item eco-alert-' + a.severity + '">' +
        '<span>' + a.message + '</span>' +
        '</div>';
    }
    return html;
  },

  _renderSuggestions: function () {
    var suggestions = EconomyManager.getSuggestions();
    if (suggestions.length === 0) return '';

    var html = '<div class="eco-suggestions">';
    html += '<div class="eco-section-title">── 💡 经济顾问 ──</div>';
    for (var i = 0; i < suggestions.length; i++) {
      var s = suggestions[i];
      html += '<div class="eco-suggestion-item">' +
        '<span>' + (s.emoji || '💡') + ' ' + s.message + '</span>' +
        '</div>';
    }
    html += '</div>';
    return html;
  },

  _renderChart: function () {
    var canvas = document.getElementById('eco-chart-canvas');
    if (!canvas) return;
    this._chartCanvas = canvas;

    var minutes = this._currentTimeRange === '1h' ? 60 :
                  this._currentTimeRange === '6h' ? 360 : 1440;
    var res = this._currentResource;

    if (this._currentChart === 'trend') {
      this._drawTrendChart(canvas, res, minutes);
    } else if (this._currentChart === 'income_expense') {
      this._drawIncomeExpenseChart(canvas, res, minutes);
    } else if (this._currentChart === 'source') {
      this._drawSourceChart(canvas, res, minutes);
    }
  },

  _drawTrendChart: function (canvas, resourceType, minutes) {
    // 从事件日志构建余额趋势
    var events = EconomyManager.getEvents({
      resourceType: resourceType,
      since: Date.now() - minutes * 60000
    });

    var dataPoints = [];
    var currentBalance = ResourceManager.get(resourceType);

    if (events.length === 0) {
      // 没有数据，画一条水平线
      for (var i = 0; i < 10; i++) {
        dataPoints.push({ x: i, y: currentBalance });
      }
    } else {
      // 反向重建余额
      var balances = [{ x: events.length, y: currentBalance }];
      for (var j = events.length - 1; j >= 0; j--) {
        currentBalance -= events[j].amount;
        balances.unshift({ x: j, y: Math.max(0, currentBalance) });
      }
      dataPoints = balances;
    }

    var color = ChartEngine.getResourceColor(resourceType);
    ChartEngine.drawLineChart(canvas, [{
      label: this._getResName(resourceType) + '余额',
      data: dataPoints,
      color: color,
      fill: true
    }], {
      title: this._getResName(resourceType) + '余额趋势（' + this._currentTimeRange + '）',
      showLegend: false
    });
  },

  _drawIncomeExpenseChart: function (canvas, resourceType, minutes) {
    var buckets = 6;
    var bucketSize = minutes / buckets;
    var now = Date.now();
    var labels = [];
    var incomeData = [];
    var expenseData = [];

    for (var i = 0; i < buckets; i++) {
      var start = now - (buckets - i) * bucketSize * 60000;
      var end = start + bucketSize * 60000;
      labels.push(Math.round((buckets - i) * bucketSize) + '分前');

      var events = EconomyManager.getEvents({
        resourceType: resourceType,
        since: start,
        until: end
      });

      var inc = 0, exp = 0;
      for (var j = 0; j < events.length; j++) {
        if (events[j].amount > 0) inc += events[j].amount;
        else exp += Math.abs(events[j].amount);
      }
      incomeData.push(inc);
      expenseData.push(exp);
    }

    ChartEngine.drawBarChart(canvas, [
      { label: '收入', data: incomeData, color: '#5d8a48' },
      { label: '支出', data: expenseData, color: '#b33a3a' }
    ], {
      labels: labels,
      title: this._getResName(resourceType) + '收支对比',
      showLegend: true
    });
  },

  _drawSourceChart: function (canvas, resourceType, minutes) {
    var since = Date.now() - minutes * 60000;
    var cats = EconomyManager.getIncomeByCategory(resourceType, since);

    var data = [];
    var colors = {
      battle: '#d4a849', production: '#5d8a48', offline: '#4a7fb5',
      daily: '#c98a2e', trade: '#8b5ea8', system: '#607d8b', sell: '#5a9e8f'
    };
    var names = {
      battle: '战斗', production: '城镇产出', offline: '离线',
      daily: '每日', trade: '交易', system: '系统', sell: '出售'
    };

    for (var cat in cats) {
      if (cats.hasOwnProperty(cat) && cats[cat] > 0) {
        data.push({
          label: names[cat] || cat,
          value: cats[cat],
          color: colors[cat] || '#999'
        });
      }
    }

    if (data.length === 0) {
      data.push({ label: '暂无数据', value: 1, color: '#333' });
    }

    ChartEngine.drawPieChart(canvas, data, {
      title: this._getResName(resourceType) + '收入来源',
      showLabels: true,
      donut: true
    });
  },

  _updateSummary: function () {
    var grid = this._el && this._el.querySelector('.eco-summary-grid');
    if (grid) {
      grid.outerHTML = this._renderSummaryCards();
    }
  },

  _updateTransactionList: function () {
    var list = document.getElementById('eco-tx-list');
    if (list) list.innerHTML = this._renderTransactions();
  },

  _updateAlerts: function () {
    var list = document.getElementById('eco-alerts-list');
    if (list) list.innerHTML = this._renderAlerts();
  },

  _bindEvents: function () {
    var self = this;

    // 图表类型切换
    this._el.querySelectorAll('.eco-chart-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self._currentChart = this.dataset.chart;
        self._render();
      });
    });

    // 时间范围
    this._el.querySelectorAll('.eco-range-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self._currentTimeRange = this.dataset.range;
        self._render();
      });
    });

    // 资源选择
    var select = document.getElementById('eco-res-select');
    if (select) {
      select.addEventListener('change', function () {
        self._currentResource = this.value;
        self._renderChart();
      });
    }
  },

  _timeAgo: function (ts) {
    var diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分前';
    if (diff < 86400) return Math.floor(diff / 3600) + '时前';
    return Math.floor(diff / 86400) + '天前';
  },

  _getSourceLabel: function (source) {
    var labels = {
      stage_reward: '关卡奖励', first_clear: '首通', boss_reward: 'Boss',
      offline_reward: '离线收益', building_upgrade: '升级建筑', speed_up: '加速',
      hero_levelup: '武将升级', recruit_single: '单抽', recruit_ten: '十连',
      enhance: '装备强化', food_cost: '出征消耗', daily_login: '每日签到',
      market_buy: '集市购入', market_sell: '集市卖出',
      lumber_camp: '伐木场', quarry: '采石场', iron_mine: '铁矿场', farmland: '农田',
      unknown: '系统'
    };
    return labels[source] || source;
  },

  _getResName: function (type) {
    var names = { gold: '金币', jade: '玉璧', exp: '经验', food: '粮草', wood: '木材', stone: '石材', iron: '铁矿' };
    return names[type] || type;
  }
};
