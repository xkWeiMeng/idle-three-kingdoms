#!/usr/bin/env node
/**
 * auto-align-sprite-sheet.js — 精灵表自动对齐 CLI。
 *
 * 用法：
 *   node tools/auto-align-sprite-sheet.js <input.png> [options]
 *
 * 选项：
 *   --cols <N>           网格列数（必填）
 *   --rows <N>           网格行数（必填）
 *   --output <path>      输出路径（默认 <input>_aligned.png）
 *   --anchor <mode>      锚点模式：bottom-center（默认）| center | top-center
 *   --bg-color <hex>     背景色（如 #FF00FF），将被替换为透明
 *   --alpha-threshold <N> 透明度阈值（0-255），默认 10
 *   --color-tolerance <N> 背景色容差，默认 30
 *   --padding <N>        对齐后帧边缘留白像素，默认 0
 *   --frame-width <N>    手动指定单帧宽度
 *   --frame-height <N>   手动指定单帧高度
 *   --uniform            统一输出帧尺寸为最大精灵尺寸
 *   --dry-run            仅输出分析结果，不写文件
 *   --json               以 JSON 格式输出分析结果
 *
 * 示例：
 *   # 4 方向行走，6 列 4 行，脚底对齐
 *   node tools/auto-align-sprite-sheet.js assets/characters/sheets/guanyu_walk_4dir_128.png --cols 6 --rows 4
 *
 *   # 去除品红背景 + 居中对齐
 *   node tools/auto-align-sprite-sheet.js raw/effects.png --cols 8 --rows 2 --anchor center --bg-color "#FF00FF"
 *
 *   # 仅分析，不输出文件
 *   node tools/auto-align-sprite-sheet.js sheet.png --cols 4 --rows 4 --dry-run --json
 */

'use strict';

const path = require('path');
const { alignSpriteSheet } = require('./sprite-aligner-core');

// ── 参数解析 ──

function parseArgs(argv) {
  const args = { _: [] };
  let i = 2; // skip node + script
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--cols') { args.cols = parseInt(argv[++i]); }
    else if (arg === '--rows') { args.rows = parseInt(argv[++i]); }
    else if (arg === '--output' || arg === '-o') { args.output = argv[++i]; }
    else if (arg === '--anchor') { args.anchor = argv[++i]; }
    else if (arg === '--bg-color') { args.bgColor = argv[++i]; }
    else if (arg === '--alpha-threshold') { args.alphaThreshold = parseInt(argv[++i]); }
    else if (arg === '--color-tolerance') { args.colorTolerance = parseInt(argv[++i]); }
    else if (arg === '--padding') { args.padding = parseInt(argv[++i]); }
    else if (arg === '--frame-width') { args.frameWidth = parseInt(argv[++i]); }
    else if (arg === '--frame-height') { args.frameHeight = parseInt(argv[++i]); }
    else if (arg === '--uniform') { args.uniform = true; }
    else if (arg === '--dry-run') { args.dryRun = true; }
    else if (arg === '--json') { args.json = true; }
    else if (arg === '--help' || arg === '-h') { args.help = true; }
    else if (!arg.startsWith('-')) { args._.push(arg); }
    else { console.error(`Unknown option: ${arg}`); process.exit(1); }
    i++;
  }
  return args;
}

