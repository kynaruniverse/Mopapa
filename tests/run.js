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

  ['understand/rooms', 'store', 'understand/rules', 'understand/custom-rooms', 'understand/sorter', 'memory/entries', 'memory/ask-text', 'memory/ask-people', 'memory/ask-match', 'memory/ask', 'memory/agenda'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(__dirname + '/../js/' + f + '.js', 'utf8'), win, { filename: f });
  });
  return win;
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }


function stored(entries, learned, ask) {
  return {
    'mopapa.v1': JSON.stringify({
      entries: entries || [],
      learned: learned || {},
      customRooms: [],
      ask: ask || { aliases: [], boosts: {}, unanswered: [] }
    })
  };
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

test('ask date ranges: last week filters logged entries to the previous Monday-Sunday', function () {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mondayOffset = (today.getDay() + 6) % 7;
  const thisMonday = new Date(today);
  thisMonday.setDate(thisMonday.getDate() - mondayOffset);

  const previousMonday = new Date(thisMonday);
  previousMonday.setDate(previousMonday.getDate() - 7);

  const previousSunday = new Date(previousMonday);
  previousSunday.setDate(previousSunday.getDate() + 6);

  const beforePreviousWeek = new Date(previousMonday);
  beforePreviousWeek.setDate(beforePreviousWeek.getDate() - 1);

  const w = boot(stored([
    {
      id: 'previous-monday',
      text: 'Saved entry from previous Monday',
      room: 'notes',
      created: previousMonday.toISOString()
    },
    {
      id: 'previous-sunday',
      text: 'Saved entry from previous Sunday',
      room: 'notes',
      created: previousSunday.toISOString()
    },
    {
      id: 'older',
      text: 'Saved entry from before previous week',
      room: 'notes',
      created: beforePreviousWeek.toISOString()
    },
    {
      id: 'today',
      text: 'Saved entry from today',
      room: 'notes',
      created: today.toISOString()
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.ask.answer('What did I save last week?');
  const ids = result.sources.map(function (entry) { return entry.id; });

  assert.ok(ids.includes('previous-monday'), result.answer);
  assert.ok(ids.includes('previous-sunday'), result.answer);
  assert.ok(!ids.includes('older'), result.answer);
  assert.ok(!ids.includes('today'), result.answer);
});

test('ask date ranges: this month excludes entries from the previous month', function () {
  const now = new Date();
  const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const w = boot(stored([
    {
      id: 'this-month',
      text: 'Saved entry from this month',
      room: 'notes',
      created: firstThisMonth.toISOString()
    },
    {
      id: 'last-month',
      text: 'Saved entry from last month',
      room: 'notes',
      created: firstLastMonth.toISOString()
    },
    {
      id: 'last-day-last-month',
      text: 'Saved entry on the last day of last month',
      room: 'notes',
      created: lastMonth.toISOString()
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.ask.answer('What did I save this month?');
  const ids = result.sources.map(function (entry) { return entry.id; });

  assert.ok(ids.includes('this-month'), result.answer);
  assert.ok(!ids.includes('last-month'), result.answer);
  assert.ok(!ids.includes('last-day-last-month'), result.answer);
});

test('ask date ranges: last month includes entries from that month only', function () {
  const now = new Date();
  const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const w = boot(stored([
    {
      id: 'last-month-start',
      text: 'Saved entry at start of last month',
      room: 'notes',
      created: firstLastMonth.toISOString()
    },
    {
      id: 'last-month-end',
      text: 'Saved entry at end of last month',
      room: 'notes',
      created: lastMonthEnd.toISOString()
    },
    {
      id: 'this-month',
      text: 'Saved entry from this month',
      room: 'notes',
      created: firstThisMonth.toISOString()
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.ask.answer('What did I save last month?');
  const ids = result.sources.map(function (entry) { return entry.id; });

  assert.ok(ids.includes('last-month-start'), result.answer);
  assert.ok(ids.includes('last-month-end'), result.answer);
  assert.ok(!ids.includes('this-month'), result.answer);
});

test('ask recognises abbreviated, month-first and numeric dates in saved text', function () {
  const cases = [
    'Dentist appointment on Nov 5 2026',
    'Dentist appointment on November 5th 2026',
    'Dentist appointment on 5/11/2026'
  ];

  cases.forEach(function (text) {
    const w = boot(stored([{
      id: 'dentist',
      text: text,
      room: 'appointments',
      created: new Date(2026, 9, 23, 10, 0).toISOString()
    }]));

    w.Mopapa.store.load();

    const result = w.Mopapa.ask.answer(
      'When is the dentist appointment on 5 November 2026?'
    );

    assert.strictEqual(
      result.sources.length,
      1,
      'Expected Ask to recognise the date in: ' + text
    );
    assert.strictEqual(result.sources[0].id, 'dentist');
  });
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


test('editing an entry clears only its saved source choices', function () {
  const ask = {
    aliases: [],
    boosts: {
      cost: { a: 2, b: 1 },
      date: { a: 1 },
      other: { c: 3 }
    },
    unanswered: []
  };
  const w = boot(stored([
    { id: 'a', text: 'Car service £100', room: 'notes', created: ago(2) },
    { id: 'b', text: 'Boiler service £120', room: 'notes', created: ago(1) }
  ], {}, ask));

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.entries.updateText('a', 'Car service £150'), true);

  const boosts = w.Mopapa.store.data().ask.boosts;
  assert.deepStrictEqual(Object.keys(boosts), ['cost', 'other']);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(boosts.cost)), { b: 1 });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(boosts.other)), { c: 3 });
});

test('deleting an entry clears only its saved source choices', function () {
  const ask = {
    aliases: [],
    boosts: {
      cost: { a: 2, b: 1 },
      date: { a: 1 },
      other: { c: 3 }
    },
    unanswered: []
  };
  const w = boot(stored([
    { id: 'a', text: 'Car service £100', room: 'notes', created: ago(2) },
    { id: 'b', text: 'Boiler service £120', room: 'notes', created: ago(1) }
  ], {}, ask));

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.entries.remove('a'), true);

  const boosts = w.Mopapa.store.data().ask.boosts;
  assert.deepStrictEqual(Object.keys(boosts), ['cost', 'other']);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(boosts.cost)), { b: 1 });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(boosts.other)), { c: 3 });
});

test('failed edit restores the original source choices', function () {
  const ask = {
    aliases: [],
    boosts: { cost: { a: 2, b: 1 }, other: { c: 3 } },
    unanswered: []
  };
  const w = boot(stored([
    { id: 'a', text: 'Car service £100', room: 'notes', created: ago(2) }
  ], {}, ask));

  w.Mopapa.store.load();
  const before = JSON.stringify(w.Mopapa.store.data().ask.boosts);
  w.localStorage.failWrites = true;

  assert.strictEqual(w.Mopapa.entries.updateText('a', 'Car service £150'), false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].text, 'Car service £100');
  assert.strictEqual(JSON.stringify(w.Mopapa.store.data().ask.boosts), before);
});

test('failed delete restores the original source choices', function () {
  const ask = {
    aliases: [],
    boosts: { cost: { a: 2, b: 1 }, other: { c: 3 } },
    unanswered: []
  };
  const w = boot(stored([
    { id: 'a', text: 'Car service £100', room: 'notes', created: ago(2) }
  ], {}, ask));

  w.Mopapa.store.load();
  const before = JSON.stringify(w.Mopapa.store.data().ask.boosts);
  w.localStorage.failWrites = true;

  assert.strictEqual(w.Mopapa.entries.remove('a'), false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].text, 'Car service £100');
  assert.strictEqual(JSON.stringify(w.Mopapa.store.data().ask.boosts), before);
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

function askWith(entries, question) {
  const w = boot(stored(entries));
  w.Mopapa.store.load();
  return w.Mopapa.ask.answer(question);
}

function ago(days) { return new Date(Date.now() - days * 86400000).toISOString(); }


test('agenda determines timed deadlines using the supplied reference time', function () {
  const w = boot({});
  const now = new Date(2026, 0, 1, 12, 0, 0, 0);

  const entries = [
    {
      id: 'future',
      text: 'Task due tomorrow afternoon',
      room: 'todo',
      when: new Date(2026, 0, 2, 15, 0, 0, 0).toISOString(),
      hasTime: true,
      done: false
    },
    {
      id: 'past',
      text: 'Task due this morning',
      room: 'todo',
      when: new Date(2026, 0, 1, 10, 0, 0, 0).toISOString(),
      hasTime: true,
      done: false
    }
  ];

  w.localStorage.setItem('mopapa.v1', JSON.stringify({
    entries: entries,
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  }));
  w.Mopapa.store.load();

  const items = Array.from(w.Mopapa.agenda.getItems(now));

  assert.deepStrictEqual(
    items.map(function (item) {
      return [item.entry.id, item.overdue, item.label];
    }),
    [
      ['past', true, 'Overdue'],
      ['future', false, 'Tomorrow']
    ]
  );
});

test('agenda includes the correct date range and orders overdue items first', function () {
  const w = boot({});
  const now = new Date();
  now.setHours(12, 0, 0, 0);

  function dateAt(offset) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    return date.toISOString();
  }

  const entries = [
    { id: 'old', text: 'Older overdue task', room: 'todo', when: dateAt(-2), hasTime: false, done: false },
    { id: 'recent', text: 'Recently overdue task', room: 'todo', when: dateAt(-1), hasTime: false, done: false },
    { id: 'today', text: 'Task due today', room: 'todo', when: dateAt(0), hasTime: false, done: false },
    { id: 'tomorrow', text: 'Task due tomorrow', room: 'todo', when: dateAt(1), hasTime: false, done: false },
    { id: 'week', text: 'Task due in seven days', room: 'todo', when: dateAt(7), hasTime: false, done: false },
    { id: 'outside', text: 'Task due in eight days', room: 'todo', when: dateAt(8), hasTime: false, done: false },
    { id: 'done', text: 'Completed task', room: 'todo', when: dateAt(0), hasTime: false, done: true }
  ];

  w.localStorage.setItem('mopapa.v1', JSON.stringify({
    entries: entries,
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  }));
  w.Mopapa.store.load();

  const items = Array.from(w.Mopapa.agenda.getItems(now));
  const ids = items.map(function (item) { return item.entry.id; });

  assert.deepStrictEqual(ids, ['old', 'recent', 'today', 'tomorrow', 'week']);
  assert.deepStrictEqual(
    items.map(function (item) { return item.label; }),
    ['Overdue', 'Overdue', 'Due today', 'Tomorrow', 'Coming up']
  );
});

test('ask identifies people in for-phrases regardless of name capitalisation', function () {
  const lowercase = askWith([
    { id: 'a', text: 'The parcel is for jasmine', room: 'notes', created: ago(1) }
  ], 'Who is the parcel for?');

  assert.ok(/for jasmine\./i.test(lowercase.answer), lowercase.answer);

  const fullName = askWith([
    { id: 'b', text: 'The parcel is for Jasmine Smith', room: 'notes', created: ago(1) }
  ], 'Who is the parcel for?');

  assert.ok(/for Jasmine Smith\./.test(fullName.answer), fullName.answer);
});

test('ask match module detects typos without relaxing short words or numbers', function () {
  const w = boot({});
  const match = w.Mopapa.askParts.match;

  assert.strictEqual(match.editDistance('cat', 'cat', 1), 0);
  assert.strictEqual(match.editDistance('cat', 'car', 1), 1);
  assert.strictEqual(match.editDistance('form', 'from', 1), 1);

  assert.strictEqual(match.termsClose('dentist', 'dentist'), true);
  assert.strictEqual(match.termsClose('dentist', 'dentits'), true);
  assert.strictEqual(match.termsClose('kitchen', 'kichen'), true);

  // Short words must not be treated as fuzzy matches.
  assert.strictEqual(match.termsClose('cat', 'car'), false);

  // Numeric terms must match exactly.
  assert.strictEqual(match.termsClose('room12', 'room13'), false);

  // Larger differences should not be accepted as typos.
  assert.strictEqual(match.termsClose('dentist', 'computer'), false);
});

test('ask text module normalises text and matches words consistently', function () {
  const w = boot({});
  const text = w.Mopapa.askParts.text;

  assert.strictEqual(
    text.norm("  John's KEYS   are here! "),
    'johns keys are here'
  );

  assert.deepStrictEqual(
    Array.from(text.words('Keys are in the kitchen')),
    ['keys', 'are', 'in', 'the', 'kitchen']
  );

  assert.strictEqual(
    text.hasPhrase('Keys are in the kitchen drawer', 'kitchen drawer'),
    true
  );

  assert.strictEqual(
    text.hasPhrase('Keys are in the kitchen drawer', 'kitchen'),
    true
  );

  assert.strictEqual(
    text.hasPhrase('Keys are in the kitchen drawer', 'kit'),
    false
  );

  assert.strictEqual(text.stem('keys'), 'key');
  assert.strictEqual(text.stem('paid'), 'pay');
  assert.strictEqual(text.stem('spending'), 'spend');
  assert.strictEqual(text.stem('bought'), 'buy');
  assert.strictEqual(text.stem('string'), 'string');
});

test('ask people module handles names and question types directly', function () {
  const w = boot({});
  const people = w.Mopapa.askParts.people;

  assert.strictEqual(
    people.asksWhoSomethingIsFor('Who is this for?'),
    true
  );

  assert.strictEqual(
    people.asksWhoSomethingIsFor('Where is the dentist?'),
    false
  );

  assert.strictEqual(
    people.isNameQuestion('What is the dentist called?'),
    true
  );

  assert.strictEqual(
    people.extractForPerson('The appointment is for John at 5pm'),
    'John'
  );

  assert.strictEqual(
    people.extractForPerson('The parcel is for Jasmine tomorrow'),
    'Jasmine'
  );

  assert.strictEqual(
    people.extractForPerson('The appointment is for the dentist'),
    null
  );

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(
      people.extractCalledPerson('The dentist is called Dr Smith.')
    )),
    {
      role: 'dentist',
      name: 'Dr Smith'
    }
  );

  assert.strictEqual(
    people.extractCalledPerson('An appointment is tomorrow'),
    null
  );
});


test('ask does not include following time or date words in a person name', function () {
  const cases = [
    {
      text: 'The appointment is for John at 5pm',
      expected: 'John'
    },
    {
      text: 'The parcel is for Jasmine tomorrow',
      expected: 'Jasmine'
    }
  ];

  cases.forEach(function (item, index) {
    const r = askWith([
      {
        id: 'person-' + index,
        text: item.text,
        room: 'notes',
        created: ago(1)
      }
    ], 'Who is this for?');

    assert.ok(
      r.answer.includes('for ' + item.expected + '.'),
      item.text + ' -> ' + r.answer
    );
  });
});


test('ask does not mistake ordinary for-phrases for people', function () {
  [
    'The parcel is for the appointment',
    'The parcel is for a delivery'
  ].forEach(function (entry) {
    const r = askWith([
      { id: 'a', text: entry, room: 'notes', created: ago(1) }
    ], 'Who is the parcel for?');

    assert.ok(/I could not find who that is for/.test(r.answer), r.answer);
    assert.strictEqual(r.sources.length, 0);
  });
});

test('extract: finds where things are and ignores dates and times', function () {
  const w = boot({});
  const r = w.Mopapa.rules;
  assert.strictEqual(r.extract('Keys are in the kitchen drawer').fact.value, 'in the kitchen drawer');
  assert.strictEqual(r.extract('Passport and charger are in the top drawer').fact.items.length, 2);
  assert.strictEqual(r.extract('Car is parked on level 3').fact.where, 'level 3');
  assert.strictEqual(r.extract('Dentist appointment is on 5 November').fact, null);
  assert.strictEqual(r.extract('Dentist appointment is on 5 May').fact, null);
  assert.strictEqual(r.extract('Meeting is at 3pm').fact, null);
  assert.strictEqual(r.extract('I think the plan is on track').fact, null);
  assert.deepStrictEqual(Array.from(r.extract('MOT £55 and tyres £1,210.50').amounts), [55, 1210.5]);
});

test('money parser: reads large amounts with and without thousands separators', function () {
  const w = boot({});
  const r = w.Mopapa.rules;

  assert.strictEqual(r.money('Car repair £2500.00'), '£2500.00');
  assert.strictEqual(r.money('Car repair £2,500.00'), '£2,500.00');
  assert.strictEqual(r.money('Boiler repair £1200'), '£1200');

  assert.deepStrictEqual(
    Array.from(r.moneyAll('Car £2500 and boiler £1,200.50')),
    [2500, 1200.5]
  );
});

test('entries.add and updateText save and revert structured fields', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  const saved = w.Mopapa.entries.add({ text: 'Keys are in the kitchen drawer', room: 'notes' });
  assert.strictEqual(saved.entry.fact.value, 'in the kitchen drawer');
  assert.strictEqual(JSON.parse(w.localStorage._['mopapa.v1']).entries[0].fact.attr, 'location');
  w.localStorage.failWrites = true;
  assert.strictEqual(w.Mopapa.entries.updateText(saved.entry.id, 'Keys are in the car'), false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].fact.value, 'in the kitchen drawer');
  w.localStorage.failWrites = false;
  assert.strictEqual(w.Mopapa.entries.updateText(saved.entry.id, 'Keys are in the car'), true);
  assert.strictEqual(w.Mopapa.store.data().entries[0].fact.value, 'in the car');
});

