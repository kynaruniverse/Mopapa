Mopapa Personal Memory Companion

Build Roadmap and Verification Log

Repository: https://github.com/kynaruniverse/Mopapa
Branch: "main"
Document date: 23 November 2026
Status: Consolidated roadmap. Stage 1 storage and schema foundation implemented and verified on 26 November 2026. Stage 2 readiness review in progress. No Stage 2 production implementation authorised.

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

- The live application uses localStorage and schema version 2.
- The existing storage key remains "mopapa.v1".
- Exactly five additional collections exist as empty arrays.
- IndexedDB remains a candidate, not an approved migration.
- Non-empty personal-memory records remain unsupported.
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

The five proposed collections are present in the live schema as empty arrays following the verified Stage 1 implementation. Their non-empty record functionality and associated capabilities remain unimplemented.

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


## 6. Implementation-readiness decisions

The initial design-readiness review is complete.

The canonical decision register is Section 21.2 of `personal-memory-record-specification.md`. It assigns every previously open decision to one of three outcomes:

- Resolve before Stage 1.
- Defer to a named later stage, with implementation prohibited until resolved.
- Exclude from the initial model unless separately proposed and approved.

No decision may be silently resolved during implementation.

### 6.1 Decisions resolved for Stage 1

The following boundaries govern the storage and schema foundation:

1. Keep the existing `mopapa.v1` localStorage key and single JSON data object.
2. Add exactly the five proposed collections: `conversations`, `messages`, `memories`, `memorySources` and `memoryRelations`.
3. Initialise all five collections as empty arrays.
4. Preserve existing `entries`, `learned`, `customRooms` and `ask` data.
5. Keep the existing plain JSON backup representation. `schemaVersion` remains the data-schema version. Do not add a backup wrapper or independent backup-format version in this stage.
6. Validate the complete proposed dataset before replacing current data.
7. Reject unsupported schema versions, malformed records, duplicate identifiers and invalid cross-collection references.
8. Preserve unknown values as unknown. Do not invent dates, authors, identities, permissions or memory states.
9. Prepare the next dataset before writing. Verify the stored value by reading it back.
10. Preserve the existing best-effort rollback and recovery approach. Do not describe it as an atomic database transaction or guarantee rollback where the browser cannot guarantee it.
11. Preserve existing recovery protections and the current 5 MiB import limit. Do not weaken recovery handling or change limits without measured evidence and explicit approval.
12. Keep the existing deterministic Ask and manual-entry behaviour unchanged.

These decisions authorise design and implementation planning for the Stage 1 storage foundation only. They do not authorise production changes by themselves.

### 6.2 Deferred decisions and stage gates

| Area | Required decision work | Must be closed before |
|---|---|---|
| Message authorship and quotation structure | Role/author validation, original timestamp preservation, nested quotation handling and attribution conflicts | Stage 2 |
| Candidate formation | Acceptance/rejection criteria, confirmation requirements, conservative extraction and compound-claim handling | Stage 3 |
| Memory lifecycle and governance | Review, correction, dismissal, sensitive information, lifecycle history, source permissions, revocation and deletion policies | Stage 4 |
| Re-import and recovery after deletion | Suppression, deliberate reintroduction, older-backup protection, recovery-copy sanitisation and incomplete-cleanup behaviour | Stage 4 |
| Derivation and relationships | Dependency validation, source reassessment and safe relationship handling | Stage 4 |
| Identity and temporal reasoning | Partial dates, timezone uncertainty, reversible conversation-local corrections and dependent-record reassessment | Stage 5 |
| Derived indexes and retrieval | Index creation, rebuild, invalidation, source eligibility, stale-data protection and retrieval abstention | Stage 6 |
| Evaluation thresholds and scale | Numerical thresholds, archive limits and representative Android performance | Before the relevant release decision in Stage 7 |

A deferred decision is not a minor documentation task. The corresponding feature must remain unimplemented until its policy, tests and acceptance criteria are approved.

### 6.3 Explicit exclusions

The initial model does not include:

- Global identity resolution or cross-conversation identity merging.
- A sixth persistent collection.
- An import ledger retaining deleted personal content.
- A persistent search-index or summary collection.
- Automatic promotion of extracted candidates to accepted memories.
- Automatic access to other applications.
- External AI processing or hosted inference.
- Paid APIs, subscriptions or recurring dependencies.
- Cloud synchronisation or mandatory accounts.
- Replacement of deterministic Ask.
- A wholesale application rewrite.
- An automatic migration to IndexedDB.

Any proposed change to these exclusions requires a separate evidence-based proposal and explicit approval.

### 6.4 Storage and recovery constraints

The current application stores its main state as one JSON value under `mopapa.v1`. Its write process verifies the stored value after writing and attempts best-effort restoration if verification fails.

This is not an atomic database transaction. A failed restoration may leave the previous value unrecovered. Implementation and user-facing status must preserve this limitation accurately.

Stage 1 must:

- Validate the complete next dataset before the primary write.
- Preserve a recoverable pre-migration copy.
- Verify the primary value after writing.
- Avoid reporting success before read-back verification.
- Report failure if verification or restoration fails.
- Preserve recovery evidence where possible.
- Leave the existing storage key and storage technology unchanged.

