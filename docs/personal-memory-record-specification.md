Mopapa: Implementation-Level Personal Memory Record Specification

Date: 20 November 2026
Status: Canonical technical specification under final consolidation. The decisions in this document govern the proposed implementation model. Production implementation and schema migration still require explicit approval.

Repository: https://github.com/kynaruniverse/Mopapa
Architecture authority: "docs/personal-memory-architecture.md"
Logical data-model authority: "docs/personal-memory-data-model.md"
Implementation audit: "docs/personal-memory-implementation-audit.md"

---

1. Purpose and status

This document converts Mopapa's approved logical personal-memory model into proposed serialised record structures.

It defines:

- Exact record shapes.
- Field types and requirements.
- Identifier and reference rules.
- Authorship and subject attribution.
- Evidence and provenance.
- Memory lifecycle and evidence state.
- Temporal information.
- Relationships between memories.
- Scope, audience and use permissions.
- Restrictions and their inheritance.
- Identity corrections.
- Deletion and re-import protection.
- Whole-dataset validation requirements.

This document is a design proposal. It does not authorise:

- Production JavaScript changes.
- A live storage schema change.
- A schema version change.
- An IndexedDB migration.
- External AI or hosted inference.
- Paid services or recurring dependencies.
- Cloud synchronisation.
- Replacement of manual entries.
- Replacement of deterministic Ask.

Every proposed field and rule must be reviewed against the existing application before implementation approval.

2. Core design principles

The schema must enforce the following distinctions.

1. Original evidence is not the same thing as an extracted memory.
2. A message author is not necessarily the person discussed in the message.
3. A quoted speaker is not necessarily the message author.
4. Import origin is not authorship.
5. A subject is not automatically a verified identity.
6. A memory's lifecycle state is separate from its evidence state.
7. A memory's temporal validity is separate from when Mopapa recorded it.
8. A newer statement does not automatically supersede an older statement.
9. Similar wording does not prove two memories are duplicates.
10. Missing permission is not permission.
11. Deletion and revocation must affect derived information.
12. Search indexes and summaries are never the only authoritative copy.

3. Proposed collection structure

The existing application currently has four top-level data domains:

- "entries"
- "learned"
- "customRooms"
- "ask"

The logical personal-memory model proposes five additional collections:

- "conversations"
- "messages"
- "memories"
- "memorySources"
- "memoryRelations"

Re-import idempotency and deletion suppression remain required design capabilities. No persistent import-ledger collection or alternative suppression collection is approved. The mechanism must be resolved separately before implementation.

Identity correction history is proposed as embedded participant metadata rather than a separate top-level collection.

The proposed future structure is therefore:

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

The proposed structure contains exactly the five additional logical collections. No import ledger or sixth collection is included. Schema version 2 remains proposed and is not supported by the live application.

Participants are embedded in conversations. Quoted-speaker annotations are embedded in messages. Subjects are embedded in memories. Scope and governance metadata are embedded in the records to which they apply.

No separate persistent search-index collection is required initially.

4. Shared conventions

4.1 Identifiers

All new records use stable string identifiers.

Proposed format:

- Prefix identifying the record type.
- A generated unique suffix.
- No dependence on array position.
- No dependence on display names.
- No external service or identifier-generation dependency.

Examples:

- "con_..."
- "par_..."
- "msg_..."
- "mem_..."
- "src_..."
- "rel_..."
- "imp_..."

The exact generator must be selected after reviewing the existing identifier implementation.

Every generated ID must be checked for collision within its collection. Imported source identifiers must be stored separately from Mopapa-generated IDs.

4.2 Timestamps

All known absolute timestamps use ISO 8601 UTC strings.

Example:

"2026-11-20T09:30:00.000Z"

Rules:

- Unknown timestamps use "null".
- Do not invent timestamps.
- Do not replace an original event time with an import time.
- Do not interpret a date-only value as midnight UTC.
- Date-only values use "YYYY-MM-DD" where the underlying information genuinely has no time.
- Original timezone information should be retained separately when supplied and relevant.
- Invalid timestamps must be rejected, not silently normalised into a different date.

4.3 Optional values and null

Use "null" when a field is part of the record but its value is genuinely unknown.

Omit a field only when it is explicitly optional and has no applicable value.

Do not use empty strings as substitutes for unknown values.

Do not treat missing fields in older imported data as permission or proof.

4.4 Original and derived information

Original evidence includes:

- Original message text.
- Source-provided timestamps.
- Source-provided message identifiers.
- Source-provided participant identifiers.
- Original role and author information.

Derived metadata includes:

- Extracted memory content.
- Memory categories and types.
- Subject interpretations.
- Relationships.
- Evidence assessments.
- Scope interpretations.
- Search terms and indexes.

Derived metadata must remain traceable to the original evidence and must be correctable without rewriting it.

5. Conversation records

A conversation groups related messages and conversation-local participants.

Example:

{
  "id": "con_example001",
  "title": "Work and plans",
  "origin": {
    "type": "chatgpt_import",
    "sourceId": "source_conversation_123",
    "label": "ChatGPT export"
  },
  "status": "active",
  "participants": [],
  "createdAt": "2026-11-18T09:00:00.000Z",
  "updatedAt": "2026-11-18T10:30:00.000Z",
  "receivedAt": "2026-11-20T09:30:00.000Z",
  "governance": {}
}

