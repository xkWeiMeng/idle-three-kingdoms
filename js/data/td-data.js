/**
 * 塔防系统静态数据表
 */

// --- 防御建筑数据（16 种，4 时代 × 4 种） ---
var TDTowerData = {
  // 时代 1：中世纪
  td_palisade: {
    id: 'td_palisade', name: '木栅栏', era: 1, category: 'wall',
    size: { w: 1, h: 1 },
    atk: 0, range: 0, attackSpeed: 0, hp: 200,
    targets: ['ground', 'underground'],
    special: null,
    cost: { gold: 50, wood: 20 }
  },
  td_arrow_tower: {
    id: 'td_arrow_tower', name: '箭塔', era: 1, category: 'attack',
    size: { w: 2, h: 2 },
    atk: 20, range: 3, attackSpeed: 1.0, hp: 0,
    targets: ['ground', 'air'],
    special: null,
    cost: { gold: 100, wood: 30 }
  },
  td_watchtower: {
    id: 'td_watchtower', name: '瞭望塔', era: 1, category: 'support',
    size: { w: 2, h: 2 },
    atk: 5, range: 5, attackSpeed: 0.5, hp: 0,
    targets: ['ground', 'underground', 'air'],
    special: 'detect',
    cost: { gold: 150, wood: 40, stone: 20 }
  },
  td_caltrops: {
    id: 'td_caltrops', name: '拒马', era: 1, category: 'trap',
    size: { w: 1, h: 1 },
    atk: 10, range: 0, attackSpeed: 0, hp: 0,
    targets: ['ground'],
    special: 'slow_50_3s',
    cost: { gold: 30, wood: 15 }
  },

  // 时代 2：火药时代
  td_stone_wall: {
    id: 'td_stone_wall', name: '石墙', era: 2, category: 'wall',
    size: { w: 1, h: 1 },
    atk: 0, range: 0, attackSpeed: 0, hp: 500,
    targets: ['ground', 'underground'],
    special: null,
    cost: { gold: 150, stone: 50 }
  },
  td_cannon: {
    id: 'td_cannon', name: '火炮塔', era: 2, category: 'attack',
    size: { w: 2, h: 2 },
    atk: 60, range: 4, attackSpeed: 0.33, hp: 0,
    targets: ['ground'],
    special: 'splash_1',
    cost: { gold: 400, wood: 60, stone: 50, iron: 20 }
  },
  td_rocket_cart: {
    id: 'td_rocket_cart', name: '火箭车', era: 2, category: 'attack',
    size: { w: 2, h: 2 },
    atk: 35, range: 3.5, attackSpeed: 0.5, hp: 0,
    targets: ['ground', 'air'],
    special: null,
    cost: { gold: 300, wood: 40, stone: 30, iron: 15 }
  },
  td_oil_pool: {
    id: 'td_oil_pool', name: '火油池', era: 2, category: 'trap',
    size: { w: 1, h: 1 },
    atk: 25, range: 1, attackSpeed: 0, hp: 0,
    targets: ['ground', 'underground'],
    special: 'burn_5s_cd15',
    cost: { gold: 200, wood: 30, stone: 20 }
  },

  // 时代 3：工业时代
  td_iron_wall: {
    id: 'td_iron_wall', name: '铁壁', era: 3, category: 'wall',
    size: { w: 1, h: 1 },
    atk: 0, range: 0, attackSpeed: 0, hp: 1200,
    targets: ['ground', 'underground'],
    special: null,
    cost: { gold: 300, stone: 100, iron: 50 }
  },
  td_gatling: {
    id: 'td_gatling', name: '加特林塔', era: 3, category: 'attack',
    size: { w: 2, h: 2 },
    atk: 15, range: 3, attackSpeed: 3.0, hp: 0,
    targets: ['ground', 'air'],
    special: 'multi_2',
    cost: { gold: 600, wood: 80, stone: 60, iron: 40 }
  },
  td_minefield: {
    id: 'td_minefield', name: '地雷阵', era: 3, category: 'trap',
    size: { w: 1, h: 1 },
    atk: 80, range: 1, attackSpeed: 0, hp: 0,
    targets: ['ground', 'underground'],
    special: 'aoe_1',
    cost: { gold: 250, stone: 40, iron: 30 }
  },
  td_steam_ballista: {
    id: 'td_steam_ballista', name: '蒸汽弩炮', era: 3, category: 'attack',
    size: { w: 2, h: 2 },
    atk: 100, range: 5, attackSpeed: 0.2, hp: 0,
    targets: ['air'],
    special: 'armor_pierce_50',
    cost: { gold: 800, wood: 100, stone: 80, iron: 50 }
  },

  // 时代 4：现代科技
  td_electric_fence: {
    id: 'td_electric_fence', name: '电网围栏', era: 4, category: 'wall',
    size: { w: 1, h: 1 },
    atk: 15, range: 0, attackSpeed: 0, hp: 800,
    targets: ['ground', 'underground'],
    special: 'contact_damage',
    cost: { gold: 500, stone: 100, iron: 80 }
  },
  td_missile_tower: {
    id: 'td_missile_tower', name: '导弹塔', era: 4, category: 'attack',
    size: { w: 2, h: 2 },
    atk: 120, range: 6, attackSpeed: 0.25, hp: 0,
    targets: ['ground', 'air'],
    special: 'homing_splash_1',
    cost: { gold: 1200, wood: 100, stone: 100, iron: 80 }
  },
  td_radar: {
    id: 'td_radar', name: '雷达站', era: 4, category: 'support',
    size: { w: 2, h: 2 },
    atk: 0, range: 6, attackSpeed: 0, hp: 0,
    targets: [],
    special: 'detect_atk_buff_20',
    cost: { gold: 600, stone: 50, iron: 60 }
  },
  td_laser: {
    id: 'td_laser', name: '激光炮', era: 4, category: 'attack',
    size: { w: 2, h: 2 },
    atk: 200, range: 7, attackSpeed: 0.15, hp: 0,
    targets: ['ground', 'air'],
    special: 'pierce_beam',
    cost: { gold: 2000, stone: 150, iron: 120 }
  }
};

