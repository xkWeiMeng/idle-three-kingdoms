---
status: Active
created: 2026-04-14
updated: 2026-04-14
author: AI (spec-architect)
system-spec: specs/system/core-contracts.md
related-product-spec: specs/product-specs/abyss-loot-explosion.md
prerequisite: core-contracts.md 需更新（新增 AbyssManager 服务条目、跨模块读写权限、abyss:* 事件、存档 abyss key、初始化/tick 顺序）
---

# 服务规范：AbyssManager

## 概述

管理深渊副本挑战的全流程：解锁检查、入场校验、多层连续战斗、回合执行、掉落结算、首通奖励。
AbyssManager 是全局单例，战斗中状态（`currentRun`）不持久化——存档只保存解锁状态和各深渊实例统计。

当前共 3 个深渊副本（虎牢关/赤壁/官渡），每个包含 5 层连续 Boss 战。玩家从第 1 层开始逐层挑战，
层间保留队伍 HP（存活队友回复 30%），全程不可更换队伍。全部通关或全军覆没时结束。

## 持久化状态结构

```json
{
  "unlocked": "boolean — 深渊系统是否解锁，默认 false",
  "instances": {
    "<abyssId>": {
      "cleared": "boolean — 是否通关过，默认 false",
      "lastAttempt": "number — 上次尝试时间戳（秒），仅用于统计",
      "bestFloor": "number — 最高到达层数，默认 0",
      "totalAttempts": "number — 总挑战次数，默认 0",
      "mythicDropCount": "number — 神话装备掉落次数，默认 0"
    }
  }
}
```

**规则**：
- `currentRun` 始终不存入存档（`getState()` 排除），战斗中状态不持久化
- `instances` 为所有 `AbyssData` 中定义的深渊自动创建条目
- `cleared` 只会从 `false` → `true`，不可重置
- `bestFloor` 只增不减

## 战斗中状态结构（currentRun）

```json
{
  "abyssId": "string — 当前挑战的深渊 ID",
  "currentFloor": "number — 当前层数，从 1 开始",
  "phase": "'fighting' | 'complete' | 'defeat'",
  "allies": "[unit...] — 队友单位列表",
  "enemies": "[unit...] — 敌方单位列表（当前层 Boss）",
  "round": "number — 当前层回合数，每层重置为 0",
  "log": "string[] — 战斗日志，最多保留 50 条（FIFO）",
  "rewards": "{ gold, exp, iron, jade } — 累计奖励（所有层汇总）",
  "droppedEquipment": "object[] — 本次 run 掉落的装备列表",
  "battleTimer": "number — 战斗计时器累计（秒）"
}
```

## 战斗单位数据结构

```json
{
  "uid": "string — 唯一标识（队友=HeroManager uid，敌方='abyss_enemy_'+Utils.uid()）",
  "id": "string — 模板 ID",
  "name": "string — 显示名称",
  "emoji": "string — 显示图标（敌方为空字符串）",
  "currentHp": "number — 当前生命值",
  "maxHp": "number — 最大生命值",
  "atk": "number — 当前攻击（受 buff 影响）",
  "def": "number — 当前防御（受 buff 影响）",
  "spd": "number — 当前速度（受 buff 影响）",
  "baseAtk": "number — 基础攻击（不受 buff 影响）",
  "baseDef": "number — 基础防御",
  "baseSpd": "number — 基础速度",
  "skill": "object|null — 技能数据（deepClone 自模板）",
  "skillCd": "number — 当前技能 CD 累计，从 0 开始",
  "buffs": "[{ stat, ratio, duration }] — 当前 buff 列表",
  "isAlive": "boolean",
  "isAlly": "boolean — true=队友, false=敌方",
  "position": "number — 队列位置索引",
  "deathImmunityUsed": "boolean — 死亡免疫是否已触发（仅队友）"
}
```

## 跨模块依赖

### 只读查询

| 目标 | 方法 | 用途 |
|------|------|------|
| `BattleManager` | `getClearedStages()` | 检查系统解锁 / 单深渊解锁 |
| `HeroManager` | `getTeam()` | 获取队伍成员 |
| `HeroManager` | `getTemplate(id)` | 获取武将模板（名称、emoji、技能） |
| `HeroManager` | `getHeroStats(uid)` | 获取武将当前属性（含等级+装备加成） |
| `HeroManager` | `getHeroByUid(uid)` | 获取武将实例（装备数据，用于套装检查） |
| `TownManager` | `getAtkBonus()` / `getDefBonus()` / `getHpBonus()` | 建筑百分比加成（可选依赖） |
| `AbyssData` | 全局数据对象 | 深渊配置（层数、Boss、奖励、掉落） |

### 写操作

| 目标 | 方法 | 用途 |
|------|------|------|
| `ResourceManager` | `canAfford(type, amount)` | 检查入场费用 |
| `ResourceManager` | `spend(type, amount)` | 扣除入场费用 |
| `ResourceManager` | `add(type, amount)` | 发放通关奖励 |
| `EquipmentManager` | `generateDrop(stageLevel, qualityWeights)` | 生成装备掉落 |
| `EquipmentManager` | `addToInventory(equip)` | 神话装备入库 |
| `ForgeManager` | `addBlueprint(blueprintId)` | 首通奖励发放图纸（可选依赖） |

