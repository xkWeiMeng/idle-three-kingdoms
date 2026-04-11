# 产品规范：深渊战利品爆落与连续刷本（Abyss Loot Explosion）

| 属性 | 值 |
|------|-----|
| **状态** | Active |
| **作者** | spec-architect |
| **创建日期** | 2026-04-06 |
| **关联服务规范** | AbyssManager（待创建）、EquipmentManager |
| **关联系统规范** | [核心契约](../system/core-contracts.md) — 品质等级、事件协议 |
| **前置更新** | core-contracts.md 需补充品质 6（神话）定义 + AbyssManager 跨模块权限 |
| **父级代码** | [abyss-manager.js](../../js/modules/abyss-manager.js)、[abyss-panel.js](../../js/ui/abyss-panel.js)、[abyss.js](../../js/data/abyss.js) |

---

## 1. 概述

深渊模式的核心体验升级，聚焦于「刷装备的爽快感」。包含 4 项改进：

1. **战利品爆落粒子动画** — 击败 Boss 后满屏粒子散射（金币、材料、经验），给予视觉冲击
2. **高品质装备掉落特效** — 史诗/传说/神话装备有专属光效和翻牌揭示动画
3. **连续刷本** — 移除 24 小时冷却，改为纯资源消耗制，支持通关/失败后一键再次挑战
4. **奖励结算界面重制** — 分阶段展示奖励，制造期待感和满足感

**设计目标**：让玩家在深渊 Boss 被击败的瞬间获得「满屏爆金」的多巴胺冲击，并通过连续刷本机制维持心流状态。

---

## 2. 品质等级色彩参考

品质颜色以代码 `AbyssPanel._qualityColors` 为准（与 core-contracts.md 存在已知漂移，计划在未来统一修复）：

| 品质 | 等级 | 颜色 | CSS 变量建议 |
|------|------|------|-------------|
| 普通 | 1 | `#b0a898` | — |
| 优秀 | 2 | `#5d8a48` | — |
| 稀有 | 3 | `#4a7fb5` | — |
| 史诗 | 4 | `#8b5ea8` | `--color-epic` |
| 传说 | 5 | `#d4a849` | `--color-legendary` |
| 神话 | 6 | `#ff2222` | `--color-mythic` |

> **注意**：品质 6（神话）在代码中已存在（`abyss-manager.js` 创建 `quality:6` 装备，`abyss-panel.js._qualityColors` 有 `6:'#ff2222'`），但 core-contracts.md 尚未定义。本规范实现前需先更新 core-contracts.md。

---

## 3. 能力

### CAP-LOOT-01：战利品爆落粒子动画

**描述**：每层 Boss 被击败后，在奖励结算界面播放粒子爆落动画。粒子从画面中央爆散，模拟战利品四散飞溅效果。

**粒子类型**：

| 粒子 | 图标 | 触发条件 | 数量计算 |
|------|------|---------|---------|
| 金币 | 💰 | `rewards.gold > 0` | `min(30, floor(gold / 500))` 个，最少 3 个 |
| 经验 | 📖 | `rewards.exp > 0` | `min(15, floor(exp / 500))` 个，最少 2 个 |
| 铁矿 | ⛏️ | `rewards.iron > 0` | `min(10, floor(iron / 50))` 个，最少 1 个 |
| 玉璧 | 💎 | `rewards.jade > 0` | `min(8, floor(jade / 5))` 个，最少 1 个 |

**粒子行为**（总时长 2000ms）：

1. **爆发阶段**（0–300ms）：粒子从中心点以随机方向散射出去，初始速度 200–400px/s，角度 0–360°均匀分布。
2. **飘落阶段**（300–1400ms）：施加重力加速度（`gravity = 300px/s²`），粒子做抛物线运动。粒子同时有轻微水平摆动（正弦，幅度 ±10px，周期 0.5s）。
3. **淡出阶段**（1400–2000ms）：所有存活粒子同时淡出（opacity 1→0 over 600ms）。

**渲染方式**：纯 CSS + DOM 元素。每个粒子是一个 `<span>`，使用 emoji 字符，字号 16–24px 随机。通过 CSS `transform: translate()` + `opacity` 驱动动画。使用 `requestAnimationFrame` 控制帧更新。

**性能约束**：
- 粒子总数上限：**60 个**（所有类型合计）
- 粒子容器使用 `will-change: transform`
- 动画总时长 **2000ms**
- 动画结束后立即移除所有粒子 DOM 节点
- 监听 `overlay:closed` 事件：`cancelAnimationFrame(rafId)` + 移除容器 + 置空引用
- rAF 回调起始处检查容器是否仍在 DOM 中，若不在则终止

