const fs = require('fs');
const path = require('path');

// Create minimal DOM mock
const domMock = {
  getElementById: () => ({ innerHTML: '', appendChild: () => {} }),
  createElement: () => ({ className: '', textContent: '', appendChild: () => {} })
};

// Global context for loading modules
global.document = domMock;
global.window = {};
global.console = console;

// Load files sequentially using a wrapper to preserve scope
function loadScript(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  const code = fs.readFileSync(fullPath, 'utf8');
  // Execute in global scope using Function constructor
  (new Function(code))();
}

console.log('Loading dependencies...');
loadScript('js/core/constants.js');
loadScript('js/core/event-bus.js');
loadScript('js/core/utils.js');
loadScript('js/data/heroes.js');
loadScript('js/data/hero-skills.js');

// Setup mock objects
var _emitted = [];
var _origEmit = global.EventBus.emit.bind(global.EventBus);
global.EventBus.emit = function(event) {
  var args = Array.prototype.slice.call(arguments, 1);
  _emitted.push({ event: event, args: args });
};

function getEmitted(eventName) {
  return _emitted.filter(function(e) { return e.event === eventName; });
}

function resetEmitted() {
  _emitted = [];
}

var ResourceManager = {
  _resources: {},
  _spent: [],
  _added: [],
  add: function(type, amount) {
    this._resources[type] = (this._resources[type] || 0) + amount;
    this._added.push({ type: type, amount: amount });
  },
  spend: function(type, amount) {
    this._resources[type] = (this._resources[type] || 0) - amount;
    this._spent.push({ type: type, amount: amount });
  },
  canAfford: function(type, amount) {
    return (this._resources[type] || 0) >= amount;
  },
  get: function(type) {
    return this._resources[type] || 0;
  },
  reset: function() {
    this._resources = {};
    this._spent = [];
    this._added = [];
  }
};

var EquipmentManager = {
  _equipment: {},
  getEquipment: function(uid) {
    return this._equipment[uid] || null;
  },
  reset: function() {
    this._equipment = {};
  }
};

var EquipTypeToStat = {
  weapon: 'atk',
  armor: 'def',
  accessory: 'hp',
  mount: 'spd'
};

global.ResourceManager = ResourceManager;
global.EquipmentManager = EquipmentManager;
global.EquipTypeToStat = EquipTypeToStat;

console.log('Loading global.HeroManager...\n');
loadScript('js/modules/hero-manager.js');

// Test framework
var _results = [];
var _currentSection = '';

function section(name) {
  _currentSection = name;
  console.log('--- ' + name + ' ---');
}

function test(name, fn) {
  var entry = { section: _currentSection, name: name, status: 'pass', error: null };
  try {
    fn();
  } catch (e) {
    entry.status = 'fail';
    entry.error = e.message || String(e);
  }
  _results.push(entry);
  var status = entry.status === 'pass' ? '[PASS]' : '[FAIL]';
  console.log(status + ' ' + name + (entry.error ? ' — ' + entry.error : ''));
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || '') + ' expected=' + JSON.stringify(expected) + ' actual=' + JSON.stringify(actual));
  }
}

function assertDeepEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error((msg || '') + ' expected=' + JSON.stringify(expected) + ' actual=' + JSON.stringify(actual));
  }
}

function resetAll() {
  global.HeroManager._heroes = [];
  global.HeroManager._team = [];
  ResourceManager.reset();
  EquipmentManager.reset();
  resetEmitted();
}

console.log('=== Running HeroManager Test Suite (25 Tests) ===\n');

// C1: Getting Heroes
section('Ability 1: Get Heroes (addHero)');

test('C1-S1: addHero new hero — creates instance and emits hero:added', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  assert(hero !== null, 'should return instance');
  assert(typeof hero.uid === 'string' && hero.uid.length > 0, 'uid should be non-empty string');
  assertEqual(hero.id, 'shu_zhaoyun', 'id');
  assertEqual(hero.level, 1, 'level=1');
  assertEqual(hero.exp, 0, 'exp=0');
  assertEqual(global.HeroManager._heroes.length, 1, '_heroes length=1');
  var events = getEmitted('hero:added');
  assertEqual(events.length, 1, 'should emit 1 hero:added');
  assertEqual(events[0].args[0].uid, hero.uid, 'event payload=instance');
});

