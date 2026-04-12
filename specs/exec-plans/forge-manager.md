---
spec: specs/services/forge-manager.md
status: Active
created: 2026-04-14
updated: 2026-04-14
type: audit-and-fix   # 核心代码已存在；重点是审计+修复Bug+测试
---

# 执行计划：ForgeManager

## 背景

ForgeManager 核心实现已完成（`js/modules/forge-manager.js` + `js/ui/forge-panel.js`），
本计划的目标是：

1. **T1** — 对照规范逐场景审计现有实现，记录偏差
2. **T2** — 修复规范中标注的 4 个已知 Bug
3. **T3** — 同步更新 core-contracts.md
4. **T4** — 为全部 32 个 WHEN/THEN 场景生成测试文件
5. **T5** — 漂移检测，确保零行为级漂移

> **注意**：T1 是审计任务。T2 是代码修复。T3 是规范同步。T4 是测试。T5 是验证。

---

## 验收场景完整列表

以下 32 个场景全部来自 `specs/services/forge-manager.md`，每个场景必须被审计（T1）并被测试覆盖（T4）。

### 能力 1：普通锻造（5 个场景）

| # | 简述 |
|---|------|
| C1-S1 | qualityIndex=0，资源/等级充足，队列空 → 扣资源，入队，emit forge:started + toast，return true |
| C1-S2 | 队列已满 → emit toast warning '锻造队列已满！'，return false |
| C1-S3 | 建筑等级不足（需3，实际2） → emit toast warning，return false |
| C1-S4 | 资源不足 → emit toast warning '资源不足！'，return false |
| C1-S5 | qualityIndex=99 越界 → return false，无 toast |

### 能力 2：神话锻造（5 个场景）

| # | 简述 |
|---|------|
| C2-S1 | 有图纸，等级≥10，队列空 → 消耗图纸，入队，emit forge:started + toast，return true |
| C2-S2 | 图纸不在 blueprints 中 → emit toast warning，return false |
| C2-S3 | 建筑等级不足 → emit toast warning，return false |
| C2-S4 | BlueprintData 中不存在该 ID → return false |
| C2-S5 | workshopLv=15 → totalTime = floor(86400/1.5) = 57600 |

### 能力 3：锻造推进（11 个场景）

| # | 简述 |
|---|------|
| C3-S1 | 队列为空 → 无操作 |
| C3-S2 | 普通锻造 elapsedTime+dt >= totalTime → 完成，生成装备，入背包 |
| C3-S3 | 普通锻造进行中 → elapsedTime 递增 |
| C3-S4 | 神话锻造，资源充足 → 扣资源，更新进度，emit forge:progress |
| C3-S5 | 神话锻造，资源不足 → paused=true，emit forge:paused |
| C3-S6 | 神话锻造已暂停，资源恢复 → paused=false，继续消耗 |
| C3-S7 | 神话锻造已暂停，资源仍不足 → 无操作 |
| C3-S8 | 神话锻造 elapsedTime >= totalTime → 完成，生成神话装备 |
| C3-S9 | 普通锻造完成，EquipmentData 无候选模板 → 静默失败 |
| C3-S10 | 神话锻造完成，getMythicTemplate 返回 null → 静默失败 |
| C3-S11 | 锻造完成，背包已满 → 装备进入 overflow |

### 能力 4：图纸管理（3 个场景）

| # | 简述 |
|---|------|
| C4-S1 | 新图纸 → push 到 blueprints，emit toast |
| C4-S2 | 已有图纸 → 不重复添加 |
| C4-S3 | addBlueprint(null) → 无防御，null 被 push |

### 能力 5：查询接口（4 个场景）

| # | 简述 |
|---|------|
| C5-S1 | getQueue() → 返回内部引用 |
| C5-S2 | getBlueprints() → 返回内部引用 |
| C5-S3 | getNormalRecipes() → 返回长度 4 数组 |
| C5-S4 | getMaxQueue() → 返回 maxQueue |

