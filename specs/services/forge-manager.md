---
status: Active
created: 2026-04-14
updated: 2026-04-14
author: AI (spec-architect)
system-spec: specs/system/core-contracts.md
---

# 服务规范：ForgeManager

## 概述

管理武器工坊/铁匠铺的锻造系统。支持两种锻造模式：

- **普通锻造**（品质 2–5）：一次性扣除资源，等待固定时间后获得随机装备
- **神话锻造**（品质 6）：消耗图纸，持续消耗资源直到完成，获得指定神话装备

锻造队列有上限（默认 1），同时只能进行有限数量的锻造任务。

### ✅ 已修复代码 Bug（IMPLEMENT 阶段已修复）

| # | 位置 | 修复内容 |
|---|------|---------|
| BUG-1 | `getState()` | 使用 `job.quality === 6` 替代 `job.isMythic` |
| BUG-2 | `getState()` | 使用正确字段名 `job.blueprintId`/`job.elapsedTime`/`job.totalTime` |
| BUG-3 | `_completeForge()` | 调用 `EquipmentManager.addToInventory(equip)` 替代直接 `_inventory.push` |
| BUG-3+ | `_completeForge()` | 模板缺失时正确 `splice` 移除队列任务 |
| BUG-4 | `forge-panel.js` | 监听 `forge:completed`/`forge:paused`/`forge:progress`（修正事件名） |
| BUG-5 | `startMythicForge()` | job 对象新增 `blueprintId` 字段供 `getState()` 使用 |

### ✅ core-contracts.md 已同步更新

以下条目已完成同步：
1. ✅ **服务表** — 已新增 ForgeManager 行
2. ✅ **初始化顺序** — 已新增 ForgeManager（#13，MerchantManager 之后）
3. ✅ **Tick 注册顺序** — 已新增 ForgeManager.onTick(dt)（#9）
4. ✅ **事件表** — 已新增 `forge:started`, `forge:completed`, `forge:paused`, `forge:progress`
5. ✅ **跨模块写操作白名单** — 已新增 `ForgeManager → ResourceManager.canAfford()/spend()` 和 `ForgeManager → EquipmentManager.addToInventory()`
6. ✅ **存档格式** — 已新增 `"forge": "ForgeManager.getState()"`
7. ✅ **只读查询白名单** — 已新增 `ForgeManager → TownManager.getState()`
8. ⬜ **品质枚举** — 品质 6（神话）需定义：值 6、颜色 #ff2222、标签"神话"（影响多个服务，应单独处理）

## 能力

### 能力 1：普通锻造

**描述**：消耗资源启动普通品质装备的锻造任务。

**接口**：
- `startNormalForge(qualityIndex)` → `boolean`
  - `qualityIndex`: 配方索引（0=绿, 1=蓝, 2=紫, 3=橙），对应 `_normalRecipes` 数组下标

**行为规则**：
- 队列已满（`queue.length >= maxQueue`）时返回 `false`，emit `toast:show({ type:'warning', message:'锻造队列已满！' })`
- `qualityIndex` 超出 `_normalRecipes` 范围时返回 `false`
- 检查建筑等级前置条件：`_getWorkshopLevel()` 和 `_getBlacksmithLevel()` 均需 ≥ 配方要求等级（建筑等级要求为独立映射 `[1, 3, 5, 8]`，按 `qualityIndex` 索引）
- 建筑等级不足时返回 `false`，emit `toast:show({ type:'warning', message:'需要武器工坊和铁匠铺等级 ≥ {reqLv}' })`
- 逐一检查资源是否充足（`ResourceManager.canAfford`），任一不足时返回 `false`，emit `toast:show({ type:'warning', message:'资源不足！' })`
- 检查通过后一次性扣除所有资源（`ResourceManager.spend`）
- 创建锻造任务并加入队列：`{ recipeId:'normal_q{quality}', quality, label, totalTime, elapsedTime:0, completed:false }`
- emit `forge:started({ recipeId, totalTime })` 和 `toast:show({ type:'info', message:'开始锻造 {label}' })`
- 返回 `true`

**普通锻造配方表**：

