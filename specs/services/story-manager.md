---
status: Active
created: 2026-07-17
updated: 2026-07-18
author: AI (spec-architect)
system-spec: specs/system/core-contracts.md
---

# 服务规范：StoryManager

## 概述

管理游戏主线剧情推进（章节/场景）、武将自言自语调度、角色对话查询和角色人设查询。是纯粹的内容服务：不直接修改任何资源，不触发战斗；通过 EventBus 向 UI 广播剧情事件。

初始化顺序位于第 9 位（最后），依赖 ResourceManager 查询金币、HeroManager 查询已拥有武将。

---

## 状态字段

```json
{
  "currentChapter":     "string  — 当前章节 ID，初始为 'prologue'",
  "completedChapters":  "string[] — 已完成章节 ID 列表，初始为 []",
  "seenScenes":         "string[] — 已阅读场景 ID 列表，初始为 []",
  "monologueCooldown":  "number  — 距下次自言自语触发的剩余秒数，初始为 0",
  "latestMonologue":    "{ speaker: string, text: string, ts: number } | null — 最近一次自言自语载荷，初始为 null"
}
```

**规则**：
- 所有字段通过 `getState()` 深拷贝后对外暴露，不可直接引用内部 `_state`。
- `monologueCooldown` 仅在内部使用，UI 不展示该字段。
- `latestMonologue` 持久化到存档，游戏重启后仍可渲染上次独白。

---

## 常量

| 常量 | 值 | 说明 |
|------|----|------|
| `MONOLOGUE_INTERVAL` | `30` | 自言自语触发间隔（秒） |

---

## 数据依赖

| 全局对象 | 使用方式 | 说明 |
|----------|----------|------|
| `MainStory.prologue` | 只读 | 序章对象（id='prologue'，含 scenes 数组，unlockCondition 为 null） |
| `MainStory.chapters` | 只读 | 主线章节数组，每项含 `{ id, title, description, scenes[], unlockCondition }` |
| `IdleMonologues` | 只读 | 按 story ID 分组的自言自语文本池，每个 ID 下含 `{ idle, night, lowMoney, bored, ... }` |
| `CharacterDialogues` | 只读 | 按 story ID 分组的角色对话，每个 ID 下含 `{ greet, upgrade, battle, gift, special }` |
| `CharacterProfiles` | 只读 | 按 story ID 分组的角色人设 `{ name, title, quality, originalRole, currentRole, personality, appearance?, quirks[] }` |
| `ResourceManager` | 只读调用 | `ResourceManager.get(CONSTANTS.RESOURCE.GOLD)` — 读取当前金币量 |
| `HeroManager` | 只读调用 | `HeroManager.getAll()` — 读取玩家已拥有武将列表 |
| `Utils.randInt` | 纯函数 | 随机整数，用于从文本池中随机取一条 |
| `Utils.deepClone` | 纯函数 | 深拷贝状态 |

### 章节对象结构

```json
{
  "id": "string — 章节唯一标识",
  "title": "string — 章节标题",
  "description": "string — 章节简介",
  "scenes": [
    {
      "id": "string — 场景唯一标识",
      "speaker": "string — 发言者名称（如 '诸葛亮'、'天道系统'、'旁白'）",
      "type": "'dialogue' | 'narration' | 'system' — 场景类型",
      "text": "string — 台词内容"
    }
  ],
  "unlockCondition": "{ type: 'stage_clear', stageId: number } | null"
}
```

### Hero ID → Story ID 映射表

StoryManager 内部维护 `_heroIdAlias` 将 HeroManager 武将 ID 转换为 Story 系统 ID：

