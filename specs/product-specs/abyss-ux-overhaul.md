# 产品规范：深渊体验大改（Abyss UX Overhaul）

| 属性 | 值 |
|------|-----|
| **状态** | Active |
| **作者** | SDD-workflow |
| **创建日期** | 2026-04-26 |
| **关联 PRD** | [abyss-ux-overhaul PRD](../game-prds/abyss-ux-overhaul.md) |
| **关联服务规范** | [AbyssManager](../services/abyss-manager.md) |
| **关联产品规范** | [abyss-loot-explosion](abyss-loot-explosion.md)（原有结算系统，部分替代） |
| **父级代码** | [abyss-manager.js](../../js/modules/abyss-manager.js)、[abyss-panel.js](../../js/ui/abyss-panel.js)、[main.css](../../css/main.css) |

---

## 1. 概述

三项深渊体验改进：快速战斗、层间过场、老虎机装备揭示。
核心原则：**所有美术资源用 SVG 占位 + `<!-- PLACEHOLDER -->` 注释，方便设计师后续替换。**

---

## 2. 能力

### CAP-UX-01：快速战斗（Quick Battle）

**描述**：已通关的深渊可一键跳过战斗过程，3 秒内直达结算。

**AbyssManager 变更**：

新增 `quickBattle(abyssId)` 方法：
1. 验证前提（系统解锁、深渊解锁、无进行中 run、资源充足、该深渊 `firstCleared === true`）
2. 扣除入场资源
3. 同步执行全部楼层战斗（无 tick 延迟，循环调用 `_executeRound` 至结束）
4. 设置 `currentRun.quickBattle = true`
5. 结果（complete/defeat）通过现有事件发出

**AbyssManager 存储变更**：
- `instances[aid]` 新增 `firstCleared: boolean`（默认 `false`）
- 在 `_handleAbyssComplete` 中：若 `!inst.cleared` 则同时设 `firstCleared = true`
- 向后兼容：已有 `cleared === true` 的旧存档，`init` 时自动设 `firstCleared = true`

**AbyssPanel 变更**：
- 深渊列表中，`firstCleared === true` 的深渊显示「⚡ 快速战斗」按钮
- 点击后调用 `AbyssManager.quickBattle(aid)`
- 显示进度过渡画面（2.5 秒）：SVG 战斗背景 + 层数进度条
- 过渡结束后自动触发结算动画

**进度条过渡画面结构**：
```html
<div class="abyss-quick-progress">
  <!-- PLACEHOLDER: 快速战斗背景
       位置：进度过渡画面全屏背景
       尺寸：100% × 100%
       内容：深渊主题暗色背景 + 模糊战斗剪影
       替换方式：将 <svg> 替换为 <img src="assets/abyss/quick-battle-bg.png">
       当前使用 SVG 渐变 + 几何图形占位 -->
  <svg>...</svg>
  <div class="progress-bar">
    <div class="progress-fill" style="width: X%"></div>
  </div>
  <div class="progress-text">第 X/5 层...</div>
</div>
```

**验收场景**：

```
WHEN 玩家已通关 abyss_hulao（firstCleared === true）
AND 打开深渊列表
THEN 该深渊卡片显示「进入」和「⚡ 快速战斗」两个按钮

WHEN 玩家首次挑战 abyss_hulao（firstCleared === false）
AND 打开深渊列表  
THEN 仅显示「进入」按钮，无「快速战斗」

WHEN 点击「⚡ 快速战斗」
AND jade >= 30, gold >= 5000, iron >= 200
THEN 扣除资源
AND 显示进度过渡画面
AND 进度条从 0% 推进到 100%（2.5 秒）
AND 文字依次显示 "第 1/5 层..." → "第 5/5 层..."
AND 过渡结束后进入结算界面

WHEN 快速战斗结果为通关
THEN 结算界面与正常通关一致（粒子 + countUp + 装备揭示）

WHEN 快速战斗结果为失败（止步于第 X 层）
THEN 结算界面显示失败标题 + 止步层数 + 已获奖励

WHEN 旧存档中 instances.abyss_hulao.cleared === true
AND firstCleared 字段不存在
THEN init 时自动设置 firstCleared = true
```

---

### CAP-UX-02：层间过场画面

**描述**：正常战斗模式下，每层 Boss 战前显示登场过场，层通过后显示通关横幅。

**Boss 登场过场**（每层开始前，快速战斗模式跳过）：

1. 暗色遮罩渐入（`fadeIn` 300ms）
2. 中央 Boss SVG 剪影 + 名字 + 称号
3. 停留 1.5 秒后淡出
4. 战斗开始

