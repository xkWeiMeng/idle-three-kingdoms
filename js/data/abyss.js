/**
 * 深渊副本数据
 * 3 个深渊：虎牢关、赤壁、官渡
 * 每个 5 层，Boss 为著名武将
 */
var AbyssData = {

  abyss_hulao: {
    id: 'abyss_hulao',
    name: '深渊·虎牢关',
    description: '十八路诸侯都不敢进的地方，你敢吗？',
    emoji: '⚔',
    bgGradient: ['#1a0505', '#3a0000'],
    particleColor: 'rgba(255,100,0,0.3)',
    bossFrameColor: '#ff2222',
    clearArt: 'assets/abyss/clear-hulao.png',
    clearArtAlt: '吕布镇守虎牢关的深渊通关像素贴图',
    unlockCondition: { stage: 'stage_4_10' },
    ticketCost: { jade: 30, gold: 5000, iron: 200 },
    cooldown: 0,
    floors: [
      {
        floor: 1,
        boss: {
          id: 'abyss_huaxiong', name: '华雄', element: 'metal',
          atk: 120, def: 60, hp: 2500, spd: 25,
          skill: { name: '斩将刀', type: 'damage', target: 'single', multiplier: 2.5, cooldown: 3 }
        },
        rewards: { gold: 2000, exp: 1000 },
        equipDrop: { 4: 0.20, 5: 0.05 }
      },
      {
        floor: 2,
        boss: {
          id: 'abyss_zhangliao_a', name: '张辽', element: 'metal',
          atk: 100, def: 80, hp: 3000, spd: 30,
          skill: { name: '威震逍遥津', type: 'damage', target: 'all', multiplier: 1.2, cooldown: 4 }
        },
        rewards: { gold: 3000, exp: 1500 },
        equipDrop: { 4: 0.25, 5: 0.05 }
      },
      {
        floor: 3,
        boss: {
          id: 'abyss_xuchu', name: '许褚', element: 'metal',
          atk: 140, def: 90, hp: 3500, spd: 18,
          skill: { name: '虎痴裸衣', type: 'buff', target: 'self',
            effect: { stat: 'atk', ratio: 0.50, duration: 3 }, cooldown: 5 },
          mechanics: [
            { mechanic: 'enrage', triggerRound: 18, atkBoost: 0.45, escalation: { interval: 5, boost: 0.12 } }
          ]
        },
        rewards: { gold: 4000, exp: 2000 },
        equipDrop: { 4: 0.20, 5: 0.08 }
      },
      {
        floor: 4,
        boss: {
          id: 'abyss_dianwei_a', name: '典韦', element: 'metal',
          atk: 130, def: 70, hp: 4000, spd: 22,
          skill: { name: '双戟乱舞', type: 'damage', target: 'random3', multiplier: 1.5, cooldown: 4 },
          mechanics: [
            { mechanic: 'enrage', triggerRound: 15, atkBoost: 0.50, escalation: { interval: 4, boost: 0.15 } },
            { mechanic: 'periodic_aoe', interval: 5, hpPercent: 0.20 }
          ]
        },
        rewards: { gold: 5000, exp: 2500, iron: 150 },
        equipDrop: { 4: 0.25, 5: 0.10 }
      },
      {
        floor: 5,
        boss: {
          id: 'abyss_lvbu', name: '吕布', element: 'metal',
          atk: 180, def: 100, hp: 8000, spd: 35,
          skill: { name: '天下无双', type: 'damage', target: 'all', multiplier: 2.0, cooldown: 4 },
          mechanics: [
            { mechanic: 'enrage', triggerRound: 12, atkBoost: 0.60, escalation: { interval: 4, boost: 0.20 } },
            { mechanic: 'periodic_aoe', interval: 4, hpPercent: 0.25 },
            { mechanic: 'execute', hpThreshold: 0.25, cooldown: 3 }
          ]
        },
        rewards: { gold: 8000, exp: 5000, iron: 300, jade: 10 },
        mythicDrop: { chance: 0.05, pool: ['equip_mythic_tyrant_armor'] },
        equipDrop: { 5: 0.15 }
      }
    ],
    firstClearReward: {
      blueprint: 'blueprint_tyrant_halberd',
      gold: 10000,
      jade: 50
    }
  },

  abyss_chibi: {
    id: 'abyss_chibi',
    name: '深渊·赤壁',
    description: '赤壁的火焰从未熄灭，周瑜在此等候挑战者。',
    emoji: '🔥',
    bgGradient: ['#1a0f05', '#3a1500'],
    particleColor: 'rgba(255,150,0,0.3)',
    bossFrameColor: '#ff6600',
    clearArt: 'assets/abyss/clear-chibi.png',
    clearArtAlt: '周瑜镇守赤壁的深渊通关像素贴图',
    unlockCondition: { stage: 'stage_5_5' },
    ticketCost: { jade: 50, gold: 8000, iron: 300 },
    cooldown: 0,
    floors: [
      {
        floor: 1,
        boss: {
          id: 'abyss_ganning', name: '甘宁', element: 'water',
          atk: 110, def: 55, hp: 2800, spd: 28,
          skill: { name: '百骑劫营', type: 'damage', target: 'all', multiplier: 1.3, cooldown: 3 }
        },
        rewards: { gold: 2000, exp: 1000 },
        equipDrop: { 4: 0.20, 5: 0.05 }
      },
      {
        floor: 2,
        boss: {
          id: 'abyss_taishici_a', name: '太史慈', element: 'water',
          atk: 115, def: 65, hp: 3200, spd: 26,
          skill: { name: '神射', type: 'damage', target: 'single', multiplier: 3.0, cooldown: 4 }
        },
        rewards: { gold: 3000, exp: 1500 },
        equipDrop: { 4: 0.25, 5: 0.05 }
      },
      {
        floor: 3,
        boss: {
          id: 'abyss_huanggai', name: '黄盖', element: 'fire',
          atk: 90, def: 100, hp: 4000, spd: 20,
          skill: { name: '苦肉计', type: 'damage', target: 'all', multiplier: 2.0, cooldown: 5 },
          mechanics: [
            { mechanic: 'element_shield', immuneElement: 'fire', weakElement: 'water' }
          ]
        },
        rewards: { gold: 4000, exp: 2000 },
        equipDrop: { 4: 0.20, 5: 0.08 }
      },
      {
        floor: 4,
        boss: {
          id: 'abyss_luxun', name: '陆逊', element: 'fire',
          atk: 105, def: 75, hp: 3800, spd: 32,
          skill: { name: '火烧连营', type: 'damage', target: 'all', multiplier: 1.8, cooldown: 4 },
          mechanics: [
            { mechanic: 'element_shield', immuneElement: 'fire', weakElement: 'water' },
            { mechanic: 'dot_apply', interval: 4, dot: { subtype: 'burn', hpPercentDrain: 0.10, duration: 3 } }
          ]
        },
        rewards: { gold: 5000, exp: 2500, iron: 150 },
        equipDrop: { 4: 0.25, 5: 0.10 }
      },
      {
        floor: 5,
        boss: {
          id: 'abyss_zhouyu', name: '周瑜', element: 'fire',
          atk: 160, def: 85, hp: 7500, spd: 38,
          skill: { name: '火攻', type: 'damage', target: 'all', multiplier: 2.5, cooldown: 4 },
          mechanics: [
            { mechanic: 'element_shield', immuneElement: 'fire', weakElement: 'water' },
            { mechanic: 'dot_apply', interval: 3, dot: { subtype: 'burn', hpPercentDrain: 0.12, duration: 4 } },
            { mechanic: 'periodic_aoe', interval: 4, hpPercent: 0.20 }
          ]
        },
        rewards: { gold: 8000, exp: 5000, iron: 300, jade: 10 },
        mythicDrop: { chance: 0.05, pool: ['equip_mythic_dragon_sword'] },
        equipDrop: { 5: 0.15 }
      }
    ],
    firstClearReward: {
      blueprint: 'blueprint_dragon_cart',
      gold: 15000,
      jade: 60
    }
  },

  abyss_guandu: {
    id: 'abyss_guandu',
    name: '深渊·官渡',
    description: '曹操的电商物流中心，里面全是精锐保安。',
    emoji: '⚡',
    bgGradient: ['#0a0520', '#1a0a40'],
    particleColor: 'rgba(150,100,255,0.3)',
    bossFrameColor: '#ffaa00',
    clearArt: 'assets/abyss/clear-guandu.png',
    clearArtAlt: '曹操镇守官渡的深渊通关像素贴图',
    unlockCondition: { stage: 'stage_5_10' },
    ticketCost: { jade: 80, gold: 12000, iron: 500 },
    cooldown: 0,
    floors: [
      {
        floor: 1,
        boss: {
          id: 'abyss_xiaohoudun', name: '夏侯惇', element: 'metal',
          atk: 125, def: 70, hp: 3200, spd: 24,
          skill: { name: '拔矢啖睛', type: 'buff', target: 'self',
            effect: { stat: 'atk', ratio: 0.30, duration: 99 }, cooldown: 99 }
        },
        rewards: { gold: 2000, exp: 1000 },
        equipDrop: { 4: 0.20, 5: 0.05 }
      },
      {
        floor: 2,
        boss: {
          id: 'abyss_xiaohouyuan', name: '夏侯渊', element: 'metal',
          atk: 135, def: 55, hp: 2800, spd: 35,
          skill: { name: '疾风突袭', type: 'damage', target: 'single', multiplier: 2.5, cooldown: 3 }
        },
        rewards: { gold: 3000, exp: 1500 },
        equipDrop: { 4: 0.25, 5: 0.05 }
      },
      {
        floor: 3,
        boss: {
          id: 'abyss_xunyu', name: '荀彧', element: 'water',
          atk: 80, def: 60, hp: 3500, spd: 30,
          skill: { name: '王佐之才', type: 'heal', target: 'self', multiplier: 0.5, cooldown: 3 },
          mechanics: [
            { mechanic: 'high_armor', bonusDef: 250 }
          ]
        },
        rewards: { gold: 4000, exp: 2000 },
        equipDrop: { 4: 0.20, 5: 0.08 }
      },
      {
        floor: 4,
        boss: {
          id: 'abyss_simayi', name: '司马懿', element: 'water',
          atk: 100, def: 95, hp: 5000, spd: 28,
          skill: { name: '隐忍', type: 'buff', target: 'self',
            effect: { stat: 'atk', ratio: 0.50, duration: 99 }, cooldown: 99 },
          mechanics: [
            { mechanic: 'high_armor', bonusDef: 300 },
            { mechanic: 'summon', hpThreshold: 0.6, adds: [
              { name: '袁军士兵', atk: 0.25, def: 0.25, hp: 0.15, spd: 12 },
              { name: '袁军士兵', atk: 0.25, def: 0.25, hp: 0.15, spd: 12 }
            ], bossHealPerAdd: 0.02 }
          ]
        },
        rewards: { gold: 5000, exp: 2500, iron: 150 },
        equipDrop: { 4: 0.25, 5: 0.10 }
      },
      {
        floor: 5,
        boss: {
          id: 'abyss_caocao', name: '曹操', element: 'metal',
          atk: 170, def: 110, hp: 10000, spd: 30,
          skill: { name: '挟天子令诸侯', type: 'damage', target: 'all', multiplier: 2.0, cooldown: 4 },
          mechanics: [
            { mechanic: 'high_armor', bonusDef: 350 },
            { mechanic: 'summon', hpThreshold: 0.5, adds: [
              { name: '袁军精锐', atk: 0.30, def: 0.30, hp: 0.20, spd: 14 },
              { name: '袁军精锐', atk: 0.30, def: 0.30, hp: 0.20, spd: 14 },
              { name: '袁军精锐', atk: 0.30, def: 0.30, hp: 0.20, spd: 14 }
            ], bossHealPerAdd: 0.015 },
            { mechanic: 'enrage', triggerRound: 20, atkBoost: 0.50, escalation: { interval: 5, boost: 0.15 } }
          ]
        },
        rewards: { gold: 8000, exp: 5000, iron: 300, jade: 10 },
        mythicDrop: { chance: 0.05, pool: ['equip_mythic_emperor_horse'] },
        equipDrop: { 5: 0.15 }
      }
    ],
    firstClearReward: {
      blueprint: 'blueprint_emperor_armor',
      gold: 20000,
      jade: 80
    }
  },

  abyss_changban: {
    id: 'abyss_changban',
    name: '深渊·长坂坡',
    description: '赵云七进七出的传说之地，你能活着走出来吗？',
    emoji: '🐉',
    bgGradient: ['#0a1520', '#0a2540'],
    particleColor: 'rgba(100,200,255,0.3)',
    bossFrameColor: '#00aaff',
    clearArt: 'assets/abyss/clear-changban.png',
    clearArtAlt: '曹操长坂大军的深渊通关像素贴图',
    unlockCondition: { stage: 'stage_7_5' },
    ticketCost: { jade: 100, gold: 15000, iron: 600 },
    cooldown: 0,
    floors: [
      {
        floor: 1,
        boss: {
          id: 'abyss_wenpin', name: '文聘', element: 'metal',
          atk: 130, def: 80, hp: 3500, spd: 26,
          skill: { name: '拦江射箭', type: 'damage', target: 'random3', multiplier: 1.6, cooldown: 3 }
        },
        rewards: { gold: 3000, exp: 1500 },
        equipDrop: { 4: 0.25, 5: 0.08 }
      },
      {
        floor: 2,
        boss: {
          id: 'abyss_caoren_a', name: '曹仁', element: 'metal',
          atk: 110, def: 110, hp: 4500, spd: 22,
          skill: { name: '铁壁防线', type: 'buff', target: 'self',
            effect: { stat: 'def', ratio: 0.60, duration: 3 }, cooldown: 4 }
        },
        rewards: { gold: 4000, exp: 2000 },
        equipDrop: { 4: 0.25, 5: 0.08 }
      },
      {
        floor: 3,
        boss: {
          id: 'abyss_zhanghe_a', name: '张郃', element: 'metal',
          atk: 140, def: 75, hp: 4000, spd: 30,
          skill: { name: '巧变连击', type: 'damage', target: 'random3', multiplier: 1.8, cooldown: 4 },
          mechanics: [
            { mechanic: 'enrage', triggerRound: 18, atkBoost: 0.50, escalation: { interval: 5, boost: 0.15 } },
            { mechanic: 'high_armor', bonusDef: 300 }
          ]
        },
        rewards: { gold: 5000, exp: 2500 },
        equipDrop: { 4: 0.30, 5: 0.10 }
      },
      {
        floor: 4,
        boss: {
          id: 'abyss_xiahouen', name: '夏侯恩', element: 'metal',
          atk: 150, def: 65, hp: 3800, spd: 34,
          skill: { name: '青釭剑', type: 'damage', target: 'single', multiplier: 3.2, cooldown: 4 },
          mechanics: [
            { mechanic: 'enrage', triggerRound: 15, atkBoost: 0.55, escalation: { interval: 4, boost: 0.18 } },
            { mechanic: 'periodic_aoe', interval: 3, hpPercent: 0.20 },
            { mechanic: 'dot_apply', interval: 4, dot: { subtype: 'poison', hpPercentDrain: 0.10, duration: 4 } }
          ]
        },
        rewards: { gold: 6000, exp: 3000, iron: 200 },
        equipDrop: { 4: 0.25, 5: 0.12 }
      },
      {
        floor: 5,
        boss: {
          id: 'abyss_caocao_changban', name: '曹操·长坂', element: 'metal',
          atk: 190, def: 120, hp: 12000, spd: 32,
          skill: { name: '百万雄师', type: 'damage', target: 'all', multiplier: 2.2, cooldown: 4 },
          mechanics: [
            { mechanic: 'enrage', triggerRound: 12, atkBoost: 0.60, escalation: { interval: 3, boost: 0.20 } },
            { mechanic: 'periodic_aoe', interval: 3, hpPercent: 0.25 },
            { mechanic: 'execute', hpThreshold: 0.30, cooldown: 3 },
            { mechanic: 'summon', hpThreshold: 0.4, adds: [
              { name: '精锐骑兵', atk: 0.35, def: 0.35, hp: 0.25, spd: 18 },
              { name: '精锐骑兵', atk: 0.35, def: 0.35, hp: 0.25, spd: 18 },
              { name: '精锐骑兵', atk: 0.35, def: 0.35, hp: 0.25, spd: 18 }
            ], bossHealPerAdd: 0.02 }
          ]
        },
        rewards: { gold: 10000, exp: 6000, iron: 400, jade: 15 },
        mythicDrop: { chance: 0.06, pool: ['equip_mythic_azure_blade'] },
        equipDrop: { 5: 0.18 }
      }
    ],
    firstClearReward: {
      blueprint: 'blueprint_azure_spear',
      gold: 25000,
      jade: 100
    }
  },

  abyss_wuzhang: {
    id: 'abyss_wuzhang',
    name: '深渊·五丈原',
    description: '诸葛亮的最后战场，星落秋风，谁能改变命运？',
    emoji: '⭐',
    bgGradient: ['#0f0520', '#200a30'],
    particleColor: 'rgba(200,150,255,0.4)',
    bossFrameColor: '#cc66ff',
    clearArt: 'assets/abyss/clear-wuzhang.png',
    clearArtAlt: '诸葛亮星落五丈原的深渊通关像素贴图',
    unlockCondition: { stage: 'stage_10_5' },
    ticketCost: { jade: 150, gold: 20000, iron: 800 },
    cooldown: 0,
    floors: [
      {
        floor: 1,
        boss: {
          id: 'abyss_guohuai', name: '郭淮', element: 'metal',
          atk: 135, def: 90, hp: 4200, spd: 28,
          skill: { name: '坚壁清野', type: 'debuff', target: 'all',
            effect: { stat: 'atk', ratio: 0.20, duration: 2 }, cooldown: 4 }
        },
        rewards: { gold: 4000, exp: 2000 },
        equipDrop: { 4: 0.25, 5: 0.10 }
      },
      {
        floor: 2,
        boss: {
          id: 'abyss_zhanghe_wuzhang', name: '张郃·五丈', element: 'metal',
          atk: 155, def: 85, hp: 4800, spd: 32,
          skill: { name: '巧变千军', type: 'damage', target: 'all', multiplier: 1.6, cooldown: 3 }
        },
        rewards: { gold: 5000, exp: 2500 },
        equipDrop: { 4: 0.30, 5: 0.10 }
      },
      {
        floor: 3,
        boss: {
          id: 'abyss_simayi_wuzhang', name: '司马懿·五丈', element: 'water',
          atk: 120, def: 120, hp: 6000, spd: 26,
          skill: { name: '深谋远虑', type: 'buff', target: 'self',
            effect: { stat: 'def', ratio: 0.80, duration: 99 }, cooldown: 99 },
          mechanics: [
            { mechanic: 'dot_apply', interval: 4, dot: { subtype: 'poison', hpPercentDrain: 0.08, duration: 4 } }
          ]
        },
        rewards: { gold: 6000, exp: 3000 },
        equipDrop: { 4: 0.25, 5: 0.12 }
      },
      {
        floor: 4,
        boss: {
          id: 'abyss_deng_ai', name: '邓艾', element: 'metal',
          atk: 170, def: 80, hp: 5500, spd: 36,
          skill: { name: '偷渡阴平', type: 'damage', target: 'single', multiplier: 3.5, cooldown: 4 },
          mechanics: [
            { mechanic: 'dot_apply', interval: 3, dot: { subtype: 'poison', hpPercentDrain: 0.10, duration: 4 } },
            { mechanic: 'execute', hpThreshold: 0.30, cooldown: 3 }
          ]
        },
        rewards: { gold: 8000, exp: 4000, iron: 300 },
        equipDrop: { 4: 0.30, 5: 0.15 }
      },
      {
        floor: 5,
        boss: {
          id: 'abyss_zhugeliang', name: '诸葛亮·星落', element: 'fire',
          atk: 200, def: 130, hp: 15000, spd: 35,
          skill: { name: '出师未捷·终章', type: 'damage', target: 'all', multiplier: 2.5, cooldown: 4 },
          mechanics: [
            { mechanic: 'dot_apply', interval: 3, dot: { subtype: 'poison', hpPercentDrain: 0.12, duration: 5 } },
            { mechanic: 'execute', hpThreshold: 0.35, cooldown: 3 },
            { mechanic: 'enrage', triggerRound: 18, atkBoost: 0.50, escalation: { interval: 5, boost: 0.15 } }
          ]
        },
        rewards: { gold: 15000, exp: 8000, iron: 500, jade: 20 },
        mythicDrop: { chance: 0.08, pool: ['equip_mythic_feather_fan'] },
        equipDrop: { 5: 0.20 }
      }
    ],
    firstClearReward: {
      blueprint: 'blueprint_feather_fan',
      gold: 30000,
      jade: 120
    }
  }
};