> ✅ **已修复**：神话装备掉落已改用 `EquipmentManager.addToInventory(equip)` 公共方法，
> 符合 core-contracts 封装原则。

### 全局函数依赖

| 函数 | 用途 |
|------|------|
| `getHeroSetBonuses(equipment)` | 计算队友套装效果（死亡免疫检查） |
| `getMythicTemplate(id)` | 获取神话装备模板 |
| `Utils.uid()` | 生成唯一 ID |
| `Utils.deepClone(obj)` | 深拷贝技能数据 |
| `Utils.randInt(min, max)` | 随机整数 |
| `Utils.formatNumber(n)` | 数字格式化（toast 消息中金币使用） |

## 初始化与 Tick 位置

```
初始化顺序：#12（在 ForgeManager 之后）
前置依赖：ResourceManager, HeroManager, BattleManager, EquipmentManager, TownManager（均需先初始化）

Tick 顺序：#9（在 ForgeManager.onTick 之后）
```

**存档 key**：`abyss` — `SaveManager` 中通过 `saved.abyss` 存取

---

## 能力

### 能力 1：初始化与存档恢复

**描述**：从存档数据恢复状态，为所有 `AbyssData` 中的深渊创建实例条目。

**接口**：
- `init(saved)` — `saved` 为完整存档对象，取 `saved.abyss` 片段

**行为规则**：
1. 从 `saved.abyss` 提取数据，不存在则使用默认值
2. 恢复 `unlocked` 状态（默认 `false`）
3. 恢复 `instances` 数据
4. `currentRun` 始终设为 `null`（不恢复战斗中状态）
5. 遍历 `AbyssData` 所有 key，为缺失的深渊创建默认实例条目

**验收场景**：

```
WHEN saved 为 undefined（首次游戏）
AND 调用 init(undefined)
THEN unlocked = false
AND instances 包含所有 AbyssData 中定义的深渊，每个 cleared=false, lastAttempt=0, bestFloor=0, totalAttempts=0, mythicDropCount=0
AND currentRun = null

WHEN saved.abyss = { unlocked: true, instances: { abyss_hulao: { cleared: true, bestFloor: 5, totalAttempts: 3, mythicDropCount: 1 } } }
AND 调用 init(saved)
THEN unlocked = true
AND instances.abyss_hulao.cleared = true, bestFloor = 5
AND instances.abyss_chibi 和 abyss_guandu 自动创建默认条目
AND currentRun = null

WHEN saved.abyss 包含 currentRun 数据（旧存档异常）
AND 调用 init(saved)
THEN currentRun = null（永远不恢复战斗中状态）
```

---

### 能力 2：系统解锁检查

**描述**：通过 `onTick` 每帧检查是否满足深渊系统解锁条件。解锁后 emit toast 通知。

**接口**：
- `onTick(dt)` — 由 GameLoop 每秒调用
- `isUnlocked()` → `boolean`

**行为规则**：
1. 仅在 `unlocked === false` 时执行解锁检查
2. 解锁条件：`BattleManager.getClearedStages()` 包含 `'stage_4_10'`
3. 满足条件 → `unlocked = true`，emit `toast:show { type:'success', message:'⚔ 深渊挑战已解锁！' }`
4. 已解锁后不再检查
5. `BattleManager` 不可用（typeof === 'undefined'）时跳过检查

**验收场景**：

```
WHEN unlocked = false
AND BattleManager.getClearedStages() 包含 'stage_4_10'
AND onTick(1.0) 被调用
THEN unlocked = true
AND emit toast:show { type:'success', message:'⚔ 深渊挑战已解锁！' }

WHEN unlocked = false
AND BattleManager.getClearedStages() 不包含 'stage_4_10'
AND onTick(1.0) 被调用
THEN unlocked 保持 false
AND 无 toast

WHEN unlocked = true
AND onTick(1.0) 被调用
THEN 不执行解锁检查（短路）

WHEN typeof BattleManager === 'undefined'
AND unlocked = false
AND onTick(1.0) 被调用
THEN 不抛错，unlocked 保持 false
```

---

### 能力 3：单深渊解锁检查

**描述**：检查指定深渊是否满足解锁条件（关卡通关要求）。

**接口**：
- `isAbyssUnlocked(abyssId)` → `boolean`

**行为规则**：
1. 从 `AbyssData[abyssId]` 获取深渊配置
2. 深渊不存在 → 返回 `false`
3. `BattleManager` 不可用 → 返回 `false`
4. 检查 `BattleManager.getClearedStages()` 是否包含 `abyss.unlockCondition.stage`

**解锁条件表**：

| 深渊 | 解锁关卡 |
|------|---------|
| abyss_hulao | stage_4_10 |
| abyss_chibi | stage_5_5 |
| abyss_guandu | stage_5_10 |

**验收场景**：

