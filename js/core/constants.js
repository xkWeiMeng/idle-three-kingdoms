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
  },

  // 品质
  QUALITY: {
    COMMON: 1,    // 白
    UNCOMMON: 2,  // 绿
    RARE: 3,      // 蓝
    EPIC: 4,      // 紫
    LEGENDARY: 5, // 橙
  },

  // 最大队伍人数
  MAX_TEAM_SIZE: 5,
};
