# 执行计划：深渊战利品爆落与连续刷本（Abyss Loot Explosion）

| 字段 | 值 |
|------|-----|
| **状态** | `Active` |
| **关联产品规范** | [specs/product-specs/abyss-loot-explosion.md](../product-specs/abyss-loot-explosion.md) |
| **关联服务规范** | AbyssManager（现有）、EquipmentManager |
| **系统契约** | [specs/system/core-contracts.md](../system/core-contracts.md) |
| **创建** | 2026-04-06 |

---

## 概览

将产品规范的 4 个能力（CAP-LOOT-01 ~ 04）拆解为 4 个阶段、11 个任务。

- **Phase 1**：数据层 + Manager 层（移除冷却、连续刷本逻辑）— 最简单，先做
- **Phase 2**：CSS 动画基础设施（所有 @keyframes + 装备卡片样式）— CSS 先于 JS
- **Phase 3**：UI 核心系统（粒子引擎、结算状态机、装备揭示动画）— 核心复杂度
- **Phase 4**：集成、连续挑战 UI、最终验证

---

## 依赖关系图

```
T1.1（AbyssData 移除冷却）
  │
  └──▶ T1.2（AbyssManager 冷却方法始终返回 false/0）
          │
          └──▶ T4.2（再次挑战 UI + 连续刷本流程）

T2.1（CSS @keyframes + 装备卡片样式）── 无前置依赖，可与 Phase 1 并行
  │
  ├──▶ T3.1（粒子系统 _LootParticles）
  │       │
  │       └──▶ T3.3（结算状态机 + 阶段编排）── 依赖 T3.1, T3.2
  │               │
  │               └──▶ T3.4（跳过机制）── 依赖 T3.3
  │                       │
  │                       └──▶ T4.1（overlay:closed 清理 + 重入处理）── 依赖 T3.4
  │                               │
  │                               └──▶ T4.2（再次挑战 UI）── 依赖 T1.2, T4.1
  │                                       │
  │                                       └──▶ T4.3（最终验证清单）── 依赖全部
  │
  └──▶ T3.2（装备揭示动画 — 翻牌 + 品质光效）── 依赖 T2.1
```

- **T1.1 / T2.1** 无前置依赖，可并行执行
- **T1.2** 依赖 T1.1
- **T3.1 / T3.2** 互不依赖，可并行执行（均依赖 T2.1）
- **T3.3** 依赖 T3.1 + T3.2（编排两者）
- **T3.4** 依赖 T3.3
- **T4.1** 依赖 T3.4
- **T4.2** 依赖 T1.2 + T4.1
- **T4.3** 最终门禁，依赖全部

---

## Phase 1：数据层 + Manager 层（CAP-LOOT-03）

### 任务 T1.1 — AbyssData 移除冷却字段

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-LOOT-03 §数据变更 |
| **输入** | `js/data/abyss.js` |
| **输出** | 同文件修改 |
| **约束** | 保留 `ticketCost` 不变；`cooldown` 设为 `0` 或删除均可（选择设为 `0` 以保持字段存在，避免旧代码引用报错） |

**具体改动**：

将所有 3 个深渊的 `cooldown: 86400` 改为 `cooldown: 0`：
- `abyss_hulao.cooldown: 86400 → 0`
- `abyss_chibi.cooldown: 86400 → 0`
- `abyss_guandu.cooldown: 86400 → 0`

**验证**：
- `AbyssData.abyss_hulao.cooldown === 0`
- `AbyssData.abyss_chibi.cooldown === 0`
- `AbyssData.abyss_guandu.cooldown === 0`
- `ticketCost` 字段值不变

---

### 任务 T1.2 — AbyssManager 冷却方法短路

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-LOOT-03 全部 WHEN/THEN 场景 |
| **依赖** | T1.1 |
| **输入** | `js/modules/abyss-manager.js` |
| **输出** | 同文件修改 |
| **约束** | `lastAttempt` 字段保留用于统计；旧存档兼容 |

**具体改动**：

1. **`isOnCooldown(abyssId)`**：函数体改为 `return false;`
2. **`getCooldownRemaining(abyssId)`**：函数体改为 `return 0;`
3. **`enterAbyss(abyssId)`**：移除（或注释掉）冷却检查分支（如果有 `if (this.isOnCooldown(abyssId))` 的判断）