test('ask: where uses the newest saved location, even for old entries without fields', function () {
  const r = askWith([
    { id: 'new', text: 'Keys are in the car', room: 'notes', created: ago(1) },
    { id: 'old', text: 'Keys are in the kitchen drawer', room: 'notes', created: ago(5) }
  ], 'Where did I leave my keys?');
  assert.ok(/in the car/.test(r.answer), r.answer);
  assert.strictEqual(r.sources[0].id, 'new');
});

test('ask: flat number and plural are kept', function () {
  const r = askWith([
    { id: 'a', text: 'Flat 4 key is in the hall', room: 'notes', created: ago(2) },
    { id: 'b', text: 'Car key is in my coat', room: 'notes', created: ago(2) }
  ], 'Where is the flat 4 key?');
  assert.ok(/in the hall/.test(r.answer), r.answer);
});

test('ask: what is in a place lists only items whose newest location is there', function () {
  const entries = [
    { id: 'c', text: 'Charger is in the car', room: 'notes', created: ago(1) },
    { id: 'p', text: 'Passport and charger are in the top drawer', room: 'notes', created: ago(4) },
    { id: 'k', text: 'Keys are in the kitchen drawer', room: 'notes', created: ago(3) }
  ];
  ['What things are in the top drawer?', "What's in the top drawer?"].forEach(function (q) {
    const r = askWith(entries, q);
    assert.ok(/passport/.test(r.answer) && !/charger/.test(r.answer) && !/key/.test(r.answer), q + ' -> ' + r.answer);
  });
});

