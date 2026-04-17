# Changelog

本文件记录通过 SDD 流程完成的功能变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/)。

## [Unreleased]

- **Emotional Rhythm Enhancement 情绪节奏强化** (`specs/game-prds/emotional-rhythm-enhancement.md`) — 2026-04-17
  - **战斗飘字增强** (CAP-ERH-01~03)：
    - MISS/闪避飘字：闪避时显示白色 "MISS!" 浮动文字
    - 终极技能特效：施放终极技能时显示金色技能名 + 0.3s 画面震动（4px 衰减）
    - 连杀播报：3连杀 "三连斩！"、5连杀 "五杀风暴！"、7+连杀 "神挡杀神！"
  - **抽卡演出差异化** (CAP-ERH-10~15)：
    - 新增 `js/ui/recruit-animation.js` 模块（504 行），按品质分级演出
    - Q1-Q2（白·普通/绿·良品）：无全屏动画，直接显示结果
    - Q3（蓝·稀有）：蓝色光芒卡牌翻转揭示（1.5s）
    - Q4（紫·史诗）：屏幕裂纹 → 大卡揭示 + 武将语录（2.5s）
    - Q5（橙·传说）：天道系统异常警告 → 故障特效 → 金色粒子揭示（4s）
    - 保底触发文字提示 "天命所归！"
    - 点击任意位置可跳过演出
    - 十连抽：按品质升序展示，最高品质获完整单抽演出
  - **离线收益趣味报告** (CAP-ERH-20~24)：
    - 离线 >5 分钟：显示趣味报告弹窗，含武将离线活动描述
    - 离线 1-5 分钟：静默发放奖励
    - 武将活动基于 `NpcDialogues.offlineActivities` 数据，含通用模板和 10+ 位武将专属文案
    - 资源汇总使用 `Utils.formatNumber()` 格式化
  - **新增文件**：`js/ui/recruit-animation.js`、`index.html` 添加对应 script 标签
  - **修改文件**：`battle-animations-canvas.js`、`battle-manager.js`、`recruit-panel.js`、`recruit-manager.js`、`main.js`、`npc-dialogues.js`、`css/main.css`
  - **视觉验收**：通过 Chrome DevTools 验证 Q3 蓝色动画、Q1 即时显示、离线报告弹窗均正常工作

- **Construction Worker System 建造工人系统 SDD 闭环**(`specs/product-specs/construction-worker-system.md`) — 2026-04-16
  - **回溯背景**：commit `8fd4cae` 实现了外围组件但核心 TownManager 逻辑缺失，本次补全闭环
  - **已有实现（8fd4cae）**：BuildQueueWidget UI (`js/ui/build-queue-widget.js`)、WORKER_CONFIG 常量 (`js/data/buildings.js`)、`ResourceManager.addMultiple()`、build-menu.js / town-panel.js 迁移到 `enqueueUpgrade()`
  - **本次补全（TownManager 核心）**：
    - 新增 `_state` 字段：`workers`、`firstBuildingCompleted`、`buildQueue`
    - 新增 13 个方法：`getWorkerCount()`、`getBuildQueue()`、`_checkWorkerUnlock()`、`_canEnqueue()`、`enqueueUpgrade()`、`_processQueue()`、`_validateQueueItem()`、`cancelQueueItem()`、`cancelActiveBuilding()`、`reorderQueue()`、`_processOfflineBuilds()`
    - 替换 `getMaxBuildSlots()` 返回 `_state.workers`（原为 town_hall >= 5 ? 2 : 1）
    - `startUpgrade()` 新增队列冲突检查
    - 存档迁移：旧存档自动推算工人数（基于城主府等级和建筑历史）
    - 离线队列推进：init 时追溯完成过期施工 + 按序启动队列任务
  - **Bug 修复**：`js/ui/town-world.js` 迁移 `startUpgrade()` → `enqueueUpgrade()`（原 commit 遗漏）
  - 测试文件 (`tests/construction-worker.test.html`)：57 个测试覆盖 8 个能力（工人解锁、队列入队、自动派工、取消退费、队列排序、兼容替换、离线推进、startUpgrade 冲突），57/57 通过
  - 规范状态：Active（产品规范，无需变更）

- **Core Contracts 系统规范全量审查 → Active** (`specs/system/core-contracts.md`) — 2026-04-15
  - 全量审查 15 个 Manager 服务规范与核心契约的一致性，修复 8 项缺陷
  - **P0 修复 (4)**：① 服务表补充 ParkingManager（14→15 个服务完整注册）；② 事件表补充 5 个 parking:* 事件（slot_unlocked, vehicle_acquired, vehicle_parked, vehicle_removed, income_collected）；③ 存档格式补充 `parking: ParkingManager.getState()` 键；④ 写操作白名单补充 ParkingManager → ResourceManager（canAffordMultiple/spendMultiple/add）
  - **P1 修复 (2)**：① 事件表补充 `equip:inventory_changed`（EquipmentManager 已在代码中 emit 2 处）；② 初始化顺序 #14 ParkingManager 依赖描述修正（EquipmentManager → TownManager）
  - **P2 修复 (1)**：导航节补全 15 个服务链接（原仅 3 个）
  - 存档格式键序与 main.js 对齐（merchant → forge → abyss → farm → parking → towerDefense）
  - 验证初始化顺序（15 项）与 main.js 行 39-53 完全一致
  - 验证 Tick 顺序（12 项）与 main.js 行 82-93 完全一致
  - 规范状态：Draft → **Active**

