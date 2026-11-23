Mopapa: Current Module and Architecture Mapping

Status: Repository inspection completed
Repository: https://github.com/kynaruniverse/Mopapa
Branch: "main"
Inspected commit: "851008f01d3b61df9c94ef53771cb159606cecbe"
Documentation alignment verified through commit: "85e67d64492159782f91dcf47c4ede6ece15c37d"
Purpose: Map the existing implementation against "docs/personal-memory-architecture.md" before production changes.

---

1. Executive assessment

Mopapa has a substantial working foundation:

- Existing local-first storage and recovery.
- A manually maintained memory-entry model.
- Deterministic lexical search.
- A specialised deterministic Ask engine.
- Structured extraction for supported dates, costs and locations.
- User-taught aliases and confirmed source choices.
- Source-backed answers and clarification behaviour.
- Backup, restore and recovery-copy management.
- Unit and browser regression suites.

The missing capability is not another search box or a replacement Ask engine.

It is a persistent information model that can preserve conversations, individual messages, independently retrievable memories and the relationships between them.

Architectural decision: Extend the existing application. Do not replace the current storage, entries or Ask systems without measured evidence that an extension is insufficient.

2. Repository baseline

The inspected implementation uses:

- Vanilla JavaScript.
- ES5-compatible IIFEs.
- "window.Mopapa" as the application namespace.
- Browser DOM interfaces.
- "localStorage" under "mopapa.v1".
- Schema version "1".
- Script loading through "index.html".
- No application framework or database dependency.

The script order in "index.html" establishes important dependencies. Storage and foundational modules load before memory modules; Ask helper modules load before "ask.js"; UI modules load before "main.js".

Future modules must respect this dependency structure.

3. Existing module map

3.1 Storage

File: "js/store.js"

Current responsibilities:

- Maintains the application data object.
- Loads and validates persisted data.
- Normalises supported legacy data.
- Saves and verifies writes.
- Detects changes made by another tab.
- Supports write ownership and read-only mode.
- Preserves corrupt or partially rejected data.
- Manages recovery-copy retention and deletion.
- Exports full backups and recovery copies.
- Validates and restores imported backups.
- Requests persistent browser storage where supported.

Current top-level data domains:

Domain| Current purpose
"entries"| Saved memories, tasks and appointments
"learned"| Legacy room-sorter learning
"customRooms"| User-created rooms
"ask"| Ask aliases, confirmed source boosts and unanswered questions

Reuse: This remains the persistence foundation.

Gap: There are no dedicated conversation, message, extracted-memory or provenance domains.

Future requirement: Any additional data domain must participate in validation, saving, backup, restore, recovery and migration. A new data store must not become an unprotected second source of truth.

3.2 Existing memory entries

File: "js/memory/entries.js"

Current responsibilities:

- Listing and finding entries.
- Adding and editing entries.
- Removing entries.
- Managing tags.
- Moving entries between rooms.
- Managing completion and pinned states.
- Supporting entry counts and room-specific lists.
- Reverting in-memory changes when persistence fails.
- Removing associated Ask source choices when an entry is deleted.

Reuse: Existing entries remain valid manually supplied memories.

Gap: An entry is currently a single saved record, not a general extracted memory with independent provenance, multiple supporting messages, confidence, historical status or supersession relationships.

Future requirement: Preserve existing entry behaviour and identifiers. Define how entries coexist with extracted memories before changing the schema.

3.3 Search

File: "js/memory/search.js"

Current capabilities:

- Normalises search text.
- Removes stop words and duplicate query terms.
- Supports common plural and irregular plural matching.
- Supports incomplete word prefixes.
- Searches saved text, tags and room names or IDs.
- Requires all meaningful query terms to match.
- Ranks exact phrase and exact-word matches.
- Returns matching entries without changing stored data.

Reuse: This is the lexical retrieval foundation.

Gap: It searches the current entry model. It does not search a conversation/message archive or a separate extracted-memory collection.

Future requirement: Extend the searchable information sources without weakening the existing matching guarantees. Any derived index must be rebuildable from authoritative records.

3.4 Ask engine

Primary file: "js/ask/ask.js"

The Ask engine coordinates:

- Query interpretation.
- Date and room filtering.
- Learned aliases.
- Matching and ranking.
- Structured answer handlers.
- Source-backed fallback answers.

Specialised modules include:

Module| Responsibility
"ask-text.js"| Text normalisation, tokenisation and stemming
"ask-query.js"| Query-term extraction
"ask-match.js"| Word matching and approximate matching
"ask-match-context.js"| Entry matching context
"ask-match-resolution.js"| Candidate resolution and close-match handling
"ask-ranking.js"| Match ranking
"ask-facts.js"| Structured location facts and location matching
"ask-fact-answer.js"| Structured fact answers
"ask-date-text.js"| Date extraction from text
"ask-date-filter.js"| Date filtering
"ask-date-intent.js"| Date-related question interpretation
"ask-date-overview.js"| Next appointment and overdue answers
"ask-date-answer.js"| Date answers
"ask-location-answer.js"| Location answers
"ask-money-intent.js"| Cost-question detection
"ask-money-answer.js"| Cost answers
"ask-money-format.js"| Money formatting
"ask-question-intent.js"| Question intent and historical-question detection
"ask-room-intent.js"| Room interpretation
"ask-people.js"| Person-related question interpretation
"ask-person-answer.js"| Person-related answers
"ask-results.js"| General matching-result answers
"ask-aliases.js"| Alias management
"ask-learning.js"| Confirmed source choices and unanswered-question learning
"ask-answer-flow.js"| Ordered answer-handler resolution

Reuse: Preserve this deterministic engine and its specialist modules.

Gap: Ask currently retrieves from saved entries. It does not yet retrieve across persistent conversation messages and independently extracted memories.

Future requirement: Expand the evidence available to Ask while keeping query interpretation, retrieval, answer resolution and source attribution separate.

3.5 Understanding and classification

Files:

- "js/understand/rooms.js"
- "js/understand/rules.js"
- "js/understand/custom-rooms.js"
- "js/understand/sorter.js"

Current responsibilities:

- Built-in room definitions.
- Date, task and money rules.
- Custom-room validation and management.
- Deterministic classification of saved text.
- Room-sorter learning.

Reuse: Existing classification and structured parsing can support selected deterministic extraction tasks.

Gap: Room classification is not a complete automatic memory-extraction system. It should not be expanded into one without separating classification from memory extraction and provenance.

3.6 Other memory modules

File| Current responsibility| Future relevance
"js/memory/agenda.js"| Derives dated agenda items| Existing task and event retrieval
"js/memory/resurface.js"| Selects eligible older memories to resurface| Future memory resurfacing
"js/pet/body.js"| Pet presentation and behaviour| User-facing processing feedback may eventually be relevant

These modules should remain focused on their current responsibilities.

3.7 User interface

File| Current responsibility
"js/ui/talk.js"| Keep/Ask interaction, source choices and filing
"js/ui/room.js"| Room navigation and entry interaction
"js/ui/agenda.js"| Agenda display
"js/ui/custom-rooms.js"| Custom-room interface
"js/ui/resurface.js"| Resurfaced-memory display
"js/ui/search.js"| Search interaction
"js/ui/keepsakes.js"| Pinned keepsakes
"js/ui/tag-explorer.js"| Tag exploration
"js/ui/ask-learning.js"| Ask learning controls
"js/ui/dialog.js"| Dialog and notice behaviour
"js/main.js"| Startup and interface orchestration

Reuse: Existing interface modules should continue to own their current screens and interactions.

Gap: There is no persistent conversation-history interface, memory-inspection interface or general extracted-memory correction and dismissal workflow.

Future requirement: Introduce new interfaces only when their underlying data and operations are defined and tested.

4. Data model comparison

Target concept| Existing support| Assessment
Conversations| None as a persistent domain| New model required
Individual messages| No general message records| New model required
Manually saved memories| "entries"| Existing foundation
Extracted memories| Limited structured fields on entries| New model required
Source provenance| Ask returns source entries| General provenance model required
Multiple supporting sources| Not represented as general memory relationships| New model required
Historical values| Some date, cost and location handling| Partial capability
General supersession| No general relationship model| New model required
Contradictions| Some question ambiguity handling| General model required
User correction| Entry editing exists| Extend for extracted memories
User dismissal| No general extraction-dismissal model| New capability required
Backup and restore| Existing full application backup| Must extend with new domains

