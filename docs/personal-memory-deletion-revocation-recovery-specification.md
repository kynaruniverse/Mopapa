Mopapa: Deletion, Revocation, Recovery and Re-import Transaction Specification

Product: Mopapa Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa
Status: Proposed technical specification. Pending review and explicit approval.
Implementation status: Design only. No production changes authorised.

Prerequisites

- "docs/personal-memory-architecture.md"
- "docs/personal-memory-data-model.md"
- "docs/personal-memory-record-specification.md"
- "docs/personal-memory-schema-consistency-review.md"
- "docs/personal-memory-identity-evidence-temporal-specification.md"
- "docs/personal-memory-governance-lifecycle-specification.md"
- "docs/personal-memory-implementation-audit.md"
- "docs/storage-architecture.md"
- "docs/personal-memory-build-plan.md"

---

1. Purpose

This document specifies how Mopapa must handle deletion, revocation, recovery and re-import across the proposed personal-memory system.

It defines the expected behaviour when a user:

1. Deletes an individual memory.
2. Deletes an original message.
3. Deletes an entire conversation.
4. Revokes permission to use a source.
5. Restricts the use of information without deleting it.
6. Corrects or withdraws previously supplied information.
7. Restores an earlier backup.
8. Re-imports previously processed information.
9. Encounters a failed, interrupted or partially completed operation.

The central requirement is that deletion and revocation must affect every dependent record and every route through which prohibited information could influence the application.

Removing a visible memory while leaving its source, derived records, search indexes, cached context or recovery copies available for ordinary use is not a successful deletion.

Likewise, a failed operation must not leave Mopapa in a state where it reports that information has been deleted when it can still be retrieved.

This specification is a design proposal. It does not authorise production implementation, schema migration, IndexedDB, external AI, paid services, cloud synchronisation or a new storage collection.

2. Governing principles

2.1 User control

- Explicit user deletion requests take precedence over automatic memory formation.
- A deletion request must not be silently downgraded to dismissal or restriction.
- A user must be able to understand what is being deleted and the consequences for dependent information.
- The system must not claim that deletion is complete until the required transaction has committed and its postconditions have been verified.
- An operation that cannot be completed safely must report that it failed or remains incomplete.

2.2 Evidence integrity

- Original evidence and extracted memories remain distinct.
- Deleting a memory does not automatically mean the original evidence should be deleted.
- Deleting original evidence must trigger assessment of every memory that depends on it.
- Evidence must not remain usable merely because a derived memory has already been created.
- The system must not recreate deleted information from summaries, cached context or derived records.

2.3 Conservative failure behaviour

- Unknown deletion state must not be treated as successful deletion.
- Unknown permission must not permit use.
- Invalid references must not be treated as evidence that a record is safe.
- An incomplete cleanup must block affected retrieval and memory formation.
- A recovery mechanism must not silently restore information that a completed deletion operation removed.

2.4 Minimal retention

- Deletion must not become an excuse to retain unnecessary personal content.
- Any retained suppression metadata must be minimal, non-content-bearing and justified.
- Raw message text must not be copied into a deletion ledger.
- Recovery copies must be included in the deletion analysis.
- Information outside Mopapa's control, such as a previously exported file copied elsewhere, must not be represented as having been remotely deleted.

3. Data model and scope

3.1 Five proposed collections

The current logical personal-memory model proposes five collections:

1. "conversations"
2. "messages"
3. "memories"
4. "memorySources"
5. "memoryRelations"

These remain the five proposed collections for this specification.

No additional top-level collection is authorised by this document.

3.2 Existing manual entries

Existing manual entries are a separate data domain.

They must not be silently converted into extracted memories or deleted merely because a conversation or memory is removed.

If a proposed memory operation affects a manual entry, the relationship must be explicitly established and the user must be told what will happen.

Until such a relationship exists, deletion of a personal-memory record must not modify unrelated manual entries.

3.3 No assumption of an implemented system

The five collections are proposed future structures. The current application does not yet have the production conversation archive, memory records or transaction mechanisms specified here.

All behaviours in this document are target requirements, not claims about existing functionality.