Field| Type| Required| Rules
"id"| String| Yes| Unique Mopapa conversation ID
"title"| String or null| No| Maximum 200 characters; null if unknown
"origin"| Object| Yes| Describes source and import origin
"origin.type"| Enum string| Yes| "manual", "chatgpt_import", "file_import", "other"
"origin.sourceId"| String or null| No| Original stable source ID, if available
"origin.label"| String or null| No| Human-readable source label; maximum 100 characters
"status"| Enum string| Yes| "active", "archived"
"participants"| Array| Yes| Conversation-local participant records
"createdAt"| Timestamp or null| Yes| Original creation time, if known
"updatedAt"| Timestamp or null| Yes| Latest known original activity time
"receivedAt"| Timestamp| Yes| Time received by Mopapa
"governance"| Object| Yes| Scope, audience, policy and restrictions

Rules:

- One conversation may contain multiple participants.
- Participant IDs must be unique within the conversation.
- A participant ID is not automatically a global identity.
- A conversation must not contain its entire message history in one text field.
- Conversation ordering is established by message sequence and timestamps, not by array position.
- Conversation deletion is performed through the deletion operation, not by assigning a "deleted" status.
- A completed deletion removes the conversation and affected dependent records from the active dataset according to the approved deletion and recovery policy.

6. Participant records

Participants are embedded in their conversation.

Example:

{
  "id": "par_example001",
  "sourceParticipantId": "user_123",
  "kind": "user",
  "displayName": "Charles",
  "identityStatus": "unresolved",
  "identityKey": null,
  "identityHistory": []
}

Field| Type| Required| Rules
"id"| String| Yes| Unique within parent conversation
"sourceParticipantId"| String or null| No| Original source identifier, if supplied
"kind"| Enum string| Yes| "user", "assistant", "third_party", "system", "unknown"
"displayName"| String or null| No| Maximum 200 characters
"identityStatus"| Enum string| Yes| "unresolved", "identified", "ambiguous", "unknown"
"identityKey"| String or null| No| Stable identity reference only after an explicit resolution decision
"identityHistory"| Array| Yes| Correction history; initially empty

Rules:

- Two participants with the same display name must not automatically be merged.
- A person mentioned in a message is not automatically a conversation participant.
- A participant's identity must not be inferred from writing style.
- Cross-conversation identity matching requires an explicit, reviewable resolution.
- A correction must preserve the original participant record's history.
- A correction must trigger reassessment of memories and relationships that depend on the affected identity.

The exact global identity model remains a decision requiring further review. "identityKey" must not be treated as a verified identity merely because it is populated.

7. Message records

Messages preserve original statements.

Example:

{
  "id": "msg_example001",
  "conversationId": "con_example001",
  "sequence": 12,
  "role": "user",
  "author": {
    "kind": "participant",
    "participantId": "par_example001",
    "attribution": "user"
  },
  "text": "I now work at Company B.",
  "timestamp": "2026-11-18T14:30:00.000Z",
  "receivedAt": "2026-11-20T09:30:00.000Z",
  "origin": {
    "type": "chatgpt_import",
    "sourceMessageId": "source_message_456"
  },
  "quotedSpeakers": [],
  "governance": {}
}

Field| Type| Required| Rules
"id"| String| Yes| Unique Mopapa message ID
"conversationId"| String| Yes| Must reference an existing conversation
"sequence"| Integer| Yes| Non-negative; unique within conversation
"role"| Enum string| Yes| "user", "assistant", "system", "other"
"author"| Object| Yes| Explicit author attribution
"text"| String| Yes| Original unmodified text; non-empty
"timestamp"| Timestamp or null| Yes| Original message time, if known
"receivedAt"| Timestamp| Yes| Time received or imported by Mopapa
"origin"| Object| Yes| Source and original message identifier
"quotedSpeakers"| Array| Yes| Explicit quoted-speaker annotations
"governance"| Object| Yes| Applicable scope, audience, policy and restrictions

7.1 Author representation

The "author" object uses one of these forms:

Participant author:

{
  "kind": "participant",
  "participantId": "par_example001",
  "attribution": "user"
}

Unknown author:

{
  "kind": "unknown",
  "participantId": null,
  "attribution": "unknown"
}

System or assistant author:

{
  "kind": "system",
  "participantId": null,
  "attribution": "assistant"
}

The allowed attribution classes are:

- "user"
- "assistant"
- "third_party"
- "unknown"

Import origin is recorded separately from authorship. "Imported" must never be used as an author attribution.

Import origin is not the same as authorship. A message imported from another application may still have been written by the user.

The exact mapping between "role", "author.kind" and "author.attribution" must be validated as a combination. Invalid combinations must be rejected.

7.2 Message rules

- Original message text must never be rewritten during extraction.
- Message sequence must preserve original order.
- A message must belong to exactly one existing conversation.
- Sequence numbers must not be reused within the same conversation.
- Unknown authors must remain unknown.
- Assistant statements must not automatically become user facts.
- Imported content must retain its original source identity.
- A message's original timestamp must remain separate from "receivedAt".

8. Quoted-speaker annotations

Quoted speakers are stored within the message's "quotedSpeakers" array.

Example:

{
  "id": "quote_example001",
  "participantId": null,
  "speakerLabel": "my manager",
  "attribution": "third_party",
  "textStart": 0,
  "textEnd": 32,
  "status": "unresolved"
}

Field| Type| Required| Rules
"id"| String| Yes| Unique within message
"participantId"| String or null| Yes| Conversation-local participant reference, if resolved
"speakerLabel"| String or null| No| Maximum 200 characters
"attribution"| Enum string| Yes| "user", "assistant", "third_party", "unknown"
"textStart"| Integer or null| Yes| Start offset in original message text
"textEnd"| Integer or null| Yes| Exclusive end offset
"status"| Enum string| Yes| "resolved", "unresolved", "ambiguous", "unknown"

Rules:

- Original message text remains unchanged.
- Offsets use a single documented indexing convention.
- The implementation must choose and test whether offsets count UTF-16 code units or Unicode code points.
- "textStart" must be less than "textEnd".
- Both offsets must remain within the original message text.
- A quoted speaker must not be treated as the author of the entire message.
- An unresolved speaker must not be assigned to a participant by guesswork.
- If message text is corrected through an explicit source correction, affected spans must be revalidated.

