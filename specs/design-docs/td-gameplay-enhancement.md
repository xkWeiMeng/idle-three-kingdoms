---
status: Draft
version: 0.1.0
related:
  - specs/game-prds/td-gameplay-enhancement.md
  - specs/numerical/td-gameplay-enhancement.md
  - specs/product-specs/tower-defense-system.md
---

# 塔防体验全面升级 — 技术设计文档

## 1. 概述

### 1.1 升级范围

本文档描述塔防系统（Tower Defense）的全面体验升级。覆盖15项能力（CAP-TDE-01 ~ CAP-TDE-15），解决"战斗零交互"、"每日3次限制"、"击杀无反馈"、"布阵无策略"、"武将存在感低"五个核心问题。

### 1.2 目标

- **操作感**：手动技能释放 + 全局紧急技能 → 战斗中有决策点
- **节奏控制**：加速/暂停 + 体力系统 → 玩家掌控游戏节奏
- **爽快感**：飘字伤害 + 连杀 + 粒子 → 即时满足
- **策略深度**：半封路 + 塔进化 + 羁绊 → 重复可玩性

### 1.3 分 Phase 计划

| Phase | 目标 | CAP 范围 |
|-------|------|---------|
| **Phase 1** | 立竿见影 — 核心体验修复 | CAP-TDE-01 ~ CAP-TDE-07 |
| **Phase 2** | 策略深化 — 可玩→好玩 | CAP-TDE-08 ~ CAP-TDE-12 |
| **Phase 3** | 深度扩展 — 好玩→上瘾 | CAP-TDE-13 ~ CAP-TDE-15 |

### 1.4 约束

- 全局变量 + `<script>` 加载，无 ES Module
- EventBus 唯一跨模块通信
- Manager 为全局单例对象（不用 class）
- 所有持久化通过 SaveManager + `getState()`
- Canvas 2D 渲染
- 数值引用数值规范章节号，不在此文档重复

---

## 2. 术语表

| 术语 | 定义 |
|------|------|
| **技能蓄力（Skill Charge）** | 武将技能能量从0蓄满的过程，蓄满后可手动或自动释放 |
| **手动释放加成（Manual Bonus）** | 玩家主动点击释放武将技能时获得的额外伤害倍率 |
| **体力（Stamina）** | 替代 DAILY_CHALLENGE_LIMIT 的可恢复资源，控制每日游玩次数 |
| **练习模式（Practice Mode）** | 已通关卡的免费重刷模式，奖励大幅减少 |
| **飘字（Damage Text / Float Number）** | 攻击命中时在敌人上方弹出的伤害数字 |
| **连杀（Kill Streak）** | 在时间窗口内连续击杀敌人触发的分级提示和金币加成 |
| **紧急技能（Emergency Skill）** | 不依赖特定武将的全局强力技能，有较长冷却 |
| **半封路（Semi-blocking）** | 允许玩家用墙体引导敌人走曲折路线但禁止完全封死 |
| **塔进化（Tower Evolution）** | Lv5 满级塔的二选一分支升级，不可逆 |
| **武将羁绊（Hero Bond）** | 特定武将组合部署时触发的额外被动加成 |
| **Boss 专属机制** | 章节 Boss 的独特战斗行为（召唤/冲锋/光环/斩击/分身） |
| **速度倍率（Speed Multiplier）** | 战斗 deltaTime 缩放因子，1×/2×/3× 三档 |
| **scaledDelta** | `min(dt × speedMultiplier, MAX_SCALED_DELTA)` — 缩放后的帧间隔 |

---

## 3. 架构变更概览

### 3.1 修改的模块列表

| 文件 | 类型 | 变更范围 |
|------|------|---------|
| `js/modules/tower-defense-manager.js` | Manager | 新增体力管理、手动技能、连杀追踪、紧急技能、速度控制、进化、羁绊、Boss AI |
| `js/ui/tower-defense-panel.js` | Panel | 新增速度按钮、技能栏UI、体力显示、进化面板、羁绊面板、练习模式入口 |
| `js/ui/td-renderer.js` | Renderer | 新增飘字渲染、粒子系统、震屏效果、连杀提示、进化塔外观、Boss技能特效 |
| `js/data/td-data.js` | Data | 新增 TDEvolutionData、TDBondData、TDBossSkillData、TD_CONSTANTS 扩展 |
| `js/core/constants.js` | Constants | TD_CONSTANTS 新增子对象 |
| `main.js` | Init | 更新 getFullState() 包含体力等新字段 |
| 新增 `js/data/td-maps.js` | Data | 5 章专用 TD 地图数据 |

### 3.2 新增的事件

| 事件 | 载荷 | 生产者 | 消费者 |
|------|------|--------|--------|
| `td:skill_ready` | `{heroUid, heroName}` | TDManager | TDPanel |
| `td:skill_manual_cast` | `{heroUid, damage, bonus}` | TDManager | TDPanel, TDRenderer |
| `td:skill_auto_cast` | `{heroUid, damage}` | TDManager | TDPanel |
| `td:emergency_skill_used` | `{skillId, skillName}` | TDManager | TDPanel, TDRenderer |
| `td:emergency_skill_ready` | `{skillId}` | TDManager | TDPanel |
| `td:kill_streak` | `{count, level, text, color, goldBonus}` | TDManager | TDRenderer |
| `td:kill_streak_reset` | `{}` | TDManager | TDRenderer |
| `td:speed_changed` | `{speed, index}` | TDManager | TDPanel, TDRenderer |
| `td:paused` | `{}` | TDManager | TDPanel, TDRenderer |
| `td:resumed` | `{speed}` | TDManager | TDPanel |
| `td:stamina_changed` | `{current, max, nextRecoverAt}` | TDManager | TDPanel |
| `td:damage_dealt` | `{targetUid, damage, x, y, type, sourceUid, isCrit}` | TDManager | TDRenderer |
| `td:enemy_death_effect` | `{uid, x, y, type, isBoss}` | TDManager | TDRenderer |
| `td:tower_evolved` | `{towerUid, evolutionId, path}` | TDManager | TDPanel, TDRenderer |
| `td:bond_activated` | `{bondId, bondName, effects}` | TDManager | TDPanel |
| `td:bond_deactivated` | `{bondId, bondName}` | TDManager | TDPanel |
| `td:boss_skill_warning` | `{bossUid, skillType, delay}` | TDManager | TDRenderer |
| `td:screen_shake` | `{intensity, duration}` | TDManager | TDRenderer |

### 3.3 存档结构扩展

现有 `_state` 新增字段（详见 §8）：

```javascript
{
  // ... 现有字段 ...
  stamina: { current: 12, lastRecoverTime: timestamp },
  showStrategicPoints: true,
  evolutions: {}       // { towerUid: 'pathA' | 'pathB' }
}
```

---

## 4. Phase 1 能力规范

### CAP-TDE-01: 战斗速度控制

**PRD 来源**：US-A2

#### 实现方案

在 `TowerDefenseManager` 中新增速度状态和控制方法。核心修改在 `_battleTick(timestamp)` — 将计算出的 `dt` 乘以当前速度倍率后再传入所有子 Tick 函数。

