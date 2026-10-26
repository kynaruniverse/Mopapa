
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.dateText = (function () {
  var MONTH_NAMES = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  var MONTH_RE =
    '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|' +
    'aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

  function monthIndex(name) {
    var key = String(name).toLowerCase().slice(0, 3);

    for (var i = 0; i < MONTH_NAMES.length; i++) {
      if (MONTH_NAMES[i].slice(0, 3) === key) return i;
    }

    return -1;
  }

  function extractTextDate(text) {
    var source = String(text || '');
    var day, month, year = null;
    var match = source.match(new RegExp(
      '\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?' + MONTH_RE +
      '(?:\\s+(\\d{4}))?\\b', 'i'
    ));

    if (match) {
      day = Number(match[1]);
      month = monthIndex(match[2]);
      year = match[3] ? Number(match[3]) : null;
    } else {
      match = source.match(new RegExp(
        '\\b' + MONTH_RE +
        '\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b', 'i'
      ));

      if (match) {
        month = monthIndex(match[1]);
        day = Number(match[2]);
        year = match[3] ? Number(match[3]) : null;
      } else {
        // Numeric dates use UK day/month/year order.
        match = source.match(/\\b(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?\\b/);

        if (!match) return null;

        day = Number(match[1]);
        month = Number(match[2]) - 1;
        year = match[3] ? Number(match[3]) : null;

        if (year !== null && year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
      }
    }

    if (month < 0 || month > 11 || day < 1 || day > 31) return null;

    var check = new Date(year || 2000, month, day);

    if (check.getMonth() !== month || check.getDate() !== day) return null;

    return {
      day: day,
      month: month,
      year: year,
      text: match[0],
      label: day + ' ' +
        MONTH_NAMES[month].charAt(0).toUpperCase() +
        MONTH_NAMES[month].slice(1) +
        (year ? ' ' + year : '')
    };
  }

  function textDateMatchesFilter(e, filter) {
    if (
      !filter || !filter.start || !filter.end ||
      (!filter.due && !filter.explicit) ||
      filter.logged
    ) {
      return false;
    }

    var parsed = extractTextDate(e.text);
    if (!parsed) return false;

    var year = parsed.year;

    if (year === null || year === undefined) {
      year = filter.start.getFullYear();
    }

    var date = new Date(year, parsed.month, parsed.day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== parsed.month ||
      date.getDate() !== parsed.day
    ) {
      return false;
    }

    return date >= filter.start && date < filter.end;
  }

  return {
    MONTH_NAMES: MONTH_NAMES,
    extractTextDate: extractTextDate,
    textDateMatchesFilter: textDateMatchesFilter
  };
})();
