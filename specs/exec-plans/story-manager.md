# 执行计划：StoryManager 规范合规验证与测试骨架

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联规范** | [specs/services/story-manager.md](../services/story-manager.md) |
| **系统契约** | [specs/system/core-contracts.md](../system/core-contracts.md) |
| **创建** | 2026-07-18 |

---

## 背景与目标

StoryManager 已有完整实现（`js/modules/story-manager.js` 和 `js/ui/story-panel.js`），规范于 2026-07-18 提升为 Active。本计划不做全量重写，聚焦三件事：

1. **逐能力对齐核查**：确认现有代码所有 WHEN/THEN 场景均符合规范，记录 PASS/FAIL。
2. **修复已知潜在偏差**：针对核查中发现的真实 FAIL 项修复代码（或规范）。
3. **测试骨架生成**：为 10 个能力的全部 WHEN/THEN 场景生成可运行的测试桩，支撑回归防护。

---

## 已知潜在不一致（进场前评估）

核查前的静态分析已发现如下候选问题，本计划以任务形式逐一核实：

| 编号 | 描述 | 候选结论 | 对应任务 |
|------|------|----------|---------|
| D1 | `_triggerMonologue` 随机索引：`sources[Utils.randInt(0, sources.length - 1)]` | 已修正，代码一致 ✅ | T1.7 |
| D2 | `init(saved)` 检查顺序：先判 `saved.story` 再判 `saved`，与规范描述顺序相反 | 功能等效（main.js 传整体存档），但需结合调用链确认 | T1.1 |
| D3 | `checkUnlock` prologue 路径：`findIndex` 返回 -1 → `chapters[-1+1] = chapters[0]` | 代码行为与规范描述一致 ✅ | T1.6 |
| D4 | `checkUnlock` `unlockCondition = null` 时不推进 | `?.type` 返回 undefined ≠ 'stage_clear'，代码正确 ✅ | T1.6 |
| D5 | `story:monologue` 载荷含 `ts: Date.now()` | 代码一致 ✅ | T1.7 |
| D6 | StoryManager 不监听 `hero:added` 事件 | 代码无此监听 ✅ | T1.7 |

---

## 依赖关系图

```
T1.1 ──▶ T1.2 ──▶ T1.3 ──▶ T1.4 ──▶ T1.5 ──▶ T1.6 ──▶ T1.7 ──▶ T1.8 ──▶ T1.9 ──▶ T1.10
  │
  └──────────────────────────────────────────────────────────────────────────────▶ T2.1（汇总对齐报告）
                                                                                        │
                                                                      T2.2（修复代码）──┤（如有 FAIL）
                                                                                        │
                                                                                  T3.1（测试骨架）
                                                                                        │
                                                                                  T4.1（最终验收）
```

- **T1.1–T1.10**：独立逐能力审计，可按顺序执行（复用审计上下文）
- **T2.1**：依赖 T1 全部完成
- **T2.2**：依赖 T2.1，仅在有 FAIL 时执行
- **T3.1**：依赖 T2.1（需知晓对齐状态后生成准确测试）
- **T4.1**：依赖 T2.2 + T3.1 全部完成

---

## 阶段 1：逐能力代码-规范对齐核查

> 目标：对 10 个能力的每一条 WHEN/THEN 场景逐一比对代码，记录 PASS / FAIL / N/A。

### 任务 T1.1 — 能力 1：初始化与存档恢复

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 1（§初始化与存档恢复），`specs/services/story-manager.md` 第 112–148 行 |
| **输入** | `js/modules/story-manager.js` `init(saved)` 方法；`js/main.js` StoryManager 调用处 |
| **输出** | 对齐结论（文字记录），写入 T2.1 的汇总报告 |
| **约束** | 仅核查，不修改代码 |

**核查要点**：

