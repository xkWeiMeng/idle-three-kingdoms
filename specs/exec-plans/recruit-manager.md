# 执行计划：RecruitManager 规范验证与测试补全

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联规范** | [specs/services/recruit-manager.md](../services/recruit-manager.md) |
| **系统契约** | [specs/system/core-contracts.md](../system/core-contracts.md) |
| **创建** | 2026-04-05 |

---

## 概览

RecruitManager 代码已实现全部 7 个能力，规范从现有代码反向编写。本计划聚焦四件事：

1. **代码-规范对齐审计** — 逐场景验证实现与规范的 WHEN/THEN 是否完全一致
2. **跨服务契约对齐** — 验证跨模块写操作（`ResourceManager.spend`、`HeroManager.addHero`）符合 core-contracts.md 的「检查 → 扣除 → 执行」原则
3. **测试文件创建** — 为全部 7 个能力的 WHEN/THEN 场景建立自动化测试
4. **小改进** — 硬编码配置提取建议评估

---

## 依赖关系图

```
T1.1（代码-规范对齐审计）
  │
  ├──▶ T2.1（跨服务契约验证）── 可与 T1.1 并行
  │
  └──▶ T3.1（测试文件创建：框架 + Mock）
          │
          └──▶ T3.2（测试实现：能力 1-3 公共接口）
                  │
                  └──▶ T3.3（测试实现：能力 4-5 内部方法）
                          │
                          └──▶ T3.4（测试实现：能力 6-7 查询与存档）
                                  │
                                  └──▶ T3.5（测试运行与通过验证）
                                          │
                                          └──▶ T4.1（配置提取评估）── 可跳过
```

- **T1.1** 和 **T2.1** 无前置依赖，可并行
- **T3.1 → T3.2 → T3.3 → T3.4 → T3.5** 严格顺序
- **T4.1** 在测试通过后执行，可选

---

## 阶段 1：代码-规范对齐审计

> 目标：确认现有代码覆盖规范全部 WHEN/THEN 场景，记录所有偏差。

### 任务 T1.1 — 逐能力 WHEN/THEN 场景对齐检查

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 1–7 全部 WHEN/THEN 场景 |
| **输入** | `js/modules/recruit-manager.js`（~120 行）、`specs/services/recruit-manager.md` |
| **输出** | 对齐报告，内嵌于本任务验证结果中（无需单独文件，代码量小） |
| **约束** | 仅审计，不修改代码 |

**验证**：

- 7 个能力全部被检查
- 每个 WHEN/THEN 场景有明确的 PASS 或 FAIL 标记
- 所有 FAIL 场景附带代码行号和偏差描述

**检查要点速查表**：

| 能力 | 关键验证点 |
|------|-----------|
| 1 单次招募 | `canAfford` 前置检查；`spend` 在 `_doSingleRecruit` 之前；toast 消息文本完全匹配；`recruit:result` 载荷含 `results` + `pity`；返回 `{ heroId, quality }` 或 `null` |
| 2 十连招募 | 费用 900（非 1000）；一次性扣费；10 次独立 `_doSingleRecruit`；单次 `recruit:result` 事件含 10 条结果；跨抽保底连续累加 |
| 3 免费招募 | `freeRecruitUsed` 守卫；设 `pity.rare = 9` 后调用 `_doSingleRecruit`；不消耗玉璧；已使用返回 `null` 且无事件 |
| 4 品质判定 | 保底优先级：橙 > 紫 > 蓝；阈值 79/29/9；概率区间 [0,3)/[3,12)/[12,30)/[30,60)/[60,100) |
| 5 保底更新 | 三计数器先 +1 后按品质重置；`totalRecruits` 每次 +1 |
| 6 查询接口 | `getPity()` 返回浅拷贝（展开运算符）；`getTotalRecruits()` 返回原始值；`isFreeRecruitAvailable()` 取反 |
| 7 初始化存档 | 新格式 `saved.recruit` 路径；旧格式 `saved.pity` 路径；`getState()` 返回深拷贝 |

---

## 阶段 2：跨服务契约对齐

> 目标：验证 RecruitManager 的跨模块写操作符合 core-contracts.md 中「允许的跨模块写操作」定义。

### 任务 T2.1 — 跨服务契约验证

