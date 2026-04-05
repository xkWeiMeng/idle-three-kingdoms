/**
 * SVG Building & Terrain Asset Generator — 三国古风版
 * 生成三国题材的建筑和地形 SVG 占位图
 *
 * 设计规则：
 * 1. 建筑 viewBox 按占格比例设置（48px × 格子数），避免拉伸变形
 * 2. 建筑底部贴地（紧贴 viewBox 下边缘），内置阴影椭圆
 * 3. 三国配色：赭红屋顶、灰白墙壁、深褐木柱、金色装饰
 * 4. 地形用中原古风黄绿土色，装饰含竹林、旌旗、灯笼等
 */
const fs = require('fs');
const path = require('path');
const projectRoot = path.join(__dirname, '..');
const buildingDir = path.join(projectRoot, 'assets', 'img', 'buildings');
const terrainDir = path.join(projectRoot, 'assets', 'img', 'terrain');

if (!fs.existsSync(buildingDir)) fs.mkdirSync(buildingDir, { recursive: true });
if (!fs.existsSync(terrainDir)) fs.mkdirSync(terrainDir, { recursive: true });

// ============================================================
// 色板 — 三国古风
// ============================================================
const C = {
  // 屋顶
  roofDark:  '#7B2D26',
  roofMain:  '#A0422D',
  roofLight: '#C25A3C',
  roofGold:  '#D4A849',
  // 墙壁
  wallDark:  '#9E9586',
  wallMain:  '#C4B8A4',
  wallLight: '#D7CCC8',
  // 木柱 / 木料
  woodDark:  '#4A3728',
  woodMain:  '#6B4F3A',
  woodLight: '#8B7355',
  // 地基/台阶
  baseDark:  '#5D4E3C',
  baseMain:  '#7A6B55',
  baseLight: '#9E8E75',
  // 金色装饰
  gold:      '#D4A849',
  goldLight: '#F5D680',
  // 门窗
  doorDark:  '#3E2C1E',
  doorMain:  '#5D4037',
  windowDark:'#2C3E50',
  windowGlow:'#F5D680',
  // 旗帜
  flagRed:   '#C62828',
  flagBlue:  '#1565C0',
  flagGreen: '#2E7D32',
  // 地面
  groundDark:  '#6B7340',
  groundMain:  '#7A8A4A',
  groundLight: '#8A9455',
  // 阴影
  shadow:    'rgba(0,0,0,0.18)',
};

// ============================================================
// 辅助函数
// ============================================================

/** 三国风中式屋顶（飞檐翘角） */
function chineseRoof(cx, y, w, h, color, darkColor, goldColor) {
  var left = cx - w/2;
  var right = cx + w/2;
  var eaveOut = w * 0.12;
  var eaveUp = h * 0.3;
  return [
    '<path d="M' + (left - eaveOut) + ',' + (y + h) + ' Q' + cx + ',' + (y - h*0.1) + ' ' + (right + eaveOut) + ',' + (y + h) + '" fill="' + color + '"/>',
    '<path d="M' + (left - eaveOut*0.6) + ',' + (y + h*0.6) + ' Q' + cx + ',' + (y + h*0.2) + ' ' + (right + eaveOut*0.6) + ',' + (y + h*0.6) + ' L' + (right + eaveOut) + ',' + (y + h) + ' Q' + cx + ',' + (y + h*0.5) + ' ' + (left - eaveOut) + ',' + (y + h) + ' Z" fill="' + darkColor + '" opacity="0.4"/>',
    '<line x1="' + (cx - w*0.35) + '" y1="' + (y + 1) + '" x2="' + (cx + w*0.35) + '" y2="' + (y + 1) + '" stroke="' + goldColor + '" stroke-width="1.5"/>',
    '<circle cx="' + (left - eaveOut) + '" cy="' + (y + h - eaveUp*0.3) + '" r="1.5" fill="' + goldColor + '"/>',
    '<circle cx="' + (right + eaveOut) + '" cy="' + (y + h - eaveUp*0.3) + '" r="1.5" fill="' + goldColor + '"/>',
  ].join('\n');
}

/** 内置阴影椭圆 */
function groundShadow(cx, bottom, rx, ry) {
  return '<ellipse cx="' + cx + '" cy="' + bottom + '" rx="' + rx + '" ry="' + (ry || 5) + '" fill="' + C.shadow + '"/>';
}

/** 中式大门 */
function chineseDoor(x, y, w, h) {
  return [
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1" fill="' + C.doorDark + '"/>',
    '<rect x="' + (x+1) + '" y="' + (y+1) + '" width="' + (w/2-1.5) + '" height="' + (h-2) + '" fill="' + C.doorMain + '"/>',
    '<rect x="' + (x+w/2+0.5) + '" y="' + (y+1) + '" width="' + (w/2-1.5) + '" height="' + (h-2) + '" fill="' + C.doorMain + '"/>',
    '<circle cx="' + (x+w/2) + '" cy="' + (y+h*0.55) + '" r="1.2" fill="' + C.gold + '"/>',
  ].join('\n');
}

/** 中式窗户 */
function chineseWindow(x, y, w, h) {
  return [
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1" fill="' + C.windowDark + '"/>',
    '<line x1="' + (x+w/2) + '" y1="' + y + '" x2="' + (x+w/2) + '" y2="' + (y+h) + '" stroke="' + C.woodMain + '" stroke-width="0.8"/>',
    '<line x1="' + x + '" y1="' + (y+h/2) + '" x2="' + (x+w) + '" y2="' + (y+h/2) + '" stroke="' + C.woodMain + '" stroke-width="0.8"/>',
    '<rect x="' + (x+1) + '" y="' + (y+1) + '" width="' + (w/2-1.5) + '" height="' + (h/2-1) + '" fill="' + C.windowGlow + '" opacity="0.3"/>',
  ].join('\n');
}

/** 旌旗 */
function flag(x, y, h, color, text) {
  return [
    '<rect x="' + x + '" y="' + y + '" width="2" height="' + h + '" fill="' + C.woodMain + '"/>',
    '<rect x="' + (x+2) + '" y="' + (y+2) + '" width="10" height="14" fill="' + color + '"/>',
    '<path d="M' + (x+12) + ',' + (y+2) + ' L' + (x+14) + ',' + (y+5) + ' L' + (x+12) + ',' + (y+8) + '" fill="' + color + '" opacity="0.7"/>',
    text ? '<text x="' + (x+7) + '" y="' + (y+13) + '" text-anchor="middle" font-size="7" fill="#FFF" font-weight="bold" font-family="sans-serif">' + text + '</text>' : '',
  ].join('\n');
}

/** 灯笼 */
function lantern(cx, y, r) {
  r = r || 4;
  return [
    '<rect x="' + (cx-0.5) + '" y="' + (y-r-3) + '" width="1" height="3" fill="' + C.gold + '"/>',
    '<ellipse cx="' + cx + '" cy="' + y + '" rx="' + r + '" ry="' + (r*1.3) + '" fill="#E53935"/>',
    '<ellipse cx="' + cx + '" cy="' + y + '" rx="' + (r*0.7) + '" ry="' + r + '" fill="#FF5252" opacity="0.6"/>',
    '<rect x="' + (cx-r*0.5) + '" y="' + (y-r*1.3) + '" width="' + r + '" height="1.5" fill="' + C.gold + '"/>',
    '<rect x="' + (cx-r*0.4) + '" y="' + (y+r*1.1) + '" width="' + (r*0.8) + '" height="1.5" fill="' + C.gold + '"/>',
    '<line x1="' + cx + '" y1="' + (y+r*1.3+1.5) + '" x2="' + cx + '" y2="' + (y+r*1.3+4) + '" stroke="#C62828" stroke-width="0.5"/>',
  ].join('\n');
}

/** 石阶台基 */
function stoneBase(x, y, w, h) {
  return [
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + C.baseMain + '"/>',
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (h*0.3) + '" fill="' + C.baseLight + '"/>',
    '<line x1="' + x + '" y1="' + (y+h*0.5) + '" x2="' + (x+w) + '" y2="' + (y+h*0.5) + '" stroke="' + C.baseDark + '" stroke-width="0.5" opacity="0.5"/>',
  ].join('\n');
}