| qualityIndex | 品质 | 标签 | 时间(秒) | 💰 gold | ⛏️ iron | 🪵 wood | 🪨 stone | 建筑等级要求 |
|---|---|---|---|---|---|---|---|---|
| 0 | 2 (绿) | 绿色装备 | 600 | 500 | 100 | — | — | 1 |
| 1 | 3 (蓝) | 蓝色装备 | 1800 | 2000 | 300 | 150 | — | 3 |
| 2 | 4 (紫) | 紫色装备 | 7200 | 8000 | 800 | 400 | 200 | 5 |
| 3 | 5 (橙) | 橙色装备 | 28800 | 30000 | 2500 | 1200 | 800 | 8 |

**验收场景**：

```
WHEN startNormalForge(0)
AND 队列为空（length=0, maxQueue=1）
AND workshopLv >= 1 AND blacksmithLv >= 1
AND ResourceManager.canAfford('gold', 500) AND canAfford('iron', 100)
THEN ResourceManager.spend('gold', 500) AND spend('iron', 100)
AND queue 新增 { recipeId:'normal_q2', quality:2, totalTime:600, elapsedTime:0, completed:false }
AND emit forge:started({ recipeId:'normal_q2', totalTime:600 })
AND emit toast:show({ type:'info', message:'开始锻造 绿色装备' })
AND 返回 true

WHEN startNormalForge(0)
AND queue.length >= maxQueue
THEN emit toast:show({ type:'warning', message:'锻造队列已满！' })
AND 返回 false，不扣资源

WHEN startNormalForge(1)
AND workshopLv=2, blacksmithLv=2（要求等级 3）
THEN emit toast:show({ type:'warning', message:'需要武器工坊和铁匠铺等级 ≥ 3' })
AND 返回 false

WHEN startNormalForge(0)
AND 资源不足（gold=100, 需要 500）
THEN emit toast:show({ type:'warning', message:'资源不足！' })
AND 返回 false，不扣资源

WHEN startNormalForge(99)
AND qualityIndex 超出 _normalRecipes 范围
THEN 返回 false，无 toast
```

---

### 能力 2：神话锻造

**描述**：消耗图纸启动神话品质装备的锻造任务，锻造期间持续消耗资源。

**接口**：
- `startMythicForge(blueprintId)` → `boolean`
  - `blueprintId`: 图纸 ID，必须在 `_state.blueprints` 中存在

**行为规则**：
- 队列已满时返回 `false`，emit 与能力 1 相同的满队列 toast
- 图纸不在 `_state.blueprints` 中时返回 `false`，emit `toast:show({ type:'warning', message:'没有该锻造图纸！' })`
- `BlueprintData[blueprintId]` 不存在时返回 `false`
- 建筑等级要求：`workshopLv >= 10 AND blacksmithLv >= 10`，不足时返回 `false`，emit `toast:show({ type:'warning', message:'需要武器工坊和铁匠铺等级 ≥ 10' })`
- 检查通过后消耗图纸（从 `_state.blueprints` 中 splice 移除）
- 锻造时间公式：`totalTime = floor(86400 / (1 + 0.1 × (workshopLv - 10)))`
  - workshopLv=10 → 86400 秒（24 小时）
  - workshopLv=20 → 43200 秒（12 小时）
- 创建神话锻造任务加入队列：
  ```json
  {
    "recipeId": "<bpData.equipId>",
    "blueprintId": "<原始图纸 ID>",
    "quality": 6,
    "label": "<bpData.name>",
    "totalTime": "<计算值>",
    "elapsedTime": 0,
    "totalCost": { "gold": 36000, "iron": 7200, "wood": 3600, "stone": 2400 },
    "consumed": { "gold": 0, "iron": 0, "wood": 0, "stone": 0 },
    "paused": false,
    "completed": false
  }
  ```
- emit `forge:started({ recipeId, totalTime })` 和 `toast:show({ type:'info', message:'⚒ 开始锻造神话装备：{displayName}' })`
  - `displayName` = `bpData.name.replace('·图纸', '')`（如图纸名"青龙偃月刀·图纸" → 显示"青龙偃月刀"）
- 返回 `true`

**验收场景**：

