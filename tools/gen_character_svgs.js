/**
 * 生成角色 SVG 精灵图 — 10 个角色 chibi 风格
 * 4 个 NPC + 6 个武将（按阵营/性别）
 * 输出到 assets/img/characters/
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'assets', 'img', 'characters');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── 通用组件 ──
function legs(pantsColor = '#8B6F47', shoeColor = '#4A3728') {
  return `
  <rect x="18" y="46" width="4" height="9" rx="1.5" fill="${pantsColor}"/>
  <rect x="26" y="46" width="4" height="9" rx="1.5" fill="${pantsColor}"/>
  <ellipse cx="19.5" cy="56" rx="4" ry="2.5" fill="${shoeColor}"/>
  <ellipse cx="28.5" cy="56" rx="4" ry="2.5" fill="${shoeColor}"/>`;
}

function arms(outfitColor, skinColor = '#FFE0BD', skinStroke = '#D4A574') {
  return `
  <line x1="15" y1="31" x2="9" y2="40" stroke="${outfitColor}" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="33" y1="31" x2="39" y2="40" stroke="${outfitColor}" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="9" cy="40" r="2.8" fill="${skinColor}" stroke="${skinStroke}" stroke-width="0.5"/>
  <circle cx="39" cy="40" r="2.8" fill="${skinColor}" stroke="${skinStroke}" stroke-width="0.5"/>`;
}

function head(skinColor = '#FFE0BD', skinStroke = '#D4A574') {
  return `
  <rect x="22" y="24" width="4" height="4" rx="1" fill="${skinColor}"/>
  <circle cx="24" cy="15" r="11" fill="${skinColor}" stroke="${skinStroke}" stroke-width="0.8"/>`;
}

function face(extras = '') {
  return `
  <circle cx="20" cy="14" r="1.5" fill="#333"/>
  <circle cx="28" cy="14" r="1.5" fill="#333"/>
  <path d="M22,19 Q24,21 26,19" stroke="#C4956A" fill="none" stroke-width="0.8"/>
  ${extras}`;
}

function shadow() {
  return `<ellipse cx="24" cy="58" rx="11" ry="3" fill="rgba(0,0,0,0.12)"/>`;
}

function robe(color, stroke, sashColor) {
  return `
  <path d="M15,28 Q15,26 24,25 Q33,26 33,28 L33,46 L15,46 Z" fill="${color}" stroke="${stroke}" stroke-width="0.8"/>
  <rect x="15" y="37" width="18" height="3" rx="1" fill="${sashColor}"/>`;
}

function dress(color, stroke, sashColor) {
  return `
  <path d="M16,28 Q16,26 24,25 Q32,26 32,28 L35,46 L13,46 Z" fill="${color}" stroke="${stroke}" stroke-width="0.8"/>
  <rect x="16" y="35" width="16" height="2" rx="1" fill="${sashColor}"/>`;
}

function armor(color, stroke, plateColor) {
  return `
  <path d="M14,28 Q14,26 24,25 Q34,26 34,28 L34,46 L14,46 Z" fill="${color}" stroke="${stroke}" stroke-width="0.8"/>
  <path d="M17,29 L17,40 L31,40 L31,29 Q28,27 24,27 Q20,27 17,29Z" fill="${plateColor}" opacity="0.4"/>
  <line x1="24" y1="29" x2="24" y2="42" stroke="${stroke}" stroke-width="0.5"/>
  <rect x="14" y="37" width="20" height="3" rx="1" fill="${plateColor}" opacity="0.6"/>`;
}

function wrap(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">\n${content}\n</svg>`;
}

// ── 角色定义 ──

const characters = {};

// 1. NPC 男性村民 — 棕色长袍，黑色发髻
characters.npc_male = wrap([
  shadow(),
  legs(),
  robe('#A0845C', '#7D6641', '#6B5232'),
  arms('#A0845C'),
  head(),
  // 黑色头发 + 发髻
  `<path d="M13,13 Q13,5 24,4 Q35,5 35,13" fill="#2C1810"/>`,
  `<ellipse cx="24" cy="4" rx="3" ry="2.5" fill="#2C1810"/>`,
  face(),
].join('\n'));

// 2. NPC 女性村民 — 绿色裙装，双丸子头
characters.npc_female = wrap([
  shadow(),
  legs('#8B6F47', '#6B5232'),
  dress('#5D8A6B', '#3E6B4D', '#E8B4B8'),
  arms('#5D8A6B'),
  head(),
  // 黑发 + 双丸子
  `<path d="M14,14 Q14,5 24,4 Q34,5 34,14" fill="#1A1A1A"/>`,
  `<circle cx="15" cy="8" r="4" fill="#1A1A1A"/>`,
  `<circle cx="33" cy="8" r="4" fill="#1A1A1A"/>`,
  face(`<ellipse cx="20" cy="18" rx="2.5" ry="1.5" fill="#FFB6C1" opacity="0.4"/>
  <ellipse cx="28" cy="18" rx="2.5" ry="1.5" fill="#FFB6C1" opacity="0.4"/>`),
].join('\n'));

// 3. NPC 守卫 — 灰色铠甲，头盔
characters.npc_guard = wrap([
  shadow(),
  legs('#5D5D5D', '#3A3A3A'),
  armor('#7F8C8D', '#566573', '#95A5A6'),
  // 左手持矛
  `<line x1="15" y1="31" x2="6" y2="40" stroke="#7F8C8D" stroke-width="4.5" stroke-linecap="round"/>`,
  `<circle cx="6" cy="40" r="2.8" fill="#FFE0BD" stroke="#D4A574" stroke-width="0.5"/>`,
  `<line x1="6" y1="40" x2="6" y2="8" stroke="#8B7355" stroke-width="1.8"/>`,
  `<polygon points="3,8 6,2 9,8" fill="#95A5A6" stroke="#566573" stroke-width="0.5"/>`,
  // 右手
  `<line x1="33" y1="31" x2="39" y2="40" stroke="#7F8C8D" stroke-width="4.5" stroke-linecap="round"/>`,
  `<circle cx="39" cy="40" r="2.8" fill="#FFE0BD" stroke="#D4A574" stroke-width="0.5"/>`,
  head(),
  // 头盔
  `<path d="M11,16 Q11,2 24,1 Q37,2 37,16" fill="#7F8C8D" stroke="#566573" stroke-width="0.8"/>`,
  `<rect x="11" y="14" width="26" height="3" rx="1" fill="#566573"/>`,
  `<rect x="22" y="-1" width="4" height="5" rx="1" fill="#C0392B"/>`,
  face(),
].join('\n'));

// 4. NPC 小孩 — 更小比例，活泼配色
characters.npc_child = wrap([
  shadow(),
  // 更短的腿
  `<rect x="19" y="46" width="3.5" height="7" rx="1.5" fill="#8B6F47"/>`,
  `<rect x="26" y="46" width="3.5" height="7" rx="1.5" fill="#8B6F47"/>`,
  `<ellipse cx="20.5" cy="54" rx="3.5" ry="2" fill="#4A3728"/>`,
  `<ellipse cx="28" cy="54" rx="3.5" ry="2" fill="#4A3728"/>`,
  // 小身体
  `<path d="M17,30 Q17,28 24,27 Q31,28 31,30 L31,46 L17,46 Z" fill="#E74C3C" stroke="#C0392B" stroke-width="0.8"/>`,
  `<rect x="17" y="38" width="14" height="2" rx="1" fill="#F1C40F"/>`,
  // 小手臂
  `<line x1="17" y1="33" x2="12" y2="39" stroke="#E74C3C" stroke-width="3.5" stroke-linecap="round"/>`,
  `<line x1="31" y1="33" x2="36" y2="39" stroke="#E74C3C" stroke-width="3.5" stroke-linecap="round"/>`,
  `<circle cx="12" cy="39" r="2.3" fill="#FFE0BD" stroke="#D4A574" stroke-width="0.5"/>`,
  `<circle cx="36" cy="39" r="2.3" fill="#FFE0BD" stroke="#D4A574" stroke-width="0.5"/>`,
  // 脖子 + 头（稍大）
  `<rect x="22" y="25" width="4" height="4" rx="1" fill="#FFE0BD"/>`,
  `<circle cx="24" cy="16" r="11" fill="#FFE0BD" stroke="#D4A574" stroke-width="0.8"/>`,
  // 凌乱头发
  `<path d="M14,14 Q14,7 24,6 Q34,7 34,14" fill="#4A2F1B"/>`,
  `<path d="M16,7 L14,3" stroke="#4A2F1B" stroke-width="2" stroke-linecap="round"/>`,
  `<path d="M21,6 L20,2" stroke="#4A2F1B" stroke-width="2" stroke-linecap="round"/>`,
  `<path d="M27,6 L28,2" stroke="#4A2F1B" stroke-width="2" stroke-linecap="round"/>`,
  `<path d="M32,7 L34,3" stroke="#4A2F1B" stroke-width="2" stroke-linecap="round"/>`,
  // 大眼 + 笑脸
  face(`<path d="M21,19 Q24,22 27,19" stroke="#C4956A" fill="none" stroke-width="1"/>
  <ellipse cx="20" cy="18" rx="2" ry="1.2" fill="#FFB6C1" opacity="0.4"/>
  <ellipse cx="28" cy="18" rx="2" ry="1.2" fill="#FFB6C1" opacity="0.4"/>`),
].join('\n'));

// 5. 蜀 男性武将 — 红金战袍
characters.hero_shu = wrap([
  shadow(),
  legs('#6B3A2A', '#4A2318'),
  robe('#C0392B', '#922B21', '#F5C518'),
  // 金色肩甲
  `<ellipse cx="14" cy="28" rx="4" ry="2.5" fill="#F5C518" stroke="#D4AC0D" stroke-width="0.5"/>`,
  `<ellipse cx="34" cy="28" rx="4" ry="2.5" fill="#F5C518" stroke="#D4AC0D" stroke-width="0.5"/>`,
  arms('#C0392B'),
  head(),
  // 武将发髻 + 红色丝带
  `<path d="M13,13 Q13,4 24,3 Q35,4 35,13" fill="#2C1810"/>`,
  `<ellipse cx="24" cy="3" rx="3.5" ry="3" fill="#2C1810"/>`,
  `<path d="M21,4 L17,9" stroke="#C0392B" stroke-width="1.5" stroke-linecap="round"/>`,
  `<path d="M27,4 L31,9" stroke="#C0392B" stroke-width="1.5" stroke-linecap="round"/>`,
  face(),
].join('\n'));

// 6. 魏 男性武将 — 蓝银铠甲
characters.hero_wei = wrap([
  shadow(),
  legs('#3D3D5C', '#2A2A40'),
  armor('#2C3E8A', '#1A237E', '#B0BEC5'),
  // 肩甲
  `<rect x="10" y="27" width="6" height="4" rx="2" fill="#B0BEC5" stroke="#7F8C8D" stroke-width="0.5"/>`,
  `<rect x="32" y="27" width="6" height="4" rx="2" fill="#B0BEC5" stroke="#7F8C8D" stroke-width="0.5"/>`,
  arms('#2C3E8A'),
  head(),
  // 官帽
  `<path d="M13,14 Q13,6 24,5 Q35,6 35,14" fill="#2C1810"/>`,
  `<rect x="13" y="5" width="22" height="7" rx="2" fill="#2C3E8A" stroke="#1A237E" stroke-width="0.5"/>`,
  `<rect x="21" y="1" width="6" height="5" rx="1" fill="#2C3E8A"/>`,
  `<circle cx="24" cy="4" r="1.5" fill="#B0BEC5"/>`,
  face(),
].join('\n'));

// 7. 吴 男性武将 — 绿色文武装
characters.hero_wu_m = wrap([
  shadow(),
  legs('#4A6B3A', '#3A5229'),
  robe('#27AE60', '#1E8449', '#ECF0F1'),
  // 轻甲点缀
  `<path d="M15,28 L18,28 L18,36 L15,36 Z" fill="#1E8449" opacity="0.5"/>`,
  `<path d="M30,28 L33,28 L33,36 L30,36 Z" fill="#1E8449" opacity="0.5"/>`,
  arms('#27AE60'),
  head(),
  // 文士冠
  `<path d="M13,13 Q13,4 24,3 Q35,4 35,13" fill="#1A1A1A"/>`,
  `<path d="M10,9 Q10,3 24,2 Q38,3 38,9 L36,11 L12,11 Z" fill="#27AE60" stroke="#1E8449" stroke-width="0.5"/>`,
  `<rect x="18" y="0" width="12" height="4" rx="1.5" fill="#27AE60"/>`,
  face(),
].join('\n'));

// 8. 吴 女性武将 — 绿色战裙 + 长发
characters.hero_wu_f = wrap([
  shadow(),
  legs('#4A6B3A', '#3A5229'),
  dress('#27AE60', '#1E8449', '#ECF0F1'),
  arms('#27AE60'),
  head(),
  // 长发 + 发簪
  `<path d="M13,13 Q13,5 24,4 Q35,5 35,13" fill="#1A1A1A"/>`,
  `<path d="M13,14 L11,32 Q11,34 13,33 L14,22" fill="#1A1A1A"/>`,
  `<path d="M35,14 L37,32 Q37,34 35,33 L34,22" fill="#1A1A1A"/>`,
  `<circle cx="32" cy="6" r="2.5" fill="#F1C40F" stroke="#D4AC0D" stroke-width="0.5"/>`,
  `<line x1="32" y1="3" x2="34" y2="0" stroke="#D4AC0D" stroke-width="0.8"/>`,
  face(`<ellipse cx="20" cy="18" rx="2.5" ry="1.5" fill="#FFB6C1" opacity="0.3"/>
  <ellipse cx="28" cy="18" rx="2.5" ry="1.5" fill="#FFB6C1" opacity="0.3"/>`),
].join('\n'));

// 9. 群 男性武将 — 紫色战袍 + 狂野发型
characters.hero_qun_m = wrap([
  shadow(),
  legs('#5C3D6B', '#3D2A4A'),
  robe('#8E44AD', '#6C3483', '#F39C12'),
  // 肩饰
  `<circle cx="13" cy="28" r="3" fill="#F39C12" stroke="#D68910" stroke-width="0.5"/>`,
  `<circle cx="35" cy="28" r="3" fill="#F39C12" stroke="#D68910" stroke-width="0.5"/>`,
  arms('#8E44AD'),
  head(),
  // 狂野头发 + 头带
  `<path d="M12,14 Q12,4 24,3 Q36,4 36,14" fill="#2C1810"/>`,
  `<path d="M12,8 L8,4" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>`,
  `<path d="M18,5 L16,0" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>`,
  `<path d="M24,4 L24,-1" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>`,
  `<path d="M30,5 L32,0" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>`,
  `<path d="M36,8 L40,4" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round"/>`,
  // 头带
  `<path d="M12,10 Q12,9 24,8 Q36,9 36,10" stroke="#F39C12" fill="none" stroke-width="2"/>`,
  face(),
].join('\n'));

// 10. 群 女性武将 — 紫色华服 + 盘发花饰
characters.hero_qun_f = wrap([
  shadow(),
  legs('#5C3D6B', '#3D2A4A'),
  dress('#8E44AD', '#6C3483', '#F39C12'),
  // 袖口金边
  `<line x1="15" y1="31" x2="8" y2="40" stroke="#8E44AD" stroke-width="5" stroke-linecap="round"/>`,
  `<line x1="33" y1="31" x2="40" y2="40" stroke="#8E44AD" stroke-width="5" stroke-linecap="round"/>`,
  `<circle cx="8" cy="40" r="2.8" fill="#FFE0BD" stroke="#D4A574" stroke-width="0.5"/>`,
  `<circle cx="40" cy="40" r="2.8" fill="#FFE0BD" stroke="#D4A574" stroke-width="0.5"/>`,
  // 飘带
  `<path d="M13,36 Q8,42 10,48" stroke="#F39C12" stroke-width="1" fill="none" opacity="0.7"/>`,
  `<path d="M35,36 Q40,42 38,48" stroke="#F39C12" stroke-width="1" fill="none" opacity="0.7"/>`,
  head(),
  // 盘发 + 花饰
  `<path d="M14,14 Q14,5 24,4 Q34,5 34,14" fill="#1A1A1A"/>`,
  `<ellipse cx="24" cy="3" rx="5" ry="4" fill="#1A1A1A"/>`,
  `<path d="M14,14 L12,28" stroke="#1A1A1A" stroke-width="2.5"/>`,
  `<path d="M34,14 L36,28" stroke="#1A1A1A" stroke-width="2.5"/>`,
  // 花
  `<circle cx="30" cy="3" r="3" fill="#E91E63"/>`,
  `<circle cx="30" cy="3" r="1.2" fill="#FCE4EC"/>`,
  `<circle cx="27" cy="5" r="1.5" fill="#E91E63" opacity="0.6"/>`,
  face(`<ellipse cx="20" cy="18" rx="2.5" ry="1.5" fill="#FFB6C1" opacity="0.4"/>
  <ellipse cx="28" cy="18" rx="2.5" ry="1.5" fill="#FFB6C1" opacity="0.4"/>`),
].join('\n'));

// ── 写入文件 ──
let count = 0;
for (const [name, svg] of Object.entries(characters)) {
  const filePath = path.join(outDir, name + '.svg');
  fs.writeFileSync(filePath, svg.trim(), 'utf8');
  console.log('Created: ' + name + '.svg');
  count++;
}
console.log('\nDone! Generated ' + count + ' character SVGs in assets/img/characters/');
