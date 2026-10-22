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

  if (M.store.data().corrupt) M.dialog.notice('Your saved data could not be read. A copy was kept in this browser.');

  var n = M.store.data().entries.length;
  var lastBackup = 0;
  try { lastBackup = +localStorage.getItem('mopapa.lastBackup') || 0; } catch (e) {}
  var stale = n >= 10 && Date.now() - lastBackup > 14 * 86400000;

  M.pet.say(n
    ? "Welcome back. I'm keeping " + n + ' thing' + (n === 1 ? '' : 's') + ' in this browser.' +
      (stale ? ' Please use Back up data so nothing gets lost.' : '')
    : "Hi, I'm Mopapa. Tell me anything and I'll file it in the right room. Everything stays in this browser only, so use Back up data now and then.");

  document.getElementById('btn-export').addEventListener('click', function () {
    M.store.exportJSON();
    try { localStorage.setItem('mopapa.lastBackup', String(Date.now())); } catch (e) {}
    M.pet.say('Backup saved to your downloads.');
  });

  var fileInput = document.getElementById('file-import');
  document.getElementById('btn-import').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    if (!f) return;
    fileInput.value = '';
    M.dialog.confirm('Importing replaces everything Mopapa has now. Continue?', 'Replace data', function () { runImport(f); }, true);
  });

  function runImport(f) {
    M.store.importJSON(f, function (ok) {
      fileInput.value = '';
      if (ok) M.customRooms.reload();
      M.room.renderRooms();
      if (M.keepsakesUI) M.keepsakesUI.render();
      if (Mopapa.tagExplorerUI) Mopapa.tagExplorerUI.render();
      if (M.agendaUI) M.agendaUI.render();
      if (M.resurfaceUI) M.resurfaceUI.refresh();
      if (M.searchUI) M.searchUI.refresh();
      M.pet.say(ok ? 'Backup restored.' : "That file didn't look like a Mopapa backup.");
    });
  }
})();
