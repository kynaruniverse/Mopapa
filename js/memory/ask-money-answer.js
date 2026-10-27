
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.moneyAnswer = (function () {
  function answerCost(q, all, room, date, helpers) {
    var n = helpers.norm(q);
    var wantsLatest = /\b(latest|newest|most recent)\b/.test(n);

    var intent = /\b(cost|costs|price|priced|pricing|expensive|cheap|charge|charges|charged|pay|paid|spend|spent|spending|payment|payments|much|amount|total|money|according|latest|newest|recent|most|entry|entries|record|recorded|save|saved|saving|log|logged|logging|did|what|was|is|the|for|on|in|at|yesterday|today|tomorrow)\b/g;

    var subject = n.replace(intent, ' ').replace(/\s+/g, ' ').trim();
    var subjectTerms = helpers.queryTerms(subject, room);

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
        !helpers.loggedOn(e, date) &&
        !helpers.textDateMatchesFilter(e, date)
      ) {
        return false;
      }

      if (isGeneralSpendingTotal) {
        return /\b(spend|spent|spending)\b/i.test(e.text) &&
          !!Mopapa.rules.money(e.text);
      }

      return subjectTerms.length > 0 &&
        helpers.includesAllTerms(e, subjectTerms);
    });

    candidates.sort(helpers.sortNewest);

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
      candidates.length === 1 &&
      !(
        /\b(total|altogether|spend|spent|spending)\b/.test(n) &&
        Mopapa.rules.moneyAll(priced[0].text).length > 1
      )
    ) {
      var cost = Mopapa.rules.money(priced[0].text);
      var subjectWords = helpers.words(subject);
      var subjectText = subjectTerms.map(function (t) {
        var raw = subjectWords.filter(function (x) {
          return helpers.stem(x) === t;
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
        answer: 'You spent ' + helpers.formatMoney(sum) + ' in total across ' +
          counted.length + ' entries.',
        sources: counted.slice(0, 8)
      };
    }

    var tappedCost = helpers.confirmedBySig(priced, helpers.signatureOf(q));

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

  return {
    answerCost: answerCost
  };
})();
