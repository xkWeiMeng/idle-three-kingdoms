/**
 * 招募管理器 —— 抽卡 / 招募系统（含保底机制）
 */
const RecruitManager = {
  _state: {
    pity: { rare: 0, epic: 0, legendary: 0 },
    totalRecruits: 0,
    freeRecruitUsed: false
  },

  /** CAP-ERH-14: 上一次 _determineQuality 是否由保底触发 */
  _lastPityTriggered: false,

  init(saved) {
    if (saved && saved.recruit) {
      this._state = Utils.deepClone(saved.recruit);
    } else if (saved && saved.pity) {
      // 兼容直接传入 recruit 子对象
      this._state = Utils.deepClone(saved);
    }
  },

  // Determine hero quality using pity system
  _determineQuality() {
    this._lastPityTriggered = false;
    // 1. Check orange pity (80 pulls)
    if (this._state.pity.legendary >= 79) { this._lastPityTriggered = true; return 5; }
    // 2. Check purple pity (30 pulls)
    if (this._state.pity.epic >= 29) { this._lastPityTriggered = true; return 4; }
    // 3. Check blue pity (10 pulls)
    if (this._state.pity.rare >= 9) { this._lastPityTriggered = true; return 3; }
    // 4. Normal probability
    const roll = Math.random() * 100;
    if (roll < 3) return 5;        // 3% Legendary
    if (roll < 12) return 4;       // 9% Epic
    if (roll < 30) return 3;       // 18% Rare
    if (roll < 60) return 2;       // 30% Uncommon
    return 1;                       // 40% Common
  },

  // Update pity counters after a pull
  _updatePity(quality) {
    this._state.pity.rare++;
    this._state.pity.epic++;
    this._state.pity.legendary++;

    if (quality >= 3) this._state.pity.rare = 0;
    if (quality >= 4) this._state.pity.epic = 0;
    if (quality >= 5) this._state.pity.legendary = 0;

    this._state.totalRecruits++;
  },

  // Perform a single recruit
  _doSingleRecruit() {
    const quality = this._determineQuality();
    const isPityTriggered = this._lastPityTriggered;
    this._updatePity(quality);

    // Select random hero from quality pool
    const pool = HeroPoolByQuality[quality];
    if (!pool || pool.length === 0) {
      // Fallback: common soldier
      const commonPool = HeroPoolByQuality[1];
      const heroId = commonPool[Utils.randInt(0, commonPool.length - 1)];
      return { heroId, quality: 1, isPityTriggered: false };
    }
    const heroId = pool[Utils.randInt(0, pool.length - 1)];
    return { heroId, quality, isPityTriggered };
  },

  // Single recruit (costs 100 jade)
  recruitSingle() {
    if (!ResourceManager.canAfford('jade', 100)) {
      EventBus.emit('toast:show', { type: 'warning', message: '玉璧不足！需要💎×100' });
      return null;
    }
    ResourceManager.spend('jade', 100);
    const result = this._doSingleRecruit();
    const hero = HeroManager.addHero(result.heroId);
    const template = HeroData.find(h => h.id === result.heroId);

    EventBus.emit('recruit:result', {
      results: [{ heroId: result.heroId, quality: result.quality, isNew: !!hero, template, isPityTriggered: result.isPityTriggered }],
      pity: {...this._state.pity}
    });
    return result;
  },

  // 10-pull recruit (costs 900 jade, 10% discount)
  recruitTen() {
    if (!ResourceManager.canAfford('jade', 900)) {
      EventBus.emit('toast:show', { type: 'warning', message: '玉璧不足！需要💎×900' });
      return null;
    }
    ResourceManager.spend('jade', 900);
    const results = [];
    for (let i = 0; i < 10; i++) {
      const result = this._doSingleRecruit();
      const hero = HeroManager.addHero(result.heroId);
      const template = HeroData.find(h => h.id === result.heroId);
      results.push({ heroId: result.heroId, quality: result.quality, isNew: !!hero, template, isPityTriggered: result.isPityTriggered });
    }

    EventBus.emit('recruit:result', { results, pity: {...this._state.pity} });
    return results;
  },

  // Free single recruit for new players (guaranteed Blue+)
  freeRecruit() {
    if (this._state.freeRecruitUsed) return null;
    this._state.freeRecruitUsed = true;

    // Force Blue quality or higher
    this._state.pity.rare = 9;
    const result = this._doSingleRecruit();
    const hero = HeroManager.addHero(result.heroId);
    const template = HeroData.find(h => h.id === result.heroId);

    EventBus.emit('recruit:result', {
      results: [{ heroId: result.heroId, quality: result.quality, isNew: !!hero, template, isPityTriggered: result.isPityTriggered }],
      pity: {...this._state.pity}
    });
    return result;
  },

  isFreeRecruitAvailable() { return !this._state.freeRecruitUsed; },
  getPity() { return {...this._state.pity}; },
  getTotalRecruits() { return this._state.totalRecruits; },

  getState() {
    return Utils.deepClone(this._state);
  }
};
