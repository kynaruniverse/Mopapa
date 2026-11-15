
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

### Storage failure outcome matrix

| Scenario | Application behaviour | User-facing outcome and safe action | Verification boundary |
|---|---|---|---|
| Storage cannot be read during startup | Mopapa marks storage unavailable, does not load existing memories into the working state, and blocks normal saves and restores. | The user is told not to add or restore data, to check browser storage permissions and reload. | Unit and browser tests simulate primary-record read failure. |
| Storage becomes unreadable during a save or restore | The operation is rejected before replacing the primary record. | The user is told that storage could not be accessed and the operation did not proceed. | Unit tests cover failed reads during save and restore. Browser tests cover inaccessible storage and blocked writes. |
| A write fails because storage is full | Mopapa attempts best-effort restoration of the previous primary record. The operation reports a quota failure. | The user is told storage may be full. Unsaved text should be copied somewhere safe before freeing space and retrying. | Quota exceptions are simulated in browser tests. Actual device quota behaviour remains unverified. |
| A write fails for another reason | Mopapa attempts best-effort restoration. The save is rejected and the affected application operation must revert its in-memory change. | The user is told the operation failed. Original saved data must not be described as changed successfully. | Unit tests cover failed writes, readback mismatch and operation rollback. |
| Readback does not match the attempted write | Mopapa treats the save as failed and attempts to restore the previous primary value. | The user receives a save-failure outcome, not a success confirmation. | Unit tests simulate altered readback content. |
| The primary record changes in another tab | Mopapa rejects the stale write or restore rather than overwriting newer data. | The user is told to reload Mopapa and review the current memories before retrying. | Unit and browser conflict tests. |
| The tab is read-only | Save and restore operations are rejected. | The user is told to close the other writable tab and reload before editing or restoring. | Unit and browser tests cover write ownership and restore rejection. |
| A backup is invalid or cannot be read | The import is rejected before replacing existing data. | The user is told the restore failed and existing saved data was kept. They should choose a valid backup. | Unit and browser tests cover malformed JSON, invalid records, unsupported schemas, oversized files and file-reading failures. |
| A recovery copy cannot be secured before restore | The restore is cancelled before replacement. | The user is told that the existing data was not replaced. They should not retry by bypassing recovery protection. | Unit tests cover recovery-copy creation failure. |
| Recovery inventory cannot be inspected | Mopapa keeps the recovery panel visible, hides unavailable download controls and does not delete copies. | The user is told that copies may still exist, to keep browser storage intact and try again later. | Unit and browser tests simulate enumeration failure. |
| The page closes or reloads after a successful save | Previously saved memories remain available after reopening. An unsaved composer draft is not guaranteed to survive. | The user must save a memory before relying on it being retained. | Browser test covers page close and reopen, not an operating-system crash or power loss during a write. |

These outcomes describe the implemented and tested behaviour, not an
absolute guarantee against data loss. In particular, best-effort rollback
can itself fail if the browser rejects the restoration write.


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

The current retention policy is count-based, not size-based.

- The 20 newest timestamped ordinary recovery copies are retained.
- The copy matching the current saved data is additionally protected, even when it is older than those 20 copies. The inventory can therefore contain 21 ordinary copies.
- Recovery copies contain the full original JSON record. Their storage cost grows with both archive size and the number of retained copies.
- Corrupt-data recovery copies are never automatically pruned and can accumulate without a fixed limit.
- A new recovery copy must be written and read back successfully before pruning begins.
- If the recovery inventory cannot be inspected, no copies are deleted.
- Cleanup failure does not invalidate an already verified recovery copy.
- Legacy copies with unrecognisable timestamps are retained rather than automatically pruned.

### User-controlled recovery-copy deletion

Ordinary timestamped recovery copies are automatically retained according
to the existing newest-20 policy, with a protected current-data copy where
required.

Corrupt-data copies and legacy copies with unrecognisable timestamps are
never automatically deleted.

The recovery inventory provides individual deletion controls. Deletion
requires the user to download the copy, open and verify the external file,
and enter the exact confirmation phrase:

`VERIFIED EXTERNAL COPY`

This is an explicit user attestation. Mopapa cannot independently verify
that the external file was retained or is usable.

Deletion is restricted to keys present in the currently inspectable
recovery inventory. The store verifies that the key is absent after
removal. If inventory inspection, removal or verification fails, deletion
is not reported as successful.

When the recovery inventory cannot be inspected, deletion controls are
not available.

This policy permits deliberate cleanup while avoiding silent deletion of
potentially recoverable data. It does not create a hard byte-size limit:
protected copies can accumulate until the user verifies external copies
and deliberately removes them.


