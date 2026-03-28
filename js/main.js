/**
 * 游戏入口 — 幻想三国
 */
(function () {
  'use strict';

  // 品质颜色映射（全局使用）
  window.QualityColors = { 1:'#aaaaaa', 2:'#4caf50', 3:'#2196f3', 4:'#9c27b0', 5:'#ff9800' };
  window.QualityNames  = { 1:'白·普通', 2:'绿·精良', 3:'蓝·稀有', 4:'紫·史诗', 5:'橙·传说' };

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
      settings: typeof SettingsPanel !== 'undefined' && SettingsPanel.getState
        ? SettingsPanel.getState() : {},
    };
  }

  function initGame() {
    const saved = SaveManager.load();

    // 初始化各模块
    ResourceManager.init(saved);
    HeroManager.init(saved);
    BattleManager.init(saved);
    RecruitManager.init(saved);
    EquipmentManager.init(saved);
    StoryManager.init(saved);

    // 初始化 UI
    Toast.init();
    Modal.init();
    TabController.init();
    ResourcesBar.init();
    HeroPanel.init();
    BattlePanel.init();
    RecruitPanel.init();
    EquipmentPanel.init();
    StoryPanel.init();
    SettingsPanel.init(saved);

    // 注册 tick 回调
    EventBus.on('game:tick', (dt) => {
      ResourceManager.onTick(dt);
      BattleManager.onTick(dt);
      StoryManager.onTick(dt);
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
    // 离线收益：50%效率
    const stage = StageData.find(s => s.id === (saved.battle?.currentStage || 'stage_1_1'));
    if (!stage) return;

    const hours = Math.floor(offlineSeconds / 3600);
    const mins = Math.floor((offlineSeconds % 3600) / 60);

    const goldPerSec = stage.rewards.gold / 5;
    const expPerSec = stage.rewards.exp / 5;
    const offlineGold = Math.floor(goldPerSec * offlineSeconds * 0.5);
    const offlineExp = Math.floor(expPerSec * offlineSeconds * 0.5);

    if (offlineGold > 0) ResourceManager.add('gold', offlineGold);
    if (offlineExp > 0) ResourceManager.add('exp', offlineExp);

    const timeStr = hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;

    setTimeout(() => {
      Modal.show({
        title: '🌙 离线收益',
        content: `
          <div style="text-align:center;line-height:2;">
            <p>你离开了 <b style="color:#f5c518">${timeStr}</b></p>
            <p>获得 💰 <b style="color:#f5c518">${Utils.formatNumber(offlineGold)}</b> 金币</p>
            <p>获得 ⭐ <b style="color:#f5c518">${Utils.formatNumber(offlineExp)}</b> 经验</p>
            <p style="color:#999;font-size:0.68rem;">（离线效率50%）</p>
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