```
WHEN startMythicForge('bp_001')
AND blueprints 包含 'bp_001'
AND BlueprintData['bp_001'] 存在
AND workshopLv=10, blacksmithLv=10
AND queue 为空
THEN blueprints 移除 'bp_001'
AND queue 新增神话任务 { quality:6, totalTime:86400, paused:false, consumed:{gold:0,...} }
AND emit forge:started({ recipeId:<equipId>, totalTime:86400 })
AND 返回 true

WHEN startMythicForge('bp_001')
AND blueprints 不包含 'bp_001'
THEN emit toast:show({ type:'warning', message:'没有该锻造图纸！' })
AND 返回 false

WHEN startMythicForge('bp_001')
AND workshopLv=8, blacksmithLv=10
THEN emit toast:show({ type:'warning', message:'需要武器工坊和铁匠铺等级 ≥ 10' })
AND 返回 false

WHEN startMythicForge('bp_invalid')
AND blueprints 包含 'bp_invalid'
AND BlueprintData['bp_invalid'] 为 undefined
THEN 返回 false

WHEN startMythicForge('bp_001')
AND workshopLv=15
THEN totalTime = floor(86400 / (1 + 0.1×5)) = floor(86400/1.5) = 57600
```

---

### 能力 3：锻造推进

**描述**：每 tick 推进队列中所有锻造任务的进度。由 `game:tick` 事件驱动。

**接口**：
- `onTick(dt)` → `void`
  - `dt`: 自上次 tick 以来的秒数

**行为规则**：

**普通锻造**：
- `elapsedTime += dt`
- 当 `elapsedTime >= totalTime` 时，触发锻造完成（见下方完成流程）

**神话锻造**：
- 若 `job.paused === true`：
  - 检查 `_canAffordPerSec(job)`（使用 `Math.ceil(costPerSec)` 检查，阈值略高于 tick 内检查），若资源恢复则设 `job.paused = false` 并继续
  - 若仍不足则 return，不推进
- 检查所有资源类型 `[gold, iron, wood, stone]` 的 `costPerSec × dt` 是否可承受（此处使用 raw float，不 ceil）
- 任一资源不足时：`job.paused = true`，emit `forge:paused({ recipeId, reason:'资源不足' })`，return
- 资源充足时逐一扣除：`ResourceManager.spend(res, ceil(costPerSec[res] × dt))`（扣除使用 ceil，可能略高于检查通过的值）
- 更新已消耗记录：`job.consumed[res] += ceil(costPerSec[res] × dt)`
- `elapsedTime += dt`
- emit `forge:progress({ recipeId, percent: floor(elapsedTime/totalTime×100) })`
- 当 `elapsedTime >= totalTime` 时触发完成

> **精度说明**：暂停恢复检查（`_canAffordPerSec`）使用 `Math.ceil(costPerSec)` 比 tick 内常规检查（`costPerSec × dt`，raw float）阈值略高。这是可接受的设计——恢复需要"至少够 1 秒消耗"的资源余量。

**神话锻造每秒消耗公式**：
```
costPerSec = {
  gold:  36000 / totalTime,
  iron:  7200 / totalTime,
  wood:  3600 / totalTime,
  stone: 2400 / totalTime
}
```

**锻造完成流程**（普通和神话共用）：
1. `job.completed = true`
2. 生成装备实例：
   - **普通锻造**：从 `EquipmentData` 中筛选 `quality === job.quality` 的候选模板，随机选取一个，生成实例（`uid=Utils.uid(), level=0, equippedBy=null, stats={[statType]:randInt(min,max)}`）
   - **神话锻造**：从 `getMythicTemplate(job.recipeId)` 获取模板，生成实例（额外含 `setId, unsellable:true`），属性值在 `statRange` 内随机
   - **模板缺失**：若普通锻造无候选模板（`EquipmentData` 中无匹配品质）或神话锻造 `getMythicTemplate()` 返回 `null`，则从队列移除该任务，不生成装备，不 emit 事件（静默失败）
3. 将装备添加到 `EquipmentManager`（通过 `EquipmentManager.addToInventory(equip)`）— ⚠️ 见 BUG-3
   - 若背包已满，装备进入溢出栏（overflow），emit warning toast
   - 若溢出栏也满，装备丢失（极端边界，实践中不应发生）
4. 从队列中移除该任务（`queue.splice(idx, 1)`）
5. emit `forge:completed({ equipment })` 和 `toast:show({ type:'success', message:'🔨 锻造完成：{name}！' })`

