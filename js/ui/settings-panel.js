/** 成就定义 */
var AchievementDefs = [
  // 战斗成就
  { id:'battle-1', name:'初战告捷', desc:'完成1次战斗', category:'battle', icon:'⚔️',
    condition: function(s){ return s.totalBattles >= 1; }, progress: function(s){ return Math.min(s.totalBattles, 1); }, target:1, jade:10, bonus:{gold:200} },
  { id:'battle-2', name:'身经百战', desc:'完成100次战斗', category:'battle', icon:'⚔️',
    condition: function(s){ return s.totalBattles >= 100; }, progress: function(s){ return Math.min(s.totalBattles, 100); }, target:100, jade:20, bonus:{gold:500} },
  { id:'battle-3', name:'沙场老将', desc:'完成1000次战斗', category:'battle', icon:'⚔️',
    condition: function(s){ return s.totalBattles >= 1000; }, progress: function(s){ return Math.min(s.totalBattles, 1000); }, target:1000, jade:50, bonus:{gold:2000} },
  { id:'battle-4', name:'闪电战', desc:'3回合内获胜', category:'battle', icon:'⚡',
    condition: function(s){ return s.fastWin; }, progress: function(s){ return s.fastWin ? 1 : 0; }, target:1, jade:15, bonus:{} },
  { id:'battle-5', name:'完美通关', desc:'不受伤害通关', category:'battle', icon:'🛡️',
    condition: function(s){ return s.perfectWin; }, progress: function(s){ return s.perfectWin ? 1 : 0; }, target:1, jade:30, bonus:{} },

  // 章节成就
  { id:'chapter-1', name:'初入乱世', desc:'通关第一章', category:'chapter', icon:'📖',
    condition: function(s){ return s.clearedStages >= 10; }, progress: function(s){ return Math.min(s.clearedStages, 10); }, target:10, jade:30, bonus:{food:50} },
  { id:'chapter-2', name:'崭露头角', desc:'通关第二章', category:'chapter', icon:'📖',
    condition: function(s){ return s.clearedStages >= 20; }, progress: function(s){ return Math.min(s.clearedStages, 20); }, target:20, jade:40, bonus:{food:80} },
  { id:'chapter-3', name:'名震天下', desc:'通关第三章', category:'chapter', icon:'📖',
    condition: function(s){ return s.clearedStages >= 30; }, progress: function(s){ return Math.min(s.clearedStages, 30); }, target:30, jade:50, bonus:{food:100} },
  { id:'chapter-4', name:'一统江湖', desc:'通关第四章', category:'chapter', icon:'📖',
    condition: function(s){ return s.clearedStages >= 40; }, progress: function(s){ return Math.min(s.clearedStages, 40); }, target:40, jade:60, bonus:{food:120} },
  { id:'chapter-5', name:'天命所归', desc:'通关第五章', category:'chapter', icon:'👑',
    condition: function(s){ return s.clearedStages >= 50; }, progress: function(s){ return Math.min(s.clearedStages, 50); }, target:50, jade:100, bonus:{} },

  // 收集成就
  { id:'collect-1', name:'广纳贤才', desc:'拥有5名武将', category:'collect', icon:'🎖️',
    condition: function(s){ return s.heroCount >= 5; }, progress: function(s){ return Math.min(s.heroCount, 5); }, target:5, jade:20, bonus:{} },
  { id:'collect-2', name:'群英荟萃', desc:'拥有10名武将', category:'collect', icon:'🎖️',
    condition: function(s){ return s.heroCount >= 10; }, progress: function(s){ return Math.min(s.heroCount, 10); }, target:10, jade:40, bonus:{} },
  { id:'collect-3', name:'三国鼎立', desc:'拥有15名武将', category:'collect', icon:'🎖️',
    condition: function(s){ return s.heroCount >= 15; }, progress: function(s){ return Math.min(s.heroCount, 15); }, target:15, jade:80, bonus:{} },
  { id:'collect-4', name:'传说降临', desc:'拥有1名橙色武将', category:'collect', icon:'🌟',
    condition: function(s){ return s.orangeHeroCount >= 1; }, progress: function(s){ return Math.min(s.orangeHeroCount, 1); }, target:1, jade:50, bonus:{} },
  { id:'collect-5', name:'装备大师', desc:'拥有20件装备', category:'collect', icon:'🗡️',
    condition: function(s){ return s.equipCount >= 20; }, progress: function(s){ return Math.min(s.equipCount, 20); }, target:20, jade:20, bonus:{} },

  // 升级成就
  { id:'level-1', name:'初出茅庐', desc:'任意武将达到10级', category:'upgrade', icon:'⬆️',
    condition: function(s){ return s.maxHeroLevel >= 10; }, progress: function(s){ return Math.min(s.maxHeroLevel, 10); }, target:10, jade:15, bonus:{exp:500} },
  { id:'level-2', name:'精英之路', desc:'任意武将达到25级', category:'upgrade', icon:'⬆️',
    condition: function(s){ return s.maxHeroLevel >= 25; }, progress: function(s){ return Math.min(s.maxHeroLevel, 25); }, target:25, jade:30, bonus:{exp:2000} },
  { id:'level-3', name:'巅峰之境', desc:'任意武将达到50级', category:'upgrade', icon:'⬆️',
    condition: function(s){ return s.maxHeroLevel >= 50; }, progress: function(s){ return Math.min(s.maxHeroLevel, 50); }, target:50, jade:100, bonus:{exp:10000} },
  { id:'level-4', name:'锻造大师', desc:'装备强化至满级', category:'upgrade', icon:'🔨',
    condition: function(s){ return s.hasMaxLevelEquip; }, progress: function(s){ return s.hasMaxLevelEquip ? 1 : 0; }, target:1, jade:30, bonus:{gold:5000} },
  { id:'level-5', name:'全副武装', desc:'5名武将全部穿满装备', category:'upgrade', icon:'🛡️',
    condition: function(s){ return s.fullyEquippedHeroes >= 5; }, progress: function(s){ return Math.min(s.fullyEquippedHeroes, 5); }, target:5, jade:100, bonus:{} },

  // 经济成就
  { id:'economy-1', name:'小有积蓄', desc:'累计获得10000金币', category:'economy', icon:'💰',
    condition: function(s){ return s.totalGoldEarned >= 10000; }, progress: function(s){ return Math.min(s.totalGoldEarned, 10000); }, target:10000, jade:10, bonus:{} },
  { id:'economy-2', name:'富甲一方', desc:'累计获得100000金币', category:'economy', icon:'💰',
    condition: function(s){ return s.totalGoldEarned >= 100000; }, progress: function(s){ return Math.min(s.totalGoldEarned, 100000); }, target:100000, jade:30, bonus:{} },
  { id:'economy-3', name:'首次招募', desc:'完成1次招募', category:'economy', icon:'🎲',
    condition: function(s){ return s.totalRecruits >= 1; }, progress: function(s){ return Math.min(s.totalRecruits, 1); }, target:1, jade:10, bonus:{} },
  { id:'economy-4', name:'十连抽运', desc:'完成1次十连招募', category:'economy', icon:'🎲',
    condition: function(s){ return s.hasTenPull; }, progress: function(s){ return s.hasTenPull ? 1 : 0; }, target:1, jade:20, bonus:{} },
];

