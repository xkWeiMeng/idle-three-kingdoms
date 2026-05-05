/**
 * png-codec.js — 纯 Node PNG 读写，不依赖浏览器或 Canvas。
 *
 * 仅支持 8-bit RGBA / RGB / Grayscale+Alpha / Grayscale（最常见格式）。
 * 读取后统一输出为 RGBA Uint8Array，写入统一为 RGBA PNG。
 */

'use strict';

const fs = require('fs');
const zlib = require('zlib');

// ── PNG 签名 ──
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// ── CRC32 表（用于 chunk CRC 校验与写入） ──
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf, start, end) {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ── 读取 ──

function readUint32(buf, off) {
  return buf.readUInt32BE(off);
}

/**
 * 从 filter + scanline 的原始数据还原为 RGBA 像素。
 * @returns {Uint8Array} width*height*4
 */
function unfilter(raw, width, height, bpp) {
  const stride = width * bpp;
  const pixels = new Uint8Array(width * height * bpp);

  for (let y = 0; y < height; y++) {
    const filterType = raw[y * (stride + 1)];
    const rowOff = y * (stride + 1) + 1;
    const outOff = y * stride;

    for (let x = 0; x < stride; x++) {
      const rawByte = raw[rowOff + x];
      const a = x >= bpp ? pixels[outOff + x - bpp] : 0;               // left
      const b = y > 0 ? pixels[outOff + x - stride] : 0;               // up
      const c = x >= bpp && y > 0 ? pixels[outOff + x - stride - bpp] : 0; // up-left

      let val;
      switch (filterType) {
        case 0: val = rawByte; break;
        case 1: val = (rawByte + a) & 0xff; break;
        case 2: val = (rawByte + b) & 0xff; break;
        case 3: val = (rawByte + ((a + b) >>> 1)) & 0xff; break;
        case 4: val = (rawByte + paethPredictor(a, b, c)) & 0xff; break;
        default: throw new Error(`Unknown PNG filter type: ${filterType}`);
      }
      pixels[outOff + x] = val;
    }
  }
  return pixels;
}

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * 将任意支持的颜色格式转为 RGBA。
 */
function toRGBA(pixels, width, height, colorType) {
  if (colorType === 6) return pixels; // 已是 RGBA
  const out = new Uint8Array(width * height * 4);
  const count = width * height;

  if (colorType === 2) {
    // RGB → RGBA
    for (let i = 0; i < count; i++) {
      out[i * 4] = pixels[i * 3];
      out[i * 4 + 1] = pixels[i * 3 + 1];
      out[i * 4 + 2] = pixels[i * 3 + 2];
      out[i * 4 + 3] = 255;
    }
  } else if (colorType === 4) {
    // Grayscale+Alpha → RGBA
    for (let i = 0; i < count; i++) {
      const g = pixels[i * 2];
      out[i * 4] = g;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = g;
      out[i * 4 + 3] = pixels[i * 2 + 1];
    }
  } else if (colorType === 0) {
    // Grayscale → RGBA
    for (let i = 0; i < count; i++) {
      const g = pixels[i];
      out[i * 4] = g;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = g;
      out[i * 4 + 3] = 255;
    }
  } else {
    throw new Error(`Unsupported PNG colorType: ${colorType} (palette/indexed not supported)`);
  }
  return out;
}

/**
 * 读取 PNG 文件，返回 { width, height, data: Uint8Array(RGBA) }。
 */
function readPNG(filePath) {
  const buf = fs.readFileSync(filePath);

  // 验证签名
  if (buf.compare(PNG_SIGNATURE, 0, 8, 0, 8) !== 0) {
    throw new Error('Not a valid PNG file');
  }

  let width, height, bitDepth, colorType;
  const idatChunks = [];
  let offset = 8;

  while (offset < buf.length) {
    const length = readUint32(buf, offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);

    if (type === 'IHDR') {
      width = readUint32(buf, offset + 8);
      height = readUint32(buf, offset + 12);
      bitDepth = buf[offset + 16];
      colorType = buf[offset + 17];
      const compression = buf[offset + 18];
      const filter = buf[offset + 19];
      const interlace = buf[offset + 20];
      if (bitDepth !== 8) throw new Error(`Only 8-bit PNG supported, got ${bitDepth}-bit`);
      if (interlace !== 0) throw new Error('Interlaced PNG not supported');
    } else if (type === 'IDAT') {
      idatChunks.push(buf.slice(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }

    offset += 12 + length; // 4(length) + 4(type) + data + 4(crc)
  }

  if (!width) throw new Error('No IHDR chunk found');

  const compressed = Buffer.concat(idatChunks);
  const raw = zlib.inflateSync(compressed);

  const bppMap = { 0: 1, 2: 3, 4: 2, 6: 4 };
  const bpp = bppMap[colorType];
  if (bpp === undefined) throw new Error(`Unsupported colorType: ${colorType}`);

  const pixels = unfilter(raw, width, height, bpp);
  const rgba = toRGBA(pixels, width, height, colorType);

  return { width, height, data: rgba };
}

// ── 写入 ──

/**
 * 为 scanline 选择最优 filter（简化：始终用 Sub filter=1，压缩效果适中且快速）。
 */
function filterScanlines(data, width, height) {
  const stride = width * 4;
  const filtered = Buffer.alloc(height * (stride + 1));

  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    const outStart = y * (stride + 1);
    filtered[outStart] = 1; // Sub filter

    for (let x = 0; x < stride; x++) {
      const cur = data[rowStart + x];
      const left = x >= 4 ? data[rowStart + x - 4] : 0;
      filtered[outStart + 1 + x] = (cur - left) & 0xff;
    }
  }
  return filtered;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);

  const body = Buffer.concat([typeBytes, data]);
  const c = crc32(body, 0, body.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(c);

  return Buffer.concat([len, body, crcBuf]);
}

/**
 * 写入 RGBA 数据为 PNG 文件。
 * @param {string} filePath
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array|Buffer} data  RGBA 像素
 */
function writePNG(filePath, width, height, data) {
  if (data.length !== width * height * 4) {
    throw new Error(`Data length mismatch: expected ${width * height * 4}, got ${data.length}`);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const filtered = filterScanlines(data, width, height);
  const compressed = zlib.deflateSync(filtered, { level: 9 });

  const chunks = [
    PNG_SIGNATURE,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ];

  fs.writeFileSync(filePath, Buffer.concat(chunks));
}

/**
 * 创建空白 RGBA 缓冲区（全透明）。
 */
function createBuffer(width, height) {
  return new Uint8Array(width * height * 4);
}

/**
 * 在目标缓冲区上绘制源区域（alpha 直接覆盖，非混合）。
 */
function blitRect(dst, dstW, dstH, src, srcW, srcH, sx, sy, sw, sh, dx, dy) {
  for (let row = 0; row < sh; row++) {
    const srcY = sy + row;
    const dstY = dy + row;
    if (srcY < 0 || srcY >= srcH || dstY < 0 || dstY >= dstH) continue;
    for (let col = 0; col < sw; col++) {
      const srcX = sx + col;
      const dstX = dx + col;
      if (srcX < 0 || srcX >= srcW || dstX < 0 || dstX >= dstW) continue;
      const si = (srcY * srcW + srcX) * 4;
      const di = (dstY * dstW + dstX) * 4;
      dst[di] = src[si];
      dst[di + 1] = src[si + 1];
      dst[di + 2] = src[si + 2];
      dst[di + 3] = src[si + 3];
    }
  }
}

module.exports = { readPNG, writePNG, createBuffer, blitRect };
