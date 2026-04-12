# 执行计划：TownManager

**规范引用**：[specs/services/town-manager.md](../services/town-manager.md)（Active）
**道路子系统**：[specs/product-specs/town-road-system.md](../product-specs/town-road-system.md)（Active）
**核心契约**：[specs/system/core-contracts.md](../system/core-contracts.md)
**实现代码**：`js/modules/town-manager.js`（777 行）
**建筑数据**：`js/data/buildings.js`（641 行）
**创建日期**：2026-04-14

## 背景

TownManager 代码已存在，规范通过逆向工程从代码生成并经 spec-reviewer 审查提升为 Active。本次为**规范审计**流程——验证代码与规范 100% 对齐、为所有 WHEN/THEN 场景创建测试、修复发现的差异。

规范包含 **12 个能力**、**~79 个 WHEN/THEN 场景**、**8 条不变量**、**5 条已知限制**。

## 能力清单与场景统计

| 能力 | 描述 | 场景数 | 接口数 |
|------|------|--------|--------|
| C1 | 初始化与存档 | 5 | 2 (init, getState) |
| C2 | 建筑状态查询 | 10 | 7 (getBuildingLevel, getBuildingState, isBuilding, getBuildingProgress, getRemainingBuildTime, getActiveBuildCount, getMaxBuildSlots) |
| C3 | 升级费用与时间查询 | 3 | 2 (getUpgradeCost, getBuildTime) |
| C4 | 建筑升级 | 12 | 2 (canUpgrade, startUpgrade) |
| C5 | 施工加速 | 4 | 1 (speedUpBuild) |
| C6 | Tick 处理 | 5 | 1 (onTick) |
| C7 | 战斗加成查询 | 12 | 8 (getAtkBonus, getDefBonus, getHpBonus, getExpBonus, getSpdBonus, getFirstStrikeChance, getEquipQualityBonus, getSkillCooldownReduction) |
| C8 | 资源上限与产出率 | 14 | 6 (getResourceCap, getProductionRate, getOfflineEfficiency, getRecruitDiscount, getDropRateBonus, getBoosterLevel) |
| C9 | 集市交易 | 9 | 3 (canTrade, getTradeRate, executeTrade) |
| C10 | 建筑分类查询 | 1 | 1 (getBuildingsByCategory) |
| C11 | 道路网络 MST | 2 | 7 (recalcRoads, _getBuildingEntrance, _isBuildingAt, _isAnyBuildingAt, _layPath, _traceLPath, _bfsPath) |
| C12 | 碰撞网格代理 | 2 | 1 (getCollisionGrid) |
| **合计** | | **~79** | **41** |

## 依赖关系图

```
T1 ──────────────────────────────── T2 ──┐
(审计)                              (修复) │
                                         ├── T4 (测试 C1-C3)
T3 ─────────────────────────────────────┤
(测试 Mock 基础设施)                       ├── T5 (测试 C4-C6)
                                         ├── T6 (测试 C7-C10)
                                         ├── T7 (测试 C11-C12)
                                         │
                                         └── T8 (漂移检测 + 验证)
                                              │
                                              T9 (变更记录)
```

**可并行**：T1 与 T3（审计与测试基础设施可同时进行）
**顺序约束**：T1 → T2 → T4-T7 → T8 → T9；T3 → T4-T7

---

## 任务列表

### Phase 1: 审计（只读分析）

#### T1: 代码审计 — 逐能力逐场景比对（AUDIT）

- **依赖**: 无
- **输入**: `specs/services/town-manager.md` 全部 12 个能力的 WHEN/THEN 场景 + `js/modules/town-manager.js` 代码
- **动作**:
  1. 逐一比对规范中每个 WHEN/THEN 场景与对应代码实现
  2. 对每个场景标注：✓ 匹配 / ✗ 不匹配（记录差异细节）
  3. 检查规范中 8 条不变量在代码中是否被遵守
  4. 检查规范 "已知限制" 中的 5 条是否准确描述代码现状
  5. **注意**：规范由代码逆向生成，预期大部分匹配，重点关注边界场景
- **验证**: 产出完整审计表，每个场景有明确的匹配/不匹配结论
- **输出**: 审计报告（嵌入执行过程记录或工作笔记）

**审计检查表**（按能力分组）：