| WHEN/THEN 场景 | 代码位置 | 检查项 |
|----------------|----------|--------|
| saved = undefined → 使用默认值 | `init()` 第 38–41 行 | `data` 为 undefined，`data.currentChapter !== undefined` 为 false → 不执行合并 → 默认值保留 |
| saved 标准片段格式（直接含 `currentChapter`） | 同上 | `saved.story` 为 undefined → `data = saved` → 合并成功 |
| saved 旧格式（`saved.story` 含 `currentChapter`） | 同上 | `saved.story` 为 truthy → `data = saved.story` → 合并成功 |
| init() 不发送任何事件 | 全方法 | 无 `EventBus.emit` 调用 |

**关键调用链核查**：`main.js` 中 `StoryManager.init(saved)` 传入的是完整存档对象（含 `saved.story` 字段），验证"先查 `saved.story`"的路径与实际传参形式匹配。

**验证标准**：
- 三种 saved 格式均有明确 PASS/FAIL 结论
- 确认 D2（检查顺序问题）是否为实际缺陷或功能等效
- init() 方法体内无 EventBus 调用

---

### 任务 T1.2 — 能力 2：Tick 驱动（自言自语冷却）

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 2（§Tick 驱动），第 152–184 行 |
| **输入** | `js/modules/story-manager.js` `onTick(dt)` 方法 |
| **输出** | 对齐结论 |
| **约束** | 仅核查 |

**核查要点**：

| WHEN/THEN 场景 | 检查项 |
|----------------|--------|
| cooldown=0, onTick(1) → 触发+重置为30 | `cooldown -= 1 → -1 ≤ 0`，调用 `_triggerMonologue()`，重置 `= 30` |
| cooldown=15, 调用14次 → cooldown=1，不触发 | 每次 `-1`，最终 `1 > 0`，不触发 |
| cooldown=1, onTick(1) → 触发 | `1 - 1 = 0 ≤ 0`，触发 |
| cooldown=5, onTick(10) 追帧 → 触发 | `5 - 10 = -5 ≤ 0`，触发 |
| 游戏启动首秒立即触发 | 初始 cooldown=0，第一次 tick 时 `0 - 1 = -1 ≤ 0`，立即触发 |

**验证标准**：
- `monologueCooldown -= dt` 先执行，`<= 0` 后再触发（顺序正确）
- 重置在 `_triggerMonologue()` **之后**（不是之前）

---

### 任务 T1.3 — 能力 3：当前章节查询

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 3（§当前章节查询），第 188–215 行 |
| **输入** | `getCurrentChapter()` 和 `getCurrentScenes()` 方法 |
| **输出** | 对齐结论 |

**核查要点**：

| WHEN/THEN 场景 | 检查项 |
|----------------|--------|
| currentChapter='prologue' → 返回 `MainStory.prologue` | 特殊分支：`if (this._state.currentChapter === 'prologue')` |
| currentChapter='chapter_1'（存在） → 返回章节对象 | `MainStory.chapters.find(c => c.id === ...)` |
| currentChapter='chapter_99'（不存在） → 返回 null | `find` 返回 undefined → `|| null` |
| `getCurrentScenes()` 章节为 null → 返回 [] | `chapter ? chapter.scenes : []` |

**验证标准**：三条场景路径均覆盖，边界值（不存在 ID）返回 null/[]

---

### 任务 T1.4 — 能力 4：标记场景已读

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 4（§标记场景已读），第 219–248 行 |
| **输入** | `markSceneSeen(sceneId)` 方法 |
| **输出** | 对齐结论 |

**核查要点**：

| WHEN/THEN 场景 | 检查项 |
|----------------|--------|
| seenScenes=[], 标记新 scene → 追加+emit | `!includes(sceneId)` 分支：`push` + `EventBus.emit('story:scene_seen', sceneId)` |
| 重复标记 → 静默忽略，不重复 emit | `includes` 为 true → 跳过，无 push/emit |
| 连续标记 3 个不同 scene → 各 emit 一次 | 每次满足 `!includes` 条件 |

**验证标准**：幂等性（重复调用不产生副作用），emit 载荷为字符串 sceneId

---

### 任务 T1.5 — 能力 5：章节推进

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 5（§章节推进），第 252–294 行 |
| **输入** | `advanceChapter()` 方法 |
| **输出** | 对齐结论 |

