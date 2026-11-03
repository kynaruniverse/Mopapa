
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
        var data = JSON.parse(localStorage.getItem('mopapa.v1') || '{}');

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
