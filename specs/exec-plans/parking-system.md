# 执行计划：停车场系统（Parking System）

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联规范** | [product-specs/parking-system.md](../product-specs/parking-system.md) |
| **创建** | 2026-04-05 |

---

## 目标

实现完整的停车场系统：扩展主城地图 32→40、新增停车场建筑、10 级载具数据表、车位解锁、载具购买/停入/取出/出售、被动金币收入结算（含离线）、停车场 UI 面板、BottomNav 入口。

## 前置条件

- [x] 产品规范 Active
- [ ] 无外部依赖（纯前端 + localStorage）

---

## 依赖关系图

```
阶段 1（数据层）
  ├── 1.1 载具/车位数据表 (js/data/parking.js)
  ├── 1.2 建筑数据注册 (js/data/buildings.js)
  └── 1.3 SVG 资源 (assets/img/)

阶段 2（基础设施）— 依赖 1.2
  ├── 2.1 TownManager 注册停车场 (js/modules/town-manager.js)
  └── 2.2 TownWorld 地图扩展 + 建筑渲染 (js/ui/town-world.js)

阶段 3（核心逻辑）— 依赖 1.1, 2.1
  └── 3.1 ParkingManager (js/modules/parking-manager.js)

阶段 4（UI）— 依赖 3.1
  ├── 4.1 ParkingPanel (js/ui/parking-panel.js)
  └── 4.2 BottomNav 入口 (js/ui/bottom-nav.js)

阶段 5（集成）— 依赖全部
  ├── 5.1 index.html script 注册
  ├── 5.2 main.js 集成
  └── 5.3 最终验证
```

**并行可能**：1.1 / 1.2 / 1.3 可并行；2.1 / 2.2 可并行；4.1 / 4.2 可并行。

---

## 阶段 1：数据层 + 资源

> 建立静态数据表和占位图资源，不涉及游戏逻辑。

### 任务 1.1 — 创建载具与车位数据表 `js/data/parking.js`

| 字段 | 值 |
|------|-----|
| **规范引用** | §5.1 载具数据表、§5.2 车位解锁费用表、§5.3 收入倍率 |
| **输入** | 规范 §5 全部数据表 |
| **输出** | `js/data/parking.js` — 全局 `ParkingData`、`SLOT_COSTS`、`INCOME_MULTIPLIERS` |
| **约束** | 全局变量，不用 class/import；ID 与规范 §5.1 一致 |
| **验证** | 1. 文件可被浏览器加载无报错 2. `Object.keys(ParkingData).length === 10` 3. `SLOT_COSTS.length === 11`（index 0 为 null） 4. `INCOME_MULTIPLIERS.length === 6`（index 0 为 0） 5. 每种载具含 `id/name/emoji/costGold/costJade/goldPerHour/requiredLevel/theme` |

数据结构：
```javascript
var ParkingData = {
  nag_horse: { id: 'nag_horse', name: '驽马', emoji: '🐎', tier: 1, costGold: 200, costJade: 0, goldPerHour: 10, requiredLevel: 1, theme: 'ancient' },
  // ... 共 10 种
};

var SLOT_COSTS = [
  null,                        // index 0 unused
  { gold: 0, jade: 0 },       // slot 1 (free)
  // ... 共 10 个 slot
];

var INCOME_MULTIPLIERS = [0, 1.0, 1.1, 1.25, 1.40, 1.60];
```

---

### 任务 1.2 — 注册停车场建筑数据 `js/data/buildings.js`

| 字段 | 值 |
|------|-----|
| **规范引用** | §4.2 新增建筑、§5.3 建筑等级表、§10.4 BuildingData 注册 |
| **输入** | 规范 §5.3 升级费用公式、§10.4 完整注册代码 |
| **输出** | `js/data/buildings.js` — 在 `BuildingData` 末尾添加 `parking_lot` 条目 |
| **约束** | `unlockOrder: 23` 不能与现有建筑冲突（当前最大为 `seed_shop` 的 22）；`costFormula` 使用规范 §5.3 的 `2000 * pow(2, lv-1)` 公式；`effects` 返回 `incomeMultiplier` 和 `maxVehicleTier` |
| **验证** | 1. `BuildingData.parking_lot` 存在 2. `BuildingData.parking_lot.requires` 为 `{ town_hall: 4, stable: 1 }` 3. `BuildingData.parking_lot.maxLevel === 5` 4. `costFormula(1)` 返回 `{ gold: 2000, wood: 500, stone: 500, iron: 200 }` 5. `effects(3)` 返回 `{ incomeMultiplier: 1.25, maxVehicleTier: 7 }` |

