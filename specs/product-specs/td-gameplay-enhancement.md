# 产品规范：塔防体验全面升级（TD Gameplay Enhancement）

| 属性 | 值 |
|------|-----|
| **状态** | Draft |
| **版本** | 0.1.0 |
| **作者** | spec-architect |
| **创建日期** | 2026-04-14 |
| **更新日期** | 2026-04-14 |
| **关联PRD** | [specs/game-prds/td-gameplay-enhancement.md](../game-prds/td-gameplay-enhancement.md)（Draft v0.1.0） |
| **数值规范** | [specs/numerical/td-gameplay-enhancement.md](../numerical/td-gameplay-enhancement.md)（Draft v0.1.0） |
| **基线规范** | [specs/product-specs/tower-defense-system.md](./tower-defense-system.md)（Active v0.3.0） |
| **架构约束** | [.github/copilot-instructions.md](../../.github/copilot-instructions.md) |
| **父级规范** | [specs/product-specs/tower-defense-system.md](./tower-defense-system.md) |

---

## 1. 概述

本规范定义塔防系统的体验全面升级，覆盖 15 项能力（CAP-TDE-01 ~ CAP-TDE-15），分 3 个 Phase 交付。目标是将塔防从"观看模拟器"转变为"可参与、有策略、有反馈"的核心玩法。

**设计原则**：
1. Idle 为基，手操为奖 — 自动仍是基础，手动操作提供显著加成而非必须
2. 不改架构 — 全局变量 + `<script>` 加载 + EventBus 通信 + Canvas 2D 渲染
3. 数值不在本规范中定义 — 所有具体数值引用 [数值规范](../numerical/td-gameplay-enhancement.md)

**CAP 编号规则**：`CAP-TDE-{序号}`，其中 TDE = Tower Defense Enhancement。

---

## 2. 术语表

| 术语 | 定义 |
|------|------|
| **技能蓄力（Skill Charge）** | 武将技能能量从 0 累积到满的过程，蓄满后可释放技能 |
| **手动释放（Manual Cast）** | 玩家主动点击按钮释放已蓄满的武将技能，获得额外伤害加成 |
| **自动释放（Auto Release）** | 蓄满后超过等待时间未手动释放，系统自动释放技能（无额外加成） |
| **紧急技能（Emergency Skill）** | 不依赖特定武将的全局战场技能，有较长 CD，用于关键时刻翻盘 |
| **体力（Stamina）** | 替代每日次数限制的可恢复资源，每次挑战关卡消耗体力 |
| **练习模式（Practice Mode）** | 对已通关关卡免费重刷的模式，奖励大幅减少 |
| **飘字（Damage Text）** | 攻击命中时在敌人头顶浮现的伤害数字 |
| **连杀（Kill Streak）** | 在时间窗口内连续击杀敌人的计数，触发分级提示和金币加成 |
| **进化（Evolution）** | Lv5 满级塔消耗额外资源选择的不可逆分支升级 |
| **羁绊（Bond）** | 特定武将组合同时部署时激活的被动增益效果 |
| **Boss 专属机制（Boss Mechanic）** | 每章 Boss 独有的战斗技能，需要针对性策略应对 |
| **deltaTime 缩放（deltaTime Scaling）** | 通过乘以速度倍率改变游戏逻辑时钟，实现加速/减速 |
| **半封路（Partial Blocking）** | 允许玩家用墙体引导敌人走曲折路线，只要保留至少一条通路 |
| **战略要地（Strategic Spot）** | 地图上预标记的推荐塔位，因地形优势特别适合防御 |

---

## 3. 模块定义

### 3.1 修改的模块

| 模块 | 文件 | 变更范围 |
|------|------|---------|
| **TowerDefenseManager** | `js/modules/tower-defense-manager.js` | 新增体力管理、技能蓄力、紧急技能、连杀追踪、进化逻辑、羁绊检测、Boss AI、速度控制、练习模式 |
| **TDRenderer** | `js/ui/td-renderer.js` | 新增飘字渲染层、粒子系统、震屏效果、连杀提示渲染、技能特效、蓄力条、战略要地高亮 |
| **TowerDefensePanel** | `js/ui/tower-defense-panel.js` | 新增技能按钮栏、速度控制 UI、体力显示、紧急技能栏、进化面板、羁绊面板 |
| **Pathfinding** | `js/core/pathfinding.js` | 放宽封路检测为半封路判定 |

### 3.2 新增的数据表

| 数据表 | 位置 | 内容 |
|--------|------|------|
| **TDEvolutionData** | `js/data/td-data.js` | 6 种塔 × 2 条进化路线的属性和费用 |
| **TDBondData** | `js/data/td-data.js` | 5 组武将羁绊的成员、所需人数和效果 |
| **TDBossSkillData** | `js/data/td-data.js` | 5 章 Boss 的专属技能参数 |
| **TDMapData** | `js/data/td-data.js` | 5 章专用 TD 地图的网格、出生点和战略要地 |

### 3.3 能力清单

| CAP ID | 能力名称 | Phase | 涉及模块 |
|--------|---------|-------|---------|
| CAP-TDE-01 | 战斗速度控制 | 1 | Manager, Panel, Renderer |
| CAP-TDE-02 | 体力系统 | 1 | Manager, Panel |
| CAP-TDE-03 | 飘字伤害系统 | 1 | Manager, Renderer |
| CAP-TDE-04 | 击杀视觉反馈 | 1 | Manager, Renderer |
| CAP-TDE-05 | 武将技能手动释放 | 1 | Manager, Panel, Renderer |
| CAP-TDE-06 | 连杀提示系统 | 1 | Manager, Panel, Renderer |
| CAP-TDE-07 | 练习模式 | 1 | Manager, Panel |
| CAP-TDE-08 | 全局紧急技能 | 2 | Manager, Panel, Renderer |
| CAP-TDE-09 | 战斗中建造/出售松绑 | 2 | Manager, Panel |
| CAP-TDE-10 | 半封路机制 | 2 | Manager, Pathfinding |
| CAP-TDE-11 | 专用 TD 地图 | 2 | Manager, Renderer, td-data |
| CAP-TDE-12 | 战略要地高亮 | 2 | Renderer, Panel |
| CAP-TDE-13 | 塔进化系统 | 3 | Manager, Panel, Renderer, td-data |
| CAP-TDE-14 | 武将羁绊系统 | 3 | Manager, Panel, td-data |
| CAP-TDE-15 | Boss 专属机制 | 3 | Manager, Renderer, td-data |

---

## 4. Phase 1 能力规范 — 立竿见影

### CAP-TDE-01：战斗速度控制

**前置条件**：城防系统已解锁（CAP-TD-01），玩家进入防守模式，有活跃波次。

**概述**：通过 deltaTime 缩放因子实现 1×/2×/3× 三档战斗速度切换。

**状态变更**：
- `_state.battleSpeed` — `number`，当前速度索引（0=1×, 1=2×, 2=3×）
- `_runtimeState.speedMultiplier` — `number`，当前缩放因子（1.0 / 2.0 / 3.0），不持久化

**WHEN/THEN 场景**：