**验证**：
- `AbyssManager.isOnCooldown('abyss_hulao') === false`（任何时间点）
- `AbyssManager.getCooldownRemaining('abyss_hulao') === 0`（任何时间点）
- 连续调用 `enterAbyss` 5 次（有足够资源时），每次都成功进入
- 旧存档（包含 `lastAttempt > 0`）加载后不报错

---

## Phase 2：CSS 动画基础设施

### 任务 T2.1 — 新增 @keyframes + 装备卡片 + 粒子容器样式

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-LOOT-01 §渲染方式 + §性能约束、CAP-LOOT-02 §品质动态光效、CAP-LOOT-04 §资源 countUp、规范 §5 新增 CSS 动画 |
| **输入** | `css/main.css` |
| **输出** | 同文件末尾新增样式块 |
| **约束** | 使用已有 CSS 变量；`prefers-reduced-motion` 适配；不修改现有样式 |

**具体改动**：

1. **新增 @keyframes**（规范 §5 定义）：
   ```css
   @keyframes shake { ... }          /* 神话装备画面震动 */
   @keyframes lightPillar { ... }    /* 传说装备光柱 */
   @keyframes mythicFlash { ... }    /* 神话装备全屏闪烁 */
   @keyframes countUpGlow { ... }    /* 数字滚动闪光 */
   @keyframes slideUp { ... }        /* 标题入场 */
   ```

2. **粒子容器样式**：
   ```css
   .loot-particle-container {
     position: absolute; top: 0; left: 0; width: 100%; height: 100%;
     pointer-events: none; overflow: hidden; z-index: 10;
   }
   .loot-particle {
     position: absolute; will-change: transform, opacity;
     pointer-events: none; user-select: none;
   }
   ```

3. **装备卡片样式**：
   ```css
   .equip-reveal-card { ... }        /* 卡片基础：宽度 calc((100% - 16px) / 3)，间距 8px */
   .equip-reveal-card--back { ... }  /* 背面 */
   .equip-reveal-card--front { ... } /* 正面 */
   .equip-reveal-card--epic { ... }  /* 品质4紫色光晕 */
   .equip-reveal-card--legendary { ... } /* 品质5金色光晕 */
   .equip-reveal-card--mythic { ... }    /* 品质6红色高强度发光 */
   ```

4. **结算界面布局样式**：
   ```css
   .abyss-settlement { ... }         /* 结算容器 */
   .abyss-settlement__title { ... }  /* 阶段1标题 */
   .abyss-settlement__resources { ... } /* 阶段3资源统计 */
   .abyss-settlement__equips { ... }    /* 阶段4装备区 */
   .abyss-settlement__summary { ... }   /* 阶段5总结 */
   .abyss-settlement__skip { ... }      /* 跳过按钮 */
   ```

5. **光柱 + 全屏闪烁叠层样式**：
   ```css
   .equip-light-pillar { ... }       /* 传说光柱 div */
   .equip-mythic-flash { ... }       /* 神话全屏闪烁叠层 */
   ```

6. **prefers-reduced-motion 适配**：
   ```css
   @media (prefers-reduced-motion: reduce) {
     .loot-particle, .equip-reveal-card, .equip-light-pillar,
     .equip-mythic-flash, .abyss-settlement__title {
       animation: none !important;
       transition: none !important;
     }
   }
   ```

**验证**：
- 浏览器 DevTools 中可查看所有新增 @keyframes
- 添加 `.equip-reveal-card` 测试元素，确认宽度和布局正确
- 开启 `prefers-reduced-motion: reduce` 后所有动画被禁用
- 现有页面样式无回归

---

## Phase 3：UI 核心系统（粒子引擎 + 装备揭示 + 结算状态机）

### 任务 T3.1 — 粒子系统 _LootParticles（CAP-LOOT-01）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-LOOT-01 全部 WHEN/THEN 场景 |
| **依赖** | T2.1（粒子 CSS 类） |
| **输入** | `js/ui/abyss-panel.js` |
| **输出** | 同文件内新增 `AbyssPanel._LootParticles` 辅助对象 |
| **约束** | 不新增 JS 文件；粒子系统内嵌在 AbyssPanel 中；rAF 驱动；总数上限 60 |

**具体改动**：

在 `AbyssPanel` 对象内新增 `_LootParticles` 属性：

