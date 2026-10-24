var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.ask = (function () {
  var STOP = (
    'a an the i me my mine we our you your he she it they them is are was were am ' +
    'do does did have has had can could would should will need needs needed ' +
    'what whats when whens ' +
    'know knows knowing knew understand understood ' +
    'where wheres who whos whose which why how many much often show tell find search ' +
    'please logged log logbook entry entries any anything something everything ' +
    'about on in at for of to from with and or but last this that there here next due scheduled ' +
    'didnt dont doesnt isnt wasnt werent hasnt havent wouldnt couldnt shouldnt ' +
    'have i ever been remember remind tell me put left kept keep myself today yesterday tomorrow ' +
    'save saved saving saves record records recorded recording records remember remembered ' +
    'add added adding create created creating get got retrieve retrieving'
  ).split(' ').reduce(function (o, w) {
    o[w] = true;
    return o;
  }, {});

  var ROOM_WORDS = [
    'todo', 'todos', 'task', 'tasks', 'reminder', 'reminders', 'appointment',
    'appointments', 'feel', 'feeling', 'feelings', 'mood', 'moods', 'wish',
    'wishlist', 'list', 'idea', 'ideas', 'note', 'notes'
  ];

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
    var all = words(q);
    var out = [];
    var seen = {};
    var selectedRoom = roomId ? Mopapa.roomById(roomId) : null;
    var customNameWords = (
      selectedRoom && selectedRoom.id.indexOf('custom_') === 0
    ) ? words(selectedRoom.name) : [];

    all.forEach(function (w) {
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
      if (ROOM_WORDS.indexOf(term) !== -1) return;
      if (DAY_NAMES.indexOf(term) !== -1) return;

      if (MONTH_NAMES.indexOf(term) !== -1) return;

      if ([
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'sept', 'oct', 'nov',
        'dec', 'room', 'house', 'den'
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
    var due = isScheduledDateQuestion(n);

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

      return {
        start: start,
        end: new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        label: 'last ' + m[1],
        due: due
      };
    }

    if (/\byesterday\b/.test(n)) {
      start = localDay(now);
      start.setDate(start.getDate() - 1);

      return {
        start: start,
        end: new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        label: 'yesterday',
        due: due
      };
    }

    if (/\btomorrow\b/.test(n)) {
      start = localDay(now);
      start.setDate(start.getDate() + 1);

      return {
        start: start,
        end: new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        label: 'tomorrow',
        due: true
      };
    }

    if (/\btoday\b/.test(n)) {
      start = localDay(now);

      return {
        start: start,
        end: new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        label: 'today',
        due: due
      };
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


  function extractTextDate(text) {
    var source = String(text || '');
    var match = source.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(\d{4}))?\b/i
    );

    var monthFirst = false;

    if (!match) {
      match = source.match(
        /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/i
      );
      monthFirst = !!match;
    }

    var numeric = false;

    if (!match) {
      match = source.match(
        /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/
      );
      numeric = !!match;
    }

    if (!match) return null;

    var day;
    var month;
    var year;

    if (numeric) {
      // Match the capture parser's day/month/year interpretation.
      day = parseInt(match[1], 10);
      month = parseInt(match[2], 10) - 1;
      year = match[3] ? parseInt(match[3], 10) : null;

      if (year !== null && year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
    } else if (monthFirst) {
      day = parseInt(match[2], 10);
      month = MONTH_NAMES.indexOf(
        match[1].toLowerCase().slice(0, 3) === 'sep'
          ? 'september'
          : MONTH_NAMES.filter(function (name) {
              return name.slice(0, 3) === match[1].toLowerCase().slice(0, 3);
            })[0]
      );
      year = match[3] ? parseInt(match[3], 10) : null;
    } else {
      day = parseInt(match[1], 10);
      month = MONTH_NAMES.indexOf(
        MONTH_NAMES.filter(function (name) {
          return name.slice(0, 3) === match[2].toLowerCase().slice(0, 3);
        })[0]
      );
      year = match[3] ? parseInt(match[3], 10) : null;
    }

    if (month < 0 || month > 11 || day < 1 || day > 31) {
      return null;
    }

    var checkYear = year || 2000;
    var check = new Date(checkYear, month, day);

    if (
      check.getFullYear() !== checkYear ||
      check.getMonth() !== month ||
      check.getDate() !== day
    ) {
      return null;
    }

    return {
      day: day,
      month: month,
      year: year,
      label: day + ' ' +
        MONTH_NAMES[month].charAt(0).toUpperCase() +
        MONTH_NAMES[month].slice(1) +
        (year ? ' ' + year : '')
    };
  }


  
function textDateMatchesFilter(e, filter) {
    if (!filter || !filter.due || !filter.start || !filter.end) {
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
    var source = String(q || '');
    var n = norm(q);
    var months = {};
    var match;
    var day;
    var month;
    var year;
    var loggedQuestion = isLoggedQuestion(n);

    MONTH_NAMES.forEach(function (name, index) {
      months[name] = index;
      months[name.slice(0, 3)] = index;
      if (name === 'september') months.sept = index;
    });

    var monthPattern =
      '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|' +
      'may|june?|july?|aug(?:ust)?|sept?(?:ember)?|' +
      'oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

    // Day first: 5 November 2026, 5th of November, 5 Nov
    match = source.match(new RegExp(
      '\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?' +
      monthPattern + '(?:\\s+(\\d{4}))?\\b',
      'i'
    ));

    if (match) {
      day = Number(match[1]);
      month = months[match[2].toLowerCase()];
      year = match[3] ? Number(match[3]) : null;
    } else {
      // Month first: Nov 5 2026, November 5th 2026
      match = source.match(new RegExp(
        '\\b' + monthPattern +
        '\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b',
        'i'
      ));

      if (match) {
        month = months[match[1].toLowerCase()];
        day = Number(match[2]);
        year = match[3] ? Number(match[3]) : null;
      } else {
        // Numeric dates use UK day/month/year order.
        match = source.match(
          /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/
        );

        if (!match) return null;

        day = Number(match[1]);
        month = Number(match[2]) - 1;
        year = match[3] ? Number(match[3]) : null;

        if (year !== null && year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
      }
    }

    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month) ||
      month < 0 ||
      month > 11 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    if (year === null) {
      year = now.getFullYear();

      var provisional = new Date(year, month, day);

      if (
        provisional.getFullYear() !== year ||
        provisional.getMonth() !== month ||
        provisional.getDate() !== day
      ) {
        return null;
      }

      if (!loggedQuestion && provisional < localDay(now)) {
        year++;
      }
    }

    var start = new Date(year, month, day);

    if (
      start.getFullYear() !== year ||
      start.getMonth() !== month ||
      start.getDate() !== day
    ) {
      return null;
    }

    var due = !loggedQuestion && isScheduledDateQuestion(n);

    return {
      start: start,
      end: new Date(year, month, day + 1),
      label: day + ' ' +
        MONTH_NAMES[month].charAt(0).toUpperCase() +
        MONTH_NAMES[month].slice(1) + ' ' + year,
      due: due,
      explicit: true,
      year: year
    };
  }

  function stem(w) {
    var irregular = {
      paid: 'pay',
      spent: 'spend',
      spending: 'spend',
      bought: 'buy',
      buying: 'buy'
    };

    if (irregular[w]) return irregular[w];

    // Keep common English plural endings consistent.
    if (w.length > 4 && /ies$/.test(w)) {
      return w.slice(0, -3) + 'y';
    }

    if (w.length > 4 && /(ches|shes|sses|xes|zes)$/.test(w)) {
      return w.slice(0, -2);
    }

    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) {
      return w.slice(0, -1);
    }

    // Handle common verb endings.
    if (w.length > 5 && /ing$/.test(w)) {
      return w.slice(0, -3);
    }

    if (w.length > 4 && /ed$/.test(w)) {
      return w.slice(0, -2);
    }

    return w;
  }



  function includesAllTerms(e, terms) {
    if (!terms.length) return true;

    var tagText = Array.isArray(e.tags) ? e.tags.join(' ') : '';
    var have = norm(String(e.text || '') + ' ' + tagText)
      .split(' ')
      .map(stem);

    return terms.every(function (term) {
      var wanted = stem(term);

      if (have.indexOf(wanted) !== -1) return true;

      // Treat "pickup" and "pick up" as equivalent.
      if (wanted === 'pickup') {
        return have.indexOf('pick') !== -1 &&
          have.indexOf('up') !== -1;
      }

      if (wanted === 'pick') {
        return have.indexOf('pickup') !== -1;
      }

      return false;
    });
  }

  function locationMatchScore(entry, terms) {
    var text = norm(String(entry.text || ''));
    var textWords = text.split(' ');
    var score = 0;

    terms.forEach(function (term) {
      var wanted = stem(term);
      var exactWord = textWords.some(function (word) {
        return stem(word) === wanted;
      });

      if (exactWord) {
        score += 10;
      }

      // Prefer entries whose wording matches the query directly.
      if (new RegExp('\\b' + wanted + '\\b').test(text)) {
        score += 5;
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

    if (!subjectTerms.length && !room) {
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

      return subjectTerms.length > 0 &&
        includesAllTerms(e, subjectTerms);
    });

    candidates.sort(sortNewest);

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

    if (priced.length === 1) {
      var cost = Mopapa.rules.money(priced[0].text);
      var subjectText = subjectTerms.join(' ');

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
    var all = Mopapa.entries.byRoom
      ? Mopapa.store.data().entries.slice()
      : [];

    var room = roomForQuestion(q);
    var date = explicitDateFilter(q, now) || dateFilter(q, now);
    var terms = queryTerms(q, room);

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

    // Prefer the closest wording match for location questions.
    var isLocationQuestion =
      /\bwhere\b/.test(norm(q)) ||
      /\bwhich\s+(?:folder|drawer|room|place)\b/.test(norm(q));

    if (isLocationQuestion && matches.length > 1) {
      var scoredMatches = matches.map(function (entry) {
        return {
          entry: entry,
          score: locationMatchScore(entry, terms)
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
    
    if (asksWhoSomethingIsFor(q)) {
      return {
        answer: 'I could not find who that is for. I will not guess.',
        sources: []
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

        return {
          answer: 'The next one is ' + label + '.',
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

          var answer;

          if (/\btomorrow\b/i.test(q)) {
            answer = 'You need to take care of this tomorrow: ' +
              conciseText + '.';
          } else if (/\bwhen\b|\bwhat date\b|\bwhat time\b/i.test(q)) {
            if (/^(pay|renew|return|submit|call|book|check|pick up|follow up)\b/i.test(conciseText)) {
              answer = 'You need to ' +
                conciseText.charAt(0).toLowerCase() +
                conciseText.slice(1) + ' on ' +
                firstItem.date.label + '.';
            } else {
              answer = conciseText + ' is on ' +
                firstItem.date.label + '.';
            }
          } else {
            answer = conciseText + ' on ' +
              firstItem.date.label + '.';
          }

          return {
            answer: answer,
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

    if (!matches.length) {
      var scope = date ? ' for ' + date.label : '';

      return {
        answer: 'I could not find anything matching that' + scope +
          '. Try different words, or check the rooms in Mopapa.',
        sources: []
      };
    }

    var n = norm(q);

    var directQuestion =
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

    var shown = directQuestion
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

    if (directQuestion && shown.length === 1) {
      return {
        answer: 'You saved this: ' + shown[0].text,
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
          }).join('\n'),
        sources: shown
      };
    }

    return {
      answer: lead,
      sources: shown
    };
  }

  return {
    answer: answer
  };
})();