**核查要点**：

| WHEN/THEN 场景 | 检查项 |
|----------------|--------|
| 从 prologue 推进（chapters 非空） | `currentChapter === 'prologue'` 分支，push 'prologue'，更新 `chapters[0].id`，emit `story:chapter_unlocked(chapters[0])` |
| 从 prologue 推进（chapters=[]） | `chapters.length > 0` 为 false → 静默忽略 |
| 从 chapter_1 推进（有下一章） | `idx >= 0 && idx < chapters.length - 1` → push + 更新 + emit |
| 从最后一章推进 → 静默忽略 | `idx === chapters.length - 1` → 条件不满足，无操作 |
| `emit story:chapter_unlocked` 载荷为新章节对象 | emit 参数为 `chapters[idx + 1]`（章节对象） |

**验证标准**：所有四种场景路径均有明确 PASS/FAIL；确认 emit 载荷为完整章节对象（而非仅 id）

---

### 任务 T1.6 — 能力 6：解锁条件检查

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 6（§解锁条件检查），第 298–347 行 |
| **输入** | `checkUnlock(stageId)` 方法 |
| **输出** | 对齐结论，含 D3/D4 最终判定 |

**核查要点**：

| WHEN/THEN 场景 | 检查项 |
|----------------|--------|
| prologue 路径，stageId < 解锁要求 → 不推进 | `findIndex` 返回 -1 → `nextChapter = chapters[0]`；`stageId < condition.stageId` → 条件不满足 |
| prologue 路径，stageId >= 解锁要求 → 推进 | 条件满足 → `advanceChapter()` |
| chapter_1，stageId >= 下一章要求 → 推进 | `idx=0`，`nextChapter = chapters[1]` |
| 非 stage_clear 类型 → 不推进 | `?.type !== 'stage_clear'` → 短路 |
| `unlockCondition = null` → 不推进（D4） | `null?.type` 为 undefined → 条件不满足 → 不推进 |
| 已是最后一章 → 静默忽略 | `nextChapter = chapters[idx+1] = undefined`，首条判断 `nextChapter &&` 为 false |

**验证标准**：D3（prologue 的 idx=-1 路径）和 D4（null condition 路径）均记录 PASS 或 FAIL；六条场景全覆盖

---

### 任务 T1.7 — 能力 7：自言自语触发

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 7（§自言自语触发），第 351–421 行 |
| **输入** | `_triggerMonologue()` 方法；`IdleMonologues` 数据结构 |
| **输出** | 对齐结论，含 D1/D5/D6 最终判定 |

**核查要点**：

| WHEN/THEN 场景 | 检查项 |
|----------------|--------|
| 22:00–05:59 → category='night' | `isNight = hour >= 22 \|\| hour < 6` |
| 非夜间，gold < 80 → category='lowMoney' | `!isNight && ResourceManager.get(GOLD) < 80` 优先判断 |
| 非夜间，gold >= 80，random < 0.1 → category='bored' | `else if (!isNight && Math.random() < 0.1)` |
| 否则 → category='idle' | 无条件分支 |
| 无武将时候选池 = ['system'] | `sources = ['system']`，`heroes = []` → 无追加 |
| 候选池含武将（IdleMonologues 中存在） | `IdleMonologues[storyHeroId]` 存在时追加 |
| 随机索引取值（D1）：`sources[randInt(...)]` | `const sourceId = sources[Utils.randInt(0, sources.length - 1)]` ← 直接取字符串，非下标 |
| pool 不存在 → 静默返回 | `if (!pool) return` |
| lines 为空 → 静默返回 | `if (lines.length === 0) return` |
| 成功路径：emit + 更新 latestMonologue | payload = `{speaker, text, ts: Date.now()}`；`_state.latestMonologue = payload`；`EventBus.emit('story:monologue', payload)` |
| StoryManager 不监听任何事件（D6） | 全文件无 `EventBus.on(...)` 调用 |