5. Important existing behaviour to preserve

The following are established capabilities, not disposable implementation details.

1. Verified localStorage writes and conflict detection.
2. Recovery-copy preservation and bounded retention.
3. Validation of imported entries and other stored domains.
4. Failed-restore protection and rollback handling.
5. Existing manual entry creation and editing.
6. Deterministic search requiring all meaningful query terms.
7. Ask's specialist date, cost, location and person handlers.
8. Source-backed answers and source selection.
9. Ask alias and confirmed-source learning.
10. Existing mobile and browser behaviour.

New architecture must not weaken these guarantees.

6. Test architecture and coverage ownership

"tests/run.js"

This is the main unit and integration-style test suite.

It includes coverage for:

- Storage loading and validation.
- Recovery-copy creation and retention.
- Corrupt and partially rejected data.
- Entry validation and operations.
- Search matching and ranking.
- Ask query behaviour.
- Ask source selection and learning.
- Historical date, cost and location behaviour.
- The 50-question Ask evaluation.

"tests/browser.js"

This is the browser-level suite.

It includes coverage for:

- Application startup.
- Keep and Ask interactions.
- Keyboard behaviour.
- Mobile layout and touch targets.
- Search and navigation.
- Browser reload and interruption behaviour.
- Backup and restore.
- Recovery-copy management.
- Storage failures and quota-style failures.
- Memory resurfacing.
- Two-tab write ownership.

Testing rule: Before adding a test, inspect both suites for existing coverage. Extend an existing test or add a distinct scenario only when it tests a genuinely missing behaviour.

The 50-question evaluation and LongMemEval diagnostic must remain separate from the ordinary regression totals.

7. Proposed architecture ownership

The following is a proposed responsibility map, not an implementation instruction.

Future capability| Likely architectural owner| Dependency
Conversation records| New conversation data module| Storage and schema
Original messages| New message data module| Conversation records
Extracted memory records| New memory-domain module| Messages and provenance
Source relationships| New provenance functions or module| Messages and memories
Duplicate detection| Ingestion layer| Memory schema
Historical updates| Memory relationship logic| Provenance and timestamps
Extraction lifecycle| New ingestion coordinator| Messages, memories and storage
Expanded retrieval| Existing search and Ask systems| New data model
Memory inspection| New UI module| Memory operations
Correction and dismissal| Memory-domain operations and UI| Provenance rules
Backup and restore| Existing "js/store.js"| All new data domains
Migration| Existing storage boundary, extended| Versioned schema

Do not create all these modules immediately. First finalise the schemas and ownership boundaries.

8. Approved architecture decisions and remaining design work

The target architecture direction and logical data-model direction were approved on 19 November 2026.

The approved direction is documented in:

- `docs/personal-memory-architecture.md`
- `docs/personal-memory-data-model.md`

These approvals establish the intended architecture. They do not authorise production implementation or settle every field-level, storage or migration detail.

8.1 Settled architectural direction

The following are now approved:

- Original conversations and messages must remain distinguishable from memories extracted from them.
- Original evidence must be preserved and traceable.
- Extracted memories must have explicit provenance and supporting-source relationships.
- Attribution must distinguish who made a statement from whom the statement concerns.
- Memory type, lifecycle state, evidence state, temporal validity, scope and restrictions must be represented independently.
- Historical changes, contradictions, supersession, correction and dismissal must be handled explicitly.
- Capture, extraction, storage, retrieval, context assembly and answering must remain separate responsibilities.
- Ask must remain deterministic and evidence-grounded.
- Existing manually saved entries must remain intact.
- The product remains local-first, with no paid services or recurring costs introduced during development.
- No cloud synchronisation, hosted AI inference or external AI API is approved.
- The current localStorage implementation remains in place until measured evidence justifies a storage change.

8.2 Remaining implementation-level questions

These are not reasons to reopen the approved architecture. They are details that must be resolved before implementation.

Identity and schema:

- Exact required and optional fields for each record.
- Stable identifier generation and collision handling.
- Record ordering and handling of missing timestamps.
- How imported and internally created conversations are distinguished.
- How unknown or uncertain attribution is represented in actual records.

