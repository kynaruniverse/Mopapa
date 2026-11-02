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

  if (M.store.data().storageUnavailable) {
    M.dialog.notice(
      'Mopapa could not access this browser’s saved data. Your existing memories have not been loaded. Do not add or restore anything yet. Check browser storage permissions and reload Mopapa.'
    );
  } else if (M.store.data().corrupt) {
    M.dialog.notice(
      M.store.data().corruptCopySaved
        ? 'Your saved data could not be read. A copy was preserved in this browser. Use Download recovery copy to save it to a file.'
        : 'Your saved data could not be read, and the browser could not preserve a recovery copy. Check whether any existing backup is available.'
    );
  } else if (M.store.data().rejectedEntries) {
    var rejectedCount = M.store.data().rejectedEntries;
    var recoverySaved = M.store.data().recoveryCopySaved;

    M.dialog.notice(
      rejectedCount + ' saved entr' + (rejectedCount === 1 ? 'y was' : 'ies were') +
      ' rejected because the data was invalid. ' +
      (recoverySaved
        ? 'A copy of the original saved data was preserved in this browser. Use Download recovery copy to save it to a file before making further changes.'
        : 'Mopapa could not create a recovery copy, so back up any entries that remain before making further changes.')
    );
  }

  var n = M.store.data().entries.length;

  if (M.store.data().storageUnavailable) {
    M.pet.say("I can't access your saved memories right now. Please reload me after checking browser storage. Don't enter new memories until then.");
  } else if (M.store.data().corrupt) {
    M.pet.say("I couldn't read your saved memories, so I've locked normal changes to protect the original data. Download a recovery copy if available, or restore a valid backup.");
  } else {
    M.pet.say(n
      ? "Welcome back. I'm keeping " + n + ' thing' + (n === 1 ? '' : 's') + ' in this browser.'
      : "Hi, I'm Mopapa. Tell me anything and I'll file it in the right room. Everything stays in this browser only. Use Back up data to start a download you can keep separately.");
  }
    
  if (M.store.data().roomRepairSaveFailed) {
    M.pet.say(
      "I found an entry assigned to a missing room, but couldn't save the repair. The entry has been left unchanged. Back up your data and check available browser storage."
    );
  }    
    
    document.getElementById('btn-export').addEventListener('click', function () {
    try {
      M.store.exportJSON();
      M.pet.say('Backup download started. Check your Downloads folder before relying on it.');
    } catch (e) {
      if (M.store.saveError() === 'conflict') {
        M.pet.say("Your saved data changed in another tab. I didn't create an outdated backup. Reload Mopapa, check your memories, then try again.");
      } else if (M.store.saveError() === 'corrupt') {
        M.pet.say("Your saved data is unreadable. I didn't create a misleading backup. Use Download recovery copy if available, or restore a valid backup.");
      } else {
        M.pet.say("I couldn't start the backup download. Your saved data is still in this browser.");
      }
    }
  });

  var recoveryButton = document.getElementById('btn-recovery-export');
  var recoveryPanel = document.getElementById('recovery-panel');
  var recoveryList = document.getElementById('recovery-copy-list');

  function renderRecoveryCopies() {
    var copies = M.store.recoveryCopies();

    recoveryButton.hidden = copies.length === 0;
    recoveryPanel.hidden = copies.length === 0;
    recoveryList.innerHTML = '';

    copies.forEach(function (copy) {
      var item = document.createElement('li');
      var details = document.createElement('div');
      var label = document.createElement('p');
      var date = document.createElement('p');
      var button = document.createElement('button');

      item.className = 'recovery-copy-item';
      details.className = 'recovery-copy-details';
      label.className = 'recovery-copy-label';
      date.className = 'recovery-copy-date';

      label.textContent = copy.kind === 'corrupt'
        ? 'Corrupt-data copy'
        : 'Rejected-entry recovery';

      if (
        copy.timestamp !== null &&
        isFinite(new Date(copy.timestamp).getTime())
      ) {
        date.textContent = new Date(copy.timestamp).toLocaleString();
      } else {
        date.textContent = 'Date unavailable';
      }

      if (copy.sequence > 0) {
        date.textContent += ' · Copy ' + (copy.sequence + 1);
      }

      button.type = 'button';
      button.className = 'recovery-copy-download';
      button.textContent = 'Download copy';

      button.addEventListener('click', function () {
        if (M.store.exportRecoveryCopy(copy.key)) {
          M.pet.say('Recovery download started. Check your Downloads folder before relying on it.');
        } else {
          M.pet.say("I couldn't export that recovery copy. The original may still be in this browser.");
        }
      });

      details.appendChild(label);
      details.appendChild(date);
      item.appendChild(details);
      item.appendChild(button);
      recoveryList.appendChild(item);
    });
  }

  recoveryButton.addEventListener('click', function () {
    try {
      if (M.store.exportRecoveryCopy()) {
        M.pet.say('Newest recovery download started. Check your Downloads folder before relying on it.');
      } else {
        renderRecoveryCopies();
        M.pet.say("I couldn't export a recovery copy. The original saved data may still be in this browser.");
      }
    } catch (e) {
      M.pet.say("I couldn't start the recovery download. Check whether browser downloads are available.");
    }
  });

  renderRecoveryCopies();

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
          
          if (M.store.data().roomRepairSaveFailed) {
            M.pet.say(
              "The backup was restored, but I couldn't save a room repair. Back up your data and check available browser storage."
            );
          } else {
            M.pet.say('Backup restored successfully. Your saved data has been replaced with the backup.');
          }
        });
      },
      true
    );
  });
})();