test('ask: generic list hides replaced entries and says so', function () {
  const r = askWith([
    { id: 'new', text: 'Keys are in the car', room: 'notes', created: ago(1) },
    { id: 'old', text: 'Keys are in the kitchen drawer', room: 'notes', created: ago(5) }
  ], 'What do I know about keys?');
  assert.strictEqual(r.sources.length, 1);
  assert.strictEqual(r.sources[0].id, 'new');
  assert.ok(/hid 1 older entry/.test(r.answer), r.answer);
});

test('ask: spending questions add up the amounts', function () {
  const r = askWith([
    { id: 'a', text: 'Car MOT £55', room: 'notes', created: ago(9) },
    { id: 'b', text: 'Car tyres £210', room: 'notes', created: ago(3) },
    { id: 'c', text: 'Boiler service £120', room: 'notes', created: ago(2) }
  ], 'How much did I spend on the car?');
  assert.ok(/£265/.test(r.answer), r.answer);
  assert.strictEqual(r.sources.length, 2);
});

test('ask: total spending without a subject adds only explicit spending entries', function () {
  const r = askWith([
    { id: 'g', text: 'I spent £12 on groceries', room: 'notes', created: ago(1) },
    { id: 'c', text: 'I spent £8 on household cleaning products', room: 'notes', created: ago(2) },
    { id: 'k', text: 'I paid £18.50 for the replacement kettle', room: 'notes', created: ago(3) }
  ], 'How much did I spend in total?');

  assert.ok(/£20/.test(r.answer), r.answer);
  assert.strictEqual(r.sources.length, 2);
  assert.ok(r.sources.some(function (e) { return e.id === 'g'; }));
  assert.ok(r.sources.some(function (e) { return e.id === 'c'; }));
  assert.ok(!r.sources.some(function (e) { return e.id === 'k'; }));
});

