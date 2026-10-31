const fs = require('fs'), vm = require('vm'), assert = require('assert');

function boot(storage) {
  const ls = {
    _: Object.assign({}, storage),
    failWrites: false,
    get length() { return Object.keys(this._).length; },
    key(i) { return Object.keys(this._)[i] || null; },
    getItem(k) { return k in this._ ? this._[k] : null; },
    setItem(k, v) {
      if (this.failWrites) throw new Error('simulated storage failure');
      this._[k] = String(v);
    }
  };
  const win = { localStorage: ls, console };
  win.window = win;
  vm.createContext(win);

  [
    'understand/rooms',
    'store',
    'understand/rules',
    'understand/custom-rooms',
    'understand/sorter',
    'memory/entries',
    'memory/search',
    'ask/ask-text',
    'ask/ask-people',
    'ask/ask-person-answer',
    'ask/ask-match',
    'ask/ask-ranking',
    'ask/ask-facts',
    'ask/ask-date-text',
    'ask/ask-date-filter',
    'ask/ask-date-intent',
    'ask/ask-date-overview',
    'ask/ask-money-intent',
    'ask/ask-date-answer',
    'ask/ask-location-answer',
    'ask/ask-money-answer',
    'ask/ask-money-format',
    'ask/ask-question-intent',
    'ask/ask-room-intent',
    'ask/ask-query',
    'ask/ask-aliases',
    'ask/ask-learning',
    'ask/ask',
    'memory/agenda'
  ].forEach(function (f) {
    vm.runInContext(fs.readFileSync(__dirname + '/../js/' + f + '.js', 'utf8'), win, { filename: f });
  });
  return win;
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test('ask modules are loaded once and before ask.js', function () {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');

  const modules = [
    'js/ask/ask-text.js',
    'js/ask/ask-people.js',
    'js/ask/ask-person-answer.js',
    'js/ask/ask-results.js',
    'js/ask/ask-match.js',
    'js/ask/ask-ranking.js',
    'js/ask/ask-facts.js',
    'js/ask/ask-date-text.js',
    'js/ask/ask-date-filter.js',
    'js/ask/ask-date-intent.js',
    'js/ask/ask-date-overview.js',
    'js/ask/ask-date-answer.js',
    'js/ask/ask-location-answer.js',
    'js/ask/ask-money-intent.js',
    'js/ask/ask-money-answer.js',
    'js/ask/ask-money-format.js',
    'js/ask/ask-question-intent.js',
    'js/ask/ask-room-intent.js',
    'js/ask/ask-query.js',
    'js/ask/ask-aliases.js',
    'js/ask/ask-learning.js'
  ];

  const askTag = '<script src="js/ask/ask.js"></script>';
  const askPosition = html.indexOf(askTag);

  assert.ok(askPosition !== -1, 'ask.js must be loaded');
  assert.strictEqual(
    html.indexOf(askTag, askPosition + askTag.length),
    -1,
    'ask.js must not be loaded more than once'
  );

  let previousPosition = -1;

  modules.forEach(function (src) {
    const tag = '<script src="' + src + '"></script>';
    const first = html.indexOf(tag);

    assert.ok(first !== -1, src + ' must be loaded');
    assert.strictEqual(
      html.indexOf(tag, first + tag.length),
      -1,
      src + ' must not be loaded more than once'
    );
    assert.ok(
      first < askPosition,
      src + ' must load before ask.js'
    );
    assert.ok(
      first > previousPosition,
      src + ' must load after the preceding module'
    );

    previousPosition = first;
  });
});

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

test('loading migrates legacy pound-string amounts without changing entry text', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        {
          id: 'legacy-pound',
          text: 'Car repair £2,500.50',
          room: 'notes',
          amount: '£2,500.50',
          amounts: [2500.5],
          created: ago(1)
        },
        {
          id: 'invalid-amount',
          text: 'Malformed amount entry',
          room: 'notes',
          amount: '12.50',
          created: ago(2)
        },
        {
          id: 'legacy-without-price',
          text: 'Old entry without a price',
          room: 'notes',
          amount: '£99',
          created: ago(3)
        },
        {
          id: 'malformed-decimal',
          text: 'Malformed price £12.345',
          room: 'notes',
          amount: '£12.345',
          created: ago(4)
        }
      ],
      learned: {},
      customRooms: [],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();

  const entries = w.Mopapa.store.data().entries;

  assert.strictEqual(entries.length, 3);

  const legacy = entries.find(function (entry) {
    return entry.id === 'legacy-pound';
  });

  assert.ok(legacy);
  assert.strictEqual(legacy.amount, 2500.5);
  assert.strictEqual(legacy.text, 'Car repair £2,500.50');

  const withoutPrice = entries.find(function (entry) {
    return entry.id === 'legacy-without-price';
  });

  assert.ok(withoutPrice);
  assert.strictEqual(withoutPrice.amount, null);
  assert.strictEqual(withoutPrice.text, 'Old entry without a price');

  const malformed = entries.find(function (entry) {
    return entry.id === 'malformed-decimal';
  });

  assert.ok(malformed);
  assert.strictEqual(malformed.amount, null);
  assert.strictEqual(malformed.text, 'Malformed price £12.345');
});

test('loading malformed entries does not discard valid neighbours', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: 'first', text: 'First valid memory', room: 'notes' },
        null,
        [],
        { text: 'Missing ID', room: 'notes' },
        { id: 'blank-text', text: '   ', room: 'notes' },
        { id: 'missing-room', text: 'Missing room' },
        { id: 'second', text: 'Second valid memory', room: 'ideas' }
      ],
      learned: {},
      customRooms: [],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();

  const entries = w.Mopapa.store.data().entries;

  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].id, 'first');
  assert.strictEqual(entries[1].id, 'second');

  assert.strictEqual(w.Mopapa.store.data().rejectedEntries, 5);
  assert.strictEqual(w.Mopapa.store.data().recoveryCopySaved, true);

  const recoveryKeys = Object.keys(w.localStorage._).filter(function (key) {
    return key.indexOf('mopapa.v1.recovery.') === 0;
  });

  assert.strictEqual(recoveryKeys.length, 1);
  assert.strictEqual(
    w.localStorage._[recoveryKeys[0]],
    w.localStorage._['mopapa.v1']
  );
});

test('recovery copies can be discovered after reloading storage', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: 'valid', text: 'Keep this memory', room: 'notes' }
      ]
    }),
    'mopapa.v1.recovery.100': '{"entries":[null]}',
    'mopapa.v1.corrupt.200': '{broken json'
  });

  w.Mopapa.store.load();

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 2);

  assert.strictEqual(copies[0].key, 'mopapa.v1.recovery.100');
  assert.strictEqual(copies[0].kind, 'recovery');
  assert.strictEqual(copies[1].key, 'mopapa.v1.corrupt.200');
  assert.strictEqual(copies[1].kind, 'corrupt');

  assert.strictEqual(w.Mopapa.store.exportRecoveryCopy('mopapa.v1'), false);
  assert.strictEqual(w.Mopapa.store.exportRecoveryCopy('mopapa.v1.recovery.missing'), false);
});

test('recovery discovery returns an empty list when storage enumeration fails', function () {
  const w = boot({});

  Object.defineProperty(w.localStorage, 'length', {
    get: function () {
      throw new Error('simulated storage enumeration failure');
    }
  });

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(w.Mopapa.store.recoveryCopies())),
    []
  );
});

test('loading rejected entries reports when recovery backup fails', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: 'valid', text: 'Keep this memory', room: 'notes' },
        null
      ]
    })
  });

  w.localStorage.failWrites = true;
  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().entries.length, 1);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'valid');
  assert.strictEqual(w.Mopapa.store.data().rejectedEntries, 1);
  assert.strictEqual(w.Mopapa.store.data().recoveryCopySaved, false);

  const recoveryKeys = Object.keys(w.localStorage._).filter(function (key) {
    return key.indexOf('mopapa.v1.recovery.') === 0;
  });

  assert.strictEqual(recoveryKeys.length, 0);
});

test('search finds entries containing prototype-like words', function () {
  const w = boot(stored([
    {
      id: 'constructor-entry',
      text: 'constructor reference',
      room: 'notes',
      created: new Date().toISOString()
    },
    {
      id: 'tostring-entry',
      text: 'toString reference',
      room: 'notes',
      created: new Date().toISOString()
    }
  ]));

  w.Mopapa.store.load();
  w.Mopapa.roomById = function () { return null; };

  const constructorResult = w.Mopapa.search.find('constructor');
  const toStringResult = w.Mopapa.search.find('toString');

  assert.strictEqual(constructorResult.total, 1);
  assert.strictEqual(constructorResult.results[0].entry.id, 'constructor-entry');

  assert.strictEqual(toStringResult.total, 1);
  assert.strictEqual(toStringResult.results[0].entry.id, 'tostring-entry');
});


test('load drops null and array entries instead of crashing later', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        null,
        ['not', 'an', 'entry'],
        { id: 'a', text: 'valid entry', room: 'todo' }
      ]
    })
  });

  w.Mopapa.store.load();

  const entries = w.Mopapa.store.data().entries;

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].id, 'a');
  assert.strictEqual(entries[0].text, 'valid entry');
});

test('loading saved entries rejects malformed optional fields but keeps valid neighbours', function () {
  const malformedEntries = [
    { id: 'bad-when', text: 'Bad date', room: 'notes', when: 'not-a-date' },
    { id: 'bad-has-time', text: 'Bad time flag', room: 'notes', hasTime: 'yes' },
    { id: 'bad-done', text: 'Bad completion flag', room: 'notes', done: 1 },
    { id: 'bad-pinned', text: 'Bad pin flag', room: 'notes', pinned: 'true' },
    { id: 'bad-created', text: 'Bad creation date', room: 'notes', created: 'yesterday-ish' },
    { id: 'bad-tags', text: 'Bad tags', room: 'notes', tags: ['valid', 42] },
    { id: 'bad-amounts', text: 'Bad amounts', room: 'notes', amounts: ['not-a-number'] },
    { id: 'bad-amount', text: 'Bad amount', room: 'notes', amount: '12.50' },
    {
      id: 'bad-fact',
      text: 'Bad location fact',
      room: 'notes',
      fact: { attr: 'location', items: [], prep: 'in', where: 'kitchen', value: 'kitchen', plural: false }
    }
  ];

  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: 'valid-before', text: 'Valid memory before', room: 'notes' },
        ...malformedEntries,
        { id: 'valid-after', text: 'Valid memory after', room: 'notes' }
      ]
    })
  });

  w.Mopapa.store.load();

  const entries = w.Mopapa.store.data().entries;

  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].id, 'valid-before');
  assert.strictEqual(entries[1].id, 'valid-after');

  assert.strictEqual(w.Mopapa.store.data().rejectedEntries, 9);
  assert.strictEqual(w.Mopapa.store.data().recoveryCopySaved, true);

  const recoveryKeys = Object.keys(w.localStorage._).filter(function (key) {
    return key.indexOf('mopapa.v1.recovery.') === 0;
  });

  assert.strictEqual(recoveryKeys.length, 1);
});

test('reloading storage preserves valid saved entries', function () {
  const w = boot(stored([
    {
      id: 'keep-entry',
      text: 'Keep this memory',
      room: 'notes',
      created: new Date().toISOString()
    }
  ]));

  w.Mopapa.store.load();
  w.Mopapa.store.data().entries.push({
    id: 'temporary-entry',
    text: 'Not saved',
    room: 'notes'
  });

  w.Mopapa.store.load();

  const entries = w.Mopapa.store.data().entries;

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].id, 'keep-entry');
  assert.strictEqual(entries[0].text, 'Keep this memory');
});

test('loading after storage is cleared removes stale in-memory entries', function () {
  const w = boot(stored([
    {
      id: 'old-entry',
      text: 'Old memory',
      room: 'notes',
      created: new Date().toISOString()
    }
  ]));

  w.Mopapa.store.load();
  assert.strictEqual(w.Mopapa.store.data().entries.length, 1);

  delete w.localStorage._['mopapa.v1'];

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().entries.length, 0);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(w.Mopapa.store.data().ask.aliases)),
    []
  );
});

test('corrupt storage does not preserve stale in-memory entries', function () {
  const w = boot(stored([
    {
      id: 'old-entry',
      text: 'Old memory',
      room: 'notes',
      created: new Date().toISOString()
    }
  ]));

  w.Mopapa.store.load();
  w.localStorage._['mopapa.v1'] = '{invalid json';

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().entries.length, 0);
  assert.strictEqual(w.Mopapa.store.data().corrupt, true);

  assert.ok(
    Object.keys(w.localStorage._).some(function (key) {
      return key.indexOf('mopapa.v1.corrupt.') === 0;
    })
  );
});

test('loading duplicate saved IDs keeps only the first valid record', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: 'duplicate', text: 'Original memory', room: 'notes' },
        { id: 'duplicate', text: 'Conflicting memory', room: 'ideas' },
        { id: 'unique', text: 'Another memory', room: 'notes' }
      ]
    })
  });

  w.Mopapa.store.load();

  const entries = w.Mopapa.store.data().entries;

  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].text, 'Original memory');
  assert.strictEqual(entries[1].id, 'unique');
});

test('loading saved entries rejects text exceeding the 1000-character limit', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: 'too-long', text: 'x'.repeat(1001), room: 'notes' },
        { id: 'valid', text: 'Valid memory', room: 'notes' }
      ]
    })
  });

  w.Mopapa.store.load();

  const entries = w.Mopapa.store.data().entries;

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].id, 'valid');
});

test('loading saved entries rejects padded IDs and room names', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: ' padded ', text: 'Padded ID', room: 'notes' },
        { id: 'padded-room', text: 'Padded room', room: ' notes ' },
        { id: 'valid', text: 'Valid memory', room: 'notes' }
      ]
    })
  });

  w.Mopapa.store.load();

  const entries = w.Mopapa.store.data().entries;

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].id, 'valid');
});

test('loading saved entries handles prototype-like IDs safely', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: '__proto__', text: 'Prototype memory', room: 'notes' },
        { id: 'constructor', text: 'Constructor memory', room: 'notes' },
        { id: 'toString', text: 'String memory', room: 'notes' }
      ]
    })
  });

  w.Mopapa.store.load();

  const entries = w.Mopapa.store.data().entries;

  assert.strictEqual(entries.length, 3);
  assert.strictEqual(entries[0].id, '__proto__');
  assert.strictEqual(entries[1].id, 'constructor');
  assert.strictEqual(entries[2].id, 'toString');
});

test('loading saved entries rejects IDs and room names over their limits', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: 'i'.repeat(101), text: 'Long ID', room: 'notes' },
        { id: 'long-room', text: 'Long room', room: 'r'.repeat(51) },
        { id: 'valid', text: 'Valid memory', room: 'notes' }
      ]
    })
  });

  w.Mopapa.store.load();

  const entries = w.Mopapa.store.data().entries;

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].id, 'valid');
});