4. Operation types

The system must distinguish the following operations.

Operation| Meaning
Memory deletion| Remove a selected extracted memory and its dependent derived records as required.
Message deletion| Remove an original message and assess all dependent memories.
Conversation deletion| Remove the conversation and its messages, then assess all dependent memories and relationships.
Source revocation| Withdraw permission to use a source without necessarily deleting the original source.
Memory dismissal| Reject a candidate or existing memory without treating it as a deletion request.
Memory correction| Correct a memory while retaining an appropriate auditable relationship to its evidence and previous interpretation.
Memory restriction| Narrow the contexts or uses in which information may be used.
Backup restoration| Replace or reconcile application data from a backup under deletion-aware rules.
Re-import| Process previously supplied source material again, subject to deletion, revocation and dismissal controls.

These operations must not be interchangeable.

4.1 Deletion is not dismissal

Dismissal means that the user does not want a candidate treated as a memory.

Deletion means that an existing record or source must be removed according to the requested scope.

Dismissed information must not silently return through ordinary extraction or re-import. However, dismissal does not automatically require destruction of original evidence.

4.2 Deletion is not revocation

Deletion removes information from the applicable dataset.

Revocation withdraws permission for specified uses. It may require invalidating dependent memories or restricting them until they can be supported by other permitted evidence.

A source that remains stored after revocation must not be used for a prohibited purpose.

4.3 Correction is not deletion

A correction changes the system's understanding of information.

It must not automatically erase the historical fact that an earlier statement or interpretation existed.

If the user explicitly requests deletion as part of a correction, the deletion rules also apply.

5. Deletion scope

Every deletion request must have an explicit target and scope.

5.1 Individual memory

When a user deletes one memory:

1. Identify the memory by stable record ID.
2. Identify every provenance link supporting it.
3. Identify relationships that depend on it.
4. Identify any derived memories that materially depend on it.
5. Identify cached, indexed or summarised representations.
6. Remove the selected memory from the active dataset.
7. Apply the required dependency and cleanup rules.
8. Verify that the memory cannot be retrieved.
9. Preserve unrelated original evidence unless the user also requested its deletion.

Deleting one extracted memory must not automatically delete an entire conversation.

5.2 Individual message

When a user deletes a message:

1. Identify the message and its owning conversation.
2. Identify every memory that cites the message as evidence.
3. Identify memories that depend indirectly on those memories.
4. Identify quotations, extracted claims and derived summaries containing information from the message.
5. Determine whether each affected memory has other valid, permitted supporting evidence.
6. Remove the message from the active dataset.
7. Reassess affected memories.
8. Remove, restrict or mark affected memories according to the rules in this document.
9. Remove prohibited derived representations.
10. Verify the deletion postconditions.

A memory supported by multiple sources may remain eligible only if its remaining evidence independently supports the claim and all applicable governance checks pass.

The existence of another source must not be assumed to make the memory safe.

5.3 Entire conversation

When a user deletes a conversation:

1. Identify the conversation.
2. Identify all messages belonging to it.
3. Identify all memories supported by those messages.
4. Identify all dependent memories and relationships.
5. Identify derived summaries, indexes and cached representations.
6. Remove the conversation and its messages from the active dataset.
7. Reassess every affected memory.
8. Remove memories with no remaining valid permitted evidence.
9. Reassess memories with partial or alternative evidence.
10. Remove or invalidate dependent relationships.
11. Verify that no deleted conversation content remains available through ordinary retrieval.

Conversation deletion must not automatically delete unrelated conversations involving the same participants.

5.4 Entire personal-memory archive

An archive-wide deletion operation must cover all five proposed collections.

It must also account for:

- Derived indexes.
- Cached retrieval context.
- Temporary processing data.
- Recovery copies.
- Application-generated summaries.
- Pending candidate memories.
- Any future local model or embedding artefacts, if such capabilities are separately approved.

The operation must not imply deletion of unrelated manual entries unless the user explicitly includes them.

6. Dependency analysis

6.1 Direct dependencies

A direct dependency exists when a memory or relationship explicitly references a source being deleted or revoked.

