# 执行计划：城防塔防系统（Tower Defense System）

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联规范** | [product-specs/tower-defense-system.md](../product-specs/tower-defense-system.md) |
| **创建** | 2026-04-06 |

---

## 目标

实现完整的城防塔防系统：16 种防御建筑（4 时代 × 4 种）、9 种敌人类型、20 波关卡、A\* 寻路、rAF 战斗循环、科技研究、武将派驻、自动防守、Canvas 战场渲染，以及与城镇系统的完整集成。

## 前置条件

- [x] 产品规范 Active（v0.3.0）
- [x] 城镇系统已实现（TownManager + TownWorld）
- [x] 战斗系统已实现（BattleManager）— 用于队伍互斥检查
- [ ] 无外部依赖（纯前端 + localStorage）

---

## 依赖关系图

```
阶段 1（数据层）
  └── T1 静态数据表 (js/data/td-data.js)

阶段 2（基础设施）— 依赖 T1
  ├── T2 碰撞网格 API (town-manager + town-world)
  └── T3 A* 寻路模块 (js/core/pathfinding.js)

阶段 3（Manager 基础）— 依赖 T1, T2, T3
  ├── T4 Manager 初始化 + 解锁检测
  ├── T5 塔 CRUD（建造/升级/出售）—— 依赖 T4
  ├── T6 科技研究 —— 依赖 T4
  ├── T7 武将派驻 —— 依赖 T4
  └── T8 自动防守 —— 依赖 T4, T5

阶段 4（战斗循环）— 依赖 T4, T5, T3
  ├── T9  敌人生成 + A* 移动
  ├── T10 塔攻击系统 —— 依赖 T9
  ├── T11 波次生命周期 —— 依赖 T9, T10
  └── T12 城主府 HP + 波次失败 —— 依赖 T11

阶段 5（UI 层）— 依赖 阶段 3, 4
  ├── T13 防守模式入口 + Canvas 战场渲染
  ├── T14 塔建造工具栏 + 放置交互 —— 依赖 T13
  ├── T15 塔信息/升级/出售面板 —— 依赖 T14
  ├── T16 科技面板 + 武将面板 —— 依赖 T13
  └── T17 波次结算弹窗 + 新手引导 —— 依赖 T13

阶段 6（集成与验证）— 依赖 全部
  ├── T18 index.html + main.js 集成
  ├── T19 存档恢复 + 离线防守
  └── T20 最终验证清单
```

**并行可能**：T2/T3 可并行；T5/T6/T7 可并行（均仅依赖 T4）；T14/T15/T16/T17 可并行（均仅依赖 T13）。

---

## 阶段 1：数据层

> 建立所有静态数据表，不依赖任何游戏逻辑代码。

### T1 — 创建塔防静态数据表 `js/data/td-data.js`

| 字段 | 值 |
|------|-----|
| **规范引用** | §6.1 防御建筑数据、§6.2 塔升级公式、§6.3 敌人类型数据、§6.4 科技树、§7.1 波次基础属性公式、§7.2 波次数值表、§7.4 波次奖励公式 |
| **输入** | 规范 §6 + §7 全部数据表和公式 |
| **输出** | `js/data/td-data.js` — 全局 `TDTowerData`、`TDEnemyData`、`TDWaveTable`、`TDTechTree`、`TD_UPGRADE_TABLE`、`TD_CONSTANTS` |
| **依赖** | 无 |
| **约束** | 全局变量，不用 class/import；ID 与规范一致（`td_` 前缀） |
| **复杂度** | **L**（数据量大，16 塔 + 9 敌人 + 20 波 + 科技树） |

数据结构：

```javascript
// 塔数据（按时代分组）
var TDTowerData = {
  td_palisade: { id: 'td_palisade', name: '木栅栏', era: 1, category: 'wall',
    atk: 0, range: 0, attackSpeed: 0, hp: 200,
    targets: ['ground', 'underground'],
    special: null,
    cost: { gold: 50, wood: 20 }
  },
  td_arrow_tower: { ... },
  // ... 共 16 种
};

// 升级倍率表
var TD_UPGRADE_TABLE = [
  null,
  { statMul: 1.00, hpMul: 1.00, costMul: 0 },    // Lv1
  { statMul: 1.20, hpMul: 1.30, costMul: 1.0 },   // Lv2
  { statMul: 1.40, hpMul: 1.60, costMul: 1.5 },   // Lv3
  { statMul: 1.60, hpMul: 2.00, costMul: 2.0 },   // Lv4
  { statMul: 2.00, hpMul: 2.50, costMul: 3.0 },   // Lv5
];

// 敌人类型数据
var TDEnemyData = {
  td_infantry: { id: 'td_infantry', name: '步兵', category: 'ground',
    hpMul: 1.0, atkMul: 1.0, defMul: 1.0, speed: 1.0,
    special: null
  },
  // ... 共 9 种
};

// 波次表（20 波）
var TDWaveTable = [
  null, // index 0 unused
  { wave: 1, enemies: [{ type: 'td_infantry', count: 3 }], isBoss: false },
  // ... 共 20 波
];

// 科技树
var TDTechTree = [
  null,
  { era: 1, name: '中世纪', cost: null, time: 0, requires: null },
  { era: 2, name: '火药时代', cost: { gold: 2000, wood: 200, stone: 150 },
    time: 1800, requires: { era: 1, wave: 5 } },
  { era: 3, name: '工业时代', cost: { gold: 5000, wood: 400, stone: 300, iron: 100 },
    time: 3600, requires: { era: 2, wave: 10 } },
  { era: 4, name: '现代科技', cost: { gold: 10000, wood: 600, stone: 500, iron: 200 },
    time: 7200, requires: { era: 3, wave: 15 } },
];

// 常量
var TD_CONSTANTS = {
  MAX_TOWER_LEVEL: 5,
  MAX_WAVE: 20,
  MAX_ASSIGNED_HEROES: 2,
  PREP_TIME: 15,           // 准备倒计时秒
  SELL_RATE_IDLE: 0.5,     // 非战斗出售返还率
  SELL_RATE_ACTIVE: 0.3,   // 战斗中出售返还率
  AUTO_REWARD_RATE: 0.7,   // 自动防守奖励倍率
  MANUAL_GOLD_BONUS: 1.3,  // 手动操作金币倍率
  MANUAL_EXP_BONUS: 1.2,   // 手动操作经验倍率
  AUTO_WIN_THRESHOLD: 0.8, // 自动防守胜率阈值
  WAVE_DURATION_ASSUMED: 60, // 自动防守假设波次时长
  HERO_SKILL_INTERVAL: 10, // 武将技能释放间隔（秒）
  HERO_SKILL_COEFFICIENT: 0.5, // 武将技能伤害系数
  TILE_SIZE: 48,
};
```

