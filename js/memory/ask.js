var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.ask = (function () {
  var STOP = (
    'a an the i me my mine we our you your he she it they them is are was were am ' +
    'do does did have has had can could would should will what whats when whens ' +
    'where wheres who whos whose which why how many much often show tell find search ' +
    'please tell logged log logbook entry entries any anything something everything ' +
    'about on in at for of to from with and or but last this that there here next ' +
    'didnt dont have i ever ever been ever logged remember remind tell me ' +
    'put left kept keep myself today yesterday tonight tomorrow yesterday'
  ).split(' ').reduce(function (o, w) { o[w] = true; return o; }, {});

  var ROOM_WORDS = [
    'todo', 'todos', 'task', 'tasks', 'reminder', 'reminders', 'appointment',
    'appointments', 'feel', 'feeling', 'feelings', 'mood', 'moods', 'wish',
    'wishlist', 'list', 'idea', 'ideas', 'note', 'notes'
  ];
  var DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9£]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function words(s) {
    var n = norm(s);
    return n ? n.split(' ') : [];
  }

  function hasPhrase(haystack, phrase) {
    return (' ' + norm(haystack) + ' ').indexOf(' ' + norm(phrase) + ' ') !== -1;
  }

  function roomForQuestion(q) {
    var tests = [
      { id: 'todo', words: ['to do', 'todo', 'todos', 'task', 'tasks', 'reminder', 'reminders'] },
      { id: 'appointments', words: ['appointment', 'appointments', 'dentist', 'doctor', 'doctors', 'gp', 'hospital', 'meeting', 'interview', 'vet', 'check up'] },
      { id: 'wishlist', words: ['wish list', 'wishlist', 'shopping list', 'things to buy'] },
      { id: 'feelings', words: ['feeling', 'feelings', 'mood', 'moods'] },
      { id: 'ideas', words: ['idea', 'ideas'] },
      { id: 'notes', words: ['note', 'notes'] }
    ];
    for (var i = 0; i < tests.length; i++) {
      for (var j = 0; j < tests[i].words.length; j++) {
        if (hasPhrase(q, tests[i].words[j])) return tests[i].id;
      }
    }
    for (var k = 0; k < Mopapa.rooms.length; k++) {
      var candidate = Mopapa.rooms[k];
      if (candidate.id.indexOf('custom_') === 0 && hasPhrase(q, candidate.name)) return candidate.id;
    }
    return null;
  }

  function queryTerms(q, roomId) {
    var all = words(q), out = [], seen = {};
    var selectedRoom = roomId ? Mopapa.roomById(roomId) : null;
    var customNameWords = selectedRoom && selectedRoom.id.indexOf('custom_') === 0 ? words(selectedRoom.name) : [];
    all.forEach(function (w) {
      if (w.length < 3 || STOP[w] || /^\d+$/.test(w) || seen[w]) return;
      if (customNameWords.indexOf(w) !== -1) return;
      if (ROOM_WORDS.indexOf(w) !== -1 || DAY_NAMES.indexOf(w) !== -1) return;
      if (['jan', 'january', 'feb', 'february', 'mar', 'march', 'apr', 'april', 'may', 'jun', 'june', 'jul', 'july', 'aug', 'august', 'sep', 'sept', 'september', 'oct', 'october', 'nov', 'november', 'dec', 'december', 'room', 'house', 'den'].indexOf(w) !== -1) return;
      seen[w] = true;
      out.push(w);
    });
    return out;
  }

  function localDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function dateFilter(q, now) {
    var n = norm(q), m, start;
    m = n.match(/\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
    if (m) {
      var back = (now.getDay() - DAY_NAMES.indexOf(m[1]) + 7) % 7;
      if (back === 0) back = 7;
      start = localDay(now);
      start.setDate(start.getDate() - back);
      return { start: start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1), label: 'last ' + m[1] };
    }
    if (/\byesterday\b/.test(n)) {
      start = localDay(now);
      start.setDate(start.getDate() - 1);
      return { start: start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1), label: 'yesterday' };
    }
    if (/\btomorrow\b/.test(n)) {
      start = localDay(now);
      start.setDate(start.getDate() + 1);
      return { start: start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1), label: 'tomorrow', due: true };
    }
    if (/\btoday\b/.test(n)) {
      start = localDay(now);
      return { start: start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1), label: 'today', due: !/\b(did|logged|log)\b/.test(n) };
    }
    return null;
  }

  function loggedOn(e, filter) {
    if (filter.due && !e.when) return false;
    var d = new Date(filter.due ? e.when : e.created);
    return !isNaN(d.getTime()) && d >= filter.start && d < filter.end;
  }

  function stem(w) {
    var irr = { paid: 'pay', bought: 'buy' };
    if (irr[w]) return irr[w];
    return w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w.replace(/s$/, '');
  }

  function includesAllTerms(e, terms) {
    if (!terms.length) return true;
    var tagText = Array.isArray(e.tags) ? e.tags.join(' ') : '';
    var have = norm(e.text + ' ' + tagText).split(' ').map(stem);
    return terms.every(function (term) {
      return have.indexOf(stem(term)) !== -1;
    });
  }

  function roomName(id) {
    var r = Mopapa.roomById(id);
    return r ? r.name : 'Unknown room';
  }

  function sortNewest(a, b) {
    return new Date(b.created) - new Date(a.created);
  }

  function sortByWhen(a, b) {
    return new Date(a.when) - new Date(b.when);
  }

  function isWhenQuestion(q) {
    return /\b(when|what time|what date|next)\b/.test(norm(q));
  }

  function answer(q) {
    var now = new Date();
    var all = Mopapa.entries.byRoom ? Mopapa.store.data().entries.slice() : [];
    var room = roomForQuestion(q);
    var date = dateFilter(q, now);
    var terms = queryTerms(q, room);
    if (!terms.length && !room && !date) {
      return { answer: 'Ask me about something specific, like “when is the dentist?”', sources: [] };
    }
    var matches = all.filter(function (e) {
      if (room && e.room !== room) return false;
      if (date && !loggedOn(e, date)) return false;
      return includesAllTerms(e, terms);
    });
    var askingWhen = isWhenQuestion(q);

    if (askingWhen && matches.length) {
      var dated = matches.filter(function (e) {
        return e.when && !Mopapa.rules.isPast(e.when, e.hasTime);
      }).sort(sortByWhen);
      if (dated.length) {
        var first = dated[0];
        var label = Mopapa.rules.describe(new Date(first.when), first.hasTime);
        return {
          answer: 'The next matching date I found is ' + label + '.',
          sources: dated.slice(0, 5)
        };
      }
      var pastDated = matches.filter(function (e) { return !!e.when; }).sort(sortByWhen);
      if (pastDated.length) {
        return {
          answer: 'I found a matching entry, but it does not have a future date. Here is the entry so you can check it.',
          sources: pastDated.slice(0, 5)
        };
      }
      return {
        answer: 'I found matching entries, but none has a date saved. I will not guess the date.',
        sources: matches.slice(0, 5)
      };
    }

    matches.sort(sortNewest);
    if (!matches.length) {
      var scope = date ? ' for ' + date.label : '';
      return {
        answer: 'I could not find a saved entry matching that' + scope + '. Try different words, or check Mopapa’s rooms.',
        sources: []
      };
    }

    var shown = matches.slice(0, 5);
    var roomText = room ? ' in ' + roomName(room) : '';
    var dateText = date ? ' for ' + date.label : '';
    var lead;
    if (date) {
      lead = 'Yes, I found ' + matches.length + ' matching entr' + (matches.length === 1 ? 'y' : 'ies') + roomText + dateText + '.';
    } else if (room) {
      lead = 'I found ' + matches.length + ' saved entr' + (matches.length === 1 ? 'y' : 'ies') + roomText + '.';
    } else {
      lead = 'I found ' + matches.length + ' saved entr' + (matches.length === 1 ? 'y' : 'ies') + ' matching those words.';
    }
    if (matches.length > shown.length) lead += ' Showing the newest ' + shown.length + '.';
    return { answer: lead, sources: shown };
  }

  return { answer: answer };
})();