---

### 任务 1.3 — 创建 SVG 占位图资源

| 字段 | 值 |
|------|-----|
| **规范引用** | §11 非功能需求（SVG 资源）、§10.1 新增文件 |
| **输入** | 载具列表 10 种 + 建筑 1 种 |
| **输出** | `assets/img/vehicles/` 目录下 10 个 SVG 文件（`nag_horse.svg` 到 `golden_car.svg`）+ `assets/img/buildings/parking_lot.svg` |
| **约束** | 载具 SVG 尺寸 48×48px；建筑 SVG 比例适配 5×2 建筑格子（240×96px @48px/格）；用简单占位形状 + emoji 或文字标识即可 |
| **验证** | 1. 11 个 SVG 文件全部存在 2. 每个文件可在浏览器中正常渲染 3. 载具 SVG viewBox 为 `0 0 48 48` |

---

## 阶段 2：基础设施变更

> 修改现有城镇系统，让停车场建筑可被建造和渲染。

### 任务 2.1 — TownManager 注册停车场

| 字段 | 值 |
|------|-----|
| **规范引用** | §4.2 新增建筑、§9.2 存档迁移、§10.5 TownWorld 注册、CAP-PKG-01 |
| **输入** | `js/modules/town-manager.js` — `_getDefaultBuildings()` 方法 |
| **输出** | `_getDefaultBuildings()` 返回值中添加 `parking_lot: { level: 0, buildEndTime: null }` |
| **约束** | 放在 `seed_shop` 之后；旧存档无此字段时自动补齐为 level:0（现有合并逻辑已覆盖） |
| **验证** | 1. `TownManager._getDefaultBuildings().parking_lot` 存在 2. 新存档默认 `parking_lot.level === 0` 3. 旧存档加载不报错，`parking_lot` 自动补齐 |

---

### 任务 2.2 — TownWorld 地图扩展 + 建筑注册

| 字段 | 值 |
|------|-----|
| **规范引用** | §4.1 主城地图扩展、§10.5 TownWorld 注册 |
| **输入** | `js/ui/town-world.js` — `MAP_W`/`MAP_H`、`_buildingSizes`、`_defaultPositions` |
| **输出** | 修改 `MAP_W: 40`、`MAP_H: 40`；添加 `parking_lot` 到 `_buildingSizes` 和 `_defaultPositions` |
| **约束** | 现有建筑的 `_defaultPositions` 最大坐标为 gx:23/gy:21，全在 40×40 内不受影响；停车场默认位置 `{ gx: 4, gy: 28 }` |
| **验证** | 1. `TownWorld.MAP_W === 40 && TownWorld.MAP_H === 40` 2. `TownWorld._buildingSizes.parking_lot` 为 `{ w: 5, h: 2 }` 3. `TownWorld._defaultPositions.parking_lot` 为 `{ gx: 4, gy: 28 }` 4. 现有建筑渲染不受地图扩展影响（目视检查） |

---

## 阶段 3：核心逻辑

> 实现停车场业务逻辑 Manager。

### 任务 3.1 — 实现 ParkingManager `js/modules/parking-manager.js`

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-PKG-01~09 全部能力、§6 收入公式、§9 状态结构、§9.1 一致性契约、§9.2 存档迁移、§8 事件定义 |
| **输入** | 规范全文、`ParkingData`/`SLOT_COSTS`/`INCOME_MULTIPLIERS` 数据 |
| **输出** | `js/modules/parking-manager.js` — 全局 `ParkingManager` 单例对象 |
| **约束** | 全局单例，不用 class；通过 EventBus 通信；状态 JSON 可序列化；使用 `_incomeAccum` 累加模式 |