**验证标准**：D1（随机索引）、D5（ts 字段）、D6（不监听事件）均记录最终结论；category 优先级顺序（night > lowMoney > bored > idle）正确

---

### 任务 T1.8 — 能力 8：角色对话查询

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 8（§角色对话查询），第 425–456 行 |
| **输入** | `getDialogue(characterId, category)` 方法 |
| **输出** | 对齐结论 |

**核查要点**：

| WHEN/THEN 场景 | 检查项 |
|----------------|--------|
| characterId 存在，category 存在 → 返回随机字符串 | `dialogues[category]` 非 null → `randInt` 取值 |
| characterId 不存在 → 返回 null | `!dialogues` → `return null` |
| category 不存在 → 返回 null | `!dialogues[category]` → `return null` |
| category 为空数组 → 返回 null | `!dialogues[category]` 不涵盖空数组！需检查代码是否处理 `lines.length === 0` 的情形 |

**特别注意**：规范要求"为空时返回 null"，代码为 `if (!dialogues || !dialogues[category]) return null`，但空数组 `[]` 为 truthy，此时 `randInt(0, -1)` 可能产生异常。需确认空数组边界行为。

**验证标准**：四条场景均有 PASS/FAIL；空数组边界行为有明确结论（PASS 或标记为 FAIL 待修复）

---

### 任务 T1.9 — 能力 9：角色人设查询

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 9（§角色人设查询），第 460–495 行 |
| **输入** | `getProfile(characterId)` 方法 |
| **输出** | 对齐结论 |

**核查要点**：

| WHEN/THEN 场景 | 检查项 |
|----------------|--------|
| characterId 存在 → 返回原对象引用（不深拷贝） | `return CharacterProfiles[characterId] \|\| null`：直接返回原对象，符合规范"原样返回原对象引用" |
| characterId 不存在 → 返回 null | `|| null` 分支 |

**验证标准**：确认方法无深拷贝调用（与 `getState()` 不同）；两条场景 PASS

---

### 任务 T1.10 — 能力 10：状态导出

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 10（§状态导出），第 499–518 行 |
| **输入** | `getState()` 方法 |
| **输出** | 对齐结论 |

**核查要点**：

| WHEN/THEN 场景 | 检查项 |
|----------------|--------|
| 返回包含全部 5 个字段的对象 | 返回 `Utils.deepClone(this._state)`，`_state` 含所有 5 个字段 |
| 修改返回对象不影响内部状态 | `deepClone` 确保隔离 |

**验证标准**：确认使用 `Utils.deepClone`（非浅拷贝）；与 `getProfile` 形成对比（后者故意不深拷贝）

---

## 阶段 2：汇总与修复

### 任务 T2.1 — 对齐报告汇总

| 字段 | 值 |
|------|-----|
| **规范引用** | 全部 10 个能力 |
| **输入** | T1.1–T1.10 核查结论 |
| **输出** | `ai-docs/story-manager-alignment.md` — 对齐报告 |
| **约束** | 每个能力一行，格式：`能力 N | PASS/FAIL | 偏差说明（如有）` |

**报告格式**：

```markdown
# StoryManager 代码-规范对齐报告

生成时间：YYYY-MM-DD

| 能力 | 状态 | 偏差说明 |
|------|------|----------|
| C1 初始化 | PASS/FAIL | ... |
| C2 Tick 驱动 | PASS | |
...

## 已知候选问题最终判定

| 编号 | 描述 | 结论 |
|------|------|------|
| D1 | _triggerMonologue 随机索引 | PASS — 代码正确 |
...
```

**验证标准**：
- 10 个能力全部有明确判定
- 所有 D1–D6 候选问题有最终结论
- FAIL 项附带代码行号和具体偏差描述

---

### 任务 T2.2 — 修复 FAIL 项（条件执行）

