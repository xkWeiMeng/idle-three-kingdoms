# 执行计划：AdventureManager 规范对齐与修复

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联规范** | [specs/services/adventure-manager.md](../services/adventure-manager.md) |
| **创建** | 2026-04-05 |

---

## 概览

AdventureManager 核心代码（`js/modules/adventure-manager.js`，约 350 行）已实现全部 11 个能力。本计划聚焦三件事：

1. **修复**规范审查中发现的 2 处小偏差（`init` 不变量防御、`startIdleSession` 重复调用防御）
2. **验证**其余全部 WHEN/THEN 场景与代码实现完全对齐，无隐性偏差
3. **不从头实现**——两处修复均为 ≤5 行的补丁

---

## 依赖关系图

```
TASK-1（init 不变量防御）
  │
  └──▶ TASK-3（漂移验证）← 与 TASK-2 完成后合并执行
         ▲
TASK-2（startIdleSession 重复调用防御）
  │
  └──▶ TASK-3
```

- **TASK-1** 与 **TASK-2** 无互相依赖，可并行执行
- **TASK-3** 等待 TASK-1、TASK-2 完成后执行（验证全量对齐）

---

## 阶段 1：修复已知偏差

> 目标：将两处已知规范偏差修复为正确实现，保持其余代码不变。

### TASK-1 — `init` 添加不变量防御

| 字段 | 值 |
|------|-----|
| **规范引用** | `specs/services/adventure-manager.md` — 能力 1「初始化」→ 行为规则「不变量防御」 |
| **输入** | `js/modules/adventure-manager.js`，`init` 函数（第 13–24 行） |
| **输出** | 修改后的 `init` 函数，在 `_checkUnlocks()` 调用后追加不变量检查 |
| **约束** | 仅在 `init` 函数内修改；不改变其余逻辑；不引入新的状态字段 |

**需要添加的逻辑**（紧接 `_checkUnlocks()` 之后）：

```js
// 不变量防御：mode=idle 但无会话（崩溃残留），重置为 push
if (this._state.adventureMode === 'idle' && this._state.idleSession === null) {
  this._state.adventureMode = 'push';
}
```

**验证**：

- `init({ adventure: { adventureMode: 'idle', idleSession: null } })` 调用后，`_state.adventureMode === 'push'`
- `init({ adventure: { adventureMode: 'idle', idleSession: { sessionId: 'x', ... } } })` 调用后，`_state.adventureMode` 仍为 `'idle'`（有会话时不重置）
- `init(null)` 调用后，`_state.adventureMode === 'push'`（默认值，不受影响）
- 覆盖规范场景：
  ```
  WHEN init({ adventure: { adventureMode: 'idle', idleSession: null } }) 被调用
  THEN _state.adventureMode === 'push'（崩溃残留被修正）
  ```

---

### TASK-2 — `startIdleSession` 添加重复调用防御

| 字段 | 值 |
|------|-----|
| **规范引用** | `specs/services/adventure-manager.md` — 能力 6「挂机会话管理」→ `startIdleSession()` 行为规则第 1 条 |
| **输入** | `js/modules/adventure-manager.js`，`startIdleSession` 函数（第 78–90 行） |
| **输出** | 修改后的 `startIdleSession`，在创建新会话前先归档已有会话 |
| **约束** | 仅在 `startIdleSession` 函数头部添加守卫；不修改 `endIdleSession` 本身；归档逻辑复用现有 `endIdleSession` |

**需要添加的逻辑**（在 `this._state.idleSession = { ... }` 赋值前）：

```js
// 若已有会话，先归档再创建（防止数据丢失）
if (this._state.idleSession) {
  this.endIdleSession();
}
```

**验证**：

- `startIdleSession()` 在 `idleSession` 为 `null` 时：正常创建会话，`sessionHistory` 不变
- `startIdleSession()` 在 `idleSession` 已存在（`sessionId = 'old-id'`）时：
  - `sessionHistory` 新增旧会话深拷贝（含 `endTime`，不含 `_tickAccum`）
  - 新会话 `sessionId !== 'old-id'`
  - 新会话 `battles === 0`，`wins === 0`，`losses === 0`
- 覆盖规范场景：
  ```
  WHEN startIdleSession() 被调用，idleSession 已存在（sessionId = 'old-id'）
  THEN sessionHistory 新增旧会话的深拷贝（含 endTime，不含 _tickAccum）
  AND  新 idleSession.sessionId !== 'old-id'
  AND  新 idleSession.region 绑定当前 currentRegion
  AND  新 idleSession.battles === 0
  ```

---

