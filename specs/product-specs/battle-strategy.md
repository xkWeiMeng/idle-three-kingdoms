# 产品规范：战斗策略机制 — Boss 特殊机制（Battle Strategy Mechanics）

| 属性 | 值 |
|------|-----|
| **id** | battle-strategy |
| **状态** | Active |
| **版本** | 1.0.0 |
| **作者** | game-pm |
| **创建日期** | 2026-05-06 |
| **阶段** | P4 |
| **依赖** | [BattleManager](../services/battle-manager.md), [核心契约](../system/core-contracts.md) |
| **关联文档** | [战斗系统深度研究报告](../../.copilot/session-state/8c6c5d26-60bc-48d3-a793-5aeb3ee105a9/research/boss.md) |

---

## 1. 概述与玩家价值

### 1.1 为什么做这个系统

当前 Boss 存在以下体验问题：
- **Boss 无特殊机制**：15 个 Boss 仅是数值膨胀的普通敌人，无阶段机制、狂暴、净化需求
- **纯 DPS 是最优策略**：治疗者（7.9%占比）和减防者不是必需角色，5 DPS 暴力通关
- **阵容搭配无意义**：无属性克制、无坦克嘲讽、无角色分工需求
- **Boss 技能单调**：仅 damage AoE（7个）、debuff（3个）、heal self（2个）、buff self（3个）四种模式

### 1.2 核心玩家价值

> **让 Boss 战斗从"堆数值碾压"变为"策略组队破解"，每个 Boss 都是一道独特的谜题。**

- 🧠 **策略深度**：7 种 Boss 机制模式，迫使玩家使用治疗、坦克、减防、净化等多样化角色
- ⚔️ **阵容多样性**：不同章节的 Boss 机制组合需要不同队伍配置，告别万能阵容
- 📈 **渐进难度**：机制从第 6 章开始逐步引入，给新玩家充分学习时间
- 🎯 **角色价值感**：治疗者、减防者、净化者等支援角色获得不可替代的战斗地位

### 1.3 目标用户

已通关前 5 章的中期玩家，拥有 10+ 武将且开始遭遇纯 DPS 无法通过的 Boss 关卡。

---

## 2. 设计原则

1. **机制先于数值**：Boss 难度来自机制设计而非单纯数值膨胀
2. **渐进披露**：每章最多引入 1 个新机制，前 5 章无特殊机制（教学期）
3. **可破解性**：每种机制都有明确的反制手段（至少 2 名现有武将可应对）
4. **组合深度**：后期 Boss 通过机制组合创造策略深度，而非堆叠更多数值
5. **保持 Idle 本质**：机制自动触发和处理，玩家通过阵容搭配而非操作来应对
6. **日志透明**：所有机制触发在战斗日志中有清晰的图标和说明

---

## 3. 七大 Boss 机制模式

### 3.1 模式 A：狂暴（Enrage）⏰

> **设计意图**：惩罚全坦克/纯治疗阵容，确保 DPS 不可缺少。

#### 数据模式

```javascript
{
  mechanic: 'enrage',
  triggerRound: 20,       // 触发回合
  atkBoost: 0.50,         // 首次 ATK 加成（+50%）
  escalation: {
    interval: 5,          // 叠加间隔（每 5 回合）
    boost: 0.15           // 每次叠加量（+15%）
  }
}
```

#### 效果说明

| 参数 | 数值 | 说明 |
|------|------|------|
| 触发回合 | 第 20 回合 | 约 20 秒（1 倍速）|
| 首次效果 | ATK +50% | 大幅提升 Boss 威胁 |
| 持续叠加 | 每 5 回合再 +15% ATK | 指数增长压力 |
| 回合 30 总加成 | +50% + 15%×2 = +80% | 几乎不可存活 |

#### 策略反制

- 玩家需要足够的 DPS 在狂暴前击杀 Boss
- 或携带强力治疗者在狂暴后维持生存窗口

#### WHEN/THEN 场景

