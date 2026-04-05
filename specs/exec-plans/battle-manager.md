# 执行计划：BattleManager 对齐与技术债务修复

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联规范** | [specs/services/battle-manager.md](../services/battle-manager.md) |
| **系统契约** | [specs/system/core-contracts.md](../system/core-contracts.md) |
| **创建** | 2026-04-05 |

---

## 概览

BattleManager 代码已实现全部 14 个能力。本计划聚焦三件事：
1. 逐能力验证代码与规范的 WHEN/THEN 场景是否完全对齐
2. 修复技术债务 S3（装备掉落违反服务边界）
3. 同步规范索引中的状态标记

---

## 依赖关系图

```
T1.1（代码-规范对齐审计）
  │
  ├──▶ T2.1（EquipmentManager 添加公共方法）
  │       │
  │       └──▶ T2.2（BattleManager 调用公共方法）
  │               │
  │               └──▶ T2.3（回归验证）
  │
  └──▶ T3.1（规范索引同步）── 可与 T2.x 并行
```

- **T1.1** 无前置依赖，立即可执行
- **T2.1 → T2.2 → T2.3** 严格顺序
- **T3.1** 与 T2.x 无依赖，可并行

---

## 阶段 1：代码-规范对齐审计

> 目标：确认现有代码覆盖规范全部 WHEN/THEN 场景，记录所有偏差。

### 任务 T1.1 — 逐能力 WHEN/THEN 场景对齐检查

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 1–14 全部 WHEN/THEN 场景 |
| **输入** | `js/modules/battle-manager.js`（~900 行）、`specs/services/battle-manager.md` |
| **输出** | 对齐报告（逐能力 PASS/FAIL + 偏差说明），保存到 `ai-docs/battle-manager-alignment.md` |
| **约束** | 仅审计，不修改代码；已知技术债务 S3 标记为"已知，T2 修复"而非 FAIL |

**验证**：

- 14 个能力全部被检查
- 每个 WHEN/THEN 场景有明确的 PASS 或 FAIL 标记
- 所有 FAIL 场景附带代码行号和偏差描述
- 技术债务 S3（能力 13 兜底装备掉落直写 `_inventory`）标记为"已知，T2.x 修复"

**检查要点速查表**：

| 能力 | 关键验证点 |
|------|-----------|
| 1 开始战斗 | 空队伍/无关卡/食物不足三个守卫条件；ATK/DEF/HP/SPD 公式；套装 CD 减少 |
| 2 回合执行 | 1s 节拍；补偿多回合；buff 递减先于行动；套装全队治疗 |
| 3 单位行动 | CD 判定阈值；无技能单位走普攻 |
| 4 普通攻击 | 双倍伤害仅普攻；死亡免疫仅普攻；目标全灭时跳过 |
| 5 技能系统 | 四种类型分发；`ally_lowest_hp` 选目标逻辑；未识别类型 fallback |
| 6 伤害计算 | 公式精确性；随机波动 [0.9,1.1)；暴击率 5%+套装；最小伤害 1 |
| 7 Buff/Debuff | 加法叠加；`_recalcStats` 从 base 出发；属性最低 1；`stat:'hp'` 无效果 |
| 8 胜负判定 | 双方存活检查逻辑 |
| 9 胜利结算 | EXP 加成公式；首通判定与奖励；装备掉落率计算；`battle:ended` 载荷字段 |
| 10 失败结算 | 不扣资源、不重置进度 |
| 11 自动推图 | 仅 victory 触发；1s 延迟；defeat 不触发；末关不操作 |
| 12 关卡导航 | `getCurrentStage` 返回对象；`_getNextStage` 末尾返回 null |
| 13 装备掉落 | 优先 `generateDrop`；兜底逻辑权重随机；无候选返回 null |
| 14 公共查询 | `getState()` battleState 始终 null；`clearedStages` 浅拷贝 |

---

## 阶段 2：技术债务修复（S3 — 服务边界违规）

