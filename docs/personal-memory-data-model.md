Mopapa: Personal Memory Data Model Specification

Status: Approved logical target direction; detailed schema and implementation remain subject to validation
Product: Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa
Prerequisite: "docs/personal-memory-architecture.md" and "docs/personal-memory-module-map.md"
Implementation status: Design only. No production changes authorised.

---

1. Purpose

Define the records Mopapa needs to preserve original conversations, individual messages, extracted memories, evidence relationships and historical changes.

The data model must:

- Preserve original information without rewriting it.
- Keep extracted interpretations separate from their evidence.
- Support multiple messages supporting one memory.
- Support historical changes and contradictions.
- Preserve existing manually saved entries.
- Support reliable backup, restore and migration.
- Remain compatible with the existing vanilla JavaScript architecture.

This specification defines the proposed logical model. It does not authorise immediate implementation.

2. Core design decisions

The following decisions establish the proposed model.

1. Conversations contain messages.
2. Each message belongs to exactly one conversation.
3. Messages preserve their original content and attribution.
4. Extracted memories are independent records.
5. Memories reference evidence through a separate provenance collection.
6. A memory can have multiple supporting messages.
7. A message can support multiple memories.
8. Historical relationships are separate records connecting memories.
9. Existing manually saved entries remain in the existing "entries" collection.
10. No original message is modified to improve extraction or retrieval.
11. Derived search indexes are not authoritative data.
12. All new records must participate in storage validation, backup, restore and recovery.

3. Proposed storage structure

The existing application currently stores:

- "schemaVersion"
- "entries"
- "learned"
- "customRooms"
- "ask"

The proposed future schema adds five collections:

- "conversations"
- "messages"
- "memories"
- "memorySources"
- "memoryRelations"

The proposed version 2 storage structure is:

{
  "schemaVersion": 2,
  "entries": [],
  "learned": {},
  "customRooms": [],
  "ask": {
    "aliases": [],
    "boosts": {},
    "unanswered": []
  },
  "conversations": [],
  "messages": [],
  "memories": [],
  "memorySources": [],
  "memoryRelations": []
}

This is a proposed structure, not a change to the current live storage.

4. Conversation records

A conversation groups related messages.

Proposed record:

{
  "id": "conversation_id",
  "title": "Optional conversation title",
  "origin": "chatgpt_import",
  "status": "active",
  "createdAt": "2026-11-19T10:00:00.000Z",
  "updatedAt": "2026-11-19T10:30:00.000Z"
}

Field definitions

Field| Requirement| Purpose
id| Required| Stable unique identifier
title| Optional| Human-readable conversation title
origin| Required| Original source or import method
status| Required| active or archived
createdAt| Nullable| Original conversation creation time, if known
updatedAt| Nullable| Most recent known conversation activity, if known

If the original creation timestamp is unknown, it must not be fabricated. The implementation must define how unknown timestamps are represented before ingestion begins.

A conversation is a grouping record. It must not contain the entire conversation as one large text field.

5. Message records

A message is an individual original statement.

Proposed record:

{
  "id": "message_id",
  "conversationId": "conversation_id",
  "role": "user",
  "attribution": null,
  "text": "I now work at Company B.",
  "timestamp": "2026-11-18T14:30:00.000Z",
  "sequence": 12,
  "origin": "chatgpt_import",
  "receivedAt": "2026-11-19T10:00:00.000Z"
}

Field definitions

Field| Requirement| Purpose
id| Required| Stable unique identifier
conversationId| Required| Parent conversation
role| Required| Author of the original message
text| Required| Unmodified original message
timestamp| Nullable| Original message timestamp
sequence| Required| Original position within conversation
origin| Required| Source or import method
receivedAt| Required| When Mopapa received or imported it
attribution| Optional| Explicitly attributed person or source, when different from the message author

Supported roles

Initial supported values:

- "user"
- "assistant"
- "system"
- "other"

Additional roles can be introduced when an actual import source requires them.

Message rules

