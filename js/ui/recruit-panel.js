/** 招募面板 UI */
const RecruitPanel = {
  _container: null,
  _lastResults: null,

  _qualityColors: { 1: '#b0a898', 2: '#5d8a48', 3: '#4a7fb5', 4: '#8b5ea8', 5: '#d4a849' },
  _qualityNames: { 1: '白·普通', 2: '绿·精良', 3: '蓝·稀有', 4: '紫·史诗', 5: '橙·传说' },

  init: function () {
    this._container = document.getElementById('panel-recruit');
    this._render();

    var self = this;
    EventBus.on('recruit:result', function (data) {
      self._lastResults = data.results;
      self._render();
    });
    EventBus.on('resource:changed', function () { self._updateFooter(); });
  },

  _render: function () {
    if (!this._container) return;

    var html = '';

    // --- Header ---
    html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<span style="font-size:1.05rem;font-weight:bold;">⭐ 招募</span>';
    html += '<span style="color:var(--color-text-dim);font-size:0.85rem;">累计 ' + RecruitManager.getTotalRecruits() + ' 次</span>';
    html += '</div>';

    // --- Results Area ---
    html += this._renderResults();

    // --- Pity Bars ---
    html += this._renderPityBars();

    // --- Recruit Buttons ---
    html += this._renderButtons();

    // --- Footer: jade count ---
    html += '<div class="recruit-footer" style="text-align:center;padding:8px 0;color:var(--color-text-dim);font-size:0.85rem;">';
    html += '当前玉璧: 💎 ' + Utils.formatNumber(ResourceManager.get('jade'));
    html += '</div>';

    this._container.innerHTML = html;
    this._bindEvents();
  },

  _renderResults: function () {
    var html = '<div class="card" style="min-height:80px;">';

    if (!this._lastResults || this._lastResults.length === 0) {
      html += '<div style="text-align:center;color:var(--color-text-dim);padding:20px 0;">';
      html += '<div style="font-size:1.6rem;margin-bottom:6px;">🎴</div>';
      html += '<div>尚未招募，快来试试手气！</div>';
      html += '</div>';
      html += '</div>';
      return html;
    }

    var results = this._lastResults;
    var isTenPull = results.length > 1;

    if (isTenPull) {
      // Grid display for 10-pull
      html += '<div style="margin-bottom:6px;font-weight:bold;font-size:0.85rem;color:var(--color-gold);">🎉 十连招募结果</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">';
      for (var i = 0; i < results.length; i++) {
        html += this._renderResultCard(results[i]);
      }
      html += '</div>';
    } else {
      // Single result display
      html += '<div style="margin-bottom:6px;font-weight:bold;font-size:0.85rem;color:var(--color-gold);">🎴 招募结果</div>';
      html += this._renderSingleResult(results[0]);
    }

    html += '</div>';
    return html;
  },

  _renderResultCard: function (result) {
    var color = this._qualityColors[result.quality] || '#aaa';
    var template = result.template;
    var name = template ? template.name : '???';
    var emoji = template ? (template.emoji || '🧑') : '🧑';
    var glowStyle = result.quality >= 4 ? 'box-shadow:0 0 10px ' + color + '60;' : '';

    var html = '<div style="text-align:center;padding:6px 2px;border-radius:6px;';
    html += 'background:var(--color-secondary);border:2px solid ' + color + ';' + glowStyle + '">';
    html += '<div style="font-size:1.3rem;">' + emoji + '</div>';
    html += '<div style="font-size:0.65rem;color:' + color + ';margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>';
    if (result.isNew) {
      html += '<div style="font-size:0.6rem;color:var(--color-gold);">✨新</div>';
    } else {
      html += '<div style="font-size:0.6rem;color:var(--color-text-dim);">→经验</div>';
    }
    html += '</div>';
    return html;
  },

  _renderSingleResult: function (result) {
    var color = this._qualityColors[result.quality] || '#aaa';
    var template = result.template;
    var name = template ? template.name : '???';
    var emoji = template ? (template.emoji || '🧑') : '🧑';
    var qName = this._qualityNames[result.quality] || '白·普通';
    var title = template ? (template.title || '') : '';
    var glowStyle = result.quality >= 4 ? 'box-shadow:0 0 12px ' + color + '60;' : '';

    var html = '<div style="display:flex;align-items:center;gap:12px;padding:8px;border-radius:8px;';
    html += 'background:var(--color-secondary);border:2px solid ' + color + ';' + glowStyle + '">';
    // Emoji
    html += '<div style="font-size:2.2rem;width:50px;text-align:center;">' + emoji + '</div>';
    // Info
    html += '<div style="flex:1;">';
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">';
    html += '<span style="font-weight:bold;color:' + color + ';font-size:1rem;">' + name + '</span>';
    html += '<span style="font-size:0.65rem;padding:1px 5px;border-radius:3px;background:' + color + '22;color:' + color + ';border:1px solid ' + color + '55;">' + qName + '</span>';
    html += '</div>';
    if (title) {
      html += '<div style="font-size:0.75rem;color:var(--color-text-dim);margin-bottom:4px;">「' + title + '」</div>';
    }
    if (result.isNew) {
      html += '<div style="font-size:0.8rem;color:var(--color-gold);">✨ 新武将加入！</div>';
    } else {
      html += '<div style="font-size:0.8rem;color:var(--color-text-dim);">已拥有 → 转化为经验</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  },

  _renderPityBars: function () {
    var pity = RecruitManager.getPity();
    var html = '<div class="card">';
    html += '<div style="font-weight:bold;font-size:0.85rem;margin-bottom:8px;">保底进度</div>';

    // Blue pity (rare): 10 pulls
    html += this._renderPityBar('🔵 蓝色保底', pity.rare, 10, '#4a7fb5');
    // Purple pity (epic): 30 pulls
    html += this._renderPityBar('🟣 紫色保底', pity.epic, 30, '#8b5ea8');
    // Orange pity (legendary): 80 pulls
    html += this._renderPityBar('🟠 橙色保底', pity.legendary, 80, '#d4a849');

    html += '</div>';
    return html;
  },

  _renderPityBar: function (label, current, max, color) {
    var pct = Math.min(100, Math.floor((current / max) * 100));
    var html = '<div style="margin-bottom:8px;">';
    html += '<div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:3px;">';
    html += '<span>' + label + '</span>';
    html += '<span style="color:' + color + ';">' + current + '/' + max + '</span>';
    html += '</div>';
    html += '<div style="height:8px;background:var(--color-bg);border-radius:4px;overflow:hidden;">';
    html += '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:4px;transition:width 0.3s;"></div>';
    html += '</div>';
    html += '</div>';
    return html;
  },

  _renderButtons: function () {
    var jade = ResourceManager.get('jade');
    var canSingle = jade >= 100;
    var canTen = jade >= 900;
    var freeAvail = RecruitManager.isFreeRecruitAvailable();

    var html = '<div class="card">';

    // Main buttons row
    html += '<div style="display:flex;gap:8px;margin-bottom:8px;">';

    // Single recruit button
    html += '<button class="btn recruit-btn-single" style="flex:1;padding:12px 8px;font-size:0.9rem;';
    if (!canSingle) html += 'opacity:0.5;cursor:not-allowed;';
    html += '"';
    if (!canSingle) html += ' disabled';
    html += '>';
    html += '<div>单抽</div>';
    html += '<div style="font-size:0.75rem;margin-top:2px;">💎×100</div>';
    html += '</button>';

    // Ten recruit button
    html += '<button class="btn recruit-btn-ten" style="flex:1.5;padding:12px 8px;font-size:0.9rem;';
    html += 'background:linear-gradient(135deg,var(--color-primary),#c0392b);';
    if (!canTen) html += 'opacity:0.5;cursor:not-allowed;';
    html += '"';
    if (!canTen) html += ' disabled';
    html += '>';
    html += '<div>十连</div>';
    html += '<div style="font-size:0.75rem;margin-top:2px;">💎×900 <span style="color:var(--color-gold);">(9折)</span></div>';
    html += '</button>';

    html += '</div>';

    // Free recruit button
    if (freeAvail) {
      html += '<button class="btn recruit-btn-free" style="width:100%;padding:10px;font-size:0.9rem;';
      html += 'background:linear-gradient(135deg,var(--color-success),#3d6a30);';
      html += 'animation:recruit-free-pulse 1.5s ease-in-out infinite;">';
      html += '🎁 免费单抽（保底蓝色+）';
      html += '</button>';
      html += '<style>@keyframes recruit-free-pulse{0%,100%{box-shadow:0 0 4px #5d8a4866;}50%{box-shadow:0 0 12px #5d8a48aa;}}</style>';
    }

    html += '</div>';
    return html;
  },

  _updateFooter: function () {
    if (!this._container) return;
    var footer = this._container.querySelector('.recruit-footer');
    if (footer) {
      footer.innerHTML = '当前玉璧: 💎 ' + Utils.formatNumber(ResourceManager.get('jade'));
    }
    // Also update button states
    var jade = ResourceManager.get('jade');
    var singleBtn = this._container.querySelector('.recruit-btn-single');
    var tenBtn = this._container.querySelector('.recruit-btn-ten');
    if (singleBtn) {
      singleBtn.disabled = jade < 100;
      singleBtn.style.opacity = jade < 100 ? '0.5' : '1';
      singleBtn.style.cursor = jade < 100 ? 'not-allowed' : 'pointer';
    }
    if (tenBtn) {
      tenBtn.disabled = jade < 900;
      tenBtn.style.opacity = jade < 900 ? '0.5' : '1';
      tenBtn.style.cursor = jade < 900 ? 'not-allowed' : 'pointer';
    }
  },

  _bindEvents: function () {
    var self = this;

    var singleBtn = this._container.querySelector('.recruit-btn-single');
    if (singleBtn) {
      singleBtn.addEventListener('click', function () { self._onSingleRecruit(); });
    }

    var tenBtn = this._container.querySelector('.recruit-btn-ten');
    if (tenBtn) {
      tenBtn.addEventListener('click', function () { self._onTenRecruit(); });
    }

    var freeBtn = this._container.querySelector('.recruit-btn-free');
    if (freeBtn) {
      freeBtn.addEventListener('click', function () { self._onFreeRecruit(); });
    }
  },

  _onSingleRecruit: function () { RecruitManager.recruitSingle(); },
  _onTenRecruit: function () { RecruitManager.recruitTen(); },
  _onFreeRecruit: function () { RecruitManager.freeRecruit(); }
};
