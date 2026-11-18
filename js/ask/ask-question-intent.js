
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.questionIntent = (function () {
  var norm = Mopapa.askParts.text.norm;

  function isLocationQuestion(q) {
    var n = norm(q);

    return /\bwhere\b/.test(n) ||
      /\bwhich\s+(?:folder|drawer|room|place)\b/.test(n);
  }

  function isNegatedLocationQuestion(q) {
    var clauses = String(q || '').split(/[.!?;]+/);
    var negativePattern =
      /\b(?:where|which\s+(?:folder|drawer|room|place))\s+(?:(?:did|do|does|have|has|had|would|could|should|can|will|must|is|are|was|were)\s+)?(?:(?:i|we|you|they|he|she|it)\s+)?(?:not|never|no|didnt|dont|doesnt|isnt|wasnt|werent|hasnt|havent|wouldnt|couldnt|shouldnt|cant|cannot|wont|mustnt)\b/;

    for (var i = 0; i < clauses.length; i++) {
      var clause = norm(clauses[i]);

      if (!isLocationQuestion(clause)) continue;

      return negativePattern.test(clause);
    }

    return false;
  }

  function isDirectQuestion(q) {
    var n = norm(q);

    return (
      /\bwhere did i leave\b/.test(n) ||
      /\bwhat do you remember about\b/.test(n) ||
      /\bwhat do i know\b/.test(n) ||
      /\bwhat did i save\b/.test(n) ||
      /\bwhat have i saved\b/.test(n) ||
      /\bwhat did i record\b/.test(n) ||
      /\bwhat have i recorded\b/.test(n) ||
      /\bwhat did i log\b/.test(n) ||
      /\bwhat have i logged\b/.test(n) ||
      /\bwhat did i add\b/.test(n) ||
      /\bwhat have i added\b/.test(n) ||
      /\bwhat did i write\b/.test(n) ||
      /\bwhat did i put\b/.test(n) ||
      /\bwhat idea did i save\b/.test(n) ||
      /\bwhat ideas did i save\b/.test(n) ||
      /\bwhat is the idea i saved\b/.test(n) ||
      /\bwhat are the ideas i saved\b/.test(n) ||
      /\bwhat idea have i saved\b/.test(n) ||
      /\bwhat ideas have i saved\b/.test(n) ||
      /\bwhat gift ideas\b/.test(n)
    );
  }

  function isItemsQuestion(q) {
    var n = norm(q);

    return /\b(what|which)\b/.test(n) &&
      /\b(item|items|thing|things|object|objects)\b/.test(n) &&
      /\b(in|inside|on|under|behind|beside|within)\b/.test(n);
  }

  function isHistoricalQuestion(q) {
    var n = norm(q);

    return /\b(before|previously|previous|earlier|original|originally|initial|initially)\b/.test(n) ||
      /\b(?:when|what date|what time)\s+(?:was|were)\b/.test(n);
  }

  function isOriginalQuestion(q) {
    var n = norm(q);

    return /\b(original|originally|initial|initially)\b/.test(n);
  }

  function isPreviousQuestion(q) {
    var n = norm(q);

    return /\b(previous|previously|before|earlier)\b/.test(n);
  }
  
  return {
    isLocationQuestion: isLocationQuestion,
    isNegatedLocationQuestion: isNegatedLocationQuestion,
    isDirectQuestion: isDirectQuestion,
    isItemsQuestion: isItemsQuestion,
    isHistoricalQuestion: isHistoricalQuestion,
    isOriginalQuestion: isOriginalQuestion,
    isPreviousQuestion: isPreviousQuestion
  };
})();
