---
status: Active
created: 2026-04-05
updated: 2026-05-05
author: AI (spec-architect)
system-spec: specs/system/core-contracts.md
---

# 服务规范：BattleManager

## 概述

管理自动回合制战斗的全流程：开战准备、回合执行、技能/普攻/buff、伤害计算、胜负判定、战利品结算和自动推图。
BattleManager 是全局单例，战斗中状态（`battleState`）不持久化——存档只保存关卡进度和已通关列表。

## 持久化状态结构

```json
{
  "currentStage": "string — 当前选中关卡 ID，默认 'stage_1_1'",
  "isAutoFight": "boolean — 自动推图开关，默认 false",
  "clearedStages": "string[] — 已通关关卡 ID 列表"
}
```

**规则**：
- `battleState` 始终为 `null` 存入存档，战斗中状态不持久化
- `clearedStages` 只追加不删除

## 战斗中状态结构（battleState）

```json
{
  "phase": "'fighting' | 'victory' | 'defeat'",
  "allies": "[unit...]",
  "enemies": "[unit...]",
  "round": "number — 当前回合数，从 0 开始",
  "log": "string[] — 战斗日志，最多保留 50 条"
}
```

## 战斗单位数据结构

```json
{
  "uid": "string — 唯一标识",
  "id": "string — 模板 ID",
  "name": "string — 显示名称",
  "emoji": "string — 显示图标",
  "currentHp": "number — 当前生命值",
  "maxHp": "number — 最大生命值",
  "atk": "number — 当前攻击（受 buff 影响）",
  "def": "number — 当前防御（受 buff 影响）",
  "spd": "number — 当前速度（受 buff 影响）",
  "baseAtk": "number — 基础攻击（不受 buff 影响）",
  "baseDef": "number — 基础防御",
  "baseSpd": "number — 基础速度",
  "element": "string|null — 武将属性（'fire'|'water'|'wood'|'earth'|'metal'|null）",
  "skill": "object|null — 技能数据（deepClone 自模板）",
  "skillCd": "number — 当前技能 CD 累计",
  "buffs": "[buff...] — 见能力 7 数据结构",
  "isAlive": "boolean",
  "isAlly": "boolean — true=队友, false=敌方",
  "position": "number — 队列位置索引",
  "setCritRate": "number — 套装暴击率加成（仅队友）",
  "setDoubleDmg": "number — 套装双倍伤害概率（仅队友）",
  "setSkillDmgPct": "number — 套装技能伤害加成比例（仅队友）",
  "setHealInterval": "number — 套装全队治疗间隔回合数（仅队友）",
  "setHealPct": "number — 套装全队治疗百分比（仅队友）",
  "setDeathImmunity": "number — 套装死亡免疫概率（仅队友）",
  "deathImmunityUsed": "boolean — 死亡免疫是否已触发（仅队友）"
}
```

---

## 能力

### 能力 1：开始战斗

**描述**：校验前置条件（队伍、关卡、食物），构建双方战斗单位，进入战斗状态。

**接口**：
- `startBattle()` → `boolean` — 成功返回 `true`，失败返回 `false`

**行为规则**：
1. 从 `HeroManager.getTeam()` 获取队伍，队伍为空 → toast warning，返回 `false`
2. 从 `StageData` 按 `currentStage` 查找关卡，关卡不存在 → toast error，返回 `false`
3. 关卡有 `foodCost > 0` 时，检查 `ResourceManager.canAfford(FOOD, cost)`，不足 → toast warning，返回 `false`
4. 消耗食物：`ResourceManager.spend(FOOD, cost)`
5. 构建队友单位：
   - 从 `HeroManager.getHeroStats(uid)` 获取基础属性
   - 从 `TownManager` 获取 ATK/DEF/HP 百分比加成
   - 从 `FarmManager.getActiveBuff()` 获取料理加成（ATK/DEF/HP/SPD/暴击率）
   - 从 `getHeroSetBonuses(equipment)` 计算套装效果
   - 预计算团队全局套装效果（如 `teamDefPercent`）
   - ATK 公式：`finalAtk = floor(stats.atk × (1 + atkBonus) × (1 + setAtkPct + setAllPct))`
   - DEF 公式：`finalDef = floor(stats.def × (1 + defBonus) × (1 + setDefPct + setAllPct + teamDefPctFromSets))`
   - HP 公式：`finalHp = floor(stats.hp × (1 + hpBonus) × (1 + setHpPct + setAllPct))`
   - SPD 公式：`finalSpd = floor(stats.spd × (1 + cookSpdBonus))`（仅料理加成，无 TownManager/套装百分比加成）
   - 套装技能 CD 减少：`cooldown = max(1, cd - setSkillCdRed)`
6. 构建敌方单位：直接从 `stage.enemies[]` 读取属性，无加成
7. 初始化 `battleState`：`phase='fighting'`, `round=0`, `log=[]`
8. 重置计时器：`_battleTimer=0`, `_autoAdvanceDelay=0`
9. 调用 `ResourceManager.addBattleCount()`
10. emit `battle:started { stageId }`

**验收场景**：