**新增方法**：
- `cycleSpeed()` — 循环切换 1× → 2× → 3× → 1×
- `pauseBattle()` — 设置 `_battle.paused = true`
- `resumeBattle()` — 设置 `_battle.paused = false`
- `getSpeedMultiplier()` — 返回当前倍率

**修改方法**：
- `_battleTick(timestamp)` — 在计算 `dt` 后插入 `dt = Math.min(dt * speedMultiplier, MAX_SCALED_DELTA)`；暂停时跳过所有逻辑更新但允许渲染
- `enterDefenseMode()` — 重置 `_speedIndex = 0`
- `forceExitDefenseMode()` — 重置速度

**UI 侧（tower-defense-panel.js）**：
- `_createSpeedButton()` — 在状态栏右侧创建速度切换按钮
- `_createPauseButton()` — 在速度按钮旁创建暂停/恢复按钮
- `_updateSpeedButton()` — 监听 `td:speed_changed` 更新显示

#### _state 变更

```javascript
// 运行时状态（非持久化）
_speedIndex: 0,          // TD_CONSTANTS.SPEED.LEVELS 的索引
_battle.paused: false    // 新增暂停标志
```

无需持久化——退出防守模式后重置。

#### WHEN/THEN 技术场景

```
WHEN 玩家调用 TowerDefenseManager.cycleSpeed()
THEN _speedIndex = (_speedIndex + 1) % SPEED.LEVELS.length
AND EventBus.emit('td:speed_changed', {speed: SPEED.LEVELS[_speedIndex], index: _speedIndex})

WHEN _battleTick 执行且 _battle.paused === true
THEN 跳过所有 _tick* 调用，仅允许 _renderTDFrame 继续（画面冻结但UI可交互）

WHEN _battleTick 执行且 _speedIndex > 0
THEN dt = Math.min(rawDt * SPEED.LEVELS[_speedIndex], SPEED.MAX_SCALED_DELTA)
AND 传入 _tickSpawning(dt), _tickEnemies(dt), _updateTowers(dt) 等

WHEN enterDefenseMode() 调用
THEN _speedIndex = SPEED.DEFAULT_INDEX（重置为1×）
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `tower-defense-manager.js` | `_battleTick` | 修改：dt 缩放 + 暂停检查 |
| `tower-defense-manager.js` | 新增 `cycleSpeed` | 新增 |
| `tower-defense-manager.js` | 新增 `pauseBattle` / `resumeBattle` | 新增 |
| `tower-defense-manager.js` | `enterDefenseMode` / `forceExitDefenseMode` | 修改：重置速度 |
| `tower-defense-panel.js` | `_createStatusBar` | 修改：添加速度/暂停按钮 |
| `tower-defense-panel.js` | 新增 `_createSpeedButton` / `_createPauseButton` | 新增 |

#### 数值引用

数值见数值规范 §10（速度倍率 1.0/2.0/3.0，MAX_SCALED_DELTA=0.1）。

#### 事件

- 新增 `td:speed_changed` — `{speed, index}`
- 新增 `td:paused` — `{}`
- 新增 `td:resumed` — `{speed}`

#### 错误/边界处理

- `dt` 钳位：`scaledDelta = Math.min(dt * speedMul, 0.1)` 防止帧率骤降导致物理跳跃
- 暂停中不允许建造/出售（防止零成本规划）
- 暂停中可查看塔信息、切换速度档位
- 退出再进入防守模式，速度重置为 1×

---

### CAP-TDE-02: 体力系统

**PRD 来源**：US-B1

#### 实现方案

在 `TowerDefenseManager._state` 中新增 `stamina` 子对象，替代现有 `dailyChallenges`。体力随时间自动恢复，离线时按时间差补偿。

**新增方法**：
- `_initStamina(savedStamina)` — 初始化或迁移体力数据
- `_recoverStamina()` — 在 `onTick(dt)` 中调用，检查恢复时间并回复体力
- `_calcOfflineRecovery()` — 离线补偿计算
- `canStartBattle()` — 检查体力是否足够
- `consumeStamina(cost)` — 扣除体力
- `getStaminaInfo()` — 返回 `{current, max, nextRecoverAt, cost}`

**修改方法**：
- `init(saved)` — 调用 `_initStamina` 处理旧存档迁移
- `startWave()` — 开始前调用 `canStartBattle()` 检查体力；调用 `consumeStamina()`
- `getState()` — 包含 `stamina` 字段
- `onTick(dt)` — 每秒调用 `_recoverStamina()`

**旧存档迁移逻辑**（在 `_initStamina` 中）：
```javascript
if (!savedStamina) {
  // 旧存档无 stamina → 初始化为满体力
  this._state.stamina = { current: TD_CONSTANTS.STAMINA.MAX, lastRecoverTime: Date.now() };
}
```

#### _state 变更

```javascript
_state.stamina: {
  current: 12,                    // 当前体力
  lastRecoverTime: <timestamp>    // 上次恢复时间
}
// 废弃：_state.dailyChallenges
```

#### WHEN/THEN 技术场景

```
WHEN init(saved) 且 saved.towerDefense 无 stamina 字段
THEN _state.stamina = { current: STAMINA.MAX, lastRecoverTime: Date.now() }
AND 废弃 dailyChallenges 字段

WHEN onTick(dt) 且 _state.stamina.current < STAMINA.MAX
AND Date.now() - _state.stamina.lastRecoverTime >= STAMINA.RECOVER_INTERVAL * 60000
THEN _state.stamina.current = min(current + RECOVER_AMOUNT, MAX)
AND _state.stamina.lastRecoverTime += RECOVER_INTERVAL * 60000
AND EventBus.emit('td:stamina_changed', getStaminaInfo())

WHEN startWave() 调用且 practiceMode === false
AND _state.stamina.current < STAMINA.COST_NORMAL
THEN return { ok: false, reason: '体力不足' }

WHEN 离线 3 小时后 init 恢复存档
THEN offlineRecovery = min(MAX - current, floor(180 / 25)) = 7
AND _state.stamina.current += 7
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `tower-defense-manager.js` | `init` | 修改：调用 _initStamina |
| `tower-defense-manager.js` | 新增 `_initStamina` / `_recoverStamina` / `canStartBattle` / `consumeStamina` / `getStaminaInfo` | 新增 |
| `tower-defense-manager.js` | `startWave` | 修改：检查体力 |
| `tower-defense-manager.js` | `onTick` | 修改：调用恢复 |
| `tower-defense-manager.js` | `getState` | 修改：包含 stamina |
| `tower-defense-panel.js` | `_createStatusBar` / `_updateStatusBar` | 修改：显示体力 |
| `tower-defense-panel.js` | `_onStartWave` | 修改：检查体力 |

#### 数值引用

数值见数值规范 §3（MAX=12, COST_NORMAL=1, RECOVER_INTERVAL=25min）。

#### 事件

- 新增 `td:stamina_changed` — `{current, max, nextRecoverAt}`

#### 错误/边界处理

- 体力已满（12/12）时恢复计时器暂停
- 战斗失败不退还体力
- 自动防守（离线）不消耗体力
- 离线恢复不超过 MAX

---

### CAP-TDE-03: 飘字伤害系统

**PRD 来源**：US-C1

#### 实现方案

