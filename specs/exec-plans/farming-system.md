# 执行计划：种菜系统（Farming System）

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联规范** | [product-specs/farming-system.md](../product-specs/farming-system.md) |
| **设计文档** | [ai-docs/18-farming-system.md](../../ai-docs/18-farming-system.md) |
| **创建** | 2026-04-05 |

---

## 目标

实现完整的种菜系统：扩展主城地图 24→32、新增 3 栋建筑、27 种作物数据、播种/生长/收获/浇水/施肥/除虫核心循环、种子合成、料理 Buff 系统、菜园 UI 面板。

## 前置条件

- [x] 产品规范已审查并修复（13 项问题已解决）
- [x] 设计文档 ai-docs/18-farming-system.md 完成
- [ ] 无外部依赖（纯前端 + localStorage）

---

## 阶段 1：数据层 + 基础设施

> 先建数据表和扩展建筑注册，不涉及游戏逻辑。完成后其他阶段可并行。

### 任务 1.1 — 创建作物静态数据表 `js/data/crops.js`

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §4（作物详细数据表）、§11.2（CropData 结构） |
| **输入** | ai-docs/18-farming-system.md §4.1~4.5 全部 27 种作物 |
| **输出** | `js/data/crops.js` — 全局 `CropData` 对象 |
| **约束** | 全局变量，不用 class/import；`quality` 对齐 `CONSTANTS.QUALITY`；时间单位统一为秒 |
| **验证** | 1. 文件可被浏览器加载无报错 2. `Object.keys(CropData).length === 27` 3. 每种作物含 id/name/emoji/quality/growthTime/seedCost/yields/farmExp/reharvestCount/description |

数据包含：
- 6 种普通 (cabbage/radish/chives/bean_sprout/greens/scallion)
- 6 种优良 (eggplant/cucumber/pumpkin/chili/watermelon/lotus_root)
- 6 种精良 (lingzhi/angelica/astragalus/wolfberry/poria/chuanxiong)
- 5 种史诗 (snow_lotus/fleece_flower/snow_ginseng/calamus/blood_lingzhi)
- 4 种传说 (peach_of_immortality/ancient_spirit_sprout/immortal_herb/dragon_saliva_grass)

额外数据：
- 合成配方表 `CropSynthesis` — 每条包含 `{materials: {cropId: count}, result: seedId}`
- 料理配方表 `RecipeData` — 每条包含 `{id, name, emoji, quality, materials: {cropId: count}, effects: {...}, duration, description}`

### 任务 1.2 — 新增建筑数据 `js/data/buildings.js`

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §5.1~5.2（菜园建筑）、§6（辅助建筑）、规范 §2.2 |
| **输入** | `js/data/buildings.js` 现有结构 |
| **输出** | `BuildingData` 新增 3 个建筑条目：`vegetable_garden`、`compost_pit`、`seed_shop` |
| **约束** | 使用现有 `costFormula`/`effects` 函数模式；`requires` 用 `{farmland: 3}` / `{vegetable_garden: 3}` / `{vegetable_garden: 1}` |
| **验证** | 1. `BuildingData.vegetable_garden` 存在且 maxLevel=10 2. `BuildingData.compost_pit` 存在且 maxLevel=5 3. `BuildingData.seed_shop` 存在且 maxLevel=5 4. 各 `costFormula(1)` 返回值与设计文档一致 |

### 任务 1.3 — TownWorld 地图扩展 + 建筑注册

| 字段 | 值 |
|------|-----|
| **规范引用** | 规范 §2.1（地图扩展）、设计文档 §2.2~2.4 |
| **输入** | `js/ui/town-world.js` — MAP_W/MAP_H、_buildingSizes、_defaultPositions |
| **输出** | MAP_W=32, MAP_H=32；新增 3 个建筑的 sizes 和 positions；原有建筑 x 坐标 +4 |
| **约束** | _defaultPositions 中原有 20 栋建筑的 gx 统一 +4（居中于 32 格宽地图） |
| **验证** | 1. 打开游戏主城画面无报错 2. 地图可平移到新区域（南区 y>24） 3. 原有建筑正常显示（位置居中） 4. 新建筑 vegetable_garden 在 (18, 25) 处可见 |