```
WHEN abyssId = 'abyss_hulao'
AND BattleManager.getClearedStages() 包含 'stage_4_10'
THEN 返回 true

WHEN abyssId = 'abyss_chibi'
AND BattleManager.getClearedStages() 不包含 'stage_5_5'
THEN 返回 false

WHEN abyssId = 'nonexistent_abyss'
THEN 返回 false

WHEN typeof BattleManager === 'undefined'
THEN 返回 false
```

---

### 能力 4：冷却检查（已禁用）

**描述**：冷却机制已移除（产品规范 CAP-LOOT-03），两个方法始终返回无冷却。

**接口**：
- `isOnCooldown(abyssId)` → `boolean` — 始终返回 `false`
- `getCooldownRemaining(abyssId)` → `number` — 始终返回 `0`

**验收场景**：

```
WHEN 调用 isOnCooldown('abyss_hulao')
THEN 返回 false

WHEN 调用 isOnCooldown('任意字符串')
THEN 返回 false

WHEN 调用 getCooldownRemaining('abyss_hulao')
THEN 返回 0
```

---

### 能力 5：进入深渊

**描述**：校验前置条件（无进行中 run、深渊已解锁、队伍非空、资源充足），扣除入场费，构建队友单位，初始化 run 并设置第一层。

**接口**：
- `enterAbyss(abyssId)` → `boolean` — 成功返回 `true`，失败返回 `false`

**行为规则**：
1. `currentRun` 不为 null → toast warning `'已有正在进行的深渊挑战'`，返回 `false`
2. `AbyssData[abyssId]` 不存在 → 返回 `false`
3. `isAbyssUnlocked(abyssId)` 为 false → toast warning `'深渊尚未解锁'`，返回 `false`
4. `HeroManager.getTeam()` 为空 → toast warning `'请先编入队伍！'`，返回 `false`
5. 逐项检查入场费（jade → gold → iron）：
   - 任一不足 → toast warning（包含所需数量），返回 `false`
   - jade/iron：直接拼接数字（如 `'💎×30'`）
   - gold：使用 `Utils.formatNumber(cost.gold)`（<1万用 toLocaleString 如 `5,000`，≥1万用万/亿格式如 `1.20万`）
6. 依次扣除所有入场资源（jade → gold → iron）
7. 记录尝试：`inst.lastAttempt = floor(Date.now() / 1000)`，`inst.totalAttempts++`
8. 构建队友单位（详见能力 5a）
9. 初始化 `currentRun` 结构
10. 调用 `_setupFloor()` 设置第一层敌人
11. emit `abyss:entered { abyssId }`
12. 返回 `true`

**入场费用表**：

| 深渊 | jade | gold | iron |
|------|------|------|------|
| abyss_hulao | 30 | 5000 | 200 |
| abyss_chibi | 50 | 8000 | 300 |
| abyss_guandu | 80 | 12000 | 500 |

**验收场景**：

```
WHEN currentRun 不为 null
AND 调用 enterAbyss('abyss_hulao')
THEN 返回 false
AND emit toast:show { type:'warning', message:'已有正在进行的深渊挑战' }

WHEN abyssId = 'invalid_id'
AND 调用 enterAbyss('invalid_id')
THEN 返回 false（无 toast）

WHEN abyss_hulao 未解锁
AND 调用 enterAbyss('abyss_hulao')
THEN 返回 false
AND emit toast:show { type:'warning', message:'深渊尚未解锁' }

WHEN 队伍为空
AND 调用 enterAbyss('abyss_hulao')
THEN 返回 false
AND emit toast:show { type:'warning', message:'请先编入队伍！' }

WHEN jade = 20（不足 30）
AND 调用 enterAbyss('abyss_hulao')
THEN 返回 false
AND emit toast:show { type:'warning', message:'玉璧不足！需要💎×30' }
AND 资源不扣除

WHEN gold = 3000（不足 5000）
AND jade >= 30
AND 调用 enterAbyss('abyss_hulao')
THEN 返回 false
AND emit toast:show { type:'warning', message:'金币不足！需要💰×5,000' }

WHEN iron = 100（不足 200）
AND jade >= 30, gold >= 5000
AND 调用 enterAbyss('abyss_hulao')
THEN 返回 false
AND emit toast:show { type:'warning', message:'铁矿不足！需要⛏️×200' }

WHEN 所有前置条件满足，队伍有 3 名武将
AND 调用 enterAbyss('abyss_hulao')
THEN jade 减少 30, gold 减少 5000, iron 减少 200
AND instances.abyss_hulao.totalAttempts += 1
AND instances.abyss_hulao.lastAttempt 更新为当前秒级时间戳
AND currentRun.abyssId = 'abyss_hulao'
AND currentRun.currentFloor = 1
AND currentRun.phase = 'fighting'
AND currentRun.allies.length = 3
AND currentRun.enemies.length = 1（第 1 层 Boss）
AND currentRun.rewards = { gold:0, exp:0, iron:0, jade:0 }
AND currentRun.droppedEquipment = []
AND emit abyss:entered { abyssId:'abyss_hulao' }
AND 返回 true
```