// ============================================================
// 建筑 SVG — 按占格比例 viewBox
// 2×2=96×96, 3×2=144×96, 3×3=144×144, 5×2=240×96
// ============================================================

var buildings = {};

// ─── 城主府 (3×3) ───────────────────────────
buildings.town_hall = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">',
groundShadow(72, 142, 62, 7),
'<!-- 台基 -->',
stoneBase(12, 110, 120, 32),
'<!-- 主体墙 -->',
'<rect x="20" y="56" width="104" height="56" fill="' + C.wallMain + '"/>',
'<rect x="24" y="60" width="96" height="50" fill="' + C.wallLight + '"/>',
'<!-- 木柱 -->',
'<rect x="20" y="56" width="5" height="56" fill="' + C.woodDark + '"/>',
'<rect x="119" y="56" width="5" height="56" fill="' + C.woodDark + '"/>',
'<rect x="46" y="56" width="4" height="56" fill="' + C.woodMain + '"/>',
'<rect x="94" y="56" width="4" height="56" fill="' + C.woodMain + '"/>',
'<!-- 二层 -->',
'<rect x="32" y="36" width="80" height="24" fill="' + C.wallMain + '"/>',
'<rect x="36" y="38" width="72" height="18" fill="' + C.wallLight + '"/>',
'<!-- 上层屋顶 -->',
chineseRoof(72, 14, 100, 24, C.roofMain, C.roofDark, C.gold),
'<!-- 下层屋檐 -->',
chineseRoof(72, 42, 128, 16, C.roofMain, C.roofDark, C.gold),
'<!-- 大门 -->',
chineseDoor(56, 82, 32, 28),
'<!-- 窗户 -->',
chineseWindow(30, 68, 14, 12),
chineseWindow(100, 68, 14, 12),
'<!-- 二层窗 -->',
chineseWindow(52, 40, 10, 10),
chineseWindow(82, 40, 10, 10),
'<!-- 匾额 -->',
'<rect x="50" y="70" width="44" height="10" rx="1" fill="' + C.gold + '"/>',
'<text x="72" y="78" text-anchor="middle" font-size="7" fill="' + C.roofDark + '" font-weight="bold" font-family="sans-serif">城主府</text>',
'<!-- 旌旗 -->',
flag(14, 20, 40, C.flagRed),
flag(124, 20, 40, C.flagRed),
'<!-- 灯笼 -->',
lantern(28, 76, 3),
lantern(116, 76, 3),
'<!-- 屋脊装饰 -->',
'<circle cx="72" cy="12" r="3" fill="' + C.gold + '"/>',
'</svg>'
].join('\n');

// ─── 伐木场 (2×2) ───────────────────────────
buildings.lumber_camp = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
'<!-- 木材堆 -->',
'<rect x="6" y="68" width="16" height="8" rx="3" fill="#8B6914" transform="rotate(-3,14,72)"/>',
'<rect x="4" y="74" width="18" height="8" rx="3" fill="#A38040"/>',
'<rect x="5" y="80" width="20" height="8" rx="3" fill="#6B4F12"/>',
'<!-- 棚屋 -->',
stoneBase(28, 78, 60, 16),
'<rect x="30" y="48" width="56" height="32" fill="' + C.wallMain + '"/>',
'<rect x="34" y="52" width="48" height="26" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(58, 32, 72, 18, C.roofMain, C.roofDark, C.gold),
'<!-- 门 -->',
chineseDoor(46, 60, 20, 18),
'<!-- 斧子 -->',
'<line x1="80" y1="40" x2="88" y2="60" stroke="' + C.woodMain + '" stroke-width="2.5"/>',
'<path d="M84,38 L92,42 L88,48 Z" fill="#9E9E9E"/>',
'<!-- 木桩 -->',
'<ellipse cx="86" cy="78" rx="7" ry="4" fill="#6B4F12"/>',
'<ellipse cx="86" cy="76" rx="7" ry="3.5" fill="#8B6914"/>',
'</svg>'
].join('\n');

// ─── 采石场 (2×2) ───────────────────────────
buildings.quarry = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 42, 5),
'<!-- 石堆 -->',
'<ellipse cx="48" cy="80" rx="42" ry="14" fill="#616161"/>',
'<ellipse cx="48" cy="76" rx="38" ry="12" fill="#757575"/>',
'<!-- 小棚 -->',
'<rect x="8" y="50" width="28" height="22" fill="' + C.wallMain + '"/>',
'<rect x="10" y="52" width="24" height="18" fill="' + C.wallLight + '"/>',
chineseRoof(22, 38, 38, 14, C.roofMain, C.roofDark, C.gold),
chineseDoor(16, 58, 12, 14),
'<!-- 吊臂 -->',
'<rect x="60" y="20" width="3" height="56" fill="' + C.woodMain + '"/>',
'<line x1="61" y1="20" x2="82" y2="20" stroke="' + C.woodMain + '" stroke-width="2.5"/>',
'<line x1="82" y1="20" x2="82" y2="42" stroke="#666" stroke-width="1.2"/>',
'<rect x="76" y="42" width="12" height="10" fill="#9E9E9E"/>',
'<!-- 碎石 -->',
'<circle cx="52" cy="70" r="4" fill="#BDBDBD"/>',
'<circle cx="64" cy="66" r="3" fill="#9E9E9E"/>',
'<circle cx="40" cy="72" r="3" fill="#B0BEC5"/>',
'</svg>'
].join('\n');

// ─── 铁矿 (2×2) ─────────────────────────────
buildings.iron_mine = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
'<!-- 矿山 -->',
'<polygon points="14,80 48,18 82,80" fill="#616161"/>',
'<polygon points="20,80 48,26 76,80" fill="#757575"/>',
'<!-- 矿洞 -->',
'<path d="M34,80 Q34,56 48,54 Q62,56 62,80 Z" fill="#263238"/>',
'<path d="M38,80 Q38,60 48,58 Q58,60 58,80 Z" fill="#1a1a2e"/>',
'<!-- 矿车 -->',
'<rect x="40" y="82" width="16" height="8" rx="2" fill="#78909C"/>',
'<rect x="42" y="78" width="12" height="5" fill="#607D8B"/>',
'<!-- 矿灯 -->',
'<circle cx="48" cy="60" r="3" fill="#FFF176" opacity="0.5"/>',
'<!-- 支撑木 -->',
'<rect x="34" y="54" width="3" height="26" fill="' + C.woodDark + '"/>',
'<rect x="59" y="54" width="3" height="26" fill="' + C.woodDark + '"/>',
'<rect x="34" y="54" width="28" height="3" fill="' + C.woodMain + '"/>',
'<!-- 矿石 -->',
'<circle cx="24" cy="74" r="3" fill="#455A64"/>',
'<circle cx="70" cy="70" r="2.5" fill="#546E7A"/>',
'</svg>'
].join('\n');

// ─── 农田 (2×2) ──────────────────────────────
buildings.farmland = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 4),
'<!-- 泥围 -->',
'<rect x="6" y="16" width="84" height="72" rx="3" fill="#5D4037"/>',
'<rect x="9" y="19" width="78" height="66" rx="2" fill="#6D4C41"/>',
'<!-- 垄沟 -->',
'<rect x="12" y="22" width="72" height="8" fill="#33691E"/>',
'<rect x="12" y="33" width="72" height="8" fill="#388E3C"/>',
'<rect x="12" y="44" width="72" height="8" fill="#33691E"/>',
'<rect x="12" y="55" width="72" height="8" fill="#388E3C"/>',
'<rect x="12" y="66" width="72" height="8" fill="#33691E"/>',
'<!-- 稻苗 -->',
'<g fill="#4CAF50">',
'<circle cx="20" cy="26" r="2.5"/><circle cx="44" cy="26" r="2.5"/><circle cx="68" cy="26" r="2.5"/>',
'<circle cx="32" cy="37" r="2.5"/><circle cx="56" cy="37" r="2.5"/><circle cx="76" cy="37" r="2.5"/>',
'<circle cx="20" cy="48" r="2.5"/><circle cx="44" cy="48" r="2.5"/><circle cx="68" cy="48" r="2.5"/>',
'<circle cx="32" cy="59" r="2.5"/><circle cx="56" cy="59" r="2.5"/><circle cx="76" cy="59" r="2.5"/>',
'<circle cx="20" cy="70" r="2.5"/><circle cx="44" cy="70" r="2.5"/><circle cx="68" cy="70" r="2.5"/>',
'</g>',
'<!-- 水渠 -->',
'<rect x="6" y="86" width="84" height="5" rx="2" fill="#1565C0" opacity="0.5"/>',
'<!-- 稻草人 -->',
'<line x1="80" y1="10" x2="80" y2="28" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<line x1="72" y1="16" x2="88" y2="16" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<circle cx="80" cy="8" r="3.5" fill="#FFCC80"/>',
'</svg>'
].join('\n');