```
WHEN boss 拥有 enrage 机制
AND 当前回合达到 triggerRound（20）
THEN boss ATK 增加 atkBoost（50%）比例
AND 战斗日志显示 "⏰ [Boss名] 进入狂暴状态！攻击力提升50%"

WHEN boss 已进入狂暴状态
AND 每经过 escalation.interval（5）回合
THEN boss ATK 再增加 escalation.boost（15%）比例
AND 战斗日志显示 "⏰ [Boss名] 狂暴加深！攻击力再提升15%"
```

---

### 3.2 模式 B：周期性 AoE（Periodic AoE）💥

> **设计意图**：迫使队伍携带治疗者，纯 DPS 队伍约 12-16 回合团灭。

#### 数据模式

```javascript
{
  mechanic: 'periodic_aoe',
  interval: 4,            // 触发间隔（每 4 回合）
  hpPercent: 0.25          // 造成目标 maxHP 百分比伤害（25%）
}
```

#### 效果说明

| 参数 | 数值 | 说明 |
|------|------|------|
| 间隔 | 每 4 回合 | 稳定节奏压力 |
| 伤害 | 全体 25% maxHP | 无视 DEF，固定百分比 |
| 无治疗时 | 4 次 AoE = 100% HP（16 回合团灭） | 纯 DPS 不可行 |
| 有治疗时 | 治疗者每 3 回合全体治疗 15-20% maxHP → 抵消大部分 AoE | 存活 30+ 回合 |

#### 数学验证

```
无治疗者：4 × 25% = 100% HP → 第 16 回合团灭
有治疗者（华佗 S1 全体 ATK×1.0 治疗）：
  治疗可抵消约 60-70% AoE 伤害 → 生存延长至 30+ 回合
  4 DPS + 1 治疗 总输出（32 回合）= 14,848 > 5 DPS 总输出（16 回合）= 9,280
```

#### 策略反制

- 携带全体治疗技能的武将（华佗、鲁肃、大乔、蔡文姬等）
- 套装被动治疗（天命星辰 4 件套每 3 回合全体回复 10% HP）可辅助

#### WHEN/THEN 场景

```
WHEN boss 拥有 periodic_aoe 机制
AND 当前回合是 interval（4）的倍数
THEN 对全体敌方单位造成 hpPercent（25%）maxHP 的伤害
AND 该伤害无视 DEF
AND 战斗日志显示 "💥 [Boss名] 释放范围轰击！全体受到25%最大生命值伤害"

WHEN periodic_aoe 伤害将某单位 HP 降至 0
THEN 该单位正常死亡
AND 战斗日志记录击杀信息
```

---

### 3.3 模式 C：高甲（High Armor）🛡️

> **设计意图**：迫使玩家携带 DEF debuff 技能的武将（减防者）。

#### 数据模式

```javascript
{
  mechanic: 'high_armor',
  bonusDef: 300             // 额外 DEF 加成
}
```

#### 效果说明

| 参数 | 数值 | 说明 |
|------|------|------|
| Boss 有效 DEF | 基础 DEF + 300 | 如基础 150 → 有效 450 |
| 减伤率（DEF=450） | 450/(450+100) = **81.8%** | 几乎免疫物理 |
| 无减防时伤害 | ATK 300 × 1.8 × 0.182 = **98** | 极低伤害 |
| 有减防时（DEF-65%） | 有效 DEF 157 → 减伤 38.5% → 伤害 **332** | DPS 可行 |

#### 策略反制

- 携带 `debuff(def)` 技能的武将：张飞 S2、法正 S2、于禁 S1、许褚 S2 等
- 减防 debuff 优先级最高，应在 DPS 输出前施加

#### WHEN/THEN 场景

```
WHEN boss 拥有 high_armor 机制
THEN boss 的 DEF 属性增加 bonusDef（300）
AND 该加成在战斗开始时生效
AND 战斗日志显示 "🛡️ [Boss名] 拥有铁壁护甲！防御力大幅提升"

WHEN 玩家对 high_armor boss 施加 DEF debuff
THEN debuff 基于增加后的总 DEF 计算（即基础 DEF + bonusDef）
AND 减防后实际伤害显著提升
```

---

