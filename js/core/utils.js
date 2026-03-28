/**
 * 通用工具函数
 */
const Utils = {
  /** 格式化大数字 */
  formatNumber(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + '兆';
    if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
    if (n >= 1e4) return (n / 1e4).toFixed(2) + '万';
    return Math.floor(n).toLocaleString();
  },

  /** 随机整数 [min, max] */
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /** 按权重随机选取 */
  weightedRandom(items, weightKey = 'weight') {
    const total = items.reduce((s, i) => s + i[weightKey], 0);
    let r = Math.random() * total;
    for (const item of items) {
      r -= item[weightKey];
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  },

  /** 深拷贝 */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /** 生成简易 UUID */
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },
};
