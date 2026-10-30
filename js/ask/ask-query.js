
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.query = (function () {
  var extractTextDate = Mopapa.askParts.dateText.extractTextDate;
  var words = Mopapa.askParts.text.words;
  var stem = Mopapa.askParts.text.stem;
  var roomStems = Mopapa.askParts.roomIntent.roomStems;
  var MONTH_NAMES = Mopapa.askParts.dateText.MONTH_NAMES;

  var STOP = (
    'a an the i me my mine we our you your he she it they them is are was were am ' +
    'do does did have has had can could would should will need needs needed ' +
    'what whats when whens ' +
    'know knows knowing knew understand understood ' +
    'where wheres who whos whose which why how many much often show tell find search ' +
    'please logged log logbook entry entries item items any anything something everything ' +
    'about on in at for of to from with and or but last this that there here next due scheduled ' +
    'didnt dont doesnt isnt wasnt werent hasnt havent wouldnt couldnt shouldnt ' +
    'have i ever been remember remind tell me put left leave leaves leaving kept keep park parked parking store stored storing hide hidden hiding place placed placing myself today yesterday tomorrow ' +
    'save saved saving saves record records recorded recording records remember remembered ' +
    'add added adding create created creating get got retrieve retrieving ' +
    'leave leaving leaves park parked parking store stored storing ' +
    'hide hid hidden place placed thing things object objects stuff ' +
    'week weeks weekend weekends month months previous current'
  ).split(' ').reduce(function (o, w) {
    o[w] = true;
    return o;
  }, Object.create(null));

  var DAY_NAMES = [
    'sunday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday'
  ];

  function queryTerms(q, roomId) {
    var dateHit = extractTextDate(q);
    var all = words(dateHit ? String(q).replace(dateHit.text, ' ') : q);
    var out = [];
    var seen = Object.create(null);
    var selectedRoom = roomId ? Mopapa.roomById(roomId) : null;
    var customNameWords = (
      selectedRoom && selectedRoom.id.indexOf('custom_') === 0
    ) ? words(selectedRoom.name).map(function (w) { return stem(w); }) : [];

    all.forEach(function (w, i) {
      if (/^\d+$/.test(w)) {
        var prevWord = all[i - 1];
        var nextWord = all[i + 1] || '';

        // Keep "flat 4" or "bus 38"; drop years, "at 3 pm" and loose numbers.
        if (
          prevWord && !STOP[prevWord] &&
          !/^(19|20)\d\d$/.test(w) &&
          !/^(am|pm)$/.test(nextWord) &&
          !seen[w]
        ) {
          seen[w] = true;
          out.push(w);
        }

        return;
      }

      if (
        (w.length < 3 && w !== 'gp') ||
        STOP[w] ||
        ['name', 'called', 'named'].indexOf(w) !== -1 ||
        /^\d+$/.test(w) ||
        seen[w]
      ) {
        return;
      }

      var term = stem(w);

      if (seen[term]) return;
      if (customNameWords.indexOf(term) !== -1) return;
      if (roomStems.indexOf(term) !== -1) return;
      if (DAY_NAMES.indexOf(term) !== -1) return;
      if (MONTH_NAMES.indexOf(term) !== -1) return;

      if ([
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'sept', 'oct', 'nov',
        'dec', 'room'
      ].indexOf(term) !== -1) {
        return;
      }

      seen[term] = true;
      out.push(term);
    });

    return out;
  }

  return {
    queryTerms: queryTerms
  };
})();
