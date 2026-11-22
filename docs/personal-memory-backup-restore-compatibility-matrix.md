Mopapa: Personal Memory Backup, Restore and Schema Compatibility Specification

Product: Mopapa Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa
Status: Proposed technical specification. Pending review and explicit approval.
Implementation status: Design only. No production changes authorised.

Prerequisite documents

- "docs/storage-architecture.md"
- "docs/personal-memory-architecture.md"
- "docs/personal-memory-data-model.md"
- "docs/personal-memory-record-specification.md"
- "docs/personal-memory-schema-consistency-review.md"
- "docs/personal-memory-implementation-audit.md"
- "docs/personal-memory-identity-evidence-temporal-specification.md"
- "docs/personal-memory-governance-lifecycle-specification.md"
- "docs/personal-memory-deletion-revocation-recovery-specification.md"
- "docs/personal-memory-build-plan.md"

---

1. Purpose

This specification defines how Mopapa must preserve, export, import, restore, validate and migrate application data as the Personal Memory Companion develops.

Its central purpose is to prevent data loss when the application evolves from its existing schema version 1 to a future proposed personal-memory schema.

It establishes:

1. A compatibility matrix for current and proposed schemas.
2. Rules for importing older backups.
3. Rules for restoring newer backups.
4. Rules for preserving existing manual entries and learning data.
5. Validation requirements for all five proposed personal-memory collections.
6. Deletion and revocation preservation during backup and restore.
7. Migration preparation, commit, verification and rollback requirements.
8. Recovery-copy compatibility.
9. Older-version application behaviour.
10. Required tests and implementation acceptance criteria.

This is a design specification, not implementation authorisation.

No production JavaScript changes, schema activation, storage-key change, IndexedDB migration or new collection are authorised.

2. Current implementation baseline

2.1 Existing storage

The current application uses:

Property| Current implementation
Persistence| Browser "localStorage"
Primary storage key| "mopapa.v1"
Current schema version| "1"
Serialisation| JSON
Main storage owner| "js/store.js"
Backup import| Browser "FileReader"
Current import size limit| 5 MiB
Save strategy| Whole-record serialisation and verified write
Rollback| Best-effort restoration of previous primary record

2.2 Existing top-level data domains

The current canonical application data contains:

Field| Purpose
"schemaVersion"| Current schema version.
"entries"| Existing manually saved memories, tasks and appointments.
"learned"| Legacy room-sorter learning data.
"customRooms"| User-created rooms.
"ask"| Ask aliases, confirmed source choices and unanswered questions.

These four data domains are the existing production baseline.

They must remain intact through any future personal-memory migration.

2.3 Current legacy handling

The current loader:

- Accepts supported unversioned legacy data as version 0.
- Accepts supported integer schema versions 0 through 1.
- Normalises supported data to schema version 1.
- Rejects unsupported, negative, non-integer or non-numeric versions.
- Rejects schema versions above 1.
- Reconstructs the known version 1 domains.
- Does not currently load the proposed personal-memory collections.

A future schema version 2 is therefore not supported by the existing production loader.

An older version 1 application must never be allowed to open and subsequently save a version 2 record as if it were compatible.

2.4 Existing backup and restore behaviour

The current restore process:

1. Reads the selected JSON file.
2. Checks the schema version.
3. Validates supported existing data domains.
4. Preserves the current primary data where required.
5. Checks storage conflict and write permissions.
6. Constructs replacement application data.
7. Saves and verifies the replacement.
8. Restores the previous in-memory object if the save fails.

The current restore replacement contains only the four existing data domains.

The proposed personal-memory collections are not yet supported by the production backup and restore implementation.

2.5 Existing recovery-copy behaviour

The current storage system has:

- Verified recovery-copy creation.
- Recovery inventory.
- Automatic retention of the 20 newest timestamped ordinary recovery copies.
- An additional protected current-data copy where required.
- Corrupt-data copies that are not automatically pruned.
- Undated legacy copies that are not automatically pruned.
- A protected-copy creation ceiling.
- User-controlled recovery-copy deletion safeguards.

Recovery copies contain full original JSON records.

They are not automatically compatible with a future schema merely because they exist.

Their contents must be treated as versioned data.

3. Proposed future schema

3.1 Five proposed collections

The approved logical direction proposes five additional collections:

1. "conversations"
2. "messages"
3. "memories"
4. "memorySources"
5. "memoryRelations"

The existing domains remain:

- "entries"
- "learned"
- "customRooms"
- "ask"

