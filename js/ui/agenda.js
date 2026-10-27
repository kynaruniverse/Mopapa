var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.agendaUI = (function () {
  var panel, status, list;

  function init() {
    panel = document.getElementById('agenda-panel');
    status = document.getElementById('agenda-status');
    list = document.getElementById('agenda-list');
    if (!panel || !status || !list) return;
    render();
  }

  function render() {
    if (!panel || !status || !list) return;
    list.textContent = '';
    var items = Mopapa.agenda.getItems(new Date());
    if (!items.length) {
      panel.hidden = true;
      return;
    }

    panel.hidden = false;
    status.textContent = items.length === 1
      ? 'You have 1 saved date to check.'
      : 'You have ' + items.length + ' saved dates to check.';

    items.forEach(function (item) {
      var entry = item.entry;
      var room = Mopapa.roomById(entry.room);
      var li = document.createElement('li');
      li.className = 'agenda-item' + (item.overdue ? ' overdue' : '');

      var top = document.createElement('div');
      top.className = 'agenda-item-top';
      var badge = document.createElement('span');
      badge.className = 'agenda-badge' + (item.overdue ? ' overdue' : '');
      badge.textContent = item.label;
      top.appendChild(badge);
      var when = document.createElement('span');
      when.className = 'agenda-when';
      when.textContent = Mopapa.rules.describe(item.date, entry.hasTime);
      top.appendChild(when);
      li.appendChild(top);

      var text = document.createElement('p');
      text.className = 'agenda-text';
      text.textContent = entry.text;
      li.appendChild(text);

      var meta = document.createElement('p');
      meta.className = 'agenda-meta';
      meta.textContent = room ? room.name : 'Saved entry';
      li.appendChild(meta);

      var actions = document.createElement('div');
      actions.className = 'agenda-actions';
      var openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'agenda-button';
      openButton.textContent = 'Open';
      openButton.addEventListener('click', function () {
        if (Mopapa.room && Mopapa.room.open) Mopapa.room.open(entry.room);
      });
      actions.appendChild(openButton);

      var entryRoom = Mopapa.roomById(entry.room);
      if (entryRoom && entryRoom.dated) {
        var doneButton = document.createElement('button');
        doneButton.type = 'button';
        doneButton.className = 'agenda-button done-button';
        doneButton.textContent = 'Mark done';
        doneButton.addEventListener('click', function () {
          if (!Mopapa.entries.toggleDone(entry.id)) {
            if (Mopapa.pet && Mopapa.pet.say) Mopapa.pet.say('I could not save that change on this device. Your to-do is still open.');
            return;
          }
          if (Mopapa.room && Mopapa.room.renderRooms) Mopapa.room.renderRooms();
          render();
          if (Mopapa.pet && Mopapa.pet.say) Mopapa.pet.say('One less thing to carry. I marked it done.');
          if (Mopapa.pet && Mopapa.pet.react) Mopapa.pet.react('helpful');
        });
        actions.appendChild(doneButton);
      }

      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  return { init: init, render: render };
})();
