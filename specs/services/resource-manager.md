---
status: Active
created: 2026-04-04
updated: 2026-04-10
author: AI (spec-architect)
reviewed-by: AI (spec-reviewer)
system-spec: specs/system/core-contracts.md
---

# 服务规范：ResourceManager

## 概述

管理游戏内所有资源（金币、玉璧、经验、食物、木材、石料、铁矿）的增减、上限、每日登录奖励和统计追踪。
是最底层的服务，几乎所有其他 Manager 都依赖它来消耗或产出资源。

## 能力

### 能力 1：查询资源

**描述**：查询单个或全部资源的当前值。

**接口**：
- `get(type)` → `number` — 返回指定资源当前值（不存在的类型返回 0）
- `getAll()` → `object` — 返回所有资源的快照 `{ gold, jade, exp, food, wood, stone, iron }`
- `getCap(type)` → `number` — 返回指定资源的上限（优先查询 TownManager 覆盖，否则用 `CONSTANTS.RESOURCE_BASE_CAP`）

**行为规则**：
- `get()` 返回精确当前值，不做格式化；不存在的资源类型返回 0
- `getAll()` 返回的是快照对象，修改它不影响内部状态
- `getCap()` 对 `jade` 和 `exp` 返回 `Infinity`（无上限），对不在 `RESOURCE_BASE_CAP` 中的未知类型也返回 `Infinity`

**验收场景**：

```
WHEN 游戏初始化完成，无存档
THEN get('gold') 返回 500（默认初始金币）
AND get('food') 返回 100（默认初始食物）
AND get('jade') 返回 0
AND getAll() 返回 { gold:500, jade:0, exp:0, food:100, wood:0, stone:0, iron:0 }

WHEN TownManager 某建筑提供 gold 上限 +5000
THEN getCap('gold') 返回 55000（基础 50000 + 5000）

WHEN 查询 jade 上限
THEN getCap('jade') 返回 Infinity

WHEN 查询 exp 上限
THEN getCap('exp') 返回 Infinity

WHEN get('invalidType')
THEN 返回 0
```

---

### 能力 2：增加资源

**描述**：增加指定类型的资源，受上限约束（jade/exp 除外）。

**接口**：
- `add(type, amount, category?, source?, detail?)` → `void`
  - `type`: 资源类型 key（引用核心契约资源枚举）
  - `amount`: 正整数
  - `category`: 可选，经济分类（如 'battle', 'daily', 'offline'）
  - `source`: 可选，来源标识
  - `detail`: 可选，附加信息
- `addMultiple(amounts, category?, source?, detail?)` → `void`
  - `amounts`: 资源对象 `{ type: amount, ... }`（如 `{ gold: 500, wood: 100 }`）
  - 遍历对象中每个正值项调用 `add()`

**行为规则**：
- 增加后的值不得超过 `getCap(type)`，超出部分**截断**（不报错）
- 已达上限时 amount 被截断为 0，直接返回（不 emit 事件）
- 增加成功后 emit `resource:changed` 事件（type, newAmount）
- 如果 `EconomyManager` 存在，调用其 `logEvent()` 记录
- `amount` 必须为正数，传入 0 或负数时**静默忽略**
- 增加 gold 时，同步累加 `_stats.totalGoldEarned`

**验收场景**：

```
WHEN gold 当前 49500，上限 50000
AND add('gold', 1000)
THEN gold 变为 50000（截断到上限）
AND emit resource:changed('gold', 50000)

WHEN jade 当前 500
AND add('jade', 1000)
THEN jade 变为 1500（无上限约束）

WHEN add('gold', 0)
THEN gold 不变，不 emit 事件

WHEN add('gold', -5)
THEN gold 不变，不 emit 事件

WHEN add('gold', 500, 'battle', 'stage_5', '通关奖励')
THEN gold 增加 500
AND EconomyManager.logEvent 被调用（type='gold', amount=500, category='battle', source='stage_5'）

WHEN gold 当前 50000（已满），上限 50000
AND add('gold', 100)
THEN gold 不变（截断后增量为 0），不 emit 事件

WHEN addMultiple({ gold: 500, wood: 100 }, 'battle', 'stage_1')
THEN gold 增加 500, wood 增加 100（各自独立调用 add()）
```

---

### 能力 3：消耗资源

**描述**：消耗指定资源，原子操作，余额不足则失败。

**接口**：
- `spend(type, amount, category?, source?, detail?)` → `boolean` — 单资源消耗
  - `category`, `source`, `detail`: 可选，经济追踪参数（同 `add()`）
- `spendMultiple(costs, category?, source?, detail?)` → `boolean` — 批量消耗（全有或全无）
  - `costs`: 资源对象 `{ type: amount, ... }`（如 `{ gold: 500, wood: 100 }`）
