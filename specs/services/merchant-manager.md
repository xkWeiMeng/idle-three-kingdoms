---
status: Active
created: 2026-04-14
updated: 2026-04-14
author: AI (spec-architect)
system-spec: specs/system/core-contracts.md
---

# 服务规范：MerchantManager

## 概述

管理糜竺商铺的商品库存、自动刷新、手动刷新和购买流程。商铺分两个区域：
- **普通货架**：6 件随机装备，每 4 小时自动刷新，用金币购买
- **镇店之宝**：3 件神话饰品，常驻不刷新，一次性购买

商人是游戏的重要金币消耗渠道和装备获取途径。

## 能力

### 能力 1：初始化与存档

**描述**：从存档恢复商铺状态或初始化新游戏。首次加载或刷新过期时自动补货。

**接口**：
- `init(saved)` → `void` — `saved` 为完整存档对象，内部从 `saved.merchant` 提取商铺状态；`saved` 为 `undefined` 时为新游戏
- `getState()` → `object` — 导出可序列化状态

**行为规则**：
- 从 `saved.merchant` 恢复：`lastRefresh`、`normalStock`、`permanentSold`、`refreshInterval`
- 缺失字段使用默认值：`lastRefresh=0`、`normalStock=[]`、`permanentSold={}`、`refreshInterval=14400`
- 初始化镇店之宝列表（从 `MerchantPermanentStock` 配置生成，已购买状态从 `permanentSold` 恢复）
- 镇店之宝条目中，若 `getMythicTemplate(equipId)` 未找到模板，`name` 退回使用 `equipId`，`description` 为空字符串
- 初始化结束时检查：若 `normalStock` 为空 **或** 距上次刷新已超过 `refreshInterval` 秒，立即执行刷新
- `getState()` 返回 `{ lastRefresh, normalStock, permanentSold, refreshInterval }` 的深拷贝（`Utils.deepClone`）
- `getState()` **不包含** `permanentStock`（该字段从配置动态生成，非存档数据）

**permanentStock 条目结构**（由 `_initPermanentStock` 生成）：
```json
{
  "equipId": "string — 神话装备模板 ID",
  "price": "number — 金币价格",
  "setId": "string — 套装 ID",
  "sold": "boolean — 是否已购买",
  "name": "string — 装备名称（模板不存在时退回 equipId）",
  "description": "string — 装备描述（模板不存在时为空字符串）"
}
```

**验收场景**：

```
WHEN init({ merchant: { lastRefresh: T, normalStock: [6件], permanentSold: { 'equip_a': true } } })
AND 当前时间距 T 未超过 refreshInterval
THEN _state.normalStock 恢复为存档中的 6 件
AND _state.permanentSold 恢复为 { 'equip_a': true }
AND 对应 permanentStock 条目的 sold=true
AND normalStock 不刷新

WHEN init(undefined)（首次游戏）
THEN _state.lastRefresh=0, normalStock=[], permanentSold={}, refreshInterval=14400
AND normalStock 为空触发立即刷新，生成 6 件商品
AND permanentStock 全部 sold=false

WHEN init({ merchant: { lastRefresh: T } })
AND 当前时间距 T 已超过 14400 秒
THEN 立即执行刷新，normalStock 替换为新生成的 6 件

WHEN getState()
THEN 返回 { lastRefresh, normalStock(深拷贝), permanentSold(深拷贝), refreshInterval }
AND 修改返回对象不影响内部状态
```

---

### 能力 2：库存自动刷新

**描述**：通过 `onTick` 驱动定时刷新，每 `refreshInterval` 秒（默认 14400 = 4 小时）生成新的普通货架。

**接口**：
- `onTick(dt)` → `void` — 由 GameLoop 的 `game:tick` 驱动

**行为规则**：
- 每次 tick 检查：`当前时间 - lastRefresh >= refreshInterval`（基于墙钟时间 `Math.floor(Date.now()/1000)`，`dt` 参数未使用）
- 条件满足时执行刷新：**首先**更新 `lastRefresh` 为当前时间戳，**然后**生成新商品，**最后** emit `merchant:refreshed({ stock: normalStock })`

