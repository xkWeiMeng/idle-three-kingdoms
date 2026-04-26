/** 装备面板 UI */
const EquipmentPanel = {
  _container: null,
  _selectedHero: null,
  _selectedEquip: null,  // Currently expanded inline card
  _filter: 'all',

  _qualityColors: { 1: '#b0a898', 2: '#5d8a48', 3: '#4a7fb5', 4: '#8b5ea8', 5: '#d4a849' },
  _qualityNames: { 1: '白·普通', 2: '绿·精良', 3: '蓝·稀有', 4: '紫·史诗', 5: '橙·传说' },
  _slotNames: null,
  _statLabels: null,
  _initLabels: function () {
    if (!this._slotNames) {
      this._slotNames = {
        weapon: UIIcons.icon('weapon') + '武器',
        armor: UIIcons.icon('armor') + '防具',
        accessory: UIIcons.icon('accessory') + '饰品',
        mount: UIIcons.icon('mount') + '坐骑'
      };
      this._statLabels = {
        atk: UIIcons.icon('attack') + 'ATK',
        def: UIIcons.icon('defense') + 'DEF',
        hp: UIIcons.icon('hp') + 'HP',
        spd: UIIcons.icon('spd') + 'SPD'
      };
    }
  },
  _filterNames: { all: '全部', weapon: '武器', armor: '防具', accessory: '饰品', mount: '坐骑' },

  /** 获取装备图标的 img 标签或 emoji 回退 */
  _equipIcon: function (equip, size) {
    size = size || 32;
    var iconKey = SpriteAtlas.getEquipmentIconKey(equip.type, equip.quality);
    var dataURL = SpriteEngine.getIconDataURL('equipment', iconKey, size);
    if (dataURL) {
      return '<img src="' + dataURL + '" style="width:' + size + 'px;height:' + size + 'px;image-rendering:pixelated;vertical-align:middle;" alt="' + equip.name + '">';
    }
    return equip.emoji || UIIcons.icon('bag');
  },

  init: function () {
    this._initLabels();
    this._container = document.getElementById('panel-equipment');
    this._render();

    var self = this;
    EventBus.on('equip:changed', function () { self._render(); });
    EventBus.on('equip:inventory_changed', function () { self._selectedEquip = null; self._render(); });
    EventBus.on('resource:changed', function () { if (self._selectedEquip) self._render(); });
    EventBus.on('hero:added', function () { self._render(); });
    EventBus.on('hero:team_changed', function () { self._render(); });
  },

  _render: function () {
    if (!this._container) return;

    var heroes = HeroManager.getAll();
    if (heroes.length > 0 && !this._selectedHero) {
      this._selectedHero = heroes[0].uid;
    }
    if (this._selectedHero && !HeroManager.getHeroByUid(this._selectedHero)) {
      this._selectedHero = heroes.length > 0 ? heroes[0].uid : null;
    }
    if (this._selectedEquip && !EquipmentManager.getEquipment(this._selectedEquip)) {
      this._selectedEquip = null;
    }

    var inventory = EquipmentManager.getInventory();
    var maxCapacity = EquipmentManager.getMaxCapacity();

    var html = '';

    // --- Header with capacity ---
    html += '<div class="card" style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<span style="font-size:1.05rem;font-weight:bold;">' + UIIcons.icon('equipment') + ' 装备</span>';
    html += '<span style="color:var(--color-text-dim);font-size:0.85rem;">' + inventory.length + '/' + maxCapacity + '</span>';
    html += '</div>';

    // --- Overflow alert ---
    var overflow = EquipmentManager.getOverflow();
    if (overflow.length > 0) {
      html += '<div class="card" style="background:rgba(179,58,58,0.12);border:1px solid #b33a3a;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<span style="color:#b33a3a;font-size:0.85rem;">' + UIIcons.icon('warning') + ' 溢出栏有 ' + overflow.length + ' 件装备待领取</span>';
      html += '<button class="btn equip-btn-claim" style="font-size:0.75rem;padding:4px 10px;">领取</button>';
      html += '</div>';
      html += '</div>';
    }

    // --- Hero Selector ---
    html += this._renderHeroSelector(heroes);

    // --- Equipment Slots ---
    html += this._renderEquipSlots();

    // --- Inventory (with toolbar) ---
    html += this._renderInventory();

    this._container.innerHTML = html;
    this._bindEvents();
  },

  _renderHeroSelector: function (heroes) {
    if (heroes.length === 0) {
      return '<div class="card" style="text-align:center;color:var(--color-text-dim);">暂无武将，先去招募吧！</div>';
    }

    var html = '<div class="card" style="padding:8px;">';
    html += '<div style="font-size:0.8rem;color:var(--color-text-dim);margin-bottom:6px;">👤 选择武将</div>';
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;padding-bottom:4px;">';

    for (var i = 0; i < heroes.length; i++) {
      var hero = heroes[i];
      var template = HeroManager.getTemplate(hero.id);
      if (!template) continue;

      var color = this._qualityColors[template.quality] || '#aaa';
      var isSelected = hero.uid === this._selectedHero;
      var borderStyle = isSelected ? '3px solid ' + color : '2px solid var(--color-secondary)';
      var bgStyle = isSelected ? color + '22' : 'var(--color-secondary)';

      html += '<div class="equip-hero-tab" data-hero-uid="' + hero.uid + '" ';
      html += 'style="text-align:center;padding:6px 8px;border-radius:6px;cursor:pointer;min-width:48px;';
      html += 'background:' + bgStyle + ';border:' + borderStyle + ';transition:all 0.2s;">';
      html += '<div style="font-size:1.1rem;">' + HeroPortrait.getImgTag(hero.id, 28) + '</div>';
      html += '<div style="font-size:0.6rem;color:' + color + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:48px;">' + template.name + '</div>';
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    return html;
  },

  _renderEquipSlots: function () {
    if (!this._selectedHero) return '';

    var hero = HeroManager.getHeroByUid(this._selectedHero);
    if (!hero) return '';

    var template = HeroManager.getTemplate(hero.id);
    var heroColor = template ? (this._qualityColors[template.quality] || '#aaa') : '#aaa';

    var html = '<div class="card">';
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">';
    html += '<span style="font-weight:bold;font-size:0.85rem;">🎒 武将装备栏</span>';
    if (template) {
      html += '<span style="font-size:0.75rem;color:' + heroColor + ';">' + template.name + '</span>';
    }
    html += '</div>';

    var slots = ['weapon', 'armor', 'accessory', 'mount'];
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var equipUid = hero.equipment ? hero.equipment[slot] : null;
      var equip = equipUid ? EquipmentManager.getEquipment(equipUid) : null;

      html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;';
      html += 'border-radius:6px;background:var(--color-bg);">';

      html += '<span style="font-size:0.78rem;color:var(--color-text-dim);width:60px;">' + this._slotNames[slot] + '</span>';

      if (equip) {
        var eColor = this._qualityColors[equip.quality] || '#aaa';
        var statKey = Object.keys(equip.stats)[0];
        var statVal = EquipmentManager.getEquipStatValue(equip);

        html += '<div style="flex:1;display:flex;align-items:center;gap:6px;">';
        html += '<span style="font-size:1rem;">' + this._equipIcon(equip, 28) + '</span>';
        html += '<span style="color:' + eColor + ';font-size:0.82rem;font-weight:bold;">' + equip.name;
        if (equip.level > 0) html += ' +' + equip.level;
        html += '</span>';
        html += '<span style="font-size:0.72rem;color:var(--color-text-dim);margin-left:auto;">';
        html += (this._statLabels[statKey] || statKey) + '+' + Math.floor(statVal);
        html += '</span>';
        html += '</div>';
        html += '<button class="btn equip-btn-unequip" data-equip-uid="' + equip.uid + '" ';
        html += 'style="font-size:0.7rem;padding:3px 8px;background:var(--color-secondary);">卸下</button>';
      } else {
        html += '<span style="flex:1;font-size:0.8rem;color:var(--color-text-dim);">空</span>';
      }

      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  _renderInventory: function () {
    var inventory = EquipmentManager.getInventory();
    var expandInfo = EquipmentManager.getExpandInfo();

    // Filter to unequipped items
    var items = [];
    for (var i = 0; i < inventory.length; i++) {
      var eq = inventory[i];
      if (eq.equippedBy) continue;
      if (this._filter !== 'all' && eq.type !== this._filter) continue;
      items.push(eq);
    }

    var html = '<div class="card">';

    // --- Toolbar row 1: title + capacity + expand ---
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    html += '<span style="font-weight:bold;font-size:0.85rem;">' + UIIcons.icon('bag') + ' 背包</span>';
    html += '<span style="font-size:0.75rem;color:var(--color-text-dim);">' + items.length + ' 件</span>';
    html += '</div>';
    // Expand button
    if (expandInfo.canExpand) {
      html += '<button class="btn equip-btn-expand" style="font-size:0.68rem;padding:3px 8px;background:var(--color-secondary);">';
      html += '+10 ' + UIIcons.icon('gold') + Utils.formatNumber(expandInfo.nextCost) + '</button>';
    } else {
      html += '<span style="font-size:0.68rem;color:var(--color-text-dim);">已满</span>';
    }
    html += '</div>';

    // --- Toolbar row 2: filters + sort/sell ---
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:4px;">';
    // Filter buttons
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;flex:1;">';
    var filters = ['all', 'weapon', 'armor', 'accessory', 'mount'];
    for (var f = 0; f < filters.length; f++) {
      var fKey = filters[f];
      var isActive = this._filter === fKey;
      html += '<button class="btn equip-filter-btn" data-filter="' + fKey + '" ';
      html += 'style="font-size:0.7rem;padding:3px 8px;';
      if (isActive) {
        html += 'background:var(--color-primary);';
      } else {
        html += 'background:var(--color-secondary);';
      }
      html += '">' + this._filterNames[fKey] + '</button>';
    }
    html += '</div>';
    // Sort + Batch sell buttons
    html += '<div style="display:flex;gap:4px;">';
    html += '<button class="btn equip-btn-sort" style="font-size:0.68rem;padding:3px 8px;background:var(--color-secondary);">🔃排序</button>';
    html += '<button class="btn equip-btn-batch-sell" style="font-size:0.68rem;padding:3px 8px;background:var(--color-danger);">' + UIIcons.icon('sell') + '售卖</button>';
    html += '</div>';
    html += '</div>';

    // --- Grid of items with inline expansion ---
    if (items.length === 0) {
      html += '<div style="text-align:center;color:var(--color-text-dim);padding:16px 0;font-size:0.85rem;">背包空空如也</div>';
    } else {
      html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">';
      for (var j = 0; j < items.length; j++) {
        html += this._renderInventoryCard(items[j]);
        // Inline action area (expands below, spans full row)
        if (items[j].uid === this._selectedEquip) {
          html += this._renderInlineActions(items[j]);
        }
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  _renderInventoryCard: function (equip) {
    var color = this._qualityColors[equip.quality] || '#aaa';
    var isSelected = equip.uid === this._selectedEquip;
    var statKey = Object.keys(equip.stats)[0];
    var statVal = EquipmentManager.getEquipStatValue(equip);
    var glowStyle = equip.quality >= 4 ? 'box-shadow:0 0 8px ' + color + '40;' : '';
    var selectedStyle = isSelected ? 'box-shadow:0 0 0 2px var(--color-gold),0 0 10px var(--color-gold)44;' : '';

    var html = '<div class="equip-inv-card" data-equip-uid="' + equip.uid + '" ';
    html += 'style="text-align:center;padding:8px 4px;border-radius:6px;cursor:pointer;';
    html += 'background:var(--color-secondary);border:2px solid ' + color + ';';
    html += glowStyle + selectedStyle + 'transition:all 0.2s;">';

    html += '<div style="font-size:1.3rem;position:relative;">';
    html += this._equipIcon(equip, 36);
    if (equip.level > 0) {
      html += '<span style="position:absolute;top:-2px;right:2px;font-size:0.55rem;color:var(--color-gold);font-weight:bold;">+' + equip.level + '</span>';
    }
    html += '</div>';

    html += '<div style="font-size:0.68rem;color:' + color + ';margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + equip.name + '</div>';

    html += '<div style="font-size:0.62rem;color:var(--color-text-dim);margin-top:2px;">';
    html += (this._statLabels[statKey] || statKey) + '+' + Math.floor(statVal);
    html += '</div>';

    // 词缀指示器
    if (equip.affixes && equip.affixes.length > 0) {
      html += '<div style="font-size:0.55rem;margin-top:2px;">';
      for (var ai = 0; ai < equip.affixes.length; ai++) {
        html += equip.affixes[ai].icon;
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  /** Render inline action area below a selected card (spans 3 columns) */
  _renderInlineActions: function (equip) {
    var color = this._qualityColors[equip.quality] || '#aaa';
    var qName = this._qualityNames[equip.quality] || '白·普通';
    var statKey = Object.keys(equip.stats)[0];
    var totalVal = EquipmentManager.getEquipStatValue(equip);
    var maxLevel = EquipMaxLevel[equip.quality] || 5;
    var isMaxLevel = equip.level >= maxLevel;
    var reinforceCost = EquipmentManager.getReinforceCost(equip.uid);
    var sellPrice = EquipSellPrice[equip.quality] || 50;
    var canReinforce = !isMaxLevel && ResourceManager.canAfford('gold', reinforceCost);
    var isEquipped = !!equip.equippedBy;

    var html = '<div class="equip-inline-actions" style="grid-column:1/-1;padding:10px;border-radius:6px;';
    html += 'background:var(--color-surface);border:1px solid ' + color + '55;margin-top:-2px;">';

    // Info row: name + quality + stat
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">';
    html += '<span style="font-weight:bold;color:' + color + ';font-size:0.85rem;">' + equip.name;
    if (equip.level > 0) html += ' +' + equip.level;
    html += '</span>';
    html += '<span style="font-size:0.6rem;padding:1px 5px;border-radius:3px;background:' + color + '22;color:' + color + ';border:1px solid ' + color + '55;">' + qName + '</span>';
    html += '<span style="font-size:0.72rem;color:var(--color-text-dim);margin-left:auto;">';
    html += (this._statLabels[statKey] || statKey) + ' +' + Math.floor(totalVal);
    html += '</span>';
    html += '</div>';

    // 词缀展示
    if (equip.affixes && equip.affixes.length > 0) {
      html += '<div style="margin-bottom:6px;display:flex;flex-wrap:wrap;gap:3px;">';
      for (var aIdx = 0; aIdx < equip.affixes.length; aIdx++) {
        var af = equip.affixes[aIdx];
        var afColor = af.type === 'combat' ? '#e94560' : '#4caf50';
        html += '<span style="font-size:0.65rem;padding:1px 6px;border-radius:8px;background:' + afColor + '18;color:' + afColor + ';border:1px solid ' + afColor + '44;">';
        html += af.icon + ' ' + af.desc;
        html += '</span>';
      }
      html += '</div>';
    }

    // Equipped status
    if (isEquipped) {
      var equipHero = HeroManager.getHeroByUid(equip.equippedBy);
      var equipTemplate = equipHero ? HeroManager.getTemplate(equipHero.id) : null;
      html += '<div style="font-size:0.72rem;color:var(--color-gold);margin-bottom:6px;">';
      html += '已装备于: ' + (equipTemplate ? HeroPortrait.getImgTag(equipTemplate.id, 16) + ' ' + equipTemplate.name : '未知武将');
      html += '</div>';
    }

    // Action buttons
    html += '<div style="display:flex;gap:6px;">';

    // Equip/Unequip button
    if (isEquipped) {
      html += '<button class="btn equip-inline-unequip" data-equip-uid="' + equip.uid + '" ';
      html += 'style="flex:1;font-size:0.75rem;padding:5px 6px;background:var(--color-secondary);">卸下</button>';
    } else if (this._selectedHero) {
      html += '<button class="btn equip-inline-equip" data-equip-uid="' + equip.uid + '" ';
      html += 'style="flex:1;font-size:0.75rem;padding:5px 6px;">装备</button>';
    }

    // Reinforce button
    if (!isMaxLevel) {
      html += '<button class="btn equip-inline-reinforce" data-equip-uid="' + equip.uid + '" ';
      html += 'style="flex:1;font-size:0.75rem;padding:5px 6px;background:var(--color-gold);color:#111;';
      if (!canReinforce) html += 'opacity:0.5;cursor:not-allowed;';
      html += '"';
      if (!canReinforce) html += ' disabled';
      html += '>强化 ' + UIIcons.icon('gold') + Utils.formatNumber(reinforceCost) + '</button>';
    } else {
      html += '<button class="btn" style="flex:1;font-size:0.75rem;padding:5px 6px;background:var(--color-gold);color:#111;opacity:0.5;" disabled>已满级</button>';
    }

    // Sell button (not for unsellable)
    if (!equip.unsellable) {
      html += '<button class="btn equip-inline-sell" data-equip-uid="' + equip.uid + '" ';
      html += 'style="flex:1;font-size:0.75rem;padding:5px 6px;background:var(--color-danger);">出售 ' + UIIcons.icon('gold') + sellPrice + '</button>';
    }

    html += '</div>';
    html += '</div>';
    return html;
  },

  _bindEvents: function () {
    var self = this;

    // Hero selector tabs
    var heroTabs = this._container.querySelectorAll('.equip-hero-tab');
    for (var i = 0; i < heroTabs.length; i++) {
      heroTabs[i].addEventListener('click', function () {
        var uid = this.getAttribute('data-hero-uid');
        if (uid) self._onSelectHero(uid);
      });
    }

    // Unequip buttons in slots
    var unequipBtns = this._container.querySelectorAll('.equip-btn-unequip');
    for (var j = 0; j < unequipBtns.length; j++) {
      unequipBtns[j].addEventListener('click', function () {
        var uid = this.getAttribute('data-equip-uid');
        if (uid) self._onUnequip(uid);
      });
    }

    // Inventory cards — toggle inline expansion
    var invCards = this._container.querySelectorAll('.equip-inv-card');
    for (var k = 0; k < invCards.length; k++) {
      invCards[k].addEventListener('click', function () {
        var uid = this.getAttribute('data-equip-uid');
        if (uid) self._onSelectEquip(uid);
      });
    }

    // Filter buttons
    var filterBtns = this._container.querySelectorAll('.equip-filter-btn');
    for (var f = 0; f < filterBtns.length; f++) {
      filterBtns[f].addEventListener('click', function () {
        var filter = this.getAttribute('data-filter');
        if (filter) {
          self._filter = filter;
          self._selectedEquip = null;
          self._render();
        }
      });
    }

    // Sort button
    var sortBtn = this._container.querySelector('.equip-btn-sort');
    if (sortBtn) {
      sortBtn.addEventListener('click', function () {
        EquipmentManager.sortInventory();
      });
    }

    // Batch sell button
    var batchSellBtn = this._container.querySelector('.equip-btn-batch-sell');
    if (batchSellBtn) {
      batchSellBtn.addEventListener('click', function () {
        self._showBatchSellModal();
      });
    }

    // Expand button
    var expandBtn = this._container.querySelector('.equip-btn-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', function () {
        self._showExpandModal();
      });
    }

    // Inline equip button
    var inlineEquipBtns = this._container.querySelectorAll('.equip-inline-equip');
    for (var ie = 0; ie < inlineEquipBtns.length; ie++) {
      inlineEquipBtns[ie].addEventListener('click', function (e) {
        e.stopPropagation();
        var uid = this.getAttribute('data-equip-uid');
        if (uid) self._onEquip(uid);
      });
    }

    // Inline unequip button
    var inlineUnequipBtns = this._container.querySelectorAll('.equip-inline-unequip');
    for (var iu = 0; iu < inlineUnequipBtns.length; iu++) {
      inlineUnequipBtns[iu].addEventListener('click', function (e) {
        e.stopPropagation();
        var uid = this.getAttribute('data-equip-uid');
        if (uid) self._onUnequip(uid);
      });
    }

    // Inline reinforce button
    var inlineReinforceBtns = this._container.querySelectorAll('.equip-inline-reinforce');
    for (var ir = 0; ir < inlineReinforceBtns.length; ir++) {
      inlineReinforceBtns[ir].addEventListener('click', function (e) {
        e.stopPropagation();
        var uid = this.getAttribute('data-equip-uid');
        if (uid) self._onReinforce(uid);
      });
    }

    // Inline sell button
    var inlineSellBtns = this._container.querySelectorAll('.equip-inline-sell');
    for (var is = 0; is < inlineSellBtns.length; is++) {
      inlineSellBtns[is].addEventListener('click', function (e) {
        e.stopPropagation();
        var uid = this.getAttribute('data-equip-uid');
        if (uid) self._onSell(uid);
      });
    }

    // Overflow claim button
    var claimBtn = this._container.querySelector('.equip-btn-claim');
    if (claimBtn) {
      claimBtn.addEventListener('click', function () {
        EquipmentManager.claimOverflow();
        self._render();
      });
    }
  },

  _showExpandModal: function () {
    var info = EquipmentManager.getExpandInfo();
    if (!info.canExpand) return;
    var self = this;
    Modal.show({
      title: '背包扩容',
      content: '<p style="font-size:0.85rem;">确定花费 ' + UIIcons.icon('gold') + '×' + Utils.formatNumber(info.nextCost) + ' 扩展背包 +10 格？</p>' +
        '<p style="font-size:0.75rem;color:var(--color-text-dim);">已扩展：' + info.expandedSlots + '/' + info.maxExpand + ' 格</p>',
      confirmText: '确定扩容',
      onConfirm: function () {
        EquipmentManager.expandInventory();
        self._render();
      }
    });
  },

  _showBatchSellModal: function () {
    var inventory = EquipmentManager.getInventory();
    var self = this;
    var qualityNames = this._qualityNames;
    var qualityColors = this._qualityColors;

    // Calculate counts and gold for each quality threshold
    var content = '<div style="font-size:0.85rem;margin-bottom:10px;">选择品质阈值，出售所有 ≤ 该品质的未穿戴装备：</div>';
    content += '<div style="display:flex;flex-direction:column;gap:6px;">';
    for (var q = 1; q <= 5; q++) {
      var count = 0;
      var gold = 0;
      for (var i = 0; i < inventory.length; i++) {
        var eq = inventory[i];
        if (eq.quality <= q && eq.equippedBy === null && eq.unsellable !== true) {
          count++;
          gold += EquipSellPrice[eq.quality] || 0;
        }
      }
      var color = qualityColors[q] || '#aaa';
      content += '<button class="btn batch-sell-quality-btn" data-quality="' + q + '" ';
      content += 'style="text-align:left;padding:8px 12px;background:var(--color-secondary);border:1px solid ' + color + '55;';
      if (count === 0) content += 'opacity:0.5;cursor:not-allowed;';
      content += '"' + (count === 0 ? ' disabled' : '') + '>';
      content += '<span style="color:' + color + ';font-weight:bold;">≤ ' + (qualityNames[q] || '?') + '</span>';
      content += '<span style="float:right;font-size:0.75rem;color:var(--color-text-dim);">' + count + '件 ' + UIIcons.icon('gold') + Utils.formatNumber(gold) + '</span>';
      content += '</button>';
    }
    content += '</div>';

    Modal.show({
      title: '一键售卖',
      content: content,
      confirmText: null,
      onConfirm: null
    });

    // Bind quality buttons after modal renders
    setTimeout(function () {
      var btns = document.querySelectorAll('.batch-sell-quality-btn');
      for (var b = 0; b < btns.length; b++) {
        btns[b].addEventListener('click', function () {
          var q = parseInt(this.getAttribute('data-quality'));
          if (!q) return;
          EquipmentManager.batchSell(q);
          self._selectedEquip = null;
          if (typeof Modal !== 'undefined' && Modal.close) Modal.close();
          self._render();
        });
      }
    }, 50);
  },

  _onSelectHero: function (uid) {
    this._selectedHero = uid;
    this._render();
  },

  _onSelectEquip: function (uid) {
    // Toggle inline expansion
    this._selectedEquip = (this._selectedEquip === uid) ? null : uid;
    this._render();
  },

  _onEquip: function (equipUid) {
    if (this._selectedHero) {
      EquipmentManager.equip(equipUid, this._selectedHero);
    }
  },

  _onUnequip: function (equipUid) {
    var equip = EquipmentManager.getEquipment(equipUid);
    if (equip && equip.equippedBy) {
      EquipmentManager.unequip(equipUid, equip.equippedBy);
    }
  },

  _onReinforce: function (equipUid) {
    EquipmentManager.reinforce(equipUid);
    this._render();
  },

  _onSell: function (equipUid) {
    EquipmentManager.sell(equipUid);
    this._selectedEquip = null;
    this._render();
  }
};