**验证**：
1. 文件可被浏览器加载无报错
2. `Object.keys(TDTowerData).length === 16`
3. `Object.keys(TDEnemyData).length === 9`
4. `TDWaveTable.length === 21`（index 0 为 null）
5. `TDTechTree.length === 5`（index 0 为 null）
6. 波次 5 的 `isBoss === true` 且 enemies 为 `[{ type: 'td_siege_ram', count: 1 }]`
7. 波次 20 的 enemies 包含 `td_final_boss` + 随从
8. 每种塔含 `id/name/era/category/atk/range/attackSpeed/targets/special/cost`
9. 每种敌人含 `id/name/category/hpMul/atkMul/defMul/speed/special`
10. 波次奖励公式函数 `TDWaveRewards(n)` 返回值与规范 §7.4 参考值匹配

---

## 阶段 2：基础设施

> 提供寻路和碰撞网格 API，不涉及 TD 业务逻辑。

### T2 — 碰撞网格 API

| 字段 | 值 |
|------|-----|
| **规范引用** | §10.1 集成清单、§10.2 跨模块只读查询 `TownManager.getCollisionGrid()` |
| **输入** | `js/modules/town-manager.js`、`js/ui/town-world.js` |
| **输出** | 两个文件各新增 `getCollisionGrid()` 方法 |
| **依赖** | 无（在现有文件上新增方法） |
| **约束** | 返回 2D 数组 `grid[y][x]`，0=可通行，1=建筑障碍；包含现有建筑+放置的塔；不改变现有功能 |
| **复杂度** | **S** |

**TownManager** 新增：
```javascript
getCollisionGrid() {
  // 委托给 TownWorld（UI 层持有建筑位置信息）
  if (typeof TownWorld !== 'undefined' && TownWorld.getCollisionGrid) {
    return TownWorld.getCollisionGrid();
  }
  return null;
}
```

**TownWorld** 新增：
```javascript
getCollisionGrid() {
  // 基于 _placements 和 _buildingSizes 构建碰撞网格
  var grid = [];
  for (var y = 0; y < MAP_H; y++) {
    grid[y] = [];
    for (var x = 0; x < MAP_W; x++) grid[y][x] = 0;
  }
  // 遍历 _placements，将建筑占用的格子标记为 1
  // ... (实现细节省略)
  return grid;
}
```

**验证**：
1. `TownManager.getCollisionGrid()` 返回 2D 数组
2. 数组尺寸与地图尺寸一致
3. 城主府所在格子标记为 1
4. 空白区域标记为 0
5. 不影响现有城镇功能（无回归）

---

### T3 — A\* 寻路模块 `js/core/pathfinding.js`

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-06 敌人行为（A\* 路径计算）、§11 非功能需求（< 5ms / 32×32 网格） |
| **输入** | 碰撞网格（来自 T2） |
| **输出** | `js/core/pathfinding.js` — 全局 `Pathfinding` 对象 |
| **依赖** | T2（碰撞网格格式） |
| **约束** | 全局对象，不用 class/import；支持 4 方向或 8 方向（规范未限定，默认 4 方向）；性能要求 < 5ms 于 32×32 网格 |
| **复杂度** | **M** |

接口：
```javascript
var Pathfinding = {
  /**
   * @param {number[][]} grid - 碰撞网格 grid[y][x], 0=可通行, 1=障碍
   * @param {{x:number,y:number}} start - 起点网格坐标
   * @param {{x:number,y:number}} end - 终点网格坐标
   * @returns {Array<{x:number,y:number}>|null} - 路径节点数组或 null（无路径）
   */
  findPath(grid, start, end) { /* A* 实现 */ },

  /**
   * 检查放置障碍后是否仍有通路（封路检测）
   * @param {number[][]} grid - 当前碰撞网格
   * @param {number} x - 拟放置位置 x
   * @param {number} y - 拟放置位置 y
   * @param {Array<{x,y}>} spawnPoints - 所有生成点
   * @param {{x,y}} target - 城主府位置
   * @returns {boolean} - true=仍有通路, false=封路
   */
  checkPathExists(grid, x, y, spawnPoints, target) { /* ... */ }
};
```

**验证**：
1. 空旷网格中 `findPath()` 返回有效路径
2. 全封锁时 `findPath()` 返回 `null`
3. `checkPathExists()` 在放置后仍有通路时返回 `true`
4. `checkPathExists()` 在放置后完全封路时返回 `false`
5. 32×32 网格上路径计算 < 5ms（浏览器控制台 `performance.now()` 验证）
6. 路径绕过障碍物（不穿墙）

