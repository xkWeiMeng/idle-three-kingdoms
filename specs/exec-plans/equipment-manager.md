---
spec: specs/services/equipment-manager.md
status: Active
created: 2026-04-09
updated: 2026-04-09
type: audit-and-test   # 核心代码已存在；重点是审计+补全测试
---

# 执行计划：EquipmentManager

## 背景

EquipmentManager 核心实现已完成（`js/modules/equipment-manager.js`），  
本计划的目标是：

1. **T1** — 对照规范逐一审计现有实现，记录偏差  
2. **T2** — 确认神话套装效果（`getHeroSetBonuses`）是否被 BattleManager 消费  
3. **T3** — 为全部 19 个 WHEN/THEN 场景生成测试文件  

> **注意**：T1 是**审计任务**，不是重新实现。发现偏差时记录到"待修复清单"，不得直接修改代码，除非偏差明确阻断测试。

---

## 验收场景完整列表

以下 19 个场景全部来自 `specs/services/equipment-manager.md`，每个场景必须被 T3 测试覆盖。

### 能力 1：generateDrop（4 个场景）

| # | 简述 |
|---|------|
| GD-1 | qualityWeights={3:100}，背包未满 → 品质3装备入 inventory，返回实例 |
| GD-2 | qualityWeights={99:1}，无匹配模板 → 返回 null，inventory/overflow 不变 |
| GD-3 | 背包已满(50)，overflow 未满 → 装备入 overflow，emit warning toast，返回实例 |
| GD-4 | 背包已满，overflow 已满(10) → emit error toast，返回 null |

### 能力 2：addToInventory / claimOverflow（5 个场景）

| # | 简述 |
|---|------|
| AI-1 | addToInventory(null) → 返回 false，不变 |
| AI-2 | inventory.length=49 → 入 inventory，length=50，返回 true，不发 toast |
| CO-1 | inventory=48，overflow=3 → 3件全移入，返回长度3数组，overflow 清空 |
| CO-2 | inventory=50（满），overflow=5 → 返回 []，inventory/overflow 不变 |
| CO-3 | inventory=49，overflow=3 → 仅移入1件，返回长度1，overflow 剩余2 |

### 能力 3：equip（4 个场景）

| # | 简述 |
|---|------|
| EQ-1 | 槽位空闲 → equippedBy=heroUid，slot=equipUid，emit equip:changed，返回 true |
| EQ-2 | 槽位已有旧装备 → 先 unequip 旧装备，再穿新装备 |
| EQ-3 | 装备被他人穿戴 → otherHero.equipment[slot] 直接置 null（不触发 equip:changed），新武将穿戴，emit 1次 |
| EQ-4 | equipUid 不在 inventory → 返回 false，不发事件 |

### 能力 4：unequip（3 个场景）

| # | 简述 |
|---|------|
| UQ-1 | 装备存在且武将存在 → slot=null，equippedBy=null，emit equip:changed，返回 true |
| UQ-2 | 武将不存在 → equippedBy=null，emit equip:changed(hero=null)，返回 true |
| UQ-3 | equipUid 不在 inventory → 返回 false，不发事件 |

### 能力 5：reinforce（4 个场景）

| # | 简述 |
|---|------|
| RF-1 | quality=2,level=0，有足够金币 → spend(200)，level→1，emit success，返回 true |
| RF-2 | quality=6(神话),level=0，有金币 → cost=600，level→1，返回 true |
| RF-3 | quality=1,level=5（已达上限） → emit warning '已达最大强化等级！'，level不变，返回 false |
| RF-4 | 金币不足 → emit warning '金币不足！需要💰×{cost}'，level 不变，返回 false |

### 能力 6：sell（4 个场景）

| # | 简述 |
|---|------|
| SL-1 | quality=3，unsellable=undefined，equippedBy=null → add(150)，移除，emit success，返回 true |
| SL-2 | quality=6，unsellable=true → emit warning '神话装备不可出售！'，不移除，返回 false |
| SL-3 | equippedBy=someHeroUid → 先 unequip，再移除，emit success，返回 true |
| SL-4 | equipUid 不在 inventory → 返回 false，不发事件 |

### 能力 7：getEquipStatValue（3 个场景）

| # | 简述 |
|---|------|
| GV-1 | stats={atk:20},level=5,quality=3 → 30 |
| GV-2 | stats={atk:80},level=10,quality=6(神话) → 144 |
| GV-3 | getEquipStatValue(null) → 0 |

---

## 任务列表

### 阶段一：规范审计（只读）

---

#### T1 — 审计现有实现与规范一致性

