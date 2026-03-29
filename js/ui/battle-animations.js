/**
 * 战斗动画引擎 — Canvas 像素精灵系统
 *
 * 使用 Canvas 渲染像素角色精灵和战斗特效，替代原 SVG 系统。
 * 保持相同的公共 API 以兼容 battle-panel.js。
 */
var BattleAnimations = {

  _canvas: null,
  _ctx: null,
  _width: 360,
  _height: 280,
  _unitPositions: {},
  _battleState: null,
  _loaded: false,
  _rafId: null,

  // 精灵动画实例 { uid: SpriteAnimation }
  _sprites: {},
  // 特效动画队列 [{ anim, x, y, w, h, onFinish }]
  _effects: [],
  // 伤害/治疗飘字 [{ text, x, y, color, life, maxLife }]
  _floatTexts: [],
  // 上一帧时间戳
  _lastTime: 0,

  // ===== 布局常量 =====
  ALLY_X: 55,
  ENEMY_X: 260,
  UNIT_START_Y: 45,
  UNIT_GAP_Y: 52,
  SPRITE_SIZE: 48,
  HP_BAR_W: 44,
  HP_BAR_H: 4,

  COLORS: {
    allyHp: '#4caf50',
    enemyHp: '#e94560',
    heal: '#4caf50',
    damage: '#f44336',
    crit: '#f5c518',
    skill: '#2196f3',
    buff: '#9c27b0',
    hpBg: 'rgba(0,0,0,0.5)',
    ground: '#16213e',
  },

  // ===== 初始化 =====
  init: function () {
    SpriteEngine.preloadBattle().then(function () {
      BattleAnimations._loaded = true;
    });
  },

  /**
   * 创建 Canvas 战斗场景
   * @param {HTMLElement} container
   */
  createScene: function (container) {
    this._width = container.clientWidth || 360;
    this._height = 280;

    // 停止旧的渲染循环
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    var canvas = document.createElement('canvas');
    canvas.id = 'battle-canvas';
    canvas.width = this._width;
    canvas.height = this._height;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = this._height + 'px';
    canvas.style.borderRadius = '8px';
    canvas.style.imageRendering = 'pixelated';

    container.innerHTML = '';
    container.appendChild(canvas);
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._ctx.imageSmoothingEnabled = false;

    this._sprites = {};
    this._effects = [];
    this._floatTexts = [];
    this._lastTime = 0;

    // 预加载（如果还没完成）
    if (!this._loaded) {
      SpriteEngine.preloadBattle().then(function () {
        BattleAnimations._loaded = true;
      });
    }

    // 启动渲染循环
    this._startRenderLoop();
  },

  /**
   * 渲染/更新战斗场景（由 battle-panel 调用）
   * @param {Object} battleState
   */
  renderBattle: function (battleState) {
    if (!this._canvas || !battleState) return;
    this._battleState = battleState;

    // 更新单位位置映射和精灵
    this._updateUnitPositions(battleState);
  },

  // ===== 渲染循环 =====

  _startRenderLoop: function () {
    var self = this;
    self._lastTime = performance.now();

    function loop(now) {
      self._rafId = requestAnimationFrame(loop);
      var dt = Math.min((now - self._lastTime) / 1000, 0.1);
      self._lastTime = now;
      self._update(dt);
      self._draw();
    }
    self._rafId = requestAnimationFrame(loop);
  },

  _update: function (dt) {
    // 更新角色精灵动画
    for (var uid in this._sprites) {
      this._sprites[uid].update(dt);
    }

    // 更新特效
    for (var i = this._effects.length - 1; i >= 0; i--) {
      this._effects[i].anim.update(dt);
      if (this._effects[i].anim.finished) {
        if (this._effects[i].onFinish) this._effects[i].onFinish();
        this._effects.splice(i, 1);
      }
    }

    // 更新飘字
    for (var j = this._floatTexts.length - 1; j >= 0; j--) {
      this._floatTexts[j].life -= dt;
      this._floatTexts[j].y -= 30 * dt;
      if (this._floatTexts[j].life <= 0) {
        this._floatTexts.splice(j, 1);
      }
    }
  },

  _draw: function () {
    var ctx = this._ctx;
    if (!ctx) return;
    var w = this._width;
    var h = this._height;

    // 清除画布
    ctx.clearRect(0, 0, w, h);

    // 背景
    this._drawBackground(ctx, w, h);

    if (!this._battleState || !this._loaded) {
      this._drawLoadingText(ctx, w, h);
      return;
    }

    // 绘制单位
    this._drawAllUnits(ctx);

    // 绘制特效
    this._drawEffects(ctx);

    // 绘制飘字
    this._drawFloatTexts(ctx);

    // 回合/状态指示
    this._drawStatusBadge(ctx, w);
  },

  // ===== 背景 =====

  _drawBackground: function (ctx, w, h) {
    // 深色渐变背景
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0d1b2a');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 地面
    ctx.fillStyle = this.COLORS.ground;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, h - 25, w, 25);
    ctx.globalAlpha = 1;

    // 中线
    ctx.strokeStyle = '#0f3460';
    ctx.globalAlpha = 0.3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 30);
    ctx.lineTo(w / 2, h - 25);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // VS 圆
    var cx = w / 2;
    var cy = h / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233,69,96,0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(233,69,96,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', cx, cy);
  },

  _drawLoadingText: function (ctx, w, h) {
    ctx.fillStyle = '#999';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('加载中...', w / 2, h / 2);
  },

  _drawStatusBadge: function (ctx, w) {
    var bs = this._battleState;
    if (!bs) return;

    var text, color;
    if (bs.phase === 'fighting') {
      text = '第 ' + bs.round + ' 回合';
      color = '#f5c518';
    } else if (bs.phase === 'victory') {
      text = '✦ 胜利！';
      color = '#4caf50';
    } else if (bs.phase === 'defeat') {
      text = '✦ 战败';
      color = '#e94560';
    } else {
      text = '准备就绪';
      color = '#999';
    }

    var cx = w / 2;
    ctx.fillStyle = '#16213e';
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 1;

    // 圆角矩形（兼容旧浏览器）
    var bw = 80, bh = 18;
    var rx = cx - bw / 2, ry = 5, r = 9;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(rx, ry, bw, bh, r);
    } else {
      ctx.moveTo(rx + r, ry);
      ctx.lineTo(rx + bw - r, ry);
      ctx.arcTo(rx + bw, ry, rx + bw, ry + r, r);
      ctx.lineTo(rx + bw, ry + bh - r);
      ctx.arcTo(rx + bw, ry + bh, rx + bw - r, ry + bh, r);
      ctx.lineTo(rx + r, ry + bh);
      ctx.arcTo(rx, ry + bh, rx, ry + bh - r, r);
      ctx.lineTo(rx, ry + r);
      ctx.arcTo(rx, ry, rx + r, ry, r);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, 14);
  },

  // ===== 单位位置计算 =====

  _updateUnitPositions: function (bs) {
    this._unitPositions = {};
    var self = this;

    function layoutUnits(units, isAlly) {
      var baseX = isAlly ? self.ALLY_X : self.ENEMY_X;
      var count = units.length;
      var totalH = count * self.UNIT_GAP_Y;
      var startY = Math.max(self.UNIT_START_Y, (self._height - 25 - totalH) / 2);

      for (var i = 0; i < units.length; i++) {
        var unit = units[i];
        var x = baseX;
        var y = startY + i * self.UNIT_GAP_Y;
        self._unitPositions[unit.uid] = { x: x, y: y, isAlly: isAlly, unit: unit };

        // 创建或更新精灵动画
        self._ensureSprite(unit, isAlly);
      }
    }

    if (bs.allies) layoutUnits(bs.allies, true);
    if (bs.enemies) layoutUnits(bs.enemies, false);
  },

  _ensureSprite: function (unit, isAlly) {
    var charType = isAlly ? 'soldier' : 'orc';
    var charDefs = SpriteAtlas.characters[charType];

    if (!this._sprites[unit.uid]) {
      this._sprites[unit.uid] = new SpriteAnimation(charDefs.idle);
    }

    var sprite = this._sprites[unit.uid];

    // 根据单位状态选择动画
    if (unit.currentHp <= 0) {
      if (sprite.def.src !== charDefs.death.src) {
        sprite.switchTo(charDefs.death);
        sprite.loop = false;
      }
    } else if (sprite.finished && sprite.def.src !== charDefs.idle.src) {
      // 非循环动画播放完毕，回到 idle
      sprite.def = charDefs.idle;
      sprite.loop = true;
      sprite.reset();
    }
  },

  // ===== 绘制单位 =====

  _drawAllUnits: function (ctx) {
    for (var uid in this._unitPositions) {
      var pos = this._unitPositions[uid];
      var unit = pos.unit;
      var sprite = this._sprites[uid];
      if (!sprite) continue;

      var sz = this.SPRITE_SIZE;
      var x = pos.x - sz / 2;
      var y = pos.y - sz / 2;
      var flipX = !pos.isAlly; // 敌方翻转

      // 死亡单位半透明
      if (unit.currentHp <= 0) {
        ctx.globalAlpha = 0.5;
      }

      // 绘制精灵
      sprite.draw(ctx, x, y, sz, sz, flipX);

      ctx.globalAlpha = 1;

      // 名字
      ctx.fillStyle = pos.isAlly ? '#8ec8f8' : '#f8a8a8';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      var displayName = unit.name || '';
      if (displayName.length > 4) displayName = displayName.substring(0, 4);
      ctx.fillText(displayName, pos.x, y + sz + 1);

      // HP 条
      if (unit.currentHp > 0 && unit.maxHp > 0) {
        this._drawHpBar(ctx, pos.x, y + sz + 12, unit.currentHp, unit.maxHp, pos.isAlly);
      }

      // Buff/Debuff 标记
      this._drawBuffIcons(ctx, pos.x, y - 6, unit);
    }
  },

  _drawHpBar: function (ctx, cx, y, hp, maxHp, isAlly) {
    var w = this.HP_BAR_W;
    var h = this.HP_BAR_H;
    var x = cx - w / 2;
    var ratio = Math.max(0, Math.min(1, hp / maxHp));

    // 背景
    ctx.fillStyle = this.COLORS.hpBg;
    ctx.fillRect(x, y, w, h);

    // 血量颜色
    var color;
    if (ratio > 0.66) color = this.COLORS.allyHp;
    else if (ratio > 0.33) color = '#ff9800';
    else color = this.COLORS.enemyHp;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * ratio, h);

    // 边框
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, w, h);
  },

  _drawBuffIcons: function (ctx, cx, y, unit) {
    if (!unit.buffs || unit.buffs.length === 0) return;
    var iconSize = 10;
    var total = Math.min(unit.buffs.length, 4);
    var startX = cx - (total * (iconSize + 2)) / 2;

    for (var i = 0; i < total; i++) {
      var buff = unit.buffs[i];
      var bx = startX + i * (iconSize + 2);
      ctx.fillStyle = buff.type === 'buff' ? 'rgba(76,175,80,0.7)' : 'rgba(233,69,96,0.7)';
      ctx.beginPath();
      ctx.arc(bx + iconSize / 2, y, iconSize / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(buff.type === 'buff' ? '↑' : '↓', bx + iconSize / 2, y);
    }
  },

  // ===== 特效绘制 =====

  _drawEffects: function (ctx) {
    for (var i = 0; i < this._effects.length; i++) {
      var eff = this._effects[i];
      eff.anim.draw(ctx, eff.x, eff.y, eff.w, eff.h);
    }
  },

  // ===== 飘字绘制 =====

  _drawFloatTexts: function (ctx) {
    for (var i = 0; i < this._floatTexts.length; i++) {
      var ft = this._floatTexts[i];
      var alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = ft.font || 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ft.text, ft.x, ft.y);

      // 描边
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
  },

  // ===== 动画触发 API（由 EventBus 调用）=====

  /**
   * 播放攻击动画
   * @param {string} attackerUid
   * @param {string} targetUid
   * @param {number} damage
   * @param {boolean} isCrit
   */
  playAttack: function (attackerUid, targetUid, damage, isCrit) {
    var attacker = this._unitPositions[attackerUid];
    var target = this._unitPositions[targetUid];
    if (!attacker || !target) return;

    // 切换攻击者到攻击动画
    var charType = attacker.isAlly ? 'soldier' : 'orc';
    var charDefs = SpriteAtlas.characters[charType];
    var sprite = this._sprites[attackerUid];
    if (sprite) {
      sprite.def = charDefs.attack;
      sprite.loop = false;
      sprite.reset();
      sprite.onFinish = function () {
        sprite.def = charDefs.idle;
        sprite.loop = true;
        sprite.reset();
        sprite.onFinish = null;
      };
    }

    // 目标受击动画
    var tCharType = target.isAlly ? 'soldier' : 'orc';
    var tCharDefs = SpriteAtlas.characters[tCharType];
    var tSprite = this._sprites[targetUid];
    if (tSprite && target.unit.currentHp > 0) {
      setTimeout(function () {
        tSprite.def = tCharDefs.hurt;
        tSprite.loop = false;
        tSprite.reset();
        tSprite.onFinish = function () {
          if (target.unit.currentHp > 0) {
            tSprite.def = tCharDefs.idle;
            tSprite.loop = true;
            tSprite.reset();
          }
          tSprite.onFinish = null;
        };
      }, 200);
    }

    // 命中特效
    var impactDef = SpriteAtlas.effects.impact;
    if (impactDef) {
      var effSize = 48;
      setTimeout(function () {
        var eff = new SpriteAnimation(impactDef);
        BattleAnimations._effects.push({
          anim: eff,
          x: target.x - effSize / 2,
          y: target.y - effSize / 2,
          w: effSize,
          h: effSize
        });
      }, 250);
    }

    // 伤害飘字
    var dmgColor = isCrit ? this.COLORS.crit : this.COLORS.damage;
    var dmgText = isCrit ? '暴击 ' + damage : '-' + damage;
    var dmgFont = isCrit ? 'bold 14px sans-serif' : 'bold 11px sans-serif';
    setTimeout(function () {
      BattleAnimations._floatTexts.push({
        text: dmgText,
        x: target.x + (Math.random() - 0.5) * 20,
        y: target.y - 10,
        color: dmgColor,
        font: dmgFont,
        life: 1.2,
        maxLife: 1.2
      });
    }, 300);
  },

  /**
   * 播放技能动画
   * @param {string} casterUid
   * @param {string} targetUid
   * @param {Object} skill
   * @param {number} value - 伤害或治疗值
   */
  playSkill: function (casterUid, targetUid, skill, value) {
    var caster = this._unitPositions[casterUid];
    var target = this._unitPositions[targetUid];
    if (!caster || !target) return;

    // 施法者攻击动画
    var charType = caster.isAlly ? 'soldier' : 'orc';
    var charDefs = SpriteAtlas.characters[charType];
    var sprite = this._sprites[casterUid];
    if (sprite) {
      sprite.def = charDefs.attack;
      sprite.loop = false;
      sprite.reset();
      sprite.onFinish = function () {
        sprite.def = charDefs.idle;
        sprite.loop = true;
        sprite.reset();
        sprite.onFinish = null;
      };
    }

    // 技能特效
    var effectKey = this._mapSkillToEffect(skill);
    var effectDef = SpriteAtlas.effects[effectKey];
    if (effectDef) {
      var effSize = 64;
      setTimeout(function () {
        var eff = new SpriteAnimation(effectDef);
        BattleAnimations._effects.push({
          anim: eff,
          x: target.x - effSize / 2,
          y: target.y - effSize / 2,
          w: effSize,
          h: effSize
        });
      }, 200);
    }

    // 飘字
    var isHeal = skill && skill.type === 'heal';
    var isBuff = skill && (skill.type === 'buff' || skill.type === 'debuff');
    var textColor, text;

    if (isHeal) {
      textColor = this.COLORS.heal;
      text = '+' + value;
    } else if (isBuff) {
      textColor = this.COLORS.buff;
      text = skill.name || (skill.type === 'buff' ? '增益' : '减益');
    } else {
      textColor = this.COLORS.skill;
      text = '-' + value;
    }

    setTimeout(function () {
      BattleAnimations._floatTexts.push({
        text: text,
        x: target.x + (Math.random() - 0.5) * 16,
        y: target.y - 12,
        color: textColor,
        font: 'bold 12px sans-serif',
        life: 1.5,
        maxLife: 1.5
      });
    }, 350);

    // 目标受击（伤害类技能）
    if (!isHeal && !isBuff) {
      var tCharType2 = target.isAlly ? 'soldier' : 'orc';
      var tCharDefs2 = SpriteAtlas.characters[tCharType2];
      var tSprite2 = this._sprites[targetUid];
      if (tSprite2 && target.unit.currentHp > 0) {
        setTimeout(function () {
          tSprite2.def = tCharDefs2.hurt;
          tSprite2.loop = false;
          tSprite2.reset();
          tSprite2.onFinish = function () {
            if (target.unit.currentHp > 0) {
              tSprite2.def = tCharDefs2.idle;
              tSprite2.loop = true;
              tSprite2.reset();
            }
            tSprite2.onFinish = null;
          };
        }, 250);
      }
    }
  },

  /**
   * 播放死亡动画
   * @param {string} uid
   */
  playDeath: function (uid) {
    var pos = this._unitPositions[uid];
    if (!pos) return;

    var charType = pos.isAlly ? 'soldier' : 'orc';
    var charDefs = SpriteAtlas.characters[charType];
    var sprite = this._sprites[uid];
    if (sprite) {
      sprite.def = charDefs.death;
      sprite.loop = false;
      sprite.reset();
    }

    // 死亡特效
    var deathDef = SpriteAtlas.effects.death_fx;
    if (deathDef) {
      var effSize = 48;
      var eff = new SpriteAnimation(deathDef);
      this._effects.push({
        anim: eff,
        x: pos.x - effSize / 2,
        y: pos.y - effSize / 2,
        w: effSize,
        h: effSize
      });
    }

    // 击败飘字
    this._floatTexts.push({
      text: '击败',
      x: pos.x,
      y: pos.y - 15,
      color: '#999',
      font: 'bold 11px sans-serif',
      life: 1.5,
      maxLife: 1.5
    });
  },

  // ===== 辅助方法 =====

  _mapSkillToEffect: function (skill) {
    if (!skill) return 'impact';
    var type = skill.type || '';
    if (type === 'heal') return 'heal';
    if (type === 'buff') return 'attack_up';
    if (type === 'debuff') return 'poison';

    // 按技能名猜测特效
    var name = (skill.name || '').toLowerCase();
    if (name.indexOf('火') !== -1 || name.indexOf('焰') !== -1) return 'absorb';
    if (name.indexOf('雷') !== -1 || name.indexOf('电') !== -1) return 'haste';
    if (name.indexOf('毒') !== -1) return 'poison';
    if (name.indexOf('治') !== -1 || name.indexOf('愈') !== -1) return 'heal';
    if (name.indexOf('防') !== -1) return 'defense_up';
    if (name.indexOf('攻') !== -1) return 'attack_up';

    return 'impact';
  },

  // 清理（面板切换时调用）
  destroy: function () {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._canvas = null;
    this._ctx = null;
    this._sprites = {};
    this._effects = [];
    this._floatTexts = [];
    this._battleState = null;
  }
};
