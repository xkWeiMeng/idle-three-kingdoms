# Changelog

本文件记录通过 SDD 流程完成的功能变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/)。

## [Unreleased]

### Added

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