test('corrupt storage is backed up, not lost', function () {
  const w = boot({ 'mopapa.v1': '{"entries":[{"id":"a","text":"keep me"' });

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corrupt, true);
  assert.strictEqual(w.Mopapa.store.data().corruptCopySaved, true);

  assert.ok(Object.keys(w.localStorage._).some(function (k) {
    return k.indexOf('mopapa.v1.corrupt.') === 0;
  }));
});

test('corrupt storage reports when its recovery copy cannot be saved', function () {
  const w = boot({ 'mopapa.v1': '{broken json' });

  w.localStorage.failWrites = true;
  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corrupt, true);
  assert.strictEqual(w.Mopapa.store.data().corruptCopySaved, false);

  assert.strictEqual(
    w.Mopapa.store.recoveryCopies().length,
    0
  );
});

test('date-only entry strings are parsed as local calendar dates', function () {
  const w = boot({});
  const date = w.Mopapa.rules.dateForEntry('2026-11-03', false);

  assert.strictEqual(date.getFullYear(), 2026);
  assert.strictEqual(date.getMonth(), 10);
  assert.strictEqual(date.getDate(), 3);
  assert.strictEqual(date.getHours(), 0);
});

test('date-only entry parsing rejects impossible calendar dates', function () {
  const w = boot({});
  const date = w.Mopapa.rules.dateForEntry('2026-02-30', false);

  assert.strictEqual(Number.isNaN(date.getTime()), true);
});

test('date-only agenda entries retain their intended calendar day', function () {
  const w = boot({});
  const now = new Date(2026, 10, 2, 12, 0, 0, 0);

  w.localStorage.setItem('mopapa.v1', JSON.stringify({
    entries: [{
      id: 'calendar-day',
      text: 'Task due tomorrow',
      room: 'todo',
      when: '2026-11-03',
      hasTime: false,
      done: false
    }],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  }));

  w.Mopapa.store.load();

  const items = Array.from(w.Mopapa.agenda.getItems(now));

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].date.getFullYear(), 2026);
  assert.strictEqual(items[0].date.getMonth(), 10);
  assert.strictEqual(items[0].date.getDate(), 3);
  assert.strictEqual(items[0].label, 'Tomorrow');
});

test('direct task instructions are classified as to-dos', function () {
  const w = boot({});
  const now = new Date(2026, 9, 21, 10, 0);
  const text = 'Do my tax return by Friday';
  const parsed = w.Mopapa.rules.parse(text, now);
  const result = w.Mopapa.sorter.classify(text, parsed);

  assert.ok(parsed);
  assert.strictEqual(result.room, 'todo');
  assert.strictEqual(result.confident, true);
});

test('ordinary questions are not classified as direct task instructions', function () {
  const w = boot({});
  const text = 'What do you recommend about my tax return?';
  const result = w.Mopapa.sorter.classify(text, null);

  assert.notStrictEqual(result.room, 'todo');
});

test('polite direct task instructions are classified as to-dos', function () {
  const w = boot({});
  const text = 'Please complete the application by Friday';
  const parsed = w.Mopapa.rules.parse(
    text,
    new Date(2026, 9, 21, 10, 0)
  );
  const result = w.Mopapa.sorter.classify(text, parsed);

  assert.ok(parsed);
  assert.strictEqual(result.room, 'todo');
  assert.strictEqual(result.confident, true);
});

test('date-only saved entries use the calendar-date parser in Ask', function () {
  const w = boot({});
  const date = w.Mopapa.rules.dateForEntry('2026-11-03', false);

  assert.strictEqual(
    w.Mopapa.rules.describe(date, false),
    'Tuesday 3 November'
  );
});

test('date parser: tomorrow at 5pm', function () {
  const w = boot({});
  const r = w.Mopapa.rules.parse('call mum tomorrow at 5pm', new Date(2026, 9, 21, 10, 0));
  assert.ok(r && r.hasTime);
  assert.strictEqual(r.date.getDate(), 22);
  assert.strictEqual(r.date.getHours(), 17);
});

test('date parser does not guess AM or PM for a bare hour', function () {
  const w = boot({});
  const now = new Date(2026, 9, 21, 10, 0);

  const r = w.Mopapa.rules.parse('call mum tomorrow at 5', now);

  assert.ok(r);
  assert.strictEqual(r.hasTime, false);
  assert.strictEqual(r.date.getDate(), 22);
  assert.strictEqual(r.date.getHours(), 0);
});

test('date parser accepts an explicit 24-hour time', function () {
  const w = boot({});
  const r = w.Mopapa.rules.parse('call mum tomorrow at 17:00', new Date(2026, 9, 21, 10, 0));

  assert.ok(r && r.hasTime);
  assert.strictEqual(r.date.getDate(), 22);
  assert.strictEqual(r.date.getHours(), 17);
});


test('date parser interprets two-digit year 00 as 2000', function () {
  const w = boot({});
  const result = w.Mopapa.rules.parse(
    'task on 1/2/00',
    new Date(2026, 9, 21, 10, 0)
  );

  assert.ok(result);
  assert.strictEqual(result.date.getFullYear(), 2000);
  assert.strictEqual(result.date.getMonth(), 1);
  assert.strictEqual(result.date.getDate(), 1);
});

test('date parser interprets two-digit year 49 as 2049', function () {
  const w = boot({});
  const result = w.Mopapa.rules.parse(
    'task on 1/2/49',
    new Date(2026, 9, 21, 10, 0)
  );

  assert.ok(result);
  assert.strictEqual(result.date.getFullYear(), 2049);
  assert.strictEqual(result.date.getMonth(), 1);
  assert.strictEqual(result.date.getDate(), 1);
});

test('ask date-intent module distinguishes logged questions from scheduled questions', function () {
  const w = boot({});
  const intent = w.Mopapa.askParts.dateIntent;

  assert.strictEqual(intent.isLoggedQuestion('What did I save?'), true);
  assert.strictEqual(intent.isLoggedQuestion('What have I logged?'), true);
  assert.strictEqual(intent.isLoggedQuestion('What did I log on Monday?'), true);
  assert.strictEqual(intent.isLoggedQuestion('When is the dentist?'), false);

  assert.strictEqual(intent.isWhenQuestion('When is the dentist?'), true);
  assert.strictEqual(intent.isWhenQuestion('What time is the appointment?'), true);
  assert.strictEqual(intent.isWhenQuestion('What did I save yesterday?'), false);
  assert.strictEqual(intent.isWhenQuestion('What is next on my wishlist?'), false);
  assert.strictEqual(intent.isWhenQuestion('What is my next appointment?'), true);

  assert.strictEqual(intent.isScheduledDateQuestion('When is the dentist?'), true);
  assert.strictEqual(intent.isScheduledDateQuestion('What is due tomorrow?'), true);
  assert.strictEqual(intent.isScheduledDateQuestion('What did I log yesterday?'), false);
  assert.strictEqual(intent.isScheduledDateQuestion('Show me my saved notes'), false);
  assert.strictEqual(
    intent.isGeneralNextAppointmentQuestion('What is my next appointment?'),
    true
  );
  assert.strictEqual(
    intent.isGeneralNextAppointmentQuestion('When is my next dentist appointment?'),
    false
  );

  assert.strictEqual(
    intent.isOverdueTaskQuestion('Show me my overdue tasks'),
    true
  );
  assert.strictEqual(
    intent.isOverdueTaskQuestion('What are my tasks?'),
    false
  );
});

test('ask: historical event questions are treated as logged questions', function () {
  const w = boot({});

  const intent = w.Mopapa.askParts.dateIntent;

  assert.strictEqual(
    intent.isLoggedQuestion('What happened on 5 November?'),
    true
  );

  assert.strictEqual(
    intent.isLoggedQuestion('What took place on 5 November?'),
    true
  );

  assert.strictEqual(
    intent.isLoggedQuestion('What did I do on 5 November?'),
    true
  );
});

test('date-overview next appointment handler selects the earliest upcoming appointment', function () {
  const w = boot({});
  const dateOverview = w.Mopapa.askParts.dateOverview;

  const soon = new Date(Date.now() + 2 * 86400000).toISOString();
  const later = new Date(Date.now() + 5 * 86400000).toISOString();

  const entries = [
    {
      id: 'later',
      text: 'Hospital appointment',
      room: 'appointments',
      when: later,
      hasTime: false,
      done: false
    },
    {
      id: 'sooner',
      text: 'Dentist check-up',
      room: 'appointments',
      when: soon,
      hasTime: false,
      done: false
    }
  ];

  const result = dateOverview.answerNextAppointment(
    'What is my next appointment?',
    entries,
    function (a, b) {
      return new Date(a.when) - new Date(b.when);
    }
  );

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(result.sources[0].id, 'sooner');
  assert.ok(/Dentist check-up/.test(result.answer), result.answer);

  assert.strictEqual(
    dateOverview.answerNextAppointment(
      'What is my next dentist appointment?',
      entries,
      function (a, b) {
        return new Date(a.when) - new Date(b.when);
      }
    ),
    null
  );
});

test('date-overview overdue handler excludes completed and non-task entries', function () {
  const w = boot({});
  const dateOverview = w.Mopapa.askParts.dateOverview;
  const past = new Date(Date.now() - 4 * 86400000).toISOString();

  const entries = [
    {
      id: 'overdue',
      text: 'Renew insurance',
      room: 'todo',
      when: past,
      hasTime: false,
      done: false
    },
    {
      id: 'completed',
      text: 'Pay completed bill',
      room: 'todo',
      when: past,
      hasTime: false,
      done: true
    },

    {
      id: 'appointment',
      text: 'Old dentist appointment',
      room: 'appointments',
      when: past,
      hasTime: false,
      done: false
    },
    {
      id: 'invalid',
      text: 'Task with invalid date',
      room: 'todo',
      when: 'not-a-valid-date',
      hasTime: false,
      done: false
    }

  ];

  const result = dateOverview.answerOverdueTasks(
    'Show me my overdue tasks',
    entries,
    function (a, b) {
      return new Date(a.when) - new Date(b.when);
    }
  );

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(result.sources[0].id, 'overdue');
  assert.ok(/1 overdue task/.test(result.answer), result.answer);

  assert.strictEqual(
    dateOverview.answerOverdueTasks(
      'What are my tasks?',
      entries,
      function (a, b) {
        return new Date(a.when) - new Date(b.when);
      }
    ),
    null
  );
});

test('ask money-intent module distinguishes cost questions from date questions', function () {
  const w = boot({});
  const isCostQuestion = w.Mopapa.askParts.moneyIntent.isCostQuestion;

  assert.strictEqual(isCostQuestion('How much did the car cost?'), true);
  assert.strictEqual(isCostQuestion('What was the price?'), true);
  assert.strictEqual(isCostQuestion('How much did I spend in total?'), true);
  assert.strictEqual(isCostQuestion('When is the dentist?'), false);
  assert.strictEqual(isCostQuestion('What is my next appointment?'), false);
  assert.strictEqual(isCostQuestion('Did I pay the bill?'), false);
});

test('ask money format module formats pounds correctly', function () {
  const w = boot({});
  const formatMoney = w.Mopapa.askParts.moneyFormat.formatMoney;

  assert.strictEqual(typeof formatMoney, 'function');
  assert.strictEqual(formatMoney(0), '£0');
  assert.strictEqual(formatMoney(12), '£12');
  assert.strictEqual(formatMoney(12.5), '£12.50');
  assert.strictEqual(formatMoney(12.99), '£12.99');
  assert.strictEqual(formatMoney(1234.56), '£1,234.56');
});

test('ask money-answer module exposes its cost-answer function', function () {
  const w = boot({});

  assert.strictEqual(
    typeof w.Mopapa.askParts.moneyAnswer.answerCost,
    'function'
  );
});

test('ask date-filter module filters entries by logged and due dates', function () {
  const w = boot({});
  const loggedOn = w.Mopapa.askParts.dateFilter.loggedOn;

  const start = new Date(2026, 9, 21);
  const end = new Date(2026, 9, 22);

  const filter = {
    start: start,
    end: end,
    due: false
  };

  assert.strictEqual(
    loggedOn({ created: new Date(2026, 9, 21, 12).toISOString() }, filter),
    true
  );

  assert.strictEqual(
    loggedOn({ created: new Date(2026, 9, 22, 0).toISOString() }, filter),
    false
  );

  assert.strictEqual(
    loggedOn({ created: 'invalid date' }, filter),
    false
  );

  assert.strictEqual(loggedOn({}, null), true);

  const dueFilter = {
    start: start,
    end: end,
    due: true
  };

  assert.strictEqual(
    loggedOn({
      created: new Date(2026, 9, 21, 12).toISOString(),
      when: new Date(2026, 9, 21, 15).toISOString()
    }, dueFilter),
    true
  );

  assert.strictEqual(
    loggedOn({
      created: new Date(2026, 9, 21, 12).toISOString()
    }, dueFilter),
    false
  );
});

test('date parser accepts leap day in year 2000', function () {
  const w = boot({});
  const result = w.Mopapa.rules.parse(
    'task on 29/2/00',
    new Date(2026, 9, 21, 10, 0)
  );

  assert.ok(result);
  assert.strictEqual(result.date.getFullYear(), 2000);
  assert.strictEqual(result.date.getMonth(), 1);
  assert.strictEqual(result.date.getDate(), 29);
});

test('date parser preserves four-digit years', function () {
  const w = boot({});
  const result = w.Mopapa.rules.parse(
    'task on 1/2/2049',
    new Date(2026, 9, 21, 10, 0)
  );

  assert.ok(result);
  assert.strictEqual(result.date.getFullYear(), 2049);
  assert.strictEqual(result.date.getMonth(), 1);
  assert.strictEqual(result.date.getDate(), 1);
});

