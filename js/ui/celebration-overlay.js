/**
 * 庆祝覆盖层 — 全屏庆祝效果
 * 用于章节通关、获得稀有武将、成就达成等关键时刻
 */
const CelebrationOverlay = {
  _overlay: null,
  _queue: [],
  _showing: false,

  init: function () {
    this._overlay = document.createElement('div');
    this._overlay.className = 'celebration-overlay';
    this._overlay.style.display = 'none';
    document.body.appendChild(this._overlay);

    var self = this;

    // 监听章节Boss首杀
    EventBus.on('battle:ended', function (data) {
      if (data.result !== 'victory' || !data.isFirstClear) return;
      var stage = BattleManager.getCurrentStage();
      if (!stage || !stage.isBoss) return;
      self._queueChapterClear(stage);
    });

    // 监听获得新武将（紫色及以上）
    EventBus.on('hero:added', function (hero) {
      var template = HeroManager.getTemplate(hero.id);
      if (!template || template.quality < CONSTANTS.QUALITY.EPIC) return;
      self._queueHeroAcquired(template);
    });

    // 监听成就达成
    EventBus.on('achievement:milestone', function (data) {
      self._queueAchievement(data);
    });

    // 点击关闭
    this._overlay.addEventListener('click', function () {
      self._dismiss();
    });
  },

  // ---------- 排队展示 ----------

  _enqueue: function (renderFn) {
    this._queue.push(renderFn);
    if (!this._showing) {
      this._showNext();
    }
  },

  _showNext: function () {
    if (this._queue.length === 0) {
      this._showing = false;
      this._overlay.style.display = 'none';
      return;
    }
    this._showing = true;
    var renderFn = this._queue.shift();
    renderFn();
    this._overlay.style.display = 'flex';
  },

  _dismiss: function () {
    this._overlay.classList.add('celebration-exit');
    var self = this;
    setTimeout(function () {
      self._overlay.classList.remove('celebration-exit');
      self._showNext();
    }, 300);
  },

  // ---------- 章节通关 ----------

  _queueChapterClear: function (stage) {
    var self = this;
    var chapterNames = {
      1: '外卖风云', 2: '地产争霸', 3: '直播大战',
      4: '金融暗涌', 5: '科技称帝', 6: '人工智能',
      7: '元宇宙', 8: '星际征途', 9: '时空裂隙',
      10: '鸿蒙天道', 11: '混沌初开', 12: '创世之战',
      13: '永恒轮回', 14: '维度折叠', 15: '终极奥义'
    };
    var chName = chapterNames[stage.chapter] || ('第' + stage.chapter + '章');

    this._enqueue(function () {
      var html = '<div class="celebration-content chapter-clear">';
      html += '<div class="celebration-particles">';
      for (var i = 0; i < 20; i++) {
        html += '<span class="particle" style="--i:' + i + '"></span>';
      }
      html += '</div>';
      html += '<div class="celebration-icon">⚔️</div>';
      html += '<div class="celebration-title">章节通关！</div>';
      html += '<div class="celebration-subtitle">第' + stage.chapter + '章 · ' + chName + '</div>';
      html += '<div class="celebration-boss">击败 Boss: ' + (stage.enemies[0] ? stage.enemies[0].name : '???') + '</div>';
      html += '<div class="celebration-hint">点击任意处继续</div>';
      html += '</div>';
      self._overlay.innerHTML = html;
    });
  },

  // ---------- 获得稀有武将 ----------

  _queueHeroAcquired: function (template) {
    var self = this;
    var qualityNames = { 4: '紫色·史诗', 5: '橙色·传说', 6: '红色·神话' };
    var qualityColors = { 4: '#a855f7', 5: '#f59e0b', 6: '#ef4444' };
    var qName = qualityNames[template.quality] || '稀有';
    var qColor = qualityColors[template.quality] || '#a855f7';

    this._enqueue(function () {
      var html = '<div class="celebration-content hero-acquired" style="--quality-color:' + qColor + '">';
      html += '<div class="celebration-particles">';
      for (var i = 0; i < 15; i++) {
        html += '<span class="particle" style="--i:' + i + '"></span>';
      }
      html += '</div>';
      html += '<div class="celebration-hero-emoji">' + HeroPortrait.getImgTag(template.id, 64) + '</div>';
      html += '<div class="celebration-hero-quality" style="color:' + qColor + '">' + qName + '</div>';
      html += '<div class="celebration-title">' + template.name + '</div>';
      html += '<div class="celebration-hero-title">' + (template.title || '') + '</div>';
      if (template.faction) {
        var factionEmoji = { shu: '🟢蜀', wei: '🔵魏', wu: '🔴吴', qun: '🟡群' };
        html += '<div class="celebration-hero-faction">' + (factionEmoji[template.faction] || template.faction) + '</div>';
      }
      html += '<div class="celebration-hint">点击任意处继续</div>';
      html += '</div>';
      self._overlay.innerHTML = html;
    });
  },

  // ---------- 成就达成 ----------

  _queueAchievement: function (data) {
    var self = this;
    this._enqueue(function () {
      var html = '<div class="celebration-content achievement-unlock">';
      html += '<div class="celebration-icon">' + UIIcons.icon('achievement', 'ui-icon-xl') + '</div>';
      html += '<div class="celebration-title">成就达成！</div>';
      html += '<div class="celebration-subtitle">' + (data.name || '未知成就') + '</div>';
      if (data.description) {
        html += '<div class="celebration-desc">' + data.description + '</div>';
      }
      html += '<div class="celebration-hint">点击任意处继续</div>';
      html += '</div>';
      self._overlay.innerHTML = html;
    });
  }
};
