/**
 * SVG Building Asset Generator
 * Generates pixel-art style SVG building images for the town world
 */
const fs = require('fs');
const path = require('path');
const projectRoot = path.join(__dirname, '..');
const dir = path.join(projectRoot, 'assets', 'img', 'buildings');

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const buildings = {};

buildings.town_hall = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<rect x="8" y="88" width="112" height="32" rx="4" fill="#5D4037"/>',
  '<rect x="12" y="90" width="104" height="28" rx="3" fill="#795548"/>',
  '<rect x="20" y="44" width="88" height="48" fill="#8D6E63"/>',
  '<rect x="24" y="48" width="80" height="40" fill="#A1887F"/>',
  '<polygon points="10,48 64,16 118,48" fill="#C62828"/>',
  '<polygon points="14,48 64,20 114,48" fill="#E53935"/>',
  '<rect x="56" y="14" width="16" height="6" rx="2" fill="#F5C518"/>',
  '<line x1="10" y1="48" x2="6" y2="52" stroke="#C62828" stroke-width="3"/>',
  '<line x1="118" y1="48" x2="122" y2="52" stroke="#C62828" stroke-width="3"/>',
  '<rect x="50" y="62" width="28" height="30" rx="2" fill="#4E342E"/>',
  '<rect x="52" y="64" width="11" height="26" fill="#3E2723"/>',
  '<rect x="65" y="64" width="11" height="26" fill="#3E2723"/>',
  '<circle cx="63" cy="78" r="2" fill="#F5C518"/>',
  '<rect x="30" y="58" width="14" height="14" rx="1" fill="#4E342E"/>',
  '<rect x="84" y="58" width="14" height="14" rx="1" fill="#4E342E"/>',
  '<circle cx="64" cy="36" r="4" fill="#F5C518"/>',
  '<rect x="30" y="44" width="8" height="4" fill="#F5C518"/>',
  '<rect x="90" y="44" width="8" height="4" fill="#F5C518"/>',
  '<rect x="24" y="48" width="6" height="44" fill="#D7CCC8"/>',
  '<rect x="98" y="48" width="6" height="44" fill="#D7CCC8"/>',
  '<rect x="42" y="92" width="44" height="6" fill="#BCAAA4"/>',
  '<rect x="46" y="98" width="36" height="6" fill="#D7CCC8"/>',
  '</svg>'
].join('\n');

buildings.lumber_camp = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<ellipse cx="64" cy="108" rx="52" ry="14" fill="#5D4037"/>',
  '<rect x="14" y="76" width="18" height="10" rx="5" fill="#8B6914" transform="rotate(-5,23,81)"/>',
  '<rect x="10" y="84" width="20" height="10" rx="5" fill="#A38040"/>',
  '<rect x="12" y="92" width="22" height="10" rx="5" fill="#6B4F12"/>',
  '<rect x="38" y="62" width="52" height="40" fill="#A38040"/>',
  '<rect x="42" y="66" width="44" height="34" fill="#BFA76A"/>',
  '<polygon points="32,66 64,36 96,66" fill="#8B6914"/>',
  '<polygon points="36,66 64,40 92,66" fill="#A38040"/>',
  '<rect x="54" y="74" width="20" height="28" rx="2" fill="#5D4037"/>',
  '<line x1="98" y1="58" x2="108" y2="88" stroke="#795548" stroke-width="3"/>',
  '<path d="M104,56 L112,62 L106,68 Z" fill="#9E9E9E"/>',
  '<ellipse cx="106" cy="94" rx="10" ry="6" fill="#6B4F12"/>',
  '<ellipse cx="106" cy="92" rx="10" ry="5" fill="#8B6914"/>',
  '</svg>'
].join('\n');