> 目标：消除 BattleManager 直接写入 `EquipmentManager._inventory` 的边界违规。

### 任务 T2.1 — EquipmentManager 添加 `addToInventory(equip)` 公共方法

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 13（装备掉落）、core-contracts §服务边界 |
| **输入** | `js/modules/equipment-manager.js` — 现有 `generateDrop()` 中 inventory/overflow 处理逻辑（第 55-66 行） |
| **输出** | 新增 `addToInventory(equip)` 公共方法 |
| **约束** | 方法语义与现有 `generateDrop()` 内 inventory 写入逻辑一致：背包未满 → push；满 → overflow；overflow 满 → toast error 返回 false |

**实现要点**：

```javascript
// EquipmentManager 新增方法
addToInventory(equip) {
  if (this._inventory.length < this._maxSlots) {
    this._inventory.push(equip);
    return true;
  } else if (this._overflow.length < 10) {
    this._overflow.push(equip);
    EventBus.emit('toast:show', { type: 'warning', message: `背包已满！${equip.name}放入溢出栏` });
    return true;
  } else {
    EventBus.emit('toast:show', { type: 'error', message: `溢出栏已满！${equip.name}丢失了` });
    return false;
  }
}
```

**验证**：

```
WHEN 背包未满（inventory.length < maxSlots）
AND 调用 addToInventory(equip)
THEN equip 被添加到 _inventory 末尾
AND 返回 true

WHEN 背包已满，溢出栏未满（overflow.length < 10）
AND 调用 addToInventory(equip)
THEN equip 被添加到 _overflow 末尾
AND emit toast:show { type:'warning' }
AND 返回 true

WHEN 背包已满且溢出栏已满
AND 调用 addToInventory(equip)
THEN equip 不被添加
AND emit toast:show { type:'error' }
AND 返回 false
```

**修改文件**：
- `js/modules/equipment-manager.js` — 新增方法

---

### 任务 T2.2 — BattleManager 改用 `addToInventory` 调用

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 13（装备掉落）、core-contracts §服务边界 |
| **输入** | `js/modules/battle-manager.js` 第 761 行附近 `EquipmentManager._inventory.push(equip)` |
| **输出** | 替换为 `EquipmentManager.addToInventory(equip)` 调用 |
| **约束** | 保持兜底逻辑的 `typeof EquipmentManager` 防御性检查；改调公共方法而非私有属性 |

**变更内容**：

```diff
- if (typeof EquipmentManager !== 'undefined' && EquipmentManager._inventory) {
-   EquipmentManager._inventory.push(equip);
- }
+ if (typeof EquipmentManager !== 'undefined' && typeof EquipmentManager.addToInventory === 'function') {
+   EquipmentManager.addToInventory(equip);
+ }
```

**验证**：

```
WHEN BattleManager 兜底装备掉落生成装备
THEN 调用 EquipmentManager.addToInventory(equip) 而非直接写入 _inventory
AND 不再引用任何 EquipmentManager 私有属性（_inventory）

WHEN EquipmentManager 不存在或未定义 addToInventory
THEN 静默跳过，不报错（防御性检查）
```

**修改文件**：
- `js/modules/battle-manager.js` — `_generateEquipDrop` 方法内

---

### 任务 T2.3 — 回归验证

| 字段 | 值 |
|------|-----|
| **规范引用** | 能力 13 全部 WHEN/THEN 场景 |
| **输入** | T2.1 和 T2.2 的修改结果 |
| **输出** | 全部通过确认 |
| **约束** | 不引入新的技术债务 |

**验证**：

