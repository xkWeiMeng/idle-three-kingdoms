---
status: Active
created: 2026-04-06
updated: 2026-04-06
author: spec-architect
related:
  - specs/system/core-contracts.md
  - specs/design-docs/town-character-collision.md
changelog:
  - date: 2026-04-06
    author: spec-architect
    change: "初始草稿"
    reason: "新功能：城镇道路系统"
  - date: 2026-04-06
    author: spec-reviewer
    change: "审查修复：连接点改为入口、定义 _roadGrid、修正尺寸源、增加建筑移动场景、解决 3 个开放问题、提升为 Active"
    reason: "规范审查通过"
---

# 产品规范：城镇道路系统（Town Road System）

## 概述

城镇道路系统在已建建筑之间自动生成道路网络，让城镇画面从"草地上散落建筑"进化为"有道路连通的城镇"。道路使用最小生成树（MST）算法生成，按使用频率呈现不同宽度，角色寻路时优先沿道路行走。

## 参与者

| 参与者 | 描述 |
|--------|------|
| TownManager | 拥有道路状态（`_state.roads`），负责道路数据的生成、重算和序列化 |
| TownWorld | 渲染道路层（介于地面和装饰之间），维护运行时 `_roadGrid`，过滤道路上的装饰 |
| TownCharacters | 使用 A* 寻路在道路上移动，路外移动代价更高 |
| SaveManager | 通过 `TownManager.getState()` 持久化道路数据 |
| EventBus | `town:building_upgraded` 触发道路重算；建筑拖拽放置后由 `TownWorld._setPlacement()` 触发重算 |

## 范围

### 范围内

- C1: 建筑间自动生成 MST 道路网络
- C2: 道路按使用频率渲染不同宽度
- C3: 新道路的淡入动画
- C4: 角色 A* 寻路偏好道路
- C5: 道路数据持久化
- C6: 装饰物不出现在道路格上

### 范围外

- 玩家手动修建/拆除道路
- 道路建造消耗资源
- 道路对建筑产出的加成效果
- 道路上放置路灯/告示牌等附属装饰
- 跨区域道路（仅城镇内部）

## 能力

### C1: MST 道路网络生成

**描述**：当有 ≥2 个已建建筑存在时，系统自动计算 MST 并在网格上铺设道路。道路连接建筑的**入口点**（底部中心外侧格），采用 L 形曼哈顿路径，优先复用已有道路格。

**数据结构**：

```
TownManager._state.roads: Array<{ gx: number, gy: number, usage: number }>
```

- `gx`, `gy`: 网格坐标（0 ≤ gx < 40, 0 ≤ gy < 40）
- `usage`: 该格被多少条 MST 边经过（≥1）

**运行时道路网格**：

```
TownWorld._roadGrid: number[40][40]
```

- `_roadGrid[gy][gx]` = 该格的 `usage` 值（0 表示非道路格）
- 构建时机：TownWorld 初始化时从 `TownManager._state.roads` 构建；每次道路重算后同步更新
- 构建方式：清零整个 40×40 数组，遍历 `_state.roads` 填入 `usage` 值

**建筑入口点计算**：

每个建筑的入口点 = 建筑底部中心外侧的第一个格子：
- `entranceGX = placement.gx + floor(TownWorld._buildingSizes[id].w / 2)`
- `entranceGY = placement.gy + TownWorld._buildingSizes[id].h`（建筑占据区域正下方一格）
- 若入口点越界（`entranceGY ≥ 40`）或被其他建筑占据，则依次尝试建筑右侧中心、左侧中心、顶部中心
- 建筑尺寸来源：`TownWorld._buildingSizes[id]`（包含 `.w` 和 `.h`）
- 建筑放置位置来源：`TownManager._state.placements[id]`（包含 `.gx` 和 `.gy`）

**算法步骤**：

1. 收集所有已建建筑（`level > 0`）的入口点坐标
2. 若有效入口点数 < 2，清空道路数据并返回
3. 构建完全图，边权 = 两入口点的曼哈顿距离
4. 用 Prim 或 Kruskal 算法计算 MST
5. 对每条 MST 边，在网格上铺设 L 形路径：尝试"先水平后垂直"和"先垂直后水平"两种方案，选择能复用更多已有道路格的方案
6. 每个道路格记录被经过的边数（`usage`）
7. 道路格不得落在建筑占据的格子上；若 L 形路径的某个格子被建筑占据，则对该段使用 BFS 寻找最短绕行路径（仅搜索非建筑格，最大搜索深度 50 节点）

**验收场景**：

```
WHEN 城镇有 0 或 1 个已建建筑
THEN 不生成任何道路
AND  _state.roads 为空数组 []
```

```
WHEN 城镇有 2 个已建建筑（A 和 B）
THEN 生成一条从 A 入口点到 B 入口点的 L 形曼哈顿路径
AND  路径上每个格子的 usage = 1
AND  路径不穿过任何建筑占据的格子
```