**C1: 初始化与存档**（5 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C1-S1 | 新玩家 saved=undefined, town_hall Lv.1 | L39-67 | 验证 |
| C1-S2 | 从存档加载 buildings 恢复 | L40-53 | 验证 |
| C1-S3 | 旧存档缺少 parking_lot 用默认值 | L43-49 | 验证 |
| C1-S4 | roads 越界条目被过滤 | L56-63 | 验证 |
| C1-S5 | getState() 深拷贝 | L774-776 | 验证 |

**C2: 建筑状态查询**（10 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C2-S1 | getBuildingLevel 正常返回 | L153-156 | 验证 |
| C2-S2 | getBuildingLevel 未知建筑返回 0 | L155 | 验证 |
| C2-S3 | getBuildingState 正常返回 | L158-159 | 验证 |
| C2-S4 | getBuildingState 未知返回 null | L159 | 验证 |
| C2-S5 | isBuilding 正在施工 | L177-178 | 验证 |
| C2-S6 | isBuilding 无施工/已过期 | L178 | 验证 |
| C2-S7 | getBuildingProgress 无施工返回 null | L183 | 验证 |
| C2-S8 | getBuildingProgress 进行中 | L186-189 | 验证 |
| C2-S9 | getRemainingBuildTime 正常/无施工 | L192-196 | 验证 |
| C2-S10 | getActiveBuildCount + getMaxBuildSlots | L198-211 | 验证 |

**C3: 升级费用与时间**（3 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C3-S1 | getUpgradeCost 正常 | L162-169 | 验证 |
| C3-S2 | getUpgradeCost 未知建筑返回 null | L164 | 验证 |
| C3-S3 | getBuildTime 计算 | L171-174 | 验证 |

**C4: 建筑升级**（12 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C4-S1 | canUpgrade 所有前置通过 → ok | L213-281 | 验证 |
| C4-S2 | 检查 1: 未知建筑 | L215 | 验证 |
| C4-S3 | 检查 2: 正在施工 | L221-223 | 验证 |
| C4-S4 | 检查 3: 施工队列满 | L226-228 | 验证 |
| C4-S5 | 检查 4: 城主府等级上限 | L231-237 | 验证 |
| C4-S6 | 检查 5: 建筑最大等级 | L240-242 | 验证 |
| C4-S7 | 检查 6: 城主府关卡前置 | L245-252 | 验证 |
| C4-S8 | 检查 7: 建筑前置依赖 | L255-265 | 验证 |
| C4-S9 | 检查 8: 建筑槽位 | L268-273 | 验证 |
| C4-S10 | 检查 9: 资源不足 | L276-279 | 验证 |
| C4-S11 | startUpgrade 成功流程 | L284-298 | 验证 |
| C4-S12 | startUpgrade 失败不扣资源 | L285-286 | 验证 |

**C5: 施工加速**（4 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C5-S1 | 加速成功 | L300-311 | 验证 |
| C5-S2 | 无施工返回 false | L302 | 验证 |
| C5-S3 | jadeCost <= 0 返回 false | L306 | 验证 |
| C5-S4 | 玉璧不足返回 false | L308 | 验证 |

**C6: Tick 处理**（5 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C6-S1 | 施工完成：level++, 事件, roads | L101-118 | 验证 |
| C6-S2 | 无施工完成 | L108 | 验证 |
| C6-S3 | 产出：lumber_camp + watermill 加成 | L121-148 | 验证 |
| C6-S4 | 产出：tax_office 无加成器 | L122-123 | 验证 |
| C6-S5 | 产出：level=0 不产出 | L127 | 验证 |

**C7: 战斗加成查询**（12 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C7-S1 | getAtkBonus 兵营+武器工坊 | L328-336 | 验证 |
| C7-S2 | getAtkBonus 都为 0 | L330-335 | 验证 |
| C7-S3 | getDefBonus 城墙 | L338-342 | 验证 |
| C7-S4 | getDefBonus 城墙 Lv.0 | L340 | 验证 |
| C7-S5 | getHpBonus 城墙 | L344-348 | 验证 |
| C7-S6 | getExpBonus 校场+书院 | L350-358 | 验证 |
| C7-S7 | getSpdBonus 马厩 | L378-382 | 验证 |
| C7-S8 | getSpdBonus Lv.0 | L380 | 验证 |
| C7-S9 | getFirstStrikeChance | L384-388 | 验证 |
| C7-S10 | getEquipQualityBonus | L390-394 | 验证 |
| C7-S11 | getSkillCooldownReduction | L396-400 | 验证 |
| C7-S12 | getSkillCooldownReduction 封顶 | L399 | 验证 |

