/** 武将面板 UI */
const HeroPanel = {
  _container: null,
  _selectedHero: null,

  _qualityColors: { 1: '#b0a898', 2: '#5d8a48', 3: '#4a7fb5', 4: '#8b5ea8', 5: '#d4a849' },
  _qualityNames: { 1: '白', 2: '绿', 3: '蓝', 4: '紫', 5: '橙' },
  _equipSlotNames: { weapon: '⚔武器', armor: '🛡防具', accessory: '💍饰品', mount: '🐴坐骑' },

  init: function () {
    this._container = document.getElementById('panel-heroes');
    this._render();

    var self = this;
    EventBus.on('hero:added', function () { self._render(); });
    EventBus.on('hero:levelup', function () { self._render(); });
    EventBus.on('hero:ascended', function () { self._render(); });
    EventBus.on('hero:team_changed', function () { self._render(); });
    EventBus.on('equip:changed', function () { self._render(); });
    EventBus.on('resource:changed', function () { self._render(); });
    EventBus.on('hero:skill_changed', function () { self._render(); });
  },

  _render: function () {
    if (!this._container) return;
    var self = this;
    var heroes = HeroManager.getAll();
    var teamUids = HeroManager.getTeamUids();

    var html = '';

    // --- Header ---
    html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<span style="font-size:1.05rem;font-weight:bold;">⚔️ 我的武将</span>';
    html += '<span style="color:var(--color-text-dim);font-size:0.85rem;">' + heroes.length + '/20</span>';
    html += '</div>';

    // --- Team Section ---
    html += '<div class="card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
    html += '<span style="font-weight:bold;">🎯 当前阵容</span>';
    html += '<span style="color:var(--color-text-dim);font-size:0.85rem;">' + teamUids.length + '/' + CONSTANTS.MAX_TEAM_SIZE + '</span>';
    html += '</div>';
    html += this._renderTeamSlots(teamUids);
    html += '</div>';

    // --- Hero List ---
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0 6px;">';
    html += '<span style="font-weight:bold;">📋 全部武将</span>';
    html += '</div>';

    for (var i = 0; i < heroes.length; i++) {
      html += this._renderHeroCard(heroes[i]);
    }

    if (heroes.length === 0) {
      html += '<div class="card" style="text-align:center;color:var(--color-text-dim);">暂无武将，去招募吧！</div>';
    }

    this._container.innerHTML = html;
    this._bindEvents();
  },

  _renderTeamSlots: function (teamUids) {
    var html = '<div style="display:flex;gap:6px;">';
    for (var i = 0; i < CONSTANTS.MAX_TEAM_SIZE; i++) {
      if (i < teamUids.length) {
        var hero = HeroManager.getHeroByUid(teamUids[i]);
        var template = hero ? HeroManager.getTemplate(hero.id) : null;
        if (hero && template) {
          var color = this._qualityColors[template.quality] || '#aaa';
          html += '<div class="hero-team-slot" data-remove-uid="' + hero.uid + '" ';
          html += 'style="flex:1;text-align:center;padding:8px 2px;border-radius:6px;cursor:pointer;';
          html += 'background:var(--color-secondary);border:2px solid ' + color + ';';
          html += 'transition:opacity 0.2s;" title="点击移出队伍">';
          html += '<div style="font-size:1.2rem;">' + (template.emoji || '🧑') + '</div>';
          html += '<div style="font-size:0.7rem;color:' + color + ';margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + template.name + '</div>';
          html += '<div style="font-size:0.6rem;color:var(--color-text-dim);">Lv.' + hero.level + (hero.stars ? ' ★' + hero.stars : '') + '</div>';
          html += '</div>';
        } else {
          html += '<div style="flex:1;text-align:center;padding:8px;border-radius:6px;background:var(--color-secondary);border:2px dashed var(--color-text-dim);opacity:0.5;">';
          html += '<div style="font-size:1.2rem;color:var(--color-text-dim);">?</div>';
          html += '</div>';
        }
      } else {
        html += '<div style="flex:1;text-align:center;padding:8px;border-radius:6px;background:var(--color-secondary);border:2px dashed var(--color-text-dim);opacity:0.4;">';
        html += '<div style="font-size:1.2rem;color:var(--color-text-dim);">+</div>';
        html += '</div>';
      }
    }
    html += '</div>';
    return html;
  },

  _renderHeroCard: function (hero) {
    var template = HeroManager.getTemplate(hero.id);
    if (!template) return '';

    var quality = template.quality || 1;
    var color = this._qualityColors[quality] || '#aaa';
    var qName = this._qualityNames[quality] || '白';
    var stats = HeroManager.getHeroStats(hero.uid);
    var power = HeroManager.getBattlePower(hero.uid);
    var inTeam = HeroManager.isInTeam(hero.uid);
    var expCost = HeroManager.getExpCost(hero.level);
    var currentExp = ResourceManager.get(CONSTANTS.RESOURCE.EXP);
    var maxLevel = HeroManager.getMaxLevel(hero.uid);
    var ascendInfo = HeroManager.getAscendInfo(hero.uid);
    var canLevel = hero.level < maxLevel && currentExp >= expCost;
    var isMaxLevel = hero.level >= maxLevel;
    var skillDefs = (typeof HeroSkillData !== 'undefined') ? HeroSkillData[hero.id] : null;
    var heroSkillLevels = hero.skillLevels || [0, 0, 0];
    var availSP = HeroManager.getAvailableSkillPoints(hero.uid);

    // Quality glow for epic/legendary
    var glowStyle = '';
    if (quality >= 4) {
      glowStyle = 'box-shadow:0 0 8px ' + color + '40;';
    }

    var html = '';
    html += '<div class="card" style="display:flex;gap:0;padding:0;overflow:hidden;' + glowStyle + '">';

    // Quality color bar
    html += '<div style="width:5px;background:' + color + ';flex-shrink:0;"></div>';

    // Card content
    html += '<div style="flex:1;padding:10px;">';

    // Row 1: Name, quality badge, level, power
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">';
    html += '<span style="font-size:1.1rem;">' + (template.emoji || '🧑') + '</span>';
    html += '<span style="font-weight:bold;color:' + color + ';">' + template.name + '</span>';
    if (ascendInfo && ascendInfo.stars > 0) {
      html += '<span style="font-size:0.7rem;color:var(--color-gold);">' + '★'.repeat(ascendInfo.stars) + '</span>';
    }
    html += '<span style="font-size:0.65rem;padding:1px 5px;border-radius:3px;background:' + color + '22;color:' + color + ';border:1px solid ' + color + '55;">' + qName + '</span>';
    html += '<span style="font-size:0.8rem;color:var(--color-gold);">Lv.' + hero.level + '</span>';
    html += '<span style="margin-left:auto;font-size:0.75rem;color:var(--color-text-dim);">⚡' + Utils.formatNumber(power) + '</span>';
    html += '</div>';

    // Row 2: Title
    if (template.title) {
      html += '<div style="font-size:0.75rem;color:var(--color-text-dim);margin-bottom:6px;">「' + template.title + '」</div>';
    }

    // Row 3: Stats
    if (stats) {
      html += '<div style="display:flex;gap:8px;font-size:0.78rem;margin-bottom:6px;flex-wrap:wrap;">';
      html += '<span style="color:#c0392b;">⚔' + stats.atk + '</span>';
      html += '<span style="color:#4a7fb5;">🛡' + stats.def + '</span>';
      html += '<span style="color:#5d8a48;">❤' + stats.hp + '</span>';
      html += '<span style="color:#c98a2e;">💨' + stats.spd + '</span>';
      html += '</div>';
    }

    // Row 4: Skills info
    if (skillDefs) {
      html += '<div style="font-size:0.72rem;color:var(--color-text-dim);margin-bottom:6px;display:flex;align-items:center;flex-wrap:wrap;gap:3px;">';
      html += '<span>✨</span>';
      for (var si = 0; si < skillDefs.length; si++) {
        var sklv = heroSkillLevels[si] || 0;
        var skColor = (si === 0 || sklv > 0) ? 'var(--color-gold)' : 'var(--color-text-dim)';
        html += '<span style="color:' + skColor + ';">' + (skillDefs[si].icon || '✨') + skillDefs[si].name + ' <small>Lv.' + sklv + '</small></span>';
        if (si < skillDefs.length - 1) html += '<span style="color:var(--color-text-dim);">·</span>';
      }
      if (availSP > 0) {
        html += '<span style="color:var(--color-primary);font-weight:bold;margin-left:4px;">SP:' + availSP + '</span>';
      }
      html += '</div>';
    } else if (template.skill) {
      html += '<div style="font-size:0.72rem;color:var(--color-text-dim);margin-bottom:6px;">';
      html += '✨ ' + template.skill.name;
      if (template.skill.description) {
        html += ' - ' + template.skill.description;
      }
      html += '</div>';
    }

    // Row 5: EXP progress bar
    if (!isMaxLevel) {
      var expPct = Math.min(100, Math.floor((currentExp / expCost) * 100));
      html += '<div style="margin-bottom:8px;">';
      html += '<div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--color-text-dim);margin-bottom:2px;">';
      html += '<span>经验</span>';
      html += '<span>' + Utils.formatNumber(currentExp) + ' / ' + Utils.formatNumber(expCost) + '</span>';
      html += '</div>';
      html += '<div style="height:6px;background:var(--color-bg);border-radius:3px;overflow:hidden;">';
      html += '<div style="height:100%;width:' + expPct + '%;background:var(--color-gold);border-radius:3px;transition:width 0.3s;"></div>';
      html += '</div>';
      html += '</div>';
    } else {
      if (ascendInfo && ascendInfo.stars < ascendInfo.maxStars) {
        html += '<div style="font-size:0.72rem;color:var(--color-gold);margin-bottom:8px;">🏆 已达满级 — 可突破！</div>';
      } else {
        html += '<div style="font-size:0.72rem;color:var(--color-gold);margin-bottom:8px;">🏆 已达最终满级</div>';
      }
    }

    // Row 6: Equipment slots
    html += '<div style="display:flex;gap:4px;margin-bottom:8px;">';
    var slotKeys = ['weapon', 'armor', 'accessory', 'mount'];
    for (var s = 0; s < slotKeys.length; s++) {
      var slot = slotKeys[s];
      var equipUid = hero.equipment ? hero.equipment[slot] : null;
      var equip = equipUid && typeof EquipmentManager !== 'undefined' ? EquipmentManager.getEquipment(equipUid) : null;

      if (equip) {
        var eColor = this._qualityColors[equip.quality] || '#aaa';
        html += '<div style="width:36px;height:36px;border-radius:4px;display:flex;align-items:center;justify-content:center;';
        html += 'background:var(--color-bg);border:1px solid ' + eColor + ';font-size:1rem;" ';
        html += 'title="' + equip.name + '">' + EquipmentPanel._equipIcon(equip, 28) + '</div>';
      } else {
        html += '<div style="width:36px;height:36px;border-radius:4px;display:flex;align-items:center;justify-content:center;';
        html += 'background:var(--color-bg);border:1px dashed var(--color-text-dim);font-size:0.7rem;color:var(--color-text-dim);" ';
        html += 'title="' + this._equipSlotNames[slot] + '">' + this._equipSlotNames[slot].charAt(0) + '</div>';
      }
    }
    html += '</div>';

    // Row 7: Action buttons
    html += '<div style="display:flex;gap:6px;">';

    // Skill button
    if (skillDefs) {
      html += '<button class="btn hero-btn-skills" data-uid="' + hero.uid + '" ';
      html += 'style="font-size:0.78rem;background:var(--color-secondary);position:relative;">';
      html += '✨技能';
      if (availSP > 0) html += '<span style="position:absolute;top:-5px;right:-5px;background:var(--color-primary);color:#fff;font-size:0.55rem;min-width:14px;height:14px;display:flex;align-items:center;justify-content:center;border-radius:8px;">' + availSP + '</span>';
      html += '</button>';
    }

    // Team toggle
    if (inTeam) {
      html += '<button class="btn hero-btn-team" data-uid="' + hero.uid + '" ';
      html += 'style="flex:1;font-size:0.78rem;background:var(--color-secondary);">移出队伍</button>';
    } else {
      var teamFull = HeroManager.getTeamUids().length >= CONSTANTS.MAX_TEAM_SIZE;
      html += '<button class="btn hero-btn-team" data-uid="' + hero.uid + '" ';
      html += 'style="flex:1;font-size:0.78rem;"';
      if (teamFull) html += ' disabled';
      html += '>加入队伍</button>';
    }

    // Level up
    if (!isMaxLevel) {
      html += '<button class="btn hero-btn-levelup" data-uid="' + hero.uid + '" ';
      html += 'style="flex:1;font-size:0.78rem;background:var(--color-gold);color:#111;"';
      if (!canLevel) html += ' disabled';
      html += '>升级 ⭐' + Utils.formatNumber(expCost) + '</button>';
    } else if (ascendInfo && ascendInfo.stars < ascendInfo.maxStars) {
      var aCost = ascendInfo.cost;
      html += '<button class="btn hero-btn-ascend" data-uid="' + hero.uid + '" ';
      html += 'style="flex:1;font-size:0.78rem;background:linear-gradient(135deg,#c0392b,#d4a849);color:#fff;"';
      if (!ascendInfo.canAscend) html += ' disabled';
      html += '>突破 ⭐→' + (ascendInfo.stars + 1) + '星</button>';
    }

    html += '</div>';

    html += '</div>'; // card content
    html += '</div>'; // card
    return html;
  },

  _bindEvents: function () {
    var self = this;

    // Team slot remove buttons
    var removeSlots = this._container.querySelectorAll('.hero-team-slot');
    for (var i = 0; i < removeSlots.length; i++) {
      removeSlots[i].addEventListener('click', function () {
        var uid = this.getAttribute('data-remove-uid');
        if (uid) self._onToggleTeam(uid);
      });
    }

    // Team toggle buttons
    var teamBtns = this._container.querySelectorAll('.hero-btn-team');
    for (var j = 0; j < teamBtns.length; j++) {
      teamBtns[j].addEventListener('click', function () {
        var uid = this.getAttribute('data-uid');
        if (uid) self._onToggleTeam(uid);
      });
    }

    // Level up buttons
    var lvlBtns = this._container.querySelectorAll('.hero-btn-levelup');
    for (var k = 0; k < lvlBtns.length; k++) {
      lvlBtns[k].addEventListener('click', function () {
        var uid = this.getAttribute('data-uid');
        if (uid) self._onLevelUp(uid);
      });
    }

    // Ascend buttons
    var ascBtns = this._container.querySelectorAll('.hero-btn-ascend');
    for (var m = 0; m < ascBtns.length; m++) {
      ascBtns[m].addEventListener('click', function () {
        var uid = this.getAttribute('data-uid');
        if (uid) self._onAscend(uid);
      });
    }

    // Skill buttons
    var skillBtns = this._container.querySelectorAll('.hero-btn-skills');
    for (var si = 0; si < skillBtns.length; si++) {
      skillBtns[si].addEventListener('click', function () {
        var uid = this.getAttribute('data-uid');
        if (uid && typeof SkillPanel !== 'undefined') SkillPanel.show(uid);
      });
    }
  },

  _onLevelUp: function (uid) {
    HeroManager.levelUp(uid);
  },

  _onAscend: function (uid) {
    var info = HeroManager.getAscendInfo(uid);
    if (!info || !info.cost) return;
    var hero = HeroManager.getHeroByUid(uid);
    var template = hero ? HeroManager.getTemplate(hero.id) : null;
    var name = template ? template.name : '武将';

    Modal.show({
      title: '⭐ 突破确认',
      content: '<div style="text-align:center;line-height:2;">' +
        '<p>确定让 <b style="color:var(--color-gold);">' + name + '</b> 突破至 <b>' + (info.stars + 1) + '星</b>？</p>' +
        '<p style="font-size:0.85rem;color:var(--color-text-dim);">等级将重置为1级，基础属性永久提升15%</p>' +
        '<hr style="border-color:var(--color-secondary);margin:8px 0;">' +
        '<p>💰 金币 ×' + Utils.formatNumber(info.cost.gold) + '</p>' +
        '<p>💎 玉石 ×' + info.cost.jade + '</p>' +
        '</div>',
      confirmText: '突破！',
      onConfirm: function () {
        HeroManager.ascend(uid);
      }
    });
  },

  _onToggleTeam: function (uid) {
    if (HeroManager.isInTeam(uid)) {
      HeroManager.removeFromTeam(uid);
    } else {
      HeroManager.addToTeam(uid);
    }
  }
};
