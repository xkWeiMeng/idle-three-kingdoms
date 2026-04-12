---
status: Active
created: 2026-04-14
updated: 2026-04-14
author: AI (spec-architect)
reviewed-by: AI (spec-reviewer)
system-spec: specs/system/core-contracts.md
product-spec: specs/product-specs/farming-system.md
---

# 服务规范：FarmManager

## 概述

管理种菜系统的全部业务逻辑：田地播种、作物生长与枯萎、收获、浇水、施肥、除虫、种子购买与合成、料理 Buff、自动收获、肥料制作、作物出售。

FarmManager 是全局单例对象，通过 `game:tick` 驱动时间逻辑，依赖 TownManager 查询菜园/堆肥坑/种子铺建筑等级，依赖 ResourceManager 进行资源消耗与发放。

## 依赖

| 依赖 | 方式 | 用途 |
|------|------|------|
| TownManager | 只读查询 `TownManager.getState().buildings` | 查询 vegetable_garden / compost_pit / seed_shop 等级 |
| ResourceManager | 写操作 `canAfford()` / `add()` / `spend()` / `canAffordMultiple()` / `spendMultiple()` | 收获发放资源、购买种子扣费、除虫扣金、出售作物 |
| EconomyManager | 可选写 `logEvent()` | 记录收支经济日志 |
| CropData | 只读数据 | 作物静态数据表（27 种作物） |
| GardenLevelData | 只读数据 | 菜园等级效果表（田地数/品级解锁/速度加成/双倍概率） |
| FarmMasteryData | 只读数据 | 农耕熟练度等级表（5 级） |
| CropSynthesis | 只读数据 | 种子合成配方表 |
| RecipeData | 只读数据 | 料理配方表 |

## 状态结构

```json
{
  "plots": [
    {
      "cropId": "string|null",
      "state": "idle|growing|ready",
      "plantedAt": "number|null (Date.now() 毫秒)",
      "readyAt": "number|null (Date.now() 毫秒)",
      "watered": "boolean",
      "fertilized": "boolean",
      "hasBug": "boolean",
      "bugTriggered": "boolean",
      "remainHarvests": "number (≥0)",
      "isReharvest": "boolean"
    }
  ],
  "inventory": "{ cropId: count } — 收获的作物库存",
  "seeds": "{ cropId: count } — 种子库存",
  "fertilizer": "number (≥0)",
  "farmExp": "number (≥0)",
  "autoHarvest": "boolean",
  "activeBuff": "{recipeId, effects, activatedAt, duration} | null"
}
```

## 事件发布

| 事件 | 载荷 | 触发时机 |
|------|------|----------|
| `farm:planted` | `{plotIndex, cropId}` | 播种成功 |
| `farm:crop_ready` | `{plotIndex, cropId}` | 作物成熟 |
| `farm:withered` | `{plotIndex}` | 作物枯萎 |
| `farm:harvested` | `{plotIndex, cropId, yields, isDouble}` | 收获成功 |
| `farm:watered` | `{plotIndex}` | 浇水成功 |
| `farm:fertilized` | `{plotIndex}` | 施肥成功 |
| `farm:bug_alert` | `{plotIndex, cropId}` | 虫害触发 |
| `farm:bug_removed` | `{plotIndex}` | 除虫成功 |
| `farm:seed_bought` | `{cropId, cost}` | 购买种子成功 |
| `farm:seed_synthesized` | `{recipeIndex, result}` | 种子合成成功 |
| `farm:cooked` | `{recipeId, overridden}` | 料理制作成功 |
| `farm:buff_expired` | `{}` | 料理 Buff 过期 |
| `farm:auto_harvest_toggled` | `{enabled}` | 自动收获开关切换 |
| `farm:fertilizer_made` | `{fertilizer}` | 肥料制作成功 |
| `farm:crop_sold` | `{cropId, count, gold}` | 作物出售成功 |
| `toast:show` | `{type, message}` | 双倍丰收提示、料理覆盖提示 |

