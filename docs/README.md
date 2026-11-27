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

The live application now uses schema version 2 under its existing `mopapa.v1` storage key. Stage 1 introduced exactly five additional top-level collections as empty arrays. Existing manual entries, learning data and deterministic Ask remain separate from the personal-memory model. Non-empty conversation, message, memory, source and relationship records are not yet supported.

The target model contains exactly five additional collections:

- `conversations`
- `messages`
- `memories`
- `memorySources`
- `memoryRelations`

The five collections are present in the live schema version 2 as empty arrays only. Their non-empty record functionality is not yet implemented.

Stage 2 is specified as native, source-independent conversation and message preservation. Users will create and preserve conversations directly within Mopapa. ChatGPT exports and other external platform imports are not prerequisites and are not part of the initial Stage 2 scope.

Stage 2 introduces schema version 3, with an explicit and tested migration from schema version 2. Only conversations and messages may contain records during Stage 2. The memories, memorySources and memoryRelations collections remain empty.

Stage 2 implementation was explicitly approved on 27 November 2026. Phase 1 has established a fresh baseline against commit `94d704d54d108e1da72d9ad1fe00de8f96d0a8a1`: 592/592 unit tests and 104/104 browser tests passed, GitHub Actions run #490 succeeded and Vercel reported success. Schema version 3 has not yet been implemented.

No IndexedDB migration, external AI processing, paid service, cloud synchronisation, mandatory account system, external platform import or replacement of deterministic Ask is authorised by Stage 2.

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

The six-master-document structure is complete. Historical-document reconciliation is complete.

Stage 1 storage and schema implementation is complete and verified. The live application uses schema version 2 and retains the existing `mopapa.v1` localStorage key.

Stage 2 has been specified as native, source-independent conversation and message preservation. Its technical record requirements, schema-v2-to-v3 migration, backup and recovery requirements, evaluation specification, research alignment and existing-code review have been completed.

The final documentation reconciliation and explicit implementation approval remain outstanding. Stage 2 production implementation has not been authorised.

Executable unit and browser tests will be developed alongside the approved implementation, before the corresponding production behaviour is accepted. Representative archive benchmarks will be conducted once the archive exists, including real Android measurements.

No external platform imports, automatic memory extraction, deletion, IndexedDB migration, paid services, cloud synchronisation or replacement of deterministic Ask are authorised by Stage 2.