### 3.4 模式 D：属性护盾（Element Shield）🔰

> **设计意图**：迫使玩家根据 Boss 属性搭配克制阵容，推动属性多样性。

#### 数据模式

```javascript
{
  mechanic: 'element_shield',
  immuneElement: 'fire',    // 免疫的元素
  weakElement: 'water'       // 弱点元素（2× 伤害）
}
```

#### 效果说明

| 参数 | 数值 | 说明 |
|------|------|------|
| 免疫属性 | Boss 自身元素 | 同属性伤害 → **0** |
| 弱点属性 | 克制元素 | 伤害 × **2.0** |
| 其他属性 | 正常伤害 × 1.0 | 无加成无减免 |

#### 三国主题示例

- 赤壁 Boss（火属性免疫 `immuneElement: 'fire'`）→ 需要水属性（吴国）英雄
- 虎牢关 Boss（金属性免疫 `immuneElement: 'metal'`）→ 需要火属性（蜀国）英雄
- 依赖五行属性系统（fire/metal/water/wood/earth）

#### WHEN/THEN 场景

```
WHEN boss 拥有 element_shield 机制
AND 攻击者的元素与 immuneElement 匹配
THEN 伤害为 0
AND 战斗日志显示 "🔰 [Boss名] 的属性护盾完全吸收了攻击！"

WHEN boss 拥有 element_shield 机制
AND 攻击者的元素与 weakElement 匹配
THEN 伤害乘以 2.0 倍
AND 战斗日志显示 "🔰 [攻击者名] 击中弱点！伤害翻倍！"
```

---

### 3.5 模式 E：持续毒伤（DoT Application）☠️

> **设计意图**：迫使玩家携带净化者（cleanse 技能），无净化时 DoT 叠加约 6 回合团灭。

#### 数据模式

```javascript
{
  mechanic: 'dot_apply',
  interval: 5,                // 每 5 回合施加一次
  dot: {
    subtype: 'poison',        // DoT 子类型：poison / burn
    hpPercentDrain: 0.08,     // 每回合消耗 8% maxHP
    duration: 4                // 持续 4 回合
  }
}
```

#### 效果说明

| 参数 | 数值 | 说明 |
|------|------|------|
| 施加频率 | 每 5 回合 | 持续压力 |
| 中毒伤害 | 每回合 8% maxHP | 4 回合共 32% HP |
| 叠加效果 | DoT 可叠加 | 第 10 回合第二层叠加 → 16%/回合 |
| 目标选择 | 随机一名存活敌方单位 | |
| 无净化时 | 约 6 回合后因叠加 DoT 团灭 | |

#### 策略反制

- 净化者移除所有负面 buff：蔡文姬终极（`heal_cleanse`）、荀彧终极（`heal_cleanse`）
- 当前仅 2 名净化者，需要更多净化角色

#### WHEN/THEN 场景

```
WHEN boss 拥有 dot_apply 机制
AND 当前回合是 interval（5）的倍数
THEN 随机一名敌方存活单位获得 DoT debuff
AND DoT 类型为 dot.subtype（poison）
AND 每回合造成 dot.hpPercentDrain（8%）maxHP 的伤害
AND 持续 dot.duration（4）回合
AND 战斗日志显示 "☠️ [Boss名] 对 [目标名] 施加了中毒！每回合损失8%最大生命值"

WHEN 单位身上有 DoT debuff
AND 净化技能（heal_cleanse）作用于该单位
THEN 移除该 DoT debuff
AND 战斗日志显示 "✨ [净化者名] 净化了 [目标名] 的中毒状态！"
```

---

### 3.6 模式 F：召唤增援（Add Spawning）👿

> **设计意图**：迫使玩家携带 AoE 伤害技能或优先集火小怪，考验 DPS 分配策略。

#### 数据模式

```javascript
{
  mechanic: 'summon',
  hpThreshold: 0.6,          // Boss HP 低于 60% 时触发
  adds: [
    { name: '青州兵', atk: 0.4, def: 0.4, hp: 0.3, spd: 15 },
    { name: '青州兵', atk: 0.4, def: 0.4, hp: 0.3, spd: 15 }
  ],                          // 小怪属性为 Boss 属性的比例
  bossHealPerAdd: 0.02        // 每个存活小怪每回合治疗 Boss 2% maxHP
}
```

