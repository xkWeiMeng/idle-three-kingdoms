#!/usr/bin/env node
/**
 * 装备数据生成器
 * 生成 360+ 装备模板，金字塔品质分布
 * 运行: node tools/gen_equipment_data.js > js/data/equipment.js
 */

// ── 属性范围定义 ──
const STAT_RANGES = {
  weapon: { 1: [3,8], 2: [8,15], 3: [15,25], 4: [25,40], 5: [40,60] },
  armor:  { 1: [3,8], 2: [8,15], 3: [15,25], 4: [25,40], 5: [40,60] },
  accessory: { 1: [15,40], 2: [40,75], 3: [75,125], 4: [125,200], 5: [200,300] },
  mount:  { 1: [2,5], 2: [5,10], 3: [10,16], 4: [16,25], 5: [25,35] }
};

const STAT_TYPE = { weapon: 'atk', armor: 'def', accessory: 'hp', mount: 'spd' };

// ── 装备模板定义 ──
// 格式: [id_suffix, name, emoji, description]

const WEAPONS = {
  1: [ // Q1 普通 (30) — 粗制武器、农具
    ['iron_sword', '铁剑', '🗡️', '普通的铁剑，聊胜于无'],
    ['wooden_staff', '木棍', '🪵', '路边捡的，勉强能用'],
    ['stone_hammer', '石锤', '🪨', '石头绑在棍子上'],
    ['bamboo_spear', '竹枪', '🎋', '削尖的竹竿'],
    ['bronze_knife', '铜刀', '🔪', '铜色已暗淡'],
    ['machete', '柴刀', '🪓', '砍柴用的，也能砍人'],
    ['short_dagger', '短匕', '🗡️', '藏在袖中的小刀'],
    ['rusty_sword', '锈剑', '⚔️', '太久没磨了'],
    ['wooden_bow', '木弓', '🏹', '弦快断了'],
    ['iron_fork', '铁叉', '🔱', '原来是干农活的'],
    ['blunt_axe', '钝斧', '🪓', '砍不动树，砍人凑合'],
    ['chopper', '砍刀', '🔪', '屠夫转行留下的'],
    ['bamboo_bow', '竹弓', '🏹', '竹子做的弓，弹性一般'],
    ['stone_spear', '石矛', '🔱', '远古时代的遗物'],
    ['iron_rod', '铁棍', '🪵', '直来直去，朴实无华'],
    ['bronze_hammer', '铜锤', '🔨', '沉甸甸的铜疙瘩'],
    ['farm_fork', '农叉', '🔱', '翻草用的三齿叉'],
    ['broken_blade', '断剑', '⚔️', '断成两截的剑'],
    ['dull_saber', '钝刀', '🔪', '砍了太多东西'],
    ['rough_spear', '粗矛', '🔱', '粗制滥造的长矛'],
    ['iron_whip', '铁鞭', '⛓️', '铁制软鞭'],
    ['bronze_ge', '铜戈', '⚔️', '上古兵器，已生锈'],
    ['willow_saber', '柳叶刀', '🗡️', '刀如柳叶，轻巧锋利'],
    ['bamboo_sword', '竹剑', '🗡️', '练剑用的，没什么杀伤力'],
    ['stone_axe', '石斧', '🪓', '原始人同款'],
    ['iron_awl', '铁锥', '🗡️', '尖锐但太短'],
    ['bone_knife', '骨刀', '🔪', '兽骨磨成的刀'],
    ['bronze_spear', '铜矛', '🔱', '军中制式武器'],
    ['wooden_mallet', '木槌', '🔨', '一锤子买卖'],
    ['sickle_blade', '镰刀', '🔪', '收割庄稼也收割敌人'],
  ],
  2: [ // Q2 精良 (24) — 制式军用兵器
    ['green_blade', '碧刃', '⚔️', '泛着绿光的利刃'],
    ['cold_iron_saber', '寒铁刀', '🔪', '寒气逼人的铁刀'],
    ['fine_steel_sword', '精钢剑', '🗡️', '百炼精钢铸就'],
    ['iron_spear', '铁枪', '🔱', '军中标准长枪'],
    ['black_iron_axe', '黑铁斧', '🪓', '沉重的黑铁巨斧'],
    ['flying_dagger', '飞刀', '🗡️', '百步穿杨'],
    ['double_edge_sword', '双刃剑', '⚔️', '两面都锋利'],
    ['iron_bow', '铁弓', '🏹', '铁臂才能拉开'],
    ['steel_whip', '钢鞭', '⛓️', '鞭鞭入肉'],
    ['crescent_blade', '偃月刀', '🔪', '月牙形大刀'],
    ['triple_blade', '三尖两刃刀', '⚔️', '三个尖，样式奇特'],
    ['short_halberd', '短戟', '🔱', '短兵接战利器'],
    ['war_hammer', '铁锤', '🔨', '力大者专用'],
    ['repeating_crossbow', '连弩', '🏹', '诸葛连弩的民间仿品'],
    ['steel_saber', '钢刀', '🔪', '削铁如泥，大概'],
    ['iron_ge', '铁戈', '⚔️', '勾割两用的古兵器'],
    ['wolf_mace', '狼牙棒', '🔨', '满是尖刺的棍棒'],
    ['ring_saber', '环首刀', '🔪', '汉军制式佩刀'],
    ['long_axe', '长柄斧', '🪓', '劈山开路'],
    ['swallow_saber', '燕翎刀', '🗡️', '轻如燕翼，快如闪电'],
    ['snake_spear', '蛇脊矛', '🔱', '矛身如蛇脊弯曲'],
    ['hook_sword', '钩镰剑', '⚔️', '可勾可斩'],
    ['judge_pen', '判官笔', '🖊️', '文人也能杀人'],
    ['meteor_hammer_chain', '流星锤', '⛓️', '一条铁链系铁球'],
  ],
  3: [ // Q3 稀有 (16) — 精心锻造的名器
    ['frost_spear', '霜寒枪', '🔱', '枪尖凝霜，寒气逼人'],
    ['flame_saber', '烈焰刀', '🔪', '出鞘时仿佛有火焰'],
    ['dark_iron_sword', '玄铁剑', '⚔️', '玄铁锻造，重达百斤'],
    ['silver_moon_bow', '银月弓', '🏹', '月光下闪烁银辉'],
    ['thunder_hammer', '雷霆锤', '🔨', '一锤下去地动山摇'],
    ['jade_blood_sword', '碧血剑', '🗡️', '剑身泛着碧绿血光'],
    ['ice_lance', '寒冰枪', '🔱', '枪身结满寒冰'],
    ['wind_axe', '裂风斧', '🪓', '挥动时带起狂风'],
    ['purple_whip', '紫电鞭', '⛓️', '鞭梢带着紫色电弧'],
    ['celestial_bow', '天狼弓', '🏹', '箭如天狼，百发百中'],
    ['hundred_forge_saber', '百炼钢刀', '🔪', '千锤百炼的好刀'],
    ['meteor_hammer', '赤铜锤', '🔨', '赤铜浇铸的重锤'],
    ['red_bronze_halberd', '赤铜戟', '🔱', '红光闪闪的方戟'],
    ['swan_sword', '惊鸿剑', '🗡️', '剑出如惊鸿一瞥'],
    ['army_breaker', '破军枪', '🔱', '破军杀阵的霸道长枪'],
    ['spirit_snake_saber', '灵蛇刀', '🔪', '刀法如灵蛇出洞'],
  ],
  4: [ // Q4 史诗 (10) — 有名有姓的史诗兵器
    ['sunset_bow', '落日弓', '🏹', '夕阳余晖凝聚的弓'],
    ['seven_star_blade', '七星刀', '🗡️', '王允献给曹操的宝刀'],
    ['fish_gut_sword', '鱼肠剑', '⚔️', '专诸刺王僚之剑'],
    ['dragon_spring_sword', '龙泉剑', '🗡️', '欧冶子所铸名剑'],
    ['tangxi_sword', '棠溪剑', '⚔️', '天下之剑韩为众'],
    ['taia_sword', '太阿剑', '🗡️', '楚国镇国之宝'],
    ['chunjun_sword', '纯钧剑', '⚔️', '薄如蝉翼，光如秋水'],
    ['hanguang_sword', '含光剑', '🗡️', '无形之剑，视之不见'],
    ['chengying_sword', '承影剑', '⚔️', '日光下只见影子'],
    ['pine_pattern_sword', '松纹剑', '🗡️', '剑身遍布松纹'],
  ],
  5: [ // Q5 传说 (8) — 三国/历史传说级兵器
    ['fang_tian_halberd', '方天画戟(复刻版)', '🔥', '吕布同款限量复刻'],
    ['green_dragon_blade', '青龙偃月刀', '🔪', '关羽关二爷的标配'],
    ['zhang_ba_snake_spear', '丈八蛇矛', '🔱', '张飞三爷的暴脾气'],
    ['twin_swords', '雌雄双剑', '⚔️', '刘备的贴身双剑'],
    ['qinggang_sword', '青釭剑', '🗡️', '曹操佩剑，削铁如泥'],
    ['chixiao_sword', '赤霄剑', '🔥', '汉高祖斩白蛇之剑'],
    ['ganjiang_moye', '干将莫邪', '⚔️', '夫妻铸剑，情比金坚'],
    ['goujian_sword', '越王勾践剑', '🗡️', '千年不锈的王者之剑'],
  ]
};