| Hero ID | Story ID |
|---------|----------|
| `shu_zhugeliang` | `zhuge_liang` |
| `shu_liubei` | `liu_bei` |
| `shu_guanyu` | `guan_yu` |
| `shu_zhangfei` | `zhang_fei` |
| `shu_zhaoyun` | `zhao_yun` |
| `shu_huangzhong` | `huang_zhong` |
| `shu_machao` | `ma_chao` |
| `wei_caocao` | `cao_cao` |
| `wei_simayi` | `sima_yi` |
| `wei_xiahoudun` | `xiahou_dun` |
| `wei_zhangliao` | `zhang_liao` |
| `wei_dianwei` | `dian_wei` |
| `wei_xunyu` | `xun_yu` |
| `wu_sunquan` | `sun_quan` |
| `wu_zhouyu` | `zhou_yu` |
| `wu_sunshangxiang` | `sun_shangxiang` |
| `wu_taishici` | `tai_shi_ci` |
| `qun_lvbu` | `lv_bu` |
| `qun_diaochan` | `diao_chan` |
| `qun_huatuo` | `hua_tuo` |

**规则**：映射不到时直接使用原始 heroId 作为 story ID。

---

## 能力

### 能力 1：初始化与存档恢复

**描述**：从存档片段恢复剧情状态；若无存档则使用默认值。

**接口**：
- `init(saved)` → `void`
  - `saved`: 剧情状态片段 `{ currentChapter, completedChapters, seenScenes, ... }` 或 `undefined`（首次游戏）

**行为规则**：
- 若 `saved` 含有 `currentChapter` 字段，则以 `saved` 浅合并覆盖 `_state`（标准片段格式）。
- 若 `saved.story` 含有 `currentChapter` 字段（旧存档兼容：`saved` 为整体存档对象而非片段），则以 `saved.story` 浅合并覆盖 `_state`（向后兼容旧格式）。
- 若 `saved` 为 `undefined` 或不含剧情字段，保持默认状态（`currentChapter='prologue'`，其余为空）。
- `init()` **不发送任何事件**。

**验收场景**：

```
WHEN saved 为 undefined（首次游戏）
THEN currentChapter = 'prologue'
AND completedChapters = []
AND seenScenes = []
AND monologueCooldown = 0
AND latestMonologue = null

WHEN saved = { currentChapter: 'chapter_1', completedChapters: ['prologue'], seenScenes: ['prologue_1'], monologueCooldown: 15, latestMonologue: {...} }
（标准片段格式：saved 直接含有 currentChapter）
THEN currentChapter = 'chapter_1'
AND completedChapters = ['prologue']
AND seenScenes = ['prologue_1']
AND monologueCooldown = 15

WHEN saved = { story: { currentChapter: 'chapter_2', completedChapters: ['prologue', 'chapter_1'], seenScenes: [] } }
（向后兼容：旧版存档将剧情嵌套在 saved.story 下）
THEN currentChapter = 'chapter_2'
AND completedChapters = ['prologue', 'chapter_1']
AND seenScenes = []
```

---

### 能力 2：Tick 驱动（自言自语冷却）

**描述**：由 GameLoop 每秒调用，倒扣冷却时间；冷却归零时立即触发自言自语并重置计时器。

**接口**：
- `onTick(dt)` → `void`
  - `dt`: 本次 tick 的时间增量（秒，正常为 1）

**行为规则**：
- `monologueCooldown -= dt`（可降为负数）。
- 当 `monologueCooldown <= 0` 时，调用 `_triggerMonologue()`，然后将 `monologueCooldown` 重置为 `MONOLOGUE_INTERVAL`（30）。
- 游戏启动后首次 tick 即开始倒计时，`monologueCooldown` 初始为 0，因此**第一秒就会触发**一次自言自语。

**验收场景**：

```
WHEN monologueCooldown = 0
AND onTick(1) 被调用
THEN _triggerMonologue() 被调用一次
AND monologueCooldown 重置为 30

WHEN monologueCooldown = 15
AND onTick(1) 被调用 14 次
THEN monologueCooldown = 1，_triggerMonologue() 未被调用

WHEN monologueCooldown = 1
AND onTick(1) 被调用
THEN monologueCooldown = 0 → 触发，重置为 30

WHEN monologueCooldown = 5
AND onTick(10) 被调用（dt=10，追帧场景）
THEN monologueCooldown 降为 -5 ≤ 0，触发并重置为 30
```

