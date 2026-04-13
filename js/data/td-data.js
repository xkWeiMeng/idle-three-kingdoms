/**
 * 塔防系统静态数据表 — 三国主题版
 *
 * 取消科技时代系统，改为城主府等级解锁制（requiredTownHall）。
 * 全部建筑/敌人/关卡三国化，参考部落冲突玩法。
 */

// ============================================================
//  防御建筑数据（13 种：6 攻击/支援 + 3 城墙 + 4 陷阱）
// ============================================================
var TDTowerData = {

  // ── 攻击型建筑 ──

  td_arrow_tower: {
    id: 'td_arrow_tower', name: '箭塔', category: 'attack',
    size: { w: 2, h: 2 },
    atk: 20, range: 3.5, attackSpeed: 1.2, hp: 0,
    targets: ['ground', 'air'],
    special: null,
    cost: { gold: 100, wood: 30 },
    requiredTownHall: 3
  },
  td_crossbow: {
    id: 'td_crossbow', name: '弩车台', category: 'attack',
    size: { w: 2, h: 2 },
    atk: 50, range: 5, attackSpeed: 0.4, hp: 0,
    targets: ['ground', 'air'],
    special: 'armor_pierce_30',
    cost: { gold: 400, wood: 60, iron: 20 },
    requiredTownHall: 4
  },
  td_catapult: {
    id: 'td_catapult', name: '投石车台', category: 'attack',
    size: { w: 2, h: 2 },
    atk: 80, range: 5, attackSpeed: 0.25, hp: 0,
    targets: ['ground'],
    special: 'splash_1.5',
    cost: { gold: 600, wood: 80, stone: 60 },
    requiredTownHall: 5
  },
  td_beacon: {
    id: 'td_beacon', name: '烽火台', category: 'support',
    size: { w: 2, h: 2 },
    atk: 5, range: 6, attackSpeed: 0.5, hp: 0,
    targets: ['ground', 'underground', 'air'],
    special: 'detect_atk_buff_15',
    cost: { gold: 300, wood: 40, stone: 30 },
    requiredTownHall: 4
  },
  td_oil_tower: {
    id: 'td_oil_tower', name: '火油塔', category: 'attack',
    size: { w: 2, h: 2 },
    atk: 35, range: 2.5, attackSpeed: 0.5, hp: 0,
    targets: ['ground'],
    special: 'burn_area_3s',
    cost: { gold: 500, wood: 50, stone: 40 },
    requiredTownHall: 5
  },
  td_repeater: {
    id: 'td_repeater', name: '连弩塔', category: 'attack',
    size: { w: 2, h: 2 },
    atk: 15, range: 3, attackSpeed: 3.0, hp: 0,
    targets: ['ground', 'air'],
    special: 'multi_2',
    cost: { gold: 700, wood: 100, iron: 50 },
    requiredTownHall: 6
  },

  // ── 防御型建筑（城墙） ──

  td_wood_fence: {
    id: 'td_wood_fence', name: '木栅栏', category: 'wall',
    size: { w: 1, h: 1 },
    atk: 0, range: 0, attackSpeed: 0, hp: 200,
    targets: ['ground', 'underground'],
    special: null,
    cost: { gold: 50, wood: 20 },
    requiredTownHall: 3
  },
  td_stone_wall: {
    id: 'td_stone_wall', name: '城墙', category: 'wall',
    size: { w: 1, h: 1 },
    atk: 0, range: 0, attackSpeed: 0, hp: 500,
    targets: ['ground', 'underground'],
    special: null,
    cost: { gold: 200, stone: 50 },
    requiredTownHall: 4
  },
  td_iron_wall: {
    id: 'td_iron_wall', name: '铁壁', category: 'wall',
    size: { w: 1, h: 1 },
    atk: 0, range: 0, attackSpeed: 0, hp: 1200,
    targets: ['ground', 'underground'],
    special: null,
    cost: { gold: 400, stone: 100, iron: 50 },
    requiredTownHall: 6
  },

  // ── 陷阱 ──

  td_spike: {
    id: 'td_spike', name: '拒马', category: 'trap',
    size: { w: 1, h: 1 },
    atk: 15, range: 0, attackSpeed: 0, hp: 0,
    targets: ['ground'],
    special: 'slow_50_3s',
    cost: { gold: 30, wood: 15 },
    requiredTownHall: 3
  },
  td_pitfall: {
    id: 'td_pitfall', name: '陷坑', category: 'trap',
    size: { w: 1, h: 1 },
    atk: 100, range: 0, attackSpeed: 0, hp: 0,
    targets: ['ground'],
    special: 'single_use',
    cost: { gold: 150, stone: 30 },
    requiredTownHall: 4
  },
  td_oil_pool: {
    id: 'td_oil_pool', name: '火油池', category: 'trap',
    size: { w: 1, h: 1 },
    atk: 25, range: 0, attackSpeed: 0, hp: 0,
    targets: ['ground', 'underground'],
    special: 'burn_5s_cd15',
    cost: { gold: 200, wood: 30, stone: 20 },
    requiredTownHall: 5
  },
  td_trip_rope: {
    id: 'td_trip_rope', name: '绊马索', category: 'trap',
    size: { w: 1, h: 1 },
    atk: 0, range: 0, attackSpeed: 0, hp: 0,
    targets: ['ground'],
    special: 'stun_cavalry_2s',
    cost: { gold: 80, wood: 20 },
    requiredTownHall: 4
  }
};