---

## 阶段 3：Manager 基础

> 实现 TowerDefenseManager 的非战斗逻辑部分。

### T4 — Manager 初始化 + 解锁检测 `js/modules/tower-defense-manager.js`

| 字段 | 值 |
|------|-----|
| **规范引用** | §3 解锁条件、§5.1 存档格式、§8.2 监听事件、CAP-TD-01 进入防守模式、§11.2 存档恢复 |
| **输入** | 规范 §3 + §5.1 + §8.2 |
| **输出** | `js/modules/tower-defense-manager.js` — 全局 `TowerDefenseManager` 骨架 |
| **依赖** | T1（`TD_CONSTANTS`） |
| **约束** | 全局单例，不用 class；通过 EventBus 通信；状态 JSON 可序列化 |
| **复杂度** | **M** |

实现内容：
- `init(saved)` — 从 `saved.towerDefense` 恢复或初始化默认状态
- `getState()` — `Utils.deepClone(this._state)`
- `onTick(dt)` — 骨架（后续任务填充逻辑）
- `_checkUnlock()` — 监听 `battle:ended` 和 `town:building_upgraded`，检查双条件
- `isUnlocked()` — 返回 `this._state.unlocked`
- `enterDefenseMode()` / `exitDefenseMode()` — 模式切换方法
- `isInDefenseMode()` — 返回当前模式

**默认状态**：
```javascript
{
  unlocked: false,
  era: 1,
  research: {
    era_2: { completed: false, startTime: null },
    era_3: { completed: false, startTime: null },
    era_4: { completed: false, startTime: null }
  },
  towers: [],
  wave: { current: 1, highest: 0, townHallHp: 0, townHallMaxHp: 0 },
  assignedHeroes: [],
  stats: { totalWavesCleared: 0, totalKills: 0, totalGoldEarned: 0 },
  tutorialSeen: false
}
```

**验证**：
1. WHEN 无存档 → `getState()` 返回默认状态，`unlocked === false`
2. WHEN 有存档 → 正确恢复所有字段
3. WHEN 通关 `stage_2_10` AND 城主府 ≥ 3 → `_checkUnlock()` 设置 `unlocked = true`，触发 `td:unlocked`，Toast 提示
4. WHEN 通关 `stage_2_10` BUT 城主府 < 3 → 不解锁
5. WHEN 城主府升级到 3 BUT 未通关 `stage_2_10` → 不解锁
6. WHEN 读取存档且上次在波次进行中 → 回退到波次起始状态（§11.2）
7. `enterDefenseMode()` 在未解锁时返回 false
8. `exitDefenseMode()` 在有活跃波次时返回确认需求标志

---

### T5 — 塔 CRUD（建造/升级/出售）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-02 建造、CAP-TD-03 升级、CAP-TD-04 出售、§6.2 升级公式、§7.6 最大放置数 |
| **输入** | `TDTowerData`、`TD_UPGRADE_TABLE`、`Pathfinding.checkPathExists()` |
| **输出** | `tower-defense-manager.js` 中新增方法 |
| **依赖** | T4（Manager 骨架）、T3（封路检测） |
| **约束** | 建造时必须检查封路；资源不足时不执行；出售返还率区分战斗/非战斗状态 |
| **复杂度** | **M** |

新增方法：
- `buildTower(typeId, gridX, gridY)` — CAP-TD-02
- `canBuildTower(typeId, gridX, gridY)` — 资源检查 + 位置检查 + 科技检查 + 封路检查 + 容量检查
- `upgradeTower(towerUid)` — CAP-TD-03
- `canUpgradeTower(towerUid)` — 等级 + 资源检查
- `sellTower(towerUid)` — CAP-TD-04
- `getUpgradeCost(towerUid)` — 计算升级费用
- `getTowerStats(towerUid)` — 计算含升级倍率的实际属性
- `getMaxTowers()` — `8 + 城主府等级 × 3`

**验证**：
1. WHEN 建造箭塔于空闲格且资源足够 → towers 数组新增条目，资源扣除，触发 `td:tower_built`
2. WHEN 目标格已占用 → 返回 false，提示"该位置已占用"
3. WHEN 资源不足 → 返回 false
4. WHEN 放置导致封路 → 返回 false，提示"不能完全封锁敌人路径"（CAP-TD-02）
5. WHEN towers 数量已达 `getMaxTowers()` → 返回 false
6. WHEN 升级 Lv1 箭塔到 Lv2 → ATK 变为 `20 × 1.20 = 24`，费用 = 建造费 × 1.0
7. WHEN 塔已 Lv5 → 升级返回 false
8. WHEN 非战斗时出售 → 返还 50%（向下取整），触发 `td:tower_sold`
9. WHEN 战斗中出售 → 返还 30%
10. 每次建造/出售后触发寻路重算（通过事件通知战斗循环）

---

### T6 — 科技研究系统

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-11 科技研究、§6.4 科技树 |
| **输入** | `TDTechTree` 数据 |
| **输出** | `tower-defense-manager.js` 中新增方法 + `onTick` 补充 |
| **依赖** | T4（Manager 骨架） |
| **约束** | 研究时间受城主府加速；离线时间差补偿 |
| **复杂度** | **S** |

新增方法：
- `startResearch(era)` — 消耗资源，开始研究计时
- `canStartResearch(era)` — 检查前置条件（上一时代 + 波次要求 + 资源）
- `getResearchProgress(era)` — 返回剩余时间
- `_tickResearch(dt)` — 在 `onTick` 中调用，推进研究计时