test('C1-S2: addHero duplicate hero — converts to experience', function() {
  resetAll();
  global.HeroManager.addHero('shu_zhaoyun');
  resetEmitted();
  ResourceManager.reset();
  var result = global.HeroManager.addHero('shu_zhaoyun');
  assertEqual(result, null, 'duplicate returns null');
  assertEqual(global.HeroManager._heroes.length, 1, 'no new instance added');
  assertEqual(ResourceManager._added.length, 1, 'should call add');
  assertEqual(ResourceManager._added[0].type, 'exp', 'adds exp');
});

test('C1-S3: addHero invalid ID — returns null without state change', function() {
  resetAll();
  var result = global.HeroManager.addHero('invalid_id');
  assertEqual(result, null, 'should return null');
  assertEqual(global.HeroManager._heroes.length, 0, 'does not modify _heroes');
  assertEqual(_emitted.length, 0, 'no events triggered');
});

// C2: Query Heroes
section('Ability 2: Query Heroes (getTemplate/getHeroByUid/getAll)');

test('C2-S1: getTemplate normal — returns template data', function() {
  var tpl = global.HeroManager.getTemplate('shu_zhugeliang');
  assert(tpl !== null && tpl !== undefined, 'should return template');
  assertEqual(tpl.id, 'shu_zhugeliang', 'id');
  assert(typeof tpl.baseAtk === 'number', 'baseAtk should be number');
});

test('C2-S2: getHeroByUid not exists — returns undefined', function() {
  resetAll();
  var result = global.HeroManager.getHeroByUid('non-existent-uid');
  assertEqual(result, undefined, 'should return undefined');
});

test('C2-S3: getAll internal reference — returns correct length', function() {
  resetAll();
  global.HeroManager.addHero('shu_zhaoyun');
  global.HeroManager.addHero('shu_zhugeliang');
  var all = global.HeroManager.getAll();
  assertEqual(all.length, 2, 'should return 2 heroes');
  assert(all === global.HeroManager._heroes, 'getAll returns _heroes reference');
});

// C3: Team Management
section('Ability 3: Team Management (addToTeam/removeFromTeam/isInTeam)');

test('C3-S1: addToTeam success — team increases and emits', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  global.HeroManager.addHero('shu_zhugeliang');
  global.HeroManager._team = [global.HeroManager._heroes[0].uid, global.HeroManager._heroes[1].uid];
  var hero3 = global.HeroManager.addHero('wei_caocao');
  resetEmitted();
  var result = global.HeroManager.addToTeam(hero3.uid);
  assertEqual(result, true, 'returns true');
  assertEqual(global.HeroManager._team.length, 3, 'team=3 members');
  var events = getEmitted('hero:team_changed');
  assertEqual(events.length, 1, 'should emit hero:team_changed');
});

test('C3-S2: addToTeam team full — returns false', function() {
  resetAll();
  var ids = ['shu_zhaoyun', 'shu_zhugeliang', 'wei_caocao', 'shu_liubei', 'shu_guanyu', 'shu_zhangfei'];
  var heroes = [];
  for (var i = 0; i < ids.length; i++) {
    heroes.push(global.HeroManager.addHero(ids[i]));
  }
  global.HeroManager._team = heroes.slice(0, 5).map(function(h) { return h.uid; });
  resetEmitted();
  var result = global.HeroManager.addToTeam(heroes[5].uid);
  assertEqual(result, false, 'team full returns false');
  assertEqual(global.HeroManager._team.length, 5, 'team still 5 members');
  assertEqual(_emitted.length, 0, 'no events triggered');
});

test('C3-S3: addToTeam duplicate uid — returns false', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  global.HeroManager._team = [hero.uid];
  resetEmitted();
  var result = global.HeroManager.addToTeam(hero.uid);
  assertEqual(result, false, 'already in team returns false');
  assertEqual(global.HeroManager._team.length, 1, 'team unchanged');
  assertEqual(_emitted.length, 0, 'no events triggered');
});

test('C3-S4: addToTeam invalid uid — returns false', function() {
  resetAll();
  resetEmitted();
  var result = global.HeroManager.addToTeam('non_existent_uid');
  assertEqual(result, false, 'invalid uid returns false');
  assertEqual(global.HeroManager._team.length, 0, 'team unchanged');
  assertEqual(_emitted.length, 0, 'no events triggered');
});

