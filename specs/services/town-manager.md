---
status: Active
created: 2026-04-14
updated: 2026-04-14
author: AI (spec-architect)
reviewed-by: AI (spec-reviewer)
system-spec: specs/system/core-contracts.md
related:
  - specs/product-specs/town-road-system.md
  - specs/product-specs/construction-worker-system.md
  - specs/services/resource-manager.md
changelog:
  - date: 2026-04-14
    author: spec-architect
    change: "初始 Draft：逆向从 town-manager.js 生成，12 能力 70+ 场景"
    reason: "TownManager 缺少整体服务规范"
  - date: 2026-04-14
    author: spec-reviewer
    change: "修复 7 项审查问题（1×P0 + 4×P1 + 2×P2）：8→9项检查、_getUnlockedBuildingCount 语义、getBuildingState 引用语义、core-contracts 交叉引用、预留接口标注，提升为 Active"
    reason: "规范审查通过"
---

# 服务规范：TownManager

## 概述

城镇核心管理模块，负责 24 种建筑的等级管理、施工流程、战斗加成查询、资源上限覆盖、资源产出、集市交易、道路网络生成及碰撞网格代理。

TownManager 是多个子系统的"宿主"：战斗加成、资源上限、资源产出和集市交易均通过查询建筑等级并委托 `BuildingData` 计算具体效果。道路系统的详细规范见 [town-road-system.md](../product-specs/town-road-system.md)，建造工人系统规范见 [construction-worker-system.md](../product-specs/construction-worker-system.md)（尚未实现）。

## 状态结构

```javascript
TownManager._state = {
  buildings: {
    // 24 种建筑，每种含 level(number) 和 buildEndTime(number|null)
    town_hall:        { level: 1, buildEndTime: null },  // 城主府默认 Lv.1
    lumber_camp:      { level: 0, buildEndTime: null },
    quarry:           { level: 0, buildEndTime: null },
    iron_mine:        { level: 0, buildEndTime: null },
    farmland:         { level: 0, buildEndTime: null },
    barracks:         { level: 0, buildEndTime: null },
    training_ground:  { level: 0, buildEndTime: null },
    blacksmith:       { level: 0, buildEndTime: null },
    city_wall:        { level: 0, buildEndTime: null },
    adventure_guild:  { level: 0, buildEndTime: null },
    tavern:           { level: 0, buildEndTime: null },
    warehouse:        { level: 0, buildEndTime: null },
    market:           { level: 0, buildEndTime: null },
    tax_office:       { level: 0, buildEndTime: null },
    weapon_workshop:  { level: 0, buildEndTime: null },
    stable:           { level: 0, buildEndTime: null },
    academy:          { level: 0, buildEndTime: null },
    watermill:        { level: 0, buildEndTime: null },
    stone_mason:      { level: 0, buildEndTime: null },
    smelter:          { level: 0, buildEndTime: null },
    vegetable_garden: { level: 0, buildEndTime: null },
    compost_pit:      { level: 0, buildEndTime: null },
    seed_shop:        { level: 0, buildEndTime: null },
    parking_lot:      { level: 0, buildEndTime: null }
  },
  placements: {},   // { [buildingId]: { gx: number, gy: number } }
  roads: []         // Array<{ gx, gy, usage }> — 详见 town-road-system.md
};

// 运行时非持久化：
TownManager._productionAccum = { wood: 0, stone: 0, iron: 0, gold: 0 };
```

**建筑分类**（24 种，4 类）：

| 分类 | 建筑 |
|------|------|
| 核心 core | town_hall |
| 资源生产 production | lumber_camp, quarry, iron_mine, farmland, tax_office, watermill, stone_mason, smelter, vegetable_garden, compost_pit |
| 战斗辅助 combat | barracks, training_ground, blacksmith, city_wall, weapon_workshop, stable |
| 功能型 functional | adventure_guild, tavern, warehouse, market, academy, seed_shop, parking_lot |

## 外部依赖

| 依赖 | 类型 | 用途 |
|------|------|------|
| `BuildingData[id]` | 数据 | 建筑静态数据（费用公式、效果、等级上限、前置依赖） |
| `BuildingData._getBuildTime(lv)` | 数据 | 施工时间公式 `floor(30 × lv × 1.3^(lv-1))` 秒 |
| `BuildingData._townHallUnlocks[lv]` | 数据 | 城主府等级对应 `{ slots, levelCap, unlockStage }` |
| `ResourceManager.canAfford()` | 写操作 | 资源检查 |
| `ResourceManager.canAffordMultiple()` | 写操作 | 批量资源检查 |
| `ResourceManager.spend()` | 写操作 | 单资源扣除 |
| `ResourceManager.spendMultiple()` | 写操作 | 批量资源扣除 |
| `ResourceManager.add()` | 写操作 | 资源增加（产出） |
| `BattleManager.isStageCleared()` | 只读查询 | 城主府升级的关卡通关前置检查 |
| `TownWorld._defaultPositions` | 运行时 | 建筑默认放置坐标 |
| `TownWorld._buildingSizes` | 运行时 | 建筑尺寸 `{ w, h }` |
| `TownWorld.MAP_W / MAP_H` | 运行时 | 地图网格大小（40×40） |
| `TownWorld.getCollisionGrid()` | 运行时 | 碰撞网格 |
| `TownWorld._buildRoadGrid()` | 运行时 | 道路网格重建回调 |
| `Utils.deepClone()` | 工具 | 深拷贝 |
| `EventBus` | 通信 | 事件发射 |