---

### 能力 3：当前章节查询

**描述**：返回当前章节对象和其下的所有场景。

**接口**：
- `getCurrentChapter()` → `ChapterObject | null`
- `getCurrentScenes()` → `Scene[]`（章节不存在时返回 `[]`）

**行为规则**：
- `currentChapter === 'prologue'` 时，返回 `MainStory.prologue`（特殊处理，prologue 不在 chapters 数组中）。
- 其他情况在 `MainStory.chapters` 中用 `id` 查找；找不到返回 `null`。
- `getCurrentScenes()` 调用 `getCurrentChapter()`，章节为 `null` 时返回 `[]`。

**验收场景**：

```
WHEN currentChapter = 'prologue'
THEN getCurrentChapter() 返回 MainStory.prologue 对象
AND getCurrentScenes() 返回 MainStory.prologue.scenes（非空数组）

WHEN currentChapter = 'chapter_1'
AND MainStory.chapters 中存在 id='chapter_1' 的章节
THEN getCurrentChapter() 返回该章节对象

WHEN currentChapter = 'chapter_99'（不存在的 ID）
THEN getCurrentChapter() 返回 null
AND getCurrentScenes() 返回 []
```

---

### 能力 4：标记场景已读

**描述**：将指定场景 ID 加入 `seenScenes` 列表（幂等操作），并广播事件。

**接口**：
- `markSceneSeen(sceneId)` → `void`
  - `sceneId`: 场景唯一 ID

**行为规则**：
- 若 `seenScenes` 中**不包含** `sceneId`，将其追加，然后 emit `story:scene_seen`。
- 若已包含，**静默忽略**（不重复追加，不重复 emit）。
- 不校验 `sceneId` 是否属于当前章节——调用方负责传入合法 ID。

**验收场景**：

```
WHEN seenScenes = []
AND markSceneSeen('prologue_1')
THEN seenScenes = ['prologue_1']
AND emit story:scene_seen('prologue_1') 被调用一次

WHEN seenScenes = ['prologue_1']
AND markSceneSeen('prologue_1')（重复标记）
THEN seenScenes 仍为 ['prologue_1']（无重复）
AND story:scene_seen 不再 emit

WHEN markSceneSeen 被连续调用 ['ch1_1', 'ch1_2', 'ch1_3']
THEN seenScenes = ['ch1_1', 'ch1_2', 'ch1_3']
AND story:scene_seen 各 emit 一次，共 3 次
```

---

### 能力 5：章节推进

**描述**：将当前章节标记为已完成，推进到下一章节，并广播解锁事件。

**接口**：
- `advanceChapter()` → `void`

**行为规则**：
- **从 prologue 推进**：
  - 若 `MainStory.chapters` 非空，将 `'prologue'` 加入 `completedChapters`，`currentChapter` 更新为 `chapters[0].id`，emit `story:chapter_unlocked(chapters[0])`。
  - 若 `chapters` 为空，**静默忽略**。
- **从普通章节推进**：
  - 在 `chapters` 中查找 `currentChapter` 的索引 `idx`。
  - 若 `idx >= 0` 且 `idx < chapters.length - 1`（存在下一章），将当前 ID 加入 `completedChapters`，`currentChapter` 更新为 `chapters[idx + 1].id`，emit `story:chapter_unlocked(chapters[idx + 1])`。
  - 若已是最后一章（`idx === chapters.length - 1`），**静默忽略**（当前无更多章节）。
  - 若当前 ID 不在 `chapters` 中（`idx === -1`），**静默忽略**。
- 已完成章节重复加入 `completedChapters` 不做去重校验（调用方不应重复触发）。

