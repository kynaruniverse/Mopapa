const fs = require('fs'), vm = require('vm'), assert = require('assert');

function boot(storage, storageApi) {
  const ls = {
    _: Object.assign({}, storage),
    failWrites: false,
    get length() { return Object.keys(this._).length; },
    key(i) { return Object.keys(this._)[i] || null; },
    getItem(k) { return k in this._ ? this._[k] : null; },
    setItem(k, v) {
      if (this.failWrites) throw new Error('simulated storage failure');
      this._[k] = String(v);
    },
    removeItem(k) {
      if (this.failRemovals) {
        throw new Error('simulated storage removal failure');
      }
      delete this._[k];
    }
  };
  const win = {
    localStorage: ls,
    console,
    navigator: {
      storage: storageApi
    }
  };
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
    'ask/ask-results',
    'ask/ask-match',
    'ask/ask-match-resolution',
    'ask/ask-ranking',
    'ask/ask-match-context',
    'ask/ask-facts',
    'ask/ask-fact-answer',
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
    'ask/ask-answer-flow',
    'ask/ask',
    'memory/agenda',
    'memory/resurface'
  ].forEach(function (f) {
    vm.runInContext(fs.readFileSync(__dirname + '/../js/' + f + '.js', 'utf8'), win, { filename: f });
  });
  return win;
}

function makeTalkElement() {
  const listeners = {};

  const element = {
    children: [],
    value: '',
    textContent: '',
    hidden: false,
    disabled: false,
    attributes: {},
    className: '',
    classList: {
      values: [],
      add: function (name) {
        if (!this.values.includes(name)) this.values.push(name);
      },
      remove: function () {
        const names = Array.from(arguments);
        this.values = this.values.filter(function (name) {
          return !names.includes(name);
        });
      },
      contains: function (name) {
        return this.values.includes(name);
      }
    },
    addEventListener: function (name, fn) {
      if (!listeners[name]) listeners[name] = [];
      listeners[name].push(fn);
    },
    dispatch: function (name, event) {
      (listeners[name] || []).forEach(function (fn) {
        fn(event || {});
      });
    },
    appendChild: function (child) {
      this.children.push(child);
      return child;
    },
    setAttribute: function (name, value) {
      this.attributes[name] = value;
    },
    click: function () {
      this.dispatch('click', {});
    },
    focus: function () {}
  };

  Object.defineProperty(element, 'innerHTML', {
    get: function () {
      return '';
    },
    set: function () {
      element.children = [];
    }
  });

  return element;
}


function bootTalk() {
  const elements = {
    'talk-input': makeTalkElement(),
    'talk-form': makeTalkElement(),
    'talk-mode-keep': makeTalkElement(),
    'talk-mode-ask': makeTalkElement(),
    'send': makeTalkElement(),
    'confirm': makeTalkElement(),
    'answer-sources': makeTalkElement()
  };
  elements.confirm.hidden = true;
  elements['answer-sources'].hidden = true;
  
  const calls = [];

  const M = {
    rules: {
      questionLevel: function () {
        return 'sure';
      },
      parse: function () {
        return null;
      },
      money: function () {
        return null;
      },
      dateForEntry: function (value) {
        return new Date(value);
      },
      describe: function () {
        return 'A saved date';
      }
    },

    sorter: {
      classify: function () {
        return { confident: false };
      }
    },

    pet: {
      say: function (message) {
        calls.push({ type: 'say', message: message });
      },
      react: function (state) {
        calls.push({ type: 'react', state: state });
      },
      bounce: function () {
        calls.push({ type: 'bounce' });
      }
    },

    ask: {
      answer: function (question) {
        calls.push({ type: 'answer', question: question });
        return app.answerResult;
      },
      logUnanswered: function (question) {
        calls.push({ type: 'logUnanswered', question: question });
        return true;
      },
      confirmSource: function (question, id) {
        calls.push({
          type: 'confirmSource',
          question: question,
          id: id
        });
        return app.confirmSourceResult;
      }
    },

    askLearningUI: {
      render: function () {
        calls.push({ type: 'learningRender' });
      }
    },

    roomById: function () {
      return { name: 'Notes', dated: false };
    },

    entries: {
      add: function (entry) {
        calls.push({ type: 'save', entry: entry });
        return { saved: app.saveResult };
      }
    },

    store: {
      saveError: function () {
        return 'storage';
      }
    },

    room: {
      renderRooms: function () {
        calls.push({ type: 'renderRooms' });
      }
    },

    refreshPanels: function () {
      calls.push({ type: 'refreshPanels' });
    }
  };

  const document = {
    getElementById: function (id) {
      return elements[id] || null;
    },
    createElement: function () {
      return makeTalkElement();
    }
  };

  const win = {
    document: document,
    console: console,
    Mopapa: M
  };

  win.window = win;
  vm.createContext(win);

  vm.runInContext(
    fs.readFileSync(__dirname + '/../js/ui/talk.js', 'utf8'),
    win,
    { filename: 'ui/talk' }
  );

  M.talk.init();

  const app = {
    elements: elements,
    calls: calls,
    Mopapa: M,
    answerResult: {
      answer: 'I could not find anything.',
      missed: true,
      sources: []
    },
    saveResult: true,
    confirmSourceResult: true
  };

  return app;
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test('talk interface loads and attaches its submit handler', function () {
  const app = bootTalk();

  assert.strictEqual(typeof app.Mopapa.talk.init, 'function');
  assert.strictEqual(
    typeof app.elements['talk-form'].dispatch,
    'function'
  );
});

test('composer starts in Keep mode', function () {
  const app = bootTalk();

  assert.strictEqual(
    app.elements['talk-mode-keep'].attributes['aria-pressed'],
    'true'
  );

  assert.strictEqual(
    app.elements['talk-mode-ask'].attributes['aria-pressed'],
    'false'
  );

  assert.strictEqual(
    app.elements['talk-input'].placeholder,
    'Write something to remember…'
  );
});

test('switching composer modes updates the selected state', function () {
  const app = bootTalk();

  app.elements['talk-mode-ask'].click();

  assert.strictEqual(
    app.elements['talk-mode-keep'].attributes['aria-pressed'],
    'false'
  );

  assert.strictEqual(
    app.elements['talk-mode-ask'].attributes['aria-pressed'],
    'true'
  );

  assert.strictEqual(
    app.elements['talk-input'].placeholder,
    'Ask about something you have saved…'
  );

  app.elements['talk-mode-keep'].click();

  assert.strictEqual(
    app.elements['talk-mode-keep'].attributes['aria-pressed'],
    'true'
  );

  assert.strictEqual(
    app.elements['talk-mode-ask'].attributes['aria-pressed'],
    'false'
  );
});

test('Keep mode saves question-shaped text without asking', function () {
  const app = bootTalk();
  const text = 'Where did I put the spare key?';

  app.elements['talk-input'].value = text;

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  const saved = app.calls.find(function (call) {
    return call.type === 'save';
  });

  assert.ok(saved);
  assert.strictEqual(saved.entry.text, text);

  assert.strictEqual(
    app.calls.some(function (call) {
      return call.type === 'answer';
    }),
    false
  );
});

test('Keep mode files a tax deadline without sending it to Ask', function () {
  const app = bootTalk();
  const text = 'Do my taxes by Friday';

  app.elements['talk-input'].value = text;

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  assert.ok(app.calls.some(function (call) {
    return call.type === 'save' && call.entry.text === text;
  }));

  assert.strictEqual(
    app.calls.some(function (call) {
      return call.type === 'answer';
    }),
    false
  );
});

test('Ask mode searches a boiler-service question without filing it', function () {
  const app = bootTalk();
  const text = 'Is boiler service due in March?';

  app.elements['talk-mode-ask'].click();
  app.elements['talk-input'].value = text;

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  assert.ok(app.calls.some(function (call) {
    return call.type === 'answer' && call.question === text;
  }));

  assert.strictEqual(
    app.calls.some(function (call) {
      return call.type === 'save';
    }),
    false
  );
});

test('Ask mode searches statement-shaped text without filing it', function () {
  const app = bootTalk();
  const text = 'The spare key is in the kitchen drawer';

  app.elements['talk-mode-ask'].click();
  app.elements['talk-input'].value = text;

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  assert.ok(app.calls.some(function (call) {
    return call.type === 'answer' && call.question === text;
  }));

  assert.strictEqual(
    app.calls.some(function (call) {
      return call.type === 'save';
    }),
    false
  );
});

test('missed questions show Keep this instead and Not now choices', function () {
  const app = bootTalk();
  const input = app.elements['talk-input'];
  const confirm = app.elements.confirm;

  app.elements['talk-mode-ask'].click();
  input.value = 'Where did I put the spare key?';

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  assert.strictEqual(input.disabled, true);
  assert.strictEqual(confirm.hidden, false);
  assert.strictEqual(confirm.children.length, 2);
  assert.strictEqual(confirm.children[0].textContent, 'Keep this instead');
  assert.strictEqual(confirm.children[1].textContent, 'Not now');

  assert.ok(app.calls.some(function (call) {
    return call.type === 'logUnanswered';
  }));
});


test('Keep this instead files the original missed question', function () {
  const app = bootTalk();
  const input = app.elements['talk-input'];
  const confirm = app.elements.confirm;
  const original = 'Where did I put the spare key?';

  app.elements['talk-mode-ask'].click();
  input.value = original;

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  confirm.children[0].click();

  const saved = app.calls.find(function (call) {
    return call.type === 'save';
  });

  assert.ok(saved);
  assert.strictEqual(saved.entry.text, original);
  assert.strictEqual(saved.entry.room, 'notes');
  assert.strictEqual(input.value, '');
  assert.strictEqual(input.disabled, false);
  assert.strictEqual(confirm.hidden, true);

  assert.ok(app.calls.some(function (call) {
    return call.type === 'renderRooms';
  }));

  assert.ok(app.calls.some(function (call) {
    return call.type === 'refreshPanels';
  }));
});


test('Not now cancels a missed question without saving it', function () {
  const app = bootTalk();
  const input = app.elements['talk-input'];
  const confirm = app.elements.confirm;
  const original = 'Where did I put the spare key?';

  app.elements['talk-mode-ask'].click();
  input.value = original;

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  confirm.children[1].click();

  assert.strictEqual(
    app.calls.some(function (call) {
      return call.type === 'save';
    }),
    false
  );

  assert.strictEqual(input.value, original);
  assert.strictEqual(input.disabled, false);
  assert.strictEqual(confirm.hidden, true);
});


test('Keep this instead preserves text when storage fails', function () {
  const app = bootTalk();
  const input = app.elements['talk-input'];
  const original = 'Where did I put the spare key?';

  app.saveResult = false;
  app.elements['talk-mode-ask'].click();
  input.value = original;

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  app.elements.confirm.children[0].click();

  assert.strictEqual(input.value, original);
  assert.strictEqual(input.disabled, false);
  assert.strictEqual(app.elements.confirm.hidden, true);

  assert.ok(app.calls.some(function (call) {
    return call.type === 'say' &&
      call.message.indexOf("couldn't save") !== -1;
  }));
});


test('answered questions without a miss do not show filing choices', function () {
  const app = bootTalk();

  app.answerResult = {
    answer: 'Your spare key is in the kitchen drawer.',
    missed: false,
    sources: []
  };

  app.elements['talk-mode-ask'].click();
  app.elements['talk-input'].value = 'Where is my spare key?';

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  assert.strictEqual(app.elements.confirm.hidden, true);
  assert.strictEqual(app.elements.confirm.children.length, 0);
  assert.strictEqual(app.elements['talk-input'].disabled, false);
});


test('source selection confirms the chosen saved entry', function () {
  const app = bootTalk();
  const question = 'Where is my spare key?';

  app.elements['talk-mode-ask'].click();
  app.answerResult = {
    answer: 'I found a possible match.',
    missed: false,
    sources: [{
      id: 'spare-key',
      text: 'My spare key is in the kitchen drawer.',
      room: 'notes',
      created: '2026-10-01T10:00:00.000Z'
    }]
  };

  app.elements['talk-input'].value = question;

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  const source = app.elements['answer-sources'].children[1];

  assert.ok(source);
  source.dispatch('keydown', {
    key: 'Enter',
    preventDefault: function () {}
  });

  const confirmation = app.calls.find(function (call) {
    return call.type === 'confirmSource';
  });

  assert.ok(confirmation);
  assert.strictEqual(confirmation.question, question);
  assert.strictEqual(confirmation.id, 'spare-key');
  assert.strictEqual(source.classList.contains('chosen'), true);
});


test('source selection supports Space as a keyboard action', function () {
  const app = bootTalk();

  app.elements['talk-mode-ask'].click();
  app.answerResult = {
    answer: 'I found a possible match.',
    missed: false,
    sources: [{
      id: 'passport',
      text: 'My passport is in the safe.',
      room: 'notes',
      created: '2026-10-01T10:00:00.000Z'
    }]
  };

  app.elements['talk-input'].value = 'Where is my passport?';

  app.elements['talk-form'].dispatch('submit', {
    preventDefault: function () {}
  });

  const source = app.elements['answer-sources'].children[1];

  source.dispatch('keydown', {
    key: ' ',
    preventDefault: function () {}
  });

  assert.ok(app.calls.some(function (call) {
    return call.type === 'confirmSource' &&
      call.id === 'passport';
  }));
});


test('Enter submits a question from the talk input', function () {
  const app = bootTalk();
  const input = app.elements['talk-input'];

  app.elements['talk-mode-ask'].click();
  input.value = 'Where is my passport?';

  let prevented = false;

  input.dispatch('keydown', {
    key: 'Enter',
    shiftKey: false,
    isComposing: false,
    keyCode: 13,
    preventDefault: function () {
      prevented = true;
    }
  });

  assert.strictEqual(prevented, true);

  assert.ok(app.calls.some(function (call) {
    return call.type === 'answer' &&
      call.question === 'Where is my passport?';
  }));
});


test('Enter does not submit while text composition is active', function () {
  const app = bootTalk();
  const input = app.elements['talk-input'];

  app.elements['talk-mode-ask'].click();
  input.value = 'Where is my passport?';
  input.dispatch('compositionstart');

  let prevented = false;

  input.dispatch('keydown', {
    key: 'Enter',
    shiftKey: false,
    isComposing: true,
    keyCode: 229,
    preventDefault: function () {
      prevented = true;
    }
  });

  assert.strictEqual(prevented, false);

  assert.strictEqual(
    app.calls.some(function (call) {
      return call.type === 'answer';
    }),
    false
  );
});


test('Shift Enter keeps its normal multiline behaviour', function () {
  const app = bootTalk();
  const input = app.elements['talk-input'];

  input.value = 'A note that continues';

  let prevented = false;

  input.dispatch('keydown', {
    key: 'Enter',
    shiftKey: true,
    isComposing: false,
    keyCode: 13,
    preventDefault: function () {
      prevented = true;
    }
  });

  assert.strictEqual(prevented, false);

  assert.strictEqual(
    app.calls.some(function (call) {
      return call.type === 'answer' || call.type === 'save';
    }),
    false
  );
});

test('ask modules are loaded once and before ask.js', function () {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');

  const modules = [
    'js/ask/ask-text.js',
    'js/ask/ask-people.js',
    'js/ask/ask-person-answer.js',
    'js/ask/ask-results.js',
    'js/ask/ask-match.js',
    'js/ask/ask-match-resolution.js',
    'js/ask/ask-ranking.js',
    'js/ask/ask-match-context.js',
    'js/ask/ask-facts.js',
    'js/ask/ask-fact-answer.js',
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
    'js/ask/ask-learning.js',
    'js/ask/ask-answer-flow.js'
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

test('reloading unchanged corrupt data reuses its existing recovery copy', function () {
  const raw = '{broken json';
  const w = boot({
    'mopapa.v1': raw
  });

  vm.runInContext(
    'Date.now = function () { return 123456; };',
    w
  );

  w.Mopapa.store.load();
  w.Mopapa.store.load();

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 1);
  assert.strictEqual(copies[0].kind, 'corrupt');
  assert.strictEqual(
    w.localStorage._[copies[0].key],
    raw
  );

  assert.strictEqual(
    w.Mopapa.store.data().corruptCopySaved,
    true
  );
});


test('different corrupt data still receives a separate recovery copy', function () {
  const firstRaw = '{broken json A';
  const secondRaw = '{broken json B';

  assert.strictEqual(firstRaw.length, secondRaw.length);

  const w = boot({
    'mopapa.v1': firstRaw
  });

  vm.runInContext(
    'Date.now = function () { return 123456; };',
    w
  );

  w.Mopapa.store.load();

  w.localStorage.setItem('mopapa.v1', secondRaw);

  w.Mopapa.store.load();

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 2);

  assert.strictEqual(
    JSON.stringify(copies.map(function (copy) {
      return w.localStorage._[copy.key];
    }).sort()),
    JSON.stringify([firstRaw, secondRaw].sort())
  );
});


test('reloading unchanged partially rejected data reuses its recovery copy', function () {
  const raw = JSON.stringify({
    entries: [
      { id: 'valid', text: 'Keep this memory', room: 'notes' },
      null
    ],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  });

  const w = boot({
    'mopapa.v1': raw
  });

  vm.runInContext(
    'Date.now = function () { return 123456; };',
    w
  );

  w.Mopapa.store.load();
  w.Mopapa.store.load();

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 1);
  assert.strictEqual(copies[0].kind, 'recovery');
  assert.strictEqual(
    w.localStorage._[copies[0].key],
    raw
  );

  assert.strictEqual(
    w.Mopapa.store.data().recoveryCopySaved,
    true
  );
});

test('partially rejected data is preserved when recovery inventory inspection fails', function () {
  const raw = JSON.stringify({
    entries: [
      { id: 'valid', text: 'Keep this memory', room: 'notes' },
      null
    ],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  });

  const w = boot({
    'mopapa.v1': raw,
    'mopapa.v1.recovery.100': raw
  });

  vm.runInContext(
    'Date.now = function () { return 123456; };',
    w
  );

  Object.defineProperty(w.localStorage, 'length', {
    get: function () {
      throw new Error('simulated storage enumeration failure');
    }
  });

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.store.data().recoveryCopySaved,
    true
  );

  assert.strictEqual(
    w.Mopapa.store.data().recoveryBlocked,
    false
  );

  assert.strictEqual(
    w.localStorage._['mopapa.v1.recovery.100'],
    raw
  );

  assert.strictEqual(
    w.localStorage._['mopapa.v1.recovery.123456'],
    raw
  );
});

test('corrupt data is preserved when corrupt-copy inspection fails', function () {
  const raw = '{broken json';

  const w = boot({
    'mopapa.v1': raw,
    'mopapa.v1.corrupt.100': raw
  });

  vm.runInContext(
    'Date.now = function () { return 123456; };',
    w
  );

  Object.defineProperty(w.localStorage, 'length', {
    get: function () {
      throw new Error('simulated storage enumeration failure');
    }
  });

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.store.data().corrupt,
    true
  );

  assert.strictEqual(
    w.Mopapa.store.data().corruptCopySaved,
    true
  );

  assert.strictEqual(
    w.localStorage._['mopapa.v1.corrupt.100'],
    raw
  );

  assert.strictEqual(
    w.localStorage._['mopapa.v1.corrupt.123456'],
    raw
  );
});

test('different partially rejected data retains separate recovery copies', function () {
  const firstRaw = JSON.stringify({
    entries: [null],
    marker: 'first'
  });

  const secondRaw = JSON.stringify({
    entries: [null],
    marker: 'second'
  });

  const w = boot({
    'mopapa.v1': firstRaw
  });

  vm.runInContext(
    'Date.now = function () { return 123456; };',
    w
  );

  w.Mopapa.store.load();

  w.localStorage.setItem('mopapa.v1', secondRaw);

  w.Mopapa.store.load();

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 2);

  assert.strictEqual(
    JSON.stringify(copies.map(function (copy) {
      return w.localStorage._[copy.key];
    }).sort()),
    JSON.stringify([firstRaw, secondRaw].sort())
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

  assert.strictEqual(copies[0].key, 'mopapa.v1.corrupt.200');
  assert.strictEqual(copies[0].kind, 'corrupt');
  assert.strictEqual(copies[1].key, 'mopapa.v1.recovery.100');
  assert.strictEqual(copies[1].kind, 'recovery');

  assert.strictEqual(w.Mopapa.store.exportRecoveryCopy('mopapa.v1'), false);
  assert.strictEqual(w.Mopapa.store.exportRecoveryCopy('mopapa.v1.recovery.missing'), false);
  assert.strictEqual(w.Mopapa.store.exportRecoveryCopy(123), false);
  assert.strictEqual(w.Mopapa.store.exportRecoveryCopy({}), false);
});

test('recovery copies are ordered by numeric timestamp and collision suffix', function () {
  const w = boot({
    'mopapa.v1.recovery.1000': 'older',
    'mopapa.v1.recovery.2000': 'newer',
    'mopapa.v1.corrupt.2000.9': 'ninth',
    'mopapa.v1.corrupt.2000.10': 'tenth'
  });

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(
    JSON.stringify(copies.map(function (copy) {
      return copy.key;
    })),
    JSON.stringify([
      'mopapa.v1.corrupt.2000.10',
      'mopapa.v1.corrupt.2000.9',
      'mopapa.v1.recovery.2000',
      'mopapa.v1.recovery.1000'
    ])
  );

  assert.strictEqual(copies[0].timestamp, 2000);
  assert.strictEqual(copies[0].sequence, 10);
  assert.strictEqual(copies[0].kind, 'corrupt');
  assert.strictEqual(copies[2].sequence, 0);
});

test('recovery retention keeps the 20 newest ordinary copies', function () {
  const storage = {
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: [],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  };

  for (let i = 1; i <= 25; i++) {
    storage['mopapa.v1.recovery.' + (1000 + i)] = 'copy-' + i;
  }

  const w = boot(storage);

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.store.preserveCurrentRecoveryCopy(),
    true
  );

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 20);

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.1001'),
    null
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.1005'),
    null
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.1006'),
    null
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.1007'),
    'copy-7'
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.1025'),
    'copy-25'
  );

  assert.ok(
    copies.some(function (copy) {
      return w.localStorage.getItem(copy.key) ===
        w.localStorage.getItem('mopapa.v1');
    })
  );
});

test('recovery retention never deletes corrupt-data copies', function () {
  const storage = {
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: [],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    }),
    'mopapa.v1.corrupt.100': '{original corrupt data}'
  };

  for (let i = 1; i <= 22; i++) {
    storage['mopapa.v1.recovery.' + (2000 + i)] = 'copy-' + i;
  }

  const w = boot(storage);

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.store.preserveCurrentRecoveryCopy(),
    true
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.corrupt.100'),
    '{original corrupt data}'
  );

  assert.strictEqual(
    w.Mopapa.store.recoveryCopies().filter(function (copy) {
      return copy.kind === 'corrupt';
    }).length,
    1
  );

  assert.strictEqual(
    w.Mopapa.store.recoveryCopies().filter(function (copy) {
      return copy.kind === 'recovery';
    }).length,
    20
  );
});

test('recovery retention protects the copy matching current saved data', function () {
  const currentRaw = JSON.stringify({
    entries: [],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  });

  const storage = {
    'mopapa.v1': currentRaw,
    'mopapa.v1.recovery.100': currentRaw
  };

  for (let i = 1; i <= 21; i++) {
    storage['mopapa.v1.recovery.' + (3000 + i)] = 'copy-' + i;
  }

  const w = boot(storage);

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.store.preserveCurrentRecoveryCopy(),
    true
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.100'),
    currentRaw
  );

  assert.strictEqual(
    w.Mopapa.store.recoveryCopies().length,
    21
  );
});

