var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askLearningUI = (function () {
  var root, aliasList, missList, status, clearMisses, clearTaps;

  function init() {
    root = document.getElementById('ask-learning');
    aliasList = document.getElementById('ask-learning-aliases');
    missList = document.getElementById('ask-learning-misses');
    status = document.getElementById('ask-learning-status');
    clearMisses = document.getElementById('ask-learning-clear-misses');
    clearTaps = document.getElementById('ask-learning-clear-taps');

    if (!root || !aliasList || !missList || !status || !clearMisses || !clearTaps) {
      root = null;
      return;
    }

    clearMisses.addEventListener('click', function () {
      status.textContent = Mopapa.ask.clearUnanswered()
        ? 'Cleared the list.'
        : "I couldn't clear that.";
      render();
    });

    clearTaps.addEventListener('click', function () {
      status.textContent = Mopapa.ask.clearConfirmed()
        ? 'Forgot the sources you tapped.'
        : "I couldn't clear that.";
      render();
    });

    render();
  }

  function row(text, onRemove) {
    var li = document.createElement('li');
    var span = document.createElement('span');

    span.textContent = text;
    li.appendChild(span);

    if (onRemove) {
      var button = document.createElement('button');

      button.type = 'button';
      button.className = 'link';
      button.textContent = 'Remove';
      button.addEventListener('click', onRemove);
      li.appendChild(button);
    }

    return li;
  }

  function render() {
    if (!root) return;

    var l = Mopapa.ask.learned();

    aliasList.innerHTML = '';
    missList.innerHTML = '';

    if (!l.aliases.length) {
      aliasList.appendChild(row('None yet. Try typing: by GP I mean doctor'));
    }

    l.aliases.forEach(function (p) {
      aliasList.appendChild(row('“' + p[0] + '” = “' + p[1] + '”', function () {
        status.textContent = Mopapa.ask.forgetAlias(p[0], p[1])
          ? 'Removed.'
          : "I couldn't remove that.";
        render();
      }));
    });

    if (!l.unanswered.length) {
      missList.appendChild(row('None. Questions I can’t answer will appear here.'));
    }

    l.unanswered.forEach(function (u) {
      missList.appendChild(row(u.q));
    });

    clearMisses.hidden = !l.unanswered.length;
    clearTaps.hidden = !l.taps;
  }

  return { init: init, render: render };
})();