- **TownManager 服务规范 SDD 全流程** (`specs/services/town-manager.md`) — 2026-04-14
  - 逆向工程从现有代码（777 行）创建服务规范，12 个能力、79 个 WHEN/THEN 场景、8 条不变量
  - 能力覆盖：初始化与存档、建筑状态查询（7 个 API）、升级费用/时间查询、建筑升级（9 项前置检查）、施工加速、Tick 处理（施工完成 + 资源产出）、战斗加成查询（8 个 getter）、资源上限与产出率（6 个 API）、集市交易、建筑分类查询、道路网络 MST、碰撞网格代理
  - 经 spec-reviewer 审查修复 7 项（1×P0 + 4×P1 + 2×P2）：检查项计数修正、`_getUnlockedBuildingCount` 精确语义、`getBuildingState` 引用语义标注、core-contracts 方法名修正 + 事件注册 + 服务表链接、预留接口标注。规范提升为 Active
  - 执行计划 (`specs/exec-plans/town-manager.md`)：9 个任务 4 个阶段
  - 代码审计：79/79 场景 PASS，零修复（逆向规范与代码完全对齐）
  - 测试文件 (`tests/town-manager.test.html`)：87 个测试覆盖 12 个能力，87/87 通过
  - 漂移检测：零行为级漂移，修复 2 处 core-contracts 交叉引用（RM 写操作接口 + 3 个消费方只读查询）

- **AbyssManager 服务规范 SDD 全流程** (`specs/services/abyss-manager.md`) — 2026-04-14
  - 逆向工程从现有代码创建服务规范，18 个能力、76 个 WHEN/THEN 场景
  - 经 spec-reviewer 审查修复 5 P1 + 6 P2（死亡免疫范围、init/tick 顺序、core-contracts 前置声明、金币格式差异、并发战斗不变量、buff 永不过期、事件载荷语义等），规范提升为 Active
  - 执行计划 (`specs/exec-plans/abyss-manager.md`)：5 阶段 7 个任务
  - 代码审计 76/76 场景全 PASS
  - 测试文件 (`tests/abyss-manager.test.html`)：87 个测试覆盖 18 个能力 + 2 组集成测试，100% 场景覆盖率
  - Core Contracts 同步更新：服务注册、6 项只读查询授权、3 项写操作授权、4 个 abyss:* 事件、存档 key、初始化顺序 #13、Tick 顺序 #9
  - 漂移检测：13/13 检查项全 PASS，零漂移

### Fixed

- **神话装备入库绕过 EquipmentManager 公共 API** (`js/modules/abyss-manager.js`) — 2026-04-14
  - `EquipmentManager._inventory.push(mythicEquip)` → `EquipmentManager.addToInventory(mythicEquip)`
  - 修复前：直接操作私有数组 `_inventory`，绕过背包溢出保护和容量检查
  - 修复后：使用公共 API `addToInventory()`，与 BattleManager/TowerDefenseManager 保持一致

- **MerchantManager 服务规范 SDD 全流程** (`specs/services/merchant-manager.md`) — 2026-04-14
  - 逆向工程从现有代码创建服务规范，7 个能力、26 个 WHEN/THEN 场景
  - 经 spec-reviewer 2 轮审查（修复 2 P0 + 5 P1 + 5 P2 = 12 个问题），规范已 Active
  - 执行计划 (`specs/exec-plans/merchant-manager.md`)：5 个任务
  - 测试文件 (`tests/merchant-manager.test.html`)：26 个测试覆盖 7 个能力的 26 个 WHEN/THEN 场景
  - Core Contracts 同步更新：服务注册、事件契约、存档格式、初始化/Tick 顺序、跨模块写操作+只读查询授权
  - 漂移检测：3 处低严重度漂移已修复（初始化/Tick 顺序与 main.js 对齐）

### Fixed

- **`buyNormal`/`buyPermanent` 绕过 EquipmentManager 公共 API** (`js/modules/merchant-manager.js`) — 2026-04-14
  - `EquipmentManager._inventory.push(equip)` → `EquipmentManager.addToInventory(equip)`（2 处）
  - 修复前：直接操作私有数组，绕过溢出栏保护机制
  - 修复后：使用公共 API，正确处理背包溢出

- **`buyPermanent` 金币泄漏 Bug** (`js/modules/merchant-manager.js`) — 2026-04-14
  - `getMythicTemplate()` 检查移至 `ResourceManager.spend()` 之前
  - 修复前：模板不存在时金币已扣除、商品标记为已售（不可逆状态泄漏）
  - 修复后：模板不存在时直接返回 false，不扣金币、不改状态

