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
  ]
};
