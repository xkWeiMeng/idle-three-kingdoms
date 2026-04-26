/** 剧情面板 UI */
const StoryPanel = {
  _container: null,
  _selectedChapter: null,
  _selectedCharacter: null,
  _latestMonologue: null,

  _qualityColors: { 1: '#b0a898', 2: '#5d8a48', 3: '#4a7fb5', 4: '#8b5ea8', 5: '#d4a849' },
  _qualityNames: { 1: '白', 2: '绿', 3: '蓝', 4: '紫', 5: '橙' },
  _speakerEmojis: {
    '天道系统': '🖥️', '玩家': '🎮', '旁白': '📜',
    '诸葛亮': '🧠', '刘备': '👑', '关羽': '⚔️', '张飞': '🗣️',
    '赵云': '🐉', '黄忠': '🏹', '马超': '🐎',
    '曹操': '👞', '司马懿': '🦊', '夏侯惇': '🛡️',
    '张辽': '📦', '典韦': '🛡️', '荀彧': '📊',
    '孙权': '📱', '周瑜': '🎵', '孙尚香': '🎯', '太史慈': '📡',
    '吕布': '🧋', '貂蝉': '💄', '华佗': '💊'
  },

  init() {
    this._container = document.getElementById('panel-story');
    this._render();
    EventBus.on('story:monologue', (data) => {
      this._latestMonologue = data;
      this._updateMonologue();
    });
    EventBus.on('story:chapter_unlocked', () => this._render());
    EventBus.on('tab:switched', (tabId) => {
      if (tabId === 'story') this._render();
    });
  },

  _render() {
    if (!this._container) return;
    this._container.innerHTML =
      '<h3 style="margin-bottom:10px;">📖 剧情</h3>' +
      '<div data-monologue-section>' + this._renderMonologue() + '</div>' +
      this._renderChapters() +
      (this._selectedChapter !== null ? this._renderChapterDetail(this._selectedChapter) : '') +
      this._renderCharacterFiles();
    this._bindEvents();
  },

  _renderMonologue() {
    var state = StoryManager.getState();
    var m = this._latestMonologue || state.latestMonologue;
    if (!m) {
      return '<div class="card">' +
        '<div style="font-size:12px;color:var(--color-text-dim);margin-bottom:4px;">💬 最新独白:</div>' +
        '<div style="color:var(--color-text-dim);">暂无，等待武将发言中...</div>' +
        '</div>';
    }
    var emoji = this._speakerEmojis[m.speaker] || '💬';
    return '<div class="card" style="border-color:var(--color-secondary);">' +
      '<div style="font-size:12px;color:var(--color-text-dim);margin-bottom:6px;">💬 最新独白:</div>' +
      '<div class="card" style="background:rgba(15,52,96,0.3);margin-bottom:0;">' +
        '<div style="font-weight:bold;margin-bottom:4px;">' + emoji + ' ' + m.speaker + ':</div>' +
        '<div style="font-style:italic;color:var(--color-text);line-height:1.6;">"' + m.text + '"</div>' +
      '</div>' +
    '</div>';
  },

  _updateMonologue() {
    if (!this._container) return;
    var el = this._container.querySelector('[data-monologue-section]');
    if (el) {
      el.outerHTML = '<div data-monologue-section>' + this._renderMonologue() + '</div>';
    } else {
      this._render();
    }
  },

  _renderChapters() {
    var state = StoryManager.getState();
    var completed = new Set(state.completedChapters || []);
    var currentId = state.currentChapter;

    var allChapters = [MainStory.prologue].concat(MainStory.chapters);
    var items = '';
    for (var i = 0; i < allChapters.length; i++) {
      var ch = allChapters[i];
      var isCompleted = completed.has(ch.id);
      var isCurrent = ch.id === currentId;
      var isLocked = !isCompleted && !isCurrent;
      var icon = isCompleted ? '✅' : (isCurrent ? '📖' : UIIcons.icon('lock'));
      var color = isLocked ? 'var(--color-text-dim)' : 'var(--color-text)';
      var cursor = isLocked ? 'default' : 'pointer';
      var bg = (this._selectedChapter === i) ? 'rgba(233,69,96,0.15)' : 'transparent';
      items += '<div class="story-chapter-item" data-chapter-idx="' + i + '" ' +
        'style="padding:8px;cursor:' + cursor + ';color:' + color + ';border-radius:4px;' +
        'margin-bottom:4px;background:' + bg + ';' +
        (isLocked ? 'opacity:0.5;' : '') + '">' +
        '[' + icon + '] ' + ch.title +
        '</div>';
    }

    return '<div class="card">' +
      '<h4 style="margin-bottom:8px;">📚 故事章节:</h4>' +
      items +
      '</div>';
  },

  _renderChapterDetail(chapterIdx) {
    var allChapters = [MainStory.prologue].concat(MainStory.chapters);
    if (chapterIdx < 0 || chapterIdx >= allChapters.length) return '';

    var ch = allChapters[chapterIdx];
    var state = StoryManager.getState();
    var completed = new Set(state.completedChapters || []);
    var currentId = state.currentChapter;
    var isAccessible = completed.has(ch.id) || ch.id === currentId;
    if (!isAccessible) return '';

    var seen = new Set(state.seenScenes || []);
    var scenes = ch.scenes || [];
    var seenCount = 0;
    for (var i = 0; i < scenes.length; i++) {
      if (seen.has(scenes[i].id)) seenCount++;
    }

    var sceneHtml = '';
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var isSeen = seen.has(s.id);
      var speaker = s.speaker || '旁白';
      var emoji = this._speakerEmojis[speaker] || '💬';
      var cls = this._sceneTypeClass(s.type);
      var textStyle = '';
      if (s.type === 'narration') textStyle = 'font-style:italic;color:var(--color-text-dim);';
      else if (s.type === 'system') textStyle = 'font-family:monospace;color:var(--color-success);';

      sceneHtml += '<div class="card ' + cls + '" style="margin-bottom:6px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<span>' + emoji + ' <strong>' + speaker + '</strong></span>' +
          '<span style="font-size:11px;color:' + (isSeen ? 'var(--color-success)' : 'var(--color-text-dim)') + ';">' +
            (isSeen ? '✅已读' : '⭕未读') +
          '</span>' +
        '</div>' +
        '<div style="line-height:1.6;' + textStyle + '">' + s.text + '</div>' +
        (!isSeen ? '<div style="margin-top:6px;"><button class="btn btn-mark-seen" data-scene-id="' + s.id + '" style="font-size:12px;padding:3px 10px;">标记已读</button></div>' : '') +
      '</div>';
    }

    return '<div class="card" style="border-color:var(--color-gold);">' +
      '<h4 style="margin-bottom:4px;">📖 ' + ch.title + '</h4>' +
      '<div style="font-size:12px;color:var(--color-text-dim);margin-bottom:8px;">' +
        ch.description + ' （已读 ' + seenCount + '/' + scenes.length + '）' +
      '</div>' +
      '<div style="text-align:right;margin-bottom:8px;">' +
        '<button class="btn btn-mark-all" style="font-size:12px;padding:3px 10px;background:var(--color-secondary);" ' +
          (seenCount >= scenes.length ? 'disabled' : '') + '>全部标记已读</button>' +
      '</div>' +
      sceneHtml +
    '</div>';
  },

  _renderCharacterFiles() {
    var profileIds = Object.keys(CharacterProfiles);
    if (profileIds.length === 0) return '';

    var grid = '';
    for (var i = 0; i < profileIds.length; i++) {
      var p = CharacterProfiles[profileIds[i]];
      var q = p.quality || 0;
      var borderColor = this._qualityColors[q] || 'var(--color-secondary)';
      var isSelected = this._selectedCharacter === profileIds[i];
      var bg = isSelected ? 'rgba(233,69,96,0.2)' : 'var(--color-surface)';
      var emoji = this._speakerEmojis[p.name] || '👤';
      grid += '<div class="story-char-btn" data-char-id="' + profileIds[i] + '" ' +
        'style="display:inline-block;padding:6px 10px;margin:3px;border-radius:4px;cursor:pointer;' +
        'border:1px solid ' + borderColor + ';background:' + bg + ';font-size:13px;text-align:center;">' +
        emoji + '<br><span style="font-size:11px;">' + p.name + '</span>' +
      '</div>';
    }

    var profileHtml = '';
    if (this._selectedCharacter) {
      profileHtml = this._renderCharacterProfile(this._selectedCharacter);
    }

    return '<div class="card">' +
      '<h4 style="margin-bottom:8px;">🎭 角色档案:</h4>' +
      '<div style="display:flex;flex-wrap:wrap;">' + grid + '</div>' +
    '</div>' + profileHtml;
  },

  _renderCharacterProfile(charId) {
    var p = CharacterProfiles[charId];
    if (!p) return '';
    var q = p.quality || 0;
    var badgeColor = this._qualityColors[q] || '#aaa';
    var badgeName = q ? ('★' + q + ' ' + this._qualityNames[q]) : '';
    var emoji = this._speakerEmojis[p.name] || '👤';

    // Quirks
    var quirksHtml = '';
    if (p.quirks && p.quirks.length > 0) {
      quirksHtml = '<div style="margin-top:8px;"><strong>怪癖：</strong><ul style="margin-left:16px;margin-top:4px;">';
      for (var i = 0; i < p.quirks.length; i++) {
        quirksHtml += '<li style="margin-bottom:2px;font-size:13px;color:var(--color-text-dim);">' + p.quirks[i] + '</li>';
      }
      quirksHtml += '</ul></div>';
    }

    // Random dialogues from each category
    var dialogueHtml = '';
    var dialogues = CharacterDialogues[charId];
    if (dialogues) {
      var categoryNames = { greet: '🤝 招呼', upgrade: '⬆️ 升级', battle: UIIcons.iconText('battle', '战斗'), gift: '🎁 送礼', special: '✨ 特殊' };
      dialogueHtml = '<div style="margin-top:10px;"><strong>💬 角色语录：</strong>';
      var cats = Object.keys(dialogues);
      for (var c = 0; c < cats.length; c++) {
        var cat = cats[c];
        var lines = dialogues[cat];
        if (!lines || lines.length === 0) continue;
        var line = lines[Utils.randInt(0, lines.length - 1)];
        var catName = categoryNames[cat] || cat;
        dialogueHtml += '<div class="card" style="margin-top:6px;margin-bottom:0;padding:8px;background:rgba(15,52,96,0.3);">' +
          '<div style="font-size:11px;color:var(--color-text-dim);margin-bottom:2px;">' + catName + '</div>' +
          '<div style="font-size:13px;font-style:italic;">"' + line + '"</div>' +
        '</div>';
      }
      dialogueHtml += '</div>';
    }

    return '<div class="card" style="border-color:' + badgeColor + ';">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<span style="font-size:2rem;">' + emoji + '</span>' +
        '<div>' +
          '<div style="font-size:1.1rem;font-weight:bold;">' + p.name +
            (badgeName ? ' <span style="font-size:12px;color:' + badgeColor + ';border:1px solid ' + badgeColor + ';border-radius:3px;padding:1px 5px;">' + badgeName + '</span>' : '') +
          '</div>' +
          '<div style="font-size:12px;color:var(--color-gold);">' + (p.title || '') + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:13px;line-height:1.8;">' +
        '<div>📜 <strong>正史身份：</strong>' + (p.originalRole || '—') + '</div>' +
        '<div>🎭 <strong>当前身份：</strong>' + (p.currentRole || '—') + '</div>' +
        '<div>💡 <strong>性格特征：</strong>' + (p.personality || '—') + '</div>' +
        (p.appearance ? '<div>👔 <strong>外貌描述：</strong>' + p.appearance + '</div>' : '') +
      '</div>' +
      quirksHtml +
      dialogueHtml +
    '</div>';
  },

  _sceneTypeClass(type) {
    if (type === 'system') return 'story-system';
    if (type === 'narration') return 'story-narration';
    return 'story-dialogue';
  },

  _bindEvents() {
    var self = this;
    var state = StoryManager.getState();
    var completed = new Set(state.completedChapters || []);
    var currentId = state.currentChapter;
    var allChapters = [MainStory.prologue].concat(MainStory.chapters);

    // Chapter clicks
    this._container.querySelectorAll('.story-chapter-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var idx = parseInt(el.getAttribute('data-chapter-idx'));
        var ch = allChapters[idx];
        if (!ch) return;
        var accessible = completed.has(ch.id) || ch.id === currentId;
        if (!accessible) return;
        self._selectedChapter = (self._selectedChapter === idx) ? null : idx;
        self._render();
      });
    });

    // Mark scene seen
    this._container.querySelectorAll('.btn-mark-seen').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var sceneId = btn.getAttribute('data-scene-id');
        StoryManager.markSceneSeen(sceneId);
        self._render();
      });
    });

    // Mark all seen
    this._container.querySelectorAll('.btn-mark-all').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (self._selectedChapter === null) return;
        var ch = allChapters[self._selectedChapter];
        if (!ch) return;
        var scenes = ch.scenes || [];
        for (var i = 0; i < scenes.length; i++) {
          StoryManager.markSceneSeen(scenes[i].id);
        }
        self._render();
      });
    });

    // Character file clicks
    this._container.querySelectorAll('.story-char-btn').forEach(function (el) {
      el.addEventListener('click', function () {
        var charId = el.getAttribute('data-char-id');
        self._selectedCharacter = (self._selectedCharacter === charId) ? null : charId;
        self._render();
      });
    });
  }
};
