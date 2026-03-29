/**
 * 关卡 / 副本数据表
 * 50个关卡，5章×10关
 * 敌人数值 = 基础值 × 章节系数 × 关卡系数 [× Boss系数2.0]
 */
const StageData = [

  // ===== 第一章：外卖风云 =====
  {
    id: 'stage_1_1',
    chapter: 1,
    stage: 1,
    name: '外卖总部门口',
    description: '新手骑手在总部外集结，准备迎接第一波挑战',
    isBoss: false,
    enemies: [
      { id: 'mob_1_1_1', name: '暴躁骑手', atk: 12, def: 6, hp: 80, spd: 15, skill: null },
      { id: 'mob_1_1_2', name: '闯红灯飞侠', atk: 12, def: 6, hp: 80, spd: 15, skill: null },
      { id: 'mob_1_1_3', name: '超时差评怪', atk: 12, def: 6, hp: 80, spd: 15, skill: null }
    ],
    rewards: {
      gold: 50,
      exp: 30,
      food: 3,
      wood: 7,
      stone: 4,
      iron: 1,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 }
    },
    foodCost: 2,
    unlockCondition: null,
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_1_2',
    chapter: 1,
    stage: 2,
    name: '暴雨中的街道',
    description: '暴雨天气依然要准时送达，恶劣环境下的考验',
    isBoss: false,
    enemies: [
      { id: 'mob_1_2_1', name: '催单达人', atk: 13, def: 6, hp: 92, spd: 15, skill: null },
      { id: 'mob_1_2_2', name: '恶评客户', atk: 13, def: 6, hp: 92, spd: 15, skill: null },
      { id: 'mob_1_2_3', name: '外卖箱战士', atk: 13, def: 6, hp: 92, spd: 15, skill: null }
    ],
    rewards: {
      gold: 60,
      exp: 36,
      food: 3,
      wood: 9,
      stone: 4,
      iron: 1,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 }
    },
    foodCost: 2,
    unlockCondition: 'stage_1_1',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_1_3',
    chapter: 1,
    stage: 3,
    name: '电梯故障大楼',
    description: '电梯坏了只能爬楼，体力与意志的较量',
    isBoss: false,
    enemies: [
      { id: 'mob_1_3_1', name: '电瓶车狂人', atk: 15, def: 7, hp: 104, spd: 15, skill: null },
      { id: 'mob_1_3_2', name: '逆行骑士', atk: 15, def: 7, hp: 104, spd: 15, skill: null },
      { id: 'mob_1_3_3', name: '暴躁骑手', atk: 15, def: 7, hp: 104, spd: 15, skill: null }
    ],
    rewards: {
      gold: 70,
      exp: 42,
      food: 3,
      wood: 10,
      stone: 5,
      iron: 2,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 }
    },
    foodCost: 2,
    unlockCondition: 'stage_1_2',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_1_4',
    chapter: 1,
    stage: 4,
    name: '差评重灾区',
    description: '这片区域差评率极高，愤怒的客户随时出没',
    isBoss: false,
    enemies: [
      { id: 'mob_1_4_1', name: '闯红灯飞侠', atk: 17, def: 8, hp: 116, spd: 15, skill: null },
      { id: 'mob_1_4_2', name: '超时差评怪', atk: 17, def: 8, hp: 116, spd: 15, skill: null },
      { id: 'mob_1_4_3', name: '催单达人', atk: 17, def: 8, hp: 116, spd: 15, skill: null }
    ],
    rewards: {
      gold: 80,
      exp: 48,
      food: 3,
      wood: 12,
      stone: 6,
      iron: 2,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 }
    },
    foodCost: 2,
    unlockCondition: 'stage_1_3',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_1_5',
    chapter: 1,
    stage: 5,
    name: '配送站争夺战',
    description: '争夺配送站的控制权，精英骑手出现了',
    isBoss: false,
    enemies: [
      { id: 'mob_1_5_1', name: '恶评客户', atk: 19, def: 9, hp: 128, spd: 15, skill: null },
      { id: 'mob_1_5_2', name: '外卖箱战士', atk: 19, def: 9, hp: 128, spd: 15, skill: null },
      { id: 'mob_1_5_3', name: '配送站站长', atk: 28, def: 16, hp: 224, spd: 18, skill: null }
    ],
    rewards: {
      gold: 90,
      exp: 54,
      food: 3,
      wood: 13,
      stone: 7,
      iron: 2,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 }
    },
    foodCost: 2,
    unlockCondition: 'stage_1_4',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_1_6',
    chapter: 1,
    stage: 6,
    name: '高峰期商业街',
    description: '午高峰订单爆炸，混乱的商业街',
    isBoss: false,
    enemies: [
      { id: 'mob_1_6_1', name: '逆行骑士', atk: 21, def: 10, hp: 140, spd: 15, skill: null },
      { id: 'mob_1_6_2', name: '暴躁骑手', atk: 21, def: 10, hp: 140, spd: 15, skill: null },
      { id: 'mob_1_6_3', name: '闯红灯飞侠', atk: 21, def: 10, hp: 140, spd: 15, skill: null },
      { id: 'mob_1_6_4', name: '超时差评怪', atk: 21, def: 10, hp: 140, spd: 15, skill: null }
    ],
    rewards: {
      gold: 100,
      exp: 60,
      food: 3,
      wood: 15,
      stone: 8,
      iron: 3,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 }
    },
    foodCost: 2,
    unlockCondition: 'stage_1_5',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_1_7',
    chapter: 1,
    stage: 7,
    name: '封路的工地旁',
    description: '绕路配送的噩梦，到处都是障碍',
    isBoss: false,
    enemies: [
      { id: 'mob_1_7_1', name: '超时差评怪', atk: 22, def: 11, hp: 152, spd: 15, skill: null },
      { id: 'mob_1_7_2', name: '催单达人', atk: 22, def: 11, hp: 152, spd: 15, skill: null },
      { id: 'mob_1_7_3', name: '恶评客户', atk: 22, def: 11, hp: 152, spd: 15, skill: null },
      { id: 'mob_1_7_4', name: '外卖箱战士', atk: 22, def: 11, hp: 152, spd: 15, skill: null }
    ],
    rewards: {
      gold: 110,
      exp: 66,
      food: 3,
      wood: 16,
      stone: 8,
      iron: 3,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 }
    },
    foodCost: 2,
    unlockCondition: 'stage_1_6',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_1_8',
    chapter: 1,
    stage: 8,
    name: '美食街混战',
    description: '多个骑手争抢订单，美食街乱成一团',
    isBoss: false,
    enemies: [
      { id: 'mob_1_8_1', name: '外卖箱战士', atk: 24, def: 12, hp: 164, spd: 15, skill: null },
      { id: 'mob_1_8_2', name: '电瓶车狂人', atk: 24, def: 12, hp: 164, spd: 15, skill: null },
      { id: 'mob_1_8_3', name: '逆行骑士', atk: 24, def: 12, hp: 164, spd: 15, skill: null },
      { id: 'mob_1_8_4', name: '配送站站长', atk: 36, def: 20, hp: 287, spd: 18, skill: null }
    ],
    rewards: {
      gold: 120,
      exp: 72,
      food: 3,
      wood: 18,
      stone: 9,
      iron: 3,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 }
    },
    foodCost: 2,
    unlockCondition: 'stage_1_7',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_1_9',
    chapter: 1,
    stage: 9,
    name: '总部地下车库',
    description: '接近终极对决，精锐骑手把守车库',
    isBoss: false,
    enemies: [
      { id: 'mob_1_9_1', name: '暴躁骑手', atk: 26, def: 13, hp: 176, spd: 15, skill: null },
      { id: 'mob_1_9_2', name: '闯红灯飞侠', atk: 26, def: 13, hp: 176, spd: 15, skill: null },
      { id: 'mob_1_9_3', name: '超时差评怪', atk: 26, def: 13, hp: 176, spd: 15, skill: null },
      { id: 'mob_1_9_4', name: '区域督导', atk: 39, def: 22, hp: 308, spd: 18, skill: null }
    ],
    rewards: {
      gold: 130,
      exp: 78,
      food: 3,
      wood: 19,
      stone: 10,
      iron: 3,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 }
    },
    foodCost: 2,
    unlockCondition: 'stage_1_8',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_1_10',
    chapter: 1,
    stage: 10,
    name: '外卖帝国总部',
    description: '击败外卖帝王，夺取外卖行业的控制权',
    isBoss: true,
    enemies: [
      { id: 'mob_1_10_1', name: '外卖帝王', atk: 117, def: 70, hp: 1409, spd: 20, skill: { name: '极速快递终极版', type: 'damage', multiplier: 2.0, target: 'all', cd: 3 } }
    ],
    rewards: {
      gold: 140,
      exp: 84,
      food: 5,
      wood: 21,
      stone: 11,
      iron: 4,
      equipDropRate: 1,
      equipQualityWeights: { 1: 50, 2: 35, 3: 13, 4: 2, 5: 0 }
    },
    foodCost: 2,
    unlockCondition: 'stage_1_9',
    firstClearReward: {
      jade: 30,
      hero: null
    }
  },

  // ===== 第二章：草鞋争霸 =====
  {
    id: 'stage_2_1',
    chapter: 2,
    stage: 1,
    name: '小型仓库',
    description: '从小仓库起步，推销员们蠢蠢欲动',
    isBoss: false,
    enemies: [
      { id: 'mob_2_1_1', name: '疯狂推销员', atk: 21, def: 10, hp: 144, spd: 15, skill: null },
      { id: 'mob_2_1_2', name: '快递打包工', atk: 21, def: 10, hp: 144, spd: 15, skill: null },
      { id: 'mob_2_1_3', name: '仓库搬运工', atk: 21, def: 10, hp: 144, spd: 15, skill: null }
    ],
    rewards: {
      gold: 150,
      exp: 90,
      food: 4,
      wood: 12,
      stone: 22,
      iron: 9,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 35, 2: 35, 3: 22, 4: 7, 5: 1 }
    },
    foodCost: 3,
    unlockCondition: 'stage_1_10',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_2_2',
    chapter: 2,
    stage: 2,
    name: '退货处理中心',
    description: '堆积如山的退货，处理中心一片混乱',
    isBoss: false,
    enemies: [
      { id: 'mob_2_2_1', name: '刷单水军', atk: 24, def: 12, hp: 165, spd: 15, skill: null },
      { id: 'mob_2_2_2', name: '退货狂魔', atk: 24, def: 12, hp: 165, spd: 15, skill: null },
      { id: 'mob_2_2_3', name: '客服机器人', atk: 24, def: 12, hp: 165, spd: 15, skill: null }
    ],
    rewards: {
      gold: 160,
      exp: 96,
      food: 4,
      wood: 12,
      stone: 24,
      iron: 9,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 35, 2: 35, 3: 22, 4: 7, 5: 1 }
    },
    foodCost: 3,
    unlockCondition: 'stage_2_1',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_2_3',
    chapter: 2,
    stage: 3,
    name: '直播选品间',
    description: '选品大战愈演愈烈，各方势力角逐',
    isBoss: false,
    enemies: [
      { id: 'mob_2_3_1', name: '比价专员', atk: 28, def: 14, hp: 187, spd: 15, skill: null },
      { id: 'mob_2_3_2', name: '砍价高手', atk: 28, def: 14, hp: 187, spd: 15, skill: null },
      { id: 'mob_2_3_3', name: '疯狂推销员', atk: 28, def: 14, hp: 187, spd: 15, skill: null }
    ],
    rewards: {
      gold: 170,
      exp: 102,
      food: 4,
      wood: 13,
      stone: 25,
      iron: 10,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 35, 2: 35, 3: 22, 4: 7, 5: 1 }
    },
    foodCost: 3,
    unlockCondition: 'stage_2_2',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_2_4',
    chapter: 2,
    stage: 4,
    name: '价格战前线',
    description: '疯狂降价竞争，利润被压到极限',
    isBoss: false,
    enemies: [
      { id: 'mob_2_4_1', name: '快递打包工', atk: 31, def: 15, hp: 208, spd: 15, skill: null },
      { id: 'mob_2_4_2', name: '仓库搬运工', atk: 31, def: 15, hp: 208, spd: 15, skill: null },
      { id: 'mob_2_4_3', name: '刷单水军', atk: 31, def: 15, hp: 208, spd: 15, skill: null }
    ],
    rewards: {
      gold: 180,
      exp: 108,
      food: 4,
      wood: 14,
      stone: 27,
      iron: 10,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 35, 2: 35, 3: 22, 4: 7, 5: 1 }
    },
    foodCost: 3,
    unlockCondition: 'stage_2_3',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_2_5',
    chapter: 2,
    stage: 5,
    name: '物流枢纽站',
    description: '控制物流命脉，精英管理层出现',
    isBoss: false,
    enemies: [
      { id: 'mob_2_5_1', name: '退货狂魔', atk: 34, def: 17, hp: 230, spd: 15, skill: null },
      { id: 'mob_2_5_2', name: '客服机器人', atk: 34, def: 17, hp: 230, spd: 15, skill: null },
      { id: 'mob_2_5_3', name: '仓库主管', atk: 51, def: 28, hp: 403, spd: 18, skill: null }
    ],
    rewards: {
      gold: 190,
      exp: 114,
      food: 4,
      wood: 15,
      stone: 28,
      iron: 11,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 35, 2: 35, 3: 22, 4: 7, 5: 1 }
    },
    foodCost: 3,
    unlockCondition: 'stage_2_4',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_2_6',
    chapter: 2,
    stage: 6,
    name: '双十一备战区',
    description: '大促前的疯狂备货，仓库人满为患',
    isBoss: false,
    enemies: [
      { id: 'mob_2_6_1', name: '砍价高手', atk: 37, def: 18, hp: 252, spd: 15, skill: null },
      { id: 'mob_2_6_2', name: '疯狂推销员', atk: 37, def: 18, hp: 252, spd: 15, skill: null },
      { id: 'mob_2_6_3', name: '快递打包工', atk: 37, def: 18, hp: 252, spd: 15, skill: null },
      { id: 'mob_2_6_4', name: '仓库搬运工', atk: 37, def: 18, hp: 252, spd: 15, skill: null }
    ],
    rewards: {
      gold: 200,
      exp: 120,
      food: 4,
      wood: 16,
      stone: 30,
      iron: 12,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 35, 2: 35, 3: 22, 4: 7, 5: 1 }
    },
    foodCost: 3,
    unlockCondition: 'stage_2_5',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_2_7',
    chapter: 2,
    stage: 7,
    name: '刷单工厂',
    description: '虚假销量的巢穴，水军横行',
    isBoss: false,
    enemies: [
      { id: 'mob_2_7_1', name: '仓库搬运工', atk: 41, def: 20, hp: 273, spd: 15, skill: null },
      { id: 'mob_2_7_2', name: '刷单水军', atk: 41, def: 20, hp: 273, spd: 15, skill: null },
      { id: 'mob_2_7_3', name: '退货狂魔', atk: 41, def: 20, hp: 273, spd: 15, skill: null },
      { id: 'mob_2_7_4', name: '客服机器人', atk: 41, def: 20, hp: 273, spd: 15, skill: null }
    ],
    rewards: {
      gold: 210,
      exp: 126,
      food: 4,
      wood: 16,
      stone: 31,
      iron: 12,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 35, 2: 35, 3: 22, 4: 7, 5: 1 }
    },
    foodCost: 3,
    unlockCondition: 'stage_2_6',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_2_8',
    chapter: 2,
    stage: 8,
    name: '供应链总部',
    description: '掌控供应链的关键据点',
    isBoss: false,
    enemies: [
      { id: 'mob_2_8_1', name: '客服机器人', atk: 44, def: 22, hp: 295, spd: 15, skill: null },
      { id: 'mob_2_8_2', name: '比价专员', atk: 44, def: 22, hp: 295, spd: 15, skill: null },
      { id: 'mob_2_8_3', name: '砍价高手', atk: 44, def: 22, hp: 295, spd: 15, skill: null },
      { id: 'mob_2_8_4', name: '仓库主管', atk: 66, def: 36, hp: 516, spd: 18, skill: null }
    ],
    rewards: {
      gold: 220,
      exp: 132,
      food: 4,
      wood: 17,
      stone: 33,
      iron: 13,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 35, 2: 35, 3: 22, 4: 7, 5: 1 }
    },
    foodCost: 3,
    unlockCondition: 'stage_2_7',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_2_9',
    chapter: 2,
    stage: 9,
    name: '电商总部大楼',
    description: '最终决战前夕，精锐尽出',
    isBoss: false,
    enemies: [
      { id: 'mob_2_9_1', name: '疯狂推销员', atk: 47, def: 23, hp: 316, spd: 15, skill: null },
      { id: 'mob_2_9_2', name: '快递打包工', atk: 47, def: 23, hp: 316, spd: 15, skill: null },
      { id: 'mob_2_9_3', name: '仓库搬运工', atk: 47, def: 23, hp: 316, spd: 15, skill: null },
      { id: 'mob_2_9_4', name: '物流总监', atk: 71, def: 39, hp: 554, spd: 18, skill: null }
    ],
    rewards: {
      gold: 229,
      exp: 138,
      food: 4,
      wood: 18,
      stone: 34,
      iron: 13,
      equipDropRate: 0.15,
      equipQualityWeights: { 1: 35, 2: 35, 3: 22, 4: 7, 5: 1 }
    },
    foodCost: 3,
    unlockCondition: 'stage_2_8',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_2_10',
    chapter: 2,
    stage: 10,
    name: '草鞋帝国王座',
    description: '击败草鞋帝王，终结电商乱局',
    isBoss: true,
    enemies: [
      { id: 'mob_2_10_1', name: '草鞋帝王', atk: 211, def: 126, hp: 2537, spd: 20, skill: { name: '限时秒杀暴击', type: 'damage', multiplier: 3.0, target: 'single', cd: 4 } }
    ],
    rewards: {
      gold: 240,
      exp: 144,
      food: 6,
      wood: 19,
      stone: 36,
      iron: 14,
      equipDropRate: 1,
      equipQualityWeights: { 1: 35, 2: 35, 3: 22, 4: 7, 5: 1 }
    },
    foodCost: 3,
    unlockCondition: 'stage_2_9',
    firstClearReward: {
      jade: 30,
      hero: null
    }
  },

  // ===== 第三章：直播大战 =====
  {
    id: 'stage_3_1',
    chapter: 3,
    stage: 1,
    name: '小主播工作室',
    description: '从零开始的直播之路，小喽啰出没',
    isBoss: false,
    enemies: [
      { id: 'mob_3_1_1', name: '键盘侠', atk: 31, def: 15, hp: 208, spd: 15, skill: null },
      { id: 'mob_3_1_2', name: '弹幕喷子', atk: 31, def: 15, hp: 208, spd: 15, skill: null },
      { id: 'mob_3_1_3', name: '疯狂粉丝', atk: 31, def: 15, hp: 208, spd: 15, skill: null }
    ],
    rewards: {
      gold: 250,
      exp: 150,
      food: 5,
      wood: 25,
      stone: 25,
      iron: 20,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 20, 2: 30, 3: 30, 4: 15, 5: 5 }
    },
    foodCost: 4,
    unlockCondition: 'stage_2_10',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_3_2',
    chapter: 3,
    stage: 2,
    name: '弹幕轰炸区',
    description: '铺天盖地的弹幕攻击，目不暇接',
    isBoss: false,
    enemies: [
      { id: 'mob_3_2_1', name: '蹭流量小弟', atk: 35, def: 17, hp: 239, spd: 15, skill: null },
      { id: 'mob_3_2_2', name: '黑粉水军', atk: 35, def: 17, hp: 239, spd: 15, skill: null },
      { id: 'mob_3_2_3', name: '节奏大师', atk: 35, def: 17, hp: 239, spd: 15, skill: null }
    ],
    rewards: {
      gold: 260,
      exp: 156,
      food: 5,
      wood: 26,
      stone: 26,
      iron: 20,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 20, 2: 30, 3: 30, 4: 15, 5: 5 }
    },
    foodCost: 4,
    unlockCondition: 'stage_3_1',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_3_3',
    chapter: 3,
    stage: 3,
    name: '打赏擂台',
    description: '打赏排行榜争夺战，土豪们疯狂刷礼物',
    isBoss: false,
    enemies: [
      { id: 'mob_3_3_1', name: '抢麦选手', atk: 40, def: 20, hp: 270, spd: 15, skill: null },
      { id: 'mob_3_3_2', name: '刷屏机器人', atk: 40, def: 20, hp: 270, spd: 15, skill: null },
      { id: 'mob_3_3_3', name: '键盘侠', atk: 40, def: 20, hp: 270, spd: 15, skill: null }
    ],
    rewards: {
      gold: 270,
      exp: 162,
      food: 5,
      wood: 27,
      stone: 27,
      iron: 21,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 20, 2: 30, 3: 30, 4: 15, 5: 5 }
    },
    foodCost: 4,
    unlockCondition: 'stage_3_2',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_3_4',
    chapter: 3,
    stage: 4,
    name: '蹭流量广场',
    description: '各路蹭流量的人聚集于此',
    isBoss: false,
    enemies: [
      { id: 'mob_3_4_1', name: '弹幕喷子', atk: 45, def: 22, hp: 301, spd: 15, skill: null },
      { id: 'mob_3_4_2', name: '疯狂粉丝', atk: 45, def: 22, hp: 301, spd: 15, skill: null },
      { id: 'mob_3_4_3', name: '蹭流量小弟', atk: 45, def: 22, hp: 301, spd: 15, skill: null }
    ],
    rewards: {
      gold: 280,
      exp: 168,
      food: 5,
      wood: 28,
      stone: 28,
      iron: 22,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 20, 2: 30, 3: 30, 4: 15, 5: 5 }
    },
    foodCost: 4,
    unlockCondition: 'stage_3_3',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_3_5',
    chapter: 3,
    stage: 5,
    name: '公会争霸赛',
    description: '公会之间的激烈对决，精英主播登场',
    isBoss: false,
    enemies: [
      { id: 'mob_3_5_1', name: '黑粉水军', atk: 49, def: 24, hp: 332, spd: 15, skill: null },
      { id: 'mob_3_5_2', name: '节奏大师', atk: 49, def: 24, hp: 332, spd: 15, skill: null },
      { id: 'mob_3_5_3', name: '带货主播', atk: 74, def: 41, hp: 582, spd: 18, skill: null }
    ],
    rewards: {
      gold: 290,
      exp: 174,
      food: 5,
      wood: 29,
      stone: 29,
      iron: 23,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 20, 2: 30, 3: 30, 4: 15, 5: 5 }
    },
    foodCost: 4,
    unlockCondition: 'stage_3_4',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_3_6',
    chapter: 3,
    stage: 6,
    name: '带货直播间',
    description: '带货直播的主战场，竞争白热化',
    isBoss: false,
    enemies: [
      { id: 'mob_3_6_1', name: '刷屏机器人', atk: 54, def: 27, hp: 364, spd: 15, skill: null },
      { id: 'mob_3_6_2', name: '键盘侠', atk: 54, def: 27, hp: 364, spd: 15, skill: null },
      { id: 'mob_3_6_3', name: '弹幕喷子', atk: 54, def: 27, hp: 364, spd: 15, skill: null },
      { id: 'mob_3_6_4', name: '疯狂粉丝', atk: 54, def: 27, hp: 364, spd: 15, skill: null }
    ],
    rewards: {
      gold: 300,
      exp: 180,
      food: 5,
      wood: 30,
      stone: 30,
      iron: 24,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 20, 2: 30, 3: 30, 4: 15, 5: 5 }
    },
    foodCost: 5,
    unlockCondition: 'stage_3_5',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_3_7',
    chapter: 3,
    stage: 7,
    name: '黑粉集结地',
    description: '大量黑粉出没，恶意攻击不断',
    isBoss: false,
    enemies: [
      { id: 'mob_3_7_1', name: '疯狂粉丝', atk: 59, def: 29, hp: 395, spd: 15, skill: null },
      { id: 'mob_3_7_2', name: '蹭流量小弟', atk: 59, def: 29, hp: 395, spd: 15, skill: null },
      { id: 'mob_3_7_3', name: '黑粉水军', atk: 59, def: 29, hp: 395, spd: 15, skill: null },
      { id: 'mob_3_7_4', name: '节奏大师', atk: 59, def: 29, hp: 395, spd: 15, skill: null }
    ],
    rewards: {
      gold: 310,
      exp: 186,
      food: 5,
      wood: 31,
      stone: 31,
      iron: 24,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 20, 2: 30, 3: 30, 4: 15, 5: 5 }
    },
    foodCost: 5,
    unlockCondition: 'stage_3_6',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_3_8',
    chapter: 3,
    stage: 8,
    name: '流量巅峰赛',
    description: '争夺流量之巅，强敌环伺',
    isBoss: false,
    enemies: [
      { id: 'mob_3_8_1', name: '节奏大师', atk: 63, def: 31, hp: 426, spd: 15, skill: null },
      { id: 'mob_3_8_2', name: '抢麦选手', atk: 63, def: 31, hp: 426, spd: 15, skill: null },
      { id: 'mob_3_8_3', name: '刷屏机器人', atk: 63, def: 31, hp: 426, spd: 15, skill: null },
      { id: 'mob_3_8_4', name: '带货主播', atk: 95, def: 53, hp: 746, spd: 18, skill: null }
    ],
    rewards: {
      gold: 320,
      exp: 192,
      food: 5,
      wood: 32,
      stone: 32,
      iron: 25,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 20, 2: 30, 3: 30, 4: 15, 5: 5 }
    },
    foodCost: 5,
    unlockCondition: 'stage_3_7',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_3_9',
    chapter: 3,
    stage: 9,
    name: '平台总控室',
    description: '接近平台核心，精锐守卫森严',
    isBoss: false,
    enemies: [
      { id: 'mob_3_9_1', name: '键盘侠', atk: 68, def: 34, hp: 457, spd: 15, skill: null },
      { id: 'mob_3_9_2', name: '弹幕喷子', atk: 68, def: 34, hp: 457, spd: 15, skill: null },
      { id: 'mob_3_9_3', name: '疯狂粉丝', atk: 68, def: 34, hp: 457, spd: 15, skill: null },
      { id: 'mob_3_9_4', name: '流量达人', atk: 102, def: 57, hp: 800, spd: 18, skill: null }
    ],
    rewards: {
      gold: 330,
      exp: 198,
      food: 5,
      wood: 33,
      stone: 33,
      iron: 26,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 20, 2: 30, 3: 30, 4: 15, 5: 5 }
    },
    foodCost: 5,
    unlockCondition: 'stage_3_8',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_3_10',
    chapter: 3,
    stage: 10,
    name: '直播帝国中心',
    description: '击败直播一姐，称霸直播界',
    isBoss: true,
    enemies: [
      { id: 'mob_3_10_1', name: '直播一姐', atk: 305, def: 183, hp: 3665, spd: 20, skill: { name: '直播打赏回血', type: 'heal', multiplier: 1.5, target: 'self', cd: 3 } }
    ],
    rewards: {
      gold: 340,
      exp: 204,
      food: 7,
      wood: 34,
      stone: 34,
      iron: 27,
      equipDropRate: 1,
      equipQualityWeights: { 1: 20, 2: 30, 3: 30, 4: 15, 5: 5 }
    },
    foodCost: 5,
    unlockCondition: 'stage_3_9',
    firstClearReward: {
      jade: 30,
      hero: null
    }
  },

  // ===== 第四章：健身房保卫战 =====
  {
    id: 'stage_4_1',
    chapter: 4,
    stage: 1,
    name: '新手训练区',
    description: '健身房入口区域，新手学员聚集',
    isBoss: false,
    enemies: [
      { id: 'mob_4_1_1', name: '蛋白粉狂人', atk: 40, def: 20, hp: 272, spd: 15, skill: null },
      { id: 'mob_4_1_2', name: '撸铁猛男', atk: 40, def: 20, hp: 272, spd: 15, skill: null },
      { id: 'mob_4_1_3', name: '跑步机战士', atk: 40, def: 20, hp: 272, spd: 15, skill: null }
    ],
    rewards: {
      gold: 350,
      exp: 210,
      food: 6,
      wood: 21,
      stone: 28,
      iron: 52,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 10, 2: 25, 3: 30, 4: 25, 5: 10 }
    },
    foodCost: 5,
    unlockCondition: 'stage_3_10',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_4_2',
    chapter: 4,
    stage: 2,
    name: '有氧运动区',
    description: '跑步机和椭圆机的领地，耐力型敌人',
    isBoss: false,
    enemies: [
      { id: 'mob_4_2_1', name: '瑜伽达人', atk: 46, def: 23, hp: 312, spd: 15, skill: null },
      { id: 'mob_4_2_2', name: '拳击学员', atk: 46, def: 23, hp: 312, spd: 15, skill: null },
      { id: 'mob_4_2_3', name: '深蹲王者', atk: 46, def: 23, hp: 312, spd: 15, skill: null }
    ],
    rewards: {
      gold: 360,
      exp: 216,
      food: 6,
      wood: 21,
      stone: 28,
      iron: 54,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 10, 2: 25, 3: 30, 4: 25, 5: 10 }
    },
    foodCost: 5,
    unlockCondition: 'stage_4_1',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_4_3',
    chapter: 4,
    stage: 3,
    name: '自由力量区',
    description: '哑铃和杠铃的天下，力量型对手',
    isBoss: false,
    enemies: [
      { id: 'mob_4_3_1', name: '卧推新手', atk: 53, def: 26, hp: 353, spd: 15, skill: null },
      { id: 'mob_4_3_2', name: '引体向上侠', atk: 53, def: 26, hp: 353, spd: 15, skill: null },
      { id: 'mob_4_3_3', name: '蛋白粉狂人', atk: 53, def: 26, hp: 353, spd: 15, skill: null }
    ],
    rewards: {
      gold: 370,
      exp: 222,
      food: 6,
      wood: 22,
      stone: 29,
      iron: 55,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 10, 2: 25, 3: 30, 4: 25, 5: 10 }
    },
    foodCost: 5,
    unlockCondition: 'stage_4_2',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_4_4',
    chapter: 4,
    stage: 4,
    name: '团课教室',
    description: '团体课程的混战，人多势众',
    isBoss: false,
    enemies: [
      { id: 'mob_4_4_1', name: '撸铁猛男', atk: 59, def: 29, hp: 394, spd: 15, skill: null },
      { id: 'mob_4_4_2', name: '跑步机战士', atk: 59, def: 29, hp: 394, spd: 15, skill: null },
      { id: 'mob_4_4_3', name: '瑜伽达人', atk: 59, def: 29, hp: 394, spd: 15, skill: null }
    ],
    rewards: {
      gold: 380,
      exp: 228,
      food: 6,
      wood: 22,
      stone: 30,
      iron: 57,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 10, 2: 25, 3: 30, 4: 25, 5: 10 }
    },
    foodCost: 5,
    unlockCondition: 'stage_4_3',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_4_5',
    chapter: 4,
    stage: 5,
    name: '私教专区',
    description: '私教的领地，精英教练出没',
    isBoss: false,
    enemies: [
      { id: 'mob_4_5_1', name: '拳击学员', atk: 65, def: 32, hp: 435, spd: 15, skill: null },
      { id: 'mob_4_5_2', name: '深蹲王者', atk: 65, def: 32, hp: 435, spd: 15, skill: null },
      { id: 'mob_4_5_3', name: '私教教练', atk: 97, def: 54, hp: 761, spd: 18, skill: null }
    ],
    rewards: {
      gold: 390,
      exp: 234,
      food: 6,
      wood: 23,
      stone: 31,
      iron: 58,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 10, 2: 25, 3: 30, 4: 25, 5: 10 }
    },
    foodCost: 5,
    unlockCondition: 'stage_4_4',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_4_6',
    chapter: 4,
    stage: 6,
    name: '搏击训练场',
    description: '拳击和格斗的战场，凶猛异常',
    isBoss: false,
    enemies: [
      { id: 'mob_4_6_1', name: '引体向上侠', atk: 71, def: 35, hp: 476, spd: 15, skill: null },
      { id: 'mob_4_6_2', name: '蛋白粉狂人', atk: 71, def: 35, hp: 476, spd: 15, skill: null },
      { id: 'mob_4_6_3', name: '撸铁猛男', atk: 71, def: 35, hp: 476, spd: 15, skill: null },
      { id: 'mob_4_6_4', name: '跑步机战士', atk: 71, def: 35, hp: 476, spd: 15, skill: null }
    ],
    rewards: {
      gold: 400,
      exp: 240,
      food: 6,
      wood: 24,
      stone: 32,
      iron: 60,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 10, 2: 25, 3: 30, 4: 25, 5: 10 }
    },
    foodCost: 6,
    unlockCondition: 'stage_4_5',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_4_7',
    chapter: 4,
    stage: 7,
    name: '蛋白粉储藏室',
    description: '能量补给站，狂热的健身者把守',
    isBoss: false,
    enemies: [
      { id: 'mob_4_7_1', name: '跑步机战士', atk: 77, def: 38, hp: 516, spd: 15, skill: null },
      { id: 'mob_4_7_2', name: '瑜伽达人', atk: 77, def: 38, hp: 516, spd: 15, skill: null },
      { id: 'mob_4_7_3', name: '拳击学员', atk: 77, def: 38, hp: 516, spd: 15, skill: null },
      { id: 'mob_4_7_4', name: '深蹲王者', atk: 77, def: 38, hp: 516, spd: 15, skill: null }
    ],
    rewards: {
      gold: 409,
      exp: 245,
      food: 6,
      wood: 24,
      stone: 32,
      iron: 61,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 10, 2: 25, 3: 30, 4: 25, 5: 10 }
    },
    foodCost: 6,
    unlockCondition: 'stage_4_6',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_4_8',
    chapter: 4,
    stage: 8,
    name: '力量举平台',
    description: '大重量的对决，强壮的对手',
    isBoss: false,
    enemies: [
      { id: 'mob_4_8_1', name: '深蹲王者', atk: 83, def: 41, hp: 557, spd: 15, skill: null },
      { id: 'mob_4_8_2', name: '卧推新手', atk: 83, def: 41, hp: 557, spd: 15, skill: null },
      { id: 'mob_4_8_3', name: '引体向上侠', atk: 83, def: 41, hp: 557, spd: 15, skill: null },
      { id: 'mob_4_8_4', name: '私教教练', atk: 125, def: 69, hp: 975, spd: 18, skill: null }
    ],
    rewards: {
      gold: 420,
      exp: 252,
      food: 6,
      wood: 25,
      stone: 33,
      iron: 63,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 10, 2: 25, 3: 30, 4: 25, 5: 10 }
    },
    foodCost: 6,
    unlockCondition: 'stage_4_7',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_4_9',
    chapter: 4,
    stage: 9,
    name: '健身房VIP区',
    description: 'VIP专属区域，精锐健身者驻守',
    isBoss: false,
    enemies: [
      { id: 'mob_4_9_1', name: '蛋白粉狂人', atk: 89, def: 44, hp: 598, spd: 15, skill: null },
      { id: 'mob_4_9_2', name: '撸铁猛男', atk: 89, def: 44, hp: 598, spd: 15, skill: null },
      { id: 'mob_4_9_3', name: '跑步机战士', atk: 89, def: 44, hp: 598, spd: 15, skill: null },
      { id: 'mob_4_9_4', name: '健身网红', atk: 134, def: 74, hp: 1047, spd: 18, skill: null }
    ],
    rewards: {
      gold: 430,
      exp: 258,
      food: 6,
      wood: 25,
      stone: 34,
      iron: 64,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 10, 2: 25, 3: 30, 4: 25, 5: 10 }
    },
    foodCost: 6,
    unlockCondition: 'stage_4_8',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_4_10',
    chapter: 4,
    stage: 10,
    name: '健身帝国擂台',
    description: '击败肌肉巨兽，成为健身之王',
    isBoss: true,
    enemies: [
      { id: 'mob_4_10_1', name: '肌肉巨兽', atk: 399, def: 239, hp: 4794, spd: 20, skill: { name: '健身狂怒', type: 'damage', multiplier: 2.5, target: 'all', cd: 3, effect: { stat: 'def', ratio: -0.2, duration: 2 } } }
    ],
    rewards: {
      gold: 440,
      exp: 264,
      food: 8,
      wood: 26,
      stone: 35,
      iron: 66,
      equipDropRate: 1,
      equipQualityWeights: { 1: 10, 2: 25, 3: 30, 4: 25, 5: 10 }
    },
    foodCost: 6,
    unlockCondition: 'stage_4_9',
    firstClearReward: {
      jade: 30,
      hero: null
    }
  },

  // ===== 第五章：系统修复战 =====
  {
    id: 'stage_5_1',
    chapter: 5,
    stage: 1,
    name: '启动扇区',
    description: '系统启动区域，低级错误出没',
    isBoss: false,
    enemies: [
      { id: 'mob_5_1_1', name: '404错误精灵', atk: 50, def: 25, hp: 336, spd: 15, skill: null },
      { id: 'mob_5_1_2', name: '内存泄漏怪', atk: 50, def: 25, hp: 336, spd: 15, skill: null },
      { id: 'mob_5_1_3', name: '死循环幽灵', atk: 50, def: 25, hp: 336, spd: 15, skill: null }
    ],
    rewards: {
      gold: 450,
      exp: 270,
      food: 7,
      wood: 54,
      stone: 54,
      iron: 54,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
    },
    foodCost: 7,
    unlockCondition: 'stage_4_10',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_5_2',
    chapter: 5,
    stage: 2,
    name: '内存碎片区',
    description: '内存碎片堆积如山，处理器不堪重负',
    isBoss: false,
    enemies: [
      { id: 'mob_5_2_1', name: '空指针异常体', atk: 57, def: 28, hp: 386, spd: 15, skill: null },
      { id: 'mob_5_2_2', name: '缓冲溢出兽', atk: 57, def: 28, hp: 386, spd: 15, skill: null },
      { id: 'mob_5_2_3', name: '蓝屏死机灵', atk: 57, def: 28, hp: 386, spd: 15, skill: null }
    ],
    rewards: {
      gold: 460,
      exp: 276,
      food: 7,
      wood: 55,
      stone: 55,
      iron: 55,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
    },
    foodCost: 7,
    unlockCondition: 'stage_5_1',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_5_3',
    chapter: 5,
    stage: 3,
    name: '注册表迷宫',
    description: '混乱的注册表，到处是错误项',
    isBoss: false,
    enemies: [
      { id: 'mob_5_3_1', name: '段错误妖', atk: 65, def: 32, hp: 436, spd: 15, skill: null },
      { id: 'mob_5_3_2', name: '栈溢出魔', atk: 65, def: 32, hp: 436, spd: 15, skill: null },
      { id: 'mob_5_3_3', name: '404错误精灵', atk: 65, def: 32, hp: 436, spd: 15, skill: null }
    ],
    rewards: {
      gold: 470,
      exp: 282,
      food: 7,
      wood: 56,
      stone: 56,
      iron: 56,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
    },
    foodCost: 7,
    unlockCondition: 'stage_5_2',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_5_4',
    chapter: 5,
    stage: 4,
    name: '临时文件堆场',
    description: '垃圾文件泛滥，占满了存储空间',
    isBoss: false,
    enemies: [
      { id: 'mob_5_4_1', name: '内存泄漏怪', atk: 73, def: 36, hp: 487, spd: 15, skill: null },
      { id: 'mob_5_4_2', name: '死循环幽灵', atk: 73, def: 36, hp: 487, spd: 15, skill: null },
      { id: 'mob_5_4_3', name: '空指针异常体', atk: 73, def: 36, hp: 487, spd: 15, skill: null }
    ],
    rewards: {
      gold: 480,
      exp: 288,
      food: 7,
      wood: 57,
      stone: 57,
      iron: 57,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
    },
    foodCost: 7,
    unlockCondition: 'stage_5_3',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_5_5',
    chapter: 5,
    stage: 5,
    name: '防火墙裂缝',
    description: '防火墙被突破，精英病毒入侵',
    isBoss: false,
    enemies: [
      { id: 'mob_5_5_1', name: '缓冲溢出兽', atk: 80, def: 40, hp: 537, spd: 15, skill: null },
      { id: 'mob_5_5_2', name: '蓝屏死机灵', atk: 80, def: 40, hp: 537, spd: 15, skill: null },
      { id: 'mob_5_5_3', name: '木马病毒', atk: 120, def: 67, hp: 940, spd: 18, skill: null }
    ],
    rewards: {
      gold: 490,
      exp: 294,
      food: 7,
      wood: 58,
      stone: 58,
      iron: 58,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
    },
    foodCost: 7,
    unlockCondition: 'stage_5_4',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_5_6',
    chapter: 5,
    stage: 6,
    name: '数据库深渊',
    description: '损坏的数据库，数据丢失严重',
    isBoss: false,
    enemies: [
      { id: 'mob_5_6_1', name: '栈溢出魔', atk: 88, def: 44, hp: 588, spd: 15, skill: null },
      { id: 'mob_5_6_2', name: '404错误精灵', atk: 88, def: 44, hp: 588, spd: 15, skill: null },
      { id: 'mob_5_6_3', name: '内存泄漏怪', atk: 88, def: 44, hp: 588, spd: 15, skill: null },
      { id: 'mob_5_6_4', name: '死循环幽灵', atk: 88, def: 44, hp: 588, spd: 15, skill: null }
    ],
    rewards: {
      gold: 500,
      exp: 300,
      food: 7,
      wood: 60,
      stone: 60,
      iron: 60,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
    },
    foodCost: 8,
    unlockCondition: 'stage_5_5',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_5_7',
    chapter: 5,
    stage: 7,
    name: '网络协议层',
    description: '网络通信混乱，数据包四处碰撞',
    isBoss: false,
    enemies: [
      { id: 'mob_5_7_1', name: '死循环幽灵', atk: 95, def: 47, hp: 638, spd: 15, skill: null },
      { id: 'mob_5_7_2', name: '空指针异常体', atk: 95, def: 47, hp: 638, spd: 15, skill: null },
      { id: 'mob_5_7_3', name: '缓冲溢出兽', atk: 95, def: 47, hp: 638, spd: 15, skill: null },
      { id: 'mob_5_7_4', name: '蓝屏死机灵', atk: 95, def: 47, hp: 638, spd: 15, skill: null }
    ],
    rewards: {
      gold: 510,
      exp: 306,
      food: 7,
      wood: 61,
      stone: 61,
      iron: 61,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
    },
    foodCost: 8,
    unlockCondition: 'stage_5_6',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_5_8',
    chapter: 5,
    stage: 8,
    name: '内核禁区',
    description: '系统内核区域，顶级威胁出没',
    isBoss: false,
    enemies: [
      { id: 'mob_5_8_1', name: '蓝屏死机灵', atk: 103, def: 51, hp: 688, spd: 15, skill: null },
      { id: 'mob_5_8_2', name: '段错误妖', atk: 103, def: 51, hp: 688, spd: 15, skill: null },
      { id: 'mob_5_8_3', name: '栈溢出魔', atk: 103, def: 51, hp: 688, spd: 15, skill: null },
      { id: 'mob_5_8_4', name: '木马病毒', atk: 154, def: 86, hp: 1205, spd: 18, skill: null }
    ],
    rewards: {
      gold: 520,
      exp: 312,
      food: 7,
      wood: 62,
      stone: 62,
      iron: 62,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
    },
    foodCost: 8,
    unlockCondition: 'stage_5_7',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_5_9',
    chapter: 5,
    stage: 9,
    name: '根目录圣殿',
    description: '最核心的目录，精锐程序守卫',
    isBoss: false,
    enemies: [
      { id: 'mob_5_9_1', name: '404错误精灵', atk: 110, def: 55, hp: 739, spd: 15, skill: null },
      { id: 'mob_5_9_2', name: '内存泄漏怪', atk: 110, def: 55, hp: 739, spd: 15, skill: null },
      { id: 'mob_5_9_3', name: '死循环幽灵', atk: 110, def: 55, hp: 739, spd: 15, skill: null },
      { id: 'mob_5_9_4', name: '勒索软件', atk: 166, def: 92, hp: 1293, spd: 18, skill: null }
    ],
    rewards: {
      gold: 530,
      exp: 318,
      food: 7,
      wood: 63,
      stone: 63,
      iron: 63,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
    },
    foodCost: 8,
    unlockCondition: 'stage_5_8',
    firstClearReward: {
      jade: 10,
      hero: null
    }
  },
  {
    id: 'stage_5_10',
    chapter: 5,
    stage: 10,
    name: '系统核心',
    description: '击败系统崩溃者，修复整个系统',
    isBoss: true,
    enemies: [
      { id: 'mob_5_10_1', name: '系统崩溃者', atk: 493, def: 296, hp: 5921, spd: 20, skill: { name: '闺蜜揭真相', type: 'debuff', multiplier: 0, target: 'all', cd: 4, effect: { stat: 'atk', ratio: -0.3, duration: 3 } } }
    ],
    rewards: {
      gold: 540,
      exp: 324,
      food: 9,
      wood: 64,
      stone: 64,
      iron: 64,
      equipDropRate: 1,
      equipQualityWeights: { 1: 5, 2: 15, 3: 30, 4: 35, 5: 15 }
    },
    foodCost: 8,
    unlockCondition: 'stage_5_9',
    firstClearReward: {
      jade: 30,
      hero: null
    }
  }
];
