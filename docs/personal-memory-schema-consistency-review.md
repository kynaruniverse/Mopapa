Mopapa: Personal Memory Schema Consistency and Decision Review

Date: 20 November 2026
Status: Review completed; decisions proposed, not yet approved
Product: Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa

1. Purpose

This review reconciles the following documents:

- "docs/personal-memory-architecture.md"
- "docs/personal-memory-data-model.md"
- "docs/personal-memory-record-specification.md"
- "docs/personal-memory-build-plan.md"
- "docs/personal-memory-implementation-audit.md"
- "docs/personal-memory-architecture-decisions.md"
- "docs/personal-memory-module-map.md"
- "docs/storage-architecture.md"

The purpose is to identify:

1. Conflicting definitions.
2. Missing field specifications.
3. Unclear ownership of data.
4. Incomplete lifecycle and governance rules.
5. Migration and deletion risks.
6. Decisions required before implementation.

This is a documentation review. It does not authorise production code or a live schema change.

2. Overall conclusion

The architecture, logical data model and implementation-level record specification are broadly aligned in their central direction.

They consistently establish that:

- Original conversations and messages must remain distinguishable from extracted memories.
- Original evidence must be preserved.
- Message author, quoted speaker and memory subject are different concepts.
- Memories need provenance.
- Historical changes and contradictions must not be silently erased.
- Scope, audience and use permissions must be explicit.
- Restrictions must be enforced before retrieval and context assembly.
- Existing manual entries must remain intact.
- The current local-first application must remain operational.
- Migration must be recoverable and testable.
- Production implementation remains unauthorised.

However, the record specification introduces additional details that are not yet reconciled with the approved logical model.

The most important outstanding issues are:

1. Identity ownership and identity correction.
2. Attribution of quoted evidence.
3. Temporal validity.
4. Provenance that supports, refutes or qualifies information.
5. Lifecycle transitions and evidence-state rules.
6. Governance inheritance and policy evaluation.
7. Deletion and re-import suppression.
8. Import-ledger privacy and retention.
9. Schema migration and backup compatibility.
10. Performance and archive-size limits.

The recommendation is to resolve these before migration design is treated as final.

3. Collection structure

Existing logical decision

The approved logical data model defines five new collections:

- "conversations"
- "messages"
- "memories"
- "memorySources"
- "memoryRelations"

Existing application domains remain:

- "entries"
- "learned"
- "customRooms"
- "ask"

New specification addition

The record specification adds:

- "importLedger"

It also embeds:

- Participants in conversations.
- Quoted-speaker annotations in messages.
- Subjects in memories.
- Identity correction history in participants.
- Governance metadata in applicable records.

Assessment

The embedded-record choices are reasonable because these records have a clear parent and do not necessarily need independent retrieval.

The import ledger is a separate architectural addition. It is not part of the previously approved five-collection model.

Recommendation

Retain the five approved logical collections as the baseline.

Do not approve "importLedger" as a permanent collection yet.

First establish whether reliable re-import suppression can be achieved using:

- Stable source identifiers.
- Import-source identity.
- Existing records.
- Explicit user deletion decisions.
- Minimal retained deletion metadata.

If a separate ledger is demonstrably necessary, approve it through a new architecture decision that includes its privacy, retention, backup and deletion implications.

Do not retain raw deleted message content for duplicate detection.

Decision status: Proposed, pending approval.

4. Identity and participant ownership

Problem

The specification uses "identityKey" in participant and subject records but does not define the authoritative identity record.

It is unclear:

- Who owns a global identity key.
- Whether identity keys can be shared across conversations.
- How a key is created.
- How two keys are merged.
- How a mistaken merge is reversed.
- What happens when an identity is deleted.
- Whether identity correction changes historical memories.
- Whether an identity key can identify the user, a third party or an organisation.

An identifier without a defined owner and lifecycle creates referential-integrity risks.

Recommendation

Adopt a two-level identity model.

Level 1: Conversation-local participant

Every imported conversation has its own participant IDs.

These IDs identify participants within that conversation only.

Level 2: Optional resolved identity

A participant may reference a separate, stable identity record only after an explicit resolution decision.

The global identity model should be a distinct logical entity, not an assumption that a display name or participant ID is globally unique.

Before implementation, specify:

- Identity record structure.
- Allowed identity types.
- Creation and resolution rules.
- Merge and unmerge behaviour.
- Correction history.
- Deletion and reference handling.
- Privacy and retention rules.

Until that specification exists, unresolved conversation-local participants are valid and global identity matching must remain disabled.

Decision status: Proposed, pending identity specification.

5. Message author, quoted speaker and evidence attribution

Problem

The specification distinguishes message author from quoted speaker, but the provenance record only contains "sourceAttribution".

That is insufficient for messages containing reported speech.

Example:

A user writes:

"My manager told me that the office will close in December."

The message author is the user.

The reported statement comes from the manager.

The user is the source of the report, but the manager is the attributed speaker of the quoted information.

Those are different facts.

Recommendation

Keep these concepts separate:

1. Message author: who wrote or sent the original message.
2. Quoted speaker: who is explicitly represented as having said the quoted material.
3. Evidence origin: the original message or external source.
4. Memory subject: who or what the extracted memory concerns.
5. Evidence attribution: whose statement the extracted claim represents.

A provenance record must be capable of referencing the relevant quoted-speaker annotation where one exists.

Proposed additional provenance field:

- "quotedSpeakerId": string or null.

Rules:

- Null means the supporting statement is attributed to the message author or no quoted speaker is established.
- A non-null value must reference a quoted-speaker annotation in the source message.
- The reference must not imply that the quoted statement is independently verified.
- A user reporting another person's statement must not be represented as direct evidence that the other person personally communicated with Mopapa.

The exact source-attribution rules must be tested against examples containing nested quotations, paraphrases and ambiguous speakers.

Decision status: Proposed, pending approval.

6. Temporal model

Problem

The logical data model uses "validFrom" and "validTo".

The record specification introduces:

- "temporal.validFrom"
- "temporal.validTo"
- "temporal.timeStatus"

But "timeStatus" has no complete allowed-value definition.

The documents also use several distinct time concepts:

- Event time.
- Message time.
- Conversation creation time.
- Import time.
- Memory creation time.
- Memory recording time.
- Validity start.
- Validity end.
- Correction time.

These must not be confused.

Recommendation

Retain the distinction between original time and Mopapa processing time.

The temporal model must represent:

Concept| Meaning
"timestamp"| Original message time
"receivedAt"| Time Mopapa received the source
"createdAt"| Time the record was created
"updatedAt"| Time the record was last changed
"recordedAt"| Time the memory was recorded
"validFrom"| Beginning of the period in which the information applies
"validTo"| End of the period in which the information applies

Define "timeStatus" using a controlled set:

- "known_interval"
- "known_start"
- "known_end"
- "approximate"
- "unknown"

The exact temporal representation must also support date-only information without inventing a time or timezone.

Further requirements:

- "validFrom" must not be later than "validTo" when both are known.
- Unknown dates must remain unknown.
- Approximate dates must not be presented as exact dates.
- A later recording time must not automatically imply a later validity period.
- A correction must not rewrite the original source timestamp.
- Timezone information must be retained where necessary to interpret the original source accurately.

The final representation of date-only and approximate intervals must be specified with examples before implementation.

Decision status: Proposed, pending temporal specification.

7. Provenance and evidence relationships

Problem

The current provenance model primarily supports one relationship:

- "supports"

This is not sufficient for all the cases identified in the research.

A source may:

- Support a memory.
- Refute a memory.
- Qualify a memory.
- Provide context without proving the claim.

A memory may also contain more than one independently testable claim.

Recommendation

Extend the proposed provenance relationship vocabulary to:

- "supports"
- "refutes"
- "qualifies"
- "context_only"

Definitions:

supports

The source provides evidence for the memory claim.

refutes

The source provides evidence against the memory claim.

qualifies

The source narrows, limits or adds conditions to the claim.

context_only

The source provides relevant context but is not evidence that the claim is true.

A provenance record must never be interpreted as support merely because a link exists.

Compound memories

The implementation model must avoid combining several independently verifiable claims into one indivisible memory when their evidence differs.

For example:

"Charles works at Company B and lives in Oxford."

The employment and location claims may have different sources, dates and permissions.

The design should favour separately retrievable claims where that distinction materially affects evidence, temporal validity or governance.

Evidence spans

Keep evidence spans linked to the original message.

The indexing convention remains a blocking decision.

