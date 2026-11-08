(function () {
  var M = window.Mopapa;
  var started = false;

  function start(writeMode) {
    if (started) return;
    started = true;

    M.store.setWriteMode(writeMode);
    M.store.load();

    var writeStatus = document.getElementById('write-status');

    if (writeStatus && writeMode === 'readonly') {
      writeStatus.textContent =
        'This tab is read-only because Mopapa is already open in another tab. Close the other tab, then reload this one to make changes.';
      writeStatus.hidden = false;
    } else if (writeStatus && writeMode === 'unprotected') {
      writeStatus.textContent =
        'This browser does not support Mopapa’s single-tab write protection. Avoid editing Mopapa in more than one tab at a time.';
      writeStatus.hidden = false;
    }

    var storageProtectionStatus = document.getElementById(
      'storage-protection-status'
    );

    var storageProtectionButton = document.getElementById(
      'storage-protection-request'
    );

    function renderStorageProtection(result) {
      if (!storageProtectionStatus || !storageProtectionButton) {
        return;
      }

      if (!result.supported) {
        storageProtectionStatus.textContent =
          'This browser does not offer persistent-storage protection. Keep a separate backup of your memories.';
        storageProtectionButton.hidden = true;
        return;
      }

      if (result.persisted) {
        storageProtectionStatus.textContent =
          'This browser has granted persistent storage. This reduces automatic cleanup risk, but it is not a backup.';
        storageProtectionButton.hidden = true;
        return;
      }

      storageProtectionStatus.textContent = result.failed
        ? 'Mopapa could not check storage protection. You can still request it, and should keep a separate backup.'
        : 'Persistent storage has not been granted. You can ask the browser to protect Mopapa from automatic cleanup.';

      storageProtectionButton.hidden = false;
    }

    M.store.storagePersistenceStatus()
      .then(renderStorageProtection)
      .catch(function () {
        renderStorageProtection({
          supported: true,
          persisted: false,
          failed: true
        });
      });

    storageProtectionButton.addEventListener('click', function () {
      storageProtectionButton.disabled = true;
      storageProtectionStatus.textContent =
        'Requesting storage protection…';

      M.store.requestStoragePersistence()
        .then(function (result) {
          if (result.granted) {
            storageProtectionStatus.textContent =
              'The browser granted persistent storage. This reduces automatic cleanup risk, but it is not a backup.';
            storageProtectionButton.hidden = true;
          } else if (!result.supported) {
            storageProtectionStatus.textContent =
              'This browser does not offer persistent-storage protection. Keep a separate backup of your memories.';
            storageProtectionButton.hidden = true;
          } else {
            storageProtectionStatus.textContent = result.failed
              ? 'The browser could not complete the request. Keep a separate backup of your memories.'
              : 'The browser did not grant persistent storage. Mopapa will continue to work, but automatic cleanup remains possible.';
            storageProtectionButton.disabled = false;
          }
        })
        .catch(function () {
          storageProtectionStatus.textContent =
            'The request failed. Mopapa will continue to work, but automatic cleanup remains possible.';
          storageProtectionButton.disabled = false;
        });
    });

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
        : 'Your saved data could not be read, and the browser could not preserve a recovery copy. Use Download original data to save the exact original record before restoring a valid backup.'
    );
  } else if (M.store.data().rejectedEntries) {
    var rejectedCount = M.store.data().rejectedEntries;
    var recoverySaved = M.store.data().recoveryCopySaved;

    M.dialog.notice(
      rejectedCount + ' saved entr' + (rejectedCount === 1 ? 'y was' : 'ies were') +
      ' rejected because the data was invalid. ' +
      (recoverySaved
        ? 'A copy of the original saved data was preserved in this browser. Use Download recovery copy to save it to a file before making further changes.'
        : 'Mopapa could not preserve the original data in a separate browser copy. Changes have been locked to protect the original record. Use Download original data to save the exact original record. Back up data can export the readable entries, but that backup will not contain the rejected entries. Restore a valid backup to resume normal changes.')
    );
  }

  var n = M.store.data().entries.length;

  if (M.store.data().storageUnavailable) {
    M.pet.say("I can't access your saved memories right now. Please reload me after checking browser storage. Don't enter new memories until then.");
  } else if (M.store.data().corrupt) {
    M.pet.say("I couldn't read your saved memories, so I've locked normal changes to protect the original data. Download a recovery copy if available, or restore a valid backup.");
  } else if (M.store.data().recoveryBlocked) {
    M.pet.say("Some saved entries were invalid, and I couldn't preserve the original record separately. I've locked changes to protect it. Download the original data before restoring a valid backup.");
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
  var originalRecoveryButton = document.getElementById('btn-original-recovery-export');
  var recoveryPanel = document.getElementById('recovery-panel');
  var recoveryInventoryStatus = document.getElementById(
    'recovery-inventory-status'
  );

  originalRecoveryButton.hidden = !(
    M.store.data().recoveryBlocked ||
    (
      M.store.data().corrupt &&
      !M.store.data().corruptCopySaved
    )
  );
  
  var recoveryList = document.getElementById('recovery-copy-list');

  function renderRecoveryCopies() {
    var copies = M.store.recoveryCopies();

    recoveryList.innerHTML = '';

    if (copies === null) {
      recoveryButton.hidden = true;
      recoveryPanel.hidden = false;
      recoveryInventoryStatus.hidden = false;
      recoveryInventoryStatus.textContent =
        'Mopapa could not inspect the recovery-copy inventory. Existing copies may still be stored in this browser. No copies have been deleted. Keep browser storage intact and try again later.';
      return;
    }

    recoveryInventoryStatus.hidden = true;
    recoveryInventoryStatus.textContent = '';

    recoveryButton.hidden = copies.length === 0;
    recoveryPanel.hidden = copies.length === 0;

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
          renderRecoveryCopies();
          M.pet.say("I couldn't export that recovery copy. The inventory has been refreshed because the copy may no longer be available.");
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

  originalRecoveryButton.addEventListener('click', function () {
    if (M.store.exportOriginalRecoveryCopy()) {
      M.pet.say('The original saved data download has started. Check your Downloads folder and keep that file safe.');
    } else {
      M.pet.say("I couldn't download the original data. It remains unchanged in this browser. Do not clear browser storage.");
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
            if (M.store.saveError() === 'readonly') {
              M.pet.say(
                "I couldn't restore that backup because another Mopapa tab currently has editing access. Close the other tab and reload this one before restoring."
              );
            } else if (M.store.saveError() === 'conflict') {
              M.pet.say(
                "Your saved data changed in another tab. I cancelled the restore to avoid overwriting newer memories. Reload Mopapa before trying again."
              );
            } else if (M.store.saveError() === 'recovery') {
              M.pet.say(
                "I couldn't secure a recovery copy of your current data, so I cancelled the restore. Your existing saved data has not been replaced."
              );
            } else if (M.store.saveError() === 'storage') {
              M.pet.say(
                "I couldn't restore that backup because I couldn't access browser storage. I cancelled the restore. Your existing saved data has not been deliberately replaced."
              );
            } else {
              M.pet.say(
                "I couldn't restore that backup. The existing saved data has been kept."
              );
            }

            return;
          }

          originalRecoveryButton.hidden = true;
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
  }

  if (
    navigator.locks &&
    typeof navigator.locks.request === 'function'
  ) {
    navigator.locks.request(
      'mopapa-active-tab',
      {
        mode: 'exclusive',
        ifAvailable: true
      },
      function (lock) {
        if (!lock) {
          start('readonly');
          return;
        }

        start('owner');

        // Keep the exclusive lock for the lifetime of this page.
        return new Promise(function () {});
      }
    ).catch(function () {
      if (!started) {
        start('unprotected');
      }
    });
  } else {
    start('unprotected');
  }
})();