**验收场景**：

```
WHEN onTick(1)
AND 距上次刷新 < refreshInterval
THEN normalStock 不变，无事件

WHEN onTick(1)
AND 距上次刷新 >= refreshInterval
THEN normalStock 替换为新生成的 6 件商品
AND lastRefresh 更新为当前时间
AND emit merchant:refreshed({ stock })
```

---

### 能力 3：手动刷新

**描述**：玩家花费 30 玉璧立即刷新普通货架。

**接口**：
- `manualRefresh()` → `boolean`

**行为规则**：
- 检查 `ResourceManager.canAfford('jade', 30)`
- 玉璧不足：emit `toast:show({ type: 'warning', message: '玉璧不足！需要💎×30' })`，返回 `false`
- 玉璧充足：`ResourceManager.spend('jade', 30)` → 执行刷新 → emit `toast:show({ type: 'success', message: '商铺已刷新！' })`，返回 `true`
- 刷新逻辑与自动刷新完全相同（更新 lastRefresh、生成新商品、emit `merchant:refreshed`）

**验收场景**：

```
WHEN manualRefresh()
AND jade >= 30
THEN spend jade 30
AND normalStock 替换为新 6 件
AND lastRefresh 更新
AND emit merchant:refreshed
AND emit toast:show success
AND 返回 true

WHEN manualRefresh()
AND jade < 30
THEN jade 不变，normalStock 不变
AND emit toast:show warning '玉璧不足！需要💎×30'
AND 返回 false
```

---

### 能力 4：商品生成规则

**描述**：定义普通货架刷新时如何生成商品。此为内部逻辑，被能力 2 和能力 3 调用。

**行为规则**：

**品质抽取**（`_rollQuality`）：
- 加权随机，权重表：

| 品质 | 权重 | 概率 |
|------|------|------|
| 1 (白) | 35 | 35% |
| 2 (绿) | 30 | 30% |
| 3 (蓝) | 20 | 20% |
| 4 (紫) | 12 | 12% |
| 5 (橙) | 3 | 3% |

**类型抽取**：
- 等概率随机选择：`weapon`、`armor`、`accessory`、`mount`（各 25%）

**模板匹配**：
- 在 `EquipmentData` 中查找第一个匹配 `type` 和 `quality` 的模板
- 找不到模板时跳过该位置（实际生成数量可能 < 6）

**属性值**：
- `statValue = Utils.randInt(template.statRange[0], template.statRange[1])`

**定价公式**：
```
basePrice = qualityCoeff[quality] × typeBasePrice[type]
price = floor(basePrice × (0.9 + random × 0.2))
```

| 品质 | qualityCoeff |
|------|-------------|
| 1 | 1 |
| 2 | 2.5 |
| 3 | 6 |
| 4 | 15 |
| 5 | 40 |

| 装备类型 | typeBasePrice |
|----------|-------------|
| weapon | 200 |
| armor | 200 |
| accessory | 180 |
| mount | 220 |

**生成数量**：固定尝试 6 次（模板缺失时实际数量可能 < 6）

**商品数据结构**：
```json
{
  "uid": "string — Utils.uid()",
  "templateId": "string — 模板 ID",
  "name": "string",
  "emoji": "string",
  "type": "weapon|armor|accessory|mount",
  "quality": "number 1-5",
  "statType": "string",
  "statValue": "number",
  "description": "string",
  "price": "number — 金币",
  "sold": "boolean — 初始 false"
}
```

**验收场景**：

```
WHEN 刷新执行
THEN 生成 ≤6 件商品（每件有唯一 uid）
AND 每件商品的 quality 符合加权概率分布
AND 每件商品的 type 为 weapon/armor/accessory/mount 之一
AND 每件商品的 price = floor(qualityCoeff[q] × typeBasePrice[type] × variation)
AND variation ∈ [0.9, 1.1)
AND 所有商品 sold=false

WHEN 品质 3 (蓝) + 类型 weapon
THEN basePrice = 6 × 200 = 1200
AND price ∈ [floor(1200×0.9), floor(1200×1.1)] = [1080, 1319]

WHEN 品质 5 (橙) + 类型 mount
THEN basePrice = 40 × 220 = 8800
AND price ∈ [floor(8800×0.9), floor(8800×1.1)] = [7920, 9679]

WHEN EquipmentData 中不存在某 type+quality 组合的模板
THEN 该位置跳过，最终商品数 < 6
```

