/**
 * 每日任务数据定义
 * 
 * 任务模板池：每天从中随机选取5个任务
 * 每个模板定义类型、目标事件、目标数量和奖励
 */

// 任务模板池
var QuestTemplates = [
  // --- 战斗类 ---
  {
    id: 'battle_3',
    title: '初战告捷',
    desc: '完成3场战斗',
    event: 'battle:ended',
    target: 3,
    category: 'battle',
    rewards: { gold: 200, exp: 100 }
  },
  {
    id: 'battle_10',
    title: '身经百战',
    desc: '完成10场战斗',
    event: 'battle:ended',
    target: 10,
    category: 'battle',
    rewards: { gold: 500, exp: 300, jade: 5 }
  },
  {
    id: 'battle_win_5',
    title: '常胜将军',
    desc: '赢得5场战斗',
    event: 'battle:ended',
    filter: function (data) { return data && data.result === 'victory'; },
    target: 5,
    category: 'battle',
    rewards: { gold: 300, exp: 200, jade: 5 }
  },

  // --- 英雄类 ---
  {
    id: 'hero_levelup_1',
    title: '勤加修炼',
    desc: '升级任意武将1次',
    event: 'hero:levelup',
    target: 1,
    category: 'hero',
    rewards: { gold: 300, jade: 5 }
  },
  {
    id: 'hero_levelup_3',
    title: '突飞猛进',
    desc: '升级武将3次',
    event: 'hero:levelup',
    target: 3,
    category: 'hero',
    rewards: { gold: 500, exp: 200, jade: 10 }
  },

  // --- 装备类 ---
  {
    id: 'equip_reinforce_1',
    title: '精益求精',
    desc: '强化装备1次',
    event: 'equip:reinforce',
    target: 1,
    category: 'equip',
    rewards: { gold: 200, exp: 100 }
  },
  {
    id: 'equip_reinforce_3',
    title: '百炼成钢',
    desc: '强化装备3次',
    event: 'equip:reinforce',
    target: 3,
    category: 'equip',
    rewards: { gold: 400, jade: 5 }
  },
  {
    id: 'equip_sell_5',
    title: '清理库房',
    desc: '出售5件装备',
    event: 'equip:sold',
    target: 5,
    category: 'equip',
    rewards: { gold: 300 }
  },

  // --- 招募类 ---
  {
    id: 'recruit_1',
    title: '广纳贤才',
    desc: '进行1次招募',
    event: 'recruit:result',
    target: 1,
    category: 'recruit',
    rewards: { gold: 500, jade: 10 }
  },

  // --- 城镇类 ---
  {
    id: 'building_upgrade_1',
    title: '大兴土木',
    desc: '升级建筑1次',
    event: 'town:building_upgraded',
    target: 1,
    category: 'town',
    rewards: { gold: 300, exp: 150 }
  },
  {
    id: 'building_upgrade_2',
    title: '繁荣昌盛',
    desc: '升级建筑2次',
    event: 'town:building_upgraded',
    target: 2,
    category: 'town',
    rewards: { gold: 500, exp: 300, jade: 5 }
  },

  // --- 种菜类 ---
  {
    id: 'farm_harvest_3',
    title: '田园丰收',
    desc: '收获3次作物',
    event: 'farm:harvested',
    target: 3,
    category: 'farm',
    rewards: { gold: 200, exp: 100 }
  },
  {
    id: 'farm_cook_1',
    title: '美味料理',
    desc: '烹饪1道料理',
    event: 'farm:cooked',
    target: 1,
    category: 'farm',
    rewards: { gold: 300, jade: 5 }
  },

  // --- 冒险类 ---
  {
    id: 'adventure_idle_start',
    title: '踏上征途',
    desc: '开始1次挂机冒险',
    event: 'adventure:mode_changed',
    filter: function (data) { return data && data.mode === 'idle'; },
    target: 1,
    category: 'adventure',
    rewards: { gold: 200, exp: 150 }
  },

  // --- 锻造类 ---
  {
    id: 'forge_start_1',
    title: '铸剑师',
    desc: '开始1次锻造',
    event: 'forge:started',
    target: 1,
    category: 'forge',
    rewards: { gold: 300, exp: 200 }
  },

  // --- 商人类 ---
  {
    id: 'merchant_buy_1',
    title: '精打细算',
    desc: '在商店购买1件物品',
    event: 'merchant:purchased',
    target: 1,
    category: 'merchant',
    rewards: { gold: 200, jade: 5 }
  },

  // --- 资源类 ---
  {
    id: 'earn_gold_2000',
    title: '日进斗金',
    desc: '累计获得2000金币',
    event: 'resource:changed',
    filter: function (type, amount) { return type === 'gold' && amount > 0; },
    accumulate: function (type, amount) { return (type === 'gold' && amount > 0) ? amount : 0; },
    target: 2000,
    category: 'resource',
    rewards: { jade: 10, exp: 200 }
  },
  {
    id: 'spend_gold_1000',
    title: '挥金如土',
    desc: '消费1000金币',
    event: 'resource:changed',
    filter: function (type, amount) { return type === 'gold' && amount < 0; },
    accumulate: function (type, amount) { return (type === 'gold' && amount < 0) ? Math.abs(amount) : 0; },
    target: 1000,
    category: 'resource',
    rewards: { jade: 5, exp: 150 }
  },

  // --- 深渊类 ---
  {
    id: 'abyss_attempt_1',
    title: '深入虎穴',
    desc: '挑战深渊1次',
    event: 'abyss:floor_cleared',
    target: 1,
    category: 'abyss',
    rewards: { gold: 500, jade: 10, exp: 300 }
  }
];

// 全完成宝箱奖励
var QuestBonusReward = {
  gold: 1000,
  jade: 20,
  exp: 500
};

// 每日任务数量
var DAILY_QUEST_COUNT = 5;

// 任务类别图标
var QuestCategoryIcons = {
  battle: '⚔️',
  hero: '🦸',
  equip: '🛡️',
  recruit: '🎯',
  town: '🏗️',
  farm: '🌾',
  adventure: '🗺️',
  forge: '🔨',
  merchant: '🛒',
  resource: '💰',
  abyss: '🕳️'
};
