/**
 * 深渊面板 UI —— 深渊副本挑战
 */
var AbyssPanel = {
  _qualityColors: { 1:'#b0a898', 2:'#5d8a48', 3:'#4a7fb5', 4:'#8b5ea8', 5:'#d4a849', 6:'#ff2222' },

  init: function () {
    EventBus.on('abyss:entered', this._onUpdate.bind(this));
    EventBus.on('abyss:floor_cleared', this._onUpdate.bind(this));
    EventBus.on('abyss:completed', this._onUpdate.bind(this));
    EventBus.on('abyss:failed', this._onUpdate.bind(this));
  },

  _onUpdate: function () {
    var el = document.getElementById('abyss-panel-content');
    if (el) this.show();
  },

  show: function () {
    var html = this._render();
    OverlayPanel.show({
      title: '🔥 深渊挑战',
      content: html,
      panelId: 'abyss',
      height: 'full'
    });
    this._bindEvents();
  },

  _render: function () {
    var currentRun = AbyssManager.getCurrentRun();
    var html = '<div id="abyss-panel-content">';

    // Active run
    if (currentRun) {
      html += this._renderActiveRun(currentRun);
    } else {
      html += this._renderAbyssList();
    }

    html += '</div>';
    return html;
  },

  _renderActiveRun: function (run) {
    var abyss = AbyssData[run.abyssId];
    var floor = abyss.floors[run.currentFloor - 1];
    var html = '';

    // Visual theme header
    var theme = abyss.theme || {};
    var bgGrad = theme.bgGradient || 'linear-gradient(180deg, #1a0a2e, #0d0d0d)';
    html += '<div style="background:' + bgGrad + ';border-radius:8px;padding:12px;margin-bottom:8px;">';
    html += '<div style="text-align:center;">';
    html += '<div style="font-size:1.1rem;font-weight:bold;color:' + (theme.bossFrameColor || '#fff') + ';">';
    html += abyss.name + ' · 第 ' + run.currentFloor + '/' + abyss.floors.length + ' 层</div>';
    html += '<div style="font-size:0.78rem;color:var(--color-text-dim);margin-top:2px;">回合 ' + run.round + '</div>';
    html += '</div>';

    // Boss status
    if (run.enemies.length > 0) {
      var boss = run.enemies[0];
      var bossHpPct = boss.maxHp > 0 ? (boss.currentHp / boss.maxHp * 100) : 0;
      html += '<div style="margin-top:8px;padding:8px;background:rgba(0,0,0,0.3);border-radius:6px;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<span style="font-weight:bold;color:' + (theme.bossFrameColor || '#ff4444') + ';">' + boss.name + '</span>';
      html += '<span style="font-size:0.72rem;color:var(--color-text-dim);">' + boss.currentHp + '/' + boss.maxHp + '</span>';
      html += '</div>';
      html += '<div style="height:8px;background:#333;border-radius:4px;margin-top:4px;">';
      html += '<div style="height:100%;width:' + bossHpPct.toFixed(1) + '%;background:' + (theme.bossFrameColor || '#ff4444') + ';border-radius:4px;transition:width 0.3s;"></div>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    // Ally status
    html += '<div class="card" style="padding:8px;">';
    html += '<div style="font-size:0.8rem;font-weight:bold;margin-bottom:4px;">队伍状态</div>';
    for (var a = 0; a < run.allies.length; a++) {
      var ally = run.allies[a];
      var aHpPct = ally.maxHp > 0 ? (ally.currentHp / ally.maxHp * 100) : 0;
      var deadStyle = ally.isAlive ? '' : 'opacity:0.4;';

      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;' + deadStyle + '">';
      html += '<span style="font-size:0.85rem;width:24px;">' + (ally.emoji || '⚔️') + '</span>';
      html += '<span style="font-size:0.78rem;width:50px;">' + ally.name + '</span>';
      html += '<div style="flex:1;height:5px;background:#333;border-radius:2px;">';
      html += '<div style="height:100%;width:' + aHpPct.toFixed(1) + '%;background:var(--color-success);border-radius:2px;"></div>';
      html += '</div>';
      html += '<span style="font-size:0.65rem;color:var(--color-text-dim);width:35px;text-align:right;">';
      html += (ally.isAlive ? Math.ceil(aHpPct) + '%' : '💀') + '</span>';
      html += '</div>';
    }
    html += '</div>';

    // Battle log
    html += '<div class="card" style="max-height:180px;overflow-y:auto;padding:8px;">';
    html += '<div style="font-size:0.8rem;font-weight:bold;margin-bottom:4px;">战斗日志</div>';
    var log = run.log;
    var startIdx = Math.max(0, log.length - 20);
    for (var l = startIdx; l < log.length; l++) {
      html += '<div style="font-size:0.68rem;color:var(--color-text-dim);margin-bottom:1px;">' + log[l] + '</div>';
    }
    html += '</div>';

    // Result phase
    if (run.phase === 'complete') {
      html += '<div class="card" style="text-align:center;border:1px solid var(--color-success);">';
      html += '<div style="font-size:1.1rem;color:var(--color-success);margin-bottom:8px;">🏆 通关成功！</div>';
      html += this._renderRewards(run);
      html += '<button class="btn abyss-close-run" style="margin-top:8px;padding:6px 20px;">确认</button>';
      html += '</div>';
    } else if (run.phase === 'defeat') {
      html += '<div class="card" style="text-align:center;border:1px solid var(--color-danger);">';
      html += '<div style="font-size:1.1rem;color:var(--color-danger);margin-bottom:8px;">💀 挑战失败</div>';
      html += '<div style="font-size:0.78rem;color:var(--color-text-dim);">止步于第 ' + run.currentFloor + ' 层</div>';
      html += this._renderRewards(run);
      html += '<button class="btn abyss-close-run" style="margin-top:8px;padding:6px 20px;">确认</button>';
      html += '</div>';
    }

    return html;
  },

  _renderRewards: function (run) {
    var r = run.rewards;
    var html = '<div style="font-size:0.78rem;margin:4px 0;">';
    if (r.gold) html += '💰' + Utils.formatNumber(r.gold) + ' ';
    if (r.exp) html += '📖' + Utils.formatNumber(r.exp) + ' ';
    if (r.iron) html += '⛏️' + r.iron + ' ';
    if (r.jade) html += '💎' + r.jade + ' ';
    html += '</div>';

    if (run.droppedEquipment && run.droppedEquipment.length > 0) {
      html += '<div style="margin-top:4px;">';
      for (var d = 0; d < run.droppedEquipment.length; d++) {
        var eq = run.droppedEquipment[d];
        var col = this._qualityColors[eq.quality] || '#aaa';
        html += '<div style="font-size:0.78rem;color:' + col + ';">' + eq.emoji + ' ' + eq.name + '</div>';
      }
      html += '</div>';
    }
    return html;
  },

  _renderAbyssList: function () {
    var html = '';
    var abyssIds = Object.keys(AbyssData);

    for (var i = 0; i < abyssIds.length; i++) {
      var aid = abyssIds[i];
      var abyss = AbyssData[aid];
      var inst = AbyssManager.getInstance(aid);
      var unlocked = AbyssManager.isAbyssUnlocked(aid);
      var onCd = AbyssManager.isOnCooldown(aid);
      var cdRemain = AbyssManager.getCooldownRemaining(aid);

      var theme = abyss.theme || {};
      var bgGrad = theme.bgGradient || 'linear-gradient(180deg, #1a0a2e, #0d0d0d)';

      html += '<div class="card" style="border:1px solid ' + (unlocked ? (theme.bossFrameColor || '#444') : '#333') + ';';
      if (!unlocked) html += 'opacity:0.5;';
      html += '">';

      // Header with theme gradient
      html += '<div style="background:' + bgGrad + ';border-radius:6px;padding:10px;margin:-8px -8px 8px -8px;border-radius:8px 8px 0 0;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<div>';
      html += '<div style="font-size:1rem;font-weight:bold;color:' + (theme.bossFrameColor || '#fff') + ';">' + abyss.name + '</div>';
      html += '<div style="font-size:0.72rem;color:var(--color-text-dim);margin-top:2px;">' + abyss.floors.length + ' 层 · 推荐战力 ' + Utils.formatNumber(abyss.recommendedPower) + '</div>';
      html += '</div>';

      if (inst && inst.cleared) {
        html += '<span style="font-size:0.75rem;color:var(--color-success);">✅ 已通关</span>';
      } else if (inst) {
        html += '<span style="font-size:0.72rem;color:var(--color-text-dim);">最高 ' + inst.bestFloor + ' 层</span>';
      }
      html += '</div>';
      html += '</div>';

      // Lore
      if (abyss.description) {
        html += '<div style="font-size:0.72rem;color:var(--color-text-dim);font-style:italic;margin-bottom:6px;">"' + abyss.description + '"</div>';
      }

      // Ticket cost
      var cost = abyss.ticketCost;
      var costStr = [];
      if (cost.jade) costStr.push('💎' + cost.jade);
      if (cost.gold) costStr.push('💰' + Utils.formatNumber(cost.gold));
      if (cost.iron) costStr.push('⛏️' + cost.iron);
      html += '<div style="font-size:0.72rem;color:var(--color-text-dim);margin-bottom:6px;">入场：' + costStr.join(' ') + '</div>';

      // Unlock condition
      if (!unlocked) {
        html += '<div style="font-size:0.72rem;color:var(--color-danger);">🔒 通关 ' + abyss.unlockCondition.stage + ' 后解锁</div>';
      } else if (onCd) {
        var cdH = Math.floor(cdRemain / 3600);
        var cdM = Math.floor((cdRemain % 3600) / 60);
        html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '<span style="font-size:0.72rem;color:var(--color-warning);">冷却中 ' + cdH + '时' + cdM + '分</span>';
        html += '</div>';
      } else {
        html += '<div style="text-align:right;">';
        html += '<button class="btn abyss-enter" data-abyss-id="' + aid + '" ';
        html += 'style="font-size:0.78rem;padding:5px 16px;background:' + (theme.bossFrameColor || 'var(--color-primary)') + ';">⚔️ 进入</button>';
        html += '</div>';
      }

      html += '</div>';
    }

    return html;
  },

  _bindEvents: function () {
    var self = this;

    // Enter abyss
    document.querySelectorAll('.abyss-enter').forEach(function (btn) {
      btn.onclick = function () {
        var aid = this.getAttribute('data-abyss-id');
        Modal.show({
          title: '进入深渊',
          content: '<div style="text-align:center;">将消耗入场券资源<br>确定要进入深渊挑战吗？</div>',
          confirmText: '进入',
          onConfirm: function () {
            if (AbyssManager.enterAbyss(aid)) self.show();
          }
        });
      };
    });

    // Close run
    var closeBtn = document.querySelector('.abyss-close-run');
    if (closeBtn) {
      closeBtn.onclick = function () {
        AbyssManager.clearRun();
        self.show();
      };
    }
  }
};