buildings.quarry = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<ellipse cx="64" cy="100" rx="56" ry="20" fill="#616161"/>',
  '<ellipse cx="64" cy="96" rx="52" ry="18" fill="#757575"/>',
  '<rect x="16" y="68" width="24" height="20" fill="#9E9E9E"/>',
  '<rect x="18" y="70" width="20" height="16" fill="#BDBDBD"/>',
  '<rect x="44" y="74" width="18" height="16" fill="#9E9E9E"/>',
  '<rect x="46" y="76" width="14" height="12" fill="#B0BEC5"/>',
  '<rect x="78" y="30" width="4" height="62" fill="#795548"/>',
  '<line x1="80" y1="30" x2="104" y2="30" stroke="#795548" stroke-width="3"/>',
  '<line x1="104" y1="30" x2="104" y2="54" stroke="#666" stroke-width="1.5"/>',
  '<rect x="96" y="54" width="16" height="12" fill="#9E9E9E"/>',
  '<line x1="80" y1="44" x2="96" y2="30" stroke="#795548" stroke-width="2"/>',
  '<rect x="14" y="44" width="28" height="24" fill="#A38040"/>',
  '<polygon points="10,44 28,28 46,44" fill="#8B6914"/>',
  '<rect x="22" y="52" width="12" height="16" fill="#5D4037"/>',
  '<circle cx="70" cy="86" r="6" fill="#BDBDBD"/>',
  '<circle cx="86" cy="82" r="4" fill="#9E9E9E"/>',
  '</svg>'
].join('\n');

buildings.iron_mine = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<rect x="8" y="100" width="112" height="20" fill="#5D4037"/>',
  '<polygon points="20,100 64,24 108,100" fill="#616161"/>',
  '<polygon points="28,100 64,32 100,100" fill="#757575"/>',
  '<path d="M44,100 Q44,68 64,66 Q84,68 84,100 Z" fill="#263238"/>',
  '<path d="M48,100 Q48,72 64,70 Q80,72 80,100 Z" fill="#1a1a2e"/>',
  '<rect x="54" y="102" width="20" height="10" rx="2" fill="#78909C"/>',
  '<rect x="56" y="98" width="16" height="6" fill="#607D8B"/>',
  '<circle cx="62" cy="98" r="3" fill="#37474F"/>',
  '<circle cx="68" cy="97" r="2.5" fill="#455A64"/>',
  '<rect x="46" y="68" width="4" height="32" fill="#6D4C41"/>',
  '<rect x="78" y="68" width="4" height="32" fill="#6D4C41"/>',
  '<rect x="46" y="68" width="36" height="4" fill="#795548"/>',
  '<rect x="62" y="72" width="4" height="6" fill="#F5C518"/>',
  '<circle cx="64" cy="76" r="4" fill="#FFF176" opacity="0.4"/>',
  '<circle cx="36" cy="72" r="3" fill="#455A64"/>',
  '<circle cx="88" cy="68" r="2.5" fill="#546E7A"/>',
  '</svg>'
].join('\n');

buildings.farmland = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<rect x="8" y="24" width="112" height="88" rx="4" fill="#5D4037"/>',
  '<rect x="12" y="28" width="104" height="80" rx="3" fill="#6D4C41"/>',
  '<rect x="16" y="32" width="96" height="10" fill="#33691E"/>',
  '<rect x="16" y="46" width="96" height="10" fill="#388E3C"/>',
  '<rect x="16" y="60" width="96" height="10" fill="#33691E"/>',
  '<rect x="16" y="74" width="96" height="10" fill="#388E3C"/>',
  '<rect x="16" y="88" width="96" height="10" fill="#33691E"/>',
  '<g fill="#4CAF50">',
  '<circle cx="24" cy="37" r="3"/><circle cx="56" cy="37" r="3"/><circle cx="88" cy="37" r="3"/>',
  '<circle cx="40" cy="51" r="3"/><circle cx="72" cy="51" r="3"/><circle cx="104" cy="51" r="3"/>',
  '<circle cx="24" cy="65" r="3"/><circle cx="56" cy="65" r="3"/><circle cx="88" cy="65" r="3"/>',
  '<circle cx="40" cy="79" r="3"/><circle cx="72" cy="79" r="3"/><circle cx="104" cy="79" r="3"/>',
  '<circle cx="24" cy="93" r="3"/><circle cx="56" cy="93" r="3"/><circle cx="88" cy="93" r="3"/>',
  '</g>',
  '<rect x="8" y="108" width="112" height="8" rx="2" fill="#1565C0" opacity="0.6"/>',
  '<line x1="100" y1="18" x2="100" y2="38" stroke="#795548" stroke-width="2"/>',
  '<line x1="90" y1="26" x2="110" y2="26" stroke="#795548" stroke-width="2"/>',
  '<circle cx="100" cy="16" r="4" fill="#FFCC80"/>',
  '</svg>'
].join('\n');