> **迭代约束**：`onTick` 正向遍历 `queue` 数组。`_completeForge` 中 `splice(idx, 1)` 会导致后续元素左移，使 splice 点之后的下一个 job 在本轮 tick 被跳过。由于 `maxQueue` 默认为 1，此行为在实践中不影响正确性。若未来 `maxQueue > 1`，需改为逆向遍历或延迟移除。

**验收场景**：

```
WHEN onTick(1)
AND queue 为空
THEN 无操作

WHEN onTick(1)
AND queue 有普通锻造任务 { quality:2, totalTime:600, elapsedTime:599 }
THEN elapsedTime 变为 600（≥ totalTime）
AND 从 EquipmentData 筛选 quality=2 候选，随机选一个生成装备
AND EquipmentManager.addToInventory(装备)
AND queue 移除该任务
AND emit forge:completed({ equipment })

WHEN onTick(1)
AND queue 有普通锻造任务 { quality:3, totalTime:1800, elapsedTime:100 }
THEN elapsedTime 变为 101，任务继续

WHEN onTick(1)
AND queue 有神话锻造任务 { quality:6, paused:false }
AND 所有资源充足
THEN 逐一 ResourceManager.spend(res, ceil(costPerSec×1))
AND job.consumed 各项累加
AND elapsedTime += 1
AND emit forge:progress({ recipeId, percent })

WHEN onTick(1)
AND queue 有神话锻造任务 { quality:6, paused:false }
AND gold 不足以支付 costPerSec×dt
THEN job.paused = true
AND emit forge:paused({ recipeId, reason:'资源不足' })
AND 不扣除任何资源，elapsedTime 不变

WHEN onTick(1)
AND queue 有神话锻造任务 { quality:6, paused:true }
AND _canAffordPerSec 返回 true（资源已恢复）
THEN job.paused = false
AND 正常消耗资源并推进（同 S4）

WHEN onTick(1)
AND queue 有神话锻造任务 { quality:6, paused:true }
AND 资源仍不足
THEN 无操作，任务保持暂停

WHEN onTick(1)
AND 神话锻造 elapsedTime + dt >= totalTime
THEN 从 getMythicTemplate 生成神话装备（setId, unsellable:true）
AND EquipmentManager.addToInventory(装备)
AND queue 移除该任务
AND emit forge:completed({ equipment })

WHEN 普通锻造完成
AND EquipmentData 中无 quality=2 的候选模板
THEN queue 移除该任务
AND 不生成装备，不 emit forge:completed

WHEN 神话锻造完成
AND getMythicTemplate(recipeId) 返回 null
THEN queue 移除该任务
AND 不生成装备，不 emit forge:completed

WHEN 普通锻造完成
AND EquipmentManager 背包已满
THEN 装备进入 overflow 溢出栏
AND emit forge:completed({ equipment })
```

---

### 能力 4：图纸管理

**描述**：添加神话锻造所需图纸。

**接口**：
- `addBlueprint(blueprintId)` → `void`
  - `blueprintId`: 图纸 ID

**行为规则**：
- 若 `_state.blueprints` 已包含该 ID → 不重复添加
- 若不包含 → push 到 `_state.blueprints`，emit `toast:show({ type:'success', message:'📜 获得图纸：{name}' })`
  - `name` 来自 `BlueprintData[blueprintId].name`，若 BlueprintData 不存在则用 `blueprintId` 作为名称

**验收场景**：

```
WHEN addBlueprint('bp_001')
AND blueprints 不包含 'bp_001'
AND BlueprintData['bp_001'].name = '青龙偃月刀·图纸'
THEN blueprints 新增 'bp_001'
AND emit toast:show({ type:'success', message:'📜 获得图纸：青龙偃月刀·图纸' })

WHEN addBlueprint('bp_001')
AND blueprints 已包含 'bp_001'
THEN blueprints 不变，不 emit

WHEN addBlueprint(null)
THEN null 被 push 进 blueprints（当前代码无 null 防御，indexOf(null)===-1 通过检查）
```

> **注意**：`addBlueprint(null)` 是无防御的边界情况。调用方应确保传入有效 ID。

---

