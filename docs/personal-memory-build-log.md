Mopapa Personal Memory Build Log

Product: Mopapa Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa
Branch: main
Log started: 19 November 2026

Status: Historical engineering record retained for traceability.
Current engineering record: "docs/personal-memory-build-plan.md"
Canonical technical authority: "docs/personal-memory-record-specification.md"
Document role: Preserve historical commits, decisions and verification evidence. Do not use historical next-work sections as the current task list.

The build plan now contains the authoritative current position, outstanding blockers, implementation stages and verified progress.

This file is retained to preserve its historical entries. Do not delete or rewrite past entries to make them appear consistent with later decisions. Where an old entry contains an outdated status or next step, the later build plan takes precedence.

---

Purpose

This is the permanent engineering history for Mopapa's personal-memory development.

It records what was planned, what was changed, what was tested, what evidence supports completion and what remains unresolved.

The build log is intended to prevent:

- Repeating completed work.
- Losing important engineering decisions.
- Treating proposed features as implemented.
- Advancing before prerequisites are satisfied.
- Making architectural changes without recording their reasons.
- Claiming that a feature works without appropriate verification.

Recording rules

1. Record each completed engineering batch after it has been verified.
2. Include the exact commit SHA.
3. Identify every file changed.
4. Record unit and browser test results separately.
5. Record GitHub Actions and deployment results separately.
6. Record failed tests and unresolved issues.
7. Record architectural decisions and why they were made.
8. Do not mark a feature complete because its code merely exists.
9. Do not claim performance improvements without measured evidence.
10. Do not remove historical entries when a later decision changes.
11. Correct mistakes through a new dated entry.
12. Distinguish research, proposed, approved, implemented and verified work.

Status definitions

- Research: investigated but not approved for implementation.
- Proposed: documented design awaiting approval.
- Approved: explicitly accepted design.
- In progress: implementation has started.
- Implemented: code exists but may not have passed full verification.
- Verified: required tests and checks have passed.
- Deferred: intentionally postponed.
- Rejected: not part of the approved direction.

Project constraints

The following remain mandatory unless explicitly changed:

- No paid APIs or subscriptions before the product can support them through revenue.
- No hosted AI inference.
- No hidden paid fallback.
- Local-first data handling.
- No cloud synchronisation or account requirement without a separate decision.
- Preserve original evidence.
- Keep deterministic Ask source-grounded.
- Do not replace working functionality without evidence.
- User must be able to inspect, correct and delete memories.
- No production implementation before its design and migration requirements are approved.

Existing foundation

Mopapa currently uses:

- Vanilla JavaScript.
- ES5-compatible IIFEs.
- Browser DOM.
- "window.Mopapa".
- "localStorage".
- Existing "mopapa.v1" storage key and schema version 1.
- Manual Keep and deterministic Ask.
- Existing rooms, entries, tags and learning data.
- Existing backup, restore and recovery safeguards.
- Existing unit and browser regression tests.

The current implementation is the starting point for the personal-memory development programme.

It is not assumed that every existing architectural decision will remain suitable for the eventual product.

Research baseline

Date: 19 November 2026

Status: Research review completed; target architecture direction and logical data-model direction approved on 19 November 2026. Implementation not yet authorised.

Research reviewed:

- LoCoMo.
- LongMemEval Oracle, S and M.
- TimlMemBench.
- HaluMem.
- HorizonBench.
- MemArena and MemArena-L.
- GroupMemBench.
- MemoryAgentBench.
- LoCoMo-Conv.
- LoCoMo-Plus.
- BEAM.
- MemoryArena agentic evaluation.
- DolphinBench.
- MemGPT.
- Mem0.
- Zep and Graphiti.
- A-MEM.
- MemoryBank.
- localStorage and IndexedDB.
- Browser-based local inference technologies.

Research document:

"docs/personal-memory-research-review.md"

Main research conclusions

1. Memory governance is a core capability, not an optional privacy feature.
2. Extraction, updating, retrieval and answer generation must be evaluated independently.
3. Original evidence must remain available after memory extraction and consolidation.
4. Preference changes require explicit temporal and contextual handling.
5. Speaker identity must be separate from the subject of a statement.
6. Memory scope and permission boundaries must be represented.
7. Conversational and implicit retrieval require separate evaluation.
8. The long-term storage decision should be reopened.
9. IndexedDB is a serious candidate for the conversation archive, but no migration is approved.
10. Local model inference may be investigated later, but no model is approved for integration.
11. Zero recurring financial costs remain mandatory during development.

