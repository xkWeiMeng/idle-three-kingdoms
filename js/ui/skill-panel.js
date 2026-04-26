/**
 * 技能面板 — 武将技能查看与分配
 * 通过 OverlayPanel.show() 展示，从武将卡片的"技能"按钮触发
 */
var SkillPanel = {

  show: function (heroUid) {
    var hero = HeroManager.getHeroByUid(heroUid);
    if (!hero) return;
    var template = HeroManager.getTemplate(hero.id);
    if (!template) return;
    var skillDefs = typeof HeroSkillData !== 'undefined' ? HeroSkillData[hero.id] : null;
    if (!skillDefs) {
      EventBus.emit('toast:show', { type: 'info', message: '该武将暂无技能数据' });
      return;
    }

    var html = this._buildHTML(hero, template, skillDefs);

    OverlayPanel.show({
      title: '✨ ' + template.name + ' — 技能',
      content: html,
      panelId: 'skills',
      height: 'full'
    });

    this._bindEvents(heroUid);
  },

  _buildHTML: function (hero, template, skillDefs) {
    var levels = hero.skillLevels || [0, 0, 0];
    var totalEarned = hero.skillPointsEarned || 0;
    var totalSpent = 0;
    for (var t = 0; t < levels.length; t++) totalSpent += levels[t];
    var available = Math.max(0, totalEarned - totalSpent);
    var color = (QualityColors && QualityColors[template.quality]) || '#aaa';

    var html = '';

    // Hero header
    html += '<div class="card" style="display:flex;align-items:center;gap:10px;">';
    html += '<span style="font-size:1.6rem;">' + HeroPortrait.getImgTag(hero.id, 40) + '</span>';
    html += '<div>';
    html += '<div style="font-weight:bold;color:' + color + ';">' + template.name + '</div>';
    html += '<div style="font-size:0.75rem;color:var(--color-text-dim);">Lv.' + hero.level + (hero.stars ? ' ★' + hero.stars : '') + '</div>';
    html += '</div>';
    html += '<div style="margin-left:auto;text-align:right;">';
    html += '<div style="font-size:1.1rem;font-weight:bold;color:var(--color-gold);">' + available + '</div>';
    html += '<div style="font-size:0.65rem;color:var(--color-text-dim);">可用技能点</div>';
    html += '</div>';
    html += '</div>';

    // SP info bar
    html += '<div class="card" style="font-size:0.75rem;color:var(--color-text-dim);text-align:center;">';
    html += '每 <b>' + SKILL_POINTS_INTERVAL + '</b> 级获得 1 技能点 · ';
    html += '已获得 <b style="color:var(--color-gold);">' + totalEarned + '</b> · ';
    html += '已使用 <b>' + totalSpent + '</b>';
    html += '</div>';

    // Skill cards
    for (var i = 0; i < skillDefs.length; i++) {
      html += this._renderSkillCard(skillDefs[i], levels[i] || 0, available, hero.uid, i);
    }

    // Reset button
    if (totalSpent > 0) {
      var resetCost = Math.max(100, Math.floor(hero.level * 100));
      html += '<div style="text-align:center;margin:16px 0 8px;">';
      html += '<button class="btn skill-reset-btn" data-uid="' + hero.uid + '" ';
      html += 'style="background:var(--color-danger);font-size:0.8rem;padding:8px 20px;">';
      html += UIIcons.icon('sort') + ' 重置技能点 (' + UIIcons.icon('gold') + Utils.formatNumber(resetCost) + ')';
      html += '</button>';
      html += '</div>';
    }

    return html;
  },

  _renderSkillCard: function (def, level, available, heroUid, index) {
    var isLocked = level === 0 && index > 0;
    var maxLvl = def.maxLevel || SKILL_MAX_LEVEL;
    var isMaxed = level >= maxLvl;
    var isFirstSkill = index === 0;

    // Card border color based on skill type
    var typeColors = {
      damage: '#c0392b', heal: '#5d8a48', buff: '#4a7fb5', debuff: '#8b5ea8'
    };
    var typeEmojis = {
      damage: UIIcons.icon('attack'), heal: '❤️', buff: '⬆️', debuff: '⬇️'
    };
    var typeNames = {
      damage: '伤害', heal: '治疗', buff: '增益', debuff: '减益'
    };
    var borderColor = typeColors[def.type] || '#aaa';

    var html = '';
    html += '<div class="card" style="border-left:3px solid ' + borderColor + ';' + (isLocked ? 'opacity:0.55;' : '') + '">';

    // Row 1: Icon, name, type badge, level
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
    html += '<span style="font-size:1.4rem;">' + (def.icon || '✨') + '</span>';
    html += '<div style="flex:1;">';
    html += '<div style="font-weight:bold;">' + def.name + '</div>';
    html += '<span style="font-size:0.6rem;padding:1px 5px;border-radius:3px;background:' + borderColor + '22;color:' + borderColor + ';border:1px solid ' + borderColor + '55;">';
    html += (typeEmojis[def.type] || '') + ' ' + (typeNames[def.type] || def.type);
    html += '</span>';
    html += ' <span style="font-size:0.6rem;color:var(--color-text-dim);">';
    html += this._targetName(def.target);
    html += '</span>';
    html += '</div>';
    html += '<span style="font-size:0.9rem;font-weight:bold;color:var(--color-gold);">Lv.' + level + '<small style="color:var(--color-text-dim);">/' + maxLvl + '</small></span>';
    html += '</div>';

    // Level dots
    html += '<div style="display:flex;gap:2px;margin-bottom:8px;">';
    for (var d = 0; d < maxLvl; d++) {
      var filled = d < level;
      html += '<div style="flex:1;height:4px;border-radius:2px;';
      html += filled ? 'background:var(--color-gold);' : 'background:var(--color-secondary);';
      html += '"></div>';
    }
    html += '</div>';

    // Description
    html += '<div style="font-size:0.78rem;color:var(--color-text-dim);margin-bottom:8px;">' + def.desc + '</div>';

    // Current effect
    if (isFirstSkill || level > 0) {
      var effectLv = Math.max(level, isFirstSkill ? 0 : 1);
      html += '<div style="font-size:0.78rem;margin-bottom:4px;color:#ddd;">';
      html += '当前: ' + this._getEffectText(def, effectLv);
      html += '</div>';
    }

    // Next level preview
    if (!isMaxed) {
      var nextLv = level + 1;
      html += '<div style="font-size:0.72rem;color:var(--color-text-dim);">';
      if (isLocked) {
        html += UIIcons.icon('lock') + ' 学习后: ' + this._getEffectText(def, 1);
      } else {
        html += '⬆ 下一级: ' + this._getEffectText(def, nextLv);
      }
      html += '</div>';
    }

    // Action button
    html += '<div style="margin-top:10px;">';
    if (isMaxed) {
      html += '<div style="font-size:0.75rem;color:var(--color-gold);text-align:center;">✅ 已满级</div>';
    } else if (available > 0) {
      html += '<button class="btn skill-levelup-btn" data-uid="' + heroUid + '" data-index="' + index + '" ';
      html += 'style="width:100%;font-size:0.8rem;background:var(--color-gold);color:#111;padding:8px;">';
      html += isLocked ? '🔓 学习 (1 技能点)' : '⬆ 升级 (1 技能点)';
      html += '</button>';
    } else {
      html += '<button class="btn" disabled style="width:100%;font-size:0.8rem;padding:8px;">技能点不足</button>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  },

  _targetName: function (target) {
    var names = {
      single: '单体',
      all: '全体',
      self: '自身',
      ally_lowest_hp: '最低血量友军'
    };
    return names[target] || target;
  },

  _getEffectText: function (def, level) {
    var cdText = ' · CD:' + this._getEffectiveCd(def, level) + '回合';

    if (def.type === 'damage') {
      var mult = def.baseMult + level * (def.growthMult || 0);
      return '<b style="color:#c0392b;">ATK×' + Math.round(mult * 100) + '%</b> 伤害' + cdText;
    }
    if (def.type === 'heal') {
      var hMult = def.baseMult + level * (def.growthMult || 0);
      return '<b style="color:#5d8a48;">ATK×' + Math.round(hMult * 100) + '%</b> 回复' + cdText;
    }
    if (def.type === 'buff') {
      var ratio = (def.baseRatio || 0) + level * (def.growthRatio || 0);
      var statNames = { atk: '攻击', def: '防御', spd: '速度' };
      return '<b style="color:#4a7fb5;">' + (statNames[def.effectStat] || def.effectStat) + '+' + Math.round(ratio * 100) + '%</b> 持续' + (def.duration || 2) + '回合' + cdText;
    }
    if (def.type === 'debuff') {
      var dRatio = (def.baseRatio || 0) + level * (def.growthRatio || 0);
      var dStatNames = { atk: '攻击', def: '防御', spd: '速度' };
      return '<b style="color:#8b5ea8;">' + (dStatNames[def.effectStat] || def.effectStat) + '-' + Math.round(dRatio * 100) + '%</b> 持续' + (def.duration || 2) + '回合' + cdText;
    }
    return '';
  },

  _getEffectiveCd: function (def, level) {
    var cd = def.baseCd || 3;
    if (def.cdLevels) {
      for (var i = 0; i < def.cdLevels.length; i++) {
        if (level >= def.cdLevels[i]) cd--;
      }
    }
    return Math.max(1, cd);
  },

  _bindEvents: function (heroUid) {
    var self = this;

    setTimeout(function () {
      // Level up buttons
      var btns = document.querySelectorAll('.skill-levelup-btn');
      for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function () {
          var uid = this.getAttribute('data-uid');
          var index = parseInt(this.getAttribute('data-index'));
          if (HeroManager.allocateSkillPoint(uid, index)) {
            self.show(uid);
          }
        });
      }

      // Reset button
      var resetBtn = document.querySelector('.skill-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          var uid = this.getAttribute('data-uid');
          self._onReset(uid);
        });
      }
    }, 50);
  },

  _onReset: function (heroUid) {
    var hero = HeroManager.getHeroByUid(heroUid);
    if (!hero) return;
    var template = HeroManager.getTemplate(hero.id);
    var name = template ? template.name : '武将';
    var resetCost = Math.max(100, Math.floor(hero.level * 100));
    var self = this;

    Modal.show({
      title: UIIcons.icon('sort') + ' 重置技能',
      content: '<div style="text-align:center;line-height:2;">' +
        '<p>确定重置 <b style="color:var(--color-gold);">' + name + '</b> 的所有技能点？</p>' +
        '<p style="font-size:0.85rem;color:var(--color-text-dim);">所有技能等级归零，技能点全部返还</p>' +
        '<hr style="border-color:var(--color-secondary);margin:8px 0;">' +
        '<p>' + UIIcons.icon('gold') + ' 费用: ' + Utils.formatNumber(resetCost) + ' 金币</p>' +
        '</div>',
      confirmText: '重置',
      onConfirm: function () {
        if (HeroManager.resetSkillPoints(heroUid)) {
          self.show(heroUid);
        }
      }
    });
  }
};