**验证**：
1. WHEN 研究时代 2 且满足前置（时代 1 + 波次 5 + 资源足够）→ 资源扣除，`research.era_2.startTime` 设置，触发 `td:research_started`
2. WHEN 研究完成 → `era` 升级，`research.era_2.completed = true`，触发 `td:era_unlocked`，Toast 提示
3. WHEN 城主府 Lv5 → 实际时间 = 1800 / (1 + 5 × 0.05) = 1440 秒
4. WHEN 离线后上线 → 检查时间差，若已超时长则立即完成
5. WHEN 未满足前置条件 → `canStartResearch` 返回 false

---

### T7 — 武将派驻系统

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-10 武将派驻 |
| **输入** | `HeroManager` API（getHeroStats, getTeam, getTemplate） |
| **输出** | `tower-defense-manager.js` 中新增方法 |
| **依赖** | T4（Manager 骨架） |
| **约束** | 与 BattleManager 队伍互斥；最多 2 名；光环加成公式明确 |
| **复杂度** | **S** |

新增方法：
- `assignHero(heroUid)` — 派驻武将到防守位
- `removeHero(heroUid)` — 移除派驻
- `getAssignedHeroes()` — 返回已派驻武将信息
- `_calcHeroAtkBonus()` — 计算全场塔 ATK 加成百分比
- `_getAvailableHeroes()` — 返回可派驻武将列表（排除出征队伍）

**验证**：
1. WHEN 派驻武将且不在出征队伍 → `assignedHeroes` 新增，触发 `td:hero_assigned`
2. WHEN 武将在出征队伍中 → 返回 false
3. WHEN 已有 2 名派驻 → 替换最后一名，弹出确认
4. WHEN 武将 ATK=150 → 塔 ATK 加成 = +15%（`floor(150/10) = 15`）
5. WHEN 移除武将 → `assignedHeroes` 中删除对应 uid

---

### T8 — 自动防守系统

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-09 自动防守 |
| **输入** | 塔布局、波次数据、简化胜率公式 |
| **输出** | `tower-defense-manager.js` 中 `onTick` 添加自动防守逻辑 |
| **依赖** | T4（Manager 骨架）、T5（塔属性计算） |
| **约束** | 仅在非防守模式且有已放置塔时运行；使用简化 DPS vs HP 公式 |
| **复杂度** | **S** |

`onTick` 中新增自动防守判定：
```javascript
// 仅在非防守模式 + 有塔 + 城防已解锁时运行
if (!this._inDefenseMode && this._state.unlocked && this._state.towers.length > 0) {
  this._autoDefend(dt);
}
```

**验证**：
1. WHEN 离开防守模式且有塔 → 每 `game:tick` 执行一次简化防守
2. WHEN `winRate = totalTowerDPS × 60 / totalEnemyHP ≥ 0.8` → 自动通关，发放 70% 奖励，波次 +1
3. WHEN `winRate < 0.8` → 不推进，停留在当前波次
4. WHEN 无塔 → 不执行自动防守
5. 自动防守奖励正确通过 `ResourceManager.add()` 发放

---

## 阶段 4：战斗循环

> 实现 rAF 驱动的实时 TD 战斗——敌人生成、移动、塔攻击、波次管理。此阶段代码主要为运行时状态（非持久化）。

### T9 — 敌人生成 + A\* 移动

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-05 启动波次（生成部分）、CAP-TD-06 敌人行为 |
| **输入** | `TDWaveTable`、`TDEnemyData`、`Pathfinding`、碰撞网格 |
| **输出** | `tower-defense-manager.js` 中新增战斗循环方法 |
| **依赖** | T4（Manager 骨架）、T3（A\* 寻路） |
| **约束** | 使用 rAF 驱动；敌人移动按 `deltaTime` 缩放；地面/地下/空中三种寻路行为不同 |
| **复杂度** | **L** |

运行时状态（非持久化）：
```javascript
_battle: {
  active: false,
  enemies: [],           // 活跃敌人实例数组
  prepTimer: 0,          // 准备倒计时
  rafId: null,           // rAF ID
  lastFrameTime: 0,      // 上帧时间戳
  spawnQueue: [],         // 待生成敌人队列
  spawnTimer: 0,          // 生成间隔计时
}
```

新增方法：
- `_startBattleLoop()` — 启动 rAF 循环
- `_stopBattleLoop()` — 停止 rAF 循环（cancelAnimationFrame）
- `_battleTick(timestamp)` — 每帧调用，计算 dt，更新敌人
- `_spawnEnemies(waveData)` — 从地图边缘随机选 1-2 个生成点，按间隔生成
- `_moveEnemy(enemy, dt)` — 沿 A\* 路径移动
- `_enemyAttackWall(enemy, dt)` — 攻击墙体逻辑
- `_recalcPaths()` — 墙体摧毁/塔新建后重算所有敌人路径
- `_getSpawnPoints()` — 返回地图边缘的有效生成点

敌人行为规则：
- 地面：A\* 寻路，遇墙攻击
- 地下：A\* 寻路，遇墙攻击，远程塔不可瞄准（除非 detected）
- 空中：直线飞向城主府，无视地面障碍

**验证**：
1. WHEN 波次开始 → 从地图边缘生成敌人，敌人开始沿路径移动
2. WHEN 地面敌人遇墙 → 停下攻击墙体，DPS = `ATK × (1 - 墙DEF/(墙DEF+100))`
3. WHEN 墙体 HP 归零 → 墙体摧毁，敌人重新寻路
4. WHEN 空中敌人生成 → 直线飞向城主府，不绕路
5. WHEN 敌人到达城主府 → 城主府 HP 减少 `= 敌人HP×10% + 敌人ATK`，敌人消失
6. rAF 循环在退出防守模式时正确停止

