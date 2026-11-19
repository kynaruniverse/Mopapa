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

Status: Research review completed; target architecture not yet approved.

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

Initial documentation programme

Item| Status
Extended research review| Research completed
Permanent build log| Created
Target architecture revision| Awaiting
Data model revision| Awaiting
Build plan| Awaiting
Storage and migration design| Awaiting

Current approved implementation boundary

No new production memory-ingestion code is authorised by the research review alone.

Before production implementation:

1. Complete the target architecture.
2. Complete the data model.
3. Resolve storage and migration strategy.
4. Define the evaluation harness.
5. Approve the first implementation phase and its acceptance criteria.

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

The project is in architecture and specification review.

No new personal-memory production module has been approved.

The next work is to revise the target architecture and data model using the findings in the research review, then prepare the phased build plan.

The existing application remains intact while these decisions are made.