## 能力

### 能力 1：初始化与持久化

**描述**：从存档恢复状态或初始化默认值，提供可序列化状态快照。

**接口**：
- `init(saved)` → void — `saved` 为完整存档对象，读取 `saved.farm` 片段
- `getState()` → object — 返回 `_state` 的深拷贝（`Utils.deepClone`）

**行为规则**：
- `init()` 从 `saved.farm` 恢复 inventory/seeds/fertilizer/farmExp/autoHarvest/activeBuff
- plots 从存档恢复；若存档 plots 数量 < 当前菜园等级对应数量，自动补充空田地
- 首次游戏（无存档）时根据菜园等级创建空田地数组
- 菜园未建造（level=0）时 plots 为空数组

**验收场景**：

```
WHEN init({}) 首次游戏无存档
AND 菜园等级为 0
THEN plots 为空数组，inventory/seeds 为空对象，fertilizer/farmExp 为 0

WHEN init({farm: {plots: [...2个], farmExp: 500}})
AND 菜园等级为 3（对应 4 块田地）
THEN 恢复 2 个已有 plot + 补充 2 个空 plot，farmExp=500

WHEN getState()
THEN 返回 _state 的深拷贝，修改返回值不影响内部状态
```

---

### 能力 2：播种 (CAP-FARM-01)

**描述**：在空闲田地上消耗种子种植作物。

**接口**：
- `plant(plotIndex, cropId)` → `{ok: boolean, reason?: string}`

**行为规则**：
- 检查 plotIndex 有效、田地状态为 `idle`、cropId 在 CropData 中存在
- 检查作物品级 ≤ 菜园等级对应的 `qualityUnlock`
- 检查种子库存 `seeds[cropId] > 0`
- 消耗 1 颗种子，设置田地为 growing 状态，记录 `plantedAt=Date.now()`
- 初始化 `watered=false, fertilized=false, hasBug=false, bugTriggered=false`
- 设置 `remainHarvests = crop.reharvestCount || 0`
- emit `farm:planted`

**验收场景**：

```
WHEN plant(0, 'cabbage')
AND plots[0].state === 'idle'
AND seeds.cabbage >= 1
AND 菜园 qualityUnlock >= 1
THEN seeds.cabbage -= 1
AND plots[0] = {cropId:'cabbage', state:'growing', plantedAt:Date.now(), watered:false, fertilized:false, hasBug:false, bugTriggered:false, remainHarvests:0}
AND emit farm:planted({plotIndex:0, cropId:'cabbage'})

WHEN plant(0, 'cabbage')
AND seeds.cabbage === 0 或 seeds.cabbage 不存在
THEN 返回 {ok:false, reason:'种子不足'}

WHEN plant(0, 'cabbage')
AND plots[0].state === 'growing'
THEN 返回 {ok:false, reason:'田地已占用'}

WHEN plant(99, 'cabbage')
AND plots[99] 不存在
THEN 返回 {ok:false, reason:'无效田地'}

WHEN plant(0, 'snow_lotus')
AND snow_lotus.quality=4 > 菜园 qualityUnlock=2
THEN 返回 {ok:false, reason:'菜园等级不足，无法种植该品级作物'}

WHEN plant(0, 'nonexistent')
AND CropData 中不存在该 ID
THEN 返回 {ok:false, reason:'未知作物'}
```

---

### 能力 3：生长与枯萎 (CAP-FARM-02)

**描述**：tick 驱动的作物状态转换——growing→ready（成熟）、ready→idle（枯萎）。

**行为规则**：
- `onTick(dt)` 每秒调用，遍历所有 plots
- growing 状态：当 `Date.now() - plantedAt >= actualGrowthTime * 1000` 时，转为 `ready`，记录 `readyAt=Date.now()`，emit `farm:crop_ready`
- ready 状态：当 `Date.now() - readyAt >= 48h (172800000 ms)` 时，重置为 idle 空田地，emit `farm:withered`
- 菜园等级 < 1 时 onTick 直接返回，不处理
- 每次 tick 还会检查菜园升级导致的田地数增加，自动补充空田地

