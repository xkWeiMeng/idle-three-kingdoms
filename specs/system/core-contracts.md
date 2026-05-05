---
status: Active
created: 2026-04-04
updated: 2026-04-15
author: AI (spec-architect)
reviewedBy: sdd-workflow (全量审查)
---

# 系统规范：核心契约

## 概述

定义幻想三国所有 Manager 共享的基础契约：资源类型、品质等级、事件协议、存档格式、通用数据结构。
所有服务规范**必须引用**本文件中的定义，不得自行重新定义。

## 服务

| 服务 | 职责 | 规范 |
|------|------|------|
| ResourceManager | 资源增减、上限、每日登录 | [specs/services/resource-manager.md](../services/resource-manager.md) |
| HeroManager | 武将获取、升级、编队、属性计算 | [specs/services/hero-manager.md](../services/hero-manager.md) |
| BattleManager | 战斗流程、回合计算、结算 | [specs/services/battle-manager.md](../services/battle-manager.md) |
| RecruitManager | 招募/抽卡、概率、保底 | [specs/services/recruit-manager.md](../services/recruit-manager.md) |
| EquipmentManager | 装备管理、强化、穿戴 | [specs/services/equipment-manager.md](../services/equipment-manager.md) |
| TownManager | 城镇建筑、资源上限覆盖 | [specs/services/town-manager.md](../services/town-manager.md) |
| AdventureManager | 冒险地图、离线收益 | [specs/services/adventure-manager.md](../services/adventure-manager.md) |
| EconomyManager | 经济追踪、预警、统计 | [specs/services/economy-manager.md](../services/economy-manager.md) |
| StoryManager | 剧情章节、对话、解锁 | [specs/services/story-manager.md](../services/story-manager.md) |
| TowerDefenseManager | 塔防波次、防御塔管理、科技研究 | [specs/product-specs/tower-defense-system.md](../product-specs/tower-defense-system.md) |
| ForgeManager | 锻造系统、普通/神话锻造、图纸管理 | [specs/services/forge-manager.md](../services/forge-manager.md) |
| MerchantManager | 商铺库存、刷新、购买 | [specs/services/merchant-manager.md](../services/merchant-manager.md) |
| FarmManager | 种植、生长、收获、料理 Buff | [specs/services/farm-manager.md](../services/farm-manager.md) |
| AbyssManager | 深渊副本挑战、多层Boss战、掉落结算 | [specs/services/abyss-manager.md](../services/abyss-manager.md) |
| ParkingManager | 停车场载具管理、被动收入、离线结算 | [specs/product-specs/parking-system.md](../product-specs/parking-system.md) |

## 服务边界

### 通信方式

所有 Manager 之间**禁止**直接引用。跨模块通信**唯一方式**为 `EventBus`。

```
Manager A  ──emit──▶  EventBus  ──on──▶  Manager B
```

**例外**：Manager 可直接调用以下核心工具：
- `Utils.*` — 纯函数，无副作用
- `CONSTANTS.*` — 只读常量