```
WHEN 队伍为空
AND 调用 startBattle()
THEN 返回 false
AND emit toast:show { type:'warning', message:'请先编入队伍再出战！' }
AND battleState 为 null

WHEN 队伍非空，currentStage 对应关卡不存在
AND 调用 startBattle()
THEN 返回 false
AND emit toast:show { type:'error', message:'关卡数据异常' }

WHEN 关卡 foodCost=2，当前食物=1
AND 调用 startBattle()
THEN 返回 false
AND emit toast:show { type:'warning', message:'粮草不足，无法出战！' }
AND 食物不变

WHEN 关卡 foodCost=2，当前食物=5，队伍有 2 名武将
AND 调用 startBattle()
THEN 食物变为 3
AND battleState.phase = 'fighting'
AND battleState.allies.length = 2
AND battleState.enemies.length = 关卡 enemies 数量
AND emit battle:started { stageId: currentStage }
AND 返回 true

WHEN TownManager 提供 atkBonus=0.1 且料理提供 atkBonus=0.05
AND 武将基础 ATK=100
THEN 队友单位 finalAtk = floor(100 × 1.15 × 套装系数)

WHEN 武将套装提供 skillCdReduction=1，技能 CD=3
THEN 队友技能 cooldown = max(1, 3-1) = 2

WHEN battleState.phase = 'fighting'（战斗进行中）
AND 调用 startBattle()
THEN 覆盖现有战斗状态，开始新战斗（当前实现不做重入防护）
```

---

### 能力 2：回合执行

**描述**：每秒执行一个战斗回合，由 `game:tick` 驱动。

**接口**：
- `onTick(dt)` — 由 GameLoop 每秒调用

**行为规则**：
1. 仅在 `battleState.phase === 'fighting'` 时累计时间
2. 每累计满 1.0 秒执行一次 `_executeRound()`，可在单次 tick 中执行多回合（补偿）
3. 回合流程：
   a. `round++`
   b. 处理 buff 递减（双方所有单位）
   c. 套装全队治疗检查：若某队友有 `setHealInterval > 0` 且 `round % setHealInterval === 0`，全队存活队友回复 `floor(maxHp × setHealPct)` 生命（仅触发一次）
   d. 收集所有存活单位，按 SPD 降序排序；同速时队友优先，再按 position 升序
   e. 逐一行动（`_performAction`）
   f. 每个单位行动后检查胜负，若战斗结束则处理结算并 return
4. 回合结束 emit `battle:tick { round }`

**验收场景**：

```
WHEN battleState.phase = 'fighting'
AND onTick(1.0) 被调用
THEN round 从 0 变为 1
AND 按 SPD 降序执行所有存活单位行动
AND emit battle:tick { round: 1 }

WHEN onTick(2.5) 被调用（补偿情况）
THEN 执行 2 个回合，_battleTimer 剩余 0.5

WHEN battleState.phase = 'victory'
AND onTick(1.0)
THEN 不执行回合

WHEN 队友 A SPD=80，队友 B SPD=60，敌方 C SPD=70
THEN 行动顺序为 A(80) → C(70) → B(60)

WHEN 队友 A SPD=50，敌方 B SPD=50
THEN A 先行动（同速队友优先）

WHEN 套装全队治疗：setHealInterval=3, setHealPct=0.1, round=3
AND 队友当前 HP=80, maxHp=100
THEN 队友 HP = min(100, 80 + floor(100×0.1)) = 90
```

---

### 能力 3：单位行动

**描述**：单位在回合中的行动决策——使用技能或普通攻击。

**接口**：
- `_performAction(unit, allAllies, allEnemies, state)` — 内部方法

**行为规则**：
1. 确定友方和敌方数组
2. 技能 CD 检查：
   - 有技能且 `skillCd >= cooldown` → 使用技能，`skillCd` 重置为 0
   - 否则 `skillCd++`，执行普通攻击
3. 无技能的单位始终普通攻击

**验收场景**：

```
WHEN 单位有技能，cooldown=3，当前 skillCd=3
THEN 使用技能
AND skillCd 重置为 0

WHEN 单位有技能，cooldown=3，当前 skillCd=1
THEN skillCd 变为 2
AND 执行普通攻击

WHEN 单位无技能（skill=null）
THEN 始终执行普通攻击
```

---

### 能力 4：普通攻击

**描述**：选择随机存活敌方目标，计算伤害并扣血。

**接口**：
- `_performNormalAttack(unit, hostiles, state)` — 内部方法

**行为规则**：
1. 随机选取一个存活敌方目标
2. 用 multiplier=1.0 计算伤害
3. 套装双倍伤害判定：`Math.random() < setDoubleDmg` → 伤害 ×2
4. 扣除目标 HP
5. 死亡免疫判定：目标 HP ≤ 0 且 `target.isAlly` 且 `target.setDeathImmunity > 0` 且未使用 → 概率触发，HP 设为 1，标记已使用
6. HP ≤ 0 且未免疫 → `isAlive = false`
7. 触发攻击动画：`BattleAnimations.playAttack()`
8. 死亡时触发死亡动画：`BattleAnimations.playDeath()`

**验收场景**：