```
WHEN 城镇有 3 个已建建筑（A、B、C）
THEN 生成 MST（2 条边）
AND  两条路径的公共格子 usage = 2
AND  道路格总数 ≤ distAB + distAC（MST 性质保证无冗余连接）
```

```
WHEN 新建筑建造完成（level 从 0 变为 1）
AND  已有 ≥1 个其他已建建筑
THEN 道路网络重新计算
AND  新道路格被添加到 _state.roads
AND  不再需要的旧道路格被移除
```

```
WHEN MST 路径需要穿过另一个建筑的占据区域
THEN 对被阻断的段使用 BFS 找到最短绕行路径（仅经过非建筑格）
AND  不在建筑占据格上铺设道路
AND  绕行路径的格子同样计入 usage
```

```
WHEN 玩家拖拽建筑到新位置（_setPlacement 被调用）
THEN 道路网络立即重新计算
AND  旧位置相关的道路格被清除
AND  新入口点被纳入 MST
```

```
WHEN 建筑入口点（底部中心）被其他建筑占据或越界
THEN 依次尝试建筑右侧中心、左侧中心、顶部中心作为入口点
AND  若所有方向均不可用，该建筑不参与道路网络
```

### C2: 道路宽度分级渲染

**描述**：道路根据 `usage` 值渲染为不同视觉层级，模拟真实城镇中主干道与小巷的差异。

**宽度等级**：

| usage | 等级 | 渲染宽度 | 颜色 alpha |
|-------|------|----------|------------|
| 1–2 | 小路 | 0.6 × CELL | 0.5 |
| 3–4 | 中路 | 0.8 × CELL | 0.7 |
| 5+ | 大道 | 1.0 × CELL | 0.9 |

**渲染方式**：使用已有的 `path_tile.svg` 资源，按宽度等级调整绘制区域和透明度。

**渲染层级**：在 `_render()` 中，道路绘制在 `_drawGround()` 之后、`_drawDecorations()` 之前。

```javascript
// _render() 中的调用顺序：
this._drawBorder(ctx);
this._drawGround(ctx);
this._drawRoads(ctx);        // ← 新增
this._drawDecorations(ctx);
this._drawBuildings(ctx);
```

**验收场景**：

```
WHEN 道路格 usage = 1
THEN 渲染宽度为 0.6 × 48 = 28.8px（居中）
AND  path_tile.svg 绘制 alpha = 0.5
```

```
WHEN 道路格 usage = 5
THEN 渲染宽度为 1.0 × 48 = 48px（填满整格）
AND  path_tile.svg 绘制 alpha = 0.9
```

```
WHEN 相邻两个道路格 usage 不同
THEN 各自按自身 usage 独立渲染
AND  视觉上可见宽度过渡
```

### C3: 道路淡入动画

**描述**：当道路网络重算后，新增的道路格以淡入效果出现，避免突兀的视觉跳变。

**动画参数**：
- 持续时间：2000ms
- 缓动：线性
- 效果：alpha 从 0 → 目标 alpha（由 usage 决定）

**实现**：每个道路格持有运行时（非序列化）`_fadeStart` 时间戳。`_drawRoads()` 根据当前时间与 `_fadeStart` 的差值计算实际 alpha。

**验收场景**：

```
WHEN 道路重算后产生了 3 个新道路格
THEN 这 3 个格子的 alpha 从 0 开始
AND  经过 1000ms 后 alpha 约为目标值的 50%
AND  经过 2000ms 后 alpha 达到目标值
AND  已存在的道路格 alpha 不受影响
```

```
WHEN 道路重算后某些旧道路格不再需要
THEN 这些格子立即移除（无淡出动画）
```

### C4: 角色 A* 寻路偏好道路

**描述**：角色漫步时使用 A* 寻路，道路格的移动代价低于普通地面，使角色倾向沿道路行走。角色仍可在非道路区域行走。

**寻路参数**：

| 格子类型 | 移动代价 |
|----------|----------|
| 道路格 | 1.0 |
| 非道路可通行格 | 3.0 |
| 建筑占据格 | 不可通行（∞） |

**A* 实现要求**：
- 网格搜索空间：40 × 40
- 启发函数：曼哈顿距离
- 邻居：上下左右 4 方向（不允许对角线移动）
- 最大搜索节点数：800（防止卡顿，超出则回退）
- 返回值：网格坐标的路径数组 `[{gx, gy}, ...]`

**行为规则**：
- 角色开始漫步时，调用 `_findPath(fromGX, fromGY, toGX, toGY)` 计算路径
- 若 A* 返回有效路径且长度 > 2，角色沿路径逐格移动
- 若 A* 失败（无路径或超出搜索节点上限）或路径长度 ≤ 2，回退到现有直线移动逻辑
- 角色沿路径移动时，每到达一个路径点就转向下一个路径点
**路径计算使用 `TownWorld._roadGrid`（道路代价网格，每次道路重算后从 `_state.roads` 同步构建，见 C1）和 `TownWorld._collisionGrid`（建筑碰撞网格）

**验收场景**：

