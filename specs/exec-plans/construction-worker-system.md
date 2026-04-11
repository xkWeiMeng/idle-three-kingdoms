# 执行计划：建造工人系统（Construction Worker System）

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联产品规范** | [specs/product-specs/construction-worker-system.md](../product-specs/construction-worker-system.md) |
| **关联服务规范** | TownManager（待重构）、ResourceManager |
| **系统契约** | [specs/system/core-contracts.md](../system/core-contracts.md) |
| **创建** | 2026-04-06 |

---

## 概览

将产品规范的 8 个能力（CAP-WORKER-01 ~ 08）拆解为 6 个阶段、16 个任务。

- **Phase 1**：基础设施（常量、ResourceManager.addMultiple、状态扩展 + 存档兼容）
- **Phase 2**：核心逻辑（工人解锁、入队、自动派工、取消、排序）
- **Phase 3**：兼容适配（getMaxBuildSlots 替换、startUpgrade 防冲突、UI 调用迁移）
- **Phase 4**：离线队列推进
- **Phase 5**：UI 浮窗（build-queue-widget）
- **Phase 6**：集成验证

---

## 依赖关系图

```
T1.1（WORKER_CONFIG 常量）
  │
  ├──▶ T1.2（ResourceManager.addMultiple）── 无前置依赖，可与 T1.1 并行
  │
  └──▶ T1.3（TownManager 状态扩展 + 存档兼容）── 依赖 T1.1
          │
          ├──▶ T2.1（CAP-WORKER-01：工人解锁 _checkWorkerUnlock）
          │       │
          │       ├──▶ T2.2（CAP-WORKER-02：_canEnqueue + enqueueUpgrade）── 依赖 T1.2, T2.1
          │       │       │
          │       │       ├──▶ T2.3（CAP-WORKER-03：_processQueue 自动派工）── 依赖 T1.2, T2.2
          │       │       │       │
          │       │       │       ├──▶ T2.4（CAP-WORKER-04：cancelQueueItem + cancelActiveBuilding）── 依赖 T1.2, T2.3
          │       │       │       │
          │       │       │       └──▶ T2.5（CAP-WORKER-05：reorderQueue）── 依赖 T2.2
          │       │       │
          │       │       └──▶ T3.3（UI 调用迁移 startUpgrade → enqueueUpgrade）── 依赖 T2.2
          │       │
          │       └──▶ T3.1（CAP-WORKER-06：getMaxBuildSlots 替换）── 依赖 T2.1
          │
          └──▶ T3.2（CAP-WORKER-08：startUpgrade 防冲突）── 依赖 T1.3
                  │
                  └──▶ T4.1（CAP-WORKER-07：离线队列推进）── 依赖 T2.1, T2.3
                          │
                          └──▶ T5.1（build-queue-widget.js 新建）── 依赖 T2.2, T2.3, T2.4, T2.5
                                  │
                                  ├──▶ T5.2（index.html + CSS + main.js 集成）── 依赖 T5.1
                                  │
                                  └──▶ T6.1（最终验证清单）── 依赖全部任务
```

**并行机会**：
- T1.1 与 T1.2 互不依赖，可并行
- T2.4 与 T2.5 互不依赖，可并行（均依赖 T2.3 或 T2.2）
- T3.1 与 T3.2 互不依赖，可并行
- T3.3 可在 T2.2 完成后与 Phase 2 后续任务并行

---

## Phase 1：基础设施

### 任务 T1.1 — 新增 WORKER_CONFIG 常量

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-01 §4.4 |
| **输入** | `js/data/buildings.js` |
| **输出** | 同文件末尾新增 `WORKER_CONFIG` 全局变量 |
| **约束** | 全局 `var`，不用 ES Modules；值必须与规范 §4.4 完全一致 |

**具体改动**：

在 `js/data/buildings.js` 文件末尾新增：

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