- **Core Contracts 初始化/Tick 顺序与 main.js 不一致** (`specs/system/core-contracts.md`) — 2026-04-14
  - 全面对齐 Manager 初始化顺序（15 个条目）和 Tick 注册顺序（12 个条目）与 main.js 实际代码

- **FarmManager 服务规范 SDD 全流程** (`specs/services/farm-manager.md`) — 2026-04-14
  - 逆向工程从现有代码创建服务规范，14 个能力、62 个 WHEN/THEN 场景
  - 经 spec-reviewer 审查（修复 4 个 P1 + 4 个 P2 问题），规范已 Active
  - 执行计划 (`specs/exec-plans/farm-manager.md`)：5 个任务
  - 测试文件 (`tests/farm-manager.test.html`)：64 个测试覆盖 14 个能力，100% 场景覆盖率
  - 经 drift-detector 漂移检测：零运行时行为漂移，5 个文档级漂移已修复

### Fixed

- **`removeBug()` API 错误 (BUG-01/02)** (`js/modules/farm-manager.js`) — 2026-04-14
  - BUG-01: `ResourceManager.has('gold', 50)` → `ResourceManager.canAfford('gold', 50)`（has 方法不存在，运行时 TypeError）
  - BUG-02: `ResourceManager.add('gold', -50)` → `ResourceManager.spend('gold', 50, 'farming', 'bug_removal')`（add 的 amount<=0 守卫导致金币永远不被扣除）
  - 修复前：除虫功能完全不可用（P0 级 Bug）

- **`_tickReady` 和 `plant()` 未重置 `isReharvest` (BUG-03)** (`js/modules/farm-manager.js`) — 2026-04-14
  - `_tickReady` 枯萎重置补充 `plot.isReharvest = false`
  - `plant()` 播种初始化补充 `plot.isReharvest = false`
  - 修复前：韭菜枯萎后同田地种植新作物会错误使用 reharvestTime 而非 growthTime

- **`core-contracts` FarmManager 相关声明** (`specs/system/core-contracts.md`) — 2026-04-14
  - 服务表新增 FarmManager 条目
  - 跨模块写操作新增 FarmManager → ResourceManager 授权
  - 跨模块只读查询新增 FarmManager → TownManager.getState()
  - 事件契约表新增 15 个 farm:* 事件
  - 存档格式新增 `"farm"` 字段
  - 初始化顺序新增 #11 FarmManager
  - Tick 顺序新增 #7 FarmManager.onTick(dt)

### Added

- **FarmManager 服务规范** (`specs/services/farm-manager.md`) — 2026-04-14
  - 14 个能力：初始化/播种/生长枯萎/收获/浇水/施肥/除虫/购买种子/合成/料理/自动收获/制作肥料/出售作物/查询API
  - 62 个 WHEN/THEN 验收场景（含正常/边界/错误路径）
  - 依赖声明、事件契约、状态结构、不变量、辅助方法全部文档化

- **FarmManager 测试文件** (`tests/farm-manager.test.html`) — 2026-04-14
  - 64 个测试覆盖全部 14 个能力 = 14 个测试组
  - Mock 隔离策略：ResourceManager、TownManager、EconomyManager、EventBus.emit
  - Math.random 控制用于虫害触发和双倍收获的确定性测试
  - 100% 规范场景覆盖率

- **FarmManager 执行计划** (`specs/exec-plans/farm-manager.md`) — 2026-04-14
  - T1: 代码审计（62 场景逐一比对）
  - T2: core-contracts 同步
  - T3: 测试骨架生成
  - T4: 漂移检测
  - T5: 变更记录

- **ForgeManager 服务规范 SDD 全流程** (`specs/services/forge-manager.md`) — 2026-04-14
  - 逆向工程从现有代码创建服务规范，6 个能力、32 个 WHEN/THEN 场景
  - 经 spec-reviewer 审查修复 5P0 + 7P1：已知 Bug 标注、core-contracts 同步、模板缺失场景、精度差异说明等
  - 修复 6 处代码 Bug（见 Fixed 节）
  - 同步更新 core-contracts：服务表、初始化顺序、Tick 顺序、事件表、写操作白名单、只读查询白名单、存档格式
  - 执行计划 (`specs/exec-plans/forge-manager.md`)：5 个任务
  - 测试文件 (`tests/forge-manager.test.html`)：32 个测试覆盖 6 个能力的 32 个场景，100% 覆盖率
  - 漂移检测：0 功能性漂移，8 项文档漂移全部已修复

### Fixed

- **`getState()` 神话锻造信息不可见 (BUG-1+BUG-2)** (`js/modules/forge-manager.js`) — 2026-04-14
  - 修复判断条件：`job.isMythic`（从未设置）→ `job.quality === 6`
  - 修复字段映射：`job.blueprintId/progress/requiredTime`（不存在）→ `job.blueprintId/elapsedTime/totalTime`
  - 修复前：UI 神话锻造面板永远显示空，进度不可见

- **`_completeForge()` 违反模块边界 (BUG-3)** (`js/modules/forge-manager.js`) — 2026-04-14
  - `EquipmentManager._inventory.push(equip)` → `EquipmentManager.addToInventory(equip)`
  - 修复后锻造完成走标准背包流程（容量检查 → 溢出栏）

