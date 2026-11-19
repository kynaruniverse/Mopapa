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


19.3 Conversation participants and message authorship

The model must distinguish:

- The conversation in which a message appears.
- The participant who produced the message.
- The original role assigned by the source format.
- Any person quoted or attributed within the message.
- The person or thing discussed by an extracted memory.

These are separate concepts and must not be collapsed into one role, name or attribution field.

19.3.1 Conversation participants

Each conversation must be capable of preserving its own participant list.

A participant is a source-local identity used to distinguish speakers within that conversation.

Proposed logical participant record:

{
  "id": "participant_id",
  "sourceLabel": "Mum",
  "sourceRole": "participant",
  "identityResolution": "source_only"
}

Fields:

- id: required stable identifier, unique within the conversation.
- sourceLabel: original display name or speaker label, if supplied.
- sourceRole: original role or participant type supplied by the source, if available.
- identityResolution: the degree to which the participant's real-world identity has been established.

Initial identity resolution values:

- source_only: the source identifies a speaker, but Mopapa has not established who that person is.
- unresolved: the source provides insufficient or conflicting identity information.
- confirmed_within_conversation: the participant has been explicitly identified within this conversation.

The conversation record owns these participant records.

Participant identifiers must not be derived from array positions, display names or assumptions about identity.

Two participants with the same display name must remain separate unless their identity has been explicitly resolved.

A participant label such as "Mum", "Speaker 2" or "Alex" is not proof of a globally unique person.

The initial model does not establish that a participant in one conversation is the same person as a participant in another conversation.

Cross-conversation person resolution is deferred until a separate identity model and its correction, merging and deletion rules have been designed.

The initial model does not require a separate global people collection.

19.3.2 Message author representation

The message record must preserve the source's original role and provide a structured representation of authorship.

The existing role field remains available to preserve the original conversation structure.

The proposed author object is:

{
  "kind": "third_party",
  "participantId": "participant_id"
}

Initial author kinds:

- user
- assistant
- system
- third_party
- unknown

Rules:

- user identifies a message authored by the Mopapa user's own conversational identity.
- assistant identifies a message produced by the assistant.
- system identifies a system-generated message where the source distinguishes one.
- third_party identifies another human participant.
- unknown identifies authorship that cannot be established.

For third_party authors, participantId must refer to a participant belonging to the same conversation.

For user and assistant authors, a participantId is not required.

Unknown authorship must not be converted into a user or third-party identity merely because the text uses first-person or conversational language.

The original source role must be preserved separately where it differs from these logical author kinds.

The origin field identifies the source or import mechanism. It does not identify the author.

An imported user message remains user-authored. An imported assistant message remains assistant-authored.

If an import source does not provide reliable authorship, use unknown rather than inventing a role.

19.3.3 Quoted and embedded speakers

A message may contain statements attributed to someone other than its author.

For example:

- The user writes: "Mum said she is moving next month."
- The user writes: "My colleague told me the meeting was cancelled."
- An assistant message quotes a statement from an earlier source.
- An imported message contains a quotation from another participant.

The message author remains the person who produced the message.

The quoted speaker must be represented separately when the quotation is relevant to an extracted memory.

A quoted-speaker annotation must preserve:

- The participant reference, if known.
- The exact quoted text location in the original message.
- Whether the attribution was explicit or unresolved.
- The original message containing the quotation.

Proposed logical annotation:

{
  "id": "quoted_speaker_id",
  "participantId": "participant_id",
  "evidenceSpan": {
    "start": 12,
    "end": 43
  },
  "attributionStatus": "explicit"
}

Initial attribution statuses:

- explicit: the original message clearly identifies the quoted speaker.
- ambiguous: more than one possible speaker or interpretation exists.
- unknown: the quoted speaker cannot be established.

The evidence span uses zero-based JavaScript string offsets into the unchanged original message text, with an exclusive end offset.

Offsets must be measured against the exact stored string. Normalisation, trimming, line-ending conversion or other text transformations must not be applied before calculating or validating them.

Tests must cover Unicode characters, surrogate pairs, repeated quoted phrases, invalid ranges and empty spans.

If the source does not preserve an exact quotation or reliable span, the annotation must not pretend that a precise span is known.

Quoted-speaker annotations are derived metadata. They must never modify the original message text.

An ambiguous quotation must not be treated as a confirmed statement by a named person.

19.3.4 Attribution rules

The author is the person or system that produced the original message.

A quoted speaker is the person to whom a statement inside that message is attributed.

The subject is the person or thing that the information concerns.

These identities may all be different.

Examples:

