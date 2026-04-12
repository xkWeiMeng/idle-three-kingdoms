const fs = require('fs');
const path = require('path');

// Setup global scope with document mock
global.document = {
  getElementById: () => ({ innerHTML: '', appendChild: () => {} }),
  createElement: () => ({ className: '', textContent: '', appendChild: () => {} })
};
global.window = {};

// Load all files into global scope by modifying code to declare in global
function loadFile(filePath) {
  let code = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
  // Replace const/let with var to make variables global
  code = code.replace(/^const\s+/gm, 'var ');
  code = code.replace(/^let\s+/gm, 'var ');
  code = code.replace(/\n\s*const\s+/gm, '\nvar ');
  code = code.replace(/\n\s*let\s+/gm, '\nvar ');
  // Execute in global context
  (function() {
    eval.call(global, code);
  }).call(global);
}

console.log('Loading dependencies...');
loadFile('js/core/constants.js');
loadFile('js/core/event-bus.js');
loadFile('js/core/utils.js');
loadFile('js/data/heroes.js');
loadFile('js/data/hero-skills.js');

// Setup mocks BEFORE loading HeroManager
var _emitted = [];
global.EventBus.emit = function(event) {
  var args = Array.prototype.slice.call(arguments, 1);
  _emitted.push({ event: event, args: args });
};

global.ResourceManager = {
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

global.EquipmentManager = {
  _equipment: {},
  getEquipment: function(uid) {
    return this._equipment[uid] || null;
  },
  reset: function() {
    this._equipment = {};
  }
};

global.EquipTypeToStat = {
  weapon: 'atk',
  armor: 'def',
  accessory: 'hp',
  mount: 'spd'
};

console.log('Loading global.HeroManager...\n');
loadFile('js/modules/hero-manager.js');

// Local references for tests
var ResourceManager = global.ResourceManager;
var EquipmentManager = global.EquipmentManager;

// Tests
var _results = [];
function test(name, fn) {
  var entry = { name: name, status: 'pass', error: null };
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
  global.global.HeroManager._heroes = [];
  global.global.HeroManager._team = [];
  ResourceManager.reset();
  EquipmentManager.reset();
  _emitted = [];
}

console.log('=== Running HeroManager Test Suite (25 Tests) ===\n');

// C1: Getting Heroes
console.log('--- Ability 1: Get Heroes (addHero) ---');
test('C1-S1: addHero creates new hero with correct data', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  assert(hero !== null, 'should return instance');
  assert(typeof hero.uid === 'string' && hero.uid.length > 0, 'uid should be non-empty string');
  assertEqual(hero.id, 'shu_zhaoyun', 'id');
  assertEqual(hero.level, 1, 'level=1');
  assertEqual(hero.exp, 0, 'exp=0');
  assertEqual(global.HeroManager._heroes.length, 1, '_heroes length=1');
});

test('C1-S2: addHero duplicate converts to experience', function() {
  resetAll();
  global.HeroManager.addHero('shu_zhaoyun');
  ResourceManager.reset();
  var result = global.HeroManager.addHero('shu_zhaoyun');
  assertEqual(result, null, 'duplicate returns null');
  assertEqual(global.HeroManager._heroes.length, 1, 'no new instance added');
});

test('C1-S3: addHero invalid ID returns null', function() {
  resetAll();
  var result = global.HeroManager.addHero('invalid_id');
  assertEqual(result, null, 'should return null');
  assertEqual(global.HeroManager._heroes.length, 0, 'does not modify _heroes');
});

// C2: Query Heroes
console.log('\n--- Ability 2: Query Heroes (getTemplate/getHeroByUid/getAll) ---');
test('C2-S1: getTemplate returns template data', function() {
  var tpl = global.HeroManager.getTemplate('shu_zhugeliang');
  assert(tpl !== null && tpl !== undefined, 'should return template');
  assertEqual(tpl.id, 'shu_zhugeliang', 'id');
});

test('C2-S2: getHeroByUid not exists returns undefined', function() {
  resetAll();
  var result = global.HeroManager.getHeroByUid('non-existent-uid');
  assertEqual(result, undefined, 'should return undefined');
});