**验证**：
- [ ] `WORKER_CONFIG.MAX_WORKERS === 5`
- [ ] `WORKER_CONFIG.MAX_QUEUE_SIZE === 6`
- [ ] `WORKER_CONFIG.WORKER_UNLOCKS.length === 5`
- [ ] 浏览器控制台可直接访问 `WORKER_CONFIG`

---

### 任务 T1.2 — ResourceManager.addMultiple() 新增

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-04 §4.1；CAP-WORKER-03 二次验证退还 |
| **输入** | `js/modules/resource-manager.js` |
| **输出** | 同文件新增 `addMultiple()` 方法（紧跟 `spendMultiple` 之后） |
| **约束** | 与 `spendMultiple` 结构对称；仅处理 > 0 的资源类型 |

**具体改动**：

在 `spendMultiple()` 方法之后新增：

```javascript
addMultiple: function (amounts, category, source, detail) {
  for (var type in amounts) {
    if (amounts.hasOwnProperty(type) && amounts[type] > 0) {
      this.add(type, amounts[type], category, source, detail);
    }
  }
}
```

**验证**：
- [ ] `ResourceManager.addMultiple({ gold: 100, wood: 50 })` → gold +100, wood +50
- [ ] 包含 `amount <= 0` 的类型被跳过
- [ ] 空对象 `{}` 不报错
- [ ] EconomyManager.logEvent 被正确触发（通过 `add()` 内部调用）

---

### 任务 T1.3 — TownManager 状态扩展 + 存档兼容

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-01 §4.2、§4.5 |
| **依赖** | T1.1 |
| **输入** | `js/modules/town-manager.js`（`_state` 定义、`init()`、`getState()`） |
| **输出** | 同文件修改 |
| **约束** | 旧存档无 workers/firstBuildingCompleted/buildQueue 字段时自动推算/初始化 |

**具体改动**：

1. **`_state` 扩展**：在 `_state` 对象中新增 3 个字段：
   ```javascript
   workers: 1,
   firstBuildingCompleted: false,
   buildQueue: []
   ```

2. **`init()` 修改**：加载存档后增加以下逻辑：
   - 若 `data.workers` 存在 → `this._state.workers = data.workers`
   - 若 `data.workers` 不存在 → 调用 `_migrateWorkerCount()` 推算
   - `this._state.firstBuildingCompleted = data.firstBuildingCompleted || false`
   - 若 `data.firstBuildingCompleted` 不存在 → 检查「任意非城主府建筑 level >= 1」
   - `this._state.buildQueue = data.buildQueue || []`

3. **新增内部方法 `_migrateWorkerCount()`**：
   ```
   workers = 1
   if (任意非城主府建筑 level >= 1) → workers = 2, firstBuildingCompleted = true
   if (town_hall.level >= 3) → workers = max(workers, 3)
   if (town_hall.level >= 5) → workers = max(workers, 4)
   if (town_hall.level >= 7) → workers = max(workers, 5)
   workers = min(workers, WORKER_CONFIG.MAX_WORKERS)
   ```

4. **`getState()` 确认**：现有 `getState()` 返回 `Utils.deepClone(this._state)`，新增的 workers/firstBuildingCompleted/buildQueue 会自动包含，无需额外修改。确认 `buildQueue[].cost` 等字段均为可 JSON 序列化值。

**验证（CAP-WORKER-01 存档兼容场景）**：
- [ ] 新存档：`_state.workers === 1`，`_state.firstBuildingCompleted === false`，`_state.buildQueue === []`
- [ ] 旧存档无 workers 字段，town_hall.level=6，有已完成建筑 → `workers === 4`
- [ ] 旧存档无 workers 字段，town_hall.level=10 → `workers === 5`（不超过 MAX_WORKERS）
- [ ] 旧存档无 firstBuildingCompleted，有建筑 level >= 1 → `firstBuildingCompleted === true`
- [ ] 旧存档有 workers=3 → 直接使用 3，不触发推算
- [ ] `getState()` 返回值包含 `workers`、`firstBuildingCompleted`、`buildQueue`

---

## Phase 2：核心逻辑

