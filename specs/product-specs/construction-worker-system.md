# 产品规范：建造工人系统（Construction Worker System）

| 属性 | 值 |
|------|-----|
| **状态** | Active |
| **作者** | spec-architect |
| **创建日期** | 2026-04-06 |
| **关联系统规范** | [核心契约](../system/core-contracts.md) |
| **关联服务** | TownManager（待重构）、ResourceManager |
| **关联数据** | BuildingData、`BuildingData._townHallUnlocks` |

---

## 1. 概述

引入"建造工人"概念，替代现有的简单施工队列上限 (`getMaxBuildSlots`)。工人数量通过游戏进度逐步解锁（最多 5 名），并新增建造队列机制，允许玩家预排最多 6 项施工任务以实现自动化建造流。

**当前痛点**：现有 `getMaxBuildSlots()` 仅返回 1 或 2，缺乏渐进解锁感；玩家必须手动逐个启动建造，无法离线排队。

---

## 2. 参与者

| 参与者 | 描述 |
|--------|------|
| 玩家 | 操作建造、管理队列、查看进度 |
| TownManager | 持有工人状态、队列状态、施工逻辑 |
| ResourceManager | 资源检查与扣除/退还 |
| BuildingData | 建筑费用、施工时间、前置条件 |
| EventBus | 跨模块通信（事件驱动） |
| UI（建造队列浮窗） | 右上角折叠/展开的建造状态面板 |

---

## 3. 范围

### 范围内

- 工人数量的解锁规则与持久化
- 建造队列的入队、出队、取消、排序
- 资源预扣与退还机制
- 队列 UI 浮窗（折叠/展开、进度条、拖拽排序、删除）
- 存档兼容（旧存档迁移）
- 离线队列推进
- `ResourceManager.addMultiple()` 新增

### 范围外

- 工人外观/动画（与 TownCharacters 的集成留给设计文档）
- 建造加速（已有 `speedUpBuild()` 保持不变）
- 建筑槽位解锁（由 `_townHallUnlocks.slots` 控制，本规范不修改）
- 新建筑类型的添加

---

## 4. 数据模型变更

### 4.1 前置变更：ResourceManager.addMultiple()

ResourceManager 缺少 `addMultiple()` 方法，需新增：

```javascript
addMultiple: function (amounts, category, source, detail) {
  for (var type in amounts) {
    if (amounts.hasOwnProperty(type) && amounts[type] > 0) {
      this.add(type, amounts[type], category, source, detail);
    }
  }
}
```

此方法为 `spendMultiple()` 的逆操作，用于批量退还资源。

### 4.2 持久化状态扩展（TownManager._state）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `workers` | `number` | `1` | 当前已解锁的工人数量 |
| `firstBuildingCompleted` | `boolean` | `false` | 是否已完成过第一个建筑（用于奖励第 2 名工人） |
| `buildQueue` | `Array<QueueItem>` | `[]` | 待执行的建造队列（不含正在施工的任务） |

**持久化确认**：`getState()` 返回完整 `_state`（含 workers/firstBuildingCompleted/buildQueue），均为可 JSON 序列化值。`QueueItem.cost` 是纯对象 `{ [resourceType]: number }`，仅包含 > 0 的资源类型。

### 4.3 QueueItem 结构

```javascript
{
  id: string,          // Utils.uid() 生成的队列项 ID
  buildingId: string,  // 目标建筑 ID（如 'barracks'）
  targetLevel: number, // 目标等级（当前等级 + 1）
  cost: object,        // 预扣的资源 { [resourceType]: number }，仅含 > 0 的项
  buildTime: number,   // 预计施工秒数
  addedAt: number      // 入队时间戳（Date.now()）
}
```

### 4.4 新增常量（放入 `js/data/buildings.js`）

```javascript
var WORKER_CONFIG = {
  MAX_WORKERS: 5,
  MAX_QUEUE_SIZE: 6,
  WORKER_UNLOCKS: [
    { trigger: 'initial',           requirement: null,  workerCount: 1 },
    { trigger: 'first_building',    requirement: null,  workerCount: 2 },
    { trigger: 'town_hall_level',   requirement: 3,     workerCount: 3 },
    { trigger: 'town_hall_level',   requirement: 5,     workerCount: 4 },
    { trigger: 'town_hall_level',   requirement: 7,     workerCount: 5 }
  ]
};
```