**允许的跨模块只读查询**（仅在需要计算时）：
- `HeroManager` → `EquipmentManager.getEquipment(uid)` — 计算装备加成
- `ResourceManager` → `TownManager.getResourceCap(type)` — 查询资源上限覆盖
- `BattleManager` → `HeroManager.getHeroStats(uid)` — 获取战斗属性
- `BattleManager` → `HeroManager.getTeam()` — 获取队伍成员列表
- `BattleManager` → `HeroManager.getTemplate(id)` — 获取武将模板（技能数据）
- `BattleManager` → `TownManager.getAtkBonus()` / `getDefBonus()` / `getHpBonus()` / `getExpBonus()` / `getDropRateBonus()` — 建筑加成（可选依赖）
- `AdventureManager` → `TownManager.getExpBonus()` / `getDropRateBonus()` / `getOfflineEfficiency()` — 冒险加成（可选依赖）
- `EconomyManager` → `TownManager.getBuildingLevel()` / `getUpgradeCost()` — 经济分析（可选依赖）
- `ParkingManager` → `TownManager.getOfflineEfficiency()` / `getBuildingLevel()` — 离线效率、停车场等级（可选依赖）
- `BattleManager` → `FarmManager.getActiveBuff()` — 料理 buff 加成（可选依赖）
- `FarmManager` → `TownManager.getState()` — 查询菜园/堆肥坑/种子铺建筑等级
- `MerchantManager` → `EquipmentManager.getInventory()` / `EquipmentManager.getMaxCapacity()` — 购买前检查背包容量
- `AbyssManager` → `BattleManager.getClearedStages()` — 系统解锁 / 单深渊解锁检查
- `AbyssManager` → `HeroManager.getTeam()` / `getTemplate(id)` / `getHeroStats(uid)` / `getHeroByUid(uid)` — 队伍构建、属性计算、套装检查
- `ForgeManager` → `TownManager.getState()` — 查询 weapon_workshop/blacksmith 建筑等级（可选依赖，typeof 守卫）
- `AbyssManager` → `TownManager.getAtkBonus()` / `getDefBonus()` / `getHpBonus()` — 建筑百分比加成（可选依赖）

> 这些查询仅用于**读取**，不得修改被查询方的状态。

**允许的跨模块写操作**（资源消耗与实体创建）：
- `RecruitManager` → `ResourceManager.canAfford()` / `ResourceManager.spend()` — 检查并扣除招募费用
- `RecruitManager` → `HeroManager.addHero(heroId)` — 将招募结果添加到玩家收藏
- `HeroManager` → `ResourceManager.canAfford()` / `ResourceManager.spend()` / `ResourceManager.add()` — 升级消耗 EXP、重复武将转换 EXP
- `EquipmentManager` → `ResourceManager.canAfford()` / `ResourceManager.spend()` — 强化消耗
- `TownManager` → `ResourceManager.canAfford()` / `ResourceManager.canAffordMultiple()` / `ResourceManager.spend()` / `ResourceManager.spendMultiple()` / `ResourceManager.add()` — 建筑建造消耗、资源产出、集市交易
- `BattleManager` → `ResourceManager.canAfford()` / `ResourceManager.spend()` / `ResourceManager.add()` — 食物消耗、奖励发放
- `AdventureManager` → `ResourceManager.canAfford()` / `ResourceManager.spend()` / `ResourceManager.add()` / `ResourceManager.get()` — 挂机粮草消耗检查、挂机战斗资源结算、推荐区域资源需求分析
- `TowerDefenseManager` → `ResourceManager.canAffordMultiple()` / `ResourceManager.spendMultiple()` / `ResourceManager.add()` — 建造/升级/研究消耗、波次奖励
- `TowerDefenseManager` → `HeroManager.getHeroStats()` / `HeroManager.getTeam()` / `HeroManager.getTemplate()` — 武将派驻属性
- `TowerDefenseManager` → `TownManager.getBuildingLevel()` / `TownManager.getCollisionGrid()` — 城主府等级、碰撞网格
- `TowerDefenseManager` → `EquipmentManager.addToInventory()` — 波次装备掉落
- `BattleManager` → `ResourceManager.addBattleCount()` / `ResourceManager.setHighestStage()` — 统计更新
- `BattleManager` → `HeroManager.addHero(heroId)` — 首通武将奖励
- `BattleManager` → `EquipmentManager.addToInventory(equip)` — 装备掉落加入背包
- `FarmManager` → `ResourceManager.canAfford()` / `ResourceManager.spend()` / `ResourceManager.add()` / `ResourceManager.canAffordMultiple()` / `ResourceManager.spendMultiple()` — 除虫扣金、收获资源发放、购买种子、出售作物
- `FarmManager` → `EconomyManager.logEvent()` — 可选经济日志记录（typeof 守卫）
- `MerchantManager` → `ResourceManager.canAfford()` / `ResourceManager.spend()` — 购买扣金币（gold）、手动刷新扣玉璧（jade）
- `MerchantManager` → `EquipmentManager.addToInventory()` — 购买装备添加背包
- `ForgeManager` → `ResourceManager.canAfford()` / `ResourceManager.spend()` — 普通锻造一次性扣资源、神话锻造持续消耗
- `ForgeManager` → `EquipmentManager.addToInventory(equip)` — 锻造完成装备入背包
- `AbyssManager` → `ResourceManager.canAfford()` / `ResourceManager.spend()` / `ResourceManager.add()` — 入场费扣除、层通关/首通奖励发放
- `AbyssManager` → `EquipmentManager.generateDrop()` / `EquipmentManager.addToInventory()` — 装备掉落生成、神话装备入库
- `AbyssManager` → `ForgeManager.addBlueprint()` — 首通奖励发放图纸（可选依赖）
- `ParkingManager` → `ResourceManager.canAffordMultiple()` / `ResourceManager.spendMultiple()` / `ResourceManager.add()` — 解锁车位/购买载具消耗、被动收入、载具出售退款

