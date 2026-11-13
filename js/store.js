var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.store = (function () {
  var KEY = 'mopapa.v1';
  var SCHEMA_VERSION = 1;
  var lastKnownRaw = null;
  var saveError = null;
  var data = {
    schemaVersion: SCHEMA_VERSION,
    entries: [],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: Object.create(null), unanswered: [] }
  };
  var writeMode = 'unprotected';

  function setWriteMode(mode) {
    writeMode = mode === 'owner' || mode === 'readonly'
      ? mode
      : 'unprotected';
  }

  function getWriteMode() {
    return writeMode;
  }

  function storagePersistenceStatus() {
    var storage = window.navigator && window.navigator.storage;

    if (!storage || typeof storage.persisted !== 'function') {
      return Promise.resolve({
        supported: false,
        persisted: false
      });
    }

    try {
      return Promise.resolve(storage.persisted()).then(
        function (persisted) {
          return {
            supported: true,
            persisted: persisted === true
          };
        },
        function () {
          return {
            supported: true,
            persisted: false,
            failed: true
          };
        }
      );
    } catch (e) {
      return Promise.resolve({
        supported: true,
        persisted: false,
        failed: true
      });
    }
  }

  function requestStoragePersistence() {
    var storage = window.navigator && window.navigator.storage;

    if (!storage || typeof storage.persist !== 'function') {
      return Promise.resolve({
        supported: false,
        granted: false
      });
    }

    try {
      return Promise.resolve(storage.persist()).then(
        function (granted) {
          return {
            supported: true,
            granted: granted === true
          };
        },
        function () {
          return {
            supported: true,
            granted: false,
            failed: true
          };
        }
      );
    } catch (e) {
      return Promise.resolve({
        supported: true,
        granted: false,
        failed: true
      });
    }
  }

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

function stableJSON(value) {
  if (Array.isArray(value)) {
    return '[' + value.map(stableJSON).join(',') + ']';
  }

  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ':' + stableJSON(value[key]);
    }).join(',') + '}';
  }

  return JSON.stringify(value);
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

function cleanLegacyLearned(value) {
  var out = Object.create(null);

  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return out;
  }

  Object.keys(value).slice(0, 500).forEach(function (term) {
    if (
      !term ||
      term.length > 100 ||
      !term.trim()
    ) {
      return;
    }

    var scores = value[term];

    if (
      typeof scores === 'number' &&
      isFinite(scores) &&
      scores >= 1 &&
      scores <= 1000
    ) {
      out[term] = Math.floor(scores);
      return;
    }

    if (
      !scores ||
      typeof scores !== 'object' ||
      Array.isArray(scores)
    ) {
      return;
    }

    var cleanScores = Object.create(null);

    Object.keys(scores).slice(0, 20).forEach(function (room) {
      var score = scores[room];

      if (
        !room ||
        room.length > 50 ||
        typeof score !== 'number' ||
        !isFinite(score) ||
        score < 1 ||
        score > 1000
      ) {
        return;
      }

      cleanScores[room] = Math.floor(score);
    });

    if (Object.keys(cleanScores).length) {
      out[term] = cleanScores;
    }
  });

  return out;
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

function validDateValue(value) {
  if (
    typeof value !== 'string' ||
    !Number.isFinite(Date.parse(value))
  ) {
    return false;
  }

  var parts = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[^0-9])/);

  if (!parts) return true;

  var year = Number(parts[1]);
  var month = Number(parts[2]);
  var day = Number(parts[3]);
  var date = new Date(0);

  date.setUTCFullYear(year, month - 1, day);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
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
      !validDateValue(entry.when)
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
      entry.hasTime === true &&
      (
        !entry.when ||
        !/(?:T|\s)\d{2}:\d{2}/.test(entry.when)
      )
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
      !validDateValue(entry.created)
    ) {
      return false;
    }

    if (
      Object.prototype.hasOwnProperty.call(entry, 'tags') &&
      (
        !Array.isArray(entry.tags) ||
        entry.tags.length > 8 ||
        !entry.tags.every(function (tag) {
          return (
            typeof tag === 'string' &&
            tag.trim().length > 0 &&
            tag.length <= 24
          );
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
        [
          'in',
          'inside',
          'on',
          'under',
          'behind',
          'beside',
          'next to',
          'within',
          'at'
        ].indexOf(fact.prep) === -1 ||
        typeof fact.where !== 'string' ||
        !fact.where.trim() ||
        typeof fact.value !== 'string' ||
        !fact.value.trim() ||
        fact.value.toLowerCase() !==
          (fact.prep + ' ' + fact.where).toLowerCase() ||
        typeof fact.plural !== 'boolean'
      ) {
        return false;
      }
    }

    return true;
  });
}