- **`_completeForge()` 模板缺失时僵尸任务 (BUG-3+)** (`js/modules/forge-manager.js`) — 2026-04-14
  - getMythicTemplate 返回 null 或无候选模板时，现在正确 splice 移除队列任务
  - 修复前：job.completed=true 但不从 queue 移除，永久阻塞锻造队列

- **forge-panel.js 事件名错误 (BUG-4)** (`js/ui/forge-panel.js`) — 2026-04-14
  - `forge:mythic_completed` → `forge:completed`（去重后改为 `forge:paused`）
  - `forge:mythic_paused` → `forge:progress`
  - 移除残留 `item.isMythic` 死代码条件

- **`startMythicForge()` 缺少 blueprintId 字段 (BUG-5)** (`js/modules/forge-manager.js`) — 2026-04-14
  - job 对象新增 `blueprintId` 字段存储原始图纸 ID
  - 使 `getState().mythicForge.blueprintId` 可用于 UI 的 `BlueprintData` 查找

### Changed

- **`specs/system/core-contracts.md` ForgeManager 全量注册** — 2026-04-14
  - 服务表新增 ForgeManager
  - 初始化顺序新增 #13 ForgeManager
  - Tick 注册顺序新增 #9 ForgeManager.onTick(dt)
  - 事件表新增 forge:started/completed/paused/progress
  - 跨模块写操作白名单新增 ForgeManager → ResourceManager/EquipmentManager
  - 只读查询白名单新增 ForgeManager → TownManager.getState()
  - 存档格式新增 "forge" key

- **HeroManager 服务规范 SDD 全流程** (`specs/services/hero-manager.md`) — 2026-04-13
  - 服务规范从 Draft 提升为 Active，经 REVIEW 修复 8 项问题：
    - `getAllHeroes()` → `getAll()`（匹配代码 12+ 处调用）
    - 返回值从「深拷贝」修正为「内部引用」（匹配实际行为）
    - `init(saved)` 参数描述修正为完整存档对象
    - `_state.heroes`/`_state.team` → `_heroes`/`_team`
    - 补充 `addToTeam` 无效 uid 守卫场景
    - 装备加成公式补充 `EquipTypeToStat` 映射和等级缩放
    - `getBattlePower` 补充 `Math.floor()`
    - 修正 C5-S2 赵云 baseAtk 数值（38→50）
  - 补充边界场景：`getHeroStats(无效uid)→null`、`getBattlePower(无效uid)→0`
  - 执行计划 (`specs/exec-plans/hero-manager.md`)：4 个任务
  - 测试文件 (`tests/hero-manager.test.html`)：25 个测试覆盖 6 个能力的 25 个 WHEN/THEN 场景

### Fixed

- **`removeFromTeam` 返回值与事件守卫** (`js/modules/hero-manager.js`) — 2026-04-13
  - 添加 `indexOf` 守卫：uid 不在队伍中时返回 `false` 且不触发 `hero:team_changed` 事件
  - uid 在队伍中时改用 `splice` 移除并返回 `true`
  - 修复前：无返回值（undefined），且始终触发事件

- **`core-contracts` HeroManager 写操作授权** (`specs/system/core-contracts.md`) — 2026-04-13
  - 允许的跨模块写操作列表新增 `HeroManager → ResourceManager.canAfford() / ResourceManager.spend() / ResourceManager.add()`
  - 覆盖升级消耗 EXP 和重复武将转换 EXP 两个场景


### Added

- **ResourceManager 服务规范** (`specs/services/resource-manager.md`) — 2026-04-10
  - 6 个能力：查询资源、增加资源、消耗资源、食物定时回复、每日登录奖励、统计追踪
  - 38 个 WHEN/THEN 验收场景（含正常/边界/错误路径）
  - 完整的存档兼容迁移规则（4 种存档格式兼容）
  - 经 spec-reviewer 审查（修复 9 处问题：资源上限数值、默认值、参数格式、缺失 API 等），规范已 Active
  - 经 drift-detector 漂移检测：零行为级漂移，38/38 场景与代码对齐

- **ResourceManager 测试文件** (`tests/resource-manager.test.html`) — 2026-04-10
  - 50 个测试覆盖全部 6 个能力 + 存档兼容 = 7 个测试组
  - Mock 隔离策略：CONSTANTS、TownManager、EconomyManager、EventBus
  - 100% 规范场景覆盖率

- **ResourceManager 执行计划** (`specs/exec-plans/resource-manager.md`) — 2026-04-10

### Fixed

- **`ResourceManager.setHighestStage` 回退守卫缺失** (`js/modules/resource-manager.js`) — 2026-04-10
  - 原代码无条件赋值 `this._stats.highestStage = stageId`，导致较低关卡 ID 覆盖较高值
  - 新增 `if (!current || stageId > current)` 守卫，仅在新 stageId 字典序更大时才更新

### Changed

