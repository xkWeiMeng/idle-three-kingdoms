/**
 * 作物静态数据表 + 合成配方 + 料理配方
 * 27 种作物分 5 品级，与 CONSTANTS.QUALITY 对齐
 */
var CropData = {

  // ===== 普通 (COMMON, quality=1) =====
  cabbage: {
    id: 'cabbage', name: '白菜', emoji: '🥬', quality: 1,
    growthTime: 180, seedCost: { gold: 10 },
    yields: { food: 5 }, farmExp: 5,
    reharvestCount: 0, description: '最基础的蔬菜，成熟快，产出少'
  },
  radish: {
    id: 'radish', name: '萝卜', emoji: '🥕', quality: 1,
    growthTime: 300, seedCost: { gold: 15 },
    yields: { food: 8, gold: 20 }, farmExp: 8,
    reharvestCount: 0, description: '略优于白菜，兼产金币'
  },
  chives: {
    id: 'chives', name: '韭菜', emoji: '🌿', quality: 1,
    growthTime: 240, seedCost: { gold: 12 },
    yields: { food: 6, gold: 15 }, farmExp: 6,
    reharvestCount: 1, reharvestTime: 120,
    description: '割了又长，可再收割1次（总共2次）'
  },
  bean_sprout: {
    id: 'bean_sprout', name: '豆芽', emoji: '🌱', quality: 1,
    growthTime: 120, seedCost: { gold: 8 },
    yields: { food: 3 }, farmExp: 3,
    reharvestCount: 0, description: '最速成熟，适合刷经验'
  },
  greens: {
    id: 'greens', name: '青菜', emoji: '🥗', quality: 1,
    growthTime: 480, seedCost: { gold: 20 },
    yields: { food: 12, gold: 30 }, farmExp: 10,
    reharvestCount: 0, description: '普通作物中收益比最优'
  },
  scallion: {
    id: 'scallion', name: '葱', emoji: '🧅', quality: 1,
    growthTime: 180, seedCost: { gold: 10 },
    yields: { food: 4, gold: 10 }, farmExp: 4,
    reharvestCount: 0, description: '料理基础调味材料'
  },

  // ===== 优良 (UNCOMMON, quality=2) =====
  eggplant: {
    id: 'eggplant', name: '茄子', emoji: '🍆', quality: 2,
    growthTime: 900, seedCost: { gold: 80 },
    yields: { food: 20, gold: 120 }, farmExp: 25,
    reharvestCount: 0, description: '均衡型优良作物'
  },
  cucumber: {
    id: 'cucumber', name: '黄瓜', emoji: '🥒', quality: 2,
    growthTime: 1200, seedCost: { gold: 100 },
    yields: { food: 25, gold: 180 }, farmExp: 35,
    reharvestCount: 0, description: '金币专精'
  },
  pumpkin: {
    id: 'pumpkin', name: '南瓜', emoji: '🎃', quality: 2,
    growthTime: 1500, seedCost: { gold: 120 },
    yields: { food: 15, gold: 100, wood: 5 }, farmExp: 40,
    reharvestCount: 0, description: '兼产木材的特殊作物'
  },
  chili: {
    id: 'chili', name: '辣椒', emoji: '🌶️', quality: 2,
    growthTime: 1080, seedCost: { gold: 90 },
    yields: { food: 18, gold: 150 }, farmExp: 30,
    reharvestCount: 0, description: '料理核心材料'
  },
  watermelon: {
    id: 'watermelon', name: '西瓜', emoji: '🍉', quality: 2,
    growthTime: 1800, seedCost: { gold: 150 },
    yields: { food: 40, gold: 200 }, farmExp: 50,
    reharvestCount: 0, description: '粮草大户'
  },
  lotus_root: {
    id: 'lotus_root', name: '莲藕', emoji: '🪷', quality: 2,
    growthTime: 1680, seedCost: { gold: 130 },
    yields: { food: 30, gold: 160, exp: 50 }, farmExp: 45,
    reharvestCount: 0, description: '兼产经验的特殊作物'
  },

  // ===== 精良 (RARE, quality=3) =====
  lingzhi: {
    id: 'lingzhi', name: '灵芝', emoji: '🍄', quality: 3,
    growthTime: 3600, seedCost: { gold: 500 },
    yields: { gold: 800, exp: 200 }, farmExp: 80,
    reharvestCount: 0, description: '经验提升药材'
  },
  angelica: {
    id: 'angelica', name: '当归', emoji: '🌿', quality: 3,
    growthTime: 5400, seedCost: { gold: 600 },
    yields: { gold: 1000, food: 60 }, farmExp: 100,
    reharvestCount: 0, description: '粮草大户药材'
  },
  astragalus: {
    id: 'astragalus', name: '黄芪', emoji: '🍃', quality: 3,
    growthTime: 5400, seedCost: { gold: 550 },
    yields: { gold: 900, food: 30 }, farmExp: 90,
    reharvestCount: 0, description: '料理关键药材'
  },
  wolfberry: {
    id: 'wolfberry', name: '枸杞', emoji: '🔴', quality: 3,
    growthTime: 3600, seedCost: { gold: 450 },
    yields: { gold: 700, exp: 150 }, farmExp: 75,
    reharvestCount: 0, description: '性价比最高的药材'
  },
  poria: {
    id: 'poria', name: '茯苓', emoji: '🟤', quality: 3,
    growthTime: 7200, seedCost: { gold: 700 },
    yields: { gold: 1500, food: 80 }, farmExp: 120,
    reharvestCount: 0, description: '防御料理专用药材'
  },
  chuanxiong: {
    id: 'chuanxiong', name: '川芎', emoji: '🌾', quality: 3,
    growthTime: 10800, seedCost: { gold: 800 },
    yields: { gold: 2500, food: 100 }, farmExp: 150,
    reharvestCount: 0, description: '攻击料理专用药材'
  },

  // ===== 史诗 (EPIC, quality=4) =====
  snow_lotus: {
    id: 'snow_lotus', name: '雪莲', emoji: '❄️', quality: 4,
    growthTime: 14400, seedCost: { gold: 3000 },
    yields: { gold: 5000, jade: 5 }, farmExp: 300,
    reharvestCount: 0, description: '攻击向料理材料'
  },
  fleece_flower: {
    id: 'fleece_flower', name: '何首乌', emoji: '🟣', quality: 4,
    growthTime: 21600, seedCost: { gold: 3500 },
    yields: { gold: 8000, jade: 8 }, farmExp: 400,
    reharvestCount: 0, description: '生命向料理材料'
  },
  snow_ginseng: {
    id: 'snow_ginseng', name: '天山雪参', emoji: '🏔️', quality: 4,
    growthTime: 18000, seedCost: { gold: 4000 },
    yields: { gold: 6500, jade: 6 }, farmExp: 350,
    reharvestCount: 0, description: '防御向料理材料'
  },
  calamus: {
    id: 'calamus', name: '九节菖蒲', emoji: '🌿', quality: 4,
    growthTime: 16200, seedCost: { gold: 3200 },
    yields: { gold: 5500, jade: 5 }, farmExp: 320,
    reharvestCount: 0, description: '速度向料理材料'
  },
  blood_lingzhi: {
    id: 'blood_lingzhi', name: '血灵芝', emoji: '🩸', quality: 4,
    growthTime: 28800, seedCost: { gold: 5000 },
    yields: { gold: 12000, jade: 12 }, farmExp: 500,
    reharvestCount: 0, description: '全能料理材料'
  },

  // ===== 传说 (LEGENDARY, quality=5) =====
  peach_of_immortality: {
    id: 'peach_of_immortality', name: '蟠桃', emoji: '🍑', quality: 5,
    growthTime: 43200, seedCost: { gold: 15000 },
    yields: { gold: 30000, jade: 30 }, farmExp: 1000,
    reharvestCount: 0, description: '传说料理材料（攻击向）'
  },
  ancient_spirit_sprout: {
    id: 'ancient_spirit_sprout', name: '万年灵芽', emoji: '✨', quality: 5,
    growthTime: 86400, seedCost: { gold: 20000 },
    yields: { gold: 60000, jade: 50 }, farmExp: 2000,
    reharvestCount: 0, description: '最终追求（全属性料理）'
  },
  immortal_herb: {
    id: 'immortal_herb', name: '仙草', emoji: '🌟', quality: 5,
    growthTime: 64800, seedCost: { gold: 18000 },
    yields: { gold: 45000, jade: 40 }, farmExp: 1500,
    reharvestCount: 0, description: '传说料理材料（全能向）'
  },
  dragon_saliva_grass: {
    id: 'dragon_saliva_grass', name: '龙涎草', emoji: '🐉', quality: 5,
    growthTime: 50400, seedCost: { gold: 16000 },
    yields: { gold: 35000, jade: 35 }, farmExp: 1200,
    reharvestCount: 0, description: '传说料理材料（速度向）'
  }
};

