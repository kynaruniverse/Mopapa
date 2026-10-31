
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.learning = (function () {
  var norm = Mopapa.askParts.text.norm;
  var queryTerms = Mopapa.askParts.query.queryTerms;
  var roomForQuestion = Mopapa.askParts.roomIntent.roomForQuestion;
  var aliases = Mopapa.askParts.aliases;

  function learnedData() {
    var d = Mopapa.store && Mopapa.store.data
      ? Mopapa.store.data()
      : null;

    if (d && !d.ask) {
      d.ask = {
        aliases: [],
        boosts: Object.create(null),
        unanswered: []
      };
    }

    return d ? d.ask : null;
  }

  function applyLearned() {
    var s = learnedData();
    if (!s) return;

    s.aliases.forEach(function (p) {
      aliases.addAlias(p[0], p[1]);
    });
  }

  function rebuildAliases() {
    aliases.resetBuiltIns();
    applyLearned();
  }

  // One word each, e.g. teachAlias('gp', 'doctor').
  function teachAlias(a, b) {
    var x = norm(a);
    var y = norm(b);
    var s = learnedData();

    if (!s || !x || !y || x === y) return false;

    if (
      /\s/.test(x) ||
      /\s/.test(y) ||
      x.length > 30 ||
      y.length > 30
    ) {
      return false;
    }

    var known = s.aliases.some(function (p) {
      return (p[0] === x && p[1] === y) ||
        (p[0] === y && p[1] === x);
    });

    if (!known) {
      if (s.aliases.length >= 50) return false;

      s.aliases.push([x, y]);

      if (!Mopapa.store.save()) {
        s.aliases.pop();
        return false;
      }
    }

    aliases.addAlias(x, y);
    return true;
  }

  function forgetAlias(a, b) {
    var x = norm(a);
    var y = norm(b);
    var s = learnedData();

    if (!s) return false;

    var before = s.aliases;

    s.aliases = before.filter(function (p) {
      return !(
        (p[0] === x && p[1] === y) ||
        (p[0] === y && p[1] === x)
      );
    });

    if (!Mopapa.store.save()) {
      s.aliases = before;
      return false;
    }

    rebuildAliases();
    return true;
  }

  // The same question always gives the same signature.
  function signatureOf(q) {
    return queryTerms(q, roomForQuestion(q))
      .slice()
      .sort()
      .join(' ');
  }

  // The person tapped this entry as "the one I meant".
  function confirmSource(question, entryId) {
    var s = learnedData();
    var sig = signatureOf(question);

    if (
      !s ||
      !sig ||
      typeof entryId !== 'string' ||
      !entryId
    ) {
      return false;
    }

    var before = JSON.stringify(s.boosts);

    if (!s.boosts[sig]) {
      s.boosts[sig] = Object.create(null);
    }

    var previousCount = s.boosts[sig][entryId];

    if (
      typeof previousCount !== 'number' ||
      !isFinite(previousCount) ||
      previousCount < 0
    ) {
      previousCount = 0;
    }

    s.boosts[sig][entryId] = Math.min(
      previousCount + 1,
      1000
    );

    var keys = Object.keys(s.boosts);

    if (keys.length > 200) {
      delete s.boosts[keys[0]];
    }

    if (!Mopapa.store.save()) {
      s.boosts = Object.assign(
        Object.create(null),
        JSON.parse(before)
      );
      return false;
    }

    return true;
  }

  function clearConfirmed() {
    var s = learnedData();
    if (!s) return false;

    var before = s.boosts;
    s.boosts = Object.create(null);

    if (!Mopapa.store.save()) {
      s.boosts = before;
      return false;
    }

    return true;
  }

  // Of these entries, the one tapped before for this question.
  // Only returns something when exactly one was tapped.
  function confirmedBySig(entries, sig) {
    var s = learnedData();
    var bucket = s && sig ? s.boosts[sig] : null;

    if (!bucket) return null;

    var hits = entries.filter(function (e) {
      return e && bucket[e.id] > 0;
    });

    return hits.length === 1 ? hits[0] : null;
  }

  function logUnanswered(q) {
    var s = learnedData();
    var text = String(q || '').trim().slice(0, 200);

    if (!s || !text) return false;

    var before = s.unanswered;
    var key = text.toLowerCase();

    s.unanswered = [
      { q: text, at: new Date().toISOString() }
    ].concat(before.filter(function (u) {
      return u.q.toLowerCase() !== key;
    })).slice(0, 30);

    if (!Mopapa.store.save()) {
      s.unanswered = before;
      return false;
    }

    return true;
  }

  function clearUnanswered() {
    var s = learnedData();
    if (!s) return false;

    var before = s.unanswered;
    s.unanswered = [];

    if (!Mopapa.store.save()) {
      s.unanswered = before;
      return false;
    }

    return true;
  }

  // A read-only summary for the screen.
  function learned() {
    var s = learnedData();
    var taps = 0;

    if (!s) {
      return {
        aliases: [],
        unanswered: [],
        taps: 0
      };
    }

    var activeIds = Object.create(null);

    Mopapa.store.data().entries.forEach(function (entry) {
      if (entry && entry.id) activeIds[entry.id] = true;
    });

    Object.keys(s.boosts).forEach(function (k) {
      Object.keys(s.boosts[k]).forEach(function (id) {
        if (activeIds[id]) taps++;
      });
    });

    return {
      aliases: s.aliases.map(function (p) {
        return [p[0], p[1]];
      }),
      unanswered: s.unanswered.map(function (u) {
        return { q: u.q, at: u.at };
      }),
      taps: taps
    };
  }

  return {
    learnedData: learnedData,
    applyLearned: applyLearned,
    rebuildAliases: rebuildAliases,
    teachAlias: teachAlias,
    forgetAlias: forgetAlias,
    signatureOf: signatureOf,
    confirmSource: confirmSource,
    clearConfirmed: clearConfirmed,
    confirmedBySig: confirmedBySig,
    logUnanswered: logUnanswered,
    clearUnanswered: clearUnanswered,
    learned: learned
  };
})();