### 任务 T2.1 — 工人解锁 _checkWorkerUnlock（CAP-WORKER-01）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-01 全部验收场景 |
| **依赖** | T1.3 |
| **输入** | `js/modules/town-manager.js` |
| **输出** | 同文件新增 `_checkWorkerUnlock()` 方法；修改 `onTick()` 施工完成处调用 |
| **约束** | 工人数只增不减；不重复发放已解锁的工人 |

**具体改动**：

1. **新增 `_checkWorkerUnlock(buildingId, newLevel)`**：
   - 如果 `buildingId !== 'town_hall'` 且 `!this._state.firstBuildingCompleted` → `workers = Math.max(workers, 2)`，`firstBuildingCompleted = true`
   - 如果 `buildingId === 'town_hall'`：遍历 `WORKER_CONFIG.WORKER_UNLOCKS` 中 `trigger === 'town_hall_level'` 的项，若 `newLevel >= requirement` → `workers = Math.max(workers, workerCount)`
   - 最终 `workers = Math.min(workers, WORKER_CONFIG.MAX_WORKERS)`
   - 如果 `workers` 变化 → emit `town:worker_unlocked { count: workers }` + toast

2. **修改 `onTick()` 施工完成分支**：在 `b.level++` 和 emit `town:building_upgraded` 之后，调用 `this._checkWorkerUnlock(id, b.level)`

**验证**：
- [ ] 完成第一个非城主府建筑 → `workers === 2`，emit `town:worker_unlocked { count: 2 }`
- [ ] 完成第二个非城主府建筑 → `workers` 不变（`firstBuildingCompleted` 已为 true）
- [ ] 城主府升到 Lv.3，且 `workers === 2` → `workers === 3`
- [ ] 城主府升到 Lv.7，且 `workers === 4` → `workers === 5`
- [ ] `workers` 永远不超过 5

---

### 任务 T2.2 — 入队逻辑 _canEnqueue + enqueueUpgrade（CAP-WORKER-02）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-02 全部验收场景 |
| **依赖** | T1.2, T1.3, T2.1 |
| **输入** | `js/modules/town-manager.js` |
| **输出** | 同文件新增 `_canEnqueue()` 和 `enqueueUpgrade()` 方法 |
| **约束** | `_canEnqueue` 复用 `canUpgrade` 的子集逻辑（跳过施工队列满检查和资源检查）；入队时预扣资源 |

**具体改动**：

1. **新增 `_canEnqueue(buildingId)`** → `{ ok, reason? }`：
   - 检查 BuildingData 存在
   - 检查 `!isBuilding(buildingId)`（正在施工中 → reason: '正在施工中'）
   - 检查建筑未在 `buildQueue` 中（遍历 `this._state.buildQueue`，匹配 `buildingId`）→ reason: '该建筑已在队列中'
   - 检查 `currentLevel < data.maxLevel`
   - 检查城主府等级上限
   - 检查城主府通关条件（仅升级城主府时）
   - 检查 `data.requires` 前置依赖
   - 检查新建筑的建筑槽（`currentLevel === 0` 时）
   - **不检查**施工队列满（getActiveBuildCount >= getMaxBuildSlots）
   - **不检查**资源

2. **新增 `enqueueUpgrade(buildingId)`** → `{ ok, reason?, queueItem? }`：
   - 检查队列容量：`buildQueue.length >= WORKER_CONFIG.MAX_QUEUE_SIZE` → `{ ok: false, reason: '建造队列已满（最多6项）' }`
   - 调用 `_canEnqueue(buildingId)` → 不通过则返回
   - 计算 `cost = getUpgradeCost(buildingId)`，`buildTime = getBuildTime(buildingId)`
   - 检查资源 `ResourceManager.canAffordMultiple(cost)` → `{ ok: false, reason: '资源不足' }`
   - 预扣资源 `ResourceManager.spendMultiple(cost, 'building', 'queue_reserve', buildingId)`
   - 构造 `QueueItem { id: Utils.uid(), buildingId, targetLevel: currentLevel+1, cost, buildTime, addedAt: Date.now() }`
   - 过滤 cost 中 <= 0 的项（仅保留 > 0 的资源类型）
   - 推入 `this._state.buildQueue`
   - emit `town:queue_updated`
   - 调用 `this._processQueue()`
   - 返回 `{ ok: true, queueItem }`