test('C2-S3: getAll returns internal reference', function() {
  resetAll();
  global.HeroManager.addHero('shu_zhaoyun');
  global.HeroManager.addHero('shu_zhugeliang');
  var all = global.HeroManager.getAll();
  assertEqual(all.length, 2, 'should return 2 heroes');
  assert(all === global.HeroManager._heroes, 'getAll returns _heroes reference');
});

// C3: Team Management
console.log('\n--- Ability 3: Team Management (addToTeam/removeFromTeam/isInTeam) ---');
test('C3-S1: addToTeam success increases team and emits', function() {
  resetAll();
  var hero1 = global.HeroManager.addHero('shu_zhaoyun');
  var hero2 = global.HeroManager.addHero('shu_zhugeliang');
  global.HeroManager._team = [hero1.uid];
  var result = global.HeroManager.addToTeam(hero2.uid);
  assertEqual(result, true, 'returns true');
  assertEqual(global.HeroManager._team.length, 2, 'team=2');
});

test('C3-S2: addToTeam full team returns false', function() {
  resetAll();
  var ids = ['shu_zhaoyun', 'shu_zhugeliang', 'wei_caocao', 'shu_liubei', 'shu_guanyu', 'shu_zhangfei'];
  var heroes = [];
  for (var i = 0; i < ids.length; i++) {
    heroes.push(global.HeroManager.addHero(ids[i]));
  }
  global.HeroManager._team = heroes.slice(0, 5).map(function(h) { return h.uid; });
  var result = global.HeroManager.addToTeam(heroes[5].uid);
  assertEqual(result, false, 'team full returns false');
  assertEqual(global.HeroManager._team.length, 5, 'team still 5');
});

test('C3-S3: addToTeam duplicate uid returns false', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  global.HeroManager._team = [hero.uid];
  var result = global.HeroManager.addToTeam(hero.uid);
  assertEqual(result, false, 'already in team returns false');
  assertEqual(global.HeroManager._team.length, 1, 'team unchanged');
});

test('C3-S4: addToTeam invalid uid returns false', function() {
  resetAll();
  var result = global.HeroManager.addToTeam('non_existent_uid');
  assertEqual(result, false, 'invalid uid returns false');
  assertEqual(global.HeroManager._team.length, 0, 'team unchanged');
});

test('C3-S5: removeFromTeam success decreases team', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  global.HeroManager._team = [hero.uid];
  var result = global.HeroManager.removeFromTeam(hero.uid);
  assertEqual(result, true, 'returns true');
  assertEqual(global.HeroManager._team.length, 0, 'team decreases');
  assert(!global.HeroManager.isInTeam(hero.uid), 'no longer in team');
});

test('C3-S6: removeFromTeam not in team returns false', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  var result = global.HeroManager.removeFromTeam(hero.uid);
  assertEqual(result, false, 'not in team returns false');
  assertEqual(global.HeroManager._team.length, 0, 'team unchanged');
});

// C4: Hero Leveling
console.log('\n--- Ability 4: Hero Leveling (levelUp/getExpCost) ---');
test('C4-S1: levelUp success increases level and deducts exp', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  ResourceManager._resources.exp = 100;
  var result = global.HeroManager.levelUp(hero.uid);
  assertEqual(result, true, 'returns true');
  assertEqual(hero.level, 2, 'level=2');
});

test('C4-S2: getExpCost values match formula', function() {
  assertEqual(global.HeroManager.getExpCost(1), 50, 'level 1 → 50');
  assertEqual(global.HeroManager.getExpCost(10), 1581, 'level 10 → 1581');
});

test('C4-S3: levelUp max level returns false', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  hero.level = 50;
  ResourceManager._resources.exp = 99999;
  var result = global.HeroManager.levelUp(hero.uid);
  assertEqual(result, false, 'max level returns false');
  assertEqual(hero.level, 50, 'level unchanged');
});