- **`specs/system/core-contracts.md` 资源基础上限表同步** — 2026-04-10
  - gold: 10000 → 50000、wood: 500 → 2000、stone: 500 → 2000、iron: 300 → 1000
  - 与 `CONSTANTS.RESOURCE_BASE_CAP` 实际值对齐


- **深渊战利品爆落与连续刷本 (Abyss Loot Explosion)** — 2026-04-06
  - 产品规范 (`specs/product-specs/abyss-loot-explosion.md`)：4 个能力 (CAP-LOOT-01~04)
  - 执行计划 (`specs/exec-plans/abyss-loot-explosion.md`)：4 阶段 11 任务
  - **CAP-LOOT-01 粒子爆落**：击败 Boss 后满屏粒子散射（💰📖⛏️💎），rAF 驱动，2000ms 时长，上限 60 粒子
  - **CAP-LOOT-02 装备特效**：品质 4 紫色脉冲光晕、品质 5 金色光柱 + 闪光、品质 6 全屏红金闪烁 + 画面震动 + 延迟翻牌
  - **CAP-LOOT-03 连续刷本**：移除 24 小时冷却限制，纯资源消耗制；结算界面「再次挑战」「离开」按钮
  - **CAP-LOOT-04 结算重制**：5 阶段分步展示（标题→粒子→countUp→翻牌→总结），含跳过机制和 prefers-reduced-motion 适配
  - 新增 CSS 动画：`@keyframes shake/lightPillar/mythicFlash/countUpGlow/pulse-glow-red`
  - 新增装备揭示卡片组件：3D 翻转、品质光效分级
  - 新增事件：`abyss:loot_explosion_start/end`、`abyss:equip_reveal`、`abyss:settlement_skip`、`abyss:retry`

### Changed

- `AbyssData` 三个深渊 `cooldown: 86400 → 0`
- `AbyssManager.isOnCooldown()` 始终返回 `false`
- `AbyssManager.getCooldownRemaining()` 始终返回 `0`
- `AbyssManager.enterAbyss()` 移除冷却检查分支
- `AbyssPanel` 大幅重写：粒子系统、装备揭示、结算状态机、连续刷本 UI

- **装备数据扩展 (Equipment Data Expansion)** — 2026-04-06
  - 装备模板从 20 件扩展至 **352 件**普通装备（+ 12 件神话 = 364 件总计）
  - 金字塔品质分布：Q1(120) > Q2(96) > Q3(64) > Q4(40) > Q5(32) > Q6(12)
  - 武器包含历史名兵器：青龙偃月刀、丈八蛇矛、干将莫邪、越王勾践剑等
  - 坐骑包含周穆王八骏、昭陵六骏等历史名马
  - 饰品包含和氏璧、随侯珠、传国玉玺等历史宝物
  - 新增 `tools/gen_equipment_data.js` 装备数据生成器
  - 新增 `ai-docs/19-equipment-catalog.md` 装备系统完整文档

### Changed

- **装备掉落随机选择** — `generateDrop()` 从 `EquipmentData.find()` 改为 `filter()` + 随机选择，支持同品质多模板

- **城防塔防系统 (Tower Defense System)** — 2026-04-06
  - 产品规范 (`specs/product-specs/tower-defense-system.md`)：12 个能力（CAP-TD-01~12），58 个 WHEN/THEN 验收场景
  - 执行计划 (`specs/exec-plans/tower-defense-system.md`)：6 阶段 20 任务
  - 新增 `js/data/td-data.js`：16 种防御塔（4 时代×4 类型）、9 种敌人（地面/地下/空中+终极Boss）、20 波数值表（公式验算零误差）、4 时代科技树、Lv1-5 升级倍率表、波次奖励函数
  - 新增 `js/core/pathfinding.js`：A* 寻路（4 方向）+ 封路检测
  - 新增 `js/modules/tower-defense-manager.js`（~1560 行）：
    - 解锁条件：通关 stage_2_10 + 城主府≥3
    - 防御塔建造/升级/出售（科技/资源/位置/封路/容量 5 项检查）
    - 4 时代科技研究（前置、倒计时、离线补偿）
    - 武将派驻（最多 2 人，出征互斥，ATK 光环加成）
    - 双频率战斗架构：game:tick (1Hz) 驱动研究/自动防守 + rAF (~60Hz) 驱动实时战斗
    - 波次状态机：idle→prep(15s)→active→settlement
    - 敌人行为：A* 寻路、墙体攻击、空中直线飞行、地下隐身
    - 塔攻击特效：溅射/穿透/探测/多目标/贯穿光束/持续伤害/减速
    - 自动防守模式（70% 奖励）
    - 城主府 HP = 500 + 等级×200，轰炸者伤害×2
    - 11 个 EventBus 事件（td:unlocked/wave_started/wave_cleared/wave_failed/tower_built/tower_upgraded/tower_sold/enemy_killed/hero_assigned/research_started/era_unlocked）
  - 新增 `js/ui/tower-defense-panel.js`：Canvas 战场渲染、塔建造/升级/出售面板、科技研究面板、武将派驻面板、波次结算 Modal、3 步新手引导
  - 修改 `js/ui/town-world.js`：新增 `getCollisionGrid()` 方法
  - 修改 `js/modules/town-manager.js`：新增 `getCollisionGrid()` 委托方法
  - 修改 `index.html`：4 个 script 标签（core→data→modules→ui 顺序）
  - 修改 `js/main.js`：getFullState/initGame/onTick/UI init 集成
  - 更新 `specs/system/core-contracts.md`：TowerDefenseManager 服务注册、跨模块依赖、11 事件契约、存档键、初始化顺序
  - 测试文件 (`tests/tower-defense-manager.test.html`)：40+ 测试覆盖 12 能力，100% 场景覆盖
  - 经 spec-reviewer 3 轮审查（修复 6P0+6P1 问题：tick 架构、数值表、Boss 倍率、城主府费用、API 引用）
  - 经 drift-detector 漂移检测（修复 3 项：轰炸者特效、core-contracts 集成、参考表取整）

