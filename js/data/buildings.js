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

  // ===== 驿站系统建筑 =====
  parking_lot: {
    id: 'parking_lot',
    name: '驿站',
    emoji: '🐴',
    category: 'functional',
    description: '饲养坐骑派遣任务，被动产出金币',
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
 * 建筑多副本上限表
 * 数组中每个元素表示解锁第 N+1 个副本所需的建筑等级
 * 例如 [1, 5, 10] 表示: Lv1→1个, Lv5→2个, Lv10→3个
 * town_hall 空数组表示永远只能1个
 */
BuildingData._maxCountTable = {
  // 核心
  town_hall:        [],                    // 永远 1 个

  // 资源生产（高副本数，线性加产）
  lumber_camp:      [1, 5, 10, 15, 20],    // 最多 5
  quarry:           [1, 5, 10, 15, 20],    // 最多 5
  iron_mine:        [1, 5, 10, 18],        // 最多 4
  farmland:         [1, 4, 8, 12, 18, 25], // 最多 6
  tax_office:       [1, 5, 10, 18],        // 最多 4

  // 战斗辅助（中等副本数）
  barracks:         [1, 8, 18],            // 最多 3
  training_ground:  [1, 8, 18],            // 最多 3
  blacksmith:       [1, 12],               // 最多 2
  city_wall:        [1, 8, 18],            // 最多 3
  weapon_workshop:  [1, 8],                // 最多 2
  stable:           [1, 8],                // 最多 2

  // 功能型
  adventure_guild:  [1, 12],               // 最多 2
  tavern:           [1, 12],               // 最多 2
  warehouse:        [1, 5, 10, 18],        // 最多 4
  market:           [1, 3],                // 最多 2
  academy:          [1, 8],                // 最多 2
  seed_shop:        [1, 3],                // 最多 2
  parking_lot:      [1, 3],                // 最多 2

  // 产出加成器
  watermill:        [1, 3],                // 最多 2
  stone_mason:      [1, 3],                // 最多 2
  smelter:          [1, 3],                // 最多 2

  // 种菜系统
  vegetable_garden: [1, 4, 8],             // 最多 3
  compost_pit:      [1, 3]                 // 最多 2
};

/**
 * 查询建筑在指定等级下的最大副本数
 * @param {string} buildingId
 * @param {number} level 当前等级
 * @returns {number} 最大副本数（至少 1）
 */
BuildingData._getMaxCount = function (buildingId, level) {
  var table = BuildingData._maxCountTable[buildingId];
  if (!table || table.length === 0) return 1;
  var count = 0;
  for (var i = 0; i < table.length; i++) {
    if (level >= table[i]) count = i + 1;
  }
  return Math.max(1, count);
};

/**
 * 建造副本的资源费用 = costFormula(currentLevel) × copyIndex
 * copyIndex = 即将建造的第几个副本（从2开始）
 */
BuildingData._getCopyCost = function (buildingId, currentLevel, currentCount) {
  var data = BuildingData[buildingId];
  if (!data || !data.costFormula) return {};
  var baseCost = data.costFormula(currentLevel);
  var multiplier = currentCount + 1; // 第 n+1 个副本
  var result = {};
  for (var key in baseCost) {
    if (baseCost.hasOwnProperty(key)) {
      result[key] = Math.floor(baseCost[key] * multiplier);
    }
  }
  return result;
};

/**
 * 建造副本的施工时间 = 当前等级的施工时间
 */
BuildingData._getCopyBuildTime = function (buildingId, currentLevel) {
  return BuildingData._getBuildTime(currentLevel);
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

/**
 * 章节门禁数据 — 进入新章节需满足的建筑等级要求
 * key = 章节号，value = { buildingId: requiredLevel }
 * 第 1 章无要求（新手教程）
 */
var ChapterGateData = {
  2:  { town_hall: 2, lumber_camp: 1 },
  3:  { town_hall: 3, barracks: 1, quarry: 1 },
  4:  { barracks: 3, city_wall: 1, farmland: 2 },
  5:  { town_hall: 5, barracks: 5, city_wall: 3, training_ground: 2 },
  6:  { town_hall: 6, barracks: 7, city_wall: 5, adventure_guild: 2 },
  7:  { town_hall: 7, barracks: 10, city_wall: 7, blacksmith: 3 },
  8:  { town_hall: 7, barracks: 12, city_wall: 9, weapon_workshop: 3, stable: 2 },
  9:  { town_hall: 8, barracks: 14, city_wall: 11, blacksmith: 5, academy: 3 },
  10: { town_hall: 8, barracks: 16, city_wall: 13, weapon_workshop: 5, stable: 4 },
  11: { town_hall: 9, barracks: 18, city_wall: 15, blacksmith: 7, academy: 5 },
  12: { town_hall: 9, barracks: 20, city_wall: 17, weapon_workshop: 7, adventure_guild: 5 },
  13: { town_hall: 10, barracks: 22, city_wall: 19, blacksmith: 9, stable: 7 },
  14: { town_hall: 10, barracks: 24, city_wall: 21, weapon_workshop: 10, academy: 7 },
  15: { town_hall: 10, barracks: 25, city_wall: 23, blacksmith: 10, stable: 10, academy: 8 }
};
