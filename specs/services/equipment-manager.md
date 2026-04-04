---
status: Active
created: 2026-04-09
updated: 2026-04-09
author: AI (spec-architect)
system-spec: specs/system/core-contracts.md
---

# 服务规范：EquipmentManager

## 概述

管理装备的全生命周期：按章节品质权重生成随机掉落、背包与溢出栏存储、武将穿戴/卸下、强化升级和出售变现。
EquipmentManager 是全局单例，所有状态持久化到存档；神话装备（品质 6）标记 `unsellable`，不可出售。

---

## 数据模型

### 装备实例（EquipmentInstance）

```json
{
  "uid":         "string  — 运行时唯一标识，由 Utils.uid() 生成",
  "id":          "string  — 对应装备模板 ID（EquipmentData 或 MythicEquipmentData）",
  "name":        "string  — 显示名称",
  "type":        "'weapon' | 'armor' | 'accessory' | 'mount'",
  "quality":     "number  — 1（普通）至 6（神话）",
  "emoji":       "string  — UI 展示图标",
  "description": "string  — 风味描述文本",
  "stats":       "{ [statKey: string]: number }  — 单一属性键值对，见属性映射",
  "level":       "number  — 强化等级，初始为 0",
  "equippedBy":  "string | null  — 穿戴武将的 uid；未装备时为 null",
  "setId":       "string | undefined  — 神话套装 ID，仅神话装备存在",
  "unsellable":  "boolean | undefined  — true 表示不可出售，仅神话装备存在"
}
```

### 装备模板（EquipmentTemplate）

```json
{
  "id":        "string  — 模板唯一 ID",
  "name":      "string  — 装备名称",
  "type":      "'weapon' | 'armor' | 'accessory' | 'mount'",
  "quality":   "number  — 1–6",
  "statType":  "string  — 主属性键，见属性映射",
  "statRange": "[min: number, max: number]  — 基础属性随机范围（含两端）",
  "description": "string",
  "emoji":     "string",
  "setId":     "string | undefined  — 仅神话模板",
  "unsellable": "boolean | undefined  — 仅神话模板，固定为 true"
}
```

### 属性映射

| 装备类型       | 主属性键 | 含义     |
| -------------- | -------- | -------- |
| `weapon`       | `atk`    | 攻击力   |
| `armor`        | `def`    | 防御力   |
| `accessory`    | `hp`     | 生命值   |
| `mount`        | `spd`    | 速度     |

### 品质表

| 品质值 | 名称 | 强化上限 | 出售价格 | 强化费用公式                                        | 属性成长率/级 |
| ------ | ---- | -------- | -------- | --------------------------------------------------- | ------------- |
| 1      | 普通 | 5        | 50       | `floor(1 × 100 × (1 + lv × 0.5))`                  | 10%           |
| 2      | 精良 | 10       | 100      | `floor(2 × 100 × (1 + lv × 0.5))`                  | 10%           |
| 3      | 稀有 | 15       | 150      | `floor(3 × 100 × (1 + lv × 0.5))`                  | 10%           |
| 4      | 史诗 | 20       | 200      | `floor(4 × 100 × (1 + lv × 0.5))`                  | 10%           |
| 5      | 传说 | 25       | 250      | `floor(5 × 100 × (1 + lv × 0.5))`                  | 10%           |
| 6      | 神话 | 30       | 0（不可出售）| `floor(600 × (1 + lv × 0.5) + lv × 200)`     | 8%            |

> `lv` = 强化前当前等级（0-indexed，强化到 +1 时 lv=0，到 +2 时 lv=1，以此类推）

### 持久化状态结构

```json
{
  "inventory": "EquipmentInstance[]  — 背包装备列表，最多 50 件",
  "maxSlots":  "number  — 背包容量上限，默认 50",
  "overflow":  "EquipmentInstance[]  — 溢出栏，最多 10 件"
}
```

---

## 神话套装（EquipmentSets）

3 套 × 4 件，共 12 件神话装备，套装激活阈值为 2 件和 4 件。

