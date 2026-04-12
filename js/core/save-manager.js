/**
 * 存档管理器 —— localStorage 读写 + 自动存档 + 滚动备份
 */
const SaveManager = {
  _autoSaveTimer: null,
  _BACKUP_KEY: CONSTANTS.SAVE_KEY + '_backup',

  /** 保存前先将当前存档备份，再写入新存档 */
  save(state) {
    try {
      const data = JSON.stringify(state);
      // 滚动备份：将上一份有效存档保存为 backup
      try {
        const prev = localStorage.getItem(CONSTANTS.SAVE_KEY);
        if (prev) {
          localStorage.setItem(this._BACKUP_KEY, prev);
        }
      } catch (_) { /* backup 失败不阻断主存档 */ }

      localStorage.setItem(CONSTANTS.SAVE_KEY, data);
      EventBus.emit('game:saved');
    } catch (e) {
      console.error('Save failed:', e);
      EventBus.emit('toast:show', { type: 'error', message: '⚠️ 存档保存失败！' });
    }
  },

  /** 读取存档，若主存档损坏则自动恢复备份 */
  load() {
    var data = this._tryLoad(CONSTANTS.SAVE_KEY);
    if (data) return data;

    // 主存档损坏或丢失，尝试备份
    console.warn('Primary save missing or corrupt, trying backup...');
    data = this._tryLoad(this._BACKUP_KEY);
    if (data) {
      console.warn('Recovered from backup save.');
      // 将备份提升为主存档
      try {
        localStorage.setItem(CONSTANTS.SAVE_KEY, JSON.stringify(data));
      } catch (_) {}
      EventBus.emit('toast:show', { type: 'warning', message: '⚠️ 存档已从备份恢复' });
    }
    return data;
  },

  /** 尝试从指定 key 读取并验证存档 */
  _tryLoad(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      // 基本完整性校验：必须有 version 和 timestamp
      if (parsed && parsed.version && parsed.timestamp) {
        return parsed;
      }
      console.warn('Save at "' + key + '" failed integrity check');
      return null;
    } catch (e) {
      console.error('Load from "' + key + '" failed:', e);
      return null;
    }
  },

  clear() {
    localStorage.removeItem(CONSTANTS.SAVE_KEY);
    localStorage.removeItem(this._BACKUP_KEY);
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
