Mopapa Personal Memory Companion

Build Roadmap and Verification Log

Repository: https://github.com/kynaruniverse/Mopapa
Branch: "main"
Document date: 23 November 2026
Status: Consolidated roadmap. Production implementation has not yet been authorised.

1. Purpose and authority

This is the authoritative implementation roadmap and ongoing engineering record for Mopapa's Personal Memory Companion.

It defines:

- The implementation sequence.
- The prerequisites for each stage.
- The acceptance criteria and verification requirements.
- The remaining decisions that genuinely block implementation.
- The rules for recording completed work.

The six master documents have distinct responsibilities:

1. "docs/README.md"
   Documentation entry point, current project position and reading order.

2. "docs/personal-memory-architecture.md"
   Product purpose, intended capabilities, architecture and non-negotiable boundaries.

3. "docs/personal-memory-record-specification.md"
   Canonical technical specification for records, fields, relationships, governance, validation and data integrity.

4. "docs/personal-memory-build-plan.md"
   Implementation order, acceptance criteria, approval gates and verified engineering history.

5. "docs/personal-memory-research-review.md"
   Supporting research, benchmark findings, limitations and architectural rationale.

6. "docs/personal-memory-evaluation.md"
   Existing Ask regression coverage, the separate 50-question diagnostic corpus and future personal-memory evaluation requirements.

The README provides navigation. The architecture defines what Mopapa is intended to become. The record specification defines how its proposed information is represented. The build plan governs implementation and verification. The research review explains the evidence behind the direction. The evaluation document defines how quality and safety are measured.

The historical design and engineering documents have been reconciled into the six master documents and retired from the active documentation set. The only retained supporting engineering reference is "docs/storage-architecture.md". It records the existing storage implementation and does not create a competing implementation authority.

Where a conflict is discovered, record it as a specific issue and resolve it in the appropriate master document. Do not create another parallel specification.

2. Product objective

Mopapa is intended to become a local-first Personal Memory Companion that can progressively preserve, organise and retrieve useful information from conversations and other sources explicitly supplied or authorised by the user.

The long-term product must support:

- Original conversation and message preservation.
- Automatic identification of candidate memories.
- Separation of message author, quoted speaker and memory subject.
- Independent memory records.
- Evidence provenance and source inspection.
- Historical facts, changing information and contradictions.
- Conversation-local identity and traceable corrections.
- Scope, audience and use restrictions.
- Memory inspection, correction, dismissal, revocation and deletion.
- Cross-conversation retrieval.
- Evidence-grounded answers and appropriate abstention.
- Eventual improvement of memory formation without sacrificing reliability or user control.

Automatic memory formation is a central product objective, not an optional note-taking feature.

However, information must not be collected indiscriminately or converted into established facts without adequate evidence.

3. Non-negotiable engineering boundaries

Cost and infrastructure

- No paid APIs, subscriptions or hosted inference.
- No recurring financial obligations before revenue and a separate approval.
- No cloud synchronisation or mandatory accounts.
- No external AI processing.
- No hidden paid dependencies or fallbacks.
- No infrastructure introduced without a demonstrated need.

Privacy and source authorisation

- Local-first operation remains the default.
- Automatic processing applies only to information supplied to Mopapa or explicitly authorised for import.
- No silent access to other Android applications.
- No external transmission without a separate explicit decision.
- Unknown or conflicting permissions must not grant access.

Existing application

Preserve the working application:

- Vanilla JavaScript and ES5-compatible IIFEs.
- "window.Mopapa".
- Existing script loading and dependency order.
- Existing manual entries, rooms, tags and learning data.
- Existing lexical search.
- Existing deterministic Ask.
- Existing backup, restore and recovery safeguards.
- Existing regression tests.

Do not introduce a framework or undertake a wholesale rewrite without measured evidence.

Storage

- The live application remains on localStorage and schema version 1.
- The current storage key remains "mopapa.v1".
- IndexedDB is a candidate, not an approved migration.
- No production schema version 2 is active.
- No second unprotected source of truth may be introduced.