**验收场景**：

```
WHEN Boss 被击败
AND 当前层 rewards = { gold: 5000, exp: 2500, iron: 150, jade: 10 }
THEN 生成粒子: 💰×10, 📖×5, ⛏️×3, 💎×2 = 20 个
AND 粒子从画面中央爆散
AND 粒子做抛物线下落
AND 2000ms 后所有粒子 DOM 节点已移除

WHEN Boss 被击败
AND 当前层 rewards = { gold: 50000, exp: 10000, iron: 500, jade: 50 }
THEN 粒子总数 = min(60, 30+15+10+8) = 60
AND 不超过 60 个粒子同时渲染

WHEN Boss 被击败
AND 当前层 rewards = { gold: 200 }
THEN 仅生成 💰×3（最少 3 个）
AND 无 📖/⛏️/💎 粒子

WHEN 粒子动画播放中
AND 玩家关闭 OverlayPanel
THEN 粒子动画立即停止
AND 所有粒子 DOM 节点被移除
AND 不产生内存泄漏

WHEN 粒子动画播放中
AND requestAnimationFrame 回调执行
THEN 单帧计算耗时 ≤ 2ms（60 个粒子时）
```

---

### CAP-LOOT-02：高品质装备掉落特效

**描述**：当深渊掉落装备时，在粒子动画结束后播放装备揭示动画。装备以卡片形式翻转展示，品质越高特效越华丽。

**特效分级**：

延迟值均为「阶段 4 装备揭示开始」的相对偏移（基准 = 0ms）。

| 品质 | 特效 | 相对偏移（ms） | 说明 |
|------|------|---------------|------|
| ≤3 | 无翻牌动画，直接在奖励总结列表中以文字展示 | N/A | 不参与装备揭示阶段 |
| 史诗(4) | 紫色脉冲光晕，卡片边框发光 | +0（立即开始） | — |
| 传说(5) | 金色光柱从卡片位置升起 + 金色闪光粒子 | +300（停顿制造悬念） | — |
| 神话(6) | 全屏红金闪烁叠层 + 画面震动 + 延迟揭牌 | +1000（制造强烈期待感） | — |

**装备卡片翻转动画**：

1. 卡片初始显示背面（纯色 + 品质边框颜色）
2. 延迟后执行 CSS `cardFlip` 动画（已有 `@keyframes cardFlip`），翻转展示正面
3. 正面显示：装备 emoji + 名称 + 品质文字 + 核心属性

**品质动态光效细节**：

- **史诗(4)**：卡片外轮廓使用 `box-shadow: 0 0 15px #8b5ea8`，配合 `pulse-glow-purple` 动画（已存在）
- **传说(5)**：卡片上方生成一个高度 200px、宽度 40px 的光柱 `<div>`，背景 `linear-gradient(to top, #d4a849, transparent)`，`opacity` 从 0 到 1 过 300ms，保持 800ms 后淡出。卡片使用 `box-shadow: 0 0 20px #d4a849` + `pulse-glow-orange` 动画
- **神话(6)**：
  - **全屏闪烁**：在 OverlayPanel 内铺满一个 `<div>`，`background: radial-gradient(circle, rgba(255,34,34,0.4), rgba(245,197,24,0.2))`，`opacity` 0→0.8→0 闪烁两次（每次 200ms），总时长 800ms
  - **画面震动**：OverlayPanel 内容容器添加 CSS `animation: shake 0.1s ease 4`（左右 ±3px 位移 4 次 = 400ms），使用 `@keyframes shake`（新增）
  - **延迟翻牌**：闪烁和震动完成后（800ms + 400ms = 1200ms 入场），才开始卡片翻转

**品质 ≤3 装备处理**：
- 品质 ≤3 的装备不参与翻牌动画阶段
- 直接在阶段 5 奖励总结的装备列表中以文字形式展示（颜色按品质着色）

**多装备排列**（仅品质 ≥4）：
- 装备卡片横向排列，最多一行 3 个，超出换行
- 每张卡片间距 8px，宽度 calc((100% - 16px) / 3)
- 多张装备按品质升序翻转（最低先翻、最高最后翻），每张卡片翻转之间间隔 400ms

**验收场景**：

