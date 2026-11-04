
'use strict';

var assert = require('node:assert/strict');
var fs = require('node:fs');
var http = require('node:http');
var path = require('node:path');
var playwright = require('playwright');

var ROOT = path.resolve(__dirname, '..');
var server;
var browser;
var baseUrl;
var failures = 0;
var passed = 0;

var mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function startServer() {
  server = http.createServer(function (req, res) {
    var pathname;

    try {
      pathname = decodeURIComponent(
        new URL(req.url, 'http://localhost').pathname
      );
    } catch (error) {
      res.writeHead(400);
      res.end('Bad request');
      return;
    }

    if (pathname === '/') pathname = '/index.html';

    var filePath = path.resolve(ROOT, '.' + pathname);

    if (!filePath.startsWith(ROOT + path.sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, function (error, content) {
      if (error) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(filePath)] ||
          'application/octet-stream',
        'Cache-Control': 'no-store'
      });

      res.end(content);
    });
  });

  return new Promise(function (resolve) {
    server.listen(0, '127.0.0.1', function () {
      baseUrl = 'http://127.0.0.1:' +
        server.address().port;
      resolve();
    });
  });
}

async function openPage(viewport) {
  var context = await browser.newContext({
    viewport: viewport || { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });

  var page = await context.newPage();
  var pageErrors = [];

  page.on('pageerror', function (error) {
    pageErrors.push(error.message);
  });

  // External fonts must not make the tests network-dependent.
  await page.route(
    /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
    function (route) {
      return route.abort();
    }
  );

  await page.goto(baseUrl, { waitUntil: 'load' });

  return {
    page: page,
    context: context,
    pageErrors: pageErrors
  };
}

async function savedData(page) {
  return page.evaluate(function () {
    return JSON.parse(
      localStorage.getItem('mopapa.v1') || '{}'
    );
  });
}

async function saveText(page, text) {
  await page.locator('#talk-input').fill(text);
  await page.locator('#send').click();
}

function dateDaysAgo(days) {
  var date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function dateLastYearToday() {
  var date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString();
}

function resurfaceEntry(id, text, room, created, done) {
  return {
    id: id,
    text: text,
    room: room,
    when: null,
    hasTime: false,
    amount: null,
    fact: null,
    amounts: null,
    created: created,
    done: Boolean(done)
  };
}

async function seedResurfaceEntries(page, entries) {
  await page.evaluate(function (savedEntries) {
    localStorage.setItem('mopapa.v1', JSON.stringify({
      schemaVersion: 1,
      entries: savedEntries,
      learned: {},
      customRooms: [],
      ask: {
        aliases: [],
        boosts: {},
        unanswered: []
      }
    }));
  }, entries);

  await page.reload({ waitUntil: 'load' });
}

async function check(name, test) {
  var opened;

  try {
    opened = await openPage();

    await test(opened.page);

    assert.deepStrictEqual(
      opened.pageErrors,
      [],
      'Browser JavaScript errors: ' +
        opened.pageErrors.join('; ')
    );

    passed++;
    console.log('PASS', name);
  } catch (error) {
    failures++;
    console.error('FAIL', name);
    console.error(error.stack || error.message);
  } finally {
    if (opened) {
      await opened.context.close();
    }
  }
}

async function runStorageBenchmark() {
  var opened = await openPage();

  try {
    var report = await opened.page.evaluate(function () {
      var sizes = [250, 1000, 3000, 5000];
      var store = window.Mopapa.store;
      var rows = [];

      function medianTime(fn) {
        var times = [];
        for (var i = 0; i < 3; i++) {
          var start = performance.now();
          fn();
          times.push(performance.now() - start);
        }
        times.sort(function (a, b) { return a - b; });
        return Number(times[1].toFixed(2));
      }

      sizes.forEach(function (size) {
        var entries = [];
        for (var i = 0; i < size; i++) {
          entries.push({
            id: 'benchmark_' + size + '_' + i,
            text: 'Synthetic memory ' + i +
              ': a representative note containing ordinary personal details, ' +
              'a location, a reminder and useful context.',
            room: 'notes',
            when: null,
            hasTime: false,
            amount: null,
            fact: null,
            amounts: null,
            created: '2026-01-15T12:00:00.000Z',
            done: false
          });
        }

        var data = store.data();
        data.schemaVersion = 1;
        data.entries = entries;
        data.learned = {};
        data.customRooms = [];
        data.ask = {
          aliases: [],
          boosts: Object.create(null),
          unanswered: []
        };

        var stringifyMs = medianTime(function () {
          JSON.stringify(data);
        });
        var start = performance.now();
        var saved = store.save();
        var saveMs = Number((performance.now() - start).toFixed(2));

        if (!saved) {
          rows.push({
            entries: size,
            saved: false,
            saveError: store.saveError()
          });
          return;
        }

        var raw = localStorage.getItem('mopapa.v1');
        var parseMs = medianTime(function () { JSON.parse(raw); });
        var loadMs = medianTime(function () { store.load(); });

        rows.push({
          entries: size,
          saved: true,
          jsonCharacters: raw.length,
          approximateUtf16Bytes: raw.length * 2,
          stringifyMedianMs: stringifyMs,
          saveMs: saveMs,
          parseMedianMs: parseMs,
          appLoadMedianMs: loadMs,
          loadedEntries: store.data().entries.length
        });
      });

      var longRows = [];
      var longSizes = [250, 500, 1000, 1500, 2000, 2500, 3000];

      longSizes.forEach(function (size) {
        var entries = [];

        for (var i = 0; i < size; i++) {
          var prefix = 'Maximum-length synthetic memory ' + i + ': ';
          var entryText = prefix +
            new Array(1000 - prefix.length + 1).join('x');

          entries.push({
            id: 'long_benchmark_' + size + '_' + i,
            text: entryText,
            room: 'notes',
            when: null,
            hasTime: false,
            amount: null,
            fact: null,
            amounts: null,
            created: '2026-01-15T12:00:00.000Z',
            done: false
          });
        }

        var data = store.data();
        data.schemaVersion = 1;
        data.entries = entries;
        data.learned = {};
        data.customRooms = [];
        data.ask = {
          aliases: [],
          boosts: Object.create(null),
          unanswered: []
        };

        var attemptedJson = JSON.stringify(data);

        var stringifyMs = medianTime(function () {
          JSON.stringify(data);
        });

        var start = performance.now();
        var saved = store.save();
        var saveMs = Number((performance.now() - start).toFixed(2));

        var row = {
          entries: size,
          entryCharacters: 1000,
          attemptedJsonCharacters: attemptedJson.length,
          approximateUtf16Bytes: attemptedJson.length * 2,
          stringifyMedianMs: stringifyMs,
          saveMs: saveMs,
          saved: saved,
          saveError: saved ? null : store.saveError()
        };

        if (saved) {
          var raw = localStorage.getItem('mopapa.v1');

          row.storedJsonCharacters = raw.length;

          row.parseMedianMs = medianTime(function () {
            JSON.parse(raw);
          });

          row.appLoadMedianMs = medianTime(function () {
            store.load();
          });

          row.loadedEntries = store.data().entries.length;
        }

        longRows.push(row);
      });
      
      var recoveryCount = 0;
      var recoveryCharacters = 0;
      var corruptCount = 0;
      var corruptCharacters = 0;

      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key) continue;
        if (
          key.indexOf('mopapa.v1.recovery.') !== 0 &&
          key.indexOf('mopapa.v1.corrupt.') !== 0
        ) continue;

        var value = localStorage.getItem(key) || '';
        if (key.indexOf('mopapa.v1.recovery.') === 0) {
          recoveryCount++;
          recoveryCharacters += key.length + value.length;
        } else {
          corruptCount++;
          corruptCharacters += key.length + value.length;
        }
      }

      var largest = rows[rows.length - 1];
      return {
        rows: rows,
        longRows: longRows,
        recoveryCount: recoveryCount,
        recoveryCharacters: recoveryCharacters,
        corruptCount: corruptCount,
        corruptCharacters: corruptCharacters,
        projectedCopies: largest && largest.saved
          ? [1, 5, 10].map(function (count) {
              return {
                additionalCopies: count,
                approximateUtf16Bytes: largest.approximateUtf16Bytes * count
              };
            })
          : []
      };
    });

    console.log('STORAGE BENCHMARK: SHORT ENTRIES');
    console.table(report.rows);

    console.log('STORAGE BENCHMARK: 1000-CHARACTER ENTRIES');
    console.table(report.longRows);
    console.log('Recovery copies:', report.recoveryCount,
      'Stored characters:', report.recoveryCharacters);
    console.log('Corrupt copies:', report.corruptCount,
      'Stored characters:', report.corruptCharacters);
    console.log('Projected extra full-record copies:', report.projectedCopies);

    assert.deepStrictEqual(opened.pageErrors, []);
    assert.strictEqual(report.rows.length, 4);
    assert.strictEqual(report.longRows.length, 7);

    report.rows.forEach(function (row) {
      if (row.saved) {
        assert.strictEqual(row.loadedEntries, row.entries);
      }
    });
    report.longRows.forEach(function (row) {
      if (row.saved) {
        assert.strictEqual(row.loadedEntries, row.entries);
      }
    });    
  } finally {
    await opened.context.close();
  }
}