The offset convention is a blocking implementation decision. Do not implement span storage until it is fixed and tested with emoji, combining characters and other non-ASCII text.

9. Memory records

A memory is an independently retrievable representation derived from one or more sources.

Example:

{
  "id": "mem_example001",
  "type": "semantic",
  "category": "personal_fact",
  "content": "Charles works at Company B.",
  "subjects": [],
  "lifecycleState": "active",
  "evidenceState": "supported",
  "temporal": {
    "validFrom": null,
    "validTo": null,
    "timeStatus": "unknown"
  },
  "recordedAt": "2026-11-20T09:35:00.000Z",
  "createdAt": "2026-11-20T09:35:00.000Z",
  "updatedAt": "2026-11-20T09:35:00.000Z",
  "governance": {},
  "revision": 1
}

Field| Type| Required| Rules
"id"| String| Yes| Unique Mopapa memory ID
"type"| Enum string| Yes| "episodic", "semantic", "relational", "procedural", "working"
"category"| Enum string| Yes| Defined category or "other" / "unknown"
"content"| String| Yes| Concise representation; non-empty; maximum to be established by measurement
"subjects"| Array| Yes| One or more subject records, or empty when genuinely unknown
"lifecycleState"| Enum string| Yes| "candidate", "active", "historical", "uncertain", "dismissed"
"evidenceState"| Enum string| Yes| "supported", "partially_supported", "unsupported", "disputed", "unverified"
"temporal"| Object| Yes| Validity and time certainty
"recordedAt"| Timestamp| Yes| Time Mopapa recorded the memory
"createdAt"| Timestamp| Yes| Creation time of the memory record
"updatedAt"| Timestamp| Yes| Most recent record modification
"governance"| Object| Yes| Scope, audience, use policy and restrictions
"revision"| Integer| Yes| Positive integer, incremented on meaningful edit

9.1 Memory types

- "episodic": A specific event or experience.
- "semantic": A fact, preference or general piece of knowledge.
- "relational": Information about a relationship between subjects.
- "procedural": A method, routine or way of doing something.
- "working": Temporary information relevant to an active task or context.

Procedural memory must not be treated as an instruction that can override user intent or application safety rules.

Working memory must have an explicit expiry or review policy before implementation. It must not become permanent merely because it was not cleaned up.

9.2 Categories

Initial proposed categories:

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

Type and category are separate dimensions. A preference may be semantic; an event may be episodic.

9.3 Lifecycle states

The permitted lifecycle states are:

- "candidate": Extracted but not yet accepted as a usable memory.
- "active": Accepted for permitted retrieval, subject to evidence and governance.
- "historical": Retained as previously applicable information.
- "uncertain": Meaning, attribution or truth cannot currently be established.
- "dismissed": Rejected by the user or an explicit review process.

Deletion is an operation, not a lifecycle state. A completed deletion removes the applicable record from the active dataset under the approved deletion and recovery policy. No ordinary memory record with a "deleted" lifecycle state is retained.

9.4 Evidence states

- "supported": Valid supporting evidence exists.
- "partially_supported": Some claims are supported but the complete memory is not.
- "unsupported": No remaining valid supporting evidence.
- "disputed": Evidence conflicts and has not been resolved.
- "unverified": Evidence has not been adequately assessed.

Lifecycle and evidence state must be validated independently.

An "active" memory must not be usable as an established fact unless its evidence state and governance permit that use.

A dismissed memory must not silently return to active status through re-import.

9.5 Confidence

Do not introduce an arbitrary numerical confidence score.

Evidence quality, attribution, uncertainty and review status must be represented explicitly. A numerical score may be considered only after its meaning, calibration and evaluation method are defined.

10. Memory subject records

Subjects are embedded in a memory.

Example:

{
  "id": "sub_example001",
  "kind": "person",
  "label": "Charles",
  "identityKey": null,
  "attribution": "user",
  "identityStatus": "unresolved"
}

Field| Type| Required| Rules
"id"| String| Yes| Unique within memory
"kind"| Enum string| Yes| "person", "organisation", "place", "event", "object", "topic", "unknown"
"label"| String| Yes| Maximum 200 characters
"identityKey"| String or null| Yes| Explicitly resolved identity reference, otherwise null
"attribution"| Enum string| Yes| "user", "assistant", "third_party", "unknown"
"identityStatus"| Enum string| Yes| "resolved", "unresolved", "ambiguous", "unknown"

Rules:

- Subject attribution identifies who or what the memory concerns.
- It does not identify who made the statement.
- A subject may be unknown.
- Multiple subjects may be present.
- A subject label is not proof of identity.
- Cross-conversation identity resolution must be explicit and reversible.
- Subject changes must trigger reassessment of memory relationships and retrieval.

The exact global identity-key model remains subject to review.

11. Memory-source and provenance records

A provenance record links a memory to an original message and the evidence within that message.

Example:

{
  "id": "src_example001",
  "memoryId": "mem_example001",
  "messageId": "msg_example001",
  "relationship": "supports",
  "evidenceSpans": [
    {
      "textStart": 0,
      "textEnd": 32
    }
  ],
  "sourceAttribution": "user",
  "createdAt": "2026-11-20T09:35:00.000Z"
}

Field| Type| Required| Rules
"id"| String| Yes| Unique provenance ID
"memoryId"| String| Yes| Existing memory reference
"messageId"| String| Yes| Existing message reference
"relationship"| Enum string| Yes| Initially "supports"
"evidenceSpans"| Array| Yes| One or more source spans, unless whole-message evidence is explicitly justified
"sourceAttribution"| Enum string| Yes| Attribution of the supporting statement
"createdAt"| Timestamp| Yes| Time link was created