- `canAfford(type, amount)` → `boolean`
- `canAffordMultiple(costs)` → `boolean`
  - `costs`: 资源对象 `{ type: amount, ... }`

**行为规则**：
- `spend()` 先检查 `canAfford()`，不足时返回 `false`，不修改任何值
- `spendMultiple()` 先用 `canAffordMultiple()` 检查所有项，任一不足则**全部不扣**
- `spendMultiple()` 内部逐项调用 `spend()`，每项独立 emit 事件和 EconomyManager 记录
- 消耗成功后 emit `resource:changed` 事件
- 如果 `EconomyManager` 存在，调用其 `logEvent()` 记录（amount 为负值）
- `amount` 必须为正数

**验收场景**：

```
WHEN gold 当前 500
AND spend('gold', 300)
THEN gold 变为 200，返回 true

WHEN gold 当前 200
AND spend('gold', 300)
THEN gold 不变（仍为 200），返回 false

WHEN gold=500, jade=100
AND spendMultiple({ gold: 300, jade: 200 })
THEN 全部不扣（jade 不足），返回 false
AND gold 仍为 500, jade 仍为 100

WHEN gold=500, jade=200
AND spendMultiple({ gold: 300, jade: 100 })
THEN gold=200, jade=100，返回 true

WHEN spend('gold', 300, 'upgrade', 'hero_levelup', '武将升级')
AND gold 充足
THEN gold 减少 300，返回 true
AND EconomyManager.logEvent 被调用（type='gold', amount=-300, category='upgrade'）

WHEN canAfford('gold', 500) 且 gold=500
THEN 返回 true

WHEN canAfford('gold', 501) 且 gold=500
THEN 返回 false

WHEN canAffordMultiple({ gold: 300, wood: 100 }) 且 gold=500, wood=50
THEN 返回 false（wood 不足）
```

---

### 能力 4：食物定时回复

**描述**：每 30 秒自动回复 1 点食物，受上限约束。

**接口**：
- `onTick(dt)` — 由 GameLoop 每秒调用

**行为规则**：
- 内部累加 `dt`，每累计 30 秒，`food += 1`（受 cap 约束）
- 食物已满时**不回复**，但计时器继续运转
- 回复时 emit `resource:changed('food', newAmount)`

**验收场景**：

```
WHEN food = 190, cap = 200
AND 经过 30 个 tick（30 秒）
THEN food = 191

WHEN food = 200, cap = 200
AND 经过 30 个 tick
THEN food 仍为 200（已满不回复）

WHEN food = 199, cap = 200
AND 经过 60 个 tick（60 秒）
THEN food = 200（回复 2 次，但第 2 次被 cap 截断为 200）
```

---

### 能力 5：每日登录奖励

**描述**：7 天循环的每日登录奖励系统。

**接口**：
- `checkDailyLogin()` → `{ day, reward, claimed }` — 查询今日登录状态
- `claimDailyReward()` → `object|null` — 领取当日奖励

**行为规则**：
- 每日判断基于本地日期变化（非服务器时间）
- 7 天循环：第 8 天重置为第 1 天
- 每天只能领取一次，`claimed` 为 `true` 时 `claimDailyReward()` 返回 `null`
- 领取后通过 `add()` 发放资源

**奖励表**：

| 天数 | Gold | Jade | Food | 特殊 |
|------|------|------|------|------|
| 1 | 500 | 20 | — | — |
| 2 | 500 | 20 | — | — |
| 3 | 1000 | 20 | 20 | — |
| 4 | 500 | 20 | — | — |
| 5 | 500 | 20 | — | — |
| 6 | 1000 | 20 | 20 | — |
| 7 | 2000 | 50 | — | 免费招募 ×1 |

**验收场景**：

```
WHEN 今天是第一次打开游戏
THEN checkDailyLogin() 返回 { day: 1, reward: {...}, claimed: false }
AND day 表示累计登录天数（非循环值），奖励索引 = (day - 1) % 7

WHEN 今日尚未领取
AND claimDailyReward()
THEN 对应资源增加（通过 add() 调用），返回奖励对象的深拷贝
AND checkDailyLogin().claimed 变为 true

WHEN 今日已领取
AND claimDailyReward()
THEN 返回 null，资源不变

WHEN 累计登录第 7 天（loginDays=7）
AND claimDailyReward()
THEN gold +2000, jade +50, 获得 1 次免费招募（reward.freeRecruit = true）

WHEN 累计登录第 8 天（loginDays=8）
THEN 奖励索引 = (8-1) % 7 = 0，等同第 1 天的奖励

WHEN 同一天内多次调用 checkDailyLogin()
THEN loginDays 不重复增加（基于 lastLoginDate 判断）
```

