var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.store = (function () {
  var KEY = 'mopapa.v1';
  var data = {
    entries: [],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: Object.create(null), unanswered: [] }
  };

  // What Ask has learned from the person. Kept apart from "learned",
  // which belongs to the room sorter and stays untouched.

function cleanAsk(a) {
  var out = {
    aliases: [],
    boosts: Object.create(null),
    unanswered: []
  };

  if (!a || typeof a !== 'object' || Array.isArray(a)) {
    return out;
  }

  if (Array.isArray(a.aliases)) {
    var seenAliases = Object.create(null);

    a.aliases.forEach(function (p) {
      if (
        !Array.isArray(p) ||
        p.length !== 2 ||
        typeof p[0] !== 'string' ||
        typeof p[1] !== 'string'
      ) {
        return;
      }

      var first = p[0].trim();
      var second = p[1].trim();

      if (
        !first ||
        !second ||
        first.length > 30 ||
        second.length > 30 ||
        /\s/.test(first) ||
        /\s/.test(second) ||
        first.toLowerCase() === second.toLowerCase()
      ) {
        return;
      }

      var pair = [
        first.toLowerCase(),
        second.toLowerCase()
      ].sort();

      var key = pair.join('\u0000');

      if (seenAliases[key] || out.aliases.length >= 50) {
        return;
      }

      seenAliases[key] = true;
      out.aliases.push([first, second]);
    });
  }

  if (a.boosts && typeof a.boosts === 'object' && !Array.isArray(a.boosts)) {
    Object.keys(a.boosts).forEach(function (sig) {
      if (
        Object.keys(out.boosts).length >= 200 ||
        !sig ||
        sig.length > 500
      ) {
        return;
      }

      var ids = a.boosts[sig];

      if (!ids || typeof ids !== 'object' || Array.isArray(ids)) {
        return;
      }

      var clean = Object.create(null);

      Object.keys(ids).forEach(function (id) {
        if (
          Object.keys(clean).length >= 10 ||
          !id ||
          id.length > 100
        ) {
          return;
        }

        var count = ids[id];

        if (
          typeof count !== 'number' ||
          !isFinite(count) ||
          count < 1
        ) {
          return;
        }

        count = Math.min(Math.floor(count), 1000);

        if (count < 1) return;

        clean[id] = count;
      });

      if (Object.keys(clean).length) {
        out.boosts[sig] = clean;
      }
    });
  }

  if (Array.isArray(a.unanswered)) {
    var seenQuestions = Object.create(null);

    a.unanswered.forEach(function (u) {
      if (
        !u ||
        typeof u.q !== 'string' ||
        out.unanswered.length >= 30
      ) {
        return;
      }

      var question = u.q.trim();

      if (!question) return;

      question = question.slice(0, 200);

      var key = question.toLowerCase();

      if (seenQuestions[key]) return;

      seenQuestions[key] = true;

      out.unanswered.push({
        q: question,
        at: typeof u.at === 'string' ? u.at.slice(0, 40) : ''
      });
    });
  }

  return out;
}


function normaliseLegacyAmounts(list) {
  if (!Array.isArray(list)) return list;

  return list.map(function (entry) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      Array.isArray(entry) ||
      typeof entry.amount !== 'string' ||
      !/^\s*£/.test(entry.amount)
    ) {
      return entry;
    }

    var copy = Object.assign({}, entry);
    var match = String(entry.text || '').match(
      /£\s?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?![\d,.])/
    );

    copy.amount = match
      ? parseFloat(match[1].replace(/,/g, ''))
      : null;

    return copy;
  });
}

function cleanEntries(list) {
  var seenIds = Object.create(null);

  return list.filter(function (e) {
    if (
      !e ||
      typeof e !== 'object' ||
      Array.isArray(e) ||
      typeof e.id !== 'string' ||
      !e.id.trim() ||
      e.id !== e.id.trim() ||
      e.id.length > 100 ||
      typeof e.text !== 'string' ||
      !e.text.trim() ||
      e.text.length > 1000 ||
      typeof e.room !== 'string' ||
      !e.room.trim() ||
      e.room !== e.room.trim() ||
      e.room.length > 50 ||
      seenIds[e.id]
    ) {
      return false;
    }

    if (!validImportedEntries([e])) return false;

    seenIds[e.id] = true;
    return true;
  });
}

