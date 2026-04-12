# 执行计划：ResourceManager

**规范引用**：specs/services/resource-manager.md (Active)
**创建日期**：2026-04-10

## 任务总览

| 任务 | 类型 | 描述 | 依赖 |
|------|------|------|------|
| T1 | 代码修复 | `setHighestStage()` 回退守卫 | — |
| T2 | 审计 | 逐场景比对规范与代码实现 | T1 |
| T3 | 测试 | 创建 `tests/resource-manager.test.html` | T2 |
| T4 | 验证 | 漂移检测 | T3 |

---

## T1：修复 setHighestStage() 回退守卫

**规范场景**：能力 6 — `setHighestStage('stage_1_3')` 当 current='stage_1_5' 时不应更新

**当前代码**（第 200 行）：
```js
setHighestStage(stageId) { this._stats.highestStage = stageId; }
```

**问题**：无条件赋值，违反规范"仅在更高时更新"

**修复方案**：
```js
setHighestStage(stageId) {
  if (!this._stats.highestStage || stageId > this._stats.highestStage) {
    this._stats.highestStage = stageId;
  }
}
```

**验证**：字符串比较 `'stage_2_8' > 'stage_1_5'` → true（字典序），`'stage_1_3' > 'stage_1_5'` → false ✓

---

## T2：规范-代码审计清单

逐能力逐场景审计，标记 PASS/FIX：

### 能力 1：查询资源
| 场景 | 预期 | 审计 |
|------|------|------|
| 无存档 init → get('gold')=500 | ✓ `_defaultResources.gold=500` | PASS |
| 无存档 init → get('food')=100 | ✓ `_defaultResources.food=100` | PASS |
| getAll() 返回快照 | ✓ 构造新对象 | PASS |
| getCap('jade')=Infinity | ✓ jade 不在 RESOURCE_BASE_CAP | PASS |
| getCap('gold') 查询 TownManager | ✓ 有 TownManager 检查 | PASS |
| get('invalidType')=0 | ✓ `this._state[type] || 0` | PASS |

### 能力 2：增加资源
| 场景 | 预期 | 审计 |
|------|------|------|
| add 截断到上限 | ✓ `Math.min(amount, cap-current)` | PASS |
| add jade 无上限 | ✓ `cap === Infinity` 跳过截断 | PASS |
| add 0 静默忽略 | ✓ `if (amount <= 0) return` | PASS |
| add -5 静默忽略 | ✓ 同上 | PASS |
| add + EconomyManager 记录 | ✓ 有 EconomyManager 检查 | PASS |
| add 已满不 emit | ✓ `if (amount <= 0) return` | PASS |
| addMultiple | ✓ 代码存在，遍历调用 add() | PASS |
| add gold 累加 totalGoldEarned | ✓ `if (type==='gold')` 分支 | PASS |

### 能力 3：消耗资源
| 场景 | 预期 | 审计 |
|------|------|------|
| spend 成功 | ✓ canAfford 检查 + 扣减 | PASS |
| spend 失败 | ✓ 返回 false | PASS |
| spendMultiple 全不扣 | ✓ 先 canAffordMultiple 检查 | PASS |
| spendMultiple 成功 | ✓ 逐项调 spend | PASS |
| spend + EconomyManager | ✓ 记录 -amount | PASS |
| canAfford 精确 | ✓ `>=` 比较 | PASS |
| canAffordMultiple 部分不足 | ✓ 逐项检查 | PASS |

### 能力 4：食物定时回复
| 场景 | 预期 | 审计 |
|------|------|------|
| 30s 回复 1 food | ✓ while 循环 + Math.min | PASS |
| 已满不回复 | ✓ `if (food < foodCap)` | PASS |
| 60s 回复 2 次但 cap 截断 | ✓ Math.min 截断 | PASS |
| onTick 累加 totalPlayTime | ✓ `_stats.totalPlayTime += dt` | PASS |

### 能力 5：每日登录
| 场景 | 预期 | 审计 |
|------|------|------|
| 首次登录 day=1 | ✓ loginDays++ | PASS |
| 领取奖励 | ✓ add() 调用 | PASS |
| 重复领取返回 null | ✓ dailyLoginClaimed 检查 | PASS |
| 第 7 天奖励 | ✓ idx=6 对应表 | PASS |
| 第 8 天循环 | ✓ (8-1)%7=0 | PASS |
| 同天重复调用 | ✓ lastLoginDate 判断 | PASS |

### 能力 6：统计追踪
| 场景 | 预期 | 审计 |
|------|------|------|
| setHighestStage 不回退 | ✗ 代码无守卫 | **FIX (T1)** |
| setHighestStage 更新 | 需要 T1 修复 | FIX (T1) |
| addBattleCount | ✓ `totalBattles++` | PASS |

### 存档兼容
| 场景 | 预期 | 审计 |
|------|------|------|
| init(undefined) 默认值 | ✓ deepClone(_defaultResources) | PASS |
| init 旧扁平结构 | ✓ `typeof saved.gold === 'number'` 分支 | PASS |
| init 嵌套结构 | ✓ `resSave.resources` 分支 | PASS |
| init 缺少 wood/stone/iron | ✓ 补丁代码 | PASS |
| getState 深拷贝 | ✓ Utils.deepClone | PASS |

**审计结论**：35 个场景中 33 个 PASS，2 个需 T1 修复。

---

## T3：创建测试文件

**文件**：`tests/resource-manager.test.html`
**覆盖**：全部 6 个能力 + 存档兼容 = 7 个测试组
**场景数**：35+ 测试用例

### 测试策略
- Mock `CONSTANTS.RESOURCE_BASE_CAP`、`TownManager`、`EconomyManager`、`EventBus`
- 加载真实 `Utils`（deepClone、uid）和 `EventBus`
- 拦截 `EventBus.emit` 记录事件
- 每个测试前 `resetRM()` 清空状态

---

## T4：漂移检测

修复 T1 后，逐场景验证代码与规范对齐，确认零漂移。
