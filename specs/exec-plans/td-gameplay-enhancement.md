# 执行计划：塔防体验全面升级（TD Gameplay Enhancement）

| 属性 | 值 |
|------|-----|
| **产品规范** | [specs/product-specs/td-gameplay-enhancement.md](../product-specs/td-gameplay-enhancement.md) (Draft v0.1.0) |
| **数值规范** | [specs/numerical/td-gameplay-enhancement.md](../numerical/td-gameplay-enhancement.md) (Draft v0.1.0) |
| **创建日期** | 2026-04-14 |
| **作者** | exec-planner |

---

## 0. 已实现基线分析

在制定执行计划前，先盘点代码中已经实现的内容，避免重复工作。

### 0.1 td-data.js — 数据层（已完成）

| 数据结构 | 状态 | 说明 |
|---------|------|------|
| `TD_ENHANCEMENT.SKILL_CHARGE` | ✅ 已就位 | BASE_CHARGE_TIME=10, MANUAL_SKILL_BONUS=1.5, AUTO_RELEASE_TIMEOUT=5, MAX_CD_REDUCTION=0.5 |
| `TD_ENHANCEMENT.EMERGENCY_SKILLS` | ✅ 已就位 | 三种紧急技能参数（arrow_rain, battle_charge, iron_wall） |
| `TD_ENHANCEMENT.STAMINA` | ✅ 已就位 | MAX=12, COST_NORMAL=1, RECOVER_INTERVAL_MIN=25 |
| `TD_ENHANCEMENT.PRACTICE` | ✅ 已就位 | REWARD_RATIO=0.25, 各种 DROP=false |
| `TD_ENHANCEMENT.DAMAGE_TEXT` | ✅ 已就位 | MERGE_WINDOW=0.3, MAX_ONSCREEN=15 |
| `TD_ENHANCEMENT.KILL_STREAK` | ✅ 已就位 | WINDOW=4, 5 级连杀阈值 |
| `TD_ENHANCEMENT.SPEED` | ✅ 已就位 | LEVELS=[1,2,3], MAX_SCALED_DELTA=0.1 |
| `TDEvolutionData` | ✅ 已就位 | 6 塔 × 2 路线 = 12 种进化 |
| `TDBondData` | ✅ 已就位 | 5 组羁绊 |
| `TDBossSkillData` | ✅ 已就位 | 5 章 Boss 技能参数 |
| `TDMapData` | ❌ 缺失 | 5 章专用地图数据尚未定义 |

### 0.2 tower-defense-manager.js — 逻辑层

| 能力 | 状态 | 已实现范围 | 待完成 |
|------|------|-----------|--------|
| CAP-TDE-01 速度控制 | ✅ 基本完成 | `toggleSpeed()`, `getSpeed()`, speedMultiplier 缩放, deltaTime 钳位 | 暂停/恢复逻辑（_runtimeState.paused）尚未独立实现 |
| CAP-TDE-02 体力系统 | ✅ 基本完成 | `_state.stamina`, `getStamina()`, `_tickStamina()`, `_recoverOfflineStamina()`, `startWave()` 体力扣减, 存档迁移 | UI 恢复倒计时、体力已满停止计时 |
| CAP-TDE-03 飘字系统 | ✅ 基本完成 | `_addDamageText()`, `_tickDamageTexts()`, `getDamageTexts()`, 合并窗口, MAX_ONSCREEN | 飘字颜色区分（normal/skill/manual_skill/emergency）在渲染端可能需完善 |
| CAP-TDE-04 击杀反馈 | 🟡 部分完成 | `_tickDyingEnemies()`, `getDyingEnemies()` | 金币粒子系统、震屏效果（screenShake）、攻城器械特殊死亡 |
| CAP-TDE-05 技能手动释放 | ✅ 基本完成 | `_tickHeroCombat()` 蓄力逻辑、`manualReleaseSkill()`, 自动释放超时 | 手动释放 MANUAL_SKILL_BONUS 伤害加成未接入 `_heroUseSkill`; heroSkillCdReduction 未读取 |
| CAP-TDE-06 连杀系统 | ✅ 基本完成 | `_updateKillStreak()`, `_tickKillStreak()`, `getKillStreak()`, 事件 emit | goldBonus 加成实际接入击杀金币逻辑 |
| CAP-TDE-07 练习模式 | 🟡 部分完成 | `startWave({practice:true})` 入口, `_battle.isPractice` | 通关奖励缩减逻辑、面板双按钮（挑战/练习） |
| CAP-TDE-08 紧急技能 | ✅ 基本完成 | `useEmergencySkill()`, 三种技能实现, `_tickEmergencyBuffs()`, CD 递减 | 紧急技能 UI 栏（Panel 层）、视觉特效（Renderer 层） |
| CAP-TDE-09 战斗中建造松绑 | ❌ 未实现 | — | 波次中允许建造、出售返还率调整、暂停禁止 |
| CAP-TDE-10 半封路 | ❌ 未实现 | — | 放宽封路检测、路径预览 |
| CAP-TDE-11 专用 TD 地图 | ❌ 未实现 | — | TDMapData 定义、地图加载、地形渲染 |
| CAP-TDE-12 战略要地 | ❌ 未实现 | — | 高亮渲染、设置开关 |
| CAP-TDE-13 塔进化 | ❌ 未实现 | — | 进化逻辑、面板、渲染、出售返还 |
| CAP-TDE-14 武将羁绊 | ❌ 未实现 | — | 羁绊检测、属性加成、面板 |
| CAP-TDE-15 Boss 专属机制 | ❌ 未实现 | — | 5 种 Boss AI、技能释放、预告动画 |

