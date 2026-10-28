
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.facts = (function () {
  var PLACE_Q = /^what(?:s| is| are)?\s+(?:the\s+)?(?:(?:items?|things?|stuff|objects?)\s+)?(?:(?:is|are)\s+)?(?:(?:did\s+i|have\s+i)\s+(?:put|leave|store|keep|hide|park)\s+)?(in|inside|on|under|behind|beside|within|at)\s+(.+)$/;

  var words = Mopapa.askParts.text.words;
  var stem = Mopapa.askParts.text.stem;

  var DETS = Object.assign(Object.create(null), {
    the: 1, my: 1, our: 1, a: 1, an: 1
  });

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

  function currentLocations(all) {
    var map = Object.create(null);

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
  
  function structuredWhere(terms, all, helpers) {
    if (!terms.length) return null;

    var map = helpers.currentLocations(all);
    var cands = Object.keys(map).map(function (k) {
      return map[k];
    }).filter(function (c) {
      return terms.every(function (t) {
        return c.stems.indexOf(t) !== -1 ||
          (helpers.aliases[t] || []).some(function (a) {
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
      var tappedEntry = helpers.confirmedBySig(
        entries,
        terms.slice().sort().join(' ')
      );

      if (tappedEntry) {
        entries = [tappedEntry];
        use = use.filter(function (c) {
          return c.entry === tappedEntry;
        });
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

  function structuredItems(q, all, helpers) {
    var m = helpers.norm(q).match(PLACE_Q);
    if (!m) return null;

    var placeStems = helpers.words(m[2]).map(helpers.stem).filter(function (w) {
      return !helpers.dets[w];
    });

    if (!placeStems.length) return null;

    var map = helpers.currentLocations(all);
    var hits = Object.keys(map).map(function (k) {
      return map[k];
    }).filter(function (c) {
      var have = helpers.whereStems(c);
      return placeStems.every(function (p) {
        return have.indexOf(p) !== -1;
      });
    });

    if (!hits.length) return null;

    var values = [];
    hits.forEach(function (c) {
      if (values.indexOf(c.fact.value) === -1) {
        values.push(c.fact.value);
      }
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

  function locationMatchScore(entry, terms, norm, stem) {
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

  return {
    structuredWhere: structuredWhere,
    structuredItems: structuredItems,
    currentLocations: currentLocations,
    isStale: isStale,
    whereStems: whereStems,
    locationMatchScore: locationMatchScore,
    dets: DETS
  };
})();
