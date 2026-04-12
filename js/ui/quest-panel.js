/**
 * 每日任务面板 — 显示当日任务列表、进度、领取按钮
 */
var QuestPanel = {
  _container: null,

  init: function () {
    var self = this;
    EventBus.on('quest:progress', function () { self._render(); });
    EventBus.on('quest:claimed', function () { self._render(); });
    EventBus.on('quest:bonus_claimed', function () { self._render(); });
    EventBus.on('quest:refreshed', function () { self._render(); });
    EventBus.on('quest:completed', function () { self._render(); });
  },

  show: function () {
    var html = this._buildHtml();
    OverlayPanel.show({
      title: '📋 每日任务',
      content: html,
      panelId: 'quest',
      height: 'full'
    });
    this._container = document.querySelector('.quest-panel-content');
    this._bindEvents();
  },

  _render: function () {
    if (!this._container) return;
    // Check if quest panel is still visible
    var panel = document.querySelector('.quest-panel-content');
    if (!panel) { this._container = null; return; }
    this._container.innerHTML = this._buildInner();
    this._bindEvents();
  },

  _buildHtml: function () {
    return '<div class="quest-panel-content">' + this._buildInner() + '</div>';
  },

  _buildInner: function () {
    var quests = QuestManager.getQuests();
    var completionCount = QuestManager.getCompletionCount();
    var total = quests.length;
    var allComplete = QuestManager.isAllComplete();
    var bonusClaimed = QuestManager.isBonusClaimed();

    var html = '';

    // Progress header
    html += '<div style="text-align:center;padding:12px 0 8px;">';
    html += '<div style="font-size:1.1rem;font-weight:bold;color:var(--color-gold);">';
    html += '今日进度 ' + completionCount + '/' + total;
    html += '</div>';

    // Progress bar
    var pct = total > 0 ? Math.round(completionCount / total * 100) : 0;
    html += '<div style="margin:8px auto;max-width:280px;height:8px;background:var(--color-surface-dark,#120e0a);border-radius:4px;overflow:hidden;">';
    html += '<div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,var(--color-gold),var(--color-primary));transition:width .3s;border-radius:4px;"></div>';
    html += '</div>';
    html += '</div>';

    // Bonus chest
    html += '<div style="text-align:center;padding:8px;margin:0 12px 12px;border-radius:8px;';
    if (allComplete && !bonusClaimed) {
      html += 'background:linear-gradient(135deg,#4a3728,#6b4d30);border:1px solid var(--color-gold);cursor:pointer;" class="quest-bonus-btn">';
      html += '<span style="font-size:1.5rem;">🎁</span>';
      html += '<div style="color:var(--color-gold);font-weight:bold;margin-top:4px;">全部完成！点击领取宝箱</div>';
      html += '<div style="color:var(--color-text-dim,#a09080);font-size:0.75rem;margin-top:2px;">';
      html += this._formatRewards(QuestBonusReward);
      html += '</div>';
    } else if (bonusClaimed) {
      html += 'background:var(--color-surface-dark,#120e0a);opacity:0.6;">';
      html += '<span style="font-size:1.5rem;">✅</span>';
      html += '<div style="color:var(--color-text-dim,#a09080);margin-top:4px;">宝箱已领取</div>';
    } else {
      html += 'background:var(--color-surface-dark,#120e0a);border:1px solid var(--color-secondary,#4a3728);">';
      html += '<span style="font-size:1.5rem;opacity:0.4;">🎁</span>';
      html += '<div style="color:var(--color-text-dim,#a09080);margin-top:4px;">完成全部任务可领取宝箱</div>';
      html += '<div style="color:var(--color-text-muted,#605040);font-size:0.75rem;margin-top:2px;">';
      html += this._formatRewards(QuestBonusReward);
      html += '</div>';
    }
    html += '</div>';

    // Quest list
    for (var i = 0; i < quests.length; i++) {
      html += this._renderQuestCard(quests[i]);
    }

    // Stats footer
    html += '<div style="text-align:center;padding:12px;color:var(--color-text-dim,#a09080);font-size:0.7rem;">';
    html += '累计完成任务：' + QuestManager.getTotalCompleted() + ' 个';
    html += '</div>';

    return html;
  },

  _renderQuestCard: function (quest) {
    var isComplete = quest.progress >= quest.target;
    var isClaimed = quest.claimed;
    var icon = QuestCategoryIcons[quest.category] || '📋';
    var pct = Math.min(Math.round(quest.progress / quest.target * 100), 100);

    var borderColor = isClaimed ? 'var(--color-success,#5d8a48)' :
                      isComplete ? 'var(--color-gold)' :
                      'var(--color-secondary,#4a3728)';
    var opacity = isClaimed ? '0.6' : '1';

    var html = '<div style="margin:0 12px 10px;padding:12px;border-radius:8px;';
    html += 'background:var(--color-surface,#2a2018);border:1px solid ' + borderColor + ';';
    html += 'opacity:' + opacity + ';">';

    // Title row
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    html += '<span style="font-size:1.2rem;">' + icon + '</span>';
    html += '<div>';
    html += '<div style="font-weight:bold;color:var(--color-text,#e8dcc8);">' + quest.title + '</div>';
    html += '<div style="font-size:0.75rem;color:var(--color-text-dim,#a09080);">' + quest.desc + '</div>';
    html += '</div>';
    html += '</div>';

    // Status / claim button
    if (isClaimed) {
      html += '<span style="color:var(--color-success,#5d8a48);font-weight:bold;font-size:0.8rem;">✅ 已领取</span>';
    } else if (isComplete) {
      html += '<button class="btn quest-claim-btn" data-quest-id="' + quest.id + '" ';
      html += 'style="background:var(--color-gold);color:#1a1410;font-size:0.75rem;padding:4px 12px;border-radius:4px;font-weight:bold;cursor:pointer;border:none;">';
      html += '领取</button>';
    } else {
      html += '<span style="color:var(--color-text-dim,#a09080);font-size:0.8rem;">' + quest.progress + '/' + quest.target + '</span>';
    }

    html += '</div>';

    // Progress bar
    var barColor = isClaimed ? 'var(--color-success,#5d8a48)' :
                   isComplete ? 'var(--color-gold)' :
                   'var(--color-primary,#c0392b)';
    html += '<div style="height:4px;background:var(--color-surface-dark,#120e0a);border-radius:2px;overflow:hidden;">';
    html += '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';transition:width .3s;border-radius:2px;"></div>';
    html += '</div>';

    // Rewards line
    html += '<div style="margin-top:6px;font-size:0.7rem;color:var(--color-text-dim,#a09080);">';
    html += '奖励：' + this._formatRewards(quest.rewards);
    html += '</div>';

    html += '</div>';
    return html;
  },

  _bindEvents: function () {
    if (!this._container) return;

    // Claim individual quest
    var claimBtns = this._container.querySelectorAll('.quest-claim-btn');
    for (var i = 0; i < claimBtns.length; i++) {
      claimBtns[i].addEventListener('click', function (e) {
        e.stopPropagation();
        var questId = this.getAttribute('data-quest-id');
        QuestManager.claimReward(questId);
      });
    }

    // Claim bonus chest
    var bonusBtn = this._container.querySelector('.quest-bonus-btn');
    if (bonusBtn) {
      bonusBtn.addEventListener('click', function () {
        QuestManager.claimBonus();
      });
    }
  },

  _formatRewards: function (rewards) {
    var parts = [];
    if (rewards.gold) parts.push('💰' + Utils.formatNumber(rewards.gold));
    if (rewards.jade) parts.push('💎' + rewards.jade);
    if (rewards.exp) parts.push('⭐' + Utils.formatNumber(rewards.exp));
    if (rewards.food) parts.push('🍚' + rewards.food);
    return parts.join(' ');
  }
};
