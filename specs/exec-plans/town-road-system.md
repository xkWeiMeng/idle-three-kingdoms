# 执行计划：城镇道路系统（Town Road System）

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联规范** | [product-specs/town-road-system.md](../product-specs/town-road-system.md) |
| **创建** | 2026-04-06 |

---

## 目标

在城镇画布中实现建筑间自动道路网络：MST 道路生成、分级宽度渲染、淡入动画、A* 寻路偏好道路、道路持久化、装饰物道路回避。所有变更在现有文件中完成，不新增 JS 文件。

## 前置条件

- [x] 产品规范已审查并提升为 Active
- [x] `TownWorld._collisionGrid` 和 `isWalkable()` 已存在
- [x] `TownWorld._buildingSizes` 和 `_getPlacement()` 已存在
- [ ] `assets/img/terrain/path_tile.svg` 资源存在（若不存在需在阶段 2 前创建）

## 依赖关系图

```
阶段 1 (道路生成 + 持久化)
  │
  ├──→ 阶段 2 (道路渲染 + 装饰回避)
  │
  └──→ 阶段 3 (角色寻路)
```

阶段 2 和阶段 3 相互独立，可并行执行。两者都依赖阶段 1 完成。

---

## 阶段 1：道路生成核心 + 持久化（C1 + C5）

> 在 TownManager 中实现 MST 道路网络生成算法和状态持久化。完成后阶段 2、3 可并行。

### 任务 1.1 — 扩展 TownManager 状态结构

| 字段 | 值 |
|------|-----|
| **规范引用** | C1（数据结构）、C5（序列化格式） |
| **输入** | `js/modules/town-manager.js` — `_state`、`init()`、`getState()` |
| **输出** | `_state` 新增 `roads: []`；`init()` 从存档加载 roads 或初始化空数组；`getState()` 包含 roads |
| **约束** | 存档中 `roads` 不存在时初始化为 `[]`；加载后过滤无效条目（`gx ≥ 40` 或 `gy ≥ 40`） |
| **验证** | 1. `TownManager.getState().roads` 是数组 2. 旧存档加载后 `roads` 为 `[]` 3. 含越界条目的 roads 数据被静默丢弃 |

具体变更：
- `_state` 对象新增 `roads: []`
- `init()` 中加载 `data.roads`，过滤 `gx < 0 || gx >= 40 || gy < 0 || gy >= 40` 的条目
- `getState()` 已通过 `Utils.deepClone(this._state)` 自动包含 roads，无需额外修改

### 任务 1.2 — 实现入口点计算

| 字段 | 值 |
|------|-----|
| **规范引用** | C1（建筑入口点计算） |
| **输入** | `js/modules/town-manager.js`；`TownWorld._buildingSizes`、`TownManager._state.placements`、`TownWorld._defaultPositions` |
| **输出** | `TownManager._getEntrance(buildingId)` 方法，返回 `{gx, gy}` 或 `null` |
| **约束** | 入口优先级：底部中心 → 右侧中心 → 左侧中心 → 顶部中心；需检查越界和建筑占据 |
| **验证** | 1. town_hall (3×3 at 14,14) 入口为 `{gx:15, gy:17}` 2. 入口被占时回退到其他方向 3. 所有方向不可用时返回 `null` |

实现逻辑：
```
entranceGX = placement.gx + floor(size.w / 2)
entranceGY = placement.gy + size.h  // 底部外侧一格
```
依次检查 4 个方向，使用 `TownWorld._collisionGrid` 判断是否被建筑占据。

### 任务 1.3 — 实现 MST 算法 + L 形路径铺设

| 字段 | 值 |
|------|-----|
| **规范引用** | C1（算法步骤 1-6） |
| **输入** | 任务 1.2 的入口点方法；`TownWorld._collisionGrid` |
| **输出** | `TownManager.recalcRoads()` 方法，更新 `_state.roads` 数组 |
| **约束** | 入口点 < 2 时清空 roads；边权 = 曼哈顿距离；L 形选更优复用方案；每格记录 usage 计数 |
| **验证** | 1. 0-1 个建筑时 `_state.roads` 为 `[]` 2. 2 建筑时生成一条 L 形路径，每格 usage=1 3. 3 建筑时生成 MST（2 条边），公共格 usage=2 4. 道路不穿过建筑占据格 |

算法概要：
1. 收集所有 `level > 0` 建筑的入口点
2. 入口点 < 2 → 清空返回
3. 构建完全图（曼哈顿距离）
4. Prim 算法求 MST
5. 每条 MST 边：尝试 H-then-V 和 V-then-H 两种 L 形路径，选复用已有道路格更多的方案
6. 在 `usage` 计数器网格上累加