The implementation must explicitly select and test UTF-16 code units or Unicode code points.

Decision status: Proposed, pending provenance specification.

8. Lifecycle and evidence state

Problem

The older logical data model defines:

- "active"
- "historical"
- "uncertain"
- "dismissed"
- "unsupported"

The record specification defines:

- "candidate"
- "active"
- "historical"
- "uncertain"
- "dismissed"
- "deleted"

It separately defines evidence states:

- "supported"
- "partially_supported"
- "unsupported"
- "disputed"
- "unverified"

The relationship between these states and allowed transitions is not yet fully defined.

Recommendation

Retain independent lifecycle and evidence states.

Use the following lifecycle states:

- "candidate"
- "active"
- "historical"
- "uncertain"
- "dismissed"

Do not use "deleted" as a long-term memory status if the record is actually being hard-deleted.

Deletion should be an operation with its own controlled workflow.

Retain the five proposed evidence states.

Required transition rules

Candidate

A newly extracted memory awaiting validation or acceptance.

Active

A memory accepted for permitted retrieval. Its evidence and governance must still be checked.

Historical

A memory that previously applied but is no longer current.

Uncertain

A memory whose meaning, attribution or truth is unresolved.

Dismissed

A memory explicitly rejected by the user or an authorised review action.

Additional rules:

- Candidate does not automatically mean supported.
- Supported does not automatically mean active.
- Active does not automatically mean current.
- Historical does not mean false.
- Dismissed must not be automatically restored through re-import.
- Unsupported memories must not be used as established facts.
- A memory may have disputed evidence while its lifecycle remains uncertain.
- A memory with no remaining valid evidence must be reassessed.
- Lifecycle changes must be recorded in a traceable revision history if needed to explain consequential changes.

Before implementation, define every permitted state transition and the operation responsible for it.

Decision status: Proposed, pending lifecycle specification.

9. Governance and permission inheritance

Problem

The logical data model establishes conservative permission inheritance.

The record specification defines governance fields but does not yet provide a complete executable policy-combination algorithm.

A memory may have several sources with different restrictions.

For example:

- Source A permits direct answers but prohibits cross-context reuse.
- Source B permits contextual answers.
- Source C explicitly prohibits inference.

The system must not choose whichever permission is most convenient.

Recommendation

Adopt a conservative intersection model.

For every proposed use:

1. Identify the memory and all supporting sources.
2. Identify applicable conversation-level restrictions.
3. Identify message-level restrictions.
4. Identify memory-level restrictions.
5. Identify any explicit audience constraints.
6. Evaluate the requested use against every applicable restriction.
7. Deny the use if any applicable rule explicitly denies it.
8. Deny the use if a required permission is unknown.
9. Only allow the use when all applicable requirements permit it.

Permission precedence

The order is:

1. Explicit denial.
2. Unknown or unresolved required permission.
3. Explicit allow, provided no applicable restriction denies the use.

An allow at one level must never override a denial at another applicable level.

Additional rule

Derived memories must not receive broader permissions than their supporting evidence.

If a memory has several sources, the system must calculate the permitted use from all sources that materially support the memory.

If a restricted source is removed, the system must reassess both the memory's evidence and its remaining permissions.

A memory must pass governance checks before entering retrieval results or answer context.

Decision status: Proposed, pending formal policy table and tests.

10. Scope and audience

Problem

The record specification defines scope and audience types but does not fully define valid references or how they interact.

A "project" scope, for example, needs a stable project reference.

A "named_audience" needs an unambiguous audience reference.

Recommendation

Use explicit references for all reference-dependent scope and audience types.

Do not treat free-text labels as authoritative identifiers.

Unknown scope or audience must not become unrestricted scope or audience.

For the initial implementation:

- "owner_only" is the conservative default audience.
- "unknown" is not permission to disclose.
- "personal" does not imply permission for proactive use.
- "conversation" scope must not automatically permit cross-conversation reuse.
- "project" scope requires an explicit project reference.
- "topic" scope requires a defined topic reference or a clearly documented alternative.
- "named_audience" requires explicit resolvable references.

The initial implementation should not support external sharing or multi-user access.

Decision status: Proposed, pending scope-reference specification.

11. Import idempotency and re-import suppression

Problem

The existing logical data model already requires safe retries and stable source identifiers.