实现清单（按能力映射）：

#### 3.1a — init + 状态管理 (§9, §9.1, §9.2)

| 方法 | 说明 |
|------|------|
| `init(saved)` | 从 `saved.parking` 恢复或初始化空状态 |
| `getState()` | 返回 `Utils.deepClone(this._state)` |
| `_syncConsistency()` | init 后执行一致性同步（§9.1 契约） |

**验证**：
1. 无存档时 `getState()` 返回空状态 `{ slots: [], vehicles: [], unlockedSlots: 0, totalIncomeEarned: 0, lastTickTime: null }`
2. 有存档时正确恢复
3. 一致性同步：slot 引用不存在的 vehicle 时重置为 empty

#### 3.1b — 车位解锁 (CAP-PKG-03)

| 方法 | 说明 |
|------|------|
| `unlockSlot()` | 消耗资源解锁下一个车位 |
| `getNextSlotCost()` | 返回下一个车位的费用 |
| `canUnlockSlot()` | 检查是否可以解锁 |

**验证**：
1. WHEN 初始 2 车位，解锁第 3 个，消耗 1000 金/0 玉 → `unlockedSlots === 3`
2. WHEN 资源不足 → 返回 false，不扣资源
3. WHEN 已 10 车位 → 返回 false
4. 发出 `parking:slot_unlocked` 事件

#### 3.1c — 载具购买 (CAP-PKG-04)

| 方法 | 说明 |
|------|------|
| `buyVehicle(tierId)` | 消耗资源购买载具 |
| `canBuyVehicle(tierId)` | 检查是否可购买 |

**验证**：
1. WHEN 持有足够资源且 Tier ≤ 解锁上限 → 载具加入 `vehicles[]`，发出 `parking:vehicle_acquired`
2. WHEN Tier 超过解锁上限 → 返回 false
3. WHEN 资源不足 → 返回 false
4. WHEN 已拥有同 Tier → 仍可再次购买

#### 3.1d — 停入/取出载具 (CAP-PKG-05, CAP-PKG-06)

| 方法 | 说明 |
|------|------|
| `parkVehicle(vehicleUid, slotIndex)` | 将载具停入指定车位 |
| `removeVehicle(slotIndex)` | 从车位取出载具 |

**验证**：
1. WHEN 停入 → 车位 status='occupied'，vehicle.parkedAt 更新，发出 `parking:vehicle_parked`
2. WHEN 所有车位已满 → 返回 false
3. WHEN 取出 → 车位 status='empty'，vehicle.parkedAt=null，发出 `parking:vehicle_removed`

#### 3.1e — 出售载具 (CAP-PKG-09)

| 方法 | 说明 |
|------|------|
| `sellVehicle(vehicleUid)` | 出售未停入的载具 |
| `canSellVehicle(vehicleUid)` | 检查是否可出售 |

**验证**：
1. WHEN 出售未停入的普通载具 → 获得 `购买金币 × 0.5`，从 vehicles[] 移除
2. WHEN 出售黄金跑车 → 获得 `500 × 0.3 = 150` 玉石
3. WHEN 载具已停入 → 返回 false（需先取出）

#### 3.1f — 被动收入结算 (CAP-PKG-07)

| 方法 | 说明 |
|------|------|
| `onTick(dt)` | 每 tick 结算停车收入 |

**验证**：
1. WHEN 有停入载具 → 按公式 `sum(goldPerHour/3600) × incomeMultiplier × dt` 累加
2. WHEN `_incomeAccum >= 1` → 调用 `ResourceManager.add('gold', floor, 'production', 'parking_lot')`，发出 `parking:income_collected`
3. WHEN 无停入载具 → 不产生收入
4. WHEN 停车场未建造 → `onTick` 直接返回

#### 3.1g — 离线收入 (CAP-PKG-08)

| 方法 | 说明 |
|------|------|
| `calcOfflineIncome(offlineDt)` | 计算离线收入 |

