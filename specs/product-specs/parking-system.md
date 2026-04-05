# 产品规范：停车场系统（Parking Lot System）

| 属性 | 值 |
|------|-----|
| **状态** | Active |
| **作者** | spec-architect |
| **创建日期** | 2026-04-05 |
| **关联文档** | [specs/system/core-contracts.md](../system/core-contracts.md) |
| **父级规范** | — |

---

## 1. 概述

停车场系统是城镇经济玩法。玩家在主城建造停车场（5×2 建筑，占 10 格），购买从驽马到黄金跑车的各级载具停入车位，被动产出金币收入。灵感来自 QQ 抢车位，三国古风与现代载具的错位混搭制造喜剧效果。

## 2. 参与者

| 参与者 | 描述 |
|--------|------|
| 玩家 | 建造停车场、购买载具、解锁车位、收集停车费 |
| ParkingManager | 管理车位状态、载具持有、收入计算 |
| TownManager | 停车场建筑的升级/放置/前置检查 |
| ResourceManager | 金币/玉石消耗与收入结算 |
| TownWorld | 停车场建筑在 Canvas 上的渲染 |

## 3. 范围

### 3.1 范围内

- 停车场建筑定义与城镇集成
- 10 级载具数据表（4 级古风坐骑 + 6 级现代交通工具）
- 车位解锁（初始 2 个，最多 10 个）
- 被动金币收入（每 tick 结算）
- 停车场建筑升级（5 级，提升收入倍率和解锁载具上限）
- 载具购买（金币 / 玉石）
- 主城地图扩展至 40×40
- ParkingPanel UI 浮层面板
- SVG 占位图资源（每级载具一张）

### 3.2 范围外

- 多人抢车位 PvP（v1 不做）
- 载具强化/改装系统
- 载具交易/拍卖
- 载具皮肤/外观自定义
- 载具对战斗属性的加成

## 4. 前提变更

### 4.1 主城地图扩展

| 变更项 | 变更前 | 变更后 |
|--------|--------|--------|
| `TownWorld.MAP_W` | 32 | 40 |
| `TownWorld.MAP_H` | 32 | 40 |
| 总格子数 | 1,024 | 1,600 |

> **扩展理由**：当前 32×32 地图已有 23 种建筑（最大 3×3=9 格），加上停车场（5×2=10 格）和装饰物，可用空间紧张。用户明确要求扩展地图以容纳停车场和未来新玩法。现有建筑 `_defaultPositions` 最大坐标为 `gx:23, gy:21`，全部在 32×32 范围内，扩展到 40×40 不会越界。

### 4.2 新增建筑

| 建筑 | ID | 尺寸 | 前置条件 | 默认位置 |
|------|----|------|---------|----------|
| 停车场 | `parking_lot` | w:5, h:2 | `town_hall` ≥ 4, `stable` ≥ 1 | `{ gx: 4, gy: 28 }` |

> **`requires` 语义约定**：`requires: { buildingId: N }` 表示"该建筑等级 ≥ N"，与 BuildingData 现有 `requires` 字段一致。

## 5. 数据表

### 5.1 载具数据表