**实际生长时间公式**：
```
actualGrowthTime = baseTime / (1 + gardenSpeedBonus + waterBonus + fertilizerBonus)

其中：
- baseTime = crop.growthTime（秒）；连续收割周期使用 crop.reharvestTime（如有）
- gardenSpeedBonus = GardenLevelData[gardenLevel].speedBonus
- waterBonus = plot.watered ? 0.20 : 0
- fertilizerBonus = plot.fertilized ? 0.30 : 0
```

**验收场景**：

```
WHEN 作物处于 growing 且 elapsed >= actualGrowthTime * 1000
THEN plot.state = 'ready', plot.readyAt = Date.now()
AND emit farm:crop_ready({plotIndex, cropId})

WHEN 作物处于 ready 且 Date.now() - readyAt >= 48 * 3600 * 1000
THEN plot 重置为 idle：state='idle', cropId=null, plantedAt=null, readyAt=null, watered=false, fertilized=false, hasBug=false, bugTriggered=false, remainHarvests=0, isReharvest=false
AND emit farm:withered({plotIndex})

WHEN 离线 2 小时后上线
AND 作物基础生长时间 180 秒
THEN 上线后首次 tick 即检测到 elapsed 远超生长时间，立即标记 ready

WHEN 菜园等级 < 1（菜园未建造）
THEN onTick 直接返回，不处理任何田地
```

---

### 能力 4：收获 (CAP-FARM-03)

**描述**：收获成熟作物，发放资源和经验，处理双倍收获和连续收割。

**接口**：
- `harvest(plotIndex, isAuto)` → `{ok: boolean, yields?: object, isDouble?: boolean, reason?: string}`

**行为规则**：
- 只能收获 `state === 'ready'` 的田地
- 产量倍率计算（累乘）：
  1. 基础 `yieldMultiplier = 1`
  2. 虫害：`hasBug ? ×0.7 : ×1`
  3. 自动收获：`isAuto ? ×0.8 : ×1`
  4. 施肥加成：`fertilized ? ×(1 + compostLevel * 0.05) : ×1`
  5. 熟练度加成：`×(1 + mastery.yieldBonus)`
  6. 双倍概率：`随机 < gardenData.doubleChance ? ×2 : ×1`
- 最终产出：`Math.floor(crop.yields[res] * yieldMultiplier)` 每种资源
- 通过 `ResourceManager.add(type, amount)` 发放资源
- 收获的作物加入 inventory：`inventory[cropId] += 1`
- 累加农耕经验：`farmExp += crop.farmExp`
- 连续收割：`remainHarvests > 0` 时，收获后不清空田地，回到 growing 状态重新计时
- 双倍命中时 emit `toast:show` "大丰收"提示
- emit `farm:harvested`
- 可选 EconomyManager.logEvent 记录

**验收场景**：

```
WHEN harvest(0) 正常收获
AND plots[0].state === 'ready'
AND crop.yields = {food:5}
AND 无虫害、无施肥、mastery.yieldBonus=0、doubleChance=0
THEN ResourceManager.add('food', 5)
AND inventory[cropId] += 1
AND farmExp += crop.farmExp
AND plots[0] 重置为 idle
AND emit farm:harvested

WHEN harvest(0) 虫害减产
AND plots[0].hasBug === true
THEN yieldMultiplier 包含 ×0.7（减产 30%）

WHEN harvest(0, true) 自动收获
THEN yieldMultiplier 包含 ×0.8（减产 20%）

WHEN harvest(0) 施肥增产
AND plots[0].fertilized === true
AND compost_pit level = 3
THEN yieldMultiplier 包含 ×(1 + 3*0.05) = ×1.15

WHEN harvest(0) 双倍命中
AND GardenLevelData[level].doubleChance > 0
AND Math.random() < doubleChance
THEN yieldMultiplier ×= 2
AND emit toast:show({type:'success', message:'🎉 大丰收！产量翻倍！'})

WHEN harvest(0) 韭菜连续收割
AND crop = chives (reharvestCount=1, reharvestTime=120)
AND plot.remainHarvests = 1（首次收获）
THEN remainHarvests -= 1，plot 回到 growing 状态
AND plot.plantedAt = Date.now()，plot.isReharvest = true（仅当 crop.reharvestTime 存在时设置）
AND 下次生长使用 reharvestTime=120 秒

WHEN harvest(0) 未成熟
AND plots[0].state !== 'ready'
THEN 返回 {ok:false, reason:'作物未成熟'}
```

