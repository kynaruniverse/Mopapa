
# Mopapa Storage Architecture Decision

**Status:** Supporting storage decision for the existing production schema version 2, with all five personal-memory collections restricted to empty arrays.  
**Decision date:** 5 November 2026  
**Scope:** Existing localStorage implementation and its measured behaviour  
**Current authority:** `docs/personal-memory-architecture.md`, `docs/personal-memory-record-specification.md` and `docs/personal-memory-build-plan.md`

## Decision

Retain browser `localStorage` as Mopapa's primary persistence mechanism for the current development phase.

Do not migrate to IndexedDB simply because it is a more capable browser database. Reconsider the decision when measured performance, reliability requirements, or product capabilities provide a concrete reason to do so.

This is a deliberate decision to avoid introducing migration complexity without a demonstrated benefit.

This decision remains applicable to the existing production application and its current storage key.

It does not establish that localStorage is suitable for every future conversation-archive workload. The existing benchmarks measure the entry-based application model and must not be presented as proof of archive-scale capacity or real-device Android performance.

The canonical record specification defines future storage, compatibility, recovery and validation requirements. The build plan defines when representative archive measurements and any storage reconsideration are required.

This document preserves detailed evidence about the existing storage implementation. It is a supporting engineering reference, not a separate product roadmap or authority to introduce a new storage mechanism.

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


## Current saved-record schema and field semantics

The primary record is stored as JSON under `mopapa.v1`. Its current schema version is `1`.

The canonical application data contains these top-level fields:

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | number | Current schema version, `1`. |
| `entries` | array | Saved personal memories, tasks and appointments. |
| `learned` | object | Legacy room-sorter learning data. |
| `customRooms` | array | User-created rooms. |
| `ask` | object | Ask-specific aliases, confirmed source choices and unanswered questions. |

A backup must contain an `entries` array. The other data domains are optional when importing older supported records and are normalised to their current defaults.

### Saved entry fields

Each entry represents one saved memory.

| Field | Type | Meaning and validation |
|---|---|---|
| `id` | string | Required unique identifier. Must be non-empty, trimmed and no longer than 100 characters. |
| `text` | string | Required original memory text. Must contain non-whitespace text and be no longer than 1,000 characters. |
| `room` | string | Required room identifier. Must be non-empty, trimmed and no longer than 50 characters. |
| `when` | string or null | Optional date or date-time value. Empty string and null are accepted. Other values must parse as valid dates. |
| `hasTime` | boolean | Optional flag indicating that `when` includes a time. When true, `when` must contain a recognised hour-and-minute component. |
| `created` | string | Optional creation timestamp. When present, it must be a valid date value. |
| `done` | boolean | Optional completion state, primarily used by dated tasks. |
| `pinned` | boolean | Optional pinned-keepsake state. |
| `tags` | array of strings | Optional tags. Maximum eight tags, each non-empty and no longer than 24 characters. |
| `amount` | number or null | Optional first monetary amount extracted from the memory text. A non-null value must be finite. |
| `amounts` | array of numbers or null | Optional list of monetary amounts extracted from the memory text. Every value must be finite. |
| `fact` | object or null | Optional structured location fact extracted from the memory text. |

The `fact` object currently has these fields:

| Field | Meaning |
|---|---|
| `attr` | Must be `location`. |
| `items` | Non-empty array of subject names or items. |
| `prep` | Location preposition, restricted to `in`, `inside`, `on`, `under`, `behind`, `beside`, `next to`, `within` or `at`. |
| `where` | Non-empty location description. |
| `value` | Combined preposition and location, matching `prep + " " + where`, ignoring case. |
| `plural` | Boolean indicating plural subject wording. |

`amount` represents the first extracted amount. `amounts` represents all extracted amounts. Both are derived from the saved text when an entry is created or its text is edited.

`fact` is only populated when the deterministic location extractor recognises a supported sentence structure. It is not a general-purpose description of every memory.

### Entry compatibility and optional fields

Older entries may omit optional fields. The current validator accepts those omissions.

The validator checks the supported fields described above, but does not reject every unknown property on an entry. Existing unknown entry properties can therefore remain in the cleaned entry object.

Do not assume that every entry has every optional field, or that the current validator enforces a completely closed set of entry properties.

The `room` field is validated as a string, but entry validation does not itself require that the room identifier currently exists. Missing-room repair is handled separately.

### Custom rooms

`customRooms` is an array containing up to ten user-created rooms.

Each room has:

| Field | Type | Meaning and validation |
|---|---|---|
| `id` | string | Must match `custom_[a-z0-9]+`. |
| `name` | string | Whitespace is normalised. Must be between 2 and 20 characters. |
| `icon` | string | Must be one of the supported room icon identifiers. |

