var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.dateOverview = (function () {
  var dateIntent = Mopapa.askParts.dateIntent;

  function answerNextAppointment(q, all, sortByWhen) {
    if (!dateIntent.isGeneralNextAppointmentQuestion(q)) return null;

    var upcomingAppointments = all.filter(function (e) {
      return e.room === 'appointments' &&
        !e.done &&
        e.when &&
        !isNaN(Mopapa.rules.dateForEntry(e.when, e.hasTime).getTime()) &&
        !Mopapa.rules.isPast(e.when, e.hasTime);
    }).sort(sortByWhen);

    if (upcomingAppointments.length) {
      var nextAppointment = upcomingAppointments[0];
      var nextLabel = Mopapa.rules.describe(
        Mopapa.rules.dateForEntry(nextAppointment.when, nextAppointment.hasTime),
        nextAppointment.hasTime
      );

      return {
        answer: 'Your next appointment is ' +
          String(nextAppointment.text || 'your appointment')
            .replace(
              /\s+on\s+\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+\d{4})?(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))?/i,
              ''
            )
            .trim() +
          ' on ' + nextLabel + '.',
        sources: [nextAppointment]
      };
    }

    return {
      answer: 'I could not find any upcoming appointments with a saved date.',
      sources: []
    };
  }

  function answerOverdueTasks(q, all, sortByWhen) {
    if (!dateIntent.isOverdueTaskQuestion(q)) return null;

    var overdueTasks = all.filter(function (e) {
      return e.room === 'todo' &&
        !e.done &&
        e.when &&
        !isNaN(Mopapa.rules.dateForEntry(e.when, e.hasTime).getTime()) &&
        Mopapa.rules.isPast(e.when, e.hasTime);
    }).sort(sortByWhen);

    if (overdueTasks.length) {
      return {
        answer: 'You have ' + overdueTasks.length +
          ' overdue ' +
          (overdueTasks.length === 1 ? 'task' : 'tasks') +
          ':\n' +
          overdueTasks.map(function (e) {
            return '• ' + e.text;
          }).join('\n'),
        sources: overdueTasks.slice(0, 8)
      };
    }

    return {
      answer: 'I could not find any overdue tasks with a saved date.',
      sources: []
    };
  }

  return {
    answerNextAppointment: answerNextAppointment,
    answerOverdueTasks: answerOverdueTasks
  };
})();