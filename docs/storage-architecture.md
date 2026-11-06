
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
- Detects storage failures and avoids pretending that an unsuccessful save succeeded.
- Preserves corrupt or partially rejected source data in separate recovery copies where possible.
- Supports exporting a backup and restoring a previously exported backup.
- Requests persistent browser storage where the browser supports that capability.

The persistence request is best-effort. Browser storage protection is not a guarantee against manual clearing, browser failure, device loss or other data-loss events.

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

Recovery copies are stored separately from the main record. They can consume additional browser storage, especially when several full-record copies are retained.

Recovery copies must not be automatically deleted using an arbitrary age or count limit. A copy may be the only surviving version of valuable data.

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