Room IDs and normalised room names must be unique. Names must not duplicate built-in room names.

The supported icon identifiers are `book`, `sprout`, `palette`, `paw`, `music`, `plane`, `home`, `briefcase`, `telescope` and `star`. Recognised legacy emoji icons are converted to their corresponding identifiers.

### Legacy room-sorter learning

`learned` stores legacy room-sorter learning data as a mapping from terms to scores.

The current cleaner accepts either:

- A finite numeric score between 1 and 1,000 for a term.
- An object mapping room identifiers to finite scores between 1 and 1,000.

The cleaned structure is limited to 500 terms and 20 room scores per term. Scores are stored as integers.

This is distinct from `ask`, which stores Ask-specific learning.

### Ask learning

`ask` contains three fields:

| Field | Type | Meaning |
|---|---|---|
| `aliases` | array | User-taught pairs of equivalent words. |
| `boosts` | object | Confirmed source-entry choices, grouped by deterministic question signature. |
| `unanswered` | array | Recent questions for which Ask did not provide an answer. |

**Aliases**

- Maximum 50 pairs.
- Each pair contains two distinct, non-empty single words.
- Each word is trimmed and limited to 30 characters.
- Comparisons are case-insensitive.
- Learned aliases are applied in both directions.

**Confirmed source boosts**

- Maximum 200 question signatures.
- Each signature is limited to 500 characters.
- Each signature can contain up to ten entry identifiers.
- Entry identifiers must be non-empty and no longer than 100 characters.
- Counts must be finite positive numbers and are stored as integers capped at 1,000.

A boost records a person's previous confirmation of which saved entry answered a particular question. It does not independently establish that an answer is correct.

**Unanswered questions**

- Maximum 30 records.
- Each record contains `q` and `at`.
- `q` is trimmed, non-empty and limited to 200 characters.
- `at` is a string limited to 40 characters.
- Duplicate questions are removed case-insensitively.
- New unanswered questions are placed first.

### Schema version and import normalisation

The current production schema version is `2`.

The live application uses the existing `mopapa.v1` storage key.

A record without `schemaVersion` is treated as legacy version `0`. Schema versions `0` and `1` are supported through the implemented migration to version `2`.

Schema version `2` requires all five additional personal-memory collections to exist as valid empty arrays. Missing, malformed or non-empty proposed collections are rejected.

Unsupported, negative, non-integer or non-numeric schema versions are rejected.

Schema version `3` is proposed for Stage 2 native conversation and message records. It has not been implemented or authorised. Do not describe schema version 3 as current production behaviour.

On loading saved data, Mopapa cleans and normalises entries, room-learning data, custom rooms and Ask learning before using them.

On import, invalid supported fields or malformed learning structures cause the backup to be rejected rather than silently accepted as a valid restore.

Legacy monetary values beginning with a pound sign can be converted to numeric values using the associated memory text.

This section describes the current implementation. It is not a promise that future schema changes will preserve every field without an explicit migration and compatibility test.


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
| 3,000 entries of 1,000 characters | Successful | 24.9 ms |

These are measurements from the current test environment, not guarantees for every device or browser.

They do not establish that localStorage will remain suitable indefinitely. They do establish that a migration is not currently justified by the measured save performance alone.


## Practical archive-size assumptions

The current benchmark results establish a tested performance envelope, not a guaranteed maximum archive size.

The following assumptions apply to the current implementation:

| Archive shape | Evidence | Interpretation |
|---|---|---|
| 250 short entries | Saved successfully in CI Chromium. | Small benchmark baseline. |
| 1,000 short entries | Saved successfully in CI Chromium. | Intermediate benchmark. |
| 3,000 short entries | Saved successfully in CI Chromium. | Larger short-entry benchmark. |
| 5,000 short entries | Saved successfully in CI Chromium. | Largest short-entry benchmark completed. |
| 3,000 entries with 1,000-character text | Saved successfully in CI Chromium. | Largest long-text benchmark completed. |

The 3,000-entry long-text dataset produced approximately 3.53 million JSON characters. The latest recorded CI run measured a save time of approximately 24.9 ms and an application load time of approximately 10.6 ms.

These measurements were taken in headless Chromium on a CI runner. They are not mobile-device performance guarantees. They do not establish performance for every browser, device, operating-system version or storage condition.

### Practical limits and interpretation