---

### T10 — 塔攻击系统

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-07 塔攻击逻辑、§7.3 伤害公式 |
| **输入** | 塔实例列表、敌人实例列表 |
| **输出** | `tower-defense-manager.js` 中新增塔攻击方法 |
| **依赖** | T9（敌人系统） |
| **约束** | 塔攻击优先最接近城主府的敌人；攻速按 dt 计时；溅射/穿甲/探测等特殊效果 |
| **复杂度** | **L** |

新增方法：
- `_updateTowers(dt)` — 遍历所有塔，执行攻击逻辑
- `_findTarget(tower)` — 查找射程内可攻击目标（优先路径距离最短者）
- `_towerAttack(tower, enemy)` — 计算伤害，处理特殊效果
- `_calcDamage(atk, def)` — `atk × (1 - def / (def + 100))`
- `_handleSplash(tower, hitEnemy)` — 溅射伤害（火炮塔、导弹塔）
- `_handlePiercing(tower)` — 穿透光束（激光炮）
- `_handleTrap(trap, enemy)` — 陷阱触发逻辑
- `_handleDetection(tower)` — 探测地下敌人（瞭望塔、雷达站）
- `_applyHeroSkills(dt)` — 武将技能每 10 秒释放

塔类型特殊行为映射：

| 特殊效果 | 涉及塔 | 实现要点 |
|---------|-------|---------|
| 探测地下 | 瞭望塔、雷达站 | 设置敌人 `detected = true` |
| 溅射伤害 | 火炮塔、导弹塔 | 命中点 1 格内敌人受 50% 伤害 |
| 多目标 | 加特林塔 | 同时攻击 2 个敌人 |
| 穿甲 | 蒸汽弩炮 | 忽略 50% DEF |
| 穿透光束 | 激光炮 | 直线上所有敌人受伤 |
| 持续伤害 | 电网围栏 | 接触的敌人每秒受伤 |
| 对墙×2 | 攻城车 | 攻击墙体伤害翻倍 |
| 对塔×2 | 轰炸者 | 攻击塔伤害翻倍（v1 不实现塔可被摧毁，忽略此项） |
| 雷达增伤 | 雷达站 | 范围内塔 ATK +20% |

**验证**：
1. WHEN 步兵进入箭塔射程 → 箭塔每 1 秒攻击一次，伤害 = `20 × (1 - 8/108) ≈ 18.5`
2. WHEN 敌人 HP ≤ 0 → 从战场移除，触发 `td:enemy_killed`
3. WHEN 射程内多个敌人 → 攻击最接近城主府的
4. WHEN 地下敌人未被探测 → 远程塔跳过该目标
5. WHEN 瞭望塔射程内有地下敌人 → 设置 `detected = true`
6. WHEN 火炮塔命中 → 1 格内其他敌人受 50% 伤害
7. WHEN 拒马被踩踏 → 触发伤害 + 减速 50%/3秒，拒马消失
8. WHEN 武将已派驻 → 每 10 秒对随机敌人造成伤害

---

### T11 — 波次生命周期管理

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-05 启动波次、CAP-TD-08 波次结算、§7.4 波次奖励 |
| **输入** | `TDWaveTable`、奖励公式 |
| **输出** | `tower-defense-manager.js` 波次状态机 |
| **依赖** | T9（敌人系统）、T10（塔攻击） |
| **约束** | 状态机：idle → prep → active → settlement → idle；手动/自动奖励倍率不同 |
| **复杂度** | **M** |

波次状态机：
```
idle --[startWave]--> prep --[15s / skipPrep]--> active --[allCleared]--> settlement --> idle
                                                       --[townHallDead]--> failed --> idle
```

新增方法：
- `startWave()` — 进入 15 秒准备阶段
- `skipPrep()` — 跳过准备倒计时
- `_onAllEnemiesCleared()` — 波次通关结算
- `_onWaveFailed()` — 波次失败处理
- `_calcRewards(waveNum, isManual)` — 计算奖励（含手动加成和装备掉率）
- `getCurrentWavePreview()` — 返回下一波敌人预览

**验证**：
1. WHEN 点击"开始波次"且无活跃波次 → 进入 15 秒倒计时，显示预览
2. WHEN 点击"跳过准备" → 立即开始出怪
3. WHEN 所有敌人消灭且城主府 HP > 0 → `wave.current += 1`，更新 `wave.highest`，触发 `td:wave_cleared`
4. WHEN 手动模式通关 → 金币 ×1.3，经验 ×1.2
5. WHEN 波次 5 通关 → Boss 奖励 ×5 金币 ×3 经验，10% 蓝装掉率
6. WHEN 波次 20 通关 → 必出紫装，必得 3 玉璧
7. WHEN 首次进入防守模式 → 自动从第 1 波开始
8. 波次结算奖励通过 `ResourceManager.add()` 正确发放

---

### T12 — 城主府 HP + 波次失败

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-12 城主府防御 HP、CAP-TD-06 敌人到达城主府 |
| **输入** | `TownManager.getBuildingLevel('town_hall')` |
| **输出** | `tower-defense-manager.js` 中城主府 HP 管理 |
| **依赖** | T11（波次状态机） |
| **约束** | HP = 500 + 城主府等级 × 200；波次失败后 HP 恢复满；独立于正常建筑功能 |
| **复杂度** | **S** |

新增方法：
- `_initTownHallHp()` — 计算并设置城主府 HP
- `_damageTownHall(amount)` — 敌人到达时扣减 HP
- `_onTownHallDestroyed()` — HP 归零时波次失败