/**
 * 种子合成配方表
 * materials: { cropId: count } — 消耗的作物
 * result: seedId — 获得的种子（等于 cropId）
 * minShopLevel: 种子铺最低等级
 */
var CropSynthesis = [
  // 普通 → 优良
  { materials: { cabbage: 5, radish: 5 }, result: 'eggplant', minShopLevel: 2 },
  { materials: { chives: 5, greens: 3 }, result: 'cucumber', minShopLevel: 2 },
  { materials: { radish: 8, scallion: 5 }, result: 'pumpkin', minShopLevel: 2 },
  { materials: { cabbage: 3, bean_sprout: 5 }, result: 'chili', minShopLevel: 2 },
  { materials: { greens: 5, radish: 5, scallion: 3 }, result: 'watermelon', minShopLevel: 2 },
  { materials: { chives: 5, bean_sprout: 8 }, result: 'lotus_root', minShopLevel: 2 },
  // 优良 → 精良
  { materials: { eggplant: 3, chili: 3 }, result: 'lingzhi', minShopLevel: 3 },
  { materials: { cucumber: 5, lotus_root: 3 }, result: 'angelica', minShopLevel: 3 },
  { materials: { pumpkin: 5, watermelon: 3 }, result: 'astragalus', minShopLevel: 3 },
  { materials: { chili: 3, lotus_root: 3 }, result: 'wolfberry', minShopLevel: 3 },
  { materials: { eggplant: 5, cucumber: 5, watermelon: 3 }, result: 'poria', minShopLevel: 3 },
  { materials: { angelica: 2, astragalus: 2 }, result: 'chuanxiong', minShopLevel: 3 },
  // 精良 → 史诗
  { materials: { lingzhi: 5, chuanxiong: 3 }, result: 'snow_lotus', minShopLevel: 4 },
  { materials: { angelica: 5, poria: 3 }, result: 'fleece_flower', minShopLevel: 4 },
  { materials: { astragalus: 5, poria: 3, chuanxiong: 2 }, result: 'snow_ginseng', minShopLevel: 4 },
  { materials: { wolfberry: 5, lingzhi: 3 }, result: 'calamus', minShopLevel: 4 },
  { materials: { snow_lotus: 2, fleece_flower: 2, snow_ginseng: 2 }, result: 'blood_lingzhi', minShopLevel: 4 },
  // 史诗 → 传说
  { materials: { snow_lotus: 5, blood_lingzhi: 3 }, result: 'peach_of_immortality', minShopLevel: 5 },
  { materials: { blood_lingzhi: 5, fleece_flower: 5, snow_ginseng: 5 }, result: 'ancient_spirit_sprout', minShopLevel: 5 },
  { materials: { snow_ginseng: 5, blood_lingzhi: 3 }, result: 'immortal_herb', minShopLevel: 5 },
  { materials: { calamus: 5, blood_lingzhi: 3 }, result: 'dragon_saliva_grass', minShopLevel: 5 }
];

