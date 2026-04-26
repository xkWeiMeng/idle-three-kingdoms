# 执行计划：深渊体验大改（Abyss UX Overhaul）

| 属性 | 值 |
|------|-----|
| **规范** | [abyss-ux-overhaul](../product-specs/abyss-ux-overhaul.md) |
| **创建日期** | 2026-04-26 |

---

## 阶段概览

| 阶段 | 任务 | 文件 |
|------|------|------|
| Phase 1 | T1: AbyssManager 快速战斗 + 过场支持 | abyss-manager.js |
| Phase 2 | T2: CSS 新增样式（老虎机 + 过场 + 进度条） | main.css |
| Phase 3 | T3: AbyssPanel 快速战斗 UI + 进度过渡 | abyss-panel.js |
| Phase 4 | T4: AbyssPanel 层间过场系统 | abyss-panel.js |
| Phase 5 | T5: AbyssPanel 老虎机装备揭示（替代翻牌） | abyss-panel.js |
| Phase 6 | T6: 集成验证 | all |

---

## 任务详情

### T1: AbyssManager 快速战斗 + 过场支持

**变更**：
1. `instances[aid]` 新增 `firstCleared` 字段
2. `init()` 中旧存档兼容：`cleared === true` 时自动设 `firstCleared = true`
3. 新增 `quickBattle(abyssId)` 方法：同步执行全部楼层战斗
4. `_handleFloorVictory()` 中非最终层时设 `phase = 'transition'`（不直接推进到下一层）
5. 新增 `advanceFloor()` 方法：仅 `phase === 'transition'` 时推进到下一层
6. `_handleAbyssComplete()` 中首通时设 `firstCleared = true`

**验证**：quickBattle 返回正确结果；transition 阶段正确暂停

### T2: CSS 新增样式

**新增**：
- 老虎机相关样式（.slot-machine, .slot-column, .slot-reel, .slot-item 等）
- @keyframes slotSpin（连续滚动）
- 快速战斗进度条样式
- Boss 登场过场样式
- 层通过横幅样式
- 庆祝特效样式

### T3: AbyssPanel 快速战斗 UI

**变更**：
1. `_renderAbyssList()` 中 `firstCleared` 的深渊增加「⚡ 快速战斗」按钮
2. 新增 `_renderQuickProgress(run)` 渲染进度过渡画面（SVG 占位 + 进度条）
3. `_bindEvents()` 绑定快速战斗按钮点击
4. 进度条动画（2.5 秒，`setInterval` 200ms 更新文字）
5. 进度完成后触发 `_onSettlementTrigger()`

### T4: AbyssPanel 层间过场系统

**变更**：
1. 监听 `abyss:floor_cleared` → 显示层通过横幅
2. 监听 `abyss:entered` → 显示 Boss 登场过场
3. 新增 `_renderBossEntrance(bossData)` → SVG 占位剪影 + 名字
4. 新增 `_renderFloorClear(floor, rewards)` → 通关横幅
5. 过场结束后调用 `AbyssManager.advanceFloor()` 推进
6. 快速战斗模式跳过所有过场

### T5: AbyssPanel 老虎机装备揭示

**变更**：
1. 用 `_SlotMachine` 对象替代 `_EquipReveal`
2. `_SlotMachine.start(equipments, containerEl, onComplete)` 
3. 品质 ≥ 3 装备进入老虎机，≤ 2 跳过
4. 按品质决定列数（3→1列, 4→1列, 5+→3列）
5. 滚动动画 + 品质特效
6. 多件装备依次播放（品质升序，间隔 800ms）
7. 跳过机制：立即停在目标位置
8. SVG 占位边框和装备图标

### T6: 集成验证

- 正常战斗 → 过场 → 结算 → 老虎机流程完整
- 快速战斗 → 进度条 → 结算 → 老虎机流程完整
- 跳过机制正常
- 旧存档兼容
- prefers-reduced-motion 适配
- DOM 清理无泄漏
