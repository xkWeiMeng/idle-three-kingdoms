# 地图构建教训

## Tile 选择

- Floors_Tiles.png 使用自动贴图（autotile）布局：大部分 tile 是边缘过渡件（有透明缺口），少数是实心填充 tile
- 实心草地 tile: 277 (r11,c2), 252 (r10,c2), 276 (r11,c1)
- 实心泥路 tile: 262 (r10,c12), 287 (r11,c12)
- 实心石墙 tile (Floors): 66 (r2,c16), 91 (r3,c16) — 温暖灰色砖石
- 选 tile 前必须验证 opaque_count == 256，过渡 tile 通常只有 160-240 像素不透明
- Dungeon_Tiles 整体偏暗，适合地牢场景，不适合户外地图

## 贴图集参数

- Floors_Tiles.png: 400×416, 16px tile, 25 cols × 26 rows
- Dungeon_Tiles.png: 400×400, 16px tile, 25 cols × 25 rows
- Wall_Tiles.png: 400×400, 不是标准 16px 网格（含大型墙壁结构）
- Water_tiles.png: 400×400, 16px tile

## 地图格式

- tile 数据格式: `[tilesetRefIndex, tileId]`，0 表示空
- tileId 编码: row = tileId ÷ cols, col = tileId % cols
- collision 层 data 用 0/1 整数，不是 tile 引用