> 写操作遵循「检查 → 扣除 → 执行」原则，调用方负责前置检查（`canAfford`）。

## 跨服务契约

### 资源类型枚举

| 资源 Key | 常量路径 | Emoji | 用途 |
|----------|----------|-------|------|
| `gold` | `CONSTANTS.RESOURCE.GOLD` | 💰 | 通用货币，装备强化、交易 |
| `jade` | `CONSTANTS.RESOURCE.JADE` | 💎 | 高级货币，招募抽卡 |
| `exp` | `CONSTANTS.RESOURCE.EXP` | ✨ | 武将升级经验 |
| `food` | `CONSTANTS.RESOURCE.FOOD` | 🍖 | 战斗消耗，定时回复 |
| `wood` | `CONSTANTS.RESOURCE.WOOD` | 🪵 | 建筑材料 |
| `stone` | `CONSTANTS.RESOURCE.STONE` | 🪨 | 建筑材料 |
| `iron` | `CONSTANTS.RESOURCE.IRON` | ⚒️ | 装备材料 |

**规则**：
- 所有资源值为**非负整数**（`exp` 可为小数，其余取整）
- `jade` 无上限
- `gold`, `food`, `wood`, `stone`, `iron` 受 `ResourceManager.getCap(type)` 约束
- 资源变动必须通过 `ResourceManager.add()` / `ResourceManager.spend()`，禁止直接修改 `_state`

### 资源基础上限

| 资源 | 基础上限 | 可被覆盖 |
|------|----------|----------|
| `gold` | 50000 | 是（TownManager 建筑效果） |
| `wood` | 2000 | 是 |
| `stone` | 2000 | 是 |
| `iron` | 1000 | 是 |
| `food` | 200 | 是 |
| `jade` | 无上限 | 否 |
| `exp` | 无上限 | 否 |

### 品质等级枚举

| 等级 | 常量 | 值 | 颜色 | 基础倍率 | 招募概率 |
|------|------|----|------|----------|----------|
| 白 | `CONSTANTS.QUALITY.COMMON` | 1 | #cccccc | ×1.0 | 40% |
| 绿 | `CONSTANTS.QUALITY.UNCOMMON` | 2 | #4caf50 | ×1.3 | 30% |
| 蓝 | `CONSTANTS.QUALITY.RARE` | 3 | #2196f3 | ×1.7 | 18% |
| 紫 | `CONSTANTS.QUALITY.EPIC` | 4 | #9c27b0 | ×2.2 | 9% |
| 橙 | `CONSTANTS.QUALITY.LEGENDARY` | 5 | #ff9800 | ×3.0 | 3% |

**规则**：
- 品质数值 1-5，值越高越稀有
- 品质决定成长系数、重复武将转换经验、装备基础属性

### 成长系数表

