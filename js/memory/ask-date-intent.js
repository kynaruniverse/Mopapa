
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.dateIntent = (function () {
  var norm = Mopapa.askParts.text.norm;

  function isLoggedQuestion(q) {
    var n = norm(q);

    return /\bwhat did i save\b/.test(n) ||
      /\bwhat have i saved\b/.test(n) ||
      /\bwhat did i log\b/.test(n) ||
      /\bwhat have i logged\b/.test(n) ||
      /\bwhat did i record\b/.test(n) ||
      /\bwhat have i recorded\b/.test(n) ||
      /\bwhat did i add\b/.test(n) ||
      /\bwhat have i added\b/.test(n) ||
      /\bwhat did i write\b/.test(n) ||
      /\bwhat did i put\b/.test(n) ||
      /\bwhat did i note\b/.test(n) ||
      /\bwhat was saved\b/.test(n) ||
      /\bwhat was logged\b/.test(n) ||
      /\bwhat was recorded\b/.test(n) ||
      /\bentries did i\b/.test(n) ||
      /\bsaved on\b/.test(n) ||
      /\blogged on\b/.test(n) ||
      /\brecorded on\b/.test(n);
  }

  function isWhenQuestion(q) {
    var n = norm(q);

    if (isLoggedQuestion(n)) return false;

    if (
      /\bnext\b/.test(n) &&
      /\b(wishlist|wish list|idea|ideas|task|tasks|reminder|reminders)\b/.test(n) &&
      !/\b(appointment|dentist|doctor|vet|meeting|interview|due|date|time)\b/.test(n)
    ) {
      return false;
    }

    return /\b(when|what time|what date|next)\b/.test(n) ||
      /\bwhat is due\b/.test(n) ||
      /\bwhat's due\b/.test(n) ||
      /\bwhen is\b/.test(n) ||
      /\bwhen are\b/.test(n);
  }

  function isScheduledDateQuestion(q) {
    var n = norm(q);

    if (isLoggedQuestion(n)) return false;

    return isWhenQuestion(n) ||
      /\b(due|scheduled|appointment|appointments|reminder|reminders)\b/.test(n);
  }

  function isGeneralNextAppointmentQuestion(q) {
    var n = norm(q);

    return /\bnext\b/.test(n) &&
      /\b(appointment|appointments)\b/.test(n) &&
      !/\b(dentist|doctor|gp|hospital|meeting|interview|vet)\b/.test(n);
  }

  function isOverdueTaskQuestion(q) {
    var n = norm(q);

    return /\b(overdue|over due|overdue tasks|overdue todos|past due)\b/.test(n) ||
      /\b(which|what|show|list)\b.*\b(tasks|todos|to do|reminders)\b.*\b(overdue|past due)\b/.test(n);
  }

  function answerNextAppointment(q, all, sortByWhen) {
    if (!isGeneralNextAppointmentQuestion(q)) return null;

    var upcomingAppointments = all.filter(function (e) {
      return e.room === 'appointments' &&
        !e.done &&
        e.when &&
        !isNaN(new Date(e.when).getTime()) &&
        !Mopapa.rules.isPast(e.when, e.hasTime);
    }).sort(sortByWhen);

    if (upcomingAppointments.length) {
      var nextAppointment = upcomingAppointments[0];
      var nextLabel = Mopapa.rules.describe(
        new Date(nextAppointment.when),
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
    if (!isOverdueTaskQuestion(q)) return null;


    var overdueTasks = all.filter(function (e) {
      return e.room === 'todo' &&
        !e.done &&
        e.when &&
        !isNaN(new Date(e.when).getTime()) &&
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
    isLoggedQuestion: isLoggedQuestion,
    isWhenQuestion: isWhenQuestion,
    isScheduledDateQuestion: isScheduledDateQuestion,
    isGeneralNextAppointmentQuestion: isGeneralNextAppointmentQuestion,
    isOverdueTaskQuestion: isOverdueTaskQuestion,
    answerOverdueTasks: answerOverdueTasks,
    answerNextAppointment: answerNextAppointment
  };
})();