### 任务 1.4 — TownManager 注册新建筑

| 字段 | 值 |
|------|-----|
| **规范引用** | 规范 §4 非功能需求、CAP-FARM-11 |
| **输入** | `js/modules/town-manager.js` — _state.buildings、_getDefaultBuildings() |
| **输出** | _state.buildings 和 _getDefaultBuildings() 新增 3 个建筑；存档迁移逻辑（旧存档 placements gx+4） |
| **约束** | 旧存档兼容：init() 中检测旧坐标范围，自动迁移 |
| **验证** | 1. TownManager.getBuildingLevel('vegetable_garden') 返回 0 2. TownManager.canUpgrade('vegetable_garden') 在 farmland<3 时返回 reason 3. 旧存档加载后建筑位置正确偏移 |

### 任务 1.5 — index.html script 注册

| 字段 | 值 |
|------|-----|
| **规范引用** | copilot-instructions.md Script 加载顺序 |
| **输入** | `index.html` |
| **输出** | 添加 `<script src="js/data/crops.js">` (data 层)、`<script src="js/modules/farm-manager.js">` (modules 层)、`<script src="js/ui/farm-panel.js">` (ui 层) |
| **约束** | 层级顺序：data → modules → ui → main.js |
| **验证** | 浏览器打开无 ReferenceError |

---

## 阶段 2：核心逻辑层 — FarmManager

> 实现所有 CAP-FARM-01 ~ CAP-FARM-11 的业务逻辑。依赖阶段 1 完成。

### 任务 2.1 — FarmManager 骨架 + 状态管理

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §11.1（FarmManager 状态）、copilot-instructions 模块模板 |
| **输入** | 模块模板、FarmManager 状态结构 |
| **输出** | `js/modules/farm-manager.js` — init(saved)/getState()/onTick(dt) 骨架 |
| **约束** | 全局单例；_state 含 plots/inventory/seeds/fertilizer/farmExp/autoHarvest/activeBuff；init 从 `saved.farm` 恢复 |
| **验证** | 1. FarmManager.init({}) 不报错 2. FarmManager.getState() 返回可序列化对象 3. plots 数组长度 = 菜园等级对应田地数 |

### 任务 2.2 — 播种逻辑 (CAP-FARM-01)

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-FARM-01 |
| **输入** | FarmManager 骨架 |
| **输出** | `FarmManager.plant(plotId, cropId)` 方法 |
| **约束** | 检查种子库存、田地空闲、作物品级 ≤ 菜园解锁品级 |
| **验证** | WHEN 有种子且田地空闲 THEN seeds[cropId]-=1, plot.state='growing', plot.plantedAt=Date.now() 且 emit farm:planted。WHEN 无种子 THEN 返回 {ok:false, reason:'种子不足'} |

### 任务 2.3 — 生长 + 枯萎 tick 逻辑 (CAP-FARM-02)

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-FARM-02 |
| **输入** | FarmManager 骨架 |
| **输出** | onTick 中检测 growing→ready 和 ready→withered 转换 |
| **约束** | 实际生长时间 = `基础时间 / (1 + 菜园速度 + 浇水0.20 + 施肥0.30)`；枯萎阈值 48h；离线回来补算 |
| **验证** | WHEN 生长时间到 THEN state='ready' + emit。WHEN ready 超 48h THEN state→idle + emit farm:withered。WHEN 离线 2h 后上线 THEN 3 分钟菜已标记 ready |