---

### 能力 5：购买普通商品

**描述**：用金币购买普通货架上的商品，将装备添加到背包。

**接口**：
- `buyNormal(itemUid)` → `boolean`
  - `itemUid`: 商品在 normalStock 中的 uid

**行为规则**：
- 在 `normalStock` 中按 `uid` 查找商品
- **商品不存在或已售出**：emit `toast:show warning '商品不存在或已售出'`，返回 `false`
- **金币不足**：emit `toast:show warning '金币不足！需要💰×' + Utils.formatNumber(item.price)`，返回 `false`
- **背包已满**（`EquipmentManager.getInventory().length >= EquipmentManager.getMaxCapacity()`）：emit `toast:show warning '背包已满！'`，返回 `false`
- 检查全部通过后：
  1. `ResourceManager.spend('gold', item.price)` — 扣除金币
  2. `item.sold = true` — 标记已售出
  3. 创建装备实例并添加到背包（通过 `EquipmentManager.addToInventory(equip)`）
  4. emit `merchant:purchased({ item: equip, price })`
  5. emit `toast:show success '购买了 {name}！'`
  6. 返回 `true`

**创建的装备实例结构**：
```json
{
  "uid": "string — Utils.uid()",
  "id": "string — item.templateId",
  "name": "string — item.name",
  "type": "string — item.type",
  "quality": "number — item.quality",
  "emoji": "string — item.emoji",
  "description": "string — item.description",
  "stats": { "[item.statType]": "item.statValue" },
  "level": 0,
  "equippedBy": null
}
```

**验收场景**：

```
WHEN buyNormal(validUid)
AND 商品存在且未售出
AND gold >= item.price
AND 背包未满
THEN spend gold item.price
AND item.sold = true
AND 创建装备实例加入背包
AND emit merchant:purchased({ item, price })
AND emit toast:show success
AND 返回 true

WHEN buyNormal(validUid)
AND 商品已售出（sold=true）
THEN 返回 false
AND emit toast:show warning '商品不存在或已售出'

WHEN buyNormal('不存在的uid')
THEN 返回 false
AND emit toast:show warning '商品不存在或已售出'

WHEN buyNormal(validUid)
AND gold < item.price
THEN 返回 false，gold 不变
AND emit toast:show warning '金币不足！需要💰×{price}'

WHEN buyNormal(validUid)
AND gold 充足
AND 背包已满
THEN 返回 false，gold 不变
AND emit toast:show warning '背包已满！'
```

---

### 能力 6：购买镇店之宝

**描述**：用金币购买常驻神话装备（品质 6），一次性购买，不可重复。

**接口**：
- `buyPermanent(equipId)` → `boolean`
  - `equipId`: 神话装备模板 ID（如 `'equip_mythic_tyrant_pendant'`）

**行为规则**：
- 在 `permanentStock` 中按 `equipId` 查找
- **不存在或已购买**：emit `toast:show warning '已购买过此物品'`，返回 `false`
- **金币不足**：emit `toast:show warning '金币不足！需要💰×' + Utils.formatNumber(item.price)`，返回 `false`
- **背包已满**：emit `toast:show warning '背包已满！'`，返回 `false`
- 检查全部通过后：
  1. 通过 `getMythicTemplate(equipId)` 获取模板，模板不存在则返回 `false`（不扣金币、不改 sold 状态）
  2. `ResourceManager.spend('gold', item.price)` — 扣除金币
  3. `item.sold = true` — 标记已购买
  4. `_state.permanentSold[equipId] = true` — 持久化购买记录
  5. 创建神话装备实例并添加到背包（通过 `EquipmentManager.addToInventory(equip)`）
  6. emit `merchant:purchased({ item: equip, price })`
  7. emit `toast:show success '🔴 获得神话装备：{name}！'`
  8. 返回 `true`

