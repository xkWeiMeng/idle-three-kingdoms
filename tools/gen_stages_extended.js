/**
 * 主线关卡扩展生成器 — 生成第6~15章（100个关卡）
 * 运行: node tools/gen_stages_extended.js >> 输出到 stdout
 * 然后手动粘贴到 stages.js 的 StageData 数组末尾（]; 之前）
 */

// ── 章节配置 ──
const chapters = [
  // ===== 第六章：社区团购风波 =====
  {
    num: 6,
    title: '社区团购风波',
    baseAtk: 65,
    foodBase: 8,
    equipDropRate: 0.12,
    equipWeights: { 1: 0, 2: 10, 3: 30, 4: 40, 5: 18, 6: 2 },
    bossEquipWeights: { 1: 0, 2: 5, 3: 20, 4: 40, 5: 30, 6: 5 },
    jadeRegular: 12,
    jadeBoss: 40,
    rewardGoldBase: 300,
    rewardExpBase: 180,
    rewardResources: { food: 5, wood: 30, stone: 30, iron: 25 },
    mobs: ['团长大妈', '凑单达人', '鸡蛋争夺者', '优惠券收割机', '接龙高手', '提货点守卫'],
    elites: ['片区经理', '供应商代表'],
    boss: {
      name: '团购女皇',
      skill: { name: '全民拼团核弹', type: 'damage', multiplier: 2.0, target: 'all', cd: 3 }
    },
    stages: [
      { name: '小区门口摊位', desc: '社区门口的临时取货点，大妈们蠢蠢欲动' },
      { name: '优惠券争夺战', desc: '限量优惠券引发混乱，手慢无！' },
      { name: '鸡蛋补货点', desc: '据说有9.9包邮的鸡蛋到货了' },
      { name: '接龙群聊', desc: '微信群接龙大战，错过就是过错' },
      { name: '冷链仓库', desc: '生鲜冷链的核心据点，有精英把守' },
      { name: '社区广场大厅', desc: '多个团长势力在此交锋' },
      { name: '批发采购中心', desc: '源头采购的兵家必争之地' },
      { name: '中心仓库', desc: '团购帝国的物资总汇，守卫森严' },
      { name: '后台结算室', desc: '掌控资金流向的核心区域' },
      { name: '团购帝国总部', desc: '击败团购女皇，终结社区团购霸权' }
    ]
  },

  // ===== 第七章：网约车帝国 =====
  {
    num: 7,
    title: '网约车帝国',
    baseAtk: 82,
    foodBase: 9,
    equipDropRate: 0.11,
    equipWeights: { 1: 0, 2: 5, 3: 25, 4: 40, 5: 25, 6: 5 },
    bossEquipWeights: { 1: 0, 2: 0, 3: 18, 4: 38, 5: 35, 6: 9 },
    jadeRegular: 12,
    jadeBoss: 40,
    rewardGoldBase: 450,
    rewardExpBase: 270,
    rewardResources: { food: 6, wood: 35, stone: 35, iron: 30 },
    mobs: ['抢单司机', '绕路老手', '拼车拒绝者', '计价器黑客', '五星好评怪', '接单导航员'],
    elites: ['运营总监', '区域经理'],
    boss: {
      name: '打车巨头',
      skill: { name: '动态溢价风暴', type: 'damage', multiplier: 2.5, target: 'single', cd: 3 }
    },
    stages: [
      { name: '地铁站出口', desc: '乘客蜂拥而出，司机疯狂抢单' },
      { name: '机场接机区', desc: '高价订单的黄金地段，竞争惨烈' },
      { name: '高峰期立交桥', desc: '堵车就是战场，动态定价飙升' },
      { name: '半夜代驾区', desc: '夜间订单的暗黑丛林' },
      { name: '调度算法中心', desc: '控制派单算法的核心设施' },
      { name: '司机服务站', desc: '老司机的据点，经验丰富的对手出没' },
      { name: '顺风车集散地', desc: '拼车匹配的混乱战场' },
      { name: '平台补贴大厅', desc: '烧钱大战的指挥中心' },
      { name: '数据中枢', desc: '掌控全城出行数据的要塞' },
      { name: '网约车帝国总部', desc: '击败打车巨头，打破出行垄断' }
    ]
  },

  // ===== 第八章：金融风暴 =====
  {
    num: 8,
    title: '金融风暴',
    baseAtk: 103,
    foodBase: 10,
    equipDropRate: 0.10,
    equipWeights: { 1: 0, 2: 0, 3: 20, 4: 40, 5: 32, 6: 8 },
    bossEquipWeights: { 1: 0, 2: 0, 3: 10, 4: 35, 5: 40, 6: 15 },
    jadeRegular: 15,
    jadeBoss: 50,
    rewardGoldBase: 620,
    rewardExpBase: 372,
    rewardResources: { food: 7, wood: 40, stone: 40, iron: 38 },
    mobs: ['韭菜收割者', '杠杆玩家', '做空猎手', '追涨杀跌怪', '内幕交易员', '量化机器人'],
    elites: ['基金经理', '私募大佬'],
    boss: {
      name: '华尔街之狼',
      skill: { name: '市场崩盘', type: 'debuff', multiplier: 0, target: 'all', cd: 4, effect: { stat: 'atk', ratio: -0.25, duration: 3 } }
    },
    stages: [
      { name: '散户大厅', desc: '无数散户在此横冲直撞' },
      { name: '杠杆交易区', desc: '高杠杆的疯狂，一秒天堂一秒地狱' },
      { name: '期货交割日', desc: '交割日的疯狂多空对决' },
      { name: '量化交易机房', desc: '算法交易的核心，毫秒级对决' },
      { name: '做空裁判所', desc: '做空势力的巢穴，精英出没' },
      { name: '私募会所', desc: '隐秘的私募基金聚集地' },
      { name: '暗池交易区', desc: '大宗暗池交易的灰色地带' },
      { name: '评级机构', desc: '掌控信用评级的权力中心' },
      { name: '央行会议室', desc: '决定货币政策的最高殿堂' },
      { name: '金融帝国穹顶', desc: '击败华尔街之狼，终结金融暴政' }
    ]
  },

  // ===== 第九章：元宇宙入侵 =====
  {
    num: 9,
    title: '元宇宙入侵',
    baseAtk: 130,
    foodBase: 12,
    equipDropRate: 0.10,
    equipWeights: { 1: 0, 2: 0, 3: 15, 4: 35, 5: 38, 6: 12 },
    bossEquipWeights: { 1: 0, 2: 0, 3: 5, 4: 30, 5: 42, 6: 23 },
    jadeRegular: 15,
    jadeBoss: 50,
    rewardGoldBase: 820,
    rewardExpBase: 492,
    rewardResources: { food: 8, wood: 50, stone: 50, iron: 48 },
    mobs: ['虚拟化身', '数字幽灵', 'NFT守卫', '像素战士', '代码傀儡', '数据碎灵'],
    elites: ['区块链巨人', '元宇宙先锋'],
    boss: {
      name: '元宇宙主宰',
      skill: { name: '数据风暴', type: 'damage', multiplier: 2.0, target: 'all', cd: 3, effect: { stat: 'def', ratio: -0.2, duration: 2 } }
    },
    stages: [
      { name: '虚拟入口', desc: '现实与虚拟的交界处，低级数据体出没' },
      { name: '像素废墟', desc: '崩坏的虚拟城市残骸' },
      { name: 'NFT画廊', desc: '数字艺术品化作了敌人' },
      { name: '代码荒原', desc: '无尽的代码荒漠，傀儡横行' },
      { name: '区块链堡垒', desc: '去中心化的坚固据点' },
      { name: '数字孪生城', desc: '现实城市的虚拟映射，亦真亦幻' },
      { name: '算力矿场', desc: '疯狂挖矿的算力中心' },
      { name: '共识之塔', desc: '网络共识机制的核心塔楼' },
      { name: '创世服务器', desc: '元宇宙最初始的服务器群' },
      { name: '元宇宙核心', desc: '击败元宇宙主宰，粉碎虚拟暴政' }
    ]
  },

  // ===== 第十章：AI觉醒 =====
  {
    num: 10,
    title: 'AI觉醒',
    baseAtk: 163,
    foodBase: 14,
    equipDropRate: 0.09,
    equipWeights: { 1: 0, 2: 0, 3: 10, 4: 30, 5: 42, 6: 18 },
    bossEquipWeights: { 1: 0, 2: 0, 3: 0, 4: 25, 5: 45, 6: 30 },
    jadeRegular: 18,
    jadeBoss: 60,
    rewardGoldBase: 1050,
    rewardExpBase: 630,
    rewardResources: { food: 10, wood: 62, stone: 62, iron: 60 },
    mobs: ['机器学习体', '深度网络兽', '算法猎手', '训练集亡灵', '过拟合怪', '梯度下降魔'],
    elites: ['神经网络核心', 'GPU集群守卫'],
    boss: {
      name: '超级AI',
      skill: { name: '奇点降临', type: 'damage', multiplier: 2.5, target: 'single', cd: 3 }
    },
    // Ch10 boss fight has a sub-boss
    bossAdds: [
      { name: 'AI分身', atk_ratio: 0.45, def_ratio: 0.6, hp_ratio: 0.25, skill: { name: '学习进化', type: 'buff', multiplier: 0.2, target: 'all', cd: 4, effect: { stat: 'atk', ratio: 0.2, duration: 2 } } }
    ],
    stages: [
      { name: '数据标注车间', desc: '无数标注工人化为AI的养分' },
      { name: '训练沙盒', desc: 'AI的试验场，充满不稳定的模型' },
      { name: '过拟合深渊', desc: '过度训练的AI失控暴走' },
      { name: '参数调优室', desc: '精密调参的核心区域' },
      { name: 'GPU运算阵列', desc: '算力怪兽驻守的关键节点' },
      { name: '多模态融合区', desc: '视觉、语言、推理的三重威胁' },
      { name: '强化学习竞技场', desc: 'AI通过对战不断进化' },
      { name: '涌现能力之门', desc: '大模型涌现出未知能力' },
      { name: 'AGI研究所', desc: '通用人工智能的最前沿' },
      { name: 'AI觉醒核心', desc: '阻止超级AI的全面觉醒' }
    ]
  },

  // ===== 第十一章：跨境远征 =====
  {
    num: 11,
    title: '跨境远征',
    baseAtk: 205,
    foodBase: 16,
    equipDropRate: 0.08,
    equipWeights: { 1: 0, 2: 0, 3: 5, 4: 25, 5: 45, 6: 25 },
    bossEquipWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 },
    jadeRegular: 18,
    jadeBoss: 60,
    rewardGoldBase: 1350,
    rewardExpBase: 810,
    rewardResources: { food: 12, wood: 78, stone: 78, iron: 75 },
    mobs: ['关税壁垒', '汇率刺客', '物流幽灵', '清关障碍', '跨境搬运工', '海关稽查员'],
    elites: ['贸易战先锋', '国际物流总监'],
    boss: {
      name: '全球化终结者',
      skill: { name: '贸易制裁', type: 'damage', multiplier: 2.0, target: 'all', cd: 3, effect: { stat: 'atk', ratio: -0.2, duration: 2 } }
    },
    stages: [
      { name: '海关入境处', desc: '繁琐的清关手续化为了战斗' },
      { name: '汇率波动市场', desc: '剧烈的汇率波动中作战' },
      { name: '跨境物流站', desc: '国际物流的中转枢纽' },
      { name: '关税壁垒阵', desc: '层层关税筑成的防线' },
      { name: '自贸区暗战', desc: '自贸区内的精英势力角逐' },
      { name: '跨境电商集群', desc: '全球跨境电商的混战之地' },
      { name: '国际仲裁庭', desc: '贸易纠纷的裁决战场' },
      { name: '环球供应链', desc: '掌控全球供应链的关键节点' },
      { name: '贸易战指挥部', desc: '国际贸易战的最高指挥所' },
      { name: '全球化终端', desc: '击败全球化终结者，打通贸易之路' }
    ]
  },

  // ===== 第十二章：暗网之战 =====
  {
    num: 12,
    title: '暗网之战',
    baseAtk: 258,
    foodBase: 18,
    equipDropRate: 0.07,
    equipWeights: { 1: 0, 2: 0, 3: 0, 4: 20, 5: 48, 6: 32 },
    bossEquipWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 48, 6: 42 },
    jadeRegular: 20,
    jadeBoss: 70,
    rewardGoldBase: 1720,
    rewardExpBase: 1032,
    rewardResources: { food: 14, wood: 95, stone: 95, iron: 92 },
    mobs: ['黑客幽灵', '钓鱼术士', '勒索程序', '数据窃贼', '暗网商人', '零日漏洞体'],
    elites: ['加密守护者', 'APT组织头目'],
    boss: {
      name: '暗网领主',
      skill: { name: '全网瘫痪', type: 'damage', multiplier: 2.0, target: 'all', cd: 4, effect: { stat: 'def', ratio: -0.25, duration: 3 } }
    },
    stages: [
      { name: 'Tor入口节点', desc: '暗网的入口，匿名流量涌动' },
      { name: '钓鱼邮件工厂', desc: '批量制造钓鱼攻击的基地' },
      { name: '加密货币矿场', desc: '非法挖矿的暗网矿场' },
      { name: '数据黑市', desc: '窃取的数据在此交易' },
      { name: 'APT攻防区', desc: '高级持续威胁的精锐基地' },
      { name: '零日漏洞库', desc: '珍藏零日漏洞的军火库' },
      { name: '勒索病毒研究所', desc: '制造勒索软件的黑暗实验室' },
      { name: '僵尸网络枢纽', desc: '控制百万僵尸机的指挥节点' },
      { name: '暗网交易所', desc: '暗网经济的核心交易平台' },
      { name: '暗网核心', desc: '击败暗网领主，摧毁地下网络帝国' }
    ]
  },

  // ===== 第十三章：量子纪元 =====
  {
    num: 13,
    title: '量子纪元',
    baseAtk: 324,
    foodBase: 21,
    equipDropRate: 0.06,
    equipWeights: { 1: 0, 2: 0, 3: 0, 4: 15, 5: 48, 6: 37 },
    bossEquipWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 45, 6: 50 },
    jadeRegular: 20,
    jadeBoss: 80,
    rewardGoldBase: 2200,
    rewardExpBase: 1320,
    rewardResources: { food: 16, wood: 115, stone: 115, iron: 112 },
    mobs: ['量子纠缠体', '叠加态战士', '退相干怪', '量子门卫', '薛定谔之影', '波函数精灵'],
    elites: ['量子处理器', '纠缠态守护者'],
    boss: {
      name: '量子霸权',
      skill: { name: '量子坍缩', type: 'damage', multiplier: 2.5, target: 'all', cd: 4 }
    },
    bossAdds: [
      { name: '纠缠分身', atk_ratio: 0.4, def_ratio: 0.5, hp_ratio: 0.2, skill: { name: '量子回复', type: 'heal', multiplier: 1.5, target: 'ally_lowest_hp', cd: 3 } }
    ],
    stages: [
      { name: '量子比特阵列', desc: '基础量子位组成的第一道防线' },
      { name: '叠加态迷宫', desc: '同时存在于多种状态的诡异空间' },
      { name: '退相干区域', desc: '量子态不断崩塌的不稳定地带' },
      { name: '纠缠通道', desc: '量子纠缠态编织的传送走廊' },
      { name: '量子纠错站', desc: '量子纠错算法守护的关键节点' },
      { name: '超导冷却室', desc: '接近绝对零度的战斗环境' },
      { name: '拓扑量子区', desc: '拓扑保护的量子态异常稳固' },
      { name: '量子优势前线', desc: '经典计算无法企及的领域' },
      { name: '量子霸权门廊', desc: '接近量子霸权的最终防线' },
      { name: '量子核心', desc: '击败量子霸权，打破计算极限' }
    ]
  },

  // ===== 第十四章：时空裂缝 =====
  {
    num: 14,
    title: '时空裂缝',
    baseAtk: 407,
    foodBase: 25,
    equipDropRate: 0.05,
    equipWeights: { 1: 0, 2: 0, 3: 0, 4: 10, 5: 45, 6: 45 },
    bossEquipWeights: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 42, 6: 58 },
    jadeRegular: 22,
    jadeBoss: 100,
    rewardGoldBase: 2800,
    rewardExpBase: 1680,
    rewardResources: { food: 18, wood: 140, stone: 140, iron: 138 },
    mobs: ['时间碎片', '空间扭曲者', '因果悖论体', '虫洞行者', '平行宇宙影', '熵增恶魔'],
    elites: ['维度守护者', '因果律卫士'],
    boss: {
      name: '时空之主',
      skill: { name: '时间回溯', type: 'heal', multiplier: 2.0, target: 'self', cd: 4 }
    },
    bossAdds: [
      { name: '时空裂隙', atk_ratio: 0.5, def_ratio: 0.6, hp_ratio: 0.25, skill: { name: '因果倒置', type: 'debuff', multiplier: 0, target: 'all', cd: 4, effect: { stat: 'atk', ratio: -0.2, duration: 2 } } }
    ],
    stages: [
      { name: '时间碎片带', desc: '时间的碎片漂浮在虚空中' },
      { name: '空间褶皱', desc: '扭曲的空间让战斗变幻莫测' },
      { name: '因果循环', desc: '因果律混乱，行动可能被逆转' },
      { name: '虫洞入口', desc: '连接不同时空的不稳定通道' },
      { name: '平行世界交界', desc: '另一个自己出现在面前' },
      { name: '时间加速带', desc: '一切都在疯狂加速的时空区域' },
      { name: '熵增荒原', desc: '宇宙热寂的前兆，万物走向混乱' },
      { name: '维度折叠区', desc: '三维空间被折叠成更高维度' },
      { name: '时空之门', desc: '通往时空核心的最终之门' },
      { name: '时空裂缝深处', desc: '击败时空之主，修补时空裂缝' }
    ]
  },

  // ===== 第十五章：天命降临 =====
  {
    num: 15,
    title: '天命降临',
    baseAtk: 512,
    foodBase: 30,
    equipDropRate: 0.04,
    equipWeights: { 1: 0, 2: 0, 3: 0, 4: 5, 5: 40, 6: 55 },
    bossEquipWeights: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 30, 6: 70 },
    jadeRegular: 25,
    jadeBoss: 150,
    rewardGoldBase: 3600,
    rewardExpBase: 2160,
    rewardResources: { food: 22, wood: 170, stone: 170, iron: 168 },
    mobs: ['天兵', '天将', '仙灵卫', '九天雷使', '天界执法者', '命运织者'],
    elites: ['天命使者', '星辰守护者'],
    boss: {
      name: '天命之主',
      skill: { name: '天罚雷霆', type: 'damage', multiplier: 2.0, target: 'all', cd: 4 }
    },
    bossAdds: [
      { name: '命运左使', atk_ratio: 0.42, def_ratio: 0.55, hp_ratio: 0.22, skill: { name: '命运枷锁', type: 'debuff', multiplier: 0, target: 'all', cd: 4, effect: { stat: 'atk', ratio: -0.25, duration: 2 } } },
      { name: '命运右使', atk_ratio: 0.38, def_ratio: 0.50, hp_ratio: 0.18, skill: { name: '天命回护', type: 'heal', multiplier: 1.5, target: 'ally_lowest_hp', cd: 3 } }
    ],
    stages: [
      { name: '凡界天梯', desc: '通往天界的第一段阶梯，天兵把守' },
      { name: '云海关隘', desc: '云海中的关隘，天将巡逻' },
      { name: '雷池禁地', desc: '越雷池者死，九天雷霆守护' },
      { name: '仙灵圣林', desc: '仙灵栖息的神圣森林' },
      { name: '星辰长廊', desc: '二十八星宿排列的神秘长廊' },
      { name: '命运之轮', desc: '掌控命运的巨大轮盘所在' },
      { name: '天界法庭', desc: '天界审判一切因果的最高法庭' },
      { name: '九重天阙', desc: '天界权力的核心，九重天宫' },
      { name: '天命祭坛', desc: '天命降临之地，天命使者守护' },
      { name: '天命之巅', desc: '击败天命之主——最终的觉醒，最后的战斗' }
    ]
  }
];