Evidence span:

Field| Type| Required| Rules
"textStart"| Integer| Yes| Inclusive start offset
"textEnd"| Integer| Yes| Exclusive end offset

Rules:

- Every provenance record must reference an existing memory and message.
- Duplicate memory/message links must be rejected unless a reviewed model permits distinct non-overlapping evidence links.
- Every active supported extracted memory must have at least one valid source link.
- One message may support multiple memories.
- One memory may have multiple supporting messages.
- The source author must remain distinguishable from the memory subject.
- Evidence spans must point to the original message text.
- If offsets are unavailable or unreliable, the record must explicitly identify whole-message support rather than inventing offsets.
- A source link must not be treated as valid after its message has been deleted or revoked.

A memory with multiple sources remains supported only to the extent that valid remaining sources support its complete meaning.

12. Memory relationships

Relationships are separate records.

Example:

{
  "id": "rel_example001",
  "fromMemoryId": "mem_newer001",
  "toMemoryId": "mem_older001",
  "type": "supersedes",
  "evidenceSourceIds": ["src_example001"],
  "createdAt": "2026-11-20T09:40:00.000Z"
}

Field| Type| Required| Rules
"id"| String| Yes| Unique relation ID
"fromMemoryId"| String| Yes| Existing memory ID
"toMemoryId"| String| Yes| Existing memory ID; must differ from "fromMemoryId"
"type"| Enum string| Yes| "supersedes", "contradicts", "related"
"evidenceSourceIds"| Array| Yes| Existing provenance references supporting the relationship
"createdAt"| Timestamp| Yes| Relationship creation time

Rules:

- "fromMemoryId" is the newer or initiating side for "supersedes".
- "toMemoryId" is the older memory being superseded.
- Supersession must not erase the older memory.
- Supersession requires evidence that the newer statement updates the same underlying fact.
- A later timestamp alone is insufficient.
- Contradictory memories must remain unresolved until sufficient evidence or user correction exists.
- Related memories must have an identifiable reason.
- Similar wording alone does not justify a relationship.
- Self-references and duplicate relationships are invalid.
- Supersession cycles are invalid.
- Relationships must be reassessed when their supporting evidence is deleted or revoked.

13. Scope, audience and use-policy metadata

Governance is embedded in conversations, messages and memories.

The governing rule is conservative: information must pass its applicable restrictions before it enters retrieval or answer context.

Example:

{
  "scope": {
    "type": "personal",
    "reference": null
  },
  "audience": {
    "type": "owner_only",
    "references": []
  },
  "usePolicy": {
    "directAnswer": "allow",
    "contextualAnswer": "allow",
    "proactiveSurfacing": "deny",
    "crossContextReuse": "deny",
    "inference": "deny",
    "export": "allow"
  },
  "restrictions": []
}

13.1 Scope

Field| Type| Required| Rules
"scope.type"| Enum string| Yes| "personal", "conversation", "project", "topic", "event", "relationship", "other", "unknown"
"scope.reference"| String or null| Yes| Required for reference-dependent scope types

Scope describes where information applies. It does not itself grant permission to use or disclose information.

13.2 Audience

Field| Type| Required| Rules
"audience.type"| Enum string| Yes| "owner_only", "named_audience", "restricted_context", "unknown"
"audience.references"| Array| Yes| Explicit audience references; empty unless required

Unknown audience must not be interpreted as unrestricted visibility.

13.3 Use policy

Each permission is independently represented.

Allowed values:

- "allow"
- "deny"
- "unknown"

Field| Type| Required| Purpose
"directAnswer"| Enum string| Yes| Use in response to a direct question
"contextualAnswer"| Enum string| Yes| Use as supporting context in an answer
"proactiveSurfacing"| Enum string| Yes| Surface information without a direct request
"crossContextReuse"| Enum string| Yes| Reuse information in a different conversation or project
"inference"| Enum string| Yes| Derive additional conclusions from the information
"export"| Enum string| Yes| Include information in an export

Missing, unknown or conflicting permission must deny the disputed use.

Permission to answer a direct question does not imply permission for proactive surfacing, inference or cross-context reuse.

External disclosure is not authorised by this model.

14. Restrictions and restriction provenance

Restrictions are embedded in the governance object.

Example:

{
  "id": "restriction_example001",
  "type": "context_only",
  "effect": "deny",
  "appliesTo": [
    "crossContextReuse",
    "proactiveSurfacing"
  ],
  "reason": "Information is restricted to its original context.",
  "sourceMessageId": "msg_example001",
  "createdAt": "2026-11-20T09:35:00.000Z"
}

Field| Type| Required| Rules
"id"| String| Yes| Unique within governance object
"type"| Enum string| Yes| Defined restriction type
"effect"| Enum string| Yes| "deny"
"appliesTo"| Array| Yes| One or more supported use permissions
"reason"| String or null| No| Maximum 500 characters
"sourceMessageId"| String or null| No| Evidence source for restriction
"createdAt"| Timestamp| Yes| Creation time

Initial restriction types:

- "context_only"
- "no_proactive_use"
- "no_cross_context_reuse"
- "no_inference"
- "no_export"
- "explicit_denial"
- "other"
- "unknown"

Rules:

- Explicit denial takes precedence over permission.
- Restrictions from multiple supporting sources must be combined conservatively.
- A derived memory must not receive broader permissions than its source evidence permits.
- A restriction must be checked before retrieval and context assembly.
- Deleted or revoked source evidence must not remain usable through a derived memory.
- Restriction provenance must be preserved sufficiently to explain why a use was denied.
- If a policy cannot be evaluated safely, the information must be excluded from that use.

