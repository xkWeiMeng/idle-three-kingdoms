/**
 * 弹珠（柏青哥）管理器
 *
 * 玩法：
 *   - 每颗弹珠消耗 10 玉璧
 *   - 支持同时多颗弹珠飞行，只要玉璧够就可以连续发射
 *   - 弹珠通过物理模拟落入底部奖槽
 *   - 根据奖槽类型发放奖励（玉璧 + 装备）
 *   - 无需解锁，直接可用，无次数限制
 */
var PachinkoManager = {

  _state: {
    totalPlays: 0,
    totalSpent: 0,
    totalWon: 0,
    jackpotCount: 0,
    history: []
  },

  init: function (saved) {
    var data = (saved && saved.pachinko) ? saved.pachinko : {};
    this._state.totalPlays = data.totalPlays || 0;
    this._state.totalSpent = data.totalSpent || 0;
    this._state.totalWon = data.totalWon || 0;
    this._state.jackpotCount = data.jackpotCount || 0;
    this._state.history = data.history || [];
  },

  getState: function () {
    return {
      totalPlays: this._state.totalPlays,
      totalSpent: this._state.totalSpent,
      totalWon: this._state.totalWon,
      jackpotCount: this._state.jackpotCount,
      history: this._state.history.slice()
    };
  },

  /** 能否发射弹珠（只检查玉璧） */
  canLaunch: function () {
    if (ResourceManager.get('jade') < PachinkoData.COST_PER_BALL) {
      return { ok: false, reason: 'no_jade' };
    }
    return { ok: true };
  },

  /** 发射弹珠（扣费） */
  launch: function () {
    var check = this.canLaunch();
    if (!check.ok) {
      if (check.reason === 'no_jade') {
        EventBus.emit('toast:show', { type: 'warning', message: '💎 玉璧不足！需要 ' + PachinkoData.COST_PER_BALL + ' 玉璧' });
      }
      return false;
    }

    ResourceManager.add('jade', -PachinkoData.COST_PER_BALL, 'pachinko', 'ball_launch');
    this._state.totalPlays++;
    this._state.totalSpent += PachinkoData.COST_PER_BALL;

    EventBus.emit('pachinko:launched', { ballId: this._state.totalPlays });
    return true;
  },

  /** 弹珠落槽结算 */
  settle: function (slotIndex) {
    var slot = PachinkoData.SLOTS[slotIndex];
    if (!slot) return null;

    var result = {
      slotIndex: slotIndex,
      slotType: slot.type,
      jade: 0,
      equipment: null,
      time: Date.now()
    };

    // 玉璧奖励
    if (slot.jadeRange[1] > 0) {
      result.jade = Utils.randInt(slot.jadeRange[0], slot.jadeRange[1]);
      if (result.jade > 0) {
        ResourceManager.add('jade', result.jade, 'pachinko', 'prize_' + slot.type);
        this._state.totalWon += result.jade;
      }
    }

    // 装备奖励
    if (slot.equipChance > 0 && Math.random() < slot.equipChance) {
      var equip = this._rollEquipment(slot.equipQuality);
      if (equip) {
        result.equipment = { name: equip.name, quality: equip.quality, uid: equip.uid };
      }
    }

    // 超级大奖
    if (slot.type === 'jackpot') {
      this._state.jackpotCount++;
      EventBus.emit('pachinko:jackpot', { jade: result.jade, equipment: result.equipment });
    }

    // 记录历史
    this._state.history.unshift({
      prize: slot.type,
      jade: result.jade,
      equip: result.equipment ? result.equipment.name : null,
      time: result.time
    });
    if (this._state.history.length > 20) {
      this._state.history.length = 20;
    }

    EventBus.emit('pachinko:landed', { slotIndex: slotIndex, prize: result });
    return result;
  },

  /** 根据品质权重表随机生成装备 */
  _rollEquipment: function (qualityWeights) {
    if (!qualityWeights || typeof EquipmentManager === 'undefined') return null;

    var totalWeight = 0;
    var entries = [];
    for (var q in qualityWeights) {
      totalWeight += qualityWeights[q];
      entries.push({ quality: parseInt(q), weight: qualityWeights[q] });
    }

    var roll = Math.random() * totalWeight;
    var quality = entries[0].quality;
    for (var i = 0; i < entries.length; i++) {
      roll -= entries[i].weight;
      if (roll <= 0) { quality = entries[i].quality; break; }
    }

    var equip = EquipmentManager.generateDrop(1, { [quality]: 100 });
    return equip;
  },

  /** 获取统计摘要 */
  getStats: function () {
    return {
      totalPlays: this._state.totalPlays,
      totalSpent: this._state.totalSpent,
      totalWon: this._state.totalWon,
      netProfit: this._state.totalWon - this._state.totalSpent,
      jackpotCount: this._state.jackpotCount,
      returnRate: this._state.totalSpent > 0
        ? Math.round(this._state.totalWon / this._state.totalSpent * 100)
        : 0
    };
  }
};