Approved documentation programme

Item| Status
Extended research review| Completed
Permanent build log| Maintained; latest reconciliation recorded through 23 November 2026
Target architecture revision| Approved and documented
Logical data-model revision| Approved and documented
Participant identity and attribution specification| Drafted; cross-document review required
Record and validation specification| Drafted; final approval outstanding
Governance and lifecycle specification| Drafted; final approval outstanding
Deletion, revocation and recovery specification| Drafted; suppression and sanitisation decisions outstanding
Backup, restore and compatibility specification| Drafted; envelope and migration decisions outstanding
Schema consistency review| Reconciled against subsequent specifications
Implementation audit| Completed; existing production limitations documented
Module map| Reconciled with current design sequence
Phased build plan| Created; acceptance and approval gates retained
Storage architecture| localStorage retained; representative archive measurements outstanding
Evaluation fixtures and thresholds| Requirements defined; fixtures and thresholds still require completion
Production implementation| Not authorised

Current approved implementation boundary

The target architecture direction and logical data-model direction have been approved.

The logical model now defines:

- Original evidence and extracted memories as separate concepts.
- Conversation-local participant identity.
- Message role, author, quoted speaker and memory subject as separate concepts.
- Attribution classes and unresolved identity handling.
- Evidence provenance and source references.
- Independent scope, audience visibility and use permissions.
- Conservative defaults for missing or conflicting permission information.
- Restriction inheritance across derived memories.
- Governance enforcement before retrieval and context assembly.

The phased engineering build plan has been created.

These approvals and documents do not authorise production implementation.

Before production implementation:

1. Reconcile the architecture, data model, build plan and build log.
2. Finalise exact implementation-level record fields and validation.
3. Define participant identifier generation and identity-correction behaviour.
4. Define candidate acceptance and lifecycle transitions.
5. Define evidence-span and provenance integrity rules.
6. Define deletion, revocation, restriction inheritance and re-import protection.
7. Define backup compatibility, migration, rollback and recovery.
8. Establish realistic storage measurements and criteria for reconsidering IndexedDB.
9. Complete the evaluation fixtures, critical failure rules and acceptance thresholds.
10. Review the exact first production phase, affected files, regression coverage and recovery plan.
11. Obtain explicit approval for that production phase.

The existing application must remain functional throughout this process.

No paid services, hosted AI, cloud synchronisation, external sharing, third-party processing or immediate storage migration are authorised.

Build entry template

Use this format for every future completed batch.

[Date] - [Batch name]

Status: Verified / In progress / Deferred / Rejected

Purpose:

What the batch was intended to achieve.

Files changed:

- List exact paths.

Implementation:

Describe the actual changes. Do not list intended changes that were not completed.

Tests:

- Unit tests:
- Browser tests:
- Additional checks:

Verification:

- Commit SHA:
- GitHub Actions run:
- Deployment status:
- Manual verification:

Evidence and limitations:

Record what the tests prove and what they do not prove.

Outstanding issues:

List anything that remains unresolved.

Decision:

Record whether the work is accepted, needs revision or is deferred.

Next approved task:

Identify the single next task in the build plan.

---

19 November 2026 - Target architecture and logical data model approved

Status: Approved

Purpose:

Record the approval and documentation of the target architecture direction and logical data-model direction.

Files changed:

- `docs/personal-memory-architecture.md`
- `docs/personal-memory-data-model.md`

Implementation:

The architecture and data-model documents were revised to establish a consistent target direction for Mopapa as a Personal Memory Companion.

The approved direction separates original evidence, candidate extraction, stored memories, relationships and governance, retrieval and context assembly, and answering.

It also defines the intended distinctions between attribution, subject, memory type, lifecycle state, evidence state, temporal validity, scope, restrictions and provenance.

Existing manually saved entries remain part of the application. The proposed conversation, message, memory, source and relationship collections remain logical design concepts, not live production data domains.

No production code or live storage schema was changed.

Tests:

- Unit tests: Not run; documentation-only change.
- Browser tests: Not run; documentation-only change.
- Additional checks: Reviewed the changed documentation and commit contents.

