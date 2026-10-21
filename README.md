# Mopapa

Mopapa is a local-first web app prototype for saving entries in rooms, searching and asking questions about saved memories, keeping user-pinned keepsakes, tagging memories, tracking dated to-dos and appointments, and resurfacing older entries.

## Run

Open `index.html` in a modern browser or use SPCK's preview. Data is stored in that browser's local storage. Use **Export backup** before changing devices or making major edits; imports replace the current local data.

## Status

Prototype. Data lives only in this browser's local storage (plaintext, no sync), so export backups regularly. There are no reminders or notifications yet. The Tag Explorer is installed. Run the tests with `node tests/run.js`; CI runs them on every push.