```
WHEN 攻击者 ATK=100，目标 DEF=50，无套装效果
THEN 伤害 = max(1, floor(floor(100 × 1.0 × randomFactor) × (1 - 50/(50+100))))
AND 目标 HP 减少该伤害值

WHEN 攻击造成伤害使目标 HP ≤ 0
THEN target.isAlive = false
AND 触发死亡动画

WHEN 攻击者有 setDoubleDmg=0.3 且触发双倍
THEN 伤害翻倍

WHEN 目标有 setDeathImmunity=0.5 且未使用，HP 被打至 0
AND 免疫触发（随机判定成功）
THEN 目标 HP = 1, deathImmunityUsed = true, isAlive = true

WHEN 目标有 setDeathImmunity 且 deathImmunityUsed=true
AND HP 被打至 0
THEN 正常死亡，不再触发免疫

WHEN 所有敌方目标在本回合中已被击杀
AND 后续单位执行普通攻击
THEN 跳过攻击（目标为 null），不报错
```

---

### 能力 5：技能系统

**描述**：五种技能类型——damage / heal / buff / debuff / cleanse。

**接口**：
- `_performSkill(unit, skill, friendlies, hostiles, state)` — 内部分发
- `_skillDamage(...)` — 伤害型技能
- `_skillHeal(...)` — 治疗型技能
- `_skillBuff(...)` — 增益型技能
- `_skillDebuff(...)` — 减益型技能
- `_skillCleanse(...)` — 净化型技能

**技能数据结构**：

```json
{
  "name": "string — 技能名称",
  "type": "'damage' | 'heal' | 'buff' | 'debuff' | 'cleanse'",
  "multiplier": "number — 伤害/治疗倍率（基于 ATK）",
  "target": "'single' | 'all' | 'self' | 'ally_lowest_hp'",
  "cooldown": "number — CD 回合数",
  "effect": "{ stat, ratio, duration } — buff/debuff 效果"
}
```

**行为规则**：

#### damage 型
- `target='single'`：随机选取一个存活敌方
- `target='all'`：所有存活敌方
- 套装技能伤害加成：`effectiveMultiplier = multiplier × (1 + setSkillDmgPct)`
- 每个目标独立计算伤害

#### heal 型
- `target='ally_lowest_hp'`：当前 HP 百分比最低的存活友方
- `target='self'`：自身
- `target='all'`：所有存活友方
- 治疗量：`floor(ATK × multiplier)`
- 治疗不超过 maxHp

#### buff 型
- `target='self'`：自身
- `target='all'`：所有存活友方
- `target='single'`：随机一个友方
- 调用 `_applyBuff(target, effect)`

#### debuff 型
- `target='all'`：所有存活敌方
- `target='single'`：随机一个敌方
- 调用 `_applyBuff(target, effect)`（ratio 为负值）

#### cleanse 型（新增）
- `RULE-CLEANSE-1`: cleanse 技能移除目标身上所有 `type='dot'` 的 buff
- `RULE-CLEANSE-2`: cleanse 不移除 `type='stat'` 的 debuff（`ratio < 0` 的 stat buff）
- `RULE-CLEANSE-3`: cleanse 的 `target` 支持 `'all'`（全体友方）和 `'ally_lowest_hp'`（最低 HP 友方）
- `RULE-CLEANSE-4`: `heal_cleanse` 终极技能同时治疗和净化（已有实现保持兼容）

#### 通用规则
- **套装双倍伤害（setDoubleDmg）和死亡免疫（setDeathImmunity）仅在普通攻击中触发，技能伤害不适用。**
- 未识别的 `skill.type` 按 `damage` 类型处理（兜底 fallthrough）。

**验收场景**：

```
WHEN damage 技能 multiplier=2.0，target='all'，3 个存活敌方
THEN 每个敌方各算一次伤害，multiplier=2.0×(1+setSkillDmgPct)

WHEN heal 技能 target='ally_lowest_hp'，队友 A HP 80%，队友 B HP 50%
THEN 治疗目标为队友 B

WHEN heal 技能 multiplier=1.5, ATK=100, 目标当前 HP=90, maxHp=100
THEN 治疗量 = floor(100×1.5) = 150
AND 实际回复 = min(100, 90+150) - 90 = 10

WHEN buff 技能 effect={ stat:'atk', ratio:0.3, duration:3 }，target='all'
THEN 所有存活友方获得 ATK +30% buff，持续 3 回合

WHEN debuff 技能 effect={ stat:'def', ratio:-0.2, duration:2 }，target='single'
THEN 随机一个敌方 DEF -20%，持续 2 回合

WHEN skill.type='unknown'（未识别的类型）
THEN 按 damage 类型处理

WHEN cleanse 技能 target='all'
AND 友方 A 有 dot buff（poison）和 stat debuff（def ratio=-0.2）
THEN A 的 dot buff 被移除
AND A 的 stat debuff 保留

WHEN cleanse 技能 target='ally_lowest_hp'
AND 友方 A HP=50%, 友方 B HP=30%
THEN 净化目标为 B（最低 HP）

WHEN heal_cleanse 技能 multiplier=1.5, ATK=100, target='ally_lowest_hp'
AND 目标有 2 个 dot buff, currentHp=50, maxHp=200
THEN 先治疗 floor(100×1.5)=150，HP=min(200, 50+150)=200
AND 移除目标所有 dot buff
```

