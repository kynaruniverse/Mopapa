var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.tagExplorerUI = (function () {
  var root, status, tagList, resultsList;
  var selectedTag = '';
  var MAX_RESULTS = 30;

  function init() {
    root = document.getElementById('tag-explorer-panel');
    status = document.getElementById('tag-explorer-status');
    tagList = document.getElementById('tag-explorer-tags');
    resultsList = document.getElementById('tag-explorer-results');
    if (!root || !status || !tagList || !resultsList) return;
    render();
  }

  function render() {
    if (!root || !status || !tagList || !resultsList) return;
    tagList.textContent = '';
    resultsList.textContent = '';

    var summary = Mopapa.entries.tagSummary();
    if (!summary.length) {
      selectedTag = '';
      root.hidden = true;
      return;
    }
    root.hidden = false;

    var selectedExists = summary.some(function (item) {
      return item.tag.toLowerCase() === selectedTag.toLowerCase();
    });
    if (selectedTag && !selectedExists) selectedTag = '';

    summary.forEach(function (item) {
      var li = document.createElement('li');
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'tag-explorer-chip' +
        (selectedTag.toLowerCase() === item.tag.toLowerCase() ? ' selected' : '');
      button.textContent = '#' + item.tag + ' (' + item.count + ')';
      button.setAttribute('aria-pressed',
        selectedTag.toLowerCase() === item.tag.toLowerCase() ? 'true' : 'false');
      button.addEventListener('click', function () {
        selectedTag = selectedTag.toLowerCase() === item.tag.toLowerCase() ? '' : item.tag;
        render();
      });
      li.appendChild(button);
      tagList.appendChild(li);
    });

    if (!selectedTag) {
      status.textContent = 'Choose a tag to browse matching memories across your rooms.';
      resultsList.hidden = true;
      return;
    }

    var entries = Mopapa.entries.byTag(selectedTag);
    status.textContent = entries.length === 1
      ? '1 memory tagged #' + selectedTag + '.'
      : entries.length + ' memories tagged #' + selectedTag + '.';

    var shown = entries.slice(0, MAX_RESULTS);
    shown.forEach(function (entry) {
      var room = Mopapa.roomById(entry.room);
      var li = document.createElement('li');
      li.className = 'tag-explorer-result';

      var body = document.createElement('div');
      body.className = 'tag-explorer-result-body';
      var text = document.createElement('p');
      text.className = 'tag-explorer-result-text';
      text.textContent = entry.text;
      body.appendChild(text);

      var meta = document.createElement('p');
      meta.className = 'tag-explorer-result-meta';
      var parts = [room ? room.name : 'Saved entry'];
      var created = new Date(entry.created);
      if (!isNaN(created.getTime())) parts.push('saved ' + created.toLocaleDateString());
      meta.textContent = parts.join(', ');
      body.appendChild(meta);
      li.appendChild(body);

      var openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'tag-explorer-open';
      openButton.textContent = 'Open';
      openButton.addEventListener('click', function () {
        if (Mopapa.room && Mopapa.room.open) Mopapa.room.open(entry.room);
      });
      li.appendChild(openButton);
      resultsList.appendChild(li);
    });

    resultsList.hidden = !shown.length;
    if (entries.length > MAX_RESULTS) {
      status.textContent += ' Showing the newest ' + MAX_RESULTS + '.';
    }
  }

  return { init: init, render: render };
})();
