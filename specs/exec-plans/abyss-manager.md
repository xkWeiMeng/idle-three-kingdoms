# 执行计划：AbyssManager 审计、修复与测试

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联规范** | [specs/services/abyss-manager.md](../services/abyss-manager.md) |
| **系统契约** | [specs/system/core-contracts.md](../system/core-contracts.md) |
| **关联产品规范** | [specs/product-specs/abyss-loot-explosion.md](../product-specs/abyss-loot-explosion.md) |
| **创建** | 2026-04-14 |

---

## 概览

AbyssManager 是**反向工程规范**——代码已存在，规范从代码逆向提取。本计划聚焦五件事：

1. **逐场景审计**：逐能力验证代码与规范 18 个能力的 WHEN/THEN 场景完全对齐
2. **修复已知违规**：`EquipmentManager._inventory.push()` → `addToInventory()`
3. **注册核心契约**：在 core-contracts.md 中注册 AbyssManager（服务表、事件、存档 key、初始化/tick 顺序、跨模块权限）
4. **测试骨架生成**：创建 `tests/abyss-manager.test.html` 浏览器测试文件
5. **漂移验证**：最终 spec ↔ code 一致性确认

---

## 依赖关系图

```
T1.1（代码-规范对齐审计）
  │
  ├──▶ T2.1（修复神话装备入库违规）
  │       │
  │       └──▶ T2.2（回归验证）
  │
  ├──▶ T3.1（core-contracts 注册 AbyssManager）── 可与 T2.x 并行
  │
  └──▶ T4.1（测试骨架生成）── 可与 T2.x / T3.1 并行
         │
         └──▶ T5.1（最终漂移验证）── 等待 T2.2 + T3.1 + T4.1 全部完成
```

- **T1.1** 无前置依赖，立即可执行
- **T2.1 → T2.2** 严格顺序
- **T3.1** 与 T2.x 无依赖，可并行
- **T4.1** 与 T2.x / T3.1 无依赖，可并行
- **T5.1** 等待所有前置完成后执行

---

## 阶段 1：代码-规范对齐审计

> 目标：确认现有代码覆盖规范全部 WHEN/THEN 场景，记录所有偏差。

### 任务 T1.1 — 逐能力 WHEN/THEN 场景对齐检查

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 1–18 全部 WHEN/THEN 场景 |
| **输入** | `js/modules/abyss-manager.js`（~523 行）、`js/data/abyss.js`（~223 行）、`specs/services/abyss-manager.md` |
| **输出** | 对齐报告（逐能力 PASS/FAIL + 偏差说明），保存到 `ai-docs/abyss-manager-alignment.md` |
| **约束** | 仅审计，不修改代码；已知技术债务（_inventory.push）标记为"已知，T2 修复"而非 FAIL |

**验证**：

- 18 个能力全部被检查
- 每个 WHEN/THEN 场景有明确的 PASS 或 FAIL 标记
- 所有 FAIL 场景附带代码行号和偏差描述
- 已知违规（能力 13 神话装备 `_inventory.push`）标记为"已知，T2.1 修复"

**检查要点速查表**：