The future logical record is therefore expected to contain nine application data domains plus its schema-version field.

3.2 Proposed schema version 2

The proposed version 2 structure is:

{
  "schemaVersion": 2,
  "entries": [],
  "learned": {},
  "customRooms": [],
  "ask": {
    "aliases": [],
    "boosts": {},
    "unanswered": []
  },
  "conversations": [],
  "messages": [],
  "memories": [],
  "memorySources": [],
  "memoryRelations": []
}

This is a logical illustration, not an approved final serialised schema.

The "importLedger" collection previously proposed in the record specification remains unapproved and is excluded from this baseline.

No other additional top-level collection is authorised by this specification.

3.3 Existing data must remain separate

The five proposed collections must not replace the existing "entries" domain.

The initial implementation must preserve the distinction between:

- Manually saved entries.
- Original imported conversations.
- Original imported messages.
- Extracted memories.
- Evidence and provenance.
- Relationships between memories.

No automatic conversion of every manual entry into an extracted memory is authorised.

4. Compatibility principles

All future backup and restore behaviour must follow these rules.

4.1 Never discard an unknown newer schema

An application must not load a newer schema as if it were an older one.

If it cannot understand a record, it must preserve the original data and refuse an unsafe write or restore.

4.2 Never silently discard a known collection

Every supported collection must participate in:

- Loading.
- Validation.
- Normalisation.
- Saving.
- Backup export.
- Restore.
- Recovery-copy creation.
- Recovery-copy inspection.
- Migration.
- Rollback.
- Deletion and revocation reconciliation.

A collection that is absent from the in-memory object after loading must not be silently lost on the next save.

4.3 Preserve existing manual data

A migration must preserve all valid existing manual entries and their supported fields.

It must also preserve:

- Room configuration.
- Legacy sorter learning.
- Ask aliases.
- Ask source boosts.
- Ask unanswered questions.

The migration must not reset these domains to defaults simply because new personal-memory collections are being introduced.

4.4 Do not confuse missing and empty collections

For a schema version where a collection is required:

- Missing collection is a validation failure unless an explicit migration rule permits it.
- Empty array is a valid empty collection where the schema allows it.
- Null is not automatically equivalent to an empty array.
- A malformed collection must not silently become an empty collection.

The migration rules must specify which fields may be safely defaulted.

4.5 No partial successful restore

A restore must not report success if it has silently discarded invalid memories, messages, provenance records or relationships.

The initial restore policy should reject the complete proposed backup if any required personal-memory record or reference is invalid.

Any future partial-recovery mode must be separately designed, explicitly labelled and tested.

4.6 No automatic downgrade

A newer schema must not be converted to an older schema by dropping unsupported fields.

A downgrade requires an explicit, reviewed conversion strategy that identifies every loss and obtains informed user confirmation.

The default is to refuse downgrade.

4.7 Deletion and revocation take precedence

A backup must not silently override a completed deletion or a later revocation.

Restore must reconcile against the most authoritative available deletion and governance state.

If that state cannot be established reliably, the restore must fail closed rather than assume the backup is safe.

5. Schema compatibility matrix

5.1 Schema generations

Data version| Meaning| Current production support
Unversioned / version 0| Supported legacy form of existing application data.| Accepted and normalised to version 1.
Version 1| Existing four-domain application schema.| Supported.
Version 2| Proposed future schema containing the five personal-memory collections.| Not supported by current production code.
Version 3 or later| Future schema not yet designed.| Unsupported until explicitly implemented.

5.2 Application and backup compatibility

Application version| Backup version 0| Backup version 1| Backup version 2| Backup version 3+
Current version 1| Accept and normalise.| Accept.| Reject safely.| Reject safely.
Future version 2| Accept through an explicit version 0 migration.| Accept through an explicit version 1 migration.| Accept if fully supported.| Reject safely.
Future version 3| Accept only through tested migrations.| Accept only through tested migrations.| Accept only through tested migrations.| Accept only if fully supported.

This matrix describes intended compatibility.

It does not mean any future migration has already been implemented or approved.

5.3 Older application opening newer primary data

If an older application encounters a primary record with a schema version it does not support:

1. It must not reconstruct the record as an older schema.
2. It must not overwrite the primary record.
3. It must not discard unknown collections.
4. It must not offer ordinary editing against the unsupported record.
5. It must preserve the original data where possible.
6. It must explain that a newer application version is required.
7. It must provide a safe recovery route if one can be implemented without modifying the unsupported data.