| 品质 | ATK/级 | DEF/级 | HP/级 | SPD/级 |
|------|--------|--------|-------|--------|
| 1 (白) | 2 | 1.5 | 10 | 0.5 |
| 2 (绿) | 3 | 2 | 15 | 0.8 |
| 3 (蓝) | 4 | 3 | 22 | 1.0 |
| 4 (紫) | 5 | 4 | 30 | 1.2 |
| 5 (橙) | 7 | 5 | 40 | 1.5 |

### 武将实例数据格式

```json
{
  "uid": "string — Utils.uid() 生成，实例唯一标识，不可变",
  "id": "string — 模板 ID（如 'shu_zhugeliang'），引用 HeroData，不可变",
  "level": "number — 1-50 整数",
  "exp": "number — 当前累计经验",
  "equipment": {
    "weapon": "string|null — 装备实例 UID 或 null",
    "armor": "string|null",
    "accessory": "string|null",
    "mount": "string|null"
  }
}
```

**规则**：
- `uid` 创建后不可变，全局唯一
- `id` 创建后不可变，必须在 `HeroData` 中存在
- `level` 范围 [1, 50]，不可降级
- `equipment` 各槽位互斥（同一装备不可穿戴到多个武将或多个槽位）

### 事件契约

| 事件 | 生产者 | 消费者 | 载荷 | 说明 |
|------|--------|--------|------|------|
| `game:tick` | GameLoop | All Managers | `(dt)` 秒数 | 每秒触发，驱动所有时间逻辑 |
| `game:saved` | SaveManager | UI | 无 | 存档成功 |
| `resource:changed` | ResourceManager | UI, EconomyManager | `(type, amount)` | 资源变动后触发 |
| `toast:show` | Any | ToastUI | `{type, message}` | type: success/warning/error/info |
| `hero:added` | HeroManager | UI | `(heroInstance)` | 获得新武将 |
| `hero:team_changed` | HeroManager | UI, BattleManager | `(teamArray)` | 队伍变更 |
| `hero:levelup` | HeroManager | UI | `{hero, newLevel}` | 武将升级 |
| `battle:started` | BattleManager | UI | `{stageId}` | 战斗开始 |
| `battle:tick` | BattleManager | UI | `{round}` | 战斗回合更新 |
| `battle:ended` | BattleManager | ResourceManager, UI | `{...}` | 战斗结算 |
| `recruit:result` | RecruitManager | UI | `{results, pity}` | 招募结果 |
| `equip:changed` | EquipmentManager | UI, HeroManager | `{hero, equipment}` | 装备变更 |
| `equip:inventory_changed` | EquipmentManager | UI | 无 | 背包容量/内容变化（增删排序） |
| `town:building_upgraded` | TownManager | UI, ResourceManager | `{buildingId, newLevel}` | 建筑升级完成 |
| `town:building_started` | TownManager | UI | `{buildingId, endTime}` | 建筑升级开始 |
| `town:trade` | TownManager | ResourceManager, UI | `{from, to, amount}` | 资源交易 |
| `town:roads_updated` | TownManager | UI (TownWorld) | `{ count: number }` | 道路网络重算完成 |
| `adventure:region_changed` | AdventureManager | UI | `{regionId}` | 区域切换 |
| `adventure:mode_changed` | AdventureManager | UI | `{mode}` | 模式切换 |
| `adventure:session_update` | AdventureManager | UI | `{session}` | 冒险进度更新 |
| `economy:event_logged` | EconomyManager | UI | `{event}` | 经济事件记录 |
| `economy:alert` | EconomyManager | UI | `{alert}` | 经济预警 |
| `economy:hourly_update` | EconomyManager | UI | `{data}` | 整点统计 |
| `story:chapter_unlocked` | StoryManager | UI | `(chapter)` | 章节解锁 |
| `story:monologue` | StoryManager | UI | `{speaker, text, ts}` | 武将独白；`ts` 为 `Date.now()` 毫秒时间戳 |
| `story:scene_seen` | StoryManager | UI | `(sceneId)` | 场景已阅 |
| `tab:switched` | BottomNav | UI Panels | `(tabId)` | 切换页签 |
| `overlay:opened` | OverlayPanel | UI | `(panelId)` | 浮层打开 |
| `overlay:closed` | OverlayPanel | UI | `(closedId)` | 浮层关闭 |
| `td:unlocked` | TowerDefenseManager | UI | 无 | 塔防系统解锁 |
| `td:wave_started` | TowerDefenseManager | UI | `{wave}` | 波次开始 |
| `td:wave_cleared` | TowerDefenseManager | UI, ResourceManager | `{wave, rewards, auto}` | 波次通关 |
| `td:wave_failed` | TowerDefenseManager | UI | `{wave, townHallHpLost}` | 波次失败 |
| `td:tower_built` | TowerDefenseManager | UI | `{tower:{uid,type,gridX,gridY}}` | 防御塔建造 |
| `td:tower_upgraded` | TowerDefenseManager | UI | `{uid,type,newLevel}` | 防御塔升级 |
| `td:tower_sold` | TowerDefenseManager | UI | `{uid,refund}` | 防御塔出售 |
| `td:enemy_killed` | TowerDefenseManager | UI | `{enemyUid,killerTowerUid}` | 敌人击杀 |
| `td:hero_assigned` | TowerDefenseManager | UI | `{heroUid,slot}` | 武将派驻 |
| `td:research_started` | TowerDefenseManager | UI | `{era,endTime}` | 科技研究开始 |
| `td:era_unlocked` | TowerDefenseManager | UI | `{era}` | 时代解锁 |
| `forge:started` | ForgeManager | UI | `{recipeId, totalTime}` | 锻造任务开始（普通/神话） |
| `forge:completed` | ForgeManager | UI | `{equipment}` | 锻造完成，装备生成 |
| `forge:paused` | ForgeManager | UI | `{recipeId, reason}` | 神话锻造因资源不足暂停 |
| `forge:progress` | ForgeManager | UI | `{recipeId, percent}` | 神话锻造进度更新 |
| `farm:planted` | FarmManager | UI | `{plotIndex, cropId}` | 播种成功 |
| `farm:crop_ready` | FarmManager | UI | `{plotIndex, cropId}` | 作物成熟 |
| `farm:withered` | FarmManager | UI | `{plotIndex}` | 作物枯萎 |
| `farm:harvested` | FarmManager | UI, EconomyManager | `{plotIndex, cropId, yields, isDouble}` | 收获成功 |
| `farm:watered` | FarmManager | UI | `{plotIndex}` | 浇水成功 |
| `farm:fertilized` | FarmManager | UI | `{plotIndex}` | 施肥成功 |
| `farm:bug_alert` | FarmManager | UI | `{plotIndex, cropId}` | 虫害触发 |
| `farm:bug_removed` | FarmManager | UI | `{plotIndex}` | 除虫成功 |
| `farm:seed_bought` | FarmManager | UI | `{cropId, cost}` | 购买种子 |
| `farm:seed_synthesized` | FarmManager | UI | `{recipeIndex, result}` | 种子合成 |
| `farm:cooked` | FarmManager | UI | `{recipeId, overridden}` | 料理制作 |
| `farm:buff_expired` | FarmManager | UI, BattleManager | `{}` | 料理 Buff 过期 |
| `farm:auto_harvest_toggled` | FarmManager | UI | `{enabled}` | 自动收获切换 |
| `farm:fertilizer_made` | FarmManager | UI | `{fertilizer}` | 肥料制作 |
| `farm:crop_sold` | FarmManager | UI | `{cropId, count, gold}` | 作物出售 |
| `merchant:refreshed` | MerchantManager | MerchantPanel (UI) | `{stock: normalStock[]}` | 普通货架刷新完成 |
| `merchant:purchased` | MerchantManager | MerchantPanel (UI) | `{item: equipInstance, price: number}` | 商品购买成功 |
| `abyss:entered` | AbyssManager | UI | `{abyssId}` | 成功进入深渊 |
| `abyss:floor_cleared` | AbyssManager | UI | `{abyssId, floor, rewards}` | 单层通关 |
| `abyss:completed` | AbyssManager | UI | `{abyssId, rewards, droppedEquipment}` | 深渊全通关 |
| `abyss:failed` | AbyssManager | UI | `{abyssId, floor}` | 深渊挑战失败 |
| `parking:slot_unlocked` | ParkingManager | UI | `{slotIndex, totalSlots}` | 停车位解锁 |
| `parking:vehicle_acquired` | ParkingManager | UI | `{vehicleId}` | 载具获取 |
| `parking:vehicle_parked` | ParkingManager | UI | `{vehicleId, slotIndex}` | 载具停放 |
| `parking:vehicle_removed` | ParkingManager | UI | `{vehicleId, slotIndex}` | 载具移出 |
| `parking:income_collected` | ParkingManager | UI | `{amount}` | 被动收入结算 |