---

### 能力 6：统计追踪

**描述**：追踪游戏统计数据供 UI 展示。

**接口**：
- `getStats()` → `object` — 返回统计快照
- `addBattleCount()` → `void` — 战斗计数 +1
- `setHighestStage(stageId)` → `void` — 更新最高关卡（仅在 stageId 大于当前值时更新）

**状态字段**：
```json
{
  "totalGoldEarned": "number — 累计获得金币",
  "totalBattles": "number — 累计战斗次数",
  "totalPlayTime": "number — 累计游戏时长（秒）",
  "highestStage": "string — 最高通过关卡 ID（如 'stage_2_5'），初始为空字符串",
  "loginDays": "number — 累计登录天数",
  "lastLoginDate": "string — 上次登录日期（ISO 格式 'YYYY-MM-DD'）",
  "dailyLoginClaimed": "boolean — 今日是否已领取"
}
```

**验收场景**：

```
WHEN 当前 highestStage = 'stage_1_5'
AND setHighestStage('stage_1_3')
THEN highestStage 仍为 'stage_1_5'（不回退）

WHEN 当前 highestStage = 'stage_1_5'
AND setHighestStage('stage_2_8')
THEN highestStage 变为 'stage_2_8'

WHEN 当前 highestStage = ''（初始）
AND setHighestStage('stage_1_1')
THEN highestStage 变为 'stage_1_1'

WHEN addBattleCount()
THEN totalBattles += 1

WHEN onTick(1) 被调用
THEN totalPlayTime += 1
```

## 内部状态机

ResourceManager 无复杂状态机。食物回复为简单累加器：

| 状态 | 转换到 | 触发器 | 守卫条件 |
|------|--------|--------|----------|
| 计时中 | 回复 | `_foodTimer >= 30` | `food < cap` |
| 回复 | 计时中 | 回复完成 | 始终 |

## 依赖

| 依赖项 | 方向 | 说明 |
|--------|------|------|
| TownManager | ResourceManager → TownManager | 查询建筑效果覆盖资源上限 |
| EconomyManager | ResourceManager → EconomyManager | 记录资源变动事件 |

## 数据所有权

| 实体 | 本服务拥有的 | 共享给 | 方式 |
|------|-------------|--------|------|
| 资源余额 | gold, jade, exp, food, wood, stone, iron | All Managers | `get()` / `canAfford()` |
| 每日登录 | loginDays, lastLoginDate, dailyLoginClaimed | UI | `checkDailyLogin()` |
| 游戏统计 | totalGoldEarned, totalBattles 等 | UI | `getStats()` |

## 存档兼容

**迁移规则**：`init(saved)` 必须处理以下情况：
1. `saved` 为 `undefined` — 首次游戏，使用默认资源值（gold=500, food=100, 其余为 0）
2. `saved` 含 `resources` 键，其中又含 `resources` 子键（嵌套结构 `{ resources: { resources: {...}, stats: {...} } }`）— 解包嵌套
3. `saved` 含 `resources` 键，值为扁平资源对象（`{ resources: { gold, jade, ... } }`）— 直接使用
4. `saved` 为旧版扁平结构（直接 `{ gold, jade, ... }`） — 迁移到内部 `_state`
5. `saved` 缺少新增字段（如旧存档无 `wood`/`stone`/`iron`） — 补充默认值 0

**`getState()`** 返回格式：
```json
{
  "resources": { "gold": 500, "jade": 0, "exp": 0, "food": 100, "wood": 0, "stone": 0, "iron": 0 },
  "stats": { "totalGoldEarned": 0, "totalBattles": 0, "totalPlayTime": 0, "highestStage": "", "loginDays": 1, "lastLoginDate": "2026-04-10", "dailyLoginClaimed": false }
}
```

**验收场景**：

```
WHEN init(undefined)
THEN _state = { gold:500, jade:0, exp:0, food:100, wood:0, stone:0, iron:0 }
AND _stats 为全默认值

WHEN init({ resources: { gold: 1000, jade: 50 } })（旧存档，缺少 wood/stone/iron）
THEN _state.gold = 1000, _state.jade = 50
AND _state.wood = 0, _state.stone = 0, _state.iron = 0（补充默认值）

WHEN init({ resources: { resources: { gold: 2000 }, stats: { totalBattles: 5 } } })
THEN _state.gold = 2000, _stats.totalBattles = 5（解包嵌套结构）

WHEN getState()
THEN 返回 { resources: {...}, stats: {...} } 深拷贝
AND 修改返回值不影响内部状态
```

## 导航

- 系统契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 相关服务：[specs/services/hero-manager.md](hero-manager.md)（消耗 EXP 升级）