// --- 获取塔尺寸（格子数） ---
function TDGetTowerSize(typeId) {
  var td = TDTowerData[typeId];
  if (td && td.size) return td.size;
  return { w: 1, h: 1 };
}

// --- 升级倍率表（Lv1-5） ---
var TD_UPGRADE_TABLE = [
  null,
  { statMul: 1.00, hpMul: 1.00, costMul: 0 },
  { statMul: 1.20, hpMul: 1.30, costMul: 1.0 },
  { statMul: 1.40, hpMul: 1.60, costMul: 1.5 },
  { statMul: 1.60, hpMul: 2.00, costMul: 2.0 },
  { statMul: 2.00, hpMul: 2.50, costMul: 3.0 }
];

// --- 敌人类型数据（9 种） ---
var TDEnemyData = {
  td_infantry: {
    id: 'td_infantry', name: '步兵', category: 'ground',
    hpMul: 1.0, atkMul: 1.0, defMul: 1.0, speed: 1.0,
    special: null
  },
  td_cavalry: {
    id: 'td_cavalry', name: '骑兵', category: 'ground',
    hpMul: 0.7, atkMul: 0.8, defMul: 0.6, speed: 1.8,
    special: null
  },
  td_heavy: {
    id: 'td_heavy', name: '重步兵', category: 'ground',
    hpMul: 2.0, atkMul: 0.8, defMul: 2.0, speed: 0.6,
    special: null
  },
  td_siege_ram: {
    id: 'td_siege_ram', name: '攻城车', category: 'ground',
    hpMul: 3.0, atkMul: 1.5, defMul: 1.5, speed: 0.4,
    special: 'wall_damage_x2'
  },
  td_tunneler: {
    id: 'td_tunneler', name: '掘进兵', category: 'underground',
    hpMul: 1.0, atkMul: 1.0, defMul: 0.8, speed: 0.8,
    special: 'stealth'
  },
  td_burrower: {
    id: 'td_burrower', name: '穿甲鼠', category: 'underground',
    hpMul: 0.6, atkMul: 1.2, defMul: 0.5, speed: 1.5,
    special: 'stealth'
  },
  td_sky_rider: {
    id: 'td_sky_rider', name: '飞骑', category: 'air',
    hpMul: 0.8, atkMul: 0.9, defMul: 0.5, speed: 1.5,
    special: 'flying'
  },
  td_bomber: {
    id: 'td_bomber', name: '轰炸者', category: 'air',
    hpMul: 1.5, atkMul: 1.5, defMul: 0.8, speed: 0.7,
    special: 'flying_tower_damage_x2'
  },
  td_final_boss: {
    id: 'td_final_boss', name: '终极统帅', category: 'ground',
    hpMul: 1.0, atkMul: 1.0, defMul: 1.0, speed: 0.5,
    special: 'summon_infantry'
  }
};

