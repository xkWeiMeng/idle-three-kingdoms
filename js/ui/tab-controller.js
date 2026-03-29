/**
 * Tab 页签控制器
 */
const TabController = {
  _tabs: [
    { id: 'heroes', label: '武将' },
    { id: 'adventure', label: '冒险' },
    { id: 'battle', label: '战斗' },
    { id: 'town', label: '城镇' },
    { id: 'economy', label: '经济' },
    { id: 'recruit', label: '招募' },
    { id: 'equipment', label: '装备' },
    { id: 'story', label: '剧情' },
    { id: 'settings', label: '设置' },
  ],

  init() {
    const nav = document.getElementById('tab-nav');
    nav.innerHTML = '';
    this._tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.textContent = tab.label;
      btn.dataset.tab = tab.id;
      btn.addEventListener('click', () => this.switchTo(tab.id));
      nav.appendChild(btn);
    });
    this.switchTo('battle');
  },

  switchTo(tabId) {
    document.querySelectorAll('#tab-nav button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.game-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });
    EventBus.emit('tab:switched', tabId);
  },
};