**验证**：
- [ ] 正常入队：资源充足、队列未满、建筑可升级 → `{ ok: true, queueItem }` + 资源被预扣
- [ ] 队列已满（6项）→ `{ ok: false, reason: '建造队列已满（最多6项）' }`
- [ ] 建筑已在队列中 → `{ ok: false, reason: '该建筑已在队列中' }`
- [ ] 建筑正在施工 → `{ ok: false, reason: '正在施工中' }`
- [ ] 资源不足 → `{ ok: false, reason: '资源不足' }`，buildQueue 不变
- [ ] 城主府通关检查未通过 → 返回对应 reason
- [ ] 入队后有空闲工人 → 立即触发 `_processQueue()`，任务从队列移入施工

---

### 任务 T2.3 — 自动派工 _processQueue（CAP-WORKER-03）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-03 全部验收场景 |
| **依赖** | T1.2, T2.2 |
| **输入** | `js/modules/town-manager.js` |
| **输出** | 同文件新增 `_processQueue()` 方法；修改 `onTick()` 施工完成后调用 |
| **约束** | 二次验证不重新检查资源；失效任务退还资源并通知 |

**具体改动**：

1. **新增 `_processQueue()`**：
   - 计算 `freeWorkers = this._state.workers - this.getActiveBuildCount()`
   - 用 while 循环：`freeWorkers > 0 && buildQueue.length > 0`
     - 取 `buildQueue[0]`
     - 二次验证 5 项检查：
       1. `buildings[buildingId].level === targetLevel - 1`（等级未被外部改变）
       2. `!isBuilding(buildingId)`（未在施工中）
       3. 城主府等级上限检查
       4. `data.requires` 前置依赖
       5. 新建筑的建筑槽检查（`currentLevel === 0` 时）
     - 验证失败 → `ResourceManager.addMultiple(item.cost, 'building', 'queue_refund', item.buildingId)` + 移除 + toast warning '建造任务已失效：{建筑名}'，continue
     - 验证通过 → `buildings[buildingId].buildEndTime = Date.now() + item.buildTime * 1000`，从 buildQueue 移除，emit `town:building_started`，`freeWorkers--`
   - 如果有项被处理 → emit `town:queue_updated`

2. **修改 `onTick()` 施工完成分支**：在 `_checkWorkerUnlock` 之后调用 `this._processQueue()`

**验证**：
- [ ] 3 工人、1 在忙、队列 2 项 → 2 项均开始施工，buildQueue 清空
- [ ] 2 工人、2 在忙、队列 3 项 → buildQueue 不变
- [ ] 队列头部等级不匹配 → 该项移除 + 资源退还 + toast warning，继续下一项
- [ ] 施工完成后 → `_processQueue()` 被调用，队列下一项自动开始

---

### 任务 T2.4 — 取消机制 cancelQueueItem + cancelActiveBuilding（CAP-WORKER-04）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-04 全部验收场景 |
| **依赖** | T1.2, T2.3 |
| **输入** | `js/modules/town-manager.js` |
| **输出** | 同文件新增 `cancelQueueItem()` 和 `cancelActiveBuilding()` 方法 |
| **约束** | 队列取消退还资源；施工取消不退还资源、不改变等级 |

**具体改动**：

1. **新增 `cancelQueueItem(queueItemId)`** → `{ ok, refunded, reason? }`：
   - 在 buildQueue 中查找 `id === queueItemId`
   - 未找到 → `{ ok: false, reason: '任务不存在' }`
   - 退还资源：`ResourceManager.addMultiple(item.cost, 'building', 'queue_refund', item.buildingId)`
   - 从 buildQueue 移除
   - emit `town:queue_updated`
   - 返回 `{ ok: true, refunded: true }`