**事件规则**：
- EventBus 仅支持 `on` / `off` / `emit`，无 `once`
- 事件同步触发，回调中不得执行耗时操作
- 载荷必须可 JSON 序列化（无函数、无循环引用）

### 存档格式

```json
{
  "version": "string — CONSTANTS.VERSION",
  "timestamp": "number — Date.now()",
  "resources": "ResourceManager.getState()",
  "heroes": "HeroManager.getState()",
  "battle": "BattleManager.getState()",
  "recruit": "RecruitManager.getState()",
  "equipment": "EquipmentManager.getState()",
  "story": "StoryManager.getState()",
  "town": "TownManager.getState()",
  "adventure": "AdventureManager.getState()",
  "economy": "EconomyManager.getState()",
  "settings": "SettingsPanel.getState()",
  "merchant": "MerchantManager.getState()",
  "forge": "ForgeManager.getState()",
  "abyss": "AbyssManager.getState()",
  "farm": "FarmManager.getState()",
  "parking": "ParkingManager.getState()",
  "towerDefense": "TowerDefenseManager.getState()"
}
```

**规则**：
- 所有 Manager 实现 `getState()` 返回可序列化的深拷贝
- 存档通过 `SaveManager.save(state)` 写入 `localStorage`
- 自动存档周期：30 秒
- 读取存档失败时返回 `null`，各 Manager 使用默认值初始化
- 新版本必须向后兼容旧存档（在 `init(saved)` 中做迁移）

