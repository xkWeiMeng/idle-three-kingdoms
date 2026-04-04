/**
 * 地图注册表 — 管理所有地图的索引和贴图集引用
 * 由地图编辑器 (tools/map-editor.html) 导出生成
 */
var MapRegistryData = {
  // 贴图集资源路径映射
  tilesets: {
    "pixel_crawler_floors": {
      src: "assets/Pixel Crawler - Free Pack/Environment/Tilesets/Floors_Tiles.png",
      tw: 16, th: 16, cols: 25
    },
    "pixel_crawler_dungeon": {
      src: "assets/Pixel Crawler - Free Pack/Environment/Tilesets/Dungeon_Tiles.png",
      tw: 16, th: 16, cols: 25
    }
  },

  // 地图索引
  maps: {
    "map_stage_01": {
      name: "黄巾峡谷",
      width: 24,
      height: 18,
      file: "js/data/maps/map_stage_01.json",
      tilesets: ["pixel_crawler_floors", "pixel_crawler_dungeon"]
    },
    "map_battle_01": {
      name: "草原对阵",
      width: 20,
      height: 12,
      file: "js/data/maps/map_battle_01.json",
      tilesets: ["pixel_crawler_floors"]
    }
  }
};