The precise policy-combination algorithm and treatment of mixed-source memories require a separate worked decision table before implementation.

15. Identity correction history

Identity corrections are embedded in the relevant participant's "identityHistory" array.

Example:

{
  "id": "identity_change001",
  "previousIdentityKey": null,
  "newIdentityKey": "identity_example001",
  "reason": "User-confirmed identity correction",
  "sourceMessageIds": ["msg_example001"],
  "createdAt": "2026-11-20T10:00:00.000Z"
}

Field| Type| Required| Rules
"id"| String| Yes| Unique within participant history
"previousIdentityKey"| String or null| Yes| Previous identity reference
"newIdentityKey"| String or null| Yes| Corrected identity reference
"reason"| String| Yes| Maximum 500 characters
"sourceMessageIds"| Array| Yes| Existing messages supporting correction
"createdAt"| Timestamp| Yes| Correction time

Rules:

- Corrections must not silently overwrite original attribution.
- A correction must be traceable.
- A correction must trigger reassessment of affected memories and relationships.
- An identity correction must not automatically merge all records sharing a name.
- A correction must be reversible through a further explicit correction.
- Historical identity information must not be used as current identity without evaluation.

The global identity-key ownership and deletion model remains unresolved. This embedded proposal must be reviewed before approval.

16. Re-import and deletion suppression requirements

The system must prevent ordinary re-import or automatic extraction from silently reversing a deliberate deletion, dismissal or revocation decision.

The logical model currently contains five proposed personal-memory collections. No additional persistent collection is approved for import history or deletion suppression.

The suppression mechanism remains unresolved and must receive a separate privacy and architecture review before implementation.

16.1 Source identity

- Prefer stable source identifiers supplied by the original source.
- Keep original source identifiers separate from Mopapa-generated record IDs.
- Do not use text similarity alone as proof that two records are the same source.
- Do not claim reliable duplicate detection when stable source identity is unavailable.
- Do not retain raw deleted message text solely to recognise a previous import.

16.2 Required re-import behaviour

- A previously processed source must follow normal duplicate-handling rules.
- A source known to have been deliberately deleted must not silently recreate its deleted records.
- A dismissed candidate must not silently return as an accepted memory.
- A revoked source must remain subject to the applicable denial or restriction.
- Similar wording from a different source must not automatically be treated as the same source.
- Ambiguous or conflicting source identity must be handled conservatively.

16.3 Suppression mechanism

The minimum metadata, storage location, retention period, deletion behaviour, backup inclusion and restore behaviour remain unresolved.

No "importLedger", sixth collection, fingerprint scheme or alternative persistent suppression mechanism is approved by this specification.

A future design must establish how suppression metadata can prevent accidental re-import without retaining prohibited personal content unnecessarily.

16.4 Explicit reintroduction

A deliberate user instruction to reintroduce previously deleted information must be distinguishable from an ordinary repeated import.

The confirmation, retention and audit behaviour for explicit reintroduction remain subject to a separate design decision.

16.5 Failure and uncertainty

If the system cannot establish whether an import would reverse a previous deletion or revocation, it must not claim that suppression is reliable.

The affected import or restore must be blocked or require an explicitly designed user review process. It must not silently override the unresolved decision.

16.6 Deleting a message

- Remove the original message.
- Remove provenance links referencing it.
- Reassess dependent memories.
- Mark memories without valid remaining evidence as "unsupported".
- Reassess relationships depending on the affected evidence.
- Remove derived index material.
- Record only the minimum permitted deletion metadata.

16.7 Deleting a conversation

The user must be told which memories may be affected.

The operation must define whether derived memories are also deleted or retained as unsupported records.

Memories supported by independent sources must be reassessed rather than automatically deleted.

16.8 Deleting a memory

- Remove the memory.
- Remove its provenance links.
- Remove its relationships.
- Remove derived index material.
- Apply re-import suppression where the deletion represents a deliberate user decision.

Original messages must not be deleted merely because one derived memory is removed.

16.9 Revocation

Revocation is a permission change, not merely a status label.

It must prevent the affected information from being used in prohibited contexts, including through derived memories, indexes, cached context and future imports.

16.10 Backups and recovery copies

The design must distinguish deletion from the continued existence of older exported backups or recovery copies.

The application must not claim that deleting a live record has also erased every previously exported copy.

Backup retention, recovery-copy deletion and restored-data suppression require explicit policy and tests.

17. Whole-dataset invariants

The following must hold for a valid dataset.

17.1 Identifier integrity

- Every record ID is non-empty and unique within its collection.
- No reference depends on array position.
- All references resolve to the correct record type.
- Participant IDs resolve within their parent conversation.
- Message sequence numbers are unique within their conversation.

17.2 Conversation and message integrity

- Every message references exactly one existing conversation.
- Every participant reference resolves within that conversation.
- Every quoted-speaker participant reference resolves within that conversation.
- Original message text remains unchanged by extraction.
- Message ordering remains deterministic.

17.3 Memory and provenance integrity

- Every provenance link references an existing memory and message.
- Every supported extracted memory has sufficient valid evidence.
- Unsupported memories cannot be treated as established facts.
- Provenance attribution remains consistent with the source message.
- Evidence spans are within the original message text.
- No memory may claim support from deleted or revoked evidence.

17.4 Relationship integrity

- Every relationship references two distinct existing memories.
- Evidence references resolve.
- Duplicate relationships are rejected.
- Supersession cycles are rejected.
- Contradictory memories remain distinguishable.
- Relationship validity is reassessed when evidence changes.

17.5 Governance integrity

- Missing permission does not grant permission.
- Explicit denial overrides allow.
- Unknown scope is not unrestricted scope.
- Unknown audience does not permit disclosure.
- Derived memories cannot broaden source permissions.
- Governance is checked before retrieval and context assembly.
- Deleted and revoked evidence is excluded.