buildings.barracks = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<rect x="8" y="86" width="112" height="34" rx="4" fill="#5D4037"/>',
  '<rect x="16" y="46" width="96" height="44" fill="#8D6E63"/>',
  '<rect x="20" y="50" width="88" height="38" fill="#A1887F"/>',
  '<polygon points="8,50 64,22 120,50" fill="#B71C1C"/>',
  '<polygon points="14,50 64,26 114,50" fill="#D32F2F"/>',
  '<rect x="56" y="8" width="4" height="18" fill="#795548"/>',
  '<rect x="60" y="8" width="16" height="12" fill="#F44336"/>',
  '<text x="68" y="17" text-anchor="middle" font-size="8" fill="#FFF" font-weight="bold" font-family="sans-serif">兵</text>',
  '<rect x="48" y="62" width="32" height="28" rx="2" fill="#4E342E"/>',
  '<rect x="48" y="62" width="32" height="4" fill="#F44336"/>',
  '<line x1="24" y1="56" x2="24" y2="84" stroke="#795548" stroke-width="2"/>',
  '<line x1="36" y1="56" x2="36" y2="84" stroke="#795548" stroke-width="2"/>',
  '<line x1="22" y1="62" x2="38" y2="62" stroke="#9E9E9E" stroke-width="1.5"/>',
  '<line x1="22" y1="72" x2="38" y2="72" stroke="#9E9E9E" stroke-width="1.5"/>',
  '<line x1="26" y1="56" x2="26" y2="70" stroke="#B0BEC5" stroke-width="1.5"/>',
  '<line x1="30" y1="56" x2="30" y2="70" stroke="#B0BEC5" stroke-width="1.5"/>',
  '<line x1="34" y1="56" x2="34" y2="70" stroke="#B0BEC5" stroke-width="1.5"/>',
  '<circle cx="100" cy="68" r="10" fill="#E53935"/>',
  '<circle cx="100" cy="68" r="7" fill="#C62828"/>',
  '<circle cx="100" cy="68" r="3" fill="#F5C518"/>',
  '</svg>'
].join('\n');

buildings.training_ground = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<ellipse cx="64" cy="80" rx="56" ry="32" fill="#8D6E63"/>',
  '<ellipse cx="64" cy="78" rx="52" ry="28" fill="#A1887F"/>',
  '<ellipse cx="64" cy="76" rx="48" ry="24" fill="#D7CCC8"/>',
  '<line x1="42" y1="46" x2="42" y2="80" stroke="#795548" stroke-width="3"/>',
  '<line x1="32" y1="58" x2="52" y2="58" stroke="#795548" stroke-width="3"/>',
  '<circle cx="42" cy="42" r="6" fill="#FFCC80"/>',
  '<circle cx="42" cy="42" r="6" stroke="#795548" stroke-width="1.5" fill="none"/>',
  '<circle cx="90" cy="56" r="14" fill="#FFF"/>',
  '<circle cx="90" cy="56" r="10" fill="#F44336"/>',
  '<circle cx="90" cy="56" r="6" fill="#FFF"/>',
  '<circle cx="90" cy="56" r="3" fill="#F44336"/>',
  '<line x1="82" y1="54" x2="92" y2="56" stroke="#795548" stroke-width="2"/>',
  '<rect x="12" y="64" width="4" height="24" fill="#6D4C41"/>',
  '<rect x="112" y="64" width="4" height="24" fill="#6D4C41"/>',
  '<line x1="64" y1="20" x2="64" y2="48" stroke="#795548" stroke-width="2"/>',
  '<polygon points="64,20 82,26 64,32" fill="#F5C518"/>',
  '</svg>'
].join('\n');