test('failed recovery creation never prunes existing copies', function () {
  const storage = {
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {},
      customRooms: [],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    })
  };

  for (let i = 1; i <= 22; i++) {
    storage['mopapa.v1.recovery.' + (4000 + i)] = 'copy-' + i;
  }

  const w = boot(storage);

  w.Mopapa.store.load();

  w.localStorage.failWrites = true;

  assert.strictEqual(
    w.Mopapa.store.preserveCurrentRecoveryCopy(),
    false
  );

  assert.strictEqual(
    w.Mopapa.store.recoveryCopies().length,
    22
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.4001'),
    'copy-1'
  );
});

test('recovery creation uses the next collision suffix without overwriting copies', function () {
  const currentRaw = JSON.stringify({
    entries: [],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  });

  const w = boot({
    'mopapa.v1': currentRaw,
    'mopapa.v1.recovery.5000': 'first existing copy',
    'mopapa.v1.recovery.5000.1': 'second existing copy'
  });

  w.Date = class extends Date {
    static now() {
      return 5000;
    }
  };

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.store.preserveCurrentRecoveryCopy(),
    true
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.5000'),
    'first existing copy'
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.5000.1'),
    'second existing copy'
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.5000.2'),
    currentRaw
  );
});

test('recovery preservation succeeds when automatic cleanup fails', function () {
  const currentRaw = JSON.stringify({
    entries: [],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  });

  const storage = {
    'mopapa.v1': currentRaw
  };

  for (let i = 1; i <= 21; i++) {
    storage['mopapa.v1.recovery.' + (6000 + i)] = 'copy-' + i;
  }

  const w = boot(storage);

  w.Date = class extends Date {
    static now() {
      return 5000;
    }
  };

  w.Mopapa.store.load();

  w.localStorage.failRemovals = true;

  assert.strictEqual(
    w.Mopapa.store.preserveCurrentRecoveryCopy(),
    true
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.5000'),
    currentRaw
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1.recovery.6001'),
    'copy-1'
  );

  assert.strictEqual(
    w.Mopapa.store.recoveryCopies().length,
    22
  );
});

test('recovery inventory retains malformed legacy keys without misdating them', function () {
  const w = boot({
    'mopapa.v1.recovery.not-a-date': 'legacy',
    'mopapa.v1.corrupt.2000': 'valid'
  });

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 2);
  assert.strictEqual(copies[0].timestamp, 2000);
  assert.strictEqual(copies[1].timestamp, null);
  assert.strictEqual(copies[1].key, 'mopapa.v1.recovery.not-a-date');
});

test('recovery discovery reports an unavailable inventory when storage enumeration fails', function () {
  const w = boot({
    'mopapa.v1.recovery.100': 'preserved data'
  });

  Object.defineProperty(w.localStorage, 'length', {
    get: function () {
      throw new Error('simulated storage enumeration failure');
    }
  });

  assert.strictEqual(
    w.Mopapa.store.recoveryCopies(),
    null
  );

  assert.strictEqual(
    w.Mopapa.store.exportRecoveryCopy(),
    false
  );

  assert.strictEqual(
    w.localStorage._['mopapa.v1.recovery.100'],
    'preserved data'
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
  assert.strictEqual(w.Mopapa.store.data().recoveryBlocked, true);

  const originalRaw = w.localStorage._['mopapa.v1'];

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'recovery');

  assert.strictEqual(
    w.localStorage._['mopapa.v1'],
    originalRaw
  );  
});

test('loading accepts and normalises valid saved custom rooms', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      customRooms: [
        {
          id: 'custom_garden',
          name: 'Garden',
          icon: '🌱'
        }
      ]
    })
  });

  w.Mopapa.store.load();

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(w.Mopapa.store.data().customRooms)),
    [
      {
        id: 'custom_garden',
        name: 'Garden',
        icon: 'sprout'
      }
    ]
  );

  assert.strictEqual(
    w.Mopapa.store.data().rejectedCustomRooms,
    undefined
  );

  assert.strictEqual(
    w.Mopapa.store.data().recoveryCopySaved,
    undefined
  );
});


test('loading rejects malformed custom rooms and preserves the original record', function () {
  const originalRaw = JSON.stringify({
    entries: [
      {
        id: 'valid-entry',
        text: 'Keep this memory',
        room: 'notes'
      }
    ],
    customRooms: [
      {
        id: 'custom_garden',
        name: 'Garden',
        icon: 'sprout'
      },
      {
        id: 'custom_garden',
        name: 'Duplicate garden',
        icon: 'star'
      }
    ]
  });

  const w = boot({
    'mopapa.v1': originalRaw
  });

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.store.data().customRooms.length,
    1
  );

  assert.strictEqual(
    w.Mopapa.store.data().customRooms[0].id,
    'custom_garden'
  );

  assert.strictEqual(
    w.Mopapa.store.data().rejectedCustomRooms,
    true
  );

  assert.strictEqual(
    w.Mopapa.store.data().recoveryCopySaved,
    true
  );

  assert.strictEqual(
    w.Mopapa.store.data().recoveryBlocked,
    false
  );

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 1);
  assert.strictEqual(copies[0].kind, 'recovery');
  assert.strictEqual(
    w.localStorage._[copies[0].key],
    originalRaw
  );

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].id,
    'valid-entry'
  );
});


test('loading locks changes when invalid custom rooms cannot be preserved', function () {
  const originalRaw = JSON.stringify({
    entries: [],
    customRooms: [
      {
        id: 'invalid room id',
        name: 'Garden',
        icon: 'sprout'
      }
    ]
  });

  const w = boot({
    'mopapa.v1': originalRaw
  });

  w.localStorage.failWrites = true;
  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.store.data().rejectedCustomRooms,
    true
  );

  assert.strictEqual(
    w.Mopapa.store.data().customRooms.length,
    0
  );

  assert.strictEqual(
    w.Mopapa.store.data().recoveryCopySaved,
    false
  );

  assert.strictEqual(
    w.Mopapa.store.data().recoveryBlocked,
    true
  );

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'recovery');

  assert.strictEqual(
    w.localStorage._['mopapa.v1'],
    originalRaw
  );
});