**创建的神话装备实例结构**：
```json
{
  "uid": "string — Utils.uid()",
  "id": "string — template.id",
  "name": "string — template.name",
  "type": "string — template.type",
  "quality": 6,
  "emoji": "string — template.emoji",
  "description": "string — template.description",
  "setId": "string — template.setId",
  "unsellable": true,
  "stats": { "[template.statType]": "Utils.randInt(statRange[0], statRange[1])" },
  "level": 0,
  "equippedBy": null
}
```

**镇店之宝配置**（来自 `MerchantPermanentStock`）：

| equipId | 价格 | 套装 |
|---------|------|------|
| equip_mythic_tyrant_pendant | 500,000 金币 | set_overlord |
| equip_mythic_dragon_orb | 500,000 金币 | set_dragon |
| equip_mythic_emperor_seal | 600,000 金币 | set_emperor |

**验收场景**：

```
WHEN buyPermanent('equip_mythic_tyrant_pendant')
AND 未购买过
AND gold >= 500000
AND 背包未满
THEN spend gold 500000
AND item.sold=true, permanentSold['equip_mythic_tyrant_pendant']=true
AND 创建品质 6 装备实例（unsellable=true, setId='set_overlord'）
AND emit merchant:purchased
AND emit toast:show success '🔴 获得神话装备：...'
AND 返回 true

WHEN buyPermanent('equip_mythic_tyrant_pendant')
AND 已购买过（sold=true）
THEN 返回 false
AND emit toast:show warning '已购买过此物品'

WHEN buyPermanent(validEquipId)
AND gold < price
THEN 返回 false，gold 不变
AND emit toast:show warning '金币不足！需要💰×{price}'

WHEN buyPermanent(validEquipId)
AND gold 充足
AND 背包已满
THEN 返回 false，gold 不变
AND emit toast:show warning '背包已满！'

WHEN buyPermanent(equipId)
AND getMythicTemplate(equipId) 返回 null
THEN 返回 false（静默失败，不创建装备）
AND 金币不扣除、item.sold 不变、permanentSold[equipId] 不变
```

---

### 能力 7：查询接口

**描述**：提供只读查询，供 UI 层（MerchantPanel）使用。

**接口**：
- `getNormalStock()` → `object[]` — 当前普通货架商品列表（内部引用）
- `getPermanentStock()` → `object[]` — 镇店之宝列表（内部引用）
- `getRefreshCountdown()` → `number` — 距下次自动刷新的剩余秒数

**行为规则**：
- `getNormalStock()` 返回 `_state.normalStock` 内部引用
- `getPermanentStock()` 返回 `_state.permanentStock` 内部引用
- `getRefreshCountdown()` = `max(0, refreshInterval - (当前时间戳 - lastRefresh))`

**验收场景**：

```
WHEN getNormalStock()
AND 当前有 4 件商品（2 件已售出）
THEN 返回长度为 4 的数组，其中 2 件 sold=true

WHEN getPermanentStock()
THEN 返回长度为 3 的数组（对应 MerchantPermanentStock 配置）

WHEN getRefreshCountdown()
AND lastRefresh 为 10 秒前，refreshInterval=14400
THEN 返回 14390

WHEN getRefreshCountdown()
AND 已过期（elapsed > refreshInterval）
THEN 返回 0
```

## 内部状态

```json
{
  "lastRefresh": "number — 上次刷新的 Unix 时间戳（秒）",
  "refreshInterval": "number — 刷新间隔（秒），默认 14400",
  "normalStock": "object[] — 当前普通货架商品",
  "permanentStock": "object[] — 镇店之宝列表（运行时生成，不存档）",
  "permanentSold": "object — { equipId: true } 已购买的镇店之宝记录"
}
```

## 依赖

