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
    var exp = ResourceManager.get(R.EXP);
    var food = ResourceManager.get(R.FOOD);
    var wood = ResourceManager.get(R.WOOD);
    var stone = ResourceManager.get(R.STONE);
    var iron = ResourceManager.get(R.IRON);
    var foodCap = ResourceManager.getCap('food');

    var I = UIIcons;
    var html = '<div class="res-group res-group-basic">' +
      '<span class="res-item">' + I.icon('gold') + ' ' + Utils.formatNumber(gold) + '</span>' +
      '<span class="res-item">' + I.icon('jade') + ' ' + Utils.formatNumber(jade) + '</span>' +
      '<span class="res-item">' + I.icon('food') + ' ' + food + '/' + foodCap + '</span>' +
      '<span class="res-item">' + I.icon('exp') + ' ' + Utils.formatNumber(exp) + '</span>' +
      '</div>';

    html += '<div class="res-group res-group-building">' +
      '<span class="res-item">' + I.icon('wood') + ' ' + Utils.formatNumber(wood) + '</span>' +
      '<span class="res-item">' + I.icon('stone') + ' ' + Utils.formatNumber(stone) + '</span>' +
      '<span class="res-item">' + I.icon('iron') + ' ' + Utils.formatNumber(iron) + '</span>' +
      '</div>';

    this._el.innerHTML = html;
  },
};
