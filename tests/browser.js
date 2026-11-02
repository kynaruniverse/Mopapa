
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
