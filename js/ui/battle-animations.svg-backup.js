/**
 * 战斗动画引擎 — SVG 预制动画系统
 *
 * 在战斗场景中使用 SVG 渲染单位和播放攻击/技能/治疗动画。
 * 通过 EventBus 监听战斗事件，自动播放对应动画。
 */
const BattleAnimations = {

  /** SVG 容器元素 */
  _svg: null,
  /** 场景宽高 */
  _width: 360,
  _height: 320,
  /** 当前战斗单位的位置映射 { uid: {x, y, side} } */
  _unitPositions: {},
  /** 动画队列 */
  _animQueue: [],
  _isPlaying: false,
  /** 当前战斗状态缓存 */
  _battleState: null,

  // ===== 常量 =====
  ALLY_X: 80,
  ENEMY_X: 280,
  UNIT_START_Y: 60,
  UNIT_GAP_Y: 55,
  UNIT_SIZE: 36,

  // ===== 颜色 =====
  COLORS: {
    allyHp: '#4caf50',
    enemyHp: '#e94560',
    heal: '#4caf50',
    damage: '#f44336',
    crit: '#f5c518',
    skill: '#2196f3',
    buff: '#9c27b0',
    death: '#555',
    shield: '#2196f3',
  },

  // ===== 初始化 =====
  init: function () {
    // 不主动创建，等 panel 调用 createScene
  },

  /**
   * 创建 SVG 战斗场景，插入到指定容器
   * @param {HTMLElement} container
   * @param {number} [width]
   * @param {number} [height]
   */
  createScene: function (container, width, height) {
    this._width = width || container.clientWidth || 360;
    this._height = height || 320;

    // 打底 SVG
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + this._width + ' ' + this._height);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', this._height);
    svg.style.display = 'block';
    svg.style.borderRadius = '8px';
    svg.style.background = 'linear-gradient(180deg, #0d1b2a 0%, #1a1a2e 100%)';
    svg.style.overflow = 'hidden';
    svg.id = 'battle-svg';

    // defs（渐变、滤镜）
    svg.innerHTML = this._buildDefs();

    container.innerHTML = '';
    container.appendChild(svg);
    this._svg = svg;
  },

  _buildDefs: function () {
    return '<defs>' +
      // 场景背景渐变
      '<linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#0d1b2a"/>' +
        '<stop offset="100%" stop-color="#1a1a2e"/>' +
      '</linearGradient>' +
      // 地面
      '<linearGradient id="ground-grad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#16213e"/>' +
        '<stop offset="100%" stop-color="#0d1b2a"/>' +
      '</linearGradient>' +
      // HP 条颜色
      '<linearGradient id="hp-green" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#2e7d32"/>' +
        '<stop offset="100%" stop-color="#4caf50"/>' +
      '</linearGradient>' +
      '<linearGradient id="hp-red" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#c62828"/>' +
        '<stop offset="100%" stop-color="#e94560"/>' +
      '</linearGradient>' +
      '<linearGradient id="hp-orange" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#e65100"/>' +
        '<stop offset="100%" stop-color="#ff9800"/>' +
      '</linearGradient>' +
      // 发光滤镜
      '<filter id="glow">' +
        '<feGaussianBlur stdDeviation="3" result="blur"/>' +
        '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>' +
      '<filter id="glow-strong">' +
        '<feGaussianBlur stdDeviation="6" result="blur"/>' +
        '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>' +
      // 阴影
      '<filter id="shadow">' +
        '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>' +
      '</filter>' +
    '</defs>';
  },

  // ===== 渲染战斗场景 =====

  /**
   * 渲染/更新完整战斗场景
   * @param {Object} battleState - BattleManager.getBattleState()
   */
  renderBattle: function (battleState) {
    if (!this._svg || !battleState) return;
    this._battleState = battleState;

    // 保留 defs，清除其他
    var defs = this._svg.querySelector('defs');
    this._svg.innerHTML = '';
    if (defs) this._svg.appendChild(defs);

    // 场景装饰
    this._drawBackground();

    // 回合数
    this._drawRoundBadge(battleState.round, battleState.phase);

    // VS 文字
    this._drawVS();

    // 计算位置并绘制单位
    this._unitPositions = {};
    this._drawUnits(battleState.allies, true);
    this._drawUnits(battleState.enemies, false);
  },

  _drawBackground: function () {
    var w = this._width;
    var h = this._height;

    // 地面线
    var ground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ground.setAttribute('x', '0');
    ground.setAttribute('y', String(h - 30));
    ground.setAttribute('width', String(w));
    ground.setAttribute('height', '30');
    ground.setAttribute('fill', 'url(#ground-grad)');
    ground.setAttribute('opacity', '0.6');
    this._svg.appendChild(ground);

    // 装饰线
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', String(h - 30));
    line.setAttribute('x2', String(w));
    line.setAttribute('y2', String(h - 30));
    line.setAttribute('stroke', '#0f3460');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('opacity', '0.5');
    this._svg.appendChild(line);

    // 中线
    var midLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    midLine.setAttribute('x1', String(w / 2));
    midLine.setAttribute('y1', '30');
    midLine.setAttribute('x2', String(w / 2));
    midLine.setAttribute('y2', String(h - 30));
    midLine.setAttribute('stroke', '#0f3460');
    midLine.setAttribute('stroke-width', '1');
    midLine.setAttribute('stroke-dasharray', '4,4');
    midLine.setAttribute('opacity', '0.3');
    this._svg.appendChild(midLine);
  },

  _drawRoundBadge: function (round, phase) {
    var cx = this._width / 2;
    var text;
    var color = '#f5c518';
    if (phase === 'fighting') {
      text = '第 ' + round + ' 回合';
    } else if (phase === 'victory') {
      text = '🎉 胜利！';
      color = '#4caf50';
    } else if (phase === 'defeat') {
      text = '💀 战败';
      color = '#e94560';
    } else {
      text = '准备就绪';
    }

    var bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', String(cx - 50));
    bg.setAttribute('y', '6');
    bg.setAttribute('width', '100');
    bg.setAttribute('height', '20');
    bg.setAttribute('rx', '10');
    bg.setAttribute('fill', '#16213e');
    bg.setAttribute('stroke', '#0f3460');
    bg.setAttribute('stroke-width', '1');
    this._svg.appendChild(bg);

    var label = this._createText(cx, 20, text, '11px', color, 'middle');
    this._svg.appendChild(label);
  },

  _drawVS: function () {
    var cx = this._width / 2;
    var cy = this._height / 2;

    // VS glow circle
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', '18');
    circle.setAttribute('fill', 'rgba(233,69,96,0.1)');
    circle.setAttribute('stroke', '#e94560');
    circle.setAttribute('stroke-width', '1');
    circle.setAttribute('opacity', '0.6');
    this._svg.appendChild(circle);

    var vs = this._createText(cx, cy + 5, 'VS', '14px', '#e94560', 'middle');
    vs.setAttribute('font-weight', 'bold');
    vs.setAttribute('filter', 'url(#glow)');
    this._svg.appendChild(vs);
  },

  _drawUnits: function (units, isAlly) {
    var baseX = isAlly ? this.ALLY_X : this.ENEMY_X;
    var count = units.length;
    var totalHeight = count * this.UNIT_GAP_Y;
    var startY = Math.max(this.UNIT_START_Y, (this._height - totalHeight) / 2);

    for (var i = 0; i < units.length; i++) {
      var unit = units[i];
      var x = baseX;
      var y = startY + i * this.UNIT_GAP_Y;

      this._unitPositions[unit.uid] = { x: x, y: y, side: isAlly ? 'ally' : 'enemy' };
      this._drawUnit(unit, x, y, isAlly);
    }
  },

  _drawUnit: function (unit, cx, cy, isAlly) {
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', 'unit-' + unit.uid);
    g.setAttribute('class', 'battle-unit-svg' + (unit.isAlive ? '' : ' dead'));

    if (!unit.isAlive) {
      g.setAttribute('opacity', '0.3');
    }

    // 底部阴影椭圆
    var shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    shadow.setAttribute('cx', String(cx));
    shadow.setAttribute('cy', String(cy + 18));
    shadow.setAttribute('rx', '18');
    shadow.setAttribute('ry', '5');
    shadow.setAttribute('fill', 'rgba(0,0,0,0.3)');
    g.appendChild(shadow);

    // 角色圆圈（带品质色边框）
    var borderColor = isAlly ? '#4caf50' : '#e94560';
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', String(this.UNIT_SIZE / 2));
    circle.setAttribute('fill', '#16213e');
    circle.setAttribute('stroke', borderColor);
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);

    // Emoji 头像
    var emoji = unit.emoji || (isAlly ? '⚔️' : '👹');
    if (!unit.isAlive) emoji = '💀';
    var emojiText = this._createText(cx, cy + 5, emoji, '18px', '#fff', 'middle');
    g.appendChild(emojiText);

    // 名字
    var nameY = cy - this.UNIT_SIZE / 2 - 6;
    var name = this._createText(cx, nameY, unit.name, '10px', '#eee', 'middle');
    name.setAttribute('font-weight', '600');
    g.appendChild(name);

    // HP 条
    if (unit.isAlive) {
      var hpBarWidth = 44;
      var hpBarHeight = 5;
      var hpBarX = cx - hpBarWidth / 2;
      var hpBarY = cy + this.UNIT_SIZE / 2 + 4;
      var hpPct = unit.maxHp > 0 ? unit.currentHp / unit.maxHp : 0;

      // HP 背景
      var hpBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hpBg.setAttribute('x', String(hpBarX));
      hpBg.setAttribute('y', String(hpBarY));
      hpBg.setAttribute('width', String(hpBarWidth));
      hpBg.setAttribute('height', String(hpBarHeight));
      hpBg.setAttribute('rx', '3');
      hpBg.setAttribute('fill', '#0d1b2a');
      g.appendChild(hpBg);

      // HP 填充
      var hpGrad = hpPct > 0.66 ? 'url(#hp-green)' :
                   hpPct > 0.33 ? 'url(#hp-orange)' : 'url(#hp-red)';
      var hpFill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hpFill.setAttribute('x', String(hpBarX));
      hpFill.setAttribute('y', String(hpBarY));
      hpFill.setAttribute('width', String(Math.max(0, hpBarWidth * hpPct)));
      hpFill.setAttribute('height', String(hpBarHeight));
      hpFill.setAttribute('rx', '3');
      hpFill.setAttribute('fill', hpGrad);
      hpFill.setAttribute('id', 'hp-fill-' + unit.uid);
      g.appendChild(hpFill);

      // HP 文字
      var hpText = this._createText(cx, hpBarY + hpBarHeight + 10,
        unit.currentHp + '/' + unit.maxHp, '8px', '#999', 'middle');
      g.appendChild(hpText);

      // Buff 图标
      if (unit.buffs && unit.buffs.length > 0) {
        var buffY = hpBarY + hpBarHeight + 16;
        for (var b = 0; b < unit.buffs.length; b++) {
          var buff = unit.buffs[b];
          var buffIcon = buff.ratio > 0 ? '▲' : '▼';
          var buffColor = buff.ratio > 0 ? '#4caf50' : '#e94560';
          var buffText = this._createText(cx - 12 + b * 14, buffY + 8, buffIcon, '8px', buffColor, 'middle');
          g.appendChild(buffText);
        }
      }
    }

    this._svg.appendChild(g);
  },

  // ===== 动画播放 =====

  /**
   * 播放攻击动画
   * @param {string} attackerUid
   * @param {string} targetUid
   * @param {number} damage
   * @param {boolean} isCrit
   * @param {Function} [onComplete]
   */
  playAttack: function (attackerUid, targetUid, damage, isCrit, onComplete) {
    var attacker = this._unitPositions[attackerUid];
    var target = this._unitPositions[targetUid];
    if (!attacker || !target || !this._svg) {
      if (onComplete) onComplete();
      return;
    }

    var self = this;

    // 1. 攻击者冲锋动画
    this._animateLunge(attackerUid, target.x, target.y, function () {
      // 2. 命中特效
      if (isCrit) {
        self._playCritEffect(target.x, target.y);
      } else {
        self._playSlashEffect(target.x, target.y);
      }

      // 3. 被击目标震动
      self._animateShake(targetUid);

      // 4. 伤害数字
      self._showDamageNumber(target.x, target.y, '-' + damage, isCrit);

      // 5. 更新 HP
      self._updateUnitHp(targetUid);

      if (onComplete) setTimeout(onComplete, 300);
    });
  },

  /**
   * 播放技能动画
   */
  playSkill: function (casterUid, targetUids, skillName, type, values, onComplete) {
    var caster = this._unitPositions[casterUid];
    if (!caster || !this._svg) {
      if (onComplete) onComplete();
      return;
    }

    var self = this;

    // 技能名称闪过
    this._showSkillName(caster.x, caster.y - 30, skillName);

    // 施法者发光
    this._animateGlow(casterUid, '#2196f3');

    setTimeout(function () {
      if (type === 'heal') {
        for (var i = 0; i < targetUids.length; i++) {
          var pos = self._unitPositions[targetUids[i]];
          if (pos) {
            self._playHealEffect(pos.x, pos.y);
            self._showHealNumber(pos.x, pos.y, '+' + (values[i] || 0));
            self._updateUnitHp(targetUids[i]);
          }
        }
      } else if (type === 'damage') {
        for (var j = 0; j < targetUids.length; j++) {
          var tpos = self._unitPositions[targetUids[j]];
          if (tpos) {
            self._playSkillHitEffect(tpos.x, tpos.y);
            self._animateShake(targetUids[j]);
            self._showDamageNumber(tpos.x, tpos.y, '-' + (values[j] || 0), false);
            self._updateUnitHp(targetUids[j]);
          }
        }
      } else if (type === 'buff' || type === 'debuff') {
        for (var k = 0; k < targetUids.length; k++) {
          var bpos = self._unitPositions[targetUids[k]];
          if (bpos) {
            self._playBuffEffect(bpos.x, bpos.y, type === 'buff');
          }
        }
      }

      if (onComplete) setTimeout(onComplete, 400);
    }, 350);
  },

  /**
   * 播放单位死亡动画
   */
  playDeath: function (unitUid) {
    var unitG = this._svg ? this._svg.querySelector('#unit-' + unitUid) : null;
    if (!unitG) return;

    var pos = this._unitPositions[unitUid];
    if (pos) {
      this._playDeathEffect(pos.x, pos.y);
    }

    // 淡出
    unitG.style.transition = 'opacity 0.5s ease';
    unitG.style.opacity = '0.2';
  },

  // ===== 动画基元 =====

  /** 冲锋 —— 攻击者快速移向目标再弹回 */
  _animateLunge: function (unitUid, tx, ty, onHit) {
    var unitG = this._svg ? this._svg.querySelector('#unit-' + unitUid) : null;
    if (!unitG) { if (onHit) onHit(); return; }

    var pos = this._unitPositions[unitUid];
    var dx = (tx - pos.x) * 0.4;
    var dy = (ty - pos.y) * 0.2;

    // 利用 CSS transform 做快速冲锋
    unitG.style.transition = 'transform 0.15s ease-in';
    unitG.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';

    setTimeout(function () {
      if (onHit) onHit();
      unitG.style.transition = 'transform 0.2s ease-out';
      unitG.style.transform = 'translate(0, 0)';
    }, 150);
  },

  /** 被击震动 */
  _animateShake: function (unitUid) {
    var unitG = this._svg ? this._svg.querySelector('#unit-' + unitUid) : null;
    if (!unitG) return;

    var cls = 'unit-shake';
    unitG.classList.add(cls);
    setTimeout(function () { unitG.classList.remove(cls); }, 300);
  },

  /** 发光效果 */
  _animateGlow: function (unitUid, color) {
    var pos = this._unitPositions[unitUid];
    if (!pos || !this._svg) return;

    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r', '22');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('opacity', '0.8');
    circle.setAttribute('filter', 'url(#glow)');
    circle.classList.add('anim-glow-ring');
    this._svg.appendChild(circle);

    setTimeout(function () { if (circle.parentNode) circle.parentNode.removeChild(circle); }, 600);
  },

  // ===== 特效 =====

  /** 普通斩击 */
  _playSlashEffect: function (x, y) {
    if (!this._svg) return;
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('anim-slash');

    // 两条交叉斩线
    var line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', String(x - 16));
    line1.setAttribute('y1', String(y - 12));
    line1.setAttribute('x2', String(x + 16));
    line1.setAttribute('y2', String(y + 12));
    line1.setAttribute('stroke', '#fff');
    line1.setAttribute('stroke-width', '2.5');
    line1.setAttribute('stroke-linecap', 'round');
    line1.setAttribute('opacity', '0.9');
    g.appendChild(line1);

    var line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', String(x + 14));
    line2.setAttribute('y1', String(y - 10));
    line2.setAttribute('x2', String(x - 14));
    line2.setAttribute('y2', String(y + 10));
    line2.setAttribute('stroke', '#fff');
    line2.setAttribute('stroke-width', '2');
    line2.setAttribute('stroke-linecap', 'round');
    line2.setAttribute('opacity', '0.7');
    g.appendChild(line2);

    this._svg.appendChild(g);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 350);
  },

  /** 暴击特效 */
  _playCritEffect: function (x, y) {
    if (!this._svg) return;
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('anim-crit');

    // 爆炸圆
    var burst = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    burst.setAttribute('cx', String(x));
    burst.setAttribute('cy', String(y));
    burst.setAttribute('r', '5');
    burst.setAttribute('fill', '#f5c518');
    burst.setAttribute('opacity', '0.9');
    burst.setAttribute('filter', 'url(#glow-strong)');
    g.appendChild(burst);

    // 多道斩线
    for (var i = 0; i < 6; i++) {
      var angle = (i * 60) * Math.PI / 180;
      var len = 18;
      var sl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      sl.setAttribute('x1', String(x + Math.cos(angle) * 4));
      sl.setAttribute('y1', String(y + Math.sin(angle) * 4));
      sl.setAttribute('x2', String(x + Math.cos(angle) * len));
      sl.setAttribute('y2', String(y + Math.sin(angle) * len));
      sl.setAttribute('stroke', '#f5c518');
      sl.setAttribute('stroke-width', '2');
      sl.setAttribute('stroke-linecap', 'round');
      sl.setAttribute('opacity', '0.8');
      g.appendChild(sl);
    }

    this._svg.appendChild(g);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 450);
  },

  /** 技能命中特效 */
  _playSkillHitEffect: function (x, y) {
    if (!this._svg) return;
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('anim-skill-hit');

    // 蓝色波纹
    for (var i = 0; i < 3; i++) {
      var ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', String(x));
      ring.setAttribute('cy', String(y));
      ring.setAttribute('r', String(6 + i * 8));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#2196f3');
      ring.setAttribute('stroke-width', '1.5');
      ring.setAttribute('opacity', String(0.7 - i * 0.2));
      ring.style.animation = 'svgRipple 0.5s ease-out ' + (i * 0.1) + 's forwards';
      g.appendChild(ring);
    }

    this._svg.appendChild(g);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 700);
  },

  /** 治疗特效 */
  _playHealEffect: function (x, y) {
    if (!this._svg) return;
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('anim-heal');

    // 上升的绿色粒子
    for (var i = 0; i < 6; i++) {
      var particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      var px = x - 12 + Math.random() * 24;
      particle.setAttribute('cx', String(px));
      particle.setAttribute('cy', String(y + 10));
      particle.setAttribute('r', String(2 + Math.random() * 2));
      particle.setAttribute('fill', '#4caf50');
      particle.setAttribute('opacity', '0.8');
      particle.style.animation = 'svgHealRise 0.8s ease-out ' + (i * 0.08) + 's forwards';
      g.appendChild(particle);
    }

    // 十字标志
    var cross1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    cross1.setAttribute('x1', String(x));
    cross1.setAttribute('y1', String(y - 8));
    cross1.setAttribute('x2', String(x));
    cross1.setAttribute('y2', String(y + 8));
    cross1.setAttribute('stroke', '#4caf50');
    cross1.setAttribute('stroke-width', '2.5');
    cross1.setAttribute('stroke-linecap', 'round');
    cross1.setAttribute('opacity', '0.9');
    cross1.setAttribute('filter', 'url(#glow)');
    g.appendChild(cross1);

    var cross2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    cross2.setAttribute('x1', String(x - 8));
    cross2.setAttribute('y1', String(y));
    cross2.setAttribute('x2', String(x + 8));
    cross2.setAttribute('y2', String(y));
    cross2.setAttribute('stroke', '#4caf50');
    cross2.setAttribute('stroke-width', '2.5');
    cross2.setAttribute('stroke-linecap', 'round');
    cross2.setAttribute('opacity', '0.9');
    cross2.setAttribute('filter', 'url(#glow)');
    g.appendChild(cross2);

    this._svg.appendChild(g);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 900);
  },

  /** Buff/Debuff 特效 */
  _playBuffEffect: function (x, y, isBuff) {
    if (!this._svg) return;
    var color = isBuff ? '#9c27b0' : '#f44336';
    var arrow = isBuff ? '▲' : '▼';

    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('anim-buff');

    // 光环
    var ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('cx', String(x));
    ring.setAttribute('cy', String(y));
    ring.setAttribute('r', '20');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', color);
    ring.setAttribute('stroke-width', '1.5');
    ring.setAttribute('opacity', '0.6');
    ring.setAttribute('filter', 'url(#glow)');
    g.appendChild(ring);

    // 箭头
    var arrowText = this._createText(x, y - 26, arrow, '14px', color, 'middle');
    arrowText.style.animation = 'svgFloatUp 0.8s ease-out forwards';
    g.appendChild(arrowText);

    this._svg.appendChild(g);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 800);
  },

  /** 死亡爆散特效 */
  _playDeathEffect: function (x, y) {
    if (!this._svg) return;
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('anim-death');

    // 红色碎片飞散
    for (var i = 0; i < 8; i++) {
      var angle = (i * 45) * Math.PI / 180;
      var frag = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      frag.setAttribute('x', String(x - 2));
      frag.setAttribute('y', String(y - 2));
      frag.setAttribute('width', '4');
      frag.setAttribute('height', '4');
      frag.setAttribute('fill', '#e94560');
      frag.setAttribute('opacity', '0.8');
      var tx = Math.cos(angle) * 24;
      var ty = Math.sin(angle) * 24;
      frag.style.animation = 'svgExplode 0.6s ease-out forwards';
      frag.style.setProperty('--tx', tx + 'px');
      frag.style.setProperty('--ty', ty + 'px');
      g.appendChild(frag);
    }

    this._svg.appendChild(g);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 700);
  },

  // ===== 数字显示 =====

  _showDamageNumber: function (x, y, text, isCrit) {
    if (!this._svg) return;
    var color = isCrit ? '#f5c518' : '#f44336';
    var size = isCrit ? '16px' : '13px';
    var t = this._createText(x + (Math.random() - 0.5) * 16, y - 8, text, size, color, 'middle');
    t.setAttribute('font-weight', 'bold');
    t.setAttribute('filter', 'url(#glow)');
    t.style.animation = 'svgDmgFloat 0.8s ease-out forwards';
    if (isCrit) {
      // 追加 CRIT 标签
      var critLabel = this._createText(x, y - 24, '💥暴击', '10px', '#f5c518', 'middle');
      critLabel.style.animation = 'svgDmgFloat 0.8s ease-out 0.1s forwards';
      this._svg.appendChild(critLabel);
      setTimeout(function () { if (critLabel.parentNode) critLabel.parentNode.removeChild(critLabel); }, 900);
    }
    this._svg.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 900);
  },

  _showHealNumber: function (x, y, text) {
    if (!this._svg) return;
    var t = this._createText(x, y - 8, text, '13px', '#4caf50', 'middle');
    t.setAttribute('font-weight', 'bold');
    t.setAttribute('filter', 'url(#glow)');
    t.style.animation = 'svgDmgFloat 0.8s ease-out forwards';
    this._svg.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 900);
  },

  _showSkillName: function (x, y, name) {
    if (!this._svg) return;
    var t = this._createText(x, y, '✨' + name, '11px', '#2196f3', 'middle');
    t.setAttribute('font-weight', 'bold');
    t.setAttribute('filter', 'url(#glow)');
    t.style.animation = 'svgSkillName 0.8s ease-out forwards';
    this._svg.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 900);
  },

  // ===== HP 更新 =====

  _updateUnitHp: function (unitUid) {
    if (!this._svg || !this._battleState) return;

    // 查找当前 HP
    var unit = this._findUnit(unitUid);
    if (!unit) return;

    var hpFill = this._svg.querySelector('#hp-fill-' + unitUid);
    if (hpFill) {
      var pct = unit.maxHp > 0 ? unit.currentHp / unit.maxHp : 0;
      var hpGrad = pct > 0.66 ? 'url(#hp-green)' :
                   pct > 0.33 ? 'url(#hp-orange)' : 'url(#hp-red)';
      hpFill.setAttribute('width', String(Math.max(0, 44 * pct)));
      hpFill.setAttribute('fill', hpGrad);
    }

    // 死亡检查
    if (!unit.isAlive) {
      this.playDeath(unitUid);
    }
  },

  _findUnit: function (uid) {
    if (!this._battleState) return null;
    var all = this._battleState.allies.concat(this._battleState.enemies);
    for (var i = 0; i < all.length; i++) {
      if (all[i].uid === uid) return all[i];
    }
    return null;
  },

  // ===== 工具方法 =====

  _createText: function (x, y, text, size, fill, anchor) {
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('font-size', size || '12px');
    t.setAttribute('fill', fill || '#eee');
    t.setAttribute('text-anchor', anchor || 'middle');
    t.setAttribute('font-family', "'Microsoft YaHei','PingFang SC',sans-serif");
    t.textContent = text;
    return t;
  },

  /** 清除场景 */
  clear: function () {
    if (this._svg) {
      this._svg.innerHTML = '';
    }
    this._unitPositions = {};
    this._battleState = null;
  }
};
