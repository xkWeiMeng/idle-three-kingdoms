/**
 * 武将管理器 — 武将获取、队伍编成、升级、突破、属性计算
 */
const HeroManager = {
  _heroes: [],   // 已拥有的武将实例
  _team: [],     // 上阵武将 uid 列表（最多5人）

  // 突破配置
  ASCEND_MAX_STAR: 5,
  ASCEND_COSTS: [
    { gold: 5000,  jade: 50  },  // 0→1星
    { gold: 15000, jade: 100 },  // 1→2星
    { gold: 40000, jade: 200 },  // 2→3星
    { gold: 80000, jade: 350 },  // 3→4星
    { gold: 150000, jade: 500 }  // 4→5星
  ],
  ASCEND_STAT_BONUS: 0.15, // 每次突破基础属性提升15%

  init(saved) {
    const data = (saved && saved.heroes) ? saved.heroes : (saved || {});
    this._heroes = data.heroes || [];
    this._team = data.team || [];

    // 兼容旧存档：补充 stars 字段
    for (var i = 0; i < this._heroes.length; i++) {
      if (this._heroes[i].stars === undefined) {
        this._heroes[i].stars = 0;
      }
    }

    // 新游戏赠送赵云
    if (this._heroes.length === 0) {
      this.addHero('shu_zhaoyun');
      // 自动上阵
      if (this._heroes.length > 0) {
        this._team = [this._heroes[0].uid];
      }
    }
  },

  /** 根据 id 查找 HeroData 模板 */
  getTemplate(heroId) {
    return HeroData.find(function (h) { return h.id === heroId; });
  },

  /**
   * 获得武将（通过 heroId）
   * 已拥有则转化为经验
   */
  addHero(heroId) {
    var template = this.getTemplate(heroId);
    if (!template) return null;

    var existing = this._heroes.find(function (h) { return h.id === heroId; });
    if (existing) {
      var expGain = template.quality * 100;
      ResourceManager.add('exp', expGain);
      EventBus.emit('toast:show', {
        type: 'info',
        message: template.name + '已拥有，转化为' + expGain + '经验'
      });
      return null;
    }

    var hero = {
      uid: Utils.uid(),
      id: heroId,
      level: 1,
      exp: 0,
      stars: 0,
      equipment: { weapon: null, armor: null, accessory: null, mount: null }
    };
    this._heroes.push(hero);
    EventBus.emit('hero:added', hero);
    return hero;
  },

  /** 所有已拥有武将 */
  getAll() { return this._heroes; },

  /** 上阵武将实例数组 */
  getTeam() {
    var heroes = this._heroes;
    return this._team.map(function (uid) {
      return heroes.find(function (h) { return h.uid === uid; });
    }).filter(Boolean);
  },

  getTeamUids() { return this._team.slice(); },

  /** 加入队伍 */
  addToTeam(uid) {
    if (this._team.length >= CONSTANTS.MAX_TEAM_SIZE) return false;
    if (this._team.includes(uid)) return false;
    if (!this._heroes.find(function (h) { return h.uid === uid; })) return false;
    this._team.push(uid);
    EventBus.emit('hero:team_changed', this.getTeam());
    return true;
  },

  /** 移出队伍 */
  removeFromTeam(uid) {
    var idx = this._team.indexOf(uid);
    if (idx === -1) return false;
    this._team.splice(idx, 1);
    EventBus.emit('hero:team_changed', this.getTeam());
    return true;
  },

  /** 是否上阵 */
  isInTeam(uid) { return this._team.includes(uid); },

  /** 获取武将当前最大等级（每颗星+10级） */
  getMaxLevel(uid) {
    var hero = this._heroes.find(function (h) { return h.uid === uid; });
    if (!hero) return 50;
    return 50 + (hero.stars || 0) * 10;
  },

  /** 升级武将（消耗经验） */
  levelUp(uid) {
    var hero = this._heroes.find(function (h) { return h.uid === uid; });
    if (!hero) return false;
    var maxLevel = this.getMaxLevel(uid);
    if (hero.level >= maxLevel) return false;

    var cost = this.getExpCost(hero.level);
    if (!ResourceManager.canAfford('exp', cost)) return false;

    ResourceManager.spend('exp', cost);
    hero.level++;
    EventBus.emit('hero:levelup', { hero: hero, newLevel: hero.level });
    return true;
  },

  /** 升级所需经验：floor(50 × level^1.5) */
  getExpCost(level) {
    return Math.floor(50 * Math.pow(level, 1.5));
  },

  /** 突破武将（需满级，消耗金币+玉石，星级+1，等级归1） */
  ascend(uid) {
    var hero = this._heroes.find(function (h) { return h.uid === uid; });
    if (!hero) return false;

    var stars = hero.stars || 0;
    if (stars >= this.ASCEND_MAX_STAR) {
      EventBus.emit('toast:show', { type: 'warning', message: '已达最高星级！' });
      return false;
    }

    var maxLevel = this.getMaxLevel(uid);
    if (hero.level < maxLevel) {
      EventBus.emit('toast:show', { type: 'warning', message: '需要达到满级才能突破！' });
      return false;
    }

    var cost = this.ASCEND_COSTS[stars];
    if (!cost) return false;

    if (!ResourceManager.canAfford('gold', cost.gold)) {
      EventBus.emit('toast:show', { type: 'warning', message: '金币不足！需要💰×' + cost.gold });
      return false;
    }
    if (!ResourceManager.canAfford('jade', cost.jade)) {
      EventBus.emit('toast:show', { type: 'warning', message: '玉石不足！需要💎×' + cost.jade });
      return false;
    }

    ResourceManager.spend('gold', cost.gold);
    ResourceManager.spend('jade', cost.jade);
    hero.stars = stars + 1;
    hero.level = 1;
    hero.exp = 0;

    var template = this.getTemplate(hero.id);
    var heroName = template ? template.name : hero.id;
    EventBus.emit('toast:show', {
      type: 'success',
      message: heroName + ' 突破成功！⭐' + '★'.repeat(hero.stars)
    });
    EventBus.emit('hero:ascended', { hero: hero, newStars: hero.stars });
    EventBus.emit('hero:levelup', { hero: hero, newLevel: hero.level });
    return true;
  },

  /** 获取突破费用信息 */
  getAscendInfo(uid) {
    var hero = this._heroes.find(function (h) { return h.uid === uid; });
    if (!hero) return null;
    var stars = hero.stars || 0;
    var maxLevel = this.getMaxLevel(uid);
    var canAscend = stars < this.ASCEND_MAX_STAR && hero.level >= maxLevel;
    var cost = stars < this.ASCEND_MAX_STAR ? this.ASCEND_COSTS[stars] : null;
    return {
      stars: stars,
      maxStars: this.ASCEND_MAX_STAR,
      maxLevel: maxLevel,
      cost: cost,
      canAscend: canAscend
    };
  },

  /**
   * 计算武将完整属性（基础 + 成长 + 装备）
   */
  getHeroStats(uid) {
    var hero = this._heroes.find(function (h) { return h.uid === uid; });
    if (!hero) return null;

    var template = this.getTemplate(hero.id);
    if (!template) return null;
    var growth = GrowthCoefficients[template.quality];

    var stats = {
      atk: template.baseAtk + growth.atk * (hero.level - 1),
      def: template.baseDef + growth.def * (hero.level - 1),
      hp:  template.baseHp  + growth.hp  * (hero.level - 1),
      spd: template.baseSpd + growth.spd * (hero.level - 1)
    };

    // 突破星级加成（每颗星+15%基础属性）
    var starBonus = 1 + (hero.stars || 0) * this.ASCEND_STAT_BONUS;
    stats.atk *= starBonus;
    stats.def *= starBonus;
    stats.hp  *= starBonus;
    stats.spd *= starBonus;

    // 装备加成
    if (hero.equipment && typeof EquipmentManager !== 'undefined' &&
        typeof EquipmentManager.getEquipment === 'function') {
      var slots = Object.keys(hero.equipment);
      for (var i = 0; i < slots.length; i++) {
        var equipUid = hero.equipment[slots[i]];
        if (!equipUid) continue;
        var equip = EquipmentManager.getEquipment(equipUid);
        if (!equip) continue;
        var statKey = (typeof EquipTypeToStat !== 'undefined') ? EquipTypeToStat[equip.type] : null;
        if (statKey && equip.stats && equip.stats[statKey] !== undefined) {
          var bonus = equip.stats[statKey] * (1 + (equip.level || 0) * 0.1);
          stats[statKey] = (stats[statKey] || 0) + bonus;
        }
      }
    }

    stats.atk = Math.floor(stats.atk);
    stats.def = Math.floor(stats.def);
    stats.hp  = Math.floor(stats.hp);
    stats.spd = Math.floor(stats.spd);
    return stats;
  },

  /** 战斗力评分 */
  getBattlePower(uid) {
    var stats = this.getHeroStats(uid);
    if (!stats) return 0;
    var hero = this._heroes.find(function (h) { return h.uid === uid; });
    return Math.floor(
      (stats.atk * 1.5 + stats.def * 1.2 + stats.hp * 0.3 + stats.spd * 1.0) *
      (1 + hero.level * 0.02)
    );
  },

  /** 按 uid 查找武将实例 */
  getHeroByUid(uid) {
    return this._heroes.find(function (h) { return h.uid === uid; });
  },

  getState() {
    return {
      heroes: Utils.deepClone(this._heroes),
      team: this._team.slice()
    };
  }
};