- Original text must remain unchanged.
- Original ordering must be preserved.
- Unknown timestamps must remain unknown.
- Every message must reference an existing conversation.
- Sequence numbers must be valid non-negative integers.
- A message must not be silently reassigned to another conversation.
- Assistant-generated statements must not automatically become user facts.
- Imported third-party information must retain its original attribution.

A conversation may contain messages from several roles.

6. Memory records

A memory is an independently retrievable piece of information derived from evidence.

Proposed record:

{
  "id": "memory_id",
  "category": "personal_fact",
  "content": "Charles works at Company B.",
  "subject": "Charles",
  "status": "active",
  "validFrom": null,
  "validTo": null,
  "recordedAt": "2026-11-19T10:05:00.000Z",
  "createdAt": "2026-11-19T10:05:00.000Z",
  "updatedAt": "2026-11-19T10:05:00.000Z"
}

Field definitions

Field| Requirement| Purpose
id| Required| Stable unique identifier
category| Required| Memory classification
content| Required| Concise retrievable representation
subject| Optional| Person, object, event or topic
status| Required| Current memory state
validFrom| Nullable| When the information became true
validTo| Nullable| When the information stopped being current
recordedAt| Required| When Mopapa recorded the information
createdAt| Required| Memory creation time
updatedAt| Required| Most recent modification time

Initial categories

- "personal_fact"
- "preference"
- "person_relationship"
- "event"
- "plan"
- "task"
- "location"
- "financial"
- "correction"
- "other"
- "unknown"

The category must not prevent an otherwise valid memory from being stored.

Initial statuses

- "active": Currently believed to be valid.
- "historical": Previously valid information.
- "uncertain": Evidence is insufficient to establish the correct interpretation.
- "dismissed": The user has rejected the extraction.
- "unsupported": Retained information with no remaining valid supporting evidence. It must not be presented as an established fact or used as an established fact in Ask.

Deletion is a separate operation, not another status.

Confidence

Do not introduce arbitrary confidence percentages in the first implementation.

A numerical score is useful only when its meaning is defined and calibrated. An unsupported score would create false precision.

The initial model uses evidence, attribution and memory status to represent uncertainty.

7. Memory provenance

Provenance connects extracted memories to their original supporting messages.

It must be a separate collection because:

- One memory may have several supporting messages.
- One message may support several memories.
- Individual source relationships may be removed.
- The original messages must remain independently accessible.

Proposed record:

{
  "id": "source_link_id",
  "memoryId": "memory_id",
  "messageId": "message_id",
  "relationship": "supports",
  "createdAt": "2026-11-19T10:05:00.000Z"
}

Rules

- Every memory source link must reference an existing memory.
- Every memory source link must reference an existing message.
- Initial relationship type: "supports".
- Duplicate links must be rejected.
- Active, historical and uncertain extracted memories must have at least one valid supporting source.
- Unsupported memories may have no remaining valid supporting sources, but must retain their unsupported status.
- An assistant statement must not be represented as a user statement.
- Source attribution must remain available to Ask.
- A memory must not be treated as supported merely because its original source link once existed.

A memory without sufficient supporting evidence must not be presented as an established fact.

8. Historical relationships

Historical relationships connect memories that concern the same changing information.

Proposed record:

{
  "id": "relation_id",
  "fromMemoryId": "newer_memory_id",
  "toMemoryId": "older_memory_id",
  "type": "supersedes",
  "evidenceMessageIds": ["message_id"],
  "createdAt": "2026-11-19T10:10:00.000Z"
}

Initial relationship types

- "supersedes": One memory replaces another as the current information.
- "contradicts": Two memories contain conflicting information.
- "related": Two memories are meaningfully connected without establishing replacement or contradiction.

Relationship rules

For "supersedes":

- "fromMemoryId" identifies the newer or superseding memory.
- "toMemoryId" identifies the older memory.
- The older memory must remain available as historical information.
- The relationship must have supporting evidence.
- A newer timestamp alone is not sufficient proof that one fact replaces another.

