---
status: Active
created: 2026-04-05
updated: 2026-04-05
author: AI (spec-architect)
system-spec: specs/system/core-contracts.md
---

# 服务规范：AdventureManager

## 概述

管理冒险玩法的全流程：区域选择与解锁、冒险模式切换（推图/挂机）、挂机会话的逐 Tick 战斗模拟、会话历史归档，以及离线结算奖励计算。

AdventureManager 是全局单例，不执行战斗逻辑本身——它驱动战斗节奏并委托给 BattleManager（清关列表）、ResourceManager（资源增减）、TownManager（加成系数）、EquipmentManager（装备掉落）处理各自职责。

---

## 持久化状态结构

```json
{
  "currentRegion": "string — 当前选中区域 ID，默认 'region_1'",
  "adventureMode": "'push' | 'idle' — 当前冒险模式，默认 'push'",
  "idleSession": "IdleSession | null — 进行中的挂机会话，null 表示无会话",
  "sessionHistory": "IdleSessionSummary[] — 最近 10 条已结束会话，按时间正序排列",
  "unlockedRegions": "string[] — 已解锁区域 ID 列表，至少含 'region_1'"
}
```

### IdleSession（运行时，不存档 `_tickAccum`）

```json
{
  "sessionId": "string — Utils.uid() 生成的唯一标识",
  "region": "string — 会话开始时绑定的区域 ID，会话期间不随区域切换而改变",
  "startTime": "number — Unix 毫秒时间戳",
  "endTime": "number | undefined — 会话结束时写入，进行中不存在此字段",
  "battles": "number — 本次会话总战斗次数",
  "wins": "number — 胜场数",
  "losses": "number — 败场数",
  "resources": {
    "gold": "number", "exp": "number", "wood": "number",
    "stone": "number", "iron": "number", "food": "number"
  },
  "drops": "[{ quality: string, type: string }] — 本次会话掉落装备列表（完整对象数组）",
  "_tickAccum": "number — 内部 Tick 累积秒数，不持久化，getState() 时删除"
}
```

### IdleSessionSummary（持久化，存入 sessionHistory）

等同于 `IdleSession` 已结束快照：含 `endTime`，不含 `_tickAccum`，`drops` 为完整对象数组。

```json
{
  "sessionId": "string",
  "region": "string",
  "startTime": "number",
  "endTime": "number",
  "battles": "number",
  "wins": "number",
  "losses": "number",
  "resources": { "gold": "number", "exp": "number", "wood": "number", "stone": "number", "iron": "number", "food": "number" },
  "drops": "[{ quality: string, type: string }]"
}
```

**规则**：
- `_tickAccum` 仅存在于运行时内存；`getState()` 和 `endIdleSession()` 返回前必须删除。
- 会话与区域在会话开始时绑定，中途切换区域不影响当前会话的战斗区域。

---

## 能力

### 能力 1：初始化

**描述**：从存档数据恢复状态，或以默认值启动；恢复后立即检查区域解锁条件。

**接口**：
- `init(saved)` → `void`
  - `saved`: 存档对象，`saved.adventure` 为持久化字段；传 `null`/`undefined` 时全部使用默认值。

**行为规则**：
- 字段缺失时使用默认值（见状态结构）。
- `sessionHistory` 和 `unlockedRegions` 使用 `slice()` 浅拷贝，不共享引用。
- 调用 `_checkUnlocks()` 补齐因跨版本存档遗漏的区域解锁。
- **不变量防御**：若恢复后 `adventureMode === 'idle'` 且 `idleSession === null`（游戏崩溃残留状态），将 `adventureMode` 重置为 `'push'`，以维持不变量 3（会话与模式一致）。

**验收场景**：

```
WHEN init(null) 被调用
THEN _state.currentRegion === 'region_1'
AND  _state.adventureMode === 'push'
AND  _state.idleSession === null
AND  _state.sessionHistory.length === 0
AND  _state.unlockedRegions 包含且仅包含 'region_1'

WHEN init({ adventure: { currentRegion: 'region_2', adventureMode: 'idle', idleSession: { sessionId: 'abc', region: 'region_2', startTime: 1000, battles: 5, wins: 3, losses: 2, resources: {}, drops: [] }, unlockedRegions: ['region_1','region_2'] } }) 被调用
THEN _state.currentRegion === 'region_2'
AND  _state.adventureMode === 'idle'
AND  _state.idleSession !== null（已归档的会话被恢复）
AND  _state.unlockedRegions 包含 'region_1' 和 'region_2'
AND  修改返回的 unlockedRegions 数组不影响内部状态（浅拷贝隔离）

WHEN init({ adventure: { adventureMode: 'idle', idleSession: null } }) 被调用（不变量违反场景）
THEN _state.adventureMode === 'push'（不变量防御将 idle 重置为 push）
AND  _state.idleSession === null
```