---

### 能力 5：浇水 (CAP-FARM-04)

**描述**：对生长中的田地浇水，加速 20%。每个生长周期限浇水 1 次。

**接口**：
- `water(plotIndex)` → `{ok: boolean, reason?: string}`

**行为规则**：
- 只能对 `state === 'growing'` 的田地浇水
- 每个周期只能浇水 1 次（`watered === true` 时拒绝）
- 设置 `plot.watered = true`，生长时间公式中自动生效 waterBonus=0.20
- emit `farm:watered`

**验收场景**：

```
WHEN water(0)
AND plots[0].state === 'growing'
AND plots[0].watered === false
THEN plots[0].watered = true
AND emit farm:watered({plotIndex:0})

WHEN water(0)
AND plots[0].watered === true
THEN 返回 {ok:false, reason:'已浇过水'}

WHEN water(0)
AND plots[0].state !== 'growing'
THEN 返回 {ok:false, reason:'作物未在生长中'}

WHEN water(99) 无效田地索引
THEN 返回 {ok:false, reason:'无效田地'}
```

---

### 能力 6：施肥 (CAP-FARM-05)

**描述**：消耗肥料对生长中的田地施肥，加速 30% 并在收获时增产。

**接口**：
- `fertilize(plotIndex)` → `{ok: boolean, reason?: string}`

**行为规则**：
- 只能对 `state === 'growing'` 的田地施肥
- 每个周期只能施肥 1 次（`fertilized === true` 时拒绝）
- 消耗 1 份肥料（`fertilizer -= 1`）
- 设置 `plot.fertilized = true`，生长时间公式中自动生效 fertBonus=0.30
- 收获时产量额外 ×(1 + compostLevel × 0.05)
- emit `farm:fertilized`

**验收场景**：

```
WHEN fertilize(0)
AND plots[0].state === 'growing'
AND plots[0].fertilized === false
AND fertilizer >= 1
THEN fertilizer -= 1
AND plots[0].fertilized = true
AND emit farm:fertilized({plotIndex:0})

WHEN fertilize(0)
AND plots[0].fertilized === true
THEN 返回 {ok:false, reason:'已施过肥'}

WHEN fertilize(0)
AND fertilizer === 0
THEN 返回 {ok:false, reason:'肥料不足'}

WHEN fertilize(0)
AND plots[0].state !== 'growing'
THEN 返回 {ok:false, reason:'作物未在生长中'}

WHEN fertilize(99) 无效田地索引
THEN 返回 {ok:false, reason:'无效田地'}
```

---

### 能力 7：虫害与除虫 (CAP-FARM-06)

**描述**：生长过程中概率触发虫害，玩家付费除虫，未除虫则减产。

**接口**：
- `removeBug(plotIndex)` → `{ok: boolean, reason?: string}`

**行为规则**：
- **虫害触发**（tick 内自动）：作物生长进度首次 ≥50% 时，以 15% 概率触发虫害（受熟练度 bugReduction 减免）
  - 实际概率 = `0.15 × (1 - mastery.bugReduction)`
  - 每块田每个生长周期最多触发 1 次（`bugTriggered` 标记）
  - 触发时 emit `farm:bug_alert`
- **除虫**：消耗 50 金币，清除虫害标记
  - 检查金币：`ResourceManager.canAfford('gold', 50)`
  - 扣除金币：`ResourceManager.spend('gold', 50, 'farming', 'bug_removal')`
  - emit `farm:bug_removed`
  - 可选 EconomyManager.logEvent 记录
