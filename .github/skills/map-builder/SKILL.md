---
name: map-builder
description: "自主组装游戏地图：使用已识别的精灵/贴图资源，按照 MapLoader 格式生成地图 JSON 文件，并注册到 MapRegistryData。Use when creating game maps, assembling tilesets into maps, generating map JSON files, building dungeon layouts, designing town maps, or placing buildings and terrain."
argument-hint: "地图名称或设计需求描述"
---

# 自主地图组装

## 目的

让 Agent 能自主利用项目中已有的贴图资源，通过编程方式（而非手动地图编辑器）生成符合 `MapLoader` 格式的地图 JSON 文件。

## 何时使用

- 需要创建新的游戏地图（城镇、副本、野外区域）
- 需要用 Pixel Crawler 等贴图集拼装地图
- 批量生成关卡地图
- 修改/扩展现有地图

## 前置依赖

如果贴图资源尚未建立索引，先使用 `/sprite-识别` skill 分析贴图集。

## 地图 JSON 格式

`MapLoader` 期望的标准格式（参见 [js/core/map-loader.js](js/core/map-loader.js)）：

```json
{
  "width": 30,
  "height": 20,
  "tileWidth": 16,
  "tileHeight": 16,
  "layers": [
    {
      "name": "ground",
      "type": "tile",
      "data": [1, 1, 2, 3, ...]
    },
    {
      "name": "objects",
      "type": "tile",
      "data": [0, 0, 5, 0, ...]
    },
    {
      "name": "collision",
      "type": "collision",
      "data": [0, 0, 1, 0, ...]
    }
  ],
  "tilesetRefs": [
    {
      "id": "pixel_crawler_floors",
      "src": "assets/Pixel Crawler - Free Pack/Environment/Tilesets/Floors_Tiles.png",
      "tw": 16,
      "th": 16,
      "cols": 12
    }
  ],
  "triggers": [
    { "x": 5, "y": 3, "w": 1, "h": 1, "event": "enter_shop" }
  ],
  "spawns": [
    { "x": 2, "y": 10, "type": "player" },
    { "x": 15, "y": 8, "type": "npc", "data": { "id": "merchant_01" } }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `width` / `height` | number | 地图的 tile 格数 |
| `tileWidth` / `tileHeight` | number | 每个 tile 的像素尺寸 |
| `layers[].type` | string | `"tile"` = 渲染层, `"collision"` = 碰撞层 |
| `layers[].data` | number[] | 一维数组, 长度 = width × height, `0` = 空 |
| `tilesetRefs` | array | 引用的贴图集，id 需与 MapRegistryData 一致 |
| `triggers` | array | 触发器（事件入口、传送点等） |
| `spawns` | array | 生成点（玩家、NPC、敌人） |

### Tile ID 编码

Tile ID 非零时表示有效 tile：
- `0` = 空 / 透明
- 正整数 = 贴图集中的 tile 索引（从 1 开始）
- 多贴图集时用偏移区分

## 操作步骤

### 1. 确定地图需求

明确以下参数：
- **地图类型**：城镇 / 副本 / 野外 / 战场
- **尺寸**：推荐城镇 24×24、副本 30×20、野外 40×30
- **主题**：草原、荒漠、深林、地牢
- **功能区域**：入口、NPC 区、战斗区、宝箱点

### 2. 选择贴图集

根据主题选择合适的贴图资源：

| 主题 | 推荐贴图集 |
|------|-----------|
| 地牢/副本 | `Dungeon_Tiles.png` + `Wall_Tiles.png` |
| 室内 | `Floors_Tiles.png` + Buildings/ 部件 |
| 户外 | `assets/img/terrain/*.svg` + `Vegetation.png` |
| 水域 | `Water_tiles.png` |

### 3. 设计布局

用代码生成地图数据：

```javascript
// 生成工具脚本示例
function generateMap(width, height) {
  var ground = [];
  var objects = [];
  var collision = [];
  
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      // 边界 = 墙壁
      if (x === 0 || x === width-1 || y === 0 || y === height-1) {
        ground.push(3);   // 墙壁 tile
        collision.push(1); // 不可通行
      } else {
        ground.push(1);   // 地板 tile
        collision.push(0); // 可通行
      }
      objects.push(0);
    }
  }
  
  return { width, height, tileWidth: 16, tileHeight: 16,
    layers: [
      { name: "ground", type: "tile", data: ground },
      { name: "objects", type: "tile", data: objects },
      { name: "collision", type: "collision", data: collision }
    ],
    tilesetRefs: [{ id: "dungeon_tiles", tw: 16, th: 16, cols: 12 }],
    triggers: [],
    spawns: [{ x: 2, y: 2, type: "player" }]
  };
}
```

### 4. 放置功能对象

在地图中添加：
- **NPC 生成点**：`type: "npc"`
- **敌人生成点**：`type: "enemy"`
- **触发器**：传送门、剧情触发、商店入口
- **装饰物**：在 objects 层放置道具 tile

### 5. 保存并注册

```bash
# 1. 保存地图 JSON
# → js/data/maps/map_xxx.json

# 2. 更新 MapRegistryData (js/data/map-registry.js)
MapRegistryData.tilesets["dungeon_tiles"] = {
  src: "assets/Pixel Crawler - Free Pack/Environment/Tilesets/Dungeon_Tiles.png",
  tw: 16, th: 16, cols: 12
};
MapRegistryData.maps["map_dungeon_01"] = {
  name: "幽暗地牢",
  width: 30, height: 20,
  file: "js/data/maps/map_dungeon_01.json",
  tilesets: ["dungeon_tiles"]
};
```

### 6. 验证（调用 visual-qa）

地图创建后，使用 `@map-qa` agent 或 `/visual-qa` skill 通过 Chrome 打开游戏验收。

## 地图设计原则

1. **边缘封闭**：地图四周必须有碰撞层阻挡
2. **路径连通**：确保玩家出生点到所有目标点有通路
3. **视觉层次**：ground → objects → collision 从下到上叠加
4. **性能**：单张地图不超过 50×50 格，避免过大
5. **可交互**：关键位置添加 trigger 和 spawn

## 输出

- `js/data/maps/map_<id>.json` — 地图数据文件
- 更新 `js/data/map-registry.js` — 注册新地图和贴图集
- 地图截图验证（通过 Chrome MCP）
