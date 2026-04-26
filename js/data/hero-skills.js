/**
 * 武将技能数据表 — 幻想三国
 * 每个武将拥有 3 个可升级技能
 *
 * 技能 1（index 0）：始终可用（即使等级 0 也有基础效果）
 * 技能 2、3（index 1、2）：需投入至少 1 技能点才可在战斗中使用
 *
 * 字段说明：
 *   id         唯一标识
 *   name       技能名称
 *   icon       表情图标
 *   desc       描述文案
 *   type       'damage' | 'heal' | 'buff' | 'debuff'
 *   target     'single' | 'all' | 'self' | 'ally_lowest_hp'
 *   baseMult   基础倍率（damage/heal 用）
 *   growthMult 每级增长倍率
 *   baseRatio  基础比率（buff/debuff 用）
 *   growthRatio 每级增长比率
 *   effectStat  buff/debuff 影响属性 'atk'|'def'|'spd'
 *   duration   buff/debuff 持续回合
 *   baseCd     基础冷却回合
 *   cdLevels   冷却-1 的技能等级阈值，如 [4,8] 表示 Lv4 和 Lv8 各减 1 回合 CD
 *   maxLevel   最大等级（默认 10）
 */

var SKILL_MAX_LEVEL = 10;
var SKILL_POINTS_INTERVAL = 5;

