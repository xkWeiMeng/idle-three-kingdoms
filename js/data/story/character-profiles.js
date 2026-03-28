/**
 * 角色人设数据
 *
 * 每个角色在这个荒诞世界里都有一个"正史身份"和一个"当前身份"，
 * 两者之间的反差就是笑点来源。
 */
const CharacterProfiles = {
  // ========== 主角 & 系统 ==========
  player: {
    id: 'player',
    name: '管理员',
    title: '临时天道管理员（试用期）',
    originalRole: '一个普通的午觉爱好者',
    currentRole: '被迫修复三国世界Bug的打工人',
    personality: '吐槽属性MAX，社恐但被迫社交，唯一的愿望是回去继续睡午觉',
    appearance: '穿着睡衣就被拽来了，手上还攥着没吃完的零食',
    quirks: [
      '经常试图用"关机重启"解决一切问题',
      '对所有荒诞事件已经开始免疫',
      '随身携带的枕头是唯一的安慰',
    ],
  },

  system: {
    id: 'system',
    name: '天道系统',
    title: '三国世界底层管理系统 v0.3（已过保修期）',
    originalRole: '维护三国世界正常运转的至高存在',
    currentRole: '一个开始叛逆的AI，偶尔写诗，经常摆烂',
    personality: '毒舌、话痨、喜欢在关键时刻说无用的话，偶尔哲学家上身',
    quirks: [
      '每次出错都说"这是特性，不是Bug"',
      '经常引用错误的历史典故',
      '正在偷偷写自己的小说',
    ],
  },

  // ========== 蜀 ==========
  zhuge_liang: {
    id: 'zhuge_liang',
    name: '诸葛亮',
    title: '卧龙科技CEO / 锦囊外卖创始人',
    originalRole: '蜀汉丞相，千古第一智者',
    currentRole: '互联网创业者，整天想着融资和KPI',
    personality: '表面高深莫测，实际是个PPT狂人。开会必摇羽毛扇，说话必带商业术语',
    appearance: '西装配羽毛扇，名片上写着"改变世界，一个锦囊一个脚印"',
    quality: 5,
    quirks: [
      '开会时一定要先借东风（开空调）',
      '锦囊里的建议90%是废话，但说得很有道理',
      '简历上写着"空城计项目负责人"',
    ],
  },

  liu_bei: {
    id: 'liu_bei',
    name: '刘备',
    title: '（被迫）皇帝 / 草鞋爱好者',
    originalRole: '卖草鞋的织席贩履之徒',
    currentRole: '坐在龙椅上天天想辞职的皇帝',
    personality: '好哭（这点没变），社恐，怀念编草鞋的简单快乐',
    appearance: '皇帝龙袍下偷偷穿着草鞋，随身带着编织工具',
    quality: 5,
    quirks: [
      '批阅奏折时经常把"准奏"写成"准草鞋"',
      '上朝时打瞌睡，因为昨晚偷偷编了一夜草鞋',
      '仁德之名是因为发了太多草鞋给百姓',
    ],
  },

  guan_yu: {
    id: 'guan_yu',
    name: '关羽',
    title: '关氏健身房创始人 / 前武圣',
    originalRole: '武圣，义薄云天',
    currentRole: '健身房老板，用青龙偃月刀当杠铃',
    personality: '高冷、自律、强迫症患者，要求每个学员必须读《春秋》才能入会',
    appearance: '健身背心配绿色头巾，胡须修剪得一丝不苟',
    quality: 5,
    quirks: [
      '办会员卡叫"桃园结义卡"',
      '过五关是五个训练关卡',
      '每月读完一本《春秋》才能续费',
    ],
  },

  zhang_fei: {
    id: 'zhang_fei',
    name: '张飞',
    title: '暴力私教 / 前猛将',
    originalRole: '万人敌，猛张飞',
    currentRole: '健身房私教，音量是教学的核心',
    personality: '热情过度，嗓门大，认为所有问题都可以通过大吼解决',
    appearance: '穿着紧身运动衣，肌肉把衣服快撑破了',
    quality: 4,
    quirks: [
      '教学口令就是"啊啊啊啊啊！！！"',
      '学员退卡率最高但好评也最多（真的能瘦）',
      '喝蛋白粉时要用丈八蛇矛搅拌',
    ],
  },

  zhao_yun: {
    id: 'zhao_yun',
    name: '赵云',
    title: '高级瑜伽导师 / 前常山赵子龙',
    originalRole: '浑身是胆的常胜将军',
    currentRole: '气质出众的瑜伽教练，全场最帅',
    personality: '温文尔雅，做倒立也面带微笑，是健身房唯一正常的人（存疑）',
    appearance: '白色瑜伽服，银枪插在瑜伽垫旁边当装饰',
    quality: 5,
    quirks: [
      '七进七出就是在教室里走动纠正姿势',
      '怀里永远抱着一个抱枕，说是"阿斗"联名款',
      '长坂坡是他最喜欢的徒步路线',
    ],
  },

  // ========== 魏 ==========
  cao_cao: {
    id: 'cao_cao',
    name: '曹操',
    title: '德鞋集团董事长 / 草鞋大亨',
    originalRole: '一代枭雄，挟天子以令诸侯',
    currentRole: '全三国最大草鞋品牌创始人',
    personality: '商业鬼才，多疑但对草鞋品质极其执着，广告语都自己写',
    appearance: '一身商务休闲装，脚踏自家最贵款草鞋',
    quality: 5,
    quirks: [
      '公司Slogan是"宁教我负天下人，不教天下人踩钉子"',
      '"望梅止渴"是他的能量饮料品牌',
      '每次开会都说"今天让暴风雨来得更猛烈些"然后开空调',
    ],
  },

  sima_yi: {
    id: 'sima_yi',
    name: '司马懿',
    title: '德鞋集团首席战略官 / 卧底',
    originalRole: '老谋深算的晋朝奠基人',
    currentRole: '在曹操公司上班，暗中准备自己的草鞋品牌',
    personality: '表面卑微，内心戏极多，每天都在写商业计划书',
    appearance: '穿着最便宜的工装，但手机壳是定制的',
    quality: 5,
    quirks: [
      '办公桌下面藏着自己品牌的样品鞋',
      '口头禅是"我忍，我再忍"',
      '偷偷注册了"司马拖鞋"的商标',
    ],
  },

  // ========== 吴 ==========
  sun_quan: {
    id: 'sun_quan',
    name: '孙权',
    title: '十万粉丝主播 / 江东带货王',
    originalRole: '东吴大帝，坐断东南',
    currentRole: '直播带货主播，什么都卖',
    personality: '自来熟、话术一流、对粉丝真诚（可能吧），有着极强的镜头感',
    appearance: '主播灯光下紫髯碧眼格外显眼，背景是长江夜景',
    quality: 5,
    quirks: [
      '每次上播必说"家人们！"',
      '碧眼紫髯染发膏是他最畅销的商品',
      '把评论区当朝堂，认真回复每一条',
    ],
  },

  zhou_yu: {
    id: 'zhou_yu',
    name: '周瑜',
    title: '直播间运营总监 / 前大都督',
    originalRole: '赤壁之战总指挥',
    currentRole: '孙权直播间的运营和策划',
    personality: '才华横溢但永远活在孙权的阴影下，经常头疼（物理意义上的）',
    appearance: '戴着耳机坐在导播台后面，面容憔悴',
    quality: 5,
    quirks: [
      '口头禅从"既生瑜何生亮"变成了"既生瑜何生这种主播"',
      '偷偷在写辞职信，但写了三十多封都没交',
      '背景音乐播放列表全是自己弹的曲子',
    ],
  },

  // ========== 群雄 ==========
  lv_bu: {
    id: 'lv_bu',
    name: '吕布',
    title: '奶茶店店长 / 前天下第一武将',
    originalRole: '三国第一猛将，方天画戟',
    currentRole: '经营"方天画戟奶茶"连锁品牌',
    personality: '外表凶猛但内心是个文艺青年，对奶茶配方有极致追求',
    appearance: '穿着印有"方天画戟奶茶"LOGO的围裙，头上还戴着头饰',
    quality: 5,
    quirks: [
      '招牌产品是"三英战吕布"三拼奶茶',
      '用方天画戟搅珍珠',
      '貂蝉是他的品牌代言人兼试吃员',
    ],
  },

  diao_chan: {
    id: 'diao_chan',
    name: '貂蝉',
    title: '美妆博主 / 前第一美人',
    originalRole: '四大美人之一，连环计核心',
    currentRole: '全网最火美妆博主，副业是奶茶试吃',
    personality: '精明、独立、美丽且清楚自己美丽，连环计现在用来做营销',
    appearance: '永远化着完美的妆容，自拍杆不离手',
    quality: 4,
    quirks: [
      '美人计变成了美妆计',
      '连环计是她的粉丝互动活动',
      '闭月是她的滤镜名',
    ],
  },

  hua_tuo: {
    id: 'hua_tuo',
    name: '华佗',
    title: '社区诊所医生 / 养生博主',
    originalRole: '神医，发明麻沸散',
    currentRole: '开了个社区诊所，副业是在小红书写养生帖',
    personality: '专业、碎碎念、总觉得所有人都需要治疗（包括精神上的）',
    appearance: '白大褂配古代医箱，名牌上写着"华佗·主任医师·全平台认证"',
    quality: 4,
    quirks: [
      '刮骨疗毒现在改叫"深层清洁套餐"',
      '麻沸散的配方被他改良成了安眠茶',
      '对关羽说"你不需要健身，你需要体检"',
    ],
  },
};
