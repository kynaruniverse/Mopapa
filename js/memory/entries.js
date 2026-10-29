var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.entries = (function () {
  function list() { return Mopapa.store.data().entries; }

  function find(id) {
    var l = list();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }
  
  function cleanTags(value) {
    var input = Array.isArray(value) ? value : String(value || '').split(',');
    var tags = [], seen = Object.create(null);
    input.forEach(function (raw) {
      var tag = String(raw || '').replace(/\s+/g, ' ').trim();
      if (!tag) return;
      tag = tag.slice(0, 24);
      var key = tag.toLowerCase();
      if (seen[key] || tags.length >= 8) return;
      seen[key] = true;
      tags.push(tag);
    });
    return tags;
  }

  function setTags(id, value) {
    var e = find(id);
    if (!e) return false;
    var previous = Array.isArray(e.tags) ? e.tags.slice() : [];
    e.tags = cleanTags(value);
    if (Mopapa.store.save()) return true;
    e.tags = previous;
    return false;
  }
  function tagSummary() {
    var groups = Object.create(null);
    list().forEach(function (entry) {
      if (!entry || !Array.isArray(entry.tags)) return;
      var countedForEntry = Object.create(null);
      entry.tags.forEach(function (value) {
        var tag = String(value || '').replace(/\s+/g, ' ').trim();
        if (!tag) return;
        var key = tag.toLowerCase();
        if (countedForEntry[key]) return;
        countedForEntry[key] = true;
        if (!groups[key]) groups[key] = { tag: tag, count: 0 };
        groups[key].count += 1;
      });
    });
    return Object.keys(groups).map(function (key) { return groups[key]; })
      .sort(function (a, b) { return a.tag.localeCompare(b.tag); });
  }

  function byTag(value) {
    var key = String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!key) return [];
    return list().filter(function (entry) {
      return entry && Array.isArray(entry.tags) && entry.tags.some(function (tag) {
        return String(tag || '').replace(/\s+/g, ' ').trim().toLowerCase() === key;
      });
    }).sort(function (a, b) {
      return new Date(b.created) - new Date(a.created);
    });
  }

  // Structure saved with each entry: where something is, and any £ amounts.
  function analyse(text) {
    var info = Mopapa.rules && Mopapa.rules.extract
      ? Mopapa.rules.extract(text)
      : { fact: null, amounts: [] };
    return { fact: info.fact || null, amounts: info.amounts || [] };
  }

  function add(o) {
    var info = analyse(o.text);
    var e = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: o.text,
      room: o.room,
      when: o.when || null,
      hasTime: !!o.hasTime,
      amount: info.amounts.length ? info.amounts[0] : null,
      fact: info.fact,
      amounts: info.amounts.length ? info.amounts : null,
      created: new Date().toISOString(),
      done: false
    };
    list().unshift(e);
    if (Mopapa.store.save()) return { entry: e, saved: true };

    // Do not show an unsaved entry as safely stored. The caller keeps the text for recovery.
    var current = list();
    var index = current.indexOf(e);
    if (index !== -1) current.splice(index, 1);
    return { entry: e, saved: false };
  }
  

  function sourceChoicesSnapshot() {
    var data = Mopapa.store.data();
    var ask = data && data.ask;
    return ask && ask.boosts ? JSON.stringify(ask.boosts) : null;
  }

  function removeSourceChoices(id) {
    var data = Mopapa.store.data();
    var ask = data && data.ask;
    if (!ask || !ask.boosts) return;

    Object.keys(ask.boosts).forEach(function (sig) {
      var bucket = ask.boosts[sig];
      if (!bucket || typeof bucket !== 'object') return;

      delete bucket[id];

      if (!Object.keys(bucket).length) {
        delete ask.boosts[sig];
      }
    });
  }

  function restoreSourceChoices(snapshot) {
    if (snapshot === null) return;

    var data = Mopapa.store.data();
    if (data && data.ask) {
      var restored = JSON.parse(snapshot);
      var boosts = Object.create(null);

      Object.keys(restored).forEach(function (sig) {
        var bucket = restored[sig];
        if (!bucket || typeof bucket !== 'object') return;

        var clean = Object.create(null);

        Object.keys(bucket).forEach(function (id) {
          var count = bucket[id];

          if (
            typeof count === 'number' &&
            isFinite(count) &&
            count > 0
          ) {
            clean[id] = Math.min(Math.floor(count), 1000);
          }
        });

        boosts[sig] = clean;
      });

      data.ask.boosts = boosts;
    }
  }

  function updateText(id, value) {
    var e = find(id);
    if (!e) return false;

    var nextText = String(value == null ? '' : value).trim();
    if (!nextText || nextText.length > 1000) return false;

    var previousText = e.text;
    var previousFact = e.fact;
    var previousAmounts = e.amounts;
    var previousAmount = e.amount;
    var previousChoices = sourceChoicesSnapshot();
    var info = analyse(nextText);

    e.text = nextText;
    e.fact = info.fact;
    e.amounts = info.amounts.length ? info.amounts : null;
    e.amount = info.amounts.length ? info.amounts[0] : null;
    removeSourceChoices(id);

    if (Mopapa.store.save()) return true;

    // Restore the entry and learning data if saving fails.
    e.text = previousText;
    e.fact = previousFact;
    e.amounts = previousAmounts;
    e.amount = previousAmount;
    restoreSourceChoices(previousChoices);
    return false;
  }

  function remove(id) {
    var l = list();

    for (var i = 0; i < l.length; i++) {
      if (l[i].id === id) {
        var previousChoices = sourceChoicesSnapshot();
        var removed = l.splice(i, 1)[0];

        removeSourceChoices(id);

        if (Mopapa.store.save()) return true;

        l.splice(i, 0, removed);
        restoreSourceChoices(previousChoices);
        return false;
      }
    }

    return false;
  }

  function toggleDone(id) {
    var e = find(id);
    if (!e) return false;
    var previous = !!e.done;
    e.done = !previous;
    if (Mopapa.store.save()) return true;
    e.done = previous;
    return false;
  }
  
  function togglePinned(id) {
    var e = find(id);
    if (!e) return null;

    var previous = !!e.pinned;
    e.pinned = !previous;
    if (Mopapa.store.save()) return e.pinned;

    // Revert in memory if saving failed; never pretend it was pinned.
    e.pinned = previous;
    return null;
  }

  function pinned() {
    return list().filter(function (e) { return !!e.pinned; })
      .sort(function (a, b) {
        return a.created < b.created ? 1 : (a.created > b.created ? -1 : 0);
      });
  }

  function move(id, room) {
    var e = find(id);
    if (!e) return false;

    var targetRoom = Mopapa.rooms.filter(function (item) {
      return item.id === room;
    })[0];

    if (!targetRoom) return false;

    var previous = {
      room: e.room,
      done: e.done,
      when: e.when,
      hasTime: e.hasTime
    };

    e.room = room;

    if (!targetRoom.dated) {
      e.done = false;
      e.when = null;
      e.hasTime = false;
    }

    if (Mopapa.store.save()) return true;

    e.room = previous.room;
    e.done = previous.done;
    e.when = previous.when;
    e.hasTime = previous.hasTime;

    return false;
  }

  function count(room) {
    return list().filter(function (e) { return e.room === room && !e.done; }).length;
  }

  function byRoom(room) {
    var l = list().filter(function (e) { return e.room === room; });
    l.sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.when && b.when) return new Date(a.when) - new Date(b.when);
      if (a.when) return -1;
      if (b.when) return 1;
      return a.created < b.created ? 1 : (a.created > b.created ? -1 : 0);
    });
    return l;
  }

  return { add: add, updateText: updateText, remove: remove, toggleDone: toggleDone, togglePinned: togglePinned, pinned: pinned, setTags: setTags, tagSummary: tagSummary, byTag: byTag, move: move, count: count, byRoom: byRoom };
})();
