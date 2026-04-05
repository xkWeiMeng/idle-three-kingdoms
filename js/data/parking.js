/**
 * 停车场数据表 — 载具数据、车位费用、收入倍率
 */
var ParkingData = {
  nag_horse:   { id: 'nag_horse',   name: '驽马',     emoji: '🐎', tier: 1,  costGold: 200,       costJade: 0,   goldPerHour: 10,    requiredLevel: 1, theme: 'ancient' },
  fine_horse:  { id: 'fine_horse',  name: '良驹',     emoji: '🏇', tier: 2,  costGold: 1000,      costJade: 0,   goldPerHour: 30,    requiredLevel: 1, theme: 'ancient' },
  swift_horse: { id: 'swift_horse', name: '千里马',   emoji: '🐴', tier: 3,  costGold: 5000,      costJade: 0,   goldPerHour: 80,    requiredLevel: 1, theme: 'ancient' },
  red_hare:    { id: 'red_hare',    name: '赤兔',     emoji: '🦄', tier: 4,  costGold: 25000,     costJade: 5,   goldPerHour: 200,   requiredLevel: 1, theme: 'ancient' },
  bicycle:     { id: 'bicycle',     name: '自行车',   emoji: '🚲', tier: 5,  costGold: 100000,    costJade: 0,   goldPerHour: 500,   requiredLevel: 2, theme: 'modern' },
  motorcycle:  { id: 'motorcycle',  name: '摩托车',   emoji: '🏍', tier: 6,  costGold: 400000,    costJade: 10,  goldPerHour: 1200,  requiredLevel: 3, theme: 'modern' },
  sedan:       { id: 'sedan',       name: '轿车',     emoji: '🚗', tier: 7,  costGold: 1500000,   costJade: 20,  goldPerHour: 3000,  requiredLevel: 3, theme: 'modern' },
  sports_car:  { id: 'sports_car',  name: '跑车',     emoji: '🏎', tier: 8,  costGold: 5000000,   costJade: 50,  goldPerHour: 7000,  requiredLevel: 4, theme: 'modern' },
  supercar:    { id: 'supercar',    name: '超跑',     emoji: '🚀', tier: 9,  costGold: 20000000,  costJade: 100, goldPerHour: 15000, requiredLevel: 5, theme: 'modern' },
  golden_car:  { id: 'golden_car',  name: '黄金跑车', emoji: '👑', tier: 10, costGold: 0,         costJade: 500, goldPerHour: 40000, requiredLevel: 5, theme: 'modern' }
};

/**
 * 车位解锁费用表（index 0 unused，slot 1~10）
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
 * 停车场建筑等级 → 收入倍率（index 0 = 未建造）
 */
var INCOME_MULTIPLIERS = [0, 1.0, 1.1, 1.25, 1.40, 1.60];

/**
 * 停车场建筑等级 → 最大可购买载具 Tier（index 0 = 未建造）
 */
var PARKING_TIER_CAPS = [0, 4, 5, 7, 8, 10];
