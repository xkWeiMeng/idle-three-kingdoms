# 规范

本目录包含项目的所有结构化规范。
规范是 Agent 推理的**唯一真实来源**。

> "Agent 看不到的，就不存在。"

## 目录结构

| 目录 | 用途 | 受众 |
|------|------|------|
| `system/` | 跨服务契约、错误码、边界 | 所有 Agent |
| `services/` | 每个服务的能力、接口、行为规则 | 特定服务的 Agent |
| `product-specs/` | 系统应该做什么（需求） | 产品规划 |
| `design-docs/` | 系统如何实现（架构） | 实现 |
| `exec-plans/` | 从规范拆解的任务 | 执行 |
| `decisions/` | 为什么选择这个方案（ADR + harness 反馈） | 上下文保留 |

## 渐进式披露

Agent 应像使用地图一样导航规范：

1. 从这里开始（`specs/README.md`）获取概览
2. 前往 `system/` 查看跨服务契约和边界
3. 前往 `services/` 查看特定服务详情
4. 前往 `product-specs/` 查看功能需求
5. 前往 `design-docs/` 查看技术设计
6. 前往 `exec-plans/` 查看实现任务拆解

不要全部读完——按需跟随链接找到你需要的部分。

## 规范生命周期

| 状态 | 含义 | 操作 |
|------|------|------|
| `Draft` | 开发中，尚未审查 | 提升前使用 `spec-reviewer` Agent |
| `Active` | 已审查并批准，当前事实 | 必须与代码保持同步 |
| `Deprecated` | 已被取代，保留作为历史 | 不可用于新工作 |

## 规则

1. 规范变更和代码变更必须在**同一个 PR** 中
2. 规范在代码编写**之前**更新
3. 每个规范都有 WHEN/THEN 场景用于验证
4. 跨服务语义定义在 `system/` 中，永不猜测
5. 永不复制——引用真实来源

## Active 规范索引

<!-- 创建规范时更新本部分 -->

### 产品规范

| 规范 | 状态 | 说明 |
|------|------|------|
| [种菜系统](product-specs/farming-system.md) | Draft | 城镇农耕玩法，作物品级与料理 Buff |
| [停车场系统](product-specs/parking-system.md) | Draft | QQ 抢车位玩法，载具停放被动产出金币 |
| [城镇道路系统](product-specs/town-road-system.md) | Active | MST 自动道路网络、分级宽度渲染、A* 寻路偏好 |
| [城防塔防系统](product-specs/tower-defense-system.md) | Active | 防御建筑、波次进攻、科技树、从中世纪到现代 |
| [城防塔防系统](product-specs/tower-defense-system.md) | Draft | 波次制城防、4 时代科技树、地面/地下/空中敌人、武将联动 |
| [装备栏逻辑优化](product-specs/equipment-inventory-optimization.md) | Active | 默认容量翻倍、金币扩容、一键排序/售卖、内联操作按钮 |
| [深渊战利品爆落与连续刷本](product-specs/abyss-loot-explosion.md) | Draft | 粒子爆落动画、装备翻牌特效、移除冷却、结算重制 |

### 系统规范
- [核心契约](system/core-contracts.md) — `Draft` — 资源枚举、品质等级、事件协议、存档格式、初始化顺序

### 服务规范
- [ResourceManager](services/resource-manager.md) — `Draft` — 资源增减、上限、食物回复、每日登录
- [HeroManager](services/hero-manager.md) — `Draft` — 武将获取、升级、编队、属性计算
- [BattleManager](services/battle-manager.md) — `Active` — 战斗流程、回合执行、伤害计算、结算奖励、自动推图
- [AdventureManager](services/adventure-manager.md) — `Active` — 区域选择与解锁、挂机模式、会话统计、离线结算
- [RecruitManager](services/recruit-manager.md) — `Draft` — 招募/抽卡、品质概率、保底机制、免费招募
- [StoryManager](services/story-manager.md) — `Draft` — 主线章节推进、场景已读、自言自语调度、角色对话与人设查询

### 产品规范
_暂无。_

### 设计文档
- [三国古风 UI 主题重塑](design-docs/ui-sanguo-theme.md) — `Draft` — 从赛博朋克暗蓝转向墨色+朱红+鎏金三国古风主题
- [城镇角色碰撞检测](design-docs/town-character-collision.md) — `Draft` — 角色漫步时的建筑碰撞网格与角色间距检测

### 执行计划
- [三国古风 UI 主题重塑](exec-plans/ui-sanguo-theme.md) — `Active` — 4 阶段 19 任务，覆盖 CSS 令牌→组件→面板→Canvas 全链路
- [BattleManager](exec-plans/battle-manager.md) — `Active` — 3 阶段 5 任务，代码-规范对齐审计 + 技术债务 S3 修复 + 索引同步