| 能力 | 关键验证点 | 代码位置 |
|------|-----------|---------|
| 1 初始化与存档恢复 | `saved.abyss` 提取；`currentRun=null` 不恢复；遍历 AbyssData 补缺实例 | `init()` L12-31 |
| 2 系统解锁检查 | `unlocked===false` 时检查 `stage_4_10`；`BattleManager` undefined 防御；toast 消息 | `onTick()` L34-49 |
| 3 单深渊解锁检查 | 按 `unlockCondition.stage` 检查；不存在的 abyssId → false；BattleManager undefined → false | `isAbyssUnlocked()` L53-59 |
| 4 冷却（已禁用） | `isOnCooldown` 始终 false；`getCooldownRemaining` 始终 0 | L62-68 |
| 5 进入深渊 | 5 项前置检查顺序（currentRun/data/unlock/team/cost）；jade→gold→iron 检查顺序；金币用 formatNumber | `enterAbyss()` L71-167 |
| 5a 构建队友单位 | TownManager 加成公式；SPD 不受加成；skill deepClone；template/stats 缺失跳过 | `enterAbyss()` L117-149 |
| 6 层设置 | Boss 从 floorData 构建；uid 前缀 `abyss_enemy_`；round/phase/timer 重置 | `_setupFloor()` L169-199 |
| 7 战斗推进 | `battleTimer += dt`；每 1.0s 一回合；补偿多回合；phase 非 fighting 不处理 | `_processCombat()` L201-209 |
| 8 回合执行 | SPD 降序 + 同速队友优先；CD 判定 `>=cooldown`；每行动后检查胜负；胜负立即终止 | `_executeRound()` L212-264 |
| 9 普通攻击 | 随机选目标；死亡免疫仅对普攻；log 格式含暴击标记；日志 FIFO 50 条 | `_performAttack()` L267-299 |
| 10 技能系统 | heal 自我治疗 `floor(atk×multiplier)`；buff 添加+重算；damage single/all/random3 | `_performSkill()` L302-349 |
| 11 伤害计算 | rand [0.9,1.1)；reduction 公式；保底 1；5% 暴击 ×1.5 | `_calcDamage()` L352-359 |
| 12 死亡免疫 | 仅普攻检查；isAlly+未用过+套装chance；触发→hp=1+标记；**技能致死不检查** | `_performAttack()` L275-289 |
| 13 层通关处理 | 层奖励即时发放；equipDrop 品质独立掷骰；mythic _inventory.push ⚠️；bestFloor 只增不减；30% 治疗 | `_handleFloorVictory()` L388-459 |
| 14 深渊完成 | 首通 cleared=false→true+奖励；ForgeManager 可选；phase='complete'；`abyss:completed` 事件 | `_handleAbyssComplete()` L462-486 |
| 15 深渊失败 | phase='defeat'；log 包含层数；`abyss:failed` 事件 | `_handleAbyssDefeat()` L488-494 |
| 16 清除 Run | `currentRun=null`；幂等安全 | `clearRun()` L497-499 |
| 17 状态查询 | `isUnlocked()`；`getCurrentRun()` 直接引用；`getInstance()` 直接引用；`getState()` 深拷贝排除 currentRun | L513-522 |
| 18 属性重算 | atkMod/defMod/spdMod 加法叠加；从 base 重算；保底 1 | `_recalcStats()` L362-373 |

**重点审计项**：

1. **能力 12 关键边界**：确认 `_performSkill` 中技能致死时**不检查**死亡免疫（规范明确要求仅普攻触发）
   - 检查 `_performSkill()` L340-348：`tgt.currentHp <= 0` 后直接 `isAlive=false`，无免疫检查 → **符合规范**
2. **能力 13 已知违规**：`_handleFloorVictory()` L428 `EquipmentManager._inventory.push(mythicEquip)` → 标记"已知，T2.1 修复"
3. **不变量 12（Buff 永不过期）**：确认代码中无 buff duration 递减逻辑 → 需检查 `_executeRound` 和 `_recalcStats`
4. **不变量 13（无最大回合限制）**：确认无 maxRound 检查

---

## 阶段 2：技术债务修复（神话装备入库违规）

> 目标：消除 AbyssManager 直接写入 `EquipmentManager._inventory` 的服务边界违规。

### 任务 T2.1 — AbyssManager 改用 `addToInventory` 调用

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 13（层通关处理）、规范 §跨模块依赖 ⚠️ 已知违规、core-contracts §服务边界 |
| **输入** | `js/modules/abyss-manager.js` 第 428 行 `EquipmentManager._inventory.push(mythicEquip)` |
| **输出** | 替换为 `EquipmentManager.addToInventory(mythicEquip)` 调用 |
| **前置** | T1.1 审计完成确认此为唯一违规点 |
| **约束** | 保持防御性检查；`addToInventory` 方法已在 `equipment-manager.js` L77 存在（无需新增） |

**前置确认**：`EquipmentManager.addToInventory(equip)` 已存在：
- `js/modules/equipment-manager.js` L77 定义
- `js/modules/battle-manager.js` L760-761 已使用
- `js/modules/tower-defense-manager.js` L1800-1805 已使用

**变更内容**：

```diff
  // js/modules/abyss-manager.js — _handleFloorVictory() 神话装备掉落段
- EquipmentManager._inventory.push(mythicEquip);
+ if (typeof EquipmentManager.addToInventory === 'function') {
+   EquipmentManager.addToInventory(mythicEquip);
+ }
```

**验证**：