const ARMORS = {
  1: [ // Q1 普通 (30)
    ['cloth_armor', '布衣', '👕', '比没穿好一点点'],
    ['straw_coat', '草衣', '🧥', '稻草编的，防水防寒就别想了'],
    ['hemp_shirt', '麻布衫', '👕', '粗糙但结实'],
    ['rough_robe', '粗布袍', '🧥', '打了好多补丁'],
    ['old_war_coat', '破旧战衣', '👕', '不知道谁穿剩下的'],
    ['bamboo_armor', '竹甲', '🎋', '竹片编成的铠甲'],
    ['rattan_vest', '藤衣', '🧥', '藤条编织，轻便透气'],
    ['wooden_shield', '木盾', '🛡️', '挡挡箭还行'],
    ['straw_bracer', '草编护腕', '👕', '聊胜于无的护腕'],
    ['cloth_robe', '布裳', '🧥', '普通的衣裳'],
    ['rough_mail', '粗布甲', '👕', '布上缝了几块铁片'],
    ['short_jacket', '短衫', '🧥', '方便活动'],
    ['hemp_robe', '麻衣', '👕', '苦行僧同款'],
    ['cotton_robe', '棉袍', '🧥', '冬天还算暖和'],
    ['hide_shirt', '兽皮衫', '🦺', '野兽皮做的上衣'],
    ['sheepskin_vest', '羊皮褂', '🧥', '牧羊人的装备'],
    ['rough_leather_vest', '粗皮背心', '🦺', '简单的皮革护甲'],
    ['old_iron_helm', '旧铁盔', '🪖', '生锈的头盔'],
    ['plank_armor', '木板甲', '🛡️', '木板钉在一起'],
    ['bamboo_shield', '竹编盾', '🛡️', '轻便但易碎'],
    ['worn_bronze_armor', '破铜甲', '🦺', '铜片都快掉了'],
    ['military_hat', '军用斗笠', '🪖', '挡太阳更实用'],
    ['patched_robe', '补丁战袍', '🧥', '补了又补的战袍'],
    ['cloth_mail', '布面甲', '🦺', '布包着的铁片'],
    ['raw_shoulder', '生皮护肩', '🦺', '未鞣制的皮革'],
    ['bronze_plate', '铜片甲', '🦺', '铜片缝在布上'],
    ['old_uniform', '旧军服', '👕', '退役军人的遗物'],
    ['bone_armor', '兽骨护甲', '🦺', '骨头做的护甲，有点瘆人'],
    ['straw_cloak', '稻草蓑衣', '🧥', '防雨不防剑'],
    ['training_garb', '练功服', '👕', '习武之人的日常'],
  ],
  2: [ // Q2 精良 (24)
    ['leather_armor', '皮甲', '🦺', '耐用的皮革护甲'],
    ['hard_leather', '硬皮甲', '🦺', '加硬处理的皮甲'],
    ['iron_bound_leather', '包铁皮甲', '🦺', '皮甲上加了铁条'],
    ['bronze_armor', '铜甲', '🛡️', '铜制的正规铠甲'],
    ['scale_leather', '鳞片皮甲', '🦺', '皮片层叠如鳞'],
    ['cowhide_armor', '牛皮铠', '🦺', '厚实的牛皮铠甲'],
    ['bronze_helm', '铜盔', '🪖', '铜铸的头盔'],
    ['iron_bracer', '铁护腕', '🦺', '保护手腕的铁甲'],
    ['bronze_pauldron', '铜护肩', '🦺', '铜制肩甲'],
    ['chain_greaves', '链甲护胫', '⛓️', '保护小腿的链甲'],
    ['steel_helm', '钢盔', '🪖', '坚固的钢制头盔'],
    ['iron_plate_mail', '铁片甲', '🦺', '铁片编成的铠甲'],
    ['military_iron_armor', '军用铁甲', '🛡️', '军队标配铠甲'],
    ['heart_mirror', '护心镜', '🛡️', '护在胸口的铜镜'],
    ['iron_knee_guard', '铁护膝', '🦺', '保护膝盖'],
    ['iron_pauldron', '铁肩铠', '🦺', '铁制肩甲'],
    ['lamellar_armor', '札甲', '🦺', '甲片层层叠叠'],
    ['ring_armor', '指环铠', '⛓️', '铁环串联的铠甲'],
    ['round_shield', '圆盾', '🛡️', '标准军用圆盾'],
    ['iron_face_guard', '铁面甲', '🪖', '保护面部的铁片'],
    ['infantry_armor', '马步甲', '🦺', '步兵专用铠甲'],
    ['willow_leaf_armor', '柳叶甲', '🦺', '甲片如柳叶般排列'],
    ['bronze_scale', '铜鳞甲', '🛡️', '铜鳞片缝制的铠甲'],
    ['military_bracer', '军用护臂', '🦺', '军队制式护臂'],
  ],
  3: [ // Q3 稀有 (16)
    ['chain_mail', '锁子甲', '⛓️', '铁环编织的防御'],
    ['fine_steel_armor', '精钢铠', '🛡️', '精钢锻造，坚如磐石'],
    ['bright_armor', '明光甲', '🛡️', '反射阳光，敌人睁不开眼'],
    ['dark_steel_armor', '乌钢铠', '🛡️', '乌黑发亮的钢甲'],
    ['iron_scale_armor', '鱼鳞铁甲', '🦺', '铁鳞密如鱼甲'],
    ['phoenix_wing_armor', '凤翼铠', '🛡️', '肩甲如凤凰展翅'],
    ['hundred_forge_armor', '百炼甲', '🛡️', '百炼精铁铸就'],
    ['tiger_shield', '虎头盾', '🛡️', '盾面雕着虎头'],
    ['dark_iron_bracer', '玄铁护腕', '⛓️', '玄铁打造的护腕'],
    ['silver_mail', '银丝甲', '🛡️', '银丝编织，华丽且坚固'],
    ['cold_iron_armor', '寒铁铠', '🛡️', '触手冰凉的铁甲'],
    ['thunder_pattern_armor', '雷纹甲', '🛡️', '刻满雷纹的铠甲'],
    ['tortoise_shield', '玄武盾', '🛡️', '以玄武图样装饰的重盾'],
    ['purple_gold_pauldron', '紫金肩铠', '🛡️', '紫金打造的肩甲'],
    ['nine_ring_armor', '九连环甲', '⛓️', '九层铁环互锁'],
    ['frost_iron_armor', '霜铁铠', '🛡️', '铁甲凝霜，寒意阵阵'],
  ],
  4: [ // Q4 史诗 (10)
    ['plate_armor', '玄铁重甲', '🛡️', '坚不可摧的铠甲'],
    ['rattan_armor', '藤甲', '🧥', '南蛮秘制，刀枪不入'],
    ['tang_lion_armor', '唐猊铠', '🛡️', '仿唐朝名铠，威风凛凛'],
    ['white_silver_armor', '白银战铠', '🛡️', '纯银打造，驱邪避凶'],
    ['qilin_armor', '麒麟甲', '🛡️', '麒麟纹样的至高铠甲'],
    ['tiger_guard_armor', '虎贲铠', '🛡️', '虎贲军精锐装备'],
    ['phoenix_plume_armor', '凤翎铠', '🛡️', '以凤翎装饰的华丽铠甲'],
    ['fine_iron_heavy', '镔铁重铠', '🛡️', '镔铁锻造的重装铠甲'],
    ['mountain_pattern', '山文甲', '🛡️', '甲片呈山字纹排列'],
    ['infantry_heavy', '步人甲', '🛡️', '宋代重装步兵的终极铠甲'],
  ],
  5: [ // Q5 传说 (8)
    ['dragon_scale', '龙鳞铠', '🐉', '传说中龙鳞锻造'],
    ['nine_li_armor', '九黎战甲', '🛡️', '蚩尤九黎族至宝'],
    ['white_tiger_armor', '白虎铠', '🐅', '四灵白虎之力护体'],
    ['vermillion_bird_armor', '朱雀铠甲', '🐦', '朱雀之火焚尽一切'],
    ['tortoise_divine_armor', '玄武神甲', '🐢', '玄武真灵所化'],
    ['gold_silk_soft_armor', '金丝软甲', '🛡️', '金蚕丝织就，轻薄刀枪不入'],
    ['silkworm_robe', '天蚕宝衣', '🧥', '天蚕丝所织，举世无双'],
    ['cold_jade_armor', '寒玉铠', '💎', '寒玉打造，寒气护体'],
  ]
};

