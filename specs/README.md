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

### 系统规范
- [核心契约](system/core-contracts.md) — `Draft` — 资源枚举、品质等级、事件协议、存档格式、初始化顺序

### 服务规范
- [ResourceManager](services/resource-manager.md) — `Draft` — 资源增减、上限、食物回复、每日登录
- [HeroManager](services/hero-manager.md) — `Draft` — 武将获取、升级、编队、属性计算

### 产品规范
_暂无。_

### 设计文档
_暂无。_
