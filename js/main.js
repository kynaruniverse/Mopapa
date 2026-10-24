(function () {
  var M = window.Mopapa;
  M.store.load();
  M.customRooms.init();
  M.pet.init();
  M.talk.init();
  M.room.init();
  M.keepsakesUI.init();
  M.tagExplorerUI.init();
  M.agendaUI.init();
  M.searchUI.init();
  M.resurfaceUI.init();
  M.customRoomsUI.init();
  M.askLearningUI.init();

  if (M.store.data().corrupt) M.dialog.notice('Your saved data could not be read. A copy was kept in this browser.');

  var n = M.store.data().entries.length;
  M.pet.say(n
    ? "Welcome back. I'm keeping " + n + ' thing' + (n === 1 ? '' : 's') + ' in this browser.'
    : "Hi, I'm Mopapa. Tell me anything and I'll file it in the right room. Everything stays in this browser only. Use Back up data to start a download you can keep separately.");

  document.getElementById('btn-export').addEventListener('click', function () {
    try {
      M.store.exportJSON();
      M.pet.say('Backup download started. Check your Downloads folder before relying on it.');
    } catch (e) {
      M.pet.say("I couldn't start the backup download. Your saved data is still in this browser.");
    }
  });
})();
