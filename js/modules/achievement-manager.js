/**
 * 成就管理器 — 里程碑追踪、奖励领取
 */
var AchievementManager = {
  _state: {
    claimed: {}   // { achievementId: claimedMilestoneIndex } — 已领取到第几个里程碑
  },

  init: function (saved) {
    var data = (saved && saved.achievement) ? saved.achievement : {};
    this._state.claimed = data.claimed || {};
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

  _grantRewards: function (rewards) {
    if (rewards.gold) ResourceManager.add('gold', rewards.gold, 'achievement', 'achievement');
    if (rewards.jade) ResourceManager.add('jade', rewards.jade, 'achievement', 'achievement');
    if (rewards.exp) ResourceManager.add('exp', rewards.exp, 'achievement', 'achievement');
  }
};
