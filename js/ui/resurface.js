var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.resurfaceUI = (function () {
  var items = [];
  var index = 0;
  var root, label, text, meta, nextButton, openButton;
  var initialized = false;

  function init() {
    root = document.getElementById('memory-shelf');
    label = document.getElementById('memory-shelf-label');
    text = document.getElementById('memory-shelf-text');
    meta = document.getElementById('memory-shelf-meta');
    nextButton = document.getElementById('memory-shelf-next');
    openButton = document.getElementById('memory-shelf-open');
    if (!root || !label || !text || !meta || !nextButton || !openButton) return;

    if (!initialized) {
      nextButton.addEventListener('click', function () {
        if (!items.length) return;
        index = (index + 1) % items.length;
        render();
      });
      openButton.addEventListener('click', function () {
        var item = items[index];
        if (item && Mopapa.room && Mopapa.room.open) Mopapa.room.open(item.entry.room);
      });
      initialized = true;
    }
    refresh();
  }

  function refresh() {
    if (!root || !label || !text || !meta || !nextButton || !openButton) return;
    var previousId = items[index] && items[index].entry.id;
    items = Mopapa.resurface.getToday(new Date());
    index = 0;
    if (previousId) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].entry.id === previousId) { index = i; break; }
      }
    }
    if (!items.length) {
      root.hidden = true;
      return;
    }
    render();
  }

  function render() {
    if (!items.length) return;
    var item = items[index];
    var room = Mopapa.roomById(item.entry.room);
    label.textContent = item.label;
    text.textContent = item.entry.text;

    var parts = [room ? room.icon + ' ' + room.name : 'Saved memory'];
    var created = new Date(item.entry.created);
    if (!isNaN(created.getTime())) parts.push('saved ' + created.toLocaleDateString());
    meta.textContent = parts.join(' · ');

    nextButton.hidden = items.length < 2;
    nextButton.textContent = items.length > 1 ? 'Another memory (' + (index + 1) + '/' + items.length + ')' : 'Another memory';
    root.hidden = false;
  }

  return { init: init, refresh: refresh };
})();