| 字段 | 值 |
|------|-----|
| **规范引用** | 仅 T2.1 中标记为 FAIL 的能力对应条款 |
| **输入** | `ai-docs/story-manager-alignment.md` FAIL 列表；`js/modules/story-manager.js` |
| **输出** | 修复后的 `js/modules/story-manager.js`（仅改动 FAIL 对应逻辑） |
| **约束** | 不做无关重构；每个修复必须引用具体规范条款；修复后在报告中将对应项更新为 PASS |

**预期修复候选**（依 T2.1 结果决定是否实际执行）：

| 候选修复 | 触发条件 | 修复方向 |
|----------|----------|----------|
| `getDialogue` 空数组边界 | T1.8 发现 `lines=[]` 时 `randInt(0,-1)` 异常 | 在 `return null` 前增加 `lines.length === 0` 检查 |
| `init` 检查顺序 | T1.1 确认为实际 bug（非功能等效） | 调整为先判 `saved.currentChapter !== undefined`，再判 `saved.story.currentChapter !== undefined` |

**验证标准（针对每个修复）**：
- 修复前后行为对比说明
- 对应 WHEN/THEN 场景从 FAIL 转为 PASS
- 不引入新的 FAIL 项（无回归）

---

## 阶段 3：测试骨架生成

### 任务 T3.1 — 生成 StoryManager 测试骨架

| 字段 | 值 |
|------|-----|
| **规范引用** | 全部 10 个能力的 WHEN/THEN 场景 |
| **输入** | `specs/services/story-manager.md`；`ai-docs/story-manager-alignment.md`（T2.1 输出）；现有测试文件参考：`tests/` 目录 |
| **输出** | `tests/story-manager.test.js` — 完整测试骨架 |
| **约束** | 每条 WHEN/THEN 场景对应一个独立 `it(...)` 测试；使用 mock 隔离 EventBus、HeroManager、ResourceManager；不依赖真实 DOM |

**测试文件结构**：

