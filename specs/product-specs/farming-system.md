# 产品规范：种菜系统（Farming System）

| 属性 | 值 |
|------|-----|
| **状态** | Draft |
| **作者** | spec-architect |
| **创建日期** | 2026-04-05 |
| **关联文档** | [ai-docs/18-farming-system.md](../../ai-docs/18-farming-system.md) |
| **父级规范** | — |

---

## 1. 概述

种菜系统是城镇生活玩法。玩家在主城菜园种植作物，从普通蔬菜到传说仙草，收获用于获取资源、合成料理 Buff、制作高级种子。

## 2. 前提变更

### 2.1 主城地图扩展

| 变更项 | 变更前 | 变更后 |
|--------|--------|--------|
| TownWorld.MAP_W | 24 | 32 |
| TownWorld.MAP_H | 24 | 32 |
| 总格子数 | 576 | 1024 |

### 2.2 新增建筑

| 建筑 | ID | 前置条件 |
|------|----|---------|
| 菜园 | `vegetable_garden` | 农田 Lv.≥3 |
| 堆肥坑 | `compost_pit` | 菜园 Lv.≥3 |
| 种子铺 | `seed_shop` | 菜园 Lv.≥1 |

> **`requires` 语义约定**：`requires: { buildingId: N }` 表示“该建筑等级 ≥ N”，与现有 BuildingData 中 `requires` 字段保持一致。

## 3. 能力

### CAP-FARM-01：播种

WHEN 玩家拥有种子且有空闲田地
THEN 消耗 1 颗种子，田地状态变为 `growing`，记录播种时间

WHEN 玩家没有种子
THEN 播种按钮不可点击，提示"种子不足"

WHEN 所有田地已占用
THEN 提示"没有空闲田地"

### CAP-FARM-02：作物生长

WHEN 作物处于 `growing` 状态且 `当前时间 - plantedAt >= 实际生长时间`
THEN 状态变为 `ready`（可收获）

WHEN 作物处于 `ready` 状态超过 48 小时未收获
THEN 状态变为 `withered`（枯萎），无法收获，田地自动变为 `idle`

WHEN 离线期间作物成熟
THEN 上线后立即检测并标记为 `ready`

### CAP-FARM-03：收获

WHEN 玩家点击 `ready` 状态的田地
THEN 按作物数据表的 `yields` 发放资源，增加农耕经验，田地变为 `idle`

WHEN 菜园有双倍收获概率加成且随机命中
THEN 收获产出翻倍，显示"双倍丰收！"提示

WHEN 作物支持连续收割（`reharvestCount > 0`）
THEN 收获后不清空田地，进入 `growing` 状态等待 `reharvestTime`，剩余收割次数 -1

### CAP-FARM-04：浇水

WHEN 田地处于 `growing` 状态且本周期未浇水
THEN 标记 `watered = true`，重新计算实际生长时间 = `基础时间 / (1 + 菜园加成 + 0.20 + 施肥加成)`

WHEN 田地已浇过水
THEN 浇水按钮灰显，提示"已浇水"

### CAP-FARM-05：施肥

WHEN 田地处于 `growing` 状态且玩家有肥料且本周期未施肥
THEN 消耗 1 份肥料，标记 `fertilized = true`，重新计算实际生长时间 = `基础时间 / (1 + 菜园加成 + 浇水加成 + 0.30)`，产量 +(堆肥坑等级 × 5)%

WHEN 玩家无肥料
THEN 施肥按钮灰显，提示"肥料不足"

### CAP-FARM-06：除虫

WHEN 作物生长进度首次达到 ≥50% 时，以 15% 概率触发虫害（每块田每个周期最多触发 1 次）
THEN 田地显示虫害图标，通知玩家

WHEN 玩家对虫害田地除虫（消耗 50 金）
THEN 虫害清除，产量恢复正常

WHEN 虫害未处理且作物成熟
THEN 收获产量 -30%

### CAP-FARM-07：种子合成

WHEN 玩家拥有配方所需的全部作物且种子铺等级足够
THEN 消耗材料，获得 1 颗高级种子

WHEN 材料不足
THEN 合成按钮灰显，显示缺少的材料数量

### CAP-FARM-08：料理制作

WHEN 玩家拥有料理所需材料且菜园 Lv.≥5
THEN 消耗材料，激活料理 Buff

WHEN 已有活跃料理 Buff
THEN 新料理覆盖旧 Buff，确认对话框提示

### CAP-FARM-09：自动收获

WHEN 菜园 Lv.≥5 且自动收获已开启
THEN 作物成熟后在下一次 tick 自动收获，收益 -20%

WHEN 自动收获关闭
THEN 作物成熟后保持 `ready` 状态直到手动收获或枯萎

### CAP-FARM-10：购买种子

WHEN 玩家在种子铺购买种子
THEN 消耗金币（按种子价格），种子数量 +1

WHEN 种子品级超过种子铺当前等级解锁范围
THEN 种子不出现在商店列表中

### CAP-FARM-11：菜园建筑升级

> 菜园、堆肥坑、种子铺的升级复用 TownManager.startUpgrade() 标准流程，无新行为。

WHEN 玩家升级菜园/堆肥坑/种子铺
THEN 复用 TownManager 施工队列、资源花费、施工时间逻辑，检查城主府等级上限

WHEN 菜园升级完成
THEN 新田地槽位解锁，按菜园等级表扩展 plots 数组

## 4. 非功能需求

| 项目 | 要求 |
|------|------|
| 田地状态持久化 | 通过 SaveManager，含时间戳，支持离线计算 |
| 最大田地数 | 12 块 |
| tick 检测 | 每秒检测生长/枯萎/虫害，不额外占用渲染帧 |
| 背包容量 | 作物和种子按种类堆叠，每种无上限；总种类数受仓库 getInventoryCap() 限制 |
| 建筑注册 | vegetable_garden、compost_pit、seed_shop 需加入 TownManager._getDefaultBuildings()、TownWorld._buildingSizes 和 _defaultPositions |

## 5. 不在范围内

- 多人交易/拍卖行
- 作物品质随机（产出固定，仅双倍概率）
- 季节系统（v1 不做）
- 灌溉自动化建筑（v1 不做）

## 6. 交叉引用

- 资源系统：[ai-docs/06-resource-system.md](../../ai-docs/06-resource-system.md)
- 城镇系统：[ai-docs/13-town-system.md](../../ai-docs/13-town-system.md)
- 经济系统：[ai-docs/15-economy-system.md](../../ai-docs/15-economy-system.md)
- 详细设计：[ai-docs/18-farming-system.md](../../ai-docs/18-farming-system.md)
