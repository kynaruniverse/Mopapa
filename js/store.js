var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.store = (function () {
  var KEY = 'mopapa.v1';
  var data = { entries: [], learned: {} };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && Array.isArray(p.entries)) {
          data.entries = p.entries;
          data.learned = p.learned || {};
        }
      }
    } catch (e) {}
    return data;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function exportJSON() {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mopapa-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function importJSON(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var p = JSON.parse(r.result);
        if (!p || !Array.isArray(p.entries)) throw new Error('bad file');
        data.entries = p.entries;
        data.learned = p.learned || {};
        save();
        cb(true);
      } catch (e) { cb(false); }
    };
    r.onerror = function () { cb(false); };
    r.readAsText(file);
  }

  return {
    data: function () { return data; },
    load: load, save: save, exportJSON: exportJSON, importJSON: importJSON
  };
})();