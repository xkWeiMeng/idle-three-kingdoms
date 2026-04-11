/**
 * 建造菜单 — 显示可建造的建筑列表 + 入口跳转到城镇管理
 */
var BuildMenu = {
  show: function () {
    if (typeof BuildingData === 'undefined' || typeof OverlayPanel === 'undefined') return;

    var html = '<div class="build-menu">';

    // 城镇管理入口
    html += '<div class="bm-manage-bar">' +
      '<button class="btn btn-small bm-manage-btn" onclick="BuildMenu._openTownPanel()">📋 城镇管理</button>' +
      '</div>';

    var categories = { core: '🏛️ 核心', production: '⛏️ 生产', combat: '⚔️ 战斗', functional: '🔧 功能' };

    for (var catId in categories) {
      if (!categories.hasOwnProperty(catId)) continue;

      // BuildingData 是对象，按 category 过滤
      var catBuildings = [];
      for (var id in BuildingData) {
        if (!BuildingData.hasOwnProperty(id) || id.charAt(0) === '_') continue;
        if (BuildingData[id].category === catId) {
          catBuildings.push(BuildingData[id]);
        }
      }
      if (catBuildings.length === 0) continue;

      // 按 unlockOrder 排序
      catBuildings.sort(function (a, b) { return (a.unlockOrder || 0) - (b.unlockOrder || 0); });

      html += '<div class="bm-category">';
      html += '<h3 class="bm-cat-title">' + categories[catId] + '</h3>';
      html += '<div class="bm-list">';

      for (var i = 0; i < catBuildings.length; i++) {
        var b = catBuildings[i];
        var level = TownManager.getBuildingLevel(b.id);
        var isBuilding = TownManager.isBuilding(b.id);
        var check = TownManager.canUpgrade(b.id);
        var isBuilt = level > 0;

        html += '<div class="bm-item' + (isBuilt ? ' built' : '') + '">';
        html += '<img src="assets/img/buildings/' + b.id + '.svg" class="bm-icon" alt="' + b.name + '" onerror="this.style.display=\'none\'"/>';
        html += '<div class="bm-info">';
        html += '<span class="bm-name">' + b.emoji + ' ' + b.name + '</span>';
        if (isBuilding) {
          var remain = TownManager.getRemainingBuildTime(b.id);
          html += '<span class="bm-level" style="color:var(--color-gold)">⏱ 施工中 ' + BuildMenu._formatTime(remain) + '</span>';
        } else if (isBuilt) {
          html += '<span class="bm-level">Lv.' + level + '</span>';
          if (check.ok) {
            html += '<button class="btn btn-sm" onclick="BuildMenu._build(\'' + b.id + '\')">升级</button>';
          }
        } else if (check.ok) {
          html += '<button class="btn btn-sm" onclick="BuildMenu._build(\'' + b.id + '\')">建造</button>';
        } else {
          html += '<span class="bm-locked">🔒 ' + (check.reason || '未解锁') + '</span>';
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
    var result = TownManager.enqueueUpgrade(buildingId);
    if (result.ok) {
      OverlayPanel.close();
      EventBus.emit('toast:show', { type: 'success', message: '🔨 开始建造！' });
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
    }
  },

  _openTownPanel: function () {
    OverlayPanel.close();
    setTimeout(function () {
      OverlayPanel.showPanel('town', '🏰 城镇管理');
    }, 100);
  },

  _formatTime: function (seconds) {
    if (seconds < 60) return seconds + '秒';
    if (seconds < 3600) return Math.floor(seconds / 60) + '分' + (seconds % 60) + '秒';
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    return h + '时' + m + '分';
  }
};
