var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.ask = (function () {
  var STOP = (
    'a an the i me my mine we our you your he she it they them is are was were am ' +
    'do does did have has had can could would should will need needs needed ' +
    'what whats when whens ' +
    'know knows knowing knew understand understood ' +
    'where wheres who whos whose which why how many much often show tell find search ' +
    'please logged log logbook entry entries item items any anything something everything ' +
    'about on in at for of to from with and or but last this that there here next due scheduled ' +
    'didnt dont doesnt isnt wasnt werent hasnt havent wouldnt couldnt shouldnt ' +
    'have i ever been remember remind tell me put left leave leaves leaving kept keep park parked parking store stored storing hide hidden hiding place placed placing myself today yesterday tomorrow ' +
    'save saved saving saves record records recorded recording records remember remembered ' +
    'add added adding create created creating get got retrieve retrieving ' +
    'leave leaving leaves park parked parking store stored storing ' +
    'hide hid hidden place placed thing things object objects stuff ' + 
    'week weeks weekend weekends month months previous current'
  ).split(' ').reduce(function (o, w) {
    o[w] = true;
    return o;
  }, {});

  var ROOM_WORDS = [
    'todo', 'todos', 'task', 'tasks', 'reminder', 'reminders', 'appointment',
    'appointments', 'feel', 'feeling', 'feelings', 'mood', 'moods', 'wish',
    'wishlist', 'list', 'idea', 'ideas', 'note', 'notes'
  ];

  var ROOM_STEMS = ROOM_WORDS.map(function (w) { return stem(w); });

  var ALIAS_GROUPS = [
    ['gp', 'doctor', 'surgery'],
    ['dentist', 'dental'],
    ['boiler', 'heating'],
    ['car', 'vehicle'],
    ['holiday', 'vacation'],
    ['phone', 'mobile'],
    ['bin', 'rubbish', 'trash'],
    ['tv', 'television']
  ];

  var ALIAS_MAP = {};

  function linkAlias(from, to) {
    if (!ALIAS_MAP[from]) ALIAS_MAP[from] = [];

    if (ALIAS_MAP[from].indexOf(to) === -1) {
      ALIAS_MAP[from].push(to);
    }
  }

  function addAlias(a, b) {
    var x = stem(norm(a));
    var y = stem(norm(b));

    if (!x || !y || x === y) return false;

    linkAlias(x, y);
    linkAlias(y, x);

    return true;
  }

  ALIAS_GROUPS.forEach(function (group) {
    group.forEach(function (a) {
      group.forEach(function (b) {
        addAlias(a, b);
      });
    });
  });

  var DAY_NAMES = [
    'sunday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday'
  ];

  var MONTH_NAMES = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

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
    return (' ' + norm(haystack) + ' ').indexOf(
      ' ' + norm(phrase) + ' '
    ) !== -1;
  }

  function roomForQuestion(q) {
    var tests = [
      {
        id: 'todo',
        words: [
          'to do', 'todo', 'todos', 'task', 'tasks'
        ]
      },
      {
        id: 'appointments',
        words: [
          'appointment', 'appointments', 'dentist', 'doctor',
          'doctors', 'gp', 'hospital', 'meeting', 'interview',
          'vet', 'check up'
        ]
      },
      {
        id: 'wishlist',
        words: [
          'wish list', 'wishlist', 'shopping list', 'things to buy'
        ]
      },
      {
        id: 'feelings',
        words: ['feeling', 'feelings', 'mood', 'moods']
      },
      {
        id: 'ideas',
        words: ['idea', 'ideas']
      },
      {
        id: 'notes',
        words: ['note', 'notes']
      }
    ];

    for (var i = 0; i < tests.length; i++) {
      for (var j = 0; j < tests[i].words.length; j++) {
        if (hasPhrase(q, tests[i].words[j])) {
          return tests[i].id;
        }
      }
    }

    for (var k = 0; k < Mopapa.rooms.length; k++) {
      var candidate = Mopapa.rooms[k];

      if (
        candidate.id.indexOf('custom_') === 0 &&
        hasPhrase(q, candidate.name)
      ) {
        return candidate.id;
      }
    }

    return null;
  }

  function queryTerms(q, roomId) {
    var dateHit = extractTextDate(q);
    var all = words(dateHit ? String(q).replace(dateHit.text, ' ') : q);
    var out = [];
    var seen = {};
    var selectedRoom = roomId ? Mopapa.roomById(roomId) : null;
    var customNameWords = (
      selectedRoom && selectedRoom.id.indexOf('custom_') === 0
    ) ? words(selectedRoom.name).map(function (w) { return stem(w); }) : [];

    all.forEach(function (w, i) {
      if (/^\d+$/.test(w)) {
        var prevWord = all[i - 1];
        var nextWord = all[i + 1] || '';

        // Keep "flat 4" or "bus 38"; drop years, "at 3 pm" and loose numbers.
        if (
          prevWord && !STOP[prevWord] &&
          !/^(19|20)\d\d$/.test(w) &&
          !/^(am|pm)$/.test(nextWord) &&
          !seen[w]
        ) {
          seen[w] = true;
          out.push(w);
        }

        return;
      }

      if (
        (w.length < 3 && w !== 'gp') ||
        STOP[w] ||
        ['name', 'called', 'named'].indexOf(w) !== -1 ||
        /^\d+$/.test(w) ||
        seen[w]
      ) {
        return;
      }

      var term = w;

      term = stem(term);

      if (seen[term]) return;
      if (customNameWords.indexOf(term) !== -1) return;
      if (ROOM_STEMS.indexOf(term) !== -1) return;
      if (DAY_NAMES.indexOf(term) !== -1) return;

      if (MONTH_NAMES.indexOf(term) !== -1) return;

      if ([
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'sept', 'oct', 'nov',
        'dec', 'room'
      ].indexOf(term) !== -1) {
        return;
      }

      seen[term] = true;
      out.push(term);
    });

    return out;
  }

  function localDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function isLoggedQuestion(q) {
    var n = norm(q);

    return /\bwhat did i save\b/.test(n) ||
      /\bwhat have i saved\b/.test(n) ||
      /\bwhat did i log\b/.test(n) ||
      /\bwhat have i logged\b/.test(n) ||
      /\bwhat did i record\b/.test(n) ||
      /\bwhat have i recorded\b/.test(n) ||
      /\bwhat did i add\b/.test(n) ||
      /\bwhat have i added\b/.test(n) ||
      /\bwhat did i write\b/.test(n) ||
      /\bwhat did i put\b/.test(n) ||
      /\bwhat did i note\b/.test(n) ||
      /\bwhat was saved\b/.test(n) ||
      /\bwhat was logged\b/.test(n) ||
      /\bwhat was recorded\b/.test(n) ||
      /\bentries did i\b/.test(n) ||
      /\bsaved on\b/.test(n) ||
      /\blogged on\b/.test(n) ||
      /\brecorded on\b/.test(n);
  }

  function isWhenQuestion(q) {
    var n = norm(q);

    if (isLoggedQuestion(n)) return false;

    if (
      /\bnext\b/.test(n) &&
      /\b(wishlist|wish list|idea|ideas|task|tasks|reminder|reminders)\b/.test(n) &&
      !/\b(appointment|dentist|doctor|vet|meeting|interview|due|date|time)\b/.test(n)
    ) {
      return false;
    }

    return /\b(when|what time|what date|next)\b/.test(n) ||
      /\bwhat is due\b/.test(n) ||
      /\bwhat's due\b/.test(n) ||
      /\bwhen is\b/.test(n) ||
      /\bwhen are\b/.test(n);
  }

  function isScheduledDateQuestion(q) {
      var n = norm(q);
  
      if (isLoggedQuestion(n)) return false;
  
      return isWhenQuestion(n) ||
        /\b(due|scheduled|appointment|appointments|reminder|reminders)\b/.test(n);
  }

  function dateFilter(q, now) {
    var n = norm(q);
    var m;
    var start;
    var end;
    var due = isScheduledDateQuestion(n);

    function makeFilter(from, to, label, isDue) {
      return {
        start: from,
        end: to,
        label: label,
        due: isDue === undefined ? due : isDue
      };
    }

    function mondayOfWeek(day) {
      var result = localDay(day);
      var offset = (result.getDay() + 6) % 7;
      result.setDate(result.getDate() - offset);
      return result;
    }

    if (/\b(last|previous)\s+week\b/.test(n)) {
      start = mondayOfWeek(now);
      start.setDate(start.getDate() - 7);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      return makeFilter(start, end, 'last week');
    }

    if (/\b(this|current)\s+week\b/.test(n)) {
      start = mondayOfWeek(now);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      return makeFilter(start, end, 'this week');
    }

    if (/\b(last|previous)\s+month\b/.test(n)) {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 1);
      return makeFilter(start, end, 'last month');
    }

    if (/\b(this|current)\s+month\b/.test(n)) {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return makeFilter(start, end, 'this month');
    }

    if (/\bthis weekend\b/.test(n)) {
      var day = localDay(now);
      var weekday = day.getDay();

      start = localDay(now);
      if (weekday === 0) {
        start.setDate(start.getDate() - 1);
      } else if (weekday !== 6) {
        start.setDate(start.getDate() + (6 - weekday));
      }

      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2);
      return makeFilter(start, end, 'this weekend');
    }

    if (/\blast weekend\b/.test(n)) {
      var thisSaturday = localDay(now);
      var todayDay = thisSaturday.getDay();

      if (todayDay === 0) {
        thisSaturday.setDate(thisSaturday.getDate() - 1);
      } else if (todayDay !== 6) {
        thisSaturday.setDate(thisSaturday.getDate() + (6 - todayDay));
      }

      start = new Date(
        thisSaturday.getFullYear(),
        thisSaturday.getMonth(),
        thisSaturday.getDate() - 7
      );
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2);
      return makeFilter(start, end, 'last weekend');
    }

    m = n.match(
      /\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/
    );

    if (m) {
      var back = (
        now.getDay() - DAY_NAMES.indexOf(m[1]) + 7
      ) % 7;

      if (back === 0) back = 7;

      start = localDay(now);
      start.setDate(start.getDate() - back);

      return makeFilter(
        start,
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        'last ' + m[1]
      );
    }

    if (/\byesterday\b/.test(n)) {
      start = localDay(now);
      start.setDate(start.getDate() - 1);

      return makeFilter(
        start,
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        'yesterday'
      );
    }

    if (/\btomorrow\b/.test(n)) {
      start = localDay(now);
      start.setDate(start.getDate() + 1);

      return makeFilter(
        start,
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        'tomorrow',
        true
      );
    }

    if (/\btoday\b/.test(n)) {
      start = localDay(now);

      return makeFilter(
        start,
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        'today'
      );
    }

    return null;
  }

  function loggedOn(e, filter) {
    if (!filter) return true;

    var value = filter.due ? e.when : e.created;

    if (filter.due && !value) return false;

    var d = new Date(value);

    return !isNaN(d.getTime()) &&
      d >= filter.start &&
      d < filter.end;
  }


  var MONTH_RE =
    '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|' +
    'aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

  function monthIndex(name) {
    var key = String(name).toLowerCase().slice(0, 3);

    for (var i = 0; i < MONTH_NAMES.length; i++) {
      if (MONTH_NAMES[i].slice(0, 3) === key) return i;
    }

    return -1;
  }

  function extractTextDate(text) {
    var source = String(text || '');
    var day, month, year = null;
    var match = source.match(new RegExp(
      '\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?' + MONTH_RE +
      '(?:\\s+(\\d{4}))?\\b', 'i'
    ));

    if (match) {
      day = Number(match[1]);
      month = monthIndex(match[2]);
      year = match[3] ? Number(match[3]) : null;
    } else {
      match = source.match(new RegExp(
        '\\b' + MONTH_RE +
        '\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b', 'i'
      ));

      if (match) {
        month = monthIndex(match[1]);
        day = Number(match[2]);
        year = match[3] ? Number(match[3]) : null;
      } else {
        // Numeric dates use UK day/month/year order.
        match = source.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);

        if (!match) return null;

        day = Number(match[1]);
        month = Number(match[2]) - 1;
        year = match[3] ? Number(match[3]) : null;

        if (year !== null && year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
      }
    }

    if (month < 0 || month > 11 || day < 1 || day > 31) return null;

    var check = new Date(year || 2000, month, day);

    if (check.getMonth() !== month || check.getDate() !== day) return null;

    return {
      day: day,
      month: month,
      year: year,
      text: match[0],
      label: day + ' ' +
        MONTH_NAMES[month].charAt(0).toUpperCase() +
        MONTH_NAMES[month].slice(1) +
        (year ? ' ' + year : '')
    };
  }

  