#### 效果说明

| 参数 | 数值 | 说明 |
|------|------|------|
| 触发条件 | Boss HP ≤ 60% | 一次性触发 |
| 小怪数量 | 2 个 | ATK/DEF 约 Boss 的 40% |
| 小怪存活效果 | Boss 每回合回复 2% maxHP / 存活小怪 | 2 小怪存活 = 4%/回合 |
| 不清小怪后果 | Boss 持续回复 → 无法击杀 | 需优先处理 |

#### 三国主题

- 曹操召唤青州兵、吕布召唤八健将、袁绍召唤谋士

#### 策略反制

- 携带 `target: 'all'` 伤害技能清理小怪
- 或先集火小怪再继续打 Boss

#### WHEN/THEN 场景

```
WHEN boss 拥有 summon 机制
AND boss 当前 HP 首次降至 hpThreshold（60%）以下
THEN 召唤 adds 数组中定义的小怪加入战场
AND 小怪属性按 Boss 属性的比例计算
AND 战斗日志显示 "👿 [Boss名] 召唤了增援！"
AND summon 机制标记为已触发（不再重复触发）

WHEN boss 已召唤小怪
AND 有小怪存活
THEN 每回合开始时 boss 回复 bossHealPerAdd（2%）× 存活小怪数 的 maxHP
AND 战斗日志显示 "💚 [Boss名] 从增援中获得治疗，回复[X]点生命值"
```

---

### 3.7 模式 G：斩杀（Execute Threshold）⚔️

> **设计意图**：迫使玩家保持全队 HP 在安全线以上，与 AoE（模式 B）形成致命组合。

#### 数据模式

```javascript
{
  mechanic: 'execute',
  hpThreshold: 0.30,         // HP 低于 30% 时触发斩杀
  cooldown: 3                  // 冷却 3 回合
}
```

#### 效果说明

| 参数 | 数值 | 说明 |
|------|------|------|
| 斩杀线 | HP ≤ 30% | 低于此值的单位被直接击杀 |
| 冷却 | 3 回合 | 持续威胁但非每回合 |
| 组合效果 | AoE 压血线 → 斩杀低血目标 | 先模式 B 再模式 G 的致命连招 |

#### 策略反制

- 治疗者优先治疗最低 HP 队友（已有 `ally_lowest_hp` 选目标逻辑）
- 护盾技能（如孙权终极 `shield`）提供额外 HP 池
- 不死之身词缀可抵挡一次斩杀

#### WHEN/THEN 场景

```
WHEN boss 拥有 execute 机制
AND execute 冷却已就绪
AND 存在敌方单位 HP 比例 ≤ hpThreshold（30%）
THEN 对该单位造成等同于其剩余 HP 的伤害（即直接击杀）
AND execute 进入 cooldown（3）回合冷却
AND 战斗日志显示 "⚔️ [Boss名] 发动斩杀！[目标名] 被一击必杀！"

WHEN boss 拥有 execute 机制
AND execute 冷却已就绪
AND 多名敌方单位 HP 比例 ≤ hpThreshold
THEN 优先斩杀 HP 比例最低的单位（仅斩杀 1 人）
```

---

## 4. Boss 机制组合 — 章节分布

### 4.1 机制引入时间表