### 任务 2.4 — 收获逻辑 (CAP-FARM-03)

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-FARM-03 |
| **输入** | FarmManager |
| **输出** | `FarmManager.harvest(plotId)` 方法 |
| **约束** | 发放 yields 资源（通过 ResourceManager）；增加 farmExp；双倍概率 = 菜园等级表；连续收割逻辑 (remainHarvests)；虫害减产 -30% |
| **验证** | WHEN ready 收获 THEN 资源增加、emit farm:harvested。WHEN 双倍命中 THEN yields×2 + toast。WHEN 韭菜首次收获 THEN remainHarvests=0, state→growing, 120s 后再次 ready |

### 任务 2.5 — 浇水 + 施肥 + 除虫 (CAP-FARM-04/05/06)

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-FARM-04、CAP-FARM-05、CAP-FARM-06 |
| **输入** | FarmManager |
| **输出** | `water(plotId)`、`fertilize(plotId)`、`removeBug(plotId)` 方法；onTick 中虫害触发 |
| **约束** | 浇水免费限 1 次；施肥消耗 1 肥料、产量 +(堆肥坑等级×5)%；虫害在进度首次≥50% 时 15% 概率触发 1 次 |
| **验证** | WHEN 浇水 THEN watered=true + emit。WHEN 施肥 THEN fertilizer-=1 + fertilized=true + emit。WHEN 已浇水再浇 THEN 返回 {ok:false}。WHEN 虫害触发 THEN bugTriggered=true, hasBug=true + emit farm:bug_alert。WHEN 除虫 THEN gold-=50, hasBug=false |

### 任务 2.6 — 种子购买 + 合成 (CAP-FARM-07/10)

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-FARM-07、CAP-FARM-10 |
| **输入** | CropData/CropSynthesis, FarmManager |
| **输出** | `buySeed(cropId)`、`synthesizeSeed(recipeIndex)` 方法 |
| **约束** | 购买检查种子铺等级解锁范围；合成检查材料充足 + 种子铺等级足够 |
| **验证** | WHEN 购买 THEN gold 减少, seeds[cropId]+=1。WHEN 合成 THEN 材料减少, seeds[result]+=1。WHEN 种子品级>铺等级 THEN 购买返回 false |

### 任务 2.7 — 料理系统 (CAP-FARM-08)

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-FARM-08、设计文档 §8 |
| **输入** | RecipeData, FarmManager |
| **输出** | `cook(recipeId)` 方法；onTick 中 activeBuff 过期检测 |
| **约束** | 菜园 Lv.≥5 才能料理；新 Buff 覆盖旧；activeBuff 结构含 recipeId/effects/activatedAt/duration；过期判定 Date.now()-activatedAt >= duration*1000 |
| **验证** | WHEN 料理 THEN activeBuff 设置 + emit。WHEN 已有 Buff 且料理 THEN 覆盖并返回覆盖提示。WHEN Buff 过期 THEN activeBuff→null |

### 任务 2.8 — 自动收获 + 肥料制作 (CAP-FARM-09)

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-FARM-09、设计文档 §6.1 堆肥坑 |
| **输入** | FarmManager |
| **输出** | onTick 中自动收获逻辑；`makeFertilizer()` 方法（消耗 3 个普通作物 → 1 肥料） |
| **约束** | 自动收获：菜园 Lv.≥5 + autoHarvest=true → ready 时下一 tick 收获，yields×0.8 |
| **验证** | WHEN autoHarvest=true + ready THEN 自动收获产出 80%。WHEN makeFertilizer THEN 扣 3 个普通作物 + fertilizer+=1 |

### 任务 2.9 — 农耕经验 + 熟练度系统

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §9.3 |
| **输入** | FarmManager |
| **输出** | `getFarmLevel()` 返回熟练度等级和效果；收获时累加 farmExp |
| **约束** | 5 级熟练度（新手/老农/达人/大师/农神），产量加成 0/5/10/15/20%，虫害概率减半（大师级） |
| **验证** | WHEN farmExp=2000 THEN getFarmLevel().title='农耕达人', getFarmLevel().yieldBonus=0.10 |

