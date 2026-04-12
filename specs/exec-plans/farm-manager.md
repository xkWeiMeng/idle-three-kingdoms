# 执行计划：FarmManager 服务规范 SDD 审计

**规范引用**：[specs/services/farm-manager.md](../services/farm-manager.md)
**核心契约**：[specs/system/core-contracts.md](../system/core-contracts.md)
**创建日期**：2026-04-14

## 背景

FarmManager 代码已存在（640 行），产品规范已有。本次为审计+修复流程：创建服务规范（已完成）→ 逐场景审计代码 → 修复 3 个已知 Bug → 同步 core-contracts → 生成测试 → 漂移检测。

## 已知 Bug

| ID | 严重度 | 描述 |
|----|--------|------|
| BUG-01 | P0 | `removeBug()` L319 调用 `ResourceManager.has()` — 不存在，TypeError |
| BUG-02 | P0 | `removeBug()` L323 使用 `ResourceManager.add('gold', -cost)` — add() 的 amount<=0 守卫静默忽略，不扣金 |
| BUG-03 | P1 | `_tickReady` 枯萎(L119-133) 和 `plant()`(L161-169) 未重置 `isReharvest`，导致后续作物使用错误生长时间 |

## 任务清单

### T1：代码审计 — 逐场景比对（IMPLEMENT）

逐一比对规范中 14 个能力的全部 WHEN/THEN 场景与 `js/modules/farm-manager.js` 代码。

| 场景 | 预期结果 | 需修复 |
|------|----------|--------|
| C1-S1: init 首次游戏 | ✓ 匹配 | — |
| C1-S2: init 恢复存档+补田 | ✓ 匹配 | — |
| C1-S3: getState 深拷贝 | ✓ 匹配 | — |
| C2-S1: plant 成功 | ✓ 匹配 | — |
| C2-S2: plant 种子不足 | ✓ 匹配 | — |
| C2-S3: plant 田地已占用 | ✓ 匹配 | — |
| C2-S4: plant 无效田地 | ✓ 匹配 | — |
| C2-S5: plant 品级不足 | ✓ 匹配 | — |
| C2-S6: plant 未知作物 | ✓ 匹配 | — |
| C3-S1: 生长完成→ready | ✓ 匹配 | — |
| C3-S2: 枯萎 48h | ✓ 匹配（isReharvest 未重置） | **BUG-03** |
| C3-S3: 离线补算 | ✓ 匹配 | — |
| C3-S4: 菜园未建造 | ✓ 匹配 | — |
| C4-S1: harvest 正常 | ✓ 匹配 | — |
| C4-S2: harvest 虫害减产 | ✓ 匹配 | — |
| C4-S3: harvest 自动收获 | ✓ 匹配 | — |
| C4-S4: harvest 施肥增产 | ✓ 匹配 | — |
| C4-S5: harvest 双倍 | ✓ 匹配 | — |
| C4-S6: harvest 连续收割 | ✓ 匹配 | — |
| C4-S7: harvest 未成熟 | ✓ 匹配 | — |
| C5-S1: water 成功 | ✓ 匹配 | — |
| C5-S2: water 已浇过 | ✓ 匹配 | — |
| C5-S3: water 非生长中 | ✓ 匹配 | — |
| C5-S4: water 无效田地 | ✓ 匹配 | — |
| C6-S1: fertilize 成功 | ✓ 匹配 | — |
| C6-S2: fertilize 已施过 | ✓ 匹配 | — |
| C6-S3: fertilize 肥料不足 | ✓ 匹配 | — |
| C6-S4: fertilize 非生长中 | ✓ 匹配 | — |
| C6-S5: fertilize 无效田地 | ✓ 匹配 | — |
| C7-S1: 虫害触发 | ✓ 匹配 | — |
| C7-S2: 虫害不重复 | ✓ 匹配 | — |
| C7-S3: removeBug 成功 | ✗ ResourceManager.has() 不存在 | **BUG-01+02** |
| C7-S4: removeBug 无虫害 | ✓ 匹配 | — |
| C7-S5: removeBug 金币不足 | ✗ has() TypeError | **BUG-01** |
| C8-S1: buySeed 成功+折扣 | ✓ 匹配 | — |
| C8-S2: buySeed 品级不足 | ✓ 匹配 | — |
| C8-S3: buySeed 未建造 | ✓ 匹配 | — |
| C8-S4: buySeed 资源不足 | ✓ 匹配 | — |
| C8-S5: buySeed 未知作物 | ✓ 匹配 | — |
| C9-S1: synthesize 成功 | ✓ 匹配 | — |
| C9-S2: synthesize 等级不足 | ✓ 匹配 | — |
| C9-S3: synthesize 材料不足 | ✓ 匹配 | — |
| C9-S4: synthesize 无效配方 | ✓ 匹配 | — |
| C10-S1: cook 成功 | ✓ 匹配 | — |
| C10-S2: cook 覆盖旧 Buff | ✓ 匹配 | — |
| C10-S3: cook 菜园等级不足 | ✓ 匹配 | — |
| C10-S4: cook 材料不足 | ✓ 匹配 | — |
| C10-S5: cook 未知料理 | ✓ 匹配 | — |
| C11-S1: toggle on | ✓ 匹配 | — |
| C11-S2: toggle off | ✓ 匹配 | — |
| C11-S3: toggle 等级不足 | ✓ 匹配 | — |
| C11-S4: auto tick 执行 | ✓ 匹配 | — |
| C12-S1: makeFertilizer 成功 | ✓ 匹配 | — |
| C12-S2: 未建堆肥坑 | ✓ 匹配 | — |
| C12-S3: 普通作物不足 | ✓ 匹配 | — |
| C12-S4: 肥料已满 | ✓ 匹配 | — |
| C13-S1: sellCrop 成功 | ✓ 匹配 | — |
| C13-S2: sellCrop 数量不足 | ✓ 匹配 | — |
| C14-S1: getActiveBuff 有效 | ✓ 匹配 | — |
| C14-S2: getActiveBuff 过期 | ✓ 匹配 | — |
| C14-S3: getFarmMastery | ✓ 匹配 | — |
| C14-S4: getPlotProgress | ✓ 匹配 | — |
| C14-S5: getPlotProgress null | ✓ 匹配 | — |
| C14-S6: getRemainingTime | ✓ 匹配 | — |