**C8: 资源上限与产出率**（14 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C8-S1 | getResourceCap gold + warehouse | L409-424 | 验证 |
| C8-S2 | getResourceCap food + farmland 特殊 | L419-422 | 验证 |
| C8-S3 | getResourceCap jade → Infinity | L411 | 验证 |
| C8-S4 | getResourceCap 无仓库→基础上限 | L415-416 | 验证 |
| C8-S5 | getProductionRate wood + booster | L427-446 | 验证 |
| C8-S6 | getProductionRate gold 无加成器 | L436-437 | 验证 |
| C8-S7 | getProductionRate food → 0 | L430 | 验证 |
| C8-S8 | getProductionRate level=0 → 0 | L432 | 验证 |
| C8-S9 | getOfflineEfficiency 默认 0.50 | L362 | 验证 |
| C8-S10 | getOfflineEfficiency guild Lv.5 | L363 | 验证 |
| C8-S11 | getRecruitDiscount Lv.0 → 0 | L367 | 验证 |
| C8-S12 | getRecruitDiscount Lv.5 | L369 | 验证 |
| C8-S13 | getDropRateBonus Lv.10 | L374 | 验证 |
| C8-S14 | getBoosterLevel 映射 | L402-407 | 验证 |

**C9: 集市交易**（9 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C9-S1 | canTrade wood Lv.1 → true | L450-458 | 验证 |
| C9-S2 | canTrade stone Lv.1 → false | L455 | 验证 |
| C9-S3 | canTrade iron Lv.3 → false | L456 | 验证 |
| C9-S4 | canTrade Lv.0 → false | L452 | 验证 |
| C9-S5 | getTradeRate 无折扣 | L460-465 | 验证 |
| C9-S6 | getTradeRate Lv.3 打折 | L463-464 | 验证 |
| C9-S7 | executeTrade 成功 | L467-478 | 验证 |
| C9-S8 | executeTrade canTrade 失败 | L468 | 验证 |
| C9-S9 | executeTrade 金币不足 | L471 | 验证 |

**C10: 建筑分类**（1 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C10-S1 | getBuildingsByCategory 全分类 | L482-492 | 验证 |

**C11: 道路网络**（2 场景，完整场景在 town-road-system.md）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C11-S1 | recalcRoads ≥ 2 建筑 | L559-654 | 验证 |
| C11-S2 | recalcRoads < 2 建筑 → 清空 | L572-579 | 验证 |

**C12: 碰撞网格代理**（2 场景）

| 场景 ID | 描述 | 代码位置 | 预期 |
|---------|------|----------|------|
| C12-S1 | TownWorld 存在 → 委托 | L767-769 | 验证 |
| C12-S2 | TownWorld 不存在 → null | L770-771 | 验证 |

---

### Phase 2: 修复差异

#### T2: 修复代码-规范差异（IMPLEMENT）

- **依赖**: T1
- **输入**: T1 审计报告中标注 ✗ 的场景列表
- **动作**:
  1. 对每个 ✗ 场景，分析差异原因（代码 bug？规范描述偏差？）
  2. 优先修复代码以匹配规范（规范为 Active 状态，是 source of truth）
  3. 若规范描述与实际需求不符，则更新规范并记录 changelog
  4. 每个修复单独提交，commit message 引用场景 ID
- **验证**:
  - 修复后的代码逻辑与规范场景描述完全一致
  - 修复不引入新的回归（通过 T4-T7 的测试验证）
- **输出**: `js/modules/town-manager.js` 的修改（如需要）

**预期修复范围**：由于规范为逆向生成，预期差异较少。重点关注：
- `getBuildingState` 返回直接引用（规范已记录为已知限制 #5，不需修复）
- `speedUpBuild` 依赖下一个 tick（规范已记录为已知限制 #4，不需修复）
- `getMaxBuildSlots` 简化实现（规范已记录为已知限制 #1，不需修复）

---

### Phase 3: 测试

#### T3: 创建测试基础设施 — Mock 层（TEST-INFRA）