| Tier | ID | 名称 | Emoji | 购买金币 | 购买玉石 | 金币/小时 | 解锁条件 | 主题 |
|------|----|------|-------|----------|----------|-----------|----------|------|
| 1 | `nag_horse` | 驽马 | 🐎 | 200 | 0 | 10 | 停车场 Lv.1 | 古风 |
| 2 | `fine_horse` | 良驹 | 🏇 | 1,000 | 0 | 30 | 停车场 Lv.1 | 古风 |
| 3 | `swift_horse` | 千里马 | 🐴 | 5,000 | 0 | 80 | 停车场 Lv.1 | 古风 |
| 4 | `red_hare` | 赤兔 | 🦄 | 25,000 | 5 | 200 | 停车场 Lv.1 | 古风 |
| 5 | `bicycle` | 自行车 | 🚲 | 100,000 | 0 | 500 | 停车场 Lv.2 | 穿越 |
| 6 | `motorcycle` | 摩托车 | 🏍 | 400,000 | 10 | 1,200 | 停车场 Lv.3 | 穿越 |
| 7 | `sedan` | 轿车 | 🚗 | 1,500,000 | 20 | 3,000 | 停车场 Lv.3 | 穿越 |
| 8 | `sports_car` | 跑车 | 🏎 | 5,000,000 | 50 | 7,000 | 停车场 Lv.4 | 穿越 |
| 9 | `supercar` | 超跑 | 🚀 | 20,000,000 | 100 | 15,000 | 停车场 Lv.5 | 穿越 |
| 10 | `golden_car` | 黄金跑车 | 👑 | 0 | 500 | 40,000 | 停车场 Lv.5 | 穿越 |

**ROI 参考**（不含建筑加成）:

| Tier | 总投入(金币等价) | 回本时间 |
|------|-----------------|---------|
| 1 驽马 | 200g | 20 小时 |
| 4 赤兔 | ~30,000g | ~150 小时 |
| 7 轿车 | ~1,700,000g | ~567 小时 |
| 10 黄金跑车 | 500j (纯玉石) | — |

> 高 Tier 载具的 ROI 更长，但绝对收益远高于低 Tier，激励玩家长期投入。黄金跑车为纯玉石付费载具，无金币 ROI 概念。

### 5.2 车位解锁费用表

| 车位编号 | 金币消耗 | 玉石消耗 | 累计金币 |
|----------|----------|----------|---------|
| 1 | 免费（初始） | 0 | 0 |
| 2 | 免费（初始） | 0 | 0 |
| 3 | 1,000 | 0 | 1,000 |
| 4 | 5,000 | 0 | 6,000 |
| 5 | 20,000 | 0 | 26,000 |
| 6 | 80,000 | 5 | 106,000 |
| 7 | 250,000 | 10 | 356,000 |
| 8 | 800,000 | 20 | 1,156,000 |
| 9 | 2,500,000 | 50 | 3,656,000 |
| 10 | 8,000,000 | 100 | 11,656,000 |

**实现方式**：使用查表法，以上表为权威数据源。

```javascript
var SLOT_COSTS = [
  null,                          // index 0 unused
  { gold: 0, jade: 0 },         // slot 1 (free)
  { gold: 0, jade: 0 },         // slot 2 (free)
  { gold: 1000, jade: 0 },      // slot 3
  { gold: 5000, jade: 0 },      // slot 4
  { gold: 20000, jade: 0 },     // slot 5
  { gold: 80000, jade: 5 },     // slot 6
  { gold: 250000, jade: 10 },   // slot 7
  { gold: 800000, jade: 20 },   // slot 8
  { gold: 2500000, jade: 50 },  // slot 9
  { gold: 8000000, jade: 100 }  // slot 10
];
```

### 5.3 停车场建筑等级表

| 等级 | 升级金币 | 升级木材 | 升级石材 | 升级铁矿 | 收入倍率 | 解锁载具 Tier |
|------|----------|----------|----------|----------|----------|--------------|
| 1 | 2,000 | 500 | 500 | 200 | 1.00× | 1–4 |
| 2 | 4,000 | 1,000 | 1,000 | 400 | 1.10× | 5 |
| 3 | 8,000 | 2,000 | 2,000 | 800 | 1.25× | 6–7 |
| 4 | 16,000 | 4,000 | 4,000 | 1,600 | 1.40× | 8 |
| 5 | 32,000 | 8,000 | 8,000 | 3,200 | 1.60× | 9–10 |

**升级费用公式**：