The new record specification proposes "importLedger", but its privacy and retention behaviour is not resolved.

A ledger can prevent deleted information from silently returning, but it can also retain identifiers after the underlying personal data has been deleted.

Recommendation

Use stable source identifiers as the primary idempotency mechanism.

The import identity must be derived from:

- Source type.
- Stable source conversation identifier.
- Stable source message identifier, where available.

Do not use text similarity alone as proof of identity.

Do not store raw message text in a deletion ledger.

Before accepting a persistent ledger, establish:

- What information it stores.
- Why that information is necessary.
- How long it is retained.
- How the user deletes it.
- Whether it is included in backups.
- Whether restoring an older backup can recreate deleted information.
- How explicit re-import after deletion is authorised.

If a source provides no stable identifier, the application must state that exact duplicate detection cannot be guaranteed.

A deliberate deletion must not be undone silently by importing the same source again.

Decision status: Proposed; separate ledger not yet approved.

12. Deletion and revocation

Problem

The documents describe deletion at different levels but do not yet define one complete transaction model.

Deleting a message may affect several memories.

Deleting a memory may leave its original source message valid.

Deleting a conversation may affect memories supported by several conversations.

Revocation changes permission rather than necessarily deleting content.

Recommendation

Define four distinct operations.

Delete a message

- Delete the original message.
- Remove its provenance references.
- Reassess affected memories.
- Reassess relationships and governance.
- Remove derived indexes.
- Preserve independently supported memories where valid.

Delete a memory

- Delete the memory.
- Delete its provenance links.
- Delete its relationships.
- Remove derived index material.
- Do not delete source messages solely because the memory was removed.

Delete a conversation

- Identify all affected messages and memories.
- Determine which memories have independent supporting sources.
- Apply the user's explicit deletion choice.
- Ensure no orphaned references remain.
- Reassess restrictions and derived information.

Revoke use

- Deny the relevant use.
- Reassess dependent memories and indexes.
- Prevent revoked information from entering retrieval or answer context.
- Preserve only the minimum metadata required for the permitted purpose.

Hard deletion and backups

The design must distinguish:

- Live application deletion.
- Recovery-copy retention.
- Previously exported backups.
- Restored older backups.
- Deletion suppression metadata.

The application must not claim that deleting live data also erases previously exported files.

A restore must not silently undo a recorded deletion if the system has a valid, retained deletion-suppression record.

Decision status: Proposed, pending deletion transaction and backup policy.

13. Manual entries and extracted memories

Existing decision

Manual entries remain in "entries".

Extracted memories belong in "memories".

Assessment

This separation remains correct for the first implementation.

It avoids destabilising the existing Keep and Ask functionality and prevents accidental duplication of existing records.

Recommendation

Do not migrate existing entries into the new memory collection as part of the initial schema extension.

Do not automatically duplicate every manual entry into an extracted memory.

If future retrieval needs to combine both domains, use a shared retrieval interface or adapter rather than prematurely merging their storage models.

Any later unification requires a separate measured design and migration decision.

Decision status: Retain existing approved direction.

14. Backup, restore and schema compatibility

Problem

The proposed schema version 2 structure is still a design proposal.

The current live application uses schema version 1 and storage key "mopapa.v1".

The proposed collection additions must not be introduced until every persistence and recovery path supports them.

Recommendation

Before implementation, produce a complete compatibility matrix covering:

- Existing version 1 live data.
- Unversioned legacy data.
- Version 1 backup.
- Proposed version 2 backup.
- Malformed version 1 backup.
- Malformed version 2 backup.
- Unknown future schema version.
- Interrupted migration.
- Failed write.
- Failed restore.
- Recovery-copy failure.
- Re-import after deletion.
- Restore of an older backup after a later deletion.

The migration must be atomic from the user's perspective.

The existing data must remain recoverable if any step fails.

No storage-key change is approved.

No IndexedDB migration is approved.

Validation

New record domains must be validated together as a connected dataset.

A restore must not report full success after silently dropping invalid memories, provenance or relationships.

Decision status: Required before implementation.

15. Storage volume and performance

Existing evidence

The current storage architecture documentation records CI Chromium measurements for existing entry workloads.

Those measurements do not establish the safe capacity of large conversation archives on actual Android devices.

Recommendation

Before choosing localStorage or IndexedDB for the new workload, define a representative archive benchmark.

