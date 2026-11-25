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

The six documents listed in the reading order above are the only master documents.

The following retained documents are historical or supporting engineering references. They are not part of the primary reading path and must not create competing implementation instructions.

- `personal-memory-architecture-decisions.md`: historical record of the 19 November architecture decision.
- `personal-memory-implementation-audit.md`: historical inspection of the existing application at its recorded commit.
- `personal-memory-module-map.md`: historical source-module and responsibility map. Its inspected commit is not the current repository baseline.
- `storage-architecture.md`: supporting record of the existing localStorage implementation and its measured limitations.
- `personal-memory-build-log.md`: historical engineering record. The current verified progress log is maintained in the build plan.
- `personal-memory-schema-consistency-review.md`: completed historical reconciliation review.

Other older specifications remain reference-only until their final unique-content and reference audit is complete.

The canonical technical authority is `personal-memory-record-specification.md`. The implementation sequence, current blockers, acceptance criteria and verified progress are governed by `personal-memory-build-plan.md`.

Do not create new overlapping specifications, duplicate decision logs or parallel roadmaps. Transfer useful requirements into the appropriate master document and retire redundant references only after checking their unique content and links.

**Current status:** The six-master-document structure is established. Final historical-document reconciliation and the implementation-readiness review remain outstanding. Production implementation remains subject to the explicit approval gates in the build plan.