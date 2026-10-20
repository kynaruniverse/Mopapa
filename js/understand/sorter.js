var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.sorter = (function () {
  var STOP = {};
  ('the and for with that this have has was are you not but its from they them get got can will ' +
   'just about been into out our your also some any all too very really then there when what ' +
   'where who how now').split(' ').forEach(function (w) { STOP[w] = 1; });
  Mopapa.rules.DAYS.concat(Mopapa.rules.MONTHS).forEach(function (w) { STOP[w] = 1; });

  function norm(t) {
    return ' ' + String(t).toLowerCase().replace(/['’`]/g, '').replace(/[^a-z0-9£]+/g, ' ').trim() + ' ';
  }

  function tokens(t) {
    var out = [], seen = {};
    norm(t).trim().split(' ').forEach(function (w) {
      if (w.length > 2 && !STOP[w] && !/\d/.test(w) && !seen[w]) { seen[w] = 1; out.push(w); }
    });
    return out;
  }

  // Returns { room, confident, ranked: [roomIds best-first] }
  function classify(text, parse) {
    var n = norm(text);
    var learned = Mopapa.store.data().learned;
    var toks = tokens(text);
    var scored = Mopapa.rooms.map(function (r, i) {
      var s = 0;
      r.words.forEach(function (p) {
        if (n.indexOf(norm(p)) !== -1) s += 1 + 0.5 * (p.split(' ').length - 1);
      });
      toks.forEach(function (w) {
        var l = learned[w];
        if (l && l[r.id]) s += Math.min(l[r.id], 3) * 0.7;
      });
      if (parse && parse.hasTime && r.id === 'appointments') s += 0.5;
      return { id: r.id, s: s, i: i };
    });
    scored.sort(function (a, b) { return b.s - a.s || a.i - b.i; });

    if (scored[0].s === 0) {
      var ids = ['notes'].concat(scored.map(function (x) { return x.id; }).filter(function (id) { return id !== 'notes'; }));
      return { room: null, confident: false, ranked: ids };
    }
    var confident = scored[0].s >= 1.5 && (scored[0].s - scored[1].s) >= 1;
    return {
      room: scored[0].id,
      confident: confident,
      ranked: scored.map(function (x) { return x.id; })
    };
  }

  // Called only when you tap a room or move an entry.
  function learn(text, roomId) {
    var learned = Mopapa.store.data().learned;
    tokens(text).forEach(function (w) {
      if (!learned[w]) learned[w] = {};
      learned[w][roomId] = (learned[w][roomId] || 0) + 1;
    });
    Mopapa.store.save();
  }

  return { classify: classify, learn: learn };
})();