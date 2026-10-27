
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
      '\\bfor\\s+([a-z][a-z\\'-]*(?:\\s+(?!(?:' +
      PERSON_STOP_WORDS +
      ')\\b)[a-z][a-z\\'-]*)?)',
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
    extractForPerson: extractForPerson,
    extractCalledPerson: extractCalledPerson
  };
})();