| 字段 | 值 |
|------|-----|
| **规范引用** | `specs/system/core-contracts.md` §服务边界 §允许的跨模块写操作 |
| **输入** | `js/modules/recruit-manager.js`、`specs/system/core-contracts.md` |
| **输出** | 验证清单（PASS/FAIL） |
| **约束** | 仅审计，不修改代码 |

**验证清单**：

| 检查项 | 预期 | 验证方式 |
|--------|------|----------|
| `ResourceManager.canAfford()` 在 `spend()` 之前调用 | 所有 3 个公共方法均遵循「检查 → 扣除 → 执行」 | 代码审查 `recruitSingle`/`recruitTen`/`freeRecruit` |
| `ResourceManager.spend()` 仅在 `canAfford` 通过后调用 | `spend` 不在 `canAfford` 的 false 分支中 | 代码逻辑流分析 |
| `HeroManager.addHero()` 在资源扣除后调用 | addHero 在 spend 之后 | 代码行序 |
| 无直接修改 ResourceManager/HeroManager 的 `_state` | 无 `ResourceManager._state` 或 `HeroManager._state` 访问 | grep 搜索 |
| core-contracts.md 已列出 RecruitManager 的写操作 | `RecruitManager → ResourceManager.canAfford/spend` 和 `RecruitManager → HeroManager.addHero` 在契约中注册 | 文档内容检查 |
| 事件 `recruit:result` 载荷格式符合事件契约 | `{results, pity}` 结构 | 代码与事件契约表对照 |

---

## 阶段 3：测试文件创建

> 目标：为 RecruitManager 全部 7 个能力建立完整的自动化测试。

### 任务 T3.1 — 测试框架搭建

| 字段 | 值 |
|------|-----|
| **规范引用** | 全部能力（测试基础设施） |
| **输入** | `tests/battle-manager.test.html`（参考格式）、`js/modules/recruit-manager.js` |
| **输出** | `tests/recruit-manager.test.html`——包含测试框架、Mock 依赖、辅助函数 |
| **约束** | 与 `battle-manager.test.html` 风格一致；HTML + inline `<script>`；无 npm 依赖 |

**产出结构**：

```
tests/recruit-manager.test.html
├── <style>              — 与 battle-manager.test.html 一致
├── <script> 依赖加载    — constants.js, event-bus.js, utils.js, heroes.js, recruit-manager.js
├── <script> 微型框架    — section(), test(), skip(), assert(), assertEqual()
├── <script> Mock         — MockResourceManager, MockHeroManager, MockEventBus
└── <script> 测试用例    — 按能力分 section
```

**Mock 依赖设计**：

| Mock | 替代 | 关键行为 |
|------|------|----------|
| `MockResourceManager` | `ResourceManager` | `canAfford()` 返回可控布尔值；`spend()` 记录调用；`get()` 返回固定值 |
| `MockHeroManager` | `HeroManager` | `addHero()` 返回可控值（新武将返回对象，重复返回 null）；记录调用 |
| `MockEventBus` | `EventBus.emit` | 记录所有 emit 调用，可按事件名查询 |
| `mockRandom(value)` | `Math.random` | 固定 `Math.random()` 返回值以测试概率分支 |

**验证**：

- HTML 文件可直接在浏览器打开运行
- Mock 对象正确替换全局依赖
- `section()` / `test()` / `assert()` 输出格式与 battle-manager.test.html 一致
- 无测试用例时页面正常显示空结果

---

### 任务 T3.2 — 测试实现：能力 1-3（公共接口）

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 1（单次招募）、能力 2（十连招募）、能力 3（免费招募） |
| **输入** | `specs/services/recruit-manager.md` §能力 1-3 的全部 WHEN/THEN |
| **输出** | `tests/recruit-manager.test.html` 中的测试用例（能力 1-3 部分） |
| **约束** | 每个 WHEN/THEN 场景至少一个 test()；使用 Mock 隔离依赖 |

**场景到测试映射**：