function cleanImportedCustomRooms(list) {
  if (!Array.isArray(list) || list.length > 10) {
    return null;
  }

  var icons = [
    'book',
    'sprout',
    'palette',
    'paw',
    'music',
    'plane',
    'home',
    'briefcase',
    'telescope',
    'star'
  ];

  var legacyIcons = Object.create(null);

  legacyIcons['\ud83d\udcda'] = 'book';
  legacyIcons['\ud83c\udf31'] = 'sprout';
  legacyIcons['\ud83c\udfa8'] = 'palette';
  legacyIcons['\ud83d\udc3e'] = 'paw';
  legacyIcons['\ud83c\udfb5'] = 'music';
  legacyIcons['\u2708\ufe0f'] = 'plane';
  legacyIcons['\ud83c\udfe0'] = 'home';
  legacyIcons['\ud83d\udcbc'] = 'briefcase';
  legacyIcons['\ud83d\udd2d'] = 'telescope';
  legacyIcons['\u2b50'] = 'star';

  var builtInNames = [
    'to-dos',
    'appointments',
    'wish list',
    'feelings',
    'ideas',
    'notes'
  ];

  var ids = Object.create(null);
  var names = Object.create(null);
  var cleaned = [];

  for (var i = 0; i < list.length; i++) {
    var room = list[i];

    if (
      !room ||
      typeof room !== 'object' ||
      Array.isArray(room) ||
      typeof room.id !== 'string' ||
      !/^custom_[a-z0-9]+$/.test(room.id) ||
      typeof room.name !== 'string' ||
      typeof room.icon !== 'string'
    ) {
      return null;
    }

    var name = room.name.replace(/\s+/g, ' ').trim();
    var nameKey = name.toLowerCase();
    var icon = legacyIcons[room.icon] || room.icon;

    if (
      name.length < 2 ||
      name.length > 20 ||
      icons.indexOf(icon) === -1 ||
      ids[room.id] ||
      names[nameKey] ||
      builtInNames.indexOf(nameKey) !== -1
    ) {
      return null;
    }

    ids[room.id] = true;
    names[nameKey] = true;

    cleaned.push({
      id: room.id,
      name: name,
      icon: icon
    });
  }

  return cleaned;
}

function cleanSavedCustomRooms(list) {
  var result = {
    rooms: [],
    rejected: false
  };

  if (!Array.isArray(list)) {
    result.rejected = true;
    return result;
  }

  var ids = Object.create(null);
  var names = Object.create(null);

  list.forEach(function (room) {
    var cleaned = cleanImportedCustomRooms([room]);

    if (!cleaned) {
      result.rejected = true;
      return;
    }

    var candidate = cleaned[0];
    var nameKey = candidate.name.toLowerCase();

    if (
      ids[candidate.id] ||
      names[nameKey] ||
      result.rooms.length >= 10
    ) {
      result.rejected = true;
      return;
    }

    ids[candidate.id] = true;
    names[nameKey] = true;

    result.rooms.push(candidate);
  });

  return result;
}

function hasStoredCopy(prefix, rawData) {
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);

      if (
        key &&
        key.indexOf(prefix) === 0 &&
        localStorage.getItem(key) === rawData
      ) {
        return true;
      }
    }
  } catch (e) {
    return null;
  }


  return false;
}

function preserveCorruptCopy(rawData) {
  var prefix = KEY + '.corrupt.';

  if (hasStoredCopy(prefix, rawData) === true) {
    return true;
  }

  var base = prefix + Date.now();
  var key = base;
  var suffix = 1;

  try {
    while (localStorage.getItem(key) !== null) {
      key = base + '.' + suffix;
      suffix++;
    }

    localStorage.setItem(key, rawData);

    return localStorage.getItem(key) === rawData;
  } catch (e) {
    return false;
  }
}

