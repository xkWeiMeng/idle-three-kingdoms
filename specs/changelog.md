# Changelog

本文件记录通过 SDD 流程完成的功能变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/)。

## [Unreleased]

### Added

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