// ── Boss 基础属性映射 (手动平衡) ──
const bossStats = {
  6:  { atk: 600,  def: 310, hp: 7800   },
  7:  { atk: 720,  def: 325, hp: 9400   },
  8:  { atk: 860,  def: 340, hp: 11200  },
  9:  { atk: 1000, def: 355, hp: 13500  },
  10: { atk: 1100, def: 365, hp: 15000  },
  11: { atk: 1180, def: 375, hp: 16800  },
  12: { atk: 1250, def: 385, hp: 18500  },
  13: { atk: 1320, def: 392, hp: 20500  },
  14: { atk: 1400, def: 398, hp: 23000  },
  15: { atk: 1500, def: 400, hp: 14000  } // Ch15: lower HP but has two adds
};

// ── 生成函数 ──
function mobAtk(baseAtk, stageNum) {
  return Math.floor(baseAtk * (1 + 0.12 * (stageNum - 1)));
}

function mobDef(atk) {
  return Math.floor(atk * 0.50);
}

function mobHp(atk) {
  return Math.floor(atk * 6.7);
}

function eliteAtk(baseAtk, stageNum) {
  return Math.floor(mobAtk(baseAtk, stageNum) * 1.5);
}

function eliteDef(eAtk) {
  return Math.floor(eAtk * 0.55);
}