## 被消费方（其他 Manager 调用 TownManager 的接口）

| 消费方 | 调用接口 | 用途 |
|--------|----------|------|
| ResourceManager | `getResourceCap(type)` | 资源上限覆盖 |
| BattleManager | `getAtkBonus()`, `getDefBonus()`, `getHpBonus()`, `getExpBonus()`, `getDropRateBonus()` | 战斗属性加成 |
| AbyssManager | `getAtkBonus()`, `getDefBonus()`, `getHpBonus()` | 深渊战斗加成 |
| AdventureManager | `getExpBonus()`, `getDropRateBonus()`, `getOfflineEfficiency()`, `canUpgrade()`, `getUpgradeCost()` | 冒险加成、自动升级建议 |
| EconomyManager | `getBuildingLevel()`, `getUpgradeCost()` | 经济分析 |
| FarmManager | `getState()` | 建筑等级查询 |
| ForgeManager | `getState()` | 建筑等级查询 |
| ParkingManager | `getOfflineEfficiency()`, `getBuildingLevel()` | 离线效率、停车场等级 |
| TowerDefenseManager | `getBuildingLevel()`, `getCollisionGrid()` | 城主府等级、碰撞网格 |

> **注**：`getSpdBonus`、`getFirstStrikeChance`、`getEquipQualityBonus`、`getSkillCooldownReduction`、`getRecruitDiscount`、`getBoosterLevel`、`getProductionRate` 已实现但当前无外部消费方，为预留扩展接口。

## 事件

### 发射的事件

| 事件 | 载荷 | 触发时机 |
|------|------|----------|
| `town:building_upgraded` | `{ buildingId: string, newLevel: number }` | 建筑施工完成（onTick 中检测） |
| `town:building_started` | `{ buildingId: string, endTime: number }` | 建筑施工开始（startUpgrade） |
| `town:trade` | `{ from: 'gold', to: string, amount: number }` | 集市交易完成 |
| `town:roads_updated` | `{ count: number }` | 道路网络重算完成 |
| `toast:show` | `{ type: 'success', message: string }` | 建筑升级完成提示 |

### 监听的事件

无。TownManager 通过 `onTick(dt)` 由 GameLoop 驱动，不主动监听任何 EventBus 事件。

---

## 能力

### C1: 初始化与存档

**描述**：从存档恢复建筑状态或初始化为默认值。城主府默认 Lv.1，其余 23 种建筑默认 Lv.0。支持向后兼容——新增建筑在旧存档中自动使用默认值。

**接口**：
- `init(saved)` — 初始化。`saved` 为完整存档对象，建筑数据从 `saved.town` 读取
- `getState()` → `object` — 返回 `_state` 的深拷贝（`Utils.deepClone`），包含 `buildings`、`placements`、`roads`

**行为规则**：
1. `init(saved)` 从 `saved.town.buildings` 恢复建筑，对每个建筑仅取 `level` 和 `buildEndTime`
2. 存档中不存在的建筑 ID 使用默认值（`level: 0, buildEndTime: null`）
3. `_state.placements` 从 `saved.town.placements` 恢复，默认 `{}`
4. `_state.roads` 从 `saved.town.roads` 恢复，过滤无效条目（缺少 `gx`/`gy` 或越界），默认 `[]`
5. `_productionAccum` 始终重置为全 0（不持久化）
6. 初始化结束后延迟 100ms 调用 `recalcRoads()` 重算道路网络
7. `getState()` 返回深拷贝，修改返回值不影响内部状态
8. `getState()` 返回值不包含 `_productionAccum`（仅含 `_state`）

**验收场景**：

```
WHEN 新玩家首次进入游戏
AND  saved 为 undefined
THEN _state.buildings.town_hall.level === 1
AND  其余 23 种建筑 level === 0
AND  所有建筑 buildEndTime === null
AND  _state.placements === {}
AND  _state.roads === []
AND  _productionAccum 全为 0
```

```
WHEN 从存档加载
AND  saved.town.buildings 包含 { town_hall: { level: 5 }, barracks: { level: 3, buildEndTime: 9999999999999 } }
THEN _state.buildings.town_hall.level === 5
AND  _state.buildings.barracks.level === 3
AND  _state.buildings.barracks.buildEndTime === 9999999999999
AND  存档中未出现的建筑使用默认值 (level: 0)
```

```
WHEN 从旧存档加载
AND  存档中缺少 parking_lot（新增建筑）
THEN _state.buildings.parking_lot === { level: 0, buildEndTime: null }
AND  其他已有建筑正常恢复
```