**验收场景**：

```
WHEN currentChapter = 'prologue'
AND MainStory.chapters = [{ id: 'chapter_1', ... }, { id: 'chapter_2', ... }]
AND advanceChapter()
THEN completedChapters 包含 'prologue'
AND currentChapter = 'chapter_1'
AND emit story:chapter_unlocked({ id: 'chapter_1', ... }) 被调用一次

WHEN currentChapter = 'chapter_1'（位于 chapters[0]）
AND advanceChapter()
THEN completedChapters 包含 'chapter_1'
AND currentChapter = 'chapter_2'
AND emit story:chapter_unlocked({ id: 'chapter_2', ... })

WHEN currentChapter = 'chapter_N'（最后一章）
AND advanceChapter()
THEN currentChapter 不变，completedChapters 不变，不 emit 事件

WHEN currentChapter = 'prologue'
AND MainStory.chapters = []
AND advanceChapter()
THEN currentChapter = 'prologue'（无变化），不 emit 事件
```

---

### 能力 6：解锁条件检查

**描述**：根据通关关卡 ID 检查是否满足下一章节的解锁条件，满足则自动推进章节。

**接口**：
- `checkUnlock(stageId)` → `void`
  - `stageId`: 当前通关关卡的数字 ID（由 BattleManager 在关卡胜利时传入）

**行为规则**：
- 在 `MainStory.chapters` 中查找 `currentChapter` 的索引 `currentIdx`。
- 取 `nextChapter = chapters[currentIdx + 1]`。
- 满足**全部**以下条件时，调用 `advanceChapter()`：
  1. `nextChapter` 存在。
  2. `nextChapter.unlockCondition.type === 'stage_clear'`。
  3. `nextChapter.unlockCondition.stageId <= stageId`（通关关卡号 ≥ 解锁要求）。
- 若当前为 `prologue`（`currentIdx === -1`），`nextChapter = chapters[-1 + 1] = chapters[0]`：此时同样遵循上述规则检查 `chapters[0]` 的条件。
- 当前已是最后一章（`nextChapter` 为 `undefined`），**静默忽略**。
- `unlockCondition` 为 `null` 或类型不为 `'stage_clear'` 时，**不推进**。

**验收场景**：

```
WHEN currentChapter = 'prologue'（currentIdx = -1，nextChapter = chapters[0]）
AND chapters[0].unlockCondition = { type: 'stage_clear', stageId: 10 }
AND checkUnlock(5)
THEN advanceChapter() 不被调用（5 < 10）

WHEN currentChapter = 'prologue'
AND chapters[0].unlockCondition = { type: 'stage_clear', stageId: 10 }
AND checkUnlock(10)
THEN advanceChapter() 被调用，currentChapter → 'chapter_1'

WHEN currentChapter = 'chapter_1'（位于 chapters[0]）
AND chapters[1].unlockCondition = { type: 'stage_clear', stageId: 20 }
AND checkUnlock(25)
THEN advanceChapter() 被调用（25 >= 20）

WHEN currentChapter = 'chapter_1'
AND chapters[1].unlockCondition = { type: 'time_based', hours: 24 }（非 stage_clear 类型）
AND checkUnlock(999)
THEN advanceChapter() 不被调用

WHEN 下一章 nextChapter.unlockCondition = null
AND checkUnlock(任意 stageId)
THEN advanceChapter() 不被调用，currentChapter 不变

WHEN currentChapter 已是最后一章
AND checkUnlock(任意 stageId)
THEN 静默忽略，无任何变化
```

---

### 能力 7：自言自语触发

**描述**：从已拥有武将 + 系统中随机选一位，根据当前时段和资源情况选择对话类别，随机取一条文本，广播独白事件。

**接口**：
- `_triggerMonologue()` → `void`（内部方法，由 `onTick` 调用）

**场景类别选择规则**（按优先级从高到低）：