| 章节 | 引入机制 | 组合 | 推荐阵容 |
|------|---------|------|---------|
| Ch 1-5 | 无 | — | 任意 DPS 队伍（教学期）|
| Ch 6 | **A 狂暴** | A | 4 DPS + 1 自由 |
| Ch 7 | **B 周期性 AoE** | B | 3 DPS + 1 治疗 + 1 自由 |
| Ch 8 | **C 高甲** | C | 3 DPS + 1 减防 + 1 自由 |
| Ch 9 | **D 属性护盾** | D | 3 克制 DPS + 1 治疗 + 1 自由 |
| Ch 10 | — | **A + B** | 3 DPS + 1 治疗 + 1 高 DPS |
| Ch 11 | **E 毒伤** | **E + C** | 2 DPS + 1 治疗 + 1 减防 + 1 净化 |
| Ch 12 | **F 召唤** | **F + D** | 2 克制 DPS(含AoE) + 1 治疗 + 1 减防 + 1 自由 |
| Ch 13 | **G 斩杀** | **A + E + G** | 2 DPS + 2 治疗/净化 + 1 自由 |
| Ch 14 | — | 3 机制组合 | 需精心搭配完整阵容 |
| Ch 15 | — | 3-4 机制组合 | 需最优阵容 + 高培养度 |

### 4.2 典型 Boss 数据示例

#### 第 6 章 Boss（仅狂暴）

```javascript
{
  id: 'boss_6_10', name: '袁术', atk: 500, def: 200, hp: 5000, spd: 50,
  element: 'earth',
  mechanics: [
    { mechanic: 'enrage', triggerRound: 20, atkBoost: 0.50, escalation: { interval: 5, boost: 0.15 } }
  ]
}
```

#### 第 10 章 Boss（狂暴 + AoE）

```javascript
{
  id: 'boss_10_10', name: '曹操', atk: 900, def: 300, hp: 12000, spd: 55,
  element: 'metal',
  mechanics: [
    { mechanic: 'enrage', triggerRound: 20, atkBoost: 0.50, escalation: { interval: 5, boost: 0.15 } },
    { mechanic: 'periodic_aoe', interval: 4, hpPercent: 0.25 }
  ]
}
```

#### 第 13 章 Boss（狂暴 + 毒伤 + 斩杀）

```javascript
{
  id: 'boss_13_10', name: '司马懿', atk: 1200, def: 350, hp: 16000, spd: 60,
  element: 'earth',
  mechanics: [
    { mechanic: 'enrage', triggerRound: 20, atkBoost: 0.50, escalation: { interval: 5, boost: 0.15 } },
    { mechanic: 'dot_apply', interval: 5, dot: { subtype: 'poison', hpPercentDrain: 0.08, duration: 4 } },
    { mechanic: 'execute', hpThreshold: 0.30, cooldown: 3 }
  ]
}
```

#### 第 15 章 Boss（全机制终极 Boss）

```javascript
{
  id: 'boss_15_10', name: '终极吕布', atk: 1500, def: 400, hp: 20000, spd: 65,
  element: 'metal',
  mechanics: [
    { mechanic: 'enrage', triggerRound: 15, atkBoost: 0.60, escalation: { interval: 4, boost: 0.20 } },
    { mechanic: 'periodic_aoe', interval: 3, hpPercent: 0.20 },
    { mechanic: 'execute', hpThreshold: 0.30, cooldown: 3 },
    { mechanic: 'summon', hpThreshold: 0.5, adds: [
        { name: '八健将', atk: 0.35, def: 0.35, hp: 0.25, spd: 15 },
        { name: '八健将', atk: 0.35, def: 0.35, hp: 0.25, spd: 15 },
        { name: '八健将', atk: 0.35, def: 0.35, hp: 0.25, spd: 15 }
      ], bossHealPerAdd: 0.015 }
  ]
}
```

---

## 5. 实现契约

### 5.1 Stage 数据格式扩展

在 `js/data/stages.js` 的 Boss 条目中新增 `mechanics` 数组字段：

```javascript
// stages.js — Boss 条目格式
{
  id: 'boss_X_10',
  name: 'Boss 名',
  atk: Number,
  def: Number,
  hp: Number,
  spd: Number,
  element: 'fire' | 'metal' | 'water' | 'wood' | 'earth',   // 需要属性系统
  mechanics: [                                                  // 新增字段
    { mechanic: 'enrage', ... },
    { mechanic: 'periodic_aoe', ... },
    // ...可组合多个
  ]
}
```

**规则**：
- `mechanics` 字段可选——无此字段或空数组表示无特殊机制（Ch 1-5）
- 非 Boss 关卡不使用 `mechanics` 字段
- 每个机制对象必须包含 `mechanic` 类型键