test('ask date-filter module handles explicit dates', function () {
  const w = boot({});
  const dateParts = w.Mopapa.askParts.dateFilter;
  const norm = w.Mopapa.askParts.text.norm;
  const extractTextDate = w.Mopapa.askParts.dateText.extractTextDate;
  const MONTH_NAMES = w.Mopapa.askParts.dateText.MONTH_NAMES;

  const isLoggedQuestion = function (q) {
    return /\bwhat did i save\b/.test(q);
  };

  const isScheduledDateQuestion = function (q) {
    return /\b(when|due|scheduled|appointment|reminder)\b/.test(q);
  };

  const now = new Date(2026, 9, 21, 12, 0, 0, 0);

  const result = dateParts.explicitDateFilter(
    'When is my dentist appointment on 5 November?',
    now,
    norm,
    extractTextDate,
    isLoggedQuestion,
    isScheduledDateQuestion,
    MONTH_NAMES
  );

  assert.ok(result);
  assert.strictEqual(result.label, '5 November 2026');
  assert.strictEqual(result.start.getFullYear(), 2026);
  assert.strictEqual(result.start.getMonth(), 10);
  assert.strictEqual(result.start.getDate(), 5);
  assert.strictEqual(result.due, true);
  assert.strictEqual(result.explicit, true);

  assert.strictEqual(
    dateParts.explicitDateFilter(
      'When is my dentist appointment?',
      now,
      norm,
      extractTextDate,
      isLoggedQuestion,
      isScheduledDateQuestion,
      MONTH_NAMES
    ),
    null
  );

  const historical = dateParts.explicitDateFilter(
    'What happened on 5 November?',
    now,
    norm,
    w.Mopapa.askParts.dateText.extractTextDate,
    w.Mopapa.askParts.dateIntent.isLoggedQuestion,
    w.Mopapa.askParts.dateIntent.isScheduledDateQuestion,
    MONTH_NAMES
  );

  assert.ok(historical);
  assert.strictEqual(historical.label, '5 November 2025');
  assert.strictEqual(historical.logged, true);
  assert.strictEqual(historical.due, false);

  const upcoming = dateParts.explicitDateFilter(
    'When is my dentist appointment on 5 November?',
    new Date(2026, 11, 1, 12, 0, 0, 0),
    norm,
    extractTextDate,
    w.Mopapa.askParts.dateIntent.isLoggedQuestion,
    w.Mopapa.askParts.dateIntent.isScheduledDateQuestion,
    MONTH_NAMES
  );

  assert.ok(upcoming);
  assert.strictEqual(upcoming.label, '5 November 2027');
  assert.strictEqual(upcoming.due, true);
});

test('ask date-filter module calculates date ranges', function () {
  const w = boot({});
  const filter = w.Mopapa.askParts.dateFilter.dateFilter;
  const norm = w.Mopapa.askParts.text.norm;
  const isScheduledDateQuestion = function (q) {
    return /\b(when|due|scheduled|appointment|reminder)\b/.test(q);
  };
  const now = new Date(2026, 9, 21, 12, 0, 0, 0);

  const tomorrow = filter(
    'What is due tomorrow?',
    now,
    norm,
    isScheduledDateQuestion
  );

  assert.ok(tomorrow);
  assert.strictEqual(tomorrow.label, 'tomorrow');
  assert.strictEqual(tomorrow.due, true);
  assert.strictEqual(tomorrow.start.getDate(), 22);
  assert.strictEqual(tomorrow.start.getMonth(), 9);

  const lastWeek = filter(
    'What did I save last week?',
    now,
    norm,
    isScheduledDateQuestion
  );

  assert.ok(lastWeek);
  assert.strictEqual(lastWeek.label, 'last week');
  assert.strictEqual(lastWeek.start.getDay(), 1);
  assert.strictEqual(lastWeek.end - lastWeek.start, 7 * 24 * 60 * 60 * 1000);

  assert.strictEqual(
    filter('Tell me about my car', now, norm, isScheduledDateQuestion),
    null
  );
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

test('date parser interprets two-digit year 01 as 2001', function () {
  const w = boot({});
  const result = w.Mopapa.rules.parse(
    'task on 1/2/01',
    new Date(2026, 9, 21, 10, 0)
  );

  assert.ok(result);
  assert.strictEqual(result.date.getFullYear(), 2001);
  assert.strictEqual(result.date.getMonth(), 1);
  assert.strictEqual(result.date.getDate(), 1);
});

test('date parser interprets two-digit year 50 as 1950', function () {
  const w = boot({});
  const result = w.Mopapa.rules.parse(
    'task on 1/2/50',
    new Date(2026, 9, 21, 10, 0)
  );

  assert.ok(result);
  assert.strictEqual(result.date.getFullYear(), 1950);
  assert.strictEqual(result.date.getMonth(), 1);
  assert.strictEqual(result.date.getDate(), 1);
});

test('date parser rejects leap day in year 2001', function () {
  const w = boot({});
  const result = w.Mopapa.rules.parse(
    'task on 29/2/01',
    new Date(2026, 9, 21, 10, 0)
  );

  assert.strictEqual(result, null);
});

test('ask date-text module parses valid dates and rejects invalid dates', function () {
  const w = boot({});
  const dates = w.Mopapa.askParts.dateText;

  const dayFirst = dates.extractTextDate('Dentist appointment on 5 November');
  assert.ok(dayFirst);
  assert.strictEqual(dayFirst.day, 5);
  assert.strictEqual(dayFirst.month, 10);

  const monthFirst = dates.extractTextDate('Appointment on May 5, 2027');
  assert.ok(monthFirst);
  assert.strictEqual(monthFirst.day, 5);
  assert.strictEqual(monthFirst.month, 4);
  assert.strictEqual(monthFirst.year, 2027);

  const numeric = dates.extractTextDate('Appointment on 05/11/2026');
  assert.ok(numeric);
  assert.strictEqual(numeric.day, 5);
  assert.strictEqual(numeric.month, 10);
  assert.strictEqual(numeric.year, 2026);

  assert.strictEqual(dates.extractTextDate('Appointment on 31 February'), null);
  assert.strictEqual(dates.extractTextDate('No date mentioned'), null);

  const filter = {
    start: new Date(2026, 10, 1),
    end: new Date(2026, 11, 1),
    due: true
  };

  assert.strictEqual(
    dates.textDateMatchesFilter({ text: 'Dentist on 5 November' }, filter),
    true
  );

  assert.strictEqual(
    dates.textDateMatchesFilter({ text: 'Dentist on 5 May' }, filter),
    false
  );
});

test('date parser interprets two-digit year 99 as 1999', function () {
  const w = boot({});
  const result = w.Mopapa.rules.parse(
    'task on 1/2/99',
    new Date(2026, 9, 21, 10, 0)
  );

  assert.ok(result);
  assert.strictEqual(result.date.getFullYear(), 1999);
  assert.strictEqual(result.date.getMonth(), 1);
  assert.strictEqual(result.date.getDate(), 1);
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

test('question detection does not misroute statements into Ask', function () {
  const w = boot({});
  const statements = [
    'Do my taxes by Friday',
    'Have my passport renewed by June',
    'When I feel anxious I walk by the river',
    'How to bleed a radiator',
    'Where we stayed in Lisbon'
  ];

  statements.forEach(function (text) {
    assert.notStrictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Should not force Ask for: ' + text
    );
  });

  assert.strictEqual(
    w.Mopapa.rules.questionLevel('Is the boiler service due in March'),
    'sure'
  );

  assert.strictEqual(
    w.Mopapa.rules.questionLevel('Where are my keys'),
    'sure'
  );
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


test('moving a dated entry to a non-dated room removes it from the agenda', function () {
  const future = new Date(Date.now() + 2 * 86400000).toISOString();

  const w = boot(stored([
    {
      id: 'a',
      text: 'Dentist appointment',
      room: 'appointments',
      when: future,
      hasTime: true,
      done: false,
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.agenda.getItems().length, 1);
  assert.strictEqual(w.Mopapa.entries.move('a', 'notes'), true);

  const entry = w.Mopapa.entries.byRoom('notes')[0];

  assert.strictEqual(entry.room, 'notes');
  assert.strictEqual(entry.when, null);
  assert.strictEqual(entry.hasTime, false);
  assert.strictEqual(w.Mopapa.agenda.getItems().length, 0);
});


test('moving an entry to an unknown room is rejected without changing it', function () {
  const w = boot(stored([
    {
      id: 'a',
      text: 'Dentist appointment',
      room: 'appointments',
      when: new Date(Date.now() + 2 * 86400000).toISOString(),
      hasTime: true,
      done: false,
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const before = Object.assign({}, w.Mopapa.entries.byRoom('appointments')[0]);

  assert.strictEqual(w.Mopapa.entries.move('a', 'missing-room'), false);

  const after = w.Mopapa.entries.byRoom('appointments')[0];

  assert.strictEqual(after.room, before.room);
  assert.strictEqual(after.when, before.when);
  assert.strictEqual(after.hasTime, before.hasTime);
});


test('failed move restores the original date and time settings', function () {
  const future = new Date(Date.now() + 2 * 86400000).toISOString();

  const w = boot(stored([
    {
      id: 'a',
      text: 'Dentist appointment',
      room: 'appointments',
      when: future,
      hasTime: true,
      done: false,
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();
  w.localStorage.failWrites = true;

  assert.strictEqual(w.Mopapa.entries.move('a', 'notes'), false);

  const entry = w.Mopapa.entries.byRoom('appointments')[0];

  assert.strictEqual(entry.room, 'appointments');
  assert.strictEqual(entry.when, future);
  assert.strictEqual(entry.hasTime, true);
  assert.strictEqual(w.Mopapa.agenda.getItems().length, 1);
});

test('tag cleaning handles prototype-like names and case-insensitive duplicates', function () {
  const w = boot(stored([
    {
      id: 'a',
      text: 'Tag test',
      room: 'notes',
      tags: [],
      created: new Date().toISOString()
    }
  ]));

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.entries.setTags('a', [
      'constructor',
      'toString',
      '__proto__',
      'CONSTRUCTOR',
      'TOSTRING',
      '__PROTO__'
    ]),
    true
  );

  assert.strictEqual(
    JSON.stringify(w.Mopapa.store.data().entries[0].tags),
    JSON.stringify(['constructor', 'toString', '__proto__'])
  );
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

test('custom room creation rejects non-string names', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  [null, 123, {}, ['Books']].forEach(function (name) {
    const result = w.Mopapa.customRooms.add(name, 'book');
    assert.strictEqual(result.ok, false);
  });

  assert.strictEqual(w.Mopapa.store.data().customRooms.length, 0);
});

test('custom room creation enforces the minimum after whitespace cleaning', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  assert.strictEqual(w.Mopapa.customRooms.add(' A ', 'book').ok, false);
  assert.strictEqual(w.Mopapa.customRooms.add('   ', 'book').ok, false);

  const valid = w.Mopapa.customRooms.add('AB', 'book');

  assert.strictEqual(valid.ok, true);
  assert.strictEqual(valid.room.name, 'AB');
});

test('custom room creation accepts 20 characters but rejects 21', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const valid = w.Mopapa.customRooms.add('A'.repeat(20), 'book');
  const invalid = w.Mopapa.customRooms.add('B'.repeat(21), 'book');

  assert.strictEqual(valid.ok, true);
  assert.strictEqual(valid.room.name.length, 20);
  assert.strictEqual(invalid.ok, false);
  assert.strictEqual(w.Mopapa.store.data().customRooms.length, 1);
});

test('custom room creation rejects case-insensitive built-in room duplicates', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.add('  NOTES  ', 'book');

  assert.strictEqual(result.ok, false);
  assert.strictEqual(w.Mopapa.store.data().customRooms.length, 0);
});

test('custom room creation rejects duplicate names after case and whitespace normalisation', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const first = w.Mopapa.customRooms.add('Reading List', 'book');
  const second = w.Mopapa.customRooms.add('  reading   list  ', 'star');

  assert.strictEqual(first.ok, true);
  assert.strictEqual(second.ok, false);
  assert.strictEqual(w.Mopapa.store.data().customRooms.length, 1);
  assert.strictEqual(w.Mopapa.store.data().customRooms[0].name, 'Reading List');
});

test('custom room creation falls back to a supported icon', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.add('Bookshelf', 'unknown-icon');

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.room.icon, 'book');
  assert.strictEqual(w.Mopapa.store.data().customRooms[0].icon, 'book');
});

test('custom room creation persists the normalised name', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.add('  Reading   Room  ', 'book');
  const saved = w.Mopapa.store.data().customRooms[0];

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.room.name, 'Reading Room');
  assert.strictEqual(saved.name, 'Reading Room');
});

test('custom room reload is idempotent after successful creation', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.add('Reading Room', 'book');

  assert.strictEqual(result.ok, true);

  w.Mopapa.customRooms.reload();
  w.Mopapa.customRooms.reload();

  const matches = w.Mopapa.rooms.filter(function (room) {
    return room.id === result.room.id;
  });

  assert.strictEqual(matches.length, 1);
});

test('custom room creation survives a fresh storage load', function () {
  const w = boot(stored());
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.add('Travel Plans', 'plane');

  assert.strictEqual(result.ok, true);

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const room = w.Mopapa.rooms.filter(function (item) {
    return item.id === result.room.id;
  })[0];

  assert.ok(room);
  assert.strictEqual(room.name, 'Travel Plans');
  assert.strictEqual(room.icon, 'plane');
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

test('backup interface supports export and restore without claiming a backup timestamp', function () {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  const main = fs.readFileSync(__dirname + '/../js/main.js', 'utf8');

  assert.ok(html.includes('id="btn-export"'));
  assert.ok(html.includes('id="btn-import"'));
  assert.ok(html.includes('id="file-import"'));
  assert.ok(html.includes('accept=".json,application/json"'));

  assert.ok(main.includes('M.store.exportJSON()'));
  assert.ok(main.includes('M.store.importJSON(file'));
  assert.ok(main.includes('Restoring this backup will replace all Mopapa data'));
  assert.ok(main.includes('The existing saved data has been kept.'));
  assert.ok(main.includes('Backup restored successfully.'));
  assert.ok(main.includes('file.size > 5 * 1024 * 1024'));
  assert.ok(!main.includes('mopapa.lastBackup'));
  assert.ok(main.includes('Backup download started. Check your Downloads folder before relying on it.'));
});

test('restore imports entries, room-learning data and Ask learning data', function () {
  const w = boot(stored([
    { id: 'old', text: 'Existing entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const backup = {
    entries: [
      { id: 'restored', text: 'Restored entry', room: 'notes' }
    ],
    learned: { example: 2 },
    customRooms: [{ id: 'custom_books', name: 'Books', icon: 'book' }],
    ask: {
      aliases: [['gp', 'doctor']],
      boosts: {},
      unanswered: [{ q: 'Who was that?', at: '2026-01-01' }]
    }
  };

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    { size: 100, content: JSON.stringify(backup) },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, true);
  assert.strictEqual(w.Mopapa.store.data().entries.length, 1);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'restored');
  assert.strictEqual(w.Mopapa.store.data().learned.example, 2);
  assert.strictEqual(w.Mopapa.store.data().customRooms.length, 1);
  assert.strictEqual(w.Mopapa.store.data().ask.aliases[0][0], 'gp');
  assert.strictEqual(w.Mopapa.store.data().ask.unanswered.length, 1);

  const saved = JSON.parse(w.localStorage._['mopapa.v1']);
  assert.strictEqual(saved.entries[0].id, 'restored');
});

test('restore rejects malformed JSON without changing existing data', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const before = w.localStorage._['mopapa.v1'];

  w.FileReader = function () {
    this.readAsText = function () {
      this.result = '{"entries":';
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    { size: 20 },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
  assert.strictEqual(w.localStorage._['mopapa.v1'], before);
});

test('restore rejects malformed optional entry fields without changing existing data', function () {
  const invalidEntries = [
    { id: 'bad-date', text: 'Bad date', room: 'notes', when: 'not-a-date' },
    { id: 'bad-time-flag', text: 'Bad time flag', room: 'notes', hasTime: 'yes' },
    { id: 'bad-done-flag', text: 'Bad done flag', room: 'notes', done: 1 },
    { id: 'bad-pinned-flag', text: 'Bad pinned flag', room: 'notes', pinned: 'true' },
    { id: 'bad-created', text: 'Bad created date', room: 'notes', created: 'not-a-date' },
    { id: 'bad-tags', text: 'Bad tags', room: 'notes', tags: 'home, work' },
    { id: 'too-many-tags', text: 'Too many tags', room: 'notes', tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] },
    { id: 'bad-amounts', text: 'Bad amounts', room: 'notes', amounts: ['not-money'] },
    { id: 'bad-amount', text: 'Bad amount', room: 'notes', amount: '12.50' },
    { id: 'bad-fact', text: 'Bad fact', room: 'notes', fact: { attr: 'location', items: ['keys'] } }
  ];

  invalidEntries.forEach(function (entry) {
    const w = boot(stored([
      { id: 'keep', text: 'Keep this entry', room: 'notes' }
    ]));

    w.Mopapa.store.load();
    const before = w.localStorage._['mopapa.v1'];

    w.FileReader = function () {
      this.readAsText = function (file) {
        this.result = file.content;
        this.onload();
      };
    };

    let result = null;

    w.Mopapa.store.importJSON(
      {
        size: 100,
        content: JSON.stringify({ entries: [entry] })
      },
      function (ok) {
        result = ok;
      }
    );

    assert.strictEqual(result, false, entry.id);
    assert.strictEqual(
      w.Mopapa.store.data().entries[0].id,
      'keep',
      entry.id
    );
    assert.strictEqual(
      w.localStorage._['mopapa.v1'],
      before,
      entry.id
    );
  });
});

test('restore continues to accept older entries without optional fields', function () {
  const w = boot(stored());

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 100,
      content: JSON.stringify({
        entries: [
          {
            id: 'legacy-entry',
            text: 'A note from an older backup',
            room: 'notes'
          }
        ]
      })
    },
    function (ok) {
      result = ok;
    }
  );

  assert.strictEqual(result, true);
  assert.strictEqual(
    w.Mopapa.store.data().entries[0].id,
    'legacy-entry'
  );
});

test('restore migrates legacy pound-string amounts before validation', function () {
  const w = boot(stored());

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 300,
      content: JSON.stringify({
        entries: [
          {
            id: 'legacy-import',
            text: 'Boiler repair £1,200.50',
            room: 'notes',
            amount: '£1,200.50',
            amounts: [1200.5],
            created: ago(1)
          }
        ],
        learned: {},
        customRooms: [],
        ask: { aliases: [], boosts: {}, unanswered: [] }
      })
    },
    function (ok) {
      result = ok;
    }
  );

  assert.strictEqual(result, true);

  const entry = w.Mopapa.store.data().entries[0];

  assert.strictEqual(entry.id, 'legacy-import');
  assert.strictEqual(entry.amount, 1200.5);
  assert.strictEqual(entry.text, 'Boiler repair £1,200.50');

  const saved = JSON.parse(w.localStorage._['mopapa.v1']);

  assert.strictEqual(saved.entries[0].amount, 1200.5);
});

test('restore accepts valid structured money and location facts', function () {
  const w = boot(stored());

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 300,
      content: JSON.stringify({
        entries: [
          {
            id: 'structured-entry',
            text: 'Keys are in the kitchen drawer and cost £12.50',
            room: 'notes',
            amount: 12.5,
            amounts: [12.5],
            fact: {
              attr: 'location',
              items: ['keys'],
              prep: 'in',
              where: 'the kitchen drawer',
              value: 'in the kitchen drawer',
              plural: false
            }
          }
        ]
      })
    },
    function (ok) {
      result = ok;
    }
  );

  assert.strictEqual(result, true);

  const entry = w.Mopapa.store.data().entries[0];

  assert.strictEqual(entry.amount, 12.5);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(entry.amounts)),
    [12.5]
  );
  assert.strictEqual(entry.fact.value, 'in the kitchen drawer');
});

test('restore rejects malformed top-level data without changing existing data', function () {
  const invalidBackups = [
    { entries: [], learned: [] },
    { entries: [], learned: null },
    { entries: [], customRooms: 'not-an-array' },
    []
  ];

  invalidBackups.forEach(function (backup) {
    const initial = stored([
      {
        id: 'keep-me',
        text: 'Existing entry',
        room: 'notes'
      }
    ]);

    const w = boot(initial);
    w.Mopapa.store.load();

    w.FileReader = function () {
      this.readAsText = function (file) {
        this.result = file.content;
        this.onload();
      };
    };

    const before = w.localStorage.getItem('mopapa.v1');
    let result = null;

    w.Mopapa.store.importJSON(
      {
        size: 300,
        content: JSON.stringify(backup)
      },
      function (ok) {
        result = ok;
      }
    );

    assert.strictEqual(result, false);
    assert.strictEqual(
      w.localStorage.getItem('mopapa.v1'),
      before
    );
    assert.strictEqual(
      w.Mopapa.store.data().entries[0].id,
      'keep-me'
    );
  });
});

test('restore rejects malformed entry records without changing existing data', function () {
  const invalidEntries = [
    [{ text: 'Missing ID', room: 'notes' }],
    [{ id: '', text: 'Missing ID', room: 'notes' }],
    [{ id: 'blank', text: '   ', room: 'notes' }],
    [{ id: ' padded ', text: 'Padded ID', room: 'notes' }],
    [{ id: 'missing-room', text: 'Entry without a room' }],
    [{ id: 'blank-room', text: 'Blank room', room: '   ' }],
    [{ id: 'padded-room', text: 'Padded room', room: ' notes ' }],
    [{ id: 'long-id-' + 'x'.repeat(100), text: 'Long ID', room: 'notes' }],
    [{ id: 'long-room', text: 'Long room', room: 'r'.repeat(51) }],
    [null],
    [['not-an-entry']]
  ];

  invalidEntries.forEach(function (entries) {
    const w = boot(stored([
      { id: 'keep', text: 'Keep this entry', room: 'notes' }
    ]));

    w.Mopapa.store.load();
    const before = w.localStorage._['mopapa.v1'];

    w.FileReader = function () {
      this.readAsText = function (file) {
        this.result = file.content;
        this.onload();
      };
    };

    let result = null;

    w.Mopapa.store.importJSON(
      { size: 100, content: JSON.stringify({ entries: entries }) },
      function (ok) { result = ok; }
    );

    assert.strictEqual(result, false);
    assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
    assert.strictEqual(w.localStorage._['mopapa.v1'], before);
  });
});

test('restore rejects duplicate entry IDs without changing existing data', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();
  const before = w.localStorage._['mopapa.v1'];

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 100,
      content: JSON.stringify({
        entries: [
          { id: 'duplicate', text: 'First entry', room: 'notes' },
          { id: 'duplicate', text: 'Second entry', room: 'todo' }
        ]
      })
    },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
  assert.strictEqual(w.localStorage._['mopapa.v1'], before);
});

