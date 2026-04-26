/**
 * 满级账户注入脚本
 * 用法：在游戏页面的浏览器控制台中粘贴运行，然后刷新页面
 *
 * 或者通过 Node.js 生成 JSON：
 *   node tools/inject-max-save.js > /tmp/max-save.json
 *   然后在浏览器控制台执行：
 *   localStorage.setItem('idle_three_kingdoms_save', JSON.stringify(<粘贴JSON>))
 */
(function () {
  'use strict';

  // ===== 工具函数 =====
  var counter = 0;
  function uid() { return 'max_' + Date.now().toString(36) + '_' + (counter++).toString(36); }
  function today() { return new Date().toISOString().slice(0, 10); }

  // ===== 所有武将 ID =====
  var allHeroIds = [
    // 蜀
    'shu_zhugeliang', 'shu_liubei', 'shu_guanyu', 'shu_zhangfei', 'shu_zhaoyun',
    'shu_huangzhong', 'shu_machao', 'shu_jiangwei', 'shu_pangtong', 'shu_weiyan',
    // 魏
    'wei_caocao', 'wei_simayi', 'wei_xiahoudun', 'wei_zhangliao', 'wei_dianwei',
    'wei_xunyu', 'wei_guojia', 'wei_xuchu', 'wei_caoren', 'wei_zhanghe',
    // 吴
    'wu_sunquan', 'wu_zhouyu', 'wu_sunshangxiang', 'wu_taishici', 'wu_lvmeng',
    'wu_luxun', 'wu_ganning', 'wu_huanggai', 'wu_daqiao', 'wu_xiaoqiao',
    // 群
    'qun_lvbu', 'qun_diaochan', 'qun_huatuo', 'qun_yuanshao', 'qun_dongzhuo',
    'qun_zhangjiao', 'qun_gongsunzan', 'qun_zuoci', 'qun_caiwenji', 'qun_menghuo',
    // 普通兵种
    'common_soldier', 'common_archer', 'common_cavalry', 'common_guard'
  ];

  // 队伍：5 名传说武将
  var teamHeroIds = ['shu_zhugeliang', 'shu_guanyu', 'wei_caocao', 'qun_lvbu', 'shu_zhaoyun'];

  // ===== 生成武将数据 =====
  // 满级 = 50 + 5*10 = 100, 满星 = 5, 技能点 = 100/5 = 20
  var heroes = [];
  var teamUids = [];
  for (var i = 0; i < allHeroIds.length; i++) {
    var heroId = allHeroIds[i];
    var heroUid = uid();
    var hero = {
      uid: heroUid,
      id: heroId,
      level: 100,
      exp: 0,
      stars: 5,
      equipment: { weapon: null, armor: null, accessory: null, mount: null },
      skillLevels: [10, 10, 0],  // 技能1和2满级，剩余点数留着
      skillPointsEarned: 20      // 100级 / 每5级1点 = 20点
    };
    heroes.push(hero);
    if (teamHeroIds.indexOf(heroId) !== -1) {
      teamUids.push(heroUid);
    }
  }

  // ===== 为队伍成员生成橙色装备 =====
  var equipInventory = [];
  var equipTypes = [
    { type: 'weapon', statType: 'atk', names: ['天子剑', '霸王枪', '龙胆枪', '方天画戟', '青釭剑'] },
    { type: 'armor', statType: 'def', names: ['麒麟铠', '凤翼甲', '龙鳞甲', '虎威铠', '玄武盾甲'] },
    { type: 'accessory', statType: 'hp', names: ['传国玉玺', '和氏璧', '龙凤佩', '玲珑玉', '九龙环'] },
    { type: 'mount', statType: 'spd', names: ['赤兔马', '的卢马', '绝影马', '爪黄飞电', '乌骓马'] }
  ];

  // 橙色装备属性范围上限
  var q5StatRange = { atk: 80, def: 60, hp: 500, spd: 25 };

  for (var ti = 0; ti < teamUids.length; ti++) {
    var heroRef = heroes.find(function (h) { return h.uid === teamUids[ti]; });
    for (var ei = 0; ei < equipTypes.length; ei++) {
      var et = equipTypes[ei];
      var equipUid = uid();
      var equip = {
        uid: equipUid,
        id: 'max_equip_' + et.type + '_' + ti,
        name: et.names[ti],
        type: et.type,
        quality: 5,
        emoji: et.type === 'weapon' ? '⚔️' : et.type === 'armor' ? '🛡️' : et.type === 'mount' ? '🐴' : '💎',
        description: '满级测试装备',
        stats: {},
        level: 25,  // 橙色装备最大强化等级
        equippedBy: teamUids[ti],
        affixes: []
      };
      equip.stats[et.statType] = q5StatRange[et.statType];
      equipInventory.push(equip);
      heroRef.equipment[et.type] = equipUid;
    }
  }

  // ===== 所有关卡 ID =====
  var allStageIds = [];
  for (var ch = 1; ch <= 15; ch++) {
    for (var st = 1; st <= 10; st++) {
      allStageIds.push('stage_' + ch + '_' + st);
    }
  }

  // ===== 城镇建筑：全满级 =====
  var buildingMaxLevels = {
    town_hall: 10,
    lumber_camp: 25, quarry: 25, iron_mine: 25,
    farmland: 25, barracks: 25, training_ground: 25,
    blacksmith: 25, city_wall: 25, adventure_guild: 25,
    tavern: 25, warehouse: 25, market: 25,
    tax_office: 25, weapon_workshop: 25, stable: 25,
    academy: 25, watermill: 25, stone_mason: 25,
    smelter: 25, vegetable_garden: 25, compost_pit: 25,
    seed_shop: 25, parking_lot: 25
  };
  var buildings = {};
  for (var bid in buildingMaxLevels) {
    buildings[bid] = {
      level: buildingMaxLevels[bid],
      buildEndTime: null,
      count: 1,
      buildType: null
    };
  }

  // ===== 深渊实例：全部通关 =====
  var abyssInstances = {};
  var abyssIds = ['abyss_hulao', 'abyss_chibi', 'abyss_guandu'];
  for (var ai = 0; ai < abyssIds.length; ai++) {
    abyssInstances[abyssIds[ai]] = {
      cleared: true,
      firstCleared: true,
      lastAttempt: Date.now(),
      bestFloor: 5,
      totalAttempts: 10,
      mythicDropCount: 3
    };
  }

  // ===== 主线剧情：全部完成 =====
  var storyChapters = ['prologue', 'chapter_1', 'chapter_2', 'chapter_3', 'chapter_4', 'chapter_5'];

  // ===== 组装存档 =====
  var saveData = {
    version: '0.1.0',
    timestamp: Date.now(),

    // 资源
    resources: {
      resources: {
        gold: 9999999,
        jade: 999999,
        exp: 9999999,
        food: 200,
        wood: 999999,
        stone: 999999,
        iron: 999999
      },
      stats: {
        totalGoldEarned: 99999999,
        totalBattles: 50000,
        totalPlayTime: 3600000,
        highestStage: 'stage_15_10',
        loginDays: 365,
        lastLoginDate: today(),
        dailyLoginClaimed: true
      }
    },

    // 武将
    heroes: {
      heroes: heroes,
      team: teamUids
    },

    // 战斗
    battle: {
      currentStage: 'stage_15_10',
      isAutoFight: true,
      clearedStages: allStageIds,
      battleState: null,
      battleSpeed: 4
    },

    // 招募
    recruit: {
      pity: { rare: 0, epic: 0, legendary: 0 },
      totalRecruits: 5000,
      freeRecruitUsed: true
    },

    // 装备
    equipment: {
      inventory: equipInventory,
      maxSlots: 100,
      expandedSlots: 90,
      overflow: []
    },

    // 剧情
    story: {
      currentChapter: 'chapter_5',
      completedChapters: storyChapters.slice(0, -1),
      seenScenes: [],
      monologueCooldown: 0,
      latestMonologue: null
    },

    // 城镇
    town: {
      buildings: buildings,
      placements: {},
      roads: [],
      workers: 5,
      firstBuildingCompleted: true,
      buildQueue: []
    },

    // 冒险
    adventure: {
      currentRegion: 'region_5',
      adventureMode: 'push',
      idleSession: null,
      sessionHistory: [],
      unlockedRegions: ['region_1', 'region_2', 'region_3', 'region_4', 'region_5']
    },

    // 经济
    economy: {
      events: [],
      hourlyAggregates: [],
      dailyAggregates: [],
      lifetimeStats: {
        totalIncome:  { gold: 99999999, jade: 999999, exp: 99999999, food: 100000, wood: 999999, stone: 999999, iron: 999999 },
        totalExpense: { gold: 50000000, jade: 500000, exp: 50000000, food: 50000, wood: 500000, stone: 500000, iron: 500000 }
      },
      alerts: [],
      lastAlertCheck: Date.now()
    },

    // 商人
    merchant: {
      lastRefresh: Math.floor(Date.now() / 1000),
      normalStock: [],
      permanentSold: {},
      refreshInterval: 14400
    },

    // 锻造
    forge: {
      queue: [],
      maxQueue: 3,
      blueprints: []
    },

    // 深渊
    abyss: {
      unlocked: true,
      instances: abyssInstances,
      currentRun: null
    },

    // 农场
    farm: {
      plots: [],
      inventory: {},
      seeds: {
        crop_wheat: 99, crop_rice: 99, crop_corn: 99,
        crop_cabbage: 99, crop_radish: 99, crop_pepper: 99,
        crop_ginseng: 99, crop_lingzhi: 99
      },
      fertilizer: 20,
      farmExp: 99999,
      autoHarvest: true,
      activeBuff: null
    },

    // 驿站
    parking: {
      slots: [],
      vehicles: [],
      unlockedSlots: 0,
      totalIncomeEarned: 999999,
      lastTickTime: Date.now()
    },

    // 塔防
    towerDefense: {
      unlocked: true,
      towers: [],
      wave: { current: 1, highest: 50, townHallHp: 10000, townHallMaxHp: 10000 },
      assignedHeroes: [],
      heroDeployments: [],
      stats: { totalWavesCleared: 500, totalKills: 10000, totalGoldEarned: 999999 },
      tutorialSeen: true,
      chapter: { current: 1, highestCleared: 0 },
      stageProgress: {},
      stamina: { current: 12, lastRecover: Date.now() },
      towerEvolutions: {},
      practiceMode: false
    },

    // 每日任务
    quest: {
      quests: [],
      bonusClaimed: false,
      lastRefreshDate: '',
      totalCompleted: 9999
    },

    // 成就
    achievement: {
      claimed: {}
    },

    // 无尽模式
    roguelike: {
      unlocked: true,
      bestFloor: 100,
      totalRuns: 200,
      currentRun: null
    },

    // 每日挑战
    dailyChallenge: {
      lastDate: '',
      attempts: 0,
      bestScore: 99999,
      totalDays: 365
    },

    // 新手引导
    tutorial: {
      completed: true,
      currentStep: 99,
      stepsCompleted: ['welcome', 'first_battle', 'battle_victory', 'first_recruit', 'tutorial_complete']
    },

    // 设置
    settings: {}
  };

  // ===== 注入或输出 =====
  if (typeof localStorage !== 'undefined') {
    // 1. 停止自动存档，防止旧状态覆盖
    if (typeof SaveManager !== 'undefined') {
      SaveManager.stopAutoSave();
    }

    // 2. 移除 beforeunload / visibilitychange 存档钩子
    //    这些钩子会在刷新时用旧的内存状态覆盖我们注入的存档
    window.onbeforeunload = null;
    // 用克隆替换 window 来清除所有 beforeunload 监听器
    var noop = function () {};
    try {
      // 覆盖 getFullState 使其返回我们的满级数据
      window.getFullState = function () { return saveData; };
    } catch (e) {}

    // 3. 写入 localStorage
    localStorage.setItem('idle_three_kingdoms_save', JSON.stringify(saveData));
    // 同时清除备份，防止恢复旧存档
    localStorage.removeItem('idle_three_kingdoms_save_backup');

    console.log('✅ 满级存档已注入！');
    console.log('📋 账户概要：');
    console.log('   武将：' + heroes.length + ' 名（全部100级5星）');
    console.log('   队伍：诸葛亮、关羽、曹操、吕布、赵云');
    console.log('   关卡：全部通关（1-1 ~ 15-10）');
    console.log('   资源：金币999万 / 玉璧99万 / 经验999万');
    console.log('   装备：队伍成员全部橙装+25');
    console.log('   城镇：全部建筑满级');
    console.log('   深渊/无尽/塔防：全部解锁');

    // 4. 强制刷新：用 replace 避免触发某些 unload 钩子
    console.log('⏳ 3秒后自动刷新页面...');
    setTimeout(function () {
      window.location.replace(window.location.href);
    }, 3000);
  } else {
    // Node.js 环境：输出 JSON
    process.stdout.write(JSON.stringify(saveData, null, 2));
  }
})();
