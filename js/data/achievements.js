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
      { target: 5,  reward: { jade: 10 },  desc: '通关5个关卡' },
      { target: 15, reward: { jade: 20 },  desc: '通关15个关卡' },
      { target: 30, reward: { jade: 50 },  desc: '通关30个关卡' },
      { target: 50, reward: { jade: 100 }, desc: '通关全部50个关卡' }
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
      { target: 3, reward: { jade: 50 },  desc: '通关全部3个深渊' },
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
      { target: 8,  reward: { jade: 30 },  desc: '收集8个武将' },
      { target: 15, reward: { jade: 50 },  desc: '收集15个武将' },
      { target: 20, reward: { jade: 100 }, desc: '收集全部20个武将' }
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
