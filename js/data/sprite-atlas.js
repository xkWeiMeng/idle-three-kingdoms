/**
 * 精灵图集数据 — 定义所有精灵动画帧和图标位置
 */
var SpriteAtlas = {
  basePath: 'assets/img/sprites/',

  // ========== 角色动画 ==========
  characters: {
    soldier: {
      idle:   { src: 'soldier/idle.png',   fw: 100, fh: 100, frames: 6, fps: 8 },
      attack: { src: 'soldier/attack.png', fw: 100, fh: 100, frames: 6, fps: 12, loop: false },
      hurt:   { src: 'soldier/hurt.png',   fw: 100, fh: 100, frames: 4, fps: 10, loop: false },
      death:  { src: 'soldier/death.png',  fw: 100, fh: 100, frames: 4, fps: 8,  loop: false },
      walk:   { src: 'soldier/walk.png',   fw: 100, fh: 100, frames: 8, fps: 10 }
    },
    orc: {
      idle:   { src: 'orc/idle.png',   fw: 100, fh: 100, frames: 6, fps: 8 },
      attack: { src: 'orc/attack.png', fw: 100, fh: 100, frames: 6, fps: 12, loop: false },
      hurt:   { src: 'orc/hurt.png',   fw: 100, fh: 100, frames: 4, fps: 10, loop: false },
      death:  { src: 'orc/death.png',  fw: 100, fh: 100, frames: 4, fps: 8,  loop: false },
      walk:   { src: 'orc/walk.png',   fw: 100, fh: 100, frames: 8, fps: 10 }
    }
  },

  // ========== 战斗特效 ==========
  effects: {
    heal:       { src: 'effects/heal.png',       fw: 128, fh: 128, frames: 16, fps: 15, loop: false },
    poison:     { src: 'effects/poison.png',      fw: 128, fh: 128, frames: 17, fps: 15, loop: false },
    attack_up:  { src: 'effects/attack_up.png',   fw: 128, fh: 128, frames: 18, fps: 15, loop: false },
    defense_up: { src: 'effects/defense_up.png',  fw: 128, fh: 128, frames: 18, fps: 15, loop: false },
    death_fx:   { src: 'effects/death.png',        fw: 64,  fh: 64,  frames: 50, fps: 15, loop: false },
    absorb:     { src: 'effects/absorb.png',      fw: 128, fh: 128, frames: 31, fps: 15, loop: false },
    haste:      { src: 'effects/haste.png',       fw: 128, fh: 128, frames: 29, fps: 15, loop: false },
    impact:     { src: 'effects/impact.png',      fw: 64,  fh: 64,  frames: 7,  fps: 15, loop: false }
  },

  // ========== 杂项 ==========
  misc: {
    arrow: { src: 'arrow/arrow.png', fw: 100, fh: 100, frames: 1 }
  },

  // ========== 图标精灵表 (Shikashi 32×32) ==========
  icons: {
    src: 'icons.png',
    cellSize: 32,
    cols: 16,

    // 根据 Shikashi 说明文件，按顺序排列的图标类别
    // 索引 = row * 16 + col (0-based)

    // --- 装备图标 (三国像素装备，映射到游戏装备数据) ---
    equipment: {
      // 武器：长戟/刀枪，按品质递进
      weapon_common:    { row: 22, col: 0 },
      weapon_uncommon:  { row: 22, col: 1 },
      weapon_rare:      { row: 22, col: 2 },
      weapon_epic:      { row: 22, col: 3 },
      weapon_legendary: { row: 22, col: 4 },
      weapon_mythic:    { row: 22, col: 5 },

      // 防具：甲胄/战袍，按品质递进
      armor_common:    { row: 22, col: 6 },
      armor_uncommon:  { row: 22, col: 7 },
      armor_rare:      { row: 22, col: 8 },
      armor_epic:      { row: 22, col: 9 },
      armor_legendary: { row: 22, col: 10 },
      armor_mythic:    { row: 22, col: 11 },

      // 饰品：玉佩/龙纹佩，按品质递进
      accessory_common:    { row: 22, col: 12 },
      accessory_uncommon:  { row: 22, col: 13 },
      accessory_rare:      { row: 22, col: 14 },
      accessory_epic:      { row: 22, col: 15 },
      accessory_legendary: { row: 23, col: 0 },
      accessory_mythic:    { row: 23, col: 1 },

      // 坐骑：战马，按品质递进
      mount_common:    { row: 23, col: 2 },
      mount_uncommon:  { row: 23, col: 3 },
      mount_rare:      { row: 23, col: 4 },
      mount_epic:      { row: 23, col: 5 },
      mount_legendary: { row: 23, col: 6 },
      mount_mythic:    { row: 23, col: 7 }
    },

    // --- 技能效果图标 (row 3: 特殊招式) ---
    skills: {
      dripping_blade: { row: 3, col: 0 },  // 滴血之刃
      slash:     { row: 3, col: 1 },   // 斩击
      lightning: { row: 3, col: 2 },   // 闪电攻击
      headshot:  { row: 3, col: 3 },   // 精准打击
      arrow:     { row: 3, col: 4 },   // 箭雨
      heal:      { row: 3, col: 5 },   // 治愈
      heal_injury: { row: 3, col: 6 }, // 伤口治疗
      battle_gear: { row: 3, col: 7 }, // 战斗装备
      guard:     { row: 3, col: 8 },   // 防御
      fire:      { row: 3, col: 9 },   // 火焰之环
      disintegrate: { row: 3, col: 10 }, // 瓦解
      fist:      { row: 3, col: 11 },  // 拳击
      gust:      { row: 3, col: 12 },  // 风刃
      tremor:    { row: 3, col: 13 },  // 地震
      psychic:   { row: 3, col: 14 },  // 精神波
      sunrays:   { row: 3, col: 15 },  // 阳光
      buff_up:   { row: 2, col: 0 },   // 增益箭头
      debuff_down: { row: 2, col: 3 }, // 减益箭头
    },

    // --- 资源图标 ---
    resources: {
      gold:   { row: 12, col: 10 }, // 金币堆
      jade:   { row: 12, col: 14 }, // 宝石
      food:   { row: 14, col: 13 }, // 面包
      exp:    { row: 21, col: 7 },  // 星芒
    },

    // --- 状态效果图标 ---
    status: {
      poison:   { row: 0, col: 1 },  // 毒
      sleep:    { row: 0, col: 2 },  // 睡眠
      silence:  { row: 0, col: 3 },  // 沉默
      curse:    { row: 0, col: 4 },  // 诅咒
      dizzy:    { row: 0, col: 5 },  // 眩晕
      charm:    { row: 0, col: 6 },  // 魅惑
      burn:     { row: 0, col: 9 },  // 灼烧
      skull:    { row: 0, col: 0 },  // 死亡
    },

    // --- 药水图标 (row 9: 治疗物品) ---
    potions: {
      hp_small:   { row: 9, col: 0 },
      hp_medium:  { row: 9, col: 1 },
      hp_large:   { row: 9, col: 2 },
      hp_rare:    { row: 9, col: 3 },
      mp_small:   { row: 9, col: 4 },
      mp_medium:  { row: 9, col: 5 },
      mp_large:   { row: 9, col: 6 },
    },

    // --- 通用图标 ---
    general: {
      chest:     { row: 11, col: 11 }, // 宝箱
      coin_bag:  { row: 12, col: 6 },  // 钱袋
      heart:     { row: 1, col: 0 },   // 心脏
      star:      { row: 21, col: 7 },  // 星芒
      bomb:      { row: 10, col: 12 }, // 炸弹
      hourglass: { row: 10, col: 15 }, // 沙漏
      map:       { row: 13, col: 8 },  // 地图
      scroll:    { row: 13, col: 6 },  // 卷轴
      horse:     { row: 19, col: 10 }, // 马
    }
  },

  // 工具方法：获取图标在精灵表中的像素坐标
  getIconRect: function (category, name) {
    var cat = this.icons[category];
    if (!cat || !cat[name]) return null;
    var pos = cat[name];
    var sz = this.icons.cellSize;
    return { x: pos.col * sz, y: pos.row * sz, w: sz, h: sz };
  },

  // 获取装备图标键名
  getEquipmentIconKey: function (type, quality) {
    var qualityNames = { 1: 'common', 2: 'uncommon', 3: 'rare', 4: 'epic', 5: 'legendary', 6: 'mythic' };
    var qName = qualityNames[quality] || 'common';
    return type + '_' + qName;
  }
};
