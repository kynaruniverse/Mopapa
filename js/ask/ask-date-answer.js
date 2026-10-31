var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.dateAnswer = (function () {
  function answerWhen(q, matches, sig, helpers) {
    if (!helpers.isWhenQuestion(q) || !matches.length) return null;

    var dated = matches.filter(function (e) {
      return !e.done &&
        e.when &&
        !isNaN(Mopapa.rules.dateForEntry(e.when, e.hasTime).getTime()) &&
        !Mopapa.rules.isPast(e.when, e.hasTime);
    }).sort(helpers.sortByWhen);

    if (dated.length) {
      var distinctWhen = [];

      dated.forEach(function (entry) {
        var key = Mopapa.rules.dateForEntry(entry.when, entry.hasTime).getTime();

        if (distinctWhen.indexOf(key) === -1) {
          distinctWhen.push(key);
        }
      });

      if (distinctWhen.length > 1) {
        var tappedWhen = helpers.confirmedBySig(dated, sig);

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
    }).sort(helpers.sortByWhen);

    if (pastDated.length) {
      return {
        answer: 'I found a matching entry, but its date has already passed. Here it is so you can check.',
        sources: pastDated.slice(0, 5)
      };
    }

    var textDated = [];

    matches.forEach(function (e) {
      if (e.done) return;

      var foundDate = helpers.extractTextDate(e.text);

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

  return {
    answerWhen: answerWhen
  };
})();