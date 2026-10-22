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
    var tags = [], seen = {};
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

  function add(o) {
    var e = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: o.text,
      room: o.room,
      when: o.when || null,
      hasTime: !!o.hasTime,
      amount: o.amount || null,
      created: new Date().toISOString(),
      done: false
    };
    list().unshift(e);
    return { entry: e, saved: Mopapa.store.save() };
  }
  
  function updateText(id, value) {
    var e = find(id);
    if (!e) return false;

    var nextText = String(value == null ? '' : value).trim();
    if (!nextText || nextText.length > 1000) return false;

    var previousText = e.text;
    e.text = nextText;
    if (Mopapa.store.save()) return true;

    // Restore the in-memory value if the device could not save it.
    e.text = previousText;
    return false;
  }

  function remove(id) {
    var l = list();
    for (var i = 0; i < l.length; i++) {
      if (l[i].id === id) {
        var removed = l.splice(i, 1)[0];
        if (Mopapa.store.save()) return true;
        l.splice(i, 0, removed);
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
    var previous = e.room, wasDone = e.done;
    e.room = room;
    if (!Mopapa.roomById(room).dated) e.done = false;
    if (Mopapa.store.save()) return true;
    e.room = previous;
    e.done = wasDone;
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
