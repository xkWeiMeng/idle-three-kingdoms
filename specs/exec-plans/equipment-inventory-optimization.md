# 执行计划：装备栏逻辑优化（Equipment Inventory Optimization）

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联产品规范** | [specs/product-specs/equipment-inventory-optimization.md](../product-specs/equipment-inventory-optimization.md) |
| **关联服务规范** | [specs/services/equipment-manager.md](../services/equipment-manager.md) |
| **系统契约** | [specs/system/core-contracts.md](../system/core-contracts.md) |
| **创建** | 2026-04-06 |

---

## 概览

将产品规范的 5 个能力（CAP-INV-01 ~ 05）拆解为 3 个阶段、10 个任务。

- **Phase 1**：Manager 层逻辑（数据常量、EquipmentManager 新接口、MerchantManager 适配）
- **Phase 2**：UI 层（工具栏、内联操作按钮、移除底部详情面板）
- **Phase 3**：集成与契约（核心契约更新、最终验证）

---

## 依赖关系图

```
T1.1（INVENTORY_DEFAULTS 常量）
  │
  ├──▶ T1.2（CAP-INV-01 + 02：默认容量 + 扩容 + getMaxCapacity）
  │       │
  │       ├──▶ T1.3（CAP-INV-03：sortInventory）
  │       │
  │       ├──▶ T1.4（CAP-INV-04：batchSell）
  │       │
  │       └──▶ T1.5（MerchantManager _maxSlots → getMaxCapacity）
  │
  ├──▶ T2.1（背包面板工具栏 + 容量显示）── 依赖 T1.2
  │       │
  │       ├──▶ T2.2（扩容 UI）── 依赖 T2.1
  │       ├──▶ T2.3（排序 + 批量售卖 UI）── 依赖 T1.3, T1.4, T2.1
  │       └──▶ T2.4（CAP-INV-05：内联操作按钮 + 移除详情面板）── 依赖 T2.1
  │
  └──▶ T3.1（核心契约更新）── 可与 Phase 2 并行
          │
          └──▶ T3.2（最终验证清单）── 依赖全部任务
```

- **T1.1** 无前置依赖，立即可执行
- **T1.3 / T1.4 / T1.5** 互不依赖，可并行执行（均依赖 T1.2）
- **T2.2 / T2.3 / T2.4** 互不依赖，可并行执行（均依赖 T2.1）
- **T3.1** 仅文档变更，可与 Phase 2 并行
- **T3.2** 最终门禁，依赖全部任务完成

---

## Phase 1：Manager 层逻辑

### 任务 T1.1 — 新增 INVENTORY_DEFAULTS 常量

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-INV-02 §2.2 |
| **输入** | `js/data/equipment.js`（现有 `EquipSellPrice`、`EquipMaxLevel` 所在文件） |
| **输出** | `js/data/equipment.js` 尾部新增 `INVENTORY_DEFAULTS` 常量对象 |
| **约束** | 全局 const，不用 ES Modules；值必须与规范 §2.2 完全一致 |

**具体改动**：

在 `js/data/equipment.js` 文件末尾（`EquipSellPrice` 之后）新增：

```javascript
const INVENTORY_DEFAULTS = {
  BASE_SLOTS: 100,
  MAX_EXPAND: 90,
  EXPAND_STEP: 10,
  EXPAND_BASE_COST: 1000,
  EXPAND_COST_MULTIPLIER: 1.5
};
```

**验证**：
- `INVENTORY_DEFAULTS.BASE_SLOTS === 100`
- `INVENTORY_DEFAULTS.MAX_EXPAND === 90`
- `INVENTORY_DEFAULTS.EXPAND_STEP === 10`
- `INVENTORY_DEFAULTS.EXPAND_BASE_COST === 1000`
- `INVENTORY_DEFAULTS.EXPAND_COST_MULTIPLIER === 1.5`
- 浏览器控制台可直接访问 `INVENTORY_DEFAULTS`

---

### 任务 T1.2 — 默认容量 + 金币扩容 + getMaxCapacity（CAP-INV-01 + 02）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-INV-01 全部场景、CAP-INV-02 全部场景 |
| **依赖** | T1.1 |
| **输入** | `js/modules/equipment-manager.js` |
| **输出** | 同文件修改 |
| **约束** | 不破坏现有 `equip`/`unequip`/`sell`/`reinforce` 行为 |