### 能力 6：初始化与存档（4 个场景）

| # | 简述 |
|---|------|
| C6-S1 | init(undefined) → 默认空状态 |
| C6-S2 | init({ forge: {...} }) → 恢复存档 |
| C6-S3 | getState() 含神话任务 → mythicForge 正确提取 |
| C6-S4 | getState() 无神话任务 → mythicForge = {} |

---

## 任务列表

### 阶段一：审计（只读）

#### T1 — 审计现有实现与规范一致性

**规范引用**：`specs/services/forge-manager.md` §能力1–6
**输入文件**：
- `js/modules/forge-manager.js`
- `js/ui/forge-panel.js`

**审计维度与预期结论**（基于代码阅读）：

| 维度 | 代码行为 | 规范要求 | 状态 |
|------|----------|----------|------|
| startNormalForge: 队列满检查 | `queue.length >= maxQueue` | 同 | ✅ 一致 |
| startNormalForge: 等级要求 | `[1,3,5,8][qualityIndex] \|\| 1` | 同 | ✅ 一致 |
| startNormalForge: 资源检查+扣除 | canAfford → spend | 同 | ✅ 一致 |
| startNormalForge: 越界 qualityIndex | recipe=undefined → return false | 同 | ✅ 一致 |
| startMythicForge: 图纸检查 | indexOf + splice | 同 | ✅ 一致 |
| startMythicForge: 等级≥10 | workshopLv < 10 \|\| blacksmithLv < 10 | 同 | ✅ 一致 |
| startMythicForge: 时间公式 | floor(86400/(1+0.1*(lv-10))) | 同 | ✅ 一致 |
| onTick: 普通锻造推进 | elapsedTime += dt | 同 | ✅ 一致 |
| onTick: 神话锻造暂停/恢复 | paused flag + canAffordPerSec | 同 | ✅ 一致 |
| onTick: 资源扣除 ceil | Math.ceil(costPerSec * dt) | 同 | ✅ 一致 |
| _completeForge: 装备生成（普通） | random from EquipmentData | 同 | ✅ 一致 |
| _completeForge: 装备生成（神话） | getMythicTemplate | 同 | ✅ 一致 |
| **_completeForge: 入背包** | **直接 _inventory.push** | **应 addToInventory** | ❌ BUG-3 |
| **getState: 神话判断** | **job.isMythic（不存在）** | **job.quality === 6** | ❌ BUG-1 |
| **getState: 字段映射** | **blueprintId/progress/requiredTime** | **recipeId/elapsedTime/totalTime** | ❌ BUG-2 |
| addBlueprint: 去重 | indexOf !== -1 | 同 | ✅ 一致 |
| init: 恢复存档 | saved.forge 解构 | 同 | ✅ 一致 |
| _getWorkshopLevel: TownManager 防御 | typeof check | 同 | ✅ 一致 |

**结论**：18 个审计维度，15 个一致，3 个 Bug 需修复。

---

### 阶段二：Bug 修复

#### T2 — 修复 4 个已知 Bug

**T2-a: 修复 BUG-1 + BUG-2 — getState() 神话锻造信息提取**

**文件**：`js/modules/forge-manager.js` 第 290–312 行

**修改内容**：
1. 将 `job.isMythic` 改为 `job.quality === 6`
2. 将 `job.blueprintId` → `job.recipeId`
3. 将 `job.progress` → `job.elapsedTime`
4. 将 `job.requiredTime` → `job.totalTime`

**T2-b: 修复 BUG-3 — _completeForge() 模块边界违规**

**文件**：`js/modules/forge-manager.js` 第 161 行

**修改内容**：
- 将 `EquipmentManager._inventory.push(equip)` 改为 `EquipmentManager.addToInventory(equip)`

**T2-c: 修复 BUG-4 — forge-panel.js 事件名错误**

**文件**：`js/ui/forge-panel.js` 第 10–11 行