// ── 旧存档兼容：已移除塔 ID → 降级映射 ──
// tower-defense-manager 初始化时可查此表，将旧 ID 替换为新 ID
var TDLegacyTowerMap = {
  'td_palisade':        'td_wood_fence',
  'td_watchtower':      'td_beacon',
  'td_caltrops':        'td_spike',
  'td_cannon':          'td_catapult',
  'td_rocket_cart':     'td_crossbow',
  'td_gatling':         'td_repeater',
  'td_minefield':       'td_pitfall',
  'td_steam_ballista':  'td_crossbow',
  'td_electric_fence':  'td_iron_wall',
  'td_missile_tower':   'td_catapult',
  'td_radar':           'td_beacon',
  'td_laser':           'td_repeater'
};

// ============================================================
//  获取塔尺寸（格子数）
// ============================================================
function TDGetTowerSize(typeId) {
  var td = TDTowerData[typeId];
  if (td && td.size) return td.size;
  // 旧 ID 降级查找
  if (TDLegacyTowerMap[typeId]) {
    td = TDTowerData[TDLegacyTowerMap[typeId]];
    if (td && td.size) return td.size;
  }
  return { w: 1, h: 1 };
}

// ============================================================
//  升级倍率表（Lv1-5）— 保持不变
// ============================================================
var TD_UPGRADE_TABLE = [
  null,
  { statMul: 1.00, hpMul: 1.00, costMul: 0 },
  { statMul: 1.20, hpMul: 1.30, costMul: 1.0 },
  { statMul: 1.40, hpMul: 1.60, costMul: 1.5 },
  { statMul: 1.60, hpMul: 2.00, costMul: 2.0 },
  { statMul: 2.00, hpMul: 2.50, costMul: 3.0 }
];

// ============================================================
//  敌人类型数据（12 种三国兵种）
// ============================================================
var TDEnemyData = {

  // ── 地面兵种 ──

  td_militia: {
    id: 'td_militia', name: '黄巾兵', category: 'ground',
    hpMul: 0.8, atkMul: 0.8, defMul: 0.6, speed: 1.0,
    special: null
  },
  td_spearman: {
    id: 'td_spearman', name: '长枪兵', category: 'ground',
    hpMul: 1.0, atkMul: 1.0, defMul: 1.0, speed: 0.9,
    special: null
  },
  td_heavy_infantry: {
    id: 'td_heavy_infantry', name: '重甲兵', category: 'ground',
    hpMul: 2.0, atkMul: 0.8, defMul: 2.0, speed: 0.5,
    special: null
  },
  td_cavalry: {
    id: 'td_cavalry', name: '轻骑兵', category: 'ground',
    hpMul: 0.7, atkMul: 0.9, defMul: 0.5, speed: 2.0,
    special: null
  },
  td_iron_cavalry: {
    id: 'td_iron_cavalry', name: '铁骑', category: 'ground',
    hpMul: 1.5, atkMul: 1.2, defMul: 1.5, speed: 1.5,
    special: 'wall_damage_x2'
  },

  // ── 攻城器械 ──

  td_siege_ram: {
    id: 'td_siege_ram', name: '攻城车', category: 'ground',
    hpMul: 3.0, atkMul: 1.5, defMul: 2.0, speed: 0.3,
    special: 'wall_damage_x3'
  },
  td_siege_ladder: {
    id: 'td_siege_ladder', name: '云梯', category: 'ground',
    hpMul: 1.0, atkMul: 0.5, defMul: 0.8, speed: 0.8,
    special: 'ignore_wall'
  },
  td_siege_catapult: {
    id: 'td_siege_catapult', name: '投石车', category: 'ground',
    hpMul: 2.0, atkMul: 2.0, defMul: 1.0, speed: 0.3,
    special: 'ranged_attack_building'
  },
  td_battering_ram: {
    id: 'td_battering_ram', name: '冲城锤', category: 'ground',
    hpMul: 4.0, atkMul: 2.0, defMul: 2.5, speed: 0.2,
    special: 'townhall_damage_x5'
  },

  // ── 特殊兵种 ──

  td_assassin: {
    id: 'td_assassin', name: '刺客', category: 'underground',
    hpMul: 0.8, atkMul: 1.5, defMul: 0.5, speed: 1.3,
    special: 'stealth'
  },
  td_horse_archer: {
    id: 'td_horse_archer', name: '弓骑兵', category: 'ground',
    hpMul: 0.7, atkMul: 1.0, defMul: 0.4, speed: 1.8,
    special: 'ranged_move_attack'
  },
  td_enemy_general: {
    id: 'td_enemy_general', name: '敌将', category: 'ground',
    hpMul: 1.0, atkMul: 1.0, defMul: 1.0, speed: 0.5,
    special: 'boss'
  }
};

