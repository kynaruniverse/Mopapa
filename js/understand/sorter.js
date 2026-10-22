
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.sorter = (function () {
  var STOP = {};
  ('the and for with that this have has was are you not but its from they them get got can will ' +
   'just about been into out our your also some any all too very really then there when what ' +
   'where who how now').split(' ').forEach(function (w) { STOP[w] = 1; });

  Mopapa.rules.DAYS.concat(Mopapa.rules.MONTHS).forEach(function (w) {
    STOP[w] = 1;
  });

  function norm(t) {
    return ' ' + String(t).toLowerCase()
      .replace(/['’`]/g, '')
      .replace(/[^a-z0-9£]+/g, ' ')
      .trim() + ' ';
  }

  function tokens(t) {
    var out = [], seen = {};
    norm(t).trim().split(' ').forEach(function (w) {
      if (w.length > 2 && !STOP[w] && !/\d/.test(w) && !seen[w]) {
        seen[w] = 1;
        out.push(w);
      }
    });
    return out;
  }

  // Classification uses explicit rules only.
  function classify(text, parse) {
    var n = norm(text);
    var scored = Mopapa.rooms.map(function (r, i) {
      var s = 0;

      r.words.forEach(function (p) {
        if (n.indexOf(norm(p)) !== -1) {
          s += 1 + 0.5 * (p.split(' ').length - 1);
        }
      });

      if (parse && parse.hasTime && r.id === 'appointments') {
        s += 0.5;
      }

      return { id: r.id, s: s, i: i };
    });

    scored.sort(function (a, b) {
      return b.s - a.s || a.i - b.i;
    });

    if (scored[0].s === 0) {
      var ids = ['notes'].concat(
        scored.map(function (x) { return x.id; })
          .filter(function (id) { return id !== 'notes'; })
      );

      return { room: null, confident: false, ranked: ids };
    }

    var confident = scored[0].s >= 1.5 &&
      (scored[0].s - scored[1].s) >= 1;

    return {
      room: scored[0].id,
      confident: confident,
      ranked: scored.map(function (x) { return x.id; })
    };
  }

  // Compatibility entry point. Learning is paused without touching stored data.
  function learn() {
    return false;
  }

  return {
    classify: classify,
    learn: learn
  };
})();