2. **新增 `cancelActiveBuilding(buildingId)`** → `{ ok, reason? }`：
   - 检查 `buildings[buildingId].buildEndTime` 存在且 `Date.now() < buildEndTime`
   - 不满足 → `{ ok: false, reason: '该建筑未在施工' }`
   - `buildEndTime = null`
   - **不退还**资源，**等级不变**
   - emit `town:building_cancelled { buildingId }`
   - 调用 `_processQueue()`（释放工人）
   - 返回 `{ ok: true, refunded: false }`

**验证**：
- [ ] 取消队列等待任务 → 资源退还 + 从队列移除 + emit `town:queue_updated`
- [ ] 取消正在施工的任务 → `buildEndTime = null` + 等级不变 + 不退资源 + emit `town:building_cancelled`
- [ ] 取消施工后有队列 → `_processQueue()` 被调用，下一项开始施工
- [ ] 取消不存在的 queueItemId → `{ ok: false, reason: '任务不存在' }`
- [ ] 取消未在施工的建筑 → `{ ok: false, reason: '该建筑未在施工' }`

---

### 任务 T2.5 — 队列排序 reorderQueue（CAP-WORKER-05）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-05 全部验收场景 |
| **依赖** | T2.2（需 buildQueue 已实现） |
| **输入** | `js/modules/town-manager.js` |
| **输出** | 同文件新增 `reorderQueue()` 方法 |
| **约束** | newIndex 越界时钳制到合法范围 |

**具体改动**：

新增 `reorderQueue(queueItemId, newIndex)` → `boolean`：
- 查找 `buildQueue` 中 `id === queueItemId` 的项和其索引
- 未找到 → 返回 `false`
- 钳制 `newIndex = Math.max(0, Math.min(buildQueue.length - 1, newIndex))`
- 如果原索引 === newIndex → 仍 emit 事件，返回 `true`
- splice 移除 → splice 插入 newIndex
- emit `town:queue_updated`
- 返回 `true`

**验证**：
- [ ] `[A, B, C, D]`，C 移到 index=0 → `[C, A, B, D]`
- [ ] 不存在的 queueItemId → `false`，buildQueue 不变
- [ ] newIndex=-1 → 钳制为 0，移至队首
- [ ] newIndex=100 → 钳制为 `length-1`，移至队尾

---

## Phase 3：兼容适配

### 任务 T3.1 — getMaxBuildSlots 替换（CAP-WORKER-06）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-06 全部验收场景 |
| **依赖** | T2.1（workers 字段已存在） |
| **输入** | `js/modules/town-manager.js` |
| **输出** | 同文件修改 `getMaxBuildSlots()` 方法体 |
| **约束** | 所有依赖 getMaxBuildSlots() 的调用方行为不变 |

**具体改动**：

将 `getMaxBuildSlots()` 方法体从：
```javascript
return this.getBuildingLevel('town_hall') >= 5 ? 2 : 1;
```
改为：
```javascript
return this._state.workers;
```

**验证**：
- [ ] `workers === 3` → `getMaxBuildSlots() === 3`
- [ ] `workers === 1`（新玩家）→ `getMaxBuildSlots() === 1`
- [ ] `canUpgrade()` 中"施工队列已满"检查仍使用 `getActiveBuildCount() >= getMaxBuildSlots()`，语义为"所有工人都在忙"

---

### 任务 T3.2 — startUpgrade 防冲突（CAP-WORKER-08 部分）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-08 验收场景 |
| **依赖** | T1.3（buildQueue 字段已存在） |
| **输入** | `js/modules/town-manager.js`（`startUpgrade()` 方法） |
| **输出** | 同文件修改 `startUpgrade()` 方法 |
| **约束** | 保持原有逻辑完整，仅在 canUpgrade 后新增队列冲突检查 |

**具体改动**：

在 `startUpgrade()` 中 `var check = this.canUpgrade(buildingId)` 之后、扣资源之前，新增：