Evidence and reliability

- Original evidence remains distinct from extracted interpretations.
- Assistant-generated statements must not automatically become user facts.
- Statements about other people must not automatically become statements by those people.
- A newer statement does not automatically supersede an older one.
- Unsupported memories must not be presented as established facts.
- Failed writes, imports, restores and deletions must not be reported as successful.

4. Current implementation baseline

The existing application uses:

Responsibility| Current owner
Persistence, validation, backup and restore| "js/store.js"
Manual entry operations| "js/memory/entries.js"
Lexical search| "js/memory/search.js"
Deterministic Ask| "js/ask/"
Application loading| "index.html"
Unit tests| "tests/run.js"
Browser tests| "tests/browser.js"

The proposed personal-memory model introduces exactly five additional collections:

- "conversations"
- "messages"
- "memories"
- "memorySources"
- "memoryRelations"

Existing manual entries remain separate.

No sixth collection or persistent import ledger is approved.

The proposed collections and capabilities are not present in the live schema merely because they have been documented.

Before the first production change, record a fresh baseline against the exact current "main" commit:

- Unit test result.
- Browser test result.
- GitHub Actions result.
- Vercel deployment result.
- Current schema and storage key.
- Backup and restore behaviour.
- Existing Ask regression result.
- Existing browser storage and recovery behaviour.

Historical test counts must not be presented as current results.

5. Canonical design decisions

The following direction has been established in the master technical specification:

1. Original evidence, candidate extraction, stored memory, governance and retrieval remain separate responsibilities.
2. The proposed model contains exactly five new collections.
3. Temporal validity uses structured endpoints with explicit precision and timezone information.
4. Evidence offsets use zero-based UTF-16 code units, with an exclusive end.
5. Provenance relationships are "supports", "refutes", "qualifies" and "context_only".
6. Quoted-speaker references must resolve within the exact source message.
7. Memory derivation dependencies are separate from semantic memory relationships.
8. Semantic memory relationships are "supersedes", "contradicts" and "related".
9. Initial identity handling is conversation-local. Global identity resolution is deferred.
10. Lifecycle and evidence states are independent.
11. Deletion is an operation, not a lifecycle state.
12. Deletion and revocation require dependency reassessment.
13. A derived memory may remain only when its remaining permitted evidence independently supports its complete claim.
14. Backup format version and application schema version are separate.
15. Existing manual entries and learning data must be preserved during any future migration.

These are proposed implementation rules, not claims about existing production behaviour.

6. Remaining implementation-readiness decisions

The main cross-document technical reconciliation and historical-document audit are complete.

The six-master-document structure is established. Unique technical requirements have been reconciled into the canonical specification, build plan and evaluation document. Historical design and engineering documents have been retired from the active documentation set.

"docs/storage-architecture.md" remains as the sole supporting engineering reference for the existing localStorage implementation.

This is not a reason to restart completed research or reopen settled architectural decisions.

The remaining work is a finite combination of:

- Completing the implementation-readiness decisions below.
- Verifying the evaluation and acceptance requirements.
- Establishing a fresh production baseline from the live repository.
- Defining and obtaining explicit approval for the first production implementation phase.

The following issues must be resolved or given an explicitly bounded implementation decision.

A. Deletion suppression and re-import

Decide how deliberate deletion, dismissal and revocation can be respected when previously processed material is imported again.

Requirements:

- No sixth collection or import ledger without a new approval.
- No retention of raw deleted text solely to identify future imports.
- Stable source identifiers should be used where available.
- Text similarity alone must not establish identity.
- Ambiguous re-import must not silently restore deleted information.
- Define the explicit user action required to deliberately reintroduce previously deleted information.
- Distinguish deliberate reintroduction from ordinary import, duplicate detection, repeated extraction and paraphrased content.
- Define how dismissal suppression differs from deletion suppression.
- Define when suppression metadata may be removed without allowing accidental restoration.