test('C4-S4: levelUp insufficient exp returns false', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  hero.level = 5;
  ResourceManager._resources.exp = 10;
  var result = global.HeroManager.levelUp(hero.uid);
  assertEqual(result, false, 'insufficient exp returns false');
  assertEqual(hero.level, 5, 'level unchanged');
});

// C5: Stats and Battle Power
console.log('\n--- Ability 5: Stats Calculation (getHeroStats/getBattlePower) ---');
test('C5-S1: getHeroStats level 1 returns base stats', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  var stats = global.HeroManager.getHeroStats(hero.uid);
  assert(stats !== null, 'should return stats');
  assertEqual(stats.atk, 50, 'atk=50');
  assertEqual(stats.def, 38, 'def=38');
  assertEqual(stats.hp, 300, 'hp=300');
});

test('C5-S2: getHeroStats level 10 includes growth bonus', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  hero.level = 10;
  var stats = global.HeroManager.getHeroStats(hero.uid);
  assertEqual(stats.atk, Math.floor(50 + 5 * 9), 'atk with growth');
});

test('C5-S3: getHeroStats equipment adds bonus', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  var weaponUid = 'test_weapon_001';
  hero.equipment.weapon = weaponUid;
  EquipmentManager._equipment[weaponUid] = {
    uid: weaponUid,
    type: 'weapon',
    stats: { atk: 10 },
    level: 0
  };
  var stats = global.HeroManager.getHeroStats(hero.uid);
  assertEqual(stats.atk, 60, 'atk=60 with equipment');
});

test('C5-S4: getBattlePower uses correct formula', function() {
  resetAll();
  var hero = global.HeroManager.addHero('shu_zhaoyun');
  hero.level = 10;
  var stats = global.HeroManager.getHeroStats(hero.uid);
  var expected = Math.floor(
    (stats.atk * 1.5 + stats.def * 1.2 + stats.hp * 0.3 + stats.spd * 1.0) *
    (1 + hero.level * 0.02)
  );
  var power = global.HeroManager.getBattlePower(hero.uid);
  assertEqual(power, expected, 'battlePower matches formula');
});

test('C5-S5: getHeroStats invalid uid returns null', function() {
  resetAll();
  var result = global.HeroManager.getHeroStats('invalid_uid');
  assertEqual(result, null, 'invalid uid returns null');
});

test('C5-S6: getBattlePower invalid uid returns 0', function() {
  resetAll();
  var result = global.HeroManager.getBattlePower('invalid_uid');
  assertEqual(result, 0, 'invalid uid returns 0');
});

// C6: Initialization and Save
console.log('\n--- Ability 6: Init and Save (init/getState) ---');
test('C6-S1: init first game gives ZhaoYun and puts in team', function() {
  resetAll();
  global.HeroManager.init(undefined);
  assertEqual(global.HeroManager._heroes.length, 1, '_heroes=1');
  assertEqual(global.HeroManager._heroes[0].id, 'shu_zhaoyun', 'is ZhaoYun');
  assertEqual(global.HeroManager._team.length, 1, '_team=1');
});

test('C6-S2: init restore save restores full state', function() {
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
  assertEqual(global.HeroManager._heroes.length, 2, '_heroes=2');
  assertEqual(global.HeroManager._heroes[0].uid, 'u1', 'first uid=u1');
  assertEqual(global.HeroManager._team.length, 2, 'team=2');
});

test('C6-S3: getState deep copy does not affect internal', function() {
  resetAll();
  global.HeroManager.addHero('shu_zhaoyun');
  var state = global.HeroManager.getState();
  assert(Array.isArray(state.heroes), 'heroes is array');
  assertEqual(state.heroes.length, 1, 'length=1');
  state.heroes[0].level = 999;
  assertEqual(global.HeroManager._heroes[0].level, 1, 'modification does not affect internal');
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
  console.log('\nFailed Tests:');
  _results.filter(function(r) { return r.status === 'fail'; }).forEach(function(r) {
    console.log('  ' + r.name + ' — ' + r.error);
  });
  process.exit(1);
} else {
  console.log('\nALL TESTS PASSED!');
  process.exit(0);
}
