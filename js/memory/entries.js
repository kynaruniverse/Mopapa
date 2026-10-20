var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.entries = (function () {
  function list() { return Mopapa.store.data().entries; }

  function find(id) {
    var l = list();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
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

  function remove(id) {
    var l = list();
    for (var i = 0; i < l.length; i++) {
      if (l[i].id === id) { l.splice(i, 1); break; }
    }
    Mopapa.store.save();
  }

  function toggleDone(id) {
    var e = find(id);
    if (e) { e.done = !e.done; Mopapa.store.save(); }
  }

  function move(id, room) {
    var e = find(id);
    if (e) { e.room = room; Mopapa.store.save(); }
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

  return { add: add, remove: remove, toggleDone: toggleDone, move: move, count: count, byRoom: byRoom };
})();