```
WHEN 从存档加载
AND  saved.town.roads 包含 [{ gx: 5, gy: 10, usage: 2 }, { gx: 99, gy: 0, usage: 1 }]
THEN _state.roads === [{ gx: 5, gy: 10, usage: 2 }]
AND  gx=99 的越界条目被静默丢弃
```

```
WHEN getState() 被调用
THEN 返回 { buildings: {...}, placements: {...}, roads: [...] }
AND  返回值是深拷贝
AND  修改返回值不影响 TownManager._state
```

---

### C2: 建筑状态查询

**描述**：查询建筑的等级、施工状态、施工进度和施工队列信息。

**接口**：
- `getBuildingLevel(buildingId)` → `number` — 建筑当前等级
- `getBuildingState(buildingId)` → `{ level, buildEndTime } | null` — 建筑完整状态
- `isBuilding(buildingId)` → `boolean` — 是否正在施工
- `getBuildingProgress(buildingId)` → `number | null` — 施工进度 [0, 1]
- `getRemainingBuildTime(buildingId)` → `number` — 剩余施工秒数
- `getActiveBuildCount()` → `number` — 当前正在施工的建筑数量
- `getMaxBuildSlots()` → `number` — 最大同时施工数

**行为规则**：
1. `getBuildingLevel` 对不存在的 buildingId 返回 0
2. `getBuildingState` 对不存在的 buildingId 返回 null；**返回值为内部对象的直接引用（非拷贝），调用方不得修改**
3. `isBuilding` 判断条件：`buildEndTime !== null && Date.now() < buildEndTime`
4. `getBuildingProgress` 无施工返回 null；已完成返回 1；进行中返回 `elapsed / totalTime`，clamp 到 [0, 1]
5. `getRemainingBuildTime` 无施工返回 0；返回 `ceil((buildEndTime - now) / 1000)`，最小 0
6. `getActiveBuildCount` 遍历所有建筑统计 `isBuilding` 为 true 的数量
7. `getMaxBuildSlots` 返回 `town_hall.level >= 5 ? 2 : 1`

**验收场景**：

```
WHEN getBuildingLevel('town_hall')
AND  town_hall.level === 1
THEN 返回 1

WHEN getBuildingLevel('unknown_building')
THEN 返回 0

WHEN getBuildingState('barracks')
AND  barracks === { level: 3, buildEndTime: null }
THEN 返回 { level: 3, buildEndTime: null }

WHEN getBuildingState('nonexistent')
THEN 返回 null
```

```
WHEN isBuilding('barracks')
AND  barracks.buildEndTime === Date.now() + 60000（1分钟后完成）
THEN 返回 true

WHEN isBuilding('barracks')
AND  barracks.buildEndTime === null
THEN 返回 false

WHEN isBuilding('barracks')
AND  barracks.buildEndTime < Date.now()（已过期）
THEN 返回 false
```

```
WHEN getBuildingProgress('barracks')
AND  barracks.buildEndTime === null
THEN 返回 null

WHEN getBuildingProgress('barracks')
AND  施工总时间 60 秒，已过 30 秒
THEN 返回约 0.5

WHEN getBuildingProgress('barracks')
AND  buildEndTime < Date.now()
THEN 返回 1
```

```
WHEN getRemainingBuildTime('barracks')
AND  barracks.buildEndTime === Date.now() + 30000
THEN 返回 30

WHEN getRemainingBuildTime('barracks')
AND  barracks.buildEndTime === null
THEN 返回 0
```

```
WHEN getActiveBuildCount()
AND  有 2 个建筑 isBuilding === true
THEN 返回 2
```

```
WHEN getMaxBuildSlots()
AND  town_hall.level === 4
THEN 返回 1

WHEN getMaxBuildSlots()
AND  town_hall.level === 5
THEN 返回 2

WHEN getMaxBuildSlots()
AND  town_hall.level === 10
THEN 返回 2
```

---

### C3: 升级费用与时间查询

**描述**：查询建筑升级到下一级所需的资源费用和施工时间。费用由 `BuildingData[id].costFormula(targetLevel)` 计算，施工时间由 `BuildingData._getBuildTime(targetLevel)` 计算。

**接口**：
- `getUpgradeCost(buildingId)` → `{ [resourceType]: number } | null` — 升级到下一级的费用
- `getBuildTime(buildingId)` → `number` — 升级到下一级的施工秒数

**行为规则**：
1. `getUpgradeCost` 对未知建筑（不在 BuildingData 中）返回 null
2. 目标等级 = `currentLevel + 1`；特例：城主府 level === 0 时（不应出现，但做防御），`targetLevel = 2`
3. `getBuildTime` 返回 `BuildingData._getBuildTime(currentLevel + 1)` = `floor(30 × targetLevel × 1.3^(targetLevel-1))`

**验收场景**：

```
WHEN getUpgradeCost('town_hall')
AND  town_hall.level === 1
THEN 返回 BuildingData.town_hall.costFormula(2)
AND  结果包含 gold、wood、stone 键

WHEN getUpgradeCost('unknown_id')
THEN 返回 null

WHEN getBuildTime('barracks')
AND  barracks.level === 0
THEN 返回 BuildingData._getBuildTime(1) === floor(30 × 1 × 1.3^0) === 30 秒
```