17.6 Temporal integrity

- All known timestamps are valid.
- Unknown timestamps remain null.
- "validFrom" must not be later than "validTo" when both are known.
- Original time and import time remain distinct.
- Historical facts are not automatically treated as current.

18. Validation-failure policy

Validation must distinguish record errors from dataset integrity errors.

18.1 Normal loading

The existing application has a recovery-oriented loading path that can reject malformed individual legacy entries while preserving valid neighbouring records.

The new collections must not silently inherit that behaviour without an explicit decision.

A malformed relationship or provenance record can change the meaning or safety of an otherwise valid memory.

The new data domains must therefore be validated as a connected dataset.

18.2 Backup restore

A user-requested restore must reject a backup that fails required schema or relationship validation.

It must not silently discard invalid new records and then report a complete successful restore.

18.3 Failed operations

A failed migration, import or restore must leave the previous application state unchanged.

No partially migrated or mixed-schema dataset may be reported as successful.

18.4 Error reporting

Errors should identify:

- The affected collection.
- The record identifier, where safe.
- The validation rule.
- Whether the operation was rejected.
- Whether existing data remains unchanged.

Error messages must not expose unnecessary personal message content.

19. Backup and migration implications

The live application remains schema version 1.

The proposed schema version 2 is not implemented.

Before migration approval, the design must specify:

1. Exact version 1 to version 2 conversion.
2. Treatment of unversioned legacy data.
3. Preservation of all existing entries.
4. Preservation of learning data.
5. Preservation of custom rooms.
6. Preservation of Ask state.
7. Initialisation of all new collections.
8. Validation of every new record domain.
9. Referential-integrity validation.
10. Backup compatibility.
11. Restore compatibility.
12. Recovery-copy behaviour.
13. Failed migration rollback.
14. Failed restore rollback.
15. Retry behaviour.
16. Re-import suppression.
17. Import-size and storage-volume limits.

The existing storage key "mopapa.v1" and the internal schema version are separate concerns.

No storage-key change is implied.

All new domains must remain within the existing storage ownership boundary unless a separately approved storage decision changes it.

20. Performance and size limits

Do not invent maximum sizes based solely on convenience.

The following limits require measurement before implementation:

- Maximum conversation count.
- Maximum messages per conversation.
- Maximum message text length.
- Maximum memory count.
- Maximum subjects per memory.
- Maximum provenance links per memory.
- Maximum evidence spans per source.
- Maximum relationship count.
- Maximum import-ledger retention.
- Maximum total serialised dataset size.
- Maximum backup size.

Measurements must include representative conversation archives, not only the existing manual-entry benchmark.

The existing CI Chromium results do not establish Android device performance or safe archive capacity.

21. Evaluation requirements

The implementation must be independently testable for:

- Correct message author attribution.
- Correct subject attribution.
- Quoted-speaker attribution.
- Preservation of original messages.
- Candidate extraction quality.
- Evidence completeness.
- Memory lifecycle transitions.
- Independent evidence-state transitions.
- Temporal reasoning.
- Supersession.
- Contradiction handling.
- Scope enforcement.
- Audience enforcement.
- Restriction inheritance.
- Revocation.
- Deletion.
- Re-import suppression.
- Duplicate import and retry behaviour.
- Identity correction.
- Backup and restore integrity.

A high retrieval or answer score cannot compensate for a serious privacy, attribution, restriction or deletion failure.

22. Decisions still requiring explicit review

The following are not finalised by this document:

1. The global identity-key model and whether it requires a separate identity domain.
2. The exact relationship between message role, author kind and attribution class.
3. Exact maximum record and archive sizes.
4. Working-memory expiry and retention.
5. Whether candidate memories can ever be automatically promoted to active.
6. Exact policy-combination algorithm for memories with multiple sources.
7. Exact deletion behaviour for retained derived memories.
8. Privacy, retention and deletion rules for re-import suppression metadata.
9. Exact backup envelope and integrity requirements.
10. Exact migration and rollback transaction boundaries.
11. Recovery-copy sanitisation and retention after deletion.
12. Explicit reintroduction behaviour after a deliberate deletion.

These must be resolved before this specification is approved as implementation-ready.

23. Implementation boundary

This specification is a design artefact only.

It does not authorise:

- Production code changes.
- Live schema changes.
- IndexedDB.
- Local language models.
- External AI services.
- Paid services.
- Cloud synchronisation.
- Automatic access to other applications.
- Replacing manual entries.
- Replacing deterministic Ask.

The next stage is a technical review of this specification, followed by migration, backup, recovery and acceptance design.

Production implementation must remain blocked until those designs are complete and explicitly approved.

---

Current decision: Mopapa's target remains a local-first, evidence-grounded personal memory system. Original conversations, extracted memories, attribution, provenance, temporal history, governance and deletion must be represented separately and validated together. The live application remains unchanged.


---

18. Canonical technical resolutions

This section resolves inconsistencies between earlier versions of this specification and the supporting architecture, data-model, identity, governance, deletion and backup documents.

It takes precedence over any conflicting earlier statement in this document or its supporting reference documents.

The following rules establish the canonical proposed implementation model. They do not independently authorise production implementation or a live schema migration.

18.1 Canonical collections

The proposed application data contains the existing domains:

- "entries"
- "learned"
- "customRooms"
- "ask"

And exactly five additional personal-memory collections:

- "conversations"
- "messages"
- "memories"
- "memorySources"
- "memoryRelations"

No sixth collection is approved.

In particular, no separate persistent import ledger, identity collection, dependency collection or search-index collection is authorised.

Existing manually saved entries remain separate from extracted memories.

18.2 Canonical temporal representation

Every memory uses one "temporal" object.

The canonical structure is:

