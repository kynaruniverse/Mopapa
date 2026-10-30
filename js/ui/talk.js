var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.talk = (function () {
  var input, form, box, busy = false, lastQuestion = '';

  function init() {
    input = document.getElementById('talk-input');
    form = document.getElementById('talk-form');
    box = document.getElementById('confirm');
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
  }

  function showChoices(list) {
    busy = true;
    input.disabled = true;
    box.innerHTML = '';
    list.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (c.primary ? ' primary' : '');
      b.textContent = c.label;
      b.addEventListener('click', c.fn);
      box.appendChild(b);
    });
    box.hidden = false;
  }

  function endChoices() {
    box.hidden = true;
    box.innerHTML = '';
    busy = false;
    input.disabled = false;
  }

  function cancel() {
    endChoices();
    Mopapa.pet.say('Okay, I dropped that one. Your text is still in the box.');
  }

  function renderSources(entries) {
    var box = document.getElementById('answer-sources');
    if (!box) return;
    box.innerHTML = '';
    if (!entries || !entries.length) {
      box.hidden = true;
      return;
    }

    var heading = document.createElement('div');
    heading.className = 'source-heading';
    heading.textContent = entries.length > 1
      ? 'Tap the one you meant:'
      : 'From your saved entries:';
    box.appendChild(heading);

    entries.forEach(function (entry) {
      var card = document.createElement('div');
      card.className = 'source-entry tappable';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');

      var choose = function () { chooseSource(entry, card); };

      card.addEventListener('click', choose);
      card.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          choose();
        }
      });

      var text = document.createElement('div');
      text.textContent = entry.text;
      card.appendChild(text);

      var meta = document.createElement('div');
      meta.className = 'source-meta';
      var room = Mopapa.roomById(entry.room);
      var parts = [room ? room.name : 'Saved entry'];
      if (entry.when) {
        parts.push(Mopapa.rules.describe(
          Mopapa.rules.dateForEntry(entry.when, entry.hasTime),
          entry.hasTime
        ));
      }
      if (entry.created) {
        var created = new Date(entry.created);
        if (!isNaN(created.getTime())) {
          parts.push('logged ' + created.toLocaleDateString());
        }
      }
      meta.textContent = parts.join(', ');
      card.appendChild(meta);
      box.appendChild(card);
    });
    box.hidden = false;
  }

  function chooseSource(entry, card) {
    if (!lastQuestion || !Mopapa.ask.confirmSource) return;

    if (Mopapa.ask.confirmSource(lastQuestion, entry.id)) {
      card.classList.add('chosen');
      Mopapa.pet.say('Got it. I will remember that one for questions like that.');
      if (Mopapa.askLearningUI) Mopapa.askLearningUI.render();
    } else {
      Mopapa.pet.say("I couldn't save that on your device, so I won't remember it.");
    }
  }

  function teachAliasFrom(a, b) {
    if (Mopapa.ask.teachAlias(a, b)) {
      input.value = '';
      Mopapa.pet.say('Okay. When you ask, I will treat "' + a + '" and "' + b + '" as the same thing.');
      if (Mopapa.askLearningUI) Mopapa.askLearningUI.render();
    } else {
      Mopapa.pet.say("I couldn't save that, so I won't use it. Use one word each, for example: by GP I mean doctor.");
    }
  }

  function submit() {
    var text = input.value.trim();
    if (!text || busy) return;

    var taught = text.match(/^by\s+["“']?([a-z0-9]{2,30})["”']?\s+i\s+mean\s+["“']?([a-z0-9]{2,30})["”']?\s*\.?$/i);

    if (taught) {
      teachAliasFrom(taught[1], taught[2]);
      return;
    }
    var q = Mopapa.rules.questionLevel(text);
    var looksLikeQuestion = /^(when|what|who|where|why|how|which|whose|whom|is|are|am|was|were|do|does|did|can|could|would|will|should|has|have|had)\b/i.test(text.trim()) ||
      /\?$/.test(text.trim());

    if (q === 'sure' || (q === 'maybe' && looksLikeQuestion)) {
      noAnswer(text);
      return;
    }

    if (q === 'maybe') {
      Mopapa.pet.say('Is that a question for me, or something to file?');
      showChoices([
        { label: 'A question', primary: true, fn: function () { endChoices(); noAnswer(text); } },
        { label: 'File it', fn: function () { endChoices(); fileIt(text); } },
        { label: 'Cancel', fn: cancel }
      ]);
      return;
    }

    fileIt(text);
  }

  function noAnswer(text) {
    lastQuestion = text;

    var result = Mopapa.ask.answer(text);

    Mopapa.pet.say(result.answer + (result.missed
      ? ' If I should treat two words as the same, tell me, for example: by GP I mean doctor.'
      : ''));

    if (result.missed && Mopapa.ask.logUnanswered(text) && Mopapa.askLearningUI) {
      Mopapa.askLearningUI.render();
    }
    renderSources(result.sources);
    Mopapa.pet.react(result.sources.length ? 'helpful' : 'curious');
  }

  function fileIt(text) {
    var parse = Mopapa.rules.parse(text, new Date());
    var res = Mopapa.sorter.classify(text, parse);
    var ctx = { text: text, parse: parse, money: Mopapa.rules.money(text) };
    if (res.confident) {
      ctx.room = res.room;
    } else {
      // Room suggestions are optional. Uncertain entries go to Notes without a prompt.
      ctx.room = 'notes';
    }
    afterRoom(ctx);
  }

  function afterRoom(ctx) {
    var room = Mopapa.roomById(ctx.room);
    if (room.dated && ctx.parse) {
      var d = Mopapa.rules.describe(ctx.parse.date, ctx.parse.hasTime);
      Mopapa.pet.say('I read that as ' + d + '. Right?');
      showChoices([
        { label: 'Yes', primary: true, fn: function () { save(ctx, true); } },
        { label: 'No, file without a date', fn: function () { save(ctx, false); } },
        { label: 'Cancel', fn: cancel }
      ]);
    } else {
      save(ctx, false);
    }
  }

  function save(ctx, withDate) {
    endChoices();
    var room = Mopapa.roomById(ctx.room);
    var dateOnly = withDate && !ctx.parse.hasTime
      ? ctx.parse.date.getFullYear() + '-' +
        String(ctx.parse.date.getMonth() + 1).padStart(2, '0') + '-' +
        String(ctx.parse.date.getDate()).padStart(2, '0')
      : null;

    var r = Mopapa.entries.add({
      text: ctx.text,
      room: ctx.room,
      when: !withDate
        ? null
        : ctx.parse.hasTime
          ? ctx.parse.date.toISOString()
          : dateOnly,
      hasTime: withDate && ctx.parse.hasTime,
      amount: ctx.money
    });

    if (!r.saved) {
      input.value = ctx.text;

      if (Mopapa.store.saveError() === 'conflict') {
        Mopapa.pet.say(
          'Another tab changed your saved data. I kept your text in the box, and I did not overwrite the newer data. Copy your text, reload Mopapa, then add it again.'
        );
      } else {
        Mopapa.pet.say(
          "I couldn't save this on your device. Your text is still in the box. Copy it or try again."
        );
      }

      Mopapa.room.renderRooms();
      Mopapa.refreshPanels();
      return;
    }

    input.value = '';
    var line = 'Filed under ' + room.name.toLowerCase() + '.';
    if (withDate) line += ' ' + Mopapa.rules.describe(ctx.parse.date, ctx.parse.hasTime) + '.';
    if (ctx.money) line += ' ' + ctx.money + ' noted.';
    Mopapa.pet.say(line);
    Mopapa.pet.bounce();
    Mopapa.room.renderRooms();
    Mopapa.refreshPanels();
  }

  return { init: init };
})();
