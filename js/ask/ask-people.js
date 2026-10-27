
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.people = (function () {
  var norm = Mopapa.askParts.text.norm;

  function isNameQuestion(q) {
    var n = norm(q);

    return /\bwhat(?: is| was|s)\s+the .+\s+called\b/.test(n) ||
      /\bwhat(?: is| was|s)\s+the .+\s+name\b/.test(n) ||
      /\bwhat(?: is| was|s)\s+the .+ name\b/.test(n) ||
      /\bwhat is the .+ called\b/.test(n) ||
      /\bwhat is the name of\b/.test(n) ||
      /\bwhat is .+ name\b/.test(n);
  }

  function asksWhoSomethingIsFor(q) {
    return /\bwho\b.*\b(?:is|was|will be)\b.*\bfor\b/.test(norm(q));
  }

  var PERSON_STOP_WORDS = [
    'at', 'on', 'in', 'by', 'from', 'until',
    'tomorrow', 'today', 'tonight', 'yesterday',
    'next', 'this', 'last',
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday',
    'january', 'february', 'march', 'april', 'may',
    'june', 'july', 'august', 'september', 'october',
    'november', 'december'
  ].join('|');

  function extractForPerson(text) {
    var pattern = new RegExp(
      "\\bfor\\s+([a-z][a-z'-]*(?:\\s+(?!(?:" +
      PERSON_STOP_WORDS +
      ")\\b)[a-z][a-z'-]*)?)",
      'i'
    );

    var match = String(text || '')
      .replace(/\s+/g, ' ')
      .match(pattern);

    if (!match) return null;

    var name = match[1].trim();
    var first = name.split(/\s+/)[0].toLowerCase();
    var nonNames = /^(a|an|the|my|your|our|their|his|her|this|that|these|those|someone|anyone|everyone|nobody|something|anything|everything|appointment|delivery|parcel|package|collection|pickup|dropoff|work|home|office|school|hospital|doctor|dentist|meeting|event|trip|holiday|tomorrow|today)$/;

    if (nonNames.test(first)) return null;

    return name;
  }

  function answerWhoSomethingIsFor(q, matches) {
    if (!asksWhoSomethingIsFor(q)) return null;

    var forMatches = matches.filter(function (e) {
      return extractForPerson(e.text) !== null;
    });

    if (forMatches.length === 1) {
      var forName = extractForPerson(forMatches[0].text);

      return {
        answer: 'It looks like it is for ' + forName + '.',
        sources: [forMatches[0]]
      };
    }

    return {
      answer: 'I could not find who that is for. I will not guess.',
      sources: forMatches.slice(0, 5)
    };
  }

    function answerCalledName(q, matches) {
    if (!matches.length || !isNameQuestion(q)) return null;

    var namedMatches = [];

    matches.forEach(function (entry) {
      var person = extractCalledPerson(entry.text);

      if (person) {
        namedMatches.push({
          entry: entry,
          person: person
        });
      }
    });

    if (!namedMatches.length) return null;

    var distinctNames = [];

    namedMatches.forEach(function (item) {
      var key = item.person.name.toLowerCase();

      if (distinctNames.indexOf(key) === -1) {
        distinctNames.push(key);
      }
    });

    if (distinctNames.length > 1) {
      return {
        answer: 'I found more than one possible person in your saved entries. Which job or appointment do you mean?',
        sources: namedMatches.slice(0, 5).map(function (item) {
          return item.entry;
        })
      };
    }

    return {
      answer: 'The ' + namedMatches[0].person.role +
        ' is called ' + namedMatches[0].person.name + '.',
      sources: [namedMatches[0].entry]
    };
  }

  function extractCalledPerson(text) {
    var source = String(text || '').replace(/\s+/g, ' ').trim();

    var match = source.match(
      /\bthe\s+([a-z][a-z-]{0,20})\s+(?:is|was)\s+called\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,2})(?=[.,!?;]|$)/i
    );

    if (!match) return null;

    var role = match[1].trim();
    var name = match[2].trim();

    var monthPattern = /^(january|february|march|april|may|june|july|august|september|october|november|december)$/i;

    if (!role || !name || monthPattern.test(name)) return null;

    return {
      role: role,
      name: name
    };
  }

  return {
    isNameQuestion: isNameQuestion,
    asksWhoSomethingIsFor: asksWhoSomethingIsFor,
    answerWhoSomethingIsFor: answerWhoSomethingIsFor,
    answerCalledName: answerCalledName,
    extractForPerson: extractForPerson,
    extractCalledPerson: extractCalledPerson
  };
})();
