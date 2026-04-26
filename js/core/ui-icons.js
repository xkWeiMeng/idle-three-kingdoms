/**
 * UIIcons — 统一图标工具
 * 用 assets/ui-icons/ 下的 PNG 图标替代 emoji 占位符
 */
var UIIcons = {
  _basePath: 'assets/ui-icons/',

  /**
   * 返回一个 <img> 标签 HTML 字符串
   * @param {string} name - 图标名（不含扩展名），如 'gold', 'battle'
   * @param {string} [cls] - 额外 CSS 类名
   * @returns {string} HTML img 标签
   */
  icon: function (name, cls) {
    var c = 'ui-icon' + (cls ? ' ' + cls : '');
    return '<img src="' + this._basePath + name + '.png" class="' + c + '" alt="" draggable="false">';
  },

  /**
   * 返回带文字的图标 HTML
   * @param {string} name - 图标名
   * @param {string} text - 文字内容
   * @param {string} [cls] - 额外 CSS 类名
   * @returns {string} HTML
   */
  iconText: function (name, text, cls) {
    return this.icon(name, cls) + text;
  }
};