For "contradicts":

- Both memories must remain available.
- Neither should automatically be treated as correct.
- Ask must be able to identify the conflict and request clarification where necessary.

For "related":

- Similar wording alone is not sufficient evidence.
- Relationships must have an identifiable reason.

All referenced memories and evidence messages must exist.

9. Existing entries and new memories

The existing "entries" collection must remain intact.

It currently supports manually saved memories, tasks and appointments.

The new "memories" collection must not simply duplicate every existing entry.

Initial ownership:

Information| Collection
Existing manually saved notes| entries
Existing tasks and appointments| entries
Original imported conversation messages| messages
Extracted facts and preferences| memories
Evidence supporting extracted memories| memorySources
Historical and contradiction relationships| memoryRelations

Existing entries must retain their identifiers and existing behaviour.

Any future decision to unify entries and extracted memories must be based on measured benefits and a separate migration plan.

10. Identifiers

All new records require stable unique identifiers.

The current application generates entry identifiers using a timestamp and a random suffix.

The initial implementation should reuse the established approach where appropriate, with an explicit collision check.

Requirements:

- IDs must remain unchanged when records are edited.
- IDs must not depend on array positions.
- IDs must remain stable through export and restore.
- Duplicate IDs must be rejected during validation.
- Relationships must use IDs rather than array positions.

No external identifier-generation dependency is required by this specification.

11. Duplicate ingestion and retry safety

Repeated processing of the same imported message must not create uncontrolled duplicate messages or memories.

Requirements:

1. Preserve stable source identifiers supplied by the import source.
2. Use the source identifier and import-source identity to recognise previously imported messages.
3. Where no stable source identifier exists, do not claim guaranteed automatic duplicate detection. Use an explicit import-batch identity and provide a review strategy before merging potentially repeated records.
4. Duplicate provenance links must be rejected.
5. Memory similarity must not automatically prove that two records are identical.
6. A potentially duplicate memory must be assessed before merging.
7. Failed extraction must never destroy the original message.

Exact text matching alone must not merge two statements that happen to have the same wording.

The ingestion design must define retry behaviour before production implementation.

12. Deletion and provenance integrity

Deletion must respect the relationship between messages and memories.

Deleting a message

- Remove the message and its provenance links.
- Reassess every memory that depended on that message.
- Retain affected memories for review rather than silently deleting them.
- Mark memories with no remaining supporting evidence as unsupported.
- Unsupported memories must not be presented as established facts.
- Reassess historical relationships that depended on the deleted evidence.

Deleting a conversation

- Explain that deleting a conversation can affect memories extracted from it.
- Before deletion, allow the user to choose whether to delete its derived memories as well.
- If the user chooses to retain derived memories, remove their deleted source links and mark unsupported memories accordingly.
- If the user chooses to delete derived memories, remove those memories and their relationships.
- Preserve memories that have independent supporting evidence.
- Perform the selected deletion consistently, without leaving orphaned records.

Deleting a memory

- Remove its provenance links.
- Remove its historical relationships.
- Do not delete original messages merely because one extracted memory was removed.

Unsupported memories

- An unsupported memory is retained information without a remaining valid evidence link.
- It must be visibly distinguished from supported memories.
- It must not be used as an established fact in Ask.
- The user may review, correct or delete it.

Deletion must not leave misleading orphaned records.

13. Validation requirements

Every new collection must have explicit validation.

At minimum:

Conversations

- Valid object.
- Unique non-empty ID.
- Valid origin.
- Supported status.
- Valid timestamp fields.

Messages

- Valid object.
- Unique non-empty ID.
- Existing conversation reference.
- Supported role.
- Non-empty text.
- Valid sequence.
- Nullable or valid timestamp.
- Valid origin.

Memories

- Valid object.
- Unique non-empty ID.
- Supported category or permitted unknown category.
- Non-empty content.
- Supported status.
- Valid date fields.
- Valid timestamps.

Memory sources