```
costFormula(lv) = {
  gold:  Math.floor(2000 * Math.pow(2, lv - 1)),
  wood:  Math.floor(500 * Math.pow(2, lv - 1)),
  stone: Math.floor(500 * Math.pow(2, lv - 1)),
  iron:  Math.floor(200 * Math.pow(2, lv - 1))
}
```

**收入倍率**：使用查表法，以上表为权威数据源。

```javascript
var INCOME_MULTIPLIERS = [0, 1.0, 1.1, 1.25, 1.40, 1.60];
// incomeMultiplier(lv) = INCOME_MULTIPLIERS[lv] || 1.0
```

## 6. 收入结算公式

每秒 tick 时结算停车费收入：

```
totalIncomePerSecond = sum(parkedVehicle.goldPerHour / 3600) × incomeMultiplier(buildingLevel)
```

- `parkedVehicle.goldPerHour`：见 §5.1 载具数据表
- `incomeMultiplier(buildingLevel)`：见 §5.3 建筑等级表
- 调用 `ResourceManager.add('gold', totalIncomePerSecond * dt)` 结算
- 收入跟随 `game:tick(dt)` 驱动

**满车位参考收入**（10 个相同载具，无建筑加成）：

| 全停驽马 | 全停赤兔 | 全停超跑 | 全停黄金跑车 |
|----------|----------|----------|-------------|
| 100g/hr | 2,000g/hr | 150,000g/hr | 400,000g/hr |

**Lv.5 停车场 + 10 辆黄金跑车**：400,000 × 1.60 = **640,000 金币/小时** — 终极挂机收入。

## 7. 能力

### CAP-PKG-01：建造停车场

**描述**：玩家在城镇放置并建造停车场建筑。

WHEN 玩家城主府 ≥ Lv.4 且马厩 ≥ Lv.1 且持有足够资源
AND 停车场尚未建造
THEN 消耗资源，停车场进入施工队列（复用 TownManager 施工流程）
AND 施工完成后 `parking_lot` 等级变为 1
AND 初始解锁 2 个车位（`slots[0]` 和 `slots[1]` 状态为 `empty`）
AND 发出 `town:building_upgraded` 事件

WHEN 城主府 < Lv.4 或马厩 < Lv.1
THEN 停车场建造按钮灰显，提示"需要城主府 Lv.4 和马厩 Lv.1"

WHEN 停车场已建造
THEN 不可重复建造，建造入口隐藏

### CAP-PKG-02：升级停车场

**描述**：升级停车场提升收入倍率并解锁更高级载具。

WHEN 停车场已建造且等级 < 5 且持有足够资源
THEN 消耗资源，进入施工队列
AND 完成后等级 +1，收入倍率按 §5.3 更新
AND 新载具 Tier 解锁（按 §5.3 解锁载具 Tier 列）
AND 发出 `town:building_upgraded` 事件

WHEN 停车场等级已达 5（最大等级）
THEN 升级按钮灰显，显示"已满级"

WHEN 停车场等级超过城主府等级上限
THEN 升级按钮灰显，提示"需要升级城主府"

### CAP-PKG-03：解锁车位

**描述**：玩家花费资源解锁新的停车位，最多 10 个。

WHEN 玩家已解锁 N 个车位（N < 10）且持有 slotCost(N+1) 所需金币和玉石
THEN 消耗资源，`slots[N]` 状态变为 `empty`
AND 发出 `parking:slot_unlocked` 事件 `{ slotIndex: N, totalSlots: N+1 }`
AND 显示 Toast "车位 {N+1} 已解锁！"

WHEN 玩家资源不足
THEN 解锁按钮灰显，显示缺少的资源数量（如"差 3,000 金，5 玉"）

WHEN 已解锁 10 个车位
THEN 解锁按钮隐藏，显示"全部车位已解锁"

### CAP-PKG-04：购买载具

**描述**：玩家花费金币/玉石购买载具，载具存入持有列表。

