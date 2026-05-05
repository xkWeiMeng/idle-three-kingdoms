# 幻想三国 - 放置游戏 架构说明

## 项目概览

基于 GitHub Pages 的纯前端放置（Idle）游戏，幻想三国题材。  
无后端，所有数据存储在浏览器 `localStorage` 中。

---

## 技术栈

| 层面 | 选型 |
|------|------|
| 托管 | GitHub Pages (静态) |
| 语言 | 原生 JavaScript (ES6+) |
| 样式 | 原生 CSS (CSS Variables) |
| 构建 | 无构建工具，直接引用 |
| 存储 | localStorage |

---

## 目录结构

```
idle-three-kingdoms/
├── index.html              # 入口 HTML
├── css/
│   └── main.css            # 全局样式
├── js/
│   ├── core/               # 核心引擎层
│   │   ├── constants.js    #   常量定义
│   │   ├── utils.js        #   工具函数
│   │   ├── event-bus.js    #   事件总线
│   │   ├── save-manager.js #   存档管理
│   │   └── game-loop.js    #   主循环 (tick)
│   ├── data/               # 静态数据表
│   │   ├── heroes.js       #   武将数据
│   │   ├── stages.js       #   关卡数据
│   │   └── equipment.js    #   装备数据
│   ├── modules/            # 业务逻辑模块
│   │   ├── resource-manager.js   # 资源管理
│   │   ├── hero-manager.js       # 武将管理
│   │   ├── battle-manager.js     # 战斗/挂机
│   │   ├── recruit-manager.js    # 招募/抽卡
│   │   └── equipment-manager.js  # 装备系统
│   ├── ui/                 # UI 渲染层
│   │   ├── tab-controller.js     # 页签切换
│   │   ├── resources-bar.js      # 顶部资源栏
│   │   ├── hero-panel.js         # 武将面板
│   │   ├── battle-panel.js       # 战斗面板
│   │   ├── recruit-panel.js      # 招募面板
│   │   ├── equipment-panel.js    # 装备面板
│   │   └── settings-panel.js     # 设置面板
│   └── main.js             # 游戏入口 (初始化 + 启动)
├── assets/                 # 图片、音效等静态资源
│   ├── img/
│   └── audio/
├── ai-docs/                # AI 编码说明文档 (git ignored)
├── .gitignore
└── README.md
```

---

## 架构分层

```
┌──────────────────────────────────────────┐
│                 UI 层                     │
│  tab-controller / resources-bar / panels │
├──────────────────────────────────────────┤
│              业务逻辑层                    │
│  resource-mgr / hero-mgr / battle-mgr   │
│  recruit-mgr  / equipment-mgr           │
├──────────────────────────────────────────┤
│              核心引擎层                    │
│  game-loop / event-bus / save-manager    │
│  constants  / utils                      │
├──────────────────────────────────────────┤
│              数据层                       │
│  heroes.js / stages.js / equipment.js    │
└──────────────────────────────────────────┘
```

### 层间通信

- **EventBus** 是唯一的跨模块通信机制，模块之间不直接引用
- UI 层监听事件刷新视图，通过调用模块方法触发操作
- `game:tick` 事件驱动所有按时间推进的逻辑（挂机收益、战斗等）

### 核心事件

| 事件 | 触发者 | 说明 |
|------|--------|------|
| `game:tick` | GameLoop | 每秒触发，传入 dt(秒) |
| `game:saved` | SaveManager | 存档完成 |
| `resource:changed` | ResourceManager | 资源变动 |
| `hero:added` | HeroManager | 获得新武将 |
| `tab:switched` | TabController | 切换页签 |

---

## 游戏系统设计

### 1. 资源系统
- **金币 (Gold)** — 基础货币，战斗掉落
- **玉璧 (Jade)** — 高级货币，用于招募
- **经验 (EXP)** — 武将升级
- **粮草 (Food)** — 出征消耗

### 2. 武将系统
- 5 个品质等级：白 / 绿 / 蓝 / 紫 / 橙
- 属性：攻击、防御、生命、技能
- 最多 5 人上阵

### 3. 战斗系统
- 自动挂机，每 tick 结算
- 关卡推进 + 扫荡
- 离线收益（再次上线时补发）

### 4. 招募系统
- 消耗玉璧抽卡
- 权重随机，支持保底

### 5. 装备系统
- 装备掉落 / 合成
- 穿戴到武将，提升属性

---

## 存档结构

```json
{
  "version": "0.1.0",
  "timestamp": 1711612800000,
  "resources": { "gold": 0, "jade": 0, "exp": 0, "food": 100 },
  "heroes": { "heroes": [], "team": [] },
  "battle": { "currentStage": null, "isAutoFight": false },
  "recruit": {},
  "equipment": { "inventory": [] }
}
```

---

## 开发约定

1. **纯前端**，不依赖任何构建工具或 npm 包
2. 所有 JS 通过 `<script>` 标签按依赖顺序加载
3. 模块使用全局单例对象（如 `ResourceManager`），通过 EventBus 通信
4. CSS 使用 CSS Variables 统一主题色
5. `ai-docs/` 目录仅本地使用，已在 `.gitignore` 中排除

---

## 作者

**XieKang**