在 `TDRenderer` 中新增飘字渲染子系统。`TowerDefenseManager` 在每次造成伤害时 emit `td:damage_dealt` 事件，TDRenderer 维护飘字池并在 Canvas 上渲染。

**TDRenderer 新增**：
- `_damageTexts: []` — 飘字对象池（最大 `DAMAGE_TEXT.MAX_ONSCREEN`）
- `_addDamageText(data)` — 创建或复用飘字，实现合并逻辑
- `drawDamageTexts(ctx, dt)` — 在 `_renderTDFrame` 最后阶段绘制所有活跃飘字

**飘字对象结构**：
```javascript
{
  x: px, y: px,           // 位置
  damage: number,          // 累计伤害值
  type: 'normal'|'skill'|'manual_skill'|'crit',
  alpha: 1.0,              // 淡出透明度
  elapsed: 0,              // 已存活时间
  sourceUid: '',           // 攻击源 UID（用于合并）
  targetUid: ''            // 目标 UID（用于合并）
}
```

**合并逻辑**（在 `_addDamageText` 中）：
```javascript
// 查找是否已有同源同目标的活跃飘字（elapsed < MERGE_WINDOW）
var existing = null;
for (var i = 0; i < this._damageTexts.length; i++) {
  var t = this._damageTexts[i];
  if (t.sourceUid === data.sourceUid && t.targetUid === data.targetUid
      && t.elapsed < TD_CONSTANTS.DAMAGE_TEXT.MERGE_WINDOW) {
    existing = t;
    break;
  }
}
if (existing) {
  existing.damage += data.damage;
  existing.elapsed = 0; // 重置淡出
} else {
  // 创建新飘字，超过 MAX_ONSCREEN 时复用最早的
}
```

**TowerDefenseManager 修改**：
- `_towerAttack()` — 造成伤害后 emit `td:damage_dealt`
- `_executeHeroSkill()` — 技能命中后 emit `td:damage_dealt`（type 区分手动/自动）
- `_handleSplash()` — 溅射伤害也 emit

**渲染**：飘字的 `elapsed` 使用真实 dt（非 scaledDelta），保证可读性不受倍速影响。

#### _state 变更

无持久化变更。飘字为纯渲染层运行时数据。

#### WHEN/THEN 技术场景

```
WHEN _towerAttack 造成伤害 damage=30 于 enemy(uid=E1) 由 tower(uid=T1)
THEN EventBus.emit('td:damage_dealt', {targetUid:'E1', damage:30, x:enemy.x, y:enemy.y, type:'normal', sourceUid:'T1'})

WHEN 连弩塔(AS=3.0) 在 0.3s 内第 2 次命中同一 enemy
THEN _addDamageText 找到已有飘字（elapsed<0.3s, 同 sourceUid+targetUid）
AND 累加 damage，重置 elapsed

WHEN 同屏飘字数量达到 15 个时新增飘字
THEN 复用 elapsed 最大的飘字对象（替换内容）

WHEN _executeHeroSkill 手动释放（isManual=true）
THEN emit td:damage_dealt 的 type='manual_skill'
AND 渲染金色、更大字号飘字
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `td-renderer.js` | 新增 `_damageTexts`, `_addDamageText`, `drawDamageTexts` | 新增 |
| `tower-defense-panel.js` | `_renderTDFrame` | 修改：末尾调用 drawDamageTexts(ctx, realDt) |
| `tower-defense-manager.js` | `_towerAttack` | 修改：emit td:damage_dealt |
| `tower-defense-manager.js` | `_executeHeroSkill` | 修改：emit td:damage_dealt |
| `tower-defense-manager.js` | `_handleSplash` | 修改：emit td:damage_dealt |

#### 数值引用

数值见数值规范 §5（MERGE_WINDOW=0.3s, MAX_ONSCREEN=15, DURATION=0.8s, FLOAT_DISTANCE=30px, RANDOM_OFFSET_X=±8px）。

#### 事件

- 新增 `td:damage_dealt` — `{targetUid, damage, x, y, type, sourceUid, isCrit}`

#### 错误/边界处理

- 同屏飘字超过 MAX_ONSCREEN → 复用最早的
- 飘字位置加 ±RANDOM_OFFSET_X 水平随机偏移避免重叠
- 50 个实体同屏时帧率不低于 30FPS（对象池复用无 GC 压力）
- 飘字 elapsed 使用真实 dt，不乘以速度倍率

---

### CAP-TDE-04: 击杀视觉反馈

**PRD 来源**：US-C3

#### 实现方案

在 `TDRenderer` 中新增三个子系统：死亡动画、金币粒子、震屏效果。

**死亡动画**：修改 `_killEnemy()` 不立即从 `_battle.enemies` 中移除敌人，而是将 `enemy.status = 'dying'`，设 `enemy.deathTimer = 0`。在 `_tickEnemies(dt)` 中对 `dying` 状态的敌人递增 `deathTimer`，超过 0.5s 后才从数组移除。TDRenderer 的 `drawEnemy()` 检测 `dying` 状态时渲染闪烁+缩小动画。

**金币粒子**：
- `TDRenderer._particles: []` — 粒子池（上限 30）
- `_spawnCoinParticles(x, y, count)` — 从击杀位置生成 2-4 个金色圆形粒子
- `drawParticles(ctx, realDt)` — 粒子沿弧线飞向 Canvas 左上角金币显示区

**Boss 震屏**：
- `TDRenderer._shake: {active: false, intensity: 0, duration: 0, elapsed: 0}`
- `triggerShake(intensity, duration)` — 启动震屏
- 在 `_renderTDFrame` 开始处 `ctx.save()` + `ctx.translate(shakeX, shakeY)` + 结束时 `ctx.restore()`

#### _state 变更

```javascript
// 敌人运行时新增（非持久化）
enemy.deathTimer: 0    // 死亡动画计时
enemy.status: 'dying'  // 新增状态值
```

#### WHEN/THEN 技术场景

```
WHEN enemy.hp <= 0（普通敌人）
THEN enemy.status = 'dying', enemy.deathTimer = 0
AND EventBus.emit('td:enemy_death_effect', {uid, x, y, type, isBoss: false})
AND TDRenderer._spawnCoinParticles(enemy.x, enemy.y, 3)

WHEN enemy.deathTimer >= 0.5s
THEN 从 _battle.enemies 数组移除

WHEN Boss 敌人 hp <= 0
THEN 同普通流程 + EventBus.emit('td:screen_shake', {intensity: 3, duration: 0.3})

WHEN 攻城器械被击杀
THEN 死亡动画延长至 0.8s，缩放幅度更大
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `tower-defense-manager.js` | `_killEnemy` | 修改：设 dying 而非立即移除 |
| `tower-defense-manager.js` | `_tickEnemies` | 修改：dying 清理 |
| `td-renderer.js` | `drawEnemy` | 修改：dying 动画 |
| `td-renderer.js` | 新增 `_particles`, `_spawnCoinParticles`, `drawParticles` | 新增 |
| `td-renderer.js` | 新增 `_shake`, `triggerShake` | 新增 |
| `tower-defense-panel.js` | `_renderTDFrame` | 修改：震屏 translate + drawParticles |

#### 数值引用

死亡动画 0.5s（攻城器械 0.8s），粒子 2-4 个/击杀，震屏 ±3px 持续 0.3s。