const ACCESSORIES = {
  1: [ // Q1 普通 (30)
    ['jade_pendant', '碎玉佩', '💎', '碎了一半的玉佩'],
    ['copper_coin_string', '铜钱串', '🪙', '几枚铜钱串一起'],
    ['straw_bracelet', '草绳手链', '📿', '编了个结当饰品'],
    ['rough_stone_ring', '粗石戒', '💍', '石头磨的戒指'],
    ['wooden_bead_necklace', '木珠项链', '📿', '木珠串成的项链'],
    ['bamboo_hairpin', '竹节发簪', '🪭', '竹子削的簪子'],
    ['cracked_bell', '破铜铃', '🔔', '铃声已哑'],
    ['stone_pendant', '石头坠子', '💎', '好看的石头'],
    ['fang_necklace', '兽牙项链', '📿', '野兽的牙齿'],
    ['hemp_wristband', '麻绳腕带', '📿', '麻绳编的护腕'],
    ['bronze_buckle_belt', '铜扣腰带', '📿', '有个铜扣的腰带'],
    ['old_headband', '旧头巾', '👑', '颜色都褪了'],
    ['straw_charm', '草编护符', '🪬', '不知道谁编的'],
    ['cracked_jade', '破寒玉', '💎', '裂了的玉'],
    ['ink_stone_earring', '石墨耳环', '💍', '石墨磨成的耳环'],
    ['bronze_bracer', '铜片护腕', '📿', '铜片弯成的护腕'],
    ['wooden_fish_charm', '木鱼坠', '🔔', '小和尚送的'],
    ['clay_ring', '陶石指环', '💍', '陶土烧制的指环'],
    ['cloth_charm', '布袋护符', '🪬', '装着几颗米的布袋'],
    ['bronze_bell_pendant', '铜铃腰坠', '🔔', '走路叮当响'],
    ['bamboo_bead_bracelet', '竹珠手串', '📿', '竹子做的手串'],
    ['rough_belt', '粗绳腰带', '📿', '实用主义的腰带'],
    ['stone_seal', '石质印章', '📜', '刻了个歪歪扭扭的字'],
    ['old_pouch', '旧锦囊', '🪬', '妙计没了，空的'],
    ['bronze_crown', '铜发冠', '👑', '铜做的发冠'],
    ['bone_bracelet', '兽骨手环', '📿', '兽骨磨成的手环'],
    ['wooden_talisman', '木刻符牌', '🪬', '刻了奇怪符号的木牌'],
    ['old_helmet', '破旧头盔', '🪖', '不知道能不能挡一下'],
    ['bronze_horn_ornament', '铜角饰', '💎', '铜做的角形装饰'],
    ['ceramic_pendant', '陶瓷挂坠', '💎', '烧制精美但很脆'],
  ],
  2: [ // Q2 精良 (24)
    ['silver_ring', '银戒指', '💍', '刻着奇怪花纹'],
    ['jade_bracelet', '玉石手镯', '💎', '温润的玉石手镯'],
    ['bronze_amulet', '铜护身符', '🪬', '铜铸的护身符'],
    ['silver_hairpin', '银发簪', '🪭', '银制发簪'],
    ['iron_waist_token', '铁质腰牌', '📿', '军中的身份牌'],
    ['leather_bracer', '皮质护腕', '📿', '精制皮革护腕'],
    ['agate_beads', '玛瑙串珠', '📿', '玛瑙色泽艳丽'],
    ['bronze_mirror', '铜镜', '🪞', '磨得锃亮的铜镜'],
    ['silver_belt_buckle', '银质腰扣', '📿', '银制的腰带扣'],
    ['jadeite_pendant', '翡翠坠', '💎', '翠绿欲滴'],
    ['silver_moon_crown', '银月冠', '👑', '月牙形的银冠'],
    ['amber_charm', '琥珀挂件', '💎', '琥珀中困着一只虫'],
    ['bronze_dragon_pendant', '铜龙佩', '💎', '铜铸龙形佩饰'],
    ['silver_phoenix_pin', '银凤钗', '🪭', '银制凤凰钗'],
    ['jade_seal', '玉石印章', '📜', '刻了主人名字的玉印'],
    ['jadeite_bracelet', '翡翠手镯', '💎', '翡翠质地的手镯'],
    ['bronze_tiger_tally', '铜虎符', '📜', '将军调兵的凭证'],
    ['silver_earring', '银耳环', '💍', '精致的银耳环'],
    ['coral_pendant', '珊瑚坠', '📿', '深海珊瑚打磨而成'],
    ['bronze_sumeru_ring', '铜须弥环', '💍', '刻着经文的铜环'],
    ['white_jade_pendant', '白玉佩', '💎', '温润如脂的白玉'],
    ['silver_pouch', '银质锦囊', '🪬', '银丝编织的锦囊'],
    ['glass_bead_string', '琉璃珠串', '📿', '五彩斑斓的琉璃珠'],
    ['iron_helmet', '铁兜鍪', '🪖', '军用制式头盔'],
  ],
  3: [ // Q3 稀有 (16)
    ['gold_belt', '黄金腰带', '👑', '有钱人的腰带'],
    ['gold_silk_crown', '金丝发冠', '👑', '金丝编成的发冠'],
    ['jade_pendant_fine', '翡翠玉佩', '💎', '上等翡翠雕琢的玉佩'],
    ['amethyst_pendant', '紫水晶坠', '💎', '紫光流转的水晶'],
    ['red_gold_bracelet', '赤金手镯', '💎', '赤金打造的手镯'],
    ['silver_tiger_tally', '白银虎符', '📜', '大将军的虎符'],
    ['jade_ruyi', '玉如意', '💎', '事事如意的玉器'],
    ['gold_thread_crown', '金缕冠', '👑', '金线编成的华冠'],
    ['jade_vase', '碧玉净瓶', '💎', '碧玉雕琢的净瓶'],
    ['purple_gold_bell', '紫金铃铛', '🔔', '紫金铸的铃铛'],
    ['silver_moon_charm', '银月护符', '🪬', '银月形状的护符'],
    ['glass_pearl', '琉璃宝珠', '💎', '琉璃制的宝珠'],
    ['gold_dragon_pendant', '金龙佩', '💎', '纯金铸造的龙佩'],
    ['jade_bead_bracelet', '翠玉手串', '📿', '翠玉串成的手串'],
    ['red_gold_bracer', '赤金护腕', '📿', '赤金打造的护腕'],
    ['silver_phoenix_crown', '银凤冠', '👑', '银凤展翅的头冠'],
  ],
  4: [ // Q4 史诗 (10)
    ['ancient_seal', '传国玉玺(仿品)', '📜', '"受命于天"'],
    ['heshi_bi_fragment', '和氏璧(残片)', '💎', '楚人卞和泣血的宝玉残片'],
    ['night_pearl', '夜明珠', '💎', '暗夜中如月照亮'],
    ['gold_jade_fragment', '金缕玉衣(碎片)', '💎', '帝王陪葬品的残片'],
    ['dragon_saliva_pearl', '龙涎珠', '💎', '传说龙的涎水凝结而成'],
    ['phoenix_jade', '凤凰玉佩', '💎', '雕琢着凤凰的美玉'],
    ['nine_dragon_mirror', '九龙护心镜', '🪞', '九条金龙环绕的铜镜'],
    ['taiji_jade', '太极阴阳玉', '💎', '黑白双玉太极图样'],
    ['seven_star_pearl', '七星宝珠', '💎', '七颗宝珠连成北斗形'],
    ['blood_jade', '血玉髓', '💎', '血红色的上古玉髓'],
  ],
  5: [ // Q5 传说 (8)
    ['phoenix_plume', '凤羽冠', '🦚', '凤凰羽毛编织'],
    ['heshi_bi', '和氏璧', '💎', '完璧归赵的绝世宝玉'],
    ['marquis_pearl', '随侯珠', '💎', '随侯救蛇得到的神珠'],
    ['gold_jade_suit', '金缕玉衣', '💎', '帝王才配得上的金玉衣'],
    ['kunlun_jade_ring', '昆仑玉环', '💎', '昆仑仙山的环形美玉'],
    ['nine_heaven_charm', '九天玄女符', '🪬', '九天玄女赐予黄帝的符'],
    ['dragon_blood_amber', '龙血琥珀', '💎', '封印着远古龙血的琥珀'],
    ['pangu_relic_jade', '盘古遗玉', '💎', '据说是开天辟地留下的碎片'],
  ]
};