**验证**：
1. WHEN 城主府 Lv3 → maxHp = 500 + 3 × 200 = 1100
2. WHEN 敌人到达城主府 → HP 减少 = 敌人HP×10% + 敌人ATK
3. WHEN 城主府 HP 归零 → 波次失败，触发 `td:wave_failed`，HP 恢复满
4. WHEN 新一轮防守（从波次 1 开始）→ HP 恢复满
5. 波次失败后保留已通过波次的奖励

---

## 阶段 5：UI 层

> 实现全部 UI 面板和 Canvas 战场渲染。

### T13 — 防守模式入口 + Canvas 渲染框架 `js/ui/tower-defense-panel.js`

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-01 进入防守模式、§9.1 入口、§9.2 防守模式视图、§11.1 TD 战斗循环 |
| **输入** | TowerDefenseManager API、TownWorld（Canvas 复用） |
| **输出** | `js/ui/tower-defense-panel.js` — 全局 `TowerDefensePanel` 单例对象 |
| **依赖** | T4（Manager 状态）、T9-T12（战斗状态，用于渲染） |
| **约束** | 复用 TownWorld 的 Canvas 元素和摄像机；叠加 TD 图层；退出时恢复正常渲染 |
| **复杂度** | **XL**（Canvas 渲染 + 多子面板入口） |

实现内容：
- `init()` — 初始化面板、注册事件监听
- `_renderDefenseButton()` — 城镇地图右上角"城防"按钮（盾牌图标）
- `_enterDefenseMode()` — 切换 Canvas 为防守模式，叠加 TD 图层
- `_exitDefenseMode()` — 恢复正常城镇渲染
- `_renderBattlefield(ctx)` — Canvas 渲染：网格高亮、塔、敌人、弹道、血条、射程指示器
- `_renderStatusBar()` — 顶部状态栏（波次/金币）
- `_renderToolbar()` — 底部功能按钮 + 建造工具栏
- rAF 渲染循环与 Manager 战斗循环同步

**拆分为子任务**：

#### T13a — 防守入口按钮 + 模式切换框架

- 城镇地图右上角按钮渲染
- 解锁前灰显 + 锁图标
- 解锁后高亮 + 首次红点
- 进入/退出防守模式的 Canvas 切换

#### T13b — Canvas 战场渲染

- 网格高亮（可放置位置）
- 塔渲染（按类型/等级不同样式）
- 敌人渲染（按类型不同样式 + 血条）
- 弹道/特效渲染
- 射程指示器（选中塔时显示）
- 城主府 HP 进度条

**验证**：
1. WHEN 未解锁 → 城防按钮灰显+锁，点击显示解锁条件
2. WHEN 已解锁 → 按钮高亮，首次有红点
3. WHEN 点击城防按钮 → 切换为防守模式视图，显示网格和状态栏
4. WHEN 无活跃波次时点击返回 → 恢复正常城镇
5. WHEN 活跃波次时返回 → 弹出确认对话框
6. Canvas 渲染 ≥ 30 FPS（≤ 50 实体时）

---

### T14 — 塔建造工具栏 + 放置交互

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-02 建造、§9.2 视图 |
| **输入** | `TDTowerData`、`TowerDefenseManager.canBuildTower/buildTower` |
| **输出** | `tower-defense-panel.js` 中新增工具栏和点击交互 |
| **依赖** | T13（Canvas 框架） |
| **约束** | 横向滚动工具栏；灰显不可建/资源不足的塔；按时代过滤 |
| **复杂度** | **M** |

交互流程：
1. 从工具栏选择塔类型 → 进入"放置模式"
2. 在 Canvas 上点击格子 → 调用 `canBuildTower` 检查
3. 检查通过 → `buildTower` 执行，Canvas 刷新
4. 检查失败 → 显示对应提示

**验证**：
1. 工具栏显示当前时代已解锁的所有塔类型
2. 资源不足的塔灰显 + 显示缺少资源
3. 点击空闲格 → 塔成功放置
4. 点击已占用格 → 提示"该位置已占用"
5. 放置导致封路 → 提示"不能完全封锁敌人路径"

---

### T15 — 塔信息/升级/出售面板

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-03 升级、CAP-TD-04 出售、§9.3 塔信息面板 |
| **输入** | `TowerDefenseManager.upgradeTower/sellTower/getTowerStats` |
| **输出** | `tower-defense-panel.js` 中新增塔详情 OverlayPanel |
| **依赖** | T13（Canvas 框架） |
| **约束** | 使用 `OverlayPanel.show()` height:'half'；显示 ATK/射程/攻速/击杀数 |
| **复杂度** | **S** |

**验证**：
1. 点击已建塔 → 弹出信息面板，显示正确属性
2. 点击"升级" → 扣资源，属性更新
3. Lv5 塔 → 升级按钮灰显"已满级"
4. 点击"出售" → 移除塔，返还资源
5. 长按出售 → 有确认动作（防误操作）

---

### T16 — 科技面板 + 武将面板

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-11 科技研究 §9.4 科技面板、CAP-TD-10 武将派驻 §9.5 武将面板 |
| **输入** | `TDTechTree`、`TowerDefenseManager` 科技/武将 API |
| **输出** | `tower-defense-panel.js` 中新增科技和武将 OverlayPanel |
| **依赖** | T13（Canvas 框架） |
| **约束** | 科技面板 OverlayPanel height:'full'；武将面板 height:'half' |
| **复杂度** | **M** |

**科技面板**验证：
1. 显示 4 个时代，已解锁标 ✅，研究中标 🔄+倒计时，未解锁标 🔒+条件
2. 点击可研究时代 → 消耗资源，开始倒计时
3. 前置条件未满足 → 灰显+提示条件