| 条件 | 类别 |
|------|------|
| 当前小时 ∈ [22, 23] 或 [0, 5] | `night` |
| 非夜间 AND `ResourceManager.get(GOLD) < 80` | `lowMoney` |
| 非夜间 AND `Math.random() < 0.1` | `bored` |
| 否则 | `idle` |

> `lowMoney` 判断优先于 `bored`——二者不同时触发。

**发言者候选池构建**：
1. 始终包含 `'system'`（天道系统）。
2. 遍历 `HeroManager.getAll()`，将每位武将的 `id` 经 `_heroIdAlias` 映射为 `storyHeroId`；若 `IdleMonologues[storyHeroId]` 存在，则加入候选池。

**随机选取逻辑**：
1. `sourceIndex = Utils.randInt(0, sources.length - 1)` 随机选候选者下标。
2. `sourceId = sources[sourceIndex]` 取对应的候选者 ID（字符串）。
3. `pool = IdleMonologues[sourceId]`；若 `pool` 不存在，**静默返回**。
4. `lines = pool[category] || pool.idle || []`；若 `lines` 为空，**静默返回**。
5. 随机取 `line = lines[Utils.randInt(0, lines.length - 1)]`。
6. `speakerName`: `sourceId === 'system'` → `'天道系统'`；否则 → `CharacterProfiles[sourceId]?.name || sourceId`。
7. 构建载荷 `{ speaker: speakerName, text: line, ts: Date.now() }`，赋值到 `_state.latestMonologue`，emit `story:monologue(payload)`。

**验收场景**：

```
WHEN 当前时间 = 23:00
AND _triggerMonologue() 被调用
THEN category = 'night'
AND 从 pool['night'] 或 pool['idle'] 中取文本（如 pool['night'] 不存在则 fallback）

WHEN 当前时间 = 10:00
AND ResourceManager.get('gold') = 50（< 80）
AND _triggerMonologue() 被调用
THEN category = 'lowMoney'

WHEN 当前时间 = 10:00
AND ResourceManager.get('gold') = 500（>= 80）
AND Math.random() 返回 0.05（< 0.1）
AND _triggerMonologue() 被调用
THEN category = 'bored'

WHEN 当前时间 = 10:00
AND ResourceManager.get('gold') = 500
AND Math.random() 返回 0.5（>= 0.1）
AND _triggerMonologue() 被调用
THEN category = 'idle'

WHEN HeroManager.getAll() = []（无武将）
AND _triggerMonologue() 被调用
THEN 候选池 = ['system']，发言者必为 '天道系统'

WHEN HeroManager.getAll() 含有 { id: 'shu_zhugeliang', ... }
AND IdleMonologues['zhuge_liang'] 存在
THEN 候选池包含 'zhuge_liang'，可能从诸葛亮文本池中取文本

WHEN 随机选中的 sourceId 对应的 pool['category'] 和 pool['idle'] 均为 []
THEN _triggerMonologue() 静默返回，不 emit 事件，latestMonologue 不更新

WHEN _triggerMonologue() 成功取到文本
THEN emit story:monologue({ speaker: '天道系统', text: '...', ts: <timestamp> })
AND _state.latestMonologue 更新为该载荷
```

---

### 能力 8：角色对话查询

**描述**：从 `CharacterDialogues` 中随机取一条指定类别的角色对话。

**接口**：
- `getDialogue(characterId, category)` → `string | null`
  - `characterId`: Story ID（如 `'zhuge_liang'`）
  - `category`: 对话类别（`'greet' | 'upgrade' | 'battle' | 'gift' | 'special'`）

**行为规则**：
- 若 `CharacterDialogues[characterId]` 不存在，返回 `null`。
- 若 `CharacterDialogues[characterId][category]` 不存在或为空，返回 `null`。
- 否则从该类别数组中随机返回一条字符串。
- 每次调用结果独立随机，不保证与上次不同。

