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
    unlockCondition: { stage: 'stage_4_10' },
    ticketCost: { jade: 30, gold: 5000, iron: 200 },
    cooldown: 86400,
    floors: [
      {
        floor: 1,
        boss: {
          id: 'abyss_huaxiong', name: '华雄',
          atk: 120, def: 60, hp: 2500, spd: 25,
          skill: { name: '斩将刀', type: 'damage', target: 'single', multiplier: 2.5, cooldown: 3 }
        },
        rewards: { gold: 2000, exp: 1000 },
        equipDrop: { 4: 0.20, 5: 0.05 }
      },
      {
        floor: 2,
        boss: {
          id: 'abyss_zhangliao_a', name: '张辽',
          atk: 100, def: 80, hp: 3000, spd: 30,
          skill: { name: '威震逍遥津', type: 'damage', target: 'all', multiplier: 1.2, cooldown: 4 }
        },
        rewards: { gold: 3000, exp: 1500 },
        equipDrop: { 4: 0.25, 5: 0.05 }
      },
      {
        floor: 3,
        boss: {
          id: 'abyss_xuchu', name: '许褚',
          atk: 140, def: 90, hp: 3500, spd: 18,
          skill: { name: '虎痴裸衣', type: 'buff', target: 'self',
            effect: { stat: 'atk', ratio: 0.50, duration: 3 }, cooldown: 5 }
        },
        rewards: { gold: 4000, exp: 2000 },
        equipDrop: { 4: 0.20, 5: 0.08 }
      },
      {
        floor: 4,
        boss: {
          id: 'abyss_dianwei_a', name: '典韦',
          atk: 130, def: 70, hp: 4000, spd: 22,
          skill: { name: '双戟乱舞', type: 'damage', target: 'random3', multiplier: 1.5, cooldown: 4 }
        },
        rewards: { gold: 5000, exp: 2500, iron: 150 },
        equipDrop: { 4: 0.25, 5: 0.10 }
      },
      {
        floor: 5,
        boss: {
          id: 'abyss_lvbu', name: '吕布',
          atk: 180, def: 100, hp: 8000, spd: 35,
          skill: { name: '天下无双', type: 'damage', target: 'all', multiplier: 2.0, cooldown: 4 }
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
    unlockCondition: { stage: 'stage_5_5' },
    ticketCost: { jade: 50, gold: 8000, iron: 300 },
    cooldown: 86400,
    floors: [
      {
        floor: 1,
        boss: {
          id: 'abyss_ganning', name: '甘宁',
          atk: 110, def: 55, hp: 2800, spd: 28,
          skill: { name: '百骑劫营', type: 'damage', target: 'all', multiplier: 1.3, cooldown: 3 }
        },
        rewards: { gold: 2000, exp: 1000 },
        equipDrop: { 4: 0.20, 5: 0.05 }
      },
      {
        floor: 2,
        boss: {
          id: 'abyss_taishici_a', name: '太史慈',
          atk: 115, def: 65, hp: 3200, spd: 26,
          skill: { name: '神射', type: 'damage', target: 'single', multiplier: 3.0, cooldown: 4 }
        },
        rewards: { gold: 3000, exp: 1500 },
        equipDrop: { 4: 0.25, 5: 0.05 }
      },
      {
        floor: 3,
        boss: {
          id: 'abyss_huanggai', name: '黄盖',
          atk: 90, def: 100, hp: 4000, spd: 20,
          skill: { name: '苦肉计', type: 'damage', target: 'all', multiplier: 2.0, cooldown: 5 }
        },
        rewards: { gold: 4000, exp: 2000 },
        equipDrop: { 4: 0.20, 5: 0.08 }
      },
      {
        floor: 4,
        boss: {
          id: 'abyss_luxun', name: '陆逊',
          atk: 105, def: 75, hp: 3800, spd: 32,
          skill: { name: '火烧连营', type: 'damage', target: 'all', multiplier: 1.8, cooldown: 4 }
        },
        rewards: { gold: 5000, exp: 2500, iron: 150 },
        equipDrop: { 4: 0.25, 5: 0.10 }
      },
      {
        floor: 5,
        boss: {
          id: 'abyss_zhouyu', name: '周瑜',
          atk: 160, def: 85, hp: 7500, spd: 38,
          skill: { name: '火攻', type: 'damage', target: 'all', multiplier: 2.5, cooldown: 4 }
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
    unlockCondition: { stage: 'stage_5_10' },
    ticketCost: { jade: 80, gold: 12000, iron: 500 },
    cooldown: 86400,
    floors: [
      {
        floor: 1,
        boss: {
          id: 'abyss_xiaohoudun', name: '夏侯惇',
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
          id: 'abyss_xiaohouyuan', name: '夏侯渊',
          atk: 135, def: 55, hp: 2800, spd: 35,
          skill: { name: '疾风突袭', type: 'damage', target: 'single', multiplier: 2.5, cooldown: 3 }
        },
        rewards: { gold: 3000, exp: 1500 },
        equipDrop: { 4: 0.25, 5: 0.05 }
      },
      {
        floor: 3,
        boss: {
          id: 'abyss_xunyu', name: '荀彧',
          atk: 80, def: 60, hp: 3500, spd: 30,
          skill: { name: '王佐之才', type: 'heal', target: 'self', multiplier: 0.5, cooldown: 3 }
        },
        rewards: { gold: 4000, exp: 2000 },
        equipDrop: { 4: 0.20, 5: 0.08 }
      },
      {
        floor: 4,
        boss: {
          id: 'abyss_simayi', name: '司马懿',
          atk: 100, def: 95, hp: 5000, spd: 28,
          skill: { name: '隐忍', type: 'buff', target: 'self',
            effect: { stat: 'atk', ratio: 0.50, duration: 99 }, cooldown: 99 }
        },
        rewards: { gold: 5000, exp: 2500, iron: 150 },
        equipDrop: { 4: 0.25, 5: 0.10 }
      },
      {
        floor: 5,
        boss: {
          id: 'abyss_caocao', name: '曹操',
          atk: 170, def: 110, hp: 10000, spd: 30,
          skill: { name: '挟天子令诸侯', type: 'damage', target: 'all', multiplier: 2.0, cooldown: 4 }
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
  }
};