WHEN 玩家持有足够金币和玉石且载具 Tier ≤ 停车场等级解锁上限
THEN 消耗资源，载具加入 `_state.vehicles[]` 列表
AND 发出 `parking:vehicle_acquired` 事件 `{ vehicleId }`
AND 显示 Toast "{载具名称} 已入手！"

WHEN 载具 Tier 超过停车场等级解锁上限
THEN 该载具在购买列表中显示锁定状态，提示"需要停车场 Lv.{X}"

WHEN 金币或玉石不足
THEN 购买按钮灰显，显示差额

WHEN 玩家已拥有同一 Tier 的载具
THEN 仍可再次购买（同一载具可拥有多辆，停入不同车位）

### CAP-PKG-05：停入载具

**描述**：玩家将持有的载具停入空闲车位。

WHEN 玩家持有未停入的载具且存在状态为 `empty` 的车位
THEN 将载具停入该车位，车位状态变为 `occupied`，记录 `vehicleId`
AND 该载具开始计入每 tick 收入
AND 发出 `parking:vehicle_parked` 事件 `{ vehicleId, slotIndex }`

WHEN 所有已解锁车位均为 `occupied`
THEN 停入操作不可执行，提示"没有空闲车位"

WHEN 玩家没有未停入的载具
THEN 停入按钮灰显，提示"没有可用载具"

### CAP-PKG-06：取出载具

**描述**：玩家将已停入的载具取出，释放车位。

WHEN 玩家点击已停入载具的车位
THEN 载具回到持有列表（未停入状态），车位状态变为 `empty`
AND 该载具不再计入 tick 收入
AND 发出 `parking:vehicle_removed` 事件 `{ vehicleId, slotIndex }`

### CAP-PKG-07：被动收入结算

**描述**：每 tick 自动结算所有已停入载具的金币收入。使用 `_incomeAccum` 累加小数，积满 ≥ 1 时才调用 `ResourceManager.add()`，与 TownManager 的 `_productionAccum` 模式一致，避免浮点精度问题。

WHEN `game:tick(dt)` 触发且停车场已建造且至少有 1 辆载具停入
THEN 按 §6 公式计算 `incomePerSecond = sum(parkedVehicle.goldPerHour / 3600) × incomeMultiplier(buildingLevel)`
AND `_incomeAccum += incomePerSecond * dt`
AND 当 `_incomeAccum >= 1` 时，取整调用 `ResourceManager.add('gold', floor(_incomeAccum), 'production', 'parking_lot')` 并减去投放量
AND 发出 `parking:income_collected` 事件 `{ amount }`

WHEN 停车场已建造但无载具停入
THEN 不产生收入，不发出事件

WHEN 停车场尚未建造
THEN `ParkingManager.onTick()` 直接返回，无操作

### CAP-PKG-08：离线收入结算

**描述**：玩家离线期间停车场仍产出收入。

WHEN 玩家上线且 `SaveManager.load()` 包含停车场状态
AND 离线时间 `offlineDt = now - lastSavedTime`
THEN 按 §6 公式计算 `offlineIncome = totalIncomePerSecond × offlineDt`
AND 离线收入效率受 `adventure_guild` 建筑 `offlineEfficiency` 影响
AND 实际离线收入 = `offlineIncome × offlineEfficiency`（默认 0.50 无公会时）
AND 显示"离线期间停车场收入：{amount} 金币"

WHEN 离线时间 > 24 小时
THEN 最多结算 24 小时离线收入（`offlineDt` 上限 86,400 秒）

### CAP-PKG-09：出售载具

**描述**：玩家出售不需要的载具，回收部分资源。

WHEN 玩家选择出售一辆未停入的载具
THEN 确认对话框 "确定出售 {载具名称}？将获得 {售价} 金币"
AND 确认后从 `vehicles[]` 移除，获得 `售价 = 购买金币 × 0.5`（半价回收）
AND 纯玉石载具（黄金跑车）售出获得 `购买玉石 × 0.3` 玉石

