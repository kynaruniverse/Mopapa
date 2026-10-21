var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.agenda = (function () {
  var DAYS_AHEAD = 7;

  function localDayNumber(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  }

  function getItems(now) {
    now = now || new Date();
    var todayNumber = localDayNumber(now);
    var entries = Mopapa.store.data().entries || [];
    var items = [];

    entries.forEach(function (entry) {
      if (!entry || !entry.when || entry.done) return;
      var date = new Date(entry.when);
      if (isNaN(date.getTime())) return;

      var dayOffset = localDayNumber(date) - todayNumber;
      var overdue = Mopapa.rules.isPast(entry.when, entry.hasTime);
      if (!overdue && (dayOffset < 0 || dayOffset > DAYS_AHEAD)) return;

      var label;
      if (overdue) label = 'Overdue';
      else if (dayOffset === 0) label = 'Due today';
      else if (dayOffset === 1) label = 'Tomorrow';
      else label = 'Coming up';

      items.push({
        entry: entry,
        date: date,
        dayOffset: dayOffset,
        overdue: overdue,
        label: label
      });
    });

    items.sort(function (a, b) {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return a.date - b.date;
    });
    return items;
  }

  return { getItems: getItems };
})();
