# 执行计划：HeroManager

**规范引用**：[specs/services/hero-manager.md](../services/hero-manager.md)
**核心契约**：[specs/system/core-contracts.md](../system/core-contracts.md)
**创建日期**：2026-04-13

## 背景

HeroManager 代码已存在，本次为审计+修复流程。规范经审查提升为 Active，发现 1 处代码-规范不一致需修复。

## 任务清单

### T1：代码审计 — 逐场景比对（IMPLEMENT）

逐一比对规范中 6 个能力的全部 WHEN/THEN 场景与 `js/modules/hero-manager.js` 代码。

| 场景 | 预期结果 | 需修复 |
|------|----------|--------|
| C1-S1: addHero 新武将 | ✓ 匹配 | — |
| C1-S2: addHero 重复武将 | ✓ 匹配 | — |
| C1-S3: addHero 无效 ID | ✓ 匹配 | — |
| C2-S1: getTemplate 正常 | ✓ 匹配 | — |
| C2-S2: getHeroByUid 不存在 | ✓ 匹配 | — |
| C2-S3: getAll 内部引用 | ✓ 匹配 | — |
| C3-S1: addToTeam 成功 | ✓ 匹配 | — |
| C3-S2: addToTeam 队伍满 | ✓ 匹配 | — |
| C3-S3: addToTeam 重复 | ✓ 匹配 | — |
| C3-S4: addToTeam 无效 uid | ✓ 匹配 | — |
| C3-S5: removeFromTeam 成功 | ✗ 代码无返回值 | **修复** |
| C3-S6: removeFromTeam 不在队伍 | ✗ 代码无守卫，仍触发事件 | **修复** |
| C4-S1: levelUp 成功 | ✓ 匹配 | — |
| C4-S2: getExpCost 数值 | ✓ 匹配 | — |
| C4-S3: levelUp 满级 | ✓ 匹配 | — |
| C4-S4: levelUp EXP 不足 | ✓ 匹配 | — |
| C5-S1: getHeroStats 等级 1 | ✓ 匹配 | — |
| C5-S2: getHeroStats 等级 10 | ✓ 匹配 | — |
| C5-S3: getHeroStats 装备加成 | ✓ 匹配 | — |
| C5-S4: getBattlePower 数值 | ✓ 匹配 | — |
| C6-S1: init 首次游戏 | ✓ 匹配 | — |
| C6-S2: init 恢复存档 | ✓ 匹配 | — |
| C6-S3: getState 深拷贝 | ✓ 匹配 | — |

**修复内容**：
- `removeFromTeam(uid)` — 添加 `indexOf` 守卫，uid 不在队伍中时返回 `false` 且不触发事件；uid 在队伍中时用 `splice` 移除并返回 `true`

### T2：编写测试骨架（TEST）

创建 `tests/hero-manager.test.html`，覆盖全部 23 个 WHEN/THEN 场景。

**测试策略**：
- Mock 依赖：ResourceManager、EquipmentManager、EventBus.emit
- 使用项目现有微型测试框架格式（同 story-manager.test.html）
- 加载真实 HeroData（静态数据，无副作用）
- 每个 test() 前 reset 状态

**场景-测试映射**：

| 能力 | 场景数 | 测试方法数 |
|------|--------|-----------|
| C1: 获取武将 | 3 | 3 |
| C2: 查询武将 | 3 | 3 |
| C3: 队伍管理 | 6 | 6 |
| C4: 武将升级 | 4 | 4 |
| C5: 属性计算 | 4 | 4 |
| C6: 初始化与存档 | 3 | 3 |
| **合计** | **23** | **23** |

### T3：漂移检测（VERIFY）

- 运行全部测试，确认通过
- 检查规范场景与代码 100% 对齐

### T4：变更记录（CHANGELOG）

- 更新 `specs/changelog.md`
- 更新 `specs/.sdd-state.json`

## 验证标准

- [ ] removeFromTeam 代码修复后，返回 boolean 且仅在成功时触发事件
- [ ] 23/23 测试场景通过
- [ ] 规范-代码零漂移
