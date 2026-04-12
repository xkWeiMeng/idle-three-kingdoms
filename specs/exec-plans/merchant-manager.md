# 执行计划：MerchantManager

**规范引用**：[specs/services/merchant-manager.md](../services/merchant-manager.md)
**核心契约**：[specs/system/core-contracts.md](../system/core-contracts.md)
**创建日期**：2026-04-14

## 背景

MerchantManager 代码已存在，本次为审计+修复流程。规范经 2 次审查提升为 Active。规范记录了 3 个已知问题（`_inventory.push` 直接操作、无用模板查找、`buyPermanent` 金币泄漏 Bug）。

## 任务清单

### T1：代码审计 — 逐场景比对（IMPLEMENT）

逐一比对规范中 7 个能力的全部 26 个 WHEN/THEN 场景与 `js/modules/merchant-manager.js` 代码。

| 场景 ID | 场景描述 | 预期结果 | 需修复 |
|---------|----------|----------|--------|
| C1-S1 | init 恢复存档（未过期） | ✓ 匹配 | — |
| C1-S2 | init 首次游戏 | ✓ 匹配 | — |
| C1-S3 | init 存档已过期 | ✓ 匹配 | — |
| C1-S4 | getState 深拷贝 | ✓ 匹配 | — |
| C2-S1 | onTick 未到刷新时间 | ✓ 匹配 | — |
| C2-S2 | onTick 到刷新时间 | ✓ 匹配 | — |
| C3-S1 | manualRefresh 玉璧充足 | ✓ 匹配 | — |
| C3-S2 | manualRefresh 玉璧不足 | ✓ 匹配 | — |
| C4-S1 | 刷新生成 ≤6 件商品 | ✓ 匹配 | — |
| C4-S2 | 蓝色武器定价范围 | ✓ 匹配 | — |
| C4-S3 | 橙色坐骑定价范围 | ✓ 匹配 | — |
| C4-S4 | 模板缺失时跳过 | ✓ 匹配 | — |
| C5-S1 | buyNormal 成功购买 | ✓ 匹配（修复后） | _inventory.push→addToInventory |
| C5-S2 | buyNormal 已售出 | ✓ 匹配 | — |
| C5-S3 | buyNormal 不存在 | ✓ 匹配 | — |
| C5-S4 | buyNormal 金币不足 | ✓ 匹配 | — |
| C5-S5 | buyNormal 背包已满 | ✓ 匹配 | — |
| C6-S1 | buyPermanent 成功购买 | ✓ 匹配（修复后） | _inventory.push→addToInventory + 模板前置 |
| C6-S2 | buyPermanent 已购买 | ✓ 匹配 | — |
| C6-S3 | buyPermanent 金币不足 | ✓ 匹配 | — |
| C6-S4 | buyPermanent 背包已满 | ✓ 匹配 | — |
| C6-S5 | buyPermanent 模板不存在 | ✓ 匹配（修复后） | 模板检查前置，不扣金币 |
| C7-S1 | getNormalStock 返回列表 | ✓ 匹配 | — |
| C7-S2 | getPermanentStock 返回 3 件 | ✓ 匹配 | — |
| C7-S3 | getRefreshCountdown 正常 | ✓ 匹配 | — |
| C7-S4 | getRefreshCountdown 已过期 | ✓ 匹配 | — |

**已知需修复项**（规范已标记的 Bug）：
1. ⚠️ `buyNormal` + `buyPermanent`：`EquipmentManager._inventory.push(equip)` → 应改为 `EquipmentManager.addToInventory(equip)`
2. ⚠️ `buyPermanent`：模板检查在 spend 之后 → 应将 `getMythicTemplate` 检查移到 `ResourceManager.spend` 之前

### T2：代码修复（IMPLEMENT）

基于 T1 审计结果，修复规范标记的已知问题和新发现的不一致：

1. **`_inventory.push` → `addToInventory`**：
   - 修改 `buyNormal`（第 171 行）：`EquipmentManager._inventory.push(equip)` → `EquipmentManager.addToInventory(equip)`
   - 修改 `buyPermanent`（第 224 行）：同上
   
2. **`buyPermanent` 模板检查前置**：
   - 将 `getMythicTemplate(equipId)` 检查移到 `ResourceManager.spend()` 之前
   - 模板不存在时直接返回 `false`，不扣金币

3. 修复后需同步更新规范（移除 ⚠️ 标记，更新行为描述）

### T3：编写测试骨架（TEST）

创建 `tests/merchant-manager.test.html`，覆盖全部 26 个 WHEN/THEN 场景。

**测试策略**：
- Mock 依赖：ResourceManager、EquipmentManager、EventBus.emit
- Mock 数据：EquipmentData、MerchantPermanentStock、getMythicTemplate
- 使用项目现有微型测试框架格式
- 每个 test() 前 reset MerchantManager._state
- 控制随机性：mock Utils.randInt、Math.random

**场景-测试映射**：

| 能力 | 场景数 | 测试方法数 |
|------|--------|-----------|
| C1: 初始化与存档 | 4 | 4 |
| C2: 库存自动刷新 | 2 | 2 |
| C3: 手动刷新 | 2 | 2 |
| C4: 商品生成规则 | 4 | 4 |
| C5: 购买普通商品 | 5 | 5 |
| C6: 购买镇店之宝 | 5 | 5 |
| C7: 查询接口 | 4 | 4 |
| **合计** | **26** | **26** |

### T4：漂移检测（VERIFY）

- 运行全部测试，确认通过
- 检查规范场景与代码 100% 对齐
- 确认 core-contracts 同步更新无遗漏

### T5：变更记录（CHANGELOG）

- 更新 `specs/changelog.md`
- 更新 `specs/.sdd-state.json`
- 评估是否需要 ADR（修复 `_inventory.push` 违规属于编码修复，不涉及架构决策，预计不需要 ADR）

## 验证标准

- [ ] 26/26 场景审计完成
- [ ] `_inventory.push` 修复为 `addToInventory`
- [ ] `buyPermanent` 模板检查前置修复
- [ ] 规范 ⚠️ 标记同步更新
- [ ] core-contracts 注册完整
- [ ] 26/26 测试场景通过
- [ ] 规范-代码零漂移