test('restore handles prototype-like entry IDs safely', function () {
  const w = boot(stored());

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 100,
      content: JSON.stringify({
        entries: [
          { id: '__proto__', text: 'First entry', room: 'notes' },
          { id: 'constructor', text: 'Second entry', room: 'notes' }
        ]
      })
    },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, true);
  assert.strictEqual(w.Mopapa.store.data().entries.length, 2);
});

test('restore rejects entries exceeding the 1000-character text limit', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();
  const before = w.localStorage._['mopapa.v1'];

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 1200,
      content: JSON.stringify({
        entries: [
          { id: 'too-long', text: 'x'.repeat(1001), room: 'notes' }
        ]
      })
    },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
  assert.strictEqual(w.localStorage._['mopapa.v1'], before);
});

test('restore accepts an entry containing exactly 1000 characters', function () {
  const w = boot(stored());

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  const text = 'x'.repeat(1000);
  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 1200,
      content: JSON.stringify({
        entries: [
          { id: 'boundary', text: text, room: 'notes' }
        ]
      })
    },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, true);
  assert.strictEqual(w.Mopapa.store.data().entries[0].text.length, 1000);
});

test('restore handles file-reading errors without changing existing data', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();
  const before = w.localStorage._['mopapa.v1'];

  w.FileReader = function () {
    this.readAsText = function () {
      this.onerror();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    { size: 50 },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
  assert.strictEqual(w.localStorage._['mopapa.v1'], before);
});

test('restore handles FileReader construction failures', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();
  const before = w.localStorage._['mopapa.v1'];

  w.FileReader = function () {
    throw new Error('simulated FileReader construction failure');
  };

  let result = null;

  w.Mopapa.store.importJSON(
    { size: 50 },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
  assert.strictEqual(w.localStorage._['mopapa.v1'], before);
});

test('restore handles synchronous readAsText failures', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();
  const before = w.localStorage._['mopapa.v1'];

  w.FileReader = function () {
    this.readAsText = function () {
      throw new Error('simulated read failure');
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    { size: 50 },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
  assert.strictEqual(w.localStorage._['mopapa.v1'], before);
});

test('restore calls its callback only once when reading fails then succeeds', function () {
  const w = boot(stored());

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.onerror();
      this.result = file.content;
      this.onload();
    };
  };

  const results = [];

  w.Mopapa.store.importJSON(
    {
      size: 50,
      content: JSON.stringify({
        entries: [
          { id: 'after-error', text: 'Entry after error', room: 'notes' }
        ]
      })
    },
    function (ok) { results.push(ok); }
  );

  assert.deepStrictEqual(results, [false]);
  assert.strictEqual(w.Mopapa.store.data().entries.length, 0);
});

test('restore calls its callback only once when reading succeeds then throws', function () {
  const w = boot(stored());

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
      throw new Error('simulated error after load');
    };
  };

  const results = [];

  w.Mopapa.store.importJSON(
    {
      size: 50,
      content: JSON.stringify({
        entries: [
          { id: 'loaded', text: 'Loaded entry', room: 'notes' }
        ]
      })
    },
    function (ok) { results.push(ok); }
  );

  assert.deepStrictEqual(results, [true]);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'loaded');
});

test('restore ignores repeated load events after the first successful import', function () {
  const w = boot(stored());

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
      this.result = JSON.stringify({
        entries: [
          { id: 'second', text: 'Second entry', room: 'notes' }
        ]
      });
      this.onload();
    };
  };

  const results = [];

  w.Mopapa.store.importJSON(
    {
      size: 50,
      content: JSON.stringify({
        entries: [
          { id: 'first', text: 'First entry', room: 'notes' }
        ]
      })
    },
    function (ok) { results.push(ok); }
  );

  assert.deepStrictEqual(results, [true]);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'first');
});

test('restore accepts a valid empty backup', function () {
  const w = boot(stored([
    { id: 'old', text: 'Old entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 20,
      content: JSON.stringify({
        entries: [],
        learned: {},
        customRooms: [],
        ask: { aliases: [], boosts: {}, unanswered: [] }
      })
    },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, true);
  assert.strictEqual(w.Mopapa.store.data().entries.length, 0);

  const saved = JSON.parse(w.localStorage._['mopapa.v1']);
  assert.deepStrictEqual(saved.entries, []);
});

test('restore reloads valid custom rooms into the active room list', function () {
  const w = boot(stored());

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 100,
      content: JSON.stringify({
        entries: [],
        learned: {},
        customRooms: [
          { id: 'custom_books', name: 'Books', icon: 'book' }
        ],
        ask: { aliases: [], boosts: {}, unanswered: [] }
      })
    },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, true);

  w.Mopapa.customRooms.reload();

  const room = w.Mopapa.rooms.find(function (item) {
    return item.id === 'custom_books';
  });

  assert.ok(room);
  assert.strictEqual(room.name, 'Books');
  assert.strictEqual(room.icon, 'book');
});

test('custom room reload ignores malformed saved room records', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: [
        null,
        'not-a-room',
        { id: 'wrong-prefix', name: 'Invalid', icon: 'book' },
        { id: 'custom_badicon', name: 'Bad Icon', icon: 'unknown' },
        { id: 'custom_valid', name: 'Valid Room', icon: 'book' }
      ],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.reload();

  assert.strictEqual(
    w.Mopapa.rooms.some(function (room) {
      return room.id === 'custom_valid';
    }),
    true
  );

  assert.strictEqual(
    w.Mopapa.rooms.some(function (room) {
      return room.id === 'custom_badicon' || room.id === 'wrong-prefix';
    }),
    false
  );
});

test('entries referencing missing custom rooms are recovered into notes', function () {
  const w = boot(stored([{
    id: 'orphaned-entry',
    text: 'The spare key is in the kitchen drawer',
    room: 'custom_missing',
    created: new Date().toISOString()
  }]));

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const entry = w.Mopapa.store.data().entries[0];

  assert.strictEqual(entry.room, 'notes');
  assert.strictEqual(w.Mopapa.entries.byRoom('notes').length, 1);
  assert.strictEqual(w.Mopapa.store.save(), true);
});

test('store saves successfully when storage has not changed', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.Mopapa.store.load();

  w.Mopapa.store.data().entries[0].text = 'Updated memory';

  assert.strictEqual(w.Mopapa.store.save(), true);
  assert.strictEqual(w.Mopapa.store.saveError(), null);

  const saved = JSON.parse(w.localStorage.getItem('mopapa.v1'));

  assert.strictEqual(saved.entries[0].text, 'Updated memory');
});

test('store refuses to overwrite data changed by another tab', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.Mopapa.store.load();

  const newerData = JSON.stringify({
    entries: [{
      id: 'newer',
      text: 'Saved by another tab',
      room: 'notes'
    }],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  });

  w.localStorage.setItem('mopapa.v1', newerData);

  w.Mopapa.store.data().entries[0].text = 'Stale tab edit';

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'conflict');
  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    newerData
  );

  const saved = JSON.parse(w.localStorage.getItem('mopapa.v1'));

  assert.strictEqual(saved.entries[0].id, 'newer');
  assert.strictEqual(saved.entries[0].text, 'Saved by another tab');
});

test('store refuses to save when the original storage key disappears', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.Mopapa.store.load();

  w.localStorage.removeItem = function (key) {
    delete this._[key];
  };

  w.localStorage.removeItem('mopapa.v1');

  w.Mopapa.store.data().entries[0].text = 'Local edit';

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'conflict');
  assert.strictEqual(w.localStorage.getItem('mopapa.v1'), null);
});

test('store distinguishes storage failures from save conflicts', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.Mopapa.store.load();

  w.localStorage.failWrites = true;

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');
});