/**
 * 料理配方表
 * effects: { atkBonus, defBonus, hpBonus, spdBonus, allBonus, critRate, critDmg, expBonus }
 * duration: 秒
 */
var RecipeData = {
  vegetable_soup: {
    id: 'vegetable_soup', name: '素菜汤', emoji: '🍲', quality: 1,
    materials: { cabbage: 3, radish: 2 },
    effects: { hpBonus: 0.10 }, duration: 1800,
    description: 'HP恢复 +10%'
  },
  chive_scramble: {
    id: 'chive_scramble', name: '韭菜炒蛋', emoji: '🥚', quality: 1,
    materials: { chives: 4, scallion: 2 },
    effects: { atkBonus: 0.03 }, duration: 1800,
    description: 'ATK +3%'
  },
  cucumber_salad: {
    id: 'cucumber_salad', name: '凉拌黄瓜', emoji: '🥗', quality: 2,
    materials: { cucumber: 3, chili: 2 },
    effects: { spdBonus: 0.05 }, duration: 1800,
    description: 'SPD +5%'
  },
  braised_eggplant: {
    id: 'braised_eggplant', name: '红烧茄子', emoji: '🍲', quality: 2,
    materials: { eggplant: 4, chili: 2, scallion: 3 },
    effects: { atkBonus: 0.05, defBonus: 0.03 }, duration: 3600,
    description: 'ATK +5%, DEF +3%'
  },
  lotus_soup: {
    id: 'lotus_soup', name: '莲藕排骨汤', emoji: '🥣', quality: 2,
    materials: { lotus_root: 3, watermelon: 2 },
    effects: { hpBonus: 0.08, defBonus: 0.05 }, duration: 3600,
    description: 'HP +8%, DEF +5%'
  },
  lingzhi_chicken: {
    id: 'lingzhi_chicken', name: '灵芝炖鸡', emoji: '🍗', quality: 3,
    materials: { lingzhi: 2, wolfberry: 3 },
    effects: { allBonus: 0.05 }, duration: 7200,
    description: '全属性 +5%'
  },
  angelica_soup: {
    id: 'angelica_soup', name: '当归补血汤', emoji: '🥘', quality: 3,
    materials: { angelica: 2, astragalus: 2 },
    effects: { hpBonus: 0.15, expBonus: 0.10 }, duration: 7200,
    description: 'HP +15%, 战斗经验 +10%'
  },
  chuanxiong_powder: {
    id: 'chuanxiong_powder', name: '川芎活血散', emoji: '💊', quality: 3,
    materials: { chuanxiong: 2, poria: 1 },
    effects: { atkBonus: 0.10, critRate: 0.03 }, duration: 7200,
    description: 'ATK +10%, 暴击率 +3%'
  },
  snow_lotus_paste: {
    id: 'snow_lotus_paste', name: '雪莲天山膏', emoji: '🏔️', quality: 4,
    materials: { snow_lotus: 1, snow_ginseng: 1 },
    effects: { atkBonus: 0.15, defBonus: 0.10 }, duration: 14400,
    description: 'ATK +15%, DEF +10%'
  },
  blood_lingzhi_elixir: {
    id: 'blood_lingzhi_elixir', name: '血灵芝仙丹', emoji: '💎', quality: 4,
    materials: { blood_lingzhi: 1, fleece_flower: 1 },
    effects: { allBonus: 0.12, critRate: 0.05 }, duration: 14400,
    description: '全属性 +12%, 暴击率 +5%'
  },
  peach_wine: {
    id: 'peach_wine', name: '蟠桃仙酿', emoji: '🍷', quality: 5,
    materials: { peach_of_immortality: 1, immortal_herb: 1 },
    effects: { allBonus: 0.20, critRate: 0.08 }, duration: 21600,
    description: '全属性 +20%, 暴击率 +8%'
  },
  spirit_sprout_essence: {
    id: 'spirit_sprout_essence', name: '万年灵芽精华', emoji: '✨', quality: 5,
    materials: { ancient_spirit_sprout: 1, dragon_saliva_grass: 1 },
    effects: { allBonus: 0.25, critDmg: 0.20 }, duration: 21600,
    description: '全属性 +25%, 暴击伤害 +20%'
  }
};

