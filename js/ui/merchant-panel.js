/**
 * 商人面板 UI —— 糜竺的商铺
 */
var MerchantPanel = {
  _el: null,

  _qualityColors: { 1:'#b0a898', 2:'#5d8a48', 3:'#4a7fb5', 4:'#8b5ea8', 5:'#d4a849', 6:'#ff2222' },
  _qualityNames: { 1:'白', 2:'绿', 3:'蓝', 4:'紫', 5:'橙', 6:'神话' },

  init: function () {
    EventBus.on('merchant:refreshed', this._onUpdate.bind(this));
    EventBus.on('merchant:purchased', this._onUpdate.bind(this));
    EventBus.on('resource:changed', this._onUpdate.bind(this));
  },

  _onUpdate: function () {
    // Re-render if panel is currently shown
    var el = document.getElementById('merchant-panel-content');
    if (el) this.show();
  },

  show: function () {
    var html = this._render();
    OverlayPanel.show({
      title: UIIcons.icon('merchant') + ' 糋竺的商铺',
      content: html,
      panelId: 'merchant',
      height: 'full'
    });
    this._bindEvents();
  },

  _render: function () {
    var stock = MerchantManager.getNormalStock();
    var perm = MerchantManager.getPermanentStock();
    var countdown = MerchantManager.getRefreshCountdown();
    var h = Math.floor(countdown / 3600);
    var m = Math.floor((countdown % 3600) / 60);
    var s = countdown % 60;
    var timeStr = h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;

    var html = '<div id="merchant-panel-content">';

    // Quote
    html += '<div class="card" style="text-align:center;color:var(--color-gold);font-style:italic;">';
    html += '"正品保证，假一赔十！"</div>';

    // Normal stock
    html += '<div class="card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
    html += '<span style="font-weight:bold;font-size:0.9rem;">' + UIIcons.icon('chest') + ' 今日货架</span>';
    html += '<span style="font-size:0.75rem;color:var(--color-text-dim);">' + timeStr + ' 后刷新</span>';
    html += '</div>';

    for (var i = 0; i < stock.length; i++) {
      var item = stock[i];
      var col = this._qualityColors[item.quality] || '#aaa';
      var opacity = item.sold ? 'opacity:0.4;' : '';

      html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;';
      html += 'border-radius:6px;background:var(--color-bg);' + opacity + '">';
      html += '<span style="font-size:1.1rem;">' + (item.emoji || UIIcons.icon('chest')) + '</span>';
      html += '<div style="flex:1;">';
      html += '<span style="color:' + col + ';font-size:0.85rem;font-weight:bold;">' + item.name + '</span>';
      html += '<span style="font-size:0.68rem;color:var(--color-text-dim);margin-left:4px;">[' + this._qualityNames[item.quality] + ']</span>';
      html += '<div style="font-size:0.7rem;color:var(--color-text-dim);">' + item.description + '</div>';
      html += '</div>';
      if (item.sold) {
        html += '<span style="font-size:0.75rem;color:var(--color-text-dim);">已售出</span>';
      } else {
        html += '<button class="btn merchant-buy-normal" data-uid="' + item.uid + '" ';
        html += 'style="font-size:0.75rem;padding:4px 10px;">💰' + Utils.formatNumber(item.price) + '</button>';
      }
      html += '</div>';
    }

    html += '<div style="text-align:center;margin-top:8px;">';
    html += '<button class="btn merchant-refresh" style="font-size:0.75rem;padding:4px 14px;background:var(--color-secondary);">' + UIIcons.icon('jade') + '30 立即刷新</button>';
    html += '</div>';
    html += '</div>';

    // Permanent stock (mythic accessories)
    html += '<div class="card" style="border:1px solid #ff222244;">';
    html += '<div style="font-weight:bold;font-size:0.9rem;color:#ff2222;margin-bottom:8px;">✨ 镇店之宝</div>';

    for (var j = 0; j < perm.length; j++) {
      var pi = perm[j];
      var pt = getMythicTemplate(pi.equipId);
      if (!pt) continue;

      var soldStyle = pi.sold ? 'opacity:0.4;' : '';

      html += '<div style="padding:8px;margin-bottom:8px;border-radius:8px;background:rgba(255,34,34,0.08);' + soldStyle + '">';
      html += '<div style="display:flex;align-items:center;gap:8px;">';
      html += '<span style="font-size:1.2rem;">' + (pt.emoji || UIIcons.icon('jade')) + '</span>';
      html += '<div style="flex:1;">';
      html += '<span style="color:#ff2222;font-weight:bold;font-size:0.9rem;">' + pt.name + '</span>';
      html += '<span style="font-size:0.65rem;color:#ff2222;margin-left:4px;">[神话]</span>';
      html += '<div style="font-size:0.72rem;color:var(--color-text-dim);">HP +' + pt.statRange[0] + '~' + pt.statRange[1] + '</div>';
      html += '<div style="font-size:0.68rem;color:var(--color-gold);">套装：' + EquipmentSets[pi.setId].name + '</div>';
      html += '<div style="font-size:0.68rem;color:var(--color-text-dim);font-style:italic;">"' + pt.description + '"</div>';
      html += '</div>';
      html += '</div>';

      if (pi.sold) {
        html += '<div style="text-align:right;font-size:0.75rem;color:var(--color-success);margin-top:4px;">✅ 已购买</div>';
      } else {
        html += '<div style="text-align:right;margin-top:4px;">';
        html += '<button class="btn merchant-buy-perm" data-equip-id="' + pi.equipId + '" ';
        html += 'style="font-size:0.78rem;padding:4px 14px;background:#ff222233;color:#ff2222;border:1px solid #ff2222;">';
        html += UIIcons.icon('gold') + Utils.formatNumber(pi.price) + '</button>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  },

  _bindEvents: function () {
    var self = this;

    // Buy normal
    document.querySelectorAll('.merchant-buy-normal').forEach(function (btn) {
      btn.onclick = function () {
        var uid = this.getAttribute('data-uid');
        if (MerchantManager.buyNormal(uid)) self.show();
      };
    });

    // Buy permanent
    document.querySelectorAll('.merchant-buy-perm').forEach(function (btn) {
      btn.onclick = function () {
        var eid = this.getAttribute('data-equip-id');
        Modal.show({
          title: '确认购买',
          content: '<div style="text-align:center;">确定要购买这件神话装备吗？<br>这将花费大量金币！</div>',
          confirmText: '购买',
          onConfirm: function () {
            if (MerchantManager.buyPermanent(eid)) self.show();
          }
        });
      };
    });

    // Refresh
    var refreshBtn = document.querySelector('.merchant-refresh');
    if (refreshBtn) {
      refreshBtn.onclick = function () {
        if (MerchantManager.manualRefresh()) self.show();
      };
    }
  }
};
