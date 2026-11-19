Mopapa: Personal Memory Architecture Decision Record

Product: Mopapa Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa
Branch: main
Decision record date: 19 November 2026
Status: Approved target architecture direction; production implementation not authorised
Decision date: 19 November 2026
Implementation status: Documentation only. No production changes authorised.

---

1. Purpose and authority

This document converts the findings in "docs/personal-memory-research-review.md" into proposed engineering decisions.

It records the architectural direction derived from the research and approved on 19 November 2026. The detailed architecture and logical data-model specifications have subsequently been revised. This record does not authorise production implementation.

It must be read alongside:

- "docs/personal-memory-research-review.md"
- "docs/personal-memory-architecture.md"
- "docs/personal-memory-data-model.md"
- "docs/personal-memory-module-map.md"
- "docs/personal-memory-build-log.md"

Where this document conflicts with an earlier proposal, this decision record identifies the intended direction. The existing documents must subsequently be revised so that the repository does not contain competing specifications.

Nothing in this document authorises production code, a storage migration, a new dependency or an external service.

2. Product objective

Mopapa is intended to become a personal memory companion that can remember useful information from conversations and other sources the user explicitly provides or authorises.

The long-term experience should minimise the need for users to manually create and organise every memory.

The product must be able to:

- Preserve original conversations and messages.
- Identify potentially useful information.
- Extract candidate memories.
- Associate memories with their supporting evidence.
- Recognise people, subjects, events and relationships.
- Track changes without destroying history.
- Retrieve relevant information across conversations.
- Use relevant memories in ordinary interactions.
- Explain what evidence supports an answer.
- Recognise when it does not know.
- Allow users to inspect, correct, restrict and delete stored information.

The objective is dependable memory, not maximum collection, maximum automation or maximum answer rate.

3. Non-negotiable constraints

3.1 Cost

Development must not introduce a recurring financial obligation before the product can support it through revenue.

Not approved without a separate explicit decision:

- Paid AI APIs.
- Hosted model inference.
- Paid embedding or reranking services.
- Paid databases.
- Paid vector storage.
- Paid cloud storage.
- Paid subscriptions.
- Hidden paid fallbacks.
- Services with unavoidable usage charges.

Free software must still be assessed for hardware, battery, storage, maintenance and licensing costs.

3.2 Privacy

Personal information remains on the user's device by default.

No cloud processing, synchronisation, account requirement or external AI processing is authorised.

Automatic capture means processing information the user provides to Mopapa or explicitly authorises it to import.

It does not mean silently reading other Android applications or collecting information without permission.

3.3 Existing application

Preserve the working application:

- Vanilla JavaScript and ES5-compatible IIFEs.
- Existing "window.Mopapa" namespace.
- Existing manual entries.
- Existing deterministic Ask engine.
- Existing search and classification capabilities.
- Existing local storage and recovery safeguards.
- Existing browser and unit test suites.

No replacement is justified merely because a research paper or competing product uses a different architecture.

4. The fundamental memory architecture

Mopapa must distinguish six separate layers.

Layer 1: Original evidence

Original evidence is the information received from a user-authorised source.

Examples:

- A message written by the user.
- A message written by an assistant.
- An imported conversation.
- A manually saved entry.
- An explicitly imported document.

Original evidence must preserve its source, author, ordering and available timestamps.

It must not be rewritten to make extraction or search easier.

Layer 2: Candidate extraction

A candidate is a possible memory identified from original evidence.

A candidate is not automatically an established fact.

Examples:

- A statement that appears to describe a preference.
- A possible change of employment.
- A planned appointment.
- A statement about another person.
- An event that may be important later.

Candidates must retain their evidence references and attribution.

Layer 3: Stored memory

A memory is an independently retrievable representation of information.

It must remain distinct from the original message.

A memory must not become an established fact merely because an extraction process created it.

The system must be able to distinguish:

- Directly stated information.
- Information supported by several independent statements.
- Information about another person.
- Historical information.
- Uncertain interpretations.
- User-corrected information.
- Dismissed or unsupported extractions.

Layer 4: Relationships and governance

Memories can relate to:

- People.
- Subjects.
- Events.
- Other memories.
- Original evidence.
- Historical versions.
- Contradictory information.

Relationships must be supported by evidence.

The system must also know whether a memory is permitted in the current context.

Layer 5: Retrieval and context assembly

Retrieval finds potentially relevant evidence and memories.

Context assembly selects only the information needed for the current interaction.

Retrieval and context assembly must respect:

- Attribution.
- Time.
- Scope.
- Restrictions.
- Deletion.
- Supersession.
- Contradictions.
- Evidence quality.

A retrieved memory is not automatically suitable for disclosure.

Layer 6: Answering

The answer layer receives selected evidence and determines whether it can answer.

It must choose between:

- A supported answer.
- A qualified answer.
- A clarification question.
- An abstention.

The answer must not claim more than the evidence establishes.

The existing deterministic Ask engine remains the initial answer implementation.

5. Memory types

The logical model should distinguish these memory concepts.

5.1 Episodic memory

Records what happened.

It should preserve:

- Event description.
- Participants.
- Subject.
- Time, if known.
- Location, if known.
- Supporting evidence.

5.2 Semantic memory

Represents information that can be retrieved as a fact, preference or enduring piece of knowledge.

Examples:

- A current preference.
- A person's occupation.
- A recurring constraint.
- A known relationship.

Semantic memories must retain their evidence and temporal context.

5.3 Relational memory

Represents meaningful connections between people, subjects, events and memories.

A dedicated graph database is not required.

A validated relationship collection may provide the necessary functionality.

5.4 Procedural memory

Represents a learned way of carrying out a task or applying a recurring preference.

This is a later capability.

It must not be implemented before the core evidence, extraction, retrieval and governance lifecycle is reliable.

5.5 Working memory

Represents temporary context assembled for the current interaction.

It is not automatically permanent memory.

A working context must not silently become a stored personal fact.

6. Attribution is mandatory

The system must distinguish the author of a message from the person the message concerns.

These are separate concepts.

For example:

- The user says something about themselves.
- The user says something about their partner.
- The assistant suggests something.
- The user quotes another person.
- An imported conversation contains a third-party statement.

The system must not turn all of these into facts about the user.

Every extracted memory must retain sufficient attribution to establish:

- Who originally made the statement.
- Who or what the statement concerns.
- Whether the information was directly stated or inferred.
- Which original evidence supports it.

Assistant-generated text must not automatically become a user fact.

Imported third-party information must retain its original source.

If the subject or speaker cannot be established, the memory must remain uncertain rather than receiving an invented identity.

7. Memory lifecycle

The proposed lifecycle is:

1. Receive information from an authorised source.
2. Preserve the original evidence.
3. Confirm that preservation succeeded.
4. Identify candidate information.
5. Extract candidate memories.
6. Attach provenance and attribution.
7. Check for possible duplicates.
8. Compare with existing memories.
9. Identify possible updates or contradictions.
10. Apply validation and governance rules.
11. Store accepted memories.
12. Make eligible memories available to retrieval.
13. Allow inspection, correction, restriction and deletion.

These stages must be independently observable and testable.

A failure at one stage must not silently invalidate an earlier successful stage.

For example, if extraction fails after a message has been safely stored, the original message must remain intact.

The interface must not report that a memory has been saved when only the original message was preserved.

8. Memory status and governance

The data model must not rely on a single status field to represent every aspect of a memory.

At minimum, it must distinguish the following concerns.

8.1 Memory state

Possible logical states:

- Candidate.
- Active.
- Historical.
- Uncertain.
- Dismissed.
- Unsupported.

Deletion is an operation, not merely another status.

The final stored-state design must define which states are persisted and which are temporary.

8.2 Evidence state

The system must know whether a memory has:

- Valid supporting evidence.
- Multiple supporting sources.
- Conflicting evidence.
- No remaining valid supporting evidence.

A memory without valid evidence must not be presented as an established fact.

8.3 Attribution

The system must distinguish:

- User-authored.
- Assistant-authored.
- Third-party-authored.
- Imported.
- Unknown or unresolved.