function recoveryCopyKey(rawData) {
  var prefix = KEY + '.recovery.';

  try {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);

      if (
        key &&
        key.indexOf(prefix) === 0 &&
        localStorage.getItem(key) === rawData
      ) {
        return key;
      }
    }
  } catch (e) {
    return undefined;
  }

  return null;
}

function pruneRecoveryCopies(protectedKey) {
  var prefix = KEY + '.recovery.';
  var copies = [];

  try {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);

      if (!key || key.indexOf(prefix) !== 0) continue;

      var suffix = key.slice(prefix.length);
      var match = suffix.match(/^(\d+)(?:\.(\d+))?$/);

      if (!match) continue;

      copies.push({
        key: key,
        timestamp: Number(match[1]),
        sequence: match[2] ? Number(match[2]) : 0
      });
    }
  } catch (e) {
    return false;
  }

  copies.sort(function (a, b) {
    if (a.timestamp !== b.timestamp) {
      return b.timestamp - a.timestamp;
    }

    if (a.sequence !== b.sequence) {
      return b.sequence - a.sequence;
    }

    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });

  var keep = Object.create(null);

  copies.slice(0, 20).forEach(function (copy) {
    keep[copy.key] = true;
  });

  keep[protectedKey] = true;

  for (var j = 0; j < copies.length; j++) {
    var candidate = copies[j];

    if (keep[candidate.key]) continue;

    try {
      localStorage.removeItem(candidate.key);

      if (localStorage.getItem(candidate.key) !== null) {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  return true;
}

function preserveRecoveryCopy(rawData) {
  var existingKey = recoveryCopyKey(rawData);
  var inventoryAvailable = existingKey !== undefined;
  var recoveryKey = existingKey;

  if (existingKey === undefined || existingKey === null) {
    var prefix = KEY + '.recovery.';
    var base = prefix + Date.now();
    recoveryKey = base;
    var suffix = 1;

    try {
      while (localStorage.getItem(recoveryKey) !== null) {
        recoveryKey = base + '.' + suffix;
        suffix++;
      }

      localStorage.setItem(recoveryKey, rawData);

      if (localStorage.getItem(recoveryKey) !== rawData) {
        return false;
      }
    } catch (e) {
      return false;
    }
  } else {
    try {
      if (localStorage.getItem(recoveryKey) !== rawData) {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  if (inventoryAvailable) {
    pruneRecoveryCopies(recoveryKey);
  }

  return true;
}

function load() {
  lastKnownRaw = null;
  saveError = null;

  data = {
    schemaVersion: SCHEMA_VERSION,
    entries: [],
    learned: {},
    customRooms: [],
    ask: { aliases: [], boosts: Object.create(null), unanswered: [] }
  };

  var raw = null;

  try {
    raw = localStorage.getItem(KEY);
  } catch (e) {
    data.storageUnavailable = true;
    saveError = 'storage';
    return data;
  }

  lastKnownRaw = raw;

  try {
    if (raw !== null) {
      var p = JSON.parse(raw);
      var storedVersion = p &&
        Object.prototype.hasOwnProperty.call(p, 'schemaVersion')
          ? p.schemaVersion
          : 0;

      if (
        typeof storedVersion !== 'number' ||
        !isFinite(storedVersion) ||
        Math.floor(storedVersion) !== storedVersion ||
        storedVersion < 0 ||
        storedVersion > SCHEMA_VERSION
      ) {
        throw new Error('unsupported schema version');
      }

      if (p && Array.isArray(p.entries)) {
        data.schemaVersion = SCHEMA_VERSION;
        var cleanedEntries = cleanEntries(normaliseLegacyAmounts(p.entries));

        if (cleanedEntries.length < p.entries.length) {
          data.rejectedEntries = p.entries.length - cleanedEntries.length;
          data.recoveryCopySaved = preserveRecoveryCopy(raw);
          data.recoveryBlocked = !data.recoveryCopySaved;
        }

        data.entries = cleanedEntries;

        var cleanedLearned = cleanLegacyLearned(p.learned);

        if (
          Object.prototype.hasOwnProperty.call(p, 'learned') &&
          stableJSON(cleanedLearned) !== stableJSON(p.learned)
        ) {
          data.rejectedLearned = true;

          var learnedRecoverySaved = preserveRecoveryCopy(raw);

          data.recoveryCopySaved =
            data.recoveryCopySaved === true || learnedRecoverySaved;

          data.recoveryBlocked =
            data.recoveryBlocked || !learnedRecoverySaved;
        }

        data.learned = cleanedLearned;

        var hasCustomRooms = Object.prototype.hasOwnProperty.call(
          p,
          'customRooms'
        );

        var storedCustomRooms = hasCustomRooms
          ? p.customRooms
          : [];

        var cleanedSavedRooms = cleanSavedCustomRooms(
          storedCustomRooms
        );

        data.customRooms = cleanedSavedRooms.rooms;

        if (cleanedSavedRooms.rejected) {
          data.rejectedCustomRooms = true;

          var customRoomsRecoverySaved = preserveRecoveryCopy(raw);

          data.recoveryCopySaved = customRoomsRecoverySaved;
          data.recoveryBlocked = data.recoveryBlocked ||
            !customRoomsRecoverySaved;
        }

        var cleanedAsk = cleanAsk(p.ask);

        if (
          Object.prototype.hasOwnProperty.call(p, 'ask') &&
          stableJSON(cleanedAsk) !== stableJSON(p.ask)
        ) {
          data.rejectedAsk = true;

          var askRecoverySaved = preserveRecoveryCopy(raw);

          data.recoveryCopySaved =
            data.recoveryCopySaved === true || askRecoverySaved;

          data.recoveryBlocked =
            data.recoveryBlocked || !askRecoverySaved;
        }

        data.ask = cleanedAsk;
      } else {
        throw new Error('unexpected shape');
      }
    }

  } catch (e) {
    if (raw !== null) {
      data.corruptCopySaved = preserveCorruptCopy(raw);
      data.corrupt = true;
    }
  }

  return data;
}

  function preserveCurrentRecoveryCopy() {
    var currentRaw;

    saveError = null;

    if (writeMode === 'readonly') {
      saveError = 'readonly';
      return false;
    }

    if (data.storageUnavailable) {
      saveError = 'storage';
      return false;
    }

    if (data.corrupt) {
      saveError = 'corrupt';
      return false;
    }

    if (data.recoveryBlocked) {
      saveError = 'recovery';
      return false;
    }

    try {
      currentRaw = localStorage.getItem(KEY);
    } catch (e) {
      saveError = 'storage';
      return false;
    }

    if (currentRaw !== lastKnownRaw) {
      saveError = 'conflict';
      return false;
    }

    if (currentRaw === null) {
      return true;
    }

    if (!preserveRecoveryCopy(currentRaw)) {
      saveError = 'recovery';
      return false;
    }

    return true;
  }
  
  function save() {
    var currentRaw;
    var nextRaw;

    saveError = null;

    if (writeMode === 'readonly') {
      saveError = 'readonly';
      return false;
    }

    if (data.storageUnavailable) {
      saveError = 'storage';
      return false;
    }

    if (data.corrupt) {
      saveError = 'corrupt';
      return false;
    }

    if (data.recoveryBlocked) {
      saveError = 'recovery';
      return false;
    }

    try {
      currentRaw = localStorage.getItem(KEY);
    } catch (e) {
      saveError = 'storage';
      return false;
    }

    if (currentRaw !== lastKnownRaw) {
      saveError = 'conflict';
      return false;
    }

    try {
      nextRaw = JSON.stringify(data);
      localStorage.setItem(KEY, nextRaw);

      if (localStorage.getItem(KEY) !== nextRaw) {
        try {
          if (currentRaw === null) {
            localStorage.removeItem(KEY);
          } else {
            localStorage.setItem(KEY, currentRaw);
          }
        } catch (restoreError) {}

        saveError = 'storage';
        return false;
      }

      lastKnownRaw = nextRaw;
      return true;
    } catch (e) {
      try {
        if (currentRaw === null) {
          localStorage.removeItem(KEY);
        } else {
          localStorage.setItem(KEY, currentRaw);
        }
      } catch (restoreError) {}

      saveError = 'storage';
      return false;
    }
  }

  function exportJSON() {
    var currentRaw;

    saveError = null;

    if (data.storageUnavailable) {
      saveError = 'storage';
      throw new Error('Storage is unavailable. Reload Mopapa before creating a backup.');
    }

    if (data.corrupt) {
      saveError = 'corrupt';
      throw new Error('Saved data is unreadable. Export a recovery copy or restore a valid backup instead.');
    }

    try {
      currentRaw = localStorage.getItem(KEY);
    } catch (e) {
      saveError = 'storage';
      throw new Error('Mopapa could not check the saved data. No backup was created.');
    }

    if (currentRaw !== lastKnownRaw) {
      saveError = 'conflict';
      throw new Error('Saved data changed in another tab. Reload Mopapa before creating a backup.');
    }

    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');

    a.href = url;
    a.download = 'mopapa-backup-' + new Date().toISOString().slice(0, 10) + '.json';

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 2000);
  }

  function exportOriginalRecoveryCopy() {
    if (
      (
        !data.recoveryBlocked &&
        !(data.corrupt && !data.corruptCopySaved)
      ) ||
      lastKnownRaw === null
    ) {
      return false;
    }

    try {
      if (localStorage.getItem(KEY) !== lastKnownRaw) {
        return false;
      }
    } catch (e) {
      return false;
    }

    var url;

    try {
      var blob = new Blob(
        [lastKnownRaw],
        { type: 'application/json' }
      );

      url = URL.createObjectURL(blob);

      var a = document.createElement('a');

      a.href = url;
      a.download = 'mopapa-original-unrecovered-' +
        new Date().toISOString().slice(0, 10) + '.json';

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);

      return true;
    } catch (e) {
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch (e2) {}
      }

      return false;
    }
  }

  function recoveryCopies() {
    var copies = [];
    var recoveryPrefix = KEY + '.recovery.';
    var corruptPrefix = KEY + '.corrupt.';

    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key) continue;

        var kind = null;
        var suffix = '';

        if (key.indexOf(recoveryPrefix) === 0) {
          kind = 'recovery';
          suffix = key.slice(recoveryPrefix.length);
        } else if (key.indexOf(corruptPrefix) === 0) {
          kind = 'corrupt';
          suffix = key.slice(corruptPrefix.length);
        }

        if (!kind) continue;

        var match = suffix.match(/^(\d+)(?:\.(\d+))?$/);
        var timestamp = match ? Number(match[1]) : null;
        var sequence = match && match[2]
          ? Number(match[2])
          : 0;

        copies.push({
          key: key,
          kind: kind,
          timestamp: timestamp !== null && isFinite(timestamp)
            ? timestamp
            : null,
          sequence: isFinite(sequence) ? sequence : 0
        });
      }
    } catch (e) {
      return null;
    }

    copies.sort(function (a, b) {
      if (a.timestamp === null && b.timestamp !== null) return 1;
      if (a.timestamp !== null && b.timestamp === null) return -1;

      if (a.timestamp !== b.timestamp) {
        return b.timestamp - a.timestamp;
      }

      if (a.sequence !== b.sequence) {
        return b.sequence - a.sequence;
      }

      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    });

    return copies;
  }

  function exportRecoveryCopy(key) {
    var copies = recoveryCopies();

    if (copies === null) return false;

    if (
      key !== undefined &&
      key !== null &&
      typeof key !== 'string'
    ) {
      return false;
    }

    if (!key) {
      if (!copies.length) return false;
      key = copies[0].key;
    }

    var recoveryPrefix = KEY + '.recovery.';
    var corruptPrefix = KEY + '.corrupt.';
    var isRecovery = key.indexOf(recoveryPrefix) === 0;
    var isCorrupt = key.indexOf(corruptPrefix) === 0;

    if (!isRecovery && !isCorrupt) return false;

    var copy = null;

    for (var i = 0; i < copies.length; i++) {
      if (copies[i].key === key) {
        copy = copies[i];
        break;
      }
    }

    if (!copy) return false;

    var raw;

    try {
      raw = localStorage.getItem(key);
    } catch (e) {
      return false;
    }

    if (raw === null) return false;

    var blob;
    var url;
    var a;

    try {
      var keyPrefix = isCorrupt
        ? corruptPrefix
        : recoveryPrefix;

      var filenameSuffix = key.slice(keyPrefix.length);

      try {
        filenameSuffix = encodeURIComponent(filenameSuffix);
      } catch (e) {
        filenameSuffix = filenameSuffix.replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        );
      }

      if (!filenameSuffix) {
        filenameSuffix = 'unnamed';
      }

      blob = new Blob([raw], { type: 'application/json' });
      url = URL.createObjectURL(blob);
      a = document.createElement('a');

      a.href = url;
      a.download = 'mopapa-' +
        (isCorrupt ? 'corrupt' : 'recovery') +
        '-copy-' + filenameSuffix + '.json';

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);

      return true;
    } catch (e) {
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch (e2) {}
      }

      return false;
    }
  }
  
  function importJSON(file, cb) {
    saveError = null;

    var completed = false;

    if (writeMode === 'readonly') {
      saveError = 'readonly';
      if (typeof cb === 'function') cb(false);
      return;
    }

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

      if (writeMode === 'readonly') {
        saveError = 'readonly';
        finish(false);
        return;
      }

      try {
        var p = JSON.parse(r.result);

        if (p && Array.isArray(p.entries)) {
          p.entries = normaliseLegacyAmounts(p.entries);
        }

        var importedCustomRooms = [];

        if (
          p &&
          Object.prototype.hasOwnProperty.call(p, 'customRooms')
        ) {
          importedCustomRooms = cleanImportedCustomRooms(
            p.customRooms
          );
        }

        if (
          !p ||
          typeof p !== 'object' ||
          Array.isArray(p) ||
          (
            Object.prototype.hasOwnProperty.call(p, 'schemaVersion') &&
            (
              typeof p.schemaVersion !== 'number' ||
              !isFinite(p.schemaVersion) ||
              Math.floor(p.schemaVersion) !== p.schemaVersion ||
              p.schemaVersion < 0 ||
              p.schemaVersion > SCHEMA_VERSION
            )
          ) ||
          !validImportedEntries(p.entries) ||
          (
            Object.prototype.hasOwnProperty.call(p, 'learned') &&
            (
              !p.learned ||
              typeof p.learned !== 'object' ||
              Array.isArray(p.learned) ||
              stableJSON(cleanLegacyLearned(p.learned)) !==
                stableJSON(p.learned)
            )
          ) ||
          (
            Object.prototype.hasOwnProperty.call(p, 'ask') &&
            stableJSON(cleanAsk(p.ask)) !== stableJSON(p.ask)
          ) ||
          !importedCustomRooms
        ) {
          throw new Error('bad file');
        }

        var currentRaw;

        try {
          currentRaw = localStorage.getItem(KEY);
        } catch (e) {
          saveError = 'storage';
          finish(false);
          return;
        }

        if (currentRaw !== lastKnownRaw) {
          saveError = 'conflict';
          finish(false);
          return;
        }

        if (
          currentRaw !== null &&
          !preserveRecoveryCopy(currentRaw)
        ) {
          saveError = 'recovery';
          finish(false);
          return;
        }

        var previous = data;

        data = {
          schemaVersion: SCHEMA_VERSION,
          entries: cleanEntries(normaliseLegacyAmounts(p.entries)),
          learned: cleanLegacyLearned(p.learned),
          customRooms: importedCustomRooms,
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
    load: load,
    save: save,
    preserveCurrentRecoveryCopy: preserveCurrentRecoveryCopy,
    saveError: function () { return saveError; },
    setWriteMode: setWriteMode,
    writeMode: getWriteMode,
    storagePersistenceStatus: storagePersistenceStatus,
    requestStoragePersistence: requestStoragePersistence,
    exportJSON: exportJSON,
    exportOriginalRecoveryCopy: exportOriginalRecoveryCopy,
    recoveryCopies: recoveryCopies,
    exportRecoveryCopy: exportRecoveryCopy,
    importJSON: importJSON
  };
})();
