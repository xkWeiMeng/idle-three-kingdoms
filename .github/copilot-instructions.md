# Copilot Instructions — 幻想三国 (Idle Three Kingdoms)

## 项目概要

纯前端放置（Idle）游戏，三国题材，GitHub Pages 部署。  
零依赖、无构建工具、无后端，`localStorage` 存储。  
直接在浏览器打开 `index.html` 运行，无需 build。

---

## Skills 使用指南

本项目配置了 3 个 skill，在 AI 编码时按场景选用：

### `game-engine` — 🔧 日常编码首选

> **编写游戏逻辑代码时使用此 skill。**

适用场景：
- 实现/修改 Manager 业务逻辑（战斗结算、抽卡、装备系统等）
- 实现 UI 面板渲染和交互
- 游戏循环、碰撞检测、物理、控制相关开发
- Canvas/WebGL 渲染相关开发
- 调试和修复游戏 bug

### `game` — 📐 游戏设计阶段

> **设计新系统或策划玩法时使用此 skill。**

适用场景：
- 设计新的游戏系统（核心循环、进度曲线、数值平衡）
- 策划新玩法规则和机制
- 生成完整的 GDD（游戏设计文档）
- 规划武将技能体系、装备词缀、关卡难度等

### `game-cog` — 🎨 美术资源生成

> **需要生成游戏美术资源时使用此 skill。**（依赖 `cellcog`）

适用场景：
- 生成角色立绘、头像、精灵图
- 生成 UI 元素（按钮、图标、血条）
- 生成背景、贴图素材
- 生成音乐和音效

### 💡 组合使用示例

| 任务 | 推荐流程 |
|------|---------|
| 实现战斗系统 | `game` 设计战斗规则 → `game-engine` 编码实现 |
| 添加新武将 | `game` 设计属性和技能 → `game-cog` 生成立绘 → `game-engine` 编码数据和逻辑 |
| 做招募界面 | `game-cog` 生成 UI 素材 → `game-engine` 编码面板 |

---

## 架构

```
UI 层 (js/ui/)           → 面板渲染、事件监听
业务逻辑层 (js/modules/)  → 各游戏系统 Manager（全局单例）
核心引擎层 (js/core/)     → EventBus、GameLoop、SaveManager、Utils、Constants
数据层 (js/data/)         → 静态数据表 + 剧情数据
```

**核心规则**：
1. **EventBus 是唯一跨模块通信方式**，模块间不直接引用
2. 模块为**全局单例对象**，不用 class
3. UI 只读状态 + 监听事件，通过模块方法触发操作
4. `game:tick`（每秒）驱动所有时间推进逻辑
5. Manager 实现 `getState()` 返回可序列化状态 → `SaveManager` 持久化

### 事件表

| 事件 | 载荷 | 说明 |
|------|------|------|
| `game:tick` | `(dt)` 秒 | 每秒触发 |
| `game:saved` | 无 | 存档成功 |
| `resource:changed` | `(type, amount)` | 资源变动 |
| `hero:added` | `(heroInstance)` | 获得武将 |
| `tab:switched` | `(tabId)` | 切换页签 |
| `story:chapter_unlocked` | `(chapter)` | 章节解锁 |
| `story:monologue` | `{speaker, text}` | 武将独白 |

### 核心 API 速查

```javascript
// EventBus — 仅 on/off/emit，无 once
EventBus.on(event, cb) | .off(event, cb) | .emit(event, ...args)

// Utils
Utils.formatNumber(n)            // 万/亿/兆 中文缩写
Utils.randInt(min, max)          // 闭区间随机整数
Utils.weightedRandom(items, key) // 按权重随机
Utils.deepClone(obj)             // JSON 深拷贝
Utils.uid()                      // 伪唯一 ID

// Resources: CONSTANTS.RESOURCE.{GOLD, JADE, EXP, FOOD}
// Qualities: CONSTANTS.QUALITY.{COMMON(1), UNCOMMON(2), RARE(3), EPIC(4), LEGENDARY(5)}
// Config: MAX_TEAM_SIZE=5, TICK_INTERVAL_MS=1000, SAVE_INTERVAL_MS=30000
```

---

## Script 加载顺序

新增文件必须按此层级在 `index.html` 添加 `<script>`：

**core → data → modules → ui → main.js**（main.js 必须最后）

---

## 新增模块清单

1. `js/modules/xxx-manager.js` + `js/ui/xxx-panel.js`
2. `index.html` 按层级加 `<script>`
3. `main.js` 更新：`getFullState()` 添加状态、`initGame()` 注册 init、按需注册 tick
4. 新页签需同时更新 `TabController._tabs` 和 `index.html` 的 `<section>`

---

## 模块模板

```javascript
// Manager (js/modules/)
const XxxManager = {
  _state: {},
  init(saved) { this._state = saved || { /* defaults */ }; },
  onTick(dt) { /* 按需实现 */ },
  getState() { return Utils.deepClone(this._state); }
};

// Panel (js/ui/)
const XxxPanel = {
  _el: null,
  init() {
    this._el = document.getElementById('panel-xxx');
    this._render();
    EventBus.on('some:event', () => this._render());
  },
  _render() { /* 读取 Manager 状态，更新 innerHTML */ }
};
```

---

## 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 常量 | `UPPER.DOT.CHAIN` | `CONSTANTS.RESOURCE.GOLD` |
| 模块 | `PascalCase+Manager` | `BattleManager` |
| 面板 | `PascalCase+Panel` | `HeroPanel` |
| 方法 | `camelCase` | `getState()` |
| 私有 | `_` 前缀 | `_state`, `_render()` |
| 事件 | `domain:action` | `resource:changed` |
| CSS | `kebab-case` | `.game-panel` |
| 文件 | `kebab-case.js` | `hero-manager.js` |

---

## CSS 变量

```css
--color-bg: #1a1a2e    --color-surface: #16213e   --color-primary: #e94560
--color-secondary: #0f3460   --color-gold: #f5c518   --color-text: #eee
--color-text-dim: #999   --color-success: #4caf50   --color-danger: #f44336
--font-main: 'Microsoft YaHei', 'PingFang SC', sans-serif
```

布局：Flexbox，`max-width: 480px`。组件：`.btn`、`.card`。

---

## ai-docs 目录

`ai-docs/` 专门存放 AI 生成的各种文档（`.gitignore` 已排除）。  
AI agent 生成较长的设计文档、方案对比、数据表等应保存到此目录。

---

## ⚠️ 注意事项

- **禁止**引入 npm 包或构建工具（除非明确要求）
- **禁止**使用 ES Module (import/export)，用全局变量 + `<script>` 加载
- 新增/修改 JS 文件 → **必须更新 `index.html`** script 标签
- 新增 Manager → **必须更新 `main.js`** 的初始化和状态聚合
- 持久化 → 只通过 `SaveManager`，**禁止直接操作 `localStorage`**
- 状态中**禁止存储函数或循环引用**（deepClone 用 JSON 序列化）
- 数字显示用 `Utils.formatNumber()`，ID 生成用 `Utils.uid()`
- CSS 颜色用已定义的 CSS Variables
