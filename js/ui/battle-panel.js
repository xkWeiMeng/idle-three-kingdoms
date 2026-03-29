/** 战斗面板 UI — 带 SVG 动画场景 */
const BattlePanel = {
  _container: null,
  _logEntries: [],
  _resultOverlay: null,

  init: function () {
    this._container = document.getElementById('panel-battle');
    this._logEntries = [];
    this._render();

    var self = this;
    EventBus.on('battle:started', function () {
      self._logEntries = [];
      self._resultOverlay = null;
      self._render();
      self._initBattleScene();
    });
    EventBus.on('battle:tick', function () { self._onBattleTick(); });
    EventBus.on('battle:ended', function (data) { self._onBattleEnd(data); });
    EventBus.on('battle:log', function (entry) { self._addLogEntry(entry); });
    EventBus.on('resource:changed', function () { self._updateControls(); });
    EventBus.on('hero:team_changed', function () { self._render(); });
  },

  _initBattleScene: function () {
    var sceneEl = this._container ? this._container.querySelector('#battle-scene') : null;
    if (!sceneEl) return;
    var bs = BattleManager.getBattleState();
    if (!bs) return;
    BattleAnimations.createScene(sceneEl);
    BattleAnimations.renderBattle(bs);
  },

  _render: function () {
    if (!this._container) return;

    var stage = BattleManager.getCurrentStage();
    var bs = BattleManager.getBattleState();
    var isAuto = BattleManager.isAutoFight();
    var isFighting = BattleManager.isFighting();
    var cleared = BattleManager.getClearedStages();

    var html = '';

    // --- 关卡信息条 ---
    html += '<div class="battle-stage-bar">';
    html += '<button class="battle-nav-btn battle-btn-prev-stage">◀</button>';
    html += '<div class="battle-stage-info">';
    if (stage) {
      html += '<div class="battle-stage-name">';
      html += '<span class="battle-chapter-badge">' + stage.chapter + '-' + stage.stage + '</span>';
      html += ' ' + stage.name;
      if (stage.isBoss) html += ' <span class="battle-boss-tag">BOSS</span>';
      if (BattleManager.isStageCleared(stage.id)) html += ' <span class="battle-cleared-tag">✓</span>';
      html += '</div>';
      html += '<div class="battle-stage-meta">';
      html += '<span>🍚' + (stage.foodCost || 0) + '</span>';
      if (stage.rewards) {
        if (stage.rewards.gold) html += '<span>💰' + stage.rewards.gold + '</span>';
        if (stage.rewards.exp) html += '<span>⭐' + stage.rewards.exp + '</span>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '<button class="battle-nav-btn battle-btn-next-stage">▶</button>';
    html += '</div>';

    // --- SVG 战斗场景 ---
    html += '<div id="battle-scene" class="battle-scene-container">';
    if (!bs || bs.phase !== 'fighting') {
      html += this._renderIdleScene(stage);
    }
    html += '</div>';

    // --- 结果覆盖层 ---
    if (this._resultOverlay) {
      html += this._renderResultOverlay(this._resultOverlay);
    }

    // --- 控制按钮 ---
    html += '<div id="battle-controls" class="battle-controls">';
    html += this._renderControls(isFighting, isAuto, stage);
    html += '</div>';

    // --- 战斗日志 (可折叠) ---
    html += '<div class="battle-log-section">';
    html += '<div class="battle-log-header" id="battle-log-toggle">';
    html += '<span>📜 战斗日志</span>';
    html += '<span class="battle-log-arrow">▼</span>';
    html += '</div>';
    html += '<div id="battle-log" class="battle-log-body">';
    html += this._renderLogEntries(bs);
    html += '</div>';
    html += '</div>';

    // --- 进度条 ---
    html += '<div class="battle-progress-bar">';
    var pct = cleared.length / Math.max(1, StageData.length) * 100;
    html += '<div class="battle-progress-fill" style="width:' + pct + '%;"></div>';
    html += '<span class="battle-progress-text">关卡 ' + cleared.length + '/' + StageData.length + '</span>';
    html += '</div>';

    this._container.innerHTML = html;
    this._bindEvents();
    this._scrollLogToBottom();

    if (bs && bs.phase === 'fighting') {
      this._initBattleScene();
    }
  },

  // ===== 待机场景 =====

  _renderIdleScene: function (stage) {
    var html = '<div class="battle-idle-scene">';

    var team = HeroManager.getTeam();
    html += '<div class="battle-idle-side">';
    html += '<div class="battle-idle-label">我方</div>';
    if (team.length === 0) {
      html += '<div class="battle-idle-empty">未编入武将</div>';
    } else {
      html += '<div class="battle-idle-units">';
      for (var i = 0; i < team.length; i++) {
        var hero = team[i];
        var template = HeroManager.getTemplate(hero.id);
        if (!template) continue;
        html += '<div class="battle-idle-unit ally">';
        html += '<div class="battle-idle-avatar">' + (template.emoji || '⚔️') + '</div>';
        html += '<div class="battle-idle-name">' + template.name + '</div>';
        html += '<div class="battle-idle-level">Lv.' + hero.level + '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="battle-idle-vs">⚔️</div>';

    html += '<div class="battle-idle-side">';
    html += '<div class="battle-idle-label enemy">敌方</div>';
    if (stage && stage.enemies) {
      html += '<div class="battle-idle-units">';
      for (var j = 0; j < stage.enemies.length; j++) {
        var enemy = stage.enemies[j];
        html += '<div class="battle-idle-unit enemy">';
        html += '<div class="battle-idle-avatar">👹</div>';
        html += '<div class="battle-idle-name">' + enemy.name + '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  },

  // ===== Controls =====

  _renderControls: function (isFighting, isAuto, stage) {
    var html = '';
    var foodAvailable = stage ? ResourceManager.canAfford(CONSTANTS.RESOURCE.FOOD, stage.foodCost || 0) : false;
    var hasTeam = HeroManager.getTeamUids().length > 0;
    var canStart = !isFighting && foodAvailable && hasTeam;

    html += '<button class="btn battle-btn-main battle-btn-start"';
    if (!canStart) html += ' disabled';
    html += '>';
    if (isFighting) {
      html += '⚔️ 战斗中...';
    } else {
      html += '⚔️ 出战';
      if (stage) html += ' <span class="battle-food-cost">🍚' + (stage.foodCost || 0) + '</span>';
    }
    html += '</button>';

    html += '<button class="btn battle-btn-side battle-btn-auto';
    if (isAuto) html += ' active';
    html += '">';
    html += '🔄 ' + (isAuto ? '自动中' : '自动');
    html += '</button>';

    if (stage && BattleManager.isStageCleared(stage.id)) {
      html += '<button class="btn battle-btn-side battle-btn-sweep"';
      if (isFighting || !foodAvailable || !hasTeam) html += ' disabled';
      html += '>⚡扫荡</button>';
    }

    return html;
  },

  // ===== 结果 =====

  _renderResultOverlay: function (data) {
    var isVictory = data.result === 'victory';
    var cls = isVictory ? 'victory' : 'defeat';

    var html = '<div class="battle-result ' + cls + '">';
    html += '<div class="battle-result-icon">' + (isVictory ? '🎉' : '💀') + '</div>';
    html += '<div class="battle-result-title">' + (isVictory ? '战斗胜利！' : '战斗失败') + '</div>';

    if (isVictory && data.rewards && data.rewards.length > 0) {
      html += '<div class="battle-result-rewards">';
      for (var r = 0; r < data.rewards.length; r++) {
        html += '<span class="battle-reward-item">' + data.rewards[r] + '</span>';
      }
      html += '</div>';
      if (data.isFirstClear) {
        html += '<div class="battle-result-first">🌟 首次通关奖励！</div>';
      }
    } else if (!isVictory) {
      html += '<div class="battle-result-hint">提升武将实力后再试！</div>';
    }

    html += '</div>';
    return html;
  },

  // ===== 日志 =====

  _renderLogEntries: function (bs) {
    var logs = [];
    if (bs && bs.log) logs = bs.log;
    if (logs.length === 0 && this._logEntries.length === 0) {
      return '<div class="battle-log-empty">暂无战斗记录</div>';
    }

    var allLogs = logs.length > 0 ? logs : this._logEntries;
    var html = '';
    var start = Math.max(0, allLogs.length - 30);
    for (var i = start; i < allLogs.length; i++) {
      var entry = allLogs[i];
      var cls = 'battle-log-entry';
      if (entry.indexOf('伤害') !== -1 || entry.indexOf('暴击') !== -1) cls += ' damage';
      else if (entry.indexOf('恢复') !== -1) cls += ' heal';
      else if (entry.indexOf('击败') !== -1) cls += ' kill';
      else if (entry.indexOf('胜利') !== -1 || entry.indexOf('获得') !== -1) cls += ' victory';
      else if (entry.indexOf('战败') !== -1 || entry.indexOf('覆没') !== -1) cls += ' defeat';
      else if (entry.indexOf('使用') !== -1) cls += ' skill';
      html += '<div class="' + cls + '">' + entry + '</div>';
    }
    return html;
  },

  // ===== 事件处理 =====

  _onBattleTick: function () {
    if (!this._container) return;
    var bs = BattleManager.getBattleState();
    if (!bs) return;

    // 更新 SVG 场景
    var sceneEl = this._container.querySelector('#battle-scene');
    if (sceneEl && sceneEl.querySelector('#battle-canvas')) {
      BattleAnimations.renderBattle(bs);
    } else if (sceneEl) {
      this._initBattleScene();
    }

    this._updateLog();
  },

  _onBattleEnd: function (data) {
    this._resultOverlay = data;
    this._render();
  },

  _addLogEntry: function (entry) {
    this._logEntries.push(entry);
    if (this._logEntries.length > 50) this._logEntries.shift();
  },

  _updateLog: function () {
    var logEl = this._container ? this._container.querySelector('#battle-log') : null;
    if (!logEl) return;
    var bs = BattleManager.getBattleState();
    logEl.innerHTML = this._renderLogEntries(bs);
    this._scrollLogToBottom();
  },

  _updateControls: function () {
    if (!this._container) return;
    var controlsEl = this._container.querySelector('#battle-controls');
    if (controlsEl) {
      var stage = BattleManager.getCurrentStage();
      var isFighting = BattleManager.isFighting();
      var isAuto = BattleManager.isAutoFight();
      controlsEl.innerHTML = this._renderControls(isFighting, isAuto, stage);
      this._bindControlEvents();
    }
  },

  _scrollLogToBottom: function () {
    var logEl = this._container ? this._container.querySelector('#battle-log') : null;
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
  },

  // ===== 绑定事件 =====

  _bindEvents: function () {
    this._bindControlEvents();
    this._bindStageNavEvents();
    this._bindLogToggle();
  },

  _bindControlEvents: function () {
    var self = this;
    var startBtn = this._container.querySelector('.battle-btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        self._resultOverlay = null;
        BattleManager.startBattle();
      });
    }

    var autoBtn = this._container.querySelector('.battle-btn-auto');
    if (autoBtn) {
      autoBtn.addEventListener('click', function () {
        BattleManager.toggleAutoFight();
        self._render();
      });
    }

    var sweepBtn = this._container.querySelector('.battle-btn-sweep');
    if (sweepBtn) {
      sweepBtn.addEventListener('click', function () {
        self._resultOverlay = null;
        BattleManager.startBattle();
      });
    }
  },

  _bindStageNavEvents: function () {
    var self = this;
    var prevBtn = this._container.querySelector('.battle-btn-prev-stage');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (BattleManager.isFighting()) return;
        var currentStage = BattleManager.getCurrentStage();
        if (!currentStage) return;
        var idx = -1;
        for (var i = 0; i < StageData.length; i++) {
          if (StageData[i].id === currentStage.id) { idx = i; break; }
        }
        if (idx > 0) {
          BattleManager.setCurrentStage(StageData[idx - 1].id);
          self._resultOverlay = null;
          self._render();
        }
      });
    }

    var nextBtn = this._container.querySelector('.battle-btn-next-stage');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (BattleManager.isFighting()) return;
        var currentStage = BattleManager.getCurrentStage();
        if (!currentStage) return;
        var idx = -1;
        for (var i = 0; i < StageData.length; i++) {
          if (StageData[i].id === currentStage.id) { idx = i; break; }
        }
        if (idx >= 0 && idx < StageData.length - 1) {
          BattleManager.setCurrentStage(StageData[idx + 1].id);
          self._resultOverlay = null;
          self._render();
        }
      });
    }
  },

  _bindLogToggle: function () {
    var toggle = this._container ? this._container.querySelector('#battle-log-toggle') : null;
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var log = toggle.parentNode.querySelector('#battle-log');
      var arrow = toggle.querySelector('.battle-log-arrow');
      if (log) {
        var collapsed = log.classList.toggle('collapsed');
        if (arrow) arrow.textContent = collapsed ? '▶' : '▼';
      }
    });
  }
};