### 5.2 BattleManager 扩展

#### 新增方法：`_processBossMechanics(boss, round)`

在每回合开始时（`_executeRound()` 中 `round++` 之后、单位行动之前）调用：

```javascript
// battle-manager.js — 在 _executeRound() 中添加
_processBossMechanics: function(boss, round) {
  if (!boss.mechanics || boss.mechanics.length === 0) return;

  boss.mechanics.forEach(function(mech) {
    switch (mech.mechanic) {
      case 'enrage':      this._handleEnrage(boss, round, mech); break;
      case 'periodic_aoe': this._handlePeriodicAoE(boss, round, mech); break;
      case 'high_armor':  this._handleHighArmor(boss, mech); break;
      case 'element_shield': this._handleElementShield(boss, mech); break;
      case 'dot_apply':   this._handleDotApply(boss, round, mech); break;
      case 'summon':      this._handleSummon(boss, round, mech); break;
      case 'execute':     this._handleExecute(boss, round, mech); break;
    }
  }.bind(this));
}
```

#### 机制处理器签名

| 处理器 | 调用时机 | 效果 |
|--------|---------|------|
| `_handleEnrage(boss, round, mech)` | 每回合检查 | 达到 triggerRound 时添加 ATK buff |
| `_handlePeriodicAoE(boss, round, mech)` | 每回合检查 | 间隔回合对全体造成 %HP 伤害 |
| `_handleHighArmor(boss, mech)` | 战斗初始化时 | 增加 boss DEF |
| `_handleElementShield(boss, mech)` | 伤害计算时拦截 | 免疫/弱点元素判定 |
| `_handleDotApply(boss, round, mech)` | 每回合检查 | 间隔回合施加 DoT debuff |
| `_handleSummon(boss, round, mech)` | 每回合检查 HP | HP 低于阈值时召唤小怪 |
| `_handleExecute(boss, round, mech)` | 每回合检查 | 冷却就绪时斩杀低血目标 |

#### 战斗日志图标规范

| 机制 | 图标 | 日志格式 |
|------|------|---------|
| 狂暴 | ⏰ | `⏰ [Boss名] 进入狂暴状态！攻击力提升X%` |
| AoE | 💥 | `💥 [Boss名] 释放范围轰击！全体受到X%最大生命值伤害` |
| 高甲 | 🛡️ | `🛡️ [Boss名] 拥有铁壁护甲！防御力大幅提升` |
| 属性护盾 | 🔰 | `🔰 [Boss名] 的属性护盾完全吸收了攻击！` |
| 毒伤 | ☠️ | `☠️ [Boss名] 对 [目标名] 施加了中毒！` |
| 召唤 | 👿 | `👿 [Boss名] 召唤了增援！` |
| 斩杀 | ⚔️ | `⚔️ [Boss名] 发动斩杀！[目标名] 被一击必杀！` |
| 净化 | ✨ | `✨ [净化者名] 净化了 [目标名] 的中毒状态！` |
| 小怪治疗 | 💚 | `💚 [Boss名] 从增援中获得治疗` |

### 5.3 处理顺序

每回合内的机制处理优先级（在 `_processBossMechanics` 中的执行顺序）：

1. **高甲**（`high_armor`）— 战斗开始时一次性应用
2. **狂暴**（`enrage`）— 检查并添加 ATK buff
3. **召唤**（`summon`）— 检查 HP 阈值并召唤小怪 + 小怪回复
4. **周期性 AoE**（`periodic_aoe`）— 造成全体百分比伤害
5. **毒伤**（`dot_apply`）— 施加 DoT 到随机目标
6. **斩杀**（`execute`）— 检查并击杀低血目标（在 AoE 之后确保连招有效）
7. **属性护盾**（`element_shield`）— 在 `_calculateDamage()` 中拦截，不在此处理

### 5.4 与现有系统的交互

