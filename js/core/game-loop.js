/**
 * 游戏主循环
 */
const GameLoop = {
  _timer: null,
  _lastTick: 0,

  start() {
    this._lastTick = Date.now();
    this._timer = setInterval(() => this._tick(), CONSTANTS.TICK_INTERVAL_MS);
  },

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  _tick() {
    const now = Date.now();
    const dt = (now - this._lastTick) / 1000; // 秒
    this._lastTick = now;

    EventBus.emit('game:tick', dt);
  },
};
