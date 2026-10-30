var Mopapa = window.Mopapa = window.Mopapa || {};

Mopapa.customRooms = (function () {
  var MAX_CUSTOM_ROOMS = 10;
  var ICONS = ['book', 'sprout', 'palette', 'paw', 'music', 'plane', 'home', 'briefcase', 'telescope', 'star'];
  // Rooms saved by earlier versions stored an emoji; map them to the new icon keys.
  var LEGACY = Object.assign(Object.create(null), { '\ud83d\udcda': 'book', '\ud83c\udf31': 'sprout', '\ud83c\udfa8': 'palette', '\ud83d\udc3e': 'paw', '\ud83c\udfb5': 'music', '\u2708\ufe0f': 'plane', '\ud83c\udfe0': 'home', '\ud83d\udcbc': 'briefcase', '\ud83d\udd2d': 'telescope', '\u2b50': 'star' });
  function normIcon(icon) { return LEGACY[icon] || icon; }

  function cleanName(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function findDuplicate(name) {
    var target = cleanName(name).toLowerCase();
    return Mopapa.rooms.some(function (room) {
      return room.name.toLowerCase() === target;
    });
  }

  function validSavedRoom(room) {
    if (
      !room ||
      typeof room.id !== 'string' ||
      !/^custom_[a-z0-9]+$/.test(room.id) ||
      typeof room.name !== 'string'
    ) {
      return false;
    }

    var name = cleanName(room.name);

    return name.length >= 2 &&
      name.length <= 20 &&
      ICONS.indexOf(normIcon(room.icon)) !== -1;
  }

  function reload() {
    Mopapa.rooms = Mopapa.rooms.filter(function (room) {
      return room.id.indexOf('custom_') !== 0;
    });

    var saved = Mopapa.store.data().customRooms || [];
    var ids = Object.create(null);
    var accepted = 0;

    saved.forEach(function (room) {
      var name = cleanName(room && room.name);

      if (
        accepted >= MAX_CUSTOM_ROOMS ||
        !validSavedRoom(room) ||
        !name ||
        ids[room.id] ||
        findDuplicate(name)
      ) {
        return;
      }

      ids[room.id] = true;

      Mopapa.rooms.push({
        id: room.id,
        name: name,
        icon: normIcon(room.icon),
        dated: false,
        words: [name]
      });

      accepted++;
    });

    var repaired = false;

    Mopapa.store.data().entries.forEach(function (entry) {
      var known = Mopapa.rooms.some(function (room) {
        return room.id === entry.room;
      });

      if (!known) {
        entry.room = 'notes';
        repaired = true;
      }
    });

    if (repaired) Mopapa.store.save();
  }

  function add(name, icon) {
    if (typeof name !== 'string') {
      return { ok: false, message: 'Use a room name between 2 and 20 characters.' };
    }

    name = cleanName(name);
    var current = Mopapa.store.data().customRooms || [];
    if (name.length < 2 || name.length > 20) {
      return { ok: false, message: 'Use a room name between 2 and 20 characters.' };
    }
    if (findDuplicate(name)) {
      return { ok: false, message: 'A room with that name already exists.' };
    }
    var activeCustomRoomCount = Mopapa.rooms.filter(function (room) {
      return room.id.indexOf('custom_') === 0;
    }).length;

    if (activeCustomRoomCount >= MAX_CUSTOM_ROOMS) {
      return { ok: false, message: 'You have reached the limit of 10 custom rooms for now.' };
    }
    if (ICONS.indexOf(icon) === -1) icon = ICONS[0];

    var room = {
      id: 'custom_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: name,
      icon: icon
    };
    current.push(room);
    Mopapa.store.data().customRooms = current;
    if (!Mopapa.store.save()) {
      current.pop();
      return { ok: false, message: 'I could not save that room on this device. Check available storage and try again.' };
    }

    Mopapa.rooms.push({ id: room.id, name: room.name, icon: room.icon, dated: false, words: [room.name] });
    return { ok: true, room: room };
  }

  function findSavedRoom(id) {
    var rooms = Mopapa.store.data().customRooms || [];

    for (var i = 0; i < rooms.length; i++) {
      if (rooms[i] && rooms[i].id === id) return rooms[i];
    }

    return null;
  }

  function rename(id, name) {
    if (typeof id !== 'string' || typeof name !== 'string') {
      return { ok: false, message: 'That room could not be found.' };
    }

    var room = findSavedRoom(id);

    if (!room) {
      return { ok: false, message: 'That custom room could not be found.' };
    }

    name = cleanName(name);

    if (name.length < 2 || name.length > 20) {
      return { ok: false, message: 'Use a room name between 2 and 20 characters.' };
    }

    var duplicate = Mopapa.rooms.some(function (item) {
      return item.id !== id && item.name.toLowerCase() === name.toLowerCase();
    });

    if (duplicate) {
      return { ok: false, message: 'A room with that name already exists.' };
    }

    var previous = room.name;
    room.name = name;

    if (!Mopapa.store.save()) {
      room.name = previous;
      return {
        ok: false,
        message: 'I could not save that name on this device. The original name is unchanged.'
      };
    }

    var active = Mopapa.rooms.filter(function (item) {
      return item.id === id;
    })[0];

    if (active) {
      active.name = name;
      active.words = [name];
    }

    return { ok: true, room: room };
  }

  function remove(id) {
    if (typeof id !== 'string') {
      return { ok: false, message: 'That room could not be found.' };
    }

    var room = findSavedRoom(id);

    if (!room) {
      return { ok: false, message: 'That custom room could not be found.' };
    }

    var data = Mopapa.store.data();
    var previousEntries = data.entries.map(function (entry) {
      return entry.room;
    });
    var previousRooms = data.customRooms.slice();

    var moved = 0;

    data.entries.forEach(function (entry) {
      if (entry.room === id) {
        entry.room = 'notes';
        moved++;
      }
    });

    data.customRooms = data.customRooms.filter(function (item) {
      return !item || item.id !== id;
    });

    if (!Mopapa.store.save()) {
      data.entries.forEach(function (entry, index) {
        entry.room = previousEntries[index];
      });

      data.customRooms = previousRooms;

      return {
        ok: false,
        message: 'I could not delete that room on this device. Nothing was changed.'
      };
    }

    Mopapa.rooms = Mopapa.rooms.filter(function (item) {
      return item.id !== id;
    });

    return { ok: true, moved: moved };
  }

  return {
    init: reload,
    reload: reload,
    add: add,
    rename: rename,
    remove: remove
  };
})();
