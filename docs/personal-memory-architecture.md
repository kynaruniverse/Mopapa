Mopapa Personal Memory Architecture

Status: Approved target architecture direction. Implementation remains subject to the approval gates in "personal-memory-build-plan.md".

Purpose: Define what Mopapa is intended to become, how its major components relate, and the principles that govern its development.

1. Product purpose

Mopapa is a personal memory companion designed to help people preserve, organise, retrieve and use information from their own lives.

Its long-term purpose is to make useful personal information available when it is needed, without requiring users to remember where they originally recorded it.

Mopapa should develop from its existing manual Keep and Ask experience into a system capable of building and maintaining a useful personal memory over time.

The product must prioritise:

- Accuracy over the appearance of intelligence.
- Evidence over unsupported inference.
- User control over opaque automation.
- Reliable memory over impressive demonstrations.
- Long-term usefulness over short-term novelty.

2. Core architectural principles

2.1 Local-first

Personal information should remain under the user's control.

Local storage is the current foundation. Any future storage change must demonstrate a measurable benefit and preserve data integrity, portability, backup and recovery.

Cloud accounts, synchronisation and external processing are not approved by this document.

2.2 Automatic, but controllable

The intended product should eventually reduce the need for users to manually organise every useful detail.

Automatic processing must not mean uncontrolled processing. Users must be able to understand, correct, restrict and delete information held about them.

2.3 Evidence before answers

A stored memory should retain enough provenance to explain where it came from.

Mopapa must distinguish:

- What the user explicitly said.
- What was extracted from their statements.
- What was inferred.
- What remains uncertain.
- What has changed over time.

An answer must not present an uncertain inference as an established fact.

2.4 Preserve history

New information should not silently erase meaningful historical information.

Mopapa should be able to distinguish a changed fact from a contradiction, correction or temporary circumstance.

2.5 Incremental engineering

The existing application should be extended through measurable, testable stages.

A wholesale rewrite is not justified merely because the target architecture is more ambitious. Existing functionality must be preserved unless evidence supports changing it.

2.6 Cost-conscious development

The architecture must not depend on paid APIs, subscriptions, hosted AI or other recurring costs before the product has demonstrated a sustainable reason to incur them.

No external AI service or paid processing dependency is approved.

3. Existing application and current baseline

The current application is a working local-first JavaScript application.

Its established characteristics include:

- Vanilla JavaScript using ES5-compatible patterns and IIFEs.
- DOM-based interface.
- "window.Mopapa" application namespace.
- Local persistence using "localStorage".
- Existing storage key "mopapa.v1".
- Existing Keep and Ask workflows.
- Fixed rooms and user-created rooms.
- Structured capture and extraction.
- Deterministic Ask retrieval and answering.
- Backup, restore and recovery functionality.
- Automated unit and browser tests.

The current live schema version is 2. The five additional personal-memory collections exist as empty arrays only; conversation and memory record functionality has not yet been implemented.

The current application is not yet the complete personal memory system described in this architecture.

In particular, it does not yet provide a complete automatic memory lifecycle or a general-purpose persistent archive of conversations and messages.

The existing implementation must be treated as the starting point, not confused with the future target.

4. Target information model

The proposed target model introduces five additional personal-memory collections alongside the existing application data domains:

1. "conversations"
2. "messages"
3. "memories"
4. "memorySources"
5. "memoryRelations"

These five collections are additional to the existing "entries", "learned", "customRooms" and "ask" domains. Existing manually saved entries remain separate from extracted memories.

Their intended responsibilities are:

- Conversations: represent source conversations and their context.
- Messages: preserve individual source statements and their original context.
- Memories: represent useful information extracted or established from source material.
- Memory sources: connect memories to the evidence supporting them.
- Memory relations: represent meaningful relationships between memories.

This is the target logical model. Stage 1 has introduced all five collections into the live schema as empty arrays. Their intended record structures and functionality remain subject to the later implementation stages.

The canonical technical specification defines the detailed fields, validation rules, identity handling, temporal behaviour, governance and lifecycle requirements.

No additional persistent collection should be introduced without an explicit architectural decision.

5. Architectural layers

The intended system has six cooperating layers.

5.1 Original evidence

Preserve the source material from which information originates.