// ─── 兵营 (2×2) ──────────────────────────────
buildings.barracks = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(6, 76, 84, 18),
'<!-- 主体 -->',
'<rect x="10" y="38" width="76" height="40" fill="' + C.wallMain + '"/>',
'<rect x="14" y="42" width="68" height="34" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(48, 20, 90, 20, C.roofMain, C.roofDark, C.gold),
'<!-- 旗杆+军旗 -->',
'<rect x="44" y="4" width="2.5" height="18" fill="' + C.woodMain + '"/>',
'<rect x="46.5" y="4" width="14" height="10" fill="' + C.flagRed + '"/>',
'<text x="53.5" y="12" text-anchor="middle" font-size="7" fill="#FFF" font-weight="bold" font-family="sans-serif">兵</text>',
'<!-- 大门 -->',
chineseDoor(34, 54, 24, 22),
'<rect x="34" y="52" width="24" height="3" fill="' + C.flagRed + '"/>',
'<!-- 武器架 -->',
'<line x1="16" y1="46" x2="16" y2="72" stroke="' + C.woodMain + '" stroke-width="1.5"/>',
'<line x1="24" y1="46" x2="24" y2="72" stroke="' + C.woodMain + '" stroke-width="1.5"/>',
'<line x1="14" y1="52" x2="26" y2="52" stroke="#9E9E9E" stroke-width="1"/>',
'<line x1="14" y1="60" x2="26" y2="60" stroke="#9E9E9E" stroke-width="1"/>',
'<!-- 靶子 -->',
'<circle cx="76" cy="56" r="8" fill="#FFF"/>',
'<circle cx="76" cy="56" r="5.5" fill="' + C.flagRed + '"/>',
'<circle cx="76" cy="56" r="3" fill="#FFF"/>',
'<circle cx="76" cy="56" r="1.5" fill="' + C.flagRed + '"/>',
'</svg>'
].join('\n');

// ─── 校场 (3×2) ──────────────────────────────
buildings.training_ground = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 96">',
groundShadow(72, 94, 62, 5),
'<!-- 演武场地面 -->',
'<ellipse cx="72" cy="66" rx="56" ry="24" fill="' + C.baseMain + '"/>',
'<ellipse cx="72" cy="64" rx="52" ry="20" fill="' + C.baseLight + '"/>',
'<ellipse cx="72" cy="62" rx="46" ry="16" fill="#D7CCC8"/>',
'<!-- 旗杆 -->',
flag(12, 20, 50, C.flagRed, '魏'),
flag(126, 20, 50, C.flagBlue, '吴'),
'<!-- 武器桩 -->',
'<line x1="40" y1="36" x2="40" y2="64" stroke="' + C.woodMain + '" stroke-width="2.5"/>',
'<line x1="32" y1="44" x2="48" y2="44" stroke="' + C.woodMain + '" stroke-width="2.5"/>',
'<circle cx="40" cy="32" r="4.5" fill="#FFCC80"/>',
'<circle cx="40" cy="32" r="4.5" stroke="' + C.woodMain + '" stroke-width="1.2" fill="none"/>',
'<!-- 靶子 -->',
'<circle cx="104" cy="44" r="12" fill="#FFF"/>',
'<circle cx="104" cy="44" r="8" fill="' + C.flagRed + '"/>',
'<circle cx="104" cy="44" r="4" fill="#FFF"/>',
'<circle cx="104" cy="44" r="2" fill="' + C.flagRed + '"/>',
'<!-- 围栏 -->',
'<rect x="8" y="54" width="3" height="20" fill="' + C.woodDark + '"/>',
'<rect x="133" y="54" width="3" height="20" fill="' + C.woodDark + '"/>',
'<!-- 旌旗 -->',
'<line x1="72" y1="12" x2="72" y2="38" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<polygon points="72,14 88,18 72,22" fill="' + C.gold + '"/>',
'</svg>'
].join('\n');

// ─── 铁匠铺 (2×2) ───────────────────────────
buildings.blacksmith = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(6, 76, 84, 18),
'<!-- 主体 -->',
'<rect x="10" y="38" width="56" height="40" fill="' + C.wallMain + '"/>',
'<rect x="14" y="42" width="48" height="34" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(38, 22, 70, 18, C.roofMain, C.roofDark, C.gold),
'<!-- 烟囱 -->',
'<rect x="60" y="14" width="10" height="26" fill="#757575"/>',
'<rect x="58" y="12" width="14" height="5" fill="#9E9E9E"/>',
'<circle cx="65" cy="8" r="3" fill="#BDBDBD" opacity="0.4"/>',
'<circle cx="63" cy="4" r="2.5" fill="#BDBDBD" opacity="0.25"/>',
'<!-- 锻炉 -->',
'<rect x="18" y="50" width="24" height="24" fill="#4E342E"/>',
'<rect x="22" y="62" width="16" height="12" fill="#E65100"/>',
'<rect x="24" y="58" width="12" height="5" fill="#FF6D00"/>',
'<rect x="27" y="54" width="6" height="5" fill="#FFAB00"/>',
'<!-- 铁砧 -->',
'<rect x="72" y="64" width="18" height="5" fill="#455A64"/>',
'<rect x="76" y="58" width="10" height="7" fill="#546E7A"/>',
'<rect x="74" y="69" width="5" height="7" fill="#37474F"/>',
'<rect x="86" y="69" width="5" height="7" fill="#37474F"/>',
'<!-- 锤子 -->',
'<line x1="82" y1="44" x2="86" y2="56" stroke="' + C.woodMain + '" stroke-width="1.5"/>',
'<rect x="83" y="40" width="6" height="5" rx="1" fill="#78909C"/>',
'</svg>'
].join('\n');

// ─── 城墙 (3×2) ─────────────────────────────
buildings.city_wall = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 96">',
groundShadow(72, 94, 62, 5),
'<!-- 墙体 -->',
'<rect x="4" y="42" width="136" height="52" fill="#8E8E8E"/>',
'<rect x="8" y="46" width="128" height="46" fill="#A8A8A8"/>',
'<!-- 砖纹 -->',
'<line x1="8" y1="62" x2="136" y2="62" stroke="#8E8E8E" stroke-width="0.8"/>',
'<line x1="8" y1="78" x2="136" y2="78" stroke="#8E8E8E" stroke-width="0.8"/>',
'<!-- 垛口 -->',
'<rect x="4" y="32" width="14" height="14" fill="#BDBDBD"/>',
'<rect x="24" y="32" width="14" height="14" fill="#BDBDBD"/>',
'<rect x="46" y="32" width="14" height="14" fill="#BDBDBD"/>',
'<rect x="84" y="32" width="14" height="14" fill="#BDBDBD"/>',
'<rect x="106" y="32" width="14" height="14" fill="#BDBDBD"/>',
'<rect x="126" y="32" width="14" height="14" fill="#BDBDBD"/>',
'<!-- 城门楼 -->',
'<rect x="48" y="12" width="48" height="34" fill="' + C.wallLight + '"/>',
'<rect x="52" y="16" width="40" height="28" fill="#E0E0E0"/>',
chineseRoof(72, 0, 66, 14, C.roofMain, C.roofDark, C.gold),
'<!-- 城门洞 -->',
'<rect x="56" y="62" width="32" height="32" rx="16" fill="' + C.doorDark + '"/>',
'<rect x="56" y="78" width="32" height="16" fill="' + C.doorDark + '"/>',
'<!-- 旗 -->',
'<rect x="68" y="-6" width="2" height="10" fill="' + C.woodMain + '"/>',
'<polygon points="70,-6 82,-2 70,2" fill="' + C.flagRed + '"/>',
'<!-- 城门楼窗 -->',
chineseWindow(60, 22, 8, 8),
chineseWindow(76, 22, 8, 8),
'</svg>'
].join('\n');