#### 事件

- 新增 `td:enemy_death_effect` — `{uid, x, y, type, isBoss}`
- 新增 `td:screen_shake` — `{intensity, duration}`

#### 错误/边界处理

- 大量同时死亡：粒子池上限 30，超出复用最早的
- dying 状态的敌人不参与碰撞、不被塔攻击（`_findTargets` 排除）
- 震屏仅影响 Canvas（ctx translate），不影响 UI 层

---

### CAP-TDE-05: 武将技能手动释放

**PRD 来源**：US-A1

#### 实现方案

将武将技能从"自动每 N 秒释放"改为"蓄力→手动释放→自动兜底"模式。

**重构 `_heroRuntime[uid]`**，新增字段：
```javascript
_heroRuntime[uid].skillCharge = 0;           // 当前蓄力进度（秒）
_heroRuntime[uid].chargeTime = 10;           // 此武将的蓄力时间
_heroRuntime[uid].skillReady = false;        // 是否蓄满
_heroRuntime[uid].autoReleaseTimer = 0;      // 蓄满后等待自动释放的计时
```

**修改 `_tickHeroCombat(dt)`**：
```javascript
// 替换原有 hero.skillCooldown 逻辑为：
hero.skillCharge += dt;
if (hero.skillCharge >= hero.chargeTime && !hero.skillReady) {
  hero.skillReady = true;
  hero.autoReleaseTimer = 0;
  EventBus.emit('td:skill_ready', {heroUid: uid, heroName: heroStats.name});
}
if (hero.skillReady) {
  hero.autoReleaseTimer += dt;
  if (hero.autoReleaseTimer >= TD_CONSTANTS.SKILL_CHARGE.AUTO_RELEASE_TIMEOUT) {
    this._executeHeroSkill(uid, hero, heroStats, target, false);
  }
}
```

**新增方法**：
- `manualCastSkill(heroUid)` — 玩家手动释放
- `_executeHeroSkill(uid, hero, heroStats, target, isManual)` — 统一执行，isManual=true 时伤害 ×MANUAL_SKILL_BONUS
- `_calcChargeTime(heroUid)` — 基于武将属性计算蓄力时间

**UI 侧（tower-defense-panel.js）**：
- `_createSkillBar()` — Canvas 下方武将技能按钮栏（最多3槽位）
- `_updateSkillBar()` — 监听 `td:skill_ready` 高亮按钮；显示蓄力进度

#### _state 变更

```javascript
// 运行时（_heroRuntime 扩展，非持久化）
skillCharge: 0, chargeTime: 10, skillReady: false, autoReleaseTimer: 0
```

#### WHEN/THEN 技术场景

```
WHEN _tickHeroCombat 中 hero.skillCharge >= chargeTime
THEN hero.skillReady = true
AND EventBus.emit('td:skill_ready', {heroUid, heroName})

WHEN manualCastSkill(heroUid) 且 hero.skillReady === true
THEN 伤害 = heroAtk × skill.multiplier × MANUAL_SKILL_BONUS
AND hero.skillCharge = 0, hero.skillReady = false

WHEN hero.autoReleaseTimer >= AUTO_RELEASE_TIMEOUT
THEN 自动释放，伤害 = heroAtk × skill.multiplier × 1.0（无加成）

WHEN 战斗暂停中
THEN skillCharge 不递增，autoReleaseTimer 不递增

WHEN hero.hp <= 0（撤退）
THEN skillCharge = 0, skillReady = false
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `tower-defense-manager.js` | `_tickHeroCombat` | 修改：蓄力逻辑替代 cooldown |
| `tower-defense-manager.js` | `_heroUseSkill` | 重构为 `_executeHeroSkill` |
| `tower-defense-manager.js` | 新增 `manualCastSkill` / `_calcChargeTime` | 新增 |
| `tower-defense-manager.js` | `_initHeroRuntime` | 修改：初始化新字段 |
| `tower-defense-panel.js` | 新增 `_createSkillBar` / `_updateSkillBar` | 新增 |
| `td-renderer.js` | `drawHero` | 修改：蓄满时头顶脉冲发光 |

#### 数值引用

数值见数值规范 §1（BASE_CHARGE_TIME=10s, MANUAL_SKILL_BONUS=1.5, AUTO_RELEASE_TIMEOUT=5s, MAX_CD_REDUCTION=0.5）。

#### 事件

- 新增 `td:skill_ready` / `td:skill_manual_cast` / `td:skill_auto_cast`

#### 错误/边界处理

- 无敌人在场时蓄满 → autoReleaseTimer 照常计时，自动释放时无目标则延迟
- `heroSkillCdReduction` 钳位到 [0, 0.5]
- 倍速模式：蓄力受 scaledDelta 影响（3× 下 3.33s 蓄满）
- 武将阵亡清零蓄力

---

### CAP-TDE-06: 连杀提示系统

**PRD 来源**：US-C2

#### 实现方案

在 `TowerDefenseManager` 中新增连杀追踪，在 `TDRenderer` 中新增连杀提示渲染。

**新增运行时状态**：
```javascript
_killStreak: { count: 0, lastKillTime: 0, highestThisWave: 0 }
_battle.gameTime: 0   // 累计游戏时间（受速度倍率影响）
```

**修改 `_killEnemy()`**：判断 `gameTime - lastKillTime <= KILL_STREAK.WINDOW` 时递增 count，否则重置为 1。查找当前等级后 emit `td:kill_streak`，应用金币加成。

**`_battle.gameTime`**：在 `_battleTick` 中 `_battle.gameTime += scaledDt`。

**TDRenderer 新增**：
- `_streakDisplay: {text, color, alpha, fontSize, elapsed}`
- `drawKillStreak(ctx, realDt)` — 屏幕中央渲染连杀文字

#### _state 变更

无持久化。`_battle.gameTime` 和 `_killStreak` 为运行时。

#### WHEN/THEN 技术场景

```
WHEN _killEnemy 且 gameTime - lastKillTime <= 4s
THEN killStreak.count++，查找最高匹配等级
AND emit('td:kill_streak', {count, level, text, color, goldBonus})

WHEN 超过 4s 无新击杀
THEN count 重置为 1

WHEN 连杀达到 8
THEN 红色"杀神降临！" + triggerShake(2, 0.2)

WHEN 波次结束
THEN 结算数据含 highestStreak，连杀归零
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `tower-defense-manager.js` | `_killEnemy` | 修改：连杀追踪 |
| `tower-defense-manager.js` | `_battleTick` | 修改：维护 gameTime |
| `tower-defense-manager.js` | 新增 `_getStreakLevel` | 新增 |
| `tower-defense-manager.js` | `_checkBattleEnd` | 修改：结算含连杀 |
| `td-renderer.js` | 新增 `_streakDisplay`, `drawKillStreak` | 新增 |
| `tower-defense-panel.js` | `_renderTDFrame` | 修改：调用 drawKillStreak |

#### 数值引用

数值见数值规范 §6（WINDOW=4s, 5级阈值 2/3/5/8/12, 金币加成 5%-30%）。

#### 事件

- 新增 `td:kill_streak` / `td:kill_streak_reset`

#### 错误/边界处理