**验收场景**：

```
WHEN characterId = 'zhuge_liang', category = 'greet'
AND CharacterDialogues['zhuge_liang']['greet'] = ['你好，在忙着推演天下。', '有何指教？']
THEN 返回该数组中的任意一条字符串

WHEN characterId = 'unknown_hero'（不存在）
THEN 返回 null

WHEN characterId = 'zhuge_liang', category = 'gift'
AND CharacterDialogues['zhuge_liang']['gift'] 不存在
THEN 返回 null

WHEN characterId = 'zhuge_liang', category = 'unknown_category'（不存在的类别）
THEN 返回 null
```

---

### 能力 9：角色人设查询

**描述**：返回指定角色的人设对象，供 UI 渲染角色档案卡片。

**接口**：
- `getProfile(characterId)` → `CharacterProfile | null`
  - `characterId`: Story ID（如 `'zhuge_liang'`）

**CharacterProfile 结构**：
```json
{
  "name": "string — 角色中文名",
  "title": "string — 角色标题/职位",
  "quality": "number — 品质等级（1-5，对应核心契约品质枚举）",
  "originalRole": "string — 正史身份",
  "currentRole": "string — 游戏内当前身份（荒诞跑偏版）",
  "personality": "string — 性格特征",
  "appearance": "string? — 外貌描述（可选）",
  "quirks": "string[] — 角色怪癖列表（可为空数组）"
}
```

**行为规则**：
- 若 `CharacterProfiles[characterId]` 存在，**原样返回原对象引用**（不深拷贝，为有意优化——数据量大且只读；调用方不得修改返回值）。
- 若不存在，返回 `null`。

**验收场景**：

```
WHEN characterId = 'zhuge_liang'
AND CharacterProfiles['zhuge_liang'] = { name: '诸葛亮', quality: 5, ... }
THEN 返回该对象

WHEN characterId = 'nonexistent'
THEN 返回 null
```

---

### 能力 10：状态导出

**描述**：返回当前剧情状态的深拷贝，供 SaveManager 持久化和 UI 读取。

**接口**：
- `getState()` → `StoryState`（深拷贝）

**行为规则**：
- 返回的对象是 `_state` 的深拷贝（通过 `Utils.deepClone`），修改返回值不影响内部状态。
- 包含全部 5 个字段：`currentChapter`, `completedChapters`, `seenScenes`, `monologueCooldown`, `latestMonologue`。

**验收场景**：

```
WHEN getState() 被调用
THEN 返回对象包含 currentChapter, completedChapters, seenScenes, monologueCooldown, latestMonologue

WHEN 修改 getState() 返回的对象
THEN StoryManager._state 不受影响（深拷贝隔离）
```

---

## 事件契约