test('malformed saved rooms do not consume the custom-room limit', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: Array(10).fill(null),
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.add('Bookshelf', 'book');

  assert.strictEqual(result.ok, true);
  assert.ok(w.Mopapa.rooms.some(function (room) {
    return room.name === 'Bookshelf';
  }));
});

test('custom room reload rejects duplicate saved room IDs', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: [
        { id: 'custom_same', name: 'Books', icon: 'book' },
        { id: 'custom_same', name: 'Music', icon: 'music' }
      ],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.reload();

  const matches = w.Mopapa.rooms.filter(function (room) {
    return room.id === 'custom_same';
  });

  assert.strictEqual(matches.length, 1);
  assert.strictEqual(matches[0].name, 'Books');
});

test('duplicate saved room records do not consume the custom-room limit', function () {
  const duplicate = {
    id: 'custom_books',
    name: 'Books',
    icon: 'book'
  };

  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: Array(10).fill(duplicate),
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.add('Another room', 'music');

  assert.strictEqual(result.ok, true);
});

test('custom room reload enforces the maximum of ten valid rooms', function () {
  const rooms = [];

  for (let i = 1; i <= 11; i++) {
    rooms.push({
      id: 'custom_room' + i,
      name: 'Room ' + i,
      icon: 'book'
    });
  }

  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        {
          id: 'eleventh-room-entry',
          text: 'Memory in room eleven',
          room: 'custom_room11'
        }
      ],
      learned: {},
      customRooms: rooms,
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const customRooms = w.Mopapa.rooms.filter(function (room) {
    return room.id.indexOf('custom_') === 0;
  });

  assert.strictEqual(customRooms.length, 10);

  assert.strictEqual(
    customRooms.some(function (room) {
      return room.id === 'custom_room11';
    }),
    false
  );

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].room,
    'notes'
  );

  const result = w.Mopapa.customRooms.add('Another room', 'music');

  assert.strictEqual(result.ok, false);
});

test('custom room reload rejects duplicate names without regard to case', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: [
        { id: 'custom_books', name: 'Books', icon: 'book' },
        { id: 'custom_books2', name: 'BOOKS', icon: 'music' }
      ],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.reload();

  const matches = w.Mopapa.rooms.filter(function (room) {
    return room.id.indexOf('custom_') === 0;
  });

  assert.strictEqual(matches.length, 1);
  assert.strictEqual(matches[0].id, 'custom_books');
});

test('nine valid rooms plus an invalid record still allow one more room', function () {
  const rooms = [];

  for (let i = 1; i <= 9; i++) {
    rooms.push({
      id: 'custom_room' + i,
      name: 'Room ' + i,
      icon: 'book'
    });
  }

  rooms.push(null);

  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: rooms,
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.add('Room 10', 'music');

  assert.strictEqual(result.ok, true);
  assert.strictEqual(
    w.Mopapa.rooms.filter(function (room) {
      return room.id.indexOf('custom_') === 0;
    }).length,
    10
  );
});

test('custom room reload normalises surrounding and repeated name whitespace', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: [
        { id: 'custom_reading', name: '  Reading   Room  ', icon: 'book' }
      ],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.reload();

  const room = w.Mopapa.rooms.find(function (item) {
    return item.id === 'custom_reading';
  });

  assert.ok(room);
  assert.strictEqual(room.name, 'Reading Room');
});

test('custom-room limit still blocks an eleventh valid room', function () {
  const rooms = [];

  for (let i = 1; i <= 10; i++) {
    rooms.push({
      id: 'custom_room' + i,
      name: 'Room ' + i,
      icon: 'book'
    });
  }

  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: rooms,
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.add('Room 11', 'music');

  assert.strictEqual(result.ok, false);
  assert.strictEqual(
    w.Mopapa.rooms.filter(function (room) {
      return room.id.indexOf('custom_') === 0;
    }).length,
    10
  );
});

test('custom room reload rejects names shorter than two characters after normalisation', function () {
  const w = boot(stored());
  w.Mopapa.store.load();

  w.Mopapa.store.data().customRooms = [
    { id: 'custom_single', name: ' A ', icon: 'book' },
    { id: 'custom_spaces', name: '   ', icon: 'book' },
    { id: 'custom_valid', name: 'AB', icon: 'book' }
  ];

  w.Mopapa.customRooms.reload();

  const customRooms = w.Mopapa.rooms.filter(function (room) {
    return room.id.indexOf('custom_') === 0;
  });

  assert.strictEqual(customRooms.length, 1);
  assert.strictEqual(customRooms[0].id, 'custom_valid');
  assert.strictEqual(customRooms[0].name, 'AB');
});

test('custom room reload rejects names duplicated after whitespace normalisation', function () {
  const w = boot(stored());
  w.Mopapa.store.load();

  w.Mopapa.store.data().customRooms = [
    { id: 'custom_first', name: 'Reading List', icon: 'book' },
    { id: 'custom_second', name: '  Reading   List  ', icon: 'star' }
  ];

  w.Mopapa.customRooms.reload();

  const customRooms = w.Mopapa.rooms.filter(function (room) {
    return room.id.indexOf('custom_') === 0;
  });

  assert.strictEqual(customRooms.length, 1);
  assert.strictEqual(customRooms[0].id, 'custom_first');
});

test('custom room reload accepts a normalised name of exactly 20 characters', function () {
  const w = boot(stored());
  w.Mopapa.store.load();

  const name = 'A'.repeat(20);

  w.Mopapa.store.data().customRooms = [
    { id: 'custom_boundary', name: name, icon: 'book' }
  ];

  w.Mopapa.customRooms.reload();

  const room = w.Mopapa.rooms.filter(function (item) {
    return item.id === 'custom_boundary';
  })[0];

  assert.ok(room);
  assert.strictEqual(room.name, name);
});

test('custom room reload converts supported legacy emoji icons', function () {
  const w = boot(stored());
  w.Mopapa.store.load();

  w.Mopapa.store.data().customRooms = [
    { id: 'custom_legacy', name: 'Reading', icon: '📚' }
  ];

  w.Mopapa.customRooms.reload();

  const room = w.Mopapa.rooms.filter(function (item) {
    return item.id === 'custom_legacy';
  })[0];

  assert.ok(room);
  assert.strictEqual(room.icon, 'book');
});

test('custom room reload rejects names outside the permitted length', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: [
        { id: 'custom_short', name: 'A', icon: 'book' },
        { id: 'custom_long', name: 'R'.repeat(21), icon: 'music' }
      ],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.reload();

  assert.strictEqual(
    w.Mopapa.rooms.some(function (room) {
      return room.id === 'custom_short' || room.id === 'custom_long';
    }),
    false
  );
});

test('restore rejects JSON without an entries array', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const before = w.localStorage._['mopapa.v1'];

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    { size: 30, content: JSON.stringify({ entries: 'not-an-array' }) },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
  assert.strictEqual(w.localStorage._['mopapa.v1'], before);
});

test('restore rolls back in-memory data when local storage refuses the write', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const before = w.localStorage._['mopapa.v1'];

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  w.localStorage.failWrites = true;

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 50,
      content: JSON.stringify({
        entries: [
          { id: 'replacement', text: 'Replacement entry', room: 'notes' }
        ]
      })
    },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
  assert.strictEqual(w.localStorage._['mopapa.v1'], before);
});

