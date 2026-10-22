var Mopapa = window.Mopapa = window.Mopapa || {};

// In-app dialogs that replace the browser's confirm, prompt and alert pop-ups.
Mopapa.dialog = (function () {
  var dlg = null, text, field, ok, cancel, done = null;

  function build() {
    if (dlg) return;
    dlg = document.createElement('dialog');
    dlg.className = 'app-dialog';
    dlg.innerHTML =
      '<form class="app-dialog-form">' +
      '<p class="app-dialog-text"></p>' +
      '<input class="app-dialog-field" type="text" maxlength="200" aria-label="Value" hidden>' +
      '<div class="app-dialog-actions">' +
      '<button type="button" class="app-dialog-cancel">Cancel</button>' +
      '<button type="submit" class="app-dialog-ok">OK</button>' +
      '</div></form>';
    document.body.appendChild(dlg);
    text = dlg.querySelector('.app-dialog-text');
    field = dlg.querySelector('.app-dialog-field');
    ok = dlg.querySelector('.app-dialog-ok');
    cancel = dlg.querySelector('.app-dialog-cancel');
    dlg.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var cb = done, value = field.hidden ? true : field.value;
      done = null;
      dlg.close();
      if (cb) cb(value);
    });
    cancel.addEventListener('click', function () { done = null; dlg.close(); });
    dlg.addEventListener('cancel', function () { done = null; });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) { done = null; dlg.close(); } });
  }

  function open(o) {
    build();
    text.textContent = o.message;
    field.hidden = !o.field;
    field.value = o.field ? o.value : '';
    ok.textContent = o.okLabel || 'OK';
    ok.className = 'app-dialog-ok' + (o.danger ? ' danger' : '');
    cancel.hidden = !!o.notice;
    done = o.onOk || null;
    dlg.showModal();
    if (o.field) { field.focus(); field.select(); } else { ok.focus(); }
  }

  function confirm(message, okLabel, onYes, danger) {
    open({ message: message, okLabel: okLabel, onOk: onYes, danger: danger });
  }
  function prompt(message, value, okLabel, onValue) {
    open({ message: message, field: true, value: value || '', okLabel: okLabel, onOk: onValue });
  }
  function notice(message) { open({ message: message, notice: true }); }

  return { confirm: confirm, prompt: prompt, notice: notice };
})();