An older application must never downgrade a newer primary record merely because it cannot understand it.

5.4 Version number is not sufficient proof

The schema version alone does not prove that a backup is valid.

The application must also validate:

- Required top-level fields.
- Record shapes.
- Identifier uniqueness.
- Reference integrity.
- Collection limits.
- Field types.
- Lifecycle values.
- Evidence-state values.
- Temporal values.
- Governance values.
- Deletion and revocation constraints.

A backup marked version 2 but containing an invalid or incomplete record structure must be rejected.

6. Migration compatibility matrix

6.1 Version 0 to version 1

The current implementation already supports the legacy version 0 to version 1 normalisation path.

Future work must preserve its established behaviour.

Any changes to this migration require regression tests for:

- Missing optional legacy fields.
- Legacy room-learning formats.
- Legacy custom-room icons.
- Legacy monetary values.
- Older Ask data.
- Invalid records.
- Duplicate IDs.
- Existing manual entry preservation.

6.2 Version 1 to proposed version 2

The future migration must preserve all four existing domains and introduce the five new collections.

Existing domain| Required migration behaviour
"entries"| Preserve existing manual entries and supported fields. Do not convert or duplicate automatically.
"learned"| Preserve and normalise using the established rules.
"customRooms"| Preserve valid user-created rooms and their identifiers.
"ask"| Preserve aliases, boosts and unanswered questions. Validate boost references against preserved entries.
"conversations"| Initialise as an empty collection when performing a valid version 1 to version 2 migration.
"messages"| Initialise as an empty collection.
"memories"| Initialise as an empty collection.
"memorySources"| Initialise as an empty collection.
"memoryRelations"| Initialise as an empty collection.

The migration must not invent conversations or extracted memories from existing manual entries.

6.3 Version 2 to future version 3

No version 3 schema is currently defined.

Any future version 2 to version 3 migration must have its own:

- Field-level migration specification.
- Collection compatibility rules.
- Reference migration rules.
- Deletion and revocation handling.
- Backup compatibility matrix.
- Rollback strategy.
- Regression test programme.

The system must not assume that a future schema can be safely migrated by adding default fields.

6.4 Migration matrix summary

Migration| Intended result| Approval status
Version 0 to version 1| Existing legacy normalisation.| Existing behaviour.
Version 1 to version 2| Preserve four existing domains and initialise five new collections.| Proposed, not authorised.
Version 2 to version 3| Not yet defined.| Not designed.
Version 2 to version 1| No automatic downgrade.| Prohibited by default.
Version 3+ to version 2| No automatic downgrade.| Prohibited by default.

7. Backup export requirements

7.1 Complete backup

A future full backup must include every required domain for its declared schema version.

For proposed version 2, this includes:

- "schemaVersion"
- "entries"
- "learned"
- "customRooms"
- "ask"
- "conversations"
- "messages"
- "memories"
- "memorySources"
- "memoryRelations"

It must not omit a collection merely because it is empty.

7.2 Backup metadata

The future backup format should identify:

- Schema version.
- Backup format version, if distinct.
- Export creation time.
- Application version where available.
- Whether the backup is complete or deliberately scoped.
- Whether any required data was excluded.

The final metadata fields and privacy implications remain to be reviewed.

Export metadata must not include unnecessary device identifiers, account identifiers or personal information.

7.3 Export validation

Before download:

1. Validate the in-memory dataset.
2. Confirm all required collections exist.
3. Confirm all references resolve.
4. Confirm lifecycle and governance rules are valid.
5. Confirm deletion and revocation constraints are satisfied.
6. Serialise the complete dataset.
7. Parse and validate the serialised output where practical.
8. Only then initiate the download.

A failed export must not be presented as a successful backup.

7.4 Backup integrity

The future format should include an integrity mechanism capable of detecting accidental corruption or truncation.

The mechanism must not be described as encryption or proof of authenticity unless it actually provides those properties.

A checksum or digest may detect accidental changes but does not prove who created the backup.

7.5 Backup size

The existing import limit is 5 MiB.

The proposed conversation archive may exceed the current practical workload and backup-size assumptions.

Before changing the limit, the project must measure:

- Representative conversation sizes.
- Large archive serialisation time.
- Export memory usage.
- Import parsing time.
- Restore validation time.
- Storage quota impact.
- Recovery-copy storage impact.
- Android device performance.

The import limit must not simply be increased without measurement.

8. Restore compatibility matrix

8.1 General restore policy

