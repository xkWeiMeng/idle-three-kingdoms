# 产品规范：装备栏逻辑优化（Equipment Inventory Optimization）

| 属性 | 值 |
|------|-----|
| **状态** | Active |
| **作者** | spec-architect |
| **创建日期** | 2026-04-06 |
| **关联服务规范** | [EquipmentManager](../services/equipment-manager.md)（Active） |
| **关联系统规范** | [核心契约](../system/core-contracts.md) |
| **父级规范** | — |

---

## 1. 概述

对现有 EquipmentManager 和 EquipmentPanel 的增量优化，包含 5 项改进：

1. **扩展默认背包容量**：从 50 翻倍至 100
2. **金币扩容**：花费金币额外扩展背包，最多增加 90 格（总上限 190）
3. **按品级排序**：一键按品质降序排列背包
4. **按品级一键售卖**：批量出售指定品质及以下的非神话未穿戴装备
5. **内联操作按钮**：装备/强化/出售按钮直接显示在卡片下方，移除底部详情面板

---

## 2. 数据模型变更

### 2.1 持久化状态扩展

| 字段 | 变更前 | 变更后 | 说明 |
|------|--------|--------|------|
| `maxSlots` | 默认 `50` | 默认 `100` | 新存档默认值翻倍 |
| `expandedSlots` | 不存在 | `number`，默认 `0` | 已通过金币扩展的格子数，最大 `90` |
| **有效背包上限** | `maxSlots`（固定 50） | `maxSlots + expandedSlots`（100 + 0~90 = 100~190） | 运算时使用有效值 |

> 存档兼容：旧存档 `maxSlots = 50` 的玩家加载后维持 50 不变（不强制升到 100）。`expandedSlots` 缺失时视为 `0`。

### 2.2 新增常量（建议放入 `js/data/equipment.js` 或 `constants.js`）

```javascript
const INVENTORY_DEFAULTS = {
  BASE_SLOTS: 100,           // 新存档默认背包容量
  MAX_EXPAND: 90,            // 金币最大可扩展格数
  EXPAND_STEP: 10,           // 每次扩展增加格数
  EXPAND_BASE_COST: 1000,    // 首次扩展费用（金币）
  EXPAND_COST_MULTIPLIER: 1.5 // 每次扩展费用递增系数
};
```

### 2.3 扩展费用公式

第 `n` 次扩展（n 从 0 开始，0 = 第一次扩展）的费用：

$$\text{cost}(n) = \lfloor \text{EXPAND\_BASE\_COST} \times \text{EXPAND\_COST\_MULTIPLIER}^n \rfloor$$

| 扩展次数 | 已扩展格数 | 本次费用 | 累计费用 |
|----------|-----------|---------|---------|
| 第 1 次 | 0 → 10 | 1,000 | 1,000 |
| 第 2 次 | 10 → 20 | 1,500 | 2,500 |
| 第 3 次 | 20 → 30 | 2,250 | 4,750 |
| 第 4 次 | 30 → 40 | 3,375 | 8,125 |
| 第 5 次 | 40 → 50 | 5,062 | 13,187 |
| 第 6 次 | 50 → 60 | 7,593 | 20,780 |
| 第 7 次 | 60 → 70 | 11,390 | 32,170 |
| 第 8 次 | 70 → 80 | 17,085 | 49,255 |
| 第 9 次 | 80 → 90 | 25,628 | 74,883 |

---

## 3. 能力

### CAP-INV-01：扩展默认背包容量

**描述**：新存档的默认背包容量从 50 提升到 100。

**变更点**：
- `EquipmentManager._maxSlots` 初始值：`50` → `100`
- 所有硬编码的 `50` 上限检查改为读取 `_maxSlots`（服务规范中已定义为动态值）

**验收场景**：

```
WHEN 新玩家首次进入游戏
AND 无存档数据
THEN EquipmentManager._maxSlots === 100
AND 背包可容纳 100 件装备

WHEN 老玩家加载已有存档
AND 存档中 maxSlots === 50
THEN EquipmentManager._maxSlots === 50（保持存档值不变）
AND 背包容量维持 50

WHEN 老玩家加载已有存档
AND 存档中 maxSlots === 50, expandedSlots === 20
THEN 有效背包上限 === 50 + 20 === 70
```

---

### CAP-INV-02：金币扩容背包

