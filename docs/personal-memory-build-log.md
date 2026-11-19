Mopapa Personal Memory Build Log

Product: Mopapa Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa
Branch: main
Log started: 19 November 2026

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
Extended research review| Completed; verification addendum being incorporated
Permanent build log| Created
Target architecture revision| Approved and documented
Data model revision| Approved as logical direction and documented
Module map alignment| Completed in commit 85e67d64492159782f91dcf47c4ede6ece15c37d
Build log alignment| Correction in progress
Phased build plan| Not yet completed
Implementation-level schema| Required before implementation
Storage and migration decision| Requires workload review before archive implementation
Evaluation and acceptance criteria| To be finalised in the build plan

Current approved implementation boundary

The target architecture direction and logical data-model direction have been approved.

This does not authorise production implementation.

Before production implementation:

1. Align the module map and build log with the approved architecture and data model.
2. Prepare a phased build plan with dependencies and acceptance criteria.
3. Finalise exact record fields, validation, identifiers and relationship rules.
4. Define backup compatibility, migration, rollback and recovery.
5. Establish realistic storage measurements and the criteria for reconsidering IndexedDB.
6. Define separate evaluation for extraction, provenance, retrieval and answer quality.
7. Approve the first narrowly scoped implementation phase.

The existing application must remain functional throughout this process.

No paid services, hosted AI, cloud synchronisation or immediate storage migration are authorised by the architecture approval.

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

The research review is complete. Its findings have informed the approved target architecture and logical data-model direction.

The following documents exist:

- docs/personal-memory-research-review.md
- docs/personal-memory-architecture-decisions.md
- docs/personal-memory-architecture.md
- docs/personal-memory-data-model.md
- docs/personal-memory-module-map.md
- docs/storage-architecture.md
- docs/personal-memory-build-log.md

The architecture and logical data-model direction are approved. Documentation reconciliation is the current task.

No production memory-ingestion module has been approved.

No schema migration, IndexedDB migration, local model, external AI integration, paid service or cloud synchronisation has been authorised.

The next substantial deliverable is docs/personal-memory-build-plan.md. It must define the implementation phases, detailed design prerequisites, acceptance criteria, evaluation ownership, migration and recovery requirements, and explicit implementation approval gates.

The existing application remains unchanged while this work is completed.