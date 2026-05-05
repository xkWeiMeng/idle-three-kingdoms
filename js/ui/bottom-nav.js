/**
 * 底部导航栏 — 替代原有 tab 系统
 * 固定在屏幕底部，5 个图标按钮
 */
var BottomNav = {
  _el: null,
  _buttons: [
    { id: 'town',    icon: 'town',    label: '城镇', action: 'town' },
    { id: 'heroes',  icon: 'heroes',  label: '武将', action: 'panel' },
    { id: 'battle',  icon: 'battle',  label: '战斗', action: 'panel' },
    { id: 'recruit', icon: 'recruit', label: '招募', action: 'panel' },
    { id: 'more',    icon: 'more',    label: '更多', action: 'more' }
  ],
  _moreItems: [
    { id: 'adventure', icon: 'adventure',   label: '冒险' },
    { id: 'quest',     icon: 'quest',       label: '任务' },
    { id: 'equipment', icon: 'equipment',   label: '装备' },
    { id: 'merchant',  icon: 'merchant',    label: '商人' },
    { id: 'forge',     icon: 'forge',       label: '锻造' },
    { id: 'td',        icon: 'defense',     label: '城防' },
    { id: 'abyss',     icon: 'abyss',       label: '深渊' },
    { id: 'roguelike', icon: 'trial',       label: '试炼' },
    { id: 'daily',     icon: 'daily',       label: '日挑' },
    { id: 'pachinko',  icon: 'recruit',     label: '弹珠' },
    { id: 'farm',      icon: 'farm',        label: '菜园' },
    { id: 'parking',   icon: 'parking',     label: '驿站' },
    { id: 'achievement', icon: 'achievement', label: '成就' },
    { id: 'economy',   icon: 'economy',     label: '经济' },
    { id: 'story',     icon: 'story',       label: '剧情' },
    { id: 'settings',  icon: 'settings',    label: '设置' }
  ],
  _moreOpen: false,

  init: function () {
    this._el = document.getElementById('bottom-nav');
    if (!this._el) return;
    this._render();

    // Close more menu when overlay opens
    EventBus.on('overlay:opened', this._closeMore.bind(this));
  },

  _render: function () {
    var html = '<div class="bnav-bar">';
    for (var i = 0; i < this._buttons.length; i++) {
      var btn = this._buttons[i];
      html += '<button class="bnav-btn" data-id="' + btn.id + '" data-action="' + btn.action + '">';
      html += '<span class="bnav-icon">' + UIIcons.icon(btn.icon) + '</span>';
      html += '<span class="bnav-label">' + btn.label + '</span>';
      html += '</button>';
    }
    html += '</div>';

    // More menu popup
    html += '<div class="bnav-more-menu" id="bnav-more-menu">';
    for (var j = 0; j < this._moreItems.length; j++) {
      var item = this._moreItems[j];
      html += '<button class="bnav-more-item" data-id="' + item.id + '">';
      html += '<span class="bnav-more-icon">' + UIIcons.icon(item.icon) + '</span>';
      html += '<span class="bnav-more-label">' + item.label + '</span>';
      html += '</button>';
    }
    html += '</div>';

    this._el.innerHTML = html;

    // Event delegation
    this._el.addEventListener('click', this._onClick.bind(this));
  },

  _onClick: function (e) {
    var btn = e.target.closest('[data-id]');
    if (!btn) return;

    var id = btn.getAttribute('data-id');
    var action = btn.getAttribute('data-action');

    if (action === 'town') {
      // Close overlay, show town
      if (typeof OverlayPanel !== 'undefined') {
        OverlayPanel.close();
      }
      this._closeMore();
      return;
    }

    if (action === 'more') {
      this._toggleMore();
      return;
    }

    if (action === 'panel') {
      this._openPanel(id);
      this._closeMore();
      return;
    }

    // More menu items (no data-action, they're inside more menu)
    if (btn.classList.contains('bnav-more-item')) {
      this._openPanel(id);
      this._closeMore();
      return;
    }
  },

  _openPanel: function (panelId) {
    // Custom panels that use OverlayPanel.show() directly
    if (panelId === 'merchant' && typeof MerchantPanel !== 'undefined') {
      MerchantPanel.show(); return;
    }
    if (panelId === 'forge' && typeof ForgePanel !== 'undefined') {
      ForgePanel.show(); return;
    }
    if (panelId === 'abyss' && typeof AbyssPanel !== 'undefined') {
      AbyssPanel.show(); return;
    }
    if (panelId === 'farm' && typeof FarmPanel !== 'undefined') {
      FarmPanel.show(); return;
    }
    if (panelId === 'parking' && typeof ParkingPanel !== 'undefined') {
      ParkingPanel.show(); return;
    }
    if (panelId === 'td' && typeof TowerDefensePanel !== 'undefined') {
      TowerDefensePanel.showChapterSelect(); return;
    }
    if (panelId === 'quest' && typeof QuestPanel !== 'undefined') {
      QuestPanel.show(); return;
    }
    if (panelId === 'achievement' && typeof AchievementPanel !== 'undefined') {
      AchievementPanel.show(); return;
    }
    if (panelId === 'roguelike' && typeof RoguelikePanel !== 'undefined') {
      RoguelikePanel.show(); return;
    }
    if (panelId === 'daily' && typeof DailyChallengePanel !== 'undefined') {
      DailyChallengePanel.show(); return;
    }
    if (panelId === 'pachinko' && typeof PachinkoPanel !== 'undefined') {
      PachinkoPanel.open(); return;
    }

    var titles = {
      heroes: UIIcons.icon('heroes') + ' 武将',
      battle: UIIcons.icon('battle') + ' 战斗',
      recruit: UIIcons.icon('recruit') + ' 招募',
      adventure: UIIcons.icon('adventure') + ' 冒险',
      equipment: UIIcons.icon('equipment') + ' 装备',
      economy: UIIcons.icon('economy') + ' 经济',
      story: UIIcons.icon('story') + ' 剧情',
      settings: UIIcons.icon('settings') + ' 设置',
      town: UIIcons.icon('town') + ' 城镇'
    };
    if (typeof OverlayPanel !== 'undefined') {
      OverlayPanel.showPanel(panelId, titles[panelId] || panelId);
    }
  },

  _toggleMore: function () {
    var menu = document.getElementById('bnav-more-menu');
    if (!menu) return;
    this._moreOpen = !this._moreOpen;
    menu.classList.toggle('active', this._moreOpen);
  },

  _closeMore: function () {
    this._moreOpen = false;
    var menu = document.getElementById('bnav-more-menu');
    if (menu) menu.classList.remove('active');
  }
};
