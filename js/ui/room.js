var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.room = (function () {
  var current = null;
  var editingId = null;
  var homeY = 0;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function init() {
    $('back').addEventListener('click', function () {
      if (history.state && history.state.room) history.back(); else close();
    });
    window.addEventListener('popstate', function () { if (current !== null) close(); });
    renderRooms();
  }

  function renderRooms() {
    var grid = $('rooms');
    grid.innerHTML = '';
    Mopapa.rooms.forEach(function (r) {
      var b = el('button', 'room-card');
      b.type = 'button';
      var ic = el('span', 'room-icon');
      ic.innerHTML = Mopapa.icon(r.icon);
      b.appendChild(ic);
      b.appendChild(el('span', 'room-name', r.name));
      b.appendChild(el('span', 'room-count', String(Mopapa.entries.count(r.id))));
      b.addEventListener('click', function () { open(r.id); });
      grid.appendChild(b);
    });
  }

  function open(id) {
    homeY = window.scrollY;
    current = id;
    try { history.pushState({ room: id }, ''); } catch (err) {}
    var r = Mopapa.roomById(id);
    $('room-title').textContent = r.name;
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
    window.scrollTo(0, homeY);
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

      if (editingId === e.id) {
        li.appendChild(el('p', 'edit-help', 'Edit the text only. Its room, date, amount and logged date will stay the same.'));

        var editForm = document.createElement('form');
        editForm.className = 'entry-edit';
        var label = document.createElement('label');
        var textarea = document.createElement('textarea');
        var textareaId = 'edit-text-' + e.id;
        label.setAttribute('for', textareaId);
        label.textContent = 'Saved entry';
        textarea.id = textareaId;
        textarea.name = 'text';
        textarea.rows = 4;
        textarea.maxLength = 1000;
        textarea.required = true;
        textarea.value = e.text;
        editForm.appendChild(label);
        editForm.appendChild(textarea);

        var status = el('p', 'edit-status', '');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');

        var editActions = el('div', 'edit-actions');
        var saveButton = el('button', 'edit-save', 'Save changes');
        saveButton.type = 'submit';
        var cancelButton = el('button', 'edit-cancel', 'Cancel');
        cancelButton.type = 'button';
        cancelButton.addEventListener('click', function () {
          editingId = null;
          renderList();
        });
        editActions.appendChild(saveButton);
        editActions.appendChild(cancelButton);
        editForm.appendChild(editActions);
        editForm.appendChild(status);

        editForm.addEventListener('submit', function (event) {
          event.preventDefault();
          var newText = textarea.value.trim();
          if (!newText) {
            status.textContent = 'Please enter some text before saving.';
            textarea.focus();
            return;
          }
          if (newText.length > 1000) {
            status.textContent = 'Keep the entry to 1,000 characters or fewer.';
            textarea.focus();
            return;
          }
          if (!Mopapa.entries.updateText(e.id, newText)) {
            status.textContent = 'Mopapa could not save that change on this device. Your original entry is unchanged.';
            return;
          }
          editingId = null;
          renderList();
          Mopapa.refreshPanels();
          Mopapa.pet.say('Saved your correction.');
          if (Mopapa.pet.react) Mopapa.pet.react('helpful');
        });

        textarea.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            event.preventDefault();
            editingId = null;
            renderList();
          } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            saveButton.click();
          }
        });

        li.appendChild(editForm);
        ul.appendChild(li);
        textarea.focus();
        return;
      }

      li.appendChild(el('div', 'entry-text' + (e.done ? ' done' : ''), e.text));
      if (Array.isArray(e.tags) && e.tags.length) {
        var tagList = el('div', 'entry-tags');
        e.tags.forEach(function (tag) {
          tagList.appendChild(el('span', 'entry-tag', '#' + tag));
        });
        li.appendChild(tagList);
      }

      var meta = el('div', 'entry-meta');
      if (e.when) {
        var w = el('span', Mopapa.rules.isPast(e.when, e.hasTime) && !e.done ? 'overdue' : '',
          Mopapa.rules.describe(new Date(e.when), e.hasTime));
        meta.appendChild(w);
      }
      if (e.amount) {
        if (meta.childNodes.length) meta.appendChild(document.createTextNode(', '));
        meta.appendChild(el(
          'span',
          '',
          typeof e.amount === 'number'
            ? Mopapa.askParts.moneyFormat.formatMoney(e.amount)
            : e.amount
        ));
      }
      if (meta.childNodes.length) li.appendChild(meta);

      var actions = el('div', 'entry-actions');
      if (Mopapa.roomById(current).dated) {
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = e.done;
        cb.setAttribute('aria-label', 'Done');
        cb.addEventListener('change', function () {
          if (!Mopapa.entries.toggleDone(e.id)) {
            Mopapa.pet.say('I could not save that change on this device. Your to-do is still open.');
            renderList();
            return;
          }
          Mopapa.refreshPanels();
          renderList();
        });
        var doneLabel = el('label', 'done-toggle');
          doneLabel.appendChild(cb);
          doneLabel.appendChild(document.createTextNode('Done'));
          actions.appendChild(doneLabel);
      }

      var sel = document.createElement('select');
      sel.setAttribute('aria-label', 'Move to another room');
      Mopapa.rooms.forEach(function (r) {
        var o = document.createElement('option');
        o.value = r.id;
        o.textContent = r.name;
        if (r.id === e.room) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        if (!Mopapa.entries.move(e.id, sel.value)) {
          Mopapa.pet.say('I could not save that move on this device. The entry stayed in its room.');
          renderList();
          return;
        }
        Mopapa.refreshPanels();
        renderList();
      });
      actions.appendChild(sel);

      var pin = el('button', 'link pin-entry', e.pinned ? 'Pinned' : 'Pin');
      pin.type = 'button';
      pin.setAttribute('aria-pressed', e.pinned ? 'true' : 'false');
      pin.setAttribute('aria-label', e.pinned ? 'Unpin saved memory' : 'Pin saved memory');
      pin.addEventListener('click', function () {
        var result = Mopapa.entries.togglePinned(e.id);
        if (result === null) {
          Mopapa.pet.say('I could not save that change on this device.');
          return;
        }
        Mopapa.refreshPanels();
        renderList();
      });
      actions.appendChild(pin);

      var edit = el('button', 'link edit-entry', 'Edit');
      edit.type = 'button';
      edit.setAttribute('aria-label', 'Edit saved entry');
      edit.addEventListener('click', function () {
        editingId = e.id;
        renderList();
      });
      actions.appendChild(edit);
      var tagButton = el('button', 'link tag-entry', 'Tags');
      tagButton.type = 'button';
      tagButton.setAttribute('aria-label', 'Edit tags for saved memory');
      tagButton.addEventListener('click', function () {
        var currentTags = Array.isArray(e.tags) ? e.tags.join(', ') : '';
        Mopapa.dialog.prompt('Tags, separated by commas. Up to 8 tags, 24 characters each. Clear the field to remove all tags.', currentTags, 'Save tags', function(entered) {
          if (!Mopapa.entries.setTags(e.id, entered)) {
            Mopapa.pet.say('I could not save those tags on this device. Your original tags are unchanged.');
            return;
          }
          renderList();
          Mopapa.refreshPanels();
          Mopapa.pet.say(e.tags.length ? 'Tags saved.' : 'Tags cleared.');
        });
      });
      actions.appendChild(tagButton);

      var del = el('button', 'link del', 'Delete');
      del.type = 'button';
      del.addEventListener('click', function () {
        Mopapa.dialog.confirm('Delete this entry? This cannot be undone.', 'Delete', function() {
          if (!Mopapa.entries.remove(e.id)) {
            Mopapa.pet.say('I could not delete that entry on this device. It is still saved.');
            return;
          }
          Mopapa.refreshPanels();
          renderList();
        }, true);
      });
      actions.appendChild(del);
      li.appendChild(actions);
      ul.appendChild(li);
    });
  }


  return { init: init, open: open, renderRooms: renderRooms };
})();