// ─── 冒险公会 (2×2) ──────────────────────────
buildings.adventure_guild = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(6, 76, 84, 18),
'<!-- 主体 -->',
'<rect x="10" y="36" width="76" height="42" fill="' + C.wallMain + '"/>',
'<rect x="14" y="40" width="68" height="36" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(48, 18, 90, 20, '#33691E', '#1B5E20', C.gold),
'<!-- 匾额 -->',
'<rect x="24" y="16" width="44" height="14" rx="2" fill="' + C.gold + '"/>',
'<rect x="26" y="18" width="40" height="10" rx="1" fill="#8B6914"/>',
'<text x="46" y="26" text-anchor="middle" font-size="7" fill="#FFF" font-weight="bold" font-family="sans-serif">公会</text>',
'<!-- 大门 -->',
chineseDoor(34, 56, 24, 20),
'<!-- 罗盘 -->',
'<circle cx="22" cy="52" r="6" fill="' + C.gold + '"/>',
'<circle cx="22" cy="52" r="4.5" fill="#8B6914"/>',
'<line x1="22" y1="48" x2="22" y2="56" stroke="' + C.flagRed + '" stroke-width="0.8"/>',
'<line x1="18" y1="52" x2="26" y2="52" stroke="#333" stroke-width="0.8"/>',
'<!-- 火把 -->',
'<rect x="78" y="44" width="2.5" height="16" fill="' + C.woodMain + '"/>',
'<ellipse cx="79" cy="42" rx="3" ry="4" fill="#FF6D00"/>',
'<ellipse cx="79" cy="40" rx="2" ry="3" fill="#FFAB00"/>',
'</svg>'
].join('\n');

// ─── 酒馆 (2×2) ──────────────────────────────
buildings.tavern = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(6, 76, 84, 18),
'<!-- 主体 -->',
'<rect x="10" y="34" width="76" height="44" fill="' + C.wallMain + '"/>',
'<rect x="14" y="38" width="68" height="38" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(48, 16, 90, 20, C.roofMain, C.roofDark, C.gold),
'<!-- 酒旗 -->',
'<rect x="68" y="20" width="2.5" height="10" fill="' + C.woodDark + '"/>',
'<rect x="58" y="28" width="20" height="14" rx="1" fill="' + C.gold + '"/>',
'<text x="68" y="38" text-anchor="middle" font-size="8" fill="' + C.roofDark + '" font-weight="bold" font-family="sans-serif">酒</text>',
'<!-- 大门 -->',
chineseDoor(34, 54, 24, 22),
'<!-- 窗户 -->',
chineseWindow(16, 46, 12, 10),
chineseWindow(66, 46, 12, 10),
'<!-- 灯笼 -->',
lantern(22, 70, 3),
lantern(72, 70, 3),
'<!-- 酒坛 -->',
'<ellipse cx="86" cy="72" rx="6" ry="4" fill="#8B6914"/>',
'<rect x="80" y="64" width="12" height="8" fill="#A38040"/>',
'<ellipse cx="86" cy="64" rx="6" ry="4" fill="#BFA76A"/>',
'</svg>'
].join('\n');

// ─── 仓库 (2×2) ──────────────────────────────
buildings.warehouse = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(4, 76, 88, 18),
'<!-- 主体 -->',
'<rect x="8" y="34" width="80" height="44" fill="' + C.wallMain + '"/>',
'<rect x="12" y="38" width="72" height="38" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(48, 16, 94, 20, C.roofMain, C.roofDark, C.gold),
'<!-- 大仓门 -->',
'<rect x="26" y="46" width="44" height="30" rx="2" fill="' + C.doorDark + '"/>',
'<rect x="28" y="48" width="19" height="26" fill="' + C.doorMain + '"/>',
'<rect x="49" y="48" width="19" height="26" fill="' + C.doorMain + '"/>',
'<rect x="26" y="46" width="44" height="3" fill="' + C.woodMain + '"/>',
'<circle cx="40" cy="62" r="1.5" fill="#9E9E9E"/>',
'<circle cx="56" cy="62" r="1.5" fill="#9E9E9E"/>',
'<!-- 货箱 -->',
'<rect x="76" y="62" width="10" height="8" fill="#BFA76A"/>',
'<rect x="78" y="54" width="8" height="8" fill="#A38040"/>',
'<rect x="4" y="66" width="8" height="6" fill="#8B6914"/>',
'<rect x="6" y="58" width="7" height="8" fill="#A38040"/>',
'</svg>'
].join('\n');

// ─── 集市 (3×2) ──────────────────────────────
buildings.market = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 96">',
groundShadow(72, 94, 62, 5),
stoneBase(4, 76, 136, 18),
'<!-- 左摊位 -->',
'<rect x="8" y="42" width="56" height="36" fill="' + C.wallMain + '"/>',
'<rect x="12" y="46" width="48" height="30" fill="' + C.wallLight + '"/>',
chineseRoof(36, 28, 68, 16, C.flagRed, C.roofDark, C.gold),
'<!-- 商品（左） -->',
'<circle cx="20" cy="60" r="3" fill="' + C.gold + '"/>',
'<circle cx="30" cy="62" r="2.5" fill="#FF8F00"/>',
'<circle cx="40" cy="60" r="3" fill="' + C.gold + '"/>',
'<!-- 右摊位 -->',
'<rect x="80" y="42" width="56" height="36" fill="' + C.wallMain + '"/>',
'<rect x="84" y="46" width="48" height="30" fill="' + C.wallLight + '"/>',
chineseRoof(108, 28, 68, 16, C.flagBlue, '#0D47A1', C.gold),
'<!-- 商品（右） -->',
'<rect x="90" y="56" width="8" height="12" fill="#78909C"/>',
'<rect x="102" y="58" width="7" height="10" fill="#9E9E9E"/>',
'<rect x="116" y="56" width="7" height="12" fill="#B0BEC5"/>',
'<!-- 柱子 -->',
'<rect x="6" y="24" width="2.5" height="52" fill="' + C.woodMain + '"/>',
'<rect x="62" y="24" width="2.5" height="52" fill="' + C.woodMain + '"/>',
'<rect x="135" y="24" width="2.5" height="52" fill="' + C.woodMain + '"/>',
'<!-- 招牌 -->',
'<rect x="52" y="16" width="40" height="12" rx="2" fill="' + C.gold + '"/>',
'<text x="72" y="25" text-anchor="middle" font-size="8" fill="' + C.roofDark + '" font-weight="bold" font-family="sans-serif">集市</text>',
'</svg>'
].join('\n');

// ─── 税务所 (2×2) ────────────────────────────
buildings.tax_office = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(8, 76, 80, 18),
'<!-- 主体 -->',
'<rect x="12" y="38" width="72" height="40" fill="' + C.wallMain + '"/>',
'<rect x="16" y="42" width="64" height="34" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(48, 20, 86, 20, C.roofMain, C.roofDark, C.gold),
'<!-- 匾额 -->',
'<rect x="26" y="44" width="40" height="10" rx="1" fill="' + C.gold + '"/>',
'<text x="46" y="52" text-anchor="middle" font-size="7" fill="' + C.roofDark + '" font-weight="bold" font-family="sans-serif">税赋</text>',
'<!-- 大门 -->',
chineseDoor(36, 58, 20, 18),
'<!-- 算盘 -->',
'<rect x="18" y="56" width="12" height="8" fill="' + C.woodDark + '" rx="1"/>',
'<line x1="21" y1="57" x2="21" y2="63" stroke="' + C.woodMain + '" stroke-width="0.8"/>',
'<line x1="24" y1="57" x2="24" y2="63" stroke="' + C.woodMain + '" stroke-width="0.8"/>',
'<line x1="27" y1="57" x2="27" y2="63" stroke="' + C.woodMain + '" stroke-width="0.8"/>',
'<circle cx="21" cy="59" r="1" fill="' + C.gold + '"/>',
'<circle cx="24" cy="61" r="1" fill="' + C.gold + '"/>',
'<circle cx="27" cy="59" r="1" fill="' + C.gold + '"/>',
'<!-- 柱子 -->',
'<rect x="12" y="38" width="4" height="40" fill="' + C.woodDark + '"/>',
'<rect x="80" y="38" width="4" height="40" fill="' + C.woodDark + '"/>',
'</svg>'
].join('\n');