function showHelp() {
  console.log(`
精灵表自动对齐工具 (auto-align-sprite-sheet)

用法:
  node tools/auto-align-sprite-sheet.js <input.png> --cols <N> --rows <N> [options]

必填参数:
  <input.png>         输入精灵表 PNG 文件
  --cols <N>          网格列数
  --rows <N>          网格行数

可选参数:
  --output <path>     输出文件路径（默认: <input>_aligned.png）
  --anchor <mode>     锚点模式（默认: bottom-center）
                        bottom-center  脚底中心（角色行走/站立）
                        center         居中（特效/图标）
                        top-center     顶部中心
  --bg-color <hex>    背景色（如 #FF00FF），匹配的像素将被替换为透明
  --alpha-threshold   透明度阈值 0-255（默认: 10）
  --color-tolerance   背景色容差（默认: 30）
  --padding <N>       帧边缘留白像素（默认: 0）
  --frame-width <N>   手动指定单帧宽度（默认: 图片宽度 ÷ cols）
  --frame-height <N>  手动指定单帧高度（默认: 图片高度 ÷ rows）
  --uniform           统一输出帧尺寸为能容纳最大精灵的最小尺寸
  --dry-run           仅分析不写文件
  --json              以 JSON 格式输出分析结果
  --help, -h          显示帮助

示例:
  # 角色行走表：6列4行，脚底对齐
  node tools/auto-align-sprite-sheet.js hero_walk.png --cols 6 --rows 4

  # 去除品红背景 + 居中对齐
  node tools/auto-align-sprite-sheet.js effects.png --cols 8 --rows 2 --anchor center --bg-color "#FF00FF"

  # 仅分析
  node tools/auto-align-sprite-sheet.js sheet.png --cols 4 --rows 4 --dry-run --json
`);
}

// ── 主流程 ──

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const inputPath = args._[0];
  if (!inputPath) {
    console.error('错误：请指定输入 PNG 文件');
    showHelp();
    process.exit(1);
  }

  if (!args.cols || !args.rows) {
    console.error('错误：--cols 和 --rows 为必填参数');
    process.exit(1);
  }

  // 默认输出路径
  const ext = path.extname(inputPath);
  const base = inputPath.slice(0, -ext.length);
  const outputPath = args.output || `${base}_aligned${ext}`;

  const opts = {
    cols: args.cols,
    rows: args.rows,
    anchorMode: args.anchor || 'bottom-center',
    bgColor: args.bgColor || null,
    alphaThreshold: args.alphaThreshold,
    colorTolerance: args.colorTolerance,
    padding: args.padding,
    frameWidth: args.frameWidth,
    frameHeight: args.frameHeight,
    uniformSize: args.uniform || false,
    dryRun: args.dryRun || false,
  };

  console.log(`输入: ${inputPath}`);
  console.log(`网格: ${opts.cols}×${opts.rows}`);
  console.log(`锚点: ${opts.anchorMode}`);
  if (opts.bgColor) console.log(`背景色: ${opts.bgColor}`);

  const result = alignSpriteSheet(inputPath, outputPath, opts);

  // 输出分析结果
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n─── 分析结果 ───`);
    console.log(`输入帧尺寸: ${result.inputFrameSize.w}×${result.inputFrameSize.h}`);
    console.log(`输出帧尺寸: ${result.outputFrameSize.w}×${result.outputFrameSize.h}`);
    console.log(`最大精灵: ${result.maxBBox.w}×${result.maxBBox.h}`);
    console.log(`输出尺寸: ${result.outputSize.w}×${result.outputSize.h}`);

    // 统计空帧
    const emptyFrames = result.frames.filter(f => !f.bbox);
    if (emptyFrames.length > 0) {
      console.log(`空白帧: ${emptyFrames.length} 个`);
    }

    // 输出各帧偏移量，帮助用户理解对齐效果
    const nonEmpty = result.frames.filter(f => f.bbox);
    if (nonEmpty.length > 0) {
      const offsets = nonEmpty.map(f => {
        const cx = f.bbox.x + f.bbox.w / 2;
        const cy = f.bbox.y + f.bbox.h;
        return { col: f.col, row: f.row, dx: Math.round(cx - result.inputFrameSize.w / 2), dy: Math.round(cy - result.inputFrameSize.h) };
      });
      const maxDX = Math.max(...offsets.map(o => Math.abs(o.dx)));
      const maxDY = Math.max(...offsets.map(o => Math.abs(o.dy)));
      console.log(`最大水平偏移: ±${maxDX}px, 最大垂直偏移: ±${maxDY}px`);

      if (maxDX === 0 && maxDY === 0) {
        console.log(`✅ 精灵表已对齐，无需调整。`);
      } else {
        console.log(`⚠️  检测到帧间偏移，已统一对齐到 ${opts.anchorMode} 锚点。`);
      }
    }

    if (!opts.dryRun) {
      console.log(`\n输出: ${outputPath}`);
    } else {
      console.log(`\n（dry-run 模式，未写入文件）`);
    }
  }
}

main();
