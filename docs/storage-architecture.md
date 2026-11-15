
# Mopapa Storage Architecture Decision

**Status:** Accepted  
**Decision date:** 5 November 2026  
**Scope:** Current personal-memory companion prototype

## Decision

Retain browser `localStorage` as Mopapa's primary persistence mechanism for the current development phase.

Do not migrate to IndexedDB simply because it is a more capable browser database. Reconsider the decision when measured performance, reliability requirements, or product capabilities provide a concrete reason to do so.

This is a deliberate decision to avoid introducing migration complexity without a demonstrated benefit.

## Current implementation

Mopapa stores its main application state under:

`mopapa.v1`

The stored value is a JSON representation of the application data, including saved entries, room configuration, sorter learning and Ask learning.

The current implementation:

- Reads the stored record during startup.
- Validates and normalises saved data before using it.
- Writes the application state as a JSON value.
- Checks for changes made by another tab before saving.
- Uses browser locking where supported to prevent simultaneous writable tabs.
- Reads the primary record back after each write and verifies the exact saved value before reporting success.
- Attempts to restore the previous primary record if a write fails verification.
- Updates its conflict-detection baseline only after a verified write.
- Preserves corrupt or partially rejected source data in separate recovery copies where possible.
- Supports exporting a backup and restoring a previously exported backup.
- Requests persistent browser storage where the browser supports that capability.

The persistence request is best-effort. Browser storage protection is not a guarantee against manual clearing, browser failure, device loss or other data-loss events.

## Write and rollback guarantees

Mopapa uses a verified, best-effort write process. It does not provide an
atomic database transaction or an absolute guarantee that a failed write
can always be reversed.

### What a normal save does

1. Check that the current stored primary record matches the last-known
   record. If it differs, reject the save as a conflict.
2. Serialise the current application state.
3. Write the new JSON value to `mopapa.v1`.
4. Read the value back and compare it with the exact attempted value.
5. Report success and update the last-known record only after that
   comparison succeeds.

A write exception or failed readback is treated as a failed save.

### What happens when a write fails

Mopapa attempts to restore the previous primary storage value. If no
previous value existed, it attempts to remove the newly written value.

This restoration is best-effort. If the browser also rejects the
restoration operation, Mopapa cannot guarantee that the previous
primary value has been recovered.

The application does not update its last-known conflict baseline after
a failed save.

### In-memory rollback

The storage layer does not automatically reverse every change made to
the in-memory application state.

Individual operations are responsible for reverting their own changes
when persistence fails. The current entry operations explicitly restore
the affected fields. Tests cover failed edits, tag changes, completion
changes, pin changes, room moves and deletion.

Restore operations have their own rollback handling for the application
state domains covered by the restore tests.

A future operation that changes application state must implement and
test its own rollback behaviour. A failed call to `store.save()` alone
must not be treated as proof that in-memory state was reverted.

### What these checks do not guarantee

- They do not make localStorage writes transactional across all
  application state.
- They do not guarantee rollback if the browser rejects the rollback
  write.
- They do not protect against browser profile deletion, manual storage
  clearing, device loss or physical failure.
- They do not provide synchronisation between devices.
- They do not replace an exported backup stored somewhere independent
  of the browser profile.
- They do not prove that a download was retained by the user.
- They do not simulate every possible interruption during a storage
  operation.

### Evidence and test boundaries

The automated tests cover failed writes, silent write failures,
altered readback content, retry after failure, conflict protection,
entry-operation rollback and restore rollback.

The browser interruption test verifies that a previously saved memory
survives closing and reopening the page. It does not simulate an
operating-system crash or power loss during a write.

Quota failures are simulated in tests. Real quota behaviour can vary
between browsers, devices and available storage conditions.

The guarantees in this document are limited to the implemented
behaviour and tested scenarios. They must not be presented as a
guarantee against all forms of data loss.

## Why localStorage remains appropriate for now

The current application is relatively small and has no demonstrated need for database-level querying, large binary attachments or complex transactions.