Provenance and memory operations:

- Exact rules for linking one memory to multiple supporting messages.
- Exact rules for linking one message to multiple memories.
- How manual entries coexist with extracted memories without accidental duplication.
- How corrections preserve the original evidence.
- Which operations create historical versions or supersession relationships.
- How deletion, revocation and restrictions propagate through dependent records.

Storage and recovery:

- Whether the existing localStorage capacity is sufficient for realistic conversation volumes.
- Which measurements would justify IndexedDB.
- Exact version-1 to future-version migration procedure.
- Backup compatibility and restore behaviour for every new record type.
- Atomicity, rollback and recovery behaviour if migration or restore fails.
- Whether derived indexes are needed and how they will be rebuilt.

Evaluation:

- Exact extraction and retrieval evaluation datasets.
- How false memories, unsupported claims and incorrect attribution will be measured.
- How temporal questions, contradictions, abstention and deletion will be tested.
- How the existing 50-question Ask evaluation and separate LongMemEval diagnostic will be maintained without mixing them into ordinary regression totals.

9. Updated implementation sequence

The target architecture and logical data-model direction are approved. The initial implementation audit, detailed record specification, identity/evidence/temporal specification, governance specification, deletion/revocation specification and backup/restore compatibility matrix have been drafted.

Documentation reconciliation is in progress. Production implementation remains unauthorised.

Step 1: Complete cross-document reconciliation.

Ensure the architecture, logical data model, record specification, identity specification, governance specification, deletion specification, backup matrix, build plan, module map, research review, storage decision and permanent build log describe the same current position.

Step 2: Review implementation-level design readiness.

Check every proposed field, enum, reference, validation rule, state transition, permission rule and deletion operation against the other specifications.

Separate settled proposals from unresolved decisions. Do not treat a documented proposal as an approved production requirement without explicit review.

Step 3: Resolve remaining storage and recovery decisions.

Complete deletion-suppression, recovery-copy sanitisation, backup envelope, migration defaults, rollback and representative archive workload decisions.

Retain localStorage unless measured evidence justifies a separate storage decision.

Step 4: Complete evaluation readiness.

Define the fixtures, expected outcomes, critical failure rules and measurable acceptance thresholds for capture, attribution, extraction, provenance, temporal reasoning, governance, retrieval, deletion and recovery.

Preserve existing regression tests and the separate 50-question Ask evaluation.

Step 5: Review the first production phase.

Identify exact files, module ownership, dependencies, test coverage, failure handling, migration impact and rollback conditions.

Step 6: Obtain explicit approval.

No production change begins until the user has reviewed and approved the precise implementation phase.

Later implementation must preserve existing manual entries, deterministic Ask, storage safeguards and browser behaviour.

10. Explicit non-goals and restrictions

The following remain outside the approved implementation boundary:

- No immediate production code changes from this documentation batch.
- No immediate schema migration.
- No IndexedDB migration without measured justification and a separate implementation decision.
- No replacement of the existing storage system merely for architectural neatness.
- No replacement of the deterministic Ask engine with an LLM.
- No paid API, subscription or hosted AI dependency.
- No cloud synchronisation or mandatory account system.
- No automatic access to other applications or their data without explicit authorisation.
- No semantic embedding or vector database dependency without evidence and a separate decision.
- No wholesale rewrite of the existing application.
- No premature creation of every proposed module.
- No claim that automatic conversation memory exists until it is implemented and verified.

11. Updated inspection conclusion

The existing application is a viable starting point for the approved Personal Memory Companion architecture.

The current code already provides useful foundations: local persistence, manual entries, deterministic search and Ask, structured interpretation, backup and restore, recovery safeguards and regression tests.

It does not yet provide a persistent conversation archive, a general extracted-memory model or the complete provenance and governance capabilities described by the approved target architecture.

The correct engineering approach is incremental extension, not a premature rewrite.

The approved architecture and logical data-model direction are documented, and the phased build plan and implementation-level specifications have been drafted. The current task is to complete cross-document reconciliation and resolve the remaining implementation-readiness decisions before any production phase is proposed.

This module map describes the inspected implementation and proposed future ownership. It does not claim that future capabilities have been built.