1. The user says: "I have moved to Bristol."

   Author: user.
   Subject: user.

2. The user says: "My partner has moved to Bristol."

   Author: user.
   Subject: the partner.

3. The user says: "My partner told me that their new job starts Monday."

   Author: user.
   Quoted speaker: partner.
   Subject: partner.

4. The assistant says: "You previously mentioned working at Company B."

   Author: assistant.
   Subject: user.
   The assistant statement is not independent proof that the user works there. The original supporting user message must be retrieved if the claim is to be treated as user-supplied evidence.

5. An imported message identifies its speaker only as "Speaker 3".

   Author: third_party.
   Participant: source-local Speaker 3.
   Real-world identity: source_only or unresolved.

6. A message says: "Alex told me that Jordan is leaving."

   Author: the message author.
   Quoted speaker: Alex, if explicitly established.
   Subject: Jordan.

No author or subject identity may be inferred solely from:

- A matching display name.
- An email address or username.
- Writing style.
- Pronouns without a clear antecedent.
- A conversational assumption.
- A previous conversation containing a similar name.

Explicit user confirmation or reliable source metadata may establish an identity, but the basis must be retained.

19.4 Memory subject representation and identity resolution

An extracted memory must preserve its subject independently from its source author.

The existing plain-text subject example is insufficient as an implementation-level representation.

The proposed logical representation is a subjects array.

Each subject reference identifies the person, object, event or topic to which the memory applies.

Proposed subject reference:

{
  "kind": "person",
  "participantId": "participant_id",
  "label": "Mum",
  "resolution": "confirmed",
  "role": "person_discussed"
}

Initial subject kinds:

- user
- person
- object
- event
- topic
- unknown

Initial resolution values:

- confirmed
- ambiguous
- unresolved

The participantId field is used when the subject is a participant represented in the supporting conversation.

For a user subject, kind is user and a third-party participant reference is not required.

For a person who is not represented as a conversation participant, a descriptive label may be retained, but it must not be treated as a globally resolved identity.

A subject reference must not become confirmed merely because a name is present.

Where a memory concerns more than one subject, each subject must be represented separately.

The optional role field describes the subject's part in the memory, not their identity or authorship.

Examples include:

- person_discussed
- event_participant
- owner
- recipient
- other

These role values are descriptive relationships. They must not be used as proof of identity.

19.4.1 Subject and author independence

The memory subject must not be copied automatically from the message author.

The following combinations are valid:

- User author, user subject.
- User author, third-party subject.
- Third-party author, user subject.
- Third-party author, another third-party subject.
- Assistant author, user subject, with the original evidence separately identified.
- Unknown author, known subject.
- Known author, unresolved subject.

A memory supported by multiple messages must preserve each source's author attribution through its individual memorySources links.

Do not flatten several authors into one assumed speaker.

If supporting messages disagree about the subject, the memory must remain ambiguous or be separated into distinct candidate memories for review.

19.4.2 Identity resolution boundaries

The initial implementation must support reliable identity within an individual conversation.

It must not claim reliable global identity resolution across unrelated conversations.

The following are insufficient to merge two participants:

- Identical names.
- Identical nicknames.
- Similar descriptions.
- Similar relationships to the user.
- Similar writing styles.
- Similar occupations or locations.

Cross-conversation identity resolution requires an explicit mechanism to:

- Propose a possible match.
- Show the evidence for the match.
- Obtain confirmation where necessary.
- Preserve the original source-local participant identifiers.
- Correct or reverse a mistaken identity match.
- Reassess memories affected by the correction.
- Prevent an identity correction from rewriting original evidence.

This capability is deferred. Until it is designed and approved, memories referring to similarly named people in different conversations must remain independently identifiable.

19.4.3 Identity corrections

Correcting a participant's identity must not rewrite original messages or quoted text.

The correction must be represented as a separate, auditable decision.

The future implementation must preserve:

- The original source participant label.
- The previous identity resolution.
- The corrected identity resolution.
- The evidence or user confirmation supporting the correction.
- The time the correction was recorded.
- The memories and relationships affected by the correction.

A correction must trigger reassessment of derived memories that depend on the affected identity.

It must not silently transfer facts from one person to another.

If the identity cannot be resolved confidently, retain an unresolved or ambiguous subject instead of forcing a match.

19.4.4 Attribution and subject validation

The combined validator must verify:

- Every third-party message author references a participant in the same conversation.
- Participant identifiers are unique within their conversation.
- Participant references do not cross conversation boundaries.
- Author kinds are supported.
- Unknown authorship remains explicitly unknown.
- Quoted-speaker references resolve to valid participants where supplied.
- Evidence spans are valid against the unchanged original message text.
- Subject kinds and resolution values are supported.
- Participant-based subjects reference valid participants.
- User subjects do not require an invented participant.
- Unresolved subjects are not presented as confirmed identities.
- A memory's subject is not assumed to be its source author.
- Identity corrections do not modify original messages.
- No cross-conversation identity merge occurs without an explicit supported resolution.

Invalid participant or subject references must be rejected or safely quarantined according to the defined import and restore policy.

They must not be silently replaced with the user identity.

19.4.5 Evaluation requirements

The evaluation fixtures must include:

- User speaking about themselves.
- User speaking about a partner or family member.
- Third party speaking about the user.
- Third party speaking about another third party.
- Assistant repeating a user-supplied fact.
- Assistant introducing an unsupported claim.
- Direct quotation with a clearly identified speaker.
- Quotation with an ambiguous speaker.
- Imported conversation with multiple participants.
- Repeated names belonging to different people.
- The same person using different labels in one conversation.
- The same display name used by different people in separate conversations.
- Missing author metadata.
- Conflicting subject references.
- Identity correction after memories have been extracted.
- Deletion of the evidence supporting an identity decision.

Attribution accuracy, subject accuracy and identity resolution accuracy must be evaluated independently.

A correct answer about the wrong person is a critical failure.

A memory attributed to the user when the evidence came from an assistant or third party is a critical failure.

19.4.6 Implementation boundary

This section defines the proposed logical participant, author, quoted-speaker and subject model.

It does not authorise:

- A production schema change.
- A new people or entity collection.
- Cross-conversation automatic identity matching.
- Automatic identity inference from names or writing style.
- Changes to existing messages or manual entries.
- A migration or storage technology change.

The exact serialised schema, correction history representation, import mapping and validation implementation must be finalised before production work is authorised.


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


19.8 Scope, context and applicability

Scope identifies where, when or under what circumstances a memory applies.

Scope is independent from:

- Subject: who or what the memory concerns.
- Source: where the information originated.
- Audience: who may see or receive the information.
- Use policy: what Mopapa may do with the information.
- Temporal validity: when the information is or was true.

These dimensions must not be compressed into one field.

19.8.1 Scope types

The logical scope model must support:

- personal: information intended to apply generally to the user's personal context.
- conversation: information limited to a particular conversation.
- project: information limited to a particular project.
- topic: information limited to a defined subject or topic.
- event: information limited to a particular event or occasion.
- relationship: information applicable within a particular relationship context.
- other: a defined context that does not fit the preceding types.
- unknown: the applicable context has not been established.

A scope reference may identify the relevant conversation, project, topic, event or relationship where a supported record exists.

The initial implementation must not invent identifiers for projects, topics, events or relationships that have not been established.

Unknown scope must remain explicitly unknown.

A missing scope must never be interpreted as personal or unrestricted scope.

19.8.2 Scope inheritance and conflicts

A memory extracted from a conversation does not automatically have conversation-only scope.

For example:

- "I prefer tea" may describe a general personal preference.
- "For this project, use tea-coloured packaging" is project-specific.
- "In this conversation, assume the meeting is at 3pm" is conversation-specific.
- "At the event next Friday, I will arrive at 3pm" is event-specific.

Scope must be established from the meaning and evidence, not simply copied from the source container.

Where the evidence does not establish the applicable scope, retain unknown or require clarification.

A memory supported by several sources must not silently broaden its scope.

If supporting sources have incompatible scopes, the memory must remain separated into appropriately scoped records or be marked ambiguous pending review.

A broader scope must not be inferred from repeated mentions in narrower contexts.

A project-specific fact must not become a general personal fact solely because it appears in several project conversations.

19.8.3 Scope and retrieval

Retrieval must consider the current interaction context.

The retrieval process must determine whether a memory is applicable to:

- The current conversation.
- The current project or task, if known.
- The current topic, if known.
- The user's general personal context.
- Another explicitly established context.

If the current context is unknown, Mopapa must not assume that a restricted memory is applicable.

A memory with conversation-only scope must not be used in an unrelated conversation unless a separately defined permission explicitly allows that use.

A memory with project scope must not automatically appear in another project.

A memory with unknown scope must not be treated as globally applicable.

A retrieved memory must still pass audience and use-policy checks before it can be used in an answer.

19.9 Audience visibility and use policy

Audience visibility and use policy define what Mopapa is permitted to do with stored information.

They are separate from whether the information is true, useful or relevant.

A memory may be:

- Correct but restricted.
- Relevant but not permitted in the current context.
- Retained for historical reference but not available for proactive use.
- Available for a direct user question but not for unrelated suggestions.
- Private to the user despite containing information about another person.

The presence of information in storage does not grant permission to retrieve, disclose, infer from or proactively surface it.

19.9.1 Audience model

The logical audience model must distinguish:

- owner_only: available only to the owner of the Mopapa installation.
- named_audience: available only to explicitly identified recipients, if a future supported sharing capability exists.
- restricted_context: available only within an explicitly authorised context.
- unknown: the permitted audience has not been established.

The initial product remains a single-user, local-first application.

Owner-only is the default audience.

The initial implementation must not imply that named-audience sharing or multi-user access exists.

Imported conversation participants are not automatically authorised recipients.

Being a participant in an original conversation does not grant that person access to the user's Mopapa memories.

A memory about another person does not become shareable with that person merely because they are its subject.

Audience identifiers must refer to explicitly established identities or supported local contexts. Display names alone are insufficient.

19.9.2 Visibility defaults

Newly extracted memories must default to owner_only visibility unless a more restrictive policy applies.

If the intended audience cannot be established, use unknown and prevent disclosure outside the owner's explicitly authorised context.

Existing manual entries without visibility metadata must not automatically become publicly or externally accessible.

For the initial single-user application, existing manual entries may be treated as owner-only for internal use, provided this does not expand their existing use beyond the user's control.

No memory should be made available to an external recipient, service or application without an explicit supported authorisation.

19.9.3 Use policy dimensions

The logical use policy must distinguish the following permissions:

- answer_direct: may be used when directly answering a relevant user question.
- answer_contextual: may be used in an otherwise relevant contextual answer.
- proactive_surface: may be surfaced without the user directly asking for the information.
- cross_context_reuse: may be used in a different conversation, project or topic.
- inference: may be used as a basis for deriving additional information.
- export: may be included in an export or transfer intended for another destination.

These permissions must be independently representable.

The initial default must be conservative:

- Direct answers: allowed only when scope and audience checks pass.
- Contextual answers: allowed only when scope and audience checks pass.
- Proactive surfacing: denied unless explicitly permitted.
- Cross-context reuse: denied unless explicitly permitted.
- Additional inference: restricted by the source evidence and explicit use policy.
- External disclosure or sharing: denied unless explicitly authorised.

A permission for one purpose must not automatically grant permission for another.

For example, permission to answer a direct question does not grant permission to proactively mention the same information in an unrelated conversation.

Permission to use a memory internally does not grant permission to export or share it.

19.9.4 Restrictions

The logical restriction model must support explicit prohibitions such as:

- Do not surface proactively.
- Do not use outside the originating conversation.
- Do not use outside the specified project or topic.
- Do not disclose to a specified audience.
- Do not use for a specified purpose.
- Do not infer additional personal information from this source.
- Do not export or share.
- Do not use after a specified time or event.
- User-defined restriction.

Restrictions must be represented as enforceable policy data, not merely descriptive text.

A restriction must identify its target and, where applicable:

- The prohibited action.
- The prohibited context.
- The affected audience.
- Its effective period.
- Its source or authorisation basis.
- Whether it applies to the original evidence, a derived memory or both.

The exact serialised representation remains subject to the implementation-level schema review.

19.9.5 Restriction inheritance

A memory derived from restricted evidence must inherit the applicable restrictions.

Extracting a shorter or differently worded memory must not remove restrictions attached to its source.

If several messages support one memory, the effective use policy must account for every supporting source.

A less restrictive source must not override a restriction attached to another source.

Where a memory combines information from sources with different restrictions, the combined memory must follow the most restrictive applicable policy for each affected use.

If the sources cannot be separated sufficiently to apply their policies independently, restrict the combined memory rather than weakening its protections.

If a restricted source is later deleted or revoked, the memory's provenance and effective restrictions must be reassessed.

Removing a restriction from a derived memory must not silently remove the restriction from its original evidence.

A restriction may be changed only through an explicit, authorised decision with an auditable record.

19.9.6 Policy combination and conflict resolution

Restrictions combine conservatively.

The effective permission is the intersection of all applicable permissions, not the union.

In practical terms:

- An explicit denial overrides an otherwise applicable permission.
- A narrower context overrides a broader context.
- An unknown audience does not grant disclosure.
- An unknown scope does not grant cross-context use.
- A missing policy does not override an existing restriction.
- A conflicting or invalid policy results in denial until resolved.

No retrieval ranking score, memory confidence score, recency value or relevance score may override a restriction.

The answer layer must not be able to bypass a denial returned by the governance check.

