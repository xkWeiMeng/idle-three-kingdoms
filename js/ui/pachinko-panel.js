/**
 * 弹珠（柏青哥）面板
 *
 * 通过 OverlayPanel 展示弹珠机 Canvas + 发射按钮 + 统计信息
 * 支持连续发射多颗弹珠
 */
var PachinkoPanel = {

  _canvasInitialized: false,

  init: function () {
    var self = this;
    EventBus.on('pachinko:landed', function () {
      self._updateStats();
      self._updateHistory();
    });
    EventBus.on('resource:changed', function (type) {
      if (type === 'jade') self._updateJadeDisplay();
    });
  },

  /** 打开弹珠面板 */
  open: function () {
    var self = this;
    var stats = PachinkoManager.getStats();

    var html = '<div class="pachinko-panel">';

    // 顶栏：玉璧余额
    html += '<div class="pachinko-topbar">';
    html += '  <span class="pachinko-jade" id="pachinko-jade">' + CONSTANTS.RESOURCE_EMOJI.jade + ' ' + Utils.formatNumber(ResourceManager.get('jade')) + '</span>';
    html += '  <span class="pachinko-cost">每球 ' + PachinkoData.COST_PER_BALL + ' 玉璧</span>';
    html += '</div>';

    // Canvas 容器
    html += '<div class="pachinko-canvas-wrap">';
    html += '  <canvas id="pachinko-canvas"></canvas>';
    html += '</div>';

    // 发射按钮
    html += '<div class="pachinko-actions">';
    html += '  <button class="btn pachinko-launch-btn" id="pachinko-launch-btn">🎱 发射弹珠</button>';
    html += '</div>';

    // 结果显示（滚动列表，显示最近几条）
    html += '<div class="pachinko-result" id="pachinko-result"></div>';

    // 统计
    html += '<div class="pachinko-stats" id="pachinko-stats">';
    html += self._renderStats(stats);
    html += '</div>';

    // 历史记录
    html += '<details class="pachinko-history-toggle">';
    html += '  <summary>📜 历史记录（最近20局）</summary>';
    html += '  <div class="pachinko-history" id="pachinko-history">' + self._renderHistory() + '</div>';
    html += '</details>';

    html += '</div>';

    OverlayPanel.show({
      title: '🎱 弹珠',
      content: html,
      panelId: 'pachinko',
      height: 'full',
      onClose: function () {
        PachinkoCanvas.destroy();
        self._canvasInitialized = false;
      }
    });

    // 延迟初始化 Canvas
    setTimeout(function () {
      var canvasEl = document.getElementById('pachinko-canvas');
      if (!canvasEl) return;

      PachinkoCanvas.init(canvasEl, function (slotIndex) {
        self._onSettle(slotIndex);
      });
      self._canvasInitialized = true;

      var launchBtn = document.getElementById('pachinko-launch-btn');
      if (launchBtn) {
        launchBtn.addEventListener('click', function () {
          self._handleLaunch();
        });
      }
    }, 100);
  },

  /** 处理发射（无需禁用按钮，允许连发） */
  _handleLaunch: function () {
    if (!this._canvasInitialized) return;

    var ok = PachinkoManager.launch();
    if (!ok) return;

    PachinkoCanvas.launch();
  },

  /** 弹珠落槽回调（每颗球独立结算） */
  _onSettle: function (slotIndex) {
    var result = PachinkoManager.settle(slotIndex);
    if (!result) return;

    this._appendResult(result);

    // 超级大奖庆祝
    if (result.slotType === 'jackpot' && typeof CelebrationOverlay !== 'undefined') {
      CelebrationOverlay._enqueue(function () {
        var eqText = result.equipment ? ' + ' + result.equipment.name : '';
        var html = '<div class="celebration-content">';
        html += '<div class="celebration-particles">';
        for (var i = 0; i < 20; i++) {
          html += '<span class="particle" style="--i:' + i + '"></span>';
        }
        html += '</div>';
        html += '<div class="celebration-icon">🎰</div>';
        html += '<div class="celebration-title">超级大奖！</div>';
        html += '<div class="celebration-subtitle">+' + result.jade + ' 玉璧' + eqText + '</div>';
        html += '<div class="celebration-hint">点击任意处继续</div>';
        html += '</div>';
        CelebrationOverlay._overlay.innerHTML = html;
      });
    }
  },

  /** 追加单次结果（保留最近 3 条） */
  _appendResult: function (result) {
    var resultEl = document.getElementById('pachinko-result');
    if (!resultEl) return;

    var slot = PachinkoData.SLOTS[result.slotIndex];
    var line = '';

    if (result.slotType === 'miss') {
      line = '<div class="pachinko-result-text" style="color:#666;">未中奖</div>';
    } else {
      line = '<div class="pachinko-result-text" style="color:' + slot.color + ';">';
      line += '🎊 ' + slot.label + '！';
      if (result.jade > 0) {
        line += ' +' + result.jade + ' 玉璧';
      }
      if (result.equipment) {
        var eqColor = window.QualityColors[result.equipment.quality] || '#fff';
        line += ' <span style="color:' + eqColor + ';">+' + result.equipment.name + '</span>';
      }
      line += '</div>';
    }

    // 追加到前面，保留最近 3 条
    resultEl.insertAdjacentHTML('afterbegin', line);
    while (resultEl.children.length > 3) {
      resultEl.removeChild(resultEl.lastChild);
    }
  },

  _renderStats: function (stats) {
    var profit = stats.netProfit;
    var profitColor = profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
    var profitSign = profit >= 0 ? '+' : '';

    return '<div class="pachinko-stats-grid">' +
      '<div class="pachinko-stat"><span class="pachinko-stat-label">总局数</span><span class="pachinko-stat-value">' + stats.totalPlays + '</span></div>' +
      '<div class="pachinko-stat"><span class="pachinko-stat-label">总花费</span><span class="pachinko-stat-value">' + Utils.formatNumber(stats.totalSpent) + '</span></div>' +
      '<div class="pachinko-stat"><span class="pachinko-stat-label">总赢取</span><span class="pachinko-stat-value">' + Utils.formatNumber(stats.totalWon) + '</span></div>' +
      '<div class="pachinko-stat"><span class="pachinko-stat-label">净盈亏</span><span class="pachinko-stat-value" style="color:' + profitColor + ';">' + profitSign + Utils.formatNumber(profit) + '</span></div>' +
      '<div class="pachinko-stat"><span class="pachinko-stat-label">大奖</span><span class="pachinko-stat-value" style="color:var(--color-gold);">' + stats.jackpotCount + '</span></div>' +
      '<div class="pachinko-stat"><span class="pachinko-stat-label">回报率</span><span class="pachinko-stat-value">' + stats.returnRate + '%</span></div>' +
    '</div>';
  },

  _renderHistory: function () {
    var state = PachinkoManager.getState();
    var history = state.history;
    if (history.length === 0) return '<div style="color:var(--color-text-dim);text-align:center;padding:8px;">暂无记录</div>';

    var prizeLabels = { miss: '未中奖', small: '小奖', medium: '中奖', big: '大奖', jackpot: '超级大奖' };
    var prizeColors = { miss: '#666', small: '#5d8a48', medium: '#4a7fb5', big: '#8b5ea8', jackpot: '#d4a849' };

    var html = '';
    for (var i = 0; i < history.length; i++) {
      var h = history[i];
      var label = prizeLabels[h.prize] || h.prize;
      var color = prizeColors[h.prize] || '#999';

      html += '<div class="pachinko-history-item">';
      html += '<span style="color:' + color + ';">' + label + '</span>';
      if (h.jade > 0) html += ' <span style="color:var(--color-gold);">+' + h.jade + '💎</span>';
      if (h.equip) html += ' <span style="color:#8b5ea8;">+' + h.equip + '</span>';
      html += '</div>';
    }
    return html;
  },

  _updateStats: function () {
    var el = document.getElementById('pachinko-stats');
    if (el) el.innerHTML = this._renderStats(PachinkoManager.getStats());
  },

  _updateHistory: function () {
    var el = document.getElementById('pachinko-history');
    if (el) el.innerHTML = this._renderHistory();
  },

  _updateJadeDisplay: function () {
    var el = document.getElementById('pachinko-jade');
    if (el) el.innerHTML = CONSTANTS.RESOURCE_EMOJI.jade + ' ' + Utils.formatNumber(ResourceManager.get('jade'));
  }
};
