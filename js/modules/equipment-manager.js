/**
 * 装备管理器 —— 装备掉落、强化、穿戴、出售
 */
const EquipmentManager = {
  _inventory: [],     // Array of equipment instances
  _maxSlots: 50,
  _overflow: [],      // Items pending claim when inventory full

  init(saved) {
    const data = (saved && saved.equipment) ? saved.equipment : saved;
    if (data && data.inventory) {
      this._inventory = data.inventory || [];
      this._maxSlots = data.maxSlots || 50;
      this._overflow = data.overflow || [];
    }
  },

  // Generate a random equipment drop based on chapter quality weights
  generateDrop(chapter, qualityWeights) {
    // 1. Roll quality from weights
    const totalWeight = Object.values(qualityWeights).reduce((s, w) => s + w, 0);
    let roll = Math.random() * totalWeight;
    let quality = 1;
    for (const [q, weight] of Object.entries(qualityWeights)) {
      roll -= weight;
      if (roll <= 0) { quality = parseInt(q); break; }
    }

    // 2. Random equipment type (25% each)
    const types = ['weapon', 'armor', 'accessory', 'mount'];
    const type = types[Utils.randInt(0, 3)];

    // 3. Find matching template
    const template = EquipmentData.find(e => e.type === type && e.quality === quality);
    if (!template) return null;

    // 4. Roll random stat within range
    const statValue = Utils.randInt(template.statRange[0], template.statRange[1]);

    // 5. Create equipment instance
    const equip = {
      uid: Utils.uid(),
      id: template.id,
      name: template.name,
      type: template.type,
      quality: template.quality,
      emoji: template.emoji,
      description: template.description,
      stats: { [template.statType]: statValue },
      level: 0,
      equippedBy: null
    };

    // 6. Add to inventory or overflow
    if (this._inventory.length < this._maxSlots) {
      this._inventory.push(equip);
    } else if (this._overflow.length < 10) {
      this._overflow.push(equip);
      EventBus.emit('toast:show', { type: 'warning', message: `背包已满！${equip.name}放入溢出栏` });
    } else {
      EventBus.emit('toast:show', { type: 'error', message: `溢出栏已满！${equip.name}丢失了` });
      return null;
    }

    return equip;
  },

  // Add equipment to inventory (with overflow handling)
  addToInventory(equip) {
    if (!equip) return false;
    if (this._inventory.length < this._maxSlots) {
      this._inventory.push(equip);
      return true;
    } else if (this._overflow.length < 10) {
      this._overflow.push(equip);
      EventBus.emit('toast:show', { type: 'warning', message: `背包已满！${equip.name}放入溢出栏` });
      return true;
    } else {
      EventBus.emit('toast:show', { type: 'error', message: `溢出栏已满！${equip.name}丢失了` });
      return false;
    }
  },

  // Get equipment by uid
  getEquipment(uid) {
    return this._inventory.find(e => e.uid === uid);
  },

  // Get all inventory
  getInventory() { return this._inventory; },
  getOverflow() { return this._overflow; },

  // Claim overflow items
  claimOverflow() {
    const claimed = [];
    while (this._overflow.length > 0 && this._inventory.length < this._maxSlots) {
      const item = this._overflow.shift();
      this._inventory.push(item);
      claimed.push(item);
    }
    return claimed;
  },

  // Equip item to hero
  equip(equipUid, heroUid) {
    const equip = this._inventory.find(e => e.uid === equipUid);
    if (!equip) return false;

    const hero = HeroManager.getHeroByUid(heroUid);
    if (!hero) return false;

    const slot = equip.type;  // weapon, armor, accessory, mount

    // Unequip current item in that slot
    if (hero.equipment[slot]) {
      this.unequip(hero.equipment[slot], heroUid);
    }

    // If equipment is equipped by someone else, unequip from them first
    if (equip.equippedBy && equip.equippedBy !== heroUid) {
      const otherHero = HeroManager.getHeroByUid(equip.equippedBy);
      if (otherHero) {
        otherHero.equipment[slot] = null;
      }
    }

    equip.equippedBy = heroUid;
    hero.equipment[slot] = equipUid;
    EventBus.emit('equip:changed', { hero, equipment: equip });
    return true;
  },

  // Unequip item from hero
  unequip(equipUid, heroUid) {
    const equip = this._inventory.find(e => e.uid === equipUid);
    if (!equip) return false;

    const hero = HeroManager.getHeroByUid(heroUid);
    if (hero) {
      const slot = equip.type;
      if (hero.equipment[slot] === equipUid) {
        hero.equipment[slot] = null;
      }
    }
    equip.equippedBy = null;
    EventBus.emit('equip:changed', { hero, equipment: equip });
    return true;
  },

  // Reinforce (upgrade) equipment
  reinforce(equipUid) {
    const equip = this._inventory.find(e => e.uid === equipUid);
    if (!equip) return false;

    const maxLevel = EquipMaxLevel[equip.quality] || 25;
    if (equip.level >= maxLevel) {
      EventBus.emit('toast:show', { type: 'warning', message: '已达最大强化等级！' });
      return false;
    }

    const cost = this._calcReinforceCost(equip);
    if (!ResourceManager.canAfford('gold', cost)) {
      EventBus.emit('toast:show', { type: 'warning', message: `金币不足！需要💰×${cost}` });
      return false;
    }

    ResourceManager.spend('gold', cost);
    equip.level++;

    EventBus.emit('toast:show', { type: 'success', message: `${equip.name} 强化至 +${equip.level}` });
    return true;
  },

  _calcReinforceCost: function (equip) {
    if (equip.quality === 6) {
      // Mythic: 600 × (1 + lv × 0.5) + lv × 200
      return Math.floor(600 * (1 + equip.level * 0.5) + equip.level * 200);
    }
    return Math.floor(equip.quality * 100 * (1 + equip.level * 0.5));
  },

  // Get reinforce cost for next level
  getReinforceCost(equipUid) {
    const equip = this._inventory.find(e => e.uid === equipUid);
    if (!equip) return 0;
    return this._calcReinforceCost(equip);
  },

  // Sell equipment
  sell(equipUid) {
    const idx = this._inventory.findIndex(e => e.uid === equipUid);
    if (idx === -1) return false;

    const equip = this._inventory[idx];
    if (equip.unsellable) {
      EventBus.emit('toast:show', { type: 'warning', message: '神话装备不可出售！' });
      return false;
    }
    if (equip.equippedBy) {
      this.unequip(equipUid, equip.equippedBy);
    }

    const price = EquipSellPrice[equip.quality] || 0;
    ResourceManager.add('gold', price);
    this._inventory.splice(idx, 1);

    EventBus.emit('toast:show', { type: 'success', message: `出售 ${equip.name} 获得💰×${price}` });
    return true;
  },

  // Get equipment stat display value (base + reinforcement bonus)
  getEquipStatValue(equip) {
    if (!equip) return 0;
    const statKey = Object.keys(equip.stats)[0];
    const growthRate = equip.quality === 6 ? 0.08 : 0.1;
    return equip.stats[statKey] * (1 + equip.level * growthRate);
  },

  getState() {
    return {
      inventory: Utils.deepClone(this._inventory),
      maxSlots: this._maxSlots,
      overflow: Utils.deepClone(this._overflow)
    };
  }
};