| 现有系统 | 交互方式 |
|---------|---------|
| `_calculateDamage()` | element_shield 在此拦截，判断免疫/弱点倍率 |
| `_processBuffs()` | enrage 添加的 ATK buff 通过现有 buff 系统管理（duration: 999） |
| `_applyDot()` | dot_apply 的 DoT 效果复用现有（待实现的）DoT 回合 tick |
| `_skillHeal()` | 小怪治疗 Boss 复用现有治疗逻辑 |
| `heal_cleanse` 终极 | 净化 DoT 复用现有 cleanse 逻辑（移除负比率 buff） |
| 战斗日志 | 所有机制触发通过 `_addBattleLog()` 写入日志 |

---

## 6. 不做什么（范围排除）

- ❌ 修改 Ch 1-5 现有 Boss 数值或行为
- ❌ 添加新武将角色（仅利用现有角色的技能反制机制）
- ❌ 实现完整的五行属性系统（属性护盾 D 依赖属性系统，若未实现则推迟该机制）
- ❌ 修改非 Boss 关卡的敌人行为
- ❌ 添加玩家手动操作（保持 Idle 自动战斗本质）
- ❌ 引入 npm 包或构建工具
- ❌ PvP 或多人 Boss 战

---

## 7. 成功指标

| 指标 | 目标 | 衡量方式 |
|------|------|---------|
| 阵容多样性 | Ch 6+ Boss 战中治疗者出场率 ≥ 50% | 战斗结算统计 |
| 机制可感知性 | 每种机制触发时有明确日志和视觉反馈 | 战斗日志审查 |
| 难度梯度 | Ch 6 → Ch 15 一次通关率逐步降低（80% → 20%） | 通关统计 |
| 角色价值 | 减防者/净化者在对应 Boss 战中出场率 ≥ 30% | 阵容分析 |
| 战斗时长 | Boss 战平均 15-30 回合（非狂暴前结束） | 回合数统计 |

---

## 8. 数值需求摘要（需 numerical-designer 深化）

> 📐 以下数值为设计建议值，需要 `numerical-designer` Agent 基于当前关卡数值曲线进行精确平衡。

1. **狂暴参数调优**：triggerRound 和 atkBoost 需与各章节 Boss ATK 基数配合，确保"刚好来得及"
2. **AoE 百分比平衡**：hpPercent 需与治疗者的全体治疗量匹配，保证"有治疗可活、无治疗必死"
3. **高甲 DEF 值**：bonusDef 需确保无减防时 DPS 产出约为有减防时的 25-30%
4. **DoT 参数**：hpPercentDrain × duration 的总伤害需与一次治疗量对比
5. **召唤小怪属性**：小怪 ATK/DEF/HP 比例需确保"可被 AoE 快速清理但不可忽视"
6. **斩杀线阈值**：hpThreshold 需与 AoE 伤害配合，形成"AoE 压线 → 斩杀"的连招节奏
7. **Ch 14-15 多机制组合的综合难度评估**

---

## 9. 开放问题

- [ ] 属性护盾（模式 D）是否需要完整五行属性系统先行实现？还是可以简化为 Boss 独有的元素免疫/弱点？
- [ ] 狂暴计时器是否需要 UI 提示（如倒计时条）让玩家提前感知？
- [ ] 召唤小怪是否参与 SPD 排序行动队列？还是仅作为被动治疗源？
- [ ] 自动推图 AI 如何处理机制 Boss？是否需要智能阵容推荐？
- [ ] 已有的 `damage_dot` 终极技能数据和 `stunChance` 字段是否应在本次一并实现？
- [ ] 高甲机制是否可被穿透类技能（如"无视 DEF"效果）绕过？

---

## 10. 交叉引用

- BattleManager 规范：[specs/services/battle-manager.md](../services/battle-manager.md)
- 核心契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 关卡数据：[js/data/stages.js](../../js/data/stages.js)
- 战斗管理器：[js/modules/battle-manager.js](../../js/modules/battle-manager.js)
- 英雄技能数据：[js/data/hero-skills.js](../../js/data/hero-skills.js)
- 终极技能数据：[js/data/ultimate-skills.js](../../js/data/ultimate-skills.js)
