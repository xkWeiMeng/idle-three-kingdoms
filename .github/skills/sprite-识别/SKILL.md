---
name: sprite-识别
description: "自主分析精灵图集、贴图集（spritesheet/tileset），识别并分类地块、建筑、道具、角色等内容。Use when analyzing sprite sheets, identifying tiles, classifying terrain vs buildings vs props, cataloging game art assets, or preparing assets for map assembly."
argument-hint: "精灵图集路径或资源目录"
---

# 精灵图集识别与分类

## 目的

让 Agent 能自主打开精灵贴图（PNG spritesheet），通过视觉分析识别其中每个 tile/sprite 的内容，输出结构化的分类索引，供 `map-builder` skill 使用。

## 何时使用

- 新增了贴图资源包，需要建立索引
- 需要知道某张 spritesheet 里有哪些可用素材
- 为地图编辑准备素材清单
- 更新 sprite-atlas.js 或 map-registry.js 的数据

## 资源位置

本项目的贴图资源分布在以下目录：

```
assets/
├── img/
│   ├── terrain/          # SVG 地形（grass, water, tree, rock 等）
│   ├── buildings/        # SVG 建筑（town_hall, barracks 等 13 种）
│   └── sprites/          # 角色动画 + 图标
├── Pixel Crawler - Free Pack/
│   └── Environment/
│       ├── Tilesets/      # ★ 主要贴图集
│       │   ├── Dungeon_Tiles.png
│       │   ├── Floors_Tiles.png
│       │   ├── Wall_Tiles.png / Wall_Variations.png
│       │   └── Water_tiles.png
│       ├── Props/
│       │   ├── Static/   # 静态道具（Farm, Furniture, Rocks, Trees/...）
│       │   └── Animated/  # 动画道具（Pan 系列）
│       └── Structures/
│           ├── Buildings/ # 建筑部件（Floors, Walls, Roofs, Props, Shadows）
│           └── Stations/  # 工作站（Alchemy, Anvil, Bonfire 等）
└── Tiny RPG .../          # 角色精灵（Soldier, Orc 100×100）
```

## 操作步骤

### 1. 查看精灵图

使用 `view_image` 工具打开目标 PNG 文件，直接观察内容。

```
view_image → assets/Pixel Crawler - Free Pack/Environment/Tilesets/Floors_Tiles.png
```

### 2. 分析网格结构

观察图片，确定：
- **Tile 尺寸**：常见 16×16、32×32、48×48
- **列数/行数**：图片宽度 ÷ tile 尺寸
- **是否有间距/边距**

Pixel Crawler 系列的 tile 通常为 **16×16**。

### 3. 分类每个 Tile

为每个可用的 tile 标注类别：

| 类别 | 说明 | 示例 |
|------|------|------|
| `terrain` | 地面/地形 | 草地、泥地、石路、沙地 |
| `water` | 水面 | 河流、湖泊、瀑布 |
| `wall` | 墙壁/围栏 | 石墙、木栅 |
| `floor` | 室内地板 | 木地板、石砖 |
| `building` | 建筑结构 | 屋顶、墙面、门窗 |
| `prop` | 装饰/道具 | 树、岩石、箱子、桌椅 |
| `station` | 功能建筑 | 铁砧、篝火、炉灶 |
| `character` | 角色/NPC | 士兵、兽人、村民 |
| `effect` | 特效 | 火焰、烟雾、光芒 |
| `empty` | 空白/透明 | 跳过 |

### 4. 输出索引文件

生成结构化 JSON 索引，保存到 `js/data/maps/` 或更新 `sprite-atlas.js`：

```javascript
// 贴图集索引示例
var TilesetIndex = {
  "floors": {
    src: "assets/Pixel Crawler - Free Pack/Environment/Tilesets/Floors_Tiles.png",
    tileWidth: 16,
    tileHeight: 16,
    cols: 12,  // 图片列数
    tiles: {
      // id: { row, col, category, label }
      0:  { row: 0, col: 0, category: "floor", label: "木地板-左上" },
      1:  { row: 0, col: 1, category: "floor", label: "木地板-中" },
      // ...
    }
  }
};
```

### 5. 注册到 MapRegistryData

将识别后的贴图集注册到 `js/data/map-registry.js`：

```javascript
MapRegistryData.tilesets["pixel_crawler_floors"] = {
  src: "assets/Pixel Crawler - Free Pack/Environment/Tilesets/Floors_Tiles.png",
  tw: 16, th: 16, cols: 12
};
```

## 输出格式

返回一个结构化的资源清单 markdown 表格 + 可直接使用的 JS 数据对象。

## 注意事项

- 某些 spritesheet 有 **透明间距**，需观察确认
- 同一张图可能包含 **多种类别**（如 Dungeon_Tiles 同时有地板和墙壁）
- 建筑部件 (Buildings/) 分层存放：Floors → Walls → Roofs → Shadows，组装时需叠加
- 优先使用 `view_image` 实际观察，不要凭文件名猜测
- 识别结果保存到 `ai-docs/sprite-asset-catalog.md` 供后续引用