```javascript
_LootParticles: {
  _container: null,
  _particles: [],
  _rafId: null,
  _startTime: 0,
  _onComplete: null,

  /**
   * @param {Object} rewards - { gold, exp, iron, jade }
   * @param {HTMLElement} containerEl - 粒子容器的父元素
   * @param {Function} onComplete - 2000ms 动画结束回调
   */
  start: function (rewards, containerEl, onComplete) { ... },

  /** 计算各类型粒子数量，总数上限 60 */
  _calcParticleCounts: function (rewards) { ... },

  /** rAF 回调 — 每帧更新所有粒子位置 + opacity */
  _tick: function (timestamp) { ... },

  /** 立即停止：cancelAnimationFrame + 移除容器 + 置空引用 */
  stop: function () { ... }
}
```

**粒子数量计算规则**（严格按规范）：

| 粒子 | 最少 | 公式 | 上限 |
|------|------|------|------|
| 💰 | 3 | `min(30, floor(gold/500))` | 30 |
| 📖 | 2 | `min(15, floor(exp/500))` | 15 |
| ⛏️ | 1 | `min(10, floor(iron/50))` | 10 |
| 💎 | 1 | `min(8, floor(jade/5))` | 8 |

总数上限 60，超出时按比例缩减。

**粒子行为**（总时长 2000ms）：
- 爆发阶段（0–300ms）：初速 200–400px/s，角度 0–360°
- 飘落阶段（300–1400ms）：重力 300px/s²，水平摆动 ±10px，周期 0.5s
- 淡出阶段（1400–2000ms）：opacity 1→0

**rAF 安全检查**：
- 回调起始处检查容器是否仍在 DOM 中（`containerEl.parentNode`），否则终止
- `stop()` 调用 `cancelAnimationFrame` + 移除容器 DOM + 清空 `_particles` 数组

**验证**：

| 场景 | 预期 |
|------|------|
| `rewards = { gold: 5000, exp: 2500, iron: 150, jade: 10 }` | 💰×10, 📖×5, ⛏️×3, 💎×2 = 20 个粒子 |
| `rewards = { gold: 50000, exp: 10000, iron: 500, jade: 50 }` | 总数 = min(60, 30+15+10+8) = 60 |
| `rewards = { gold: 200 }` | 仅 💰×3（最少 3 个），无其他类型 |
| 动画播放中调用 `stop()` | rAF 取消，容器 DOM 移除，`_particles = []` |
| 2000ms 后 | `onComplete` 回调触发，粒子 DOM 全部移除 |

---

### 任务 T3.2 — 装备揭示动画（CAP-LOOT-02）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-LOOT-02 全部 WHEN/THEN 场景 |
| **依赖** | T2.1（卡片样式 + @keyframes） |
| **输入** | `js/ui/abyss-panel.js` |
| **输出** | 同文件内新增 `AbyssPanel._EquipReveal` 辅助对象 |
| **约束** | 不新增 JS 文件；品质 ≤3 不参与翻牌，在阶段 5 文字展示 |

**具体改动**：

在 `AbyssPanel` 对象内新增 `_EquipReveal` 属性：

```javascript
_EquipReveal: {
  _container: null,
  _cards: [],
  _timers: [],
  _onComplete: null,

  /**
   * @param {Array} equipments - 品质 ≥4 的装备数组（已按品质升序排列）
   * @param {HTMLElement} containerEl - 卡片容器
   * @param {Function} onComplete - 所有卡片翻转完毕回调
   */
  start: function (equipments, containerEl, onComplete) { ... },

  /** 创建单张卡片 DOM（背面 + 正面） */
  _createCard: function (equip, index) { ... },

  /** 翻转指定卡片 + 触发品质光效 */
  _revealCard: function (card, equip) { ... },

  /** 品质4：紫色脉冲光晕 */
  _effectEpic: function (cardEl) { ... },

  /** 品质5：金色光柱 + 金色光晕 */
  _effectLegendary: function (cardEl) { ... },

  /** 品质6：全屏闪烁 + 震动 + 延迟翻牌 */
  _effectMythic: function (cardEl, containerEl) { ... },

  /** 跳过：所有未翻转卡片立即显示正面，清除所有 timer */
  skip: function () { ... },

  /** 清理所有 timer 和 DOM */
  stop: function () { ... }
}
```

**翻转调度规则**：

1. 按品质升序排列（最低先翻、最高最后翻）
2. 每张卡片翻转间隔 400ms
3. 品质特效偏移叠加在卡片翻转时间之上：
   - 品质 4：+0ms（立即开始）
   - 品质 5：+300ms（金色光柱先起，再翻牌）
   - 品质 6：+1000ms（闪烁 800ms + 震动 400ms 后翻牌）