The system must be able to identify these dependencies using stable IDs.

6.2 Indirect dependencies

An indirect dependency exists when one memory was derived from another memory, or when a derived record relies on information that ultimately came from the affected source.

The system must not stop dependency analysis at the first level.

Dependency traversal must continue until all affected records have been identified.

6.3 Dependency graph requirements

The proposed "memorySources" and "memoryRelations" structures must support sufficient traceability to identify:

- Direct evidence sources.
- Supporting evidence.
- Refuting evidence.
- Qualifying evidence.
- Context-only evidence.
- Memory-to-memory dependencies.
- Supersession relationships.
- Derived relationships.

The system must not infer a safe dependency graph from similar wording alone.

6.4 Cycles and malformed references

If dependency traversal encounters:

- A circular relationship.
- A missing referenced record.
- An invalid identifier.
- An unsupported relationship type.
- A reference to a record already removed.
- An inconsistent source relationship.

The operation must fail closed for affected retrieval.

It must not assume that the missing or malformed dependency is harmless.

The user should receive a clear failure or incomplete-operation message without unnecessary disclosure of affected content.

7. What happens to dependent memories

After a source is deleted or revoked, each dependent memory must be reassessed.

Remaining evidence| Required treatment
No remaining valid evidence| Remove the memory through the deletion process.
Remaining evidence independently supports the complete claim| It may remain eligible after full validation and governance checks.
Remaining evidence supports only part of the claim| Narrow or reformulate only through an explicit, evidence-grounded correction process.
Remaining evidence conflicts with the claim| Reassess evidence state and retrieval eligibility.
Remaining evidence has unknown permission| Exclude the memory from the affected use.
Remaining evidence is invalid or missing| Do not rely on it.
Dependency cannot be established safely| Block affected retrieval and report the unresolved state.

7.1 No automatic evidence substitution

A deleted source must not be replaced by another source merely because the other source contains similar wording.

The alternative evidence must independently support the relevant claim.

7.2 No unsupported memory survival

A memory must not survive as an established fact solely because it was previously accepted.

The removal of its supporting evidence may change its eligibility even if the memory record itself has not yet been physically removed.

7.3 No silent content rewriting

The system must not rewrite a memory to hide the fact that evidence was removed.

If a surviving memory needs a narrower claim, that change must be represented as a deliberate correction with valid remaining provenance.

8. Revocation behaviour

8.1 Source-level revocation

Revocation must identify the source and the uses that are no longer permitted.

The system must then:

1. Identify affected memories.
2. Identify dependent memories.
3. Identify affected relationships.
4. Recalculate governance.
5. Invalidate prohibited retrieval indexes and cached context.
6. Prevent future use for revoked purposes.
7. Reassess whether any affected memory remains independently supported.
8. Record only the permitted minimum governance history.

8.2 Revocation of one use

A user may withdraw permission for one use without requesting full deletion.

For example, information might remain available for a direct answer while no longer being eligible for proactive resurfacing or export.

The existing governance specification requires permissions to be evaluated independently for each use.

Revocation must preserve that distinction.

8.3 Revocation of all uses

When all uses are revoked, the information must not enter ordinary retrieval or answer context.

Whether the original evidence remains stored depends on the user's request and the applicable retention rules.

8.4 Revocation must propagate

Revocation must affect derived information.

A derived memory cannot retain a permission that its only supporting source no longer grants.

A second source can support continued use only if it independently supports the claim and explicitly permits that use.

9. Transaction model

9.1 Required transaction properties

A deletion or revocation operation must provide:

- Atomic visibility.
- Dependency completeness.
- Consistent references.
- Idempotent retries.
- Verified postconditions.
- Recovery from interruption.
- Fail-closed retrieval during uncertainty.

9.2 Prepare phase

Before changing the active dataset, the system must:

1. Validate the request.
2. Resolve the target record.
3. Build the complete affected dependency set.
4. Validate all references needed for the operation.
5. Determine the expected changes.
6. Identify affected derived representations.
7. Identify relevant recovery copies.
8. Check that the operation can be performed within available storage constraints.
9. Construct a proposed replacement dataset.
10. Validate the replacement dataset before committing it.