- 同一帧多个死亡全部计入连杀
- 连杀 >12 保持"万夫莫敌"
- 3× 倍速下窗口实际 1.33s（游戏时间 4s）
- 连杀提示渲染在屏幕上方 1/3，不遮挡底部技能按钮

---

### CAP-TDE-07: 练习模式

**PRD 来源**：US-B2

#### 实现方案

已通关关卡增加"练习"按钮。练习模式不消耗体力、奖励按比例缩减、不更新进度。

**新增运行时标志**：`_practiceMode: false`

**新增方法**：
- `startPracticeBattle(chapterId, stageNum)` — 设 `_practiceMode = true`，跳过体力

**修改**：
- `startWave()` — `_practiceMode` 时跳过 `consumeStamina()`
- `_calcRewards()` — `_practiceMode` 时乘以 `PRACTICE.REWARD_RATIO`
- `_grantRewards()` — `_practiceMode` 时禁止装备/玉石
- `_checkBattleEnd()` — `_practiceMode` 时不更新 `stageProgress`

#### _state 变更

```javascript
_practiceMode: false   // 运行时，非持久化
```

#### WHEN/THEN 技术场景

```
WHEN 已通关关卡点击"练习"
THEN _practiceMode = true，不检查/扣除体力

WHEN 练习模式通关
THEN goldReward *= PRACTICE.REWARD_RATIO (0.25)
AND 不掉落装备/玉石，不更新进度

WHEN 练习模式结束
THEN _practiceMode = false
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `tower-defense-manager.js` | 新增 `startPracticeBattle` | 新增 |
| `tower-defense-manager.js` | `startWave` / `_calcRewards` / `_grantRewards` / `_checkBattleEnd` | 修改 |
| `tower-defense-panel.js` | `_onStageClick` | 修改：双按钮 |

#### 数值引用

数值见数值规范 §4（REWARD_RATIO=0.25）。

#### 事件

无新增。复用现有 `td:wave_cleared` / `td:wave_failed`。

#### 错误/边界处理

- 未通关关卡无"练习"按钮
- 反复练习无次数限制
- 奖励不递减

---

## 5. Phase 2 能力规范

### CAP-TDE-08: 全局紧急技能

**PRD 来源**：US-A3

#### 实现方案

3 个全局紧急技能，独立于武将。`TowerDefenseManager` 管理冷却和效果。

**新增运行时状态**：
```javascript
_emergencySkills: {
  arrow_rain:    { cooldown: 0 },
  battle_charge: { cooldown: 0 },
  iron_wall:     { cooldown: 0 }
}
_battle.aspdBuff: null | {multiplier: 1.5, remaining: 8}
_battle.wallInvincible: null | {remaining: 5}
```

**新增方法**：
- `useEmergencySkill(skillId)` — 检查冷却后执行
- `_applyArrowRain()` — 全屏伤害 `floor(baseHp(wave) × 0.25)`
- `_applyBattleCharge()` — 全局攻速 ×1.5 持续 8s
- `_applyIronWall()` — 墙体无敌 5s + 城主府回血 15%
- `_tickEmergencyCooldowns(dt)` / `_tickBattleBuffs(dt)` — 在 `_battleTick` 中调用
- `_resetEmergencySkills()` — 进入新关卡时重置

**修改**：
- `_updateTowers()` — 攻速检查 aspdBuff
- `_enemyAttackWall()` — 检查 wallInvincible
- `startWave()` — 首波时重置技能

#### _state 变更

运行时，非持久化。每关重置。

#### WHEN/THEN 技术场景

```
WHEN useEmergencySkill('arrow_rain') 且 cooldown === 0
THEN 全屏敌人各扣 floor(baseHp(wave) × 0.25)
AND cooldown = 75

WHEN 全军冲锋激活
THEN _battle.aspdBuff = {multiplier:1.5, remaining:8}
AND 8s 后 aspdBuff = null

WHEN 进入新关卡
THEN 三个紧急技能 CD 归零
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `tower-defense-manager.js` | 新增 `useEmergencySkill` 及 3 个效果方法 | 新增 |
| `tower-defense-manager.js` | `_battleTick` | 修改：添加冷却/buff tick |
| `tower-defense-manager.js` | `_updateTowers` / `_enemyAttackWall` | 修改 |
| `tower-defense-panel.js` | 新增 `_createEmergencySkillBar` | 新增 |
| `td-renderer.js` | 新增 `drawEmergencyEffect` | 新增 |

#### 数值引用

数值见数值规范 §2（箭雨 hpRatio=0.25 CD=75s，冲锋 ×1.5 持续8s，铁壁 5s+15%回血）。

#### 事件

- 新增 `td:emergency_skill_used` / `td:emergency_skill_ready`

#### 错误/边界处理

- 场上无敌人用箭雨 → 伤害为 0，CD 正常消耗
- 无墙时铜墙铁壁 → 仅城主府回血
- CD 受 scaledDelta 影响；暂停中 CD 暂停

---

### CAP-TDE-09: 战斗中建造/出售松绑

**PRD 来源**：US-A4

#### 实现方案

当前系统已支持战斗中建造/出售，售回率已区分 active(30%)/idle(50%)。主要变更：暂停中禁止操作。

**修改**：
- `canBuildTower()` — `if (_battle.paused) return {ok: false, reason: '暂停中不可操作'}`
- `sellTower()` — 暂停检查
- UI 工具栏暂停时灰显

#### _state 变更

无。

#### WHEN/THEN 技术场景

```
WHEN _battle.phase === 'active' 且建造塔
THEN 正常检查资源位置，新塔立即攻击

WHEN _battle.paused === true 且尝试建造/出售
THEN return { ok: false, reason: '暂停中不可操作' }
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `tower-defense-manager.js` | `canBuildTower` / `sellTower` | 修改：暂停检查 |
| `tower-defense-panel.js` | `_updateToolbar` | 修改：暂停灰显 |

#### 数值引用

沿用现有 SELL_RATE_ACTIVE=0.3, SELL_RATE_IDLE=0.5。

#### 事件

无新增。

#### 错误/边界处理

- 封路检测战斗中仍有效

---

### CAP-TDE-10: 半封路机制

**PRD 来源**：US-D1

#### 实现方案

现有 `canBuildTower()` 封路检测已实现"只要存在至少一条通路即可"的逻辑（第230-254行）。**核心逻辑无需修改**。新增路径预览 UI。

**新增 UI**：
- `TowerDefensePanel._drawPathPreview(ctx)` — 悬停放置时半透明显示预计敌人新路径
- `TDRenderer.drawPathHighlight(ctx, path)` — 路径高亮渲染

#### _state 变更

无。

#### WHEN/THEN 技术场景

```
WHEN 悬停墙体到目标位置
THEN 计算假设放置后的新路径并半透明渲染

WHEN 建造使通路窄为 1 格
THEN canBuildTower 允许
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `tower-defense-panel.js` | 新增 `_drawPathPreview` | 新增 |
| `td-renderer.js` | 新增 `drawPathHighlight` | 新增 |

#### 数值引用

无。

#### 错误/边界处理

- 路径预览频率限制：最多 200ms/次
- 预览不影响实际逻辑

---

### CAP-TDE-11: 专用TD地图

**PRD 来源**：US-D2