**规范引用**：`specs/services/equipment-manager.md` §能力1–7、§约束与设计决策  
**输入文件**：
- `js/modules/equipment-manager.js`
- `js/data/equipment.js`（EquipMaxLevel, EquipSellPrice, EquipData）
- `js/data/equipment-sets.js`（MythicEquipmentData, EquipmentSets, getHeroSetBonuses）

**审计维度与预期结论**（基于初步代码阅读）：

| 维度 | 代码行为 | 规范要求 | 状态 |
|------|----------|----------|------|
| generateDrop: 品质滚动 | `reduce` + 减重逻辑 | 同 | ✅ 一致 |
| generateDrop: 类型等概率 | `Utils.randInt(0,3)` → 4类型 | 同 | ✅ 一致 |
| generateDrop: 查 EquipmentData | `find(type+quality)` | 只查 EquipmentData (非神话) | ✅ 一致 (约束9) |
| generateDrop: statRange 随机 | `Utils.randInt(min,max)` | 含两端整数 | ✅ 一致 |
| generateDrop: 实例字段 | uid/level=0/equippedBy=null/stats | 同 | ✅ 一致 |
| generateDrop: overflow toast 文案 | `背包已满！{name}放入溢出栏` | 规范同文案格式 | ✅ 一致 |
| generateDrop: 实例不含 setId/unsellable | EquipmentData 模板无此字段 | 非神话装备不需要 | ✅ 一致 |
| addToInventory: null 检查 | `if (!equip)` | 同 | ✅ 一致 |
| claimOverflow: FIFO | `shift()` | 同 | ✅ 一致 |
| equip: 跨武将静默替换 | 直接 `otherHero.equipment[slot]=null` | 不触发 equip:changed | ✅ 一致 (约束4) |
| unequip: hero=null 继续 | `if (hero)` 跳过 slot 清空 | 同 | ✅ 一致 |
| reinforce: 费用公式(普通) | `floor(quality*100*(1+lv*0.5))` | 同 | ✅ 一致 |
| reinforce: 费用公式(神话) | `floor(600*(1+lv*0.5)+lv*200)` | 同 | ✅ 一致 |
| reinforce: EquipMaxLevel | `EquipMaxLevel[quality] \|\| 25` | 品质1-6上限5/10/15/20/25/30 | ✅ 一致 |
| sell: unsellable 判断 | `equip.unsellable` (布尔) | `equip.unsellable === true` | ✅ 等效 |
| sell: 出售价格 | `EquipSellPrice[quality] \|\| 0` | quality×50，神话=0 | ✅ 一致 |
| getEquipStatValue: 成长率 | quality=6 → 0.08，其余 → 0.1 | 同 | ✅ 一致 |
| getEquipStatValue: 不取整 | 直接返回浮点 | 同 (约束7) | ✅ 一致 |

**已知疑点（需 T3 测试验证）**：
1. **EQ-3 边界**：`equip` 在"跨武将穿戴"流程中，`equip.equippedBy` 在对 `otherHero.equipment[slot]` 置 null 后立刻被覆写。若 `equip.type` ≠ `slot`（装备类型与旧槽不一致），`otherHero` 的其他槽不会受影响——代码行为正确，但用 `equip.type` 而非 `equip.type` 取旧槽（`slot = equip.type`）是符合规范的。
2. **RF-1 toast 文案**：规范场景举例是 `碧刃 强化至 +1`（具体装备名），代码用 `equip.name` 动态插值——✅ 正确，测试时需用具体 mock 验证格式。
3. **CO-3 边界**：inventory=49，overflow=3，预期仅移入1件——代码 `while` 条件 `inventory.length < maxSlots` 在第一次移入后 length=50，循环退出，行为正确，需测试确认。

**验证方式**：T3 测试覆盖上述所有维度；任何 `FAIL` 即为偏差，记录在 `tests/equipment-manager.test.html` 顶部注释中。

**输出**：审计结论注释（嵌入 T3 文件头部）

---

#### T2 — 确认神话套装效果消费点

**规范引用**：`specs/services/equipment-manager.md` §神话套装  
**输入文件**：
- `js/data/equipment-sets.js`（`getHeroSetBonuses`, `EquipmentSets`）
- `js/modules/battle-manager.js`（搜索 `getHeroSetBonuses` 调用点）
- `js/modules/hero-manager.js`（搜索套装相关）

**目标**：
1. 确认 `getHeroSetBonuses()` 是否被 BattleManager 的战斗单位构建逻辑调用。
2. 确认 `EquipmentSets[setId].bonuses` 的 `effects` 字段（`atkPercent`、`critRate`、`doubleDamageChance`、`skillDamagePercent` 等）是否在战斗公式中被读取和应用。
3. 如有消费逻辑：标记为 **✅ 已实现**。
4. 如无消费逻辑（仅有数据定义）：标记为 **⚠️ 待实现**，并记录缺失的应用点。

