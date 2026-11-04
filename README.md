
# Mopapa

Mopapa is a local-first web app prototype for saving entries in rooms, asking questions about saved memories, keeping pinned keepsakes, tagging memories, tracking dated tasks and appointments, and resurfacing older entries.

## Run

Open `index.html` in a modern browser or use SPCK's preview. Data is stored in that browser's local storage.

Use **Back up data** regularly and before changing devices or making major edits. Use **Restore backup** to load a previously exported JSON backup. Restoring replaces the data currently saved in that browser and requires confirmation. Backup files larger than 5 MB, malformed backups, entries with missing or invalid fields, IDs with surrounding whitespace, and duplicate entry IDs are rejected without replacing the existing saved data. Invalid custom-room records are ignored when the room list is reloaded. A valid backup with zero entries is allowed. Keep exported files somewhere safe because backups may contain personal information.

## Asking questions

Ask questions in ordinary language about entries saved in Mopapa. Answers are based on saved entries, and matching entries can be shown as sources so you can check what the answer came from.

When several saved entries could match a question, select the entry you meant if Mopapa offers that choice. Mopapa can learn supported aliases and confirmed source choices on the device. You can review and clear the available Ask learning data in the learning interface.

Mopapa is a prototype. Its interpretation of dates, questions and saved text can be imperfect. Check the displayed source entries rather than treating an answer as guaranteed.

## Privacy and data

The current prototype stores data in the browser's local storage. Data is not synchronised between devices by this storage mechanism. Anyone with access to the same browser profile may be able to access the stored data.

Export backups are files you control. Store them securely because they may contain personal information.

## Status and limitations

Mopapa is a prototype. Browser storage is local and is not a substitute for a secure, synchronised account system. Do not assume that reminders or notifications will be delivered. Keep regular backups.

## Tests

Run the automated test suite from the repository root:

```sh
node tests/run.js
```

The repository's CI workflow is intended to run tests on pushes. A successful local test run does not, by itself, establish that a deployment is working.
