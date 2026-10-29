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

  if (M.store.data().corrupt) {
    M.dialog.notice('Your saved data could not be read. A copy was kept in this browser.');
  } else if (M.store.data().rejectedEntries) {
    var rejectedCount = M.store.data().rejectedEntries;
    var recoverySaved = M.store.data().recoveryCopySaved;

    M.dialog.notice(
      rejectedCount + ' saved entr' + (rejectedCount === 1 ? 'y was' : 'ies were') +
      ' rejected because the data was invalid. ' +
      (recoverySaved
        ? 'A copy of the original saved data was kept in this browser under a recovery key. Back up your data before making further changes.'
        : 'Mopapa could not create a recovery copy, so back up any entries that remain before making further changes.')
    );
  }

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

  var importButton = document.getElementById('btn-import');
  var importInput = document.getElementById('file-import');

  importButton.addEventListener('click', function () {
    importInput.value = '';
    importInput.click();
  });

  importInput.addEventListener('change', function () {
    var file = importInput.files && importInput.files[0];
    if (!file) return;

    importInput.value = '';

    if (file.size > 5 * 1024 * 1024) {
      M.pet.say('That backup is larger than 5 MB. Choose a smaller backup file.');
      return;
    }

    M.dialog.confirm(
      'Restoring this backup will replace all Mopapa data currently saved in this browser. Back up your current data first if you want to keep it.',
      'Restore backup',
      function () {
        M.store.importJSON(file, function (ok) {
          if (!ok) {
            M.pet.say("I couldn't restore that backup. The existing saved data has been kept.");
            return;
          }

          M.customRooms.reload();
          M.room.renderRooms();
          M.refreshPanels();
          M.askLearningUI.render();
          
          M.pet.say('Backup restored successfully. Your saved data has been replaced with the backup.');
        });
      },
      true
    );
  });
})();
