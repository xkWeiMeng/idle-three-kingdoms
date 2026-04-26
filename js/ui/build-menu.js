/**
 * 建造菜单 — 显示可建造的建筑列表 + 入口跳转到城镇管理
 */
var BuildMenu = {
  show: function () {
    if (typeof BuildingData === 'undefined' || typeof OverlayPanel === 'undefined') return;

    var html = '<div class="build-menu">';

    // 城镇管理入口
    html += '<div class="bm-manage-bar">' +
      '<button class="btn btn-small bm-manage-btn" onclick="BuildMenu._openTownPanel()">' + UIIcons.icon('list') + ' 城镇管理</button>' +
      '</div>';

    var categories = { core: UIIcons.icon('core') + ' 核心', production: UIIcons.icon('production') + ' 生产', combat: UIIcons.icon('attack') + ' 战斗', functional: UIIcons.icon('functional') + ' 功能', defense: UIIcons.icon('defense') + ' 防御' };

    for (var catId in categories) {
      if (!categories.hasOwnProperty(catId)) continue;

      // 防御分类特殊处理：从 TDTowerData 读取
      if (catId === 'defense') {
        html += this._renderDefenseCategory(categories[catId]);
        continue;
      }

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
        html += '<img src="assets/buildings/' + b.id + '.png" class="bm-icon" alt="' + b.name + '" onerror="this.style.display=\'none\'"/>';
        html += '<div class="bm-info">';
        html += '<span class="bm-name">' + b.emoji + ' ' + b.name + '</span>';
        if (isBuilding) {
          var remain = TownManager.getRemainingBuildTime(b.id);
          html += '<span class="bm-level" style="color:var(--color-gold)">⏱ 施工中 ' + BuildMenu._formatTime(remain) + '</span>';
        } else if (isBuilt) {
          var bmCount = TownManager.getBuildingCount(b.id);
          var bmMaxCount = TownManager.getMaxCount(b.id);
          var countStr = bmMaxCount > 1 ? ' ×' + bmCount + '/' + bmMaxCount : '';
          html += '<span class="bm-level">Lv.' + level + countStr + '</span>';
          if (check.ok) {
            html += '<button class="btn btn-sm" onclick="BuildMenu._build(\'' + b.id + '\')">升级</button>';
          }
          if (bmCount < bmMaxCount) {
            var copyCheck = TownManager.canBuildCopy(b.id);
            html += '<button class="btn btn-sm' + (copyCheck.ok ? '' : ' disabled') + '" onclick="BuildMenu._buildCopy(\'' + b.id + '\')"' + (copyCheck.ok ? '' : ' disabled') + '>+副本</button>';
          }
        } else if (check.ok) {
          html += '<button class="btn btn-sm" onclick="BuildMenu._build(\'' + b.id + '\')">建造</button>';
        } else {
          html += '<span class="bm-locked">' + UIIcons.icon('lock') + ' ' + (check.reason || '未解锁') + '</span>';
        }
        html += '</div></div>';
      }
      html += '</div></div>';
    }
    html += '</div>';

    OverlayPanel.show({
      title: UIIcons.icon('hammer') + ' 建造',
      content: html,
      height: 'half',
      panelId: 'build-menu'
    });
  },

  // 渲染防御建筑分类
  _renderDefenseCategory: function (catLabel) {
    if (typeof TDTowerData === 'undefined') return '';
    if (typeof TowerDefenseManager === 'undefined') return '';
    if (!TowerDefenseManager.getState().unlocked) return '';

    var thLevel = 0;
    if (typeof TownManager !== 'undefined' && TownManager.getBuildingLevel) {
      thLevel = TownManager.getBuildingLevel('town_hall');
    }

    // 收集可用的防御建筑
    var defBuildings = [];
    for (var tid in TDTowerData) {
      if (!TDTowerData.hasOwnProperty(tid)) continue;
      var td = TDTowerData[tid];
      defBuildings.push(td);
    }
    if (defBuildings.length === 0) return '';

    // 按 requiredTownHall 排序
    defBuildings.sort(function (a, b) {
      return (a.requiredTownHall || 0) - (b.requiredTownHall || 0);
    });

    var html = '<div class="bm-category">';
    html += '<h3 class="bm-cat-title">' + catLabel + '</h3>';

    // 当前容量信息
    var currentTowers = TowerDefenseManager.getState().towers.length;
    var maxTowers = TowerDefenseManager.getMaxTowers();
    html += '<div style="font-size:11px;color:var(--color-text-dim);padding:0 4px 6px;">防御设施: ' + currentTowers + '/' + maxTowers + '</div>';

    html += '<div class="bm-list">';

    for (var i = 0; i < defBuildings.length; i++) {
      var d = defBuildings[i];
      var unlocked = !d.requiredTownHall || thLevel >= d.requiredTownHall;
      var costStr = '';
      if (d.cost) {
        var parts = [];
        if (d.cost.gold) parts.push(d.cost.gold + '金');
        if (d.cost.wood) parts.push(d.cost.wood + '木');
        if (d.cost.stone) parts.push(d.cost.stone + '石');
        if (d.cost.iron) parts.push(d.cost.iron + '铁');
        costStr = parts.join(' ');
      }

      // 分类 emoji 映射
      var catEmoji = { attack: UIIcons.icon('attack'), wall: UIIcons.icon('defense'), trap: UIIcons.icon('battle'), support: UIIcons.icon('flame') };
      var emoji = catEmoji[d.category] || UIIcons.icon('defense');

      html += '<div class="bm-item">';
      html += '<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:20px;">' + emoji + '</div>';
      html += '<div class="bm-info">';
      html += '<span class="bm-name">' + d.name + '</span>';

      if (!unlocked) {
        html += '<span class="bm-locked">' + UIIcons.icon('lock') + ' 城主府 Lv.' + d.requiredTownHall + '</span>';
      } else if (currentTowers >= maxTowers) {
        html += '<span class="bm-locked">已达上限</span>';
      } else {
        html += '<span style="font-size:10px;color:var(--color-text-dim);">' + costStr + '</span>';
        html += '<button class="btn btn-sm" onclick="BuildMenu._startTDPlacement(\'' + d.id + '\')">放置</button>';
      }

      html += '</div></div>';
    }
    html += '</div></div>';
    return html;
  },

  // 进入 TD 建筑放置模式
  _startTDPlacement: function (typeId) {
    OverlayPanel.close();
    if (typeof TownWorld !== 'undefined' && TownWorld.startTDPlacement) {
      TownWorld.startTDPlacement(typeId);
    }
  },

  _showTDTowerInfo: function (tower) {
    var data = typeof TDTowerData !== 'undefined' ? TDTowerData[tower.type] : null;
    if (!data) return;

    var html = '<div style="padding:12px;">';
    html += '<div style="text-align:center;margin-bottom:12px;">';
    html += '<div style="font-size:18px;font-weight:bold;color:var(--color-gold);">' + data.name + ' Lv.' + tower.level + '</div>';
    html += '</div>';

    html += '<div class="card" style="padding:10px;margin:8px 0;">';
    if (data.atk) html += '<div>攻击力: ' + Math.floor(data.atk * (1 + (tower.level - 1) * 0.15)) + '</div>';
    if (data.range) html += '<div>射程: ' + data.range + '</div>';
    if (data.attackSpeed) html += '<div>攻速: ' + data.attackSpeed + '/s</div>';
    if (data.hp) html += '<div>生命值: ' + Math.floor(data.hp * (1 + (tower.level - 1) * 0.2)) + '</div>';
    html += '</div>';

    if (tower.level < (typeof TD_CONSTANTS !== 'undefined' ? TD_CONSTANTS.MAX_TOWER_LEVEL : 5)) {
      html += '<div style="display:flex;gap:8px;margin-top:12px;">';
      html += '<button class="btn" style="flex:1;" onclick="BuildMenu._upgradeTDTower(\'' + tower.uid + '\')">⬆ 升级</button>';
      html += '<button class="btn" style="flex:1;background:var(--color-danger);" onclick="BuildMenu._sellTDTower(\'' + tower.uid + '\')">' + UIIcons.icon('sell') + ' 出售</button>';
      html += '</div>';
    } else {
      html += '<div style="display:flex;gap:8px;margin-top:12px;">';
      html += '<div style="flex:1;text-align:center;color:var(--color-gold);">已满级</div>';
      html += '<button class="btn" style="flex:1;background:var(--color-danger);" onclick="BuildMenu._sellTDTower(\'' + tower.uid + '\')">' + UIIcons.icon('sell') + ' 出售</button>';
      html += '</div>';
    }

    html += '</div>';

    OverlayPanel.show({
      title: UIIcons.icon('defense') + ' ' + data.name,
      content: html,
      height: 'half',
      panelId: 'td-tower-info'
    });
  },

  _upgradeTDTower: function (uid) {
    if (typeof TowerDefenseManager !== 'undefined' && TowerDefenseManager.upgradeTower) {
      var result = TowerDefenseManager.upgradeTower(uid);
      if (result.ok) {
        OverlayPanel.close();
        EventBus.emit('toast:show', { type: 'success', message: UIIcons.icon('hammer') + ' 防御塔升级成功！' });
      } else {
        EventBus.emit('toast:show', { type: 'warning', message: result.reason });
      }
    }
  },

  _sellTDTower: function (uid) {
    if (typeof TowerDefenseManager !== 'undefined' && TowerDefenseManager.sellTower) {
      var result = TowerDefenseManager.sellTower(uid);
      if (result.ok) {
        OverlayPanel.close();
        EventBus.emit('toast:show', { type: 'success', message: UIIcons.icon('gold') + ' 已出售防御塔' });
      } else {
        EventBus.emit('toast:show', { type: 'warning', message: result.reason });
      }
    }
  },

  _build: function (buildingId) {
    var result = TownManager.enqueueUpgrade(buildingId);
    if (result.ok) {
      OverlayPanel.close();
      EventBus.emit('toast:show', { type: 'success', message: UIIcons.icon('hammer') + ' 开始建造！' });
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
    }
  },

  _buildCopy: function (buildingId) {
    var result = TownManager.enqueueBuildCopy(buildingId);
    if (result.ok) {
      OverlayPanel.close();
      var def = BuildingData[buildingId];
      EventBus.emit('toast:show', { type: 'success', message: UIIcons.icon('build') + ' ' + (def ? def.name : '') + ' 副本开始建造！' });
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
    }
  },

  _openTownPanel: function () {
    OverlayPanel.close();
    setTimeout(function () {
      OverlayPanel.showPanel('town', UIIcons.icon('town') + ' 城镇管理');
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
