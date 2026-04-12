/**
 * 城镇世界引擎 — Canvas 渲染可视化城镇地图
 * CoC 风格：可拖拽平移、点击建筑交互、拖拽建筑移动
 */
var TownWorld = {
  _canvas: null,
  _ctx: null,

  // Grid config
  CELL: 48,
  MAP_W: 40,
  MAP_H: 40,

  // Camera
  _cam: { x: 0, y: 0, zoom: 1 },
  _targetCam: null,

  // Interaction state
  _drag: null,        // {startX, startY, camX, camY} - map panning
  _buildingDrag: null, // {id, startGX, startGY, offsetX, offsetY} - building drag
  _selectedBuilding: null,
  _editMode: false,
  _longPressTimer: null,
  _moveOrigPos: null,  // {gx, gy} - original position before move
  _escHandler: null,   // keydown handler for ESC cancel

  // TD placement mode
  _tdPlacementType: null,
  _tdPlacementGX: -1,
  _tdPlacementGY: -1,

  // Collision grid (true = blocked)
  _collisionGrid: null,

  // Road grid (usage count per cell, 0 = no road)
  _roadGrid: null,
  // Fade-in tracking: map of "gx,gy" → timestamp when road appeared
  _roadFadeStart: {},

  // Images cache
  _images: {},
  _imagesLoading: {},
  _decorations: [],   // random trees, rocks, etc.

  // 山脉背景配置（由 tools/border-editor.html 导出）
  _mountainConfig: [
    { id: 'top_far', image: 'mountain_far', x: -500, y: -1300, w: 2920, h: 1360, rotation: 0, flipX: false, flipY: false },
    { id: 'top_mid', image: 'mountain_mid', x: -602, y: -936, w: 2820, h: 1360, rotation: 0, flipX: false, flipY: false },
    { id: 'top_near', image: 'mountain_near', x: 2028, y: 828, w: 2720, h: 1360, rotation: 0, flipX: false, flipY: false },
    { id: 'bot_far', image: 'mountain_far', x: 512, y: 1780, w: 2920, h: 1360, rotation: -180, flipX: false, flipY: true },
    { id: 'bot_mid', image: 'mountain_mid', x: -1938, y: 1236, w: 2820, h: 1360, rotation: 180, flipX: false, flipY: true },
    { id: 'bot_near', image: 'mountain_near', x: -1032, y: 1780, w: 3500, h: 1750, rotation: 180, flipX: false, flipY: true },
    { id: 'left_far', image: 'mountain_far', x: -632, y: -760, w: 820, h: 1640, rotation: 5, flipX: false, flipY: false },
    { id: 'left_mid', image: 'mountain_mid', x: -1348, y: -966, w: 1690, h: 3514, rotation: 3, flipX: false, flipY: false },
    { id: 'left_near', image: 'mountain_near', x: -1688, y: -36, w: 1820, h: 3955, rotation: 180, flipX: false, flipY: true },
    { id: 'right_far', image: 'mountain_far', x: 2092, y: -1460, w: 1360, h: 2720, rotation: 3, flipX: false, flipY: false },
    { id: 'right_mid', image: 'mountain_mid', x: 2040, y: -678, w: 1260, h: 2620, rotation: -4, flipX: false, flipY: false },
    { id: 'right_near', image: 'mountain_near', x: 1952, y: 640, w: 1160, h: 2520, rotation: 3, flipX: false, flipY: false },
  ],

  // Building grid sizes
  _buildingSizes: {
    town_hall: { w: 3, h: 3 },
    lumber_camp: { w: 2, h: 2 },
    quarry: { w: 2, h: 2 },
    iron_mine: { w: 2, h: 2 },
    farmland: { w: 2, h: 2 },
    barracks: { w: 2, h: 2 },
    training_ground: { w: 3, h: 2 },
    blacksmith: { w: 2, h: 2 },
    city_wall: { w: 3, h: 2 },
    adventure_guild: { w: 2, h: 2 },
    tavern: { w: 2, h: 2 },
    warehouse: { w: 2, h: 2 },
    market: { w: 3, h: 2 },
    tax_office: { w: 2, h: 2 },
    weapon_workshop: { w: 2, h: 2 },
    stable: { w: 2, h: 2 },
    academy: { w: 2, h: 2 },
    watermill: { w: 2, h: 2 },
    stone_mason: { w: 2, h: 2 },
    smelter: { w: 2, h: 2 },
    vegetable_garden: { w: 3, h: 2 },
    compost_pit: { w: 2, h: 2 },
    seed_shop: { w: 2, h: 2 },
    parking_lot: { w: 5, h: 2 }
  },

  // Default positions (when no saved data)
  _defaultPositions: {
    town_hall:        { gx: 14, gy: 14 },
    lumber_camp:      { gx: 8, gy: 9 },
    quarry:           { gx: 21, gy: 8 },
    iron_mine:        { gx: 8, gy: 19 },
    farmland:         { gx: 21, gy: 19 },
    barracks:         { gx: 11, gy: 10 },
    training_ground:  { gx: 18, gy: 10 },
    blacksmith:       { gx: 11, gy: 18 },
    city_wall:        { gx: 14, gy: 7 },
    adventure_guild:  { gx: 7, gy: 14 },
    tavern:           { gx: 22, gy: 14 },
    warehouse:        { gx: 14, gy: 21 },
    market:           { gx: 18, gy: 18 },
    tax_office:       { gx: 22, gy: 18 },
    weapon_workshop:  { gx: 8, gy: 16 },
    stable:           { gx: 22, gy: 11 },
    academy:          { gx: 11, gy: 21 },
    watermill:        { gx: 6, gy: 11 },
    stone_mason:      { gx: 23, gy: 8 },
    smelter:          { gx: 6, gy: 21 },
    vegetable_garden: { gx: 3, gy: 4 },
    compost_pit:      { gx: 6, gy: 4 },
    seed_shop:        { gx: 3, gy: 7 },
    parking_lot:      { gx: 4, gy: 28 }
  },

  init: function () {
    this._canvas = document.getElementById('town-canvas');
    if (!this._canvas) return;
    this._ctx = this._canvas.getContext('2d');

    this._resizeCanvas();
    window.addEventListener('resize', this._resizeCanvas.bind(this));

    this._initInput();
    this._generateDecorations();
    this._preloadImages();

    // Center camera on town hall
    var th = this._getPlacement('town_hall');
    var cx = (th.gx + 1.5) * this.CELL - this._canvas.width / 2;
    var cy = (th.gy + 1.5) * this.CELL - this._canvas.height / 2;
    this._cam.x = cx;
    this._cam.y = cy;

    // Build collision grid
    this.rebuildCollisionGrid();

    // Build road grid from saved data
    this._buildRoadGrid();

    // Start render loop
    this._raf = requestAnimationFrame(this._loop.bind(this));

    // Listen to game events for re-render
    EventBus.on('town:building_upgraded', this._onBuildingChanged.bind(this));
  },

  _resizeCanvas: function () {
    if (!this._canvas) return;
    var container = this._canvas.parentElement;
    this._canvas.width = container.clientWidth;
    this._canvas.height = container.clientHeight;
  },

  // --- Image Loading ---
  _preloadImages: function () {
    var buildingIds = Object.keys(this._buildingSizes);
    for (var i = 0; i < buildingIds.length; i++) {
      this._loadImage('building_' + buildingIds[i], 'assets/img/buildings/' + buildingIds[i] + '.svg');
    }
    var terrains = ['grass', 'tree', 'rock', 'bush', 'flower', 'water', 'path_tile', 'flag', 'lantern'];
    for (var j = 0; j < terrains.length; j++) {
      this._loadImage('terrain_' + terrains[j], 'assets/img/terrain/' + terrains[j] + '.svg');
    }
    // 山脉层
    var mtLayers = ['mountain_far', 'mountain_mid', 'mountain_near'];
    for (var m = 0; m < mtLayers.length; m++) {
      this._loadImage(mtLayers[m], 'assets/img/terrain/' + mtLayers[m] + '.svg');
    }
  },

  _loadImage: function (key, src) {
    if (this._images[key] || this._imagesLoading[key]) return;
    this._imagesLoading[key] = true;
    var img = new Image();
    img.onload = function () {
      this._images[key] = img;
      delete this._imagesLoading[key];
    }.bind(this);
    img.onerror = function () {
      delete this._imagesLoading[key];
    };
    img.src = src;
  },

  // --- Decorations ---
  _generateDecorations: function () {
    this._decorations = [];
    var rand = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };
    // 古松
    for (var i = 0; i < 20; i++) {
      this._decorations.push({
        type: 'tree', gx: rand(0, this.MAP_W - 1), gy: rand(0, this.MAP_H - 1),
        ox: rand(-8, 8), oy: rand(-8, 8), scale: 0.6 + Math.random() * 0.5
      });
    }
    // 竹丛
    for (var k = 0; k < 10; k++) {
      this._decorations.push({
        type: 'bush', gx: rand(0, this.MAP_W - 1), gy: rand(0, this.MAP_H - 1),
        ox: rand(-10, 10), oy: rand(-4, 4), scale: 0.5 + Math.random() * 0.5
      });
    }
    // 太湖石
    for (var j = 0; j < 8; j++) {
      this._decorations.push({
        type: 'rock', gx: rand(0, this.MAP_W - 1), gy: rand(0, this.MAP_H - 1),
        ox: rand(-12, 12), oy: rand(-6, 6), scale: 0.5 + Math.random() * 0.6
      });
    }
    // 桃花
    for (var l = 0; l < 12; l++) {
      this._decorations.push({
        type: 'flower', gx: rand(0, this.MAP_W - 1), gy: rand(0, this.MAP_H - 1),
        ox: rand(-16, 16), oy: rand(-10, 10), scale: 0.8 + Math.random() * 0.4
      });
    }
    // 旌旗
    for (var f = 0; f < 8; f++) {
      this._decorations.push({
        type: 'flag', gx: rand(0, this.MAP_W - 1), gy: rand(0, this.MAP_H - 1),
        ox: rand(-6, 6), oy: rand(-4, 4), scale: 0.7 + Math.random() * 0.4
      });
    }
    // 灯笼
    for (var g = 0; g < 6; g++) {
      this._decorations.push({
        type: 'lantern', gx: rand(0, this.MAP_W - 1), gy: rand(0, this.MAP_H - 1),
        ox: rand(-8, 8), oy: rand(-6, 6), scale: 0.6 + Math.random() * 0.4
      });
    }
    // Filter decorations that overlap with buildings
    this._filterDecorations();
  },

  _filterDecorations: function () {
    var self = this;
    this._decorations = this._decorations.filter(function (d) {
      // Filter decorations on road cells
      if (self._roadGrid && self._roadGrid[d.gy] && self._roadGrid[d.gy][d.gx] > 0) {
        return false;
      }
      var buildingIds = Object.keys(self._buildingSizes);
      for (var i = 0; i < buildingIds.length; i++) {
        var p = self._getPlacement(buildingIds[i]);
        var s = self._buildingSizes[buildingIds[i]];
        if (d.gx >= p.gx - 1 && d.gx <= p.gx + s.w && d.gy >= p.gy - 1 && d.gy <= p.gy + s.h) {
          return false;
        }
      }
      return true;
    });
  },

  // --- Placement Data ---
  _getPlacement: function (buildingId) {
    if (typeof TownManager !== 'undefined' && TownManager._state && TownManager._state.placements
        && TownManager._state.placements[buildingId]) {
      return TownManager._state.placements[buildingId];
    }
    return this._defaultPositions[buildingId] || { gx: 0, gy: 0 };
  },

  _setPlacement: function (buildingId, gx, gy) {
    if (typeof TownManager !== 'undefined' && TownManager._state) {
      if (!TownManager._state.placements) TownManager._state.placements = {};
      TownManager._state.placements[buildingId] = { gx: gx, gy: gy };
    }
    this.rebuildCollisionGrid();
  },

  // --- Collision Grid ---
  rebuildCollisionGrid: function () {
    var grid = [];
    for (var y = 0; y < this.MAP_H; y++) {
      grid[y] = [];
      for (var x = 0; x < this.MAP_W; x++) {
        grid[y][x] = false;
      }
    }
    var buildingIds = Object.keys(this._buildingSizes);
    for (var i = 0; i < buildingIds.length; i++) {
      var id = buildingIds[i];
      var bState = this._getBuildingState(id);
      if (!bState || bState.level <= 0) continue;
      var p = this._getPlacement(id);
      var s = this._buildingSizes[id];
      for (var gy = p.gy; gy < p.gy + s.h && gy < this.MAP_H; gy++) {
        for (var gx = p.gx; gx < p.gx + s.w && gx < this.MAP_W; gx++) {
          if (gy >= 0 && gx >= 0) grid[gy][gx] = true;
        }
      }
    }
    // Include TD towers in collision grid
    if (typeof TowerDefenseManager !== 'undefined') {
      var tdState = TowerDefenseManager.getState();
      if (tdState && tdState.towers) {
        for (var tdi = 0; tdi < tdState.towers.length; tdi++) {
          var tdt = tdState.towers[tdi];
          var tdSize = typeof TDGetTowerSize !== 'undefined' ? TDGetTowerSize(tdt.type) : { w: 1, h: 1 };
          for (var tdy = 0; tdy < tdSize.h; tdy++) {
            for (var tdx = 0; tdx < tdSize.w; tdx++) {
              var tgx = tdt.gridX + tdx;
              var tgy = tdt.gridY + tdy;
              if (tgy >= 0 && tgy < this.MAP_H && tgx >= 0 && tgx < this.MAP_W) {
                grid[tgy][tgx] = true;
              }
            }
          }
        }
      }
    }
    // Include pending TD builds in collision grid
    if (typeof TownManager !== 'undefined' && TownManager.getTDBuildPending) {
      var tdPending = TownManager.getTDBuildPending();
      for (var tpi = 0; tpi < tdPending.length; tpi++) {
        var tpItem = tdPending[tpi];
        var tpSize = typeof TDGetTowerSize !== 'undefined' ? TDGetTowerSize(tpItem.tdType) : { w: 1, h: 1 };
        for (var tpy = 0; tpy < tpSize.h; tpy++) {
          for (var tpx = 0; tpx < tpSize.w; tpx++) {
            var tpgx = tpItem.gridX + tpx;
            var tpgy = tpItem.gridY + tpy;
            if (tpgy >= 0 && tpgy < this.MAP_H && tpgx >= 0 && tpgx < this.MAP_W) {
              grid[tpgy][tpgx] = true;
            }
          }
        }
      }
    }
    this._collisionGrid = grid;
  },

  getCollisionGrid: function () {
    if (!this._collisionGrid) this.rebuildCollisionGrid();
    var src = this._collisionGrid;
    var copy = [];
    for (var y = 0; y < this.MAP_H; y++) {
      copy[y] = [];
      for (var x = 0; x < this.MAP_W; x++) {
        copy[y][x] = src[y][x] ? 1 : 0;
      }
    }
    return copy;
  },

  isWalkable: function (gx, gy) {
    if (gx < 0 || gy < 0 || gx >= this.MAP_W || gy >= this.MAP_H) return false;
    if (!this._collisionGrid) return true;
    return !this._collisionGrid[gy][gx];
  },

  isPixelWalkable: function (px, py) {
    var gx = Math.floor(px / this.CELL);
    var gy = Math.floor(py / this.CELL);
    return this.isWalkable(gx, gy);
  },

  /** Build _roadGrid from TownManager._state.roads */
  _buildRoadGrid: function () {
    var grid = [];
    for (var y = 0; y < this.MAP_H; y++) {
      grid[y] = [];
      for (var x = 0; x < this.MAP_W; x++) {
        grid[y][x] = 0;
      }
    }

    if (typeof TownManager === 'undefined' || !TownManager._state.roads) {
      this._roadGrid = grid;
      return;
    }

    var roads = TownManager._state.roads;
    var now = performance.now();
    var oldGrid = this._roadGrid;

    for (var i = 0; i < roads.length; i++) {
      var r = roads[i];
      if (r.gy >= 0 && r.gy < this.MAP_H && r.gx >= 0 && r.gx < this.MAP_W) {
        grid[r.gy][r.gx] = r.usage;
        // Track fade-in for new road cells
        var key = r.gx + ',' + r.gy;
        if (!oldGrid || oldGrid[r.gy][r.gx] === 0) {
          if (!this._roadFadeStart[key]) {
            this._roadFadeStart[key] = now;
          }
        }
      }
    }

    // Clean up fade entries for cells no longer roads
    for (var fk in this._roadFadeStart) {
      if (this._roadFadeStart.hasOwnProperty(fk)) {
        var parts = fk.split(',');
        var fx = parseInt(parts[0], 10);
        var fy = parseInt(parts[1], 10);
        if (grid[fy][fx] === 0) {
          delete this._roadFadeStart[fk];
        }
      }
    }

    this._roadGrid = grid;
    // Re-filter decorations to remove those on roads
    this._filterDecorations();
  },

  /** Check if a grid cell is a road */
  isRoad: function (gx, gy) {
    if (!this._roadGrid || gx < 0 || gy < 0 || gx >= this.MAP_W || gy >= this.MAP_H) return false;
    return this._roadGrid[gy][gx] > 0;
  },

  /** Get road usage count at a grid cell */
  getRoadUsage: function (gx, gy) {
    if (!this._roadGrid || gx < 0 || gy < 0 || gx >= this.MAP_W || gy >= this.MAP_H) return 0;
    return this._roadGrid[gy][gx];
  },

  // --- Input Handling ---
  _initInput: function () {
    var canvas = this._canvas;

    // Touch events
    canvas.addEventListener('touchstart', this._onPointerDown.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this._onPointerMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this._onPointerUp.bind(this), { passive: false });
    canvas.addEventListener('touchcancel', this._onPointerUp.bind(this), { passive: false });

    // Mouse events
    canvas.addEventListener('mousedown', this._onPointerDown.bind(this));
    canvas.addEventListener('mousemove', this._onPointerMove.bind(this));
    canvas.addEventListener('mouseup', this._onPointerUp.bind(this));
    canvas.addEventListener('mouseleave', this._onPointerUp.bind(this));

    // Wheel zoom
    canvas.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
  },

  _getPointerPos: function (e) {
    if (e.touches && e.touches.length > 0) {
      var rect = this._canvas.getBoundingClientRect();
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.offsetX, y: e.offsetY };
  },

  _screenToWorld: function (sx, sy) {
    return {
      x: sx / this._cam.zoom + this._cam.x,
      y: sy / this._cam.zoom + this._cam.y
    };
  },

  _worldToGrid: function (wx, wy) {
    return {
      gx: Math.floor(wx / this.CELL),
      gy: Math.floor(wy / this.CELL)
    };
  },

  _hitTestBuilding: function (wx, wy) {
    var buildingIds = Object.keys(this._buildingSizes);
    // Check in reverse so top-rendered buildings are checked first
    // First pass: built buildings
    for (var i = buildingIds.length - 1; i >= 0; i--) {
      var id = buildingIds[i];
      var bState = this._getBuildingState(id);
      if (!bState || bState.level <= 0) continue;

      var p = this._getPlacement(id);
      var s = this._buildingSizes[id];
      var bx = p.gx * this.CELL;
      var by = p.gy * this.CELL;
      var bw = s.w * this.CELL;
      var bh = s.h * this.CELL;

      if (wx >= bx && wx <= bx + bw && wy >= by && wy <= by + bh) {
        return id;
      }
    }
    // Second pass: unbuilt buildings (clickable ghost outlines)
    for (var j = buildingIds.length - 1; j >= 0; j--) {
      var id2 = buildingIds[j];
      var bState2 = this._getBuildingState(id2);
      if (bState2 && bState2.level > 0) continue;
      // Only show unbuilt if within unlock count
      if (typeof TownManager !== 'undefined') {
        var thLv = TownManager.getBuildingLevel('town_hall');
        var thData = BuildingData._townHallUnlocks[thLv];
        var data = BuildingData[id2];
        if (data && thData && data.unlockOrder >= thData.slots) continue;
      }

      var p2 = this._getPlacement(id2);
      var s2 = this._buildingSizes[id2];
      var bx2 = p2.gx * this.CELL;
      var by2 = p2.gy * this.CELL;
      var bw2 = s2.w * this.CELL;
      var bh2 = s2.h * this.CELL;

      if (wx >= bx2 && wx <= bx2 + bw2 && wy >= by2 && wy <= by2 + bh2) {
        return id2;
      }
    }
    return null;
  },

  _getBuildingState: function (id) {
    if (typeof TownManager !== 'undefined' && TownManager._state && TownManager._state.buildings) {
      return TownManager._state.buildings[id];
    }
    return null;
  },

  // ========== TD Placement ==========

  startTDPlacement: function (typeId) {
    this._tdPlacementType = typeId;
    this._tdPlacementGX = -1;
    this._tdPlacementGY = -1;
    this._editMode = true;
    EventBus.emit('toast:show', { type: 'info', message: '点击地图选择放置位置，再次点击确认' });
  },

  cancelTDPlacement: function () {
    this._tdPlacementType = null;
    this._tdPlacementGX = -1;
    this._tdPlacementGY = -1;
    this._editMode = false;
  },

  _confirmTDPlacement: function () {
    if (!this._tdPlacementType) return;
    var typeId = this._tdPlacementType;
    var gx = this._tdPlacementGX;
    var gy = this._tdPlacementGY;

    if (typeof TowerDefenseManager !== 'undefined') {
      var check = TowerDefenseManager.canBuildTower(typeId, gx, gy);
      if (!check.ok) {
        EventBus.emit('toast:show', { type: 'warning', message: check.reason });
        return;
      }
    }

    if (typeof TownManager !== 'undefined' && TownManager.enqueueTDBuilding) {
      var result = TownManager.enqueueTDBuilding(typeId, gx, gy);
      if (result.ok) {
        var tdData = typeof TDTowerData !== 'undefined' ? TDTowerData[typeId] : null;
        EventBus.emit('toast:show', { type: 'success', message: '🔨 开始建造 ' + (tdData ? tdData.name : typeId) + '！' });
      } else {
        EventBus.emit('toast:show', { type: 'warning', message: result.reason });
        return;
      }
    }

    this.cancelTDPlacement();
  },

  _onPointerDown: function (e) {
    e.preventDefault();
    var pos = this._getPointerPos(e);
    var world = this._screenToWorld(pos.x, pos.y);
    var hit = this._hitTestBuilding(world.x, world.y);

    // 检测角色点击
    var charHit = (typeof TownCharacters !== 'undefined')
      ? TownCharacters.hitTest(world.x, world.y)
      : null;

    if (this._editMode && hit) {
      // Start building drag
      var p = this._getPlacement(hit);
      this._buildingDrag = {
        id: hit,
        startGX: p.gx,
        startGY: p.gy,
        offsetX: world.x - p.gx * this.CELL,
        offsetY: world.y - p.gy * this.CELL,
        moved: false
      };
      this._selectedBuilding = hit;
      return;
    }

    // Map drag
    this._drag = { startX: pos.x, startY: pos.y, camX: this._cam.x, camY: this._cam.y, moved: false };

    // Long-press detection: character takes priority over building
    var self = this;
    this._longPressTimer = setTimeout(function () {
      if (self._drag && self._drag.moved) return;

      // 优先长按角色 → 拖拽角色
      if (charHit && typeof TownCharacters !== 'undefined') {
        TownCharacters.startDrag(charHit, world.x, world.y);
        self._drag = null;
        return;
      }

      // 其次长按建筑 → 编辑模式
      if (hit) {
        self._editMode = true;
        self._selectedBuilding = hit;
        var p = self._getPlacement(hit);
        self._buildingDrag = {
          id: hit,
          startGX: p.gx,
          startGY: p.gy,
          offsetX: world.x - p.gx * self.CELL,
          offsetY: world.y - p.gy * self.CELL,
          moved: false
        };
        self._drag = null;
      }
    }, 500);
  },

  _onPointerMove: function (e) {
    e.preventDefault();
    var pos = this._getPointerPos(e);

    // 角色拖拽
    if (typeof TownCharacters !== 'undefined' && TownCharacters.isDragging()) {
      var world = this._screenToWorld(pos.x, pos.y);
      TownCharacters.moveDrag(world.x, world.y);
      return;
    }

    if (this._buildingDrag) {
      var world = this._screenToWorld(pos.x, pos.y);
      var newGX = Math.round((world.x - this._buildingDrag.offsetX) / this.CELL);
      var newGY = Math.round((world.y - this._buildingDrag.offsetY) / this.CELL);
      var s = this._buildingSizes[this._buildingDrag.id];
      newGX = Math.max(0, Math.min(this.MAP_W - s.w, newGX));
      newGY = Math.max(0, Math.min(this.MAP_H - s.h, newGY));
      this._setPlacement(this._buildingDrag.id, newGX, newGY);
      this._buildingDrag.moved = true;
      return;
    }

    if (this._drag) {
      var dx = pos.x - this._drag.startX;
      var dy = pos.y - this._drag.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        this._drag.moved = true;
        if (this._longPressTimer) {
          clearTimeout(this._longPressTimer);
          this._longPressTimer = null;
        }
      }
      this._cam.x = this._drag.camX - dx / this._cam.zoom;
      this._cam.y = this._drag.camY - dy / this._cam.zoom;
      this._clampCamera();
    }
  },

  _onPointerUp: function (e) {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }

    // 角色拖拽释放
    if (typeof TownCharacters !== 'undefined' && TownCharacters.isDragging()) {
      TownCharacters.endDrag();
      this._drag = null;
      return;
    }

    if (this._buildingDrag) {
      if (this._buildingDrag.moved) {
        // Validate placement
        var p = this._getPlacement(this._buildingDrag.id);
        if (this._checkPlacementValid(this._buildingDrag.id, p.gx, p.gy)) {
          this._confirmMove();
        } else {
          EventBus.emit('toast:show', { type: 'warning', message: '此位置无法放置' });
          this._setPlacement(this._buildingDrag.id, this._buildingDrag.startGX, this._buildingDrag.startGY);
        }
      } else {
        // Tap on building in edit mode → show details
        this._showBuildingDetail(this._buildingDrag.id);
        this._finishMove();
      }
      this._buildingDrag = null;
      return;
    }

    if (this._drag && !this._drag.moved) {
      // Tap — check if hit a character first, then building
      var pos = this._getPointerPos(e);
      if (pos.x === undefined) {
        pos = { x: this._drag.startX, y: this._drag.startY };
      }
      var world = this._screenToWorld(pos.x, pos.y);

      // TD placement mode
      if (this._tdPlacementType) {
        var tdGrid = this._worldToGrid(world.x, world.y);
        if (this._tdPlacementGX === tdGrid.gx && this._tdPlacementGY === tdGrid.gy) {
          this._confirmTDPlacement();
        } else {
          this._tdPlacementGX = tdGrid.gx;
          this._tdPlacementGY = tdGrid.gy;
        }
        this._drag = null;
        return;
      }

      // 优先检测角色点击
      var charHit = (typeof TownCharacters !== 'undefined')
        ? TownCharacters.hitTest(world.x, world.y)
        : null;
      if (charHit) {
        TownCharacters.handleTap(charHit);
        this._selectedBuilding = null;
      } else {
        var hit = this._hitTestBuilding(world.x, world.y);
        if (hit) {
          this._selectedBuilding = hit;
          this._showBuildingDetail(hit);
        } else {
          // Check TD building click
          var tdClicked = false;
          if (typeof TowerDefenseManager !== 'undefined') {
            var tdState2 = TowerDefenseManager.getState();
            var tg = this._worldToGrid(world.x, world.y);
            if (tdState2 && tdState2.towers) {
              for (var tci = tdState2.towers.length - 1; tci >= 0; tci--) {
                var tct = tdState2.towers[tci];
                var tcSize = typeof TDGetTowerSize !== 'undefined' ? TDGetTowerSize(tct.type) : { w: 1, h: 1 };
                if (tg.gx >= tct.gridX && tg.gx < tct.gridX + tcSize.w && tg.gy >= tct.gridY && tg.gy < tct.gridY + tcSize.h) {
                  if (typeof BuildMenu !== 'undefined') BuildMenu._showTDTowerInfo(tct);
                  tdClicked = true;
                  break;
                }
              }
            }
          }
          if (!tdClicked) {
            this._selectedBuilding = null;
            if (typeof OverlayPanel !== 'undefined') {
              OverlayPanel.close();
            }
          }
        }
      }
    }
    this._drag = null;
  },

  _onWheel: function (e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    var newZoom = Math.max(0.5, Math.min(2.0, this._cam.zoom * delta));
    this._cam.zoom = newZoom;
    this._clampCamera();
  },

  _clampCamera: function () {
    var mapPx = this.MAP_W * this.CELL;
    var mapPy = this.MAP_H * this.CELL;
    var vw = this._canvas.width / this._cam.zoom;
    var vh = this._canvas.height / this._cam.zoom;
    this._cam.x = Math.max(-vw * 0.3, Math.min(mapPx - vw * 0.7, this._cam.x));
    this._cam.y = Math.max(-vh * 0.3, Math.min(mapPy - vh * 0.7, this._cam.y));
  },

  // --- Building Detail ---
  _showBuildingDetail: function (buildingId) {
    // 菜园相关建筑直接打开菜园面板
    if (buildingId === 'vegetable_garden' || buildingId === 'seed_shop' || buildingId === 'compost_pit') {
      if (typeof FarmPanel !== 'undefined') {
        if (buildingId === 'vegetable_garden') FarmPanel._activeTab = 'plant';
        else if (buildingId === 'seed_shop') FarmPanel._activeTab = 'bag';
        else if (buildingId === 'compost_pit') FarmPanel._activeTab = 'bag';
        FarmPanel.show();
        return;
      }
    }

    var def = typeof BuildingData !== 'undefined' ? BuildingData[buildingId] : null;
    if (!def) return;

    var bState = this._getBuildingState(buildingId);
    var level = bState ? bState.level : 0;
    var isBuilding = bState && bState.buildEndTime && bState.buildEndTime > Date.now();
    var check = typeof TownManager !== 'undefined' ? TownManager.canUpgrade(buildingId) : { ok: false, reason: '' };

    var content = '<div class="bdo">';

    // --- Header ---
    content += '<div class="bdo-header">';
    content += '<img src="assets/img/buildings/' + buildingId + '.svg" class="bdo-icon" onerror="this.style.display=\'none\'" alt=""/>';
    content += '<div class="bdo-info">';
    content += '<h3>' + def.emoji + ' ' + def.name + '</h3>';
    if (level > 0) {
      content += '<span class="bdo-level-badge">Lv.' + level + '</span>';
    } else {
      content += '<span class="bdo-level-badge bdo-unbuilt">未建造</span>';
    }
    content += '</div></div>';
    content += '<p class="bdo-desc">' + def.description + '</p>';

    // --- Construction in progress ---
    if (isBuilding) {
      var progress = typeof TownManager !== 'undefined' ? TownManager.getBuildingProgress(buildingId) : 0.5;
      var remaining = typeof TownManager !== 'undefined' ? TownManager.getRemainingBuildTime(buildingId) : 0;
      var jadeCost = Math.ceil(remaining / 60);
      content += '<div class="bdo-construction">';
      content += '<div class="bdo-construct-label">🔨 施工中...</div>';
      content += '<div class="bdo-progress-bar"><div class="bdo-progress-fill" style="width:' + Math.round((progress || 0) * 100) + '%"></div></div>';
      content += '<div class="bdo-construct-time">⏱ ' + this._formatTime(remaining) + '</div>';
      content += '<button class="btn btn-small bdo-speed-btn" onclick="TownWorld._doSpeedUp(\'' + buildingId + '\')">💎 加速完成 (需' + jadeCost + '玉璧)</button>';
      content += '</div>';
    }

    // --- Current effects ---
    if (level > 0) {
      var curEffects = this._getEffectsForLevel(def, buildingId, level);
      if (curEffects.length > 0) {
        content += '<div class="bdo-section">';
        content += '<div class="bdo-section-title">📊 当前效果</div>';
        content += '<ul class="bdo-effect-list">';
        for (var i = 0; i < curEffects.length; i++) {
          content += '<li>' + curEffects[i] + '</li>';
        }
        content += '</ul></div>';
      }
    }

    // --- Upgrade preview / Build preview ---
    if (!isBuilding && level < def.maxLevel) {
      var nextLevel = level + 1;
      var cost = typeof TownManager !== 'undefined' ? TownManager.getUpgradeCost(buildingId) : (def.costFormula ? def.costFormula(nextLevel) : {});
      var buildTimeSec = typeof TownManager !== 'undefined' ? TownManager.getBuildTime(buildingId) : BuildingData._getBuildTime(nextLevel);

      content += '<div class="bdo-section bdo-upgrade-section">';
      if (level === 0) {
        content += '<div class="bdo-section-title">📋 建成后效果 (Lv.1)</div>';
        var newEffects = this._getEffectsForLevel(def, buildingId, 1);
        if (newEffects.length > 0) {
          content += '<ul class="bdo-effect-list">';
          for (var n = 0; n < newEffects.length; n++) {
            content += '<li class="bdo-eff-new">' + newEffects[n] + '</li>';
          }
          content += '</ul>';
        }
      } else {
        content += '<div class="bdo-section-title">⬆️ 升级预览  Lv.' + level + ' → Lv.' + nextLevel + '</div>';
        content += this._renderUpgradeComparison(def, buildingId, level, nextLevel);
      }

      // Cost display
      content += '<div class="bdo-cost-row">';
      var res = typeof ResourceManager !== 'undefined' ? ResourceManager : null;
      var E = (typeof CONSTANTS !== 'undefined' && CONSTANTS.RESOURCE_EMOJI) || { gold: '💰', wood: '🪵', stone: '🪨', iron: '⛏️' };
      if (cost) {
        var resTypes = ['gold', 'wood', 'stone', 'iron'];
        for (var ci = 0; ci < resTypes.length; ci++) {
          var rType = resTypes[ci];
          if (cost[rType]) {
            var have = res ? res.get(rType) : 0;
            var enough = have >= cost[rType];
            content += '<span class="bdo-cost-item' + (enough ? '' : ' bdo-cost-lack') + '">';
            content += (E[rType] || '') + Utils.formatNumber(cost[rType]);
            content += '</span>';
          }
        }
      }
      content += '</div>';

      // Build time
      content += '<div class="bdo-build-time">⏱ 施工时间: ' + this._formatTime(buildTimeSec) + '</div>';

      // Upgrade button
      var btnText = level === 0 ? '🏗️ 建造' : '🔨 升级到 Lv.' + nextLevel;
      var btnDisabled = !check.ok;
      var btnClass = btnDisabled ? 'btn bdo-upgrade-btn disabled' : 'btn bdo-upgrade-btn';
      content += '<button class="' + btnClass + '" onclick="TownWorld._doUpgrade(\'' + buildingId + '\')"' + (btnDisabled ? ' disabled' : '') + '>' + btnText + '</button>';

      // Disabled reason
      if (btnDisabled && check.reason) {
        content += '<div class="bdo-lock-reason">❌ ' + check.reason + '</div>';
      }

      // Prerequisites display
      content += this._renderPrerequisites(def, buildingId);
      content += '</div>';

    } else if (level >= def.maxLevel) {
      content += '<div class="bdo-section bdo-maxed"><span>⭐ 已达最高等级 (Lv.' + def.maxLevel + ')</span></div>';
    }

    // --- Bottom actions ---
    content += '<div class="bdo-actions">';
    if (level > 0) {
      content += '<button class="btn btn-small btn-outline bdo-action-btn" onclick="TownWorld._startMoveBuilding(\'' + buildingId + '\')">📐 移动</button>';
    }
    content += '<button class="btn btn-small btn-outline bdo-action-btn" onclick="TownWorld._showAllLevels(\'' + buildingId + '\')">🔍 全等级一览</button>';
    content += '</div>';

    content += '</div>';

    if (typeof OverlayPanel !== 'undefined') {
      OverlayPanel.show({
        title: def.emoji + ' ' + def.name,
        content: content,
        panelId: 'building-detail',
        height: 'auto'
      });
    }
    EventBus.emit('town:building_selected', { buildingId: buildingId });
  },

  _renderUpgradeComparison: function (def, buildingId, curLv, nextLv) {
    var curEffects = this._getEffectValues(def, buildingId, curLv);
    var nextEffects = this._getEffectValues(def, buildingId, nextLv);
    if (curEffects.length === 0) return '';

    var html = '<div class="bdo-compare">';
    html += '<div class="bdo-compare-header"><span>当前 Lv.' + curLv + '</span><span>升级后 Lv.' + nextLv + '</span></div>';
    for (var i = 0; i < curEffects.length; i++) {
      var cur = curEffects[i];
      var nxt = nextEffects[i] || cur;
      html += '<div class="bdo-compare-row">';
      html += '<span class="bdo-compare-label">' + cur.label + '</span>';
      html += '<span class="bdo-compare-cur">' + cur.display + '</span>';
      html += '<span class="bdo-compare-arrow">→</span>';
      html += '<span class="bdo-compare-next">' + nxt.display + '</span>';
      if (nxt.raw !== cur.raw) {
        var diff = nxt.raw - cur.raw;
        var diffStr = cur.isPercent ? '+' + Math.round(diff * 100) + '%' : '+' + (Math.round(diff * 10) / 10);
        html += '<span class="bdo-compare-diff">' + diffStr + '</span>';
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  },

  _getEffectValues: function (def, buildingId, level) {
    var results = [];
    if (def.production) {
      var prod = def.production(level);
      var rate = prod.perMinute;
      var boosterLv = typeof TownManager !== 'undefined' ? TownManager.getBoosterLevel(buildingId) : 0;
      var boostMult = 1 + boosterLv * 0.05;
      var emoji = (typeof CONSTANTS !== 'undefined' && CONSTANTS.RESOURCE_EMOJI) ? (CONSTANTS.RESOURCE_EMOJI[prod.resource] || '') : '';
      results.push({
        label: emoji + ' 产出/分钟',
        raw: rate * boostMult,
        display: (rate * boostMult).toFixed(1),
        isPercent: false
      });
    }
    if (def.effects) {
      var fx = def.effects(level);
      var labelMap = this._effectLabelMap();
      for (var key in fx) {
        if (!fx.hasOwnProperty(key)) continue;
        var val = fx[key];
        if (typeof val === 'boolean' || typeof val === 'object') continue;
        var lbl = labelMap[key] || key;
        var isPct = typeof val === 'number' && Math.abs(val) <= 10 && key.indexOf('Bonus') !== -1 || key.indexOf('Discount') !== -1 || key.indexOf('Efficiency') !== -1 || key.indexOf('Chance') !== -1 || key.indexOf('Reduction') !== -1 || key.indexOf('boost') !== -1;
        results.push({
          label: lbl,
          raw: val,
          display: isPct ? Math.round(val * 100) + '%' : (typeof val === 'number' ? (Math.round(val * 10) / 10) : val),
          isPercent: isPct
        });
      }
    }
    return results;
  },

  _getEffectsForLevel: function (def, buildingId, level) {
    var lines = [];
    if (def.production) {
      var prod = def.production(level);
      var rate = prod.perMinute;
      var boosterLv = typeof TownManager !== 'undefined' ? TownManager.getBoosterLevel(buildingId) : 0;
      var boostMult = 1 + boosterLv * 0.05;
      var emoji = (typeof CONSTANTS !== 'undefined' && CONSTANTS.RESOURCE_EMOJI) ? (CONSTANTS.RESOURCE_EMOJI[prod.resource] || '') : '';
      var line = emoji + ' +' + (rate * boostMult).toFixed(1) + '/分钟';
      if (boosterLv > 0) line += ' (含加成 ×' + boostMult.toFixed(2) + ')';
      lines.push(line);
    }
    if (def.boosts) {
      var fx = def.effects(level);
      lines.push('⬆ ' + (fx.boostTarget || '') + ' 产出 +' + Math.round((fx.productionBoost || 0) * 100) + '%');
    }
    if (def.effects && !def.boosts) {
      var fx2 = def.effects(level);
      var labelMap = this._effectLabelMap();
      for (var key in fx2) {
        if (!fx2.hasOwnProperty(key)) continue;
        var val = fx2[key];
        if (typeof val === 'boolean' || typeof val === 'object') continue;
        var lbl = labelMap[key] || key;
        var isPct = typeof val === 'number' && Math.abs(val) <= 10 && (key.indexOf('Bonus') !== -1 || key.indexOf('Discount') !== -1 || key.indexOf('Efficiency') !== -1 || key.indexOf('Chance') !== -1 || key.indexOf('Reduction') !== -1);
        if (isPct) {
          lines.push(lbl + ' ' + Math.round(val * 100) + '%');
        } else {
          lines.push(lbl + ' ' + (typeof val === 'number' ? (Math.round(val * 10) / 10) : val));
        }
      }
    }
    return lines;
  },

  _renderPrerequisites: function (def, buildingId) {
    var html = '';
    var prereqs = [];
    // Town hall level cap
    if (buildingId !== 'town_hall' && typeof TownManager !== 'undefined') {
      var thLv = TownManager.getBuildingLevel('town_hall');
      var thData = BuildingData._townHallUnlocks[thLv];
      var curLv = TownManager.getBuildingLevel(buildingId);
      if (thData) {
        var met = curLv < thData.levelCap;
        prereqs.push({ text: '城主府等级上限 Lv.' + thData.levelCap, ok: met });
      }
    }
    // Building prerequisites
    if (def.requires) {
      for (var reqId in def.requires) {
        if (!def.requires.hasOwnProperty(reqId)) continue;
        var reqLv = def.requires[reqId];
        var reqDef = BuildingData[reqId];
        var haveLv = typeof TownManager !== 'undefined' ? TownManager.getBuildingLevel(reqId) : 0;
        prereqs.push({
          text: (reqDef ? reqDef.name : reqId) + ' ≥ Lv.' + reqLv,
          ok: haveLv >= reqLv
        });
      }
    }
    if (prereqs.length > 0) {
      html += '<div class="bdo-prereqs">';
      for (var p = 0; p < prereqs.length; p++) {
        html += '<div class="bdo-prereq-item ' + (prereqs[p].ok ? 'bdo-prereq-ok' : 'bdo-prereq-fail') + '">';
        html += (prereqs[p].ok ? '✅' : '❌') + ' ' + prereqs[p].text;
        html += '</div>';
      }
      html += '</div>';
    }
    return html;
  },

  _showAllLevels: function (buildingId) {
    var def = typeof BuildingData !== 'undefined' ? BuildingData[buildingId] : null;
    if (!def) return;
    var curLv = typeof TownManager !== 'undefined' ? TownManager.getBuildingLevel(buildingId) : 0;

    var html = '<div class="bdo-all-levels">';
    html += '<table class="bdo-levels-table"><thead><tr>';
    html += '<th>Lv.</th><th>效果</th><th>升级费用</th><th>施工</th>';
    html += '</tr></thead><tbody>';

    for (var lv = 1; lv <= Math.min(def.maxLevel, 25); lv++) {
      var rowClass = lv === curLv ? ' class="bdo-lv-current"' : (lv === curLv + 1 ? ' class="bdo-lv-next"' : '');
      html += '<tr' + rowClass + '>';
      html += '<td>' + lv + (lv === curLv ? ' ★' : '') + '</td>';

      // Effect
      var effs = this._getEffectsForLevel(def, buildingId, lv);
      html += '<td>' + (effs.length > 0 ? effs.join('<br>') : '-') + '</td>';

      // Cost
      var cost = def.costFormula ? def.costFormula(lv) : {};
      var costParts = [];
      if (cost.gold) costParts.push('💰' + Utils.formatNumber(cost.gold));
      if (cost.wood) costParts.push('🪵' + Utils.formatNumber(cost.wood));
      if (cost.stone) costParts.push('🪨' + Utils.formatNumber(cost.stone));
      if (cost.iron) costParts.push('⛏️' + Utils.formatNumber(cost.iron));
      html += '<td class="bdo-lv-cost">' + costParts.join(' ') + '</td>';

      // Build time
      html += '<td>' + this._formatTime(BuildingData._getBuildTime(lv)) + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table></div>';

    if (typeof OverlayPanel !== 'undefined') {
      OverlayPanel.show({
        title: def.emoji + ' ' + def.name + ' — 全等级效果',
        content: html,
        panelId: 'building-all-levels',
        height: 'full'
      });
    }
  },

  _doUpgrade: function (buildingId) {
    if (typeof TownManager !== 'undefined') {
      var result = TownManager.enqueueUpgrade(buildingId);
      if (result.ok) {
        if (typeof OverlayPanel !== 'undefined') OverlayPanel.close();
        var def = BuildingData[buildingId];
        EventBus.emit('toast:show', { type: 'success', message: '🔨 ' + (def ? def.name : '') + ' 开始建造！' });
      } else {
        EventBus.emit('toast:show', { type: 'warning', message: result.reason });
      }
    }
  },

  _doSpeedUp: function (buildingId) {
    if (typeof TownManager !== 'undefined') {
      if (TownManager.speedUpBuild(buildingId)) {
        if (typeof OverlayPanel !== 'undefined') OverlayPanel.close();
        EventBus.emit('toast:show', { type: 'success', message: '⚡ 建造完成！' });
      } else {
        var remain = TownManager.getRemainingBuildTime(buildingId);
        EventBus.emit('toast:show', { type: 'warning', message: '💎 不足（需要 ' + Math.ceil(remain / 60) + '）' });
      }
    }
  },

  _startMoveBuilding: function (buildingId) {
    var bState = this._getBuildingState(buildingId);
    if (!bState || bState.level <= 0) return;
    this._editMode = true;
    this._selectedBuilding = buildingId;
    this._moveOrigPos = { gx: this._getPlacement(buildingId).gx, gy: this._getPlacement(buildingId).gy };
    if (typeof OverlayPanel !== 'undefined') OverlayPanel.close();
    EventBus.emit('toast:show', { type: 'info', message: '📐 拖拽建筑到新位置，点击空地确认' });
    EventBus.emit('town:edit_mode', { active: true });

    // ESC to cancel
    var self = this;
    this._escHandler = function (e) {
      if (e.key === 'Escape') { self._cancelMove(); }
    };
    document.addEventListener('keydown', this._escHandler);
  },

  _cancelMove: function () {
    if (this._moveOrigPos && this._selectedBuilding) {
      this._setPlacement(this._selectedBuilding, this._moveOrigPos.gx, this._moveOrigPos.gy);
    }
    this._finishMove();
    EventBus.emit('toast:show', { type: 'info', message: '已取消移动' });
  },

  _confirmMove: function () {
    if (this._selectedBuilding) {
      var p = this._getPlacement(this._selectedBuilding);
      EventBus.emit('town:building_moved', { buildingId: this._selectedBuilding, x: p.gx, y: p.gy });
    }
    this._finishMove();
    // Recalculate roads after building placement confirmed
    if (typeof TownManager !== 'undefined' && TownManager.recalcRoads) {
      TownManager.recalcRoads();
    }
  },

  _finishMove: function () {
    this._editMode = false;
    this._moveOrigPos = null;
    this._buildingDrag = null;
    this._filterDecorations();
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
    EventBus.emit('town:edit_mode', { active: false });
  },

  _checkPlacementValid: function (buildingId, gx, gy) {
    var s = this._buildingSizes[buildingId];
    if (!s) return false;
    if (gx < 0 || gy < 0 || gx + s.w > this.MAP_W || gy + s.h > this.MAP_H) return false;
    // Check overlap with other buildings
    var buildingIds = Object.keys(this._buildingSizes);
    for (var i = 0; i < buildingIds.length; i++) {
      var otherId = buildingIds[i];
      if (otherId === buildingId) continue;
      var otherState = this._getBuildingState(otherId);
      if (!otherState || otherState.level <= 0) continue;
      var op = this._getPlacement(otherId);
      var os = this._buildingSizes[otherId];
      if (gx < op.gx + os.w && gx + s.w > op.gx && gy < op.gy + os.h && gy + s.h > op.gy) {
        return false;
      }
    }
    return true;
  },

  _effectLabelMap: function () {
    return {
      atkBonus: '⚔️ 攻击加成', defBonus: '🛡️ 防御加成', hpBonus: '❤️ 生命加成',
      expBonus: '⭐ 经验加成', spdBonus: '💨 速度加成', firstStrikeChance: '🎯 先攻概率',
      enhanceSuccessBonus: '🔧 强化成功率', equipStatBonus: '📈 装备属性',
      equipQualityBonus: '💎 装备品质', skillCooldownReduction: '⏱ 技能冷却',
      offlineEfficiency: '🌙 离线效率', dropRateBonus: '🎁 掉落率',
      recruitDiscount: '🏷️ 招募折扣', resourceCapBonus: '📦 资源上限',
      inventoryCap: '🎒 背包容量', foodCapBonus: '🍖 粮草上限',
      foodRegenInterval: '🍖 恢复间隔(秒)', freeRecruitInterval: '🎫 免费招募间隔(秒)',
      unlockSlots: '🏠 建筑槽', levelCap: '📊 等级上限',
      productionBoost: '⬆ 产出加成',
      plots: '🌱 田地数量', qualityUnlock: '🏅 可种品级', speedBonus: '⚡ 生长加速',
      doubleHarvestChance: '🎉 双倍收获概率', fertilizerYieldBonus: '🧪 施肥产量加成',
      maxFertilizer: '♻️ 肥料上限', maxSeedQuality: '🌱 种子品级上限',
      seedDiscount: '🏷️ 种子折扣'
    };
  },

  _formatTime: function (sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    if (m > 60) {
      var h = Math.floor(m / 60);
      m = m % 60;
      return h + '时' + m + '分';
    }
    return m + '分' + s + '秒';
  },

  _onBuildingChanged: function () {
    this.rebuildCollisionGrid();
  },

  // --- Render Loop ---
  _lastFrameTime: 0,

  _loop: function () {
    var now = performance.now();
    var dt = this._lastFrameTime ? (now - this._lastFrameTime) / 1000 : 0.016;
    this._lastFrameTime = now;
    // 限制 dt 防止切后台导致跳跃
    if (dt > 0.1) dt = 0.1;

    // 更新角色 AI
    if (typeof TownCharacters !== 'undefined') {
      TownCharacters.update(dt);
    }

    this._render();
    this._raf = requestAnimationFrame(this._loop.bind(this));
  },

  _render: function () {
    var ctx = this._ctx;
    var w = this._canvas.width;
    var h = this._canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(this._cam.zoom, this._cam.zoom);
    ctx.translate(-this._cam.x, -this._cam.y);

    this._drawBorder(ctx);
    this._drawGround(ctx);
    if (this._editMode || this._buildingDrag) {
      this._drawGrid(ctx);
    }
    this._drawRoads(ctx);
    this._drawDecorations(ctx);
    this._drawBuildings(ctx);
    this._drawTDBuildings(ctx);
    if (typeof TownCharacters !== 'undefined') {
      TownCharacters.draw(ctx);
    }

    ctx.restore();

    // Draw UI overlay (on screen coordinates)
    this._drawHUD(ctx, w, h);
  },

  _drawBorder: function (ctx) {
    var CELL = this.CELL;
    var MW = this.MAP_W * CELL;   // 1920
    var MH = this.MAP_H * CELL;   // 1920
    var cam = this._cam;
    var vw = this._canvas.width / cam.zoom;
    var vh = this._canvas.height / cam.zoom;
    var vx0 = cam.x;
    var vy0 = cam.y;

    // ── 1. 底色填充（深山绿） ──
    ctx.fillStyle = '#2E3527';
    ctx.fillRect(vx0 - 10, vy0 - 10, vw + 20, vh + 20);

    // ── 2. 山脉 — 使用数据驱动配置渲染 SVG 山脉 ──
    var mtConfig = this._mountainConfig;
    for (var mi = 0; mi < mtConfig.length; mi++) {
      var mt = mtConfig[mi];
      var mtImg = this._images[mt.image];
      if (!mtImg) continue;
      ctx.save();
      var mcx = mt.x + mt.w / 2, mcy = mt.y + mt.h / 2;
      ctx.translate(mcx, mcy);
      if (mt.rotation) ctx.rotate(mt.rotation * Math.PI / 180);
      if (mt.flipX) ctx.scale(-1, 1);
      if (mt.flipY) ctx.scale(1, -1);
      ctx.drawImage(mtImg, -mt.w / 2, -mt.h / 2, mt.w, mt.h);
      ctx.restore();
    }

    // ── 3. 河流 — 从右上角蜿蜒流向右下角 ──
    var riverPts = [
      { x: MW + 260, y: -300 },
      { x: MW + 200, y: -100 },
      { x: MW + 120, y: 100 },
      { x: MW + 180, y: 350 },
      { x: MW + 100, y: 550 },
      { x: MW + 160, y: 800 },
      { x: MW + 80,  y: 1000 },
      { x: MW + 140, y: 1250 },
      { x: MW + 60,  y: 1500 },
      { x: MW + 130, y: 1700 },
      { x: MW + 90,  y: 1920 },
      { x: MW + 180, y: 2100 },
      { x: MW + 240, y: 2300 }
    ];
    var riverWidth = 80;

    // 河岸（深色边缘）
    ctx.beginPath();
    ctx.moveTo(riverPts[0].x - riverWidth * 0.7, riverPts[0].y);
    for (var ri = 0; ri < riverPts.length; ri++) {
      var rip = riverPts[ri];
      ctx.lineTo(rip.x - riverWidth * 0.7, rip.y);
    }
    for (var rj = riverPts.length - 1; rj >= 0; rj--) {
      var rjp = riverPts[rj];
      ctx.lineTo(rjp.x + riverWidth * 0.7, rjp.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#1A4060';
    ctx.fill();

    // 河水主体
    ctx.beginPath();
    ctx.moveTo(riverPts[0].x - riverWidth * 0.5, riverPts[0].y);
    for (var ra = 1; ra < riverPts.length; ra++) {
      var prev = riverPts[ra - 1];
      var curr = riverPts[ra];
      var cpx = (prev.x + curr.x) / 2 - riverWidth * 0.5;
      var cpy = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x - riverWidth * 0.5, prev.y, cpx, cpy);
    }
    var lastPt = riverPts[riverPts.length - 1];
    ctx.lineTo(lastPt.x - riverWidth * 0.5, lastPt.y);
    ctx.lineTo(lastPt.x + riverWidth * 0.5, lastPt.y);
    for (var rb = riverPts.length - 2; rb >= 0; rb--) {
      var next = riverPts[rb + 1];
      var cur2 = riverPts[rb];
      var cpx2 = (next.x + cur2.x) / 2 + riverWidth * 0.5;
      var cpy2 = (next.y + cur2.y) / 2;
      ctx.quadraticCurveTo(next.x + riverWidth * 0.5, next.y, cpx2, cpy2);
    }
    ctx.closePath();
    ctx.fillStyle = '#1E6FA0';
    ctx.fill();

    // 河面波纹高光（动态流动）
    var now = Date.now();
    var flowSpeed = 0.03;   // 流速
    var flowOffset = now * flowSpeed;

    ctx.save();

    // ── 主波纹线（3条，不同相位和透明度） ──
    var waveConfigs = [
      { ox: -20, oy: 0,  alpha: 0.22, width: 2.5, color: '#5CB8E8', phase: 0 },
      { ox: 5,   oy: 15, alpha: 0.15, width: 2,   color: '#7DD3F8', phase: 2.1 },
      { ox: 18,  oy: 8,  alpha: 0.10, width: 1.5, color: '#A0E0FF', phase: 4.2 }
    ];

    for (var wc = 0; wc < waveConfigs.length; wc++) {
      var cfg = waveConfigs[wc];
      ctx.globalAlpha = cfg.alpha;
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = cfg.width;

      for (var rw = 0; rw < riverPts.length - 1; rw++) {
        var p1 = riverPts[rw];
        var p2 = riverPts[rw + 1];
        var segLen = p2.y - p1.y;
        var steps = Math.ceil(segLen / 30);

        ctx.beginPath();
        for (var st = 0; st <= steps; st++) {
          var t = st / steps;
          var baseX = p1.x + (p2.x - p1.x) * t + cfg.ox;
          var baseY = p1.y + (p2.y - p1.y) * t + cfg.oy;
          // 正弦横向摆动 + 随流动偏移
          var wave = Math.sin((baseY + flowOffset + cfg.phase) * 0.025) * 12;
          var px2 = baseX + wave;
          if (st === 0) ctx.moveTo(px2, baseY);
          else ctx.lineTo(px2, baseY);
        }
        ctx.stroke();
      }
    }

    // ── 流动水花/亮点 ──
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#B0E8FF';
    for (var sp = 0; sp < 20; sp++) {
      // 沿河流分布，位置随时间缓慢移动
      var spIdx = sp / 20 * (riverPts.length - 1);
      var spI = Math.floor(spIdx);
      var spT = spIdx - spI;
      if (spI >= riverPts.length - 1) { spI = riverPts.length - 2; spT = 1; }
      var spP1 = riverPts[spI];
      var spP2 = riverPts[spI + 1];
      var spBaseX = spP1.x + (spP2.x - spP1.x) * spT;
      var spBaseY = spP1.y + (spP2.y - spP1.y) * spT;

      // 水花随时间向下流动（循环）
      var spFlow = ((now * 0.02 + sp * 137) % 2600) - 300;
      var spY = spBaseY + spFlow - 1000;
      var spWave = Math.sin((spY + flowOffset) * 0.03 + sp) * 15;
      var spX = spBaseX + spWave + ((sp * 7) % 30 - 15);

      var spAlpha = 0.15 + 0.15 * Math.sin(now * 0.003 + sp * 1.7);
      ctx.globalAlpha = spAlpha;
      var spR = 1.5 + Math.sin(now * 0.005 + sp * 2.3) * 1;
      ctx.beginPath();
      ctx.ellipse(spX, spY, spR * 2, spR, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  _drawGround: function (ctx) {
    var grassImg = this._images['terrain_grass'];
    var startGX = Math.max(0, Math.floor(this._cam.x / this.CELL));
    var startGY = Math.max(0, Math.floor(this._cam.y / this.CELL));
    var endGX = Math.min(this.MAP_W, Math.ceil((this._cam.x + this._canvas.width / this._cam.zoom) / this.CELL));
    var endGY = Math.min(this.MAP_H, Math.ceil((this._cam.y + this._canvas.height / this._cam.zoom) / this.CELL));

    // Fill continuous base color first to eliminate tile seams
    ctx.fillStyle = '#7A8A4A';
    ctx.fillRect(startGX * this.CELL, startGY * this.CELL,
                 (endGX - startGX) * this.CELL, (endGY - startGY) * this.CELL);

    if (grassImg) {
      for (var gy = startGY; gy < endGY; gy++) {
        for (var gx = startGX; gx < endGX; gx++) {
          ctx.drawImage(grassImg, gx * this.CELL, gy * this.CELL, this.CELL, this.CELL);
        }
      }
    }
  },

  _drawGrid: function (ctx) {
    var CELL = this.CELL;
    var startGX = Math.max(0, Math.floor(this._cam.x / CELL));
    var startGY = Math.max(0, Math.floor(this._cam.y / CELL));
    var endGX = Math.min(this.MAP_W, Math.ceil((this._cam.x + this._canvas.width / this._cam.zoom) / CELL));
    var endGY = Math.min(this.MAP_H, Math.ceil((this._cam.y + this._canvas.height / this._cam.zoom) / CELL));

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    // Vertical lines
    for (var gx = startGX; gx <= endGX; gx++) {
      var px = gx * CELL;
      ctx.moveTo(px, startGY * CELL);
      ctx.lineTo(px, endGY * CELL);
    }
    // Horizontal lines
    for (var gy = startGY; gy <= endGY; gy++) {
      var py = gy * CELL;
      ctx.moveTo(startGX * CELL, py);
      ctx.lineTo(endGX * CELL, py);
    }
    ctx.stroke();
    ctx.restore();
  },

  _drawRoads: function (ctx) {
    if (!this._roadGrid) return;
    var pathImg = this._images['terrain_path_tile'];
    var CELL = this.CELL;
    var now = performance.now();
    var FADE_DURATION = 2000; // ms

    var startGX = Math.max(0, Math.floor(this._cam.x / CELL));
    var startGY = Math.max(0, Math.floor(this._cam.y / CELL));
    var endGX = Math.min(this.MAP_W, Math.ceil((this._cam.x + this._canvas.width / this._cam.zoom) / CELL));
    var endGY = Math.min(this.MAP_H, Math.ceil((this._cam.y + this._canvas.height / this._cam.zoom) / CELL));

    for (var gy = startGY; gy < endGY; gy++) {
      for (var gx = startGX; gx < endGX; gx++) {
        var usage = this._roadGrid[gy][gx];
        if (usage <= 0) continue;

        // Determine width and target alpha based on usage
        var widthFraction, targetAlpha;
        if (usage >= 5) {
          widthFraction = 1.0;
          targetAlpha = 0.9;
        } else if (usage >= 3) {
          widthFraction = 0.8;
          targetAlpha = 0.7;
        } else {
          widthFraction = 0.6;
          targetAlpha = 0.5;
        }

        // Fade-in
        var key = gx + ',' + gy;
        var fadeStart = this._roadFadeStart[key];
        var fadeProgress = 1;
        if (fadeStart) {
          fadeProgress = Math.min(1, (now - fadeStart) / FADE_DURATION);
        }

        var alpha = targetAlpha * fadeProgress;
        var drawW = CELL * widthFraction;
        var drawH = CELL * widthFraction;
        var px = gx * CELL + (CELL - drawW) / 2;
        var py = gy * CELL + (CELL - drawH) / 2;

        ctx.save();
        ctx.globalAlpha = alpha;

        if (pathImg) {
          ctx.drawImage(pathImg, px, py, drawW, drawH);
        } else {
          // Fallback: earthy brown road color
          ctx.fillStyle = '#B8956A';
          ctx.fillRect(px, py, drawW, drawH);
        }
        ctx.restore();
      }
    }
  },

  _drawDecorations: function (ctx) {
    for (var i = 0; i < this._decorations.length; i++) {
      var d = this._decorations[i];
      var img = this._images['terrain_' + d.type];
      if (!img) continue;
      var px = d.gx * this.CELL + d.ox;
      var py = d.gy * this.CELL + d.oy;
      var size = this.CELL * d.scale;
      ctx.drawImage(img, px, py, size, size * (img.height / img.width));
    }
  },

  _drawBuildings: function (ctx) {
    var buildingIds = Object.keys(this._buildingSizes);
    var now = Date.now();

    // --- Draw unbuilt building ghosts ---
    var thLv = typeof TownManager !== 'undefined' ? TownManager.getBuildingLevel('town_hall') : 1;
    var thData = BuildingData._townHallUnlocks[thLv];
    for (var u = 0; u < buildingIds.length; u++) {
      var uid = buildingIds[u];
      var uState = this._getBuildingState(uid);
      if (uState && uState.level > 0) continue;
      var uDef = BuildingData[uid];
      if (!uDef || !thData || uDef.unlockOrder >= thData.slots) continue;

      var up = this._getPlacement(uid);
      var us = this._buildingSizes[uid];
      var upx = up.gx * this.CELL;
      var upy = up.gy * this.CELL;
      var upw = us.w * this.CELL;
      var uph = us.h * this.CELL;

      // Ghost outline
      ctx.save();
      ctx.globalAlpha = 0.3;
      var uImg = this._images['building_' + uid];
      if (uImg) {
        ctx.drawImage(uImg, upx, upy, upw, uph);
      } else {
        ctx.fillStyle = '#78909C';
        ctx.fillRect(upx + 4, upy + 4, upw - 8, uph - 8);
      }
      ctx.globalAlpha = 1.0;

      // Dashed border
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(upx + 2, upy + 2, upw - 4, uph - 4);
      ctx.setLineDash([]);

      // Name + "点击建造"
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      var nameText = uDef.emoji + ' ' + uDef.name;
      var nw = ctx.measureText(nameText).width + 8;
      ctx.fillRect(upx + upw / 2 - nw / 2, upy + uph - 4, nw, 22);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(nameText, upx + upw / 2, upy + uph - 2);
      ctx.font = '8px sans-serif';
      ctx.fillStyle = 'rgba(200,230,255,0.7)';
      ctx.fillText('点击建造', upx + upw / 2, upy + uph + 8);
      ctx.restore();
    }

    // --- Draw built buildings (Y-sorted) ---
    var sorted = [];
    for (var i = 0; i < buildingIds.length; i++) {
      var id = buildingIds[i];
      var bState = this._getBuildingState(id);
      if (!bState || bState.level <= 0) continue;
      var p = this._getPlacement(id);
      sorted.push({ id: id, gy: p.gy, state: bState });
    }
    sorted.sort(function (a, b) { return a.gy - b.gy; });

    for (var j = 0; j < sorted.length; j++) {
      var item = sorted[j];
      var bId = item.id;
      var s = this._buildingSizes[bId];
      var p2 = this._getPlacement(bId);
      var px = p2.gx * this.CELL;
      var py = p2.gy * this.CELL;
      var pw = s.w * this.CELL;
      var ph = s.h * this.CELL;
      var isSelected = this._selectedBuilding === bId;
      var isBuildingNow = item.state.buildEndTime && item.state.buildEndTime > now;

      // Shadow is baked into SVG — no canvas shadow needed

      // Dim non-selected buildings when one is selected
      if (this._selectedBuilding && !isSelected) {
        ctx.globalAlpha = 0.7;
      }

      var img = this._images['building_' + bId];
      if (img) {
        // Construction pulse effect
        if (isBuildingNow) {
          ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.5 + 0.3 * Math.sin(now / 300));
        }

        // Edit mode drag preview: semi-transparent
        if (this._editMode && this._buildingDrag && this._buildingDrag.id === bId) {
          ctx.globalAlpha = 0.6;
        }

        ctx.drawImage(img, px, py, pw, ph);
        ctx.globalAlpha = 1.0;

        // Construction progress bar
        if (isBuildingNow) {
          var progress = typeof TownManager !== 'undefined' ? TownManager.getBuildingProgress(bId) : 0;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(px + 4, py + ph - 10, pw - 8, 8);
          ctx.fillStyle = '#5d8a48';
          ctx.fillRect(px + 5, py + ph - 9, (pw - 10) * (progress || 0), 6);

          // Hammer icon bouncing
          var bounce = Math.sin(now / 200) * 4;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚒️', px + pw / 2, py - 8 + bounce);
        }
      } else {
        // Fallback rectangle
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(px + 4, py + 4, pw - 8, ph - 8);
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 4, py + 4, pw - 8, ph - 8);
        ctx.globalAlpha = 1.0;
      }

      // Level badge
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      var badgeR = 10;
      ctx.beginPath();
      ctx.arc(px + pw - badgeR - 2, py + 4 + badgeR, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d4a849';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.state.level, px + pw - badgeR - 2, py + 4 + badgeR);

      // Selection highlight
      if (isSelected) {
        ctx.strokeStyle = '#d4a849';
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);

        // Floating name+level label above building
        var bDef = BuildingData[bId];
        if (bDef) {
          var labelText = bDef.emoji + ' ' + bDef.name + ' Lv.' + item.state.level;
          ctx.font = 'bold 10px sans-serif';
          var lw = ctx.measureText(labelText).width + 12;
          var lx = px + pw / 2 - lw / 2;
          var ly = py - 24;
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.beginPath();
          ctx.roundRect(lx, ly, lw, 18, 4);
          ctx.fill();
          ctx.fillStyle = '#d4a849';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, px + pw / 2, ly + 9);
        }
      } else {
        // Building name label (smaller, for unselected)
        var bDef2 = BuildingData[bId];
        if (bDef2) {
          ctx.font = '9px sans-serif';
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          var nameW = ctx.measureText(bDef2.name).width + 8;
          ctx.fillRect(px + pw / 2 - nameW / 2, py + ph - 2, nameW, 14);
          ctx.fillStyle = '#FFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(bDef2.name, px + pw / 2, py + ph);
        }
      }

      // Upgradeable indicator: green arrow (breathing animation)
      if (!isBuildingNow && !isSelected && typeof TownManager !== 'undefined') {
        var canUp = TownManager.canUpgrade(bId);
        if (canUp && canUp.ok) {
          var arrowAlpha = 0.5 + 0.5 * Math.sin(now / 600);
          ctx.globalAlpha = arrowAlpha;
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⬆', px + 10, py + 6);
          ctx.globalAlpha = 1.0;
        }
      }

      // Edit mode: valid/invalid placement overlay
      if (this._editMode && this._buildingDrag && this._buildingDrag.id === bId && this._buildingDrag.moved) {
        var valid = this._checkPlacementValid(bId, p2.gx, p2.gy);
        ctx.fillStyle = valid ? 'rgba(93,138,72,0.25)' : 'rgba(179,58,58,0.25)';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = valid ? '#5d8a48' : '#b33a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);
      }
    }
  },

  _drawTDBuildings: function (ctx) {
    if (typeof TowerDefenseManager === 'undefined') return;
    if (typeof TDRenderer === 'undefined') return;
    var state = TowerDefenseManager.getState();
    if (!state.unlocked) return;

    var CELL = this.CELL;

    // Draw placed towers
    var towers = state.towers;
    for (var i = 0; i < towers.length; i++) {
      var t = towers[i];
      var tData = typeof TDTowerData !== 'undefined' ? TDTowerData[t.type] : null;
      if (!tData) continue;
      var tSize = typeof TDGetTowerSize !== 'undefined' ? TDGetTowerSize(t.type) : { w: 1, h: 1 };
      var centerX = t.gridX * CELL + tSize.w * CELL / 2;
      var centerY = t.gridY * CELL + tSize.h * CELL / 2;

      TDRenderer.drawTower(ctx, t.type, centerX, centerY, t.level, {});

      // Level badge
      if (t.level > 1) {
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#f5c518';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Lv' + t.level, centerX, t.gridY * CELL - 2);
      }
    }

    // Draw pending TD builds (construction animation)
    if (typeof TownManager !== 'undefined' && TownManager.getTDBuildPending) {
      var pending = TownManager.getTDBuildPending();
      var now = Date.now();
      for (var j = 0; j < pending.length; j++) {
        var p = pending[j];
        var pSize = typeof TDGetTowerSize !== 'undefined' ? TDGetTowerSize(p.tdType) : { w: 1, h: 1 };
        var px = p.gridX * CELL;
        var py = p.gridY * CELL;
        var pw = pSize.w * CELL;
        var ph = pSize.h * CELL;

        // Semi-transparent placeholder
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(now / 400);
        var pCenterX = px + pw / 2;
        var pCenterY = py + ph / 2;
        TDRenderer.drawTower(ctx, p.tdType, pCenterX, pCenterY, 1, {});
        ctx.restore();

        // Construction progress bar
        if (p.buildEndTime) {
          var elapsed = now - (p.buildEndTime - p.buildTime * 1000);
          var progress = Math.min(1, elapsed / (p.buildTime * 1000));
          var barW = pw - 8;
          var barH = 4;
          var barX = px + 4;
          var barY = py + ph + 2;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = '#f5c518';
          ctx.fillRect(barX, barY, barW * progress, barH);
        }

        // "建造中" label
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#f5c518';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('⏱ 建造中', px + pw / 2, py + ph + 8);
      }
    }

    // Draw TD placement preview
    if (this._tdPlacementType && this._tdPlacementGX >= 0) {
      var ptSize = typeof TDGetTowerSize !== 'undefined' ? TDGetTowerSize(this._tdPlacementType) : { w: 1, h: 1 };
      var ppx = this._tdPlacementGX * CELL;
      var ppy = this._tdPlacementGY * CELL;
      var ppw = ptSize.w * CELL;
      var pph = ptSize.h * CELL;

      var valid = true;
      if (typeof TowerDefenseManager !== 'undefined') {
        var vCheck = TowerDefenseManager.canBuildTower(this._tdPlacementType, this._tdPlacementGX, this._tdPlacementGY);
        valid = vCheck.ok;
      }

      // Preview outline
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = valid ? '#4caf50' : '#f44336';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(ppx + 1, ppy + 1, ppw - 2, pph - 2);
      ctx.setLineDash([]);

      // Preview tower image
      var pvCenterX = ppx + ppw / 2;
      var pvCenterY = ppy + pph / 2;
      TDRenderer.drawTower(ctx, this._tdPlacementType, pvCenterX, pvCenterY, 1, {});
      ctx.restore();

      // Confirm hint
      if (valid) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#4caf50';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('点击确认放置', ppx + ppw / 2, ppy + pph + 4);
      } else {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#f44336';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('无法放置', ppx + ppw / 2, ppy + pph + 4);
      }
    }
  },

  _drawHUD: function (ctx, w, h) {
    // Edit mode indicator + confirm/cancel buttons
    if (this._editMode) {
      ctx.fillStyle = 'rgba(212,168,73,0.1)';
      ctx.fillRect(0, 0, w, h);

      // HUD bar at top
      var barH = 44;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, barH);
      ctx.fillStyle = '#d4a849';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this._tdPlacementType ? '🏰 放置防御建筑 — 点击选择位置' : '📐 移动模式 — 拖拽建筑到新位置', w / 2, barH / 2);
    }

    // Upgradeable building notification bar
    if (!this._editMode && typeof TownManager !== 'undefined') {
      var upgradeCount = 0;
      var buildingIds = Object.keys(this._buildingSizes);
      for (var i = 0; i < buildingIds.length; i++) {
        var c = TownManager.canUpgrade(buildingIds[i]);
        if (c && c.ok) upgradeCount++;
      }
      if (upgradeCount > 0) {
        ctx.fillStyle = 'rgba(76,175,80,0.85)';
        var notifH = 24;
        ctx.fillRect(0, h - notifH, w, notifH);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⬆ ' + upgradeCount + '个建筑可升级', w / 2, h - notifH / 2);
      }
    }
  },

  // --- Public API ---
  centerOn: function (buildingId) {
    var p = this._getPlacement(buildingId);
    var s = this._buildingSizes[buildingId];
    this._cam.x = (p.gx + s.w / 2) * this.CELL - this._canvas.width / (2 * this._cam.zoom);
    this._cam.y = (p.gy + s.h / 2) * this.CELL - this._canvas.height / (2 * this._cam.zoom);
    this._clampCamera();
  },

  showBuildMenu: function () {
    if (typeof BuildMenu !== 'undefined') {
      BuildMenu.show();
    }
  },

  destroy: function () {
    if (this._raf) cancelAnimationFrame(this._raf);
  }
};