function textDateMatchesFilter(e, filter) {
    if (
      !filter || !filter.start || !filter.end ||
      (!filter.due && !filter.explicit) ||
      filter.logged
    ) {
      return false;
    }

    var parsed = extractTextDate(e.text);
    if (!parsed) return false;

    var year = parsed.year;

    if (year === null || year === undefined) {
      year = filter.start.getFullYear();
    }

    var date = new Date(year, parsed.month, parsed.day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== parsed.month ||
      date.getDate() !== parsed.day
    ) {
      return false;
    }

    return date >= filter.start && date < filter.end;
}

  function explicitDateFilter(q, now) {
    var n = norm(q);
    var parsed = extractTextDate(q);

    if (!parsed) return null;

    var loggedQuestion = isLoggedQuestion(n);
    var pastTense = /\b(did|was|were|paid|spent|bought|saved|logged|recorded)\b/.test(n);
    var year = parsed.year;

    if (year === null) {
      year = now.getFullYear();

      var provisional = new Date(year, parsed.month, parsed.day);

      if (provisional.getMonth() !== parsed.month) return null;

      if (!loggedQuestion && !pastTense && provisional < localDay(now)) {
        year++;
      }
    }

    var start = new Date(year, parsed.month, parsed.day);

    if (
      start.getFullYear() !== year ||
      start.getMonth() !== parsed.month ||
      start.getDate() !== parsed.day
    ) {
      return null;
    }

    return {
      start: start,
      end: new Date(year, parsed.month, parsed.day + 1),
      label: parsed.day + ' ' +
        MONTH_NAMES[parsed.month].charAt(0).toUpperCase() +
        MONTH_NAMES[parsed.month].slice(1) + ' ' + year,
      due: !loggedQuestion && isScheduledDateQuestion(n),
      explicit: true,
      logged: loggedQuestion,
      year: year
    };
  }

    function stem(w) {
    var irregular = {
      paid: 'pay', spent: 'spend', spending: 'spend',
      bought: 'buy', buying: 'buy', kept: 'keep', left: 'leave'
    };

    if (irregular[w]) w = irregular[w];

    var base = w;

    if (base.length > 4 && /ies$/.test(base)) {
      base = base.slice(0, -3) + 'y';
    } else if (base.length > 4 && /(ches|shes|sses|xes|zes)$/.test(base)) {
      base = base.slice(0, -2);
    } else if (base.length > 3 && /s$/.test(base) && !/ss$/.test(base)) {
      base = base.slice(0, -1);
    }

    var verb = null;

    if (base.length > 5 && /ing$/.test(base)) {
      verb = base.slice(0, -3);
    } else if (base.length > 4 && /ed$/.test(base)) {
      verb = base.slice(0, -2);
    }

    // Only accept the cut if a vowel remains ("string" stays "string").
    if (verb && /[aeiouy]/.test(verb)) {
      base = verb.replace(/([^aeiouylsz])\1$/, '$1'); // stopp -> stop
    }

    // store/stored/storing all become "stor".
    if (base.length > 3 && /e$/.test(base)) {
      base = base.slice(0, -1);
    }

    return base;
  }

  var ENTRY_CACHE = typeof WeakMap === 'function' ? new WeakMap() : null;

  function entryStems(e) {
    var tagText = Array.isArray(e.tags) ? e.tags.join(' ') : '';
    var raw = String(e.text || '') + ' ' + tagText;
    var hit = ENTRY_CACHE ? ENTRY_CACHE.get(e) : null;

    if (hit && hit.raw === raw) return hit.stems;

    var stems = norm(raw).split(' ').map(function (w) {
      return stem(w);
    });

    if (ENTRY_CACHE) ENTRY_CACHE.set(e, { raw: raw, stems: stems });

    return stems;
  }

  function includesAllTerms(e, terms) {
    if (!terms.length) return true;

    var have = entryStems(e);

    // Terms arrive already stemmed from queryTerms.
    return terms.every(function (wanted) {
      if (have.indexOf(wanted) !== -1) return true;

      var alts = ALIAS_MAP[wanted] || [];

      for (var a = 0; a < alts.length; a++) {
        if (have.indexOf(alts[a]) !== -1) return true;
      }

      // Treat "pickup" and "pick up" as equivalent.
      if (wanted === 'pickup') {
        return have.indexOf('pick') !== -1 && have.indexOf('up') !== -1;
      }

      if (wanted === 'pick') {
        return have.indexOf('pickup') !== -1;
      }

      return false;
    });
  }

  function editDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;

    var prev2 = null;
    var prev = [];
    var i;
    var j;

    for (j = 0; j <= b.length; j++) prev[j] = j;

    for (i = 1; i <= a.length; i++) {
      var cur = [i];

      for (j = 1; j <= b.length; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;

        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);

        // Swapped neighbouring letters count as one typo.
        if (
          i > 1 && j > 1 &&
          a.charAt(i - 1) === b.charAt(j - 2) &&
          a.charAt(i - 2) === b.charAt(j - 1)
        ) {
          cur[j] = Math.min(cur[j], prev2[j - 2] + 1);
        }
      }

      prev2 = prev;
      prev = cur;
    }

    return prev[b.length];
  }

  function termsClose(a, b) {
    if (a === b) return true;

    // Numbers and short words must match exactly.
    if (/\d/.test(a) || /\d/.test(b)) return false;

    var len = Math.min(a.length, b.length);

    if (len < 5) return false;

    var allowed = len >= 8 ? 2 : 1;

    return editDistance(a, b, allowed) <= allowed;
  }

  // 1 = exact, 0.9 = alias, 0.7 = typo-close, 0 = no match.
  function termStrength(term, have) {
    if (have.indexOf(term) !== -1) return 1;

    var alts = ALIAS_MAP[term] || [];

    for (var i = 0; i < alts.length; i++) {
      if (have.indexOf(alts[i]) !== -1) return 0.9;
    }

    for (var j = 0; j < have.length; j++) {
      if (termsClose(term, have[j])) return 0.7;
    }

    return 0;
  }

  function rankedMatches(entries, terms, room, sig) {
    if (!terms.length || !entries.length) return [];

    var s = learnedData();
    var tapped = s && sig && s.boosts[sig] ? s.boosts[sig] : {};

    var stemmed = entries.map(entryStems);

    // Rarer terms count for more (a simple IDF weight).
    var weights = terms.map(function (term) {
      var df = 0;

      stemmed.forEach(function (have) {
        if (have.indexOf(term) !== -1) df++;
      });

      return Math.log(1 + entries.length / (1 + df));
    });

    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var scored = [];

    entries.forEach(function (e, i) {
      var got = 0;

      terms.forEach(function (term, t) {
        got += termStrength(term, stemmed[i]) * weights[t];
      });

      var coverage = total ? got / total : 0;

      // Most of the question must be covered, or it is not a match.
      var wasTapped = tapped[e.id] > 0;
      
      // An entry the person tapped before for this question always qualifies.
      if (coverage < (wasTapped ? 0.3 : 0.6)) return;

      scored.push({
        entry: e,
        score: coverage + (room && e.room === room ? 0.1 : 0) + (wasTapped ? 0.3 : 0)
      });
    });

    scored.sort(function (a, b) {
      return b.score - a.score || sortNewest(a.entry, b.entry);
    });

    return scored.slice(0, 5).map(function (s) {
      return s.entry;
    });
  }

  // ---- Structured facts (where things are) ----

  var DETS = { the: 1, my: 1, our: 1, a: 1, an: 1 };

  function factOf(e) {
    if (e && e.fact && e.fact.attr === 'location' && Array.isArray(e.fact.items)) {
      return e.fact;
    }

    var info = Mopapa.rules && Mopapa.rules.extract
      ? Mopapa.rules.extract(e && e.text)
      : null;

    return info && info.fact ? info.fact : null;
  }

  function itemStems(item) {
    return words(item).map(stem);
  }

  function entryOrder(all) {
    // Oldest first. On equal timestamps the later array slot is older,
    // because new entries are added at the front.
    return all.map(function (e, i) { return { e: e, i: i }; })
      .sort(function (a, b) {
        return (new Date(a.e.created) - new Date(b.e.created)) || (b.i - a.i);
      })
      .map(function (x) { return x.e; });
  }

  // The newest saved location for every item.
  function currentLocations(all) {
    var map = {};

    entryOrder(all).forEach(function (e) {
      var f = e && factOf(e);
      if (!f) return;

      f.items.forEach(function (item) {
        var stems = itemStems(item);
        if (!stems.length) return;
        map[stems.join(' ')] = { item: item, stems: stems, entry: e, fact: f };
      });
    });

    return map;
  }

  function isStale(e, map) {
    var f = factOf(e);
    if (!f) return false;

    return f.items.every(function (item) {
      var hit = map[itemStems(item).join(' ')];
      return !!hit && hit.entry !== e;
    });
  }

  function whereStems(c) {
    return words(c.fact.where).map(stem).filter(function (w) {
      return !DETS[w];
    });
  }

  function structuredWhere(terms, all) {
    if (!terms.length) return null;

    var map = currentLocations(all);
    var cands = Object.keys(map).map(function (k) { return map[k]; })
      .filter(function (c) {
        return terms.every(function (t) {
          return c.stems.indexOf(t) !== -1 ||
            (ALIAS_MAP[t] || []).some(function (a) {
              return c.stems.indexOf(a) !== -1;
            });
        });
      });

    if (!cands.length) return null;

    var exact = cands.filter(function (c) {
      return c.stems.length === terms.length;
    });
    var use = exact.length ? exact : cands;
    var entries = [];

    use.forEach(function (c) {
      if (entries.indexOf(c.entry) === -1) entries.push(c.entry);
    });

        if (entries.length > 1) {
      var tappedEntry = confirmedBySig(entries, terms.slice().sort().join(' '));

      if (tappedEntry) {
        entries = [tappedEntry];
        use = use.filter(function (c) { return c.entry === tappedEntry; });
      }
    }

    if (entries.length > 1) {
      return {
        answer: 'I found more than one saved place that could match. Which do you mean?',
        sources: entries.slice(0, 5)
      };
    }

    return {
      answer: (use[0].fact.plural ? 'They are ' : 'It is ') +
        use[0].fact.value + '.',
      sources: [entries[0]]
    };
  }

  var PLACE_Q = /^what(?:s| is| are)?\s+(?:the\s+)?(?:(?:items?|things?|stuff|objects?)\s+)?(?:(?:is|are)\s+)?(?:(?:did\s+i|have\s+i)\s+(?:put|leave|store|keep|hide|park)\s+)?(in|inside|on|under|behind|beside|within|at)\s+(.+)$/;

  function structuredItems(q, all) {
    var m = norm(q).match(PLACE_Q);
    if (!m) return null;

    var placeStems = words(m[2]).map(stem).filter(function (w) {
      return !DETS[w];
    });

    if (!placeStems.length) return null;

    var map = currentLocations(all);
    var hits = Object.keys(map).map(function (k) { return map[k]; })
      .filter(function (c) {
        var have = whereStems(c);
        return placeStems.every(function (p) {
          return have.indexOf(p) !== -1;
        });
      });

    if (!hits.length) return null;

    var values = [];
    hits.forEach(function (c) {
      if (values.indexOf(c.fact.value) === -1) values.push(c.fact.value);
    });

    var names = [];
    hits.forEach(function (c) {
      var label = values.length > 1
        ? c.item + ' (' + c.fact.value + ')'
        : c.item;

      if (names.indexOf(label) === -1) names.push(label);
    });

    var more = names.length > 8 ? names.length - 8 : 0;
    var list = names.slice(0, 8).join(', ') +
      (more ? ' and ' + more + ' more' : '');
    var sources = [];

    hits.forEach(function (c) {
      if (sources.indexOf(c.entry) === -1) sources.push(c.entry);
    });

    return {
      answer: values.length === 1
        ? values[0].charAt(0).toUpperCase() + values[0].slice(1) + ': ' + list + '.'
        : 'Saved items matching that place: ' + list + '.',
      sources: sources.slice(0, 8)
    };
  }

  function formatMoney(n) {
    var whole = Math.round(n * 100) % 100 === 0;

    return '£' + n.toLocaleString('en-GB', {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  // ---- Learning from the person (saved in store.ask) ----

  function learnedData() {
    var d = Mopapa.store && Mopapa.store.data ? Mopapa.store.data() : null;

    if (d && !d.ask) {
      d.ask = { aliases: [], boosts: {}, unanswered: [] };
    }

    return d ? d.ask : null;
  }

  function applyLearned() {
    var s = learnedData();
    if (!s) return;

    s.aliases.forEach(function (p) {
      addAlias(p[0], p[1]);
    });
  }

  function rebuildAliases() {
    Object.keys(ALIAS_MAP).forEach(function (k) {
      delete ALIAS_MAP[k];
    });

    ALIAS_GROUPS.forEach(function (group) {
      group.forEach(function (a) {
        group.forEach(function (b) {
          addAlias(a, b);
        });
      });
    });

    applyLearned();
  }

  // One word each, e.g. teachAlias('gp', 'doctor').
  function teachAlias(a, b) {
    var x = norm(a);
    var y = norm(b);
    var s = learnedData();

    if (!s || !x || !y || x === y) return false;
    if (/\s/.test(x) || /\s/.test(y) || x.length > 30 || y.length > 30) {
      return false;
    }

    var known = s.aliases.some(function (p) {
      return (p[0] === x && p[1] === y) || (p[0] === y && p[1] === x);
    });

    if (!known) {
      if (s.aliases.length >= 50) return false;

      s.aliases.push([x, y]);

      if (!Mopapa.store.save()) {
        s.aliases.pop();
        return false;
      }
    }

    addAlias(x, y);
    return true;
  }

  function forgetAlias(a, b) {
    var x = norm(a);
    var y = norm(b);
    var s = learnedData();
    if (!s) return false;

    var before = s.aliases;

    s.aliases = before.filter(function (p) {
      return !((p[0] === x && p[1] === y) || (p[0] === y && p[1] === x));
    });

    if (!Mopapa.store.save()) {
      s.aliases = before;
      return false;
    }

    rebuildAliases();
    return true;
  }

  // The same question always gives the same signature.
  function signatureOf(q) {
    return queryTerms(q, roomForQuestion(q)).slice().sort().join(' ');
  }

  // The person tapped this entry as "the one I meant" for this question.
  function confirmSource(question, entryId) {
    var s = learnedData();
    var sig = signatureOf(question);

    if (!s || !sig || !entryId) return false;

    var before = JSON.stringify(s.boosts);

    if (!s.boosts[sig]) s.boosts[sig] = {};
    s.boosts[sig][entryId] = (s.boosts[sig][entryId] || 0) + 1;

    var keys = Object.keys(s.boosts);
    if (keys.length > 200) delete s.boosts[keys[0]];

    if (!Mopapa.store.save()) {
      s.boosts = JSON.parse(before);
      return false;
    }

    return true;
  }

  function clearConfirmed() {
    var s = learnedData();
    if (!s) return false;

    var before = s.boosts;
    s.boosts = {};

    if (!Mopapa.store.save()) {
      s.boosts = before;
      return false;
    }

    return true;
  }

  // Of these entries, the one the person tapped before for this question.
  // Only returns something when exactly one was tapped.
  function confirmedBySig(entries, sig) {
    var s = learnedData();
    var bucket = s && sig ? s.boosts[sig] : null;

    if (!bucket) return null;

    var hits = entries.filter(function (e) {
      return e && bucket[e.id] > 0;
    });

    return hits.length === 1 ? hits[0] : null;
  }

  function logUnanswered(q) {
    var s = learnedData();
    var text = String(q || '').trim().slice(0, 200);

    if (!s || !text) return false;

    var before = s.unanswered;
    var key = text.toLowerCase();

    s.unanswered = [{ q: text, at: new Date().toISOString() }]
      .concat(before.filter(function (u) {
        return u.q.toLowerCase() !== key;
      }))
      .slice(0, 30);

    if (!Mopapa.store.save()) {
      s.unanswered = before;
      return false;
    }

    return true;
  }

  function clearUnanswered() {
    var s = learnedData();
    if (!s) return false;

    var before = s.unanswered;
    s.unanswered = [];

    if (!Mopapa.store.save()) {
      s.unanswered = before;
      return false;
    }

    return true;
  }

  // A read-only summary for the screen.

  function learned() {
    var s = learnedData();
    var taps = 0;

    if (!s) return { aliases: [], unanswered: [], taps: 0 };

    var activeIds = Object.create(null);
    Mopapa.store.data().entries.forEach(function (entry) {
      if (entry && entry.id) activeIds[entry.id] = true;
    });

    Object.keys(s.boosts).forEach(function (k) {
      Object.keys(s.boosts[k]).forEach(function (id) {
        if (activeIds[id]) taps++;
      });
    });

    return {
      aliases: s.aliases.map(function (p) { return [p[0], p[1]]; }),
      unanswered: s.unanswered.map(function (u) {
        return { q: u.q, at: u.at };
      }),
      taps: taps
    };
  }


  function locationMatchScore(entry, terms) {
    var text = norm(String(entry.text || ''));
    var textWords = text.split(' ');
    var score = 0;

    terms.forEach(function (term) {
      var exactWord = textWords.some(function (word) {
        return stem(word) === term;
      });

      if (exactWord) {
        score += 10;
      }
    });

    return score;
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

  function isGeneralNextAppointmentQuestion(q) {
    var n = norm(q);

    return /\bnext\b/.test(n) &&
      /\b(appointment|appointments)\b/.test(n) &&
      !/\b(dentist|doctor|gp|hospital|meeting|interview|vet)\b/.test(n);
  }

  function isOverdueTaskQuestion(q) {
    var n = norm(q);

    return /\b(overdue|over due|overdue tasks|overdue todos|past due)\b/.test(n) ||
      /\b(which|what|show|list)\b.*\b(tasks|todos|to do|reminders)\b.*\b(overdue|past due)\b/.test(n);
  }
  
  function isCostQuestion(q) {
    var n = norm(q);
  
    // A date question should be handled by date retrieval.
    if (isWhenQuestion(n)) {
      return false;
    }
  
    // Explicit requests for a price, cost, or amount.
    if (/\b(cost|costs|price|priced|pricing|expensive|cheap|charge|charges|charged|payment|payments|how much|what amount|what did .* cost)\b/.test(n)) {
      return true;
    }
  
    // Payment and spending verbs count only when asking about an amount.
    return /\b(pay|paid|spend|spent|spending)\b/.test(n) &&
      /\b(amount|total|much|cost|price|money)\b/.test(n);
  }

  function answerCost(q, all, room, date) {
    var n = norm(q);
    var wantsLatest = /\b(latest|newest|most recent)\b/.test(n);

    var intent = /\b(cost|costs|price|priced|pricing|expensive|cheap|charge|charges|charged|pay|paid|spend|spent|spending|payment|payments|much|amount|total|money|according|latest|newest|recent|most|entry|entries|record|recorded|save|saved|saving|log|logged|logging|did|what|was|is|the|for|on|in|at|yesterday|today|tomorrow)\b/g;

    var subject = n.replace(intent, ' ').replace(/\s+/g, ' ').trim();
    var subjectTerms = queryTerms(subject, room);

    var isGeneralSpendingTotal =
      !subjectTerms.length &&
      !room &&
      /\b(spend|spent|spending)\b/.test(n);

    if (!subjectTerms.length && !room && !isGeneralSpendingTotal) {
      return {
        answer: 'I can look up costs, but I need to know what the cost was for. Try “how much did the boiler cost?”',
        sources: []
      };
    }

    var candidates = all.filter(function (e) {
      if (room && e.room !== room) return false;

      if (
        date &&
        !loggedOn(e, date) &&
        !textDateMatchesFilter(e, date)
      ) {
        return false;
      }

      if (isGeneralSpendingTotal) {
        return /\b(spend|spent|spending)\b/i.test(e.text) &&
          !!Mopapa.rules.money(e.text);
      }

      return subjectTerms.length > 0 &&
        includesAllTerms(e, subjectTerms);
    });

    candidates.sort(sortNewest);

    if (isGeneralSpendingTotal && !candidates.length) {
      return {
        answer: 'I could not find any saved entries that explicitly record spending.',
        sources: []
      };
    }
    
    var priced = candidates.filter(function (e) {
      return !!Mopapa.rules.money(e.text);
    });

    if (!priced.length) {
      if (candidates.length) {
        return {
          answer: 'I found matching saved entries, but none mentions a cost I can read. I will not guess an amount.',
          sources: candidates.slice(0, 5)
        };
      }

      return {
        answer: 'I could not find a saved entry for that cost. Try mentioning what it was for.',
        sources: []
      };
    }

    if (wantsLatest) {
      return {
        answer: 'The most recent cost was ' +
          Mopapa.rules.money(priced[0].text) + '.',
        sources: [priced[0]]
      };
    }

    if (
      priced.length === 1 &&
      !(
        /\b(total|altogether|spend|spent|spending)\b/.test(n) &&
        Mopapa.rules.moneyAll(priced[0].text).length > 1
      )
    ) {
      var cost = Mopapa.rules.money(priced[0].text);
      var subjectWords = words(subject);
      var subjectText = subjectTerms.map(function (t) {
        var raw = subjectWords.filter(function (x) {
          return stem(x) === t;
        })[0];

        return raw || t;
      }).join(' ');

      if (/\b(spend|spent|spending)\b/.test(n)) {
        return {
          answer: 'You spent ' + cost +
            (subjectText ? ' on ' + subjectText : '') + '.',
          sources: [priced[0]]
        };
      }

      return {
        answer: 'It cost ' + cost + '.',
        sources: [priced[0]]
      };
    }

    // "How much did I spend on the car" means add them up.
    if (/\b(total|altogether|spend|spent|spending)\b/.test(n)) {
      var sum = 0;
      var counted = [];

      priced.forEach(function (e) {
        var amounts = Mopapa.rules.moneyAll(e.text);
        var entryTotal = 0;
        var hasAmount = false;

        amounts.forEach(function (v) {
          if (!isNaN(v)) {
            entryTotal += v;
            hasAmount = true;
          }
        });

        if (hasAmount) {
          sum += entryTotal;
          counted.push(e);
        }
      });
      
      return {
        answer: 'You spent ' + formatMoney(sum) + ' in total across ' +
          counted.length + ' entries.',
        sources: counted.slice(0, 8)
      };
    }

    var tappedCost = confirmedBySig(priced, signatureOf(q));

    if (tappedCost) {
      return {
        answer: 'It cost ' + Mopapa.rules.money(tappedCost.text) + '.',
        sources: [tappedCost]
      };
    }

    return {
      answer: 'I found multiple matching entries with costs. Which job or purchase do you mean?',
      sources: priced.slice(0, 5)
    };
  }

  function isNameQuestion(q) {
    var n = norm(q);

    return /\bwhat(?: is| was|s)\s+the .+\s+called\b/.test(n) ||
      /\bwhat(?: is| was|s)\s+the .+\s+name\b/.test(n) ||
      /\bwhat(?: is| was|s)\s+the .+ name\b/.test(n) ||
      /\bwhat is the .+ called\b/.test(n) ||
      /\bwhat is the name of\b/.test(n) ||
      /\bwhat is .+ name\b/.test(n);
  }

  function asksWhoSomethingIsFor(q) {
    return /\bwho\b.*\b(?:is|was|will be)\b.*\bfor\b/.test(norm(q));
  }

  function extractCalledPerson(text) {
    var source = String(text || '').replace(/\s+/g, ' ').trim();

    var match = source.match(
      /\bthe\s+([a-z][a-z-]{0,20})\s+(?:is|was)\s+called\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2})(?=[.,!?;]|$)/i
    );

    if (!match) return null;

    var role = match[1].trim();
    var name = match[2].trim();

    var monthPattern = /^(january|february|march|april|may|june|july|august|september|october|november|december)$/i;

    if (!role || !name || monthPattern.test(name)) return null;

    return {
      role: role,
      name: name
    };
  }

  function answer(q) {
    var now = new Date();
    var storeData = Mopapa.store && Mopapa.store.data
      ? Mopapa.store.data()
      : null;

    if (!storeData || !Array.isArray(storeData.entries)) {
      return {
        answer: 'I cannot read your saved entries right now.',
        sources: []
      };
    }

    var all = storeData.entries.slice();

    var room = roomForQuestion(q);
    var date = explicitDateFilter(q, now) || dateFilter(q, now);
    applyLearned();

    var terms = queryTerms(q, room);
    var sig = terms.slice().sort().join(' ');

    if (
      !terms.length &&
      !room &&
      !date &&
      !isLoggedQuestion(q)
    ) {
      return {
        answer: 'Ask me about something specific, like “when is the dentist?”',
        sources: []
      };
    }

    function findMatches(roomFilter) {
      return all.filter(function (e) {
        if (roomFilter && e.room !== roomFilter) return false;

        if (
          date &&
          !loggedOn(e, date) &&
          !textDateMatchesFilter(e, date)
        ) {
          return false;
        }

        return includesAllTerms(e, terms);
      });
    }


    var matches = findMatches(room);

    // If a room guess produces no result, search all rooms.
    // A guessed room must not hide a matching saved entry.
    if (room && !matches.length) {
      matches = findMatches(null);
    }

    // Nothing exact: look for close matches (typos, aliases, partial).
    // The room guess only boosts the ranking here, it never hides entries.
    if (!matches.length && terms.length && !isCostQuestion(q)) {
      var closest = rankedMatches(
        all.filter(function (e) {
          return !date ||
            loggedOn(e, date) ||
            textDateMatchesFilter(e, date);
        }),
        terms,
        room,
        sig
      );

      if (closest.length) {
        return {
          answer: 'I could not find an exact match, but these are the closest saved entries:\n' +
            closest.map(function (entry) {
              return '• ' + entry.text;
            }).join('\n'),
          sources: closest
        };
      }
    }

    // Prefer a saved entry whose subject directly matches the question.
    var isLocationQuestion =
      /\bwhere\b/.test(norm(q)) ||
      /\bwhich\s+(?:folder|drawer|room|place)\b/.test(norm(q));

    if (isLocationQuestion && matches.length > 1) {
      var scoredMatches = matches.map(function (entry) {
        var text = norm(String(entry.text || ''));
        var subject = text.split(/\b(?:is|are)\b/)[0].trim();
        var score = locationMatchScore(entry, terms);

        // Penalise extra subject words that the question did not ask for.
        var subjectWords = subject.split(' ').filter(Boolean);
        var extraWords = subjectWords.filter(function (word) {
          return terms.indexOf(stem(word)) === -1 &&
            ['my', 'the', 'a', 'an', 'spare'].indexOf(word) === -1;
        });

        score -= extraWords.length * 20;

        return {
          entry: entry,
          score: score
        };
      });

      scoredMatches.sort(function (a, b) {
        return b.score - a.score;
      });

      if (
        scoredMatches.length > 1 &&
        scoredMatches[0].score > scoredMatches[1].score
      ) {
        matches = [scoredMatches[0].entry];
      }
    }

    // Structured answers: newest saved location wins, and place lists
    // only show things whose newest location is that place.
    if (!date) {
      var placeList = structuredItems(q, all);
      if (placeList) return placeList;

      if (isLocationQuestion) {
        var placeAnswer = structuredWhere(terms, all);
        if (placeAnswer) return placeAnswer;
      }
    }

    var askingWhen = isWhenQuestion(q);

    if (isGeneralNextAppointmentQuestion(q)) {
      var upcomingAppointments = all.filter(function (e) {
        return e.room === 'appointments' &&
          e.when &&
          !Mopapa.rules.isPast(e.when, e.hasTime);
      }).sort(sortByWhen);

      if (upcomingAppointments.length) {
        var nextAppointment = upcomingAppointments[0];
        var nextLabel = Mopapa.rules.describe(
          new Date(nextAppointment.when),
          nextAppointment.hasTime
        );

        return {
          answer: 'Your next appointment is ' +
            String(nextAppointment.text || 'your appointment')
              .replace(
                /\s+on\s+\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+\d{4})?(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))?/i,
                ''
              )
              .trim() +
            ' on ' + nextLabel + '.',
          sources: [nextAppointment]
        };
      }
    }
    
    if (isOverdueTaskQuestion(q)) {
      var overdueTasks = all.filter(function (e) {
        return e.room === 'todo' &&
          e.when &&
          Mopapa.rules.isPast(e.when, e.hasTime);
      }).sort(sortByWhen);

      if (overdueTasks.length) {
        return {
          answer: 'You have ' + overdueTasks.length +
            ' overdue ' +
            (overdueTasks.length === 1 ? 'task' : 'tasks') +
            ':\n' +
            overdueTasks.map(function (e) {
              return '• ' + e.text;
            }).join('\n'),
          sources: overdueTasks.slice(0, 8)
        };
      }

      return {
        answer: 'I could not find any overdue tasks with a saved date.',
        sources: []
      };
    }

    if (asksWhoSomethingIsFor(q)) {
      var forMatches = matches.filter(function (e) {
        return /\bfor\s+[A-Z][a-z]+/.test(String(e.text || ''));
      });

      if (forMatches.length === 1) {
        var forName = String(forMatches[0].text)
          .match(/\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)[1];

        return {
          answer: 'It looks like it is for ' + forName + '.',
          sources: [forMatches[0]]
        };
      }

      return {
        answer: 'I could not find who that is for. I will not guess.',
        sources: forMatches.slice(0, 5)
      };
    }

    if (
      (/\bwhere\b/.test(norm(q)) ||
       /\bwhich\s+(?:folder|drawer|room|place)\b/.test(norm(q))) &&
      matches.length
    ) {
      var locationMatches = matches.filter(function (entry) {
        return /\b(in|inside|on|under|behind|beside|next to|within)\b/i
          .test(String(entry.text || ''));
      });

      if (locationMatches.length === 1) {
        var locationText = String(locationMatches[0].text || '')
          .trim()
          .replace(/[.!?]+$/, '');

        var locationAnswer = locationText.match(
          /\b(is|are)\s+(?:located\s+)?(in|inside|on|under|behind|beside|next to|within)\s+(.+)$/i
        );

        if (locationAnswer) {
          var savedText = String(locationMatches[0].text || '')
            .trim()
            .replace(/[.!?]+$/, '');

          var subjectMatch = savedText.match(/^(.*?)\s+(?:is|are)\b/i);
          var savedSubject = subjectMatch ? subjectMatch[1] : '';
          var savedPlural = /\b(keys|shoes|boots|gloves|glasses|books|documents|certificates|papers|items)\b/i
            .test(savedSubject);

          var questionPlural = /\b(keys|shoes|boots|gloves|glasses|books|documents|certificates|papers|items)\b/i
            .test(norm(q));

          if (questionPlural && !savedPlural) {
            return {
              answer: 'I found this saved item: ' + savedText + '.',
              sources: [locationMatches[0]]
            };
          }

          return {
            answer: (locationAnswer[1].toLowerCase() === 'are'
              ? 'They are '
              : 'It is ') +
              locationAnswer[2].toLowerCase() + ' ' +
              locationAnswer[3].replace(/[.!?]+$/, '') + '.',
            sources: [locationMatches[0]]
          };
        }

        return {
          answer: locationText + '.',
          sources: [locationMatches[0]]
        };
      }
    }

    if (askingWhen && matches.length) {
      var dated = matches.filter(function (e) {
        return e.when &&
          !Mopapa.rules.isPast(e.when, e.hasTime);
      }).sort(sortByWhen);

      if (dated.length) {
        var distinctWhen = [];

        dated.forEach(function (entry) {
          var key = new Date(entry.when).getTime();

          if (distinctWhen.indexOf(key) === -1) {
            distinctWhen.push(key);
          }
        });

        if (distinctWhen.length > 1) {
          var tappedWhen = confirmedBySig(dated, sig);

          if (tappedWhen) {
            dated = [tappedWhen];
            distinctWhen = [new Date(tappedWhen.when).getTime()];
          }
        }

        if (distinctWhen.length > 1) {
          return {
            answer: 'I found different scheduled dates in your saved entries. Which entry do you mean?',
            sources: dated.slice(0, 5)
          };
        }

        var first = dated[0];
        var label = Mopapa.rules.describe(
          new Date(first.when),
          first.hasTime
        );

        var nextSubject = String(first.text || '')
          .replace(/\s+(?:on|at)\s+\d.*$/i, '')
          .replace(/[.!?]+$/, '')
          .trim();

        return {
          answer: nextSubject
            ? '“' + nextSubject + '” is next: ' + label + '.'
            : 'The next one is ' + label + '.',
          sources: dated.slice(0, 5)
        };
      }

      var pastDated = matches.filter(function (e) {
        return !!e.when;
      }).sort(sortByWhen);

      if (pastDated.length) {
        return {
          answer: 'I found a matching entry, but its date has already passed. Here it is so you can check.',
          sources: pastDated.slice(0, 5)
        };
      }

      var textDated = [];

      matches.forEach(function (e) {
        var foundDate = extractTextDate(e.text);

        if (foundDate) {
          textDated.push({
            entry: e,
            date: foundDate
          });
        }
      });


      if (textDated.length) {
        var distinctDates = [];

        textDated.forEach(function (item) {
          var key = item.date.label.toLowerCase();

          if (distinctDates.indexOf(key) === -1) {
            distinctDates.push(key);
          }
        });

        if (distinctDates.length > 1) {
          return {
            answer: 'I found different dates in your saved entries. Which entry do you mean?',
            sources: textDated.slice(0, 5).map(function (item) {
              return item.entry;
            })
          };
        }

        var firstItem = textDated[0];
        var firstEntry = firstItem.entry;
        var answerText = String(firstEntry.text || '').trim();


        if (textDated.length === 1 && answerText) {
          var conciseText = answerText.replace(
            new RegExp(
              '\\s+on\\s+' +
              firstItem.date.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'i'
            ),
            ''
          ).trim();

          var reply;

          if (/\btomorrow\b/i.test(q)) {
            reply = 'You need to take care of this tomorrow: ' +
              conciseText + '.';
          } else if (/\bwhen\b|\bwhat date\b|\bwhat time\b/i.test(q)) {
            if (/^(pay|renew|return|submit|call|book|check|pick up|follow up)\b/i.test(conciseText)) {
              reply = 'You need to ' +
                conciseText.charAt(0).toLowerCase() +
                conciseText.slice(1) + ' on ' +
                firstItem.date.label + '.';
            } else {
              reply = conciseText + ' is on ' +
                firstItem.date.label + '.';
            }
          } else {
            reply = conciseText + ' on ' +
              firstItem.date.label + '.';
          }

          return {
            answer: reply,
            sources: [firstEntry]
          };
        }


        return {
          answer: 'I found ' + textDated.length +
            ' matching items for ' + firstItem.date.label + '.',
          sources: textDated.slice(0, 5).map(function (item) {
            return item.entry;
          })
        };
      }

      return {
        answer: 'I found matching entries, but none has a date I can read. I will not guess the date.',
        sources: matches.slice(0, 5)
      };
    }

    if (matches.length && isNameQuestion(q)) {
      var namedMatches = [];

      matches.forEach(function (entry) {
        var person = extractCalledPerson(entry.text);

        if (person) {
          namedMatches.push({
            entry: entry,
            person: person
          });
        }
      });

      if (namedMatches.length) {
        var distinctNames = [];

        namedMatches.forEach(function (item) {
          var key = item.person.name.toLowerCase();

          if (distinctNames.indexOf(key) === -1) {
            distinctNames.push(key);
          }
        });

        if (distinctNames.length > 1) {
          return {
            answer: 'I found more than one possible person in your saved entries. Which job or appointment do you mean?',
            sources: namedMatches.slice(0, 5).map(function (item) {
              return item.entry;
            })
          };
        }

        return {
          answer: 'The ' + namedMatches[0].person.role +
            ' is called ' + namedMatches[0].person.name + '.',
          sources: [namedMatches[0].entry]
        };
      }
    }

    matches.sort(sortNewest);

    if (isCostQuestion(q)) {
      return answerCost(q, all, room, date);
    }

    // Hide entries that a newer entry has replaced (never hide everything).
    var currentMap = currentLocations(all);
    var beforeStale = matches.length;
    var fresh = matches.filter(function (e) {
      return !isStale(e, currentMap);
    });

    if (fresh.length) matches = fresh;

    var hiddenStale = beforeStale - matches.length;

    if (!matches.length) {
      var scope = date ? ' for ' + date.label : '';

      return {
        answer: 'I could not find anything matching that' + scope +
          '. Try different words, or check the rooms in Mopapa.',
        sources: [],
        missed: true
      };
    }

    var n = norm(q);

    var directQuestion =
      /\bwhere did i leave\b/.test(n) ||
      /\bwhat do you remember about\b/.test(n) ||
      /\bwhat do i know\b/.test(n) ||
      /\bwhat did i save\b/.test(n) ||
      /\bwhat have i saved\b/.test(n) ||
      /\bwhat did i record\b/.test(n) ||
      /\bwhat have i recorded\b/.test(n) ||
      /\bwhat did i log\b/.test(n) ||
      /\bwhat have i logged\b/.test(n) ||
      /\bwhat did i add\b/.test(n) ||
      /\bwhat have i added\b/.test(n) ||
      /\bwhat did i write\b/.test(n) ||
      /\bwhat did i put\b/.test(n) ||
      /\bwhat idea did i save\b/.test(n) ||
      /\bwhat ideas did i save\b/.test(n) ||
      /\bwhat is the idea i saved\b/.test(n) ||
      /\bwhat are the ideas i saved\b/.test(n) ||
      /\bwhat idea have i saved\b/.test(n) ||
      /\bwhat ideas have i saved\b/.test(n) ||
      /\bwhat gift ideas\b/.test(n);

    var isItemsQuestion =
      /\b(what|which)\b/.test(n) &&
      /\b(item|items|thing|things|object|objects)\b/.test(n) &&
      /\b(in|inside|on|under|behind|beside|within)\b/.test(n);
      
    var shown = (directQuestion || isItemsQuestion)
      ? matches
      : matches.slice(0, 5);
    var roomText = room ? ' in ' + roomName(room) : '';
    var dateText = date ? ' for ' + date.label : '';
    var lead;

    if (date) {
      lead = 'Yes, I found ' + matches.length +
        ' matching entr' + (matches.length === 1 ? 'y' : 'ies') +
        roomText + dateText + '.';
    } else if (room) {
      lead = 'I found ' + matches.length +
        ' saved entr' + (matches.length === 1 ? 'y' : 'ies') +
        roomText + '.';
    } else {
      lead = 'I found ' + matches.length +
        ' saved entr' + (matches.length === 1 ? 'y' : 'ies') +
        ' matching those words.';
    }

    if (matches.length > shown.length) {
      lead += ' Showing the newest ' + shown.length + '.';
    }

    var staleNote = hiddenStale
      ? ' I hid ' + hiddenStale + ' older ' +
        (hiddenStale === 1 ? 'entry' : 'entries') +
        ' that a newer one replaced.'
      : '';

    lead += staleNote;
    
    if (isItemsQuestion) {
      return {
        answer: 'I found these items:\n' +
          shown.map(function (entry) {
            return '• ' + entry.text;
          }).join('\n'),
        sources: shown
      };
    }
    
    if (directQuestion && shown.length === 1) {
      return {
        answer: 'You saved this: ' + shown[0].text + staleNote,
        sources: shown
      };
    }

    if (
      directQuestion &&
      shown.length > 1
    ) {
      return {
        answer: 'You saved ' + shown.length + ' items:\n' +
          shown.map(function (entry) {
            return '• ' + entry.text;
          }).join('\n') + staleNote,
        sources: shown
      };
    }

    return {
      answer: lead,
      sources: shown
    };
  }

  return {
    answer: answer,
    addAlias: addAlias,
    teachAlias: teachAlias,
    forgetAlias: forgetAlias,
    confirmSource: confirmSource,
    clearConfirmed: clearConfirmed,
    logUnanswered: logUnanswered,
    clearUnanswered: clearUnanswered,
    learned: learned
  };
})();