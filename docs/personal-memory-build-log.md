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
Extended research review| Completed, including 19 November verification addendum
Permanent build log|Created and reconciled with the current design and build-plan direction
Target architecture revision| Approved and documented
Logical data-model revision| Approved and documented
Participant identity and attribution direction| Documented in logical data model
Scope, audience and use-policy direction| Documented in logical data model
Module map alignment| Completed
Phased build plan|Created and reconciled with latest data-model decisions
Implementation-level schema| Outstanding; required before implementation
Deletion, revocation and provenance specification| Outstanding at implementation level
Storage workload and migration decision| Outstanding; requires measured workload review
Backup, restore and rollback specification| Outstanding at implementation level
Evaluation fixtures and acceptance thresholds| Defined in the build plan; require completion and review
Architecture and plan consistency review|Completed; implementation-level design remains outstanding
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

The research review is complete.

The target architecture direction and logical data-model direction are approved.

The phased engineering build plan has been created.

The following documents form the current personal-memory design and planning set:

- `docs/personal-memory-research-review.md`
- `docs/personal-memory-architecture-decisions.md`
- `docs/personal-memory-architecture.md`
- `docs/personal-memory-data-model.md`
- `docs/personal-memory-module-map.md`
- `docs/storage-architecture.md`
- `docs/personal-memory-build-log.md`
- `docs/personal-memory-build-plan.md`

The logical model now distinguishes original evidence, candidate extraction, stored memories, provenance, attribution, participant identity, memory subjects, temporal validity, scope, audience visibility, use permissions and retrieval governance.

The architecture, data model, build plan and permanent build log have been reconciled to reflect the approved logical direction.

The implementation-level schema, validation, lifecycle, deletion and revocation, storage, migration, backup and restore, governance enforcement and evaluation details remain outstanding.

The next work is to complete the implementation-level design.

Outstanding design work includes:

1. Exact record fields and validation rules.
2. Participant identity and identity-correction behaviour.
3. Candidate acceptance and lifecycle transitions.
4. Evidence-span and provenance integrity.
5. Temporal validity and contradiction rules.
6. Deletion, revocation and restriction inheritance.
7. Scope references and applicability.
8. Audience visibility and permission evaluation.
9. Governance enforcement before retrieval and context assembly.
10. Backup, restore, migration and rollback compatibility.
11. Measured storage workload and storage decision criteria.
12. Complete evaluation fixtures and critical acceptance thresholds.

No production memory-ingestion module has been approved.

No production schema change, IndexedDB migration, local model, external AI integration, paid service, cloud synchronisation, external sharing or third-party processing has been authorised.

The existing application remains unchanged while this work is completed.

The next milestone is completion and review of the implementation-level design, not production coding.