- **未除虫减产**：收获时 `hasBug === true` → `yieldMultiplier × 0.7`（减产 30%）

**验收场景**：

```
WHEN 作物生长进度首次达到 ≥50%
AND Math.random() < 0.15 × (1 - mastery.bugReduction)
AND bugTriggered === false
THEN plot.bugTriggered = true, plot.hasBug = true
AND emit farm:bug_alert({plotIndex, cropId})

WHEN 虫害已触发（bugTriggered === true）
AND 再次 tick 到 ≥50%
THEN 不会重复触发虫害

WHEN removeBug(0)
AND plots[0].hasBug === true
AND ResourceManager.canAfford('gold', 50) === true
THEN ResourceManager.spend('gold', 50, 'farming', 'bug_removal')
AND plots[0].hasBug = false
AND emit farm:bug_removed({plotIndex:0})

WHEN removeBug(0)
AND plots[0].hasBug === false
THEN 返回 {ok:false, reason:'没有虫害'}

WHEN removeBug(0)
AND ResourceManager.canAfford('gold', 50) === false
THEN 返回 {ok:false, reason:'金币不足（需要50金）'}
```

---

### 能力 8：购买种子 (CAP-FARM-10)

**描述**：在种子铺购买种子，价格随种子铺等级享受折扣。

**接口**：
- `buySeed(cropId)` → `{ok: boolean, reason?: string}`

**行为规则**：
- 检查种子铺 level ≥ 1
- 检查作物品级 ≤ 种子铺等级（`crop.quality > shopLevel` 时拒绝）
- 折扣计算：`discount = 0.05 × (shopLevel - 1)`
- 实际费用：`Math.floor(seedCost[res] × (1 - discount))`
- 通过 `ResourceManager.canAffordMultiple(cost)` 检查、`ResourceManager.spendMultiple(cost, 'farming', 'seed_shop', cropId)` 扣费
- `seeds[cropId] += 1`
- emit `farm:seed_bought`
- 可选 EconomyManager.logEvent 记录

**验收场景**：

```
WHEN buySeed('cabbage')
AND seed_shop level = 2
AND cabbage.seedCost = {gold:10}
AND discount = 0.05 × (2-1) = 5%
THEN 实际费用 = {gold: Math.floor(10 × 0.95)} = {gold:9}
AND ResourceManager.spendMultiple({gold:9}, 'farming', 'seed_shop', 'cabbage')
AND seeds.cabbage += 1
AND emit farm:seed_bought({cropId:'cabbage', cost:{gold:9}})

WHEN buySeed('snow_lotus')
AND snow_lotus.quality=4 > seed_shop level=2
THEN 返回 {ok:false, reason:'种子铺等级不足，无法购买该品级种子'}

WHEN buySeed('cabbage')
AND seed_shop level = 0（未建造）
THEN 返回 {ok:false, reason:'需要建造种子铺'}

WHEN buySeed('cabbage')
AND ResourceManager.canAffordMultiple(cost) === false
THEN 返回 {ok:false, reason:'资源不足'}

WHEN buySeed('nonexistent')
THEN 返回 {ok:false, reason:'未知作物'}
```

---

### 能力 9：种子合成 (CAP-FARM-07)

**描述**：消耗作物库存中的材料合成高级种子。

**接口**：
- `synthesizeSeed(recipeIndex)` → `{ok: boolean, reason?: string}`

**行为规则**：
- `recipeIndex` 为 CropSynthesis 数组索引
- 检查种子铺 level ≥ recipe.minShopLevel
- 检查 inventory 中每种材料数量充足
- 扣除材料（从 inventory 减少，减至 0 时删除键）
- `seeds[recipe.result] += 1`
- emit `farm:seed_synthesized`

**验收场景**：

