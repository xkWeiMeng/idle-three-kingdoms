/**
 * 商人管理器 —— 糜竺的商铺
 * 普通货架每 4 小时刷新，镇店之宝（神话饰品）常驻
 */
var MerchantManager = {
  _state: {
    lastRefresh: 0,
    refreshInterval: 14400,
    normalStock: [],
    permanentStock: [],
    permanentSold: {}
  },

  _qualityCoeff: { 1: 1, 2: 2.5, 3: 6, 4: 15, 5: 40 },
  _typeBasePrice: { weapon: 200, armor: 200, accessory: 180, mount: 220 },
  _qualityWeights: { 1: 35, 2: 30, 3: 20, 4: 12, 5: 3 },

  init: function (saved) {
    var data = (saved && saved.merchant) ? saved.merchant : {};
    this._state.lastRefresh = data.lastRefresh || 0;
    this._state.normalStock = data.normalStock || [];
    this._state.permanentSold = data.permanentSold || {};
    this._state.refreshInterval = data.refreshInterval || 14400;

    // Initialize permanent stock status
    this._initPermanentStock();

    // Check if need refresh on load
    var now = Math.floor(Date.now() / 1000);
    if (this._state.normalStock.length === 0 || (now - this._state.lastRefresh) >= this._state.refreshInterval) {
      this._refreshStock();
    }
  },

  _initPermanentStock: function () {
    this._state.permanentStock = [];
    for (var i = 0; i < MerchantPermanentStock.length; i++) {
      var item = MerchantPermanentStock[i];
      var template = getMythicTemplate(item.equipId);
      this._state.permanentStock.push({
        equipId: item.equipId,
        price: item.price,
        setId: item.setId,
        sold: !!this._state.permanentSold[item.equipId],
        name: template ? template.name : item.equipId,
        description: template ? template.description : ''
      });
    }
  },

  onTick: function (dt) {
    var now = Math.floor(Date.now() / 1000);
    if ((now - this._state.lastRefresh) >= this._state.refreshInterval) {
      this._refreshStock();
    }
  },

  _refreshStock: function () {
    this._state.lastRefresh = Math.floor(Date.now() / 1000);
    this._state.normalStock = [];

    for (var i = 0; i < 6; i++) {
      var quality = this._rollQuality();
      var types = ['weapon', 'armor', 'accessory', 'mount'];
      var type = types[Utils.randInt(0, 3)];

      var template = null;
      for (var j = 0; j < EquipmentData.length; j++) {
        if (EquipmentData[j].type === type && EquipmentData[j].quality === quality) {
          template = EquipmentData[j];
          break;
        }
      }
      if (!template) continue;

      var statValue = Utils.randInt(template.statRange[0], template.statRange[1]);
      var basePrice = (this._qualityCoeff[quality] || 1) * (this._typeBasePrice[type] || 200);
      var variation = 0.9 + Math.random() * 0.2;
      var price = Math.floor(basePrice * variation);

      this._state.normalStock.push({
        uid: Utils.uid(),
        templateId: template.id,
        name: template.name,
        emoji: template.emoji,
        type: template.type,
        quality: template.quality,
        statType: template.statType,
        statValue: statValue,
        description: template.description,
        price: price,
        sold: false
      });
    }

    EventBus.emit('merchant:refreshed', { stock: this._state.normalStock });
  },

  _rollQuality: function () {
    var total = 0;
    var keys = Object.keys(this._qualityWeights);
    for (var i = 0; i < keys.length; i++) total += this._qualityWeights[keys[i]];
    var roll = Math.random() * total;
    var cum = 0;
    for (var j = 0; j < keys.length; j++) {
      cum += this._qualityWeights[keys[j]];
      if (roll < cum) return parseInt(keys[j]);
    }
    return 1;
  },

  /** 手动刷新（花费 30 玉璧） */
  manualRefresh: function () {
    if (!ResourceManager.canAfford('jade', 30)) {
      EventBus.emit('toast:show', { type: 'warning', message: '玉璧不足！需要💎×30' });
      return false;
    }
    ResourceManager.spend('jade', 30);
    this._refreshStock();
    EventBus.emit('toast:show', { type: 'success', message: '商铺已刷新！' });
    return true;
  },

  /** 购买普通商品 */
  buyNormal: function (itemUid) {
    var item = null;
    for (var i = 0; i < this._state.normalStock.length; i++) {
      if (this._state.normalStock[i].uid === itemUid) {
        item = this._state.normalStock[i];
        break;
      }
    }
    if (!item || item.sold) {
      EventBus.emit('toast:show', { type: 'warning', message: '商品不存在或已售出' });
      return false;
    }
    if (!ResourceManager.canAfford('gold', item.price)) {
      EventBus.emit('toast:show', { type: 'warning', message: '金币不足！需要💰×' + Utils.formatNumber(item.price) });
      return false;
    }

    // Check inventory space
    if (EquipmentManager.getInventory().length >= EquipmentManager._maxSlots) {
      EventBus.emit('toast:show', { type: 'warning', message: '背包已满！' });
      return false;
    }

    ResourceManager.spend('gold', item.price);
    item.sold = true;

    // Create equipment instance and add to inventory
    var template = null;
    for (var j = 0; j < EquipmentData.length; j++) {
      if (EquipmentData[j].id === item.templateId) { template = EquipmentData[j]; break; }
    }

    var equip = {
      uid: Utils.uid(),
      id: item.templateId,
      name: item.name,
      type: item.type,
      quality: item.quality,
      emoji: item.emoji,
      description: item.description,
      stats: {},
      level: 0,
      equippedBy: null
    };
    equip.stats[item.statType] = item.statValue;

    EquipmentManager._inventory.push(equip);
    EventBus.emit('merchant:purchased', { item: equip, price: item.price });
    EventBus.emit('toast:show', { type: 'success', message: '购买了 ' + item.name + '！' });
    return true;
  },

  /** 购买镇店之宝（神话饰品） */
  buyPermanent: function (equipId) {
    var item = null;
    for (var i = 0; i < this._state.permanentStock.length; i++) {
      if (this._state.permanentStock[i].equipId === equipId) {
        item = this._state.permanentStock[i];
        break;
      }
    }
    if (!item || item.sold) {
      EventBus.emit('toast:show', { type: 'warning', message: '已购买过此物品' });
      return false;
    }
    if (!ResourceManager.canAfford('gold', item.price)) {
      EventBus.emit('toast:show', { type: 'warning', message: '金币不足！需要💰×' + Utils.formatNumber(item.price) });
      return false;
    }
    if (EquipmentManager.getInventory().length >= EquipmentManager._maxSlots) {
      EventBus.emit('toast:show', { type: 'warning', message: '背包已满！' });
      return false;
    }

    ResourceManager.spend('gold', item.price);
    item.sold = true;
    this._state.permanentSold[equipId] = true;

    // Create mythic equipment instance
    var template = getMythicTemplate(equipId);
    if (!template) return false;

    var statValue = Utils.randInt(template.statRange[0], template.statRange[1]);
    var equip = {
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

    EquipmentManager._inventory.push(equip);
    EventBus.emit('merchant:purchased', { item: equip, price: item.price });
    EventBus.emit('toast:show', { type: 'success', message: '🔴 获得神话装备：' + template.name + '！' });
    return true;
  },

  /** 距下次刷新的剩余秒数 */
  getRefreshCountdown: function () {
    var now = Math.floor(Date.now() / 1000);
    var elapsed = now - this._state.lastRefresh;
    return Math.max(0, this._state.refreshInterval - elapsed);
  },

  getNormalStock: function () { return this._state.normalStock; },
  getPermanentStock: function () { return this._state.permanentStock; },

  getState: function () {
    return {
      lastRefresh: this._state.lastRefresh,
      normalStock: Utils.deepClone(this._state.normalStock),
      permanentSold: Utils.deepClone(this._state.permanentSold),
      refreshInterval: this._state.refreshInterval
    };
  }
};