test('search requires every meaningful query word to match', function () {
  const w = boot(stored([
    {
      id: 'garden',
      text: 'Garden maintenance notes',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('garden insurance');

  assert.strictEqual(result.total, 0);
  assert.deepStrictEqual(Array.from(result.results), []);
});

test('search combines saved text and tags to match a complete query', function () {
  const w = boot(stored([
    {
      id: 'boiler-service',
      text: 'Service is due in March',
      room: 'notes',
      tags: ['boiler', 'annual'],
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('boiler service');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'boiler-service');
});


test('search combines room IDs and saved text to match a complete query', function () {
  const w = boot(stored([
    {
      id: 'insurance-task',
      text: 'Renew insurance before Friday',
      room: 'todo',
      created: ago(1)
    },
    {
      id: 'insurance-note',
      text: 'Insurance documents are in the folder',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('todo insurance');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'insurance-task');
});


test('search does not return an entry when one meaningful term is missing across all fields', function () {
  const w = boot(stored([
    {
      id: 'insurance-task',
      text: 'Renew insurance before Friday',
      room: 'todo',
      tags: ['boiler', 'annual'],
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('todo insurance boiler service');

  assert.strictEqual(result.total, 0);
  assert.deepStrictEqual(Array.from(result.results), []);
});

test('search includes saved tags when matching entries', function () {
  const w = boot(stored([
    {
      id: 'holiday',
      text: 'Prepare the suitcase',
      room: 'notes',
      tags: ['holiday', 'packing'],
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('holiday');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'holiday');
});

test('search includes room names and IDs when matching entries', function () {
  const w = boot(stored([
    {
      id: 'task-room',
      text: 'Renew insurance',
      room: 'todo',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('todo');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'task-room');
});

test('search does not reuse one saved word to satisfy multiple terms', function () {
  const w = boot(stored([
    {
      id: 'boiler',
      text: 'Boiler maintenance is due',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('boil boiler');

  assert.strictEqual(result.total, 0);
  assert.deepStrictEqual(Array.from(result.results), []);
});


test('search matches overlapping prefixes to separate words regardless of query order', function () {
  const w = boot(stored([
    {
      id: 'keys',
      text: 'Keyboard and key are in the drawer',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('key keyboard');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'keys');
});


test('search ignores repeated copies of the same query word', function () {
  const w = boot(stored([
    {
      id: 'boiler',
      text: 'Boiler maintenance is due',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('boiler boiler');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'boiler');
});


test('search matches common irregular plurals', function () {
  const w = boot(stored([
    {
      id: 'buses',
      text: 'The buses stop outside',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'leaves',
      text: 'The leaves are in the garden',
      room: 'notes',
      created: ago(2)
    },
    {
      id: 'knives',
      text: 'The knives are in the kitchen drawer',
      room: 'notes',
      created: ago(3)
    }
  ]));

  w.Mopapa.store.load();

  const cases = [
    { query: 'bus', id: 'buses' },
    { query: 'leaf', id: 'leaves' },
    { query: 'knife', id: 'knives' }
  ];

  cases.forEach(function (item) {
    const result = w.Mopapa.search.find(item.query);

    assert.strictEqual(
      result.total,
      1,
      'Expected "' + item.query + '" to find its plural form'
    );

    assert.strictEqual(result.results[0].entry.id, item.id);
  });
});


test('search supports incomplete final words', function () {
  const w = boot(stored([
    {
      id: 'passport',
      text: 'Passport is in the top drawer',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('passpor');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'passport');
});

test('search rejects queries containing no meaningful words', function () {
  const w = boot(stored([
    {
      id: 'kitchen',
      text: 'Kitchen supplies are in the cupboard',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const cases = ['a', 'i', 'in', 'to', 'of'];

  cases.forEach(function (query) {
    const result = w.Mopapa.search.find(query);

    assert.strictEqual(
      result.tooShort,
      true,
      'Expected "' + query + '" to be rejected as a non-meaningful query'
    );

    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.results.length, 0);
  });
});


test('search supports useful two-character prefixes', function () {
  const w = boot(stored([
    {
      id: 'boiler',
      text: 'Boiler service is due in March',
      room: 'notes',
      created: ago(2)
    },
    {
      id: 'box',
      text: 'Storage box is in the spare room',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'garden',
      text: 'Garden maintenance is due in April',
      room: 'notes',
      created: ago(3)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('bo');

  assert.strictEqual(result.tooShort, false);
  assert.strictEqual(result.total, 2);

  const ids = result.results.map(function (item) {
    return item.entry.id;
  });

  assert.ok(ids.includes('boiler'));
  assert.ok(ids.includes('box'));
  assert.ok(!ids.includes('garden'));
});


test('search ranks exact words above longer words sharing the prefix', function () {
  const w = boot(stored([
    {
      id: 'keyboard',
      text: 'Spare keyboard is in the desk drawer',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'key',
      text: 'Spare key is in the blue tin',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('spare key');

  assert.strictEqual(result.total, 2);

  assert.strictEqual(
    result.results[0].entry.id,
    'key',
    'The exact word match should rank above the longer prefix match'
  );
});

test('search matches common plural queries to singular saved words', function () {
  const w = boot(stored([
    {
      id: 'spare-key',
      text: 'Spare key is in the blue tin',
      room: 'notes',
      created: ago(3)
    },
    {
      id: 'battery',
      text: 'Rechargeable battery is in the kitchen drawer',
      room: 'notes',
      created: ago(2)
    },
    {
      id: 'storage-box',
      text: 'Important papers are in the storage box',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const keys = w.Mopapa.search.find('spare keys');
  const batteries = w.Mopapa.search.find('batteries');
  const boxes = w.Mopapa.search.find('boxes');

  assert.strictEqual(keys.total, 1);
  assert.strictEqual(keys.results[0].entry.id, 'spare-key');

  assert.strictEqual(batteries.total, 1);
  assert.strictEqual(batteries.results[0].entry.id, 'battery');

  assert.strictEqual(boxes.total, 1);
  assert.strictEqual(boxes.results[0].entry.id, 'storage-box');
});

test('search matches singular queries to common plural saved words', function () {
  const w = boot(stored([
    {
      id: 'keys',
      text: 'Spare keys are in the blue tin',
      room: 'notes',
      created: ago(8)
    },
    {
      id: 'batteries',
      text: 'Rechargeable batteries are in the kitchen drawer',
      room: 'notes',
      created: ago(7)
    },
    {
      id: 'boxes',
      text: 'Storage boxes are in the cupboard',
      room: 'notes',
      created: ago(6)
    },
    {
      id: 'stories',
      text: 'Favourite stories for bedtime',
      room: 'notes',
      created: ago(5)
    },
    {
      id: 'watches',
      text: 'Old watches are in the jewellery cabinet',
      room: 'notes',
      created: ago(4)
    },
    {
      id: 'brushes',
      text: 'Paint brushes are in the garage',
      room: 'notes',
      created: ago(3)
    },
    {
      id: 'classes',
      text: 'Swimming classes are on Tuesdays',
      room: 'notes',
      created: ago(2)
    },
    {
      id: 'buzzes',
      text: 'The doorbell buzzes twice',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const cases = [
    ['key', 'keys'],
    ['battery', 'batteries'],
    ['box', 'boxes'],
    ['story', 'stories'],
    ['watch', 'watches'],
    ['brush', 'brushes'],
    ['class', 'classes'],
    ['buzz', 'buzzes']
  ];

  cases.forEach(function (item) {
    const result = w.Mopapa.search.find(item[0]);

    assert.strictEqual(
      result.total,
      1,
      'Expected "' + item[0] + '" to find its plural entry'
    );

    assert.strictEqual(
      result.results[0].entry.id,
      item[1]
    );
  });
});

test('search matches common irregular plurals in both directions', function () {
  const cases = [
    ['people', 'person'],
    ['person', 'people'],
    ['children', 'child'],
    ['child', 'children'],
    ['men', 'man'],
    ['man', 'men'],
    ['women', 'woman'],
    ['woman', 'women'],
    ['feet', 'foot'],
    ['foot', 'feet'],
    ['teeth', 'tooth'],
    ['tooth', 'teeth'],
    ['mice', 'mouse'],
    ['mouse', 'mice'],
    ['buses', 'bus'],
    ['bus', 'buses'],
    ['leaves', 'leaf'],
    ['leaf', 'leaves'],
    ['wives', 'wife'],
    ['wife', 'wives'],
    ['knives', 'knife'],
    ['knife', 'knives'],
    ['wolves', 'wolf'],
    ['wolf', 'wolves'],
    ['loaves', 'loaf'],
    ['loaf', 'loaves'],
    ['halves', 'half'],
    ['half', 'halves'],
    ['geese', 'goose'],
    ['goose', 'geese'],
    ['oxen', 'ox'],
    ['ox', 'oxen'],
    ['dice', 'die'],
    ['die', 'dice'],
    ['indices', 'index'],
    ['index', 'indices'],
    ['criteria', 'criterion'],
    ['criterion', 'criteria'],
    ['phenomena', 'phenomenon'],
    ['phenomenon', 'phenomena'],
    ['cacti', 'cactus'],
    ['cactus', 'cacti'],
    ['fungi', 'fungus'],
    ['fungus', 'fungi'],
    ['analyses', 'analysis'],
    ['analysis', 'analyses'],
    ['diagnoses', 'diagnosis'],
    ['diagnosis', 'diagnoses']
  ];

  cases.forEach(function (item) {
    const w = boot(stored([
      {
        id: 'irregular-plural',
        text: 'Remember the ' + item[1] + ' detail',
        room: 'notes',
        created: ago(1)
      }
    ]));

    w.Mopapa.store.load();

    const result = w.Mopapa.search.find(item[0]);

    assert.strictEqual(
      result.total,
      1,
      'Expected "' + item[0] + '" to find "' + item[1] + '"'
    );

    assert.strictEqual(
      result.results[0].entry.id,
      'irregular-plural'
    );
  });
});

test('search does not apply plural stemming to common non-plural words', function () {
  const w = boot(stored([
    {
      id: 'new-lamp',
      text: 'A new lamp is on the desk',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'series',
      text: 'The television series starts on Friday',
      room: 'notes',
      created: ago(2)
    },
    {
      id: 'thimble',
      text: 'A thimble sits beside the path',
      room: 'notes',
      created: ago(3)
    },
    {
      id: 'thunder',
      text: 'Thunder was heard overnight',
      room: 'notes',
      created: ago(4)
    },
    {
      id: 'length',
      text: 'The length of the shelf is one metre',
      room: 'notes',
      created: ago(5)
    },
    {
      id: 'chaotic',
      text: 'The room became chaotic',
      room: 'notes',
      created: ago(6)
    },
    {
      id: 'ethology',
      text: 'Read about animal ethology',
      room: 'notes',
      created: ago(7)
    },
    {
      id: 'biannual',
      text: 'The biannual review is in June',
      room: 'notes',
      created: ago(8)
    }
  ]));

  w.Mopapa.store.load();

  const cases = [
    ['news', 0],
    ['series', 1],
    ['this', 0],
    ['thus', 0],
    ['lens', 0],
    ['chaos', 0],
    ['ethos', 0],
    ['bias', 0]
  ];

  cases.forEach(function (item) {
    const result = w.Mopapa.search.find(item[0]);

    assert.strictEqual(
      result.total,
      item[1],
      'Unexpected plural stemming result for "' + item[0] + '"'
    );
  });
});

test('search ignores stop words and duplicate query words', function () {
  const w = boot(stored([
    {
      id: 'garden',
      text: 'Garden maintenance notes',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('the garden garden');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'garden');

  const empty = w.Mopapa.search.find('the and to');

  assert.strictEqual(empty.tooShort, true);
  assert.strictEqual(empty.total, 0);
});

test('search prioritises an exact phrase over separate word matches', function () {
  const w = boot(stored([
    {
      id: 'separate',
      text: 'Passport information and a drawer inventory',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'phrase',
      text: 'Passport drawer',
      room: 'notes',
      created: ago(10)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('passport drawer');

  assert.strictEqual(result.total, 2);
  assert.strictEqual(result.results[0].entry.id, 'phrase');
});

test('search uses newest entries to break equal relevance scores', function () {
  const w = boot(stored([
    {
      id: 'older',
      text: 'Passport information',
      room: 'notes',
      created: ago(10)
    },
    {
      id: 'newer',
      text: 'Passport details',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('passport');

  assert.strictEqual(result.total, 2);
  assert.strictEqual(result.results[0].entry.id, 'newer');
  assert.strictEqual(result.results[1].entry.id, 'older');
});

test('search is case-insensitive and normalises punctuation', function () {
  const w = boot(stored([
    {
      id: 'punctuation',
      text: 'The PASSPORT, drawer and spare-key details.',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('PASSPORT, SPARE-KEY');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'punctuation');
});

test('search normalises apostrophes without losing the matching word', function () {
  const w = boot(stored([
    {
      id: 'apostrophe',
      text: "Charles' mother's spare key",
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('mothers key');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'apostrophe');
});

test('search supports pound amounts and numeric terms', function () {
  const w = boot(stored([
    {
      id: 'payment',
      text: 'Paid £125 for the replacement passport',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const amount = w.Mopapa.search.find('£125');
  const number = w.Mopapa.search.find('125');

  assert.strictEqual(amount.total, 1);
  assert.strictEqual(amount.results[0].entry.id, 'payment');

  assert.strictEqual(number.total, 1);
  assert.strictEqual(number.results[0].entry.id, 'payment');
});

test('search matches prefixes only at the beginning of a word', function () {
  const w = boot(stored([
    {
      id: 'carpet',
      text: 'Buy a new carpet',
      room: 'notes',
      created: ago(2)
    },
    {
      id: 'scarlet',
      text: 'Scarlet paint colour',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('car');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'carpet');
});

test('search ignores single-character words when meaningful words exist', function () {
  const w = boot(stored([
    {
      id: 'key',
      text: 'I need a spare key',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('a key');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'key');
});

test('search can match words across text tags and room fields', function () {
  const w = boot(stored([
    {
      id: 'cross-field',
      text: 'Keep the important document safe',
      room: 'todo',
      tags: ['passport'],
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('document passport todo');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'cross-field');
});

test('search ranks exact word matches above prefix-only matches', function () {
  const w = boot(stored([
    {
      id: 'prefix',
      text: 'Keyboard replacement',
      room: 'notes',
      created: ago(2)
    },
    {
      id: 'exact',
      text: 'Replacement key',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('key');

  assert.strictEqual(result.total, 2);
  assert.strictEqual(result.results[0].entry.id, 'exact');
});

test('search returns every match rather than applying the display limit', function () {
  const entries = [];

  for (let i = 0; i < 15; i++) {
    entries.push({
      id: 'search-result-' + i,
      text: 'Passport information record ' + i,
      room: 'notes',
      created: ago(i + 1)
    });
  }

  const w = boot(stored(entries));
  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('passport');

  assert.strictEqual(result.total, 15);
  assert.strictEqual(result.results.length, 15);
});

test('search reports punctuation-only queries as too short', function () {
  const w = boot(stored([
    {
      id: 'entry',
      text: 'A saved memory',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('!?.,');

  assert.strictEqual(result.tooShort, true);
  assert.strictEqual(result.total, 0);
  assert.deepStrictEqual(Array.from(result.results), []);
});

test('search reports a single-character-only query as too short', function () {
  const w = boot(stored([
    {
      id: 'entry',
      text: 'A saved memory',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('x');

  assert.strictEqual(result.tooShort, true);
  assert.strictEqual(result.total, 0);
  assert.deepStrictEqual(Array.from(result.results), []);
});

test('search normalises repeated whitespace in queries', function () {
  const w = boot(stored([
    {
      id: 'whitespace',
      text: 'Passport drawer information',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('  passport    drawer  ');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'whitespace');
});

test('search treats repeated punctuation as word separators', function () {
  const w = boot(stored([
    {
      id: 'punctuation',
      text: 'Passport...drawer!!! information',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('passport!!!drawer...');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'punctuation');
});

test('search matches decimal currency amounts', function () {
  const w = boot(stored([
    {
      id: 'decimal-payment',
      text: 'Paid £12.50 for parking',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('12.50');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'decimal-payment');
});

test('search matches partial numeric prefixes in currency amounts', function () {
  const w = boot(stored([
    {
      id: 'large-payment',
      text: 'The repair cost £1250',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('125');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'large-payment');
});

test('search does not match numeric suffixes inside larger amounts', function () {
  const w = boot(stored([
    {
      id: 'payment',
      text: 'The repair cost £1250',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('250');

  assert.strictEqual(result.total, 0);
});

test('search matches multiple tags without duplicating an entry', function () {
  const w = boot(stored([
    {
      id: 'tagged',
      text: 'Important household information',
      room: 'notes',
      tags: ['passport', 'passport', 'travel'],
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('passport travel');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].entry.id, 'tagged');
});

test('search does not duplicate an entry matching in several fields', function () {
  const w = boot(stored([
    {
      id: 'multi-field',
      text: 'Passport information',
      room: 'notes',
      tags: ['passport'],
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const result = w.Mopapa.search.find('passport');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results.length, 1);
});

test('search safely handles entries with no matching room definition', function () {
  const w = boot(stored([
    {
      id: 'unknown-room',
      text: 'Passport information',
      room: 'removed-room',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();
  w.Mopapa.roomById = function () { return null; };

  const result = w.Mopapa.search.find('passport');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'unknown-room');
  assert.strictEqual(result.results[0].room, null);
});

test('search safely skips malformed live entries', function () {
  const w = boot(stored([
    {
      id: 'valid',
      text: 'Passport information',
      room: 'notes',
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();
  w.Mopapa.store.data().entries.unshift(
    null,
    'not an entry',
    { id: 'missing-text', room: 'notes' },
    { id: 'array-text', text: ['not', 'text'], room: 'notes' }
  );

  const result = w.Mopapa.search.find('passport');

  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.results[0].entry.id, 'valid');
});

test('search does not modify saved entry data', function () {
  const w = boot(stored([
    {
      id: 'unchanged',
      text: 'Passport information',
      room: 'notes',
      tags: ['travel'],
      created: ago(2)
    }
  ]));

  w.Mopapa.store.load();

  const before = JSON.stringify(w.Mopapa.store.data().entries);

  w.Mopapa.search.find('passport travel');
  w.Mopapa.search.find('PASS');
  w.Mopapa.search.find('!?.');

  const after = JSON.stringify(w.Mopapa.store.data().entries);

  assert.strictEqual(after, before);
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

test('corrupt storage is not marked recovered when corrupt-copy write cannot be verified', function () {
  const originalRaw = '{invalid json';
  const w = boot({
    'mopapa.v1': originalRaw
  });

  const originalSetItem = w.localStorage.setItem;

  w.localStorage.setItem = function (key, value) {
    if (key.indexOf('mopapa.v1.corrupt.') === 0) {
      return;
    }

    return originalSetItem.call(this, key, value);
  };

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corrupt, true);
  assert.strictEqual(
    w.Mopapa.store.data().corruptCopySaved,
    false
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    originalRaw
  );

  assert.strictEqual(
    w.Mopapa.store.recoveryCopies().filter(function (copy) {
      return copy.kind === 'corrupt';
    }).length,
    0
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

test('repeated corrupt loads never overwrite an existing recovery copy', function () {
  const firstRaw = '{first broken backup';
  const secondRaw = '{second broken backup';

  const w = boot({
    'mopapa.v1': firstRaw
  });

  vm.runInContext(
    'Date.now = function () { return 123456; };',
    w
  );

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corruptCopySaved, true);

  w.localStorage.setItem('mopapa.v1', secondRaw);

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corruptCopySaved, true);

  const keys = Object.keys(w.localStorage._).filter(function (key) {
    return key.indexOf('mopapa.v1.corrupt.') === 0;
  });

  assert.strictEqual(keys.length, 2);

  assert.strictEqual(
    w.localStorage._['mopapa.v1.corrupt.123456'],
    firstRaw
  );

  assert.strictEqual(
    w.localStorage._['mopapa.v1.corrupt.123456.1'],
    secondRaw
  );

  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 2);
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

test('resurfacing returns no memories when storage is empty', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  assert.deepStrictEqual(
    Array.from(w.Mopapa.resurface.getToday(now)),
    []
  );
});

test('resurfacing includes only its selected memory rooms', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);
  const created = new Date(2026, 9, 1, 12, 0).toISOString();

  const rooms = [
    'wishlist',
    'ideas',
    'notes',
    'feelings',
    'todo',
    'appointments',
    'custom_test'
  ];

  w.Mopapa.store.data().entries = rooms.map(function (room) {
    return {
      id: room,
      text: 'Memory in ' + room,
      room: room,
      created: created,
      done: false
    };
  });

  const ids = Array.from(
    w.Mopapa.resurface.getToday(now)
  ).map(function (item) {
    return item.entry.id;
  });

  assert.deepStrictEqual(
    ids.slice().sort(),
    ['ideas', 'notes', 'wishlist']
  );
});

test('resurfacing excludes memories younger than seven calendar days', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  function daysAgo(days) {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  w.Mopapa.store.data().entries = [
    {
      id: 'six-days',
      text: 'Too recent',
      room: 'notes',
      created: daysAgo(6),
      done: false
    },
    {
      id: 'seven-days',
      text: 'Old enough',
      room: 'notes',
      created: daysAgo(7),
      done: false
    }
  ];

  const ids = Array.from(
    w.Mopapa.resurface.getToday(now)
  ).map(function (item) {
    return item.entry.id;
  });

  assert.deepStrictEqual(ids, ['seven-days']);
});

test('resurfacing excludes completed memories', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  w.Mopapa.store.data().entries = [
    {
      id: 'completed',
      text: 'Already completed',
      room: 'notes',
      created: '2026-10-01T12:00:00.000Z',
      done: true
    },
    {
      id: 'unfinished',
      text: 'Still relevant',
      room: 'notes',
      created: '2026-10-01T12:00:00.000Z',
      done: false
    }
  ];

  const ids = Array.from(
    w.Mopapa.resurface.getToday(now)
  ).map(function (item) {
    return item.entry.id;
  });

  assert.deepStrictEqual(ids, ['unfinished']);
});

test('resurfacing safely ignores invalid creation dates', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  w.Mopapa.store.data().entries = [
    {
      id: 'invalid-date',
      text: 'Invalid date',
      room: 'notes',
      created: 'not-a-date',
      done: false
    },
    {
      id: 'valid-date',
      text: 'Valid date',
      room: 'notes',
      created: '2026-10-01T12:00:00.000Z',
      done: false
    }
  ];

  const ids = Array.from(
    w.Mopapa.resurface.getToday(now)
  ).map(function (item) {
    return item.entry.id;
  });

  assert.deepStrictEqual(ids, ['valid-date']);
});

test('anniversary memories appear before ordinary resurfaced memories', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  w.Mopapa.store.data().entries = [
    {
      id: 'ordinary',
      text: 'An older idea',
      room: 'ideas',
      created: '2026-10-01T12:00:00.000Z',
      done: false
    },
    {
      id: 'anniversary',
      text: 'A memory from this date',
      room: 'notes',
      created: '2024-11-04T12:00:00.000Z',
      done: false
    }
  ];

  const items = Array.from(
    w.Mopapa.resurface.getToday(now)
  );

  assert.strictEqual(items[0].entry.id, 'anniversary');
  assert.strictEqual(items[0].kind, 'anniversary');
  assert.strictEqual(items[1].entry.id, 'ordinary');
});

test('anniversary resurfacing identifies the original year', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  w.Mopapa.store.data().entries = [{
    id: 'anniversary',
    text: 'A memory from two years ago',
    room: 'notes',
    created: '2024-11-04T12:00:00.000Z',
    done: false
  }];

  const items = Array.from(
    w.Mopapa.resurface.getToday(now)
  );

  assert.strictEqual(
    items[0].label,
    'On this day in 2024'
  );
});

test('ordinary resurfaced memories use the memory shelf label', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  w.Mopapa.store.data().entries = [{
    id: 'ordinary',
    text: 'An older note',
    room: 'notes',
    created: '2026-10-01T12:00:00.000Z',
    done: false
  }];

  const items = Array.from(
    w.Mopapa.resurface.getToday(now)
  );

  assert.strictEqual(
    items[0].label,
    'From your memory shelf'
  );
});

test('resurfacing order is stable for repeated calls on the same day', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  w.Mopapa.store.data().entries = [
    {
      id: 'one',
      text: 'First memory',
      room: 'notes',
      created: '2026-10-01T12:00:00.000Z',
      done: false
    },
    {
      id: 'two',
      text: 'Second memory',
      room: 'ideas',
      created: '2026-10-02T12:00:00.000Z',
      done: false
    },
    {
      id: 'three',
      text: 'Third memory',
      room: 'wishlist',
      created: '2026-10-03T12:00:00.000Z',
      done: false
    }
  ];

  function order() {
    return Array.from(
      w.Mopapa.resurface.getToday(now)
    ).map(function (item) {
      return item.entry.id;
    });
  }

  assert.deepStrictEqual(order(), order());
});

test('resurfacing does not modify saved memory records', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  const entry = {
    id: 'unchanged',
    text: 'Keep this original memory',
    room: 'notes',
    created: '2026-10-01T12:00:00.000Z',
    done: false
  };

  w.Mopapa.store.data().entries = [entry];

  const before = JSON.stringify(entry);

  w.Mopapa.resurface.getToday(now);

  assert.strictEqual(
    JSON.stringify(entry),
    before
  );
});

test('resurfacing returns the original saved entry reference', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  const entry = {
    id: 'original-reference',
    text: 'Original saved memory',
    room: 'notes',
    created: '2026-10-01T12:00:00.000Z',
    done: false
  };

  w.Mopapa.store.data().entries = [entry];

  const items = Array.from(
    w.Mopapa.resurface.getToday(now)
  );

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].entry, entry);
});

test('seven calendar days qualifies even when less than 168 hours have elapsed', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 0, 1);
  const created = new Date(2026, 9, 28, 23, 59);

  w.Mopapa.store.data().entries = [{
    id: 'calendar-seven',
    text: 'Seven calendar days old',
    room: 'notes',
    created: created.toISOString(),
    done: false
  }];

  const items = Array.from(w.Mopapa.resurface.getToday(now));

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].entry.id, 'calendar-seven');
});

test('six calendar days does not qualify even when nearly 168 hours have elapsed', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 23, 59);
  const created = new Date(2026, 9, 29, 0, 1);

  w.Mopapa.store.data().entries = [{
    id: 'calendar-six',
    text: 'Six calendar days old',
    room: 'notes',
    created: created.toISOString(),
    done: false
  }];

  assert.strictEqual(
    Array.from(w.Mopapa.resurface.getToday(now)).length,
    0
  );
});

test('future-dated memories are excluded', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  w.Mopapa.store.data().entries = [{
    id: 'future',
    text: 'A future memory',
    room: 'notes',
    created: '2026-11-12T12:00:00.000Z',
    done: false
  }];

  assert.strictEqual(
    Array.from(w.Mopapa.resurface.getToday(now)).length,
    0
  );
});

test('anniversary does not activate one day before the original date', function () {
  const w = boot({});
  const now = new Date(2026, 10, 3, 12, 0);

  w.Mopapa.store.data().entries = [{
    id: 'anniversary-before',
    text: 'Original date is November fourth',
    room: 'notes',
    created: '2024-11-04T12:00:00.000Z',
    done: false
  }];

  const items = Array.from(w.Mopapa.resurface.getToday(now));

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].kind, 'shelf');
});

test('anniversary does not activate one day after the original date', function () {
  const w = boot({});
  const now = new Date(2026, 10, 5, 12, 0);

  w.Mopapa.store.data().entries = [{
    id: 'anniversary-after',
    text: 'Original date was November fourth',
    room: 'notes',
    created: '2024-11-04T12:00:00.000Z',
    done: false
  }];

  const items = Array.from(w.Mopapa.resurface.getToday(now));

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].kind, 'shelf');
});

test('February twenty ninth anniversary is recognised on a leap day', function () {
  const w = boot({});
  const now = new Date(2024, 1, 29, 12, 0);

  w.Mopapa.store.data().entries = [{
    id: 'leap-anniversary',
    text: 'A leap day memory',
    room: 'notes',
    created: '2020-02-29T12:00:00.000Z',
    done: false
  }];

  const items = Array.from(w.Mopapa.resurface.getToday(now));

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].kind, 'anniversary');
  assert.strictEqual(items[0].label, 'On this day in 2020');
});

test('February twenty ninth anniversary is not shifted to February twenty eighth', function () {
  const w = boot({});
  const now = new Date(2025, 1, 28, 12, 0);

  w.Mopapa.store.data().entries = [{
    id: 'leap-anniversary',
    text: 'A leap day memory',
    room: 'notes',
    created: '2020-02-29T12:00:00.000Z',
    done: false
  }];

  const items = Array.from(w.Mopapa.resurface.getToday(now));

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].kind, 'shelf');
});

test('February twenty ninth anniversary is not shifted to March first', function () {
  const w = boot({});
  const now = new Date(2025, 2, 1, 12, 0);

  w.Mopapa.store.data().entries = [{
    id: 'leap-anniversary',
    text: 'A leap day memory',
    room: 'notes',
    created: '2020-02-29T12:00:00.000Z',
    done: false
  }];

  const items = Array.from(w.Mopapa.resurface.getToday(now));

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].kind, 'shelf');
});

test('resurfacing order does not depend on storage entry order', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  const entries = [
    {
      id: 'order-one',
      text: 'First',
      room: 'notes',
      created: '2026-10-01T12:00:00.000Z',
      done: false
    },
    {
      id: 'order-two',
      text: 'Second',
      room: 'ideas',
      created: '2026-10-02T12:00:00.000Z',
      done: false
    },
    {
      id: 'order-three',
      text: 'Third',
      room: 'wishlist',
      created: '2026-10-03T12:00:00.000Z',
      done: false
    }
  ];

  w.Mopapa.store.data().entries = entries.slice();

  const firstOrder = Array.from(
    w.Mopapa.resurface.getToday(now)
  ).map(function (item) {
    return item.entry.id;
  });

  w.Mopapa.store.data().entries = entries.slice().reverse();

  const secondOrder = Array.from(
    w.Mopapa.resurface.getToday(now)
  ).map(function (item) {
    return item.entry.id;
  });

  assert.deepStrictEqual(firstOrder, secondOrder);
});

test('an eligible memory can resurface again on the following day', function () {
  const w = boot({});

  w.Mopapa.store.data().entries = [{
    id: 'repeat-memory',
    text: 'A memory that remains eligible',
    room: 'notes',
    created: '2026-10-01T12:00:00.000Z',
    done: false
  }];

  const firstDay = Array.from(
    w.Mopapa.resurface.getToday(new Date(2026, 10, 4, 12, 0))
  );

  const followingDay = Array.from(
    w.Mopapa.resurface.getToday(new Date(2026, 10, 5, 12, 0))
  );

  assert.strictEqual(firstDay.length, 1);
  assert.strictEqual(followingDay.length, 1);
  assert.strictEqual(followingDay[0].entry.id, 'repeat-memory');
});

test('legacy memories without a creation date are not resurfaced', function () {
  const w = boot({});

  w.Mopapa.store.data().entries = [{
    id: 'legacy-no-date',
    text: 'An older memory without a timestamp',
    room: 'notes',
    done: false
  }];

  const items = Array.from(
    w.Mopapa.resurface.getToday(new Date(2026, 10, 4, 12, 0))
  );

  assert.strictEqual(items.length, 0);
});

test('memories with null or empty creation dates are not resurfaced', function () {
  const w = boot({});

  w.Mopapa.store.data().entries = [
    {
      id: 'null-date',
      text: 'A memory with a null date',
      room: 'notes',
      created: null,
      done: false
    },
    {
      id: 'empty-date',
      text: 'A memory with an empty date',
      room: 'notes',
      created: '',
      done: false
    }
  ];

  const items = Array.from(
    w.Mopapa.resurface.getToday(new Date(2026, 10, 4, 12, 0))
  );

  assert.strictEqual(items.length, 0);
});

test('date-only ISO dates use their written local calendar date', function () {
  const w = boot({});

  w.Mopapa.store.data().entries = [{
    id: 'local-date-only',
    text: 'A date-only memory',
    room: 'notes',
    created: '2024-10-01',
    done: false
  }];

  const items = Array.from(
    w.Mopapa.resurface.getToday(new Date(2026, 9, 1, 12, 0))
  );

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].kind, 'anniversary');
  assert.strictEqual(items[0].label, 'On this day in 2024');
});

test('invalid date-only calendar dates are not resurfaced', function () {
  const w = boot({});

  w.Mopapa.store.data().entries = [{
    id: 'invalid-date-only',
    text: 'An impossible calendar date',
    room: 'notes',
    created: '2026-02-31',
    done: false
  }];

  const items = Array.from(
    w.Mopapa.resurface.getToday(new Date(2026, 10, 4, 12, 0))
  );

  assert.strictEqual(items.length, 0);
});

test('date-only ISO creation dates remain eligible when old enough', function () {
  const w = boot({});

  w.Mopapa.store.data().entries = [{
    id: 'date-only',
    text: 'A memory with a date-only timestamp',
    room: 'notes',
    created: '2026-10-01',
    done: false
  }];

  const items = Array.from(
    w.Mopapa.resurface.getToday(new Date(2026, 10, 4, 12, 0))
  );

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].entry.id, 'date-only');
});

test('creation timestamps with timezone offsets use their local calendar date', function () {
  const w = boot({});
  const created = new Date('2024-11-04T23:30:00-02:00');
  const now = new Date(
    2026,
    created.getMonth(),
    created.getDate(),
    12,
    0
  );

  w.Mopapa.store.data().entries = [{
    id: 'offset-anniversary',
    text: 'A memory with a timezone offset',
    room: 'notes',
    created: '2024-11-04T23:30:00-02:00',
    done: false
  }];

  const items = Array.from(
    w.Mopapa.resurface.getToday(now)
  );

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].kind, 'anniversary');
  assert.strictEqual(items[0].label, 'On this day in 2024');
});

test('multiple anniversaries all appear before ordinary memories', function () {
  const w = boot({});

  w.Mopapa.store.data().entries = [
    {
      id: 'ordinary',
      text: 'An ordinary old memory',
      room: 'notes',
      created: '2026-10-01T12:00:00.000Z',
      done: false
    },
    {
      id: 'anniversary-2022',
      text: 'A memory from 2022',
      room: 'ideas',
      created: '2022-11-04T12:00:00.000Z',
      done: false
    },
    {
      id: 'anniversary-2020',
      text: 'A memory from 2020',
      room: 'wishlist',
      created: '2020-11-04T12:00:00.000Z',
      done: false
    }
  ];

  const items = Array.from(
    w.Mopapa.resurface.getToday(new Date(2026, 10, 4, 12, 0))
  );

  assert.strictEqual(items.length, 3);
  assert.deepStrictEqual(
    items.slice(0, 2).map(function (item) {
      return item.kind;
    }),
    ['anniversary', 'anniversary']
  );
  assert.strictEqual(items[2].kind, 'shelf');
});

test('multiple anniversaries retain their individual original years', function () {
  const w = boot({});

  w.Mopapa.store.data().entries = [
    {
      id: 'anniversary-2021',
      text: 'Memory from 2021',
      room: 'notes',
      created: '2021-11-04T12:00:00.000Z',
      done: false
    },
    {
      id: 'anniversary-2019',
      text: 'Memory from 2019',
      room: 'notes',
      created: '2019-11-04T12:00:00.000Z',
      done: false
    }
  ];

  const items = Array.from(
    w.Mopapa.resurface.getToday(new Date(2026, 10, 4, 12, 0))
  );

  const years = items.map(function (item) {
    return item.label;
  });

  assert.strictEqual(items.length, 2);
  assert.ok(years.includes('On this day in 2021'));
  assert.ok(years.includes('On this day in 2019'));
});

test('anniversary matching uses the calendar date rather than time of day', function () {
  const w = boot({});

  w.Mopapa.store.data().entries = [{
    id: 'late-anniversary',
    text: 'A memory saved late in the day',
    room: 'notes',
    created: '2024-11-04T23:59:59.000Z',
    done: false
  }];

  const items = Array.from(
    w.Mopapa.resurface.getToday(new Date(2026, 10, 4, 8, 0))
  );

  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].kind, 'anniversary');
});

test('anniversary ordering is independent of storage order', function () {
  const w = boot({});
  const now = new Date(2026, 10, 4, 12, 0);

  const entries = [
    {
      id: 'ordinary-a',
      text: 'Ordinary memory A',
      room: 'notes',
      created: '2026-10-01T12:00:00.000Z',
      done: false
    },
    {
      id: 'anniversary-a',
      text: 'Anniversary A',
      room: 'notes',
      created: '2022-11-04T12:00:00.000Z',
      done: false
    },
    {
      id: 'ordinary-b',
      text: 'Ordinary memory B',
      room: 'ideas',
      created: '2026-09-01T12:00:00.000Z',
      done: false
    },
    {
      id: 'anniversary-b',
      text: 'Anniversary B',
      room: 'wishlist',
      created: '2020-11-04T12:00:00.000Z',
      done: false
    }
  ];

  function order() {
    return Array.from(
      w.Mopapa.resurface.getToday(now)
    ).map(function (item) {
      return item.entry.id;
    });
  }

  w.Mopapa.store.data().entries = entries.slice();
  const firstOrder = order();

  w.Mopapa.store.data().entries = entries.slice().reverse();
  const secondOrder = order();

  assert.deepStrictEqual(firstOrder, secondOrder);
});

test('tax-related direct instructions are confidently classified as to-dos', function () {
  const w = boot({});

  const examples = [
    'Do my taxes by Friday',
    'Do my tax return by Friday',
    'Please file my taxes by Friday',
    'Submit my tax return next week'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(
      text,
      w.Mopapa.rules.parse(text, new Date(2026, 9, 21, 10, 0))
    );

    assert.strictEqual(
      result.room,
      'todo',
      'Tax instruction should be a To-do: ' + text
    );

    assert.strictEqual(result.confident, true);
  });
});

test('dated boiler-service task intentions are classified as to-dos', function () {
  const w = boot({});

  const examples = [
    'I need to book boiler service in March',
    'I should arrange boiler service next month',
    'I must renew the boiler cover by Friday'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(
      text,
      w.Mopapa.rules.parse(text, new Date(2026, 9, 21, 10, 0))
    );

    assert.strictEqual(
      result.room,
      'todo',
      'Boiler-service task should be a To-do: ' + text
    );

    assert.strictEqual(result.confident, true);
  });
});

test('boiler-service questions are not confidently classified as tasks', function () {
  const w = boot({});

  const examples = [
    'Is boiler service due in March?',
    'Should I book boiler service in March?',
    'Does the boiler need servicing next month?',
    'When is the boiler service due?'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(
      text,
      w.Mopapa.rules.parse(text, new Date(2026, 9, 21, 10, 0))
    );

    assert.notStrictEqual(
      result.confident && result.room === 'todo',
      true,
      'Question was incorrectly classified as a To-do: ' + text
    );
  });
});

test('negative tax and maintenance instructions are not classified as tasks', function () {
  const w = boot({});

  const examples = [
    'Do not do my taxes by Friday',
    "Don't file my tax return yet",
    'Never book boiler service without checking',
    'I should not arrange boiler service in March'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.notStrictEqual(
      result.confident && result.room === 'todo',
      true,
      'Negative instruction was incorrectly classified as a To-do: ' + text
    );
  });
});

test('boiler-service questions with question marks are recognised as questions', function () {
  const w = boot({});

  const examples = [
    'Is boiler service due in March?',
    'Should I book boiler service?',
    'When is the boiler service due?'
  ];

  examples.forEach(function (text) {
    assert.strictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Question should be recognised: ' + text
    );
  });
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

test('first-person task intentions are classified as to-dos', function () {
  const w = boot({});

  const examples = [
    'I need to renew my passport next month',
    'I have to pay council tax',
    'I should call the dentist',
    'I must email the council',
    'I plan to submit the application',
    'I intend to book the appointment',
    'We need to arrange the collection',
    'I really need to finish the form',
    'I definitely plan to contact the solicitor',
    'I need to review the tenancy agreement',
    'I have to update my address',
    'We plan to repair the garden gate',
    'I intend to install the printer',
    'I must replace the broken tap',
    'I should fill out the application',
    'I need to back up my phone',
    'We have to set up online banking',
    'I plan to download the documents'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.strictEqual(
      result.room,
      'todo',
      'Expected a To-do classification for: ' + text
    );

    assert.strictEqual(
      result.confident,
      true,
      'Task intention was not recognised confidently: ' + text
    );
  });
});

test('direct action commands are classified as to-dos', function () {
  const w = boot({});

  const examples = [
    'Call the dentist tomorrow',
    'Pay the electricity bill',
    'Email the council',
    'Renew my passport',
    'Please send the application',
    'Review the tenancy agreement',
    'Update my address',
    'Fix the leaking tap',
    'Install the printer',
    'Download the council form',
    'Print the application',
    'Sign the consent form',
    'Set up online banking',
    'Back up my phone',
    'Fill out the application',
    'Buy a new laptop',
    'Delete the duplicate files',
    'Water the plants'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.strictEqual(
      result.room,
      'todo',
      'Expected a To-do classification for: ' + text
    );

    assert.strictEqual(
      result.confident,
      true,
      'Action was not recognised confidently: ' + text
    );
  });
});

test('multi-word task actions are recognised correctly', function () {
  const w = boot({});

  const examples = [
    'Fill in the registration form',
    'Fill out the council application',
    'Set up the new router',
    'Log in to the account',
    'Back up my photographs',
    'Hand in the completed form',
    'Sort out the paperwork',
    'Look into the repair costs',
    'Write down the reference number',
    'Get in touch with the solicitor'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.strictEqual(
      result.room,
      'todo',
      'Multi-word action was not classified as a To-do: ' + text
    );

    assert.strictEqual(result.confident, true);
  });
});

test('remember and do not forget instructions are classified as to-dos', function () {
  const w = boot({});

  const examples = [
    'Remember to book the vet',
    'Please remember to renew the passport',
    'Do not forget to pay the bill',
    "Don't forget to call the dentist",
    'Never forget to renew my passport'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.strictEqual(result.room, 'todo');
    assert.strictEqual(result.confident, true);
  });
});

test('negative instructions are not confidently classified as tasks', function () {
  const w = boot({});

  const examples = [
    'Do not renew my passport',
    'Please do not call the dentist',
    "Don't pay the electricity bill",
    'Never contact the council',
    'Do not delete the duplicate files',
    'Never install that application',
    "Don't update my address yet",
    'I do not need to renew my passport',
    'I should not call the dentist',
    'I must not submit the application'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.notStrictEqual(
      result.confident && result.room === 'todo',
      true,
      'Negative instruction was incorrectly classified as a task: ' + text
    );
  });
});

test('need to know is not automatically classified as a task', function () {
  const w = boot({});

  const result = w.Mopapa.sorter.classify(
    'I need to know how passport renewal works',
    null
  );

  assert.notStrictEqual(
    result.confident && result.room === 'todo',
    true
  );
});

test('should understand is not automatically classified as a task', function () {
  const w = boot({});

  const result = w.Mopapa.sorter.classify(
    'I should understand how the boiler works',
    null
  );

  assert.notStrictEqual(
    result.confident && result.room === 'todo',
    true
  );
});

test('questions beginning do I or do you are not direct tasks', function () {
  const w = boot({});

  const examples = [
    'Do I need to pay council tax?',
    'Do you think I should call the dentist?',
    'Does my passport need renewing?',
    'Did I need to submit that form?',
    'Do I need to review the tenancy agreement?',
    'Do you want me to update the address?'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.notStrictEqual(
      result.confident && result.room === 'todo',
      true,
      'Question was incorrectly classified as a task: ' + text
    );
  });
});

test('hypothetical intentions are not confidently classified as tasks', function () {
  const w = boot({});

  const examples = [
    'If I need to renew my passport',
    'I might need to call the dentist',
    'Maybe I should pay council tax',
    'I could submit the application'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.notStrictEqual(
      result.confident && result.room === 'todo',
      true,
      'Hypothetical statement was classified as a task: ' + text
    );
  });
});

test('quoted task instructions are not confidently classified as tasks', function () {
  const w = boot({});

  const examples = [
    '"Call the dentist tomorrow"',
    "'Please complete the application by Friday'",
    'The phrase "renew my passport" appears in this note'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.notStrictEqual(
      result.confident && result.room === 'todo',
      true,
      'Quoted instruction was classified as a task: ' + text
    );
  });
});

test('reported instructions are not automatically classified as tasks', function () {
  const w = boot({});

  const examples = [
    'The email says to call the dentist tomorrow',
    'My partner asked me to renew the passport',
    'The note says I should pay council tax'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.notStrictEqual(
      result.confident && result.room === 'todo',
      true,
      'Reported instruction was classified as a task: ' + text
    );
  });
});

test('indirect questions are not confidently classified as tasks', function () {
  const w = boot({});

  const examples = [
    'Should I call the dentist?',
    'Could I renew my passport?',
    'Would it be sensible to pay council tax?',
    'Might I need to submit the application?'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.notStrictEqual(
      result.confident && result.room === 'todo',
      true,
      'Indirect question was classified as a task: ' + text
    );
  });
});

test('completed actions are not automatically classified as new tasks', function () {
  const w = boot({});

  const examples = [
    'I called the dentist yesterday',
    'I already paid the electricity bill',
    'We submitted the application last week'
  ];

  examples.forEach(function (text) {
    const result = w.Mopapa.sorter.classify(text, null);

    assert.notStrictEqual(
      result.confident && result.room === 'todo',
      true,
      'Completed action was classified as a new task: ' + text
    );
  });
});

test('how do I questions are not direct task instructions', function () {
  const w = boot({});

  const result = w.Mopapa.sorter.classify(
    'How do I renew my passport?',
    null
  );

  assert.notStrictEqual(
    result.confident && result.room === 'todo',
    true
  );
});

test('wishlist buying intentions remain in the wish list', function () {
  const w = boot({});

  const result = w.Mopapa.sorter.classify(
    'I want to buy a new laptop',
    null
  );

  assert.strictEqual(result.room, 'wishlist');
  assert.strictEqual(result.confident, true);
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
  assert.strictEqual(intent.isWhenQuestion("When's my dentist appointment?"), true);
  assert.strictEqual(intent.isWhenQuestion("What's the date of my dentist appointment?"), true);
  assert.strictEqual(intent.isWhenQuestion("What's the time of my dentist appointment?"), true);  
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

test('question detection recognises doctor-related sentence fragments', function () {
  const w = boot({});

  const statements = [
    'What the doctor said about surgery',
    'What our GP recommended yesterday',
    'When my appointment is',
    'When the doctor called',
    'Where the spare key belongs',
    'Where our passports are',
    'How the boiler works',
    'How my mum felt after surgery',
    'Who the parcel is for',
    'Why the medication changed',
    'What your doctor recommended',
    'What your mum said about the appointment',
    'When your next appointment is',
    'When its warranty expires',
    'Where your passport is kept',
    'Where your spare keys belong',
    'Who your doctor is',
    'Who its previous owner was',
    'How your boiler works',
    'Why your car insurance changed'
  ];

  statements.forEach(function (text) {
    assert.notStrictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Should be filed as a statement: ' + text
    );
  });
});

test('question detection distinguishes possessive fragments from direct questions', function () {
  const w = boot({});

  const cases = [
    { text: 'What your doctor recommended', expected: null },
    { text: 'Where your passport is kept', expected: null },
    { text: 'Who your doctor is', expected: null },
    { text: 'How its engine works', expected: null },
    { text: 'What is your doctor recommending', expected: 'sure' },
    { text: 'Where is your passport', expected: 'sure' },
    { text: 'Who is your doctor', expected: 'sure' },
    { text: 'How does its engine work', expected: 'sure' }
  ];

  cases.forEach(function (item) {
    assert.strictEqual(
      w.Mopapa.rules.questionLevel(item.text),
      item.expected,
      'Unexpected question classification: ' + item.text
    );
  });
});

test('boiler and appointment sentence fragments are not treated as direct questions', function () {
  const w = boot({});

  const fragments = [
    'When my boiler service is due',
    'When the boiler service needs doing',
    'What the engineer said about the boiler',
    'Where the boiler service paperwork is'
  ];

  fragments.forEach(function (text) {
    assert.notStrictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Sentence fragment should not be treated as a direct question: ' + text
    );
  });
});

test('question detection recognises is and are questions with bare noun subjects', function () {
  const w = boot({});

  const questions = [
    'Is boiler service due in March',
    'Are annual checks required for landlords',
    'Is replacement cover included',
    'Are spare keys in the kitchen drawer'
  ];

  questions.forEach(function (text) {
    assert.strictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Bare noun question should be recognised: ' + text
    );
  });
});

test('question detection recognises be-verb questions with longer subjects', function () {
  const w = boot({});

  const questions = [
    'Is the boiler service due in March',
    'Are the replacement filters available',
    'Is my new insurance policy active',
    'Are the annual maintenance checks included'
  ];

  questions.forEach(function (text) {
    assert.strictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Be-verb question should be recognised: ' + text
    );
  });
});

test('question detection does not treat passive fragments as direct questions', function () {
  const w = boot({});

  const fragments = [
    'Is required to renew boiler cover',
    'Are expected to attend the appointment',
    'Is being repaired by the engineer',
    'Are told to wait outside'
  ];

  fragments.forEach(function (text) {
    assert.notStrictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Passive fragment should not be treated as a direct question: ' + text
    );
  });
});

test('question detection leaves subject-first boiler statements unchanged', function () {
  const w = boot({});

  const statements = [
    'The boiler service is due in March',
    'Our annual check is due next month',
    'Boiler cover includes the annual service',
    'The replacement filters are available'
  ];

  statements.forEach(function (text) {
    assert.notStrictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Statement should not be treated as a direct question: ' + text
    );
  });
});

test('question detection recognises auxiliary questions with bare noun subjects', function () {
  const w = boot({});

  const questions = [
    'Do my keys fit',    
    'Does boiler service need doing',
    'Do annual checks require a certificate',
    'Did the engineer include the replacement parts',
    'Can boiler service be booked online',
    'Should annual checks be recorded',
    'Will replacement cover include the service',
    'Have annual checks been completed',
    'Has the engineer sent the report'
  ];

  questions.forEach(function (text) {
    assert.strictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Auxiliary question should be recognised: ' + text
    );
  });
});

test('question detection recognises a wider range of auxiliary question verbs', function () {
  const w = boot({});

  const questions = [
    'Do annual gas safety checks apply to landlords',
    'Do spare keys belong in the kitchen drawer',
    'Can the engineer come tomorrow',
    'Does the engineer know the appointment date',
    'Can annual checks happen remotely',
    'Will the engineer provide a certificate',
    'Does the appointment start at 10',
    'Does the boiler repair affect the warranty',
    'Can the engineer attend on Friday',
    'Will the replacement cover remain active',
    'Does the repair matter',
    'Can the replacement parts arrive tomorrow'
  ];

  questions.forEach(function (text) {
    assert.strictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Auxiliary question should be recognised: ' + text
    );
  });
});

test('expanded auxiliary question detection does not misclassify task instructions', function () {
  const w = boot({});

  const statements = [
    'Do my taxes by Friday',
    'Do the washing before lunch',
    'Have my passport renewed by June',
    'Do not forget to renew boiler cover',
    'Should be completed before the appointment',
    'Can be booked through the engineer',
    'Will be repaired by the end of the week'
  ];

  statements.forEach(function (text) {
    assert.notStrictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Instruction or fragment should not be treated as a question: ' + text
    );
  });
});

test('question detection does not treat auxiliary-led fragments as direct questions', function () {
  const w = boot({});

  const fragments = [
    'Do not forget to renew boiler cover',
    'Should be completed before the appointment',
    'Can be booked through the engineer',
    'Have been waiting for the replacement parts',
    'Will be repaired by the end of the week'
  ];

  fragments.forEach(function (text) {
    assert.notStrictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Auxiliary-led fragment should not be treated as a direct question: ' + text
    );
  });
});

test('question detection preserves ordinary statements after auxiliary words', function () {
  const w = boot({});

  const statements = [
    'The engineer can book the service online',
    'Annual checks should be recorded',
    'The replacement parts will arrive tomorrow',
    'We have completed the annual check'
  ];

  statements.forEach(function (text) {
    assert.notStrictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Subject-first statement should not be treated as a direct question: ' + text
    );
  });
});

test('question detection still recognises direct questions without question marks', function () {
  const w = boot({});

  const questions = [
    'What is the dentist number',
    'When is the appointment',
    'Where are my keys',
    'Who is the parcel for',
    'How do I reset the boiler',
    'Which one should I choose',
    'Why did the boiler stop',
    'Whose keys are these'
  ];

  questions.forEach(function (text) {
    assert.strictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure',
      'Should be recognised as a question: ' + text
    );
  });
});


test('question detection preserves explicit question marks', function () {
  const w = boot({});

  const questions = [
    'What the doctor said about surgery?',
    'When my appointment is?',
    'Where the spare key belongs?'
  ];

  questions.forEach(function (text) {
    assert.strictEqual(
      w.Mopapa.rules.questionLevel(text),
      'sure'
    );
  });
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

test('entry deletion preserves the exact original saved record', function () {
  const initial = stored([
    {
      id: 'recovery-delete',
      text: 'Passport is in the desk drawer',
      room: 'notes',
      created: ago(1)
    }
  ]);

  const originalRaw = initial['mopapa.v1'];
  const w = boot(initial);

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.entries.remove('recovery-delete'),
    true
  );

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 1);
  assert.strictEqual(
    w.localStorage.getItem(copies[0].key),
    originalRaw
  );

  assert.strictEqual(
    w.Mopapa.store.data().entries.length,
    0
  );

  assert.strictEqual(
    JSON.parse(w.localStorage.getItem('mopapa.v1')).entries.length,
    0
  );
});

test('entry deletion is cancelled when its recovery copy cannot be created', function () {
  const initial = stored([
    {
      id: 'recovery-failure',
      text: 'Keep this memory',
      room: 'notes',
      created: ago(1)
    }
  ]);

  const w = boot(initial);
  w.Mopapa.store.load();

  const originalSetItem = w.localStorage.setItem;

  w.localStorage.setItem = function (key, value) {
    if (key.indexOf('mopapa.v1.recovery.') === 0) {
      throw new Error('simulated recovery-copy failure');
    }

    return originalSetItem.call(this, key, value);
  };

  assert.strictEqual(
    w.Mopapa.entries.remove('recovery-failure'),
    false
  );

  assert.strictEqual(w.Mopapa.store.saveError(), 'recovery');

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].text,
    'Keep this memory'
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    initial['mopapa.v1']
  );

  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 0);
});

test('entry deletion is cancelled in read-only mode without creating a recovery copy', function () {
  const w = boot(stored([
    {
      id: 'readonly-delete',
      text: 'Keep this memory',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();
  w.Mopapa.store.setWriteMode('readonly');

  assert.strictEqual(
    w.Mopapa.entries.remove('readonly-delete'),
    false
  );

  assert.strictEqual(w.Mopapa.store.saveError(), 'readonly');

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].text,
    'Keep this memory'
  );

  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 0);
});

test('entry deletion is cancelled when another tab changes saved data', function () {
  const w = boot(stored([
    {
      id: 'concurrent-delete',
      text: 'Original memory',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const newerRaw = JSON.stringify({
    entries: [
      {
        id: 'newer-memory',
        text: 'Newer saved memory',
        room: 'notes',
        created: new Date().toISOString()
      }
    ],
    learned: {},
    customRooms: [],
    ask: {
      aliases: [],
      boosts: {},
      unanswered: []
    }
  });

  w.localStorage.setItem('mopapa.v1', newerRaw);

  assert.strictEqual(
    w.Mopapa.entries.remove('concurrent-delete'),
    false
  );

  assert.strictEqual(w.Mopapa.store.saveError(), 'conflict');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    newerRaw
  );

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].text,
    'Original memory'
  );

  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 0);
});

test('entry deletion rolls back if saving fails after recovery preservation', function () {
  const w = boot(stored([
    {
      id: 'rollback-delete',
      text: 'Keep this original memory',
      room: 'notes',
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  const originalRaw = w.localStorage.getItem('mopapa.v1');
  const originalSetItem = w.localStorage.setItem;

  w.localStorage.setItem = function (key, value) {
    if (key === 'mopapa.v1') {
      throw new Error('simulated main storage failure');
    }

    return originalSetItem.call(this, key, value);
  };

  assert.strictEqual(
    w.Mopapa.entries.remove('rollback-delete'),
    false
  );

  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].text,
    'Keep this original memory'
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    originalRaw
  );

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 1);
  assert.strictEqual(
    w.localStorage.getItem(copies[0].key),
    originalRaw
  );
});

test('saving unchanged entry text preserves its source choices', function () {
  const ask = {
    aliases: [],
    boosts: {
      cost: { unchanged: 2 },
      date: { unchanged: 1 }
    },
    unanswered: []
  };

  const w = boot(stored([
    {
      id: 'unchanged',
      text: 'Car service £100',
      room: 'notes',
      created: ago(1)
    }
  ], {}, ask));

  w.Mopapa.store.load();

  const before = JSON.stringify(
    w.Mopapa.store.data().ask.boosts
  );

  assert.strictEqual(
    w.Mopapa.entries.updateText(
      'unchanged',
      'Car service £100'
    ),
    true
  );

  assert.strictEqual(
    JSON.stringify(w.Mopapa.store.data().ask.boosts),
    before
  );
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

test('moving an entry to its existing room preserves its date and completion state', function () {
  const future = new Date(Date.now() + 2 * 86400000).toISOString();

  const w = boot(stored([
    {
      id: 'same-room',
      text: 'Existing appointment',
      room: 'appointments',
      when: future,
      hasTime: true,
      done: true,
      created: ago(1)
    }
  ]));

  w.Mopapa.store.load();

  let writes = 0;
  const originalSetItem = w.localStorage.setItem;

  w.localStorage.setItem = function (key, value) {
    if (key === 'mopapa.v1') writes++;
    return originalSetItem.call(this, key, value);
  };

  assert.strictEqual(
    w.Mopapa.entries.move('same-room', 'appointments'),
    true
  );

  const entry = w.Mopapa.entries.byRoom('appointments')[0];

  assert.strictEqual(entry.room, 'appointments');
  assert.strictEqual(entry.when, future);
  assert.strictEqual(entry.hasTime, true);
  assert.strictEqual(entry.done, true);
  assert.strictEqual(writes, 0);
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

test('saving unchanged tags does not write to storage', function () {
  const w = boot(stored([
    {
      id: 'same-tags',
      text: 'A tagged memory',
      room: 'notes',
      tags: ['Home', 'Important'],
      created: new Date().toISOString()
    }
  ]));

  w.Mopapa.store.load();

  let writes = 0;
  const originalSetItem = w.localStorage.setItem;

  w.localStorage.setItem = function (key, value) {
    if (key === 'mopapa.v1') writes++;
    return originalSetItem.call(this, key, value);
  };

  assert.strictEqual(
    w.Mopapa.entries.setTags('same-tags', ['Home', 'Important']),
    true
  );

  assert.strictEqual(writes, 0);
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

test('custom room reload does not repair entries when storage is unavailable', function () {
  const w = boot(stored());
  w.Mopapa.store.load();

  w.Mopapa.store.data().storageUnavailable = true;
  w.Mopapa.store.data().entries.push({
    id: 'orphan',
    text: 'An entry with an unknown room',
    room: 'custom_missing'
  });

  const before = JSON.stringify(w.Mopapa.store.data().entries);

  w.Mopapa.customRooms.init();

  assert.strictEqual(
    JSON.stringify(w.Mopapa.store.data().entries),
    before
  );

  assert.strictEqual(
    w.Mopapa.store.data().roomRepairSaveFailed,
    undefined
  );

  assert.strictEqual(w.Mopapa.store.saveError(), null);
});

test('custom room operations revert when storage is unavailable', function () {
  const w = boot(stored());
  w.Mopapa.store.load();

  w.Mopapa.store.data().storageUnavailable = true;

  const room = {
    id: 'custom_books',
    name: 'Books',
    icon: 'book'
  };

  w.Mopapa.store.data().customRooms.push(room);
  w.Mopapa.rooms.push({
    id: room.id,
    name: room.name,
    icon: room.icon,
    dated: false,
    words: ['Books']
  });

  const added = w.Mopapa.customRooms.add('Travel', 'plane');
  const renamed = w.Mopapa.customRooms.rename('custom_books', 'Reading');
  const removed = w.Mopapa.customRooms.remove('custom_books');

  assert.strictEqual(added.ok, false);
  assert.strictEqual(renamed.ok, false);
  assert.strictEqual(removed.ok, false);

  assert.strictEqual(
    w.Mopapa.store.data().customRooms.length,
    1
  );

  assert.strictEqual(
    w.Mopapa.store.data().customRooms[0].name,
    'Books'
  );

  assert.strictEqual(
    w.Mopapa.rooms.some(function (item) {
      return item.id === 'custom_books' && item.name === 'Books';
    }),
    true
  );
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

test('custom room deletion preserves the exact original data before moving entries', function () {
  const original = {
    entries: [
      {
        id: 'book-entry',
        text: 'The important book is on the shelf',
        room: 'custom_books'
      }
    ],
    learned: {},
    customRooms: [
      { id: 'custom_books', name: 'Books', icon: 'book' }
    ],
    ask: {
      aliases: [],
      boosts: {},
      unanswered: []
    }
  };

  const w = boot({
    'mopapa.v1': JSON.stringify(original)
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const result = w.Mopapa.customRooms.remove('custom_books');

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.moved, 1);

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 1);
  assert.strictEqual(copies[0].kind, 'recovery');

  const preserved = JSON.parse(
    w.localStorage._[copies[0].key]
  );

  assert.strictEqual(
    preserved.entries[0].room,
    'custom_books'
  );

  assert.strictEqual(
    preserved.customRooms[0].name,
    'Books'
  );

  const saved = JSON.parse(
    w.localStorage.getItem('mopapa.v1')
  );

  assert.strictEqual(saved.entries[0].room, 'notes');
  assert.strictEqual(saved.customRooms.length, 0);
});

test('custom room deletion is cancelled when its recovery copy cannot be preserved', function () {
  const original = {
    entries: [
      {
        id: 'book-entry',
        text: 'The important book is on the shelf',
        room: 'custom_books'
      }
    ],
    learned: {},
    customRooms: [
      { id: 'custom_books', name: 'Books', icon: 'book' }
    ],
    ask: {
      aliases: [],
      boosts: {},
      unanswered: []
    }
  };

  const w = boot({
    'mopapa.v1': JSON.stringify(original)
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const originalSetItem = w.localStorage.setItem;

  w.localStorage.setItem = function (key, value) {
    if (key.indexOf('mopapa.v1.recovery.') === 0) {
      throw new Error('simulated recovery-copy failure');
    }

    return originalSetItem.call(this, key, value);
  };

  const result = w.Mopapa.customRooms.remove('custom_books');

  assert.strictEqual(result.ok, false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'recovery');

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].room,
    'custom_books'
  );

  assert.strictEqual(
    w.Mopapa.store.data().customRooms[0].name,
    'Books'
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    JSON.stringify(original)
  );

  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 0);
});

test('custom room deletion is cancelled when saved data changes in another tab', function () {
  const original = {
    entries: [
      {
        id: 'book-entry',
        text: 'The important book is on the shelf',
        room: 'custom_books'
      }
    ],
    learned: {},
    customRooms: [
      { id: 'custom_books', name: 'Books', icon: 'book' }
    ],
    ask: {
      aliases: [],
      boosts: {},
      unanswered: []
    }
  };

  const w = boot({
    'mopapa.v1': JSON.stringify(original)
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();

  const newerRaw = JSON.stringify({
    entries: [
      {
        id: 'newer-entry',
        text: 'A newer saved memory',
        room: 'notes'
      }
    ],
    learned: {},
    customRooms: [],
    ask: {
      aliases: [],
      boosts: {},
      unanswered: []
    }
  });

  w.localStorage.setItem('mopapa.v1', newerRaw);

  const result = w.Mopapa.customRooms.remove('custom_books');

  assert.strictEqual(result.ok, false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'conflict');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    newerRaw
  );

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].room,
    'custom_books'
  );

  assert.strictEqual(
    w.Mopapa.store.data().customRooms[0].name,
    'Books'
  );

  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 0);
});

test('custom room deletion does not create recovery copies in read-only mode', function () {
  const original = {
    entries: [
      {
        id: 'book-entry',
        text: 'The important book is on the shelf',
        room: 'custom_books'
      }
    ],
    learned: {},
    customRooms: [
      { id: 'custom_books', name: 'Books', icon: 'book' }
    ],
    ask: {
      aliases: [],
      boosts: {},
      unanswered: []
    }
  };

  const w = boot({
    'mopapa.v1': JSON.stringify(original)
  });

  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();
  w.Mopapa.store.setWriteMode('readonly');

  const result = w.Mopapa.customRooms.remove('custom_books');

  assert.strictEqual(result.ok, false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'readonly');

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].room,
    'custom_books'
  );

  assert.strictEqual(
    w.Mopapa.store.data().customRooms[0].name,
    'Books'
  );

  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 0);
});

test('custom room rename is cancelled when saved data changes in another tab', function() {
  const original = {
    entries: [],
    learned: {},
    customRooms: [
      { id: 'custom_books', name: 'Books', icon: 'book' }
    ],
    ask: {
      aliases: [],
      boosts: {},
      unanswered: []
    }
  };
  
  const w = boot({
    'mopapa.v1': JSON.stringify(original)
  });
  
  w.Mopapa.store.load();
  w.Mopapa.customRooms.init();
  
  const newerRaw = JSON.stringify({
    entries: [],
    learned: {},
    customRooms: [
      { id: 'custom_books', name: 'Reading', icon: 'book' }
    ],
    ask: {
      aliases: [],
      boosts: {},
      unanswered: []
    }
  });
  
  w.localStorage.setItem('mopapa.v1', newerRaw);
  
  const result = w.Mopapa.customRooms.rename(
    'custom_books',
    'Library'
  );
  
  assert.strictEqual(result.ok, false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'conflict');
  
  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    newerRaw
  );
  
  assert.strictEqual(
    w.Mopapa.store.data().customRooms[0].name,
    'Books'
  );
  
  assert.strictEqual(
    w.Mopapa.rooms.filter(function(room) {
      return room.id === 'custom_books';
    })[0].name,
    'Books'
  );
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
      boosts: {
        'gp doctor': {
          restored: 2
        }
      },
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
  assert.strictEqual(
    w.Mopapa.store.data().ask.boosts['gp doctor'].restored,
    2
  );
  assert.strictEqual(w.Mopapa.store.data().ask.unanswered.length, 1);

  const saved = JSON.parse(w.localStorage._['mopapa.v1']);
  assert.strictEqual(saved.entries[0].id, 'restored');
});

test('restore preserves the exact existing record before replacing it', function () {
  const w = boot(stored([
    { id: 'existing', text: 'Existing memory', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const before = w.localStorage.getItem('mopapa.v1');

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
          { id: 'restored', text: 'Restored memory', room: 'notes' }
        ]
      })
    },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, true);

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 1);
  assert.strictEqual(
    w.localStorage.getItem(copies[0].key),
    before
  );
  assert.strictEqual(
    w.Mopapa.store.data().entries[0].id,
    'restored'
  );
});

test('restore is cancelled when the current record changes during file reading', function () {
  const w = boot(stored([
    { id: 'existing', text: 'Existing memory', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const before = w.localStorage.getItem('mopapa.v1');
  const externalChange = JSON.stringify({
    entries: [
      { id: 'external', text: 'Newer external memory', room: 'notes' }
    ]
  });

  w.FileReader = function () {
    this.readAsText = function (file) {
      w.localStorage._['mopapa.v1'] = externalChange;
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
          { id: 'restored', text: 'Restored memory', room: 'notes' }
        ]
      })
    },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'conflict');
  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    externalChange
  );
  assert.strictEqual(
    w.Mopapa.store.data().entries[0].id,
    'existing'
  );
  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 0);
  assert.notStrictEqual(before, externalChange);
});

test('restore is cancelled when the existing record cannot be preserved', function () {
  const w = boot(stored([
    { id: 'existing', text: 'Existing memory', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const before = w.localStorage.getItem('mopapa.v1');

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
      size: 100,
      content: JSON.stringify({
        entries: [
          { id: 'restored', text: 'Restored memory', room: 'notes' }
        ]
      })
    },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'recovery');
  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    before
  );
  assert.strictEqual(
    w.Mopapa.store.data().entries[0].id,
    'existing'
  );
  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 0);
});

test('read-only restore is rejected before creating a recovery copy', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.setWriteMode('readonly');
  w.Mopapa.store.load();

  const before = w.localStorage._['mopapa.v1'];

  let result = null;

  w.Mopapa.store.importJSON(
    { size: 20 },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'readonly');
  assert.strictEqual(w.localStorage._['mopapa.v1'], before);
  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 0);
});

test('restore is cancelled if tab becomes read-only while file is being read', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const before = w.localStorage._['mopapa.v1'];

  let reader = null;
  let result = null;

  w.FileReader = function () {
    reader = this;

    this.readAsText = function () {};
  };

  w.Mopapa.store.importJSON(
    { size: 20 },
    function (ok) { result = ok; }
  );

  assert.ok(reader);

  w.Mopapa.store.setWriteMode('readonly');

  reader.result = JSON.stringify({
    entries: [
      { id: 'replacement', text: 'Replacement entry', room: 'notes' }
    ]
  });

  reader.onload();

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'readonly');
  assert.strictEqual(w.localStorage._['mopapa.v1'], before);
  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 0);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
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

test('new restore attempts clear stale storage errors before reading', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  w.localStorage.failWrites = true;
  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');

  w.localStorage.failWrites = false;

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
  assert.strictEqual(w.Mopapa.store.saveError(), null);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
});

test('new restore attempts clear stale errors when file reading fails', function () {
  const w = boot(stored());

  w.Mopapa.store.load();

  w.localStorage.failWrites = true;
  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');

  w.localStorage.failWrites = false;

  w.FileReader = function () {
    this.readAsText = function () {
      this.onerror();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    { size: 20 },
    function (ok) { result = ok; }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.saveError(), null);
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
    { id: 'bad-fact', text: 'Bad fact', room: 'notes', fact: { attr: 'location', items: ['keys'] } },
    { id: 'numeric-date', text: 'Numeric date', room: 'notes', when: 123 },
    { id: 'null-created', text: 'Null creation date', room: 'notes', created: null },
    { id: 'non-string-tag', text: 'Non-string tag', room: 'notes', tags: ['home', 7] },
    { id: 'blank-tag', text: 'Blank tag', room: 'notes', tags: ['   '] },
    { id: 'null-amount', text: 'Null structured amount', room: 'notes', amounts: [null] },
    { id: 'object-amount', text: 'Object structured amount', room: 'notes', amount: { value: 12 } },
    { id: 'wrong-fact-attribute', text: 'Wrong fact attribute', room: 'notes', fact: { attr: 'person', items: ['keys'], prep: 'in', where: 'drawer', value: 'in drawer', plural: false } },
    { id: 'empty-fact-items', text: 'Empty fact items', room: 'notes', fact: { attr: 'location', items: [], prep: 'in', where: 'drawer', value: 'in drawer', plural: false } },
    { id: 'blank-fact-item', text: 'Blank fact item', room: 'notes', fact: { attr: 'location', items: [' '], prep: 'in', where: 'drawer', value: 'in drawer', plural: false } },
    { id: 'blank-fact-prep', text: 'Blank fact preposition', room: 'notes', fact: { attr: 'location', items: ['keys'], prep: ' ', where: 'drawer', value: 'in drawer', plural: false } },
    { id: 'blank-fact-where', text: 'Blank fact location', room: 'notes', fact: { attr: 'location', items: ['keys'], prep: 'in', where: ' ', value: 'in drawer', plural: false } },
    { id: 'blank-fact-value', text: 'Blank fact value', room: 'notes', fact: { attr: 'location', items: ['keys'], prep: 'in', where: 'drawer', value: ' ', plural: false } },
    { id: 'invalid-fact-plural', text: 'Invalid fact plural flag', room: 'notes', fact: { attr: 'location', items: ['keys'], prep: 'in', where: 'drawer', value: 'in drawer', plural: 'no' } }
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

test('restore rejects malformed custom rooms without changing existing data', function () {
  const invalidRooms = [
    [null],
    [['not-a-room']],
    [{ id: 'wrong_prefix', name: 'Books', icon: 'book' }],
    [{ id: 'custom_books', name: 'A', icon: 'book' }],
    [{ id: 'custom_books', name: 'Books', icon: 'unknown' }],
    [{ id: 'custom_books', name: 'Books' }],
    [
      { id: 'custom_books', name: 'Books', icon: 'book' },
      { id: 'custom_books', name: 'Travel', icon: 'plane' }
    ],
    [
      { id: 'custom_books', name: 'Books', icon: 'book' },
      { id: 'custom_travel', name: 'books', icon: 'plane' }
    ],
    [{ id: 'custom_notes', name: 'Notes', icon: 'book' }],
    [{ id: 'custom_books', name: 'B'.repeat(21), icon: 'book' }]
  ];

  invalidRooms.forEach(function (rooms, index) {
    const w = boot(stored([
      {
        id: 'keep',
        text: 'Keep this entry',
        room: 'notes'
      }
    ]));

    w.Mopapa.store.load();

    const before = w.localStorage.getItem('mopapa.v1');

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
              id: 'replacement',
              text: 'Replacement entry',
              room: 'notes'
            }
          ],
          customRooms: rooms
        })
      },
      function (ok) {
        result = ok;
      }
    );

    assert.strictEqual(result, false, 'Invalid case ' + index);

    assert.strictEqual(
      w.Mopapa.store.data().entries[0].id,
      'keep'
    );

    assert.strictEqual(
      w.localStorage.getItem('mopapa.v1'),
      before
    );
  });
});

test('restore rejects more than ten custom rooms without changing existing data', function () {
  const rooms = [];

  for (let i = 0; i < 11; i++) {
    rooms.push({
      id: 'custom_room' + i,
      name: 'Room ' + i,
      icon: 'book'
    });
  }

  const w = boot(stored([
    {
      id: 'keep',
      text: 'Keep this entry',
      room: 'notes'
    }
  ]));

  w.Mopapa.store.load();

  const before = w.localStorage.getItem('mopapa.v1');

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
        entries: [],
        customRooms: rooms
      })
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
    'keep'
  );
});

test('restore normalises legacy custom-room icons', function () {
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
        entries: [],
        customRooms: [
          {
            id: 'custom_books',
            name: '  Reading   Room  ',
            icon: '\ud83d\udcda'
          }
        ]
      })
    },
    function (ok) {
      result = ok;
    }
  );

  assert.strictEqual(result, true);

  const room = w.Mopapa.store.data().customRooms[0];

  assert.strictEqual(room.name, 'Reading Room');
  assert.strictEqual(room.icon, 'book');
  assert.strictEqual(room.id, 'custom_books');
});

test('restore accepts older backups without a customRooms field', function () {
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
            id: 'older-backup',
            text: 'Older saved memory',
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
    'older-backup'
  );

  assert.deepStrictEqual(
    Array.from(w.Mopapa.store.data().customRooms),
    []
  );
});

test('restore rejects custom rooms that duplicate after whitespace normalisation', function () {
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
        entries: [],
        customRooms: [
          {
            id: 'custom_one',
            name: 'Reading Room',
            icon: 'book'
          },
          {
            id: 'custom_two',
            name: ' Reading   Room ',
            icon: 'star'
          }
        ]
      })
    },
    function (ok) {
      result = ok;
    }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(
    w.Mopapa.store.data().customRooms.length,
    0
  );
});

test('failed custom-room restore preserves existing custom rooms', function () {
  const existingRoom = {
    id: 'custom_existing',
    name: 'Existing Room',
    icon: 'book'
  };

  const w = boot(stored());

  w.Mopapa.store.load();

  w.Mopapa.store.data().customRooms = [existingRoom];

  assert.strictEqual(w.Mopapa.store.save(), true);

  const before = w.localStorage.getItem('mopapa.v1');

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
        entries: [],
        customRooms: [
          {
            id: 'custom_invalid',
            name: 'Invalid Room',
            icon: 'not-supported'
          }
        ]
      })
    },
    function (ok) {
      result = ok;
    }
  );

  assert.strictEqual(result, false);

  assert.strictEqual(
    w.Mopapa.store.data().customRooms[0].id,
    'custom_existing'
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    before
  );
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

  const copies = w.Mopapa.store.recoveryCopies();

  assert.strictEqual(copies.length, 1);
  assert.strictEqual(copies[0].kind, 'recovery');

  const originalCopy = JSON.parse(
    w.localStorage._[copies[0].key]
  );

  assert.strictEqual(
    originalCopy.entries[0].room,
    'custom_missing'
  );

  const saved = JSON.parse(
    w.localStorage.getItem('mopapa.v1')
  );

  assert.strictEqual(saved.entries[0].room, 'notes');
});

test('orphan-room repair is cancelled when saved data changes before preservation', function () {
  const w = boot(stored([{
    id: 'orphaned-entry',
    text: 'The spare key is in the kitchen drawer',
    room: 'custom_missing'
  }]));

  w.Mopapa.store.load();

  const changedRaw = JSON.stringify({
    entries: [{
      id: 'newer-entry',
      text: 'A newer saved memory',
      room: 'notes'
    }],
    learned: {},
    customRooms: [],
    ask: {
      aliases: [],
      boosts: {},
      unanswered: []
    }
  });

  w.localStorage.setItem('mopapa.v1', changedRaw);

  w.Mopapa.customRooms.init();

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].room,
    'custom_missing'
  );

  assert.strictEqual(
    w.Mopapa.store.data().roomRepairSaveFailed,
    true
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    changedRaw
  );

  assert.strictEqual(
    w.Mopapa.store.recoveryCopies().length,
    0
  );

  assert.strictEqual(
    w.Mopapa.store.saveError(),
    'conflict'
  );
});

test('loading unversioned data upgrades it to schema version 1', function () {
  const w = boot(stored([
    { id: 'legacy', text: 'Older saved memory', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().schemaVersion, 1);
  assert.strictEqual(w.Mopapa.store.data().entries.length, 1);

  assert.strictEqual(w.Mopapa.store.save(), true);

  const saved = JSON.parse(w.localStorage.getItem('mopapa.v1'));

  assert.strictEqual(saved.schemaVersion, 1);
  assert.strictEqual(saved.entries[0].id, 'legacy');
});

test('loading a future schema version preserves it as corrupt recovery data', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      schemaVersion: 2,
      entries: []
    })
  });

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corrupt, true);
  assert.strictEqual(w.Mopapa.store.data().corruptCopySaved, true);
  assert.strictEqual(w.Mopapa.store.data().entries.length, 0);

  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 1);
});

test('loading an existing empty storage value treats it as corrupt', function () {
  const w = boot({
    'mopapa.v1': ''
  });

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corrupt, true);
  assert.strictEqual(w.Mopapa.store.data().corruptCopySaved, true);
  assert.strictEqual(w.Mopapa.store.data().entries.length, 0);
  assert.strictEqual(w.Mopapa.store.recoveryCopies().length, 1);

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'corrupt');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    ''
  );
});

test('corrupt data without a preserved copy can still be exported as original data', function () {
  const originalRaw = '{"entries":';

  const w = boot({
    'mopapa.v1': originalRaw
  });

  const originalSetItem = w.localStorage.setItem;

  w.localStorage.setItem = function (key, value) {
    if (key.indexOf('mopapa.v1.corrupt.') === 0) {
      throw new Error('simulated recovery-copy failure');
    }

    return originalSetItem.call(this, key, value);
  };

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corrupt, true);
  assert.strictEqual(w.Mopapa.store.data().corruptCopySaved, false);

  let downloaded = null;

  w.Blob = function (parts) {
    downloaded = parts.join('');
  };

  w.URL = {
    createObjectURL: function () {
      return 'blob:original-data';
    },
    revokeObjectURL: function () {}
  };

  w.document = {
    body: {
      appendChild: function () {}
    },
    createElement: function () {
      return {
        click: function () {},
        remove: function () {},
        set href(value) {},
        set download(value) {}
      };
    }
  };

  w.setTimeout = function () {};

  assert.strictEqual(
    w.Mopapa.store.exportOriginalRecoveryCopy(),
    true
  );

  assert.strictEqual(downloaded, originalRaw);
  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    originalRaw
  );
});

test('normal backup refuses to export when existing storage is empty and corrupt', function () {
  const w = boot({
    'mopapa.v1': ''
  });

  w.Mopapa.store.load();

  assert.throws(function () {
    w.Mopapa.store.exportJSON();
  }, /Saved data is unreadable/);

  assert.strictEqual(w.Mopapa.store.saveError(), 'corrupt');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    ''
  );
});

test('store refuses to overwrite data loaded from an unsupported schema', function () {
  const originalRaw = JSON.stringify({
    schemaVersion: 2,
    entries: [{ id: 'future', text: 'Future data', room: 'notes' }]
  });

  const w = boot({
    'mopapa.v1': originalRaw
  });

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corrupt, true);
  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'corrupt');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    originalRaw
  );
});

test('store protects corrupt data even when recovery-copy creation fails', function () {
  const originalRaw = JSON.stringify({
    schemaVersion: 2,
    entries: [{ id: 'future', text: 'Future data', room: 'notes' }]
  });

  const w = boot({
    'mopapa.v1': originalRaw
  });

  const originalSetItem = w.localStorage.setItem;

  w.localStorage.setItem = function (key, value) {
    if (key.indexOf('mopapa.v1.corrupt.') === 0) {
      throw new Error('simulated recovery-copy failure');
    }

    return originalSetItem.call(this, key, value);
  };

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corrupt, true);
  assert.strictEqual(w.Mopapa.store.data().corruptCopySaved, false);
  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'corrupt');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    originalRaw
  );
});

test('normal backup export refuses to export an empty replacement for corrupt data', function () {
  const originalRaw = JSON.stringify({
    schemaVersion: 2,
    entries: [{ id: 'future', text: 'Future data', room: 'notes' }]
  });

  const w = boot({
    'mopapa.v1': originalRaw
  });

  w.Mopapa.store.load();

  assert.throws(function () {
    w.Mopapa.store.exportJSON();
  }, /Saved data is unreadable/);

  assert.strictEqual(w.Mopapa.store.saveError(), 'corrupt');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    originalRaw
  );
});

test('valid backup restore can replace corrupt saved data', function () {
  const originalRaw = JSON.stringify({
    schemaVersion: 2,
    entries: [{ id: 'future', text: 'Future data', room: 'notes' }]
  });

  const w = boot({
    'mopapa.v1': originalRaw
  });

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
          { id: 'restored', text: 'Recovered memory', room: 'notes' }
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
  assert.strictEqual(w.Mopapa.store.data().corrupt, undefined);
  assert.strictEqual(w.Mopapa.store.data().entries.length, 1);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'restored');

  const saved = JSON.parse(w.localStorage.getItem('mopapa.v1'));

  assert.strictEqual(saved.entries[0].id, 'restored');
  assert.strictEqual(saved.schemaVersion, 1);
});

test('loading rejects a non-numeric schema version', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      schemaVersion: '1',
      entries: []
    })
  });

  w.Mopapa.store.load();

  assert.strictEqual(w.Mopapa.store.data().corrupt, true);
  assert.strictEqual(w.Mopapa.store.data().corruptCopySaved, true);
});

test('failed orphan-room repair is reported without changing persisted data', function () {
  const w = boot(stored([{
    id: 'orphaned-entry',
    text: 'The spare key is in the kitchen drawer',
    room: 'custom_missing'
  }]));

  w.Mopapa.store.load();

  const before = w.localStorage.getItem('mopapa.v1');

  w.localStorage.failWrites = true;
  w.Mopapa.customRooms.init();

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].room,
    'custom_missing'
  );

  assert.strictEqual(
    w.Mopapa.store.data().roomRepairSaveFailed,
    true
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    before
  );

  assert.strictEqual(
    w.Mopapa.store.recoveryCopies().length,
    0
  );  
});

test('failed orphan-room repair can be retried without losing the original assignment', function () {
  const w = boot(stored([{
    id: 'orphaned-entry',
    text: 'The spare key is in the kitchen drawer',
    room: 'custom_missing'
  }]));

  w.Mopapa.store.load();

  w.localStorage.failWrites = true;
  w.Mopapa.customRooms.init();

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].room,
    'custom_missing'
  );

  assert.strictEqual(
    w.Mopapa.store.data().roomRepairSaveFailed,
    true
  );

  w.localStorage.failWrites = false;
  w.Mopapa.customRooms.reload();

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].room,
    'notes'
  );

  assert.strictEqual(
    w.Mopapa.store.data().roomRepairSaveFailed,
    false
  );

  const saved = JSON.parse(
    w.localStorage.getItem('mopapa.v1')
  );

  assert.strictEqual(
    saved.entries[0].room,
    'notes'
  );
});

test('store identifies unavailable storage during startup', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  const originalGetItem = w.localStorage.getItem;

  w.localStorage.getItem = function () {
    throw new Error('simulated storage access failure');
  };

  w.Mopapa.store.load();

  assert.strictEqual(
    w.Mopapa.store.data().storageUnavailable,
    true
  );

  assert.strictEqual(w.Mopapa.store.data().entries.length, 0);
  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');

  w.localStorage.getItem = originalGetItem;
});

test('store refuses to overwrite unread data after storage becomes available again', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  const originalRaw = w.localStorage.getItem('mopapa.v1');
  const originalGetItem = w.localStorage.getItem;

  w.localStorage.getItem = function () {
    throw new Error('simulated temporary storage failure');
  };

  w.Mopapa.store.load();

  w.localStorage.getItem = originalGetItem;

  w.Mopapa.store.data().entries.push({
    id: 'accidental',
    text: 'Must not overwrite original data',
    room: 'notes'
  });

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');
  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    originalRaw
  );
});

test('store refuses to export a backup when startup storage access failed', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.localStorage.getItem = function () {
    throw new Error('simulated storage access failure');
  };

  w.Mopapa.store.load();

  assert.throws(function () {
    w.Mopapa.store.exportJSON();
  }, /Storage is unavailable/);
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

test('read-only tab cannot save or overwrite existing data', function () {
  const original = stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]);

  const w = boot(original);

  w.Mopapa.store.setWriteMode('readonly');
  w.Mopapa.store.load();

  const originalRaw = w.localStorage.getItem('mopapa.v1');

  w.Mopapa.store.data().entries[0].text = 'Read-only attempted edit';

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'readonly');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    originalRaw
  );

  const saved = JSON.parse(originalRaw);

  assert.strictEqual(
    saved.entries[0].text,
    'Original memory'
  );
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

test('backup export refuses to create a stale copy after another tab changes saved data', function () {
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

  assert.throws(function () {
    w.Mopapa.store.exportJSON();
  }, /Saved data changed in another tab/);

  assert.strictEqual(
    w.Mopapa.store.saveError(),
    'conflict'
  );

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    newerData
  );
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

test('backup export refuses to proceed when saved data cannot be checked', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.Mopapa.store.load();

  w.localStorage.getItem = function () {
    throw new Error('simulated storage access failure');
  };

  assert.throws(function () {
    w.Mopapa.store.exportJSON();
  }, /could not check the saved data/);

  assert.strictEqual(
    w.Mopapa.store.saveError(),
    'storage'
  );
});

test('store distinguishes storage failures from save conflicts', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.Mopapa.store.load();

  // Test storage failure
  w.localStorage.failWrites = true;
  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');

  // Test successful save after resolving storage issue
  w.localStorage.failWrites = false;
  assert.strictEqual(w.Mopapa.store.save(), true);
  assert.strictEqual(w.Mopapa.store.saveError(), null);

  const recovered = JSON.parse(
    w.localStorage.getItem('mopapa.v1')
  );

  assert.strictEqual(recovered.schemaVersion, 1);
  assert.strictEqual(recovered.entries.length, 1);
  assert.strictEqual(recovered.entries[0].id, 'original');
  assert.strictEqual(
    recovered.entries[0].text,
    'Original memory'
  );
});

test('failed storage writes preserve the exact saved record and can be retried', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.Mopapa.store.load();

  const originalRaw = w.localStorage.getItem('mopapa.v1');

  w.Mopapa.store.data().entries[0].text = 'Updated memory';

  w.localStorage.failWrites = true;

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    originalRaw
  );

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].text,
    'Updated memory'
  );

  w.localStorage.failWrites = false;

  assert.strictEqual(w.Mopapa.store.save(), true);
  assert.strictEqual(w.Mopapa.store.saveError(), null);

  const saved = JSON.parse(
    w.localStorage.getItem('mopapa.v1')
  );

  assert.strictEqual(saved.entries[0].text, 'Updated memory');
});