```
WHEN 神话装备掉落触发
AND EquipmentManager.addToInventory 可用
THEN 调用 addToInventory(mythicEquip) 而非直接写入 _inventory
AND mythicEquip 正确加入背包（或溢出栏）

WHEN EquipmentManager.addToInventory 不可用
THEN 静默跳过，不报错（防御性检查）

WHEN 修改后全文搜索 abyss-manager.js
THEN 不再包含任何 `EquipmentManager._inventory` 引用
AND 不再包含任何 `._` 私有属性直接访问（除 this._state）
```

**修改文件**：
- `js/modules/abyss-manager.js` — `_handleFloorVictory()` 方法内（L428 附近）

---

### 任务 T2.2 — 回归验证

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 13 全部 WHEN/THEN 场景 |
| **输入** | T2.1 的修改结果 |
| **输出** | 回归验证通过确认 |
| **前置** | T2.1 |
| **约束** | 不引入新的技术债务 |

**验证**：

```
WHEN 第 5 层 mythicDrop 掷骰成功
THEN 神话装备正确生成（quality=6, unsellable=true）
AND 通过 addToInventory 入库（非直接 push）
AND run.droppedEquipment 包含该装备
AND inst.mythicDropCount 递增
AND emit toast:show 神话掉落消息

WHEN 装备背包已满
THEN 神话装备进入溢出栏（addToInventory 内部处理）
AND 不再像之前直接 push 导致超出背包上限

WHEN 浏览器中加载 index.html
THEN 控制台无 JS 错误
AND 深渊功能正常可进入
```

---

## 阶段 3：核心契约注册

> 目标：在 core-contracts.md 中完整注册 AbyssManager。

### 任务 T3.1 — core-contracts.md 新增 AbyssManager 条目

| 字段 | 值 |
|------|-----|
| **规范引用** | abyss-manager.md §初始化与Tick位置、§跨模块依赖、§事件契约 |
| **输入** | `specs/system/core-contracts.md`、`specs/services/abyss-manager.md` |
| **输出** | core-contracts.md 更新 6 处 |
| **前置** | T1.1（确认规范信息准确） |
| **约束** | 不修改现有服务条目顺序；新增内容与现有格式一致 |

**6 处变更明细**：

#### 3.1.1 — 服务表新增行

在 `§服务` 表格中（TowerDefenseManager 行之后）新增：

```markdown
| AbyssManager | 深渊副本挑战、多层连续战斗、掉落结算 | [specs/services/abyss-manager.md](../services/abyss-manager.md) |
```

#### 3.1.2 — 跨模块只读查询新增

在 `§通信方式 > 允许的跨模块只读查询` 中新增：

```markdown
- `AbyssManager` → `BattleManager.getClearedStages()` — 系统解锁 / 单深渊解锁检查
- `AbyssManager` → `HeroManager.getTeam()` / `HeroManager.getTemplate(id)` / `HeroManager.getHeroStats(uid)` / `HeroManager.getHeroByUid(uid)` — 队伍构建与套装检查
- `AbyssManager` → `TownManager.getAtkBonus()` / `getDefBonus()` / `getHpBonus()` — 建筑加成（可选依赖）
```

#### 3.1.3 — 跨模块写操作新增

在 `§通信方式 > 允许的跨模块写操作` 中新增：

```markdown
- `AbyssManager` → `ResourceManager.canAfford()` / `ResourceManager.spend()` / `ResourceManager.add()` — 入场费用、奖励发放
- `AbyssManager` → `EquipmentManager.generateDrop()` / `EquipmentManager.addToInventory()` — 装备掉落、神话装备入库
- `AbyssManager` → `ForgeManager.addBlueprint()` — 首通奖励图纸（可选依赖）
```

#### 3.1.4 — 事件契约新增

在 `§事件契约` 表格中（`td:*` 事件之后）新增：

```markdown
| `abyss:entered` | AbyssManager | UI | `{ abyssId }` | 成功进入深渊 |
| `abyss:floor_cleared` | AbyssManager | UI | `{ abyssId, floor, rewards }` | 单层通关 |
| `abyss:completed` | AbyssManager | UI | `{ abyssId, rewards, droppedEquipment }` | 深渊全通关 |
| `abyss:failed` | AbyssManager | UI | `{ abyssId, floor }` | 深渊挑战失败 |
```

#### 3.1.5 — 存档格式新增

