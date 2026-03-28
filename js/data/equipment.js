/**
 * 装备数据表
 * 4 types × 5 qualities = 20 templates
 */
const EquipmentData = [
  // ========== 武器 (weapon) — primary stat: atk ==========
  {
    id: 'equip_iron_sword',
    name: '铁剑',
    type: 'weapon',
    quality: 1,
    statType: 'atk',
    statRange: [3, 8],
    description: '普通的铁剑，聊胜于无',
    emoji: '🗡️'
  },
  {
    id: 'equip_green_blade',
    name: '碧刃',
    type: 'weapon',
    quality: 2,
    statType: 'atk',
    statRange: [8, 15],
    description: '泛着绿光的利刃',
    emoji: '⚔️'
  },
  {
    id: 'equip_blue_spear',
    name: '霜寒枪',
    type: 'weapon',
    quality: 3,
    statType: 'atk',
    statRange: [15, 25],
    description: '枪尖凝霜，寒气逼人',
    emoji: '🔱'
  },
  {
    id: 'equip_purple_bow',
    name: '落日弓',
    type: 'weapon',
    quality: 4,
    statType: 'atk',
    statRange: [25, 40],
    description: '夕阳余晖凝聚的弓',
    emoji: '🏹'
  },
  {
    id: 'equip_gold_halberd',
    name: '方天画戟(复刻版)',
    type: 'weapon',
    quality: 5,
    statType: 'atk',
    statRange: [40, 60],
    description: '吕布同款限量复刻',
    emoji: '🔥'
  },

  // ========== 防具 (armor) — primary stat: def ==========
  {
    id: 'equip_cloth_armor',
    name: '布衣',
    type: 'armor',
    quality: 1,
    statType: 'def',
    statRange: [3, 8],
    description: '比没穿好一点点',
    emoji: '👕'
  },
  {
    id: 'equip_leather_armor',
    name: '皮甲',
    type: 'armor',
    quality: 2,
    statType: 'def',
    statRange: [8, 15],
    description: '耐用的皮革护甲',
    emoji: '🦺'
  },
  {
    id: 'equip_chain_mail',
    name: '锁子甲',
    type: 'armor',
    quality: 3,
    statType: 'def',
    statRange: [15, 25],
    description: '铁环编织的防御',
    emoji: '⛓️'
  },
  {
    id: 'equip_plate_armor',
    name: '玄铁重甲',
    type: 'armor',
    quality: 4,
    statType: 'def',
    statRange: [25, 40],
    description: '坚不可摧的铠甲',
    emoji: '🛡️'
  },
  {
    id: 'equip_dragon_armor',
    name: '龙鳞铠',
    type: 'armor',
    quality: 5,
    statType: 'def',
    statRange: [40, 60],
    description: '传说中龙鳞锻造',
    emoji: '🐉'
  },

  // ========== 饰品 (accessory) — primary stat: hp ==========
  {
    id: 'equip_jade_pendant',
    name: '碎玉佩',
    type: 'accessory',
    quality: 1,
    statType: 'hp',
    statRange: [15, 40],
    description: '碎了一半的玉佩',
    emoji: '💎'
  },
  {
    id: 'equip_silver_ring',
    name: '银戒指',
    type: 'accessory',
    quality: 2,
    statType: 'hp',
    statRange: [40, 75],
    description: '刻着奇怪花纹',
    emoji: '💍'
  },
  {
    id: 'equip_gold_belt',
    name: '黄金腰带',
    type: 'accessory',
    quality: 3,
    statType: 'hp',
    statRange: [75, 125],
    description: '有钱人的腰带',
    emoji: '👑'
  },
  {
    id: 'equip_ancient_seal',
    name: '传国玉玺(仿品)',
    type: 'accessory',
    quality: 4,
    statType: 'hp',
    statRange: [125, 200],
    description: '"受命于天"',
    emoji: '📜'
  },
  {
    id: 'equip_phoenix_plume',
    name: '凤羽冠',
    type: 'accessory',
    quality: 5,
    statType: 'hp',
    statRange: [200, 300],
    description: '凤凰羽毛编织',
    emoji: '🦚'
  },

  // ========== 坐骑 (mount) — primary stat: spd ==========
  {
    id: 'equip_donkey',
    name: '小毛驴',
    type: 'mount',
    quality: 1,
    statType: 'spd',
    statRange: [2, 5],
    description: '慢但忠诚',
    emoji: '🫏'
  },
  {
    id: 'equip_horse',
    name: '战马',
    type: 'mount',
    quality: 2,
    statType: 'spd',
    statRange: [5, 10],
    description: '标准坐骑',
    emoji: '🐴'
  },
  {
    id: 'equip_warhorse',
    name: '影驹',
    type: 'mount',
    quality: 3,
    statType: 'spd',
    statRange: [10, 16],
    description: '跑得飞快',
    emoji: '🏇'
  },
  {
    id: 'equip_shadow',
    name: '的卢马',
    type: 'mount',
    quality: 4,
    statType: 'spd',
    statRange: [16, 25],
    description: '妨不妨主另说',
    emoji: '🐎'
  },
  {
    id: 'equip_red_hare',
    name: '赤兔马',
    type: 'mount',
    quality: 5,
    statType: 'spd',
    statRange: [25, 35],
    description: '千里追风',
    emoji: '🔴'
  }
];

// Equipment max reinforcement level by quality
const EquipMaxLevel = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 25 };

// Equipment sell price: quality × 50
const EquipSellPrice = { 1: 50, 2: 100, 3: 150, 4: 200, 5: 250 };

// Equipment type to stat mapping
const EquipTypeToStat = {
  weapon: 'atk',
  armor: 'def',
  accessory: 'hp',
  mount: 'spd'
};
