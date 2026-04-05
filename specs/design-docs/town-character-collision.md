---
status: Active
created: 2026-04-05
updated: 2026-04-05
author: spec-architect
product-spec: N/A (bugfix)
---

# 设计文档：城镇角色碰撞检测

## 背景

当前 `TownCharacters` 系统中，NPC 市民与武将随机漫步时完全忽略建筑物的碰撞体积，角色会直接穿透建筑物行走。角色之间也没有碰撞检测，可以相互重叠。

### 根因分析

- `_startWandering()` 在 `homeX/homeY` 周围随机选取目标点，未检查目标点是否被建筑占据
- `_moveToward()` 沿直线移动，路径上遇到建筑不会绕行或停止
- 不存在碰撞网格或占用图，无数据结构支撑碰撞查询

### 涉及文件

| 文件 | 职责 |
|------|------|
| `js/ui/town-characters.js` | 角色 AI 状态机、移动逻辑 |
| `js/ui/town-world.js` | 地图网格、建筑尺寸/位置、渲染循环 |

## 目标

1. 角色不得进入建筑物占据的网格区域
2. 角色之间不得重叠（保持最小间距）
3. 性能无明显退化（24×24 网格，≤20 个角色，60fps）

## 非目标

- 不实现 A* 等复杂寻路算法（角色只是漫步，方向受限即可）
- 不改变角色行走速度或漫步范围
- 不改变建筑放置逻辑

## 架构

### 碰撞网格（Occupancy Grid）

在 `TownWorld` 上维护一个 `MAP_W × MAP_H` 的布尔二维数组 `_collisionGrid`，标记每个格子是否被建筑占据。

```
_collisionGrid[gy][gx] = true   // 该格被建筑占据，不可通行
_collisionGrid[gy][gx] = false  // 该格可通行
```

#### 构建时机

| 触发事件 | 操作 |
|----------|------|
| `TownWorld.init()` | 初始构建 |
| `TownWorld._setPlacement()` 被调用后 | 重建 |
| `town:building_upgraded` 事件 | 重建 |

#### 构建逻辑

遍历所有建筑 ID，获取其 `placement(gx, gy)` 和 `size(w, h)`，将 `[gy..gy+h-1][gx..gx+w-1]` 范围内的格子标记为 `true`。

### API 设计

#### `TownWorld.isWalkable(gx, gy)`

- **输入**：网格坐标 `gx: int`, `gy: int`
- **输出**：`boolean` — 该格可通行返回 `true`
- **逻辑**：
  1. 越界 → `false`
  2. `_collisionGrid[gy][gx] === true` → `false`
  3. 否则 → `true`

#### `TownWorld.isPixelWalkable(px, py)`

- **输入**：像素坐标 `px: number`, `py: number`
- **输出**：`boolean`
- **逻辑**：将像素坐标转换为网格坐标，调用 `isWalkable()`

#### `TownWorld.rebuildCollisionGrid()`

- **输入**：无
- **输出**：无（更新 `_collisionGrid`）
- **副作用**：清空后重新遍历所有建筑填充

### 角色移动修改

#### `_startWandering(c)` 修改

选取目标点后，检查目标点所在网格是否可通行：

1. 计算随机目标 `(targetX, targetY)`
2. 转换为网格坐标 `(tgx, tgy)`
3. 若 `TownWorld.isWalkable(tgx, tgy)` 为 `false`，重新随机（最多重试 8 次）
4. 若 8 次全部不可通行，放弃漫步，回到 `idle` 状态

#### `_moveToward(c, dt)` 修改

每步移动后检查角色新位置是否可通行：

1. 计算新位置 `(newX, newY)`
2. 转换为网格坐标
3. 若不可通行，停止移动，回到 `idle` 状态（不实际更新 `c.x / c.y`）

### 角色间碰撞

角色之间不使用网格碰撞，而是使用简单的距离检测：

#### 最小间距常量

```javascript
CHAR_MIN_DIST: 20  // 像素，角色中心点最小距离
```

#### `_startWandering(c)` 附加检查

目标点通过建筑碰撞检查后，额外检查目标点附近是否有其他角色（idle 状态的角色）。若与任一角色距离 < `CHAR_MIN_DIST`，重新随机。

#### `_moveToward(c, dt)` 附加检查

每步移动后检查与其他**非行走中**角色的距离。若移动后会与某角色重叠（距离 < `CHAR_MIN_DIST`），该帧不移动，回到 `idle` 状态。

> **不检查两个同时行走的角色之间的碰撞**，避免复杂的双向碰撞解算和死锁。

## 考虑过的替代方案

### 方案 A：A* 寻路

- **优点**：角色可绕行建筑，路径自然
- **缺点**：实现复杂度高；角色仅是漫步装饰，不需要精确路径；性能开销大
- **放弃原因**：过度工程化，角色漫步场景不需要完整寻路