test('C3-S5: removeFromTeam success — team decreases and emits', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  global.HeroManager._team = [hero.uid];
  resetEmitted();
  var result = global.HeroManager.removeFromTeam(hero.uid);
  assertEqual(result, true, 'returns true');
  assertEqual(global.HeroManager._team.length, 0, 'team decreases');
  assert(!global.HeroManager.isInTeam(hero.uid), 'no longer in team');
  var events = getEmitted('hero:team_changed');
  assertEqual(events.length, 1, 'should emit hero:team_changed');
});

test('C3-S6: removeFromTeam not in team — returns false', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  resetEmitted();
  var result = global.HeroManager.removeFromTeam(hero.uid);
  assertEqual(result, false, 'not in team returns false');
  assertEqual(global.HeroManager._team.length, 0, 'team unchanged');
  assertEqual(_emitted.length, 0, 'no events triggered');
});

// C4: Hero Leveling
section('Ability 4: Hero Leveling (levelUp/getExpCost)');

test('C4-S1: levelUp success — level+1, deduct EXP, emit', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  ResourceManager._resources.exp = 100;
  resetEmitted();
  var result = global.HeroManager.levelUp(hero.uid);
  assertEqual(result, true, 'returns true');
  assertEqual(hero.level, 2, 'level=2');
  assertEqual(ResourceManager._spent.length, 1, 'should call spend');
  assertEqual(ResourceManager._spent[0].type, 'exp', 'deduct exp');
  var events = getEmitted('hero:levelup');
  assertEqual(events.length, 1, 'should emit hero:levelup');
});

test('C4-S2: getExpCost values — floor(50 × level^1.5)', function() {
  assertEqual(global.HeroManager.getExpCost(1), 50, 'level 1 → 50');
  assertEqual(global.HeroManager.getExpCost(10), 1581, 'level 10 → 1581');
});

test('C4-S3: levelUp max level — returns false, no resource deduct', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  hero.level = 50;
  ResourceManager._resources.exp = 99999;
  resetEmitted();
  var result = global.HeroManager.levelUp(hero.uid);
  assertEqual(result, false, 'max level returns false');
  assertEqual(hero.level, 50, 'level unchanged');
  assertEqual(ResourceManager._spent.length, 0, 'no resource deduct');
  assertEqual(_emitted.length, 0, 'no events triggered');
});

test('C4-S4: levelUp insufficient EXP — returns false, no change', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  hero.level = 5;
  ResourceManager._resources.exp = 10;
  resetEmitted();
  var result = global.HeroManager.levelUp(hero.uid);
  assertEqual(result, false, 'insufficient EXP returns false');
  assertEqual(hero.level, 5, 'level unchanged');
  assertEqual(ResourceManager._spent.length, 0, 'no resource deduct');
});

// C5: Stats and Battle Power (including 2 new boundary tests)
section('Ability 5: Stats Calculation (getHeroStats/getBattlePower)');

test('C5-S1: getHeroStats level 1 no equipment — returns base stats', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  var stats = global.HeroManager.getHeroStats(hero.uid);
  assert(stats !== null, 'should return stats');
  assertEqual(stats.atk, 50, 'atk=baseAtk=50');
  assertEqual(stats.def, 38, 'def=baseDef=38');
  assertEqual(stats.hp, 300, 'hp=baseHp=300');
  assertEqual(stats.spd, 42, 'spd=baseSpd=42');
});

test('C5-S2: getHeroStats level 10 no equipment — includes growth bonus', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  hero.level = 10;
  var stats = global.HeroManager.getHeroStats(hero.uid);
  assertEqual(stats.atk, Math.floor(50 + 5 * 9), 'atk includes growth');
  assertEqual(stats.def, Math.floor(38 + 4 * 9), 'def includes growth');
  assertEqual(stats.hp, Math.floor(300 + 30 * 9), 'hp includes growth');
});

test('C5-S3: getHeroStats equipment bonus — weapon atk+10', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  hero.level = 1;
  var weaponUid = 'test_weapon_001';
  hero.equipment.weapon = weaponUid;
  EquipmentManager._equipment[weaponUid] = {
    uid: weaponUid,
    type: 'weapon',
    stats: { atk: 10 },
    level: 0
  };
  var stats = global.HeroManager.getHeroStats(hero.uid);
  assertEqual(stats.atk, 60, 'atk=60 (base 50 + equipment 10)');
  assertEqual(stats.def, 38, 'def unaffected by weapon');
});

