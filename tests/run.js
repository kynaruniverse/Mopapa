const fs = require('fs'), vm = require('vm'), assert = require('assert');

function boot(storage) {
  const ls = {
    _: Object.assign({}, storage),
    getItem(k) { return k in this._ ? this._[k] : null; },
    setItem(k, v) { this._[k] = String(v); }
  };
  const win = { localStorage: ls, console };
  win.window = win;
  vm.createContext(win);
  ['understand/rooms', 'store', 'understand/rules', 'memory/entries', 'memory/ask'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(__dirname + '/../js/' + f + '.js', 'utf8'), win, { filename: f });
  });
  return win;
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test('load drops null entries instead of crashing later', function () {
  const w = boot({ 'mopapa.v1': JSON.stringify({ entries: [null, { id: 'a', text: 'x', room: 'todo' }] }) });
  w.Mopapa.store.load();
  assert.ok(w.Mopapa.store.data().entries.every(function (e) { return e && typeof e.text === 'string'; }));
});

test('corrupt storage is backed up, not lost', function () {
  const w = boot({ 'mopapa.v1': '{"entries":[{"id":"a","text":"keep me"' });
  w.Mopapa.store.load();
  assert.ok(Object.keys(w.localStorage._).some(function (k) { return k.indexOf('mopapa.v1.corrupt.') === 0; }));
});

test('date parser: tomorrow at 5pm', function () {
  const w = boot({});
  const r = w.Mopapa.rules.parse('call mum tomorrow at 5pm', new Date(2026, 9, 21, 10, 0));
  assert.ok(r && r.hasTime);
  assert.strictEqual(r.date.getDate(), 22);
  assert.strictEqual(r.date.getHours(), 17);
});

test('question-shaped text is not a dead end', function () {
  const w = boot({});
  assert.notStrictEqual(w.Mopapa.rules.questionLevel('What if I built a cat cafe?'), 'sure');
});

test('ask: paid matches pay', function () {
  const w = boot({ 'mopapa.v1': JSON.stringify({ entries: [
    { id: 'a', text: 'Paid electric bill £84', room: 'notes', created: new Date().toISOString() }
  ] }) });
  w.Mopapa.store.load();
  assert.strictEqual(w.Mopapa.ask.answer('Did I pay the electric bill?').sources.length, 1);
});

test('ask: no search words does not dump entries', function () {
  const w = boot({ 'mopapa.v1': JSON.stringify({ entries: [
    { id: 'a', text: 'Call mum', room: 'todo', created: new Date().toISOString() }
  ] }) });
  w.Mopapa.store.load();
  assert.strictEqual(w.Mopapa.ask.answer('What do I have?').sources.length, 0);
});

let failed = 0;
tests.forEach(function (t) {
  try { t[1](); console.log('PASS', t[0]); }
  catch (e) { failed++; console.log('FAIL', t[0], '-', e.message); }
});
process.exit(failed ? 1 : 0);