buildings.blacksmith = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<rect x="10" y="86" width="108" height="32" rx="4" fill="#5D4037"/>',
  '<rect x="18" y="48" width="72" height="42" fill="#8D6E63"/>',
  '<rect x="22" y="52" width="64" height="36" fill="#A1887F"/>',
  '<polygon points="12,52 54,26 96,52" fill="#6D4C41"/>',
  '<polygon points="16,52 54,30 92,52" fill="#8D6E63"/>',
  '<rect x="76" y="20" width="14" height="32" fill="#757575"/>',
  '<rect x="74" y="18" width="18" height="6" fill="#9E9E9E"/>',
  '<circle cx="83" cy="14" r="4" fill="#BDBDBD" opacity="0.5"/>',
  '<circle cx="80" cy="8" r="3" fill="#BDBDBD" opacity="0.3"/>',
  '<circle cx="86" cy="4" r="2.5" fill="#BDBDBD" opacity="0.2"/>',
  '<rect x="26" y="58" width="30" height="30" fill="#4E342E"/>',
  '<rect x="30" y="72" width="22" height="16" fill="#E65100"/>',
  '<rect x="34" y="68" width="14" height="6" fill="#FF6D00"/>',
  '<rect x="38" y="64" width="6" height="6" fill="#FFAB00"/>',
  '<rect x="96" y="74" width="22" height="6" fill="#455A64"/>',
  '<rect x="102" y="68" width="10" height="8" fill="#546E7A"/>',
  '<rect x="100" y="80" width="6" height="8" fill="#37474F"/>',
  '<rect x="112" y="80" width="6" height="8" fill="#37474F"/>',
  '<line x1="106" y1="58" x2="112" y2="68" stroke="#795548" stroke-width="2"/>',
  '<rect x="108" y="54" width="8" height="6" rx="1" fill="#78909C"/>',
  '<circle cx="108" cy="66" r="1.5" fill="#FFAB00"/>',
  '<circle cx="114" cy="62" r="1" fill="#FF6D00"/>',
  '</svg>'
].join('\n');

buildings.city_wall = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<rect x="4" y="52" width="120" height="68" fill="#757575"/>',
  '<rect x="8" y="56" width="112" height="60" fill="#9E9E9E"/>',
  '<line x1="8" y1="76" x2="120" y2="76" stroke="#757575" stroke-width="1"/>',
  '<line x1="8" y1="96" x2="120" y2="96" stroke="#757575" stroke-width="1"/>',
  '<line x1="36" y1="56" x2="36" y2="76" stroke="#757575" stroke-width="0.5"/>',
  '<line x1="64" y1="56" x2="64" y2="76" stroke="#757575" stroke-width="0.5"/>',
  '<line x1="92" y1="56" x2="92" y2="76" stroke="#757575" stroke-width="0.5"/>',
  '<rect x="4" y="40" width="18" height="16" fill="#BDBDBD"/>',
  '<rect x="28" y="40" width="18" height="16" fill="#BDBDBD"/>',
  '<rect x="54" y="40" width="18" height="16" fill="#BDBDBD"/>',
  '<rect x="80" y="40" width="18" height="16" fill="#BDBDBD"/>',
  '<rect x="106" y="40" width="18" height="16" fill="#BDBDBD"/>',
  '<rect x="44" y="14" width="40" height="42" fill="#BDBDBD"/>',
  '<rect x="48" y="18" width="32" height="36" fill="#E0E0E0"/>',
  '<polygon points="40,18 64,2 88,18" fill="#C62828"/>',
  '<polygon points="44,18 64,6 84,18" fill="#E53935"/>',
  '<rect x="56" y="26" width="16" height="18" rx="8" fill="#455A64"/>',
  '<line x1="64" y1="2" x2="64" y2="-6" stroke="#795548" stroke-width="2"/>',
  '<polygon points="64,-6 78,-2 64,2" fill="#F44336"/>',
  '<rect x="48" y="80" width="32" height="36" rx="16" fill="#4E342E"/>',
  '<rect x="48" y="96" width="32" height="20" fill="#4E342E"/>',
  '</svg>'
].join('\n');