These labels describe source attribution, not whether a statement is true.

8.4 Scope

The system must be capable of distinguishing information that applies:

- Generally.
- Only within a particular relationship.
- Only within a particular task or project.
- Only within a particular conversation.
- Only during a specified period.
- Only within another explicitly defined context.

Scope must not be inferred merely because two messages discuss the same subject.

8.5 Restrictions

The architecture must allow information to be restricted from particular uses.

For example, information may be retained for historical reference but not used proactively or surfaced in unrelated contexts.

The precise restriction model must be defined before implementation.

The system must use the least information necessary for a response.

9. Temporal changes and contradictions

A newer statement is not automatically a replacement for an older statement.

The system must distinguish:

- A confirmed update.
- A historical fact.
- A contradiction.
- A temporary change.
- A context-specific difference.
- An unresolved interpretation.

A supersession relationship must have supporting evidence.

Both the newer and older memories must remain available where history is relevant.

A contradiction must not be silently resolved by selecting the newest record.

If the evidence does not establish which statement is current, Mopapa should preserve the conflict and ask for clarification when necessary.

10. Provenance and deletion

Every extracted memory must be traceable to its original evidence.

One message may support several memories.

One memory may be supported by several messages.

Deleting one source must trigger a reassessment of every memory and relationship that depended on it.

The system must not leave an apparently established memory without valid evidence.

If other valid sources remain, the memory may remain supported.

If no valid sources remain, the memory must be marked unsupported or removed according to the user's chosen deletion action.

Deleting a memory must not automatically delete its original conversation.

Deleting a conversation must clearly explain what will happen to memories derived from it.

These operations must be atomic from the user's perspective. Partial deletion must not leave misleading records.

11. Storage decision

The current application uses localStorage.

This remains the current implementation until evidence supports a change.

IndexedDB is a serious candidate for conversation and message storage because it provides asynchronous structured storage and transactions.

However, no migration is approved yet.

Before selecting a storage technology, measure:

- Realistic conversation counts.
- Message counts and sizes.
- Total storage growth.
- Read and write performance.
- Search performance.
- Backup and restore time.
- Quota behaviour.
- Browser compatibility.
- Mobile memory use.
- Recovery after interruption.

A future storage decision must consider whether existing entries and new conversation records should share one persistence boundary.

It must also define backup, migration, rollback and recovery behaviour.

Do not create a second unprotected source of truth.

Do not increase the existing backup size limit without measurements.

12. Retrieval strategy

The initial retrieval strategy should be deterministic and evidence-led.

Preserve the existing lexical search and Ask capabilities.

Extend them in stages:

1. Search existing manual entries.
2. Search preserved original messages.
3. Search extracted memories.
4. Retrieve supporting evidence.
5. Resolve people and subject attribution.
6. Apply temporal and scope rules.
7. Apply governance restrictions.
8. Assemble the smallest useful evidence set.
9. Pass that evidence to the answer layer.

A derived index must be rebuildable from authoritative records.

Semantic retrieval may be evaluated later if measured lexical-retrieval limitations justify it.

No embedding model, vector database or local language model is approved by this document.

13. Evaluation strategy

Evaluation must identify where a failure occurs.

Maintain separate tests for:

Capture

- Was the original information preserved?
- Was attribution retained?
- Were timestamps and ordering preserved?
- Were duplicate imports prevented?

Extraction

- Was the correct information identified?
- Was a hypothetical statement incorrectly treated as fact?
- Was assistant text incorrectly attributed to the user?
- Was the subject identified correctly?
- Were important qualifications retained?

Updating

- Was a genuine update recognised?
- Was historical information preserved?
- Were contradictions retained?
- Was an unsupported supersession rejected?

Governance

- Was restricted information withheld?
- Was deleted evidence removed from use?
- Was the correct scope respected?
- Was information about another person attributed correctly?

Retrieval

- Was relevant evidence found?
- Was irrelevant information excluded?
- Were multiple conversations connected correctly?
- Was the correct time period used?

Answering

- Was the answer supported?
- Were sources relevant?
- Was uncertainty represented?
- Did the system abstain when appropriate?