- **依赖**: 无（可与 T1 并行）
- **输入**: `specs/services/town-manager.md` 外部依赖表、`tests/hero-manager.test.html` 测试模板
- **动作**:
  1. 创建 `tests/town-manager.test.html` 文件框架
  2. 加载真实依赖：`constants.js`, `event-bus.js`, `utils.js`, `buildings.js`
  3. 创建 Mock 对象：
     - `ResourceManager` mock — `canAfford`, `canAffordMultiple`, `spend`, `spendMultiple`, `add`（带调用记录）
     - `BattleManager` mock — `isStageCleared`（可配置返回值）
     - `TownWorld` mock — `_defaultPositions`, `_buildingSizes`, `MAP_W`, `MAP_H`, `getCollisionGrid`, `_buildRoadGrid`
     - `EventBus.emit` 拦截器（记录所有发射的事件）
  4. 创建 `resetAll()` 函数：每个 test 前重置 TownManager 状态、清空 mock 记录
  5. 复用项目微型测试框架（section/test/assert 模式）
- **验证**:
  - Mock 层能正确拦截所有外部调用
  - `resetAll()` 能可靠地将 TownManager 恢复到初始状态
  - HTML 文件可在浏览器中直接打开运行
- **输出**: `tests/town-manager.test.html` 的基础框架（含 Mock + 测试框架，无具体测试用例）

**Mock 规格**：

```javascript
// ResourceManager mock
var ResourceManager = {
  _calls: [],
  _canAffordResult: true,
  canAfford: function(type, amount) { this._calls.push({m:'canAfford',type,amount}); return this._canAffordResult; },
  canAffordMultiple: function(cost) { this._calls.push({m:'canAffordMultiple',cost}); return this._canAffordResult; },
  spend: function(type, amount, cat, sub, id) { this._calls.push({m:'spend',type,amount,cat,sub,id}); },
  spendMultiple: function(cost, cat, sub, id) { this._calls.push({m:'spendMultiple',cost,cat,sub,id}); },
  add: function(type, amount, cat, sub, id) { this._calls.push({m:'add',type,amount,cat,sub,id}); },
  reset: function() { this._calls = []; this._canAffordResult = true; }
};

// BattleManager mock
var BattleManager = {
  _stageResults: {},
  isStageCleared: function(stage) { return !!this._stageResults[stage]; },
  reset: function() { this._stageResults = {}; }
};

// TownWorld mock (needed for C11, C12)
var TownWorld = {
  MAP_W: 40, MAP_H: 40,
  _buildingSizes: { /* all 24 buildings */ },
  _defaultPositions: { /* defaults */ },
  _collisionGrid: null,
  _buildRoadGrid: function() { TownWorld._buildRoadGridCalled = true; },
  _buildRoadGridCalled: false,
  getCollisionGrid: function() { return this._collisionGrid; },
  reset: function() { this._buildRoadGridCalled = false; this._collisionGrid = null; }
};

// CONSTANTS mock
var CONSTANTS = {
  RESOURCE_BASE_CAP: { gold: 50000, wood: 2000, stone: 2000, iron: 1000, food: 200 }
};
```

---

#### T4: 测试 C1-C3 — 基础层（TEST）

- **依赖**: T2, T3
- **输入**: 规范 C1 (5 场景) + C2 (10 场景) + C3 (3 场景) = **18 个测试**
- **动作**:
  1. 在 `tests/town-manager.test.html` 中添加 `section('C1: 初始化与存档')` 下的 5 个 test
  2. 添加 `section('C2: 建筑状态查询')` 下的 10 个 test
  3. 添加 `section('C3: 升级费用与时间查询')` 下的 3 个 test
- **验证**:
  - 18/18 测试通过
  - 每个测试的 assert 条件直接映射到规范中的 THEN 条件
- **输出**: `tests/town-manager.test.html` 追加 18 个测试用例

**关键测试点**：
- C1: init 无参数→默认状态；init 有参数→恢复；旧存档兼容；roads 过滤；getState 深拷贝
- C2: 正常/未知建筑的 getBuildingLevel、getBuildingState；施工状态判断；进度计算；getMaxBuildSlots 阈值
- C3: costFormula 委托；town_hall level=0 防御特例；_getBuildTime 数值

---

#### T5: 测试 C4-C6 — 核心机制（TEST）