## 阶段 2：全量漂移验证

> 目标：确认修复后整体实现与规范 100% 对齐，无其他隐性偏差。

### TASK-3 — 逐能力 WHEN/THEN 场景漂移验证

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 1–11 全部 WHEN/THEN 场景 |
| **输入** | `js/modules/adventure-manager.js`（修复后）、`specs/services/adventure-manager.md` |
| **输出** | 对齐报告（逐场景 PASS/FAIL），不产出文件——在验证步骤内联呈现 |
| **约束** | 仅读取和对比，不修改代码；FAIL 场景须附代码行号和偏差说明 |

**验证检查点速查表**：

| 能力 | 关键验证点 |
|------|-----------|
| 1 初始化 | 默认值、浅拷贝隔离、`_checkUnlocks` 调用、**不变量防御**（TASK-1 修复后） |
| 2 Tick 驱动 | `push` 模式无副作用；`idle` 模式累积 dt；跨边界触发战斗；`_tickAccum` 剩余计算 |
| 3 选择区域 | 未解锁返回 `false`；已解锁更新并发事件；同区域重复调用仍发事件 |
| 4 查询区域 | `getUnlockedRegions` 返回浅拷贝；`getRegionData` 不存在返回 `null` |
| 5 模式切换 | `push→idle` 创建会话；`idle→push` 归档会话；**同模式不重建会话**（sessionId 不变）；非法值静默忽略；发送 `adventure:mode_changed` |
| 6 会话管理 | `startIdleSession` 初始化字段；**重复调用先归档**（TASK-2 修复后）；`endIdleSession` 含 endTime、无 `_tickAccum`；历史超 10 条 `shift()` |
| 7 战斗 Tick | 5 秒节拍（`while` 循环，非 `if`）；每 10 场发 `session_update`；粮草不足跳过不计 `battles`；胜率 95%；`wins++` 在 `win` 分支；`losses++` 在失败分支；exp 乘 `expBonus`，其余资源不乘；装备掉落公式 |
| 8 区域解锁 | `BattleManager` 不存在时提前返回；已解锁跳过；无条件或条件满足时 `push` |
| 9 推荐区域 | 单区域直接返回；多区域按 `needs × multipliers` 评分；`TownManager` 不存在用基础权重 |
| 10 离线结算 | 小于 60 秒返回 `null`；上限 86400 秒；不调用 `ResourceManager`；不应用 `expBonus` 和装备掉落；效率系数默认 0.50；区域不存在返回 `null` |
| 11 获取状态 | 深拷贝；`_tickAccum` 从快照中删除；原始 `_state` 不变 |

**额外检查——事件契约**：

- `adventure:region_changed` payload 含 `{ regionId: string }`
- `adventure:mode_changed` payload 含 `{ mode: 'push' | 'idle' }`
- `adventure:session_update` payload 含 `{ session: SessionSummary }`，其中 `drops` 为数字（件数），非数组

**验证通过标准**：

- 全部 WHEN/THEN 场景标注 PASS
- 无新发现 FAIL 场景（若有，须创建 TASK-4 跟踪）

---

## 最终验证清单

完成全部三个任务后，逐项确认：

| # | 检查项 | 对应任务 |
|---|--------|---------|
| ✅ | `init({ adventure: { adventureMode: 'idle', idleSession: null } })` → `adventureMode === 'push'` | TASK-1 |
| ✅ | `init` 有会话时不触发不变量重置（`idleSession` 非 null 时 `adventureMode` 保持 `'idle'`） | TASK-1 |
| ✅ | `startIdleSession()` 重复调用：旧会话进入 `sessionHistory`，新会话 `battles === 0` | TASK-2 |
| ✅ | `startIdleSession()` 在 `idleSession === null` 时不触发 `endIdleSession`（无副作用） | TASK-2 |
| ✅ | `setMode('idle' → 'idle')`：`sessionId` 不变，仍发 `adventure:mode_changed` | TASK-3 |
| ✅ | `_processIdleTick` 使用 `while` 而非 `if`（支持帧率抖动下的多战斗触发） | TASK-3 |
| ✅ | 战斗失败时 `losses++`，不执行 `ResourceManager.add`，不执行 `wins++` | TASK-3 |
| ✅ | `getState()` 返回深拷贝，`idleSession._tickAccum` 不出现在快照中 | TASK-3 |
| ✅ | `calculateOfflineRewards` 不调用 `ResourceManager.add/spend`（只读计算） | TASK-3 |
| ✅ | `endIdleSession()` 返回原始会话对象（非深拷贝），历史存入深拷贝 | TASK-3 |