If complete suppression cannot be implemented safely, the limitation must be explicit. Do not claim complete suppression.

B. Recovery-copy sanitisation

Define how recovery copies are handled after deletion or revocation.

The policy must establish:

- Which recovery copies can contain affected information.
- When they are invalidated, replaced or retained.
- How retention is bounded.
- How recovery is prevented from silently undoing deletion.
- What happens if sanitisation fails.
- The permitted number and maximum age of retained recovery copies.
- How exported backups are distinguished from application-controlled recovery copies.
- How the application explains that external backup files cannot be remotely erased.
- How restore behaves when deletion history or required suppression information is unavailable.

C. Backup format and migration transaction

Finalise:

- Backup envelope.
- Independent backup-format version.
- Compatibility behaviour.
- Validation before restore.
- Recovery-copy creation and verification.
- Replacement and read-back behaviour.
- Rollback after interrupted or failed migration.
- The transaction strategy must be justified against the existing localStorage architecture and measured device constraints.
- Partial cleanup must block affected information and its dependent retrieval.
- Unrelated, independently validated information may remain available only where its safety can be established.
- The application must not report complete deletion while required secondary cleanup remains unresolved.
- Protection against older backups undoing deletion or revocation.

A restore must not silently discard malformed records or broken references.

D. Migration defaults and validation

Define the exact defaults for every new field and collection.

Unknown information must remain unknown rather than receiving invented values.

Migration must preserve all existing entries, learning data, rooms and Ask state.

E. Representative archive performance

Existing small-dataset benchmarks are not proof of archive-scale performance.

Measure:

- Realistic conversation and message counts.
- Long messages.
- Provenance and derivation chains.
- Search and retrieval.
- Backup and restore.
- Deletion and revocation.
- Quota and interrupted-write behaviour.
- Actual Android browser performance.

Use measured evidence to decide whether localStorage remains sufficient or a separate storage migration is justified.

F. Evaluation fixtures and thresholds

Create a fixed, repeatable evaluation set covering:

- Attribution and subject identification.
- Quoted speakers.
- Candidate extraction.
- Evidence completeness.
- Temporal reasoning.
- Contradictions and supersession.
- Scope and restrictions.
- Identity correction.
- Deletion and revocation.
- Re-import behaviour.
- Backup and restore.
- Retrieval and answer abstention.

Critical privacy, attribution, provenance and deletion failures must be release blockers. They must not be averaged away by a high overall score.

G. Identity, attribution and temporal edge cases

Complete the remaining design decisions inherited from the historical identity and evidence specification.

The review must explicitly cover:

- Preservation of original timestamp information alongside normalised values.
- Deterministic treatment of approximate dates, partial dates and timezone uncertainty.
- Whole-message evidence versus located UTF-16 evidence spans.
- Nested quotation structure and attribution-chain validation.
- Compound claims and independently assessable provenance.
- Reversible participant correction, merge and unmerge behaviour.
- Identity deletion and reassessment of dependent records.

Acceptance requirements:

- Unknown identity and temporal information must remain explicitly unknown.
- Original source text and source evidence must not be silently rewritten.
- No global identity matching or merging is introduced without separate approval.
- Ambiguous attribution must remain unresolved or be rejected safely.
- Every resolved rule must have corresponding evaluation fixtures.
- Any decision that remains open must be recorded as a blocker rather than guessed during implementation.

H. Derived indexes and rebuild reliability

Define how future search indexes, retrieval indexes, summaries and cached context are created, validated, invalidated and rebuilt.

The review must explicitly cover:

- Rebuilding exclusively from authoritative source records.
- Preservation of the previous valid index during a failed rebuild.
- Safe behaviour after interruption or application reload.
- Verification before a rebuilt index becomes available.
- Detection of stale or incomplete index generations.
- Removal of deleted and revoked information from derived representations.
- Enforcement of attribution, scope, permissions and temporal eligibility.
- Source-reference integrity in search results and assembled answer context.
- Storage and performance costs on representative Android devices.