- **装备栏逻辑优化 (Equipment Inventory Optimization)** — 2026-04-06
  - 产品规范 (`specs/product-specs/equipment-inventory-optimization.md`)：5 个能力（CAP-INV-01–05），25+ 个 WHEN/THEN 验收场景
  - 执行计划 (`specs/exec-plans/equipment-inventory-optimization.md`)：3 阶段 10 任务
  - `js/data/equipment.js`：新增 `INVENTORY_DEFAULTS` 常量（容量、扩展步长、费用公式参数）
  - `js/modules/equipment-manager.js`：
    - 默认背包容量从 50 提升至 100（新存档）；旧存档保持原值
    - `getMaxCapacity()` — 返回有效上限（`_maxSlots + _expandedSlots`）
    - `expandInventory()` — 花费金币扩容 +10 格/次，最多 90 格，费用递增（×1.5）
    - `getExpandCost()` / `getExpandInfo()` — 扩容状态查询
    - `sortInventory()` — 按品质↓ → 强化等级↓ → UID↑ 排序
    - `batchSell(maxQuality)` — 按品质阈值批量出售（输入验证 1–5，保护已穿戴和神话装备）
    - 新事件 `equip:inventory_changed`（排序/批量售卖后触发 UI 刷新）
  - `js/ui/equipment-panel.js`：
    - 背包工具栏：扩容按钮、🔃排序按钮、🗑️售卖按钮
    - 内联操作按钮：点击装备卡片在下方展开装备/强化/出售按钮，替代原底部详情面板
    - 一键售卖 Modal：按品质阈值选择，显示可售数量和预估金币
    - 容量显示使用 `getMaxCapacity()` 动态值
  - `js/modules/merchant-manager.js`：满包检查从 `_maxSlots` 改为 `getMaxCapacity()`
  - `js/ui/settings-panel.js`：装备统计从 `_maxSlots` 改为 `getMaxCapacity()`

- **城镇道路系统 (Town Road System)** — 2026-04-06
  - 产品规范 (`specs/product-specs/town-road-system.md`)：6 个能力（C1–C6），29 个 WHEN/THEN 验收场景
  - 执行计划 (`specs/exec-plans/town-road-system.md`)：3 阶段 12 任务
  - `js/modules/town-manager.js`：新增道路系统核心
    - `_state.roads` 数组（`{gx, gy, usage}`）持久化道路数据
    - `recalcRoads()` — MST 道路网络生成（Prim 算法 + L 形曼哈顿路径）
    - `_getBuildingEntrance()` — 建筑入口点计算（底部中心优先，4 方向回退）
    - `_layPath()` / `_traceLPath()` — L 形路径铺设，优先复用已有道路格
    - `_bfsPath()` — BFS 绕行障碍物（最大 50 节点）
    - 建筑建造完成自动触发道路重算
  - `js/ui/town-world.js`：道路渲染层
    - `_roadGrid[40][40]` — 运行时使用频率网格
    - `_buildRoadGrid()` — 从 state.roads 构建渲染网格
    - `_drawRoads(ctx)` — usage 分级渲染（小路/中路/大道），淡入动画（2s）
    - 渲染管线：ground → **roads** → decorations → buildings → characters
    - `_filterDecorations()` 扩展排除道路格上的装饰
    - 建筑移动确认后触发道路重算
  - `js/ui/town-characters.js`：A* 寻路系统
    - `_findPath()` — A* 寻路（道路代价 1.0，地面代价 3.0，800 节点上限）
    - `_startWandering()` 集成 A* 路径计算（距离 > 2 格时启用）
    - `_moveToward()` 支持路径点跟随（waypoint following）
    - 短距离或 A* 失败时回退直线移动
  - 经 spec-reviewer 审查通过（修复 6 项问题：入口点矛盾、roadGrid 定义、建筑尺寸源等）
  - Chrome DevTools 视觉验收通过：道路网络可见、路宽分级、角色沿路行走