```
WHEN 深渊通关
AND droppedEquipment 包含 1 件品质 4 装备
THEN countUp 结束后进入装备揭示阶段
AND 出现 1 张卡片，背面显示紫色边框
AND 卡片执行 cardFlip 动画翻转到正面
AND 正面显示装备信息，外轮廓紫色脉冲光晕

WHEN 深渊通关
AND droppedEquipment 包含 1 件品质 5 + 1 件品质 4
THEN 品质 4 的卡片先翻转（阶段4 +0ms）
AND 品质 5 的卡片后翻转（阶段4 +400ms + 300ms 悬念偏移 = +700ms）
AND 品质 5 卡片翻转前出现金色光柱
AND 金色光柱持续 800ms 后淡出

WHEN 深渊通关
AND droppedEquipment 包含 1 件品质 6 神话装备
THEN countUp 结束后，额外等待 1000ms
AND 全屏红金闪烁叠层播放（800ms）
AND 画面震动（400ms）
AND 闪烁 + 震动结束后卡片翻转
AND 卡片外轮廓红色高强度发光

WHEN 深渊通关
AND droppedEquipment 仅包含品质 ≤3 的装备
THEN 跳过装备揭示阶段（无翻牌动画）
AND 品质 ≤3 装备在阶段 5 奖励总结中以文字列表展示

WHEN 深渊通关
AND droppedEquipment = []（无装备掉落）
THEN 跳过装备揭示阶段
AND 直接进入奖励总结阶段

WHEN 装备揭示动画播放中
AND 玩家点击「跳过」按钮
THEN 所有未翻转的卡片立即翻转到正面
AND 所有光效立即消失
AND 直接进入奖励总结阶段

WHEN 深渊通关
AND droppedEquipment 包含 4 件装备
THEN 前 3 件排在第一行，第 4 件排在第二行居中
AND 卡片按品质升序翻转（最低先翻、最高最后翻）
AND 每张卡片翻转间隔 400ms
```

---

### CAP-LOOT-03：连续刷本（移除冷却）

**描述**：移除深渊 24 小时冷却机制，改为纯资源消耗制。只要玩家有足够入场资源即可立即再次挑战。

**数据变更**：

- `AbyssData` 中每个深渊的 `cooldown: 86400` 字段 → 删除或设为 `0`
- `AbyssManager.isOnCooldown()` → 始终返回 `false`
- `AbyssManager.getCooldownRemaining()` → 始终返回 `0`
- `AbyssManager._state.instances[aid].lastAttempt` → 保留但仅用于统计，不用于限流

**连续挑战流程**：

1. 通关/失败后，结算界面底部增加两个按钮：
   - **「再次挑战」**：消耗入场资源，直接开始新一轮
   - **「离开」**：关闭结算界面，返回深渊列表
2. 「再次挑战」按钮状态逻辑：
   - 显示入场费用文字（如 `💎30 💰5000 ⛏️200`）
   - 资源不足时按钮灰显，tooltip 提示不足的资源类型
   - 资源充足时按钮高亮，使用深渊主题色

**行为规则**：

1. 点击「再次挑战」→ 先调用 `AbyssManager.clearRun()` 清除当前 run → 再调用 `AbyssManager.enterAbyss(abyssId)`
2. 入场成功 → AbyssPanel 刷新为战斗界面
3. 入场失败（资源不足）→ 显示 toast 提示，但 `currentRun` 已被清除
4. 点击「离开」→ 调用 `AbyssManager.clearRun()` → 返回深渊列表

**验收场景**：

```
WHEN 玩家通关深渊 abyss_hulao
AND 查看奖励结算界面
THEN 底部显示「再次挑战」和「离开」按钮
AND 「再次挑战」按钮旁显示入场费 💎30 💰5000 ⛏️200

WHEN 玩家点击「再次挑战」
AND jade >= 30, gold >= 5000, iron >= 200
THEN 扣除入场资源
AND 立即开始新一轮深渊 abyss_hulao（从第 1 层开始）
AND 面板刷新为战斗界面

WHEN 玩家点击「再次挑战」
AND jade < 30
THEN 显示 toast:warning '玉璧不足！需要💎×30'
AND 不开始新一轮
AND 按钮保持可交互（玩家可能在其他界面获取资源后返回）

WHEN 玩家挑战深渊失败（全军覆没于第 3 层）
AND 查看失败结算界面
THEN 底部同样显示「再次挑战」和「离开」按钮
AND 「再次挑战」功能与通关后一致

WHEN 玩家连续通关同一深渊 5 次
THEN 每次通关后都能立即再次挑战
AND 不存在任何冷却限制
AND 每次都正确扣除入场资源

WHEN 深渊列表界面显示 abyss_hulao
AND 该深渊之前有通关记录
THEN 不显示冷却倒计时
AND 直接显示「进入」按钮（只要资源足够）

WHEN AbyssManager.isOnCooldown('abyss_hulao') 被调用
THEN 始终返回 false

WHEN AbyssManager.getCooldownRemaining('abyss_hulao') 被调用
THEN 始终返回 0
```