### 能力 5：查询接口

**描述**：提供锻造状态的只读查询。

**接口**：
- `getQueue()` → `object[]` — 返回锻造队列的内部引用
- `getBlueprints()` → `string[]` — 返回图纸列表的内部引用
- `getMaxQueue()` → `number` — 返回最大队列长度
- `getNormalRecipes()` → `object[]` — 返回普通锻造配方表的内部引用

**行为规则**：
- 返回值均为内部引用（调用方不应修改）
- `getNormalRecipes()` 返回 `_normalRecipes` 静态数组

**验收场景**：

```
WHEN queue 有 1 个任务
AND getQueue()
THEN 返回长度 1 的数组，与内部 _state.queue 为同一引用

WHEN blueprints = ['bp_001', 'bp_002']
AND getBlueprints()
THEN 返回长度 2 的数组

WHEN getNormalRecipes()
THEN 返回长度 4 的数组，第一项 quality=2

WHEN getMaxQueue()
THEN 返回 _state.maxQueue 值
```

---

### 能力 6：初始化与存档

**描述**：从存档恢复锻造状态或初始化默认状态。

**接口**：
- `init(saved)` → `void`
  - `saved`: 完整存档对象（从 `SaveManager.load()` 返回），内部从 `saved.forge` 提取锻造状态；`saved` 为 `undefined` 时为新游戏
- `getState()` → `object` — 导出可序列化状态

**行为规则**：
- **新游戏**（`saved` 为 `undefined`）：`queue=[], maxQueue=1, blueprints=[]`
- **恢复存档**：从 `saved.forge` 恢复 `queue`, `maxQueue`, `blueprints`，缺失字段或 falsy 值（0, null, undefined）使用默认值
  - `maxQueue` 合法范围 [1, ∞)，存档值为 0 或缺失时使用默认值 1（代码 `data.maxQueue || 1` 的 JS falsy 语义）
- `getState()` 返回：
  ```json
  {
    "queue": "<Utils.deepClone(queue)>",
    "maxQueue": "<number>",
    "blueprints": "<blueprints.slice()>",
    "mythicForge": "<从 queue 中提取 quality===6 的任务信息>"
  }
  ```
- `mythicForge` 提取规则：遍历 queue，找到第一个 `quality === 6` 的任务，提取 `{ blueprintId:job.blueprintId, progress:job.elapsedTime, requiredTime:job.totalTime, paused:job.paused }`
  - `blueprintId` 是原始图纸 ID（如 'bp_001'），用于 UI 在 `BlueprintData` 中查找图纸信息

**验收场景**：

```
WHEN init(undefined)（首次游戏）
THEN _state.queue = []
AND _state.maxQueue = 1
AND _state.blueprints = []

WHEN init({ forge: { queue: [{...}], maxQueue: 2, blueprints: ['bp_001'] } })
THEN _state.queue 恢复为存档中的队列
AND _state.maxQueue = 2
AND _state.blueprints = ['bp_001']

WHEN getState()
AND queue 含 1 个神话任务 { quality:6, recipeId:'eq_m01', blueprintId:'bp_001', elapsedTime:3600, totalTime:86400, paused:false }
THEN 返回 { queue: deepClone([...]), maxQueue:1, blueprints:[...], mythicForge: { blueprintId:'bp_001', progress:3600, requiredTime:86400, paused:false } }
AND 修改返回对象不影响内部状态

WHEN getState()
AND queue 不含神话任务
THEN mythicForge = {}
```

## 内部状态机

锻造任务生命周期：

| 状态 | 转换到 | 触发器 | 守卫条件 |
|------|--------|--------|----------|
| 不存在 | 进行中 | `startNormalForge(idx)` | 队列未满、建筑等级足够、资源充足 |
| 不存在 | 进行中 | `startMythicForge(bpId)` | 队列未满、有图纸、建筑等级≥10 |
| 进行中 | 已暂停 | `onTick()` 资源不足（仅神话） | `!canAffordPerSec` |
| 已暂停 | 进行中 | `onTick()` 资源恢复（仅神话） | `canAffordPerSec` |
| 进行中 | 已完成 | `onTick()` 时间到达 | `elapsedTime >= totalTime` |

图纸生命周期：