### Protected recovery-storage visibility

The recovery inventory identifies protected copies as:

- All corrupt-data copies.
- Legacy recovery copies whose timestamps cannot be recognised.

These copies are excluded from automatic pruning.

The inventory displays their count and an approximate combined storage size. The estimate uses two bytes per JavaScript string character. It is an indicator of accumulation, not a measurement of browser storage consumption or available quota.

Mopapa displays an accumulation warning when there are at least three protected copies or their estimated combined size reaches 10 MiB.

The warning recommends downloading and verifying copies outside the browser before considering manual deletion. It does not delete copies, impose a hard limit or claim that the browser is running out of quota.

If the inventory cannot be inspected, Mopapa must not display a misleading count or estimate.

### Protected-copy creation ceiling

Mopapa applies a creation ceiling to protected recovery storage:

- Maximum 10 protected copies.
- Maximum estimated combined size of 10 MiB.
- Both limits include corrupt-data copies and undated legacy recovery copies.
- An existing identical corrupt-data copy can be reused without creating another copy.

Before creating a new corrupt-data copy, the store inspects the protected
inventory and checks the projected count and estimated size. If either
limit would be exceeded, it refuses to create the additional copy.

Existing protected copies are never automatically deleted to enforce
these limits.

When the limit prevents preservation, the original primary record is
left unchanged, normal changes remain locked, and the user is directed
to download the exact original data before attempting recovery.

If the inventory cannot be inspected, creation fails closed.

This is an application-level limit on new protected-copy creation, not
a browser quota guarantee. It does not retroactively remove copies
already present above the ceiling. The byte estimate uses two bytes per
JavaScript string character and is not a measurement of actual browser
storage consumption.

### Large-archive evidence and limitations

The CI browser benchmark measured a synthetic archive of 3,000 entries, each containing 1,000 characters. Its JSON representation was approximately 3,533,000 characters, or 7,066,000 bytes using a rough two-bytes-per-character estimate.

At that size, 20 full copies would represent approximately 141 MB of estimated data, or approximately 148 MB if the additional protected current-data copy is retained.

These figures are projections, not measured browser storage consumption or guaranteed quota requirements. Browser storage accounting and available quotas vary.

The existing retention tests verify copy counts, ordering, protected-copy behaviour and cleanup failures using small synthetic copies. They do not demonstrate that 20 full-size archives can be retained within realistic mobile browser storage limits.

The current policy therefore provides a count limit for ordinary copies, not a reliable storage-size limit. Large-archive quota behaviour remains an explicit testing gap.

Recovery copies remain in the same browser storage environment as the primary record. They are not a substitute for exporting a backup to another location.

### Browser storage persistence

A successful persistence request can reduce the risk of automatic browser eviction, but it is not an external backup and cannot guarantee permanent retention.

## Repeatable backup and recovery drill

The browser test suite includes a repeatable normal-backup round-trip:

1. Seed a known state containing a saved entry, learned data, a custom room and Ask learning.
2. Reload Mopapa and use the normal Back up data control.
3. Capture the downloaded JSON file and verify that every expected state domain is present.
4. Add a temporary replacement memory.
5. Restore the downloaded backup through the normal Restore backup control.
6. Verify that the original entry and all exported state domains have been restored.
7. Verify that the temporary replacement memory is no longer present.

The test is named `exported full backup restores every saved state domain`.

A separate browser test, `downloaded recovery copy can restore the complete previous state`, verifies the recovery-copy route after replacement data has been imported.

Invalid-backup preservation and failed-restore recovery export are covered by separate browser tests.

### Manual browser drill

For a real browser download and recovery check, use non-critical test data:

1. Create a test memory and a custom room. Include representative Ask learning data if available.
2. Select Back up data.
3. Locate the downloaded JSON file and confirm that it exists, has non-zero size and contains valid JSON.
4. Keep the file somewhere independent of Mopapa's browser storage.
5. Change or remove the test memory in Mopapa.
6. Select Restore backup and choose the downloaded file.
7. Confirm the replacement operation.
8. Check that the original memory, custom room and other included state have returned.
9. Create another backup and verify that it contains the restored state.

Do not clear browser storage until the restored data has been checked.

### What the drill proves and does not prove

The automated browser test verifies that the application can generate a readable backup file and restore it successfully in the test browser.

The manual drill checks the actual browser download and file-handling experience.

Neither a successful download event nor a successful automated test proves that a user has retained a backup in a safe, independent location. The user must check the downloaded file and keep it separately.

The drill does not simulate device loss, operating-system failure, browser-profile deletion or every possible storage interruption.

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