test('restore rejects files larger than 5 MB before reading them', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  let readerCreated = false;
  let result = null;

  w.FileReader = function () {
    readerCreated = true;
  };

  w.Mopapa.store.importJSON(
    { size: 5 * 1024 * 1024 + 1 },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(readerCreated, false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
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


test('ask ranking module exposes its matching functions', function () {
  const w = boot({});
  const ranking = w.Mopapa.askParts.ranking;

  assert.strictEqual(typeof ranking.termStrength, 'function');
  assert.strictEqual(typeof ranking.rankedMatches, 'function');
});

test('ask facts keeps prototype-like location words', function () {
  const w = boot({});
  const facts = w.Mopapa.askParts.facts;

  assert.deepStrictEqual(
    Array.from(facts.whereStems({
      fact: { where: 'constructor' }
    })),
    ['constructor']
  );

  assert.deepStrictEqual(
    Array.from(facts.whereStems({
      fact: { where: 'the garage' }
    })),
    ['garag']
  );
});

test('ask facts module exposes structured answer functions', function () {
  const w = boot({});
  const facts = w.Mopapa.askParts.facts;

  assert.strictEqual(typeof facts.structuredWhere, 'function');
  assert.strictEqual(typeof facts.structuredItems, 'function');
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

test('Ask rebuilds a malformed saved location fact from its entry text', function () {
  const w = boot({});
  w.Mopapa.store.load();

  const facts = w.Mopapa.askParts.facts;
  const locations = facts.currentLocations([
    {
      id: 'damaged-fact',
      text: 'Keys are in the kitchen drawer',
      room: 'notes',
      created: new Date().toISOString(),
      fact: {
        attr: 'location',
        items: ['keys']
      }
    }
  ]);

  assert.strictEqual(locations.key.fact.value, 'in the kitchen drawer');
  assert.strictEqual(locations.key.fact.where, 'the kitchen drawer');
});

test('Ask ignores a malformed location fact when its text cannot recover it', function () {
  const w = boot({});
  w.Mopapa.store.load();

  const facts = w.Mopapa.askParts.facts;
  const locations = facts.currentLocations([
    {
      id: 'unrecoverable-fact',
      text: 'An ordinary note with no location',
      room: 'notes',
      created: new Date().toISOString(),
      fact: {
        attr: 'location',
        items: ['keys'],
        plural: false
      }
    }
  ]);

  assert.strictEqual(Object.keys(locations).length, 0);
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
    'The parcel is for a delivery',
    'The parcel is for the dentist',
    'The parcel is for work',
    'The parcel is for tomorrow'
  ].forEach(function (entry) {
    const r = askWith([
      { id: 'a', text: entry, room: 'notes', created: ago(1) }
    ], 'Who is the parcel for?');

    assert.ok(/I could not find who that is for/.test(r.answer), r.answer);
    assert.strictEqual(r.sources.length, 0);
  });
});

test('ask continues past a non-person for-phrase to find a recipient', function () {
  const cases = [
    {
      text: 'The parcel is for the appointment, but the gift is for Jasmine Smith',
      expected: 'Jasmine Smith'
    },
    {
      text: 'The parcel is for a delivery and the card is for jasmine',
      expected: 'jasmine'
    },
    {
      text: 'The parcel is for work, the flowers are for Alex-Jones',
      expected: 'Alex-Jones'
    },
    {
      text: 'The parcel is for the dentist, then for John at 5pm',
      expected: 'John'
    },
    {
      text: 'The parcel is for the appointment, then for Jasmine tomorrow',
      expected: 'Jasmine'
    },
    {
      text: 'The parcel is for a delivery intended for Morgan Smith',
      expected: 'Morgan Smith'
    },
    {
      text: 'The parcel is for the office, then for O’Neil',
      expected: 'O’Neil'
    },
    {
      text: 'The parcel is for home, then for Sam Taylor next Monday',
      expected: 'Sam Taylor'
    }
  ];

  cases.forEach(function (item, index) {
    const w = boot({});
    const people = w.Mopapa.askParts.people;

    assert.strictEqual(
      people.extractForPerson(item.text),
      item.expected,
      item.text
    );
  });
});

test('ask remains cautious when several entries identify different recipients', function () {
  const r = askWith([
    {
      id: 'recipient-one',
      text: 'The parcel is for Jasmine',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'recipient-two',
      text: 'The parcel is for Morgan',
      room: 'notes',
      created: ago(2)
    }
  ], 'Who is the parcel for?');

  assert.ok(
    /more than one possible recipient/i.test(r.answer),
    r.answer
  );

  assert.ok(r.sources.length >= 1);
});

test('recipient extraction handles punctuation, conjunctions and boundaries', function () {
  const w = boot({});
  const people = w.Mopapa.askParts.people;

  const cases = [
    ['The parcel is for O’Neil', 'O’Neil'],
    ['The parcel is for Alex-Jones', 'Alex-Jones'],
    ['The parcel is for Jasmine on Monday', 'Jasmine'],
    ['The parcel is for John at 5pm', 'John'],
    ['The parcel is for Jasmine and the card is for Morgan', 'Jasmine'],
    ['The parcel is for the appointment, then for Morgan Smith', 'Morgan Smith'],
    ['The parcel is for a delivery intended for Sam Taylor', 'Sam Taylor'],
    ['The parcel is for Jasmine and Morgan', null],
    ['The parcel is for Jasmine or Morgan', null],
    ['The parcel is for the dentist', null],
    ['', null]
  ];

  cases.forEach(function (item) {
    assert.strictEqual(
      people.extractForPerson(item[0]),
      item[1],
      item[0]
    );
  });

  assert.strictEqual(
    people.extractCalledPerson('The dentist is called O’Neil').name,
    'O’Neil'
  );
});

test('ask recognises the same recipient across multiple entries', function () {
  const r = askWith([
    {
      id: 'recipient-one',
      text: 'The parcel is for Jasmine Smith',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'recipient-two',
      text: 'The gift is for jasmine smith',
      room: 'notes',
      created: ago(2)
    }
  ], 'Who is the parcel for?');

  assert.ok(/for Jasmine Smith\./i.test(r.answer), r.answer);
  assert.ok(r.sources.length >= 1);
});

test('ask asks for clarification when recipients differ', function () {
  const r = askWith([
    {
      id: 'recipient-one',
      text: 'The parcel is for Jasmine',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'recipient-two',
      text: 'The parcel is for Morgan',
      room: 'notes',
      created: ago(2)
    }
  ], 'Who is the parcel for?');

  assert.ok(/more than one possible recipient/i.test(r.answer), r.answer);
});

test('ask does not invent a recipient for an ambiguous single entry', function () {
  const r = askWith([
    {
      id: 'ambiguous-recipient',
      text: 'The parcel is for Jasmine and Morgan',
      room: 'notes',
      created: ago(1)
    }
  ], 'Who is the parcel for?');

  assert.ok(/could not find who that is for/i.test(r.answer), r.answer);
  assert.strictEqual(r.sources.length, 0);
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

test('editing an entry recalculates its displayed amount and rolls back on save failure', function () {
  const w = boot(stored([
    {
      id: 'amount-edit',
      text: 'Car repair £50',
      room: 'notes',
      amount: 50,
      amounts: [50],
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  w.localStorage.failWrites = true;
  assert.strictEqual(
    w.Mopapa.entries.updateText('amount-edit', 'Car repair £70'),
    false
  );
  assert.strictEqual(w.Mopapa.store.data().entries[0].amount, 50);
  assert.strictEqual(w.Mopapa.store.data().entries[0].text, 'Car repair £50');

  w.localStorage.failWrites = false;
  assert.strictEqual(
    w.Mopapa.entries.updateText('amount-edit', 'Car repair £70'),
    true
  );

  const entry = w.Mopapa.store.data().entries[0];
  assert.strictEqual(entry.amount, 70);
  assert.deepStrictEqual(Array.from(entry.amounts), [70]);
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

test('ask: spending totals exclude sales, quotes and refunds', function () {
  const r = askWith([
    { id: 'spend', text: 'I spent £25 on car repairs', room: 'notes', created: ago(1) },
    { id: 'sale', text: 'Sold old car for £2,400', room: 'notes', created: ago(2) },
    { id: 'quote', text: 'Car repair quote £300', room: 'notes', created: ago(3) },
    { id: 'refund', text: 'Received refund £50 for car repairs', room: 'notes', created: ago(4) }
  ], 'How much did I spend on the car?');

  assert.ok(/£25\b/.test(r.answer), r.answer);
  assert.ok(!/£2,425\b/.test(r.answer), r.answer);
  assert.ok(/excluded 3 matching entries/i.test(r.answer), r.answer);
  assert.ok(r.sources.some(function (e) { return e.id === 'spend'; }));
  assert.ok(r.sources.some(function (e) { return e.id === 'sale'; }));
  assert.ok(r.sources.some(function (e) { return e.id === 'quote'; }));
  assert.ok(r.sources.some(function (e) { return e.id === 'refund'; }));
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

test('all local scripts exist and load in dependency order', function () {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  const scripts = Array.from(
    html.matchAll(/<script src="([^"]+)"><\/script>/g)
  ).map(function (match) {
    return match[1];
  });

  assert.ok(scripts.length > 0, 'The app must load local scripts');

  assert.strictEqual(
    new Set(scripts).size,
    scripts.length,
    'Local script paths must not be duplicated'
  );

  scripts.forEach(function (src) {
    assert.ok(
      fs.existsSync(__dirname + '/../' + src),
      src + ' must exist'
    );
  });

  const requiredOrder = [
    'js/store.js',
    'js/understand/rooms.js',
    'js/understand/rules.js',
    'js/understand/custom-rooms.js',
    'js/understand/sorter.js',
    'js/memory/entries.js',
    'js/ask/ask-text.js',
    'js/ask/ask.js',
    'js/ui/talk.js',
    'js/ui/room.js',
    'js/main.js'
  ];

  const positions = requiredOrder.map(function (src) {
    return scripts.indexOf(src);
  });

  positions.forEach(function (position, index) {
    assert.notStrictEqual(
      position,
      -1,
      requiredOrder[index] + ' must be loaded'
    );

    if (index > 0) {
      assert.ok(
        position > positions[index - 1],
        requiredOrder[index] + ' must load after ' +
          requiredOrder[index - 1]
      );
    }
  });
});

test('ask: general date questions ignore completed appointments', function () {
  const soon = new Date(Date.now() + 2 * 86400000).toISOString();
  const later = new Date(Date.now() + 5 * 86400000).toISOString();

  const result = askWith([
    {
      id: 'completed',
      text: 'Dentist check-up',
      room: 'appointments',
      when: soon,
      hasTime: false,
      done: true,
      created: ago(3)
    },
    {
      id: 'open',
      text: 'Dentist hygiene visit',
      room: 'appointments',
      when: later,
      hasTime: false,
      done: false,
      created: ago(2)
    }
  ], 'When is the dentist?');

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(result.sources[0].id, 'open');
  assert.ok(
    result.answer.includes('Dentist hygiene visit'),
    result.answer
  );
});

test('ask: general date questions ignore invalid saved dates', function () {
  const later = new Date(Date.now() + 5 * 86400000).toISOString();

  const result = askWith([
    {
      id: 'invalid',
      text: 'Dentist check-up',
      room: 'appointments',
      when: 'not-a-valid-date',
      hasTime: false,
      done: false,
      created: ago(3)
    },
    {
      id: 'open',
      text: 'Dentist hygiene visit',
      room: 'appointments',
      when: later,
      hasTime: false,
      done: false,
      created: ago(2)
    }
  ], 'When is the dentist?');

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(result.sources[0].id, 'open');
  assert.ok(
    result.answer.includes('Dentist hygiene visit'),
    result.answer
  );
  assert.ok(!/Invalid Date/i.test(result.answer), result.answer);
});

test('ask: next appointment ignores completed appointments', function () {
  const soon = new Date(Date.now() + 2 * 86400000).toISOString();
  const later = new Date(Date.now() + 5 * 86400000).toISOString();

  const entries = [
    {
      id: 'completed',
      text: 'Dentist check-up',
      room: 'appointments',
      when: soon,
      hasTime: false,
      done: true,
      created: ago(3)
    },
    {
      id: 'open',
      text: 'Dentist hygiene visit',
      room: 'appointments',
      when: later,
      hasTime: false,
      done: false,
      created: ago(2)
    }
  ];

  const result = askWith(entries, 'What is my next appointment?');

  assert.strictEqual(
    Array.from(result.sources, function (entry) {
      return entry.id;
    }).join(','),
    'open'
  );

  assert.ok(
    result.answer.includes('Dentist hygiene visit'),
    result.answer
  );
});

test('ask: next appointment reports no active appointment when all are completed', function () {
  const future = new Date(Date.now() + 2 * 86400000).toISOString();

  const result = askWith([
    {
      id: 'completed',
      text: 'Dentist check-up',
      room: 'appointments',
      when: future,
      hasTime: false,
      done: true,
      created: ago(3)
    }
  ], 'What is my next appointment?');

  assert.strictEqual(result.sources.length, 0);

  assert.ok(
    /could not find any upcoming appointments/i.test(result.answer),
    result.answer
  );
});


test('ask: next appointment ignores invalid saved dates', function () {
  const result = askWith([
    {
      id: 'invalid',
      text: 'Dentist appointment',
      room: 'appointments',
      when: 'not-a-valid-date',
      hasTime: false,
      done: false,
      created: ago(2)
    }
  ], 'What is my next appointment?');

  assert.strictEqual(result.sources.length, 0);

  assert.ok(
    /could not find any upcoming appointments/i.test(result.answer),
    result.answer
  );
});

test('ask: invalid scheduled dates are not reported as past dates', function () {
  const w = boot(stored([
    {
      id: 'invalid',
      text: 'Dentist check-up',
      room: 'appointments',
      when: new Date(Date.now() + 86400000).toISOString(),
      hasTime: false,
      done: false,
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  w.Mopapa.store.data().entries[0].when = 'not-a-valid-date';

  const result = w.Mopapa.ask.answer('When is the dentist?');

  assert.ok(
    !/date has already passed/i.test(result.answer),
    result.answer
  );

  assert.ok(
    /date I can read/i.test(result.answer),
    result.answer
  );
});

test('ask: future completed appointments are not reported as past dates', function () {
  const future = new Date(Date.now() + 5 * 86400000).toISOString();

  const result = askWith([
    {
      id: 'completed-future',
      text: 'Dentist check-up',
      room: 'appointments',
      when: future,
      hasTime: false,
      done: true,
      created: ago(2)
    }
  ], 'When is the dentist?');

  assert.ok(
    !/date has already passed/i.test(result.answer),
    result.answer
  );
});

test('ask: completed past appointments are not reported as past dates', function () {
  const past = new Date(Date.now() - 5 * 86400000).toISOString();

  const result = askWith([
    {
      id: 'completed-past-appointment',
      text: 'Dentist check-up',
      room: 'appointments',
      when: past,
      hasTime: false,
      done: true,
      created: ago(7)
    }
  ], 'When is the dentist?');

  assert.ok(
    !/date has already passed/i.test(result.answer),
    result.answer
  );

  assert.strictEqual(
    result.sources[0].id,
    'completed-past-appointment'
  );
});

test('ask: explicit scheduled-date search excludes completed entries', function () {
  const appointmentDate = new Date(2026, 10, 5, 12).toISOString();

  const w = boot(stored([
    {
      id: 'completed-dentist',
      text: 'Dentist appointment',
      room: 'appointments',
      when: appointmentDate,
      hasTime: false,
      done: true,
      created: ago(7)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.ask.answer(
    'When is my dentist appointment on 5 November 2026?'
  );

  assert.strictEqual(result.sources.length, 0, result.answer);
});

test('ask: explicit scheduled-date search still finds open entries', function () {
  const appointmentDate = new Date(2026, 10, 5, 12).toISOString();

  const w = boot(stored([
    {
      id: 'open-dentist',
      text: 'Dentist appointment',
      room: 'appointments',
      when: appointmentDate,
      hasTime: false,
      done: false,
      created: ago(7)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.ask.answer(
    'When is my dentist appointment on 5 November 2026?'
  );

  assert.ok(
    result.sources.some(function (entry) {
      return entry.id === 'open-dentist';
    }),
    result.answer
  );
});

test('ask: completed entries remain searchable by subject', function () {
  const appointmentDate = new Date(2026, 10, 5, 12).toISOString();

  const w = boot(stored([
    {
      id: 'historical-dentist',
      text: 'Dentist appointment',
      room: 'appointments',
      when: appointmentDate,
      hasTime: false,
      done: true,
      created: ago(7)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.ask.answer(
    'What do you know about my dentist appointment?'
  );

  assert.ok(
    result.sources.some(function (entry) {
      return entry.id === 'historical-dentist';
    }),
    result.answer
  );
});

test('ask: completed entries are excluded from text-date fallback', function () {
  const result = askWith([
    {
      id: 'completed-text-date',
      text: 'Dentist check-up on 15 November 2026',
      room: 'appointments',
      when: '',
      hasTime: false,
      done: true,
      created: ago(2)
    }
  ], 'When is the dentist?');

  assert.ok(
    !/Dentist check-up is on 15 November 2026/i.test(result.answer),
    result.answer
  );

  assert.strictEqual(result.sources[0].id, 'completed-text-date');
});

test('ask: overdue task list excludes completed tasks', function () {
  const past = new Date(Date.now() - 4 * 86400000).toISOString();

  const entries = [
    {
      id: 'completed',
      text: 'Pay completed bill',
      room: 'todo',
      when: past,
      hasTime: false,
      done: true,
      created: ago(6)
    },
    {
      id: 'open',
      text: 'Renew overdue insurance',
      room: 'todo',
      when: past,
      hasTime: false,
      done: false,
      created: ago(5)
    }
  ];

  const result = askWith(entries, 'Show me my overdue tasks');


  assert.strictEqual(
    Array.from(result.sources, function (entry) {
      return entry.id;
    }).join(','),
    'open'
  );

  assert.ok(/1 overdue task/.test(result.answer), result.answer);

  const allCompleted = askWith([
    {
      id: 'completed',
      text: 'Pay completed bill',
      room: 'todo',
      when: past,
      hasTime: false,
      done: true,
      created: ago(6)
    }
  ], 'Show me my overdue tasks');

  assert.strictEqual(allCompleted.sources.length, 0);

  assert.ok(
    /could not find any overdue tasks/i.test(allCompleted.answer),
    allCompleted.answer
  );
});


test('agenda UI guards entries whose room is unavailable', function () {
  const agendaUI = fs.readFileSync(
    __dirname + '/../js/ui/agenda.js',
    'utf8'
  );

  assert.ok(
    agendaUI.includes('var entryRoom = Mopapa.roomById(entry.room);')
  );

  assert.ok(
    agendaUI.includes('if (entryRoom && entryRoom.dated)')
  );
});


test('learning: fractional source counts are discarded after flooring', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      ask: {
        boosts: {
          test: {
            fraction: 0.5,
            valid: 2.8
          }
        }
      }
    })
  });

  w.Mopapa.store.load();

  const boosts = w.Mopapa.store.data().ask.boosts;

  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(boosts.test, 'fraction'),
    false
  );
  assert.strictEqual(boosts.test.valid, 2);
});


test('load rejects array-shaped learned data', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: ['invalid', 'array'],
      customRooms: [],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  });

  w.Mopapa.store.load();

  assert.strictEqual(
    Array.isArray(w.Mopapa.store.data().learned),
    false
  );

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(w.Mopapa.store.data().learned)),
    {}
  );
});

test('learning: invalid aliases are discarded during cleanup', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      ask: {
        aliases: [
          ['', 'doctor'],
          ['gp', ''],
          ['two words', 'doctor'],
          ['same', 'SAME'],
          ['gp', 'doctor']
        ]
      }
    })
  });

  w.Mopapa.store.load();

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(w.Mopapa.store.data().ask.aliases)),
    [['gp', 'doctor']]
  );
});

test('learning: reversed duplicate aliases are stored only once', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      ask: {
        aliases: [
          ['gp', 'doctor'],
          ['doctor', 'gp']
        ]
      }
    })
  });

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.store.data().ask.aliases.length,
    1
  );
});

test('learning: empty and duplicate unanswered questions are discarded', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      ask: {
        unanswered: [
          { q: '  ' },
          { q: 'Where are my keys?' },
          { q: ' where are my keys? ' },
          { q: 'Where is my wallet?' }
        ]
      }
    })
  });

  w.Mopapa.store.load();

  const unanswered = w.Mopapa.store.data().ask.unanswered;

  assert.strictEqual(unanswered.length, 2);
  assert.strictEqual(unanswered[0].q, 'Where are my keys?');
  assert.strictEqual(unanswered[1].q, 'Where is my wallet?');
});

test('learning: malformed boost buckets are discarded', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      ask: {
        boosts: {
          broken: 5,
          array: ['invalid'],
          empty: {},
          valid: { 'entry-1': 3 }
        }
      }
    })
  });

  w.Mopapa.store.load();

  const boosts = w.Mopapa.store.data().ask.boosts;

  assert.strictEqual(Object.prototype.hasOwnProperty.call(boosts, 'broken'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(boosts, 'array'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(boosts, 'empty'), false);
  assert.strictEqual(boosts.valid['entry-1'], 3);
});

test('learning: invalid unanswered records do not consume the record limit', function () {
  const unanswered = [];

  for (let i = 0; i < 35; i++) {
    unanswered.push({ q: '' });
  }

  for (let i = 0; i < 35; i++) {
    unanswered.push({ q: 'Question ' + i });
  }

  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      ask: { unanswered: unanswered }
    })
  });

  w.Mopapa.store.load();

  const saved = w.Mopapa.store.data().ask.unanswered;

  assert.strictEqual(saved.length, 30);
  assert.strictEqual(saved[0].q, 'Question 0');
  assert.strictEqual(saved[29].q, 'Question 29');
});


