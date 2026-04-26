/**
 * 武将头像工具 — 提供 heroId → 头像 URL 映射和 HTML 生成
 */
var HeroPortrait = {
  BASE_PATH: 'assets/img/heroes/',
  _failedCache: {},  // 记录加载失败的路径，避免反复尝试

  /**
   * 从 heroId 提取文件名（去掉阵营前缀）
   * 'shu_zhugeliang' → 'zhugeliang'
   * @param {string} heroId
   * @returns {string}
   */
  _nameFromId: function (heroId) {
    var idx = heroId.indexOf('_');
    return idx >= 0 ? heroId.substring(idx + 1) : heroId;
  },

  /**
   * 获取头像 URL
   * @param {string} heroId - 如 'shu_zhugeliang'
   * @returns {string} 图片路径
   */
  getUrl: function (heroId) {
    return this.BASE_PATH + this._nameFromId(heroId) + '.png';
  },

  /**
   * 生成头像 <img> 标签 HTML
   * @param {string} heroId - 如 'shu_zhugeliang'
   * @param {number} [size] - 显示尺寸 px，默认 32
   * @param {string} [extraClass] - 额外 CSS 类
   * @returns {string} HTML 字符串
   */
  getImgTag: function (heroId, size, extraClass) {
    size = size || 32;
    var cls = 'hero-portrait' + (extraClass ? ' ' + extraClass : '');
    var url = this.getUrl(heroId);
    var template = typeof HeroData !== 'undefined' ? HeroData.find(function (h) { return h.id === heroId; }) : null;
    var emoji = (template && template.emoji) ? template.emoji : '🧑';
    // onerror fallback: 图片加载失败时显示 emoji 文本
    return '<img src="' + url + '" class="' + cls + '" ' +
           'style="width:' + size + 'px;height:' + size + 'px;" ' +
           'alt="' + (template ? template.name : '') + '" ' +
           'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-block\';">' +
           '<span class="hero-portrait-fallback" style="display:none;width:' + size + 'px;height:' + size +
           'px;line-height:' + size + 'px;font-size:' + Math.round(size * 0.6) + 'px;">' + emoji + '</span>';
  },

  /**
   * 生成带品质边框的头像 HTML
   * @param {string} heroId
   * @param {number} quality - 1-5
   * @param {number} [size] - 显示尺寸
   * @returns {string} HTML
   */
  getFramedTag: function (heroId, quality, size) {
    size = size || 32;
    var qClass = 'quality-' + (quality || 1);
    return '<span class="hero-portrait-frame ' + qClass + '">' +
           this.getImgTag(heroId, size) +
           '</span>';
  }
};
