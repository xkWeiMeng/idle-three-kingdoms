---
status: Active
created: 2026-04-05
updated: 2026-04-05
author: AI (spec-architect)
system-spec: specs/system/core-contracts.md
---

# 服务规范：EconomyManager

## 概述

追踪全局经济活动、提供历史查询、触发资源预警和生成优化建议。

EconomyManager **不拥有**任何资源——它只是观测者：监听其他 Manager 发出的资源变动事件，记录事件流，并在此基础上提供聚合分析和主动告警。所有写操作均通过 EventBus 被动接收，不主动调用其他 Manager 的写接口。

资源类型枚举定义在 [核心契约 → 资源类型枚举](../system/core-contracts.md#资源类型枚举)。

---

## 持久化状态结构

```json
{
  "events": "EconomyEvent[] — 经济事件环形缓冲，最多保留 1000 条，按时间升序",
  "hourlyAggregates": "HourlyAggregate[] — 小时聚合数据，最多保留 168 条（7 天）",
  "dailyAggregates": "DailyAggregate[] — 日聚合数据（预留字段，当前未使用）",
  "lifetimeStats": {
    "totalIncome":  "Record<ResourceType, number> — 各资源历史总收入，≥ 0",
    "totalExpense": "Record<ResourceType, number> — 各资源历史总支出，≥ 0"
  },
  "alerts": "Alert[] — 活跃预警列表，最多保留 50 条",
  "lastAlertCheck": "number — 上次预警检查时的 Date.now() 时间戳（ms），0 表示从未检查"
}
```

**EconomyEvent 结构**：

```json
{
  "id":           "string — 唯一标识，格式 'evt_{uid}'（Utils.uid() 生成）",
  "timestamp":    "number — Date.now() 时间戳（ms），记录时刻",
  "resourceType": "string — 资源类型 key，见核心契约资源类型枚举",
  "amount":       "number — 正数为收入，负数为支出",
  "balance":      "number — 记录时刻该资源的当前余额快照",
  "category":     "string — 来源分类，如 'battle'、'building'、'recruit'、'login'",
  "source":       "string — 来源标识，如 'stage_reward'、'lumber_camp'",
  "detail":       "string — 人类可读描述，可为空字符串"
}
```

**HourlyAggregate 结构**：

```json
{
  "hour":      "string — 小时字符串，格式 'YYYY-MM-DDTHH'（如 '2026-04-05T14'）",
  "resources": "Record<ResourceType, { income: number, expense: number, net: number }> — 仅包含该小时有事件的资源"
}
```

**Alert 结构**：

```json
{
  "id":           "string — 唯一标识，格式 'alert_{timestamp}_{random}'",
  "type":         "'resource_depleting' | 'negative_income' | 'near_cap'",
  "severity":     "'warning' | 'info'",
  "resourceType": "string — 触发预警的资源类型",
  "message":      "string — 人类可读描述",
  "timestamp":    "number — 触发时刻 Date.now()",
  "dismissed":    "boolean — 是否已关闭，默认 false"
}
```

**规则**：
- `events` 超出 1000 条时，从头部移除最旧的记录（FIFO 裁剪）
- `hourlyAggregates` 超出 168 条时，从头部移除最旧的记录
- `alerts` 超出 50 条时，从头部移除最旧的记录
- `lifetimeStats` 中的值只增不减，跨存档累计

---

## 能力

### 能力 1：记录经济事件（logEvent）

**描述**：向事件缓冲区追加一条经济事件，同步更新终身统计，并通知监听方。

**接口**：
- `logEvent(resourceType, amount, category, source, detail)` → `void`

**行为规则**：
- `amount > 0` 时追加到 `lifetimeStats.totalIncome[resourceType]`
- `amount < 0` 时将 `Math.abs(amount)` 追加到 `lifetimeStats.totalExpense[resourceType]`
- `amount = 0` 时事件仍被记录，但不更新终身统计
- 记录后若 `events.length > 1000`，删除 `events[0]`（最旧一条）
- 记录完成后 emit `economy:event_logged`，载荷为 `{ event: EconomyEvent }`

**验收场景**：

```
WHEN logEvent('gold', 500, 'battle', 'BattleManager', '击杀奖励')
THEN events 末尾新增一条 EconomyEvent
AND event.resourceType = 'gold'
AND event.amount = 500
AND event.category = 'battle'
AND lifetimeStats.totalIncome.gold += 500
AND emit economy:event_logged(event)

WHEN logEvent('jade', -100, 'recruit', 'RecruitManager', '单抽消耗')
THEN lifetimeStats.totalExpense.jade += 100
AND event.amount = -100

WHEN events.length = 1000
AND logEvent('gold', 1, 'battle', 'BattleManager', '')
THEN events.length 保持 1000
AND 原先 events[0] 被删除
AND 新事件出现在 events[999]

WHEN logEvent('gold', 0, 'system', 'GameManager', '校准事件')
THEN events.length += 1
AND lifetimeStats.totalIncome.gold 和 totalExpense.gold 均不变
```

---

### 能力 2：事件查询（getEvents / getRecentEvents）

**描述**：按条件过滤事件缓冲区，返回符合条件的事件数组（只读副本）。

**接口**：
- `getEvents(filter)` → `EconomyEvent[]`
- `getRecentEvents(count)` → `EconomyEvent[]`

**filter 参数字段**（均可选）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `resourceType` | `string` | 精确匹配资源类型 |
| `category` | `string` | 精确匹配分类 |
| `since` | `number` | 仅返回 `timestamp >= since` 的事件（ms） |
| `until` | `number` | 仅返回 `timestamp <= until` 的事件（ms） |
| `incomeOnly` | `boolean` | `true` 时仅返回 `amount > 0` 的事件 |
| `expenseOnly` | `boolean` | `true` 时仅返回 `amount < 0` 的事件 |

**行为规则**：
- 返回数组为浅拷贝，修改不影响内部 `events`
- `getRecentEvents(count)` 等价于 `getEvents({})` 取最后 `count` 条
- `incomeOnly` 与 `expenseOnly` 同时为 `true` 时返回空数组

**验收场景**：

```
WHEN getEvents({ resourceType: 'gold', incomeOnly: true })
THEN 仅返回 resourceType = 'gold' 且 amount > 0 的事件

WHEN getEvents({ since: T1, until: T2 })
THEN 仅返回 timestamp ∈ [T1, T2] 的事件

WHEN getRecentEvents(10)
AND events.length = 250
THEN 返回 events[240..249]（最后 10 条）

WHEN getEvents({ incomeOnly: true, expenseOnly: true })
THEN 返回空数组 []
```

---

### 能力 3：净收入速率（getNetIncome）

**描述**：计算指定资源在过去 N 分钟内的净收入速率，返回每分钟收入、支出和净值。

**接口**：
- `getNetIncome(resourceType, minutes)` → `{ income: number, expense: number, net: number }`

**行为规则**：
- 查询时间窗口：`[Date.now() - minutes * 60000, Date.now()]`
- `income` = 窗口内 `amount > 0` 的事件总和 ÷ `minutes`（每分钟收入速率）
- `expense` = 窗口内 `Math.abs(amount)` 的事件总和 ÷ `minutes`（每分钟支出速率，正数表示）
- `net` = `income - expense`（可为负数）
- 窗口内无事件时三值均为 `0`
- 返回值精度不限，调用方负责展示格式化

**验收场景**：

```
WHEN getNetIncome('gold', 10)
AND 过去 10 分钟内有 gold 收入事件总计 300，支出事件总计 100
THEN 返回 { income: 30, expense: 10, net: 20 }

WHEN getNetIncome('wood', 5)
AND 过去 5 分钟内无 wood 相关事件
THEN 返回 { income: 0, expense: 0, net: 0 }

WHEN getNetIncome('food', 30)
AND 过去 30 分钟内 food 收入 0，支出 900
THEN 返回 { income: 0, expense: 30, net: -30 }
```

---

### 能力 4：分类统计（getIncomeByCategory / getExpenseByCategory）

**描述**：统计指定资源在时间窗口内各分类的收入或支出汇总。

**接口**：
- `getIncomeByCategory(resourceType, sinceMs)` → `Record<category, number>`
- `getExpenseByCategory(resourceType, sinceMs)` → `Record<category, number>`

**行为规则**：
- 仅统计 `timestamp >= sinceMs` 的事件
- `getIncomeByCategory` 仅聚合 `amount > 0` 的事件，按 `category` 求和
- `getExpenseByCategory` 仅聚合 `amount < 0` 的事件，按 `category` 累加 `Math.abs(amount)`
- 返回对象中只包含有记录的分类（不补零）

**验收场景**：

```
WHEN getIncomeByCategory('gold', sinceMs)
AND 该窗口内有 battle 收入 500、login 收入 200
THEN 返回 { battle: 500, login: 200 }

WHEN getExpenseByCategory('jade', sinceMs)
AND 该窗口内无 jade 支出事件
THEN 返回 {}
```

---

### 能力 5：小时聚合数据（getHourlyData）

**描述**：返回最近 N 小时的聚合数据，用于趋势图表展示。

**接口**：
- `getHourlyData(resourceType, hours)` → `Array<HourlyAggregate>`

**行为规则**：
- 从 `hourlyAggregates` 中取最后 `hours` 条
- 返回完整的 HourlyAggregate 对象（含所有资源的收支，调用方自行提取需要的 resourceType）
- 若 `hourlyAggregates` 不足 `hours` 条，返回全部可用数据
- 返回数组按写入顺序排列（时间升序，最旧在前）

**验收场景**：

```
WHEN getHourlyData('gold', 24)
AND hourlyAggregates 共有 168 条
THEN 返回最后 24 条完整 HourlyAggregate 对象（调用方从 resources.gold 读取收支）

WHEN getHourlyData('iron', 48)
AND hourlyAggregates 仅有 10 条
THEN 返回全部 10 条
```

---

### 能力 6：终身统计（getLifetimeStats）

**描述**：返回自游戏开始以来各资源的累计收入和支出。

**接口**：
- `getLifetimeStats()` → `{ totalIncome: Record<ResourceType,number>, totalExpense: Record<ResourceType,number> }`

**行为规则**：
- 返回深拷贝，修改返回值不影响内部 `lifetimeStats`
- 返回值中所有资源类型字段始终存在（不因零值缺失）

**验收场景**：

```
WHEN getLifetimeStats()
THEN 返回 lifetimeStats 的深拷贝
AND 修改返回对象不影响 _state.lifetimeStats
AND 返回对象包含所有 7 种资源类型的键（gold/jade/exp/food/wood/stone/iron）
```

---

### 能力 7：预警检测（checkAlerts）

**描述**：检测资源健康状况，触发相应预警。每 60 tick 执行一次。

**接口**：
- `checkAlerts()` → `void`（内部方法，由 `onTick` 调用）

**行为规则**：

| 预警类型 | severity | 触发条件 |
|----------|----------|----------|
| `resource_depleting` | `warning` | 某资源净速率 < 0，且按此速率余额将在 30 分钟内耗尽 |
| `negative_income` | `info` | 某资源净速率 < 0（不满足 resource_depleting 条件时） |
| `near_cap` | `info` | 某资源当前值 > 该资源上限的 90% |

- 去重规则：同一 `type + resourceType` 组合，若最近 10 分钟（600000 ms）内已存在同类预警（无论是否 dismissed），则跳过，不重复触发
- `resource_depleting` 优先于 `negative_income`：当 depleting 条件满足时，不额外触发 `negative_income`
- 每次触发预警 emit `economy:alert`，载荷为 `{ alert: Alert }`（新建的 Alert 对象）
- `alerts` 超出 50 条时裁剪最旧记录（含已关闭）

**耗尽时间计算**：
```
minutesToDepletion = currentBalance / Math.abs(netRatePerMinute)
触发条件：netRatePerMinute < 0 AND minutesToDepletion < 30
```

**验收场景**：

```
WHEN checkAlerts()
AND gold 净速率 = -50/分钟
AND gold 当前余额 = 1200（耗尽时间 = 24 分钟 < 30）
THEN 创建 type='resource_depleting', severity='warning', resourceType='gold' 的 Alert
AND emit economy:alert(alert)
AND 不额外触发 negative_income 预警

WHEN checkAlerts()
AND 10 分钟内已存在未关闭的 type='resource_depleting', resourceType='gold' 预警
THEN 不创建新的 resource_depleting 预警
AND 不 emit economy:alert

WHEN checkAlerts()
AND food 当前值 = 190
AND food 上限 = 200（190 / 200 = 95% > 90%）
THEN 创建 type='near_cap', severity='info', resourceType='food' 的 Alert
AND emit economy:alert(alert)

WHEN checkAlerts()
AND wood 净速率 = -2/分钟
AND wood 当前余额 = 400（耗尽时间 = 200 分钟 ≥ 30）
THEN 创建 type='negative_income', severity='info', resourceType='wood' 的 Alert
AND 不创建 resource_depleting（因耗尽时间 ≥ 30 分钟）

WHEN checkAlerts()
AND alerts.length = 50
AND 新预警触发
THEN alerts[0]（最旧）被移除
AND 新预警被追加到 alerts 末尾
AND alerts.length 保持 50
```

---

### 能力 8：查询与关闭预警（getActiveAlerts / dismissAlert）

**描述**：获取当前未关闭的预警列表，或手动关闭指定预警。

**接口**：
- `getActiveAlerts()` → `Alert[]`（未关闭预警的浅拷贝数组）
- `dismissAlert(alertId)` → `void`

**行为规则**：
- `getActiveAlerts()` 返回所有 `dismissed = false` 的 Alert，按 `timestamp` 升序- `dismissAlert(alertId)` 将匹配 `id` 的 Alert 的 `dismissed` 设为 `true`
- `alertId` 不存在时静默忽略，不抛出异常
- 已关闭的预警仍保留在 `alerts` 数组中（用于去重判定），直到被裁剪

**验收场景**：

```
WHEN getActiveAlerts()
AND alerts 中有 3 条 dismissed=false，2 条 dismissed=true
THEN 返回那 3 条未关闭预警

WHEN dismissAlert('alert_123456_abc')
AND 该 alertId 存在于 alerts
THEN 对应 Alert 的 dismissed 设为 true
AND 不 emit 任何事件

WHEN dismissAlert('alert_nonexistent')
THEN 静默忽略，_state 不变，不抛异常
```

---

### 能力 9：智能建议（getSuggestions）

**描述**：基于当前经济数据，生成可操作的优化建议。

**接口**：
- `getSuggestions()` → `Suggestion[]`

**Suggestion 结构**：

```json
{
  "type":    "'building_priority' | 'region_switch'",
  "emoji":   "string — 表情图标",
  "message": "string — 人类可读的建议描述"
}
```

**building_priority 建议**：
- 查询 TownManager（可选依赖）获取可升级建筑列表
- 对每栋建筑计算 ROI（升级后增加的每分钟净收入 / 折算后的升级费用）
- 仅推荐 ROI 最优的 1 条建筑（回本时间最短）
- ROI ≤ 0 的建筑不推荐

**region_switch 建议**：
- 查询 AdventureManager（可选依赖）获取当前区域和可用区域
- 若存在净收益更高的区域，推荐切换
- TownManager 或 AdventureManager 不可用时，跳过对应类型的建议

**验收场景**：

```
WHEN getSuggestions()
AND TownManager 可用
AND 建筑 A 升级回本时间 = 10 分钟，建筑 B = 30 分钟
THEN 返回包含建筑 A 的 building_priority 建议（只推荐最优 1 条）

WHEN getSuggestions()
AND TownManager 不可用（未注入）
THEN 返回数组中不包含 building_priority 类型建议
AND 不抛出异常

WHEN getSuggestions()
AND AdventureManager 不可用
THEN 返回数组中不包含 region_switch 类型建议
```

---

### 能力 10：小时聚合（_aggregateHourly）

**描述**：在整点（小时边界）自动聚合当前小时的所有事件，写入 `hourlyAggregates`。

**接口**：
- `_aggregateHourly()` → `void`（内部方法，由 `onTick` 检测小时变更后调用）

**行为规则**：
- 聚合范围：过去整小时内（`hour - 1` 对应时间段）的所有 events
- 按资源类型分别汇总 income 和 expense
- 写入后 `hourlyAggregates.length > 168` 时裁剪最旧一条
- 完成后 emit `economy:hourly_update`，载荷为 `{ data: HourlyAggregate }`（新聚合对象）

**验收场景**：

```
WHEN 当前小时从 hour=5 变为 hour=6
THEN _aggregateHourly() 被调用
AND 写入 hour=5 的聚合数据（统计 hour=5 时段的所有 events）
AND emit economy:hourly_update(aggregate)

WHEN hourlyAggregates.length = 168
AND 新聚合写入
THEN hourlyAggregates[0] 被移除
AND hourlyAggregates.length 保持 168
```

---

### 能力 11：Tick 驱动（onTick）

**描述**：响应游戏 tick，执行定时检查逻辑。

**接口**：
- `onTick(tick)` → `void`

**行为规则**：
- 每 60 tick 调用一次 `checkAlerts()`（即 `tick % 60 === 0`）
- 检测当前小时（`Math.floor(Date.now() / 3600000)`）是否与上次不同，变化时调用 `_aggregateHourly()`

**验收场景**：

```
WHEN onTick(60)
THEN checkAlerts() 被调用

WHEN onTick(59)
THEN checkAlerts() 不被调用

WHEN onTick(N) 且当前小时 > 上次记录的小时
THEN _aggregateHourly() 被调用
AND 上次记录小时更新为当前小时
```

---

### 能力 12：初始化与存档（init / getState）

**描述**：从存档恢复状态，或导出当前状态供持久化。

**接口**：
- `init(saved)` → `void`
- `getState()` → `object`

**行为规则**：
- `init(undefined)`（新游戏）：使用默认状态，所有数组为空，`lifetimeStats` 各字段为 0
- `init(saved)` 从 `saved.economy` 键恢复状态
- 缺失字段使用默认值补齐（向后兼容）
- `getState()` 返回深拷贝（`Utils.deepClone(this._state)`），可直接序列化为 JSON

**验收场景**：

```
WHEN init(undefined)
THEN _state.events = []
AND _state.hourlyAggregates = []
AND _state.alerts = []
AND _state.lifetimeStats.totalIncome = { gold:0, jade:0, exp:0, food:0, wood:0, stone:0, iron:0 }
AND _state.lifetimeStats.totalExpense = { gold:0, jade:0, exp:0, food:0, wood:0, stone:0, iron:0 }

WHEN init({ economy: { events: [...], lifetimeStats: {...}, alerts: [...], ... } })
THEN _state 从 saved.economy 恢复

WHEN getState()
THEN 返回 _state 的深拷贝
AND JSON.stringify(getState()) 不抛出异常
AND 修改返回对象不影响 _state
```

---

## 事件契约

### 生产的事件

| 事件名 | 触发时机 | 载荷 |
|--------|----------|------|
| `economy:event_logged` | 每次 `logEvent()` 成功记录后 | `{ event: EconomyEvent }` |
| `economy:alert` | 预警条件满足且通过去重检查后 | `{ alert: Alert }` |
| `economy:hourly_update` | 每次 `_aggregateHourly()` 完成后 | `{ data: HourlyAggregate }` |

### 消费的事件

| 事件名 | 来源 | 说明 |
|--------|------|------|
| `game:tick` | GameLoop | 驱动 `onTick(dt)`，执行预警检查和小时聚合 |

> **注**：EconomyManager 自身不监听 `resource:changed`。资源变动事件由各 Manager 在操作资源后主动调用 `EconomyManager.logEvent()` 记录。

---

## 依赖关系

| 依赖项 | 方向 | 用途 | 是否必须 |
|--------|------|------|----------|
| ResourceManager | EconomyManager → ResourceManager | 读取资源当前余额（`get(type)`）和上限（`getCap(type)`）用于预警计算 | **必须** |
| TownManager | EconomyManager → TownManager | 读取可升级建筑列表和升级费用，计算 building_priority 建议 | 可选 |
| AdventureManager | EconomyManager → AdventureManager | 读取可用区域和收益，计算 region_switch 建议 | 可选 |
| EventBus | EconomyManager → EventBus | 发射 `economy:event_logged`、`economy:alert`、`economy:hourly_update`；监听 `game:tick` | **必须** |
| Utils | EconomyManager → Utils | `deepClone()` 用于 `getState()` 和 `getLifetimeStats()` | **必须** |

**初始化顺序**：EconomyManager 在 ResourceManager 之后初始化，见 [核心契约初始化顺序](../system/core-contracts.md#manager-初始化顺序)。

**可选依赖处理原则**：若 TownManager 或 AdventureManager 未注入（值为 `null` 或 `undefined`），相关功能静默跳过，不抛出异常。

---

## 模块不变量

1. **只观测，不修改**：EconomyManager 不调用任何 Manager 的写接口（`spend`、`add`、`addHero` 等）。
2. **事件缓冲有界**：`events.length` 永远 ≤ 1000；`hourlyAggregates.length` 永远 ≤ 168；`alerts.length` 永远 ≤ 50。
3. **终身统计单调递增**：`lifetimeStats.totalIncome` 和 `totalExpense` 的各字段值只增不减，不允许重置。
4. **速率计算实时**：`getNetIncome()` 每次调用实时从 `events` 扫描，不缓存速率值。
5. **预警去重有效期**：同类型+同资源的预警在 10 分钟内最多触发一次（即使上条预警已 dismissed，去重仍生效）。
6. **getState 可序列化**：`getState()` 返回值必须能通过 `JSON.stringify()` 无异常序列化。

---

## 数据所有权

| 实体 | 本服务拥有 | 共享给 | 方式 |
|------|-----------|--------|------|
| 事件缓冲 | `events` | UI / EconomyPanel | `getEvents()`、`getRecentEvents()` |
| 小时聚合 | `hourlyAggregates` | UI / 图表 | `getHourlyData()` |
| 终身统计 | `lifetimeStats` | UI | `getLifetimeStats()` |
| 预警列表 | `alerts` | UI / EconomyPanel | `getActiveAlerts()` |

---

## 导航

- 系统契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 资源服务：[specs/services/resource-manager.md](resource-manager.md)（余额查询接口）
- 实现文件：`js/modules/economy-manager.js`
- UI 面板：`js/ui/economy-panel.js`
