# 城镇统一像素风资源

这套资源用于 `idle-three-kingdoms` 的城镇场景，风格统一为三国题材像素风、3/4 俯视角、暖色红瓦木构。

## 目录结构

- `raw/`：图像生成工具直接产出的原始大图。
- `sheets/`：去除品红底后的透明大图，以及重排后的 atlas。
- `buildings/`：拆分后的单体建筑 PNG。
- `terrain/`：拆分后的地面与装饰 PNG。
- `characters/`：拆分后的人物与 NPC PNG。
- `manifest.json`：atlas 坐标、单图文件路径和源图对应关系。

其中 `terrain/` 额外输出了一组兼容当前 `TownWorld` 命名的别名文件，例如 `grass.png`、`tree.png`、`path_tile.png`、`flag.png`、`lantern.png`。

## 覆盖范围

- 城镇全部建筑：`town_hall` 到 `parking_lot`
- 地面与环境：草地、石板、土路、水面、农田土壤、苔地、松树、竹丛、太湖石、花丛、旗杆、灯笼
- 人物：4 类 NPC + 6 类阵营英雄立绘风格城镇精灵
- 动画表：`characters/sheets/npc_guard_walk_8dir_128.png` 为守卫角色 8 方向行走循环，`128x128` 单格、`6x8` 网格，配套元数据在同目录 `npc_guard_walk_8dir_128.json`
- 武将与兵种行走表：`characters/sheets/*_walk_4dir_128.png` 覆盖 40 名武将与 4 类普通兵种，`128x128` 单格、`6x4` 网格，统一参考 `guanyu_walk_4dir_128.png` 的行方向和帧布局，清单见 `characters/sheets/three_kingdoms_walk_sheets.manifest.json`

## ⚠️ JSON 元数据要求

Agent 生成的**任何新图片资源**都必须在同目录输出一份配套的 `.json` 元数据文件，包含：

- **精灵表**：帧尺寸（`frameWidth`/`frameHeight`）、网格布局（`columns`/`rows`）、方向与动画定义、背景色等（参考 `characters/sheets/npc_guard_walk_8dir_128.json`）
- **图标集**：每个图标的 `label`、`category`、`file` 路径（参考 `ui-icons/manifest.json`）
- **单体贴图**：尺寸、分类、来源说明

文件命名规则：与图片同名（如 `foo.png` → `foo.json`），或使用 `manifest.json` 汇总同目录多个资源。

## 重新生成整理

原始图更新后，执行：

```bash
python tools/process_town_pixel_assets.py
```

脚本会自动：

1. 对 `raw/` 下原图去除品红底。
2. 检测每张大图中的独立资源块并切片。
3. 输出单图资源与三张 atlas。
4. 重写 `manifest.json`。

地面贴图需要无透明边缘、可平铺的方形纹理。仅更新 `raw/terrain-ground.png` 后，执行：

```bash
python tools/generate_town_ground_tiles.py
```

脚本会从 3×2 地面参考图裁出六类地块，生成 `128x128` 不透明无缝贴图，并同步更新 `terrain/`、`sheets/terrain-ground.png`、`sheets/terrain-atlas.png` 与 `manifest.json`。

## 精灵表自动对齐

AI 生成的精灵表（或手工拼合的素材）常见问题：各帧中精灵位置不一致，等比切割后动画会"抖动"。  
`auto-align-sprite-sheet` 通过识别每帧的真实轮廓（bounding box），统一到同一锚点来解决此问题。

### 快速开始

```bash
# 角色行走表：6列4行，脚底中心对齐（默认锚点）
node tools/auto-align-sprite-sheet.js hero_walk.png --cols 6 --rows 4

# 输出到指定路径
node tools/auto-align-sprite-sheet.js hero_walk.png --cols 6 --rows 4 --output hero_walk_fixed.png

# 去除品红背景 + 居中对齐（适合特效精灵表）
node tools/auto-align-sprite-sheet.js effects.png --cols 8 --rows 2 --anchor center --bg-color "#FF00FF"

# 仅分析，不写文件
node tools/auto-align-sprite-sheet.js sheet.png --cols 4 --rows 4 --dry-run

# JSON 格式输出（方便脚本集成）
node tools/auto-align-sprite-sheet.js sheet.png --cols 4 --rows 4 --dry-run --json
```

### 锚点模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| `bottom-center` | 脚底中心对齐（默认） | 角色行走、站立、攻击 |
| `center` | 画面居中对齐 | 特效动画、UI 图标 |
| `top-center` | 顶部中心对齐 | 下落物、顶视角素材 |

### 常用参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--cols` | 必填 | 网格列数 |
| `--rows` | 必填 | 网格行数 |
| `--alpha-threshold` | 10 | alpha < 此值视为透明背景 |
| `--bg-color` | 无 | 指定背景色（如 `#FF00FF`），会自动替换为透明 |
| `--color-tolerance` | 30 | 背景色匹配容差 |
| `--padding` | 0 | 对齐后帧边缘最小留白 |
| `--uniform` | 否 | 输出帧尺寸收缩为能容纳最大精灵的最小尺寸 |
| `--frame-width/height` | 自动 | 手动指定单帧尺寸（覆盖自动计算） |

### 文件结构

- `tools/auto-align-sprite-sheet.js` — CLI 入口
- `tools/sprite-aligner-core.js` — 核心对齐算法（可被其他脚本 `require`）
- `tools/png-codec.js` — 纯 Node PNG 读写（无 Canvas / 原生依赖）