Acceptance requirements:

- No derived index becomes an authoritative source of personal information.
- A failed or interrupted rebuild cannot corrupt original messages or memories.
- Incomplete indexes cannot be presented as complete search results.
- Stale indexes cannot bypass deletion, revocation or governance restrictions.
- Rebuild completion is verified before the new index is used.
- Failure leaves the application in a safe, clearly reported state.
- Every resolved behaviour has corresponding evaluation fixtures.
- The chosen strategy is justified by measured performance rather than assumed necessity.

I. Manual-entry and extracted-memory boundaries

Define how future extracted memories coexist with existing manual entries when they concern the same information.

The review must cover:

- Detection of overlapping information without assuming the records are identical.
- Preservation of manual-entry content and existing user organisation.
- Whether an explicit relationship between a manual entry and an extracted memory is justified.
- Independent correction, retention and deletion behaviour.
- Prevention of accidental replacement, merging or deletion.

Acceptance requirements:

- Manual entries and extracted memories remain separate records.
- Similar wording does not establish identity or a valid relationship.
- Extracted-memory creation cannot silently replace a manual entry.
- Deleting one record cannot silently delete the other.
- Any future relationship requires an explicitly approved model and validation rules.
- Evaluation fixtures cover overlapping, conflicting and independently deleted records.

7. Consolidated implementation sequence

The build is divided into eight stages. Completing one stage does not automatically authorise the next.

Stage 0: Design closure and baseline

Purpose: Finish the finite readiness review and establish the verified production baseline.

Work:

- Review the six master documents together.
- Resolve the remaining decisions in Section 6.
- Confirm supporting documents are reference-only.
- Re-inspect the live repository and existing tests.
- Record the current commit and verification baseline.
- Identify the exact first implementation files and dependencies.

Acceptance:

- No contradictory implementation instructions remain.
- The canonical record model is internally consistent.
- Critical deletion and recovery behaviour has a defined policy.
- Backup and migration behaviour is sufficiently specified for the first storage change.
- The first implementation phase has measurable tests and a recovery plan.

Exit: Explicit approval of the first production implementation phase.

Stage 1: Storage and schema foundation

Purpose: Introduce a safe foundation for the personal-memory data without damaging the existing application.

Work:

- Implement the approved schema extension.
- Validate all five new collections.
- Preserve existing data domains.
- Implement cross-collection reference validation.
- Implement safe migration and rollback.
- Extend backup, restore and recovery.
- Verify persistence after reload.

Acceptance:

- Existing data is preserved.
- Invalid references are rejected.
- Unsupported schema versions fail safely.
- Failed migration leaves the original data usable.
- Backup and restore preserve all supported domains.
- Recovery behaviour is verified.
- Existing tests remain passing.
- No feature is reported as saved before persistence is verified.

Stage 2: Conversation and message preservation

Purpose: Give Mopapa a reliable original-evidence archive.

Work:

- Conversation creation and management.
- Message preservation.
- Conversation-local participants.
- Original author attribution.
- Message ordering and timestamps.
- Stable source identifiers where available.
- Duplicate import protection.
- Archive inspection and deletion.

Acceptance:

- Original message text is preserved unchanged.
- Message ordering and conversation boundaries are correct.
- Author and quoted-speaker distinctions are preserved.
- Unknown timestamps remain unknown.
- Retry does not create uncontrolled duplicates.
- Failed imports do not corrupt existing data.
- Backup, restore and deletion include the archive.

No automatic memory extraction is introduced until evidence preservation is reliable.

Stage 3: Deterministic candidate extraction

Purpose: Identify potentially useful memories without paid or hosted AI.

Initial supported cases should be conservative:

- Explicit dates and amounts.
- Clear directly stated preferences.
- Clearly stated facts.
- Explicit corrections.
- Unambiguous changes to earlier facts.
- Unambiguous named relationships.

Acceptance:

- Every candidate links to original evidence.
- Author and subject remain separate.
- Questions, hypotheticals and suggestions are not silently converted into facts.
- Ambiguous information remains uncertain.
- Candidate creation is safe to retry.
- Rejected candidates are not silently recreated.
- Extraction failure does not affect preserved messages.
- Candidate quality is measured against fixed fixtures.

Stage 4: Stored memories and governance

Purpose: Turn reliable candidates into independently inspectable and controllable memories.

Work:

- Memory records and types.
- Provenance and evidence spans.
- Lifecycle and evidence states.
- Derivation dependencies.
- Semantic relationships.
- Scope and use restrictions.
- Identity correction.
- Inspection, correction and dismissal.
- Revocation and deletion.

Acceptance:

- Every memory has traceable evidence.
- Invalid provenance and dependency references are rejected.
- Corrections do not rewrite original evidence.
- Restrictions propagate conservatively.
- Dismissed memories are not silently reactivated.
- Deletion reassesses direct and indirect dependencies.
- Revoked information is excluded from prohibited use.
- Failure and recovery paths are tested.

Stage 5: Temporal and relational memory

Purpose: Support changes, history and relationships without silently destroying previous information.

Work:

- Temporal validity.
- Historical memory retrieval.
- Supersession.
- Contradiction handling.
- Related-memory relationships.
- Conversation-local identity corrections.

Acceptance:

- A later timestamp alone never proves supersession.
- Historical information remains available where permitted.
- Contradictions are not silently resolved.
- Invalid relationship cycles are rejected.
- Ambiguous changes produce clarification or abstention where appropriate.

Stage 6: Retrieval and deterministic Ask expansion

Purpose: Make the memory archive useful while preserving the existing answer engine's reliability.

Work:

- Search original messages.
- Search eligible extracted memories.
- Retrieve supporting evidence.
- Apply attribution and subject rules.
- Apply temporal validity.
- Enforce scope and use restrictions before context assembly.
- Assemble a bounded evidence set.
- Extend deterministic Ask only where justified.

Acceptance:

- Existing manual-entry search remains intact.
- Existing Ask regression tests remain intact.
- New answers can identify their supporting evidence.
- Restricted and revoked memories are excluded.
- Historical and current information are distinguished.
- Unsupported questions receive appropriate abstention.
- Retrieval quality and answer support are measured separately.

Stage 7: Product completion and controlled expansion

Purpose: Turn the verified memory system into a complete, usable product.

Work:

- Clear conversation and memory management.
- Useful memory inspection and correction interfaces.
- Reliable import, export and recovery experiences.
- Mobile usability and performance.
- Accessible status and error reporting.
- Further evaluation and quality improvements.

Later investigations may include:

- More advanced deterministic extraction.
- Local inference.
- Semantic retrieval.
- Procedural memory.
- Additional authorised import formats.
- More advanced relationship reasoning.

Each requires a separate evidence-based decision. None is automatically approved by completing earlier stages.

8. Test and release policy

Before adding tests:

1. Inspect "tests/run.js".
2. Inspect "tests/browser.js".
3. Identify existing coverage.
4. Extend an existing test where appropriate.
5. Add a new test only for genuinely missing behaviour.

Avoid duplicate assertions that do not add meaningful coverage.

Every implementation batch must report:

- Exact commit SHA.
- Files changed.
- Unit test result.
- Browser test result.
- GitHub Actions result.
- Vercel deployment result.
- Manual verification where necessary.
- Known limitations and outstanding defects.

A successful deployment does not prove application functionality.

A passing unit suite does not prove browser storage, download, restore or real-device performance.

No test total may be reported without its associated commit.

9. Critical release-blocking failures

The following always block release of the affected capability:

- Assistant text represented as a user-authored fact.
- Third-party statements incorrectly attributed to the user.
- Unsupported memories presented as established facts.
- Invalid provenance presented as valid evidence.
- Restricted information used in a prohibited context.
- Revoked information remaining available to ordinary retrieval.
- Deleted information silently reintroduced.
- Failed writes reported as successful.
- Failed restores partially replacing valid user data.
- Broken relationships silently corrupting the dataset.
- Historical facts silently overwritten.
- A migration losing existing manual entries or learning data.