#### 实现方案

新增 `js/data/td-maps.js` 存放 5 章独立地图数据。

**数据结构**：
```javascript
var TDMapData = {
  chapter_1: {
    name: '平原村落', width: 20, height: 20,
    spawnPoints: [{x:0, y:10}],
    townHallPos: {x:18, y:10},
    terrain: [/* 0=可建, 1=不可建, 2=路面, 3=水域 */],
    strategicPoints: [{x:5,y:10}, ...]
  },
  // chapter_2 ~ chapter_5 ...
};
```

**修改**：
- `enterDefenseMode(chapterId)` — 加载对应地图
- `_getSpawnPoints()` — 从 TDMapData 获取固定出生点
- `_getTownHallGridPos()` — 从 TDMapData 获取
- `_getCollisionGrid()` — 基于 terrain 构建碰撞矩阵

#### _state 变更

无持久化。进入时设置当前地图。

#### WHEN/THEN 技术场景

```
WHEN enterDefenseMode('chapter_2')
THEN 加载 TDMapData.chapter_2
AND 出生点使用地图预设（不再随机四边）

WHEN 尝试在水域建造
THEN canBuildTower 返回 '此地形不可建造'
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| 新增 `js/data/td-maps.js` | — | 新增 |
| `index.html` | — | 添加 script 标签 |
| `tower-defense-manager.js` | `enterDefenseMode` / `_getSpawnPoints` / `_getTownHallGridPos` / `_getCollisionGrid` | 修改 |
| `tower-defense-panel.js` | `_drawGrid` | 修改：地形纹理 |

#### 数值引用

无数值依赖。

#### 错误/边界处理

- 无对应 TDMapData → 回退城镇地图

---

### CAP-TDE-12: 战略要地高亮

**PRD 来源**：US-D3

#### 实现方案

从 `TDMapData.strategicPoints` 读取推荐位置，Canvas 上渲染半透明高亮。

**新增**：`TDRenderer.drawStrategicPoints(ctx, points, builtPositions)`

#### _state 变更

```javascript
_state.showStrategicPoints: true  // 持久化，可关闭
```

#### WHEN/THEN 技术场景

```
WHEN 进入防守模式且 showStrategicPoints === true
THEN 战略要地半透明金色脉冲高亮

WHEN 在高亮格子建塔
THEN 高亮消失
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `td-renderer.js` | 新增 `drawStrategicPoints` | 新增 |
| `tower-defense-panel.js` | `_renderTDFrame` | 修改 |

#### 数值引用

无。

#### 错误/边界处理

- 无 strategicPoints 数据时不渲染
- 高亮仅建议，不限制建造位置

---

## 6. Phase 3 能力规范

### CAP-TDE-13: 塔进化系统

**PRD 来源**：US-E1

#### 实现方案

Lv5 塔消耗资源进化为 2 条分支之一，不可逆。新增 `TDEvolutionData` 表。

**新增方法**：
- `canEvolveTower(towerUid, path)` — 检查 Lv5 + 未进化 + 资源
- `evolveTower(towerUid, path)` — 扣资源，记录进化
- `getEvolutionOptions(towerUid)` — 返回两条路线预览

**修改**：
- `getTowerStats()` — 进化塔使用 TDEvolutionData 属性
- `sellTower()` — 返还含进化费用
- `getState()` / `init()` — evolutions 字段

#### _state 变更

```javascript
_state.evolutions: {}  // { towerUid: 'pathA'|'pathB' }，持久化
```

#### WHEN/THEN 技术场景

```
WHEN getTowerStats 且 evolutions[uid] === 'pathA'
THEN 使用 TDEvolutionData[type].pathA 属性

WHEN evolveTower(uid, 'pathA')
THEN 检查 level===5 且未进化
AND 扣费，_state.evolutions[uid] = 'pathA'

WHEN 出售进化塔
THEN 返还 = (升级累计费 + 进化费) × 售回率

WHEN 已进化塔再次进化
THEN 返回 {ok: false, reason: '已进化'}
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `td-data.js` | 新增 `TDEvolutionData` | 新增 |
| `tower-defense-manager.js` | 新增 `canEvolveTower` / `evolveTower` / `getEvolutionOptions` | 新增 |
| `tower-defense-manager.js` | `getTowerStats` / `sellTower` / `getState` / `init` | 修改 |
| `tower-defense-panel.js` | `_showTowerInfo` / 新增 `_showEvolutionPanel` | 修改/新增 |
| `td-renderer.js` | `drawTower` | 修改：进化外观 |

#### 数值引用

数值见数值规范 §7（12 种进化属性、费用 = 基础费 ×5.0）。

#### 事件

- 新增 `td:tower_evolved`

#### 错误/边界处理

- 仅 6 种攻击/支援塔可进化（墙体/陷阱不可）
- 旧存档无 evolutions → 初始化 `{}`

---

### CAP-TDE-14: 武将羁绊系统

**PRD 来源**：US-E2

#### 实现方案

新增 `TDBondData` 表。部署/撤退/阵亡时检测羁绊，将加成应用到战斗计算。

**新增**：
- `_activeBonds: []` — 当前激活的羁绊 ID
- `_checkBonds()` — 遍历 TDBondData 检测
- `getBondStatus()` — UI 显示用

**修改**：
- `deployHero()` / `removeHero()` — 部署变更后 `_checkBonds()`
- `_heroTakeDamage()` — 阵亡后 `_checkBonds()`
- `getTowerStats()` — 羁绊塔 ATK 加成
- `_calcChargeTime()` — 羁绊 CD 缩减

**叠加关系**：`最终属性 = 基础 × 等级加成 × 羁绊加成`（乘法叠加）

#### _state 变更

运行时，非持久化。每次进入防守模式重新检测。

#### WHEN/THEN 技术场景

```
WHEN 部署刘备+关羽+张飞且三人均存活
THEN _activeBonds 添加 'taoyuan'
AND emit('td:bond_activated', {bondId:'taoyuan', ...})

WHEN 张飞撤退
THEN _activeBonds 移除 'taoyuan'
AND emit('td:bond_deactivated')

WHEN 卧龙凤雏激活且有 Lv5 箭塔(ATK=40)
THEN 箭塔实际 ATK = 40 × 1.10 = 44
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `td-data.js` | 新增 `TDBondData` | 新增 |
| `tower-defense-manager.js` | 新增 `_checkBonds` / `getBondStatus` | 新增 |
| `tower-defense-manager.js` | `deployHero` / `removeHero` / `_heroTakeDamage` | 修改 |
| `tower-defense-manager.js` | `getTowerStats` / `_calcChargeTime` | 修改 |
| `tower-defense-panel.js` | `_showHeroPanel` / 新增 `_showBondInfo` | 修改/新增 |

#### 数值引用

数值见数值规范 §8（5 种羁绊数值、激活条件、叠加关系）。

#### 事件

- 新增 `td:bond_activated` / `td:bond_deactivated`

#### 错误/边界处理

- MAX_ASSIGNED_HEROES=3，最多激活 1 个羁绊
- 自动防守（离线）羁绊默认激活
- 多羁绊同时满足 → 全部生效

---

### CAP-TDE-15: Boss专属机制

**PRD 来源**：US-E3

#### 实现方案