{
  "timeStatus": "known_interval",
  "validFrom": {
    "value": "2026-01-01",
    "precision": "day",
    "timezone": null
  },
  "validTo": {
    "value": "2026-06-30",
    "precision": "day",
    "timezone": null
  }
}

Each endpoint is either null or an object containing:

- "value"
- "precision"
- "timezone"

Permitted "timeStatus" values:

- "known_interval"
- "known_start"
- "known_end"
- "approximate"
- "unknown"

Permitted precision values:

- "instant"
- "day"
- "month"
- "year"
- "approximate"
- "unknown"

Rules:

- An exact instant uses ISO 8601 with an explicit timezone or UTC designator.
- Date-only information remains a date-only value.
- A month or year must not be converted into an invented day.
- Unknown values remain null.
- An approximate value must not be represented as an exact instant.
- "known_interval" requires both endpoints.
- "known_start" requires a start endpoint.
- "known_end" requires an end endpoint.
- "unknown" requires both endpoints to be null.
- Endpoint ordering must be validated when both endpoints are comparable.
- Invalid or contradictory temporal data must not be silently normalised.

This structure replaces nullable timestamp-only validity fields wherever they appear in earlier specifications.

Message time, receipt time, record creation time, update time and memory recording time remain separate concepts.

18.3 Canonical evidence spans

All source-text offsets use UTF-16 code units.

Offsets are zero-based, inclusive at the start and exclusive at the end.

A located evidence span has this structure:

{
  "textStart": 0,
  "textEnd": 24
}

A whole-message reference must be explicit:

{
  "kind": "whole_message"
}

A located span uses:

{
  "kind": "span",
  "textStart": 0,
  "textEnd": 24
}

A provenance record contains one or more evidence references using this structure.

Rules:

- A span must point into the original, unchanged message text.
- Start and end must be integers.
- Start must be non-negative.
- End must be greater than start.
- End must not exceed the JavaScript string length of the original text.
- The same UTF-16 convention must be used for creation, validation, highlighting, export and restore.
- Whole-message evidence must never be inferred from a missing span.
- Invalid spans must be rejected or explicitly reviewed; they must not be silently clamped.

18.4 Canonical provenance records

The "memorySources" collection records direct evidence relationships between memories and original messages.

Canonical structure:

{
  "id": "src_example001",
  "memoryId": "mem_example001",
  "messageId": "msg_example001",
  "relationship": "supports",
  "evidenceSpans": [
    {
      "kind": "span",
      "textStart": 0,
      "textEnd": 24
    }
  ],
  "sourceAttribution": "user",
  "quotedSpeakerId": null,
  "createdAt": "2026-11-20T09:35:00.000Z"
}

Permitted provenance relationships:

- "supports"
- "refutes"
- "qualifies"
- "context_only"

Every provenance record must include:

- A unique provenance ID.
- An existing memory ID.
- An existing message ID.
- One permitted relationship.
- One or more explicit evidence references.
- Source attribution.
- A quoted-speaker reference or null.
- A creation timestamp.

"quotedSpeakerId", when non-null, must reference an annotation in the exact source message.

Source attribution values are:

- "user"
- "assistant"
- "third_party"
- "unknown"

Import origin is not an attribution value.

A provenance relationship describes how the source relates to the memory claim. Its existence does not automatically make the memory supported.

One memory/message pair has one provenance record. That record may contain multiple non-overlapping evidence spans.

If different parts of one message have materially different evidence relationships, create separate independently assessable memories rather than creating ambiguous duplicate links.

A memory may have multiple source records. A message may support or qualify multiple memories.

This canonical structure replaces earlier definitions that allowed only "supports" or used message IDs directly as memory relationship evidence.

18.5 Canonical memory derivation metadata

Direct evidence and memory-to-memory derivation are different relationships.

Every memory record must contain a "derivation" object.

Canonical structure:

{
  "kind": "direct",
  "method": "deterministic_extraction",
  "sourceMemoryIds": [],
  "createdAt": "2026-11-20T09:35:00.000Z"
}

Permitted derivation kinds:

- "direct"
- "derived"
- "user_corrected"
- "consolidated"

Rules:

- "direct" memories are derived from original message evidence and have no source memory IDs.
- "derived" memories must reference one or more existing source memories.
- "user_corrected" memories must retain traceable references to the prior interpretation and the evidence for the correction.
- "consolidated" memories must reference every source memory materially used in the consolidation.
- Source memory references must not be replaced by a summary or copied text.
- Derivation dependencies must be traversable in both directions.
- A derived memory must not become independent merely because it has been rewritten or summarised.
- Dependency cycles are invalid.
- Missing or malformed dependency references block affected retrieval and relevant destructive operations.
- Derivation metadata must not grant broader permissions than its source material permits.

The exact permitted "method" values may expand as implementation capabilities are evaluated. No external AI or paid inference method is approved by this field.

Derivation metadata is embedded in "memories". It does not create another collection.

18.6 Canonical semantic memory relationships

The "memoryRelations" collection is reserved for semantic relationships between memories.

Permitted relationship types:

- "supersedes"
- "contradicts"
- "related"

A semantic relationship must not be used as a substitute for a derivation dependency.

Canonical structure:

{
  "id": "rel_example001",
  "fromMemoryId": "mem_newer001",
  "toMemoryId": "mem_older001",
  "type": "supersedes",
  "evidenceSourceIds": [
    "src_example001"
  ],
  "createdAt": "2026-11-20T09:40:00.000Z"
}

Rules:

- Both memory references must exist.
- Self-references are invalid.
- Duplicate semantic relationships are invalid.
- Supersession requires evidence that the newer memory updates the same underlying fact.
- A later timestamp alone is insufficient.
- The older memory remains available as historical information where permitted.
- Contradictory memories must not be silently resolved.
- Related memories require an identifiable reason.
- Supersession cycles are invalid.
- Evidence supporting a semantic relationship must use existing provenance IDs.
- Deletion or revocation of relationship evidence requires reassessment of the relationship.

