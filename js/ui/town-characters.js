/**
 * 城镇角色系统 — NPC 居民 + 武将在城镇中行走、自言自语、可点击交互
 * 由 TownWorld 在每帧调用 update / draw / hitTest
 */
var TownCharacters = {

  _chars: [],       // 所有角色
  _images: {},      // 精灵图缓存

  // ── 拖拽状态 ──
  _dragChar: null,      // 当前被拖拽的角色
  _dragOffsetX: 0,      // 拖拽偏移
  _dragOffsetY: 0,
  _dragPickupAnim: 0,   // 拿起动画进度 0→1
  _dragDropAnim: null,  // {char, fromY, progress} 放下动画

  // ── 战时状态 ──
  _warMode: false,      // 是否处于战争状态（城防战斗中）

  // ── 常量 ──
  NPC_SPAWN_COUNT: 6,
  CHAR_W: 36,       // 绘制宽
  CHAR_H: 48,       // 绘制高
  HIT_W: 32,        // 点击检测宽
  HIT_H: 44,        // 点击检测高
  DRAG_LIFT: 18,    // 拿起时上浮像素
  DRAG_SCALE: 1.15, // 拿起时放大倍率
  PICKUP_DURATION: 0.18, // 拿起动画时长
  DROP_DURATION: 0.15,   // 放下动画时长

  NPC_SPEED: 22,
  HERO_SPEED: 16,
  FLEE_SPEED: 55,       // 逃跑时移动速度
  NPC_WANDER_RADIUS: 3,   // 格
  HERO_WANDER_RADIUS: 2,
  CHAR_MIN_DIST: 20,       // 角色间最小距离（像素）
  COOP_CHECK_INTERVAL: 2,  // 协作检测间隔（秒）
  GREET_DIST: 3,           // 互动触发距离（格）
  GREET_COOLDOWN: 30,      // 互动冷却时间（秒）

  // ── 角色职业 AI 配置 ──
  _ROLE_PROFILES: {
    guard:    { speed: 24, wanderRadius: 5, talkChance: 0.15, idleRange: [1, 3],  talkCooldown: [25, 40], patrol: true },
    merchant: { speed: 15, wanderRadius: 1.5, talkChance: 0.5,  idleRange: [2, 4],  talkCooldown: [10, 18] },
    farmer:   { speed: 18, wanderRadius: 2, talkChance: 0.25, idleRange: [4, 8],  talkCooldown: [20, 30], workTarget: 'farmland' },
    child:    { speed: 28, wanderRadius: 5, talkChance: 0.4,  idleRange: [1, 2],  talkCooldown: [8, 15],  followChance: 0.3 },
    craftsman:{ speed: 16, wanderRadius: 2, talkChance: 0.2,  idleRange: [5, 10], talkCooldown: [20, 35], workTarget: 'blacksmith' },
    villager: { speed: 20, wanderRadius: 3, talkChance: 0.35, idleRange: [3, 6],  talkCooldown: [15, 25], socialChance: 0.25 },
  },

  _ROLE_MAP: {
    '守卫': 'guard', '巡逻兵': 'guard',
    '商贩': 'merchant', '农夫': 'farmer',
    '小孩': 'child', '工匠': 'craftsman',
    '村民': 'villager', '村妇': 'villager',
  },

  _COOP_LINES: {
    greet:     ['你好啊！', '嘿！', '今天怎么样？', '吃了没？', '天气不错啊'],
    guard_relay: ['前方一切正常！', '注意东门方向', '换岗了', '巡逻报告：平安'],
    merchant_callout: ['来看看嘞！', '新鲜货！', '走过路过别错过！', '今天打折！'],
    child_follow: ['等等我！', '哇好快！', '我也要去！', '一起玩！'],
  },

  _coopTimer: 0,

  // ── 初始化 ──
  init: function () {
    this._preloadImages();
    this._spawnNPCs();
    this._syncHeroes();
    EventBus.on('hero:added', this._syncHeroes.bind(this));

    // 城防战斗：居民逃跑
    var self = this;
    EventBus.on('td:wave_started', function () { self._enterWarMode(); });
    EventBus.on('td:wave_cleared', function () { self._exitWarMode(); });
    EventBus.on('td:wave_failed', function () { self._exitWarMode(); });
  },

  _preloadImages: function () {
    var names = [
      'npc_male', 'npc_female', 'npc_guard', 'npc_child',
      'hero_shu', 'hero_wei', 'hero_wu_m', 'hero_wu_f',
      'hero_qun_m', 'hero_qun_f'
    ];
    for (var i = 0; i < names.length; i++) {
      var img = new Image();
      img.src = 'assets/img/characters/' + names[i] + '.svg';
      this._images[names[i]] = img;
    }
  },

  // ── NPC 生成 ──
  _spawnNPCs: function () {
    var CELL = TownWorld.CELL;
    var spawns = [
      { gx: 12, gy: 12, sprite: 'npc_male',   name: '村民'  },
      { gx: 9,  gy: 16, sprite: 'npc_female',  name: '村妇'  },
      { gx: 8,  gy: 8,  sprite: 'npc_guard',   name: '守卫'  },
      { gx: 6,  gy: 17, sprite: 'npc_male',    name: '农夫'  },
      { gx: 14, gy: 12, sprite: 'npc_child',   name: '小孩'  },
      { gx: 19, gy: 12, sprite: 'npc_female',  name: '商贩'  },
      { gx: 16, gy: 17, sprite: 'npc_guard',   name: '巡逻兵'},
      { gx: 11, gy: 7,  sprite: 'npc_male',    name: '工匠'  },
    ];
    for (var i = 0; i < spawns.length; i++) {
      var s = spawns[i];
      var wx = s.gx * CELL + CELL / 2;
      var wy = s.gy * CELL + CELL / 2;
      var role = this._ROLE_MAP[s.name] || 'villager';
      var profile = this._ROLE_PROFILES[role];
      this._chars.push(this._createChar({
        id: 'npc_' + i,
        type: 'npc',
        name: s.name,
        sprite: s.sprite,
        role: role,
        x: wx, y: wy,
        homeX: wx, homeY: wy,
        speed: profile.speed || this.NPC_SPEED,
        wanderRadius: profile.wanderRadius || this.NPC_WANDER_RADIUS,
        talkCooldown: profile.talkCooldown
          ? profile.talkCooldown[0] + Math.random() * (profile.talkCooldown[1] - profile.talkCooldown[0])
          : 15 + Math.random() * 25,
      }));
    }
  },

  // ── 武将同步 ──
  _syncHeroes: function () {
    // 移除旧武将
    this._chars = this._chars.filter(function (c) { return c.type !== 'hero'; });

    var heroes = HeroManager.getAll();
    if (!heroes || heroes.length === 0) return;

    var CELL = TownWorld.CELL;
    var offsets = [
      { dx: 2, dy: 2 }, { dx: -1, dy: 2 }, { dx: 3, dy: 1 },
      { dx: -1, dy: -1 }, { dx: 0, dy: 3 }, { dx: 3, dy: 0 },
      { dx: -2, dy: 1 }, { dx: 1, dy: -1 }, { dx: 2, dy: -1 },
    ];

    for (var i = 0; i < heroes.length; i++) {
      var hero = heroes[i];
      var hData = NpcDialogues.heroes[hero.id];
      if (!hData) continue; // 跳过普通兵种

      var template = HeroManager.getTemplate(hero.id);
      if (!template) continue;

      // 确定家建筑位置
      var homeBuilding = hData.home;
      var placement = TownManager._state.placements[homeBuilding];
      var defaultPos = TownWorld._defaultPositions[homeBuilding];
      var bPos = placement || defaultPos || { gx: 10, gy: 10 };

      var off = offsets[i % offsets.length];
      var gx = bPos.gx + off.dx;
      var gy = bPos.gy + off.dy;
      // 限制在地图范围内
      gx = Math.max(1, Math.min(TownWorld.MAP_W - 2, gx));
      gy = Math.max(1, Math.min(TownWorld.MAP_H - 2, gy));

      var wx = gx * CELL + CELL / 2;
      var wy = gy * CELL + CELL / 2;

      // 确定精灵图
      var sprite = this._getHeroSprite(hData.faction, hData.gender);

      this._chars.push(this._createChar({
        id: 'hero_' + hero.id,
        type: 'hero',
        heroId: hero.id,
        heroUid: hero.uid,
        name: template.name,
        sprite: sprite,
        x: wx, y: wy,
        homeX: wx, homeY: wy,
        homeBuilding: homeBuilding,
        quality: template.quality,
        speed: this.HERO_SPEED,
        wanderRadius: this.HERO_WANDER_RADIUS,
        talkCooldown: 8 + Math.random() * 15,
      }));
    }
  },

  _getHeroSprite: function (faction, gender) {
    if (faction === 'shu') return 'hero_shu';
    if (faction === 'wei') return 'hero_wei';
    if (faction === 'wu') return gender === 'female' ? 'hero_wu_f' : 'hero_wu_m';
    if (faction === 'qun') return gender === 'female' ? 'hero_qun_f' : 'hero_qun_m';
    return 'hero_shu';
  },

  _createChar: function (opts) {
    return {
      id: opts.id,
      type: opts.type,
      heroId: opts.heroId || null,
      heroUid: opts.heroUid || null,
      name: opts.name,
      sprite: opts.sprite,
      role: opts.role || null,
      homeBuilding: opts.homeBuilding || null,
      quality: opts.quality || 1,

      x: opts.x,
      y: opts.y,
      homeX: opts.homeX,
      homeY: opts.homeY,
      targetX: opts.x,
      targetY: opts.y,

      state: 'idle',
      stateTimer: 2 + Math.random() * 4,
      direction: Math.random() < 0.5 ? 1 : -1,
      bobPhase: Math.random() * Math.PI * 2,

      bubble: null,
      speed: opts.speed,
      wanderRadius: opts.wanderRadius,
      talkCooldown: opts.talkCooldown || 15,

      // A* pathfinding state
      path: null,       // Array of {gx, gy} waypoints
      pathIndex: 0,     // Current waypoint index

      // Role AI state
      _patrolWaypoints: null,
      _patrolIndex: 0,
      _atWork: false,
      _greetCooldown: 0,
    };
  },

  // ── AI 更新（每帧调用） ──
  update: function (dt) {
    // 拿起动画
    if (this._dragChar && this._dragPickupAnim < 1) {
      this._dragPickupAnim = Math.min(1, this._dragPickupAnim + dt / this.PICKUP_DURATION);
    }
    // 放下动画
    if (this._dragDropAnim) {
      this._dragDropAnim.progress += dt / this.DROP_DURATION;
      if (this._dragDropAnim.progress >= 1) {
        this._dragDropAnim = null;
      }
    }

    for (var i = 0; i < this._chars.length; i++) {
      var c = this._chars[i];
      if (c.state === 'dragging') continue; // 拖拽中不更新 AI
      this._tickAI(c, dt);
    }

    // NPC 协作互动检测（非战时）
    if (!this._warMode) this._tickCooperation(dt);
  },

  _tickAI: function (c, dt) {
    // 气泡倒计时
    if (c.bubble) {
      c.bubble.timer -= dt;
      if (c.bubble.timer <= 0) {
        c.bubble = null;
      }
    }

    // 说话冷却
    c.talkCooldown -= dt;

    switch (c.state) {
      case 'idle':
        // 战时：已隐藏的角色不更新
        if (this._warMode) return;
        c.stateTimer -= dt;
        c._greetCooldown = Math.max(0, (c._greetCooldown || 0) - dt);
        if (c.stateTimer <= 0) {
          this._selectRoleBehavior(c);
        }
        break;

      case 'walking':
        this._moveToward(c, dt);
        break;

      case 'fleeing':
        this._moveToward(c, dt);
        // 到达目的地后隐藏（已被 _goIdle 切成 idle）
        if (c.state === 'idle' && this._warMode) {
          c.hidden = true;
        }
        break;

      case 'talking':
        c.stateTimer -= dt;
        if (c.stateTimer <= 0) {
          c.bubble = null;
          // 战时状态下说完话继续跑或继续战斗
          if (this._warMode) {
            if (c.state === 'talking' && (c.sprite === 'npc_guard' || c.type === 'hero')) {
              c.state = 'fighting';
            } else {
              var CELL = TownWorld.CELL;
              var thPos = this._getTownHallCenter();
              var offsetX = (Math.random() - 0.5) * CELL * 3;
              var offsetY = (Math.random() - 0.5) * CELL * 3;
              c.targetX = Math.max(CELL, Math.min(TownWorld.MAP_W * CELL - CELL, thPos.x + offsetX));
              c.targetY = Math.max(CELL, Math.min(TownWorld.MAP_H * CELL - CELL, thPos.y + offsetY));
              c.path = null;
              c.pathIndex = 0;
              c.state = 'fleeing';
            }
          } else {
            this._goIdle(c);
          }
        }
        break;

      case 'fighting':
        // 战斗状态：移到阵位后原地战斗
        this._tickFighting(c, dt);
        break;
    }
  },

  _goIdle: function (c) {
    c.state = 'idle';
    var profile = c.role ? this._ROLE_PROFILES[c.role] : null;
    if (profile && profile.idleRange) {
      c.stateTimer = profile.idleRange[0] + Math.random() * (profile.idleRange[1] - profile.idleRange[0]);
    } else {
      c.stateTimer = 3 + Math.random() * 5;
    }
  },

  // ── 职业行为决策 ──
  _selectRoleBehavior: function (c) {
    var profile = c.role ? this._ROLE_PROFILES[c.role] : null;
    var talkChance = profile ? profile.talkChance : 0.35;

    if (c.talkCooldown <= 0 && Math.random() < talkChance) {
      this._startTalking(c);
      return;
    }

    if (!profile) {
      this._startWandering(c);
      return;
    }

    switch (c.role) {
      case 'guard':
        this._startPatrolling(c);
        break;
      case 'child':
        if (Math.random() < (profile.followChance || 0)) {
          this._startFollowing(c);
        } else {
          this._startWandering(c);
        }
        break;
      case 'farmer':
      case 'craftsman':
        this._startCommuting(c);
        break;
      case 'villager':
        if (Math.random() < (profile.socialChance || 0)) {
          this._startSocializing(c);
        } else {
          this._startWandering(c);
        }
        break;
      case 'merchant':
        if (Math.random() < 0.7) {
          this._startCallout(c);
        } else {
          this._startWandering(c);
        }
        break;
      default:
        this._startWandering(c);
    }
  },

  // ── 守卫巡逻 ──
  _startPatrolling: function (c) {
    var CELL = TownWorld.CELL;
    if (!c._patrolWaypoints) {
      var homeGX = Math.floor(c.homeX / CELL);
      var homeGY = Math.floor(c.homeY / CELL);
      var r = 5;
      var pts = [
        { gx: homeGX + r, gy: homeGY },
        { gx: homeGX + r, gy: homeGY + r },
        { gx: homeGX,     gy: homeGY + r },
        { gx: homeGX - r, gy: homeGY + r },
        { gx: homeGX - r, gy: homeGY },
        { gx: homeGX - r, gy: homeGY - r },
        { gx: homeGX,     gy: homeGY - r },
        { gx: homeGX + r, gy: homeGY - r },
      ];
      // 巡逻兵反向巡逻，与守卫形成对向路线
      if (c.name === '巡逻兵') pts.reverse();
      for (var i = 0; i < pts.length; i++) {
        pts[i].gx = Math.max(1, Math.min(TownWorld.MAP_W - 2, pts[i].gx));
        pts[i].gy = Math.max(1, Math.min(TownWorld.MAP_H - 2, pts[i].gy));
      }
      c._patrolWaypoints = pts;
      c._patrolIndex = 0;
    }

    // 尝试找到可行走的巡逻点
    var startIdx = c._patrolIndex;
    for (var attempt = 0; attempt < c._patrolWaypoints.length; attempt++) {
      var wp = c._patrolWaypoints[c._patrolIndex];
      c._patrolIndex = (c._patrolIndex + 1) % c._patrolWaypoints.length;
      var tx = wp.gx * CELL + CELL / 2;
      var ty = wp.gy * CELL + CELL / 2;
      if (!TownWorld.isPixelWalkable(tx, ty)) continue;

      c.targetX = tx;
      c.targetY = ty;
      var fromGX = Math.floor(c.x / CELL);
      var fromGY = Math.floor(c.y / CELL);
      var path = this._findPath(fromGX, fromGY, wp.gx, wp.gy);
      if (path && path.length > 0) {
        c.path = path;
        c.pathIndex = 0;
        c.targetX = path[0].gx * CELL + CELL / 2;
        c.targetY = path[0].gy * CELL + CELL / 2;
      } else {
        c.path = null;
        c.pathIndex = 0;
      }

      c.state = 'walking';
      c.direction = c.targetX >= c.x ? 1 : -1;
      return;
    }
    // 所有巡逻点不可达，回退普通漫步
    this._startWandering(c);
  },

  // ── 小孩跟随最近的非小孩角色 ──
  _startFollowing: function (c) {
    var nearest = this._getNearestChar(c, function (other) {
      return other.role !== 'child' && other.state !== 'dragging';
    });
    if (!nearest) {
      this._startWandering(c);
      return;
    }

    var CELL = TownWorld.CELL;
    var offsetAngle = Math.random() * Math.PI * 2;
    var tx = nearest.x + Math.cos(offsetAngle) * CELL;
    var ty = nearest.y + Math.sin(offsetAngle) * CELL;
    tx = Math.max(CELL, Math.min(TownWorld.MAP_W * CELL - CELL, tx));
    ty = Math.max(CELL, Math.min(TownWorld.MAP_H * CELL - CELL, ty));

    if (!TownWorld.isPixelWalkable(tx, ty)) {
      this._startWandering(c);
      return;
    }

    c.targetX = tx;
    c.targetY = ty;
    var fromGX = Math.floor(c.x / CELL);
    var fromGY = Math.floor(c.y / CELL);
    var toGX = Math.floor(tx / CELL);
    var toGY = Math.floor(ty / CELL);
    var path = this._findPath(fromGX, fromGY, toGX, toGY);
    if (path && path.length > 0) {
      c.path = path;
      c.pathIndex = 0;
      c.targetX = path[0].gx * CELL + CELL / 2;
      c.targetY = path[0].gy * CELL + CELL / 2;
    } else {
      c.path = null;
      c.pathIndex = 0;
    }

    c.state = 'walking';
    c.direction = c.targetX >= c.x ? 1 : -1;

    if (!c.bubble && Math.random() < 0.4) {
      var lines = this._COOP_LINES.child_follow;
      c.bubble = { text: lines[Utils.randInt(0, lines.length - 1)], timer: 2, isClick: false };
    }
  },

  // ── 农夫/工匠通勤：家 ↔ 工作建筑 ──
  _startCommuting: function (c) {
    var CELL = TownWorld.CELL;
    var profile = this._ROLE_PROFILES[c.role];
    var target;

    if (!c._atWork && profile.workTarget) {
      target = this._getBuildingFront(profile.workTarget);
      if (target) c._atWork = true;
    }

    if (!target) {
      c._atWork = false;
      target = { x: c.homeX, y: c.homeY };
    }

    // 已在目标附近则切换目标、普通漫步
    var dx = target.x - c.x;
    var dy = target.y - c.y;
    if (dx * dx + dy * dy < CELL * CELL * 4) {
      c._atWork = !c._atWork;
      this._startWandering(c);
      return;
    }

    c.targetX = target.x;
    c.targetY = target.y;
    var fromGX = Math.floor(c.x / CELL);
    var fromGY = Math.floor(c.y / CELL);
    var toGX = Math.floor(target.x / CELL);
    var toGY = Math.floor(target.y / CELL);
    var path = this._findPath(fromGX, fromGY, toGX, toGY);
    if (path && path.length > 0) {
      c.path = path;
      c.pathIndex = 0;
      c.targetX = path[0].gx * CELL + CELL / 2;
      c.targetY = path[0].gy * CELL + CELL / 2;
    } else {
      c.path = null;
      c.pathIndex = 0;
    }

    c.state = 'walking';
    c.direction = c.targetX >= c.x ? 1 : -1;
  },

  // ── 村民社交：走向最近的空闲角色 ──
  _startSocializing: function (c) {
    var nearest = this._getNearestChar(c, function (other) {
      return other.state === 'idle';
    });
    if (!nearest) {
      this._startWandering(c);
      return;
    }

    var CELL = TownWorld.CELL;
    var tx = nearest.x + (Math.random() - 0.5) * CELL;
    var ty = nearest.y + (Math.random() - 0.5) * CELL;
    tx = Math.max(CELL, Math.min(TownWorld.MAP_W * CELL - CELL, tx));
    ty = Math.max(CELL, Math.min(TownWorld.MAP_H * CELL - CELL, ty));

    if (!TownWorld.isPixelWalkable(tx, ty)) {
      this._startWandering(c);
      return;
    }

    c.targetX = tx;
    c.targetY = ty;
    c.path = null;
    c.pathIndex = 0;
    var fromGX = Math.floor(c.x / CELL);
    var fromGY = Math.floor(c.y / CELL);
    var toGX = Math.floor(tx / CELL);
    var toGY = Math.floor(ty / CELL);
    if (Math.abs(fromGX - toGX) + Math.abs(fromGY - toGY) > 2) {
      var path = this._findPath(fromGX, fromGY, toGX, toGY);
      if (path && path.length > 0) {
        c.path = path;
        c.pathIndex = 0;
        c.targetX = path[0].gx * CELL + CELL / 2;
        c.targetY = path[0].gy * CELL + CELL / 2;
      }
    }

    c.state = 'walking';
    c.direction = c.targetX >= c.x ? 1 : -1;
  },

  // ── 商贩叫卖 ──
  _startCallout: function (c) {
    var lines = this._COOP_LINES.merchant_callout;
    var duration = 3 + Math.random() * 2;
    c.bubble = { text: lines[Utils.randInt(0, lines.length - 1)], timer: duration, isClick: false };
    c.state = 'talking';
    c.stateTimer = duration;
    var profile = this._ROLE_PROFILES[c.role];
    c.talkCooldown = profile.talkCooldown[0] + Math.random() * (profile.talkCooldown[1] - profile.talkCooldown[0]);
  },

  // ── 获取建筑前方位置 ──
  _getBuildingFront: function (buildingId) {
    if (typeof TownManager === 'undefined') return null;
    var CELL = TownWorld.CELL;
    var placement = TownManager._state.placements[buildingId];
    var defaultPos = TownWorld._defaultPositions ? TownWorld._defaultPositions[buildingId] : null;
    var pos = placement || defaultPos;
    if (!pos) return null;
    var size = TownWorld._buildingSizes ? TownWorld._buildingSizes[buildingId] : { w: 2, h: 2 };
    return {
      x: (pos.gx + size.w / 2) * CELL,
      y: (pos.gy + size.h + 0.5) * CELL
    };
  },

  // ── 找最近角色 ──
  _getNearestChar: function (c, filter) {
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < this._chars.length; i++) {
      var other = this._chars[i];
      if (other === c || other.hidden) continue;
      if (filter && !filter(other)) continue;
      var dx = other.x - c.x;
      var dy = other.y - c.y;
      var d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = other; }
    }
    return best;
  },

  // ── NPC 协作互动检测 ──
  _tickCooperation: function (dt) {
    this._coopTimer -= dt;
    if (this._coopTimer > 0) return;
    this._coopTimer = this.COOP_CHECK_INTERVAL;

    var CELL = TownWorld.CELL;
    var greetDist2 = Math.pow(this.GREET_DIST * CELL, 2);

    for (var i = 0; i < this._chars.length; i++) {
      var a = this._chars[i];
      if (a.state !== 'idle' || a.hidden || a.bubble) continue;
      if ((a._greetCooldown || 0) > 0) continue;

      for (var j = i + 1; j < this._chars.length; j++) {
        var b = this._chars[j];
        if (b.state !== 'idle' || b.hidden || b.bubble) continue;
        if ((b._greetCooldown || 0) > 0) continue;

        var dx = a.x - b.x;
        var dy = a.y - b.y;
        if (dx * dx + dy * dy > greetDist2) continue;

        if (Math.random() > 0.3) continue;

        // 面朝对方
        a.direction = b.x > a.x ? 1 : -1;
        b.direction = a.x > b.x ? 1 : -1;

        // 根据角色职业选择互动台词
        var linesA, linesB;
        if (a.role === 'guard' && b.role === 'guard') {
          linesA = this._COOP_LINES.guard_relay;
          linesB = this._COOP_LINES.guard_relay;
        } else if (a.role === 'merchant') {
          linesA = this._COOP_LINES.merchant_callout;
          linesB = this._COOP_LINES.greet;
        } else if (b.role === 'merchant') {
          linesA = this._COOP_LINES.greet;
          linesB = this._COOP_LINES.merchant_callout;
        } else {
          linesA = this._COOP_LINES.greet;
          linesB = this._COOP_LINES.greet;
        }

        a.bubble = { text: linesA[Utils.randInt(0, linesA.length - 1)], timer: 3, isClick: false };
        b.bubble = { text: linesB[Utils.randInt(0, linesB.length - 1)], timer: 3, isClick: false };

        a._greetCooldown = this.GREET_COOLDOWN;
        b._greetCooldown = this.GREET_COOLDOWN;
        break;
      }
    }
  },

  _startWandering: function (c) {
    var CELL = TownWorld.CELL;

    // 英雄：根据建筑当前位置更新家坐标
    if (c.type === 'hero' && c.homeBuilding) {
      var placement = TownManager._state.placements[c.homeBuilding];
      var defaultPos = TownWorld._defaultPositions[c.homeBuilding];
      var bPos = placement || defaultPos;
      if (bPos) {
        var bSize = TownWorld._buildingSizes[c.homeBuilding] || { w: 2, h: 2 };
        c.homeX = (bPos.gx + bSize.w / 2) * CELL;
        c.homeY = (bPos.gy + bSize.h + 0.5) * CELL;
      }
    }

    var radius = c.wanderRadius * CELL;
    var mapPixels = TownWorld.MAP_W * CELL;
    var found = false;

    for (var attempt = 0; attempt < 8; attempt++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = Math.random() * radius;
      var tx = c.homeX + Math.cos(angle) * dist;
      var ty = c.homeY + Math.sin(angle) * dist;

      // 限制在地图范围内
      tx = Math.max(CELL, Math.min(mapPixels - CELL, tx));
      ty = Math.max(CELL, Math.min(mapPixels - CELL, ty));

      // 检查建筑碰撞
      if (!TownWorld.isPixelWalkable(tx, ty)) continue;

      // 检查与静止角色的距离
      var tooClose = false;
      for (var j = 0; j < this._chars.length; j++) {
        var other = this._chars[j];
        if (other === c || other.state === 'walking') continue;
        var ddx = tx - other.x;
        var ddy = ty - other.y;
        if (ddx * ddx + ddy * ddy < this.CHAR_MIN_DIST * this.CHAR_MIN_DIST) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      c.targetX = tx;
      c.targetY = ty;
      found = true;
      break;
    }

    if (!found) {
      this._goIdle(c);
      return;
    }

    // Try A* pathfinding for longer distances
    var fromGX = Math.floor(c.x / CELL);
    var fromGY = Math.floor(c.y / CELL);
    var toGX = Math.floor(c.targetX / CELL);
    var toGY = Math.floor(c.targetY / CELL);
    var gridDist = Math.abs(fromGX - toGX) + Math.abs(fromGY - toGY);

    if (gridDist > 2) {
      var path = this._findPath(fromGX, fromGY, toGX, toGY);
      if (path && path.length > 0) {
        c.path = path;
        c.pathIndex = 0;
        // Set first waypoint as target
        var wp = path[0];
        c.targetX = wp.gx * CELL + CELL / 2;
        c.targetY = wp.gy * CELL + CELL / 2;
      } else {
        c.path = null;
        c.pathIndex = 0;
      }
    } else {
      c.path = null;
      c.pathIndex = 0;
    }

    c.state = 'walking';
    c.direction = c.targetX >= c.x ? 1 : -1;
  },

  _moveToward: function (c, dt) {
    var dx = c.targetX - c.x;
    var dy = c.targetY - c.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      c.x = c.targetX;
      c.y = c.targetY;

      // If following A* path, advance to next waypoint
      if (c.path && c.pathIndex < c.path.length - 1) {
        c.pathIndex++;
        var wp = c.path[c.pathIndex];
        var CELL = TownWorld.CELL;
        c.targetX = wp.gx * CELL + CELL / 2;
        c.targetY = wp.gy * CELL + CELL / 2;
        c.direction = c.targetX >= c.x ? 1 : -1;
        return;
      }

      // Path complete or no path
      c.path = null;
      c.pathIndex = 0;
      this._goIdle(c);
      return;
    }

    var step = c.speed * dt;
    var newX = c.x + (dx / dist) * step;
    var newY = c.y + (dy / dist) * step;

    // 检查建筑碰撞
    if (!TownWorld.isPixelWalkable(newX, newY)) {
      c.path = null;
      c.pathIndex = 0;
      this._goIdle(c);
      return;
    }

    // 检查与非行走角色的距离
    for (var i = 0; i < this._chars.length; i++) {
      var other = this._chars[i];
      if (other === c || other.state === 'walking') continue;
      var odx = newX - other.x;
      var ody = newY - other.y;
      if (odx * odx + ody * ody < this.CHAR_MIN_DIST * this.CHAR_MIN_DIST) {
        c.path = null;
        c.pathIndex = 0;
        this._goIdle(c);
        return;
      }
    }

    c.x = newX;
    c.y = newY;
    c.direction = dx > 0 ? 1 : -1;
    c.bobPhase += dt * 8;
  },

  /** A* pathfinding with road preference */
  _findPath: function (fromGX, fromGY, toGX, toGY) {
    if (typeof TownWorld === 'undefined') return null;
    var MAP_W = TownWorld.MAP_W;
    var MAP_H = TownWorld.MAP_H;
    var roadGrid = TownWorld._roadGrid;
    var MAX_NODES = 800;

    // Validate endpoints
    if (fromGX < 0 || fromGY < 0 || fromGX >= MAP_W || fromGY >= MAP_H) return null;
    if (toGX < 0 || toGY < 0 || toGX >= MAP_W || toGY >= MAP_H) return null;
    if (!TownWorld.isWalkable(toGX, toGY)) return null;

    var key = function (gx, gy) { return gy * MAP_W + gx; };
    var heuristic = function (gx, gy) {
      return Math.abs(gx - toGX) + Math.abs(gy - toGY);
    };

    // Simple binary heap for open set (min-heap by f score)
    var openSet = [];
    var gScore = {};
    var cameFrom = {};
    var closedSet = {};
    var explored = 0;

    var startKey = key(fromGX, fromGY);
    gScore[startKey] = 0;
    openSet.push({ gx: fromGX, gy: fromGY, f: heuristic(fromGX, fromGY), key: startKey });

    var dirs = [[1,0],[-1,0],[0,1],[0,-1]];

    while (openSet.length > 0 && explored < MAX_NODES) {
      // Find min-f node (simple linear scan — adequate for 40×40 grid)
      var minIdx = 0;
      for (var oi = 1; oi < openSet.length; oi++) {
        if (openSet[oi].f < openSet[minIdx].f) minIdx = oi;
      }
      var current = openSet[minIdx];
      openSet.splice(minIdx, 1);

      if (current.gx === toGX && current.gy === toGY) {
        // Reconstruct path
        var path = [];
        var ck = current.key;
        while (cameFrom[ck] !== undefined) {
          var cy = Math.floor(ck / MAP_W);
          var cx = ck % MAP_W;
          path.unshift({ gx: cx, gy: cy });
          ck = cameFrom[ck];
        }
        return path;
      }

      closedSet[current.key] = true;
      explored++;

      for (var d = 0; d < dirs.length; d++) {
        var nx = current.gx + dirs[d][0];
        var ny = current.gy + dirs[d][1];
        if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
        if (!TownWorld.isWalkable(nx, ny)) continue;

        var nk = key(nx, ny);
        if (closedSet[nk]) continue;

        // Movement cost: 1.0 for road, 3.0 for non-road
        var moveCost = (roadGrid && roadGrid[ny][nx] > 0) ? 1.0 : 3.0;
        var tentativeG = gScore[current.key] + moveCost;

        if (gScore[nk] !== undefined && tentativeG >= gScore[nk]) continue;

        gScore[nk] = tentativeG;
        cameFrom[nk] = current.key;
        var f = tentativeG + heuristic(nx, ny);

        // Check if already in openSet
        var inOpen = false;
        for (var oj = 0; oj < openSet.length; oj++) {
          if (openSet[oj].key === nk) {
            openSet[oj].f = f;
            inOpen = true;
            break;
          }
        }
        if (!inOpen) {
          openSet.push({ gx: nx, gy: ny, f: f, key: nk });
        }
      }
    }

    return null; // No path found within limit
  },

  // ── 战时逃跑 ──
  _enterWarMode: function () {
    if (this._warMode) return;
    this._warMode = true;

    var CELL = TownWorld.CELL;
    // 找到城主府位置作为逃跑目标
    var thPos = this._getTownHallCenter();

    // 收集派驻武将 UID（他们上阵杀敌）
    var fightingUids = [];
    if (typeof TowerDefenseManager !== 'undefined' && TowerDefenseManager._state) {
      fightingUids = TowerDefenseManager._state.assignedHeroes || [];
    }

    for (var i = 0; i < this._chars.length; i++) {
      var c = this._chars[i];
      if (c.state === 'dragging') continue;

      // 判断是否为战斗角色（派驻武将 或 守卫NPC）
      var isFighter = false;
      if (c.type === 'hero' && c.heroUid && fightingUids.indexOf(c.heroUid) !== -1) {
        isFighter = true;
      }
      if (c.sprite === 'npc_guard') {
        isFighter = true;
      }

      if (isFighter) {
        // 战斗角色：进入战斗状态，移向城墙前沿
        var combatLines = ['护城！', '杀敌！', '保卫家园！', '列阵迎敌！', '随我冲！'];
        c.bubble = { text: combatLines[Utils.randInt(0, combatLines.length - 1)], timer: 3, isClick: false };
        c.state = 'fighting';
        c.speed = this.HERO_SPEED + 5;
        // 战斗位置：城主府前方（靠近敌人来路方向）
        var fightOffsetX = (Math.random() - 0.5) * CELL * 5;
        var fightOffsetY = -CELL * (3 + Math.random() * 3); // 城主府前方（上方）
        c.targetX = Math.max(CELL, Math.min(TownWorld.MAP_W * CELL - CELL, thPos.x + fightOffsetX));
        c.targetY = Math.max(CELL, Math.min(TownWorld.MAP_H * CELL - CELL, thPos.y + fightOffsetY));
        c.path = null;
        c.pathIndex = 0;
        c._fightTimer = 0; // 攻击动画计时
        c._fightFlash = 0; // 攻击闪白效果
        c.direction = 1;
        continue;
      }

      // 平民：逃跑
      if (typeof TDWarDialogues !== 'undefined' && TDWarDialogues.length > 0) {
        var text = TDWarDialogues[Utils.randInt(0, TDWarDialogues.length - 1)];
        c.bubble = { text: text, timer: 3 + Math.random() * 2, isClick: false };
      }

      // 设定逃跑目标到城主府附近（加随机偏移防止挤一块）
      var offsetX = (Math.random() - 0.5) * CELL * 3;
      var offsetY = (Math.random() - 0.5) * CELL * 3;
      c.targetX = Math.max(CELL, Math.min(TownWorld.MAP_W * CELL - CELL, thPos.x + offsetX));
      c.targetY = Math.max(CELL, Math.min(TownWorld.MAP_H * CELL - CELL, thPos.y + offsetY));

      // 用 A* 寻路
      var fromGX = Math.floor(c.x / CELL);
      var fromGY = Math.floor(c.y / CELL);
      var toGX = Math.floor(c.targetX / CELL);
      var toGY = Math.floor(c.targetY / CELL);
      var path = this._findPath(fromGX, fromGY, toGX, toGY);
      if (path && path.length > 0) {
        c.path = path;
        c.pathIndex = 0;
        c.targetX = path[0].gx * CELL + CELL / 2;
        c.targetY = path[0].gy * CELL + CELL / 2;
      } else {
        c.path = null;
        c.pathIndex = 0;
      }

      c.state = 'fleeing';
      c.speed = this.FLEE_SPEED;
      c.direction = c.targetX >= c.x ? 1 : -1;
    }
  },

  _exitWarMode: function () {
    if (!this._warMode) return;
    this._warMode = false;

    for (var i = 0; i < this._chars.length; i++) {
      var c = this._chars[i];
      if (c.state === 'dragging') continue;
      c.speed = c.type === 'hero' ? this.HERO_SPEED
        : (c.role && this._ROLE_PROFILES[c.role]) ? this._ROLE_PROFILES[c.role].speed
        : this.NPC_SPEED;
      c.bubble = null;
      c.hidden = false;
      c._fightTimer = 0;
      c._fightFlash = 0;
      c.path = null;
      c.pathIndex = 0;
      this._goIdle(c);
    }
  },

  // ── 战斗行为 ──
  _tickFighting: function (c, dt) {
    // 先移动到战斗位置
    var dx = c.targetX - c.x;
    var dy = c.targetY - c.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 4) {
      var step = c.speed * dt;
      c.x += (dx / dist) * step;
      c.y += (dy / dist) * step;
      c.direction = dx > 0 ? 1 : -1;
      c.bobPhase += dt * 8;
      return;
    }

    // 到达阵位 → 攻击动画
    if (!c._fightTimer) c._fightTimer = 0;
    c._fightTimer += dt;
    c._fightFlash = Math.max(0, (c._fightFlash || 0) - dt * 3);

    // 每 2~3 秒执行一次攻击动画
    if (c._fightTimer >= 2.5) {
      c._fightTimer -= 2.5;
      c._fightFlash = 1.0; // 触发攻击闪光

      // 面朝最近敌人
      if (typeof TowerDefenseManager !== 'undefined' && TowerDefenseManager._battle &&
          TowerDefenseManager._battle.enemies) {
        var enemies = TowerDefenseManager._battle.enemies;
        var nearest = null;
        var nearDist = Infinity;
        for (var i = 0; i < enemies.length; i++) {
          var e = enemies[i];
          if (e.status === 'dead') continue;
          var edx = e.x - c.x;
          var edy = e.y - c.y;
          var ed = edx * edx + edy * edy;
          if (ed < nearDist) { nearDist = ed; nearest = e; }
        }
        if (nearest) {
          c.direction = nearest.x > c.x ? 1 : -1;
        }
      }

      // 偶尔喊战斗台词
      if (!c.bubble && Math.random() < 0.2) {
        var shouts = ['看我一招！', '受死吧！', '哈！', '休想靠近！', '保护城主府！'];
        c.bubble = { text: shouts[Utils.randInt(0, shouts.length - 1)], timer: 1.5, isClick: false };
      }
    }
  },

  _getTownHallCenter: function () {
    var CELL = TownWorld.CELL;
    // 尝试从 TownManager 获取城主府位置
    if (typeof TownManager !== 'undefined' && TownManager._state && TownManager._state.placements) {
      var placement = TownManager._state.placements['town_hall'];
      var defaultPos = TownWorld._defaultPositions ? TownWorld._defaultPositions['town_hall'] : null;
      var pos = placement || defaultPos;
      if (pos) {
        var size = TownWorld._buildingSizes ? TownWorld._buildingSizes['town_hall'] : { w: 4, h: 4 };
        return {
          x: (pos.gx + size.w / 2) * CELL,
          y: (pos.gy + size.h / 2) * CELL
        };
      }
    }
    // 默认中心
    return { x: TownWorld.MAP_W * CELL / 2, y: TownWorld.MAP_H * CELL / 2 };
  },

  _startTalking: function (c) {
    var text = null;
    if (c.type === 'hero') {
      var hd = NpcDialogues.heroes[c.heroId];
      if (hd && hd.idle.length > 0) {
        text = hd.idle[Utils.randInt(0, hd.idle.length - 1)];
      }
    } else {
      // 优先使用职业专属台词（60%概率）
      var roleLines = NpcDialogues.roleIdle && NpcDialogues.roleIdle[c.role];
      if (roleLines && roleLines.length > 0 && Math.random() < 0.6) {
        text = roleLines[Utils.randInt(0, roleLines.length - 1)];
      } else {
        text = NpcDialogues.npcIdle[Utils.randInt(0, NpcDialogues.npcIdle.length - 1)];
      }
    }

    if (!text) {
      this._goIdle(c);
      return;
    }

    var duration = 3 + Math.random() * 2;
    c.bubble = { text: text, timer: duration, isClick: false };
    c.state = 'talking';
    c.stateTimer = duration;
    // 重置冷却（使用职业配置）
    if (c.type === 'hero') {
      c.talkCooldown = 12 + Math.random() * 13;
    } else {
      var profile = c.role ? this._ROLE_PROFILES[c.role] : null;
      c.talkCooldown = (profile && profile.talkCooldown)
        ? profile.talkCooldown[0] + Math.random() * (profile.talkCooldown[1] - profile.talkCooldown[0])
        : 18 + Math.random() * 22;
    }
  },

  // ── 点击交互 ──
  handleTap: function (c) {
    // 拖拽中不响应点击
    if (this._dragChar) return;

    var text = null;
    if (c.type === 'hero') {
      var hd = NpcDialogues.heroes[c.heroId];
      if (hd && hd.click.length > 0) {
        text = hd.click[Utils.randInt(0, hd.click.length - 1)];
      }
    } else {
      text = NpcDialogues.npcClick[Utils.randInt(0, NpcDialogues.npcClick.length - 1)];
    }

    if (text) {
      c.state = 'talking';
      c.stateTimer = 4;
      c.bubble = { text: text, timer: 4, isClick: true };
    }
  },

  // ── 点击检测 ──
  hitTest: function (wx, wy) {
    var W = this.HIT_W;
    var H = this.HIT_H;
    for (var i = this._chars.length - 1; i >= 0; i--) {
      var c = this._chars[i];
      if (wx >= c.x - W / 2 && wx <= c.x + W / 2 &&
          wy >= c.y - H && wy <= c.y) {
        return c;
      }
    }
    return null;
  },

  // ── 拖拽系统 ──
  startDrag: function (c, wx, wy) {
    this._dragChar = c;
    this._dragOffsetX = c.x - wx;
    this._dragOffsetY = c.y - wy;
    this._dragPickupAnim = 0;
    this._dragDropAnim = null;
    // 暂停角色 AI
    c._prevState = c.state;
    c.state = 'dragging';
    c.bubble = null;
  },

  moveDrag: function (wx, wy) {
    if (!this._dragChar) return;
    var c = this._dragChar;
    c.x = wx + this._dragOffsetX;
    c.y = wy + this._dragOffsetY;
    // 限制在地图范围内
    var CELL = TownWorld.CELL;
    var mapPx = TownWorld.MAP_W * CELL;
    c.x = Math.max(CELL, Math.min(mapPx - CELL, c.x));
    c.y = Math.max(CELL, Math.min(mapPx - CELL, c.y));
  },

  endDrag: function () {
    if (!this._dragChar) return;
    var c = this._dragChar;

    // 检查放置是否合法（不在建筑上）
    if (!TownWorld.isPixelWalkable(c.x, c.y)) {
      // 弹回原位
      c.x = c.homeX;
      c.y = c.homeY;
      EventBus.emit('toast:show', { type: 'warning', message: '此处无法放置角色' });
    } else {
      // 更新家坐标
      c.homeX = c.x;
      c.homeY = c.y;
    }

    // 启动放下动画
    this._dragDropAnim = { char: c, progress: 0 };
    c.state = 'idle';
    c.stateTimer = 2 + Math.random() * 3;
    this._dragChar = null;
  },

  isDragging: function () {
    return !!this._dragChar;
  },

  // ── 渲染 ──
  draw: function (ctx) {
    // 按 Y 坐标排序（深度排序），拖拽角色最后绘制（在最上层）
    var self = this;
    var sorted = this._chars.slice().sort(function (a, b) {
      var aDrag = (self._dragChar === a) ? 1 : 0;
      var bDrag = (self._dragChar === b) ? 1 : 0;
      if (aDrag !== bDrag) return aDrag - bDrag;
      return a.y - b.y;
    });

    // 收集已绘制气泡的矩形，用于防重叠
    var drawnBubbles = [];

    for (var i = 0; i < sorted.length; i++) {
      this._drawCharacter(ctx, sorted[i], drawnBubbles);
    }
  },

  _drawCharacter: function (ctx, c, drawnBubbles) {
    // 隐藏的角色不绘制（战时躲在主城里）
    if (c.hidden) return;

    var img = this._images[c.sprite];
    var W = this.CHAR_W;
    var H = this.CHAR_H;

    var isDragged = (this._dragChar === c);
    var isDropping = (this._dragDropAnim && this._dragDropAnim.char === c);

    // 计算拖拽相关参数
    var liftY = 0;
    var scale = 1;
    var shadowScale = 1;
    var shadowAlpha = 0.12;

    if (isDragged) {
      var t = this._easeOutBack(this._dragPickupAnim);
      liftY = this.DRAG_LIFT * t;
      scale = 1 + (this.DRAG_SCALE - 1) * t;
      shadowScale = 1 + 0.4 * t; // 阴影变大
      shadowAlpha = 0.12 - 0.06 * t; // 阴影变淡（离地效果）
    } else if (isDropping) {
      var dropT = this._easeInQuad(this._dragDropAnim.progress);
      liftY = this.DRAG_LIFT * (1 - dropT);
      scale = 1 + (this.DRAG_SCALE - 1) * (1 - dropT);
      shadowScale = 1 + 0.4 * (1 - dropT);
      shadowAlpha = 0.12 - 0.06 * (1 - dropT);
    }

    // 行走弹跳（拖拽时不弹跳）
    var bobY = 0;
    if (c.state === 'walking' || c.state === 'fleeing') {
      bobY = Math.sin(c.bobPhase) * 1.5;
    } else if (c.state === 'fighting') {
      bobY = Math.sin(c.bobPhase) * 1;
      c.bobPhase += 0; // fighting bob driven by _tickFighting
    }

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,' + shadowAlpha + ')';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, W * 0.3 * shadowScale, 3 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 拖拽选中光圈
    if (isDragged) {
      ctx.save();
      ctx.strokeStyle = 'rgba(245,197,24,0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, W * 0.45, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 精灵图
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(c.x, c.y - H + bobY - liftY);
      if (c.direction < 0) {
        ctx.scale(-1, 1);
      }
      // 缩放
      if (scale !== 1) {
        ctx.translate(0, H); // 以脚底为锚点缩放
        ctx.scale(scale, scale);
        ctx.translate(0, -H);
      }
      ctx.drawImage(img, -W / 2, 0, W, H);
      // 战斗攻击闪光
      if (c.state === 'fighting' && c._fightFlash > 0) {
        ctx.globalAlpha = c._fightFlash * 0.5;
        ctx.fillStyle = '#fff';
        ctx.fillRect(-W / 2, 0, W, H);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    } else {
      // 降级：彩色圆点
      ctx.fillStyle = c.type === 'hero' ? '#c0392b' : '#999';
      ctx.beginPath();
      ctx.arc(c.x, c.y - H / 2 + bobY - liftY, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // 名字标签（拖拽时名字跟随人物上浮）
    var nameLiftY = isDragged ? liftY : (isDropping ? liftY : 0);
    ctx.font = 'bold 9px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    var nameText = c.name;
    var nameW = ctx.measureText(nameText).width + 6;
    // 背景条
    ctx.fillStyle = isDragged ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)';
    this._roundRect(ctx, c.x - nameW / 2, c.y + 2 - nameLiftY, nameW, 13, 3);
    ctx.fill();

    // 名字颜色（武将按品质，NPC 灰色）
    if (c.type === 'hero') {
      var qColors = { 5: '#d4a849', 4: '#8b5ea8', 3: '#4a7fb5', 2: '#5d8a48', 1: '#b0a898' };
      ctx.fillStyle = qColors[c.quality] || '#d4a849';
    } else {
      ctx.fillStyle = '#ccc';
    }
    ctx.fillText(nameText, c.x, c.y + 3 - nameLiftY);

    // 气泡（拖拽时不显示）
    if (c.bubble && !isDragged) {
      this._drawBubble(ctx, c, drawnBubbles);
    }
  },

  // ── 气泡绘制 ──
  _drawBubble: function (ctx, c, drawnBubbles) {
    var text = c.bubble.text;
    var isClick = c.bubble.isClick;

    ctx.save();
    ctx.font = (isClick ? '11' : '10') + 'px "Microsoft YaHei", sans-serif';

    // 自动换行
    var maxLineW = 100;
    var lines = this._wrapText(ctx, text, maxLineW);
    var lineH = isClick ? 14 : 12;
    var padding = 6;

    var maxW = 0;
    for (var li = 0; li < lines.length; li++) {
      var lw = ctx.measureText(lines[li]).width;
      if (lw > maxW) maxW = lw;
    }

    var bw = maxW + padding * 2;
    var bh = lines.length * lineH + padding * 2;
    var bx = c.x;
    var by = c.y - this.CHAR_H - bh - 10;

    // ── 气泡防重叠 ──
    if (drawnBubbles) {
      var bubbleRect = { x: bx - bw / 2, y: by, w: bw, h: bh };
      var maxShift = 120; // 最大上移像素，防止飞出画面
      var totalShift = 0;
      var hasOverlap = true;
      while (hasOverlap && totalShift < maxShift) {
        hasOverlap = false;
        for (var bi = 0; bi < drawnBubbles.length; bi++) {
          var other = drawnBubbles[bi];
          // AABB 碰撞检测
          if (bubbleRect.x < other.x + other.w &&
              bubbleRect.x + bubbleRect.w > other.x &&
              bubbleRect.y < other.y + other.h &&
              bubbleRect.y + bubbleRect.h > other.y) {
            // 上移到 other 上方，留 4px 间距
            var shift = (bubbleRect.y + bubbleRect.h) - other.y + 4;
            if (shift > 0) {
              bubbleRect.y = other.y - bubbleRect.h - 4;
              by = bubbleRect.y;
              totalShift += shift;
              hasOverlap = true;
              break; // 重新检查所有已有气泡
            }
          }
        }
      }
      drawnBubbles.push(bubbleRect);
    }

    // 淡入淡出
    var alpha = 1;
    if (c.bubble.timer < 0.5) alpha = c.bubble.timer / 0.5;
    ctx.globalAlpha = alpha;

    var bgColor = isClick ? 'rgba(255,255,240,0.95)' : 'rgba(255,255,255,0.92)';
    var borderColor = isClick ? 'rgba(229,165,0,0.7)' : 'rgba(0,0,0,0.2)';

    // 气泡背景
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isClick ? 1.5 : 1;

    var rx = bx - bw / 2;
    var ry = by;
    this._roundRect(ctx, rx, ry, bw, bh, 6);
    ctx.fill();
    ctx.stroke();

    // 三角箭头
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.moveTo(bx - 5, ry + bh);
    ctx.lineTo(bx + 5, ry + bh);
    ctx.lineTo(bx, ry + bh + 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    ctx.moveTo(bx - 5, ry + bh);
    ctx.lineTo(bx, ry + bh + 7);
    ctx.lineTo(bx + 5, ry + bh);
    ctx.stroke();

    // 武将名字（点击气泡显示）
    if (isClick && c.type === 'hero') {
      ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      var qCol = { 5: '#d4a849', 4: '#8b5ea8', 3: '#4a7fb5', 2: '#5d8a48', 1: '#b0a898' };
      ctx.fillStyle = qCol[c.quality] || '#c0392b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(c.name + '：', bx, ry - 2);
    }

    // 文字
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = (isClick ? '11' : '10') + 'px "Microsoft YaHei", sans-serif';
    for (var j = 0; j < lines.length; j++) {
      ctx.fillText(lines[j], bx, ry + padding + j * lineH);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  },

  // ── 缓动函数 ──
  _easeOutBack: function (t) {
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  _easeInQuad: function (t) {
    return t * t;
  },

  // ── 工具方法 ──
  _wrapText: function (ctx, text, maxWidth) {
    var lines = [];
    var line = '';
    for (var i = 0; i < text.length; i++) {
      var test = line + text[i];
      if (ctx.measureText(test).width > maxWidth && line.length > 0) {
        lines.push(line);
        line = text[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  },

  _roundRect: function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      // 兼容旧浏览器
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
  },
};