### 方案 B：碰撞网格 + 目标点验证 + 移动中检测（已选择）

- **优点**：实现简单；碰撞网格复用建筑数据；目标点重试保证大多数时候有效
- **缺点**：角色不会绕行，只会停下或重选目标
- **选择原因**：贴合漫步场景需求，复杂度低，性能友好

### 方案 C：角色使用简单推力分离

- **优点**：角色重叠后会自动分离，视觉自然
- **缺点**：可能导致角色被推入建筑
- **放弃原因**：与建筑碰撞矛盾，需要额外处理

## WHEN/THEN 验收场景

### 建筑碰撞

#### 场景 1：目标点在建筑内

```
WHEN 角色选取了一个落在已建造建筑占据网格内的漫步目标点
THEN 该目标点被拒绝
AND  系统重新随机选取目标点（最多重试 8 次）
```

#### 场景 2：重试全部失败

```
WHEN 角色连续 8 次随机目标点都落在不可通行区域
THEN 角色放弃漫步，进入 idle 状态
AND  不产生任何移动
```

#### 场景 3：行走路径穿过建筑

```
WHEN 角色正在向目标点移动
AND  下一步的像素位置对应的网格被建筑占据
THEN 角色停止移动
AND  角色进入 idle 状态
AND  角色位置保持在移动前的合法坐标
```

#### 场景 4：建筑被移动后碰撞网格更新

```
WHEN 玩家在编辑模式拖拽建筑到新位置
THEN 碰撞网格立即重建
AND  后续角色漫步使用新的碰撞数据
```

#### 场景 5：未建造建筑不产生碰撞

```
WHEN 建筑等级为 0（未建造）
THEN 该建筑的网格区域不被标记为不可通行
AND  角色可自由通过该区域
```

### 角色间碰撞

#### 场景 6：目标点与静止角色重叠

```
WHEN 角色选取的漫步目标点距离某个 idle 状态角色的中心 < 20 像素
THEN 该目标点被拒绝
AND  系统重新随机选取目标点
```

#### 场景 7：行走中接近静止角色

```
WHEN 角色正在行走
AND  下一步移动后与某个非行走中角色的中心距离 < 20 像素
THEN 角色停止移动
AND  角色进入 idle 状态
```

#### 场景 8：两个行走中的角色相遇

```
WHEN 两个角色同时处于 walking 状态
AND  它们的路径交叉
THEN 不做碰撞检测（允许短暂重叠）
AND  两者各自继续向目标移动
```

### 边界情况

#### 场景 9：角色 home 位置在建筑内

```
WHEN 建筑被玩家移动到角色 homeX/homeY 所在位置
THEN 角色在下次漫步时，目标点随机在 wander radius 内的可通行区域
AND  若所有区域不可通行，角色保持 idle
```

#### 场景 10：地图边缘碰撞兼容

```
WHEN 角色在地图边缘（第 0 行/列或最后一行/列）
THEN isWalkable 对越界坐标返回 false
AND  角色不会移动到地图外
```

## 性能约束

| 指标 | 要求 |
|------|------|
| 碰撞网格大小 | 24 × 24 = 576 格，内存可忽略 |
| 网格重建频率 | 仅建筑变动时，非每帧 |
| 每帧碰撞检查 | ≤ 20 个角色 × 1 次网格查询 + ≤ 20 次距离比较 = ≤ 420 次操作 |
| 帧率影响 | 不可测量 |

## 实现检查清单

1. `TownWorld` 新增 `_collisionGrid` 二维数组和 `rebuildCollisionGrid()` 方法
2. `TownWorld` 新增 `isWalkable(gx, gy)` 和 `isPixelWalkable(px, py)`
3. `TownWorld.init()` 中调用 `rebuildCollisionGrid()`
4. `TownWorld._setPlacement()` 末尾调用 `rebuildCollisionGrid()`
5. `TownWorld._onBuildingChanged()` 中调用 `rebuildCollisionGrid()`
6. `TownCharacters` 新增 `CHAR_MIN_DIST` 常量
7. `TownCharacters._startWandering()` 增加目标点可通行检查 + 角色距离检查 + 重试逻辑
8. `TownCharacters._moveToward()` 增加移动后位置可通行检查 + 角色距离检查

## 风险

| 风险 | 可能性 | 影响 | 缓解策略 |
|------|--------|------|----------|
| 角色被围堵在建筑群中无法移动 | 低 | 低（仅保持 idle） | wander radius 足够大，建筑密度有限 |
| 碰撞网格与建筑实际渲染位置不一致 | 低 | 中 | 网格使用同一数据源 `_getPlacement` + `_buildingSizes` |
| 建筑移动后角色卡在建筑内 | 中 | 低 | 移动中检测会让角色下一帧停下，不会持续卡住 |