---

### 能力 5a：构建队友单位

**描述**：从 HeroManager 获取队伍数据，构建深渊战斗单位。应用 TownManager 建筑加成。

**行为规则**：
1. 从 `TownManager` 获取 ATK/DEF/HP 百分比加成（TownManager 不可用时加成为 0）
2. 遍历 `HeroManager.getTeam()` 每个 hero：
   - 获取 `HeroManager.getTemplate(hero.id)` → 名称、emoji、技能
   - 获取 `HeroManager.getHeroStats(hero.uid)` → 数值属性
   - template 或 stats 不存在 → 跳过
3. 属性计算公式：
   - `maxHp = floor(stats.hp × (1 + hpBonus))`，`currentHp = maxHp`
   - `atk = baseAtk = floor(stats.atk × (1 + atkBonus))`
   - `def = baseDef = floor(stats.def × (1 + defBonus))`
   - `spd = baseSpd = stats.spd`（SPD 不受 TownManager 加成影响）
4. 技能：`Utils.deepClone(template.skill)`（无技能则为 `null`）
5. 初始值：`skillCd=0`，`buffs=[]`，`isAlive=true`，`deathImmunityUsed=false`

**与 BattleManager 的差异**：
- **不应用** FarmManager 料理 buff
- **不应用** 套装百分比攻防加成（套装仅在死亡免疫时检查）
- **不应用** 套装 CD 减少
- SPD 不受建筑加成

**验收场景**：

```
WHEN 队伍有武将 A（atk=100, def=80, hp=500, spd=30）
AND TownManager atkBonus=0.1, defBonus=0.2, hpBonus=0.15
THEN 队友 A: atk=floor(100×1.1)=110, def=floor(80×1.2)=96, maxHp=floor(500×1.15)=575, spd=30
AND currentHp = maxHp = 575
AND baseAtk=110, baseDef=96, baseSpd=30

WHEN TownManager 不可用（typeof === 'undefined'）
AND 武将 atk=100, def=80, hp=500
THEN 队友: atk=100, def=80, maxHp=500（加成为 0）

WHEN 武将模板有技能 { name:'斩', type:'damage', multiplier:2.0, cooldown:3 }
THEN 队友 skill 为深拷贝副本，与模板无引用关系
AND skillCd = 0

WHEN getTemplate(hero.id) 返回 undefined
THEN 跳过该武将，不加入 allies
```

---

### 能力 6：层设置

**描述**：根据当前层数据设置敌方 Boss 单位。

**接口**：
- `_setupFloor()` — 内部方法

**行为规则**：
1. 从 `AbyssData[run.abyssId].floors[run.currentFloor - 1]` 获取层数据
2. 层数据不存在 → 静默返回
3. 构建 Boss 单位：
   - `uid = 'abyss_enemy_' + Utils.uid()`
   - 属性直接取 `boss.atk/def/hp/spd`（无加成）
   - `skill = Utils.deepClone(boss.skill)`
   - `emoji = ''`，`isAlly = false`，`position = 0`
4. 重置：`run.round = 0`，`run.phase = 'fighting'`，`run.battleTimer = 0`

**验收场景**：

```
WHEN currentFloor = 1, abyssId = 'abyss_hulao'
AND _setupFloor() 被调用
THEN enemies = [{ name:'华雄', atk:120, def:60, maxHp:2500, spd:25, ... }]
AND enemies[0].uid 以 'abyss_enemy_' 开头
AND enemies[0].isAlly = false
AND round = 0, phase = 'fighting', battleTimer = 0

WHEN currentFloor = 5, abyssId = 'abyss_hulao'
THEN enemies = [{ name:'吕布', atk:180, def:100, maxHp:8000, spd:35, ... }]
AND enemies[0].skill.name = '天下无双'
```

---

### 能力 7：战斗推进

**描述**：通过 `onTick` 驱动战斗，每秒执行一个回合。

**接口**：
- `onTick(dt)` — 由 GameLoop 每秒调用（与能力 2 共用入口）

**行为规则**：
1. 仅在 `currentRun` 存在且 `phase === 'fighting'` 时处理
2. 累计 `battleTimer += dt`
3. 每累计满 1.0 秒执行一次 `_executeRound()`
4. 单次 tick 可执行多个回合（补偿长 dt）

**验收场景**：

```
WHEN currentRun.phase = 'fighting'
AND onTick(1.0)
THEN 执行 1 个回合

WHEN onTick(2.5)
THEN 执行 2 个回合，battleTimer 剩余 0.5

WHEN currentRun = null
AND onTick(1.0)
THEN 无操作

WHEN currentRun.phase = 'complete'
AND onTick(1.0)
THEN 无操作
```

---

### 能力 8：回合执行

**描述**：收集所有存活单位按速度排序行动，每个单位行动后检查胜负。

**接口**：
- `_executeRound()` — 内部方法

**行为规则**：
1. `round++`
2. 收集所有存活单位（allies + enemies）
3. 按 SPD 降序排序；同速时队友优先（`isAlly=true` 排前）
4. 逐一执行行动：
   - 单位已死亡 → 跳过
   - 有技能且 `skillCd >= cooldown` → 使用技能，`skillCd` 重置为 0
   - 否则 → 普通攻击，`skillCd++`