**验证方式**：代码搜索（`grep getHeroSetBonuses`、`grep setBonus`、`grep atkPercent`），结合 BattleManager 战斗单位构建代码审阅。

**输出**：套装消费状态表（记录在本执行计划"T2 审计结论"节）

> **T2 初步结论占位**（由实施 Agent 填写）：
> - `getHeroSetBonuses` 调用点：`_____`
> - `atkPercent` 应用：`_____`
> - `critRate` 应用：`_____`
> - `doubleDamageChance` 应用：`_____`
> - `skillDamagePercent / skillCdReduction` 应用：`_____`
> - `healAllInterval / allStatsPercent` 应用：`_____`
> - `deathImmunityChance / teamDefPercent` 应用：`_____`

---

### 阶段二：测试补全

---

#### T3 — 生成测试文件 `tests/equipment-manager.test.html`

**规范引用**：`specs/services/equipment-manager.md` §能力1–7（全部 19 个场景）  
**依赖**：T1 审计结论（已有初步结论，可并行启动）

**输入文件**：
- `js/core/event-bus.js`
- `js/core/utils.js`
- `js/data/equipment.js`
- `js/data/equipment-sets.js`
- `js/modules/equipment-manager.js`

**Mock 策略**：

```javascript
// 1. MockResourceManager — 替换全局 ResourceManager
const MockResourceManager = {
  _gold: 0,
  _spent: [],
  _added: [],
  setGold(n) { this._gold = n; this._spent = []; this._added = []; },
  canAfford(res, amt) { return res === 'gold' && this._gold >= amt; },
  spend(res, amt) { this._gold -= amt; this._spent.push({ res, amt }); },
  add(res, amt)   { this._gold += amt; this._added.push({ res, amt }); }
};

// 2. MockHeroManager — 替换全局 HeroManager
const MockHeroManager = {
  _heroes: {},
  reset() { this._heroes = {}; },
  addHero(uid, equipment) {
    this._heroes[uid] = { uid, equipment: equipment || { weapon:null,armor:null,accessory:null,mount:null } };
  },
  getHeroByUid(uid) { return this._heroes[uid] || null; }
};

// 3. EventBus 事件捕获
const _emitted = [];
const _origEmit = EventBus.emit.bind(EventBus);
EventBus.emit = (event, payload) => { _emitted.push({ event, payload }); };
function clearEmits() { _emitted.length = 0; }
function getEmits(event) { return _emitted.filter(e => e.event === event); }

// 4. 重置 EquipmentManager 状态
function resetEM() {
  EquipmentManager._inventory = [];
  EquipmentManager._overflow = [];
  EquipmentManager._maxSlots = 50;
  clearEmits();
}

// 5. 创建测试装备实例的辅助函数
function makeEquip(overrides) {
  return Object.assign({
    uid: Utils.uid(), id: 'equip_green_blade', name: '碧刃',
    type: 'weapon', quality: 2, emoji: '⚔️', description: '',
    stats: { atk: 10 }, level: 0, equippedBy: null
  }, overrides);
}
```

**测试覆盖要求**（对应 19 个场景）：

```
section('能力1 generateDrop')
  test('GD-1: 品质3权重100，背包未满，装备入inventory')
  test('GD-2: 不存在品质99，返回null，inventory不变')
  test('GD-3: 背包满50，overflow未满，emit warning，入overflow')
  test('GD-4: 背包满50，overflow满10，emit error，返回null')

section('能力2 addToInventory')
  test('AI-1: addToInventory(null) 返回 false')
  test('AI-2: inventory=49，入inventory，length=50，返回true，无toast')

section('能力2 claimOverflow')
  test('CO-1: inventory=48，overflow=3，3件全移入，overflow清空')
  test('CO-2: inventory=50（满），返回[]，不变')
  test('CO-3: inventory=49，overflow=3，仅移入1件，overflow剩余2')

section('能力3 equip')
  test('EQ-1: 槽位空闲，穿戴成功，emit equip:changed，返回true')
  test('EQ-2: 槽位已有旧装备，先unequip旧装备')
  test('EQ-3: 装备被他人穿戴，otherHero槽位静默置null，emit仅触发1次')
  test('EQ-4: equipUid不在inventory，返回false，不发事件')

section('能力4 unequip')
  test('UQ-1: 武将存在，slot清空，equippedBy=null，emit equip:changed')
  test('UQ-2: 武将不存在，equippedBy=null，emit equip:changed(hero=null)')
  test('UQ-3: equipUid不在inventory，返回false，不发事件')

section('能力5 reinforce')
  test('RF-1: quality=2,level=0，cost=200，spend(200)，level→1，emit success')
  test('RF-2: quality=6,level=0，cost=600，level→1，返回true')
  test('RF-3: quality=1,level=5(上限)，emit warning，level不变，返回false')
  test('RF-4: 金币不足，emit warning，level不变，返回false')

section('能力6 sell')
  test('SL-1: quality=3，add(150)，装备移除，emit success，返回true')
  test('SL-2: unsellable=true，emit warning，不移除，返回false')
  test('SL-3: equippedBy存在，先unequip再sell，emit success')
  test('SL-4: equipUid不在inventory，返回false，不发事件')

section('能力7 getEquipStatValue')
  test('GV-1: stats={atk:20},level=5,quality=3 → 30')
  test('GV-2: stats={atk:80},level=10,quality=6 → 144')
  test('GV-3: getEquipStatValue(null) → 0')
```

