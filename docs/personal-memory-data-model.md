Mopapa: Personal Memory Data Model Specification

Status: Proposed data model
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