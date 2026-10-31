var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.ask = (function () {
  var norm = Mopapa.askParts.text.norm;
  var termsClose = Mopapa.askParts.match.termsClose;
  var extractTextDate = Mopapa.askParts.dateText.extractTextDate;
  var textDateMatchesFilter = Mopapa.askParts.dateText.textDateMatchesFilter;
  var dateFilter = Mopapa.askParts.dateFilter.dateFilter;
  var explicitDateFilter = Mopapa.askParts.dateFilter.explicitDateFilter;
  var loggedOn = Mopapa.askParts.dateFilter.loggedOn;
  var isLoggedQuestion = Mopapa.askParts.dateIntent.isLoggedQuestion;
  var isWhenQuestion = Mopapa.askParts.dateIntent.isWhenQuestion;
  var isScheduledDateQuestion = Mopapa.askParts.dateIntent.isScheduledDateQuestion;
  var isCostQuestion = Mopapa.askParts.moneyIntent.isCostQuestion;
  var MONTH_NAMES = Mopapa.askParts.dateText.MONTH_NAMES;
  var words = Mopapa.askParts.text.words;
  var stem = Mopapa.askParts.text.stem;
  var questionIntent = Mopapa.askParts.questionIntent;
  var roomForQuestion = Mopapa.askParts.roomIntent.roomForQuestion;
  var queryTerms = Mopapa.askParts.query.queryTerms;

  var aliasModule = Mopapa.askParts.aliases;
  var learning = Mopapa.askParts.learning;

  var matchContext = Mopapa.askParts.matchContext.create({
    norm: norm,
    stem: stem,
    aliases: aliasModule.map,
    termsClose: termsClose,
    learnedData: learning.learnedData,
    sortNewest: sortNewest
  });

  function entryStems(e) {
    return matchContext.entryStems(e);
  }

  function includesAllTerms(e, terms) {
    return matchContext.includesAllTerms(e, terms);
  }
  
  function rankedMatches(entries, terms, room, sig) {
    return matchContext.rankedMatches(
      entries,
      terms,
      room,
      sig
    );
  }

  // ---- Structured facts ----

  var currentLocations = Mopapa.askParts.facts.currentLocations;
  var isStale = Mopapa.askParts.facts.isStale;

  function formatMoney(n) {
    return Mopapa.askParts.moneyFormat.formatMoney(n);
  }

  
  function roomName(id) {
    var r = Mopapa.roomById(id);
    return r ? r.name : 'Unknown room';
  }

  function sortNewest(a, b) {
    return new Date(b.created) - new Date(a.created);
  }

  function sortByWhen(a, b) {
    return Mopapa.rules.dateForEntry(a.when, a.hasTime) -
      Mopapa.rules.dateForEntry(b.when, b.hasTime);
  }
  
  function answerCost(q, all, room, date) {
    return Mopapa.askParts.moneyAnswer.answerCost(
      q,
      all,
      room,
      date,
      {
        norm: norm,
        queryTerms: queryTerms,
        loggedOn: loggedOn,
        textDateMatchesFilter: textDateMatchesFilter,
        sortNewest: sortNewest,
        includesAllTerms: includesAllTerms,
        words: words,
        stem: stem,
        formatMoney: formatMoney,
        confirmedBySig: learning.confirmedBySig,
        signatureOf: learning.signatureOf
      }
    );
  }

  function answer(q) {
    var now = new Date();
    var storeData = Mopapa.store && Mopapa.store.data
      ? Mopapa.store.data()
      : null;

    if (!storeData || !Array.isArray(storeData.entries)) {
      return {
        answer: 'I cannot read your saved entries right now.',
        sources: []
      };
    }

    var all = storeData.entries.slice();

    var room = roomForQuestion(q);
    var date = explicitDateFilter(
      q,
      now,
      norm,
      extractTextDate,
      isLoggedQuestion,
      isScheduledDateQuestion,
      MONTH_NAMES
    ) || dateFilter(q, now, norm, isScheduledDateQuestion);
    learning.applyLearned();

    var terms = queryTerms(q, room);
    var sig = terms.slice().sort().join(' ');

    if (
      !terms.length &&
      !room &&
      !date &&
      !isLoggedQuestion(q) &&
      !Mopapa.askParts.people.asksWhoSomethingIsFor(q)
    ) {
      return {
        answer: 'Ask me about something specific, like “when is the dentist?”',
        sources: []
      };
    }

    var resolution = Mopapa.askParts.matchResolution.resolveMatches(
      q,
      all,
      terms,
      room,
      date,
      sig,
      {
        loggedOn: loggedOn,
        textDateMatchesFilter: textDateMatchesFilter,
        includesAllTerms: includesAllTerms,
        isCostQuestion: isCostQuestion,
        rankedMatches: rankedMatches,
        questionIntent: questionIntent,
        norm: norm,
        stem: stem,
        locationMatchScore: Mopapa.askParts.facts.locationMatchScore
      }
    );

    if (resolution.response) return resolution.response;

    var matches = resolution.matches;
    var isLocationQuestion = resolution.isLocationQuestion;
    
    // Structured answers: item lists take priority over location lookups.
    var structuredAnswer = Mopapa.askParts.factAnswer.answerStructured(
      q,
      terms,
      all,
      date,
      isLocationQuestion,
      {
        norm: norm,
        words: words,
        stem: stem,
        aliases: aliasModule.map,
        confirmedBySig: learning.confirmedBySig
      }
    );

    if (structuredAnswer) return structuredAnswer;

    var nextAppointmentAnswer = Mopapa.askParts.dateOverview.answerNextAppointment(
      q,
      all,
      sortByWhen
    );

    if (nextAppointmentAnswer) return nextAppointmentAnswer;

    var overdueAnswer = Mopapa.askParts.dateOverview.answerOverdueTasks(
      q,
      all,
      sortByWhen
    );

    if (overdueAnswer) return overdueAnswer;

    var whenAnswer = Mopapa.askParts.dateAnswer.answerWhen(
      q,
      matches,
      sig,
      {
        isWhenQuestion: isWhenQuestion,
        sortByWhen: sortByWhen,
        confirmedBySig: learning.confirmedBySig,
        extractTextDate: extractTextDate
      }
    );

    if (whenAnswer) return whenAnswer;

    var whoForAnswer = Mopapa.askParts.personAnswer.answerWhoSomethingIsFor(
      q,
      matches
    );

    if (whoForAnswer) return whoForAnswer;
   
    var locationAnswer = Mopapa.askParts.locationAnswer.answerLocation(
      q,
      matches,
      isLocationQuestion,
      norm
    );

    if (locationAnswer) return locationAnswer;
    
    var calledNameAnswer = Mopapa.askParts.personAnswer.answerCalledName(
      q,
      matches
    );

    if (calledNameAnswer) return calledNameAnswer;

    matches.sort(sortNewest);

    if (isCostQuestion(q)) {
      return answerCost(q, all, room, date);
    }

    return Mopapa.askParts.results.answerMatches(q, matches, {
      all: all,
      date: date,
      room: room,
      roomName: roomName,
      norm: norm,
      questionIntent: questionIntent,
      currentLocations: currentLocations,
      isStale: isStale
    });
  }

  return {
    answer: answer,
    addAlias: aliasModule.addAlias,
    teachAlias: learning.teachAlias,
    forgetAlias: learning.forgetAlias,
    confirmSource: learning.confirmSource,
    clearConfirmed: learning.clearConfirmed,
    logUnanswered: learning.logUnanswered,
    clearUnanswered: learning.clearUnanswered,
    learned: learning.learned
  };
})();