**具体改动**：

1. **`_maxSlots` 初始值**：`50` → `INVENTORY_DEFAULTS.BASE_SLOTS`（即 100）

2. **新增字段** `_expandedSlots: 0`

3. **`init(saved)` 修改**：
   - `this._maxSlots = data.maxSlots || INVENTORY_DEFAULTS.BASE_SLOTS;`（旧存档 50 保留，新存档 100）
   - `this._expandedSlots = data.expandedSlots || 0;`

4. **新增方法 `getMaxCapacity()`**：
   ```javascript
   getMaxCapacity() { return this._maxSlots + this._expandedSlots; }
   ```

5. **替换所有 `this._maxSlots` 上限判断为 `this.getMaxCapacity()`**：
   - `generateDrop()` 中 `this._inventory.length < this._maxSlots` → `this._inventory.length < this.getMaxCapacity()`
   - `addToInventory()` 中同上
   - `claimOverflow()` 中同上

6. **新增方法 `getExpandCost()`**：
   ```javascript
   getExpandCost() {
     var n = this._expandedSlots / INVENTORY_DEFAULTS.EXPAND_STEP;
     if (this._expandedSlots >= INVENTORY_DEFAULTS.MAX_EXPAND) return 0;
     return Math.floor(INVENTORY_DEFAULTS.EXPAND_BASE_COST * Math.pow(INVENTORY_DEFAULTS.EXPAND_COST_MULTIPLIER, n));
   }
   ```

7. **新增方法 `getExpandInfo()`**：
   ```javascript
   getExpandInfo() {
     var canExpand = this._expandedSlots < INVENTORY_DEFAULTS.MAX_EXPAND;
     return {
       expandedSlots: this._expandedSlots,
       maxExpand: INVENTORY_DEFAULTS.MAX_EXPAND,
       nextCost: this.getExpandCost(),
       canExpand: canExpand
     };
   }
   ```

8. **新增方法 `expandInventory()`**：按规范 CAP-INV-02 行为规则步骤 1–8 实现。

9. **`getState()` 扩展**：返回值增加 `expandedSlots: this._expandedSlots`

**验证（CAP-INV-01 场景）**：
- [ ] 新存档（无 saved data）→ `_maxSlots === 100`，`getMaxCapacity() === 100`
- [ ] 旧存档 `maxSlots=50` → `_maxSlots === 50`，`getMaxCapacity() === 50`
- [ ] 旧存档 `maxSlots=50, expandedSlots=20` → `getMaxCapacity() === 70`

**验证（CAP-INV-02 场景）**：
- [ ] 首次扩容：`expandedSlots=0`，金币充足 → 扣 1000 金，`expandedSlots=10`，返回 true
- [ ] 第 4 次扩容：`expandedSlots=30`，费用 3375 → 扣 3375 金，`expandedSlots=40`
- [ ] 已达上限：`expandedSlots=90` → toast warning '背包已达最大容量！'，返回 false
- [ ] 金币不足 → toast warning '金币不足！需要💰×{cost}'，返回 false
- [ ] `getExpandInfo()` expandedSlots=20 → `{ expandedSlots:20, maxExpand:90, nextCost:2250, canExpand:true }`
- [ ] `getExpandInfo()` expandedSlots=90 → `{ expandedSlots:90, maxExpand:90, nextCost:0, canExpand:false }`
- [ ] `getExpandCost()` expandedSlots=0 → 1000
- [ ] `getExpandCost()` expandedSlots=30 → 3375
- [ ] `getExpandCost()` expandedSlots=90 → 0

---

### 任务 T1.3 — 一键排序 sortInventory（CAP-INV-03）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-INV-03 全部场景 |
| **依赖** | T1.2（使用 `equip:inventory_changed` 事件） |
| **输入** | `js/modules/equipment-manager.js` |
| **输出** | 同文件新增 `sortInventory()` 方法 |

**具体改动**：

新增 `sortInventory()` 方法：