### 4.5 存档兼容

| 迁移场景 | 行为 |
|----------|------|
| 旧存档无 `workers` 字段 | 根据当前城主府等级和建筑历史**推算**应有工人数 |
| 旧存档无 `firstBuildingCompleted` | 若任意建筑 `level >= 1`（城主府除外），视为 `true` |
| 旧存档无 `buildQueue` | 初始化为 `[]` |
| 旧存档有正在施工的建筑 | 保持不变，正在施工的建筑按旧逻辑继续完成 |

**推算逻辑**：
```
workers = 1
if (任意非城主府建筑 level >= 1) → workers = 2, firstBuildingCompleted = true
if (town_hall.level >= 3) → workers = max(workers, 3)
if (town_hall.level >= 5) → workers = max(workers, 4)
if (town_hall.level >= 7) → workers = max(workers, 5)
workers = min(workers, MAX_WORKERS)  // 永不超过 5
```

---

## 5. 能力

### CAP-WORKER-01：工人初始化与解锁

**描述**：游戏开始时拥有 1 名工人。完成第一个建筑后奖励第 2 名工人。城主府 Lv.3/5/7 各解锁 1 名，最多 5 名。

**解锁触发点**：

| 序号 | 触发条件 | 工人数 | 触发时机 |
|------|----------|--------|----------|
| 1 | 游戏开始 | 1 | `init()` |
| 2 | 完成第一个建筑 | 2 | `onTick()` 中施工完成检测时（内部调用 `_checkWorkerUnlock`） |
| 3 | 城主府升到 Lv.3 | 3 | 同上，检查 `buildingId === 'town_hall'` |
| 4 | 城主府升到 Lv.5 | 4 | 同上 |
| 5 | 城主府升到 Lv.7 | 5 | 同上 |

**内部方法**：
- `_checkWorkerUnlock(buildingId, newLevel)` — 在施工完成时调用，检查是否应解锁新工人

**行为规则**：
1. 工人数量只增不减，不会因降级或其他原因减少。
2. 解锁时 emit `town:worker_unlocked` 事件 + `toast:show success`。
3. `_state.workers` 始终反映当前已解锁工人数。
4. `getMaxBuildSlots()` 返回值改为 `_state.workers`。

**验收场景**：

```
WHEN 新玩家首次进入游戏
AND 无存档数据
THEN _state.workers === 1
AND _state.firstBuildingCompleted === false
AND getMaxBuildSlots() === 1

WHEN 玩家完成第一个建筑（非城主府）
AND _state.firstBuildingCompleted === false
THEN _state.workers === 2
AND _state.firstBuildingCompleted === true
AND emit town:worker_unlocked { count: 2 }
AND emit toast:show { type: 'success', message: '🎉 完成第一个建筑！获得额外工人！' }

WHEN 城主府升级到 Lv.3
AND _state.workers === 2
THEN _state.workers === 3
AND emit town:worker_unlocked { count: 3 }

WHEN 城主府已经是 Lv.5 且 workers 已经是 4
AND 城主府升到 Lv.7
THEN _state.workers === 5（跳过不会重复解锁已有的工人）

WHEN 玩家完成第一个建筑
AND _state.firstBuildingCompleted === true（已经解锁过）
THEN _state.workers 不变（不重复奖励）

WHEN 老玩家加载存档
AND 存档中无 workers 字段
AND town_hall.level === 6，且有已完成建筑
THEN 推算 workers = 4（初始1 + 首建筑1 + Lv.3解锁1 + Lv.5解锁1）
AND _state.firstBuildingCompleted === true

WHEN 老玩家加载存档
AND town_hall.level === 10（远超7）
AND workers 字段不存在
THEN 推算 workers = 5（不超过 MAX_WORKERS）
```

---

### CAP-WORKER-02：建造队列入队

**描述**：玩家可将建筑升级任务加入建造队列。入队时检查并预扣资源，队列最多 6 项。

**新增接口**：
- `enqueueUpgrade(buildingId)` → `{ ok: boolean, reason?: string, queueItem?: QueueItem }`

