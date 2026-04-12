/**
 * 每日任务管理器 — 任务刷新、进度追踪、奖励领取
 */
var QuestManager = {
  _state: {
    quests: [],         // 当日任务列表 [{id, templateId, progress, target, claimed}]
    bonusClaimed: false, // 全完成宝箱是否已领
    lastRefreshDate: '', // 上次刷新日期 YYYY-MM-DD
    totalCompleted: 0    // 累计完成任务数
  },

  // 事件监听器引用（用于清理）
  _listeners: {},

  init: function (saved) {
    var data = (saved && saved.quest) ? saved.quest : {};
    this._state.quests = data.quests || [];
    this._state.bonusClaimed = data.bonusClaimed || false;
    this._state.lastRefreshDate = data.lastRefreshDate || '';
    this._state.totalCompleted = data.totalCompleted || 0;

    // 检查是否需要刷新（新的一天）
    var today = this._getTodayStr();
    if (this._state.lastRefreshDate !== today) {
      this._refreshQuests();
    }

    // 注册事件监听
    this._registerListeners();
  },

  getState: function () {
    return Utils.deepClone(this._state);
  },

  onTick: function (dt) {
    // 每 tick 检查是否跨天（玩家长时间不关闭页面的情况）
    var today = this._getTodayStr();
    if (this._state.lastRefreshDate !== today) {
      this._refreshQuests();
      EventBus.emit('quest:refreshed');
    }
  },

  // ===== 刷新任务 =====

  _refreshQuests: function () {
    var today = this._getTodayStr();
    this._state.lastRefreshDate = today;
    this._state.bonusClaimed = false;

    // 用日期作为伪随机种子，确保同一天刷新结果相同
    var seed = this._dateToSeed(today);
    var selected = this._selectQuests(seed);

    this._state.quests = [];
    for (var i = 0; i < selected.length; i++) {
      var tpl = selected[i];
      this._state.quests.push({
        id: tpl.id,
        templateId: tpl.id,
        title: tpl.title,
        desc: tpl.desc,
        event: tpl.event,
        category: tpl.category,
        target: tpl.target,
        progress: 0,
        claimed: false,
        rewards: Utils.deepClone(tpl.rewards),
        hasFilter: !!tpl.filter,
        hasAccumulate: !!tpl.accumulate
      });
    }
  },

  _selectQuests: function (seed) {
    // 从模板池中选取 DAILY_QUEST_COUNT 个不同类别优先的任务
    var pool = QuestTemplates.slice();
    var selected = [];
    var usedCategories = {};
    var rng = this._seededRandom(seed);

    // 第一轮：每个类别最多选1个（保证多样性）
    var shuffled = this._shuffle(pool, rng);
    for (var i = 0; i < shuffled.length && selected.length < DAILY_QUEST_COUNT; i++) {
      var tpl = shuffled[i];
      if (!usedCategories[tpl.category]) {
        selected.push(tpl);
        usedCategories[tpl.category] = true;
      }
    }

    // 第二轮：如果还不够，从剩余中补充
    if (selected.length < DAILY_QUEST_COUNT) {
      var selectedIds = {};
      for (var j = 0; j < selected.length; j++) selectedIds[selected[j].id] = true;
      for (var k = 0; k < shuffled.length && selected.length < DAILY_QUEST_COUNT; k++) {
        if (!selectedIds[shuffled[k].id]) {
          selected.push(shuffled[k]);
          selectedIds[shuffled[k].id] = true;
        }
      }
    }

    return selected;
  },

  // ===== 进度追踪 =====

  _registerListeners: function () {
    var self = this;

    // 收集所有当前任务需要监听的事件
    var events = {};
    for (var i = 0; i < QuestTemplates.length; i++) {
      var evt = QuestTemplates[i].event;
      if (!events[evt]) events[evt] = true;
    }

    // 为每个事件注册监听
    for (var eventName in events) {
      if (!events.hasOwnProperty(eventName)) continue;
      (function (en) {
        var handler = function () {
          var args = Array.prototype.slice.call(arguments);
          self._onEvent(en, args);
        };
        self._listeners[en] = handler;
        EventBus.on(en, handler);
      })(eventName);
    }
  },

  _onEvent: function (eventName, args) {
    var changed = false;

    for (var i = 0; i < this._state.quests.length; i++) {
      var quest = this._state.quests[i];
      if (quest.event !== eventName) continue;
      if (quest.claimed) continue;
      if (quest.progress >= quest.target) continue;

      // 查找对应模板以获取 filter/accumulate 函数
      var tpl = this._getTemplate(quest.templateId);

      // 检查过滤条件
      if (tpl && tpl.filter) {
        if (!tpl.filter.apply(null, args)) continue;
      }

      // 计算进度增量
      var increment = 1;
      if (tpl && tpl.accumulate) {
        increment = tpl.accumulate.apply(null, args);
        if (increment <= 0) continue;
      }

      quest.progress = Math.min(quest.progress + increment, quest.target);
      changed = true;

      // 检查是否刚完成
      if (quest.progress >= quest.target) {
        EventBus.emit('toast:show', {
          type: 'success',
          message: '📋 任务完成：' + quest.title
        });
        EventBus.emit('quest:completed', { questId: quest.id });
      }
    }

    if (changed) {
      EventBus.emit('quest:progress', {});
    }
  },

  _getTemplate: function (templateId) {
    for (var i = 0; i < QuestTemplates.length; i++) {
      if (QuestTemplates[i].id === templateId) return QuestTemplates[i];
    }
    return null;
  },

  // ===== 领取奖励 =====

  claimReward: function (questId) {
    var quest = null;
    for (var i = 0; i < this._state.quests.length; i++) {
      if (this._state.quests[i].id === questId) {
        quest = this._state.quests[i];
        break;
      }
    }
    if (!quest) return false;
    if (quest.claimed) return false;
    if (quest.progress < quest.target) return false;

    quest.claimed = true;
    this._state.totalCompleted++;

    // 发放奖励
    this._grantRewards(quest.rewards);

    var rewardText = this._formatRewards(quest.rewards);
    EventBus.emit('toast:show', {
      type: 'success',
      message: '领取奖励：' + rewardText
    });
    EventBus.emit('quest:claimed', { questId: questId });

    // 检查是否全部完成
    this._checkAllComplete();
    return true;
  },

  claimBonus: function () {
    if (this._state.bonusClaimed) return false;
    if (!this.isAllComplete()) return false;

    this._state.bonusClaimed = true;
    this._grantRewards(QuestBonusReward);

    var rewardText = this._formatRewards(QuestBonusReward);
    EventBus.emit('toast:show', {
      type: 'success',
      message: '🎁 全部完成！额外奖励：' + rewardText
    });
    EventBus.emit('quest:bonus_claimed');
    return true;
  },

  // ===== 查询方法 =====

  getQuests: function () {
    return Utils.deepClone(this._state.quests);
  },

  isAllComplete: function () {
    for (var i = 0; i < this._state.quests.length; i++) {
      if (!this._state.quests[i].claimed) return false;
    }
    return this._state.quests.length > 0;
  },

  isBonusClaimed: function () {
    return this._state.bonusClaimed;
  },

  getCompletionCount: function () {
    var count = 0;
    for (var i = 0; i < this._state.quests.length; i++) {
      if (this._state.quests[i].claimed) count++;
    }
    return count;
  },

  getTotalCompleted: function () {
    return this._state.totalCompleted;
  },

  // ===== 内部工具 =====

  _grantRewards: function (rewards) {
    if (rewards.gold) ResourceManager.add('gold', rewards.gold, 'quest', 'daily_quest');
    if (rewards.jade) ResourceManager.add('jade', rewards.jade, 'quest', 'daily_quest');
    if (rewards.exp) ResourceManager.add('exp', rewards.exp, 'quest', 'daily_quest');
    if (rewards.food) ResourceManager.add('food', rewards.food, 'quest', 'daily_quest');
    if (rewards.wood) ResourceManager.add('wood', rewards.wood, 'quest', 'daily_quest');
    if (rewards.stone) ResourceManager.add('stone', rewards.stone, 'quest', 'daily_quest');
    if (rewards.iron) ResourceManager.add('iron', rewards.iron, 'quest', 'daily_quest');
  },

  _formatRewards: function (rewards) {
    var parts = [];
    if (rewards.gold) parts.push('💰' + rewards.gold);
    if (rewards.jade) parts.push('💎' + rewards.jade);
    if (rewards.exp) parts.push('⭐' + rewards.exp);
    if (rewards.food) parts.push('🍚' + rewards.food);
    if (rewards.wood) parts.push('🪵' + rewards.wood);
    if (rewards.stone) parts.push('🪨' + rewards.stone);
    if (rewards.iron) parts.push('⛏️' + rewards.iron);
    return parts.join(' ');
  },

  _checkAllComplete: function () {
    if (this.isAllComplete() && !this._state.bonusClaimed) {
      EventBus.emit('toast:show', {
        type: 'info',
        message: '🎁 所有每日任务已完成！领取额外宝箱奖励！'
      });
    }
  },

  _getTodayStr: function () {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  },

  _dateToSeed: function (dateStr) {
    var hash = 0;
    for (var i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  },

  _seededRandom: function (seed) {
    var s = seed;
    return function () {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  },

  _shuffle: function (arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }
};