No partial replacement may become visible during preparation.

9.3 Commit phase

The commit phase must:

1. Apply the prepared changes as one logical dataset replacement.
2. Verify that the stored dataset can be read back.
3. Verify that affected records and prohibited dependencies are absent or ineligible.
4. Verify that unrelated records remain intact.
5. Verify that the resulting dataset passes validation.
6. Confirm completion only after all required postconditions pass.

The existing application currently stores its data in localStorage under "mopapa.v1".

The current storage design must be assessed before selecting a production transaction implementation.

A single-key replacement may provide atomic visibility for the primary dataset, but it does not automatically make external recovery files, exported backups, caches or other storage locations part of the same transaction.

9.4 Failure during preparation

If preparation fails:

- The active dataset must remain unchanged.
- No success message may be shown.
- The user must receive a failure explanation.
- The operation may be retried after the underlying problem is resolved.

9.5 Failure during commit

If the commit fails:

- The system must not report successful deletion.
- The application must verify which dataset is currently authoritative.
- If the previous dataset remains intact, the operation must be reported as failed.
- If the stored state is uncertain, affected retrieval must be blocked.
- The system must use the approved recovery procedure before resuming ordinary operation.

A best-effort rollback must not be treated as proof that rollback succeeded.

9.6 Failure during post-commit cleanup

If the primary dataset commits successfully but a secondary cleanup step fails, the system must distinguish:

- Primary dataset deletion.
- Retrieval invalidation.
- Recovery-copy cleanup.
- Other secondary cleanup.

The user must not be told that every copy has been removed if some cleanup remains incomplete.

Affected information must remain unavailable for prohibited uses while cleanup is unresolved.

9.7 Atomicity boundary

The implementation design must explicitly identify which resources are covered by the transaction and which are not.

A primary dataset commit cannot, by itself, guarantee atomic deletion from:

- Previously exported files.
- Copies made by the user.
- Other devices.
- Browser or operating-system backups.
- External services.
- Future synchronised devices, if synchronisation is ever separately approved.

Mopapa must state these limitations accurately.

10. Idempotency and retry behaviour

10.1 Repeated requests

Repeating a completed deletion request must not:

- Recreate the deleted record.
- Delete unrelated records.
- Damage a valid dataset.
- Create duplicate suppression metadata.
- Reintroduce deleted evidence.
- Report contradictory outcomes.

The operation must be safe to retry.

10.2 Stable operation identity

The future implementation needs a way to distinguish a retry of an existing operation from a new operation.

The exact operation identity and persistence mechanism remain a design decision.

It must not require retaining raw deleted content.

10.3 Already absent targets

If the target is already absent:

- The system must not recreate it.
- It must verify whether a completed deletion outcome is already established.
- It must distinguish an already completed operation from an unexplained missing record.
- It must not infer successful deletion merely because a reference cannot be found.

10.4 Concurrent operations

If two operations affect the same source or dependent memory:

- They must not overwrite each other's changes.
- The system must detect conflicting dataset versions.
- A stale operation must not commit over a newer valid dataset.
- The operations must be retried or reconciled against the latest authoritative dataset.

The existing storage conflict-protection behaviour must be considered when designing this mechanism.

11. Recovery copies and retained data

11.1 Recovery-copy inventory

The deletion design must identify every location where a copy of affected data may exist.

This includes:

- The active dataset.
- The most recent recovery copy.
- Older retained recovery copies.
- Temporary restore data.
- Exported backup files created by Mopapa.
- Any future derived index or cache.
- Any future archive or import staging area.

The implementation must not assume that deleting the active record removes every copy.

11.2 Recovery-copy sanitisation

After a completed deletion, retained recovery copies must not be allowed to reintroduce the deleted information into ordinary application use.

The design must choose and document an explicit strategy for each type of copy:

- Sanitise the copy.
- Replace it with a safe copy.
- Retain it only under an explicitly justified and bounded policy.
- Remove it.

A recovery copy that still contains deleted content must not be treated as a normal restorable backup.

