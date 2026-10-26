
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.dateFilter = (function () {
  var DAY_NAMES = [
    'sunday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday'
  ];

  function localDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function explicitDateFilter(
    q,
    now,
    norm,
    extractTextDate,
    isLoggedQuestion,
    isScheduledDateQuestion,
    MONTH_NAMES
  ) {
    var n = norm(q);
    var parsed = extractTextDate(q);

    if (!parsed) return null;

    var loggedQuestion = isLoggedQuestion(n);
    var pastTense = /\b(did|was|were|paid|spent|bought|saved|logged|recorded)\b/.test(n);
    var year = parsed.year;

    if (year === null) {
      year = now.getFullYear();

      var provisional = new Date(year, parsed.month, parsed.day);

      if (provisional.getMonth() !== parsed.month) return null;

      if (!loggedQuestion && !pastTense && provisional < localDay(now)) {
        year++;
      }
    }

    var start = new Date(year, parsed.month, parsed.day);

    if (
      start.getFullYear() !== year ||
      start.getMonth() !== parsed.month ||
      start.getDate() !== parsed.day
    ) {
      return null;
    }

    return {
      start: start,
      end: new Date(year, parsed.month, parsed.day + 1),
      label: parsed.day + ' ' +
        MONTH_NAMES[parsed.month].charAt(0).toUpperCase() +
        MONTH_NAMES[parsed.month].slice(1) + ' ' + year,
      due: !loggedQuestion && isScheduledDateQuestion(n),
      explicit: true,
      logged: loggedQuestion,
      year: year
    };
  }

  function loggedOn(e, filter) {
    if (!filter) return true;

    var value = filter.due ? e.when : e.created;

    if (filter.due && !value) return false;

    var d = new Date(value);

    return !isNaN(d.getTime()) &&
      d >= filter.start &&
      d < filter.end;
  }
  
  function dateFilter(q, now, norm, isScheduledDateQuestion) {
    var n = norm(q);
    var m;
    var start;
    var end;
    var due = isScheduledDateQuestion(n);

    function makeFilter(from, to, label, isDue) {
      return {
        start: from,
        end: to,
        label: label,
        due: isDue === undefined ? due : isDue
      };
    }

    function mondayOfWeek(day) {
      var result = localDay(day);
      var offset = (result.getDay() + 6) % 7;
      result.setDate(result.getDate() - offset);
      return result;
    }

    if (/\b(last|previous)\s+week\b/.test(n)) {
      start = mondayOfWeek(now);
      start.setDate(start.getDate() - 7);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      return makeFilter(start, end, 'last week');
    }

    if (/\b(this|current)\s+week\b/.test(n)) {
      start = mondayOfWeek(now);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      return makeFilter(start, end, 'this week');
    }

    if (/\b(last|previous)\s+month\b/.test(n)) {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 1);
      return makeFilter(start, end, 'last month');
    }

    if (/\b(this|current)\s+month\b/.test(n)) {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return makeFilter(start, end, 'this month');
    }

    if (/\bthis weekend\b/.test(n)) {
      var weekday = now.getDay();

      start = localDay(now);
      if (weekday === 0) {
        start.setDate(start.getDate() - 1);
      } else if (weekday !== 6) {
        start.setDate(start.getDate() + (6 - weekday));
      }

      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2);
      return makeFilter(start, end, 'this weekend');
    }

    if (/\blast weekend\b/.test(n)) {
      var thisSaturday = localDay(now);
      var todayDay = thisSaturday.getDay();

      if (todayDay === 0) {
        thisSaturday.setDate(thisSaturday.getDate() - 1);
      } else if (todayDay !== 6) {
        thisSaturday.setDate(thisSaturday.getDate() + (6 - todayDay));
      }

      start = new Date(
        thisSaturday.getFullYear(),
        thisSaturday.getMonth(),
        thisSaturday.getDate() - 7
      );
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2);
      return makeFilter(start, end, 'last weekend');
    }

    m = n.match(
      /\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/
    );

    if (m) {
      var back = (
        now.getDay() - DAY_NAMES.indexOf(m[1]) + 7
      ) % 7;

      if (back === 0) back = 7;

      start = localDay(now);
      start.setDate(start.getDate() - back);

      return makeFilter(
        start,
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        'last ' + m[1]
      );
    }

    if (/\byesterday\b/.test(n)) {
      start = localDay(now);
      start.setDate(start.getDate() - 1);

      return makeFilter(
        start,
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        'yesterday'
      );
    }

    if (/\btomorrow\b/.test(n)) {
      start = localDay(now);
      start.setDate(start.getDate() + 1);

      return makeFilter(
        start,
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        'tomorrow',
        true
      );
    }

    if (/\btoday\b/.test(n)) {
      start = localDay(now);

      return makeFilter(
        start,
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 1
        ),
        'today'
      );
    }

    return null;
  }

  return {
    dateFilter: dateFilter,
    explicitDateFilter: explicitDateFilter,
    loggedOn: loggedOn
  };
})();