| 规范场景 | 测试名称 | Mock 配置 |
|----------|----------|-----------|
| 能力1：资源足够 → 正常招募 | `单抽-资源足够-正常流程` | `canAfford: true`, `mockRandom(0.5)` |
| 能力1：资源不足 → toast + null | `单抽-资源不足-返回null` | `canAfford: false` |
| 能力1：池为空 → 降级白色 | `单抽-池为空-降级到白色` | `HeroPoolByQuality` 临时修改 |
| 能力2：资源足够 → 10条结果 | `十连-正常流程-10条结果` | `canAfford: true` |
| 能力2：资源不足 → toast + null | `十连-资源不足-返回null` | `canAfford: false` |
| 能力2：保底在十连中段触发 | `十连-保底中段触发-计数器重置` | 预设 `pity.epic = 28` |
| 能力3：首次免费 → 蓝色+ | `免费招募-首次-保证蓝色` | 默认状态 |
| 能力3：已使用 → null 无事件 | `免费招募-已使用-返回null` | `freeRecruitUsed: true` |
| 能力3：碰巧更高品质 | `免费招募-随机更高品质` | `mockRandom(0.01)` 命中橙色 |

**验证**：

- 每个 WHEN/THEN 场景有对应 test()
- Mock 在每个 test 前重置（防止状态泄漏）
- EventBus.emit 调用被验证（事件名 + 载荷结构）
- ResourceManager.spend 调用被验证（参数正确）

---

### 任务 T3.3 — 测试实现：能力 4-5（内部方法）

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 4（品质判定）、能力 5（保底更新） |
| **输入** | `specs/services/recruit-manager.md` §能力 4-5 的全部 WHEN/THEN |
| **输出** | `tests/recruit-manager.test.html` 中的测试用例（能力 4-5 部分） |
| **约束** | 内部方法直接调用（`_determineQuality()` / `_updatePity()`） |

**场景到测试映射**：

| 规范场景 | 测试名称 | 预置状态 |
|----------|----------|----------|
| 能力4：橙色保底 pity.legendary=79 | `品质判定-橙色保底触发` | `pity.legendary = 79` |
| 能力4：紫色保底 pity.epic=29 | `品质判定-紫色保底触发` | `pity.epic = 29, legendary < 79` |
| 能力4：蓝色保底 pity.rare=9 | `品质判定-蓝色保底触发` | `pity.rare = 9, epic < 29, legendary < 79` |
| 能力4：无保底-概率roll | `品质判定-基础概率各区间` | `pity 全 0` + `mockRandom` 各阈值 |
| 能力4：概率命中橙色(roll<3) | `品质判定-概率命中橙色` | `mockRandom(0.025)` → roll=2.5 |
| 能力5：白色不重置 | `保底更新-白色品质-无重置` | 初始 pity 已知 |
| 能力5：蓝色重置 rare | `保底更新-蓝色品质-重置rare` | 初始 pity 已知 |
| 能力5：紫色重置 rare+epic | `保底更新-紫色品质-重置两项` | 初始 pity 已知 |
| 能力5：橙色重置全部 | `保底更新-橙色品质-全部重置` | 初始 pity 已知 |
| 能力5：具体数值验证 | `保底更新-数值计算验证` | `pity = {5, 20, 50}`, quality=3 → `{0, 21, 51}` |

**验证**：

- 保底触发时不执行 Math.random（可通过 mockRandom 抛异常验证）
- 保底优先级严格：橙 > 紫 > 蓝
- `_updatePity` 先 +1 后重置的顺序正确
- `totalRecruits` 每次 +1

---

### 任务 T3.4 — 测试实现：能力 6-7（查询与存档）

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 6（查询接口）、能力 7（初始化与存档） |
| **输入** | `specs/services/recruit-manager.md` §能力 6-7 的全部 WHEN/THEN |
| **输出** | `tests/recruit-manager.test.html` 中的测试用例（能力 6-7 部分） |
| **约束** | 验证拷贝隔离性（修改返回值不影响内部状态） |

**场景到测试映射**：

| 规范场景 | 测试名称 |
|----------|----------|
| 能力6：getPity 返回浅拷贝 | `查询-getPity返回浅拷贝-修改不影响内部` |
| 能力6：getTotalRecruits 正确值 | `查询-getTotalRecruits` |
| 能力6：isFreeRecruitAvailable 两种状态 | `查询-isFreeRecruitAvailable-true和false` |
| 能力7：init(undefined) 默认状态 | `初始化-新游戏默认状态` |
| 能力7：init 新格式存档 | `初始化-新格式saved.recruit` |
| 能力7：init 旧格式存档 | `初始化-旧格式saved.pity兼容` |
| 能力7：getState 深拷贝 | `存档-getState返回深拷贝-修改不影响内部` |

**验证**：