---

### 能力 2：Tick 驱动

**描述**：每帧由游戏主循环调用，仅在挂机模式且会话存在时推进战斗节奏。

**接口**：
- `onTick(dt)` → `void`
  - `dt`: 本帧经过秒数（正数浮点）

**行为规则**：
- `adventureMode !== 'idle'` 或 `idleSession === null` 时，立即返回，无副作用。
- 委托 `_processIdleTick(dt)` 处理。

**验收场景**：

```
WHEN adventureMode === 'push' 时调用 onTick(1)
THEN 不执行任何战斗，_state 无变化

WHEN adventureMode === 'idle' 且 idleSession 存在，调用 onTick(1)
THEN session._tickAccum 增加 1
AND  若累积未达 5 秒，session.battles 不变

WHEN adventureMode === 'idle' 且 idleSession 存在，_tickAccum 已为 4，调用 onTick(2)
THEN 触发一场战斗（session.battles 增加 1）
AND  _tickAccum 剩余 1（= 4+2-5）
```

---

### 能力 3：选择区域

**描述**：将当前区域切换到指定区域，仅允许已解锁区域。

**接口**：
- `selectRegion(regionId)` → `boolean`
  - 返回 `true` 表示切换成功，`false` 表示区域未解锁。

**行为规则**：
- `regionId` 不在 `unlockedRegions` 中时返回 `false`，不修改状态。
- 切换成功后发送事件 `adventure:region_changed`（见事件契约）。
- `regionId` 与 `currentRegion` 相同时，行为与成功切换相同（仍更新状态并发送事件）。

**验收场景**：

```
WHEN selectRegion('region_1')，且 'region_1' 已在 unlockedRegions 中
THEN _state.currentRegion === 'region_1'
AND  EventBus.emit 被调用，payload 为 { regionId: 'region_1' }
AND  返回 true

WHEN selectRegion('region_99')，且 'region_99' 不在 unlockedRegions 中
THEN _state.currentRegion 不变
AND  EventBus.emit 不被调用
AND  返回 false

WHEN selectRegion('region_1')，当前 currentRegion 已为 'region_1'
THEN _state.currentRegion === 'region_1'（不变，但仍更新）
AND  EventBus.emit('adventure:region_changed', { regionId: 'region_1' }) 被调用
AND  返回 true
```

---

### 能力 4：查询区域信息

**描述**：提供已解锁区域列表、当前区域 ID 及区域静态数据的访问接口。

**接口**：
- `getUnlockedRegions()` → `string[]` — 返回已解锁区域 ID 数组的**浅拷贝**
- `getCurrentRegion()` → `string` — 返回当前区域 ID
- `getRegionData(regionId)` → `RegionData | null` — 从全局 `RegionData` 数组中线性查找；未找到返回 `null`

**行为规则**：
- `getUnlockedRegions()` 返回 `slice()` 拷贝，外部修改不影响内部状态。
- `getRegionData()` 返回原始引用（只读使用，调用方不得修改）。

**验收场景**：

```
WHEN getUnlockedRegions() 被调用
THEN 返回数组长度与内部 unlockedRegions 相同
AND  修改返回数组不影响内部 _state.unlockedRegions

WHEN getRegionData('region_999') 被调用，且 RegionData 中不存在该 ID
THEN 返回 null
```

---

### 能力 5：切换冒险模式

**描述**：在推图模式（`push`）和挂机模式（`idle`）之间切换，自动管理会话生命周期。

**接口**：
- `setMode(mode)` → `void`
  - `mode`: `'push' | 'idle'`；其他值静默忽略
- `getMode()` → `'push' | 'idle'`

**行为规则**：
- 传入非 `'push'`/`'idle'` 的值：立即返回，不修改状态，不发送事件。
- `push → idle`：调用 `startIdleSession()` 创建新会话。
- `idle → push`：调用 `endIdleSession()` 结束并归档会话。
- 同模式重复调用（`idle → idle`、`push → push`）：不重新创建/结束会话，但仍发送 `adventure:mode_changed` 事件。
- 模式写入后发送事件 `adventure:mode_changed`（见事件契约）。

**验收场景**：

