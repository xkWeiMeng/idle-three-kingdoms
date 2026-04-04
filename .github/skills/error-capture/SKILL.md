---
name: error-capture
description: "捕获视觉验收或人类反馈中的错误，自动分类和沉淀为持久化经验。Use when capturing visual QA failures, recording human feedback about rendering bugs, persisting error patterns, building error knowledge base, or preventing recurring mistakes in map building and sprite usage."
argument-hint: "错误描述或人类反馈内容"
---

# 错误捕获与经验沉淀

## 目的

当 Agent 在视觉验收中发现问题，或人类反馈指出错误时，将错误**结构化记录、分类归档、形成可搜索的经验库**，防止同类错误再次发生。

## 何时使用

- Chrome 视觉验收发现渲染异常
- 人类反馈 "这个地图有问题" / "这个贴图用错了"
- 地图组装后发现碰撞错误
- 精灵识别分类出错
- 任何需要 "记住这个教训" 的时刻

## 错误分类体系

| 类别 | 编码 | 典型场景 |
|------|------|----------|
| **贴图错误** | `SPRITE` | tile 用错、尺寸不匹配、帧偏移 |
| **地图结构** | `MAP` | 碰撞层遗漏、路径不通、尺寸错误 |
| **渲染故障** | `RENDER` | Canvas 空白、图层顺序错、缩放异常 |
| **资源缺失** | `ASSET` | 图片 404、路径错误、贴图集未注册 |
| **UI 问题** | `UI` | 布局溢出、元素遮挡、交互失效 |
| **性能问题** | `PERF` | 地图过大卡顿、内存泄漏 |
| **数据格式** | `DATA` | JSON 格式错、字段遗漏、ID 冲突 |

## 操作步骤

### 1. 捕获错误信息

收集以下数据：

```markdown
## 错误快照

- **时间**：YYYY-MM-DD
- **来源**：视觉验收 / 人类反馈 / 控制台报错
- **类别**：[上表编码]
- **严重度**：critical / major / minor
- **截图**：[如有]
- **控制台日志**：[如有]
```

### 2. 分析根因

判断错误根因属于哪个阶段：

| 阶段 | 问题 | 修复方向 |
|------|------|----------|
| 精灵识别 | tile 分类错了 | 更新 sprite-识别 规则 |
| 地图组装 | 数据格式有误 | 修正 map-builder 模板 |
| 资源注册 | 路径或配置错 | 修正 map-registry.js |
| 渲染管线 | MapLoader 的 bug | 修复引擎代码 |
| 验收遗漏 | 验收清单不完整 | 扩展 visual-qa 清单 |

### 3. 记录到错误知识库

追加到 `ai-docs/error-knowledge-base.md`：

```markdown
### [SPRITE-001] Pixel Crawler tile 尺寸误判

- **日期**：2024-XX-XX
- **错误**：将 Dungeon_Tiles.png 识别为 32×32，实际是 16×16
- **根因**：精灵识别时未实际查看图片，凭文件名猜测
- **修复**：在 sprite-识别 skill 中强调"必须 view_image 确认"
- **防御规则**：`ALWAYS_VIEW_BEFORE_CLASSIFY`
```

### 4. 更新防御规则

根据错误类型，更新对应的 skill 或指令：

#### 4a. 更新 skill 注意事项

如果错误源自某个 skill 的步骤不完善，在该 SKILL.md 的"注意事项"中追加防御规则。

#### 4b. 更新 memory

使用 memory 工具将关键教训写入持久化记忆：

```
memory create /memories/repo/map-building-lessons.md
```

记录格式：
```markdown
## 地图构建教训

- Pixel Crawler 贴图集 tile 尺寸均为 16×16，不是 32×32
- MapRegistryData 的 tilesets 路径必须从项目根目录开始
- collision 层的 data 长度必须等于 width × height
- ...
```

#### 4c. 更新验收清单

如果错误在验收阶段本应被发现但遗漏了，在 `visual-qa` skill 的验收清单中增加对应检查项。

### 5. 验证修复

- 重新触发导致错误的操作
- 确认修复生效
- 确认防御规则被正确添加

## 错误知识库格式

文件：`ai-docs/error-knowledge-base.md`

```markdown
# 错误知识库

> Agent 自动积累的错误经验，按类别索引。

## 索引

| ID | 类别 | 简述 | 严重度 |
|----|------|------|--------|
| SPRITE-001 | SPRITE | tile 尺寸误判 | major |
| MAP-001 | MAP | 碰撞层遗漏边界 | critical |

---

## 详细记录

### [SPRITE-001] ...
### [MAP-001] ...
```

## 与 harness-feedback 的关系

本 skill 专注于**游戏资源和渲染**领域的错误沉淀。
如果错误是 Agent 行为层面的（如工具使用方式错误、工作流程不当），应使用 `harness-feedback` skill 处理并记录到 `specs/decisions/harness-feedback-log.md`。

## 自动触发

以下场景应自动触发 error-capture：
1. `visual-qa` 验收发现任何 "FAIL" 项
2. 人类发消息包含 "错了"、"有问题"、"不对"、"bug" 等关键词
3. 控制台出现未预期的 Error 级别日志
4. 地图文件验证（JSON parse）失败