test('ask: total spending includes multiple amounts in one entry', function () {
  const r = askWith([
    {
      id: 'a',
      text: 'I spent £55 on the MOT and £210 on tyres',
      room: 'notes',
      created: ago(1)
    }
  ], 'How much did I spend in total?');

  assert.ok(/£265/.test(r.answer), r.answer);
  assert.strictEqual(r.sources.length, 1);
  assert.strictEqual(r.sources[0].id, 'a');
});

test('ask: past date questions stay in the past', function () {
  const y = new Date().getFullYear();
  const r = askWith([
    { id: 'a', text: 'Paid £120 for the boiler service on 3 March ' + y, room: 'notes', created: ago(1) }
  ], 'How much did I pay for the boiler service on 3 March?');
  assert.ok(/£120/.test(r.answer), r.answer);
});

test('ask: typos and aliases give closest matches, unknown things give no guess', function () {
  const entries = [
    { id: 'p', text: 'Passport is in the top drawer', room: 'notes', created: ago(2) },
    { id: 'b', text: 'Bin day is Thursday', room: 'notes', created: ago(2) }
  ];
  const typo = askWith(entries, 'Where is my pasport?');
  assert.ok(/in the top drawer/.test(typo.answer), typo.answer);
  assert.ok(/Bin day/.test(askWith(entries, 'What did I save about rubbish?').answer));
  const none = askWith(entries, 'Where is my umbrella?');
  assert.ok(/could not find/i.test(none.answer), none.answer);
  assert.strictEqual(none.sources.length, 0);
});

