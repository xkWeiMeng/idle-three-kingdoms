/**
 * 阵营共鸣 & 武将羁绊数据表
 *
 * 阵营共鸣：上阵同阵营武将达到阈值触发加成
 * 武将羁绊：特定武将组合上阵触发额外效果
 */

// ===== 阵营共鸣 =====
var FactionResonance = {
  // 3 同阵营武将上阵
  3: { atkPercent: 0.10, label: '阵营共鸣·初' },
  // 4 同阵营武将上阵
  4: { atkPercent: 0.15, defPercent: 0.10, label: '阵营共鸣·盛' },
  // 5 同阵营武将上阵（全队同阵营）
  5: { atkPercent: 0.25, defPercent: 0.15, hpPercent: 0.10, label: '阵营共鸣·极' }
};

var FactionNames = {
  shu: '蜀', wei: '魏', wu: '吴', qun: '群'
};

var FactionEmojis = {
  shu: '🟢', wei: '🔵', wu: '🔴', qun: '🟡'
};

// ===== 武将羁绊 =====
var HeroBonds = [
  {
    id: 'taoyuan',
    name: '桃园结义',
    icon: '🍑',
    heroIds: ['shu_liubei', 'shu_guanyu', 'shu_zhangfei'],
    minRequired: 3,
    effects: { hpPercent: 0.15, healPerRound: 0.02 },
    description: '刘关张三人同时上阵：全队生命+15%，每回合回复2%HP'
  },
  {
    id: 'wuhu',
    name: '五虎上将',
    icon: '🐅',
    heroIds: ['shu_guanyu', 'shu_zhangfei', 'shu_zhaoyun', 'shu_machao', 'shu_huangzhong'],
    minRequired: 3,
    effects: { atkPercent: 0.20 },
    description: '五虎上将中任意3人上阵：全队攻击+20%'
  },
  {
    id: 'wolong_fengchu',
    name: '卧龙凤雏',
    icon: '🐉',
    heroIds: ['shu_zhugeliang', 'shu_liubei'],
    minRequired: 2,
    effects: { atkPercent: 0.12, defPercent: 0.08 },
    description: '诸葛亮与刘备同时上阵：全队攻击+12%，防御+8%'
  },
  {
    id: 'meiren',
    name: '美人计',
    icon: '💃',
    heroIds: ['qun_diaochan', 'qun_lvbu'],
    minRequired: 2,
    effects: { enemyAtkReduce: 0.15 },
    description: '貂蝉与吕布同时上阵：敌方攻击-15%'
  },
  {
    id: 'wei_iron',
    name: '魏武精锐',
    icon: '⚔️',
    heroIds: ['wei_caocao', 'wei_xiahoudun', 'wei_dianwei', 'wei_zhangliao'],
    minRequired: 3,
    effects: { atkPercent: 0.15, defPercent: 0.10 },
    description: '曹操麾下任意3员猛将上阵：全队攻防各+15%/10%'
  },
  {
    id: 'wu_fire',
    name: '赤壁之焰',
    icon: '🔥',
    heroIds: ['wu_zhouyu', 'wu_sunquan', 'wu_sunshangxiang'],
    minRequired: 2,
    effects: { atkPercent: 0.12, spdPercent: 0.10 },
    description: '东吴君臣任意2人上阵：全队攻击+12%，速度+10%'
  },
  {
    id: 'tianxia',
    name: '天下无双',
    icon: '👑',
    heroIds: ['qun_lvbu'],
    minRequired: 1,
    effects: { atkPercent: 0.08, spdPercent: 0.05 },
    description: '吕布上阵：个人攻击+8%，速度+5%（仅限吕布）',
    selfOnly: true
  }
];

/**
 * 计算当前队伍的阵营共鸣和羁绊加成
 * @param {Array} teamHeroes - 上阵武将实例数组（需有 .id 属性）
 * @returns {Object} { factionBonus, activeBonds, allyBonuses, enemyDebuffs }
 */
function calculateTeamBonuses(teamHeroes) {
  var result = {
    factionBonus: null,
    factionName: '',
    activeBonds: [],
    // 累积的队伍加成
    atkPercent: 0,
    defPercent: 0,
    hpPercent: 0,
    spdPercent: 0,
    healPerRound: 0,
    // 敌方减益
    enemyAtkReduce: 0,
    // 个人加成（heroId → bonuses）
    selfBonuses: {}
  };

  if (!teamHeroes || teamHeroes.length === 0) return result;

  // 统计阵营
  var factionCount = {};
  var heroIdSet = {};
  for (var i = 0; i < teamHeroes.length; i++) {
    var hid = teamHeroes[i].id;
    heroIdSet[hid] = true;
    var template = HeroData.find(function (h) { return h.id === hid; });
    if (template && template.faction) {
      factionCount[template.faction] = (factionCount[template.faction] || 0) + 1;
    }
  }

  // 阵营共鸣：取最大满足的阵营
  var bestFaction = null;
  var bestCount = 0;
  for (var fac in factionCount) {
    if (factionCount[fac] > bestCount) {
      bestCount = factionCount[fac];
      bestFaction = fac;
    }
  }

  if (bestCount >= 3 && FactionResonance[bestCount]) {
    var resonance = FactionResonance[bestCount];
    result.factionBonus = resonance;
    result.factionName = (FactionEmojis[bestFaction] || '') + (FactionNames[bestFaction] || bestFaction);
    result.atkPercent += resonance.atkPercent || 0;
    result.defPercent += resonance.defPercent || 0;
    result.hpPercent += resonance.hpPercent || 0;
  }

  // 武将羁绊
  for (var b = 0; b < HeroBonds.length; b++) {
    var bond = HeroBonds[b];
    var matchCount = 0;
    var matchedIds = [];
    for (var h = 0; h < bond.heroIds.length; h++) {
      if (heroIdSet[bond.heroIds[h]]) {
        matchCount++;
        matchedIds.push(bond.heroIds[h]);
      }
    }
    if (matchCount >= bond.minRequired) {
      result.activeBonds.push({
        id: bond.id,
        name: bond.name,
        icon: bond.icon,
        description: bond.description,
        matched: matchCount,
        total: bond.heroIds.length
      });

      var eff = bond.effects;
      if (bond.selfOnly) {
        // 个人加成
        for (var si = 0; si < matchedIds.length; si++) {
          if (!result.selfBonuses[matchedIds[si]]) result.selfBonuses[matchedIds[si]] = {};
          var sb = result.selfBonuses[matchedIds[si]];
          sb.atkPercent = (sb.atkPercent || 0) + (eff.atkPercent || 0);
          sb.defPercent = (sb.defPercent || 0) + (eff.defPercent || 0);
          sb.spdPercent = (sb.spdPercent || 0) + (eff.spdPercent || 0);
        }
      } else {
        // 全队加成
        result.atkPercent += eff.atkPercent || 0;
        result.defPercent += eff.defPercent || 0;
        result.hpPercent += eff.hpPercent || 0;
        result.spdPercent += eff.spdPercent || 0;
        result.healPerRound += eff.healPerRound || 0;
        result.enemyAtkReduce += eff.enemyAtkReduce || 0;
      }
    }
  }

  return result;
}