**修改内容**：
- 将 `forge:mythic_completed` 改为 `forge:completed`（注意：第 9 行已正确监听 `forge:completed`，所以第 10 行应去重或改为监听 `forge:progress`）
- 将 `forge:mythic_paused` 改为 `forge:paused`

---

### 阶段三：规范同步

#### T3 — 更新 core-contracts.md

**文件**：`specs/system/core-contracts.md`

**修改内容**：
1. 服务表新增 ForgeManager 行
2. 跨模块写操作白名单新增 ForgeManager → ResourceManager 和 ForgeManager → EquipmentManager
3. 事件表新增 forge:started/completed/paused/progress
4. 存档格式新增 `"forge"` key

---

### 阶段四：测试生成

#### T4 — 生成测试文件 `tests/forge-manager.test.html`

**规范引用**：`specs/services/forge-manager.md` §能力1–6（全部 32 个场景）

**Mock 策略**：

```javascript
// 1. MockResourceManager — 替换全局 ResourceManager
var ResourceManager = {
  _resources: { gold: 0, iron: 0, wood: 0, stone: 0 },
  _spent: [],
  reset: function(r) { this._resources = r || {gold:99999,iron:99999,wood:99999,stone:99999}; this._spent = []; },
  canAfford: function(type, amount) { return (this._resources[type] || 0) >= amount; },
  spend: function(type, amount) { this._resources[type] -= amount; this._spent.push({type:type,amount:amount}); }
};

// 2. MockTownManager — 替换全局 TownManager
var TownManager = {
  _buildings: {},
  reset: function(b) { this._buildings = b || { weapon_workshop: 10, blacksmith: 10 }; },
  getState: function() { return { buildings: this._buildings }; }
};

// 3. MockEquipmentManager — 替换全局 EquipmentManager
var EquipmentManager = {
  _inventory: [],
  _overflow: [],
  _maxSlots: 50,
  reset: function() { this._inventory = []; this._overflow = []; },
  addToInventory: function(equip) {
    if (!equip) return false;
    if (this._inventory.length < this._maxSlots) { this._inventory.push(equip); return true; }
    if (this._overflow.length < 10) { this._overflow.push(equip); return true; }
    return false;
  }
};

// 4. Mock EquipmentData
var EquipmentData = [
  { id:'eq_g1', name:'铁剑', type:'weapon', quality:2, statType:'atk', statRange:[3,8], emoji:'🗡️' },
  { id:'eq_b1', name:'霜寒枪', type:'weapon', quality:3, statType:'atk', statRange:[15,25], emoji:'🔱' }
];

// 5. Mock BlueprintData + getMythicTemplate
var BlueprintData = {
  'bp_001': { name:'青龙偃月刀·图纸', equipId:'eq_m01', emoji:'⚔️', setId:'set_01' }
};
function getMythicTemplate(equipId) {
  if (equipId === 'eq_m01') return { id:'eq_m01', name:'青龙偃月刀', type:'weapon', quality:6, emoji:'⚔️', statType:'atk', statRange:[50,80], setId:'set_01', description:'神话武器' };
  return null;
}

// 6. EventBus 拦截 + 重置
var _emitted = [];
// EventBus.emit 劫持...
function clearEmits() { _emitted.length = 0; }
function getEmits(event) { return _emitted.filter(function(e){ return e.event === event; }); }

// 7. 重置 ForgeManager
function resetFM() {
  ForgeManager._state = { queue: [], maxQueue: 1, blueprints: [] };
  ResourceManager.reset();
  TownManager.reset();
  EquipmentManager.reset();
  clearEmits();
}
```

**测试覆盖要求**（32 个场景）：