5. 每个单位行动后检查胜负（`_checkFloorEnd`）
6. 所有敌方死亡 → `_handleFloorVictory()`
7. 所有队友死亡 → `_handleAbyssDefeat()`

**技能 CD 机制**：
- `skillCd` 从 0 开始，每次未使用技能时 `+1`
- 当 `skillCd >= skill.cooldown`（默认 3）时触发技能
- 触发后 `skillCd` 重置为 0

**验收场景**：

```
WHEN 队友 A（spd=80）、敌方 B（spd=70）、队友 C（spd=60）
AND _executeRound() 被调用
THEN 行动顺序为 A → B → C

WHEN 队友 A（spd=50）、敌方 B（spd=50）
THEN A 先行动（同速队友优先）

WHEN 单位有技能 cooldown=3，当前 skillCd=3
THEN 使用技能，skillCd 重置为 0

WHEN 单位有技能 cooldown=3，当前 skillCd=2
THEN 使用普通攻击，skillCd 变为 3

WHEN 单位无技能（skill=null）
THEN 始终使用普通攻击

WHEN 单位 A 击杀最后一个敌方
THEN 后续单位不再行动
AND 触发 _handleFloorVictory()

WHEN 敌方击杀最后一个队友
THEN 后续单位不再行动
AND 触发 _handleAbyssDefeat()
```

---

### 能力 9：普通攻击

**描述**：对随机一个存活敌方单位造成伤害。

**接口**：
- `_performAttack(unit, hostiles, run)` — 内部方法

**行为规则**：
1. 从 hostiles 中随机选择一个存活目标
2. 无存活目标 → 静默返回
3. 计算伤害（能力 11 公式），`target.currentHp -= damage`
4. 若 `target.currentHp <= 0` 且 target 为队友 → 检查死亡免疫（能力 12）
5. 死亡免疫未触发且 `currentHp <= 0` → `currentHp = 0`，`isAlive = false`
6. 追加战斗日志：`[第N回合] 攻击者 → 目标 X伤害 [💥暴击！]`
7. 日志超过 50 条 → 移除最早的一条（`shift`）

**验收场景**：

```
WHEN 队友 A（atk=100）攻击敌方 B（def=50, currentHp=200）
AND 伤害计算结果为 60
THEN B.currentHp = 200 - 60 = 140
AND log 追加 '[第N回合] A → B 60伤害'

WHEN 攻击造成暴击
THEN log 包含 '💥暴击！'

WHEN 攻击使目标 currentHp <= 0
AND 目标非队友（isAlly=false）
THEN target.currentHp = 0, target.isAlive = false

WHEN 攻击使队友 currentHp <= 0
AND 该队友有套装死亡免疫且未使用
AND 随机数 < deathImmunityChance
THEN currentHp = 1, deathImmunityUsed = true
AND log 追加 '✨ XXX 天命不灭！免疫致命伤害！'

WHEN 无存活敌方
THEN 静默返回，无操作
```

---

### 能力 10：技能系统

**描述**：执行技能效果，支持伤害、治疗、buff 三种类型。

**接口**：
- `_performSkill(unit, skill, hostiles, friendlies, run)` — 内部方法

**技能类型**：

| 类型 | 行为 |
|------|------|
| `heal` | 自我治疗 `floor(atk × multiplier)`，不超过 maxHp。`target` 字段被忽略，始终作用于自身 |
| `buff` | 给自身添加 buff（stat+ratio+duration），立即重算属性 |
| `damage` | 对敌方造成伤害，支持 single/all/random3 目标 |

**伤害技能目标选择**：

| target 值 | 行为 |
|-----------|------|
| `'single'`（默认） | 随机一个存活敌方 |
| `'all'` | 所有存活敌方 |
| `'random3'` | 从存活敌方中随机选择 3 次（可重复选中同一目标） |

**验收场景**：

```
WHEN 技能 type='heal', multiplier=0.5, 使用者 atk=80
THEN 回复 floor(80 × 0.5) = 40 HP
AND 不超过 maxHp
AND log 追加 '[第N回合] XXX 使用 技能名 回复 40 HP'

WHEN 技能 type='buff', effect={ stat:'atk', ratio:0.5, duration:3 }
THEN 使用者 buffs 追加 { stat:'atk', ratio:0.5, duration:3 }
AND 立即重算属性：atk = floor(baseAtk × (1 + 0.5))
AND log 追加 '[第N回合] XXX 使用 技能名'

WHEN 技能 type='damage', target='all', multiplier=2.0
AND 存活敌方有 3 个
THEN 对 3 个敌方各计算一次伤害
AND 每次伤害独立计算暴击

WHEN 技能 type='damage', target='random3'
AND 存活敌方仅 1 个
THEN 该敌方被攻击 3 次

WHEN 技能 type='damage', target='single'
THEN 随机选择 1 个存活敌方攻击

WHEN 技能造成致死伤害
THEN target.currentHp = 0, target.isAlive = false
AND log 记录每次伤害
```