test('ask: location verbs and generic words do not block a match', function () {
  const r = askWith([{ id: 'k', text: 'Keys are in the kitchen drawer', room: 'notes', created: ago(2) }], 'Where did I put my keys?');
  assert.ok(/kitchen drawer/.test(r.answer), r.answer);
});

function reboot(w) {
  const copy = Object.assign({}, w.localStorage._);
  const next = boot(copy);
  next.Mopapa.store.load();
  return next;
}

test('learning: taught words persist, work after reload, and leave room learning alone', function () {
  const learned = { grocery: { wishlist: 99 } };
  const w = boot(stored([{ id: 's', text: 'Sofa is in the lounge', room: 'notes', created: ago(2) }], learned));
  w.Mopapa.store.load();
  const before = JSON.stringify(w.Mopapa.store.data().learned);
  assert.ok(/could not find/i.test(w.Mopapa.ask.answer('Where is the couch?').answer));
  assert.strictEqual(w.Mopapa.ask.teachAlias('couch', 'sofa'), true);
  assert.ok(/in the lounge/.test(w.Mopapa.ask.answer('Where is the couch?').answer));
  assert.strictEqual(JSON.stringify(w.Mopapa.store.data().learned), before);
  const again = reboot(w);
  assert.ok(/in the lounge/.test(again.Mopapa.ask.answer('Where is the couch?').answer));
  assert.strictEqual(again.Mopapa.ask.forgetAlias('couch', 'sofa'), true);
  const gone = again.Mopapa.ask.answer('Where is the couch?');
  assert.ok(/could not find/i.test(gone.answer));
  assert.strictEqual(gone.missed, true);
});

