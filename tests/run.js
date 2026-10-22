const fs = require('fs'), vm = require('vm'), assert = require('assert');

function boot(storage) {
  const ls = {
    _: Object.assign({}, storage),
    failWrites: false,
    getItem(k) { return k in this._ ? this._[k] : null; },
    setItem(k, v) {
      if (this.failWrites) throw new Error('simulated storage failure');
      this._[k] = String(v);
    }
  };
  const win = { localStorage: ls, console };
  win.window = win;
  vm.createContext(win);
  ['understand/rooms', 'store', 'understand/rules', 'understand/custom-rooms', 'understand/sorter', 'memory/entries', 'memory/ask'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(__dirname + '/../js/' + f + '.js', 'utf8'), win, { filename: f });
  });
  return win;
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

function stored(entries, learned) {
  return { 'mopapa.v1': JSON.stringify({ entries: entries || [], learned: learned || {}, customRooms: [] }) };
}

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
  const w = boot(stored([{ id: 'a', text: 'Paid electric bill £84', room: 'notes', created: new Date().toISOString() }]));
  w.Mopapa.store.load();
  assert.strictEqual(w.Mopapa.ask.answer('Did I pay the electric bill?').sources.length, 1);
});

test('ask: no search words does not dump entries', function () {
  const w = boot(stored([{ id: 'a', text: 'Call mum', room: 'todo', created: new Date().toISOString() }]));
  w.Mopapa.store.load();
  assert.strictEqual(w.Mopapa.ask.answer('What do I have?').sources.length, 0);
});

test('learned room scores stay dormant and unchanged', function () {
  const learned = { grocery: { wishlist: 99 } };
  const w = boot(stored([], learned));
  w.Mopapa.store.load();
  const before = JSON.stringify(w.Mopapa.store.data().learned);
  const result = w.Mopapa.sorter.classify('grocery');
  assert.strictEqual(result.confident, false);
  assert.strictEqual(result.room, null);
  assert.strictEqual(w.Mopapa.sorter.learn('grocery', 'wishlist'), false);
  assert.strictEqual(JSON.stringify(w.Mopapa.store.data().learned), before);
});

test('failed add removes unsaved entry from list and leaves persisted data intact', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.localStorage.failWrites = true;
  const result = w.Mopapa.entries.add({ text: 'Keep this text', room: 'notes' });
  assert.strictEqual(result.saved, false);
  assert.strictEqual(result.entry.text, 'Keep this text');
  assert.strictEqual(w.Mopapa.entries.byRoom('notes').length, 0);
  assert.strictEqual(JSON.parse(w.localStorage._['mopapa.v1']).entries.length, 0);
});

test('failed delete leaves entry visible and stored', function () {
  const w = boot(stored([{ id: 'a', text: 'Keep me', room: 'notes', tags: ['old'], created: new Date().toISOString() }]));
  w.Mopapa.store.load();
  w.localStorage.failWrites = true;
  assert.strictEqual(w.Mopapa.entries.remove('a'), false);
  assert.strictEqual(w.Mopapa.entries.byRoom('notes').length, 1);
  assert.strictEqual(JSON.parse(w.localStorage._['mopapa.v1']).entries[0].text, 'Keep me');
});

test('failed edits, tags, done, pin and move all revert in memory', function () {
  const w = boot(stored([{ id: 'a', text: 'Original', room: 'notes', tags: ['old'], done: false, pinned: false, created: new Date().toISOString() }]));
  w.Mopapa.store.load();
  w.localStorage.failWrites = true;
  assert.strictEqual(w.Mopapa.entries.updateText('a', 'Changed'), false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].text, 'Original');
  assert.strictEqual(w.Mopapa.entries.setTags('a', ['new']), false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].tags[0], 'old');
  assert.strictEqual(w.Mopapa.entries.toggleDone('a'), false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].done, false);
  assert.strictEqual(w.Mopapa.entries.togglePinned('a'), null);
  assert.strictEqual(w.Mopapa.store.data().entries[0].pinned, false);
  assert.strictEqual(w.Mopapa.entries.move('a', 'todo'), false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].room, 'notes');
});


test('failed custom-room creation leaves no in-memory or stored room', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();
  w.localStorage.failWrites = true;
  const result = w.Mopapa.customRooms.add('Bookshelf', 'book');
  assert.strictEqual(result.ok, false);
  assert.strictEqual(w.Mopapa.store.data().customRooms.length, 0);
  assert.strictEqual(w.Mopapa.rooms.some(function (room) { return room.name === 'Bookshelf'; }), false);
  assert.strictEqual(JSON.parse(w.localStorage._['mopapa.v1']).customRooms.length, 0);
});

test('normal interface has no import controls or backup-success timestamp', function () {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  const main = fs.readFileSync(__dirname + '/../js/main.js', 'utf8');
  assert.ok(!html.includes('id="btn-import"'));
  assert.ok(!html.includes('id="file-import"'));
  assert.ok(!main.includes('mopapa.lastBackup'));
  assert.ok(main.includes('Backup download started. Check your Downloads folder before relying on it.'));
});

test('capture code preserves text after failed save and does not ask for a room when uncertain', function () {
  const talk = fs.readFileSync(__dirname + '/../js/ui/talk.js', 'utf8');
  assert.ok(talk.includes('input.value = ctx.text;'));
  assert.ok(talk.includes("ctx.room = 'notes';"));
  assert.ok(!talk.includes('Mopapa.sorter.learn'));
});

let failed = 0;
tests.forEach(function (t) {
  try { t[1](); console.log('PASS', t[0]); }
  catch (e) { failed++; console.log('FAIL', t[0], '-', e.message); }
});
console.log((tests.length - failed) + '/' + tests.length + ' tests passed');
process.exit(failed ? 1 : 0);
