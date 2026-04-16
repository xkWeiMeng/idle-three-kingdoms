/**
 * 新手引导管理器 —— 顺序提示引导玩家完成核心循环
 *
 * 步骤：
 *   0. 欢迎弹窗（Modal）
 *   1. 首次战斗提示（Toast）
 *   2. 战斗胜利提示（Toast）
 *   3. 首次招募提示（Toast）
 *   4. 引导完成提示（Toast）
 */
var TutorialManager = {
  _state: {
    completed: false,
    currentStep: 0,
    stepsCompleted: []
  },

  _steps: [
    {
      id: 'welcome',
      type: 'modal',
      title: '🏯 欢迎来到幻想三国！',
      content: '<div style="text-align:center;line-height:2;"><p>这是一个放置类三国游戏</p><p>点击下方「<b style="color:#d4a849;">战斗</b>」按钮开始冒险！</p></div>',
      confirmText: '开始冒险！'
    },
    {
      id: 'first_battle',
      type: 'toast',
      toastType: 'info',
      message: '💡 点击「出战」开始你的第一场战斗！',
      event: 'overlay:opened',
      filter: function (panelId) { return panelId === 'battle'; }
    },
    {
      id: 'battle_victory',
      type: 'toast',
      toastType: 'success',
      message: '🎉 恭喜胜利！💰金币和⭐经验已自动获得。试试「招募」获得更多武将！',
      event: 'battle:ended',
      filter: function (data) { return data && data.result === 'victory'; }
    },
    {
      id: 'first_recruit',
      type: 'toast',
      toastType: 'success',
      message: '🎊 新武将已加入队伍！去「武将」面板查看你的英雄们',
      event: 'recruit:result',
      filter: null
    },
    {
      id: 'tutorial_done',
      type: 'toast',
      toastType: 'success',
      message: '✅ 新手引导完成！继续探索更多功能吧 🎉',
      event: 'overlay:opened',
      filter: function (panelId) { return panelId === 'heroes'; }
    }
  ],

  /** 事件监听器引用（用于清理） */
  _listeners: {},

  init: function (saved) {
    // 从存档恢复状态
    if (saved && saved.tutorial) {
      this._state = Utils.deepClone(saved.tutorial);
    }

    // 已完成教程则不注册任何监听
    if (this._state.completed) return;

    // 如果没有 stepsCompleted 数组（兼容），初始化它
    if (!Array.isArray(this._state.stepsCompleted)) {
      this._state.stepsCompleted = [];
    }

    // 注册事件监听
    this._registerListeners();

    // 步骤 0（欢迎弹窗）：新游戏延迟显示
    if (this._state.currentStep === 0 && this._state.stepsCompleted.indexOf(0) === -1) {
      this._scheduleWelcome();
    }
  },

  getState: function () {
    return Utils.deepClone(this._state);
  },

  // ---------- 步骤 0：欢迎弹窗 ----------

  _scheduleWelcome: function () {
    var self = this;
    setTimeout(function () {
      self._tryShowWelcome();
    }, 2000);
  },

  /**
   * 等待其他弹窗（离线收益、每日签到）关闭后再显示欢迎
   */
  _tryShowWelcome: function () {
    var self = this;

    // 如果已经完成或被跳过，不再显示
    if (self._state.completed || self._state.stepsCompleted.indexOf(0) !== -1) return;

    // 检查 Modal 是否正在显示其他弹窗
    if (typeof Modal !== 'undefined' && Modal._overlay &&
        Modal._overlay.style.display !== 'none') {
      setTimeout(function () { self._tryShowWelcome(); }, 500);
      return;
    }

    var step = self._steps[0];
    Modal.show({
      title: step.title,
      content: step.content,
      confirmText: step.confirmText,
      showCancel: false,
      onConfirm: function () {
        self._completeStep(0);
      }
    });
  },

  // ---------- 事件监听注册 ----------

  _registerListeners: function () {
    var self = this;

    // 步骤 1: overlay:opened → battle
    this._listeners.onOverlayForBattle = function (panelId) {
      if (self._state.currentStep !== 1) return;
      var step = self._steps[1];
      if (step.filter && !step.filter(panelId)) return;
      self._showStepHint(1);
      self._completeStep(1);
    };

    // 步骤 2: battle:ended → victory
    this._listeners.onBattleEnded = function (data) {
      if (self._state.currentStep !== 2) return;
      var step = self._steps[2];
      if (step.filter && !step.filter(data)) return;
      self._showStepHint(2);
      self._completeStep(2);
    };

    // 步骤 3: recruit:result
    this._listeners.onRecruitResult = function () {
      if (self._state.currentStep !== 3) return;
      self._showStepHint(3);
      self._completeStep(3);
    };

    // 步骤 4: overlay:opened → heroes
    this._listeners.onOverlayForHeroes = function (panelId) {
      if (self._state.currentStep !== 4) return;
      var step = self._steps[4];
      if (step.filter && !step.filter(panelId)) return;
      self._showStepHint(4);
      self._completeStep(4);
    };

    EventBus.on('overlay:opened', this._listeners.onOverlayForBattle);
    EventBus.on('battle:ended', this._listeners.onBattleEnded);
    EventBus.on('recruit:result', this._listeners.onRecruitResult);
    EventBus.on('overlay:opened', this._listeners.onOverlayForHeroes);
  },

  // ---------- 显示提示 ----------

  _showStepHint: function (stepIndex) {
    var step = this._steps[stepIndex];
    if (!step || step.type !== 'toast') return;

    EventBus.emit('toast:show', {
      type: step.toastType || 'info',
      message: step.message
    });
  },

  // ---------- 步骤推进 ----------

  _completeStep: function (stepIndex) {
    // 防止重复完成
    if (this._state.stepsCompleted.indexOf(stepIndex) !== -1) return;

    this._state.stepsCompleted.push(stepIndex);
    this._state.currentStep = stepIndex + 1;

    // 最后一步完成 → 标记教程结束
    if (this._state.currentStep >= this._steps.length) {
      this._state.completed = true;
      this._unregisterListeners();
    }
  },

  // ---------- 清理 ----------

  _unregisterListeners: function () {
    if (this._listeners.onOverlayForBattle) {
      EventBus.off('overlay:opened', this._listeners.onOverlayForBattle);
    }
    if (this._listeners.onBattleEnded) {
      EventBus.off('battle:ended', this._listeners.onBattleEnded);
    }
    if (this._listeners.onRecruitResult) {
      EventBus.off('recruit:result', this._listeners.onRecruitResult);
    }
    if (this._listeners.onOverlayForHeroes) {
      EventBus.off('overlay:opened', this._listeners.onOverlayForHeroes);
    }
    this._listeners = {};
  }
};
