/**
 * 城镇面板 UI — 建筑列表、升级操作、集市交易
 */
var TownPanel = {
  _el: null,
  _currentCategory: 'all',
  _timer: null,

  init: function () {
    this._el = document.getElementById('panel-town');
    if (!this._el) return;
    this._render();
    EventBus.on('town:building_upgraded', () => this._render());
    EventBus.on('town:building_started', () => this._render());
    EventBus.on('resource:changed', () => this._updateButtons());
    EventBus.on('tab:switched', (tabId) => {
      if (tabId === 'town') {
        this._render();
        this._startTimer();
      } else {
        this._stopTimer();
      }
    });
  },

  _startTimer: function () {
    this._stopTimer();
    this._timer = setInterval(() => this._updateTimers(), 1000);
  },

  _stopTimer: function () {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  _render: function () {
    if (!this._el) return;
    var thLevel = TownManager.getBuildingLevel('town_hall');
    var thData = BuildingData._townHallUnlocks[thLevel];
    var maxSlots = thData ? thData.slots : 3;
    var usedSlots = TownManager._getUnlockedBuildingCount();
    var activeBuilds = TownManager.getActiveBuildCount();
    var maxBuildSlots = TownManager.getMaxBuildSlots();

    // 产出总览
    var goldRate = TownManager.getProductionRate('gold');
    var woodRate = TownManager.getProductionRate('wood');
    var stoneRate = TownManager.getProductionRate('stone');
    var ironRate = TownManager.getProductionRate('iron');

    var html = '<div class="town-header">' +
      '<div class="town-title">🏯 城主府 Lv.' + thLevel + '</div>' +
      '<div class="town-meta">' +
        '建筑槽: ' + usedSlots + '/' + maxSlots +
        ' · ⏱ 施工: ' + activeBuilds + '/' + maxBuildSlots +
      '</div>' +
      '</div>';

    // 产出总览
    if (goldRate > 0 || woodRate > 0 || stoneRate > 0 || ironRate > 0) {
      html += '<div class="town-production-overview">' +
        '📊 产出: ';
      if (goldRate > 0) html += '💰 +' + goldRate.toFixed(1) + '/分 ';
      if (woodRate > 0) html += '🪵 +' + woodRate.toFixed(1) + '/分 ';
      if (stoneRate > 0) html += '🪨 +' + stoneRate.toFixed(1) + '/分 ';
      if (ironRate > 0) html += '⛏️ +' + ironRate.toFixed(1) + '/分';
      html += '</div>';
    }

    // 分类标签
    html += '<div class="town-category-tabs">' +
      '<button class="town-cat-btn' + (this._currentCategory === 'all' ? ' active' : '') + '" data-cat="all">全部</button>' +
      '<button class="town-cat-btn' + (this._currentCategory === 'production' ? ' active' : '') + '" data-cat="production">资源</button>' +
      '<button class="town-cat-btn' + (this._currentCategory === 'combat' ? ' active' : '') + '" data-cat="combat">战斗</button>' +
      '<button class="town-cat-btn' + (this._currentCategory === 'functional' ? ' active' : '') + '" data-cat="functional">功能</button>' +
      '</div>';

    // 建筑列表
    html += '<div class="town-building-list">';
    html += this._renderBuilding('town_hall');

    var cats = TownManager.getBuildingsByCategory();
    var catOrder = ['production', 'combat', 'functional'];
    for (var ci = 0; ci < catOrder.length; ci++) {
      var cat = catOrder[ci];
      if (this._currentCategory !== 'all' && this._currentCategory !== cat) continue;
      var ids = cats[cat] || [];
      for (var bi = 0; bi < ids.length; bi++) {
        html += this._renderBuilding(ids[bi]);
      }
    }
    html += '</div>';

    // 集市区域
    var marketLv = TownManager.getBuildingLevel('market');
    if (marketLv > 0) {
      html += this._renderMarket(marketLv);
    }

    this._el.innerHTML = html;
    this._bindEvents();
  },

  _renderBuilding: function (buildingId) {
    var data = BuildingData[buildingId];
    if (!data) return '';
    var level = TownManager.getBuildingLevel(buildingId);
    var isBuilding = TownManager.isBuilding(buildingId);
    var check = TownManager.canUpgrade(buildingId);

    // Status tag
    var statusTag = '';
    if (isBuilding) {
      statusTag = '<span class="town-status-tag town-status-building">施工中 ⏱</span>';
    } else if (level >= data.maxLevel) {
      statusTag = '<span class="town-status-tag town-status-maxed">满级 ⭐</span>';
    } else if (level === 0) {
      statusTag = '<span class="town-status-tag town-status-unbuilt">未建造</span>';
    } else if (check.ok) {
      statusTag = '<span class="town-status-tag town-status-upgradeable">可升级 ⬆</span>';
    }

    var html = '<div class="town-building-card town-card-clickable" data-building="' + buildingId + '" data-detail="' + buildingId + '">';
    html += '<div class="town-building-header">';
    html += '<span class="town-building-name">' + data.emoji + ' ' + data.name + '</span>';
    html += '<span class="town-building-level-group">' + statusTag + ' <span class="town-building-level">Lv.' + level + '</span></span>';
    html += '</div>';

    // 当前效果
    if (level > 0) {
      html += '<div class="town-building-effect">' + this._getEffectText(buildingId, level) + '</div>';
    }

    // 施工中
    if (isBuilding) {
      var remain = TownManager.getRemainingBuildTime(buildingId);
      html += '<div class="town-build-progress">';
      html += '<div class="progress-bar"><div class="progress-bar-fill fill-gold" style="width:' +
        Math.round((1 - remain / TownManager.getBuildTime(buildingId)) * 100) + '%" data-timer="' + buildingId + '"></div></div>';
      html += '<span class="town-build-time" data-countdown="' + buildingId + '">⏱ ' + this._formatTime(remain) + '</span>';
      html += '<button class="btn btn-small btn-outline town-speed-btn" data-speed="' + buildingId + '">💎加速</button>';
      html += '</div>';
    } else if (level < data.maxLevel) {
      // 升级按钮
      var cost = TownManager.getUpgradeCost(buildingId);
      html += '<div class="town-upgrade-section">';
      html += '<div class="town-cost">' + this._formatCost(cost) + '</div>';
      html += '<div class="town-upgrade-info">⏱ ' + this._formatTime(TownManager.getBuildTime(buildingId)) + '</div>';
      html += '<button class="btn btn-small' + (check.ok ? '' : ' btn-outline') + ' town-upgrade-btn" ' +
        'data-upgrade="' + buildingId + '"' + (check.ok ? '' : ' disabled') + '>' +
        (level === 0 ? '建造' : '升级 → Lv.' + (level + 1)) + '</button>';
      if (!check.ok && check.reason !== '资源不足') {
        html += '<div class="town-lock-reason">' + check.reason + '</div>';
      }
      html += '</div>';
    } else {
      html += '<div class="town-max-level">已达最高等级</div>';
    }

    html += '</div>';
    return html;
  },

  _getEffectText: function (buildingId, level) {
    var data = BuildingData[buildingId];
    if (data.production) {
      var prod = data.production(level);
      var emoji = CONSTANTS.RESOURCE_EMOJI[prod.resource] || '💰';
      var rate = prod.perMinute;
      // 显示加成器乘数
      var boosterLv = TownManager.getBoosterLevel(buildingId);
      var boostText = '';
      if (boosterLv > 0) {
        var boostData = BuildingData[buildingId] && BuildingData[buildingId].boosts;
        rate = TownManager.getProductionRate(prod.resource);
        boostText = ' (含加成 ×' + (1 + boosterLv * 0.05).toFixed(2) + ')';
      }
      return emoji + ' +' + rate.toFixed(1) + '/分钟' + boostText;
    }
    if (data.boosts) {
      var fx = data.effects(level);
      return '⬆ ' + fx.boostTarget + ' 产出 +' + Math.round(fx.productionBoost * 100) + '%';
    }
    if (data.effects) {
      var fx = data.effects(level);
      var parts = [];
      if (fx.atkBonus) parts.push('ATK +' + Math.round(fx.atkBonus * 100) + '%');
      if (fx.defBonus) parts.push('DEF +' + Math.round(fx.defBonus * 100) + '%');
      if (fx.hpBonus) parts.push('HP +' + Math.round(fx.hpBonus * 100) + '%');
      if (fx.expBonus) parts.push('EXP +' + Math.round(fx.expBonus * 100) + '%');
      if (fx.spdBonus) parts.push('SPD +' + Math.round(fx.spdBonus * 100) + '%');
      if (fx.firstStrikeChance) parts.push('先攻 ' + Math.round(fx.firstStrikeChance * 100) + '%');
      if (fx.equipQualityBonus) parts.push('品质 +' + Math.round(fx.equipQualityBonus * 100) + '%');
      if (fx.skillCooldownReduction) parts.push('冷却 -' + Math.round(fx.skillCooldownReduction * 100) + '%');
      if (fx.offlineEfficiency) parts.push('离线效率 ' + Math.round(fx.offlineEfficiency * 100) + '%');
      if (fx.dropRateBonus) parts.push('掉率 +' + Math.round(fx.dropRateBonus * 100) + '%');
      if (fx.recruitDiscount) parts.push('招募折扣 ' + Math.round(fx.recruitDiscount * 100) + '%');
      if (fx.resourceCapBonus) parts.push('容量 +' + Math.round(fx.resourceCapBonus * 100) + '%');
      if (fx.enhanceSuccessBonus) parts.push('强化率 +' + Math.round(fx.enhanceSuccessBonus * 100) + '%');
      if (fx.foodCapBonus) parts.push('粮草上限 +' + fx.foodCapBonus);
      if (fx.unlockSlots) parts.push('建筑槽 ' + fx.unlockSlots + ' · 等级上限 ' + fx.levelCap);
      return parts.join(' · ');
    }
    return '';
  },

  _formatCost: function (cost) {
    if (!cost) return '';
    var parts = [];
    var E = CONSTANTS.RESOURCE_EMOJI;
    if (cost.gold) parts.push((E.gold || '💰') + Utils.formatNumber(cost.gold));
    if (cost.wood) parts.push((E.wood || '🪵') + Utils.formatNumber(cost.wood));
    if (cost.stone) parts.push((E.stone || '🪨') + Utils.formatNumber(cost.stone));
    if (cost.iron) parts.push((E.iron || '⛏️') + Utils.formatNumber(cost.iron));
    return parts.join(' ');
  },

  _formatTime: function (seconds) {
    if (seconds < 60) return seconds + '秒';
    if (seconds < 3600) return Math.floor(seconds / 60) + '分' + (seconds % 60) + '秒';
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    return h + '时' + m + '分';
  },

  _renderMarket: function (marketLv) {
    var fx = BuildingData.market.effects(marketLv);
    var html = '<div class="town-market">';
    html += '<div class="town-section-title">🏪 集市交易</div>';

    var resources = ['wood', 'stone', 'iron'];
    var names = { wood: '木材', stone: '石材', iron: '铁矿' };
    var canFlags = [fx.canTradeWood, fx.canTradeStone, fx.canTradeIron];

    for (var i = 0; i < resources.length; i++) {
      if (!canFlags[i]) continue;
      var res = resources[i];
      var rate = fx.tradeRates[res];
      html += '<div class="town-trade-row">' +
        '<span>' + CONSTANTS.RESOURCE_EMOJI[res] + ' ' + names[res] + '</span>' +
        '<span class="town-trade-rate">💰' + rate + ' = 1' + CONSTANTS.RESOURCE_EMOJI[res] + '</span>' +
        '<button class="btn btn-small btn-outline town-trade-btn" data-trade="' + res + '">交易×10</button>' +
        '</div>';
    }
    html += '</div>';
    return html;
  },

  _bindEvents: function () {
    var self = this;

    // 分类标签
    this._el.querySelectorAll('.town-cat-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self._currentCategory = this.dataset.cat;
        self._render();
      });
    });

    // 建筑卡片点击 → 打开详情面板
    this._el.querySelectorAll('[data-detail]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        // 不拦截按钮点击
        if (e.target.closest('button')) return;
        var buildingId = this.dataset.detail;
        if (typeof TownWorld !== 'undefined' && TownWorld._showBuildingDetail) {
          TownWorld._showBuildingDetail(buildingId);
        }
      });
    });

    // 升级按钮
    this._el.querySelectorAll('.town-upgrade-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.upgrade;
        var result = TownManager.enqueueUpgrade(id);
        if (result.ok) {
          self._render();
        } else {
          EventBus.emit('toast:show', { type: 'warning', message: result.reason });
        }
      });
    });

    // 加速按钮
    this._el.querySelectorAll('.town-speed-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.speed;
        var remain = TownManager.getRemainingBuildTime(id);
        var jadeCost = Math.ceil(remain / 60);
        if (TownManager.speedUpBuild(id)) {
          self._render();
        } else {
          EventBus.emit('toast:show', { type: 'warning', message: '💎 不足（需要 ' + jadeCost + '）' });
        }
      });
    });

    // 集市交易
    this._el.querySelectorAll('.town-trade-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var res = this.dataset.trade;
        if (TownManager.executeTrade(res, 10)) {
          self._render();
          EventBus.emit('toast:show', { type: 'success', message: '交易成功！' });
        } else {
          EventBus.emit('toast:show', { type: 'warning', message: '金币不足' });
        }
      });
    });
  },

  _updateButtons: function () {
    // 轻量刷新：只更新升级按钮状态
    this._el && this._el.querySelectorAll('.town-upgrade-btn').forEach(function (btn) {
      var id = btn.dataset.upgrade;
      var check = TownManager.canUpgrade(id);
      btn.disabled = !check.ok;
      btn.classList.toggle('btn-outline', !check.ok);
    });
  },

  _updateTimers: function () {
    if (!this._el) return;
    this._el.querySelectorAll('[data-countdown]').forEach(function (el) {
      var id = el.dataset.countdown;
      var remain = TownManager.getRemainingBuildTime(id);
      if (remain <= 0) {
        // 施工完成，全量刷新
        this._render();
        return;
      }
      el.textContent = '⏱ ' + this._formatTime(remain);
    }.bind(this));

    this._el.querySelectorAll('[data-timer]').forEach(function (el) {
      var id = el.dataset.timer;
      var remain = TownManager.getRemainingBuildTime(id);
      var total = TownManager.getBuildTime(id);
      el.style.width = Math.round((1 - remain / total) * 100) + '%';
    });
  }
};