WHEN 玩家选择出售一辆已停入的载具
THEN 提示"请先将载具取出"

### CAP-PKG-10：停车场面板 UI

**描述**：通过 BottomNav 或城镇点击停车场建筑打开面板。

WHEN 玩家点击停车场建筑或底部导航入口
THEN 打开 OverlayPanel，panelId = `'parking'`，height = `'full'`
AND 面板显示：
  - 顶部：停车场等级与收入倍率，实时收入显示："当前收入：{X} 金/小时"
  - 3 个标签页切换：
    - 标签页 1「🚗 车位」：10 个车位网格（面板中 2 列 × 5 行排列，与建筑地图尺寸 w:5 h:2 无关），已停入显示载具 emoji，空闲显示空位+可停入按钮，未解锁显示锁图标+解锁按钮
    - 标签页 2「🏪 商店」：可购买载具列表（含价格、每小时收入、锁定状态）
    - 标签页 3「🔧 车库」：已持有载具列表（可停入/取出/出售）

WHEN 停车场未建造
THEN 面板显示建造引导，而非车位网格

## 8. 事件定义

| 事件 | 载荷 | 说明 |
|------|------|------|
| `parking:slot_unlocked` | `{ slotIndex, totalSlots }` | 车位解锁 |
| `parking:vehicle_acquired` | `{ vehicleId }` | 购买载具 |
| `parking:vehicle_parked` | `{ vehicleId, slotIndex }` | 载具停入 |
| `parking:vehicle_removed` | `{ vehicleId, slotIndex }` | 载具取出 |
| `parking:income_collected` | `{ amount }` | 每 tick 收入结算 |

## 9. 状态结构

`ParkingManager.getState()` 返回的可序列化状态：

```javascript
{
  slots: [
    // 长度 = 已解锁车位数（初始 2，最多 10）
    { status: 'empty' | 'occupied', vehicleId: null | 'uid-xxx' }
  ],
  vehicles: [
    // 所有持有的载具
    { uid: 'uid-xxx', tierId: 'nag_horse', parkedAt: null | slotIndex }
  ],
  unlockedSlots: 2,          // 已解锁车位数
  totalIncomeEarned: 0,      // 累计停车费收入（统计用）
  lastTickTime: 1712345678   // 上次 tick 时间戳（离线结算用）
}
```

> 状态中**无函数、无循环引用**，符合 `Utils.deepClone()` JSON 序列化要求。

### 9.1 状态一致性契约

- `slots[]` 为 source of truth，`vehicles[].parkedAt` 为派生字段
- init 时执行一致性同步：遍历 `slots[]`，若 `slot.status === 'occupied'` 但对应 `vehicle.parkedAt` 不一致，则以 `slots[]` 为准修正 `vehicle.parkedAt`
- 若 `slots[].vehicleId` 引用的 vehicle 不存在，则将该 slot 重置为 `empty`

### 9.2 存档迁移

- 当 `saved.parking` 为 `undefined`（旧存档），ParkingManager 初始化为空状态：`{ slots: [], vehicles: [], unlockedSlots: 0, totalIncomeEarned: 0, lastTickTime: null }`
- 当停车场建筑建造完成后（`parking_lot` level ≥ 1），ParkingManager 初始化 2 个空车位
- TownManager 通过 `_getDefaultBuildings()` 自动为旧存档补齐 `parking_lot: { level: 0, buildEndTime: null }`

## 10. 模块注册

### 10.1 新增文件

| 文件路径 | 类型 | 说明 |
|----------|------|------|
| `js/data/parking.js` | 数据 | 载具数据表、车位费用表 |
| `js/modules/parking-manager.js` | 模块 | 停车场业务逻辑 |
| `js/ui/parking-panel.js` | UI | 停车场面板渲染 |
| `assets/img/vehicles/` | 资源 | 每级载具 SVG 占位图（10 张） |