```
WHEN setMode('idle')，当前为 'push'
THEN _state.adventureMode === 'idle'
AND  _state.idleSession 不为 null，且包含合法 sessionId 和 startTime
AND  EventBus.emit('adventure:mode_changed', { mode: 'idle' }) 被调用

WHEN setMode('push')，当前为 'idle' 且 idleSession 存在
THEN _state.adventureMode === 'push'
AND  _state.idleSession === null
AND  sessionHistory 末尾追加了该会话的归档副本
AND  EventBus.emit('adventure:mode_changed', { mode: 'push' }) 被调用

WHEN setMode('idle')，当前已为 'idle' 且 idleSession 存在
THEN idleSession 不被重建（sessionId 不变）
AND  EventBus.emit('adventure:mode_changed', { mode: 'idle' }) 被调用

WHEN setMode('push')，当前已为 'push' 且 idleSession 为 null
THEN idleSession 仍为 null
AND  EventBus.emit('adventure:mode_changed', { mode: 'push' }) 被调用

WHEN setMode('invalid')
THEN _state 完全不变
AND  EventBus.emit 不被调用
```

---

### 能力 6：挂机会话管理

**描述**：创建和结束挂机会话，维护会话历史（最多保留 10 条）。

**接口**：
- `startIdleSession()` → `void` — 创建新 IdleSession 并赋值到 `_state.idleSession`
- `getIdleSession()` → `IdleSession | null` — 返回当前会话的**直接引用**
- `endIdleSession()` → `IdleSession | null` — 结束会话，返回已结束的会话对象；无会话时返回 `null`

**行为规则**：

`startIdleSession()`：
- 若 `idleSession` 已存在，**先调用 `endIdleSession()` 归档当前会话**，再创建新会话（防止数据丢失）。
- 新会话绑定 `_state.currentRegion`（快照，不跟随后续区域切换）。
- `sessionId` 由 `Utils.uid()` 生成，保证唯一性。
- 所有资源计数器初始化为 0，`drops` 为空数组，`_tickAccum` 为 0。

`endIdleSession()`：
- 写入 `endTime = Date.now()`。
- 删除 `_tickAccum` 后，通过 `Utils.deepClone()` 深拷贝压入 `sessionHistory`。
- `sessionHistory` 超过 10 条时，移除最旧一条（`shift()`）。
- 将 `_state.idleSession` 置为 `null`。
- 返回的对象是会话本身（不是深拷贝），已含 `endTime`，无 `_tickAccum`。

**验收场景**：

```
WHEN startIdleSession() 被调用，currentRegion 为 'region_2'
THEN idleSession.region === 'region_2'
AND  idleSession.battles === 0
AND  idleSession.wins === 0
AND  idleSession.losses === 0
AND  idleSession.resources 各字段均为 0
AND  idleSession.drops 为空数组

WHEN startIdleSession() 被调用，idleSession 已存在（sessionId = 'old-id'）
THEN sessionHistory 新增旧会话的深拷贝（含 endTime，不含 _tickAccum）
AND  新 idleSession.sessionId !== 'old-id'
AND  新 idleSession.region 绑定当前 currentRegion
AND  新 idleSession.battles === 0

WHEN endIdleSession() 被调用，idleSession 存在
THEN 返回对象含 endTime，不含 _tickAccum
AND  sessionHistory 新增该会话的深拷贝
AND  _state.idleSession === null

WHEN endIdleSession() 被调用，idleSession 为 null
THEN 返回 null
AND  sessionHistory 不变

WHEN sessionHistory 已有 10 条，endIdleSession() 再次被调用
THEN sessionHistory.length 仍为 10
AND  最旧一条被移除，最新一条为本次会话
```

---

### 能力 7：挂机战斗 Tick 处理

**描述**：内部方法，每 5 秒触发一场挂机战斗；每 10 场战斗（整除）发送会话更新事件。

**接口**（内部，不对外暴露）：
- `_processIdleTick(dt)` — 累积 dt，每满 5 秒调用 `_processIdleBattle()`
- `_processIdleBattle(session)` — 模拟单场战斗，结算资源与装备掉落

**行为规则**：

`_processIdleTick(dt)`：
- `_tickAccum += dt`；用 `while (_tickAccum >= 5)` 循环，每次减去 5 并触发一场战斗。
- **在 `_processIdleBattle()` 返回后**（`session.battles++` 已完成）检查 `session.battles > 0 && session.battles % 10 === 0`，满足则发送 `adventure:session_update`。