It must include:

- Many short messages.
- Fewer long messages.
- Large conversations.
- Many conversations.
- Multiple sources per memory.
- Large provenance collections.
- Large relationship collections.
- Import and export.
- Restore.
- Index rebuilding.
- Search and retrieval.
- Interrupted writes.
- Quota failure.

Measure:

- Serialisation time.
- Save time.
- Load time.
- Search latency.
- Restore time.
- Export time.
- Memory consumption where measurable.
- Failure behaviour near storage limits.

Test on an actual supported Android browser/device as well as CI Chromium.

Do not select IndexedDB simply because it is commonly used for large datasets. Select it only when measured workload and reliability evidence justify it.

Decision status: Measurement required.

16. Evaluation alignment

The research programme requires separate evaluation of:

- Memory extraction.
- Attribution.
- Provenance.
- Retrieval.
- Temporal reasoning.
- Updating and supersession.
- Contradiction handling.
- Governance.
- Deletion and revocation.
- Abstention.
- Storage and recovery.

The record schema must make these capabilities testable.

A high answer score must not compensate for:

- Wrong speaker attribution.
- Unsupported memory creation.
- Restricted information leakage.
- Failed deletion.
- Re-import of deleted information.
- Incorrect temporal claims.
- Broken source references.

The Oracle diagnostic fixtures must remain separate from non-oracle retrieval evaluation.

The existing 50-note evaluation must remain a separate regression measure.

No benchmark score should be presented as proof of general real-world memory accuracy.

Decision status: Retain existing evaluation separation; detailed fixtures and thresholds remain to be finalised.

17. Decision register

ID| Decision| Recommendation| Status
D1| Five logical collections| Retain approved model| Proposed confirmation
D2| Additional import ledger| Defer pending privacy analysis| Proposed
D3| Global identity| Separate identity specification| Proposed
D4| Quoted-speaker provenance| Add explicit quoted-speaker reference| Proposed
D5| Temporal model| Define complete temporal semantics| Proposed
D6| Evidence relationships| Add supports, refutes, qualifies, context-only| Proposed
D7| Lifecycle| Separate lifecycle from evidence state; deletion is an operation| Proposed
D8| Governance| Conservative intersection with explicit denial precedence| Proposed
D9| Scope and audience| Require resolvable references; unknown denies use| Proposed
D10| Import idempotency| Stable source identifiers first| Proposed
D11| Deletion| Separate message, memory, conversation and revocation operations| Proposed
D12| Manual entries| Keep separate from extracted memories| Retain
D13| Migration| Complete compatibility and rollback matrix| Required
D14| Storage| Measure realistic archives before technology decision| Required
D15| Evaluation| Keep extraction, retrieval and governance evaluation separate| Retain

No proposed decision in this register automatically changes the approved architecture or authorises implementation.

18. Work required before migration design

The following documents or sections must be completed before a migration plan can be approved:

1. Global identity specification.
2. Exact provenance and quoted-speaker specification.
3. Temporal field specification.
4. Lifecycle transition table.
5. Governance policy-combination table.
6. Scope and audience reference rules.
7. Deletion and revocation transaction specification.
8. Import idempotency and deletion-suppression policy.
9. Complete backup and restore compatibility matrix.
10. Representative conversation archive benchmark design.

These should be completed as design work, not production code.

19. Implementation boundary

The following remain unauthorised:

- Production JavaScript changes.
- Live schema changes.
- Schema version 2 activation.
- IndexedDB migration.
- External AI services.
- Paid APIs or recurring dependencies.
- Cloud synchronisation.
- External sharing.
- Automatic ingestion from other applications.
- Replacement of existing manual entries.
- Replacement of deterministic Ask.

The current application remains the working baseline.

20. Next task

The next task is to resolve the identity, attribution, provenance and temporal specifications.

These are foundational because every extracted memory depends on knowing:

- Who made the original statement.
- Whether the statement was quoted or reported.
- Who or what the memory concerns.
- Which original evidence supports it.
- When the information applied.
- Whether the identity and interpretation are sufficiently established.

After these decisions, proceed to lifecycle, governance and deletion rules, followed by migration and recovery design.

Current decision: The overall architecture remains valid. The implementation-level record specification requires refinement before it can be treated as implementation-ready. Production implementation remains unauthorised.