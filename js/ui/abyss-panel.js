/**
 * 深渊面板 UI —— 深渊副本挑战
 * 包含：粒子爆落系统、装备揭示动画、结算状态机、连续刷本
 */
var AbyssPanel = {
  _qualityColors: { 1:'#b0a898', 2:'#5d8a48', 3:'#4a7fb5', 4:'#8b5ea8', 5:'#d4a849', 6:'#ff2222' },
  _qualityNames: { 1:'普通', 2:'优秀', 3:'稀有', 4:'史诗', 5:'传说', 6:'神话' },

  _settlement: {
    phase: null,
    startTime: 0,
    skipped: false,
    run: null,
    abyssId: null,
    countUpRafId: null,
    phaseTimers: []
  },

  /* ============================
   * Loot Particles System
   * ============================ */
  _LootParticles: {
    _container: null,
    _particles: [],
    _rafId: null,
    _startTime: 0,
    _onComplete: null,
    DURATION: 2000,

    start: function (rewards, containerEl, onComplete) {
      this.stop();
      this._onComplete = onComplete;

      var container = document.createElement('div');
      container.className = 'loot-particle-container';
      containerEl.appendChild(container);
      this._container = container;

      var counts = this._calcCounts(rewards);
      var particles = [];
      var types = [
        { emoji: UIIcons.icon('gold'), count: counts.gold },
        { emoji: UIIcons.icon('exp'), count: counts.exp },
        { emoji: UIIcons.icon('iron'), count: counts.iron },
        { emoji: UIIcons.icon('jade'), count: counts.jade }
      ];

      var cx = container.offsetWidth / 2 || 180;
      var cy = container.offsetHeight / 2 || 200;

      for (var t = 0; t < types.length; t++) {
        for (var p = 0; p < types[t].count; p++) {
          var angle = Math.random() * Math.PI * 2;
          var speed = 200 + Math.random() * 200;
          var el = document.createElement('span');
          el.className = 'loot-particle';
          el.innerHTML = types[t].emoji;
          el.style.fontSize = (16 + Math.random() * 8) + 'px';
          el.style.left = cx + 'px';
          el.style.top = cy + 'px';
          container.appendChild(el);
          particles.push({
            el: el,
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed * -0.8,
            phase: 0
          });
        }
      }
      this._particles = particles;
      this._startTime = performance.now();
      this._rafId = requestAnimationFrame(this._tick.bind(this));
    },

    _calcCounts: function (r) {
      var g = r.gold > 0 ? Math.max(3, Math.min(30, Math.floor(r.gold / 500))) : 0;
      var e = r.exp > 0 ? Math.max(2, Math.min(15, Math.floor(r.exp / 500))) : 0;
      var i = r.iron > 0 ? Math.max(1, Math.min(10, Math.floor(r.iron / 50))) : 0;
      var j = r.jade > 0 ? Math.max(1, Math.min(8, Math.floor(r.jade / 5))) : 0;
      var total = g + e + i + j;
      if (total > 60) {
        var ratio = 60 / total;
        g = Math.max(1, Math.floor(g * ratio));
        e = Math.max(1, Math.floor(e * ratio));
        i = Math.max(1, Math.floor(i * ratio));
        j = Math.max(1, Math.floor(j * ratio));
      }
      return { gold: g, exp: e, iron: i, jade: j };
    },

    _tick: function (now) {
      if (!this._container || !this._container.parentNode) {
        this.stop();
        return;
      }
      var elapsed = now - this._startTime;
      var gravity = 300;

      for (var i = 0; i < this._particles.length; i++) {
        var p = this._particles[i];
        var dt = elapsed / 1000;

        // Position: initial + velocity*t + 0.5*gravity*t^2
        var x = p.x + p.vx * dt + Math.sin(dt * Math.PI * 4) * 10;
        var y = p.y + p.vy * dt + 0.5 * gravity * dt * dt;

        // Opacity: fade out in last 600ms
        var opacity = 1;
        if (elapsed > 1400) {
          opacity = Math.max(0, 1 - (elapsed - 1400) / 600);
        }

        p.el.style.transform = 'translate(' + (x - p.x) + 'px,' + (y - p.y) + 'px)';
        p.el.style.opacity = opacity;
      }

      if (elapsed >= this.DURATION) {
        var cb = this._onComplete;
        this.stop();
        if (cb) cb();
      } else {
        this._rafId = requestAnimationFrame(this._tick.bind(this));
      }
    },

    stop: function () {
      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
      if (this._container && this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
      this._container = null;
      this._particles = [];
      this._onComplete = null;
    }
  },

  /* ============================
   * Equipment Reveal System
   * ============================ */
  _EquipReveal: {
    _container: null,
    _cards: [],
    _timers: [],
    _onComplete: null,

    start: function (equipments, containerEl, onComplete) {
      this.stop();
      this._onComplete = onComplete;
      this._container = containerEl;

      if (!equipments || equipments.length === 0) {
        if (onComplete) onComplete();
        return;
      }

      // Sort by quality ascending (lowest first, highest last)
      var sorted = equipments.slice().sort(function (a, b) { return a.quality - b.quality; });

      // Create card DOM
      for (var i = 0; i < sorted.length; i++) {
        var eq = sorted[i];
        var card = this._createCard(eq);
        containerEl.appendChild(card.el);
        this._cards.push({ el: card.el, inner: card.inner, equip: eq, revealed: false });
      }

      // Schedule reveals
      var self = this;
      var baseDelay = 0;
      for (var c = 0; c < this._cards.length; c++) {
        (function (idx, delay) {
          var card = self._cards[idx];
          var eq = card.equip;
          var extraDelay = 0;
          if (eq.quality === 5) extraDelay = 300;
          else if (eq.quality === 6) extraDelay = 1000;
          var totalDelay = delay + extraDelay;

          var tid = setTimeout(function () {
            self._revealCard(idx);
          }, totalDelay);
          self._timers.push(tid);
        })(c, baseDelay);
        baseDelay += 400;
      }

      // Schedule completion
      var lastEq = sorted[sorted.length - 1];
      var finalDelay = baseDelay - 400; // last card base
      if (lastEq.quality === 5) finalDelay += 300;
      else if (lastEq.quality === 6) finalDelay += 1000 + 800 + 400; // mythic flash+shake
      finalDelay += 800; // flip animation time + buffer

      var completeTid = setTimeout(function () {
        if (self._onComplete) self._onComplete();
      }, finalDelay);
      this._timers.push(completeTid);
    },

    _createCard: function (eq) {
      var qualityClass = '';
      if (eq.quality === 4) qualityClass = 'equip-reveal-card--epic';
      else if (eq.quality === 5) qualityClass = 'equip-reveal-card--legendary';
      else if (eq.quality >= 6) qualityClass = 'equip-reveal-card--mythic';

      var card = document.createElement('div');
      card.className = 'equip-reveal-card ' + qualityClass;

      var inner = document.createElement('div');
      inner.className = 'equip-reveal-card__inner';

      var back = document.createElement('div');
      back.className = 'equip-reveal-card__back';

      var front = document.createElement('div');
      front.className = 'equip-reveal-card__front';

      var statStr = '';
      if (eq.stats) {
        var keys = Object.keys(eq.stats);
        for (var s = 0; s < keys.length; s++) {
          statStr += keys[s] + '+' + eq.stats[keys[s]] + ' ';
        }
      }

      front.innerHTML = '<span class="eq-emoji">' + (eq.emoji || UIIcons.icon('weapon')) + '</span>'
        + '<span class="eq-name" style="color:' + (AbyssPanel._qualityColors[eq.quality] || '#aaa') + ';">' + eq.name + '</span>'
        + '<span class="eq-stat">' + statStr.trim() + '</span>';

      inner.appendChild(back);
      inner.appendChild(front);
      card.appendChild(inner);

      return { el: card, inner: inner };
    },

    _revealCard: function (idx) {
      var card = this._cards[idx];
      if (!card || card.revealed) return;
      var eq = card.equip;

      // Mythic: flash + shake before flip
      if (eq.quality >= 6 && this._container) {
        var flash = document.createElement('div');
        flash.className = 'equip-mythic-flash';
        this._container.parentNode.appendChild(flash);
        var shakeTarget = this._container.parentNode;
        shakeTarget.style.animation = 'shake 0.1s ease 4';

        var self = this;
        var cleanTid = setTimeout(function () {
          if (flash.parentNode) flash.parentNode.removeChild(flash);
          shakeTarget.style.animation = '';
          card.inner.classList.add('flipped');
          card.revealed = true;
          EventBus.emit('abyss:equip_reveal', { equipment: eq, quality: eq.quality });
        }, 1200);
        this._timers.push(cleanTid);
        return;
      }

      // Legendary: light pillar
      if (eq.quality === 5) {
        var pillar = document.createElement('div');
        pillar.className = 'equip-light-pillar';
        card.el.style.position = 'relative';
        card.el.appendChild(pillar);
        var pTid = setTimeout(function () {
          if (pillar.parentNode) pillar.parentNode.removeChild(pillar);
        }, 1100);
        this._timers.push(pTid);
      }

      card.inner.classList.add('flipped');
      card.revealed = true;
      EventBus.emit('abyss:equip_reveal', { equipment: eq, quality: eq.quality });
    },

    skip: function () {
      for (var t = 0; t < this._timers.length; t++) clearTimeout(this._timers[t]);
      this._timers = [];
      for (var c = 0; c < this._cards.length; c++) {
        if (!this._cards[c].revealed) {
          this._cards[c].inner.classList.add('flipped');
          this._cards[c].revealed = true;
        }
      }
      // Remove any flash/pillar effects
      if (this._container) {
        var flashes = this._container.parentNode.querySelectorAll('.equip-mythic-flash');
        for (var f = 0; f < flashes.length; f++) { if (flashes[f].parentNode) flashes[f].parentNode.removeChild(flashes[f]); }
        var pillars = this._container.querySelectorAll('.equip-light-pillar');
        for (var p = 0; p < pillars.length; p++) { if (pillars[p].parentNode) pillars[p].parentNode.removeChild(pillars[p]); }
      }
    },

    stop: function () {
      this.skip();
      this._cards = [];
      this._container = null;
      this._onComplete = null;
    }
  },

  /* ============================
   * Init & Event Binding
   * ============================ */
  init: function () {
    var self = this;
    EventBus.on('abyss:entered', this._onUpdate.bind(this));
    EventBus.on('abyss:floor_cleared', this._onUpdate.bind(this));
    EventBus.on('abyss:completed', this._onSettlementTrigger.bind(this));
    EventBus.on('abyss:failed', this._onSettlementTrigger.bind(this));
    EventBus.on('overlay:closed', function (closedId) {
      if (closedId === 'abyss') {
        self._cleanupSettlement();
      }
    });
  },

  _onUpdate: function () {
    var el = document.getElementById('abyss-panel-content');
    if (el) this.show();
  },

  _onSettlementTrigger: function () {
    var el = document.getElementById('abyss-panel-content');
    if (!el) return;
    var run = AbyssManager.getCurrentRun();
    if (!run) return;
    // Start settlement animation
    this._settlement.phase = 'title';
    this._settlement.run = run;
    this._settlement.abyssId = run.abyssId;
    this._settlement.skipped = false;
    this._settlement.startTime = performance.now();
    this.show();
  },

  show: function () {
    var html = this._render();
    OverlayPanel.show({
      title: UIIcons.icon('abyss') + ' 深渊挑战',
      content: html,
      panelId: 'abyss',
      height: 'full'
    });
    this._bindEvents();
  },

  _render: function () {
    var currentRun = AbyssManager.getCurrentRun();
    var html = '<div id="abyss-panel-content">';

    if (currentRun) {
      if (currentRun.phase === 'complete' || currentRun.phase === 'defeat') {
        html += this._renderSettlement(currentRun);
      } else {
        html += this._renderActiveRun(currentRun);
      }
    } else {
      html += this._renderAbyssList();
    }

    html += '</div>';
    return html;
  },

  _renderActiveRun: function (run) {
    var abyss = AbyssData[run.abyssId];
    var html = '';

    var theme = abyss.theme || {};
    var bgGrad = theme.bgGradient || 'linear-gradient(180deg, #1a0a2e, #0d0d0d)';
    html += '<div style="background:' + bgGrad + ';border-radius:8px;padding:12px;margin-bottom:8px;">';
    html += '<div style="text-align:center;">';
    html += '<div style="font-size:1.1rem;font-weight:bold;color:' + (theme.bossFrameColor || '#fff') + ';">';
    html += abyss.name + ' · 第 ' + run.currentFloor + '/' + abyss.floors.length + ' 层</div>';
    html += '<div style="font-size:0.78rem;color:var(--color-text-dim);margin-top:2px;">回合 ' + run.round + '</div>';
    html += '</div>';

    if (run.enemies.length > 0) {
      var boss = run.enemies[0];
      var bossHpPct = boss.maxHp > 0 ? (boss.currentHp / boss.maxHp * 100) : 0;
      html += '<div style="margin-top:8px;padding:8px;background:rgba(0,0,0,0.3);border-radius:6px;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<span style="font-weight:bold;color:' + (theme.bossFrameColor || '#ff4444') + ';">' + boss.name + '</span>';
      html += '<span style="font-size:0.72rem;color:var(--color-text-dim);">' + boss.currentHp + '/' + boss.maxHp + '</span>';
      html += '</div>';
      html += '<div style="height:8px;background:#333;border-radius:4px;margin-top:4px;">';
      html += '<div style="height:100%;width:' + bossHpPct.toFixed(1) + '%;background:' + (theme.bossFrameColor || '#ff4444') + ';border-radius:4px;transition:width 0.3s;"></div>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="card" style="padding:8px;">';
    html += '<div style="font-size:0.8rem;font-weight:bold;margin-bottom:4px;">队伍状态</div>';
    for (var a = 0; a < run.allies.length; a++) {
      var ally = run.allies[a];
      var aHpPct = ally.maxHp > 0 ? (ally.currentHp / ally.maxHp * 100) : 0;
      var deadStyle = ally.isAlive ? '' : 'opacity:0.4;';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;' + deadStyle + '">';
      html += '<span style="font-size:0.85rem;width:24px;">' + (ally.emoji || UIIcons.icon('attack')) + '</span>';
      html += '<span style="font-size:0.78rem;width:50px;">' + ally.name + '</span>';
      html += '<div style="flex:1;height:5px;background:#333;border-radius:2px;">';
      html += '<div style="height:100%;width:' + aHpPct.toFixed(1) + '%;background:var(--color-success);border-radius:2px;"></div>';
      html += '</div>';
      html += '<span style="font-size:0.65rem;color:var(--color-text-dim);width:35px;text-align:right;">';
      html += (ally.isAlive ? Math.ceil(aHpPct) + '%' : UIIcons.icon('defeat')) + '</span>';
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="card" style="max-height:180px;overflow-y:auto;padding:8px;">';
    html += '<div style="font-size:0.8rem;font-weight:bold;margin-bottom:4px;">战斗日志</div>';
    var log = run.log;
    var startIdx = Math.max(0, log.length - 20);
    for (var l = startIdx; l < log.length; l++) {
      html += '<div style="font-size:0.68rem;color:var(--color-text-dim);margin-bottom:1px;">' + log[l] + '</div>';
    }
    html += '</div>';

    return html;
  },

  /* ============================
   * Settlement Rendering
   * ============================ */
  _renderSettlement: function (run) {
    var isVictory = run.phase === 'complete';
    var shouldAnimate = this._settlement.phase === 'title';

    // If panel was closed and reopened, or settlement already completed → show summary directly
    if (!shouldAnimate) {
      return this._renderSummary(run, isVictory);
    }

    // Build settlement skeleton for animated fill
    var html = '<div class="abyss-settlement" id="abyss-settlement">';
    html += '<button class="abyss-settlement__skip" id="abyss-skip">\u8df3\u8fc7 \u23e9</button>';

    // Title area
    html += '<div class="abyss-settlement__title" id="abyss-stitle" style="opacity:0;">';
    if (isVictory) {
      html += '<div style="color:var(--color-success);">' + UIIcons.icon('victory') + ' 通关成功！</div>';
    } else {
      html += '<div style="color:var(--color-danger);">' + UIIcons.icon('defeat') + ' 挑战失败</div>';
      html += '<div style="font-size:0.78rem;color:var(--color-text-dim);margin-top:4px;">止步于第 ' + run.currentFloor + ' 层</div>';
    }
    html += '</div>';

    // Particle zone
    html += '<div id="abyss-particle-zone" style="position:relative;min-height:120px;"></div>';

    // Resources area
    html += '<div class="abyss-settlement__resources" id="abyss-resources" style="display:none;"></div>';

    // Equipment reveal area
    html += '<div class="abyss-settlement__equips" id="abyss-equip-reveal" style="display:none;"></div>';

    // Summary area (hidden initially)
    html += '<div id="abyss-summary-area" style="display:none;">';
    html += this._renderSummaryContent(run, isVictory);
    html += '</div>';

    html += '</div>';
    return html;
  },

  _renderSummary: function (run, isVictory) {
    var html = '<div class="abyss-settlement">';
    html += '<div class="abyss-settlement__title">';
    if (isVictory) {
      html += '<div style="color:var(--color-success);">' + UIIcons.icon('victory') + ' 通关成功！</div>';
    } else {
      html += '<div style="color:var(--color-danger);">' + UIIcons.icon('defeat') + ' 挑战失败</div>';
      html += '<div style="font-size:0.78rem;color:var(--color-text-dim);margin-top:4px;">止步于第 ' + run.currentFloor + ' 层</div>';
    }
    html += '</div>';
    html += this._renderSummaryContent(run, isVictory);
    html += '</div>';
    return html;
  },

  _renderSummaryContent: function (run, isVictory) {
    var r = run.rewards;
    var html = '';

    // Resources summary
    html += '<div class="abyss-settlement__summary">';
    html += '<div style="font-size:0.8rem;font-weight:bold;margin-bottom:6px;text-align:center;">═══ 战利品总结 ═══</div>';
    if (r.gold) html += '<div class="res-row"><span>' + UIIcons.icon('gold') + ' 金币</span><span class="res-value">' + Utils.formatNumber(r.gold) + '</span></div>';
    if (r.exp) html += '<div class="res-row"><span>' + UIIcons.icon('exp') + ' 经验</span><span class="res-value">' + Utils.formatNumber(r.exp) + '</span></div>';
    if (r.iron) html += '<div class="res-row"><span>' + UIIcons.icon('iron') + ' 铁矿</span><span class="res-value">' + r.iron + '</span></div>';
    if (r.jade) html += '<div class="res-row"><span>' + UIIcons.icon('jade') + ' 玉璧</span><span class="res-value">' + r.jade + '</span></div>';

    // Equipment list (all qualities)
    if (run.droppedEquipment && run.droppedEquipment.length > 0) {
      html += '<div style="font-size:0.8rem;font-weight:bold;margin:8px 0 4px;text-align:center;">── 装备 ──</div>';
      for (var d = 0; d < run.droppedEquipment.length; d++) {
        var eq = run.droppedEquipment[d];
        var col = this._qualityColors[eq.quality] || '#aaa';
        var qName = this._qualityNames[eq.quality] || '';
        html += '<div style="font-size:0.78rem;color:' + col + ';">' + (eq.emoji || UIIcons.icon('weapon')) + ' ' + eq.name;
        if (eq.quality >= 6) html += '（' + qName + '）';
        html += '</div>';
      }
    }
    html += '</div>';

    // Action buttons
    var abyss = AbyssData[run.abyssId];
    var cost = abyss ? abyss.ticketCost : {};
    var costParts = [];
    if (cost.jade) costParts.push(UIIcons.icon('jade') + cost.jade);
    if (cost.gold) costParts.push(UIIcons.icon('gold') + Utils.formatNumber(cost.gold));
    if (cost.iron) costParts.push(UIIcons.icon('iron') + cost.iron);

    var canAfford = true;
    if (cost.jade && typeof ResourceManager !== 'undefined' && !ResourceManager.canAfford('jade', cost.jade)) canAfford = false;
    if (cost.gold && typeof ResourceManager !== 'undefined' && !ResourceManager.canAfford('gold', cost.gold)) canAfford = false;
    if (cost.iron && typeof ResourceManager !== 'undefined' && !ResourceManager.canAfford('iron', cost.iron)) canAfford = false;

    html += '<div class="abyss-settlement__actions">';
    html += '<button class="btn abyss-retry" data-abyss-id="' + run.abyssId + '" style="' + (canAfford ? '' : 'opacity:0.5;') + '">';
    html += UIIcons.icon('battle') + ' 再次挑战<div class="abyss-retry-cost">' + costParts.join(' ') + '</div></button>';
    html += '<button class="btn abyss-leave" style="background:var(--color-secondary);">离开</button>';
    html += '</div>';

    return html;
  },

  /* ============================
   * Settlement Animation Engine
   * ============================ */
  _startSettlementAnimation: function () {
    var self = this;
    var run = this._settlement.run || AbyssManager.getCurrentRun();
    if (!run) return;

    // prefers-reduced-motion: skip all animations, go direct to summary
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this._settlement.skipped = true;
      var summaryArea = document.getElementById('abyss-summary-area');
      var stitle = document.getElementById('abyss-stitle');
      if (stitle) stitle.style.opacity = '1';
      var resEl = document.getElementById('abyss-resources');
      if (resEl) { this._populateResourcesFinal(run, resEl); resEl.style.display = ''; }
      this._showFinalSummary(summaryArea);
      return;
    }

    var stitle = document.getElementById('abyss-stitle');
    var particleZone = document.getElementById('abyss-particle-zone');
    var resourcesEl = document.getElementById('abyss-resources');
    var equipRevealEl = document.getElementById('abyss-equip-reveal');
    var summaryArea = document.getElementById('abyss-summary-area');

    if (!stitle) return; // DOM not ready

    // Phase 1: Title (0–500ms)
    stitle.style.opacity = '1';
    stitle.style.animation = 'slideUp 0.3s ease';

    // Phase 2: Particles (500ms)
    var t2 = setTimeout(function () {
      if (self._settlement.skipped) return;
      self._settlement.phase = 'particles';
      EventBus.emit('abyss:loot_explosion_start', { abyssId: run.abyssId, floor: run.currentFloor, rewards: run.rewards });
      self._LootParticles.start(run.rewards, particleZone, function () {
        EventBus.emit('abyss:loot_explosion_end', { abyssId: run.abyssId });
        // Phase 3: CountUp
        self._startCountUp(run, resourcesEl, function () {
          // Phase 4: Equipment reveal
          self._startEquipReveal(run, equipRevealEl, function () {
            // Phase 5: Summary
            self._showFinalSummary(summaryArea);
          });
        });
      });
    }, 500);
    this._settlement.phaseTimers.push(t2);
  },

  _startCountUp: function (run, resourcesEl, onComplete) {
    if (this._settlement.skipped) { if (onComplete) onComplete(); return; }
    this._settlement.phase = 'countup';
    var r = run.rewards;
    var items = [];
    if (r.gold) items.push({ emoji: UIIcons.icon('gold'), label: '金币', value: r.gold, format: true });
    if (r.exp) items.push({ emoji: UIIcons.icon('exp'), label: '经验', value: r.exp, format: true });
    if (r.iron) items.push({ emoji: UIIcons.icon('iron'), label: '铁矿', value: r.iron, format: false });
    if (r.jade) items.push({ emoji: UIIcons.icon('jade'), label: '玉璧', value: r.jade, format: false });

    if (items.length === 0) { if (onComplete) onComplete(); return; }

    resourcesEl.style.display = '';
    var html = '';
    for (var i = 0; i < items.length; i++) {
      html += '<div class="res-row"><span>' + items[i].emoji + ' ' + items[i].label + '</span>'
        + '<span class="res-value" id="abyss-cu-' + i + '">0</span></div>';
    }
    resourcesEl.innerHTML = html;

    var self = this;
    var completed = 0;
    var startDelay = 0;

    for (var j = 0; j < items.length; j++) {
      (function (idx, delay, item) {
        var tid = setTimeout(function () {
          if (self._settlement.skipped) return;
          self._animateCountUp(idx, item.value, item.format, 600, function () {
            completed++;
            if (completed >= items.length && onComplete) onComplete();
          });
        }, delay);
        self._settlement.phaseTimers.push(tid);
      })(j, startDelay, items[j]);
      startDelay += 200;
    }
  },

  _animateCountUp: function (idx, targetValue, shouldFormat, duration, onDone) {
    var el = document.getElementById('abyss-cu-' + idx);
    if (!el) { if (onDone) onDone(); return; }
    var self = this;
    var start = performance.now();

    function tick(now) {
      if (self._settlement.skipped) { if (onDone) onDone(); return; }
      var progress = Math.min(1, (now - start) / duration);
      // Ease out
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(targetValue * eased);
      el.textContent = shouldFormat ? Utils.formatNumber(current) : current;

      if (progress < 1) {
        self._settlement.countUpRafId = requestAnimationFrame(tick);
      } else {
        el.textContent = shouldFormat ? Utils.formatNumber(targetValue) : targetValue;
        el.style.animation = 'countUpGlow 0.5s ease';
        if (onDone) onDone();
      }
    }
    this._settlement.countUpRafId = requestAnimationFrame(tick);
  },

  _startEquipReveal: function (run, equipRevealEl, onComplete) {
    if (this._settlement.skipped) { if (onComplete) onComplete(); return; }
    this._settlement.phase = 'equip_reveal';

    // Filter quality >= 4 for card reveal
    var highQuality = [];
    if (run.droppedEquipment) {
      for (var i = 0; i < run.droppedEquipment.length; i++) {
        if (run.droppedEquipment[i].quality >= 4) {
          highQuality.push(run.droppedEquipment[i]);
        }
      }
    }

    if (highQuality.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    equipRevealEl.style.display = '';
    this._EquipReveal.start(highQuality, equipRevealEl, onComplete);
  },

  _showFinalSummary: function (summaryArea) {
    this._settlement.phase = 'summary';
    if (summaryArea) summaryArea.style.display = '';
    // Remove skip button
    var skipBtn = document.getElementById('abyss-skip');
    if (skipBtn) skipBtn.style.display = 'none';
    this._bindSettlementActions();
  },

  _skipSettlement: function () {
    this._settlement.skipped = true;
    // Clear all timers
    for (var t = 0; t < this._settlement.phaseTimers.length; t++) {
      clearTimeout(this._settlement.phaseTimers[t]);
    }
    this._settlement.phaseTimers = [];
    if (this._settlement.countUpRafId) {
      cancelAnimationFrame(this._settlement.countUpRafId);
      this._settlement.countUpRafId = null;
    }

    // Stop particles
    this._LootParticles.stop();

    // Skip/stop equip reveal
    this._EquipReveal.skip();

    // Show final values for countup
    var run = this._settlement.run || AbyssManager.getCurrentRun();
    if (run) {
      var r = run.rewards;
      var items = [];
      if (r.gold) items.push({ value: r.gold, format: true });
      if (r.exp) items.push({ value: r.exp, format: true });
      if (r.iron) items.push({ value: r.iron, format: false });
      if (r.jade) items.push({ value: r.jade, format: false });
      for (var i = 0; i < items.length; i++) {
        var el = document.getElementById('abyss-cu-' + i);
        if (el) el.textContent = items[i].format ? Utils.formatNumber(items[i].value) : items[i].value;
      }
    }

    // Show resources and equips if hidden
    var resEl = document.getElementById('abyss-resources');
    if (resEl && !resEl.innerHTML.trim()) {
      // Need to populate resources
      if (run) this._populateResourcesFinal(run, resEl);
    }
    if (resEl) resEl.style.display = '';

    var eqEl = document.getElementById('abyss-equip-reveal');
    if (eqEl) eqEl.style.display = '';

    // Show summary
    var summaryArea = document.getElementById('abyss-summary-area');
    this._showFinalSummary(summaryArea);

    EventBus.emit('abyss:settlement_skip', { abyssId: this._settlement.abyssId });
  },

  _populateResourcesFinal: function (run, resEl) {
    var r = run.rewards;
    var items = [];
    if (r.gold) items.push({ emoji: UIIcons.icon('gold'), label: '金币', value: Utils.formatNumber(r.gold) });
    if (r.exp) items.push({ emoji: UIIcons.icon('exp'), label: '经验', value: Utils.formatNumber(r.exp) });
    if (r.iron) items.push({ emoji: UIIcons.icon('iron'), label: '铁瞿', value: r.iron });
    if (r.jade) items.push({ emoji: UIIcons.icon('jade'), label: '玉璧', value: r.jade });
    var html = '';
    for (var i = 0; i < items.length; i++) {
      html += '<div class="res-row"><span>' + items[i].emoji + ' ' + items[i].label + '</span>'
        + '<span class="res-value">' + items[i].value + '</span></div>';
    }
    resEl.innerHTML = html;
  },

  _cleanupSettlement: function () {
    for (var t = 0; t < this._settlement.phaseTimers.length; t++) {
      clearTimeout(this._settlement.phaseTimers[t]);
    }
    this._settlement.phaseTimers = [];
    if (this._settlement.countUpRafId) {
      cancelAnimationFrame(this._settlement.countUpRafId);
      this._settlement.countUpRafId = null;
    }
    this._LootParticles.stop();
    this._EquipReveal.stop();
    this._settlement.phase = null;
    this._settlement.skipped = false;
    this._settlement.run = null;
  },

  /* ============================
   * Abyss List (no cooldown)
   * ============================ */
  _renderAbyssList: function () {
    var html = '';
    var abyssIds = Object.keys(AbyssData);

    for (var i = 0; i < abyssIds.length; i++) {
      var aid = abyssIds[i];
      var abyss = AbyssData[aid];
      var inst = AbyssManager.getInstance(aid);
      var unlocked = AbyssManager.isAbyssUnlocked(aid);

      var theme = abyss.theme || {};
      var bgGrad = theme.bgGradient || 'linear-gradient(180deg, #1a0a2e, #0d0d0d)';

      html += '<div class="card" style="border:1px solid ' + (unlocked ? (theme.bossFrameColor || '#444') : '#333') + ';';
      if (!unlocked) html += 'opacity:0.5;';
      html += '">';

      html += '<div style="background:' + bgGrad + ';border-radius:6px;padding:10px;margin:-8px -8px 8px -8px;border-radius:8px 8px 0 0;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<div>';
      html += '<div style="font-size:1rem;font-weight:bold;color:' + (theme.bossFrameColor || '#fff') + ';">' + abyss.name + '</div>';
      html += '<div style="font-size:0.72rem;color:var(--color-text-dim);margin-top:2px;">' + abyss.floors.length + ' 层 · 推荐战力 ' + Utils.formatNumber(abyss.recommendedPower || 0) + '</div>';
      html += '</div>';

      if (inst && inst.cleared) {
        html += '<span style="font-size:0.75rem;color:var(--color-success);">✅ 已通关</span>';
      } else if (inst) {
        html += '<span style="font-size:0.72rem;color:var(--color-text-dim);">最高 ' + inst.bestFloor + ' 层</span>';
      }
      html += '</div>';
      html += '</div>';

      if (abyss.description) {
        html += '<div style="font-size:0.72rem;color:var(--color-text-dim);font-style:italic;margin-bottom:6px;">"' + abyss.description + '"</div>';
      }

      var cost = abyss.ticketCost;
      var costStr = [];
      if (cost.jade) costStr.push(UIIcons.icon('jade') + cost.jade);
      if (cost.gold) costStr.push(UIIcons.icon('gold') + Utils.formatNumber(cost.gold));
      if (cost.iron) costStr.push(UIIcons.icon('iron') + cost.iron);
      html += '<div style="font-size:0.72rem;color:var(--color-text-dim);margin-bottom:6px;">入场：' + costStr.join(' ') + '</div>';

      if (!unlocked) {
        html += '<div style="font-size:0.72rem;color:var(--color-danger);">' + UIIcons.icon('lock') + ' 通关 ' + abyss.unlockCondition.stage + ' 后解锁</div>';
      } else {
        html += '<div style="text-align:right;">';
        html += '<button class="btn abyss-enter" data-abyss-id="' + aid + '" ';
        html += 'style="font-size:0.78rem;padding:5px 16px;background:' + (theme.bossFrameColor || 'var(--color-primary)') + ';">' + UIIcons.icon('attack') + ' 进入</button>';
        html += '</div>';
      }

      html += '</div>';
    }

    return html;
  },

  /* ============================
   * Event Binding
   * ============================ */
  _bindEvents: function () {
    var self = this;

    // Enter abyss buttons
    document.querySelectorAll('.abyss-enter').forEach(function (btn) {
      btn.onclick = function () {
        var aid = this.getAttribute('data-abyss-id');
        Modal.show({
          title: '进入深渊',
          content: '<div style="text-align:center;">将消耗入场券资源<br>确定要进入深渊挑战吗？</div>',
          confirmText: '进入',
          onConfirm: function () {
            if (AbyssManager.enterAbyss(aid)) self.show();
          }
        });
      };
    });

    // Skip button
    var skipBtn = document.getElementById('abyss-skip');
    if (skipBtn) {
      skipBtn.onclick = function () { self._skipSettlement(); };
    }

    // Start settlement animation if in title phase
    if (this._settlement.phase === 'title') {
      this._startSettlementAnimation();
    }

    // Bind retry/leave
    this._bindSettlementActions();
  },

  _bindSettlementActions: function () {
    var self = this;

    document.querySelectorAll('.abyss-retry').forEach(function (btn) {
      btn.onclick = function () {
        var aid = this.getAttribute('data-abyss-id');
        self._cleanupSettlement();
        AbyssManager.clearRun();
        if (AbyssManager.enterAbyss(aid)) {
          EventBus.emit('abyss:retry', { abyssId: aid });
          self.show();
        }
      };
    });

    document.querySelectorAll('.abyss-leave').forEach(function (btn) {
      btn.onclick = function () {
        self._cleanupSettlement();
        AbyssManager.clearRun();
        self.show();
      };
    });
  }
};