| 状态 | 转换到 | 触发器 | 守卫条件 |
|------|--------|--------|----------|
| 不存在 | 已获得 | `addBlueprint(bpId)` | 未重复 |
| 已获得 | 已消耗 | `startMythicForge(bpId)` | 所有前置检查通过 |

## 依赖

| 依赖项 | 方向 | 说明 |
|--------|------|------|
| ResourceManager | ForgeManager → ResourceManager | 普通锻造一次性扣资源；神话锻造持续消耗（canAfford + spend） |
| TownManager | ForgeManager → TownManager | 查询 weapon_workshop / blacksmith 建筑等级（可选依赖：若 TownManager 未定义，建筑等级视为 0，所有锻造因等级不足而失败） |
| EquipmentManager | ForgeManager → EquipmentManager | 锻造完成后将装备加入背包（addToInventory） |
| EquipmentData | ForgeManager → EquipmentData | 普通锻造装备模板数据（静态数组） |
| BlueprintData | ForgeManager → BlueprintData | 神话锻造图纸数据（静态对象） |
| getMythicTemplate | ForgeManager → getMythicTemplate | 神话装备模板查询函数（全局函数） |
| Utils | ForgeManager → Utils | uid()、randInt()、deepClone() |

## 数据所有权

| 实体 | 本服务拥有的 | 共享给 | 方式 |
|------|-------------|--------|------|
| 锻造队列 | queue[] | UI | `getQueue()`, `getState()` |
| 图纸列表 | blueprints[] | UI | `getBlueprints()`, `getState()` |
| 队列容量 | maxQueue | UI | `getMaxQueue()`, `getState()` |

## 事件契约

| 事件 | 方向 | 载荷 | 触发时机 |
|------|------|------|----------|
| `game:tick` | 消费 | `(dt)` 秒数 | 驱动 `onTick(dt)` 锻造进度推进 |
| `forge:started` | 生产 | `{ recipeId, totalTime }` | 开始普通/神话锻造 |
| `forge:completed` | 生产 | `{ equipment }` | 锻造完成（普通和神话共用） |
| `forge:paused` | 生产 | `{ recipeId, reason }` | 神话锻造资源不足暂停 |
| `forge:progress` | 生产 | `{ recipeId, percent }` | 神话锻造每 tick 进度更新 |
| `toast:show` | 生产 | `{ type, message }` | 各种用户提示 |

> ✅ **UI Bug 已修复**：`forge-panel.js` 已改为正确监听 `forge:completed`、`forge:paused`、`forge:progress`。

## 配置

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `maxQueue` | number | 1 | 最大同时锻造数 |
| 普通锻造等级要求 | number[] | [1, 3, 5, 8] | qualityIndex 对应的建筑等级要求 |
| 神话锻造等级要求 | number | 10 | 武器工坊和铁匠铺最低等级 |
| 神话锻造基础时间 | number | 86400 | 基础锻造秒数（24小时） |
| 神话锻造总消耗 | object | `{gold:36000, iron:7200, wood:3600, stone:2400}` | 整个神话锻造的资源总消耗 |

## 约束与设计决策

1. **锻造完成必须通过 `EquipmentManager.addToInventory()`** — 不得直接写入 `_inventory`，遵守模块边界（✅ 已修复）
2. **神话装备含 `setId` 和 `unsellable:true`** — 普通锻造装备不含这两个字段
3. **神话锻造资源按 `Math.ceil()` 取整扣除** — 累计消耗可能高于 `totalCost`。以 gold 为例：`costPerSec = 36000/86400 ≈ 0.4167`，每秒 `ceil(0.4167) = 1`，86400 秒总扣除 86400 >> totalCost 36000。`job.consumed` 记录仅用于 UI 展示，非实际限制
4. **暂停的神话锻造不推进时间** — `elapsedTime` 只在资源充足时增加
5. **图纸不可重复持有** — `addBlueprint` 会检查去重
6. **品质 6（神话）** — 系统中存在但未在 core-contracts 品质枚举中注册，需同步更新

## 导航

- 系统契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 装备服务：[specs/services/equipment-manager.md](equipment-manager.md)（锻造完成后添加装备）
- 资源服务：[specs/services/resource-manager.md](resource-manager.md)（锻造消耗资源）
