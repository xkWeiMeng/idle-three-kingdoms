/**
 * 终极技能数据表
 * 每位命名武将拥有一个终极技能，需要能量满后手动释放
 * 能量通过造成/受到伤害积攒，满100触发
 */

var UltimateSkills = {
  // ===== 蜀 =====
  shu_zhugeliang: {
    name: '万箭齐发',
    description: '天降箭雨，对全体敌人造成ATK×250%伤害',
    type: 'damage',
    multiplier: 2.5,
    target: 'all',
    icon: '🎯',
    energyCost: 100,
    energyGainOnHit: 8,
    energyGainOnHurt: 12
  },
  shu_liubei: {
    name: '仁德之光',
    description: '鼓舞全队，全体回复30%最大HP并攻击+20%持续3回合',
    type: 'heal_buff',
    healPercent: 0.3,
    buffEffect: { stat: 'atk', percent: 0.20, duration: 3 },
    target: 'all_ally',
    icon: '✨',
    energyCost: 100,
    energyGainOnHit: 6,
    energyGainOnHurt: 15
  },
  shu_guanyu: {
    name: '青龙斩月',
    description: '横扫千军，对全体敌人造成ATK×220%伤害，30%概率眩晕1回合',
    type: 'damage',
    multiplier: 2.2,
    target: 'all',
    stunChance: 0.3,
    stunDuration: 1,
    icon: '🐉',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },
  shu_zhangfei: {
    name: '怒吼震天',
    description: '一声吼叫，全体敌人攻击-25%持续3回合，并造成ATK×180%伤害',
    type: 'damage_debuff',
    multiplier: 1.8,
    target: 'all',
    debuffEffect: { stat: 'atk', percent: -0.25, duration: 3 },
    icon: '💢',
    energyCost: 100,
    energyGainOnHit: 8,
    energyGainOnHurt: 14
  },
  shu_zhaoyun: {
    name: '七进七出',
    description: '连续攻击随机敌人7次，每次造成ATK×80%伤害',
    type: 'multi_hit',
    multiplier: 0.8,
    hits: 7,
    target: 'random',
    icon: '⚡',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },
  shu_huangzhong: {
    name: '百步穿杨',
    description: '锁定血量最低的敌人，造成ATK×400%暴击伤害',
    type: 'damage',
    multiplier: 4.0,
    target: 'lowest_hp',
    forceCrit: true,
    icon: '🏹',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },
  shu_machao: {
    name: '西凉铁骑',
    description: '冲锋陷阵，对全体敌人造成ATK×200%伤害，自身速度+30%持续3回合',
    type: 'damage_buff',
    multiplier: 2.0,
    target: 'all',
    selfBuff: { stat: 'spd', percent: 0.30, duration: 3 },
    icon: '🏇',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },

  // ===== 魏 =====
  wei_caocao: {
    name: '挟天子令',
    description: '号令全场，全队攻防+15%持续4回合，并对全体敌人造成ATK×150%伤害',
    type: 'damage_buff',
    multiplier: 1.5,
    target: 'all',
    teamBuff: { stats: ['atk', 'def'], percent: 0.15, duration: 4 },
    icon: '👑',
    energyCost: 100,
    energyGainOnHit: 8,
    energyGainOnHurt: 12
  },
  wei_simayi: {
    name: '暗渡陈仓',
    description: '窃取全体敌人10%攻击力，转化为全队攻击加成持续4回合',
    type: 'steal_buff',
    stealPercent: 0.10,
    duration: 4,
    target: 'all',
    icon: '🦊',
    energyCost: 100,
    energyGainOnHit: 6,
    energyGainOnHurt: 15
  },
  wei_xiahoudun: {
    name: '拔矢啖睛',
    description: '牺牲20%当前HP，对全体敌人造成ATK×300%伤害',
    type: 'sacrifice_damage',
    hpCostPercent: 0.2,
    multiplier: 3.0,
    target: 'all',
    icon: '👁️',
    energyCost: 100,
    energyGainOnHit: 8,
    energyGainOnHurt: 15
  },
  wei_zhangliao: {
    name: '威震逍遥',
    description: '突袭全体敌人造成ATK×220%伤害，优先攻击血量最低的目标',
    type: 'damage',
    multiplier: 2.2,
    target: 'all',
    icon: '⚔️',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },
  wei_dianwei: {
    name: '双戟乱舞',
    description: '狂暴攻击，对随机敌人造成5次ATK×100%伤害',
    type: 'multi_hit',
    multiplier: 1.0,
    hits: 5,
    target: 'random',
    icon: '🪓',
    energyCost: 100,
    energyGainOnHit: 12,
    energyGainOnHurt: 8
  },
  wei_xunyu: {
    name: '运筹帷幄',
    description: '全队回复25%HP，并清除所有负面效果',
    type: 'heal_cleanse',
    healPercent: 0.25,
    target: 'all_ally',
    icon: '📜',
    energyCost: 100,
    energyGainOnHit: 6,
    energyGainOnHurt: 15
  },

  // ===== 吴 =====
  wu_sunquan: {
    name: '江东之盾',
    description: '全队获得相当于20%最大HP的护盾，持续3回合',
    type: 'shield',
    shieldPercent: 0.20,
    duration: 3,
    target: 'all_ally',
    icon: '🛡️',
    energyCost: 100,
    energyGainOnHit: 6,
    energyGainOnHurt: 15
  },
  wu_zhouyu: {
    name: '火烧连营',
    description: '烈焰焚烧全体敌人，造成ATK×200%伤害并附加灼烧(3回合各ATK×30%)',
    type: 'damage_dot',
    multiplier: 2.0,
    dotMultiplier: 0.3,
    dotDuration: 3,
    target: 'all',
    icon: '🔥',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },
  wu_sunshangxiang: {
    name: '巾帼之怒',
    description: '连射敌方全体，造成ATK×200%伤害，自身攻击+25%持续3回合',
    type: 'damage_buff',
    multiplier: 2.0,
    target: 'all',
    selfBuff: { stat: 'atk', percent: 0.25, duration: 3 },
    icon: '🏹',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },
  wu_taishici: {
    name: '神射无双',
    description: '精准射击血量最低敌人，造成ATK×350%伤害',
    type: 'damage',
    multiplier: 3.5,
    target: 'lowest_hp',
    icon: '🎯',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },

  // ===== 群 =====
  qun_lvbu: {
    name: '天下无双',
    description: '全力爆发，对全体敌人造成ATK×280%伤害',
    type: 'damage',
    multiplier: 2.8,
    target: 'all',
    icon: '💀',
    energyCost: 100,
    energyGainOnHit: 12,
    energyGainOnHurt: 8
  },
  qun_diaochan: {
    name: '倾国倾城',
    description: '魅惑全体敌人，攻防-20%持续3回合',
    type: 'debuff',
    debuffEffect: { stats: ['atk', 'def'], percent: -0.20, duration: 3 },
    target: 'all',
    icon: '💃',
    energyCost: 100,
    energyGainOnHit: 6,
    energyGainOnHurt: 15
  },
  qun_huatuo: {
    name: '妙手回春',
    description: '全体回复40%最大HP',
    type: 'heal',
    healPercent: 0.40,
    target: 'all_ally',
    icon: '💚',
    energyCost: 100,
    energyGainOnHit: 5,
    energyGainOnHurt: 18
  },

  // ===== 新增蜀 =====
  shu_jiangwei: {
    name: '九伐中原',
    description: '前赴后继发起冲锋，对全体敌人造成ATK×200%伤害，自身攻击+20%持续3回合',
    type: 'damage_buff',
    multiplier: 2.0,
    target: 'all',
    selfBuff: { stat: 'atk', percent: 0.20, duration: 3 },
    icon: '🗡️',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },
  shu_pangtong: {
    name: '连环计',
    description: '巧施连环，全体敌人速度-25%持续3回合并造成ATK×160%伤害',
    type: 'damage_debuff',
    multiplier: 1.6,
    target: 'all',
    debuffEffect: { stat: 'spd', percent: -0.25, duration: 3 },
    icon: '🔗',
    energyCost: 100,
    energyGainOnHit: 8,
    energyGainOnHurt: 12
  },

  // ===== 新增魏 =====
  wei_guojia: {
    name: '十胜论',
    description: '精准分析敌方弱点，全体敌人防御-25%持续3回合',
    type: 'debuff',
    debuffEffect: { stat: 'def', percent: -0.25, duration: 3 },
    target: 'all',
    icon: '🧮',
    energyCost: 100,
    energyGainOnHit: 6,
    energyGainOnHurt: 15
  },

  // ===== 新增吴 =====
  wu_lvmeng: {
    name: '白衣渡江',
    description: '奇袭敌后，对全体敌人造成ATK×220%伤害，无视20%防御',
    type: 'damage',
    multiplier: 2.2,
    target: 'all',
    ignoreDefPercent: 0.2,
    icon: '🌊',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },
  wu_luxun: {
    name: '夷陵烈焰',
    description: '火烧连营，对全体敌人造成ATK×180%伤害并附加灼烧(3回合各ATK×25%)',
    type: 'damage_dot',
    multiplier: 1.8,
    dotMultiplier: 0.25,
    dotDuration: 3,
    target: 'all',
    icon: '💥',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },

  // ===== 新增群 =====
  qun_yuanshao: {
    name: '四世三公',
    description: '以名望号令全场，全队攻防+15%持续4回合',
    type: 'buff',
    teamBuff: { stats: ['atk', 'def'], percent: 0.15, duration: 4 },
    target: 'all_ally',
    icon: '👔',
    energyCost: 100,
    energyGainOnHit: 6,
    energyGainOnHurt: 15
  },
  qun_dongzhuo: {
    name: '焚城之怒',
    description: '暴虐焚城，对全体敌人造成ATK×260%伤害，自身受到10%最大HP伤害',
    type: 'sacrifice_damage',
    hpCostPercent: 0.1,
    multiplier: 2.6,
    target: 'all',
    icon: '🏚️',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },
  qun_zhangjiao: {
    name: '苍天已死',
    description: '召唤天雷，对全体敌人造成ATK×240%伤害，30%概率眩晕1回合',
    type: 'damage',
    multiplier: 2.4,
    target: 'all',
    stunChance: 0.3,
    stunDuration: 1,
    icon: '⛈️',
    energyCost: 100,
    energyGainOnHit: 10,
    energyGainOnHurt: 10
  },
  qun_zuoci: {
    name: '仙术幻影',
    description: '制造幻影分身，对随机敌人造成6次ATK×70%伤害',
    type: 'multi_hit',
    multiplier: 0.7,
    hits: 6,
    target: 'random',
    icon: '🎭',
    energyCost: 100,
    energyGainOnHit: 8,
    energyGainOnHurt: 12
  },
  qun_caiwenji: {
    name: '胡笳退兵',
    description: '悲壮琴音感化全场，全体回复35%最大HP并清除负面效果',
    type: 'heal_cleanse',
    healPercent: 0.35,
    target: 'all_ally',
    icon: '🎶',
    energyCost: 100,
    energyGainOnHit: 5,
    energyGainOnHurt: 18
  }
};
