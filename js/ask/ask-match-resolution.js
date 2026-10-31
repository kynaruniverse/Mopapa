var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.matchResolution = (function () {
  function resolveMatches(q, all, terms, room, date, sig, helpers) {
    function findMatches(roomFilter) {
      return all.filter(function (e) {
        if (roomFilter && e.room !== roomFilter) return false;

        if (date && date.due && e.done) return false;

        if (
          date &&
          !helpers.loggedOn(e, date) &&
          !helpers.textDateMatchesFilter(e, date)
        ) {
          return false;
        }

        return helpers.includesAllTerms(e, terms);
      });
    }

    var matches = findMatches(room);

    // A guessed room must never hide a matching saved entry.
    if (room && !matches.length) {
      matches = findMatches(null);
    }

    // Offer close matches when no exact result exists.
    if (!matches.length && terms.length && !helpers.isCostQuestion(q)) {
      var closest = helpers.rankedMatches(
        all.filter(function (e) {
          if (date && date.due && e.done) return false;

          return !date ||
            helpers.loggedOn(e, date) ||
            helpers.textDateMatchesFilter(e, date);
        }),
        terms,
        room,
        sig
      );

      if (closest.length) {
        return {
          response: {
            answer: 'I could not find an exact match, but these are the closest saved entries:\n' +
              closest.map(function (entry) {
                return '• ' + entry.text;
              }).join('\n'),
            sources: closest
          },
          matches: [],
          isLocationQuestion: false
        };
      }
    }

    var isLocationQuestion =
      helpers.questionIntent.isLocationQuestion(q);

    // Prefer the most specific subject for location questions.
    if (isLocationQuestion && matches.length > 1) {
      var scoredMatches = matches.map(function (entry) {
        var text = helpers.norm(String(entry.text || ''));
        var subject = text.split(/\b(?:is|are)\b/)[0].trim();
        var score = helpers.locationMatchScore(
          entry,
          terms,
          helpers.norm,
          helpers.stem
        );

        var subjectWords = subject.split(' ').filter(Boolean);
        var extraWords = subjectWords.filter(function (word) {
          return terms.indexOf(helpers.stem(word)) === -1 &&
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

    return {
      response: null,
      matches: matches,
      isLocationQuestion: isLocationQuestion
    };
  }

  return {
    resolveMatches: resolveMatches
  };
})();