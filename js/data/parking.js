/**
 * 驿站数据表 — 坐骑数据、马厩费用、收入倍率
 */
var ParkingData = {
  nag_horse:   { id: 'nag_horse',   name: '驽马',     emoji: '🐎', tier: 1,  costGold: 200,       costJade: 0,   goldPerHour: 10,    requiredLevel: 1, theme: 'ancient' },
  fine_horse:  { id: 'fine_horse',  name: '良驹',     emoji: '🏇', tier: 2,  costGold: 1000,      costJade: 0,   goldPerHour: 30,    requiredLevel: 1, theme: 'ancient' },
  swift_horse: { id: 'swift_horse', name: '千里马',   emoji: '🐴', tier: 3,  costGold: 5000,      costJade: 0,   goldPerHour: 80,    requiredLevel: 1, theme: 'ancient' },
  red_hare:    { id: 'red_hare',    name: '赤兔',     emoji: '🦄', tier: 4,  costGold: 25000,     costJade: 5,   goldPerHour: 200,   requiredLevel: 1, theme: 'ancient' },
  war_chariot: { id: 'war_chariot', name: '战车',     emoji: '🛞', tier: 5,  costGold: 100000,    costJade: 0,   goldPerHour: 500,   requiredLevel: 2, theme: 'ancient' },
  iron_beast:  { id: 'iron_beast',  name: '铁甲兽',   emoji: '🦏', tier: 6,  costGold: 400000,    costJade: 10,  goldPerHour: 1200,  requiredLevel: 3, theme: 'ancient' },
  dragon_boat: { id: 'dragon_boat', name: '龙舟',     emoji: '🐉', tier: 7,  costGold: 1500000,   costJade: 20,  goldPerHour: 3000,  requiredLevel: 3, theme: 'ancient' },
  phoenix:     { id: 'phoenix',     name: '凤凰',     emoji: '🔥', tier: 8,  costGold: 5000000,   costJade: 50,  goldPerHour: 7000,  requiredLevel: 4, theme: 'mythic' },
  qilin:       { id: 'qilin',       name: '麒麟',     emoji: '✨', tier: 9,  costGold: 20000000,  costJade: 100, goldPerHour: 15000, requiredLevel: 5, theme: 'mythic' },
  dragon:      { id: 'dragon',      name: '应龙',     emoji: '🐲', tier: 10, costGold: 0,         costJade: 500, goldPerHour: 40000, requiredLevel: 5, theme: 'mythic' }
};

/**
 * 马厩解锁费用表（index 0 unused，slot 1~10）
 */
var SLOT_COSTS = [
  null,                          // index 0 unused
  { gold: 0, jade: 0 },         // slot 1 (free)
  { gold: 0, jade: 0 },         // slot 2 (free)
  { gold: 1000, jade: 0 },      // slot 3
  { gold: 5000, jade: 0 },      // slot 4
  { gold: 20000, jade: 0 },     // slot 5
  { gold: 80000, jade: 5 },     // slot 6
  { gold: 250000, jade: 10 },   // slot 7
  { gold: 800000, jade: 20 },   // slot 8
  { gold: 2500000, jade: 50 },  // slot 9
  { gold: 8000000, jade: 100 }  // slot 10
];

/**
 * 驿站建筑等级 → 收入倍率（index 0 = 未建造）
 */
var INCOME_MULTIPLIERS = [0, 1.0, 1.1, 1.25, 1.40, 1.60];

/**
 * 驿站建筑等级 → 最大可购买坐骑 Tier（index 0 = 未建造）
 */
var PARKING_TIER_CAPS = [0, 4, 5, 7, 8, 10];
