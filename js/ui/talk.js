var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.talk = (function () {
  var input, form, box, busy = false;

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
    heading.textContent = 'From your saved entries:';
    box.appendChild(heading);

    entries.forEach(function (entry) {
      var card = document.createElement('div');
      card.className = 'source-entry';
      var text = document.createElement('div');
      text.textContent = entry.text;
      card.appendChild(text);

      var meta = document.createElement('div');
      meta.className = 'source-meta';
      var room = Mopapa.roomById(entry.room);
      var parts = [room ? room.name : 'Saved entry'];
      if (entry.when) {
        parts.push(Mopapa.rules.describe(new Date(entry.when), entry.hasTime));
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

  function submit() {
    var text = input.value.trim();
    if (!text || busy) return;
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
    var result = Mopapa.ask.answer(text);
    Mopapa.pet.say(result.answer);
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
    var r = Mopapa.entries.add({
      text: ctx.text,
      room: ctx.room,
      when: withDate ? ctx.parse.date.toISOString() : null,
      hasTime: withDate && ctx.parse.hasTime,
      amount: ctx.money
    });

    if (!r.saved) {
      input.value = ctx.text;
      Mopapa.pet.say("I couldn't save this on your device. Your text is still in the box. Copy it or try again.");
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
