/**
 * 装备词缀系统
 * Q3+ 装备掉落时随机附带词缀，提供额外属性和战斗效果
 *
 * 词缀分两类：
 *   stat  — 直接加成属性（在 getHeroStats 中生效）
 *   combat — 战斗中触发特殊效果（在 BattleManager 中生效）
 *
 * 词缀数量规则：
 *   Q3 稀有   → 1 条词缀
 *   Q4 史诗   → 1-2 条词缀
 *   Q5 传说   → 2-3 条词缀
 */

var EquipAffixPool = [
  // ===== 属性类词缀 (stat) =====
  { id: 'flat_atk',   name: '锋锐',   icon: '⚔️', type: 'stat', stat: 'atk', mode: 'flat',
    range: { 3: [3, 6], 4: [5, 10], 5: [8, 15] }, desc: '攻击+{v}' },
  { id: 'flat_def',   name: '坚韧',   icon: '🛡️', type: 'stat', stat: 'def', mode: 'flat',
    range: { 3: [3, 6], 4: [5, 10], 5: [8, 15] }, desc: '防御+{v}' },
  { id: 'flat_hp',    name: '强壮',   icon: '❤️', type: 'stat', stat: 'hp', mode: 'flat',
    range: { 3: [20, 40], 4: [35, 70], 5: [60, 120] }, desc: '生命+{v}' },
  { id: 'flat_spd',   name: '迅捷',   icon: '💨', type: 'stat', stat: 'spd', mode: 'flat',
    range: { 3: [1, 3], 4: [2, 5], 5: [4, 8] }, desc: '速度+{v}' },
  { id: 'pct_atk',    name: '猛攻',   icon: '🔥', type: 'stat', stat: 'atk', mode: 'percent',
    range: { 3: [3, 6], 4: [5, 10], 5: [8, 15] }, desc: '攻击+{v}%' },
  { id: 'pct_def',    name: '铁壁',   icon: '🏰', type: 'stat', stat: 'def', mode: 'percent',
    range: { 3: [3, 6], 4: [5, 10], 5: [8, 15] }, desc: '防御+{v}%' },
  { id: 'pct_hp',     name: '生机',   icon: '🌿', type: 'stat', stat: 'hp', mode: 'percent',
    range: { 3: [3, 6], 4: [5, 10], 5: [8, 15] }, desc: '生命+{v}%' },

  // ===== 战斗类词缀 (combat) =====
  { id: 'lifesteal',  name: '嗜血',   icon: '🩸', type: 'combat', effect: 'lifesteal',
    range: { 3: [3, 5], 4: [5, 8], 5: [8, 12] }, desc: '吸血{v}%' },
  { id: 'crit_rate',  name: '精准',   icon: '🎯', type: 'combat', effect: 'critRate',
    range: { 3: [3, 5], 4: [5, 8], 5: [8, 12] }, desc: '暴击率+{v}%' },
  { id: 'crit_dmg',   name: '致命',   icon: '💀', type: 'combat', effect: 'critDamage',
    range: { 3: [10, 15], 4: [15, 25], 5: [25, 40] }, desc: '暴击伤害+{v}%' },
  { id: 'thorns',     name: '荆棘',   icon: '🌵', type: 'combat', effect: 'thorns',
    range: { 3: [5, 8], 4: [8, 12], 5: [12, 18] }, desc: '反伤{v}%' },
  { id: 'dodge',      name: '灵闪',   icon: '🌀', type: 'combat', effect: 'dodge',
    range: { 3: [2, 4], 4: [4, 6], 5: [6, 10] }, desc: '闪避{v}%' },
  { id: 'heal_round', name: '回春',   icon: '💚', type: 'combat', effect: 'healPerRound',
    range: { 3: [1, 2], 4: [2, 3], 5: [3, 5] }, desc: '每回合回复{v}%HP' }
];

/**
 * 为装备滚词缀
 * @param {number} quality - 装备品质 (3/4/5)
 * @returns {Array} affixes - [{id, name, icon, type, value, desc, ...effectKey}]
 */
function rollEquipAffixes(quality) {
  if (quality < 3 || quality > 5) return [];

  // 词缀数量
  var count;
  if (quality === 3) count = 1;
  else if (quality === 4) count = Utils.randInt(1, 2);
  else count = Utils.randInt(2, 3);

  var pool = EquipAffixPool.slice();
  var affixes = [];
  var usedIds = {};

  for (var i = 0; i < count && pool.length > 0; i++) {
    var idx = Utils.randInt(0, pool.length - 1);
    var template = pool[idx];

    // 同一词缀不重复
    if (usedIds[template.id]) { i--; pool.splice(idx, 1); continue; }
    usedIds[template.id] = true;

    var r = template.range[quality];
    if (!r) continue;
    var value = Utils.randInt(r[0], r[1]);

    var affix = {
      id: template.id,
      name: template.name,
      icon: template.icon,
      type: template.type,
      value: value,
      desc: template.desc.replace('{v}', value)
    };

    if (template.type === 'stat') {
      affix.stat = template.stat;
      affix.mode = template.mode;
    } else {
      affix.effect = template.effect;
    }

    affixes.push(affix);
    pool.splice(idx, 1);
  }

  return affixes;
}

/**
 * 汇总装备词缀的战斗效果
 * @param {Array} equipList - 装备实例数组
 * @returns {Object} { lifesteal, critRate, critDamage, thorns, dodge, healPerRound }
 */
function aggregateCombatAffixes(equipList) {
  var result = { lifesteal: 0, critRate: 0, critDamage: 0, thorns: 0, dodge: 0, healPerRound: 0 };
  for (var i = 0; i < equipList.length; i++) {
    var eq = equipList[i];
    if (!eq || !eq.affixes) continue;
    for (var j = 0; j < eq.affixes.length; j++) {
      var a = eq.affixes[j];
      if (a.type === 'combat' && a.effect && result[a.effect] !== undefined) {
        result[a.effect] += a.value;
      }
    }
  }
  return result;
}