**多卡片排列**：
- 横向排列，最多一行 3 个，超出换行
- 卡片宽度 `calc((100% - 16px) / 3)`，间距 8px

**验证**：

| 场景 | 预期 |
|------|------|
| 1 件品质 4 装备 | 1 张紫色边框卡片，cardFlip 翻转，外轮廓紫色脉冲 |
| 1 件品质 5 + 1 件品质 4 | 品质 4 先翻（+0ms），品质 5 后翻（+400ms 间隔 + 300ms 偏移 = +700ms），翻转前有金色光柱 |
| 1 件品质 6 | 1000ms 延迟 → 全屏红金闪烁 800ms → 震动 400ms → 翻牌 |
| 仅品质 ≤3 装备 | 跳过装备揭示阶段（`equipments` 为空数组） |
| 无装备掉落 | 跳过装备揭示阶段 |
| 4 件品质 ≥4 装备 | 前 3 件排第一行，第 4 件第二行居中 |
| 点击「跳过」 | 所有未翻转卡片立即正面，光效消失 |

---

### 任务 T3.3 — 结算状态机 + 阶段编排（CAP-LOOT-04）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-LOOT-04 全部 WHEN/THEN 场景 |
| **依赖** | T3.1（粒子系统）、T3.2（装备揭示） |
| **输入** | `js/ui/abyss-panel.js` — 现有 `_renderRewards()` 方法 |
| **输出** | 重写 `_renderRewards()` + 新增结算状态机逻辑 |
| **约束** | 保留 run 对象结构不变；不新增 JS 文件 |

**具体改动**：

1. **新增 `_settlement` 状态对象**：
   ```javascript
   _settlement: {
     phase: null,       // 'title' | 'particles' | 'countup' | 'equip_reveal' | 'summary'
     startTime: 0,
     skipped: false,
     run: null,         // 当前结算的 run 引用
     rafId: null,       // countUp 的 rAF id
     abyssId: null      // 用于再次挑战
   }
   ```

2. **重写结算渲染入口**：替换现有 `phase === 'complete'` / `phase === 'defeat'` 分支中的内联 HTML，改为调用 `_startSettlement(run)` 方法：
   - 生成结算容器 HTML 骨架（标题区、粒子区、资源区、装备区、总结区、跳过按钮）
   - 判断 run.phase 为 complete/defeat 且面板未关闭过 → 启动阶段 1
   - 判断 run.phase 为 complete/defeat 且面板曾关闭过（重入）→ 直接跳到阶段 5

3. **阶段推进逻辑**：
   - **阶段 1**（0–500ms）：显示标题（🏆/💀），`slideUp` 入场动画，500ms 后 → 阶段 2
   - **阶段 2**（500–2500ms）：调用 `_LootParticles.start(rewards, container, onComplete)`，2000ms 后 → 阶段 3
   - **阶段 3**（2500–3500ms）：countUp 动画（金币→经验→铁矿→玉璧，错开 200ms，每个 600ms），最后一个完成 → 阶段 4
   - **阶段 4**（3500ms+）：筛选品质 ≥4 装备，有则调用 `_EquipReveal.start()`；无则跳过 → 阶段 5
   - **阶段 5**：显示完整奖励总结 + 品质 ≤3 装备文字列表 + 「再次挑战」/「离开」按钮

4. **countUp 实现**：
   - 单个资源：`rAF` 驱动，600ms 内从 0 递增至目标值
   - 多个资源间错开 200ms 开始
   - 数字到达最终值时播放 `countUpGlow` 动画

5. **事件发射**（规范 §4）：
   - 阶段 2 开始 → `abyss:loot_explosion_start`
   - 阶段 2 结束 → `abyss:loot_explosion_end`
   - 阶段 4 每张卡片翻转 → `abyss:equip_reveal`

**验证**：

| 场景 | 预期 |
|------|------|
| 通关 `rewards = { gold: 8000, exp: 5000, iron: 300, jade: 10 }`，2 件品质 4+5 装备 | 完整 5 阶段播放，时间区间与规范一致 |
| 失败于第 2 层 `rewards = { gold: 2000, exp: 1000 }`，无装备 | 阶段 1 显示 💀，阶段 2 仅金币+经验粒子，阶段 4 跳过 |
| `rewards` 全部为 0 | 阶段 2 无粒子，阶段 3 无资源行，直接阶段 5 |
| 重新打开已结算的面板 | 直接阶段 5（跳过动画） |