### 10.2 index.html script 加载顺序

```
core → data(含 parking.js) → modules(含 parking-manager.js) → ui(含 parking-panel.js) → main.js
```

### 10.3 main.js 更新

- `getFullState()` 添加 `parking: ParkingManager.getState()`
- `initGame()` 添加 `ParkingManager.init(saved)`（内部提取 `saved.parking`，与现有 Manager 保持一致）
- `game:tick` 回调中添加 `ParkingManager.onTick(dt)`

### 10.4 BuildingData 注册

```javascript
parking_lot: {
  id: 'parking_lot',
  name: '停车场',
  emoji: '🅿️',
  category: 'functional',
  description: '停放载具收取停车费，被动产出金币',
  requires: { town_hall: 4, stable: 1 },
  maxLevel: 5,
  unlockOrder: 23,
  costFormula: function (lv) { /* 见 §5.3 */ },
  effects: function (lv) {
    var multipliers = [0, 1.0, 1.1, 1.25, 1.40, 1.60];
    var tierCaps = [0, 4, 5, 7, 8, 10];
    return {
      incomeMultiplier: multipliers[lv] || 1.0,
      maxVehicleTier: tierCaps[lv] || 4
    };
  }
}
```

### 10.5 TownWorld 注册

```javascript
_buildingSizes:    { parking_lot: { w: 5, h: 2 } }
_defaultPositions: { parking_lot: { gx: 4, gy: 28 } }
```

### 10.6 核心契约更新

在 `specs/system/core-contracts.md` 的跨模块只读查询列表中添加：

- `ParkingManager` → `TownManager.getBuildingLevel('parking_lot')` — 查询建筑等级
- `ParkingManager` → `TownManager.getOfflineEfficiency()` — 查询离线收益效率（探险公会建筑加成）

## 11. 非功能需求

| 项目 | 要求 |
|------|------|
| 状态持久化 | 通过 SaveManager，含时间戳，支持离线结算 |
| 最大车位数 | 10 |
| 最大载具持有数 | 50 辆（soft cap，可购买多辆同级载具） |
| tick 结算 | 每秒计算，使用 `_incomeAccum` 累加小数，积满 ≥ 1 时投放整数金币，与 TownManager `_productionAccum` 模式一致 |
| 离线收入上限 | 24 小时 |
| 建筑注册 | `parking_lot` 需加入 `TownManager._getDefaultBuildings()`、`TownWorld._buildingSizes` 和 `_defaultPositions` |
| SVG 资源 | 每级载具 1 张 SVG（10 张），尺寸统一 48×48px |

## 12. 不在范围内

- 多人抢车位 PvP 玩法（可能作为 v2 扩展）
- 载具改装/升星/强化
- 载具对战斗属性影响
- 载具交易/拍卖市场
- 停车场建筑装饰/外观自定义
- 载具限时活动/赛事

## 13. 交叉引用

- 资源系统：[ai-docs/06-resource-system.md](../../ai-docs/06-resource-system.md)
- 城镇系统：[ai-docs/13-town-system.md](../../ai-docs/13-town-system.md)
- 经济系统：[ai-docs/15-economy-system.md](../../ai-docs/15-economy-system.md)
- 核心契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 种菜系统（同类扩展参考）：[specs/product-specs/farming-system.md](farming-system.md)

## 14. 待解决问题

- [x] ~~地图从 32→40 是否影响现有建筑布局？~~ — 已验证，现有 `_defaultPositions` 最大坐标 gx:23/gy:21，全部在 40×40 范围内。
- [ ] 停车场是否应在 BottomNav“更多”菜单中独立入口，还是仅通过城镇画布点击进入？（建议：画布点击为主，更多菜单为辅）
- [ ] 黄金跑车是否应有其他获取途径（如深渊排行奖励）？
- [ ] 是否需要“停车费收集动画”（金币飘出效果）？