### 0.3 td-renderer.js — 渲染层

| 方法 | 状态 | 说明 |
|------|------|------|
| `drawDamageTexts()` | ✅ 已就位 | 飘字渲染（L1352） |
| `drawDyingEnemy()` | ✅ 已就位 | 死亡动画（L1404） |
| `drawKillStreak()` | ✅ 已就位 | 连杀提示渲染（L1440） |
| `drawChargeBar()` | ✅ 已就位 | 蓄力条（L1479） |
| `drawSpeedIndicator()` | ✅ 已就位 | 速度指示器（L1511） |
| 金币粒子 | ❌ 未实现 | CAP-TDE-04 |
| 震屏效果 | ❌ 未实现 | CAP-TDE-04 |
| 紧急技能特效 | ❌ 未实现 | CAP-TDE-08 |
| 战略要地高亮 | ❌ 未实现 | CAP-TDE-12 |
| 进化塔外观 | ❌ 未实现 | CAP-TDE-13 |
| Boss 技能特效 | ❌ 未实现 | CAP-TDE-15 |
| 专用地图渲染 | ❌ 未实现 | CAP-TDE-11 |

### 0.4 tower-defense-panel.js — UI 层

| 功能 | 状态 | 说明 |
|------|------|------|
| 体力显示 | ✅ 已就位 | 顶部 ⚡N/N 显示 |
| 速度切换按钮 | ✅ 已就位 | 战斗 UI 中速度按钮 |
| 练习按钮 | 🟡 部分 | `_startPractice()` 存在，但双按钮 UI 布局不完善 |
| 技能按钮栏 | ❌ 未实现 | CAP-TDE-05 手动释放按钮 |
| 紧急技能栏 | ❌ 未实现 | CAP-TDE-08 |
| 进化面板 | ❌ 未实现 | CAP-TDE-13 |
| 羁绊面板 | ❌ 未实现 | CAP-TDE-14 |
| 暂停按钮 | ❌ 未实现 | CAP-TDE-01 暂停/恢复 |

---

## 1. Phase 1 — 立竿见影（CAP-TDE-01 ~ CAP-TDE-07）

> **目标**：完善已有基础框架的缺失细节，补全 UI 交互，使 Phase 1 的 7 项能力全部可玩可验证。

### Task 1.1：暂停/恢复机制 + 速度控制完善

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-01 §4 全部 WHEN/THEN 场景 |
| **复杂度** | 中（M） |
| **文件** | `tower-defense-manager.js`, `tower-defense-panel.js` |
| **依赖** | 无 |
| **输入** | 规范 §4 CAP-TDE-01 暂停场景定义 |

**实现内容**：
1. Manager 新增 `_battle.paused` 状态和 `togglePause()` 方法
2. `_battleTick()` 中检测 `paused` 跳过所有逻辑更新（仅保留 UI 渲染）
3. 暂停时：半透明遮罩、可查看塔/武将信息、不可建造/出售
4. Panel 新增暂停按钮（仅战斗中可见）
5. 退出防守模式后速度重置为 1×（已有，验证）
6. deltaTime 钳位 `min(dt * speedMul, 0.1)`（已有，验证）

**输出**：
- Manager: `togglePause()`, `isPaused()` 方法
- Panel: 暂停/继续按钮 UI

**验证**：
- [ ] 暂停时所有敌人停止移动、塔停止攻击、蓄力冻结
- [ ] 暂停中点击建造/出售 → Toast 提示"暂停中无法操作"
- [ ] 恢复后以暂停前倍速继续
- [ ] 退出后重新进入，速度为 1×
- [ ] 3× + 高 dt → scaledDelta 不超过 0.1

---

### Task 1.2：体力系统 UI 完善

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-02 §4 全部 WHEN/THEN |
| **复杂度** | 小（S） |
| **文件** | `tower-defense-panel.js`, `tower-defense-manager.js` |
| **依赖** | 无 |
| **输入** | 已实现的 Manager 体力逻辑 |

**实现内容**：
1. Panel 体力显示补充恢复倒计时（"X分钟后恢复1点"）
2. 体力不足时"开始波次"按钮灰显
3. 体力已满显示"体力已满"文本
4. 验证离线恢复逻辑正确性

**输出**：
- Panel: 恢复倒计时 UI、按钮灰显逻辑

**验证**：
- [ ] 体力 < MAX → 显示倒计时
- [ ] 体力 = 0 → 按钮灰显 + Toast 警告
- [ ] 体力 = MAX → 显示"体力已满"，计时器暂停
- [ ] 离线 50 分钟 → 恢复 2 点（RECOVER_INTERVAL=25min）