// ─── 兵器坊 (2×2) ────────────────────────────
buildings.weapon_workshop = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(6, 76, 84, 18),
'<!-- 主体 -->',
'<rect x="10" y="36" width="76" height="42" fill="' + C.wallMain + '"/>',
'<rect x="14" y="40" width="68" height="36" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(48, 18, 90, 20, '#455A64', '#37474F', C.gold),
'<!-- 大门 -->',
chineseDoor(34, 54, 24, 22),
'<!-- 刀剑展示 -->',
'<line x1="18" y1="42" x2="18" y2="68" stroke="#B0BEC5" stroke-width="2"/>',
'<line x1="24" y1="44" x2="24" y2="66" stroke="#90A4AE" stroke-width="1.8"/>',
'<line x1="30" y1="42" x2="30" y2="68" stroke="#B0BEC5" stroke-width="2"/>',
'<line x1="16" y1="50" x2="32" y2="50" stroke="' + C.woodMain + '" stroke-width="1"/>',
'<!-- 盾牌 -->',
'<circle cx="72" cy="52" r="8" fill="#8D6E63"/>',
'<circle cx="72" cy="52" r="6" fill="#A1887F"/>',
'<circle cx="72" cy="52" r="2" fill="' + C.gold + '"/>',
'<!-- 匾额 -->',
'<rect x="30" y="38" width="32" height="8" rx="1" fill="' + C.gold + '"/>',
'<text x="46" y="44.5" text-anchor="middle" font-size="6" fill="' + C.roofDark + '" font-weight="bold" font-family="sans-serif">兵器坊</text>',
'</svg>'
].join('\n');

// ─── 马厩 (2×2) ──────────────────────────────
buildings.stable = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(6, 76, 84, 18),
'<!-- 棚体 -->',
'<rect x="10" y="42" width="76" height="36" fill="' + C.wallMain + '"/>',
'<rect x="14" y="46" width="68" height="30" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(48, 24, 90, 20, '#6D4C41', '#5D4037', C.gold),
'<!-- 栅栏门 -->',
'<rect x="28" y="52" width="36" height="24" fill="' + C.doorDark + '"/>',
'<line x1="32" y1="52" x2="32" y2="76" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<line x1="38" y1="52" x2="38" y2="76" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<line x1="44" y1="52" x2="44" y2="76" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<line x1="50" y1="52" x2="50" y2="76" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<line x1="56" y1="52" x2="56" y2="76" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<line x1="60" y1="52" x2="60" y2="76" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<!-- 馬头 -->',
'<ellipse cx="44" cy="58" rx="5" ry="4" fill="#8D6E63"/>',
'<ellipse cx="48" cy="56" rx="3" ry="2.5" fill="#A1887F"/>',
'<circle cx="49" cy="55" r="1" fill="#333"/>',
'<!-- 草堆 -->',
'<ellipse cx="78" cy="72" rx="8" ry="5" fill="#8BC34A"/>',
'<ellipse cx="78" cy="70" rx="7" ry="4" fill="#9CCC65"/>',
'<!-- 匾 -->',
'<rect x="32" y="28" width="28" height="8" rx="1" fill="' + C.gold + '"/>',
'<text x="46" y="34.5" text-anchor="middle" font-size="6" fill="' + C.roofDark + '" font-weight="bold" font-family="sans-serif">马厩</text>',
'</svg>'
].join('\n');

// ─── 学堂 (2×2) ──────────────────────────────
buildings.academy = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(6, 76, 84, 18),
'<!-- 主体 -->',
'<rect x="10" y="36" width="76" height="42" fill="' + C.wallMain + '"/>',
'<rect x="14" y="40" width="68" height="36" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(48, 16, 90, 22, '#1565C0', '#0D47A1', C.gold),
'<!-- 匾额 -->',
'<rect x="24" y="42" width="44" height="10" rx="1" fill="' + C.gold + '"/>',
'<text x="46" y="50" text-anchor="middle" font-size="7" fill="#0D47A1" font-weight="bold" font-family="sans-serif">学堂</text>',
'<!-- 大门 -->',
chineseDoor(34, 56, 24, 20),
'<!-- 竹简 -->',
'<rect x="16" y="56" width="3" height="14" fill="#8B6914"/>',
'<rect x="20" y="58" width="3" height="12" fill="#A38040"/>',
'<rect x="24" y="56" width="3" height="14" fill="#8B6914"/>',
'<!-- 笔架 -->',
'<rect x="68" y="54" width="2" height="16" fill="' + C.woodDark + '"/>',
'<rect x="74" y="54" width="2" height="16" fill="' + C.woodDark + '"/>',
'<line x1="68" y1="58" x2="76" y2="58" stroke="' + C.woodMain + '" stroke-width="1"/>',
'<line x1="69" y1="55" x2="71" y2="58" stroke="#333" stroke-width="0.8"/>',
'<line x1="73" y1="55" x2="75" y2="58" stroke="#333" stroke-width="0.8"/>',
'<!-- 木柱 -->',
'<rect x="10" y="36" width="4" height="42" fill="' + C.woodDark + '"/>',
'<rect x="82" y="36" width="4" height="42" fill="' + C.woodDark + '"/>',
'</svg>'
].join('\n');

// ─── 水车坊 (2×2) ────────────────────────────
buildings.watermill = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(22, 76, 56, 18),
'<!-- 小屋 -->',
'<rect x="24" y="44" width="52" height="34" fill="' + C.wallMain + '"/>',
'<rect x="28" y="48" width="44" height="28" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(50, 28, 66, 18, C.roofMain, C.roofDark, C.gold),
'<!-- 门 -->',
chineseDoor(40, 58, 18, 18),
'<!-- 水车 -->',
'<circle cx="14" cy="60" r="18" fill="none" stroke="' + C.woodMain + '" stroke-width="3"/>',
'<circle cx="14" cy="60" r="14" fill="none" stroke="' + C.woodDark + '" stroke-width="1"/>',
'<line x1="14" y1="42" x2="14" y2="78" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<line x1="-4" y1="60" x2="32" y2="60" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<line x1="2" y1="48" x2="26" y2="72" stroke="' + C.woodMain + '" stroke-width="1.5"/>',
'<line x1="2" y1="72" x2="26" y2="48" stroke="' + C.woodMain + '" stroke-width="1.5"/>',
'<circle cx="14" cy="60" r="3" fill="' + C.woodDark + '"/>',
'<!-- 水面 -->',
'<path d="M0,82 Q12,78 24,82 T48,82" fill="none" stroke="#1565C0" stroke-width="1.5" opacity="0.5"/>',
'<rect x="0" y="84" width="48" height="10" fill="#1565C0" opacity="0.2"/>',
'</svg>'
].join('\n');

// ─── 石匠坊 (2×2) ────────────────────────────
buildings.stone_mason = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(8, 76, 80, 18),
'<!-- 作坊 -->',
'<rect x="12" y="38" width="72" height="40" fill="' + C.wallMain + '"/>',
'<rect x="16" y="42" width="64" height="34" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(48, 20, 86, 20, '#757575', '#616161', '#BDBDBD'),
'<!-- 门 -->',
chineseDoor(36, 58, 20, 18),
'<!-- 石料 -->',
'<rect x="14" y="62" width="14" height="10" fill="#9E9E9E"/>',
'<rect x="16" y="56" width="10" height="8" fill="#BDBDBD"/>',
'<rect x="68" y="64" width="12" height="8" fill="#B0BEC5"/>',
'<rect x="70" y="58" width="8" height="8" fill="#9E9E9E"/>',
'<!-- 匾额 -->',
'<rect x="28" y="40" width="36" height="8" rx="1" fill="' + C.gold + '"/>',
'<text x="46" y="46.5" text-anchor="middle" font-size="6" fill="#616161" font-weight="bold" font-family="sans-serif">石匠坊</text>',
'<!-- 锤凿 -->',
'<line x1="76" y1="44" x2="80" y2="54" stroke="' + C.woodMain + '" stroke-width="1.5"/>',
'<rect x="78" y="40" width="5" height="5" rx="1" fill="#78909C"/>',
'</svg>'
].join('\n');