A restore is a complete data operation unless a separately approved scoped-restore feature is introduced.

The default is to validate the complete backup before replacing the active dataset.

8.2 Restore scenarios

Scenario| Required behaviour
Valid version 0 backup| Apply the supported legacy migration and restore.
Valid version 1 backup in version 1 app| Restore using existing version 1 rules.
Valid version 1 backup in version 2 app| Migrate to version 2, then restore only after full validation.
Valid version 2 backup in version 2 app| Validate all domains and references, then restore.
Version 2 backup in version 1 app| Reject without modifying the primary record.
Unsupported future backup| Reject without modifying the primary record.
Missing required collection| Reject unless an explicit migration rule permits the omission.
Empty valid collection| Accept where the schema allows it.
Null where an array is required| Reject.
Malformed record| Reject the complete restore.
Duplicate record ID| Reject the complete restore.
Missing referenced record| Reject the complete restore.
Invalid provenance| Reject the complete restore.
Invalid governance| Reject the complete restore.
Deleted record reappears in backup| Apply deletion-aware reconciliation or refuse restore.
Revoked permission reappears in backup| Preserve revocation or refuse restore.
Current dataset changes during restore| Reject stale restore and require reload/review.
Recovery copy cannot be secured| Cancel before replacement.
Commit or readback verification fails| Attempt approved recovery; never report success without verification.

8.3 No silent partial restore

If one required personal-memory record is invalid, the restore must not silently discard that record and restore the rest.

A future partial-recovery feature would need:

- A separate explicit user action.
- A detailed preview of excluded records and dependencies.
- Clear distinction between complete restore and partial recovery.
- Reference-integrity validation after exclusions.
- Deletion and revocation protection.
- A separate test programme.

It is not part of the initial proposed implementation.

9. Validation requirements by collection

9.1 "conversations"

Validation must cover:

- Unique stable conversation IDs.
- Valid source identity metadata.
- Participant structure.
- Participant identifier uniqueness within the defined scope.
- Valid timestamps and temporal precision.
- Valid import-origin metadata.
- Valid governance and restrictions.
- Supported conversation metadata fields.

A conversation must not reference a missing participant or invalid identity reference.

Unresolved conversation-local participants remain valid.

Global identity resolution remains disabled until its separate specification is approved.

9.2 "messages"

Validation must cover:

- Unique stable message IDs.
- Valid conversation references.
- Valid author attribution.
- Quoted-speaker annotations.
- Original text representation.
- Message timestamps and source timestamps.
- Evidence spans.
- UTF-16 code-unit offset convention.
- Valid temporal information.
- Import-origin metadata.
- Applicable governance and restrictions.

A message must not reference a conversation that does not exist.

Evidence offsets must be within the original text bounds.

9.3 "memories"

Validation must cover:

- Unique stable memory IDs.
- Valid memory type.
- Valid content.
- Valid lifecycle state.
- Valid evidence state.
- Valid subject attribution.
- Valid temporal validity.
- Valid scope and audience.
- Valid governance and restrictions.
- Valid provenance requirements.

A memory must not be accepted as established information merely because its record is structurally valid.

Evidence eligibility and governance must also pass.

The lifecycle enum must not contain "deleted". Deletion is an operation and resulting removal, not a lifecycle state.

9.4 "memorySources"

Validation must cover:

- Unique stable provenance IDs.
- Valid memory references.
- Valid source references.
- Supported provenance relationship types.
- Evidence attribution.
- Evidence spans where applicable.
- Source support, refutation, qualification or context-only semantics.
- Valid governance inheritance.

A provenance record must not reference a missing memory or missing source.

A source reference must resolve to the correct type of record.

9.5 "memoryRelations"

Validation must cover:

- Unique stable relationship IDs.
- Valid source and target memory IDs.
- Supported relationship type.
- No invalid self-reference where prohibited.
- Valid temporal or lifecycle conditions where applicable.
- No broken relationship endpoints.
- No prohibited cycles where the relationship type disallows them.

A missing relationship endpoint must not be silently removed during a successful complete restore.

9.6 Cross-collection invariants

The complete dataset must satisfy:

1. All IDs are unique within their defined namespaces.
2. All references resolve.
3. No memory has invalid or prohibited provenance.
4. No deleted source supports an active memory.
5. No revoked source supports a prohibited use.
6. No deleted memory is represented as an ordinary lifecycle state.
7. No invalid relationship is silently discarded.
8. No conversation or message is reconstructed from derived memory text.
9. No manual entry is silently converted into an extracted memory.
10. No unsupported governance permission is inferred from missing fields.
11. No invalid temporal value is silently normalised into a different fact.
12. No record is accepted merely because its JSON shape is valid.