---

### C4: 建筑升级

**描述**：验证升级前置条件并启动施工。`canUpgrade` 执行 9 项检查，`startUpgrade` 在检查通过后扣除资源、设置施工结束时间并发射事件。

**接口**：
- `canUpgrade(buildingId)` → `{ ok: boolean, reason?: string }` — 升级前置检查
- `startUpgrade(buildingId)` → `{ ok: boolean, reason?: string }` — 开始升级

**canUpgrade 检查顺序**（任一不满足即返回 `{ ok: false, reason }`）：

| 序号 | 检查项 | 失败原因 |
|------|--------|----------|
| 1 | 建筑存在于 BuildingData | `'未知建筑'` |
| 2 | 建筑未在施工中 | `'正在施工中'` |
| 3 | 施工队列未满（activeBuildCount < maxBuildSlots） | `'施工队列已满'` |
| 4 | 未超城主府等级上限（非 town_hall 时：currentLevel < _townHallUnlocks[thLevel].levelCap） | `'需升级城主府解锁更高等级'` |
| 5 | 未超建筑自身最大等级 | `'已达最大等级'` |
| 6 | 城主府升级的关卡前置（仅 town_hall：BattleManager.isStageCleared） | `'需通关 X-X'` |
| 7 | 建筑前置依赖满足（BuildingData[id].requires） | `'需要 XXX Lv.Y'` |
| 8 | 建筑槽位足够（非 town_hall 且 level === 0 时：已解锁数 < thData.slots） | `'建筑槽不足，升级城主府解锁'` |
| 9 | 资源充足（ResourceManager.canAffordMultiple） | `'资源不足'` |

**"已解锁建筑数"定义**（内部方法 `_getUnlockedBuildingCount()`）：
- 排除 `town_hall`
- 统计所有 `level > 0` **或** `isBuilding(id) === true`（正在施工）的建筑数量
- 即：正在施工中尚未完成的建筑也计入已解锁数

**startUpgrade 行为**：
1. 调用 `canUpgrade`，不通过则返回失败结果
2. `ResourceManager.spendMultiple(cost, 'building', 'building_upgrade', buildingId)`
3. `buildEndTime = Date.now() + buildTime × 1000`
4. 发射 `town:building_started` 事件
5. 返回 `{ ok: true }`

**验收场景**：

```
WHEN canUpgrade('barracks')
AND  barracks.level === 0, town_hall.level === 3, 有前置 requires: { town_hall: 3 }
AND  施工队列未满, 建筑槽充足, 资源充足
THEN 返回 { ok: true }
```

```
WHEN canUpgrade('unknown_building')
THEN 返回 { ok: false, reason: '未知建筑' }

WHEN canUpgrade('barracks')
AND  barracks.buildEndTime !== null（正在施工）
THEN 返回 { ok: false, reason: '正在施工中' }

WHEN canUpgrade('barracks')
AND  activeBuildCount === maxBuildSlots
THEN 返回 { ok: false, reason: '施工队列已满' }

WHEN canUpgrade('barracks')
AND  barracks.level === 3, town_hall.level === 2
AND  _townHallUnlocks[2].levelCap === 3
THEN 返回 { ok: false, reason: '需升级城主府解锁更高等级' }

WHEN canUpgrade('barracks')
AND  barracks.level === 25（maxLevel）
THEN 返回 { ok: false, reason: '已达最大等级' }

WHEN canUpgrade('town_hall')
AND  town_hall.level === 1, _townHallUnlocks[2].unlockStage === 'stage_1_10'
AND  BattleManager.isStageCleared('stage_1_10') === false
THEN 返回 { ok: false, reason: '需通关 1-10' }

WHEN canUpgrade('barracks')
AND  barracks.level === 0, requires: { town_hall: 3 }, town_hall.level === 2
THEN 返回 { ok: false, reason: '需要 城主府 Lv.3' }

WHEN canUpgrade('lumber_camp')
AND  lumber_camp.level === 0, 已解锁建筑数 === thData.slots
THEN 返回 { ok: false, reason: '建筑槽不足，升级城主府解锁' }

WHEN canUpgrade('barracks')
AND  所有前置通过, 但资源不足
THEN 返回 { ok: false, reason: '资源不足' }
```

```
WHEN startUpgrade('barracks')
AND  canUpgrade 返回 { ok: true }
THEN ResourceManager.spendMultiple 被调用（参数: cost, 'building', 'building_upgrade', 'barracks'）
AND  barracks.buildEndTime 被设置为 Date.now() + buildTime × 1000
AND  EventBus.emit('town:building_started', { buildingId: 'barracks', endTime: barracks.buildEndTime })
AND  返回 { ok: true }

WHEN startUpgrade('barracks')
AND  canUpgrade 返回 { ok: false, reason: '资源不足' }
THEN 不扣资源, 不设 buildEndTime, 不发事件
AND  返回 { ok: false, reason: '资源不足' }
```

---

### C5: 施工加速

**描述**：消耗玉璧立即完成施工。玉璧费用 = `ceil(剩余秒数 / 60)`，即每分钟 1 玉璧。