```javascript
// 队列冲突检查
for (var i = 0; i < this._state.buildQueue.length; i++) {
  if (this._state.buildQueue[i].buildingId === buildingId) {
    return { ok: false, reason: '该建筑已在队列中' };
  }
}
```

**验证**：
- [ ] `startUpgrade('barracks')`，barracks 在 buildQueue 中 → `{ ok: false, reason: '该建筑已在队列中' }`
- [ ] `startUpgrade('barracks')`，barracks 不在 buildQueue 中且 canUpgrade 通过 → 行为不变

---

### 任务 T3.3 — UI 调用方迁移 startUpgrade → enqueueUpgrade（CAP-WORKER-08 部分）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-08 §需迁移的调用方 |
| **依赖** | T2.2（enqueueUpgrade 已实现） |
| **输入** | `js/ui/town-panel.js`、`js/ui/town-world.js`、`js/ui/build-menu.js` |
| **输出** | 3 个文件中 `TownManager.startUpgrade(...)` 替换为 `TownManager.enqueueUpgrade(...)` |
| **约束** | 返回值结构兼容（都有 `{ ok, reason? }`），UI 提示逻辑不变 |

**具体改动**：

1. **`js/ui/town-panel.js` (line 278)**：
   ```
   TownManager.startUpgrade(id) → TownManager.enqueueUpgrade(id)
   ```

2. **`js/ui/town-world.js` (line 982)**：
   ```
   TownManager.startUpgrade(buildingId) → TownManager.enqueueUpgrade(buildingId)
   ```

3. **`js/ui/build-menu.js` (line 76)**：
   ```
   TownManager.startUpgrade(buildingId) → TownManager.enqueueUpgrade(buildingId)
   ```

4. **可选**：升级按钮文案适配（依据规范 §7.2 场景表）：
   - 有空闲工人 → `升级` / `建造`
   - 无空闲工人、队列未满 → `加入队列`
   - 队列已满 → `队列已满`（灰显）
   - 建筑已在队列中 → `排队中`（灰显）

**验证**：
- [ ] town-panel.js 中不再有 `TownManager.startUpgrade` 调用
- [ ] town-world.js 中不再有 `TownManager.startUpgrade` 调用
- [ ] build-menu.js 中不再有 `TownManager.startUpgrade` 调用
- [ ] 点击升级按钮 → 调用 enqueueUpgrade，行为正确
- [ ] 升级失败时 toast 提示仍正常显示

---

## Phase 4：离线队列推进

### 任务 T4.1 — 离线队列推进（CAP-WORKER-07）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-WORKER-07 全部验收场景 |
| **依赖** | T2.1（_checkWorkerUnlock）、T2.3（_processQueue 逻辑理解） |
| **输入** | `js/modules/town-manager.js`（`init()` 方法） |
| **输出** | 同文件修改 `init()` 尾部，新增离线推进逻辑 |
| **约束** | 离线最多追溯 24 小时；离线完成的建筑不触发 toast；与现有离线收益时间限制一致 |

**具体改动**：

在 `init()` 末尾（存档加载完成后），新增离线推进逻辑：

1. 如果存档中有 `timestamp`（由 SaveManager 提供），计算 `offlineDuration = Date.now() - timestamp`
2. 上限钳制：`offlineDuration = Math.min(offlineDuration, 24 * 60 * 60 * 1000)`
3. 获取 `now = Date.now()`
4. **阶段 A — 完成已过期的施工建筑**：
   - 遍历所有 `buildings`，找 `buildEndTime !== null && buildEndTime <= now` 的
   - `level++`，`buildEndTime = null`
   - 调用 `_checkWorkerUnlock(buildingId, newLevel)`（不触发 toast）