10. Migration transaction requirements

10.1 Pre-migration inventory

Before migration, the application must:

1. Read the current primary record.
2. Confirm the supported schema version.
3. Validate the existing four domains.
4. Identify malformed or partially rejected data.
5. Preserve original source data where required.
6. Check storage write availability.
7. Check conflict and writable-tab status.
8. Inspect recovery-copy availability.
9. Estimate the projected migrated record size.
10. Confirm that the migration can proceed safely.

10.2 Pre-migration backup

Before committing a schema migration, the system must secure a verified recovery copy of the exact original primary data.

The recovery copy must be:

- Created before the migration write.
- Read back and verified.
- Identifiable as the pre-migration version.
- Preserved if the migration fails.
- Kept distinct from the migrated primary record.

If the required recovery copy cannot be secured, migration must not proceed.

10.3 Prepare phase

The migration must construct a new dataset without modifying the current primary record.

Preparation must:

1. Apply the explicit version migration.
2. Preserve existing manual entries.
3. Preserve learning and Ask data.
4. Initialise the five proposed collections only as permitted.
5. Validate all records.
6. Validate all references.
7. Validate governance and deletion rules.
8. Check collection and record limits.
9. Check the complete serialised size.
10. Produce the final candidate dataset.

10.4 Commit phase

The system must:

1. Confirm that the original primary record has not changed.
2. Confirm that the application still has write permission.
3. Write the candidate dataset to the authoritative storage location.
4. Read the stored value back.
5. Compare it against the intended serialised result.
6. Parse and validate the stored result.
7. Confirm that every expected domain exists.
8. Confirm that existing manual data remains intact.
9. Confirm that no migration data was lost.
10. Update the active in-memory state only after successful verification.

10.5 Failure before commit

If preparation or validation fails:

- The original primary record remains unchanged.
- The application does not report migration success.
- The user receives a clear explanation.
- The recovery copy remains available.
- The application may continue using the original supported schema if it remains valid.

10.6 Failure during commit

If the write or readback fails:

- The application must not assume rollback succeeded.
- It must inspect the authoritative stored value.
- It must verify whether the original data remains intact.
- It must use the approved recovery procedure if the state is uncertain.
- It must block ordinary writes while the authoritative state is unresolved.

The current storage layer provides verified writes and best-effort rollback, not an absolute database transaction.

The future migration design must preserve that distinction.

10.7 Post-commit verification

Migration is complete only after:

- The new schema can be read.
- Every required collection is present.
- All records validate.
- All references resolve.
- Existing manual entries are preserved.
- Existing learning data is preserved.
- Ask data remains valid.
- Backup export can serialise the new schema.
- Restore validation accepts the new schema.
- The application can reopen the migrated data successfully.

A successful write alone is insufficient evidence of migration completion.

11. Rollback and recovery matrix

Failure| Required response
Invalid source schema| Reject before migration. Preserve original data.
Missing required legacy domain| Apply only a documented migration default; otherwise reject.
Invalid existing entry| Follow the established startup or restore validation policy. Do not silently change the policy.
Invalid new personal-memory record| Reject the complete restore or migration candidate.
Missing reference| Reject candidate dataset.
Duplicate ID| Reject candidate dataset.
Insufficient storage| Cancel before commit where detectable. Preserve original data.
Recovery-copy creation fails| Do not migrate or replace primary data.
Storage conflict detected| Reject stale operation and require reload/review.
Write exception| Treat as failure and verify actual stored state.
Readback mismatch| Treat as failure; do not report success.
Rollback write fails| Mark state uncertain, preserve available recovery data and block unsafe writes.
Page closes before commit| Original primary record should remain authoritative. This requires interruption testing.
Page closes after commit| Reopen and validate the committed schema before ordinary use.
Newer app encounters older backup| Migrate only through an explicit tested path.
Older app encounters newer schema| Refuse to modify it.
Restore contains stale deleted data| Reconcile against authoritative deletion controls or refuse restore.

12. Deletion and revocation compatibility

This specification must be read together with:

"docs/personal-memory-deletion-revocation-recovery-specification.md"

12.1 Backup export after deletion

A complete backup created after a completed deletion must not include deleted records in its active dataset.

It must also not include prohibited derived information merely because it remains in a stale index or summary.

12.2 Backup created before deletion