---

### 能力 11：伤害计算

**描述**：计算攻击/技能伤害值。

**接口**：
- `_calcDamage(attacker, defender, multiplier)` → `{ damage: number, isCrit: boolean }`

**公式**：
1. `rand = 0.9 + Math.random() × 0.2`（范围 [0.9, 1.1)）
2. `base = floor(attacker.atk × multiplier × rand)`
3. `reduction = defender.def / (defender.def + 100)`
4. `damage = max(1, floor(base × (1 - reduction)))`
5. `isCrit = Math.random() < 0.05`（5% 暴击率）
6. 若暴击：`damage = floor(damage × 1.5)`

**验收场景**：

```
WHEN atk=100, multiplier=1.0, def=50
AND rand=1.0（中值）
THEN base = floor(100 × 1.0 × 1.0) = 100
AND reduction = 50 / 150 ≈ 0.333
AND damage = max(1, floor(100 × 0.667)) = 66
AND 若暴击: damage = floor(66 × 1.5) = 99

WHEN atk=100, multiplier=2.5, def=100
AND rand=0.9
THEN base = floor(100 × 2.5 × 0.9) = 225
AND reduction = 100 / 200 = 0.5
AND damage = max(1, floor(225 × 0.5)) = 112

WHEN atk=10, multiplier=1.0, def=999
AND rand=0.9
THEN base = floor(10 × 1.0 × 0.9) = 9
AND reduction = 999 / 1099 ≈ 0.909
AND damage = max(1, floor(9 × 0.091)) = max(1, 0) = 1（保底 1）
```

---

### 能力 12：死亡免疫

**描述**：队友受**普通攻击**致命伤害时，检查套装效果是否提供死亡免疫。每个队友每次 run 仅能触发一次。技能伤害致死**不触发**死亡免疫。

**行为规则**：
1. 仅在 `_performAttack`（普通攻击）中检查，`_performSkill` 致死**不检查**
2. 触发条件需全部满足：
   - `target.currentHp <= 0`
   - `target.isAlly === true`
   - `target.deathImmunityUsed === false`
2. 通过 `HeroManager.getHeroByUid(target.uid)` 获取英雄实例
3. 通过 `getHeroSetBonuses(hero.equipment)` 获取套装效果
4. 遍历套装 bonus，找到 `effects.deathImmunityChance`
5. `Math.random() < deathImmunityChance` → 触发免疫：
   - `target.currentHp = 1`
   - `target.deathImmunityUsed = true`
   - log 记录

**验收场景**：

```
WHEN 队友致命伤害，deathImmunityUsed=false
AND 套装提供 deathImmunityChance=0.3
AND 随机数 < 0.3
THEN currentHp = 1, deathImmunityUsed = true
AND log 追加 '✨ XXX 天命不灭！免疫致命伤害！'

WHEN 队友致命伤害，deathImmunityUsed=true（已使用过）
THEN 不检查套装，直接死亡

WHEN 敌方致命伤害
THEN 不检查死亡免疫，直接死亡

WHEN 队友致命伤害，无套装或套装无 deathImmunityChance
THEN 直接死亡

WHEN 队友受技能伤害（_performSkill）致 currentHp <= 0
AND 该队友有套装死亡免疫且未使用
THEN 不检查死亡免疫，直接死亡（死亡免疫仅对普通攻击生效）
```

---

### 能力 13：层通关处理

**描述**：当前层 Boss 被击败后，收集奖励、处理装备/神话掉落、更新进度、推进到下一层或完成整个深渊。

**接口**：
- `_handleFloorVictory()` — 内部方法

**行为规则**：
1. **发放层奖励**：累加到 `run.rewards`，同时通过 `ResourceManager.add()` 即时发放
2. **装备掉落**：遍历 `floorData.equipDrop`，每个品质独立掷骰：
   - `Math.random() < dropRate` → `EquipmentManager.generateDrop(5, {品质:100})`
   - 掉落成功 → 加入 `run.droppedEquipment`
3. **神话掉落**：`floorData.mythicDrop` 存在时：
   - `Math.random() < chance` → 从 pool 随机选择模板
   - 通过 `getMythicTemplate(id)` 获取模板
   - 生成装备实例（`quality=6, unsellable=true`）
   - 通过 `EquipmentManager.addToInventory(equip)` 入库
   - 加入 `run.droppedEquipment`
   - `inst.mythicDropCount++`
   - emit `toast:show { type:'success', message:'🔴 神话装备掉落：XXX！' }`
4. **更新进度**：若 `currentFloor > inst.bestFloor` → 更新 bestFloor
5. emit `abyss:floor_cleared { abyssId, floor, rewards }`
6. log `'═══ 第 N 层通关！ ═══'`
7. **检查是否最后一层**：
   - 是 → `_handleAbyssComplete()`
   - 否 → 存活队友回复 30% maxHp（不超过 maxHp），`currentFloor++`，`_setupFloor()`

**装备掉落概率表**（摘自 AbyssData）：

