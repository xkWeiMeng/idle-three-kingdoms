/**
 * 每日挑战面板
 */
var DailyChallengePanel = {
  _container: null,

  init: function () {
    var self = this;
    EventBus.on('daily:started', function () { self._render(); });
    EventBus.on('daily:tick', function () { self._renderBattle(); });
    EventBus.on('daily:ended', function (data) { self._renderEnd(data); });
  },

  show: function () {
    var self = this;
    var html = this._buildHTML();
    OverlayPanel.show({
      title: '📅 每日挑战',
      content: html,
      panelId: 'daily-challenge',
      height: 'full',
      onClose: function () { self._container = null; }
    });
    this._container = document.querySelector('.overlay-panel-body');
    this._bindEvents();
  },

  _buildHTML: function () {
    var state = DailyChallengeManager.getState();
    var attemptsLeft = DailyChallengeManager.getAttemptsLeft();
    var battle = DailyChallengeManager._state.currentBattle;
    var html = '';

    // 头部
    html += '<div class="dc-header">';
    html += '<div class="dc-date">📅 ' + (state.lastDate || '---') + '</div>';
    html += '<div class="dc-attempts">剩余次数: <b>' + attemptsLeft + '</b>/3</div>';
    html += '</div>';
    html += '<div class="dc-stats">';
    html += '<span>🏆 今日最高: ' + state.bestScore + '</span>';
    html += '<span>📊 累计天数: ' + state.totalDays + '</span>';
    html += '</div>';

    if (battle && battle.phase === 'fighting') {
      html += this._renderBattleView(battle);
    } else {
      html += '<div class="dc-start-area">';
      html += '<div style="font-size:2rem;margin-bottom:8px;">⚔️</div>';
      html += '<div style="margin-bottom:12px;color:var(--color-text-dim);font-size:0.8rem;">';
      html += '每日固定挑战，所有玩家面对相同敌人<br>3次机会，难度递增，奖励丰厚</div>';
      if (attemptsLeft > 0) {
        html += '<button class="btn dc-btn-start" style="width:100%;padding:12px;font-size:1rem;">⚔️ 开始挑战 (第' + (4 - attemptsLeft) + '次)</button>';
      } else {
        html += '<div style="color:var(--color-text-dim);font-size:0.9rem;">今日次数已用完，明天再来！</div>';
      }
      html += '</div>';
    }

    return html;
  },

  _renderBattleView: function (b) {
    var html = '<div class="dc-battle">';
    html += '<div class="dc-round">第 ' + b.round + ' 回合 (第' + b.attempt + '次挑战)</div>';

    // 友军
    html += '<div class="rl-team-row">';
    for (var i = 0; i < b.allies.length; i++) {
      html += this._renderUnit(b.allies[i]);
    }
    html += '</div>';
    html += '<div class="rl-vs">⚔️</div>';
    html += '<div class="rl-team-row">';
    for (var j = 0; j < b.enemies.length; j++) {
      html += this._renderUnit(b.enemies[j]);
    }
    html += '</div>';
    html += '</div>';
    return html;
  },

  _renderUnit: function (unit) {
    var hpPct = unit.maxHp > 0 ? Math.floor(unit.currentHp / unit.maxHp * 100) : 0;
    var dead = !unit.isAlive;
    var html = '<div class="rl-unit' + (dead ? ' rl-dead' : '') + '">';
    html += '<div class="rl-unit-emoji">' + (unit.emoji || '❓') + '</div>';
    html += '<div class="rl-unit-hp-bar"><div class="rl-unit-hp-fill' + (unit.isAlly ? '' : ' enemy') + '" style="width:' + hpPct + '%"></div></div>';
    html += '<div class="rl-unit-name">' + unit.name + '</div>';
    html += '</div>';
    return html;
  },

  _renderBattle: function () {
    if (!this._container) return;
    var b = DailyChallengeManager._state.currentBattle;
    if (!b || b.phase !== 'fighting') return;

    // 更新HP bars
    var unitEls = this._container.querySelectorAll('.rl-unit');
    var allUnits = b.allies.concat(b.enemies);
    for (var i = 0; i < unitEls.length && i < allUnits.length; i++) {
      var u = allUnits[i];
      var hpPct = u.maxHp > 0 ? Math.floor(u.currentHp / u.maxHp * 100) : 0;
      var fill = unitEls[i].querySelector('.rl-unit-hp-fill');
      if (fill) fill.style.width = hpPct + '%';
      if (!u.isAlive) unitEls[i].classList.add('rl-dead');
    }

    // 更新回合数
    var roundEl = this._container.querySelector('.dc-round');
    if (roundEl) roundEl.textContent = '第 ' + b.round + ' 回合 (第' + b.attempt + '次挑战)';
  },

  _renderEnd: function (data) {
    if (!this._container) return;
    var html = '<div class="dc-end-screen">';
    html += '<div style="font-size:2rem;margin-bottom:8px;">' + (data.victory ? '🎉' : '💀') + '</div>';
    html += '<div class="dc-round">' + (data.victory ? '挑战成功！' : '挑战失败') + '</div>';
    html += '<div style="font-size:0.9rem;margin:8px 0;">得分: <b style="color:var(--color-gold);">' + data.score + '</b></div>';
    html += '<div class="rl-rewards">';
    html += '<div>💰 +' + data.rewards.gold + '</div>';
    html += '<div>⭐ +' + data.rewards.exp + '</div>';
    if (data.rewards.jade > 0) html += '<div>💎 +' + data.rewards.jade + '</div>';
    html += '</div>';

    var attemptsLeft = DailyChallengeManager.getAttemptsLeft();
    if (attemptsLeft > 0) {
      html += '<button class="btn dc-btn-start" style="width:100%;margin-top:12px;padding:12px;font-size:1rem;">⚔️ 再次挑战 (剩余' + attemptsLeft + '次)</button>';
    } else {
      html += '<div style="margin-top:12px;color:var(--color-text-dim);">今日次数已用完，明天再来！</div>';
    }
    html += '</div>';
    this._container.innerHTML = html;
    this._bindEvents();
  },

  _bindEvents: function () {
    if (!this._container) return;
    var self = this;
    var startBtn = this._container.querySelector('.dc-btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        DailyChallengeManager.startChallenge();
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
