/**
 * 招募演出模块 —— 根据武将品质差异化展示抽卡动画
 * CAP-ERH-10 ~ CAP-ERH-15
 *
 * 依赖: EventBus, NpcDialogues, RecruitPanel (品质颜色/名称)
 */
var RecruitAnimation = {

  _overlay: null,
  _skipRequested: false,
  _currentStep: 0,
  _onComplete: null,
  _isRunning: false,

  _qualityColors: { 1: '#b0a898', 2: '#5d8a48', 3: '#4a7fb5', 4: '#8b5ea8', 5: '#d4a849' },
  _qualityNames: { 1: '白·普通', 2: '绿·精良', 3: '蓝·稀有', 4: '紫·史诗', 5: '橙·传说' },

  // ───────────────────────────────────────────────────────
  //  公开 API
  // ───────────────────────────────────────────────────────

  /**
   * 展示招募演出
   * @param {Array} results - [{heroId, quality, template, isNew, isPityTriggered}]
   * @param {Function} onComplete - 演出完成回调
   */
  show: function (results, onComplete) {
    if (this._isRunning) return;
    this._isRunning = true;
    this._skipRequested = false;
    this._currentStep = 0;
    this._onComplete = onComplete || function () {};

    var self = this;
    var isTenPull = results.length > 1;

    if (isTenPull) {
      self._showTenPull(results);
    } else {
      self._showSinglePull(results[0]);
    }
  },

  // ───────────────────────────────────────────────────────
  //  单抽流程
  // ───────────────────────────────────────────────────────

  _showSinglePull: function (result) {
    var q = result.quality;
    var self = this;

    if (q <= 2) {
      // CAP-ERH-10: Q1-Q2 快速展示，无全屏演出
      self._showQ1Q2(result);
    } else if (q === 3) {
      // CAP-ERH-11: Q3 蓝光脉冲
      self._showQ3(result);
    } else if (q === 4) {
      // CAP-ERH-12: Q4 裂缝演出
      self._showQ4(result);
    } else if (q >= 5) {
      // CAP-ERH-13: Q5 天道异常演出
      self._showQ5(result);
    }
  },

  // ───────────────────────────────────────────────────────
  //  十连抽流程
  // ───────────────────────────────────────────────────────

  _showTenPull: function (results) {
    var self = this;
    // 按品质排序，最高品质放最后
    var sorted = results.slice().sort(function (a, b) { return a.quality - b.quality; });

    // 找到最后一张（最高品质）
    var lastResult = sorted[sorted.length - 1];
    var showFullReveal = lastResult.quality >= 3;

    // 创建 overlay
    self._createOverlay();

    // 创建十连网格
    var grid = document.createElement('div');
    grid.className = 'recruit-ten-grid';
    self._overlay.appendChild(grid);

    // 逐张翻牌（除最后一张最高品质）
    var cardCount = showFullReveal ? sorted.length - 1 : sorted.length;
    var i = 0;

    function revealNext() {
      if (self._skipRequested) {
        // 跳过 — 显示所有剩余卡片
        for (var j = i; j < sorted.length; j++) {
          var card = self._createMiniCard(sorted[j]);
          card.classList.add('revealed');
          grid.appendChild(card);
        }
        self._finishTenPull(sorted, lastResult, showFullReveal);
        return;
      }

      if (i < cardCount) {
        var card = self._createMiniCard(sorted[i]);
        grid.appendChild(card);
        // 延迟触发动画
        setTimeout(function () { card.classList.add('revealed'); }, 10);
        i++;
        setTimeout(revealNext, 200);
      } else {
        // 所有低品质已翻完
        self._finishTenPull(sorted, lastResult, showFullReveal);
      }
    }

    revealNext();
  },

  _finishTenPull: function (sorted, lastResult, showFullReveal) {
    var self = this;
    if (self._skipRequested) {
      // 如果已跳过且最后一张还没添加
      if (showFullReveal) {
        // 清理 overlay，直接完成
        self._cleanup();
      } else {
        // 等一下让玩家看到完整网格
        setTimeout(function () { self._cleanup(); }, 500);
      }
      return;
    }

    if (showFullReveal) {
      // 清除 overlay，为最高品质做完整演出
      setTimeout(function () {
        self._removeOverlay();
        self._showSinglePull(lastResult);
      }, 400);
    } else {
      // 没有高品质，短暂展示后关闭
      setTimeout(function () { self._cleanup(); }, 800);
    }
  },

  // ───────────────────────────────────────────────────────
  //  CAP-ERH-10: Q1-Q2 快速展示（无全屏遮罩）
  // ───────────────────────────────────────────────────────

  _showQ1Q2: function (result) {
    // Q1-Q2 不做全屏演出，直接完成
    this._cleanup();
  },

  // ───────────────────────────────────────────────────────
  //  CAP-ERH-11: Q3 蓝光脉冲
  // ───────────────────────────────────────────────────────

  _showQ3: function (result) {
    var self = this;
    if (self._skipRequested) { self._cleanup(); return; }

    self._createOverlay();

    var card = self._createHeroCard(result, '1.8rem');
    card.className = 'recruit-card-reveal recruit-q3-glow';
    card.style.borderRadius = '12px';
    card.style.border = '2px solid ' + self._qualityColors[3];
    card.style.background = 'var(--color-surface, #2a2018)';
    card.style.padding = '24px 32px';
    self._overlay.appendChild(card);

    // 添加跳过提示
    self._addSkipHint();

    // 检查保底
    if (result.isPityTriggered) {
      setTimeout(function () { self._showPityText(); }, 900);
    }

    // 0.8秒后等待点击关闭
    // 点击关闭由 overlay 的 click handler 负责
  },

  // ───────────────────────────────────────────────────────
  //  CAP-ERH-12: Q4 紫色裂缝演出
  // ───────────────────────────────────────────────────────

  _showQ4: function (result) {
    var self = this;
    if (self._skipRequested) { self._cleanup(); return; }

    // Step 1: 全屏暗色遮罩
    self._createOverlay();
    self._addSkipHint();

    // Step 2: 金色裂缝 (0.6s)
    var crack = document.createElement('div');
    crack.className = 'recruit-crack';
    self._overlay.appendChild(crack);

    self._currentStep = 1;

    setTimeout(function () {
      if (self._skipRequested) { self._cleanup(); return; }

      // Step 3: 移除裂缝，展示武将大卡片
      if (crack.parentNode) crack.parentNode.removeChild(crack);
      self._currentStep = 2;

      var card = self._createHeroCard(result, '3rem');
      card.className = 'recruit-card-reveal';
      card.style.background = 'var(--color-surface, #2a2018)';
      card.style.borderRadius = '16px';
      card.style.border = '2px solid ' + self._qualityColors[4];
      card.style.padding = '30px 40px';
      card.style.boxShadow = '0 0 40px rgba(139, 94, 168, 0.4)';

      // 添加专属台词
      var quote = self._getHeroQuote(result);
      if (quote) {
        var quoteEl = document.createElement('div');
        quoteEl.style.cssText = 'margin-top:12px;font-size:0.85rem;color:var(--color-text-dim);font-style:italic;';
        quoteEl.textContent = '「' + quote + '」';
        card.appendChild(quoteEl);
      }

      self._overlay.appendChild(card);

      // 检查保底
      if (result.isPityTriggered) {
        setTimeout(function () { self._showPityText(); }, 600);
      }
    }, 700);
  },

  // ───────────────────────────────────────────────────────
  //  CAP-ERH-13: Q5 天道异常演出
  // ───────────────────────────────────────────────────────

  _showQ5: function (result) {
    var self = this;
    if (self._skipRequested) { self._cleanup(); return; }

    // Step 1: 天道系统弹窗
    self._createOverlay();
    self._addSkipHint();
    self._currentStep = 1;

    var alert = document.createElement('div');
    alert.className = 'recruit-tiandao-alert';
    alert.innerHTML = '<div style="font-size:1.2rem;margin-bottom:8px;">⚠️ 天道系统</div>' +
      '<div style="font-size:0.9rem;color:var(--color-warning);">检测到 SSR 级异常...正在分析...</div>';
    self._overlay.appendChild(alert);

    // 1.5 秒后进入故障效果
    setTimeout(function () {
      if (self._skipRequested) { self._cleanup(); return; }

      // 移除弹窗
      if (alert.parentNode) alert.parentNode.removeChild(alert);
      self._currentStep = 2;

      // Step 2: 屏幕故障效果 (0.8s)
      document.body.classList.add('recruit-glitch');

      setTimeout(function () {
        document.body.classList.remove('recruit-glitch');

        if (self._skipRequested) { self._cleanup(); return; }
        self._currentStep = 3;

        // Step 3: 武将全屏展示（华丽版）
        // 添加金色渐变背景
        self._overlay.classList.add('recruit-q5-bg');

        var card = self._createHeroCard(result, '4rem');
        card.className = 'recruit-card-reveal';
        card.style.background = 'transparent';
        card.style.padding = '40px 50px';
        card.style.position = 'relative';

        // emoji 发光效果
        var emojiEl = card.querySelector('.recruit-hero-emoji');
        if (emojiEl) {
          emojiEl.classList.add('recruit-q5-emoji-glow');
        }

        // 专属台词
        var quote = self._getHeroQuote(result);
        if (quote) {
          var quoteEl = document.createElement('div');
          quoteEl.style.cssText = 'margin-top:16px;font-size:0.95rem;color:var(--color-gold);font-style:italic;';
          quoteEl.textContent = '「' + quote + '」';
          card.appendChild(quoteEl);
        }

        self._overlay.appendChild(card);

        // 粒子效果
        self._spawnParticles(12);

        // 检查保底
        if (result.isPityTriggered) {
          setTimeout(function () { self._showPityText(); }, 800);
        }
      }, 800);
    }, 1500);
  },

  // ───────────────────────────────────────────────────────
  //  CAP-ERH-14: 保底文案
  // ───────────────────────────────────────────────────────

  _showPityText: function () {
    if (!this._overlay) return;
    var el = document.createElement('div');
    el.className = 'recruit-pity-text';
    el.textContent = '天道系统：概率保护机制激活。不用谢。';
    this._overlay.appendChild(el);
  },

  // ───────────────────────────────────────────────────────
  //  CAP-ERH-15: 跳过
  // ───────────────────────────────────────────────────────

  _skip: function () {
    this._skipRequested = true;
    // 清理故障 class（如果还在）
    document.body.classList.remove('recruit-glitch');
    this._cleanup();
  },

  // ───────────────────────────────────────────────────────
  //  辅助方法
  // ───────────────────────────────────────────────────────

  /** 创建全屏遮罩 */
  _createOverlay: function () {
    if (this._overlay) return;
    var self = this;

    var overlay = document.createElement('div');
    overlay.className = 'recruit-reveal-overlay';
    overlay.addEventListener('click', function (e) {
      // 如果正在进行多步动画，第一次点击跳过
      if (self._currentStep > 0) {
        self._skip();
      } else {
        // 已到最终展示阶段，点击关闭
        self._cleanup();
      }
    });

    document.body.appendChild(overlay);
    this._overlay = overlay;
  },

  /** 移除 overlay（但不触发 onComplete） */
  _removeOverlay: function () {
    if (this._overlay && this._overlay.parentNode) {
      this._overlay.parentNode.removeChild(this._overlay);
    }
    this._overlay = null;
  },

  /** 清理并调用完成回调 */
  _cleanup: function () {
    document.body.classList.remove('recruit-glitch');
    this._removeOverlay();
    this._isRunning = false;
    this._skipRequested = false;
    this._currentStep = 0;

    if (this._onComplete) {
      var cb = this._onComplete;
      this._onComplete = null;
      cb();
    }
  },

  /** 添加"点击跳过"提示 */
  _addSkipHint: function () {
    if (!this._overlay) return;
    var hint = document.createElement('div');
    hint.className = 'recruit-skip-hint';
    hint.textContent = '点击任意处跳过';
    this._overlay.appendChild(hint);
  },

  /** 创建武将展示卡片 */
  _createHeroCard: function (result, emojiSize) {
    var template = result.template;
    var name = template ? template.name : '???';
    var heroId = result.heroId || (template ? template.id : '');
    var title = template ? (template.title || '') : '';
    var color = this._qualityColors[result.quality] || '#aaa';
    var qName = this._qualityNames[result.quality] || '白·普通';

    var card = document.createElement('div');

    // portrait
    var emojiEl = document.createElement('div');
    emojiEl.className = 'recruit-hero-emoji';
    emojiEl.style.cssText = 'margin-bottom:8px;';
    emojiEl.innerHTML = HeroPortrait.getImgTag(heroId, parseInt(emojiSize) || 48);
    card.appendChild(emojiEl);

    // 名称 + 品质标签
    var nameRow = document.createElement('div');
    nameRow.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;';
    nameRow.innerHTML = '<span style="font-weight:bold;color:' + color + ';font-size:1.1rem;">' + name + '</span>' +
      '<span style="font-size:0.7rem;padding:2px 8px;border-radius:4px;background:' + color + '22;color:' + color + ';border:1px solid ' + color + '55;">' + qName + '</span>';
    card.appendChild(nameRow);

    // 称号
    if (title) {
      var titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-size:0.8rem;color:var(--color-text-dim);margin-bottom:4px;';
      titleEl.textContent = '「' + title + '」';
      card.appendChild(titleEl);
    }

    // 新武将标记
    if (result.isNew) {
      var newTag = document.createElement('div');
      newTag.style.cssText = 'font-size:0.85rem;color:var(--color-gold);margin-top:8px;';
      newTag.textContent = '✨ 新武将加入！';
      card.appendChild(newTag);
    }

    return card;
  },

  /** 创建十连翻牌 mini 卡片 */
  _createMiniCard: function (result) {
    var template = result.template;
    var name = template ? template.name : '???';
    var heroId = result.heroId || (template ? template.id : '');
    var color = this._qualityColors[result.quality] || '#aaa';
    var glowStyle = result.quality >= 4 ? 'box-shadow:0 0 10px ' + color + '60;' : '';

    var card = document.createElement('div');
    card.className = 'recruit-ten-card';
    card.style.borderColor = color;
    if (glowStyle) card.style.boxShadow = '0 0 10px ' + color + '60';

    card.innerHTML = '<div style="font-size:1.3rem;">' + HeroPortrait.getImgTag(heroId, 36) + '</div>' +
      '<div style="font-size:0.65rem;color:' + color + ';margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>' +
      (result.isNew ? '<div style="font-size:0.6rem;color:var(--color-gold);">✨新</div>' : '<div style="font-size:0.6rem;color:var(--color-text-dim);">→经验</div>');

    return card;
  },

  /** 获取武将专属台词 */
  _getHeroQuote: function (result) {
    var heroId = result.heroId;
    var template = result.template;
    var name = template ? template.name : '武将';

    // 尝试从 NpcDialogues 获取
    if (typeof NpcDialogues !== 'undefined' && NpcDialogues.heroes && NpcDialogues.heroes[heroId]) {
      var heroDialogues = NpcDialogues.heroes[heroId];
      if (heroDialogues.click && heroDialogues.click.length > 0) {
        var idx = Math.floor(Math.random() * heroDialogues.click.length);
        return heroDialogues.click[idx];
      }
    }

    // 回退默认台词
    return '吾乃' + name + '，请多指教！';
  },

  /** 生成粒子效果（Q5 演出用） */
  _spawnParticles: function (count) {
    if (!this._overlay) return;
    var overlay = this._overlay;

    for (var i = 0; i < count; i++) {
      var particle = document.createElement('div');
      particle.className = 'recruit-particle';

      // 随机位置（围绕中心）
      var angle = (Math.PI * 2 / count) * i;
      var radius = 60 + Math.random() * 40;
      var cx = overlay.offsetWidth / 2;
      var cy = overlay.offsetHeight / 2;
      var px = cx + Math.cos(angle) * radius;
      var py = cy + Math.sin(angle) * radius;

      particle.style.left = px + 'px';
      particle.style.top = py + 'px';
      particle.style.animationDelay = (Math.random() * 0.5) + 's';
      particle.style.animationDuration = (1.5 + Math.random()) + 's';

      // 随机颜色：金色为主，少量白色
      if (Math.random() > 0.7) {
        particle.style.background = '#fff';
      }

      overlay.appendChild(particle);
    }
  }
};