| 依赖项 | 方向 | 说明 |
|--------|------|------|
| ResourceManager | MerchantManager → ResourceManager | 购买扣金币（`canAfford`/`spend` gold）、手动刷新扣玉璧（jade） |
| EquipmentManager | MerchantManager → EquipmentManager | 检查背包容量（`getInventory`/`getMaxCapacity`）、添加装备（`addToInventory`） |
| EquipmentData | MerchantManager → EquipmentData | 普通装备模板数据（全局数组） |
| MerchantPermanentStock | MerchantManager → MerchantPermanentStock | 镇店之宝配置（全局数组） |
| getMythicTemplate (→ MythicEquipmentData) | MerchantManager → getMythicTemplate | 神话装备模板查找（搜索 MythicEquipmentData 全局数组） |
| Utils | MerchantManager → Utils | `uid()`、`randInt()`、`deepClone()`、`formatNumber()` |

## 事件

### 生产的事件

| 事件 | 载荷 | 触发时机 |
|------|------|----------|
| `merchant:refreshed` | `{ stock: normalStock[] }` | 自动/手动刷新完成后 |
| `merchant:purchased` | `{ item: equipInstance, price: number }` | 购买成功后 |
| `toast:show` | `{ type: string, message: string }` | 各种操作反馈 |

### 消费的事件

| 事件 | 来源 | 用途 |
|------|------|------|
| `game:tick` | GameLoop | 驱动 `onTick(dt)` 定时刷新检查 |

## 数据所有权

| 实体 | 本服务拥有的 | 共享给 | 方式 |
|------|-------------|--------|------|
| 普通货架 | normalStock[] | MerchantPanel (UI) | `getNormalStock()` |
| 镇店之宝 | permanentStock[], permanentSold{} | MerchantPanel (UI) | `getPermanentStock()` |
| 刷新倒计时 | lastRefresh, refreshInterval | MerchantPanel (UI) | `getRefreshCountdown()` |

## 配置

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `refreshInterval` | number | 14400 | 自动刷新间隔（秒），4 小时 |
| `MANUAL_REFRESH_COST` | number | 30 | 手动刷新玉璧花费 |
| `NORMAL_STOCK_SIZE` | number | 6 | 普通货架尝试生成数量 |
| `_qualityCoeff` | object | `{1:1, 2:2.5, 3:6, 4:15, 5:40}` | 品质定价系数 |
| `_typeBasePrice` | object | `{weapon:200, armor:200, accessory:180, mount:220}` | 类型基础价格 |
| `_qualityWeights` | object | `{1:35, 2:30, 3:20, 4:12, 5:3}` | 品质出现权重 |

## 已知问题

1. ~~**直接操作 EquipmentManager 内部数组**~~：✅ 已修复 — `buyNormal` 和 `buyPermanent` 已改用 `EquipmentManager.addToInventory(equip)` 公共 API。
2. **buyNormal 创建装备时重新查找模板**：购买时从 `EquipmentData` 重新查找模板获取信息，但实际上 `item` 本身已包含所有必要字段。模板查找结果（`template`）实际未使用。
3. ~~**buyPermanent 中 getMythicTemplate 返回 null 时金币泄漏**~~：✅ 已修复 — 模板检查已前置到 `ResourceManager.spend()` 之前，模板不存在时不扣金币、不改 sold 状态。

## 商品状态转换

| 状态 | 转换到 | 触发器 | 守卫条件 |
|------|--------|--------|----------|
| 普通商品 `sold=false` | `sold=true` | `buyNormal(uid)` | 金币充足 + 背包未满 |
| 镇店之宝 `sold=false` | `sold=true` | `buyPermanent(equipId)` | 金币充足 + 背包未满 + 模板存在 |
| 普通货架全部 | 替换为新商品 | `_refreshStock()` | 定时触发或手动刷新 |

> 注意：`sold` 状态转换为**单向不可逆**（普通商品在刷新时整体替换，镇店之宝一旦售出永久记录在 `permanentSold` 中）。

## 导航

- 系统契约：[specs/system/core-contracts.md](../system/core-contracts.md)
- 装备服务：[specs/services/equipment-manager.md](equipment-manager.md)（装备背包管理）
- 资源服务：[specs/services/resource-manager.md](resource-manager.md)（金币/玉璧扣除）