test('C5-S4: getBattlePower value — floor formula', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  hero.level = 10;
  var stats = global.HeroManager.getHeroStats(hero.uid);
  var expected = Math.floor(
    (stats.atk * 1.5 + stats.def * 1.2 + stats.hp * 0.3 + stats.spd * 1.0) *
    (1 + hero.level * 0.02)
  );
  var power = global.HeroManager.getBattlePower(hero.uid);
  assertEqual(power, expected, 'battlePower=floor(formula)=' + expected);
  assert(typeof power === 'number', 'should be number');
  assertEqual(power, Math.floor(power), 'should be integer (floor)');
});

test('C5-S5: getHeroStats invalid uid — returns null', function() {
  resetAll();
  var result = global.HeroManager.getHeroStats('invalid_uid');
  assertEqual(result, null, 'invalid uid should return null');
});

test('C5-S6: getBattlePower invalid uid — returns 0', function() {
  resetAll();
  var result = global.HeroManager.getBattlePower('invalid_uid');
  assertEqual(result, 0, 'invalid uid should return 0');
});

// C6: Initialization and Save
section('Ability 6: Init and Save (init/getState)');

test('C6-S1: init(undefined) first game — gives ZhaoYun and puts in team', function() {
  resetAll();
  global.HeroManager.init(undefined);
  assertEqual(global.HeroManager._heroes.length, 1, '_heroes has 1 hero');
  assertEqual(global.HeroManager._heroes[0].id, 'shu_zhaoyun', 'hero is ZhaoYun');
  assertEqual(global.HeroManager._heroes[0].level, 1, 'level=1');
  assertEqual(global.HeroManager._team.length, 1, '_team has 1 member');
  assertEqual(global.HeroManager._team[0], global.HeroManager._heroes[0].uid, 'ZhaoYun in team');
});

test('C6-S2: init(savedState) restore save — restores full list and team', function() {
  resetAll();
  var savedState = {
    heroes: {
      heroes: [
        { uid: 'u1', id: 'shu_zhaoyun', level: 10, exp: 500, equipment: { weapon: null, armor: null, accessory: null, mount: null } },
        { uid: 'u2', id: 'wei_caocao', level: 5, exp: 100, equipment: { weapon: null, armor: null, accessory: null, mount: null } }
      ],
      team: ['u1', 'u2']
    }
  };
  global.HeroManager.init(savedState);
  assertEqual(global.HeroManager._heroes.length, 2, '_heroes restores 2 heroes');
  assertEqual(global.HeroManager._heroes[0].uid, 'u1', 'first hero uid=u1');
  assertEqual(global.HeroManager._heroes[1].uid, 'u2', 'second hero uid=u2');
  assertEqual(global.HeroManager._heroes[0].level, 10, 'level restored');
  assertDeepEqual(global.HeroManager._team, ['u1', 'u2'], 'team order restored');
});

test('C6-S3: getState deep copy — modifying return value does not affect internal', function() {
  resetAll();
  global.HeroManager.addHero('shu_zhaoyun');
  var state = global.HeroManager.getState();
  assert(Array.isArray(state.heroes), 'heroes should be array');
  assert(Array.isArray(state.team), 'team should be array');
  assertEqual(state.heroes.length, 1, 'heroes length=1');
  state.heroes[0].level = 999;
  assertEqual(global.HeroManager._heroes[0].level, 1, 'modifying return value does not affect internal _heroes');
  state.team.push('fake_uid');
  assertEqual(global.HeroManager._team.length, 0, 'modifying return value does not affect internal _team');
});

// Summary
console.log('\n=== Test Results ===');
var total = _results.length;
var passed = _results.filter(function(r) { return r.status === 'pass'; }).length;
var failed = _results.filter(function(r) { return r.status === 'fail'; }).length;

console.log('Total: ' + total);
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);

if (failed > 0) {
  console.log('\n=== Failed Tests ===');
  _results.filter(function(r) { return r.status === 'fail'; }).forEach(function(r) {
    console.log('FAIL: ' + r.name + ' — ' + r.error);
  });
  process.exit(1);
} else {
  console.log('\nALL TESTS PASSED!');
  process.exit(0);
}
