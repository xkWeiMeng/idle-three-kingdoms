/**
 * 无尽试炼面板 — Roguelike 模式 UI
 */
var RoguelikePanel = {
  _container: null,

  init: function () {
    var self = this;
    EventBus.on('roguelike:floor_start', function () { self._render(); });
    EventBus.on('roguelike:tick', function () { self._renderBattle(); });
    EventBus.on('roguelike:choose_buff', function () { self._render(); });
    EventBus.on('roguelike:run_ended', function (data) { self._renderEnd(data); });
  },

  show: function () {
    var self = this;
    var html = this._buildHTML();
    OverlayPanel.show({
      title: '🏯 无尽试炼',
      content: html,
      panelId: 'roguelike',
      height: 'full',
      onClose: function () { self._container = null; }
    });
    this._container = document.querySelector('.overlay-panel-body');
    this._bindEvents();
  },

  _buildHTML: function () {
    if (!RoguelikeManager.isUnlocked()) {
      return '<div style="text-align:center;padding:40px 20px;color:var(--color-text-dim);">' +
        '<div style="font-size:2rem;margin-bottom:12px;">🔒</div>' +
        '<div>通关 第三章第一关 后解锁</div></div>';
    }

    var state = RoguelikeManager.getState();
    var run = state.currentRun;
    var html = '';

    // 头部信息
    html += '<div class="rl-header">';
    html += '<div class="rl-best">🏆 最高层: <b>' + state.bestFloor + '</b></div>';
    html += '<div class="rl-runs">挑战次数: ' + state.totalRuns + '</div>';
    html += '</div>';

    if (!run) {
      // 未开始
      html += '<div class="rl-start-area">';
      html += '<div style="font-size:1.5rem;margin-bottom:8px;">⚔️</div>';
      html += '<div style="margin-bottom:12px;color:var(--color-text-dim);font-size:0.8rem;">使用当前队伍挑战无尽试炼<br>HP在层间保留，每5层选择增益<br>队伍全灭则结算</div>';
      html += '<button class="btn rl-btn-start" style="width:100%;padding:12px;font-size:1rem;">🏯 开始试炼</button>';
      html += '</div>';
    } else if (run.phase === 'choosing') {
      html += this._renderChoosing(run);
    } else if (run.phase === 'ended') {
      html += '<div class="rl-start-area">';
      html += '<div style="font-size:1.5rem;margin-bottom:8px;">⚔️</div>';
      html += '<div style="margin-bottom:12px;color:var(--color-text-dim);font-size:0.8rem;">上次到达第 ' + run.floor + ' 层</div>';
      html += '<button class="btn rl-btn-start" style="width:100%;padding:12px;font-size:1rem;">🏯 再次挑战</button>';
      html += '</div>';
    } else {
      html += this._renderBattleView(run);
    }

    return html;
  },

  _renderChoosing: function (run) {
    var html = '<div class="rl-choosing">';
    html += '<div class="rl-floor-label">第 ' + run.floor + ' 层 — 选择增益</div>';
    html += '<div class="rl-choices">';
    for (var i = 0; i < run.choices.length; i++) {
      var c = run.choices[i];
      html += '<div class="rl-choice-card" data-buff-id="' + c.id + '">';
      html += '<div class="rl-choice-icon">' + c.icon + '</div>';
      html += '<div class="rl-choice-name">' + c.name + '</div>';
      html += '<div class="rl-choice-desc">' + c.desc + '</div>';
      html += '</div>';
    }
    html += '</div>';

    // 当前增益列表
    if (run.buffs.length > 0) {
      html += '<div class="rl-buffs-summary">已获增益: ';
      for (var b = 0; b < run.buffs.length; b++) {
        for (var p = 0; p < RoguelikeManager._buffPool.length; p++) {
          if (RoguelikeManager._buffPool[p].id === run.buffs[b]) {
            html += RoguelikeManager._buffPool[p].icon + ' ';
            break;
          }
        }
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  },

  _renderBattleView: function (run) {
    var html = '<div class="rl-battle">';
    html += '<div class="rl-floor-label">🏯 第 ' + run.floor + ' 层</div>';

    // 友军
    html += '<div class="rl-team-row">';
    for (var i = 0; i < run.allies.length; i++) {
      html += this._renderUnit(run.allies[i], true);
    }
    html += '</div>';

    html += '<div class="rl-vs">⚔️</div>';

    // 敌军
    html += '<div class="rl-team-row">';
    if (run.enemies) {
      for (var j = 0; j < run.enemies.length; j++) {
        html += this._renderUnit(run.enemies[j], false);
      }
    }
    html += '</div>';

    // 已获增益
    if (run.buffs.length > 0) {
      html += '<div class="rl-buffs-summary">增益: ';
      for (var b = 0; b < run.buffs.length; b++) {
        for (var p = 0; p < RoguelikeManager._buffPool.length; p++) {
          if (RoguelikeManager._buffPool[p].id === run.buffs[b]) {
            html += RoguelikeManager._buffPool[p].icon + ' ';
            break;
          }
        }
      }
      html += '</div>';
    }

    // 终极技能栏
    html += '<div class="rl-ult-bar" id="rl-ult-bar"></div>';

    // 放弃按钮
    html += '<button class="btn rl-btn-abandon" style="width:100%;margin-top:8px;background:var(--color-danger);padding:8px;font-size:0.8rem;">🏳️ 放弃试炼</button>';
    html += '</div>';
    return html;
  },

  _renderUnit: function (unit, isAlly) {
    var hpPct = unit.maxHp > 0 ? Math.floor(unit.currentHp / unit.maxHp * 100) : 0;
    var dead = !unit.isAlive;
    var html = '<div class="rl-unit' + (dead ? ' rl-dead' : '') + '">';
    html += '<div class="rl-unit-emoji">' + (unit.emoji || '❓') + '</div>';
    html += '<div class="rl-unit-hp-bar"><div class="rl-unit-hp-fill' + (isAlly ? '' : ' enemy') + '" style="width:' + hpPct + '%"></div></div>';
    html += '<div class="rl-unit-name">' + unit.name + '</div>';
    html += '</div>';
    return html;
  },

  _renderBattle: function () {
    if (!this._container) return;
    var run = RoguelikeManager.getCurrentRun();
    if (!run || run.phase !== 'fighting') return;

    // 更新单位HP
    var unitEls = this._container.querySelectorAll('.rl-unit');
    var allUnits = run.allies.concat(run.enemies || []);
    for (var i = 0; i < unitEls.length && i < allUnits.length; i++) {
      var u = allUnits[i];
      var hpPct = u.maxHp > 0 ? Math.floor(u.currentHp / u.maxHp * 100) : 0;
      var fill = unitEls[i].querySelector('.rl-unit-hp-fill');
      if (fill) fill.style.width = hpPct + '%';
      if (!u.isAlive) unitEls[i].classList.add('rl-dead');
    }

    // 更新终极技能栏
    var ultBar = this._container.querySelector('#rl-ult-bar');
    if (ultBar) {
      var ultHtml = '';
      for (var a = 0; a < run.allies.length; a++) {
        var ally = run.allies[a];
        if (!ally.ultimate || !ally.isAlive) continue;
        var epct = Math.floor((ally.energy / ally.energyMax) * 100);
        var ready = ally.ultimateReady;
        ultHtml += '<div class="ult-slot' + (ready ? ' ult-ready' : '') + '" data-uid="' + ally.uid + '">';
        ultHtml += '<div class="ult-icon">' + (ally.ultimate.icon || UIIcons.icon('flame')) + '</div>';
        ultHtml += '<div class="ult-energy-track"><div class="ult-energy-fill" style="width:' + epct + '%"></div></div>';
        ultHtml += '<div class="ult-name">' + ally.name + '</div>';
        ultHtml += '</div>';
      }
      ultBar.innerHTML = ultHtml;
      // bind ult clicks
      var slots = ultBar.querySelectorAll('.ult-slot.ult-ready');
      for (var s = 0; s < slots.length; s++) {
        slots[s].addEventListener('click', (function (uid) {
          return function () { RoguelikeManager.triggerUltimate(uid); };
        })(slots[s].getAttribute('data-uid')));
      }
    }
  },

  _renderEnd: function (data) {
    if (!this._container) return;
    var html = '<div class="rl-end-screen">';
    html += '<div style="font-size:2rem;margin-bottom:8px;">💀</div>';
    html += '<div class="rl-floor-label">试炼结束 — 到达第 ' + data.floor + ' 层</div>';
    html += '<div class="rl-best" style="margin:8px 0;">🏆 历史最高: ' + data.bestFloor + '</div>';
    html += '<div class="rl-rewards">';
    html += '<div>💰 金币 +' + data.rewards.gold + '</div>';
    html += '<div>⭐ 经验 +' + data.rewards.exp + '</div>';
    if (data.rewards.jade > 0) html += '<div>💎 玉璧 +' + data.rewards.jade + '</div>';
    html += '</div>';
    html += '<button class="btn rl-btn-start" style="width:100%;margin-top:12px;padding:12px;font-size:1rem;">🏯 再次挑战</button>';
    html += '</div>';
    this._container.innerHTML = html;
    this._bindEvents();
  },

  _bindEvents: function () {
    if (!this._container) return;
    var self = this;

    // Start button
    var startBtn = this._container.querySelector('.rl-btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        RoguelikeManager.startRun();
        self._render();
      });
    }

    // Abandon
    var abandonBtn = this._container.querySelector('.rl-btn-abandon');
    if (abandonBtn) {
      abandonBtn.addEventListener('click', function () {
        RoguelikeManager.abandonRun();
      });
    }

    // Buff choices
    var cards = this._container.querySelectorAll('.rl-choice-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('click', function () {
        var buffId = this.getAttribute('data-buff-id');
        RoguelikeManager.chooseBuff(buffId);
        self._render();
      });
    }
  },

  _render: function () {
    if (!this._container) return;
    this._container.innerHTML = this._buildHTML();
    this._bindEvents();
  }
};
