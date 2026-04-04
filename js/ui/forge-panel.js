/**
 * 锻造面板 UI —— 武器店锻造系统
 */
var ForgePanel = {
  _qualityColors: { 1:'#aaa', 2:'#4caf50', 3:'#2196f3', 4:'#9c27b0', 5:'#ff9800', 6:'#ff2222' },
  _qualityNames: { 1:'白', 2:'绿', 3:'蓝', 4:'紫', 5:'橙', 6:'神话' },

  init: function () {
    EventBus.on('forge:completed', this._onUpdate.bind(this));
    EventBus.on('forge:mythic_completed', this._onUpdate.bind(this));
    EventBus.on('forge:mythic_paused', this._onUpdate.bind(this));
    EventBus.on('resource:changed', this._onUpdate.bind(this));
  },

  _onUpdate: function () {
    var el = document.getElementById('forge-panel-content');
    if (el) this.show();
  },

  show: function () {
    var html = this._render();
    OverlayPanel.show({
      title: '🔨 锻造工坊',
      content: html,
      panelId: 'forge',
      height: 'full'
    });
    this._bindEvents();
  },

  _render: function () {
    var forgeState = ForgeManager.getState();
    var queue = forgeState.queue || [];
    var mythicForge = forgeState.mythicForge || {};
    var blueprints = forgeState.blueprints || [];

    var html = '<div id="forge-panel-content">';

    // Current forge queue
    html += '<div class="card">';
    html += '<div style="font-weight:bold;font-size:0.9rem;margin-bottom:8px;">⏳ 锻造队列</div>';

    if (queue.length === 0) {
      html += '<div style="text-align:center;color:var(--color-text-dim);padding:12px;">炉火已熄，等待新的锻造任务</div>';
    } else {
      for (var q = 0; q < queue.length; q++) {
        var item = queue[q];
        if (item.isMythic || item.quality === 6) continue; // mythic shown separately
        var remaining = Math.max(0, item.totalTime - item.elapsedTime);
        var progress = item.totalTime > 0 ? Math.min(100, (item.elapsedTime / item.totalTime * 100)) : 100;
        var mStr = Math.floor(remaining / 60);
        var sStr = Math.floor(remaining % 60);
        var col = this._qualityColors[item.quality] || '#aaa';
        var name = item.label || (this._qualityNames[item.quality] + '装备');

        html += '<div style="padding:6px 8px;margin-bottom:4px;border-radius:6px;background:var(--color-bg);">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '<span style="color:' + col + ';font-size:0.85rem;font-weight:bold;">' + name + '</span>';
        if (item.completed) {
          html += '<span style="font-size:0.75rem;color:var(--color-success);">✅ 完成</span>';
        } else {
          html += '<span style="font-size:0.72rem;color:var(--color-text-dim);">' + mStr + ':' + (sStr < 10 ? '0' : '') + sStr + '</span>';
        }
        html += '</div>';
        html += '<div style="height:4px;background:#333;border-radius:2px;margin-top:4px;">';
        html += '<div style="height:100%;width:' + progress.toFixed(1) + '%;background:' + col + ';border-radius:2px;"></div>';
        html += '</div>';
        html += '</div>';
      }
    }
    html += '</div>';

    // Mythic forge
    if (mythicForge.blueprintId) {
      var bp = BlueprintData[mythicForge.blueprintId];
      if (bp) {
        var mProgress = mythicForge.progress || 0;
        var mRequired = mythicForge.requiredTime || 86400;
        var mPct = Math.min(100, mProgress / mRequired * 100);
        var mRemain = mRequired - mProgress;
        var mH = Math.floor(mRemain / 3600);
        var mM = Math.floor((mRemain % 3600) / 60);
        var paused = mythicForge.paused;

        html += '<div class="card" style="border:1px solid #ff222244;">';
        html += '<div style="font-weight:bold;font-size:0.9rem;color:#ff2222;margin-bottom:8px;">🔴 神话锻造</div>';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">';
        html += '<span style="font-size:1rem;">' + (bp.emoji || '⚔️') + '</span>';
        html += '<div style="flex:1;">';
        html += '<span style="color:#ff2222;font-weight:bold;">' + bp.name + '</span>';
        if (paused) {
          html += '<span style="font-size:0.7rem;color:var(--color-danger);margin-left:4px;">⚠ 资源不足，暂停中</span>';
        }
        html += '</div>';
        html += '<span style="font-size:0.72rem;color:var(--color-text-dim);">' + mH + '时' + mM + '分</span>';
        html += '</div>';
        html += '<div style="height:6px;background:#333;border-radius:3px;">';
        html += '<div style="height:100%;width:' + mPct.toFixed(1) + '%;background:linear-gradient(90deg,#ff2222,#ff6644);border-radius:3px;"></div>';
        html += '</div>';
        html += '<div style="font-size:0.68rem;color:var(--color-text-dim);margin-top:4px;">进度 ' + mPct.toFixed(1) + '% · 持续消耗资源中</div>';
        html += '</div>';
      }
    }

    // Normal recipes
    html += '<div class="card">';
    html += '<div style="font-weight:bold;font-size:0.9rem;margin-bottom:8px;">📜 普通锻造</div>';

    var recipes = ForgeManager.getNormalRecipes();
    for (var r = 0; r < recipes.length; r++) {
      var recipe = recipes[r];
      var rc = this._qualityColors[recipe.quality] || '#aaa';
      var costParts = [];
      if (recipe.cost.gold) costParts.push('💰' + Utils.formatNumber(recipe.cost.gold));
      if (recipe.cost.iron) costParts.push('⛏️' + recipe.cost.iron);
      if (recipe.cost.wood) costParts.push('🪵' + recipe.cost.wood);
      var timeMin = Math.ceil(recipe.time / 60);

      html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;';
      html += 'border-radius:6px;background:var(--color-bg);">';
      html += '<span style="font-size:1rem;">' + (recipe.emoji || '⚔️') + '</span>';
      html += '<div style="flex:1;">';
      html += '<span style="color:' + rc + ';font-size:0.85rem;font-weight:bold;">' + this._qualityNames[recipe.quality] + '装备</span>';
      html += '<div style="font-size:0.68rem;color:var(--color-text-dim);">' + costParts.join(' ') + ' · ⏱' + timeMin + '分钟</div>';
      html += '</div>';
      html += '<button class="btn forge-start-normal" data-recipe-idx="' + r + '" ';
      html += 'style="font-size:0.75rem;padding:4px 10px;">锻造</button>';
      html += '</div>';
    }
    html += '</div>';

    // Mythic blueprints
    if (blueprints.length > 0) {
      html += '<div class="card" style="border:1px solid #ff222244;">';
      html += '<div style="font-weight:bold;font-size:0.9rem;color:#ff2222;margin-bottom:8px;">📋 神话图纸</div>';

      for (var b = 0; b < blueprints.length; b++) {
        var bpId = blueprints[b];
        var bpData = BlueprintData[bpId];
        if (!bpData) continue;

        var matParts = [];
        for (var mk in bpData.materials) {
          if (mk === 'gold') matParts.push('💰' + Utils.formatNumber(bpData.materials[mk]));
          else if (mk === 'iron') matParts.push('⛏️' + bpData.materials[mk]);
          else if (mk === 'wood') matParts.push('🪵' + bpData.materials[mk]);
          else if (mk === 'stone') matParts.push('🪨' + bpData.materials[mk]);
        }
        var perSecParts = [];
        for (var pk in bpData.perSecondCost) {
          if (pk === 'gold') perSecParts.push('💰' + bpData.perSecondCost[pk] + '/s');
          else if (pk === 'iron') perSecParts.push('⛏️' + bpData.perSecondCost[pk] + '/s');
        }

        var isForging = mythicForge.blueprintId === bpId;

        html += '<div style="padding:8px;margin-bottom:6px;border-radius:8px;background:rgba(255,34,34,0.06);">';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        html += '<span style="font-size:1rem;">' + (bpData.emoji || '⚔️') + '</span>';
        html += '<div style="flex:1;">';
        html += '<span style="color:#ff2222;font-weight:bold;font-size:0.88rem;">' + bpData.name + '</span>';
        html += '<div style="font-size:0.68rem;color:var(--color-text-dim);">一次性: ' + matParts.join(' ') + '</div>';
        html += '<div style="font-size:0.68rem;color:var(--color-text-dim);">持续: ' + perSecParts.join(' ') + '</div>';
        html += '<div style="font-size:0.66rem;color:var(--color-gold);">套装：' + EquipmentSets[bpData.setId].name + '</div>';
        html += '</div>';

        if (isForging) {
          html += '<span style="font-size:0.75rem;color:var(--color-success);">锻造中</span>';
        } else if (mythicForge.blueprintId) {
          html += '<span style="font-size:0.72rem;color:var(--color-text-dim);">忙碌</span>';
        } else {
          html += '<button class="btn forge-start-mythic" data-bp-id="' + bpId + '" ';
          html += 'style="font-size:0.75rem;padding:4px 10px;background:#ff222233;color:#ff2222;border:1px solid #ff2222;">开始</button>';
        }
        html += '</div>';
        html += '</div>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  _bindEvents: function () {
    var self = this;

    // Normal forge
    document.querySelectorAll('.forge-start-normal').forEach(function (btn) {
      btn.onclick = function () {
        var idx = parseInt(this.getAttribute('data-recipe-idx'));
        if (ForgeManager.startNormalForge(idx)) self.show();
      };
    });

    // Mythic forge
    document.querySelectorAll('.forge-start-mythic').forEach(function (btn) {
      btn.onclick = function () {
        var bpId = this.getAttribute('data-bp-id');
        Modal.show({
          title: '开始神话锻造',
          content: '<div style="text-align:center;">神话锻造将<span style="color:#ff2222;">持续消耗资源</span>直到完成。<br>确定开始吗？</div>',
          confirmText: '开始锻造',
          onConfirm: function () {
            if (ForgeManager.startMythicForge(bpId)) self.show();
          }
        });
      };
    });
  }
};