test('failed storage writes retain conflict protection after another tab saves', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.Mopapa.store.load();

  w.Mopapa.store.data().entries[0].text = 'Local attempted edit';

  w.localStorage.failWrites = true;

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');

  w.localStorage.failWrites = false;

  const externalRaw = JSON.stringify({
    schemaVersion: 1,
    entries: [{
      id: 'external',
      text: 'Saved by another tab',
      room: 'notes'
    }],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  });

  w.localStorage.setItem('mopapa.v1', externalRaw);

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'conflict');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    externalRaw
  );

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].text,
    'Local attempted edit'
  );
});

test('failed JSON serialisation preserves the saved record and can be retried', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.Mopapa.store.load();

  const originalRaw = w.localStorage.getItem('mopapa.v1');

  const temporary = {};
  temporary.self = temporary;

  w.Mopapa.store.data().temporary = temporary;

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    originalRaw
  );

  assert.strictEqual(
    w.Mopapa.store.data().entries[0].text,
    'Original memory'
  );

  delete w.Mopapa.store.data().temporary;

  assert.strictEqual(w.Mopapa.store.save(), true);
  assert.strictEqual(w.Mopapa.store.saveError(), null);

  const recovered = JSON.parse(
    w.localStorage.getItem('mopapa.v1')
  );

  assert.strictEqual(recovered.schemaVersion, 1);
  assert.strictEqual(recovered.entries.length, 1);
  assert.strictEqual(recovered.entries[0].id, 'original');
  assert.strictEqual(
    recovered.entries[0].text,
    'Original memory'
  );
});