`_processIdleBattle(session)`：
- 从 `BattleManager.getClearedStages()` 中找当前 `region.chapter` 下最高关卡（见 `_getBestIdleStage`）；无可用关卡则跳过。
- 若 `stage.foodCost > 0`：检查 `ResourceManager.canAfford('food', foodCost)`；不足则**跳过本场战斗**（不计入 `battles`，不消耗粮草）。
- 粮草足够时：调用 `ResourceManager.spend('food', foodCost, 'battle', 'food_cost', stageId)`，然后 `session.battles++`。
- 胜率固定 `95%`（`Math.random() < 0.95`）：
  - **胜**：`session.wins++`；按 `floor(stage.rewards[res] × region.resourceMultipliers[res])` 结算 gold/wood/stone/iron；exp 额外乘以 `expBonus = 1 + TownManager.getExpBonus()`（`expBonus` 只对 `exp` 资源生效，其余资源不乘）；调用 `ResourceManager.add()` 并累计到 `session.resources`；按装备掉落概率投掷，公式为 `stage.rewards.equipDropRate × (1 + dropRateBonus) × region.equipDropMultiplier`（乘法加成，最终值为掉落概率）。
  - **负**：`session.losses++`，不结算任何资源。
- `expBonus = 1 + TownManager.getExpBonus()`（TownManager 不存在时为 `1`，即 exp 无加成）。
- `dropRateBonus = TownManager.getDropRateBonus()`（TownManager 不存在时为 `0`）。

`_getBestIdleStage(chapter)`：
- 从 `BattleManager.getClearedStages()` 获取所有已通关关卡 ID 数组。
- 过滤出以 `'stage_' + chapter + '_'` 开头的 ID。
- 使用**字符串字典序**（JS 默认比较）选取最大值——注意：此算法在关卡编号 ≥ 10 时可能排序不正确（例如 `stage_1_9 > stage_1_10`），为已知限制，不修复。
- 无匹配时返回 `null`。

**验收场景**：

```
WHEN _processIdleTick(4.9) 被调用，_tickAccum 初始为 0
THEN session.battles === 0（未满 5 秒）
AND  _tickAccum ≈ 4.9

WHEN _processIdleTick(0.2) 被调用，_tickAccum 已为 4.9
THEN session.battles === 1（满 5 秒触发一场）
AND  _tickAccum ≈ 0.1

WHEN _processIdleTick(50) 被调用，_tickAccum 初始为 0，foodCost=0
THEN session.battles === 10
AND  EventBus.emit('adventure:session_update', ...) 被调用一次

WHEN stage.foodCost > 0 且 ResourceManager.canAfford('food', foodCost) 返回 false
THEN 该场战斗被跳过：session.battles 不增加，ResourceManager.spend 不被调用

WHEN 一场战斗胜利，stage.rewards.gold=100, region.resourceMultipliers.gold=1.5
THEN session.resources.gold 增加 150
AND  session.wins 增加 1
AND  ResourceManager.add('gold', 150, 'battle', 'stage_reward', stageId) 被调用

WHEN 一场战斗失败
THEN session.losses 增加 1
AND  session.wins 不变
AND  ResourceManager.add 不被调用
```

---

### 能力 8：区域解锁检查

**描述**：遍历 `RegionData`，将满足解锁条件的区域追加到 `unlockedRegions`。

**接口**（内部）：
- `_checkUnlocks()` → `void`

**行为规则**：
- 已在 `unlockedRegions` 中的区域跳过。
- `BattleManager` 不存在时立即返回，不做任何操作。
- 解锁条件：`!r.unlockCondition`（无条件解锁）或 `BattleManager.isStageCleared(r.unlockCondition)` 返回 `true`。
- 满足条件的区域 ID 追加（`push`）到 `_state.unlockedRegions`。

**验收场景**：

```
WHEN _checkUnlocks() 被调用，BattleManager 未定义
THEN unlockedRegions 不变，不抛出异常

WHEN region_2 的 unlockCondition 为 'stage_1_20'，BattleManager.isStageCleared('stage_1_20') 返回 true
THEN _state.unlockedRegions 包含 'region_2'

WHEN region_2 的 unlockCondition 为 'stage_1_20'，BattleManager.isStageCleared('stage_1_20') 返回 false
THEN _state.unlockedRegions 不包含 'region_2'
```

---

### 能力 9：推荐区域

**描述**：基于当前资源缺口分析，从已解锁区域中推荐资源收益最高的区域。

**接口**：
- `getRecommendedRegion()` → `string` — 返回推荐区域 ID

