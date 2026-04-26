/**
 * 菜园面板 UI — 种植/背包/合成/料理 四标签
 */
var FarmPanel = {
  _qualityColors: { 1:'#b0a898', 2:'#5d8a48', 3:'#4a7fb5', 4:'#8b5ea8', 5:'#d4a849', 6:'#ff2222' },
  _qualityNames: { 1:'普通', 2:'优良', 3:'精良', 4:'史诗', 5:'传说' },
  _activeTab: 'plant',
  _refreshTimer: null,

  init: function () {
    EventBus.on('farm:planted', this._onUpdate.bind(this));
    EventBus.on('farm:harvested', this._onUpdate.bind(this));
    EventBus.on('farm:watered', this._onUpdate.bind(this));
    EventBus.on('farm:fertilized', this._onUpdate.bind(this));
    EventBus.on('farm:bug_alert', this._onUpdate.bind(this));
    EventBus.on('farm:bug_removed', this._onUpdate.bind(this));
    EventBus.on('farm:crop_ready', this._onUpdate.bind(this));
    EventBus.on('farm:withered', this._onUpdate.bind(this));
    EventBus.on('farm:seed_bought', this._onUpdate.bind(this));
    EventBus.on('farm:seed_synthesized', this._onUpdate.bind(this));
    EventBus.on('farm:cooked', this._onUpdate.bind(this));
    EventBus.on('farm:buff_expired', this._onUpdate.bind(this));
    EventBus.on('farm:fertilizer_made', this._onUpdate.bind(this));
    EventBus.on('farm:auto_harvest_toggled', this._onUpdate.bind(this));
    EventBus.on('farm:crop_sold', this._onUpdate.bind(this));
  },

  _onUpdate: function () {
    var el = document.getElementById('farm-panel-content');
    if (el) this.show();
  },

  show: function () {
    var html = this._render();
    OverlayPanel.show({
      title: UIIcons.icon('farm') + ' 菜园',
      content: html,
      panelId: 'farm',
      height: 'full',
      onClose: function () {
        if (FarmPanel._refreshTimer) {
          clearInterval(FarmPanel._refreshTimer);
          FarmPanel._refreshTimer = null;
        }
      }
    });
    this._bindEvents();
    this._startRefresh();
  },

  _startRefresh: function () {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    this._refreshTimer = setInterval(function () {
      var el = document.getElementById('farm-panel-content');
      if (!el) {
        clearInterval(FarmPanel._refreshTimer);
        FarmPanel._refreshTimer = null;
        return;
      }
      FarmPanel._refreshTimers();
    }, 1000);
  },

  _refreshTimers: function () {
    var state = FarmManager.getState();
    for (var i = 0; i < state.plots.length; i++) {
      var timerEl = document.getElementById('plot-timer-' + i);
      if (timerEl && state.plots[i].state === 'growing') {
        var remaining = FarmManager.getRemainingTime(i);
        timerEl.textContent = this._formatTime(remaining);
      }
      var progEl = document.getElementById('plot-prog-' + i);
      if (progEl && state.plots[i].state === 'growing') {
        var progress = FarmManager.getPlotProgress(i);
        progEl.style.width = Math.round((progress || 0) * 100) + '%';
      }
    }
    // Buff timer
    var buffTimer = document.getElementById('farm-buff-timer');
    if (buffTimer) {
      var buff = FarmManager.getActiveBuff();
      if (buff) {
        var remaining2 = buff.duration - (Date.now() - buff.activatedAt) / 1000;
        buffTimer.textContent = this._formatTime(Math.max(0, remaining2));
      } else {
        buffTimer.textContent = '已过期';
      }
    }
  },

  _render: function () {
    var gardenLevel = this._getGardenLevel();
    var mastery = FarmManager.getFarmMastery();
    var state = FarmManager.getState();

    var html = '<div id="farm-panel-content">';

    // Header info
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px;color:var(--color-text-dim)">';
    html += '<span>🌿 ' + mastery.title + ' (经验:' + Utils.formatNumber(state.farmExp) + ')</span>';
    html += '<span>🧪 肥料:' + state.fertilizer + '</span>';
    html += '</div>';

    if (gardenLevel < 1) {
      html += '<div style="text-align:center;padding:40px 20px;color:var(--color-text-dim)">';
      html += '<p style="font-size:36px;margin-bottom:12px">🥬</p>';
      html += '<p>建造 <b>菜园</b> 建筑后解锁种植功能</p>';
      html += '<p style="font-size:12px;margin-top:8px">需要：农田 Lv.3</p>';
      html += '</div></div>';
      return html;
    }

    // Tab bar
    html += '<div class="farm-tabs" style="display:flex;gap:4px;margin-bottom:10px">';
    var tabs = [
      { id: 'plant', label: '🌱 种植' },
      { id: 'bag', label: '🎒 背包' },
      { id: 'synth', label: '🔬 合成' },
      { id: 'cook', label: '🍳 料理' }
    ];
    for (var t = 0; t < tabs.length; t++) {
      var active = this._activeTab === tabs[t].id;
      html += '<button class="btn btn-small' + (active ? '' : ' btn-outline') + '" ';
      html += 'onclick="FarmPanel._switchTab(\'' + tabs[t].id + '\')" ';
      html += 'style="flex:1;font-size:12px;padding:6px 4px' + (active ? '' : ';opacity:0.6') + '">';
      html += tabs[t].label + '</button>';
    }
    html += '</div>';

    // Tab content
    switch (this._activeTab) {
      case 'plant': html += this._renderPlantTab(state, gardenLevel); break;
      case 'bag': html += this._renderBagTab(state); break;
      case 'synth': html += this._renderSynthTab(state); break;
      case 'cook': html += this._renderCookTab(state, gardenLevel); break;
    }

    html += '</div>';
    return html;
  },

  // ===== Plant Tab =====

  _renderPlantTab: function (state, gardenLevel) {
    var html = '';

    // Auto-harvest toggle
    if (gardenLevel >= 5) {
      html += '<div style="margin-bottom:8px;font-size:12px">';
      html += '<label style="cursor:pointer">';
      html += '<input type="checkbox" id="farm-auto-harvest" ' + (state.autoHarvest ? 'checked' : '') + ' onchange="FarmPanel._toggleAuto()"> ';
      html += '自动收获 (产量 ×0.8)</label></div>';
    }

    // Plot grid
    html += '<div class="farm-plots" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
    for (var i = 0; i < state.plots.length; i++) {
      html += this._renderPlot(state.plots[i], i, gardenLevel);
    }
    html += '</div>';

    return html;
  },

  _renderPlot: function (plot, index, gardenLevel) {
    var html = '<div class="card" style="padding:8px;position:relative">';

    if (plot.state === 'idle') {
      html += '<div style="text-align:center;padding:8px 0">';
      html += '<div style="font-size:24px;margin-bottom:4px">🟫</div>';
      html += '<div style="font-size:11px;color:var(--color-text-dim)">空闲田地</div>';
      html += '<button class="btn btn-small" onclick="FarmPanel._showPlantDialog(' + index + ')" style="margin-top:6px;font-size:11px">播种</button>';
      html += '</div>';
    } else if (plot.state === 'growing') {
      var crop = CropData[plot.cropId];
      var progress = FarmManager.getPlotProgress(index);
      var remaining = FarmManager.getRemainingTime(index);
      html += '<div style="text-align:center">';
      html += '<div style="font-size:20px">' + (crop ? crop.emoji : '🌱') + '</div>';
      html += '<div style="font-size:11px;font-weight:bold;color:' + this._qualityColors[crop ? crop.quality : 1] + '">' + (crop ? crop.name : '?') + '</div>';
      // Progress bar
      html += '<div style="background:#333;border-radius:4px;height:6px;margin:4px 0;overflow:hidden">';
      html += '<div id="plot-prog-' + index + '" style="background:var(--color-success);height:100%;width:' + Math.round((progress || 0) * 100) + '%;transition:width 1s"></div>';
      html += '</div>';
      html += '<div id="plot-timer-' + index + '" style="font-size:10px;color:var(--color-text-dim)">' + this._formatTime(remaining) + '</div>';

      // Bug warning
      if (plot.hasBug) {
        html += '<div style="color:var(--color-danger);font-size:11px;margin-top:2px">🐛 虫害！产量-30%</div>';
        html += '<button class="btn btn-small" onclick="FarmPanel._removeBug(' + index + ')" style="font-size:10px;margin-top:2px">除虫(50金)</button>';
      }

      // Action buttons
      html += '<div style="display:flex;gap:4px;margin-top:4px;justify-content:center">';
      if (!plot.watered) {
        html += '<button class="btn btn-small" onclick="FarmPanel._water(' + index + ')" style="font-size:10px">💧浇水</button>';
      } else {
        html += '<span style="font-size:10px;color:var(--color-success)">💧已浇</span>';
      }
      if (!plot.fertilized) {
        html += '<button class="btn btn-small" onclick="FarmPanel._fertilize(' + index + ')" style="font-size:10px">🧪施肥</button>';
      } else {
        html += '<span style="font-size:10px;color:var(--color-success)">🧪已施</span>';
      }
      html += '</div>';
      html += '</div>';
    } else if (plot.state === 'ready') {
      var crop2 = CropData[plot.cropId];
      html += '<div style="text-align:center">';
      html += '<div style="font-size:24px;animation:pulse 1s infinite">' + (crop2 ? crop2.emoji : '✨') + '</div>';
      html += '<div style="font-size:11px;font-weight:bold;color:var(--color-success)">' + (crop2 ? crop2.name : '?') + '</div>';
      html += '<div style="font-size:11px;color:var(--color-gold)">已成熟！</div>';
      if (plot.hasBug) {
        html += '<div style="color:var(--color-danger);font-size:10px">🐛 虫害-30%</div>';
        html += '<button class="btn btn-small" onclick="FarmPanel._removeBug(' + index + ')" style="font-size:10px">除虫</button>';
      }
      html += '<button class="btn btn-small" onclick="FarmPanel._harvest(' + index + ')" style="margin-top:4px;font-size:11px;background:var(--color-success)">🌾 收获</button>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  // ===== Bag Tab =====

  _renderBagTab: function (state) {
    var html = '';

    // Seeds
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:6px">🌱 种子</div>';
    var hasSeeds = false;
    for (var sid in state.seeds) {
      if (state.seeds.hasOwnProperty(sid) && state.seeds[sid] > 0) {
        hasSeeds = true;
        var sCrop = CropData[sid];
        if (!sCrop) continue;
        html += '<div class="card" style="padding:6px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center">';
        html += '<span style="color:' + this._qualityColors[sCrop.quality] + '">' + sCrop.emoji + ' ' + sCrop.name + '</span>';
        html += '<span style="font-size:12px">×' + state.seeds[sid] + '</span>';
        html += '</div>';
      }
    }
    if (!hasSeeds) html += '<div style="color:var(--color-text-dim);font-size:12px">暂无种子，去种子铺购买吧</div>';
    html += '</div>';

    // Seed shop
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:6px">🛒 购买种子</div>';
    var shopLevel = this._getBuildingLevel('seed_shop');
    if (shopLevel < 1) {
      html += '<div style="color:var(--color-text-dim);font-size:12px">需要建造种子铺</div>';
    } else {
      for (var cid in CropData) {
        if (CropData.hasOwnProperty(cid)) {
          var crop = CropData[cid];
          if (crop.quality > shopLevel) continue;
          var discount = 0.05 * (shopLevel - 1);
          var cost = Math.floor((crop.seedCost.gold || 0) * (1 - discount));
          html += '<div class="card" style="padding:6px;margin-bottom:3px;display:flex;justify-content:space-between;align-items:center">';
          html += '<span style="color:' + this._qualityColors[crop.quality] + ';font-size:12px">' + crop.emoji + ' ' + crop.name + '</span>';
          html += '<span>';
          html += '<span style="font-size:11px;color:var(--color-gold)">' + cost + '金</span> ';
          html += '<button class="btn btn-small" onclick="FarmPanel._buySeed(\'' + cid + '\')" style="font-size:10px;padding:2px 6px">购买</button>';
          html += '</span></div>';
        }
      }
    }
    html += '</div>';

    // Harvested crops
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:6px">🥬 收获的作物</div>';
    var hasCrops = false;
    var sortedCrops = [];
    for (var iid in state.inventory) {
      if (state.inventory.hasOwnProperty(iid) && state.inventory[iid] > 0) {
        sortedCrops.push({ id: iid, count: state.inventory[iid], data: CropData[iid] });
      }
    }
    sortedCrops.sort(function (a, b) { return (a.data ? a.data.quality : 0) - (b.data ? b.data.quality : 0); });

    for (var si = 0; si < sortedCrops.length; si++) {
      hasCrops = true;
      var item = sortedCrops[si];
      if (!item.data) continue;
      var sellPrice = Math.floor((item.data.seedCost.gold || 10) * 0.6);
      html += '<div class="card" style="padding:6px;margin-bottom:3px;display:flex;justify-content:space-between;align-items:center">';
      html += '<span style="color:' + this._qualityColors[item.data.quality] + ';font-size:12px">' + item.data.emoji + ' ' + item.data.name + ' ×' + item.count + '</span>';
      html += '<span>';
      html += '<span style="font-size:10px;color:var(--color-text-dim)">' + sellPrice + '金/个</span> ';
      html += '<button class="btn btn-small" onclick="FarmPanel._sellCrop(\'' + item.id + '\')" style="font-size:10px;padding:2px 6px">出售1个</button>';
      html += '</span></div>';
    }
    if (!hasCrops) html += '<div style="color:var(--color-text-dim);font-size:12px">暂无收获的作物</div>';
    html += '</div>';

    // Make fertilizer
    html += '<div>';
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:6px">♻️ 制作肥料</div>';
    var compostLevel = this._getBuildingLevel('compost_pit');
    if (compostLevel < 1) {
      html += '<div style="color:var(--color-text-dim);font-size:12px">需要建造堆肥坑</div>';
    } else {
      html += '<div style="font-size:12px;margin-bottom:4px">消耗 3 个普通作物 → 1 肥料</div>';
      html += '<button class="btn btn-small" onclick="FarmPanel._makeFertilizer()" style="font-size:11px">制作肥料</button>';
    }
    html += '</div>';

    return html;
  },

  // ===== Synth Tab =====

  _renderSynthTab: function (state) {
    var html = '';
    var shopLevel = this._getBuildingLevel('seed_shop');

    if (shopLevel < 2) {
      html += '<div style="color:var(--color-text-dim);font-size:12px;text-align:center;padding:20px">种子铺 Lv.2 解锁合成功能</div>';
      return html;
    }

    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:8px">🔬 种子合成</div>';

    for (var i = 0; i < CropSynthesis.length; i++) {
      var recipe = CropSynthesis[i];
      if (shopLevel < recipe.minShopLevel) continue;

      var resultCrop = CropData[recipe.result];
      if (!resultCrop) continue;

      var canSynth = true;
      var matHtml = '';
      for (var mat in recipe.materials) {
        if (recipe.materials.hasOwnProperty(mat)) {
          var matCrop = CropData[mat];
          var have = state.inventory[mat] || 0;
          var need = recipe.materials[mat];
          var enough = have >= need;
          if (!enough) canSynth = false;
          matHtml += '<span style="font-size:11px;color:' + (enough ? 'var(--color-success)' : 'var(--color-danger)') + '">';
          matHtml += (matCrop ? matCrop.emoji + matCrop.name : mat) + ' ' + have + '/' + need;
          matHtml += '</span> ';
        }
      }

      html += '<div class="card" style="padding:8px;margin-bottom:6px;' + (canSynth ? '' : 'opacity:0.6') + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
      html += '<span style="color:' + this._qualityColors[resultCrop.quality] + ';font-weight:bold">' + resultCrop.emoji + ' ' + resultCrop.name + ' 种子</span>';
      html += '<button class="btn btn-small" onclick="FarmPanel._synthesize(' + i + ')" ' + (canSynth ? '' : 'disabled') + ' style="font-size:10px">合成</button>';
      html += '</div>';
      html += '<div>' + matHtml + '</div>';
      html += '</div>';
    }

    return html;
  },

  // ===== Cook Tab =====

  _renderCookTab: function (state, gardenLevel) {
    var html = '';

    if (gardenLevel < 5) {
      html += '<div style="color:var(--color-text-dim);font-size:12px;text-align:center;padding:20px">菜园 Lv.5 解锁料理功能</div>';
      return html;
    }

    // Current buff
    var buff = FarmManager.getActiveBuff();
    if (buff) {
      var recipe = RecipeData[buff.recipeId];
      var remaining = buff.duration - (Date.now() - buff.activatedAt) / 1000;
      html += '<div class="card" style="padding:8px;margin-bottom:10px;border:1px solid var(--color-gold)">';
      html += '<div style="font-size:12px;color:var(--color-gold);margin-bottom:4px">🍽️ 当前增益</div>';
      html += '<div style="font-size:13px;font-weight:bold">' + (recipe ? recipe.emoji + ' ' + recipe.name : '未知') + '</div>';
      html += '<div style="font-size:11px;color:var(--color-text-dim)">' + (recipe ? recipe.description : '') + '</div>';
      html += '<div style="font-size:11px;margin-top:4px">⏱ 剩余: <span id="farm-buff-timer">' + this._formatTime(Math.max(0, remaining)) + '</span></div>';
      html += '</div>';
    }

    // Recipe list
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:8px">🍳 料理配方</div>';

    var recipeKeys = Object.keys(RecipeData);
    recipeKeys.sort(function (a, b) { return (RecipeData[a].quality || 0) - (RecipeData[b].quality || 0); });

    for (var ri = 0; ri < recipeKeys.length; ri++) {
      var r = RecipeData[recipeKeys[ri]];
      var canCook = true;
      var matHtml = '';

      for (var mat in r.materials) {
        if (r.materials.hasOwnProperty(mat)) {
          var matCrop = CropData[mat];
          var have = state.inventory[mat] || 0;
          var need = r.materials[mat];
          var enough = have >= need;
          if (!enough) canCook = false;
          matHtml += '<span style="font-size:11px;color:' + (enough ? 'var(--color-success)' : 'var(--color-danger)') + '">';
          matHtml += (matCrop ? matCrop.emoji + matCrop.name : mat) + ' ' + have + '/' + need;
          matHtml += '</span> ';
        }
      }

      html += '<div class="card" style="padding:8px;margin-bottom:6px;' + (canCook ? '' : 'opacity:0.6') + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">';
      html += '<span style="color:' + this._qualityColors[r.quality || 1] + ';font-weight:bold">' + r.emoji + ' ' + r.name + '</span>';
      html += '<button class="btn btn-small" onclick="FarmPanel._cook(\'' + r.id + '\')" ' + (canCook ? '' : 'disabled') + ' style="font-size:10px">制作</button>';
      html += '</div>';
      html += '<div style="font-size:11px;color:var(--color-text-dim);margin-bottom:2px">' + r.description + '</div>';
      html += '<div style="font-size:11px">⏱ ' + this._formatTime(r.duration) + ' | 材料: ' + matHtml + '</div>';
      html += '</div>';
    }

    return html;
  },

  // ===== Actions =====

  _switchTab: function (tab) {
    this._activeTab = tab;
    this.show();
  },

  _showPlantDialog: function (plotIndex) {
    var state = FarmManager.getState();
    var gardenLevel = this._getGardenLevel();
    var gardenData = GardenLevelData[gardenLevel];
    var maxQuality = gardenData ? gardenData.qualityUnlock : 1;

    var html = '<div style="max-height:300px;overflow-y:auto">';
    var hasSeeds = false;

    for (var sid in state.seeds) {
      if (state.seeds.hasOwnProperty(sid) && state.seeds[sid] > 0) {
        var crop = CropData[sid];
        if (!crop) continue;
        if (crop.quality > maxQuality) continue;
        hasSeeds = true;
        html += '<div class="card" style="padding:8px;margin-bottom:4px;cursor:pointer" onclick="FarmPanel._doPlant(' + plotIndex + ',\'' + sid + '\')">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center">';
        html += '<span style="color:' + this._qualityColors[crop.quality] + '">' + crop.emoji + ' ' + crop.name + ' ×' + state.seeds[sid] + '</span>';
        html += '<span style="font-size:11px;color:var(--color-text-dim)">⏱ ' + this._formatTime(crop.growthTime) + '</span>';
        html += '</div>';
        html += '<div style="font-size:10px;color:var(--color-text-dim);margin-top:2px">' + crop.description + '</div>';
        html += '</div>';
      }
    }

    if (!hasSeeds) {
      html += '<div style="color:var(--color-text-dim);text-align:center;padding:20px">没有可种植的种子</div>';
    }
    html += '</div>';

    Modal.show({
      title: '选择种子',
      content: html,
      showCancel: true,
      cancelText: '取消'
    });
  },

  _doPlant: function (plotIndex, cropId) {
    var result = FarmManager.plant(plotIndex, cropId);
    if (result.ok) {
      Modal.close();
      EventBus.emit('toast:show', { type: 'success', message: '🌱 播种成功！' });
    } else {
      EventBus.emit('toast:show', { type: 'error', message: result.reason });
    }
  },

  _harvest: function (plotIndex) {
    var result = FarmManager.harvest(plotIndex, false);
    if (result.ok) {
      var msg = '🌾 收获成功！';
      if (result.yields) {
        var parts = [];
        for (var r in result.yields) {
          if (result.yields.hasOwnProperty(r)) {
            parts.push(r + '+' + result.yields[r]);
          }
        }
        if (parts.length) msg += ' ' + parts.join(', ');
      }
      EventBus.emit('toast:show', { type: 'success', message: msg });
    } else {
      EventBus.emit('toast:show', { type: 'error', message: result.reason });
    }
  },

  _water: function (plotIndex) {
    var result = FarmManager.water(plotIndex);
    if (result.ok) {
      EventBus.emit('toast:show', { type: 'success', message: '💧 浇水成功，生长加速20%' });
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
    }
  },

  _fertilize: function (plotIndex) {
    var result = FarmManager.fertilize(plotIndex);
    if (result.ok) {
      EventBus.emit('toast:show', { type: 'success', message: '🧪 施肥成功，产量提升' });
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
    }
  },

  _removeBug: function (plotIndex) {
    var result = FarmManager.removeBug(plotIndex);
    if (result.ok) {
      EventBus.emit('toast:show', { type: 'success', message: '🐛 除虫成功！' });
    } else {
      EventBus.emit('toast:show', { type: 'error', message: result.reason });
    }
  },

  _buySeed: function (cropId) {
    var result = FarmManager.buySeed(cropId);
    if (result.ok) {
      var crop = CropData[cropId];
      EventBus.emit('toast:show', { type: 'success', message: '购买 ' + (crop ? crop.name : '') + ' 种子成功！' });
      this.show();
    } else {
      EventBus.emit('toast:show', { type: 'error', message: result.reason });
    }
  },

  _synthesize: function (recipeIndex) {
    var result = FarmManager.synthesizeSeed(recipeIndex);
    if (result.ok) {
      var crop = CropData[CropSynthesis[recipeIndex].result];
      EventBus.emit('toast:show', { type: 'success', message: '🔬 合成 ' + (crop ? crop.name : '') + ' 种子成功！' });
    } else {
      EventBus.emit('toast:show', { type: 'error', message: result.reason });
    }
  },

  _cook: function (recipeId) {
    var buff = FarmManager.getActiveBuff();
    if (buff) {
      Modal.show({
        title: '确认料理',
        content: '<p>当前已有增益效果，制作新料理将覆盖旧效果。确定制作吗？</p>',
        confirmText: '确定制作',
        onConfirm: function () {
          FarmPanel._doCook(recipeId);
        }
      });
    } else {
      this._doCook(recipeId);
    }
  },

  _doCook: function (recipeId) {
    var result = FarmManager.cook(recipeId);
    if (result.ok) {
      var recipe = RecipeData[recipeId];
      EventBus.emit('toast:show', { type: 'success', message: '🍳 制作 ' + (recipe ? recipe.name : '') + ' 成功！' });
    } else {
      EventBus.emit('toast:show', { type: 'error', message: result.reason });
    }
  },

  _sellCrop: function (cropId) {
    var result = FarmManager.sellCrop(cropId, 1);
    if (result.ok) {
      EventBus.emit('toast:show', { type: 'success', message: UIIcons.icon('gold') + ' 出售成功，获得 ' + result.gold + ' 金' });
      this.show();
    } else {
      EventBus.emit('toast:show', { type: 'error', message: result.reason });
    }
  },

  _makeFertilizer: function () {
    var result = FarmManager.makeFertilizer();
    if (result.ok) {
      EventBus.emit('toast:show', { type: 'success', message: '♻️ 肥料制作成功！' });
      this.show();
    } else {
      EventBus.emit('toast:show', { type: 'error', message: result.reason });
    }
  },

  _toggleAuto: function () {
    var result = FarmManager.toggleAutoHarvest();
    if (result.ok) {
      EventBus.emit('toast:show', { type: 'info', message: '自动收获' + (result.enabled ? '已开启' : '已关闭') });
    } else {
      EventBus.emit('toast:show', { type: 'warning', message: result.reason });
    }
  },

  // ===== Events =====

  _bindEvents: function () {
    // Events are bound via inline onclick
  },

  // ===== Helpers =====

  _getGardenLevel: function () {
    if (typeof TownManager === 'undefined') return 0;
    var state = TownManager.getState ? TownManager.getState() : null;
    if (!state || !state.buildings || !state.buildings.vegetable_garden) return 0;
    return state.buildings.vegetable_garden.level || 0;
  },

  _getBuildingLevel: function (id) {
    if (typeof TownManager === 'undefined') return 0;
    var state = TownManager.getState ? TownManager.getState() : null;
    if (!state || !state.buildings || !state.buildings[id]) return 0;
    return state.buildings[id].level || 0;
  },

  _formatTime: function (seconds) {
    seconds = Math.ceil(seconds);
    if (seconds <= 0) return '0s';
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    if (h > 0) return h + 'h' + (m > 0 ? m + 'm' : '');
    if (m > 0) return m + 'm' + (s > 0 ? s + 's' : '');
    return s + 's';
  }
};
