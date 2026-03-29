/**
 * 城镇世界引擎 — Canvas 渲染可视化城镇地图
 * CoC 风格：可拖拽平移、点击建筑交互、拖拽建筑移动
 */
var TownWorld = {
  _canvas: null,
  _ctx: null,

  // Grid config
  CELL: 48,
  MAP_W: 24,
  MAP_H: 24,

  // Camera
  _cam: { x: 0, y: 0, zoom: 1 },
  _targetCam: null,

  // Interaction state
  _drag: null,        // {startX, startY, camX, camY} - map panning
  _buildingDrag: null, // {id, startGX, startGY, offsetX, offsetY} - building drag
  _selectedBuilding: null,
  _editMode: false,
  _longPressTimer: null,

  // Images cache
  _images: {},
  _imagesLoading: {},
  _decorations: [],   // random trees, rocks, etc.

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
    market: { w: 3, h: 2 }
  },

  // Default positions (when no saved data)
  _defaultPositions: {
    town_hall:        { gx: 10, gy: 10 },
    lumber_camp:      { gx: 4, gy: 5 },
    quarry:           { gx: 17, gy: 4 },
    iron_mine:        { gx: 4, gy: 15 },
    farmland:         { gx: 17, gy: 15 },
    barracks:         { gx: 7, gy: 6 },
    training_ground:  { gx: 14, gy: 6 },
    blacksmith:       { gx: 7, gy: 14 },
    city_wall:        { gx: 10, gy: 3 },
    adventure_guild:  { gx: 3, gy: 10 },
    tavern:           { gx: 18, gy: 10 },
    warehouse:        { gx: 10, gy: 17 },
    market:           { gx: 14, gy: 14 }
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

    // Start render loop
    this._raf = requestAnimationFrame(this._loop.bind(this));

    // Listen to game events for re-render
    EventBus.on('town:building_upgraded', this._onBuildingChanged.bind(this));
    EventBus.on('town:building_complete', this._onBuildingChanged.bind(this));
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
    var terrains = ['grass', 'tree', 'rock', 'bush', 'flower', 'water', 'path_tile'];
    for (var j = 0; j < terrains.length; j++) {
      this._loadImage('terrain_' + terrains[j], 'assets/img/terrain/' + terrains[j] + '.svg');
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
    // Trees
    for (var i = 0; i < 35; i++) {
      this._decorations.push({
        type: 'tree', gx: rand(0, this.MAP_W - 1), gy: rand(0, this.MAP_H - 1),
        ox: rand(-8, 8), oy: rand(-8, 8), scale: 0.6 + Math.random() * 0.5
      });
    }
    // Rocks
    for (var j = 0; j < 15; j++) {
      this._decorations.push({
        type: 'rock', gx: rand(0, this.MAP_W - 1), gy: rand(0, this.MAP_H - 1),
        ox: rand(-12, 12), oy: rand(-6, 6), scale: 0.5 + Math.random() * 0.6
      });
    }
    // Bushes
    for (var k = 0; k < 20; k++) {
      this._decorations.push({
        type: 'bush', gx: rand(0, this.MAP_W - 1), gy: rand(0, this.MAP_H - 1),
        ox: rand(-10, 10), oy: rand(-4, 4), scale: 0.4 + Math.random() * 0.4
      });
    }
    // Flowers
    for (var l = 0; l < 25; l++) {
      this._decorations.push({
        type: 'flower', gx: rand(0, this.MAP_W - 1), gy: rand(0, this.MAP_H - 1),
        ox: rand(-16, 16), oy: rand(-10, 10), scale: 0.8 + Math.random() * 0.4
      });
    }
    // Filter decorations that overlap with buildings
    this._filterDecorations();
  },

  _filterDecorations: function () {
    var self = this;
    this._decorations = this._decorations.filter(function (d) {
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
    return null;
  },

  _getBuildingState: function (id) {
    if (typeof TownManager !== 'undefined' && TownManager._state && TownManager._state.buildings) {
      return TownManager._state.buildings[id];
    }
    return null;
  },

  _onPointerDown: function (e) {
    e.preventDefault();
    var pos = this._getPointerPos(e);
    var world = this._screenToWorld(pos.x, pos.y);
    var hit = this._hitTestBuilding(world.x, world.y);

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

    // Long-press for building selection
    var self = this;
    this._longPressTimer = setTimeout(function () {
      if (hit && !self._drag.moved) {
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

    if (this._buildingDrag) {
      if (!this._buildingDrag.moved) {
        // Tap on building in edit mode → show details
        this._showBuildingDetail(this._buildingDrag.id);
      }
      this._buildingDrag = null;
      this._editMode = false;
      this._filterDecorations();
      return;
    }

    if (this._drag && !this._drag.moved) {
      // Tap — check if hit a character first, then building
      var pos = this._getPointerPos(e);
      if (pos.x === undefined) {
        pos = { x: this._drag.startX, y: this._drag.startY };
      }
      var world = this._screenToWorld(pos.x, pos.y);

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
          this._selectedBuilding = null;
          if (typeof OverlayPanel !== 'undefined') {
            OverlayPanel.close();
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
    var bState = this._getBuildingState(buildingId);
    if (!bState) return;

    var def = null;
    if (typeof BuildingData !== 'undefined') {
      for (var i = 0; i < BuildingData.length; i++) {
        if (BuildingData[i].id === buildingId) { def = BuildingData[i]; break; }
      }
    }
    if (!def) return;

    var level = bState.level;
    var isBuilding = bState.buildEndTime && bState.buildEndTime > Date.now();

    var content = '<div class="building-detail-overlay">';
    content += '<div class="bdo-header">';
    content += '<img src="assets/img/buildings/' + buildingId + '.svg" class="bdo-icon" alt="' + def.name + '"/>';
    content += '<div class="bdo-info">';
    content += '<h3>' + def.name + '</h3>';
    content += '<span class="bdo-level">Lv.' + level + '</span>';
    content += '</div></div>';

    if (isBuilding) {
      var remaining = Math.ceil((bState.buildEndTime - Date.now()) / 1000);
      content += '<div class="bdo-building"><div class="bdo-progress-bar"><div class="bdo-progress-fill" style="width:50%"></div></div>';
      content += '<p>⏳ 建设中... ' + this._formatTime(remaining) + '</p></div>';
    }

    content += '<p class="bdo-desc">' + def.description + '</p>';

    // Effects at current level
    if (def.effect && level > 0) {
      var effects = def.effect(level);
      content += '<div class="bdo-effects"><h4>📊 当前效果</h4><ul>';
      for (var key in effects) {
        if (effects.hasOwnProperty(key)) {
          var val = effects[key];
          var label = this._effectLabel(key);
          if (typeof val === 'number' && val < 1) {
            content += '<li>' + label + ': ' + Math.round(val * 100) + '%</li>';
          } else {
            content += '<li>' + label + ': ' + val + '</li>';
          }
        }
      }
      content += '</ul></div>';
    }

    // Upgrade button
    if (!isBuilding && level < 10) {
      var canUp = typeof TownManager !== 'undefined' && TownManager.canUpgrade(buildingId);
      var cost = def.cost(level + 1);
      content += '<div class="bdo-upgrade">';
      content += '<h4>⬆️ 升级到 Lv.' + (level + 1) + '</h4>';
      content += '<div class="bdo-cost">';
      if (cost.gold) content += '<span>💰' + Utils.formatNumber(cost.gold) + '</span>';
      if (cost.wood) content += '<span>🪵' + Utils.formatNumber(cost.wood) + '</span>';
      if (cost.stone) content += '<span>🪨' + Utils.formatNumber(cost.stone) + '</span>';
      if (cost.iron) content += '<span>⛏️' + Utils.formatNumber(cost.iron) + '</span>';
      content += '</div>';
      content += '<button class="btn btn-upgrade' + (canUp ? '' : ' disabled') + '" '
        + 'onclick="TownWorld._doUpgrade(\'' + buildingId + '\')"'
        + (canUp ? '' : ' disabled') + '>'
        + (canUp ? '🔨 升级' : '❌ 资源不足') + '</button>';
      content += '</div>';
    }

    // Move button
    content += '<button class="btn btn-move" onclick="TownWorld._startMoveBuilding(\'' + buildingId + '\')">📐 移动建筑</button>';
    content += '</div>';

    if (typeof OverlayPanel !== 'undefined') {
      OverlayPanel.show({
        title: def.name,
        content: content,
        height: 'auto'
      });
    }
  },

  _doUpgrade: function (buildingId) {
    if (typeof TownManager !== 'undefined') {
      TownManager.startUpgrade(buildingId);
      if (typeof OverlayPanel !== 'undefined') OverlayPanel.close();
      EventBus.emit('toast:show', { type: 'success', message: '🔨 开始建造！' });
    }
  },

  _startMoveBuilding: function (buildingId) {
    this._editMode = true;
    this._selectedBuilding = buildingId;
    if (typeof OverlayPanel !== 'undefined') OverlayPanel.close();
    EventBus.emit('toast:show', { type: 'info', message: '📐 拖拽建筑到新位置' });
  },

  _effectLabel: function (key) {
    var labels = {
      atkBonus: '⚔️ 攻击加成', defBonus: '🛡️ 防御加成', hpBonus: '❤️ 生命加成',
      expBonus: '⭐ 经验加成', woodPerMin: '🪵 木材/分', stonePerMin: '🪨 石材/分',
      ironPerMin: '⛏️ 铁矿/分', foodCap: '🍖 粮草上限', foodRegen: '🍖 恢复/分',
      offlineEff: '🌙 离线效率', dropRate: '🎁 掉落加成', recruitDiscount: '🏷️ 招募折扣',
      storageMult: '📦 仓库倍率', tradeFee: '💱 交易费率'
    };
    return labels[key] || key;
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
    // Just triggers re-render naturally via animation loop
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

    this._drawGround(ctx);
    this._drawDecorations(ctx);
    this._drawBuildings(ctx);

    // 绘制角色（在建筑之后，网格之前）
    if (typeof TownCharacters !== 'undefined') {
      TownCharacters.draw(ctx);
    }

    if (this._editMode) {
      this._drawGrid(ctx);
    }

    ctx.restore();

    // Draw UI overlay (on screen coordinates)
    this._drawHUD(ctx, w, h);
  },

  _drawGround: function (ctx) {
    var grassImg = this._images['terrain_grass'];
    var startGX = Math.max(0, Math.floor(this._cam.x / this.CELL));
    var startGY = Math.max(0, Math.floor(this._cam.y / this.CELL));
    var endGX = Math.min(this.MAP_W, Math.ceil((this._cam.x + this._canvas.width / this._cam.zoom) / this.CELL));
    var endGY = Math.min(this.MAP_H, Math.ceil((this._cam.y + this._canvas.height / this._cam.zoom) / this.CELL));

    for (var gy = startGY; gy < endGY; gy++) {
      for (var gx = startGX; gx < endGX; gx++) {
        var px = gx * this.CELL;
        var py = gy * this.CELL;
        if (grassImg) {
          ctx.drawImage(grassImg, px, py, this.CELL, this.CELL);
        } else {
          // Checkerboard grass fallback
          ctx.fillStyle = (gx + gy) % 2 === 0 ? '#4a7c3f' : '#3d6b32';
          ctx.fillRect(px, py, this.CELL, this.CELL);
        }
      }
    }

    // Map border
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, this.MAP_W * this.CELL, this.MAP_H * this.CELL);
  },

  _drawGrid: function (ctx) {
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx <= this.MAP_W; gx++) {
      ctx.beginPath();
      ctx.moveTo(gx * this.CELL, 0);
      ctx.lineTo(gx * this.CELL, this.MAP_H * this.CELL);
      ctx.stroke();
    }
    for (var gy = 0; gy <= this.MAP_H; gy++) {
      ctx.beginPath();
      ctx.moveTo(0, gy * this.CELL);
      ctx.lineTo(this.MAP_W * this.CELL, gy * this.CELL);
      ctx.stroke();
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

    // Sort buildings by Y position for proper overlap
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

      // Building shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, py + ph + 4, pw / 2 - 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      var img = this._images['building_' + bId];
      if (img) {
        // Draw building image (extending above its grid area)
        var imgH = ph * 1.3;
        var imgY = py + ph - imgH;

        // Construction pulse effect
        var isBuilding = item.state.buildEndTime && item.state.buildEndTime > now;
        if (isBuilding) {
          ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now / 300);
        }

        ctx.drawImage(img, px, imgY, pw, imgH);
        ctx.globalAlpha = 1.0;

        // Construction progress bar
        if (isBuilding) {
          var buildDef = null;
          if (typeof BuildingData !== 'undefined') {
            for (var k = 0; k < BuildingData.length; k++) {
              if (BuildingData[k].id === bId) { buildDef = BuildingData[k]; break; }
            }
          }
          if (buildDef) {
            var totalTime = buildDef._getBuildTime(item.state.level + 1) * 1000;
            var elapsed = totalTime - (item.state.buildEndTime - now);
            var prog = Math.min(1, Math.max(0, elapsed / totalTime));
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(px + 4, py + ph - 10, pw - 8, 8);
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(px + 5, py + ph - 9, (pw - 10) * prog, 6);
          }
        }
      } else {
        // Fallback rectangle
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(px + 4, py + 4, pw - 8, ph - 8);
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 4, py + 4, pw - 8, ph - 8);
      }

      // Level badge
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      var badgeR = 10;
      ctx.beginPath();
      ctx.arc(px + pw - badgeR - 2, py + 4 + badgeR, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F5C518';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.state.level, px + pw - badgeR - 2, py + 4 + badgeR);

      // Selection highlight
      if (this._selectedBuilding === bId) {
        ctx.strokeStyle = '#F5C518';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
        ctx.setLineDash([]);
      }

      // Building name label
      if (typeof BuildingData !== 'undefined') {
        var bDef = null;
        for (var m = 0; m < BuildingData.length; m++) {
          if (BuildingData[m].id === bId) { bDef = BuildingData[m]; break; }
        }
        if (bDef) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          var nameW = ctx.measureText(bDef.name).width + 8;
          ctx.fillRect(px + pw / 2 - nameW / 2, py + ph - 2, nameW, 14);
          ctx.fillStyle = '#FFF';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(bDef.name, px + pw / 2, py + ph);
        }
      }
    }
  },

  _drawHUD: function (ctx, w, h) {
    // Edit mode indicator
    if (this._editMode) {
      ctx.fillStyle = 'rgba(245,197,24,0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#F5C518';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📐 拖拽模式 — 长按建筑可拖动', w / 2, 30);
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