**接口**：
- `speedUpBuild(buildingId)` → `boolean` — 是否加速成功

**行为规则**：
1. 若建筑无施工（无 buildEndTime）→ 返回 false
2. 计算 `jadeCost = ceil(remainingSec / 60)`
3. 若 `jadeCost <= 0`（已完成）→ 返回 false
4. 若玉璧不足（`!ResourceManager.canAfford('jade', jadeCost)`）→ 返回 false
5. 扣除玉璧：`ResourceManager.spend('jade', jadeCost, 'building', 'speed_up', buildingId)`
6. 设置 `buildEndTime = Date.now()`（下一个 tick 会触发完成逻辑）
7. 返回 true

**验收场景**：

```
WHEN speedUpBuild('barracks')
AND  barracks 正在施工, 剩余 120 秒
THEN jadeCost === ceil(120/60) === 2
AND  检查 canAfford('jade', 2)
AND  若通过: spend jade 2, buildEndTime = Date.now(), 返回 true

WHEN speedUpBuild('barracks')
AND  barracks 正在施工, 剩余 30 秒
THEN jadeCost === ceil(30/60) === 1

WHEN speedUpBuild('barracks')
AND  barracks.buildEndTime === null（未施工）
THEN 返回 false

WHEN speedUpBuild('barracks')
AND  barracks 正在施工, 但玉璧不足
THEN 返回 false, 不扣资源, buildEndTime 不变
```

---

### C6: Tick 处理 — 施工完成与资源产出

**描述**：每秒由 GameLoop 调用。检查施工完成（升级建筑等级、触发重算道路）；驱动资源产出（伐木场、采石场、铁矿场、税务署的累积产出）。

**接口**：
- `onTick(dt)` — `dt` 为距上次 tick 的秒数

**施工完成逻辑**：
1. 遍历所有建筑，若 `buildEndTime !== null && Date.now() >= buildEndTime`：
   a. `level++`
   b. `buildEndTime = null`
   c. 发射 `town:building_upgraded` 事件 `{ buildingId, newLevel: level }`
   d. 发射 `toast:show` 事件 `{ type: 'success', message: 'emoji name 升级到 Lv.X！' }`
   e. 调用 `recalcRoads()` 重算道路

**资源产出逻辑**：
1. 生产型建筑列表：`lumber_camp`、`quarry`、`iron_mine`、`tax_office`
2. 加成器映射：`lumber_camp→watermill`、`quarry→stone_mason`、`iron_mine→smelter`（tax_office 无加成器）
3. 对每个生产建筑：
   a. `level <= 0` → 跳过
   b. 基础产出 `perSecond = BuildingData[id].production(level).perMinute / 60`
   c. 若有加成器且加成器 `level > 0`：`perSecond *= (1 + boosterLevel × boostData.bonusPerLevel)`
   d. 累加到 `_productionAccum[resource] += perSecond × dt`
   e. 当 `_productionAccum[resource] >= 1` 时，循环投放：减 1 + `ResourceManager.add(resource, 1, 'production', buildingId, buildingId + '_lv' + level)`

**验收场景**：

```
WHEN onTick(1) 被调用
AND  barracks.buildEndTime === Date.now() - 100（已过期）
THEN barracks.level 从 N 变为 N+1
AND  barracks.buildEndTime 变为 null
AND  EventBus.emit('town:building_upgraded', { buildingId: 'barracks', newLevel: N+1 })
AND  EventBus.emit('toast:show', { type: 'success', message: '⚔ 兵营 升级到 Lv.N+1！' })
AND  recalcRoads() 被调用
```

```
WHEN onTick(1) 被调用
AND  所有建筑 buildEndTime === null
THEN 无施工完成事件
```

```
WHEN onTick(1) 被调用
AND  lumber_camp.level === 5
AND  watermill.level === 2
THEN basePerMinute = BuildingData.lumber_camp.production(5).perMinute
AND  perSecond = (basePerMinute / 60) × (1 + 2 × 0.05)
AND  _productionAccum.wood += perSecond × 1
AND  若 _productionAccum.wood >= 1: ResourceManager.add('wood', 1, 'production', 'lumber_camp', 'lumber_camp_lv5')
```

```
WHEN onTick(1) 被调用
AND  tax_office.level === 3
THEN 税务署产出金币
AND  不查询加成器（tax_office 无加成器映射）
AND  basePerMinute = BuildingData.tax_office.production(3).perMinute
AND  _productionAccum.gold += (basePerMinute / 60) × 1
```

```
WHEN onTick(1) 被调用
AND  lumber_camp.level === 0
THEN 不产出木材，_productionAccum.wood 不变
```

---

### C7: 战斗加成查询

**描述**：查询建筑对战斗属性的加成。各加成由特定建筑等级决定，委托 `BuildingData[id].effects(level)` 计算。战斗系 Manager（BattleManager、AbyssManager、AdventureManager）为可选消费方。

