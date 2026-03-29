/**
 * 建筑静态数据表
 * 12 种建筑分为 4 类：核心、资源生产、战斗辅助、功能型
 */
const BuildingData = {

  // ===== 核心建筑 =====
  town_hall: {
    id: 'town_hall',
    name: '城主府',
    emoji: '🏯',
    category: 'core',
    description: '城镇核心，决定建筑数量和等级上限',
    maxLevel: 10,
    unlockOrder: 0,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(500 * Math.pow(1.8, lv - 1)),
        wood:  Math.floor(100 * Math.pow(1.8, lv - 1)),
        stone: Math.floor(100 * Math.pow(1.8, lv - 1)),
        iron:  lv >= 3 ? Math.floor(50 * Math.pow(1.8, lv - 3)) : 0
      };
    },
    effects: function (lv) {
      return {
        unlockSlots: lv * 2 + 1,
        levelCap: [0, 1, 3, 5, 7, 10, 12, 15, 18, 20, 25][lv] || lv * 2 + 1
      };
    }
  },

  // ===== 资源生产建筑 =====
  lumber_camp: {
    id: 'lumber_camp',
    name: '伐木场',
    emoji: '🪓',
    category: 'production',
    description: '自动生产木材',
    maxLevel: 25,
    unlockOrder: 1,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(200 * Math.pow(1.6, lv - 1)),
        wood:  Math.floor(50 * Math.pow(1.6, lv - 1)),
        stone: Math.floor(30 * Math.pow(1.6, lv - 1))
      };
    },
    production: function (lv) {
      // 每分钟产出木材
      return { resource: 'wood', perMinute: 2 * (1 + 0.75 * (lv - 1)) };
    }
  },

  quarry: {
    id: 'quarry',
    name: '采石场',
    emoji: '⛏',
    category: 'production',
    description: '自动生产石材',
    maxLevel: 25,
    unlockOrder: 2,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(200 * Math.pow(1.6, lv - 1)),
        wood:  Math.floor(50 * Math.pow(1.6, lv - 1)),
        stone: Math.floor(30 * Math.pow(1.6, lv - 1))
      };
    },
    production: function (lv) {
      return { resource: 'stone', perMinute: 1.5 * (1 + 0.75 * (lv - 1)) };
    }
  },

  iron_mine: {
    id: 'iron_mine',
    name: '铁矿场',
    emoji: '⚒',
    category: 'production',
    description: '自动生产铁矿',
    maxLevel: 25,
    unlockOrder: 3,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(300 * Math.pow(1.6, lv - 1)),
        wood:  Math.floor(80 * Math.pow(1.6, lv - 1)),
        stone: Math.floor(80 * Math.pow(1.6, lv - 1))
      };
    },
    production: function (lv) {
      return { resource: 'iron', perMinute: 1 * (1 + 0.8 * (lv - 1)) };
    }
  },

  farmland: {
    id: 'farmland',
    name: '农田',
    emoji: '🌾',
    category: 'production',
    description: '提升粮草上限和恢复速度',
    maxLevel: 25,
    unlockOrder: 4,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(200 * Math.pow(1.6, lv - 1)),
        wood:  Math.floor(60 * Math.pow(1.6, lv - 1)),
        stone: lv >= 2 ? Math.floor(50 * Math.pow(1.6, lv - 2)) : 0
      };
    },
    effects: function (lv) {
      var capBonuses = [0, 30, 60, 100, 150, 200];
      var regenIntervals = [30, 25, 22, 18, 15, 12];
      return {
        foodCapBonus: capBonuses[Math.min(lv, 5)] || Math.floor(30 * lv),
        foodRegenInterval: regenIntervals[Math.min(lv, 5)] || Math.max(10, 30 - lv * 3)
      };
    }
  },

  // ===== 战斗辅助建筑 =====
  barracks: {
    id: 'barracks',
    name: '兵营',
    emoji: '⚔',
    category: 'combat',
    description: '提升全队攻击力',
    maxLevel: 25,
    unlockOrder: 5,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(300 * Math.pow(1.6, lv - 1)),
        wood:  Math.floor(80 * Math.pow(1.6, lv - 1)),
        stone: Math.floor(50 * Math.pow(1.6, lv - 1)),
        iron:  Math.floor(20 * Math.pow(1.6, lv - 1))
      };
    },
    effects: function (lv) {
      // ATK加成 = 3% × lv × (1 + 0.1 × lv)
      return { atkBonus: 0.03 * lv * (1 + 0.1 * lv) };
    }
  },

  training_ground: {
    id: 'training_ground',
    name: '校场',
    emoji: '🏋',
    category: 'combat',
    description: '提升战斗经验获取',
    maxLevel: 25,
    unlockOrder: 6,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(250 * Math.pow(1.6, lv - 1)),
        wood:  Math.floor(60 * Math.pow(1.6, lv - 1)),
        stone: Math.floor(40 * Math.pow(1.6, lv - 1))
      };
    },
    effects: function (lv) {
      // EXP加成 = 10% × lv × (1 + 0.12 × lv)
      return { expBonus: 0.10 * lv * (1 + 0.12 * lv) };
    }
  },

  blacksmith: {
    id: 'blacksmith',
    name: '铁匠铺',
    emoji: '🔨',
    category: 'combat',
    description: '提升装备强化成功率和属性加成',
    maxLevel: 25,
    unlockOrder: 7,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(400 * Math.pow(1.6, lv - 1)),
        wood:  Math.floor(100 * Math.pow(1.6, lv - 1)),
        stone: Math.floor(100 * Math.pow(1.6, lv - 1)),
        iron:  Math.floor(50 * Math.pow(1.6, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        enhanceSuccessBonus: 0.05 * lv,
        equipStatBonus: 0.02 * lv + 0.01 * lv * (lv - 1) / 2
      };
    }
  },

  city_wall: {
    id: 'city_wall',
    name: '城墙',
    emoji: '🏰',
    category: 'combat',
    description: '提升全队防御力和生命值',
    maxLevel: 25,
    unlockOrder: 8,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(300 * Math.pow(1.6, lv - 1)),
        stone: Math.floor(100 * Math.pow(1.6, lv - 1)),
        iron:  Math.floor(30 * Math.pow(1.6, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        defBonus: 0.03 * lv * (1 + 0.1 * lv),
        hpBonus: 0.03 * lv * (1 + 0.1 * lv)
      };
    }
  },

  // ===== 功能型建筑 =====
  adventure_guild: {
    id: 'adventure_guild',
    name: '探险公会',
    emoji: '🧭',
    category: 'functional',
    description: '提升离线收益效率和掉落率',
    maxLevel: 25,
    unlockOrder: 9,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(500 * Math.pow(1.6, lv - 1)),
        wood:  Math.floor(150 * Math.pow(1.6, lv - 1)),
        stone: Math.floor(100 * Math.pow(1.6, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        offlineEfficiency: 0.50 + 0.05 * lv,
        dropRateBonus: 0.05 * lv
      };
    }
  },

  tavern: {
    id: 'tavern',
    name: '酒馆',
    emoji: '🍺',
    category: 'functional',
    description: '降低招募费用，提供免费招募',
    maxLevel: 25,
    unlockOrder: 10,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(400 * Math.pow(1.6, lv - 1)),
        wood:  Math.floor(100 * Math.pow(1.6, lv - 1)),
        stone: Math.floor(80 * Math.pow(1.6, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        recruitDiscount: 0.05 * lv,
        freeRecruitInterval: Math.max(3600, 14400 - lv * 2400)
      };
    }
  },

  warehouse: {
    id: 'warehouse',
    name: '仓库',
    emoji: '📦',
    category: 'functional',
    description: '提升资源存储上限',
    maxLevel: 25,
    unlockOrder: 11,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(300 * Math.pow(1.6, lv - 1)),
        wood:  Math.floor(80 * Math.pow(1.6, lv - 1)),
        stone: Math.floor(60 * Math.pow(1.6, lv - 1))
      };
    },
    effects: function (lv) {
      var capBonuses = [0, 0.25, 0.50, 0.80, 1.20, 1.60];
      return {
        resourceCapBonus: capBonuses[Math.min(lv, 5)] || 0.25 * lv,
        inventoryCap: 50 + 10 * lv
      };
    }
  },

  market: {
    id: 'market',
    name: '集市',
    emoji: '🏪',
    category: 'functional',
    description: '资源间以固定汇率互换',
    maxLevel: 5,
    unlockOrder: 12,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(500 * Math.pow(1.8, lv - 1)),
        wood:  Math.floor(120 * Math.pow(1.8, lv - 1)),
        stone: Math.floor(100 * Math.pow(1.8, lv - 1))
      };
    },
    effects: function (lv) {
      var baseRates = { wood: 10, stone: 12, iron: 18 };
      var discount = lv >= 5 ? 0.20 : (lv >= 3 ? 0.10 : 0);
      return {
        canTradeWood: lv >= 1,
        canTradeStone: lv >= 2,
        canTradeIron: lv >= 4,
        tradeRates: {
          wood: Math.floor(baseRates.wood * (1 - discount)),
          stone: Math.floor(baseRates.stone * (1 - discount)),
          iron: Math.floor(baseRates.iron * (1 - discount))
        }
      };
    }
  }
};