| 深渊 | 层 | 品质4概率 | 品质5概率 | 神话概率 |
|------|-----|-----------|-----------|----------|
| 虎牢关 | 1-2 | 20-25% | 5% | — |
| 虎牢关 | 3-4 | 20-25% | 8-10% | — |
| 虎牢关 | 5 | — | 15% | 5% |
| 赤壁 | 1-4 | 20-25% | 5-10% | — |
| 赤壁 | 5 | — | 15% | 5% |
| 官渡 | 1-4 | 20-25% | 5-10% | — |
| 官渡 | 5 | — | 15% | 5% |

**验收场景**：

```
WHEN 第 1 层通关，rewards = { gold:2000, exp:1000 }
THEN run.rewards.gold += 2000, run.rewards.exp += 1000
AND ResourceManager.add('gold', 2000), ResourceManager.add('exp', 1000)
AND emit abyss:floor_cleared
AND 存活队友回复 30% maxHp
AND currentFloor 变为 2
AND _setupFloor() 被调用

WHEN 第 5 层（最后一层）通关
THEN 触发 _handleAbyssComplete()（不推进下一层）

WHEN 装备掉落 equipDrop = { 4: 0.20, 5: 0.05 }
AND 品质4掷骰成功，品质5掷骰失败
THEN run.droppedEquipment 增加 1 件品质 4 装备
AND 品质 5 不掉落

WHEN 第 5 层 mythicDrop = { chance:0.05, pool:['equip_mythic_tyrant_armor'] }
AND 掷骰成功
THEN 生成神话装备（quality=6, unsellable=true）
AND emit toast:show 神话掉落消息
AND inst.mythicDropCount += 1

WHEN 存活队友 currentHp=50, maxHp=200
AND 层通关后回复
THEN currentHp = min(200, 50 + floor(200 × 0.3)) = min(200, 110) = 110

WHEN 存活队友 currentHp=180, maxHp=200
AND 层通关后回复
THEN currentHp = min(200, 180 + 60) = 200（不超过 maxHp）

WHEN currentFloor=3, inst.bestFloor=2
AND 层通关
THEN inst.bestFloor = 3

WHEN currentFloor=2, inst.bestFloor=5
AND 层通关
THEN inst.bestFloor 保持 5（只增不减）
```

---

### 能力 14：深渊完成

**描述**：最后一层通关后，处理首通奖励和完成状态。

**接口**：
- `_handleAbyssComplete()` — 内部方法

**行为规则**：
1. 检查 `inst.cleared`：
   - `false`（首通）→ `inst.cleared = true`，发放首通奖励：
     - gold → `ResourceManager.add('gold', amount)` + 累加到 `run.rewards`
     - jade → `ResourceManager.add('jade', amount)` + 累加到 `run.rewards`
     - blueprint → `ForgeManager.addBlueprint(id)`（ForgeManager 可用时）
     - log `'🏆 首通奖励！获得锻造图纸！'`
   - `true`（非首通）→ 跳过首通奖励
2. `run.phase = 'complete'`
3. log 分隔线 + `'🏆 深渊 XXX 通关！'`
4. emit `abyss:completed { abyssId, rewards, droppedEquipment }`

**首通奖励表**：

| 深渊 | gold | jade | blueprint |
|------|------|------|-----------|
| abyss_hulao | 10000 | 50 | blueprint_tyrant_halberd |
| abyss_chibi | 15000 | 60 | blueprint_dragon_cart |
| abyss_guandu | 20000 | 80 | blueprint_emperor_armor |

**验收场景**：

```
WHEN abyss_hulao 最后一层通关，inst.cleared = false
THEN inst.cleared = true
AND ResourceManager.add('gold', 10000), ResourceManager.add('jade', 50)
AND run.rewards.gold += 10000, run.rewards.jade += 50
AND ForgeManager.addBlueprint('blueprint_tyrant_halberd')
AND run.phase = 'complete'
AND emit abyss:completed

WHEN abyss_hulao 再次通关，inst.cleared = true
THEN 不发放首通奖励
AND run.phase = 'complete'
AND emit abyss:completed

WHEN ForgeManager 不可用（typeof === 'undefined'）
AND 首通
THEN 金币和玉璧正常发放
AND 跳过 addBlueprint 调用（不抛错）
```

---

### 能力 15：深渊失败

**描述**：全军覆没时标记失败状态。

**接口**：
- `_handleAbyssDefeat()` — 内部方法

**行为规则**：
1. `run.phase = 'defeat'`
2. log `'💀 全军覆没于第 N 层…'`
3. emit `abyss:failed { abyssId, floor: currentFloor }`

**验收场景**：

```
WHEN 全军覆没于第 3 层
THEN run.phase = 'defeat'
AND log 包含 '💀 全军覆没于第 3 层…'
AND emit abyss:failed { abyssId:'abyss_hulao', floor:3 }
```

---

### 能力 16：清除 Run

**描述**：清除当前 run 状态（结算界面关闭或重新挑战前调用）。

**接口**：
- `clearRun()` — 无返回值

**行为规则**：
1. `this._state.currentRun = null`

