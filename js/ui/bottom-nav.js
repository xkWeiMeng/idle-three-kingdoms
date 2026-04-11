/**
 * 底部导航栏 — 替代原有 tab 系统
 * 固定在屏幕底部，5 个图标按钮
 */
var BottomNav = {
  _el: null,
  _buttons: [
    { id: 'town',    icon: '🏰', label: '城镇', action: 'town' },
    { id: 'heroes',  icon: '⚔️', label: '武将', action: 'panel' },
    { id: 'battle',  icon: '🗡️', label: '战斗', action: 'panel' },
    { id: 'recruit', icon: '🎯', label: '招募', action: 'panel' },
    { id: 'more',    icon: '⋯',  label: '更多', action: 'more' }
  ],
  _moreItems: [
    { id: 'adventure', icon: '🗺️', label: '冒险' },
    { id: 'equipment', icon: '🛡️', label: '装备' },
    { id: 'merchant',  icon: '🏪', label: '商人' },
    { id: 'forge',     icon: '🔨', label: '锻造' },
    { id: 'td',        icon: '🏰', label: '城防' },
    { id: 'abyss',     icon: '🔥', label: '深渊' },
    { id: 'farm',      icon: '🥬', label: '菜园' },
    { id: 'parking',   icon: '🅿️', label: '停车' },
    { id: 'economy',   icon: '📊', label: '经济' },
    { id: 'story',     icon: '📜', label: '剧情' },
    { id: 'settings',  icon: '⚙️', label: '设置' }
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
      html += '<span class="bnav-icon">' + btn.icon + '</span>';
      html += '<span class="bnav-label">' + btn.label + '</span>';
      html += '</button>';
    }
    html += '</div>';

    // More menu popup
    html += '<div class="bnav-more-menu" id="bnav-more-menu">';
    for (var j = 0; j < this._moreItems.length; j++) {
      var item = this._moreItems[j];
      html += '<button class="bnav-more-item" data-id="' + item.id + '">';
      html += '<span class="bnav-more-icon">' + item.icon + '</span>';
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

    var titles = {
      heroes: '⚔️ 武将',
      battle: '🗡️ 战斗',
      recruit: '🎯  招募',
      adventure: '🗺️ 冒险',
      equipment: '🛡️ 装备',
      economy: '📊 经济',
      story: '📜 剧情',
      settings: '⚙️ 设置',
      town: '🏰 城镇'
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