function eliteHp(eAtk) {
  return Math.floor(eAtk * 7.8);
}

function pickMobs(mobList, count, seed) {
  // Deterministic mob selection based on seed
  var result = [];
  for (var i = 0; i < count; i++) {
    result.push(mobList[(seed + i) % mobList.length]);
  }
  return result;
}

function formatRewards(ch, stageNum, isBoss) {
  var goldIncrement = Math.floor(ch.rewardGoldBase * 0.04);
  var gold = ch.rewardGoldBase + goldIncrement * (stageNum - 1);
  var exp = Math.floor(gold * 0.6);
  var res = ch.rewardResources;
  var stageScale = 1 + 0.05 * (stageNum - 1);

  return {
    gold: gold,
    exp: exp,
    food: Math.floor(res.food * stageScale),
    wood: Math.floor(res.wood * stageScale),
    stone: Math.floor(res.stone * stageScale),
    iron: Math.floor(res.iron * stageScale),
    equipDropRate: isBoss ? 1 : ch.equipDropRate,
    equipQualityWeights: isBoss ? ch.bossEquipWeights : ch.equipWeights
  };
}

function generateStages() {
  var allStages = [];

  for (var c = 0; c < chapters.length; c++) {
    var ch = chapters[c];
    var bs = bossStats[ch.num];

    for (var s = 1; s <= 10; s++) {
      var stageData = ch.stages[s - 1];
      var isBoss = (s === 10);
      var hasElite = (s === 5 || s === 8 || s === 9);
      var mobCount = (s <= 4) ? 3 : (s <= 7 ? 4 : 4);

      var enemies = [];

      if (isBoss) {
        // Boss enemy
        enemies.push({
          id: 'mob_' + ch.num + '_10_1',
          name: ch.boss.name,
          atk: bs.atk,
          def: bs.def,
          hp: bs.hp,
          spd: 22 + Math.floor(ch.num / 3),
          skill: ch.boss.skill
        });
        // Boss adds  
        if (ch.bossAdds) {
          for (var a = 0; a < ch.bossAdds.length; a++) {
            var add = ch.bossAdds[a];
            enemies.push({
              id: 'mob_' + ch.num + '_10_' + (a + 2),
              name: add.name,
              atk: Math.floor(bs.atk * add.atk_ratio),
              def: Math.floor(bs.def * add.def_ratio),
              hp: Math.floor(bs.hp * add.hp_ratio),
              spd: 20,
              skill: add.skill
            });
          }
        }
      } else {
        // Regular mobs
        var mAtk = mobAtk(ch.baseAtk, s);
        var mDef = mobDef(mAtk);
        var mHp = mobHp(mAtk);

        var selectedMobs = pickMobs(ch.mobs, hasElite ? mobCount - 1 : mobCount, ch.num * 10 + s);

        for (var m = 0; m < selectedMobs.length; m++) {
          enemies.push({
            id: 'mob_' + ch.num + '_' + s + '_' + (m + 1),
            name: selectedMobs[m],
            atk: mAtk,
            def: mDef,
            hp: mHp,
            spd: 15 + Math.floor(ch.num / 5),
            skill: null
          });
        }

        // Add elite mob
        if (hasElite) {
          var eAtk = eliteAtk(ch.baseAtk, s);
          var eDef = eliteDef(eAtk);
          var eHp = eliteHp(eAtk);
          var eliteName = ch.elites[(s === 5) ? 0 : 1];
          enemies.push({
            id: 'mob_' + ch.num + '_' + s + '_' + (selectedMobs.length + 1),
            name: eliteName,
            atk: eAtk,
            def: eDef,
            hp: eHp,
            spd: 18 + Math.floor(ch.num / 4),
            skill: null
          });
        }
      }

      var foodCost = ch.foodBase + (s >= 6 ? 1 : 0) + (s >= 9 ? 1 : 0) + (isBoss ? 2 : 0);

      var stage = {
        id: 'stage_' + ch.num + '_' + s,
        chapter: ch.num,
        stage: s,
        name: stageData.name,
        description: stageData.desc,
        isBoss: isBoss,
        enemies: enemies,
        rewards: formatRewards(ch, s, isBoss),
        foodCost: foodCost,
        unlockCondition: (s === 1)
          ? 'stage_' + (ch.num - 1) + '_10'
          : 'stage_' + ch.num + '_' + (s - 1),
        firstClearReward: {
          jade: isBoss ? ch.jadeBoss : ch.jadeRegular,
          hero: null
        }
      };

      allStages.push(stage);
    }
  }

  return allStages;
}