**关键断言说明**：

| 场景 | 关键断言 |
|------|----------|
| GD-1 | `result.quality === 3`，`result.level === 0`，`result.equippedBy === null`，`EM._inventory.length === 1` |
| GD-2 | `result === null`，`EM._inventory.length === 0` |
| GD-3 | `result !== null`，`EM._overflow.length === 1`，`getEmits('toast:show')[0].payload.type === 'warning'` |
| GD-4 | `result === null`，`getEmits('toast:show')[0].payload.type === 'error'`，`EM._overflow.length === 10` |
| AI-2 | 无 `toast:show` 事件（`getEmits('toast:show').length === 0`） |
| CO-3 | `claimed.length === 1`，`EM._overflow.length === 2`，`EM._inventory.length === 50` |
| EQ-3 | `getEmits('equip:changed').length === 1`（只有为新武将触发的那次） |
| RF-1 | `MockResourceManager._spent[0].amt === 200`，`equip.level === 1` |
| RF-2 | `MockResourceManager._spent[0].amt === 600`（floor(600×1+0)=600） |
| SL-3 | `getEmits('equip:changed').length === 1`（unequip 产生），装备从 inventory 移除 |

**输出文件**：`tests/equipment-manager.test.html`  
**验证方式**：浏览器打开，所有 19 个测试用例 ✅ PASS，summary 显示 `19/19`

---

## 依赖关系图

```
T1（审计）──┐
            ├──→ T3（测试）
T2（套装）──┘
```

- T1 与 T2 可**并行**执行（均为只读审计）  
- T3 可在 T1 初步结论出来后立即开始（无需等待 T2）  
- T3 测试框架/mock 独立于 T2 结论，套装测试可后续单独补充

---

## 最终验收清单

| 检查项 | 通过标准 |
|--------|----------|
| T1 审计表格已填写 | 每个维度有明确 ✅/⚠️/❌ 标注 |
| T2 套装消费状态已填写 | 7 个 effects 字段均有应用状态标注 |
| T3 测试文件存在 | `tests/equipment-manager.test.html` |
| 19 个场景全部覆盖 | 测试 summary 显示 `19/19 PASS`（或明确标记 SKIP 并注明原因） |
| GD-1 断言 | quality=3，level=0，equippedBy=null，inventory 增1 |
| GD-4 断言 | emit error，返回 null，overflow 仍为10 |
| CO-3 边界断言 | inventory=50（满），overflow 剩2 |
| EQ-3 静默替换断言 | equip:changed 只发射 1 次 |
| RF-2 神话强化费用 | cost=600（floor(600×1+0×200)=600） |
| SL-2 神话不可出售 | 装备仍在 inventory，ResourceManager.add 未被调用 |
| GV-1/GV-2 精度 | 返回浮点（30.0 / 144.0），不取整 |
| 无意外副作用 | T3 每个 test() 调用 `resetEM()` 前置，确保隔离 |

---

## 实施注意事项

1. **代码已存在，T1 是审计不是实现**：阅读代码与规范对照，填写审计表，不修改代码。
2. **T3 必须在 `tests/` 目录下**：与 `recruit-manager.test.html`、`battle-manager.test.html` 并列，遵循同一测试框架风格（纯 HTML + inline JS，无构建工具）。
3. **Mock 必须在 script 标签内、加载 equipment-manager.js 之前定义**：因为 `equipment-manager.js` 在执行时引用全局 `ResourceManager` 和 `HeroManager`。
4. **EventBus.emit 劫持**：在 `<script src="../js/core/event-bus.js"></script>` 加载后、测试代码前执行劫持，确保 emit 被捕获。
5. **Utils.randInt mock**（可选）：GD-1 测试若需确保结果品质=3，可在测试中先 mock `Math.random = () => 0` 来固定品质滚动结果，测试后恢复原始函数。
6. **T2 如发现套装效果未消费**：在 T3 中对 `getHeroSetBonuses` 函数本身编写单元测试（激活2件/4件的 bonuses 数组正确性），将 BattleManager 消费端标记为待实现，不阻断 T3 完成。
