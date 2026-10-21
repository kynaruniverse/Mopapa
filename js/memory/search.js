var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.search = (function () {
  var STOP = {
    a: 1, an: 1, the: 1, i: 1, me: 1, my: 1, mine: 1, we: 1, our: 1,
    you: 1, your: 1, is: 1, are: 1, was: 1, were: 1, am: 1, do: 1,
    does: 1, did: 1, have: 1, has: 1, had: 1, can: 1, could: 1,
    would: 1, should: 1, will: 1, what: 1, when: 1, where: 1, who: 1,
    why: 1, how: 1, find: 1, search: 1, show: 1, please: 1, in: 1,
    on: 1, at: 1, for: 1, of: 1, to: 1, from: 1, with: 1, and: 1,
    or: 1, but: 1, about: 1, room: 1, rooms: 1, my: 1
  };

  function normalize(value) {
    return String(value || '').toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9£]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function queryWords(query) {
    var seen = {};
    return normalize(query).split(' ').filter(function (word) {
      if (word.length < 2 || STOP[word] || seen[word]) return false;
      seen[word] = true;
      return true;
    });
  }

  function wordMatches(searchWord, entryWord) {
    // Prefix matching makes a partial word such as "headphon" useful.
    return entryWord.indexOf(searchWord) === 0;
  }

  function find(query) {
    var terms = queryWords(query);
    if (!terms.length) return { tooShort: true, total: 0, results: [] };

    var entries = Mopapa.store.data().entries || [];
    var normalizedQuery = normalize(query);
    var results = [];

    entries.forEach(function (entry) {
      if (!entry || typeof entry.text !== 'string') return;
      var room = Mopapa.roomById(entry.room);
      var roomTerms = room ? room.name + ' ' + room.id : '';
      var tagTerms = Array.isArray(entry.tags) ? entry.tags.join(' ') : '';
      var searchable = normalize(entry.text + ' ' + roomTerms + ' ' + tagTerms);

      var entryWords = searchable ? searchable.split(' ') : [];
      var matched = terms.every(function (term) {
        return entryWords.some(function (entryWord) { return wordMatches(term, entryWord); });
      });
      if (!matched) return;

      var score = terms.length;
      if (searchable.indexOf(normalizedQuery) !== -1) score += 3;
      terms.forEach(function (term) {
        if (entryWords.indexOf(term) !== -1) score += 1;
      });
      results.push({ entry: entry, room: room, score: score });
    });

    results.sort(function (a, b) {
      if (a.score !== b.score) return b.score - a.score;
      return new Date(b.entry.created) - new Date(a.entry.created);
    });
    return { tooShort: false, total: results.length, results: results };
  }

  return { find: find };
})();