A backup created before a deletion may contain the subsequently deleted information.

The application must not treat that backup as automatically safe to restore.

12.3 Restore after deletion

The restore process must identify deletion outcomes that occurred after the backup was created.

Where a reliable deletion outcome exists, it takes precedence over the stale backup record.

Where reliable reconciliation is not possible, restore must be refused rather than silently resurrecting the information.

12.4 Revocation preservation

A backup must not reinstate permission that has since been revoked.

Governance must be recalculated against the most authoritative available state.

Unknown permission must remain denied.

12.5 Suppression metadata

The deletion specification leaves the suppression mechanism unresolved.

This document does not approve:

- "importLedger".
- A sixth top-level collection.
- Permanent retention of deleted content.
- A particular deletion-marker format.

The backup format must accommodate a future approved suppression design without assuming what that design will be.

12.6 Recovery copies

Existing recovery copies contain complete historical JSON records.

They may therefore contain information later deleted from the active dataset.

The future implementation must define how deletion outcomes apply to:

- Ordinary recovery copies.
- Protected current-data copies.
- Corrupt-data copies.
- Undated legacy copies.
- Exported backups.

The current count-based retention rules do not, by themselves, solve deletion propagation.

A recovery copy containing deleted content must not be treated as a normal safe restore source without reconciliation.

13. Existing manual-entry compatibility

13.1 Preservation

Existing manual entries remain authoritative and separate.

Migration must preserve:

- IDs.
- Original text.
- Room assignment.
- Dates and time flags.
- Creation timestamps.
- Completion and pinning states.
- Tags.
- Monetary fields.
- Structured location facts.
- Supported unknown legacy entry properties.

13.2 No forced conversion

The migration must not:

- Convert every manual entry into a conversation.
- Invent a message author.
- Invent an original source.
- Create fabricated provenance.
- Treat the entry as a verified extracted memory.
- Delete the entry after creating another record.

13.3 Ask compatibility

Ask source boosts refer to manual entry IDs.

A migration must preserve valid boosts.

If an entry ID is changed or removed, the migration must explicitly handle affected boosts.

It must not leave stale Ask references or silently reset the user's learning.

13.4 Future relationships

A future feature may allow a manual entry to reference an extracted memory.

That relationship requires its own specification.

Until approved, the two data domains remain separate and independent.

14. Storage architecture implications

14.1 Keep localStorage for the current phase

The existing storage decision retains localStorage until measured evidence demonstrates a need to migrate.

This remains the current decision.

The proposed five collections do not automatically justify IndexedDB.

14.2 Whole-record serialisation

The current implementation serialises the complete application data object.

Adding five collections will increase:

- JSON serialisation work.
- Readback verification work.
- Storage usage.
- Recovery-copy size.
- Backup size.
- Restore parsing and validation work.

The complete archive must be benchmarked rather than assuming current entry-only performance remains representative.

14.3 No silent storage-key change

The current key remains "mopapa.v1" until an explicitly approved storage migration changes it.

The name of the key must not be confused with the internal schema version.

Changing the key or introducing a second key requires a separate migration and recovery design.

14.4 No premature IndexedDB migration

IndexedDB remains a candidate only if measured storage size, query requirements, reliability or performance justify it.

A future IndexedDB proposal must define:

- Migration from localStorage.
- Atomicity and transaction behaviour.
- Backup and restore.
- Deletion and revocation.
- Recovery after interruption.
- Data export.
- Browser compatibility.
- Device performance.
- Rollback or recovery if database creation fails.

It must not be introduced merely because the application has more collections.

15. Backup and restore test programme

Tests must be designed against the existing test suite before any new test code is added.

Inspect "tests/run.js" and "tests/browser.js" first.

Do not duplicate existing coverage.

15.1 Schema-version tests

- Accept supported unversioned version 0 data.
- Accept valid version 1 data.
- Reject unsupported version 2 data in the current version 1 application.
- Reject negative schema versions.
- Reject non-integer versions.
- Reject non-numeric versions.
- Reject unsupported future versions.
- Verify the primary record remains unchanged after rejection.
- Verify the original unsupported record is preserved where possible.

15.2 Version 1 to version 2 migration tests

- Preserve all manual entries.
- Preserve optional entry fields.
- Preserve unknown supported legacy entry properties.
- Preserve room configuration.
- Preserve sorter learning.
- Preserve Ask aliases.
- Preserve valid Ask boosts.
- Preserve unanswered questions.
- Initialise all five new collections.
- Verify no manual entry becomes an extracted memory.
- Verify no fabricated source or attribution is created.
- Verify the complete candidate dataset passes validation.