```javascript
sortInventory: function () {
  this._inventory.sort(function (a, b) {
    if (b.quality !== a.quality) return b.quality - a.quality;
    if (b.level !== a.level) return b.level - a.level;
    return a.uid < b.uid ? -1 : (a.uid > b.uid ? 1 : 0);
  });
  EventBus.emit('equip:inventory_changed');
  EventBus.emit('toast:show', { type: 'info', message: '背包已排序' });
}
```

**验证**：
- [ ] `[{q:1,l:0,uid:'a'}, {q:3,l:5,uid:'b'}, {q:3,l:10,uid:'c'}, {q:5,l:0,uid:'d'}]` → 排序后 `[d, c, b, a]`
- [ ] 同 quality 同 level → 按 uid 字典序升序：`[{uid:'x'}, {uid:'y'}]` → `[x, y]`
- [ ] 空 inventory → 保持空，仍 emit toast
- [ ] 排序后 emit `equip:inventory_changed` 事件

---

### 任务 T1.4 — 一键售卖 batchSell（CAP-INV-04）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-INV-04 全部场景 |
| **依赖** | T1.2（使用 `equip:inventory_changed` 事件） |
| **输入** | `js/modules/equipment-manager.js` |
| **输出** | 同文件新增 `batchSell(maxQuality)` 方法 |

**具体改动**：

新增 `batchSell(maxQuality)` 方法，严格遵循规范行为规则 1–8：

1. 输入验证：`maxQuality` 不是 1–5 整数 → 返回 `{ sold: 0, earned: 0 }`，无 toast
2. 筛选：`quality <= maxQuality && equippedBy === null && unsellable !== true`
3. 计算总金币：每件 `EquipSellPrice[equip.quality] || 0`
4. 一次性 `filter` 移除（非循环 splice）
5. 一次性 `ResourceManager.add('gold', totalGold)`
6. `sold === 0` → toast info '没有可出售的装备'
7. `sold > 0` → toast success + emit `equip:inventory_changed`
8. 返回 `{ sold, earned: totalGold }`

**验证**：
- [ ] `batchSell(2)` 含 5 件装备 → 出售 2 件（q≤2 且未穿戴非神话），返回 `{sold:2, earned:150}`
- [ ] `batchSell(1)` 无匹配 → `{sold:0, earned:0}`，toast info
- [ ] `batchSell(5)` 出售所有未穿戴非神话 → 保留神话+已穿戴
- [ ] `batchSell(undefined)` → `{sold:0, earned:0}`，无 toast，inventory 不变
- [ ] `batchSell(3)` 全部已穿戴 → `{sold:0, earned:0}`，toast info
- [ ] `sold > 0` 时 emit `equip:inventory_changed`

---

### 任务 T1.5 — MerchantManager 适配 getMaxCapacity()

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-INV-02 §有效背包上限计算 — MerchantManager 影响点 |
| **依赖** | T1.2（`getMaxCapacity()` 必须存在） |
| **输入** | `js/modules/merchant-manager.js` 第 143 行、第 194 行 |
| **输出** | 同文件修改 |

**具体改动**：

将两处 `EquipmentManager._maxSlots` 替换为 `EquipmentManager.getMaxCapacity()`：

- 第 143 行：`EquipmentManager.getInventory().length >= EquipmentManager._maxSlots` → `EquipmentManager.getInventory().length >= EquipmentManager.getMaxCapacity()`
- 第 194 行：同上

**验证**：
- [ ] 替换后无直接访问 `EquipmentManager._maxSlots`（grep 确认）
- [ ] MerchantManager 购买装备时使用有效背包上限（含扩展格数）

---

## Phase 2：UI 层

### 任务 T2.1 — 背包面板工具栏 + 动态容量显示

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-INV-02 §UI 呈现、§4.1 工具栏 |
| **依赖** | T1.2 |
| **输入** | `js/ui/equipment-panel.js` |
| **输出** | 同文件修改 |

**具体改动**：

1. **移除硬编码 `var maxSlots = 50`**（约第 53 行），改为 `var maxSlots = EquipmentManager.getMaxCapacity()`