```
WHEN 角色从道路旁的位置漫步到另一个道路旁的位置
AND  A* 寻路成功
THEN 角色沿道路行走到达目标
AND  路径中道路格占比高于随机直线路径
```

```
WHEN 角色的起点和终点相距 ≤ 2 格
THEN 使用直线移动（不调用 A*）
```

```
WHEN A* 搜索超过 800 个节点仍未找到路径
THEN 搜索终止
AND  角色回退到直线移动
AND  不产生帧率卡顿
```

```
WHEN 道路网络为空（无已建建筑或仅 1 个）
THEN 所有格子代价相同
AND  A* 退化为普通寻路
AND  角色仍可正常漫步
```

```
WHEN 角色正在沿 A* 路径移动
AND  道路网络因新建筑而重算
THEN 角色继续沿当前路径完成移动
AND  下次漫步时使用新的道路数据
```

### C5: 道路数据持久化

**描述**：道路数据作为 `TownManager._state.roads` 的一部分，通过 `getState()` 序列化，随存档保存和加载。

**序列化格式**：

```json
{
  "town": {
    "buildings": { ... },
    "placements": { ... },
    "roads": [
      { "gx": 5, "gy": 10, "usage": 2 },
      { "gx": 6, "gy": 10, "usage": 1 }
    ]
  }
}
```

**验收场景**：

```
WHEN 游戏调用 SaveManager.save()
THEN TownManager.getState() 包含 roads 数组
AND  每个元素包含 gx、gy、usage 三个数值字段
AND  不包含运行时字段（如 _fadeStart）
```

```
WHEN 游戏从存档加载
AND  存档中包含 roads 数据
THEN TownManager._state.roads 恢复为存档中的数组
AND  TownWorld._roadGrid 从该数据重建
```

```
WHEN 游戏从存档加载
AND  存档中不包含 roads 字段（旧存档）
THEN TownManager._state.roads 初始化为空数组 []
AND  系统立即执行一次道路重算
```

```
WHEN 存档中 roads 数组包含超出网格范围的坐标（gx ≥ 40 或 gy ≥ 40）
THEN 该条目被忽略（静默丢弃）
AND  其他合法条目正常加载
```

### C6: 装饰物道路回避

**描述**：装饰物（树、石头、灌木、花）不得出现在道路格上。道路重算后，已有装饰物若位于新道路格上，应被移除。

**验收场景**：

```
WHEN TownWorld 生成随机装饰物
AND  装饰物的 (gx, gy) 落在道路格上
THEN 该装饰物不被创建
```

```
WHEN 道路重算后，某个已存在装饰物的格子变为道路格
THEN 该装饰物从装饰列表中移除
AND  下一帧起不再渲染
```

```
WHEN 道路重算后，某个原道路格不再是道路格
THEN 该格子不自动生成新装饰物（保持为空地）
```

## 非功能需求

| 需求 | 目标值 | 度量方式 |
|------|--------|----------|
| MST 计算耗时 | < 5ms | 24 个建筑全部建造时的 MST + 路径铺设总耗时 |
| A* 单次寻路 | < 2ms | 40×40 网格中最长路径场景 |
| 渲染帧率 | ≥ 55fps | 开启道路渲染 + 20 个角色同时移动 |
| 存档体积增量 | < 5KB | 满建筑时 roads 数组 JSON 大小 |
| 动画流畅度 | 无可感知卡顿 | 道路淡入期间帧间隔 < 20ms |

## 依赖

| 依赖项 | 类型 | 契约 |
|--------|------|------|
| TownManager | 运行时 | [specs/system/core-contracts.md](../system/core-contracts.md) — 状态序列化、EventBus 通信 |
| TownWorld._collisionGrid | 运行时 | [specs/design-docs/town-character-collision.md](../design-docs/town-character-collision.md) — 建筑碰撞网格 |
| TownWorld.isWalkable() | 运行时 | [specs/design-docs/town-character-collision.md](../design-docs/town-character-collision.md) — 可通行性查询 |
| path_tile.svg | 资源 | `assets/img/terrain/path_tile.svg` — 道路贴图 |
| EventBus | 运行时 | `town:building_upgraded` 事件触发重算 |

## 事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `town:roads_updated` | `{ count: number }` | 道路网络重算完成，`count` 为道路格总数 |

## 已解决问题

- [x] **L 形路径拐弯方向**：动态选择复用率更高的方向。两种方案（先水平后垂直 / 先垂直后水平）均计算，选复用已有道路格更多的方案。24 建筑场景下两次 L-shape 比较的性能开销可忽略（< 0.1ms）。
- [x] **建筑拆除**：当前游戏不支持建筑拆除（建筑只升级不降级），无需处理 level 降为 0 的场景。若未来引入拆除功能，按"新建筑完成"相同的重算流程处理即可。
- [x] **连接点**：使用建筑底部中心外侧格（入口点）而非建筑几何中心。入口点 = `(gx + floor(w/2), gy + h)`，位于建筑占据区域外。建筑尺寸取自 `TownWorld._buildingSizes[id]`，放置位置取自 `TownManager._state.placements[id]`。