**向后兼容**：
- 旧存档中 `lastAttempt` 字段保留，不影响加载
- `cooldown` 字段在 `AbyssData` 中保留为 `0` 或删除均可

---

### CAP-LOOT-04：奖励结算界面重制

**描述**：将战斗结束后的静态文字奖励列表改为分阶段动态展示界面，制造「开箱」般的仪式感。

**结算阶段流程**：

| 阶段 | 时间区间 | 内容 | 交互 |
|------|---------|------|------|
| 1. 胜利/失败标题 | 0–500ms | 显示 🏆通关成功 / 💀挑战失败，使用 `slideUp` 入场 | — |
| 2. 粒子爆落 | 500–2500ms | CAP-LOOT-01 粒子动画播放（2000ms） | — |
| 3. 资源统计 | 2500–3500ms | 金币/经验/材料数字从 0 滚动至实际值（countUp 动画） | — |
| 4. 装备揭示 | 3500ms+ | CAP-LOOT-02 品质 ≥4 装备卡片翻转展示（品质 ≤3 跳过此阶段） | 可「跳过」 |
| 5. 奖励总结 | 装备揭示结束后 | 完整奖励总结（含品质 ≤3 装备文字列表）+ 操作按钮 | 「再次挑战」/「离开」 |

**资源数字 countUp 动画**：
- 每种资源的数字从 0 开始，在 600ms 内递增至实际值
- 使用 `requestAnimationFrame` 驱动，每帧更新 `textContent`
- 各资源间错开 200ms 开始（金币 → 经验 → 铁矿 → 玉璧）

**跳过机制**：
- 整个结算界面右上角常驻一个「跳过 ⏩」按钮
- 点击后：立即终止所有进行中的动画（粒子、countUp、翻牌），直接跳到阶段 5 奖励总结
- 所有奖励数据正常显示，不遗漏

**奖励总结面板内容**：

```
═══ 战利品总结 ═══
💰 金币     8,000
📖 经验     5,000
⛏️ 铁矿     300
💎 玉璧      10

── 装备 ──
[紫色] 🗡️ xxx剑
[金色] 🛡️ xxx盾
[红色] ⚔️ xxx戟（神话）

[再次挑战 💎30 💰5000 ⛏️200]  [离开]
```

**验收场景**：

```
WHEN 深渊通关
AND rewards = { gold: 8000, exp: 5000, iron: 300, jade: 10 }
AND droppedEquipment 包含 2 件装备（品质 4 和品质 5）
THEN 阶段 1: 显示 🏆通关成功（0–500ms）
AND 阶段 2: 粒子爆落动画（500–2500ms）
AND 阶段 3: 金币 0→8000（2500–3100ms）→ 经验 0→5000（2700–3300ms）→ 铁矿 0→300（2900–3500ms）→ 玉璧 0→10（3100–3700ms）
AND 阶段 4: 品质 4 卡片翻转（阶段4起始+0ms）→ 品质 5 卡片翻转（阶段4起始+700ms）
AND 阶段 5: 完整奖励总结 + 「再次挑战」「离开」按钮

WHEN 深渊失败于第 2 层
AND rewards = { gold: 2000, exp: 1000 }
AND droppedEquipment = []
THEN 阶段 1: 显示 💀挑战失败 + 止步于第 2 层
AND 阶段 2: 粒子爆落动画（仅金币和经验粒子）
AND 阶段 3: 仅金币和经验 countUp
AND 阶段 4: 跳过（无装备）
AND 阶段 5: 奖励总结 + 「再次挑战」「离开」按钮

WHEN 结算动画播放中（阶段 2）
AND 玩家点击「跳过 ⏩」
THEN 粒子动画立即终止，粒子 DOM 移除
AND 资源数字立即显示最终值
AND 装备卡片立即显示正面（无翻转动画）
AND 直接显示奖励总结 + 操作按钮

WHEN 深渊通关
AND rewards 全部为 0（理论边界情况）
THEN 阶段 2: 不生成任何粒子
AND 阶段 3: 不显示任何资源行
AND 直接进入阶段 4 或阶段 5

WHEN 结算界面显示中
AND 玩家通过底部导航切换到其他面板
THEN OverlayPanel 关闭，结算动画终止（cancelAnimationFrame + 移除容器）
AND 所有粒子 DOM 移除
AND run 状态保持（phase = 'complete' 或 'defeat'）
AND 玩家重新打开深渊面板时，直接进入阶段 5 奖励总结（跳过动画）
AND 判断依据：phase 为 complete/defeat 即跳过动画（无需额外 settlementSeen 字段）
```