新增 `TDBossSkillData` 表。在 `_tickEnemies()` 中为 Boss 增加专属 AI。

**新增方法**：
- `_tickBossAI(enemy, dt)` — 总调度器
- `_bossSkill_summon(enemy, dt)` — 张角：每 15s 召唤 2 个黄巾兵（上限 6）
- `_bossSkill_charge(enemy, dt)` — 吕布：每 20s 直线冲锋 3 格，穿第 1 道墙
- `_bossSkill_aura(enemy, dt)` — 曹操：持续光环 ATK+40% Speed+20%
- `_bossSkill_slash(enemy, dt)` — 关羽：每 12s 前方 120° 扇形斩击建筑
- `_bossSkill_clone(enemy, dt)` — 司马懿：每 30s 产生 2 个分身

**Boss 敌人扩展字段**：
```javascript
enemy.bossSkill = {
  type: 'summon'|'charge'|'aura'|'slash'|'clone',
  timer: 0,
  config: { ... },
  clones: [],          // 司马懿分身引用
  isClone: false,
  originalUid: null
};
```

**修改**：
- `_spawnSingleEnemy()` — Boss 初始化技能配置
- `_tickEnemies()` — 调用 `_tickBossAI()`
- `_killEnemy()` — 司马懿本体死亡清分身

#### _state 变更

运行时，非持久化。

#### WHEN/THEN 技术场景

```
WHEN 张角 timer >= 15s 且存活召唤物 < 6
THEN 生成 2 个 td_militia (HP=baseHp×0.5)

WHEN 吕布 timer >= 20s
THEN 冲锋前方 3 格，对建筑造成 bossAtk×3
AND 自身眩晕 2s

WHEN 曹操存活
THEN 3 格内敌人 ATK+40% Speed+20%
WHEN 曹操被杀
THEN 所有 buff 立即消失

WHEN 击杀司马懿本体
THEN 所有分身消散，Boss 战结束
WHEN 有烽火台/天眼台覆盖
THEN 本体头顶显示标记
```

#### 涉及文件和函数

| 文件 | 函数 | 操作 |
|------|------|------|
| `td-data.js` | 新增 `TDBossSkillData` | 新增 |
| `tower-defense-manager.js` | 新增 `_tickBossAI` 及 5 个子方法 | 新增 |
| `tower-defense-manager.js` | `_spawnSingleEnemy` / `_tickEnemies` / `_killEnemy` | 修改 |
| `td-renderer.js` | `drawEnemy` / 新增 `drawBossSkillWarning` | 修改/新增 |

#### 数值引用

数值见数值规范 §9（5 个 Boss 属性倍率、技能数值完整表）。

#### 事件

- 新增 `td:boss_skill_warning`
- 复用 `td:screen_shake`

#### 错误/边界处理

- 张角召唤上限 6 → 超限跳过
- 吕布冲锋无建筑 → 0 伤害
- 曹操光环范围外不受 buff
- 关羽斩击范围内无建筑 → 动画播放 0 伤害
- 分身不会再分身
- Boss 技能受 scaledDelta 影响；暂停中暂停

---

## 7. 事件协议表

### 7.1 新增事件完整列表

| 事件名称 | 载荷格式 | 生产者 | 消费者 | Phase |
|---------|---------|--------|--------|-------|
| `td:speed_changed` | `{speed: number, index: number}` | TDManager.cycleSpeed | TDPanel, TDRenderer | 1 |
| `td:paused` | `{}` | TDManager.pauseBattle | TDPanel, TDRenderer | 1 |
| `td:resumed` | `{speed: number}` | TDManager.resumeBattle | TDPanel, TDRenderer | 1 |
| `td:stamina_changed` | `{current: number, max: number, nextRecoverAt: timestamp}` | TDManager._recoverStamina | TDPanel | 1 |
| `td:damage_dealt` | `{targetUid, damage, x, y, type, sourceUid, isCrit}` | TDManager._towerAttack / _executeHeroSkill | TDRenderer | 1 |
| `td:enemy_death_effect` | `{uid, x, y, type, isBoss}` | TDManager._killEnemy | TDRenderer | 1 |
| `td:screen_shake` | `{intensity, duration}` | TDManager._killEnemy (Boss) | TDRenderer | 1 |
| `td:skill_ready` | `{heroUid, heroName}` | TDManager._tickHeroCombat | TDPanel | 1 |
| `td:skill_manual_cast` | `{heroUid, damage, bonus}` | TDManager.manualCastSkill | TDPanel, TDRenderer | 1 |
| `td:skill_auto_cast` | `{heroUid, damage}` | TDManager._tickHeroCombat | TDPanel | 1 |
| `td:kill_streak` | `{count, level, text, color, goldBonus}` | TDManager._killEnemy | TDRenderer | 1 |
| `td:kill_streak_reset` | `{}` | TDManager._checkBattleEnd | TDRenderer | 1 |
| `td:emergency_skill_used` | `{skillId, skillName}` | TDManager.useEmergencySkill | TDPanel, TDRenderer | 2 |
| `td:emergency_skill_ready` | `{skillId}` | TDManager._tickEmergencyCooldowns | TDPanel | 2 |
| `td:tower_evolved` | `{towerUid, evolutionId, path}` | TDManager.evolveTower | TDPanel, TDRenderer | 3 |
| `td:bond_activated` | `{bondId, bondName, effects}` | TDManager._checkBonds | TDPanel | 3 |
| `td:bond_deactivated` | `{bondId, bondName}` | TDManager._checkBonds | TDPanel | 3 |
| `td:boss_skill_warning` | `{bossUid, skillType, delay}` | TDManager._tickBossAI | TDRenderer | 3 |

### 7.2 修改的现有事件

| 事件 | 变更 |
|------|------|
| `td:wave_cleared` | 载荷新增 `highestStreak` 和 `practiceMode` 字段 |
| `td:wave_failed` | 载荷新增 `practiceMode` 字段 |
| `td:enemy_killed` | 载荷新增 `goldBonus`（连杀加成）字段 |

---

## 8. 存档格式扩展

### 8.1 新增字段

```javascript
// TowerDefenseManager.getState() 返回值扩展
{
  // === 现有字段（不变） ===
  unlocked: true,
  towers: [...],
  wave: { current, highest, townHallHp, townHallMaxHp },
  assignedHeroes: [...],
  heroDeployments: [...],
  stats: { totalWavesCleared, totalKills, totalGoldEarned },
  tutorialSeen: true,
  chapter: { current, highestCleared },
  stageProgress: {...},

  // === Phase 1 新增 ===
  stamina: {
    current: 12,                    // number, [0, STAMINA.MAX]
    lastRecoverTime: 1713100000000  // timestamp (ms)
  },
  showStrategicPoints: true,        // boolean

  // === Phase 3 新增 ===
  evolutions: {                     // { towerUid: 'pathA' | 'pathB' }
    'abc123': 'pathA'
  }

  // === 废弃 ===
  // dailyChallenges: { date, used }  — 不再使用
}
```

### 8.2 旧存档迁移

在 `init(saved)` 中处理：