---

### 能力 6：伤害计算

**描述**：统一的伤害计算公式，包含随机波动和暴击。

**接口**：
- `_calculateDamage(attacker, defender, multiplier)` → `{ damage: number, isCrit: boolean }`

**伤害公式**：

$$
\text{randomFactor} = 0.9 + \text{Math.random()} \times 0.2
$$
$$
\text{baseDamage} = \lfloor \text{ATK} \times \text{multiplier} \times \text{randomFactor} \rfloor
$$
$$
\text{elemMultiplier} = \_getElementMultiplier(\text{attacker.element}, \text{defender.element})
$$
$$
\text{elemDamage} = \lfloor \text{baseDamage} \times \text{elemMultiplier} \rfloor
$$
$$
\text{reduction} = \frac{\text{DEF}}{\text{DEF} + 100}
$$
$$
\text{damage} = \max\bigl(1,\; \lfloor \text{elemDamage} \times (1 - \text{reduction}) \rfloor\bigr)
$$
$$
\text{critChance} = 0.05 + \text{setCritRate}
$$

- 暴击判定：`Math.random() < critChance`
- 暴击伤害：`damage = floor(damage × 1.5)`

**行为规则**：
- 伤害最小值为 1，不会出现 0 伤害
- 基础暴击率 5%，套装加成叠加
- 暴击倍率固定 1.5×
- `RULE-ELEM-DMG-1`: 伤害计算在基础伤害后、DEF 减伤前应用元素倍率
- `RULE-ELEM-DMG-2`: 元素倍率 = `_getElementMultiplier(attacker.element, defender.element)`
- `RULE-ELEM-DMG-3`: 克制(相克) ×1.25，被克 ×0.80，相生 ×1.10，被生 ×0.95，同属 ×0.90
- `RULE-ELEM-DMG-4`: 无属性(null/undefined) → 倍率 1.00

**元素相克/相生表**：

| 攻击方 \ 防御方 | fire | water | wood | earth | metal |
|----------------|------|-------|------|-------|-------|
| fire           | 0.90 | 0.80  | 1.25 | 0.95  | 1.10  |
| water          | 1.25 | 0.90  | 0.80 | 1.10  | 0.95  |
| wood           | 0.80 | 1.25  | 0.90 | 0.95  | 1.10  |
| earth          | 1.10 | 0.95  | 1.10 | 0.90  | 0.80  |
| metal          | 0.95 | 1.10  | 0.95 | 1.25  | 0.90  |

**验收场景**：

```
WHEN ATK=100, multiplier=1.0, DEF=0
THEN baseDamage ∈ [90, 109]（floor(100×1.0×[0.9,1.1))）
AND reduction = 0/(0+100) = 0
AND damage = baseDamage
AND 伤害最小为 90

WHEN ATK=100, multiplier=1.0, DEF=100
THEN reduction = 100/200 = 0.5
AND damage = max(1, floor(baseDamage × 0.5))

WHEN ATK=10, multiplier=1.0, DEF=9999
THEN damage = 1（最小保底值）

WHEN setCritRate=0, 暴击触发（5% 概率）
THEN damage = floor(原伤害 × 1.5)

WHEN setCritRate=0.15
THEN critChance = 0.20（5% + 15%）

WHEN attacker.element='fire', defender.element='wood'
THEN elemMultiplier = 1.25（克制）
AND baseDamage 乘以 1.25 后再计算 DEF 减伤

WHEN attacker.element='fire', defender.element='water'
THEN elemMultiplier = 0.80（被克）

WHEN attacker.element=null, defender.element='fire'
THEN elemMultiplier = 1.00（无属性不受元素影响）

WHEN attacker.element='fire', defender.element='fire'
THEN elemMultiplier = 0.90（同属性减伤）
```

---

### 能力 7：Buff / Debuff 系统

**描述**：管理战斗中的临时属性修改和状态效果，包括属性增减、持续伤害（DoT）、护盾、嘲讽。

**接口**：
- `_applyBuff(target, effect, sourceName)` — 添加 buff
- `_processBuffs(units)` — 每回合递减持续时间，处理 DoT
- `_recalcStats(unit)` — 根据 base 值和 buff 列表重算属性

**Buff 数据结构**：

```javascript
// stat buff（属性修改，已有功能，保持不变）
{ type: 'stat', stat: 'atk'|'def'|'spd', ratio: number, duration: number, source: string }

// DoT — 持续伤害（新增）
{ type: 'dot', subtype: 'poison'|'burn'|'bleed', hpPercentDrain: number, duration: number, source: string }

// Shield — 护盾（新增）
{ type: 'shield', amount: number, duration: number, source: string }

// Taunt — 嘲讽（新增）
{ type: 'taunt', duration: number, source: string }
```

> **向下兼容**：已有的 `{ stat, ratio, duration, source }` 格式（无 `type` 字段）视为 `type: 'stat'`。

**行为规则**：