**内部方法**：
- `_canEnqueue(buildingId)` → `{ ok: boolean, reason?: string }` — 入队前置检查，复用 `canUpgrade` 的子集逻辑

**`_canEnqueue` 检查列表**（从 `canUpgrade` 提取，跳过 2 项）：

| # | 检查项 | 来源 | `canUpgrade` 中的对应检查 |
|---|--------|------|--------------------------|
| 1 | `BuildingData[buildingId]` 存在 | 数据验证 | ✅ 相同 |
| 2 | `!isBuilding(buildingId)` | 施工状态 | ✅ 相同 |
| 3 | 建筑未在 buildQueue 中 | **新增** | N/A |
| 4 | `currentLevel < data.maxLevel` | 等级上限 | ✅ 相同 |
| 5 | 城主府等级上限检查 | 等级上限 | ✅ 相同 |
| 6 | 城主府通关条件（仅升级城主府时） | 前置条件 | ✅ 相同 |
| 7 | `data.requires` 前置依赖 | 前置条件 | ✅ 相同 |
| 8 | 新建筑的建筑槽检查 | 建筑槽 | ✅ 相同 |
| ~~9~~ | ~~`getActiveBuildCount() >= getMaxBuildSlots()`~~ | **跳过** | 入队不立即施工，不检查 |
| ~~10~~ | ~~`ResourceManager.canAffordMultiple(cost)`~~ | **跳过** | 资源检查在 `enqueueUpgrade` 中单独做 |

**`enqueueUpgrade` 行为规则**：
1. 检查队列容量：`buildQueue.length >= MAX_QUEUE_SIZE` → 返回 `{ ok: false, reason: '建造队列已满（最多6项）' }`。
2. 调用 `_canEnqueue(buildingId)` → 不通过则直接返回。
3. 计算费用 `cost = getUpgradeCost(buildingId)` 和施工时间 `buildTime = getBuildTime(buildingId)`。
4. 检查资源：`ResourceManager.canAffordMultiple(cost)` → 不足则返回 `{ ok: false, reason: '资源不足' }`。
5. 预扣资源：`ResourceManager.spendMultiple(cost, 'building', 'queue_reserve', buildingId)`。
6. 生成 QueueItem 并推入 `buildQueue`。
7. emit `town:queue_updated`。
8. 调用 `_processQueue()` 尝试启动空闲工人。
9. 返回 `{ ok: true, queueItem }`。

**验收场景**：

```
WHEN 玩家将伐木场入队
AND 队列未满（< 6）
AND 伐木场未在队列中，未在施工
AND 伐木场当前 Lv.2，未达城主府等级上限
AND 资源充足
THEN 资源被预扣（spendMultiple 调用）
AND buildQueue 新增一项 { buildingId: 'lumber_camp', targetLevel: 3, ... }
AND emit town:queue_updated
AND 返回 { ok: true, queueItem: {...} }

WHEN 玩家将建筑入队
AND buildQueue.length === 6
THEN 返回 { ok: false, reason: '建造队列已满（最多6项）' }
AND 资源不变

WHEN 玩家将伐木场入队
AND 伐木场已在 buildQueue 中
THEN 返回 { ok: false, reason: '该建筑已在队列中' }

WHEN 玩家将伐木场入队
AND 伐木场正在施工中
THEN 返回 { ok: false, reason: '正在施工中' }

WHEN 玩家将建筑入队
AND 资源不足
THEN 返回 { ok: false, reason: '资源不足' }
AND buildQueue 不变

WHEN 玩家将城主府入队
AND 城主府需要通关 stage_2_5
AND 玩家未通关
THEN 返回 { ok: false, reason: '需通关 2-5' }

WHEN 玩家将建筑入队
AND 当前有空闲工人（activeBuildCount < workers）
THEN 入队后立即触发 _processQueue()
AND 该任务从队列移出进入施工
```

---

### CAP-WORKER-03：队列自动派工

**描述**：当有空闲工人时，自动从队列头部取出任务开始施工。

**新增内部方法**：
- `_processQueue()` — 遍历队列，为每个空闲工人分配任务

