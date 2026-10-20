var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.pet = (function () {
  var SVG =
    '<svg viewBox="0 0 120 120" role="img" aria-label="Mopapa the pet">' +
    '<ellipse cx="60" cy="110" rx="34" ry="6" fill="rgba(0,0,0,.25)"/>' +
    '<circle cx="32" cy="34" r="14" fill="#f2b56b"/>' +
    '<circle cx="88" cy="34" r="14" fill="#f2b56b"/>' +
    '<ellipse cx="60" cy="66" rx="42" ry="40" fill="#f7c985"/>' +
    '<circle cx="34" cy="76" r="6" fill="#f09a8a" opacity=".6"/>' +
    '<circle cx="86" cy="76" r="6" fill="#f09a8a" opacity=".6"/>' +
    '<g class="eyes"><ellipse cx="45" cy="62" rx="5" ry="7" fill="#2b2540"/>' +
    '<ellipse cx="75" cy="62" rx="5" ry="7" fill="#2b2540"/></g>' +
    '<ellipse cx="60" cy="76" rx="4" ry="3" fill="#c0735a"/>' +
    '</svg>';

  function init() { document.getElementById('pet').innerHTML = SVG; }
  function say(text) { document.getElementById('bubble').textContent = text; }
  function bounce() {
    var p = document.getElementById('pet');
    p.classList.remove('bounce');
    void p.offsetWidth;
    p.classList.add('bounce');
  }

  return { init: init, say: say, bounce: bounce };
})();