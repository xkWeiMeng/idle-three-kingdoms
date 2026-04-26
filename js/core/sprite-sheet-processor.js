/**
 * 精灵图处理器 — 去除品红/绿屏背景，裁剪帧，提取头像
 */
var SpriteSheetProcessor = {
  _cache: {},  // src → processed OffscreenCanvas/Canvas

  /**
   * 将图片中的指定背景色替换为透明
   * @param {HTMLImageElement} img - 已加载的图片
   * @param {string} bgColor - 背景色 '#ff00ff' 或 '#00ff00'
   * @returns {HTMLCanvasElement} 处理后的 canvas（已缓存）
   */
  processImage: function (img, bgColor) {
    var key = img.src + '|' + bgColor;
    if (this._cache[key]) return this._cache[key];

    var w = img.naturalWidth;
    var h = img.naturalHeight;
    var cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    var ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0);

    var rgb = this._parseColor(bgColor);
    var data = ctx.getImageData(0, 0, w, h);
    var px = data.data;
    for (var i = 0; i < px.length; i += 4) {
      if (px[i] === rgb.r && px[i + 1] === rgb.g && px[i + 2] === rgb.b) {
        px[i + 3] = 0; // set alpha to 0
      }
    }
    ctx.putImageData(data, 0, 0);

    this._cache[key] = cvs;
    return cvs;
  },

  /**
   * 从处理后的精灵图中裁剪指定帧
   * @param {HTMLCanvasElement} sheet - processImage 返回的 canvas
   * @param {number} col - 列索引 (0-based)
   * @param {number} row - 行索引 (0-based)
   * @param {number} fw - 帧宽
   * @param {number} fh - 帧高
   * @returns {HTMLCanvasElement} 单帧 canvas
   */
  extractFrame: function (sheet, col, row, fw, fh) {
    var cvs = document.createElement('canvas');
    cvs.width = fw;
    cvs.height = fh;
    var ctx = cvs.getContext('2d');
    ctx.drawImage(sheet, col * fw, row * fh, fw, fh, 0, 0, fw, fh);
    return cvs;
  },

  /**
   * 从精灵图第一帧(0,0)裁剪头肩部分作为头像
   * @param {HTMLCanvasElement} sheet - processImage 返回的 canvas
   * @param {number} fw - 帧宽
   * @param {number} fh - 帧高
   * @param {object} [crop] - 裁剪区域 {x, y, w, h}，默认取顶部居中区域
   * @param {number} [outSize] - 输出尺寸（正方形），默认 64
   * @returns {HTMLCanvasElement} 头像 canvas
   */
  extractPortrait: function (sheet, fw, fh, crop, outSize) {
    outSize = outSize || 64;
    if (!crop) {
      // 默认裁剪：帧顶部居中 80×72 区域（头+肩）
      var cw = Math.round(fw * 0.625);  // 80/128
      var ch = Math.round(fh * 0.5625); // 72/128
      crop = {
        x: Math.round((fw - cw) / 2),
        y: Math.round(fh * 0.05),  // 从接近顶部开始
        w: cw,
        h: ch
      };
    }

    // 先从第一帧(row=0, col=0)裁剪头肩区域
    var cvs = document.createElement('canvas');
    cvs.width = outSize;
    cvs.height = outSize;
    var ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, crop.x, crop.y, crop.w, crop.h, 0, 0, outSize, outSize);
    return cvs;
  },

  /**
   * 计算每帧的水平偏移量，使同一行各帧的角色重心对齐
   * @param {HTMLCanvasElement} processedSheet - processImage 返回的已去背景 canvas
   * @param {number} fw - 帧宽
   * @param {number} fh - 帧高
   * @returns {number[][]} offsets[row][col] — 每帧需要的水平校正值(源像素)
   */
  computeFrameOffsets: function (processedSheet, fw, fh) {
    var cols = Math.floor(processedSheet.width / fw);
    var rows = Math.floor(processedSheet.height / fh);
    var ctx = processedSheet.getContext('2d');
    var offsets = [];

    for (var row = 0; row < rows; row++) {
      var centers = [];
      for (var col = 0; col < cols; col++) {
        var data = ctx.getImageData(col * fw, row * fh, fw, fh);
        var px = data.data;
        var minX = fw, maxX = 0;
        var found = false;
        for (var p = 0; p < px.length; p += 4) {
          if (px[p + 3] > 0) {
            var x = (p / 4) % fw;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            found = true;
          }
        }
        centers.push(found ? (minX + maxX) / 2 : fw / 2);
      }
      // 参考锚点取该行所有帧的平均中心
      var sum = 0;
      for (var i = 0; i < centers.length; i++) sum += centers[i];
      var avg = sum / centers.length;
      var rowOffsets = [];
      for (var c = 0; c < centers.length; c++) {
        rowOffsets.push(avg - centers[c]);
      }
      offsets.push(rowOffsets);
    }

    return offsets;
  },

  /**
   * 解析十六进制颜色
   * @param {string} hex - '#ff00ff' 格式
   * @returns {{r: number, g: number, b: number}}
   */
  _parseColor: function (hex) {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }
};
