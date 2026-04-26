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
    EventBus.on('town:building_upgraded', function () { self._render(); });
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
    html += '<div class="battle-stage-info" style="cursor:pointer" title="点击选择关卡">';
    if (stage) {
      html += '<div class="battle-stage-name">';
      html += '<span class="battle-chapter-badge">' + stage.chapter + '-' + stage.stage + '</span>';
      html += ' ' + stage.name;
      if (stage.isBoss) html += ' <span class="battle-boss-tag">BOSS</span>';
      if (BattleManager.isStageCleared(stage.id)) html += ' <span class="battle-cleared-tag">✓</span>';
      html += '</div>';
      html += '<div class="battle-stage-meta">';
      html += '<span>' + UIIcons.icon('food') + (stage.foodCost || 0) + '</span>';
      if (stage.rewards) {
        if (stage.rewards.gold) html += '<span>' + UIIcons.icon('gold') + stage.rewards.gold + '</span>';
        if (stage.rewards.exp) html += '<span>' + UIIcons.icon('exp') + stage.rewards.exp + '</span>';
      }
      html += '<span class="stage-picker-hint">' + UIIcons.icon('list') + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<button class="battle-nav-btn battle-btn-next-stage">▶</button>';
    html += '</div>';

    // --- 章节门禁提示 ---
    var gateCheck = this._getChapterGate(stage);
    if (gateCheck && !gateCheck.ok) {
      html += this._renderChapterGate(stage, gateCheck);
    }

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

    // --- 终极技能栏 ---
    html += '<div id="ultimate-bar" class="ultimate-bar"></div>';

    // --- 控制按钮 ---
    html += '<div id="battle-controls" class="battle-controls">';
    html += this._renderControls(isFighting, isAuto, stage);
    html += '</div>';

    // --- 阵营羁绊提示 ---
    html += this._renderBondInfo();

    // --- 增益提示 ---
    html += this._renderBuffBar();

    // --- 战斗日志 (可折叠) ---
    html += '<div class="battle-log-section">';
    html += '<div class="battle-log-header" id="battle-log-toggle">';
    html += '<span>' + UIIcons.icon('story') + ' 战斗日志</span>';
    html += '<span class="battle-log-arrow">▼</span>';
    html += '</div>';
    html += '<div id="battle-log" class="battle-log-body">';
    html += this._renderLogEntries(bs);
    html += '</div>';
    html += '</div>';

    // --- 进度条 ---
    var pct = cleared.length / Math.max(1, StageData.length) * 100;
    var pctDisplay = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1);
    var progressColorCls = pct < 25 ? 'progress-tier1' : pct < 50 ? 'progress-tier2' : pct < 75 ? 'progress-tier3' : 'progress-tier4';
    html += '<div class="battle-progress-bar ' + progressColorCls + '">';
    html += '<div class="battle-progress-fill" style="width:' + pct + '%;"></div>';
    html += '<span class="battle-progress-text">关卡 ' + cleared.length + '/' + StageData.length + ' (' + pctDisplay + '%)</span>';
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
      html += '<div class="battle-idle-avatar">' + HeroPortrait.getImgTag(hero.id, 36) + '</div>';
        html += '<div class="battle-idle-name">' + template.name + '</div>';
        html += '<div class="battle-idle-level">Lv.' + hero.level + '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    // --- 战力对比 ---
    var allyPower = 0;
    for (var pi = 0; pi < team.length; pi++) {
      allyPower += HeroManager.getBattlePower(team[pi].uid) || 0;
    }
    var enemyPower = 0;
    if (stage && stage.enemies) {
      for (var ei = 0; ei < stage.enemies.length; ei++) {
        var e = stage.enemies[ei];
        enemyPower += Math.floor((e.atk || 0) + (e.def || 0) + (e.hp || 0) / 10 + (e.spd || 0));
      }
    }
    var powerDiff = allyPower - enemyPower;
    var powerCls = Math.abs(powerDiff) <= Math.max(allyPower, enemyPower, 1) * 0.1 ? 'power-even' : (powerDiff > 0 ? 'power-ahead' : 'power-behind');
    html += '<div class="battle-idle-vs">';
    html += '<span class="power-ally ' + powerCls + '">⚔️ ' + allyPower + '</span>';
    html += '<span class="power-vs-label">VS</span>';
    html += '<span class="power-enemy ' + powerCls + '">⚔️ ' + enemyPower + '</span>';
    html += '</div>';

    html += '<div class="battle-idle-side">';
    html += '<div class="battle-idle-label enemy">敌方</div>';
    if (stage && stage.enemies) {
      html += '<div class="battle-idle-units">';
      for (var j = 0; j < stage.enemies.length; j++) {
        var enemy = stage.enemies[j];
        html += '<div class="battle-idle-unit enemy">';
        html += '<div class="battle-idle-avatar">' + UIIcons.icon('enemy', 'ui-icon-xl') + '</div>';
        html += '<div class="battle-idle-name">' + enemy.name + '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  },

  // ===== 增益提示栏 =====

  _renderBuffBar: function () {
    var buffs = [];

    // 料理 buff
    var cookBuff = (typeof FarmManager !== 'undefined') ? FarmManager.getActiveBuff() : null;
    if (cookBuff && cookBuff.effects) {
      var parts = [];
      if (cookBuff.effects.spdBonus) parts.push('速+' + Math.round(cookBuff.effects.spdBonus * 100) + '%');
      if (cookBuff.effects.critRate) parts.push('暴+' + Math.round(cookBuff.effects.critRate * 100) + '%');
      if (cookBuff.effects.expBonus) parts.push('经+' + Math.round(cookBuff.effects.expBonus * 100) + '%');
      if (cookBuff.effects.atkBonus) parts.push('攻+' + Math.round(cookBuff.effects.atkBonus * 100) + '%');
      if (cookBuff.effects.allBonus) parts.push('全+' + Math.round(cookBuff.effects.allBonus * 100) + '%');
      if (parts.length > 0) buffs.push({ icon: UIIcons.icon('food'), text: parts.join(' ') });
    }

    // 塔防永久 buff
    var tdBuff = (typeof TowerDefenseManager !== 'undefined' && TowerDefenseManager.getPermanentBattleBuff)
      ? TowerDefenseManager.getPermanentBattleBuff() : null;
    if (tdBuff) {
      buffs.push({ icon: UIIcons.icon('defense'), text: '城防波' + tdBuff.highestWave + ' 攻防+' + Math.round(tdBuff.atkPercent * 100) + '%' });
    }

    if (buffs.length === 0) return '';
    var html = '<div class="battle-buff-bar">';
    for (var i = 0; i < buffs.length; i++) {
      html += '<span class="buff-tag">' + buffs[i].icon + ' ' + buffs[i].text + '</span>';
    }
    html += '</div>';
    return html;
  },

  // ===== 阵营羁绊提示 =====

  _updateUltimateBar: function (bs) {
    var bar = this._container ? this._container.querySelector('#ultimate-bar') : null;
    if (!bar) return;
    if (!bs || !bs.allies) { bar.innerHTML = ''; return; }

    var html = '';
    for (var i = 0; i < bs.allies.length; i++) {
      var u = bs.allies[i];
      if (!u.ultimate || !u.isAlive) continue;
      var pct = Math.min(100, Math.floor((u.energy / u.energyMax) * 100));
      var ready = u.ultimateReady;
      html += '<div class="ult-slot' + (ready ? ' ult-ready' : '') + '" data-uid="' + u.uid + '">';
      html += '<div class="ult-icon">' + (u.ultimate.icon || UIIcons.icon('flame')) + '</div>';
      html += '<div class="ult-energy-track"><div class="ult-energy-fill" style="width:' + pct + '%"></div></div>';
      html += '<div class="ult-name">' + u.name + '</div>';
      html += '</div>';
    }
    bar.innerHTML = html;

    // bind click events for ready ultimates
    var slots = bar.querySelectorAll('.ult-slot.ult-ready');
    for (var j = 0; j < slots.length; j++) {
      slots[j].addEventListener('click', (function (uid) {
        return function () { BattleManager.triggerUltimate(uid); };
      })(slots[j].getAttribute('data-uid')));
    }
  },

  _renderBondInfo: function () {
    if (typeof calculateTeamBonuses !== 'function') return '';
    var team = HeroManager.getTeam();
    var bonuses = calculateTeamBonuses(team);
    if (!bonuses.factionBonus && bonuses.activeBonds.length === 0) return '';

    var html = '<div class="battle-bond-bar">';
    if (bonuses.factionBonus) {
      html += '<span class="bond-tag faction">' + bonuses.factionName + ' ' + bonuses.factionBonus.label + '</span>';
    }
    for (var i = 0; i < bonuses.activeBonds.length; i++) {
      var bond = bonuses.activeBonds[i];
      html += '<span class="bond-tag">' + bond.icon + ' ' + bond.name + '</span>';
    }
    html += '</div>';
    return html;
  },

  // ===== Controls =====

  _renderControls: function (isFighting, isAuto, stage) {
    var html = '';
    var hasTeam = HeroManager.getTeamUids().length > 0;
    var foodAvailable = stage ? ResourceManager.canAfford(CONSTANTS.RESOURCE.FOOD, stage.foodCost || 0) : false;
    var gateCheck = this._getChapterGate(stage);
    var isGated = gateCheck && !gateCheck.ok;
    var canStart = !isFighting && hasTeam && !isGated;

    html += '<button class="btn battle-btn-main battle-btn-start"';
    if (!canStart) html += ' disabled';
    html += '>';
    if (isGated) {
      html += UIIcons.icon('lock') + ' 需要升级建筑';
    } else if (isFighting) {
      html += UIIcons.icon('attack') + ' 战斗中...';
    } else {
      html += UIIcons.icon('attack') + ' 出战';
      if (stage) {
        html += ' <span class="battle-food-cost' + (foodAvailable ? '' : ' depleted') + '">' + UIIcons.icon('food') + (stage.foodCost || 0) + '</span>';
      }
    }
    html += '</button>';

    // 战斗速度按钮
    var speed = BattleManager.getBattleSpeed();
    html += '<button class="btn battle-btn-side battle-btn-speed">×' + speed + '</button>';

    html += '<button class="btn battle-btn-side battle-btn-auto';
    if (isAuto) html += ' active';
    html += '">';
    html += UIIcons.icon('speed') + ' ' + (isAuto ? '自动中' : '自动');
    html += '</button>';

    if (stage && BattleManager.isStageCleared(stage.id)) {
      html += '<button class="btn battle-btn-side battle-btn-sweep"';
      if (isFighting || !hasTeam || isGated) html += ' disabled';
      html += '>⚡扫荡</button>';
    }

    return html;
  },

  // ===== 结果 =====

  _renderResultOverlay: function (data) {
    var isVictory = data.result === 'victory';
    var cls = isVictory ? 'victory' : 'defeat';

    var html = '<div class="battle-result ' + cls + '">';
    html += '<div class="battle-result-icon">' + (isVictory ? UIIcons.icon('victory', 'ui-icon-xl') : UIIcons.icon('defeat', 'ui-icon-xl')) + '</div>';
    html += '<div class="battle-result-title">' + (isVictory ? '战斗胜利！' : '战斗失败') + '</div>';

    if (isVictory && data.rewards && data.rewards.length > 0) {
      html += '<div class="battle-result-rewards">';
      for (var r = 0; r < data.rewards.length; r++) {
        html += '<span class="battle-reward-item">' + data.rewards[r] + '</span>';
      }
      html += '</div>';
      if (data.isFirstClear) {
        html += '<div class="battle-result-first">' + UIIcons.icon('sparkle') + ' 首次通关奖励！</div>';
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

    // 更新终极技能栏
    this._updateUltimateBar(bs);

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

    // 战斗速度切换
    var speedBtn = this._container.querySelector('.battle-btn-speed');
    if (speedBtn) {
      speedBtn.addEventListener('click', function () {
        var newSpeed = BattleManager.cycleBattleSpeed();
        speedBtn.textContent = '×' + newSpeed;
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

    // 点击关卡信息区域打开关卡选择器
    var stageInfo = this._container.querySelector('.battle-stage-info');
    if (stageInfo) {
      stageInfo.addEventListener('click', function () {
        if (BattleManager.isFighting()) return;
        self._showStagePicker();
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
  },

  // ===== 章节门禁 =====

  _getChapterGate: function (stage) {
    if (!stage || stage.stage !== 1 || stage.chapter < 2) return null;
    if (typeof TownManager === 'undefined') return null;
    return TownManager.checkChapterGate(stage.chapter);
  },

  _renderChapterGate: function (stage, gateCheck) {
    var html = '<div class="chapter-gate-panel">';
    html += '<div class="chapter-gate-title">' + UIIcons.icon('lock') + ' 第' + stage.chapter + '章解锁条件</div>';
    html += '<div class="chapter-gate-desc">升级以下建筑即可进入新章节：</div>';
    html += '<div class="chapter-gate-list">';
    for (var i = 0; i < gateCheck.missing.length; i++) {
      var m = gateCheck.missing[i];
      html += '<div class="chapter-gate-item">';
      html += '<span class="gate-icon">' + m.emoji + '</span>';
      html += '<span class="gate-name">' + m.name + '</span>';
      html += '<span class="gate-level">';
      html += '<span class="gate-current">' + m.current + '</span>';
      html += ' / ';
      html += '<span class="gate-required">' + m.required + '</span>';
      html += '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  },

  // ===== 关卡选择器 =====

  _chapterNames: {
    1: '外卖风云', 2: '草鞋争霸', 3: '直播大战', 4: '健身房保卫战', 5: '系统修复战',
    6: '社区团购风波', 7: '网约车帝国', 8: '金融风暴', 9: '元宇宙入侵', 10: 'AI觉醒',
    11: '跨境远征', 12: '暗网之战', 13: '量子纪元', 14: '时空裂缝', 15: '天命降临'
  },

  _showStagePicker: function () {
    var self = this;
    var currentStage = BattleManager.getCurrentStage();
    var currentChapter = currentStage ? currentStage.chapter : 1;

    // 按章节分组
    var chapters = {};
    for (var i = 0; i < StageData.length; i++) {
      var s = StageData[i];
      if (!chapters[s.chapter]) chapters[s.chapter] = [];
      chapters[s.chapter].push(s);
    }

    // 找出最高已解锁章节
    var maxUnlockedChapter = 1;
    var chapterKeys = Object.keys(chapters);
    for (var ci = 0; ci < chapterKeys.length; ci++) {
      var ch = parseInt(chapterKeys[ci]);
      var stages = chapters[ch];
      for (var si = 0; si < stages.length; si++) {
        if (BattleManager.isStageUnlocked(stages[si].id)) {
          maxUnlockedChapter = Math.max(maxUnlockedChapter, ch);
        }
      }
    }

    // 构建章节标签
    var html = '<div class="stage-picker">';
    html += '<div class="stage-picker-tabs">';
    for (var c = 1; c <= maxUnlockedChapter; c++) {
      if (!chapters[c]) continue;
      var isActive = c === currentChapter;
      var chName = this._chapterNames[c] || ('第' + c + '章');
      html += '<button class="stage-picker-tab' + (isActive ? ' active' : '') + '" data-chapter="' + c + '">';
      html += c + '. ' + chName;
      html += '</button>';
    }
    html += '</div>';

    // 构建关卡网格（默认显示当前章节）
    html += '<div class="stage-picker-grid" id="stage-picker-grid">';
    html += this._renderStageGrid(chapters[currentChapter], currentStage);
    html += '</div>';
    html += '</div>';

    // 缓存 chapters 数据供标签切换使用
    this._pickerChapters = chapters;

    Modal.show({
      title: UIIcons.icon('list') + ' 选择关卡',
      content: html,
      showCancel: false,
      confirmText: '关闭'
    });

    // Modal.show 是同步渲染，直接绑定
    setTimeout(function () { self._bindPickerEvents(); }, 50);
  },

  _renderStageGrid: function (stages, currentStage) {
    if (!stages) return '';
    var html = '';
    for (var i = 0; i < stages.length; i++) {
      var s = stages[i];
      var isCleared = BattleManager.isStageCleared(s.id);
      var isUnlocked = BattleManager.isStageUnlocked(s.id);
      var isCurrent = currentStage && s.id === currentStage.id;
      // 章节门禁
      var isGated = false;
      if (typeof TownManager !== 'undefined' && s.stage === 1 && s.chapter >= 2) {
        var gateCheck = TownManager.checkChapterGate(s.chapter);
        if (!gateCheck.ok) isGated = true;
      }

      var cls = 'stage-picker-item';
      if (isCurrent) cls += ' current';
      if (isCleared) cls += ' cleared';
      if (!isUnlocked || isGated) cls += ' locked';
      if (s.isBoss) cls += ' boss';

      html += '<div class="' + cls + '" data-stage-id="' + s.id + '">';
      html += '<div class="stage-picker-num">' + s.chapter + '-' + s.stage + '</div>';
      html += '<div class="stage-picker-name">' + s.name + '</div>';
      html += '<div class="stage-picker-status">';
      if (!isUnlocked || isGated) {
        html += UIIcons.icon('lock');
      } else if (isCleared) {
        html += UIIcons.icon('check');
      } else if (isCurrent) {
        html += UIIcons.icon('attack');
      } else {
        html += UIIcons.icon('battle');
      }
      html += '</div>';
      if (s.isBoss) html += '<div class="stage-picker-boss">BOSS</div>';
      html += '</div>';
    }
    return html;
  },

  _bindPickerEvents: function () {
    var self = this;
    var overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    // 章节标签切换
    var tabs = overlay.querySelectorAll('.stage-picker-tab');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function () {
        var ch = parseInt(this.getAttribute('data-chapter'));
        // 更新 active 标签
        var allTabs = overlay.querySelectorAll('.stage-picker-tab');
        for (var j = 0; j < allTabs.length; j++) allTabs[j].classList.remove('active');
        this.classList.add('active');
        // 更新网格
        var grid = overlay.querySelector('#stage-picker-grid');
        if (grid && self._pickerChapters[ch]) {
          grid.innerHTML = self._renderStageGrid(self._pickerChapters[ch], BattleManager.getCurrentStage());
          self._bindPickerStageClicks(overlay);
        }
      });
    }

    this._bindPickerStageClicks(overlay);
  },

  _bindPickerStageClicks: function (overlay) {
    var self = this;
    var items = overlay.querySelectorAll('.stage-picker-item:not(.locked)');
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function () {
        var stageId = this.getAttribute('data-stage-id');
        if (stageId) {
          BattleManager.setCurrentStage(stageId);
          self._resultOverlay = null;
          Modal.hide();
          self._render();
        }
      });
    }
  }
};
