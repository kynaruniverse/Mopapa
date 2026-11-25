Mopapa: Personal Memory Implementation Audit

Date: 20 November 2026

Repository: https://github.com/kynaruniverse/Mopapa

Branch: "main"

Inspected commit: "32f5052c95ab9253be84e877e03319eb59bd02c6"

Status: Historical implementation audit completed on 20 November 2026.
Current authority: "docs/personal-memory-record-specification.md" and "docs/personal-memory-build-plan.md".
Document role: Historical evidence about the implementation inspected at the recorded commit. Not a current repository audit.
Implementation status: No production changes authorised by this document.

The implementation-level record specification has since been developed and consolidated. The earlier statements in this audit describing schema work as outstanding are historical findings, not current instructions.

The inspected commit is not the current repository baseline. File ownership, test coverage, storage behaviour and implementation readiness must be re-inspected from the live main branch before the first production phase is proposed.

The original findings remain useful as historical evidence of the application's earlier limitations. They must not be presented as a fresh inspection of current code.

Current sequencing and outstanding decisions are maintained in "docs/personal-memory-build-plan.md". The canonical technical requirements are maintained in "docs/personal-memory-record-specification.md".

1. Purpose

This document records the inspection of Mopapa's existing implementation before the implementation-level personal-memory schema is finalised.

Its purpose is to establish:

- What the current application actually stores.
- Which existing behaviours must be preserved.
- Which parts of the approved logical model are not represented in the current code.
- Which compatibility risks must be addressed before a schema change.
- Which design decisions remain unresolved.
- What evidence and test coverage already exist.

This is an engineering audit, not an implementation instruction.

No production code, tests or live storage schema were changed as part of this audit.

2. Files inspected

The following files were inspected from the current "main" branch:

- "docs/personal-memory-architecture.md"
- "docs/personal-memory-data-model.md"
- "docs/personal-memory-build-plan.md"
- "docs/personal-memory-module-map.md"
- "docs/storage-architecture.md"
- "js/store.js"
- "js/memory/entries.js"
- "tests/run.js"
- "tests/browser.js"
- "index.html"

The inspection considered the existing storage structure, entry operations, validation, backup and restore behaviour, test ownership and proposed future record model.

3. Current storage implementation

3.1 Storage identity and schema

The current storage implementation is:

- Storage key: "mopapa.v1"
- Schema version: "1"
- Persistence: browser "localStorage"
- Serialisation: JSON
- Main implementation: "js/store.js"

The current top-level data domains are:

- "entries"
- "learned"
- "customRooms"
- "ask"

The in-memory application data object is reconstructed by the storage loader.

The loader currently understands these existing domains. It does not load the proposed conversation, message, extracted-memory, provenance or memory-relationship collections.

3.2 Version handling

The current loader accepts supported older or unversioned data and normalises it to schema version 1.

A schema version greater than the current supported version is rejected as unsupported. The original stored data is treated as corrupt recovery data rather than being interpreted as a newer schema.

Consequently, the proposed schema version 2 is not compatible with the current production loader.

A version 2 implementation must not be introduced by simply changing the schema version constant or adding arrays to the application data object.

3.3 Save behaviour

The current save routine:

1. Checks that the application is permitted to write.
2. Checks that storage is available and the current record has not changed.
3. Serialises the current in-memory data object.
4. Writes the serialised record.
5. Reads the record back.
6. Compares the saved value with the intended value.
7. Updates the conflict-detection baseline only after verification.

When a write fails, the storage layer attempts to restore the previous primary record.

This is a verified-write and best-effort rollback design. It must not be described as a guarantee of transactional recovery under every browser failure.

Any future data domain must participate in the same persistence and verification boundary.

3.4 Loading behaviour

The current loader reconstructs the known version 1 domains.

Unknown future top-level collections are not currently loaded into the in-memory application data object.

If new collections were introduced without updating the loader, a subsequent save could serialise an object that no longer contains those collections.

This is a material data-loss risk.

3.5 Backup and restore behaviour

The existing restore routine:

- Reads JSON through "FileReader".
- Checks the supported schema version.
- Validates existing entries.
- Validates supported room-learning, custom-room and Ask-learning data.
- Preserves the existing primary record before replacement where required.
- Checks for external storage changes.
- Replaces the in-memory data object.
- Saves and verifies the replacement.
- Restores the previous in-memory object if the save fails.

The replacement data object currently contains only the four existing domains.

The restore implementation does not yet validate or preserve the proposed personal-memory collections.

The current import limit is 5 MiB.

The proposed schema therefore requires a complete extension of the load, save, export, restore, recovery and validation paths before it can be used.

4. Existing manual-entry model

The current "entries" collection represents manually saved memories, tasks and appointments.

The implementation in "js/memory/entries.js" supports:

- Entry creation.
- Entry lookup and listing.
- Text editing.
- Entry deletion.
- Room movement.
- Tags.
- Completion state.
- Pinned state.
- Structured date information.
- Structured monetary information.
- Structured location facts.
- Rollback of in-memory changes when saving fails.
- Removal and restoration of associated Ask source choices.

The existing entry model includes fields such as:

- "id"
- "text"
- "room"
- "when"
- "hasTime"
- "amount"
- "fact"
- "amounts"
- "created"
- "done"
- "pinned"
- "tags"

Not every optional field is present on every older entry.

The existing entry validator also permits some unknown entry properties. A future schema must not assume that all legacy entries conform to a newly invented closed record format.

Decision

Existing manual entries remain a separate authoritative data domain in the initial personal-memory implementation.

The new extracted-memory model must not duplicate every manual entry or silently replace existing entry behaviour.

Any future unification requires separate evidence, a compatibility proposal and an approved migration plan.

5. Existing validation behaviour

The current storage layer has detailed validation for existing application domains.

Entry validation includes:

- Unique, non-empty identifiers.
- Text length and content requirements.
- Room identifier requirements.
- Date and date-time validation.
- Time-flag consistency.
- Boolean completion and pinning fields.
- Tag count and tag length.
- Finite monetary values.
- Structured location-fact consistency.

The loading path can reject malformed individual entries while preserving valid neighbouring entries and attempting to preserve the original raw record.

The restore path is stricter: malformed imported entry records cause the backup to be rejected rather than silently producing a partially restored dataset.

This difference between startup recovery and user-requested restore must be preserved deliberately.

The new personal-memory validator must define its own failure policy. It must not silently discard malformed relationships and then report that a complete backup was restored successfully.

6. Existing recovery and reliability behaviour

The existing storage layer provides:

- Verified writes.
- Conflict detection.
- Read-only write protection.
- Recovery-copy creation.
- Corrupt-data preservation.
- Partial-rejection preservation.
- Recovery-copy inventory.
- Bounded recovery retention.
- Recovery-copy deletion safeguards.
- Backup export.
- Original recovery export.
- Restore rollback.
- Browser storage persistence requests.

These capabilities are established engineering assets.

New collections must not bypass them by using a second independent storage mechanism or writing directly to browser storage from a separate module.

The current design stores application data as one JSON value. Any extension must keep the ownership and persistence boundary explicit.

7. Test coverage audit

At the time of source inspection:

- "tests/run.js" contains 547 "test(...)" declarations.
- "tests/browser.js" contains 102 browser-check declarations.

These are source-level declaration counts, not independently reported execution totals.

The latest GitHub Actions check associated with the inspected commit completed successfully:

- Commit: "32f5052c95ab9253be84e877e03319eb59bd02c6"
- Run: "44707986147"
- Job: "136192246964"
- Result: successful.

7.1 Existing unit-test coverage

The unit suite contains substantial coverage for:

- Storage loading.
- Legacy data normalisation.
- Invalid and partially rejected entries.
- Duplicate entry identifiers.
- Corrupt-data preservation.
- Recovery-copy retention and deletion.
- Save failures.
- Storage conflicts.
- Read-only operation.
- Backup export.
- Restore validation.
- Restore rollback.
- Custom-room validation.
- Ask-learning validation.
- Existing entry operations.

7.2 Existing browser-test coverage

The browser suite includes:

- Successful backup and restore.
- Restoration of existing saved application domains.
- Recovery-copy restoration.
- Malformed backup rejection.
- Duplicate-ID rejection.
- Unsupported schema rejection.
- Restore cancellation.
- Cross-tab conflict protection.
- Oversized backup rejection.
- Corrupt startup recovery.
- Storage access failures.
- Quota-style save and restore failures.

7.3 Duplicate test observation

Two unit tests currently have the same name:

"restore rejects duplicate entry IDs without changing existing data"

They appear at different locations in "tests/run.js" and exercise substantially overlapping duplicate-ID rejection behaviour.

This must be considered before adding further duplicate-ID tests.

Do not remove or alter existing tests as part of this audit. A later test-maintenance decision should establish whether the existing cases are genuinely redundant or cover distinct validation paths.

7.4 New-domain coverage gap

There is currently no production implementation or corresponding test coverage for:

- Conversation records.
- Conversation participants.
- Original message records.
- Structured message authorship.
- Quoted-speaker annotations.
- Extracted memory records.
- Memory lifecycle transitions.
- Independent evidence states.
- Memory provenance links.
- Memory-to-memory relationships.
- Scope and applicability enforcement.
- Audience visibility.
- Independent use permissions.
- Restriction inheritance.
- Deletion and revocation of extracted memories.
- Re-import suppression.

The existing tests must remain intact while these capabilities are designed.

New tests should be added only after the exact validation and operation rules are defined.

8. Storage performance evidence and limitations

