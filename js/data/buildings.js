/**
 * 建筑静态数据表
 * 20 种建筑分为 4 类：核心、资源生产(含加成器)、战斗辅助、功能型
 * 支持 requires 前置依赖 和 boosts 产出加成
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
        gold:  Math.floor(500 * Math.pow(1.5, lv - 1)),
        wood:  Math.floor(100 * Math.pow(1.5, lv - 1)),
        stone: Math.floor(100 * Math.pow(1.5, lv - 1)),
        iron:  lv >= 3 ? Math.floor(50 * Math.pow(1.5, lv - 3)) : 0
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
        gold:  Math.floor(200 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(50 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(30 * Math.pow(1.2, lv - 1))
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
        gold:  Math.floor(200 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(50 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(30 * Math.pow(1.2, lv - 1))
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
    requires: { town_hall: 2 },
    maxLevel: 25,
    unlockOrder: 3,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(300 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(80 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(80 * Math.pow(1.2, lv - 1))
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
        gold:  Math.floor(200 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(60 * Math.pow(1.2, lv - 1)),
        stone: lv >= 2 ? Math.floor(50 * Math.pow(1.2, lv - 2)) : 0
      };
    },
    effects: function (lv) {
      var capBonuses = [0, 30, 60, 100, 150, 200];
      var regenIntervals = [30, 25, 22, 18, 15, 12];
      return {
        foodCapBonus: lv <= 5 ? capBonuses[lv] : Math.floor(30 * lv),
        foodRegenInterval: lv <= 5 ? regenIntervals[lv] : Math.max(10, 30 - lv * 3)
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
    requires: { town_hall: 3 },
    maxLevel: 25,
    unlockOrder: 5,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(300 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(80 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(50 * Math.pow(1.2, lv - 1)),
        iron:  Math.floor(20 * Math.pow(1.2, lv - 1))
      };
    },
    effects: function (lv) {
      // ATK加成 = 3% × lv × (1 + 0.1 × lv)，封顶150%
      return { atkBonus: Math.min(1.5, 0.03 * lv * (1 + 0.1 * lv)) };
    }
  },

  training_ground: {
    id: 'training_ground',
    name: '校场',
    emoji: '🏋',
    category: 'combat',
    description: '提升战斗经验获取',
    requires: { barracks: 3 },
    maxLevel: 25,
    unlockOrder: 6,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(250 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(60 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(40 * Math.pow(1.2, lv - 1))
      };
    },
    effects: function (lv) {
      // EXP加成 = 10% × lv × (1 + 0.08 × lv)，封顶300%
      return { expBonus: Math.min(3.0, 0.10 * lv * (1 + 0.08 * lv)) };
    }
  },

  blacksmith: {
    id: 'blacksmith',
    name: '铁匠铺',
    emoji: '🔨',
    category: 'combat',
    description: '提升装备强化成功率和属性加成',
    requires: { barracks: 3, iron_mine: 3 },
    maxLevel: 25,
    unlockOrder: 7,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(400 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(100 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(100 * Math.pow(1.2, lv - 1)),
        iron:  Math.floor(50 * Math.pow(1.2, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        enhanceSuccessBonus: Math.min(0.5, 0.03 * lv),
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
    requires: { town_hall: 3, quarry: 3 },
    maxLevel: 25,
    unlockOrder: 8,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(300 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(100 * Math.pow(1.2, lv - 1)),
        iron:  Math.floor(30 * Math.pow(1.2, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        defBonus: Math.min(1.5, 0.03 * lv * (1 + 0.1 * lv)),
        hpBonus: Math.min(1.5, 0.03 * lv * (1 + 0.1 * lv))
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
    requires: { town_hall: 4 },
    maxLevel: 25,
    unlockOrder: 9,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(500 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(150 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(100 * Math.pow(1.2, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        offlineEfficiency: Math.min(0.95, 0.50 + 0.05 * lv),
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
    requires: { town_hall: 5 },
    maxLevel: 25,
    unlockOrder: 10,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(400 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(100 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(80 * Math.pow(1.2, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        recruitDiscount: Math.min(0.5, 0.05 * lv),
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
    requires: { town_hall: 2 },
    maxLevel: 25,
    unlockOrder: 11,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(300 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(80 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(60 * Math.pow(1.2, lv - 1))
      };
    },
    effects: function (lv) {
      var capBonuses = [0, 0.25, 0.50, 0.80, 1.20, 1.60];
      return {
        resourceCapBonus: lv <= 5 ? capBonuses[lv] : 0.35 * lv,
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
    requires: { town_hall: 5, warehouse: 3 },
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
  },

  // ===== 新增：金币产出 =====
  tax_office: {
    id: 'tax_office',
    name: '税务署',
    emoji: '🏛',
    category: 'production',
    description: '自动征收金币税赋',
    requires: { town_hall: 2 },
    maxLevel: 25,
    unlockOrder: 13,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(300 * Math.pow(1.2, lv - 1)),
        wood:  Math.floor(80 * Math.pow(1.2, lv - 1)),
        stone: Math.floor(60 * Math.pow(1.2, lv - 1))
      };
    },
    production: function (lv) {
      return { resource: 'gold', perMinute: 5 * (1 + 0.8 * (lv - 1)) };
    }
  },

  // ===== 新增：战斗建筑 =====
  weapon_workshop: {
    id: 'weapon_workshop',
    name: '武器工坊',
    emoji: '🗡',
    category: 'combat',
    description: '打造精良兵器，提升攻击力和装备品质',
    requires: { barracks: 5, iron_mine: 3 },
    maxLevel: 15,
    unlockOrder: 14,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(500 * Math.pow(1.35, lv - 1)),
        wood:  Math.floor(120 * Math.pow(1.35, lv - 1)),
        iron:  Math.floor(80 * Math.pow(1.35, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        atkBonus: 0.02 * lv,
        equipQualityBonus: 0.03 * lv
      };
    }
  },

  stable: {
    id: 'stable',
    name: '马厩',
    emoji: '🐴',
    category: 'combat',
    description: '饲养战马，提升速度和先攻概率',
    requires: { barracks: 5, town_hall: 5 },
    maxLevel: 15,
    unlockOrder: 15,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(400 * Math.pow(1.35, lv - 1)),
        wood:  Math.floor(150 * Math.pow(1.35, lv - 1)),
        iron:  Math.floor(40 * Math.pow(1.35, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        spdBonus: 0.02 * lv,
        firstStrikeChance: Math.min(0.5, 0.03 * lv)
      };
    }
  },

  // ===== 新增：功能建筑 =====
  academy: {
    id: 'academy',
    name: '书院',
    emoji: '📚',
    category: 'functional',
    description: '研习兵法，大幅提升经验获取和技能效果',
    requires: { town_hall: 4, training_ground: 3 },
    maxLevel: 15,
    unlockOrder: 16,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(600 * Math.pow(1.35, lv - 1)),
        wood:  Math.floor(100 * Math.pow(1.35, lv - 1)),
        stone: Math.floor(80 * Math.pow(1.35, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        expBonus: 0.15 * lv,
        skillCooldownReduction: Math.min(0.5, 0.02 * lv)
      };
    }
  },

  // ===== 新增：产出加成器 =====
  watermill: {
    id: 'watermill',
    name: '水车',
    emoji: '💧',
    category: 'production',
    description: '水力驱动，加速伐木场产出',
    requires: { lumber_camp: 5 },
    maxLevel: 5,
    unlockOrder: 17,
    boosts: { target: 'lumber_camp', bonusPerLevel: 0.05 },
    costFormula: function (lv) {
      return {
        gold:  Math.floor(400 * Math.pow(1.8, lv - 1)),
        wood:  Math.floor(200 * Math.pow(1.8, lv - 1)),
        stone: Math.floor(100 * Math.pow(1.8, lv - 1))
      };
    },
    effects: function (lv) {
      return { productionBoost: 0.05 * lv, boostTarget: '伐木场' };
    }
  },

  stone_mason: {
    id: 'stone_mason',
    name: '石匠坊',
    emoji: '🧱',
    category: 'production',
    description: '精湛石工技术，加速采石场产出',
    requires: { quarry: 5 },
    maxLevel: 5,
    unlockOrder: 18,
    boosts: { target: 'quarry', bonusPerLevel: 0.05 },
    costFormula: function (lv) {
      return {
        gold:  Math.floor(400 * Math.pow(1.8, lv - 1)),
        wood:  Math.floor(100 * Math.pow(1.8, lv - 1)),
        stone: Math.floor(200 * Math.pow(1.8, lv - 1))
      };
    },
    effects: function (lv) {
      return { productionBoost: 0.05 * lv, boostTarget: '采石场' };
    }
  },

  smelter: {
    id: 'smelter',
    name: '冶炼炉',
    emoji: '🔥',
    category: 'production',
    description: '高温冶炼，加速铁矿场产出',
    requires: { iron_mine: 5 },
    maxLevel: 5,
    unlockOrder: 19,
    boosts: { target: 'iron_mine', bonusPerLevel: 0.05 },
    costFormula: function (lv) {
      return {
        gold:  Math.floor(500 * Math.pow(1.8, lv - 1)),
        wood:  Math.floor(100 * Math.pow(1.8, lv - 1)),
        iron:  Math.floor(200 * Math.pow(1.8, lv - 1))
      };
    },
    effects: function (lv) {
      return { productionBoost: 0.05 * lv, boostTarget: '铁矿场' };
    }
  },

  // ===== 种菜系统建筑 =====
  vegetable_garden: {
    id: 'vegetable_garden',
    name: '菜园',
    emoji: '🥬',
    category: 'production',
    description: '种植蔬菜和药材，收获资源',
    requires: { farmland: 3 },
    maxLevel: 10,
    unlockOrder: 20,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(300 * Math.pow(1.4, lv - 1)),
        wood:  Math.floor(100 * Math.pow(1.4, lv - 1)),
        stone: Math.floor(60 * Math.pow(1.4, lv - 1))
      };
    },
    effects: function (lv) {
      var data = (typeof GardenLevelData !== 'undefined' && GardenLevelData[lv])
        ? GardenLevelData[lv]
        : { plots: lv + 1, qualityUnlock: Math.min(5, Math.ceil(lv / 2)), speedBonus: 0.05 * lv, doubleChance: Math.min(0.20, 0.02 * lv) };
      return {
        plots: data.plots,
        qualityUnlock: data.qualityUnlock,
        speedBonus: data.speedBonus,
        doubleHarvestChance: data.doubleChance
      };
    }
  },

  compost_pit: {
    id: 'compost_pit',
    name: '堆肥坑',
    emoji: '♻️',
    category: 'production',
    description: '消耗低品级作物制作肥料，提升产出',
    requires: { vegetable_garden: 3 },
    maxLevel: 5,
    unlockOrder: 21,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(400 * Math.pow(1.8, lv - 1)),
        wood:  Math.floor(120 * Math.pow(1.8, lv - 1)),
        stone: Math.floor(80 * Math.pow(1.8, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        fertilizerYieldBonus: 0.05 * lv,
        maxFertilizer: 10 + 5 * lv
      };
    }
  },

  seed_shop: {
    id: 'seed_shop',
    name: '种子铺',
    emoji: '🌱',
    category: 'functional',
    description: '购买和解锁更高品级种子',
    requires: { vegetable_garden: 1 },
    maxLevel: 5,
    unlockOrder: 22,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(350 * Math.pow(1.8, lv - 1)),
        wood:  Math.floor(80 * Math.pow(1.8, lv - 1)),
        stone: Math.floor(50 * Math.pow(1.8, lv - 1))
      };
    },
    effects: function (lv) {
      return {
        maxSeedQuality: lv,
        seedDiscount: 0.05 * (lv - 1),
        synthUnlocked: lv >= 2
      };
    }
  },

  // ===== 停车场系统建筑 =====
  parking_lot: {
    id: 'parking_lot',
    name: '停车场',
    emoji: '🅿️',
    category: 'functional',
    description: '停放载具收取停车费，被动产出金币',
    requires: { town_hall: 4, stable: 1 },
    maxLevel: 5,
    unlockOrder: 23,
    costFormula: function (lv) {
      return {
        gold:  Math.floor(2000 * Math.pow(2, lv - 1)),
        wood:  Math.floor(500 * Math.pow(2, lv - 1)),
        stone: Math.floor(500 * Math.pow(2, lv - 1)),
        iron:  Math.floor(200 * Math.pow(2, lv - 1))
      };
    },
    effects: function (lv) {
      var multipliers = [0, 1.0, 1.1, 1.25, 1.40, 1.60];
      var tierCaps = [0, 4, 5, 7, 8, 10];
      return {
        incomeMultiplier: multipliers[lv] || 1.0,
        maxVehicleTier: tierCaps[lv] || 4
      };
    }
  }
};

/**
 * 施工时间公式：build_time_sec(lv) = 30 × lv × 1.3^(lv-1)
 * Lv5≈7min, Lv10≈53min, Lv15≈4.6h, Lv20≈21h, Lv25≈3.7d
 */
