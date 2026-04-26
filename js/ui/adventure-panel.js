/**
 * 冒险面板 UI — 地图选择 + 战斗实况 + 挂机统计
 */
var AdventurePanel = {
  _el: null,
  _subTab: 'map',  // 'map' | 'battle' | 'stats'

  init: function () {
    this._el = document.getElementById('panel-adventure');
    if (!this._el) return;
    this._render();
    EventBus.on('adventure:region_changed', () => this._render());
    EventBus.on('adventure:mode_changed', () => this._render());
    EventBus.on('adventure:session_update', () => this._updateStats());
    EventBus.on('battle:ended', () => this._render());
    EventBus.on('tab:switched', (tabId) => {
      if (tabId === 'adventure') this._render();
    });
  },

  _render: function () {
    if (!this._el) return;

    var mode = AdventureManager.getMode();
    var currentRegion = AdventureManager.getCurrentRegion();
    var regionData = AdventureManager.getRegionData(currentRegion);

    var html = '<div class="adv-header">' +
      '<div class="adv-title">🗺 冒险</div>' +
      '<div class="adv-sub-tabs">' +
        '<button class="adv-sub-btn' + (this._subTab === 'map' ? ' active' : '') + '" data-sub="map">地图选择</button>' +
        '<button class="adv-sub-btn' + (this._subTab === 'battle' ? ' active' : '') + '" data-sub="battle">战斗实况</button>' +
        '<button class="adv-sub-btn' + (this._subTab === 'stats' ? ' active' : '') + '" data-sub="stats">统计</button>' +
      '</div>' +
    '</div>';

    if (this._subTab === 'map') {
      html += this._renderMap(currentRegion, regionData);
    } else if (this._subTab === 'battle') {
      html += this._renderBattleView(regionData);
    } else {
      html += this._renderStats();
    }

    this._el.innerHTML = html;
    this._bindEvents();
  },

  // ---------- 地图选择 ----------

  _renderMap: function (currentRegion, regionData) {
    var unlocked = AdventureManager.getUnlockedRegions();
    var recommended = AdventureManager.getRecommendedRegion();
    var mode = AdventureManager.getMode();

    var html = '<div class="adv-map">';

    // 区域选择条
    html += '<div class="adv-region-bar">';
    for (var i = 0; i < RegionData.length; i++) {
      var r = RegionData[i];
      var isUnlocked = unlocked.indexOf(r.id) !== -1;
      var isCurrent = r.id === currentRegion;
      var isRecommended = r.id === recommended;

      html += '<button class="adv-region-btn' +
        (isCurrent ? ' active' : '') +
        (!isUnlocked ? ' locked' : '') + '" ' +
        'data-region="' + r.id + '"' + (!isUnlocked ? ' disabled' : '') + '>' +
        (isUnlocked ? r.emoji : UIIcons.icon('lock')) +
        '<span class="adv-region-label">' + (isUnlocked ? r.name : '???') + '</span>' +
        (isRecommended && isUnlocked ? '<span class="adv-recommended">★</span>' : '') +
        '</button>';
    }
    html += '</div>';

    // 当前区域详情
    if (regionData) {
      html += '<div class="adv-region-detail">';
      html += '<div class="adv-region-name">' + regionData.emoji + ' ' + regionData.name + '</div>';
      html += '<div class="adv-region-desc">' + regionData.description + '</div>';

      // 资源倍率
      html += '<div class="adv-multipliers">';
      var mults = regionData.resourceMultipliers;
      var labels = { gold: UIIcons.iconText('gold', '金币'), exp: UIIcons.iconText('exp', '经验'), wood: UIIcons.iconText('wood', '木材'), stone: UIIcons.iconText('stone', '石材'), iron: UIIcons.iconText('iron', '铁矿') };
      for (var res in mults) {
        if (!mults.hasOwnProperty(res)) continue;
        var val = mults[res];
        var cls = val > 1 ? 'mult-high' : (val < 1 ? 'mult-low' : 'mult-normal');
        html += '<span class="adv-mult ' + cls + '">' + labels[res] + ' ×' + val.toFixed(1) + '</span>';
      }
      html += '<div class="adv-mult-legend">' +
        '<span class="mult-high">▲ 加成</span>' +
        '<span class="mult-normal">— 正常</span>' +
        '<span class="mult-low">▼ 减少</span>' +
        '</div>';
      html += '</div>';

      // 地图节点
      html += this._renderMapNodes(regionData);

      html += '</div>';
    }

    // 模式切换
    html += '<div class="adv-mode-switch">';
    html += '<button class="btn' + (mode === 'push' ? '' : ' btn-outline') + ' adv-mode-btn" data-mode="push">⚔ 推图模式</button>';
    html += '<button class="btn' + (mode === 'idle' ? ' btn-gold' : ' btn-outline') + ' adv-mode-btn" data-mode="idle">🔄 挂机模式</button>';
    html += '</div>';

    if (recommended && recommended !== currentRegion) {
      var recData = AdventureManager.getRegionData(recommended);
      if (recData) {
        html += '<div class="adv-recommendation">💡 推荐挂机: ' + recData.emoji + ' ' + recData.name + '</div>';
      }
    }

    html += '</div>';
    return html;
  },

  _renderMapNodes: function (regionData) {
    if (!regionData) return '';
    var chapter = regionData.chapter;
    var cleared = typeof BattleManager !== 'undefined' ? BattleManager.getClearedStages() : [];

    var html = '<div class="adv-map-nodes">';
    for (var s = 1; s <= 10; s++) {
      var stageId = 'stage_' + chapter + '_' + s;
      var isCleared = cleared.indexOf(stageId) !== -1;
      var isBoss = s === 10;
      var prevCleared = s === 1 || cleared.indexOf('stage_' + chapter + '_' + (s - 1)) !== -1;
      var isCurrent = !isCleared && prevCleared;

      var nodeClass = 'adv-node';
      if (isCleared) nodeClass += ' cleared';
      else if (isCurrent) nodeClass += ' current';
      else nodeClass += ' locked';
      if (isBoss) nodeClass += ' boss';

      html += '<div class="' + nodeClass + '">';
      html += '<span class="adv-node-id">' + chapter + '-' + s + '</span>';
      if (isBoss) html += '<span class="adv-node-icon">★</span>';
      else if (isCleared) html += '<span class="adv-node-icon">●</span>';
      else if (isCurrent) html += '<span class="adv-node-icon">◉</span>';
      else html += '<span class="adv-node-icon">○</span>';
      html += '</div>';

      if (s < 10) html += '<span class="adv-node-connector">→</span>';
    }
    html += '</div>';
    return html;
  },

  // ---------- 战斗实况 ----------

  _renderBattleView: function (regionData) {
    var mode = AdventureManager.getMode();
    var html = '<div class="adv-battle-view">';

    if (mode === 'idle') {
      var session = AdventureManager.getIdleSession();
      if (session) {
        var rd = AdventureManager.getRegionData(session.region);
        var duration = Math.floor((Date.now() - session.startTime) / 1000);

        html += '<div class="adv-battle-header">' +
          (rd ? rd.emoji + ' ' + rd.name : '挂机中') +
          ' · 已运行 ' + this._formatDuration(duration) +
          '</div>';

        // 简化战斗场景
        html += '<div class="adv-battle-scene">';
        html += '<div class="adv-auto-indicator">⚔ 自动战斗中...</div>';
        html += '<div class="adv-battle-stats">' +
          UIIcons.icon('battle') + ' 战斗: ' + session.battles + ' 场' +
          ' · ' + UIIcons.icon('achievement') + ' 胜率: ' + (session.battles > 0 ? Math.round(session.wins / session.battles * 100) : 0) + '%' +
          '</div>';
        html += '</div>';

        // 实时收益
        html += '<div class="adv-session-rewards">';
        html += '<div class="adv-section-title">📦 本次挂机收益</div>';
        var res = session.resources;
        html += '<div class="adv-reward-grid">';
        if (res.gold) html += '<span>💰 +' + Utils.formatNumber(res.gold) + '</span>';
        if (res.exp) html += '<span>⭐ +' + Utils.formatNumber(res.exp) + '</span>';
        if (res.wood) html += '<span>🪵 +' + Utils.formatNumber(res.wood) + '</span>';
        if (res.stone) html += '<span>🪨 +' + Utils.formatNumber(res.stone) + '</span>';
        if (res.iron) html += '<span>⛏️ +' + Utils.formatNumber(res.iron) + '</span>';
        if (session.drops.length > 0) html += '<span>🎁 装备 ×' + session.drops.length + '</span>';
        html += '</div>';
        html += '</div>';

        html += '<div class="adv-battle-controls">' +
          '<button class="btn btn-outline adv-stop-idle">⏸ 停止挂机</button>' +
          '</div>';
      } else {
        html += '<div class="adv-empty">点击「挂机模式」开始自动冒险</div>';
      }
    } else {
      // 推图模式 - 显示提示
      html += '<div class="adv-push-info">';
      html += '<p>当前为推图模式</p>';
      html += '<p style="color:var(--color-text-dim)">使用「战斗」页签进行关卡挑战</p>';
      html += '<p style="color:var(--color-text-dim)">或切换到「挂机模式」自动刷已通关关卡</p>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  // ---------- 统计面板 ----------

  _renderStats: function () {
    var session = AdventureManager.getIdleSession();
    var history = AdventureManager._state.sessionHistory;

    var html = '<div class="adv-stats">';
    html += '<div class="adv-section-title">📊 挂机统计</div>';

    if (session) {
      var duration = Math.floor((Date.now() - session.startTime) / 1000);
      var res = session.resources;

      html += '<div class="adv-stats-current">';
      html += '<div class="adv-stat-row">⏱ 挂机时长: ' + this._formatDuration(duration) + '</div>';
      html += '<div class="adv-stat-row">⚔ 战斗场次: ' + session.battles + '</div>';
      html += '<div class="adv-stat-row">🏆 胜率: ' + (session.battles > 0 ? Math.round(session.wins / session.battles * 100) : 0) + '%</div>';

      // 每分钟效率
      var mins = Math.max(1, duration / 60);
      html += '<div class="adv-stats-efficiency">';
      html += '<div class="adv-section-title">── 效率 ──</div>';
      if (res.gold) html += '<div class="adv-stat-row">💰 金币 +' + Utils.formatNumber(res.gold) + ' (' + Math.round(res.gold / mins) + '/分)</div>';
      if (res.wood) html += '<div class="adv-stat-row">🪵 木材 +' + Utils.formatNumber(res.wood) + ' (' + Math.round(res.wood / mins) + '/分)</div>';
      if (res.stone) html += '<div class="adv-stat-row">🪨 石材 +' + Utils.formatNumber(res.stone) + ' (' + Math.round(res.stone / mins) + '/分)</div>';
      if (res.iron) html += '<div class="adv-stat-row">⛏️ 铁矿 +' + Utils.formatNumber(res.iron) + ' (' + Math.round(res.iron / mins) + '/分)</div>';
      if (res.exp) html += '<div class="adv-stat-row">⭐ 经验 +' + Utils.formatNumber(res.exp) + ' (' + Math.round(res.exp / mins) + '/分)</div>';
      html += '</div>';

      if (session.drops.length > 0) {
        html += '<div class="adv-stat-row">🎁 装备掉落: ' + session.drops.length + ' 件</div>';
      }
      html += '</div>';
    }

    // 历史记录
    if (history.length > 0) {
      html += '<div class="adv-section-title">── 历史记录 ──</div>';
      for (var i = history.length - 1; i >= Math.max(0, history.length - 5); i--) {
        var h = history[i];
        var rd = AdventureManager.getRegionData(h.region);
        var dur = h.endTime ? Math.floor((h.endTime - h.startTime) / 1000) : 0;
        html += '<div class="adv-history-item">';
        html += '<span>' + (rd ? rd.emoji : '?') + ' ' + this._formatDuration(dur) + '</span>';
        html += '<span>⚔' + h.battles + ' 💰' + Utils.formatNumber(h.resources.gold || 0) + '</span>';
        html += '</div>';
      }
    }

    html += '</div>';
    return html;
  },

  _formatDuration: function (totalSec) {
    if (totalSec < 60) return totalSec + '秒';
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    if (m < 60) return m + '分' + s + '秒';
    var h = Math.floor(m / 60);
    return h + '时' + (m % 60) + '分';
  },

  _updateStats: function () {
    if (this._subTab === 'stats' || this._subTab === 'battle') {
      this._render();
    }
  },

  _bindEvents: function () {
    var self = this;

    // 子标签切换
    this._el.querySelectorAll('.adv-sub-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self._subTab = this.dataset.sub;
        self._render();
      });
    });

    // 区域选择
    this._el.querySelectorAll('.adv-region-btn:not([disabled])').forEach(function (btn) {
      btn.addEventListener('click', function () {
        AdventureManager.selectRegion(this.dataset.region);
      });
    });

    // 模式切换
    this._el.querySelectorAll('.adv-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        AdventureManager.setMode(this.dataset.mode);
      });
    });

    // 停止挂机
    var stopBtn = this._el.querySelector('.adv-stop-idle');
    if (stopBtn) {
      stopBtn.addEventListener('click', function () {
        AdventureManager.setMode('push');
      });
    }
  }
};
