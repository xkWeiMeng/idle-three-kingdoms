---
status: Draft
created: 2026-04-04
updated: 2026-04-04
author: AI (spec-architect)
system-spec: specs/system/core-contracts.md
---

# 服务规范：HeroManager

## 概述

管理武将的获取、升级、编队和属性计算。武将是游戏的核心实体，战斗、装备、招募系统都依赖本服务。

武将实例的数据格式定义在 [核心契约](../system/core-contracts.md#武将实例数据格式)。

## 能力

### 能力 1：获取武将

**描述**：将新武将添加到玩家收藏中。处理重复武将的转换。

**接口**：
- `addHero(heroId)` → `heroInstance | null`
  - `heroId`: 模板 ID（如 `'shu_zhugeliang'`），必须在 `HeroData` 中存在

**行为规则**：
- 创建武将实例：`uid` 由 `Utils.uid()` 生成，`level=1`, `exp=0`, 装备全 `null`
- **重复武将处理**：如果玩家已拥有同 `id` 的武将，不添加新实例，而是转换为经验：`quality × 100` EXP，通过 `ResourceManager.add('exp', amount)` 发放
- 成功添加新武将后 emit `hero:added(heroInstance)`
- 重复时 emit `toast:show` 通知玩家获得经验

**验收场景**：

```
WHEN addHero('shu_zhaoyun')
AND 玩家当前没有赵云
THEN 创建赵云实例（uid唯一, level=1, exp=0）
AND _state.heroes 新增该实例
AND emit hero:added(赵云实例)

WHEN addHero('shu_zhaoyun')
AND 玩家已拥有赵云（quality=4）
THEN 不添加新实例
AND ResourceManager.add('exp', 400)（4×100）
AND emit toast:show 提示获得 400 经验

WHEN addHero('invalid_id')
AND HeroData 中不存在该 ID
THEN 返回 null，不修改状态
```

---

### 能力 2：查询武将

**描述**：按不同维度查询武将信息。

**接口**：
- `getTemplate(heroId)` → `object | undefined` — 从 `HeroData` 查询模板数据
- `getHeroByUid(uid)` → `heroInstance | undefined` — 从玩家收藏中按 UID 查找
- `getAllHeroes()` → `heroInstance[]` — 返回所有已获取武将的深拷贝

**行为规则**：
- `getTemplate()` 返回静态数据引用（不含实例数据）
- `getHeroByUid()` 返回内部引用（UI 不应修改）
- `getAllHeroes()` 返回深拷贝

**验收场景**：

```
WHEN getTemplate('shu_zhugeliang')
THEN 返回诸葛亮模板 { id, name, baseAtk, baseDef, baseHp, baseSpd, skill, ... }

WHEN getHeroByUid('不存在的uid')
THEN 返回 undefined

WHEN 玩家拥有 3 个武将
AND getAllHeroes()
THEN 返回长度为 3 的数组，每项为武将实例的深拷贝
```

---

### 能力 3：队伍管理

**描述**：管理最多 5 人的战斗队伍编组。

**接口**：
- `getTeam()` → `heroInstance[]` — 返回当前队伍中的武将实例列表
- `getTeamUids()` → `string[]` — 返回队伍成员的 UID 数组
- `addToTeam(uid)` → `boolean` — 将武将加入队伍
- `removeFromTeam(uid)` → `boolean` — 从队伍移除武将
- `isInTeam(uid)` → `boolean` — 查询是否在队伍中

**行为规则**：
- 队伍最大人数为 `CONSTANTS.MAX_TEAM_SIZE`（5）
- 同一武将不可重复加入队伍
- 队伍变更后 emit `hero:team_changed(teamArray)`
- `addToTeam()` 队伍已满时返回 `false`
- `removeFromTeam()` 武将不在队伍中时返回 `false`
- 队伍为空是允许的（但无法进行战斗）

**验收场景**：

```
WHEN 队伍当前 3 人
AND addToTeam(validUid)
THEN 队伍变为 4 人，返回 true
AND emit hero:team_changed(新队伍数组)

WHEN 队伍当前 5 人
AND addToTeam(anotherUid)
THEN 队伍不变，返回 false

WHEN addToTeam(uid) 且该 uid 已在队伍中
THEN 队伍不变，返回 false

WHEN removeFromTeam(uid) 且该 uid 在队伍中
THEN 队伍减少 1 人，返回 true
AND emit hero:team_changed(新队伍数组)

WHEN removeFromTeam(uid) 且该 uid 不在队伍中
THEN 返回 false，队伍不变
```

---

### 能力 4：武将升级

**描述**：消耗经验提升武将等级，提升属性。

**接口**：
- `levelUp(uid)` → `boolean` — 尝试升级指定武将
- `getExpCost(level)` → `number` — 计算从 `level` 升到 `level+1` 所需经验

**行为规则**：
- 升级公式：`getExpCost(level) = Math.floor(50 × (level ^ 1.5))`
- 升级消耗 EXP 资源，通过 `ResourceManager.spend('exp', cost)` 扣除
- EXP 不足时返回 `false`，不扣资源不升级
- 等级上限为 50，已满级时返回 `false`
- 升级成功后 emit `hero:levelup({ hero, newLevel })`

**验收场景**：

```
WHEN 武将等级 1，EXP 充足（≥50）
AND levelUp(uid)
THEN 等级变为 2，EXP 扣除 50，返回 true
AND emit hero:levelup({ hero, newLevel: 2 })

WHEN 武将等级 10
THEN getExpCost(10) = Math.floor(50 × 10^1.5) = 1581

WHEN 武将等级 50
AND levelUp(uid)
THEN 返回 false（已满级，不扣资源）

WHEN 武将等级 5，EXP 不足
AND levelUp(uid)
THEN 返回 false，EXP 不变，等级不变
```

**升级费用参考**：

| 等级 | 费用 (EXP) |
|------|-----------|
| 1→2 | 50 |
| 5→6 | 559 |
| 10→11 | 1581 |
| 20→21 | 4472 |
| 30→31 | 8216 |
| 40→41 | 12649 |
| 49→50 | 17146 |

---

### 能力 5：属性计算

**描述**：计算武将在当前等级和装备下的最终属性。

**接口**：
- `getHeroStats(uid)` → `{ atk, def, hp, spd }` — 最终属性（含成长和装备加成）
- `getBattlePower(uid)` → `number` — 综合战力数值

**行为规则**：

**属性公式**：
```
finalStat = floor(baseStat + GrowthCoefficients[quality][stat] × (level - 1) + equipBonus)
```
- `baseStat` 来自武将模板（baseAtk, baseDef, baseHp, baseSpd）
- `GrowthCoefficients` 定义在 [核心契约成长系数表](../system/core-contracts.md#成长系数表)
- `equipBonus` 来自 `EquipmentManager.getEquipment(slotUid)` 各槽位加成之和
- 最终值使用 `Math.floor()` 取整

**战力公式**：
```
battlePower = (atk × 1.5 + def × 1.2 + hp × 0.3 + spd × 1.0) × (1 + level × 0.02)
```

**验收场景**：

```
WHEN 赵云（Q4）等级 1，无装备
AND getHeroStats(uid)
THEN atk = baseAtk（无成长加成，level-1=0）
AND def = baseDef
AND hp = baseHp
AND spd = baseSpd

WHEN 赵云（Q4, baseAtk=38）等级 10，无装备
AND getHeroStats(uid)
THEN atk = floor(38 + 5 × 9) = floor(83) = 83
（Q4 的 ATK 成长系数为 5，level-1=9）

WHEN 武将有武器提供 atk+10
AND getHeroStats(uid)
THEN atk = floor(baseStat + growth + 10)

WHEN getHeroStats(uid) 返回 { atk:83, def:60, hp:300, spd:25 }
AND 等级为 10
THEN getBattlePower = (83×1.5 + 60×1.2 + 300×0.3 + 25×1.0) × (1 + 10×0.02)
   = (124.5 + 72 + 90 + 25) × 1.2 = 311.5 × 1.2 = 373.8
```

---

### 能力 6：初始化与存档

**描述**：从存档恢复状态或初始化新游戏默认状态。

**接口**：
- `init(saved)` → `void` — 初始化，`saved` 为存档中的 `heroes` 片段
- `getState()` → `{ heroes, team }` — 导出可序列化状态

**行为规则**：
- **新游戏**（`saved` 为 `undefined`）：自动添加赵云（`shu_zhaoyun`）并设为队伍成员
- **恢复存档**：从 `saved.heroes` 恢复武将列表，从 `saved.team` 恢复队伍顺序
- `getState()` 返回深拷贝（`Utils.deepClone`）

**验收场景**：

```
WHEN init(undefined)（首次游戏）
THEN _state.heroes 包含 1 个赵云实例（level=1）
AND _state.team = [赵云的uid]

WHEN init({ heroes: [...], team: ['uid1', 'uid2'] })
THEN _state.heroes 恢复完整列表
AND _state.team 保持 ['uid1', 'uid2'] 顺序

WHEN getState()
THEN 返回 { heroes: deepClone(武将数组), team: [uid列表] }
AND 修改返回对象不影响内部状态
```

## 内部状态机

HeroManager 无复杂状态机。武将生命周期为：

| 状态 | 转换到 | 触发器 | 守卫条件 |
|------|--------|--------|----------|
| 不存在 | 已获取 | `addHero(id)` | HeroData 中存在且玩家未拥有 |
| 不存在 | — | `addHero(id)` 重复 | 转换为 EXP，不创建实例 |
| 已获取 | 队伍中 | `addToTeam(uid)` | 队伍未满且未在队伍中 |
| 队伍中 | 已获取 | `removeFromTeam(uid)` | 武将在队伍中 |

## 依赖

| 依赖项 | 方向 | 说明 |
|--------|------|------|
| ResourceManager | HeroManager → ResourceManager | 升级消耗 EXP、重复武将添加 EXP |
| EquipmentManager | HeroManager → EquipmentManager | 属性计算时读取装备加成 |
| HeroData | HeroManager → HeroData | 武将模板静态数据 |

## 数据所有权

| 实体 | 本服务拥有的 | 共享给 | 方式 |
|------|-------------|--------|------|
| 武将实例 | uid, id, level, exp | BattleManager, UI | `getHeroByUid()`, `getHeroStats()` |
| 队伍编组 | team[] | BattleManager, UI | `getTeam()`, `getTeamUids()` |
| 装备槽位引用 | equipment.{weapon,armor,accessory,mount} | EquipmentManager | 存储 UID 引用 |

## 配置

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `MAX_TEAM_SIZE` | number | 5 | 最大队伍人数 |
| `MAX_LEVEL` | number | 50 | 武将最高等级 |
| `DUPLICATE_EXP_FACTOR` | number | 100 | 重复武将转 EXP = quality × 此值 |
| `EXP_FORMULA_BASE` | number | 50 | 升级公式基数 |
| `EXP_FORMULA_EXPONENT` | number | 1.5 | 升级公式指数 |

## 导航

- 系统契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 资源服务：[specs/services/resource-manager.md](resource-manager.md)（升级消耗 EXP）
