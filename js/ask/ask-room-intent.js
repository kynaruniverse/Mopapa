var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.askParts = Mopapa.askParts || {};

Mopapa.askParts.roomIntent = (function () {
  var hasPhrase = Mopapa.askParts.text.hasPhrase;
  var stem = Mopapa.askParts.text.stem;

  var ROOM_WORDS = [
    'todo', 'todos', 'task', 'tasks', 'reminder', 'reminders', 'appointment',
    'appointments', 'feel', 'feeling', 'feelings', 'mood', 'moods', 'wish',
    'wishlist', 'list', 'idea', 'ideas', 'note', 'notes'
  ];

  var ROOM_STEMS = ROOM_WORDS.map(function (w) {
    return stem(w);
  });

  function roomForQuestion(q) {
    var tests = [
      {
        id: 'todo',
        words: ['to do', 'todo', 'todos', 'task', 'tasks']
      },
      {
        id: 'appointments',
        words: [
          'appointment', 'appointments', 'dentist', 'doctor',
          'doctors', 'gp', 'hospital', 'meeting', 'interview',
          'vet', 'check up'
        ]
      },
      {
        id: 'wishlist',
        words: [
          'wish list', 'wishlist', 'shopping list', 'things to buy'
        ]
      },
      {
        id: 'feelings',
        words: ['feeling', 'feelings', 'mood', 'moods']
      },
      {
        id: 'ideas',
        words: ['idea', 'ideas']
      },
      {
        id: 'notes',
        words: ['note', 'notes']
      }
    ];

    for (var i = 0; i < tests.length; i++) {
      for (var j = 0; j < tests[i].words.length; j++) {
        if (hasPhrase(q, tests[i].words[j])) {
          return tests[i].id;
        }
      }
    }

    for (var k = 0; k < Mopapa.rooms.length; k++) {
      var candidate = Mopapa.rooms[k];

      if (
        candidate.id.indexOf('custom_') === 0 &&
        hasPhrase(q, candidate.name)
      ) {
        return candidate.id;
      }
    }

    return null;
  }

  return {
    roomForQuestion: roomForQuestion,
    roomStems: ROOM_STEMS.slice()
  };
})();