**验证**：
1. WHEN 上线后 `offlineDt > 0` → 按公式计算离线收入
2. WHEN 离线 > 24 小时 → 上限 86400 秒
3. WHEN 有 adventure_guild 建筑 → 收入乘以 `offlineEfficiency`

---

## 阶段 4：UI 层

> 实现面板渲染和导航入口。

### 任务 4.1 — 实现 ParkingPanel `js/ui/parking-panel.js`

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-PKG-10 停车场面板 UI |
| **输入** | ParkingManager API、ParkingData、OverlayPanel API |
| **输出** | `js/ui/parking-panel.js` — 全局 `ParkingPanel` 单例对象 |
| **约束** | 通过 `OverlayPanel.show()` 打开，`panelId: 'parking'`，`height: 'full'`；使用 CSS 变量；中文 UI |

面板结构（按规范 CAP-PKG-10）：
- **顶部**：停车场等级徽章 + 收入倍率 + 实时收入显示（X 金/小时）
- **中部**：10 车位网格（2 列 × 5 行），已停入显示载具 emoji，空闲显示空位按钮，未解锁显示 🔒 + 解锁按钮
- **底部标签页 1**：「载具商店」— 可购买载具列表（价格、金/小时、锁定状态）
- **底部标签页 2**：「我的车库」— 已持有载具列表（停入/取出/出售按钮）

交互：
- 点击空车位 → 弹出车库选择停入
- 点击已停入车位 → 确认取出
- 点击解锁按钮 → 消耗资源解锁
- 商店中购买 → 消耗资源获得载具
- 车库中出售 → Modal 确认后出售

事件监听：
- `parking:slot_unlocked` / `parking:vehicle_acquired` / `parking:vehicle_parked` / `parking:vehicle_removed` / `parking:income_collected` → 重新渲染
- `town:building_upgraded` → 检查是否为 `parking_lot`，重新渲染

**验证**：
1. WHEN 停车场未建造 → 面板显示建造引导
2. WHEN 停车场已建造 → 显示车位网格 + 商店 + 车库
3. WHEN 车位已满 → 空车位标记不可停入
4. WHEN 载具 Tier 超限 → 商店中显示锁定
5. WHEN 资源不足 → 按钮灰显 + 差额提示
6. 实时收入数字与 ParkingManager 计算一致

---

### 任务 4.2 — BottomNav 添加停车场入口

| 字段 | 值 |
|------|-----|
| **规范引用** | §14 待解决问题（BottomNav 入口建议） |
| **输入** | `js/ui/bottom-nav.js` — `_moreItems` 数组 |
| **输出** | 在 `_moreItems` 中 `farm` 之后添加 `{ id: 'parking', icon: '🅿️', label: '停车' }` |
| **约束** | 需同时在 `_onMoreItemClick` 或等效处理中添加对 `parking` id 的路由 |
| **验证** | 1. 更多菜单中出现"🅿️ 停车"按钮 2. 点击打开 ParkingPanel |

---

## 阶段 5：集成 + 注册

> 将所有新文件注册到入口，确保完整运行。

### 任务 5.1 — index.html script 标签注册

| 字段 | 值 |
|------|-----|
| **规范引用** | §10.2 script 加载顺序 |
| **输入** | `index.html` |
| **输出** | 添加 3 个 script 标签（按层级顺序） |
| **约束** | 顺序：`js/data/crops.js` 之后加 `js/data/parking.js`；`js/modules/farm-manager.js` 之后加 `js/modules/parking-manager.js`；`js/ui/farm-panel.js` 之后加 `js/ui/parking-panel.js`（保持 data→modules→ui 层级） |

具体插入位置：
```html
<!-- Data 层：crops.js 之后 -->
<script src="js/data/parking.js"></script>

<!-- Modules 层：farm-manager.js 之后 -->
<script src="js/modules/parking-manager.js"></script>

<!-- UI 层：farm-panel.js 之后 -->
<script src="js/ui/parking-panel.js"></script>
```

**验证**：
1. 浏览器加载无 script 顺序错误
2. `ParkingData`、`ParkingManager`、`ParkingPanel` 均可在控制台访问