**SVG 占位**：
```html
<!-- PLACEHOLDER: Boss 登场剪影
     位置：过场画面中央
     尺寸：160×220px
     内容：Boss 角色全身剪影（暗色轮廓 + 主题色背光）
     替换方式：将 <svg> 替换为 <img src="assets/abyss/boss_{bossId}.svg">
     示例 bossId: abyss_huaxiong, abyss_zhangliao_a, abyss_lvbu ...
     当前使用 SVG 人形轮廓占位 -->
```

**层通关横幅**（每层结束后）：

1. "✅ 第 X 层通过！" 横幅 `slideUp` 入场
2. 简要显示本层奖励图标
3. 1.5 秒后淡出，进入下一层 Boss 登场

**实现方式**：

在 `AbyssPanel` 中添加过场系统。`abyss:floor_cleared` 事件触发层通关横幅，然后自动触发下一层 Boss 登场。

修改 `AbyssManager._handleFloorVictory()` 中 `run.currentFloor++` 和 `_setupFloor()` 的调用时机：增加 `run.phase = 'transition'` 过渡状态，由 UI 过场结束后调用 `AbyssManager.advanceFloor()` 推进到下一层。

**新增 AbyssManager API**：
- `advanceFloor()`: 推进到下一层并设置敌人，仅在 `phase === 'transition'` 时有效

**验收场景**：

```
WHEN 进入深渊第 1 层
THEN 显示华雄 Boss 登场过场（SVG 剪影 + "华雄" 名字）
AND 1.5s 后过场消失，战斗开始

WHEN 击败第 1 层 Boss
THEN run.phase 变为 'transition'（战斗暂停）
AND 显示 "✅ 第 1 层通过！" 横幅 + 本层奖励
AND 1.5s 后切到第 2 层 Boss 登场

WHEN 击败最终 Boss（第 5 层）
THEN 不显示 Boss 登场过场
AND 直接进入通关结算

WHEN 快速战斗模式
THEN 跳过所有过场画面

WHEN 过场动画中玩家关闭面板
THEN 过场定时器清理，无内存泄漏
AND run 保持 transition 状态
AND 重新打开时跳过过场，直接进入战斗
```

---

### CAP-UX-03：老虎机装备揭示

**描述**：品质 ≥ 3（稀有）的装备掉落时，用老虎机滚动特效替代翻牌动画。

**替代关系**：此能力替换 abyss-loot-explosion 规范中的 CAP-LOOT-02（高品质装备掉落特效）。原有的 `_EquipReveal` 系统被 `_SlotMachine` 替换。品质 ≤ 2 装备仍在阶段 5 文字展示。

**老虎机结构**：

```html
<div class="slot-machine">
  <!-- PLACEHOLDER: 老虎机外框
       位置：结算界面居中
       尺寸：300×180px（三列）/ 120×180px（单列）
       内容：古风卷轴造型的老虎机框架
       替换方式：将 <svg> 替换为 <img src="assets/abyss/slot-frame.svg">
       当前使用 SVG 圆角矩形 + 花纹线条占位 -->
  <svg class="slot-frame">...</svg>
  <div class="slot-columns">
    <div class="slot-column">
      <div class="slot-reel"> <!-- 滚动内容 --> </div>
    </div>
    <!-- 1-3 列根据品质决定 -->
  </div>
</div>
```

**列数规则**：

| 品质 | 列数 | 说明 |
|------|------|------|
| 3（稀有） | 1 列 | 快速滚动停止 |
| 4（史诗） | 1 列 | 滚动 + 紫色脉冲 |
| 5（传说） | 3 列 | 依次停止 + 金色庆祝 |
| 6（神话） | 3 列 | 延迟停止 + 全屏红金闪烁 + 震动 |

**滚动动画**：

1. 每列包含 12 个装备 emoji 图标（随机排列，目标装备在固定位置）
2. CSS `translateY` 动画驱动垂直滚动
3. 初始速度快（50ms/格），逐渐减速（缓动 `ease-out`）
4. 总滚动时长：1 列 = 1.2s，3 列依次停止间隔 500ms
5. 停止瞬间播放品质对应特效

**品质特效**：

- **品质 3**：停止时蓝色闪光（`box-shadow: 0 0 20px var(--quality-3)`），持续 500ms
- **品质 4**：停止时紫色全屏脉冲（复用 `pulse-glow-purple`）
- **品质 5**：停止时金色光柱升起 + 全屏金色粒子（复用 `_LootParticles` 机制生成金色粒子）
- **品质 6**：停止前全屏红金闪烁（复用 `mythicFlash`）+ 画面震动（`shake`）+ 延迟 1.2s 后停止