**接口**：
- `getAtkBonus()` → `number` — 攻击力加成（兵营 + 武器工坊叠加）
- `getDefBonus()` → `number` — 防御力加成（城墙）
- `getHpBonus()` → `number` — 生命值加成（城墙）
- `getExpBonus()` → `number` — 经验加成（校场 + 书院叠加）
- `getSpdBonus()` → `number` — 速度加成（马厩）
- `getFirstStrikeChance()` → `number` — 先攻概率（马厩）
- `getEquipQualityBonus()` → `number` — 装备品质加成（武器工坊）
- `getSkillCooldownReduction()` → `number` — 技能冷却缩减（书院）

**行为规则**：
1. 所有加成 getter 在对应建筑 level <= 0 时返回 0
2. `getAtkBonus` = `barracks.effects(lv).atkBonus + weapon_workshop.effects(lv).atkBonus`
3. `getDefBonus` = `city_wall.effects(lv).defBonus`
4. `getHpBonus` = `city_wall.effects(lv).hpBonus`
5. `getExpBonus` = `training_ground.effects(lv).expBonus + academy.effects(lv).expBonus`
6. `getSpdBonus` = `stable.effects(lv).spdBonus`
7. `getFirstStrikeChance` = `stable.effects(lv).firstStrikeChance`
8. `getEquipQualityBonus` = `weapon_workshop.effects(lv).equipQualityBonus`
9. `getSkillCooldownReduction` = `academy.effects(lv).skillCooldownReduction`

**验收场景**：

```
WHEN getAtkBonus()
AND  barracks.level === 5, weapon_workshop.level === 3
THEN bonus = BuildingData.barracks.effects(5).atkBonus + BuildingData.weapon_workshop.effects(3).atkBonus
AND  barracks: min(1.5, 0.03 × 5 × (1 + 0.1 × 5)) = min(1.5, 0.225) = 0.225
AND  weapon_workshop: 0.02 × 3 = 0.06
AND  结果 = 0.285

WHEN getAtkBonus()
AND  barracks.level === 0, weapon_workshop.level === 0
THEN 返回 0

WHEN getDefBonus()
AND  city_wall.level === 10
THEN 返回 min(1.5, 0.03 × 10 × (1 + 0.1 × 10)) = min(1.5, 0.6) = 0.6

WHEN getDefBonus()
AND  city_wall.level === 0
THEN 返回 0

WHEN getExpBonus()
AND  training_ground.level === 5, academy.level === 3
THEN training_ground: min(3.0, 0.10 × 5 × (1 + 0.08 × 5)) = min(3.0, 0.7) = 0.7
AND  academy: 0.15 × 3 = 0.45
AND  结果 = 1.15

WHEN getSpdBonus()
AND  stable.level === 0
THEN 返回 0

WHEN getFirstStrikeChance()
AND  stable.level === 10
THEN 返回 min(0.5, 0.03 × 10) = 0.3

WHEN getSkillCooldownReduction()
AND  academy.level === 15
THEN 返回 min(0.5, 0.02 × 15) = 0.3
```

---

### C8: 资源上限与产出率查询

**描述**：查询建筑对资源上限的覆盖效果和资源产出速率。ResourceManager 通过 `getResourceCap` 获取上限覆盖。

**接口**：
- `getResourceCap(resourceType)` → `number` — 资源上限（基础 + 仓库加成 + 农田食物加成）
- `getProductionRate(resourceType)` → `number` — 资源每分钟产出率（含加成器）
- `getOfflineEfficiency()` → `number` — 离线收益效率系数
- `getRecruitDiscount()` → `number` — 招募折扣率
- `getDropRateBonus()` → `number` — 掉落率加成
- `getBoosterLevel(productionBuildingId)` → `number` — 加成器当前等级

**getResourceCap 行为规则**：
1. `baseCap = CONSTANTS.RESOURCE_BASE_CAP[resourceType]`，不存在则返回 `Infinity`
2. 仓库加成 `capBonus = warehouse.level > 0 ? BuildingData.warehouse.effects(lv).resourceCapBonus : 0`
3. 食物特殊处理：`foodExtra = farmland.level > 0 ? BuildingData.farmland.effects(lv).foodCapBonus : 0`
4. 食物上限 = `baseCap + foodExtra + floor(baseCap × capBonus)`
5. 其他资源上限 = `baseCap + floor(baseCap × capBonus)`

**getProductionRate 行为规则**：
1. 资源→建筑映射：`wood→lumber_camp, stone→quarry, iron→iron_mine, gold→tax_office`
2. 无映射的资源返回 0
3. 建筑 level <= 0 返回 0
4. `baseRate = BuildingData[id].production(level).perMinute`
5. 加成器映射同 onTick：`lumber_camp→watermill, quarry→stone_mason, iron_mine→smelter`
6. `finalRate = baseRate × (1 + boosterLevel × bonusPerLevel)`（无加成器则不乘）

**验收场景**：

