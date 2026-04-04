/**
 * 游戏入口 — 幻想三国
 */
(function () {
  'use strict';

  // 品质颜色映射（全局使用）
  window.QualityColors = { 1:'#aaaaaa', 2:'#4caf50', 3:'#2196f3', 4:'#9c27b0', 5:'#ff9800', 6:'#ff2222' };
  window.QualityNames  = { 1:'白·普通', 2:'绿·精良', 3:'蓝·稀有', 4:'紫·史诗', 5:'橙·传说', 6:'红·神话' };

  function getFullState() {
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
      settings: typeof SettingsPanel !== 'undefined' && SettingsPanel.getState
        ? SettingsPanel.getState() : {},
    };
  }

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

    // 初始化 UI
    Toast.init();
    Modal.init();
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
    MerchantPanel.init();
    ForgePanel.init();
    AbyssPanel.init();

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
    });

    // 离线收益计算
    if (saved?.timestamp) {
      const offlineSeconds = Math.min((Date.now() - saved.timestamp) / 1000, 86400);
      if (offlineSeconds > 60) {
        _showOfflineRewards(offlineSeconds, saved);
      }
    }

    // 每日签到检查
    const dailyInfo = ResourceManager.checkDailyLogin();
    if (dailyInfo && !dailyInfo.claimed) {
      setTimeout(() => {
        EventBus.emit('toast:show', { type: 'info', message: '📅 每日签到奖励可领取！' });
      }, 2000);
    }

    // 启动
    GameLoop.start();
    SaveManager.startAutoSave(getFullState);

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

    var effPct = Math.round((rewards.efficiency || 0.5) * 100);
    var regionLine = rewards.region ? `<p>英雄们在「${rewards.region}」替你战斗了</p>` : '';

    setTimeout(() => {
      Modal.show({
        title: '☀ 欢迎回来！',
        content: `
          <div style="text-align:center;line-height:2;">
            <p>你离开了 <b style="color:#f5c518">${timeStr}</b></p>
            ${regionLine}
            <p>共完成 <b style="color:#f5c518">${Utils.formatNumber(rewards.battles)}</b> 场战斗</p>
            <hr style="border-color:#333;margin:8px 0;">
            <p>💰 金币 <b style="color:#f5c518">+${Utils.formatNumber(rewards.gold)}</b></p>
            <p>⭐ 经验 <b style="color:#f5c518">+${Utils.formatNumber(rewards.exp)}</b></p>
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

  // 页面关闭前保存
  window.addEventListener('beforeunload', () => {
    SaveManager.save(getFullState());
  });

  // DOM 就绪后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();
