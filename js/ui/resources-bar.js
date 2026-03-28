/**
 * 顶部资源栏 UI
 */
const ResourcesBar = {
  _el: null,

  init() {
    this._el = document.getElementById('resources-bar');
    this._render();
    EventBus.on('resource:changed', () => this._render());
  },

  _render() {
    const gold = ResourceManager.get(CONSTANTS.RESOURCE.GOLD);
    const jade = ResourceManager.get(CONSTANTS.RESOURCE.JADE);
    const food = ResourceManager.get(CONSTANTS.RESOURCE.FOOD);
    this._el.innerHTML = `
      <span>💰 ${Utils.formatNumber(gold)}</span>
      <span>💎 ${Utils.formatNumber(jade)}</span>
      <span>🍚 ${Utils.formatNumber(food)}</span>
    `;
  },
};