"evidenceSourceIds" always refers to "memorySources" IDs. It must not contain message IDs.

18.7 Identity boundary

The initial implementation uses conversation-local participants only.

Participant identity, quoted-speaker identity and memory subject identity remain distinct.

Global identity resolution is deferred.

Until a separately approved global identity model exists:

- Participant "identityKey" must be null.
- Subject "identityKey" must be null.
- No cross-conversation identity matching is permitted.
- No automatic identity merging is permitted.
- A display name is not proof of identity.
- Corrections must remain conversation-local and reversible.
- Identity corrections must trigger reassessment of dependent memories and relationships.

The initial implementation may distinguish unresolved, ambiguous and unknown identities. It must not use a "resolved" state to imply a global identity record that does not exist.

18.8 Canonical lifecycle and evidence states

Lifecycle states:

- "candidate"
- "active"
- "historical"
- "uncertain"
- "dismissed"

Evidence states:

- "supported"
- "partially_supported"
- "unsupported"
- "disputed"
- "unverified"

These are independent dimensions.

Deletion is an operation, not a lifecycle state.

An active memory is not automatically eligible for retrieval. Evidence, attribution, temporal validity and governance must also permit the requested use.

A dismissed memory must not silently return through ordinary extraction or re-import.

18.9 Canonical dependency and deletion rules

Deletion and revocation must traverse both:

1. Direct memory-to-message provenance through "memorySources".
2. Memory-to-memory derivation through "memories.derivation.sourceMemoryIds".

Semantic relationships in "memoryRelations" must also be reassessed when their endpoints or supporting provenance are affected.

After source deletion or revocation:

- Identify all direct dependencies.
- Traverse all indirect derivation dependencies.
- Recalculate remaining evidence.
- Recalculate applicable permissions and restrictions.
- Reassess lifecycle and evidence states.
- Invalidate affected retrieval representations.
- Remove dependent information that cannot remain valid.
- Retain a memory only when remaining permitted evidence independently supports its complete claim.

A memory must not be silently rewritten to survive deletion.

A narrower replacement claim requires an explicit, evidence-grounded correction.

If dependency traversal encounters a cycle, missing reference, malformed record or uncertain permission, affected retrieval must fail closed.

Deleting a memory does not automatically delete its original messages.

Deleting a message or conversation requires reassessment of all dependent memories.

Revocation blocks the uses that have been withdrawn, even if the original source remains stored.

18.10 Re-import and deletion suppression boundary

No sixth collection or import ledger is approved.

Where stable source identifiers exist, they should be used to identify previously processed material.

Where reliable source identity is unavailable:

- Text similarity alone must not establish identity.
- Mopapa must not claim reliable deletion suppression.
- Ambiguous re-import must require an explicit review process.
- Ordinary import must not silently reverse a known deletion, dismissal or revocation.
- Raw deleted message text must not be retained solely to identify a future import.

The initial implementation must not claim complete re-import suppression until a privacy-reviewed mechanism has been approved and tested.

18.11 Canonical backup and migration rules

Application schema version and backup format version are separate.

The proposed schema version 2 remains inactive until explicitly approved.

A future migration must:

1. Inventory the complete current dataset.
2. Validate the existing schema.
3. Preserve all existing manual entries and learning data.
4. Construct the proposed replacement without modifying the active dataset.
5. Validate every collection and cross-collection reference.
6. Validate provenance, derivation, semantic relationships and governance.
7. Create and verify a protected recovery copy.
8. Commit the replacement using the approved storage transaction.
9. Read back and validate the committed dataset.
10. Confirm success only after verification.
11. Provide a tested recovery path for failure.

An older application must not open and save a newer unsupported schema as though it were compatible.

A malformed record or broken reference must not be silently discarded during a complete restore.

Deletion and revocation decisions must not be undone by restoring an older backup.

The final backup envelope, format version, deletion-aware recovery-copy policy and migration transaction remain explicit pre-implementation decisions.

18.12 Storage and performance boundary

The current application continues to use localStorage and schema version 1.

No live schema change is implied by this specification.

IndexedDB remains a candidate, not an approved migration.

Before archive-scale implementation is considered complete, performance testing must include:

- Realistic conversation counts.
- Realistic message counts.
- Long messages.
- Multiple provenance records per memory.
- Memory derivation chains.
- Search and retrieval workloads.
- Backup and restore workloads.
- Deletion and revocation workloads.
- Storage quota and interrupted-write behaviour.
- Actual Android browser performance.

Existing small-dataset benchmarks do not establish performance for a substantial conversation archive.

18.13 Implementation approval boundary

The following remain outside approval until explicitly authorised:

- Production schema version 2.
- A storage-key change.
- IndexedDB migration.
- Global identity resolution.
- External AI or hosted inference.
- Paid services.
- Cloud synchronisation.
- Automatic access to other applications.
- Replacement of deterministic Ask.
- A wholesale application rewrite.

The initial implementation must preserve the existing application and introduce the new capabilities in independently testable phases.

18.14 Authority and conflict rule

This document is the sole technical authority for proposed personal-memory record structures and validation rules.

The product and architecture blueprint defines product intent and system boundaries.

The build roadmap defines implementation order and acceptance criteria.

Supporting research and historical specifications provide rationale, examples and traceability only. They must not introduce competing field definitions or implementation requirements.

Where a supporting document conflicts with this specification, this specification takes precedence until the supporting document is reconciled or marked reference-only.

No unresolved technical issue may be treated as approved merely because an example or earlier draft contains it.

---