/**
 * 菜园等级效果查询表
 * index = 菜园等级 (1~10)
 */
var GardenLevelData = [
  null,
  { plots: 2,  qualityUnlock: 1, speedBonus: 0,    doubleChance: 0 },
  { plots: 3,  qualityUnlock: 1, speedBonus: 0.05, doubleChance: 0 },
  { plots: 4,  qualityUnlock: 2, speedBonus: 0.10, doubleChance: 0 },
  { plots: 5,  qualityUnlock: 2, speedBonus: 0.15, doubleChance: 0.05 },
  { plots: 6,  qualityUnlock: 3, speedBonus: 0.20, doubleChance: 0.08 },
  { plots: 7,  qualityUnlock: 3, speedBonus: 0.25, doubleChance: 0.10 },
  { plots: 8,  qualityUnlock: 3, speedBonus: 0.30, doubleChance: 0.12 },
  { plots: 9,  qualityUnlock: 4, speedBonus: 0.35, doubleChance: 0.15 },
  { plots: 10, qualityUnlock: 4, speedBonus: 0.40, doubleChance: 0.18 },
  { plots: 12, qualityUnlock: 5, speedBonus: 0.50, doubleChance: 0.20 }
];

/**
 * 农耕熟练度等级表
 */
var FarmMasteryData = [
  { title: '新手农夫', minExp: 0,     yieldBonus: 0,    bugReduction: 0,   extra: null },
  { title: '老农',     minExp: 500,   yieldBonus: 0.05, bugReduction: 0,   extra: null },
  { title: '农耕达人', minExp: 2000,  yieldBonus: 0.10, bugReduction: 0,   extra: 'batchWater' },
  { title: '园艺大师', minExp: 8000,  yieldBonus: 0.15, bugReduction: 0.50, extra: null },
  { title: '农神',     minExp: 30000, yieldBonus: 0.20, bugReduction: 0.50, extra: 'seedDropBonus' }
];
