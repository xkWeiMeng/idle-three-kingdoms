/**
 * 成就数据定义
 * 
 * 成就分类：战斗、英雄、收集、城镇、经济、探索
 * 每个成就有多个阶段（里程碑）
 */

var AchievementData = [
  // --- 战斗成就 ---
  {
    id: 'battles_total',
    title: '百战之将',
    category: 'battle',
    icon: '⚔️',
    milestones: [
      { target: 10,    reward: { gold: 200 },            desc: '完成10场战斗' },
      { target: 100,   reward: { gold: 500, jade: 10 },  desc: '完成100场战斗' },
      { target: 500,   reward: { gold: 1000, jade: 20 }, desc: '完成500场战斗' },
      { target: 2000,  reward: { jade: 50 },             desc: '完成2000场战斗' },
      { target: 10000, reward: { jade: 100 },            desc: '完成10000场战斗' }
    ],
    getProgress: function () {
      var stats = ResourceManager.getStats ? ResourceManager.getStats() : {};
      return stats.totalBattles || 0;
    }
  },
  {
    id: 'stages_cleared',
    title: '开疆拓土',
    category: 'battle',
    icon: '🏴',
    milestones: [
      { target: 5,   reward: { jade: 10 },  desc: '通关5个关卡' },
      { target: 15,  reward: { jade: 20 },  desc: '通关15个关卡' },
      { target: 50,  reward: { jade: 50 },  desc: '通关50个关卡' },
      { target: 100, reward: { jade: 80 },  desc: '通关100个关卡' },
      { target: 150, reward: { jade: 150 }, desc: '通关全部150个关卡' }
    ],
    getProgress: function () {
      if (typeof BattleManager === 'undefined') return 0;
      var cleared = BattleManager.getClearedStages();
      return cleared ? cleared.length : 0;
    }
  },
  {
    id: 'abyss_clears',
    title: '深渊征服者',
    category: 'battle',
    icon: '🔥',
    milestones: [
      { target: 1, reward: { jade: 20 },  desc: '首次通关深渊' },
      { target: 3, reward: { jade: 50 },  desc: '通关3个深渊' },
      { target: 5, reward: { jade: 100 }, desc: '通关全部5个深渊' }
    ],
    getProgress: function () {
      if (typeof AbyssManager === 'undefined') return 0;
      var state = AbyssManager.getState();
      var count = 0;
      if (state && state.instances) {
        for (var key in state.instances) {
          if (state.instances[key] && state.instances[key].cleared) count++;
        }
      }
      return count;
    }
  },

  // --- 英雄成就 ---
  {
    id: 'heroes_collected',
    title: '群英荟萃',
    category: 'hero',
    icon: '🦸',
    milestones: [
      { target: 3,  reward: { jade: 10 },  desc: '收集3个武将' },
      { target: 10, reward: { jade: 30 },  desc: '收集10个武将' },
      { target: 25, reward: { jade: 50 },  desc: '收集25个武将' },
      { target: 50, reward: { jade: 100 }, desc: '收集50个武将' },
      { target: 76, reward: { jade: 200 }, desc: '收集全部76个武将' }
    ],
    getProgress: function () {
      return HeroManager.getAll().length;
    }
  },
  {
    id: 'hero_max_level',
    title: '登峰造极',
    category: 'hero',
    icon: '⭐',
    milestones: [
      { target: 10, reward: { gold: 500 },            desc: '武将达到10级' },
      { target: 30, reward: { gold: 2000, jade: 20 }, desc: '武将达到30级' },
      { target: 50, reward: { jade: 50 },             desc: '武将达到50级' }
    ],
    getProgress: function () {
      var heroes = HeroManager.getAll();
      var maxLv = 0;
      for (var i = 0; i < heroes.length; i++) {
        if (heroes[i].level > maxLv) maxLv = heroes[i].level;
      }
      return maxLv;
    }
  },
  {
    id: 'hero_ascend',
    title: '破茧成蝶',
    category: 'hero',
    icon: '💫',
    milestones: [
      { target: 1, reward: { jade: 30 },  desc: '首次突破武将' },
      { target: 5, reward: { jade: 80 },  desc: '突破5次' },
      { target: 15, reward: { jade: 200 }, desc: '突破15次' }
    ],
    getProgress: function () {
      var heroes = HeroManager.getAll();
      var total = 0;
      for (var i = 0; i < heroes.length; i++) {
        total += (heroes[i].stars || 0);
      }
      return total;
    }
  },

  // --- 收集成就 ---
  {
    id: 'equip_collected',
    title: '宝物猎人',
    category: 'collect',
    icon: '🛡️',
    milestones: [
      { target: 20,  reward: { gold: 300 },   desc: '拥有20件装备' },
      { target: 50,  reward: { gold: 1000 },  desc: '拥有50件装备' },
      { target: 100, reward: { jade: 20 },    desc: '拥有100件装备' }
    ],
    getProgress: function () {
      if (typeof EquipmentManager === 'undefined') return 0;
      return EquipmentManager.getInventory().length;
    }
  },
  {
    id: 'recruit_total',
    title: '伯乐之眼',
    category: 'collect',
    icon: '🎯',
    milestones: [
      { target: 10,  reward: { jade: 10 },  desc: '招募10次' },
      { target: 50,  reward: { jade: 30 },  desc: '招募50次' },
      { target: 200, reward: { jade: 100 }, desc: '招募200次' }
    ],
    getProgress: function () {
      if (typeof RecruitManager === 'undefined') return 0;
      var state = RecruitManager.getState();
      return state.totalRecruits || 0;
    }
  },

  // --- 城镇成就 ---
  {
    id: 'building_levels',
    title: '基建狂魔',
    category: 'town',
    icon: '🏗️',
    milestones: [
      { target: 10,  reward: { gold: 500 },   desc: '建筑总等级达到10' },
      { target: 30,  reward: { gold: 2000 },  desc: '建筑总等级达到30' },
      { target: 80,  reward: { jade: 30 },    desc: '建筑总等级达到80' },
      { target: 150, reward: { jade: 80 },    desc: '建筑总等级达到150' }
    ],
    getProgress: function () {
      if (typeof TownManager === 'undefined') return 0;
      var state = TownManager.getState();
      var total = 0;
      if (state && state.buildings) {
        for (var key in state.buildings) {
          total += (state.buildings[key].level || 0);
        }
      }
      return total;
    }
  },

  // --- 经济成就 ---
  {
    id: 'gold_earned',
    title: '富甲天下',
    category: 'economy',
    icon: '💰',
    milestones: [
      { target: 10000,   reward: { jade: 5 },   desc: '累计获得1万金币' },
      { target: 100000,  reward: { jade: 20 },  desc: '累计获得10万金币' },
      { target: 1000000, reward: { jade: 50 },  desc: '累计获得100万金币' }
    ],
    getProgress: function () {
      var stats = ResourceManager.getStats ? ResourceManager.getStats() : {};
      return stats.totalGoldEarned || 0;
    }
  },
  {
    id: 'daily_login',
    title: '日月如梭',
    category: 'economy',
    icon: '📅',
    milestones: [
      { target: 3,  reward: { jade: 10 },  desc: '登录3天' },
      { target: 7,  reward: { jade: 20 },  desc: '登录7天' },
      { target: 30, reward: { jade: 50 },  desc: '登录30天' },
      { target: 100, reward: { jade: 100 }, desc: '登录100天' }
    ],
    getProgress: function () {
      var stats = ResourceManager.getStats ? ResourceManager.getStats() : {};
      return stats.loginDays || 0;
    }
  },

  // --- 探索成就 ---
  {
    id: 'quests_completed',
    title: '任务达人',
    category: 'explore',
    icon: '📋',
    milestones: [
      { target: 5,   reward: { gold: 300 },   desc: '完成5个每日任务' },
      { target: 30,  reward: { jade: 15 },    desc: '完成30个每日任务' },
      { target: 100, reward: { jade: 50 },    desc: '完成100个每日任务' },
      { target: 500, reward: { jade: 100 },   desc: '完成500个每日任务' }
    ],
    getProgress: function () {
      if (typeof QuestManager === 'undefined') return 0;
      return QuestManager.getTotalCompleted();
    }
  },
  {
    id: 'farm_harvests',
    title: '五谷丰登',
    category: 'explore',
    icon: '🌾',
    milestones: [
      { target: 30,   reward: { gold: 300 },  desc: '积累30点农耕经验' },
      { target: 200,  reward: { gold: 1000 }, desc: '积累200点农耕经验' },
      { target: 1000, reward: { jade: 30 },   desc: '积累1000点农耕经验' }
    ],
    getProgress: function () {
      if (typeof FarmManager === 'undefined') return 0;
      var state = FarmManager.getState();
      return state.farmExp || 0;
    }
  },

  // --- 新增：战斗成就 ---
  {
    id: 'consecutive_wins',
    title: '连战连捷',
    category: 'battle',
    icon: '🏆',
    milestones: [
      { target: 5,   reward: { gold: 500 },   desc: '连胜5场' },
      { target: 20,  reward: { jade: 20 },    desc: '连胜20场' },
      { target: 50,  reward: { jade: 50 },    desc: '连胜50场' },
      { target: 100, reward: { jade: 100 },   desc: '连胜100场' }
    ],
    getProgress: function () {
      var stats = ResourceManager.getStats ? ResourceManager.getStats() : {};
      return stats.maxWinStreak || 0;
    }
  },
  {
    id: 'battle_damage_total',
    title: '毁天灭地',
    category: 'battle',
    icon: '💥',
    milestones: [
      { target: 50000,   reward: { gold: 300 },   desc: '累计造成5万伤害' },
      { target: 500000,  reward: { jade: 15 },    desc: '累计造成50万伤害' },
      { target: 5000000, reward: { jade: 50 },    desc: '累计造成500万伤害' }
    ],
    getProgress: function () {
      var stats = ResourceManager.getStats ? ResourceManager.getStats() : {};
      return stats.totalDamageDealt || 0;
    }
  },

  // --- 新增：英雄成就 ---
  {
    id: 'hero_legendary',
    title: '传说降临',
    category: 'hero',
    icon: '👑',
    milestones: [
      { target: 1,  reward: { jade: 30 },  desc: '获得1个传说武将' },
      { target: 5,  reward: { jade: 80 },  desc: '获得5个传说武将' },
      { target: 11, reward: { jade: 200 }, desc: '收集全部11个传说武将' }
    ],
    getProgress: function () {
      var heroes = HeroManager.getAll();
      var count = 0;
      for (var i = 0; i < heroes.length; i++) {
        if (heroes[i].quality === 5) count++;
      }
      return count;
    }
  },
  {
    id: 'hero_bonds_active',
    title: '羁绊之力',
    category: 'hero',
    icon: '🔗',
    milestones: [
      { target: 1,  reward: { jade: 15 },  desc: '激活1个武将羁绊' },
      { target: 5,  reward: { jade: 50 },  desc: '激活5个武将羁绊' },
      { target: 10, reward: { jade: 100 }, desc: '激活10个武将羁绊' }
    ],
    getProgress: function () {
      var heroes = HeroManager.getAll();
      if (typeof HeroBonds === 'undefined') return 0;
      var ownedIds = {};
      for (var i = 0; i < heroes.length; i++) ownedIds[heroes[i].id] = true;
      var active = 0;
      for (var j = 0; j < HeroBonds.length; j++) {
        var b = HeroBonds[j];
        var count = 0;
        for (var k = 0; k < b.heroIds.length; k++) {
          if (ownedIds[b.heroIds[k]]) count++;
        }
        if (count >= b.minRequired) active++;
      }
      return active;
    }
  },
  {
    id: 'hero_faction_complete',
    title: '阵营大师',
    category: 'hero',
    icon: '🏛️',
    milestones: [
      { target: 1, reward: { jade: 30 },  desc: '集齐1个阵营全部武将' },
      { target: 2, reward: { jade: 60 },  desc: '集齐2个阵营全部武将' },
      { target: 4, reward: { jade: 150 }, desc: '集齐全部4个阵营武将' }
    ],
    getProgress: function () {
      var heroes = HeroManager.getAll();
      if (typeof HeroData === 'undefined') return 0;
      var factionTotal = {};
      for (var i = 0; i < HeroData.length; i++) {
        factionTotal[HeroData[i].faction] = (factionTotal[HeroData[i].faction] || 0) + 1;
      }
      var ownedFaction = {};
      for (var j = 0; j < heroes.length; j++) {
        ownedFaction[heroes[j].faction] = (ownedFaction[heroes[j].faction] || 0) + 1;
      }
      var complete = 0;
      for (var f in factionTotal) {
        if ((ownedFaction[f] || 0) >= factionTotal[f]) complete++;
      }
      return complete;
    }
  },

  // --- 新增：收集成就 ---
  {
    id: 'equip_legendary',
    title: '传世之宝',
    category: 'collect',
    icon: '✨',
    milestones: [
      { target: 1,  reward: { jade: 20 },  desc: '获得1件传说装备' },
      { target: 5,  reward: { jade: 50 },  desc: '获得5件传说装备' },
      { target: 15, reward: { jade: 100 }, desc: '获得15件传说装备' }
    ],
    getProgress: function () {
      if (typeof EquipmentManager === 'undefined') return 0;
      var inv = EquipmentManager.getInventory();
      var count = 0;
      for (var i = 0; i < inv.length; i++) {
        if (inv[i].quality >= 5) count++;
      }
      return count;
    }
  },
  {
    id: 'recruit_legendary_hero',
    title: '欧皇附体',
    category: 'collect',
    icon: '🎰',
    milestones: [
      { target: 1,  reward: { jade: 30 },  desc: '招募到1个传说武将' },
      { target: 5,  reward: { jade: 80 },  desc: '招募到5个传说武将' },
      { target: 11, reward: { jade: 200 }, desc: '招募到全部传说武将' }
    ],
    getProgress: function () {
      if (typeof RecruitManager === 'undefined') return 0;
      var state = RecruitManager.getState();
      return state.legendaryCount || 0;
    }
  },
  {
    id: 'forge_complete',
    title: '铸造大师',
    category: 'collect',
    icon: '🔨',
    milestones: [
      { target: 5,  reward: { gold: 500 },  desc: '完成5次锻造' },
      { target: 20, reward: { jade: 15 },   desc: '完成20次锻造' },
      { target: 50, reward: { jade: 50 },   desc: '完成50次锻造' }
    ],
    getProgress: function () {
      if (typeof ForgeManager === 'undefined') return 0;
      var state = ForgeManager.getState();
      return state.totalForged || 0;
    }
  },

  // --- 新增：城镇成就 ---
  {
    id: 'town_max_building',
    title: '满级建筑',
    category: 'town',
    icon: '🏯',
    milestones: [
      { target: 1, reward: { jade: 20 },  desc: '将1个建筑升到满级' },
      { target: 3, reward: { jade: 50 },  desc: '将3个建筑升到满级' },
      { target: 8, reward: { jade: 100 }, desc: '将全部建筑升到满级' }
    ],
    getProgress: function () {
      if (typeof TownManager === 'undefined') return 0;
      var state = TownManager.getState();
      var count = 0;
      if (state && state.buildings) {
        for (var key in state.buildings) {
          if (state.buildings[key].level >= 10) count++;
        }
      }
      return count;
    }
  },
  {
    id: 'town_trade_count',
    title: '丝绸之路',
    category: 'town',
    icon: '🐫',
    milestones: [
      { target: 10,  reward: { gold: 500 },  desc: '完成10次资源交易' },
      { target: 50,  reward: { jade: 15 },   desc: '完成50次资源交易' },
      { target: 200, reward: { jade: 50 },   desc: '完成200次资源交易' }
    ],
    getProgress: function () {
      var stats = ResourceManager.getStats ? ResourceManager.getStats() : {};
      return stats.totalTrades || 0;
    }
  },

  // --- 新增：经济成就 ---
  {
    id: 'jade_earned',
    title: '玉石俱焚',
    category: 'economy',
    icon: '💎',
    milestones: [
      { target: 100,  reward: { gold: 2000 },  desc: '累计获得100玉璧' },
      { target: 500,  reward: { gold: 10000 }, desc: '累计获得500玉璧' },
      { target: 2000, reward: { gold: 50000 }, desc: '累计获得2000玉璧' }
    ],
    getProgress: function () {
      var stats = ResourceManager.getStats ? ResourceManager.getStats() : {};
      return stats.totalJadeEarned || 0;
    }
  },
  {
    id: 'gold_spent_total',
    title: '千金散尽',
    category: 'economy',
    icon: '🪙',
    milestones: [
      { target: 50000,   reward: { jade: 10 },  desc: '累计消费5万金币' },
      { target: 500000,  reward: { jade: 30 },  desc: '累计消费50万金币' },
      { target: 5000000, reward: { jade: 80 },  desc: '累计消费500万金币' }
    ],
    getProgress: function () {
      var stats = ResourceManager.getStats ? ResourceManager.getStats() : {};
      return stats.totalGoldSpent || 0;
    }
  },

  // --- 新增：探索成就 ---
  {
    id: 'adventure_regions',
    title: '踏遍山河',
    category: 'explore',
    icon: '🧭',
    milestones: [
      { target: 2, reward: { jade: 15 },  desc: '探索2个区域' },
      { target: 5, reward: { jade: 40 },  desc: '探索5个区域' },
      { target: 8, reward: { jade: 80 },  desc: '探索全部区域' }
    ],
    getProgress: function () {
      if (typeof AdventureManager === 'undefined') return 0;
      var state = AdventureManager.getState();
      if (!state || !state.unlockedRegions) return 1;
      return state.unlockedRegions.length || 1;
    }
  },
  {
    id: 'story_chapters',
    title: '三国演义',
    category: 'explore',
    icon: '📖',
    milestones: [
      { target: 3,  reward: { jade: 15 },  desc: '解锁3个剧情章节' },
      { target: 8,  reward: { jade: 40 },  desc: '解锁8个剧情章节' },
      { target: 15, reward: { jade: 100 }, desc: '解锁全部15个剧情章节' }
    ],
    getProgress: function () {
      if (typeof StoryManager === 'undefined') return 0;
      var state = StoryManager.getState();
      return state.unlockedChapters ? state.unlockedChapters.length : 0;
    }
  },
  {
    id: 'cook_dishes',
    title: '厨神之路',
    category: 'explore',
    icon: '🍳',
    milestones: [
      { target: 10,  reward: { gold: 500 },  desc: '烹饪10道料理' },
      { target: 50,  reward: { jade: 15 },   desc: '烹饪50道料理' },
      { target: 200, reward: { jade: 50 },   desc: '烹饪200道料理' }
    ],
    getProgress: function () {
      if (typeof FarmManager === 'undefined') return 0;
      var state = FarmManager.getState();
      return state.totalCooked || 0;
    }
  },
  {
    id: 'merchant_purchases',
    title: '购物狂人',
    category: 'explore',
    icon: '🛍️',
    milestones: [
      { target: 10,  reward: { gold: 300 },  desc: '在商店购买10次' },
      { target: 50,  reward: { jade: 15 },   desc: '在商店购买50次' },
      { target: 200, reward: { jade: 50 },   desc: '在商店购买200次' }
    ],
    getProgress: function () {
      if (typeof MerchantManager === 'undefined') return 0;
      var state = MerchantManager.getState();
      return state.totalPurchases || 0;
    }
  }
];

// 成就分类名称
var AchievementCategories = {
  battle: { name: '战斗', icon: '⚔️' },
  hero: { name: '英雄', icon: '🦸' },
  collect: { name: '收集', icon: '📦' },
  town: { name: '城镇', icon: '🏗️' },
  economy: { name: '经济', icon: '💰' },
  explore: { name: '探索', icon: '🗺️' }
};