**全屏庆祝（品质 ≥ 5）**：
- 覆盖整个 overlay 的半透明辐射渐变层
- 装备名称 + 品质以大号字体居中显示（`font-size: 1.4rem`）
- 持续 2 秒淡出

**多装备处理**：
- 品质 ≥ 3 的装备按品质升序依次播放老虎机
- 每件装备的老虎机之间间隔 800ms
- 品质 ≤ 2 的装备跳过老虎机，在阶段 5 文字展示

**滚动项图标（emoji 占位）**：
```
🗡️ 剑  ⚔️ 戟  🛡️ 盾  🏹 弓  👑 冠  💍 戒  📿 佩  🔮 珠
```
```html
<!-- PLACEHOLDER: 装备图标（老虎机滚动项）
     位置：老虎机每个滚动格
     尺寸：60×60px
     内容：各类装备简化图标
     替换方式：将 emoji span 替换为 <img src="assets/equipment/icon_{type}.svg">
     当前使用 emoji 占位 -->
```

**验收场景**：

```
WHEN 深渊通关
AND droppedEquipment 包含 1 件品质 3（稀有）装备
THEN 结算阶段 4 显示单列老虎机
AND 老虎机滚动 1.2s 后停在目标装备
AND 停止时蓝色闪光效果
AND 装备名称以蓝色显示

WHEN 深渊通关
AND droppedEquipment 包含 1 件品质 5（传说）装备
THEN 结算阶段 4 显示三列老虎机
AND 三列依次停止（间隔 500ms）
AND 最后一列停止时金色光柱 + 全屏金色粒子
AND 装备名称大字体金色显示

WHEN 深渊通关
AND droppedEquipment 包含 1 件品质 6（神话）装备
THEN 三列老虎机开始滚动
AND 滚动中全屏红金闪烁
AND 画面震动
AND 闪烁+震动结束后（1.2s）最后一列停止
AND 全屏庆祝特效 2s

WHEN 掉落品质 3 + 品质 5 两件装备
THEN 先播放品质 3 的单列老虎机
AND 结束后间隔 800ms
AND 再播放品质 5 的三列老虎机

WHEN 仅掉落品质 ≤ 2 装备
THEN 跳过老虎机阶段
AND 直接在阶段 5 文字展示

WHEN 老虎机滚动中点击「跳过 ⏩」
THEN 所有列立即停在目标位置
AND 跳过特效
AND 直接进入阶段 5

WHEN prefers-reduced-motion 启用
THEN 跳过老虎机动画
AND 直接文字展示所有装备
```

---

## 3. 结算流程修订

原有 5 阶段流程修改为：

| 阶段 | 时间 | 内容 | 变更说明 |
|------|------|------|---------|
| 1. 标题 | 0–500ms | 胜利/失败标题 | 不变 |
| 2. 粒子爆落 | 500–2500ms | 战利品粒子 | 不变（CAP-LOOT-01） |
| 3. 资源统计 | 2500–3500ms | countUp 动画 | 不变 |
| 4. 老虎机揭示 | 3500ms+ | **新：老虎机替代翻牌** | 品质 ≥ 3 用老虎机 |
| 5. 奖励总结 | 完成后 | 总结 + 操作按钮 | 品质 ≤ 2 装备文字展示 |

---

## 4. 新增 CSS

```css
/* 快速战斗进度条 */
.abyss-quick-progress { ... }
.abyss-quick-progress .progress-bar { ... }
.abyss-quick-progress .progress-fill { ... }

/* Boss 登场过场 */
.abyss-transition { ... }
.abyss-transition__boss-silhouette { ... }

/* 层通过横幅 */
.abyss-floor-clear { ... }

/* 老虎机 */
.slot-machine { ... }
.slot-frame { ... }
.slot-column { ... }
.slot-reel { ... }
.slot-item { ... }

/* 老虎机动画 */
@keyframes slotSpin { ... }
@keyframes slotStop { ... }
@keyframes slotFlashBlue { ... }
@keyframes celebrationBurst { ... }
```

---

## 5. 实现文件影响

| 文件 | 变更 | 说明 |
|------|------|------|
| `js/modules/abyss-manager.js` | 修改 | 新增 `quickBattle()`、`advanceFloor()`；`instances` 新增 `firstCleared`；`_handleFloorVictory` 增加 transition 阶段 |
| `js/ui/abyss-panel.js` | 大幅修改 | 新增 `_SlotMachine` 替代 `_EquipReveal`；新增快速战斗 UI；新增过场系统 |
| `css/main.css` | 新增 | 老虎机样式 + 过场样式 + 进度条样式 |

---

## 6. 不在范围内

- 音效系统
- 新深渊副本
- 掉落概率调整
- Canvas 渲染（继续 DOM + CSS）
