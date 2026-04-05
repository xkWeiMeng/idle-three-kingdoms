---
status: Active
created: 2026-04-05
updated: 2026-04-05
author: AI (spec-architect)
system-spec: specs/system/core-contracts.md
---

# 服务规范：RecruitManager

## 概述

管理武将招募（抽卡）系统。负责品质判定、保底机制、资源扣除和招募结果发放。
招募是玩家获取新武将的核心途径，通过消耗 `jade`（玉璧）执行抽卡，按概率获得不同品质的武将。

品质等级定义在 [核心契约](../system/core-contracts.md#品质等级枚举)。

## 能力

### 能力 1：单次招募

**描述**：消耗 100 玉璧执行一次招募，按品质概率和保底规则抽取一名武将。

**接口**：
- `recruitSingle()` → `{ heroId, quality } | null`

**行为规则**：
- 消耗 `jade × 100`，通过 `ResourceManager.spend('jade', 100)` 扣除
- 扣费前检查 `ResourceManager.canAfford('jade', 100)`
- 玉璧不足时 emit `toast:show({ type: 'warning', message: '玉璧不足！需要💎×100' })`，返回 `null`
- 品质由 `_determineQuality()` 决定（见能力 4）
- 抽取结果通过 `HeroManager.addHero(heroId)` 添加武将
- 完成后 emit `recruit:result`（见事件载荷格式）

**验收场景**：

```
WHEN recruitSingle()
AND ResourceManager.canAfford('jade', 100) 为 true
THEN ResourceManager.spend('jade', 100) 被调用
AND 品质由 _determineQuality() 决定
AND 从 HeroPoolByQuality[quality] 中随机选取 heroId
AND hero = HeroManager.addHero(heroId) 被调用
AND isNew = (hero !== null)（非 null 表示新武将，null 表示重复已转化经验）
AND template = HeroData.find(h => h.id === heroId)
AND emit recruit:result({ results: [{ heroId, quality, isNew, template }], pity: currentPity })
AND 返回 { heroId, quality }

WHEN recruitSingle()
AND ResourceManager.canAfford('jade', 100) 为 false
THEN emit toast:show({ type: 'warning', message: '玉璧不足！需要💎×100' })
AND 不扣除资源，不执行招募
AND 返回 null

WHEN recruitSingle()
AND _determineQuality() 返回的品质对应 HeroPoolByQuality 为空数组或不存在
THEN 降级到 HeroPoolByQuality[1]（白色品质池）中随机选取
AND 结果中 quality 设为 1
```

---

### 能力 2：十连招募

**描述**：消耗 900 玉璧执行十次招募（享受 10% 折扣），依次执行 10 次独立抽取。

**接口**：
- `recruitTen()` → `Array<{ heroId, quality }> | null`

**行为规则**：
- 消耗 `jade × 900`（正常 10 次为 1000，折扣 10%）
- 一次性扣费，非逐次扣费
- 扣费前检查 `ResourceManager.canAfford('jade', 900)`
- 玉璧不足时 emit `toast:show({ type: 'warning', message: '玉璧不足！需要💎×900' })`，返回 `null`
- 10 次抽取依次执行，每次独立调用 `_determineQuality()` 和 `_updatePity()`
- 每次抽取结果立即调用 `HeroManager.addHero(heroId)`
- 10 次全部完成后 emit 一次 `recruit:result`，`results` 数组包含全部 10 条结果

**验收场景**：

```
WHEN recruitTen()
AND ResourceManager.canAfford('jade', 900) 为 true
THEN ResourceManager.spend('jade', 900) 被调用一次
AND 执行 10 次独立抽取（每次调用 _doSingleRecruit()）
AND 每次抽取的品质和保底独立计算
AND 每次 hero = HeroManager.addHero(heroId)，isNew = (hero !== null)
AND emit recruit:result({ results: [10条结果], pity: 最终pity })
AND 返回包含 10 条结果的数组

WHEN recruitTen()
AND ResourceManager.canAfford('jade', 900) 为 false
THEN emit toast:show({ type: 'warning', message: '玉璧不足！需要💎×900' })
AND 不扣除资源，不执行招募
AND 返回 null

WHEN recruitTen()
AND 第 3 次抽取触发保底获得紫色
THEN 第 3 次的 epic 保底计数器重置为 0
AND 第 4-10 次的保底从重置后状态继续累加
```

---

### 能力 3：免费招募

**描述**：首次游戏提供一次免费招募，保证获得蓝色（Rare）或更高品质武将。

**接口**：
- `freeRecruit()` → `{ heroId, quality } | null`
- `isFreeRecruitAvailable()` → `boolean`

**行为规则**：
- 每账号仅可使用一次（`_state.freeRecruitUsed` 标记）
- 已使用时返回 `null`
- 不消耗玉璧
- 执行前将 `_state.pity.rare` 设为 `9`，使 `_determineQuality()` 触发蓝色保底
- 之后正常调用 `_doSingleRecruit()`，保底机制保证品质 ≥ 3（蓝色）
- 完成后 emit `recruit:result`

**验收场景**：

```
WHEN freeRecruit()
AND _state.freeRecruitUsed 为 false
THEN _state.freeRecruitUsed 设为 true
AND _state.pity.rare 设为 9
AND _determineQuality() 至少返回 3（蓝色保底触发）
AND 不消耗玉璧
AND HeroManager.addHero(heroId) 被调用
AND emit recruit:result(...)
AND 返回 { heroId, quality }

WHEN freeRecruit()
AND _state.freeRecruitUsed 为 true
THEN 返回 null
AND 不修改任何状态
AND 不发射任何事件

WHEN freeRecruit()
AND 随机 roll 碰巧落入紫色或橙色区间
THEN 返回更高品质（紫色或橙色），不被限制为蓝色
AND 对应的保底计数器正常重置
```

---

### 内部方法：_doSingleRecruit()

**描述**：执行单次招募的完整内部流程。

**接口**：
- `_doSingleRecruit()` → `{ heroId: string, quality: number }` — 内部方法

**调用顺序**：
1. `quality = _determineQuality()` — 判定品质（含保底检查）
2. `_updatePity(quality)` — 更新保底计数器
3. 从 `HeroPoolByQuality[quality]` 中等概率随机选取 `heroId`
4. 若池为空或不存在，降级到 `HeroPoolByQuality[1]`（白色池），quality 设为 1
5. 返回 `{ heroId, quality }`

> 此方法不处理资源扣除、武将添加或事件发射，仅负责品质判定 + 池选取 + 保底更新。

---

### 能力 4：品质判定

**描述**：根据基础概率和保底机制确定单次招募的武将品质。

**接口**：
- `_determineQuality()` → `number`（1-5）— 内部方法

**行为规则**：

**保底优先级**（从高到低判定）：

| 保底类型 | 触发条件 | 保证品质 |
|----------|----------|----------|
| 橙色保底 | `pity.legendary >= 79`（第 80 抽） | 5（橙色） |
| 紫色保底 | `pity.epic >= 29`（第 30 抽） | 4（紫色） |
| 蓝色保底 | `pity.rare >= 9`（第 10 抽） | 3（蓝色） |

**基础概率**（保底未触发时）：

| Roll 范围 | 品质 | 概率 |
|-----------|------|------|
| `[0, 3)` | 5（橙色） | 3% |
| `[3, 12)` | 4（紫色） | 9% |
| `[12, 30)` | 3（蓝色） | 18% |
| `[30, 60)` | 2（绿色） | 30% |
| `[60, 100)` | 1（白色） | 40% |

- Roll 值由 `Math.random() * 100` 生成
- 保底判定在概率 roll 之前执行

**验收场景**：

```
WHEN pity.legendary = 79
THEN _determineQuality() 返回 5（橙色保底触发）
AND 不执行概率 roll

WHEN pity.legendary = 78, pity.epic = 29
THEN _determineQuality() 返回 4（紫色保底触发）
AND 橙色保底未触发

WHEN pity.legendary = 78, pity.epic = 28, pity.rare = 9
THEN _determineQuality() 返回 3（蓝色保底触发）

WHEN pity = { rare: 0, epic: 0, legendary: 0 }
AND 无保底触发
THEN 按基础概率 roll：40% 白、30% 绿、18% 蓝、9% 紫、3% 橙

WHEN pity.legendary = 0, pity.epic = 0, pity.rare = 0
AND Math.random() * 100 = 2.5（< 3）
THEN _determineQuality() 返回 5（橙色，概率命中）
```

---

### 能力 5：保底计数更新

**描述**：每次招募后更新保底计数器。获得高品质武将时重置对应及以下品质的计数器。

**接口**：
- `_updatePity(quality)` → `void` — 内部方法

**行为规则**：
- 每次招募，所有三个计数器（`rare`, `epic`, `legendary`）各自 +1
- 获得品质 ≥ 3（蓝色）时，`pity.rare` 重置为 0
- 获得品质 ≥ 4（紫色）时，`pity.epic` 重置为 0
- 获得品质 ≥ 5（橙色）时，`pity.legendary` 重置为 0
- 重置操作在 +1 之后执行
- `totalRecruits` 每次招募 +1

**验收场景**：

```
WHEN _updatePity(1)（获得白色）
THEN pity.rare += 1, pity.epic += 1, pity.legendary += 1
AND 无计数器重置
AND totalRecruits += 1

WHEN _updatePity(3)（获得蓝色）
THEN pity.rare 先 +1 后重置为 0
AND pity.epic += 1（不重置）
AND pity.legendary += 1（不重置）

WHEN _updatePity(4)（获得紫色）
THEN pity.rare 先 +1 后重置为 0
AND pity.epic 先 +1 后重置为 0
AND pity.legendary += 1（不重置）

WHEN _updatePity(5)（获得橙色）
THEN 所有三个计数器先 +1 后重置为 0

WHEN pity = { rare: 5, epic: 20, legendary: 50 }
AND _updatePity(3)
THEN pity = { rare: 0, epic: 21, legendary: 51 }
```

---

### 能力 6：查询接口

**描述**：提供保底状态和招募统计的只读查询。

**接口**：
- `getPity()` → `{ rare: number, epic: number, legendary: number }` — 当前保底计数器浅拷贝
- `getTotalRecruits()` → `number` — 累计招募次数
- `isFreeRecruitAvailable()` → `boolean` — 免费招募是否可用

**行为规则**：
- `getPity()` 返回浅拷贝（`{...this._state.pity}`），修改返回值不影响内部状态
- `getTotalRecruits()` 返回 `_state.totalRecruits` 的原始值

**验收场景**：

```
WHEN pity = { rare: 5, epic: 10, legendary: 30 }
AND getPity()
THEN 返回 { rare: 5, epic: 10, legendary: 30 }
AND 修改返回对象不影响 _state.pity

WHEN totalRecruits = 42
AND getTotalRecruits()
THEN 返回 42

WHEN freeRecruitUsed = false
AND isFreeRecruitAvailable()
THEN 返回 true

WHEN freeRecruitUsed = true
AND isFreeRecruitAvailable()
THEN 返回 false
```

---

### 能力 7：初始化与存档

**描述**：从存档恢复状态或初始化新游戏默认状态。

**接口**：
- `init(saved)` → `void` — 初始化，`saved` 为完整存档对象（含 `recruit` 键）或旧格式的直接 recruit 状态对象
- `getState()` → `object` — 导出可序列化状态

**行为规则**：
- **新游戏**（`saved` 为 `undefined`）：使用默认状态，所有计数器为 0，`freeRecruitUsed` 为 `false`
- **恢复存档**：支持两种存档格式（向后兼容）
  - 新格式：`saved.recruit` 存在时使用 `saved.recruit`
  - 旧格式：`saved.pity` 存在时直接使用 `saved`（早期版本存档）
- `getState()` 返回深拷贝（`Utils.deepClone(this._state)`）

**状态结构**：

```json
{
  "pity": {
    "rare": "number — 自上次获得蓝色+以来的抽数，范围 [0, 9]",
    "epic": "number — 自上次获得紫色+以来的抽数，范围 [0, 29]",
    "legendary": "number — 自上次获得橙色以来的抽数，范围 [0, 79]"
  },
  "totalRecruits": "number — 累计招募次数（含免费），≥ 0",
  "freeRecruitUsed": "boolean — 免费招募是否已使用"
}
```

**验收场景**：

```
WHEN init(undefined)（首次游戏）
THEN _state = { pity: { rare: 0, epic: 0, legendary: 0 }, totalRecruits: 0, freeRecruitUsed: false }

WHEN init({ recruit: { pity: { rare: 5, epic: 10, legendary: 30 }, totalRecruits: 42, freeRecruitUsed: true } })
THEN _state.pity = { rare: 5, epic: 10, legendary: 30 }
AND _state.totalRecruits = 42
AND _state.freeRecruitUsed = true

WHEN init({ pity: { rare: 3, epic: 7, legendary: 15 }, totalRecruits: 20, freeRecruitUsed: false })
（旧格式存档，无 recruit 包装层）
THEN _state.pity = { rare: 3, epic: 7, legendary: 15 }
AND _state.totalRecruits = 20

WHEN getState()
THEN 返回 _state 的深拷贝
AND 修改返回对象不影响内部状态
```

## 事件载荷格式

### `recruit:result`

| 字段 | 类型 | 说明 |
|------|------|------|
| `results` | `Array<ResultItem>` | 招募结果数组，单抽为 1 条，十连为 10 条 |
| `pity` | `{ rare, epic, legendary }` | 招募完成后的保底计数器快照 |

**ResultItem 结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `heroId` | `string` | 武将模板 ID（如 `'shu_zhugeliang'`） |
| `quality` | `number` | 品质等级 1-5 |
| `isNew` | `boolean` | 是否为新获得的武将（`true`）或重复（`false`） |
| `template` | `object` | 武将模板数据（从 `HeroData` 查询） |

## 武将池数据

品质到武将 ID 的映射（静态数据 `HeroPoolByQuality`）：

| 品质 | 武将 ID 列表 |
|------|-------------|
| 5（橙色） | `shu_zhugeliang`, `shu_liubei`, `shu_guanyu`, `wei_caocao`, `wei_simayi`, `wu_sunquan`, `qun_lvbu` |
| 4（紫色） | `shu_zhangfei`, `shu_zhaoyun`, `shu_huangzhong`, `wei_xiahoudun`, `wu_zhouyu`, `qun_diaochan`, `qun_huatuo` |
| 3（蓝色） | `shu_machao`, `wei_zhangliao`, `wei_dianwei`, `wu_sunshangxiang` |
| 2（绿色） | `wei_xunyu`, `wu_taishici` |
| 1（白色） | `common_soldier`, `common_archer`, `common_cavalry`, `common_guard` |

**规则**：
- 同品质内等概率随机（`Utils.randInt(0, pool.length - 1)`）
- 武将池为静态数据，不可在运行时修改

**不变量**：武将池中的所有 ID 必须在 `HeroData`（含 `CommonUnits`）中存在。数据不一致属于开发错误，不在运行时防御。

## 内部状态机

RecruitManager 无复杂状态机。核心状态为保底计数器的累加和重置：

| 状态 | 转换到 | 触发器 | 守卫条件 |
|------|--------|--------|----------|
| 空闲 | 招募中 | `recruitSingle()` / `recruitTen()` / `freeRecruit()` | 资源足够或免费未用 |
| 招募中 | 空闲 | 招募完成 | — |
| 免费可用 | 免费已用 | `freeRecruit()` | `freeRecruitUsed = false` |

保底计数器状态转换：

| 计数器 | 重置条件 | 触发 |
|--------|----------|------|
| `pity.rare` | 获得品质 ≥ 3 | 重置为 0 |
| `pity.epic` | 获得品质 ≥ 4 | 重置为 0 |
| `pity.legendary` | 获得品质 ≥ 5 | 重置为 0 |

## 依赖

| 依赖项 | 方向 | 说明 |
|--------|------|------|
| ResourceManager | RecruitManager → ResourceManager | `canAfford()` 检查、`spend()` 扣除玉璧 |
| HeroManager | RecruitManager → HeroManager | `addHero()` 添加武将到玩家收藏 |
| HeroData | RecruitManager → HeroData | 查询武将模板数据（`HeroData.find()`） |
| HeroPoolByQuality | RecruitManager → HeroPoolByQuality | 品质到武将 ID 的映射静态数据 |
| Utils | RecruitManager → Utils | `deepClone()`、`randInt()` |
| EventBus | RecruitManager → EventBus | 发射 `recruit:result`、`toast:show` |

**初始化顺序**：RecruitManager 在第 5 位初始化（在 HeroManager 之后），见 [核心契约初始化顺序](../system/core-contracts.md#manager-初始化顺序)。

**Tick 注册**：RecruitManager 不监听 `game:tick`，无定时逻辑。

## 数据所有权

| 实体 | 本服务拥有的 | 共享给 | 方式 |
|------|-------------|--------|------|
| 保底计数器 | `pity.rare`, `pity.epic`, `pity.legendary` | UI | `getPity()` |
| 招募统计 | `totalRecruits` | UI | `getTotalRecruits()` |
| 免费招募状态 | `freeRecruitUsed` | UI | `isFreeRecruitAvailable()` |

## 配置

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| 单抽费用 | number | 100 | 单次招募消耗玉璧数 |
| 十连费用 | number | 900 | 十连招募消耗玉璧数（10% 折扣） |
| 蓝色保底阈值 | number | 10 | 连续未出蓝色达此抽数保证蓝色（`pity.rare >= 9`） |
| 紫色保底阈值 | number | 30 | 连续未出紫色达此抽数保证紫色（`pity.epic >= 29`） |
| 橙色保底阈值 | number | 80 | 连续未出橙色达此抽数保证橙色（`pity.legendary >= 79`） |
| 橙色概率 | number | 3% | 基础概率 |
| 紫色概率 | number | 9% | 基础概率 |
| 蓝色概率 | number | 18% | 基础概率 |
| 绿色概率 | number | 30% | 基础概率 |
| 白色概率 | number | 40% | 基础概率 |

> 这些值在当前版本中硬编码于 `RecruitManager` 内部。如未来需要支持限时卡池或概率调整活动，应提取到 `CONSTANTS.RECRUIT.*`。

## 导航

- 系统契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 武将服务：[specs/services/hero-manager.md](hero-manager.md)（addHero 接口）
- 资源服务：[specs/services/resource-manager.md](resource-manager.md)（jade 消耗）
- 设计文档：[ai-docs/04-recruit-system.md](../../ai-docs/04-recruit-system.md)
