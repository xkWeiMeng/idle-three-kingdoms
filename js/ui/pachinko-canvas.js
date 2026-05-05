/**
 * 弹珠（柏青哥）Canvas 物理引擎
 *
 * 支持同时多颗弹珠飞行的 2D 物理模拟
 * 重力、圆-圆碰撞、弹性反弹、钉子阵列、奖槽渲染、粒子特效
 */
var PachinkoCanvas = {

  _canvas: null,
  _ctx: null,
  _animId: null,
  _running: false,

  // 物理状态（多球）
  _balls: [],       // [{ x, y, vx, vy, radius, flightTimer, settled, settledTimer }]
  _pegs: [],        // [{ x, y, radius, hitTimer }]
  _slots: [],       // [{ x, width, slotData }]
  _particles: [],   // [{ x, y, vx, vy, life, color, size }]

  _lastTime: 0,

  // 缓存尺寸
  _w: 0,
  _h: 0,
  _dpr: 1,

  // 结算回调
  _onSettle: null,

  /** 初始化 Canvas */
  init: function (canvasEl, onSettle) {
    this._canvas = canvasEl;
    this._ctx = canvasEl.getContext('2d');
    this._onSettle = onSettle;
    this._balls = [];
    this._particles = [];
    this._resize();
    this._buildPegs();
    this._buildSlots();
    this._draw();
  },

  _resize: function () {
    var w = PachinkoData.CANVAS_WIDTH;
    var h = PachinkoData.CANVAS_HEIGHT;
    this._dpr = window.devicePixelRatio || 1;
    this._canvas.width = w * this._dpr;
    this._canvas.height = h * this._dpr;
    this._canvas.style.width = w + 'px';
    this._canvas.style.height = h + 'px';
    this._ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    this._w = w;
    this._h = h;
  },

  /** 构建钉子阵列 */
  _buildPegs: function () {
    var layout = PachinkoData.PEG_LAYOUT;
    this._pegs = [];
    var startX = (this._w - (layout.COLS - 1) * layout.COL_SPACING) / 2;

    for (var row = 0; row < layout.ROWS; row++) {
      var isOddRow = row % 2 === 1;
      var cols = isOddRow ? layout.COLS - 1 : layout.COLS;
      var offsetX = isOddRow ? layout.OFFSET_X : 0;

      for (var col = 0; col < cols; col++) {
        this._pegs.push({
          x: startX + col * layout.COL_SPACING + offsetX,
          y: layout.START_Y + row * layout.ROW_SPACING,
          radius: PachinkoData.PHYSICS.PEG_RADIUS,
          hitTimer: 0,
          isGuard: false
        });
      }
    }

    // 守护钉（大奖漏斗）
    var guards = PachinkoData.GUARD_PEGS;
    if (guards) {
      for (var g = 0; g < guards.length; g++) {
        this._pegs.push({
          x: guards[g].x,
          y: guards[g].y,
          radius: guards[g].radius,
          hitTimer: 0,
          isGuard: true
        });
      }
    }
  },

  /** 构建奖槽 */
  _buildSlots: function () {
    this._slots = [];
    var slotCount = PachinkoData.SLOTS.length;
    var slotW = this._w / slotCount;
    var slotY = this._h - PachinkoData.SLOT_HEIGHT;

    for (var i = 0; i < slotCount; i++) {
      this._slots.push({
        x: i * slotW,
        width: slotW,
        y: slotY,
        slotData: PachinkoData.SLOTS[i]
      });
    }
  },

  /** 发射一颗新弹珠（加入多球队列） */
  launch: function () {
    var physics = PachinkoData.PHYSICS;
    var launcher = PachinkoData.LAUNCHER;

    var angleVar = physics.LAUNCH_ANGLE_VARIANCE;
    var angle = (90 + (Math.random() * angleVar * 2 - angleVar)) * Math.PI / 180;

    this._balls.push({
      x: launcher.X + (Math.random() * 20 - 10),
      y: launcher.Y,
      vx: Math.cos(angle) * physics.LAUNCH_SPEED * 0.3,
      vy: Math.sin(angle) * physics.LAUNCH_SPEED * 0.1,
      radius: physics.BALL_RADIUS,
      flightTimer: 0,
      settled: false,
      settledTimer: 0  // 落槽后短暂显示再移除
    });

    if (!this._running) {
      this._lastTime = performance.now();
      this._startLoop();
    }
  },

  /** 开始动画循环 */
  _startLoop: function () {
    if (this._running) return;
    this._running = true;
    var self = this;
    function loop(now) {
      if (!self._running) return;
      self._update(now);
      self._draw();
      self._animId = requestAnimationFrame(loop);
    }
    this._animId = requestAnimationFrame(loop);
  },

  /** 停止动画循环 */
  stop: function () {
    this._running = false;
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
  },

  /** 物理更新（所有球） */
  _update: function (now) {
    var dt = Math.min((now - this._lastTime) / 1000, 0.05);
    this._lastTime = now;

    var physics = PachinkoData.PHYSICS;
    var fixedDt = physics.FIXED_DT;
    var steps = Math.ceil(dt / fixedDt);

    // 衰减钉子 hit timer
    for (var p = 0; p < this._pegs.length; p++) {
      if (this._pegs[p].hitTimer > 0) {
        this._pegs[p].hitTimer -= dt;
      }
    }

    // 更新每颗球
    for (var b = this._balls.length - 1; b >= 0; b--) {
      var ball = this._balls[b];

      if (ball.settled) {
        // 已结算的球短暂显示后移除
        ball.settledTimer += dt;
        if (ball.settledTimer > 1.0) {
          this._balls.splice(b, 1);
        }
        continue;
      }

      ball.flightTimer += dt;

      // 超时强制结算
      if (ball.flightTimer > physics.MAX_FLIGHT_TIME) {
        this._forceSettleBall(ball);
        continue;
      }

      // 固定步长物理
      for (var s = 0; s < steps && !ball.settled; s++) {
        this._physicsStepBall(ball, fixedDt);
      }
    }

    // 更新粒子
    if (this._particles.length > 0) {
      this._updateParticles(dt);
    }

    // 如果没有球也没有粒子，停止循环
    if (this._balls.length === 0 && this._particles.length === 0) {
      this._running = false;
    }
  },

  /** 单球物理步进 */
  _physicsStepBall: function (ball, dt) {
    var physics = PachinkoData.PHYSICS;

    // 重力
    ball.vy += physics.GRAVITY * dt;

    // 摩擦
    ball.vx *= physics.FRICTION;
    ball.vy *= physics.FRICTION;

    // 更新位置
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // 墙壁碰撞
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx) * physics.WALL_ELASTICITY;
    }
    if (ball.x + ball.radius > this._w) {
      ball.x = this._w - ball.radius;
      ball.vx = -Math.abs(ball.vx) * physics.WALL_ELASTICITY;
    }

    // 钉子碰撞
    for (var i = 0; i < this._pegs.length; i++) {
      var peg = this._pegs[i];
      var dx = ball.x - peg.x;
      var dy = ball.y - peg.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var minDist = ball.radius + peg.radius;

      if (dist < minDist && dist > 0) {
        var nx = dx / dist;
        var ny = dy / dist;
        var overlap = minDist - dist;
        ball.x += nx * overlap;
        ball.y += ny * overlap;

        var dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= (1 + physics.BALL_ELASTICITY) * dot * nx;
        ball.vy -= (1 + physics.BALL_ELASTICITY) * dot * ny;

        // 随机扰动
        var jitter = (Math.random() - 0.5) * physics.COLLISION_JITTER * Math.PI / 180;
        var cosJ = Math.cos(jitter);
        var sinJ = Math.sin(jitter);
        var nvx = ball.vx * cosJ - ball.vy * sinJ;
        var nvy = ball.vx * sinJ + ball.vy * cosJ;
        ball.vx = nvx;
        ball.vy = nvy;

        peg.hitTimer = 0.15;
      }
    }

    // 奖槽检测
    var slotY = this._h - PachinkoData.SLOT_HEIGHT;
    if (ball.y + ball.radius >= slotY) {
      this._detectSlotForBall(ball);
    }
  },

  /** 检测单球落入哪个奖槽 */
  _detectSlotForBall: function (ball) {
    for (var i = 0; i < this._slots.length; i++) {
      var slot = this._slots[i];
      if (ball.x >= slot.x && ball.x < slot.x + slot.width) {
        this._settleBall(ball, i);
        return;
      }
    }
    this._settleBall(ball, 0);
  },

  /** 结算单球到指定奖槽 */
  _settleBall: function (ball, index) {
    ball.settled = true;
    ball.settledTimer = 0;
    var slot = this._slots[index];

    ball.x = slot.x + slot.width / 2;
    ball.y = slot.y + PachinkoData.SLOT_HEIGHT / 2;
    ball.vx = 0;
    ball.vy = 0;

    var effect = PachinkoData.EFFECTS[slot.slotData.type];
    if (effect && effect.particles) {
      this._spawnParticles(ball.x, ball.y, effect.color, effect.count);
    }

    if (this._onSettle) {
      try { this._onSettle(index); } catch (e) { console.error('Pachinko settle error:', e); }
    }
  },

  /** 超时强制结算单球 */
  _forceSettleBall: function (ball) {
    var bestIdx = 0;
    var bestDist = Infinity;
    for (var i = 0; i < this._slots.length; i++) {
      var cx = this._slots[i].x + this._slots[i].width / 2;
      var d = Math.abs(ball.x - cx);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    this._settleBall(ball, bestIdx);
  },

  /** 生成粒子 */
  _spawnParticles: function (x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 50 + Math.random() * 150;
      this._particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        life: 0.5 + Math.random() * 0.8,
        maxLife: 0.5 + Math.random() * 0.8,
        color: color,
        size: 2 + Math.random() * 4
      });
    }
  },

  /** 更新粒子 */
  _updateParticles: function (dt) {
    for (var i = this._particles.length - 1; i >= 0; i--) {
      var p = this._particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this._particles.splice(i, 1);
      }
    }
  },

  /** 绘制 */
  _draw: function () {
    var ctx = this._ctx;
    var w = this._w;
    var h = this._h;

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    this._drawLauncher(ctx);
    this._drawPegs(ctx);
    this._drawSlots(ctx);

    // 绘制所有弹珠
    for (var i = 0; i < this._balls.length; i++) {
      this._drawBall(ctx, this._balls[i]);
    }

    this._drawParticles(ctx);
  },

  _drawLauncher: function (ctx) {
    var launcher = PachinkoData.LAUNCHER;
    ctx.save();
    ctx.fillStyle = '#d4a849';
    ctx.beginPath();
    ctx.arc(launcher.X, launcher.Y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eee';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▼', launcher.X, launcher.Y + 4);
    ctx.restore();
  },

  _drawPegs: function (ctx) {
    for (var i = 0; i < this._pegs.length; i++) {
      var peg = this._pegs[i];
      var isHit = peg.hitTimer > 0;
      ctx.beginPath();
      var r = peg.radius;

      if (peg.isGuard) {
        // 守护钉 — 红铜色，带光晕
        if (isHit) {
          r = peg.radius * (1 + peg.hitTimer * 2);
          ctx.fillStyle = '#ff6b6b';
        } else {
          ctx.fillStyle = '#c0392b';
        }
        ctx.arc(peg.x, peg.y, r, 0, Math.PI * 2);
        ctx.fill();
        // 金属光泽高光
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,180,180,0.4)';
        ctx.arc(peg.x - 1, peg.y - 1, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        if (isHit) {
          r = peg.radius * (1 + peg.hitTimer * 2);
          ctx.fillStyle = '#f5c518';
        } else {
          ctx.fillStyle = '#8a7a6a';
        }
        ctx.arc(peg.x, peg.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  _drawSlots: function (ctx) {
    for (var i = 0; i < this._slots.length; i++) {
      var slot = this._slots[i];
      var sd = slot.slotData;
      ctx.fillStyle = sd.color + '33';
      ctx.fillRect(slot.x, slot.y, slot.width, PachinkoData.SLOT_HEIGHT);
      ctx.strokeStyle = sd.color;
      ctx.lineWidth = PachinkoData.SLOT_BORDER_WIDTH;
      ctx.strokeRect(slot.x, slot.y, slot.width, PachinkoData.SLOT_HEIGHT);
      if (i > 0) {
        ctx.beginPath();
        ctx.strokeStyle = sd.color + '88';
        ctx.moveTo(slot.x, slot.y);
        ctx.lineTo(slot.x, slot.y + PachinkoData.SLOT_HEIGHT);
        ctx.stroke();
      }
      ctx.fillStyle = sd.color;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sd.label, slot.x + slot.width / 2, slot.y + PachinkoData.SLOT_HEIGHT / 2);
    }
  },

  _drawBall: function (ctx, ball) {
    ctx.save();

    // 已结算的球逐渐淡出
    if (ball.settled) {
      ctx.globalAlpha = Math.max(0, 1 - ball.settledTimer);
    }

    var grd = ctx.createRadialGradient(
      ball.x - 2, ball.y - 2, 1,
      ball.x, ball.y, ball.radius * 2
    );
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.3, '#e8dcc8');
    grd.addColorStop(1, '#c0a87050');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8dcc8';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  _drawParticles: function (ctx) {
    for (var i = 0; i < this._particles.length; i++) {
      var p = this._particles[i];
      var alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  /** 静态重绘 */
  redraw: function () {
    this._draw();
  },

  /** 清理 */
  destroy: function () {
    this.stop();
    this._balls = [];
    this._particles = [];
  }
};