- Valid object.
- Unique non-empty ID.
- Existing memory reference.
- Existing message reference.
- Supported relationship type.
- No duplicate memory/message relationship.

Memory relations

- Valid object.
- Unique non-empty ID.
- Existing memory references.
- Supported relationship type.
- Valid evidence references.
- No self-referencing relationships.
- No duplicate relationships.

Whole-dataset validation

Validation must also detect:

- Duplicate identifiers across the relevant collection.
- Missing parent conversations.
- Missing provenance references.
- Missing relationship references.
- Unsupported schema versions.
- Invalid timestamps.
- Invalid relationship structures.
- Extracted memories with no valid supporting source unless their status is "unsupported".
- Unsupported memories incorrectly presented as established facts.
- Memories whose status and provenance records are inconsistent.

The application must not silently discard invalid new records and then report a fully successful restore.

14. Versioning, backup and restore

The current live application uses:

- Storage key: "mopapa.v1"
- Schema version: "1"
- Existing backup and restore safeguards.
- A current import file-size limit of 5 MB.

The proposed schema uses version 2.

The proposed schema version 2 does not by itself authorise changing the existing localStorage key. The current key, "mopapa.v1", and the data schema version are separate concerns. Any storage-key change requires its own compatibility and recovery plan.

Version 1 to version 2

Migration must:

1. Preserve every valid existing entry.
2. Preserve room-learning data.
3. Preserve custom rooms.
4. Preserve Ask learning data.
5. Add the five new collections as empty arrays.
6. Set the new schema version only after successful migration.
7. Preserve a recoverable copy of the original data.
8. Be safe to retry.
9. Never silently discard existing information.

Version 1 backup compatibility

An older valid version 1 backup must remain restorable.

The restore process must initialise the new collections as empty arrays.

Version 2 backup compatibility

A version 2 backup must include every supported data collection.

Restore must validate the complete relationship structure before replacing existing data.

Restore failure

- Existing data must remain unchanged.
- A failed migration must not leave mixed schema versions.
- A failed restore must not partially replace the application state.
- Recovery-copy safeguards must remain in force.
- The user must receive an accurate failure message.

Backup size

The existing 5 MB import limit must be reassessed before substantial conversation history is introduced.

Do not increase it arbitrarily. Measure realistic backup sizes and browser constraints first.

15. Derived indexes

Search indexes are derived information.

They must not become the authoritative copy of messages or memories.

Requirements:

- Indexes must be rebuildable from original messages and memory records.
- Rebuilding must not modify original records.
- An interrupted rebuild must not destroy authoritative data.
- Backup and restore must remain reliable if indexes need rebuilding.
- Search results must retain source references.

The initial data model does not require a separate persistent index collection.

16. Testing requirements

Before production implementation, define tests for:

Record validation

- Valid and invalid conversations.
- Valid and invalid messages.
- Valid and invalid memories.
- Valid and invalid provenance links.
- Valid and invalid historical relationships.

Relationship integrity

- One message supporting several memories.
- Several messages supporting one memory.
- Missing message references.
- Missing memory references.
- Duplicate links.
- Orphaned memories.
- Invalid supersession relationships.

Historical behaviour

- A newer memory superseding an older memory.
- Conflicting memories remaining unresolved.
- Historical information remaining retrievable.
- Unsupported updates not silently replacing existing information.

Deletion

- Deleting one of several supporting messages.
- Deleting the last supporting message.
- Deleting a conversation.
- Deleting a memory.
- Cleaning up affected relationships.

Compatibility and recovery

- Version 1 migration.
- Version 1 backup restoration.
- Version 2 backup restoration.
- Invalid version 2 backup rejection.
- Failed migration rollback.
- Failed restore preserving existing data.
- Recovery-copy creation and recovery.

Before adding tests, inspect "tests/run.js" and "tests/browser.js" for existing coverage.

Extend existing tests where appropriate rather than creating duplicate scenarios.

17. Explicit non-goals

This specification does not authorise:

- Production code changes.
- A new storage technology.
- An IndexedDB migration.
- An external AI service.
- Cloud synchronisation.
- Semantic embeddings.
- A new framework.
- Automatic ingestion from external applications.
- A major interface redesign.
- Replacing existing entries.
- Replacing deterministic Ask.

18. Implementation sequence

The recommended sequence after approval is:

1. Finalise this data model.
2. Define exact migration and rollback behaviour.
3. Define backup compatibility and validation.
4. Establish realistic storage-volume measurements.
5. Implement and test the storage schema extension.
6. Implement conversation and message preservation.
7. Implement deterministic memory extraction.
8. Implement provenance and duplicate handling.
9. Implement historical relationships.
10. Extend retrieval only after the data foundation is reliable.

Each stage must be independently testable.

No later stage should be started merely because the previous stage has been written down.

---

Final design decision

Mopapa will preserve original messages as evidence, represent extracted information as independent memories, and connect the two through explicit provenance records.

Historical changes and contradictions will be represented through separate relationships rather than destructive overwrites.

Existing manual entries, deterministic Ask, local-first storage and recovery safeguards remain the foundation.

This document defines a proposed data model. It does not claim that any of these new capabilities have been implemented.

---

19. Approved data-model alignment and required schema amendments

Decision date: 19 November 2026

Authority: This section extends and, where necessary, supersedes earlier proposals in this document. It records the approved logical requirements. It does not authorise a production schema change or migration.

19.1 Core model

The five proposed collections remain the logical foundation:

- conversations
- messages
- memories
- memorySources
- memoryRelations

Existing entries remain in the existing entries collection.

The five new collections are not yet present in the live schema. The proposed schema version 2 remains a design proposal, not an implementation instruction.

The logical model must distinguish original evidence, extracted memories, provenance, relationships and governance metadata.

19.2 Required conceptual separation

The following are independent data dimensions:

Dimension| Question answered
Record identity| Which record is this?
Attribution| Who originally said or supplied this?
Subject| Who or what is the information about?
Memory type| What kind of memory is it?
Lifecycle state| What stage or state is the memory in?
Evidence state| What does the available evidence establish?
Temporal validity| When was the information true or relevant?
Scope| In which context does the information apply?
Restrictions| How may this information be used?
Provenance| Which original evidence supports it?
Relationships| How does it connect to other memories?

These dimensions must not be compressed into a single status, category or confidence field.

19.3 Message attribution

The message record must distinguish the original message role from its actual author attribution.

The existing role field remains useful for the structure of the source conversation.

The attribution field must be defined sufficiently to preserve the original author classification.

The logical attribution classes are:

- user
- assistant
- third_party
- imported
- unknown

The implementation may represent attribution using a structured object, provided it preserves these distinctions and can retain an optional source-specific identity.

Rules:

- The author is the person or system that produced the original statement.
- The subject is the person or thing the statement concerns.
- A statement about the user must not automatically be attributed to the user.
- Assistant-generated statements must remain identifiable as assistant-generated.
- Imported material must retain its original authorship where available.
- If authorship cannot be established, use unknown.
- Do not infer an author's identity from text alone.

The origin field continues to identify the source or import mechanism. It is not a substitute for authorship.

19.4 Memory attribution and subject

An extracted memory must retain enough information to identify the origin of its claim.

The memory must be traceable through its memorySources records to the original messages and their attribution.

The memory subject must remain separate from the source author.

For example, a third party may make a statement about the user. The memory subject may be the user, but the author remains the third party.

A memory supported by multiple messages must preserve the attribution of each supporting source. Do not flatten different authors into one assumed speaker.

19.5 Memory type and category

The model must distinguish broad memory type from application-specific category.

The logical memory types are:

- episodic
- semantic
- relational
- procedural
- working

Initial persistent implementation should prioritise episodic, semantic and relational memories.

Procedural memory is deferred until the foundational lifecycle is reliable.

Working memory is temporary context assembled for an interaction. It must not automatically be stored as a permanent memory.