test('learning: imported source feedback rejects invalid counts', function () {
  const w = boot({ 'mopapa.v1': JSON.stringify({
    entries: [],
    learned: {},
    customRooms: [],
    ask: {
      aliases: [],
      boosts: {
        valid: {
          positive: 4,
          zero: 0,
          negative: -2,
          text: 'invalid',
          excessive: 5000000
        },
        broken: 5
      },
      unanswered: []
    }
  }) });

  w.Mopapa.store.load();

  const boosts = w.Mopapa.store.data().ask.boosts;

  assert.strictEqual(boosts.valid.positive, 4);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(boosts.valid, 'zero'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(boosts.valid, 'negative'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(boosts.valid, 'text'), false);
  assert.strictEqual(boosts.valid.excessive, 1000);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(boosts, 'broken'), false);
});

test('learning: source feedback uses safe dictionaries for prototype-like IDs', function () {
  const w = boot();

  const ask = w.Mopapa.store.data().ask;
  ask.boosts = Object.create(null);
  ask.boosts.test = Object.create(null);
  ask.boosts.test.constructor = 2;
  ask.boosts.test.toString = 3;

  assert.strictEqual(
    Object.getPrototypeOf(ask.boosts),
    null
  );

  assert.strictEqual(
    Object.getPrototypeOf(ask.boosts.test),
    null
  );

  assert.strictEqual(ask.boosts.test.constructor, 2);
  assert.strictEqual(ask.boosts.test.toString, 3);
});

test('learning: confirming a source records feedback', function () {
  const w = boot(stored([
    {
      id: 'garage-entry',
      text: 'Spare keys in the garage',
      room: 'notes',
      created: new Date().toISOString()
    }
  ]));

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.ask.confirmSource('Where are the spare keys?', 'garage-entry'),
    true
  );

  const boosts = w.Mopapa.store.data().ask.boosts;
  const signatures = Object.keys(boosts);

  assert.strictEqual(signatures.length, 1);
  assert.strictEqual(boosts[signatures[0]]['garage-entry'], 1);
});

test('learning: confirming the same source increments its count', function () {
  const w = boot();
  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.ask.confirmSource('Where are my keys?', 'key-entry'), true);
  assert.strictEqual(w.Mopapa.ask.confirmSource('Where are my keys?', 'key-entry'), true);

  const boosts = w.Mopapa.store.data().ask.boosts;
  const sig = Object.keys(boosts)[0];

  assert.strictEqual(boosts[sig]['key-entry'], 2);
});

test('learning: invalid source confirmation is rejected', function () {
  const w = boot();
  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.ask.confirmSource('Where are my keys?', ''), false);
  assert.strictEqual(w.Mopapa.ask.confirmSource('Where are my keys?', null), false);
  assert.strictEqual(w.Mopapa.ask.confirmSource('Where are my keys?', 123), false);

  assert.strictEqual(
    Object.keys(w.Mopapa.store.data().ask.boosts).length,
    0
  );
});

test('learning: failed source confirmation rolls back feedback', function () {
  const w = boot();
  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.ask.confirmSource('Where are my keys?', 'key-entry'), true);

  const before = JSON.stringify(w.Mopapa.store.data().ask.boosts);
  w.localStorage.failWrites = true;

  assert.strictEqual(w.Mopapa.ask.confirmSource('Where are my keys?', 'key-entry'), false);
  assert.strictEqual(
    JSON.stringify(w.Mopapa.store.data().ask.boosts),
    before
  );

  assert.strictEqual(
    Object.getPrototypeOf(w.Mopapa.store.data().ask.boosts),
    null
  );
});

test('learning: clearing source feedback removes all boosts', function () {
  const w = boot();
  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.ask.confirmSource('Where are my keys?', 'key-entry'), true);
  assert.strictEqual(w.Mopapa.ask.clearConfirmed(), true);

  assert.strictEqual(
    Object.keys(w.Mopapa.store.data().ask.boosts).length,
    0
  );
});

test('learning: failed clearing restores source feedback', function () {
  const w = boot();
  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.ask.confirmSource('Where are my keys?', 'key-entry'), true);

  const before = JSON.stringify(w.Mopapa.store.data().ask.boosts);
  w.localStorage.failWrites = true;

  assert.strictEqual(w.Mopapa.ask.clearConfirmed(), false);
  assert.strictEqual(
    JSON.stringify(w.Mopapa.store.data().ask.boosts),
    before
  );
});

test('learning: logging an unanswered question keeps it', function () {
  const w = boot();
  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.ask.logUnanswered('Where did I put my spare keys?'),
    true
  );

  const unanswered = w.Mopapa.store.data().ask.unanswered;

  assert.strictEqual(unanswered.length, 1);
  assert.strictEqual(unanswered[0].q, 'Where did I put my spare keys?');
  assert.ok(unanswered[0].at);
});

test('learning: failed unanswered-question logging rolls back', function () {
  const w = boot();
  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.ask.logUnanswered('Where are my keys?'), true);

  const before = JSON.stringify(w.Mopapa.store.data().ask.unanswered);
  w.localStorage.failWrites = true;

  assert.strictEqual(w.Mopapa.ask.logUnanswered('Where is my wallet?'), false);
  assert.strictEqual(
    JSON.stringify(w.Mopapa.store.data().ask.unanswered),
    before
  );
});

test('opening a saved entry targets and focuses that exact entry', function () {
  const roomUI = fs.readFileSync(
    __dirname + '/../js/ui/room.js',
    'utf8'
  );

  assert.ok(
    roomUI.includes('function open(id, entryId)')
  );

  assert.ok(
    roomUI.includes("li.id = 'mopapa-entry-' + e.id;")
  );

  assert.ok(
    roomUI.includes("var target = $('mopapa-entry-' + entryId);")
  );

  assert.ok(
    roomUI.includes("target.classList.add('entry-opened');")
  );

  assert.ok(
    roomUI.includes('target.focus();')
  );

  assert.ok(
    roomUI.includes('target.scrollIntoView({ block: \'center\' });')
  );
});


test('search, agenda and pinned Open buttons target the selected entry', function () {
  const files = [
    '../js/ui/search.js',
    '../js/ui/agenda.js',
    '../js/ui/keepsakes.js'
  ];

  files.forEach(function (path) {
    const source = fs.readFileSync(
      __dirname + '/' + path,
      'utf8'
    );

    assert.ok(
      source.includes('Mopapa.room.open(entry.room, entry.id)'),
      path + ' must open the selected entry, not just its room'
    );
  });
});

test('talk input protects Enter during IME composition', function () {
  const source = fs.readFileSync(
    __dirname + '/../js/ui/talk.js',
    'utf8'
  );

  assert.ok(
    source.includes("input.addEventListener('compositionstart'")
  );

  assert.ok(
    source.includes("input.addEventListener('compositionend'")
  );

  assert.ok(
    source.includes('!composing')
  );

  assert.ok(
    source.includes('!e.isComposing')
  );

  assert.ok(
    source.includes('e.keyCode !== 229')
  );
});


test('dialog exposes its message as its accessible name', function () {
  const source = fs.readFileSync(
    __dirname + '/../js/ui/dialog.js',
    'utf8'
  );

  assert.ok(
    source.includes("text.id = 'app-dialog-text';")
  );

  assert.ok(
    source.includes("dlg.setAttribute('aria-labelledby', 'app-dialog-text');")
  );
});


test('dialog only dismisses from clicks outside its visible bounds', function () {
  const source = fs.readFileSync(
    __dirname + '/../js/ui/dialog.js',
    'utf8'
  );

  assert.ok(
    source.includes('var rect = dlg.getBoundingClientRect();')
  );

  assert.ok(
    source.includes('e.clientX < rect.left')
  );

  assert.ok(
    source.includes('e.clientX > rect.right')
  );

  assert.ok(
    source.includes('e.clientY < rect.top')
  );

  assert.ok(
    source.includes('e.clientY > rect.bottom')
  );

  assert.ok(
    source.includes('if (outside)')
  );
});

test('custom room rename preserves its ID and saved entries', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: 'entry-1', text: 'My book list', room: 'custom_books' }
      ],
      customRooms: [
        { id: 'custom_books', name: 'Books', icon: 'book' }
      ]
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.rename('custom_books', 'Reading');

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.room.id, 'custom_books');
  assert.strictEqual(result.room.name, 'Reading');
  assert.strictEqual(w.Mopapa.store.data().entries[0].room, 'custom_books');
  assert.strictEqual(w.Mopapa.roomById('custom_books').name, 'Reading');
});


test('custom room rename rejects duplicate and invalid names', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      customRooms: [
        { id: 'custom_books', name: 'Books', icon: 'book' }
      ]
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  assert.strictEqual(
    w.Mopapa.customRooms.rename('custom_books', 'Notes').ok,
    false
  );

  assert.strictEqual(
    w.Mopapa.customRooms.rename('custom_books', 'X').ok,
    false
  );

  assert.strictEqual(
    w.Mopapa.store.data().customRooms[0].name,
    'Books'
  );
});


test('custom room rename rolls back when storage fails', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      customRooms: [
        { id: 'custom_books', name: 'Books', icon: 'book' }
      ]
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();
  w.localStorage.failWrites = true;

  const result = w.Mopapa.customRooms.rename('custom_books', 'Reading');

  assert.strictEqual(result.ok, false);
  assert.strictEqual(w.Mopapa.store.data().customRooms[0].name, 'Books');
  assert.strictEqual(w.Mopapa.roomById('custom_books').name, 'Books');
});


test('deleting a custom room moves its entries to Notes', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: 'entry-1', text: 'First saved item', room: 'custom_books' },
        { id: 'entry-2', text: 'Second saved item', room: 'custom_books' },
        { id: 'entry-3', text: 'Existing note', room: 'notes' }
      ],
      customRooms: [
        { id: 'custom_books', name: 'Books', icon: 'book' }
      ]
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.remove('custom_books');

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.moved, 2);
  assert.strictEqual(w.Mopapa.store.data().customRooms.length, 0);
  assert.strictEqual(w.Mopapa.store.data().entries[0].room, 'notes');
  assert.strictEqual(w.Mopapa.store.data().entries[1].room, 'notes');
  assert.strictEqual(w.Mopapa.store.data().entries[2].room, 'notes');
  assert.strictEqual(w.Mopapa.roomById('custom_books').id, 'unsorted');
});


test('deleting a custom room rolls back when storage fails', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [
        { id: 'entry-1', text: 'Saved book', room: 'custom_books' }
      ],
      customRooms: [
        { id: 'custom_books', name: 'Books', icon: 'book' }
      ]
    })
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();
  w.localStorage.failWrites = true;

  const result = w.Mopapa.customRooms.remove('custom_books');

  assert.strictEqual(result.ok, false);
  assert.strictEqual(w.Mopapa.store.data().customRooms.length, 1);
  assert.strictEqual(w.Mopapa.store.data().entries[0].room, 'custom_books');
  assert.strictEqual(w.Mopapa.roomById('custom_books').name, 'Books');
});


test('built-in rooms cannot be renamed or deleted', function () {
  const w = boot();
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  assert.strictEqual(
    w.Mopapa.customRooms.rename('notes', 'Archive').ok,
    false
  );

  assert.strictEqual(
    w.Mopapa.customRooms.remove('notes').ok,
    false
  );

  assert.ok(w.Mopapa.roomById('notes'));
});


test('custom room rows expose separate rename and delete controls', function () {
  const source = fs.readFileSync(
    __dirname + '/../js/ui/room.js',
    'utf8'
  );

  assert.ok(source.includes("el('button', 'link', 'Rename')"));
  assert.ok(source.includes("el('button', 'link del', 'Delete')"));
  assert.ok(source.includes('Mopapa.customRooms.rename(r.id, name)'));
  assert.ok(source.includes('Mopapa.customRooms.remove(r.id)'));
  assert.ok(source.includes("entry.room === r.id"));
  assert.ok(source.includes("entry.room = 'notes'") === false);
});

test('question intent identifies location questions', function () {
  const w = boot();
  const intent = w.Mopapa.askParts.questionIntent;

  assert.strictEqual(intent.isLocationQuestion('Where are my keys?'), true);
  assert.strictEqual(intent.isLocationQuestion('Which room has my books?'), true);
  assert.strictEqual(intent.isLocationQuestion('What did I save?'), false);
  assert.strictEqual(intent.isLocationQuestion('When is the dentist?'), false);
});


test('question intent identifies direct memory questions', function () {
  const w = boot();
  const intent = w.Mopapa.askParts.questionIntent;

  assert.strictEqual(intent.isDirectQuestion('What did I save?'), true);
  assert.strictEqual(intent.isDirectQuestion('What have I recorded?'), true);
  assert.strictEqual(intent.isDirectQuestion('What do you remember about my car?'), true);
  assert.strictEqual(intent.isDirectQuestion('Where are my keys?'), false);
  assert.strictEqual(intent.isDirectQuestion('When is my appointment?'), false);
});


test('question intent identifies item-list questions', function () {
  const w = boot();
  const intent = w.Mopapa.askParts.questionIntent;

  assert.strictEqual(intent.isItemsQuestion('What items are in the garage?'), true);
  assert.strictEqual(intent.isItemsQuestion('Which things are inside the cupboard?'), true);
  assert.strictEqual(intent.isItemsQuestion('What did I save?'), false);
  assert.strictEqual(intent.isItemsQuestion('Where are my keys?'), false);
});

test('room intent identifies built-in room questions', function () {
  const w = boot();
  const intent = w.Mopapa.askParts.roomIntent;

  assert.strictEqual(intent.roomForQuestion('Show me my tasks'), 'todo');
  assert.strictEqual(intent.roomForQuestion('When is my dentist appointment?'), 'appointments');
  assert.strictEqual(intent.roomForQuestion('What is on my shopping list?'), 'wishlist');
  assert.strictEqual(intent.roomForQuestion('How have I been feeling?'), 'feelings');
  assert.strictEqual(intent.roomForQuestion('Show me my ideas'), 'ideas');
  assert.strictEqual(intent.roomForQuestion('What notes did I save?'), 'notes');
});


test('room intent returns null when no room is identified', function () {
  const w = boot();
  const intent = w.Mopapa.askParts.roomIntent;

  assert.strictEqual(intent.roomForQuestion('What is my car worth?'), null);
  assert.strictEqual(intent.roomForQuestion('Where are my keys?'), null);
});


test('room intent identifies custom rooms by their names', function () {
  const w = boot();
  const intent = w.Mopapa.askParts.roomIntent;

  w.Mopapa.rooms.push({
    id: 'custom_garden',
    name: 'Garden Projects'
  });

  assert.strictEqual(
    intent.roomForQuestion('Show me my garden projects'),
    'custom_garden'
  );
});


test('room intent exposes a separate room vocabulary list', function () {
  const w = boot();
  const intent = w.Mopapa.askParts.roomIntent;

  assert.ok(Array.isArray(intent.roomStems));
  assert.ok(intent.roomStems.includes('task'));
  assert.ok(intent.roomStems.includes('idea'));
  assert.ok(intent.roomStems.includes(w.Mopapa.askParts.text.stem('note')));
});