// --- 波次表（20 波，公式生成基础属性） ---
var TDWaveTable = (function () {
  var compositions = [
    null,
    [{ type: 'td_infantry', count: 3 }],
    [{ type: 'td_infantry', count: 3 }],
    [{ type: 'td_infantry', count: 2 }, { type: 'td_cavalry', count: 1 }],
    [{ type: 'td_infantry', count: 2 }, { type: 'td_heavy', count: 1 }],
    [{ type: 'td_siege_ram', count: 1 }],
    [{ type: 'td_infantry', count: 3 }, { type: 'td_cavalry', count: 1 }],
    [{ type: 'td_infantry', count: 2 }, { type: 'td_cavalry', count: 1 }, { type: 'td_tunneler', count: 1 }],
    [{ type: 'td_infantry', count: 3 }, { type: 'td_tunneler', count: 1 }],
    [{ type: 'td_infantry', count: 2 }, { type: 'td_tunneler', count: 2 }, { type: 'td_cavalry', count: 1 }],
    [{ type: 'td_burrower', count: 1 }],
    [{ type: 'td_infantry', count: 3 }, { type: 'td_cavalry', count: 1 }, { type: 'td_sky_rider', count: 1 }],
    [{ type: 'td_infantry', count: 2 }, { type: 'td_sky_rider', count: 2 }, { type: 'td_tunneler', count: 1 }],
    [{ type: 'td_cavalry', count: 2 }, { type: 'td_tunneler', count: 2 }, { type: 'td_sky_rider', count: 2 }],
    [{ type: 'td_heavy', count: 3 }, { type: 'td_sky_rider', count: 2 }, { type: 'td_tunneler', count: 1 }],
    [{ type: 'td_bomber', count: 1 }],
    [{ type: 'td_infantry', count: 3 }, { type: 'td_heavy', count: 2 }, { type: 'td_siege_ram', count: 1 }],
    [{ type: 'td_cavalry', count: 2 }, { type: 'td_tunneler', count: 2 }, { type: 'td_sky_rider', count: 2 }, { type: 'td_bomber', count: 1 }],
    [{ type: 'td_heavy', count: 3 }, { type: 'td_tunneler', count: 2 }, { type: 'td_sky_rider', count: 2 }],
    [{ type: 'td_siege_ram', count: 2 }, { type: 'td_burrower', count: 2 }, { type: 'td_bomber', count: 2 }, { type: 'td_cavalry', count: 1 }],
    [{ type: 'td_final_boss', count: 1 }, { type: 'td_heavy', count: 2 }, { type: 'td_sky_rider', count: 2 }]
  ];

  var table = [null];
  for (var n = 1; n <= 20; n++) {
    var baseHp = Math.floor(100 * Math.pow(1.12, n - 1) * (1 + 0.03 * Math.max(0, n - 10)));
    var baseAtk = Math.floor(15 * Math.pow(1.08, n - 1));
    var baseDef = Math.floor(8 * Math.pow(1.06, n - 1));
    var isBoss = n % 5 === 0;
    var count = isBoss && n < 20 ? 1 : (3 + Math.floor((n - 1) / 4));
    if (n === 20) count = 5;
    table.push({
      wave: n,
      baseHp: baseHp,
      baseAtk: baseAtk,
      baseDef: baseDef,
      count: count,
      enemies: compositions[n],
      isBoss: isBoss
    });
  }
  return table;
})();