- `getPity()` 返回对象修改后，再次调用 `getPity()` 值未变
- `getState()` 返回对象修改 `pity` 后，`getPity()` 值未变
- 两种存档格式均正确恢复
- 未传存档时使用默认值

---

### 任务 T3.5 — 测试运行与通过验证

| 字段 | 值 |
|------|-----|
| **规范引用** | 全部能力 |
| **输入** | `tests/recruit-manager.test.html` |
| **输出** | 全部测试通过（浏览器运行截图或终端输出） |
| **约束** | 0 个 FAIL；skip 仅允许标注为"需要浏览器环境"的场景 |

**验证**：

- 在浏览器中打开 `tests/recruit-manager.test.html`
- Summary 显示全部 PASS，0 FAIL
- 如有 FAIL，返回 T3.2-T3.4 修复后重新验证
- Mock 正确还原（`restoreRandom()` 等），不影响后续页面行为

---

## 阶段 4：小改进评估（可选）

> 目标：评估规范中提及的配置提取建议，决定是否实施。

### 任务 T4.1 — 配置提取评估

| 字段 | 值 |
|------|-----|
| **规范引用** | §配置 — "应提取到 `CONSTANTS.RECRUIT.*`" |
| **输入** | `js/modules/recruit-manager.js`、`js/core/constants.js` |
| **输出** | 决策记录（实施 / 推迟），保存到 `specs/decisions/recruit-config-extraction.md` |
| **约束** | 仅评估，不实施代码变更 |

**评估标准**：

| 因素 | 考量 |
|------|------|
| 当前需求 | 游戏无限时卡池或概率活动计划 |
| 硬编码位置 | 6 个魔数在 `_determineQuality()` + 2 个费用值分散在 `recruitSingle`/`recruitTen` |
| 提取收益 | 集中管理、数据驱动概率调整 |
| 提取成本 | 新增 `CONSTANTS.RECRUIT` + 替换 8 处硬编码 + 测试更新 |
| 建议 | 当前阶段推迟（YAGNI），待限时卡池需求出现时再提取 |

**验证**：

- 决策记录包含利弊分析和结论
- 如决定实施，需创建新的执行计划

---

## 最终验证清单

| # | 检查项 | 来源 | 通过条件 |
|---|--------|------|----------|
| 1 | 能力 1-7 全部 WHEN/THEN 场景已对齐 | T1.1 | 24 个场景全部 PASS（代码审查） |
| 2 | 跨服务写操作符合「检查→扣除→执行」原则 | T2.1 | 6 项契约检查全部 PASS |
| 3 | RecruitManager 写操作已在 core-contracts.md 注册 | T2.1 | 文档确认 |
| 4 | 测试文件 `tests/recruit-manager.test.html` 存在 | T3.1 | 文件存在，格式正确 |
| 5 | 全部测试用例通过 | T3.5 | 0 FAIL，≥20 个测试 PASS |
| 6 | 测试覆盖全部公共接口 | T3.2 | `recruitSingle`, `recruitTen`, `freeRecruit`, `getPity`, `getTotalRecruits`, `isFreeRecruitAvailable`, `init`, `getState` |
| 7 | 测试覆盖保底机制边界值 | T3.3 | 橙色 79、紫色 29、蓝色 9 三个阈值均有测试 |
| 8 | 测试覆盖概率分支 | T3.3 | 5 个概率区间均有 mockRandom 测试 |
| 9 | 测试验证拷贝隔离 | T3.4 | getPity 浅拷贝 + getState 深拷贝 |
| 10 | 配置提取决策已记录 | T4.1 | 决策文件存在（可选） |

---

## WHEN/THEN 场景覆盖矩阵

| 能力 | 场景数 | 测试任务 | 审计任务 |
|------|--------|----------|----------|
| 1 单次招募 | 3 | T3.2 | T1.1 |
| 2 十连招募 | 3 | T3.2 | T1.1 |
| 3 免费招募 | 3 | T3.2 | T1.1 |
| 4 品质判定 | 5 | T3.3 | T1.1 |
| 5 保底更新 | 5 | T3.3 | T1.1 |
| 6 查询接口 | 4 | T3.4 | T1.1 |
| 7 初始化存档 | 4 | T3.4 | T1.1 |
| **合计** | **27** | — | — |

> 全部 27 个 WHEN/THEN 场景至少被 1 个测试任务和 T1.1 审计覆盖。