**修复内容**（3 项）：

1. **BUG-01+02**：`removeBug()` L319 `ResourceManager.has('gold', cost)` → `ResourceManager.canAfford('gold', cost)`；L323 `ResourceManager.add('gold', -cost)` → `ResourceManager.spend('gold', cost, 'farming', 'bug_removal')`
2. **BUG-03a**：`_tickReady()` 枯萎重置时补充 `plot.isReharvest = false`
3. **BUG-03b**：`plant()` 播种时补充 `plot.isReharvest = false`（确保旧状态不残留）

### T2：同步 core-contracts

更新 `specs/system/core-contracts.md`：
- 跨模块写操作列表新增 FarmManager 条目
- 跨模块只读查询列表新增 FarmManager → TownManager 条目
- 存档格式新增 `"farm"` 字段
- 事件契约表新增 FarmManager 事件

### T3：编写测试骨架（TEST）

创建 `tests/farm-manager.test.html`，覆盖全部 14 个能力的 WHEN/THEN 场景。

**测试策略**：
- Mock 依赖：ResourceManager、TownManager、EconomyManager、EventBus.emit
- 使用项目现有微型测试框架格式（同 hero-manager.test.html）
- 加载真实 CropData/GardenLevelData/FarmMasteryData/CropSynthesis/RecipeData
- 每个 test() 前 reset FarmManager 状态

**场景-测试映射**：

| 能力 | 场景数 | 测试方法数 |
|------|--------|-----------|
| C1: 初始化与持久化 | 3 | 3 |
| C2: 播种 | 6 | 6 |
| C3: 生长与枯萎 | 4 | 4 |
| C4: 收获 | 7 | 7 |
| C5: 浇水 | 4 | 4 |
| C6: 施肥 | 5 | 5 |
| C7: 虫害与除虫 | 5 | 5 |
| C8: 购买种子 | 5 | 5 |
| C9: 种子合成 | 4 | 4 |
| C10: 料理 | 5 | 5 |
| C11: 自动收获 | 4 | 4 |
| C12: 制作肥料 | 4 | 4 |
| C13: 出售作物 | 2 | 2 |
| C14: 查询 API | 6 | 6 |
| **合计** | **62** | **62** |

### T4：漂移检测（VERIFY）

- 运行全部测试，确认通过
- 检查规范场景与代码 100% 对齐

### T5：变更记录（CHANGELOG）

- 更新 `specs/changelog.md`
- 更新 `specs/.sdd-state.json`

## 验证标准

- [ ] BUG-01/02 修复后 removeBug 正确扣除 50 金
- [ ] BUG-03 修复后 isReharvest 在枯萎和播种时正确重置
- [ ] core-contracts 包含 FarmManager 条目
- [ ] 62/62 测试场景有测试骨架
- [ ] 规范-代码零漂移
