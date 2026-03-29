/**
 * 城镇角色系统 — NPC 居民 + 武将在城镇中行走、自言自语、可点击交互
 * 由 TownWorld 在每帧调用 update / draw / hitTest
 */
var TownCharacters = {

  _chars: [],       // 所有角色
  _images: {},      // 精灵图缓存

  // ── 常量 ──
  NPC_SPAWN_COUNT: 6,
  CHAR_W: 36,       // 绘制宽
  CHAR_H: 48,       // 绘制高
  HIT_W: 32,        // 点击检测宽
  HIT_H: 44,        // 点击检测高

  NPC_SPEED: 22,
  HERO_SPEED: 16,
  NPC_WANDER_RADIUS: 3,   // 格
  HERO_WANDER_RADIUS: 2,

  // ── 初始化 ──
  init: function () {
    this._preloadImages();
    this._spawnNPCs();
    this._syncHeroes();
    EventBus.on('hero:added', this._syncHeroes.bind(this));
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
      this._chars.push(this._createChar({
        id: 'npc_' + i,
        type: 'npc',
        name: s.name,
        sprite: s.sprite,
        x: wx, y: wy,
        homeX: wx, homeY: wy,
        speed: this.NPC_SPEED,
        wanderRadius: this.NPC_WANDER_RADIUS,
        talkCooldown: 15 + Math.random() * 25,
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
    };
  },

  // ── AI 更新（每帧调用） ──
  update: function (dt) {
    for (var i = 0; i < this._chars.length; i++) {
      this._tickAI(this._chars[i], dt);
    }
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
        c.stateTimer -= dt;
        if (c.stateTimer <= 0) {
          // 决定下一步行为
          if (c.talkCooldown <= 0 && Math.random() < 0.35) {
            this._startTalking(c);
          } else {
            this._startWandering(c);
          }
        }
        break;

      case 'walking':
        this._moveToward(c, dt);
        break;

      case 'talking':
        c.stateTimer -= dt;
        if (c.stateTimer <= 0) {
          c.bubble = null;
          this._goIdle(c);
        }
        break;
    }
  },

  _goIdle: function (c) {
    c.state = 'idle';
    c.stateTimer = 3 + Math.random() * 5;
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
    var angle = Math.random() * Math.PI * 2;
    var dist = Math.random() * radius;
    c.targetX = c.homeX + Math.cos(angle) * dist;
    c.targetY = c.homeY + Math.sin(angle) * dist;

    // 限制在地图范围内
    var mapPixels = TownWorld.MAP_W * CELL;
    c.targetX = Math.max(CELL, Math.min(mapPixels - CELL, c.targetX));
    c.targetY = Math.max(CELL, Math.min(mapPixels - CELL, c.targetY));

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
      this._goIdle(c);
      return;
    }

    var step = c.speed * dt;
    c.x += (dx / dist) * step;
    c.y += (dy / dist) * step;
    c.direction = dx > 0 ? 1 : -1;
    c.bobPhase += dt * 8;
  },

  _startTalking: function (c) {
    var text = null;
    if (c.type === 'hero') {
      var hd = NpcDialogues.heroes[c.heroId];
      if (hd && hd.idle.length > 0) {
        text = hd.idle[Utils.randInt(0, hd.idle.length - 1)];
      }
    } else {
      text = NpcDialogues.npcIdle[Utils.randInt(0, NpcDialogues.npcIdle.length - 1)];
    }

    if (!text) {
      this._goIdle(c);
      return;
    }

    var duration = 3 + Math.random() * 2;
    c.bubble = { text: text, timer: duration, isClick: false };
    c.state = 'talking';
    c.stateTimer = duration;
    // 重置冷却
    c.talkCooldown = c.type === 'hero'
      ? 12 + Math.random() * 13
      : 18 + Math.random() * 22;
  },

  // ── 点击交互 ──
  handleTap: function (c) {
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

  // ── 渲染 ──
  draw: function (ctx) {
    // 按 Y 坐标排序（深度排序）
    var sorted = this._chars.slice().sort(function (a, b) { return a.y - b.y; });

    for (var i = 0; i < sorted.length; i++) {
      this._drawCharacter(ctx, sorted[i]);
    }
  },

  _drawCharacter: function (ctx, c) {
    var img = this._images[c.sprite];
    var W = this.CHAR_W;
    var H = this.CHAR_H;

    // 行走弹跳
    var bobY = 0;
    if (c.state === 'walking') {
      bobY = Math.sin(c.bobPhase) * 1.5;
    }

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, W * 0.3, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 精灵图
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(c.x, c.y - H + bobY);
      if (c.direction < 0) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, -W / 2, 0, W, H);
      ctx.restore();
    } else {
      // 降级：彩色圆点
      ctx.fillStyle = c.type === 'hero' ? '#e94560' : '#999';
      ctx.beginPath();
      ctx.arc(c.x, c.y - H / 2 + bobY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 名字标签
    ctx.font = 'bold 9px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    var nameText = c.name;
    var nameW = ctx.measureText(nameText).width + 6;
    // 背景条
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this._roundRect(ctx, c.x - nameW / 2, c.y + 2, nameW, 13, 3);
    ctx.fill();

    // 名字颜色（武将按品质，NPC 灰色）
    if (c.type === 'hero') {
      var qColors = { 5: '#ff8c00', 4: '#c084fc', 3: '#60a5fa', 2: '#4ade80', 1: '#ccc' };
      ctx.fillStyle = qColors[c.quality] || '#f5c518';
    } else {
      ctx.fillStyle = '#ccc';
    }
    ctx.fillText(nameText, c.x, c.y + 3);

    // 气泡
    if (c.bubble) {
      this._drawBubble(ctx, c);
    }
  },

  // ── 气泡绘制 ──
  _drawBubble: function (ctx, c) {
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
      var qCol = { 5: '#ff8c00', 4: '#9333ea', 3: '#3b82f6', 2: '#22c55e', 1: '#999' };
      ctx.fillStyle = qCol[c.quality] || '#e94560';
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