// --- 科技树（4 个时代） ---
var TDTechTree = [
  null,
  { era: 1, name: '中世纪', cost: null, time: 0, requires: null },
  { era: 2, name: '火药时代', cost: { gold: 2000, wood: 200, stone: 150 }, time: 1800, requires: { era: 1, wave: 5 } },
  { era: 3, name: '工业时代', cost: { gold: 5000, wood: 400, stone: 300, iron: 100 }, time: 3600, requires: { era: 2, wave: 10 } },
  { era: 4, name: '现代科技', cost: { gold: 10000, wood: 600, stone: 500, iron: 200 }, time: 7200, requires: { era: 3, wave: 15 } }
];

// --- 常量 ---
var TD_CONSTANTS = {
  MAX_TOWER_LEVEL: 5,
  MAX_WAVE: 20,
  MAX_ASSIGNED_HEROES: 2,
  PREP_TIME: 15,
  SELL_RATE_IDLE: 0.5,
  SELL_RATE_ACTIVE: 0.3,
  AUTO_REWARD_RATE: 0.7,
  MANUAL_GOLD_BONUS: 1.3,
  MANUAL_EXP_BONUS: 1.2,
  AUTO_WIN_THRESHOLD: 0.8,
  WAVE_DURATION_ASSUMED: 60,
  HERO_SKILL_INTERVAL: 10,
  HERO_SKILL_COEFFICIENT: 0.5,
  TILE_SIZE: 48,
  DAILY_CHALLENGE_LIMIT: 3
};

// --- 波次奖励函数 ---
function TDWaveRewards(n) {
  var isBoss = n % 5 === 0;
  var gold = Math.floor(50 * Math.pow(1.15, n - 1));
  var exp = Math.floor(15 * Math.pow(1.12, n - 1));
  if (isBoss) {
    gold *= 5;
    exp *= 3;
  }
  var result = { gold: gold, exp: exp };
  if (n === 20) {
    result.jade = 3;
    result.equipChance = 1.0;
    result.equipMinQuality = 4;
  } else if (isBoss) {
    result.equipChance = 0.1;
    result.equipMinQuality = 3;
    if (n >= 10) {
      result.jadeChance = 0.2;
      result.jadeAmount = 1;
    }
  } else if (n >= 10) {
    result.jadeChance = 0.05;
    result.jadeAmount = 1;
  }
  return result;
}

