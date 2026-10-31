var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.ask = (function () {
  var norm = Mopapa.askParts.text.norm;
  var editDistance = Mopapa.askParts.match.editDistance;
  var termsClose = Mopapa.askParts.match.termsClose;
  var extractTextDate = Mopapa.askParts.dateText.extractTextDate;
  var textDateMatchesFilter = Mopapa.askParts.dateText.textDateMatchesFilter;
  var dateFilter = Mopapa.askParts.dateFilter.dateFilter;
  var explicitDateFilter = Mopapa.askParts.dateFilter.explicitDateFilter;
  var loggedOn = Mopapa.askParts.dateFilter.loggedOn;
  var isLoggedQuestion = Mopapa.askParts.dateIntent.isLoggedQuestion;
  var isWhenQuestion = Mopapa.askParts.dateIntent.isWhenQuestion;
  var isScheduledDateQuestion = Mopapa.askParts.dateIntent.isScheduledDateQuestion;
  var isCostQuestion = Mopapa.askParts.moneyIntent.isCostQuestion;
  var MONTH_NAMES = Mopapa.askParts.dateText.MONTH_NAMES;
  var words = Mopapa.askParts.text.words;
  var hasPhrase = Mopapa.askParts.text.hasPhrase;
  var stem = Mopapa.askParts.text.stem;
  var questionIntent = Mopapa.askParts.questionIntent;
  var roomForQuestion = Mopapa.askParts.roomIntent.roomForQuestion;
  var queryTerms = Mopapa.askParts.query.queryTerms;

  var aliasModule = Mopapa.askParts.aliases;

  function entryStems(e) {
    return Mopapa.askParts.match.entryStems(e, norm, stem);
  }

  function includesAllTerms(e, terms) {
    return Mopapa.askParts.match.includesAllTerms(
      e,
      terms,
      entryStems,
      aliasModule.map
    );
  }
  
  function rankedMatches(entries, terms, room, sig) {
    return Mopapa.askParts.ranking.rankedMatches(
      entries,
      terms,
      room,
      sig,
      {
        aliases: aliasModule.map,
        termsClose: termsClose,
        learnedData: learnedData,
        entryStems: entryStems,
        sortNewest: sortNewest
      }
    );
  }

  // ---- Structured facts (where things are) ----

  var currentLocations = Mopapa.askParts.facts.currentLocations;
  var isStale = Mopapa.askParts.facts.isStale;
  var whereStems = Mopapa.askParts.facts.whereStems;
  var DETS = Mopapa.askParts.facts.dets;

  function structuredWhere(terms, all) {
    return Mopapa.askParts.facts.structuredWhere(
      terms,
      all,
      {
        currentLocations: currentLocations,
        aliases: aliasModule.map,
        confirmedBySig: confirmedBySig
      }
    );
  }

  function structuredItems(q, all) {
    return Mopapa.askParts.facts.structuredItems(
      q,
      all,
      {
        norm: norm,
        words: words,
        stem: stem,
        dets: DETS,
        currentLocations: currentLocations,
        whereStems: whereStems
      }
    );
  }

  function formatMoney(n) {
    return Mopapa.askParts.moneyFormat.formatMoney(n);
  }
  // ---- Learning from the person (saved in store.ask) ----

  function learnedData() {
    var d = Mopapa.store && Mopapa.store.data ? Mopapa.store.data() : null;

    if (d && !d.ask) {
      d.ask = { aliases: [], boosts: Object.create(null), unanswered: [] };
    }

    return d ? d.ask : null;
  }

  function applyLearned() {
    var s = learnedData();
    if (!s) return;

    s.aliases.forEach(function (p) {
      aliasModule.addAlias(p[0], p[1]);
    });
  }

  function rebuildAliases() {
    aliasModule.resetBuiltIns();
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

    aliasModule.addAlias(x, y);
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

    if (
      !s ||
      !sig ||
      typeof entryId !== 'string' ||
      !entryId
    ) {
      return false;
    }

    var before = JSON.stringify(s.boosts);

    if (!s.boosts[sig]) s.boosts[sig] = Object.create(null);

    var previousCount = s.boosts[sig][entryId];
    if (
      typeof previousCount !== 'number' ||
      !isFinite(previousCount) ||
      previousCount < 0
    ) {
      previousCount = 0;
    }

    s.boosts[sig][entryId] = Math.min(previousCount + 1, 1000);

    var keys = Object.keys(s.boosts);
    if (keys.length > 200) delete s.boosts[keys[0]];

    if (!Mopapa.store.save()) {
      s.boosts = Object.assign(Object.create(null), JSON.parse(before));
      return false;
    }

    return true;
  }

  function clearConfirmed() {
    var s = learnedData();
    if (!s) return false;

    var before = s.boosts;
    s.boosts = Object.create(null);

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



  function roomName(id) {
    var r = Mopapa.roomById(id);
    return r ? r.name : 'Unknown room';
  }

  function sortNewest(a, b) {
    return new Date(b.created) - new Date(a.created);
  }

  function sortByWhen(a, b) {
    return Mopapa.rules.dateForEntry(a.when, a.hasTime) -
      Mopapa.rules.dateForEntry(b.when, b.hasTime);
  }
  
  function answerCost(q, all, room, date) {
    return Mopapa.askParts.moneyAnswer.answerCost(
      q,
      all,
      room,
      date,
      {
        norm: norm,
        queryTerms: queryTerms,
        loggedOn: loggedOn,
        textDateMatchesFilter: textDateMatchesFilter,
        sortNewest: sortNewest,
        includesAllTerms: includesAllTerms,
        words: words,
        stem: stem,
        formatMoney: formatMoney,
        confirmedBySig: confirmedBySig,
        signatureOf: signatureOf
      }
    );
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
    var date = explicitDateFilter(
      q,
      now,
      norm,
      extractTextDate,
      isLoggedQuestion,
      isScheduledDateQuestion,
      MONTH_NAMES
    ) || dateFilter(q, now, norm, isScheduledDateQuestion);
    applyLearned();

    var terms = queryTerms(q, room);
    var sig = terms.slice().sort().join(' ');

    if (
      !terms.length &&
      !room &&
      !date &&
      !isLoggedQuestion(q) &&
      !Mopapa.askParts.people.asksWhoSomethingIsFor(q)
    ) {
      return {
        answer: 'Ask me about something specific, like “when is the dentist?”',
        sources: []
      };
    }

    function findMatches(roomFilter) {
      return all.filter(function (e) {
        if (roomFilter && e.room !== roomFilter) return false;

        if (date && date.due && e.done) return false;

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
          if (date && date.due && e.done) return false;

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
    var isLocationQuestion = questionIntent.isLocationQuestion(q);

    if (isLocationQuestion && matches.length > 1) {
      var scoredMatches = matches.map(function (entry) {
        var text = norm(String(entry.text || ''));
        var subject = text.split(/\b(?:is|are)\b/)[0].trim();
        var score = Mopapa.askParts.facts.locationMatchScore(
          entry,
          terms,
          norm,
          stem
        );

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

    var nextAppointmentAnswer = Mopapa.askParts.dateIntent.answerNextAppointment(
      q,
      all,
      sortByWhen
    );

    if (nextAppointmentAnswer) return nextAppointmentAnswer;

    var overdueAnswer = Mopapa.askParts.dateIntent.answerOverdueTasks(
      q,
      all,
      sortByWhen
    );

    if (overdueAnswer) return overdueAnswer;


    var whoForAnswer = Mopapa.askParts.people.answerWhoSomethingIsFor(
      q,
      matches
    );

    if (whoForAnswer) return whoForAnswer;

    if (isLocationQuestion && matches.length) {
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
        return !e.done &&
          e.when &&
          !isNaN(Mopapa.rules.dateForEntry(e.when, e.hasTime).getTime()) &&
          !Mopapa.rules.isPast(e.when, e.hasTime);
      }).sort(sortByWhen);

      if (dated.length) {
        var distinctWhen = [];

        dated.forEach(function (entry) {
          var key = Mopapa.rules.dateForEntry(entry.when, entry.hasTime).getTime();

          if (distinctWhen.indexOf(key) === -1) {
            distinctWhen.push(key);
          }
        });

        if (distinctWhen.length > 1) {
          var tappedWhen = confirmedBySig(dated, sig);

          if (tappedWhen) {
            dated = [tappedWhen];
            distinctWhen = [
              Mopapa.rules.dateForEntry(tappedWhen.when, tappedWhen.hasTime).getTime()
            ];
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
          Mopapa.rules.dateForEntry(first.when, first.hasTime),
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
        return !e.done &&
          e.when &&
          !isNaN(Mopapa.rules.dateForEntry(e.when, e.hasTime).getTime()) &&
          Mopapa.rules.isPast(e.when, e.hasTime);
      }).sort(sortByWhen);

      if (pastDated.length) {
        return {
          answer: 'I found a matching entry, but its date has already passed. Here it is so you can check.',
          sources: pastDated.slice(0, 5)
        };
      }

      var textDated = [];

      matches.forEach(function (e) {
        if (e.done) return;

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

    var calledNameAnswer = Mopapa.askParts.people.answerCalledName(
      q,
      matches
    );

    if (calledNameAnswer) return calledNameAnswer;

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

    var directQuestion = questionIntent.isDirectQuestion(n);

    var isItemsQuestion = questionIntent.isItemsQuestion(n);
      
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
    addAlias: aliasModule.addAlias,
    teachAlias: teachAlias,
    forgetAlias: forgetAlias,
    confirmSource: confirmSource,
    clearConfirmed: clearConfirmed,
    logUnanswered: logUnanswered,
    clearUnanswered: clearUnanswered,
    learned: learned
  };
})();