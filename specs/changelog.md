# Changelog

本文件记录通过 SDD 流程完成的功能变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/)。

## [Unreleased]

### Added

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