**描述**：玩家可花费金币扩展背包容量。每次扩展 +10 格，费用递增，最多扩展 90 格。

**新增接口**：
- `expandInventory()` → `boolean` — 执行一次扩容
- `getExpandCost()` → `number` — 返回下次扩容所需金币
- `getExpandInfo()` → `{ expandedSlots, maxExpand, nextCost, canExpand }` — 返回扩容状态信息

**行为规则**：
1. 计算 `n = expandedSlots / EXPAND_STEP`（已扩展次数）。
2. 若 `expandedSlots >= MAX_EXPAND`（90）→ emit `toast:show warning '背包已达最大容量！'`，返回 `false`。
3. 计算费用 `cost = floor(EXPAND_BASE_COST × EXPAND_COST_MULTIPLIER^n)`。
4. 若 `ResourceManager.canAfford('gold', cost)` 为 `false` → emit `toast:show warning '金币不足！需要💰×{cost}'`，返回 `false`。
5. 调用 `ResourceManager.spend('gold', cost)`。
6. `expandedSlots += EXPAND_STEP`。
7. emit `toast:show success '背包扩容成功！当前容量：{maxSlots + expandedSlots}'`。
8. 返回 `true`。

**有效背包上限计算**：新增辅助方法 `getMaxCapacity()` → `number`，返回 `_maxSlots + _expandedSlots`。所有使用 `_maxSlots` 做上限判断的地方，改为调用 `getMaxCapacity()`。具体影响：
- `generateDrop()` 中的满包检查
- `addToInventory()` 中的满包检查
- `claimOverflow()` 中的循环条件
- `MerchantManager` 中购买装备的满包检查（第 143、194 行直接访问 `EquipmentManager._maxSlots`，改为调用 `EquipmentManager.getMaxCapacity()`）
- UI 显示的容量文本（含 `equipment-panel.js` 第 53 行硬编码 `var maxSlots = 50`）

**持久化**：`getState()` 返回值增加 `expandedSlots` 字段；`init(saved)` 读取 `saved.expandedSlots || 0`。

**验收场景**：

```
WHEN expandInventory()
AND expandedSlots === 0（首次扩容）
AND ResourceManager.canAfford('gold', 1000) 为 true
THEN ResourceManager.spend('gold', 1000)
AND expandedSlots === 10
AND 有效背包上限 === maxSlots + 10
AND emit toast:show success '背包扩容成功！当前容量：{maxSlots + 10}'
AND 返回 true

WHEN expandInventory()
AND expandedSlots === 30（已扩容 3 次，n=3）
AND 费用 = floor(1000 × 1.5^3) = floor(3375) = 3375
AND ResourceManager.canAfford('gold', 3375) 为 true
THEN ResourceManager.spend('gold', 3375)
AND expandedSlots === 40
AND 返回 true

WHEN expandInventory()
AND expandedSlots === 90（已达上限）
THEN emit toast:show warning '背包已达最大容量！'
AND expandedSlots 保持 90
AND 返回 false

WHEN expandInventory()
AND ResourceManager.canAfford('gold', cost) 为 false
THEN emit toast:show warning '金币不足！需要💰×{cost}'
AND expandedSlots 不变
AND 返回 false

WHEN getExpandInfo()
AND expandedSlots === 20, maxSlots === 100
THEN 返回 { expandedSlots: 20, maxExpand: 90, nextCost: 2250, canExpand: true }

WHEN getExpandInfo()
AND expandedSlots === 90
THEN 返回 { expandedSlots: 90, maxExpand: 90, nextCost: 0, canExpand: false }
```

**`getExpandCost()` 行为规则**：
1. 计算 `n = _expandedSlots / EXPAND_STEP`。
2. 若 `_expandedSlots >= MAX_EXPAND`（90）→ 返回 `0`（表示无法继续扩展）。
3. 否则返回 `Math.floor(EXPAND_BASE_COST × EXPAND_COST_MULTIPLIER^n)`。

```
WHEN getExpandCost()
AND expandedSlots === 0
THEN 返回 1000

WHEN getExpandCost()
AND expandedSlots === 30（n=3）
THEN 返回 floor(1000 × 1.5^3) === 3375

WHEN getExpandCost()
AND expandedSlots === 90（已达上限）
THEN 返回 0
```