A high aggregate benchmark score cannot compensate for any of these failures.

10. Engineering workflow

The repository remains the source of truth.

For each work batch:

1. Inspect the current "main" commit.
2. Inspect relevant source files and tests.
3. Identify existing coverage and avoid duplication.
4. Provide exact edits for the user to apply.
5. User applies changes and pushes.
6. Inspect the resulting commit and exact diff.
7. Check relevant tests, Actions and deployment status.
8. Record only verified results.
9. Mark the completed checklist item explicitly.
10. Proceed to the next meaningful batch.

Do not claim a check passed merely because the user reports a successful push.

Documentation changes should be made only when they resolve a real decision, correct an inconsistency, define an acceptance requirement or record verified work.

Do not restart completed research or rewrite settled documents without new evidence.

11. Verification log

This section records completed work. Preserve historical entries and append new verified batches.

23 November 2026: Documentation reconciliation

Completed:

- Reconciled the canonical record model and supporting technical specifications.
- Standardised the proposed five-collection model.
- Reconciled temporal representation and UTF-16 evidence spans.
- Reconciled provenance, quoted-speaker attribution and source references.
- Separated memory derivation from semantic relationships.
- Reconciled identity, lifecycle, evidence, deletion and backup boundaries.
- Updated the schema consistency review, module map, implementation audit and architecture decisions.
- Completed the planned cross-document reconciliation programme.

23 November 2026: Canonical technical specification

Commit: "f49d0068ce952bfc3d67d51347037928d3cd7c95"

Changed:

- "docs/personal-memory-record-specification.md"

Added the canonical technical resolutions section covering collections, temporal representation, evidence spans, provenance, derivation, relationships, identity, lifecycle, deletion, re-import, backup and migration.

Verification:

- Vercel: successful.
- GitHub Actions: no workflow run returned.
- Production code: unchanged.
- Tests: unchanged.
- Live schema: unchanged.

23 November 2026: Technical section numbering correction

Commit: "f06aa7dcc7bfc62d15e5217f635bd9ab63e46c52"

Changed:

- "docs/personal-memory-record-specification.md"

Corrected the appended canonical technical section to section 24 and its subsections to 24.1–24.14. Original sections 1–23 remain intact.

Verification:

- Exact diff inspected.
- Vercel: successful.
- GitHub Actions: no workflow run returned.
- Production code: unchanged.
- Tests: unchanged.
- Live schema: unchanged.

12. Current position and next action

The target architecture direction and logical data-model direction are approved.

The six master documents are established as the authoritative documentation structure:

1. README and navigation.
2. Personal memory architecture.
3. Canonical personal-memory record specification.
4. Build plan and verified engineering record.
5. Research review.
6. Evaluation specification.

The technical requirements have been consolidated into the canonical record specification, build plan and evaluation document.

The historical-document reconciliation and reference audit are complete. The redundant historical specifications and engineering records have been retired from the active documentation set. Their historical commits remain available in Git history.

"docs/storage-architecture.md" is the only retained supporting engineering reference. It records the existing localStorage implementation and its measured limitations. Those measurements do not establish that localStorage will be sufficient for a future conversation archive.

This build plan is the authoritative location for current implementation sequencing, outstanding decisions and verified engineering progress.

The next milestone after documentation closure is a finite implementation-readiness review. It must inspect the current repository, verify the complete proposed record model, resolve the remaining blockers, establish the production baseline and define the smallest safe first implementation phase.

The first production milestone remains the smallest independently testable storage foundation that can support the intended conversation and memory system without compromising existing user data.

No production implementation, schema version 2 activation, IndexedDB migration, external AI, paid services or cloud synchronisation is authorised until the relevant phase has been explicitly approved.