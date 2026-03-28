/**
 * 存档管理器 —— localStorage 读写 + 自动存档
 */
const SaveManager = {
  _autoSaveTimer: null,

  save(state) {
    try {
      const data = JSON.stringify(state);
      localStorage.setItem(CONSTANTS.SAVE_KEY, data);
      EventBus.emit('game:saved');
    } catch (e) {
      console.error('Save failed:', e);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(CONSTANTS.SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  },

  clear() {
    localStorage.removeItem(CONSTANTS.SAVE_KEY);
  },

  startAutoSave(getStateFn) {
    this.stopAutoSave();
    this._autoSaveTimer = setInterval(() => {
      this.save(getStateFn());
    }, CONSTANTS.SAVE_INTERVAL_MS);
  },

  stopAutoSave() {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
  },
};