The storage architecture document records the following CI Chromium benchmark results:

Dataset| Save time
250 short entries| 0.7 ms
1,000 short entries| 2.5 ms
3,000 short entries| 7.6 ms
5,000 short entries| 14.1 ms
3,000 entries with 1,000-character text| 24.9 ms

The largest long-text dataset produced approximately 3.53 million JSON characters.

The recorded application load time for that dataset was approximately 10.6 ms.

These results support retaining localStorage for the current implementation.

They do not establish:

- Real-device Android performance.
- Performance for large conversation archives.
- Safe maximum archive size.
- Backup and restore performance for millions of message records.
- Guaranteed storage capacity.
- Reliability under every browser quota or interruption condition.

The existing benchmark measures the entry-based application model.

A separate representative conversation-archive workload is required before making a storage decision for the future product.

IndexedDB remains a candidate for later evaluation, not an approved migration.

9. Implementation-level schema decisions still required

The approved logical model is not yet sufficiently precise to implement.

The following decisions must be completed.

9.1 Conversation and participant representation

Define:

- Exact conversation fields.
- Whether participants are embedded in conversation records or stored separately.
- Participant identifier generation.
- Participant identifier uniqueness.
- Participant source-label preservation.
- Participant identity-resolution history.
- Behaviour when participants are corrected, removed or reassigned.
- Referential integrity between participants and messages.

The current logical design places participants within the conversation model, but the exact serialised structure and mutation behaviour remain outstanding.

9.2 Message representation and attribution

Define:

- Exact message fields.
- Required and optional values.
- Original source role.
- Structured author representation.
- Source or import origin.
- Imported-source identifiers.
- Unknown and ambiguous authorship.
- Stable sequence ordering.
- Original timestamp representation.
- Receipt/import timestamp representation.
- Maximum message size and supported text format.

The logical model distinguishes author, source origin, quoted speaker and subject. The implementation schema must preserve those distinctions.

The build plan also identifies "imported" as an attribution class, while the proposed author-kind values distinguish user, assistant, system, third-party and unknown.

These terms must be reconciled. Import origin must not be confused with the identity of the original message author.

9.3 Quoted-speaker annotations

Define:

- Where quoted-speaker annotations are stored.
- Whether annotations are embedded in messages or held separately.
- Participant-reference rules.
- Evidence-span representation.
- Exact string-offset semantics.
- Behaviour for ambiguous or unknown attribution.
- Validation of Unicode and surrogate-pair offsets.
- Correction and deletion behaviour.

The original message text must remain unchanged.

9.4 Memory representation

Define:

- Exact memory fields.
- Memory type versus category.
- Single versus multiple subject representation.
- Lifecycle state.
- Independent evidence state.
- Temporal validity.
- Recorded, created and updated timestamp semantics.
- Candidate acceptance.
- Correction history.
- Dismissal behaviour.
- Unsupported-memory behaviour.

The earlier logical proposal used a plain-text subject and an initial status set. The later approved amendments introduce a subjects array, memory types, candidate lifecycle state and independent evidence state.

The implementation schema must use one reconciled representation rather than retaining competing alternatives.

9.5 Provenance representation

Define:

- Exact memory-source fields.
- Evidence-span fields.
- Source author attribution.
- Source-local participant references.
- Source relationship types.
- Duplicate-link identity.
- Multiple-source policy combination.
- Provenance correction.
- Source deletion and reassessment.

A memory must not remain an established fact when its supporting evidence has been deleted or revoked.

9.6 Historical relationships

Define:

- Exact relation fields.
- Supported relation types.
- Relationship direction.
- Evidence requirements.
- Duplicate detection.
- Self-reference prevention.
- Supersession-cycle prevention.
- Contradiction handling.
- Relationship correction and deletion.

A newer timestamp alone must not establish supersession.

9.7 Scope and governance

Define the exact serialised representations for:

- Scope.
- Scope references.
- Audience visibility.
- Use permissions.
- Explicit denial.
- Restrictions.
- Restriction provenance.
- Restriction inheritance.
- Policy history.
- Unknown and conflicting metadata.

Governance must be evaluated before restricted information enters retrieval or answer context.

The implementation must not treat missing permissions as permission.

9.8 Deletion, revocation and re-import

Define:

- Hard deletion and any permitted retained metadata.
- Source-message deletion.
- Conversation deletion.
- Memory deletion.
- Dismissal.
- Revocation.
- Restriction changes.
- Provenance reassessment.
- Derived-index cleanup.
- Backup and recovery-copy behaviour.
- Prevention of unwanted information being recreated by repeated imports.

The design must balance re-import protection with the requirement not to retain prohibited personal content unnecessarily.

9.9 Temporal semantics

Define:

- Original source timestamp.
- Import/receipt timestamp.
- Memory-recording timestamp.
- Memory creation timestamp.
- Memory update timestamp.
- Validity start.
- Validity end.
- Unknown date representation.
- Time-zone handling.
- Inclusive or exclusive validity boundaries.

Import time must never be substituted for the date on which a described event or fact became true.

10. Migration and backup implications

The proposed version 2 model is not live.

The current application does not support version 2.

Before implementation, the design must specify:

1. The exact version 1 to version 2 transformation.
2. Handling of unversioned legacy records.
3. Preservation of all existing entries.
4. Preservation of learning data and custom rooms.
5. Creation of all new collections.
6. Validation of every new collection.
7. Relationship-integrity validation.
8. Backup compatibility.
9. Restore compatibility.
10. Recovery-copy behaviour.
11. Failed migration rollback.
12. Failed restore rollback.
13. Retry behaviour.
14. Re-import behaviour.
15. Storage-key compatibility.

The existing storage key "mopapa.v1" and the internal schema version are separate concerns.

No storage-key change is implied by the proposed schema version 2.

All new domains must remain within the existing storage ownership boundary unless a separate, explicitly approved storage architecture decision changes that boundary.

11. Audit conclusions

The current application provides a substantial foundation for incremental personal-memory development.

The existing manual-entry model, deterministic Ask engine, local persistence, validation, backup, restore and recovery behaviour should be preserved.

The current storage implementation is not ready to accept the proposed personal-memory collections.

The logical data model is a useful architectural direction, but it does not yet define an implementation-ready schema.

The most important compatibility requirement is that every new record domain must be supported consistently across loading, validation, saving, backup, restore, recovery and migration.

The most important data-integrity requirement is that no memory may become an established fact without valid, correctly attributed supporting evidence and applicable permission.

The most important privacy requirement is that deletion, revocation and restriction must not be bypassed by derived memories, indexes, cached context or repeated imports.

12. Decisions and restrictions

The following remain in force:

- No production implementation is authorised by this audit.
- No live schema change is authorised.
- No IndexedDB migration is authorised.
- No external AI service is authorised.
- No paid service or recurring dependency is authorised.
- No cloud synchronisation is authorised.
- No replacement of existing manual entries is authorised.
- No replacement of deterministic Ask is authorised.
- Existing recovery and backup safeguards must be preserved.
- Existing test coverage must not be weakened.
- The implementation-level schema must be completed and reviewed before production code is proposed.

13. Next task

Produce the implementation-level record specification.

It must contain exact JSON examples and field-definition tables for:

1. Conversations.
2. Conversation participants.
3. Messages.
4. Quoted-speaker annotations.
5. Memory records.
6. Memory subjects.
7. Memory-source/provenance records.
8. Memory relationships.
9. Scope and context references.
10. Audience and use-policy metadata.
11. Restrictions and restriction provenance.
12. Identity-correction records or an explicitly justified alternative.
13. Deletion and re-import protection metadata.

For every field, specify:

- Type.
- Required or optional.
- Null behaviour.
- Default behaviour.
- Allowed values.
- Maximum length or collection size.
- Identifier and reference rules.
- Validation rules.
- Whether the field is original evidence or derived metadata.
- Whether the field is mutable.
- Backup and restore behaviour.

The specification must also define whole-dataset invariants and validation-failure policy.

Only after this specification is complete should migration, backup compatibility and implementation-phase acceptance criteria be finalised.

The next milestone is an approved implementation-level data model, not production coding.

---

14. Follow-up: subsequent design work

Date: 22 November 2026

The original audit remains the record of the existing production implementation inspected at the time of the audit.

Since that inspection, the following implementation-level design documents have been created:

- docs/personal-memory-record-specification.md
- docs/personal-memory-identity-evidence-temporal-specification.md
- docs/personal-memory-governance-lifecycle-specification.md
- docs/personal-memory-deletion-revocation-recovery-specification.md
- docs/personal-memory-backup-restore-compatibility-matrix.md
- docs/personal-memory-schema-consistency-review.md

These documents address many of the design gaps identified in the original audit.

They do not change the audit's findings about the existing production code.

The current production application still does not provide the proposed persistent conversation archive, extracted-memory collections, complete provenance model or proposed governance enforcement.

The proposed five new collections remain design concepts. Schema version 2 is not active. The current storage key and production schema remain unchanged.

The detailed specifications still require final cross-document review, explicit approval and implementation-readiness decisions.

Outstanding blockers include:

- Final approval of the implementation-level record model.
- Deletion-suppression and recovery-copy sanitisation.
- Backup-format and migration decisions.
- Representative archive storage measurements.
- Complete evaluation fixtures and acceptance thresholds.
- Explicit approval of the first production implementation phase.

The next milestone is a reviewed and approved implementation design with a defined first production phase, not automatic coding or an assumed storage migration.

No production implementation is authorised by this follow-up.