#### stat buff（原有规则，保持不变）
- `_applyBuff`：创建 buff 对象并 push 到 `target.buffs[]`，立即 `_recalcStats`
- `_processBuffs`：遍历所有存活单位的 buff，`duration--`，`duration ≤ 0` 则移除，之后 `_recalcStats`
- `_recalcStats`：从 base 值出发乘以所有 buff ratio 叠加值
  ```
  atkMod = 1 + Σ(buff.ratio where stat='atk')
  unit.atk = max(1, floor(baseAtk × atkMod))
  ```
- 同属性多个 buff 的 ratio **加法叠加**（非乘法）
- 重算后属性最低为 1
- **stat buff 仅支持 `atk` / `def` / `spd` 三种属性**。传入 `stat: 'hp'` 不会产生任何效果

#### DoT 处理规则
- `RULE-DOT-1`: DoT buffs 在每回合开始时、单位行动前处理（在 `_processBuffs` 中）
- `RULE-DOT-2`: 每个 DoT buff 造成 `floor(unit.maxHp × hpPercentDrain)` 点伤害
- `RULE-DOT-3`: DoT 伤害无视 DEF，不触发暴击
- `RULE-DOT-4`: DoT 可击杀单位（`currentHp <= 0` → `isAlive = false`）
- `RULE-DOT-5`: 多个同类型 DoT 独立计算，不合并（如 2 个 poison 各自扣血）

#### Shield 处理规则
- `RULE-SHIELD-1`: Shield 优先消耗——伤害先扣 `shield.amount`，剩余扣 HP
- `RULE-SHIELD-2`: Shield 耗尽时自动移除
- `RULE-SHIELD-3`: Shield 有持续时间——`duration` 到期时即使未耗尽也移除
- `RULE-SHIELD-4`: 多个 Shield 按添加顺序消耗（先进先消）

#### Taunt 处理规则
- `RULE-TAUNT-1`: 当场上存在有 taunt buff 的敌方单位时，普攻和单体技能强制指向该单位
- `RULE-TAUNT-2`: AoE 技能（`target: 'all'`）不受 taunt 影响
- `RULE-TAUNT-3`: 多个 taunt 同时存在时，指向最先获得 taunt 的单位
- `RULE-TAUNT-4`: taunt 单位死亡后，taunt 效果自动解除

**验收场景**：

```
WHEN 单位 baseAtk=100，无 buff
THEN atk = 100

WHEN 添加 buff { stat:'atk', ratio:0.3, duration:2 }
THEN 立即 atk = floor(100 × 1.3) = 130

WHEN 该 buff 持续 2 回合后
THEN buff 被移除，atk 恢复为 100

WHEN 同时有两个 atk buff：ratio=0.3 和 ratio=0.2
THEN atkMod = 1 + 0.3 + 0.2 = 1.5
AND atk = floor(baseAtk × 1.5)

WHEN debuff ratio=-0.5 使 atkMod=0.5
THEN atk = max(1, floor(baseAtk × 0.5))

WHEN debuff 极端情况 ratio=-1.5 使 atkMod=-0.5
THEN atk = 1（最低保底）

WHEN 单位有 DoT buff { type:'dot', subtype:'poison', hpPercentDrain:0.05, duration:3 }
AND 单位 maxHp=1000, currentHp=800
AND 回合开始处理 _processBuffs
THEN 单位受到 floor(1000 × 0.05) = 50 点伤害
AND currentHp = 750
AND DoT duration 减为 2

WHEN 单位有 2 个 poison DoT（各 hpPercentDrain=0.05）且 maxHp=1000
AND 回合开始处理
THEN 各自独立计算，总伤害 = 50 + 50 = 100

WHEN 单位 currentHp=30, DoT 伤害=50
THEN currentHp = -20 → isAlive = false（DoT 可击杀）

WHEN DoT buff duration=1
AND 回合开始处理
THEN 先造成伤害，然后 duration 减为 0，buff 被移除

WHEN 单位有 Shield { type:'shield', amount:200, duration:5 }
AND 受到 150 点伤害
THEN shield.amount = 50, currentHp 不变

WHEN 单位有 Shield { type:'shield', amount:50, duration:5 }
AND 受到 150 点伤害
THEN shield 被移除，currentHp 减少 100（150 - 50 = 100 穿透伤害）

WHEN 单位有 Shield { type:'shield', amount:200, duration:1 }
AND 回合结束 duration 到期
THEN Shield 被移除，即使 amount 仍有剩余

WHEN 单位有 2 个 Shield（先加 A:100, 后加 B:150）
AND 受到 120 点伤害
THEN Shield A 耗尽（消耗 100），Shield B 消耗 20（剩余 130），HP 不变

WHEN 敌方单位 X 有 taunt buff
AND 我方单位普攻
THEN 攻击目标强制为 X（即使其他敌方存活）

WHEN 敌方单位 X 有 taunt buff
AND 我方单位使用 target='all' 的 AoE 技能
THEN 仍然攻击所有存活敌方（AoE 不受 taunt 影响）

WHEN 两个敌方单位 X（先获得 taunt）和 Y（后获得 taunt）
AND 我方单位普攻
THEN 攻击目标为 X（最先获得 taunt 的单位）

WHEN taunt 单位 X 被击杀
THEN taunt 效果自动解除，后续普攻恢复随机选择目标
```