test('failed JSON serialisation retains conflict protection after another tab saves', function () {
  const w = boot(stored([{
    id: 'original',
    text: 'Original memory',
    room: 'notes'
  }]));

  w.Mopapa.store.load();

  const temporary = {};
  temporary.self = temporary;

  w.Mopapa.store.data().temporary = temporary;

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');

  delete w.Mopapa.store.data().temporary;

  const externalRaw = JSON.stringify({
    schemaVersion: 1,
    entries: [{
      id: 'external',
      text: 'Newer external memory',
      room: 'notes'
    }],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  });

  w.localStorage.setItem('mopapa.v1', externalRaw);

  assert.strictEqual(w.Mopapa.store.save(), false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'conflict');

  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    externalRaw
  );
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

function assertRestoreRejectsBackup(backup) {
  const original = {
    schemaVersion: 1,
    entries: [{
      id: 'existing-memory',
      text: 'This memory must survive',
      room: 'notes'
    }],
    learned: {},
    customRooms: [{
      id: 'custom_books',
      name: 'Books',
      icon: 'book'
    }],
    ask: {
      aliases: [['mummy', 'mum']],
      boosts: {},
      unanswered: []
    }
  };

  const w = boot({
    'mopapa.v1': JSON.stringify(original)
  });

  w.Mopapa.store.load();

  const beforeData = w.Mopapa.store.data();
  const beforeRaw = w.localStorage.getItem('mopapa.v1');

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
      content: JSON.stringify(backup)
    },
    function (ok) {
      result = ok;
    }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(
    w.Mopapa.store.data(),
    beforeData,
    'Rejected restore must preserve the complete in-memory state'
  );
  assert.strictEqual(
    w.localStorage.getItem('mopapa.v1'),
    beforeRaw,
    'Rejected restore must preserve the original saved data'
  );
  assert.strictEqual(
    w.Mopapa.store.data().entries[0].id,
    'existing-memory'
  );
}