External benchmark scores must remain separate from Mopapa's own regression results.

The existing 50-question note evaluation must remain separate from LongMemEval and other external benchmark sets.

14. Proposed module boundaries

The following are logical responsibilities, not instructions to create every module immediately.

Responsibility| Proposed owner
Existing persistence and recovery| "js/store.js"
Existing manual entries| "js/memory/entries.js"
Existing lexical search| "js/memory/search.js"
Existing deterministic answers| "js/ask/"
Conversation operations| Future conversation module
Message preservation| Future message module
Candidate extraction| Future ingestion module
Memory operations| Future memory-domain module
Provenance and relationships| Future provenance/relationship module
Retrieval expansion| Existing search and Ask, extended
Memory inspection| Future UI module
Correction and deletion| Memory-domain operations and UI

The exact filenames and script order must be decided after the data model and module dependency review.

Do not create empty modules simply to match this table.

15. Automatic memory without paid AI

The product objective includes eventual automatic memory.

That does not mean a paid language model is required.

The first implementation should investigate deterministic extraction for information that can be identified reliably.

Examples include:

- Explicit dates.
- Explicit amounts.
- Directly stated preferences with clear wording.
- Named people and relationships where the wording is unambiguous.
- Explicit corrections.
- Direct statements that clearly replace earlier information.

Ambiguous or interpretive statements must not be forced into established memories.

A later local model may be evaluated only if:

- Deterministic extraction has demonstrated a meaningful limitation.
- A suitable model and licence are identified.
- Hardware and battery requirements are measured.
- Offline operation is demonstrated.
- Memory quality is tested against a fixed evaluation set.
- The model can preserve provenance and abstain.
- The user explicitly approves the additional complexity.

No local model is approved for the initial implementation.

16. Approved and unapproved direction

Preserve

- Existing application architecture.
- Local-first behaviour.
- Existing manual entries.
- Deterministic Ask.
- Existing recovery safeguards.
- Existing tests.
- Original evidence as the authoritative source.

Extend

- Conversation and message preservation.
- Candidate extraction.
- Independent memory records.
- Provenance.
- Attribution.
- Temporal relationships.
- Governance and scope.
- Retrieval and evaluation.
- Memory inspection and correction.

Defer

- IndexedDB migration until measured.
- Semantic embeddings.
- Local model inference.
- Cloud synchronisation.
- Accounts.
- Multi-device support.
- Multimodal ingestion.
- Complex graph infrastructure.
- Automatic access to external applications.
- Autonomous agent behaviour.

Reject as default

- Replacing Ask with an ungrounded LLM.
- Treating whole conversations as single memories.
- Discarding original evidence after extraction.
- Silently overwriting history.
- Treating assistant-generated statements as user facts.
- Using similarity alone to establish identity or supersession.
- Introducing paid dependencies.
- Introducing infrastructure without a demonstrated need.

17. Engineering sequence

The next engineering stages must follow this order:

1. Approve the target architecture.
2. Revise the existing architecture specification.
3. Finalise the logical data model.
4. Define attribution, scope and governance fields.
5. Define deletion and provenance behaviour.
6. Define backup compatibility and migration rollback.
7. Measure realistic storage requirements.
8. Decide whether localStorage remains sufficient or IndexedDB is justified.
9. Define the smallest safe storage extension.
10. Implement preservation of original conversations and messages.
11. Implement deterministic candidate extraction.
12. Implement provenance and retry safety.
13. Implement memory inspection and correction.
14. Extend retrieval.
15. Evaluate the complete memory lifecycle.

Each stage requires its own acceptance criteria and tests.

No production implementation should begin simply because a document has been written.

19. Logical data-model governance and attribution addendum

Decision date: 19 November 2026

Status: Approved logical data-model direction. Implementation-level schema not yet approved.

Authority:

This addendum records the subsequent refinement of the approved logical data model in:

"docs/personal-memory-data-model.md"

It clarifies the logical requirements for participant identity, message attribution, memory subjects, scope, audience visibility and use permissions.

It does not authorise production implementation.

19.1 Participant identity and attribution

The logical model must distinguish:

- Conversation-local participant identity.
- Message role.
- Original message author.
- Quoted speaker.
- Person or entity mentioned.
- Subject of an extracted memory.
- Source or import origin.
- Mopapa's interpretation.

Participant identifiers are conversation-local in the initial model.

Cross-conversation identity matching must not happen automatically.

Unknown and ambiguous identities must remain representable.

Message authorship, quoted speakers and memory subjects must remain separate concepts.

Identity corrections must be traceable and must trigger reassessment of affected memories where necessary.

19.2 Evidence and provenance

Original message content must remain unchanged.

Where the source format permits it, evidence references should identify the relevant span of the original message.

A memory supported by multiple messages must retain the attribution and provenance of each supporting source.

Evidence references must remain traceable through correction, migration, backup and restore.

19.3 Scope

Scope is independent from subject, source, audience and use permission.

The logical model supports:

- Personal.
- Conversation.
- Project.
- Topic.
- Event.
- Relationship.
- Other explicitly defined context.
- Unknown.

Unknown scope must not be interpreted as unrestricted personal scope.

Information originating in one conversation or project must not automatically become generally available in unrelated contexts.

19.4 Audience visibility

Audience visibility is independent from scope and use permission.

The logical model supports:

- Owner-only.
- Named audience.
- Restricted context.
- Unknown.

The initial single-user local-first product defaults to owner-only visibility.

Imported conversation participants are not automatically authorised recipients.

A memory about another person is not automatically shareable with that person.

Unknown audience permissions must be treated conservatively.

19.5 Independent use permissions

The logical model distinguishes permission for:

- Direct answers.
- Contextual answers.
- Proactive surfacing.
- Cross-context reuse.
- Inference.
- Export.

Permission for one use does not automatically grant permission for another.

Proactive surfacing and cross-context reuse require explicit permission.

External sharing is not authorised.

19.6 Restriction inheritance and enforcement

Restrictions from original evidence must remain applicable to derived memories.

Where multiple sources support one memory, applicable restrictions must combine conservatively.

A less restrictive source must not override an explicit restriction.

Explicit denial takes precedence.

Missing, unknown or conflicting permission information must deny the disputed use until resolved.

Governance checks must occur before information enters retrieval or answer context.

Summaries, caches and derived indexes must not bypass these checks.

Backup and restore must preserve permission metadata.

Export must not silently remove restrictions or broaden permissions.

19.7 Implementation boundary

These decisions establish logical requirements only.

They do not approve:

- Production schema changes.
- Automatic conversation ingestion.
- New storage mechanisms.
- IndexedDB migration.
- External sharing.
- Multi-user access.
- Cloud synchronisation.
- Third-party processing.
- Proactive notifications.
- Automatic access to other applications.
- Paid services or AI APIs.
- Replacement of deterministic Ask.

The exact record fields, validation rules, lifecycle transitions, enforcement implementation, migration behaviour and evaluation acceptance criteria remain to be completed and approved separately.

---

18. Current decision

The target architecture direction was approved on 19 November 2026.

The approved direction is a local-first, evidence-preserving personal memory system with:

- Original evidence preserved independently from extracted memories.
- Episodic, semantic and relational memory.
- Explicit attribution, subject and provenance.
- Temporal updates and contradiction handling.
- Memory lifecycle and evidence states.
- Scope and enforceable use restrictions.
- Deterministic, evidence-grounded retrieval and answering.
- User inspection, correction, restriction and deletion.

The existing application remains the foundation.

The approval does not authorise:

- Production code changes.
- A schema migration.
- An IndexedDB migration.
- A local or hosted language model.
- Paid APIs or recurring services.
- Cloud synchronisation.
- Automatic access to other applications.
- Replacement of deterministic Ask.

The current localStorage implementation remains in place while storage requirements are evaluated. A separate storage decision is required before any migration.

The phased build plan has now been created. The next task is to reconcile the architecture, logical data model, build plan and permanent build log, then complete the remaining implementation-level design requirements.

Production implementation remains unauthorised.

This record describes the approved target direction. It does not claim that the proposed capabilities have been implemented.