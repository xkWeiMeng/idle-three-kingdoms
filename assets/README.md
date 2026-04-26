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
