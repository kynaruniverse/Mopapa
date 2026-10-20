var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.room = (function () {
  var current = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function init() {
    $('back').addEventListener('click', close);
    renderRooms();
  }

  function renderRooms() {
    var grid = $('rooms');
    grid.innerHTML = '';
    Mopapa.rooms.forEach(function (r) {
      var b = el('button', 'room-card');
      b.type = 'button';
      b.appendChild(el('span', 'room-icon', r.icon));
      b.appendChild(el('span', 'room-name', r.name));
      b.appendChild(el('span', 'room-count', String(Mopapa.entries.count(r.id))));
      b.addEventListener('click', function () { open(r.id); });
      grid.appendChild(b);
    });
  }

  function open(id) {
    current = id;
    var r = Mopapa.roomById(id);
    $('room-title').textContent = r.icon + ' ' + r.name;
    $('screen-home').hidden = true;
    $('screen-room').hidden = false;
    renderList();
    window.scrollTo(0, 0);
  }

  function close() {
    current = null;
    $('screen-room').hidden = true;
    $('screen-home').hidden = false;
    renderRooms();
  }

  function renderList() {
    var ul = $('room-list');
    ul.innerHTML = '';
    var items = Mopapa.entries.byRoom(current);
    if (!items.length) {
      ul.appendChild(el('li', 'empty', 'Nothing in here yet. Tell Mopapa something and it will land here.'));
      return;
    }
    items.forEach(function (e) {
      var li = document.createElement('li');
      li.appendChild(el('div', 'entry-text' + (e.done ? ' done' : ''), e.text));

      var metaBits = [];
      var meta = el('div', 'entry-meta');
      if (e.when) {
        var w = el('span', Mopapa.rules.isPast(e.when, e.hasTime) && !e.done ? 'overdue' : '',
          Mopapa.rules.describe(new Date(e.when), e.hasTime));
        meta.appendChild(w);
      }
      if (e.amount) meta.appendChild(el('span', '', (e.when ? '  ·  ' : '') + e.amount));
      if (meta.childNodes.length) li.appendChild(meta);

      var actions = el('div', 'entry-actions');
      if (current === 'todo') {
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = e.done;
        cb.setAttribute('aria-label', 'Done');
        cb.addEventListener('change', function () { Mopapa.entries.toggleDone(e.id); renderList(); });
        actions.appendChild(cb);
      }
      var sel = document.createElement('select');
      sel.setAttribute('aria-label', 'Move to another room');
      Mopapa.rooms.forEach(function (r) {
        var o = document.createElement('option');
        o.value = r.id;
        o.textContent = r.icon + ' ' + r.name;
        if (r.id === e.room) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        Mopapa.entries.move(e.id, sel.value);
        Mopapa.sorter.learn(e.text, sel.value);
        renderList();
      });
      actions.appendChild(sel);

      var del = el('button', 'link del', 'Delete');
      del.type = 'button';
      del.addEventListener('click', function () {
        if (window.confirm('Delete this entry?')) { Mopapa.entries.remove(e.id); renderList(); }
      });
      actions.appendChild(del);

      li.appendChild(actions);
      ul.appendChild(li);
    });
  }

  return { init: init, renderRooms: renderRooms };
})();