buildings.adventure_guild = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<rect x="10" y="84" width="108" height="36" rx="4" fill="#5D4037"/>',
  '<rect x="18" y="44" width="92" height="44" fill="#6D4C41"/>',
  '<rect x="22" y="48" width="84" height="38" fill="#8D6E63"/>',
  '<polygon points="10,48 64,14 118,48" fill="#33691E"/>',
  '<polygon points="16,48 64,18 112,48" fill="#4CAF50"/>',
  '<rect x="40" y="22" width="48" height="16" rx="2" fill="#A38040"/>',
  '<rect x="42" y="24" width="44" height="12" rx="1" fill="#8B6914"/>',
  '<text x="64" y="34" text-anchor="middle" font-size="9" fill="#FFF" font-weight="bold" font-family="sans-serif">公会</text>',
  '<rect x="48" y="60" width="32" height="28" rx="2" fill="#4E342E"/>',
  '<rect x="50" y="62" width="13" height="24" fill="#3E2723"/>',
  '<rect x="65" y="62" width="13" height="24" fill="#3E2723"/>',
  '<circle cx="30" cy="62" r="8" fill="#A38040"/>',
  '<circle cx="30" cy="62" r="6" fill="#BFA76A"/>',
  '<line x1="30" y1="56" x2="30" y2="68" stroke="#E53935" stroke-width="1"/>',
  '<line x1="24" y1="62" x2="36" y2="62" stroke="#333" stroke-width="1"/>',
  '<line x1="96" y1="52" x2="96" y2="76" stroke="#B0BEC5" stroke-width="2"/>',
  '<line x1="92" y1="54" x2="100" y2="54" stroke="#F5C518" stroke-width="2"/>',
  '<rect x="106" y="56" width="3" height="18" fill="#795548"/>',
  '<circle cx="107" cy="54" r="4" fill="#FF6D00"/>',
  '<circle cx="107" cy="52" r="2.5" fill="#FFAB00"/>',
  '</svg>'
].join('\n');

buildings.tavern = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<rect x="10" y="86" width="108" height="34" rx="4" fill="#5D4037"/>',
  '<rect x="16" y="42" width="96" height="48" fill="#A1887F"/>',
  '<rect x="20" y="46" width="88" height="42" fill="#BCAAA4"/>',
  '<polygon points="8,46 64,18 120,46" fill="#6D4C41"/>',
  '<polygon points="14,46 64,22 114,46" fill="#8D6E63"/>',
  '<rect x="84" y="28" width="3" height="12" fill="#5D4037"/>',
  '<rect x="74" y="38" width="24" height="16" rx="2" fill="#A38040"/>',
  '<text x="86" y="49" text-anchor="middle" font-size="9" fill="#FFF" font-weight="bold" font-family="sans-serif">酒</text>',
  '<rect x="46" y="58" width="36" height="32" rx="2" fill="#5D4037"/>',
  '<rect x="48" y="60" width="15" height="28" fill="#4E342E"/>',
  '<rect x="65" y="60" width="15" height="28" fill="#4E342E"/>',
  '<circle cx="63" cy="76" r="2" fill="#F5C518"/>',
  '<rect x="24" y="56" width="16" height="14" rx="1" fill="#FF8F00" opacity="0.8"/>',
  '<line x1="32" y1="56" x2="32" y2="70" stroke="#6D4C41" stroke-width="1.5"/>',
  '<rect x="88" y="56" width="16" height="14" rx="1" fill="#FF8F00" opacity="0.8"/>',
  '<line x1="96" y1="56" x2="96" y2="70" stroke="#6D4C41" stroke-width="1.5"/>',
  '<ellipse cx="116" cy="84" rx="8" ry="5" fill="#8B6914"/>',
  '<rect x="108" y="74" width="16" height="10" fill="#A38040"/>',
  '<ellipse cx="116" cy="74" rx="8" ry="5" fill="#BFA76A"/>',
  '</svg>'
].join('\n');