BuildingData._getBuildTime = function (targetLevel) {
  return Math.floor(30 * targetLevel * Math.pow(1.3, targetLevel - 1));
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
  { slots: 4,  levelCap: 1,  unlockStage: null },
  { slots: 7,  levelCap: 3,  unlockStage: 'stage_1_10' },
  { slots: 10, levelCap: 5,  unlockStage: 'stage_2_5' },
  { slots: 13, levelCap: 7,  unlockStage: 'stage_3_1' },
  { slots: 16, levelCap: 10, unlockStage: 'stage_3_10' },
  { slots: 18, levelCap: 12, unlockStage: 'stage_4_5' },
  { slots: 19, levelCap: 15, unlockStage: 'stage_5_1' },
  { slots: 19, levelCap: 18, unlockStage: 'stage_5_5' },
  { slots: 19, levelCap: 20, unlockStage: 'stage_5_10' },
  { slots: 19, levelCap: 25, unlockStage: null }
];

/**
 * 建造工人配置
 */
var WORKER_CONFIG = {
  MAX_WORKERS: 5,
  MAX_QUEUE_SIZE: 6,
  WORKER_UNLOCKS: [
    { trigger: 'initial',           requirement: null,  workerCount: 1 },
    { trigger: 'first_building',    requirement: null,  workerCount: 2 },
    { trigger: 'town_hall_level',   requirement: 3,     workerCount: 3 },
    { trigger: 'town_hall_level',   requirement: 5,     workerCount: 4 },
    { trigger: 'town_hall_level',   requirement: 7,     workerCount: 5 }
  ]
};
