var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.keepsakesUI = (function () {
  var root, list, status;
  var MAX_SHOWN = 30;

  function init() {
    root = document.getElementById('keepsakes-panel');
    list = document.getElementById('keepsakes-list');
    status = document.getElementById('keepsakes-status');
    if (!root || !list || !status) return;
    render();
  }

  function render() {
    if (!root || !list || !status) return;
    list.textContent = '';
    var entries = Mopapa.entries.pinned();
    if (!entries.length) {
      root.hidden = true;
      return;
    }

    root.hidden = false;
    var shown = entries.slice(0, MAX_SHOWN);
    status.textContent = entries.length === 1
      ? '1 pinned entry.'
      : entries.length + ' pinned entries.';

    shown.forEach(function (entry) {
      var room = Mopapa.roomById(entry.room);
      var item = document.createElement('li');
      item.className = 'keepsake-item';

      var body = document.createElement('div');
      body.className = 'keepsake-body';
      var text = document.createElement('p');
      text.className = 'keepsake-text';
      text.textContent = entry.text;
      body.appendChild(text);

      var meta = document.createElement('p');
      meta.className = 'keepsake-meta';
      var parts = [room ? room.name : 'Saved entry'];
      var created = new Date(entry.created);
      if (!isNaN(created.getTime())) parts.push('saved ' + created.toLocaleDateString());
      if (entry.when) parts.push(Mopapa.rules.describe(Mopapa.rules.dateForEntry(entry.when, entry.hasTime), entry.hasTime));
      meta.textContent = parts.join(', ');
      body.appendChild(meta);
      item.appendChild(body);

      var actions = document.createElement('div');
      actions.className = 'keepsake-actions';
      var openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'keepsake-button';
      openButton.textContent = 'Open';
      openButton.addEventListener('click', function () {
        if (Mopapa.room && Mopapa.room.open) {
          Mopapa.room.open(entry.room, entry.id);
        }
      });
      actions.appendChild(openButton);

      var unpinButton = document.createElement('button');
      unpinButton.type = 'button';
      unpinButton.className = 'keepsake-button unpin-button';
      unpinButton.textContent = 'Unpin';
      unpinButton.setAttribute('aria-label', 'Unpin saved memory');
      unpinButton.addEventListener('click', function () {
        var result = Mopapa.entries.togglePinned(entry.id);
        if (result === null) {
          if (Mopapa.pet && Mopapa.pet.say) Mopapa.pet.say('I could not save that change on this device.');
          return;
        }
        render();
        if (Mopapa.room && Mopapa.room.renderRooms) Mopapa.room.renderRooms();
      });
      actions.appendChild(unpinButton);
      item.appendChild(actions);
      list.appendChild(item);
    });

    if (entries.length > MAX_SHOWN) {
      var more = document.createElement('li');
      more.className = 'keepsakes-more';
      more.textContent = 'Showing the newest ' + MAX_SHOWN + ' pinned memories.';
      list.appendChild(more);
    }
  }

  return { init: init, render: render };
})();
