
var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.questionIntent = (function () {
  var norm = Mopapa.askParts.text.norm;

  function isLocationQuestion(q) {
    var n = norm(q);

    return /\bwhere\b/.test(n) ||
      /\bwhich\s+(?:folder|drawer|room|place)\b/.test(n);
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

  return {
    isLocationQuestion: isLocationQuestion,
    isDirectQuestion: isDirectQuestion,
    isItemsQuestion: isItemsQuestion
  };
})();