```
WHEN EquipmentManager.generateDrop 存在
THEN BattleManager 调用它（优先路径不变）

WHEN EquipmentManager.generateDrop 不存在，触发兜底逻辑
AND 背包未满
THEN 装备通过 addToInventory 正确加入 _inventory

WHEN 兜底逻辑生成装备，背包已满
THEN 装备进入 overflow 而非丢失（之前直接 push 无此检查，这是行为改进）

WHEN 战斗胜利且 equipDropRate 触发
THEN battle:ended 事件的 equipment 字段正确包含掉落装备对象

WHEN grep 搜索 battle-manager.js 中 "EquipmentManager._inventory"
THEN 零匹配（不再存在私有属性越界访问）
```

**检查项**：
- [ ] `index.html` 中 `equipment-manager.js` 在 `battle-manager.js` 之前加载（已有，仅确认）
- [ ] `main.js` 中 EquipmentManager 在 BattleManager 之前初始化（已有，仅确认）
- [ ] 浏览器控制台无报错
- [ ] 战斗胜利后装备正确掉落并出现在装备列表

---

## 阶段 3：规范索引同步

### 任务 T3.1 — 更新规范索引中的 BattleManager 状态

| 字段 | 值 |
|------|-----|
| **规范引用** | specs/README.md Active 规范索引 |
| **输入** | `specs/README.md`、`specs/system/core-contracts.md` |
| **输出** | 状态标记与实际一致 |
| **约束** | 仅更新标记，不修改规范内容 |

**变更清单**：

1. **`specs/README.md`** — 服务规范列表中 BattleManager 状态从 `Draft` 改为 `Active`
2. **`specs/system/core-contracts.md`** — 服务表中确认 BattleManager 链接指向 `../services/battle-manager.md`（已正确，仅确认）
3. **`specs/README.md`** — 执行计划索引新增本计划条目

**验证**：

```
WHEN 查看 specs/README.md 服务规范列表
THEN BattleManager 行显示 `Active`

WHEN 查看 specs/README.md 执行计划列表
THEN 包含 battle-manager.md 条目

WHEN 查看 core-contracts.md 服务表
THEN BattleManager 链接正确指向 specs/services/battle-manager.md
```

**修改文件**：
- `specs/README.md`

---

## 最终验证清单

| # | 验证项 | 对应任务 | 方法 |
|---|--------|----------|------|
| 1 | 14 个能力全部 WHEN/THEN 场景有对齐结论 | T1.1 | 检查 `ai-docs/battle-manager-alignment.md` |
| 2 | `EquipmentManager.addToInventory` 方法存在且功能正确 | T2.1 | 代码审查 |
| 3 | `battle-manager.js` 中不存在 `EquipmentManager._inventory` 引用 | T2.2 | `grep "EquipmentManager._inventory" js/modules/battle-manager.js` 返回空 |
| 4 | 兜底装备掉落调用 `addToInventory` | T2.2 | 代码审查 |
| 5 | 背包满时兜底掉落走 overflow 而非丢失 | T2.3 | 手动测试或代码审查 |
| 6 | `specs/README.md` BattleManager 标记为 `Active` | T3.1 | 文件检查 |
| 7 | `specs/README.md` 执行计划索引包含 `battle-manager.md` | T3.1 | 文件检查 |
| 8 | `core-contracts.md` BattleManager 链接正确 | T3.1 | 文件检查 |
| 9 | `index.html` script 加载顺序正确（equipment-manager 在 battle-manager 前） | T2.3 | 文件检查 |
| 10 | `main.js` 初始化顺序正确 | T2.3 | 文件检查 |
| 11 | 浏览器运行无控制台错误 | T2.3 | 浏览器测试 |

---

## 预期修改文件汇总

| 文件 | 任务 | 变更类型 |
|------|------|----------|
| `js/modules/equipment-manager.js` | T2.1 | 新增 `addToInventory(equip)` 方法 |
| `js/modules/battle-manager.js` | T2.2 | 修改 `_generateEquipDrop` 中的 inventory 写入方式 |
| `specs/README.md` | T3.1 | 更新 BattleManager 状态 + 新增执行计划索引条目 |
| `ai-docs/battle-manager-alignment.md` | T1.1 | 新建，对齐审计报告 |