// ── 旧存档兼容：旧敌人 ID 别名 ──
// tower-defense-manager 中硬编码引用了 td_infantry 用于召唤，保留别名
TDEnemyData.td_infantry = TDEnemyData.td_militia;
TDEnemyData.td_heavy = TDEnemyData.td_heavy_infantry;
TDEnemyData.td_tunneler = TDEnemyData.td_assassin;
TDEnemyData.td_burrower = TDEnemyData.td_assassin;
TDEnemyData.td_final_boss = TDEnemyData.td_enemy_general;

// ============================================================
//  波次表（20 波，公式生成基础属性）
// ============================================================
var TDWaveTable = (function () {

  // 波次敌人组合：三国主题
  // 1-5: 黄巾兵、长枪兵为主
  // 6-10: 加入骑兵、重甲兵、攻城车
  // 11-15: 加入刺客、弓骑兵、投石车
  // 16-19: 加入铁骑、云梯、冲城锤
  // 20: 终极Boss + 全兵种
  var compositions = [
    null,
    // ── 第一阶段：黄巾之乱（波次 1-5） ──
    [{ type: 'td_militia', count: 3 }],
    [{ type: 'td_militia', count: 3 }, { type: 'td_spearman', count: 1 }],
    [{ type: 'td_militia', count: 2 }, { type: 'td_spearman', count: 2 }],
    [{ type: 'td_spearman', count: 3 }, { type: 'td_militia', count: 2 }],
    [{ type: 'td_enemy_general', count: 1 }, { type: 'td_spearman', count: 2 }],

    // ── 第二阶段：诸侯讨董（波次 6-10） ──
    [{ type: 'td_militia', count: 3 }, { type: 'td_cavalry', count: 2 }],
    [{ type: 'td_spearman', count: 2 }, { type: 'td_heavy_infantry', count: 1 }, { type: 'td_cavalry', count: 1 }],
    [{ type: 'td_heavy_infantry', count: 2 }, { type: 'td_cavalry', count: 2 }],
    [{ type: 'td_cavalry', count: 2 }, { type: 'td_siege_ram', count: 1 }, { type: 'td_spearman', count: 2 }],
    [{ type: 'td_enemy_general', count: 1 }, { type: 'td_iron_cavalry', count: 1 }, { type: 'td_heavy_infantry', count: 2 }],

    // ── 第三阶段：赤壁烽火（波次 11-15） ──
    [{ type: 'td_spearman', count: 2 }, { type: 'td_horse_archer', count: 2 }, { type: 'td_militia', count: 2 }],
    [{ type: 'td_cavalry', count: 2 }, { type: 'td_assassin', count: 2 }, { type: 'td_spearman', count: 1 }],
    [{ type: 'td_heavy_infantry', count: 2 }, { type: 'td_horse_archer', count: 2 }, { type: 'td_siege_catapult', count: 1 }],
    [{ type: 'td_cavalry', count: 2 }, { type: 'td_assassin', count: 2 }, { type: 'td_siege_catapult', count: 1 }, { type: 'td_horse_archer', count: 1 }],
    [{ type: 'td_enemy_general', count: 1 }, { type: 'td_horse_archer', count: 2 }, { type: 'td_siege_catapult', count: 1 }],

    // ── 第四阶段：荆州争夺 / 五丈原（波次 16-20） ──
    [{ type: 'td_iron_cavalry', count: 2 }, { type: 'td_siege_ladder', count: 2 }, { type: 'td_spearman', count: 2 }],
    [{ type: 'td_iron_cavalry', count: 2 }, { type: 'td_battering_ram', count: 1 }, { type: 'td_heavy_infantry', count: 2 }, { type: 'td_siege_ladder', count: 1 }],
    [{ type: 'td_iron_cavalry', count: 2 }, { type: 'td_assassin', count: 2 }, { type: 'td_horse_archer', count: 2 }, { type: 'td_battering_ram', count: 1 }],
    [{ type: 'td_siege_ram', count: 1 }, { type: 'td_siege_ladder', count: 2 }, { type: 'td_battering_ram', count: 1 }, { type: 'td_iron_cavalry', count: 2 }],
    [{ type: 'td_enemy_general', count: 1 }, { type: 'td_iron_cavalry', count: 2 }, { type: 'td_siege_catapult', count: 1 }, { type: 'td_assassin', count: 1 }, { type: 'td_battering_ram', count: 1 }]
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

// ============================================================
//  城主府等级解锁表（替代旧科技时代系统）
// ============================================================
var TDTownHallUnlockTable = {
  3: ['td_arrow_tower', 'td_wood_fence', 'td_spike'],
  4: ['td_crossbow', 'td_beacon', 'td_stone_wall', 'td_pitfall', 'td_trip_rope'],
  5: ['td_catapult', 'td_oil_tower', 'td_oil_pool'],
  6: ['td_repeater', 'td_iron_wall']
};

// ── 旧存档兼容：保留 TDTechTree 作为 shim，防止引用崩溃 ──
// tower-defense-manager.js / tower-defense-panel.js 中仍有对 TDTechTree 的引用，
// 此处提供最小兼容结构。新代码应使用 TDTownHallUnlockTable。
var TDTechTree = [
  null,
  { era: 1, name: '基础城防', cost: null, time: 0, requires: null },
  { era: 2, name: '高级城防', cost: null, time: 0, requires: { era: 1, wave: 5 } },
  { era: 3, name: '精锐城防', cost: null, time: 0, requires: { era: 2, wave: 10 } },
  { era: 4, name: '传奇城防', cost: null, time: 0, requires: { era: 3, wave: 15 } }
];

// ============================================================
//  常量
// ============================================================
var TD_CONSTANTS = {
  MAX_TOWER_LEVEL: 5,
  MAX_WAVE: 20,
  MAX_ASSIGNED_HEROES: 3,
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
  TILE_SIZE: 48
};

// ============================================================
//  波次奖励函数 — 保持不变
// ============================================================
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

// ============================================================
//  塔防章节/关卡数据（5 章 × 5 关）— 三国主题
// ============================================================
// 每章5关，每关=一个波次战斗，章内难度递增，第5关为Boss关
// 章节间有大跨度难度提升，需要升级建筑和城主府
var TDChapterData = [
  null,

  // 第一章：黄巾之乱（城主府 Lv3 即可挑战）
  {
    id: 1, name: '黄巾之乱', description: '各地黄巾军蜂拥而至，保卫城池！',
    unlockCondition: null,
    bossName: '张角', bossSkill: '召唤术',
    stages: [
      { stage: 1, name: '散兵游勇', difficulty: 1.0, waves: [1] },
      { stage: 2, name: '黄巾先锋', difficulty: 1.2, waves: [2, 3] },
      { stage: 3, name: '长枪方阵', difficulty: 1.5, waves: [3, 4] },
      { stage: 4, name: '蛾贼攻城', difficulty: 1.8, waves: [4, 5] },
      { stage: 5, name: 'Boss: 张角', difficulty: 2.2, waves: [5], isBoss: true }
    ]
  },

  // 第二章：诸侯讨董（通关第一章解锁）
  {
    id: 2, name: '诸侯讨董', description: '十八路诸侯聚义，虎牢关前鏖战！',
    unlockCondition: { chapter: 1 },
    bossName: '吕布', bossSkill: '高攻高速',
    stages: [
      { stage: 1, name: '联军先锋', difficulty: 2.5, waves: [6] },
      { stage: 2, name: '铁骑冲阵', difficulty: 3.0, waves: [7, 8] },
      { stage: 3, name: '重甲压境', difficulty: 3.5, waves: [8, 9] },
      { stage: 4, name: '攻城号角', difficulty: 4.0, waves: [9, 10] },
      { stage: 5, name: 'Boss: 吕布', difficulty: 5.0, waves: [10], isBoss: true }
    ]
  },

  // 第三章：赤壁烽火（通关第二章解锁）
  {
    id: 3, name: '赤壁烽火', description: '火烧连营，暗杀横行，弓骑呼啸！',
    unlockCondition: { chapter: 2 },
    bossName: '曹操', bossSkill: '全军buff',
    stages: [
      { stage: 1, name: '弓骑骚扰', difficulty: 5.5, waves: [11] },
      { stage: 2, name: '暗夜刺客', difficulty: 6.5, waves: [11, 12] },
      { stage: 3, name: '三面夹击', difficulty: 7.5, waves: [13] },
      { stage: 4, name: '乱石穿空', difficulty: 8.5, waves: [13, 14] },
      { stage: 5, name: 'Boss: 曹操', difficulty: 10.0, waves: [15], isBoss: true }
    ]
  },

  // 第四章：荆州争夺（通关第三章解锁）
  {
    id: 4, name: '荆州争夺', description: '铁骑纵横，云梯攀城，冲城锤破门！',
    unlockCondition: { chapter: 3 },
    bossName: '关羽', bossSkill: '无双斩',
    stages: [
      { stage: 1, name: '铁骑先锋', difficulty: 11.0, waves: [16] },
      { stage: 2, name: '云梯攻城', difficulty: 13.0, waves: [17] },
      { stage: 3, name: '全面围攻', difficulty: 15.0, waves: [18] },
      { stage: 4, name: '破城前夕', difficulty: 18.0, waves: [19] },
      { stage: 5, name: 'Boss: 关羽', difficulty: 22.0, waves: [19], isBoss: true }
    ]
  },

  // 第五章：决战五丈原（通关第四章解锁）
  {
    id: 5, name: '决战五丈原', description: '全兵种倾巢而出，决一死战！',
    unlockCondition: { chapter: 4 },
    bossName: '司马懿', bossSkill: '分身术',
    stages: [
      { stage: 1, name: '精锐合围', difficulty: 25.0, waves: [18, 19] },
      { stage: 2, name: '铁壁攻防', difficulty: 30.0, waves: [19, 20] },
      { stage: 3, name: '孤城血战', difficulty: 35.0, waves: [17, 18, 19] },
      { stage: 4, name: '天命之战', difficulty: 42.0, waves: [19, 20] },
      { stage: 5, name: 'Boss: 司马懿', difficulty: 50.0, waves: [20], isBoss: true }
    ]
  }
];

// ============================================================
//  主城等级 → 防御塔容量 — 保持不变
// ============================================================
// town_hall Lv3 解锁城防，每升一级多3个塔位
var TDTowerCapacity = {
  3: 8, 4: 11, 5: 14, 6: 17, 7: 20, 8: 23, 9: 26, 10: 30
};

// ============================================================
//  NPC 战时台词
// ============================================================
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
  '报——！敌军压境！',
  '将军，敌人攻城了！',
  '弓箭手准备！',
  '放箭！放箭！'
];

// ============================================================
//  TD 增强系统常量
// ============================================================
var TD_ENHANCEMENT = {
  // §1 武将技能蓄力
  SKILL_CHARGE: {
    BASE_CHARGE_TIME: 10,
    MANUAL_SKILL_BONUS: 1.5,
    AUTO_RELEASE_TIMEOUT: 5,
    MAX_CD_REDUCTION: 0.5
  },
  // §2 紧急技能
  EMERGENCY_SKILLS: {
    ARROW_RAIN:    { id: 'arrow_rain',    name: '万箭齐发', hpRatio: 0.25, cooldown: 75 },
    BATTLE_CHARGE: { id: 'battle_charge', name: '擂鼓助威', aspdMultiplier: 1.5, duration: 8, cooldown: 75 },
    IRON_WALL:     { id: 'iron_wall',     name: '金城汤池', wallInvincibleDuration: 5, townhallHealRatio: 0.15, cooldown: 75 }
  },
  // §3 体力系统
  STAMINA: {
    MAX: 12,
    COST_NORMAL: 1,
    COST_PRACTICE: 0,
    RECOVER_INTERVAL_MIN: 25,
    RECOVER_AMOUNT: 1
  },
  // §4 练习模式
  PRACTICE: {
    REWARD_RATIO: 0.25,
    EQUIP_DROP: false,
    JADE_DROP: false,
    PROGRESS_UPDATE: false
  },
  // §5 飘字
  DAMAGE_TEXT: {
    MERGE_WINDOW: 0.3,
    MAX_ONSCREEN: 15,
    DURATION: 0.8,
    FLOAT_DISTANCE: 30,
    RANDOM_OFFSET_X: 8
  },
  // §6 连杀
  KILL_STREAK: {
    WINDOW: 4,
    LEVELS: [
      { kills: 2,  name: '双杀',     text: '双杀！',     color: '#FFFFFF', fontSize: 24, goldBonus: 0.05 },
      { kills: 3,  name: '三连杀',   text: '三连杀！',   color: '#FFD700', fontSize: 28, goldBonus: 0.10 },
      { kills: 5,  name: '五连绝杀', text: '五连绝杀！', color: '#FF8C00', fontSize: 32, goldBonus: 0.15 },
      { kills: 8,  name: '杀神降临', text: '杀神降临！', color: '#FF0000', fontSize: 36, goldBonus: 0.20 },
      { kills: 12, name: '万夫莫敌', text: '万夫莫敌！', color: '#FFD700', fontSize: 40, goldBonus: 0.30 }
    ]
  },
  // §10 速度倍率
  SPEED: {
    LEVELS: [1.0, 2.0, 3.0],
    DEFAULT_INDEX: 0,
    MAX_SCALED_DELTA: 0.1
  }
};

// ============================================================
//  塔进化数据（Phase 3 预置）
// ============================================================
var TDEvolutionData = {
  td_arrow_tower: {
    pathA: {
      id: 'td_arrow_sharpshooter', name: '神射塔',
      atk: 60, range: 5.5, attackSpeed: 1.0,
      special: 'priority_boss',
      cost: { gold: 500, wood: 150 }
    },
    pathB: {
      id: 'td_arrow_storm', name: '箭雨塔',
      atk: 25, range: 3.5, attackSpeed: 1.5,
      special: 'splash_1.0',
      cost: { gold: 500, wood: 150 }
    }
  },
  td_crossbow: {
    pathA: {
      id: 'td_crossbow_piercer', name: '穿甲弩',
      atk: 140, range: 5.0, attackSpeed: 0.35,
      special: 'ignore_def',
      cost: { gold: 2000, wood: 300, iron: 100 }
    },
    pathB: {
      id: 'td_crossbow_multi', name: '连弩车',
      atk: 65, range: 4.5, attackSpeed: 0.5,
      special: 'multi_3',
      cost: { gold: 2000, wood: 300, iron: 100 }
    }
  },
  td_catapult: {
    pathA: {
      id: 'td_catapult_flame', name: '烈焰石',
      atk: 180, range: 5.5, attackSpeed: 0.25,
      special: 'splash_2.0_burn_5s_15dps',
      cost: { gold: 3000, wood: 400, stone: 300 }
    },
    pathB: {
      id: 'td_catapult_quake', name: '震天锤',
      atk: 200, range: 5.0, attackSpeed: 0.20,
      special: 'splash_1.5_stun_2s',
      cost: { gold: 3000, wood: 400, stone: 300 }
    }
  },
  td_oil_tower: {
    pathA: {
      id: 'td_oil_inferno', name: '天火塔',
      atk: 90, range: 3.0, attackSpeed: 0.5,
      special: 'burn_area_5s_20dps',
      cost: { gold: 2500, wood: 250, stone: 200 }
    },
    pathB: {
      id: 'td_oil_poison', name: '毒烟塔',
      atk: 50, range: 3.5, attackSpeed: 0.5,
      special: 'slow_40_def_reduce_25',
      cost: { gold: 2500, wood: 250, stone: 200 }
    }
  },
  td_repeater: {
    pathA: {
      id: 'td_repeater_zhuge', name: '诸葛连弩',
      atk: 25, range: 3.0, attackSpeed: 4.0,
      special: 'multi_4',
      cost: { gold: 3500, wood: 500, iron: 250 }
    },
    pathB: {
      id: 'td_repeater_breaker', name: '破阵弩',
      atk: 60, range: 3.5, attackSpeed: 1.5,
      special: 'pierce_line',
      cost: { gold: 3500, wood: 500, iron: 250 }
    }
  },
  td_beacon: {
    pathA: {
      id: 'td_beacon_eye', name: '天眼台',
      atk: 10, range: 8.0, attackSpeed: 0.5,
      special: 'detect_all_atk_buff_25',
      cost: { gold: 1500, wood: 200, stone: 150 }
    },
    pathB: {
      id: 'td_beacon_command', name: '号令台',
      atk: 10, range: 6.0, attackSpeed: 0.5,
      special: 'detect_aspd_buff_20_hero_cd_15',
      cost: { gold: 1500, wood: 200, stone: 150 }
    }
  }
};

// ============================================================
//  武将羁绊数据（Phase 3 预置）
// ============================================================
var TDBondData = [
  {
    id: 'taoyuan', name: '桃园结义',
    heroes: ['hero_liubei', 'hero_guanyu', 'hero_zhangfei'],
    requiredCount: 3,
    effects: { target: 'bond_heroes', atkBonus: 0.15, defBonus: 0.15, skillCdReduction: 0.20 }
  },
  {
    id: 'wolong', name: '卧龙凤雏',
    heroes: ['hero_zhugeliang', 'hero_pangtong'],
    requiredCount: 2,
    effects: { target: 'all_towers', atkBonus: 0.10, skillRangeBonus: 0.20 }
  },
  {
    id: 'wuhu', name: '五虎上将',
    heroes: ['hero_guanyu', 'hero_zhangfei', 'hero_zhaoyun', 'hero_machao', 'hero_huangzhong'],
    requiredCount: 3,
    effects: { target: 'all_heroes', aspdBonus: 0.25 }
  },
  {
    id: 'hubaoqi', name: '虎豹骑',
    heroes: ['hero_caocao', 'hero_xiahoudun'],
    requiredCount: 2,
    effects: { target: 'all_towers_walls', atkBonus: 0.08, wallHpBonus: 0.20 }
  },
  {
    id: 'jiangdong', name: '江东双璧',
    heroes: ['hero_zhouyu', 'hero_sunce'],
    requiredCount: 2,
    effects: { target: 'fire_towers', fireDmgBonus: 0.30 }
  }
];

// ============================================================
//  Boss 专属技能数据（Phase 3 预置）
// ============================================================
var TDBossSkillData = {
  chapter_1_zhangjiao: {
    id: 'boss_zhangjiao', name: '张角',
    hpMultiplier: 4, atkMultiplier: 2, speed: 0.5,
    skill: {
      type: 'summon', interval: 15,
      summonType: 'td_militia', summonCount: 2,
      summonHpRatio: 0.5, summonAtkRatio: 0.5, maxAlive: 6
    }
  },
  chapter_2_lvbu: {
    id: 'boss_lvbu', name: '吕布',
    hpMultiplier: 6, atkMultiplier: 3, speed: 0.8,
    skill: {
      type: 'charge', interval: 20,
      damageMultiplier: 3, chargeRange: 3,
      ignoreWalls: 1, selfStunDuration: 2
    }
  },
  chapter_3_caocao: {
    id: 'boss_caocao', name: '曹操',
    hpMultiplier: 5, atkMultiplier: 1.5, speed: 0.5,
    skill: {
      type: 'aura', auraRange: 3,
      atkBuff: 0.40, speedBuff: 0.20, persistent: true
    }
  },
  chapter_4_guanyu: {
    id: 'boss_guanyu', name: '关羽',
    hpMultiplier: 5, atkMultiplier: 2.5, speed: 0.6,
    skill: {
      type: 'slash', interval: 12,
      angle: 120, range: 2,
      damageMultiplier: 3, maxHpPercent: 0.30
    }
  },
  chapter_5_simayi: {
    id: 'boss_simayi', name: '司马懿',
    hpMultiplier: 5, atkMultiplier: 2, speed: 0.5,
    skill: {
      type: 'clone', interval: 30,
      cloneCount: 2, cloneHpRatio: 0.40, cloneAtkRatio: 0.60,
      cloneCanUseSkill: false, detectReveal: true
    }
  }
};