**验收场景**：

```
WHEN currentRun 不为 null
AND 调用 clearRun()
THEN currentRun = null

WHEN currentRun 已经为 null
AND 调用 clearRun()
THEN 无副作用，currentRun 保持 null
```

---

### 能力 17：状态查询

**描述**：提供只读查询接口。

**接口**：
- `isUnlocked()` → `boolean` — 深渊系统是否解锁
- `getCurrentRun()` → `object|null` — 当前 run 状态（直接引用，非拷贝）
- `getInstance(abyssId)` → `object|undefined` — 指定深渊实例数据（直接引用）
- `getState()` → `object` — 可序列化的持久化状态（深拷贝）

**getState() 返回值**：
```json
{
  "unlocked": "boolean",
  "instances": "deep clone of instances（排除 currentRun）"
}
```

**验收场景**：

```
WHEN unlocked = true
AND 调用 isUnlocked()
THEN 返回 true

WHEN currentRun 存在
AND 调用 getCurrentRun()
THEN 返回 currentRun 对象引用（非拷贝）

WHEN 调用 getInstance('abyss_hulao')
THEN 返回 instances.abyss_hulao 对象引用

WHEN 调用 getInstance('nonexistent')
THEN 返回 undefined

WHEN 调用 getState()
THEN 返回 { unlocked, instances }
AND instances 为深拷贝（修改返回值不影响内部状态）
AND 不包含 currentRun
```

---

### 能力 18：属性重算

**描述**：根据 buff 列表重算单位当前属性。

**接口**：
- `_recalcStats(unit)` — 内部方法

**行为规则**：
1. 初始化三个倍率：`atkMod=1, defMod=1, spdMod=1`
2. 遍历 `unit.buffs`，按 `stat` 累加 `ratio`
3. 重算：
   - `unit.atk = max(1, floor(baseAtk × atkMod))`
   - `unit.def = max(1, floor(baseDef × defMod))`
   - `unit.spd = max(1, floor(baseSpd × spdMod))`

**验收场景**：

```
WHEN unit.baseAtk=100, buffs=[{stat:'atk', ratio:0.5}]
AND _recalcStats(unit)
THEN unit.atk = max(1, floor(100 × 1.5)) = 150

WHEN unit.baseAtk=100, buffs=[{stat:'atk', ratio:0.3}, {stat:'atk', ratio:0.2}]
THEN unit.atk = max(1, floor(100 × 1.5)) = 150

WHEN unit.baseAtk=100, buffs=[{stat:'atk', ratio:-1.5}]
THEN unit.atk = max(1, floor(100 × -0.5)) = max(1, -50) = 1（保底）

WHEN buffs 为空
THEN atk=baseAtk, def=baseDef, spd=baseSpd
```

---

## 事件契约

### 生产的事件

| 事件 | 载荷 | 触发时机 |
|------|------|---------|
| `toast:show` | `{ type: 'success'\|'warning', message: string }` | 解锁通知、入场失败提示、神话掉落 |
| `abyss:entered` | `{ abyssId: string }` | 成功进入深渊 |
| `abyss:floor_cleared` | `{ abyssId: string, floor: number, rewards: object }` | 单层通关（rewards 为当层定义奖励，非累计） |
| `abyss:completed` | `{ abyssId: string, rewards: object, droppedEquipment: object[] }` | 深渊全通关（rewards 为全程累计奖励） |
| `abyss:failed` | `{ abyssId: string, floor: number }` | 深渊挑战失败 |

### 消费的事件

| 事件 | 来源 | 用途 |
|------|------|------|
| `game:tick` | GameLoop | 驱动 `onTick(dt)`（解锁检查 + 战斗推进） |

---

## 不变量

1. **currentRun 不持久化** — `getState()` 不包含 currentRun，`init()` 中始终设为 null
2. **单 run 限制** — 同时只能有一个 currentRun，enterAbyss 检查重入
3. **资源先检后扣** — 入场费用依次检查 jade→gold→iron，任一不足则不扣任何资源
4. **层奖励即时发放** — 通过 ResourceManager.add() 在每层通关时即时发放
5. **首通奖励仅一次** — `inst.cleared` 标记保证首通奖励不重复发放
6. **30% 层间治疗** — 仅存活队友享受，不超过 maxHp，死亡队友不复活
7. **日志上限约 50 条** — FIFO，超出时移除最早条目（多目标技能可短暂超出 1-2 条）
8. **伤害保底 1** — 任何攻击至少造成 1 点伤害
9. **bestFloor 只增不减** — 每次层通关时与历史最高比较取大值
10. **深渊数据驱动** — 所有副本配置来自 `AbyssData`，Manager 不硬编码副本内容
11. **独立于主线战斗** — AbyssManager 不检查 BattleManager 战斗状态，两个战斗系统可并行运行
12. **Buff 永不过期** — `buffs[].duration` 字段被存储但从未消耗或移除，buff 在本次 run 中永久生效
13. **无最大回合限制** — 若双方无法击杀对方（如 Boss 回复量 > 队伍输出），战斗将无限进行