Existing category values such as personal_fact, preference, event, task, plan and location may remain as more specific classifications.

A category must not determine evidence quality, lifecycle state, scope or permission.

19.6 Memory lifecycle state

The memory lifecycle state must be represented independently of evidence quality.

The proposed lifecycle states are:

- candidate: extracted or proposed, not yet accepted as an established memory.
- active: accepted for permitted current use.
- historical: retained because it describes an earlier period or state.
- uncertain: retained with an unresolved interpretation or validity question.
- dismissed: rejected by the user and not available as established knowledge.
- unsupported: no remaining valid evidence supports the memory.

Deletion is an operation, not a lifecycle state.

A dismissed memory must not be silently reactivated by repeated extraction.

A candidate must not be presented as an established fact.

An unsupported memory must not be used as an established fact in Ask.

The implementation must define permitted transitions between states before production ingestion begins.

19.7 Evidence state

Evidence state must be separate from lifecycle state.

The logical evidence states are:

- supported: one or more valid sources support the claim.
- partially_supported: available evidence supports only part of the claim.
- conflicted: valid sources materially disagree.
- unsupported: no valid supporting evidence remains.
- unknown: evidence quality or availability has not been established.

Evidence state must be derived from valid provenance and the evidence assessment. It must not be treated as a substitute for source records.

A memory may be active but later become conflicted after new evidence arrives. The lifecycle state and evidence state must therefore be independently representable.

A memory with conflicted or partially supported evidence must not be presented as an unqualified fact.

19.8 Scope

Every memory must be capable of representing the context in which it applies.

The logical scope model must support:

- personal
- conversation
- project
- topic
- other
- unknown

A scope may include a stable reference to the relevant conversation, project or topic when such an entity exists.

The initial implementation must not invent project or topic identifiers. It may use unknown until a supported reference exists.

Scope is not the same as subject.

A subject identifies what the memory concerns. Scope identifies where or in what context the memory applies.

Missing scope must not silently become unrestricted scope.

19.9 Use restrictions

The data model must provide an explicit representation for memory-use restrictions.

The logical design must support restrictions such as:

- do not surface proactively
- use only within the specified context
- do not infer additional information from this memory
- do not use for a specified purpose
- user-defined restriction

These are examples of restriction semantics, not a final enum or an instruction to implement every option immediately.

Restrictions must be enforceable by retrieval and answering.

A descriptive note that a memory is restricted is insufficient if the retrieval system can still use it in a prohibited context.

The implementation must define how multiple restrictions combine. A less restrictive source must never silently override a more restrictive applicable instruction.

Missing restriction metadata must not override an explicit restriction recorded elsewhere.

19.10 Temporal information

The existing validFrom and validTo concepts remain.

The implementation must distinguish:

- when the original statement was made;
- when Mopapa received or imported it;
- when the described information became true, if known;
- when the described information stopped being true, if known;
- when the memory record was created or updated.

These timestamps have different meanings.

Unknown times must remain unknown. Import time must never be substituted for the original statement time or the time an event occurred.

A later statement does not automatically establish that an earlier fact has ended.

Supersession requires an explicit relationship supported by evidence.

19.11 Provenance rules

The memorySources collection remains the authoritative link between memories and supporting messages.

It must preserve:

- the memory identifier;
- the original message identifier;
- the source relationship;
- the source's attribution through the referenced message;
- the time the relationship was recorded;
- any supported evidence qualification needed to explain the relationship.

Initial source relationship:

- supports

Additional relationship types require a demonstrated need and a documented definition.

A memory may have several supporting messages. A message may support several memories.

Removing one source must trigger reassessment of the memory's remaining evidence.

A source relationship must not be treated as valid if either referenced record is missing or deleted.

19.12 Relationship rules

The memoryRelations collection remains responsible for relationships between memories.

Initial relationship types remain:

- supersedes
- contradicts
- related

The relationship must identify the memories involved and preserve the evidence that justifies the relationship.