/** 设置面板 UI */
var SettingsPanel = {
  _container: null,
  _achievements: {},
  _hasTenPull: false,

  init: function (saved) {
    this._container = document.getElementById('panel-settings');
    if (!saved) saved = SaveManager.load();
    if (saved && saved.settings) {
      this._achievements = saved.settings.achievements || {};
      this._hasTenPull = saved.settings.hasTenPull || false;
    }
    this._render();
    var self = this;
    EventBus.on('battle:ended', function() { self._checkAchievements(); });
    EventBus.on('hero:added', function() { self._checkAchievements(); });
    EventBus.on('hero:levelup', function() { self._checkAchievements(); });
    EventBus.on('resource:changed', function() { self._checkAchievements(); });
    EventBus.on('recruit:result', function(data) {
      if (data && data.results && data.results.length >= 10) {
        self._hasTenPull = true;
      }
      self._checkAchievements();
    });
    EventBus.on('tab:switched', function(tabId) {
      if (tabId === 'settings') {
        self._checkAchievements();
        self._render();
      }
    });
  },

  _gatherSnapshot: function () {
    var stats = ResourceManager.getStats();
    var heroes = HeroManager.getAll();
    var equips = EquipmentManager.getInventory();
    var cleared = BattleManager.getClearedStages();
    var recruitState = RecruitManager.getState();

    var maxHeroLevel = 0;
    var orangeHeroCount = 0;
    var fullyEquippedHeroes = 0;
    for (var i = 0; i < heroes.length; i++) {
      if (heroes[i].level > maxHeroLevel) maxHeroLevel = heroes[i].level;
      var tmpl = HeroManager.getTemplate(heroes[i].id);
      if (tmpl && tmpl.quality >= 5) orangeHeroCount++;
      var eq = heroes[i].equipment;
      if (eq && eq.weapon && eq.armor && eq.accessory && eq.mount) fullyEquippedHeroes++;
    }

    var hasMaxLevelEquip = false;
    for (var i = 0; i < equips.length; i++) {
      var maxLv = EquipMaxLevel[equips[i].quality] || 5;
      if (equips[i].level >= maxLv) { hasMaxLevelEquip = true; break; }
    }

    // Check fast win & perfect win from last battle
    var bs = BattleManager.getBattleState();
    var fastWin = false;
    var perfectWin = false;
    if (bs && bs.phase === 'victory') {
      if (bs.round <= 3) fastWin = true;
      if (bs.allies) {
        perfectWin = true;
        for (var i = 0; i < bs.allies.length; i++) {
          if (bs.allies[i].currentHp < bs.allies[i].maxHp) { perfectWin = false; break; }
        }
      }
    }

    return {
      totalBattles: stats.totalBattles || 0,
      totalGoldEarned: stats.totalGoldEarned || 0,
      totalPlayTime: stats.totalPlayTime || 0,
      loginDays: stats.loginDays || 0,
      heroCount: heroes.length,
      orangeHeroCount: orangeHeroCount,
      maxHeroLevel: maxHeroLevel,
      fullyEquippedHeroes: fullyEquippedHeroes,
      equipCount: equips.length,
      hasMaxLevelEquip: hasMaxLevelEquip,
      clearedStages: cleared.length,
      highestStage: stats.highestStage || '',
      totalRecruits: recruitState.totalRecruits || 0,
      hasTenPull: this._hasTenPull,
      fastWin: fastWin,
      perfectWin: perfectWin
    };
  },

  _checkAchievements: function () {
    var snapshot = this._gatherSnapshot();
    var changed = false;
    for (var i = 0; i < AchievementDefs.length; i++) {
      var def = AchievementDefs[i];
      if (!this._achievements[def.id]) {
        this._achievements[def.id] = { unlocked: false, claimed: false };
      }
      if (!this._achievements[def.id].unlocked && def.condition(snapshot)) {
        this._achievements[def.id].unlocked = true;
        changed = true;
        EventBus.emit('toast:show', { type: 'success', message: '🏆 成就解锁: ' + def.name });
      }
    }
    if (changed) this._render();
  },

  _claimAchievement: function (id) {
    var ach = this._achievements[id];
    if (!ach || !ach.unlocked || ach.claimed) return;
    var def = null;
    for (var i = 0; i < AchievementDefs.length; i++) {
      if (AchievementDefs[i].id === id) { def = AchievementDefs[i]; break; }
    }
    if (!def) return;
    ResourceManager.add('jade', def.jade);
    if (def.bonus) {
      if (def.bonus.gold) ResourceManager.add('gold', def.bonus.gold);
      if (def.bonus.food) ResourceManager.add('food', def.bonus.food);
      if (def.bonus.exp) ResourceManager.add('exp', def.bonus.exp);
    }
    ach.claimed = true;
    EventBus.emit('toast:show', { type: 'success', message: '🎁 已领取成就奖励: ' + def.name });
    this._render();
  },

  _render: function () {
    if (!this._container) return;
    this._container.innerHTML =
      '<h3 style="margin-bottom:10px;">⚙️ 设置</h3>' +
      this._renderDailyLogin() +
      this._renderSaveManagement() +
      this._renderGameStats() +
      this._renderAchievements() +
      this._renderAbout();
    this._bindEvents();
  },

  _renderDailyLogin: function () {
    var info = ResourceManager.checkDailyLogin();
    var day = info.day;
    var claimed = info.claimed;
    var rewards = ResourceManager._dailyRewards;
    var cycleDay = ((day - 1) % 7);

    var daysHtml = '';
    for (var i = 0; i < 7; i++) {
      var r = rewards[i];
      var isCurrent = (i === cycleDay);
      var isPast = (i < cycleDay);
      var bg = isCurrent ? 'var(--color-primary)' : (isPast ? 'var(--color-secondary)' : 'rgba(255,255,255,0.05)');
      var border = isCurrent ? '2px solid var(--color-gold)' : '1px solid var(--color-secondary)';
      var rewardText = '💰' + r.gold;
      if (r.jade) rewardText += ' 💎' + r.jade;
      if (r.food) rewardText += ' 🍖' + r.food;
      if (r.freeRecruit) rewardText += ' 🎲';
      daysHtml += '<div style="flex:1;text-align:center;padding:6px 2px;border-radius:4px;' +
        'background:' + bg + ';border:' + border + ';font-size:11px;min-width:0;">' +
        '<div style="font-weight:bold;">第' + (i + 1) + '天</div>' +
        '<div style="margin-top:2px;font-size:10px;">' + rewardText + '</div>' +
        (isPast ? '<div style="color:var(--color-success);font-size:10px;">✅</div>' : '') +
        (isCurrent && claimed ? '<div style="color:var(--color-success);font-size:10px;">✅</div>' : '') +
      '</div>';
    }

    var todayReward = rewards[cycleDay];
    var todayText = '💰' + todayReward.gold;
    if (todayReward.jade) todayText += ' 💎' + todayReward.jade;
    if (todayReward.food) todayText += ' 🍖' + todayReward.food;
    if (todayReward.freeRecruit) todayText += ' 🎲免费招募';

    return '<div class="card">' +
      '<h4 style="margin-bottom:8px;">📅 每日签到</h4>' +
      '<div style="margin-bottom:6px;">已签到 <strong>' + day + '</strong> 天</div>' +
      '<div style="display:flex;gap:4px;margin-bottom:8px;overflow-x:auto;">' + daysHtml + '</div>' +
      '<div style="margin-bottom:8px;font-size:13px;">今日奖励: ' + todayText + '</div>' +
      (claimed
        ? '<button class="btn" disabled style="background:var(--color-success);">已领取 ✅</button>'
        : '<button class="btn btn-daily-claim">领取签到奖励</button>') +
    '</div>';
  },

  _renderSaveManagement: function () {
    var saved = SaveManager.load();
    var lastSave = '暂无';
    if (saved && saved.timestamp) {
      var d = new Date(saved.timestamp);
      lastSave = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0') + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0');
    }

    return '<div class="card">' +
      '<h4 style="margin-bottom:8px;">💾 存档管理</h4>' +
      '<div style="font-size:13px;color:var(--color-text-dim);margin-bottom:8px;">上次保存: ' + lastSave + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
        '<button class="btn btn-manual-save">手动保存</button>' +
        '<button class="btn btn-export" style="background:var(--color-secondary);">导出存档</button>' +
        '<button class="btn btn-import" style="background:var(--color-secondary);">导入存档</button>' +
      '</div>' +
      '<div style="margin-top:8px;">' +
        '<button class="btn btn-delete-save" style="background:var(--color-danger);font-size:12px;">删除存档</button>' +
        ' <span style="font-size:11px;color:var(--color-danger);">⚠️ 不可撤销!</span>' +
      '</div>' +
    '</div>';
  },

  _renderGameStats: function () {
    var stats = ResourceManager.getStats();
    var heroes = HeroManager.getAll();
    var equips = EquipmentManager.getInventory();
    var cleared = BattleManager.getClearedStages();

    // Format play time
    var totalSec = Math.floor(stats.totalPlayTime || 0);
    var hours = Math.floor(totalSec / 3600);
    var minutes = Math.floor((totalSec % 3600) / 60);
    var timeStr = hours + '小时 ' + minutes + '分';

    // Format highest stage
    var highStage = stats.highestStage || '—';
    if (highStage && highStage.indexOf('stage_') === 0) {
      var parts = highStage.replace('stage_', '').split('_');
      if (parts.length === 2) highStage = parts[0] + '-' + parts[1];
    }

    // Hero count
    var totalHeroes = 0;
    try { totalHeroes = HeroData.length; } catch(e) { totalHeroes = 20; }

    return '<div class="card">' +
      '<h4 style="margin-bottom:8px;">📊 游戏统计</h4>' +
      '<div style="font-size:13px;line-height:2;">' +
        '<div>⏱️ 总游戏时间: <strong>' + timeStr + '</strong></div>' +
        '<div>⚔️ 总战斗次数: <strong>' + Utils.formatNumber(stats.totalBattles || 0) + '</strong></div>' +
        '<div>🏔️ 最高关卡: <strong>' + highStage + '</strong></div>' +
        '<div>📅 签到天数: <strong>' + (stats.loginDays || 0) + '</strong></div>' +
        '<div>🦸 拥有武将: <strong>' + heroes.length + '/' + totalHeroes + '</strong></div>' +
        '<div>🗡️ 拥有装备: <strong>' + equips.length + '/' + EquipmentManager.getMaxCapacity() + '</strong></div>' +
        '<div>🏁 已通关卡: <strong>' + cleared.length + '/50</strong></div>' +
        '<div>💰 累计金币: <strong>' + Utils.formatNumber(stats.totalGoldEarned || 0) + '</strong></div>' +
      '</div>' +
    '</div>';
  },

  _renderAchievements: function () {
    var snapshot = this._gatherSnapshot();
    var unlockedCount = 0;
    var total = AchievementDefs.length;
    for (var i = 0; i < total; i++) {
      var ach = this._achievements[AchievementDefs[i].id];
      if (ach && ach.unlocked) unlockedCount++;
    }

    var categoryNames = { battle:'⚔️ 战斗', chapter:'📖 章节', collect:'🎖️ 收集', upgrade:'⬆️ 升级', economy:'💰 经济' };
    var categoryOrder = ['battle', 'chapter', 'collect', 'upgrade', 'economy'];
    var html = '';

    for (var c = 0; c < categoryOrder.length; c++) {
      var cat = categoryOrder[c];
      var catName = categoryNames[cat];
      var items = '';
      for (var i = 0; i < AchievementDefs.length; i++) {
        var def = AchievementDefs[i];
        if (def.category !== cat) continue;
        var ach = this._achievements[def.id] || { unlocked: false, claimed: false };
        var prog = def.progress(snapshot);
        var pct = Math.min(100, Math.floor((prog / def.target) * 100));
        var barColor = ach.claimed ? 'var(--color-success)' : (ach.unlocked ? 'var(--color-gold)' : 'var(--color-secondary)');
        var statusIcon = ach.claimed ? '✅' : (ach.unlocked ? '🎁' : '🔒');

        // Reward text
        var rewardText = '💎' + def.jade;
        if (def.bonus && def.bonus.gold) rewardText += ' 💰' + def.bonus.gold;
        if (def.bonus && def.bonus.food) rewardText += ' 🍖' + def.bonus.food;
        if (def.bonus && def.bonus.exp) rewardText += ' ⭐' + def.bonus.exp;

        items += '<div style="padding:8px;margin-bottom:6px;border-radius:4px;background:rgba(15,52,96,0.3);' +
          'border-left:3px solid ' + barColor + ';">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div>' +
              '<span>' + def.icon + ' <strong>' + def.name + '</strong></span>' +
              '<div style="font-size:11px;color:var(--color-text-dim);">' + def.desc + '</div>' +
            '</div>' +
            '<span style="font-size:14px;">' + statusIcon + '</span>' +
          '</div>' +
          '<div style="margin-top:6px;display:flex;align-items:center;gap:8px;">' +
            '<div style="flex:1;background:rgba(255,255,255,0.1);border-radius:3px;height:6px;overflow:hidden;">' +
              '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px;transition:width 0.3s;"></div>' +
            '</div>' +
            '<span style="font-size:11px;color:var(--color-text-dim);white-space:nowrap;">' +
              (def.target > 1 ? Utils.formatNumber(prog) + '/' + Utils.formatNumber(def.target) : (ach.unlocked ? '已完成' : '未完成')) +
            '</span>' +
          '</div>' +
          '<div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-size:11px;color:var(--color-text-dim);">奖励: ' + rewardText + '</span>' +
            (ach.unlocked && !ach.claimed
              ? '<button class="btn btn-claim-ach" data-ach-id="' + def.id + '" style="font-size:11px;padding:2px 8px;">领取</button>'
              : '') +
          '</div>' +
        '</div>';
      }
      html += '<div style="margin-bottom:8px;">' +
        '<div style="font-weight:bold;margin-bottom:6px;font-size:13px;">' + catName + '</div>' +
        items +
      '</div>';
    }

    return '<div class="card">' +
      '<h4 style="margin-bottom:8px;">🏆 成就 (' + unlockedCount + '/' + total + ')</h4>' +
      html +
    '</div>';
  },

  _renderAbout: function () {
    return '<div class="card" style="text-align:center;">' +
      '<h4 style="margin-bottom:6px;">ℹ️ 关于</h4>' +
      '<div style="font-size:14px;font-weight:bold;color:var(--color-gold);">' +
        CONSTANTS.GAME_TITLE + ' v' + CONSTANTS.VERSION + ' Alpha' +
      '</div>' +
      '<div style="font-size:12px;color:var(--color-text-dim);margin-top:4px;">Made with ❤️</div>' +
    '</div>';
  },

  _onManualSave: function () {
    var state = {
      version: CONSTANTS.VERSION,
      timestamp: Date.now(),
      resources: ResourceManager.getState(),
      heroes: HeroManager.getState(),
      battle: BattleManager.getState(),
      recruit: RecruitManager.getState(),
      equipment: EquipmentManager.getState(),
      story: StoryManager.getState(),
      settings: this.getState()
    };
    SaveManager.save(state);
    EventBus.emit('toast:show', { type: 'success', message: '💾 存档保存成功!' });
    this._render();
  },

  _onExport: function () {
    var state = {
      version: CONSTANTS.VERSION,
      timestamp: Date.now(),
      resources: ResourceManager.getState(),
      heroes: HeroManager.getState(),
      battle: BattleManager.getState(),
      recruit: RecruitManager.getState(),
      equipment: EquipmentManager.getState(),
      story: StoryManager.getState(),
      settings: this.getState()
    };
    try {
      var json = JSON.stringify(state);
      var encoded = btoa(unescape(encodeURIComponent(json)));

      // Try clipboard API first, fall back to prompt
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(encoded).then(function() {
          EventBus.emit('toast:show', { type: 'success', message: '📋 存档已复制到剪贴板!' });
        }).catch(function() {
          prompt('请复制以下存档码:', encoded);
        });
      } else {
        prompt('请复制以下存档码:', encoded);
      }
    } catch (e) {
      EventBus.emit('toast:show', { type: 'error', message: '导出失败: ' + e.message });
    }
  },

  _onImport: function () {
    var encoded = prompt('请粘贴存档码:');
    if (!encoded || !encoded.trim()) return;
    try {
      var json = decodeURIComponent(escape(atob(encoded.trim())));
      var data = JSON.parse(json);
      if (!data || !data.version) {
        EventBus.emit('toast:show', { type: 'error', message: '无效的存档数据!' });
        return;
      }
      SaveManager.save(data);
      EventBus.emit('toast:show', { type: 'success', message: '✅ 存档导入成功，即将刷新...' });
      setTimeout(function() { location.reload(); }, 1000);
    } catch (e) {
      EventBus.emit('toast:show', { type: 'error', message: '导入失败: 存档码格式错误' });
    }
  },

  _onDeleteData: function () {
    if (!confirm('⚠️ 确定要删除所有存档吗？\n\n此操作不可撤销，所有进度将丢失！')) return;
    if (!confirm('再次确认：真的要清除所有数据吗？')) return;
    SaveManager.clear();
    EventBus.emit('toast:show', { type: 'success', message: '存档已清除，即将刷新...' });
    setTimeout(function() { location.reload(); }, 1000);
  },

  _onClaimDailyReward: function () {
    var reward = ResourceManager.claimDailyReward();
    if (reward) {
      var msg = '签到奖励: 💰' + (reward.gold || 0);
      if (reward.jade) msg += ' 💎' + reward.jade;
      if (reward.food) msg += ' 🍖' + reward.food;
      EventBus.emit('toast:show', { type: 'success', message: msg });
    }
    this._render();
  },

  _bindEvents: function () {
    var self = this;

    var dailyBtn = this._container.querySelector('.btn-daily-claim');
    if (dailyBtn) {
      dailyBtn.addEventListener('click', function() { self._onClaimDailyReward(); });
    }

    var saveBtn = this._container.querySelector('.btn-manual-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() { self._onManualSave(); });
    }

    var exportBtn = this._container.querySelector('.btn-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() { self._onExport(); });
    }

    var importBtn = this._container.querySelector('.btn-import');
    if (importBtn) {
      importBtn.addEventListener('click', function() { self._onImport(); });
    }

    var deleteBtn = this._container.querySelector('.btn-delete-save');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() { self._onDeleteData(); });
    }

    this._container.querySelectorAll('.btn-claim-ach').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var achId = btn.getAttribute('data-ach-id');
        self._claimAchievement(achId);
      });
    });
  },

  getState: function () {
    return {
      achievements: Utils.deepClone(this._achievements),
      hasTenPull: this._hasTenPull
    };
  },

  getAchievements: function () {
    return Utils.deepClone(this._achievements);
  }
};