---

## 4. 新增事件

| 事件 | 载荷 | 说明 |
|------|------|------|
| `abyss:loot_explosion_start` | `{ abyssId, floor, rewards }` | 粒子动画开始 |
| `abyss:loot_explosion_end` | `{ abyssId }` | 粒子动画结束 |
| `abyss:equip_reveal` | `{ equipment, quality }` | 单张装备卡片翻转 |
| `abyss:settlement_skip` | `{ abyssId }` | 玩家点击跳过 |
| `abyss:retry` | `{ abyssId }` | 玩家点击再次挑战 |

---

## 5. 新增 CSS 动画

在 `css/main.css` 中新增以下动画关键帧（现有 `cardFlip`, `shimmer`, `pulse-glow-purple` 可复用）：

```css
/* 画面震动（神话装备） */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-3px); }
  75%      { transform: translateX(3px); }
}

/* 光柱升起（传说装备） */
@keyframes lightPillar {
  0%   { opacity: 0; height: 0; }
  30%  { opacity: 1; height: 200px; }
  80%  { opacity: 1; height: 200px; }
  100% { opacity: 0; height: 200px; }
}

/* 全屏闪烁（神话装备） */
@keyframes mythicFlash {
  0%   { opacity: 0; }
  15%  { opacity: 0.8; }
  30%  { opacity: 0; }
  50%  { opacity: 0.8; }
  65%  { opacity: 0; }
  100% { opacity: 0; }
}

/* 数字滚动闪光 */
@keyframes countUpGlow {
  0%   { color: #fff; text-shadow: 0 0 8px var(--color-gold); }
  100% { color: var(--color-text); text-shadow: none; }
}
```

---

## 6. 实现文件影响

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `js/data/abyss.js` | 修改 | 移除或置零 `cooldown` 字段 |
| `js/modules/abyss-manager.js` | 修改 | `isOnCooldown()` 始终返回 false；`getCooldownRemaining()` 始终返回 0；清理冷却检查逻辑 |
| `js/ui/abyss-panel.js` | 大幅重写 | 奖励结算界面重制；新增粒子系统、装备揭示动画、「再次挑战」按钮、「跳过」按钮 |
| `css/main.css` | 新增 | 新 `@keyframes`（shake, lightPillar, mythicFlash, countUpGlow）+ 装备卡片样式 |

---

## 7. 不在范围内

- 音效系统（当前项目无音频播放基础设施）
- Canvas 粒子渲染（使用 DOM + CSS 方案，更简单且够用）
- 深渊难度调整或新深渊副本
- 深渊排行榜或社交分享
- 掉落概率调整

---

## 8. 非功能需求

| 维度 | 要求 |
|------|------|
| **性能** | 粒子动画期间帧率 ≥ 30fps（中端手机），粒子总数 ≤ 60 |
| **内存** | 动画结束后零残留 DOM 节点，无 requestAnimationFrame 泄漏 |
| **兼容** | 旧存档加载后冷却自动失效，不需手动操作 |
| **移动端** | 所有动画在 max-width: 480px 下正常显示；粒子尺寸和卡片布局自适应 |
| **无障碍** | `prefers-reduced-motion` 媒体查询适配 — 当启用时跳过所有动画，直接显示最终结果 |

---

## 9. 实现建议（非规范，供参考）

### 粒子系统封装

建议在 `AbyssPanel` 内部实现 `_LootParticles` 辅助对象，不单独创建文件：

```
_LootParticles = {
  _container: null,
  _particles: [],
  _rafId: null,
  start(rewards, containerEl, onComplete) { ... },
  _tick(timestamp) { ... },
  stop() { ... }
}
```

### 结算状态机

结算流程建议用简单的阶段变量驱动：

```
_settlement = {
  phase: 'title' | 'particles' | 'countup' | 'equip_reveal' | 'summary',
  startTime: timestamp,
  skipped: false
}
```
