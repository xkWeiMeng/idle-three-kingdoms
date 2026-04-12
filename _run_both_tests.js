var fs = require('fs');
var vm = require('vm');

function runTestFile(filePath) {
  var _elements = {};
  global.document = {
    getElementById: function(id) {
      if (!_elements[id]) _elements[id] = { innerHTML: '', style: {}, children: [], appendChild: function(c) { this.children.push(c); } };
      return _elements[id];
    },
    createElement: function(tag) { return { className: '', textContent: '', appendChild: function(c) {} }; }
  };
  global.window = {};
  global.setTimeout = function(fn) { fn(); };

  var html = fs.readFileSync(filePath, 'utf8');
  var re = /<script(?:\s+src="([^"]*)")?\s*>([\s\S]*?)<\/script>/g;
  var scripts = [], m;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) scripts.push({ t: 'file', p: m[1].replace(/\.\.\//g, '') });
    else if (m[2].trim()) scripts.push({ t: 'inline', c: m[2] });
  }
  for (var i = 0; i < scripts.length; i++) {
    try {
      var code = scripts[i].t === 'file' ? fs.readFileSync(scripts[i].p, 'utf8') : scripts[i].c;
      vm.runInThisContext(code, { filename: scripts[i].p || ('inline_' + i) });
    } catch(e) {
      return { file: filePath, error: e.message };
    }
  }
  if (typeof _results !== 'undefined') {
    var p = _results.filter(function(r) { return r.status === 'pass'; }).length;
    var f = _results.filter(function(r) { return r.status === 'fail'; }).length;
    var fails = _results.filter(function(r) { return r.status === 'fail'; }).map(function(r) { return r.name + ': ' + r.error; });
    // Clean up
    _results = undefined;
    return { file: filePath, passed: p, failed: f, total: p + f, fails: fails };
  }
  return { file: filePath, error: 'no _results found' };
}

// Run town-manager test
var result = runTestFile('tests/town-manager.test.html');
console.log(result.file + ': ' + (result.error || (result.passed + '/' + result.total + ' passed, ' + result.failed + ' failed')));
if (result.fails && result.fails.length > 0) result.fails.forEach(function(f) { console.log('  FAIL: ' + f); });

// Run construction worker test
result = runTestFile('tests/construction-worker.test.html');
console.log(result.file + ': ' + (result.error || (result.passed + '/' + result.total + ' passed, ' + result.failed + ' failed')));
if (result.fails && result.fails.length > 0) result.fails.forEach(function(f) { console.log('  FAIL: ' + f); });