### Manager 初始化顺序

```
1. ResourceManager    ← 基础，无依赖
2. HeroManager        ← 依赖 ResourceManager（检查升级费用）
3. BattleManager      ← 依赖 HeroManager（读取属性）
4. RecruitManager     ← 依赖 HeroManager（添加武将）
5. EquipmentManager   ← 依赖 HeroManager（装备关联武将）
6. StoryManager       ← 依赖多个 Manager（解锁条件检查）
7. TownManager        ← 依赖 ResourceManager（消耗资源建造）
8. AdventureManager   ← 依赖 BattleManager, ResourceManager
9. EconomyManager     ← 必须在 ResourceManager 之后（监听 resource:changed）
10. MerchantManager    ← 依赖 ResourceManager（金币/玉璧扣除）, EquipmentManager（背包管理）
11. ForgeManager       ← 依赖 TownManager（建筑等级查询）, ResourceManager（资源消耗）, EquipmentManager（装备入背包）
12. AbyssManager       ← 依赖 BattleManager, HeroManager, ResourceManager, EquipmentManager, TownManager
13. FarmManager        ← 依赖 TownManager（查询建筑等级）, ResourceManager（资源消耗/发放）
14. ParkingManager     ← 依赖 ResourceManager, TownManager（停车场等级/离线效率查询）
15. TowerDefenseManager ← 依赖 ResourceManager, HeroManager, TownManager, EquipmentManager
```

**规则**：
- 初始化顺序不可随意变更
- 每个 Manager 的 `init(saved)` 接收对应的存档片段（可为 `undefined`）
- `init()` 必须处理 `undefined` 参数（首次游戏无存档）

