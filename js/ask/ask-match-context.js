var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.matchContext = (function () {
  function create(helpers) {
    function entryStems(entry) {
      return Mopapa.askParts.match.entryStems(
        entry,
        helpers.norm,
        helpers.stem
      );
    }

    function includesAllTerms(entry, terms) {
      return Mopapa.askParts.match.includesAllTerms(
        entry,
        terms,
        entryStems,
        helpers.aliases
      );
    }

    function rankedMatches(entries, terms, room, signature) {
      return Mopapa.askParts.ranking.rankedMatches(
        entries,
        terms,
        room,
        signature,
        {
          aliases: helpers.aliases,
          termsClose: helpers.termsClose,
          learnedData: helpers.learnedData,
          entryStems: entryStems,
          sortNewest: helpers.sortNewest
        }
      );
    }

    return {
      entryStems: entryStems,
      includesAllTerms: includesAllTerms,
      rankedMatches: rankedMatches
    };
  }

  return {
    create: create
  };
})();