const MOUNTS = {
  1: [ // Q1 普通 (30)
    ['donkey', '小毛驴', '🫏', '慢但忠诚'],
    ['old_ox', '老黄牛', '🐂', '任劳任怨，不过太慢了'],
    ['thin_horse', '瘦马', '🐴', '瘦骨嶙峋的马'],
    ['mule', '骡子', '🫏', '马和驴的混血'],
    ['water_buffalo', '水牛', '🐂', '擅长游泳不擅长跑步'],
    ['goat', '山羊', '🐏', '只能骑着翻山'],
    ['nag', '驽马', '🐴', '跑不快的马'],
    ['old_cart', '破车', '🛒', '轮子都歪了'],
    ['bamboo_raft', '竹筏', '🛶', '只能水上用'],
    ['grey_donkey', '灰驴', '🫏', '灰不溜秋的驴'],
    ['spotted_donkey', '花毛驴', '🫏', '花里胡哨的驴'],
    ['old_mule', '老骡', '🫏', '年纪大了的骡子'],
    ['short_leg_horse', '矮脚马', '🐴', '腿短跑不快'],
    ['yak', '牦牛', '🐂', '高原特产'],
    ['fat_pig', '肥猪', '🐷', '骑上去很有面子(?)'],
    ['young_ox', '黄牛犊', '🐂', '小牛，还在长'],
    ['wooden_cart', '木推车', '🛒', '人力驱动'],
    ['wheelbarrow', '独轮车', '🛒', '平衡是个大问题'],
    ['bamboo_cart', '竹排车', '🛒', '竹子做的车'],
    ['ox_cart', '老牛车', '🐂', '牛拉的车，比走路还慢'],
    ['lame_donkey', '瘸腿驴', '🫏', '走路一瘸一拐'],
    ['striped_donkey', '斑驴', '🫏', '花纹独特的驴'],
    ['dirt_horse', '土马', '🐴', '土里刨食长大的马'],
    ['wild_donkey', '野驴', '🫏', '野性未驯'],
    ['pack_horse', '驮马', '🐴', '驮东西比骑人强'],
    ['alpaca', '草泥马', '🦙', '表情很有内容'],
    ['plank_cart', '板车', '🛒', '拉货比骑人合适'],
    ['bald_horse', '秃毛马', '🐴', '毛都快掉光了'],
    ['plow_ox', '耕牛', '🐂', '犁地是专业的'],
    ['iron_hoof_donkey', '铁蹄驴', '🫏', '蹄子倒是挺硬'],
  ],
  2: [ // Q2 精良 (24)
    ['war_horse', '战马', '🐴', '标准坐骑'],
    ['mongol_horse', '蒙古马', '🐴', '耐力强的草原马'],
    ['hequ_horse', '河曲马', '🐴', '西北名马'],
    ['dayuan_horse', '大宛马', '🐴', '西域大宛国名马'],
    ['black_mane', '黑鬃马', '🐴', '黑色鬃毛的骏马'],
    ['chestnut_horse', '枣红马', '🐴', '枣红色的骏马'],
    ['white_dragon_horse', '白龙马', '🐴', '通体雪白'],
    ['grey_cloud_horse', '灰云马', '🐴', '灰色如云'],
    ['iron_cavalry_colt', '铁骑驹', '🐴', '军用训练驹'],
    ['fine_steed', '良驹', '🐴', '品种优良的马'],
    ['dark_cloud_horse', '乌云马', '🐴', '全身漆黑如乌云'],
    ['chestnut_colt', '栗色马', '🐴', '栗色的骏马'],
    ['silver_mane', '银鬃马', '🐴', '银白色鬃毛'],
    ['spotted_horse', '花斑马', '🐴', '白底黑斑的马'],
    ['iron_hoof', '铁蹄马', '🐴', '蹄如铁打'],
    ['red_mane', '红鬃马', '🐴', '红色鬃毛飘逸'],
    ['fire_cloud_horse', '火云马', '🐴', '红如火云'],
    ['snow_flower_horse', '雪花马', '🐴', '白色带雪花纹'],
    ['ink_jade_horse', '墨玉马', '🐴', '黑如墨玉'],
    ['bronze_hoof', '铜蹄马', '🐴', '蹄子铜色锃亮'],
    ['wolf_runner', '苍狼马', '🐴', '跑得像狼一样快'],
    ['moon_gazer', '望月马', '🐴', '夜晚总爱抬头看月亮'],
    ['swallow_colt', '飞燕驹', '🐴', '跑起来像燕子飞'],
    ['qi_horse', '骐马', '🐴', '有花纹的良马'],
  ],
  3: [ // Q3 稀有 (16)
    ['shadow_steed', '影驹', '🏇', '跑得飞快'],
    ['thousand_li', '千里马', '🏇', '日行千里'],
    ['blood_sweat', '汗血马', '🏇', '汗如血色的宝马'],
    ['snow_treader', '踏雪马', '🏇', '踏雪无痕'],
    ['wind_chaser', '追风马', '🏇', '追风而行'],
    ['night_illuminator', '照夜白', '🏇', '唐太宗爱驹'],
    ['jade_flower', '玉花骢', '🏇', '唐玄宗御马'],
    ['shifachi', '什伐赤', '🏇', '昭陵六骏之一'],
    ['teqinbiao', '特勤骠', '🏇', '昭陵六骏之一'],
    ['dark_zhui', '玄骓', '🏇', '黑色的骏马'],
    ['white_hoof', '白蹄乌', '🏇', '昭陵六骏之一'],
    ['salusi', '飒露紫', '🏇', '昭陵六骏之一'],
    ['green_zhui', '青骓', '🏇', '昭陵六骏之一'],
    ['quanmao', '拳毛䯄', '🏇', '昭陵六骏之一'],
    ['soaring_yellow', '飞黄', '🏇', '飞黄腾达的飞黄'],
    ['dragon_colt', '龙驹', '🏇', '据说有龙的血统'],
  ],
  4: [ // Q4 史诗 (10)
    ['di_lu', '的卢马', '🐎', '妨不妨主另说'],
    ['claw_yellow', '爪黄飞电', '🐎', '曹操的御用坐骑'],
    ['shadow_vanisher', '绝影', '🐎', '绝尘而去不见影'],
    ['blood_sweat_treasure', '汗血宝马', '🐎', '西域进贡的极品汗血马'],
    ['wu_zhui', '乌骓', '🐎', '项羽的爱驹'],
    ['yellow_horse', '騧骝', '🐎', '黄色的骏马良驹'],
    ['yellow_pinto', '黄骠马', '🐎', '秦叔宝的坐骑'],
    ['flying_lightning', '飞电', '🐎', '快如闪电'],
    ['purple_xing', '紫骍', '🐎', '紫红色的骏马'],
    ['white_justice', '白义', '🐎', '周穆王八骏之一'],
  ],
  5: [ // Q5 传说 (8)
    ['red_hare', '赤兔马', '🔴', '千里追风'],
    ['juedi', '绝地', '🐎', '周穆王八骏之首'],
    ['huali', '骅骝', '🐎', '千里马的代名词'],
    ['green_ear', '绿耳', '🐎', '周穆王八骏之一'],
    ['fan_yu', '翻羽', '🐎', '快过飞鸟'],
    ['ben_xiao', '奔宵', '🐎', '日夜奔驰不歇'],
    ['chao_ying', '超影', '🐎', '追日逐影'],
    ['teng_wu', '腾雾', '🐎', '腾云驾雾'],
  ]
};

