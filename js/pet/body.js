var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.pet = (function () {
  var petEl = null;
  var resetTimer = null;
  var tapLine = 0;
  var tapLines = [
    'That was a lovely little pat.',
    'Hi there! I’m right here.',
    'A tiny head-scritch? Excellent.',
    'I like hanging out with you.',
    'Boop! Ready when you are.'
  ];

  var SVG =
    '<svg viewBox="0 0 120 120" role="img" aria-label="Mopapa, a small golden companion">' +
      '<ellipse class="tail" cx="94" cy="83" rx="12" ry="7" transform="rotate(28 94 83)" fill="#e9ad68"/>' +
      '<ellipse cx="60" cy="110" rx="34" ry="6" fill="rgba(0,0,0,.25)"/>' +
      '<g class="ears">' +
        '<circle cx="32" cy="34" r="14" fill="#f2b56b"/>' +
        '<circle cx="88" cy="34" r="14" fill="#f2b56b"/>' +
        '<circle cx="32" cy="34" r="7" fill="#df8e82" opacity=".72"/>' +
        '<circle cx="88" cy="34" r="7" fill="#df8e82" opacity=".72"/>' +
      '</g>' +
      '<ellipse cx="60" cy="66" rx="42" ry="40" fill="#f7c985"/>' +
      '<circle cx="34" cy="76" r="6" fill="#f09a8a" opacity=".62"/>' +
      '<circle cx="86" cy="76" r="6" fill="#f09a8a" opacity=".62"/>' +
      '<g class="eyes">' +
        '<ellipse cx="45" cy="62" rx="5" ry="7" fill="#2b2540"/>' +
        '<ellipse cx="75" cy="62" rx="5" ry="7" fill="#2b2540"/>' +
      '</g>' +
      '<ellipse cx="60" cy="76" rx="4" ry="3" fill="#c0735a"/>' +
      '<path d="M55 81 Q60 86 65 81" fill="none" stroke="#9d5e55" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>';

  function init() {
    petEl = document.getElementById('pet');
    if (!petEl) return;
    petEl.innerHTML = SVG;
    petEl.setAttribute('role', 'button');
    petEl.setAttribute('tabindex', '0');
    petEl.setAttribute('aria-label', 'Mopapa. Tap or press Enter to give your pet a pat.');
    petEl.setAttribute('title', 'Give Mopapa a pat');

    petEl.addEventListener('click', onPat);
    petEl.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onPat();
      }
    });
  }

  function say(text) {
    var bubble = document.getElementById('bubble');
    if (bubble) bubble.textContent = text;
  }

  function react(state) {
    if (!petEl) petEl = document.getElementById('pet');
    if (!petEl) return;

    petEl.classList.remove('is-happy', 'is-curious', 'is-thinking', 'is-helpful');
    if (resetTimer) window.clearTimeout(resetTimer);

    if (state && state !== 'idle' && state !== 'calm') {
      petEl.classList.add('is-' + state);
      resetTimer = window.setTimeout(function () {
        if (petEl) petEl.classList.remove('is-happy', 'is-curious', 'is-thinking', 'is-helpful');
      }, state === 'thinking' ? 1800 : 1050);
    }
  }

  function onPat() {
    say(tapLines[tapLine % tapLines.length]);
    tapLine += 1;
    react('happy');
  }

  function bounce() {
    react('happy');
  }

  return { init: init, say: say, bounce: bounce, react: react };
})();
