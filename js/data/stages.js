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
  },
// ===== 第六章：社区团购风波 =====
  {
    id: 'stage_6_1',
    chapter: 6,
    stage: 1,
    name: '小区门口摊位',
    description: '社区门口的临时取货点，大妈们蠢蠢欲动',
    isBoss: false,
    enemies: [
      { id: 'mob_6_1_1', name: '凑单达人', atk: 65, def: 32, hp: 435, spd: 16, skill: null },
      { id: 'mob_6_1_2', name: '鸡蛋争夺者', atk: 65, def: 32, hp: 435, spd: 16, skill: null },
      { id: 'mob_6_1_3', name: '优惠券收割机', atk: 65, def: 32, hp: 435, spd: 16, skill: null }
    ],
    rewards: {
      gold: 300,
      exp: 180,
      food: 5,
      wood: 30,
      stone: 30,
      iron: 25,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 0, 2: 10, 3: 30, 4: 40, 5: 18, 6: 2 }
    },
    foodCost: 8,
    unlockCondition: 'stage_5_10',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_6_2',
    chapter: 6,
    stage: 2,
    name: '优惠券争夺战',
    description: '限量优惠券引发混乱，手慢无！',
    isBoss: false,
    enemies: [
      { id: 'mob_6_2_1', name: '鸡蛋争夺者', atk: 72, def: 36, hp: 482, spd: 16, skill: null },
      { id: 'mob_6_2_2', name: '优惠券收割机', atk: 72, def: 36, hp: 482, spd: 16, skill: null },
      { id: 'mob_6_2_3', name: '接龙高手', atk: 72, def: 36, hp: 482, spd: 16, skill: null }
    ],
    rewards: {
      gold: 312,
      exp: 187,
      food: 5,
      wood: 31,
      stone: 31,
      iron: 26,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 0, 2: 10, 3: 30, 4: 40, 5: 18, 6: 2 }
    },
    foodCost: 8,
    unlockCondition: 'stage_6_1',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_6_3',
    chapter: 6,
    stage: 3,
    name: '鸡蛋补货点',
    description: '据说有9.9包邮的鸡蛋到货了',
    isBoss: false,
    enemies: [
      { id: 'mob_6_3_1', name: '优惠券收割机', atk: 80, def: 40, hp: 536, spd: 16, skill: null },
      { id: 'mob_6_3_2', name: '接龙高手', atk: 80, def: 40, hp: 536, spd: 16, skill: null },
      { id: 'mob_6_3_3', name: '提货点守卫', atk: 80, def: 40, hp: 536, spd: 16, skill: null }
    ],
    rewards: {
      gold: 324,
      exp: 194,
      food: 5,
      wood: 33,
      stone: 33,
      iron: 27,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 0, 2: 10, 3: 30, 4: 40, 5: 18, 6: 2 }
    },
    foodCost: 8,
    unlockCondition: 'stage_6_2',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_6_4',
    chapter: 6,
    stage: 4,
    name: '接龙群聊',
    description: '微信群接龙大战，错过就是过错',
    isBoss: false,
    enemies: [
      { id: 'mob_6_4_1', name: '接龙高手', atk: 88, def: 44, hp: 589, spd: 16, skill: null },
      { id: 'mob_6_4_2', name: '提货点守卫', atk: 88, def: 44, hp: 589, spd: 16, skill: null },
      { id: 'mob_6_4_3', name: '团长大妈', atk: 88, def: 44, hp: 589, spd: 16, skill: null }
    ],
    rewards: {
      gold: 336,
      exp: 201,
      food: 5,
      wood: 34,
      stone: 34,
      iron: 28,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 0, 2: 10, 3: 30, 4: 40, 5: 18, 6: 2 }
    },
    foodCost: 8,
    unlockCondition: 'stage_6_3',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_6_5',
    chapter: 6,
    stage: 5,
    name: '冷链仓库',
    description: '生鲜冷链的核心据点，有精英把守',
    isBoss: false,
    enemies: [
      { id: 'mob_6_5_1', name: '提货点守卫', atk: 96, def: 48, hp: 643, spd: 16, skill: null },
      { id: 'mob_6_5_2', name: '团长大妈', atk: 96, def: 48, hp: 643, spd: 16, skill: null },
      { id: 'mob_6_5_3', name: '凑单达人', atk: 96, def: 48, hp: 643, spd: 16, skill: null },
      { id: 'mob_6_5_4', name: '片区经理', atk: 144, def: 79, hp: 1123, spd: 19, skill: null }
    ],
    rewards: {
      gold: 348,
      exp: 208,
      food: 6,
      wood: 36,
      stone: 36,
      iron: 30,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 0, 2: 10, 3: 30, 4: 40, 5: 18, 6: 2 }
    },
    foodCost: 8,
    unlockCondition: 'stage_6_4',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_6_6',
    chapter: 6,
    stage: 6,
    name: '社区广场大厅',
    description: '多个团长势力在此交锋',
    isBoss: false,
    enemies: [
      { id: 'mob_6_6_1', name: '团长大妈', atk: 104, def: 52, hp: 696, spd: 16, skill: null },
      { id: 'mob_6_6_2', name: '凑单达人', atk: 104, def: 52, hp: 696, spd: 16, skill: null },
      { id: 'mob_6_6_3', name: '鸡蛋争夺者', atk: 104, def: 52, hp: 696, spd: 16, skill: null },
      { id: 'mob_6_6_4', name: '优惠券收割机', atk: 104, def: 52, hp: 696, spd: 16, skill: null }
    ],
    rewards: {
      gold: 360,
      exp: 216,
      food: 6,
      wood: 37,
      stone: 37,
      iron: 31,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 0, 2: 10, 3: 30, 4: 40, 5: 18, 6: 2 }
    },
    foodCost: 9,
    unlockCondition: 'stage_6_5',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_6_7',
    chapter: 6,
    stage: 7,
    name: '批发采购中心',
    description: '源头采购的兵家必争之地',
    isBoss: false,
    enemies: [
      { id: 'mob_6_7_1', name: '凑单达人', atk: 111, def: 55, hp: 743, spd: 16, skill: null },
      { id: 'mob_6_7_2', name: '鸡蛋争夺者', atk: 111, def: 55, hp: 743, spd: 16, skill: null },
      { id: 'mob_6_7_3', name: '优惠券收割机', atk: 111, def: 55, hp: 743, spd: 16, skill: null },
      { id: 'mob_6_7_4', name: '接龙高手', atk: 111, def: 55, hp: 743, spd: 16, skill: null }
    ],
    rewards: {
      gold: 372,
      exp: 223,
      food: 6,
      wood: 39,
      stone: 39,
      iron: 32,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 0, 2: 10, 3: 30, 4: 40, 5: 18, 6: 2 }
    },
    foodCost: 9,
    unlockCondition: 'stage_6_6',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_6_8',
    chapter: 6,
    stage: 8,
    name: '中心仓库',
    description: '团购帝国的物资总汇，守卫森严',
    isBoss: false,
    enemies: [
      { id: 'mob_6_8_1', name: '鸡蛋争夺者', atk: 119, def: 59, hp: 797, spd: 16, skill: null },
      { id: 'mob_6_8_2', name: '优惠券收割机', atk: 119, def: 59, hp: 797, spd: 16, skill: null },
      { id: 'mob_6_8_3', name: '接龙高手', atk: 119, def: 59, hp: 797, spd: 16, skill: null },
      { id: 'mob_6_8_4', name: '供应商代表', atk: 178, def: 97, hp: 1388, spd: 19, skill: null }
    ],
    rewards: {
      gold: 384,
      exp: 230,
      food: 6,
      wood: 40,
      stone: 40,
      iron: 33,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 0, 2: 10, 3: 30, 4: 40, 5: 18, 6: 2 }
    },
    foodCost: 9,
    unlockCondition: 'stage_6_7',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_6_9',
    chapter: 6,
    stage: 9,
    name: '后台结算室',
    description: '掌控资金流向的核心区域',
    isBoss: false,
    enemies: [
      { id: 'mob_6_9_1', name: '优惠券收割机', atk: 127, def: 63, hp: 850, spd: 16, skill: null },
      { id: 'mob_6_9_2', name: '接龙高手', atk: 127, def: 63, hp: 850, spd: 16, skill: null },
      { id: 'mob_6_9_3', name: '提货点守卫', atk: 127, def: 63, hp: 850, spd: 16, skill: null },
      { id: 'mob_6_9_4', name: '供应商代表', atk: 190, def: 104, hp: 1482, spd: 19, skill: null }
    ],
    rewards: {
      gold: 396,
      exp: 237,
      food: 7,
      wood: 42,
      stone: 42,
      iron: 35,
      equipDropRate: 0.12,
      equipQualityWeights: { 1: 0, 2: 10, 3: 30, 4: 40, 5: 18, 6: 2 }
    },
    foodCost: 10,
    unlockCondition: 'stage_6_8',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_6_10',
    chapter: 6,
    stage: 10,
    name: '团购帝国总部',
    description: '击败团购女皇，终结社区团购霸权',
    isBoss: true,
    enemies: [
      { id: 'mob_6_10_1', name: '团购女皇', atk: 600, def: 310, hp: 7800, spd: 24, skill: { name: '全民拼团核弹', type: 'damage', multiplier: 2, target: 'all', cd: 3 } }
    ],
    rewards: {
      gold: 408,
      exp: 244,
      food: 7,
      wood: 43,
      stone: 43,
      iron: 36,
      equipDropRate: 1,
      equipQualityWeights: { 1: 0, 2: 5, 3: 20, 4: 40, 5: 30, 6: 5 }
    },
    foodCost: 12,
    unlockCondition: 'stage_6_9',
    firstClearReward: {
      jade: 40,
      hero: null
    }
  },

  // ===== 第七章：网约车帝国 =====
  {
    id: 'stage_7_1',
    chapter: 7,
    stage: 1,
    name: '地铁站出口',
    description: '乘客蜂拥而出，司机疯狂抢单',
    isBoss: false,
    enemies: [
      { id: 'mob_7_1_1', name: '接单导航员', atk: 82, def: 41, hp: 549, spd: 16, skill: null },
      { id: 'mob_7_1_2', name: '抢单司机', atk: 82, def: 41, hp: 549, spd: 16, skill: null },
      { id: 'mob_7_1_3', name: '绕路老手', atk: 82, def: 41, hp: 549, spd: 16, skill: null }
    ],
    rewards: {
      gold: 450,
      exp: 270,
      food: 6,
      wood: 35,
      stone: 35,
      iron: 30,
      equipDropRate: 0.11,
      equipQualityWeights: { 1: 0, 2: 5, 3: 25, 4: 40, 5: 25, 6: 5 }
    },
    foodCost: 9,
    unlockCondition: 'stage_6_10',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_7_2',
    chapter: 7,
    stage: 2,
    name: '机场接机区',
    description: '高价订单的黄金地段，竞争惨烈',
    isBoss: false,
    enemies: [
      { id: 'mob_7_2_1', name: '抢单司机', atk: 91, def: 45, hp: 609, spd: 16, skill: null },
      { id: 'mob_7_2_2', name: '绕路老手', atk: 91, def: 45, hp: 609, spd: 16, skill: null },
      { id: 'mob_7_2_3', name: '拼车拒绝者', atk: 91, def: 45, hp: 609, spd: 16, skill: null }
    ],
    rewards: {
      gold: 468,
      exp: 280,
      food: 6,
      wood: 36,
      stone: 36,
      iron: 31,
      equipDropRate: 0.11,
      equipQualityWeights: { 1: 0, 2: 5, 3: 25, 4: 40, 5: 25, 6: 5 }
    },
    foodCost: 9,
    unlockCondition: 'stage_7_1',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_7_3',
    chapter: 7,
    stage: 3,
    name: '高峰期立交桥',
    description: '堵车就是战场，动态定价飙升',
    isBoss: false,
    enemies: [
      { id: 'mob_7_3_1', name: '绕路老手', atk: 101, def: 50, hp: 676, spd: 16, skill: null },
      { id: 'mob_7_3_2', name: '拼车拒绝者', atk: 101, def: 50, hp: 676, spd: 16, skill: null },
      { id: 'mob_7_3_3', name: '计价器黑客', atk: 101, def: 50, hp: 676, spd: 16, skill: null }
    ],
    rewards: {
      gold: 486,
      exp: 291,
      food: 6,
      wood: 38,
      stone: 38,
      iron: 33,
      equipDropRate: 0.11,
      equipQualityWeights: { 1: 0, 2: 5, 3: 25, 4: 40, 5: 25, 6: 5 }
    },
    foodCost: 9,
    unlockCondition: 'stage_7_2',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_7_4',
    chapter: 7,
    stage: 4,
    name: '半夜代驾区',
    description: '夜间订单的暗黑丛林',
    isBoss: false,
    enemies: [
      { id: 'mob_7_4_1', name: '拼车拒绝者', atk: 111, def: 55, hp: 743, spd: 16, skill: null },
      { id: 'mob_7_4_2', name: '计价器黑客', atk: 111, def: 55, hp: 743, spd: 16, skill: null },
      { id: 'mob_7_4_3', name: '五星好评怪', atk: 111, def: 55, hp: 743, spd: 16, skill: null }
    ],
    rewards: {
      gold: 504,
      exp: 302,
      food: 6,
      wood: 40,
      stone: 40,
      iron: 34,
      equipDropRate: 0.11,
      equipQualityWeights: { 1: 0, 2: 5, 3: 25, 4: 40, 5: 25, 6: 5 }
    },
    foodCost: 9,
    unlockCondition: 'stage_7_3',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_7_5',
    chapter: 7,
    stage: 5,
    name: '调度算法中心',
    description: '控制派单算法的核心设施',
    isBoss: false,
    enemies: [
      { id: 'mob_7_5_1', name: '计价器黑客', atk: 121, def: 60, hp: 810, spd: 16, skill: null },
      { id: 'mob_7_5_2', name: '五星好评怪', atk: 121, def: 60, hp: 810, spd: 16, skill: null },
      { id: 'mob_7_5_3', name: '接单导航员', atk: 121, def: 60, hp: 810, spd: 16, skill: null },
      { id: 'mob_7_5_4', name: '运营总监', atk: 181, def: 99, hp: 1411, spd: 19, skill: null }
    ],
    rewards: {
      gold: 522,
      exp: 313,
      food: 7,
      wood: 42,
      stone: 42,
      iron: 36,
      equipDropRate: 0.11,
      equipQualityWeights: { 1: 0, 2: 5, 3: 25, 4: 40, 5: 25, 6: 5 }
    },
    foodCost: 9,
    unlockCondition: 'stage_7_4',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_7_6',
    chapter: 7,
    stage: 6,
    name: '司机服务站',
    description: '老司机的据点，经验丰富的对手出没',
    isBoss: false,
    enemies: [
      { id: 'mob_7_6_1', name: '五星好评怪', atk: 131, def: 65, hp: 877, spd: 16, skill: null },
      { id: 'mob_7_6_2', name: '接单导航员', atk: 131, def: 65, hp: 877, spd: 16, skill: null },
      { id: 'mob_7_6_3', name: '抢单司机', atk: 131, def: 65, hp: 877, spd: 16, skill: null },
      { id: 'mob_7_6_4', name: '绕路老手', atk: 131, def: 65, hp: 877, spd: 16, skill: null }
    ],
    rewards: {
      gold: 540,
      exp: 324,
      food: 7,
      wood: 43,
      stone: 43,
      iron: 37,
      equipDropRate: 0.11,
      equipQualityWeights: { 1: 0, 2: 5, 3: 25, 4: 40, 5: 25, 6: 5 }
    },
    foodCost: 10,
    unlockCondition: 'stage_7_5',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_7_7',
    chapter: 7,
    stage: 7,
    name: '顺风车集散地',
    description: '拼车匹配的混乱战场',
    isBoss: false,
    enemies: [
      { id: 'mob_7_7_1', name: '接单导航员', atk: 141, def: 70, hp: 944, spd: 16, skill: null },
      { id: 'mob_7_7_2', name: '抢单司机', atk: 141, def: 70, hp: 944, spd: 16, skill: null },
      { id: 'mob_7_7_3', name: '绕路老手', atk: 141, def: 70, hp: 944, spd: 16, skill: null },
      { id: 'mob_7_7_4', name: '拼车拒绝者', atk: 141, def: 70, hp: 944, spd: 16, skill: null }
    ],
    rewards: {
      gold: 558,
      exp: 334,
      food: 7,
      wood: 45,
      stone: 45,
      iron: 39,
      equipDropRate: 0.11,
      equipQualityWeights: { 1: 0, 2: 5, 3: 25, 4: 40, 5: 25, 6: 5 }
    },
    foodCost: 10,
    unlockCondition: 'stage_7_6',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_7_8',
    chapter: 7,
    stage: 8,
    name: '平台补贴大厅',
    description: '烧钱大战的指挥中心',
    isBoss: false,
    enemies: [
      { id: 'mob_7_8_1', name: '抢单司机', atk: 150, def: 75, hp: 1005, spd: 16, skill: null },
      { id: 'mob_7_8_2', name: '绕路老手', atk: 150, def: 75, hp: 1005, spd: 16, skill: null },
      { id: 'mob_7_8_3', name: '拼车拒绝者', atk: 150, def: 75, hp: 1005, spd: 16, skill: null },
      { id: 'mob_7_8_4', name: '区域经理', atk: 225, def: 123, hp: 1755, spd: 19, skill: null }
    ],
    rewards: {
      gold: 576,
      exp: 345,
      food: 8,
      wood: 47,
      stone: 47,
      iron: 40,
      equipDropRate: 0.11,
      equipQualityWeights: { 1: 0, 2: 5, 3: 25, 4: 40, 5: 25, 6: 5 }
    },
    foodCost: 10,
    unlockCondition: 'stage_7_7',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_7_9',
    chapter: 7,
    stage: 9,
    name: '数据中枢',
    description: '掌控全城出行数据的要塞',
    isBoss: false,
    enemies: [
      { id: 'mob_7_9_1', name: '绕路老手', atk: 160, def: 80, hp: 1072, spd: 16, skill: null },
      { id: 'mob_7_9_2', name: '拼车拒绝者', atk: 160, def: 80, hp: 1072, spd: 16, skill: null },
      { id: 'mob_7_9_3', name: '计价器黑客', atk: 160, def: 80, hp: 1072, spd: 16, skill: null },
      { id: 'mob_7_9_4', name: '区域经理', atk: 240, def: 132, hp: 1872, spd: 19, skill: null }
    ],
    rewards: {
      gold: 594,
      exp: 356,
      food: 8,
      wood: 49,
      stone: 49,
      iron: 42,
      equipDropRate: 0.11,
      equipQualityWeights: { 1: 0, 2: 5, 3: 25, 4: 40, 5: 25, 6: 5 }
    },
    foodCost: 11,
    unlockCondition: 'stage_7_8',
    firstClearReward: {
      jade: 12,
      hero: null
    }
  },
  {
    id: 'stage_7_10',
    chapter: 7,
    stage: 10,
    name: '网约车帝国总部',
    description: '击败打车巨头，打破出行垄断',
    isBoss: true,
    enemies: [
      { id: 'mob_7_10_1', name: '打车巨头', atk: 720, def: 325, hp: 9400, spd: 24, skill: { name: '动态溢价风暴', type: 'damage', multiplier: 2.5, target: 'single', cd: 3 } }
    ],
    rewards: {
      gold: 612,
      exp: 367,
      food: 8,
      wood: 50,
      stone: 50,
      iron: 43,
      equipDropRate: 1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 18, 4: 38, 5: 35, 6: 9 }
    },
    foodCost: 13,
    unlockCondition: 'stage_7_9',
    firstClearReward: {
      jade: 40,
      hero: null
    }
  },

  // ===== 第八章：金融风暴 =====
  {
    id: 'stage_8_1',
    chapter: 8,
    stage: 1,
    name: '散户大厅',
    description: '无数散户在此横冲直撞',
    isBoss: false,
    enemies: [
      { id: 'mob_8_1_1', name: '追涨杀跌怪', atk: 103, def: 51, hp: 690, spd: 16, skill: null },
      { id: 'mob_8_1_2', name: '内幕交易员', atk: 103, def: 51, hp: 690, spd: 16, skill: null },
      { id: 'mob_8_1_3', name: '量化机器人', atk: 103, def: 51, hp: 690, spd: 16, skill: null }
    ],
    rewards: {
      gold: 620,
      exp: 372,
      food: 7,
      wood: 40,
      stone: 40,
      iron: 38,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 20, 4: 40, 5: 32, 6: 8 }
    },
    foodCost: 10,
    unlockCondition: 'stage_7_10',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_8_2',
    chapter: 8,
    stage: 2,
    name: '杠杆交易区',
    description: '高杠杆的疯狂，一秒天堂一秒地狱',
    isBoss: false,
    enemies: [
      { id: 'mob_8_2_1', name: '内幕交易员', atk: 115, def: 57, hp: 770, spd: 16, skill: null },
      { id: 'mob_8_2_2', name: '量化机器人', atk: 115, def: 57, hp: 770, spd: 16, skill: null },
      { id: 'mob_8_2_3', name: '韭菜收割者', atk: 115, def: 57, hp: 770, spd: 16, skill: null }
    ],
    rewards: {
      gold: 644,
      exp: 386,
      food: 7,
      wood: 42,
      stone: 42,
      iron: 39,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 20, 4: 40, 5: 32, 6: 8 }
    },
    foodCost: 10,
    unlockCondition: 'stage_8_1',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_8_3',
    chapter: 8,
    stage: 3,
    name: '期货交割日',
    description: '交割日的疯狂多空对决',
    isBoss: false,
    enemies: [
      { id: 'mob_8_3_1', name: '量化机器人', atk: 127, def: 63, hp: 850, spd: 16, skill: null },
      { id: 'mob_8_3_2', name: '韭菜收割者', atk: 127, def: 63, hp: 850, spd: 16, skill: null },
      { id: 'mob_8_3_3', name: '杠杆玩家', atk: 127, def: 63, hp: 850, spd: 16, skill: null }
    ],
    rewards: {
      gold: 668,
      exp: 400,
      food: 7,
      wood: 44,
      stone: 44,
      iron: 41,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 20, 4: 40, 5: 32, 6: 8 }
    },
    foodCost: 10,
    unlockCondition: 'stage_8_2',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_8_4',
    chapter: 8,
    stage: 4,
    name: '量化交易机房',
    description: '算法交易的核心，毫秒级对决',
    isBoss: false,
    enemies: [
      { id: 'mob_8_4_1', name: '韭菜收割者', atk: 140, def: 70, hp: 938, spd: 16, skill: null },
      { id: 'mob_8_4_2', name: '杠杆玩家', atk: 140, def: 70, hp: 938, spd: 16, skill: null },
      { id: 'mob_8_4_3', name: '做空猎手', atk: 140, def: 70, hp: 938, spd: 16, skill: null }
    ],
    rewards: {
      gold: 692,
      exp: 415,
      food: 8,
      wood: 46,
      stone: 46,
      iron: 43,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 20, 4: 40, 5: 32, 6: 8 }
    },
    foodCost: 10,
    unlockCondition: 'stage_8_3',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_8_5',
    chapter: 8,
    stage: 5,
    name: '做空裁判所',
    description: '做空势力的巢穴，精英出没',
    isBoss: false,
    enemies: [
      { id: 'mob_8_5_1', name: '杠杆玩家', atk: 152, def: 76, hp: 1018, spd: 16, skill: null },
      { id: 'mob_8_5_2', name: '做空猎手', atk: 152, def: 76, hp: 1018, spd: 16, skill: null },
      { id: 'mob_8_5_3', name: '追涨杀跌怪', atk: 152, def: 76, hp: 1018, spd: 16, skill: null },
      { id: 'mob_8_5_4', name: '基金经理', atk: 228, def: 125, hp: 1778, spd: 20, skill: null }
    ],
    rewards: {
      gold: 716,
      exp: 429,
      food: 8,
      wood: 48,
      stone: 48,
      iron: 45,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 20, 4: 40, 5: 32, 6: 8 }
    },
    foodCost: 10,
    unlockCondition: 'stage_8_4',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_8_6',
    chapter: 8,
    stage: 6,
    name: '私募会所',
    description: '隐秘的私募基金聚集地',
    isBoss: false,
    enemies: [
      { id: 'mob_8_6_1', name: '做空猎手', atk: 164, def: 82, hp: 1098, spd: 16, skill: null },
      { id: 'mob_8_6_2', name: '追涨杀跌怪', atk: 164, def: 82, hp: 1098, spd: 16, skill: null },
      { id: 'mob_8_6_3', name: '内幕交易员', atk: 164, def: 82, hp: 1098, spd: 16, skill: null },
      { id: 'mob_8_6_4', name: '量化机器人', atk: 164, def: 82, hp: 1098, spd: 16, skill: null }
    ],
    rewards: {
      gold: 740,
      exp: 444,
      food: 8,
      wood: 50,
      stone: 50,
      iron: 47,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 20, 4: 40, 5: 32, 6: 8 }
    },
    foodCost: 11,
    unlockCondition: 'stage_8_5',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_8_7',
    chapter: 8,
    stage: 7,
    name: '暗池交易区',
    description: '大宗暗池交易的灰色地带',
    isBoss: false,
    enemies: [
      { id: 'mob_8_7_1', name: '追涨杀跌怪', atk: 177, def: 88, hp: 1185, spd: 16, skill: null },
      { id: 'mob_8_7_2', name: '内幕交易员', atk: 177, def: 88, hp: 1185, spd: 16, skill: null },
      { id: 'mob_8_7_3', name: '量化机器人', atk: 177, def: 88, hp: 1185, spd: 16, skill: null },
      { id: 'mob_8_7_4', name: '韭菜收割者', atk: 177, def: 88, hp: 1185, spd: 16, skill: null }
    ],
    rewards: {
      gold: 764,
      exp: 458,
      food: 9,
      wood: 52,
      stone: 52,
      iron: 49,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 20, 4: 40, 5: 32, 6: 8 }
    },
    foodCost: 11,
    unlockCondition: 'stage_8_6',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_8_8',
    chapter: 8,
    stage: 8,
    name: '评级机构',
    description: '掌控信用评级的权力中心',
    isBoss: false,
    enemies: [
      { id: 'mob_8_8_1', name: '内幕交易员', atk: 189, def: 94, hp: 1266, spd: 16, skill: null },
      { id: 'mob_8_8_2', name: '量化机器人', atk: 189, def: 94, hp: 1266, spd: 16, skill: null },
      { id: 'mob_8_8_3', name: '韭菜收割者', atk: 189, def: 94, hp: 1266, spd: 16, skill: null },
      { id: 'mob_8_8_4', name: '私募大佬', atk: 283, def: 155, hp: 2207, spd: 20, skill: null }
    ],
    rewards: {
      gold: 788,
      exp: 472,
      food: 9,
      wood: 54,
      stone: 54,
      iron: 51,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 20, 4: 40, 5: 32, 6: 8 }
    },
    foodCost: 11,
    unlockCondition: 'stage_8_7',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_8_9',
    chapter: 8,
    stage: 9,
    name: '央行会议室',
    description: '决定货币政策的最高殿堂',
    isBoss: false,
    enemies: [
      { id: 'mob_8_9_1', name: '量化机器人', atk: 201, def: 100, hp: 1346, spd: 16, skill: null },
      { id: 'mob_8_9_2', name: '韭菜收割者', atk: 201, def: 100, hp: 1346, spd: 16, skill: null },
      { id: 'mob_8_9_3', name: '杠杆玩家', atk: 201, def: 100, hp: 1346, spd: 16, skill: null },
      { id: 'mob_8_9_4', name: '私募大佬', atk: 301, def: 165, hp: 2347, spd: 20, skill: null }
    ],
    rewards: {
      gold: 812,
      exp: 487,
      food: 9,
      wood: 56,
      stone: 56,
      iron: 53,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 20, 4: 40, 5: 32, 6: 8 }
    },
    foodCost: 12,
    unlockCondition: 'stage_8_8',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_8_10',
    chapter: 8,
    stage: 10,
    name: '金融帝国穹顶',
    description: '击败华尔街之狼，终结金融暴政',
    isBoss: true,
    enemies: [
      { id: 'mob_8_10_1', name: '华尔街之狼', atk: 860, def: 340, hp: 11200, spd: 24, skill: { name: '市场崩盘', type: 'debuff', multiplier: 0, target: 'all', cd: 4, effect: { stat: 'atk', ratio: -0.25, duration: 3 } } }
    ],
    rewards: {
      gold: 836,
      exp: 501,
      food: 10,
      wood: 58,
      stone: 58,
      iron: 55,
      equipDropRate: 1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 10, 4: 35, 5: 40, 6: 15 }
    },
    foodCost: 14,
    unlockCondition: 'stage_8_9',
    firstClearReward: {
      jade: 50,
      hero: null
    }
  },

  // ===== 第九章：元宇宙入侵 =====
  {
    id: 'stage_9_1',
    chapter: 9,
    stage: 1,
    name: '虚拟入口',
    description: '现实与虚拟的交界处，低级数据体出没',
    isBoss: false,
    enemies: [
      { id: 'mob_9_1_1', name: '数字幽灵', atk: 130, def: 65, hp: 871, spd: 16, skill: null },
      { id: 'mob_9_1_2', name: 'NFT守卫', atk: 130, def: 65, hp: 871, spd: 16, skill: null },
      { id: 'mob_9_1_3', name: '像素战士', atk: 130, def: 65, hp: 871, spd: 16, skill: null }
    ],
    rewards: {
      gold: 820,
      exp: 492,
      food: 8,
      wood: 50,
      stone: 50,
      iron: 48,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 15, 4: 35, 5: 38, 6: 12 }
    },
    foodCost: 12,
    unlockCondition: 'stage_8_10',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_9_2',
    chapter: 9,
    stage: 2,
    name: '像素废墟',
    description: '崩坏的虚拟城市残骸',
    isBoss: false,
    enemies: [
      { id: 'mob_9_2_1', name: 'NFT守卫', atk: 145, def: 72, hp: 971, spd: 16, skill: null },
      { id: 'mob_9_2_2', name: '像素战士', atk: 145, def: 72, hp: 971, spd: 16, skill: null },
      { id: 'mob_9_2_3', name: '代码傀儡', atk: 145, def: 72, hp: 971, spd: 16, skill: null }
    ],
    rewards: {
      gold: 852,
      exp: 511,
      food: 8,
      wood: 52,
      stone: 52,
      iron: 50,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 15, 4: 35, 5: 38, 6: 12 }
    },
    foodCost: 12,
    unlockCondition: 'stage_9_1',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_9_3',
    chapter: 9,
    stage: 3,
    name: 'NFT画廊',
    description: '数字艺术品化作了敌人',
    isBoss: false,
    enemies: [
      { id: 'mob_9_3_1', name: '像素战士', atk: 161, def: 80, hp: 1078, spd: 16, skill: null },
      { id: 'mob_9_3_2', name: '代码傀儡', atk: 161, def: 80, hp: 1078, spd: 16, skill: null },
      { id: 'mob_9_3_3', name: '数据碎灵', atk: 161, def: 80, hp: 1078, spd: 16, skill: null }
    ],
    rewards: {
      gold: 884,
      exp: 530,
      food: 8,
      wood: 55,
      stone: 55,
      iron: 52,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 15, 4: 35, 5: 38, 6: 12 }
    },
    foodCost: 12,
    unlockCondition: 'stage_9_2',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_9_4',
    chapter: 9,
    stage: 4,
    name: '代码荒原',
    description: '无尽的代码荒漠，傀儡横行',
    isBoss: false,
    enemies: [
      { id: 'mob_9_4_1', name: '代码傀儡', atk: 176, def: 88, hp: 1179, spd: 16, skill: null },
      { id: 'mob_9_4_2', name: '数据碎灵', atk: 176, def: 88, hp: 1179, spd: 16, skill: null },
      { id: 'mob_9_4_3', name: '虚拟化身', atk: 176, def: 88, hp: 1179, spd: 16, skill: null }
    ],
    rewards: {
      gold: 916,
      exp: 549,
      food: 9,
      wood: 57,
      stone: 57,
      iron: 55,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 15, 4: 35, 5: 38, 6: 12 }
    },
    foodCost: 12,
    unlockCondition: 'stage_9_3',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_9_5',
    chapter: 9,
    stage: 5,
    name: '区块链堡垒',
    description: '去中心化的坚固据点',
    isBoss: false,
    enemies: [
      { id: 'mob_9_5_1', name: '数据碎灵', atk: 192, def: 96, hp: 1286, spd: 16, skill: null },
      { id: 'mob_9_5_2', name: '虚拟化身', atk: 192, def: 96, hp: 1286, spd: 16, skill: null },
      { id: 'mob_9_5_3', name: '数字幽灵', atk: 192, def: 96, hp: 1286, spd: 16, skill: null },
      { id: 'mob_9_5_4', name: '区块链巨人', atk: 288, def: 158, hp: 2246, spd: 20, skill: null }
    ],
    rewards: {
      gold: 948,
      exp: 568,
      food: 9,
      wood: 60,
      stone: 60,
      iron: 57,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 15, 4: 35, 5: 38, 6: 12 }
    },
    foodCost: 12,
    unlockCondition: 'stage_9_4',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_9_6',
    chapter: 9,
    stage: 6,
    name: '数字孪生城',
    description: '现实城市的虚拟映射，亦真亦幻',
    isBoss: false,
    enemies: [
      { id: 'mob_9_6_1', name: '虚拟化身', atk: 208, def: 104, hp: 1393, spd: 16, skill: null },
      { id: 'mob_9_6_2', name: '数字幽灵', atk: 208, def: 104, hp: 1393, spd: 16, skill: null },
      { id: 'mob_9_6_3', name: 'NFT守卫', atk: 208, def: 104, hp: 1393, spd: 16, skill: null },
      { id: 'mob_9_6_4', name: '像素战士', atk: 208, def: 104, hp: 1393, spd: 16, skill: null }
    ],
    rewards: {
      gold: 980,
      exp: 588,
      food: 10,
      wood: 62,
      stone: 62,
      iron: 60,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 15, 4: 35, 5: 38, 6: 12 }
    },
    foodCost: 13,
    unlockCondition: 'stage_9_5',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_9_7',
    chapter: 9,
    stage: 7,
    name: '算力矿场',
    description: '疯狂挖矿的算力中心',
    isBoss: false,
    enemies: [
      { id: 'mob_9_7_1', name: '数字幽灵', atk: 223, def: 111, hp: 1494, spd: 16, skill: null },
      { id: 'mob_9_7_2', name: 'NFT守卫', atk: 223, def: 111, hp: 1494, spd: 16, skill: null },
      { id: 'mob_9_7_3', name: '像素战士', atk: 223, def: 111, hp: 1494, spd: 16, skill: null },
      { id: 'mob_9_7_4', name: '代码傀儡', atk: 223, def: 111, hp: 1494, spd: 16, skill: null }
    ],
    rewards: {
      gold: 1012,
      exp: 607,
      food: 10,
      wood: 65,
      stone: 65,
      iron: 62,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 15, 4: 35, 5: 38, 6: 12 }
    },
    foodCost: 13,
    unlockCondition: 'stage_9_6',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_9_8',
    chapter: 9,
    stage: 8,
    name: '共识之塔',
    description: '网络共识机制的核心塔楼',
    isBoss: false,
    enemies: [
      { id: 'mob_9_8_1', name: 'NFT守卫', atk: 239, def: 119, hp: 1601, spd: 16, skill: null },
      { id: 'mob_9_8_2', name: '像素战士', atk: 239, def: 119, hp: 1601, spd: 16, skill: null },
      { id: 'mob_9_8_3', name: '代码傀儡', atk: 239, def: 119, hp: 1601, spd: 16, skill: null },
      { id: 'mob_9_8_4', name: '元宇宙先锋', atk: 358, def: 196, hp: 2792, spd: 20, skill: null }
    ],
    rewards: {
      gold: 1044,
      exp: 626,
      food: 10,
      wood: 67,
      stone: 67,
      iron: 64,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 15, 4: 35, 5: 38, 6: 12 }
    },
    foodCost: 13,
    unlockCondition: 'stage_9_7',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_9_9',
    chapter: 9,
    stage: 9,
    name: '创世服务器',
    description: '元宇宙最初始的服务器群',
    isBoss: false,
    enemies: [
      { id: 'mob_9_9_1', name: '像素战士', atk: 254, def: 127, hp: 1701, spd: 16, skill: null },
      { id: 'mob_9_9_2', name: '代码傀儡', atk: 254, def: 127, hp: 1701, spd: 16, skill: null },
      { id: 'mob_9_9_3', name: '数据碎灵', atk: 254, def: 127, hp: 1701, spd: 16, skill: null },
      { id: 'mob_9_9_4', name: '元宇宙先锋', atk: 381, def: 209, hp: 2971, spd: 20, skill: null }
    ],
    rewards: {
      gold: 1076,
      exp: 645,
      food: 11,
      wood: 70,
      stone: 70,
      iron: 67,
      equipDropRate: 0.1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 15, 4: 35, 5: 38, 6: 12 }
    },
    foodCost: 14,
    unlockCondition: 'stage_9_8',
    firstClearReward: {
      jade: 15,
      hero: null
    }
  },
  {
    id: 'stage_9_10',
    chapter: 9,
    stage: 10,
    name: '元宇宙核心',
    description: '击败元宇宙主宰，粉碎虚拟暴政',
    isBoss: true,
    enemies: [
      { id: 'mob_9_10_1', name: '元宇宙主宰', atk: 1000, def: 355, hp: 13500, spd: 25, skill: { name: '数据风暴', type: 'damage', multiplier: 2, target: 'all', cd: 3, effect: { stat: 'def', ratio: -0.2, duration: 2 } } }
    ],
    rewards: {
      gold: 1108,
      exp: 664,
      food: 11,
      wood: 72,
      stone: 72,
      iron: 69,
      equipDropRate: 1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 5, 4: 30, 5: 42, 6: 23 }
    },
    foodCost: 16,
    unlockCondition: 'stage_9_9',
    firstClearReward: {
      jade: 50,
      hero: null
    }
  },

  // ===== 第十章：AI觉醒 =====
  {
    id: 'stage_10_1',
    chapter: 10,
    stage: 1,
    name: '数据标注车间',
    description: '无数标注工人化为AI的养分',
    isBoss: false,
    enemies: [
      { id: 'mob_10_1_1', name: '梯度下降魔', atk: 163, def: 81, hp: 1092, spd: 17, skill: null },
      { id: 'mob_10_1_2', name: '机器学习体', atk: 163, def: 81, hp: 1092, spd: 17, skill: null },
      { id: 'mob_10_1_3', name: '深度网络兽', atk: 163, def: 81, hp: 1092, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1050,
      exp: 630,
      food: 10,
      wood: 62,
      stone: 62,
      iron: 60,
      equipDropRate: 0.09,
      equipQualityWeights: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 42, 6: 18 }
    },
    foodCost: 14,
    unlockCondition: 'stage_9_10',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_10_2',
    chapter: 10,
    stage: 2,
    name: '训练沙盒',
    description: 'AI的试验场，充满不稳定的模型',
    isBoss: false,
    enemies: [
      { id: 'mob_10_2_1', name: '机器学习体', atk: 182, def: 91, hp: 1219, spd: 17, skill: null },
      { id: 'mob_10_2_2', name: '深度网络兽', atk: 182, def: 91, hp: 1219, spd: 17, skill: null },
      { id: 'mob_10_2_3', name: '算法猎手', atk: 182, def: 91, hp: 1219, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1092,
      exp: 655,
      food: 10,
      wood: 65,
      stone: 65,
      iron: 63,
      equipDropRate: 0.09,
      equipQualityWeights: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 42, 6: 18 }
    },
    foodCost: 14,
    unlockCondition: 'stage_10_1',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_10_3',
    chapter: 10,
    stage: 3,
    name: '过拟合深渊',
    description: '过度训练的AI失控暴走',
    isBoss: false,
    enemies: [
      { id: 'mob_10_3_1', name: '深度网络兽', atk: 202, def: 101, hp: 1353, spd: 17, skill: null },
      { id: 'mob_10_3_2', name: '算法猎手', atk: 202, def: 101, hp: 1353, spd: 17, skill: null },
      { id: 'mob_10_3_3', name: '训练集亡灵', atk: 202, def: 101, hp: 1353, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1134,
      exp: 680,
      food: 11,
      wood: 68,
      stone: 68,
      iron: 66,
      equipDropRate: 0.09,
      equipQualityWeights: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 42, 6: 18 }
    },
    foodCost: 14,
    unlockCondition: 'stage_10_2',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_10_4',
    chapter: 10,
    stage: 4,
    name: '参数调优室',
    description: '精密调参的核心区域',
    isBoss: false,
    enemies: [
      { id: 'mob_10_4_1', name: '算法猎手', atk: 221, def: 110, hp: 1480, spd: 17, skill: null },
      { id: 'mob_10_4_2', name: '训练集亡灵', atk: 221, def: 110, hp: 1480, spd: 17, skill: null },
      { id: 'mob_10_4_3', name: '过拟合怪', atk: 221, def: 110, hp: 1480, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1176,
      exp: 705,
      food: 11,
      wood: 71,
      stone: 71,
      iron: 69,
      equipDropRate: 0.09,
      equipQualityWeights: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 42, 6: 18 }
    },
    foodCost: 14,
    unlockCondition: 'stage_10_3',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_10_5',
    chapter: 10,
    stage: 5,
    name: 'GPU运算阵列',
    description: '算力怪兽驻守的关键节点',
    isBoss: false,
    enemies: [
      { id: 'mob_10_5_1', name: '训练集亡灵', atk: 241, def: 120, hp: 1614, spd: 17, skill: null },
      { id: 'mob_10_5_2', name: '过拟合怪', atk: 241, def: 120, hp: 1614, spd: 17, skill: null },
      { id: 'mob_10_5_3', name: '梯度下降魔', atk: 241, def: 120, hp: 1614, spd: 17, skill: null },
      { id: 'mob_10_5_4', name: '神经网络核心', atk: 361, def: 198, hp: 2815, spd: 20, skill: null }
    ],
    rewards: {
      gold: 1218,
      exp: 730,
      food: 12,
      wood: 74,
      stone: 74,
      iron: 72,
      equipDropRate: 0.09,
      equipQualityWeights: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 42, 6: 18 }
    },
    foodCost: 14,
    unlockCondition: 'stage_10_4',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_10_6',
    chapter: 10,
    stage: 6,
    name: '多模态融合区',
    description: '视觉、语言、推理的三重威胁',
    isBoss: false,
    enemies: [
      { id: 'mob_10_6_1', name: '过拟合怪', atk: 260, def: 130, hp: 1742, spd: 17, skill: null },
      { id: 'mob_10_6_2', name: '梯度下降魔', atk: 260, def: 130, hp: 1742, spd: 17, skill: null },
      { id: 'mob_10_6_3', name: '机器学习体', atk: 260, def: 130, hp: 1742, spd: 17, skill: null },
      { id: 'mob_10_6_4', name: '深度网络兽', atk: 260, def: 130, hp: 1742, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1260,
      exp: 756,
      food: 12,
      wood: 77,
      stone: 77,
      iron: 75,
      equipDropRate: 0.09,
      equipQualityWeights: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 42, 6: 18 }
    },
    foodCost: 15,
    unlockCondition: 'stage_10_5',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_10_7',
    chapter: 10,
    stage: 7,
    name: '强化学习竞技场',
    description: 'AI通过对战不断进化',
    isBoss: false,
    enemies: [
      { id: 'mob_10_7_1', name: '梯度下降魔', atk: 280, def: 140, hp: 1876, spd: 17, skill: null },
      { id: 'mob_10_7_2', name: '机器学习体', atk: 280, def: 140, hp: 1876, spd: 17, skill: null },
      { id: 'mob_10_7_3', name: '深度网络兽', atk: 280, def: 140, hp: 1876, spd: 17, skill: null },
      { id: 'mob_10_7_4', name: '算法猎手', atk: 280, def: 140, hp: 1876, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1302,
      exp: 781,
      food: 13,
      wood: 80,
      stone: 80,
      iron: 78,
      equipDropRate: 0.09,
      equipQualityWeights: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 42, 6: 18 }
    },
    foodCost: 15,
    unlockCondition: 'stage_10_6',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_10_8',
    chapter: 10,
    stage: 8,
    name: '涌现能力之门',
    description: '大模型涌现出未知能力',
    isBoss: false,
    enemies: [
      { id: 'mob_10_8_1', name: '机器学习体', atk: 299, def: 149, hp: 2003, spd: 17, skill: null },
      { id: 'mob_10_8_2', name: '深度网络兽', atk: 299, def: 149, hp: 2003, spd: 17, skill: null },
      { id: 'mob_10_8_3', name: '算法猎手', atk: 299, def: 149, hp: 2003, spd: 17, skill: null },
      { id: 'mob_10_8_4', name: 'GPU集群守卫', atk: 448, def: 246, hp: 3494, spd: 20, skill: null }
    ],
    rewards: {
      gold: 1344,
      exp: 806,
      food: 13,
      wood: 83,
      stone: 83,
      iron: 81,
      equipDropRate: 0.09,
      equipQualityWeights: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 42, 6: 18 }
    },
    foodCost: 15,
    unlockCondition: 'stage_10_7',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_10_9',
    chapter: 10,
    stage: 9,
    name: 'AGI研究所',
    description: '通用人工智能的最前沿',
    isBoss: false,
    enemies: [
      { id: 'mob_10_9_1', name: '深度网络兽', atk: 319, def: 159, hp: 2137, spd: 17, skill: null },
      { id: 'mob_10_9_2', name: '算法猎手', atk: 319, def: 159, hp: 2137, spd: 17, skill: null },
      { id: 'mob_10_9_3', name: '训练集亡灵', atk: 319, def: 159, hp: 2137, spd: 17, skill: null },
      { id: 'mob_10_9_4', name: 'GPU集群守卫', atk: 478, def: 262, hp: 3728, spd: 20, skill: null }
    ],
    rewards: {
      gold: 1386,
      exp: 831,
      food: 14,
      wood: 86,
      stone: 86,
      iron: 84,
      equipDropRate: 0.09,
      equipQualityWeights: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 42, 6: 18 }
    },
    foodCost: 16,
    unlockCondition: 'stage_10_8',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_10_10',
    chapter: 10,
    stage: 10,
    name: 'AI觉醒核心',
    description: '阻止超级AI的全面觉醒',
    isBoss: true,
    enemies: [
      { id: 'mob_10_10_1', name: '超级AI', atk: 1100, def: 365, hp: 15000, spd: 25, skill: { name: '奇点降临', type: 'damage', multiplier: 2.5, target: 'single', cd: 3 } },
      { id: 'mob_10_10_2', name: 'AI分身', atk: 495, def: 219, hp: 3750, spd: 20, skill: { name: '学习进化', type: 'buff', multiplier: 0.2, target: 'all', cd: 4, effect: { stat: 'atk', ratio: 0.2, duration: 2 } } }
    ],
    rewards: {
      gold: 1428,
      exp: 856,
      food: 14,
      wood: 89,
      stone: 89,
      iron: 87,
      equipDropRate: 1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 25, 5: 45, 6: 30 }
    },
    foodCost: 18,
    unlockCondition: 'stage_10_9',
    firstClearReward: {
      jade: 60,
      hero: null
    }
  },

  // ===== 第十一章：跨境远征 =====
  {
    id: 'stage_11_1',
    chapter: 11,
    stage: 1,
    name: '海关入境处',
    description: '繁琐的清关手续化为了战斗',
    isBoss: false,
    enemies: [
      { id: 'mob_11_1_1', name: '清关障碍', atk: 205, def: 102, hp: 1373, spd: 17, skill: null },
      { id: 'mob_11_1_2', name: '跨境搬运工', atk: 205, def: 102, hp: 1373, spd: 17, skill: null },
      { id: 'mob_11_1_3', name: '海关稽查员', atk: 205, def: 102, hp: 1373, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1350,
      exp: 810,
      food: 12,
      wood: 78,
      stone: 78,
      iron: 75,
      equipDropRate: 0.08,
      equipQualityWeights: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 45, 6: 25 }
    },
    foodCost: 16,
    unlockCondition: 'stage_10_10',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_11_2',
    chapter: 11,
    stage: 2,
    name: '汇率波动市场',
    description: '剧烈的汇率波动中作战',
    isBoss: false,
    enemies: [
      { id: 'mob_11_2_1', name: '跨境搬运工', atk: 229, def: 114, hp: 1534, spd: 17, skill: null },
      { id: 'mob_11_2_2', name: '海关稽查员', atk: 229, def: 114, hp: 1534, spd: 17, skill: null },
      { id: 'mob_11_2_3', name: '关税壁垒', atk: 229, def: 114, hp: 1534, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1404,
      exp: 842,
      food: 12,
      wood: 81,
      stone: 81,
      iron: 78,
      equipDropRate: 0.08,
      equipQualityWeights: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 45, 6: 25 }
    },
    foodCost: 16,
    unlockCondition: 'stage_11_1',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_11_3',
    chapter: 11,
    stage: 3,
    name: '跨境物流站',
    description: '国际物流的中转枢纽',
    isBoss: false,
    enemies: [
      { id: 'mob_11_3_1', name: '海关稽查员', atk: 254, def: 127, hp: 1701, spd: 17, skill: null },
      { id: 'mob_11_3_2', name: '关税壁垒', atk: 254, def: 127, hp: 1701, spd: 17, skill: null },
      { id: 'mob_11_3_3', name: '汇率刺客', atk: 254, def: 127, hp: 1701, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1458,
      exp: 874,
      food: 13,
      wood: 85,
      stone: 85,
      iron: 82,
      equipDropRate: 0.08,
      equipQualityWeights: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 45, 6: 25 }
    },
    foodCost: 16,
    unlockCondition: 'stage_11_2',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_11_4',
    chapter: 11,
    stage: 4,
    name: '关税壁垒阵',
    description: '层层关税筑成的防线',
    isBoss: false,
    enemies: [
      { id: 'mob_11_4_1', name: '关税壁垒', atk: 278, def: 139, hp: 1862, spd: 17, skill: null },
      { id: 'mob_11_4_2', name: '汇率刺客', atk: 278, def: 139, hp: 1862, spd: 17, skill: null },
      { id: 'mob_11_4_3', name: '物流幽灵', atk: 278, def: 139, hp: 1862, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1512,
      exp: 907,
      food: 13,
      wood: 89,
      stone: 89,
      iron: 86,
      equipDropRate: 0.08,
      equipQualityWeights: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 45, 6: 25 }
    },
    foodCost: 16,
    unlockCondition: 'stage_11_3',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_11_5',
    chapter: 11,
    stage: 5,
    name: '自贸区暗战',
    description: '自贸区内的精英势力角逐',
    isBoss: false,
    enemies: [
      { id: 'mob_11_5_1', name: '汇率刺客', atk: 303, def: 151, hp: 2030, spd: 17, skill: null },
      { id: 'mob_11_5_2', name: '物流幽灵', atk: 303, def: 151, hp: 2030, spd: 17, skill: null },
      { id: 'mob_11_5_3', name: '清关障碍', atk: 303, def: 151, hp: 2030, spd: 17, skill: null },
      { id: 'mob_11_5_4', name: '贸易战先锋', atk: 454, def: 249, hp: 3541, spd: 20, skill: null }
    ],
    rewards: {
      gold: 1566,
      exp: 939,
      food: 14,
      wood: 93,
      stone: 93,
      iron: 90,
      equipDropRate: 0.08,
      equipQualityWeights: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 45, 6: 25 }
    },
    foodCost: 16,
    unlockCondition: 'stage_11_4',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_11_6',
    chapter: 11,
    stage: 6,
    name: '跨境电商集群',
    description: '全球跨境电商的混战之地',
    isBoss: false,
    enemies: [
      { id: 'mob_11_6_1', name: '物流幽灵', atk: 328, def: 164, hp: 2197, spd: 17, skill: null },
      { id: 'mob_11_6_2', name: '清关障碍', atk: 328, def: 164, hp: 2197, spd: 17, skill: null },
      { id: 'mob_11_6_3', name: '跨境搬运工', atk: 328, def: 164, hp: 2197, spd: 17, skill: null },
      { id: 'mob_11_6_4', name: '海关稽查员', atk: 328, def: 164, hp: 2197, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1620,
      exp: 972,
      food: 15,
      wood: 97,
      stone: 97,
      iron: 93,
      equipDropRate: 0.08,
      equipQualityWeights: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 45, 6: 25 }
    },
    foodCost: 17,
    unlockCondition: 'stage_11_5',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_11_7',
    chapter: 11,
    stage: 7,
    name: '国际仲裁庭',
    description: '贸易纠纷的裁决战场',
    isBoss: false,
    enemies: [
      { id: 'mob_11_7_1', name: '清关障碍', atk: 352, def: 176, hp: 2358, spd: 17, skill: null },
      { id: 'mob_11_7_2', name: '跨境搬运工', atk: 352, def: 176, hp: 2358, spd: 17, skill: null },
      { id: 'mob_11_7_3', name: '海关稽查员', atk: 352, def: 176, hp: 2358, spd: 17, skill: null },
      { id: 'mob_11_7_4', name: '关税壁垒', atk: 352, def: 176, hp: 2358, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1674,
      exp: 1004,
      food: 15,
      wood: 101,
      stone: 101,
      iron: 97,
      equipDropRate: 0.08,
      equipQualityWeights: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 45, 6: 25 }
    },
    foodCost: 17,
    unlockCondition: 'stage_11_6',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_11_8',
    chapter: 11,
    stage: 8,
    name: '环球供应链',
    description: '掌控全球供应链的关键节点',
    isBoss: false,
    enemies: [
      { id: 'mob_11_8_1', name: '跨境搬运工', atk: 377, def: 188, hp: 2525, spd: 17, skill: null },
      { id: 'mob_11_8_2', name: '海关稽查员', atk: 377, def: 188, hp: 2525, spd: 17, skill: null },
      { id: 'mob_11_8_3', name: '关税壁垒', atk: 377, def: 188, hp: 2525, spd: 17, skill: null },
      { id: 'mob_11_8_4', name: '国际物流总监', atk: 565, def: 310, hp: 4407, spd: 20, skill: null }
    ],
    rewards: {
      gold: 1728,
      exp: 1036,
      food: 16,
      wood: 105,
      stone: 105,
      iron: 101,
      equipDropRate: 0.08,
      equipQualityWeights: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 45, 6: 25 }
    },
    foodCost: 17,
    unlockCondition: 'stage_11_7',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_11_9',
    chapter: 11,
    stage: 9,
    name: '贸易战指挥部',
    description: '国际贸易战的最高指挥所',
    isBoss: false,
    enemies: [
      { id: 'mob_11_9_1', name: '海关稽查员', atk: 401, def: 200, hp: 2686, spd: 17, skill: null },
      { id: 'mob_11_9_2', name: '关税壁垒', atk: 401, def: 200, hp: 2686, spd: 17, skill: null },
      { id: 'mob_11_9_3', name: '汇率刺客', atk: 401, def: 200, hp: 2686, spd: 17, skill: null },
      { id: 'mob_11_9_4', name: '国际物流总监', atk: 601, def: 330, hp: 4687, spd: 20, skill: null }
    ],
    rewards: {
      gold: 1782,
      exp: 1069,
      food: 16,
      wood: 109,
      stone: 109,
      iron: 105,
      equipDropRate: 0.08,
      equipQualityWeights: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 45, 6: 25 }
    },
    foodCost: 18,
    unlockCondition: 'stage_11_8',
    firstClearReward: {
      jade: 18,
      hero: null
    }
  },
  {
    id: 'stage_11_10',
    chapter: 11,
    stage: 10,
    name: '全球化终端',
    description: '击败全球化终结者，打通贸易之路',
    isBoss: true,
    enemies: [
      { id: 'mob_11_10_1', name: '全球化终结者', atk: 1180, def: 375, hp: 16800, spd: 25, skill: { name: '贸易制裁', type: 'damage', multiplier: 2, target: 'all', cd: 3, effect: { stat: 'atk', ratio: -0.2, duration: 2 } } }
    ],
    rewards: {
      gold: 1836,
      exp: 1101,
      food: 17,
      wood: 113,
      stone: 113,
      iron: 108,
      equipDropRate: 1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 }
    },
    foodCost: 20,
    unlockCondition: 'stage_11_9',
    firstClearReward: {
      jade: 60,
      hero: null
    }
  },

  // ===== 第十二章：暗网之战 =====
  {
    id: 'stage_12_1',
    chapter: 12,
    stage: 1,
    name: 'Tor入口节点',
    description: '暗网的入口，匿名流量涌动',
    isBoss: false,
    enemies: [
      { id: 'mob_12_1_1', name: '钓鱼术士', atk: 258, def: 129, hp: 1728, spd: 17, skill: null },
      { id: 'mob_12_1_2', name: '勒索程序', atk: 258, def: 129, hp: 1728, spd: 17, skill: null },
      { id: 'mob_12_1_3', name: '数据窃贼', atk: 258, def: 129, hp: 1728, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1720,
      exp: 1032,
      food: 14,
      wood: 95,
      stone: 95,
      iron: 92,
      equipDropRate: 0.07,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 20, 5: 48, 6: 32 }
    },
    foodCost: 18,
    unlockCondition: 'stage_11_10',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_12_2',
    chapter: 12,
    stage: 2,
    name: '钓鱼邮件工厂',
    description: '批量制造钓鱼攻击的基地',
    isBoss: false,
    enemies: [
      { id: 'mob_12_2_1', name: '勒索程序', atk: 288, def: 144, hp: 1929, spd: 17, skill: null },
      { id: 'mob_12_2_2', name: '数据窃贼', atk: 288, def: 144, hp: 1929, spd: 17, skill: null },
      { id: 'mob_12_2_3', name: '暗网商人', atk: 288, def: 144, hp: 1929, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1788,
      exp: 1072,
      food: 14,
      wood: 99,
      stone: 99,
      iron: 96,
      equipDropRate: 0.07,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 20, 5: 48, 6: 32 }
    },
    foodCost: 18,
    unlockCondition: 'stage_12_1',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_12_3',
    chapter: 12,
    stage: 3,
    name: '加密货币矿场',
    description: '非法挖矿的暗网矿场',
    isBoss: false,
    enemies: [
      { id: 'mob_12_3_1', name: '数据窃贼', atk: 319, def: 159, hp: 2137, spd: 17, skill: null },
      { id: 'mob_12_3_2', name: '暗网商人', atk: 319, def: 159, hp: 2137, spd: 17, skill: null },
      { id: 'mob_12_3_3', name: '零日漏洞体', atk: 319, def: 159, hp: 2137, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1856,
      exp: 1113,
      food: 15,
      wood: 104,
      stone: 104,
      iron: 101,
      equipDropRate: 0.07,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 20, 5: 48, 6: 32 }
    },
    foodCost: 18,
    unlockCondition: 'stage_12_2',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_12_4',
    chapter: 12,
    stage: 4,
    name: '数据黑市',
    description: '窃取的数据在此交易',
    isBoss: false,
    enemies: [
      { id: 'mob_12_4_1', name: '暗网商人', atk: 350, def: 175, hp: 2345, spd: 17, skill: null },
      { id: 'mob_12_4_2', name: '零日漏洞体', atk: 350, def: 175, hp: 2345, spd: 17, skill: null },
      { id: 'mob_12_4_3', name: '黑客幽灵', atk: 350, def: 175, hp: 2345, spd: 17, skill: null }
    ],
    rewards: {
      gold: 1924,
      exp: 1154,
      food: 16,
      wood: 109,
      stone: 109,
      iron: 105,
      equipDropRate: 0.07,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 20, 5: 48, 6: 32 }
    },
    foodCost: 18,
    unlockCondition: 'stage_12_3',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_12_5',
    chapter: 12,
    stage: 5,
    name: 'APT攻防区',
    description: '高级持续威胁的精锐基地',
    isBoss: false,
    enemies: [
      { id: 'mob_12_5_1', name: '零日漏洞体', atk: 381, def: 190, hp: 2552, spd: 17, skill: null },
      { id: 'mob_12_5_2', name: '黑客幽灵', atk: 381, def: 190, hp: 2552, spd: 17, skill: null },
      { id: 'mob_12_5_3', name: '钓鱼术士', atk: 381, def: 190, hp: 2552, spd: 17, skill: null },
      { id: 'mob_12_5_4', name: '加密守护者', atk: 571, def: 314, hp: 4453, spd: 21, skill: null }
    ],
    rewards: {
      gold: 1992,
      exp: 1195,
      food: 16,
      wood: 114,
      stone: 114,
      iron: 110,
      equipDropRate: 0.07,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 20, 5: 48, 6: 32 }
    },
    foodCost: 18,
    unlockCondition: 'stage_12_4',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_12_6',
    chapter: 12,
    stage: 6,
    name: '零日漏洞库',
    description: '珍藏零日漏洞的军火库',
    isBoss: false,
    enemies: [
      { id: 'mob_12_6_1', name: '黑客幽灵', atk: 412, def: 206, hp: 2760, spd: 17, skill: null },
      { id: 'mob_12_6_2', name: '钓鱼术士', atk: 412, def: 206, hp: 2760, spd: 17, skill: null },
      { id: 'mob_12_6_3', name: '勒索程序', atk: 412, def: 206, hp: 2760, spd: 17, skill: null },
      { id: 'mob_12_6_4', name: '数据窃贼', atk: 412, def: 206, hp: 2760, spd: 17, skill: null }
    ],
    rewards: {
      gold: 2060,
      exp: 1236,
      food: 17,
      wood: 118,
      stone: 118,
      iron: 115,
      equipDropRate: 0.07,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 20, 5: 48, 6: 32 }
    },
    foodCost: 19,
    unlockCondition: 'stage_12_5',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_12_7',
    chapter: 12,
    stage: 7,
    name: '勒索病毒研究所',
    description: '制造勒索软件的黑暗实验室',
    isBoss: false,
    enemies: [
      { id: 'mob_12_7_1', name: '钓鱼术士', atk: 443, def: 221, hp: 2968, spd: 17, skill: null },
      { id: 'mob_12_7_2', name: '勒索程序', atk: 443, def: 221, hp: 2968, spd: 17, skill: null },
      { id: 'mob_12_7_3', name: '数据窃贼', atk: 443, def: 221, hp: 2968, spd: 17, skill: null },
      { id: 'mob_12_7_4', name: '暗网商人', atk: 443, def: 221, hp: 2968, spd: 17, skill: null }
    ],
    rewards: {
      gold: 2128,
      exp: 1276,
      food: 18,
      wood: 123,
      stone: 123,
      iron: 119,
      equipDropRate: 0.07,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 20, 5: 48, 6: 32 }
    },
    foodCost: 19,
    unlockCondition: 'stage_12_6',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_12_8',
    chapter: 12,
    stage: 8,
    name: '僵尸网络枢纽',
    description: '控制百万僵尸机的指挥节点',
    isBoss: false,
    enemies: [
      { id: 'mob_12_8_1', name: '勒索程序', atk: 474, def: 237, hp: 3175, spd: 17, skill: null },
      { id: 'mob_12_8_2', name: '数据窃贼', atk: 474, def: 237, hp: 3175, spd: 17, skill: null },
      { id: 'mob_12_8_3', name: '暗网商人', atk: 474, def: 237, hp: 3175, spd: 17, skill: null },
      { id: 'mob_12_8_4', name: 'APT组织头目', atk: 711, def: 391, hp: 5545, spd: 21, skill: null }
    ],
    rewards: {
      gold: 2196,
      exp: 1317,
      food: 18,
      wood: 128,
      stone: 128,
      iron: 124,
      equipDropRate: 0.07,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 20, 5: 48, 6: 32 }
    },
    foodCost: 19,
    unlockCondition: 'stage_12_7',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_12_9',
    chapter: 12,
    stage: 9,
    name: '暗网交易所',
    description: '暗网经济的核心交易平台',
    isBoss: false,
    enemies: [
      { id: 'mob_12_9_1', name: '数据窃贼', atk: 505, def: 252, hp: 3383, spd: 17, skill: null },
      { id: 'mob_12_9_2', name: '暗网商人', atk: 505, def: 252, hp: 3383, spd: 17, skill: null },
      { id: 'mob_12_9_3', name: '零日漏洞体', atk: 505, def: 252, hp: 3383, spd: 17, skill: null },
      { id: 'mob_12_9_4', name: 'APT组织头目', atk: 757, def: 416, hp: 5904, spd: 21, skill: null }
    ],
    rewards: {
      gold: 2264,
      exp: 1358,
      food: 19,
      wood: 133,
      stone: 133,
      iron: 128,
      equipDropRate: 0.07,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 20, 5: 48, 6: 32 }
    },
    foodCost: 20,
    unlockCondition: 'stage_12_8',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_12_10',
    chapter: 12,
    stage: 10,
    name: '暗网核心',
    description: '击败暗网领主，摧毁地下网络帝国',
    isBoss: true,
    enemies: [
      { id: 'mob_12_10_1', name: '暗网领主', atk: 1250, def: 385, hp: 18500, spd: 26, skill: { name: '全网瘫痪', type: 'damage', multiplier: 2, target: 'all', cd: 4, effect: { stat: 'def', ratio: -0.25, duration: 3 } } }
    ],
    rewards: {
      gold: 2332,
      exp: 1399,
      food: 20,
      wood: 137,
      stone: 137,
      iron: 133,
      equipDropRate: 1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 48, 6: 42 }
    },
    foodCost: 22,
    unlockCondition: 'stage_12_9',
    firstClearReward: {
      jade: 70,
      hero: null
    }
  },

  // ===== 第十三章：量子纪元 =====
  {
    id: 'stage_13_1',
    chapter: 13,
    stage: 1,
    name: '量子比特阵列',
    description: '基础量子位组成的第一道防线',
    isBoss: false,
    enemies: [
      { id: 'mob_13_1_1', name: '波函数精灵', atk: 324, def: 162, hp: 2170, spd: 17, skill: null },
      { id: 'mob_13_1_2', name: '量子纠缠体', atk: 324, def: 162, hp: 2170, spd: 17, skill: null },
      { id: 'mob_13_1_3', name: '叠加态战士', atk: 324, def: 162, hp: 2170, spd: 17, skill: null }
    ],
    rewards: {
      gold: 2200,
      exp: 1320,
      food: 16,
      wood: 115,
      stone: 115,
      iron: 112,
      equipDropRate: 0.06,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 }
    },
    foodCost: 21,
    unlockCondition: 'stage_12_10',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_13_2',
    chapter: 13,
    stage: 2,
    name: '叠加态迷宫',
    description: '同时存在于多种状态的诡异空间',
    isBoss: false,
    enemies: [
      { id: 'mob_13_2_1', name: '量子纠缠体', atk: 362, def: 181, hp: 2425, spd: 17, skill: null },
      { id: 'mob_13_2_2', name: '叠加态战士', atk: 362, def: 181, hp: 2425, spd: 17, skill: null },
      { id: 'mob_13_2_3', name: '退相干怪', atk: 362, def: 181, hp: 2425, spd: 17, skill: null }
    ],
    rewards: {
      gold: 2288,
      exp: 1372,
      food: 16,
      wood: 120,
      stone: 120,
      iron: 117,
      equipDropRate: 0.06,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 }
    },
    foodCost: 21,
    unlockCondition: 'stage_13_1',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_13_3',
    chapter: 13,
    stage: 3,
    name: '退相干区域',
    description: '量子态不断崩塌的不稳定地带',
    isBoss: false,
    enemies: [
      { id: 'mob_13_3_1', name: '叠加态战士', atk: 401, def: 200, hp: 2686, spd: 17, skill: null },
      { id: 'mob_13_3_2', name: '退相干怪', atk: 401, def: 200, hp: 2686, spd: 17, skill: null },
      { id: 'mob_13_3_3', name: '量子门卫', atk: 401, def: 200, hp: 2686, spd: 17, skill: null }
    ],
    rewards: {
      gold: 2376,
      exp: 1425,
      food: 17,
      wood: 126,
      stone: 126,
      iron: 123,
      equipDropRate: 0.06,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 }
    },
    foodCost: 21,
    unlockCondition: 'stage_13_2',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_13_4',
    chapter: 13,
    stage: 4,
    name: '纠缠通道',
    description: '量子纠缠态编织的传送走廊',
    isBoss: false,
    enemies: [
      { id: 'mob_13_4_1', name: '退相干怪', atk: 440, def: 220, hp: 2948, spd: 17, skill: null },
      { id: 'mob_13_4_2', name: '量子门卫', atk: 440, def: 220, hp: 2948, spd: 17, skill: null },
      { id: 'mob_13_4_3', name: '薛定谔之影', atk: 440, def: 220, hp: 2948, spd: 17, skill: null }
    ],
    rewards: {
      gold: 2464,
      exp: 1478,
      food: 18,
      wood: 132,
      stone: 132,
      iron: 128,
      equipDropRate: 0.06,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 }
    },
    foodCost: 21,
    unlockCondition: 'stage_13_3',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_13_5',
    chapter: 13,
    stage: 5,
    name: '量子纠错站',
    description: '量子纠错算法守护的关键节点',
    isBoss: false,
    enemies: [
      { id: 'mob_13_5_1', name: '量子门卫', atk: 479, def: 239, hp: 3209, spd: 17, skill: null },
      { id: 'mob_13_5_2', name: '薛定谔之影', atk: 479, def: 239, hp: 3209, spd: 17, skill: null },
      { id: 'mob_13_5_3', name: '波函数精灵', atk: 479, def: 239, hp: 3209, spd: 17, skill: null },
      { id: 'mob_13_5_4', name: '量子处理器', atk: 718, def: 394, hp: 5600, spd: 21, skill: null }
    ],
    rewards: {
      gold: 2552,
      exp: 1531,
      food: 19,
      wood: 138,
      stone: 138,
      iron: 134,
      equipDropRate: 0.06,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 }
    },
    foodCost: 21,
    unlockCondition: 'stage_13_4',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_13_6',
    chapter: 13,
    stage: 6,
    name: '超导冷却室',
    description: '接近绝对零度的战斗环境',
    isBoss: false,
    enemies: [
      { id: 'mob_13_6_1', name: '薛定谔之影', atk: 518, def: 259, hp: 3470, spd: 17, skill: null },
      { id: 'mob_13_6_2', name: '波函数精灵', atk: 518, def: 259, hp: 3470, spd: 17, skill: null },
      { id: 'mob_13_6_3', name: '量子纠缠体', atk: 518, def: 259, hp: 3470, spd: 17, skill: null },
      { id: 'mob_13_6_4', name: '叠加态战士', atk: 518, def: 259, hp: 3470, spd: 17, skill: null }
    ],
    rewards: {
      gold: 2640,
      exp: 1584,
      food: 20,
      wood: 143,
      stone: 143,
      iron: 140,
      equipDropRate: 0.06,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 }
    },
    foodCost: 22,
    unlockCondition: 'stage_13_5',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_13_7',
    chapter: 13,
    stage: 7,
    name: '拓扑量子区',
    description: '拓扑保护的量子态异常稳固',
    isBoss: false,
    enemies: [
      { id: 'mob_13_7_1', name: '波函数精灵', atk: 557, def: 278, hp: 3731, spd: 17, skill: null },
      { id: 'mob_13_7_2', name: '量子纠缠体', atk: 557, def: 278, hp: 3731, spd: 17, skill: null },
      { id: 'mob_13_7_3', name: '叠加态战士', atk: 557, def: 278, hp: 3731, spd: 17, skill: null },
      { id: 'mob_13_7_4', name: '退相干怪', atk: 557, def: 278, hp: 3731, spd: 17, skill: null }
    ],
    rewards: {
      gold: 2728,
      exp: 1636,
      food: 20,
      wood: 149,
      stone: 149,
      iron: 145,
      equipDropRate: 0.06,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 }
    },
    foodCost: 22,
    unlockCondition: 'stage_13_6',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_13_8',
    chapter: 13,
    stage: 8,
    name: '量子优势前线',
    description: '经典计算无法企及的领域',
    isBoss: false,
    enemies: [
      { id: 'mob_13_8_1', name: '量子纠缠体', atk: 596, def: 298, hp: 3993, spd: 17, skill: null },
      { id: 'mob_13_8_2', name: '叠加态战士', atk: 596, def: 298, hp: 3993, spd: 17, skill: null },
      { id: 'mob_13_8_3', name: '退相干怪', atk: 596, def: 298, hp: 3993, spd: 17, skill: null },
      { id: 'mob_13_8_4', name: '纠缠态守护者', atk: 894, def: 491, hp: 6973, spd: 21, skill: null }
    ],
    rewards: {
      gold: 2816,
      exp: 1689,
      food: 21,
      wood: 155,
      stone: 155,
      iron: 151,
      equipDropRate: 0.06,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 }
    },
    foodCost: 22,
    unlockCondition: 'stage_13_7',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_13_9',
    chapter: 13,
    stage: 9,
    name: '量子霸权门廊',
    description: '接近量子霸权的最终防线',
    isBoss: false,
    enemies: [
      { id: 'mob_13_9_1', name: '叠加态战士', atk: 635, def: 317, hp: 4254, spd: 17, skill: null },
      { id: 'mob_13_9_2', name: '退相干怪', atk: 635, def: 317, hp: 4254, spd: 17, skill: null },
      { id: 'mob_13_9_3', name: '量子门卫', atk: 635, def: 317, hp: 4254, spd: 17, skill: null },
      { id: 'mob_13_9_4', name: '纠缠态守护者', atk: 952, def: 523, hp: 7425, spd: 21, skill: null }
    ],
    rewards: {
      gold: 2904,
      exp: 1742,
      food: 22,
      wood: 161,
      stone: 161,
      iron: 156,
      equipDropRate: 0.06,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 }
    },
    foodCost: 23,
    unlockCondition: 'stage_13_8',
    firstClearReward: {
      jade: 20,
      hero: null
    }
  },
  {
    id: 'stage_13_10',
    chapter: 13,
    stage: 10,
    name: '量子核心',
    description: '击败量子霸权，打破计算极限',
    isBoss: true,
    enemies: [
      { id: 'mob_13_10_1', name: '量子霸权', atk: 1320, def: 392, hp: 20500, spd: 26, skill: { name: '量子坍缩', type: 'damage', multiplier: 2.5, target: 'all', cd: 4 } },
      { id: 'mob_13_10_2', name: '纠缠分身', atk: 528, def: 196, hp: 4100, spd: 20, skill: { name: '量子回复', type: 'heal', multiplier: 1.5, target: 'ally_lowest_hp', cd: 3 } }
    ],
    rewards: {
      gold: 2992,
      exp: 1795,
      food: 23,
      wood: 166,
      stone: 166,
      iron: 162,
      equipDropRate: 1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 45, 6: 50 }
    },
    foodCost: 25,
    unlockCondition: 'stage_13_9',
    firstClearReward: {
      jade: 80,
      hero: null
    }
  },

  // ===== 第十四章：时空裂缝 =====
  {
    id: 'stage_14_1',
    chapter: 14,
    stage: 1,
    name: '时间碎片带',
    description: '时间的碎片漂浮在虚空中',
    isBoss: false,
    enemies: [
      { id: 'mob_14_1_1', name: '虫洞行者', atk: 407, def: 203, hp: 2726, spd: 17, skill: null },
      { id: 'mob_14_1_2', name: '平行宇宙影', atk: 407, def: 203, hp: 2726, spd: 17, skill: null },
      { id: 'mob_14_1_3', name: '熵增恶魔', atk: 407, def: 203, hp: 2726, spd: 17, skill: null }
    ],
    rewards: {
      gold: 2800,
      exp: 1680,
      food: 18,
      wood: 140,
      stone: 140,
      iron: 138,
      equipDropRate: 0.05,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 45, 6: 45 }
    },
    foodCost: 25,
    unlockCondition: 'stage_13_10',
    firstClearReward: {
      jade: 22,
      hero: null
    }
  },
  {
    id: 'stage_14_2',
    chapter: 14,
    stage: 2,
    name: '空间褶皱',
    description: '扭曲的空间让战斗变幻莫测',
    isBoss: false,
    enemies: [
      { id: 'mob_14_2_1', name: '平行宇宙影', atk: 455, def: 227, hp: 3048, spd: 17, skill: null },
      { id: 'mob_14_2_2', name: '熵增恶魔', atk: 455, def: 227, hp: 3048, spd: 17, skill: null },
      { id: 'mob_14_2_3', name: '时间碎片', atk: 455, def: 227, hp: 3048, spd: 17, skill: null }
    ],
    rewards: {
      gold: 2912,
      exp: 1747,
      food: 18,
      wood: 147,
      stone: 147,
      iron: 144,
      equipDropRate: 0.05,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 45, 6: 45 }
    },
    foodCost: 25,
    unlockCondition: 'stage_14_1',
    firstClearReward: {
      jade: 22,
      hero: null
    }
  },
  {
    id: 'stage_14_3',
    chapter: 14,
    stage: 3,
    name: '因果循环',
    description: '因果律混乱，行动可能被逆转',
    isBoss: false,
    enemies: [
      { id: 'mob_14_3_1', name: '熵增恶魔', atk: 504, def: 252, hp: 3376, spd: 17, skill: null },
      { id: 'mob_14_3_2', name: '时间碎片', atk: 504, def: 252, hp: 3376, spd: 17, skill: null },
      { id: 'mob_14_3_3', name: '空间扭曲者', atk: 504, def: 252, hp: 3376, spd: 17, skill: null }
    ],
    rewards: {
      gold: 3024,
      exp: 1814,
      food: 19,
      wood: 154,
      stone: 154,
      iron: 151,
      equipDropRate: 0.05,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 45, 6: 45 }
    },
    foodCost: 25,
    unlockCondition: 'stage_14_2',
    firstClearReward: {
      jade: 22,
      hero: null
    }
  },
  {
    id: 'stage_14_4',
    chapter: 14,
    stage: 4,
    name: '虫洞入口',
    description: '连接不同时空的不稳定通道',
    isBoss: false,
    enemies: [
      { id: 'mob_14_4_1', name: '时间碎片', atk: 553, def: 276, hp: 3705, spd: 17, skill: null },
      { id: 'mob_14_4_2', name: '空间扭曲者', atk: 553, def: 276, hp: 3705, spd: 17, skill: null },
      { id: 'mob_14_4_3', name: '因果悖论体', atk: 553, def: 276, hp: 3705, spd: 17, skill: null }
    ],
    rewards: {
      gold: 3136,
      exp: 1881,
      food: 20,
      wood: 161,
      stone: 161,
      iron: 158,
      equipDropRate: 0.05,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 45, 6: 45 }
    },
    foodCost: 25,
    unlockCondition: 'stage_14_3',
    firstClearReward: {
      jade: 22,
      hero: null
    }
  },
  {
    id: 'stage_14_5',
    chapter: 14,
    stage: 5,
    name: '平行世界交界',
    description: '另一个自己出现在面前',
    isBoss: false,
    enemies: [
      { id: 'mob_14_5_1', name: '空间扭曲者', atk: 602, def: 301, hp: 4033, spd: 17, skill: null },
      { id: 'mob_14_5_2', name: '因果悖论体', atk: 602, def: 301, hp: 4033, spd: 17, skill: null },
      { id: 'mob_14_5_3', name: '虫洞行者', atk: 602, def: 301, hp: 4033, spd: 17, skill: null },
      { id: 'mob_14_5_4', name: '维度守护者', atk: 903, def: 496, hp: 7043, spd: 21, skill: null }
    ],
    rewards: {
      gold: 3248,
      exp: 1948,
      food: 21,
      wood: 168,
      stone: 168,
      iron: 165,
      equipDropRate: 0.05,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 45, 6: 45 }
    },
    foodCost: 25,
    unlockCondition: 'stage_14_4',
    firstClearReward: {
      jade: 22,
      hero: null
    }
  },
  {
    id: 'stage_14_6',
    chapter: 14,
    stage: 6,
    name: '时间加速带',
    description: '一切都在疯狂加速的时空区域',
    isBoss: false,
    enemies: [
      { id: 'mob_14_6_1', name: '因果悖论体', atk: 651, def: 325, hp: 4361, spd: 17, skill: null },
      { id: 'mob_14_6_2', name: '虫洞行者', atk: 651, def: 325, hp: 4361, spd: 17, skill: null },
      { id: 'mob_14_6_3', name: '平行宇宙影', atk: 651, def: 325, hp: 4361, spd: 17, skill: null },
      { id: 'mob_14_6_4', name: '熵增恶魔', atk: 651, def: 325, hp: 4361, spd: 17, skill: null }
    ],
    rewards: {
      gold: 3360,
      exp: 2016,
      food: 22,
      wood: 175,
      stone: 175,
      iron: 172,
      equipDropRate: 0.05,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 45, 6: 45 }
    },
    foodCost: 26,
    unlockCondition: 'stage_14_5',
    firstClearReward: {
      jade: 22,
      hero: null
    }
  },
  {
    id: 'stage_14_7',
    chapter: 14,
    stage: 7,
    name: '熵增荒原',
    description: '宇宙热寂的前兆，万物走向混乱',
    isBoss: false,
    enemies: [
      { id: 'mob_14_7_1', name: '虫洞行者', atk: 700, def: 350, hp: 4690, spd: 17, skill: null },
      { id: 'mob_14_7_2', name: '平行宇宙影', atk: 700, def: 350, hp: 4690, spd: 17, skill: null },
      { id: 'mob_14_7_3', name: '熵增恶魔', atk: 700, def: 350, hp: 4690, spd: 17, skill: null },
      { id: 'mob_14_7_4', name: '时间碎片', atk: 700, def: 350, hp: 4690, spd: 17, skill: null }
    ],
    rewards: {
      gold: 3472,
      exp: 2083,
      food: 23,
      wood: 182,
      stone: 182,
      iron: 179,
      equipDropRate: 0.05,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 45, 6: 45 }
    },
    foodCost: 26,
    unlockCondition: 'stage_14_6',
    firstClearReward: {
      jade: 22,
      hero: null
    }
  },
  {
    id: 'stage_14_8',
    chapter: 14,
    stage: 8,
    name: '维度折叠区',
    description: '三维空间被折叠成更高维度',
    isBoss: false,
    enemies: [
      { id: 'mob_14_8_1', name: '平行宇宙影', atk: 748, def: 374, hp: 5011, spd: 17, skill: null },
      { id: 'mob_14_8_2', name: '熵增恶魔', atk: 748, def: 374, hp: 5011, spd: 17, skill: null },
      { id: 'mob_14_8_3', name: '时间碎片', atk: 748, def: 374, hp: 5011, spd: 17, skill: null },
      { id: 'mob_14_8_4', name: '因果律卫士', atk: 1122, def: 617, hp: 8751, spd: 21, skill: null }
    ],
    rewards: {
      gold: 3584,
      exp: 2150,
      food: 24,
      wood: 189,
      stone: 189,
      iron: 186,
      equipDropRate: 0.05,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 45, 6: 45 }
    },
    foodCost: 26,
    unlockCondition: 'stage_14_7',
    firstClearReward: {
      jade: 22,
      hero: null
    }
  },
  {
    id: 'stage_14_9',
    chapter: 14,
    stage: 9,
    name: '时空之门',
    description: '通往时空核心的最终之门',
    isBoss: false,
    enemies: [
      { id: 'mob_14_9_1', name: '熵增恶魔', atk: 797, def: 398, hp: 5339, spd: 17, skill: null },
      { id: 'mob_14_9_2', name: '时间碎片', atk: 797, def: 398, hp: 5339, spd: 17, skill: null },
      { id: 'mob_14_9_3', name: '空间扭曲者', atk: 797, def: 398, hp: 5339, spd: 17, skill: null },
      { id: 'mob_14_9_4', name: '因果律卫士', atk: 1195, def: 657, hp: 9321, spd: 21, skill: null }
    ],
    rewards: {
      gold: 3696,
      exp: 2217,
      food: 25,
      wood: 196,
      stone: 196,
      iron: 193,
      equipDropRate: 0.05,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 45, 6: 45 }
    },
    foodCost: 27,
    unlockCondition: 'stage_14_8',
    firstClearReward: {
      jade: 22,
      hero: null
    }
  },
  {
    id: 'stage_14_10',
    chapter: 14,
    stage: 10,
    name: '时空裂缝深处',
    description: '击败时空之主，修补时空裂缝',
    isBoss: true,
    enemies: [
      { id: 'mob_14_10_1', name: '时空之主', atk: 1400, def: 398, hp: 23000, spd: 26, skill: { name: '时间回溯', type: 'heal', multiplier: 2, target: 'self', cd: 4 } },
      { id: 'mob_14_10_2', name: '时空裂隙', atk: 700, def: 238, hp: 5750, spd: 20, skill: { name: '因果倒置', type: 'debuff', multiplier: 0, target: 'all', cd: 4, effect: { stat: 'atk', ratio: -0.2, duration: 2 } } }
    ],
    rewards: {
      gold: 3808,
      exp: 2284,
      food: 26,
      wood: 203,
      stone: 203,
      iron: 200,
      equipDropRate: 1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 42, 6: 58 }
    },
    foodCost: 29,
    unlockCondition: 'stage_14_9',
    firstClearReward: {
      jade: 100,
      hero: null
    }
  },

  // ===== 第十五章：天命降临 =====
  {
    id: 'stage_15_1',
    chapter: 15,
    stage: 1,
    name: '凡界天梯',
    description: '通往天界的第一段阶梯，天兵把守',
    isBoss: false,
    enemies: [
      { id: 'mob_15_1_1', name: '天将', atk: 512, def: 256, hp: 3430, spd: 18, skill: null },
      { id: 'mob_15_1_2', name: '仙灵卫', atk: 512, def: 256, hp: 3430, spd: 18, skill: null },
      { id: 'mob_15_1_3', name: '九天雷使', atk: 512, def: 256, hp: 3430, spd: 18, skill: null }
    ],
    rewards: {
      gold: 3600,
      exp: 2160,
      food: 22,
      wood: 170,
      stone: 170,
      iron: 168,
      equipDropRate: 0.04,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 40, 6: 55 }
    },
    foodCost: 30,
    unlockCondition: 'stage_14_10',
    firstClearReward: {
      jade: 25,
      hero: null
    }
  },
  {
    id: 'stage_15_2',
    chapter: 15,
    stage: 2,
    name: '云海关隘',
    description: '云海中的关隘，天将巡逻',
    isBoss: false,
    enemies: [
      { id: 'mob_15_2_1', name: '仙灵卫', atk: 573, def: 286, hp: 3839, spd: 18, skill: null },
      { id: 'mob_15_2_2', name: '九天雷使', atk: 573, def: 286, hp: 3839, spd: 18, skill: null },
      { id: 'mob_15_2_3', name: '天界执法者', atk: 573, def: 286, hp: 3839, spd: 18, skill: null }
    ],
    rewards: {
      gold: 3744,
      exp: 2246,
      food: 23,
      wood: 178,
      stone: 178,
      iron: 176,
      equipDropRate: 0.04,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 40, 6: 55 }
    },
    foodCost: 30,
    unlockCondition: 'stage_15_1',
    firstClearReward: {
      jade: 25,
      hero: null
    }
  },
  {
    id: 'stage_15_3',
    chapter: 15,
    stage: 3,
    name: '雷池禁地',
    description: '越雷池者死，九天雷霆守护',
    isBoss: false,
    enemies: [
      { id: 'mob_15_3_1', name: '九天雷使', atk: 634, def: 317, hp: 4247, spd: 18, skill: null },
      { id: 'mob_15_3_2', name: '天界执法者', atk: 634, def: 317, hp: 4247, spd: 18, skill: null },
      { id: 'mob_15_3_3', name: '命运织者', atk: 634, def: 317, hp: 4247, spd: 18, skill: null }
    ],
    rewards: {
      gold: 3888,
      exp: 2332,
      food: 24,
      wood: 187,
      stone: 187,
      iron: 184,
      equipDropRate: 0.04,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 40, 6: 55 }
    },
    foodCost: 30,
    unlockCondition: 'stage_15_2',
    firstClearReward: {
      jade: 25,
      hero: null
    }
  },
  {
    id: 'stage_15_4',
    chapter: 15,
    stage: 4,
    name: '仙灵圣林',
    description: '仙灵栖息的神圣森林',
    isBoss: false,
    enemies: [
      { id: 'mob_15_4_1', name: '天界执法者', atk: 696, def: 348, hp: 4663, spd: 18, skill: null },
      { id: 'mob_15_4_2', name: '命运织者', atk: 696, def: 348, hp: 4663, spd: 18, skill: null },
      { id: 'mob_15_4_3', name: '天兵', atk: 696, def: 348, hp: 4663, spd: 18, skill: null }
    ],
    rewards: {
      gold: 4032,
      exp: 2419,
      food: 25,
      wood: 195,
      stone: 195,
      iron: 193,
      equipDropRate: 0.04,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 40, 6: 55 }
    },
    foodCost: 30,
    unlockCondition: 'stage_15_3',
    firstClearReward: {
      jade: 25,
      hero: null
    }
  },
  {
    id: 'stage_15_5',
    chapter: 15,
    stage: 5,
    name: '星辰长廊',
    description: '二十八星宿排列的神秘长廊',
    isBoss: false,
    enemies: [
      { id: 'mob_15_5_1', name: '命运织者', atk: 757, def: 378, hp: 5071, spd: 18, skill: null },
      { id: 'mob_15_5_2', name: '天兵', atk: 757, def: 378, hp: 5071, spd: 18, skill: null },
      { id: 'mob_15_5_3', name: '天将', atk: 757, def: 378, hp: 5071, spd: 18, skill: null },
      { id: 'mob_15_5_4', name: '天命使者', atk: 1135, def: 624, hp: 8853, spd: 21, skill: null }
    ],
    rewards: {
      gold: 4176,
      exp: 2505,
      food: 26,
      wood: 204,
      stone: 204,
      iron: 201,
      equipDropRate: 0.04,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 40, 6: 55 }
    },
    foodCost: 30,
    unlockCondition: 'stage_15_4',
    firstClearReward: {
      jade: 25,
      hero: null
    }
  },
  {
    id: 'stage_15_6',
    chapter: 15,
    stage: 6,
    name: '命运之轮',
    description: '掌控命运的巨大轮盘所在',
    isBoss: false,
    enemies: [
      { id: 'mob_15_6_1', name: '天兵', atk: 819, def: 409, hp: 5487, spd: 18, skill: null },
      { id: 'mob_15_6_2', name: '天将', atk: 819, def: 409, hp: 5487, spd: 18, skill: null },
      { id: 'mob_15_6_3', name: '仙灵卫', atk: 819, def: 409, hp: 5487, spd: 18, skill: null },
      { id: 'mob_15_6_4', name: '九天雷使', atk: 819, def: 409, hp: 5487, spd: 18, skill: null }
    ],
    rewards: {
      gold: 4320,
      exp: 2592,
      food: 27,
      wood: 212,
      stone: 212,
      iron: 210,
      equipDropRate: 0.04,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 40, 6: 55 }
    },
    foodCost: 31,
    unlockCondition: 'stage_15_5',
    firstClearReward: {
      jade: 25,
      hero: null
    }
  },
  {
    id: 'stage_15_7',
    chapter: 15,
    stage: 7,
    name: '天界法庭',
    description: '天界审判一切因果的最高法庭',
    isBoss: false,
    enemies: [
      { id: 'mob_15_7_1', name: '天将', atk: 880, def: 440, hp: 5896, spd: 18, skill: null },
      { id: 'mob_15_7_2', name: '仙灵卫', atk: 880, def: 440, hp: 5896, spd: 18, skill: null },
      { id: 'mob_15_7_3', name: '九天雷使', atk: 880, def: 440, hp: 5896, spd: 18, skill: null },
      { id: 'mob_15_7_4', name: '天界执法者', atk: 880, def: 440, hp: 5896, spd: 18, skill: null }
    ],
    rewards: {
      gold: 4464,
      exp: 2678,
      food: 28,
      wood: 221,
      stone: 221,
      iron: 218,
      equipDropRate: 0.04,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 40, 6: 55 }
    },
    foodCost: 31,
    unlockCondition: 'stage_15_6',
    firstClearReward: {
      jade: 25,
      hero: null
    }
  },
  {
    id: 'stage_15_8',
    chapter: 15,
    stage: 8,
    name: '九重天阙',
    description: '天界权力的核心，九重天宫',
    isBoss: false,
    enemies: [
      { id: 'mob_15_8_1', name: '仙灵卫', atk: 942, def: 471, hp: 6311, spd: 18, skill: null },
      { id: 'mob_15_8_2', name: '九天雷使', atk: 942, def: 471, hp: 6311, spd: 18, skill: null },
      { id: 'mob_15_8_3', name: '天界执法者', atk: 942, def: 471, hp: 6311, spd: 18, skill: null },
      { id: 'mob_15_8_4', name: '星辰守护者', atk: 1413, def: 777, hp: 11021, spd: 21, skill: null }
    ],
    rewards: {
      gold: 4608,
      exp: 2764,
      food: 29,
      wood: 229,
      stone: 229,
      iron: 226,
      equipDropRate: 0.04,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 40, 6: 55 }
    },
    foodCost: 31,
    unlockCondition: 'stage_15_7',
    firstClearReward: {
      jade: 25,
      hero: null
    }
  },
  {
    id: 'stage_15_9',
    chapter: 15,
    stage: 9,
    name: '天命祭坛',
    description: '天命降临之地，天命使者守护',
    isBoss: false,
    enemies: [
      { id: 'mob_15_9_1', name: '九天雷使', atk: 1003, def: 501, hp: 6720, spd: 18, skill: null },
      { id: 'mob_15_9_2', name: '天界执法者', atk: 1003, def: 501, hp: 6720, spd: 18, skill: null },
      { id: 'mob_15_9_3', name: '命运织者', atk: 1003, def: 501, hp: 6720, spd: 18, skill: null },
      { id: 'mob_15_9_4', name: '星辰守护者', atk: 1504, def: 827, hp: 11731, spd: 21, skill: null }
    ],
    rewards: {
      gold: 4752,
      exp: 2851,
      food: 30,
      wood: 237,
      stone: 237,
      iron: 235,
      equipDropRate: 0.04,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 40, 6: 55 }
    },
    foodCost: 32,
    unlockCondition: 'stage_15_8',
    firstClearReward: {
      jade: 25,
      hero: null
    }
  },
  {
    id: 'stage_15_10',
    chapter: 15,
    stage: 10,
    name: '天命之巅',
    description: '击败天命之主——最终的觉醒，最后的战斗',
    isBoss: true,
    enemies: [
      { id: 'mob_15_10_1', name: '天命之主', atk: 1500, def: 400, hp: 14000, spd: 27, skill: { name: '天罚雷霆', type: 'damage', multiplier: 2, target: 'all', cd: 4 } },
      { id: 'mob_15_10_2', name: '命运左使', atk: 630, def: 220, hp: 3080, spd: 20, skill: { name: '命运枷锁', type: 'debuff', multiplier: 0, target: 'all', cd: 4, effect: { stat: 'atk', ratio: -0.25, duration: 2 } } },
      { id: 'mob_15_10_3', name: '命运右使', atk: 570, def: 200, hp: 2520, spd: 20, skill: { name: '天命回护', type: 'heal', multiplier: 1.5, target: 'ally_lowest_hp', cd: 3 } }
    ],
    rewards: {
      gold: 4896,
      exp: 2937,
      food: 31,
      wood: 246,
      stone: 246,
      iron: 243,
      equipDropRate: 1,
      equipQualityWeights: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 30, 6: 70 }
    },
    foodCost: 34,
    unlockCondition: 'stage_15_9',
    firstClearReward: {
      jade: 150,
      hero: null
    }
  },
];

