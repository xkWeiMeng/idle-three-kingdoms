/**
 * sprite-aligner-core.js — 精灵表对齐核心逻辑。
 *
 * 功能：
 *   1. 将精灵表按网格切割为 frame 列表。
 *   2. 对每个 frame 识别真实轮廓（非透明/非背景色 bounding box）。
 *   3. 按统一锚点（默认"脚底中心"）重新摆放到标准化 frame 中。
 *
 * 支持的锚点模式（anchorMode）：
 *   - "bottom-center"（默认）：脚底中心对齐，适合角色行走/站立。
 *   - "center"：居中对齐，适合特效/UI 图标。
 *   - "top-center"：顶部中心对齐。
 *
 * 背景色检测：
 *   - 默认按 alpha < threshold 判定为背景（适用于透明底精灵表）。
 *   - 可通过 bgColor 指定背景色（如品红 #FF00FF），会同时将该颜色转为透明。
 */

'use strict';

const { readPNG, writePNG, createBuffer, blitRect } = require('./png-codec');

// ── 工具函数 ──

/**
 * 解析 "#RRGGBB" 或 "RRGGBB" 为 [r, g, b]。
 */
function parseHexColor(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length !== 6) throw new Error(`Invalid hex color: ${hex}`);
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

/**
 * 判断像素是否为"背景"（即应忽略的像素）。
 *
 * @param {Uint8Array} data   RGBA 像素数据
 * @param {number} idx         像素在 data 中的起始偏移（idx = (y*w+x)*4）
 * @param {object} opts
 * @param {number} opts.alphaThreshold  alpha 低于此值视为透明背景（默认 10）
 * @param {number[]|null} opts.bgColor  指定背景色 [r,g,b]，颜色容差内的也算背景
 * @param {number} opts.colorTolerance  背景色容差（默认 30）
 */
function isBackground(data, idx, opts) {
  const alpha = data[idx + 3];
  if (alpha < opts.alphaThreshold) return true;

  if (opts.bgColor) {
    const dr = Math.abs(data[idx] - opts.bgColor[0]);
    const dg = Math.abs(data[idx + 1] - opts.bgColor[1]);
    const db = Math.abs(data[idx + 2] - opts.bgColor[2]);
    if (dr + dg + db <= opts.colorTolerance) return true;
  }

  return false;
}

// ── 核心：识别轮廓 ──

/**
 * 对单个 frame 的像素数据，返回非背景像素的 bounding box。
 * 返回 { x, y, w, h } 或 null（全背景）。
 */
