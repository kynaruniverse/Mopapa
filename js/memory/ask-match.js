
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.match = (function () {
  function editDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;

    var prev2 = null;
    var prev = [];
    var i;
    var j;

    for (j = 0; j <= b.length; j++) prev[j] = j;

    for (i = 1; i <= a.length; i++) {
      var cur = [i];

      for (j = 1; j <= b.length; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;

        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + cost
        );

        // Swapped neighbouring letters count as one typo.
        if (
          i > 1 && j > 1 &&
          a.charAt(i - 1) === b.charAt(j - 2) &&
          a.charAt(i - 2) === b.charAt(j - 1)
        ) {
          cur[j] = Math.min(cur[j], prev2[j - 2] + 1);
        }
      }

      prev2 = prev;
      prev = cur;
    }

    return prev[b.length];
  }

  function termsClose(a, b) {
    if (a === b) return true;

    // Numbers and short words must match exactly.
    if (/\d/.test(a) || /\d/.test(b)) return false;

    var len = Math.min(a.length, b.length);

    if (len < 5) return false;

    var allowed = len >= 8 ? 2 : 1;

    return editDistance(a, b, allowed) <= allowed;
  }

  return {
    editDistance: editDistance,
    termsClose: termsClose
  };
})();
