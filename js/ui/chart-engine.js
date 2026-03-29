/**
 * 图表引擎 — Canvas 2D 绘制折线图、柱状图、饼图、迷你图
 */
var ChartEngine = {

  /** 预定义色板 */
  _colors: ['#f5c518', '#4caf50', '#2196f3', '#ff9800', '#e94560', '#9c27b0', '#00bcd4'],

  /** 资源专属颜色 */
  _resourceColors: {
    gold: '#f5c518', jade: '#a855f7', exp: '#60a5fa',
    food: '#4caf50', wood: '#8b6914', stone: '#9e9e9e', iron: '#607d8b'
  },

  // ==================== 折线图 ====================

  drawLineChart: function (canvas, datasets, options) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    this._clearCanvas(ctx, W, H);

    var opts = options || {};
    var pad = { top: 30, right: 15, bottom: 30, left: 50 };
    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    // 计算全局 Y 范围
    var yMin = Infinity, yMax = -Infinity;
    for (var d = 0; d < datasets.length; d++) {
      var data = datasets[d].data;
      for (var i = 0; i < data.length; i++) {
        if (data[i].y < yMin) yMin = data[i].y;
        if (data[i].y > yMax) yMax = data[i].y;
      }
    }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    var yRange = yMax - yMin;

    // 绘制网格
    this._drawGrid(ctx, pad, plotW, plotH, yMin, yMax, opts);

    // 绘制数据
    for (var di = 0; di < datasets.length; di++) {
      var ds = datasets[di];
      var points = ds.data;
      if (points.length === 0) continue;

      var color = ds.color || this._colors[di % this._colors.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (var pi = 0; pi < points.length; pi++) {
        var x = pad.left + (pi / Math.max(1, points.length - 1)) * plotW;
        var y = pad.top + plotH - ((points[pi].y - yMin) / yRange) * plotH;
        if (pi === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 填充
      if (ds.fill) {
        ctx.lineTo(pad.left + plotW, pad.top + plotH);
        ctx.lineTo(pad.left, pad.top + plotH);
        ctx.closePath();
        ctx.fillStyle = color.replace(')', ',0.1)').replace('rgb', 'rgba');
        ctx.fill();
      }
    }

    // 标题
    if (opts.title) {
      ctx.fillStyle = '#eee';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(opts.title, W / 2, 16);
    }

    // 图例
    if (opts.showLegend !== false && datasets.length > 1) {
      this._drawLegend(ctx, datasets, W - pad.right, pad.top);
    }
  },

  // ==================== 柱状图 ====================

  drawBarChart: function (canvas, datasets, options) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    this._clearCanvas(ctx, W, H);

    var opts = options || {};
    var labels = opts.labels || [];
    var pad = { top: 30, right: 15, bottom: 30, left: 50 };
    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    // 计算 Y 最大值
    var yMax = 0;
    for (var d = 0; d < datasets.length; d++) {
      for (var i = 0; i < datasets[d].data.length; i++) {
        if (datasets[d].data[i] > yMax) yMax = datasets[d].data[i];
      }
    }
    if (yMax === 0) yMax = 1;

    var groupCount = labels.length || (datasets[0] ? datasets[0].data.length : 0);
    var barGroupW = plotW / Math.max(1, groupCount);
    var barW = barGroupW / (datasets.length + 1);

    // 绘制网格
    this._drawGrid(ctx, pad, plotW, plotH, 0, yMax, opts);

    // 绘制柱子
    for (var di = 0; di < datasets.length; di++) {
      var ds = datasets[di];
      var color = ds.color || this._colors[di % this._colors.length];
      ctx.fillStyle = color;

      for (var bi = 0; bi < ds.data.length; bi++) {
        var barH = (ds.data[bi] / yMax) * plotH;
        var x = pad.left + bi * barGroupW + di * barW + barW * 0.2;
        var y = pad.top + plotH - barH;
        ctx.fillRect(x, y, barW * 0.8, barH);
      }
    }

    // X 轴标签
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for (var li = 0; li < labels.length; li++) {
      var lx = pad.left + li * barGroupW + barGroupW / 2;
      ctx.fillText(labels[li], lx, H - 8);
    }

    if (opts.title) {
      ctx.fillStyle = '#eee';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(opts.title, W / 2, 16);
    }

    if (opts.showLegend !== false && datasets.length > 1) {
      this._drawLegend(ctx, datasets, W - pad.right, pad.top);
    }
  },

  // ==================== 饼图 ====================

  drawPieChart: function (canvas, data, options) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    this._clearCanvas(ctx, W, H);

    var opts = options || {};
    var total = 0;
    for (var i = 0; i < data.length; i++) total += data[i].value;
    if (total === 0) return;

    var cx = W / 2, cy = H / 2 + 10;
    var r = Math.min(W, H) / 2 - 40;
    var innerR = opts.donut ? r * 0.5 : 0;
    var startAngle = -Math.PI / 2;

    for (var di = 0; di < data.length; di++) {
      var slice = data[di];
      var sliceAngle = (slice.value / total) * Math.PI * 2;
      var color = slice.color || this._colors[di % this._colors.length];

      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle));
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // 标签
      if (opts.showLabels !== false) {
        var midAngle = startAngle + sliceAngle / 2;
        var labelR = r + 14;
        var lx = cx + labelR * Math.cos(midAngle);
        var ly = cy + labelR * Math.sin(midAngle);
        ctx.fillStyle = '#ccc';
        ctx.font = '10px sans-serif';
        ctx.textAlign = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'right' : 'left';
        var pct = Math.round(slice.value / total * 100);
        ctx.fillText(slice.label + ' ' + pct + '%', lx, ly);
      }

      startAngle += sliceAngle;
    }

    if (opts.title) {
      ctx.fillStyle = '#eee';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(opts.title, W / 2, 16);
    }
  },

  // ==================== 迷你折线图（Sparkline） ====================

  drawSparkline: function (canvas, data, color) {
    if (!canvas || !data || data.length === 0) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    this._clearCanvas(ctx, W, H);

    var min = Infinity, max = -Infinity;
    for (var i = 0; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }
    if (min === max) { min -= 1; max += 1; }
    var range = max - min;

    ctx.strokeStyle = color || '#f5c518';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (var pi = 0; pi < data.length; pi++) {
      var x = (pi / Math.max(1, data.length - 1)) * W;
      var y = H - ((data[pi] - min) / range) * (H - 4) - 2;
      if (pi === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  },

  // ==================== 工具方法 ====================

  _clearCanvas: function (ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
  },

  _drawGrid: function (ctx, pad, plotW, plotH, yMin, yMax, opts) {
    var gridLines = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;

    for (var g = 0; g <= gridLines; g++) {
      var gy = pad.top + (g / gridLines) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, gy);
      ctx.lineTo(pad.left + plotW, gy);
      ctx.stroke();

      // Y 轴标签
      var val = yMax - (g / gridLines) * (yMax - yMin);
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(this._formatLabel(val), pad.left - 5, gy + 3);
    }
  },

  _drawLegend: function (ctx, datasets, x, y) {
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    for (var i = 0; i < datasets.length; i++) {
      var ly = y + i * 16;
      var color = datasets[i].color || this._colors[i % this._colors.length];
      ctx.fillStyle = color;
      ctx.fillRect(x - 80, ly - 4, 8, 8);
      ctx.fillStyle = '#ccc';
      ctx.fillText(datasets[i].label || '', x - 68, ly + 4);
    }
  },

  _formatLabel: function (value) {
    if (typeof Utils !== 'undefined' && Utils.formatNumber) {
      return Utils.formatNumber(value);
    }
    if (Math.abs(value) >= 10000) return (value / 10000).toFixed(1) + '万';
    if (Math.abs(value) >= 1000) return (value / 1000).toFixed(1) + 'k';
    return Math.round(value).toString();
  },

  getResourceColor: function (type) {
    return this._resourceColors[type] || '#eee';
  }
};