---

### 能力 8：胜负判定

**描述**：每个单位行动后检查战斗是否结束。

**接口**：
- `_checkBattleEnd()` → `'victory' | 'defeat' | null`

**行为规则**：
- 所有敌方 `isAlive === false` → `'victory'`
- 所有队友 `isAlive === false` → `'defeat'`
- 两者都有存活 → `null`（继续战斗）
- 敌方全灭和我方全灭**不会同时发生**（逐一行动，每次行动后立即检查）

**验收场景**：

```
WHEN 敌方全部 isAlive=false，队友有存活
THEN 返回 'victory'

WHEN 队友全部 isAlive=false，敌方有存活
THEN 返回 'defeat'

WHEN 双方都有存活
THEN 返回 null
```

---

### 能力 9：胜利结算

**描述**：发放关卡奖励（资源、经验、首通、装备掉落），更新进度。

**接口**：
- `_handleVictory()` — 内部方法

**行为规则**：
1. 设置 `phase = 'victory'`
2. 从 `stage.rewards` 读取奖励配置
3. 发放基础资源奖励：gold / exp / food / wood / stone / iron
   - 通过 `ResourceManager.add(type, amount, 'battle', 'stage_reward', stageId)` 发放
4. EXP 加成计算：
   ```
   expBonusMult = 1 + TownManager.getExpBonus() + 料理 expBonus
   actualExp = floor(rewards.exp × expBonusMult)
   ```
5. 首次通关判定（`clearedStages` 中不含当前 stageId）：
   - 将 stageId 加入 `clearedStages`
   - 发放 `firstClearReward.jade`（通过 ResourceManager）
   - 发放 `firstClearReward.hero`（通过 `HeroManager.addHero()`）
6. 调用 `ResourceManager.setHighestStage(stageId)`
7. 装备掉落判定：
   - `effectiveDropRate = rewards.equipDropRate × (1 + TownManager.getDropRateBonus())`
   - `Math.random() < effectiveDropRate` → 调用 `_generateEquipDrop(stage)`
8. 令 `stageId = this._state.currentStage`
9. emit `battle:ended { result:'victory', stageId, rewards: string[]（展示用摘要如 ['💰100','⭐130']）, equipment: object|null, isFirstClear: boolean }`

**验收场景**：

```
WHEN 当前关卡 rewards = { gold:100, exp:50 }，无加成
THEN ResourceManager.add('gold', 100) 被调用
AND ResourceManager.add('exp', 50) 被调用

WHEN TownManager.getExpBonus() = 0.2, 料理 expBonus = 0.1
AND rewards.exp = 100
THEN actualExp = floor(100 × 1.3) = 130

WHEN 首次通关，firstClearReward = { jade:10, hero:'shu_guanyu' }
THEN ResourceManager.add('jade', 10) 被调用
AND HeroManager.addHero('shu_guanyu') 被调用
AND stageId 加入 clearedStages

WHEN 重复通关同一关卡
THEN 不发放首通奖励
AND clearedStages 不重复添加

WHEN rewards.equipDropRate=0.3, TownManager.getDropRateBonus()=0.5
THEN effectiveDropRate = 0.3 × 1.5 = 0.45
AND 45% 概率触发装备掉落

WHEN 胜利结算完成
THEN emit battle:ended { result:'victory', ... }
```

---

### 能力 10：失败结算

**描述**：我方全灭时的处理。

**接口**：
- `_handleDefeat()` — 内部方法

**行为规则**：
1. 设置 `phase = 'defeat'`
2. 写入战斗日志
3. emit `battle:ended { result:'defeat', stageId }`
4. **不扣除任何资源**（食物在开战时已扣）
5. **不重置关卡进度**

**验收场景**：

```
WHEN 队友全灭
THEN phase = 'defeat'
AND emit battle:ended { result:'defeat', stageId: currentStage }
AND 无资源变动
AND currentStage 不变
```

---

### 能力 11：自动推图

**描述**：胜利后自动延迟进入下一关卡。

**接口**：
- 通过 `onTick(dt)` 驱动，无独立公开接口

**行为规则**：
1. 仅在 `isAutoFight=true` 且 `phase='victory'` 时生效
2. 累计延迟时间，满 1.0 秒后自动进入下一关
3. 通过 `_getNextStage(currentStage)` 获取下一关卡 ID
4. 有下一关 → 更新 `currentStage`，调用 `startBattle()`
5. 无下一关（已是最后一关） → 不做任何操作
6. `phase='defeat'` 时**不自动推图**

**验收场景**：

```
WHEN isAutoFight=true, phase='victory'
AND 经过 1 秒
THEN currentStage 更新为下一关
AND startBattle() 被调用

WHEN isAutoFight=true, phase='victory'
AND 当前已是最后一关
THEN 不做操作

WHEN isAutoFight=false, phase='victory'
THEN 不自动推图

WHEN isAutoFight=true, phase='defeat'
THEN 不自动推图
```

---

### 能力 12：关卡导航