2. **在 `_renderInventory()` 背包标题区域添加工具栏**：
   - 左侧：容量文本 `{inventory.length}/{maxSlots}`
   - 右侧：预留排序和售卖按钮位置（T2.3 填充）

3. **注册 `equip:inventory_changed` 事件**：在 `init()` 中添加 `EventBus.on('equip:inventory_changed', function () { self._render(); })`

**验证**：
- [ ] 面板头部显示动态容量（如 `45/100`）
- [ ] 扩容后容量显示更新（如 `45/110`）
- [ ] 排序/批量售卖后面板自动刷新（通过 `equip:inventory_changed` 事件）

---

### 任务 T2.2 — 扩容 UI（按钮 + Modal 确认）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-INV-02 §UI 呈现 |
| **依赖** | T2.1 |
| **输入** | `js/ui/equipment-panel.js` |
| **输出** | 同文件修改 |

**具体改动**：

1. **工具栏容量文本旁添加扩容按钮**：
   - 文本：`+10 💰{cost}`（调用 `EquipmentManager.getExpandCost()`）
   - 已达上限：按钮灰显，显示"已满"
   - 金币不足：按钮可点但 `expandInventory()` 内部处理 toast

2. **点击事件**：弹出 `Modal.show()` 确认对话框
   - 标题："背包扩容"
   - 内容：`确定花费 💰×{cost} 扩展背包 +10 格？`
   - onConfirm：调用 `EquipmentManager.expandInventory()`，成功后 `self._render()`

3. **绑定事件**：在 `_bindEvents()` 中注册扩容按钮 click

**验证**：
- [ ] 按钮显示当前扩容费用
- [ ] 点击弹出 Modal 确认
- [ ] 确认后执行扩容，面板刷新显示新容量
- [ ] 达到上限后按钮灰显显示"已满"

---

### 任务 T2.3 — 排序 + 批量售卖 UI

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-INV-03 §UI 呈现、CAP-INV-04 §UI 呈现 |
| **依赖** | T1.3, T1.4, T2.1 |
| **输入** | `js/ui/equipment-panel.js` |
| **输出** | 同文件修改 |

**具体改动**：

1. **排序按钮**：工具栏右侧添加 `🔃 排序` 按钮
   - 点击直接调用 `EquipmentManager.sortInventory()`（无确认）
   - 通过 `equip:inventory_changed` 事件自动刷新

2. **一键售卖按钮**：工具栏右侧添加 `🗑️ 售卖` 按钮
   - 点击弹出 Modal，内含品质选择器
   - 选项：`白色（普通）`、`绿色（精良）`、`蓝色（稀有）`、`紫色（史诗）`、`橙色（传说）`
   - 每个选项旁显示可售数量和预估金币（遍历 inventory 统计）
   - 确认后调用 `EquipmentManager.batchSell(selectedQuality)`
   - 确认文案：`确定出售所有品质 ≤ {品质名} 的未穿戴装备？共 {count} 件，预计获得 💰×{gold}`

3. **绑定事件**：在 `_bindEvents()` 中注册两个按钮 click

**验证**：
- [ ] 排序按钮点击后背包网格立即重排
- [ ] 售卖按钮点击弹出品质选择 Modal
- [ ] Modal 中显示各品质可售数量和预估金币
- [ ] 确认后批量出售，背包刷新

---

### 任务 T2.4 — 内联操作按钮 + 移除底部详情面板（CAP-INV-05）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-INV-05 全部场景、§4.2 移除 UI 元素 |
| **依赖** | T2.1 |
| **输入** | `js/ui/equipment-panel.js` |
| **输出** | 同文件修改 |

**具体改动**：

1. **移除 `_renderDetail()` 调用**：在 `_render()` 中删除 `html += this._renderDetail()` 行

2. **修改 `_renderInventoryCard()`**：
   - 卡片 click 切换展开/收起（toggle `_selectedEquip`）
   - 展开时在卡片下方渲染内联操作区域（占据 3 列宽度 `grid-column: 1 / -1`）
   - 内联区域内容：
     - 装备属性摘要（名称、品质颜色、类型、属性值、强化等级）
     - 操作按钮行：[装备到…/卸下] [强化 💰×{cost}] [出售 💰+{price}]
     - 神话装备不显示出售按钮
     - 已满级强化按钮灰显