**行为规则**：
1. 计算空闲工人数：`freeWorkers = _state.workers - getActiveBuildCount()`。
2. 当 `freeWorkers > 0` 且 `buildQueue.length > 0`：
   a. 取出 `buildQueue[0]`（队首）。
   b. 二次验证（具体检查列表见下方）。若不可施工 → 退还预扣资源（`ResourceManager.addMultiple(cost, 'building', 'queue_refund', buildingId)`），移除该项，emit `toast:show warning`，继续处理下一项。
   c. 设置 `buildings[buildingId].buildEndTime = Date.now() + item.buildTime * 1000`。
   d. 从 `buildQueue` 中移除该项。
   e. emit `town:building_started { buildingId, endTime }`。
   f. `freeWorkers--`，继续循环。
3. 如果有项被移除（执行或失效），emit `town:queue_updated`。

**二次验证检查列表**：

| # | 检查 | 失败原因 |
|---|------|----------|
| 1 | `buildings[buildingId].level === targetLevel - 1` | 等级已被外部改变（如通过 `startUpgrade` 直接升级） |
| 2 | `!isBuilding(buildingId)` | 建筑已在施工中（防御性检查） |
| 3 | 城主府等级上限检查 | 等级上限条件已不满足 |
| 4 | `data.requires` 前置依赖 | 前置条件不再满足 |
| 5 | 新建筑的建筑槽检查（`currentLevel === 0` 时） | 建筑槽被占满 |

注意：**不重新检查资源**（入队时已预扣）。

**触发时机**：
- `enqueueUpgrade()` 成功入队后
- `onTick()` 中建筑施工完成后
- `cancelActiveBuilding()` 释放工人后

**验收场景**：

```
WHEN _processQueue() 被调用
AND workers === 3, activeBuildCount === 1
AND buildQueue 有 2 项 [A, B]
THEN A 开始施工（buildEndTime 被设置）
AND B 开始施工（buildEndTime 被设置）
AND buildQueue 变为 []
AND emit town:building_started 两次
AND emit town:queue_updated

WHEN _processQueue() 被调用
AND workers === 2, activeBuildCount === 2（无空闲工人）
AND buildQueue 有 3 项
THEN buildQueue 不变
AND 无 building_started 事件

WHEN _processQueue() 被调用
AND 队列头部的建筑 level 已不等于 targetLevel - 1（被外部 startUpgrade 升级）
THEN 该项被移除
AND 预扣资源退还（ResourceManager.addMultiple）
AND emit toast:show { type: 'warning', message: '建造任务已失效：{建筑名}' }
AND 继续处理下一项

WHEN 建筑施工完成（onTick 检测到）
AND buildQueue 不为空
AND 有空闲工人
THEN 自动调用 _processQueue()
AND 队列下一项开始施工
```

---

### CAP-WORKER-04：取消队列任务

**描述**：玩家可取消队列中等待的任务（退还资源）或取消正在施工的任务（不退还资源）。

**新增接口**：
- `cancelQueueItem(queueItemId)` → `{ ok: boolean, refunded: boolean, reason?: string }`
- `cancelActiveBuilding(buildingId)` → `{ ok: boolean, reason?: string }`

**行为规则 — 取消队列中等待的任务**：
1. 在 `buildQueue` 中查找 `id === queueItemId` 的项。
2. 未找到 → 返回 `{ ok: false, reason: '任务不存在' }`。
3. 退还预扣资源：`ResourceManager.addMultiple(queueItem.cost, 'building', 'queue_refund', queueItem.buildingId)`。
4. 从 `buildQueue` 中移除该项。
5. emit `town:queue_updated`。
6. 返回 `{ ok: true, refunded: true }`。

**行为规则 — 取消正在施工的任务**：
1. 检查 `buildings[buildingId].buildEndTime` 是否存在且 `Date.now() < buildEndTime`。
2. 不满足 → 返回 `{ ok: false, reason: '该建筑未在施工' }`。
3. 将 `buildEndTime` 设为 `null`。
4. **不退还资源。建筑等级不变（level 不回退也不前进，保持取消前的值）。**
5. emit `town:building_cancelled { buildingId }`。
6. 调用 `_processQueue()` 检查是否可启动队列中下一项。
7. 返回 `{ ok: true, refunded: false }`。

**验收场景**：