```
section('能力1 普通锻造')
  test('C1-S1: 正常启动绿色锻造')
  test('C1-S2: 队列已满，返回false')
  test('C1-S3: 建筑等级不足')
  test('C1-S4: 资源不足')
  test('C1-S5: qualityIndex越界')

section('能力2 神话锻造')
  test('C2-S1: 正常启动神话锻造')
  test('C2-S2: 没有图纸')
  test('C2-S3: 建筑等级不足')
  test('C2-S4: BlueprintData不存在')
  test('C2-S5: workshopLv=15时间计算')

section('能力3 锻造推进')
  test('C3-S1: 队列为空')
  test('C3-S2: 普通锻造完成')
  test('C3-S3: 普通锻造进行中')
  test('C3-S4: 神话锻造资源充足')
  test('C3-S5: 神话锻造资源不足暂停')
  test('C3-S6: 暂停恢复')
  test('C3-S7: 暂停中资源仍不足')
  test('C3-S8: 神话锻造完成')
  test('C3-S9: 无候选模板静默失败')
  test('C3-S10: getMythicTemplate返回null')
  test('C3-S11: 背包满时进overflow')

section('能力4 图纸管理')
  test('C4-S1: 新图纸添加')
  test('C4-S2: 重复图纸不添加')
  test('C4-S3: null图纸')

section('能力5 查询接口')
  test('C5-S1: getQueue返回引用')
  test('C5-S2: getBlueprints返回引用')
  test('C5-S3: getNormalRecipes返回4项')
  test('C5-S4: getMaxQueue返回值')

section('能力6 初始化与存档')
  test('C6-S1: init(undefined)默认状态')
  test('C6-S2: init恢复存档')
  test('C6-S3: getState含神话任务')
  test('C6-S4: getState无神话任务')
```

**关键断言说明**：

| 场景 | 关键断言 |
|------|----------|
| C1-S1 | `result===true`, `queue.length===1`, `queue[0].recipeId==='normal_q2'`, ResourceManager._spent 含 gold:500+iron:100 |
| C1-S2 | `result===false`, `getEmits('toast:show')[0].payload.message` 含 '锻造队列已满' |
| C2-S1 | `result===true`, blueprints 不再含 'bp_001', `queue[0].quality===6`, `queue[0].totalTime===86400` |
| C2-S5 | `queue[0].totalTime===57600` |
| C3-S2 | `EquipmentManager._inventory.length===1`, `getEmits('forge:completed').length===1` |
| C3-S5 | `job.paused===true`, `getEmits('forge:paused').length===1` |
| C3-S9 | `EquipmentManager._inventory.length===0`, `queue.length===0` |
| C6-S3 | `state.mythicForge.blueprintId==='eq_m01'`, `state.mythicForge.progress===3600` |

**输出文件**：`tests/forge-manager.test.html`
**验证方式**：浏览器打开，所有 32 个测试 ✅ PASS

---

### 阶段五：验证

#### T5 — 漂移检测

- 运行全部测试确认通过
- 检查规范场景与代码 100% 对齐
- 确认 core-contracts 已同步

---

## 依赖关系图

```
T1（审计）──→ T2（Bug修复）──→ T3（core-contracts）
                     │
                     └──→ T4（测试）──→ T5（验证）
```

- T1 为只读审计，产出偏差列表
- T2 依赖 T1 确认的 Bug 列表
- T3 可与 T4 并行
- T5 在 T2+T3+T4 全部完成后执行

---

## 最终验收清单

| 检查项 | 通过标准 |
|--------|----------|
| T1 审计表格已填写 | 每个维度有明确 ✅/❌ 标注 |
| T2 BUG-1 修复 | getState() 使用 quality===6 判断 |
| T2 BUG-2 修复 | getState() 使用 recipeId/elapsedTime/totalTime |
| T2 BUG-3 修复 | _completeForge 调用 addToInventory |
| T2 BUG-4 修复 | forge-panel.js 监听正确事件名 |
| T3 core-contracts 同步 | 服务表+事件表+写操作白名单+存档格式已更新 |
| T4 测试文件存在 | `tests/forge-manager.test.html` |
| 32 个场景全部覆盖 | 测试 summary 显示 `32/32 PASS` |
| T5 零漂移 | 所有场景 PASS，无行为级漂移 |
