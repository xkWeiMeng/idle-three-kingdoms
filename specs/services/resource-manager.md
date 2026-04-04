---
status: Draft
created: 2026-04-04
updated: 2026-04-04
author: AI (spec-architect)
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
- `get(type)` → `number` — 返回指定资源当前值
- `getAll()` → `object` — 返回所有资源的快照 `{ gold, jade, exp, food, wood, stone, iron }`
- `getCap(type)` → `number` — 返回指定资源的上限（优先查询 TownManager 覆盖，否则用 `CONSTANTS.RESOURCE_BASE_CAP`）

**行为规则**：
- `get()` 返回精确当前值，不做格式化
- `getAll()` 返回的是快照对象，修改它不影响内部状态
- `getCap()` 对 `jade` 和 `exp` 返回 `Infinity`（无上限）

**验收场景**：

```
WHEN 游戏初始化完成，无存档
THEN get('gold') 返回 0
AND getAll() 返回所有资源值为 0 的对象

WHEN TownManager 某建筑提供 gold 上限 +5000
THEN getCap('gold') 返回 15000（基础 10000 + 5000）

WHEN 查询 jade 上限
THEN getCap('jade') 返回 Infinity
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

**行为规则**：
- 增加后的值不得超过 `getCap(type)`，超出部分**截断**（不报错）
- 增加成功后 emit `resource:changed` 事件（type, newAmount）
- 如果 `EconomyManager` 存在，调用其记录方法
- `amount` 必须为正数，传入 0 或负数时**静默忽略**

**验收场景**：

```
WHEN gold 当前 9500，上限 10000
AND add('gold', 1000)
THEN gold 变为 10000（截断到上限）
AND emit resource:changed('gold', 10000)

WHEN jade 当前 500
AND add('jade', 1000)
THEN jade 变为 1500（无上限约束）

WHEN add('gold', 0)
THEN gold 不变，不 emit 事件

WHEN add('gold', 500, 'battle', 'stage_5', '通关奖励')
THEN gold 增加 500
AND EconomyManager 记录此事件（category='battle', source='stage_5'）
```

---

### 能力 3：消耗资源

**描述**：消耗指定资源，原子操作，余额不足则失败。

**接口**：
- `spend(type, amount)` → `boolean` — 单资源消耗
- `spendMultiple(costs)` → `boolean` — 批量消耗（全有或全无）
  - `costs`: `[{ type, amount }, ...]`
- `canAfford(type, amount)` → `boolean`
- `canAffordMultiple(costs)` → `boolean`

**行为规则**：
- `spend()` 先检查 `canAfford()`，不足时返回 `false`，不修改任何值
- `spendMultiple()` 先用 `canAffordMultiple()` 检查所有项，任一不足则**全部不扣**
- 消耗成功后 emit `resource:changed` 事件
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
AND spendMultiple([{ type:'gold', amount:300 }, { type:'jade', amount:200 }])
THEN 全部不扣（jade 不足），返回 false
AND gold 仍为 500, jade 仍为 100

WHEN gold=500, jade=200
AND spendMultiple([{ type:'gold', amount:300 }, { type:'jade', amount:100 }])
THEN gold=200, jade=100，返回 true
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

WHEN 今日尚未领取
AND claimDailyReward()
THEN 对应资源增加，返回奖励对象
AND checkDailyLogin().claimed 变为 true

WHEN 今日已领取
AND claimDailyReward()
THEN 返回 null，资源不变

WHEN 连续登录第 7 天
AND claimDailyReward()
THEN gold +2000, jade +50, 获得 1 次免费招募

WHEN 连续登录第 8 天
THEN day 重置为 1，奖励循环重新开始
```

---

### 能力 6：统计追踪

**描述**：追踪游戏统计数据供 UI 展示。

**接口**：
- `getStats()` → `object` — 返回统计快照
- `addBattleCount()` → `void` — 战斗计数 +1
- `setHighestStage(stage)` → `void` — 更新最高关卡（仅在更高时更新）

**状态字段**：
```json
{
  "totalGoldEarned": "number — 累计获得金币",
  "totalBattles": "number — 累计战斗次数",
  "totalPlayTime": "number — 累计游戏时长（秒）",
  "highestStage": "number — 最高通过关卡",
  "loginDays": "number — 累计登录天数",
  "lastLoginDate": "string — 上次登录日期",
  "dailyLoginClaimed": "boolean — 今日是否已领取"
}
```

**验收场景**：

```
WHEN 当前 highestStage = 5
AND setHighestStage(3)
THEN highestStage 仍为 5（不回退）

WHEN 当前 highestStage = 5
AND setHighestStage(8)
THEN highestStage 变为 8
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
1. `saved` 为 `undefined` — 首次游戏，使用全零默认值
2. `saved` 为旧版扁平结构（直接 `{ gold, jade, ... }`） — 迁移到 `{ resources: { ... }, stats: { ... } }` 嵌套结构
3. `saved` 缺少新增字段（如旧存档无 `wood`） — 补充默认值 0

## 导航

- 系统契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 相关服务：[specs/services/hero-manager.md](hero-manager.md)（消耗 EXP 升级）
