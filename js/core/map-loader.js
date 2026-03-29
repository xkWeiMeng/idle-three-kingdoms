/**
 * 地图加载器 — 运行时加载和渲染地图
 * 配合 MapRegistryData 使用
 */
var MapLoader = {
  _cache: {},        // 缓存已加载的地图数据 { mapId: data }
  _tilesetImages: {}, // 缓存贴图集图片 { tilesetId: Image }
  _loading: {},      // 加载中的 Promise

  /**
   * 加载地图数据
   * @param {string} mapId - 地图 ID（需在 MapRegistryData 中注册）
   * @returns {Promise<object>} 地图数据
   */
  loadMap: function(mapId) {
    var self = this;

    // 已缓存
    if (this._cache[mapId]) {
      return Promise.resolve(this._cache[mapId]);
    }

    // 加载中
    if (this._loading[mapId]) {
      return this._loading[mapId];
    }

    var entry = MapRegistryData.maps[mapId];
    if (!entry) {
      return Promise.reject(new Error('地图未注册: ' + mapId));
    }

    this._loading[mapId] = fetch(entry.file)
      .then(function(res) {
        if (!res.ok) throw new Error('加载失败: ' + entry.file);
        return res.json();
      })
      .then(function(data) {
        self._cache[mapId] = data;
        delete self._loading[mapId];
        return self._loadTilesets(data).then(function() {
          return data;
        });
      })
      .catch(function(err) {
        delete self._loading[mapId];
        console.error('[MapLoader] 加载地图失败:', mapId, err);
        throw err;
      });

    return this._loading[mapId];
  },

  /**
   * 加载地图所需的贴图集图片
   */
  _loadTilesets: function(mapData) {
    var self = this;
    var promises = [];

    (mapData.tilesetRefs || []).forEach(function(ref) {
      if (self._tilesetImages[ref.id]) return;

      var tsEntry = MapRegistryData.tilesets[ref.id];
      if (!tsEntry || !tsEntry.src) return;

      var p = new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
          self._tilesetImages[ref.id] = img;
          resolve();
        };
        img.onerror = function() {
          console.warn('[MapLoader] 贴图集加载失败:', ref.id);
          resolve();
        };
        img.src = tsEntry.src;
      });
      promises.push(p);
    });

    return Promise.all(promises);
  },

  /**
   * 渲染地图到 Canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {object} mapData - 地图数据
   * @param {object} camera - 相机 { x, y, zoom }
   * @param {object} viewport - 视口 { width, height }
   * @param {object} [options] - 渲染选项
   */
  renderMap: function(ctx, mapData, camera, viewport, options) {
    options = options || {};
    var showCollision = options.showCollision || false;
    var zoom = camera.zoom || 1;
    var tw = mapData.tileWidth * zoom;
    var th = mapData.tileHeight * zoom;

    ctx.imageSmoothingEnabled = false;

    // 计算可见范围
    var startX = Math.max(0, Math.floor(-camera.x / tw));
    var endX = Math.min(mapData.width, Math.ceil((viewport.width - camera.x) / tw));
    var startY = Math.max(0, Math.floor(-camera.y / th));
    var endY = Math.min(mapData.height, Math.ceil((viewport.height - camera.y) / th));

    // 逐图层渲染
    for (var li = 0; li < mapData.layers.length; li++) {
      var layer = mapData.layers[li];

      if (layer.type === 'collision') {
        if (!showCollision) continue;
        for (var y = startY; y < endY; y++) {
          for (var x = startX; x < endX; x++) {
            if (layer.data[y * mapData.width + x] === 1) {
              ctx.fillStyle = 'rgba(255,0,0,0.3)';
              ctx.fillRect(camera.x + x * tw, camera.y + y * th, tw, th);
            }
          }
        }
        continue;
      }

      // 瓦片层
      for (var y = startY; y < endY; y++) {
        for (var x = startX; x < endX; x++) {
          var tile = layer.data[y * mapData.width + x];
          if (!tile) continue;
          var tsIdx = tile[0];
          var tileId = tile[1];
          var tsRef = (mapData.tilesetRefs || [])[tsIdx];
          if (!tsRef) continue;
          var img = this._tilesetImages[tsRef.id];
          if (!img) continue;
          var sc = tileId % tsRef.cols;
          var sr = Math.floor(tileId / tsRef.cols);
          ctx.drawImage(
            img,
            sc * tsRef.tw, sr * tsRef.th, tsRef.tw, tsRef.th,
            camera.x + x * tw, camera.y + y * th, tw, th
          );
        }
      }
    }
  },

  /**
   * 获取地图在指定坐标的碰撞信息
   * @param {object} mapData - 地图数据
   * @param {number} gx - 网格 X
   * @param {number} gy - 网格 Y
   * @returns {boolean} 是否可通行
   */
  isWalkable: function(mapData, gx, gy) {
    if (gx < 0 || gx >= mapData.width || gy < 0 || gy >= mapData.height) return false;
    for (var i = 0; i < mapData.layers.length; i++) {
      if (mapData.layers[i].type === 'collision') {
        return mapData.layers[i].data[gy * mapData.width + gx] === 0;
      }
    }
    return true;
  },

  /**
   * 获取指定位置的触发器
   * @param {object} mapData
   * @param {number} gx
   * @param {number} gy
   * @returns {object|null} 触发器数据
   */
  getTriggerAt: function(mapData, gx, gy) {
    if (!mapData.triggers) return null;
    for (var i = 0; i < mapData.triggers.length; i++) {
      var t = mapData.triggers[i];
      if (gx >= t.x && gx < t.x + t.w && gy >= t.y && gy < t.y + t.h) {
        return t;
      }
    }
    return null;
  },

  /**
   * 获取指定类型的出生点
   * @param {object} mapData
   * @param {string} type - 出生点类型 (player/npc/enemy)
   * @returns {Array} 出生点列表
   */
  getSpawnsByType: function(mapData, type) {
    if (!mapData.spawns) return [];
    return mapData.spawns.filter(function(s) { return s.type === type; });
  },

  /**
   * 清除缓存
   */
  clearCache: function() {
    this._cache = {};
  }
};