function validImportedEntries(list) {
  if (!Array.isArray(list)) return false;

  var ids = Object.create(null);

  return list.every(function (entry) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      Array.isArray(entry) ||
      typeof entry.id !== 'string' ||
      !entry.id.trim() ||
      entry.id !== entry.id.trim() ||
      entry.id.length > 100 ||
      typeof entry.text !== 'string' ||
      !entry.text.trim() ||
      entry.text.length > 1000 ||
      typeof entry.room !== 'string' ||
      !entry.room.trim() ||
      entry.room !== entry.room.trim() ||
      entry.room.length > 50
    ) {
      return false;
    }

    if (ids[entry.id]) return false;
    ids[entry.id] = true;

    if (
      Object.prototype.hasOwnProperty.call(entry, 'when') &&
      entry.when !== null &&
      entry.when !== '' &&
      (
        typeof entry.when !== 'string' ||
        !Number.isFinite(Date.parse(entry.when))
      )
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(entry, 'hasTime') &&
      typeof entry.hasTime !== 'boolean'
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(entry, 'done') &&
      typeof entry.done !== 'boolean'
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(entry, 'pinned') &&
      typeof entry.pinned !== 'boolean'
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(entry, 'created') &&
      (
        typeof entry.created !== 'string' ||
        !Number.isFinite(Date.parse(entry.created))
      )
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(entry, 'tags') &&
      (
        !Array.isArray(entry.tags) ||
        entry.tags.length > 8 ||
        !entry.tags.every(function (tag) {
          return typeof tag === 'string' && tag.trim().length > 0;
        })
      )
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(entry, 'amounts') &&
      entry.amounts !== null &&
      (
        !Array.isArray(entry.amounts) ||
        !entry.amounts.every(function (amount) {
          return typeof amount === 'number' && Number.isFinite(amount);
        })
      )
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(entry, 'amount') &&
      entry.amount !== null &&
      (
        typeof entry.amount !== 'number' ||
        !Number.isFinite(entry.amount)
      )
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(entry, 'fact') &&
      entry.fact !== null
    ) {
      var fact = entry.fact;

      if (
        !fact ||
        typeof fact !== 'object' ||
        Array.isArray(fact) ||
        fact.attr !== 'location' ||
        !Array.isArray(fact.items) ||
        fact.items.length === 0 ||
        !fact.items.every(function (item) {
          return typeof item === 'string' && !!item.trim();
        }) ||
        typeof fact.prep !== 'string' ||
        !fact.prep.trim() ||
        typeof fact.where !== 'string' ||
        !fact.where.trim() ||
        typeof fact.value !== 'string' ||
        !fact.value.trim() ||
        typeof fact.plural !== 'boolean'
      ) {
        return false;
      }
    }

    return true;
  });
}

function load() {
  data = {
    entries: [],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: Object.create(null), unanswered: [] }
  };

  function preserveRecoveryCopy(rawData) {
    var base = KEY + '.recovery.' + Date.now();
    var recoveryKey = base;
    var suffix = 1;

    try {
      while (localStorage.getItem(recoveryKey) !== null) {
        recoveryKey = base + '.' + suffix;
        suffix++;
      }

      localStorage.setItem(recoveryKey, rawData);
      return true;
    } catch (e) {
      return false;
    }
  }

  var raw = null;
  
  try {
    raw = localStorage.getItem(KEY);
    if (raw) {
      var p = JSON.parse(raw);
      if (p && Array.isArray(p.entries)) {
        var cleanedEntries = cleanEntries(normaliseLegacyAmounts(p.entries));

        if (cleanedEntries.length < p.entries.length) {
          data.rejectedEntries = p.entries.length - cleanedEntries.length;
          data.recoveryCopySaved = preserveRecoveryCopy(raw);
        }

        data.entries = cleanedEntries;
        data.learned = p.learned && typeof p.learned === 'object' && !Array.isArray(p.learned) ? p.learned : {};
        data.customRooms = Array.isArray(p.customRooms) ? p.customRooms : [];
        data.ask = cleanAsk(p.ask);
      } else {
        throw new Error('unexpected shape');
      }
    }
  } catch (e) {
    if (raw) {
      try { localStorage.setItem(KEY + '.corrupt.' + Date.now(), raw); } catch (e2) {}
      data.corrupt = true;
    }
  }
  return data;
}

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function exportJSON() {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mopapa-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function importJSON(file, cb) {
    var completed = false;

    function finish(ok) {
      if (completed) return;
      completed = true;
      if (typeof cb === 'function') cb(ok);
    }

    if (
      !file ||
      (typeof file.size === 'number' && file.size > 5 * 1024 * 1024)
    ) {
      finish(false);
      return;
    }

    var r;

    try {
      r = new FileReader();
    } catch (e) {
      finish(false);
      return;
    }

    r.onload = function () {
      if (completed) return;

      try {
        var p = JSON.parse(r.result);
        if (p && Array.isArray(p.entries)) {
          p.entries = normaliseLegacyAmounts(p.entries);
        }

        if (
          !p ||
          typeof p !== 'object' ||
          Array.isArray(p) ||
          !validImportedEntries(p.entries) ||
          (
            Object.prototype.hasOwnProperty.call(p, 'learned') &&
            (
              !p.learned ||
              typeof p.learned !== 'object' ||
              Array.isArray(p.learned)
            )
          ) ||
          (
            Object.prototype.hasOwnProperty.call(p, 'customRooms') &&
            !Array.isArray(p.customRooms)
          )
        ) {
          throw new Error('bad file');
        }

        var previous = data;

        data = {
          entries: cleanEntries(normaliseLegacyAmounts(p.entries)),
          learned: p.learned && typeof p.learned === 'object' && !Array.isArray(p.learned) ? p.learned : {},
          customRooms: Array.isArray(p.customRooms) ? p.customRooms : [],
          ask: cleanAsk(p.ask)
        };

        if (!save()) {
          data = previous;
          finish(false);
          return;
        }

        finish(true);
      } catch (e) {
        finish(false);
      }
    };

    r.onerror = function () {
      finish(false);
    };

    try {
      r.readAsText(file);
    } catch (e) {
      finish(false);
    }
  }

  return {
    data: function () { return data; },
    load: load, save: save, exportJSON: exportJSON, importJSON: importJSON
  };
})();