```javascript
// tests/story-manager.test.js
// 引用规范：specs/services/story-manager.md

describe('StoryManager', () => {
  let mockEventBus, mockHeroManager, mockResourceManager;

  beforeEach(() => {
    // 重置 _state 到默认值
    // 注入 mock 依赖
  });

  // ─── 能力 1：init ──────────────────────────────────
  describe('C1 init()', () => {
    it('saved=undefined → 默认状态（currentChapter=prologue，其余为空）', () => { /* ... */ });
    it('saved 为标准片段格式（直接含 currentChapter）→ 恢复状态', () => { /* ... */ });
    it('saved 为旧存档格式（saved.story 含 currentChapter）→ 向后兼容恢复', () => { /* ... */ });
    it('init() 不发送任何 EventBus 事件', () => { /* ... */ });
  });

  // ─── 能力 2：onTick ────────────────────────────────
  describe('C2 onTick(dt)', () => {
    it('cooldown=0，onTick(1) → 触发自言自语，cooldown 重置为 30', () => { /* ... */ });
    it('cooldown=15，调用14次 → cooldown=1，不触发', () => { /* ... */ });
    it('cooldown=1，onTick(1) → 触发', () => { /* ... */ });
    it('cooldown=5，onTick(10) 追帧 → 触发', () => { /* ... */ });
  });

  // ─── 能力 3：getCurrentChapter / getCurrentScenes ──
  describe('C3 getCurrentChapter()', () => {
    it('currentChapter=prologue → 返回 MainStory.prologue', () => { /* ... */ });
    it('currentChapter=chapter_1（存在）→ 返回章节对象', () => { /* ... */ });
    it('currentChapter=chapter_99（不存在）→ 返回 null', () => { /* ... */ });
    it('getCurrentScenes()：章节为 null → 返回 []', () => { /* ... */ });
  });

  // ─── 能力 4：markSceneSeen ─────────────────────────
  describe('C4 markSceneSeen(sceneId)', () => {
    it('新 sceneId → 追加到 seenScenes 并 emit story:scene_seen', () => { /* ... */ });
    it('重复标记 → seenScenes 不变，不重复 emit', () => { /* ... */ });
    it('连续标记 3 个不同 scene → 各 emit 一次，共 3 次', () => { /* ... */ });
  });

  // ─── 能力 5：advanceChapter ────────────────────────
  describe('C5 advanceChapter()', () => {
    it('从 prologue 推进（chapters 非空）→ completedChapters 含 prologue，currentChapter=chapters[0].id，emit', () => { /* ... */ });
    it('从 prologue 推进（chapters=[]）→ 静默忽略，不 emit', () => { /* ... */ });
    it('从 chapter_1 推进（有下一章）→ 推进到 chapter_2，emit', () => { /* ... */ });
    it('从最后一章推进 → 静默忽略', () => { /* ... */ });
  });

  // ─── 能力 6：checkUnlock ───────────────────────────
  describe('C6 checkUnlock(stageId)', () => {
    it('prologue 路径，stageId < 解锁要求 → 不推进', () => { /* ... */ });
    it('prologue 路径，stageId >= 解锁要求 → advanceChapter()', () => { /* ... */ });
    it('chapter_1 路径，stageId >= 下一章要求 → 推进', () => { /* ... */ });
    it('非 stage_clear 类型 → 不推进', () => { /* ... */ });
    it('unlockCondition=null → 不推进', () => { /* ... */ });
    it('已是最后一章 → 静默忽略', () => { /* ... */ });
  });

  // ─── 能力 7：_triggerMonologue ─────────────────────
  describe('C7 _triggerMonologue()', () => {
    it('22:00 → category=night', () => { /* ... */ });
    it('10:00，gold=50（<80）→ category=lowMoney', () => { /* ... */ });
    it('10:00，gold=500，random=0.05 → category=bored', () => { /* ... */ });
    it('10:00，gold=500，random=0.5 → category=idle', () => { /* ... */ });
    it('无武将时候选池仅含 system → 发言者为天道系统', () => { /* ... */ });
    it('武将已拥有且 IdleMonologues 存在 → 候选池包含该武将', () => { /* ... */ });
    it('pool 不存在 → 静默返回，不 emit', () => { /* ... */ });
    it('lines 为空 → 静默返回，不 emit', () => { /* ... */ });
    it('成功路径 → emit story:monologue({speaker, text, ts})，latestMonologue 更新', () => { /* ... */ });
  });

  // ─── 能力 8：getDialogue ───────────────────────────
  describe('C8 getDialogue(characterId, category)', () => {
    it('存在的 characterId 和 category → 返回字符串', () => { /* ... */ });
    it('不存在的 characterId → 返回 null', () => { /* ... */ });
    it('不存在的 category → 返回 null', () => { /* ... */ });
    it('category 对应空数组 → 返回 null（边界）', () => { /* ... */ });
  });

  // ─── 能力 9：getProfile ────────────────────────────
  describe('C9 getProfile(characterId)', () => {
    it('存在的 characterId → 返回原对象引用（不深拷贝）', () => { /* ... */ });
    it('不存在的 characterId → 返回 null', () => { /* ... */ });
  });

  // ─── 能力 10：getState ─────────────────────────────
  describe('C10 getState()', () => {
    it('返回包含全部 5 个字段的对象', () => { /* ... */ });
    it('修改返回对象不影响内部 _state（深拷贝隔离）', () => { /* ... */ });
  });
});
```

**验证标准**：
- 文件可由测试运行器加载（无语法错误）
- 共计 ≥ 30 个 `it(...)` 测试，覆盖全部 WHEN/THEN 场景
- 每个 `it` 内有具体断言占位（`// ASSERT: ...` 注释），而非完全空白
- mock 依赖覆盖：EventBus.emit、HeroManager.getAll、ResourceManager.get、Utils.randInt、Math.random、Date.now

---

## 阶段 4：最终验收

### 任务 T4.1 — 最终验收检查

| 字段 | 值 |
|------|-----|
| **规范引用** | 全部 10 个能力 |
| **输入** | T2.1 对齐报告；T2.2 修复（如有）；T3.1 测试骨架；`js/modules/story-manager.js` |
| **输出** | 最终验收通过声明（写入对齐报告末尾）或遗留问题列表 |

**验收清单**：