```
WHEN 玩家取消队列中等待的任务
AND queueItemId 存在于 buildQueue
AND 该任务预扣了 { gold: 500, wood: 100 }
THEN ResourceManager.addMultiple({ gold: 500, wood: 100 }) 被调用
AND 该项从 buildQueue 移除
AND emit town:queue_updated
AND 返回 { ok: true, refunded: true }

WHEN 玩家取消正在施工的任务
AND buildings[buildingId].buildEndTime !== null
THEN buildEndTime 设为 null
AND 建筑 level 不变
AND 资源不退还
AND emit town:building_cancelled { buildingId }
AND _processQueue() 被调用

WHEN 玩家取消正在施工的唯一任务
AND buildQueue 有等待任务
THEN buildEndTime = null
AND _processQueue 被调用
AND 队列首项开始施工（工人被释放）

WHEN 玩家取消不存在的队列任务
THEN 返回 { ok: false, reason: '任务不存在' }

WHEN 玩家取消未在施工的建筑
THEN 返回 { ok: false, reason: '该建筑未在施工' }
```

---

### CAP-WORKER-05：队列排序（拖拽调整优先级）

**描述**：玩家可通过拖拽调整队列中等待任务的顺序。

**新增接口**：
- `reorderQueue(queueItemId, newIndex)` → `boolean`

**行为规则**：
1. 在 `buildQueue` 中查找 `id === queueItemId` 的项。
2. 未找到 → 返回 `false`。
3. `newIndex` 超出范围 → 钳制到 `[0, buildQueue.length - 1]`。
4. 将该项从原位置移除，插入到 `newIndex`。
5. emit `town:queue_updated`。
6. 返回 `true`。

**验收场景**：

```
WHEN 玩家将队列第 3 项拖到第 1 位
AND buildQueue = [A, B, C, D]
AND queueItemId = C.id, newIndex = 0
THEN buildQueue = [C, A, B, D]
AND emit town:queue_updated

WHEN reorderQueue 传入不存在的 queueItemId
THEN 返回 false
AND buildQueue 不变

WHEN reorderQueue 传入 newIndex = -1
THEN 钳制为 0，项移至队列头部

WHEN reorderQueue 传入 newIndex = 100（超出长度）
THEN 钳制为 buildQueue.length - 1，项移至队列末尾
```

---

### CAP-WORKER-06：getMaxBuildSlots 兼容替换

**描述**：现有 `getMaxBuildSlots()` 返回逻辑替换为返回 `_state.workers`，所有调用方行为不变。

**行为规则**：
1. `getMaxBuildSlots()` → `return this._state.workers`。
2. 所有依赖 `getMaxBuildSlots()` 的检查自动生效。
3. `canUpgrade()` 中"施工队列已满"的检查保持不变（`getActiveBuildCount() >= getMaxBuildSlots()`），语义变为"所有工人都在忙"。

**验收场景**：

```
WHEN workers === 3
THEN getMaxBuildSlots() === 3

WHEN workers === 1（新玩家）
THEN getMaxBuildSlots() === 1
AND canUpgrade 行为与旧逻辑兼容（同一时间只能施工 1 个）
```

---

### CAP-WORKER-07：离线队列推进

**描述**：玩家离线期间，已在施工的建筑会正常完成，队列中的任务也会自动按顺序开始施工。在 `init()` 中追溯计算。

**行为规则**：
1. 在 `init()` 加载存档后，如果存档有 `timestamp`：
   a. 获取当前时间 `now = Date.now()`。
   b. 遍历所有 `buildEndTime`，将已过期的（`buildEndTime <= now`）建筑完成（`level++`、`buildEndTime = null`）。
   c. 对每个离线完成的建筑，调用 `_checkWorkerUnlock(buildingId, newLevel)`。
   d. 以离线完成释放的工人对队列项进行推进：取队首项，设置 `buildEndTime = 离线完成时刻 + buildTime * 1000`，若该时间也 <= now 则继续完成，循环直到无法推进。
   e. 重复直到无空闲工人或队列为空或剩余队列项的 buildEndTime 在未来。
2. 离线最多追溯 24 小时（与现有离线收益一致）。
3. 离线完成的建筑不触发 toast 但会更新 workers/levels。

**验收场景**：

