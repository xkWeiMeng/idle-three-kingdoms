/**
 * td-renderer.js — 塔防 Canvas 渲染引擎
 *
 * 规范引用：specs/product-specs/tower-defense-coc-redesign.md (Draft v0.1.0)
 *
 * 使用 Canvas 2D API 绘制所有塔防单位、建筑、弹道和特效，
 * 替代原有的 emoji 渲染方案。三国主题 SVG 风格线条图形。
 *
 * 全局单例对象，所有方法接收 ctx (CanvasRenderingContext2D) 作为第一个参数。
 * 网格尺寸 48px (TD_CONSTANTS.TILE_SIZE)。
 */
var TDRenderer = {

  // ============================================================
  //  颜色常量
  // ============================================================
  COLORS: {
    WOOD:         '#8B6914',
    WOOD_DARK:    '#654321',
    WOOD_LIGHT:   '#A07828',
    STONE:        '#708090',
    STONE_DARK:   '#505868',
    IRON:         '#4A4A4A',
    IRON_LIGHT:   '#666666',
    RED:          '#C41E3A',
    GOLD:         '#D4A849',
    GREEN:        '#4A7A4A',
    BLUE:         '#4A6FA5',
    PURPLE:       '#8B5EA8',
    FIRE:         '#FF6B35',
    FIRE_LIGHT:   '#FFB347',
    SKIN:         '#DEB887',
    YELLOW_SCARF: '#DAA520',
    ARMOR_GREY:   '#8B8682',
    DARK_ARMOR:   '#4A4A4A',
    ROPE:         '#8B7355',
    OIL:          '#8B4513',
    OIL_SURFACE:  '#A0522D',
    HP_GREEN:     '#4caf50',
    HP_ORANGE:    '#ff9800',
    HP_RED:       '#f44336',
    HP_BG:        'rgba(0,0,0,0.6)',
  },

  // ============================================================
  //  建筑渲染
  // ============================================================

  /**
   * 绘制防御建筑
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} typeId - 建筑类型 ID
   * @param {number} x - 中心 x 像素坐标
   * @param {number} y - 中心 y 像素坐标
   * @param {number} level - 等级 (1-5)
   * @param {object} [options] - { selected: boolean }
   */
  drawTower: function (ctx, typeId, x, y, level, options) {
    ctx.save();
    var lvl = level || 1;
    var opt = options || {};

    switch (typeId) {
      case 'td_arrow_tower':  this._drawArrowTower(ctx, x, y, lvl);  break;
      case 'td_crossbow':     this._drawCrossbow(ctx, x, y, lvl);    break;
      case 'td_catapult':     this._drawCatapult(ctx, x, y, lvl);    break;
      case 'td_beacon':       this._drawBeacon(ctx, x, y, lvl);      break;
      case 'td_oil_tower':    this._drawOilTower(ctx, x, y, lvl);    break;
      case 'td_repeater':     this._drawRepeater(ctx, x, y, lvl);    break;
      case 'td_wood_fence':
      case 'td_palisade':     this._drawWoodFence(ctx, x, y, lvl);   break;
      case 'td_stone_wall':   this._drawStoneWall(ctx, x, y, lvl);   break;
      case 'td_iron_wall':    this._drawIronWall(ctx, x, y, lvl);    break;
      case 'td_spike':
      case 'td_caltrops':     this._drawSpike(ctx, x, y, lvl);       break;
      case 'td_pitfall':      this._drawPitfall(ctx, x, y, lvl);     break;
      case 'td_oil_pool':     this._drawOilPool(ctx, x, y, lvl);     break;
      case 'td_trip_rope':    this._drawTripRope(ctx, x, y, lvl);    break;
      // 兼容旧数据中的其他塔类型 — 用通用占位
      default:                this._drawGenericTower(ctx, x, y, lvl, typeId); break;
    }

    // 等级装饰 — 金色圆点
    if (lvl > 1) {
      this._drawLevelDots(ctx, x, y + 20, lvl);
    }

    if (opt.selected) {
      ctx.strokeStyle = '#f5c518';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 22, y - 22, 44, 44);
    }

    ctx.restore();
  },

  // ---------- 箭塔 ----------
  _drawArrowTower: function (ctx, x, y, lvl) {
    var shade = Math.min(lvl * 8, 40);
    // 底座
    ctx.fillStyle = this.COLORS.WOOD;
    ctx.fillRect(x - 16, y + 4, 32, 18);
    // 塔身
    ctx.fillStyle = this._darken(this.COLORS.WOOD, shade);
    ctx.fillRect(x - 12, y - 16, 24, 24);
    // 屋顶 — 红色三角
    ctx.fillStyle = this.COLORS.RED;
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 14);
    ctx.lineTo(x, y - 24);
    ctx.lineTo(x + 14, y - 14);
    ctx.closePath();
    ctx.fill();
    // 窗口
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x - 6, y - 10, 12, 8);
  },

  // ---------- 弩车台 ----------
  _drawCrossbow: function (ctx, x, y, lvl) {
    var s = 1 + lvl * 0.04; // 微增
    // 底座平台
    ctx.fillStyle = this.COLORS.ARMOR_GREY;
    ctx.fillRect(x - 18, y + 2, 36, 16);
    // 弩机十字
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, y - 6);  ctx.lineTo(x + 10 * s, y - 6);
    ctx.moveTo(x, y - 16 * s);      ctx.lineTo(x, y + 2);
    ctx.stroke();
    // 弓臂弧
    ctx.strokeStyle = this.COLORS.WOOD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 6, 12 * s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  },

  // ---------- 投石车台 ----------
  _drawCatapult: function (ctx, x, y, lvl) {
    // 底座
    ctx.fillStyle = this.COLORS.WOOD;
    ctx.fillRect(x - 16, y + 6, 32, 14);
    // 三角支架
    ctx.strokeStyle = this.COLORS.WOOD_DARK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 6);  ctx.lineTo(x, y - 14);
    ctx.lineTo(x + 10, y + 6);
    ctx.moveTo(x - 10, y + 6);  ctx.lineTo(x + 10, y + 6);
    ctx.stroke();
    // 投掷臂 — 弧线
    ctx.strokeStyle = this.COLORS.WOOD_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 6, 16, Math.PI * 1.2, Math.PI * 1.85);
    ctx.stroke();
    // 载石斗
    ctx.fillStyle = '#555';
    ctx.fillRect(x + 10, y - 18, 6, 5);
  },

  // ---------- 烽火台 ----------
  _drawBeacon: function (ctx, x, y, lvl) {
    // 基座
    ctx.fillStyle = this.COLORS.STONE;
    ctx.fillRect(x - 12, y + 8, 24, 12);
    // 高塔 — 从下到上渐窄
    ctx.fillStyle = this.COLORS.STONE_DARK;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 8);
    ctx.lineTo(x - 5, y - 14);
    ctx.lineTo(x + 5, y - 14);
    ctx.lineTo(x + 8, y + 8);
    ctx.closePath();
    ctx.fill();
    // 顶端火焰 — 叠加多个小圆
    var flameColors = [this.COLORS.FIRE, this.COLORS.FIRE_LIGHT, '#FFD700'];
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = flameColors[i];
      ctx.globalAlpha = 0.8 - i * 0.15;
      ctx.beginPath();
      ctx.arc(x + (i - 1) * 2, y - 16 - i * 3, 4 - i, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  },

  // ---------- 火油塔 ----------
  _drawOilTower: function (ctx, x, y, lvl) {
    // 三条支撑线
    ctx.strokeStyle = this.COLORS.WOOD_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 16);  ctx.lineTo(x, y - 6);
    ctx.moveTo(x + 12, y + 16);  ctx.lineTo(x, y - 6);
    ctx.moveTo(x, y + 16);       ctx.lineTo(x, y - 6);
    ctx.stroke();
    // 大锅 — 半圆弧
    ctx.fillStyle = this.COLORS.WOOD_DARK;
    ctx.beginPath();
    ctx.arc(x, y - 2, 12, 0, Math.PI);
    ctx.fill();
    // 油面
    ctx.fillStyle = this.COLORS.OIL_SURFACE;
    ctx.beginPath();
    ctx.arc(x, y - 2, 10, 0.1, Math.PI - 0.1);
    ctx.fill();
    // 火焰点
    var n = 3 + Math.min(lvl, 3);
    ctx.fillStyle = this.COLORS.FIRE;
    for (var i = 0; i < n; i++) {
      var angle = (Math.PI * 2 / n) * i - Math.PI / 2;
      var fx = x + Math.cos(angle) * 14;
      var fy = y - 2 + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.arc(fx, fy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ---------- 连弩塔 ----------
  _drawRepeater: function (ctx, x, y, lvl) {
    // 圆形旋转底座
    ctx.fillStyle = this.COLORS.WOOD;
    ctx.beginPath();
    ctx.arc(x, y + 4, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.COLORS.WOOD_DARK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 弩臂 — 从中心辐射
    var arms = 3 + Math.min(lvl - 1, 1); // 3-4 根
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    for (var i = 0; i < arms; i++) {
      var angle = (Math.PI * 2 / arms) * i - Math.PI / 2;
      var ex = x + Math.cos(angle) * 14;
      var ey = y + 4 + Math.sin(angle) * 14;
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // 末端小箭头
      var ax = Math.cos(angle);
      var ay = Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ax * 4 - ay * 3, ey - ay * 4 + ax * 3);
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ax * 4 + ay * 3, ey - ay * 4 - ax * 3);
      ctx.stroke();
    }
  },

  // ---------- 木栅栏 ----------
  _drawWoodFence: function (ctx, x, y, lvl) {
    ctx.strokeStyle = this.COLORS.WOOD_LIGHT;
    ctx.lineWidth = 3;
    // 竖直木桩
    var posts = 3 + Math.min(lvl - 1, 1);
    var gap = 28 / (posts - 1);
    for (var i = 0; i < posts; i++) {
      var px = x - 14 + i * gap;
      ctx.beginPath();
      ctx.moveTo(px, y - 12);
      ctx.lineTo(px, y + 14);
      ctx.stroke();
    }
    // 横向连接
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 4);  ctx.lineTo(x + 14, y - 4);
    ctx.moveTo(x - 14, y + 6);  ctx.lineTo(x + 14, y + 6);
    ctx.stroke();
  },

  // ---------- 城墙 ----------
  _drawStoneWall: function (ctx, x, y, lvl) {
    // 主体
    ctx.fillStyle = this.COLORS.STONE;
    ctx.fillRect(x - 20, y - 10, 40, 28);
    // 顶部城垛 — 锯齿
    var count = 4 + Math.min(lvl - 1, 2);
    var mw = 36 / count;
    ctx.fillStyle = this.COLORS.STONE_DARK;
    for (var i = 0; i < count; i += 2) {
      ctx.fillRect(x - 18 + i * mw, y - 16, mw - 1, 7);
    }
    // 砖缝
    ctx.strokeStyle = '#99a5b4';
    ctx.lineWidth = 0.5;
    for (var r = 0; r < 3; r++) {
      var ry = y - 6 + r * 8;
      ctx.beginPath();
      ctx.moveTo(x - 20, ry);
      ctx.lineTo(x + 20, ry);
      ctx.stroke();
    }
  },

  // ---------- 铁壁 ----------
  _drawIronWall: function (ctx, x, y, lvl) {
    // 深灰矩形
    ctx.fillStyle = this.COLORS.IRON;
    ctx.fillRect(x - 20, y - 12, 40, 30);
    // 金属质感线条
    ctx.strokeStyle = this.COLORS.IRON_LIGHT;
    ctx.lineWidth = 0.8;
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 20, y - 8 + i * 10);
      ctx.lineTo(x + 20, y - 8 + i * 10);
      ctx.stroke();
    }
    // 铆钉
    var rivets = 4 + lvl;
    ctx.fillStyle = '#888';
    for (var r = 0; r < rivets; r++) {
      var rx = x - 14 + (r % 4) * 9;
      var ry = y - 6 + Math.floor(r / 4) * 12;
      ctx.beginPath();
      ctx.arc(rx, ry, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ---------- 拒马 ----------
  _drawSpike: function (ctx, x, y, lvl) {
    ctx.strokeStyle = this.COLORS.WOOD;
    ctx.lineWidth = 2.5;
    // X 交叉
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 10); ctx.lineTo(x + 14, y + 12);
    ctx.moveTo(x + 14, y - 10); ctx.lineTo(x - 14, y + 12);
    ctx.stroke();
    // 尖端三角
    var tips = [
      [x - 14, y - 10], [x + 14, y - 10],
      [x - 14, y + 12], [x + 14, y + 12]
    ];
    ctx.fillStyle = this.COLORS.IRON;
    for (var i = 0; i < tips.length; i++) {
      var tx = tips[i][0];
      var ty = tips[i][1];
      ctx.beginPath();
      ctx.moveTo(tx, ty - 4);
      ctx.lineTo(tx - 3, ty + 2);
      ctx.lineTo(tx + 3, ty + 2);
      ctx.closePath();
      ctx.fill();
    }
  },

  // ---------- 陷坑 ----------
  _drawPitfall: function (ctx, x, y, lvl) {
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(x, y + 2, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // 内部暗色
    ctx.fillStyle = 'rgba(30,20,10,0.5)';
    ctx.beginPath();
    ctx.arc(x, y + 2, 12, 0, Math.PI * 2);
    ctx.fill();
  },

  // ---------- 火油池 ----------
  _drawOilPool: function (ctx, x, y, lvl) {
    // 棕色椭圆
    ctx.fillStyle = this.COLORS.OIL;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // 表面波纹
    ctx.strokeStyle = this.COLORS.OIL_SURFACE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - 4, y, 6, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 4, y + 3, 5, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  },

  // ---------- 绊马索 ----------
  _drawTripRope: function (ctx, x, y, lvl) {
    // 固定点
    ctx.fillStyle = this.COLORS.WOOD;
    ctx.beginPath();
    ctx.arc(x - 16, y + 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 16, y + 6, 3, 0, Math.PI * 2);
    ctx.fill();
    // 地面弧线
    ctx.strokeStyle = this.COLORS.ROPE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 6);
    ctx.quadraticCurveTo(x, y - 4, x + 16, y + 6);
    ctx.stroke();
  },

  // ---------- 通用占位（兼容旧数据） ----------
  _drawGenericTower: function (ctx, x, y, lvl, typeId) {
    ctx.fillStyle = this.COLORS.STONE;
    ctx.fillRect(x - 16, y - 16, 32, 32);
    ctx.strokeStyle = this.COLORS.GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 16, y - 16, 32, 32);
    ctx.fillStyle = '#fff';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var label = (typeId || '').replace('td_', '').substring(0, 6);
    ctx.fillText(label, x, y);
  },

  // ---------- 等级装饰圆点 ----------
  _drawLevelDots: function (ctx, x, y, lvl) {
    var count = Math.min(lvl, 5);
    var startX = x - (count - 1) * 4;
    ctx.fillStyle = this.COLORS.GOLD;
    for (var i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.arc(startX + i * 8, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ============================================================
  //  敌人渲染
  // ============================================================

  /**
   * 绘制敌人单位
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} typeId - 敌人类型 ID
   * @param {number} x - 中心 x 像素坐标
   * @param {number} y - 中心 y 像素坐标
   * @param {number} hpRatio - 0-1 的 HP 比率
   * @param {object} [options] - { detected, slow, burn, stun, facingLeft }
   */
  drawEnemy: function (ctx, typeId, x, y, hpRatio, options) {
    ctx.save();
    var opt = options || {};

    switch (typeId) {
      case 'td_militia':
      case 'td_infantry':      this._drawMilitia(ctx, x, y, opt);          break;
      case 'td_spearman':      this._drawSpearman(ctx, x, y, opt);         break;
      case 'td_heavy_infantry':
      case 'td_heavy':         this._drawHeavyInfantry(ctx, x, y, opt);    break;
      case 'td_cavalry':       this._drawCavalry(ctx, x, y, opt);          break;
      case 'td_iron_cavalry':  this._drawIronCavalry(ctx, x, y, opt);      break;
      case 'td_siege_ram':     this._drawSiegeRam(ctx, x, y, opt);         break;
      case 'td_siege_ladder':  this._drawSiegeLadder(ctx, x, y, opt);      break;
      case 'td_siege_catapult':this._drawSiegeCatapult(ctx, x, y, opt);    break;
      case 'td_battering_ram': this._drawBatteringRam(ctx, x, y, opt);     break;
      case 'td_assassin':
      case 'td_tunneler':
      case 'td_burrower':      this._drawAssassin(ctx, x, y, opt);         break;
      case 'td_horse_archer':
      case 'td_sky_rider':     this._drawHorseArcher(ctx, x, y, opt);      break;
      case 'td_enemy_general':
      case 'td_final_boss':    this._drawEnemyGeneral(ctx, x, y, opt);     break;
      default:                 this._drawMilitia(ctx, x, y, opt);           break;
    }

    // HP 血条
    if (typeof hpRatio === 'number') {
      this.drawHpBar(ctx, x, y - 24, hpRatio, 28, 3);
    }

    // 状态特效
    if (opt.slow)  this.drawStatusEffect(ctx, 'slow', x, y);
    if (opt.burn)  this.drawStatusEffect(ctx, 'burn', x, y);
    if (opt.stun)  this.drawStatusEffect(ctx, 'stun', x, y);

    ctx.restore();
  },

  // ---------- 黄巾兵 ----------
  _drawMilitia: function (ctx, x, y, opt) {
    this._drawHumanoid(ctx, x, y, 1.0, this.COLORS.SKIN, opt);
    // 黄色头巾
    ctx.fillStyle = this.COLORS.YELLOW_SCARF;
    ctx.beginPath();
    ctx.arc(x, y - 16, 6, Math.PI, Math.PI * 2);
    ctx.fill();
    // 棍棒
    ctx.strokeStyle = this.COLORS.WOOD;
    ctx.lineWidth = 2;
    var dir = opt.facingLeft ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x + 8 * dir, y - 12);
    ctx.lineTo(x + 12 * dir, y + 2);
    ctx.stroke();
  },

  // ---------- 长枪兵 ----------
  _drawSpearman: function (ctx, x, y, opt) {
    this._drawHumanoid(ctx, x, y, 1.0, this.COLORS.ARMOR_GREY, opt);
    // 长枪
    var dir = opt.facingLeft ? -1 : 1;
    ctx.strokeStyle = this.COLORS.WOOD;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 8 * dir, y - 20);
    ctx.lineTo(x + 8 * dir, y + 10);
    ctx.stroke();
    // 枪头三角
    ctx.fillStyle = this.COLORS.IRON;
    ctx.beginPath();
    ctx.moveTo(x + 8 * dir, y - 24);
    ctx.lineTo(x + 5 * dir, y - 19);
    ctx.lineTo(x + 11 * dir, y - 19);
    ctx.closePath();
    ctx.fill();
  },

  // ---------- 重甲兵 ----------
  _drawHeavyInfantry: function (ctx, x, y, opt) {
    this._drawHumanoid(ctx, x, y, 1.1, this.COLORS.DARK_ARMOR, opt);
    // 方盾
    var dir = opt.facingLeft ? 1 : -1; // 盾在前手
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(x + 8 * dir, y - 8, 8 * dir, 14);
    ctx.strokeStyle = this.COLORS.IRON_LIGHT;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 8 * dir, y - 8, 8 * dir, 14);
  },

  // ---------- 轻骑兵 ----------
  _drawCavalry: function (ctx, x, y, opt) {
    this._drawHorse(ctx, x, y + 4, 1.0, this.COLORS.WOOD);
    // 骑手 — 缩小人形
    this._drawHumanoid(ctx, x, y - 8, 0.65, this.COLORS.SKIN, opt);
    // 拖尾
    var dir = opt.facingLeft ? 1 : -1;
    ctx.fillStyle = 'rgba(139,105,20,0.3)';
    for (var i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(x + dir * i * 6, y + 6, 3 - i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ---------- 铁骑 ----------
  _drawIronCavalry: function (ctx, x, y, opt) {
    this._drawHorse(ctx, x, y + 4, 1.2, this.COLORS.DARK_ARMOR);
    // 骑手
    this._drawHumanoid(ctx, x, y - 10, 0.7, this.COLORS.IRON, opt);
    // 装甲线条
    ctx.strokeStyle = this.COLORS.IRON_LIGHT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 2); ctx.lineTo(x + 10, y + 2);
    ctx.moveTo(x - 8, y + 6);  ctx.lineTo(x + 8, y + 6);
    ctx.stroke();
  },

  // ---------- 攻城车 ----------
  _drawSiegeRam: function (ctx, x, y, opt) {
    var s = 1.4; // ~1.5 倍网格
    // 车体
    ctx.fillStyle = this.COLORS.WOOD_DARK;
    ctx.fillRect(x - 20 * s, y - 6, 40 * s, 14);
    // 顶棚
    ctx.fillStyle = this.COLORS.WOOD;
    ctx.fillRect(x - 18 * s, y - 14, 36 * s, 8);
    // 撞头
    var dir = opt.facingLeft ? -1 : 1;
    ctx.fillStyle = this.COLORS.STONE;
    ctx.beginPath();
    ctx.moveTo(x + 20 * s * dir, y - 2);
    ctx.lineTo(x + 26 * s * dir, y + 1);
    ctx.lineTo(x + 20 * s * dir, y + 4);
    ctx.closePath();
    ctx.fill();
    // 车轮
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 12, y + 12, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 12, y + 12, 5, 0, Math.PI * 2);
    ctx.stroke();
  },

  // ---------- 云梯 ----------
  _drawSiegeLadder: function (ctx, x, y, opt) {
    ctx.strokeStyle = this.COLORS.WOOD;
    ctx.lineWidth = 2;
    // 梯框 — 倾斜
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 16);  ctx.lineTo(x - 3, y - 20);
    ctx.moveTo(x + 6, y + 16);  ctx.lineTo(x + 9, y - 20);
    ctx.stroke();
    // 梯阶
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 5; i++) {
      var t = i / 4;
      var ly = y + 12 - t * 28;
      var lx = x - 5.5 + t * 2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + 12, ly);
      ctx.stroke();
    }
  },

  // ---------- 投石车(敌方) ----------
  _drawSiegeCatapult: function (ctx, x, y, opt) {
    // 三角支架
    ctx.strokeStyle = this.COLORS.WOOD_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 10); ctx.lineTo(x, y - 8);
    ctx.lineTo(x + 10, y + 10);
    ctx.moveTo(x - 10, y + 10); ctx.lineTo(x + 10, y + 10);
    ctx.stroke();
    // 投掷臂
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 4, 14, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    // 石弹
    ctx.fillStyle = this.COLORS.STONE;
    ctx.beginPath();
    ctx.arc(x + 12, y - 14, 4, 0, Math.PI * 2);
    ctx.fill();
  },

  // ---------- 冲城锤 ----------
  _drawBatteringRam: function (ctx, x, y, opt) {
    // 矩形框架
    ctx.strokeStyle = this.COLORS.WOOD_DARK;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 18, y - 12, 36, 22);
    // 悬挂锤头
    ctx.fillStyle = this.COLORS.IRON;
    ctx.beginPath();
    ctx.arc(x, y + 2, 6, 0, Math.PI * 2);
    ctx.fill();
    // 支撑绳索
    ctx.strokeStyle = this.COLORS.ROPE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 12); ctx.lineTo(x, y - 2);
    ctx.moveTo(x + 10, y - 12); ctx.lineTo(x, y - 2);
    ctx.stroke();
  },

  // ---------- 刺客 ----------
  _drawAssassin: function (ctx, x, y, opt) {
    var detected = opt.detected;
    ctx.globalAlpha = detected ? 1.0 : 0.4;
    this._drawHumanoid(ctx, x, y, 0.9, '#2a2a2a', opt);
    // 短刀
    var dir = opt.facingLeft ? -1 : 1;
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 6 * dir, y - 6);
    ctx.lineTo(x + 12 * dir, y + 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  },

  // ---------- 弓骑兵 ----------
  _drawHorseArcher: function (ctx, x, y, opt) {
    this._drawHorse(ctx, x, y + 4, 1.0, this.COLORS.WOOD);
    this._drawHumanoid(ctx, x, y - 8, 0.6, this.COLORS.SKIN, opt);
    // 弓
    var dir = opt.facingLeft ? -1 : 1;
    ctx.strokeStyle = this.COLORS.WOOD_DARK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 8 * dir, y - 10, 8, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
    // 弦
    ctx.beginPath();
    ctx.moveTo(x + 8 * dir + Math.cos(-Math.PI * 0.4) * 8,
               y - 10 + Math.sin(-Math.PI * 0.4) * 8);
    ctx.lineTo(x + 8 * dir + Math.cos(Math.PI * 0.4) * 8,
               y - 10 + Math.sin(Math.PI * 0.4) * 8);
    ctx.stroke();
  },

  // ---------- 敌将/Boss ----------
  _drawEnemyGeneral: function (ctx, x, y, opt) {
    var scale = 1.5;
    this._drawHumanoid(ctx, x, y, scale, this.COLORS.RED, opt);
    // 头上旗帜
    var flagColor = (opt.flagColor) || this.COLORS.RED;
    this._drawFlag(ctx, x, y - 22 * scale, flagColor, '');
    // 发光边缘
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 4, 20, 0, Math.PI * 2);
    ctx.stroke();
    // 华丽装甲线条
    ctx.strokeStyle = this.COLORS.GOLD;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 6);  ctx.lineTo(x + 8, y - 6);
    ctx.moveTo(x - 6, y + 2);  ctx.lineTo(x + 6, y + 2);
    ctx.stroke();
  },

  // ============================================================
  //  武将渲染
  // ============================================================

  /**
   * 绘制武将
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} heroData - { name, faction }
   * @param {number} x - 中心 x 像素坐标
   * @param {number} y - 中心 y 像素坐标
   * @param {number} hpRatio - 0-1
   * @param {number} skillCdRatio - 0-1 技能冷却进度 (1=已就绪)
   * @param {object} [options] - { facingLeft }
   */
  drawHero: function (ctx, heroData, x, y, hpRatio, skillCdRatio, options) {
    ctx.save();
    var opt = options || {};
    var data = heroData || {};
    var scale = 1.5;

    // 势力颜色
    var faction = (data.faction || '').toLowerCase();
    var fColor = this.COLORS.PURPLE;
    if (faction === 'shu' || faction === '蜀') fColor = this.COLORS.GREEN;
    else if (faction === 'wei' || faction === '魏') fColor = this.COLORS.BLUE;
    else if (faction === 'wu' || faction === '吴') fColor = this.COLORS.RED;

    // 人形
    this._drawHumanoid(ctx, x, y, scale, fColor, opt);

    // 背后旗帜
    this._drawFlag(ctx, x + 6, y - 20 * scale, fColor, '');

    // 头顶名字
    if (data.name) {
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#fff';
      ctx.fillText(data.name, x, y - 30);
    }

    // HP 条
    if (typeof hpRatio === 'number') {
      this.drawHpBar(ctx, x, y - 34, hpRatio, 32, 3);
    }

    // 技能冷却环
    if (typeof skillCdRatio === 'number') {
      var cdAngle = Math.PI * 2 * Math.min(skillCdRatio, 1);
      ctx.strokeStyle = skillCdRatio >= 1 ? this.COLORS.GOLD : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 38, 5, -Math.PI / 2, -Math.PI / 2 + cdAngle);
      ctx.stroke();
    }

    ctx.restore();
  },

  // ============================================================
  //  弹道/投射物渲染
  // ============================================================

  /**
   * 绘制弹道投射物
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} type - 'arrow'|'stone'|'bolt'|'oil_splash'|'multi_bolt'
   * @param {number} x - 起始 x
   * @param {number} y - 起始 y
   * @param {number} targetX - 目标 x
   * @param {number} targetY - 目标 y
   * @param {number} progress - 0-1 飞行进度
   */
  drawProjectile: function (ctx, type, x, y, targetX, targetY, progress) {
    ctx.save();
    var p = Math.max(0, Math.min(1, progress));

    switch (type) {
      case 'arrow':       this._drawProjectileArrow(ctx, x, y, targetX, targetY, p);     break;
      case 'stone':       this._drawProjectileStone(ctx, x, y, targetX, targetY, p);     break;
      case 'bolt':        this._drawProjectileBolt(ctx, x, y, targetX, targetY, p);      break;
      case 'oil_splash':  this._drawProjectileOilSplash(ctx, x, y, targetX, targetY, p); break;
      case 'multi_bolt':  this._drawProjectileMultiBolt(ctx, x, y, targetX, targetY, p); break;
      default:            this._drawProjectileArrow(ctx, x, y, targetX, targetY, p);     break;
    }

    ctx.restore();
  },

  _drawProjectileArrow: function (ctx, sx, sy, tx, ty, p) {
    var cx = sx + (tx - sx) * p;
    var cy = sy + (ty - sy) * p;
    var angle = Math.atan2(ty - sy, tx - sx);
    var len = 10;

    ctx.strokeStyle = this.COLORS.WOOD;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(angle) * len, cy - Math.sin(angle) * len);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // 箭头三角
    ctx.fillStyle = this.COLORS.IRON;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 4, cy + Math.sin(angle) * 4);
    ctx.lineTo(cx + Math.cos(angle + 2.5) * 5, cy + Math.sin(angle + 2.5) * 5);
    ctx.lineTo(cx + Math.cos(angle - 2.5) * 5, cy + Math.sin(angle - 2.5) * 5);
    ctx.closePath();
    ctx.fill();
  },

  _drawProjectileStone: function (ctx, sx, sy, tx, ty, p) {
    var cx = sx + (tx - sx) * p;
    // 抛物线弧 — y 偏移
    var arc = -Math.sin(p * Math.PI) * 40;
    var cy = sy + (ty - sy) * p + arc;

    // 阴影
    var groundY = sy + (ty - sy) * p;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 4, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 石弹
    ctx.fillStyle = this.COLORS.STONE;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawProjectileBolt: function (ctx, sx, sy, tx, ty, p) {
    var cx = sx + (tx - sx) * p;
    var cy = sy + (ty - sy) * p;
    var angle = Math.atan2(ty - sy, tx - sx);
    var len = 14;

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(angle) * len, cy - Math.sin(angle) * len);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  },

  _drawProjectileOilSplash: function (ctx, sx, sy, tx, ty, p) {
    ctx.fillStyle = this.COLORS.FIRE;
    // 散落小点
    for (var i = 0; i < 5; i++) {
      var spread = (i - 2) * 6;
      var cx = sx + (tx - sx) * p + spread * (0.5 + p * 0.5);
      var arc = -Math.sin(p * Math.PI) * (20 + i * 4);
      var cy = sy + (ty - sy) * p + arc;
      ctx.globalAlpha = 1 - p * 0.6;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  _drawProjectileMultiBolt: function (ctx, sx, sy, tx, ty, p) {
    var angle = Math.atan2(ty - sy, tx - sx);
    var perp = angle + Math.PI / 2;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;

    for (var i = -1; i <= 1; i++) {
      var ox = Math.cos(perp) * i * 4;
      var oy = Math.sin(perp) * i * 4;
      var cx = sx + (tx - sx) * p + ox;
      var cy = sy + (ty - sy) * p + oy;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(angle) * 10, cy - Math.sin(angle) * 10);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }
  },

  // ============================================================
  //  技能特效渲染
  // ============================================================

  /**
   * 绘制技能特效
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} type - 特效类型
   * @param {number} x - 中心 x
   * @param {number} y - 中心 y
   * @param {number} progress - 0-1 动画进度
   * @param {object} [options] - { radius, color, targetX, targetY, startX, startY }
   */
  drawSkillEffect: function (ctx, type, x, y, progress, options) {
    ctx.save();
    var p = Math.max(0, Math.min(1, progress));
    var opt = options || {};

    switch (type) {
      case 'projectile_hit': this._effectProjectileHit(ctx, x, y, p, opt); break;
      case 'aoe_ring':       this._effectAoeRing(ctx, x, y, p, opt);       break;
      case 'heal_glow':      this._effectHealGlow(ctx, x, y, p, opt);      break;
      case 'buff_arrows':    this._effectBuffArrows(ctx, x, y, p, opt);    break;
      case 'slash_arc':      this._effectSlashArc(ctx, x, y, p, opt);      break;
      case 'summon_circle':  this._effectSummonCircle(ctx, x, y, p, opt);  break;
      case 'shockwave':      this._effectShockwave(ctx, x, y, p, opt);     break;
      case 'clone_flash':    this._effectCloneFlash(ctx, x, y, p, opt);    break;
      default: break;
    }

    ctx.restore();
  },

  // 投射物命中 — 飞向目标，到达后放大消失
  _effectProjectileHit: function (ctx, x, y, p, opt) {
    var sx = opt.startX || (x - 40);
    var sy = opt.startY || y;
    var color = opt.color || this.COLORS.GOLD;

    if (p < 0.6) {
      // 飞行阶段
      var t = p / 0.6;
      var cx = sx + (x - sx) * t;
      var cy = sy + (y - sy) * t;
      var r = 3;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 命中爆散
      var t2 = (p - 0.6) / 0.4;
      var r2 = 3 + t2 * 8;
      ctx.globalAlpha = 1 - t2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // 范围圆环 — 扩散
  _effectAoeRing: function (ctx, x, y, p, opt) {
    var maxR = opt.radius || 40;
    var r = maxR * p;
    ctx.globalAlpha = 1 - p;
    ctx.strokeStyle = opt.color || this.COLORS.RED;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  },

  // 治疗光环 — 绿色
  _effectHealGlow: function (ctx, x, y, p, opt) {
    var r = 6 + p * 16;
    ctx.globalAlpha = (1 - p) * 0.6;
    ctx.fillStyle = opt.color || this.COLORS.GREEN;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  },

  // 增益箭头 — 向上漂浮
  _effectBuffArrows: function (ctx, x, y, p, opt) {
    var color = opt.color || this.COLORS.GOLD;
    ctx.fillStyle = color;
    ctx.globalAlpha = 1 - p;

    for (var i = 0; i < 3; i++) {
      var ox = (i - 1) * 10;
      var oy = -p * 24 - i * 4;
      ctx.beginPath();
      ctx.moveTo(x + ox, y + oy - 6);
      ctx.lineTo(x + ox - 4, y + oy);
      ctx.lineTo(x + ox + 4, y + oy);
      ctx.closePath();
      ctx.fill();
    }
  },

  // 弧形斩击
  _effectSlashArc: function (ctx, x, y, p, opt) {
    var startAngle = -Math.PI * 0.6;
    var endAngle = startAngle + Math.PI * 1.2 * Math.min(p * 2, 1);
    ctx.globalAlpha = 1 - p;
    ctx.strokeStyle = opt.color || this.COLORS.RED;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 18 + p * 8, startAngle, endAngle);
    ctx.stroke();
  },

  // 召唤法阵 — 虚线圆 + 旋转
  _effectSummonCircle: function (ctx, x, y, p, opt) {
    var r = (opt.radius || 24) * (0.5 + p * 0.5);
    ctx.globalAlpha = 1 - p * 0.8;
    ctx.strokeStyle = opt.color || this.COLORS.PURPLE;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    ctx.translate(x, y);
    ctx.rotate(p * Math.PI * 2);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    // 内六芒
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = (Math.PI / 3) * i;
      var method = i === 0 ? 'moveTo' : 'lineTo';
      ctx[method](Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.setLineDash([]);
  },

  // 冲击波 — 菱形扩散
  _effectShockwave: function (ctx, x, y, p, opt) {
    var size = (opt.radius || 30) * p;
    ctx.globalAlpha = 1 - p;
    ctx.strokeStyle = opt.color || this.COLORS.GOLD;
    ctx.lineWidth = 2;

    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-size, -size, size * 2, size * 2);
  },

  // 分身闪烁
  _effectCloneFlash: function (ctx, x, y, p, opt) {
    var offsets = [[-16, 0], [16, 0], [0, -14]];
    ctx.globalAlpha = (1 - p) * 0.5;
    for (var i = 0; i < offsets.length; i++) {
      this._drawHumanoid(ctx, x + offsets[i][0], y + offsets[i][1], 1.0, '#555', {});
    }
    ctx.globalAlpha = 1;
  },

  // ============================================================
  //  状态效果渲染
  // ============================================================

  /**
   * 绘制状态效果图标
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} type - 'slow'|'burn'|'stun'
   * @param {number} x - 单位中心 x
   * @param {number} y - 单位中心 y
   */
  drawStatusEffect: function (ctx, type, x, y) {
    ctx.save();

    switch (type) {
      case 'slow':
        ctx.fillStyle = 'rgba(70,130,200,0.3)';
        ctx.beginPath();
        ctx.arc(x, y + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'burn':
        ctx.fillStyle = this.COLORS.FIRE;
        var t = (typeof performance !== 'undefined') ? performance.now() * 0.005 : 0;
        for (var i = 0; i < 4; i++) {
          var angle = (Math.PI * 2 / 4) * i + t;
          var fx = x + Math.cos(angle) * 8;
          var fy = y + Math.sin(angle) * 6 - 2 + Math.sin(t + i) * 2;
          ctx.beginPath();
          ctx.arc(fx, fy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'stun':
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var rot = (typeof performance !== 'undefined') ? performance.now() * 0.003 : 0;
        ctx.translate(x, y - 22);
        ctx.rotate(rot % (Math.PI * 2));
        ctx.fillText('★', 0, 0);
        break;
    }

    ctx.restore();
  },

  // ============================================================
  //  HP 血条
  // ============================================================

  /**
   * 绘制 HP 血条
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 血条中心 x
   * @param {number} y - 血条顶边 y
   * @param {number} ratio - 0-1
   * @param {number} [width] - 血条宽度 (默认 28)
   * @param {number} [height] - 血条高度 (默认 3)
   * @param {string} [color] - 覆盖颜色
   */
  drawHpBar: function (ctx, x, y, ratio, width, height, color) {
    var w = width || 28;
    var h = height || 3;
    var r = Math.max(0, Math.min(1, ratio));
    var bx = x - w / 2;

    // 背景
    ctx.fillStyle = this.COLORS.HP_BG;
    ctx.fillRect(bx, y, w, h);

    // 前景颜色
    var fgColor = color;
    if (!fgColor) {
      if (r > 0.5) fgColor = this.COLORS.HP_GREEN;
      else if (r > 0.25) fgColor = this.COLORS.HP_ORANGE;
      else fgColor = this.COLORS.HP_RED;
    }
    ctx.fillStyle = fgColor;
    ctx.fillRect(bx, y, w * r, h);
  },

  // ============================================================
  //  辅助方法
  // ============================================================

  /**
   * 绘制网格 — 可放置位置高亮
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<Array<number>>} grid - 碰撞网格 (0=可放置)
   * @param {object} towerPositions - { "x,y": true } 已有塔占位
   */
  drawGrid: function (ctx, grid, towerPositions) {
    if (!grid) return;
    ctx.save();
    var TILE = 48; // TD_CONSTANTS.TILE_SIZE
    var tp = towerPositions || {};

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#4caf50';

    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 0 && !tp[c + ',' + r]) {
          ctx.fillRect(c * TILE + 1, r * TILE + 1, TILE - 2, TILE - 2);
        }
      }
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
  },

  /**
   * 绘制射程圈
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cx - 圈心 x
   * @param {number} cy - 圈心 y
   * @param {number} range - 射程（像素）
   */
  drawRangeCircle: function (ctx, cx, cy, range) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245,197,24,0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,197,24,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  },

  /**
   * 绘制城主府 HP 条
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} hp - 当前 HP
   * @param {number} maxHp - 最大 HP
   * @param {number} canvasW - 画布宽
   * @param {number} canvasH - 画布高
   */
  drawTownHallHpBar: function (ctx, hp, maxHp, canvasW, canvasH) {
    if (maxHp <= 0) return;
    ctx.save();

    var barW = Math.min(260, canvasW - 40);
    var barH = 12;
    var barX = (canvasW - barW) / 2;
    var barY = 52;
    var ratio = Math.max(0, hp / maxHp);

    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    // HP 填充
    var hpColor;
    if (ratio > 0.5) hpColor = this.COLORS.HP_GREEN;
    else if (ratio > 0.25) hpColor = this.COLORS.HP_ORANGE;
    else hpColor = this.COLORS.HP_RED;
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * ratio, barH);

    // 文字
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('城主府 ' + Math.ceil(hp) + '/' + Math.ceil(maxHp), canvasW / 2, barY + barH / 2);

    ctx.restore();
  },

  // ============================================================
  //  内部辅助 — 基础人形 / 马匹 / 旗帜
  // ============================================================

  /**
   * 绘制基础人形
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 x
   * @param {number} y - 中心 y
   * @param {number} scale - 缩放倍率
   * @param {string} bodyColor - 身体颜色
   * @param {object} [options] - { facingLeft }
   */
  _drawHumanoid: function (ctx, x, y, scale, bodyColor, options) {
    var s = scale || 1.0;
    // 头部
    ctx.fillStyle = this.COLORS.SKIN;
    ctx.beginPath();
    ctx.arc(x, y - 16 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    // 身体
    ctx.fillStyle = bodyColor || '#8B6914';
    ctx.fillRect(x - 6 * s, y - 10 * s, 12 * s, 14 * s);
    // 腿
    ctx.strokeStyle = bodyColor || '#8B6914';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(x - 3 * s, y + 4 * s);
    ctx.lineTo(x - 5 * s, y + 12 * s);
    ctx.moveTo(x + 3 * s, y + 4 * s);
    ctx.lineTo(x + 5 * s, y + 12 * s);
    ctx.stroke();
  },

  /**
   * 绘制马匹
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 中心 x
   * @param {number} y - 中心 y
   * @param {number} scale - 缩放
   * @param {string} color - 马身颜色
   */
  _drawHorse: function (ctx, x, y, scale, color) {
    var s = scale || 1.0;
    // 马身 — 椭圆
    ctx.fillStyle = color || this.COLORS.WOOD;
    ctx.beginPath();
    ctx.ellipse(x, y, 14 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // 马腿
    ctx.strokeStyle = color || this.COLORS.WOOD;
    ctx.lineWidth = 2;
    var legs = [[-8, 8], [-4, 10], [4, 10], [8, 8]];
    for (var i = 0; i < legs.length; i++) {
      ctx.beginPath();
      ctx.moveTo(x + legs[i][0] * s, y + 6 * s);
      ctx.lineTo(x + legs[i][0] * s, y + 6 * s + legs[i][1] * s);
      ctx.stroke();
    }
  },

  /**
   * 绘制旗帜
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - 旗杆底部 x
   * @param {number} y - 旗杆底部 y
   * @param {string} color - 旗面颜色
   * @param {string} text - 旗面文字（可选）
   */
  _drawFlag: function (ctx, x, y, color, text) {
    // 旗杆
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 16);
    ctx.stroke();
    // 旗面 — 三角形
    ctx.fillStyle = color || this.COLORS.RED;
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x + 10, y - 12);
    ctx.lineTo(x, y - 8);
    ctx.closePath();
    ctx.fill();
    // 文字
    if (text) {
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(text, x + 5, y - 12);
    }
  },

  // ============================================================
  //  颜色工具
  // ============================================================

  /**
   * 简单地加深一个十六进制颜色
   * @param {string} hex - '#RRGGBB'
   * @param {number} amount - 加深量 0-255
   * @returns {string}
   */
  _darken: function (hex, amount) {
    var num = parseInt(hex.replace('#', ''), 16);
    var r = Math.max(0, (num >> 16) - amount);
    var g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    var b = Math.max(0, (num & 0xFF) - amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  // ============================================================
  //  Phase 1 增强 — 飘字系统
  // ============================================================

  drawDamageTexts: function (ctx, damageTexts) {
    if (!damageTexts || damageTexts.length === 0) return;
    ctx.save();
    for (var i = 0; i < damageTexts.length; i++) {
      var dt = damageTexts[i];
      var progress = dt.elapsed / dt.duration;
      var alpha = 1 - progress;
      var offsetY = -dt.floatDist * progress;

      ctx.globalAlpha = Math.max(0, alpha);

      var fontSize = 14;
      var color = '#FFF';
      var glow = false;
      if (dt.type === 'kill') {
        fontSize = 16;
        color = '#FF4444';
      } else if (dt.type === 'skill') {
        fontSize = 18;
        color = '#FF8C00';
      } else if (dt.type === 'manual_skill') {
        fontSize = 22;
        color = '#FFD700';
        glow = true;
      } else if (dt.type === 'emergency') {
        fontSize = 18;
        color = '#FF3333';
      } else if (dt.type === 'heal') {
        fontSize = 16;
        color = '#4CAF50';
      } else if (dt.type === 'crit') {
        fontSize = 20;
        color = '#FFD700';
      }

      if (dt.merged && dt.merged > 1) {
        fontSize += 2;
      }

      ctx.font = 'bold ' + fontSize + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 描边
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      var text = (typeof dt.damage === 'number') ? Math.floor(dt.damage).toString() : dt.damage;
      if (dt.merged && dt.merged > 1) text += ' ×' + dt.merged;

      // 手动技能发光效果
      if (glow) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;
      }

      ctx.strokeText(text, dt.x, dt.y + offsetY);
      ctx.fillStyle = color;
      ctx.fillText(text, dt.x, dt.y + offsetY);

      if (glow) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  },

  // ============================================================
  //  Phase 1 增强 — 击杀/死亡特效
  // ============================================================

  drawDyingEnemy: function (ctx, enemy) {
    if (!enemy || enemy.deathTimer === undefined) return;
    var progress = 1 - (enemy.deathTimer / 0.3);
    var alpha = 1 - progress;
    var scale = 1 + progress * 0.3;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(enemy.x, enemy.y);
    ctx.scale(scale, scale);

    // 简化的死亡动画：红色闪烁 + 缩放
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 68, 68, ' + alpha + ')';
    ctx.fill();

    // 金币粒子（3个）
    for (var p = 0; p < 3; p++) {
      var angle = (Math.PI * 2 / 3) * p + progress * Math.PI;
      var dist = progress * 20;
      var px = Math.cos(angle) * dist;
      var py = Math.sin(angle) * dist - progress * 15;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 197, 24, ' + alpha + ')';
      ctx.fill();
    }

    ctx.restore();
  },

  // ============================================================
  //  Phase 1 增强 — 连杀特效
  // ============================================================

  drawKillStreak: function (ctx, streakData, canvasW, canvasH) {
    if (!streakData || !streakData.text) return;
    var elapsed = streakData.elapsed || 0;
    var duration = 1.5;
    if (elapsed > duration) return;

    var progress = elapsed / duration;
    var alpha = progress < 0.3 ? (progress / 0.3) : (1 - (progress - 0.3) / 0.7);
    var scale = progress < 0.2 ? (0.5 + progress * 2.5) : 1.0;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(canvasW / 2, canvasH * 0.3);
    ctx.scale(scale, scale);

    var fontSize = streakData.fontSize || 28;
    ctx.font = 'bold ' + fontSize + 'px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 外发光
    ctx.shadowColor = streakData.color || '#FFD700';
    ctx.shadowBlur = 15;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(streakData.text, 0, 0);

    ctx.fillStyle = streakData.color || '#FFD700';
    ctx.fillText(streakData.text, 0, 0);

    ctx.shadowBlur = 0;
    ctx.restore();
  },

  // ============================================================
  //  Phase 1 增强 — 武将蓄力条
  // ============================================================

  drawChargeBar: function (ctx, x, y, progress, ready) {
    var barW = 30;
    var barH = 4;
    var bx = x - barW / 2;
    var by = y - 22;

    // 底色
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barW, barH);

    // 进度
    var ratio = Math.min(1, progress);
    ctx.fillStyle = ready ? '#FFD700' : '#4CAF50';
    ctx.fillRect(bx, by, barW * ratio, barH);

    // 边框
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);

    // 满蓄力闪烁
    if (ready) {
      var blink = Math.sin(Date.now() / 150) * 0.3 + 0.7;
      ctx.fillStyle = 'rgba(255, 215, 0, ' + blink * 0.3 + ')';
      ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);
    }
  },

  // ============================================================
  //  Phase 1 增强 — 速度指示器
  // ============================================================

  drawSpeedIndicator: function (ctx, speed, canvasW) {
    if (speed <= 1) return;
    ctx.save();
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = speed >= 3 ? '#FF4444' : '#FFD700';
    ctx.fillText(speed + '×', canvasW - 8, 18);
    ctx.restore();
  }
};