---

### 任务 T3.4 — 跳过机制

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-LOOT-04 §跳过机制、CAP-LOOT-02 跳过场景 |
| **依赖** | T3.3（结算状态机） |
| **输入** | `js/ui/abyss-panel.js` |
| **输出** | 同文件修改 |
| **约束** | 跳过后数据不遗漏 |

**具体改动**：

1. 结算容器右上角渲染「跳过 ⏩」按钮（`.abyss-settlement__skip`）
2. 绑定 click 事件，调用 `_skipSettlement()` 方法：
   - 设置 `_settlement.skipped = true`
   - 调用 `_LootParticles.stop()` — 停止粒子 + 移除 DOM
   - 取消 countUp 的 rAF（`cancelAnimationFrame(_settlement.rafId)`）
   - 所有资源数字立即设为最终值
   - 调用 `_EquipReveal.skip()` — 所有未翻转卡片立即正面
   - 直接渲染阶段 5 总结面板
3. 发射 `abyss:settlement_skip` 事件

**验证**：

| 场景 | 预期 |
|------|------|
| 阶段 2 点击跳过 | 粒子停止，资源数字显示最终值，装备卡片正面显示，总结面板出现 |
| 阶段 4 点击跳过 | 未翻转卡片立即翻转，直接进入总结 |
| 跳过后所有数据 | 资源数字正确（不为 0），装备列表完整 |

---

## Phase 4：集成与最终验证

### 任务 T4.1 — overlay:closed 清理 + 重入处理

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-LOOT-01 §性能约束（overlay:closed 清理）、CAP-LOOT-04 最后一个 WHEN/THEN 场景（重入跳过动画） |
| **依赖** | T3.4 |
| **输入** | `js/ui/abyss-panel.js` |
| **输出** | 同文件修改 |
| **约束** | 零内存泄漏；rAF 无残留 |

**具体改动**：

1. 在 `AbyssPanel.init()` 中监听 `overlay:closed` 事件：
   - 调用 `_LootParticles.stop()`
   - 调用 `_EquipReveal.stop()`
   - 取消 countUp rAF
   - 清空 `_settlement` 状态
2. 重入逻辑：当 `run.phase` 为 `complete`/`defeat` 且 `_settlement.phase === null`（即面板曾关闭过再打开）→ 直接渲染阶段 5 总结面板，不播放动画

**验证**：

| 场景 | 预期 |
|------|------|
| 粒子动画中关闭 OverlayPanel | `cancelAnimationFrame` 被调用，粒子容器 DOM 已移除 |
| 关闭后重新打开深渊面板 | 直接显示阶段 5 总结，不重播动画 |
| 通过底部导航切走再切回 | 同上 |
| DevTools 检查 DOM | 无残留 `.loot-particle-container` 节点 |

---

### 任务 T4.2 — 再次挑战 UI + 连续刷本流程（CAP-LOOT-03 UI 部分）

| 字段 | 值 |
|------|-----|
| **规范引用** | CAP-LOOT-03 §连续挑战流程 全部 WHEN/THEN 场景 |
| **依赖** | T1.2（冷却已移除）、T4.1（结算面板已就绪） |
| **输入** | `js/ui/abyss-panel.js` |
| **输出** | 同文件修改 |
| **约束** | clearRun → enterAbyss 顺序；资源不足时按钮灰显 |

**具体改动**：

1. **阶段 5 总结面板底部**：替换现有「确认」按钮为两个按钮：
   - **「再次挑战」**（`.abyss-retry`）：显示入场费用文字（如 `💎30 💰5000 ⛏️200`）
   - **「离开」**（`.abyss-leave`）
2. **「再次挑战」按钮状态**：
   - 检查 `ResourceManager.canAfford()` → 资源充足高亮、不足灰显
   - 不足时 `title` 属性显示缺少的资源类型
3. **「再次挑战」click 行为**：
   - 调用 `AbyssManager.clearRun()`
   - 调用 `AbyssManager.enterAbyss(abyssId)`
   - 成功 → `AbyssPanel.show()` 刷新为战斗界面
   - 失败（资源不足）→ toast 提示
   - 发射 `abyss:retry` 事件
4. **「离开」click 行为**：
   - 调用 `AbyssManager.clearRun()`
   - `AbyssPanel.show()` 回到深渊列表
5. **深渊列表界面**：移除冷却倒计时的 UI 分支，已有冷却的位置直接显示「进入」按钮

**验证**：