### 任务 1.4 — BFS 障碍绕行

| 字段 | 值 |
|------|-----|
| **规范引用** | C1（算法步骤 7）、C1 验收场景"MST 路径需要穿过建筑" |
| **输入** | 任务 1.3 的 L 形路径铺设逻辑；`TownWorld._collisionGrid` |
| **输出** | L 形路径碰到建筑占据格时，自动 BFS 寻找绕行路径 |
| **约束** | BFS 最大搜索深度 50 节点；仅搜索非建筑格；绕行路径格子同样计入 usage |
| **验证** | 1. L 形路径被建筑阻挡时不在建筑格上铺路 2. BFS 找到替代路径并正确连接 3. 50 节点内未找到路径时跳过该段 |

### 任务 1.5 — 挂接触发点 + 初始计算

| 字段 | 值 |
|------|-----|
| **规范引用** | C1 验收场景"新建筑建造完成"、"拖拽建筑"；C5 验收场景"旧存档" |
| **输入** | `js/modules/town-manager.js` — `init()`；`js/ui/town-world.js` — `_setPlacement()` |
| **输出** | 三个触发点调用 `recalcRoads()`：(1) init 末尾 (2) `town:building_upgraded` 事件 (3) `_setPlacement()` 完成后 |
| **约束** | `recalcRoads()` 执行后 emit `town:roads_updated` 事件；`_setPlacement` 中需先 `rebuildCollisionGrid()` 再 `recalcRoads()` |
| **验证** | 1. 游戏初始化后如有 ≥2 已建建筑则 roads 非空 2. 建筑升级完成（level 0→1）后道路重算 3. 拖拽建筑后道路立即更新 4. EventBus emit `town:roads_updated` 被触发 |

具体挂接点：
- `TownManager.init()` 末尾：若存档无 roads 或 roads 为空，调用 `this.recalcRoads()`
- `TownManager.onTick()` 中建筑完成后的 `town:building_upgraded` 事件已触发 → 在 TownManager 内监听此事件调用 `recalcRoads()`
- `TownWorld._setPlacement()` 末尾：调用 `TownManager.recalcRoads()`

---

## 阶段 2：道路渲染 + 装饰回避（C2 + C3 + C6）

> 在 TownWorld 中渲染道路层，实现淡入动画和装饰物过滤。依赖阶段 1 完成。

### 任务 2.1 — 构建 _roadGrid + 道路贴图加载

| 字段 | 值 |
|------|-----|
| **规范引用** | C1（运行时道路网格 _roadGrid）、C2（渲染方式） |
| **输入** | `js/ui/town-world.js` — `init()`、`_images` |
| **输出** | `TownWorld._roadGrid`（40×40 二维数组）；`_buildRoadGrid()` 方法；`path_tile` 图片加载 |
| **约束** | `_roadGrid[gy][gx]` = usage 值；初始化时从 `TownManager._state.roads` 构建；监听 `town:roads_updated` 重建 |
| **验证** | 1. `_roadGrid` 为 40×40 数组 2. roads 中的格子在 `_roadGrid` 中 usage > 0 3. 非道路格 usage = 0 4. `town:roads_updated` 事件后 grid 同步更新 |

实现：
```javascript
_buildRoadGrid: function () {
  // 清零 40×40
  // 遍历 TownManager._state.roads 填入 usage
}
```

### 任务 2.2 — 实现 _drawRoads(ctx) 分级渲染

| 字段 | 值 |
|------|-----|
| **规范引用** | C2（宽度等级表）、C2（渲染层级） |
| **输入** | `_roadGrid`、`path_tile.svg` 图片、CELL=48 |
| **输出** | `TownWorld._drawRoads(ctx)` 方法 |
| **约束** | usage 1-2 → 0.6×CELL, alpha 0.5；usage 3-4 → 0.8×CELL, alpha 0.7；usage 5+ → 1.0×CELL, alpha 0.9 |
| **验证** | 1. usage=1 的格渲染宽 28.8px，alpha=0.5 2. usage=5 的格渲染宽 48px，alpha=0.9 3. 只渲染视口内的道路格（性能优化） |

### 任务 2.3 — 插入渲染管线

| 字段 | 值 |
|------|-----|
| **规范引用** | C2（渲染层级：_drawGround 之后、_drawDecorations 之前） |
| **输入** | `js/ui/town-world.js` — `_render()` 方法 |
| **输出** | `_render()` 中在 `_drawGround(ctx)` 和 `_drawDecorations(ctx)` 之间插入 `_drawRoads(ctx)` 调用 |
| **约束** | 仅一行代码变更 |
| **验证** | 1. 渲染顺序：border → ground → roads → decorations → buildings → characters 2. 无视觉异常 |