**UI 呈现**：
- 在背包面板标题栏旁显示容量文本：`{当前数量}/{有效上限}`
- 在背包面板底部或标题栏旁增加"扩容"按钮
- 按钮显示下次扩容费用；已达上限时按钮灰显并显示"已满"
- 点击按钮弹出确认对话框（Modal）：`确定花费 💰×{cost} 扩展背包 +10 格？`

---

### CAP-INV-03：按品级一键排序

**描述**：在背包面板添加排序按钮，按品质降序排列；同品质按强化等级降序；同级按 UID 字典序（保持稳定排序）。

**新增接口**：
- `sortInventory()` → `void` — 对 `_inventory` 原地排序

**排序规则**（优先级从高到低）：
1. `quality` 降序（品质高的排前面）
2. `level` 降序（强化等级高的排前面）
3. `uid` 升序（字典序，确保排序稳定）

**行为规则**：
1. 对 `_inventory` 调用 `Array.prototype.sort()` 原地排序。
2. 排序不改变任何装备的属性，仅改变数组顺序。
3. 排序后发出 `equip:inventory_changed` 事件（无载荷）通知 UI 刷新背包网格。此为新增事件，专用于背包整体变化（排序、批量售卖等），不影响现有 `equip:changed` 契约。
4. emit `toast:show info '背包已排序'`。

**验收场景**：

```
WHEN sortInventory()
AND _inventory = [
  { uid: 'a', quality: 1, level: 0 },
  { uid: 'b', quality: 3, level: 5 },
  { uid: 'c', quality: 3, level: 10 },
  { uid: 'd', quality: 5, level: 0 }
]
THEN _inventory 顺序变为 [d, c, b, a]
AND 排序规则：quality 5 > 3 > 1；同 quality=3 时 level 10 > 5

WHEN sortInventory()
AND _inventory = [
  { uid: 'x', quality: 2, level: 3 },
  { uid: 'y', quality: 2, level: 3 }
]
THEN 排序后顺序为 [x, y]（uid 字典序：'x' < 'y'）

WHEN sortInventory()
AND _inventory 为空（length === 0）
THEN _inventory 保持空数组
AND emit toast:show info '背包已排序'
```

**UI 呈现**：
- 在背包面板工具栏添加"排序"按钮（图标或文字 `🔃 排序`）
- 点击后立即排序并刷新背包网格，无需确认

---

### CAP-INV-04：按品级一键售卖

**描述**：批量出售所有未穿戴且品质 ≤ 所选阈值的非神话装备。

**新增接口**：
- `batchSell(maxQuality)` → `{ sold: number, earned: number }` — 批量出售，返回售出数量和获得金币总额

**前置条件**：
- `maxQuality` 必须为 1–5 的整数。非此范围（包括 `undefined`、`NaN`、负数、`0`、`> 5`）→ 直接返回 `{ sold: 0, earned: 0 }`，不发出任何事件。

**行为规则**：
1. 输入验证：若 `maxQuality` 不是 1–5 整数 → 返回 `{ sold: 0, earned: 0 }`。
2. 筛选 `_inventory` 中满足以下**全部**条件的装备：
   - `equip.quality <= maxQuality`
   - `equip.equippedBy === null`（未穿戴）
   - `equip.unsellable !== true`（非不可出售）
3. 对筛选出的每件装备执行出售：
   - 计算价格 `price = EquipSellPrice[equip.quality] || 0`
   - 累加总金币
4. 批量从 `_inventory` 中移除这些装备（一次性 filter，避免逐个 splice 的性能问题）。
5. 调用 `ResourceManager.add('gold', totalGold)` 一次性增加所有金币。
6. 若 `sold === 0` → emit `toast:show info '没有可出售的装备'`。
7. 若 `sold > 0` → emit `toast:show success '批量出售 {sold} 件装备，获得💰×{totalGold}'`，并发出 `equip:inventory_changed` 事件通知 UI 刷新。
8. 返回 `{ sold, earned: totalGold }`。

**验收场景**：

