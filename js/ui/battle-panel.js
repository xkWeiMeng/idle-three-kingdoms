/** 战斗面板 UI */
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
    });
    EventBus.on('battle:tick', function () { self._updateBattle(); });
    EventBus.on('battle:ended', function (data) { self._onBattleEnd(data); });
    EventBus.on('battle:log', function (entry) { self._addLogEntry(entry); });
    EventBus.on('resource:changed', function () { self._updateControls(); });
    EventBus.on('hero:team_changed', function () { self._render(); });
  },

  _render: function () {
    if (!this._container) return;

    var stage = BattleManager.getCurrentStage();
    var bs = BattleManager.getBattleState();
    var isAuto = BattleManager.isAutoFight();
    var isFighting = BattleManager.isFighting();
    var cleared = BattleManager.getClearedStages();

    var html = '';

    // --- Header ---
    html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<span style="font-size:1.05rem;font-weight:bold;">🏟️ 战斗</span>';
    if (stage) {
      html += '<span style="color:var(--color-gold);font-size:0.85rem;">关卡 ' + stage.chapter + '-' + stage.stage + '</span>';
    }
    html += '</div>';

    // --- Stage Info ---
    if (stage) {
      html += '<div class="card">';
      html += '<div style="font-weight:bold;margin-bottom:4px;">' + stage.name + '</div>';
      html += '<div style="font-size:0.8rem;color:var(--color-text-dim);margin-bottom:6px;">' + stage.description + '</div>';
      html += '<div style="display:flex;gap:12px;font-size:0.8rem;">';
      html += '<span>🍚 消耗粮草: <span style="color:var(--color-gold);">' + (stage.foodCost || 0) + '</span></span>';
      if (stage.isBoss) {
        html += '<span style="color:var(--color-primary);font-weight:bold;">👑 BOSS关</span>';
      }
      var stageCleared = BattleManager.isStageCleared(stage.id);
      if (stageCleared) {
        html += '<span style="color:var(--color-success);">✅ 已通关</span>';
      }
      html += '</div>';

      // Enemy preview (when not fighting)
      if (!bs || bs.phase !== 'fighting') {
        html += '<div style="margin-top:8px;font-size:0.78rem;color:var(--color-text-dim);">';
        html += '敌方: ';
        for (var ep = 0; ep < stage.enemies.length; ep++) {
          if (ep > 0) html += ', ';
          html += stage.enemies[ep].name;
        }
        html += '</div>';
      }

      // Rewards preview
      if (stage.rewards) {
        html += '<div style="margin-top:4px;font-size:0.75rem;color:var(--color-text-dim);">';
        html += '奖励: ';
        if (stage.rewards.gold) html += '💰' + stage.rewards.gold + ' ';
        if (stage.rewards.exp) html += '⭐' + stage.rewards.exp + ' ';
        if (stage.rewards.food) html += '🍖' + stage.rewards.food + ' ';
        html += '</div>';
      }
      html += '</div>';
    }

    // --- Stage selector ---
    html += this._renderStageSelector(stage, cleared);

    // --- Battle Area ---
    html += '<div id="battle-arena" class="card" style="min-height:120px;">';
    html += this._renderBattleArena(bs);
    html += '</div>';

    // --- Result Overlay ---
    if (this._resultOverlay) {
      html += this._renderResultOverlay(this._resultOverlay);
    }

    // --- Battle Log ---
    html += '<div class="card" style="max-height:160px;overflow:hidden;display:flex;flex-direction:column;">';
    html += '<div style="font-weight:bold;margin-bottom:4px;font-size:0.85rem;">📜 战斗日志</div>';
    html += '<div id="battle-log" style="flex:1;overflow-y:auto;font-size:0.72rem;max-height:120px;">';
    html += this._renderLogEntries(bs);
    html += '</div>';
    html += '</div>';

    // --- Controls ---
    html += '<div id="battle-controls" class="card" style="display:flex;gap:6px;align-items:center;">';
    html += this._renderControls(isFighting, isAuto, stage);
    html += '</div>';

    // --- Progress ---
    html += '<div style="text-align:center;font-size:0.75rem;color:var(--color-text-dim);margin-top:4px;">';
    html += '关卡进度: 已通关 ' + cleared.length + ' / ' + StageData.length + ' 关';
    html += '</div>';

    this._container.innerHTML = html;
    this._bindEvents();
    this._scrollLogToBottom();
  },

  _renderStageSelector: function (currentStage, cleared) {
    if (!currentStage) return '';
    var html = '<div class="card" style="display:flex;gap:6px;align-items:center;">';
    html += '<button class="btn battle-btn-prev-stage" style="font-size:0.75rem;padding:4px 8px;background:var(--color-secondary);">◀</button>';
    html += '<div style="flex:1;text-align:center;font-size:0.85rem;">';
    html += '<span style="color:var(--color-gold);">' + currentStage.chapter + '-' + currentStage.stage + '</span> ';
    html += currentStage.name;
    html += '</div>';
    html += '<button class="btn battle-btn-next-stage" style="font-size:0.75rem;padding:4px 8px;background:var(--color-secondary);">▶</button>';
    html += '</div>';
    return html;
  },

  _renderBattleArena: function (bs) {
    if (!bs) {
      return '<div style="text-align:center;color:var(--color-text-dim);padding:20px;">点击「开始战斗」出战！</div>';
    }

    var html = '';
    // Round header
    html += '<div style="text-align:center;font-size:0.8rem;color:var(--color-gold);margin-bottom:8px;">';
    if (bs.phase === 'fighting') {
      html += '⚔ 第 ' + bs.round + ' 回合';
    } else if (bs.phase === 'victory') {
      html += '🎉 胜利！';
    } else if (bs.phase === 'defeat') {
      html += '💀 战败';
    }
    html += '</div>';

    // Battle grid: allies vs enemies
    html += '<div style="display:flex;gap:8px;">';

    // Allies
    html += '<div style="flex:1;">';
    html += '<div style="text-align:center;font-size:0.75rem;color:var(--color-success);margin-bottom:4px;">我方</div>';
    for (var a = 0; a < bs.allies.length; a++) {
      html += this._renderUnitBar(bs.allies[a], true);
    }
    html += '</div>';

    // VS divider
    html += '<div style="display:flex;align-items:center;font-weight:bold;color:var(--color-primary);font-size:0.9rem;padding:0 2px;">VS</div>';

    // Enemies
    html += '<div style="flex:1;">';
    html += '<div style="text-align:center;font-size:0.75rem;color:var(--color-danger);margin-bottom:4px;">敌方</div>';
    for (var e = 0; e < bs.enemies.length; e++) {
      html += this._renderUnitBar(bs.enemies[e], false);
    }
    html += '</div>';

    html += '</div>';
    return html;
  },

  _renderUnitBar: function (unit, isAlly) {
    var hpPct = unit.maxHp > 0 ? Math.floor((unit.currentHp / unit.maxHp) * 100) : 0;
    var hpColor = hpPct > 50 ? '#4caf50' : (hpPct > 25 ? '#ff9800' : '#e94560');
    var opacity = unit.isAlive ? '1' : '0.35';
    var deathMark = unit.isAlive ? '' : ' 💀';

    var html = '<div class="battle-unit" data-uid="' + unit.uid + '" style="margin-bottom:4px;opacity:' + opacity + ';">';

    // Name row
    html += '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.72rem;">';
    html += '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70%;">';
    html += (unit.emoji || '') + ' ' + unit.name + deathMark;
    html += '</span>';
    html += '<span style="color:var(--color-text-dim);font-size:0.65rem;">' + unit.currentHp + '/' + unit.maxHp + '</span>';
    html += '</div>';

    // HP bar
    html += '<div style="height:5px;background:var(--color-bg);border-radius:3px;overflow:hidden;">';
    html += '<div style="height:100%;width:' + hpPct + '%;background:' + hpColor + ';border-radius:3px;transition:width 0.3s;"></div>';
    html += '</div>';

    // Buffs
    if (unit.buffs && unit.buffs.length > 0) {
      html += '<div style="font-size:0.6rem;margin-top:1px;">';
      for (var b = 0; b < unit.buffs.length; b++) {
        var buff = unit.buffs[b];
        var buffColor = buff.ratio > 0 ? '#4caf50' : '#e94560';
        var sign = buff.ratio > 0 ? '↑' : '↓';
        html += '<span style="color:' + buffColor + ';margin-right:3px;">' + sign + buff.stat + '</span>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  _renderLogEntries: function (bs) {
    var logs = [];
    if (bs && bs.log) {
      logs = bs.log;
    }
    if (logs.length === 0 && this._logEntries.length === 0) {
      return '<div style="color:var(--color-text-dim);text-align:center;padding:8px;">暂无战斗记录</div>';
    }

    var allLogs = logs.length > 0 ? logs : this._logEntries;
    var html = '';
    for (var i = 0; i < allLogs.length; i++) {
      var entry = allLogs[i];
      var logColor = 'var(--color-text-dim)';
      if (entry.indexOf('伤害') !== -1 || entry.indexOf('暴击') !== -1) {
        logColor = '#e94560';
      } else if (entry.indexOf('恢复') !== -1) {
        logColor = '#4caf50';
      } else if (entry.indexOf('持续') !== -1 && entry.indexOf('攻击') !== -1) {
        logColor = '#2196f3';
      } else if (entry.indexOf('击败') !== -1) {
        logColor = 'var(--color-text-dim)';
      } else if (entry.indexOf('胜利') !== -1) {
        logColor = 'var(--color-gold)';
      } else if (entry.indexOf('战败') !== -1) {
        logColor = 'var(--color-danger)';
      }
      html += '<div style="color:' + logColor + ';padding:1px 0;border-bottom:1px solid var(--color-bg);">' + entry + '</div>';
    }
    return html;
  },

  _renderControls: function (isFighting, isAuto, stage) {
    var html = '';
    var foodAvailable = stage ? ResourceManager.canAfford(CONSTANTS.RESOURCE.FOOD, stage.foodCost || 0) : false;
    var hasTeam = HeroManager.getTeamUids().length > 0;
    var canStart = !isFighting && foodAvailable && hasTeam;

    // Start battle button
    html += '<button class="btn battle-btn-start" style="flex:1;font-size:0.85rem;"';
    if (!canStart) html += ' disabled';
    html += '>⚔️ ' + (isFighting ? '战斗中...' : '开始战斗') + '</button>';

    // Auto fight toggle
    html += '<button class="btn battle-btn-auto" style="font-size:0.8rem;padding:6px 10px;';
    html += 'background:' + (isAuto ? 'var(--color-success)' : 'var(--color-secondary)') + ';">';
    html += '🔄 自动:' + (isAuto ? '开' : '关') + '</button>';

    // Sweep button (only for cleared stages)
    if (stage && BattleManager.isStageCleared(stage.id)) {
      html += '<button class="btn battle-btn-sweep" style="font-size:0.8rem;padding:6px 10px;background:var(--color-secondary);"';
      if (isFighting || !foodAvailable || !hasTeam) html += ' disabled';
      html += '>⚡扫荡</button>';
    }

    return html;
  },

  _renderResultOverlay: function (data) {
    var isVictory = data.result === 'victory';
    var bgColor = isVictory ? 'rgba(76,175,80,0.15)' : 'rgba(233,69,96,0.15)';
    var borderColor = isVictory ? 'var(--color-success)' : 'var(--color-danger)';
    var icon = isVictory ? '🎉' : '💀';
    var title = isVictory ? '战斗胜利！' : '战斗失败';

    var html = '<div class="card" style="background:' + bgColor + ';border:1px solid ' + borderColor + ';text-align:center;">';
    html += '<div style="font-size:1.3rem;margin-bottom:4px;">' + icon + ' ' + title + '</div>';

    if (isVictory && data.rewards && data.rewards.length > 0) {
      html += '<div style="font-size:0.85rem;color:var(--color-gold);margin-bottom:4px;">获得奖励</div>';
      html += '<div style="display:flex;justify-content:center;gap:10px;font-size:0.9rem;">';
      for (var r = 0; r < data.rewards.length; r++) {
        html += '<span>' + data.rewards[r] + '</span>';
      }
      html += '</div>';
      if (data.isFirstClear) {
        html += '<div style="font-size:0.75rem;color:var(--color-primary);margin-top:4px;">🌟 首次通关奖励！</div>';
      }
    } else if (!isVictory) {
      html += '<div style="font-size:0.8rem;color:var(--color-text-dim);">提升武将实力后再试！</div>';
    }

    html += '</div>';
    return html;
  },

  _updateBattle: function () {
    if (!this._container) return;
    var bs = BattleManager.getBattleState();
    if (!bs) return;

    // Update arena only (efficient partial update)
    var arena = this._container.querySelector('#battle-arena');
    if (arena) {
      arena.innerHTML = this._renderBattleArena(bs);
    }

    // Update log
    var logEl = this._container.querySelector('#battle-log');
    if (logEl) {
      logEl.innerHTML = this._renderLogEntries(bs);
      this._scrollLogToBottom();
    }
  },

  _onBattleEnd: function (data) {
    this._resultOverlay = data;
    this._render();
  },

  _addLogEntry: function (entry) {
    this._logEntries.push(entry);
    if (this._logEntries.length > 50) {
      this._logEntries.shift();
    }
  },

  _scrollLogToBottom: function () {
    var logEl = this._container ? this._container.querySelector('#battle-log') : null;
    if (logEl) {
      logEl.scrollTop = logEl.scrollHeight;
    }
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

  _bindEvents: function () {
    this._bindControlEvents();
    this._bindStageNavEvents();
  },

  _bindControlEvents: function () {
    var self = this;

    var startBtn = this._container.querySelector('.battle-btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () { self._onStartBattle(); });
    }

    var autoBtn = this._container.querySelector('.battle-btn-auto');
    if (autoBtn) {
      autoBtn.addEventListener('click', function () { self._onToggleAuto(); });
    }

    var sweepBtn = this._container.querySelector('.battle-btn-sweep');
    if (sweepBtn) {
      sweepBtn.addEventListener('click', function () { self._onSweep(); });
    }
  },

  _bindStageNavEvents: function () {
    var self = this;

    var prevBtn = this._container.querySelector('.battle-btn-prev-stage');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () { self._onPrevStage(); });
    }

    var nextBtn = this._container.querySelector('.battle-btn-next-stage');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () { self._onNextStage(); });
    }
  },

  _onStartBattle: function () {
    this._resultOverlay = null;
    BattleManager.startBattle();
  },

  _onToggleAuto: function () {
    BattleManager.toggleAutoFight();
    this._render();
  },

  _onSweep: function () {
    // Quick battle: start and instantly resolve
    this._resultOverlay = null;
    BattleManager.startBattle();
  },

  _onPrevStage: function () {
    if (BattleManager.isFighting()) return;
    var currentStage = BattleManager.getCurrentStage();
    if (!currentStage) return;

    var idx = -1;
    for (var i = 0; i < StageData.length; i++) {
      if (StageData[i].id === currentStage.id) { idx = i; break; }
    }
    if (idx > 0) {
      BattleManager.setCurrentStage(StageData[idx - 1].id);
      this._resultOverlay = null;
      this._render();
    }
  },

  _onNextStage: function () {
    if (BattleManager.isFighting()) return;
    var currentStage = BattleManager.getCurrentStage();
    if (!currentStage) return;

    var idx = -1;
    for (var i = 0; i < StageData.length; i++) {
      if (StageData[i].id === currentStage.id) { idx = i; break; }
    }
    if (idx >= 0 && idx < StageData.length - 1) {
      BattleManager.setCurrentStage(StageData[idx + 1].id);
      this._resultOverlay = null;
      this._render();
    }
  }
};