- **依赖**: T2, T3
- **输入**: 规范 C4 (12 场景) + C5 (4 场景) + C6 (5 场景) = **21 个测试**
- **动作**:
  1. `section('C4: 建筑升级')` — 10 个 canUpgrade 检查 + 2 个 startUpgrade
  2. `section('C5: 施工加速')` — 4 个 speedUpBuild
  3. `section('C6: Tick 处理')` — 5 个 onTick
- **验证**:
  - 21/21 测试通过
  - canUpgrade 的 9 项检查按规范顺序逐一验证
  - onTick 产出逻辑的数值精度通过（加成器乘数、累积器投放）
- **输出**: `tests/town-manager.test.html` 追加 21 个测试用例

**关键测试点**：
- C4: 9 项检查的逐一隔离测试（每次只让一项失败）；startUpgrade 的事件发射和资源扣除验证
- C5: jadeCost 计算 `ceil(remainSec/60)`；buildEndTime 设为 Date.now()
- C6: 施工完成的 level++ 和事件；产出累积器精度；加成器乘数计算

**Mock 配置**：
- canUpgrade 测试需精确控制 ResourceManager.canAffordMultiple 返回值
- C4-S7 需配置 BattleManager.isStageCleared 返回 false
- C6 产出测试需验证 ResourceManager.add 的调用参数

---

#### T6: 测试 C7-C10 — 查询层（TEST）

- **依赖**: T2, T3
- **输入**: 规范 C7 (12 场景) + C8 (14 场景) + C9 (9 场景) + C10 (1 场景) = **36 个测试**
- **动作**:
  1. `section('C7: 战斗加成查询')` — 12 个 getter 测试
  2. `section('C8: 资源上限与产出率')` — 14 个测试
  3. `section('C9: 集市交易')` — 9 个测试
  4. `section('C10: 建筑分类查询')` — 1 个测试
- **验证**:
  - 36/36 测试通过
  - 数值计算与 BuildingData 公式对齐（直接调用 effects(lv) 进行数值断言）
  - getResourceCap food 特殊路径覆盖
  - executeTrade 的 EventBus 事件载荷验证
- **输出**: `tests/town-manager.test.html` 追加 36 个测试用例

**关键测试点**：
- C7: 叠加加成（atkBonus = barracks + weapon_workshop）、level=0 返回 0 的统一行为、getOfflineEfficiency 默认 0.50 例外
- C8: getResourceCap 的仓库加成公式 `baseCap + floor(baseCap × capBonus)`；food 的三项叠加 `baseCap + foodExtra + floor(baseCap × capBonus)`；jade → Infinity
- C9: canTrade 的等级门槛（wood@1, stone@2, iron@4）；tradeRate 的折扣阶梯；executeTrade 事件载荷
- C10: 24 种建筑全部出现且分类正确

---

#### T7: 测试 C11-C12 — 子系统（TEST）

- **依赖**: T2, T3
- **输入**: 规范 C11 (2 场景) + C12 (2 场景) = **4 个测试** + 道路系统内部方法验证
- **动作**:
  1. `section('C11: 道路网络 MST')` — recalcRoads 两个核心场景 + 入口点计算
  2. `section('C12: 碰撞网格代理')` — TownWorld 存在/不存在
- **验证**:
  - 4/4+ 测试通过
  - recalcRoads 在 < 2 建筑时清空 roads 并发射事件
  - recalcRoads 在 ≥ 2 建筑时生成非空 roads 数组
  - getCollisionGrid 正确委托
- **输出**: `tests/town-manager.test.html` 追加测试用例

**关键测试点**：
- C11: 需配置 TownWorld mock 的 `_buildingSizes` 和 `_defaultPositions`，设置 2+ 个建筑 level > 0 后调用 recalcRoads，验证 `_state.roads` 非空且每个元素有 gx/gy/usage
- C12: 测试 TownWorld 存在和 `typeof TownWorld === 'undefined'` 两个分支（后者需临时删除 mock）

**测试限制**：道路系统的完整路径质量验证（MST 性质、L 形路径选择、BFS 绕行）属于 [town-road-system.md](../product-specs/town-road-system.md) 的范围，本计划仅验证 TownManager 侧的接口契约。

---

### Phase 4: 验证与收尾