buildings.warehouse = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<rect x="6" y="88" width="116" height="32" rx="4" fill="#5D4037"/>',
  '<rect x="12" y="44" width="104" height="48" fill="#8D6E63"/>',
  '<rect x="16" y="48" width="96" height="42" fill="#A1887F"/>',
  '<polygon points="4,48 64,22 124,48" fill="#6D4C41"/>',
  '<polygon points="10,48 64,26 118,48" fill="#8D6E63"/>',
  '<rect x="36" y="56" width="56" height="36" rx="2" fill="#5D4037"/>',
  '<rect x="38" y="58" width="25" height="32" fill="#4E342E"/>',
  '<rect x="65" y="58" width="25" height="32" fill="#4E342E"/>',
  '<rect x="36" y="56" width="56" height="4" fill="#795548"/>',
  '<circle cx="54" cy="76" r="2" fill="#9E9E9E"/>',
  '<circle cx="74" cy="76" r="2" fill="#9E9E9E"/>',
  '<rect x="98" y="72" width="14" height="12" fill="#BFA76A"/>',
  '<rect x="100" y="64" width="10" height="10" fill="#A38040"/>',
  '<rect x="8" y="76" width="12" height="10" fill="#8B6914"/>',
  '<rect x="10" y="68" width="10" height="10" fill="#A38040"/>',
  '</svg>'
].join('\n');

buildings.market = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
  '<rect x="4" y="88" width="120" height="32" rx="4" fill="#8D6E63"/>',
  '<rect x="8" y="52" width="50" height="40" fill="#A38040"/>',
  '<rect x="12" y="56" width="42" height="34" fill="#BFA76A"/>',
  '<polygon points="4,52 33,30 62,52" fill="#E53935"/>',
  '<rect x="4" y="48" width="58" height="6" fill="#C62828"/>',
  '<circle cx="20" cy="72" r="4" fill="#F5C518"/>',
  '<circle cx="32" cy="74" r="3" fill="#FF8F00"/>',
  '<circle cx="44" cy="72" r="4" fill="#F5C518"/>',
  '<rect x="70" y="52" width="50" height="40" fill="#A38040"/>',
  '<rect x="74" y="56" width="42" height="34" fill="#BFA76A"/>',
  '<polygon points="66,52 95,30 124,52" fill="#1565C0"/>',
  '<rect x="66" y="48" width="58" height="6" fill="#0D47A1"/>',
  '<rect x="78" y="68" width="10" height="14" fill="#78909C"/>',
  '<rect x="92" y="72" width="8" height="10" fill="#9E9E9E"/>',
  '<rect x="104" y="70" width="8" height="12" fill="#B0BEC5"/>',
  '<rect x="6" y="30" width="3" height="62" fill="#795548"/>',
  '<rect x="60" y="30" width="3" height="62" fill="#795548"/>',
  '<rect x="122" y="30" width="3" height="62" fill="#795548"/>',
  '<rect x="44" y="24" width="40" height="14" rx="2" fill="#A38040"/>',
  '<text x="64" y="34" text-anchor="middle" font-size="9" fill="#FFF" font-weight="bold" font-family="sans-serif">集市</text>',
  '</svg>'
].join('\n');

