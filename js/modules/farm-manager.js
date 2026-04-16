/**
 * 菜园管理器 — 种植、生长、收获、浇水、施肥、除虫、合成、料理
 * CAP-FARM-01 ~ CAP-FARM-11
 */
var FarmManager = {
  _state: {
    plots: [],         // [{cropId, state, plantedAt, watered, fertilized, hasBug, bugTriggered, remainHarvests}]
    inventory: {},     // { cropId: count } — 收获的作物
    seeds: {},         // { cropId: count } — 种子库存
    fertilizer: 0,     // 肥料数量
    farmExp: 0,        // 农耕经验
    autoHarvest: false, // 自动收获开关
    activeBuff: null   // { recipeId, effects, activatedAt, duration }
  },

  init: function (saved) {
    var data = (saved && saved.farm) ? saved.farm : {};
    this._state.inventory = data.inventory || {};
    this._state.seeds = data.seeds || {};
    this._state.fertilizer = data.fertilizer || 0;
    this._state.farmExp = data.farmExp || 0;
    this._state.autoHarvest = data.autoHarvest || false;
    this._state.activeBuff = data.activeBuff || null;

    // 战斗胜利 → 小概率获得种子/肥料
    var self = this;
    EventBus.on('battle:ended', function (data) {
      if (!data || !data.victory) return;
      var gardenLevel = self._getGardenLevel();
      if (gardenLevel < 1) return;
      // 20% 概率掉种子
      if (Math.random() < 0.2) {
        var cropIds = Object.keys(CropData || {});
        if (cropIds.length > 0) {
          var seedId = cropIds[Utils.randInt(0, cropIds.length - 1)];
          self._state.seeds[seedId] = (self._state.seeds[seedId] || 0) + 1;
          EventBus.emit('toast:show', { type: 'info', message: '🌱 战利品：获得 ' + (CropData[seedId] ? CropData[seedId].name : seedId) + ' 种子×1' });
        }
      }
      // Boss 关卡额外奖励肥料
      if (data.stageId && data.stageId.indexOf('boss') !== -1) {
        self._state.fertilizer = Math.min(self._state.fertilizer + 1, 20);
        EventBus.emit('toast:show', { type: 'info', message: '🧪 Boss 战利品：获得肥料×1' });
      }
    });

    // Restore plots or create empty based on garden level
    var gardenLevel = this._getGardenLevel();
    var plotCount = this._getPlotCount(gardenLevel);
    if (data.plots && data.plots.length > 0) {
      this._state.plots = data.plots;
      // Adjust plot count if garden upgraded
      while (this._state.plots.length < plotCount) {
        this._state.plots.push(this._emptyPlot());
      }
    } else {
      this._state.plots = [];
      for (var i = 0; i < plotCount; i++) {
        this._state.plots.push(this._emptyPlot());
      }
    }
  },

  getState: function () {
    return Utils.deepClone(this._state);
  },

  // ===== Tick =====

  onTick: function (dt) {
    var gardenLevel = this._getGardenLevel();
    if (gardenLevel < 1) return; // 菜园未建造

    // Adjust plot count on garden upgrade
    var plotCount = this._getPlotCount(gardenLevel);
    while (this._state.plots.length < plotCount) {
      this._state.plots.push(this._emptyPlot());
    }

    var now = Date.now();
    for (var i = 0; i < this._state.plots.length; i++) {
      var plot = this._state.plots[i];
      if (plot.state === 'growing') {
        this._tickGrowing(plot, i, now, gardenLevel);
      } else if (plot.state === 'ready') {
        this._tickReady(plot, i, now);
      }
    }

    // Auto-harvest (CAP-FARM-09): 菜园 Lv.≥5 + autoHarvest=true
    if (this._state.autoHarvest && gardenLevel >= 5) {
      for (var j = 0; j < this._state.plots.length; j++) {
        if (this._state.plots[j].state === 'ready') {
          this.harvest(j, true); // isAuto = true → 80% yields
        }
      }
    }

    // Buff expiry check
    if (this._state.activeBuff) {
      var buff = this._state.activeBuff;
      if (now - buff.activatedAt >= buff.duration * 1000) {
        this._state.activeBuff = null;
        EventBus.emit('farm:buff_expired', {});
      }
    }
  },

  _tickGrowing: function (plot, plotIndex, now, gardenLevel) {
    var crop = CropData[plot.cropId];
    if (!crop) return;

    var elapsed = now - plot.plantedAt;
    var actualGrowthTime = this._getActualGrowthTime(crop, plot, gardenLevel);

    // Bug trigger: once at ≥50% progress, 15% chance (reduced by mastery)
    if (!plot.bugTriggered) {
      var progress = elapsed / (actualGrowthTime * 1000);
      if (progress >= 0.5) {
        plot.bugTriggered = true;
        var bugChance = 0.15;
        var mastery = this.getFarmMastery();
        if (mastery.bugReduction > 0) {
          bugChance *= (1 - mastery.bugReduction);
        }
        if (Math.random() < bugChance) {
          plot.hasBug = true;
          EventBus.emit('farm:bug_alert', { plotIndex: plotIndex, cropId: plot.cropId });
        }
      }
    }

    // Growth complete
    if (elapsed >= actualGrowthTime * 1000) {
      plot.state = 'ready';
      plot.readyAt = now;
      EventBus.emit('farm:crop_ready', { plotIndex: plotIndex, cropId: plot.cropId });
    }
  },

  _tickReady: function (plot, plotIndex, now) {
    // Wither after 48h
    var WITHER_MS = 48 * 3600 * 1000;
    if (plot.readyAt && (now - plot.readyAt) >= WITHER_MS) {
      plot.state = 'idle';
      plot.cropId = null;
      plot.plantedAt = null;
      plot.readyAt = null;
      plot.watered = false;
      plot.fertilized = false;
      plot.hasBug = false;
      plot.bugTriggered = false;
      plot.remainHarvests = 0;
      plot.isReharvest = false;
      EventBus.emit('farm:withered', { plotIndex: plotIndex });
    }
  },

  // ===== CAP-FARM-01: 播种 =====

  plant: function (plotIndex, cropId) {
    var plot = this._state.plots[plotIndex];
    if (!plot) return { ok: false, reason: '无效田地' };
    if (plot.state !== 'idle') return { ok: false, reason: '田地已占用' };

    var crop = CropData[cropId];
    if (!crop) return { ok: false, reason: '未知作物' };

    // Check quality unlock
    var gardenLevel = this._getGardenLevel();
    var gardenData = GardenLevelData[gardenLevel];
    if (!gardenData || crop.quality > gardenData.qualityUnlock) {
      return { ok: false, reason: '菜园等级不足，无法种植该品级作物' };
    }

    // Check seeds
    if (!this._state.seeds[cropId] || this._state.seeds[cropId] <= 0) {
      return { ok: false, reason: '种子不足' };
    }

    this._state.seeds[cropId]--;
    if (this._state.seeds[cropId] <= 0) delete this._state.seeds[cropId];

    plot.cropId = cropId;
    plot.state = 'growing';
    plot.plantedAt = Date.now();
    plot.watered = false;
    plot.fertilized = false;
    plot.hasBug = false;
    plot.bugTriggered = false;
    plot.remainHarvests = crop.reharvestCount || 0;
    plot.isReharvest = false;

    EventBus.emit('farm:planted', { plotIndex: plotIndex, cropId: cropId });
    return { ok: true };
  },

  // ===== CAP-FARM-03: 收获 =====

  harvest: function (plotIndex, isAuto) {
    var plot = this._state.plots[plotIndex];
    if (!plot || plot.state !== 'ready') return { ok: false, reason: '作物未成熟' };

    var crop = CropData[plot.cropId];
    if (!crop) return { ok: false, reason: '未知作物' };

    // Calculate yields
    var yieldMultiplier = 1;

    // Bug penalty
    if (plot.hasBug) {
      yieldMultiplier *= 0.7; // -30%
    }

    // Auto-harvest penalty
    if (isAuto) {
      yieldMultiplier *= 0.8;
    }

    // Fertilizer bonus: compost_pit_level × 5%
    if (plot.fertilized) {
      var compostLevel = this._getBuildingLevel('compost_pit');
      yieldMultiplier *= (1 + compostLevel * 0.05);
    }

    // Farm mastery bonus
    var mastery = this.getFarmMastery();
    yieldMultiplier *= (1 + mastery.yieldBonus);

    // Double harvest chance
    var gardenLevel = this._getGardenLevel();
    var gardenData = GardenLevelData[gardenLevel];
    var isDouble = false;
    if (gardenData && gardenData.doubleChance > 0) {
      if (Math.random() < gardenData.doubleChance) {
        yieldMultiplier *= 2;
        isDouble = true;
      }
    }

    // Apply yields
    var actualYields = {};
    for (var res in crop.yields) {
      if (crop.yields.hasOwnProperty(res)) {
        var amount = Math.floor(crop.yields[res] * yieldMultiplier);
        if (amount > 0) {
          actualYields[res] = amount;
          if (res === 'gold' || res === 'food' || res === 'wood' || res === 'stone' || res === 'iron' || res === 'jade') {
            ResourceManager.add(res, amount);
          } else if (res === 'exp') {
            ResourceManager.add('exp', amount);
          }
        }
      }
    }

    // Add harvested crop to inventory
    var cropId = plot.cropId;
    if (!this._state.inventory[cropId]) this._state.inventory[cropId] = 0;
    this._state.inventory[cropId]++;

    // Farm exp
    this._state.farmExp += crop.farmExp || 0;

    // Check reharvest (e.g., chives)
    if (plot.remainHarvests > 0) {
      plot.remainHarvests--;
      plot.state = 'growing';
      plot.plantedAt = Date.now(); // regrow from now
      plot.watered = false;
      plot.fertilized = false;
      plot.hasBug = false;
      plot.bugTriggered = false;
      // Use reharvestTime if defined, otherwise full growthTime
      if (crop.reharvestTime) {
        // Store the fact that this is a reharvest cycle with shorter time
        plot.isReharvest = true;
      }
    } else {
      // Reset plot
      plot.state = 'idle';
      plot.cropId = null;
      plot.plantedAt = null;
      plot.readyAt = null;
      plot.watered = false;
      plot.fertilized = false;
      plot.hasBug = false;
      plot.bugTriggered = false;
      plot.remainHarvests = 0;
      plot.isReharvest = false;
    }

    if (isDouble) {
      EventBus.emit('toast:show', { type: 'success', message: '🎉 大丰收！产量翻倍！' });
    }

    EventBus.emit('farm:harvested', { plotIndex: plotIndex, cropId: cropId, yields: actualYields, isDouble: isDouble });

    // Economy log
    if (typeof EconomyManager !== 'undefined' && EconomyManager.logEvent) {
      EconomyManager.logEvent({ category: 'farming', type: 'income', source: 'harvest', details: actualYields });
    }

    return { ok: true, yields: actualYields, isDouble: isDouble };
  },

  // ===== CAP-FARM-04: 浇水 =====

  water: function (plotIndex) {
    var plot = this._state.plots[plotIndex];
    if (!plot) return { ok: false, reason: '无效田地' };
    if (plot.state !== 'growing') return { ok: false, reason: '作物未在生长中' };
    if (plot.watered) return { ok: false, reason: '已浇过水' };

    plot.watered = true;
    EventBus.emit('farm:watered', { plotIndex: plotIndex });
    return { ok: true };
  },

  // ===== CAP-FARM-05: 施肥 =====

  fertilize: function (plotIndex) {
    var plot = this._state.plots[plotIndex];
    if (!plot) return { ok: false, reason: '无效田地' };
    if (plot.state !== 'growing') return { ok: false, reason: '作物未在生长中' };
    if (plot.fertilized) return { ok: false, reason: '已施过肥' };
    if (this._state.fertilizer <= 0) return { ok: false, reason: '肥料不足' };

    this._state.fertilizer--;
    plot.fertilized = true;
    EventBus.emit('farm:fertilized', { plotIndex: plotIndex });
    return { ok: true };
  },

  // ===== CAP-FARM-06: 除虫 =====

  removeBug: function (plotIndex) {
    var plot = this._state.plots[plotIndex];
    if (!plot) return { ok: false, reason: '无效田地' };
    if (!plot.hasBug) return { ok: false, reason: '没有虫害' };

    var cost = 50;
    if (!ResourceManager.canAfford('gold', cost)) {
      return { ok: false, reason: '金币不足（需要' + cost + '金）' };
    }

    ResourceManager.spend('gold', cost, 'farming', 'bug_removal');
    plot.hasBug = false;
    EventBus.emit('farm:bug_removed', { plotIndex: plotIndex });

    if (typeof EconomyManager !== 'undefined' && EconomyManager.logEvent) {
      EconomyManager.logEvent({ category: 'farming', type: 'expense', source: 'bug_removal', details: { gold: cost } });
    }

    return { ok: true };
  },

  // ===== CAP-FARM-10: 种子购买 =====

  buySeed: function (cropId) {
    var crop = CropData[cropId];
    if (!crop) return { ok: false, reason: '未知作物' };

    // Check seed shop level
    var shopLevel = this._getBuildingLevel('seed_shop');
    if (shopLevel < 1) return { ok: false, reason: '需要建造种子铺' };
    if (crop.quality > shopLevel) return { ok: false, reason: '种子铺等级不足，无法购买该品级种子' };

    // Calculate cost with discount
    var discount = 0.05 * (shopLevel - 1);
    var cost = {};
    for (var res in crop.seedCost) {
      if (crop.seedCost.hasOwnProperty(res)) {
        cost[res] = Math.floor(crop.seedCost[res] * (1 - discount));
      }
    }

    // Check and deduct resources
    if (!ResourceManager.canAffordMultiple(cost)) {
      return { ok: false, reason: '资源不足' };
    }
    ResourceManager.spendMultiple(cost, 'farming', 'seed_shop', cropId);

    if (!this._state.seeds[cropId]) this._state.seeds[cropId] = 0;
    this._state.seeds[cropId]++;

    EventBus.emit('farm:seed_bought', { cropId: cropId, cost: cost });

    if (typeof EconomyManager !== 'undefined' && EconomyManager.logEvent) {
      EconomyManager.logEvent({ category: 'farming', type: 'expense', source: 'seed_purchase', details: cost });
    }

    return { ok: true };
  },

  // ===== CAP-FARM-07: 种子合成 =====

  synthesizeSeed: function (recipeIndex) {
    var recipe = CropSynthesis[recipeIndex];
    if (!recipe) return { ok: false, reason: '未知配方' };

    // Check seed shop level
    var shopLevel = this._getBuildingLevel('seed_shop');
    if (shopLevel < recipe.minShopLevel) {
      return { ok: false, reason: '种子铺等级不足（需 Lv.' + recipe.minShopLevel + '）' };
    }

    // Check materials from inventory
    for (var mat in recipe.materials) {
      if (recipe.materials.hasOwnProperty(mat)) {
        var required = recipe.materials[mat];
        var have = this._state.inventory[mat] || 0;
        if (have < required) {
          return { ok: false, reason: '材料不足：' + (CropData[mat] ? CropData[mat].name : mat) };
        }
      }
    }

    // Deduct materials
    for (var m in recipe.materials) {
      if (recipe.materials.hasOwnProperty(m)) {
        this._state.inventory[m] -= recipe.materials[m];
        if (this._state.inventory[m] <= 0) delete this._state.inventory[m];
      }
    }

    // Add seed
    if (!this._state.seeds[recipe.result]) this._state.seeds[recipe.result] = 0;
    this._state.seeds[recipe.result]++;

    EventBus.emit('farm:seed_synthesized', { recipeIndex: recipeIndex, result: recipe.result });
    return { ok: true };
  },

  // ===== CAP-FARM-08: 料理 =====

  cook: function (recipeId) {
    var recipe = RecipeData[recipeId];
    if (!recipe) return { ok: false, reason: '未知料理' };

    // Check garden level ≥ 5
    var gardenLevel = this._getGardenLevel();
    if (gardenLevel < 5) return { ok: false, reason: '菜园 Lv.5 才能解锁料理' };

    // Check materials from inventory
    for (var mat in recipe.materials) {
      if (recipe.materials.hasOwnProperty(mat)) {
        var required = recipe.materials[mat];
        var have = this._state.inventory[mat] || 0;
        if (have < required) {
          return { ok: false, reason: '材料不足：' + (CropData[mat] ? CropData[mat].name : mat) };
        }
      }
    }

    // Deduct materials
    for (var m in recipe.materials) {
      if (recipe.materials.hasOwnProperty(m)) {
        this._state.inventory[m] -= recipe.materials[m];
        if (this._state.inventory[m] <= 0) delete this._state.inventory[m];
      }
    }

    var wasOverridden = this._state.activeBuff !== null;

    // Set buff
    this._state.activeBuff = {
      recipeId: recipeId,
      effects: Utils.deepClone(recipe.effects),
      activatedAt: Date.now(),
      duration: recipe.duration
    };

    EventBus.emit('farm:cooked', { recipeId: recipeId, overridden: wasOverridden });

    if (wasOverridden) {
      EventBus.emit('toast:show', { type: 'info', message: '新料理已覆盖旧的增益效果' });
    }

    return { ok: true, overridden: wasOverridden };
  },

  // ===== CAP-FARM-09: 自动收获 toggle =====

  toggleAutoHarvest: function () {
    var gardenLevel = this._getGardenLevel();
    if (gardenLevel < 5) return { ok: false, reason: '菜园 Lv.5 解锁自动收获' };
    this._state.autoHarvest = !this._state.autoHarvest;
    EventBus.emit('farm:auto_harvest_toggled', { enabled: this._state.autoHarvest });
    return { ok: true, enabled: this._state.autoHarvest };
  },

  // ===== 肥料制作 =====

  makeFertilizer: function () {
    // 消耗 3 个普通作物 → 1 肥料
    var compostLevel = this._getBuildingLevel('compost_pit');
    if (compostLevel < 1) return { ok: false, reason: '需要建造堆肥坑' };

    // Find common crops in inventory
    var commonCrops = [];
    for (var cropId in this._state.inventory) {
      if (this._state.inventory.hasOwnProperty(cropId)) {
        var crop = CropData[cropId];
        if (crop && crop.quality === 1 && this._state.inventory[cropId] > 0) {
          commonCrops.push(cropId);
        }
      }
    }

    // Count total common crops
    var total = 0;
    for (var i = 0; i < commonCrops.length; i++) {
      total += this._state.inventory[commonCrops[i]];
    }
    if (total < 3) return { ok: false, reason: '普通作物不足（需要3个）' };

    // Check max fertilizer cap
    var maxFert = 10 + 5 * compostLevel;
    if (this._state.fertilizer >= maxFert) return { ok: false, reason: '肥料已满（上限' + maxFert + '）' };

    // Deduct 3 common crops (round-robin)
    var toDeduct = 3;
    for (var j = 0; j < commonCrops.length && toDeduct > 0; j++) {
      var cid = commonCrops[j];
      var take = Math.min(toDeduct, this._state.inventory[cid]);
      this._state.inventory[cid] -= take;
      if (this._state.inventory[cid] <= 0) delete this._state.inventory[cid];
      toDeduct -= take;
    }

    this._state.fertilizer++;
    EventBus.emit('farm:fertilizer_made', { fertilizer: this._state.fertilizer });
    return { ok: true };
  },

  // ===== 出售作物 =====

  sellCrop: function (cropId, count) {
    if (!this._state.inventory[cropId] || this._state.inventory[cropId] < count) {
      return { ok: false, reason: '作物数量不足' };
    }
    var crop = CropData[cropId];
    if (!crop) return { ok: false, reason: '未知作物' };

    var goldPerCrop = Math.floor((crop.seedCost.gold || 10) * 0.6);
    var totalGold = goldPerCrop * count;

    this._state.inventory[cropId] -= count;
    if (this._state.inventory[cropId] <= 0) delete this._state.inventory[cropId];

    ResourceManager.add('gold', totalGold);
    EventBus.emit('farm:crop_sold', { cropId: cropId, count: count, gold: totalGold });

    if (typeof EconomyManager !== 'undefined' && EconomyManager.logEvent) {
      EconomyManager.logEvent({ category: 'farming', type: 'income', source: 'crop_sale', details: { gold: totalGold } });
    }

    return { ok: true, gold: totalGold };
  },

  // ===== 查询 API =====

  getActiveBuff: function () {
    if (!this._state.activeBuff) return null;
    var now = Date.now();
    var buff = this._state.activeBuff;
    if (now - buff.activatedAt >= buff.duration * 1000) {
      this._state.activeBuff = null;
      return null;
    }
    return Utils.deepClone(buff);
  },

  getFarmMastery: function () {
    var exp = this._state.farmExp;
    var level = FarmMasteryData[0];
    for (var i = FarmMasteryData.length - 1; i >= 0; i--) {
      if (exp >= FarmMasteryData[i].minExp) {
        level = FarmMasteryData[i];
        break;
      }
    }
    return Utils.deepClone(level);
  },

  getPlotProgress: function (plotIndex) {
    var plot = this._state.plots[plotIndex];
    if (!plot || plot.state !== 'growing') return null;
    var crop = CropData[plot.cropId];
    if (!crop) return null;
    var gardenLevel = this._getGardenLevel();
    var actualTime = this._getActualGrowthTime(crop, plot, gardenLevel);
    var elapsed = (Date.now() - plot.plantedAt) / 1000;
    return Math.min(1, elapsed / actualTime);
  },

  getRemainingTime: function (plotIndex) {
    var plot = this._state.plots[plotIndex];
    if (!plot || plot.state !== 'growing') return 0;
    var crop = CropData[plot.cropId];
    if (!crop) return 0;
    var gardenLevel = this._getGardenLevel();
    var actualTime = this._getActualGrowthTime(crop, plot, gardenLevel);
    var elapsed = (Date.now() - plot.plantedAt) / 1000;
    return Math.max(0, actualTime - elapsed);
  },

  // ===== Internal Helpers =====

  _emptyPlot: function () {
    return {
      cropId: null,
      state: 'idle',        // idle | growing | ready
      plantedAt: null,
      readyAt: null,
      watered: false,
      fertilized: false,
      hasBug: false,
      bugTriggered: false,
      remainHarvests: 0,
      isReharvest: false
    };
  },

  _getGardenLevel: function () {
    if (typeof TownManager === 'undefined') return 0;
    var buildings = TownManager.getState ? TownManager.getState().buildings : null;
    if (!buildings || !buildings.vegetable_garden) return 0;
    return buildings.vegetable_garden.level || 0;
  },

  _getBuildingLevel: function (buildingId) {
    if (typeof TownManager === 'undefined') return 0;
    var buildings = TownManager.getState ? TownManager.getState().buildings : null;
    if (!buildings || !buildings[buildingId]) return 0;
    return buildings[buildingId].level || 0;
  },

  _getPlotCount: function (gardenLevel) {
    if (gardenLevel < 1) return 0;
    var data = GardenLevelData[gardenLevel];
    return data ? data.plots : (gardenLevel + 1);
  },

  _getActualGrowthTime: function (crop, plot, gardenLevel) {
    // base time in seconds
    var base = crop.growthTime;

    // Use reharvestTime for reharvest cycles
    if (plot.isReharvest && crop.reharvestTime) {
      base = crop.reharvestTime;
    }

    var gardenData = GardenLevelData[gardenLevel];
    var gardenSpeed = gardenData ? gardenData.speedBonus : 0;
    var waterBonus = plot.watered ? 0.20 : 0;
    var fertBonus = plot.fertilized ? 0.30 : 0;

    var totalSpeed = 1 + gardenSpeed + waterBonus + fertBonus;
    return base / totalSpeed;
  }
};