---

## 阶段 3：main.js 集成

> 注册 FarmManager 到游戏生命周期。依赖阶段 2。

### 任务 3.1 — main.js 注册

| 字段 | 值 |
|------|-----|
| **规范引用** | copilot-instructions 新增模块清单 |
| **输入** | `js/main.js` |
| **输出** | getFullState() 添加 `farm: FarmManager.getState()`；initGame() 添加 `FarmManager.init(saved)`；game:tick 添加 `FarmManager.onTick(dt)` |
| **约束** | FarmManager.init 在 TownManager.init 之后（依赖建筑等级查询） |
| **验证** | 1. 游戏启动无报错 2. 存档包含 farm 字段 3. tick 正常驱动生长计时 |

### 任务 3.2 — 战斗系统集成料理 Buff

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §8.2（料理效果在战斗中生效） |
| **输入** | `js/modules/battle-manager.js` 属性计算部分 |
| **输出** | 战斗属性计算中加入 `FarmManager.getActiveBuff()` 加成 |
| **约束** | 仅当 activeBuff 非 null 且未过期时应用；与建筑加成叠加 |
| **验证** | WHEN 有料理 Buff ATK+5% THEN 战斗面板显示的 ATK 增加 5% |

---

## 阶段 4：UI 层

> 菜园面板渲染。依赖阶段 2 和 3。

### 任务 4.1 — FarmPanel 主面板 + 种植标签

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §13.1 |
| **输入** | `js/ui/farm-panel.js`（新建） |
| **输出** | FarmPanel 全局单例；init() 注册事件；_render() 显示田地网格（状态/倒计时/操作按钮） |
| **约束** | 使用 OverlayPanel.show()；4 个标签（种植/背包/合成/料理）；田地卡片显示状态+倒计时+浇水/施肥/收获按钮 |
| **验证** | 1. 点击菜园建筑打开面板 2. 田地显示正确状态 3. 倒计时每秒更新 4. 浇水/收获按钮可点击 |

### 任务 4.2 — 背包标签

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §13.2 |
| **输入** | FarmPanel |
| **输出** | 背包标签页：显示作物库存 + 种子库存，支持出售操作 |
| **约束** | 按品级分组排序；显示 emoji + 名称 + 数量；出售按钮 |
| **验证** | 1. 背包显示收获的作物 2. 出售后金币增加 + 作物减少 |

### 任务 4.3 — 合成标签

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §13.3、CAP-FARM-07 |
| **输入** | CropSynthesis, FarmPanel |
| **输出** | 合成标签页：显示配方列表，材料充足高亮，不足灰显 |
| **约束** | 显示每个配方所需材料 + 当前拥有量；合成后刷新 |
| **验证** | WHEN 材料足 THEN 合成按钮可点击、点击后种子+1。WHEN 材料不足 THEN 灰显 |

### 任务 4.4 — 料理标签

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §13.4、CAP-FARM-08 |
| **输入** | RecipeData, FarmPanel |
| **输出** | 料理标签页：配方列表 + 当前 Buff 状态 + 倒计时 |
| **约束** | 菜园 Lv.<5 时显示"菜园 Lv.5 解锁"；当前 Buff 显示在底部 |
| **验证** | 1. 料理列表按品级排序 2. 制作后 Buff 区域显示效果+倒计时 3. 已有 Buff 时制作弹出确认 |

### 任务 4.5 — TownWorld 点击菜园建筑打开面板

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §13 |
| **输入** | `js/ui/town-world.js` 建筑点击逻辑 |
| **输出** | 点击 vegetable_garden 调用 FarmPanel.open()；点击 seed_shop/compost_pit 打开对应子面板 |
| **约束** | 复用现有 TownWorld 建筑点击分发逻辑 |
| **验证** | 点击菜园建筑 → 菜园面板弹出 |