// Write all building SVGs
for (const [id, svg] of Object.entries(buildings)) {
  fs.writeFileSync(path.join(dir, id + '.svg'), svg);
  console.log('✅ ' + id + '.svg');
}

// --- Terrain SVGs ---
const terrainDir = path.join(projectRoot, 'assets', 'img', 'terrain');
if (!fs.existsSync(terrainDir)) fs.mkdirSync(terrainDir, { recursive: true });

const terrains = {};

terrains.grass = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
  '<rect width="48" height="48" fill="#4a7c3f"/>',
  '<circle cx="8" cy="12" r="2" fill="#5a8c4f" opacity="0.5"/>',
  '<circle cx="32" cy="8" r="1.5" fill="#3d6b32" opacity="0.5"/>',
  '<circle cx="20" cy="36" r="2" fill="#5a8c4f" opacity="0.4"/>',
  '<circle cx="40" cy="28" r="1" fill="#3d6b32" opacity="0.4"/>',
  '<circle cx="12" cy="42" r="1.5" fill="#5a8c4f" opacity="0.3"/>',
  '</svg>'
].join('\n');

terrains.tree = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64">',
  '<rect x="20" y="40" width="8" height="20" fill="#6D4C41"/>',
  '<circle cx="24" cy="28" r="18" fill="#2E7D32"/>',
  '<circle cx="16" cy="22" r="12" fill="#388E3C"/>',
  '<circle cx="32" cy="24" r="10" fill="#43A047"/>',
  '<circle cx="24" cy="16" r="8" fill="#4CAF50"/>',
  '</svg>'
].join('\n');

terrains.rock = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 24">',
  '<ellipse cx="16" cy="18" rx="14" ry="6" fill="#616161"/>',
  '<ellipse cx="16" cy="14" rx="12" ry="8" fill="#757575"/>',
  '<ellipse cx="14" cy="12" rx="8" ry="6" fill="#9E9E9E"/>',
  '</svg>'
].join('\n');

terrains.bush = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 24">',
  '<ellipse cx="16" cy="18" rx="14" ry="6" fill="#2E7D32"/>',
  '<circle cx="10" cy="14" r="7" fill="#388E3C"/>',
  '<circle cx="22" cy="14" r="7" fill="#388E3C"/>',
  '<circle cx="16" cy="10" r="6" fill="#4CAF50"/>',
  '</svg>'
].join('\n');

terrains.flower = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 20">',
  '<line x1="8" y1="10" x2="8" y2="20" stroke="#388E3C" stroke-width="2"/>',
  '<circle cx="8" cy="8" r="4" fill="#E91E63"/>',
  '<circle cx="8" cy="8" r="2" fill="#FFC107"/>',
  '<circle cx="4" cy="12" r="2" fill="#4CAF50"/>',
  '<circle cx="12" cy="12" r="2" fill="#4CAF50"/>',
  '</svg>'
].join('\n');

terrains.water = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
  '<rect width="48" height="48" fill="#1565C0"/>',
  '<path d="M0,16 Q12,12 24,16 T48,16" fill="none" stroke="#1E88E5" stroke-width="2" opacity="0.6"/>',
  '<path d="M0,32 Q12,28 24,32 T48,32" fill="none" stroke="#1E88E5" stroke-width="2" opacity="0.4"/>',
  '</svg>'
].join('\n');

terrains.path_tile = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
  '<rect width="48" height="48" fill="#8D6E63"/>',
  '<rect x="2" y="2" width="20" height="20" rx="2" fill="#A1887F" opacity="0.5"/>',
  '<rect x="26" y="26" width="20" height="20" rx="2" fill="#A1887F" opacity="0.3"/>',
  '</svg>'
].join('\n');

for (const [id, svg] of Object.entries(terrains)) {
  fs.writeFileSync(path.join(terrainDir, id + '.svg'), svg);
  console.log('✅ terrain/' + id + '.svg');
}

console.log('\nAll assets generated!');