```
WHEN 玩家进入防守模式且有活跃波次
THEN 战斗界面右上角显示速度切换按钮，显示当前倍速文本"1×"
AND _runtimeState.speedMultiplier = 1.0

WHEN 玩家点击速度按钮，当前倍速为 1×
THEN 切换到 2×，按钮文本更新为"2×"
AND _runtimeState.speedMultiplier = 2.0
AND emit('td:speed_changed', { speed: 2.0 })
AND 所有敌人移动、塔攻击间隔、技能蓄力等逻辑以 2 倍速运行

WHEN 玩家点击速度按钮，当前倍速为 3×
THEN 循环回 1×
AND _runtimeState.speedMultiplier = 1.0
AND emit('td:speed_changed', { speed: 1.0 })

WHEN 玩家点击暂停按钮
THEN _runtimeState.paused = true
AND 战场所有逻辑时钟停止（敌人不动、塔不攻击、蓄力不进行）
AND UI 显示半透明暂停遮罩

WHEN 战斗暂停中
THEN 玩家可查看塔信息、查看武将信息
AND 不可建造/出售塔（防止暂停规划零成本策略）

WHEN 暂停状态下玩家点击继续
THEN _runtimeState.paused = false
AND 以暂停前的 speedMultiplier 恢复运行

WHEN 退出防守模式后重新进入
THEN 速度重置为 1×

WHEN 帧率骤降导致 deltaTime > 0.1s 且 speedMultiplier = 3
THEN scaledDelta = min(deltaTime × speedMultiplier, 0.1)（钳位保护）
```

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:speed_changed` | `{ speed: number }` | 速度切换时通知 UI |

**数值引用**：[数值规范 §10](../numerical/td-gameplay-enhancement.md#10-速度倍率us-a2)

**deltaTime 缩放影响范围**：

| 受影响（乘 speedMultiplier） | 不受影响 |
|-----|------|
| 敌人移动速度 | UI 动画（按钮、面板过渡） |
| 塔攻击间隔 | 飘字浮动动画（保持可读性） |
| 技能蓄力计时 | 玩家输入响应 |
| 紧急技能冷却 | 暂停/恢复逻辑 |
| 波次准备倒计时 | — |
| Boss 技能间隔 | — |
| 灼烧/减速持续时间 | — |
| 连杀时间窗口 | — |

**错误处理**：
- speedMultiplier 非法值 → 钳位到 `[1.0, 3.0]`
- 无活跃波次时速度按钮隐藏

---

### CAP-TDE-02：体力系统

**前置条件**：城防系统已解锁（CAP-TD-01）。

**概述**：将 `DAILY_CHALLENGE_LIMIT: 3` 替换为可恢复的体力系统。体力按时间自动恢复（含离线补偿），每次手动挑战消耗体力。

**状态变更**：
- `_state.stamina.current` — `number`，当前体力值
- `_state.stamina.lastRecoverTime` — `number`，上次恢复计算的时间戳（ms）

**WHEN/THEN 场景**：

```
WHEN 玩家进入城防界面
THEN 顶部显示当前体力值 / 上限（如 "⚡ 8/12"）
AND 若体力 < 上限，显示下次恢复倒计时

WHEN 玩家点击"开始波次"且 _state.stamina.current >= STAMINA.COST_NORMAL
THEN _state.stamina.current -= STAMINA.COST_NORMAL
AND emit('td:stamina_changed', { current: newValue, max: STAMINA.MAX })
AND 正常开始战斗

WHEN 玩家点击"开始波次"但 _state.stamina.current < STAMINA.COST_NORMAL
THEN 弹出 Toast(type: 'warning', message: '体力不足，N分钟后恢复1点')
AND "开始波次"按钮灰显

WHEN game:tick 触发且 _state.stamina.current < STAMINA.MAX
AND Date.now() - _state.stamina.lastRecoverTime >= STAMINA.RECOVER_INTERVAL × 60000
THEN _state.stamina.current += STAMINA.RECOVER_AMOUNT
AND _state.stamina.lastRecoverTime = Date.now()
AND emit('td:stamina_changed', { current: newValue, max: STAMINA.MAX })

WHEN 体力已满（current == MAX）
THEN 恢复计时器暂停（不浪费），显示"体力已满"

WHEN 玩家离线后上线
THEN offlineMinutes = (Date.now() - lastSaveTimestamp) / 60000
AND offlineRecovery = min(STAMINA.MAX - current, floor(offlineMinutes / STAMINA.RECOVER_INTERVAL))
AND _state.stamina.current += offlineRecovery

WHEN 战斗失败
THEN 已消耗的 1 点体力不退还

WHEN 自动防守（离线/后台挂机）
THEN 不消耗体力（仅手动挑战消耗）

WHEN 加载旧存档（无 stamina 字段）
THEN 初始化 stamina.current = STAMINA.MAX
AND stamina.lastRecoverTime = Date.now()
AND 废弃旧 DAILY_CHALLENGE_LIMIT 相关字段
```

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:stamina_changed` | `{ current: number, max: number }` | 体力值变化时通知 UI |