3. **新增 `_renderInlineActions(equip)` 方法**：渲染内联操作区域 HTML

4. **更新 `_bindEvents()`**：
   - 内联"装备到…"按钮 → 弹出武将选择列表（复用 `_onEquip` 逻辑）
   - 内联"卸下"按钮 → `_onUnequip(uid)`
   - 内联"强化"按钮 → `_onReinforce(uid)`，成功后 `_render()` 刷新
   - 内联"出售"按钮 → `_onSell(uid)`

5. **排序/批量售卖后收起**：`equip:inventory_changed` 事件回调中 `self._selectedEquip = null`

6. **清理**：移除 `_renderDetail()` 方法体（或保留空方法避免其它引用报错）；移除 `_updateDetail()` 方法

**验证**：
- [ ] 点击未展开卡片 → 展开内联操作区域，收起其他
- [ ] 点击已展开卡片 → 收起
- [ ] 内联区域显示属性摘要和操作按钮
- [ ] 神话装备无出售按钮
- [ ] 点击"装备到…" → 弹出武将选择
- [ ] 点击"卸下" → 执行卸下
- [ ] 点击"强化" → 执行强化，刷新内联区域
- [ ] 点击"出售" → 出售，卡片消失
- [ ] 排序/批量售卖后所有内联区域收起
- [ ] 底部不再有详情面板

---

## Phase 3：集成与契约

### 任务 T3.1 — 核心契约更新

| 字段 | 值 |
|------|-----|
| **规范引用** | 产品规范 §5 事件变更、§9 核心契约变更清单 |
| **依赖** | 无（可与 Phase 2 并行） |
| **输入** | `specs/system/core-contracts.md` |
| **输出** | 同文件修改 |

**具体改动**：

1. **事件表**：新增 `equip:inventory_changed`（无载荷）— 背包整体变化（排序、批量售卖）
2. **跨模块写操作**：EquipmentManager 行增加 `ResourceManager.add()` — "出售收入"（用于 `batchSell`）
3. **跨模块读操作**：MerchantManager 从 `EquipmentManager._maxSlots`（直接字段访问）改为 `EquipmentManager.getMaxCapacity()`（公共方法调用）

**验证**：
- [ ] `equip:inventory_changed` 出现在事件表中
- [ ] MerchantManager 跨模块访问已更新
- [ ] 无遗漏的契约变更

---

### 任务 T3.2 — 最终验证清单

| 字段 | 值 |
|------|-----|
| **依赖** | 全部任务完成 |

**全量验收检查**：

#### CAP-INV-01 验收
- [ ] 新存档：`EquipmentManager._maxSlots === 100`
- [ ] 旧存档 `maxSlots=50`：保持 50
- [ ] 旧存档 `maxSlots=50, expandedSlots=20`：有效上限 70

#### CAP-INV-02 验收
- [ ] `expandInventory()` 首次扩容正确扣金、扩容量+10
- [ ] 费用递增公式正确（第 4 次 = 3375）
- [ ] 已达上限（90）返回 false + toast warning
- [ ] 金币不足返回 false + toast warning
- [ ] `getExpandInfo()` 返回正确结构
- [ ] `getExpandCost()` 各边界值正确
- [ ] UI 扩容按钮可用、达上限灰显
- [ ] MerchantManager 使用 `getMaxCapacity()` 而非 `_maxSlots`

#### CAP-INV-03 验收
- [ ] `sortInventory()` 品质↓ → 等级↓ → UID↑
- [ ] 空背包排序不报错
- [ ] 排序后 emit `equip:inventory_changed` + toast
- [ ] UI 排序按钮点击后网格重排

#### CAP-INV-04 验收
- [ ] `batchSell(2)` 正确筛选并出售
- [ ] 已穿戴装备不被出售
- [ ] 神话装备（unsellable）不被出售
- [ ] 非法 `maxQuality` 输入安全返回
- [ ] 一次性 `ResourceManager.add` + 一次性 `filter` 移除
- [ ] UI 品质选择 Modal 显示正确数量和金额