**描述**：查询和切换当前关卡。

**接口**：
- `getCurrentStage()` → `object|null` — 返回 StageData 中对应的关卡对象
- `setCurrentStage(stageId)` → `void` — 设置当前关卡 ID
- `_getNextStage(currentId)` → `string|null` — 返回 StageData 中下一个关卡 ID

**行为规则**：
- `getCurrentStage` 遍历 `StageData` 查找匹配 ID 的关卡对象
- `setCurrentStage` 直接设置 `_state.currentStage`，不做校验
- `_getNextStage` 在 `StageData` 数组中找到当前关卡的下标，返回 `idx+1` 的 ID；末尾返回 `null`

**验收场景**：

```
WHEN currentStage = 'stage_1_1' 且 StageData 存在该关卡
THEN getCurrentStage() 返回该关卡对象

WHEN currentStage 对应 ID 不存在于 StageData
THEN getCurrentStage() 返回 null

WHEN 'stage_1_3' 是 StageData 中第 3 个（非末尾）
THEN _getNextStage('stage_1_3') 返回第 4 个关卡的 ID

WHEN 'stage_10_5' 是 StageData 最后一个
THEN _getNextStage('stage_10_5') 返回 null
```

---

### 能力 13：装备掉落

**描述**：战斗胜利时的装备掉落生成逻辑。

**接口**：
- `_generateEquipDrop(stage)` → `object|null` — 返回生成的装备对象或 null

**行为规则**：
1. 优先调用 `EquipmentManager.generateDrop(chapter, qualityWeights)` — 如果该方法存在
2. 兜底逻辑（EquipmentManager 未实现时）：
   a. 从 `stage.rewards.equipQualityWeights` 按权重随机选定品质
   b. 默认权重：`{ 1:50, 2:35, 3:13, 4:2, 5:0 }`
   c. 从 `EquipmentData` 筛选该品质的候选装备模板
   d. 随机选取模板，随机 statValue ∈ `[statRange[0], statRange[1]]`
   e. 生成装备实例 `{ uid, templateId, name, emoji, type, quality, stats, level:0 }`
   f. 通过 `EquipmentManager.addToInventory(equip)` 加入背包
3. 无候选模板时返回 `null`

**验收场景**：

```
WHEN EquipmentManager.generateDrop 存在
THEN 调用它并返回其结果

WHEN EquipmentManager.generateDrop 不存在
AND equipQualityWeights = { 1:50, 2:35, 3:13, 4:2, 5:0 }
THEN 按权重随机品质，从 EquipmentData 选候选模板生成装备

WHEN 选定品质在 EquipmentData 中无候选模板
THEN 返回 null
```

---

### 能力 14：公共查询 API

**描述**：供 UI 和其他模块查询战斗状态的公共方法。

**接口**：
- `toggleAutoFight()` → `boolean` — 切换自动推图，返回新状态
- `isAutoFight()` → `boolean` — 当前自动推图开关状态
- `isFighting()` → `boolean` — 是否正在战斗中（`phase === 'fighting'`）
- `getBattleState()` → `object|null` — 返回 battleState 引用
- `getClearedStages()` → `string[]` — 已通关关卡 ID 列表
- `isStageCleared(stageId)` → `boolean` — 指定关卡是否已通关
- `getState()` → `object` — 可序列化状态（battleState 始终为 null）

**行为规则**：
- `toggleAutoFight` 翻转 `isAutoFight` 值
- `isFighting` 在 `battleState` 为 null 时返回 `false`
- `getBattleState` 返回内部引用（非拷贝），UI 不应修改
- `getState` 返回 `clearedStages` 的浅拷贝（`.slice()`），`battleState` 固定为 `null`

**验收场景**：

```
WHEN isAutoFight=false
AND toggleAutoFight()
THEN 返回 true，isAutoFight() = true

WHEN 再次 toggleAutoFight()
THEN 返回 false，isAutoFight() = false

WHEN battleState=null
THEN isFighting() = false

WHEN battleState.phase='fighting'
THEN isFighting() = true

WHEN battleState.phase='victory'
THEN isFighting() = false

WHEN getState() 被调用
THEN 返回对象包含 currentStage, isAutoFight, clearedStages, battleState:null
AND 修改返回值的 clearedStages 不影响内部状态
```

---

## 内部状态机

```
            startBattle()
                │
    ┌───────────▼───────────┐
    │      fighting         │◄─────────── 自动推图 ───┐
    │  (回合循环 1s/round)   │                         │
    └───┬──────────────┬────┘                         │
        │              │                              │
   敌方全灭       我方全灭                             │
        │              │                              │
   ┌────▼────┐   ┌─────▼─────┐                        │
   │ victory │   │  defeat   │                        │
   │         │   │           │                        │
   └────┬────┘   └───────────┘                        │
        │                                             │
        │  isAutoFight=true && 有下一关                │
        │  延迟 1 秒后                                 │
        └─────────────────────────────────────────────┘
```