```
WHEN getResourceCap('gold')
AND  warehouse.level === 3
THEN baseCap = 50000（CONSTANTS.RESOURCE_BASE_CAP.gold）
AND  capBonus = BuildingData.warehouse.effects(3).resourceCapBonus = 0.80
AND  返回 50000 + floor(50000 × 0.80) = 50000 + 40000 = 90000

WHEN getResourceCap('food')
AND  warehouse.level === 2, farmland.level === 3
THEN baseCap = 200
AND  capBonus = BuildingData.warehouse.effects(2).resourceCapBonus = 0.50
AND  foodExtra = BuildingData.farmland.effects(3).foodCapBonus = 100
AND  返回 200 + 100 + floor(200 × 0.50) = 200 + 100 + 100 = 400

WHEN getResourceCap('jade')
THEN baseCap 不存在于 CONSTANTS.RESOURCE_BASE_CAP
AND  返回 Infinity

WHEN getResourceCap('wood')
AND  warehouse.level === 0
THEN capBonus = 0
AND  返回 2000 + floor(2000 × 0) = 2000（基础上限）
```

```
WHEN getProductionRate('wood')
AND  lumber_camp.level === 5, watermill.level === 2
THEN baseRate = BuildingData.lumber_camp.production(5).perMinute = 2 × (1 + 0.75 × 4) = 8
AND  finalRate = 8 × (1 + 2 × 0.05) = 8 × 1.1 = 8.8

WHEN getProductionRate('gold')
AND  tax_office.level === 3
THEN baseRate = BuildingData.tax_office.production(3).perMinute = 5 × (1 + 0.8 × 2) = 13
AND  无加成器, finalRate = 13

WHEN getProductionRate('food')
THEN 返回 0（food 无对应产出建筑）

WHEN getProductionRate('wood')
AND  lumber_camp.level === 0
THEN 返回 0
```

```
WHEN getOfflineEfficiency()
AND  adventure_guild.level === 0
THEN 返回 0.50（默认值）

WHEN getOfflineEfficiency()
AND  adventure_guild.level === 5
THEN 返回 min(0.95, 0.50 + 0.05 × 5) = 0.75

WHEN getRecruitDiscount()
AND  tavern.level === 0
THEN 返回 0

WHEN getRecruitDiscount()
AND  tavern.level === 5
THEN 返回 min(0.5, 0.05 × 5) = 0.25

WHEN getDropRateBonus()
AND  adventure_guild.level === 10
THEN 返回 0.05 × 10 = 0.5
```

```
WHEN getBoosterLevel('lumber_camp')
THEN 返回 watermill 的 level

WHEN getBoosterLevel('tax_office')
THEN 返回 0（无加成器映射）

WHEN getBoosterLevel('unknown')
THEN 返回 0
```

---

### C9: 集市交易

**描述**：通过集市（market）建筑将金币兑换为木材、石料、铁矿。交易可用性和汇率由集市等级决定。

**接口**：
- `canTrade(toResource)` → `boolean` — 是否可交易该资源
- `getTradeRate(toResource)` → `number` — 金币/资源 汇率
- `executeTrade(toResource, amount)` → `boolean` — 执行交易

**canTrade 行为**：
1. 集市 level <= 0 → false
2. 委托 `BuildingData.market.effects(level)` 判断：
   - `wood`: `canTradeWood`（Lv.1+ 可交易）
   - `stone`: `canTradeStone`（Lv.2+ 可交易）
   - `iron`: `canTradeIron`（Lv.4+ 可交易）
   - 其他资源 → false

**getTradeRate 行为**：
1. 集市 level <= 0 → `Infinity`
2. 返回 `BuildingData.market.effects(level).tradeRates[toResource]`，未定义则 `Infinity`
3. 基础汇率：`wood: 10, stone: 12, iron: 18`
4. Lv.3+ 打 10% 折，Lv.5 打 20% 折（取整）

**executeTrade 行为**：
1. `!canTrade(toResource)` → false
2. `goldCost = rate × amount`
3. `!ResourceManager.canAfford('gold', goldCost)` → false
4. `ResourceManager.spend('gold', goldCost, 'trade', 'market_sell', toResource)`
5. `ResourceManager.add(toResource, amount, 'trade', 'market_buy', toResource)`
6. 发射 `town:trade` 事件 `{ from: 'gold', to: toResource, amount }`
7. 返回 true

**验收场景**：

```
WHEN canTrade('wood')
AND  market.level === 1
THEN 返回 true

WHEN canTrade('stone')
AND  market.level === 1
THEN 返回 false（需 Lv.2+）

WHEN canTrade('iron')
AND  market.level === 3
THEN 返回 false（需 Lv.4+）

WHEN canTrade('wood')
AND  market.level === 0
THEN 返回 false
```

```
WHEN getTradeRate('wood')
AND  market.level === 2
THEN discount = 0（Lv < 3）
AND  返回 floor(10 × (1 - 0)) = 10

WHEN getTradeRate('wood')
AND  market.level === 3
THEN discount = 0.10
AND  返回 floor(10 × 0.90) = 9

WHEN getTradeRate('iron')
AND  market.level === 5
THEN discount = 0.20
AND  返回 floor(18 × 0.80) = 14

WHEN getTradeRate('wood')
AND  market.level === 0
THEN 返回 Infinity
```

