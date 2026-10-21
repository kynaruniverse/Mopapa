var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.customRoomsUI = (function () {
  function init() {
    var openButton = document.getElementById('custom-room-open');
    var panel = document.getElementById('custom-room-panel');
    var form = panel;
    var nameInput = document.getElementById('custom-room-name');
    var iconInput = document.getElementById('custom-room-icon');
    var cancelButton = document.getElementById('custom-room-cancel');
    var status = document.getElementById('custom-room-status');
    if (!openButton || !panel || !form || !nameInput || !iconInput || !cancelButton || !status) return;

    openButton.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      openButton.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
      status.textContent = '';
      if (!panel.hidden) nameInput.focus();
    });

    cancelButton.addEventListener('click', function () {
      form.reset();
      status.textContent = '';
      panel.hidden = true;
      openButton.setAttribute('aria-expanded', 'false');
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var result = Mopapa.customRooms.add(nameInput.value, iconInput.value);
      if (!result.ok) {
        status.textContent = result.message;
        nameInput.focus();
        return;
      }

      form.reset();
      panel.hidden = true;
      openButton.setAttribute('aria-expanded', 'false');
      status.textContent = 'Created ' + result.room.name + '. It is ready in the den.';
      Mopapa.room.renderRooms();
      Mopapa.pet.say(result.room.name + ' is ready. What would you like to keep there?');
      if (Mopapa.pet.react) Mopapa.pet.react('helpful');
    });
  }

  return { init: init };
})();