// ── 生成 EquipmentData 数组 ──
function generateEquipmentData() {
  const allItems = [];
  const types = { weapon: WEAPONS, armor: ARMORS, accessory: ACCESSORIES, mount: MOUNTS };

  for (const [type, qualityMap] of Object.entries(types)) {
    for (const [quality, items] of Object.entries(qualityMap)) {
      const q = parseInt(quality);
      const statType = STAT_TYPE[type];
      const statRange = STAT_RANGES[type][q];

      for (const [idSuffix, name, emoji, description] of items) {
        allItems.push({
          id: `equip_${idSuffix}`,
          name,
          type,
          quality: q,
          statType,
          statRange,
          description,
          emoji
        });
      }
    }
  }

  return allItems;
}

// ── 输出 ──
function main() {
  const items = generateEquipmentData();

  // Check for duplicate IDs
  const idSet = new Set();
  const dupes = [];
  for (const item of items) {
    if (idSet.has(item.id)) dupes.push(item.id);
    idSet.add(item.id);
  }
  if (dupes.length > 0) {
    console.error('ERROR: Duplicate IDs found:', dupes);
    process.exit(1);
  }

  // Count by quality
  const counts = {};
  for (const item of items) {
    const key = `Q${item.quality}_${item.type}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  // Output summary to stderr
  console.error(`Total equipment templates: ${items.length}`);
  console.error('Distribution:');
  for (let q = 1; q <= 5; q++) {
    const qItems = items.filter(i => i.quality === q);
    console.error(`  Q${q}: ${qItems.length} (${['weapon','armor','accessory','mount'].map(t => `${t}:${qItems.filter(i=>i.type===t).length}`).join(', ')})`);
  }
  console.error('(+ 12 mythic in equipment-sets.js = ' + (items.length + 12) + ' total)');

  // Build output
  let out = `/**
 * 装备数据表
 * 4 types (weapon/armor/accessory/mount) × 6 qualities
 * 金字塔分布：Q1 最多，Q5 最少，Q6 神话在 equipment-sets.js
 * 总计 ${items.length} 件普通装备 + 12 件神话装备 = ${items.length + 12} 件
 *
 * 自动生成 — 请勿手动编辑此数组
 * 生成命令: node tools/gen_equipment_data.js > js/data/equipment.js
 */
const EquipmentData = [\n`;

  // Group by type then quality for readability
  const typeOrder = ['weapon', 'armor', 'accessory', 'mount'];
  const typeNames = { weapon: '武器 (weapon)', armor: '防具 (armor)', accessory: '饰品 (accessory)', mount: '坐骑 (mount)' };
  const qualityNames = { 1: '普通', 2: '精良', 3: '稀有', 4: '史诗', 5: '传说' };
  const statNames = { weapon: 'atk', armor: 'def', accessory: 'hp', mount: 'spd' };

  for (const type of typeOrder) {
    out += `\n  // ========== ${typeNames[type]} — primary stat: ${statNames[type]} ==========\n`;
    for (let q = 1; q <= 5; q++) {
      const qItems = items.filter(i => i.type === type && i.quality === q);
      if (qItems.length === 0) continue;
      out += `\n  // --- Q${q} ${qualityNames[q]} (${qItems.length}件) ---\n`;
      for (const item of qItems) {
        out += `  { id: '${item.id}', name: '${item.name}', type: '${item.type}', quality: ${item.quality}, statType: '${item.statType}', statRange: [${item.statRange.join(', ')}], description: '${item.description}', emoji: '${item.emoji}' },\n`;
      }
    }
  }

  out += `];\n`;

  // Constants
  out += `
// Equipment max reinforcement level by quality
const EquipMaxLevel = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 25, 6: 30 };

// Equipment sell price: quality × 50 (mythic unsellable)
const EquipSellPrice = { 1: 50, 2: 100, 3: 150, 4: 200, 5: 250, 6: 0 };

// Inventory expansion constants
const INVENTORY_DEFAULTS = {
  BASE_SLOTS: 100,            // 新存档默认背包容量
  MAX_EXPAND: 90,             // 金币最大可扩展格数
  EXPAND_STEP: 10,            // 每次扩展增加格数
  EXPAND_BASE_COST: 1000,     // 首次扩展费用（金币）
  EXPAND_COST_MULTIPLIER: 1.5 // 每次扩展费用递增系数
};

// Equipment type to stat mapping
const EquipTypeToStat = {
  weapon: 'atk',
  armor: 'def',
  accessory: 'hp',
  mount: 'spd'
};
`;

  console.log(out);
}

main();