```
WHEN synthesizeSeed(0)
AND recipe = {materials: {cabbage:5, radish:5}, result:'eggplant', minShopLevel:2}
AND seed_shop level = 2
AND inventory.cabbage >= 5, inventory.radish >= 5
THEN inventory.cabbage -= 5, inventory.radish -= 5
AND seeds.eggplant += 1
AND emit farm:seed_synthesized({recipeIndex:0, result:'eggplant'})

WHEN synthesizeSeed(0)
AND seed_shop level = 1 < recipe.minShopLevel=2
THEN 返回 {ok:false, reason:'种子铺等级不足（需 Lv.2）'}

WHEN synthesizeSeed(0)
AND inventory.cabbage = 3 < 需要 5
THEN 返回 {ok:false, reason:'材料不足：白菜'}

WHEN synthesizeSeed(999) 无效配方索引
THEN 返回 {ok:false, reason:'未知配方'}
```

---

### 能力 10：料理 (CAP-FARM-08)

**描述**：消耗作物制作料理，激活战斗 Buff。新料理覆盖旧 Buff。

**接口**：
- `cook(recipeId)` → `{ok: boolean, overridden?: boolean, reason?: string}`

**行为规则**：
- 检查菜园等级 ≥ 5
- 检查 inventory 中材料充足
- 扣除材料
- 设置 `activeBuff = {recipeId, effects: deepClone(recipe.effects), activatedAt: Date.now(), duration: recipe.duration}`
- 若已有旧 Buff，标记 `overridden=true`，emit `toast:show` 覆盖提示
- emit `farm:cooked`
- Buff 过期检测在 `onTick` 中：`Date.now() - activatedAt >= duration * 1000` 时清除，emit `farm:buff_expired`

**验收场景**：

```
WHEN cook('vegetable_soup')
AND 菜园等级 >= 5
AND inventory 有 cabbage>=3, radish>=2
AND activeBuff === null
THEN inventory 扣除材料
AND activeBuff = {recipeId:'vegetable_soup', effects:{hpBonus:0.10}, activatedAt:Date.now(), duration:1800}
AND emit farm:cooked({recipeId:'vegetable_soup', overridden:false})
AND 返回 {ok:true, overridden:false}

WHEN cook('cucumber_salad')
AND activeBuff 已有旧 Buff
THEN 新 Buff 覆盖旧 Buff
AND emit toast:show({type:'info', message:'新料理已覆盖旧的增益效果'})
AND emit farm:cooked({recipeId:'cucumber_salad', overridden:true})
AND 返回 {ok:true, overridden:true}

WHEN cook('vegetable_soup')
AND 菜园等级 = 3 < 5
THEN 返回 {ok:false, reason:'菜园 Lv.5 才能解锁料理'}

WHEN cook('vegetable_soup')
AND inventory.cabbage = 1 < 需要 3
THEN 返回 {ok:false, reason:'材料不足：白菜'}

WHEN cook('nonexistent')
THEN 返回 {ok:false, reason:'未知料理'}
```

---

### 能力 11：自动收获 (CAP-FARM-09)

**描述**：菜园 Lv.≥5 解锁自动收获功能，开启后 ready 作物在 tick 中自动收获，产量 80%。

**接口**：
- `toggleAutoHarvest()` → `{ok: boolean, enabled?: boolean, reason?: string}`

**行为规则**：
- 切换 `autoHarvest` 开关（true↔false）
- 菜园等级 < 5 时拒绝
- 开启后，`onTick` 中遍历 ready 田地调用 `harvest(j, true)`（isAuto=true → 产量 ×0.8）
- emit `farm:auto_harvest_toggled`

**验收场景**：

```
WHEN toggleAutoHarvest()
AND 菜园等级 >= 5
AND autoHarvest === false
THEN autoHarvest = true
AND emit farm:auto_harvest_toggled({enabled:true})

WHEN toggleAutoHarvest()
AND 菜园等级 >= 5
AND autoHarvest === true
THEN autoHarvest = false
AND emit farm:auto_harvest_toggled({enabled:false})

WHEN toggleAutoHarvest()
AND 菜园等级 < 5
THEN 返回 {ok:false, reason:'菜园 Lv.5 解锁自动收获'}

WHEN autoHarvest === true 且有 ready 田地
AND onTick 执行
THEN 自动调用 harvest(j, true)，产量 ×0.8
```