const invalidRestoreEntryCases = [
  {
    name: 'invalid scheduled date',
    fields: { when: 'not-a-date' }
  },
  {
    name: 'invalid creation date',
    fields: { created: 'yesterday-ish' }
  },
  {
    name: 'invalid hasTime value',
    fields: { hasTime: 'yes' }
  },
  {
    name: 'invalid completion value',
    fields: { done: 1 }
  },
  {
    name: 'invalid pinned value',
    fields: { pinned: 'true' }
  },
  {
    name: 'tags supplied as a string',
    fields: { tags: 'holiday' }
  },
  {
    name: 'more than eight tags',
    fields: { tags: Array(9).fill('tag') }
  },
  {
    name: 'empty tag',
    fields: { tags: [''] }
  },
  {
    name: 'non-string tag',
    fields: { tags: ['valid', 42] }
  },
  {
    name: 'amounts supplied as a string',
    fields: { amounts: '12.50' }
  },
  {
    name: 'non-numeric amount in amounts',
    fields: { amounts: ['12.50'] }
  },
  {
    name: 'amount supplied as a string',
    fields: { amount: '12.50' }
  },

  {
    name: 'malformed structured location fact',
    fields: {
      fact: {
        attr: 'location',
        items: [],
        prep: 'in',
        where: 'kitchen',
        value: 'kitchen',
        plural: false
      }
    }
  },
  {
    name: 'structured fact has unsupported attribute',
    fields: {
      fact: {
        attr: 'person',
        items: ['keys'],
        prep: 'in',
        where: 'kitchen',
        value: 'kitchen',
        plural: false
      }
    }
  },
  {
    name: 'structured fact has non-string item',
    fields: {
      fact: {
        attr: 'location',
        items: ['keys', 42],
        prep: 'in',
        where: 'kitchen',
        value: 'kitchen',
        plural: false
      }
    }
  },
  {
    name: 'structured fact has empty preposition',
    fields: {
      fact: {
        attr: 'location',
        items: ['keys'],
        prep: ' ',
        where: 'kitchen',
        value: 'kitchen',
        plural: false
      }
    }
  },
  {
    name: 'structured fact has empty location description',
    fields: {
      fact: {
        attr: 'location',
        items: ['keys'],
        prep: 'in',
        where: '',
        value: 'kitchen',
        plural: false
      }
    }
  },
  {
    name: 'structured fact has empty value',
    fields: {
      fact: {
        attr: 'location',
        items: ['keys'],
        prep: 'in',
        where: 'kitchen',
        value: ' ',
        plural: false
      }
    }
  },
  {
    name: 'structured fact has non-boolean plural value',
    fields: {
      fact: {
        attr: 'location',
        items: ['keys'],
        prep: 'in',
        where: 'kitchen',
        value: 'kitchen',
        plural: 'false'
      }
    }
  },
  {
    name: 'amounts contain a null value',
    fields: { amounts: [12.5, null] }
  },

  {
    name: 'empty entry ID',
    fields: { id: '' }
  },
  {
    name: 'whitespace-padded entry ID',
    fields: { id: ' bad-id ' }
  },
  {
    name: 'empty entry text',
    fields: { text: '' }
  },
  {
    name: 'overlong entry text',
    fields: { text: 'x'.repeat(1001) }
  },
  {
    name: 'empty room ID',
    fields: { room: '' }
  }
];

invalidRestoreEntryCases.forEach(function (item) {
  test(
    'restore rejects ' + item.name + ' without changing existing data',
    function () {
      const invalidEntry = Object.assign({
        id: 'invalid-entry',
        text: 'Imported entry',
        room: 'notes'
      }, item.fields);

      assertRestoreRejectsBackup({
        entries: [
          {
            id: 'valid-entry',
            text: 'Valid imported neighbour',
            room: 'notes'
          },
          invalidEntry
        ]
      });
    }
  );
});

test('restore rejects duplicate entry IDs without changing existing data', function () {
  assertRestoreRejectsBackup({
    entries: [
      {
        id: 'duplicate',
        text: 'First entry',
        room: 'notes'
      },
      {
        id: 'duplicate',
        text: 'Second entry',
        room: 'notes'
      }
    ]
  });
});

const invalidRestoreRoomCases = [
  {
    name: 'custom rooms supplied as null',
    rooms: null
  },
  {
    name: 'more than ten custom rooms',
    rooms: Array.from({ length: 11 }, function (_, index) {
      return {
        id: 'custom_room' + index,
        name: 'Room ' + index,
        icon: 'book'
      };
    })
  },
  {
    name: 'malformed custom room record',
    rooms: [null]
  },
  {
    name: 'invalid custom room ID',
    rooms: [{
      id: 'invalid-id',
      name: 'Books',
      icon: 'book'
    }]
  },
  {
    name: 'unsupported custom room icon',
    rooms: [{
      id: 'custom_books',
      name: 'Books',
      icon: 'unknown'
    }]
  },
  {
    name: 'duplicate custom room IDs',
    rooms: [
      {
        id: 'custom_same',
        name: 'Books',
        icon: 'book'
      },
      {
        id: 'custom_same',
        name: 'Music',
        icon: 'music'
      }
    ]
  },
  {
    name: 'duplicate custom room names',
    rooms: [
      {
        id: 'custom_books',
        name: 'Books',
        icon: 'book'
      },
      {
        id: 'custom_books2',
        name: 'BOOKS',
        icon: 'music'
      }
    ]
  },
  {
    name: 'built-in room name used as custom room',
    rooms: [{
      id: 'custom_notes',
      name: 'Notes',
      icon: 'book'
    }]
  },
  {
    name: 'custom room name shorter than permitted',
    rooms: [{
      id: 'custom_a',
      name: 'A',
      icon: 'book'
    }]
  }
];

invalidRestoreRoomCases.forEach(function (item) {
  test(
    'restore rejects ' + item.name + ' without changing existing data',
    function () {
      assertRestoreRejectsBackup({
        entries: [{
          id: 'valid-entry',
          text: 'Valid imported entry',
          room: 'notes'
        }],
        customRooms: item.rooms
      });
    }
  );
});

test('restore rejects a future schema version without replacing current data', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const before = w.localStorage.getItem('mopapa.v1');

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 50,
      content: JSON.stringify({
        schemaVersion: 2,
        entries: [
          { id: 'future', text: 'Future-format entry', room: 'notes' }
        ]
      })
    },
    function (ok) {
      result = ok;
    }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'keep');
  assert.strictEqual(w.localStorage.getItem('mopapa.v1'), before);
});

test('restore upgrades a valid unversioned backup to schema version 1', function () {
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
      size: 50,
      content: JSON.stringify({
        entries: [
          { id: 'imported', text: 'Imported older entry', room: 'notes' }
        ]
      })
    },
    function (ok) {
      result = ok;
    }
  );

  assert.strictEqual(result, true);
  assert.strictEqual(w.Mopapa.store.data().schemaVersion, 1);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'imported');

  const saved = JSON.parse(w.localStorage.getItem('mopapa.v1'));

  assert.strictEqual(saved.schemaVersion, 1);
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

test('restore rolls back every in-memory data domain when the primary storage write fails', function () {
  const original = {
    schemaVersion: 1,
    entries: [
      {
        id: 'keep',
        text: 'Keep this original entry',
        room: 'notes'
      }
    ],
    learned: {
      example: 2
    },
    customRooms: [
      {
        id: 'custom_books',
        name: 'Books',
        icon: 'book'
      }
    ],
    ask: {
      aliases: [['gp', 'doctor']],
      boosts: {
        'gp doctor': {
          keep: 3
        }
      },
      unanswered: [
        {
          q: 'Who was that?',
          at: '2026-01-01'
        }
      ]
    }
  };

  const w = boot({
    'mopapa.v1': JSON.stringify(original)
  });

  w.Mopapa.store.load();

  const beforeRaw = w.localStorage._['mopapa.v1'];
  const beforeData = JSON.stringify(w.Mopapa.store.data());

  const originalSetItem = w.localStorage.setItem;

  w.localStorage.setItem = function (key, value) {
    if (key === 'mopapa.v1') {
      throw new Error('simulated primary storage failure');
    }

    return originalSetItem.call(this, key, value);
  };

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
    };
  };

  let result = null;

  w.Mopapa.store.importJSON(
    {
      size: 200,
      content: JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            id: 'replacement',
            text: 'Replacement entry',
            room: 'notes'
          }
        ],
        learned: {
          replacement: 5
        },
        customRooms: [],
        ask: {
          aliases: [],
          boosts: {},
          unanswered: []
        }
      })
    },
    function (ok) {
      result = ok;
    }
  );

  assert.strictEqual(result, false);
  assert.strictEqual(w.Mopapa.store.saveError(), 'storage');

  assert.strictEqual(
    w.localStorage._['mopapa.v1'],
    beforeRaw
  );

  assert.strictEqual(
    JSON.stringify(w.Mopapa.store.data()),
    beforeData
  );

  const recoveryKeys = Object.keys(w.localStorage._).filter(function (key) {
    return key.indexOf('mopapa.v1.recovery.') === 0;
  });

  assert.strictEqual(recoveryKeys.length, 1);
  assert.strictEqual(
    w.localStorage._[recoveryKeys[0]],
    beforeRaw
  );
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


