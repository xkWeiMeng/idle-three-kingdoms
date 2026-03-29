/**
 * 顶部资源栏 UI — 7 种资源分组显示
 */
const ResourcesBar = {
  _el: null,
  _showBuilding: false,

  init() {
    this._el = document.getElementById('resources-bar');
    this._render();
    EventBus.on('resource:changed', () => this._render());
  },

  _render() {
    var R = CONSTANTS.RESOURCE;
    var gold = ResourceManager.get(R.GOLD);
    var jade = ResourceManager.get(R.JADE);
    var food = ResourceManager.get(R.FOOD);
    var wood = ResourceManager.get(R.WOOD);
    var stone = ResourceManager.get(R.STONE);
    var iron = ResourceManager.get(R.IRON);
    var foodCap = ResourceManager.getCap('food');

    var html = '<div class="res-group res-group-basic">' +
      '<span class="res-item">💰 ' + Utils.formatNumber(gold) + '</span>' +
      '<span class="res-item">💎 ' + Utils.formatNumber(jade) + '</span>' +
      '<span class="res-item">🍚 ' + food + '/' + foodCap + '</span>' +
      '</div>';

    html += '<div class="res-group res-group-building">' +
      '<span class="res-item">🪵 ' + Utils.formatNumber(wood) + '</span>' +
      '<span class="res-item">🪨 ' + Utils.formatNumber(stone) + '</span>' +
      '<span class="res-item">⛏️ ' + Utils.formatNumber(iron) + '</span>' +
      '</div>';

    this._el.innerHTML = html;
  },
};