### 任务 4.6 — 经济系统集成

| 字段 | 值 |
|------|-----|
| **规范引用** | 设计文档 §14 第 9 条（EconomyManager 添加 farming 分类） |
| **输入** | `js/modules/economy-manager.js` |
| **输出** | 种菜相关资源变动记录到经济日志，category='farming'，source='harvest'/'seed_purchase'/'cooking' 等 |
| **约束** | 复用现有 EconomyManager.logEvent() 接口 |
| **验证** | 收获后经济面板能看到 farming 分类的收入记录 |

---

## 任务间依赖

```
阶段 1（并行）：
  1.1 crops.js ──┐
  1.2 buildings.js ──┤
  1.3 town-world.js ──┼── 阶段 2 全部
  1.4 town-manager.js ──┤
  1.5 index.html ──┘

阶段 2（大致顺序，部分可并行）：
  2.1 骨架 → 2.2 播种 → 2.3 生长 → 2.4 收获 → 2.5 辅助操作
                                              ↘ 2.6 购买/合成（可与 2.4 并行）
                                              ↘ 2.7 料理（可与 2.4 并行）
  2.8 自动收获 ← 2.4
  2.9 农耕经验 ← 2.4

阶段 3（顺序）：
  3.1 main.js ← 2.1
  3.2 战斗集成 ← 2.7

阶段 4（依赖 2+3）：
  4.1 主面板 → 4.2 背包 → 4.3 合成 → 4.4 料理
  4.5 建筑点击 ← 4.1
  4.6 经济集成（独立，可并行）
```

---

## 最终验证清单

- [ ] **CAP-FARM-01** 播种：有种子 + 空田地 → growing；无种子 → 提示
- [ ] **CAP-FARM-02** 生长：时间到 → ready；48h 未收 → withered；离线补算正确
- [ ] **CAP-FARM-03** 收获：ready → 发放资源 + 经验；双倍概率生效；韭菜连续收割
- [ ] **CAP-FARM-04** 浇水：growing + 未浇 → 加速 20%；重复浇水拒绝
- [ ] **CAP-FARM-05** 施肥：growing + 有肥料 → 加速 30% + 增产；无肥料拒绝
- [ ] **CAP-FARM-06** 除虫：50% 进度单次 15% 概率触发；除虫消 50 金；未除虫减产 30%
- [ ] **CAP-FARM-07** 合成：材料充足 → 获得种子；材料不足 → 灰显
- [ ] **CAP-FARM-08** 料理：材料足 + 菜园≥5 → 激活 Buff；覆盖旧 Buff 有确认
- [ ] **CAP-FARM-09** 自动收获：菜园≥5 + 开启 → 自动收获 80% 收益
- [ ] **CAP-FARM-10** 购买种子：金币足 → 种子+1；品级超铺等级 → 不显示
- [ ] **CAP-FARM-11** 建筑升级：复用 TownManager 流程；菜园升级后田地数增加
- [ ] 存档兼容：旧存档加载后建筑位置正确偏移 +4
- [ ] 地图 32×32 正常渲染，南区菜园建筑可见
- [ ] 浏览器控制台无 JS 错误
- [ ] 经济日志记录 farming 分类事件
- [ ] 料理 Buff 在战斗属性中生效
- [ ] 规范中所有 WHEN/THEN 场景通过

---

## 回滚计划

每个阶段完成后存档一次提交。若某阶段实现失败：

1. **阶段 1 失败**：revert 数据文件，不影响现有系统
2. **阶段 2 失败**：FarmManager 是独立模块，删除 farm-manager.js + main.js 注册即可回滚
3. **阶段 3 失败**：仅移除 main.js 中 3 处注册行
4. **阶段 4 失败**：删除 farm-panel.js，不影响逻辑层

关键安全网：TownWorld 地图扩展（任务 1.3）影响面最大，若建筑位置错乱可单独 revert 该文件。
