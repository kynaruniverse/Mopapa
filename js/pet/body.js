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
      '<ellipse cx="60" cy="110" rx="32" ry="5" fill="#000" opacity=".28"/>' +
      '<circle class="tail" cx="90" cy="98" r="7" fill="#c8924a"/>' +
      '<ellipse cx="60" cy="88" rx="28" ry="22" fill="#e2b46a"/>' +
      '<ellipse cx="45" cy="106" rx="10" ry="6.5" fill="#c8924a"/>' +
      '<ellipse cx="75" cy="106" rx="10" ry="6.5" fill="#c8924a"/>' +
      '<ellipse cx="60" cy="96" rx="15" ry="11" fill="#f1dcb0"/>' +
      '<ellipse cx="34" cy="92" rx="6" ry="11" transform="rotate(15 34 92)" fill="#d6a45a"/>' +
      '<ellipse cx="86" cy="92" rx="6" ry="11" transform="rotate(-15 86 92)" fill="#d6a45a"/>' +
      '<g class="ears">' +
        '<circle cx="33" cy="30" r="11" fill="#e2b46a"/>' +
        '<circle cx="87" cy="30" r="11" fill="#e2b46a"/>' +
        '<circle cx="33" cy="30" r="5.5" fill="#c8924a"/>' +
        '<circle cx="87" cy="30" r="5.5" fill="#c8924a"/>' +
      '</g>' +
      '<ellipse cx="60" cy="52" rx="33" ry="29" fill="#e2b46a"/>' +
      '<path d="M54 31Q60 26 66 31" fill="none" stroke="#c8924a" stroke-width="3.2" stroke-linecap="round"/>' +
      '<ellipse cx="60" cy="62" rx="14" ry="10" fill="#f1dcb0"/>' +
      '<g class="eyes">' +
        '<ellipse cx="47" cy="48" rx="3.6" ry="4.8" fill="#251f33"/>' +
        '<ellipse cx="73" cy="48" rx="3.6" ry="4.8" fill="#251f33"/>' +
        '<circle cx="48.3" cy="46.3" r="1.2" fill="#ece6d8"/>' +
        '<circle cx="74.3" cy="46.3" r="1.2" fill="#ece6d8"/>' +
      '</g>' +
      '<path d="M55.5 57Q60 54.5 64.5 57Q62.5 61.5 60 61.5Q57.5 61.5 55.5 57Z" fill="#251f33"/>' +
      '<path d="M60 61.5V64.5M60 64.5Q56.5 67.5 53.5 65M60 64.5Q63.5 67.5 66.5 65" fill="none" stroke="#251f33" stroke-width="1.6" stroke-linecap="round"/>' +
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

    var toast = document.getElementById('toast');
    var home = document.getElementById('screen-home');

    if (toast && home && home.hidden) {
      toast.textContent = text;
      toast.hidden = false;

      window.clearTimeout(toast._t);
      toast._t = window.setTimeout(function () {
        toast.hidden = true;
      }, 6000);
    }
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