test('learning: failed saves are not remembered', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.localStorage.failWrites = true;
  assert.strictEqual(w.Mopapa.ask.teachAlias('couch', 'sofa'), false);
  assert.strictEqual(w.Mopapa.ask.logUnanswered('Where is my umbrella?'), false);
  assert.strictEqual(w.Mopapa.ask.confirmSource('Where is my umbrella?', 'x'), false);
  const l = w.Mopapa.ask.learned();
  assert.strictEqual(l.aliases.length + l.unanswered.length + l.taps, 0);
  assert.strictEqual(w.Mopapa.ask.teachAlias('two words', 'sofa'), false);
});

test('learning: a tapped source settles a "which do you mean" cost question', function () {
  const w = boot(stored([
    { id: 'a', text: 'Car service £100', room: 'notes', created: ago(8) },
    { id: 'b', text: 'Car service £150', room: 'notes', created: ago(2) }
  ]));
  w.Mopapa.store.load();
  const q = 'How much did the car service cost?';
  assert.ok(/Which job or purchase/.test(w.Mopapa.ask.answer(q).answer));
  assert.strictEqual(w.Mopapa.ask.confirmSource(q, 'b'), true);
  assert.ok(/^It cost £150/.test(w.Mopapa.ask.answer(q).answer), w.Mopapa.ask.answer(q).answer);
  assert.strictEqual(w.Mopapa.ask.clearConfirmed(), true);
  assert.ok(/Which job or purchase/.test(w.Mopapa.ask.answer(q).answer));
});

test('ask does not assume a single priced entry is unambiguous', function () {
  const r = askWith([
    { id: 'a', text: 'Car service £150', room: 'notes', created: ago(2) },
    { id: 'b', text: 'Car service booked for Friday', room: 'notes', created: ago(1) }
  ], 'How much did the car service cost?');

  assert.ok(/Which job or purchase/.test(r.answer), r.answer);
  assert.strictEqual(r.sources.length, 1);
  assert.strictEqual(r.sources[0].id, 'a');
});

