/**
 * 武将数据表 — 幻想三国
 * 76 名武将 + 4 种普通兵种
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
  },

  // ==================== 蜀·外卖公司（续） ====================
  {
    id: 'shu_jiangwei',
    name: '姜维',
    title: '加班狂魔',
    faction: 'shu',
    quality: 4,
    emoji: '📋',
    baseAtk: 42,
    baseDef: 34,
    baseHp: 305,
    baseSpd: 38,
    skill: {
      id: 'skill_jw',
      name: '九伐中原计划书',
      description: '提交第九版北伐方案，ATK×170%单体伤害',
      type: 'damage',
      multiplier: 1.7,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_pangtong',
    name: '庞统',
    title: '丑萌程序员',
    faction: 'shu',
    quality: 4,
    emoji: '💻',
    baseAtk: 36,
    baseDef: 36,
    baseHp: 295,
    baseSpd: 36,
    skill: {
      id: 'skill_pt',
      name: '连环Bug部署',
      description: '在敌方系统植入连环Bug，全体敌人DEF-15%持续2回合',
      type: 'debuff',
      multiplier: 0.15,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'def', ratio: -0.15, duration: 2 }
    }
  },
  {
    id: 'shu_weiyan',
    name: '魏延',
    title: '叛逆员工',
    faction: 'shu',
    quality: 3,
    emoji: '😤',
    baseAtk: 52,
    baseDef: 28,
    baseHp: 285,
    baseSpd: 38,
    skill: {
      id: 'skill_wy',
      name: '反骨暴击',
      description: '不服就干，反手一击ATK×180%单体伤害',
      type: 'damage',
      multiplier: 1.8,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },

  // ==================== 魏·草鞋电商帝国（续） ====================
  {
    id: 'wei_guojia',
    name: '郭嘉',
    title: '天才实习生',
    faction: 'wei',
    quality: 4,
    emoji: '🎓',
    baseAtk: 34,
    baseDef: 30,
    baseHp: 280,
    baseSpd: 42,
    skill: {
      id: 'skill_gj',
      name: '十胜十败PPT',
      description: '用精美PPT论证敌方必败，全体敌人ATK-20%持续2回合',
      type: 'debuff',
      multiplier: 0.2,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'atk', ratio: -0.2, duration: 2 }
    }
  },
  {
    id: 'wei_xuchu',
    name: '许褚',
    title: '裸奔健身哥',
    faction: 'wei',
    quality: 3,
    emoji: '💥',
    baseAtk: 54,
    baseDef: 26,
    baseHp: 300,
    baseSpd: 30,
    skill: {
      id: 'skill_xc',
      name: '裸衣斗地主',
      description: '脱掉上衣展示肌肉暴击，ATK×170%单体伤害',
      type: 'damage',
      multiplier: 1.7,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wei_caoren',
    name: '曹仁',
    title: '物业经理',
    faction: 'wei',
    quality: 3,
    emoji: '🏢',
    baseAtk: 38,
    baseDef: 36,
    baseHp: 310,
    baseSpd: 30,
    skill: {
      id: 'skill_cr',
      name: '城防加固方案',
      description: '启动小区安保升级，全体队友DEF+15%持续2回合',
      type: 'buff',
      multiplier: 0.15,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'def', ratio: 0.15, duration: 2 }
    }
  },
  {
    id: 'wei_zhanghe',
    name: '张郃',
    title: '时尚博主',
    faction: 'wei',
    quality: 3,
    emoji: '💅',
    baseAtk: 46,
    baseDef: 30,
    baseHp: 280,
    baseSpd: 42,
    skill: {
      id: 'skill_zh',
      name: '巧变走秀',
      description: '以华丽步伐闪避攻击并反击，ATK×160%单体伤害',
      type: 'damage',
      multiplier: 1.6,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },

  // ==================== 吴·直播娱乐（续） ====================
  {
    id: 'wu_lvmeng',
    name: '吕蒙',
    title: '逆袭学霸',
    faction: 'wu',
    quality: 4,
    emoji: '📚',
    baseAtk: 40,
    baseDef: 36,
    baseHp: 310,
    baseSpd: 36,
    skill: {
      id: 'skill_lm',
      name: '士别三日鸡汤',
      description: '分享逆袭故事激励全队，全体队友ATK+15%持续2回合',
      type: 'buff',
      multiplier: 0.15,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'atk', ratio: 0.15, duration: 2 }
    }
  },
  {
    id: 'wu_luxun',
    name: '陆逊',
    title: '学生会长',
    faction: 'wu',
    quality: 4,
    emoji: '🔥',
    baseAtk: 44,
    baseDef: 32,
    baseHp: 290,
    baseSpd: 40,
    skill: {
      id: 'skill_lx',
      name: '火烧连营企划',
      description: '提交纵火企划书烧遍全场，ATK×140%全体伤害',
      type: 'damage',
      multiplier: 1.4,
      target: 'all',
      cooldown: 4,
      effect: null
    }
  },
  {
    id: 'wu_ganning',
    name: '甘宁',
    title: '前海盗主播',
    faction: 'wu',
    quality: 3,
    emoji: '🔔',
    baseAtk: 50,
    baseDef: 28,
    baseHp: 280,
    baseSpd: 42,
    skill: {
      id: 'skill_gn',
      name: '百骑劫营秀',
      description: '直播突袭表演，ATK×170%单体伤害',
      type: 'damage',
      multiplier: 1.7,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wu_huanggai',
    name: '黄盖',
    title: '挨打专业户',
    faction: 'wu',
    quality: 3,
    emoji: '🤕',
    baseAtk: 40,
    baseDef: 35,
    baseHp: 300,
    baseSpd: 30,
    skill: {
      id: 'skill_hg',
      name: '苦肉计营销',
      description: '先挨打再卖惨博同情，全体队友DEF+15%持续2回合',
      type: 'buff',
      multiplier: 0.15,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'def', ratio: 0.15, duration: 2 }
    }
  },
  {
    id: 'wu_daqiao',
    name: '大乔',
    title: '后勤大姐',
    faction: 'wu',
    quality: 3,
    emoji: '🌸',
    baseAtk: 28,
    baseDef: 30,
    baseHp: 290,
    baseSpd: 35,
    skill: {
      id: 'skill_dq',
      name: '江东花茶',
      description: '泡一壶养生花茶，恢复最低血量队友ATK×140%HP',
      type: 'heal',
      multiplier: 1.4,
      target: 'ally_lowest_hp',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wu_xiaoqiao',
    name: '小乔',
    title: '才艺女主播',
    faction: 'wu',
    quality: 3,
    emoji: '🎵',
    baseAtk: 30,
    baseDef: 28,
    baseHp: 280,
    baseSpd: 38,
    skill: {
      id: 'skill_xq',
      name: '天籁治愈曲',
      description: '弹奏治愈系音乐，恢复全体ATK×80%HP',
      type: 'heal',
      multiplier: 0.8,
      target: 'all',
      cooldown: 4,
      effect: null
    }
  },

  // ==================== 群·自由职业者（续） ====================
  {
    id: 'qun_yuanshao',
    name: '袁绍',
    title: '富二代投资人',
    faction: 'qun',
    quality: 4,
    emoji: '💰',
    baseAtk: 36,
    baseDef: 38,
    baseHp: 340,
    baseSpd: 30,
    skill: {
      id: 'skill_ys',
      name: '四世三公名片',
      description: '亮出家族名片全场震慑，全体队友ATK+20%持续2回合',
      type: 'buff',
      multiplier: 0.2,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'atk', ratio: 0.2, duration: 2 }
    }
  },
  {
    id: 'qun_dongzhuo',
    name: '董卓',
    title: '暴力拆迁总裁',
    faction: 'qun',
    quality: 5,
    emoji: '😈',
    baseAtk: 52,
    baseDef: 40,
    baseHp: 350,
    baseSpd: 28,
    skill: {
      id: 'skill_dz',
      name: '焚城拆迁令',
      description: '下达强拆通知书火烧全场，ATK×150%全体伤害',
      type: 'damage',
      multiplier: 1.5,
      target: 'all',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'qun_zhangjiao',
    name: '张角',
    title: '邪教自媒体',
    faction: 'qun',
    quality: 5,
    emoji: '⛈️',
    baseAtk: 48,
    baseDef: 38,
    baseHp: 340,
    baseSpd: 34,
    skill: {
      id: 'skill_zj',
      name: '苍天已死直播',
      description: '在线算命引发天雷，ATK×140%全体伤害',
      type: 'damage',
      multiplier: 1.4,
      target: 'all',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'qun_gongsunzan',
    name: '公孙瓒',
    title: '赛马俱乐部长',
    faction: 'qun',
    quality: 3,
    emoji: '🐎',
    baseAtk: 46,
    baseDef: 30,
    baseHp: 285,
    baseSpd: 42,
    skill: {
      id: 'skill_gsz',
      name: '白马义从冲锋',
      description: '率领白马骑兵团冲锋，ATK×160%单体伤害',
      type: 'damage',
      multiplier: 1.6,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'qun_zuoci',
    name: '左慈',
    title: '魔术网红',
    faction: 'qun',
    quality: 4,
    emoji: '🎩',
    baseAtk: 38,
    baseDef: 34,
    baseHp: 290,
    baseSpd: 40,
    skill: {
      id: 'skill_zc',
      name: '仙术整蛊',
      description: '施展魔术戏弄敌人，全体敌人SPD-20%持续2回合',
      type: 'debuff',
      multiplier: 0.2,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'spd', ratio: -0.2, duration: 2 }
    }
  },
  {
    id: 'qun_caiwenji',
    name: '蔡文姬',
    title: '独立音乐人',
    faction: 'qun',
    quality: 4,
    emoji: '🎻',
    baseAtk: 28,
    baseDef: 32,
    baseHp: 320,
    baseSpd: 36,
    skill: {
      id: 'skill_cwj',
      name: '胡笳十八拍',
      description: '演奏悲壮乐曲治愈全场，恢复全体ATK×110%HP',
      type: 'heal',
      multiplier: 1.1,
      target: 'all',
      cooldown: 4,
      effect: null
    }
  },
  {
    id: 'qun_menghuo',
    name: '孟获',
    title: '七次创业者',
    faction: 'qun',
    quality: 3,
    emoji: '🐘',
    baseAtk: 50,
    baseDef: 34,
    baseHp: 305,
    baseSpd: 28,
    skill: {
      id: 'skill_mh',
      name: '南蛮象冲',
      description: '骑大象横冲直撞，ATK×170%单体伤害',
      type: 'damage',
      multiplier: 1.7,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  }
,

  // ==================== 蜀·外卖公司（新增） ====================
  {
    id: 'shu_fazheng',
    name: '法正',
    title: '产品经理',
    faction: 'shu',
    quality: 4,
    emoji: '📐',
    baseAtk: 40,
    baseDef: 35,
    baseHp: 290,
    baseSpd: 36,
    skill: {
      id: 'skill_fz',
      name: '奇谋需求文档',
      description: '用精准需求砸懵对手，ATK×180%单体伤害',
      type: 'damage',
      multiplier: 1.8,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_huangyueying',
    name: '黄月英',
    title: '硬件极客',
    faction: 'shu',
    quality: 4,
    emoji: '🔧',
    baseAtk: 38,
    baseDef: 38,
    baseHp: 310,
    baseSpd: 34,
    skill: {
      id: 'skill_hyy',
      name: '木牛流马快递车',
      description: '释放自动驾驶快递车撞击全场，ATK×130%全体伤害',
      type: 'damage',
      multiplier: 1.3,
      target: 'all',
      cooldown: 4,
      effect: null
    }
  },
  {
    id: 'shu_guanping',
    name: '关平',
    title: '健身教练助理',
    faction: 'shu',
    quality: 3,
    emoji: '🏃',
    baseAtk: 42,
    baseDef: 32,
    baseHp: 290,
    baseSpd: 36,
    skill: {
      id: 'skill_gp',
      name: '器械辅助训练',
      description: '辅助教学反手一击，ATK×160%单体伤害',
      type: 'damage',
      multiplier: 1.6,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_guanxing',
    name: '关兴',
    title: '健身房前台',
    faction: 'shu',
    quality: 3,
    emoji: '💳',
    baseAtk: 40,
    baseDef: 30,
    baseHp: 280,
    baseSpd: 38,
    skill: {
      id: 'skill_gx',
      name: '会员卡连击',
      description: '刷卡连击猛砸，ATK×150%单体伤害',
      type: 'damage',
      multiplier: 1.5,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_zhangbao',
    name: '张苞',
    title: '拳击教练',
    faction: 'shu',
    quality: 3,
    emoji: '🥊',
    baseAtk: 46,
    baseDef: 28,
    baseHp: 275,
    baseSpd: 36,
    skill: {
      id: 'skill_zb',
      name: '暴力组合拳',
      description: '继承老爹的暴力基因连环出拳，ATK×170%单体伤害',
      type: 'damage',
      multiplier: 1.7,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_masu',
    name: '马谡',
    title: '纸上谈兵UP主',
    faction: 'shu',
    quality: 2,
    emoji: '📝',
    baseAtk: 30,
    baseDef: 24,
    baseHp: 250,
    baseSpd: 32,
    skill: {
      id: 'skill_ms',
      name: '山顶扎营直播',
      description: '在山顶直播教学翻车，ATK×140%单体伤害',
      type: 'damage',
      multiplier: 1.4,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_yanyan',
    name: '严颜',
    title: '退休城管',
    faction: 'shu',
    quality: 2,
    emoji: '👴',
    baseAtk: 28,
    baseDef: 28,
    baseHp: 270,
    baseSpd: 28,
    skill: {
      id: 'skill_yy',
      name: '断头不屈罚单',
      description: '开出最后的罚单绝不低头，ATK×130%单体伤害',
      type: 'damage',
      multiplier: 1.3,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'shu_liaohua',
    name: '廖化',
    title: '万年实习生',
    faction: 'shu',
    quality: 2,
    emoji: '📎',
    baseAtk: 26,
    baseDef: 26,
    baseHp: 260,
    baseSpd: 30,
    skill: {
      id: 'skill_lh',
      name: '实习生逆袭',
      description: '实习了一辈子终于转正爆发，全体队友ATK+12%持续2回合',
      type: 'buff',
      multiplier: 0.12,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'atk', ratio: 0.12, duration: 2 }
    }
  },
  {
    id: 'shu_wangping',
    name: '王平',
    title: '文盲快递站长',
    faction: 'shu',
    quality: 2,
    emoji: '📦',
    baseAtk: 30,
    baseDef: 28,
    baseHp: 265,
    baseSpd: 30,
    skill: {
      id: 'skill_wp',
      name: '不识字但能打',
      description: '看不懂快递单但拳头认识你，ATK×140%单体伤害',
      type: 'damage',
      multiplier: 1.4,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },

  // ==================== 魏·草鞋电商帝国（新增） ====================
  {
    id: 'wei_jiaxu',
    name: '贾诩',
    title: '毒舌HR总监',
    faction: 'wei',
    quality: 5,
    emoji: '🐍',
    baseAtk: 44,
    baseDef: 40,
    baseHp: 340,
    baseSpd: 38,
    skill: {
      id: 'skill_jx',
      name: '毒计裁员通知',
      description: '发出无法拒绝的裁员通知，全体敌人ATK-20%持续2回合',
      type: 'debuff',
      multiplier: 0.2,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'atk', ratio: -0.2, duration: 2 }
    }
  },
  {
    id: 'wei_zhangchunhua',
    name: '张春华',
    title: '虎妻CEO',
    faction: 'wei',
    quality: 4,
    emoji: '👩‍💼',
    baseAtk: 42,
    baseDef: 38,
    baseHp: 310,
    baseSpd: 36,
    skill: {
      id: 'skill_zch',
      name: '河东狮吼·董事会版',
      description: '在董事会上咆哮震慑全场，ATK×140%全体伤害',
      type: 'damage',
      multiplier: 1.4,
      target: 'all',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wei_caopi',
    name: '曹丕',
    title: '二代接班人',
    faction: 'wei',
    quality: 4,
    emoji: '🤴',
    baseAtk: 40,
    baseDef: 36,
    baseHp: 300,
    baseSpd: 38,
    skill: {
      id: 'skill_cp',
      name: '七步裁员诗',
      description: '限你七步内交出工牌，ATK×160%单体伤害',
      type: 'damage',
      multiplier: 1.6,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wei_yujin',
    name: '于禁',
    title: '纪律委员',
    faction: 'wei',
    quality: 3,
    emoji: '📏',
    baseAtk: 38,
    baseDef: 35,
    baseHp: 300,
    baseSpd: 32,
    skill: {
      id: 'skill_yj',
      name: '军纪处分通知',
      description: '下达严厉处分降低士气，全体敌人DEF-12%持续2回合',
      type: 'debuff',
      multiplier: 0.12,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'def', ratio: -0.12, duration: 2 }
    }
  },
  {
    id: 'wei_lidian',
    name: '李典',
    title: '图书管理员',
    faction: 'wei',
    quality: 3,
    emoji: '📖',
    baseAtk: 36,
    baseDef: 34,
    baseHp: 295,
    baseSpd: 34,
    skill: {
      id: 'skill_ld',
      name: '书山压顶',
      description: '用成堆的书籍砸向敌人，ATK×150%单体伤害',
      type: 'damage',
      multiplier: 1.5,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wei_yuejin',
    name: '乐进',
    title: '矮个子拆迁队',
    faction: 'wei',
    quality: 3,
    emoji: '⛏️',
    baseAtk: 44,
    baseDef: 30,
    baseHp: 270,
    baseSpd: 40,
    skill: {
      id: 'skill_yje',
      name: '先登强拆',
      description: '第一个冲上楼强行拆除，ATK×170%单体伤害',
      type: 'damage',
      multiplier: 1.7,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wei_chengyu',
    name: '程昱',
    title: '黑心食堂大厨',
    faction: 'wei',
    quality: 2,
    emoji: '🍖',
    baseAtk: 28,
    baseDef: 26,
    baseHp: 260,
    baseSpd: 30,
    skill: {
      id: 'skill_cy',
      name: '黑暗料理投毒',
      description: '用来路不明的食材做饭，全体敌人SPD-12%持续2回合',
      type: 'debuff',
      multiplier: 0.12,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'spd', ratio: -0.12, duration: 2 }
    }
  },
  {
    id: 'wei_manchong',
    name: '满宠',
    title: '城管执法队长',
    faction: 'wei',
    quality: 2,
    emoji: '🚨',
    baseAtk: 30,
    baseDef: 30,
    baseHp: 270,
    baseSpd: 28,
    skill: {
      id: 'skill_mc2',
      name: '暴力执法',
      description: '强行取缔违规摊位，ATK×140%单体伤害',
      type: 'damage',
      multiplier: 1.4,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wei_caohong',
    name: '曹洪',
    title: '守财奴会计',
    faction: 'wei',
    quality: 2,
    emoji: '🧮',
    baseAtk: 26,
    baseDef: 28,
    baseHp: 280,
    baseSpd: 28,
    skill: {
      id: 'skill_ch',
      name: '铁公鸡防线',
      description: '一毛不拔构建钢铁防线，全体队友DEF+12%持续2回合',
      type: 'buff',
      multiplier: 0.12,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'def', ratio: 0.12, duration: 2 }
    }
  },

  // ==================== 吴·直播娱乐（新增） ====================
  {
    id: 'wu_sunce',
    name: '孙策',
    title: '格斗游戏主播',
    faction: 'wu',
    quality: 5,
    emoji: '🎮',
    baseAtk: 55,
    baseDef: 38,
    baseHp: 320,
    baseSpd: 40,
    skill: {
      id: 'skill_sc',
      name: '小霸王连招',
      description: '用格斗游戏连招暴击全场，ATK×200%单体伤害',
      type: 'damage',
      multiplier: 2,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wu_lusu',
    name: '鲁肃',
    title: '商务谈判专家',
    faction: 'wu',
    quality: 4,
    emoji: '🤝',
    baseAtk: 34,
    baseDef: 40,
    baseHp: 330,
    baseSpd: 32,
    skill: {
      id: 'skill_ls',
      name: '和平谈判术',
      description: '以理服人让队友回血，恢复全体ATK×100%HP',
      type: 'heal',
      multiplier: 1,
      target: 'all',
      cooldown: 4,
      effect: null
    }
  },
  {
    id: 'wu_xusheng',
    name: '徐盛',
    title: '道具大师',
    faction: 'wu',
    quality: 3,
    emoji: '🎭',
    baseAtk: 40,
    baseDef: 34,
    baseHp: 290,
    baseSpd: 34,
    skill: {
      id: 'skill_xs',
      name: '疑兵假墙术',
      description: '用道具布置假城墙吓退敌人，全体敌人ATK-12%持续2回合',
      type: 'debuff',
      multiplier: 0.12,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'atk', ratio: -0.12, duration: 2 }
    }
  },
  {
    id: 'wu_dingfeng',
    name: '丁奉',
    title: '老年电竞选手',
    faction: 'wu',
    quality: 3,
    emoji: '🎯',
    baseAtk: 44,
    baseDef: 30,
    baseHp: 280,
    baseSpd: 38,
    skill: {
      id: 'skill_df',
      name: '雪中奋短兵',
      description: '老年人不讲武德近身暴击，ATK×170%单体伤害',
      type: 'damage',
      multiplier: 1.7,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wu_chengpu',
    name: '程普',
    title: '元老级主播',
    faction: 'wu',
    quality: 3,
    emoji: '🎙️',
    baseAtk: 38,
    baseDef: 36,
    baseHp: 300,
    baseSpd: 32,
    skill: {
      id: 'skill_cpu',
      name: '三朝元老威压',
      description: '资历压人提升全队士气，全体队友DEF+12%持续2回合',
      type: 'buff',
      multiplier: 0.12,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'def', ratio: 0.12, duration: 2 }
    }
  },
  {
    id: 'wu_handang',
    name: '韩当',
    title: '综艺老兵',
    faction: 'wu',
    quality: 2,
    emoji: '📺',
    baseAtk: 32,
    baseDef: 28,
    baseHp: 265,
    baseSpd: 30,
    skill: {
      id: 'skill_hd',
      name: '综艺体能挑战',
      description: '综艺节目特训暴走，ATK×130%单体伤害',
      type: 'damage',
      multiplier: 1.3,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wu_lingtong',
    name: '凌统',
    title: '复仇系网文作者',
    faction: 'wu',
    quality: 2,
    emoji: '✍️',
    baseAtk: 34,
    baseDef: 24,
    baseHp: 250,
    baseSpd: 34,
    skill: {
      id: 'skill_lt',
      name: '怒火执笔',
      description: '把怒火写进小说化为攻击，ATK×150%单体伤害',
      type: 'damage',
      multiplier: 1.5,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'wu_panzhang',
    name: '潘璋',
    title: '二手交易贩子',
    faction: 'wu',
    quality: 2,
    emoji: '🔄',
    baseAtk: 30,
    baseDef: 26,
    baseHp: 260,
    baseSpd: 32,
    skill: {
      id: 'skill_pz',
      name: '收缴战利品',
      description: '趁乱搜刮敌方装备削弱对手，全体敌人DEF-10%持续2回合',
      type: 'debuff',
      multiplier: 0.1,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'def', ratio: -0.1, duration: 2 }
    }
  },
  {
    id: 'wu_buzhi',
    name: '步骘',
    title: '行政文员',
    faction: 'wu',
    quality: 2,
    emoji: '📋',
    baseAtk: 25,
    baseDef: 30,
    baseHp: 275,
    baseSpd: 30,
    skill: {
      id: 'skill_bz',
      name: '公文流转加速',
      description: '高效公文处理提升全队效率，全体队友SPD+12%持续2回合',
      type: 'buff',
      multiplier: 0.12,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'spd', ratio: 0.12, duration: 2 }
    }
  },

  // ==================== 群·自由职业者（新增） ====================
  {
    id: 'qun_zhangzhongjing',
    name: '张仲景',
    title: '中医科普大V',
    faction: 'qun',
    quality: 4,
    emoji: '💊',
    baseAtk: 30,
    baseDef: 36,
    baseHp: 330,
    baseSpd: 34,
    skill: {
      id: 'skill_zzj',
      name: '伤寒杂病论直播',
      description: '在线义诊治愈全队，恢复全体ATK×110%HP',
      type: 'heal',
      multiplier: 1.1,
      target: 'all',
      cooldown: 4,
      effect: null
    }
  },
  {
    id: 'qun_yuanshu',
    name: '袁术',
    title: '山寨手机厂长',
    faction: 'qun',
    quality: 3,
    emoji: '📱',
    baseAtk: 36,
    baseDef: 32,
    baseHp: 295,
    baseSpd: 30,
    skill: {
      id: 'skill_ysh',
      name: '山寨皇帝印',
      description: '掏出自封的皇帝大印砸人，ATK×150%单体伤害',
      type: 'damage',
      multiplier: 1.5,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'qun_yanliang',
    name: '颜良',
    title: '保镖A',
    faction: 'qun',
    quality: 3,
    emoji: '🅰️',
    baseAtk: 48,
    baseDef: 28,
    baseHp: 280,
    baseSpd: 34,
    skill: {
      id: 'skill_yl',
      name: '保镖A号冲锋',
      description: '职业保镖全力冲锋，ATK×170%单体伤害',
      type: 'damage',
      multiplier: 1.7,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'qun_wenchou',
    name: '文丑',
    title: '保镖B',
    faction: 'qun',
    quality: 3,
    emoji: '🅱️',
    baseAtk: 46,
    baseDef: 30,
    baseHp: 285,
    baseSpd: 36,
    skill: {
      id: 'skill_wc',
      name: '保镖B号突击',
      description: '与A号配合双人突击，ATK×160%单体伤害',
      type: 'damage',
      multiplier: 1.6,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'qun_lvlingqi',
    name: '吕玲绮',
    title: '奶茶店继承人',
    faction: 'qun',
    quality: 4,
    emoji: '🧋',
    baseAtk: 44,
    baseDef: 32,
    baseHp: 290,
    baseSpd: 40,
    skill: {
      id: 'skill_llq',
      name: '方天画戟·mini版',
      description: '迷你搅拌器高速旋转攻击，ATK×180%单体伤害',
      type: 'damage',
      multiplier: 1.8,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'qun_zhurong',
    name: '祝融',
    title: '户外探险主播',
    faction: 'qun',
    quality: 4,
    emoji: '🔥',
    baseAtk: 46,
    baseDef: 30,
    baseHp: 300,
    baseSpd: 38,
    skill: {
      id: 'skill_zr',
      name: '飞刀烤肉秀',
      description: '边烤肉边飞刀的极限直播，ATK×140%全体伤害',
      type: 'damage',
      multiplier: 1.4,
      target: 'all',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'qun_gaoshun',
    name: '高顺',
    title: '特种兵教官',
    faction: 'qun',
    quality: 3,
    emoji: '🎖️',
    baseAtk: 42,
    baseDef: 35,
    baseHp: 300,
    baseSpd: 34,
    skill: {
      id: 'skill_gs',
      name: '陷阵营突破',
      description: '率领精锐小队突破防线，ATK×160%单体伤害',
      type: 'damage',
      multiplier: 1.6,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
  {
    id: 'qun_chengong',
    name: '陈宫',
    title: '跳槽专家',
    faction: 'qun',
    quality: 3,
    emoji: '🚪',
    baseAtk: 34,
    baseDef: 32,
    baseHp: 280,
    baseSpd: 36,
    skill: {
      id: 'skill_cg',
      name: '离职策划书',
      description: '写一份致命的离职策划拖垮对手，全体敌人SPD-12%持续2回合',
      type: 'debuff',
      multiplier: 0.12,
      target: 'all',
      cooldown: 4,
      effect: { stat: 'spd', ratio: -0.12, duration: 2 }
    }
  },
  {
    id: 'qun_zhangxiu',
    name: '张绣',
    title: '反复横跳UP主',
    faction: 'qun',
    quality: 2,
    emoji: '🔀',
    baseAtk: 32,
    baseDef: 26,
    baseHp: 255,
    baseSpd: 34,
    skill: {
      id: 'skill_zx',
      name: '反复横跳突袭',
      description: '反复跳槽积累经验后突然暴起，ATK×150%单体伤害',
      type: 'damage',
      multiplier: 1.5,
      target: 'single',
      cooldown: 3,
      effect: null
    }
  },
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
  5: ['shu_zhugeliang', 'shu_liubei', 'shu_guanyu', 'wei_caocao', 'wei_simayi', 'wu_sunquan', 'qun_lvbu', 'qun_dongzhuo', 'qun_zhangjiao', 'wei_jiaxu', 'wu_sunce'],
  4: ['shu_zhangfei', 'shu_zhaoyun', 'shu_huangzhong', 'wei_xiahoudun', 'wu_zhouyu', 'qun_diaochan', 'qun_huatuo', 'shu_jiangwei', 'shu_pangtong', 'wei_guojia', 'wu_lvmeng', 'wu_luxun', 'qun_yuanshao', 'qun_zuoci', 'qun_caiwenji', 'shu_fazheng', 'shu_huangyueying', 'wei_zhangchunhua', 'wei_caopi', 'wu_lusu', 'qun_zhangzhongjing', 'qun_lvlingqi', 'qun_zhurong'],
  3: ['shu_machao', 'wei_zhangliao', 'wei_dianwei', 'wu_sunshangxiang', 'shu_weiyan', 'wei_xuchu', 'wei_caoren', 'wei_zhanghe', 'wu_ganning', 'wu_huanggai', 'wu_daqiao', 'wu_xiaoqiao', 'qun_gongsunzan', 'qun_menghuo', 'shu_guanping', 'shu_guanxing', 'shu_zhangbao', 'wei_yujin', 'wei_lidian', 'wei_yuejin', 'wu_xusheng', 'wu_dingfeng', 'wu_chengpu', 'qun_yuanshu', 'qun_yanliang', 'qun_wenchou', 'qun_gaoshun', 'qun_chengong'],
  2: ['wei_xunyu', 'wu_taishici', 'shu_masu', 'shu_yanyan', 'shu_liaohua', 'shu_wangping', 'wei_chengyu', 'wei_manchong', 'wei_caohong', 'wu_handang', 'wu_lingtong', 'wu_panzhang', 'wu_buzhi', 'qun_zhangxiu'],
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