| 套装 ID         | 名称     | 2 件效果                                  | 4 件效果                                                       |
| --------------- | -------- | ----------------------------------------- | -------------------------------------------------------------- |
| `set_overlord`  | 霸王战魂 | ATK +15%, 暴击率 +5%                      | 普攻 20% 概率双倍伤害；ATK 额外 +25%                           |
| `set_dragon`    | 卧龙星辰 | 技能伤害 +20%, 技能 CD -1 回合            | 每 3 回合全队回复 10% HP；全属性 +10%                          |
| `set_emperor`   | 天命皇权 | DEF +20%, HP +15%                         | 致命伤 30% 免疫（每战 1 次）；全队 DEF +15%                    |

套装激活逻辑由 `getHeroSetBonuses(heroEquipment)` 函数计算，BattleManager 在构建战斗单位时消费。

---

## 能力

### 能力 1：生成装备掉落（generateDrop）

**描述**：按章节品质权重随机生成一件装备实例，并加入背包（或溢出栏）。

**接口**：
- `generateDrop(chapter, qualityWeights)` → `EquipmentInstance | null`
  - `chapter`：章节标识（当前仅用于日志/上下文，不影响内部逻辑）
  - `qualityWeights`：`{ [quality: string]: number }` — 各品质抽取权重

**行为规则**：
1. 对 `qualityWeights` 的所有 weight 求和 `totalWeight`；用 `Math.random() × totalWeight` 滚动得到品质值。
2. 从 4 种 `type`（`weapon / armor / accessory / mount`）中等概率（各 25%）随机选一种。
3. 在 `EquipmentData` 中查找 `type` 与 `quality` 均匹配的模板；模板不存在 → 返回 `null`。
4. 在模板 `statRange[0]..statRange[1]`（含两端）内随机取整数作为基础属性值。
5. 构造 EquipmentInstance：`uid = Utils.uid()`，`level = 0`，`equippedBy = null`，`stats = { [statType]: statValue }`。
6. 存入逻辑（内联，不调用 addToInventory）：
   - 若 `_inventory.length < _maxSlots`：直接推入 `_inventory`，返回该实例。
   - 否则若 `_overflow.length < 10`：推入 `_overflow`，emit `toast:show warning`，返回该实例。
   - 否则：emit `toast:show error`，返回 `null`。

**验收场景**：

```
WHEN generateDrop(chapter, qualityWeights)
AND qualityWeights = { "3": 100 }（只有品质 3）
AND inventory.length < 50
THEN 返回的装备 quality === 3
AND 装备 level === 0, equippedBy === null
AND 装备加入 _inventory
AND 返回该 EquipmentInstance

WHEN generateDrop(chapter, qualityWeights)
AND qualityWeights = { "99": 1 }（不存在的品质 99）
AND EquipmentData 中无 quality=99 的模板
THEN 返回 null
AND _inventory 和 _overflow 均不变

WHEN generateDrop(chapter, qualityWeights)
AND inventory.length === 50（背包已满）
AND overflow.length === 0
THEN 装备进入 _overflow
AND emit toast:show({ type: 'warning', message: `背包已满！<name>放入溢出栏` })
AND 返回该 EquipmentInstance

WHEN generateDrop(chapter, qualityWeights)
AND inventory.length === 50
AND overflow.length === 10（溢出栏已满）
THEN emit toast:show({ type: 'error', message: `溢出栏已满！<name>丢失了` })
AND 返回 null
AND _inventory 和 _overflow 均不变
```

---

### 能力 2：背包与溢出栏管理（addToInventory / claimOverflow）

**描述**：将装备实例存入背包；背包满时转入溢出栏；提供领取溢出栏的接口。

**接口**：
- `addToInventory(equip)` → `boolean`
- `claimOverflow()` → `EquipmentInstance[]`（成功领取的装备列表）
- `getInventory()` → `EquipmentInstance[]`
- `getOverflow()` → `EquipmentInstance[]`
- `getEquipment(uid)` → `EquipmentInstance | undefined`

**行为规则（addToInventory）**：
1. `equip` 为 `null/undefined` → 直接返回 `false`。
2. `inventory.length < 50` → 推入 `_inventory`，返回 `true`。
3. `overflow.length < 10` → 推入 `_overflow`，emit `toast:show warning`，返回 `true`。
4. 两者均满 → emit `toast:show error`，返回 `false`。

