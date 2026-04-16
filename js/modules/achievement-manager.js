/**
 * 成就管理器 — 里程碑追踪、奖励领取
 */
var AchievementManager = {
  _state: {
    claimed: {}   // { achievementId: claimedMilestoneIndex } — 已领取到第几个里程碑
  },
  _checking: false,

  init: function (saved) {
    var data = (saved && saved.achievement) ? saved.achievement : {};
    this._state.claimed = data.claimed || {};

    // Subscribe to game events — auto-check & auto-claim milestones
    var self = this;
    EventBus.on('battle:ended', function () { self.checkAndAutoClaim(); });
    EventBus.on('hero:added', function () { self.checkAndAutoClaim(); });
    EventBus.on('hero:levelup', function () { self.checkAndAutoClaim(); });
    EventBus.on('resource:changed', function () { self.checkAndAutoClaim(); });
    EventBus.on('recruit:result', function () { self.checkAndAutoClaim(); });
  },

  getState: function () {
    return Utils.deepClone(this._state);
  },

  /**
   * 获取所有成就的当前状态
   * 返回: [{ id, title, icon, category, progress, milestones: [{target, desc, reward, reached, claimed}], nextMilestone }]
   */
  getAllStatus: function () {
    var result = [];
    for (var i = 0; i < AchievementData.length; i++) {
      var ach = AchievementData[i];
      var progress = 0;
      try { progress = ach.getProgress(); } catch (e) { progress = 0; }
      var claimedIdx = this._state.claimed[ach.id];
      if (claimedIdx === undefined) claimedIdx = -1;

      var milestones = [];
      var nextMilestone = null;
      for (var j = 0; j < ach.milestones.length; j++) {
        var ms = ach.milestones[j];
        var reached = progress >= ms.target;
        var claimed = j <= claimedIdx;
        milestones.push({
          index: j,
          target: ms.target,
          desc: ms.desc,
          reward: ms.reward,
          reached: reached,
          claimed: claimed
        });
        if (!claimed && reached && !nextMilestone) {
          nextMilestone = j;
        }
      }

      result.push({
        id: ach.id,
        title: ach.title,
        icon: ach.icon,
        category: ach.category,
        progress: progress,
        milestones: milestones,
        nextMilestone: nextMilestone,
        totalMilestones: ach.milestones.length,
        claimedCount: claimedIdx + 1
      });
    }
    return result;
  },

  /**
   * 领取指定成就的下一个里程碑奖励
   */
  claimMilestone: function (achievementId) {
    var ach = null;
    for (var i = 0; i < AchievementData.length; i++) {
      if (AchievementData[i].id === achievementId) { ach = AchievementData[i]; break; }
    }
    if (!ach) return false;

    var progress = 0;
    try { progress = ach.getProgress(); } catch (e) { return false; }

    var claimedIdx = this._state.claimed[ach.id];
    if (claimedIdx === undefined) claimedIdx = -1;

    var nextIdx = claimedIdx + 1;
    if (nextIdx >= ach.milestones.length) return false;

    var milestone = ach.milestones[nextIdx];
    if (progress < milestone.target) return false;

    // Grant rewards
    this._grantRewards(milestone.reward);
    this._state.claimed[ach.id] = nextIdx;

    EventBus.emit('toast:show', {
      type: 'success',
      message: '🏆 成就达成：' + ach.title + ' — ' + milestone.desc
    });
    EventBus.emit('achievement:milestone', {
      name: ach.title,
      description: milestone.desc,
      icon: ach.icon
    });
    EventBus.emit('achievement:claimed', { id: ach.id, milestone: nextIdx });
    return true;
  },

  /**
   * 获取可领取的成就数量（用于徽章显示）
   */
  getClaimableCount: function () {
    var count = 0;
    for (var i = 0; i < AchievementData.length; i++) {
      var ach = AchievementData[i];
      var progress = 0;
      try { progress = ach.getProgress(); } catch (e) { continue; }
      var claimedIdx = this._state.claimed[ach.id];
      if (claimedIdx === undefined) claimedIdx = -1;
      var nextIdx = claimedIdx + 1;
      if (nextIdx < ach.milestones.length && progress >= ach.milestones[nextIdx].target) {
        count++;
      }
    }
    return count;
  },

  /**
   * 自动检查并领取所有已达成但未领取的里程碑奖励
   */
  checkAndAutoClaim: function () {
    if (this._checking) return;
    this._checking = true;
    try {
      for (var i = 0; i < AchievementData.length; i++) {
        var ach = AchievementData[i];
        var progress = 0;
        try { progress = ach.getProgress(); } catch (e) { continue; }
        var claimedIdx = this._state.claimed[ach.id];
        if (claimedIdx === undefined) claimedIdx = -1;

        // Auto-claim all reached but unclaimed milestones in sequence
        var nextIdx = claimedIdx + 1;
        while (nextIdx < ach.milestones.length && progress >= ach.milestones[nextIdx].target) {
          var milestone = ach.milestones[nextIdx];
          this._grantRewards(milestone.reward);
          this._state.claimed[ach.id] = nextIdx;

          // Detailed toast with reward info
          var rewardParts = [];
          if (milestone.reward.jade) rewardParts.push('💎' + milestone.reward.jade);
          if (milestone.reward.gold) rewardParts.push('💰' + milestone.reward.gold);
          if (milestone.reward.exp) rewardParts.push('⭐' + milestone.reward.exp);
          var rewardStr = rewardParts.length > 0 ? '！获得 ' + rewardParts.join(' ') : '';
          EventBus.emit('toast:show', {
            type: 'success',
            message: '🏆 成就达成：' + ach.title + ' — ' + milestone.desc + rewardStr
          });
          EventBus.emit('achievement:milestone', {
            name: ach.title,
            description: milestone.desc,
            icon: ach.icon
          });
          EventBus.emit('achievement:claimed', { id: ach.id, milestone: nextIdx });

          nextIdx++;
        }
      }
    } finally {
      this._checking = false;
    }
  },

  _grantRewards: function (rewards) {
    if (rewards.gold) ResourceManager.add('gold', rewards.gold, 'achievement', 'achievement');
    if (rewards.jade) ResourceManager.add('jade', rewards.jade, 'achievement', 'achievement');
    if (rewards.exp) ResourceManager.add('exp', rewards.exp, 'achievement', 'achievement');
  }
};