11.3 Recovery-copy retention

The following remain unresolved and require explicit decisions:

- Maximum number of recovery copies.
- Maximum age of a recovery copy.
- Whether copies are created before every write or only selected operations.
- Whether deletion triggers immediate sanitisation.
- How sanitisation failure is reported.
- Whether any non-content deletion metadata may be retained.
- How storage quota limitations affect the operation.

Retention must be bounded and justified.

11.4 Recovery metadata

If minimal metadata must be retained to prevent deleted information from returning, it must not contain:

- Original message text.
- Full memory text.
- Extracted summaries.
- Sensitive quotations.
- Unnecessary personal details.

A stable opaque identifier may still be linkable to a person or source. It must not automatically be considered anonymous.

The privacy implications of retained identifiers require review.

11.5 Previously exported backups

Mopapa cannot guarantee deletion from a backup that the user has already downloaded, copied or stored outside the application.

The application must:

- Explain that exported backups may contain older data.
- Warn that restoring an old backup may reintroduce deleted information.
- Apply deletion-aware restore rules.
- Avoid claiming that external copies have been erased.

A future backup format should include enough metadata to support safe restore and version compatibility without exposing unnecessary personal information.

12. Restore behaviour

12.1 General rule

Restore must not be a blind replacement operation when deletion history or suppression information could be lost.

A backup is not automatically more authoritative than the current dataset.

12.2 Restore validation

Before a restore commits, the system must:

1. Validate the backup format.
2. Validate its schema version.
3. Validate all five proposed collections.
4. Validate record identifiers and references.
5. Validate evidence and provenance links.
6. Validate lifecycle and governance fields.
7. Identify any records known to have been deleted or revoked.
8. Identify conflicts between backup and current data.
9. Determine whether the restore can preserve deletion outcomes.
10. Construct and validate the proposed restored dataset.

12.3 Deletion-aware restore

A restore must not silently resurrect records removed through a completed deletion operation.

Where the system has reliable evidence that a record was deleted after the backup was created, the deletion outcome must take precedence over the stale backup record.

If the system cannot establish whether a backup contains prohibited previously deleted content, it must not silently assume that the backup is safe.

The restore must either:

- Apply a reliable deletion-aware reconciliation strategy; or
- Refuse the restore and explain the unresolved conflict.

12.4 Restore after revocation

A restore must not restore permissions that were subsequently revoked.

The system must reconcile the backup's governance state against the most authoritative available state.

Unknown or conflicting governance must fail closed.

12.5 Restore failure

If restore validation or commit fails:

- The current valid dataset must remain unchanged.
- The application must not partially replace collections.
- The user must receive a clear failure message.
- A recovery copy must not be overwritten with an unverified dataset.
- A failed restore must not weaken deletion or revocation protections.

12.6 Restore postconditions

After a successful restore:

- All references must resolve.
- No completed deletion may be silently reversed.
- Revoked uses must remain denied.
- Unrelated manual entries must remain intact unless explicitly included in the restore.
- All five collections must pass validation.
- Retrieval must not expose invalid or prohibited records.

13. Re-import and suppression

13.1 The re-import problem

A user may import the same conversation or source again after deleting it.

Without a suppression mechanism, ordinary extraction could recreate the same content and memories.

This would make deletion unreliable.

13.2 Stable source identity

The design should prefer stable source identifiers supplied by the original source where available.

A source identifier must not be invented from message wording alone.

Text similarity is not proof that two messages are the same source.

13.3 Re-import outcomes

The future system must distinguish:

Situation| Required behaviour
Previously processed source, no deletion or revocation| Apply normal duplicate-handling rules.
Previously deleted source, reliable identity match| Do not silently re-import.
Previously revoked source| Preserve the relevant restriction or denial.
Previously dismissed candidate| Do not silently recreate it as an accepted memory.
Similar text, different source identity| Do not assume it is the same source.
Source identity unavailable| Do not claim reliable duplicate or suppression detection.
Conflicting source identity| Require conservative handling and, where necessary, user review.

13.4 Explicit reintroduction

