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

  function submit() {
    var text = input.value.trim();
    if (!text || busy) return;
    var q = Mopapa.rules.questionLevel(text);
    if (q === 'sure') { noAnswer(); return; }
    if (q === 'maybe') {
      Mopapa.pet.say('Is that a question for me, or something to file?');
      showChoices([
        { label: 'A question', primary: true, fn: function () { endChoices(); noAnswer(); } },
        { label: 'File it', fn: function () { endChoices(); fileIt(text); } },
        { label: 'Cancel', fn: cancel }
      ]);
      return;
    }
    fileIt(text);
  }

  function noAnswer() {
    Mopapa.pet.say("I can't answer questions yet, I only file things for now. Questions are coming soon.");
  }

  function fileIt(text) {
    var parse = Mopapa.rules.parse(text, new Date());
    var res = Mopapa.sorter.classify(text, parse);
    var ctx = { text: text, parse: parse, money: Mopapa.rules.money(text) };
    if (res.confident) { ctx.room = res.room; afterRoom(ctx); }
    else askRoom(ctx, res.ranked);
  }

  function askRoom(ctx, ranked) {
    Mopapa.pet.say('Not sure where that goes. Which room?');
    var choices = ranked.map(function (id, i) {
      var r = Mopapa.roomById(id);
      return {
        label: r.icon + ' ' + r.name,
        primary: i === 0,
        fn: function () {
          Mopapa.sorter.learn(ctx.text, id);
          ctx.room = id;
          endChoices();
          afterRoom(ctx);
        }
      };
    });
    choices.push({ label: 'Cancel', fn: cancel });
    showChoices(choices);
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
    input.value = '';
    var line = 'Filed under ' + room.name.toLowerCase() + '.';
    if (withDate) line += ' ' + Mopapa.rules.describe(ctx.parse.date, ctx.parse.hasTime) + '.';
    if (ctx.money) line += ' ' + ctx.money + ' noted.';
    if (!r.saved) line += " I couldn't save on this device, so export a backup.";
    Mopapa.pet.say(line);
    Mopapa.pet.bounce();
    Mopapa.room.renderRooms();
  }

  return { init: init };
})();