test('query terms remove ordinary stop words and room vocabulary', function () {
  const w = boot();
  const query = w.Mopapa.askParts.query;

  assert.deepStrictEqual(
    Array.from(query.queryTerms('Show me tasks about the garden tomorrow', 'todo')),
    ['garden']
  );
});


test('query terms preserve useful subject words', function () {
  const w = boot();
  const query = w.Mopapa.askParts.query;

  assert.deepStrictEqual(
    Array.from(query.queryTerms('Find my dentist appointment')),
    ['dentist']
  );
});


test('query terms preserve identifying numbers', function () {
  const w = boot();
  const query = w.Mopapa.askParts.query;

  assert.deepStrictEqual(
    Array.from(query.queryTerms('Where is flat 4?')),
    ['flat', '4']
  );

  assert.deepStrictEqual(
    Array.from(query.queryTerms('Bus 38')),
    ['bus', '38']
  );
});


test('query terms exclude custom room names from search terms', function () {
  const w = boot();
  const query = w.Mopapa.askParts.query;

  w.Mopapa.rooms.push({
    id: 'custom_garden',
    name: 'Garden Projects'
  });

  assert.deepStrictEqual(
    Array.from(query.queryTerms('Show me my garden projects', 'custom_garden')),
    []
  );
});

test('alias module exposes built-in aliases in both directions', function () {
  const w = boot();
  const aliases = w.Mopapa.askParts.aliases;
  const stem = w.Mopapa.askParts.text.stem;

  assert.ok(
    aliases.map[stem('gp')].includes(stem('doctor'))
  );

  assert.ok(
    aliases.map[stem('doctor')].includes(stem('gp'))
  );

  assert.ok(
    aliases.map[stem('dentist')].includes(stem('dental'))
  );
});


test('alias module normalises and adds custom aliases bidirectionally', function () {
  const w = boot();
  const aliases = w.Mopapa.askParts.aliases;
  const stem = w.Mopapa.askParts.text.stem;

  assert.strictEqual(aliases.addAlias('Couch', 'Sofa'), true);

  assert.ok(
    aliases.map[stem('couch')].includes(stem('sofa'))
  );

  assert.ok(
    aliases.map[stem('sofa')].includes(stem('couch'))
  );
});


test('resetting aliases restores built-ins and removes temporary aliases', function () {
  const w = boot();
  const aliases = w.Mopapa.askParts.aliases;
  const stem = w.Mopapa.askParts.text.stem;

  aliases.addAlias('couch', 'sofa');
  aliases.resetBuiltIns();

  assert.strictEqual(
    (aliases.map[stem('couch')] || []).includes(stem('sofa')),
    false
  );

  assert.ok(
    aliases.map[stem('gp')].includes(stem('doctor'))
  );
});

test('learning module exposes its complete public interface', function () {
  const w = boot();
  const learning = w.Mopapa.askParts.learning;

  [
    'learnedData',
    'applyLearned',
    'rebuildAliases',
    'teachAlias',
    'forgetAlias',
    'signatureOf',
    'confirmSource',
    'clearConfirmed',
    'confirmedBySig',
    'logUnanswered',
    'clearUnanswered',
    'learned'
  ].forEach(function (name) {
    assert.strictEqual(
      typeof learning[name],
      'function',
      name + ' must be exposed'
    );
  });
});


test('learning module creates stable question signatures', function () {
  const w = boot();
  const learning = w.Mopapa.askParts.learning;

  assert.strictEqual(
    learning.signatureOf('Where is my car?'),
    learning.signatureOf('Where is the car?')
  );

  assert.strictEqual(
    learning.signatureOf('Where is my car?'),
    learning.signatureOf('car where is my')
  );
});


test('learning module returns independent copies of saved summaries', function () {
  const w = boot(stored([], {}, {
    aliases: [['couch', 'sofa']],
    boosts: {},
    unanswered: [
      { q: 'Where are my keys?', at: '2026-01-01' }
    ]
  }));

  w.Mopapa.store.load();

  const first = w.Mopapa.askParts.learning.learned();

  first.aliases[0][0] = 'changed';
  first.unanswered[0].q = 'changed';

  const second = w.Mopapa.askParts.learning.learned();

  assert.strictEqual(second.aliases[0][0], 'couch');
  assert.strictEqual(
    second.unanswered[0].q,
    'Where are my keys?'
  );
});


test('results module exposes its answer handler', function () {
  const w = boot();

  assert.strictEqual(
    typeof w.Mopapa.askParts.results.answerMatches,
    'function'
  );
});


test('results module returns a clear empty-result response', function () {
  const w = boot();
  const results = w.Mopapa.askParts.results;

  const result = results.answerMatches('garden', [], {
    all: [],
    date: null,
    room: null,
    roomName: function () { return 'Notes'; },
    norm: function (q) { return q; },
    questionIntent: {
      isDirectQuestion: function () { return false; },
      isItemsQuestion: function () { return false; }
    },
    currentLocations: function () { return {}; },
    isStale: function () { return false; }
  });

  assert.strictEqual(result.missed, true);
  assert.deepStrictEqual(Array.from(result.sources), []);
  assert.ok(result.answer.includes('could not find anything'));
});


test('results module answers a direct question with one saved entry', function () {
  const w = boot();
  const entry = { id: 'direct-1', text: 'My passport is in the safe.' };

  const result = w.Mopapa.askParts.results.answerMatches(
    'What did I save?',
    [entry],
    {
      all: [entry],
      date: null,
      room: null,
      roomName: function () { return 'Notes'; },
      norm: function (q) { return q; },
      questionIntent: {
        isDirectQuestion: function () { return true; },
        isItemsQuestion: function () { return false; }
      },
      currentLocations: function () { return {}; },
      isStale: function () { return false; }
    }
  );

  assert.strictEqual(
    result.answer,
    'You saved this: My passport is in the safe.'
  );
  assert.strictEqual(result.sources[0].id, 'direct-1');
});


test('results module limits ordinary answers to five entries', function () {
  const w = boot();
  const entries = [];

  for (let i = 1; i <= 7; i++) {
    entries.push({
      id: 'entry-' + i,
      text: 'Saved item ' + i
    });
  }

  const result = w.Mopapa.askParts.results.answerMatches(
    'garden',
    entries,
    {
      all: entries,
      date: null,
      room: null,
      roomName: function () { return 'Notes'; },
      norm: function (q) { return q; },
      questionIntent: {
        isDirectQuestion: function () { return false; },
        isItemsQuestion: function () { return false; }
      },
      currentLocations: function () { return {}; },
      isStale: function () { return false; }
    }
  );

  assert.strictEqual(result.sources.length, 5);
  assert.ok(result.answer.includes('Showing the newest 5.'));
});


test('results module hides stale entries when newer entries exist', function () {
  const w = boot();
  const oldEntry = { id: 'old', text: 'Old address' };
  const newEntry = { id: 'new', text: 'New address' };

  const result = w.Mopapa.askParts.results.answerMatches(
    'address',
    [newEntry, oldEntry],
    {
      all: [newEntry, oldEntry],
      date: null,
      room: null,
      roomName: function () { return 'Notes'; },
      norm: function (q) { return q; },
      questionIntent: {
        isDirectQuestion: function () { return false; },
        isItemsQuestion: function () { return false; }
      },
      currentLocations: function () { return {}; },
      isStale: function (entry) {
        return entry.id === 'old';
      }
    }
  );

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(result.sources[0].id, 'new');
  assert.ok(result.answer.includes('hid 1 older entry'));
});

test('date-overview module exposes both answer handlers', function () {
  const w = boot();
  const overview = w.Mopapa.askParts.dateOverview;

  assert.strictEqual(typeof overview.answerNextAppointment, 'function');
  assert.strictEqual(typeof overview.answerOverdueTasks, 'function');
});


test('date-overview identifies the next upcoming appointment', function () {
  const w = boot();
  const overview = w.Mopapa.askParts.dateOverview;

  const entry = {
    id: 'next-appointment-test',
    text: 'Dentist appointment',
    room: 'appointments',
    done: false,
    when: '2099-06-15',
    hasTime: false
  };

  const result = overview.answerNextAppointment(
    'What is my next appointment?',
    [entry],
    function (a, b) {
      return new Date(a.when) - new Date(b.when);
    }
  );

  assert.ok(result);
  assert.ok(result.answer.includes('Dentist appointment'));
  assert.strictEqual(result.sources[0].id, 'next-appointment-test');
});


test('date-overview identifies overdue unfinished tasks', function () {
  const w = boot();
  const overview = w.Mopapa.askParts.dateOverview;

  const entry = {
    id: 'overdue-task-test',
    text: 'Renew car insurance',
    room: 'todo',
    done: false,
    when: '2000-01-01',
    hasTime: false
  };

  const result = overview.answerOverdueTasks(
    'Show my overdue tasks',
    [entry],
    function (a, b) {
      return new Date(a.when) - new Date(b.when);
    }
  );

  assert.ok(result);
  assert.ok(result.answer.includes('Renew car insurance'));
  assert.strictEqual(result.sources[0].id, 'overdue-task-test');
});


test('date-overview ignores unrelated questions', function () {
  const w = boot();
  const overview = w.Mopapa.askParts.dateOverview;

  assert.strictEqual(
    overview.answerNextAppointment('What did I save?', [], function () {
      return 0;
    }),
    null
  );

  assert.strictEqual(
    overview.answerOverdueTasks('Where are my keys?', [], function () {
      return 0;
    }),
    null
  );
});

test('date-answer module exposes its public function', function () {
  const w = boot();

  assert.strictEqual(
    typeof w.Mopapa.askParts.dateAnswer.answerWhen,
    'function'
  );
});


test('date-answer module ignores unrelated questions and empty matches', function () {
  const w = boot();
  const answerWhen = w.Mopapa.askParts.dateAnswer.answerWhen;

  const helpers = {
    isWhenQuestion: function () { return false; },
    sortByWhen: function () { return 0; },
    confirmedBySig: function () { return null; },
    extractTextDate: function () { return null; }
  };

  assert.strictEqual(
    answerWhen('What did I save?', [], 'test', helpers),
    null
  );

  assert.strictEqual(
    answerWhen('When is the dentist?', [], 'test', helpers),
    null
  );
});


test('date-answer module answers from a single readable text date', function () {
  const w = boot();
  const entry = {
    id: 'date-answer-test',
    text: 'Pay the council tax on Friday',
    done: false,
    when: null
  };

  const result = w.Mopapa.askParts.dateAnswer.answerWhen(
    'When do I pay council tax?',
    [entry],
    'council tax',
    {
      isWhenQuestion: function () { return true; },
      sortByWhen: function () { return 0; },
      confirmedBySig: function () { return null; },
      extractTextDate: function () {
        return { label: 'Friday' };
      }
    }
  );

  assert.strictEqual(
    result.answer,
    'You need to pay the council tax on Friday.'
  );

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(result.sources[0].id, 'date-answer-test');
});

test('location-answer module exposes its public function', function () {
  const w = boot();

  assert.strictEqual(
    typeof w.Mopapa.askParts.locationAnswer.answerLocation,
    'function'
  );
});


test('location-answer module answers a singular location question', function () {
  const w = boot();
  const entry = {
    id: 'keys-location',
    text: 'My spare key is in the kitchen drawer.'
  };

  const result = w.Mopapa.askParts.locationAnswer.answerLocation(
    'Where is my spare key?',
    [entry],
    true,
    w.Mopapa.askParts.text.norm
  );

  assert.strictEqual(result.answer, 'It is in the kitchen drawer.');
  assert.strictEqual(result.sources[0].id, 'keys-location');
});


test('location-answer module answers plural location questions', function () {
  const w = boot();
  const entry = {
    id: 'keys-location',
    text: 'My keys are in the kitchen drawer.'
  };

  const result = w.Mopapa.askParts.locationAnswer.answerLocation(
    'Where are my keys?',
    [entry],
    true,
    w.Mopapa.askParts.text.norm
  );

  assert.strictEqual(result.answer, 'They are in the kitchen drawer.');
  assert.strictEqual(result.sources[0].id, 'keys-location');
});


test('location-answer module does not misrepresent a singular saved item as plural', function () {
  const w = boot();
  const entry = {
    id: 'key-location',
    text: 'My spare key is in the kitchen drawer.'
  };

  const result = w.Mopapa.askParts.locationAnswer.answerLocation(
    'Where are my keys?',
    [entry],
    true,
    w.Mopapa.askParts.text.norm
  );

  assert.strictEqual(
    result.answer,
    'I found this saved item: My spare key is in the kitchen drawer.'
  );
});


test('location-answer module ignores unrelated questions and ambiguous matches', function () {
  const w = boot();
  const answerLocation = w.Mopapa.askParts.locationAnswer.answerLocation;
  const norm = w.Mopapa.askParts.text.norm;

  const first = {
    id: 'one',
    text: 'My keys are in the kitchen drawer.'
  };

  const second = {
    id: 'two',
    text: 'My wallet is in the bedroom.'
  };

  assert.strictEqual(
    answerLocation('What did I save?', [first], false, norm),
    null
  );

  assert.strictEqual(
    answerLocation('Where are my keys?', [], true, norm),
    null
  );

  assert.strictEqual(
    answerLocation('Where are my things?', [first, second], true, norm),
    null
  );
});

test('person-answer module exposes both answer handlers', function () {
  const w = boot();
  const answers = w.Mopapa.askParts.personAnswer;

  assert.strictEqual(
    typeof answers.answerWhoSomethingIsFor,
    'function'
  );

  assert.strictEqual(
    typeof answers.answerCalledName,
    'function'
  );
});


test('person-answer module identifies one recipient without changing its source', function () {
  const w = boot();
  const answers = w.Mopapa.askParts.personAnswer;

  const entry = {
    id: 'recipient-test',
    text: 'The parcel is for Jasmine Smith'
  };

  const result = answers.answerWhoSomethingIsFor(
    'Who is the parcel for?',
    [entry]
  );

  assert.strictEqual(
    result.answer,
    'It looks like it is for Jasmine Smith.'
  );

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(result.sources[0].id, 'recipient-test');
});


test('person-answer module identifies a called name from its saved entry', function () {
  const w = boot();
  const answers = w.Mopapa.askParts.personAnswer;

  const entry = {
    id: 'called-name-test',
    text: 'The dentist is called Dr Smith.'
  };

  const result = answers.answerCalledName(
    'What is the dentist called?',
    [entry]
  );

  assert.strictEqual(
    result.answer,
    'The dentist is called Dr Smith.'
  );

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(result.sources[0].id, 'called-name-test');
});

let failed = 0;
tests.forEach(function (t) {
  try { t[1](); console.log('PASS', t[0]); }
  catch (e) { failed++; console.log('FAIL', t[0], '-', e.message); }
});
console.log((tests.length - failed) + '/' + tests.length + ' tests passed');
process.exit(failed ? 1 : 0);