> 跨服务事件协议定义在 [系统核心契约](../system/core-contracts.md#事件契约)，本节仅列举 StoryManager 发出的事件。

| 事件 | 触发时机 | 载荷类型 | 说明 |
|------|----------|----------|------|
| `story:scene_seen` | `markSceneSeen()` 标记新场景时 | `string` — sceneId | 幂等，仅首次标记触发 |
| `story:chapter_unlocked` | `advanceChapter()` 成功推进时 | `ChapterObject` — 新解锁的章节对象 | 含 id, title, description, scenes, unlockCondition |
| `story:monologue` | `_triggerMonologue()` 成功取到文本时 | `{ speaker: string, text: string, ts: number }` | ts 为 `Date.now()` 毫秒时间戳 |

**规则**：
- 三个事件均通过 `EventBus.emit()` 同步发出。
- 载荷必须可 JSON 序列化（均符合）。
- StoryManager **不监听**任何事件，由外部调用方（BattleManager 在关卡胜利时调用 `checkUnlock`，GameLoop 调用 `onTick`）驱动行为。
- 特别地，StoryManager **不监听 `hero:added`**；武将候选池在每次 `_triggerMonologue()` 调用时通过 `HeroManager.getAll()` 实时构建，无需订阅武将新增事件。

---

## 内部状态机

StoryManager 章节推进为线性状态机：

```
[prologue] ──advanceChapter()──▶ [chapter_1] ──advanceChapter()──▶ [chapter_2] ──▶ ... ──▶ [chapter_N（终态）]
```

| 当前状态 | 转换到 | 触发器 | 守卫条件 |
|----------|--------|--------|----------|
| `prologue` | `chapters[0]` | `advanceChapter()` | `chapters.length > 0` |
| `chapter_K` | `chapter_K+1` | `advanceChapter()` | `idx >= 0 && idx < chapters.length - 1` |
| `chapter_N`（最后） | —（终态） | — | 无可推进章节 |

自言自语为简单冷却循环：

| 状态 | 转换到 | 触发器 | 守卫 |
|------|--------|--------|------|
| 冷却中 | 触发 | `monologueCooldown <= 0` | 文本池非空 |
| 触发 | 冷却中 | 文本广播完成 | 始终（重置为 30） |

---

## 存档兼容

**迁移规则**：`init(saved)` 必须处理以下情况：

| 情况 | 处理方式 |
|------|----------|
| `saved` 为 `undefined` | 使用全默认值，不报错 |
| `saved` 直接含 `currentChapter`（标准片段格式） | 以 `saved` 浅合并覆盖 `_state` |
| `saved.story` 存在且含 `currentChapter`（旧整体存档兼容） | 以 `saved.story` 浅合并覆盖 `_state` |
| 存档缺少 `seenScenes` 或 `completedChapters` | 保留初始空数组默认值 |
| `latestMonologue` 为 `null` | 正常，UI 显示"暂无独白" |

---

## 依赖关系

| 依赖方向 | 依赖项 | 用途 | 是否可选 |
|----------|--------|------|----------|
| StoryManager → ResourceManager | `ResourceManager.get(GOLD)` | 自言自语类别判断（lowMoney） | 否 |
| StoryManager → HeroManager | `HeroManager.getAll()` | 构建自言自语候选池 | 否 |
| StoryManager → MainStory | 只读数据 | 章节和场景数据 | 否 |
| StoryManager → IdleMonologues | 只读数据 | 自言自语文本池 | 否 |
| StoryManager → CharacterDialogues | 只读数据 | 角色对话文本 | 否 |
| StoryManager → CharacterProfiles | 只读数据 | 角色人设数据（自言自语发言者名称 + getProfile） | 否 |
| BattleManager → StoryManager | `checkUnlock(stageId)` | 关卡通关后触发章节解锁检查 | — |
| GameLoop → StoryManager | `onTick(dt)` | 驱动自言自语冷却 | — |
| StoryPanel → StoryManager | `getState()`, `markSceneSeen()`, `getCurrentChapter()`, `getCurrentScenes()`, `getProfile()`, `getDialogue()` | UI 渲染和交互 | — |

---

## 数据所有权

| 实体 | 本服务拥有 | 共享给 | 方式 |
|------|-----------|--------|------|
| 章节进度 | currentChapter, completedChapters | UI | `getState()` |
| 场景已读记录 | seenScenes | UI | `getState()` |
| 自言自语状态 | monologueCooldown, latestMonologue | UI | `getState()` |
| 角色人设 | —（数据在 CharacterProfiles，只读透传） | UI | `getProfile()` |
| 角色对话 | —（数据在 CharacterDialogues，只读透传） | UI | `getDialogue()` |

---

## 导航

- 系统契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 相关服务：[specs/services/hero-manager.md](hero-manager.md)（提供武将列表用于自言自语）
- 相关服务：[specs/services/resource-manager.md](resource-manager.md)（提供金币余量用于类别判断）
- 相关服务：[specs/services/battle-manager.md](battle-manager.md)（通关时调用 `checkUnlock`）