```
□ C1  init()：三种 saved 格式路径均 PASS；不发事件
□ C2  onTick()：四种 cooldown 场景均 PASS；触发/重置顺序正确
□ C3  getCurrentChapter/Scenes：prologue 特殊路径 + 不存在 ID 路径均 PASS
□ C4  markSceneSeen()：幂等性 PASS；emit 仅触发一次
□ C5  advanceChapter()：四种场景 PASS；emit 载荷为完整章节对象
□ C6  checkUnlock()：六种场景 PASS；D3（prologue idx=-1）PASS；D4（null condition）PASS
□ C7  _triggerMonologue()：D1（随机索引）PASS；D5（ts 字段）PASS；D6（不监听事件）PASS；类别优先级正确
□ C8  getDialogue()：空数组边界行为明确（PASS 或已修复）
□ C9  getProfile()：返回原对象引用（非深拷贝）PASS
□ C10 getState()：深拷贝隔离 PASS；5 个字段齐全
□ 测试骨架：≥30 个 it()，可加载运行，无语法错误
□ 对齐报告：ai-docs/story-manager-alignment.md 已生成
□ 所有 D1–D6 候选不一致均有最终结论
```

**验证标准**：
- 验收清单全部打勾（无 ☐ 未完成项）
- 如存在无法修复的已知遗留问题，须在报告末尾"遗留问题"小节中逐条记录，说明原因和影响评估

---

## WHEN/THEN 场景覆盖矩阵

> 确保规范中所有场景至少被一个任务的验证标准所覆盖。

| 能力 | 规范 WHEN/THEN 数量 | 覆盖任务 | 测试 it() 编号 |
|------|---------------------|----------|----------------|
| C1 init | 3 个场景 + 不发事件 | T1.1 核查，T3.1 生成测试 | 4 个 it |
| C2 onTick | 4 个场景 | T1.2 核查，T3.1 生成测试 | 4 个 it |
| C3 getCurrentChapter/Scenes | 3 个场景 | T1.3 核查，T3.1 生成测试 | 4 个 it |
| C4 markSceneSeen | 3 个场景 | T1.4 核查，T3.1 生成测试 | 3 个 it |
| C5 advanceChapter | 4 个场景 | T1.5 核查，T3.1 生成测试 | 4 个 it |
| C6 checkUnlock | 6 个场景 | T1.6 核查，T3.1 生成测试 | 6 个 it |
| C7 _triggerMonologue | 8 个场景 | T1.7 核查，T3.1 生成测试 | 9 个 it |
| C8 getDialogue | 4 个场景（+边界） | T1.8 核查，T3.1 生成测试 | 4 个 it |
| C9 getProfile | 2 个场景 | T1.9 核查，T3.1 生成测试 | 2 个 it |
| C10 getState | 2 个场景 | T1.10 核查，T3.1 生成测试 | 2 个 it |
| **合计** | **39 个场景** | T1–T4 完整覆盖 | **≥ 42 个 it** |

---

## 附录：候选不一致终态速查

| 编号 | 描述 | 处理结论 |
|------|------|----------|
| D1 | `_triggerMonologue` 随机取下标 vs 取值 | T1.7 确认后记录（预期 PASS） |
| D2 | `init()` 检查 `saved.story` 优先于 `saved` 的顺序 | T1.1 结合 main.js 调用链确认功能等效性（预期 PASS） |
| D3 | `checkUnlock` prologue 下 idx=-1 导致 chapters[0] 路径 | T1.6 确认与规范一致（预期 PASS） |
| D4 | `checkUnlock` unlockCondition=null 时不推进 | T1.6 确认 `?.type` 短路（预期 PASS） |
| D5 | `story:monologue` 载荷含 `ts: Date.now()` | T1.7 确认（预期 PASS） |
| D6 | StoryManager 不监听任何事件 | T1.7 确认无 EventBus.on（预期 PASS） |
| D7（新发现）| `getDialogue()` 空数组边界 | T1.8 核查，如为 FAIL 则 T2.2 修复 |