// --- 塔防章节/关卡数据（5 章 × 5 关） ---
// 每章5关，每关=一个波次战斗，章内难度递增，第5关为Boss关
// 章节间有大跨度难度提升，需要升级塔和科技
var TDChapterData = [
  null,
  // 第一章：黄巾之乱（中世纪，解锁即可挑战）
  {
    id: 1, name: '黄巾之乱', era: 1, description: '各地黄巾军蜂拥而至，保卫城池！',
    unlockCondition: null, // 解锁城防即可
    stages: [
      { stage: 1, name: '散兵入侵', difficulty: 1.0, waves: [1] },
      { stage: 2, name: '骑兵突袭', difficulty: 1.2, waves: [2, 3] },
      { stage: 3, name: '重甲兵团', difficulty: 1.5, waves: [3, 4] },
      { stage: 4, name: '攻城先锋', difficulty: 1.8, waves: [4, 5] },
      { stage: 5, name: 'Boss: 张角', difficulty: 2.2, waves: [5], isBoss: true }
    ]
  },
  // 第二章：群雄割据（中世纪→火药过渡）
  {
    id: 2, name: '群雄割据', era: 1, description: '诸侯混战，敌军日渐强大',
    unlockCondition: { chapter: 1 },
    stages: [
      { stage: 1, name: '联军压境', difficulty: 2.5, waves: [6] },
      { stage: 2, name: '暗夜掘进', difficulty: 3.0, waves: [7, 8] },
      { stage: 3, name: '地道战', difficulty: 3.5, waves: [8, 9] },
      { stage: 4, name: '穿甲鼠群', difficulty: 4.0, waves: [9, 10] },
      { stage: 5, name: 'Boss: 吕布', difficulty: 5.0, waves: [10], isBoss: true }
    ]
  },
  // 第三章：烽火连天（火药时代）
  {
    id: 3, name: '烽火连天', era: 2, description: '火药武器登场，天空也不安全了',
    unlockCondition: { chapter: 2, era: 2 },
    stages: [
      { stage: 1, name: '飞骑骚扰', difficulty: 5.5, waves: [11] },
      { stage: 2, name: '空地协同', difficulty: 6.5, waves: [11, 12] },
      { stage: 3, name: '三面夹击', difficulty: 7.5, waves: [13] },
      { stage: 4, name: '重甲天际', difficulty: 8.5, waves: [13, 14] },
      { stage: 5, name: 'Boss: 轰炸者', difficulty: 10.0, waves: [15], isBoss: true }
    ]
  },
  // 第四章：工业之怒（工业时代）
  {
    id: 4, name: '工业之怒', era: 3, description: '工业力量全面碾压城防',
    unlockCondition: { chapter: 3, era: 3 },
    stages: [
      { stage: 1, name: '机械浪潮', difficulty: 11.0, waves: [16] },
      { stage: 2, name: '陆空齐进', difficulty: 13.0, waves: [17] },
      { stage: 3, name: '全面围攻', difficulty: 15.0, waves: [18] },
      { stage: 4, name: '末日前夕', difficulty: 18.0, waves: [19] },
      { stage: 5, name: 'Boss: 铁甲军团', difficulty: 22.0, waves: [19, 20], isBoss: true }
    ]
  },
  // 第五章：终极决战（现代科技）
  {
    id: 5, name: '终极决战', era: 4, description: '史上最强敌人，决一死战！',
    unlockCondition: { chapter: 4, era: 4 },
    stages: [
      { stage: 1, name: '精锐先锋', difficulty: 25.0, waves: [18, 19] },
      { stage: 2, name: '空袭风暴', difficulty: 30.0, waves: [19, 20] },
      { stage: 3, name: '地狱围城', difficulty: 35.0, waves: [17, 18, 19] },
      { stage: 4, name: '末日审判', difficulty: 42.0, waves: [19, 20] },
      { stage: 5, name: 'Boss: 终极统帅', difficulty: 50.0, waves: [20], isBoss: true }
    ]
  }
];

// --- 主城等级 → 防御塔容量 ---
// town_hall Lv3 解锁城防，每升一级多3个塔位
var TDTowerCapacity = {
  3: 8, 4: 11, 5: 14, 6: 17, 7: 20, 8: 23, 9: 26, 10: 30
};

// --- NPC 战时台词 ---
var TDWarDialogues = [
  '打仗了，快跑啊！',
  '敌人来了！快回城！',
  '天哪，又打起来了！',
  '救命啊！快跑！',
  '保护主公！冲啊！',
  '不好了！有人进攻了！',
  '快躲到城主府里！',
  '我的天，好多敌人！',
  '孩子们，快跑！',
  '大家快撤退！',
  '别挡路，让我先跑！',
  '呜呜，我好怕…',
];