**数值引用**：[数值规范 §3](../numerical/td-gameplay-enhancement.md#3-体力系统us-b1)

**错误处理**：
- `stamina.current` 钳位到 `[0, STAMINA.MAX]`
- `lastRecoverTime` 为未来时间 → 重置为 `Date.now()`

---

### CAP-TDE-03：飘字伤害系统

**前置条件**：战斗进行中，有敌人被攻击命中。

**概述**：攻击命中时在敌人头顶浮现伤害数字，向上浮动后淡出。高攻速塔的连续命中进行合并。同屏飘字有上限。

**状态变更**：
- `_runtimeState.damageTexts[]` — 飘字对象池，不持久化
- 每个飘字对象：`{ x, y, value, color, fontSize, alpha, elapsed, towerUid, enemyUid }`

**WHEN/THEN 场景**：

```
WHEN 塔攻击命中敌人，造成 N 点伤害
THEN 在敌人当前位置上方创建白色飘字 "N"
AND 飘字向上浮动 DAMAGE_TEXT.FLOAT_DISTANCE 像素
AND 水平随机偏移 ±DAMAGE_TEXT.RANDOM_OFFSET_X 像素
AND 经过 DAMAGE_TEXT.DURATION 秒后完全淡出并回收

WHEN 武将技能命中敌人
THEN 飘字颜色为橙色（#FF8C00），字号比普通飘字大 4px

WHEN 手动释放技能命中敌人
THEN 飘字颜色为金色（#FFD700），字号比普通飘字大 8px，附加发光效果

WHEN 同一 towerUid 对同一 enemyUid 在 MERGE_WINDOW 内再次命中
THEN 累加伤害到当前存活飘字的 value
AND 更新飘字文本为累加值
AND 重置淡出计时器
AND 不创建新飘字

WHEN 同屏飘字数量 >= DAMAGE_TEXT.MAX_ONSCREEN
THEN 新飘字复用最早创建（elapsed 最大）的飘字对象
AND 被复用飘字立即消失

WHEN 投石车（AS=0.25）命中 1 个目标
THEN 显示单独飘字，攻击间隔 4s 远大于合并窗口，不触发合并

WHEN 50 个实体同屏且飘字频繁触发
THEN 帧率不低于 30FPS（通过 MAX_ONSCREEN=15 保障）
```

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:damage_dealt` | `{ towerUid, enemyUid, damage, type, x, y }` | 命中事件，Renderer 监听创建飘字 |

其中 `type` 枚举：`'normal'` / `'skill'` / `'manual_skill'` / `'emergency'`

**数值引用**：[数值规范 §5](../numerical/td-gameplay-enhancement.md#5-飘字合并us-c1)

**错误处理**：
- 飘字池已满时安静复用，不报错
- 负伤害值（治疗） → 不创建飘字

---

### CAP-TDE-04：击杀视觉反馈

**前置条件**：敌人 HP 归零。

**概述**：三个子系统——死亡动画、金币飞出粒子、Boss 震屏。

**状态变更**：
- `_runtimeState.particles[]` — 粒子对象池，不持久化
- `_runtimeState.screenShake` — `{ intensity, duration, elapsed }` 或 `null`，不持久化

**WHEN/THEN 场景**：

```
WHEN 普通敌人 HP 归零
THEN 敌人 status 设为 'dying'
AND 播放约 0.5s 死亡动画（闪烁 + 缩小至消散）
AND 动画结束后从战场实体列表移除

WHEN 敌人被击杀（status 从 'dying' 开始时）
THEN 从敌人位置生成 2-4 个金色圆形粒子（半径 3px）
AND 粒子沿弧线轨迹飞向屏幕顶部金币显示区域
AND 粒子到达目标后消失
AND 触发金币计数器的脉冲动画

WHEN Boss 敌人 HP 归零
THEN _runtimeState.screenShake = { intensity: 3, duration: 0.3, elapsed: 0 }
AND Canvas 每帧偏移 ±intensity 像素（随机方向），持续 duration 秒
AND 叠加短暂白色全屏闪光（alpha: 0.5 → 0，持续 0.2s）

WHEN 攻城器械（td_siege_ram / td_battering_ram）被摧毁
THEN 播放较大的破碎动画（比普通死亡更夸张的粒子数量和范围）

WHEN 大量敌人同时死亡导致粒子总数超过上限
THEN 复用最早创建的粒子（粒子池上限 = 30）
```

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| on | `td:enemy_killed` | `{ enemyUid, enemyType, isBoss, x, y, killerTowerUid }` | 监听现有击杀事件，载荷扩展 |

**数值引用**：无专门数值节——动画参数为渲染层实现细节。

**错误处理**：
- 粒子目标元素不可见（金币计数器被遮挡） → 粒子飞向屏幕上方后消失
- screenShake 重叠触发 → 取最大 intensity

---

### CAP-TDE-05：武将技能手动释放

**前置条件**：战斗进行中，至少有 1 名武将已部署。

**概述**：武将技能从"全自动释放"改为"蓄力→手动释放"模式。手动释放获得额外伤害加成，超时未操作则自动释放（无加成）。

**状态变更**：
- `_runtimeState.heroSkills[heroUid]` — 每个已部署武将的技能状态，不持久化：
  ```javascript
  {
    chargeProgress: 0,       // 当前蓄力进度（秒）
    chargeTime: 10,          // 该武将的蓄力时间（受 CD 缩减影响）
    isCharged: false,         // 是否蓄满
    autoReleaseTimer: 0,     // 蓄满后自动释放倒计时（秒）
    isManual: false           // 本次释放是否为手动
  }
  ```

**WHEN/THEN 场景**：

```
WHEN 战斗开始，武将 A 蓄力时间 = chargeTime(heroA)
THEN heroSkills[heroA.uid].chargeProgress = 0
AND 武将 A 头像下方显示能量条（0%）

WHEN 战斗进行中（非暂停），每帧 tick
THEN heroSkills[heroA.uid].chargeProgress += scaledDelta
AND UI 能量条按比例填充

WHEN heroSkills[heroA.uid].chargeProgress >= chargeTime
THEN heroSkills[heroA.uid].isCharged = true
AND heroSkills[heroA.uid].autoReleaseTimer = 0（开始计时）
AND 武将头像/图标出现"可释放"脉冲发光提示
AND 底部技能按钮高亮
AND emit('td:skill_ready', { heroUid: heroA.uid })

WHEN 玩家在技能蓄满后点击武将 A 的技能按钮
THEN 立即释放技能
AND damage = heroAtk × HERO_SKILL_COEFFICIENT × MANUAL_SKILL_BONUS
AND heroSkills[heroA.uid] 重置（chargeProgress=0, isCharged=false）
AND emit('td:skill_manual_cast', { heroUid, damage, isManual: true })
AND 飘字类型为 'manual_skill'（金色大字号）

WHEN 技能蓄满后 autoReleaseTimer 累积 >= AUTO_RELEASE_TIMEOUT（受 speedMultiplier 缩放）
AND 玩家未手动释放
THEN 自动释放技能
AND damage = heroAtk × HERO_SKILL_COEFFICIENT × 1.0（无额外加成）
AND heroSkills[heroA.uid] 重置
AND emit('td:skill_auto_cast', { heroUid, damage, isManual: false })

WHEN 3× 倍速下武将 A 蓄力
THEN 蓄力在实际 chargeTime/3 秒后蓄满

WHEN 战斗暂停中武将正在蓄力
THEN 蓄力计时器冻结，autoReleaseTimer 冻结，恢复后继续

WHEN 技能蓄满时武将阵亡
THEN 蓄力进度清零，复活后从 0 重新蓄力

WHEN 玩家离线/后台（自动防守模式）
THEN 使用旧 HERO_SKILL_INTERVAL=10s 自动释放，无手动加成

WHEN 武将技能释放时需选择目标
THEN 自动选择最优目标（路径距离最近城主府的敌人），无需玩家选目标
```

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:skill_ready` | `{ heroUid: string }` | 技能蓄满，通知 UI 显示可释放提示 |
| emit | `td:skill_manual_cast` | `{ heroUid: string, damage: number, isManual: true }` | 手动释放 |
| emit | `td:skill_auto_cast` | `{ heroUid: string, damage: number, isManual: false }` | 自动释放 |

**数值引用**：[数值规范 §1](../numerical/td-gameplay-enhancement.md#1-武将技能蓄力us-a1)

**错误处理**：
- `heroSkillCdReduction < 0` → 钳位到 0
- `heroSkillCdReduction > MAX_CD_REDUCTION` → 钳位到 MAX_CD_REDUCTION
- 武将不在场时点击技能按钮 → 无反应

---

### CAP-TDE-06：连杀提示系统

**前置条件**：战斗进行中，有敌人被击杀。

**概述**：在时间窗口内连续击杀敌人时，屏幕中央弹出分级连杀提示，并给予触发击杀的金币加成。

**状态变更**：
- `_runtimeState.killStreak` — 不持久化：
  ```javascript
  {
    count: 0,                // 当前连杀计数
    timeSinceLastKill: 0,    // 距上次击杀的时间（游戏时间秒）
    highestThisWave: 0       // 本波最高连杀数
  }
  ```

**WHEN/THEN 场景**：

```
WHEN 敌人被击杀
THEN _runtimeState.killStreak.count += 1
AND _runtimeState.killStreak.timeSinceLastKill = 0
AND 检查 count 是否达到连杀等级阈值

WHEN 连杀 count 达到等级阈值（2/3/5/8/12+）
THEN 屏幕中央弹出对应等级的提示文字（颜色、字号、特效均按等级表）
AND 该敌人的击杀金币获得对应 goldBonus 加成
AND 更新 highestThisWave = max(highestThisWave, count)

WHEN 每帧 tick 且 timeSinceLastKill 累积 > KILL_STREAK.WINDOW（游戏时间）
THEN count 归零

WHEN 同一帧内多个敌人死亡
THEN 全部计入连杀（视为同一时刻击杀）

WHEN 连杀 count > 12
THEN 保持"万夫莫敌"等级显示，goldBonus 维持最高档

WHEN 波次结束
THEN 结算面板显示本波最高连杀数（highestThisWave）
AND 连杀中断（count 归零）

WHEN Boss 被击杀
THEN 算入连杀计数

WHEN 3× 倍速下连杀
THEN KILL_STREAK.WINDOW 以游戏时间计（4s 游戏时间 = 实际 1.33s）

WHEN 连杀提示显示
THEN 不遮挡武将技能按钮和紧急技能栏（定位在屏幕上半中央）
```

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:kill_streak` | `{ count: number, level: string, goldBonus: number }` | 连杀等级变化时通知 UI |
| on | `td:enemy_killed` | — | 监听击杀事件以更新连杀 |

**数值引用**：[数值规范 §6](../numerical/td-gameplay-enhancement.md#6-连杀阈值us-c2)

**错误处理**：
- count 意外为负 → 钳位到 0

---

### CAP-TDE-07：练习模式

**前置条件**：关卡已通关（星级 ≥ 1）。

**概述**：已通关关卡可以不消耗体力地重复挑战，但奖励大幅减少且无稀有掉落。

**状态变更**：
- `_runtimeState.isPracticeMode` — `boolean`，当前战斗是否为练习模式，不持久化

**WHEN/THEN 场景**：

```
WHEN 玩家选择已通关关卡（星级 ≥ 1）
THEN 显示两个按钮："挑战"（消耗体力，正常奖励）和"练习"（免费，减少奖励）

WHEN 玩家点击"练习"按钮
THEN _runtimeState.isPracticeMode = true
AND 不消耗体力（STAMINA.COST_PRACTICE = 0）
AND 正常进入战斗

WHEN 练习模式通关
THEN 金币奖励 = 正常奖励 × PRACTICE.REWARD_RATIO
AND 经验奖励 = 正常奖励 × PRACTICE.REWARD_RATIO
AND 不获得装备掉落（PRACTICE.EQUIP_DROP = false）
AND 不获得玉石掉落（PRACTICE.JADE_DROP = false）
AND 不更新星级评价（PRACTICE.PROGRESS_UPDATE = false）
AND 不推进关卡进度

WHEN 玩家连续练习同一关卡
THEN 无次数限制，每次奖励不递减（固定比例）

WHEN 玩家选择未通关关卡
THEN 仅显示"挑战"按钮，无"练习"选项
```

**事件协议**：无新增事件。复用 `td:wave_cleared` 事件，载荷中 rewards 按比例缩减。

**数值引用**：[数值规范 §4](../numerical/td-gameplay-enhancement.md#4-练习模式奖励us-b2)

**错误处理**：
- 练习模式战斗失败 → 无体力损失（因为未消耗）

---

## 5. Phase 2 能力规范 — 策略深化

### CAP-TDE-08：全局紧急技能

**前置条件**：战斗进行中（有活跃波次）。

**概述**：提供 3 个不依赖武将的全局技能——万箭齐发（范围伤害）、擂鼓助威（攻速 buff）、金城汤池（墙体无敌+回血）。每关独立冷却，每次进入新关卡时 CD 重置。

**状态变更**：
- `_runtimeState.emergencySkills` — 不持久化：
  ```javascript
  {
    arrow_rain:    { cooldownRemaining: 0 },
    battle_charge: { cooldownRemaining: 0, buffActive: false, buffTimer: 0 },
    iron_wall:     { cooldownRemaining: 0, shieldActive: false, shieldTimer: 0 }
  }
  ```

**WHEN/THEN 场景**：

```
WHEN 战斗进行中
THEN 屏幕底部显示紧急技能栏（3 个按钮），各自显示图标和冷却状态

WHEN 玩家点击"万箭齐发"按钮且 cooldownRemaining == 0
THEN 对场上所有敌人造成 floor(baseHp(currentWave) × hpRatio) 伤害
AND 播放全屏箭雨视觉特效
AND cooldownRemaining = EMERGENCY_SKILLS.ARROW_RAIN.cooldown
AND emit('td:emergency_skill_used', { skillId: 'arrow_rain', wave: currentWave })

WHEN 玩家释放"擂鼓助威"且 cooldownRemaining == 0
THEN 所有塔和武将攻速变为 baseAS × aspdMultiplier，持续 duration 秒
AND buffActive = true, buffTimer = 0
AND 播放红色脉冲波 + 友方单位闪光特效
AND cooldownRemaining = EMERGENCY_SKILLS.BATTLE_CHARGE.cooldown

WHEN 擂鼓助威 buffTimer 累积 >= duration
THEN buffActive = false，所有攻速恢复正常

WHEN 玩家释放"金城汤池"且 cooldownRemaining == 0
THEN 所有墙体 shieldActive = true（受到的伤害变为 0），持续 wallInvincibleDuration 秒
AND 城主府 HP 回复 = floor(townHallMaxHp × townhallHealRatio)
AND 城主府 HP 钳位到 townHallMaxHp
AND 播放墙体金色光罩 + 城主府绿色回复光效
AND cooldownRemaining = EMERGENCY_SKILLS.IRON_WALL.cooldown

WHEN 进入新关卡
THEN 所有紧急技能 cooldownRemaining = 0

WHEN 紧急技能在 CD 中，玩家点击按钮
THEN 按钮灰显，点击无反应

WHEN 场上无敌人时释放万箭齐发
THEN 允许使用，伤害为 0，CD 正常消耗（玩家误操作的自然惩罚）

WHEN 无墙体时释放金城汤池
THEN 仅城主府回血生效，无敌效果无目标

WHEN 倍速模式下
THEN CD 倒计时受 scaledDelta 缩放（3× 下实际 75/3=25s 冷却）

WHEN 暂停中
THEN CD 计时暂停，buff 持续计时暂停

WHEN 不建造任何塔、不部署武将，仅依赖紧急技能挑战任意波次
THEN 无法通关（紧急技能总伤害 < 波次总 HP 的 30%）
```

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:emergency_skill_used` | `{ skillId: string, wave: number }` | 紧急技能使用 |

**数值引用**：[数值规范 §2](../numerical/td-gameplay-enhancement.md#2-紧急技能us-a3)

**错误处理**：
- cooldownRemaining 浮点误差导致微小负值 → 钳位到 0
- 城主府 HP 回复超过 maxHP → 钳位到 maxHP

---

### CAP-TDE-09：战斗中建造/出售松绑

**前置条件**：战斗进行中或准备阶段。

**概述**：放宽现有限制——波次进行中允许建造新塔，出售已有塔的返还率降低。暂停中不可建造/出售。

本能力修改基线规范 CAP-TD-02（建造）和 CAP-TD-04（出售）的行为。

**状态变更**：无新增字段。修改出售返还率逻辑的判定条件。

**WHEN/THEN 场景**：

```
WHEN 处于波次间准备阶段（15s 倒计时）
THEN 玩家可自由建造和出售塔
AND 出售返还率 = 50%（沿用基线规范）

WHEN 波次进行中且玩家有足够资源
THEN 玩家可在空闲格子建造新塔
AND 新塔立即开始攻击（无延迟）
AND 建造工具栏保持可见（非灰显）

WHEN 波次进行中出售塔
THEN 返还率 = 30%（低于准备阶段的 50%）

WHEN 战斗暂停中
THEN 建造/出售操作禁用
AND 建造工具栏灰显
AND 点击提示"暂停中无法操作"

WHEN 战斗中建造新塔导致完全封路
THEN 阻止放置，提示"不能完全封锁路径"（沿用基线封路检测）
```

**事件协议**：复用基线事件 `td:tower_built` 和 `td:tower_sold`。`td:tower_sold` 载荷的 refund 按实际返还率计算。

**数值引用**：无新数值。返还率规则为逻辑变更。

**错误处理**：
- 暂停中收到建造/出售请求 → 忽略，显示 Toast 提示

---

### CAP-TDE-10：半封路机制

**前置条件**：防守模式中玩家尝试建造/放置墙体或塔。

**概述**：放宽封路检测——只要存在至少一条从任意生成点到城主府的通路即可（即使路线很长很曲折）。鼓励迷宫设计。

本能力修改 `js/core/pathfinding.js` 的封路判定逻辑和基线规范 CAP-TD-02 的封路检测。

**状态变更**：无新增持久化字段。

**WHEN/THEN 场景**：

```
WHEN 玩家建造墙体使通路变窄为 1 格宽
THEN 允许建造，不弹出封路提示
AND A* 寻路重新计算路径

WHEN 玩家建造导致所有生成点到城主府均无路可达
THEN 阻止建造，提示"必须保留至少一条通路"

WHEN 建造新墙体导致最短路径变化
THEN 尚未到达旧路径段的活跃敌人立即重新寻路走新路径
AND emit('td:path_updated', { affectedEnemyCount: number })

WHEN 玩家拖拽墙体到目标位置（放置前预览）
THEN 半透明显示预计的敌人新路径（蓝色虚线）
AND 若放置会导致完全封路，预览路径显示为红色 + 禁止图标

WHEN 玩家构建迷宫使敌人路径延长 2-3 倍
THEN 沿途防御塔正常对经过的敌人多次攻击
```

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:path_updated` | `{ affectedEnemyCount: number }` | 路径重算完成 |

**数值引用**：无。

**错误处理**：
- A* 在大地图上计算超时（> 5ms） → 使用缓存路径，下帧重试
- 多个生成点需分别验证通路 → 任一生成点无路即阻止放置

---

### CAP-TDE-11：专用 TD 地图

**前置条件**：城防系统已解锁，玩家进入关卡。

**概述**：为 5 章各设计专用 TD 地图（不再复用城镇地图），包含预设出生点、不可建造区域（地形）和战略要地。

**状态变更**：
- `_state.currentChapter` — `number`，当前章节 ID（1-5），用于加载对应地图

**地图数据格式**：

```javascript
// TDMapData[chapterId] 结构
{
  id: 'ch1_plains',
  name: '平原村落',
  gridWidth: 24,             // 格子列数
  gridHeight: 16,            // 格子行数
  cellSize: 48,              // 像素/格（沿用现有）
  terrain: [                 // 二维数组，0=可建造空地, 1=不可建造地形, 2=道路, 9=城主府
    [0, 0, 1, ...],
    ...
  ],
  spawnPoints: [             // 敌人出生点
    { x: 0, y: 8, label: '西门' }
  ],
  townHall: { x: 22, y: 8 },// 城主府位置
  strategicSpots: [          // 战略要地
    { x: 10, y: 8 },
    { x: 15, y: 5 }
  ]
}
```

**WHEN/THEN 场景**：

```
WHEN 玩家进入第 N 章的关卡
THEN 加载 TDMapData[N] 对应章节的专用 TD 地图
AND Canvas 渲染该地图的网格、地形、出生点标记

WHEN 波次开始
THEN 敌人从该地图预设的 spawnPoints 生成（不再是随机四边）
AND 每波从可用出生点中随机选 1-2 个

WHEN 玩家查看地图
THEN 不可建造区域（terrain=1）有明显的视觉标识（深色纹理）
AND 道路（terrain=2）有浅色路面纹理
AND 出生点有方向箭头标记

WHEN 不同章节地图
THEN 需要根据地形调整阵型（同一套阵型无法通用所有章节）

WHEN 加载专用地图
THEN 现有的 A* 寻路、建造/出售、碰撞检测系统正常工作
AND 地图尺寸保持兼容（复用现有 Canvas/摄像机系统）
```

**5 章地图特色**：

| 章节 | 地图 ID | 主题 | 出生点数 | 地形特色 |
|------|---------|------|---------|---------|
| 1 | `ch1_plains` | 平原村落 | 1 | 开阔平地，适合新手学习 |
| 2 | `ch2_pass` | 虎牢关口 | 2 | 天然窄道 + 两翼包抄路线 |
| 3 | `ch3_river` | 江岸营寨 | 2 | 河流分隔地图，桥梁为必经之路 |
| 4 | `ch4_castle` | 城池攻防 | 3 | 多层预设城墙，敌人逐层突破 |
| 5 | `ch5_camp` | 连营大阵 | 4 | 复杂迷宫式地形，四面围攻 |

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:map_loaded` | `{ chapterId: number, mapId: string }` | 地图加载完成 |

**数值引用**：无（地图数据为结构定义，非数值平衡）。

**错误处理**：
- 地图数据缺失 → 回退到默认空白网格地图，Toast 警告
- 出生点被地形堵死 → 地图数据校验错误，开发时检测

---

### CAP-TDE-12：战略要地高亮

**前置条件**：专用 TD 地图已加载（CAP-TDE-11）。

**概述**：在地图上标记推荐的塔放置位置，帮助新手理解布阵策略。

**状态变更**：
- `_state.settings.showStrategicSpots` — `boolean`，默认 `true`

**WHEN/THEN 场景**：

```
WHEN 玩家首次进入某章节地图（或 showStrategicSpots = true）
THEN 战略要地格子显示半透明金色高亮标记（脉冲闪烁）

WHEN 玩家在设置中关闭"塔位推荐"
THEN _state.settings.showStrategicSpots = false
AND 不再显示高亮标记

WHEN 玩家在高亮格子上建造塔
THEN 该格子高亮消失

WHEN 战略要地高亮显示
THEN 玩家仍可在任何合法空格建塔，高亮仅为建议

WHEN 高亮格子被墙体/地形占据
THEN 不显示高亮（只高亮可建造空格）
```

**事件协议**：无新增事件。

**数值引用**：无。

**错误处理**：
- strategicSpots 坐标超出地图范围 → 忽略该坐标

---

## 6. Phase 3 能力规范 — 深度扩展

### CAP-TDE-13：塔进化系统

**前置条件**：塔等级达到 Lv5（当前最大等级），玩家有足够资源。

**概述**：Lv5 塔可消耗额外资源进行不可逆的进化分支选择。6 种攻击/辅助塔 × 2 条路线 = 12 种进化类型。路线 A 偏精准化（单体/远程/高伤），路线 B 偏泛化（多目标/AoE/控制）。

**状态变更**：
- 塔实例新增字段：`evolution` — `null | 'pathA' | 'pathB'`，持久化在 `_state.towers[].evolution`
- 进化后塔的 `type` 更新为进化 ID（如 `'td_arrow_sharpshooter'`）

**WHEN/THEN 场景**：

```
WHEN 玩家点击 Lv5 满级塔
THEN 塔信息面板新增"进化"按钮
AND 显示 2 条进化路线的预览：名称、效果简述、进化费用

WHEN 玩家选择路线 A 且资源足够
THEN 消耗进化费用（从 TDEvolutionData 读取）
AND tower.evolution = 'pathA'
AND tower.type = 进化 ID（如 'td_arrow_sharpshooter'）
AND 塔属性替换为进化属性集（ATK、Range、AS、Special）
AND Canvas 渲染外观变化
AND emit('td:tower_evolved', { uid, evolutionId, path: 'A' })

WHEN 塔已进化
THEN 无法切换到另一条路线（面板不显示切换选项）
AND 面板显示已选路线标记和进化后属性

WHEN 神射塔（路线 A）攻击，射程内同时存在 Boss 和普通兵
THEN 优先攻击 Boss/精英（special: 'priority_boss'）

WHEN 箭雨塔（路线 B）攻击
THEN 对命中点 splash 半径 1.0 格内的所有敌人造成伤害

WHEN 出售已进化的塔（准备阶段）
THEN 返还 = (baseCost × Σ costMul[1..5] + evolutionCost) × 50%

WHEN 出售已进化的塔（波次进行中）
THEN 返还 = (baseCost × Σ costMul[1..5] + evolutionCost) × 30%

WHEN 进化后的塔参与自动防守胜率计算
THEN 使用进化后的 DPS（非 Lv5 DPS）

WHEN 旧存档无 evolution 字段
THEN 已有 Lv5 塔的 evolution 初始化为 null（未进化状态）
```

**12 种进化类型一览**：

| 基础塔 | 路线 A（精准化） | 路线 B（泛化） |
|--------|----------------|---------------|
| 箭塔 | 神射塔 — 射程大增、单体高伤、优先 Boss | 箭雨塔 — 溅射范围攻击 |
| 弩车台 | 穿甲弩 — 无视防御、极高单体伤 | 连弩车 — 同时攻击 3 目标 |
| 投石车台 | 烈焰石 — 溅射增大 + 灼烧 DoT | 震天锤 — 溅射 + 眩晕控制 |
| 火油塔 | 天火塔 — 灼烧范围和伤害大增 | 毒烟塔 — 减速 + 减防辅助 |
| 连弩塔 | 诸葛连弩 — 攻速翻倍、4 目标扫射 | 破阵弩 — 穿透一排敌人 |
| 烽火台 | 天眼台 — 全图侦测 + ATK buff 25% | 号令台 — 攻速 buff 20% + 武将 CD 缩减 15% |

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:tower_evolved` | `{ uid: string, evolutionId: string, path: 'A' \| 'B' }` | 塔进化完成 |

**数值引用**：[数值规范 §7](../numerical/td-gameplay-enhancement.md#7-塔进化属性us-e1)（完整属性表、进化费用、DPS 平衡验证）

**错误处理**：
- 非 Lv5 塔尝试进化 → 隐藏进化按钮
- 资源不足 → 进化按钮灰显，显示费用差额
- 进化后 type 在 TDEvolutionData 中不存在 → 回退到 Lv5 基线属性，Toast 错误

---

### CAP-TDE-14：武将羁绊系统

**前置条件**：至少 2 名武将已部署到 TD 战场。

**概述**：当特定武将组合同时部署且全部存活时，触发羁绊效果提供被动加成。5 组羁绊覆盖不同策略方向。

**状态变更**：
- `_runtimeState.activeBonds[]` — 当前激活的羁绊 ID 列表，不持久化

**5 组羁绊定义**：

| 羁绊 | 成员 | 所需人数 | 加成目标 | 效果 |
|------|------|---------|---------|------|
| 桃园结义 | 刘备+关羽+张飞 | 3/3 | 仅三人自身 | ATK+15%, DEF+15%, 技能CD-20% |
| 卧龙凤雏 | 诸葛亮+庞统 | 2/2 | 全场塔+武将 | 全场塔 ATK+10%, 技能范围+20% |
| 五虎上将 | 关羽+张飞+赵云+马超+黄忠(任意3) | 3/5 | 所有已部署武将 | ASPD+25% |
| 虎豹骑 | 曹操+夏侯惇 | 2/2 | 全场塔+墙 | 塔 ATK+8%, 墙体 HP+20% |
| 江东双璧 | 周瑜+孙策 | 2/2 | 火属性塔 | 火属性伤害+30% |

**叠加关系**：`最终属性 = 基础属性 × 等级加成倍率 × 羁绊加成倍率`（乘法叠加）。

**WHEN/THEN 场景**：

```
WHEN 玩家部署的武将满足某个羁绊的组合条件（全部存活且在场）
THEN 将羁绊 ID 加入 activeBonds
AND 屏幕提示"[羁绊名称] 羁绊激活！"
AND 对应加成立即生效于战场
AND emit('td:bond_activated', { bondId, bondName, effects })

WHEN 羁绊成员之一 HP 归零撤退
THEN 将该羁绊 ID 从 activeBonds 移除
AND 提示"[羁绊名称] 羁绊解除"
AND 所有加成立即撤销（属性恢复未加成状态）
AND emit('td:bond_deactivated', { bondId, bondName })

WHEN 撤退武将复活回场
THEN 自动重新检测所有羁绊条件
AND 满足条件的羁绊重新激活

WHEN 部署的 3 人同时满足多个羁绊条件
THEN 所有满足的羁绊效果全部生效（乘法叠加）

WHEN 玩家在武将派驻面板选择武将
THEN 已满足的羁绊高亮显示"已激活"
AND 差一人即可激活的羁绊灰色高亮，提示"再部署 X 即可激活 Y"

WHEN 武将未拥有（未招募）
THEN 羁绊面板中对应武将灰显，提示"未获得"

WHEN 自动防守（离线/后台）
THEN 羁绊默认激活（不检查存活状态）

WHEN 旧存档无 bonds 相关字段
THEN 已部署武将组合自动检测羁绊，无额外初始化
```

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:bond_activated` | `{ bondId: string, bondName: string, effects: object }` | 羁绊激活 |
| emit | `td:bond_deactivated` | `{ bondId: string, bondName: string }` | 羁绊解除 |

**数值引用**：[数值规范 §8](../numerical/td-gameplay-enhancement.md#8-武将羁绊加成us-e2)

**错误处理**：
- TDBondData 中引用了不存在的 hero ID → 忽略该羁绊，不崩溃
- `MAX_ASSIGNED_HEROES` 不足以触发羁绊（如 2 槽位无法触发 3 人羁绊） → 统一为 3 槽位

---

### CAP-TDE-15：Boss 专属机制

**前置条件**：Boss 波次开始（每 5 波），当前章节有对应 Boss 数据。

**概述**：每章 Boss 有独特战斗 AI 和专属技能，需要针对性策略应对。Boss 属性倍率按角色定位细分（不再统一 ×3/×2/×2）。

**状态变更**：
- Boss 实例新增字段：`bossSkillTimer` — `number`，技能冷却计时，不持久化
- Boss 实例新增字段：`bossState` — `object`，Boss 专属状态（如张角的召唤计数、司马懿的分身列表）

**5 种 Boss 机制**：

| Boss | 章节 | 技能类型 | HP 倍率 | ATK 倍率 | 核心机制 |
|------|------|---------|---------|---------|---------|
| 张角 | Ch1 | summon | ×4 | ×2 | 每 15s 召唤 2 个黄巾兵（上限 6 同存） |
| 吕布 | Ch2 | charge | ×6 | ×3 | 每 20s 冲锋 3 格，穿过第 1 道墙，冲后自晕 2s |
| 曹操 | Ch3 | aura | ×5 | ×1.5 | 持续光环：3 格内敌人 ATK+40%, Speed+20% |
| 关羽 | Ch4 | slash | ×5 | ×2.5 | 每 12s 前方 120° 2 格扇形斩击，对建筑造成伤害 |
| 司马懿 | Ch5 | clone | ×5 | ×2 | 每 30s 创建 2 个分身（40% HP），需侦测辨别本体 |

**WHEN/THEN 场景**：

```
--- 通用 Boss 行为 ---

WHEN Boss 波次开始前
THEN 波次预览面板显示 Boss 名称 + 机制简述
AND 给玩家准备时间（标准 15s 准备阶段）

WHEN Boss 技能即将释放
THEN 播放 1.5s 预告动画（如张角双手发光、吕布举戟蓄力）
AND 给玩家反应时间

WHEN Boss 被击杀
THEN 有专属击杀动画（比普通死亡更夸张）
AND 特殊奖励提示（比普通波次结算更醒目）
AND 触发震屏（见 CAP-TDE-04）

--- 张角 --- 

WHEN 张角存活且 bossSkillTimer 累积 >= 15s（受 speedMultiplier 缩放）
THEN 检查场上张角召唤兵存活数
AND 若 < maxAlive(6)：在张角周围生成 2 个黄巾兵
    HP = floor(baseHp(wave) × 0.5)，ATK = floor(baseAtk(wave) × 0.5)
AND 重置 bossSkillTimer
AND 若 >= maxAlive：不召唤，等现有小兵被杀后下次触发

--- 吕布 ---

WHEN 吕布存活且 bossSkillTimer 累积 >= 20s
THEN 吕布沿当前朝向直线冲锋 3 格
AND 穿过第 1 道墙体（不被阻挡也不破坏该墙）
AND 对路径上所有建筑造成 bossAtk × 3 伤害
AND 冲锋结束后吕布自身眩晕 2s（期间不移动不攻击）

--- 曹操 ---

WHEN 曹操存活
THEN 持续检测 3 格半径内的友方敌人
AND 范围内敌人获得 ATK+40%, Speed+20% buff
AND 敌人离开范围 → buff 立即消失

WHEN 曹操被击杀
THEN 所有鼓舞 buff 立即从所有敌人身上移除

--- 关羽 ---

WHEN 关羽存活且 bossSkillTimer 累积 >= 12s
THEN 对前方 120° 扇形 2 格范围内的所有建筑造成伤害
AND damage = min(bossAtk × 3, building.maxHp × 0.30)
AND 不伤害友方敌人

--- 司马懿 ---

WHEN 司马懿存活且 bossSkillTimer 累积 >= 30s
THEN 创建 2 个分身实体
AND 分身 HP = 本体 HP × 0.40，ATK = 本体 ATK × 0.60
AND 分身不会使用技能
AND 无烽火台/天眼台 → 三个实体外观完全相同
AND 有烽火台/天眼台（侦测能力） → 本体头顶显示标记

WHEN 击杀司马懿本体（而非分身）
THEN 所有分身立即消散
AND Boss 战结束

WHEN 击杀分身
THEN 分身播放消散动画，不掉落奖励
AND 下次分身间隔到达时重新创建

--- 边界行为 ---

WHEN Boss 在暂停中
THEN bossSkillTimer 冻结

WHEN Boss 在 3× 速度下
THEN bossSkillTimer 按 scaledDelta 缩放

WHEN Boss 技能预告在 3× 速度下
THEN 预告动画 1.5s 实际 0.5s（若测试反馈太快，可改为固定实际时间）
```

**事件协议**：

| 方向 | 事件名 | 载荷 | 说明 |
|------|--------|------|------|
| emit | `td:boss_skill` | `{ bossId: string, skillType: string, details: object }` | Boss 释放技能 |
| emit | `td:boss_defeated` | `{ bossId: string, chapter: number, rewards: object }` | Boss 被击杀 |

**数值引用**：[数值规范 §9](../numerical/td-gameplay-enhancement.md#9-boss-专属技能数值us-e3)

**错误处理**：
- TDBossSkillData 中无当前章节 Boss 数据 → 使用基线 Boss 行为（×3/×2/×2 无技能）
- Boss 技能目标不存在（如关羽范围内无建筑） → 动画正常播放，伤害为 0
- 司马懿分身全被杀、本体也被杀 → Boss 击杀生效（不会出现幽灵分身）

---

## 7. 存档格式扩展

### 7.1 新增字段

以下字段新增到 `TowerDefenseManager.getState()` 返回的状态对象中：

```javascript
{
  // === 现有字段（不变） ===
  "unlocked": true,
  "era": 1,
  "research": { ... },
  "towers": [ ... ],
  "wave": { ... },
  "assignedHeroes": ["heroUid1", "heroUid2", "heroUid3"],  // 扩容为3
  "stats": { ... },
  "tutorialSeen": false,

  // === 新增字段 ===
  "stamina": {
    "current": 12,               // 当前体力值
    "lastRecoverTime": 1713100000000  // 上次恢复计算时间戳(ms)
  },
  "settings": {
    "showStrategicSpots": true   // 是否显示战略要地高亮
  }
}
```

塔实例扩展：

```javascript
// _state.towers[] 中的每个塔实例
{
  "uid": "string",
  "type": "string",          // 进化后更新为进化 ID
  "level": 5,
  "gridX": 10,
  "gridY": 5,
  "evolution": null           // null | 'pathA' | 'pathB'
}
```

### 7.2 旧存档迁移逻辑

| 缺失字段 | 迁移行为 |
|---------|---------|
| 无 `stamina` | 初始化 `{ current: STAMINA.MAX, lastRecoverTime: Date.now() }` |
| 有 `dailyChallengeCount` / `DAILY_CHALLENGE_LIMIT` 相关字段 | 废弃不读取，删除 |
| 塔实例无 `evolution` | 设为 `null`（未进化） |
| 无 `settings` | 初始化 `{ showStrategicSpots: true }` |
| `assignedHeroes` 长度为 2 | 保持不变，第 3 槽位为空（兼容 MAX_ASSIGNED_HEROES=3） |

**迁移时机**：`TowerDefenseManager.init(saved)` 中检测并补全缺失字段，一次性完成。

---

## 8. 事件协议表

### 8.1 新增事件

| 事件名 | 生产者 | 消费者 | 载荷 | Phase |
|--------|--------|--------|------|-------|
| `td:speed_changed` | Manager | Panel, Renderer | `{ speed: number }` | 1 |
| `td:stamina_changed` | Manager | Panel | `{ current: number, max: number }` | 1 |
| `td:damage_dealt` | Manager | Renderer | `{ towerUid, enemyUid, damage, type, x, y }` | 1 |
| `td:skill_ready` | Manager | Panel, Renderer | `{ heroUid: string }` | 1 |
| `td:skill_manual_cast` | Manager | Panel, Renderer | `{ heroUid, damage, isManual: true }` | 1 |
| `td:skill_auto_cast` | Manager | Panel, Renderer | `{ heroUid, damage, isManual: false }` | 1 |
| `td:kill_streak` | Manager | Panel, Renderer | `{ count, level, goldBonus }` | 1 |
| `td:emergency_skill_used` | Manager | Panel, Renderer | `{ skillId, wave }` | 2 |
| `td:path_updated` | Manager | Renderer | `{ affectedEnemyCount }` | 2 |
| `td:map_loaded` | Manager | Panel, Renderer | `{ chapterId, mapId }` | 2 |
| `td:tower_evolved` | Manager | Panel, Renderer | `{ uid, evolutionId, path }` | 3 |
| `td:bond_activated` | Manager | Panel, Renderer | `{ bondId, bondName, effects }` | 3 |
| `td:bond_deactivated` | Manager | Panel | `{ bondId, bondName }` | 3 |
| `td:boss_skill` | Manager | Renderer | `{ bossId, skillType, details }` | 3 |
| `td:boss_defeated` | Manager | Panel, Renderer | `{ bossId, chapter, rewards }` | 3 |

### 8.2 修改的现有事件

| 事件名 | 变更 |
|--------|------|
| `td:enemy_killed` | 载荷扩展：新增 `enemyType`, `isBoss`, `x`, `y` 字段 |
| `td:tower_sold` | refund 金额按 CAP-TDE-09 的返还率规则计算（波次中 30%） |

### 8.3 监听的现有事件（不变）

| 事件名 | 用途 |
|--------|------|
| `game:tick` | 驱动体力恢复、自动防守、解锁检查 |
| `battle:ended` | 检查解锁条件 |
| `town:building_upgraded` | 更新城主府等级相关计算 |

---

## 9. 与现有系统的集成点

### 9.1 需要修改的现有函数

| 文件 | 函数/区域 | 修改内容 | 关联 CAP |
|------|----------|---------|---------|
| `tower-defense-manager.js` | `_startWave()` | 新增体力扣减检查、练习模式判定 | TDE-02, TDE-07 |
| `tower-defense-manager.js` | `_updateBattle(dt)` | 新增 `dt × speedMultiplier` 缩放、蓄力更新、连杀更新、紧急技能 buff 更新、Boss 技能 AI | TDE-01, TDE-05, TDE-06, TDE-08, TDE-15 |
| `tower-defense-manager.js` | `_onEnemyKilled(enemy)` | 新增连杀计数、死亡动画标记、金币粒子触发 | TDE-04, TDE-06 |
| `tower-defense-manager.js` | `_towerAttack(tower, enemy)` | 新增飘字事件 emit、伤害合并标记 | TDE-03 |
| `tower-defense-manager.js` | `_heroSkillRelease(hero)` | 重构为蓄力+手动/自动释放逻辑 | TDE-05 |
| `tower-defense-manager.js` | `_sellTower(uid)` | 修改返还率逻辑（波次中 30%）、进化费用纳入 | TDE-09, TDE-13 |
| `tower-defense-manager.js` | `_buildTower(type, x, y)` | 暂停中禁止建造的检查 | TDE-09 |
| `tower-defense-manager.js` | `_checkWinRate()` | 自动防守纳入进化后 DPS | TDE-13 |
| `tower-defense-manager.js` | `getState()` | 新增 stamina、settings、tower.evolution 字段 | TDE-02, TDE-12, TDE-13 |
| `tower-defense-manager.js` | `init(saved)` | 旧存档迁移逻辑 | 全部 |
| `td-renderer.js` | `_renderEntities()` | 新增飘字渲染层、粒子系统、连杀提示、震屏效果 | TDE-03, TDE-04, TDE-06 |
| `td-renderer.js` | `_renderUI()` | 新增速度按钮、紧急技能栏、蓄力条、战略要地高亮 | TDE-01, TDE-05, TDE-08, TDE-12 |
| `td-renderer.js` | `_renderMap()` | 支持专用地图数据格式、地形渲染 | TDE-11 |
| `tower-defense-panel.js` | `_renderBattleUI()` | 新增速度切换、暂停按钮、体力显示、技能按钮栏 | TDE-01, TDE-02, TDE-05 |
| `tower-defense-panel.js` | `_renderTowerInfo()` | 新增进化面板、进化后属性显示 | TDE-13 |
| `tower-defense-panel.js` | `_renderHeroAssign()` | 新增羁绊提示、3 槽位支持 | TDE-14 |
| `tower-defense-panel.js` | `_renderWaveResult()` | 新增最高连杀数、练习模式标签 | TDE-06, TDE-07 |
| `pathfinding.js` | `_isPathBlocked()` | 放宽为半封路判定（仅检测是否存在至少一条通路） | TDE-10 |
| `td-data.js` | 全局数据表 | 新增 TDEvolutionData、TDBondData、TDBossSkillData、TDMapData | TDE-11, TDE-13, TDE-14, TDE-15 |

### 9.2 不修改的系统

| 系统 | 说明 |
|------|------|
| A* 寻路核心算法 | 保留，仅放宽封路判定条件 |
| 13 种建筑 / 12 种敌人基础数据 | 保留全部 |
| 城主府等级解锁制 | 保留 |
| Canvas 2D 渲染架构 | 在现有渲染层之上增加新图层 |
| EventBus 通信方式 | 新功能通过新事件接入 |
| 自动防守简化公式逻辑 | 保持（但 DPS 计算纳入进化后数值） |
| SaveManager 接口 | 不变，通过 getState() 扩展 |
| 主线战斗系统 | 完全不影响 |

### 9.3 script 加载顺序

新增的数据表写入现有 `js/data/td-data.js`，不新增文件。新增常量合并到 `TD_CONSTANTS`。无需新增 `<script>` 标签。

---

## 10. 非功能需求

| 项目 | 要求 | 关联 CAP |
|------|------|---------|
| 渲染性能 | 防守模式 Canvas ≥ 30 FPS（≤ 50 实体 + 15 飘字 + 30 粒子） | TDE-03, TDE-04 |
| 飘字池上限 | 同屏 ≤ 15 个飘字对象 | TDE-03 |
| 粒子池上限 | 同屏 ≤ 30 个粒子对象 | TDE-04 |
| deltaTime 钳位 | `scaledDelta = min(dt × speedMul, 0.1)` 防止物理跳跃 | TDE-01 |
| 离线补偿精度 | 体力恢复误差 ≤ ±30s | TDE-02 |
| 寻路性能 | 半封路判定后 A* 计算 < 5ms（沿用基线） | TDE-10 |
| 存档兼容 | 旧存档加载后自动迁移，无数据丢失 | 全部 |

---

## 11. 开放问题

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 1 | `MAX_ASSIGNED_HEROES` 当前规范写 2 但数据表写 3，需统一 | TDE-14 羁绊需要 3 人 | 统一为 3，以支持桃园结义等 3 人羁绊 |
| 2 | Boss 技能预告在 3× 速度下仅 0.5s 实际时间，是否过短 | TDE-15 可读性 | 若测试反馈太快，Boss 预告时间改为固定实际时间（不受倍速影响） |
| 3 | 已有 CoC 重制规范（Draft）与本规范的关系 | 视觉重制 vs 玩法升级 | CoC 侧重视觉重做，本规范侧重玩法。两者应协调优先级，避免冲突 |
| 4 | 专用 TD 地图是新建 Canvas 还是复用 TownWorld | TDE-11 技术方案 | 建议复用 Canvas + 摄像机系统，仅替换地图数据源 |
| 5 | 半封路机制是否需要限制最短路径的最小长度 | TDE-10 平衡 | 建议不做人为限制，由自然地形和路径长度约束 |

---

## 12. 交叉引用

| 文档 | 路径 | 关系 |
|------|------|------|
| PRD | [specs/game-prds/td-gameplay-enhancement.md](../game-prds/td-gameplay-enhancement.md) | 需求来源 |
| 数值规范 | [specs/numerical/td-gameplay-enhancement.md](../numerical/td-gameplay-enhancement.md) | 所有具体数值的真实来源 |
| 基线 TD 规范 | [specs/product-specs/tower-defense-system.md](./tower-defense-system.md) | 父级规范，本规范在其基础上扩展 |
| CoC 重制规范 | [specs/product-specs/tower-defense-coc-redesign.md](./tower-defense-coc-redesign.md) | 视觉方向参考，部分重叠 |
| 核心契约 | [specs/system/core-contracts.md](../system/core-contracts.md) | 事件协议、资源枚举、存档格式标准 |
| 架构约束 | [.github/copilot-instructions.md](../../.github/copilot-instructions.md) | 全局变量、EventBus、模块模板 |
| TD Manager | `js/modules/tower-defense-manager.js` | 核心逻辑实现文件 |
| TD Renderer | `js/ui/td-renderer.js` | Canvas 渲染实现文件 |
| TD Panel | `js/ui/tower-defense-panel.js` | UI 面板实现文件 |
| TD Data | `js/data/td-data.js` | 静态数据表文件 |
| Pathfinding | `js/core/pathfinding.js` | A* 寻路实现文件 |

---

## 附录 A：能力索引

| CAP ID | 名称 | Phase | 优先级 | PRD US |
|--------|------|-------|--------|--------|
| CAP-TDE-01 | 战斗速度控制 | 1 | P0 | US-A2 |
| CAP-TDE-02 | 体力系统 | 1 | P0 | US-B1 |
| CAP-TDE-03 | 飘字伤害系统 | 1 | P0 | US-C1 |
| CAP-TDE-04 | 击杀视觉反馈 | 1 | P0 | US-C3 |
| CAP-TDE-05 | 武将技能手动释放 | 1 | P1 | US-A1 |
| CAP-TDE-06 | 连杀提示系统 | 1 | P1 | US-C2 |
| CAP-TDE-07 | 练习模式 | 1 | P1 | US-B2 |
| CAP-TDE-08 | 全局紧急技能 | 2 | P1 | US-A3 |
| CAP-TDE-09 | 战斗中建造/出售松绑 | 2 | P1 | US-A4 |
| CAP-TDE-10 | 半封路机制 | 2 | P1 | US-D1 |
| CAP-TDE-11 | 专用 TD 地图 | 2 | P2 | US-D2 |
| CAP-TDE-12 | 战略要地高亮 | 2 | P2 | US-D3 |
| CAP-TDE-13 | 塔进化系统 | 3 | P2 | US-E1 |
| CAP-TDE-14 | 武将羁绊系统 | 3 | P2 | US-E2 |
| CAP-TDE-15 | Boss 专属机制 | 3 | P2 | US-E3 |