If a user deliberately supplies information again after deletion, Mopapa must not silently override the earlier deletion.

The system needs a clear user-directed reintroduction process.

That process must distinguish:

- A genuinely new source.
- A deliberate reintroduction of previously deleted information.
- An accidental duplicate import.
- A source that remains subject to a restriction or revocation.

The precise user interaction and confirmation rules remain to be designed.

13.5 Suppression mechanism is unresolved

A previous record specification proposed an "importLedger" collection.

The schema consistency review did not approve that additional collection.

This specification does not authorise it.

A future design review must determine whether suppression can be implemented safely using:

- Existing proposed record metadata.
- Minimal embedded deletion-control metadata.
- Another explicitly approved mechanism.

Any mechanism must be evaluated for privacy, retention, backup, restore, identifier stability and storage overhead.

It must not preserve deleted source content merely to recognise it later.

13.6 Suppression metadata deletion

The system must also define when suppression metadata itself can be removed.

Retaining it indefinitely may conflict with data minimisation.

Removing it too early may permit accidental re-import.

The balance requires a documented retention rule and user-facing explanation.

14. Search, Ask and derived information

Deletion and revocation must apply beyond the underlying records.

14.1 Search indexes

Any future search index containing affected information must be updated or invalidated.

A stale index must not return deleted or revoked content.

14.2 Ask context

The deterministic Ask engine must not receive affected memories or evidence through:

- Retrieval results.
- Cached context.
- Precomputed summaries.
- Relationship expansion.
- Previously assembled answer context.

An answer already generated before deletion cannot be retroactively withdrawn from the user's memory or external copies. However, future requests must not use deleted information.

14.3 Derived summaries

A summary that materially contains deleted information is itself affected.

The system must not preserve a summary as a loophole after deleting its source.

14.4 Relationships

Relationships that depend on deleted records must be removed or invalidated.

A relationship must not continue to reveal a deleted fact indirectly.

14.5 Future embeddings or model artefacts

No local model, embeddings or external AI integration is authorised by this document.

If such capabilities are considered in a future proposal, deletion requirements must cover:

- Stored embeddings.
- Derived model inputs.
- Cached prompts.
- Generated summaries.
- Training or adaptation data, if any.
- Any persistent model-specific index.

The existence of an embedding must not be treated as harmless merely because it is not readable prose.

15. User interface and truthful outcomes

The interface must distinguish operation states.

State| Meaning
Not started| No deletion has been attempted.
Preparing| The affected records and dependencies are being assessed.
Committing| The prepared change is being written.
Verifying| The stored result and deletion postconditions are being checked.
Completed| All required completion checks passed.
Failed| The operation did not complete successfully.
Incomplete cleanup| The primary change committed but one or more required secondary cleanup tasks remain unresolved.
Recovery required| The authoritative dataset cannot safely resume ordinary use without recovery.

15.1 Completion language

The application must not use language such as:

- "Permanently deleted everywhere" when external copies cannot be controlled.
- "All copies removed" when recovery copies remain.
- "Successfully deleted" before verification.
- "Forgotten" when only a visible record has been hidden.

15.2 Failure language

Failure messages should state:

- Which operation failed.
- Whether the active dataset changed.
- Whether affected information is blocked from retrieval.
- Whether recovery or another attempt is required.

Messages must avoid exposing sensitive content unnecessarily.

15.3 User confirmation

Destructive operations should make their scope clear before execution.

The confirmation should distinguish deletion of a memory, message, conversation or entire archive.

The user must not be surprised by deletion of unrelated sources or manual entries.

16. Validation and integrity invariants

The future implementation must enforce these invariants.

