var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.factAnswer = (function () {
  function answerStructured(q, terms, all, date, isLocationQuestion, helpers) {
    if (date) return null;

    var facts = Mopapa.askParts.facts;

    var placeList = facts.structuredItems(
      q,
      all,
      {
        norm: helpers.norm,
        words: helpers.words,
        stem: helpers.stem,
        dets: facts.dets,
        currentLocations: facts.currentLocations,
        whereStems: facts.whereStems
      }
    );

    if (placeList) return placeList;

    if (!isLocationQuestion) return null;

    return facts.structuredWhere(
      terms,
      all,
      {
        currentLocations: facts.currentLocations,
        aliases: helpers.aliases,
        confirmedBySig: helpers.confirmedBySig
      }
    );
  }

  return {
    answerStructured: answerStructured
  };
})();