// ─── 冶炼坊 (2×2) ────────────────────────────
buildings.smelter = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(6, 76, 84, 18),
'<!-- 主体 -->',
'<rect x="10" y="38" width="60" height="40" fill="' + C.wallMain + '"/>',
'<rect x="14" y="42" width="52" height="34" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(40, 20, 74, 20, '#455A64', '#37474F', C.gold),
'<!-- 烟囱 -->',
'<rect x="66" y="8" width="12" height="42" fill="#616161"/>',
'<rect x="64" y="6" width="16" height="5" fill="#757575"/>',
'<circle cx="72" cy="2" r="3.5" fill="#BDBDBD" opacity="0.4"/>',
'<circle cx="70" cy="-3" r="2.5" fill="#BDBDBD" opacity="0.25"/>',
'<!-- 炉口 -->',
'<rect x="18" y="52" width="20" height="20" fill="#4E342E"/>',
'<rect x="20" y="60" width="16" height="12" fill="#E65100"/>',
'<rect x="22" y="56" width="12" height="5" fill="#FF6D00"/>',
'<!-- 矿石堆 -->',
'<circle cx="80" cy="68" r="5" fill="#455A64"/>',
'<circle cx="86" cy="72" r="4" fill="#546E7A"/>',
'<circle cx="82" cy="74" r="3" fill="#607D8B"/>',
'<!-- 匾 -->',
'<rect x="18" y="40" width="30" height="8" rx="1" fill="' + C.gold + '"/>',
'<text x="33" y="46.5" text-anchor="middle" font-size="6" fill="#37474F" font-weight="bold" font-family="sans-serif">冶炼</text>',
'</svg>'
].join('\n');

// ─── 菜園 (3×2) ──────────────────────────────
buildings.vegetable_garden = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 96">',
groundShadow(72, 94, 60, 4),
'<!-- 篱笆边框 -->',
'<rect x="4" y="12" width="136" height="78" rx="3" fill="#5D4037"/>',
'<rect x="8" y="16" width="128" height="70" rx="2" fill="#6D4C41"/>',
'<!-- 菜垄 -->',
'<rect x="12" y="20" width="56" height="10" fill="#33691E"/>',
'<rect x="12" y="33" width="56" height="10" fill="#2E7D32"/>',
'<rect x="12" y="46" width="56" height="10" fill="#33691E"/>',
'<rect x="12" y="59" width="56" height="10" fill="#2E7D32"/>',
'<rect x="12" y="72" width="56" height="10" fill="#33691E"/>',
'<!-- 蔬菜 -->',
'<g fill="#4CAF50">',
'<circle cx="20" cy="25" r="2.5"/><circle cx="36" cy="25" r="2.5"/><circle cx="52" cy="25" r="2.5"/>',
'<circle cx="28" cy="38" r="2.5"/><circle cx="44" cy="38" r="2.5"/><circle cx="60" cy="38" r="2.5"/>',
'<circle cx="20" cy="51" r="2.5"/><circle cx="36" cy="51" r="2.5"/><circle cx="52" cy="51" r="2.5"/>',
'<circle cx="28" cy="64" r="2.5"/><circle cx="44" cy="64" r="2.5"/><circle cx="60" cy="64" r="2.5"/>',
'<circle cx="20" cy="77" r="2.5"/><circle cx="36" cy="77" r="2.5"/><circle cx="52" cy="77" r="2.5"/>',
'</g>',
'<!-- 小棚 -->',
'<rect x="80" y="36" width="52" height="34" fill="' + C.wallMain + '"/>',
'<rect x="84" y="40" width="44" height="28" fill="' + C.wallLight + '"/>',
chineseRoof(106, 22, 62, 16, C.roofMain, C.roofDark, C.gold),
chineseDoor(96, 50, 18, 18),
'<!-- 水井 -->',
'<ellipse cx="100" cy="80" rx="8" ry="4" fill="#757575"/>',
'<ellipse cx="100" cy="78" rx="7" ry="3.5" fill="#9E9E9E"/>',
'<rect x="96" y="72" width="2" height="8" fill="' + C.woodMain + '"/>',
'<rect x="106" y="72" width="2" height="8" fill="' + C.woodMain + '"/>',
'<rect x="95" y="70" width="14" height="3" fill="' + C.woodMain + '"/>',
'</svg>'
].join('\n');

// ─── 堆肥坑 (2×2) ────────────────────────────
buildings.compost_pit = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 38, 4),
'<!-- 坑体 -->',
'<ellipse cx="48" cy="72" rx="38" ry="16" fill="#5D4037"/>',
'<ellipse cx="48" cy="68" rx="34" ry="14" fill="#6D4C41"/>',
'<ellipse cx="48" cy="64" rx="30" ry="12" fill="#795548"/>',
'<!-- 堆肥料 -->',
'<ellipse cx="48" cy="60" rx="24" ry="10" fill="#4E342E"/>',
'<ellipse cx="44" cy="58" rx="16" ry="8" fill="#33691E" opacity="0.6"/>',
'<!-- 小棚顶 -->',
'<rect x="28" y="24" width="40" height="26" fill="' + C.wallMain + '"/>',
'<rect x="32" y="28" width="32" height="20" fill="' + C.wallLight + '"/>',
chineseRoof(48, 10, 56, 16, C.roofMain, C.roofDark, C.gold),
'<!-- 铲子 -->',
'<line x1="76" y1="30" x2="80" y2="64" stroke="' + C.woodMain + '" stroke-width="2"/>',
'<ellipse cx="80" cy="66" rx="5" ry="3" fill="#78909C"/>',
'<!-- 匾 -->',
'<rect x="34" y="30" width="28" height="8" rx="1" fill="' + C.gold + '"/>',
'<text x="48" y="36.5" text-anchor="middle" font-size="6" fill="' + C.roofDark + '" font-weight="bold" font-family="sans-serif">堆肥</text>',
'</svg>'
].join('\n');

// ─── 种子铺 (2×2) ────────────────────────────
buildings.seed_shop = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
groundShadow(48, 94, 40, 5),
stoneBase(8, 76, 80, 18),
'<!-- 主体 -->',
'<rect x="12" y="38" width="72" height="40" fill="' + C.wallMain + '"/>',
'<rect x="16" y="42" width="64" height="34" fill="' + C.wallLight + '"/>',
'<!-- 屋顶 -->',
chineseRoof(48, 20, 86, 20, '#33691E', '#1B5E20', C.gold),
'<!-- 大门 -->',
chineseDoor(36, 56, 20, 20),
'<!-- 种子袋 -->',
'<ellipse cx="22" cy="66" rx="6" ry="8" fill="#8B6914"/>',
'<ellipse cx="22" cy="62" rx="5" ry="3" fill="#A38040"/>',
'<ellipse cx="74" cy="68" rx="5" ry="7" fill="#6B4F12"/>',
'<ellipse cx="74" cy="64" rx="4" ry="2.5" fill="#8B6914"/>',
'<!-- 匾额 -->',
'<rect x="26" y="42" width="40" height="10" rx="1" fill="' + C.gold + '"/>',
'<text x="46" y="50" text-anchor="middle" font-size="7" fill="#1B5E20" font-weight="bold" font-family="sans-serif">种子铺</text>',
'<!-- 盆栽 -->',
'<rect x="66" y="50" width="10" height="6" fill="#8D6E63"/>',
'<circle cx="71" cy="48" r="3" fill="#4CAF50"/>',
'<circle cx="69" cy="46" r="2.5" fill="#66BB6A"/>',
'</svg>'
].join('\n');