---

### 能力 12：制作肥料

**描述**：在堆肥坑中用普通作物制作肥料。

**接口**：
- `makeFertilizer()` → `{ok: boolean, reason?: string}`

**行为规则**：
- 检查堆肥坑 level ≥ 1
- 统计 inventory 中 quality=1 的作物总数 ≥ 3
- 肥料上限 = `10 + 5 × compostLevel`
- 轮询扣除 3 个普通作物（round-robin，先扣完一种再扣下一种）
- `fertilizer += 1`
- emit `farm:fertilizer_made`

**验收场景**：

```
WHEN makeFertilizer()
AND compost_pit level = 2
AND inventory 中普通作物总数 >= 3
AND fertilizer < 上限(10+5×2=20)
THEN 扣除 3 个普通作物
AND fertilizer += 1
AND emit farm:fertilizer_made({fertilizer: 新值})

WHEN makeFertilizer()
AND compost_pit level = 0（未建造）
THEN 返回 {ok:false, reason:'需要建造堆肥坑'}

WHEN makeFertilizer()
AND inventory 中普通作物总数 < 3
THEN 返回 {ok:false, reason:'普通作物不足（需要3个）'}

WHEN makeFertilizer()
AND fertilizer >= 上限
THEN 返回 {ok:false, reason:'肥料已满（上限X）'}
```

---

### 能力 13：出售作物

**描述**：出售作物库存换取金币。

**接口**：
- `sellCrop(cropId, count)` → `{ok: boolean, gold?: number, reason?: string}`

**行为规则**：
- 检查 inventory[cropId] >= count
- 售价 = `Math.floor((crop.seedCost.gold || 10) × 0.6)` 每个作物
- 总收入 = 售价 × count
- 从 inventory 扣除，减至 0 时删除键
- 通过 `ResourceManager.add('gold', totalGold)` 发放金币
- emit `farm:crop_sold`
- 可选 EconomyManager.logEvent 记录

**验收场景**：

```
WHEN sellCrop('cabbage', 5)
AND inventory.cabbage >= 5
AND cabbage.seedCost.gold = 10
THEN 售价 = Math.floor(10 × 0.6) = 6 金/个
AND totalGold = 6 × 5 = 30
AND ResourceManager.add('gold', 30)
AND inventory.cabbage -= 5
AND emit farm:crop_sold({cropId:'cabbage', count:5, gold:30})

WHEN sellCrop('cabbage', 10)
AND inventory.cabbage = 5 < 10
THEN 返回 {ok:false, reason:'作物数量不足'}

WHEN sellCrop('nonexistent', 1)
AND inventory 中不存在该 cropId
THEN 返回 {ok:false, reason:'作物数量不足'}
注：CropData 检查（L520）为防御性代码，正常路径不会触发——inventory 不含该 key 时先命中 L516 的库存检查
```

---

### 能力 14：查询 API

**描述**：提供只读查询接口供 UI 和其他 Manager 使用。

**接口**：
- `getActiveBuff()` → `object | null` — 返回当前料理 Buff 的深拷贝（已过期则清除并返回 null）
- `getFarmMastery()` → `object` — 返回当前熟练度等级数据的深拷贝
- `getPlotProgress(plotIndex)` → `number | null` — 返回生长进度 [0,1]，非 growing 返回 null
- `getRemainingTime(plotIndex)` → `number` — 返回剩余生长时间（秒），非 growing 返回 0