---

### 任务 5.2 — main.js 集成

| 字段 | 值 |
|------|-----|
| **规范引用** | §10.3 main.js 更新 |
| **输入** | `js/main.js` — `getFullState()`、`initGame()` |
| **输出** | 3 处修改 |
| **约束** | ParkingManager 在 FarmManager 之后初始化；onTick 在 FarmManager 之后调用 |

修改点：
1. `getFullState()` 添加 `parking: ParkingManager.getState()`
2. `initGame()` 添加 `ParkingManager.init(saved)` + `ParkingPanel.init()`
3. `game:tick` 回调添加 `ParkingManager.onTick(dt)`

**验证**：
1. 存档保存包含 `parking` 字段
2. 游戏启动无报错
3. 每 tick ParkingManager.onTick 被调用
4. ParkingPanel 正常初始化

---

### 任务 5.3 — 最终集成验证

| 字段 | 值 |
|------|-----|
| **规范引用** | 全规范 WHEN/THEN 覆盖 |
| **输入** | 完整游戏运行 |
| **输出** | 验证清单通过 |
| **约束** | 需在浏览器中实际操作验证 |

---

## 最终验证清单

### 建筑系统 (CAP-PKG-01, CAP-PKG-02)
- [ ] 城主府 ≥ Lv.4 + 马厩 ≥ Lv.1 → 可建造停车场
- [ ] 城主府 < Lv.4 或马厩 < Lv.1 → 建造按钮灰显 + 提示
- [ ] 停车场已建造 → 不可重复建造
- [ ] 停车场可升级至 Lv.5，升级后收入倍率正确
- [ ] 满级后升级按钮灰显 + "已满级"

### 车位 (CAP-PKG-03)
- [ ] 建造完成后初始 2 个车位
- [ ] 解锁第 3 个车位消耗 1000 金
- [ ] 解锁第 6 个车位消耗 80000 金 + 5 玉
- [ ] 10 个全解锁后按钮隐藏 + "全部车位已解锁"
- [ ] 资源不足时灰显 + 差额提示

### 载具 (CAP-PKG-04, CAP-PKG-05, CAP-PKG-06, CAP-PKG-09)
- [ ] 购买驽马消耗 200 金 → 出现在车库
- [ ] 赤兔消耗 25000 金 + 5 玉
- [ ] Tier 超过建筑等级解锁上限 → 锁定状态
- [ ] 同 Tier 可重复购买
- [ ] 停入空车位 → 车位显示载具 emoji
- [ ] 取出已停入载具 → 车位变空
- [ ] 出售未停入载具 → 半价回收（金币载具）或 30% 回收（玉石载具）
- [ ] 出售已停入载具 → 提示"请先取出"

### 收入 (CAP-PKG-07, CAP-PKG-08)
- [ ] 停入驽马后每小时收入 10 金（Lv.1 无加成）
- [ ] Lv.3 停车场 + 驽马 → 每小时 10 × 1.25 = 12.5 金
- [ ] 无载具时无收入
- [ ] 未建造时 onTick 无操作
- [ ] 离线收入上限 24 小时
- [ ] 离线收入受 adventure_guild 的 offlineEfficiency 影响

### UI (CAP-PKG-10)
- [ ] 通过城镇画布点击停车场 → 打开面板
- [ ] 通过 BottomNav 更多 → 🅿️停车 → 打开面板
- [ ] 面板显示车位网格（2×5）
- [ ] 商店标签页显示 10 种载具 + 价格 + 金/小时
- [ ] 车库标签页显示持有载具 + 操作按钮
- [ ] 停车场未建造时面板显示建造引导

### 存档 (§9.2)
- [ ] 新存档无 parking 字段 → 初始化空状态
- [ ] 存档保存后刷新 → 状态完整恢复
- [ ] 一致性同步：孤立 slot 引用自动修复

### 地图 (§4.1)
- [ ] 地图扩展到 40×40
- [ ] 现有建筑位置不受影响
- [ ] 停车场建筑在 gx:4 gy:28 正确渲染（5×2 大小）
