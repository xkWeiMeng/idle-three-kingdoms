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
   * Slot Machine Equipment Reveal
   * ============================ */
  _SlotMachine: {
    _container: null,
    _timers: [],
    _onComplete: null,
    REEL_ICONS: ['🗡️', '⚔️', '🛡️', '🏹', '👑', '💍', '📿', '🔮'],

    start: function (equipments, containerEl, onComplete) {
      this.stop();
      this._onComplete = onComplete;
      this._container = containerEl;

      if (!equipments || equipments.length === 0) {
        if (onComplete) onComplete();
        return;
      }

      // Filter quality >= 3
      var qualified = [];
      for (var i = 0; i < equipments.length; i++) {
        if (equipments[i].quality >= 3) qualified.push(equipments[i]);
      }

      if (qualified.length === 0) {
        if (onComplete) onComplete();
        return;
      }

      // Sort by quality ascending (lowest first)
      qualified.sort(function (a, b) { return a.quality - b.quality; });

      // Play slot machines sequentially
      var self = this;
      var delay = 0;
      for (var q = 0; q < qualified.length; q++) {
        (function (idx, startDelay) {
          var tid = setTimeout(function () {
            if (!self._container) return;
            self._playOneSlot(qualified[idx]);
          }, startDelay);
          self._timers.push(tid);
        })(q, delay);
        var eq = qualified[q];
        var numCols = (eq.quality >= 5) ? 3 : 1;
        var baseDuration = 1200;
        var extraStopTime = numCols === 3 ? (500 * 2) : 0; // 500ms between column stops
        if (eq.quality >= 6) extraStopTime += 1200; // mythic delay
        var qualityEffectTime = (eq.quality >= 5) ? 2000 : 500;
        delay += baseDuration + extraStopTime + qualityEffectTime + 800; // 800ms gap between slots
      }

      // Schedule completion after last slot finishes
      var completeTid = setTimeout(function () {
        if (self._onComplete) self._onComplete();
      }, delay);
      this._timers.push(completeTid);
    },

    _playOneSlot: function (equip) {
      var numColumns = (equip.quality >= 5) ? 3 : 1;
      var slotData = this._createSlotDOM(equip, numColumns);
      if (!this._container) return;

      // Clear previous slot display
      var prev = this._container.querySelectorAll('.slot-machine');
      for (var p = 0; p < prev.length; p++) {
        if (prev[p].parentNode) prev[p].parentNode.removeChild(prev[p]);
      }

      this._container.appendChild(slotData.container);

      // Spin columns
      var self = this;
      for (var c = 0; c < slotData.columns.length; c++) {
        (function (colIdx) {
          var duration = 1200 + colIdx * 500;
          // Mythic: last column delayed
          if (equip.quality >= 6 && colIdx === slotData.columns.length - 1) {
            duration += 1200;
          }
          var tid = setTimeout(function () {
            self._spinColumn(slotData.columns[colIdx], slotData.targetIndex, duration, function () {
              // On last column stop, play quality effect
              if (colIdx === slotData.columns.length - 1) {
                self._playQualityEffect(equip.quality, slotData.container, equip);
              }
            });
          }, 50); // Small delay to let DOM render
          self._timers.push(tid);
        })(c);
      }
    },

    _createSlotDOM: function (equip, numColumns) {
      var container = document.createElement('div');
      container.className = 'slot-machine';

      // SVG frame placeholder
      var frameHtml = '<!-- PLACEHOLDER: 老虎机外框\n'
        + '     位置：结算界面居中\n'
        + '     尺寸：' + (numColumns === 3 ? '300×180px' : '120×180px') + '\n'
        + '     内容：古风卷轴造型的老虎机框架\n'
        + '     替换方式：将此 <svg> 替换为 <img src="assets/abyss/slot-frame.svg"> -->';
      var svgWidth = numColumns === 3 ? 260 : 100;
      frameHtml += '<svg class="slot-frame-svg" width="' + svgWidth + '" height="36" viewBox="0 0 ' + svgWidth + ' 36">'
        + '<rect x="1" y="1" width="' + (svgWidth - 2) + '" height="34" rx="6" fill="none" stroke="var(--color-gold, #d4a849)" stroke-width="2" opacity="0.6"/>'
        + '<line x1="10" y1="8" x2="' + (svgWidth - 10) + '" y2="8" stroke="var(--color-gold, #d4a849)" stroke-width="0.5" opacity="0.3"/>'
        + '<text x="' + (svgWidth / 2) + '" y="26" text-anchor="middle" fill="var(--color-text-dim, #a09080)" font-size="10">⚔ 装备揭示 ⚔</text>'
        + '</svg>';

      var frameDiv = document.createElement('div');
      frameDiv.innerHTML = frameHtml;
      container.appendChild(frameDiv);

      // Columns container
      var columnsDiv = document.createElement('div');
      columnsDiv.className = 'slot-columns';

      var columns = [];
      var icons = this.REEL_ICONS;
      var targetIndex = 10; // target will be at index 10 of 13 items

      for (var c = 0; c < numColumns; c++) {
        var colDiv = document.createElement('div');
        colDiv.className = 'slot-column';
        var reelDiv = document.createElement('div');
        reelDiv.className = 'slot-reel';

        // Build 13 items: 12 random + 1 target at targetIndex
        for (var r = 0; r < 13; r++) {
          var itemDiv = document.createElement('div');
          itemDiv.className = 'slot-item';
          if (r === targetIndex) {
            // Target item: show equipment emoji/name
            itemDiv.innerHTML = '<span>' + (equip.emoji || '⚔️') + '</span>';
            itemDiv.setAttribute('data-target', 'true');
          } else {
            // Random icon
            var randIcon = icons[Math.floor(Math.random() * icons.length)];
            itemDiv.textContent = randIcon;
          }
          reelDiv.appendChild(itemDiv);
        }

        colDiv.appendChild(reelDiv);
        columnsDiv.appendChild(colDiv);
        columns.push({ el: colDiv, reel: reelDiv });
      }

      container.appendChild(columnsDiv);
      return { container: container, columns: columns, targetIndex: targetIndex };
    },

    _spinColumn: function (column, targetIdx, duration, onStop) {
      var reel = column.reel;
      // Calculate the translateY to land on target
      var itemHeight = 72;
      var targetY = -(targetIdx * itemHeight);

      // Start with no transition for initial position
      reel.style.transition = 'none';
      reel.style.transform = 'translateY(0)';

      // Force reflow then animate
      reel.offsetHeight; // force reflow
      reel.style.transition = 'transform ' + (duration / 1000) + 's cubic-bezier(0.15, 0.8, 0.3, 1)';
      reel.style.transform = 'translateY(' + targetY + 'px)';

      var self = this;
      var tid = setTimeout(function () {
        if (onStop) onStop();
      }, duration + 50);
      this._timers.push(tid);
    },

    _playQualityEffect: function (quality, container, equip) {
      var self = this;
      var qColor = AbyssPanel._qualityColors[quality] || '#aaa';
      var qName = AbyssPanel._qualityNames[quality] || '';

      // Add flash class to slot columns
      var columns = container.querySelectorAll('.slot-column');
      var flashClass = '';
      if (quality === 3) flashClass = 'slot-flash-blue';
      else if (quality === 4) flashClass = 'slot-flash-purple';
      else if (quality >= 5) flashClass = 'slot-flash-gold';
      if (quality >= 6) flashClass = 'slot-flash-red';

      for (var c = 0; c < columns.length; c++) {
        columns[c].classList.add(flashClass);
      }

      // Show result name
      var nameDiv = document.createElement('div');
      nameDiv.className = 'slot-result-name';
      nameDiv.style.color = qColor;
      nameDiv.textContent = (equip.emoji || '') + ' ' + equip.name + '（' + qName + '）';
      container.appendChild(nameDiv);

      // Quality 4: purple full pulse (reuse existing animation)
      if (quality === 4 && container.parentNode) {
        container.parentNode.style.animation = 'pulse-glow-purple 0.8s ease';
        var tid4 = setTimeout(function () {
          if (container.parentNode) container.parentNode.style.animation = '';
        }, 800);
        this._timers.push(tid4);
      }

      // Quality 5+: celebration overlay
      if (quality >= 5) {
        var celebDiv = document.createElement('div');
        celebDiv.className = 'slot-celebration';
        var celebName = document.createElement('div');
        celebName.className = 'slot-celebration__name';
        celebName.style.color = qColor;
        celebName.textContent = equip.name;
        var celebQ = document.createElement('div');
        celebQ.className = 'slot-celebration__quality';
        celebQ.style.color = qColor;
        celebQ.textContent = qName;
        celebDiv.appendChild(celebName);
        celebDiv.appendChild(celebQ);

        if (container.parentNode) {
          container.parentNode.style.position = 'relative';
          container.parentNode.appendChild(celebDiv);
        }

        // Gold particles via LootParticles if quality 5
        if (quality === 5 && AbyssPanel._LootParticles && container.parentNode) {
          var goldRewards = { gold: 2000, exp: 0, iron: 0, jade: 0 };
          AbyssPanel._LootParticles.start(goldRewards, container.parentNode, function () {});
        }

        // Remove celebration after 2s
        var tidCeleb = setTimeout(function () {
          if (celebDiv.parentNode) celebDiv.parentNode.removeChild(celebDiv);
        }, 2000);
        this._timers.push(tidCeleb);
      }

      // Quality 6: mythic flash + shake before effect
      if (quality >= 6 && container.parentNode) {
        var flash = document.createElement('div');
        flash.className = 'equip-mythic-flash';
        container.parentNode.appendChild(flash);
        container.parentNode.style.animation = 'shake 0.1s ease 4';

        var tidFlash = setTimeout(function () {
          if (flash.parentNode) flash.parentNode.removeChild(flash);
          if (container.parentNode) container.parentNode.style.animation = '';
        }, 1200);
        this._timers.push(tidFlash);
      }

      EventBus.emit('abyss:equip_reveal', { equipment: equip, quality: quality });
    },

    skip: function () {
      // Clear all timers
      for (var t = 0; t < this._timers.length; t++) clearTimeout(this._timers[t]);
      this._timers = [];

      // Show all targets immediately
      if (this._container) {
        var reels = this._container.querySelectorAll('.slot-reel');
        for (var r = 0; r < reels.length; r++) {
          reels[r].style.transition = 'none';
          var targetItems = reels[r].querySelectorAll('[data-target="true"]');
          if (targetItems.length > 0) {
            var idx = Array.prototype.indexOf.call(reels[r].children, targetItems[0]);
            reels[r].style.transform = 'translateY(' + (-(idx * 72)) + 'px)';
          }
        }
        // Remove all effects
        var celebrations = this._container.parentNode ? this._container.parentNode.querySelectorAll('.slot-celebration') : [];
        for (var c = 0; c < celebrations.length; c++) {
          if (celebrations[c].parentNode) celebrations[c].parentNode.removeChild(celebrations[c]);
        }
        var flashes = this._container.parentNode ? this._container.parentNode.querySelectorAll('.equip-mythic-flash') : [];
        for (var f = 0; f < flashes.length; f++) {
          if (flashes[f].parentNode) flashes[f].parentNode.removeChild(flashes[f]);
        }
      }

      AbyssPanel._LootParticles.stop();
    },

    stop: function () {
      this.skip();
      this._container = null;
      this._onComplete = null;
    }
  },

  /* ============================
   * Floor Transition System
   * ============================ */
  _Transition: {
    _timers: [],
    _container: null,

    showBossEntrance: function (bossData, theme, onComplete) {
      this._clearTimers();
      var container = document.createElement('div');
      container.className = 'abyss-transition';
      container.style.animation = 'fadeIn 0.3s ease';
      this._container = container;

      var bgColor = (theme && theme.bossFrameColor) ? theme.bossFrameColor : '#ff4444';

      // Boss SVG silhouette placeholder
      container.innerHTML = ''
        + '<!-- PLACEHOLDER: Boss 登场剪影\n'
        + '     位置：过场画面中央\n'
        + '     尺寸：160×220px\n'
        + '     内容：Boss 角色全身剪影（暗色轮廓 + 主题色背光）\n'
        + '     替换方式：将此 <svg> 替换为 <img src="assets/abyss/boss_' + (bossData.id || 'unknown') + '.svg"> -->'
        + '<div class="abyss-transition__boss">'
        + '<svg width="160" height="220" viewBox="0 0 160 220">'
        + '<defs><radialGradient id="boss-glow-' + (bossData.id || 'x') + '">'
        + '<stop offset="0%" stop-color="' + bgColor + '" stop-opacity="0.4"/>'
        + '<stop offset="100%" stop-color="transparent"/>'
        + '</radialGradient></defs>'
        + '<circle cx="80" cy="110" r="100" fill="url(#boss-glow-' + (bossData.id || 'x') + ')"/>'
        + '<ellipse cx="80" cy="60" rx="25" ry="30" fill="#1a1a1a" stroke="#333" stroke-width="1"/>'
        + '<rect x="55" y="85" width="50" height="80" rx="5" fill="#1a1a1a" stroke="#333" stroke-width="1"/>'
        + '<rect x="45" y="165" width="20" height="50" rx="3" fill="#1a1a1a"/>'
        + '<rect x="95" y="165" width="20" height="50" rx="3" fill="#1a1a1a"/>'
        + '<text x="80" y="200" text-anchor="middle" fill="#555" font-size="10">BOSS</text>'
        + '</svg>'
        + '</div>'
        + '<div class="abyss-transition__name" style="color:' + bgColor + ';">' + (bossData.name || '???') + '</div>'
        + '<div class="abyss-transition__title" style="color:var(--color-text-dim);">' + (bossData.title || '') + '</div>';

      return { el: container, start: function (parentEl) {
        parentEl.appendChild(container);
        var self2 = AbyssPanel._Transition;
        // Fade out after 1.5s
        var tid = setTimeout(function () {
          container.style.opacity = '0';
          container.style.transition = 'opacity 0.3s ease';
          var tid2 = setTimeout(function () {
            if (container.parentNode) container.parentNode.removeChild(container);
            if (onComplete) onComplete();
          }, 300);
          self2._timers.push(tid2);
        }, 1500);
        self2._timers.push(tid);
      }};
    },

    showFloorClear: function (floor, rewards, onComplete) {
      this._clearTimers();
      var container = document.createElement('div');
      container.className = 'abyss-floor-clear';
      container.style.animation = 'slideUp 0.3s ease';
      this._container = container;

      var rewardStr = '';
      if (rewards) {
        if (rewards.gold) rewardStr += (typeof UIIcons !== 'undefined' ? UIIcons.icon('gold') : '💰') + rewards.gold + ' ';
        if (rewards.exp) rewardStr += (typeof UIIcons !== 'undefined' ? UIIcons.icon('exp') : '✨') + rewards.exp + ' ';
        if (rewards.iron) rewardStr += (typeof UIIcons !== 'undefined' ? UIIcons.icon('iron') : '⛏️') + rewards.iron + ' ';
        if (rewards.jade) rewardStr += (typeof UIIcons !== 'undefined' ? UIIcons.icon('jade') : '💎') + rewards.jade + ' ';
      }

      container.innerHTML = '<div class="abyss-floor-clear__text">✅ 第 ' + floor + ' 层通过！</div>'
        + '<div class="abyss-floor-clear__rewards">' + rewardStr.trim() + '</div>';

      return { el: container, start: function (parentEl) {
        parentEl.appendChild(container);
        var self2 = AbyssPanel._Transition;
        var tid = setTimeout(function () {
          container.style.opacity = '0';
          container.style.transition = 'opacity 0.3s ease';
          var tid2 = setTimeout(function () {
            if (container.parentNode) container.parentNode.removeChild(container);
            if (onComplete) onComplete();
          }, 300);
          self2._timers.push(tid2);
        }, 1500);
        self2._timers.push(tid);
      }};
    },

    _clearTimers: function () {
      for (var i = 0; i < this._timers.length; i++) clearTimeout(this._timers[i]);
      this._timers = [];
    },

    stop: function () {
      this._clearTimers();
      if (this._container && this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
      this._container = null;
    }
  },

  /* ============================
   * Init & Event Binding
   * ============================ */
  init: function () {
    var self = this;
    EventBus.on('abyss:entered', this._onUpdate.bind(this));
    EventBus.on('abyss:floor_cleared', this._onFloorCleared.bind(this));
    EventBus.on('abyss:completed', this._onSettlementTrigger.bind(this));
    EventBus.on('abyss:failed', this._onSettlementTrigger.bind(this));
    EventBus.on('overlay:closed', function (closedId) {
      if (closedId === 'abyss') {
        self._Transition.stop();
        self._cleanupSettlement();
      }
    });
  },

  _onUpdate: function () {
    var el = document.getElementById('abyss-panel-content');
    if (el) this.show();
  },

  /** Handle floor cleared: show transition animations in normal mode */
  _onFloorCleared: function (data) {
    var run = AbyssManager.getCurrentRun();
    if (!run) return;

    // Quick battle: skip all transitions
    if (run.quickBattle) return;

    // If not visible, skip transition but leave phase as 'transition'
    var el = document.getElementById('abyss-panel-content');
    if (!el) return;

    // Show floor clear banner → then boss entrance → then advance floor
    var self = this;
    var transitionZone = document.getElementById('abyss-transition-zone');
    if (!transitionZone) {
      this.show();
      transitionZone = document.getElementById('abyss-transition-zone');
    }
    if (!transitionZone) return;

    var floorClear = this._Transition.showFloorClear(data.floor, data.rewards, function () {
      // After floor clear banner fades, check if there's a next floor
      var currentRun = AbyssManager.getCurrentRun();
      if (!currentRun || currentRun.phase !== 'transition') return;

      var abyss = AbyssData[currentRun.abyssId];
      if (!abyss || currentRun.currentFloor >= abyss.floors.length) return;

      // Show next boss entrance
      var nextFloorData = abyss.floors[currentRun.currentFloor]; // currentFloor is still the cleared one
      if (!nextFloorData) return;

      var bossData = {
        id: nextFloorData.boss.id,
        name: nextFloorData.boss.name,
        title: nextFloorData.boss.title || ''
      };
      var theme = abyss.theme || {};

      var bossEntrance = self._Transition.showBossEntrance(bossData, theme, function () {
        // Advance floor after boss entrance
        AbyssManager.advanceFloor();
        self.show();
      });
      if (transitionZone) bossEntrance.start(transitionZone);
    });
    floorClear.start(transitionZone);
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
      } else if (currentRun.phase === 'transition') {
        html += this._renderTransitionPhase(currentRun);
      } else {
        html += this._renderActiveRun(currentRun);
      }
    } else {
      html += this._renderAbyssList();
    }

    html += '</div>';
    return html;
  },

  _renderTransitionPhase: function (run) {
    var abyss = AbyssData[run.abyssId];
    var theme = abyss.theme || {};
    var bgGrad = theme.bgGradient || 'linear-gradient(180deg, #1a0a2e, #0d0d0d)';
    var html = '';

    html += '<div style="background:' + bgGrad + ';border-radius:8px;padding:12px;margin-bottom:8px;">';
    html += '<div style="text-align:center;">';
    html += '<div style="font-size:1.1rem;font-weight:bold;color:' + (theme.bossFrameColor || '#fff') + ';">';
    html += abyss.name + ' · 过场中...</div>';
    html += '</div>';
    html += '</div>';

    // Transition zone where floor clear / boss entrance will be rendered
    html += '<div id="abyss-transition-zone" style="position:relative;min-height:300px;display:flex;align-items:center;justify-content:center;"></div>';

    return html;
  },

  _showQuickProgress: function (run, abyssId) {
    var self = this;
    var abyss = AbyssData[abyssId];
    var totalFloors = abyss ? abyss.floors.length : 5;

    var html = '<div class="abyss-quick-progress">';
    // SVG background placeholder
    html += '<!-- PLACEHOLDER: 快速战斗背景\n'
      + '     位置：进度过渡画面全屏背景\n'
      + '     尺寸：100% × 100%\n'
      + '     内容：深渊主题暗色背景 + 模糊战斗剪影\n'
      + '     替换方式：将 <svg> 替换为 <img src="assets/abyss/quick-battle-bg.png">\n'
      + '     当前使用 SVG 渐变 + 几何图形占位 -->';
    html += '<svg viewBox="0 0 400 280" preserveAspectRatio="none">'
      + '<defs><linearGradient id="qb-bg" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="#1a0a2e"/>'
      + '<stop offset="100%" stop-color="#0d0d0d"/>'
      + '</linearGradient></defs>'
      + '<rect width="400" height="280" fill="url(#qb-bg)"/>'
      + '<circle cx="200" cy="140" r="80" fill="rgba(192,57,43,0.1)"/>'
      + '<circle cx="200" cy="140" r="40" fill="rgba(192,57,43,0.15)"/>'
      + '<text x="200" y="130" text-anchor="middle" fill="rgba(255,255,255,0.1)" font-size="48">⚔</text>'
      + '<text x="200" y="160" text-anchor="middle" fill="rgba(255,255,255,0.06)" font-size="14">快速战斗中</text>'
      + '</svg>';
    html += '<div class="progress-label">⚡ 快速战斗</div>';
    html += '<div class="progress-bar"><div class="progress-fill" id="qb-progress-fill" style="width:0%;"></div></div>';
    html += '<div class="progress-text" id="qb-progress-text">第 1/' + totalFloors + ' 层...</div>';
    html += '</div>';

    OverlayPanel.show({
      title: UIIcons.icon('abyss') + ' 深渊挑战',
      content: '<div id="abyss-panel-content">' + html + '</div>',
      panelId: 'abyss',
      height: 'full'
    });

    // Animate progress bar over 2.5 seconds
    var progressSteps = totalFloors;
    var stepDuration = 2500 / progressSteps;
    var currentStep = 0;

    var progressInterval = setInterval(function () {
      currentStep++;
      var pct = (currentStep / progressSteps) * 100;
      var fillEl = document.getElementById('qb-progress-fill');
      var textEl = document.getElementById('qb-progress-text');
      if (fillEl) fillEl.style.width = pct + '%';
      if (textEl) textEl.textContent = '第 ' + Math.min(currentStep, progressSteps) + '/' + progressSteps + ' 层...';

      if (currentStep >= progressSteps) {
        clearInterval(progressInterval);
        // Trigger settlement after progress completes
        setTimeout(function () {
          self._onSettlementTrigger();
        }, 200);
      }
    }, stepDuration);

    this._settlement.phaseTimers.push(progressInterval);
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

    // prefers-reduced-motion: skip slot machine, go direct
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (onComplete) onComplete();
      return;
    }

    // Filter quality >= 3 for slot machine reveal
    var highQuality = [];
    if (run.droppedEquipment) {
      for (var i = 0; i < run.droppedEquipment.length; i++) {
        if (run.droppedEquipment[i].quality >= 3) {
          highQuality.push(run.droppedEquipment[i]);
        }
      }
    }

    if (highQuality.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    equipRevealEl.style.display = '';
    this._SlotMachine.start(highQuality, equipRevealEl, onComplete);
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

    // Skip/stop slot machine
    this._SlotMachine.skip();

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
    this._SlotMachine.stop();
    this._Transition.stop();
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
        html += '<div style="text-align:right;display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;">';
        html += '<button class="btn abyss-enter" data-abyss-id="' + aid + '" ';
        html += 'style="font-size:0.78rem;padding:5px 16px;background:' + (theme.bossFrameColor || 'var(--color-primary)') + ';">' + UIIcons.icon('attack') + ' 进入</button>';
        // Quick battle button: only if firstCleared
        if (inst && inst.firstCleared) {
          html += '<button class="btn abyss-quick-btn abyss-quick-enter" data-abyss-id="' + aid + '">⚡ 快速战斗</button>';
        }
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
            if (AbyssManager.enterAbyss(aid)) {
              // Show boss entrance for floor 1
              var abyss = AbyssData[aid];
              if (abyss && abyss.floors && abyss.floors[0]) {
                self.show();
                var transitionZone = document.getElementById('abyss-transition-zone');
                // In normal enter, show boss entrance for floor 1 in the active run view
                // The active run renders normally, boss entrance is optional on first enter
              }
              self.show();
            }
          }
        });
      };
    });

    // Quick battle buttons
    document.querySelectorAll('.abyss-quick-enter').forEach(function (btn) {
      btn.onclick = function () {
        var aid = this.getAttribute('data-abyss-id');
        Modal.show({
          title: '⚡ 快速战斗',
          content: '<div style="text-align:center;">将消耗入场券资源<br>一键完成全部楼层战斗</div>',
          confirmText: '开始',
          onConfirm: function () {
            if (AbyssManager.quickBattle(aid)) {
              self._showQuickProgress(AbyssManager.getCurrentRun(), aid);
            }
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