- Mopapa does not currently define a guaranteed maximum number of saved entries.
- The benchmark sizes are evidence of successful operations in the test environment, not recommended targets or hard application limits.
- Individual entry text is limited to 1,000 characters by the current validation rules.
- Backup imports have a separate maximum file size of 5 MiB. This is an application-level import restriction, not the browser's localStorage quota.
- The long-text benchmark measures saving and loading application data. It does not establish that every large archive can be exported, transferred between devices and restored successfully under all browser conditions.
- Recovery copies consume additional storage because they contain full saved records. A large primary archive can therefore create substantial additional storage demand.
- The protected-copy ceiling does not impose a total storage ceiling across ordinary recovery copies, the primary record and other browser data.

There is no evidence-based universal safe archive size for all supported devices. Users should keep independent backups rather than relying on the browser profile as the only copy.

### Browser storage limitations

`localStorage` is synchronous and stores the application record as a whole JSON value. Larger records increase the amount of data that must be serialised, written and read back.

Available browser storage is not a fixed amount that Mopapa can promise. It varies with browser implementation, device conditions, origin storage usage and browser policies.

The application cannot guarantee that:

- A particular archive size will always fit.
- A successful save will remain available indefinitely.
- Browser storage will not be cleared by the user, browser settings or profile removal.
- Data will survive device loss or physical failure.
- Recovery copies stored in the same browser profile will remain available if that profile is lost.
- A successful browser download means an independent backup has been retained.

The 5 MiB import limit, benchmark results and protected recovery-copy ceiling address different constraints. None of them represents a guaranteed browser storage quota.

Real-device and additional browser-engine testing remains necessary before making stronger archive-size or reliability claims.


## Acceptable save and search latency targets

These are provisional engineering targets for the current local-first implementation. They are intended to keep ordinary interactions responsive as the archive grows. They are not measured guarantees or claims about every supported device.

### Reference workload

Use the existing largest long-text benchmark as the principal reference workload:

- 3,000 saved entries.
- Up to 1,000 characters per entry.
- Approximately 3.53 million JSON characters in the tested dataset.
- Search across all entries, without restricting the search to a room.

The 5,000 short-entry benchmark remains useful as a separate storage and save-performance reference.

### Target latency

| Operation | Target |
|---|---:|
| Successful save, including serialisation, storage write and readback verification | 100 ms or less at p95 |
| Search engine execution, including matching and ranking | 100 ms or less at p95 |
| Search submission through to visible results | 200 ms or less at p95 |
| Normal-operation warning threshold | 250 ms |

The p95 target means that at least 95% of measured operations should complete within the stated time under the defined test conditions.

A failed save must never be treated as acceptable merely because it completes quickly. Correct persistence and truthful failure handling take priority over latency.

### Measurement requirements

- Measure successful saves using the complete `store.save()` operation, not JSON serialisation alone.
- Measure search-engine execution separately from DOM rendering.
- Also measure the complete user-visible search interaction.
- Include exact-phrase, partial-word, multi-term and no-match searches.
- Use the same reference dataset when comparing changes.
- Warm up the code before collecting measurements.
- Collect at least 30 measured repetitions and report the median and p95.
- Record the browser, device, archive size and query type alongside results.
- Keep CI measurements separate from real-device measurements.

The current storage benchmark uses only three repetitions and reports a median. It is not sufficient to establish p95 performance.

### Current evidence and limitations

The existing CI benchmark demonstrates successful saves at the tested archive sizes. The latest recorded long-text save measurement is approximately 24.9 ms in headless Chromium.

There is currently no recorded search-latency measurement for the same dataset. Existing search tests establish functional behaviour and ranking, not execution time.

The targets above therefore remain provisional until search is benchmarked and the save measurements are repeated using a suitable sample size.

CI timing should initially be treated as diagnostic evidence rather than a strict pass/fail performance gate. Real-device measurements are necessary before making claims about Android responsiveness.

A sustained breach of these targets should trigger profiling and investigation before introducing an index or changing the storage architecture.


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


## Final evidence-based storage decision

**Review date:** 16 November 2026

**Decision: retain browser `localStorage` as Mopapa's primary persistence mechanism. Do not begin an IndexedDB migration at this stage.**

This decision is based on the current implementation, measured benchmark results, documented limitations and provisional latency targets.

### Evidence supporting the decision

- The current implementation successfully saves the tested archive sizes, including 5,000 short entries and 3,000 entries containing up to 1,000 characters each.
- The latest recorded long-text CI save measurement is approximately 24.9 ms for a dataset containing approximately 3.53 million JSON characters.
- The application already has validation, verified writes, best-effort rollback, recovery copies, backup export and restore handling.
- No measured result currently demonstrates that IndexedDB would materially improve the application's actual storage performance or reliability.
- Introducing IndexedDB would add asynchronous storage operations, migration logic, compatibility requirements and additional failure scenarios that would themselves need extensive testing.

