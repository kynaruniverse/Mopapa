var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.searchUI = (function () {
  var form, input, clearButton, status, resultsList;
  var MAX_RESULTS = 10;

  function init() {
    form = document.getElementById('memory-search-form');
    input = document.getElementById('memory-search-input');
    clearButton = document.getElementById('memory-search-clear');
    status = document.getElementById('memory-search-status');
    resultsList = document.getElementById('memory-search-results');
    if (!form || !input || !clearButton || !status || !resultsList) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      runSearch();
    });
    clearButton.addEventListener('click', function () {
      input.value = '';
      resultsList.innerHTML = '';
      resultsList.hidden = true;
      status.textContent = 'Search looks through every room on this device.';
      input.focus();
    });
  }

  function runSearch() {
    var query = input.value.trim();
    var found = Mopapa.search.find(query);
    resultsList.innerHTML = '';

    if (found.tooShort) {
      resultsList.hidden = true;
      status.textContent = 'Enter at least one meaningful word to search.';
      input.focus();
      return;
    }
    if (!found.total) {
      resultsList.hidden = true;
      status.textContent = 'No saved entries matched. Try fewer words or check the spelling.';
      return;
    }

    var shown = found.results.slice(0, MAX_RESULTS);
    shown.forEach(function (result) {
      var entry = result.entry;
      var item = document.createElement('li');
      item.className = 'memory-search-result';

      var body = document.createElement('div');
      body.className = 'memory-search-result-body';
      var text = document.createElement('p');
      text.className = 'memory-search-result-text';
      text.textContent = entry.text;
      body.appendChild(text);

      var meta = document.createElement('p');
      meta.className = 'memory-search-result-meta';
      var parts = [result.room ? result.room.name : 'Saved entry'];
      var created = new Date(entry.created);
      if (!isNaN(created.getTime())) parts.push('saved ' + created.toLocaleDateString());
      if (entry.when) parts.push('for ' + Mopapa.rules.describe(new Date(entry.when), entry.hasTime));
      meta.textContent = parts.join(', ');
      body.appendChild(meta);
      item.appendChild(body);

      var openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'memory-search-open';
      openButton.textContent = 'Open';
      openButton.addEventListener('click', function () {
        if (Mopapa.room && Mopapa.room.open) Mopapa.room.open(entry.room);
      });
      item.appendChild(openButton);
      resultsList.appendChild(item);
    });

    resultsList.hidden = false;
    status.textContent = found.total === 1
      ? 'Found 1 saved entry.'
      : 'Found ' + found.total + ' saved entries.' + (found.total > MAX_RESULTS ? ' Showing the best ' + MAX_RESULTS + '.' : '');
  }

  function refresh() {
    if (input && input.value.trim()) runSearch();
  }

  return { init: init, refresh: refresh };
})();