5. **阶段 B — 推进队列**：
   - 模拟时间循环：计算空闲工人数，从队列头部取项
   - 项的 `buildEndTime = 上一次完成时间 + buildTime * 1000`
   - 如果 `buildEndTime <= now` → 直接完成（`level++`），`_checkWorkerUnlock`，继续
   - 如果 `buildEndTime > now` → 设置为正在施工状态，停止该工人循环
   - 重复直到无空闲工人或队列为空
   - 注意二次验证：跳过失效项（退还资源）
6. 离线推进期间不触发 toast，但 workers/levels 正常更新

**验证**：
- [ ] 离线 2 小时，1 个建筑在施工（已过期 1 小时），队列 2 项（各 30 分钟）→ 3 个建筑全部完成，队列清空
- [ ] 离线 30 分钟，施工中建筑需 1 小时 → 建筑仍在施工，buildQueue 不变
- [ ] 离线完成的建筑触发 `_checkWorkerUnlock`（工人数可能增加）
- [ ] 离线推进中队列项失效 → 退还资源，跳过该项
- [ ] 离线超过 24 小时 → 最多追溯 24 小时

---

## Phase 5：UI 浮窗

### 任务 T5.1 — BuildQueueWidget 新建

| 字段 | 值 |
|------|-----|
| **规范引用** | 规范 §7.1 全部 UI 规则 |
| **依赖** | T2.2, T2.3, T2.4, T2.5 |
| **输入** | 产品规范 §7.1（折叠态/展开态/交互规则） |
| **输出** | 新建 `js/ui/build-queue-widget.js` |
| **约束** | 全局单例对象模式；EventBus 事件驱动更新；z-index 介于主画布和 OverlayPanel 之间 |

**具体改动**：

新建 `js/ui/build-queue-widget.js`，实现 `BuildQueueWidget` 对象：

1. **`init()`**：
   - 获取 DOM 容器元素
   - 绑定 `town:queue_updated`、`town:building_started`、`town:building_cancelled`、`town:worker_unlocked`、`game:tick` 事件
   - 初始渲染折叠态

2. **折叠态渲染 `_renderCollapsed()`**：
   - 显示 `🔨 {activeBuildCount}/{workers}` + 进度条 + 剩余时间
   - 有队列等待时显示 `+{queueLength}`
   - 无活动任务时显示 `空闲`
   - 点击 → 展开

3. **展开态渲染 `_renderExpanded()`**：
   - 施工中区域：列出所有正在施工的建筑（进度条 + 剩余时间 + 取消按钮）
   - 空闲工人提示：`空闲工人：{free}/{total}`
   - 等待队列区域：列出 buildQueue 各项（拖拽手柄 ≡ + 名称 + ✕ 按钮）
   - 队列为空时显示引导 💡

4. **交互绑定**：
   - ✕ 按钮 → `TownManager.cancelQueueItem(id)`（直接取消，无确认）
   - 取消施工按钮 → `Modal.show()` 二次确认 → `TownManager.cancelActiveBuilding(buildingId)`
   - 拖拽排序 → `TownManager.reorderQueue(id, newIndex)`（支持 mouse drag + touch drag）
   - 关闭按钮 → 折叠

5. **`game:tick` 处理**：刷新进度条和剩余时间

**验证**：
- [ ] 折叠态显示正确的工人数和活动任务数
- [ ] 展开态正确列出施工中和等待中的任务
- [ ] ✕ 按钮取消等待任务后 UI 立即更新
- [ ] 取消施工弹出 Modal 确认
- [ ] 拖拽排序后队列顺序更新
- [ ] 进度条和剩余时间每秒刷新

---

### 任务 T5.2 — 集成 index.html + CSS + main.js

| 字段 | 值 |
|------|-----|
| **规范引用** | 规范 §7.1（z-index 层级） |
| **依赖** | T5.1 |
| **输入** | `index.html`、`css/main.css`、`js/main.js` |
| **输出** | 3 个文件修改 |
| **约束** | script 按 core → data → modules → ui → main.js 层级加入；z-index 高于主画布低于 OverlayPanel |

**具体改动**：