**行为规则（claimOverflow）**：
1. 循环条件：`overflow.length > 0 && inventory.length < maxSlots`。
2. 每次从 `_overflow` 头部 `shift()` 取出，推入 `_inventory`。
3. 返回本次领取的所有装备数组；若背包无空位则返回空数组 `[]`。

**验收场景**：

```
WHEN addToInventory(equip)
AND equip 为 null
THEN 返回 false
AND _inventory 和 _overflow 不变

WHEN addToInventory(equip)
AND inventory.length === 49（未满）
THEN 装备加入 _inventory，length 变为 50
AND 返回 true
AND 不发出任何 toast 事件

WHEN claimOverflow()
AND inventory.length === 48, overflow.length === 3
THEN 3 件装备全部从 _overflow 移入 _inventory
AND 返回长度为 3 的数组
AND _overflow 变为空

WHEN claimOverflow()
AND inventory.length === 50（已满）, overflow.length === 5
THEN 返回空数组 []
AND _inventory 和 _overflow 均不变

WHEN claimOverflow() 被调用
AND _inventory.length === 49，_overflow.length === 3
THEN 仅领取 1 件进入背包
AND 返回长度为 1 的数组
AND _overflow 剩余 2 件
AND _inventory.length === 50
```

---

### 能力 3：穿戴装备（equip）

**描述**：将背包中的装备穿戴到指定武将对应的装备槽；自动处理槽位替换和多武将冲突。

**接口**：
- `equip(equipUid, heroUid)` → `boolean`

**行为规则**：
1. `_inventory` 中不存在 `equipUid` → 返回 `false`。
2. `HeroManager.getHeroByUid(heroUid)` 返回 `null` → 返回 `false`。
3. `slot = equip.type`（装备类型即槽位名称）。
4. 若目标槽位已有装备（`hero.equipment[slot]` 非 null），先调用 `this.unequip(currentUid, heroUid)` 卸下。
5. 若该装备已被其他武将穿戴（`equip.equippedBy !== null && !== heroUid`），直接将其他武将对应槽位置 `null`（不触发 unequip 事件）。
6. 设置 `equip.equippedBy = heroUid`，`hero.equipment[slot] = equipUid`。
7. emit `equip:changed({ hero, equipment: equip })`，返回 `true`。

**验收场景**：

```
WHEN equip(equipUid, heroUid)
AND equipUid 存在于 _inventory
AND heroUid 存在于 HeroManager
AND hero.equipment[slot] === null（槽位空闲）
THEN equip.equippedBy === heroUid
AND hero.equipment[slot] === equipUid
AND emit equip:changed({ hero, equipment })
AND 返回 true

WHEN equip(equipUid, heroUid)
AND hero.equipment[slot] 已有装备 oldEquipUid
THEN 先执行 unequip(oldEquipUid, heroUid)，oldEquip.equippedBy === null
AND 再执行穿戴逻辑
AND 最终 hero.equipment[slot] === equipUid（新装备）

WHEN equip(equipUid, heroUid)
AND equip.equippedBy === otherHeroUid（装备被他人穿戴）
THEN otherHero.equipment[slot] 被直接置为 null（不触发 equip:changed）
AND equip.equippedBy 更新为 heroUid
AND hero.equipment[slot] === equipUid
AND emit equip:changed({ hero, equipment }) 仅触发一次（为新武将）
AND 返回 true

WHEN equip(equipUid, heroUid)
AND equipUid 不存在于 _inventory
THEN 返回 false
AND 不发出任何事件
```

---

### 能力 4：卸下装备（unequip）

**描述**：将指定装备从武将身上卸下，清空槽位和归属信息。

**接口**：
- `unequip(equipUid, heroUid)` → `boolean`

**行为规则**：
1. `_inventory` 中不存在 `equipUid` → 返回 `false`。
2. `HeroManager.getHeroByUid(heroUid)` 返回 `null` 时仍继续（hero 可能已被删除）；跳过槽位清空，仅清空 `equip.equippedBy`。
3. 若 hero 存在且 `hero.equipment[slot] === equipUid`，将 `hero.equipment[slot]` 置为 `null`。
4. 设置 `equip.equippedBy = null`。
5. emit `equip:changed({ hero, equipment: equip })`（`hero` 可能为 `null`），返回 `true`。

**验收场景**：