### How the latency targets affect this decision

The provisional targets are:

- Successful save: 100 ms or less at p95.
- Search engine execution: 100 ms or less at p95.
- Search submission through visible results: 200 ms or less at p95.
- Normal-operation warning threshold: 250 ms.

The current save benchmark is encouraging but does not establish p95 performance. Its three repetitions and median measurement are insufficient for that conclusion.

Search latency has not yet been benchmarked against the reference archive. Therefore, neither the save nor search targets can currently be considered fully verified.

This uncertainty is a reason to collect better measurements, not sufficient evidence to justify a database migration.

### Conditions for reconsidering the decision

Review the storage architecture when:

1. Representative device measurements show sustained save latency above the provisional target.
2. Search measurements show sustained performance problems against the documented targets.
3. Normal expected use produces recurring storage quota failures.
4. The application requires capabilities that the current whole-record storage model cannot reasonably support.
5. A tested alternative demonstrates a material improvement in reliability or user experience.

A single slow measurement should trigger investigation, not an automatic migration.

Any proposed migration must include a verified migration path, preservation of the original data, interruption handling, rollback, backup compatibility and tests against realistic mobile browser conditions.

### Ongoing requirements

Until the decision changes:

- Keep `localStorage` as the primary persistence mechanism.
- Continue improving validation, recovery, backup clarity and failure handling.
- Benchmark save and search performance using the documented measurement requirements.
- Test on real mobile devices and additional browser engines.
- Keep independent backups. Browser storage and recovery copies are not substitutes for an external backup.
- Do not present provisional performance targets as proven guarantees.

**Final outcome: retain `localStorage` for the current development phase. Reconsider only when measured evidence or a genuine product requirement justifies the additional complexity of IndexedDB.**

---

## Personal-memory archive follow-up

**Review date:** 23 November 2026

The Stage 1 implementation has introduced conversation, message, memory, memory-source and memory-relationship collections as empty arrays in the live schema. Their non-empty archive workloads have not yet been implemented or benchmarked.

These proposed collections increase the importance of measuring realistic archive workloads before making a storage decision.

The existing benchmarks cover manual-entry datasets. They do not establish the performance or reliability of a large conversation archive with message provenance, relationships, governance metadata and recovery requirements.

The following measurements remain outstanding:

- Representative conversation and message counts.
- Typical and upper-bound message sizes.
- Provenance and relationship growth.
- Serialisation and complete save time.
- Initial load and validation time.
- Search and retrieval latency.
- Backup export and restore time.
- Recovery-copy growth.
- Quota and interrupted-write behaviour.
- Real-device measurements on supported Android browsers.

The current localStorage decision remains unchanged.

IndexedDB remains a candidate for investigation, not an approved migration.

### Stage 2 archive benchmark plan

The existing manual-entry benchmarks are not a proxy for conversation-archive performance.

Once Stage 2 has a working archive implementation, benchmark three message-count workloads:

- 1,000 messages.
- 10,000 messages.
- 50,000 messages.

These are diagnostic workload sizes, not supported archive limits or guarantees.

Message text sizes and metadata distribution should be based on reproducible synthetic native-conversation fixtures. No personal export or third-party platform data is required. Record the message-size distribution, conversation count, participant count and metadata size used by each fixture. Include a separate stress fixture containing unusually long messages.

Measure:

- Initial load and parsing.
- Full-dataset validation.
- Complete serialisation.
- Save and verified read-back.
- Backup export.
- Backup restore.
- Recovery-copy creation and storage growth.
- Native conversation and message creation duration.
- Save and retry duration.
- Quota and interrupted-write behaviour.

For each workload, record dataset size, browser, device, repetitions, median and p95 where the sample size permits.

Use at least 30 measured repetitions for stable timing comparisons after warm-up. Keep CI Chromium results separate from real-device results.

The first Android measurements should use the actual supported mobile browser and a representative device. CI results are diagnostic evidence, not proof of Android performance.

Do not introduce a hard archive-size limit, change the existing 5 MiB import limit or migrate to IndexedDB solely because a synthetic stress workload is large.

The storage decision remains localStorage until representative evidence demonstrates a material reliability or usability problem. If it does, conduct a separate storage review before proposing a migration.

No non-empty personal-memory record activation, storage-key change or second authoritative store is authorised by this follow-up. The Stage 1 schema-version-2 foundation remains active, with all five additional collections restricted to empty arrays.