Evidence must retain sufficient context to support later verification and interpretation.

5.2 Candidate extraction

Identify potentially useful information from source material.

Extraction must distinguish direct statements from inferred or interpreted information.

A candidate is not automatically an approved or permanent memory.

5.3 Stored memory

Represent information in a structured, retrievable form.

Memories should support correction, updates, uncertainty, historical validity and source attribution.

5.4 Relationships and governance

Represent connections between memories and enforce their lifecycle and usage restrictions.

This includes privacy, scope, confidence, correction, expiry and deletion requirements.

5.5 Retrieval and context assembly

Find relevant memories for a user's question or task.

Retrieval must consider evidence, relevance, time, scope and uncertainty rather than relying on superficial keyword similarity alone.

5.6 Answering

Present useful answers grounded in retrieved information.

The answering layer must preserve the distinction between known information, missing information and uncertain conclusions.

6. Types of memory

The target system should accommodate several useful categories.

- Episodic memory: events, experiences and things that happened.
- Semantic memory: facts, preferences and established knowledge.
- Relational memory: connections between people, places, events and other memories.
- Procedural memory: recurring methods, routines and ways of doing things.
- Working memory: temporary context needed to support an active task or interaction.

These are conceptual categories, not permission to create additional storage collections.

Procedural and more advanced working-memory capabilities can be introduced when their requirements and value have been established.

7. Memory lifecycle and behaviour

A mature memory lifecycle should support:

1. Receiving authorised source information.
2. Preserving the original evidence.
3. Extracting candidate information.
4. Identifying relevant existing memories.
5. Detecting duplicates, changes and contradictions.
6. Creating or updating memories.
7. Maintaining provenance and relationships.
8. Applying privacy and usage restrictions.
9. Retrieving relevant information when needed.
10. Correcting, expiring or deleting information safely.

The system must not assume that every statement is permanent, universally applicable or equally reliable.

A person's circumstances can change. Memories must therefore support temporal interpretation rather than treating every stored value as timeless.

Identity must also be handled carefully. Similar names, relationships or references must not automatically be treated as proof that two references concern the same person.

8. Ingestion and retrieval strategy

The first implementation priority is a reliable, understandable memory-processing pipeline.

The initial conversation archive must be source-independent and usable without external platform integrations. Mopapa must support conversations created directly within the application, including information deliberately entered or pasted by the user.

External platform imports are optional future adapters. The core conversation and message model must not depend on any particular provider's export format, account, API or data structure.

Processing should be deterministic wherever practical.

The system should:

- Preserve original evidence.
- Make extraction outcomes inspectable.
- Avoid creating duplicate memories unnecessarily.
- Recognise corrections and changed information.
- Preserve conflicting evidence instead of silently choosing a winner.
- Support safe retries.
- Avoid partially applying failed operations.
- Make retrieval explainable through source attribution.

More advanced semantic retrieval, local models or other processing approaches may be considered later.

No particular AI model, embedding system or external service is approved by this architecture.

Any such proposal must demonstrate measurable improvements against the existing deterministic baseline and pass the relevant cost, privacy, reliability and performance requirements.

9. Answering and trust

The existing deterministic Ask system is an important foundation and must remain protected.

The target architecture should improve the information available to Ask without replacing reliable retrieval with an opaque answer-generation process.

Answers should:

- Use relevant stored information.
- Preserve source attribution.
- Respect temporal context.
- Distinguish facts from inference.
- Communicate uncertainty.
- Avoid inventing missing personal details.
- Avoid exposing information outside its permitted scope.

When Mopapa cannot establish an answer from available evidence, it should say so.

10. Storage and data safety

The current localStorage implementation remains the production baseline.

IndexedDB is a possible future option, not an approved migration.

A storage change must be supported by evidence that the existing approach is no longer suitable for realistic usage.

Any future migration must include:

- A defined migration process.
- Preservation of existing user data.
- Validation before committing migrated data.
- Rollback or recovery capability.
- Backup compatibility.
- Failure and interruption testing.
- Clear user-facing outcomes.

There must not be two competing authoritative stores.

Storage decisions must be based on measured requirements rather than assumptions about future scale.

11. Privacy, control and deletion

Personal memory creates significant responsibility.

The system must support clear boundaries around:

- What information is stored.
- Why information is stored.
- Where information originated.
- How information is used.
- Which information is temporary.
- Which information can be corrected or deleted.
- Whether information is restricted from particular uses.

Deletion and revocation must be treated as lifecycle operations, not merely removal of a visible interface item.

Where information is derived from multiple sources, the system must be able to identify affected memories and apply the appropriate deletion or restriction rules.

The detailed requirements belong in the canonical record specification.

12. Reliability and performance

Reliability is a core product capability.

A memory system that occasionally loses, corrupts or misrepresents personal information is not acceptable.

Development must include:

- Unit tests for data and processing rules.
- Browser tests for complete user workflows.
- Import and restore validation.
- Failure and rollback testing.
- Regression tests for existing Keep and Ask behaviour.
- Realistic performance measurements.
- Verification of recovery and deletion behaviour.

Performance should be measured against realistic personal archives.

Optimisation must address demonstrated bottlenecks rather than introducing unnecessary infrastructure.

13. Evaluation

Mopapa must be evaluated at multiple levels.

These must remain distinct:

1. Application regression: existing functionality continues to work.
2. Ask regression: established retrieval and answering behaviour remains correct.
3. Personal-memory evaluation: the new memory lifecycle correctly stores, updates, retrieves and governs personal information.
4. External research benchmarks: research datasets and published evaluations provide additional evidence, but do not replace testing against Mopapa's own requirements.

The existing Ask regression suite and its separate 50-question diagnostic corpus must not be combined into one misleading score.

Evaluation must identify individual failure categories, not conceal weaknesses behind an aggregate result.

14. Architectural boundaries

Preserve

- Local-first operation.
- Existing Keep and Ask functionality.
- Deterministic retrieval as the initial answering foundation.
- Existing backup and recovery guarantees.
- The current lightweight application architecture where practical.
- Evidence-based engineering decisions.

Extend

- Structured personal memory.
- Source attribution and provenance.
- Temporal history.
- Memory relationships.
- Automated candidate extraction.
- Controlled memory updates.
- Retrieval across accumulated personal information.
- Privacy and lifecycle governance.

Defer

- Advanced semantic retrieval.
- Local language models.
- Automated voice processing.
- Procedural memory.
- More advanced identity resolution.
- IndexedDB migration.
- Sophisticated background processing.

Not approved

- Replacing Ask with an unrestricted language model.
- Paid AI APIs or recurring external processing costs.
- Cloud synchronisation or mandatory accounts.
- A sixth persistent collection without an explicit decision.
- A storage migration without measured justification.
- A wholesale rewrite without evidence.
- Automatic merging of uncertain identities.
- Silent deletion or overwriting of historical information.

These boundaries may be reconsidered through documented decisions and the approval process in the build plan.

15. Document authority

Mopapa's authoritative documentation is organised around six master documents.

- "README.md" provides the documentation entry point, reading order and current project position.
- "personal-memory-architecture.md" defines product purpose, architectural principles, capabilities and boundaries.
- "personal-memory-record-specification.md" defines the canonical technical record model, relationships, governance and validation requirements.
- "personal-memory-build-plan.md" defines implementation stages, acceptance criteria, approval gates and verified progress.
- "personal-memory-research-review.md" records supporting research, benchmark findings and architectural rationale.
- "personal-memory-evaluation.md" defines evaluation requirements and preserves the existing Ask regression and diagnostic evaluation material.

Supporting and historical documents are reference material. They must not create competing implementation authorities or override the six master documents.

Where a technical record requirement is involved, the record specification takes precedence over this architecture overview.

Where implementation order, acceptance or approval is involved, the build plan takes precedence.

The research review explains the evidence behind the architectural direction. The evaluation document defines how existing and future capabilities are tested. Neither independently authorises implementation.

16. Final architectural position

Mopapa is being developed towards a local-first personal memory companion that can progressively build a structured, evidence-grounded understanding of information supplied by its user.

The target is broader than a notes application or keyword search tool.

However, the system must earn each new capability through reliable implementation and measurable evaluation.

The architecture direction is established. Individual implementation stages, schema changes, storage changes and new processing capabilities remain subject to their explicit approval gates.

The governing principle is simple: build a dependable personal memory system, not a demonstration of artificial intelligence.