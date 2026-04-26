/**
 * 行走精灵图注册表 — 映射武将ID/NPC类型到精灵图文件
 * 所有精灵图均为 128×128 帧，6帧/方向
 * 4方向: south(row0), west(row1), east(row2), north(row3)
 * 8方向(守卫): north(row0)~northwest(row7)
 */
var WalkSheetRegistry = {

  SHEET_PATH: 'assets/characters/sheets/',
  FRAME_W: 128,
  FRAME_H: 128,
  COLS: 6,
  WALK_FPS: 8,

  // 4方向行索引: south=0, west=1, east=2, north=3
  DIR_4_ROW: { south: 0, west: 1, east: 2, north: 3 },

  // 8方向行索引(守卫): north=0, northeast=1, east=2, southeast=3, south=4, southwest=5, west=6, northwest=7
  DIR_8_ROW: { north: 0, northeast: 1, east: 2, southeast: 3, south: 4, southwest: 5, west: 6, northwest: 7 },

  /**
   * 武将精灵图映射
   * key = hero id (如 'shu_zhugeliang')
   * value = { file, bg, dirs }
   */
  heroes: {
    // ── 蜀 ──
    shu_zhugeliang:  { file: 'zhugeliang_walk_4dir_128.png',  bg: '#ff00ff', dirs: 4 },
    shu_liubei:      { file: 'liubei_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },
    shu_guanyu:      { file: 'guanyu_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },
    shu_zhangfei:    { file: 'zhangfei_walk_4dir_128.png',    bg: '#ff00ff', dirs: 4 },
    shu_zhaoyun:     { file: 'zhaoyun_walk_4dir_128.png',     bg: '#ff00ff', dirs: 4 },
    shu_huangzhong:  { file: 'huangzhong_walk_4dir_128.png',  bg: '#ff00ff', dirs: 4 },
    shu_machao:      { file: 'machao_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },
    shu_jiangwei:    { file: 'jiangwei_walk_4dir_128.png',    bg: '#ff00ff', dirs: 4 },
    shu_pangtong:    { file: 'pangtong_walk_4dir_128.png',    bg: '#ff00ff', dirs: 4 },
    shu_weiyan:      { file: 'weiyan_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },

    // ── 魏 ──
    wei_caocao:      { file: 'caocao_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },
    wei_simayi:      { file: 'simayi_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },
    wei_xiahoudun:   { file: 'xiahoudun_walk_4dir_128.png',   bg: '#ff00ff', dirs: 4 },
    wei_zhangliao:   { file: 'zhangliao_walk_4dir_128.png',   bg: '#ff00ff', dirs: 4 },
    wei_dianwei:     { file: 'dianwei_walk_4dir_128.png',     bg: '#ff00ff', dirs: 4 },
    wei_xunyu:       { file: 'xunyu_walk_4dir_128.png',       bg: '#ff00ff', dirs: 4 },
    wei_guojia:      { file: 'guojia_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },
    wei_xuchu:       { file: 'xuchu_walk_4dir_128.png',       bg: '#ff00ff', dirs: 4 },
    wei_caoren:      { file: 'caoren_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },
    wei_zhanghe:     { file: 'zhanghe_walk_4dir_128.png',     bg: '#ff00ff', dirs: 4 },

    // ── 吴 ──
    wu_sunquan:      { file: 'sunquan_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },
    wu_zhouyu:       { file: 'zhouyu_walk_4dir_128.png',       bg: '#ff00ff', dirs: 4 },
    wu_sunshangxiang:{ file: 'sunshangxiang_walk_4dir_128.png', bg: '#ff00ff', dirs: 4 },
    wu_taishici:     { file: 'taishici_walk_4dir_128.png',     bg: '#ff00ff', dirs: 4 },
    wu_lvmeng:       { file: 'lvmeng_walk_4dir_128.png',       bg: '#ff00ff', dirs: 4 },
    wu_luxun:        { file: 'luxun_walk_4dir_128.png',        bg: '#ff00ff', dirs: 4 },
    wu_ganning:      { file: 'ganning_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },
    wu_huanggai:     { file: 'huanggai_walk_4dir_128.png',     bg: '#ff00ff', dirs: 4 },
    wu_daqiao:       { file: 'daqiao_walk_4dir_128.png',       bg: '#ff00ff', dirs: 4 },
    wu_xiaoqiao:     { file: 'xiaoqiao_walk_4dir_128.png',     bg: '#ff00ff', dirs: 4 },

    // ── 群 ──
    qun_lvbu:        { file: 'lvbu_walk_4dir_128.png',        bg: '#ff00ff', dirs: 4 },
    qun_diaochan:    { file: 'diaochan_walk_4dir_128.png',    bg: '#ff00ff', dirs: 4 },
    qun_huatuo:      { file: 'huatuo_walk_4dir_128.png',      bg: '#ff00ff', dirs: 4 },
    qun_yuanshao:    { file: 'yuanshao_walk_4dir_128.png',    bg: '#ff00ff', dirs: 4 },
    qun_dongzhuo:    { file: 'dongzhuo_walk_4dir_128.png',    bg: '#ff00ff', dirs: 4 },
    qun_zhangjiao:   { file: 'zhangjiao_walk_4dir_128.png',   bg: '#ff00ff', dirs: 4 },
    qun_gongsunzan:  { file: 'gongsunzan_walk_4dir_128.png',  bg: '#ff00ff', dirs: 4 },
    qun_zuoci:       { file: 'zuoci_walk_4dir_128.png',       bg: '#ff00ff', dirs: 4 },
    qun_caiwenji:    { file: 'caiwenji_walk_4dir_128.png',    bg: '#ff00ff', dirs: 4 },
    qun_menghuo:     { file: 'menghuo_walk_4dir_128.png',     bg: '#ff00ff', dirs: 4 },
  },

  /**
   * NPC 精灵图映射
   * key = NPC sprite name (用于 _spawnNPCs 中分配)
   */
  npcs: {
    npc_villager: { file: 'npc_villager_walk_4dir_128.png', bg: '#ff00ff', dirs: 4 },
    npc_female:   { file: 'npc_female_walk_4dir_128.png',   bg: '#ff00ff', dirs: 4 },
    npc_guard:    { file: 'npc_guard_walk_8dir_128.png',    bg: '#00ff00', dirs: 8 },
  },

  /**
   * 根据 heroId 获取精灵图注册信息
   * @param {string} heroId - 如 'shu_zhugeliang'
   * @returns {object|null} { file, bg, dirs } 或 null
   */
  getHero: function (heroId) {
    return this.heroes[heroId] || null;
  },

  /**
   * 根据 NPC sprite 名获取精灵图注册信息
   * @param {string} npcSprite - 如 'npc_villager'
   * @returns {object|null}
   */
  getNpc: function (npcSprite) {
    return this.npcs[npcSprite] || null;
  },

  /**
   * 获取完整文件路径
   * @param {object} entry - registry 条目
   * @returns {string}
   */
  getFullPath: function (entry) {
    return this.SHEET_PATH + entry.file;
  },

  /**
   * 根据 facing 方向获取行索引
   * @param {string} facing - 'south', 'west', 'east', 'north'
   * @param {number} dirs - 4 或 8
   * @returns {number} 行索引
   */
  getRowForFacing: function (facing, dirs) {
    if (dirs === 8) {
      // 4方向映射到8方向
      var map8 = { south: 4, west: 6, east: 2, north: 0 };
      return map8[facing] !== undefined ? map8[facing] : 4;
    }
    return this.DIR_4_ROW[facing] !== undefined ? this.DIR_4_ROW[facing] : 0;
  },

  /**
   * NPC sprite 名到 walk sheet 名的映射
   * 用于 _spawnNPCs 中判断哪些 NPC 有精灵图
   */
  NPC_SPRITE_MAP: {
    'npc_male':   'npc_villager',  // 男性村民 → 村民精灵图
    'npc_female': 'npc_female',    // 女性 → 女性精灵图
    'npc_guard':  'npc_guard',     // 守卫 → 守卫精灵图
    'npc_child':  null,            // 小孩无精灵图，保持旧精灵
  }
};
