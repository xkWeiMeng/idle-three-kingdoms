/**
 * 武将数据表 — 幻想三国
 * 20 名武将 + 4 种普通兵种
 */
const HeroData = [
  // ==================== 蜀·外卖公司 ====================
  {
    id: 'shu_zhugeliang',
    name: '诸葛亮',
    title: '外卖CEO',
    faction: 'shu',
    quality: 5,
    emoji: '🧠',
    baseAtk: 45,
    baseDef: 35,
    baseHp: 280,
    baseSpd: 40,
    skill: {
      id: 'skill_zgl',
      name: '锦囊快递',
      description: '投掷外卖包裹，ATK×180%伤害',
      type: 'damage',
      multiplier: 1.8,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_liubei',
    name: '刘备',
    title: '不情愿皇帝',
    faction: 'shu',
    quality: 5,
    emoji: '👑',
    baseAtk: 35,
    baseDef: 45,
    baseHp: 350,
    baseSpd: 30,
    skill: {
      id: 'skill_lb',
      name: '仁义鸡汤',
      description: '给最低血量队友灌鸡汤，恢复ATK×150%HP',
      type: 'heal',
      multiplier: 1.5,
      target: 'ally_lowest_hp',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_guanyu',
    name: '关羽',
    title: '健身搭子',
    faction: 'shu',
    quality: 5,
    emoji: '🏋️',
    baseAtk: 55,
    baseDef: 40,
    baseHp: 320,
    baseSpd: 35,
    skill: {
      id: 'skill_gy',
      name: '青龙偃月会员卡',
      description: '挥舞健身器材，ATK×200%单体伤害',
      type: 'damage',
      multiplier: 2.0,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_zhangfei',
    name: '张飞',
    title: '暴力教练',
    faction: 'shu',
    quality: 4,
    emoji: '💪',
    baseAtk: 60,
    baseDef: 30,
    baseHp: 290,
    baseSpd: 38,
    skill: {
      id: 'skill_zf',
      name: '吼叫训练',
      description: '全场咆哮，ATK×120%全体伤害',
      type: 'damage',
      multiplier: 1.2,
      target: 'all',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_zhaoyun',
    name: '赵云',
    title: '瑜伽教练',
    faction: 'shu',
    quality: 4,
    emoji: '🧘',
    baseAtk: 50,
    baseDef: 38,
    baseHp: 300,
    baseSpd: 42,
    skill: {
      id: 'skill_zy',
      name: '七进七出体式',
      description: '展示高难度体式，ATK×180%单体伤害',
      type: 'damage',
      multiplier: 1.8,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_huangzhong',
    name: '黄忠',
    title: '退休射箭教练',
    faction: 'shu',
    quality: 4,
    emoji: '🏹',
    baseAtk: 58,
    baseDef: 25,
    baseHp: 260,
    baseSpd: 28,
    skill: {
      id: 'skill_hz',
      name: '百步穿杨(老花版)',
      description: '虽然看不清但箭术精准，ATK×200%单体伤害',
      type: 'damage',
      multiplier: 2.0,
      target: 'single',
      cooldown: 4,
      effect: null
    }
  },
  {
    id: 'shu_machao',
    name: '马超',
    title: '快递小哥',
    faction: 'shu',
    quality: 3,
    emoji: '🏇',
    baseAtk: 48,
    baseDef: 32,
    baseHp: 280,
    baseSpd: 45,
    skill: {
      id: 'skill_mc',
      name: '极速快递',
      description: '骑马高速冲锋，ATK×160%单体伤害',
      type: 'damage',
      multiplier: 1.6,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },

  // ==================== 魏·草鞋电商帝国 ====================
  {
    id: 'wei_caocao',
    name: '曹操',
    title: '鞋业大亨',
    faction: 'wei',
    quality: 5,
    emoji: '👟',
    baseAtk: 50,
    baseDef: 42,
    baseHp: 340,
    baseSpd: 36,
    skill: {
      id: 'skill_cc',
      name: '连环鞋链踢',
      description: '用库存草鞋轰炸全场，ATK×130%全体伤害',
      type: 'damage',
      multiplier: 1.3,
      target: 'all',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wei_simayi',
    name: '司马懿',
    title: '隐形创业者',
    faction: 'wei',
    quality: 5,
    emoji: '🦊',
    baseAtk: 42,
    baseDef: 48,
    baseHp: 360,
    baseSpd: 32,
    skill: {
      id: 'skill_smy',
      name: '无声收购',
      description: '暗中操作，全体敌人ATK-15%持续2回合',
      type: 'debuff',
      multiplier: 0.15,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'atk', ratio: -0.15, duration: 2 }
    }
  },
  {
    id: 'wei_xiahoudun',
    name: '夏侯惇',
    title: '独眼保安队长',
    faction: 'wei',
    quality: 4,
    emoji: '🏴‍☠️',
    baseAtk: 52,
    baseDef: 44,
    baseHp: 330,
    baseSpd: 33,
    skill: {
      id: 'skill_xhd',
      name: '吃箭表演(表演版)',
      description: '吃掉飞来的箭再反击，ATK×190%单体伤害',
      type: 'damage',
      multiplier: 1.9,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wei_zhangliao',
    name: '张辽',
    title: '仓库管理员',
    faction: 'wei',
    quality: 3,
    emoji: '📦',
    baseAtk: 46,
    baseDef: 36,
    baseHp: 300,
    baseSpd: 40,
    skill: {
      id: 'skill_zl',
      name: '物流园扬名',
      description: '仓库管理术威震四方，ATK×120%全体伤害',
      type: 'damage',
      multiplier: 1.2,
      target: 'all',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wei_dianwei',
    name: '典韦',
    title: '贴身保镖',
    faction: 'wei',
    quality: 3,
    emoji: '🛡️',
    baseAtk: 55,
    baseDef: 28,
    baseHp: 310,
    baseSpd: 30,
    skill: {
      id: 'skill_dw',
      name: '双戟安检',
      description: '用双戟检查一切可疑目标，ATK×180%单体伤害',
      type: 'damage',
      multiplier: 1.8,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wei_xunyu',
    name: '荀彧',
    title: '首席财务官',
    faction: 'wei',
    quality: 2,
    emoji: '📊',
    baseAtk: 30,
    baseDef: 35,
    baseHp: 270,
    baseSpd: 38,
    skill: {
      id: 'skill_xy',
      name: '财务报表攻击',
      description: '用复杂报表砸人，全体敌人DEF-15%持续2回合',
      type: 'debuff',
      multiplier: 0.15,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'def', ratio: -0.15, duration: 2 }
    }
  },

  // ==================== 吴·直播娱乐 ====================
  {
    id: 'wu_sunquan',
    name: '孙权',
    title: '直播达人',
    faction: 'wu',
    quality: 5,
    emoji: '📱',
    baseAtk: 38,
    baseDef: 40,
    baseHp: 330,
    baseSpd: 34,
    skill: {
      id: 'skill_sq',
      name: '直播红包雨',
      description: '打赏全场，全体队友ATK+20%持续2回合',
      type: 'buff',
      multiplier: 0.2,
      target: 'all',
      cooldown: 3,
      effect: { stat: 'atk', ratio: 0.2, duration: 2 }
    }
  },
  {
    id: 'wu_zhouyu',
    name: '周瑜',
    title: '经纪人/乐手',
    faction: 'wu',
    quality: 4,
    emoji: '🎸',
    baseAtk: 48,
    baseDef: 35,
    baseHp: 290,
    baseSpd: 39,
    skill: {
      id: 'skill_zy2',
      name: '火烧直播间',
      description: '用音乐之火席卷全场，ATK×140%全体伤害',
      type: 'damage',
      multiplier: 1.4,
      target: 'all',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wu_sunshangxiang',
    name: '孙尚香',
    title: '电竞女主播',
    faction: 'wu',
    quality: 3,
    emoji: '🎮',
    baseAtk: 44,
    baseDef: 30,
    baseHp: 275,
    baseSpd: 43,
    skill: {
      id: 'skill_ssx',
      name: '弓箭少女连射',
      description: '游戏操作般的高速射击，ATK×170%单体伤害',
      type: 'damage',
      multiplier: 1.7,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wu_taishici',
    name: '太史慈',
    title: '外景记者',
    faction: 'wu',
    quality: 2,
    emoji: '🎤',
    baseAtk: 42,
    baseDef: 33,
    baseHp: 285,
    baseSpd: 37,
    skill: {
      id: 'skill_tsc',
      name: '现场连线',
      description: '远程连线攻击，ATK×150%单体伤害',
      type: 'damage',
      multiplier: 1.5,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },

  // ==================== 群·自由职业者 ====================
  {
    id: 'qun_lvbu',
    name: '吕布',
    title: '奶茶店店长',
    faction: 'qun',
    quality: 5,
    emoji: '🧋',
    baseAtk: 65,
    baseDef: 35,
    baseHp: 300,
    baseSpd: 40,
    skill: {
      id: 'skill_lvb',
      name: '方天画戟搅拌器',
      description: '用方天画戟搅拌奶茶和敌人，ATK×220%单体伤害',
      type: 'damage',
      multiplier: 2.2,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'qun_diaochan',
    name: '貂蝉',
    title: '美妆博主',
    faction: 'qun',
    quality: 4,
    emoji: '💄',
    baseAtk: 40,
    baseDef: 30,
    baseHp: 250,
    baseSpd: 44,
    skill: {
      id: 'skill_dc',
      name: '美颜滤镜',
      description: '开启美颜让敌人迷惑，全体敌人ATK-15%持续2回合',
      type: 'debuff',
      multiplier: 0.15,
      target: 'all',
      cooldown: 3,
      effect: { stat: 'atk', ratio: -0.15, duration: 2 }
    }
  },
  {
    id: 'qun_huatuo',
    name: '华佗',
    title: '养生网红',
    faction: 'qun',
    quality: 4,
    emoji: '🌿',
    baseAtk: 25,
    baseDef: 38,
    baseHp: 300,
    baseSpd: 36,
    skill: {
      id: 'skill_ht',
      name: '五禽戏直播',
      description: '带领全队做养生操，恢复全体ATK×100%HP',
      type: 'heal',
      multiplier: 1.0,
      target: 'all',
      cooldown: 4,
      effect: null
    }
  }
];

// 普通兵种模板
const CommonUnits = [
  {
    id: 'common_soldier',
    name: '普通士兵',
    title: '临时工',
    faction: 'qun',
    quality: 1,
    emoji: '⚔️',
    baseAtk: 10,
    baseDef: 8,
    baseHp: 80,
    baseSpd: 15,
    skill: null
  },
  {
    id: 'common_archer',
    name: '弓箭手',
    title: '兼职射手',
    faction: 'qun',
    quality: 1,
    emoji: '🏹',
    baseAtk: 12,
    baseDef: 6,
    baseHp: 70,
    baseSpd: 18,
    skill: null
  },
  {
    id: 'common_cavalry',
    name: '骑兵',
    title: '外卖骑手',
    faction: 'qun',
    quality: 1,
    emoji: '🐴',
    baseAtk: 14,
    baseDef: 7,
    baseHp: 75,
    baseSpd: 20,
    skill: null
  },
  {
    id: 'common_guard',
    name: '盾兵',
    title: '保安大叔',
    faction: 'qun',
    quality: 1,
    emoji: '🛡️',
    baseAtk: 8,
    baseDef: 12,
    baseHp: 100,
    baseSpd: 12,
    skill: null
  }
];

// 按品质分组的武将池（用于抽卡）
const HeroPoolByQuality = {
  5: ['shu_zhugeliang', 'shu_liubei', 'shu_guanyu', 'wei_caocao', 'wei_simayi', 'wu_sunquan', 'qun_lvbu'],
  4: ['shu_zhangfei', 'shu_zhaoyun', 'shu_huangzhong', 'wei_xiahoudun', 'wu_zhouyu', 'qun_diaochan', 'qun_huatuo'],
  3: ['shu_machao', 'wei_zhangliao', 'wei_dianwei', 'wu_sunshangxiang'],
  2: ['wei_xunyu', 'wu_taishici'],
  1: ['common_soldier', 'common_archer', 'common_cavalry', 'common_guard']
};

// 品质成长系数
const GrowthCoefficients = {
  1: { atk: 2, def: 1.5, hp: 10, spd: 0.5 },
  2: { atk: 3, def: 2, hp: 15, spd: 0.8 },
  3: { atk: 4, def: 3, hp: 22, spd: 1.0 },
  4: { atk: 5, def: 4, hp: 30, spd: 1.2 },
  5: { atk: 7, def: 5, hp: 40, spd: 1.5 }
};
