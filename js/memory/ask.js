var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.ask = (function () {
  var STOP = (
    'a an the i me my mine we our you your he she it they them is are was were am ' +
    'do does did have has had can could would should will what whats when whens ' +
    'where wheres who whos whose which why how many much often show tell find search ' +
    'please logged log logbook entry entries any anything something everything ' +
    'about on in at for of to from with and or but last this that there here next ' +
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
          'to do', 'todo', 'todos', 'task', 'tasks',
          'reminder', 'reminders'
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
        w.length < 3 ||
        STOP[w] ||
        ['name', 'called', 'named'].indexOf(w) !== -1 ||
        /^\d+$/.test(w) ||
        seen[w]
      ) {
        return;
      }

      var term = w;

      if (term.length > 5 && /ies$/.test(term)) {
        term = term.slice(0, -3) + 'y';
      } else if (
        term.length > 4 &&
        /(ches|shes|sses|xes|zes)$/.test(term)
      ) {
        term = term.slice(0, -2);
      } else if (
        term.length > 3 &&
        /s$/.test(term) &&
        !/ss$/.test(term)
      ) {
        term = term.slice(0, -1);
      }

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
      /\b(due|scheduled|appointment|appointments)\b/.test(n);
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
        due: false
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
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+(\d{4}))?\b/i
    );

    if (!match) return null;

    var day = parseInt(match[1], 10);
    var monthName = match[2].toLowerCase();
    var month = MONTH_NAMES.indexOf(monthName);
    var year = match[3] ? parseInt(match[3], 10) : null;

    if (month < 0 || day < 1 || day > 31) return null;

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
        monthName.charAt(0).toUpperCase() + monthName.slice(1) +
        (year ? ' ' + year : '')
    };
  }

  function textDateMatchesFilter(e, filter) {
    if (!filter || !filter.due || !filter.explicit) return false;

    var parsed = extractTextDate(e.text);

    if (!parsed) return false;

    var year = parsed.year || filter.start.getFullYear();
    var d = new Date(year, parsed.month, parsed.day);

    if (
      d.getFullYear() !== year ||
      d.getMonth() !== parsed.month ||
      d.getDate() !== parsed.day
    ) {
      return false;
    }

    return d >= filter.start && d < filter.end;
  }

  function explicitDateFilter(q, now) {
    var n = norm(q);
    var months = {};

    MONTH_NAMES.forEach(function (month, index) {
      months[month] = index;
    });

    var match = n.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?\b/
    );

    if (!match) return null;

    var day = Number(match[1]);
    var month = months[match[2]];
    var year = match[3] ? Number(match[3]) : now.getFullYear();
    var loggedQuestion = isLoggedQuestion(n);
    var due = !loggedQuestion && isScheduledDateQuestion(n);

    if (!match[3] && !loggedQuestion) {
      var candidate = new Date(year, month, day);

      if (
        candidate.getFullYear() !== year ||
        candidate.getMonth() !== month ||
        candidate.getDate() !== day
      ) {
        return null;
      }

      if (candidate < localDay(now)) year++;
    }

    var start = new Date(year, month, day);

    if (
      start.getFullYear() !== year ||
      start.getMonth() !== month ||
      start.getDate() !== day
    ) {
      return null;
    }

    return {
      start: start,
      end: new Date(year, month, day + 1),
      label: day + ' ' +
        match[2].charAt(0).toUpperCase() + match[2].slice(1) +
        ' ' + year,
      due: due,
      explicit: true,
      year: year
    };
  }

  function stem(w) {
    var irr = {
      paid: 'pay',
      bought: 'buy'
    };

    if (irr[w]) return irr[w];

    return w.length > 4
      ? w.replace(/(ing|ed|es|s)$/, '')
      : w.replace(/s$/, '');
  }

  function includesAllTerms(e, terms) {
    if (!terms.length) return true;

    var tagText = Array.isArray(e.tags) ? e.tags.join(' ') : '';
    var have = norm(String(e.text || '') + ' ' + tagText)
      .split(' ')
      .map(stem);

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

  function isCostQuestion(q) {
    var n = norm(q);

    return /\b(cost|costs|price|priced|pricing|expensive|cheap|charge|charges|charged|pay|paid|payment|payments|how much)\b/.test(n);
  }

  function answerCost(q, all, room, date) {
    var n = norm(q);
    var wantsLatest = /\b(latest|newest|most recent)\b/.test(n);

    var intent = /\b(cost|costs|price|priced|pricing|expensive|cheap|charge|charges|charged|pay|paid|payment|payments|much|according|latest|newest|recent|most|entry|entries|record|recorded|save|saved|saving|log|logged|logging|did|what|was|is|the|for|on|in|at|yesterday|today|tomorrow)\b/g;

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
        answer: 'The most recent matching entry records a cost of ' +
          Mopapa.rules.money(priced[0].text) + '.',
        sources: [priced[0]]
      };
    }

    if (priced.length === 1) {
      return {
        answer: 'The saved entry records a cost of ' +
          Mopapa.rules.money(priced[0].text) + '.',
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

    if (!terms.length && !room && !date) {
      return {
        answer: 'Ask me about something specific, like “when is the dentist?”',
        sources: []
      };
    }

    var matches = all.filter(function (e) {
      if (room && e.room !== room) return false;

      if (
        date &&
        !loggedOn(e, date) &&
        !textDateMatchesFilter(e, date)
      ) {
        return false;
      }

      return includesAllTerms(e, terms);
    });

    var askingWhen = isWhenQuestion(q);

    if (asksWhoSomethingIsFor(q)) {
      return {
        answer: 'I could not find who that is for. I will not guess.',
        sources: []
      };
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

        return {
          answer: textDated[0].date.label + '.',
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

    var shown = matches.slice(0, 5);
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

    return {
      answer: lead,
      sources: shown
    };
  }

  return {
    answer: answer
  };
})();