function findBoundingBox(data, frameW, frameH, bgOpts) {
  let minX = frameW, minY = frameH, maxX = -1, maxY = -1;

  for (let y = 0; y < frameH; y++) {
    for (let x = 0; x < frameW; x++) {
      const idx = (y * frameW + x) * 4;
      if (!isBackground(data, idx, bgOpts)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return null; // 完全空白帧
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * 从整张精灵表中提取一个 frame 的像素数据（独立的 RGBA 缓冲区）。
 */
function extractFrame(sheetData, sheetW, fx, fy, fw, fh) {
  const buf = new Uint8Array(fw * fh * 4);
  for (let row = 0; row < fh; row++) {
    const srcOff = ((fy + row) * sheetW + fx) * 4;
    const dstOff = row * fw * 4;
    buf.set(sheetData.subarray(srcOff, srcOff + fw * 4), dstOff);
  }
  return buf;
}

// ── 主对齐流程 ──

/**
 * @typedef {Object} AlignOptions
 * @property {number} cols           网格列数
 * @property {number} rows           网格行数
 * @property {number} [frameWidth]   单帧宽度（默认自动 = sheetWidth / cols）
 * @property {number} [frameHeight]  单帧高度（默认自动 = sheetHeight / rows）
 * @property {string} [anchorMode]   "bottom-center" | "center" | "top-center"
 * @property {string} [bgColor]      背景色 hex，如 "#FF00FF"
 * @property {number} [alphaThreshold] 透明度阈值（0-255），默认 10
 * @property {number} [colorTolerance] 背景色容差，默认 30
 * @property {number} [padding]      对齐后精灵边缘到 frame 边界的最小留白，默认 0
 * @property {boolean} [stripBgColor] 是否将匹配 bgColor 的像素替换为全透明，默认 true
 * @property {boolean} [uniformSize]  是否统一所有 frame 到能容纳最大精灵的尺寸，默认 false
 * @property {boolean} [dryRun]       仅输出分析结果不写文件，默认 false
 */

/**
 * @typedef {Object} FrameInfo
 * @property {number} col
 * @property {number} row
 * @property {Object|null} bbox  { x, y, w, h } 相对于原 frame
 * @property {Object} anchor     计算出的锚点位置（原 frame 坐标）
 */

/**
 * 对齐精灵表。
 *
 * @param {string} inputPath   输入 PNG 路径
 * @param {string} outputPath  输出 PNG 路径
 * @param {AlignOptions} opts  选项
 * @returns {{ frames: FrameInfo[], outputWidth: number, outputHeight: number, maxBBox: {w:number,h:number} }}
 */
function alignSpriteSheet(inputPath, outputPath, opts) {
  const { cols, rows } = opts;
  const anchorMode = opts.anchorMode || 'bottom-center';
  const alphaThreshold = opts.alphaThreshold ?? 10;
  const colorTolerance = opts.colorTolerance ?? 30;
  const padding = opts.padding ?? 0;
  const stripBgColor = opts.stripBgColor !== false;
  const uniformSize = opts.uniformSize || false;
  const dryRun = opts.dryRun || false;
  const bgColor = opts.bgColor ? parseHexColor(opts.bgColor) : null;

  const bgOpts = { alphaThreshold, bgColor, colorTolerance };

  // 1. 读取
  const img = readPNG(inputPath);
  const frameW = opts.frameWidth || Math.floor(img.width / cols);
  const frameH = opts.frameHeight || Math.floor(img.height / rows);

  // 2. 如需，先将背景色转为全透明（在原数据上原地修改）
  if (bgColor && stripBgColor) {
    for (let i = 0; i < img.data.length; i += 4) {
      const dr = Math.abs(img.data[i] - bgColor[0]);
      const dg = Math.abs(img.data[i + 1] - bgColor[1]);
      const db = Math.abs(img.data[i + 2] - bgColor[2]);
      if (dr + dg + db <= colorTolerance) {
        img.data[i + 3] = 0; // 设为全透明
      }
    }
  }

  // 3. 对每个 frame 识别 bounding box
  const frames = [];
  let maxBW = 0, maxBH = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fx = c * frameW;
      const fy = r * frameH;
      const frameBuf = extractFrame(img.data, img.width, fx, fy, frameW, frameH);
      const bbox = findBoundingBox(frameBuf, frameW, frameH, bgOpts);

      if (bbox) {
        if (bbox.w > maxBW) maxBW = bbox.w;
        if (bbox.h > maxBH) maxBH = bbox.h;
      }

      frames.push({ col: c, row: r, bbox, frameBuf });
    }
  }

  // 4. 确定输出 frame 尺寸
  let outFrameW, outFrameH;
  if (uniformSize) {
    outFrameW = maxBW + padding * 2;
    outFrameH = maxBH + padding * 2;
  } else {
    outFrameW = frameW;
    outFrameH = frameH;
  }

  // 5. 计算每帧锚点并重绘
  const outW = outFrameW * cols;
  const outH = outFrameH * rows;
  const outData = createBuffer(outW, outH);

  const frameInfos = [];

  for (const f of frames) {
    const { col, row, bbox, frameBuf } = f;

    if (!bbox) {
      frameInfos.push({ col, row, bbox: null, anchor: null });
      continue;
    }

    // 计算原 frame 中精灵的锚点（相对于 bbox）
    let anchorX, anchorY;
    switch (anchorMode) {
      case 'center':
        anchorX = bbox.x + bbox.w / 2;
        anchorY = bbox.y + bbox.h / 2;
        break;
      case 'top-center':
        anchorX = bbox.x + bbox.w / 2;
        anchorY = bbox.y;
        break;
      case 'bottom-center':
      default:
        anchorX = bbox.x + bbox.w / 2;
        anchorY = bbox.y + bbox.h; // 脚底
        break;
    }

    // 输出帧中锚点的目标位置
    let targetAnchorX, targetAnchorY;
    switch (anchorMode) {
      case 'center':
        targetAnchorX = outFrameW / 2;
        targetAnchorY = outFrameH / 2;
        break;
      case 'top-center':
        targetAnchorX = outFrameW / 2;
        targetAnchorY = padding;
        break;
      case 'bottom-center':
      default:
        targetAnchorX = outFrameW / 2;
        targetAnchorY = outFrameH - padding;
        break;
    }

    // 精灵左上角在输出帧中的放置位置
    const placeX = Math.round(targetAnchorX - (anchorX - bbox.x));
    const placeY = Math.round(targetAnchorY - (anchorY - bbox.y));

    // blit 到输出
    if (!dryRun) {
      const destFX = col * outFrameW;
      const destFY = row * outFrameH;

      blitRect(
        outData, outW, outH,
        frameBuf, frameW, frameH,
        bbox.x, bbox.y, bbox.w, bbox.h,
        destFX + placeX, destFY + placeY
      );
    }

    frameInfos.push({
      col, row,
      bbox: { x: bbox.x, y: bbox.y, w: bbox.w, h: bbox.h },
      anchor: { x: Math.round(anchorX), y: Math.round(anchorY) },
    });
  }

  // 6. 写入
  if (!dryRun) {
    writePNG(outputPath, outW, outH, outData);
  }

  return {
    frames: frameInfos,
    inputFrameSize: { w: frameW, h: frameH },
    outputFrameSize: { w: outFrameW, h: outFrameH },
    outputSize: { w: outW, h: outH },
    maxBBox: { w: maxBW, h: maxBH },
  };
}

module.exports = {
  alignSpriteSheet,
  findBoundingBox,
  extractFrame,
  isBackground,
  parseHexColor,
};
