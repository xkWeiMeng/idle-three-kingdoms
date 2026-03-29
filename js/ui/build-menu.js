/**
 * 建造菜单 — 显示可建造的建筑列表
 */
var BuildMenu = {
  show: function () {
    if (typeof BuildingData === 'undefined' || typeof OverlayPanel === 'undefined') return;

    var html = '<div class="build-menu">';
    var categories = { core: '🏛️ 核心', production: '⛏️ 生产', combat: '⚔️ 战斗', functional: '🔧 功能' };

    for (var catId in categories) {
      if (!categories.hasOwnProperty(catId)) continue;
      var catBuildings = BuildingData.filter(function (b) { return b.category === catId; });
      if (catBuildings.length === 0) continue;

      html += '<div class="bm-category">';
      html += '<h3 class="bm-cat-title">' + categories[catId] + '</h3>';
      html += '<div class="bm-list">';

      for (var i = 0; i < catBuildings.length; i++) {
        var b = catBuildings[i];
        var state = null;
        if (typeof TownManager !== 'undefined' && TownManager._state && TownManager._state.buildings) {
          state = TownManager._state.buildings[b.id];
        }
        var level = state ? state.level : 0;
        var canBuild = level === 0 && typeof TownManager !== 'undefined' && TownManager.canUpgrade(b.id);
        var isBuilt = level > 0;

        html += '<div class="bm-item' + (isBuilt ? ' built' : '') + '">';
        html += '<img src="assets/img/buildings/' + b.id + '.svg" class="bm-icon" alt="' + b.name + '"/>';
        html += '<div class="bm-info">';
        html += '<span class="bm-name">' + b.name + '</span>';
        if (isBuilt) {
          html += '<span class="bm-level">Lv.' + level + '</span>';
        } else if (canBuild) {
          html += '<button class="btn btn-sm" onclick="BuildMenu._build(\'' + b.id + '\')">建造</button>';
        } else {
          html += '<span class="bm-locked">🔒 未解锁</span>';
        }
        html += '</div></div>';
      }
      html += '</div></div>';
    }
    html += '</div>';

    OverlayPanel.show({
      title: '🔨 建造',
      content: html,
      height: 'half',
      panelId: 'build-menu'
    });
  },

  _build: function (buildingId) {
    if (typeof TownManager !== 'undefined') {
      TownManager.startUpgrade(buildingId);
      OverlayPanel.close();
      EventBus.emit('toast:show', { type: 'success', message: '🔨 开始建造！' });
    }
  }
};