在 `§存档格式` JSON 中新增：

```json
"abyss": "AbyssManager.getState()"
```

#### 3.1.6 — 初始化与 Tick 顺序新增

在 `§Manager 初始化顺序` 中新增（#10 TowerDefenseManager 之后）：

```
11. ForgeManager       ← 依赖 ResourceManager, EquipmentManager（锻造消耗）
12. AbyssManager       ← 依赖 ResourceManager, HeroManager, BattleManager, EquipmentManager, TownManager
```

在 `§Tick 注册顺序` 中新增（#6 EconomyManager 之后）：

```
7. ForgeManager.onTick(dt)        ← 锻造倒计时
8. TowerDefenseManager.onTick(dt) ← 塔防波次推进
9. AbyssManager.onTick(dt)        ← 深渊解锁检查 + 战斗推进
```

**验证**：

```
WHEN core-contracts.md 更新完成
THEN 服务表包含 AbyssManager 行
AND 跨模块只读查询包含 AbyssManager 3 条
AND 跨模块写操作包含 AbyssManager 3 条
AND 事件表包含 abyss:entered / abyss:floor_cleared / abyss:completed / abyss:failed
AND 存档格式包含 "abyss" key
AND 初始化顺序包含 AbyssManager 于 #12
AND Tick 顺序包含 AbyssManager 于 #9
AND 规范 prerequisite 中的 "core-contracts.md 需更新" 条件已满足
```

---

## 阶段 4：测试骨架生成

> 目标：创建浏览器可打开的测试 HTML 文件，覆盖 18 个能力的所有 WHEN/THEN 场景。

### 任务 T4.1 — 创建 `tests/abyss-manager.test.html`

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 1–18 全部 WHEN/THEN 场景 |
| **输入** | `specs/services/abyss-manager.md`（WHEN/THEN 场景）、`tests/battle-manager.test.html`（模板格式） |
| **输出** | `tests/abyss-manager.test.html` |
| **前置** | T1.1（确认规范场景准确） |
| **约束** | 纯 HTML + `<script>` 标签，无构建工具；浏览器直接打开运行；遵循 battle-manager.test.html 格式 |

**文件结构**：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>AbyssManager 规范测试</title>
  <!-- 样式同 battle-manager.test.html -->