test('restore preserves existing data when FileReader reports a read error', function () {
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

test('restore preserves existing data when FileReader throws while reading', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const before = w.localStorage._['mopapa.v1'];

  w.FileReader = function () {
    this.readAsText = function () {
      throw new Error('simulated file read failure');
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

test('restore rolls back when saved data changes before the import commits', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  const external = JSON.stringify({
    schemaVersion: 1,
    entries: [
      { id: 'external', text: 'Changed in another tab', room: 'notes' }
    ],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: {}, unanswered: [] }
  });

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;

      w.localStorage.setItem('mopapa.v1', external);

      this.onload();
    };
  };

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
  assert.strictEqual(w.localStorage._['mopapa.v1'], external);
  assert.strictEqual(w.Mopapa.store.saveError(), 'conflict');
});

test('restore completes its callback only once when FileReader fires multiple events', function () {
  const w = boot(stored([
    { id: 'keep', text: 'Keep this entry', room: 'notes' }
  ]));

  w.Mopapa.store.load();

  w.FileReader = function () {
    this.readAsText = function (file) {
      this.result = file.content;
      this.onload();
      this.onerror();
    };
  };

  let callbackCount = 0;
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
    function (ok) {
      callbackCount++;
      result = ok;
    }
  );

  assert.strictEqual(callbackCount, 1);
  assert.strictEqual(result, true);
  assert.strictEqual(w.Mopapa.store.data().entries[0].id, 'replacement');

  const saved = JSON.parse(w.localStorage._['mopapa.v1']);

  assert.strictEqual(saved.entries[0].id, 'replacement');
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

test('match-context module exposes its factory', function () {
  const w = boot({});

  assert.strictEqual(
    typeof w.Mopapa.askParts.matchContext.create,
    'function'
  );
});


test('match-context exposes all three matching operations', function () {
  const w = boot({});
  const context = w.Mopapa.askParts.matchContext.create({
    norm: w.Mopapa.askParts.text.norm,
    stem: w.Mopapa.askParts.text.stem,
    aliases: {},
    termsClose: w.Mopapa.askParts.match.termsClose,
    learnedData: function () {
      return { boosts: {} };
    },
    sortNewest: function () {
      return 0;
    }
  });

  assert.strictEqual(typeof context.entryStems, 'function');
  assert.strictEqual(typeof context.includesAllTerms, 'function');
  assert.strictEqual(typeof context.rankedMatches, 'function');
});


test('match-context matches saved words through the shared stemmer', function () {
  const w = boot({});
  const context = w.Mopapa.askParts.matchContext.create({
    norm: w.Mopapa.askParts.text.norm,
    stem: w.Mopapa.askParts.text.stem,
    aliases: {},
    termsClose: w.Mopapa.askParts.match.termsClose,
    learnedData: function () {
      return { boosts: {} };
    },
    sortNewest: function () {
      return 0;
    }
  });

  const entry = {
    id: 'context-stem',
    text: 'I bought some apples',
    tags: []
  };

  assert.strictEqual(
    context.includesAllTerms(entry, ['buy', 'appl']),
    true
  );

  assert.strictEqual(
    context.includesAllTerms(entry, ['computer']),
    false
  );
});


test('match-context passes alias matching into the shared matcher', function () {
  const w = boot({});
  const context = w.Mopapa.askParts.matchContext.create({
    norm: w.Mopapa.askParts.text.norm,
    stem: w.Mopapa.askParts.text.stem,
    aliases: { gp: ['doctor'] },
    termsClose: w.Mopapa.askParts.match.termsClose,
    learnedData: function () {
      return { boosts: {} };
    },
    sortNewest: function () {
      return 0;
    }
  });

  const entry = {
    id: 'context-alias',
    text: 'I saw the doctor',
    tags: []
  };

  assert.strictEqual(
    context.includesAllTerms(entry, ['gp']),
    true
  );
});


test('match-context ranking returns matching saved entries', function () {
  const w = boot({});
  const context = w.Mopapa.askParts.matchContext.create({
    norm: w.Mopapa.askParts.text.norm,
    stem: w.Mopapa.askParts.text.stem,
    aliases: {},
    termsClose: w.Mopapa.askParts.match.termsClose,
    learnedData: function () {
      return { boosts: {} };
    },
    sortNewest: function () {
      return 0;
    }
  });

  const entry = {
    id: 'context-ranking',
    text: 'Dentist appointment next week',
    tags: []
  };

  const results = context.rankedMatches(
    [entry],
    ['dentist'],
    null,
    'dentist'
  );

  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, 'context-ranking');
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

test('fact-answer module exposes its structured answer handler', function () {
  const w = boot({});

  assert.strictEqual(
    typeof w.Mopapa.askParts.factAnswer.answerStructured,
    'function'
  );
});


test('fact-answer skips structured lookups when a date filter is active', function () {
  const w = boot({});
  const facts = w.Mopapa.askParts.facts;
  const originalItems = facts.structuredItems;
  const originalWhere = facts.structuredWhere;
  let called = false;

  facts.structuredItems = function () {
    called = true;
    return null;
  };

  facts.structuredWhere = function () {
    called = true;
    return null;
  };

  const result = w.Mopapa.askParts.factAnswer.answerStructured(
    'What is in the kitchen?',
    ['kitchen'],
    [],
    { due: true },
    true,
    {
      norm: function (value) { return value; },
      words: function () { return []; },
      stem: function (value) { return value; },
      aliases: {},
      confirmedBySig: function () { return null; }
    }
  );

  facts.structuredItems = originalItems;
  facts.structuredWhere = originalWhere;

  assert.strictEqual(result, null);
  assert.strictEqual(called, false);
});


test('fact-answer checks item lists before structured location answers', function () {
  const w = boot({});
  const facts = w.Mopapa.askParts.facts;
  const originalItems = facts.structuredItems;
  const originalWhere = facts.structuredWhere;
  const order = [];
  const expected = {
    answer: 'Kitchen: keys.',
    sources: []
  };

  facts.structuredItems = function () {
    order.push('items');
    return expected;
  };

  facts.structuredWhere = function () {
    order.push('where');
    return null;
  };

  const result = w.Mopapa.askParts.factAnswer.answerStructured(
    'What is in the kitchen?',
    ['kitchen'],
    [],
    null,
    true,
    {
      norm: function (value) { return value; },
      words: function () { return ['kitchen']; },
      stem: function (value) { return value; },
      aliases: {},
      confirmedBySig: function () { return null; }
    }
  );

  facts.structuredItems = originalItems;
  facts.structuredWhere = originalWhere;

  assert.strictEqual(result, expected);
  assert.deepStrictEqual(order, ['items']);
});


test('fact-answer does not run location lookup for non-location questions', function () {
  const w = boot({});
  const facts = w.Mopapa.askParts.facts;
  const originalItems = facts.structuredItems;
  const originalWhere = facts.structuredWhere;
  let whereCalled = false;

  facts.structuredItems = function () {
    return null;
  };

  facts.structuredWhere = function () {
    whereCalled = true;
    return null;
  };

  const result = w.Mopapa.askParts.factAnswer.answerStructured(
    'Tell me about the kitchen',
    ['kitchen'],
    [],
    null,
    false,
    {
      norm: function (value) { return value; },
      words: function () { return ['kitchen']; },
      stem: function (value) { return value; },
      aliases: {},
      confirmedBySig: function () { return null; }
    }
  );

  facts.structuredItems = originalItems;
  facts.structuredWhere = originalWhere;

  assert.strictEqual(result, null);
  assert.strictEqual(whereCalled, false);
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

test('ask: conversational location questions resolve the correct saved fact', function () {
  const entries = [
    {
      id: 'spare-key',
      text: 'Spare keys are in the blue tin',
      room: 'notes',
      created: ago(1)
    }
  ];

  const questions = [
    'Can you tell me where I put the spare key?',
    'Do you know where my spare key is?',
    'Do you remember where I left the spare keys?',
    'Can you remind me where I put the spare key?'
  ];

  questions.forEach(function (question) {
    const result = askWith(entries, question);

    assert.ok(
      /blue tin/i.test(result.answer),
      question + ' -> ' + result.answer
    );

    assert.strictEqual(
      result.sources[0].id,
      'spare-key',
      question + ' should use the correct saved entry'
    );
  });
});

test('ask: conversational and contracted appointment questions return the scheduled date', function () {
  const appointmentWhen = new Date(
    Date.now() + 5 * 86400000
  ).toISOString();

  const entries = [
    {
      id: 'dentist-appointment',
      text: 'Dentist appointment',
      room: 'appointments',
      when: appointmentWhen,
      hasTime: false,
      created: ago(1),
      done: false
    }
  ];

  const questions = [
    'Do you know when the dentist appointment is?',
    'Can you tell me when the dentist appointment is?',
    "When's my dentist appointment?",
    "What's the date of my dentist appointment?"
  ];

  questions.forEach(function (question) {
    const result = askWith(entries, question);

    assert.ok(
      /Dentist appointment/i.test(result.answer),
      question + ' -> ' + result.answer
    );

    assert.strictEqual(
      result.sources[0].id,
      'dentist-appointment',
      question + ' should use the correct saved appointment'
    );
  });
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


test('ask evaluation: realistic answers are grounded in their supporting memories', function () {
  const dentistWhen = new Date(Date.now() + 5 * 86400000).toISOString();

  const cases = [
    {
      name: 'location',
      entries: [{
        id: 'eval-location',
        text: 'Spare keys are in the blue tin',
        room: 'notes',
        created: ago(1)
      }],
      question: 'Where are my spare keys?',
      expectedAnswer: /blue tin/i,
      expectedSources: ['eval-location'],
      supports: function (entry) {
        return /Spare keys are in the blue tin/i.test(entry.text);
      }
    },
    {
      name: 'recipient',
      entries: [{
        id: 'eval-recipient',
        text: 'The parcel is for Morgan',
        room: 'notes',
        created: ago(1)
      }],
      question: 'Who is the parcel for?',
      expectedAnswer: /for Morgan/i,
      expectedSources: ['eval-recipient'],
      supports: function (entry) {
        return /parcel is for Morgan/i.test(entry.text);
      }
    },
    {
      name: 'scheduled date',
      entries: [{
        id: 'eval-date',
        text: 'Dentist appointment',
        room: 'appointments',
        when: dentistWhen,
        hasTime: false,
        created: ago(1),
        done: false
      }],
      question: 'When is the dentist?',
      expectedAnswer: /Dentist appointment/i,
      expectedSources: ['eval-date'],
      supports: function (entry) {
        return entry.when === dentistWhen;
      }
    },
    {
      name: 'cost',
      entries: [{
        id: 'eval-cost',
        text: 'Boiler service £120',
        room: 'notes',
        created: ago(1)
      }],
      question: 'How much did the boiler service cost?',
      expectedAnswer: /£120/,
      expectedSources: ['eval-cost'],
      supports: function (entry) {
        return /Boiler service £120/.test(entry.text);
      }
    }
  ];

  cases.forEach(function (item) {
    const result = askWith(item.entries, item.question);

    assert.ok(
      item.expectedAnswer.test(result.answer),
      item.name + ' answer was unexpected: ' + result.answer
    );

    const sourceIds = Array.from(result.sources).map(function (entry) {
      return entry.id;
    });

    assert.deepStrictEqual(
      sourceIds,
      item.expectedSources,
      item.name + ' returned incorrect supporting sources'
    );

    result.sources.forEach(function (entry) {
      assert.ok(
        item.supports(entry),
        item.name + ' returned a source that does not support its answer'
      );
    });
  });
});

test('ask evaluation: conflicting dates, recipients and costs require clarification', function () {
  const soon = new Date(Date.now() + 4 * 86400000).toISOString();
  const later = new Date(Date.now() + 12 * 86400000).toISOString();

  const cases = [
    {
      name: 'different appointment dates',
      entries: [
        {
          id: 'eval-dentist-one',
          text: 'Dentist check-up',
          room: 'appointments',
          when: soon,
          hasTime: false,
          created: ago(2),
          done: false
        },
        {
          id: 'eval-dentist-two',
          text: 'Dentist hygiene visit',
          room: 'appointments',
          when: later,
          hasTime: false,
          created: ago(1),
          done: false
        }
      ],
      question: 'When is the dentist?',
      expectedAnswer: /different scheduled dates|Which entry do you mean/i,
      expectedSources: ['eval-dentist-one', 'eval-dentist-two']
    },
    {
      name: 'different recipients',
      entries: [
        {
          id: 'eval-parcel-one',
          text: 'The parcel is for Morgan',
          room: 'notes',
          created: ago(1)
        },
        {
          id: 'eval-parcel-two',
          text: 'The parcel is for Jasmine',
          room: 'notes',
          created: ago(2)
        }
      ],
      question: 'Who is the parcel for?',
      expectedAnswer: /more than one possible recipient/i,
      expectedSources: ['eval-parcel-one', 'eval-parcel-two']
    },
    {
      name: 'different prices',
      entries: [
        {
          id: 'eval-car-one',
          text: 'Car service £100',
          room: 'notes',
          created: ago(2)
        },
        {
          id: 'eval-car-two',
          text: 'Car service £150',
          room: 'notes',
          created: ago(1)
        }
      ],
      question: 'How much did the car service cost?',
      expectedAnswer: /Which job or purchase do you mean/i,
      expectedSources: ['eval-car-one', 'eval-car-two']
    }
  ];

  cases.forEach(function (item) {
    const result = askWith(item.entries, item.question);

    assert.ok(
      item.expectedAnswer.test(result.answer),
      item.name + ' did not request clarification: ' + result.answer
    );

    const sourceIds = Array.from(result.sources).map(function (entry) {
      return entry.id;
    }).sort();

    assert.deepStrictEqual(
      sourceIds,
      item.expectedSources.slice().sort(),
      item.name + ' did not provide the competing source entries'
    );
  });
});

test('ask evaluation: unsupported answers are not invented', function () {
  const unknownLocation = askWith([
    {
      id: 'eval-passport',
      text: 'Passport is in the top drawer',
      room: 'notes',
      created: ago(1)
    }
  ], 'Where is my umbrella?');

  assert.ok(
    /could not find/i.test(unknownLocation.answer),
    unknownLocation.answer
  );
  assert.strictEqual(unknownLocation.sources.length, 0);
  assert.strictEqual(unknownLocation.missed, true);

  const unknownCost = askWith([
    {
      id: 'eval-no-price',
      text: 'Boiler service booked for Friday',
      room: 'notes',
      created: ago(1)
    }
  ], 'How much did the boiler service cost?');

  assert.ok(
    /will not guess an amount/i.test(unknownCost.answer),
    unknownCost.answer
  );

  assert.deepStrictEqual(
    Array.from(unknownCost.sources).map(function (entry) {
      return entry.id;
    }),
    ['eval-no-price']
  );
});

test('ask evaluation: typo suggestions are clearly labelled and source-backed', function () {
  const result = askWith([
    {
      id: 'eval-typo-passport',
      text: 'Passport is in the top drawer',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'eval-typo-bin',
      text: 'Bin day is Thursday',
      room: 'notes',
      created: ago(2)
    }
  ], 'Where is my pasport?');

  assert.ok(
    /could not find an exact match|closest saved entries/i.test(result.answer),
    result.answer
  );

  assert.ok(
    Array.from(result.sources).some(function (entry) {
      return entry.id === 'eval-typo-passport';
    }),
    'The typo suggestion did not include its supporting memory'
  );
});

test('ask evaluation: two dentist appointments at different times require clarification', function () {
  const firstWhen = new Date(Date.now() + 7 * 86400000);
  firstWhen.setHours(10, 0, 0, 0);

  const secondWhen = new Date(firstWhen.getTime());
  secondWhen.setHours(15, 0, 0, 0);

  const entries = [
    {
      id: 'eval-dentist-morning',
      text: 'Dentist check-up',
      room: 'appointments',
      when: firstWhen.toISOString(),
      hasTime: true,
      created: ago(2),
      done: false
    },
    {
      id: 'eval-dentist-afternoon',
      text: 'Dentist hygiene visit',
      room: 'appointments',
      when: secondWhen.toISOString(),
      hasTime: true,
      created: ago(1),
      done: false
    }
  ];

  const result = askWith(entries, 'When is the dentist?');

  assert.ok(
    /different scheduled dates|Which entry do you mean/i.test(result.answer),
    result.answer
  );

  const sourceIds = Array.from(result.sources).map(function (entry) {
    return entry.id;
  }).sort();

  assert.deepStrictEqual(
    sourceIds,
    ['eval-dentist-afternoon', 'eval-dentist-morning']
  );
});

test('ask evaluation: specific appointment questions select the correct overlapping subject', function () {
  const checkupWhen = new Date(Date.now() + 5 * 86400000);
  checkupWhen.setHours(10, 0, 0, 0);

  const hygieneWhen = new Date(Date.now() + 8 * 86400000);
  hygieneWhen.setHours(11, 0, 0, 0);

  const followupWhen = new Date(Date.now() + 12 * 86400000);
  followupWhen.setHours(14, 0, 0, 0);

  const entries = [
    {
      id: 'eval-overlap-checkup',
      text: 'Dentist check-up',
      room: 'appointments',
      when: checkupWhen.toISOString(),
      hasTime: true,
      created: ago(3),
      done: false
    },
    {
      id: 'eval-overlap-hygiene',
      text: 'Dentist hygiene appointment',
      room: 'appointments',
      when: hygieneWhen.toISOString(),
      hasTime: true,
      created: ago(2),
      done: false
    },
    {
      id: 'eval-overlap-followup',
      text: 'Dentist follow-up appointment',
      room: 'appointments',
      when: followupWhen.toISOString(),
      hasTime: true,
      created: ago(1),
      done: false
    }
  ];

  const cases = [
    {
      question: 'When is my dentist check-up?',
      expectedText: /Dentist check-up/i,
      expectedId: 'eval-overlap-checkup'
    },
    {
      question: 'When is my dentist hygiene appointment?',
      expectedText: /Dentist hygiene appointment/i,
      expectedId: 'eval-overlap-hygiene'
    },
    {
      question: 'When is my dentist follow-up?',
      expectedText: /Dentist follow-up appointment/i,
      expectedId: 'eval-overlap-followup'
    }
  ];

  cases.forEach(function (item) {
    const result = askWith(entries, item.question);

    assert.ok(
      item.expectedText.test(result.answer),
      item.question + ' returned the wrong answer: ' + result.answer
    );

    assert.strictEqual(
      result.sources.length,
      1,
      item.question + ' should return exactly one supporting memory'
    );

    assert.strictEqual(
      result.sources[0].id,
      item.expectedId,
      item.question + ' returned the wrong supporting memory'
    );
  });
});

test('ask evaluation: a broad dentist question clarifies across three overlapping appointments', function () {
  const firstWhen = new Date(Date.now() + 5 * 86400000);
  const secondWhen = new Date(Date.now() + 8 * 86400000);
  const thirdWhen = new Date(Date.now() + 12 * 86400000);

  const entries = [
    {
      id: 'eval-broad-checkup',
      text: 'Dentist check-up',
      room: 'appointments',
      when: firstWhen.toISOString(),
      hasTime: false,
      created: ago(3),
      done: false
    },
    {
      id: 'eval-broad-hygiene',
      text: 'Dentist hygiene appointment',
      room: 'appointments',
      when: secondWhen.toISOString(),
      hasTime: false,
      created: ago(2),
      done: false
    },
    {
      id: 'eval-broad-followup',
      text: 'Dentist follow-up appointment',
      room: 'appointments',
      when: thirdWhen.toISOString(),
      hasTime: false,
      created: ago(1),
      done: false
    }
  ];

  const result = askWith(entries, 'When is the dentist?');

  assert.ok(
    /different scheduled dates|Which entry do you mean/i.test(result.answer),
    result.answer
  );

  const sourceIds = Array.from(result.sources).map(function (entry) {
    return entry.id;
  }).sort();

  assert.deepStrictEqual(
    sourceIds,
    [
      'eval-broad-checkup',
      'eval-broad-followup',
      'eval-broad-hygiene'
    ]
  );
});

test('ask evaluation: separate appointments at the same time are not silently collapsed', function () {
  const when = new Date(Date.now() + 8 * 86400000);
  when.setHours(11, 0, 0, 0);

  const iso = when.toISOString();

  const entries = [
    {
      id: 'eval-dentist-checkup',
      text: 'Dentist check-up',
      room: 'appointments',
      when: iso,
      hasTime: true,
      created: ago(2),
      done: false
    },
    {
      id: 'eval-dentist-hygiene',
      text: 'Dentist hygiene appointment',
      room: 'appointments',
      when: iso,
      hasTime: true,
      created: ago(1),
      done: false
    }
  ];

  const result = askWith(entries, 'When is the dentist?');

  assert.ok(
    /Which appointment do you mean|Which entry do you mean|more than one matching appointment/i.test(result.answer),
    result.answer
  );

  const sourceIds = Array.from(result.sources).map(function (entry) {
    return entry.id;
  }).sort();

  assert.deepStrictEqual(
    sourceIds,
    ['eval-dentist-checkup', 'eval-dentist-hygiene']
  );
});

test('ask evaluation: duplicate entries for the same appointment do not create false ambiguity', function () {
  const when = new Date(Date.now() + 8 * 86400000);
  when.setHours(11, 0, 0, 0);

  const iso = when.toISOString();

  const entries = [
    {
      id: 'eval-dentist-duplicate-one',
      text: 'Dentist check-up',
      room: 'appointments',
      when: iso,
      hasTime: true,
      created: ago(2),
      done: false
    },
    {
      id: 'eval-dentist-duplicate-two',
      text: 'Dentist check-up',
      room: 'appointments',
      when: iso,
      hasTime: true,
      created: ago(1),
      done: false
    }
  ];

  const result = askWith(entries, 'When is the dentist?');

  assert.ok(
    /Dentist check-up/i.test(result.answer),
    result.answer
  );

  assert.ok(
    !/Which appointment do you mean/i.test(result.answer),
    result.answer
  );

  const sourceIds = Array.from(result.sources).map(function (entry) {
    return entry.id;
  }).sort();

  assert.deepStrictEqual(
    sourceIds,
    [
      'eval-dentist-duplicate-one',
      'eval-dentist-duplicate-two'
    ]
  );
});

test('ask evaluation: completed appointments do not override an upcoming appointment', function () {
  const past = new Date(Date.now() - 5 * 86400000).toISOString();
  const future = new Date(Date.now() + 9 * 86400000).toISOString();

  const entries = [
    {
      id: 'eval-dentist-completed',
      text: 'Dentist check-up',
      room: 'appointments',
      when: past,
      hasTime: false,
      created: ago(3),
      done: true
    },
    {
      id: 'eval-dentist-upcoming',
      text: 'Dentist follow-up',
      room: 'appointments',
      when: future,
      hasTime: false,
      created: ago(1),
      done: false
    }
  ];

  const result = askWith(entries, 'When is the dentist?');

  assert.ok(
    /Dentist follow-up/i.test(result.answer),
    result.answer
  );

  assert.deepStrictEqual(
    Array.from(result.sources).map(function (entry) {
      return entry.id;
    }),
    ['eval-dentist-upcoming']
  );
});

test('ask evaluation: a rescheduled appointment uses its upcoming date', function () {
  const oldWhen = new Date(Date.now() - 5 * 86400000);
  oldWhen.setHours(10, 0, 0, 0);

  const newWhen = new Date(Date.now() + 7 * 86400000);
  newWhen.setHours(11, 0, 0, 0);

  const entries = [
    {
      id: 'eval-rescheduled-new',
      text: 'Dentist check-up',
      room: 'appointments',
      when: newWhen.toISOString(),
      hasTime: true,
      created: ago(1),
      done: false
    },
    {
      id: 'eval-rescheduled-old',
      text: 'Dentist check-up',
      room: 'appointments',
      when: oldWhen.toISOString(),
      hasTime: true,
      created: ago(5),
      done: false
    }
  ];

  const result = askWith(entries, 'When is my dentist check-up?');

  assert.ok(
    /Dentist check-up/i.test(result.answer),
    result.answer
  );

  assert.ok(
    !/already passed/i.test(result.answer),
    result.answer
  );

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(result.sources[0].id, 'eval-rescheduled-new');
});

test('ask evaluation: latest cost questions use the newest corrected amount', function () {
  const entries = [
    {
      id: 'eval-cost-corrected',
      text: 'Car service £175',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'eval-cost-original',
      text: 'Car service £125',
      room: 'notes',
      created: ago(5)
    }
  ];

  const result = askWith(
    entries,
    'What was the latest car service cost?'
  );

  assert.ok(
    /£175/.test(result.answer),
    result.answer
  );

  assert.ok(
    !/£125/.test(result.answer),
    result.answer
  );

  assert.deepStrictEqual(
    Array.from(result.sources).map(function (entry) {
      return entry.id;
    }),
    ['eval-cost-corrected']
  );
});

test('ask evaluation: unqualified questions do not silently choose between changed costs', function () {
  const entries = [
    {
      id: 'eval-cost-new',
      text: 'Car service £175',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'eval-cost-old',
      text: 'Car service £125',
      room: 'notes',
      created: ago(5)
    }
  ];

  const result = askWith(
    entries,
    'How much did the car service cost?'
  );

  assert.ok(
    /multiple matching entries with costs|Which job or purchase/i.test(result.answer),
    result.answer
  );

  const sourceIds = Array.from(result.sources).map(function (entry) {
    return entry.id;
  }).sort();

  assert.deepStrictEqual(
    sourceIds,
    ['eval-cost-new', 'eval-cost-old']
  );
});

test('ask evaluation: newest location is determined by saved timestamp, not storage order', function () {
  const entries = [
    {
      id: 'eval-location-oldest-first',
      text: 'Spare keys are in the kitchen drawer',
      room: 'notes',
      created: ago(8)
    },
    {
      id: 'eval-location-newest-second',
      text: 'Spare keys are in the blue tin',
      room: 'notes',
      created: ago(1)
    }
  ];

  const result = askWith(
    entries,
    'Where are my spare keys?'
  );

  assert.ok(
    /blue tin/i.test(result.answer),
    result.answer
  );

  assert.ok(
    !/kitchen drawer/i.test(result.answer),
    result.answer
  );

  assert.deepStrictEqual(
    Array.from(result.sources).map(function (entry) {
      return entry.id;
    }),
    ['eval-location-newest-second']
  );
});

test('ask evaluation: a newer location replaces the old location for the same item', function () {
  const entries = [
    {
      id: 'eval-keys-new-location',
      text: 'Spare keys are in the blue tin',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'eval-keys-old-location',
      text: 'Spare keys are in the kitchen drawer',
      room: 'notes',
      created: ago(5)
    }
  ];

  const result = askWith(entries, 'Where are my spare keys?');

  assert.ok(
    /blue tin/i.test(result.answer),
    result.answer
  );

  assert.ok(
    !/kitchen drawer/i.test(result.answer),
    result.answer
  );

  assert.deepStrictEqual(
    Array.from(result.sources).map(function (entry) {
      return entry.id;
    }),
    ['eval-keys-new-location']
  );
});

test('ask evaluation: explicit previous-location questions retrieve the older location', function () {
  const entries = [
    {
      id: 'eval-history-keys-new',
      text: 'Spare keys are in the blue tin',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'eval-history-keys-old',
      text: 'Spare keys are in the kitchen drawer',
      room: 'notes',
      created: ago(8)
    }
  ];

  const result = askWith(
    entries,
    'Where were my spare keys before?'
  );

  assert.ok(
    /kitchen drawer/i.test(result.answer),
    result.answer
  );

  assert.deepStrictEqual(
    Array.from(result.sources).map(function (entry) {
      return entry.id;
    }),
    ['eval-history-keys-old']
  );
});

test('ask evaluation: original-cost questions retrieve the earlier amount', function () {
  const entries = [
    {
      id: 'eval-history-cost-new',
      text: 'Car service £175',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'eval-history-cost-old',
      text: 'Car service £125',
      room: 'notes',
      created: ago(8)
    }
  ];

  const result = askWith(
    entries,
    'What was the original car service cost?'
  );

  assert.ok(
    /£125/.test(result.answer),
    result.answer
  );

  assert.ok(
    !/£175/.test(result.answer),
    result.answer
  );

  assert.deepStrictEqual(
    Array.from(result.sources).map(function (entry) {
      return entry.id;
    }),
    ['eval-history-cost-old']
  );
});

test('ask evaluation: original appointment questions retrieve the earlier scheduled date', function () {
  const originalWhen = new Date(Date.now() + 3 * 86400000);
  originalWhen.setHours(10, 0, 0, 0);

  const revisedWhen = new Date(Date.now() + 12 * 86400000);
  revisedWhen.setHours(11, 0, 0, 0);

  const entries = [
    {
      id: 'eval-history-dentist-new',
      text: 'Dentist check-up',
      room: 'appointments',
      when: revisedWhen.toISOString(),
      hasTime: true,
      created: ago(1),
      done: false
    },
    {
      id: 'eval-history-dentist-old',
      text: 'Dentist check-up',
      room: 'appointments',
      when: originalWhen.toISOString(),
      hasTime: true,
      created: ago(8),
      done: false
    }
  ];

  const result = askWith(
    entries,
    'When was my dentist check-up originally scheduled?'
  );

  assert.strictEqual(result.sources.length, 1);
  assert.ok(
    /original scheduled date/i.test(result.answer),
    result.answer
  );
  assert.strictEqual(
    result.sources[0].id,
    'eval-history-dentist-old'
  );
});

test('ask evaluation: original appointment follows saved revision chronology when rescheduled earlier', function () {
  const originalWhen = new Date(Date.now() + 20 * 86400000);
  originalWhen.setHours(10, 0, 0, 0);

  const revisedWhen = new Date(Date.now() + 5 * 86400000);
  revisedWhen.setHours(11, 0, 0, 0);

  const entries = [
    {
      id: 'eval-history-reversed-new',
      text: 'Dentist check-up',
      room: 'appointments',
      when: revisedWhen.toISOString(),
      hasTime: true,
      created: ago(1),
      done: false
    },
    {
      id: 'eval-history-reversed-old',
      text: 'Dentist check-up',
      room: 'appointments',
      when: originalWhen.toISOString(),
      hasTime: true,
      created: ago(8),
      done: false
    }
  ];

  const result = askWith(
    entries,
    'When was my dentist check-up originally scheduled?'
  );

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(
    result.sources[0].id,
    'eval-history-reversed-old'
  );
});

test('ask evaluation: previous cost retrieves the immediately preceding amount', function () {
  const entries = [
    {
      id: 'eval-history-cost-latest',
      text: 'Car service £175',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'eval-history-cost-previous',
      text: 'Car service £150',
      room: 'notes',
      created: ago(5)
    },
    {
      id: 'eval-history-cost-original',
      text: 'Car service £125',
      room: 'notes',
      created: ago(10)
    }
  ];

  const result = askWith(
    entries,
    'What was the previous car service cost?'
  );

  assert.ok(/£150/.test(result.answer), result.answer);
  assert.ok(!/£175/.test(result.answer), result.answer);
  assert.ok(!/£125/.test(result.answer), result.answer);

  assert.deepStrictEqual(
    Array.from(result.sources).map(function (entry) {
      return entry.id;
    }),
    ['eval-history-cost-previous']
  );
});

test('ask evaluation: previous appointment retrieves the immediately preceding schedule', function () {
  const latestWhen = new Date(Date.now() + 5 * 86400000);
  latestWhen.setHours(11, 0, 0, 0);

  const previousWhen = new Date(Date.now() + 12 * 86400000);
  previousWhen.setHours(10, 0, 0, 0);

  const originalWhen = new Date(Date.now() + 20 * 86400000);
  originalWhen.setHours(9, 0, 0, 0);

  const entries = [
    {
      id: 'eval-history-appointment-latest',
      text: 'Dentist check-up',
      room: 'appointments',
      when: latestWhen.toISOString(),
      hasTime: true,
      created: ago(1),
      done: false
    },
    {
      id: 'eval-history-appointment-previous',
      text: 'Dentist check-up',
      room: 'appointments',
      when: previousWhen.toISOString(),
      hasTime: true,
      created: ago(5),
      done: false
    },
    {
      id: 'eval-history-appointment-original',
      text: 'Dentist check-up',
      room: 'appointments',
      when: originalWhen.toISOString(),
      hasTime: true,
      created: ago(10),
      done: false
    }
  ];

  const result = askWith(
    entries,
    'When was my dentist check-up previously scheduled?'
  );

  assert.strictEqual(result.sources.length, 1);
  assert.strictEqual(
    result.sources[0].id,
    'eval-history-appointment-previous'
  );
});

test('ask evaluation: previous location selects the second-newest saved version', function () {
  const entries = [
    {
      id: 'eval-history-keys-current',
      text: 'Spare keys are in the blue tin',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'eval-history-keys-previous',
      text: 'Spare keys are in the kitchen drawer',
      room: 'notes',
      created: ago(5)
    },
    {
      id: 'eval-history-keys-original',
      text: 'Spare keys are in the hallway cupboard',
      room: 'notes',
      created: ago(10)
    }
  ];

  const result = askWith(
    entries,
    'Where were my spare keys before?'
  );

  assert.ok(/kitchen drawer/i.test(result.answer), result.answer);
  assert.ok(!/blue tin/i.test(result.answer), result.answer);
  assert.ok(!/hallway cupboard/i.test(result.answer), result.answer);

  assert.deepStrictEqual(
    Array.from(result.sources).map(function (entry) {
      return entry.id;
    }),
    ['eval-history-keys-previous']
  );
});

test('ask evaluation: original cost selects the oldest saved version', function () {
  const entries = [
    {
      id: 'eval-history-cost-current',
      text: 'Car service £175',
      room: 'notes',
      created: ago(1)
    },
    {
      id: 'eval-history-cost-middle',
      text: 'Car service £150',
      room: 'notes',
      created: ago(5)
    },
    {
      id: 'eval-history-cost-original',
      text: 'Car service £125',
      room: 'notes',
      created: ago(10)
    }
  ];

  const result = askWith(
    entries,
    'What was the original car service cost?'
  );

  assert.ok(/£125/.test(result.answer), result.answer);
  assert.ok(!/£175/.test(result.answer), result.answer);
  assert.ok(!/£150/.test(result.answer), result.answer);

  assert.deepStrictEqual(
    Array.from(result.sources).map(function (entry) {
      return entry.id;
    }),
    ['eval-history-cost-original']
  );
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

test('learning: a tapped appointment settles same-time appointment ambiguity', function () {
  const when = new Date(Date.now() + 8 * 86400000);
  when.setHours(11, 0, 0, 0);

  const iso = when.toISOString();

  const w = boot(stored([
    {
      id: 'same-time-checkup',
      text: 'Dentist check-up',
      room: 'appointments',
      when: iso,
      hasTime: true,
      created: ago(2),
      done: false
    },
    {
      id: 'same-time-hygiene',
      text: 'Dentist hygiene appointment',
      room: 'appointments',
      when: iso,
      hasTime: true,
      created: ago(1),
      done: false
    }
  ]));

  w.Mopapa.store.load();

  const q = 'When is the dentist?';
  const initial = w.Mopapa.ask.answer(q);

  assert.ok(
    /Which appointment do you mean/i.test(initial.answer),
    initial.answer
  );

  assert.strictEqual(initial.sources.length, 2);

  assert.strictEqual(
    w.Mopapa.ask.confirmSource(q, 'same-time-hygiene'),
    true
  );

  const resolved = w.Mopapa.ask.answer(q);

  assert.ok(
    /Dentist hygiene appointment/i.test(resolved.answer),
    resolved.answer
  );

  assert.strictEqual(resolved.sources.length, 1);
  assert.strictEqual(resolved.sources[0].id, 'same-time-hygiene');
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

test('legacy learned data keeps valid scores and discards malformed values', function () {
  const w = boot({
    'mopapa.v1': JSON.stringify({
      entries: [],
      learned: {
        grocery: {
          wishlist: 99,
          invalidText: 'high',
          invalidNegative: -2,
          invalidExcessive: 5000
        },
        invalidTextValue: 'not-an-object',
        invalidArray: ['not', 'a', 'score-map'],
        invalidEmpty: {}
      }
    })
  });

  w.Mopapa.store.load();

  const learned = JSON.parse(
    JSON.stringify(w.Mopapa.store.data().learned)
  );

  assert.deepStrictEqual(learned, {
    grocery: {
      wishlist: 99
    }
  });
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


test('search, agenda, pinned and resurfaced Open buttons target the selected entry', function () {
  const files = [
    {
      path: '../js/ui/search.js',
      expected: 'Mopapa.room.open(entry.room, entry.id)'
    },
    {
      path: '../js/ui/agenda.js',
      expected: 'Mopapa.room.open(entry.room, entry.id)'
    },
    {
      path: '../js/ui/keepsakes.js',
      expected: 'Mopapa.room.open(entry.room, entry.id)'
    },
    {
      path: '../js/ui/resurface.js',
      expected: 'Mopapa.room.open(item.entry.room, item.entry.id)'
    }
  ];

  files.forEach(function (file) {
    const source = fs.readFileSync(
      __dirname + '/' + file.path,
      'utf8'
    );

    assert.ok(
      source.includes(file.expected),
      file.path + ' must open the selected entry, not just its room'
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

test('match-resolution module exposes its resolver', function () {
  const w = boot();

  assert.strictEqual(
    typeof w.Mopapa.askParts.matchResolution.resolveMatches,
    'function'
  );
});


test('match resolution finds exact matches in the requested room', function () {
  const w = boot();
  const resolve = w.Mopapa.askParts.matchResolution.resolveMatches;

  const wanted = { id: 'wanted', room: 'ideas', text: 'Garden project' };
  const other = { id: 'other', room: 'notes', text: 'Garden tools' };

  const result = resolve(
    'garden',
    [wanted, other],
    ['garden'],
    'ideas',
    null,
    'garden',
    {
      loggedOn: function () { return true; },
      textDateMatchesFilter: function () { return false; },
      includesAllTerms: function (entry) {
        return entry.text.indexOf('Garden') !== -1;
      },
      isCostQuestion: function () { return false; },
      rankedMatches: function () { return []; },
      questionIntent: { isLocationQuestion: function () { return false; } },
      norm: function (value) { return value.toLowerCase(); },
      stem: function (value) { return value; },
      locationMatchScore: function () { return 0; }
    }
  );

  assert.strictEqual(result.matches.length, 1);
  assert.strictEqual(result.matches[0].id, 'wanted');
  assert.strictEqual(result.response, null);
});


test('match resolution searches other rooms when the guessed room has no match', function () {
  const w = boot();
  const resolve = w.Mopapa.askParts.matchResolution.resolveMatches;

  const entry = { id: 'fallback', room: 'notes', text: 'Garden project' };

  const result = resolve(
    'garden',
    [entry],
    ['garden'],
    'ideas',
    null,
    'garden',
    {
      loggedOn: function () { return true; },
      textDateMatchesFilter: function () { return false; },
      includesAllTerms: function () { return true; },
      isCostQuestion: function () { return false; },
      rankedMatches: function () { return []; },
      questionIntent: { isLocationQuestion: function () { return false; } },
      norm: function (value) { return value.toLowerCase(); },
      stem: function (value) { return value; },
      locationMatchScore: function () { return 0; }
    }
  );

  assert.strictEqual(result.matches.length, 1);
  assert.strictEqual(result.matches[0].id, 'fallback');
});


test('match resolution excludes completed tasks from due-date matches', function () {
  const w = boot();
  const resolve = w.Mopapa.askParts.matchResolution.resolveMatches;

  const open = { id: 'open', room: 'todo', text: 'Pay bill', done: false };
  const done = { id: 'done', room: 'todo', text: 'Pay bill', done: true };

  const result = resolve(
    'Pay bill',
    [open, done],
    ['pay', 'bill'],
    null,
    { due: true },
    'bill pay',
    {
      loggedOn: function () { return true; },
      textDateMatchesFilter: function () { return false; },
      includesAllTerms: function () { return true; },
      isCostQuestion: function () { return false; },
      rankedMatches: function () { return []; },
      questionIntent: { isLocationQuestion: function () { return false; } },
      norm: function (value) { return value.toLowerCase(); },
      stem: function (value) { return value; },
      locationMatchScore: function () { return 0; }
    }
  );

  assert.strictEqual(result.matches.length, 1);
  assert.strictEqual(result.matches[0].id, 'open');
});


test('match resolution returns close suggestions when exact matches are absent', function () {
  const w = boot();
  const resolve = w.Mopapa.askParts.matchResolution.resolveMatches;

  const close = { id: 'close', text: 'Dentist appointment' };

  const result = resolve(
    'dentist',
    [close],
    ['dentist'],
    null,
    null,
    'dentist',
    {
      loggedOn: function () { return true; },
      textDateMatchesFilter: function () { return false; },
      includesAllTerms: function () { return false; },
      isCostQuestion: function () { return false; },
      rankedMatches: function () { return [close]; },
      questionIntent: { isLocationQuestion: function () { return false; } },
      norm: function (value) { return value.toLowerCase(); },
      stem: function (value) { return value; },
      locationMatchScore: function () { return 0; }
    }
  );

  assert.ok(result.response);
  assert.ok(result.response.answer.includes('closest saved entries'));
  assert.strictEqual(result.response.sources[0].id, 'close');
});


test('match resolution does not use typo suggestions for cost questions', function () {
  const w = boot();
  const resolve = w.Mopapa.askParts.matchResolution.resolveMatches;
  let ranked = false;

  const result = resolve(
    'cost of dentist',
    [{ id: 'one', text: 'Dentist' }],
    ['dentist'],
    null,
    null,
    'dentist',
    {
      loggedOn: function () { return true; },
      textDateMatchesFilter: function () { return false; },
      includesAllTerms: function () { return false; },
      isCostQuestion: function () { return true; },
      rankedMatches: function () {
        ranked = true;
        return [{ id: 'one', text: 'Dentist' }];
      },
      questionIntent: { isLocationQuestion: function () { return false; } },
      norm: function (value) { return value.toLowerCase(); },
      stem: function (value) { return value; },
      locationMatchScore: function () { return 0; }
    }
  );

  assert.strictEqual(ranked, false);
  assert.strictEqual(result.response, null);
  assert.strictEqual(result.matches.length, 0);
});


test('match resolution prefers the most specific location subject', function () {
  const w = boot();
  const resolve = w.Mopapa.askParts.matchResolution.resolveMatches;

  const spare = { id: 'spare', text: 'My spare key is in the kitchen' };
  const wallet = { id: 'wallet', text: 'My wallet is in the kitchen' };

  const result = resolve(
    'Where is my key?',
    [spare, wallet],
    ['key'],
    null,
    null,
    'key',
    {
      loggedOn: function () { return true; },
      textDateMatchesFilter: function () { return false; },
      includesAllTerms: function () { return true; },
      isCostQuestion: function () { return false; },
      rankedMatches: function () { return []; },
      questionIntent: { isLocationQuestion: function () { return true; } },
      norm: function (value) { return value.toLowerCase(); },
      stem: function (value) { return value; },
      locationMatchScore: function (entry) {
        return entry.id === 'spare' ? 10 : 0;
      }
    }
  );

  assert.strictEqual(result.isLocationQuestion, true);
  assert.strictEqual(result.matches.length, 1);
  assert.strictEqual(result.matches[0].id, 'spare');
});


test('match resolution keeps equally scored location matches ambiguous', function () {
  const w = boot();
  const resolve = w.Mopapa.askParts.matchResolution.resolveMatches;

  const first = { id: 'first', text: 'My key is in the kitchen' };
  const second = { id: 'second', text: 'My key is in the hallway' };

  const result = resolve(
    'Where is my key?',
    [first, second],
    ['key'],
    null,
    null,
    'key',
    {
      loggedOn: function () { return true; },
      textDateMatchesFilter: function () { return false; },
      includesAllTerms: function () { return true; },
      isCostQuestion: function () { return false; },
      rankedMatches: function () { return []; },
      questionIntent: { isLocationQuestion: function () { return true; } },
      norm: function (value) { return value.toLowerCase(); },
      stem: function (value) { return value; },
      locationMatchScore: function () { return 10; }
    }
  );

  assert.strictEqual(result.matches.length, 2);
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

function makeAnswerFlowContext(overrides) {
  const calls = [];

  const handlers = {
    structured: function () { calls.push('structured'); return null; },
    nextAppointment: function () { calls.push('nextAppointment'); return null; },
    overdue: function () { calls.push('overdue'); return null; },
    when: function () { calls.push('when'); return null; },
    whoFor: function () { calls.push('whoFor'); return null; },
    location: function () { calls.push('location'); return null; },
    calledName: function () { calls.push('calledName'); return null; },
    cost: function () { calls.push('cost'); return { answer: 'cost' }; },
    fallback: function (q, matches) {
      calls.push('fallback');
      return { answer: 'fallback', matches: matches };
    }
  };

  Object.keys(overrides || {}).forEach(function (key) {
    handlers[key] = overrides[key];
  });

  return {
    calls: calls,
    handlers: handlers,
    sortNewest: function (a, b) {
      return b.created - a.created;
    },
    isCostQuestion: function () {
      return false;
    }
  };
}

test('answer-flow module exposes its resolve function', function () {
  const w = boot();

  assert.strictEqual(
    typeof w.Mopapa.askParts.answerFlow.resolve,
    'function'
  );
});

test('answer-flow stops at the first successful handler', function () {
  const w = boot();
  const context = makeAnswerFlowContext({
    structured: function () {
      context.calls.push('structured');
      return { answer: 'structured' };
    }
  });

  const result = w.Mopapa.askParts.answerFlow.resolve(
    'What did I save?',
    [],
    context
  );

  assert.strictEqual(result.answer, 'structured');
  assert.deepStrictEqual(context.calls, ['structured']);
});

test('answer-flow preserves the complete answer-handler order', function () {
  const w = boot();
  const context = makeAnswerFlowContext();

  w.Mopapa.askParts.answerFlow.resolve(
    'What did I save?',
    [],
    context
  );

  assert.deepStrictEqual(context.calls, [
    'structured',
    'nextAppointment',
    'overdue',
    'when',
    'whoFor',
    'location',
    'calledName',
    'fallback'
  ]);
});

test('answer-flow checks cost answers before general fallback', function () {
  const w = boot();
  const context = makeAnswerFlowContext();

  context.isCostQuestion = function () {
    return true;
  };

  const result = w.Mopapa.askParts.answerFlow.resolve(
    'How much did it cost?',
    [],
    context
  );

  assert.strictEqual(result.answer, 'cost');

  assert.strictEqual(
    context.calls[context.calls.length - 1],
    'cost'
  );

  assert.strictEqual(
    context.calls.indexOf('fallback'),
    -1
  );
});

test('answer-flow sorts matches before passing them to fallback', function () {
  const w = boot();
  const context = makeAnswerFlowContext();

  const entries = [
    { id: 'old', created: 1 },
    { id: 'new', created: 3 },
    { id: 'middle', created: 2 }
  ];

  const result = w.Mopapa.askParts.answerFlow.resolve(
    'What did I save?',
    entries,
    context
  );

  assert.strictEqual(result.answer, 'fallback');

  assert.deepStrictEqual(
    result.matches.map(function (entry) {
      return entry.id;
    }),
    ['new', 'middle', 'old']
  );
});


test('answer-flow dispatches successfully through every ordered handler', function () {
  const w = boot();

  const order = [
    'structured',
    'nextAppointment',
    'overdue',
    'when',
    'whoFor',
    'location',
    'calledName'
  ];

  order.forEach(function (name, index) {
    const context = makeAnswerFlowContext();
    const marker = { answer: name };

    context.handlers[name] = function () {
      context.calls.push(name);
      return marker;
    };

    const result = w.Mopapa.askParts.answerFlow.resolve(
      'test question',
      [],
      context
    );

    assert.strictEqual(result, marker);
    assert.deepStrictEqual(
      context.calls,
      order.slice(0, index + 1)
    );
  });
});


test('answer-flow safely skips an unavailable optional handler', function () {
  const w = boot();
  const context = makeAnswerFlowContext();

  delete context.handlers.nextAppointment;

  w.Mopapa.askParts.answerFlow.resolve(
    'test question',
    [],
    context
  );

  assert.deepStrictEqual(context.calls, [
    'structured',
    'overdue',
    'when',
    'whoFor',
    'location',
    'calledName',
    'fallback'
  ]);
});


test('answer-flow continues when a handler returns undefined', function () {
  const w = boot();
  const context = makeAnswerFlowContext();

  context.handlers.structured = function () {
    context.calls.push('structured');
    return undefined;
  };

  const result = w.Mopapa.askParts.answerFlow.resolve(
    'test question',
    [],
    context
  );

  assert.strictEqual(result.answer, 'fallback');
  assert.ok(context.calls.includes('nextAppointment'));
});


test('answer-flow continues when a handler returns false', function () {
  const w = boot();
  const context = makeAnswerFlowContext();

  context.handlers.structured = function () {
    context.calls.push('structured');
    return false;
  };

  const result = w.Mopapa.askParts.answerFlow.resolve(
    'test question',
    [],
    context
  );

  assert.strictEqual(result.answer, 'fallback');
});


test('answer-flow passes the original question and matches to handlers', function () {
  const w = boot();
  const context = makeAnswerFlowContext();

  const entries = [
    { id: 'one', created: 1 }
  ];

  let receivedQuestion = null;
  let receivedMatches = null;

  context.handlers.structured = function (q, matches) {
    receivedQuestion = q;
    receivedMatches = matches;
    return { answer: 'captured' };
  };

  w.Mopapa.askParts.answerFlow.resolve(
    'Where did I put my keys?',
    entries,
    context
  );

  assert.strictEqual(
    receivedQuestion,
    'Where did I put my keys?'
  );

  assert.strictEqual(receivedMatches, entries);
});


test('answer-flow does not reorder matches after an early answer', function () {
  const w = boot();
  const context = makeAnswerFlowContext();

  const entries = [
    { id: 'old', created: 1 },
    { id: 'new', created: 3 },
    { id: 'middle', created: 2 }
  ];

  context.handlers.structured = function () {
    return { answer: 'found' };
  };

  w.Mopapa.askParts.answerFlow.resolve(
    'test question',
    entries,
    context
  );

  assert.deepStrictEqual(
    entries.map(function (entry) {
      return entry.id;
    }),
    ['old', 'new', 'middle']
  );
});


test('answer-flow passes sorted matches and question to cost handler', function () {
  const w = boot();
  const context = makeAnswerFlowContext();

  const entries = [
    { id: 'old', created: 1 },
    { id: 'new', created: 3 },
    { id: 'middle', created: 2 }
  ];

  let receivedQuestion = null;
  let receivedMatches = null;

  context.isCostQuestion = function () {
    return true;
  };

  context.handlers.cost = function (q, matches) {
    receivedQuestion = q;
    receivedMatches = matches;
    return { answer: 'cost' };
  };

  w.Mopapa.askParts.answerFlow.resolve(
    'How much did the dentist cost?',
    entries,
    context
  );

  assert.strictEqual(
    receivedQuestion,
    'How much did the dentist cost?'
  );

  assert.deepStrictEqual(
    receivedMatches.map(function (entry) {
      return entry.id;
    }),
    ['new', 'middle', 'old']
  );
});


test('answer-flow passes the original question to general fallback', function () {
  const w = boot();
  const context = makeAnswerFlowContext();

  let receivedQuestion = null;

  context.handlers.fallback = function (q, matches) {
    receivedQuestion = q;
    return { answer: 'fallback', matches: matches };
  };

  const result = w.Mopapa.askParts.answerFlow.resolve(
    'What did I save about the garden?',
    [],
    context
  );

  assert.strictEqual(
    receivedQuestion,
    'What did I save about the garden?'
  );

  assert.strictEqual(result.answer, 'fallback');
});

test('storage persistence reports unsupported browsers', async function () {
  const w = boot();
  const result = await w.Mopapa.store.storagePersistenceStatus();

  assert.strictEqual(result.supported, false);
  assert.strictEqual(result.persisted, false);
});

test('storage persistence reports an existing browser grant', async function () {
  const w = boot(null, {
    persisted: function () {
      return Promise.resolve(true);
    }
  });

  const result = await w.Mopapa.store.storagePersistenceStatus();

  assert.strictEqual(result.supported, true);
  assert.strictEqual(result.persisted, true);
});

test('storage persistence handles a denied status check', async function () {
  const w = boot(null, {
    persisted: function () {
      return Promise.reject(new Error('status unavailable'));
    }
  });

  const result = await w.Mopapa.store.storagePersistenceStatus();

  assert.strictEqual(result.supported, true);
  assert.strictEqual(result.persisted, false);
  assert.strictEqual(result.failed, true);
});

test('storage persistence request reports unsupported browsers', async function () {
  const w = boot();
  const result = await w.Mopapa.store.requestStoragePersistence();

  assert.strictEqual(result.supported, false);
  assert.strictEqual(result.granted, false);
});

test('storage persistence request records a browser grant', async function () {
  const w = boot(null, {
    persist: function () {
      return Promise.resolve(true);
    }
  });

  const result = await w.Mopapa.store.requestStoragePersistence();

  assert.strictEqual(result.supported, true);
  assert.strictEqual(result.granted, true);
});

test('storage persistence request handles denial and rejection', async function () {
  const denied = boot(null, {
    persist: function () {
      return Promise.resolve(false);
    }
  });

  const deniedResult =
    await denied.Mopapa.store.requestStoragePersistence();

  assert.strictEqual(deniedResult.supported, true);
  assert.strictEqual(deniedResult.granted, false);

  const rejected = boot(null, {
    persist: function () {
      return Promise.reject(new Error('request failed'));
    }
  });

  const rejectedResult =
    await rejected.Mopapa.store.requestStoragePersistence();

  assert.strictEqual(rejectedResult.supported, true);
  assert.strictEqual(rejectedResult.granted, false);
  assert.strictEqual(rejectedResult.failed, true);
});

test('storage protection interface explains that it does not replace backups', function () {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  const main = fs.readFileSync(__dirname + '/../js/main.js', 'utf8');

  assert.ok(html.includes('id="storage-protection"'));
  assert.ok(html.includes('id="storage-protection-status"'));
  assert.ok(html.includes('id="storage-protection-request"'));
  assert.ok(html.includes('does not replace an external backup'));

  assert.ok(main.includes('M.store.storagePersistenceStatus()'));
  assert.ok(main.includes('M.store.requestStoragePersistence()'));
  assert.ok(main.includes('The browser granted persistent storage.'));
  assert.ok(main.includes('The browser did not grant persistent storage.'));
});

(async function () {
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];

    try {
      await t[1]();
      console.log('PASS', t[0]);
    } catch (e) {
      failed++;
      console.log('FAIL', t[0], '-', e.message);
    }
  }

  console.log((tests.length - failed) + '/' + tests.length + ' tests passed');
  process.exit(failed ? 1 : 0);
})();