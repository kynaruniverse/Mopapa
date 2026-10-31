
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.results = (function () {
  function answerMatches(q, matches, options) {
    var currentMap = options.currentLocations(options.all);
    var beforeStale = matches.length;

    var fresh = matches.filter(function (entry) {
      return !options.isStale(entry, currentMap);
    });

    if (fresh.length) matches = fresh;

    var hiddenStale = beforeStale - matches.length;

    if (!matches.length) {
      var scope = options.date
        ? ' for ' + options.date.label
        : '';

      return {
        answer: 'I could not find anything matching that' + scope +
          '. Try different words, or check the rooms in Mopapa.',
        sources: [],
        missed: true
      };
    }

    var n = options.norm(q);
    var directQuestion = options.questionIntent.isDirectQuestion(n);
    var isItemsQuestion = options.questionIntent.isItemsQuestion(n);

    var shown = (directQuestion || isItemsQuestion)
      ? matches
      : matches.slice(0, 5);

    var roomText = options.room
      ? ' in ' + options.roomName(options.room)
      : '';

    var dateText = options.date
      ? ' for ' + options.date.label
      : '';

    var lead;

    if (options.date) {
      lead = 'Yes, I found ' + matches.length +
        ' matching entr' + (matches.length === 1 ? 'y' : 'ies') +
        roomText + dateText + '.';
    } else if (options.room) {
      lead = 'I found ' + matches.length +
        ' saved entr' + (matches.length === 1 ? 'y' : 'ies') +
        roomText + '.';
    } else {
      lead = 'I found ' + matches.length +
        ' saved entr' + (matches.length === 1 ? 'y' : 'ies') +
        ' matching those words.';
    }

    if (matches.length > shown.length) {
      lead += ' Showing the newest ' + shown.length + '.';
    }

    var staleNote = hiddenStale
      ? ' I hid ' + hiddenStale + ' older ' +
        (hiddenStale === 1 ? 'entry' : 'entries') +
        ' that a newer one replaced.'
      : '';

    lead += staleNote;

    if (isItemsQuestion) {
      return {
        answer: 'I found these items:\n' +
          shown.map(function (entry) {
            return '• ' + entry.text;
          }).join('\n'),
        sources: shown
      };
    }

    if (directQuestion && shown.length === 1) {
      return {
        answer: 'You saved this: ' + shown[0].text + staleNote,
        sources: shown
      };
    }

    if (directQuestion && shown.length > 1) {
      return {
        answer: 'You saved ' + shown.length + ' items:\n' +
          shown.map(function (entry) {
            return '• ' + entry.text;
          }).join('\n') + staleNote,
        sources: shown
      };
    }

    return {
      answer: lead,
      sources: shown
    };
  }

  return {
    answerMatches: answerMatches
  };
})();
