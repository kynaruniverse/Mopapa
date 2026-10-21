var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.resurface = (function () {
  // Begin with non-sensitive memory rooms. Add another room id here later if wanted.
  var INCLUDED_ROOMS = ['wishlist', 'ideas', 'notes'];
  var MIN_AGE_DAYS = 7;

  function localDayNumber(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  }

  function dayKey(date) {
    var month = String(date.getMonth() + 1);
    var day = String(date.getDate());
    return date.getFullYear() + '-' + (month.length < 2 ? '0' : '') + month + '-' + (day.length < 2 ? '0' : '') + day;
  }

  function stableScore(text) {
    var hash = 0;
    for (var i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    return hash >>> 0;
  }

  function getToday(now) {
    now = now || new Date();
    var todayNumber = localDayNumber(now);
    var entries = Mopapa.store.data().entries || [];
    var candidates = [];

    entries.forEach(function (entry) {
      if (!entry || INCLUDED_ROOMS.indexOf(entry.room) === -1) return;
      if (entry.done) return;
      var created = new Date(entry.created);
      if (isNaN(created.getTime())) return;
      var age = todayNumber - localDayNumber(created);
      if (age < MIN_AGE_DAYS) return;

      var isAnniversary = created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate() &&
        created.getFullYear() < now.getFullYear();

      candidates.push({
        entry: entry,
        kind: isAnniversary ? 'anniversary' : 'shelf',
        label: isAnniversary ? 'On this day in ' + created.getFullYear() : 'From your memory shelf',
        score: stableScore(dayKey(now) + ':' + entry.id)
      });
    });

    candidates.sort(function (a, b) {
      if (a.kind !== b.kind) return a.kind === 'anniversary' ? -1 : 1;
      return a.score - b.score;
    });
    return candidates;
  }

  return { getToday: getToday };
})();
