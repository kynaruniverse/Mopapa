var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.personAnswer = (function () {
  var people = Mopapa.askParts.people;

  function answerWhoSomethingIsFor(q, matches) {
    if (!people.asksWhoSomethingIsFor(q)) return null;

    var recipients = Object.create(null);
    var distinctNames = [];

    matches.forEach(function (entry) {
      var name = people.extractForPerson(entry.text);

      if (!name) return;

      var key = name.toLowerCase();

      if (!recipients[key]) {
        recipients[key] = {
          name: name,
          entries: []
        };

        distinctNames.push(key);
      }

      recipients[key].entries.push(entry);
    });

    if (distinctNames.length === 1) {
      var recipient = recipients[distinctNames[0]];

      return {
        answer: 'It looks like it is for ' + recipient.name + '.',
        sources: recipient.entries.slice(0, 5)
      };
    }

    if (distinctNames.length > 1) {
      return {
        answer: 'I found more than one possible recipient. Which parcel or item do you mean?',
        sources: distinctNames.reduce(function (all, key) {
          return all.concat(recipients[key].entries);
        }, []).slice(0, 5)
      };
    }

    return {
      answer: 'I could not find who that is for. I will not guess.',
      sources: []
    };
  }

  function answerCalledName(q, matches) {
    if (!matches.length || !people.isNameQuestion(q)) return null;

    var namedMatches = [];

    matches.forEach(function (entry) {
      var person = people.extractCalledPerson(entry.text);

      if (person) {
        namedMatches.push({
          entry: entry,
          person: person
        });
      }
    });

    if (!namedMatches.length) return null;

    var distinctNames = [];

    namedMatches.forEach(function (item) {
      var key = item.person.name.toLowerCase();

      if (distinctNames.indexOf(key) === -1) {
        distinctNames.push(key);
      }
    });

    if (distinctNames.length > 1) {
      return {
        answer: 'I found more than one possible person in your saved entries. Which job or appointment do you mean?',
        sources: namedMatches.slice(0, 5).map(function (item) {
          return item.entry;
        })
      };
    }

    return {
      answer: 'The ' + namedMatches[0].person.role +
        ' is called ' + namedMatches[0].person.name + '.',
      sources: [namedMatches[0].entry]
    };
  }

  return {
    answerWhoSomethingIsFor: answerWhoSomethingIsFor,
    answerCalledName: answerCalledName
  };
})();