**行为规则**：
- `getActiveBuff()` 在查询时做过期检测：`Date.now() - activatedAt >= duration × 1000` 时清除（但不 emit `farm:buff_expired`——事件由 `onTick` 统一负责发射）
- `getFarmMastery()` 根据 farmExp 从 FarmMasteryData 查找对应等级（从高到低匹配）
- `getPlotProgress()` = `Math.min(1, elapsed / actualGrowthTime)`
- `getRemainingTime()` = `Math.max(0, actualGrowthTime - elapsed)`

**验收场景**：

```
WHEN getActiveBuff()
AND activeBuff 有效（未过期）
THEN 返回 activeBuff 的深拷贝

WHEN getActiveBuff()
AND activeBuff 已过期
THEN activeBuff 清除为 null，返回 null

WHEN getFarmMastery()
AND farmExp = 2000
THEN 返回 {title:'农耕达人', minExp:2000, yieldBonus:0.10, bugReduction:0, extra:'batchWater'}

WHEN getPlotProgress(0)
AND plots[0].state === 'growing'
AND elapsed = actualGrowthTime/2
THEN 返回 0.5

WHEN getPlotProgress(0)
AND plots[0].state !== 'growing'
THEN 返回 null

WHEN getRemainingTime(0)
AND plots[0].state === 'growing'
AND actualGrowthTime=180, elapsed=60
THEN 返回 120（秒）
```

---

## 内部辅助方法

| 方法 | 用途 |
|------|------|
| `_emptyPlot()` | 创建空田地对象（全部字段默认值） |
| `_getGardenLevel()` | 从 TownManager 读取菜园建筑等级（0=未建造） |
| `_getBuildingLevel(buildingId)` | 从 TownManager 读取指定建筑等级 |
| `_getPlotCount(gardenLevel)` | 根据菜园等级查询 GardenLevelData 得到田地数；gardenLevel > 10 时回退到 `gardenLevel + 1` |
| `_getActualGrowthTime(crop, plot, gardenLevel)` | 生长时间公式计算 |
| `_tickGrowing(plot, plotIndex, now, gardenLevel)` | tick 中处理 growing 状态 |
| `_tickReady(plot, plotIndex, now)` | tick 中处理 ready 状态 |

## 不变量

1. **田地状态三态**：`idle` → `growing` → `ready` → `idle`（或 `ready` → `idle` 枯萎）
2. **种子先行**：播种前必须拥有种子（seeds[cropId] > 0）
3. **浇水/施肥限 1 次**：每个生长周期 watered 和 fertilized 各只能设为 true 一次
4. **虫害限 1 次**：每个生长周期 bugTriggered 最多设为 true 一次
5. **资源不可为负**：所有资源消耗通过 ResourceManager 的 canAfford/spend 检查
6. **肥料有上限**：`fertilizer ≤ 10 + 5 × compostLevel`
7. **品级解锁**：种植受 qualityUnlock 限制，购买受 shopLevel 限制

## 已修复问题

| ID | 严重度 | 描述 | 修复日期 |
|----|--------|------|----------|
| BUG-01 | **P0** | `removeBug()` 调用 `ResourceManager.has()` → 修正为 `canAfford('gold', 50)` | 2026-04-14 |
| BUG-02 | **P0** | `removeBug()` 使用 `ResourceManager.add('gold', -cost)` → 修正为 `ResourceManager.spend('gold', cost, 'farming', 'bug_removal')` | 2026-04-14 |
| BUG-03 | **P1** | `_tickReady` 枯萎和 `plant()` 未重置 `isReharvest` → 两处均已补充 `plot.isReharvest = false` | 2026-04-14 |

## 交叉引用同步状态

`specs/system/core-contracts.md` 已包含全部 FarmManager 相关声明 ✅：
- 服务表：FarmManager 条目
- 跨模块写操作：FarmManager → ResourceManager（canAfford/spend/add/canAffordMultiple/spendMultiple）
- 跨模块只读查询：FarmManager → TownManager.getState()
- 事件契约：全部 15 个 farm:* 事件
- 存档格式：`"farm": "FarmManager.getState()"`
- 初始化顺序：#11 FarmManager
- Tick 顺序：#7 FarmManager.onTick(dt)