test('cost questions get a price, not a closest-matches list', function () {
  const r = askWith([
    { id: 'a', text: 'Boiler service visit £120', room: 'notes', created: ago(3) },
    { id: 'b', text: 'Call the plumber', room: 'todo', created: ago(2) },
    { id: 'c', text: 'Buy bin bags', room: 'wishlist', created: ago(1) }
  ], 'How much did the boiler service visit cost?');
  assert.ok(/^It cost £120/.test(r.answer), r.answer);
});

test('learning: a tapped appointment settles a "which entry" date question', function () {
  const soon = new Date(Date.now() + 3 * 86400000).toISOString();
  const later = new Date(Date.now() + 10 * 86400000).toISOString();
  const w = boot(stored([
    { id: 'a', text: 'Dentist check up', room: 'appointments', when: soon, created: ago(2) },
    { id: 'b', text: 'Dentist hygiene visit', room: 'appointments', when: later, created: ago(1) }
  ]));
  w.Mopapa.store.load();
  const q = 'When is the dentist?';
  assert.ok(/Which entry do you mean/.test(w.Mopapa.ask.answer(q).answer));
  w.Mopapa.ask.confirmSource(q, 'b');
  const r = w.Mopapa.ask.answer(q);
  assert.ok(!/Which entry do you mean/.test(r.answer), r.answer);
  assert.strictEqual(r.sources.length, 1);
  assert.strictEqual(r.sources[0].id, 'b');
});

test('learning: unanswered questions are logged once, capped, and clearable', function () {
  const w = boot(stored([{ id: 'a', text: 'Call mum', room: 'todo', created: ago(1) }]));
  w.Mopapa.store.load();
  assert.strictEqual(w.Mopapa.ask.answer('Where is my umbrella?').missed, true);
  assert.notStrictEqual(w.Mopapa.ask.answer('Where is mum?').missed, true);
  w.Mopapa.ask.logUnanswered('Where is my umbrella?');
  w.Mopapa.ask.logUnanswered('where is my umbrella?');
  assert.strictEqual(w.Mopapa.ask.learned().unanswered.length, 1);
  for (let i = 0; i < 40; i++) w.Mopapa.ask.logUnanswered('question number ' + i);
  assert.strictEqual(w.Mopapa.ask.learned().unanswered.length, 30);
  assert.strictEqual(w.Mopapa.ask.clearUnanswered(), true);
  assert.strictEqual(w.Mopapa.ask.learned().unanswered.length, 0);
});

test('learning: damaged saved learning data is cleaned on load', function () {
  const w = boot({ 'mopapa.v1': JSON.stringify({
    entries: [], learned: {}, customRooms: [],
    ask: {
      aliases: [['a'], 'x', ['gp', 'doctor']],
      boosts: { sig: { id1: 1, bad: 'x' }, broken: 5 },
      unanswered: [{ q: 'ok' }, { q: 5 }, null]
    }
  }) });
  w.Mopapa.store.load();
  const l = w.Mopapa.ask.learned();
  assert.strictEqual(l.aliases.length, 1);
  assert.strictEqual(l.unanswered.length, 1);
  assert.strictEqual(l.taps, 0);
});

test('learning screen is wired in and teaches without touching room learning', function () {
  const talk = fs.readFileSync(__dirname + '/../js/ui/talk.js', 'utf8');
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  const main = fs.readFileSync(__dirname + '/../js/main.js', 'utf8');
  assert.ok(talk.includes('Tap the one you meant'));
  assert.ok(talk.includes('teachAliasFrom'));
  assert.ok(!talk.includes('Mopapa.sorter.learn'));
  assert.ok(html.includes('js/ui/ask-learning.js'));
  assert.ok(html.includes('id="ask-learning"'));
  assert.ok(main.includes('M.askLearningUI.init();'));
});

let failed = 0;
tests.forEach(function (t) {
  try { t[1](); console.log('PASS', t[0]); }
  catch (e) { failed++; console.log('FAIL', t[0], '-', e.message); }
});
console.log((tests.length - failed) + '/' + tests.length + ' tests passed');
process.exit(failed ? 1 : 0);