```
WHEN 玩家离线 2 小时后上线
AND 离线前有 1 个建筑在施工（buildEndTime 已过期 1 小时）
AND buildQueue 有 2 项（各需 30 分钟）
THEN 施工中的建筑完成（level++）
AND 队列第 1 项完成（level++）
AND 队列第 2 项完成（level++）
AND buildQueue 为空

WHEN 玩家离线 30 分钟
AND 施工中的建筑需 1 小时
THEN 建筑仍在施工（buildEndTime 未过期）
AND buildQueue 不变
```

---

### CAP-WORKER-08：startUpgrade 兼容

**描述**：现有 `startUpgrade(buildingId)` 保留原始行为（直接扣资源、直接施工），不经过队列。新增防冲突检查。

**行为规则**：
1. `startUpgrade()` 保持原有逻辑：调用 `canUpgrade()` → 扣资源 → 设 `buildEndTime`。
2. **新增检查**：如果建筑已在 `buildQueue` 中 → 返回 `{ ok: false, reason: '该建筑已在队列中' }`。
3. 所有 UI 调用方迁移到 `enqueueUpgrade()`，`startUpgrade` 仅保留为兼容接口。

**需迁移的调用方**：
- `js/ui/town-panel.js` — `TownManager.startUpgrade(id)` → `TownManager.enqueueUpgrade(id)`
- `js/ui/town-world.js` — `TownManager.startUpgrade(buildingId)` → `TownManager.enqueueUpgrade(buildingId)`
- `js/ui/build-menu.js` — `TownManager.startUpgrade(buildingId)` → `TownManager.enqueueUpgrade(buildingId)`

**验收场景**：

```
WHEN 外部调用 startUpgrade('barracks')
AND barracks 已在 buildQueue 中
THEN 返回 { ok: false, reason: '该建筑已在队列中' }
AND 资源不变
AND barracks 不进入施工

WHEN 外部调用 startUpgrade('barracks')
AND barracks 不在 buildQueue 中
AND canUpgrade 通过
THEN 行为与原来完全一致（扣资源、设 buildEndTime）
```

---

## 6. 事件定义

### 6.1 新增事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `town:worker_unlocked` | `{ count: number }` | 工人解锁，`count` 为解锁后的总工人数 |
| `town:queue_updated` | — | 队列变更（入队/出队/排序/取消），UI 监听后主动从 TownManager 拉取状态 |
| `town:building_cancelled` | `{ buildingId: string }` | 取消正在施工的建筑 |

### 6.2 已有事件复用

| 事件 | 复用场景 |
|------|----------|
| `town:building_upgraded` | 施工完成后触发 → 检查工人解锁 + 触发 `_processQueue()` |
| `town:building_started` | 队列任务开始施工时触发 |
| `toast:show` | 工人解锁、队列操作、失效任务等通知 |

---

## 7. UI 规范

### 7.1 建造队列浮窗

**位置**：游戏界面右上角，悬浮在主内容之上。

**层级**：`z-index` 高于主画布，低于 OverlayPanel 和 Modal。

**新增文件**：`js/ui/build-queue-widget.js`

#### 7.1.1 折叠态（默认）

```
┌────────────────────────┐
│ 🔨 2/3  ████████░░ 45s │
└────────────────────────┘
```

| 元素 | 说明 |
|------|------|
| 🔨 | 工人/锤子图标 |
| `2/3` | 活动任务数 / 总工人数 |
| 进度条 | 最近启动的施工任务的进度 |
| `45s` | 最近任务的剩余时间 |

- 无活动任务时显示：`🔨 0/3 空闲`
- 队列中有等待任务时，在工人数后显示 `+N`（如 `2/3 +4`）
- 点击折叠态 → 展开

#### 7.1.2 展开态

```
┌─────────────────────────────┐
│ 建造队列            🔽 关闭 │
├─────────────────────────────┤
│ ⚡ 施工中                    │
│ ┌─────────────────────────┐ │
│ │ 🪓 伐木场 Lv.3→4        │ │
│ │ ████████░░░ 1:23         │ │
│ │                   [取消] │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ⛏ 采石场 Lv.1→2         │ │
│ │ ██░░░░░░░░░ 3:45         │ │
│ │                   [取消] │ │
│ └─────────────────────────┘ │
│ 空闲工人：1/3               │
├─────────────────────────────┤
│ 📋 等待队列                  │
│ ┌─────────────────────────┐ │
│ │ ≡ ⚒ 铁矿场 Lv.2→3  [✕] │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ≡ 🏯 城主府 Lv.2→3  [✕] │ │
│ └─────────────────────────┘ │
│ 💡 在建筑面板中点击建造      │
│    可添加到队列              │
└─────────────────────────────┘
```

