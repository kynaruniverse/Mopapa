var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.store = (function () {
  var KEY = 'mopapa.v1';
  var data = { entries: [], learned: {}, customRooms: [], ask: { aliases: [], boosts: {}, unanswered: [] } };

  // What Ask has learned from the person. Kept apart from "learned",
  // which belongs to the room sorter and stays untouched.
  function cleanAsk(a) {
    var out = { aliases: [], boosts: Object.create(null), unanswered: [] };
    if (!a || typeof a !== 'object') return out;

    if (Array.isArray(a.aliases)) {
      a.aliases.forEach(function (p) {
        if (
          Array.isArray(p) && p.length === 2 &&
          typeof p[0] === 'string' && typeof p[1] === 'string' &&
          out.aliases.length < 50
        ) {
          out.aliases.push([p[0].slice(0, 30), p[1].slice(0, 30)]);
        }
      });
    }

    if (a.boosts && typeof a.boosts === 'object') {
      Object.keys(a.boosts).slice(0, 200).forEach(function (sig) {
        var ids = a.boosts[sig];
        if (!ids || typeof ids !== 'object') return;

        var clean = Object.create(null);
        Object.keys(ids).slice(0, 10).forEach(function (id) {
          if (typeof ids[id] === 'number') clean[id] = ids[id];
        });
        out.boosts[sig] = clean;
      });
    }

    if (Array.isArray(a.unanswered)) {
      a.unanswered.forEach(function (u) {
        if (u && typeof u.q === 'string' && out.unanswered.length < 30) {
          out.unanswered.push({
            q: u.q.slice(0, 200),
            at: typeof u.at === 'string' ? u.at : ''
          });
        }
      });
    }

    return out;
  }

function cleanEntries(list) {
  return list.filter(function (e) {
    return e && typeof e === 'object' && typeof e.text === 'string';
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
    return true;
  });
}

function load() {
  var raw = null;
  try {
    raw = localStorage.getItem(KEY);
    if (raw) {
      var p = JSON.parse(raw);
      if (p && Array.isArray(p.entries)) {
        data.entries = cleanEntries(p.entries);
        data.learned = p.learned && typeof p.learned === 'object' ? p.learned : {};
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
      try {
        var p = JSON.parse(r.result);

        if (!p || !validImportedEntries(p.entries)) {
          throw new Error('bad file');
        }

        var previous = data;

        data = {
          entries: cleanEntries(p.entries),
          learned: p.learned && typeof p.learned === 'object' ? p.learned : {},
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