```
WHEN batchSell(2)（出售品质 ≤ 2 的装备）
AND _inventory 包含:
  - { uid: 'a', quality: 1, equippedBy: null } → 出售，得 50
  - { uid: 'b', quality: 2, equippedBy: null } → 出售，得 100
  - { uid: 'c', quality: 3, equippedBy: null } → 品质 > 2，保留
  - { uid: 'd', quality: 1, equippedBy: 'hero1' } → 已穿戴，保留
  - { uid: 'e', quality: 6, unsellable: true } → 神话，保留
THEN 返回 { sold: 2, earned: 150 }
AND ResourceManager.add('gold', 150) 被调用一次
AND _inventory 仅剩 [c, d, e]
AND emit toast:show success '批量出售 2 件装备，获得💰×150'

WHEN batchSell(1)
AND _inventory 中无品质 ≤ 1 且未穿戴的装备
THEN 返回 { sold: 0, earned: 0 }
AND emit toast:show info '没有可出售的装备'
AND _inventory 不变

WHEN batchSell(5)（出售品质 ≤ 5，即所有非神话）
AND _inventory 包含 10 件未穿戴非神话装备 + 2 件神话装备 + 3 件已穿戴装备
THEN 出售 10 件，保留 5 件（2 神话 + 3 已穿戴）
AND 返回 { sold: 10, earned: 对应价格之和 }

WHEN batchSell(undefined)（非法输入）
THEN 返回 { sold: 0, earned: 0 }
AND 不发出任何事件
AND _inventory 不变

WHEN batchSell(3)
AND _inventory 中所有装备均已穿戴（equippedBy !== null）
THEN 返回 { sold: 0, earned: 0 }
AND emit toast:show info '没有可出售的装备'
AND _inventory 不变
```

**UI 呈现**：
- 在背包面板工具栏添加"一键售卖"按钮（`🗑️ 售卖`）
- 点击后弹出 Modal 对话框，内含品质选择器：
  - 选项：`白色（普通）`、`绿色（精良）`、`蓝色（稀有）`、`紫色（史诗）`、`橙色（传说）`
  - 每个选项旁显示对应的可售数量和预估金币
- 选择品质阈值后点击"确认出售"执行 `batchSell(selectedQuality)`
- 确认文案：`确定出售所有品质 ≤ {品质名} 的未穿戴装备？共 {count} 件，预计获得 💰×{gold}`

---

### CAP-INV-05：内联操作按钮（移除底部详情面板）

**描述**：点击背包中的装备卡片时，操作按钮（装备/强化/出售）直接展开在该卡片下方，替代现有的底部详情面板模式。

**交互规则**：

1. **点击装备卡片**：
   - 若该卡片未展开 → 展开该卡片的内联操作区域，收起其他已展开的卡片。
   - 若该卡片已展开 → 收起该卡片的内联操作区域。
   - 同一时间最多只有一个卡片处于展开状态。

2. **内联操作区域内容**：
   - 装备属性摘要（名称、品质、类型、当前属性值、强化等级）
   - 操作按钮行：
     - **装备**：显示"装备到…"，点击后弹出武将选择列表。已穿戴时显示"卸下"。
     - **强化**：显示"强化 💰×{cost}"，点击直接执行强化。已满级时灰显。
     - **出售**：显示"出售 💰+{price}"，点击执行出售。神话装备不显示此按钮。

3. **移除 `_renderDetail()` 底部面板**：
   - 删除 `EquipmentPanel._renderDetail()` 方法的调用。
   - 删除底部详情面板对应的 HTML 区域。
   - `_selectedEquip` 字段语义保持不变（记录当前展开的装备 UID）。

**验收场景**：

```
WHEN 玩家点击背包中品质 3 的未穿戴装备卡片
AND 该卡片未展开
THEN 该卡片下方展开内联操作区域
AND 显示装备名称、品质颜色、属性值（如 ATK: 25）、强化等级
AND 显示三个操作按钮：[装备到…] [强化 💰×450] [出售 💰+150]
AND 其他已展开的卡片收起

WHEN 玩家点击已展开的装备卡片
THEN 该卡片的内联操作区域收起
AND _selectedEquip === null

WHEN 玩家点击品质 6（神话）装备的卡片
THEN 内联操作区域显示
AND 操作按钮为：[装备到…] [强化 💰×{cost}]
AND 不显示"出售"按钮（unsellable === true）

WHEN 玩家点击内联区域的"装备到…"按钮
THEN 弹出武将选择列表（复用现有的武将选择逻辑）
AND 选择武将后执行 EquipmentManager.equip(uid, heroUid)

WHEN 玩家点击内联区域的"卸下"按钮
AND 装备 equippedBy !== null
THEN 执行 EquipmentManager.unequip(uid, heroUid)
AND 按钮文本变回"装备到…"

WHEN 玩家点击内联区域的"强化"按钮
THEN 执行 EquipmentManager.reinforce(uid)
AND 成功后内联区域刷新显示新等级和新费用

WHEN 玩家点击内联区域的"出售"按钮
THEN 执行 EquipmentManager.sell(uid)
AND 卡片从背包网格中移除
AND 内联操作区域消失

WHEN 背包网格重新渲染（如排序、批量售卖后）
THEN 所有内联操作区域收起
AND _selectedEquip === null
```