**算法**：
1. 只有一个已解锁区域时直接返回该区域（或 `'region_1'`）。
2. 调用 `_analyzeResourceNeeds()` 获取各资源需求权重（值域 `[0, 1]`）。
3. 对每个已解锁区域计算得分：`score = Σ needs[res] × region.resourceMultipliers[res]`。
4. 返回得分最高的区域 ID；无法计算时回退到 `'region_1'`。

**`_analyzeResourceNeeds()` 规则**：
- 基础权重：`{ gold: 0.5, wood: 0.3, stone: 0.3, iron: 0.3, exp: 0.2 }`。
- TownManager 不存在时直接返回基础权重。
- TownManager 存在时：遍历 `BuildingData`，找到 `canUpgrade()` 返回 `ok` 或 `reason === '资源不足'` 的最低金币升级需求；对该建筑的每种资源调用 `ResourceManager.get(type)` 获取当前持有量，按 `max(0, (need - have) / need)` 计算缺口比率，覆盖基础权重。
- 跳过 `BuildingData` 中 key 以 `_` 开头的条目。

**验收场景**：

```
WHEN 只有 'region_1' 已解锁
THEN 返回 'region_1'

WHEN region_1 的 gold 乘数为 1.0，region_2 的 gold 乘数为 2.0，
     且 gold 需求权重最高
THEN 返回 'region_2'

WHEN TownManager 不存在
THEN 使用基础权重计算，不抛出异常
```

---

### 能力 10：离线结算计算

**描述**：计算玩家离线期间的应得奖励（不自动发放，仅返回计算结果）。

**接口**：
- `calculateOfflineRewards(lastSaveTime)` → `OfflineRewards | null`
  - `lastSaveTime`: Unix 毫秒时间戳

**行为规则**：
- 离线秒数 `offlineSec = min((Date.now() - lastSaveTime) / 1000, 86400)`，**最长 24 小时**。
- `offlineSec < 60` 时返回 `null`（不满 1 分钟不结算）。
- 战斗场数 `battles = floor(offlineSec / 5)`（每 5 秒一场）。
- 效率系数 `efficiency`：优先取 `TownManager.getOfflineEfficiency()`；TownManager 不存在时默认 `0.50`。
- 使用 `_state.currentRegion` 对应的区域数据；区域数据不存在时返回 `null`。
- 挂机关卡：`_getBestIdleStage(region.chapter)`；找不到时回退 `_getBestIdleStage(1)` 或 `'stage_1_1'`。
- **不调用 ResourceManager**，不修改任何状态——仅返回计算结果。
- **离线结算不应用 `expBonus`**（TownManager 经验加成）和装备掉落，仅使用基础公式。设计意图是离线效率系数（`efficiency`）已代表综合折扣，不叠加在线加成。
- **离线结算假设所有战斗均为胜利**，胜率折扣由 `efficiency` 系数整体代表，不单独计算 95% 胜率。

**返回结构**：

```json
{
  "gold": "number", "exp": "number", "wood": "number",
  "stone": "number", "iron": "number",
  "battles": "number — 模拟战斗场数",
  "offlineSec": "number — 实际离线秒数（已 min 处理）",
  "efficiency": "number — 效率系数",
  "region": "string — 区域显示名称"
}
```

**验收场景**：

```
WHEN lastSaveTime = 30 秒前（offlineSec = 30）
THEN 返回 null（不足 60 秒）

WHEN lastSaveTime = 100 秒前，stage.rewards.gold=100，efficiency=0.5，mult.gold=1
THEN battles = floor(100/5) = 20
AND  gold = floor(100 × 20 × 0.5 × 1) = 1000
AND  返回对象含 offlineSec=100, efficiency=0.5

WHEN lastSaveTime = 25 小时前（90000 秒）
THEN offlineSec = 86400（上限 24 小时）
AND  battles = floor(86400/5) = 17280

WHEN TownManager 不存在
THEN efficiency = 0.50
AND  计算正常完成，不抛出异常

WHEN 当前区域数据不存在（getRegionData 返回 null）
THEN 返回 null
```

---

### 能力 11：获取状态快照

**描述**：返回持久化状态的深拷贝，供存档系统序列化。

**接口**：
- `getState()` → `object` — 深拷贝的状态对象

**行为规则**：
- 通过 `Utils.deepClone(_state)` 生成快照。
- 若 `idleSession` 存在，删除快照中的 `idleSession._tickAccum`（不持久化内部累积器）。
- 返回对象可安全序列化（无函数、无循环引用）。