| 场景 | 预期 |
|------|------|
| 通关后结算界面 | 底部显示「再次挑战」（含费用）和「离开」 |
| 资源充足点击「再次挑战」 | 扣资源 → 新一轮从第 1 层开始 |
| 资源不足点击「再次挑战」 | toast 警告，不开始 |
| 失败后结算界面 | 同样显示两个按钮 |
| 连续通关 5 次 | 每次都能再次挑战，无冷却 |
| 深渊列表 | 不显示冷却倒计时 |

---

### 任务 T4.3 — 最终验证清单

| 字段 | 值 |
|------|-----|
| **规范引用** | 全部 4 个 CAP 的全部 WHEN/THEN 场景 |
| **依赖** | 全部任务（T1.1 ~ T4.2） |
| **输入** | 全部变更文件 |
| **输出** | 验证报告（可在终端 / 浏览器控制台执行） |

**验证清单**：

#### CAP-LOOT-01 粒子动画
- [ ] 通关后粒子从中央爆散，类型和数量与 rewards 匹配
- [ ] 大额 rewards 粒子总数不超过 60
- [ ] rewards 仅有 gold 时只有 💰 粒子
- [ ] 2000ms 后粒子 DOM 全部移除
- [ ] 关闭面板后粒子立即停止，无内存泄漏

#### CAP-LOOT-02 装备特效
- [ ] 品质 4 装备：紫色脉冲光晕卡片
- [ ] 品质 5 装备：金色光柱 + 金色光晕
- [ ] 品质 6 装备：全屏闪烁 + 震动 + 延迟翻牌
- [ ] 仅品质 ≤3 装备时跳过翻牌阶段
- [ ] 多装备按品质升序翻转，间隔 400ms
- [ ] 4 件装备：3+1 排列
- [ ] 跳过时未翻转卡片立即正面

#### CAP-LOOT-03 连续刷本
- [ ] `AbyssManager.isOnCooldown()` 始终返回 `false`
- [ ] `AbyssManager.getCooldownRemaining()` 始终返回 `0`
- [ ] 通关后可立即再次挑战
- [ ] 失败后可立即再次挑战
- [ ] 资源不足时「再次挑战」灰显 + toast
- [ ] 连续 5 次通关无异常
- [ ] 深渊列表不显示冷却
- [ ] 旧存档兼容

#### CAP-LOOT-04 结算界面
- [ ] 5 阶段按序播放（标题→粒子→countUp→翻牌→总结）
- [ ] 失败时阶段 1 显示 💀 + 止步层数
- [ ] rewards 全 0 时阶段 2/3 正确处理
- [ ] 跳过按钮在任意阶段有效
- [ ] 跳过后数据完整（资源数字 + 装备列表）
- [ ] 关闭面板再打开 → 直接阶段 5
- [ ] `prefers-reduced-motion: reduce` → 跳过所有动画

#### 非功能
- [ ] 60 粒子时单帧 ≤ 2ms
- [ ] 动画结束后零残留 DOM
- [ ] 无 rAF 泄漏（DevTools Performance 确认）
- [ ] 480px 宽度下布局正常

---

## 任务摘要

| 任务 | 能力 | 文件 | 复杂度 |
|------|------|------|--------|
| T1.1 | CAP-LOOT-03 | `js/data/abyss.js` | 🟢 低 |
| T1.2 | CAP-LOOT-03 | `js/modules/abyss-manager.js` | 🟢 低 |
| T2.1 | CAP-LOOT-01/02/04 | `css/main.css` | 🟡 中 |
| T3.1 | CAP-LOOT-01 | `js/ui/abyss-panel.js` | 🔴 高 |
| T3.2 | CAP-LOOT-02 | `js/ui/abyss-panel.js` | 🔴 高 |
| T3.3 | CAP-LOOT-04 | `js/ui/abyss-panel.js` | 🔴 高 |
| T3.4 | CAP-LOOT-04 | `js/ui/abyss-panel.js` | 🟡 中 |
| T4.1 | CAP-LOOT-01/04 | `js/ui/abyss-panel.js` | 🟡 中 |
| T4.2 | CAP-LOOT-03 | `js/ui/abyss-panel.js` | 🟡 中 |
| T4.3 | 全部 | 全部 | 🟡 中 |

**推荐执行顺序**：T1.1 → T1.2 → T2.1 → T3.1 ∥ T3.2 → T3.3 → T3.4 → T4.1 → T4.2 → T4.3