Verification:

- Commit SHA: `3a2a3f40b5a73c28429b5ade4df9022f232355e9`
- GitHub Actions: No associated run was confirmed for this commit. Do not treat this as a passing Actions result.
- Deployment status: Vercel reported successful deployment.
- Manual verification: Confirmed that the commit changed the two intended documentation files and did not change production code.

Evidence and limitations:

The commit confirms that the approved target direction is documented. It does not demonstrate that the proposed data model has been implemented, that migration is safe, or that automatic memory extraction works.

The architecture and logical data-model direction are approved. Detailed implementation-level schemas, migration design, storage measurements and production acceptance criteria remain outstanding.

Outstanding issues:

- Align the module map and build log.
- Prepare the phased build plan.
- Finalise implementation-level schema and validation rules.
- Define backup, restore, migration and rollback requirements.
- Define the evaluation and acceptance criteria for the first implementation phase.

Decision:

The target architecture direction and logical data-model direction are accepted. Production implementation remains unauthorised pending completion of the required design and planning work.

Next approved task:

Complete the module map and build-log alignment, then prepare the phased build plan.

19 November 2026 - Phased personal-memory build plan added

Status: Documentation added and verified

Purpose:

Record the creation of the phased engineering build plan.

Files changed:

- `docs/personal-memory-build-plan.md`

Implementation:

A phased engineering plan was added to define the design prerequisites, implementation sequence, dependencies, evaluation responsibilities, storage requirements, recovery requirements and implementation authorisation gates.

The plan explicitly states that production implementation is not authorised.

No production code or live storage schema was changed.

Tests:

- Unit tests: Existing CI test check passed.
- Browser tests: Not independently run for this documentation-only change.
- Additional checks: Commit contents and changed-file scope inspected.

Verification:

- Commit SHA: `612391b4ce84229ab9fb95f3f0623d820aead6da`
- GitHub Actions: Run `44507370382`, job `135502367990`, test check completed successfully.
- Deployment status: Vercel deployment succeeded.
- Manual verification: Exactly one documentation file changed. No production JavaScript files changed.

Evidence and limitations:

The successful Actions check verifies the repository's configured test workflow for this commit. It does not prove that proposed memory functionality exists or that a future migration is safe.

Decision:

The phased build plan is accepted as the planning document, subject to continued reconciliation with subsequent logical data-model decisions.

Next approved task:

Reconcile the plan with the detailed participant identity, attribution, subject and governance requirements.

---

19 November 2026 - Participant identity and subject model refined

Status: Documentation change verified

Purpose:

Record the refinement of participant identity, message authorship, quoted-speaker attribution and memory subject representation.

Files changed:

- `docs/personal-memory-data-model.md`

Implementation:

The logical data model was extended to distinguish conversation-local participants, message authors, quoted speakers, mentioned people and memory subjects.

It also defines conservative handling of unknown identity, prohibits automatic cross-conversation identity matching and establishes requirements for traceable identity corrections and evidence spans.

No production code, live storage schema or application behaviour was changed.

Tests:

- Unit tests: Not independently run for this documentation-only change.
- Browser tests: Not independently run for this documentation-only change.
- Additional checks: Changed file and commit contents inspected.

Verification:

- Commit SHA: `4ce4137dd6ba9ffe4801e9fe707ab7ee10452e42`
- GitHub Actions: No associated workflow run was confirmed.
- Deployment status: Vercel deployment succeeded.
- Manual verification: Exactly one documentation file changed. No production files changed.

Evidence and limitations:

This commit establishes the documented logical direction. It does not implement participant records, identity resolution or memory extraction.

Decision:

The participant and subject requirements are accepted at the logical data-model level. Exact implementation fields and validation remain outstanding.

Next approved task:

Define scope, audience visibility and independent use permissions.

---

19 November 2026 - Scope, audience visibility and use policy refined

Status: Documentation change verified

Purpose:

Record the addition of explicit scope, audience visibility, use permissions and restriction inheritance to the logical data model.

Files changed:

- `docs/personal-memory-data-model.md`

Implementation:

The logical data model now separates:

- Scope and contextual applicability.
- Audience visibility.
- Permission for direct answers.
- Permission for contextual answers.
- Proactive surfacing.
- Cross-context reuse.
- Inference.
- Export.