变更位置（`_render()` 第 1048-1050 行）：
```javascript
this._drawGround(ctx);
this._drawRoads(ctx);        // ← 新增
this._drawDecorations(ctx);
```

### 任务 2.4 — 道路淡入动画

| 字段 | 值 |
|------|-----|
| **规范引用** | C3（动画参数：2000ms、线性、alpha 渐变） |
| **输入** | 任务 2.2 的 `_drawRoads(ctx)` |
| **输出** | 运行时 `_roadFadeStarts` 对象（key = "gx,gy", value = timestamp）；`_drawRoads` 中根据 fadeStart 计算实际 alpha |
| **约束** | `_roadFadeStarts` 不序列化；道路重算时，新增格记录 `Date.now()`，已存在格不更新；移除的格直接删除（无淡出） |
| **验证** | 1. 新道路格初始 alpha ≈ 0 2. 1000ms 后 alpha 约 50% 目标值 3. 2000ms 后 alpha = 目标值 4. 已有道路格 alpha 不受影响 5. 移除的格立即消失 |

### 任务 2.5 — 装饰物道路回避

| 字段 | 值 |
|------|-----|
| **规范引用** | C6（装饰物道路回避验收场景） |
| **输入** | `js/ui/town-world.js` — `_filterDecorations()`、`_generateDecorations()`、`_roadGrid` |
| **输出** | `_filterDecorations()` 额外过滤落在 `_roadGrid` 上的装饰物 |
| **约束** | 道路格上不生成装饰物；道路重算后移除道路上的旧装饰物；旧道路格消失时不自动新增装饰物 |
| **验证** | 1. `_roadGrid[gy][gx] > 0` 的位置无装饰物 2. 重算后原装饰物被删除 3. 旧道路消失后无新装饰物出现 |

变更位置：`_filterDecorations()` 中新增 `_roadGrid` 检查：
```javascript
if (self._roadGrid && self._roadGrid[d.gy] && self._roadGrid[d.gy][d.gx] > 0) {
  return false;
}
```

### 任务 2.6 — 确认 path_tile.svg 资源

| 字段 | 值 |
|------|-----|
| **规范引用** | C2（渲染方式）、依赖表 |
| **输入** | `assets/img/terrain/` 目录 |
| **输出** | 确认 `path_tile.svg` 存在；若不存在则创建简单的土路风格 SVG |
| **约束** | 48×48 大小，土路/砂石色调，与现有地面贴图风格一致 |
| **验证** | 1. 文件存在于 `assets/img/terrain/path_tile.svg` 2. 可被 `new Image()` 正常加载 |

---

## 阶段 3：角色 A* 寻路（C4）

> 在 TownCharacters 中实现 A* 寻路，角色优先沿道路行走。依赖阶段 1 完成。

### 任务 3.1 — 实现 A* 寻路算法

| 字段 | 值 |
|------|-----|
| **规范引用** | C4（A* 实现要求） |
| **输入** | `js/ui/town-characters.js`；`TownWorld._roadGrid`、`TownWorld._collisionGrid` |
| **输出** | `TownCharacters._findPath(fromGX, fromGY, toGX, toGY)` 方法，返回 `[{gx, gy}, ...]` 或 `null` |
| **约束** | 网格 40×40；4 方向（无对角线）；启发函数 = 曼哈顿距离；道路格代价 1.0、非道路可通行格代价 3.0、建筑格不可通行；最大搜索节点 800 |
| **验证** | 1. 返回从起点到终点的网格坐标数组 2. 路径不穿过建筑格 3. 路径中道路格占比高于随机直线 4. 超过 800 节点返回 null 5. 无路径时返回 null |

算法实现要点：
- 开放列表用简单数组（40×40 网格规模下足够）
- `gCost` 根据 `_roadGrid` 和 `_collisionGrid` 计算
- `hCost` = 曼哈顿距离 × 1.0（最小代价）
- 节点计数器，超 800 返回 null

### 任务 3.2 — 修改漫步逻辑使用 A* 路径

| 字段 | 值 |
|------|-----|
| **规范引用** | C4（行为规则）、C4 验收场景 |
| **输入** | `js/ui/town-characters.js` — `_startWandering()`、`_moveToward()` |
| **输出** | 角色开始漫步时调用 A* 计算路径；沿路径逐格移动 |
| **约束** | 路径长度 ≤ 2 或 A* 失败时回退直线移动；角色状态新增 `_path` 和 `_pathIndex`；路径移动中道路重算不中断当前路径 |
| **验证** | 1. 角色漫步时沿道路格行走 2. 距离 ≤2 格时直线移动 3. A* 失败时直线移动 4. 道路网络为空时正常漫步（全部格子代价相同退化为普通寻路） 5. 路径中道路重算不中断移动 |

