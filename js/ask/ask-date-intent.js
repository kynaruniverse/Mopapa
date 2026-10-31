var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.dateIntent = (function () {
  var norm = Mopapa.askParts.text.norm;

  function isLoggedQuestion(q) {
    var n = norm(q);

    return /\bwhat happened on\b/.test(n) ||
      /\bwhat happened at\b/.test(n) ||
      /\bwhat took place on\b/.test(n) ||
      /\bwhat did i do on\b/.test(n) ||
      /\bwhat did i save\b/.test(n) ||
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

  return {
    isLoggedQuestion: isLoggedQuestion,
    isWhenQuestion: isWhenQuestion,
    isScheduledDateQuestion: isScheduledDateQuestion,
    isGeneralNextAppointmentQuestion: isGeneralNextAppointmentQuestion,
    isOverdueTaskQuestion: isOverdueTaskQuestion
  };
})();