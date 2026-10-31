var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.rules = (function () {
  var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december'];
  var SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  var MON = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  var DM_RE = new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?' + MON + '\\b(?:\\s+(\\d{4}))?');
  var MD_RE = new RegExp('\\b' + MON + '\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:\\s+(\\d{4}))?');
  var NUM_RE = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;
  var WD_RE = /\b(?:(next|this|on)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/;
  var PAST_RE = /\b(yesterday|ago|last\s+(?:night|week|month|year|sunday|monday|tuesday|wednesday|thursday|friday|saturday))\b/;

  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

  function dateForEntry(value, hasTime) {
    if (
      !hasTime &&
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      var parts = value.split('-').map(Number);
      var date = new Date(parts[0], parts[1] - 1, parts[2]);

      if (
        date.getFullYear() === parts[0] &&
        date.getMonth() === parts[1] - 1 &&
        date.getDate() === parts[2]
      ) {
        return date;
      }

      return new Date(NaN);
    }

    return new Date(value);
  }

  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function monthIdx(s) { return SHORT.indexOf(s.slice(0, 3)); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function build(d, mon, yr, today) {
    var y = yr !== null && yr !== undefined
      ? (yr < 100 ? (yr < 50 ? 2000 + yr : 1900 + yr) : yr)
      : today.getFullYear();
    var dt = new Date(y, mon, d);
    if (dt.getMonth() !== mon || dt.getDate() !== d) return null;
    if ((yr === null || yr === undefined) && dt < today) {
      dt = new Date(y + 1, mon, d);
      if (dt.getMonth() !== mon || dt.getDate() !== d) return null;
    }
    return dt;
  }

  // Returns { date: Date, hasTime: bool } or null if no usable future date/time found.
  function parse(text, now) {
    now = now || new Date();
    var today = startOfDay(now);
    var t = ' ' + String(text).toLowerCase() + ' ';
    if (PAST_RE.test(t)) return null;
    var date = null, m, d1, h = null, mi = 0;

    m = t.match(/\bin\s+(\d{1,3})\s*(minute|min|hour|hr|day|week|month)s?\b/);
    if (m) {
      var n = +m[1], u = m[2];
      t = t.replace(m[0], ' ');
      if (u === 'minute' || u === 'min') return { date: new Date(now.getTime() + n * 60000), hasTime: true };
      if (u === 'hour' || u === 'hr') return { date: new Date(now.getTime() + n * 3600000), hasTime: true };
      if (u === 'day') date = addDays(today, n);
      else if (u === 'week') date = addDays(today, 7 * n);
      else {
        var targetMonth = today.getMonth() + n;
        var targetYear = today.getFullYear() + Math.floor(targetMonth / 12);
        targetMonth = targetMonth % 12;

        var lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
        date = new Date(
          targetYear,
          targetMonth,
          Math.min(today.getDate(), lastDay)
        );
      }
    }

    if (!date) {
      m = t.match(DM_RE);
      if (m) { d1 = build(+m[1], monthIdx(m[2]), m[3] ? +m[3] : null, today); if (d1) { date = d1; t = t.replace(m[0], ' '); } }
    }
    if (!date) {
      m = t.match(MD_RE);
      if (m) { d1 = build(+m[2], monthIdx(m[1]), m[3] ? +m[3] : null, today); if (d1) { date = d1; t = t.replace(m[0], ' '); } }
    }
    if (!date) {
      m = t.match(NUM_RE);
      if (m) { d1 = build(+m[1], +m[2] - 1, m[3] ? +m[3] : null, today); if (d1) { date = d1; t = t.replace(m[0], ' '); } }
    }
    if (!date) { m = t.match(/\bday after tomorrow\b/); if (m) { date = addDays(today, 2); t = t.replace(m[0], ' '); } }
    if (!date) { m = t.match(/\btomorrow\b/); if (m) { date = addDays(today, 1); t = t.replace(m[0], ' '); } }
    if (!date) { m = t.match(/\b(today|tonight)\b/); if (m) { date = new Date(today); t = t.replace(m[0], ' '); } }
    if (!date) {
      m = t.match(WD_RE);
      if (m) {
        var targetDay = DAYS.indexOf(m[2]);
        var currentDay = today.getDay();
        var diff = (targetDay - currentDay + 7) % 7;

        if (m[1] === 'next') {
          // "Next Friday" means the following Monday-to-Sunday week.
          diff = diff + 7;
        } else if (m[1] === 'this') {
          // "This Friday" means the weekday in the current week.
          diff = targetDay - currentDay;
          if (diff < 0) diff += 7;
        } else {
          // A bare weekday means the next occurrence, excluding today.
          if (diff === 0) diff = 7;
        }

        date = addDays(today, diff);
        t = t.replace(m[0], ' ');
      }
    }
    if (!date) { m = t.match(/\bnext week\b/); if (m) { date = addDays(today, 7); t = t.replace(m[0], ' '); } }

    // time of day, searched in what is left of the text
    m = t.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
    if (m) {
      h = +m[1]; mi = +(m[2] || 0);
      if (h >= 1 && h <= 12 && mi < 60) {
        if (m[3] === 'pm' && h < 12) h += 12;
        if (m[3] === 'am' && h === 12) h = 0;
      } else { h = null; }
    } else if ((m = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/))) {
      h = +m[1]; mi = +m[2];
    } else if (/\b(noon|midday)\b/.test(t)) {
      h = 12; mi = 0;
    }

    var hasTime = false;
    if (h !== null) {
      hasTime = true;
      if (!date) {
        date = new Date(today);
        if (new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, mi) <= now) date = addDays(today, 1);
      }
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, mi);
    }
    if (!date) return null;
    return { date: date, hasTime: hasTime };
  }

  function describe(d, hasTime) {
    var label = cap(DAYS[d.getDay()]) + ' ' + d.getDate() + ' ' + cap(MONTHS[d.getMonth()]);
    if (d.getFullYear() !== new Date().getFullYear()) label += ' ' + d.getFullYear();
    if (hasTime) {
      var h = d.getHours(), m = d.getMinutes();
      label += ', ' + (h % 12 || 12) + (m ? ':' + (m < 10 ? '0' : '') + m : '') + (h >= 12 ? 'pm' : 'am');
    }
    return label;
  }

  function isPast(iso, hasTime) {
    var d = dateForEntry(iso, hasTime);
    var now = new Date();

    if (isNaN(d.getTime())) return false;

    return hasTime ? d < now : d < startOfDay(now);
  }

  function money(text) {
    var m = String(text).match(/£\s?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?![\d,])/);
    return m ? '£' + m[1] : null;
  }

  // Every £ amount in the text, as numbers.
  function moneyAll(text) {
    var out = [], m;
    var re = /£\s?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?![\d,])/g;
    while ((m = re.exec(String(text))) !== null) {
      out.push(parseFloat(m[1].replace(/,/g, '')));
    }
    return out;
  }

  // "Keys are in the kitchen drawer", "Car is parked on level 3"
  var FACT_RE = /^(.+?)\s+(is|are)\s+(?:now\s+|currently\s+|always\s+|still\s+)?(?:(?:kept|left|stored|put|placed|parked|hidden|sitting|located)\s+)?(in|inside|on|under|behind|beside|next to|within|at)\s+(.+?)[.!?\s]*$/i;
  var NOT_SUBJECT_RE = /^(?:i|we|you|he|she|they|it|there|this|that|these|those|what|who|where|when|why|how)\b/i;
  var TIMEISH_RE = /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|tomorrow|today|tonight|yesterday|noon|midday)\b|\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,2}(?:st|nd|rd|th)\b|\d{1,2}\/\d{1,2}|^\d{1,2}(?::\d{2})?$/i;
  var LEAD_DET_RE = /^(?:the|my|our|a|an)\s+/i;

  // Pulls structure out of a saved sentence. Returns { fact, amounts }.
  // fact is null unless the text says where something is.
  function extract(text) {
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    var res = { fact: null, amounts: moneyAll(t) };
    var m = t.match(FACT_RE);
    if (!m) return res;

    var subject = m[1].replace(LEAD_DET_RE, '').trim();
    var where = m[4].trim();

    if (!subject || subject.split(' ').length > 6) return res;
    if (NOT_SUBJECT_RE.test(subject) || TIMEISH_RE.test(where)) return res;

    var items = subject.split(/\s*(?:,|&|\band\b)\s*/i)
      .map(function (s) { return s.replace(LEAD_DET_RE, '').trim().toLowerCase(); })
      .filter(Boolean);
    if (!items.length) return res;

    res.fact = {
      attr: 'location',
      items: items,
      prep: m[3].toLowerCase(),
      where: where.toLowerCase(),
      value: (m[3] + ' ' + where).toLowerCase(),
      plural: m[2].toLowerCase() === 'are' || items.length > 1
    };
    return res;
  }

    var Q_START = /^(what|whats|when|whens|where|wheres|who|whos|whose|which|why|how|hows)\b(?!\s+(?:i|we|you|he|she|they|to|the|a|an|my|our|his|her|their|this|that|these|those)\b)/;
  var Q_AUX = /^(?:(?:do|does|did|have|has|had|am|can|could|will|would|should)\s+(?:i|you|we|they|there|it|this|that|any|anything|anyone|everything)|(?:is|are|was|were)\s+(?:i|you|we|they|my|our|the|there|it|this|that|any|anything|anyone|everything))\b/;
  var Q_CMD = /^(show|tell|list|find|search)\s+(me\s+)?(what|when|where|who|which|how|all|my|everything|anything)\b/;
  var Q_ANY = /\b(did i|do i|have i|am i|when is|when are|when do|when did|whens|whats|what is|what are|where is|where are|who is|how many|how much|how often)\b/;

  // 'sure' = explicit question mark, 'maybe' = likely question, null = not a question
  function questionLevel(text) {
    var t = String(text).toLowerCase().replace(/['’`]/g, '').trim();

    if (/^what if\b/.test(t)) return null;

    if (/\?\s*$/.test(t)) return 'sure';

    if (
      Q_START.test(t) ||
      Q_AUX.test(t) ||
      Q_CMD.test(t) ||
      Q_ANY.test(t)
    ) return 'sure';

    return null;
  }

  return { parse: parse, describe: describe, isPast: isPast, dateForEntry: dateForEntry, money: money, moneyAll: moneyAll, extract: extract, questionLevel: questionLevel, DAYS: DAYS, MONTHS: MONTHS };
})();