Deletion-aware recovery sanitisation is a Stage 4 requirement. Stage 1 must not introduce personal-memory deletion behaviour before that policy exists.

### 6.5 Evaluation and release policy

The evaluation document remains the authority for fixtures and reporting methods.

The following are release-blocking failures for the capabilities concerned:

- Original evidence unexpectedly altered or lost.
- Incorrect author, speaker or subject attribution.
- Invalid provenance accepted as valid.
- Restricted information used outside its permitted scope.
- Deleted or revoked information returned to prohibited retrieval.
- Unsupported personal information presented as established fact.
- Failed writes or restores reported as successful.
- Migration or restore silently losing existing user data.
- Incomplete or stale derived information presented as authoritative.

Numerical accuracy thresholds, false-positive limits, archive-size limits and Android performance thresholds remain unapproved until representative fixtures and measurements exist. Report unmeasured results as unmeasured.

### 6.6 Stage 0 exit

Stage 0 design closure is complete when:

- All 39 decisions have an explicit disposition in the canonical specification.
- The six master documents and supporting storage reference have consistent authority.
- Stage 1 storage and migration requirements are sufficiently defined.
- Deferred decisions have named implementation gates.
- The current production baseline has been verified.
- The exact first implementation files, test additions and recovery procedure have been identified.

Exit from Stage 0 does not authorise Stage 1 production changes. The user must explicitly approve the Stage 1 implementation proposal after reviewing its exact file scope and verification plan.


7. Consolidated implementation sequence

The build is divided into eight stages. Completing one stage does not automatically authorise the next.


Stage 0: Design closure and baseline

Purpose: Complete the finite readiness review and establish the verified production baseline.

Work:

- Reconcile the six master documents and the supporting storage reference.
- Give every unresolved technical decision an explicit disposition in the canonical specification.
- Confirm the implementation gates for all deferred decisions.
- Re-inspect the live repository, existing tests and current storage behaviour.
- Record the verified production commit and test baseline.
- Identify the exact Stage 1 implementation files and their dependencies.
- Prepare the Stage 1 migration, backup, restore, rollback and verification plan.

Acceptance:

- All 39 previously unresolved decisions have explicit dispositions.
- No contradictory implementation instructions remain.
- The five-collection target structure is internally consistent.
- Stage 1 migration and backup compatibility requirements are defined.
- Existing data preservation and best-effort recovery limitations are explicit.
- Deferred features cannot be mistaken for approved Stage 1 work.
- The first implementation phase has measurable tests and a recovery plan.

Exit: Explicit user approval of the exact Stage 1 production implementation proposal.

Stage 1: Storage and schema foundation

Purpose: Introduce the five-collection storage foundation without changing existing product behaviour or damaging existing user data.

Scope:

- Extend the existing schema with exactly five empty collections:
  - `conversations`
  - `messages`
  - `memories`
  - `memorySources`
  - `memoryRelations`
- Preserve the existing `entries`, `learned`, `customRooms` and `ask` domains.
- Keep the `mopapa.v1` storage key and current localStorage architecture.
- Keep the existing plain JSON backup representation and schema-version compatibility model.
- Validate the five collection types and enforce the empty-only restriction. Record-level validation, identifiers and cross-collection references are deferred until the relevant later stages.
- Implement the approved schema-v1 to schema-v2 migration.
- Preserve a recoverable pre-migration copy.
- Extend backup, restore and recovery validation for the complete schema.
- Verify persistence after reload.
- Preserve existing manual Keep, Search and deterministic Ask behaviour.

Explicitly excluded:

- Conversation import or message capture interfaces.
- Automatic candidate extraction.
- Creation or activation of accepted memories.
- Memory review, correction or dismissal interfaces.
- Memory lifecycle, permission and deletion operations.
- Global identity resolution.
- Persistent search indexes or advanced retrieval.
- New AI processing or external services.
- IndexedDB migration.
- Any change to the existing manual-entry model.

Acceptance:

- A valid schema-v1 dataset migrates without losing existing data.
- All five new collections are present and correctly initialised as empty arrays.
- Existing entries, learning data, custom rooms and Ask state remain intact.
- Valid empty collections are accepted.
- Missing, malformed or non-empty proposed collections are rejected without replacing existing data. Record-level validation is not claimed as a Stage 1 capability.
- Unsupported future schema versions fail safely.
- Invalid connected data is not silently discarded during a successful restore.
- A failed migration does not get reported as successful.
- Read-back verification is performed before success is reported.
- Best-effort rollback limitations are accurately handled and reported.
- Recovery evidence is preserved where possible after a failed migration.
- Backup export and restore preserve all supported data domains.
- Persistence is verified after application reload.
- Existing unit and browser tests remain passing.
- New tests cover only genuinely missing behaviours after checking `tests/run.js` and `tests/browser.js` for duplication.
- No deferred Stage 2 to Stage 7 feature is accidentally introduced.

Exit: Verified  implementation, passing automated tests, successful deployment and explicit user approval before Stage 2.

Stage 1 permits only empty arrays in all five new collections. Schema-v2 backups with missing, malformed or non-empty proposed collections must be rejected without replacing current data. Non-empty record support requires the relevant later-stage approval and validation.

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