async function run() {
  await startServer();

  browser = await playwright.chromium.launch({
    headless: true
  });

  await check('application starts and displays its title', async function (page) {
    assert.strictEqual(
      await page.title(),
      'Mopapa'
    );

    assert.strictEqual(
      await page.locator('#screen-home').isVisible(),
      true
    );
  });

  await check('failed recovery preservation locks writes and permits exact original download', async function (page) {
    var originalRaw = JSON.stringify({
      entries: [
        {
          id: 'valid-memory',
          text: 'This readable memory must survive',
          room: 'notes'
        },
        null
      ],
      learned: {},
      customRooms: [],
      ask: {
        aliases: [],
        boosts: {},
        unanswered: []
      }
    });

    await page.evaluate(function (raw) {
      localStorage.setItem('mopapa.v1', raw);
    }, originalRaw);

    await page.addInitScript(function () {
      var originalSetItem = Storage.prototype.setItem;

      Storage.prototype.setItem = function (key, value) {
        if (
          String(key).indexOf('mopapa.v1.recovery.') === 0
        ) {
          throw new Error('simulated recovery storage failure');
        }

        return originalSetItem.call(this, key, value);
      };
    });

    await page.reload({ waitUntil: 'load' });

    var originalButton = page.locator(
      '#btn-original-recovery-export'
    );

    assert.strictEqual(
      await originalButton.isVisible(),
      true
    );

    await page.locator('.app-dialog-ok').click();

    await page.locator('#talk-input').fill(
      'This new memory must not overwrite the original'
    );

    await page.locator('#send').click();

    assert.strictEqual(
      await page.locator('#talk-input').inputValue(),
      'This new memory must not overwrite the original'
    );

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      originalRaw
    );

    var originalDownloadPromise = page.waitForEvent('download');

    await originalButton.click();

    var originalDownload = await originalDownloadPromise;
    var originalPath = await originalDownload.path();

    assert.ok(originalPath);

    assert.strictEqual(
      fs.readFileSync(originalPath, 'utf8'),
      originalRaw
    );

    var readableBackupPromise = page.waitForEvent('download');

    await page.locator('#btn-export').click();

    var readableBackup = await readableBackupPromise;
    var readablePath = await readableBackup.path();

    assert.ok(readablePath);

    var readableData = JSON.parse(
      fs.readFileSync(readablePath, 'utf8')
    );

    assert.strictEqual(readableData.entries.length, 1);
    assert.strictEqual(
      readableData.entries[0].id,
      'valid-memory'
    );

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      originalRaw
    );
  });
  
  await check('recovery inventory displays every copy in correct order', async function (page) {
    await page.evaluate(function () {
      localStorage.setItem('mopapa.v1.recovery.1000', 'older');
      localStorage.setItem('mopapa.v1.recovery.2000', 'newer');
      localStorage.setItem('mopapa.v1.corrupt.2000.9', 'ninth');
      localStorage.setItem('mopapa.v1.corrupt.2000.10', 'tenth');
    });

    await page.reload({ waitUntil: 'load' });

    assert.strictEqual(
      await page.locator('#recovery-panel').isVisible(),
      true
    );

    var items = page.locator('.recovery-copy-item');

    assert.strictEqual(await items.count(), 4);

    var labels = await items.locator('.recovery-copy-label').allTextContents();

    assert.deepStrictEqual(labels, [
      'Corrupt-data copy',
      'Corrupt-data copy',
      'Rejected-entry recovery',
      'Rejected-entry recovery'
    ]);

    var dates = await items.locator('.recovery-copy-date').allTextContents();

    assert.ok(dates[0].includes('Copy 11'));
    assert.ok(dates[1].includes('Copy 10'));

    assert.strictEqual(
      await page.locator('.recovery-copy-download').count(),
      4
    );
  });
  
  await check('recovery downloads have distinct filenames and preserve exact contents', async function (page) {
    await page.evaluate(function () {
      localStorage.setItem(
        'mopapa.v1.corrupt.2000.10',
        'tenth-copy-data'
      );

      localStorage.setItem(
        'mopapa.v1.corrupt.2000.9',
        'ninth-copy-data'
      );

      localStorage.setItem(
        'mopapa.v1.recovery.not-a-date',
        'malformed-date-copy-data'
      );
    });

    await page.reload({ waitUntil: 'load' });

    var buttons = page.locator('.recovery-copy-download');

    assert.strictEqual(await buttons.count(), 3);

    var expected = [
      {
        filename: 'mopapa-corrupt-copy-2000.10.json',
        contents: 'tenth-copy-data'
      },
      {
        filename: 'mopapa-corrupt-copy-2000.9.json',
        contents: 'ninth-copy-data'
      },
      {
        filename: 'mopapa-recovery-copy-not-a-date.json',
        contents: 'malformed-date-copy-data'
      }
    ];

    for (var i = 0; i < expected.length; i++) {
      var downloadPromise = page.waitForEvent('download');

      await buttons.nth(i).click();

      var download = await downloadPromise;

      assert.strictEqual(
        download.suggestedFilename(),
        expected[i].filename
      );

      var downloadPath = await download.path();

      assert.ok(downloadPath);

      assert.strictEqual(
        fs.readFileSync(downloadPath, 'utf8'),
        expected[i].contents
      );
    }
  });

  await check('recovery inventory refreshes when a stored copy disappears', async function (page) {
    await page.evaluate(function () {
      localStorage.setItem(
        'mopapa.v1.corrupt.3000',
        'temporary-copy'
      );
    });

    await page.reload({ waitUntil: 'load' });

    assert.strictEqual(
      await page.locator('.recovery-copy-item').count(),
      1
    );

    await page.evaluate(function () {
      localStorage.removeItem('mopapa.v1.corrupt.3000');
    });

    await page.locator('.recovery-copy-download').click();

    assert.strictEqual(
      await page.locator('.recovery-copy-item').count(),
      0
    );

    assert.strictEqual(
      await page.locator('#recovery-panel').isVisible(),
      false
    );
  });
  
  await check('recovery inventory handles storage enumeration failure without crashing', async function (page) {
    await page.evaluate(function () {
      localStorage.setItem(
        'mopapa.v1.recovery.4000',
        'temporary-copy'
      );
    });

    await page.reload({ waitUntil: 'load' });

    assert.strictEqual(
      await page.locator('#recovery-panel').isVisible(),
      true
    );

    await page.evaluate(function () {
      Object.defineProperty(Storage.prototype, 'key', {
        configurable: true,
        value: function () {
          throw new Error('simulated storage enumeration failure');
        }
      });
    });

    await page.locator('.recovery-copy-download').click();

    assert.strictEqual(
      await page.locator('#recovery-panel').isVisible(),
      false
    );
  });  

  await check('browser storage protection explains its status and backup limitation', async function (page) {
    var status = page.locator('#storage-protection-status');
    var button = page.locator('#storage-protection-request');

    assert.strictEqual(
      await page.locator('#storage-protection').isVisible(),
      true
    );

    assert.ok(
      (await page.locator('.storage-protection-description').textContent())
        .includes('does not replace an external backup')
    );

    await page.waitForFunction(function () {
      var element = document.getElementById(
        'storage-protection-status'
      );

      return element &&
        !element.textContent.includes('Checking browser storage');
    });

    if (await button.isVisible()) {
      await button.click();

      await page.waitForFunction(function () {
        var element = document.getElementById(
          'storage-protection-status'
        );

        return element &&
          !element.textContent.includes('Requesting storage protection');
      });
    }

    var finalStatus = await status.textContent();

    assert.ok(finalStatus.length > 10);
    assert.ok(
      finalStatus.includes('persistent storage') ||
      finalStatus.includes('persistent-storage')
    );
  });

  await check('first-person task intentions are saved in To-dos', async function (page) {
    await saveText(
      page,
      'I need to renew my passport next month'
    );

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(
      data.entries[0].room,
      'todo'
    );

    assert.strictEqual(
      data.entries[0].text,
      'I need to renew my passport next month'
    );
  });

  await check('expanded direct actions are saved in To-dos', async function (page) {
    var text = 'Review the tenancy agreement tomorrow';

    await saveText(page, text);

    var confirmation = page.locator('#confirm');

    assert.strictEqual(
      await confirmation.getByRole('button', {
        name: 'Yes',
        exact: true
      }).isVisible(),
      true,
      'The date confirmation should appear'
    );

    await confirmation.getByRole('button', {
      name: 'Yes',
      exact: true
    }).click();

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].room, 'todo');
    assert.strictEqual(data.entries[0].text, text);
    assert.ok(data.entries[0].when);
  });

  await check('multi-word task intentions are saved in To-dos', async function (page) {
    var text = 'I need to fill out the council application';

    await saveText(page, text);

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].room, 'todo');
    assert.strictEqual(data.entries[0].text, text);
  });
  
  await check('question-shaped need-to text is not saved as a To-do', async function (page) {
    await saveText(
      page,
      'Do I need to pay council tax?'
    );

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(
      data.entries[0].room,
      'notes'
    );

    assert.strictEqual(
      data.entries[0].text,
      'Do I need to pay council tax?'
    );
  });

  await check('negative instructions are saved as Notes, not To-dos', async function (page) {
    var text = 'Do not renew my passport';

    await saveText(page, text);

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].room, 'notes');
    assert.strictEqual(data.entries[0].text, text);
  });

  await check('hypothetical task intentions are saved as Notes', async function (page) {
    var text = 'I might need to call the dentist';

    await saveText(page, text);

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].room, 'notes');
    assert.strictEqual(data.entries[0].text, text);
  });

  await check('quoted task instructions are saved as Notes', async function (page) {
    var text = '"Please complete the application by Friday"';

    await saveText(page, text);

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].room, 'notes');
    assert.strictEqual(data.entries[0].text, text);
  });

  await check('reported instructions are saved as Notes', async function (page) {
    var text = 'The email says to renew my passport';

    await saveText(page, text);

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].room, 'notes');
    assert.strictEqual(data.entries[0].text, text);
  });

  await check('indirect questions are saved as Notes', async function (page) {
    var text = 'Should I call the dentist?';

    await saveText(page, text);

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].room, 'notes');
    assert.strictEqual(data.entries[0].text, text);
  });

  await check('completed actions are saved as Notes, not new tasks', async function (page) {
    var text = 'I already paid the electricity bill';

    await saveText(page, text);

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].room, 'notes');
    assert.strictEqual(data.entries[0].text, text);
  });
  
  await check('Keep is selected by default', async function (page) {
    assert.strictEqual(
      await page.locator('#talk-mode-keep').getAttribute('aria-pressed'),
      'true'
    );

    assert.strictEqual(
      await page.locator('#talk-mode-ask').getAttribute('aria-pressed'),
      'false'
    );

    assert.ok(
      (await page.locator('#talk-input').getAttribute('placeholder'))
        .includes('remember')
    );
  });

  await check('mode buttons switch correctly in both directions', async function (page) {
    await page.locator('#talk-mode-ask').click();

    assert.strictEqual(
      await page.locator('#talk-mode-ask').getAttribute('aria-pressed'),
      'true'
    );

    assert.ok(
      (await page.locator('#talk-input').getAttribute('placeholder'))
        .includes('Ask')
    );

    await page.locator('#talk-mode-keep').click();

    assert.strictEqual(
      await page.locator('#talk-mode-keep').getAttribute('aria-pressed'),
      'true'
    );

    assert.strictEqual(
      await page.locator('#talk-mode-ask').getAttribute('aria-pressed'),
      'false'
    );
  });

  await check('question-shaped text is saved in Keep mode', async function (page) {
    var text = 'Where did I put the spare key?';

    await saveText(page, text);

    var data = await savedData(page);

    assert.ok(
      data.entries.some(function (entry) {
        return entry.text === text;
      })
    );

    assert.strictEqual(
      await page.locator('#talk-input').inputValue(),
      ''
    );
  });

  await check('Ask retrieves a saved location without saving the question', async function (page) {
    await saveText(
      page,
      'My spare key is in the kitchen drawer.'
    );

    await page.locator('#talk-mode-ask').click();

    await page.locator('#talk-input').fill(
      'Where is my spare key?'
    );

    await page.locator('#send').click();

    await page.waitForFunction(function () {
      return document.getElementById('bubble')
        .textContent.includes('kitchen drawer');
    });

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);

    assert.strictEqual(
      data.entries[0].text,
      'My spare key is in the kitchen drawer.'
    );

    assert.strictEqual(
      await page.locator('#answer-sources').isVisible(),
      true
    );
  });

  await check('multiline text survives Shift+Enter and saves intact', async function (page) {
    var input = page.locator('#talk-input');

    await input.fill('First line');
    await input.press('Shift+Enter');
    await input.type('Second line');

    assert.strictEqual(
      await input.inputValue(),
      'First line\nSecond line'
    );

    await page.locator('#send').click();

    var data = await savedData(page);

    assert.ok(
      data.entries.some(function (entry) {
        return entry.text === 'First line\nSecond line';
      })
    );
  });

  await check('Enter submits the composer', async function (page) {
    var input = page.locator('#talk-input');

    await input.fill('Saved using the Enter key');
    await input.press('Enter');

    var data = await savedData(page);

    assert.ok(
      data.entries.some(function (entry) {
        return entry.text === 'Saved using the Enter key';
      })
    );
  });

  await check('successful saving restores focus to the textarea', async function (page) {
    await saveText(page, 'Check composer focus after saving');

    assert.strictEqual(
      await page.evaluate(function () {
        return document.activeElement.id;
      }),
      'talk-input'
    );
  });

  await check('saved entries survive a browser reload', async function (page) {
    var text = 'This memory must survive a reload';

    await saveText(page, text);
    await page.reload({ waitUntil: 'load' });

    var data = await savedData(page);

    assert.ok(
      data.entries.some(function (entry) {
        return entry.text === text;
      })
    );
  });

  await check('Ask mode does not file an unanswered question as a memory', async function (page) {
    await page.locator('#talk-mode-ask').click();

    await page.locator('#talk-input').fill(
      'A question with no matching saved memory'
    );

    await page.locator('#send').click();

    assert.strictEqual(
      await page.locator('#confirm').isVisible(),
      true
    );

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 0);
  });


  await check('Ask displays recovery choices and temporarily disables the composer', async function (page) {
    await page.locator('#talk-mode-ask').click();
    await page.locator('#talk-input').fill('A question Mopapa cannot answer');
    await page.locator('#send').click();

    var choices = page.locator('#confirm');

    assert.strictEqual(await choices.isVisible(), true);
    assert.strictEqual(
      await choices.getByRole('button', { name: 'Keep this instead' }).count(),
      1
    );
    assert.strictEqual(
      await choices.getByRole('button', { name: 'Not now' }).count(),
      1
    );

    assert.strictEqual(await page.locator('#talk-input').isDisabled(), true);
    assert.strictEqual(await page.locator('#send').isDisabled(), true);
    assert.strictEqual(await page.locator('#talk-mode-keep').isDisabled(), true);
    assert.strictEqual(await page.locator('#talk-mode-ask').isDisabled(), true);
  });

  await check('Not now preserves the question and restores the composer', async function (page) {
    var question = 'A question with no matching saved memory';

    await page.locator('#talk-mode-ask').click();
    await page.locator('#talk-input').fill(question);
    await page.locator('#send').click();

    await page.locator('#confirm')
      .getByRole('button', { name: 'Not now' })
      .click();

    assert.strictEqual(
      await page.locator('#talk-input').inputValue(),
      question
    );

    assert.strictEqual(await page.locator('#talk-input').isDisabled(), false);
    assert.strictEqual(await page.locator('#send').isDisabled(), false);
    assert.strictEqual(await page.locator('#confirm').isVisible(), false);

    var data = await savedData(page);
    assert.strictEqual(data.entries.length, 0);
  });

  await check('Keep this instead files the original unanswered question', async function (page) {
    var question = 'A question I want to keep as a memory';

    await page.locator('#talk-mode-ask').click();
    await page.locator('#talk-input').fill(question);
    await page.locator('#send').click();

    await page.locator('#confirm')
      .getByRole('button', { name: 'Keep this instead' })
      .click();

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].text, question);
    assert.ok(
      typeof data.entries[0].room === 'string' &&
      data.entries[0].room.length > 0
    );
    assert.strictEqual(await page.locator('#talk-input').inputValue(), '');
    assert.strictEqual(await page.locator('#confirm').isVisible(), false);
  });

  await check('unanswered questions appear in Ask learning and can be cleared', async function (page) {
    var question = 'Something Mopapa has never been told';

    await page.locator('#talk-mode-ask').click();
    await page.locator('#talk-input').fill(question);
    await page.locator('#send').click();

    await page.locator('#confirm')
      .getByRole('button', { name: 'Not now' })
      .click();

    await page.locator('#ask-learning summary').click();

    assert.ok(
      (await page.locator('#ask-learning-misses').textContent())
        .includes(question)
    );

    assert.strictEqual(
      await page.locator('#ask-learning-clear-misses').isVisible(),
      true
    );

    await page.locator('#ask-learning-clear-misses').click();

    assert.ok(
      (await page.locator('#ask-learning-misses').textContent())
        .includes('None.')
    );

    assert.strictEqual(
      await page.locator('#ask-learning-clear-misses').isVisible(),
      false
    );
  });

  await check('repeating an unanswered question does not create duplicate learning records', async function (page) {
    var question = 'A repeated question with no answer';

    await page.locator('#talk-mode-ask').click();
    await page.locator('#talk-input').fill(question);
    await page.locator('#send').click();

    await page.locator('#confirm')
      .getByRole('button', { name: 'Not now' })
      .click();

    await page.locator('#send').click();

    var data = await savedData(page);

    assert.strictEqual(data.ask.unanswered.length, 1);
    assert.strictEqual(data.ask.unanswered[0].q, question);
  });

  await check('taught word aliases persist after reloading Mopapa', async function (page) {
    await page.locator('#talk-mode-ask').click();
    await page.locator('#talk-input').fill('by GP I mean doctor');
    await page.locator('#send').click();

    assert.strictEqual(await page.locator('#talk-input').inputValue(), '');

    await page.locator('#ask-learning summary').click();

    assert.ok(
      (await page.locator('#ask-learning-aliases').textContent())
        .includes('gp')
    );

    await page.reload({ waitUntil: 'load' });
    await page.locator('#ask-learning summary').click();

    var aliases = await page.locator('#ask-learning-aliases').textContent();

    assert.ok(aliases.includes('gp'));
    assert.ok(aliases.includes('doctor'));

    var data = await savedData(page);
    assert.strictEqual(data.entries.length, 0);
  });

  await check('a taught word alias can be removed from Ask learning', async function (page) {
    await page.locator('#talk-mode-ask').click();
    await page.locator('#talk-input').fill('by GP I mean doctor');
    await page.locator('#send').click();

    await page.locator('#ask-learning summary').click();

    var aliases = page.locator('#ask-learning-aliases');

    assert.ok((await aliases.textContent()).includes('gp'));

    await aliases.getByRole('button', { name: 'Remove' }).click();

    assert.ok(
      !(await aliases.textContent()).includes('gp')
    );

    var data = await savedData(page);
    assert.strictEqual(data.ask.aliases.length, 0);
  });

  await check('saved Ask sources can be selected using the keyboard', async function (page) {
    await saveText(page, 'My spare key is in the kitchen drawer.');

    await page.locator('#talk-mode-ask').click();
    await page.locator('#talk-input').fill('Where is my spare key?');
    await page.locator('#send').click();

    var source = page.locator('#answer-sources .source-entry');

    assert.strictEqual(await source.count(), 1);
    assert.strictEqual(await source.getAttribute('role'), 'button');

    await source.focus();
    await source.press('Space');

    assert.ok(
      await source.evaluate(function (element) {
        return element.classList.contains('chosen');
      })
    );
  });

  await check('changing composer mode preserves an unfinished draft', async function (page) {
    var draft = 'Where did I put the spare key?';

    await page.locator('#talk-mode-ask').click();
    await page.locator('#talk-input').fill(draft);
    await page.locator('#talk-mode-keep').click();

    assert.strictEqual(
      await page.locator('#talk-input').inputValue(),
      draft
    );

    await page.locator('#send').click();

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].text, draft);
  });

  await check('submitting an empty Ask request does not create a missed question', async function (page) {
    await page.locator('#talk-mode-ask').click();
    await page.locator('#send').click();

    var data = await savedData(page);

    assert.strictEqual(
      Array.isArray(data.entries) ? data.entries.length : 0,
      0
    );
    assert.strictEqual(
      data.ask && Array.isArray(data.ask.unanswered)
        ? data.ask.unanswered.length
        : 0,
      0
    );
    assert.strictEqual(await page.locator('#confirm').isVisible(), false);
  });

  await check('layout fits a 360px mobile viewport', async function (page) {
    await page.setViewportSize({ width: 360, height: 640 });

    var dimensions = await page.evaluate(function () {
      return {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      };
    });

    assert.ok(
      dimensions.scrollWidth <= dimensions.width,
      'Page overflows at 360px'
    );
  });

  await check('layout fits a 390px mobile viewport', async function (page) {
    await page.setViewportSize({ width: 390, height: 844 });

    var dimensions = await page.evaluate(function () {
      return {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      };
    });

    assert.ok(
      dimensions.scrollWidth <= dimensions.width,
      'Page overflows at 390px'
    );
  });

  await check('layout remains usable with enlarged root text', async function (page) {
    await page.setViewportSize({ width: 360, height: 640 });

    await page.evaluate(function () {
      document.documentElement.style.fontSize = '200%';
    });

    var dimensions = await page.evaluate(function () {
      return {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      };
    });

    assert.ok(
      dimensions.scrollWidth <= dimensions.width,
      'Enlarged text causes horizontal page overflow'
    );
  });

  await check('keyboard navigation exposes a visible focus indicator', async function (page) {
    await page.keyboard.press('Tab');

    var focus = await page.evaluate(function () {
      var style = getComputedStyle(document.activeElement);

      return {
        element: document.activeElement.id,
        outlineWidth: parseFloat(style.outlineWidth),
        outlineStyle: style.outlineStyle
      };
    });

    assert.ok(focus.element, 'Keyboard focus did not reach a control');
    assert.ok(focus.outlineWidth > 0, 'Focused control has no visible outline');
    assert.notStrictEqual(focus.outlineStyle, 'none');
  });

  await check('search controls retain minimum mobile touch heights', async function (page) {
    var heights = await page.locator(
      '#memory-search-input, #memory-search-form button'
    ).evaluateAll(function (elements) {
      return elements.map(function (element) {
        return element.getBoundingClientRect().height;
      });
    });

    assert.ok(heights.length >= 3);

    heights.forEach(function (height) {
      assert.ok(height >= 44, 'Search control is shorter than 44px');
    });
  });

  await check('long saved memories wrap without horizontal overflow', async function (page) {
    await page.setViewportSize({ width: 320, height: 640 });

    await saveText(page, 'Memory '.repeat(120));

    var dimensions = await page.evaluate(function () {
      return {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      };
    });

    assert.ok(
      dimensions.scrollWidth <= dimensions.width,
      'Long saved memory creates horizontal overflow'
    );
  });

  await check('Ask source cards remain inside a narrow mobile viewport', async function (page) {
    await page.setViewportSize({ width: 320, height: 640 });

    await saveText(page, 'My spare house key is inside the small wooden kitchen drawer.');

    await page.locator('#talk-mode-ask').click();
    await page.locator('#talk-input').fill('Where is my spare house key?');
    await page.locator('#send').click();

    await page.waitForFunction(function () {
      return document.querySelectorAll('#answer-sources .source-entry').length > 0;
    });

    var bounds = await page.locator(
      '#answer-sources .source-entry'
    ).first().boundingBox();

    assert.ok(bounds);
    assert.ok(bounds.x >= 0);
    assert.ok(bounds.x + bounds.width <= 320);
  });

  await check('search result buttons retain minimum touch height', async function (page) {
    await saveText(page, 'The spare charger is in the office drawer.');

    await page.locator('#memory-search-input').fill('spare charger');
    await page.locator('#memory-search-form button[type="submit"]').click();

    var height = await page.locator(
      '#memory-search-results button'
    ).first().evaluate(function (button) {
      return button.getBoundingClientRect().height;
    });

    assert.ok(height >= 44, 'Search result Open button is too short');
  });

  await check('room navigation remains wide enough to use on mobile', async function (page) {
    var height = await page.locator('.room-card').first().evaluate(function (element) {
      return element.getBoundingClientRect().height;
    });

    assert.ok(height >= 44, 'Room navigation target is too short');
  });
  
  await check('mobile layouts have no horizontal page overflow', async function (page) {
    var widths = [320, 360, 375, 390, 430];

    for (var i = 0; i < widths.length; i++) {
      await page.setViewportSize({
        width: widths[i],
        height: 844
      });

      var dimensions = await page.evaluate(function () {
        return {
          viewport: document.documentElement.clientWidth,
          page: document.documentElement.scrollWidth
        };
      });

      assert.ok(
        dimensions.page <= dimensions.viewport,
        'Horizontal overflow at ' + widths[i] +
          'px: page=' + dimensions.page
      );
    }
  });

  await check('composer buttons meet the 44px minimum touch height', async function (page) {
    var ids = [
      '#talk-mode-keep',
      '#talk-mode-ask',
      '#send'
    ];

    for (var i = 0; i < ids.length; i++) {
      var height = await page.locator(ids[i]).evaluate(function (element) {
        return element.getBoundingClientRect().height;
      });

      assert.ok(
        height >= 44,
        ids[i] + ' is only ' + height + 'px high'
      );
    }
  });

  await check('room navigation opens and returns to the home screen', async function (page) {
    await page.locator('.room-card').filter({
      hasText: 'Notes'
    }).click();

    assert.strictEqual(
      await page.locator('#screen-room').isVisible(),
      true
    );

    assert.strictEqual(
      await page.locator('#screen-home').isVisible(),
      false
    );

    await page.locator('#back').click();

    assert.strictEqual(
      await page.locator('#screen-home').isVisible(),
      true
    );
  });

  await check('reduced-motion preference disables pet animation', async function (page) {
    await page.emulateMedia({
      reducedMotion: 'reduce'
    });

    var duration = await page.locator('#pet svg').evaluate(function (element) {
      return getComputedStyle(element).animationDuration;
    });

    assert.ok(
      duration.split(',').every(function (value) {
        return parseFloat(value) === 0;
      }),
      'Pet animation should be disabled when reduced motion is requested'
    );
  });

  await check('composer has an accessible label and three-row input', async function (page) {
    assert.strictEqual(
      await page.locator('label[for="talk-input"]').textContent(),
      'Text to keep or question to ask'
    );

    assert.strictEqual(
      await page.locator('#talk-input').getAttribute('rows'),
      '3'
    );
  });


  await check('successful browser restore replaces data and preserves custom rooms and Ask learning', async function (page) {
    await page.evaluate(function () {
      localStorage.setItem('mopapa.v1', JSON.stringify({
        schemaVersion: 1,
        entries: [
          { id: 'old', text: 'Old memory', room: 'notes' }
        ],
        learned: {},
        customRooms: [],
        ask: { aliases: [], boosts: {}, unanswered: [] }
      }));
    });

    await page.reload({ waitUntil: 'load' });

    var backup = {
      schemaVersion: 1,
      entries: [
        { id: 'restored', text: 'Restored memory', room: 'notes' }
      ],
      learned: { example: 3 },
      customRooms: [
        { id: 'custom_books', name: 'Books', icon: 'book' }
      ],
      ask: {
        aliases: [['gp', 'doctor']],
        boosts: {},
        unanswered: [{ q: 'Who was that?', at: '2026-01-01' }]
      }
    };

    await page.locator('#file-import').setInputFiles({
      name: 'valid-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup))
    });

    assert.strictEqual(
      await page.locator('.app-dialog').isVisible(),
      true
    );

    await page.locator('.app-dialog-ok').click();

    await page.waitForFunction(function () {
      var data = JSON.parse(localStorage.getItem('mopapa.v1') || '{}');
      return data.entries &&
        data.entries.length === 1 &&
        data.entries[0].id === 'restored';
    });

    var data = await savedData(page);

    assert.strictEqual(data.schemaVersion, 1);
    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].text, 'Restored memory');
    assert.strictEqual(data.learned.example, 3);
    assert.strictEqual(data.customRooms.length, 1);
    assert.strictEqual(data.customRooms[0].name, 'Books');
    assert.strictEqual(data.ask.aliases[0][0], 'gp');
    assert.strictEqual(data.ask.unanswered.length, 1);

    assert.ok(
      await page.locator('#bubble').textContent()
    );
  });

  await check('duplicate IDs in a browser restore preserve existing data', async function (page) {
    await saveText(page, 'Existing memory must survive');

    var before = await page.evaluate(function () {
      return localStorage.getItem('mopapa.v1');
    });

    var backup = {
      entries: [
        { id: 'duplicate', text: 'First entry', room: 'notes' },
        { id: 'duplicate', text: 'Second entry', room: 'notes' }
      ]
    };

    await page.locator('#file-import').setInputFiles({
      name: 'duplicate-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup))
    });

    await page.locator('.app-dialog-ok').click();

    await page.waitForFunction(function () {
      return !document.querySelector('.app-dialog').open;
    });

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      before
    );

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(
      data.entries[0].text,
      'Existing memory must survive'
    );
  });

  await check('unsupported schema version in browser restore preserves existing data', async function (page) {
    await saveText(page, 'Schema protection memory');

    var before = await page.evaluate(function () {
      return localStorage.getItem('mopapa.v1');
    });

    var backup = {
      schemaVersion: 999,
      entries: [
        { id: 'future', text: 'Future memory', room: 'notes' }
      ]
    };

    await page.locator('#file-import').setInputFiles({
      name: 'future-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup))
    });

    await page.locator('.app-dialog-ok').click();

    await page.waitForFunction(function () {
      return !document.querySelector('.app-dialog').open;
    });

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      before
    );

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(
      data.entries[0].text,
      'Schema protection memory'
    );
  });

  await check('cancelling browser restore leaves existing memories untouched', async function (page) {
    await saveText(page, 'Memory must remain after cancellation');

    var before = await page.evaluate(function () {
      return localStorage.getItem('mopapa.v1');
    });

    await page.locator('#file-import').setInputFiles({
      name: 'cancelled-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        entries: [
          { id: 'replacement', text: 'Must not be imported', room: 'notes' }
        ]
      }))
    });

    await page.locator('.app-dialog-cancel').click();

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      before
    );
  });

  await check('browser restore refuses to overwrite data changed by another tab', async function (page) {
    await saveText(page, 'Original tab memory');

    var externalData = JSON.stringify({
      schemaVersion: 1,
      entries: [
        { id: 'external', text: 'Memory saved elsewhere', room: 'notes' }
      ],
      learned: {},
      customRooms: [],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    });

    await page.locator('#file-import').setInputFiles({
      name: 'stale-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        entries: [
          { id: 'replacement', text: 'Stale replacement', room: 'notes' }
        ]
      }))
    });

    await page.evaluate(function (raw) {
      localStorage.setItem('mopapa.v1', raw);
    }, externalData);

    await page.locator('.app-dialog-ok').click();

    await page.waitForFunction(function () {
      return !document.querySelector('.app-dialog').open;
    });

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      externalData
    );

    var data = await savedData(page);

    assert.strictEqual(data.entries[0].id, 'external');
    assert.strictEqual(data.entries[0].text, 'Memory saved elsewhere');
  });

  await check('browser restore rejects oversized files without changing existing data', async function (page) {
    await saveText(page, 'Oversized import protection memory');

    var before = await page.evaluate(function () {
      return localStorage.getItem('mopapa.v1');
    });

    await page.locator('#file-import').setInputFiles({
      name: 'oversized-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 32)
    });

    assert.strictEqual(
      await page.locator('.app-dialog').isVisible(),
      false
    );

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      before
    );

    assert.ok(
      (await page.locator('#bubble').textContent())
        .includes('larger than 5 MB')
    );
  });

  await check('corrupt startup data is preserved and downloadable without being overwritten', async function (page) {
    var originalRaw = '{"entries": [this is deliberately corrupt';

    await page.evaluate(function (raw) {
      localStorage.setItem('mopapa.v1', raw);
    }, originalRaw);

    await page.reload({ waitUntil: 'load' });

    assert.strictEqual(
      await page.locator('.app-dialog').isVisible(),
      true
    );

    await page.locator('.app-dialog-ok').click();

    assert.strictEqual(
      await page.locator('#recovery-panel').isVisible(),
      true
    );

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      originalRaw
    );

    var downloadPromise = page.waitForEvent('download');

    await page.locator('#btn-recovery-export').click();

    var download = await downloadPromise;
    var downloadPath = await download.path();

    assert.ok(downloadPath);

    assert.strictEqual(
      require('node:fs').readFileSync(downloadPath, 'utf8'),
      originalRaw
    );

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      originalRaw
    );
  });

  await check('partially rejected startup data preserves the exact original recovery copy', async function (page) {
    var originalRaw = JSON.stringify({
      entries: [
        { id: 'valid', text: 'Readable memory', room: 'notes' },
        null,
        { id: 'another-valid', text: 'Another memory', room: 'notes' }
      ],
      learned: {},
      customRooms: [],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    });

    await page.evaluate(function (raw) {
      localStorage.setItem('mopapa.v1', raw);
    }, originalRaw);

    await page.reload({ waitUntil: 'load' });

    assert.strictEqual(
      await page.locator('.app-dialog').isVisible(),
      true
    );

    await page.locator('.app-dialog-ok').click();

    var data = await page.evaluate(function () {
      return window.Mopapa.store.data();
    });

    assert.strictEqual(data.entries.length, 2);
    assert.strictEqual(data.entries[0].id, 'valid');
    assert.strictEqual(data.entries[1].id, 'another-valid');

    assert.strictEqual(
      await page.locator('#recovery-panel').isVisible(),
      true
    );

    var downloadPromise = page.waitForEvent('download');

    await page.locator('#btn-recovery-export').click();

    var download = await downloadPromise;
    var downloadPath = await download.path();

    assert.ok(downloadPath);

    assert.strictEqual(
      require('node:fs').readFileSync(downloadPath, 'utf8'),
      originalRaw
    );
  });

  await check('storage access failure blocks saving and restoring without attempting writes', async function (page) {
    await page.addInitScript(function () {
      window.__mopapaWriteAttempts = 0;

      var originalGet = Storage.prototype.getItem;
      var originalSet = Storage.prototype.setItem;

      Storage.prototype.getItem = function (key) {
        if (key === 'mopapa.v1') {
          throw new Error('simulated storage access failure');
        }

        return originalGet.call(this, key);
      };

      Storage.prototype.setItem = function (key, value) {
        if (key === 'mopapa.v1') {
          window.__mopapaWriteAttempts++;
        }

        return originalSet.call(this, key, value);
      };
    });

    await page.reload({ waitUntil: 'load' });

    assert.strictEqual(
      await page.evaluate(function () {
        return window.Mopapa.store.data().storageUnavailable;
      }),
      true
    );

    assert.strictEqual(
      await page.locator('.app-dialog').isVisible(),
      true
    );

    await page.locator('.app-dialog-ok').click();

    await page.locator('#talk-input').fill(
      'This memory must not be saved'
    );

    await page.locator('#send').click();

    assert.strictEqual(
      await page.evaluate(function () {
        return window.Mopapa.store.data().storageUnavailable;
      }),
      true
    );

    assert.strictEqual(
      await page.evaluate(function () {
        return window.__mopapaWriteAttempts;
      }),
      0
    );

    await page.locator('#file-import').setInputFiles({
      name: 'storage-unavailable-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        entries: [
          { id: 'replacement', text: 'Must not overwrite', room: 'notes' }
        ]
      }))
    });

    await page.locator('.app-dialog-ok').click();

    await page.waitForFunction(function () {
      return !document.querySelector('.app-dialog').open;
    });

    assert.strictEqual(
      await page.evaluate(function () {
        return window.__mopapaWriteAttempts;
      }),
      0
    );

    assert.strictEqual(
      await page.evaluate(function () {
        return window.Mopapa.store.data().entries.length;
      }),
      0
    );
  });

  await check('quota-style save failure preserves existing data and keeps the composer text', async function (page) {
    await saveText(page, 'Original saved memory');

    var before = await page.evaluate(function () {
      return localStorage.getItem('mopapa.v1');
    });

    await page.evaluate(function () {
      var originalSetItem = Storage.prototype.setItem;

      Storage.prototype.setItem = function (key, value) {
        if (key === 'mopapa.v1') {
          throw new DOMException(
            'Simulated storage quota exceeded',
            'QuotaExceededError'
          );
        }

        return originalSetItem.call(this, key, value);
      };
    });

    var attemptedText = 'This memory must survive a failed save';

    await saveText(page, attemptedText);

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      before
    );

    assert.strictEqual(
      await page.locator('#talk-input').inputValue(),
      attemptedText
    );

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(
      data.entries[0].text,
      'Original saved memory'
    );

    assert.ok(
      (await page.locator('#bubble').textContent())
        .includes("couldn't save")
    );
  });

  await check('quota-style restore failure preserves existing saved and in-memory data', async function (page) {
    await saveText(page, 'Original memory before restore');

    var before = await page.evaluate(function () {
      return localStorage.getItem('mopapa.v1');
    });

    await page.evaluate(function () {
      var originalSetItem = Storage.prototype.setItem;

      Storage.prototype.setItem = function (key, value) {
        if (key === 'mopapa.v1') {
          throw new DOMException(
            'Simulated storage quota exceeded',
            'QuotaExceededError'
          );
        }

        return originalSetItem.call(this, key, value);
      };
    });

    await page.locator('#file-import').setInputFiles({
      name: 'replacement-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        schemaVersion: 1,
        entries: [{
          id: 'replacement',
          text: 'This replacement must not be saved',
          room: 'notes'
        }],
        learned: {},
        customRooms: [],
        ask: { aliases: [], boosts: {}, unanswered: [] }
      }))
    });

    assert.strictEqual(
      await page.locator('.app-dialog').isVisible(),
      true
    );

    await page.locator('.app-dialog-ok').click();

    await page.waitForFunction(function () {
      return !document.querySelector('.app-dialog').open;
    });

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1');
      }),
      before
    );

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(
      data.entries[0].text,
      'Original memory before restore'
    );

    var inMemory = await page.evaluate(function () {
      return window.Mopapa.store.data().entries;
    });

    assert.strictEqual(inMemory.length, 1);
    assert.strictEqual(
      inMemory[0].text,
      'Original memory before restore'
    );

    var failureMessage = await page.evaluate(function () {
      return (
        (document.getElementById('bubble') || {}).textContent || ''
      ) + ' ' + (
        (document.getElementById('toast') || {}).textContent || ''
      );
    });

    assert.ok(
      failureMessage.includes("couldn't restore"),
      'Expected the pet bubble or toast to explain the failed restore'
    );
  });
  
  await check('valid browser restore can recover from corrupt startup data', async function (page) {
    var originalRaw = '{"entries": broken';

    await page.evaluate(function (raw) {
      localStorage.setItem('mopapa.v1', raw);
    }, originalRaw);

    await page.reload({ waitUntil: 'load' });

    await page.locator('.app-dialog-ok').click();

    assert.strictEqual(
      await page.locator('#recovery-panel').isVisible(),
      true
    );

    var backup = {
      schemaVersion: 1,
      entries: [
        { id: 'recovered', text: 'Recovered memory', room: 'notes' }
      ],
      learned: {},
      customRooms: [],
      ask: { aliases: [], boosts: {}, unanswered: [] }
    };

    await page.locator('#file-import').setInputFiles({
      name: 'recovery-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup))
    });

    await page.locator('.app-dialog-ok').click();

    await page.waitForFunction(function () {
      try {
        var data = JSON.parse(
          localStorage.getItem('mopapa.v1') || '{}'
        );

        return data.entries &&
          data.entries.length === 1 &&
          data.entries[0].id === 'recovered';
      } catch (error) {
        return false;
      }
    });

    var data = await savedData(page);

    assert.strictEqual(data.entries.length, 1);
    assert.strictEqual(data.entries[0].text, 'Recovered memory');

    assert.strictEqual(
      await page.evaluate(function () {
        return localStorage.getItem('mopapa.v1.corrupt.' + 
          Object.keys(localStorage)
            .filter(function (key) {
              return key.indexOf('mopapa.v1.corrupt.') === 0;
            })[0].slice('mopapa.v1.corrupt.'.length)
        );
      }),
      originalRaw
    );

    assert.strictEqual(
      await page.locator('#recovery-panel').isVisible(),
      true
    );
  });

  await check('memory shelf stays hidden when there are no eligible memories', async function (page) {
    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      false
    );
  });

  await check('memory shelf displays an eligible saved memory and its metadata', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'shelf-display',
        'The spare keys are inside the blue cabinet',
        'notes',
        dateDaysAgo(12),
        false
      )
    ]);

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      true
    );

    assert.strictEqual(
      await page.locator('#memory-shelf-label').textContent(),
      'From your memory shelf'
    );

    assert.strictEqual(
      await page.locator('#memory-shelf-text').textContent(),
      'The spare keys are inside the blue cabinet'
    );

    assert.ok(
      (await page.locator('#memory-shelf-meta').textContent())
        .includes('Notes')
    );

    assert.ok(
      (await page.locator('#memory-shelf-meta').textContent())
        .includes('saved')
    );
  });

  await check('memory shelf respects the seven-calendar-day minimum age', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'too-recent',
        'This memory is only six days old',
        'notes',
        dateDaysAgo(6),
        false
      ),
      resurfaceEntry(
        'old-enough',
        'This memory is seven days old',
        'notes',
        dateDaysAgo(7),
        false
      )
    ]);

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      true
    );

    assert.strictEqual(
      await page.locator('#memory-shelf-text').textContent(),
      'This memory is seven days old'
    );
  });

  await check('memory shelf excludes feelings and completed memories', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'excluded-feelings',
        'This is a feelings entry',
        'feelings',
        dateDaysAgo(30),
        false
      ),
      resurfaceEntry(
        'completed-note',
        'This note has already been completed',
        'notes',
        dateDaysAgo(30),
        true
      )
    ]);

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      false
    );
  });

  await check('memory shelf puts anniversaries before ordinary memories', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'ordinary-memory',
        'An ordinary older memory',
        'notes',
        dateDaysAgo(20),
        false
      ),
      resurfaceEntry(
        'anniversary-memory',
        'A memory from this date last year',
        'ideas',
        dateLastYearToday(),
        false
      )
    ]);

    assert.strictEqual(
      await page.locator('#memory-shelf-label').textContent(),
      'On this day in ' + (new Date().getFullYear() - 1)
    );

    assert.strictEqual(
      await page.locator('#memory-shelf-text').textContent(),
      'A memory from this date last year'
    );
  });

  await check('memory shelf hides the another-memory button when only one memory qualifies', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'single-memory',
        'Only one eligible memory',
        'wishlist',
        dateDaysAgo(15),
        false
      )
    ]);

    assert.strictEqual(
      await page.locator('#memory-shelf-next').isVisible(),
      false
    );
  });

  await check('memory shelf cycles through memories and wraps back to the first', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'cycle-one',
        'First possible memory',
        'notes',
        dateDaysAgo(12),
        false
      ),
      resurfaceEntry(
        'cycle-two',
        'Second possible memory',
        'ideas',
        dateDaysAgo(13),
        false
      )
    ]);

    var firstText = await page.locator('#memory-shelf-text').textContent();

    var nextButton = page.locator('#memory-shelf-next');

    assert.strictEqual(await nextButton.isVisible(), true);

    assert.ok(
      (await nextButton.textContent()).includes('1/2')
    );

    await nextButton.click();

    var secondText = await page.locator('#memory-shelf-text').textContent();

    assert.notStrictEqual(secondText, firstText);

    assert.ok(
      (await nextButton.textContent()).includes('2/2')
    );

    await nextButton.click();

    assert.strictEqual(
      await page.locator('#memory-shelf-text').textContent(),
      firstText
    );

    assert.ok(
      (await nextButton.textContent()).includes('1/2')
    );
  });

  await check('opening a resurfaced memory navigates to that exact saved entry', async function (page) {
    var first = resurfaceEntry(
      'open-first',
      'First resurfaced entry',
      'notes',
      dateDaysAgo(12),
      false
    );

    var second = resurfaceEntry(
      'open-second',
      'Second resurfaced entry',
      'ideas',
      dateDaysAgo(13),
      false
    );

    await seedResurfaceEntries(page, [first, second]);

    await page.locator('#memory-shelf-next').click();

    var selectedText = await page.locator('#memory-shelf-text').textContent();

    var expectedId = selectedText === first.text
      ? first.id
      : second.id;

    await page.locator('#memory-shelf-open').click();

    assert.strictEqual(
      await page.locator('#screen-room').isVisible(),
      true
    );

    assert.strictEqual(
      await page.locator('#screen-home').isVisible(),
      false
    );

    var target = page.locator('#mopapa-entry-' + expectedId);

    assert.strictEqual(await target.count(), 1);
    assert.strictEqual(await target.isVisible(), true);

    assert.ok(
      await target.evaluate(function (element) {
        return element.classList.contains('entry-opened');
      })
    );
  });

  await check('memory shelf refresh preserves the currently selected memory', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'refresh-first',
        'First refresh memory',
        'notes',
        dateDaysAgo(12),
        false
      ),
      resurfaceEntry(
        'refresh-second',
        'Second refresh memory',
        'ideas',
        dateDaysAgo(13),
        false
      )
    ]);

    await page.locator('#memory-shelf-next').click();

    var selectedText = await page.locator('#memory-shelf-text').textContent();

    await page.evaluate(function () {
      window.Mopapa.resurfaceUI.refresh();
    });

    assert.strictEqual(
      await page.locator('#memory-shelf-text').textContent(),
      selectedText
    );
  });
  
  await check('memory shelf selects another valid memory when the current selection disappears', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'lifecycle-first',
        'First lifecycle memory',
        'notes',
        dateDaysAgo(12),
        false
      ),
      resurfaceEntry(
        'lifecycle-second',
        'Second lifecycle memory',
        'ideas',
        dateDaysAgo(13),
        false
      )
    ]);

    await page.locator('#memory-shelf-next').click();

    var selected = await page.locator('#memory-shelf-text').textContent();

    await page.evaluate(function (selectedText) {
      var entries = window.Mopapa.store.data().entries;
      window.Mopapa.store.data().entries = entries.filter(function (entry) {
        return entry.text !== selectedText;
      });
      window.Mopapa.resurfaceUI.refresh();
    }, selected);

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      true
    );

    assert.notStrictEqual(
      await page.locator('#memory-shelf-text').textContent(),
      selected
    );
  });

  await check('memory shelf hides when its last eligible memory is completed', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'lifecycle-complete',
        'Complete this resurfaced memory',
        'notes',
        dateDaysAgo(12),
        false
      )
    ]);

    await page.evaluate(function () {
      window.Mopapa.store.data().entries[0].done = true;
      window.Mopapa.resurfaceUI.refresh();
    });

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      false
    );
  });

  await check('memory shelf hides when its last eligible memory is removed', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'lifecycle-remove',
        'Remove this resurfaced memory',
        'notes',
        dateDaysAgo(12),
        false
      )
    ]);

    await page.evaluate(function () {
      window.Mopapa.store.data().entries = [];
      window.Mopapa.resurfaceUI.refresh();
    });

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      false
    );
  });

  await check('memory shelf displays a newly eligible memory after refresh', async function (page) {
    await seedResurfaceEntries(page, []);

    await page.evaluate(function (entry) {
      window.Mopapa.store.data().entries.push(entry);
      window.Mopapa.resurfaceUI.refresh();
    }, resurfaceEntry(
      'lifecycle-new',
      'A newly added eligible memory',
      'wishlist',
      dateDaysAgo(14),
      false
    ));

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      true
    );

    assert.strictEqual(
      await page.locator('#memory-shelf-text').textContent(),
      'A newly added eligible memory'
    );
  });

  await check('memory shelf Open button is keyboard accessible', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'keyboard-open',
        'Open this memory using the keyboard',
        'notes',
        dateDaysAgo(12),
        false
      )
    ]);

    var openButton = page.locator('#memory-shelf-open');

    await openButton.focus();

    assert.strictEqual(
      await openButton.evaluate(function (element) {
        return document.activeElement === element;
      }),
      true
    );

    await page.keyboard.press('Enter');

    assert.strictEqual(
      await page.locator('#screen-room').isVisible(),
      true
    );

    assert.strictEqual(
      await page.locator('#mopapa-entry-keyboard-open').count(),
      1
    );
  });

  await check('memory shelf next button is keyboard accessible', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'keyboard-next-one',
        'Keyboard first memory',
        'notes',
        dateDaysAgo(12),
        false
      ),
      resurfaceEntry(
        'keyboard-next-two',
        'Keyboard second memory',
        'ideas',
        dateDaysAgo(13),
        false
      )
    ]);

    var nextButton = page.locator('#memory-shelf-next');

    var before = await page.locator('#memory-shelf-text').textContent();

    await nextButton.focus();
    await page.keyboard.press('Enter');

    var after = await page.locator('#memory-shelf-text').textContent();

    assert.notStrictEqual(after, before);
  });

  await check('memory shelf controls retain minimum touch target heights', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'touch-controls-one',
        'First touch target memory',
        'notes',
        dateDaysAgo(12),
        false
      ),
      resurfaceEntry(
        'touch-controls-two',
        'Second touch target memory',
        'ideas',
        dateDaysAgo(13),
        false
      )
    ]);

    var dimensions = await page.evaluate(function () {
      return [
        document.getElementById('memory-shelf-open'),
        document.getElementById('memory-shelf-next')
      ].map(function (element) {
        return {
          height: element.getBoundingClientRect().height,
          width: element.getBoundingClientRect().width
        };
      });
    });

    dimensions.forEach(function (item) {
      assert.ok(item.height >= 44, 'Memory shelf button is shorter than 44px');
      assert.ok(item.width >= 44, 'Memory shelf button is narrower than 44px');
    });
  });

  await check('memory shelf updates its live region when another memory is selected', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'live-one',
        'First announced memory',
        'notes',
        dateDaysAgo(12),
        false
      ),
      resurfaceEntry(
        'live-two',
        'Second announced memory',
        'ideas',
        dateDaysAgo(13),
        false
      )
    ]);

    var article = page.locator('.memory-card');

    assert.strictEqual(
      await article.getAttribute('aria-live'),
      'polite'
    );

    var before = await page.locator('#memory-shelf-text').textContent();

    await page.locator('#memory-shelf-next').click();

    var after = await page.locator('#memory-shelf-text').textContent();

    assert.notStrictEqual(after, before);
    assert.strictEqual(
      await article.getAttribute('aria-live'),
      'polite'
    );
  });  

  await check('editing a resurfaced memory updates the shelf automatically', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'integration-edit',
        'Original resurfaced text',
        'notes',
        dateDaysAgo(12),
        false
      )
    ]);

    await page.evaluate(function () {
      window.Mopapa.room.open('notes', 'integration-edit');
    });

    await page.locator('#mopapa-entry-integration-edit .edit-entry').click();

    await page.locator('#edit-text-integration-edit').fill(
      'Updated resurfaced text'
    );

    await page.locator('#mopapa-entry-integration-edit .edit-save').click();

    assert.strictEqual(
      await page.locator('#memory-shelf-text').textContent(),
      'Updated resurfaced text'
    );

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      true
    );
  });
  
  await check('deleting the last resurfaced memory hides the shelf automatically', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'integration-delete',
        'Memory to delete',
        'notes',
        dateDaysAgo(12),
        false
      )
    ]);

    await page.evaluate(function () {
      window.Mopapa.room.open('notes', 'integration-delete');
    });

    await page.locator('#mopapa-entry-integration-delete .del').click();

    assert.strictEqual(
      await page.locator('.app-dialog').isVisible(),
      true
    );

    await page.locator('.app-dialog-ok').click();

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      false
    );

    var data = await savedData(page);

    assert.strictEqual(
      data.entries.some(function (entry) {
        return entry.id === 'integration-delete';
      }),
      false
    );
  });
  
  await check('moving a resurfaced memory to an excluded room removes it from the shelf', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'integration-move',
        'Memory to move',
        'notes',
        dateDaysAgo(12),
        false
      )
    ]);

    await page.evaluate(function () {
      window.Mopapa.room.open('notes', 'integration-move');
    });

    await page.locator(
      '#mopapa-entry-integration-move select[aria-label="Move to another room"]'
    ).selectOption('feelings');

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      false
    );

    var data = await savedData(page);

    var moved = data.entries.filter(function (entry) {
      return entry.id === 'integration-move';
    })[0];

    assert.ok(moved);
    assert.strictEqual(moved.room, 'feelings');
  });
  
  await check('moving a resurfaced memory between eligible rooms keeps it visible', async function (page) {
    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'integration-eligible-move',
        'Memory moved between eligible rooms',
        'notes',
        dateDaysAgo(12),
        false
      )
    ]);

    await page.evaluate(function () {
      window.Mopapa.room.open('notes', 'integration-eligible-move');
    });

    await page.locator(
      '#mopapa-entry-integration-eligible-move select[aria-label="Move to another room"]'
    ).selectOption('ideas');

    assert.strictEqual(
      await page.locator('#memory-shelf').isVisible(),
      true
    );

    assert.strictEqual(
      await page.locator('#memory-shelf-text').textContent(),
      'Memory moved between eligible rooms'
    );

    var data = await savedData(page);

    var moved = data.entries.filter(function (entry) {
      return entry.id === 'integration-eligible-move';
    })[0];

    assert.ok(moved);
    assert.strictEqual(moved.room, 'ideas');
  });
  
  await check('memory shelf displays saved text literally without creating HTML elements', async function (page) {
    var unsafeLookingText = '<img src=x onerror=alert(1)> Keep this text literally';

    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'literal-memory',
        unsafeLookingText,
        'notes',
        dateDaysAgo(15),
        false
      )
    ]);

    assert.strictEqual(
      await page.locator('#memory-shelf-text').textContent(),
      unsafeLookingText
    );

    assert.strictEqual(
      await page.locator('#memory-shelf-text img').count(),
      0
    );

    assert.strictEqual(
      await page.locator('img[src="x"]').count(),
      0
    );
  });

  await check('long resurfaced memories do not cause horizontal overflow on narrow screens', async function (page) {
    await page.setViewportSize({
      width: 320,
      height: 800
    });

    var longText = 'A resurfaced memory ' + new Array(950).join('x');

    await seedResurfaceEntries(page, [
      resurfaceEntry(
        'long-resurfaced',
        longText,
        'notes',
        dateDaysAgo(20),
        false
      )
    ]);

    var dimensions = await page.evaluate(function () {
      var textElement = document.querySelector('#memory-shelf-text');
      var shelf = document.querySelector('#memory-shelf');

      return {
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
        shelf: shelf.scrollWidth,
        text: textElement.scrollWidth,
        textClient: textElement.clientWidth
      };
    });

    assert.ok(
      dimensions.page <= dimensions.viewport,
      'Page has horizontal overflow: ' + JSON.stringify(dimensions)
    );

    assert.ok(
      dimensions.text <= dimensions.textClient + 1,
      'Resurfaced text exceeds its container: ' + JSON.stringify(dimensions)
    );
  });
  
  await check('search ranks an exact phrase above separated word matches', async function (page) {
    await page.evaluate(function () {
      localStorage.setItem('mopapa.v1', JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            id: 'separated-match',
            text: 'Passport is stored in the safe',
            room: 'notes',
            created: '2026-10-02T10:00:00.000Z'
          },
          {
            id: 'exact-match',
            text: 'Passport safe location',
            room: 'notes',
            created: '2026-10-01T10:00:00.000Z'
          }
        ],
        learned: {},
        customRooms: [],
        ask: { aliases: [], boosts: {}, unanswered: [] }
      }));
    });

    await page.reload({ waitUntil: 'load' });

    await page.locator('#memory-search-input').fill('passport safe');
    await page.locator('.memory-search-submit').click();

    var results = page.locator('.memory-search-result');

    assert.strictEqual(await results.count(), 2);

    assert.ok(
      (await results.nth(0).textContent()).includes('Passport safe location'),
      'The exact phrase match should rank first'
    );

    assert.ok(
      (await results.nth(1).textContent()).includes('Passport is stored in the safe')
    );
  });

  await check('search displays at most ten results and reports the full total', async function (page) {
    var entries = [];

    for (var i = 0; i < 12; i++) {
      entries.push({
        id: 'search-limit-' + i,
        text: 'Blue lantern household memory ' + i,
        room: 'notes',
        created: new Date(Date.UTC(2026, 0, i + 1)).toISOString()
      });
    }

    await page.evaluate(function (savedEntries) {
      localStorage.setItem('mopapa.v1', JSON.stringify({
        schemaVersion: 1,
        entries: savedEntries,
        learned: {},
        customRooms: [],
        ask: { aliases: [], boosts: {}, unanswered: [] }
      }));
    }, entries);

    await page.reload({ waitUntil: 'load' });

    await page.locator('#memory-search-input').fill('blue lantern');
    await page.locator('.memory-search-submit').click();

    assert.strictEqual(
      await page.locator('.memory-search-result').count(),
      10
    );

    var status = await page.locator('#memory-search-status').textContent();

    assert.ok(status.includes('Found 12 saved entries.'));
    assert.ok(status.includes('Showing the best 10.'));
  });

  await check('clearing search removes results resets status and restores focus', async function (page) {
    await saveText(page, 'The blue lantern is in the hallway');

    await page.locator('#memory-search-input').fill('blue lantern');
    await page.locator('.memory-search-submit').click();

    assert.strictEqual(
      await page.locator('.memory-search-result').count(),
      1
    );

    await page.locator('#memory-search-clear').click();

    assert.strictEqual(
      await page.locator('#memory-search-input').inputValue(),
      ''
    );

    assert.strictEqual(
      await page.locator('#memory-search-results').isHidden(),
      true
    );

    assert.strictEqual(
      await page.locator('.memory-search-result').count(),
      0
    );

    assert.strictEqual(
      await page.locator('#memory-search-status').textContent(),
      'Search looks through every room on this device.'
    );

    assert.strictEqual(
      await page.evaluate(function () {
        return document.activeElement.id;
      }),
      'memory-search-input'
    );
  });

  await check('a no-match search removes previously displayed results', async function (page) {
    await saveText(page, 'The blue lantern is in the hallway');

    var input = page.locator('#memory-search-input');
    var submit = page.locator('.memory-search-submit');
    var results = page.locator('.memory-search-result');

    await input.fill('blue lantern');
    await submit.click();

    assert.strictEqual(await results.count(), 1);

    await input.fill('unrelated volcano');
    await submit.click();

    assert.strictEqual(await results.count(), 0);

    assert.strictEqual(
      await page.locator('#memory-search-results').isHidden(),
      true
    );

    assert.ok(
      (await page.locator('#memory-search-status').textContent())
        .includes('No saved entries matched.')
    );
  });

  await check('opening a search result navigates to the correct saved entry', async function (page) {
    await page.evaluate(function () {
      localStorage.setItem('mopapa.v1', JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            id: 'correct-search-target',
            text: 'The spare passport is inside the blue folder',
            room: 'notes',
            created: '2026-10-01T10:00:00.000Z'
          },
          {
            id: 'other-search-entry',
            text: 'Passport photographs are in the desk drawer',
            room: 'notes',
            created: '2026-10-02T10:00:00.000Z'
          }
        ],
        learned: {},
        customRooms: [],
        ask: { aliases: [], boosts: {}, unanswered: [] }
      }));
    });

    await page.reload({ waitUntil: 'load' });

    await page.locator('#memory-search-input').fill('spare passport');
    await page.locator('.memory-search-submit').click();

    await page.locator('.memory-search-result')
      .filter({ hasText: 'blue folder' })
      .locator('.memory-search-open')
      .click();

    assert.strictEqual(
      await page.locator('#screen-room').isVisible(),
      true
    );

    assert.strictEqual(
      await page.locator('#screen-home').isVisible(),
      false
    );

    var target = page.locator('#mopapa-entry-correct-search-target');

    assert.strictEqual(await target.count(), 1);
    assert.strictEqual(await target.isVisible(), true);

    assert.ok(
      await target.evaluate(function (element) {
        return element.classList.contains('entry-opened');
      })
    );
  });

  await check('long search results do not create horizontal overflow on narrow screens', async function (page) {
    await page.setViewportSize({ width: 320, height: 800 });

    var longText = 'Needle ' + new Array(994).join('x');

    await page.evaluate(function (text) {
      localStorage.setItem('mopapa.v1', JSON.stringify({
        schemaVersion: 1,
        entries: [{
          id: 'long-search-entry',
          text: text,
          room: 'notes',
          created: '2026-10-01T10:00:00.000Z'
        }],
        learned: {},
        customRooms: [],
        ask: { aliases: [], boosts: {}, unanswered: [] }
      }));
    }, longText);

    await page.reload({ waitUntil: 'load' });

    await page.locator('#memory-search-input').fill('needle');
    await page.locator('.memory-search-submit').click();

    assert.strictEqual(
      await page.locator('.memory-search-result').count(),
      1
    );

    var dimensions = await page.evaluate(function () {
      return {
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
        result: document.querySelector('.memory-search-result').scrollWidth,
        resultBody: document.querySelector('.memory-search-result-body').clientWidth
      };
    });

    assert.ok(
      dimensions.page <= dimensions.viewport,
      'Page has horizontal overflow: ' + JSON.stringify(dimensions)
    );

    assert.ok(
      dimensions.result <= dimensions.resultBody + 1,
      'Search result content exceeds its body width: ' + JSON.stringify(dimensions)
    );
  });

  await check('search controls and results expose accessible labels and status', async function (page) {
    await saveText(page, 'The blue lantern is in the hallway');

    var input = page.locator('#memory-search-input');

    assert.strictEqual(await input.count(), 1);
  
    assert.strictEqual(
      await page.locator('label[for="memory-search-input"]').count(),
      1
    );

    assert.strictEqual(
      await page.locator('#memory-search-status').getAttribute('aria-live'),
      'polite'
    );

    await input.fill('blue lantern');
    await page.locator('.memory-search-submit').click();

    assert.strictEqual(
      await page.locator('#memory-search-results').getAttribute('hidden'),
      null
    );

    var searchResults = page.locator('#memory-search-results');

    assert.strictEqual(
      await searchResults.getByRole('button', { name: 'Open' }).count(),
      1
    );

    assert.strictEqual(
      await page.locator('#memory-search-clear').count(),
      1
    );

    assert.strictEqual(
      await page.locator('#memory-search-clear').getAttribute('type'),
      'button'
    );
  });

  await check('search can be submitted repeatedly with the Enter key', async function (page) {
    await saveText(page, 'The blue lantern is in the hallway');

    var input = page.locator('#memory-search-input');

    await input.fill('blue lantern');
    await input.press('Enter');

    assert.strictEqual(
      await page.locator('.memory-search-result').count(),
      1
    );

    await input.fill('hallway');
    await input.press('Enter');

    assert.strictEqual(
      await page.locator('.memory-search-result').count(),
      1
    );

    assert.ok(
      (await page.locator('.memory-search-result').first().textContent())
        .includes('blue lantern')
    );

    assert.ok(
      (await page.locator('#memory-search-status').textContent())
        .includes('Found 1 saved entry.')
    );
  });
  
  var lockTest = await openPage();
  var secondPage = null;
  var secondPageErrors = [];

  try {
    secondPage = await lockTest.context.newPage();

    secondPage.on('pageerror', function (error) {
      secondPageErrors.push(error.message);
    });

    await secondPage.route(
      /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
      function (route) {
        return route.abort();
      }
    );

    await secondPage.goto(baseUrl, { waitUntil: 'load' });

    assert.strictEqual(
      await lockTest.page.locator('#write-status').isVisible(),
      false,
      'The first tab should own the write lock'
    );

    assert.strictEqual(
      await secondPage.locator('#write-status').isVisible(),
      true,
      'The second tab should be read-only'
    );

    assert.ok(
      (await secondPage.locator('#write-status').textContent())
        .includes('read-only')
    );

    await saveText(
      lockTest.page,
      'Saved by the writable tab'
    );

    await secondPage.locator('#talk-input').fill(
      'Attempted edit from the read-only tab'
    );

    await secondPage.locator('#send').click();

    var protectedData = await savedData(secondPage);

    assert.strictEqual(protectedData.entries.length, 1);

    assert.strictEqual(
      protectedData.entries[0].text,
      'Saved by the writable tab'
    );

    assert.strictEqual(
      await secondPage.locator('#talk-input').inputValue(),
      'Attempted edit from the read-only tab'
    );

    assert.ok(
      (await secondPage.locator('#bubble').textContent())
        .includes('read-only')
    );

    await lockTest.page.close();

    await secondPage.reload({ waitUntil: 'load' });

    assert.strictEqual(
      await secondPage.locator('#write-status').isVisible(),
      false,
      'The remaining tab should acquire the lock after reload'
    );

    await saveText(
      secondPage,
      'Saved after the original tab closed'
    );

    var releasedData = await savedData(secondPage);

    assert.strictEqual(releasedData.entries.length, 2);

    assert.ok(
      releasedData.entries.some(function (entry) {
        return entry.text === 'Saved after the original tab closed';
      })
    );

    assert.deepStrictEqual(
      lockTest.pageErrors,
      [],
      'First-tab JavaScript errors'
    );

    assert.deepStrictEqual(
      secondPageErrors,
      [],
      'Second-tab JavaScript errors'
    );

    passed++;
    console.log('PASS', 'two tabs enforce exclusive write ownership and release the lock correctly');
  } catch (error) {
    failures++;
    console.error('FAIL', 'two tabs enforce exclusive write ownership and release the lock correctly');
    console.error(error.stack || error.message);
  } finally {
    await lockTest.context.close();
  }

  try {
    await runStorageBenchmark();
  } catch (error) {
    failures++;
    console.error('FAIL storage benchmark diagnostic');
    console.error(error.stack || error.message);
  }

  console.log('');
  console.log(passed + '/' + (passed + failures) + ' browser tests passed');

  await browser.close();
  await new Promise(function (resolve) {
    server.close(resolve);
  });

  if (failures) {
    process.exitCode = 1;
  }
}

run().catch(async function (error) {
  console.error(error.stack || error.message);

  if (browser) await browser.close();

  if (server) {
    await new Promise(function (resolve) {
      server.close(resolve);
    });
  }

  process.exitCode = 1;
});
