/**
 * 弹珠（柏青哥）数据表
 * 奖槽定义、物理参数、奖励配置
 */
var PachinkoData = {

  // 每次发射消耗的玉璧
  COST_PER_BALL: 10,

  // Canvas 尺寸（逻辑像素，CSS 缩放适配）
  CANVAS_WIDTH: 360,
  CANVAS_HEIGHT: 520,

  // 物理参数
  PHYSICS: {
    GRAVITY: 500,              // px/s²
    BALL_RADIUS: 6,
    PEG_RADIUS: 4,
    BALL_ELASTICITY: 0.5,      // 弹珠-钉子弹性
    WALL_ELASTICITY: 0.6,      // 弹珠-墙壁弹性
    FRICTION: 0.995,           // 速度衰减（每帧）
    LAUNCH_SPEED: 200,         // 初始发射速度 px/s
    LAUNCH_ANGLE_VARIANCE: 5,  // 发射角度随机偏移 ±度
    COLLISION_JITTER: 3,       // 碰撞随机扰动 ±度
    MAX_FLIGHT_TIME: 15,       // 最大飞行时间（秒），超时强制结算
    FIXED_DT: 1 / 60,         // 物理步长
  },

  // 钉子阵列参数
  PEG_LAYOUT: {
    ROWS: 9,
    COLS: 11,                  // 偶数行列数，奇数行 COLS-1
    ROW_SPACING: 35,           // 行间距 px
    COL_SPACING: 30,           // 列间距 px
    START_Y: 80,               // 第一行 Y 偏移
    OFFSET_X: 15,              // 奇数行 X 偏移（半列）
  },

  // 奖槽定义（从左到右 9 个）
  SLOTS: [
    { id: 'miss_1',    type: 'miss',    label: '×',    color: '#666',    jadeRange: [0, 0],     equipChance: 0,    equipQuality: null },
    { id: 'small_1',   type: 'small',   label: '小奖', color: '#5d8a48', jadeRange: [5, 15],    equipChance: 0,    equipQuality: null },
    { id: 'medium_1',  type: 'medium',  label: '中奖', color: '#4a7fb5', jadeRange: [30, 50],   equipChance: 0,    equipQuality: null },
    { id: 'miss_2',    type: 'miss',    label: '×',    color: '#666',    jadeRange: [0, 0],     equipChance: 0,    equipQuality: null },
    { id: 'jackpot',   type: 'jackpot', label: '大奖', color: '#d4a849', jadeRange: [500, 500], equipChance: 1.0,  equipQuality: { 4: 70, 5: 20, 6: 10 } },
    { id: 'miss_3',    type: 'miss',    label: '×',    color: '#666',    jadeRange: [0, 0],     equipChance: 0,    equipQuality: null },
    { id: 'medium_2',  type: 'medium',  label: '中奖', color: '#4a7fb5', jadeRange: [30, 50],   equipChance: 0,    equipQuality: null },
    { id: 'small_2',   type: 'small',   label: '小奖', color: '#5d8a48', jadeRange: [5, 15],    equipChance: 0,    equipQuality: null },
    { id: 'big',       type: 'big',     label: '大',   color: '#8b5ea8', jadeRange: [100, 200], equipChance: 0.5,  equipQuality: { 3: 100 } },
  ],

  // 守护钉（大奖槽上方的特殊钉子，形成窄漏斗增加大奖难度）
  GUARD_PEGS: [
    // 中央分流钉 — 把直落的球拨向两侧
    { x: 180, y: 390, radius: 7 },
    // 外层漏斗 — 引导球向外偏转
    { x: 150, y: 425, radius: 6 },
    { x: 210, y: 425, radius: 6 },
    // 内层守护 — 极窄入口（间隙仅比弹珠直径大一点点）
    { x: 164, y: 455, radius: 6 },
    { x: 196, y: 455, radius: 6 },
  ],

  // 奖槽视觉参数
  SLOT_HEIGHT: 40,
  SLOT_BORDER_WIDTH: 2,

  // 发射口位置（顶部居中偏上）
  LAUNCHER: {
    X: 180,   // CANVAS_WIDTH / 2
    Y: 20,
  },

  // 中奖特效颜色
  EFFECTS: {
    miss:    { particles: false },
    small:   { particles: true, color: '#5d8a48', count: 5 },
    medium:  { particles: true, color: '#4a7fb5', count: 10 },
    big:     { particles: true, color: '#8b5ea8', count: 20 },
    jackpot: { particles: true, color: '#d4a849', count: 40, celebration: true },
  },
};
