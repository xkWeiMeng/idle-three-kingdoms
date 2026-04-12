/**
 * 成就面板 UI
 */
var AchievementPanel = {
  _filterCategory: 'all',

  init: function () {
    EventBus.on('achievement:claimed', function () { AchievementPanel._refreshIfOpen(); });
  },

  show: function () {
    this._filterCategory = 'all';
    this._render();
  },

  _render: function () {
    var achievements = AchievementManager.getAllStatus();
    var categories = AchievementCategories;
    var filter = this._filterCategory;

    // Compute stats
    var totalClaimed = 0, totalMilestones = 0;
    for (var i = 0; i < achievements.length; i++) {
      totalClaimed += achievements[i].claimedCount;
      totalMilestones += achievements[i].totalMilestones;
    }

    // Filter
    var filtered = achievements;
    if (filter !== 'all') {
      filtered = [];
      for (var i = 0; i < achievements.length; i++) {
        if (achievements[i].category === filter) filtered.push(achievements[i]);
      }
    }

    // Sort: claimable first, then incomplete, then completed
    filtered.sort(function (a, b) {
      var aClaimable = a.nextMilestone !== null ? 0 : 1;
      var bClaimable = b.nextMilestone !== null ? 0 : 1;
      if (aClaimable !== bClaimable) return aClaimable - bClaimable;
      var aComplete = a.claimedCount >= a.totalMilestones ? 1 : 0;
      var bComplete = b.claimedCount >= b.totalMilestones ? 1 : 0;
      return aComplete - bComplete;
    });

    // Build HTML
    var html = '<div class="achievement-panel">';

    // Progress overview
    html += '<div style="text-align:center;padding:8px 12px;background:var(--color-surface);border-radius:8px;margin-bottom:12px;">';
    html += '<span style="color:var(--color-gold);font-size:1.1em;">🏆 ' + totalClaimed + ' / ' + totalMilestones + '</span>';
    html += '<div style="margin-top:4px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">';
    var pct = totalMilestones > 0 ? Math.round(totalClaimed / totalMilestones * 100) : 0;
    html += '<div style="width:' + pct + '%;height:100%;background:var(--color-gold);border-radius:3px;"></div>';
    html += '</div></div>';

    // Category tabs
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px;">';
    html += '<button class="btn btn-sm' + (filter === 'all' ? ' btn-active' : '') + '" onclick="AchievementPanel._setFilter(\'all\')" style="font-size:12px;padding:4px 8px;">全部</button>';
    for (var key in categories) {
      var cat = categories[key];
      html += '<button class="btn btn-sm' + (filter === key ? ' btn-active' : '') + '" onclick="AchievementPanel._setFilter(\'' + key + '\')" style="font-size:12px;padding:4px 8px;">' + cat.icon + ' ' + cat.name + '</button>';
    }
    html += '</div>';

    // Achievement list
    for (var i = 0; i < filtered.length; i++) {
      var ach = filtered[i];
      html += this._renderAchievement(ach);
    }

    if (filtered.length === 0) {
      html += '<div style="text-align:center;color:var(--color-text-dim);padding:20px;">暂无成就</div>';
    }

    html += '</div>';

    OverlayPanel.show({
      title: '🏆 成就',
      content: html,
      panelId: 'achievements',
      height: 'full'
    });
  },

  _renderAchievement: function (ach) {
    var isComplete = ach.claimedCount >= ach.totalMilestones;
    var nextMs = null;
    var currentTarget = 0;
    var prevTarget = 0;

    // Find current active milestone
    for (var j = 0; j < ach.milestones.length; j++) {
      if (!ach.milestones[j].claimed) {
        nextMs = ach.milestones[j];
        currentTarget = nextMs.target;
        prevTarget = j > 0 ? ach.milestones[j - 1].target : 0;
        break;
      }
    }
    if (!nextMs && ach.milestones.length > 0) {
      nextMs = ach.milestones[ach.milestones.length - 1];
      currentTarget = nextMs.target;
      prevTarget = ach.milestones.length > 1 ? ach.milestones[ach.milestones.length - 2].target : 0;
    }

    var segProgress = ach.progress - prevTarget;
    var segTotal = currentTarget - prevTarget;
    var pct = segTotal > 0 ? Math.min(100, Math.round(segProgress / segTotal * 100)) : 100;

    var borderColor = isComplete ? 'var(--color-gold)' : (ach.nextMilestone !== null ? 'var(--color-success)' : 'var(--color-secondary)');
    var opacity = isComplete ? '0.7' : '1';

    var html = '<div style="background:var(--color-surface);border-radius:8px;padding:10px 12px;margin-bottom:8px;border-left:3px solid ' + borderColor + ';opacity:' + opacity + ';">';

    // Title row
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
    html += '<div style="display:flex;align-items:center;gap:6px;">';
    html += '<span style="font-size:1.2em;">' + ach.icon + '</span>';
    html += '<span style="font-weight:bold;color:var(--color-text);">' + ach.title + '</span>';
    if (isComplete) {
      html += '<span style="font-size:0.8em;color:var(--color-gold);">✅ 已完成</span>';
    }
    html += '</div>';
    html += '<span style="font-size:0.8em;color:var(--color-text-dim);">' + ach.claimedCount + '/' + ach.totalMilestones + '</span>';
    html += '</div>';

    // Current milestone info
    if (nextMs) {
      html += '<div style="font-size:0.85em;color:var(--color-text-dim);margin-bottom:4px;">' + nextMs.desc + '</div>';
    }

    // Progress bar
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
    html += '<div style="flex:1;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">';
    var barColor = isComplete ? 'var(--color-gold)' : 'var(--color-primary)';
    html += '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px;transition:width 0.3s;"></div>';
    html += '</div>';
    html += '<span style="font-size:0.8em;color:var(--color-text-dim);white-space:nowrap;">' + Utils.formatNumber(ach.progress) + '/' + Utils.formatNumber(currentTarget) + '</span>';
    html += '</div>';

    // Milestone dots + claim button
    html += '<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">';
    for (var j = 0; j < ach.milestones.length; j++) {
      var ms = ach.milestones[j];
      if (ms.claimed) {
        html += '<span style="width:14px;height:14px;border-radius:50%;background:var(--color-gold);display:inline-flex;align-items:center;justify-content:center;font-size:8px;" title="' + ms.desc + '">✓</span>';
      } else if (ms.reached) {
        html += '<span style="width:14px;height:14px;border-radius:50%;background:var(--color-success);display:inline-flex;align-items:center;justify-content:center;font-size:8px;cursor:pointer;" title="' + ms.desc + '">!</span>';
      } else {
        html += '<span style="width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,0.15);display:inline-block;" title="' + ms.desc + '"></span>';
      }
    }

    // Claim button if available
    if (ach.nextMilestone !== null) {
      var rewardText = this._formatReward(ach.milestones[ach.nextMilestone].reward);
      html += '<button class="btn btn-sm" onclick="AchievementPanel._claim(\'' + ach.id + '\')" style="margin-left:auto;font-size:11px;padding:3px 10px;background:var(--color-success);color:#fff;border:none;border-radius:4px;">领取 ' + rewardText + '</button>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  },

  _formatReward: function (reward) {
    var parts = [];
    if (reward.gold) parts.push(Utils.formatNumber(reward.gold) + '金');
    if (reward.jade) parts.push(reward.jade + '玉');
    if (reward.exp) parts.push(Utils.formatNumber(reward.exp) + '经验');
    return parts.join('+');
  },

  _setFilter: function (category) {
    this._filterCategory = category;
    this._render();
  },

  _claim: function (achievementId) {
    AchievementManager.claimMilestone(achievementId);
    this._render();
  },

  _refreshIfOpen: function () {
    var panel = document.querySelector('.achievement-panel');
    if (panel) this._render();
  }
};