#### CAP-INV-05 验收
- [ ] 卡片点击展开/收起内联操作区域
- [ ] 同时只有一个卡片展开
- [ ] 操作按钮功能正确（装备/卸下/强化/出售）
- [ ] 神话装备无出售按钮
- [ ] 底部详情面板已移除
- [ ] 排序/批量售卖后内联区域收起

#### 存档兼容性验收
- [ ] 旧存档无 `expandedSlots` 字段 → 默认 0
- [ ] `getState()` 包含 `expandedSlots` 字段
- [ ] 清除存档后新存档 `maxSlots=100`

#### 回归检查
- [ ] 现有 `equip()`/`unequip()`/`sell()`/`reinforce()` 功能不受影响
- [ ] `equip:changed` 事件行为不变
- [ ] `generateDrop()` 使用 `getMaxCapacity()` 做满包判断
- [ ] `claimOverflow()` 使用 `getMaxCapacity()` 做满包判断
- [ ] MerchantManager 购买装备使用 `getMaxCapacity()` 做满包判断
- [ ] 无 `var maxSlots = 50` 或 `EquipmentManager._maxSlots` 硬编码残留（grep 验证）

---

## WHEN/THEN 场景覆盖矩阵

| 场景 ID | 规范位置 | 覆盖任务 |
|---------|---------|---------|
| CAP-01 新存档 maxSlots=100 | CAP-INV-01 场景 1 | T1.2, T3.2 |
| CAP-01 旧存档 maxSlots=50 | CAP-INV-01 场景 2 | T1.2, T3.2 |
| CAP-01 旧存档 maxSlots=50+expand=20 | CAP-INV-01 场景 3 | T1.2, T3.2 |
| CAP-02 首次扩容 | CAP-INV-02 场景 1 | T1.2, T2.2, T3.2 |
| CAP-02 第 4 次扩容费用 | CAP-INV-02 场景 2 | T1.2, T3.2 |
| CAP-02 已达上限 | CAP-INV-02 场景 3 | T1.2, T2.2, T3.2 |
| CAP-02 金币不足 | CAP-INV-02 场景 4 | T1.2, T3.2 |
| CAP-02 getExpandInfo 正常 | CAP-INV-02 场景 5 | T1.2, T3.2 |
| CAP-02 getExpandInfo 已满 | CAP-INV-02 场景 6 | T1.2, T3.2 |
| CAP-02 getExpandCost 各值 | CAP-INV-02 场景 7–9 | T1.2, T3.2 |
| CAP-03 排序多品质 | CAP-INV-03 场景 1 | T1.3, T3.2 |
| CAP-03 排序同品质同等级 | CAP-INV-03 场景 2 | T1.3, T3.2 |
| CAP-03 排序空背包 | CAP-INV-03 场景 3 | T1.3, T3.2 |
| CAP-04 batchSell(2) 混合 | CAP-INV-04 场景 1 | T1.4, T3.2 |
| CAP-04 batchSell 无匹配 | CAP-INV-04 场景 2 | T1.4, T3.2 |
| CAP-04 batchSell(5) 全出售 | CAP-INV-04 场景 3 | T1.4, T3.2 |
| CAP-04 batchSell(undefined) | CAP-INV-04 场景 4 | T1.4, T3.2 |
| CAP-04 batchSell 全穿戴 | CAP-INV-04 场景 5 | T1.4, T3.2 |
| CAP-05 点击展开 | CAP-INV-05 场景 1 | T2.4, T3.2 |
| CAP-05 点击收起 | CAP-INV-05 场景 2 | T2.4, T3.2 |
| CAP-05 神话无出售 | CAP-INV-05 场景 3 | T2.4, T3.2 |
| CAP-05 装备到武将 | CAP-INV-05 场景 4 | T2.4, T3.2 |
| CAP-05 卸下 | CAP-INV-05 场景 5 | T2.4, T3.2 |
| CAP-05 强化 | CAP-INV-05 场景 6 | T2.4, T3.2 |
| CAP-05 出售移除 | CAP-INV-05 场景 7 | T2.4, T3.2 |
| CAP-05 排序后收起 | CAP-INV-05 场景 8 | T2.4, T3.2 |
