/**
 * 神话套装数据 + 神话装备模板
 * Quality 6 = 红·神话 (Mythic)
 */

// ── 12 件神话装备模板 ──
var MythicEquipmentData = [
  // === 霸王战魂 (set_overlord) ===
  {
    id: 'equip_mythic_tyrant_halberd',
    name: '天龙破城戟',
    type: 'weapon',
    quality: 6,
    statType: 'atk',
    statRange: [75, 90],
    setId: 'set_overlord',
    description: '百人辟易，据说能劈开城门',
    emoji: '🔥',
    unsellable: true
  },
  {
    id: 'equip_mythic_tyrant_armor',
    name: '乌金重铠',
    type: 'armor',
    quality: 6,
    statType: 'def',
    statRange: [75, 90],
    setId: 'set_overlord',
    description: '以天外陨铁与乌金锻成，重逾百斤',
    emoji: '🛡️',
    unsellable: true
  },
  {
    id: 'equip_mythic_tyrant_pendant',
    name: '虞姬泪珠链',
    type: 'accessory',
    quality: 6,
    statType: 'hp',
    statRange: [380, 500],
    setId: 'set_overlord',
    description: '虞姬最后泪珠凝为宝石，佩戴者生命力大增',
    emoji: '💎',
    unsellable: true
  },
  {
    id: 'equip_mythic_tyrant_horse',
    name: '乌骓·真品',
    type: 'mount',
    quality: 6,
    statType: 'spd',
    statRange: [42, 55],
    setId: 'set_overlord',
    description: '认主不认路，日行千里但只走直线',
    emoji: '🐎',
    unsellable: true
  },

  // === 卧龙星辰 (set_dragon) ===
  {
    id: 'equip_mythic_dragon_sword',
    name: '七星龙渊剑',
    type: 'weapon',
    quality: 6,
    statType: 'atk',
    statRange: [70, 85],
    setId: 'set_dragon',
    description: '剑身嵌七颗陨石，出鞘时如龙吟',
    emoji: '⚔️',
    unsellable: true
  },
  {
    id: 'equip_mythic_dragon_robe',
    name: '八卦仙袍',
    type: 'armor',
    quality: 6,
    statType: 'def',
    statRange: [70, 85],
    setId: 'set_dragon',
    description: '以八卦阵纹编织，穿着者自动规避飞矢',
    emoji: '🧥',
    unsellable: true
  },
  {
    id: 'equip_mythic_dragon_orb',
    name: '孔明灯·永夜版',
    type: 'accessory',
    quality: 6,
    statType: 'hp',
    statRange: [350, 480],
    setId: 'set_dragon',
    description: '悬浮肩头永不熄灭，垂危时自动释放治疗',
    emoji: '🏮',
    unsellable: true
  },
  {
    id: 'equip_mythic_dragon_cart',
    name: '四轮战车·涡轮版',
    type: 'mount',
    quality: 6,
    statType: 'spd',
    statRange: [40, 52],
    setId: 'set_dragon',
    description: '诸葛亮亲设，加装机关涡轮，刹车研发中',
    emoji: '🛞',
    unsellable: true
  },

  // === 天命皇权 (set_emperor) ===
  {
    id: 'equip_mythic_emperor_sword',
    name: '倚天剑·正版',
    type: 'weapon',
    quality: 6,
    statType: 'atk',
    statRange: [72, 88],
    setId: 'set_emperor',
    description: '剑身刻"天子"二字，拔出时自带BGM',
    emoji: '🗡️',
    unsellable: true
  },
  {
    id: 'equip_mythic_emperor_armor',
    name: '玄武帝铠',
    type: 'armor',
    quality: 6,
    statType: 'def',
    statRange: [78, 90],
    setId: 'set_emperor',
    description: '以玄武神兽之鳞为蓝本锻造，防御冠绝天下',
    emoji: '🐢',
    unsellable: true
  },
  {
    id: 'equip_mythic_emperor_seal',
    name: '传国玉玺·正品',
    type: 'accessory',
    quality: 6,
    statType: 'hp',
    statRange: [400, 500],
    setId: 'set_emperor',
    description: '"受命于天，既寿永昌"，这次是真的',
    emoji: '📜',
    unsellable: true
  },
  {
    id: 'equip_mythic_emperor_horse',
    name: '绝影·纯血统',
    type: 'mount',
    quality: 6,
    statType: 'spd',
    statRange: [45, 55],
    setId: 'set_emperor',
    description: '绝尘而去不见其影，是赤兔唯一承认的对手',
    emoji: '🐴',
    unsellable: true
  }
];