### Tick 注册顺序

```
1. ResourceManager.onTick(dt)     ← 食物回复
2. BattleManager.onTick(dt)       ← 战斗推进
3. StoryManager.onTick(dt)        ← 剧情检查
4. TownManager.onTick(dt)         ← 建筑建造倒计时
5. AdventureManager.onTick(dt)    ← 冒险推进
6. EconomyManager.onTick(dt)      ← 经济统计
7. MerchantManager.onTick(dt)     ← 商铺定时刷新检查
8. ForgeManager.onTick(dt)        ← 锻造队列推进（普通计时/神话资源消耗）
9. AbyssManager.onTick(dt)        ← 深渊解锁检查 + 战斗推进
10. FarmManager.onTick(dt)         ← 作物生长/枯萎/自动收获/Buff 过期
11. ParkingManager.onTick(dt)      ← 停车场收益累积
12. TowerDefenseManager.onTick(dt) ← 塔防波次推进
```

## 五行属性系统

### 五行枚举

| 五行 | 常量路径 | 值 | 颜色 | 图标 | 关联阵营 |
|------|----------|-----|------|------|----------|
| 火 | `CONSTANTS.ELEMENT.FIRE` | `'fire'` | #ff4757 | 🔥 | 蜀 |
| 金 | `CONSTANTS.ELEMENT.METAL` | `'metal'` | #ffa502 | ⚔️ | 魏 |
| 水 | `CONSTANTS.ELEMENT.WATER` | `'water'` | #3742fa | 💧 | 吴 |
| 木 | `CONSTANTS.ELEMENT.WOOD` | `'wood'` | #2ed573 | 🌳 | 群（生长型） |
| 土 | `CONSTANTS.ELEMENT.EARTH` | `'earth'` | #8b4513 | 🏔️ | 群（防御型） |

**规则**：
- 每个武将**必须**拥有且仅拥有一个五行属性
- 阵营-五行默认映射（`CONSTANTS.ELEMENT_FACTION_MAP`）：蜀→火、魏→金、吴→水、群→按个体分配（`null`）
- 五行属性创建后不可变

### 五行相克相生关系 (`ELEMENT_RELATIONS`)

**相克环 (OVERCOME)**：火→金→木→土→水→火

```
    火
   ↗   ↘
  水     金
  ↑       ↓
  土 ← 木
```

A 克 B 时：A 对 B 造成额外伤害，B 对 A 伤害降低。

**相生环 (GENERATE)**：木→火→土→金→水→木

A 生 B 时：A 对 B 有小幅增益。

### 五行伤害倍率 (`ELEMENT_MULTIPLIERS`)

| 关系 | 常量 Key | 倍率 | 说明 |
|------|----------|------|------|
| 克制 | `OVERCOME` | ×1.25 | 攻击方克制防御方，+25% |
| 被克 | `OVERCOME_BY` | ×0.80 | 攻击方被防御方克制，-20% |
| 相生 | `GENERATE` | ×1.10 | 攻击方生防御方，+10% |
| 被生 | `GENERATE_BY` | ×0.95 | 攻击方被防御方所生，-5% |
| 同属性 | `SAME` | ×0.90 | 同五行互打，-10% |
| 无关系 | `NEUTRAL` | ×1.00 | 无五行关系 |

### 五行伤害计算场景

**WHEN** 火属性武将攻击金属性武将
**THEN** 最终伤害 = 基础伤害 × `ELEMENT_MULTIPLIERS.OVERCOME`（×1.25），因火克金

**WHEN** 金属性武将攻击火属性武将
**THEN** 最终伤害 = 基础伤害 × `ELEMENT_MULTIPLIERS.OVERCOME_BY`（×0.80），因金被火克

**WHEN** 木属性武将攻击火属性武将
**THEN** 最终伤害 = 基础伤害 × `ELEMENT_MULTIPLIERS.GENERATE`（×1.10），因木生火

