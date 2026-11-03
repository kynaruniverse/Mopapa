
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.sorter = (function () {
  var STOP = Object.create(null);
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
    var out = [], seen = Object.create(null);
    norm(t).trim().split(' ').forEach(function (w) {
      if (w.length > 2 && !STOP[w] && !/\d/.test(w) && !seen[w]) {
        seen[w] = 1;
        out.push(w);
      }
    });
    return out;
  }

    var TASK_ACTION =
    '(?:fill\\s+in|fill\\s+out|set\\s+up|log\\s+in|log\\s+out|' +
    'back\\s+up|hand\\s+in|sort\\s+out|look\\s+into|write\\s+down|' +
    'sign\\s+up|get\\s+in\\s+touch|pick\\s+up|drop\\s+off|' +
    'follow\\s+up|look\\s+up|pay\\s+off|put\\s+away|take\\s+back|' +
    'send\\s+off|check\\s+in|check\\s+out|do|complete|prepare|' +
    'submit|file|sort|organise|organize|arrange|collect|chase|' +
    'finish|call|email|pay|book|renew|send|tidy|clean|contact|' +
    'cancel|return|check|apply|register|schedule|make|find|' +
    'research|review|update|repair|fix|install|replace|order|' +
    'buy|download|upload|print|scan|sign|read|write|watch|' +
    'listen|visit|move|remove|delete|create|build|compare|' +
    'measure|wash|cook|water|feed|charge)';

  var DIRECT_TASK_RE = new RegExp(
    '^(?:please\\s+)?' + TASK_ACTION + '\\b',
    'i'
  );

  var INTENT_TASK_RE = new RegExp(
    '^(?:i|we)\\s+(?:(?:really|definitely)\\s+)?' +
    '(?:(?:need|have|plan|intend)\\s+to\\s+|(?:must|should)\\s+)' +
    TASK_ACTION + '\\b',
    'i'
  );

  var REMINDER_TASK_RE = new RegExp(
    '^(?:(?:please\\s+)?remember\\s+to|' +
    "(?:please\\s+)?(?:do\\s+not|don['’]?t|never)\\s+forget\\s+to)\\s+" +
    TASK_ACTION + '\\b',
    'i'
  );

  var QUESTION_AUX_RE =
    /^(?:do|does|did)\s+(?:i|we|you|they)\b/i;

  var NEGATIVE_COMMAND_RE =
    /^(?:please\s+)?(?:do\s+not|don['’]?t|never)\s+/i;

  function isTaskInstruction(command) {
    if (QUESTION_AUX_RE.test(command)) {
      return false;
    }

    if (REMINDER_TASK_RE.test(command)) {
      return true;
    }

    if (NEGATIVE_COMMAND_RE.test(command)) {
      return false;
    }

    return DIRECT_TASK_RE.test(command) ||
      INTENT_TASK_RE.test(command);
  }

  // Classification uses explicit rules only.
  function classify(text, parse) {
    var command = String(text || '').trim();

    if (isTaskInstruction(command)) {
      return {
        room: 'todo',
        confident: true,
        ranked: ['todo', 'appointments', 'wishlist', 'feelings', 'ideas', 'notes']
      };
    }

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
