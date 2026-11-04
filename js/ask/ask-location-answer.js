var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.locationAnswer = (function () {
  function answerLocation(q, matches, isLocationQuestion, norm, historical) {
    if (!isLocationQuestion || !matches.length) return null;

    var locationMatches = matches.filter(function (entry) {
      return /\b(in|inside|on|under|behind|beside|next to|within)\b/i
        .test(String(entry.text || ''));
    });

    if (historical) {
      if (locationMatches.length < 2) {
        return {
          answer: 'I found a saved location, but no earlier location to compare it with.',
          sources: locationMatches.slice(0, 1)
        };
      }

      locationMatches.sort(function (a, b) {
        return new Date(b.created).getTime() -
          new Date(a.created).getTime();
      });

      locationMatches = [locationMatches[1]];
    }

    if (locationMatches.length !== 1) return null;

    var locationText = String(locationMatches[0].text || '')
      .trim()
      .replace(/[.!?]+$/, '');

    var locationAnswer = locationText.match(
      /\b(is|are)\s+(?:located\s+)?(in|inside|on|under|behind|beside|next to|within)\s+(.+)$/i
    );

    if (locationAnswer) {
      var savedText = String(locationMatches[0].text || '')
        .trim()
        .replace(/[.!?]+$/, '');

      var subjectMatch = savedText.match(/^(.*?)\s+(?:is|are)\b/i);
      var savedSubject = subjectMatch ? subjectMatch[1] : '';
      var savedPlural = /\b(keys|shoes|boots|gloves|glasses|books|documents|certificates|papers|items)\b/i
        .test(savedSubject);

      var questionPlural = /\b(keys|shoes|boots|gloves|glasses|books|documents|certificates|papers|items)\b/i
        .test(norm(q));

      if (questionPlural && !savedPlural) {
        return {
          answer: 'I found this saved item: ' + savedText + '.',
          sources: [locationMatches[0]]
        };
      }

      return {
        answer: (locationAnswer[1].toLowerCase() === 'are'
          ? 'They are '
          : 'It is ') +
          locationAnswer[2].toLowerCase() + ' ' +
          locationAnswer[3].replace(/[.!?]+$/, '') + '.',
        sources: [locationMatches[0]]
      };
    }

    return {
      answer: locationText + '.',
      sources: [locationMatches[0]]
    };
  }

  return {
    answerLocation: answerLocation
  };
})();