| 状态 | 转换到 | 触发器 | 守卫条件 |
|------|--------|--------|----------|
| null | fighting | `startBattle()` | 队伍非空、关卡存在、食物足够 |
| fighting | victory | `_checkBattleEnd()` | 敌方全部 isAlive=false |
| fighting | defeat | `_checkBattleEnd()` | 队友全部 isAlive=false |
| victory | fighting | `onTick()` 自动推图 | isAutoFight=true 且有下一关 且延迟≥1s |
| victory | (保持 victory) | — | 无自动推图或无下一关时 battleState 保持 victory 直到下次 startBattle() |
| defeat | (保持 defeat) | — | battleState 保持 defeat 直到下次 startBattle() |

## 战斗日志

- 日志存储在 `battleState.log[]`
- 每条日志为字符串
- 最多保留 50 条，超出时移除最早的（FIFO）

## 依赖

| 依赖项 | 方向 | 接口 | 说明 |
|--------|------|------|------|
| HeroManager | BM → HM | `getTeam()`, `getHeroStats(uid)`, `getTemplate(id)`, `addHero()` | 获取队伍和属性，首通奖励添加武将 |
| ResourceManager | BM → RM | `canAfford()`, `spend()`, `add()`, `addBattleCount()`, `setHighestStage()` | 食物消耗、奖励发放、统计更新 |
| TownManager | BM → TM | `getAtkBonus()`, `getDefBonus()`, `getHpBonus()`, `getExpBonus()`, `getDropRateBonus()` | 建筑加成（可选依赖，typeof 检查） |
| FarmManager | BM → FM | `getActiveBuff()` | 料理 buff 加成（可选依赖，typeof 检查） |
| EquipmentManager | BM → EM | `generateDrop()`, `addToInventory()` | 装备掉落（可选依赖） |
| getHeroSetBonuses | BM → 全局函数 | `getHeroSetBonuses(equipment)` | 套装效果计算（定义在 equipment-sets.js） |
| BattleAnimations | BM → BA | `playAttack()`, `playSkill()`, `playDeath()` | 战斗动画播放 |
| StageData | BM → Data | 数组遍历 | 关卡配置数据 |
| EquipmentData | BM → Data | 数组遍历 | 装备模板数据（兜底掉落） |

## 事件

| 事件 | 方向 | 载荷 | 触发时机 |
|------|------|------|----------|
| `battle:started` | 生产 | `{ stageId }` | `startBattle()` 成功 |
| `battle:tick` | 生产 | `{ round }` | 每回合结束 |
| `battle:ended` | 生产 | `{ result, stageId, rewards?, equipment?, isFirstClear? }` | 胜利或失败结算完成 |
| `toast:show` | 生产 | `{ type, message }` | 前置检查失败 |
| `game:tick` | 消费 | `(dt)` | GameLoop 每秒调用 `onTick(dt)` |

## 数据所有权

| 实体 | 本服务拥有的 | 共享给 | 方式 |
|------|-------------|--------|------|
| 关卡进度 | currentStage, clearedStages | UI | `getCurrentStage()`, `getClearedStages()` |
| 自动推图 | isAutoFight | UI | `isAutoFight()`, `toggleAutoFight()` |
| 战斗状态 | battleState | UI (只读) | `getBattleState()`, `isFighting()` |

## 存档兼容

**迁移规则**：`init(saved)` 必须处理以下情况：
1. `saved` 为 `undefined` — 首次游戏，使用默认值 `{ currentStage:'stage_1_1', isAutoFight:false, clearedStages:[] }`
2. `saved` 包含 `battle` 子对象 — 从 `saved.battle` 提取字段
3. `saved` 为旧版扁平结构 — 直接从 `saved` 提取字段
4. `clearedStages` 做防御性拷贝（`.slice()`）
5. `battleState` 始终初始化为 `null`（不恢复战斗中状态）

## 不变量

1. 战斗中状态不持久化 — `getState()` 返回的 `battleState` 始终为 `null`
2. 食物在战斗开始时扣除 — 即使战败也不退还
3. 伤害最小值为 1 — 不存在 0 伤害
4. 死亡免疫每单位每场战斗最多触发一次
5. 套装全队治疗每回合最多触发一次（即使多人拥有该套装效果）
6. 回合内行动顺序确定性：SPD 降序 → 同速队友优先 → position 升序
7. `clearedStages` 只追加不删除
8. 所有跨模块调用均为只读查询或通过 ResourceManager 发放奖励，不直接修改其他模块状态（`HeroManager.addHero` 除外，仅用于首通武将奖励；装备掉落通过 `EquipmentManager.addToInventory()` 公共接口）
9. 当前版本不设回合上限，理论上存在无限回合可能（如双方 DEF 极高且有持续治疗）
10. 治疗型技能选择最低 HP% 目标时，同 HP% 选择数组中靠前的单位

## 测试策略

涉及 `Math.random()` 的场景（暴击率、双倍伤害概率、死亡免疫概率、伤害随机波动 [0.9, 1.1)）无法确定性验证。
测试时应通过 mock `Math.random()` 返回固定值来验证概率相关场景。

## 导航

- 系统契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 相关服务：[specs/services/resource-manager.md](resource-manager.md)（资源消耗与发放）
- 相关服务：[specs/services/hero-manager.md](hero-manager.md)（队伍与属性查询）