**武将面板**验证：
1. 显示可用武将列表（排除出征队伍）
2. 已派驻武将显示"已派驻" + ATK 加成
3. 出征中武将显示"出征中(不可用)"
4. 点击"派驻" → 武将加入防守

---

### T17 — 波次结算弹窗 + 新手引导

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-TD-08 波次结算 §9.6 结算弹窗、§11.3 新手引导 |
| **输入** | 波次奖励数据、`tutorialSeen` 状态 |
| **输出** | `tower-defense-panel.js` 中新增结算 Modal 和引导弹窗 |
| **依赖** | T13（Canvas 框架） |
| **约束** | 使用 `Modal.show()`；引导完成后标记 `tutorialSeen: true` |
| **复杂度** | **S** |

**波次结算**验证：
1. 通关 → Modal 显示金币/经验奖励 + 手动加成说明
2. 显示下一波预览
3. 点击"继续" → 进入下一波倒计时
4. 点击"退出防守" → 退出防守模式

**新手引导**验证：
1. WHEN 首次进入 + `tutorialSeen === false` → 3 步引导弹窗
2. 引导完成 → `tutorialSeen = true`，存档
3. 再次进入 → 不再显示引导

---

## 阶段 6：集成与验证

> 将所有组件接入项目入口，执行端到端验证。

### T18 — index.html + main.js 集成

| 字段 | 值 |
|------|-----|
| **规范引用** | §13.1 集成清单 |
| **输入** | 阶段 1-5 全部产出文件 |
| **输出** | 修改 `index.html`（3 个 script 标签 + 1 个 pathfinding）、修改 `js/main.js` |
| **依赖** | T1-T17 全部完成 |
| **约束** | 按 core → data → modules → ui 顺序加载；main.js 必须最后 |
| **复杂度** | **S** |

**index.html** 新增 script：
```html
<!-- core -->
<script src="js/core/pathfinding.js"></script>
<!-- data -->
<script src="js/data/td-data.js"></script>
<!-- modules -->
<script src="js/modules/tower-defense-manager.js"></script>
<!-- ui -->
<script src="js/ui/tower-defense-panel.js"></script>
```

**main.js** 变更：
```javascript
// getFullState() 添加
towerDefense: TowerDefenseManager.getState(),

// initGame() 添加（在 ParkingManager.init 之后）
TowerDefenseManager.init(saved);

// UI 初始化添加
TowerDefensePanel.init();

// game:tick 回调添加
TowerDefenseManager.onTick(dt);
```

**验证**：
1. 浏览器打开 `index.html` 无 JS 报错
2. `getFullState().towerDefense` 包含完整 TD 状态
3. 存档 → 刷新 → 状态正确恢复
4. 现有功能不受影响（城镇/战斗/招募等）

---

### T19 — 存档恢复 + 离线防守验证

| 字段 | 值 |
|------|-----|
| **规范引用** | §11.2 存档恢复行为、CAP-TD-09 自动防守（离线部分） |
| **输入** | SaveManager、TowerDefenseManager |
| **输出** | 验证并修复存档恢复行为 |
| **依赖** | T18（集成完成） |
| **约束** | 旧存档无 `towerDefense` 字段时自动补齐默认值 |
| **复杂度** | **S** |

**验证**：
1. WHEN 旧存档无 `towerDefense` 键 → `init` 使用默认状态，不报错
2. WHEN 上次在波次进行中 → 回退到波次起始（敌人重生，HP 恢复满）
3. WHEN 上次不在波次中 → 正常恢复，从 `wave.current` 继续
4. WHEN 离线 2 小时 → 自动防守按每 `game:tick` 判定，累计推进多波
5. WHEN 研究进行中离线 → 上线检测时间差，超时则立即完成
6. WHEN 旧存档有 `towerDefense` 但缺少新增字段 → 合并默认值补齐

---

### T20 — 最终验证清单

| 字段 | 值 |
|------|-----|
| **规范引用** | 全部 CAP-TD-01~12 及补充场景 |
| **输入** | 全部代码产出 |
| **输出** | 验证报告 |
| **依赖** | T18, T19 |
| **复杂度** | **M** |

#### 功能验证矩阵

| # | 验证项 | 规范引用 | 通过条件 |
|---|--------|---------|---------|
| 1 | 解锁条件 | §3, CAP-TD-01 | 通关 stage_2_10 + 城主府≥3 时解锁，单条件不满足时不解锁 |
| 2 | 进入/退出防守 | CAP-TD-01 | 切换视图正常，活跃波次有确认框 |
| 3 | 建造塔 | CAP-TD-02 | 资源扣除、位置检查、封路检测全部通过 |
| 4 | 升级塔 | CAP-TD-03 | 属性按倍率表正确提升，Lv5 封顶 |
| 5 | 出售塔 | CAP-TD-04 | 非战斗 50% / 战斗 30% 返还 |
| 6 | 启动波次 | CAP-TD-05 | 15 秒准备 + 跳过 + 敌人预览 |
| 7 | 敌人行为 | CAP-TD-06 | 3 类敌人（地面/地下/空中）行为正确 |
| 8 | 塔攻击 | CAP-TD-07 | 伤害公式、优先级、特殊效果正确 |
| 9 | 波次结算 | CAP-TD-08 | 奖励计算、手动加成、Boss 掉落正确 |
| 10 | 自动防守 | CAP-TD-09 | 简化 DPS 判定 + 70% 奖励 |
| 11 | 武将派驻 | CAP-TD-10 | 互斥检查、ATK 加成、技能释放 |
| 12 | 科技研究 | CAP-TD-11 | 前置条件、费用、倒计时、离线补偿 |
| 13 | 城主府 HP | CAP-TD-12 | HP 公式、失败恢复 |
| 14 | 存档恢复 | §11.2 | 波次中存档回退、字段兼容 |
| 15 | 新手引导 | §11.3 | 3 步引导 + 标记 + 不重复 |
| 16 | 封路检测 | CAP-TD-02 | 完全封路阻止，部分封路允许 |
| 17 | 性能 | §11 | Canvas ≥ 30 FPS（50 实体）、A\* < 5ms |
| 18 | 事件完整性 | §8 | 11 个新事件全部正确触发 |
| 19 | 20 波通关 | §7.2 | 从第 1 波手动通关到第 20 波，数值合理 |
| 20 | 回归测试 | — | 城镇/战斗/招募/装备等现有功能无回归 |