// ── 套装效果定义 ──
var EquipmentSets = {
  set_overlord: {
    id: 'set_overlord',
    name: '霸王战魂',
    lore: '力拔山兮气盖世，时不利兮骓不逝。',
    theme: '#ff4444',
    pieces: [
      'equip_mythic_tyrant_halberd',
      'equip_mythic_tyrant_armor',
      'equip_mythic_tyrant_pendant',
      'equip_mythic_tyrant_horse'
    ],
    bonuses: {
      2: {
        name: '霸王之怒',
        description: 'ATK +15%, 暴击率 +5%',
        effects: { atkPercent: 0.15, critRate: 0.05 }
      },
      4: {
        name: '破釜沉舟',
        description: '普攻 20% 概率双倍伤害; ATK 额外+25%',
        effects: { atkPercent: 0.25, doubleDamageChance: 0.20 }
      }
    }
  },

  set_dragon: {
    id: 'set_dragon',
    name: '卧龙星辰',
    lore: '非淡泊无以明志，非宁静无以致远。',
    theme: '#4488ff',
    pieces: [
      'equip_mythic_dragon_sword',
      'equip_mythic_dragon_robe',
      'equip_mythic_dragon_orb',
      'equip_mythic_dragon_cart'
    ],
    bonuses: {
      2: {
        name: '八阵图',
        description: '技能伤害 +20%, 技能冷却 -1 回合',
        effects: { skillDamagePercent: 0.20, skillCdReduction: 1 }
      },
      4: {
        name: '天命星辰',
        description: '每 3 回合全体回复 10% HP; 全属性+10%',
        effects: { healAllInterval: 3, healAllPercent: 0.10, allStatsPercent: 0.10 }
      }
    }
  },

  set_emperor: {
    id: 'set_emperor',
    name: '天命皇权',
    lore: '宁教我负天下人，休教天下人负我。',
    theme: '#ffaa00',
    pieces: [
      'equip_mythic_emperor_sword',
      'equip_mythic_emperor_armor',
      'equip_mythic_emperor_seal',
      'equip_mythic_emperor_horse'
    ],
    bonuses: {
      2: {
        name: '帝王之盾',
        description: 'DEF +20%, HP +15%',
        effects: { defPercent: 0.20, hpPercent: 0.15 }
      },
      4: {
        name: '天命不灭',
        description: '致命伤 30% 免疫(每战1次); 全队 DEF+15%',
        effects: { deathImmunityChance: 0.30, deathImmunityMax: 1, teamDefPercent: 0.15 }
      }
    }
  }
};

// ── 锻造图纸数据 ──
var BlueprintData = {
  blueprint_tyrant_halberd: {
    id: 'blueprint_tyrant_halberd',
    name: '天龙破城戟·图纸',
    equipId: 'equip_mythic_tyrant_halberd',
    setId: 'set_overlord',
    source: '深渊·虎牢关首通'
  },
  blueprint_dragon_cart: {
    id: 'blueprint_dragon_cart',
    name: '四轮战车·图纸',
    equipId: 'equip_mythic_dragon_cart',
    setId: 'set_dragon',
    source: '深渊·赤壁首通'
  },
  blueprint_emperor_armor: {
    id: 'blueprint_emperor_armor',
    name: '玄武帝铠·图纸',
    equipId: 'equip_mythic_emperor_armor',
    setId: 'set_emperor',
    source: '深渊·官渡首通'
  }
};

// ── 商人常驻商品（神话饰品）──
var MerchantPermanentStock = [
  {
    equipId: 'equip_mythic_tyrant_pendant',
    price: 500000,
    setId: 'set_overlord'
  },
  {
    equipId: 'equip_mythic_dragon_orb',
    price: 500000,
    setId: 'set_dragon'
  },
  {
    equipId: 'equip_mythic_emperor_seal',
    price: 600000,
    setId: 'set_emperor'
  }
];

/**
 * 获取英雄的套装激活信息
 * @param {Object} heroEquipment - { weapon: uid, armor: uid, ... }
 * @returns {Array} 激活的套装加成列表
 */
function getHeroSetBonuses(heroEquipment) {
  if (!heroEquipment) return [];

  var equipped = [];
  var slots = ['weapon', 'armor', 'accessory', 'mount'];
  for (var i = 0; i < slots.length; i++) {
    var uid = heroEquipment[slots[i]];
    if (!uid) continue;
    var equip = EquipmentManager.getEquipment(uid);
    if (equip && equip.setId) equipped.push(equip);
  }

  var setCounts = {};
  for (var j = 0; j < equipped.length; j++) {
    var sid = equipped[j].setId;
    setCounts[sid] = (setCounts[sid] || 0) + 1;
  }

  var bonuses = [];
  var setIds = Object.keys(setCounts);
  for (var k = 0; k < setIds.length; k++) {
    var setId = setIds[k];
    var count = setCounts[setId];
    var setDef = EquipmentSets[setId];
    if (!setDef) continue;
    if (count >= 2 && setDef.bonuses[2]) {
      bonuses.push({ setId: setId, count: 2, bonus: setDef.bonuses[2] });
    }
    if (count >= 4 && setDef.bonuses[4]) {
      bonuses.push({ setId: setId, count: 4, bonus: setDef.bonuses[4] });
    }
  }
  return bonuses;
}

/**
 * 查找神话装备模板
 */
function getMythicTemplate(equipId) {
  for (var i = 0; i < MythicEquipmentData.length; i++) {
    if (MythicEquipmentData[i].id === equipId) return MythicEquipmentData[i];
  }
  return null;
}
