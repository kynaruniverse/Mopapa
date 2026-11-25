# Mopapa Documentation

This folder contains the authoritative documentation for Mopapa's development into a local-first Personal Memory Companion.

## Start here

Read the documents in this order:

1. [Personal Memory Architecture](personal-memory-architecture.md)  
   Product purpose, target capabilities, architectural principles and boundaries.

2. [Personal Memory Record Specification](personal-memory-record-specification.md)  
   Canonical technical authority for the proposed data model, evidence, provenance, identity, temporal handling, governance, deletion, backup, restore and validation.

3. [Personal Memory Build Plan](personal-memory-build-plan.md)  
   Implementation roadmap, outstanding decisions, approval gates, acceptance criteria and verified engineering history.

4. [Personal Memory Research Review](personal-memory-research-review.md)  
   Supporting research and design rationale. Research findings do not independently authorise implementation.

5. [Personal Memory Evaluation](personal-memory-evaluation.md)  
   Evaluation strategy, existing deterministic Ask regression coverage and the separate 50-question diagnostic benchmark.

## Document authority

Each master document has a distinct responsibility:

- **Product direction and architectural principles:** `personal-memory-architecture.md`
- **Technical data and lifecycle requirements:** `personal-memory-record-specification.md`
- **Implementation sequencing, acceptance criteria and approval:** `personal-memory-build-plan.md`
- **Supporting research evidence:** `personal-memory-research-review.md`
- **Evaluation fixtures, methods and results:** `personal-memory-evaluation.md`

If documents disagree, do not guess which version is correct. Record the specific conflict and resolve it in the appropriate master document.

The record specification governs technical data requirements. The build plan governs implementation sequencing and approval.

## Current project position

Mopapa is an existing local-first JavaScript application being developed towards a Personal Memory Companion.

The current application and the proposed target architecture must not be confused.

The live application remains on its existing schema version 1 and `mopapa.v1` storage key. Its existing manual entries, learning data and deterministic Ask system remain separate from the proposed personal-memory model.

The proposed target model contains exactly five additional collections:

- `conversations`
- `messages`
- `memories`
- `memorySources`
- `memoryRelations`

These collections are not active in production merely because they are documented.

No production schema version 2, IndexedDB migration, external AI processing, paid service, cloud synchronisation, mandatory account system or replacement of deterministic Ask is authorised by these documents.

## Development rules

- Preserve existing working functionality unless evidence justifies a change.
- Keep original source evidence distinct from extracted memories.
- Require traceable evidence for personal-memory claims.
- Treat uncertainty, permissions, deletion and recovery as core engineering requirements.
- Do not silently discard, overwrite or reintroduce personal information.
- Test the complete operation, including failure and recovery paths.
- Check existing tests before adding new ones.
- Record only implementation and verification results that have actually been checked.
- Do not treat a documented proposal as approval to implement it.

## Documentation maintenance

Mopapa has six authoritative master documents:

1. This README, for navigation and current project status.
2. `personal-memory-architecture.md`, for product direction and architectural principles.
3. `personal-memory-record-specification.md`, for canonical technical requirements.
4. `personal-memory-build-plan.md`, for implementation sequencing, acceptance criteria and verified progress.
5. `personal-memory-research-review.md`, for supporting research and design rationale.
6. `personal-memory-evaluation.md`, for evaluation fixtures, methods and results.

These documents are the complete primary documentation set. Do not create additional specifications, competing roadmaps or duplicate decision registers.

### Supporting engineering reference

`storage-architecture.md` is retained as a supporting engineering reference.

It records the existing localStorage implementation, measured performance, limitations and the conditions under which a future storage review may be justified.

It is not a separate product roadmap and does not approve a storage migration. Its existing measurements must not be treated as proof of performance for a future large conversation archive.

### Historical documentation

The older architecture decisions, data model, identity, governance, deletion, backup, implementation audit, module map, build log and schema reconciliation documents have been retired from the active documentation set.

Their useful technical requirements have been reconciled into the six master documents. Their historical commits remain available in Git history.

Do not recreate these retired documents or use historical next-work instructions as current implementation guidance.

### Current status

The six-master-document structure is complete. The historical-document reconciliation is complete.

The remaining work is the finite implementation-readiness review described in `personal-memory-build-plan.md`.

Production implementation remains subject to its explicit approval gates.