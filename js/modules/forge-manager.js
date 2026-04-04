/**
 * 锻造管理器 —— 武器工坊 / 铁匠铺主动锻造
 * 普通锻造（绿→橙）和 神话锻造（需图纸 + 持续消耗资源）
 */
var ForgeManager = {
  _state: {
    queue: [],
    maxQueue: 1,
    blueprints: []
  },

  // 普通锻造配方
  _normalRecipes: [
    { quality: 2, label: '绿色装备', time: 600,   cost: { gold: 500, iron: 100 } },
    { quality: 3, label: '蓝色装备', time: 1800,  cost: { gold: 2000, iron: 300, wood: 150 } },
    { quality: 4, label: '紫色装备', time: 7200,  cost: { gold: 8000, iron: 800, wood: 400, stone: 200 } },
    { quality: 5, label: '橙色装备', time: 28800, cost: { gold: 30000, iron: 2500, wood: 1200, stone: 800 } }
  ],

  init: function (saved) {
    var data = (saved && saved.forge) ? saved.forge : {};
    this._state.queue = data.queue || [];
    this._state.maxQueue = data.maxQueue || 1;
    this._state.blueprints = data.blueprints || [];
  },

  onTick: function (dt) {
    if (this._state.queue.length === 0) return;

    for (var i = 0; i < this._state.queue.length; i++) {
      var job = this._state.queue[i];
      if (job.completed) continue;

      if (job.quality === 6) {
        // 神话锻造：持续消耗资源
        this._tickMythicForge(job, dt);
      } else {
        // 普通锻造：只消耗时间
        job.elapsedTime += dt;
        if (job.elapsedTime >= job.totalTime) {
          this._completeForge(job, i);
        }
      }
    }
  },

  _tickMythicForge: function (job, dt) {
    if (job.paused) {
      // Check if resources are available to resume
      if (this._canAffordPerSec(job)) {
        job.paused = false;
      } else {
        return;
      }
    }

    // Consume resources per second
    var costPerSec = this._getMythicCostPerSec(job.totalTime);
    var canAfford = true;
    var resources = ['gold', 'iron', 'wood', 'stone'];
    for (var r = 0; r < resources.length; r++) {
      var res = resources[r];
      if (costPerSec[res] > 0 && !ResourceManager.canAfford(res, costPerSec[res] * dt)) {
        canAfford = false;
        break;
      }
    }

    if (!canAfford) {
      job.paused = true;
      EventBus.emit('forge:paused', { recipeId: job.recipeId, reason: '资源不足' });
      return;
    }

    // Deduct resources
    for (var s = 0; s < resources.length; s++) {
      var amount = costPerSec[resources[s]] * dt;
      if (amount > 0) {
        ResourceManager.spend(resources[s], Math.ceil(amount));
        job.consumed[resources[s]] = (job.consumed[resources[s]] || 0) + Math.ceil(amount);
      }
    }

    job.elapsedTime += dt;
    var pct = Math.floor(job.elapsedTime / job.totalTime * 100);
    EventBus.emit('forge:progress', { recipeId: job.recipeId, percent: pct });

    if (job.elapsedTime >= job.totalTime) {
      this._completeForge(job, this._state.queue.indexOf(job));
    }
  },

  _getMythicCostPerSec: function (totalTime) {
    return {
      gold: 36000 / totalTime,
      iron: 7200 / totalTime,
      wood: 3600 / totalTime,
      stone: 2400 / totalTime
    };
  },

  _canAffordPerSec: function (job) {
    var costPerSec = this._getMythicCostPerSec(job.totalTime);
    var resources = ['gold', 'iron', 'wood', 'stone'];
    for (var r = 0; r < resources.length; r++) {
      if (costPerSec[resources[r]] > 0 && !ResourceManager.canAfford(resources[r], Math.ceil(costPerSec[resources[r]]))) {
        return false;
      }
    }
    return true;
  },

  _completeForge: function (job, idx) {
    job.completed = true;

    var equip;
    if (job.quality === 6) {
      // Generate mythic equipment
      var template = getMythicTemplate(job.recipeId);
      if (!template) return;
      var statValue = Utils.randInt(template.statRange[0], template.statRange[1]);
      equip = {
        uid: Utils.uid(),
        id: template.id,
        name: template.name,
        type: template.type,
        quality: 6,
        emoji: template.emoji,
        description: template.description,
        setId: template.setId,
        unsellable: true,
        stats: {},
        level: 0,
        equippedBy: null
      };
      equip.stats[template.statType] = statValue;
    } else {
      // Generate random normal equipment at given quality
      var candidates = [];
      for (var i = 0; i < EquipmentData.length; i++) {
        if (EquipmentData[i].quality === job.quality) candidates.push(EquipmentData[i]);
      }
      if (candidates.length === 0) return;
      var tmpl = candidates[Utils.randInt(0, candidates.length - 1)];
      var sv = Utils.randInt(tmpl.statRange[0], tmpl.statRange[1]);
      equip = {
        uid: Utils.uid(),
        id: tmpl.id,
        name: tmpl.name,
        type: tmpl.type,
        quality: tmpl.quality,
        emoji: tmpl.emoji,
        description: tmpl.description,
        stats: {},
        level: 0,
        equippedBy: null
      };
      equip.stats[tmpl.statType] = sv;
    }

    EquipmentManager._inventory.push(equip);
    this._state.queue.splice(idx, 1);

    EventBus.emit('forge:completed', { equipment: equip });
    EventBus.emit('toast:show', { type: 'success', message: '🔨 锻造完成：' + equip.name + '！' });
  },

  /** 开始普通锻造 */
  startNormalForge: function (qualityIndex) {
    if (this._state.queue.length >= this._state.maxQueue) {
      EventBus.emit('toast:show', { type: 'warning', message: '锻造队列已满！' });
      return false;
    }

    var recipe = this._normalRecipes[qualityIndex];
    if (!recipe) return false;

    // Check level requirements
    var workshopLv = this._getWorkshopLevel();
    var blacksmithLv = this._getBlacksmithLevel();
    var reqLv = [1, 3, 5, 8][qualityIndex] || 1;
    if (workshopLv < reqLv || blacksmithLv < reqLv) {
      EventBus.emit('toast:show', { type: 'warning', message: '需要武器工坊和铁匠铺等级 ≥ ' + reqLv });
      return false;
    }

    // Check resources
    var costKeys = Object.keys(recipe.cost);
    for (var i = 0; i < costKeys.length; i++) {
      if (!ResourceManager.canAfford(costKeys[i], recipe.cost[costKeys[i]])) {
        EventBus.emit('toast:show', { type: 'warning', message: '资源不足！' });
        return false;
      }
    }

    // Deduct resources
    for (var j = 0; j < costKeys.length; j++) {
      ResourceManager.spend(costKeys[j], recipe.cost[costKeys[j]]);
    }

    this._state.queue.push({
      recipeId: 'normal_q' + recipe.quality,
      quality: recipe.quality,
      label: recipe.label,
      totalTime: recipe.time,
      elapsedTime: 0,
      completed: false
    });

    EventBus.emit('forge:started', { recipeId: 'normal_q' + recipe.quality, totalTime: recipe.time });
    EventBus.emit('toast:show', { type: 'info', message: '开始锻造 ' + recipe.label });
    return true;
  },

  /** 开始神话锻造 */
  startMythicForge: function (blueprintId) {
    if (this._state.queue.length >= this._state.maxQueue) {
      EventBus.emit('toast:show', { type: 'warning', message: '锻造队列已满！' });
      return false;
    }

    // Check blueprint
    var bpIdx = this._state.blueprints.indexOf(blueprintId);
    if (bpIdx === -1) {
      EventBus.emit('toast:show', { type: 'warning', message: '没有该锻造图纸！' });
      return false;
    }

    var bpData = BlueprintData[blueprintId];
    if (!bpData) return false;

    // Check level requirements
    var workshopLv = this._getWorkshopLevel();
    var blacksmithLv = this._getBlacksmithLevel();
    if (workshopLv < 10 || blacksmithLv < 10) {
      EventBus.emit('toast:show', { type: 'warning', message: '需要武器工坊和铁匠铺等级 ≥ 10' });
      return false;
    }

    // Calculate forge time based on workshop level
    var totalTime = Math.floor(86400 / (1 + 0.1 * (workshopLv - 10)));

    // Consume the blueprint
    this._state.blueprints.splice(bpIdx, 1);

    this._state.queue.push({
      recipeId: bpData.equipId,
      quality: 6,
      label: bpData.name,
      totalTime: totalTime,
      elapsedTime: 0,
      totalCost: { gold: 36000, iron: 7200, wood: 3600, stone: 2400 },
      consumed: { gold: 0, iron: 0, wood: 0, stone: 0 },
      paused: false,
      completed: false
    });

    EventBus.emit('forge:started', { recipeId: bpData.equipId, totalTime: totalTime });
    EventBus.emit('toast:show', { type: 'info', message: '⚒ 开始锻造神话装备：' + bpData.name.replace('·图纸', '') });
    return true;
  },

  /** 添加图纸 */
  addBlueprint: function (blueprintId) {
    if (this._state.blueprints.indexOf(blueprintId) === -1) {
      this._state.blueprints.push(blueprintId);
      var bp = BlueprintData[blueprintId];
      EventBus.emit('toast:show', { type: 'success', message: '📜 获得图纸：' + (bp ? bp.name : blueprintId) });
    }
  },

  _getWorkshopLevel: function () {
    if (typeof TownManager === 'undefined') return 0;
    var state = TownManager.getState();
    return (state.buildings && state.buildings.weapon_workshop) || 0;
  },

  _getBlacksmithLevel: function () {
    if (typeof TownManager === 'undefined') return 0;
    var state = TownManager.getState();
    return (state.buildings && state.buildings.blacksmith) || 0;
  },

  getQueue: function () { return this._state.queue; },
  getBlueprints: function () { return this._state.blueprints; },
  getMaxQueue: function () { return this._state.maxQueue; },

  getNormalRecipes: function () { return this._normalRecipes; },

  getState: function () {
    // Extract mythic forge info for UI
    var mythicForge = {};
    for (var i = 0; i < this._state.queue.length; i++) {
      var job = this._state.queue[i];
      if (job.isMythic) {
        mythicForge = {
          blueprintId: job.blueprintId,
          progress: job.progress || 0,
          requiredTime: job.requiredTime || 86400,
          paused: job.paused || false
        };
        break;
      }
    }

    return {
      queue: Utils.deepClone(this._state.queue),
      maxQueue: this._state.maxQueue,
      blueprints: this._state.blueprints.slice(),
      mythicForge: mythicForge
    };
  }
};