The latest browser benchmark results provide useful evidence:

| Dataset | Save result | Measured save time |
|---|---|---:|
| 250 short entries | Successful | 0.7 ms |
| 1,000 short entries | Successful | 2.5 ms |
| 3,000 short entries | Successful | 7.6 ms |
| 5,000 short entries | Successful | 14.1 ms |
| 3,000 entries of 1,000 characters | Successful | 24.1 ms |

These are measurements from the current test environment, not guarantees for every device or browser.

They do not establish that localStorage will remain suitable indefinitely. They do establish that a migration is not currently justified by the measured save performance alone.

## Known limitations and risks

### Synchronous whole-record writes

The application serialises and writes its stored state as a JSON value. As the dataset grows, serialisation and storage operations may become more expensive.

### Storage quotas and failures

The browser may reject writes because of storage limits or other failures. Mopapa must continue to treat unsuccessful writes as failures and must not report that data has been saved when it has not.

### Browser and device dependency

Data stored in one browser profile is not automatically synchronised to another browser, device or installation.

### Recovery-copy growth

Recovery copies are stored separately from the main record and consume additional browser storage.

The current retention policy allows a maximum of 20 ordinary recovery copies.

- Corrupt-data recovery copies are never automatically pruned.
- The copy matching the current saved data is protected.
- A new recovery copy must be written and read back successfully before pruning begins.
- If the recovery inventory cannot be inspected, no copies are deleted.
- Cleanup failure does not invalidate an already verified recovery copy.
- Legacy copies with unrecognisable timestamps are retained rather than automatically pruned.

Recovery copies remain in the same browser storage environment as the primary record. They are not a substitute for exporting a backup to another location.

### Browser storage persistence

A successful persistence request can reduce the risk of automatic browser eviction, but it is not an external backup and cannot guarantee permanent retention.

## Why IndexedDB is not being adopted yet

IndexedDB offers asynchronous operations, structured records, indexes and more flexibility for larger datasets.

Those capabilities may become useful, but adopting IndexedDB now would introduce:

- A new persistence implementation.
- An asynchronous storage interface.
- A migration path from existing localStorage records.
- Additional failure and interruption scenarios.
- More test coverage requirements.
- New opportunities for migration defects and accidental data loss.

The current application has not demonstrated a requirement that outweighs those costs.

## Evidence that should trigger a review

Reconsider the storage decision when one or more of the following becomes true:

1. Representative mobile-device benchmarks show noticeable save or load delays.
2. Whole-record serialisation or writes become a recurring usability problem.
3. Storage quota failures occur during normal expected use.
4. The application needs attachments or other substantial binary data.
5. The data model requires indexed queries or more granular updates.
6. A product requirement makes the current single-record storage model unsuitable.
7. Testing demonstrates that a different storage mechanism would materially improve reliability.

A review should use measured results and a migration plan, not assumptions about which database is more modern.

## Migration requirements if the decision changes

Any future migration must:

- Preserve existing localStorage data until migration has been verified.
- Validate the source record before migration.
- Avoid overwriting an existing destination record without verification.
- Read migrated data back and verify it before treating migration as successful.
- Preserve the original source data until the destination has been independently verified.
- Handle interrupted migrations safely.
- Preserve recovery copies.
- Include a clear rollback or recovery route.
- Test empty, normal, large, malformed and partially recoverable datasets.
- Verify that the migrated data matches the original data.
- Avoid requiring users to lose access to existing backups.

The migration must be tested against realistic mobile browser conditions before release.

## Non-goals

This decision does not authorise:

- Cloud synchronisation.
- User accounts or remote storage.
- Paid storage services.
- AI-based storage or retrieval.
- Automatic deletion of recovery copies.
- A database migration without a demonstrated need.

## Review outcome

**Current choice: retain localStorage.**

Continue improving validation, recovery, backup clarity, failure handling and mobile-device testing.

Revisit IndexedDB when actual product requirements or measured limitations justify the additional complexity.