1. Every active memory must have valid provenance.
2. Every provenance reference must resolve to a valid source.
3. A deleted source must not support an active memory.
4. A revoked source must not support a prohibited use.
5. A memory with no valid supporting evidence must not be presented as an established fact.
6. A deleted memory must not reappear through a stale search index.
7. A deleted message must not remain available through a derived summary.
8. A deleted conversation must not remain available through ordinary retrieval.
9. A completed deletion must not be silently reversed by restore.
10. A repeated deletion request must be safe.
11. A failed transaction must not report success.
12. A partially completed cleanup must not permit prohibited retrieval.
13. Unrelated records must remain unchanged.
14. Unrelated manual entries must remain unchanged.
15. Missing or invalid dependency references must fail closed.
16. Re-import must respect reliable deletion and revocation controls.
17. Recovery copies must not silently reintroduce deleted data.
18. Governance must not become more permissive through restore.
19. Deletion metadata must not retain unnecessary original content.
20. The application must distinguish local deletion from deletion of external copies.

17. Required test programme

These tests must be designed and reviewed against the existing test suite before any test code is added.

The existing "tests/run.js" and "tests/browser.js" must be inspected first to avoid duplicate coverage.

17.1 Memory deletion tests

- Delete a memory with one source.
- Delete a memory with multiple sources.
- Delete a memory with dependent memories.
- Delete a memory with relationships.
- Delete an already absent memory.
- Retry a completed deletion.
- Verify unrelated memories remain unchanged.
- Verify original evidence remains when it was not included in the request.

17.2 Message deletion tests

- Delete a message supporting one memory.
- Delete a message supporting multiple memories.
- Delete a message supporting a memory with independent alternative evidence.
- Delete a message supporting only part of a memory.
- Delete a message with a quoted third-party speaker.
- Delete a message referenced by a derived summary.
- Verify the message cannot be retrieved after completion.

17.3 Conversation deletion tests

- Delete an empty conversation.
- Delete a conversation with multiple messages.
- Delete a conversation with multiple participants.
- Delete a conversation supporting memories across other conversations.
- Verify unaffected conversations remain intact.
- Verify all affected source references are handled.
- Verify no deleted content remains in ordinary retrieval.

17.4 Revocation tests

- Revoke direct-answer permission.
- Revoke proactive-resurfacing permission.
- Revoke export permission.
- Revoke all uses.
- Revoke one source supporting multiple memories.
- Verify alternative evidence is assessed independently.
- Verify unknown permission fails closed.
- Verify restore does not reinstate revoked permission.

17.5 Transaction failure tests

- Fail during preparation.
- Fail during dependency traversal.
- Fail before commit.
- Fail during primary write.
- Fail during read-back verification.
- Fail during secondary cleanup.
- Simulate an interrupted operation.
- Retry after interruption.
- Verify unrelated data remains unchanged.
- Verify no false success message is emitted.

17.6 Recovery and backup tests

- Restore a valid backup with no deletion conflicts.
- Restore a backup containing a record deleted after backup creation.
- Restore a backup containing revoked permissions.
- Restore a malformed backup.
- Restore a backup with missing references.
- Fail restore before commit.
- Fail restore during commit.
- Verify current valid data remains intact after failure.
- Verify recovery copies do not reintroduce deleted content.
- Verify exported backup limitations are explained.

17.7 Re-import tests

- Re-import a source with a reliable existing ID.
- Re-import a deleted source.
- Re-import a revoked source.
- Re-import a dismissed candidate.
- Import similar text with a different source ID.
- Import content with no reliable source ID.
- Explicitly reintroduce previously deleted information.
- Verify accidental duplicate import does not override suppression.
- Verify suppression metadata does not contain original content.

17.8 Browser tests

Browser-level tests must verify:

- Correct confirmation scope.
- Accurate completion language.
- Accurate failure language.
- No stale search results.
- No stale Ask context.
- No deleted content in visible summaries.
- Restore warnings and conflict handling.
- Mobile usability of destructive-operation flows.

18. Acceptance criteria

This specification is not ready for implementation until all of the following are satisfied.

18.1 Behavioural completeness

- Every deletion scope is defined.
- Every revocation scope is defined.
- Direct and indirect dependencies are covered.
- Alternative evidence is assessed independently.
- Derived records and caches are covered.
- Recovery and restore behaviour is defined.
- Re-import behaviour is defined.

18.2 Transaction safety

- Preparation and commit boundaries are explicit.
- Failure behaviour is explicit.
- Rollback limitations are explicit.
- Idempotency is defined.
- Concurrent changes are addressed.
- Postconditions are testable.
- Partial cleanup cannot expose prohibited data.