```
WHEN unequip(equipUid, heroUid)
AND 装备存在, 武将存在, 且 hero.equipment[slot] === equipUid
THEN hero.equipment[slot] === null
AND equip.equippedBy === null
AND emit equip:changed({ hero, equipment })
AND 返回 true

WHEN unequip(equipUid, heroUid)
AND 装备存在, 武将不存在（getHeroByUid 返回 null）
THEN equip.equippedBy === null
AND emit equip:changed({ hero: null, equipment })
AND 返回 true

WHEN unequip(equipUid, heroUid)
AND equipUid 不存在于 _inventory
THEN 返回 false
AND 不发出任何事件
```

---

### 能力 5：强化装备（reinforce）

**描述**：消耗金币将指定装备强化一级；不可超过品质对应的强化上限。

**接口**：
- `reinforce(equipUid)` → `boolean`
- `getReinforceCost(equipUid)` → `number`（返回下一级的强化费用，装备不存在时返回 0）

**行为规则**：
1. `_inventory` 中不存在 `equipUid` → 返回 `false`。
2. `equip.level >= EquipMaxLevel[equip.quality]`（代码 fallback 为 25，正常以品质表为准）→ emit `toast:show warning('已达最大强化等级！')`，返回 `false`。
3. 计算费用 `cost = _calcReinforceCost(equip)`：
   - 品质 6：`floor(600 × (1 + lv × 0.5) + lv × 200)`，其中 `lv = equip.level`（当前等级）
   - 其余：`floor(quality × 100 × (1 + lv × 0.5))`
4. `ResourceManager.canAfford('gold', cost)` 为 false → emit `toast:show warning('金币不足！需要💰×{cost}')`，返回 `false`。
5. 调用 `ResourceManager.spend('gold', cost)`，执行 `equip.level++`。
6. emit `toast:show({ type: 'success', message: '{name} 强化至 +{level}' })`，返回 `true`。

**验收场景**：

```
WHEN reinforce(equipUid)
AND equip.quality === 2, equip.level === 0
AND ResourceManager.canAfford('gold', 200) 为 true（floor(2×100×(1+0×0.5))=200）
THEN ResourceManager.spend('gold', 200) 被调用
AND equip.level === 1
AND emit toast:show success '碧刃 强化至 +1'
AND 返回 true

WHEN reinforce(equipUid)
AND equip.quality === 6, equip.level === 0
AND 费用 = floor(600 × 1 + 0) = 600
AND ResourceManager.canAfford('gold', 600) 为 true
THEN equip.level === 1
AND 返回 true

WHEN reinforce(equipUid)
AND equip.quality === 1, equip.level === 5（已达上限）
THEN emit toast:show warning '已达最大强化等级！'
AND equip.level 保持 5
AND 返回 false

WHEN reinforce(equipUid)
AND ResourceManager.canAfford('gold', cost) 为 false
THEN emit toast:show warning '金币不足！需要💰×{cost}'
AND equip.level 不变
AND 返回 false
```

---

### 能力 6：出售装备（sell）

**描述**：将背包中的装备出售换取金币；神话装备不可出售；已穿戴装备自动先卸下。

**接口**：
- `sell(equipUid)` → `boolean`

**行为规则**：
1. `_inventory` 中不存在 `equipUid` → 返回 `false`。
2. `equip.unsellable === true` → emit `toast:show warning('神话装备不可出售！')`，返回 `false`。
3. 若 `equip.equippedBy` 非 null，先调用 `this.unequip(equipUid, equip.equippedBy)`。
4. 计算价格 `price = EquipSellPrice[equip.quality] || 0`；调用 `ResourceManager.add('gold', price)` 增加金币。
5. 从 `_inventory` 中移除该装备（`splice`）。
6. emit `toast:show({ type: 'success', message: '出售 {name} 获得💰×{price}' })`，返回 `true`。

**验收场景**：

