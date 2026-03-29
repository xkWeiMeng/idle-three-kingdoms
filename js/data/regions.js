/**
 * 冒险区域数据表
 * 5 个区域对应 5 个章节，不同区域有不同资源侧重
 */
var RegionData = [
  {
    id: 'region_1',
    name: '城外平原',
    emoji: '🌿',
    chapter: 1,
    description: '适合采集木材，敌人较弱',
    unlockCondition: null,
    resourceMultipliers: { gold: 1.0, exp: 1.0, wood: 1.5, stone: 0.8, iron: 0.3 },
    equipDropMultiplier: 1.0,
    bgColor: '#2d5a27'
  },
  {
    id: 'region_2',
    name: '山间要塞',
    emoji: '⛰',
    chapter: 2,
    description: '矿山与要塞，石材和铁矿丰富',
    unlockCondition: 'stage_1_10',
    resourceMultipliers: { gold: 0.8, exp: 1.0, wood: 0.5, stone: 1.5, iron: 1.2 },
    equipDropMultiplier: 1.0,
    bgColor: '#4a4a5a'
  },
  {
    id: 'region_3',
    name: '水乡城镇',
    emoji: '🏘',
    chapter: 3,
    description: '江南水乡，金币和经验收益高',
    unlockCondition: 'stage_2_10',
    resourceMultipliers: { gold: 1.5, exp: 1.2, wood: 0.8, stone: 0.5, iron: 0.5 },
    equipDropMultiplier: 1.2,
    bgColor: '#1a4a6a'
  },
  {
    id: 'region_4',
    name: '荒漠边境',
    emoji: '🏜',
    chapter: 4,
    description: '西域荒漠，铁矿丰富，有稀有装备',
    unlockCondition: 'stage_3_10',
    resourceMultipliers: { gold: 1.0, exp: 1.0, wood: 0.3, stone: 0.8, iron: 1.5 },
    equipDropMultiplier: 1.5,
    bgColor: '#6a5a2a'
  },
  {
    id: 'region_5',
    name: '帝都皇城',
    emoji: '🏯',
    chapter: 5,
    description: '洛阳皇城，全资源均衡且丰厚',
    unlockCondition: 'stage_4_10',
    resourceMultipliers: { gold: 1.2, exp: 1.3, wood: 1.0, stone: 1.0, iron: 1.0 },
    equipDropMultiplier: 1.8,
    bgColor: '#5a1a2a'
  }
];