// ── 输出 ──
function formatJS(stages) {
  var lines = [];
  
  for (var i = 0; i < stages.length; i++) {
    var st = stages[i];

    // Chapter separator comment
    if (st.stage === 1) {
      var ch = chapters.find(function (c) { return c.num === st.chapter; });
      lines.push('');
      lines.push('  // ===== 第' + chineseNum(st.chapter) + '章：' + ch.title + ' =====');
    }

    lines.push('  {');
    lines.push("    id: '" + st.id + "',");
    lines.push('    chapter: ' + st.chapter + ',');
    lines.push('    stage: ' + st.stage + ',');
    lines.push("    name: '" + st.name + "',");
    lines.push("    description: '" + st.description + "',");
    lines.push('    isBoss: ' + st.isBoss + ',');
    lines.push('    enemies: [');

    for (var e = 0; e < st.enemies.length; e++) {
      var en = st.enemies[e];
      var skillStr = 'null';
      if (en.skill) {
        var sk = en.skill;
        skillStr = '{ name: \'' + sk.name + '\', type: \'' + sk.type + '\', multiplier: ' + sk.multiplier + ', target: \'' + sk.target + '\', cd: ' + sk.cd;
        if (sk.effect) {
          skillStr += ', effect: { stat: \'' + sk.effect.stat + '\', ratio: ' + sk.effect.ratio + ', duration: ' + sk.effect.duration + ' }';
        }
        skillStr += ' }';
      }
      var comma = (e < st.enemies.length - 1) ? ',' : '';
      lines.push("      { id: '" + en.id + "', name: '" + en.name + "', atk: " + en.atk + ", def: " + en.def + ", hp: " + en.hp + ", spd: " + en.spd + ", skill: " + skillStr + " }" + comma);
    }

    lines.push('    ],');
    lines.push('    rewards: {');

    var rw = st.rewards;
    lines.push('      gold: ' + rw.gold + ',');
    lines.push('      exp: ' + rw.exp + ',');
    lines.push('      food: ' + rw.food + ',');
    lines.push('      wood: ' + rw.wood + ',');
    lines.push('      stone: ' + rw.stone + ',');
    lines.push('      iron: ' + rw.iron + ',');
    lines.push('      equipDropRate: ' + rw.equipDropRate + ',');

    var wt = rw.equipQualityWeights;
    var wtStr = '{ ';
    var wtKeys = Object.keys(wt);
    for (var w = 0; w < wtKeys.length; w++) {
      wtStr += wtKeys[w] + ': ' + wt[wtKeys[w]];
      if (w < wtKeys.length - 1) wtStr += ', ';
    }
    wtStr += ' }';
    lines.push('      equipQualityWeights: ' + wtStr);

    lines.push('    },');
    lines.push('    foodCost: ' + st.foodCost + ',');
    lines.push("    unlockCondition: '" + st.unlockCondition + "',");
    lines.push('    firstClearReward: {');
    lines.push('      jade: ' + st.firstClearReward.jade + ',');
    lines.push('      hero: null');
    lines.push('    }');

    var stageComma = (i < stages.length - 1) ? ',' : '';
    lines.push('  }' + stageComma);
  }

  return lines.join('\n');
}

function chineseNum(n) {
  var map = { 6: '六', 7: '七', 8: '八', 9: '九', 10: '十', 11: '十一', 12: '十二', 13: '十三', 14: '十四', 15: '十五' };
  return map[n] || String(n);
}

// ── Main ──
var stages = generateStages();
console.log(formatJS(stages));
