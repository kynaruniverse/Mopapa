var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.rooms = [
  { id: 'todo', name: 'To-dos', icon: '✅', dated: true, words: [
    'remind me', 'reminder', 'need to', 'have to', 'must', 'dont forget',
    'to do', 'todo', 'remember to', 'should', 'call', 'email', 'pay',
    'book', 'renew', 'finish', 'send', 'tidy', 'clean'
  ]},
  { id: 'appointments', name: 'Appointments', icon: '📅', dated: true, words: [
    'appointment', 'doctor', 'doctors', 'dentist', 'dental', 'gp', 'hospital',
    'meeting', 'interview', 'optician', 'vet', 'haircut', 'barber',
    'check up', 'checkup', 'consultation', 'physio', 'scan'
  ]},
  { id: 'wishlist', name: 'Wish list', icon: '🎁', words: [
    'wishlist', 'wish list', 'i want', 'want to buy', 'wanna buy', 'buy',
    'purchase', 'treat myself', 'would love', 'save up for'
  ]},
  { id: 'feelings', name: 'Feelings', icon: '💭', words: [
    'i feel', 'im feeling', 'feeling', 'feel', 'happy', 'sad', 'anxious',
    'stressed', 'tired', 'angry', 'excited', 'lonely', 'proud', 'overwhelmed',
    'calm', 'worried', 'good day', 'bad day', 'rough day', 'great day', 'mood'
  ]},
  { id: 'ideas', name: 'Ideas', icon: '💡', words: [
    'idea for', 'idea', 'what if', 'maybe i could', 'could build',
    'brainstorm', 'concept', 'invention', 'imagine', 'project idea'
  ]},
  { id: 'notes', name: 'Notes', icon: '📝', words: [
    'note', 'notes', 'fyi', 'remember that', 'keep in mind', 'fact'
  ]}
];

Mopapa.roomById = function (id) {
  for (var i = 0; i < Mopapa.rooms.length; i++) {
    if (Mopapa.rooms[i].id === id) return Mopapa.rooms[i];
  }
  return { id: 'unsorted', name: 'Unsorted', icon: '📥', words: [] };
};

Mopapa.refreshPanels = function () {
  if (Mopapa.keepsakesUI) Mopapa.keepsakesUI.render();
  if (Mopapa.agendaUI) Mopapa.agendaUI.render();
  if (Mopapa.resurfaceUI) Mopapa.resurfaceUI.refresh();
  if (Mopapa.searchUI) Mopapa.searchUI.refresh();
  if (Mopapa.tagExplorerUI) Mopapa.tagExplorerUI.render();
};