Supersession:

- identifies the newer memory and the earlier memory;
- does not delete the earlier memory;
- requires evidence that the same changing fact or state is being updated;
- must not be inferred from timestamps alone.

Contradiction:

- preserves both memories;
- does not automatically select a winner;
- must remain visible to retrieval and answer evaluation.

Related:

- must have a defensible reason;
- must not be created from wording similarity alone.

19.13 Deletion, revocation and restrictions

The model must distinguish deletion from revocation and restriction.

Deletion removes information under the defined deletion operation and its retention rules.

Revocation withdraws permission for a memory or source to be used. Revoked information must not remain available to ordinary retrieval as though permission still exists.

Restriction narrows permitted use without necessarily deleting the information.

The implementation must define how each operation affects:

- original messages;
- extracted memories;
- provenance links;
- historical relationships;
- derived indexes;
- backups and recovery copies;
- future re-imports.

Deleting a source must trigger reassessment of every memory dependent on it.

A memory with no remaining valid evidence must become unsupported and must not be presented as established knowledge.

If a memory has several independent supporting sources, deleting one source must not automatically destroy valid remaining support.

A deleted or revoked memory must not silently reappear through a repeated import or extraction. The design must provide a safe way to recognise prior user decisions without retaining prohibited content unnecessarily.

19.14 Record validation

Validation must cover the combined model, not only individual record shapes.

It must verify:

- unique stable identifiers;
- valid parent conversation references;
- valid message-to-conversation relationships;
- supported author attribution;
- valid memory lifecycle and evidence states;
- valid memory type and category;
- valid temporal fields;
- valid scope references;
- valid restriction representation;
- valid provenance links;
- valid memory relationships;
- no orphaned records;
- no invalid supersession or contradiction structures;
- no duplicate source links;
- no unsupported memory presented as established knowledge.

Validation must reject or safely quarantine invalid records according to a defined policy.

A restore must not be reported as fully successful if records or relationships were silently discarded.

19.15 Storage and migration

The proposed version 2 structure remains a logical target.

No change to the live storage key, schema version, storage technology or migration behaviour is authorised by this section.

The current localStorage implementation remains the live source of truth.

IndexedDB remains a candidate for evaluation, not an approved migration.

Before any schema extension or storage migration:

1. Finalise the complete record validation rules.
2. Define backup and restore compatibility.
3. Define migration and rollback behaviour.
4. Measure realistic conversation volume and storage performance.
5. Confirm that existing entries, learning data, rooms and Ask state remain intact.
6. Test interrupted writes and failed restoration.
7. Obtain separate implementation approval.

Do not maintain two competing authoritative stores.

19.16 Evaluation requirements

The data model must make it possible to test independently:

- correct author attribution;
- correct subject attribution;
- source preservation;
- memory extraction quality;
- candidate acceptance and dismissal;
- evidence-state transitions;
- temporal updates;
- contradiction handling;
- scope enforcement;
- restriction enforcement;
- revocation;
- deletion;
- duplicate import and retry behaviour;
- provenance integrity;
- backup and restore integrity.

A high retrieval or answer score cannot compensate for a serious attribution, privacy, restriction or deletion failure.

19.17 Implementation boundary

This specification approves the logical target direction only.

It does not approve:

- production code changes;
- a schema version change;
- an IndexedDB migration;
- a local language model;
- an external AI service;
- cloud synchronisation;
- automatic access to other applications;
- a replacement for existing entries;
- replacement of deterministic Ask.

The next design task is to map these requirements onto the existing modules and define exact validation, lifecycle, deletion and backup behaviour.

---

Final data-model decision

Mopapa will preserve original messages independently from extracted memories.

Every extracted memory must retain traceable evidence, source attribution, subject, lifecycle state, evidence state, temporal information, scope and applicable restrictions.

Relationships will represent supported updates and contradictions without destructive overwrites.

Existing manual entries remain intact.

The model is approved as a target specification. It is not implemented and must not be treated as a live storage schema.