18.3 Privacy and retention

- Recovery-copy retention is bounded.
- Suppression metadata is minimised.
- No raw deleted content is retained solely for suppression.
- External backup limitations are explained.
- The suppression mechanism has an approved design.
- The retention and deletion rules do not contradict one another.

18.4 Cross-document consistency

The following documents must be reconciled:

- "docs/personal-memory-record-specification.md"
- "docs/personal-memory-schema-consistency-review.md"
- "docs/personal-memory-identity-evidence-temporal-specification.md"
- "docs/personal-memory-governance-lifecycle-specification.md"
- "docs/personal-memory-architecture-decisions.md"
- "docs/personal-memory-architecture.md"
- "docs/personal-memory-data-model.md"
- "docs/personal-memory-build-plan.md"

The current cross-document position is:

1. The proposed memory lifecycle contains five states: "candidate", "active", "historical", "uncertain" and "dismissed".
2. Deletion is an operation that removes applicable records from the active dataset.
3. No "importLedger" or sixth collection is approved.
4. The logical personal-memory model contains five proposed collections.
5. Backup and recovery must not silently restore information removed through a completed deletion operation.
6. The suppression mechanism and recovery-copy sanitisation rules remain unresolved implementation blockers.
7. Schema version 2 remains proposed and is not active in the production application.

19. Decisions still required

The following questions remain open.

19.1 Suppression design

What minimal, privacy-preserving mechanism can prevent accidental re-import without retaining deleted content?

19.2 Suppression retention

How long should deletion and dismissal suppression metadata remain, and under what conditions can it be removed?

19.3 Explicit reintroduction

What user action is sufficient to deliberately reintroduce previously deleted information?

19.4 Recovery-copy policy

What number and age of recovery copies are acceptable, and how should they be sanitised after deletion?

19.5 Exported backups

What backup format and versioning rules allow deletion-aware restore without pretending that external files can be remotely erased?

19.6 Partial cleanup

Should the application block all personal-memory retrieval while secondary cleanup is incomplete, or only the affected records and dependencies?

The default proposal is to block all affected information and allow unrelated, independently validated data to remain available.

19.7 Transaction implementation

Which implementation best fits the existing local-first storage architecture while providing reliable commit, verification, rollback and interruption handling?

This must be decided using the implementation audit and measured device constraints.

19.8 Manual-entry boundaries

What happens if a future extracted memory and an existing manual entry refer to the same information?

They must remain separate until an explicit relationship and deletion policy are approved.

20. Implementation boundary

This specification does not authorise:

- Production JavaScript changes.
- A live storage schema change.
- Activation of schema version 2.
- A change to the "mopapa.v1" storage key.
- An IndexedDB migration.
- A new top-level collection.
- An "importLedger" implementation.
- External AI or hosted inference.
- Paid services or recurring dependencies.
- Cloud synchronisation.
- Automatic ingestion from other applications.
- Replacement of manual entries.
- Replacement of deterministic Ask.
- A wholesale application rewrite.

The existing application must remain functional while this design is reviewed.

Any future implementation proposal must include:

1. An approved final data model.
2. A migration and rollback plan.
3. A backup and restore compatibility matrix.
4. A deletion and revocation transaction design.
5. A suppression and re-import design.
6. A complete test plan.
7. Performance measurements.
8. Actual supported Android-device testing.
9. Explicit implementation approval.

A completed document is not permission to begin coding.

21. Current conclusion

Reliable deletion is a foundational requirement for a personal-memory system.

Mopapa must not automatically preserve information simply because it has already been extracted, summarised or linked to another memory.

The system must be able to remove information from active use, propagate deletion and revocation through dependent records, recover safely from interrupted operations and prevent accidental resurrection through backups or re-import.

The most important unresolved design problem is how to retain the minimum information necessary to prevent re-import without retaining the deleted personal content itself.

That problem must be solved before automatic memory ingestion is implemented.

Current status: Proposed specification. Pending review. No production implementation authorised.