```
WHEN sell(equipUid)
AND equip.quality === 3（稀有）
AND equip.unsellable 为 undefined/false
AND equip.equippedBy === null
THEN ResourceManager.add('gold', 150) 被调用
AND 装备从 _inventory 移除
AND emit toast:show success '出售 {name} 获得💰×150'
AND 返回 true

WHEN sell(equipUid)
AND equip.quality === 6（神话），equip.unsellable === true
THEN emit toast:show warning '神话装备不可出售！'
AND 装备仍在 _inventory
AND 不调用 ResourceManager.add
AND 返回 false

WHEN sell(equipUid)
AND equip.equippedBy === someHeroUid（已穿戴）
THEN 1. 先调用 unequip(equipUid, someHeroUid)，触发 equip:changed；equip.equippedBy → null
AND 2. 再从 _inventory 移除装备，并调用 ResourceManager.add('gold', price) 给予金币
AND 3. 最后 emit toast:show success '出售 {name} 获得💰×{price}'
AND 返回 true

WHEN sell(equipUid)
AND equipUid 不存在于 _inventory
THEN 返回 false
AND 不发出任何事件
```

---

### 能力 7：计算装备实际属性值（getEquipStatValue）

**描述**：计算装备在当前强化等级下的属性展示值（基础值 + 强化加成）。

**接口**：
- `getEquipStatValue(equip)` → `number`

**行为规则**：
1. `equip` 为 `null/undefined` → 返回 `0`。
2. 取 `stats` 中第一个键的值作为 `baseStat`。
3. `growthRate = (equip.quality === 6) ? 0.08 : 0.1`。
4. 返回 `baseStat × (1 + equip.level × growthRate)`（不取整，由调用方决定展示精度）。

**验收场景**：

```
WHEN getEquipStatValue(equip)
AND equip.stats = { atk: 20 }, equip.level = 5, equip.quality = 3
THEN 返回 20 × (1 + 5 × 0.1) = 20 × 1.5 = 30

WHEN getEquipStatValue(equip)
AND equip.stats = { atk: 80 }, equip.level = 10, equip.quality = 6（神话）
THEN 返回 80 × (1 + 10 × 0.08) = 80 × 1.8 = 144

WHEN getEquipStatValue(null)
THEN 返回 0
```

---

## 事件契约

### 发出的事件

| 事件名          | 触发时机                               | 载荷                                         |
| --------------- | -------------------------------------- | -------------------------------------------- |
| `equip:changed` | 穿戴或卸下装备成功时                   | `{ hero: HeroInstance \| null, equipment: EquipmentInstance }` |
| `toast:show`    | 背包满/溢出栏满/强化失败/出售拦截等    | `{ type: 'warning' \| 'error' \| 'success', message: string }` |

**`equip:changed` 语义**：
- 接收方可通过 `hero` 判断哪个武将的装备发生变化（hero 为 null 表示武将已不存在）。
- 接收方不得通过此事件推断 UI 以外的游戏逻辑，属性重算由 `HeroManager.getHeroStats()` 负责。

### 监听的事件

EquipmentManager 当前不监听任何外部事件（被动调用模式）。

---

## 约束与设计决策

1. **背包上限固定 50**：`_maxSlots` 从存档恢复，但当前版本无扩容入口，新存档默认 50。
2. **溢出栏先进先出（FIFO）**：`claimOverflow` 使用 `shift()` 从头部取出，先进入溢出栏的装备先被领取。
3. **溢出栏满则装备永久丢失**：`generateDrop` / `addToInventory` 在两者皆满时返回 `false`/`null`，丢失无法恢复。
4. **跨武将穿戴无 unequip 事件**：`equip()` 处理其他武将占用时直接修改 `otherHero.equipment[slot]`，不触发 `equip:changed`，避免事件风暴。
5. **神话装备不可出售由 `unsellable` 字段控制**：品质 6 判断为辅助逻辑，以 `equip.unsellable === true` 为准。
6. **强化费用基于强化前等级**：`_calcReinforceCost` 接收 equip 对象，读取 `equip.level`（强化前的值），强化成功后再 `level++`。
7. **属性成长不取整**：`getEquipStatValue` 返回浮点数，UI 层负责取整展示；BattleManager 在战斗公式中可进一步取整。
8. **神话套装激活计算不在 EquipmentManager 内**：套装激活由独立函数 `getHeroSetBonuses()` 实现（`equipment-sets.js`），BattleManager 在战斗单位构建时消费，EquipmentManager 只存储装备实例的 `setId` 字段。
9. **`generateDrop` 仅查 EquipmentData（品质 1–5）**：神话装备（MythicEquipmentData）不通过掉落产生，由商人购买或锻造图纸合成获得。