If a memory is relevant but prohibited, Mopapa must exclude it from the answer context.

The application may explain that it cannot use information in the current context, but must not reveal the restricted information while doing so.

19.9.7 Retrieval and context assembly enforcement

Governance checks must occur before restricted information enters the answer context.

The future retrieval pipeline must:

1. Identify the current interaction context.
2. Retrieve potential candidate records.
3. Check lifecycle and evidence eligibility.
4. Check temporal validity.
5. Check scope applicability.
6. Check audience visibility.
7. Apply the effective use policy.
8. Exclude prohibited records.
9. Assemble the smallest permitted evidence set.
10. Pass only permitted evidence to the answer layer.

The answer layer must receive sufficient policy outcome information to prevent it from reintroducing excluded material.

A memory excluded by governance must not be included indirectly through a derived summary, cached answer, index or related memory.

Derived indexes and cached context must not become a route around restrictions.

If the current context or policy cannot be evaluated reliably, the affected memory must be withheld.

19.9.8 Proactive use

Proactive use requires a separate permission.

A memory being active, relevant, recent or useful does not authorise Mopapa to surface it without a direct question.

The initial product should default to no proactive use of newly extracted memories.

Future proactive capabilities must define:

- Which memory types are eligible.
- Which scopes are eligible.
- Which audiences are permitted.
- Which purposes are permitted.
- How timing and frequency are controlled.
- How the user can inspect and disable proactive use.
- How restrictions are enforced before a notification or suggestion is generated.

No notification, reminder or unsolicited suggestion may disclose restricted information.

19.9.9 Export and backup distinction

Internal backup and recovery are distinct from external sharing.

A user-created backup is intended to preserve the user's own data for recovery.

An export intended for another person, application or service is a separate disclosure action.

The implementation must distinguish these purposes.

Backup and restore must preserve:

- Original scope.
- Audience visibility.
- Use policies.
- Restrictions.
- Restriction provenance.
- Any relevant policy history.

A restore must not broaden permissions or remove restrictions.

An export must not silently include information that is prohibited from external disclosure.

If the export format cannot preserve the applicable policy metadata, the export must either exclude the affected records or clearly require an explicit user decision before proceeding.

19.9.10 Validation and evaluation requirements

The combined validator and future governance tests must verify:

- Every memory has a valid scope representation.
- Unknown scope remains distinguishable from personal scope.
- Scope references resolve to valid records where supplied.
- Audience values are supported.
- Unknown audience does not grant disclosure.
- Owner-only remains the default for newly extracted memories.
- Imported participants are not automatically authorised recipients.
- Each use permission is represented independently.
- Missing permissions do not become implicit grants.
- Restrictions have valid targets and supported actions.
- Source restrictions propagate to derived memories.
- Multiple source restrictions combine conservatively.
- A less restrictive source cannot override a stricter source.
- Explicit denial overrides an otherwise applicable permission.
- Cross-context reuse is blocked unless authorised.
- Proactive use is blocked unless authorised.
- Export restrictions are enforced independently from internal backup.
- Restore preserves scope and policy metadata.
- Restricted memories cannot enter answer context through an index, summary or cache.
- Invalid or conflicting policies result in safe denial.
- Policy changes preserve an auditable decision history.

Evaluation fixtures must include:

- A general personal preference.
- A project-specific instruction.
- A conversation-only statement.
- A memory with unknown scope.
- A memory about a third party.
- A private memory that is relevant to an unrelated conversation.
- A memory permitted for direct answers but prohibited for proactive use.
- A memory permitted in one project but prohibited in another.
- A memory derived from one restricted source and one unrestricted source.
- A memory whose source restriction is later changed.
- An export containing restricted and unrestricted records.
- A backup and restore preserving all policy metadata.
- A conflicting policy.
- A missing policy.
- An attempt to retrieve restricted information through a derived index.
- An attempt to surface a restricted memory through a proactive suggestion.

A restriction violation is a critical failure.

A correct answer that discloses information in a prohibited context is a critical failure.

A restore that silently broadens permissions is a critical failure.

19.9.11 Implementation boundary

This section defines the proposed logical scope, audience and use-policy model.

It does not authorise:

- External sharing.
- Multi-user access.
- Cloud synchronisation.
- Third-party processing.
- Automatic access to other applications.
- Proactive notifications or autonomous suggestions.
- A production schema change.
- Changes to existing manual-entry behaviour.
- A migration or storage technology change.

The exact serialised policy structure, policy evaluation order, restriction history, export behaviour and enforcement interfaces must be finalised before production implementation.

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