- **停车场系统 (Parking System)** — 2026-04-05
  - 产品规范 (`specs/product-specs/parking-system.md`)：10 个能力（CAP-PKG-01~10），26 个 WHEN/THEN 验收场景
  - 执行计划 (`specs/exec-plans/parking-system.md`)：5 阶段 10 任务
  - 新增 `js/data/parking.js`：10 级载具数据表（驽马→黄金跑车）、车位费用表、收入倍率
  - 新增 `js/modules/parking-manager.js`：`ParkingManager` 单例，含车位解锁、载具购买/停入/取出/出售、被动收入（`_incomeAccum` 模式）、离线结算
  - 新增 `js/ui/parking-panel.js`：`ParkingPanel` 浮层面板（3 标签页：车位/商店/车库）
  - 新增 `assets/img/vehicles/` 10 张 SVG 载具占位图 + `assets/img/buildings/parking_lot.svg`
  - `BuildingData` 新增 `parking_lot`（功能型建筑，5 级，requires town_hall:4 + stable:1）
  - `TownManager._getDefaultBuildings()` 新增 `parking_lot`
  - `TownWorld` 地图扩展 32×32 → 40×40，新增 `parking_lot` 建筑尺寸和默认位置
  - `BottomNav` 更多菜单新增停车场入口
  - `main.js` 注册 `ParkingManager`（init/onTick/getState）和 `ParkingPanel`
  - `_showOfflineRewards()` 集成停车场离线收入
  - 经 spec-reviewer 2 轮审查（修复 5P0+4P1 问题）、drift-detector 漂移检测（修复 3 项低中度漂移）
  - 测试文件 (`tests/parking-manager.test.html`)：45 个测试，45 通过，10/10 能力覆盖

### Added (previous)

- **StoryManager 服务规范** (`specs/services/story-manager.md`) — 2026-04-04
  - 10 个能力：init、onTick、getCurrentChapter/getCurrentScenes、markSceneSeen、advanceChapter、checkUnlock、_triggerMonologue、getDialogue、getProfile、getState
  - 39 个 WHEN/THEN 验收场景（含正常/边界/错误路径）
  - 完整的 Hero ID → Story ID 映射表（20 条）、章节对象结构、CharacterProfile 结构定义
  - 经 spec-reviewer 两轮审查后升为 Active（修复随机选取变量命名、`hero:added` 消费者矛盾、`init` 参数格式、`story:monologue` 载荷不同步等 4 个问题）
  - 经 drift-detector 漂移检测，规范与实现完全对齐（10/10 能力 PASS）

- **StoryManager 测试骨架** (`tests/story-manager.test.html`) — 2026-04-04
  - 覆盖 10 个能力的 39 个规范场景，共 42 个测试，100% 覆盖率

- **`core-contracts` 同步更新** (`specs/system/core-contracts.md`) — 2026-04-04
  - `story:monologue` 载荷补充 `ts` 字段（毫秒时间戳）
  - `hero:added` 消费者移除 StoryManager（实际通过 HeroManager.getAll() 实时查询，不订阅事件）

### Fixed

- **`StoryManager.getDialogue` 空数组边界** (`js/modules/story-manager.js`) — 2026-04-04
  - `CharacterDialogues[characterId][category]` 为空数组 `[]` 时，`randInt(0, -1)` 返回 0 导致返回 `undefined`（违反规范"返回 null"）
  - 新增 `if (lines.length === 0) return null;` 守卫

- **EquipmentManager 服务规范**(`specs/services/equipment-manager.md`) — 2026-04-09
  - 7 个能力：generateDrop、addToInventory、claimOverflow、equip、unequip、reinforce、sell、getEquipStatValue
  - 27 个 WHEN/THEN 验收场景（含正常路径、边界、错误路径）
  - 完整的 EquipmentInstance、EquipmentTemplate 数据模型定义
  - 品质表（强化上限、出售价格、费用公式、成长率）
  - 神话套装三套效果（霸王战魂、卧龙星辰、天命皇权）
  - 事件契约：equip:changed、toast:show
  - 经 2 轮 spec-reviewer 审查（第 1 轮发现 5 处问题已修复），规范已 Active
  - 经 drift-detector 漂移检测：零行为级漂移，27/27 场景与规范对齐

- **EquipmentManager 测试文件** (`tests/equipment-manager.test.html`) — 2026-04-09
  - 覆盖全部 27 个 WHEN/THEN 场景（GD、AI、CO、EQ、UQ、RF、SL、GV）
  - Mock 隔离策略：ResourceManager、HeroManager、EventBus、EquipmentData

- **AdventureManager 服务规范** (`specs/services/adventure-manager.md`) — 2026-04-04
  - 11 个能力：init、onTick、selectRegion、区域查询、setMode、挂机会话管理、挂机战斗处理、区域解锁、推荐区域、离线结算、getState
  - 27 个 WHEN/THEN 验收场景（含正常/边界/异常路径）
  - 完整的 IdleSession、IdleSessionSummary、SessionSummary、OfflineRewards 数据结构定义
  - 经 3 轮 spec-reviewer 审查，规范已 Active
  - 经 drift-detector 漂移检测，规范与实现对齐

- **`core-contracts` AdventureManager 规范链接** (`specs/system/core-contracts.md`) — 2026-04-04
  - 服务表从 `_待创建_` 更新为指向 `specs/services/adventure-manager.md`
  - 写操作授权表新增 AdventureManager 条目（canAfford/spend/add/get）