It also defines conservative defaults, explicit denial precedence, restriction inheritance, multiple-source policy combination, governance enforcement before context assembly and backup/export requirements.

The document explicitly withholds approval for external sharing, multi-user access, cloud synchronisation, third-party processing, proactive notifications, production schema changes and storage migration.

No production code, live storage schema or application behaviour was changed.

Tests:

- Unit tests: Not independently run for this documentation-only change.
- Browser tests: Not independently run for this documentation-only change.
- Additional checks: Changed file and commit contents inspected.

Verification:

- Commit SHA: `c1035d06dd85fed072032eed9fe1aa7c5be740a5`
- GitHub Actions: No associated workflow run was returned.
- Deployment status: Vercel deployment succeeded.
- Manual verification: Exactly one documentation file changed. No production files changed.

Evidence and limitations:

The commit confirms that the logical governance requirements are documented. It does not prove that access controls, permission enforcement or restricted retrieval have been implemented.

Decision:

The scope, audience and use-policy direction is accepted at the logical data-model level. Implementation-level fields, validation, enforcement and evaluation remain outstanding.

Next approved task:

Reconcile the architecture, data model, build plan and build log so that all four documents describe the same approved logical model and implementation boundary.

---

---

19 November 2026 - Architecture, attribution and governance documentation reconciliation

Status: Documentation change verified

Purpose:

Record the reconciliation of the architecture specification, phased build plan, architecture decisions and permanent build log with the approved logical data-model direction.

Files changed:

- `docs/personal-memory-architecture.md`
- `docs/personal-memory-build-plan.md`
- `docs/personal-memory-architecture-decisions.md`
- `docs/personal-memory-build-log.md`

Implementation:

The architecture specification was expanded to distinguish conversation participants, message roles, original authors, quoted speakers, mentioned people and memory subjects.

Scope, audience visibility and use permissions were specified as independent governance dimensions, including conservative defaults, restriction inheritance and enforcement before retrieval and context assembly.

The phased build plan was updated with implementation-level design requirements, acceptance criteria and evaluation fixtures covering attribution, identity, evidence spans, governance and restricted-information leakage.

The architecture decisions and permanent build log were updated to record the approved logical direction and outstanding implementation requirements.

No production JavaScript, live storage schema or application behaviour was changed.

Tests:

- Unit tests: GitHub Actions test job completed successfully.
- Browser tests: Not independently run as a separate manual test.
- Additional checks: Commit contents and changed-file scope inspected.

Verification:

- Commit SHA: `1bfec1bdbf0744b6e366ce8e019756b8b4063730`
- GitHub Actions: Run `44573846622`, job `135735870490`, completed successfully.
- Deployment status: Vercel deployment succeeded.
- Manual verification: Exactly four documentation files changed. No production files changed.

Evidence and limitations:

This commit confirms that the approved logical requirements have been carried into the architecture and build-planning documents.

It does not implement automatic memory ingestion, participant identity resolution, governance enforcement, storage migration or any other proposed memory capability.

Decision:

The documentation reconciliation is accepted, subject to the correction of section numbering and the recording of this verified commit in the permanent build log.

Production implementation remains unauthorised.

Next approved task:

Complete the implementation-level data model and its validation requirements before proposing any production code changes.

---

20 November 2026 - Documentation numbering and reconciliation corrections

Status: Verified and completed

Purpose:

Record the corrections made after review of the 19 November documentation reconciliation.

Files changed:

- `docs/personal-memory-architecture-decisions.md`
- `docs/personal-memory-build-log.md`

Corrections:

- Corrected the numbering of the logical data-model governance addendum and current decision.
- Updated the architecture decisions document to reflect the completed documentation reconciliation.
- Updated the permanent build log to show that the architecture and plan consistency review is complete.
- Confirmed that implementation-level design remains outstanding.

Verification:

- Commit: `cb71527dfc88462568924637b8ab94519cdb9432`
- GitHub Actions run `44707135731`, job `136189432660`: successful.
- Vercel deployment: successful.
- Exactly two documentation files changed.
- No production code, tests or live storage schema changed.

Decision:

The documentation numbering and reconciliation corrections are accepted.

Production implementation remains unauthorised.

Next task:

Complete the implementation-level data model and validation specification before proposing production code changes.

Decision record template

[Date] - Decision: [Title]

Status: Proposed / Approved / Rejected / Superseded

Problem:

What needs deciding.

Options considered:

List the realistic alternatives.

Evidence:

Link research, tests, measurements or existing implementation evidence.

Decision:

State the chosen direction.

Reasons:

Explain why it is preferable.

Consequences:

Record trade-offs, migration needs, risks and future work.

Reconsider when:

Define what evidence would justify changing the decision.

---

Change-of-direction rule

A later architectural decision may supersede an earlier one.

The earlier decision must remain in this log with its original date and reasoning.

The new entry must explain:

- What changed.
- What new evidence justified the change.
- Which documents and implementation areas are affected.
- Whether migration or rollback is required.
- Which previous assumptions are no longer valid.

Do not silently rewrite history.

Current position

The target architecture direction and logical data-model direction were approved on 19 November 2026.

The implementation-level design programme has now produced dedicated specifications for:

- The proposed record model.
- Identity, evidence attribution, provenance and temporal semantics.
- Governance, lifecycle, retrieval eligibility and abstention.
- Deletion, revocation, recovery and re-import protection.
- Backup, restore and schema compatibility.

The cross-document reconciliation has also updated the architecture, data model, architecture decisions, schema review, build plan, module map and implementation audit.

The proposed logical data model contains five collections:

- conversations
- messages
- memories
- memorySources
- memoryRelations

No sixth top-level collection is approved. importLedger remains excluded pending a separate privacy and retention decision.

The proposed lifecycle states are candidate, active, historical, uncertain and dismissed.

The proposed evidence states are supported, partially_supported, unsupported, disputed and unverified.

Deletion is an operation, not a lifecycle state.

These specifications remain proposed implementation-level designs. They do not authorise production implementation.

Recent documentation reconciliation commits

Commit: 55b2140cea2e59f223de7bafbf437f44b542d0a1

Four documentation files changed. Core record, data-model, architecture and architecture-decision definitions were reconciled. Vercel succeeded. No GitHub Actions workflow run was returned.

Commit: c9629706e3e433bd966dd9571685259f6a16d008

Two documentation files changed. Corrected the proposed JSON example and aligned evidence terminology. Vercel succeeded. No GitHub Actions workflow run was returned.

Commit: 6352685fd40e431bd77f31a03529bfe8877642d1

Four documentation files changed. Reconciled governance, deletion, backup/restore and identity specifications. Vercel succeeded. No GitHub Actions workflow run was returned.

Commit: 38bf22484baa666074842027b1f8a99a5356e67c

Four documentation files changed. Updated the schema consistency review, build plan, module map and implementation audit. Vercel succeeded. No GitHub Actions workflow run was returned.

These commits changed documentation only. They did not change production JavaScript, tests or the live storage schema.

Commit: 35ab0719daabeee3b8d125d11867703480a93d49

Four documentation files changed. Reconciled architecture decisions, research lifecycle terminology, the current build-log position and the storage architecture's personal-memory archive requirements. Vercel succeeded. No GitHub Actions workflow run was returned.

Remaining blockers

1. Complete the detailed field-by-field implementation-readiness review of every proposed record field, enum, relationship and validation rule.
2. Decide how deletion suppression can work without unnecessarily retaining prohibited personal information.
3. Finalise recovery-copy sanitisation and retention behaviour.
4. Decide the backup envelope and separate backup-format version.
5. Finalise migration defaults, strict validation and rollback acceptance.
6. Measure representative conversation archives, including save, load, search, backup and restore.
7. Complete evaluation fixtures, expected outcomes and critical acceptance thresholds.
8. Define the exact first production phase, affected files, tests, failure handling and rollback plan.
9. Obtain explicit approval before production implementation.

No production memory-ingestion module has been approved.

No production schema change, schema version 2 activation, IndexedDB migration, local model, external AI integration, paid service, cloud synchronisation, external sharing or third-party processing has been authorised.

The existing application remains the working baseline.

Next milestone

Complete the final implementation-readiness review and resolve the outstanding design decisions.

The next milestone is an explicitly reviewed and approved first production phase, not automatic coding.

The build log must continue to distinguish proposed, approved, implemented and verified work.