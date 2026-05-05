/**
 * 游戏常量定义
 */
const CONSTANTS = {
  GAME_TITLE: '幻想三国',
  VERSION: '0.1.0',

  // 存档
  SAVE_KEY: 'idle_three_kingdoms_save',
  SAVE_INTERVAL_MS: 30000, // 30秒自动存档

  // 游戏循环
  TICK_INTERVAL_MS: 1000,  // 1秒一次 tick

  // 资源类型
  RESOURCE: {
    GOLD: 'gold',
    JADE: 'jade',       // 玉璧 (高级货币)
    EXP: 'exp',
    FOOD: 'food',
    WOOD: 'wood',       // 木材 (建筑资源)
    STONE: 'stone',     // 石材 (建筑资源)
    IRON: 'iron',       // 铁矿 (建筑资源)
  },

  // 资源图标 — 使用 UIIcons（延迟初始化，因 UIIcons 可能还未加载）
  RESOURCE_ICON: {
    gold: 'gold', jade: 'jade', exp: 'exp', food: 'food',
    wood: 'wood', stone: 'stone', iron: 'iron',
  },

  // 资源图标 HTML（由 UIIcons 生成，在 main.js 初始化时填充）
  RESOURCE_EMOJI: {
    gold: '', jade: '', exp: '', food: '',
    wood: '', stone: '', iron: '',
  },

  // 基础资源上限
  RESOURCE_BASE_CAP: {
    gold: 50000,
    wood: 2000,
    stone: 2000,
    iron: 1000,
    food: 200,
  },

  // 食物系统参数
  FOOD: {
    REGEN_INTERVAL: 15,      // 每15秒恢复1点（原30秒）
    DEPLETED_REWARD_RATE: 0.3, // 食物耗尽后奖励倍率30%
    NEWBIE_FREE_STAGES: 50,   // 前50关首通不消耗食物
  },

  // 品质
  QUALITY: {
    COMMON: 1,    // 白
    UNCOMMON: 2,  // 绿
    RARE: 3,      // 蓝
    EPIC: 4,      // 紫
    LEGENDARY: 5, // 橙
    MYTHIC: 6,    // 红·神话
  },

  // 五行属性
  ELEMENT: {
    FIRE: 'fire',     // 火 — 蜀
    METAL: 'metal',   // 金 — 魏
    WATER: 'water',   // 水 — 吴
    WOOD: 'wood',     // 木 — 群(生长型)
    EARTH: 'earth',   // 土 — 群(防御型)
  },

  ELEMENT_INFO: {
    fire:  { name: '火', color: '#ff4757', icon: '🔥' },
    metal: { name: '金', color: '#ffa502', icon: '⚔️' },
    water: { name: '水', color: '#3742fa', icon: '💧' },
    wood:  { name: '木', color: '#2ed573', icon: '🌳' },
    earth: { name: '土', color: '#8b4513', icon: '🏔️' },
  },

  // 五行相克相生关系
  ELEMENT_RELATIONS: {
    // 相克 (destructive): A 克 B → A 对 B 伤害 ×1.25
    OVERCOME: {
      fire: 'metal',   // 火克金
      metal: 'wood',   // 金克木
      wood: 'earth',   // 木克土
      earth: 'water',  // 土克水
      water: 'fire',   // 水克火
    },
    // 相生 (generative): A 生 B → A 对 B 伤害 ×1.10
    GENERATE: {
      wood: 'fire',    // 木生火
      fire: 'earth',   // 火生土
      earth: 'metal',  // 土生金
      metal: 'water',  // 金生水
      water: 'wood',   // 水生木
    },
  },

  // 五行伤害倍率
  ELEMENT_MULTIPLIERS: {
    OVERCOME: 1.25,    // 克制 +25%
    OVERCOME_BY: 0.80, // 被克 -20%
    GENERATE: 1.10,    // 相生 +10%
    GENERATE_BY: 0.95, // 被生 -5%
    SAME: 0.90,        // 同属性 -10%
    NEUTRAL: 1.00,     // 无关系
  },

  // 阵营-五行默认映射
  ELEMENT_FACTION_MAP: {
    shu: 'fire',
    wei: 'metal',
    wu: 'water',
    qun: null,  // 群雄按个体分配
  },

  // 英雄角色
  HERO_ROLE: {
    DPS: 'dps',
    HEALER: 'healer',
    TANK: 'tank',
    SUPPORT: 'support',
    DEBUFFER: 'debuffer',
  },

  HERO_ROLE_INFO: {
    dps:      { name: '输出', icon: '⚔️', color: '#ff4757' },
    healer:   { name: '治疗', icon: '💚', color: '#4caf50' },
    tank:     { name: '坦克', icon: '🛡️', color: '#3742fa' },
    support:  { name: '辅助', icon: '✨', color: '#ffa502' },
    debuffer: { name: '控制', icon: '💀', color: '#9b59b6' },
  },

  // 最大队伍人数
  MAX_TEAM_SIZE: 5,
};