15.3 Collection validation tests

For each of the five collections:

- Missing collection.
- Empty collection.
- Null collection.
- Wrong collection type.
- Malformed record.
- Missing required field.
- Invalid field type.
- Duplicate ID.
- Invalid reference.
- Missing referenced record.
- Unsupported enum value.
- Oversized field.
- Invalid timestamp.
- Invalid temporal range.
- Invalid governance.
- Invalid evidence relationship.

15.4 Cross-collection tests

- Message references missing conversation.
- Memory references missing subject or source.
- Provenance references missing message.
- Relationship references missing memory.
- Deleted source supports active memory.
- Revoked source supports prohibited use.
- Invalid evidence state.
- Unsupported lifecycle state.
- Invalid temporal relationship.
- Cyclic relationships where prohibited.
- Duplicate IDs across the same identifier namespace.

15.5 Restore tests

- Restore valid version 0 backup.
- Restore valid version 1 backup.
- Restore valid version 2 backup in a version 2 implementation.
- Reject version 2 backup in current version 1 implementation.
- Reject unsupported future backup.
- Reject malformed JSON.
- Reject oversized backup.
- Reject invalid required collection.
- Reject invalid reference.
- Reject duplicate ID.
- Reject invalid governance.
- Preserve current primary data after failed validation.
- Preserve current primary data after failed recovery-copy creation.
- Preserve current primary data after write failure.
- Verify readback after successful restore.
- Verify application state after reopening.

15.6 Deletion and revocation restore tests

- Restore a backup containing a record deleted after backup creation.
- Restore a backup containing a revoked source.
- Restore a backup containing a memory whose only source was deleted.
- Restore a backup containing a memory with independently valid remaining evidence.
- Restore a backup containing stale relationships.
- Verify stale indexes or cached context do not reintroduce deleted data.
- Verify suppression controls survive restore where approved.
- Verify unresolved suppression state causes safe refusal.

15.7 Recovery-copy tests

- Create a pre-migration recovery copy.
- Verify exact original content.
- Fail recovery-copy creation.
- Fail recovery-copy readback.
- Verify migration does not proceed after recovery failure.
- Inspect old version 1 recovery copy in a version 2 implementation.
- Prevent automatic restore of an incompatible copy.
- Verify deletion reconciliation is applied to recovery copies.
- Verify corrupt-data copies are not silently pruned.
- Verify recovery inventory failure blocks unsafe cleanup.

15.8 Interruption tests

- Close or reload before migration commit.
- Close or reload after migration commit.
- Simulate a write failure.
- Simulate readback mismatch.
- Simulate rollback failure.
- Simulate concurrent tab modification.
- Verify no partially migrated dataset is treated as valid.
- Verify the next startup identifies the authoritative schema.

15.9 Browser and Android tests

Browser-level tests must verify:

- Backup export.
- Restore confirmation.
- Version mismatch messaging.
- Migration progress and failure messaging.
- No false success message.
- No loss of existing manual entries.
- Mobile usability for large backups.
- Storage quota failure handling.
- Reopen after migration.

CI Chromium tests must remain distinct from actual supported Android-device testing.

16. Performance and storage acceptance

The existing benchmark evidence covers manual-entry datasets, not a full conversation archive.

Before schema migration approval, measure representative datasets containing:

- Conversations.
- Messages.
- Participants.
- Extracted memories.
- Provenance links.
- Memory relationships.
- Governance metadata.
- Temporal metadata.

The benchmark must include:

1. Small archive.
2. Medium archive.
3. Large archive.
4. Many short messages.
5. Fewer long messages.
6. Many provenance links.
7. Many relationships.
8. Backup export.
9. Backup import.
10. Full validation.
11. Migration.
12. Recovery-copy creation.
13. Restore and readback verification.

Measure:

- Serialised size.
- Save latency.
- Load latency.
- Export time.
- Import time.
- Validation time.
- Migration time.
- Recovery-copy overhead.
- Peak memory use where measurable.

Use repeatable datasets and record browser, device and archive shape.

The current CI Chromium benchmark must not be presented as an Android performance guarantee.

The current 5 MiB import limit must remain unchanged until a measured and reviewed replacement is approved.

17. Required documentation alignment

This specification must be reconciled with:

- "docs/storage-architecture.md"
- "docs/personal-memory-record-specification.md"
- "docs/personal-memory-schema-consistency-review.md"
- "docs/personal-memory-implementation-audit.md"
- "docs/personal-memory-architecture-decisions.md"
- "docs/personal-memory-architecture.md"
- "docs/personal-memory-data-model.md"
- "docs/personal-memory-build-plan.md"
- "docs/personal-memory-governance-lifecycle-specification.md"
- "docs/personal-memory-deletion-revocation-recovery-specification.md"

Required corrections and decisions include:

1. Remove "deleted" from the proposed memory lifecycle enum in the record specification.
2. Keep deletion as an operation and resulting record removal.
3. Exclude the unapproved "importLedger" from the five-collection baseline.
4. Define how deletion suppression survives backups and restores.
5. Define how recovery copies containing deleted content are handled.
6. Define exact schema version 2 validation rules.
7. Define the backup format version and whether it is distinct from schema version.
8. Define version 1 to version 2 migration defaults.
9. Define strict restore behaviour for invalid new collections.
10. Define the compatibility behaviour of older application versions.
11. Confirm that all existing manual-entry and Ask data remain intact.
12. Keep localStorage as the current storage decision unless new evidence justifies reconsideration.

18. Unresolved decisions

The following decisions remain open.

18.1 Backup format version

Should backup format versioning be separate from the internal application schema version?

The preferred direction is to separate them if backup packaging or metadata may evolve independently of the stored record.

This requires an explicit decision.

18.2 Backup metadata

Which metadata fields are essential for version identification, integrity and safe restore without collecting unnecessary device or personal identifiers?

18.3 Strict validation policy

The proposed initial version 2 restore policy rejects the complete backup if any required personal-memory record is invalid.

Confirm whether this remains the correct default.

18.4 Migration defaults

Confirm that all five new collections should initialise as empty arrays during a valid version 1 to version 2 migration.

18.5 Recovery-copy sanitisation

Define how older full recovery copies are handled after a deletion operation.

18.6 Deletion suppression

Define the minimum retained metadata required to prevent deleted information returning through old backups and re-import.

18.7 Large archive limits

Define evidence-based import and archive limits after representative archive benchmarking.

18.8 Older application protection

Define how an older application version detects and refuses to write to a newer schema without damaging the primary record.

18.9 Storage architecture

Reconsider IndexedDB only if representative archive measurements or transaction requirements demonstrate a concrete need.

19. Implementation readiness criteria

This specification is not implementation-ready until:

- The schema compatibility matrix is approved.
- Version 1 to version 2 migration rules are final.
- The complete version 2 record schema is reconciled.
- All five collections have complete validation rules.
- Backup format versioning is decided.
- Restore validation and failure behaviour are final.
- Deletion and revocation reconciliation is final.
- Recovery-copy treatment is final.
- Existing manual-entry preservation is proven.
- Ask learning preservation is proven.
- Migration rollback is designed.
- Large-archive performance is measured.
- The test programme is reconciled against existing tests.
- Actual supported Android-device testing is planned.
- The implementation audit and module map are updated.
- Explicit implementation approval is obtained.

20. Implementation boundary

This document does not authorise:

- Production JavaScript changes.
- A live schema version change.
- Activation of schema version 2.
- A change to "mopapa.v1".
- A new storage key.
- An IndexedDB migration.
- A new top-level collection.
- An "importLedger" implementation.
- A partial-restore feature.
- External AI or hosted inference.
- Paid services or recurring dependencies.
- Cloud synchronisation.
- Automatic ingestion from other applications.
- Replacement or conversion of manual entries.
- Replacement of deterministic Ask.
- A wholesale application rewrite.

The existing application must remain functional while the proposed design is reviewed.

A completed compatibility specification is not permission to begin implementation.

21. Current conclusion

Backup and restore compatibility is a foundational reliability requirement for Mopapa's future personal-memory architecture.

The existing version 1 application cannot safely load the proposed version 2 schema. Its loader reconstructs only the four current domains, and its restore path does not yet validate or preserve the five proposed personal-memory collections.

The migration must therefore be treated as a complete data-preservation operation, not a small schema-version increment.

The highest-priority requirements are:

1. Preserve all existing manual data and learning.
2. Validate all five proposed collections and their references.
3. Prevent older application versions from damaging newer data.
4. Prevent backups from resurrecting deleted or revoked information.
5. Make migration failure recoverable.
6. Measure full archive behaviour before changing storage architecture.

Current status: Proposed specification. Pending review. No production implementation authorised.