var Mopapa = window.Mopapa = window.Mopapa || {};

// Line icons on a 24px grid. They inherit colour from the surrounding text.
Mopapa.icons = {
  check: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9v11M3.5 9h17M12 9c-2.500-.2-4-1.200-4-2.600C8 4.600 10.800 4.600 12 9zM12 9c2.500-.2 4-1.200 4-2.600 0-1.800-2.800-1.800-4 2.600z"/>',
  heart: '<path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>',
  idea: '<path d="M9 17h6M10 20h4M12 4a5.500 5.500 0 0 0-3.500 9.800c.6.5 1 1.200 1 2V17h5v-1.200c0-.8.4-1.500 1-2A5.500 5.500 0 0 0 12 4z"/>',
  note: '<path d="M6 3.500h9l3.500 3.500v13.500H6z"/><path d="M9 11h6M9 14.500h6M9 8h3"/>',
  inbox: '<path d="M4 13l2-8h12l2 8v6H4z"/><path d="M4 13h5l1 2h4l1-2h5"/>',
  book: '<path d="M5 4.500h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
  sprout: '<path d="M12 20v-8M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-3 2.500-5 6-5 0 3.500-2.500 5-6 5z"/>',
  palette: '<path d="M12 4a8 8 0 1 0 0 16c1.500 0 2-1 1.500-2s0-2 1.500-2h2a3 3 0 0 0 3-3A8 8 0 0 0 12 4z"/><circle cx="8.500" cy="11" r="1"/><circle cx="12" cy="8" r="1"/><circle cx="15.500" cy="10" r="1"/>',
  paw: '<circle cx="7" cy="10" r="1.800"/><circle cx="11" cy="6.500" r="1.800"/><circle cx="15.500" cy="7" r="1.800"/><circle cx="18" cy="11" r="1.800"/><path d="M8 17c0-3 2.500-5 4.500-5s4.500 2 4.500 5c0 2-2 2.500-4.500 2.500S8 19 8 17z"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2.200"/><circle cx="17" cy="16" r="2.200"/>',
  plane: '<path d="M3 13l18-8-6 15-3-6z"/><path d="M12 14l9-9"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
  briefcase: '<rect x="3.500" y="8" width="17" height="11.500" rx="2"/><path d="M9 8V6a1.500 1.500 0 0 1 1.500-1.500h3A1.500 1.500 0 0 1 15 6v2M3.500 13h17"/>',
  telescope: '<path d="M4 12l12-5 1.500 3.500-12 5z"/><path d="M12 14l-3 6M12 14l3 6"/>',
  star: '<path d="M12 4l2.400 5 5.500.7-4 3.800 1 5.500-4.900-2.700L7.100 19l1-5.500-4-3.800L9.600 9z"/>'
};

Mopapa.icon = function (key) {
  var body = Mopapa.icons[key] || Mopapa.icons.inbox;
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">' + body + '</svg>';
};