**UI 布局**：
- 背包仍为 3 列网格布局
- 内联操作区域展开时，占据该卡片下方的一整行（3 列宽度），将后续卡片下推
- 内联区域背景色使用 `var(--color-surface)` + 细边框
- 操作按钮使用 `.btn` 样式，水平排列，间距 8px

---

## 4. UI 总体布局变更

### 4.1 背包面板工具栏（新增）

在背包网格上方添加工具栏，包含：

| 元素 | 位置 | 说明 |
|------|------|------|
| 容量文本 | 左侧 | `{当前数量}/{有效上限}`，如 `45/100` |
| 扩容按钮 | 容量文本旁 | `+10 💰{cost}`，达上限时 `已满` |
| 排序按钮 | 右侧 | `🔃 排序` |
| 一键售卖按钮 | 右侧 | `🗑️ 售卖` |

### 4.2 移除的 UI 元素

| 元素 | 说明 |
|------|------|
| 底部详情面板 | 原由 `_renderDetail()` 渲染，替换为 CAP-INV-05 的内联操作 |

---

## 5. 事件变更

### 新增事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `equip:inventory_changed` | 无 | 背包整体变化（排序、批量售卖），触发 UI 重新渲染背包网格 |

### 已有事件（继续使用）

- `equip:changed` — 单件装备穿戴/卸下时触发（载荷 `{ hero, equipment }` 不变）
- `toast:show` — 操作反馈
- `resource:changed` — 金币变动（由 ResourceManager 发出）

> **设计决策**：新增 `equip:inventory_changed` 而非扩展 `equip:changed` 载荷，因为现有 `equip:changed` 的载荷定义为 `{hero, equipment}` 均非 null（见核心契约），扩展为可空会破坏现有消费者的类型假设。

---

## 6. 存档兼容性

| 场景 | 处理方式 |
|------|---------|
| 旧存档无 `expandedSlots` | `init()` 中默认为 `0` |
| 旧存档 `maxSlots === 50` | 保持 `50` 不变，玩家可通过金币扩容 |
| 新存档 | `maxSlots = 100`，`expandedSlots = 0` |

---

## 7. 约束与注意事项

1. **不修改服务规范**：本产品规范定义需求，服务规范在实现后由 drift-detector 更新。
2. **神话装备安全**：`batchSell` 严格过滤 `unsellable !== true`，永不触及神话装备。
3. **已穿戴装备安全**：`batchSell` 严格过滤 `equippedBy === null`，不自动卸下已穿戴装备。
4. **排序稳定性**：使用三级排序键（quality → level → uid）确保排序结果确定性。
5. **性能**：`batchSell` 使用 `filter` 一次性移除而非循环 `splice`，避免 O(n²)。
6. **费用公式不取整方式**：扩容费用使用 `Math.floor()`，与强化费用公式保持一致。

---

## 8. 交叉引用

- [EquipmentManager 服务规范](../services/equipment-manager.md) — 现有能力定义和数据模型
- [核心契约](../system/core-contracts.md) — 资源枚举、品质等级、事件协议
- [MerchantManager](../services/) — 满包检查需同步修改为 `getMaxCapacity()`

## 9. 核心契约变更清单

实现时需同步更新 [核心契约](../system/core-contracts.md)：

1. **事件表**：新增 `equip:inventory_changed`（无载荷）— 背包整体变化
2. **跨模块写操作**：EquipmentManager 行增加 `ResourceManager.add()` — "出售收入"（用于 `batchSell`）
3. **MerchantManager**：将直接访问 `EquipmentManager._maxSlots` 改为调用 `EquipmentManager.getMaxCapacity()`