/**
 * 施工时间公式：build_time_sec(lv) = 30 × 2^(lv-1)
 */
BuildingData._getBuildTime = function (targetLevel) {
  return Math.floor(30 * Math.pow(2, targetLevel - 1));
};

/**
 * 建筑分类标签
 */
BuildingData._categories = {
  core: { label: '核心', emoji: '🏯' },
  production: { label: '资源生产', emoji: '📊' },
  combat: { label: '战斗辅助', emoji: '⚔' },
  functional: { label: '功能型', emoji: '🧭' }
};

/**
 * 城主府等级对应解锁数据
 */
BuildingData._townHallUnlocks = [
  null,
  { slots: 3,  levelCap: 1,  unlockStage: null },
  { slots: 5,  levelCap: 3,  unlockStage: 'stage_1_10' },
  { slots: 7,  levelCap: 5,  unlockStage: 'stage_2_5' },
  { slots: 9,  levelCap: 7,  unlockStage: 'stage_3_1' },
  { slots: 11, levelCap: 10, unlockStage: 'stage_3_10' },
  { slots: 12, levelCap: 12, unlockStage: 'stage_4_5' },
  { slots: 12, levelCap: 15, unlockStage: 'stage_5_1' },
  { slots: 12, levelCap: 18, unlockStage: 'stage_5_5' },
  { slots: 12, levelCap: 20, unlockStage: 'stage_5_10' },
  { slots: 12, levelCap: 25, unlockStage: null }
];