#### T8: 漂移检测 + 不变量验证（VERIFY）

- **依赖**: T4, T5, T6, T7
- **输入**: 全部测试结果 + 规范不变量列表
- **动作**:
  1. 在浏览器中打开 `tests/town-manager.test.html`，确认全部测试通过
  2. 逐条验证 8 条不变量：

     | # | 不变量 | 验证方式 |
     |---|--------|----------|
     | 1 | 城主府永不 Lv.0 | 检查 init 默认值 + 无降级路径 |
     | 2 | 等级只增不减 | 检查无 level-- 代码路径 |
     | 3 | 施工先扣后建 | 检查 startUpgrade: spendMultiple 在 buildEndTime 之前 |
     | 4 | 产出通过累积器 | 检查 onTick 中 _productionAccum 逻辑 |
     | 5 | 通信通过 EventBus | grep 确认无直接 UI 调用 |
     | 6 | getState 返回深拷贝 | C1-S5 测试覆盖 |
     | 7 | 加成 getter 默认 0 | C7 测试覆盖 |
     | 8 | canUpgrade 无副作用 | C4 测试中验证调用前后状态不变 |

  3. 检查规范中 5 条已知限制是否仍然准确
  4. 确认没有代码中存在但规范未覆盖的公开方法
- **验证**:
  - 全部 ~79 个测试通过（0 失败）
  - 8/8 不变量已验证
  - 无未覆盖的公开接口
- **输出**: 验证报告

---

#### T9: 变更记录（CHANGELOG）

- **依赖**: T8
- **输入**: T1 审计结果、T2 修复内容、T4-T7 测试文件
- **动作**:
  1. 更新 `specs/changelog.md`：记录审计完成、测试创建、修复内容（如有）
  2. 更新 `specs/.sdd-state.json`（如存在）
  3. 在 `specs/services/town-manager.md` 的 changelog 段落追加审计记录
- **验证**: changelog 条目包含日期、变更内容、影响的场景 ID
- **输出**: changelog 更新

---

## 最终验证清单

- [ ] **审计完成**：12 个能力的 ~79 个 WHEN/THEN 场景全部比对完毕
- [ ] **代码修复**：所有 ✗ 场景已修复或已记录为已知限制
- [ ] **测试覆盖**：`tests/town-manager.test.html` 包含 ~79 个测试
- [ ] **测试通过**：在浏览器中全部 PASS，0 FAIL
- [ ] **不变量验证**：8/8 条不变量在代码中被遵守
- [ ] **接口完整性**：规范列出的 41 个接口全部有测试覆盖
- [ ] **Mock 完整**：ResourceManager、BattleManager、TownWorld、EventBus 全部正确 mock
- [ ] **无残留漂移**：规范与代码 100% 对齐
- [ ] **Changelog 更新**：变更已记录

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 道路系统测试依赖 TownWorld mock 复杂度高 | T7 阻塞 | 最小化 mock：仅 mock _buildingSizes 和 _defaultPositions 必要字段 |
| BuildingData 公式变更导致数值断言失败 | T6 脆性 | 测试中调用 BuildingData.xxx.effects(lv) 获取预期值，而非硬编码数字 |
| Date.now() 时间敏感测试不稳定 | T5 闪烁 | 在 speedUpBuild/isBuilding 测试中使用足够大的时间窗口（+60000ms） |
| 规范逆向生成遗漏隐含行为 | T1 漏检 | 审计时不仅检查规范场景，还要检查代码中是否有规范未覆盖的边界行为 |

## 工作量预估

| 任务 | 预估时间 | 说明 |
|------|----------|------|
| T1 审计 | 30 min | 79 场景逐一比对 |
| T2 修复 | 10 min | 预期差异少 |
| T3 Mock 基础设施 | 20 min | Mock 层 + 框架 |
| T4 测试 C1-C3 | 25 min | 18 个测试 |
| T5 测试 C4-C6 | 30 min | 21 个测试，canUpgrade 逻辑复杂 |
| T6 测试 C7-C10 | 35 min | 36 个测试，数值断言多 |
| T7 测试 C11-C12 | 15 min | 4+ 个测试，mock 需精细 |
| T8 漂移检测 | 10 min | 运行测试 + 不变量检查 |
| T9 Changelog | 5 min | 记录变更 |
| **合计** | **~3 小时** | |