---

### Task 1.3：飘字颜色/字号分级 + 渲染完善

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-03 §4 全部 WHEN/THEN |
| **复杂度** | 小（S） |
| **文件** | `tower-defense-manager.js`, `td-renderer.js` |
| **依赖** | 无 |
| **输入** | 已实现的 _addDamageText + drawDamageTexts |

**实现内容**：
1. `_addDamageText()` 传入 type 参数（normal/skill/manual_skill/emergency）
2. `drawDamageTexts()` 根据 type 选择颜色和字号：
   - normal: 白色, 基础字号
   - skill: 橙色(#FF8C00), +4px
   - manual_skill: 金色(#FFD700), +8px, 发光效果
   - emergency: 红色, +4px
3. 确认合并窗口逻辑仅合并相同 towerUid+enemyUid（当前按位置合并，需加 uid）
4. 确认负伤害不创建飘字

**输出**：
- Manager: `_addDamageText` 调用点补充 type 参数
- Renderer: `drawDamageTexts` 分级颜色渲染

**验证**：
- [ ] 普通攻击 → 白色飘字
- [ ] 武将技能 → 橙色飘字, 大 4px
- [ ] 手动技能 → 金色飘字, 大 8px, 发光
- [ ] 连弩（AS=3.0）连续命中同一敌人 → 合并显示累加值
- [ ] 同屏 > 15 飘字 → 复用最旧的

---

### Task 1.4：击杀视觉反馈完善（金币粒子 + 震屏）

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-04 §4 全部 WHEN/THEN |
| **复杂度** | 中（M） |
| **文件** | `tower-defense-manager.js`, `td-renderer.js` |
| **依赖** | 无 |
| **输入** | 已有 dyingEnemies 机制 |

**实现内容**：
1. **金币粒子系统**：
   - Manager: `_battle.particles[]` 粒子池（上限 30）
   - 敌人击杀时生成 2-4 个金色粒子
   - 粒子弧线轨迹飞向屏幕顶部金币区域
   - `_tickParticles(rawDt)` 更新粒子位置
2. **震屏效果**：
   - Manager: `_battle.screenShake = { intensity, duration, elapsed }`
   - Boss 击杀时设置 `screenShake = { intensity: 3, duration: 0.3, elapsed: 0 }`
   - Renderer: 每帧 Canvas translate 偏移 ±intensity
3. **Boss 白色闪光**：全屏 alpha 0.5 → 0, 0.2s
4. 攻城器械特殊破碎动画：更多粒子和更大范围

**输出**：
- Manager: `_battle.particles[]`, `_tickParticles()`, `_battle.screenShake`
- Renderer: `drawGoldParticles()`, 震屏 transform, Boss 闪光

**验证**：
- [ ] 普通敌人死亡 → 闪烁缩小 0.5s → 金色粒子飞出
- [ ] Boss 死亡 → 震屏 0.3s + 白色闪光
- [ ] 粒子总数 > 30 → 复用最旧
- [ ] 粒子飞到屏幕顶部消失

---

### Task 1.5：技能手动释放 — 伤害加成 + UI 按钮

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-05 §4 全部 WHEN/THEN |
| **复杂度** | 中（M） |
| **文件** | `tower-defense-manager.js`, `tower-defense-panel.js`, `td-renderer.js` |
| **依赖** | Task 1.3（飘字分级） |
| **输入** | 已有蓄力逻辑 + manualReleaseSkill |

**实现内容**：
1. **Manager**:
   - `_heroUseSkill()` 读取 `hero.manualRelease` → 手动时 damage × MANUAL_SKILL_BONUS(1.5)
   - `_tickHeroCombat()` 读取武将 heroSkillCdReduction（来自等级/装备），计算 chargeTime = BASE / (1 + cdReduction)
   - 技能蓄满事件改为 `td:skill_ready`（对齐规范事件名）
   - 技能释放事件拆分为 `td:skill_manual_cast` 和 `td:skill_auto_cast`
2. **Panel**:
   - 底部技能按钮栏：显示每个已部署武将的头像 + 蓄力进度
   - 蓄满时按钮高亮脉冲
   - 点击触发 `TowerDefenseManager.manualReleaseSkill(heroUid)`
3. **Renderer**:
   - `drawChargeBar()` 已有 → 确认集成到武将渲染流程

**输出**：
- Manager: 手动加成伤害计算、CD 缩减接入
- Panel: 技能按钮栏 UI

**验证**：
- [ ] 手动释放伤害 = heroAtk × 0.5 × 1.5
- [ ] 自动释放伤害 = heroAtk × 0.5 × 1.0
- [ ] 蓄力条从 0% → 100% 填充
- [ ] 蓄满后 5s 内未操作 → 自动释放
- [ ] 3× 速度下蓄力时间 = 实际 10/3 ≈ 3.3s
- [ ] 暂停中蓄力冻结
- [ ] 武将阵亡 → 蓄力归零

---

### Task 1.6：连杀金币加成接入

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-06 §4 goldBonus 场景 |
| **复杂度** | 小（S） |
| **文件** | `tower-defense-manager.js` |
| **依赖** | 无 |
| **输入** | 已有连杀计数逻辑 |

**实现内容**：
1. `_killEnemy()` 中根据当前连杀等级查找 goldBonus
2. 金币奖励 = baseGold × (1 + goldBonus)
3. 波次结束结算面板显示本波最高连杀数
4. 同一帧多个敌人死亡全部计入连杀

**输出**：
- Manager: 金币加成逻辑
- Panel: 结算面板连杀显示

**验证**：
- [ ] 2 连杀 → 金币 +5%
- [ ] 5 连杀 → 金币 +15%
- [ ] 12+ 连杀 → 金币 +30%（维持最高档）
- [ ] 4s（游戏时间）内无击杀 → 连杀归零
- [ ] 3× 速度下 4s 游戏时间 = 1.33s 实际时间

---

### Task 1.7：练习模式完善

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-07 §4 全部 WHEN/THEN |
| **复杂度** | 小（S） |
| **文件** | `tower-defense-manager.js`, `tower-defense-panel.js` |
| **依赖** | Task 1.2（体力 UI） |
| **输入** | 已有 startWave({practice: true}) 入口 |

**实现内容**：
1. **Manager**:
   - 练习模式通关时奖励乘以 PRACTICE.REWARD_RATIO(0.25)
   - 不给装备/玉石掉落（EQUIP_DROP=false, JADE_DROP=false）
   - 不更新星级、不推进关卡进度
2. **Panel**:
   - 已通关关卡显示双按钮："挑战"（⚡1）和"练习"（免费）
   - 未通关关卡仅显示"挑战"
   - 练习中 UI 显示"练习模式"标签

**输出**：
- Manager: 练习模式奖励缩减逻辑
- Panel: 双按钮 UI

**验证**：
- [ ] 练习模式不消耗体力
- [ ] 通关奖励 = 正常 × 25%
- [ ] 无装备/玉石掉落
- [ ] 不更新星级
- [ ] 未通关关卡无"练习"按钮

---

## 2. Phase 2 — 策略深化（CAP-TDE-08 ~ CAP-TDE-12）

> **目标**：在 Phase 1 基础上新增策略维度——紧急技能 UI、建造松绑、半封路、专用地图、战略要地。

### Task 2.1：紧急技能 UI + 视觉特效

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-08 §5 全部 WHEN/THEN |
| **复杂度** | 大（L） |
| **文件** | `tower-defense-panel.js`, `td-renderer.js` |
| **依赖** | Phase 1 全部完成 |
| **输入** | Manager 层已实现（useEmergencySkill, _tickEmergencyBuffs） |

**实现内容**：
1. **Panel**:
   - 屏幕底部紧急技能栏：3 个技能按钮（万箭齐发、擂鼓助威、金城汤池）
   - 每个按钮显示图标 + CD 倒计时遮罩
   - CD 中按钮灰显
   - 点击触发 `TowerDefenseManager.useEmergencySkill(skillId)`
2. **Renderer**:
   - 万箭齐发：全屏箭雨粒子特效（向下落的箭矢粒子）
   - 擂鼓助威：红色脉冲波 + 友方单位短暂闪光
   - 金城汤池：墙体金色光罩 + 城主府绿色回复光效
3. 确认进入新关卡 CD 重置（已有）

**输出**：
- Panel: 紧急技能栏 HTML/事件绑定
- Renderer: 3 种技能视觉特效方法

**验证**：
- [ ] 3 个按钮可见, CD=0 时点击生效
- [ ] 万箭齐发 → 全场敌人扣血 + 箭雨特效
- [ ] 擂鼓助威 → 8s 攻速 ×1.5 buff + 红色脉冲
- [ ] 金城汤池 → 墙体无敌 5s + 城主府回血 15%
- [ ] CD 中按钮灰显
- [ ] 倍速下 CD 按 scaledDelta 递减

---

### Task 2.2：战斗中建造/出售松绑

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-09 §5 全部 WHEN/THEN |
| **复杂度** | 中（M） |
| **文件** | `tower-defense-manager.js`, `tower-defense-panel.js` |
| **依赖** | Task 1.1（暂停机制） |
| **输入** | 现有 _buildTower / _sellTower 逻辑 |

**实现内容**：
1. **Manager**:
   - `_buildTower()` 移除"波次进行中禁止建造"限制
   - `_buildTower()` 新增"暂停中禁止建造"检查
   - `_sellTower()` 新增返还率判定：准备阶段 50%，波次中 30%
   - `_sellTower()` 暂停中禁止出售
2. **Panel**:
   - 波次进行中建造工具栏保持可见（非灰显）
   - 暂停中工具栏灰显
   - 出售面板显示当前返还率（"波次中返还 30%"）

**输出**：
- Manager: 建造/出售条件逻辑修改
- Panel: 工具栏状态同步

**验证**：
- [ ] 波次进行中可建造新塔，新塔立即攻击
- [ ] 波次中出售 → 返还 30%
- [ ] 准备阶段出售 → 返还 50%
- [ ] 暂停中建造/出售 → 灰显 + Toast
- [ ] 战斗中建造导致封路 → 阻止

---

### Task 2.3：半封路机制

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-10 §5 全部 WHEN/THEN |
| **复杂度** | 大（L） |
| **文件** | `js/core/pathfinding.js`, `tower-defense-manager.js`, `td-renderer.js` |
| **依赖** | Task 2.2（建造松绑） |
| **输入** | 现有 A* 寻路 + 封路检测 |

**实现内容**：
1. **Pathfinding**:
   - 修改封路判定：从"不能让某些位置不可通行"改为"所有 spawnPoints → townHall 至少存在一条通路"
   - 新增 `isFullyBlocked(grid, spawnPoints, townHall)` — 对每个 spawnPoint 运行 A* 检查
   - 性能保障：A* < 5ms, 超时使用缓存路径
2. **Manager**:
   - `_buildTower()` / `_placeWall()` 中调用新封路判定
   - 路径变更时活跃敌人重新寻路
   - emit `td:path_updated` 事件
3. **Renderer**:
   - 建造预览：半透明显示新路径（蓝色虚线）
   - 完全封路时路径变红 + 禁止图标

**输出**：
- Pathfinding: `isFullyBlocked()` 新方法
- Manager: 封路检测替换 + 重新寻路逻辑
- Renderer: 路径预览渲染

**验证**：
- [ ] 通路窄到 1 格 → 允许建造
- [ ] 所有通路堵死 → 阻止建造 + 提示
- [ ] 路径变化 → 活跃敌人立即切换新路径
- [ ] 预览显示蓝色虚线新路径
- [ ] 封路预览显示红色 + 禁止图标

---

### Task 2.4：专用 TD 地图数据 + 加载

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-11 §5 全部 WHEN/THEN + 5 章地图特色表 |
| **复杂度** | 大（L） |
| **文件** | `js/data/td-data.js`, `tower-defense-manager.js`, `td-renderer.js` |
| **依赖** | Task 2.3（半封路） |
| **输入** | 规范 §5 地图数据格式 + 5 章地图特色 |

**实现内容**：
1. **td-data.js**:
   - 新增 `TDMapData` 全局变量：5 章地图 terrain 二维数组、spawnPoints、townHall、strategicSpots
   - ch1_plains: 24×16, 1 出生点, 开阔
   - ch2_pass: 24×16, 2 出生点, 窄道+包抄
   - ch3_river: 24×16, 2 出生点, 河流+桥梁
   - ch4_castle: 24×16, 3 出生点, 多层城墙
   - ch5_camp: 24×16, 4 出生点, 迷宫四面围攻
2. **Manager**:
   - `_loadChapterMap(chapterId)` 方法
   - 波次开始时从 spawnPoints 随机选 1-2 个生成敌人
   - emit `td:map_loaded` 事件
   - 地图缺失回退到默认网格
3. **Renderer**:
   - `drawTerrain()` 方法：可建造=浅色、不可建造=深色纹理、道路=路面纹理
   - 出生点方向箭头标记

**输出**：
- td-data.js: 5 张完整地图数据
- Manager: 地图加载逻辑
- Renderer: 地形渲染方法

**验证**：
- [ ] 进入 Ch1 → 加载 ch1_plains 地图, 1 个出生点
- [ ] 进入 Ch5 → 加载 ch5_camp 地图, 4 个出生点
- [ ] 不可建造区域 → 无法放塔
- [ ] 出生点有箭头标记
- [ ] A* 寻路正常工作于新地图
- [ ] 地图缺失 → 回退默认 + Toast

---

### Task 2.5：战略要地高亮

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-12 §5 全部 WHEN/THEN |
| **复杂度** | 小（S） |
| **文件** | `td-renderer.js`, `tower-defense-panel.js`, `tower-defense-manager.js` |
| **依赖** | Task 2.4（专用地图，提供 strategicSpots 数据） |
| **输入** | TDMapData[N].strategicSpots |

**实现内容**：
1. **Renderer**:
   - `drawStrategicSpots(ctx, spots, towers)` — 半透明金色脉冲高亮
   - 已有塔的格子不显示
   - 坐标超出地图 → 忽略
2. **Manager**:
   - `_state.settings.showStrategicSpots` 持久化（默认 true）
   - `getSettings()` / `toggleStrategicSpots()` 方法
   - 存档迁移：缺失 settings → 初始化 `{ showStrategicSpots: true }`
3. **Panel**:
   - 设置中"塔位推荐"开关

**输出**：
- Renderer: `drawStrategicSpots()` 方法
- Manager: settings 管理
- Panel: 设置开关

**验证**：
- [ ] 首次进入地图 → 推荐位置金色脉冲
- [ ] 在推荐位置建塔 → 高亮消失
- [ ] 关闭"塔位推荐" → 不再显示
- [ ] strategicSpots 坐标超出 → 忽略不报错

---

## 3. Phase 3 — 深度扩展（CAP-TDE-13 ~ CAP-TDE-15）

> **目标**：新增塔进化、武将羁绊、Boss 专属机制三大深度系统。

### Task 3.1：塔进化系统

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-13 §6 全部 WHEN/THEN |
| **复杂度** | 大（L） |
| **文件** | `tower-defense-manager.js`, `tower-defense-panel.js`, `td-renderer.js` |
| **依赖** | Phase 2 完成 |
| **输入** | TDEvolutionData（已在 td-data.js）, 数值规范 §7 |

**实现内容**：
1. **Manager**:
   - `evolveTower(uid, path)` 方法：
     - 检查 tower.level == 5 && evolution == null
     - 检查资源是否足够（读 TDEvolutionData[tower.type][path].cost）
     - 扣除资源
     - tower.evolution = path, tower.type = 进化 ID
     - 替换塔属性（ATK, Range, AS, Special）
     - emit `td:tower_evolved`
   - `_sellTower()` 修改：进化塔返还包含 evolutionCost
   - `_checkWinRate()` 使用进化后 DPS
   - 存档迁移：塔实例无 evolution → 设为 null
2. **Panel**:
   - Lv5 塔信息面板新增"进化"按钮
   - 点击显示 2 条路线预览：名称 + 效果 + 费用
   - 资源不足按钮灰显 + 显示差额
   - 已进化塔显示标记 + 进化后属性
3. **Renderer**:
   - 12 种进化塔的外观变化（颜色/装饰变更）
   - `drawTower()` switch 扩展进化 ID

**输出**：
- Manager: `evolveTower()`, 出售/胜率计算修改, 存档迁移
- Panel: 进化面板 UI
- Renderer: 12 种进化塔外观

**验证**：
- [ ] Lv5 塔点击 → 显示进化按钮
- [ ] 选择路线 A → 扣费 + 属性替换 + type 更新
- [ ] 已进化 → 无法切换路线
- [ ] 出售进化塔 → 返还含进化费
- [ ] 神射塔 → 优先攻击 Boss
- [ ] 箭雨塔 → 溅射 1.0 格
- [ ] 旧存档 Lv5 塔 → evolution=null

---

### Task 3.2：武将羁绊系统

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-14 §6 全部 WHEN/THEN |
| **复杂度** | 大（L） |
| **文件** | `tower-defense-manager.js`, `tower-defense-panel.js` |
| **依赖** | Phase 2 完成 |
| **可并行** | 与 Task 3.1 并行 |
| **输入** | TDBondData（已在 td-data.js）, 数值规范 §8 |

**实现内容**：
1. **Manager**:
   - `_battle.activeBonds = []` 运行时羁绊列表
   - `_checkBonds()` 方法：遍历 TDBondData, 检查已部署武将是否满足 requiredCount
   - 羁绊激活时 → 对目标应用属性加成（乘法叠加）
   - 羁绊解除时（成员阵亡） → 撤销加成
   - 复活后重新检测
   - 多羁绊同时生效 → 乘法叠加
   - 自动防守模式 → 默认激活（不检查存活）
   - emit `td:bond_activated` / `td:bond_deactivated`
2. **Panel**:
   - 武将派驻面板：羁绊信息展示
   - 已激活羁绊高亮
   - 差一人提示"再部署 X 即可激活 Y"
   - 未拥有武将灰显

**输出**：
- Manager: `_checkBonds()`, 属性加成/撤销逻辑
- Panel: 羁绊面板 UI

**验证**：
- [ ] 部署刘备+关羽+张飞 → 桃园结义激活, ATK+15%, DEF+15%, CD-20%
- [ ] 关羽阵亡 → 桃园结义解除, 属性恢复
- [ ] 关羽复活 → 重新激活
- [ ] 同时满足桃园+五虎 → 两个羁绊效果叠加
- [ ] 武将派驻面板正确显示羁绊状态
- [ ] TDBondData 引用不存在 hero → 忽略该羁绊

---

### Task 3.3：Boss 专属机制

| 项目 | 内容 |
|------|------|
| **规范引用** | CAP-TDE-15 §6 全部 WHEN/THEN（5 种 Boss） |
| **复杂度** | 超大（XL） |
| **文件** | `tower-defense-manager.js`, `td-renderer.js` |
| **依赖** | Task 3.1（进化塔中的侦测能力用于司马懿） |
| **输入** | TDBossSkillData（已在 td-data.js）, 数值规范 §9 |

**子任务拆分**：

#### Task 3.3a：Boss 基础框架

**实现内容**：
1. Boss 实例新增 `bossSkillTimer`, `bossState` 字段
2. `_tickBossAI(boss, dt)` 主方法：根据 skillType 分发
3. Boss 波次预览面板：名称 + 机制简述
4. Boss 技能预告动画框架（1.5s 预告）
5. Boss 专属击杀动画（叠加 CAP-TDE-04 震屏）
6. emit `td:boss_skill`, `td:boss_defeated`
7. 暂停中 bossSkillTimer 冻结
8. 倍速下 bossSkillTimer 缩放

#### Task 3.3b：张角 — 召唤术

- 每 15s 召唤 2 个黄巾兵（HP=baseHp×0.5, ATK=baseAtk×0.5）
- 上限 6 同存，达上限不召唤
- 渲染：召唤时张角双手发光 + 小兵从地面升起

#### Task 3.3c：吕布 — 冲锋

- 每 20s 直线冲锋 3 格
- 穿过第 1 道墙（不破坏）
- 路径建筑受 ATK×3 伤害
- 冲后自晕 2s
- 渲染：蓄力举戟 → 冲锋拖影

#### Task 3.3d：曹操 — 光环

- 持续检测 3 格半径内敌人
- 范围内 ATK+40%, Speed+20%
- 离开范围 buff 消失
- 曹操死亡 → 所有 buff 移除
- 渲染：曹操周围半透明红色光环

#### Task 3.3e：关羽 — 扇形斩

- 每 12s 前方 120° 2 格扇形
- 对建筑造成 min(ATK×3, maxHP×30%) 伤害
- 渲染：月牙刀光特效

#### Task 3.3f：司马懿 — 分身

- 每 30s 创建 2 分身（HP×0.40, ATK×0.60）
- 分身不用技能
- 无烽火台/天眼台 → 外观完全相同
- 有侦测 → 本体标记
- 击杀本体 → 分身消散
- 渲染：分身消散烟雾特效

**输出**：
- Manager: `_tickBossAI()` + 5 种 Boss 具体逻辑
- Renderer: 5 种 Boss 技能特效

**验证**：
- [ ] Ch1 Boss 张角：每 15s 召唤, ≤6 同存
- [ ] Ch2 Boss 吕布：冲锋 3 格 + 穿墙 + 自晕 2s
- [ ] Ch3 Boss 曹操：光环 buff 范围正确, 死亡时 buff 全移除
- [ ] Ch4 Boss 关羽：扇形伤害 ≤ maxHP×30%
- [ ] Ch5 Boss 司马懿：分身辨识 + 击杀本体分身消散
- [ ] Boss 技能预告 1.5s 可见
- [ ] TDBossSkillData 缺失 → 回退基线 Boss

---

## 4. Phase Final — 存档迁移 + 集成验证

### Task 4.1：存档格式迁移

| 项目 | 内容 |
|------|------|
| **规范引用** | §7 存档格式扩展 全部迁移规则 |
| **复杂度** | 中（M） |
| **文件** | `tower-defense-manager.js` |
| **依赖** | Phase 1~3 全部完成 |
| **输入** | §7.2 旧存档迁移逻辑表 |

**实现内容**：
1. `init(saved)` 中集中检测并补全所有缺失字段
2. 迁移逻辑按 §7.2 表逐条实现
3. MAX_ASSIGNED_HEROES 统一为 3（从 TD_CONSTANTS 修改）
4. 废弃 dailyChallengeCount 字段（已部分实现，验证完整性）
5. getState() 输出包含 stamina, settings, tower.evolution

**输出**：
- Manager: 完整的存档迁移逻辑

**验证**：
- [ ] 加载无 stamina 字段存档 → stamina = MAX
- [ ] 加载有 dailyChallenges 存档 → 正确转换
- [ ] Lv5 塔无 evolution → 设为 null
- [ ] 无 settings → 初始化默认值
- [ ] assignedHeroes 长度 2 → 兼容第 3 空槽

---

## 5. 依赖关系图

```
Phase 1（可内部并行）:
  Task 1.1 (暂停)     ──────────────────┐
  Task 1.2 (体力 UI)  ────┐             │
  Task 1.3 (飘字分级)  ──┐ │             │
  Task 1.4 (击杀反馈)  │ │ │             │
  Task 1.5 (技能释放) ←┘ │ │             │
  Task 1.6 (连杀加成)    │ │             │
  Task 1.7 (练习模式) ←──┘ │             │
                           ↓             ↓
Phase 2（顺序链）:
  Task 2.1 (紧急技能 UI)       ←── Phase 1 完成
  Task 2.2 (建造松绑)         ←── Task 1.1
  Task 2.3 (半封路)           ←── Task 2.2
  Task 2.4 (专用地图)         ←── Task 2.3
  Task 2.5 (战略要地)         ←── Task 2.4
                           ↓
Phase 3（部分可并行）:
  Task 3.1 (塔进化)     ←── Phase 2 完成  ─┐
  Task 3.2 (武将羁绊)   ←── Phase 2 完成  ─┤ 可并行
  Task 3.3 (Boss 机制)  ←── Task 3.1      ─┘
      ├─ 3.3a (基础框架)
      ├─ 3.3b (张角) ←── 3.3a
      ├─ 3.3c (吕布) ←── 3.3a
      ├─ 3.3d (曹操) ←── 3.3a  ← 可并行
      ├─ 3.3e (关羽) ←── 3.3a
      └─ 3.3f (司马懿) ←── 3.3a + 3.1(天眼台)

Phase Final:
  Task 4.1 (存档迁移) ←── Phase 3 完成
```

### 并行机会总结

| 阶段 | 可并行的任务组 |
|------|--------------|
| Phase 1 | {1.1} ‖ {1.2, 1.7} ‖ {1.3, 1.4, 1.6} ‖ {1.5 等待 1.3} |
| Phase 2 | {2.1} ‖ {2.2 → 2.3 → 2.4 → 2.5} |
| Phase 3 | {3.1} ‖ {3.2}; 然后 {3.3b} ‖ {3.3c} ‖ {3.3d} ‖ {3.3e} ‖ {3.3f} |

---

## 6. 复杂度估算

| Task | 名称 | 复杂度 | 估算（Agent 轮次） |
|------|------|--------|-------------------|
| 1.1 | 暂停/恢复 | M | 1 |
| 1.2 | 体力 UI | S | 1 |
| 1.3 | 飘字分级 | S | 1 |
| 1.4 | 击杀反馈 | M | 1–2 |
| 1.5 | 技能释放 UI | M | 1–2 |
| 1.6 | 连杀加成 | S | 1 |
| 1.7 | 练习模式 | S | 1 |
| 2.1 | 紧急技能 UI | L | 2 |
| 2.2 | 建造松绑 | M | 1 |
| 2.3 | 半封路 | L | 2–3 |
| 2.4 | 专用地图 | L | 2–3 |
| 2.5 | 战略要地 | S | 1 |
| 3.1 | 塔进化 | L | 2–3 |
| 3.2 | 武将羁绊 | L | 2 |
| 3.3 | Boss 机制 | XL | 4–6 |
| 4.1 | 存档迁移 | M | 1 |
| **总计** | | | **22–30 轮次** |

---

## 7. 最终验证清单

### 7.1 按 CAP 交叉验证

每个 CAP 的所有 WHEN/THEN 场景必须至少被一个 Task 的验证覆盖：

| CAP | Task(s) | WHEN/THEN 场景数 | 覆盖 |
|-----|---------|-----------------|------|
| TDE-01 速度控制 | 1.1 | 6 | 全部 |
| TDE-02 体力系统 | 1.2 | 8 | 全部 |
| TDE-03 飘字 | 1.3 | 7 | 全部 |
| TDE-04 击杀反馈 | 1.4 | 5 | 全部 |
| TDE-05 技能释放 | 1.5 | 8 | 全部 |
| TDE-06 连杀 | 1.6 | 7 | 全部 |
| TDE-07 练习模式 | 1.7 | 5 | 全部 |
| TDE-08 紧急技能 | 2.1 | 10 | 全部 |
| TDE-09 建造松绑 | 2.2 | 5 | 全部 |
| TDE-10 半封路 | 2.3 | 5 | 全部 |
| TDE-11 专用地图 | 2.4 | 5 | 全部 |
| TDE-12 战略要地 | 2.5 | 5 | 全部 |
| TDE-13 塔进化 | 3.1 | 8 | 全部 |
| TDE-14 武将羁绊 | 3.2 | 8 | 全部 |
| TDE-15 Boss 机制 | 3.3a–f | 15+ | 全部 |

### 7.2 跨能力集成验证

| # | 场景 | 涉及 CAP |
|---|------|---------|
| I-1 | 3× 速度 + 暂停 → 恢复后继续 3× | TDE-01 |
| I-2 | 3× 速度下蓄力 → 手动释放 → 金色飘字 → 连杀 | TDE-01, 05, 03, 06 |
| I-3 | 练习模式 + 连杀 → 金币加成按 25% 缩减后应用 | TDE-07, 06 |
| I-4 | Boss 击杀 → 震屏 + 连杀计入 + 金币粒子 | TDE-04, 06, 15 |
| I-5 | 进化塔（号令台路线B） → 武将 CD-15% → 羁绊叠加 | TDE-13, 14 |
| I-6 | 紧急技能飘字显示 + 同时连杀 | TDE-08, 03, 06 |
| I-7 | 半封路迷宫 + 战略要地 → A* 性能 < 5ms | TDE-10, 12 |
| I-8 | 司马懿分身 + 天眼台（进化） → 本体标记 | TDE-15, 13 |
| I-9 | 旧存档加载 → 全部新字段正确初始化 → 功能正常 | 4.1 + 全部 |
| I-10 | 50 实体 + 15 飘字 + 30 粒子 → FPS ≥ 30 | TDE-03, 04 + 性能 |

### 7.3 非功能验证

| # | 指标 | 标准 | 测试方法 |
|---|------|------|---------|
| N-1 | Canvas FPS | ≥ 30 FPS (50 实体 + 15 飘字 + 30 粒子) | Chrome DevTools Performance |
| N-2 | A* 寻路 | < 5ms | console.time 在 pathfinding 中 |
| N-3 | 离线体力恢复 | 误差 ≤ ±30s | 模拟离线后检查 |
| N-4 | 存档兼容 | 旧存档无数据丢失 | 构造各版本旧存档测试 |
| N-5 | scaledDelta | 钳位到 ≤ 0.1 | 3× + 模拟高 dt 验证 |