| 区域 | 说明 |
|------|------|
| 施工中 | 显示所有正在施工的建筑（带进度条和剩余时间） |
| 取消按钮 | 取消正在施工的任务（不退还资源，需二次确认 Modal） |
| 空闲工人 | 显示空闲工人/总工人数 |
| 等待队列 | 显示 `buildQueue` 中的任务 |
| `≡` 图标 | 拖拽手柄，可拖拽调整顺序（支持 mouse drag + touch drag） |
| `✕` 按钮 | 取消等待任务（退还资源，无需二次确认） |
| 💡 提示 | 当队列为空时显示的引导文案 |

#### 7.1.3 交互规则

| 操作 | 行为 |
|------|------|
| 点击折叠态 | 展开面板 |
| 点击 🔽 或关闭 | 折叠面板 |
| 点击等待任务的 ✕ | 调用 `cancelQueueItem(id)`，直接取消并退还资源 |
| 点击施工中任务的取消 | 弹出 Modal 确认："取消施工将不退还已消耗的资源，确定取消吗？"→ 确认后调用 `cancelActiveBuilding(buildingId)` |
| 拖拽等待任务的 ≡ | 调用 `reorderQueue(id, newIndex)` |
| 队列为空且无施工 | 折叠态显示"空闲"，展开态显示引导提示 |

### 7.2 建筑面板集成

现有建筑面板的"升级"按钮行为变更（需修改 3 个文件）：

**需修改的文件**：
- `js/ui/town-panel.js` — 升级按钮改为调用 `enqueueUpgrade()`
- `js/ui/town-world.js` — 建筑详情中的升级按钮改为调用 `enqueueUpgrade()`
- `js/ui/build-menu.js` — 建造菜单中的按钮改为调用 `enqueueUpgrade()`

| 场景 | 按钮文案 | 点击行为 |
|------|----------|----------|
| 有空闲工人 | `升级` / `建造` | 调用 `enqueueUpgrade()` → 立即开始施工 |
| 无空闲工人，队列未满 | `加入队列` | 调用 `enqueueUpgrade()` → 入队等待 |
| 队列已满 | `队列已满`（灰显） | 不可点击 |
| 建筑已在队列中 | `排队中`（灰显） | 不可点击 |
| 建筑正在施工中 | `施工中`（灰显） | 不可点击 |

### 7.3 工人解锁通知

解锁新工人时：
- `toast:show { type: 'success', message: '获得新工人！当前工人数：{count}' }`
- 如果是首次建筑完成奖励：`toast:show { type: 'success', message: '🎉 完成第一个建筑！获得额外工人！' }`

---

## 8. 非功能需求

| 需求 | 目标值 | 说明 |
|------|--------|------|
| 队列操作延迟 | < 16ms | 所有队列操作在单帧内完成 |
| 存档大小增量 | < 1KB | QueueItem 数组最多 6 项，序列化后极小 |
| 旧存档兼容 | 100% | 无 workers 字段时自动推算，无报错 |
| UI 更新频率 | 1Hz | 进度条和剩余时间跟随 `game:tick` 更新 |

---

## 9. 依赖

| 依赖项 | 类型 | 说明 |
|--------|------|------|
| TownManager | 运行时 | 主要修改目标，持有工人与队列状态 |
| ResourceManager | 运行时 | `canAffordMultiple()` / `spendMultiple()` / `addMultiple()`（新增） |
| BuildingData | 数据 | `costFormula()` / `_getBuildTime()` / `_townHallUnlocks` / `WORKER_CONFIG` |
| EventBus | 运行时 | 事件通信 |
| Utils | 运行时 | `uid()` / `deepClone()` |
| SaveManager | 运行时 | 持久化 `getState()` 返回的队列和工人数据 |
| Modal | 运行时 | 取消施工中任务的二次确认 |
