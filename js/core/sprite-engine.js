/**
 * 精灵引擎 — Canvas 精灵加载、动画、渲染
 */
var SpriteEngine = {
  _images: {},    // 缓存已加载图片 { path: Image }
  _loading: {},   // 加载中的 Promise { path: Promise }

  // ==================== 图片加载 ====================

  /** 加载单张图片，返回 Promise<Image> */
  loadImage: function (src) {
    var fullPath = SpriteAtlas.basePath + src;
    if (this._images[fullPath]) {
      return Promise.resolve(this._images[fullPath]);
    }
    if (this._loading[fullPath]) {
      return this._loading[fullPath];
    }
    var self = this;
    this._loading[fullPath] = new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        self._images[fullPath] = img;
        delete self._loading[fullPath];
        resolve(img);
      };
      img.onerror = function () {
        delete self._loading[fullPath];
        reject(new Error('Failed to load: ' + fullPath));
      };
      img.src = fullPath;
    });
    return this._loading[fullPath];
  },

  /** 预加载一组精灵定义 */
  preloadSet: function (defs) {
    var promises = [];
    for (var key in defs) {
      if (defs[key].src) {
        promises.push(this.loadImage(defs[key].src));
      }
    }
    return Promise.all(promises);
  },

  /** 预加载战斗所需的所有资源 */
  preloadBattle: function () {
    var self = this;
    return Promise.all([
      self.preloadSet(SpriteAtlas.characters.soldier),
      self.preloadSet(SpriteAtlas.characters.orc),
      self.preloadSet(SpriteAtlas.effects),
      self.loadImage(SpriteAtlas.icons.src)
    ]);
  },

  // ==================== 获取已缓存图片 ====================

  getImage: function (src) {
    var fullPath = SpriteAtlas.basePath + src;
    return this._images[fullPath] || null;
  },

  // ==================== 帧绘制 ====================

  /**
   * 绘制精灵帧
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} src - 精灵图路径（相对于 basePath）
   * @param {number} frameIndex - 帧索引
   * @param {number} fw - 帧宽
   * @param {number} fh - 帧高
   * @param {number} dx - 目标 X
   * @param {number} dy - 目标 Y
   * @param {number} [dw] - 目标宽度（缩放）
   * @param {number} [dh] - 目标高度（缩放）
   * @param {boolean} [flipX] - 水平翻转
   */
  drawFrame: function (ctx, src, frameIndex, fw, fh, dx, dy, dw, dh, flipX) {
    var img = this.getImage(src);
    if (!img) return;

    dw = dw || fw;
    dh = dh || fh;
    var sx = frameIndex * fw;
    var sy = 0;

    if (flipX) {
      ctx.save();
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, fw, fh, 0, 0, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(img, sx, sy, fw, fh, dx, dy, dw, dh);
    }
  },

  /**
   * 绘制图标（从图标精灵表）
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} category - 图标类别 (equipment/skills/resources/status)
   * @param {string} name - 图标名
   * @param {number} dx - 目标 X
   * @param {number} dy - 目标 Y
   * @param {number} [size] - 绘制尺寸（默认 32）
   */
  drawIcon: function (ctx, category, name, dx, dy, size) {
    var rect = SpriteAtlas.getIconRect(category, name);
    if (!rect) return false;
    var img = this.getImage(SpriteAtlas.icons.src);
    if (!img) return false;
    size = size || 32;
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, dx, dy, size, size);
    return true;
  },

  /**
   * 生成图标的 data URL（用于 CSS background-image 或 <img> src）
   */
  getIconDataURL: function (category, name, size) {
    var rect = SpriteAtlas.getIconRect(category, name);
    if (!rect) return '';
    var img = this.getImage(SpriteAtlas.icons.src);
    if (!img) return '';
    size = size || 32;
    var cvs = document.createElement('canvas');
    cvs.width = size;
    cvs.height = size;
    var ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, size, size);
    return cvs.toDataURL('image/png');
  }
};

// ==================== 动画精灵实例 ====================

/**
 * 创建一个动画精灵实例
 * @param {object} def - 精灵定义 { src, fw, fh, frames, fps, loop }
 */
function SpriteAnimation(def) {
  this.def = def;
  this.currentFrame = 0;
  this.elapsed = 0;
  this.playing = true;
  this.finished = false;
  this.loop = def.loop !== false; // 默认循环
  this.fps = def.fps || 10;
  this.onFinish = null;
}

SpriteAnimation.prototype = {
  /** 更新动画帧（dt 为秒） */
  update: function (dt) {
    if (!this.playing || this.finished) return;
    this.elapsed += dt;
    var frameDuration = 1 / this.fps;
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.currentFrame++;
      if (this.currentFrame >= this.def.frames) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.def.frames - 1;
          this.finished = true;
          this.playing = false;
          if (this.onFinish) this.onFinish();
          return;
        }
      }
    }
  },

  /** 在 Canvas 上绘制当前帧 */
  draw: function (ctx, x, y, w, h, flipX) {
    SpriteEngine.drawFrame(
      ctx, this.def.src,
      this.currentFrame, this.def.fw, this.def.fh,
      x, y, w || this.def.fw, h || this.def.fh, flipX
    );
  },

  /** 重置动画到第一帧 */
  reset: function () {
    this.currentFrame = 0;
    this.elapsed = 0;
    this.finished = false;
    this.playing = true;
  },

  /** 切换到新动画定义 */
  switchTo: function (def) {
    if (this.def.src === def.src) return; // 相同动画不重置
    this.def = def;
    this.loop = def.loop !== false;
    this.fps = def.fps || 10;
    this.reset();
  }
};