1. **`index.html`**：
   - 在 UI 层 script 区域添加：`<script src="js/ui/build-queue-widget.js"></script>`（位于其他 ui 脚本之后、`main.js` 之前）
   - 在 HTML body 中添加浮窗容器 DOM：
     ```html
     <div id="build-queue-widget" class="build-queue-widget build-queue-collapsed"></div>
     ```

2. **`css/main.css`**：
   - 添加 `.build-queue-widget` 样式（固定定位右上角、z-index、折叠/展开状态）
   - 添加 `.build-queue-collapsed` / `.build-queue-expanded` 样式
   - 进度条、任务卡片、拖拽手柄样式
   - 使用 CSS 变量保持一致性

3. **`js/main.js`**：
   - 在 `initGame()` 中添加 `BuildQueueWidget.init()` 调用（UI 层初始化区域）

**验证**：
- [ ] 浏览器加载无报错
- [ ] `BuildQueueWidget` 全局可访问
- [ ] 浮窗出现在右上角
- [ ] z-index 正确（高于画布、低于 OverlayPanel 和 Modal）
- [ ] CSS 变量颜色与主题一致

---

## Phase 6：集成验证

### 任务 T6.1 — 最终验证清单

| 字段 | 值 |
|------|-----|
| **规范引用** | 全部 8 个能力的所有验收场景 |
| **依赖** | 全部任务 |
| **输入** | 完成的代码 |
| **输出** | 验证报告 |

**最终验证清单**：

#### CAP-WORKER-01 工人初始化与解锁
- [ ] 新玩家 `workers === 1`，`firstBuildingCompleted === false`，`getMaxBuildSlots() === 1`
- [ ] 完成第一个非城主府建筑 → `workers === 2` + toast
- [ ] 城主府 Lv.3 → `workers === 3`
- [ ] 城主府 Lv.5 → `workers === 4`
- [ ] 城主府 Lv.7 → `workers === 5`，永不超过 5
- [ ] 旧存档无 workers 字段 → 正确推算

#### CAP-WORKER-02 建造队列入队
- [ ] 正常入队 → 资源预扣 + buildQueue 新增项 + emit `town:queue_updated`
- [ ] 队列满 → `{ ok: false, reason: '建造队列已满（最多6项）' }`
- [ ] 同建筑重复入队 → 被拒绝
- [ ] 入队后有空闲工人 → 立即开始施工

#### CAP-WORKER-03 队列自动派工
- [ ] 空闲工人自动从队首取任务施工
- [ ] 无空闲工人 → 队列不变
- [ ] 失效任务 → 退还资源 + 移除 + toast + 继续下一项
- [ ] 施工完成后自动触发 `_processQueue()`

#### CAP-WORKER-04 取消队列任务
- [ ] 取消等待任务 → 资源退还 + 移除
- [ ] 取消施工任务 → 不退资源 + buildEndTime=null + _processQueue()
- [ ] 取消施工需 Modal 确认（UI 层）

#### CAP-WORKER-05 队列排序
- [ ] 拖拽调整顺序 → 正确 splice + emit
- [ ] 越界 index 被钳制

#### CAP-WORKER-06 getMaxBuildSlots 兼容
- [ ] `getMaxBuildSlots()` 返回 `workers`
- [ ] `canUpgrade()` 行为不变

#### CAP-WORKER-07 离线队列推进
- [ ] 离线后建筑完成 + 队列自动推进
- [ ] 离线上限 24 小时
- [ ] 离线不触发 toast

#### CAP-WORKER-08 startUpgrade 兼容
- [ ] startUpgrade 被队列冲突检查拦截
- [ ] UI 3 个文件已迁移到 enqueueUpgrade
- [ ] startUpgrade 保留为兼容接口

#### 整体回归
- [ ] 旧存档加载无报错
- [ ] 新存档正常游戏
- [ ] 资源预扣 + 退还数值准确（不会多扣或少退）
- [ ] EventBus 事件正确触发，UI 响应更新
- [ ] `getState()` 返回的状态可 JSON 序列化
- [ ] 浏览器控制台无错误
