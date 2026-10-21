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
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function monthIdx(s) { return SHORT.indexOf(s.slice(0, 3)); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function build(d, mon, yr, today) {
    var y = yr ? (yr < 100 ? 2000 + yr : yr) : today.getFullYear();
    var dt = new Date(y, mon, d);
    if (dt.getMonth() !== mon || dt.getDate() !== d) return null;
    if (!yr && dt < today) {
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
      else { date = new Date(today); date.setMonth(date.getMonth() + n); }
    }

    if (!date) {
      m = t.match(DM_RE);
      if (m) { d1 = build(+m[1], monthIdx(m[2]), m[3] ? +m[3] : 0, today); if (d1) { date = d1; t = t.replace(m[0], ' '); } }
    }
    if (!date) {
      m = t.match(MD_RE);
      if (m) { d1 = build(+m[2], monthIdx(m[1]), m[3] ? +m[3] : 0, today); if (d1) { date = d1; t = t.replace(m[0], ' '); } }
    }
    if (!date) {
      m = t.match(NUM_RE);
      if (m) { d1 = build(+m[1], +m[2] - 1, m[3] ? +m[3] : 0, today); if (d1) { date = d1; t = t.replace(m[0], ' '); } }
    }
    if (!date) { m = t.match(/\bday after tomorrow\b/); if (m) { date = addDays(today, 2); t = t.replace(m[0], ' '); } }
    if (!date) { m = t.match(/\btomorrow\b/); if (m) { date = addDays(today, 1); t = t.replace(m[0], ' '); } }
    if (!date) { m = t.match(/\b(today|tonight)\b/); if (m) { date = new Date(today); t = t.replace(m[0], ' '); } }
    if (!date) {
      m = t.match(WD_RE);
      if (m) {
        var diff = (DAYS.indexOf(m[2]) - today.getDay() + 7) % 7;
        if (diff === 0) diff = 7;
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
    } else if ((m = t.match(/\bat\s+(\d{1,2})\b(?!\s*(?:st|nd|rd|th|\/|:))/))) {
      var x = +m[1];
      if (x >= 1 && x <= 12) { h = (x === 12) ? 12 : (x <= 7 ? x + 12 : x); mi = 0; }
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
    var d = new Date(iso), now = new Date();
    return hasTime ? d < now : d < startOfDay(now);
  }

  function money(text) {
    var m = String(text).match(/£\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/);
    return m ? '£' + m[1] : null;
  }

  var Q_START = /^(what|whats|when|whens|where|wheres|who|whos|whose|which|why|how|hows)\b/;
  var Q_AUX = /^(do|does|did|is|are|was|were|can|could|will|would|should|have|has|am)\s+(i|you|we|they|my|there|it|this|that|any|anything|anyone|everything)\b/;
  var Q_CMD = /^(show|tell|list|find|search)\s+(me\s+)?(what|when|where|who|which|how|all|my|everything|anything)\b/;
  var Q_ANY = /\b(did i|do i|have i|am i|when is|when are|when do|when did|whens|whats|what is|what are|where is|where are|who is|how many|how much|how often)\b/;

  // 'sure' = ends with ?, 'maybe' = reads like a question, null = not a question
  function questionLevel(text) {
    var t = String(text).toLowerCase().replace(/['’`]/g, '').trim();
    if (/\?\s*$/.test(t)) return 'maybe';
    if (/^what if\b/.test(t)) return null;
    if (Q_START.test(t) || Q_AUX.test(t) || Q_CMD.test(t) || Q_ANY.test(t)) return 'maybe';
    return null;
  }

  return { parse: parse, describe: describe, isPast: isPast, money: money, questionLevel: questionLevel, DAYS: DAYS, MONTHS: MONTHS };
})();