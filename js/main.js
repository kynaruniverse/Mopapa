(function () {
  var M = window.Mopapa;
  M.store.load();
  M.pet.init();
  M.talk.init();
  M.room.init();

  var n = M.store.data().entries.length;
  M.pet.say(n
    ? "Welcome back. I'm keeping " + n + ' thing' + (n === 1 ? '' : 's') + ' safe for you.'
    : "Hi, I'm Mopapa. Tell me anything and I'll file it in the right room.");

  document.getElementById('btn-export').addEventListener('click', function () {
    M.store.exportJSON();
    M.pet.say('Backup saved to your downloads.');
  });

  var fileInput = document.getElementById('file-import');
  document.getElementById('btn-import').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    if (!f) return;
    if (!window.confirm('Importing replaces everything Mopapa has now. Continue?')) { fileInput.value = ''; return; }
    M.store.importJSON(f, function (ok) {
      fileInput.value = '';
      M.room.renderRooms();
      M.pet.say(ok ? 'Backup restored.' : "That file didn't look like a Mopapa backup.");
    });
  });
})();