#### WHEN/THEN 场景覆盖追踪

| 场景 | 任务覆盖 |
|------|---------|
| §3.3 解锁反馈 — 双条件满足 | T4 验证 3 |
| §3.3 解锁反馈 — 单条件不满足 | T4 验证 4, 5 |
| CAP-TD-01 — 进入防守模式 | T13 验证 3 |
| CAP-TD-01 — 退出无活跃波次 | T13 验证 4 |
| CAP-TD-01 — 退出有活跃波次 | T13 验证 5 |
| CAP-TD-02 — 正常建造 | T5 验证 1 |
| CAP-TD-02 — 位置占用 | T5 验证 2 |
| CAP-TD-02 — 资源不足 | T5 验证 3 |
| CAP-TD-02 — 封路阻止 | T5 验证 4 |
| CAP-TD-03 — 正常升级 | T5 验证 6 |
| CAP-TD-03 — 满级 | T5 验证 7 |
| CAP-TD-04 — 非战斗出售 | T5 验证 8 |
| CAP-TD-04 — 战斗中出售 | T5 验证 9 |
| CAP-TD-05 — 准备阶段 | T11 验证 1 |
| CAP-TD-05 — 跳过准备 | T11 验证 2 |
| CAP-TD-05 — 首次进入从波次 1 开始 | T11 验证 7 |
| CAP-TD-06 — A\* 寻路 | T9 验证 1 |
| CAP-TD-06 — 攻击墙体 | T9 验证 2 |
| CAP-TD-06 — 墙体摧毁重新寻路 | T9 验证 3 |
| CAP-TD-06 — 空中直线飞行 | T9 验证 4 |
| CAP-TD-06 — 敌人到达城主府 | T9 验证 5 |
| CAP-TD-07 — 塔自动攻击 | T10 验证 1 |
| CAP-TD-07 — 敌人死亡 | T10 验证 2 |
| CAP-TD-07 — 优先攻击最近 | T10 验证 3 |
| CAP-TD-07 — 地下需探测 | T10 验证 4, 5 |
| CAP-TD-07 — 陷阱触发 | T10 验证 7 |
| CAP-TD-08 — 通关结算 | T11 验证 3 |
| CAP-TD-08 — 手动加成 | T11 验证 4 |
| CAP-TD-08 — Boss 奖励 | T11 验证 5, 6 |
| CAP-TD-09 — 自动通关 | T8 验证 2 |
| CAP-TD-09 — 胜率不足 | T8 验证 3 |
| CAP-TD-10 — 派驻武将 | T7 验证 1 |
| CAP-TD-10 — 队伍互斥 | T7 验证 2 |
| CAP-TD-10 — 满员替换 | T7 验证 3 |
| CAP-TD-10 — ATK 加成 | T7 验证 4 |
| CAP-TD-11 — 开始研究 | T6 验证 1 |
| CAP-TD-11 — 研究完成 | T6 验证 2 |
| CAP-TD-11 — 城主府加速 | T6 验证 3 |
| CAP-TD-11 — 离线完成 | T6 验证 4 |
| CAP-TD-12 — HP 公式 | T12 验证 1 |
| CAP-TD-12 — 敌人扣 HP | T12 验证 2 |
| CAP-TD-12 — HP 归零失败 | T12 验证 3 |
| §11.2 — 存档波次中恢复 | T19 验证 2 |
| §11.2 — 存档正常恢复 | T19 验证 3 |
| §11.3 — 新手 3 步引导 | T17 验证 |

---

## 新增文件汇总

| 文件 | 任务 | 类型 |
|------|------|------|
| `js/data/td-data.js` | T1 | 新建 |
| `js/core/pathfinding.js` | T3 | 新建 |
| `js/modules/tower-defense-manager.js` | T4-T12 | 新建 |
| `js/ui/tower-defense-panel.js` | T13-T17 | 新建 |

## 修改文件汇总

| 文件 | 任务 | 变更内容 |
|------|------|---------|
| `js/modules/town-manager.js` | T2 | 新增 `getCollisionGrid()` |
| `js/ui/town-world.js` | T2 | 新增 `getCollisionGrid()` |
| `index.html` | T18 | 添加 4 个 `<script>` 标签 |
| `js/main.js` | T18 | getFullState + initGame + tick 注册 |

## 复杂度分布

| 复杂度 | 任务数 | 任务列表 |
|--------|--------|---------|
| S | 8 | T2, T6, T7, T8, T12, T15, T17, T18, T19 |
| M | 7 | T3, T4, T5, T11, T14, T16, T20 |
| L | 2 | T1, T9, T10 |
| XL | 1 | T13 (拆分为 T13a + T13b) |

预估总任务量：20 个任务，建议实施 Agent 按阶段顺序执行，阶段内可并行的任务标记在依赖图中。