</head>
<body>
  <h1>AbyssManager 规范测试</h1>
  <pre>规范引用：specs/services/abyss-manager.md</pre>
  <div id="results"></div>
  <div id="summary" class="summary"></div>

  <!-- 加载核心依赖 -->
  <script src="../js/core/constants.js"></script>
  <script src="../js/core/event-bus.js"></script>
  <script src="../js/core/utils.js"></script>
  <script src="../js/data/abyss.js"></script>
  <script src="../js/data/equipment.js"></script>
  <script src="../js/modules/abyss-manager.js"></script>

  <script>
  // 微型测试框架（同 battle-manager 模式：section/test/skip/assert/assertEqual）
  // Mock 依赖：BattleManager, HeroManager, ResourceManager, TownManager, EquipmentManager, ForgeManager
  // Mock 全局函数：getHeroSetBonuses, getMythicTemplate
  // Mock Math.random 控制随机

  // ===== 18 个能力对应的测试 section =====
  // section('能力 1：初始化与存档恢复')
  //   - test: saved 为 undefined（首次游戏）
  //   - test: 部分存档恢复 + 缺失深渊自动创建
  //   - test: currentRun 永不恢复
  // section('能力 2：系统解锁检查')
  //   - test: stage_4_10 已通关 → unlocked=true + toast
  //   - test: stage_4_10 未通关 → unlocked 保持 false
  //   - test: unlocked=true 时短路
  //   - test: BattleManager undefined 时不抛错
  // section('能力 3：单深渊解锁检查')
  //   - test: abyss_hulao 已解锁
  //   - test: abyss_chibi 未解锁
  //   - test: 不存在的 abyssId → false
  //   - test: BattleManager undefined → false
  // section('能力 4：冷却（已禁用）')
  //   - test: isOnCooldown 始终 false
  //   - test: getCooldownRemaining 始终 0
  // section('能力 5：进入深渊')
  //   - test: currentRun 已存在 → false + toast
  //   - test: invalid abyssId → false
  //   - test: 深渊未解锁 → false + toast
  //   - test: 队伍为空 → false + toast
  //   - test: jade 不足 → false + toast
  //   - test: gold 不足 → false + toast（含 formatNumber）
  //   - test: iron 不足 → false + toast
  //   - test: 所有条件满足 → true + 资源扣除 + run 初始化 + 事件
  // section('能力 5a：构建队友单位')
  //   - test: TownManager 加成应用公式
  //   - test: TownManager undefined 时加成为 0
  //   - test: skill deepClone 独立于模板
  //   - test: template undefined → 跳过
  // section('能力 6：层设置')
  //   - test: 第 1 层 Boss 属性正确
  //   - test: 第 5 层 Boss 有技能
  //   - test: round/phase/timer 重置
  // section('能力 7：战斗推进')
  //   - test: 1.0s → 1 回合
  //   - test: 2.5s → 2 回合 + 余 0.5
  //   - test: currentRun=null → 无操作
  //   - test: phase='complete' → 无操作
  // section('能力 8：回合执行')
  //   - test: SPD 降序行动
  //   - test: 同速队友优先
  //   - test: CD 达标使用技能
  //   - test: CD 未达标使用普攻
  //   - test: 击杀最后敌方 → 后续不行动 + floorVictory
  //   - test: 击杀最后队友 → 后续不行动 + abyssDefeat
  // section('能力 9：普通攻击')
  //   - test: 伤害扣血 + log 格式
  //   - test: 暴击 log 包含 💥
  //   - test: 击杀非队友目标 → isAlive=false
  //   - test: 队友致命 + 死亡免疫触发 → hp=1
  //   - test: 无存活目标 → 静默返回
  // section('能力 10：技能系统')
  //   - test: heal 自我回复
  //   - test: heal 不超过 maxHp
  //   - test: buff 添加 + 重算
  //   - test: damage single 目标
  //   - test: damage all 目标
  //   - test: damage random3 可重复
  //   - test: 技能致死 → 不触发死亡免疫
  // section('能力 11：伤害计算')
  //   - test: 标准公式验证（固定 random）
  //   - test: 暴击 ×1.5
  //   - test: 高防保底 1
  // section('能力 12：死亡免疫')
  //   - test: 普攻致命 + 免疫触发
  //   - test: deathImmunityUsed=true → 不检查
  //   - test: 敌方致命 → 不检查
  //   - test: 无套装 → 直接死亡
  //   - test: 技能致死 → 不检查（关键边界）
  // section('能力 13：层通关处理')
  //   - test: 层奖励即时发放 + 累计
  //   - test: equipDrop 品质独立掷骰
  //   - test: mythic 掉落 + 入库
  //   - test: bestFloor 只增不减
  //   - test: 30% HP 治疗不超上限
  //   - test: 最后一层 → handleAbyssComplete
  //   - test: 非最后层 → 推进下一层
  // section('能力 14：深渊完成')
  //   - test: 首通 → cleared + 奖励 + 图纸
  //   - test: 非首通 → 无首通奖励
  //   - test: ForgeManager undefined → 不抛错
  // section('能力 15：深渊失败')
  //   - test: phase='defeat' + log + 事件
  // section('能力 16：清除 Run')
  //   - test: currentRun 置 null
  //   - test: 幂等安全
  // section('能力 17：状态查询')
  //   - test: isUnlocked
  //   - test: getCurrentRun 直接引用
  //   - test: getInstance 直接引用
  //   - test: getInstance 不存在 → undefined
  //   - test: getState 深拷贝 + 排除 currentRun
  // section('能力 18：属性重算')
  //   - test: 单 buff 叠加
  //   - test: 多 buff 叠加
  //   - test: 负 buff 保底 1
  //   - test: 无 buff → base 值

  // 汇总
  </script>