**验收场景**：

```
WHEN getState() 被调用，idleSession 存在且 _tickAccum 为 3.7
THEN 返回对象中 idleSession._tickAccum 不存在
AND  原始 _state.idleSession._tickAccum 仍为 3.7（深拷贝不影响原始状态）

WHEN getState() 被调用，idleSession 为 null
THEN 返回对象中 idleSession === null
```

---

## 事件契约

本服务**生产**以下事件（通过 `EventBus.emit`）：

| 事件名 | 触发时机 | Payload |
|--------|----------|---------|
| `adventure:region_changed` | `selectRegion()` 切换成功 | `{ regionId: string }` |
| `adventure:mode_changed` | `setMode()` 被调用（含同模式重复调用） | `{ mode: 'push' \| 'idle' }` |
| `adventure:session_update` | 挂机战斗每满 10 场 | `{ session: SessionSummary }` |

**SessionSummary 结构**（`adventure:session_update` payload 中的 `session`）：

```json
{
  "sessionId": "string",
  "region": "string",
  "startTime": "number",
  "battles": "number",
  "wins": "number",
  "losses": "number",
  "resources": "{ gold, exp, wood, stone, iron, food }",
  "drops": "number — 掉落装备件数（不是数组）",
  "duration": "number — 会话已持续秒数（整数）"
}
```

本服务**不订阅**任何事件（无 `EventBus.on` 调用）。

---

## 跨服务依赖

| 依赖服务 | 调用方式 | 用途 | 不存在时行为 |
|----------|----------|------|-------------|
| `BattleManager` | `getClearedStages()`, `isStageCleared(id)` | 确定挂机关卡、检查区域解锁条件 | `_checkUnlocks()` 和 `_getBestIdleStage()` 直接返回，跳过相关逻辑 |
| `ResourceManager` | `canAfford(type, amount)`, `spend(...)`, `add(...)`, `get(type)` | 粮草消耗检查、挂机资源结算、资源需求分析 | 无保护——ResourceManager 为必要依赖，缺失将抛出 ReferenceError |
| `TownManager` | `getExpBonus()`, `getDropRateBonus()`, `getOfflineEfficiency()`, `canUpgrade(id)`, `getUpgradeCost(id)` | 挂机加成、离线效率、推荐区域需求分析 | 所有调用有 `typeof TownManager !== 'undefined'` 保护；缺失时使用默认值（exp倍率=1，掉落加成=0，效率=0.50，基础资源权重） |
| `EquipmentManager` | `generateDrop(chapter, qualityWeights)` | 挂机装备掉落生成 | 有 `typeof` 保护；缺失时跳过装备掉落逻辑 |

**静态数据依赖**：

| 数据 | 使用位置 | 说明 |
|------|----------|------|
| `RegionData` | `getRegionData()`, `_checkUnlocks()`, `getRecommendedRegion()` | 全局数组，元素含 `id`、`chapter`、`resourceMultipliers`、`equipDropMultiplier`、`unlockCondition`、`name` |
| `StageData` | `_processIdleBattle()`, `calculateOfflineRewards()` | 全局数组，元素含 `id`、`chapter`、`foodCost`、`rewards` |
| `BuildingData` | `_analyzeResourceNeeds()` | 全局对象，key 为建筑 ID |

---

## 不变量

1. **unlockedRegions 非空**：初始化后始终至少含 `'region_1'`，`_checkUnlocks()` 只追加不删除。
2. **currentRegion 合法**：`_state.currentRegion` 始终是 `unlockedRegions` 中的某一个 ID（`selectRegion` 强制校验）。
3. **会话与模式一致**：`adventureMode === 'idle'` 时 `idleSession` 不为 `null`；`adventureMode === 'push'` 时 `idleSession === null`（通过 `setMode` 强制维护）。
4. **sessionHistory 上限**：长度永不超过 10，超出时移除最旧条目。
5. **_tickAccum 不持久化**：`getState()` 返回的对象和 `endIdleSession()` 归档的对象中均不含此字段。
6. **离线结算只读**：`calculateOfflineRewards()` 不修改任何状态，不调用 ResourceManager；奖励发放由调用方负责。
7. **挂机战斗原子性**：`_processIdleBattle` 在粮草不足时整场跳过，不产生部分副作用（不先消耗粮草再判断失败）。
8. **状态可序列化**：`getState()` 返回对象满足 `JSON.stringify` 无异常（无函数、无循环引用、无 `undefined` 字段）。