// ─── 停车场 (5×2) ────────────────────────────
buildings.parking_lot = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 96">',
groundShadow(120, 94, 108, 5),
'<!-- 地面 -->',
'<rect x="4" y="10" width="232" height="82" rx="6" fill="' + C.baseDark + '"/>',
'<rect x="8" y="14" width="224" height="74" rx="4" fill="' + C.baseMain + '"/>',
'<!-- 车位线 -->',
'<rect x="20" y="22" width="36" height="52" rx="3" fill="' + C.baseDark + '" opacity="0.4"/>',
'<rect x="64" y="22" width="36" height="52" rx="3" fill="' + C.baseDark + '" opacity="0.4"/>',
'<rect x="108" y="22" width="36" height="52" rx="3" fill="' + C.baseDark + '" opacity="0.4"/>',
'<rect x="152" y="22" width="36" height="52" rx="3" fill="' + C.baseDark + '" opacity="0.4"/>',
'<rect x="196" y="22" width="36" height="52" rx="3" fill="' + C.baseDark + '" opacity="0.4"/>',
'<!-- 标题 -->',
'<rect x="88" y="4" width="64" height="12" rx="2" fill="' + C.gold + '"/>',
'<text x="120" y="13" text-anchor="middle" font-size="8" fill="' + C.roofDark + '" font-weight="bold" font-family="sans-serif">🅿️ 停车场</text>',
'<!-- 围栏柱 -->',
'<rect x="4" y="10" width="3" height="82" fill="' + C.woodDark + '"/>',
'<rect x="233" y="10" width="3" height="82" fill="' + C.woodDark + '"/>',
'</svg>'
].join('\n');


// ============================================================
// 地形 SVG — 三国古风
// ============================================================

var terrains = {};

terrains.grass = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
'<rect width="48" height="48" fill="' + C.groundMain + '"/>',
'<circle cx="8" cy="12" r="2" fill="' + C.groundLight + '" opacity="0.4"/>',
'<circle cx="32" cy="8" r="1.5" fill="' + C.groundDark + '" opacity="0.4"/>',
'<circle cx="20" cy="36" r="2" fill="' + C.groundLight + '" opacity="0.3"/>',
'<circle cx="40" cy="28" r="1" fill="' + C.groundDark + '" opacity="0.3"/>',
'<circle cx="12" cy="42" r="1.5" fill="' + C.groundLight + '" opacity="0.25"/>',
'<circle cx="36" cy="40" r="1" fill="#8A9455" opacity="0.2"/>',
'</svg>'
].join('\n');

terrains.tree = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">',
'<!-- 树干 -->',
'<rect x="20" y="40" width="8" height="20" fill="#5D4037"/>',
'<rect x="22" y="38" width="4" height="4" fill="#6D4C41"/>',
'<!-- 树冠（松树） -->',
'<polygon points="24,8 6,34 42,34" fill="#2E5E3F"/>',
'<polygon points="24,4 10,26 38,26" fill="#3D6B4E"/>',
'<polygon points="24,0 14,18 34,18" fill="#4A7A5A"/>',
'<!-- 阴影 -->',
'<ellipse cx="24" cy="60" rx="12" ry="3" fill="rgba(0,0,0,0.12)"/>',
'</svg>'
].join('\n');

terrains.bush = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 28">',
'<!-- 竹竿 -->',
'<rect x="8" y="2" width="2" height="24" fill="#4CAF50"/>',
'<rect x="14" y="0" width="2" height="26" fill="#388E3C"/>',
'<rect x="20" y="3" width="2" height="23" fill="#4CAF50"/>',
'<!-- 竹节 -->',
'<line x1="8" y1="8" x2="10" y2="8" stroke="#2E7D32" stroke-width="1.5"/>',
'<line x1="14" y1="10" x2="16" y2="10" stroke="#1B5E20" stroke-width="1.5"/>',
'<line x1="20" y1="9" x2="22" y2="9" stroke="#2E7D32" stroke-width="1.5"/>',
'<line x1="8" y1="16" x2="10" y2="16" stroke="#2E7D32" stroke-width="1.5"/>',
'<line x1="14" y1="18" x2="16" y2="18" stroke="#1B5E20" stroke-width="1.5"/>',
'<line x1="20" y1="17" x2="22" y2="17" stroke="#2E7D32" stroke-width="1.5"/>',
'<!-- 竹叶 -->',
'<path d="M10,6 Q16,2 14,8" fill="#66BB6A"/>',
'<path d="M16,4 Q22,0 20,6" fill="#4CAF50"/>',
'<path d="M8,14 Q2,10 6,16" fill="#66BB6A"/>',
'<path d="M22,12 Q28,8 24,14" fill="#4CAF50"/>',
'</svg>'
].join('\n');

terrains.flower = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 28">',
'<!-- 枝干 -->',
'<line x1="10" y1="12" x2="10" y2="28" stroke="#6D4C41" stroke-width="2"/>',
'<line x1="10" y1="16" x2="6" y2="12" stroke="#795548" stroke-width="1"/>',
'<line x1="10" y1="14" x2="14" y2="10" stroke="#795548" stroke-width="1"/>',
'<!-- 花朵 -->',
'<circle cx="10" cy="8" r="3.5" fill="#F48FB1"/>',
'<circle cx="6" cy="12" r="2.5" fill="#EC407A"/>',
'<circle cx="14" cy="10" r="3" fill="#F48FB1"/>',
'<circle cx="10" cy="8" r="1.5" fill="#FCE4EC"/>',
'<circle cx="14" cy="10" r="1.2" fill="#FCE4EC"/>',
'<!-- 叶 -->',
'<ellipse cx="6" cy="18" rx="2.5" ry="1.5" fill="#4CAF50" transform="rotate(-20,6,18)"/>',
'<ellipse cx="14" cy="20" rx="2.5" ry="1.5" fill="#4CAF50" transform="rotate(20,14,20)"/>',
'</svg>'
].join('\n');

terrains.rock = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 28">',
'<!-- 底座阴影 -->',
'<ellipse cx="16" cy="26" rx="14" ry="3" fill="rgba(0,0,0,0.12)"/>',
'<!-- 假山主体 -->',
'<path d="M4,26 Q2,18 8,12 Q12,6 16,4 Q20,6 24,10 Q30,16 28,26 Z" fill="#78909C"/>',
'<path d="M6,24 Q4,18 10,14 Q14,8 16,6 Q18,8 22,12 Q26,16 26,24 Z" fill="#90A4AE"/>',
'<!-- 孔洞 -->',
'<ellipse cx="14" cy="16" rx="3" ry="2.5" fill="#546E7A"/>',
'<ellipse cx="20" cy="20" rx="2" ry="1.8" fill="#607D8B"/>',
'<!-- 苔藓 -->',
'<circle cx="10" cy="22" r="1.5" fill="#66BB6A" opacity="0.5"/>',
'<circle cx="22" cy="24" r="1" fill="#4CAF50" opacity="0.4"/>',
'</svg>'
].join('\n');

terrains.water = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
'<rect width="48" height="48" fill="#1565C0"/>',
'<path d="M0,16 Q12,12 24,16 T48,16" fill="none" stroke="#1E88E5" stroke-width="2" opacity="0.5"/>',
'<path d="M0,32 Q12,28 24,32 T48,32" fill="none" stroke="#1E88E5" stroke-width="2" opacity="0.35"/>',
'</svg>'
].join('\n');

terrains.path_tile = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
'<rect width="48" height="48" fill="#9E8E75"/>',
'<rect x="2" y="2" width="20" height="20" rx="2" fill="#A89A80" opacity="0.4"/>',
'<rect x="26" y="26" width="20" height="20" rx="2" fill="#A89A80" opacity="0.3"/>',
'<circle cx="36" cy="12" r="1.5" fill="#8B7D5C" opacity="0.3"/>',
'<circle cx="12" cy="38" r="1" fill="#8B7D5C" opacity="0.3"/>',
'</svg>'
].join('\n');

