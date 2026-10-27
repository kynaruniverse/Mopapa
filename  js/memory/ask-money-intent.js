
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.moneyIntent = (function () {
  var norm = Mopapa.askParts.text.norm;

  function isCostQuestion(q) {
    var n = norm(q);

    // A date question should be handled by date retrieval.
    if (Mopapa.askParts.dateIntent.isWhenQuestion(n)) {
      return false;
    }

    // Explicit requests for a price, cost, or amount.
    if (/\b(cost|costs|price|priced|pricing|expensive|cheap|charge|charges|charged|payment|payments|how much|what amount|what did .* cost)\b/.test(n)) {
      return true;
    }

    // Payment and spending verbs count only when asking about an amount.
    return /\b(pay|paid|spend|spent|spending)\b/.test(n) &&
      /\b(amount|total|much|cost|price|money)\b/.test(n);
  }

  return {
    isCostQuestion: isCostQuestion
  };
})();