具体变更：
- `_createChar()` 新增 `_path: null, _pathIndex: 0`
- `_startWandering(c)` 中：选定目标后，将像素坐标转为网格坐标，调用 `_findPath()`；若返回有效路径且长度 > 2，赋值 `c._path` 和 `c._pathIndex = 0`
- `_moveToward(c, dt)` 中：若 `c._path` 存在，移向 `c._path[c._pathIndex]` 的像素中心；到达后 `_pathIndex++`；到末尾后清空 `_path` 并 `_goIdle()`

---

## 最终验证清单

完成所有阶段后，执行以下验证：

### 功能验证

| # | 验证项 | 对应规范场景 | 通过标准 |
|---|--------|-------------|---------|
| 1 | 0-1 建筑时无道路 | C1 场景 1 | `_state.roads` 为 `[]` |
| 2 | 2 建筑生成 L 形路径 | C1 场景 2 | 路径格 usage=1，不穿建筑 |
| 3 | 3 建筑生成 MST | C1 场景 3 | 公共格 usage=2，格数合理 |
| 4 | 新建筑触发重算 | C1 场景 4 | 道路更新，旧格移除 |
| 5 | 路径绕行建筑 | C1 场景 5 | BFS 绕路，不踩建筑 |
| 6 | 拖拽建筑重算 | C1 场景 6 | 道路立即更新 |
| 7 | 入口点回退 | C1 场景 7 | 依次尝试 4 个方向 |
| 8 | usage=1 渲染 | C2 场景 1 | 宽 28.8px，alpha=0.5 |
| 9 | usage=5 渲染 | C2 场景 2 | 宽 48px，alpha=0.9 |
| 10 | 相邻不同 usage | C2 场景 3 | 各自独立渲染 |
| 11 | 新道路淡入 | C3 场景 1 | 2s 内从 0 到目标 alpha |
| 12 | 旧道路立即移除 | C3 场景 2 | 无淡出，直接消失 |
| 13 | 角色沿道路行走 | C4 场景 1 | 路径中道路格占比高 |
| 14 | 短距离直线移动 | C4 场景 2 | ≤2 格不调 A* |
| 15 | A* 超限回退 | C4 场景 3 | 回退直线，无卡顿 |
| 16 | 无道路时正常漫步 | C4 场景 4 | A* 退化为普通寻路 |
| 17 | 路径中重算不中断 | C4 场景 5 | 当前路径完成后用新数据 |
| 18 | 存档包含 roads | C5 场景 1 | getState() 有 roads 数组 |
| 19 | 存档加载恢复 | C5 场景 2 | roadGrid 从存档重建 |
| 20 | 旧存档兼容 | C5 场景 3 | roads 初始化为 []，立即重算 |
| 21 | 越界数据丢弃 | C5 场景 4 | 合法条目正常，越界忽略 |
| 22 | 装饰物不在道路上 | C6 场景 1 | 道路格无装饰生成 |
| 23 | 重算后移除装饰 | C6 场景 2 | 新道路格上装饰被删 |
| 24 | 旧道路不补装饰 | C6 场景 3 | 消失道路格保持空地 |

### 非功能验证

| # | 验证项 | 目标值 | 验证方法 |
|---|--------|--------|---------|
| 25 | MST 计算耗时 | < 5ms | `console.time()` 包裹 `recalcRoads()`，24 建筑场景 |
| 26 | A* 单次寻路 | < 2ms | `console.time()` 包裹 `_findPath()`，最长路径 |
| 27 | 渲染帧率 | ≥ 55fps | 开启道路 + 20 角色，DevTools Performance 面板 |
| 28 | 存档增量 | < 5KB | `JSON.stringify(roads).length` 满建筑时 |
| 29 | 动画流畅 | 帧间隔 < 20ms | 淡入期间 Performance 面板无长帧 |

### 集成验证

| # | 验证项 | 通过标准 |
|---|--------|---------|
| 30 | 页面无报错 | 浏览器控制台无错误 |
| 31 | 存档兼容 | 清除 localStorage 后重新开始正常；保留旧存档加载正常 |
| 32 | 渲染层级正确 | 道路在地面上方、装饰下方、建筑下方 |
| 33 | 事件流完整 | `town:roads_updated` 在 building_upgraded 和 setPlacement 后触发 |