```
WHEN executeTrade('wood', 10)
AND  market.level === 2, tradeRate = 10, gold >= 100
THEN ResourceManager.spend('gold', 100, 'trade', 'market_sell', 'wood')
AND  ResourceManager.add('wood', 10, 'trade', 'market_buy', 'wood')
AND  EventBus.emit('town:trade', { from: 'gold', to: 'wood', amount: 10 })
AND  返回 true

WHEN executeTrade('iron', 5)
AND  market.level === 3（canTrade('iron') === false）
THEN 返回 false, 不扣资源

WHEN executeTrade('wood', 10)
AND  canTrade 通过, 但金币不足
THEN 返回 false, 不扣资源
```

---

### C10: 建筑分类查询

**描述**：按分类返回所有建筑 ID 列表。

**接口**：
- `getBuildingsByCategory()` → `{ core: string[], production: string[], combat: string[], functional: string[] }`

**行为规则**：
1. 遍历 `BuildingData` 中所有非 `_` 前缀的键
2. 按 `category` 字段分类
3. 返回四个分类数组

**验收场景**：

```
WHEN getBuildingsByCategory()
THEN 返回 { core: ['town_hall'], production: [24个中10个], combat: [6个], functional: [7个] }
AND  所有建筑 ID 出现且仅出现一次
AND  总数 = 24
```

---

### C11: 道路网络（MST）

**描述**：在已建建筑之间自动生成道路网络。详细规范参见 [town-road-system.md](../product-specs/town-road-system.md)。

**接口**：
- `recalcRoads()` — 重算道路网络
- `_getBuildingEntrance(buildingId)` → `{ gx, gy } | null` — 建筑入口点
- `_isBuildingAt(gx, gy, excludeId)` → `boolean` — 格子是否被建筑占据
- `_isAnyBuildingAt(gx, gy)` → `boolean` — 格子是否被任何建筑占据
- `_layPath(x1, y1, x2, y2, usageGrid)` → `Array<{gx, gy}>` — 铺设 L 形路径
- `_traceLPath(x1, y1, x2, y2, hFirst)` → `Array<{gx, gy}> | null` — 追踪 L 形路径
- `_bfsPath(x1, y1, x2, y2)` → `Array<{gx, gy}>` — BFS 绕行路径

本能力的完整 WHEN/THEN 场景定义在 [town-road-system.md](../product-specs/town-road-system.md) C1 节。此处仅列出 TownManager 侧的核心场景：

```
WHEN recalcRoads() 被调用
AND  有 ≥ 2 个 level > 0 的建筑
THEN _state.roads 被更新为 MST 道路格数组
AND  EventBus.emit('town:roads_updated', { count })
AND  TownWorld._buildRoadGrid() 被调用（如 TownWorld 存在）

WHEN recalcRoads() 被调用
AND  仅有 0 或 1 个 level > 0 的建筑
THEN _state.roads = []
AND  EventBus.emit('town:roads_updated', { count: 0 })
```

---

### C12: 碰撞网格代理

**描述**：代理 TownWorld 的碰撞网格查询，供 TowerDefenseManager 等外部使用。

**接口**：
- `getCollisionGrid()` → `Array | null` — 碰撞网格数据

**行为规则**：
1. 若 `TownWorld` 存在且有 `getCollisionGrid` 方法，委托调用
2. 否则返回 `null`

**验收场景**：

```
WHEN getCollisionGrid()
AND  TownWorld 已加载
THEN 返回 TownWorld.getCollisionGrid() 的结果

WHEN getCollisionGrid()
AND  TownWorld 未加载（typeof TownWorld === 'undefined'）
THEN 返回 null
```

---

## 不变量

1. **城主府永不为 Lv.0** — 默认初始化为 Lv.1，不可降级
2. **建筑等级只增不减** — 无拆除/降级机制
3. **施工资源先扣后建** — `startUpgrade` 在设置 `buildEndTime` 前完成 `spendMultiple`
4. **产出通过累积器投放** — `_productionAccum` 确保亚秒精度不丢失，整数单位投放
5. **所有跨模块通信通过 EventBus** — 不直接调用 UI 方法
6. **getState() 返回深拷贝** — 修改返回值不影响内部状态
7. **加成 getter 默认返回 0** — 建筑 level <= 0 时所有 bonus 返回 0（getOfflineEfficiency 例外，返回 0.50）
8. **canUpgrade 不产生副作用** — 纯查询，不修改状态

## 已知限制

1. `getMaxBuildSlots()` 当前实现为简单的 `town_hall >= 5 ? 2 : 1`，[construction-worker-system.md](../product-specs/construction-worker-system.md) 规范了更完整的工人系统但尚未实现
2. 建造队列（`buildQueue`）在规范中已定义但未实现，`WORKER_CONFIG` 在 `BuildingData` 中已声明
3. 道路系统依赖 `TownWorld` 运行时数据（`_defaultPositions`、`_buildingSizes`），测试需 mock
4. `speedUpBuild` 设置 `buildEndTime = Date.now()` 而非直接触发完成，依赖下一个 `onTick` 处理
5. `getBuildingState` 返回内部对象直接引用（非拷贝），调用方修改返回值会腐蚀内部状态——未来可考虑改为返回拷贝
