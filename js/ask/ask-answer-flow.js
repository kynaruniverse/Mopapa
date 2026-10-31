var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.answerFlow = (function () {
  var ANSWER_ORDER = [
    'structured',
    'nextAppointment',
    'overdue',
    'when',
    'whoFor',
    'location',
    'calledName'
  ];

  function resolve(q, matches, context) {
    var handlers = context.handlers;

    for (var i = 0; i < ANSWER_ORDER.length; i++) {
      var handler = handlers[ANSWER_ORDER[i]];

      if (typeof handler !== 'function') continue;

      var result = handler(q, matches);

      if (result) return result;
    }

    matches.sort(context.sortNewest);

    if (context.isCostQuestion(q)) {
      return handlers.cost(q, matches);
    }

    return handlers.fallback(q, matches);
  }

  return {
    resolve: resolve
  };
})();
