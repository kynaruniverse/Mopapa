
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.aliases = (function () {
  var norm = Mopapa.askParts.text.norm;
  var stem = Mopapa.askParts.text.stem;

  var BUILT_IN_GROUPS = [
    ['gp', 'doctor', 'surgery'],
    ['dentist', 'dental'],
    ['boiler', 'heating'],
    ['car', 'vehicle'],
    ['holiday', 'vacation'],
    ['phone', 'mobile'],
    ['bin', 'rubbish', 'trash'],
    ['tv', 'television']
  ];

  var map = Object.create(null);

  function linkAlias(from, to) {
    if (!map[from]) map[from] = [];

    if (map[from].indexOf(to) === -1) {
      map[from].push(to);
    }
  }

  function addAlias(a, b) {
    var x = stem(norm(a));
    var y = stem(norm(b));

    if (!x || !y || x === y) return false;

    linkAlias(x, y);
    linkAlias(y, x);

    return true;
  }

  function resetBuiltIns() {
    Object.keys(map).forEach(function (key) {
      delete map[key];
    });

    BUILT_IN_GROUPS.forEach(function (group) {
      group.forEach(function (a) {
        group.forEach(function (b) {
          addAlias(a, b);
        });
      });
    });
  }

  resetBuiltIns();

  return {
    map: map,
    addAlias: addAlias,
    resetBuiltIns: resetBuiltIns
  };
})();