```javascript
init: function(saved) {
  var data = (saved && saved.towerDefense) ? saved.towerDefense : null;
  // ... existing init logic ...

  // Phase 1 迁移：体力系统
  if (!this._state.stamina) {
    this._state.stamina = {
      current: TD_CONSTANTS.STAMINA.MAX,
      lastRecoverTime: Date.now()
    };
  }
  // 离线补偿
  if (this._state.stamina.current < TD_CONSTANTS.STAMINA.MAX) {
    var offlineMs = Date.now() - this._state.stamina.lastRecoverTime;
    var offlineMin = offlineMs / 60000;
    var recovered = Math.min(
      TD_CONSTANTS.STAMINA.MAX - this._state.stamina.current,
      Math.floor(offlineMin / TD_CONSTANTS.STAMINA.RECOVER_INTERVAL)
    );
    this._state.stamina.current += recovered;
    this._state.stamina.lastRecoverTime = Date.now();
  }

  // Phase 3 迁移：进化
  if (!this._state.evolutions) {
    this._state.evolutions = {};
  }

  // Phase 2 迁移：战略要地
  if (typeof this._state.showStrategicPoints === 'undefined') {
    this._state.showStrategicPoints = true;
  }
}
```

### 8.3 迁移规则

| 场景 | 处理 |
|------|------|
| 无 `stamina` 字段 | 初始化 `{current: 12, lastRecoverTime: now}` |
| 有 `dailyChallenges` | 忽略，不再读取 |
| 无 `evolutions` | 初始化 `{}`，已有 Lv5 塔保持未进化 |
| 无 `showStrategicPoints` | 初始化 `true` |

---

## 9. 与现有系统集成点

### 9.1 需要修改的现有函数

| 文件 | 函数 | 修改内容 | Phase |
|------|------|---------|-------|
| `tower-defense-manager.js` | `init()` | 体力迁移、进化迁移 | 1,3 |
| `tower-defense-manager.js` | `getState()` | 包含 stamina、evolutions | 1,3 |
| `tower-defense-manager.js` | `_battleTick()` | dt 缩放、暂停、gameTime、emergency tick、buff tick | 1,2 |
| `tower-defense-manager.js` | `_tickHeroCombat()` | 蓄力替代 cooldown | 1 |
| `tower-defense-manager.js` | `_heroUseSkill()` | 重构为 _executeHeroSkill | 1 |
| `tower-defense-manager.js` | `_killEnemy()` | dying 状态、连杀、粒子、震屏 | 1 |
| `tower-defense-manager.js` | `_tickEnemies()` | dying 清理、Boss AI | 1,3 |
| `tower-defense-manager.js` | `_towerAttack()` | emit damage_dealt、aspdBuff | 1,2 |
| `tower-defense-manager.js` | `_updateTowers()` | aspdBuff 攻速、羁绊 ATK | 2,3 |
| `tower-defense-manager.js` | `_enemyAttackWall()` | wallInvincible | 2 |
| `tower-defense-manager.js` | `_handleSplash()` | emit damage_dealt | 1 |
| `tower-defense-manager.js` | `getTowerStats()` | 进化属性、羁绊加成 | 3 |
| `tower-defense-manager.js` | `sellTower()` | 进化费用返还、暂停检查 | 1,3 |
| `tower-defense-manager.js` | `canBuildTower()` | 暂停检查 | 1 |
| `tower-defense-manager.js` | `startWave()` | 体力检查、紧急技能重置 | 1,2 |
| `tower-defense-manager.js` | `enterDefenseMode()` | 速度重置、地图加载 | 1,2 |
| `tower-defense-manager.js` | `onTick()` | 体力恢复 | 1 |
| `tower-defense-manager.js` | `_defaultBattle()` | gameTime、paused、aspdBuff、wallInvincible | 1,2 |
| `tower-defense-manager.js` | `_spawnSingleEnemy()` | Boss 技能初始化 | 3 |
| `tower-defense-manager.js` | `_initHeroRuntime()` | 蓄力字段 | 1 |
| `tower-defense-manager.js` | `deployHero()` / `removeHero()` | 羁绊检测 | 3 |
| `tower-defense-manager.js` | `_heroTakeDamage()` | 阵亡后羁绊检测 | 3 |
| `tower-defense-manager.js` | `_checkBattleEnd()` | 连杀结算、练习模式 | 1 |
| `tower-defense-manager.js` | `_calcRewards()` | 练习 REWARD_RATIO | 1 |
| `tower-defense-manager.js` | `_grantRewards()` | 练习禁装备/玉石 | 1 |
| `tower-defense-manager.js` | `_getSpawnPoints()` | TDMapData 固定出生点 | 2 |
| `tower-defense-manager.js` | `_getCollisionGrid()` | TDMapData terrain | 2 |
| `tower-defense-panel.js` | `_createStatusBar()` | 体力、速度/暂停按钮 | 1 |
| `tower-defense-panel.js` | `_renderTDFrame()` | 飘字、粒子、震屏、连杀、路径预览 | 1,2 |
| `tower-defense-panel.js` | `_onStageClick()` | 练习双按钮 | 1 |
| `tower-defense-panel.js` | `_showTowerInfo()` | 进化按钮 | 3 |
| `tower-defense-panel.js` | `_showHeroPanel()` | 羁绊提示 | 3 |
| `tower-defense-panel.js` | `_drawGrid()` | 地形纹理 | 2 |
| `td-renderer.js` | `drawEnemy()` | dying 动画、Boss 标记 | 1,3 |
| `td-renderer.js` | `drawTower()` | 进化外观 | 3 |
| `td-renderer.js` | `drawHero()` | 蓄满脉冲 | 1 |
| `main.js` | `getFullState()` | 确认新字段 | 1 |

---

## 10. 风险与开放问题

### 10.1 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| **飘字+粒子+震屏同屏性能** | 低端设备帧率下降 | 对象池复用（飘字 15、粒子 30 上限），Canvas 无 DOM 开销 |
| **A\* 路径预览计算频率** | 拖拽放置时频繁计算 | 节流 200ms/次 |
| **Boss AI 复杂度** | 5 种不同技能逻辑 | 独立函数 + 统一调度器 |
| **多系统叠加（buff/羁绊/进化）** | 属性计算链长、浮点精度 | 固定顺序：base → upgrade → evolution → hero → bond → buff |
| **_battleTick dt 缩放** | 可能影响物理/寻路稳定性 | 钳位 MAX_SCALED_DELTA=0.1；所有子 tick 已用 dt 参数 |

### 10.2 开放问题

| # | 问题 | 建议 |
|---|------|------|
| 1 | 5 章 TD 地图的 terrain 数据由谁设计？ | 使用 `map-assembler` 生成 JSON + `map-qa` 验证 |
| 2 | 进化塔 Canvas 外观如何区分？ | 路线 A 蓝色光晕，路线 B 红色光晕 |
| 3 | Boss 预告 1.5s 在 3× 下仅 0.5s 够不够？ | 建议预告时强制降速至 1× 或声效提示 |
| 4 | 体力系统与自动防守交互 | 自动防守不消耗体力（已定义），需明确是否推进"当前关卡"进度 |
| 5 | 练习模式入口条件 | 仅 stars ≥ 1 的关卡显示"练习"按钮 |
| 6 | 连杀金币加成在练习模式中是否生效 | 建议生效但受 REWARD_RATIO 缩减 |
