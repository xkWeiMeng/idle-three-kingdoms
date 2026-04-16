/**
 * 游戏入口 — 幻想三国
 */
(function () {
  'use strict';

  // 品质颜色映射（全局使用）
  window.QualityColors = { 1:'#b0a898', 2:'#5d8a48', 3:'#4a7fb5', 4:'#8b5ea8', 5:'#d4a849', 6:'#ff2222' };
  window.QualityNames  = { 1:'白·普通', 2:'绿·精良', 3:'蓝·稀有', 4:'紫·史诗', 5:'橙·传说', 6:'红·神话' };

  // Expose globally so settings-panel (and any module) can get the complete state
  window.getFullState = function getFullState() {
    return {
      version: CONSTANTS.VERSION,
      timestamp: Date.now(),
      resources: ResourceManager.getState(),
      heroes: HeroManager.getState(),
      battle: BattleManager.getState(),
      recruit: RecruitManager.getState(),
      equipment: EquipmentManager.getState(),
      story: StoryManager.getState(),
      town: TownManager.getState(),
      adventure: AdventureManager.getState(),
      economy: EconomyManager.getState(),
      merchant: MerchantManager.getState(),
      forge: ForgeManager.getState(),
      abyss: AbyssManager.getState(),
      farm: FarmManager.getState(),
      parking: ParkingManager.getState(),
      towerDefense: TowerDefenseManager.getState(),
      quest: QuestManager.getState(),
      achievement: AchievementManager.getState(),
      roguelike: RoguelikeManager.getState(),
      dailyChallenge: DailyChallengeManager.getState(),
      settings: typeof SettingsPanel !== 'undefined' && SettingsPanel.getState
        ? SettingsPanel.getState() : {},
    };
  };

  function initGame() {
    const saved = SaveManager.load();

    // 初始化各模块（顺序重要：EconomyManager 需在 ResourceManager 之后）
    ResourceManager.init(saved);
    HeroManager.init(saved);
    BattleManager.init(saved);
    RecruitManager.init(saved);
    EquipmentManager.init(saved);
    StoryManager.init(saved);
    TownManager.init(saved);
    AdventureManager.init(saved);
    EconomyManager.init(saved);
    MerchantManager.init(saved);
    ForgeManager.init(saved);
    AbyssManager.init(saved);
    FarmManager.init(saved);
    ParkingManager.init(saved);
    TowerDefenseManager.init(saved);
    QuestManager.init(saved);
    AchievementManager.init(saved);
    RoguelikeManager.init(saved);
    DailyChallengeManager.init(saved);

    // 初始化 UI
    Toast.init();
    Modal.init();
    CelebrationOverlay.init();
    OverlayPanel.init();
    BottomNav.init();
    ResourcesBar.init();
    HeroPanel.init();
    BattleAnimations.init();
    BattlePanel.init();
    RecruitPanel.init();
    EquipmentPanel.init();
    StoryPanel.init();
    SettingsPanel.init(saved);
    TownPanel.init();
    AdventurePanel.init();
    EconomyPanel.init();
    TownWorld.init();
    TownCharacters.init();
    BuildQueueWidget.init();
    MerchantPanel.init();
    ForgePanel.init();
    AbyssPanel.init();
    FarmPanel.init();
    ParkingPanel.init();
    TowerDefensePanel.init();
    QuestPanel.init();
    AchievementPanel.init();
    RoguelikePanel.init();
    DailyChallengePanel.init();

    // 注册 tick 回调
    EventBus.on('game:tick', (dt) => {
      ResourceManager.onTick(dt);
      BattleManager.onTick(dt);
      StoryManager.onTick(dt);
      TownManager.onTick(dt);
      AdventureManager.onTick(dt);
      EconomyManager.onTick(dt);
      MerchantManager.onTick(dt);
      ForgeManager.onTick(dt);
      AbyssManager.onTick(dt);
      FarmManager.onTick(dt);
      ParkingManager.onTick(dt);
      TowerDefenseManager.onTick(dt);
      QuestManager.onTick(dt);
      RoguelikeManager.onTick(dt);
      DailyChallengeManager.onTick(dt);
    });

    // 离线收益计算
    if (saved?.timestamp) {
      const offlineSeconds = Math.min((Date.now() - saved.timestamp) / 1000, 86400);
      if (offlineSeconds > 60) {
        _showOfflineRewards(offlineSeconds, saved);
      }
    }

    // 每日签到弹窗（等待离线收益弹窗关闭后再显示）
    _maybeShowDailyLoginPopup();

    // 启动
    GameLoop.start();
    SaveManager.startAutoSave(window.getFullState);

    console.log(`${CONSTANTS.GAME_TITLE} v${CONSTANTS.VERSION} 启动完成`);
  }

  function _showOfflineRewards(offlineSeconds, saved) {
    // 使用 AdventureManager 计算离线收益（如可用）
    var rewards = null;
    if (typeof AdventureManager !== 'undefined' && AdventureManager.calculateOfflineRewards) {
      rewards = AdventureManager.calculateOfflineRewards(saved.timestamp);
    }

    if (!rewards) {
      // 兜底：旧逻辑
      const stage = StageData.find(s => s.id === (saved.battle?.currentStage || 'stage_1_1'));
      if (!stage) return;
      var goldPerSec = stage.rewards.gold / 5;
      var expPerSec = stage.rewards.exp / 5;
      rewards = {
        gold: Math.floor(goldPerSec * offlineSeconds * 0.5),
        exp: Math.floor(expPerSec * offlineSeconds * 0.5),
        wood: 0, stone: 0, iron: 0,
        battles: Math.floor(offlineSeconds / 5),
        offlineSec: offlineSeconds,
        efficiency: 0.5,
        region: ''
      };
    }

    const hours = Math.floor(rewards.offlineSec / 3600);
    const mins = Math.floor((rewards.offlineSec % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;

    // 发放资源
    if (rewards.gold > 0) ResourceManager.add('gold', rewards.gold, 'offline', 'offline_reward');
    if (rewards.exp > 0) ResourceManager.add('exp', rewards.exp, 'offline', 'offline_reward');
    if (rewards.wood > 0) ResourceManager.add('wood', rewards.wood, 'offline', 'offline_reward');
    if (rewards.stone > 0) ResourceManager.add('stone', rewards.stone, 'offline', 'offline_reward');
    if (rewards.iron > 0) ResourceManager.add('iron', rewards.iron, 'offline', 'offline_reward');

    // 停车场离线收入
    var parkingOfflineGold = 0;
    if (typeof ParkingManager !== 'undefined' && ParkingManager.calcOfflineIncome) {
      parkingOfflineGold = ParkingManager.calcOfflineIncome(offlineSeconds);
      if (parkingOfflineGold > 0) {
        ResourceManager.add('gold', parkingOfflineGold, 'offline', 'parking_offline');
        rewards.gold += parkingOfflineGold;
      }
    }

    var effPct = Math.round((rewards.efficiency || 0.5) * 100);
    var regionLine = rewards.region ? `<p>英雄们在「${rewards.region}」替你战斗了</p>` : '';

    setTimeout(() => {
      Modal.show({
        title: '☀ 欢迎回来！',
        content: `
          <div style="text-align:center;line-height:2;">
            <p>你离开了 <b style="color:#d4a849">${timeStr}</b></p>
            ${regionLine}
            <p>共完成 <b style="color:#d4a849">${Utils.formatNumber(rewards.battles)}</b> 场战斗</p>
            <hr style="border-color:#4a3728;margin:8px 0;">
            <p>💰 金币 <b style="color:#d4a849">+${Utils.formatNumber(rewards.gold)}</b></p>
            <p>⭐ 经验 <b style="color:#d4a849">+${Utils.formatNumber(rewards.exp)}</b></p>
            ${rewards.wood > 0 ? `<p>🪵 木材 <b style="color:#8b6914">+${Utils.formatNumber(rewards.wood)}</b></p>` : ''}
            ${rewards.stone > 0 ? `<p>🪨 石材 <b style="color:#9e9e9e">+${Utils.formatNumber(rewards.stone)}</b></p>` : ''}
            ${rewards.iron > 0 ? `<p>⛏️ 铁矿 <b style="color:#607d8b">+${Utils.formatNumber(rewards.iron)}</b></p>` : ''}
            <p style="color:#999;font-size:0.68rem;">（离线效率${effPct}%）</p>
          </div>
        `,
        confirmText: '收下！',
        showCancel: false
      });
    }, 500);
  }

  // —— 每日签到弹窗 ——

  function _maybeShowDailyLoginPopup() {
    var dailyInfo = ResourceManager.checkDailyLogin();
    if (!dailyInfo || dailyInfo.claimed) return;

    // 等待可能存在的离线收益弹窗先关闭再弹出
    function tryShow() {
      if (Modal._overlay && Modal._overlay.style.display !== 'none') {
        setTimeout(tryShow, 500);
        return;
      }
      _showDailyLoginPopup(dailyInfo);
    }
    setTimeout(tryShow, 1200);
  }

  function _showDailyLoginPopup(info) {
    var day = info.day;
    var rewards = ResourceManager._dailyRewards;
    var cycleDay = (day - 1) % 7;

    // 构建 7 天签到日历
    var daysHtml = '';
    for (var i = 0; i < 7; i++) {
      var r = rewards[i];
      var isCurrent = (i === cycleDay);
      var isPast = (i < cycleDay);

      var bg, border, extraStyle;
      if (isCurrent) {
        bg = 'rgba(212,168,73,0.18)';
        border = '2px solid #d4a849';
        extraStyle = 'box-shadow:0 0 8px rgba(212,168,73,0.3);';
      } else if (isPast) {
        bg = 'rgba(93,138,72,0.12)';
        border = '1px solid rgba(93,138,72,0.4)';
        extraStyle = 'opacity:0.7;';
      } else {
        bg = 'rgba(255,255,255,0.04)';
        border = '1px solid #3a2a1a';
        extraStyle = 'opacity:0.55;';
      }

      var rewardLines = '💰' + r.gold;
      if (r.jade)  rewardLines += '<br>💎' + r.jade;
      if (r.food)  rewardLines += '<br>🍖' + r.food;
      if (r.freeRecruit) rewardLines += '<br>🎲';

      var statusMark = '';
      if (isPast) {
        statusMark = '<div style="color:#5d8a48;font-size:9px;margin-top:1px;">✅</div>';
      }

      daysHtml += '<div style="flex:1;text-align:center;padding:5px 1px;border-radius:4px;' +
        'background:' + bg + ';border:' + border + ';min-width:0;' + extraStyle + '">' +
        '<div style="font-weight:bold;font-size:10px;color:' + (isCurrent ? '#d4a849' : '#e8dcc8') + ';">第' + (i + 1) + '天</div>' +
        '<div style="margin-top:2px;font-size:9px;line-height:1.35;color:#c0b8a8;">' + rewardLines + '</div>' +
        statusMark +
      '</div>';
    }

    // 今日奖励文字
    var todayReward = rewards[cycleDay];
    var todayParts = [];
    if (todayReward.gold)  todayParts.push('💰 ' + todayReward.gold + ' 金币');
    if (todayReward.jade)  todayParts.push('💎 ' + todayReward.jade + ' 玉璧');
    if (todayReward.food)  todayParts.push('🍖 ' + todayReward.food + ' 粮草');
    if (todayReward.freeRecruit) todayParts.push('🎲 免费招募×1');
    var todayText = todayParts.join('&nbsp;&nbsp;');

    var content = '<div style="text-align:center;">' +
      '<div style="margin-bottom:10px;font-size:0.78rem;color:#a09080;">' +
        '已连续签到 <b style="color:#d4a849;">' + day + '</b> 天' +
      '</div>' +
      '<div style="display:flex;gap:3px;margin-bottom:12px;">' + daysHtml + '</div>' +
      '<div style="padding:8px 10px;border-radius:4px;background:rgba(212,168,73,0.08);border:1px solid rgba(212,168,73,0.25);">' +
        '<div style="font-size:0.68rem;color:#a09080;margin-bottom:4px;">今日奖励</div>' +
        '<div style="font-size:0.82rem;color:#d4a849;font-weight:bold;">' + todayText + '</div>' +
      '</div>' +
    '</div>';

    Modal.show({
      title: '📅 每日签到',
      content: content,
      confirmText: '领取奖励',
      showCancel: false,
      onConfirm: function() {
        var reward = ResourceManager.claimDailyReward();
        if (reward) {
          var msg = '✅ 签到成功！获得 💰' + (reward.gold || 0);
          if (reward.jade) msg += ' 💎' + reward.jade;
          if (reward.food) msg += ' 🍖' + reward.food;
          if (reward.freeRecruit) msg += ' 🎲免费招募';
          EventBus.emit('toast:show', { type: 'success', message: msg });
        }
        // 刷新设置面板中的签到状态
        if (typeof SettingsPanel !== 'undefined' && SettingsPanel._render) {
          SettingsPanel._render();
        }
      }
    });
  }

  // 页面关闭前保存
  window.addEventListener('beforeunload', () => {
    SaveManager.save(window.getFullState());
  });

  // 移动端切后台时保存（beforeunload 在移动端不可靠）
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      SaveManager.save(window.getFullState());
    }
  });

  // DOM 就绪后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();