- **AdventureManager 测试骨架** (`tests/adventure-manager.test.html`) — 2026-04-04
  - 覆盖 11 个能力的 27 个规范场景

### Fixed

- **`AdventureManager.init` 不变量防御** (`js/modules/adventure-manager.js`) — 2026-04-04
  - 恢复存档时若 `adventureMode === 'idle'` 且 `idleSession === null`（游戏崩溃残留状态），将 `adventureMode` 重置为 `'push'`，维护会话与模式的一致性不变量

- **`AdventureManager.startIdleSession` 重复调用防御** (`js/modules/adventure-manager.js`) — 2026-04-04
  - `idleSession` 已存在时先调用 `endIdleSession()` 归档旧会话，再创建新会话，防止数据丢失

- **`AdventureManager._processIdleTick` 事件检查位置** (`js/modules/adventure-manager.js`) — 2026-04-04
  - 将 `session.battles % 10 === 0` 的检查从 while 循环外移入循环内，确保每满 10 场战斗立即发送 `adventure:session_update` 事件，修复单次大 dt 时可能漏发事件的问题

- **`core-contracts` AdventureManager 写操作授权** (`specs/system/core-contracts.md`) — 2026-04-04
  - 规范中 AdventureManager 调用 `ResourceManager` 的方法已在写操作授权表中注册

- **`EconomyManager 服务规范** (`specs/services/economy-manager.md`) — 2026-04-05
  - 12 个能力：事件记录、事件查询、净收入速率、分类统计、小时聚合查询、终身统计、预警检测、预警查询/关闭、智能建议、小时聚合写入、Tick 驱动、初始化与存档
  - 30 个 WHEN/THEN 验收场景（含正常/边界/异常路径）
  - 完整的 EconomyEvent、HourlyAggregate、Alert、Suggestion 数据结构定义
  - 经 drift-detector 漂移检测，规范已与现有实现对齐

### Fixed

- **`checkAlerts` 预警去重逻辑** (`js/modules/economy-manager.js`) — 2026-04-05
  - `resource_depleting` 条件满足时增加 `continue`，抑制同资源的 `negative_income` 预警
  - 修复了同一次检查会对同一资源同时生成两条冗余预警的问题

- **`getActiveAlerts` 排序** (`js/modules/economy-manager.js`) — 2026-04-05
  - 新增按 `timestamp` 升序排序，输出顺序与规范一致

- **`core-contracts` EconomyManager 规范链接** (`specs/system/core-contracts.md`) — 2026-04-05
  - 服务表第 8 行从 `_待创建_` 更新为指向规范文件的链接


  - 14 个能力：开始战斗、回合执行、单位行动、普通攻击、技能系统、伤害计算、Buff/Debuff、胜负判定、胜利结算、失败结算、自动推图、关卡导航、装备掉落、公共查询 API
  - 64+ WHEN/THEN 验收场景（含正常/异常/边界路径）
  - 完整的伤害计算公式、状态机图、依赖表、不变量
  - 经 spec-reviewer 审查通过（15 项问题全部修复后提升为 Active）

- **BattleManager 测试文件** (`tests/battle-manager.test.html`) — 2026-04-05
  - 42 个自动化测试覆盖全部 14 个能力的核心场景
  - Mock 框架：MockHeroManager、MockResourceManager、MockTownManager、MockFarmManager、MockEquipmentManager、MockBattleAnimations、mockRandom
  - 浏览器可直接运行

- **BattleManager 执行计划** (`specs/exec-plans/battle-manager.md`) — 2026-04-05

- **EquipmentManager.addToInventory()** (`js/modules/equipment-manager.js`) — 2026-04-05
  - 新增公共方法，处理背包满/溢出栏满逻辑
  - BattleManager 装备掉落改用此方法，消除服务边界违规

- **core-contracts 跨模块操作扩展** (`specs/system/core-contracts.md`) — 2026-04-05
  - 新增 BattleManager 的跨模块只读查询和写操作清单
  - 覆盖 HeroManager、ResourceManager、TownManager、FarmManager、EquipmentManager 的接口

### Fixed

- **BattleManager `_handleVictory` stageId 变量提升 bug** (`js/modules/battle-manager.js`) — 2026-04-05
  - `var stageId` 声明移至函数顶部，修复基础奖励 `ResourceManager.add()` 的 `detail` 参数为 `undefined` 的问题

- **BattleManager 装备掉落服务边界违规** (`js/modules/battle-manager.js`) — 2026-04-05
  - 兜底逻辑从直接写入 `EquipmentManager._inventory` 改为调用 `EquipmentManager.addToInventory(equip)`

- **BattleManager 规范依赖表修正** (`specs/services/battle-manager.md`) — 2026-04-05
  - `getHeroSetBonuses` 从 EquipmentManager 依赖移至全局函数（定义在 equipment-sets.js）

- **设计文档流程顺序** (`ai-docs/04-recruit-system.md`) — 修正招募流程描述，使品质判定和保底更新的顺序与实际实现一致
