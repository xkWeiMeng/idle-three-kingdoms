# Agent 导航枢纽

本文件是 AI Agent 进入项目的入口点。按需跟随链接，不要全部读完。

## 项目概览

**幻想三国 (Idle Three Kingdoms)** — 纯前端放置游戏，三国题材，GitHub Pages 部署。  
零依赖、无构建工具、无后端，`localStorage` 存储。

## 关键入口

| 资源 | 路径 | 说明 |
|------|------|------|
| 项目说明 | [.github/copilot-instructions.md](.github/copilot-instructions.md) | 架构、命名、API、模块模板 |
| 规范体系 | [specs/README.md](specs/README.md) | 所有结构化规范的索引 |
| 系统契约 | [specs/system/](specs/system/) | 跨模块契约和边界 |
| 服务规范 | [specs/services/](specs/services/) | 各模块能力和行为规则 |
| 产品规范 | [specs/product-specs/](specs/product-specs/) | 功能需求 |
| 设计文档 | [specs/design-docs/](specs/design-docs/) | 技术设计 |
| 执行计划 | [specs/exec-plans/](specs/exec-plans/) | 任务拆解 |
| 架构决策 | [specs/decisions/](specs/decisions/) | ADR + Harness 反馈 |
| 变更日志 | [specs/changelog.md](specs/changelog.md) | 规范变更记录 |

## Agent 工作流

1. **读取本文件** → 获取项目概览和导航
2. **读取 copilot-instructions.md** → 了解架构和编码规范
3. **读取 specs/README.md** → 查找相关规范
4. **按需深入** → 跟随链接到具体规范

## 可用 Agent

| Agent | 用途 |
|-------|------|
| `spec-architect` | 从需求创建结构化规范 |
| `spec-reviewer` | 审查规范质量和完整性 |
| `spec-implementer` | 基于规范实现代码 |
| `exec-planner` | 将规范拆解为执行计划 |
| `drift-detector` | 检测规范与代码的漂移 |
| `doc-gardener` | 维护规范和文档卫生 |
| `harness-engineer` | 诊断 Agent 错误并工程化修复 |
| `sdd-workflow` | SDD 全生命周期编排 |
| `map-qa` | 全自动地图 QA |
| `chrome-verifier` | Chrome 视觉验收 |