var HeroSkillData = {

  // ==================== 蜀·外卖公司 ====================

  'shu_zhugeliang': [
    {
      id: 'zgl_s1', name: '锦囊快递', icon: '📦',
      desc: '投掷外卖包裹，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.8, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'zgl_s2', name: '八阵外卖网', icon: '🕸️',
      desc: '布置高效配送网络，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.0, growthMult: 0.06,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'zgl_s3', name: '全场满减', icon: '🏷️',
      desc: '推出限时优惠活动，提升全体队友攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_liubei': [
    {
      id: 'lb_s1', name: '仁义鸡汤', icon: '🍲',
      desc: '给最虚弱的队友灌鸡汤，恢复大量生命',
      type: 'heal', target: 'ally_lowest_hp',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'lb_s2', name: '桃园结义套餐', icon: '🍑',
      desc: '兄弟情义加持，提升全体队友防御力',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'lb_s3', name: '御驾亲征便当', icon: '🍱',
      desc: '御厨特制便当，恢复全体队友生命',
      type: 'heal', target: 'all',
      baseMult: 0.8, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_guanyu': [
    {
      id: 'gy_s1', name: '青龙偃月会员卡', icon: '🏋️',
      desc: '挥舞健身器材，对单体造成重击',
      type: 'damage', target: 'single',
      baseMult: 2.0, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'gy_s2', name: '过五关斩六将', icon: '🚪',
      desc: '一路碾压过去，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.0, growthMult: 0.06,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'gy_s3', name: '武圣附体', icon: '🔥',
      desc: '极限训练爆发，大幅提升自身攻击力',
      type: 'buff', target: 'self',
      baseRatio: 0.25, growthRatio: 0.03, effectStat: 'atk', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_zhangfei': [
    {
      id: 'zf_s1', name: '吼叫训练', icon: '📢',
      desc: '全场咆哮，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.2, growthMult: 0.06,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'zf_s2', name: '一声断桥', icon: '🌉',
      desc: '怒吼震碎桥梁，降低全体敌人防御力',
      type: 'debuff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'zf_s3', name: '丈八蛇矛操', icon: '🐍',
      desc: '集中火力猛刺，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2.2, growthMult: 0.10,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_zhaoyun': [
    {
      id: 'zy_s1', name: '七进七出体式', icon: '🧘',
      desc: '展示高难度体式，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.8, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'zy_s2', name: '瑜伽冥想', icon: '🧎',
      desc: '深度冥想恢复自身生命',
      type: 'heal', target: 'self',
      baseMult: 1.2, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'zy_s3', name: '长坂坡晨练', icon: '⚡',
      desc: '大范围瑜伽攻势，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.2, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_huangzhong': [
    {
      id: 'hz_s1', name: '百步穿杨(老花版)', icon: '🎯',
      desc: '虽然看不清但箭术精准，对单体造成重击',
      type: 'damage', target: 'single',
      baseMult: 2.0, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'hz_s2', name: '老当益壮', icon: '💪',
      desc: '认真瞄准蓄力，大幅提升自身攻击力',
      type: 'buff', target: 'self',
      baseRatio: 0.25, growthRatio: 0.03, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'hz_s3', name: '连珠箭·老花加强版', icon: '🏹',
      desc: '到处乱射反而全中，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.3, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_machao': [
    {
      id: 'mc_s1', name: '极速快递', icon: '🏇',
      desc: '骑马高速冲锋，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.6, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'mc_s2', name: '超时配送', icon: '⏱️',
      desc: '急急急全队加速，提升全体队友速度',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'spd', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'mc_s3', name: '暴走骑手', icon: '🌪️',
      desc: '不要命的暴走配送，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.1, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  // ==================== 魏·草鞋电商帝国 ====================

  'wei_caocao': [
    {
      id: 'cc_s1', name: '连环鞋链踢', icon: '👟',
      desc: '用库存草鞋轰炸全场，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.3, growthMult: 0.06,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'cc_s2', name: '老板威严', icon: '👔',
      desc: '大亨气场全开，提升全体队友攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.18, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'cc_s3', name: '割须弃袍大清仓', icon: '🔥',
      desc: '甩卖式全力轰炸，对全体敌人造成巨额伤害',
      type: 'damage', target: 'all',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_simayi': [
    {
      id: 'smy_s1', name: '无声收购', icon: '🦊',
      desc: '暗中操作，降低全体敌人攻击力',
      type: 'debuff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'smy_s2', name: '空城计·假门面', icon: '🏢',
      desc: '装出大公司架势，大幅提升自身防御力',
      type: 'buff', target: 'self',
      baseRatio: 0.25, growthRatio: 0.03, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'smy_s3', name: '恶意做空', icon: '📉',
      desc: '集中打击对手要害，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2.0, growthMult: 0.10,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_xiahoudun': [
    {
      id: 'xhd_s1', name: '吃箭表演(表演版)', icon: '🏴‍☠️',
      desc: '吃掉飞来的箭再反击，对单体造成重击',
      type: 'damage', target: 'single',
      baseMult: 1.9, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'xhd_s2', name: '保安巡逻', icon: '🛡️',
      desc: '加强安保措施，提升全体队友防御力',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'xhd_s3', name: '独眼觉醒', icon: '👁️',
      desc: '保安队长彻底暴走，大幅提升自身攻击力',
      type: 'buff', target: 'self',
      baseRatio: 0.30, growthRatio: 0.03, effectStat: 'atk', duration: 3,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_zhangliao': [
    {
      id: 'zl_s1', name: '物流园扬名', icon: '📦',
      desc: '仓库管理术威震四方，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.2, growthMult: 0.06,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'zl_s2', name: '快速盘点', icon: '📋',
      desc: '高效盘点全队加速，提升全体队友速度',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'spd', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'zl_s3', name: '八百里急件', icon: '🚀',
      desc: '紧急配送模式全开，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2.0, growthMult: 0.10,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_dianwei': [
    {
      id: 'dw_s1', name: '双戟安检', icon: '⚔️',
      desc: '用双戟检查一切可疑目标，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.8, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'dw_s2', name: '保镖狂暴', icon: '😡',
      desc: '进入狂暴保镖模式，大幅提升自身攻击力',
      type: 'buff', target: 'self',
      baseRatio: 0.25, growthRatio: 0.03, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'dw_s3', name: '双戟旋风', icon: '🌀',
      desc: '疯狂旋转双戟，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.4, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_xunyu': [
    {
      id: 'xy_s1', name: '财务报表攻击', icon: '📊',
      desc: '用复杂报表砸人，降低全体敌人防御力',
      type: 'debuff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'xy_s2', name: '税务审计', icon: '🔍',
      desc: '发现财务漏洞精准打击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.4, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'xy_s3', name: '年终分红', icon: '💰',
      desc: '给全队发红利，恢复全体队友生命',
      type: 'heal', target: 'all',
      baseMult: 0.8, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  // ==================== 吴·直播娱乐 ====================

  'wu_sunquan': [
    {
      id: 'sq_s1', name: '直播红包雨', icon: '🧧',
      desc: '打赏全场，提升全体队友攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.20, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'sq_s2', name: '弹幕轰炸', icon: '💬',
      desc: '铺天盖地的弹幕攻击，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.1, growthMult: 0.06,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'sq_s3', name: '超级礼物', icon: '🎁',
      desc: '给最需要的队友送超级大礼，恢复大量生命',
      type: 'heal', target: 'ally_lowest_hp',
      baseMult: 2.0, growthMult: 0.10,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_zhouyu': [
    {
      id: 'zy2_s1', name: '火烧直播间', icon: '🔥',
      desc: '用音乐之火席卷全场，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.4, growthMult: 0.06,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'zy2_s2', name: '苦肉营销', icon: '🎭',
      desc: '悲情营销激发斗志，大幅提升自身攻击力',
      type: 'buff', target: 'self',
      baseRatio: 0.25, growthRatio: 0.03, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'zy2_s3', name: '赤壁大秀', icon: '🎸',
      desc: '年度最大演出，对全体敌人造成巨额伤害',
      type: 'damage', target: 'all',
      baseMult: 1.6, growthMult: 0.08,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_sunshangxiang': [
    {
      id: 'ssx_s1', name: '弓箭少女连射', icon: '🎮',
      desc: '游戏操作般的高速射击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.7, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'ssx_s2', name: '电竞加速', icon: '⌨️',
      desc: '手速暴增进入超神状态，大幅提升自身速度',
      type: 'buff', target: 'self',
      baseRatio: 0.25, growthRatio: 0.03, effectStat: 'spd', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'ssx_s3', name: '绝杀操作', icon: '🏆',
      desc: '极限操作五杀收割，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2.2, growthMult: 0.10,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_taishici': [
    {
      id: 'tsc_s1', name: '现场连线', icon: '🎤',
      desc: '远程连线攻击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'tsc_s2', name: '采访鼓舞', icon: '📹',
      desc: '鼓舞人心的现场采访，提升全体队友攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'tsc_s3', name: '独家报道', icon: '📡',
      desc: '全场独家播报，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.2, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  // ==================== 群·自由职业者 ====================

  'qun_lvbu': [
    {
      id: 'lvb_s1', name: '方天画戟搅拌器', icon: '🧋',
      desc: '用方天画戟搅拌奶茶和敌人，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2.2, growthMult: 0.10,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'lvb_s2', name: '奶茶续命', icon: '🥤',
      desc: '喝一杯招牌奶茶回血，恢复自身生命',
      type: 'heal', target: 'self',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'lvb_s3', name: '无双奶茶风暴', icon: '🌪️',
      desc: '终极奶茶旋涡，对全体敌人造成巨额伤害',
      type: 'damage', target: 'all',
      baseMult: 1.6, growthMult: 0.08,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_diaochan': [
    {
      id: 'dc_s1', name: '美颜滤镜', icon: '💄',
      desc: '开启美颜让敌人迷惑，降低全体敌人攻击力',
      type: 'debuff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'dc_s2', name: '种草安利', icon: '🌱',
      desc: '推荐好物让全队回血，恢复全体队友生命',
      type: 'heal', target: 'all',
      baseMult: 0.8, growthMult: 0.06,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'dc_s3', name: '闭月羞花·滤镜全开', icon: '🌙',
      desc: '终极美颜让敌人完全迷失，降低全体敌人防御力',
      type: 'debuff', target: 'all',
      baseRatio: 0.18, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_huatuo': [
    {
      id: 'ht_s1', name: '五禽戏直播', icon: '🌿',
      desc: '带领全队做养生操，恢复全体队友生命',
      type: 'heal', target: 'all',
      baseMult: 1.0, growthMult: 0.06,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'ht_s2', name: '麻沸散·安眠版', icon: '💤',
      desc: '让敌人昏昏欲睡，降低全体敌人速度',
      type: 'debuff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'spd', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'ht_s3', name: '妙手回春VIP', icon: '💊',
      desc: '给最虚弱的队友VIP级治疗，恢复大量生命',
      type: 'heal', target: 'ally_lowest_hp',
      baseMult: 2.5, growthMult: 0.10,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  // ==================== 新增36武将技能 ====================
  'shu_fazheng': [
    {
      id: 'fz_s1', name: '奇谋需求文档', icon: '📐',
      desc: '用精准需求砸懵对手，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.8, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'fz_s2', name: '睚眦必报KPI', icon: '📊',
      desc: '给每个敌人设不可能完成的KPI，降低全体敌人防御',
      type: 'debuff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'fz_s3', name: '反杀复盘会', icon: '⚡',
      desc: '深度复盘后精准反杀，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2.2, growthMult: 0.1,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_huangyueying': [
    {
      id: 'hyy_s1', name: '木牛流马快递车', icon: '🤖',
      desc: '释放自动驾驶快递车撞击全场，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.2, growthMult: 0.06,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'hyy_s2', name: '诸葛连弩·改', icon: '🔧',
      desc: '改装后的连弩扫射，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.3, growthMult: 0.06,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'hyy_s3', name: '科技赋能全队', icon: '💡',
      desc: '用黑科技装备提升全队战力，提升全体攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_guanping': [
    {
      id: 'gp_s1', name: '器械辅助训练', icon: '🏋️',
      desc: '用健身器械猛击对手，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.6, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'gp_s2', name: '跑步机追击', icon: '🏃',
      desc: '开最大速度的跑步机追人，提升自身速度',
      type: 'buff', target: 'self',
      baseRatio: 0.2, growthRatio: 0.03, effectStat: 'spd', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'gp_s3', name: '私教课暴击', icon: '💥',
      desc: '一对一私教课全力输出，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2, growthMult: 0.1,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_guanxing': [
    {
      id: 'gx_s1', name: '会员卡连击', icon: '💳',
      desc: '刷卡连击猛砸，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'gx_s2', name: '年卡促销', icon: '🏷️',
      desc: '推出年卡优惠活动激励全队，提升全体攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'gx_s3', name: '前台怒砸键盘', icon: '⌨️',
      desc: '前台小哥终于爆发把键盘砸向全场，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.2, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_zhangbao': [
    {
      id: 'zb_s1', name: '暴力组合拳', icon: '🥊',
      desc: '继承老爹的暴力基因连环出拳，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.7, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'zb_s2', name: '沙袋特训', icon: '🥋',
      desc: '疯狂训练大幅提升自身攻击力',
      type: 'buff', target: 'self',
      baseRatio: 0.25, growthRatio: 0.03, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'zb_s3', name: '父子联合暴击', icon: '💪',
      desc: '脑补老爹附体双倍暴击，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2, growthMult: 0.1,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_masu': [
    {
      id: 'ms_s1', name: '山顶扎营直播', icon: '⛺',
      desc: '在山顶直播教学然后翻车，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.4, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'ms_s2', name: '兵法理论课', icon: '📚',
      desc: '给全队上一节理论课，提升全体防御力',
      type: 'buff', target: 'all',
      baseRatio: 0.1, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'ms_s3', name: '纸上谈兵大招', icon: '📝',
      desc: '理论完美但实践翻车的大招，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_yanyan': [
    {
      id: 'yy_s1', name: '断头不屈罚单', icon: '📋',
      desc: '开出最后的罚单绝不低头，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.3, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'yy_s2', name: '老骥伏枥', icon: '👴',
      desc: '老当益壮气势提升，提升自身攻击力',
      type: 'buff', target: 'self',
      baseRatio: 0.2, growthRatio: 0.03, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'yy_s3', name: '退休城管终极执法', icon: '🚔',
      desc: '退休前最后一次强力执法，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 1.8, growthMult: 0.1,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_liaohua': [
    {
      id: 'lh_s1', name: '实习生逆袭', icon: '📎',
      desc: '实习了一辈子终于爆发，提升全体队友攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'lh_s2', name: '万年打杂积累', icon: '🔨',
      desc: '打了一辈子杂的经验爆发，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.3, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'lh_s3', name: '先锋实习生冲锋', icon: '🚀',
      desc: '蜀中无大将实习生当先锋，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'shu_wangping': [
    {
      id: 'wp_s1', name: '不识字但能打', icon: '👊',
      desc: '看不懂快递单但拳头认识你，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.4, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'wp_s2', name: '包裹防线', icon: '📦',
      desc: '用快递包裹堆成防线，提升全体防御力',
      type: 'buff', target: 'all',
      baseRatio: 0.1, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'wp_s3', name: '暴力分拣', icon: '💢',
      desc: '暴力分拣快递砸向全场，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.1, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_jiaxu': [
    {
      id: 'jx_s1', name: '毒计裁员通知', icon: '🐍',
      desc: '发出无法拒绝的裁员通知，降低全体敌人攻击力',
      type: 'debuff', target: 'all',
      baseRatio: 0.18, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'jx_s2', name: '背刺晋升术', icon: '🗡️',
      desc: '暗中使绊子精准打击，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2, growthMult: 0.1,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'jx_s3', name: '乱世求生指南', icon: '📕',
      desc: '分享职场生存秘籍提升全队战力，提升全体攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.18, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_zhangchunhua': [
    {
      id: 'zch_s1', name: '河东狮吼·董事会版', icon: '🗣️',
      desc: '在董事会上咆哮震慑全场，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.3, growthMult: 0.06,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'zch_s2', name: '虎妻管理学', icon: '👩‍💼',
      desc: '严格管理提升全队纪律，提升全体队友防御力',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'zch_s3', name: '灭族式清盘', icon: '💀',
      desc: '彻底清除竞争对手，对全体敌人造成巨额伤害',
      type: 'damage', target: 'all',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_caopi': [
    {
      id: 'cp_s1', name: '七步裁员诗', icon: '📜',
      desc: '限你七步内交出工牌，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.6, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'cp_s2', name: '禅让式收购', icon: '🤴',
      desc: '和平接管对手公司，降低全体敌人防御力',
      type: 'debuff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'cp_s3', name: '二代CEO光环', icon: '👔',
      desc: '发挥二代光环提升全队士气，提升全体攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_yujin': [
    {
      id: 'yj_s1', name: '军纪处分通知', icon: '📏',
      desc: '下达严厉处分降低士气，降低全体敌人防御力',
      type: 'debuff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'yj_s2', name: '铁面执法', icon: '⚖️',
      desc: '铁面无私执法打击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'yj_s3', name: '军令状突击', icon: '📋',
      desc: '签下军令状全力突击，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.2, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_lidian': [
    {
      id: 'ld_s1', name: '书山压顶', icon: '📖',
      desc: '用成堆的书籍砸向敌人，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'ld_s2', name: '知识就是力量', icon: '🎓',
      desc: '用知识武装全队，提升全体防御力',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'ld_s3', name: '百科全书攻击', icon: '📚',
      desc: '把整套百科全书砸向全场，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.2, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_yuejin': [
    {
      id: 'yje_s1', name: '先登强拆', icon: '⛏️',
      desc: '第一个冲上楼强行拆除，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.7, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'yje_s2', name: '小个子爆发', icon: '💢',
      desc: '身高不够气势来凑，大幅提升自身攻击力',
      type: 'buff', target: 'self',
      baseRatio: 0.25, growthRatio: 0.03, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'yje_s3', name: '拆迁风暴', icon: '🌪️',
      desc: '掀起拆迁风暴横扫全场，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.3, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_chengyu': [
    {
      id: 'cy_s1', name: '黑暗料理投毒', icon: '🍖',
      desc: '用来路不明的食材做饭，降低全体敌人速度',
      type: 'debuff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'spd', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'cy_s2', name: '食堂突击检查', icon: '🔍',
      desc: '突击检查发现违规精准打击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.3, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'cy_s3', name: '满汉全席·毒版', icon: '🍽️',
      desc: '做一桌全是问题的满汉全席，降低全体敌人攻击力',
      type: 'debuff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_manchong': [
    {
      id: 'mc2_s1', name: '暴力执法', icon: '🚨',
      desc: '强行取缔违规摊位，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.4, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'mc2_s2', name: '城管巡逻', icon: '🚔',
      desc: '加强巡逻力度提升全队防御',
      type: 'buff', target: 'all',
      baseRatio: 0.1, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'mc2_s3', name: '联合执法大扫荡', icon: '🧹',
      desc: '联合多部门大扫荡，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.1, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wei_caohong': [
    {
      id: 'ch_s1', name: '铁公鸡防线', icon: '🧮',
      desc: '一毛不拔构建钢铁防线，提升全体队友防御力',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'ch_s2', name: '算盘连珠', icon: '🔢',
      desc: '用算盘珠子连珠弹射，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.3, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'ch_s3', name: '吝啬鬼之怒', icon: '💰',
      desc: '被要求请客吃饭后暴怒，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_sunce': [
    {
      id: 'sc_s1', name: '小霸王连招', icon: '🎮',
      desc: '用格斗游戏连招暴击对手，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2, growthMult: 0.1,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'sc_s2', name: '霸王举鼎直播', icon: '🏆',
      desc: '直播举铁激励全队，提升全体攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.18, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'sc_s3', name: '江东猛虎咆哮', icon: '🐯',
      desc: '霸气咆哮震慑全场，对全体敌人造成巨额伤害',
      type: 'damage', target: 'all',
      baseMult: 1.6, growthMult: 0.08,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_lusu': [
    {
      id: 'ls_s1', name: '和平谈判术', icon: '🤝',
      desc: '以理服人让队友回血，恢复全体队友生命',
      type: 'heal', target: 'all',
      baseMult: 1, growthMult: 0.06,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'ls_s2', name: '商务午餐会', icon: '🍽️',
      desc: '请全队吃商务午餐补充体力，恢复最低血量队友生命',
      type: 'heal', target: 'ally_lowest_hp',
      baseMult: 1.8, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'ls_s3', name: '外交斡旋·最终方案', icon: '📋',
      desc: '抛出最终谈判方案，提升全体攻防',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_xusheng': [
    {
      id: 'xs_s1', name: '疑兵假墙术', icon: '🧱',
      desc: '用道具布置假城墙吓退敌人，降低全体敌人攻击力',
      type: 'debuff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'xs_s2', name: '道具砸人', icon: '🎭',
      desc: '用各种道具砸向对手，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'xs_s3', name: '全场布景术', icon: '🎪',
      desc: '把整个战场变成道具间，降低全体敌人防御力',
      type: 'debuff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_dingfeng': [
    {
      id: 'df_s1', name: '雪中奋短兵', icon: '❄️',
      desc: '老年人不讲武德近身暴击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.7, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'df_s2', name: '老将回春', icon: '🌿',
      desc: '老年电竞选手喝枸杞回血，恢复自身生命',
      type: 'heal', target: 'self',
      baseMult: 1.2, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'df_s3', name: '夕阳红暴走', icon: '🌅',
      desc: '夕阳红战队全力输出，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.3, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_chengpu': [
    {
      id: 'cpu_s1', name: '三朝元老威压', icon: '🎙️',
      desc: '资历压人提升全队士气，提升全体队友防御力',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'cpu_s2', name: '经验之谈', icon: '📖',
      desc: '用多年直播经验精准打击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'cpu_s3', name: '元老级直播间', icon: '📡',
      desc: '开启元老级直播间全场助威，提升全体攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_handang': [
    {
      id: 'hd_s1', name: '综艺体能挑战', icon: '📺',
      desc: '综艺节目特训暴走，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.3, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'hd_s2', name: '老兵不死', icon: '🎖️',
      desc: '老兵坚韧提升自身防御',
      type: 'buff', target: 'self',
      baseRatio: 0.2, growthRatio: 0.03, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'hd_s3', name: '综艺大乱斗', icon: '🎉',
      desc: '综艺节目大乱斗环节全场混战，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_lingtong': [
    {
      id: 'lt_s1', name: '怒火执笔', icon: '✍️',
      desc: '把怒火写进小说化为攻击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'lt_s2', name: '复仇信念', icon: '🔥',
      desc: '复仇的信念提升自身攻击力',
      type: 'buff', target: 'self',
      baseRatio: 0.25, growthRatio: 0.03, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'lt_s3', name: '连载完结暴击', icon: '📕',
      desc: '小说完结篇爆发全部怒火，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2, growthMult: 0.1,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_panzhang': [
    {
      id: 'pz_s1', name: '收缴战利品', icon: '🔄',
      desc: '趁乱搜刮敌方装备削弱对手，降低全体敌人防御力',
      type: 'debuff', target: 'all',
      baseRatio: 0.1, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'pz_s2', name: '二手武器攻击', icon: '⚔️',
      desc: '用收来的二手武器猛击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.4, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'pz_s3', name: '黑市大甩卖', icon: '💸',
      desc: '倾销劣质货搞乱市场，降低全体敌人攻击力',
      type: 'debuff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'wu_buzhi': [
    {
      id: 'bz_s1', name: '公文流转加速', icon: '📋',
      desc: '高效公文处理提升全队效率，提升全体队友速度',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'spd', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'bz_s2', name: '文件夹砸人', icon: '📁',
      desc: '用厚厚的文件夹砸人，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.2, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'bz_s3', name: '行政效率提升', icon: '📈',
      desc: '优化行政流程提升全队防御，提升全体防御力',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_zhangzhongjing': [
    {
      id: 'zzj_s1', name: '伤寒杂病论直播', icon: '📺',
      desc: '在线义诊治愈全队，恢复全体队友生命',
      type: 'heal', target: 'all',
      baseMult: 1, growthMult: 0.06,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'zzj_s2', name: '经方特效药', icon: '💊',
      desc: '开出特效药方精准治疗，恢复最低血量队友大量生命',
      type: 'heal', target: 'ally_lowest_hp',
      baseMult: 2, growthMult: 0.1,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'zzj_s3', name: '医圣降临', icon: '✨',
      desc: '医圣全力施为回血拉满，恢复全体队友大量生命',
      type: 'heal', target: 'all',
      baseMult: 1.4, growthMult: 0.08,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_yuanshu': [
    {
      id: 'ysh_s1', name: '山寨皇帝印', icon: '👑',
      desc: '掏出自封的皇帝大印砸人，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'ysh_s2', name: '仿冒品发布会', icon: '📱',
      desc: '开山寨产品发布会迷惑对手，降低全体敌人攻击力',
      type: 'debuff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'ysh_s3', name: '皇帝梦碎暴走', icon: '💥',
      desc: '皇帝梦破碎后暴怒冲击全场，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.2, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_yanliang': [
    {
      id: 'yl_s1', name: '保镖A号冲锋', icon: '🅰️',
      desc: '职业保镖全力冲锋，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.7, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'yl_s2', name: '金牌保镖气场', icon: '💪',
      desc: '展现金牌保镖气场，提升自身攻击力',
      type: 'buff', target: 'self',
      baseRatio: 0.25, growthRatio: 0.03, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'yl_s3', name: 'AB联合护卫', icon: '🛡️',
      desc: '双保镖联合护卫全力攻击，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2, growthMult: 0.1,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_wenchou': [
    {
      id: 'wc_s1', name: '保镖B号突击', icon: '🅱️',
      desc: '与A号配合双人突击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.6, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'wc_s2', name: '双人配合战术', icon: '🤜',
      desc: '保镖AB组合战术提升全队速度',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'spd', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'wc_s3', name: '保镖暴走模式', icon: '😤',
      desc: '保镖B号进入暴走模式，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.3, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_lvlingqi': [
    {
      id: 'llq_s1', name: '方天画戟·mini版', icon: '🧋',
      desc: '迷你搅拌器高速旋转攻击，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.8, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'llq_s2', name: '奶茶新品研发', icon: '🧪',
      desc: '研发新品奶茶提振士气，提升全体攻击力',
      type: 'buff', target: 'all',
      baseRatio: 0.15, growthRatio: 0.02, effectStat: 'atk', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'llq_s3', name: '女武神降临', icon: '⚡',
      desc: '继承父亲的战斗天赋全力爆发，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.4, growthMult: 0.06,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_zhurong': [
    {
      id: 'zr_s1', name: '飞刀烤肉秀', icon: '🔥',
      desc: '边烤肉边飞刀的极限直播，对全体敌人造成伤害',
      type: 'damage', target: 'all',
      baseMult: 1.3, growthMult: 0.06,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'zr_s2', name: '丛林求生技能', icon: '🌿',
      desc: '野外求生技能自我治疗，恢复自身生命',
      type: 'heal', target: 'self',
      baseMult: 1.3, growthMult: 0.08,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'zr_s3', name: '火神祭祀', icon: '🌋',
      desc: '召唤火神之力焚烧全场，对全体敌人造成巨额伤害',
      type: 'damage', target: 'all',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_gaoshun': [
    {
      id: 'gs_s1', name: '陷阵营突破', icon: '🎖️',
      desc: '率领精锐小队突破防线，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.6, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'gs_s2', name: '特种训练', icon: '🏋️',
      desc: '严格特种兵训练提升全队防御',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'gs_s3', name: '精锐突击', icon: '💀',
      desc: '陷阵营全力突击冲破一切，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 2, growthMult: 0.1,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_chengong': [
    {
      id: 'cg_s1', name: '离职策划书', icon: '📄',
      desc: '写一份致命的离职策划拖垮对手，降低全体敌人速度',
      type: 'debuff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'spd', duration: 2,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'cg_s2', name: '跳槽经验分享', icon: '🚪',
      desc: '丰富的跳槽经验提升全队速度',
      type: 'buff', target: 'all',
      baseRatio: 0.12, growthRatio: 0.02, effectStat: 'spd', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'cg_s3', name: '最后的献策', icon: '💔',
      desc: '临走前最后一个完美方案，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 1.8, growthMult: 0.1,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

  'qun_zhangxiu': [
    {
      id: 'zx_s1', name: '反复横跳突袭', icon: '🔀',
      desc: '反复跳槽积累经验后突然暴起，对单体造成伤害',
      type: 'damage', target: 'single',
      baseMult: 1.5, growthMult: 0.08,
      baseCd: 3, cdLevels: [4, 8], maxLevel: 10
    },
    {
      id: 'zx_s2', name: '墙头草防御', icon: '🌾',
      desc: '两面讨好两面防御，提升自身防御力',
      type: 'buff', target: 'self',
      baseRatio: 0.2, growthRatio: 0.03, effectStat: 'def', duration: 2,
      baseCd: 4, cdLevels: [5, 9], maxLevel: 10
    },
    {
      id: 'zx_s3', name: '临阵倒戈一击', icon: '⚡',
      desc: '关键时刻突然倒戈背刺，对单体造成巨额伤害',
      type: 'damage', target: 'single',
      baseMult: 1.8, growthMult: 0.1,
      baseCd: 5, cdLevels: [5, 9], maxLevel: 10
    }
  ],

};