terrains.flag = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 40">',
'<!-- 旗杆 -->',
'<rect x="3" y="0" width="2.5" height="40" fill="' + C.woodMain + '"/>',
'<circle cx="4.25" cy="0" r="2" fill="' + C.gold + '"/>',
'<!-- 旗面 -->',
'<rect x="5.5" y="2" width="16" height="20" fill="' + C.flagRed + '"/>',
'<path d="M21.5,2 L24,6 L21.5,10" fill="' + C.flagRed + '" opacity="0.7"/>',
'<path d="M21.5,12 L23,15 L21.5,18" fill="' + C.flagRed + '" opacity="0.5"/>',
'<!-- 旗穗 -->',
'<line x1="8" y1="22" x2="7" y2="28" stroke="' + C.flagRed + '" stroke-width="0.8"/>',
'<line x1="14" y1="22" x2="13" y2="28" stroke="' + C.flagRed + '" stroke-width="0.8"/>',
'<line x1="20" y1="22" x2="19" y2="28" stroke="' + C.flagRed + '" stroke-width="0.8"/>',
'</svg>'
].join('\n');

terrains.lantern = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 28">',
'<!-- 挂钩 -->',
'<rect x="7" y="0" width="2" height="4" fill="' + C.gold + '"/>',
'<!-- 灯体 -->',
'<ellipse cx="8" cy="12" rx="6" ry="8" fill="#E53935"/>',
'<ellipse cx="8" cy="12" rx="4" ry="6" fill="#FF5252" opacity="0.5"/>',
'<!-- 箍 -->',
'<rect x="3" y="4" width="10" height="2" fill="' + C.gold + '"/>',
'<rect x="3.5" y="19" width="9" height="2" fill="' + C.gold + '"/>',
'<!-- 穗 -->',
'<line x1="8" y1="21" x2="8" y2="28" stroke="#C62828" stroke-width="1"/>',
'<line x1="6" y1="21" x2="5" y2="26" stroke="#C62828" stroke-width="0.6"/>',
'<line x1="10" y1="21" x2="11" y2="26" stroke="#C62828" stroke-width="0.6"/>',
'</svg>'
].join('\n');


// ─── 边境地形：可拼接的山脉/河流瓦片 ──────────────
// 山脉瓦片（48×48，可无缝水平/垂直平铺）
terrains.mountain = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
'<rect width="48" height="48" fill="#4A5238"/>',
'<!-- 远山层 -->',
'<path d="M-4,42 Q4,14 16,18 Q24,6 32,16 Q38,10 52,38 L52,48 L-4,48 Z" fill="#5D6650"/>',
'<path d="M-2,44 Q6,20 18,24 Q24,12 34,22 Q40,16 50,40 L50,48 L-2,48 Z" fill="#6B7A58"/>',
'<!-- 山石纹理 -->',
'<path d="M10,30 Q14,26 18,30" fill="none" stroke="#4A5238" stroke-width="0.8" opacity="0.5"/>',
'<path d="M28,28 Q32,24 36,28" fill="none" stroke="#4A5238" stroke-width="0.8" opacity="0.4"/>',
'<!-- 树点缀 -->',
'<polygon points="8,34 6,40 10,40" fill="#3D5030"/>',
'<polygon points="22,30 20,36 24,36" fill="#4A6040"/>',
'<polygon points="38,32 36,38 40,38" fill="#3D5030"/>',
'<!-- 云雾 -->',
'<ellipse cx="12" cy="22" rx="8" ry="2" fill="rgba(255,255,255,0.08)"/>',
'<ellipse cx="36" cy="18" rx="6" ry="1.5" fill="rgba(255,255,255,0.06)"/>',
'</svg>'
].join('\n');

// 高山瓦片（更高的山峰，用于角落）
terrains.mountain_peak = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
'<rect width="48" height="48" fill="#3D4530"/>',
'<!-- 主峰 -->',
'<path d="M-4,48 Q0,28 12,16 Q18,6 24,2 Q30,6 36,16 Q48,28 52,48 Z" fill="#556B4A"/>',
'<path d="M2,48 Q6,30 16,20 Q20,10 24,6 Q28,10 32,20 Q42,30 46,48 Z" fill="#6B8058"/>',
'<!-- 雪顶 -->',
'<path d="M20,10 Q22,4 24,2 Q26,4 28,10 Q24,8 20,10 Z" fill="rgba(255,255,255,0.25)"/>',
'<!-- 岩石纹理 -->',
'<path d="M14,26 Q18,22 22,26" fill="none" stroke="#3D4530" stroke-width="1" opacity="0.4"/>',
'<path d="M26,24 Q30,20 34,24" fill="none" stroke="#3D4530" stroke-width="1" opacity="0.35"/>',
'<!-- 松树 -->',
'<polygon points="10,36 8,44 12,44" fill="#2E4228"/>',
'<polygon points="18,32 16,40 20,40" fill="#3D5030"/>',
'<polygon points="34,34 32,42 36,42" fill="#2E4228"/>',
'<polygon points="40,36 38,44 42,44" fill="#3D5030"/>',
'<!-- 云雾 -->',
'<ellipse cx="24" cy="14" rx="10" ry="2" fill="rgba(255,255,255,0.1)"/>',
'</svg>'
].join('\n');

// 河流瓦片（水平流向）
terrains.river_h = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
'<rect width="48" height="48" fill="#4A5238"/>',
'<!-- 河岸上 -->',
'<path d="M0,0 L48,0 L48,14 Q36,16 24,14 Q12,12 0,16 Z" fill="#5D6650"/>',
'<!-- 河面 -->',
'<rect x="0" y="14" width="48" height="20" fill="#1A5276"/>',
'<path d="M0,20 Q12,18 24,22 T48,20" fill="none" stroke="#2E86C1" stroke-width="1.5" opacity="0.4"/>',
'<path d="M0,28 Q12,26 24,30 T48,28" fill="none" stroke="#2E86C1" stroke-width="1" opacity="0.3"/>',
'<!-- 河岸下 -->',
'<path d="M0,34 Q12,32 24,34 Q36,36 48,34 L48,48 L0,48 Z" fill="#5D6650"/>',
'<!-- 岸边石 -->',
'<ellipse cx="8" cy="14" rx="3" ry="1.5" fill="#78909C" opacity="0.5"/>',
'<ellipse cx="32" cy="35" rx="2.5" ry="1.2" fill="#78909C" opacity="0.4"/>',
'<!-- 岸草 -->',
'<circle cx="14" cy="12" r="1.5" fill="#4A6040" opacity="0.5"/>',
'<circle cx="40" cy="37" r="1.5" fill="#4A6040" opacity="0.5"/>',
'</svg>'
].join('\n');

// 河流瓦片（垂直流向）
terrains.river_v = [
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
'<rect width="48" height="48" fill="#4A5238"/>',
'<!-- 左岸 -->',
'<path d="M0,0 L16,0 Q14,12 16,24 Q18,36 14,48 L0,48 Z" fill="#5D6650"/>',
'<!-- 河面 -->',
'<rect x="14" y="0" width="20" height="48" fill="#1A5276"/>',
'<path d="M20,0 Q18,12 22,24 T20,48" fill="none" stroke="#2E86C1" stroke-width="1.5" opacity="0.4"/>',
'<path d="M28,0 Q26,12 30,24 T28,48" fill="none" stroke="#2E86C1" stroke-width="1" opacity="0.3"/>',
'<!-- 右岸 -->',
'<path d="M34,0 Q36,12 34,24 Q32,36 36,48 L48,48 L48,0 Z" fill="#5D6650"/>',
'<!-- 岸边石 -->',
'<ellipse cx="14" cy="10" rx="1.5" ry="2.5" fill="#78909C" opacity="0.5"/>',
'<ellipse cx="35" cy="34" rx="1.2" ry="2" fill="#78909C" opacity="0.4"/>',
'</svg>'
].join('\n');


// ============================================================
// 写入文件
// ============================================================

for (var id in buildings) {
  fs.writeFileSync(path.join(buildingDir, id + '.svg'), buildings[id]);
  console.log('✅ buildings/' + id + '.svg');
}

for (var id in terrains) {
  fs.writeFileSync(path.join(terrainDir, id + '.svg'), terrains[id]);
  console.log('✅ terrain/' + id + '.svg');
}

console.log('\n📊 Generated ' + Object.keys(buildings).length + ' buildings + ' + Object.keys(terrains).length + ' terrains');
console.log('🎨 三国古风 SVG 资源生成完毕！');