**WHEN** 火属性武将攻击木属性武将
**THEN** 最终伤害 = 基础伤害 × `ELEMENT_MULTIPLIERS.GENERATE_BY`（×0.95），因火被木所生

**WHEN** 火属性武将攻击火属性武将
**THEN** 最终伤害 = 基础伤害 × `ELEMENT_MULTIPLIERS.SAME`（×0.90），因同属性

**WHEN** 火属性武将攻击土属性武将
**THEN** 最终伤害 = 基础伤害 × `ELEMENT_MULTIPLIERS.NEUTRAL`（×1.00），因无直接克制/相生关系

## 英雄角色系统

### 角色枚举

| 角色 | 常量路径 | 值 | 图标 | 颜色 | 说明 |
|------|----------|-----|------|------|------|
| 输出 | `CONSTANTS.HERO_ROLE.DPS` | `'dps'` | ⚔️ | #ff4757 | 主要伤害输出 |
| 治疗 | `CONSTANTS.HERO_ROLE.HEALER` | `'healer'` | 💚 | #4caf50 | 恢复队友生命 |
| 坦克 | `CONSTANTS.HERO_ROLE.TANK` | `'tank'` | 🛡️ | #3742fa | 吸收伤害保护队友 |
| 辅助 | `CONSTANTS.HERO_ROLE.SUPPORT` | `'support'` | ✨ | #ffa502 | 增益己方属性 |
| 控制 | `CONSTANTS.HERO_ROLE.DEBUFFER` | `'debuffer'` | 💀 | #9b59b6 | 削弱敌方属性 |

**规则**：
- 每个武将**必须**拥有且仅拥有一个角色定位
- 角色影响武将的基础属性分配权重和 AI 行为优先级
- 角色信息（名称、图标、颜色）通过 `CONSTANTS.HERO_ROLE_INFO[role]` 获取

## 不变量

1. **EventBus 是唯一跨模块通信方式** — Manager 之间不得直接调用修改方法，仅允许指定的只读查询
2. **资源不可为负** — `spend()` 必须先检查 `canAfford()`
3. **存档必须可序列化** — 状态中禁止存储函数、DOM 引用、循环引用
4. **模块为全局单例** — 不使用 class，不使用 ES Module
5. **加载顺序为 core → data → modules → ui → main.js** — 新增文件必须在 `index.html` 中按此层级插入
6. **数字显示统一用 `Utils.formatNumber()`** — 万/亿/兆中文缩写
7. **ID 生成统一用 `Utils.uid()`** — 各 Manager 不得自行实现 ID 生成
8. **队伍上限为 5** — `CONSTANTS.MAX_TEAM_SIZE`，不可超出
9. **武将最高等级为 50** — 升级操作必须检查上限
10. **向后兼容** — 新版本存档结构变更时，`init()` 必须迁移旧数据

## 导航

服务级详情，请参见：
- [specs/services/resource-manager.md](../services/resource-manager.md)
- [specs/services/hero-manager.md](../services/hero-manager.md)
- [specs/services/battle-manager.md](../services/battle-manager.md)
- [specs/services/recruit-manager.md](../services/recruit-manager.md)
- [specs/services/equipment-manager.md](../services/equipment-manager.md)
- [specs/services/story-manager.md](../services/story-manager.md)
- [specs/services/town-manager.md](../services/town-manager.md)
- [specs/services/adventure-manager.md](../services/adventure-manager.md)
- [specs/services/economy-manager.md](../services/economy-manager.md)
- [specs/services/forge-manager.md](../services/forge-manager.md)
- [specs/services/merchant-manager.md](../services/merchant-manager.md)
- [specs/services/abyss-manager.md](../services/abyss-manager.md)
- [specs/services/farm-manager.md](../services/farm-manager.md)
- [specs/product-specs/parking-system.md](../product-specs/parking-system.md)
- [specs/product-specs/tower-defense-system.md](../product-specs/tower-defense-system.md)
