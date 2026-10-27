
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.ranking = (function () {
  function termStrength(term, have, helpers) {
    if (have.indexOf(term) !== -1) return 1;

    var alts = helpers.aliases[term] || [];

    for (var i = 0; i < alts.length; i++) {
      if (have.indexOf(alts[i]) !== -1) return 0.9;
    }

    for (var j = 0; j < have.length; j++) {
      if (helpers.termsClose(term, have[j])) return 0.7;
    }

    return 0;
  }

  function rankedMatches(entries, terms, room, sig, helpers) {
    if (!terms.length || !entries.length) return [];

    var s = helpers.learnedData();
    var tapped = s && sig && s.boosts[sig] ? s.boosts[sig] : {};

    var stemmed = entries.map(helpers.entryStems);

    // Rarer terms count for more (a simple IDF weight).
    var weights = terms.map(function (term) {
      var df = 0;

      stemmed.forEach(function (have) {
        if (have.indexOf(term) !== -1) df++;
      });

      return Math.log(1 + entries.length / (1 + df));
    });

    var total = weights.reduce(function (a, b) {
      return a + b;
    }, 0);

    var scored = [];

    entries.forEach(function (e, i) {
      var got = 0;

      terms.forEach(function (term, t) {
        got += termStrength(term, stemmed[i], helpers) * weights[t];
      });

      var coverage = total ? got / total : 0;
      var wasTapped = tapped[e.id] > 0;

      // Previously selected entries qualify at a lower threshold.
      if (coverage < (wasTapped ? 0.3 : 0.6)) return;

      scored.push({
        entry: e,
        score: coverage +
          (room && e.room === room ? 0.1 : 0) +
          (wasTapped ? 0.3 : 0)
      });
    });

    scored.sort(function (a, b) {
      return b.score - a.score ||
        helpers.sortNewest(a.entry, b.entry);
    });

    return scored.slice(0, 5).map(function (item) {
      return item.entry;
    });
  }

  return {
    termStrength: termStrength,
    rankedMatches: rankedMatches
  };
})();