</body>
</html>
```

**Mock 依赖清单**：

| Mock 对象 | 需要的方法/属性 | 用途 |
|-----------|----------------|------|
| `BattleManager` | `getClearedStages()` | 返回可控的已通关关卡列表 |
| `HeroManager` | `getTeam()`, `getTemplate(id)`, `getHeroStats(uid)`, `getHeroByUid(uid)` | 队伍构建、属性获取、套装检查 |
| `ResourceManager` | `canAfford(type, amount)`, `spend(type, amount)`, `add(type, amount)` | 资源检查与扣除 |
| `TownManager` | `getAtkBonus()`, `getDefBonus()`, `getHpBonus()` | 建筑加成 |
| `EquipmentManager` | `generateDrop(level, weights)`, `addToInventory(equip)`, `_inventory`（仅验证用） | 装备掉落 |
| `ForgeManager` | `addBlueprint(id)` | 首通图纸 |
| `getHeroSetBonuses(equipment)` | 全局函数 | 套装效果（死亡免疫） |
| `getMythicTemplate(id)` | 全局函数 | 神话模板查询 |
| `Math.random` | mockRandom/restoreRandom | 控制概率场景 |

**测试计数**：约 65 个 test case，覆盖规范中全部 WHEN/THEN 场景。

**验证**：

```
WHEN 在浏览器中打开 tests/abyss-manager.test.html
THEN 页面正常加载，无 JS 控制台错误
AND 所有 section 标题可见
AND 每个 test 显示 ✓（pass）、✗（fail）或 ⊘（skip）
AND 底部 summary 显示总数/通过/失败/跳过

WHEN 计数 test case
THEN 覆盖规范 18 个能力的全部 WHEN/THEN 场景
AND 每个场景至少对应一个 test case
```

---

## 阶段 5：最终漂移验证

> 目标：确认规范、代码、核心契约、测试四者一致。

### 任务 T5.1 — Spec ↔ Code ↔ Contracts 漂移检查

| 字段 | 值 |
|------|-----|
| **规范引用** | 全部能力 + 不变量 + 事件契约 |
| **输入** | T1.1 对齐报告 + T2.1 修复结果 + T3.1 契约更新 + T4.1 测试文件 |
| **输出** | 漂移验证通过确认，或发现需要修复的新偏差 |
| **前置** | T2.2 + T3.1 + T4.1 全部完成 |
| **约束** | 只读检查，不修改任何文件 |

**验证清单**：

| # | 检查项 | 预期结果 |
|---|--------|---------|
| 1 | `abyss-manager.js` 不包含 `EquipmentManager._inventory` | 违规已修复 |
| 2 | `abyss-manager.js` 中所有跨模块调用均在 core-contracts 允许列表中 | 无未注册调用 |
| 3 | core-contracts 服务表包含 AbyssManager | 已注册 |
| 4 | core-contracts 事件表包含 4 个 `abyss:*` 事件 | 已注册 |
| 5 | core-contracts 存档格式包含 `"abyss"` key | 已注册 |
| 6 | core-contracts 初始化顺序包含 AbyssManager (#12) | 已注册 |
| 7 | core-contracts Tick 顺序包含 AbyssManager (#9) | 已注册 |
| 8 | `tests/abyss-manager.test.html` 可在浏览器中打开且无加载错误 | 测试可运行 |
| 9 | 测试文件覆盖 18 个能力全部 WHEN/THEN 场景 | 完全覆盖 |
| 10 | 规范 `prerequisite` 中 "core-contracts.md 需更新" 条件已满足 | 可清除 prerequisite |
| 11 | AbyssData 3 个深渊的 floor/boss/reward 数据与规范表格一致 | 数据驱动验证 |
| 12 | 不变量 1-13 在代码中全部成立 | 全部 PASS |
| 13 | 规范中 `⚠️ 已知违规` 注释可更新为"已修复" | 债务清零 |

---

## 最终验证清单

完成所有任务后，以下条件必须全部满足：

- [ ] T1.1：`ai-docs/abyss-manager-alignment.md` 已生成，18 个能力全部 PASS（已知违规标记为 T2 修复）
- [ ] T2.1：`EquipmentManager._inventory.push(mythicEquip)` 已替换为 `addToInventory(mythicEquip)`
- [ ] T2.2：回归验证通过，深渊功能正常
- [ ] T3.1：core-contracts.md 包含 AbyssManager 的完整注册（服务表 + 只读查询 + 写操作 + 事件 + 存档 + 初始化/tick 顺序）
- [ ] T4.1：`tests/abyss-manager.test.html` 存在且浏览器可打开运行
- [ ] T5.1：规范 ↔ 代码 ↔ 契约 ↔ 测试四者无漂移
- [ ] 规范 `abyss-manager.md` 中 `prerequisite` 条件已满足（core-contracts 已更新）
- [ ] 规范 `abyss-manager.md` 中 `⚠️ 已知违规` 可标注为已修复
