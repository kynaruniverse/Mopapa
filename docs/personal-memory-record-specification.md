Mopapa: Personal Memory Record Specification

Status: Consolidated canonical technical specification
Date: 23 November 2026
Repository: https://github.com/kynaruniverse/Mopapa
Authority: This document is the technical authority for the proposed personal-memory record model.
Implementation status: The Stage 1 schema-version-2 storage foundation is implemented and verified. All five proposed collections remain empty. Non-empty record support and all subsequent personal-memory functionality remain design-only and subject to separate approval.

---

1. Purpose, scope and authority

This document defines the proposed technical model for storing, validating, governing and retrieving personal memories in Mopapa.

It covers:

- The existing application data domains and five proposed additional collections.
- Conversation, participant and message records.
- Memory records and subjects.
- Temporal information.
- Evidence spans and provenance.
- Memory derivation and semantic relationships.
- Lifecycle and evidence states.
- Scope, audience, permissions and restrictions.
- Identity boundaries and corrections.
- Deletion, revocation and re-import safeguards.
- Backup, restore, migration and validation requirements.
- Failure handling, performance and evaluation requirements.

This is a design specification. It does not establish that the proposed model is implemented or that any proposed field exists in the live application.

1.1 Authority hierarchy

The intended six-document target structure has distinct responsibilities:

1. "docs/README.md" explains the documentation structure and current project position.
2. "docs/personal-memory-architecture.md" defines product intent, principles, capabilities and system boundaries.
3. This document defines the proposed record structures, data relationships and technical validation rules.
4. "docs/personal-memory-build-plan.md" defines implementation stages, acceptance criteria, approvals and verified progress.
5. "docs/personal-memory-research-review.md" records supporting research and its relevance to Mopapa.
6. "docs/personal-memory-evaluation.md" defines the evaluation approach and retained Ask regression material.

Supporting or historical documents may explain why a decision was made. They must not create competing field definitions or override this specification.

Where a supporting document conflicts with this specification, this specification governs the proposed record model until the supporting document is reconciled or retired.

1.2 Explicit non-authorisations

This document does not authorise:

- Production JavaScript changes.
- Creation or import of non-empty conversation, message, memory, source or relationship records without the relevant stage approval.
- A storage-key change.
- IndexedDB migration.
- External AI processing or hosted inference.
- Paid APIs, subscriptions or recurring dependencies.
- Cloud synchronisation or mandatory accounts.
- Automatic access to other applications.
- A new persistent collection beyond the five specified here.
- Replacement of manual entries.
- Replacement of deterministic Ask.
- A wholesale application rewrite.

Each implementation stage requires its own explicit approval under the build plan.

---

2. Core data principles

The model must preserve the following distinctions.

1. Original conversation evidence is not an extracted memory.
2. A message author is not necessarily the person discussed.
3. A quoted speaker is not necessarily the message author.
4. Import origin is not authorship.
5. A subject label is not proof of identity.
6. A candidate is not an accepted memory.
7. Memory lifecycle and evidence state are independent.
8. A memory's validity period is separate from when Mopapa recorded it.
9. A newer statement does not automatically supersede an older statement.
10. Similar wording does not prove two records have the same source.
11. Missing or unknown permission does not grant permission.
12. Derived information must not gain broader permissions than its sources.
13. Deletion and revocation must be considered across dependent information.
14. Search indexes, summaries and caches are not authoritative evidence.
15. Original evidence must remain inspectable and must not be silently rewritten during extraction.
16. Unknown information must remain unknown. The system must not invent dates, identities, attribution or certainty.
17. A memory must be traceable to the evidence and interpretation from which it was produced.

---

3. Collections and data ownership

3.1 Existing application domains

The current application has four existing top-level data domains:

- "entries"
- "learned"
- "customRooms"
- "ask"

These remain distinct from the proposed personal-memory model.

In particular, manually saved entries must not be silently converted into extracted memories or merged with them. Existing manual-entry behaviour must remain available.

3.2 Five proposed additional collections

The proposed model adds exactly five top-level collections:

- "conversations"
- "messages"
- "memories"
- "memorySources"
- "memoryRelations"

The proposed logical dataset is:

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

This structure represents the current Stage 1 live schema foundation. Schema version 2 is active, but all five additional collections must remain empty until their respective record-validation and functionality stages have been approved and implemented.

### Stage 1 empty-collection restriction

The Stage 1 schema-v2 migration introduces the five collections as empty arrays only.

Stage 1 does not accept or create conversation, message, memory, source or relation records. A schema-v2 dataset with a missing collection, a non-array collection or any non-empty proposed collection is invalid and must be preserved as recovery data rather than partially accepted.

Record-level validation and non-empty collection support are introduced only through their separately approved later stages.

3.3 No additional collection is approved

The following are not approved as additional persistent collections:

- An import ledger.
- A global identity collection.
- A separate derivation-dependency collection.
- A persistent search-index collection.
- A deletion-suppression collection.

Derivation dependencies are embedded in memory records. Participants are embedded in conversations. Quoted-speaker annotations are embedded in messages. Subjects are embedded in memories.

Re-import suppression remains a required design capability, but its safe implementation has not been approved. It must not be used to justify an unapproved sixth collection or the retention of deleted personal content.

3.4 Data ownership

- "conversations" owns conversation metadata and embedded participant records.
- "messages" owns original message content and embedded quoted-speaker annotations.
- "memories" owns extracted memory claims, subjects, temporal data, governance and derivation metadata.
- "memorySources" owns direct links between memories and original message evidence.
- "memoryRelations" owns semantic relationships between memory records.

A record must not duplicate another collection's authoritative content merely for convenience.

---

4. Shared record conventions

4.1 Identifiers

New records require stable string identifiers.

Proposed readable prefixes are:

- "con_" for conversations.
- "par_" for participants.
- "msg_" for messages.
- "mem_" for memories.
- "src_" for provenance records.
- "rel_" for semantic relationships.

These are examples, not a final identifier-generation algorithm.

Requirements:

- IDs must not depend on array position.
- IDs must not depend on display names.
- IDs must be unique within their relevant collection or embedded parent.
- Generated IDs must be checked for collisions.
- Original source identifiers must be stored separately from Mopapa-generated IDs.
- The generator must not require a paid or hosted service.

The exact generator must be reviewed against the existing identifier implementation before development.

4.2 Timestamps and dates

Message timestamps must preserve the distinction between the source value and any normalised interpretation.

A message timestamp uses these fields:

- "originalTimestamp": The timestamp value supplied by the source, retained without modification. It may be a string, number or null.
- "timestamp": A normalised ISO 8601 timestamp with an explicit timezone or UTC designator, or null when safe normalisation is not possible.
- "timestampPrecision": The precision actually supplied: "year", "month", "day", "minute", "second", "millisecond" or "unknown".
- "sourceTimezone": The timezone or offset explicitly supplied by the source, or null when absent.
- "timestampStatus": "normalised", "unknown", "invalid" or "ambiguous".
- "receivedAt": The UTC time Mopapa received or imported the message. It is separate from the original source timestamp and must not be used as a substitute for it.

Rules:

- Never overwrite or discard the original source timestamp when normalising it.
- Do not invent missing days, times, seconds, milliseconds or timezone offsets.
- An absent source timestamp has originalTimestamp null, timestamp null and status "unknown".
- An invalid or ambiguous source timestamp remains preserved in originalTimestamp. Its normalised timestamp must be null.
- Preserve the precision supplied by the source. Do not imply millisecond precision merely because a normalised ISO value contains milliseconds.
- Preserve an explicitly supplied timezone or offset in sourceTimezone.
- A timestamp without a timezone must not be silently treated as UTC.
- Receipt time is not a substitute for original message time.
- Original event time, message time, import receipt time, record creation time and update time remain distinct.
- Date-only values and partial dates remain at their supplied precision.
- Invalid timestamps must not be silently corrected or normalised into a different date.
- Ordering must use source sequence as the primary ordering mechanism. Timestamps may provide temporal context but must not override a reliable source sequence.

4.3 Null and optional values

- Use "null" for a defined field whose value is genuinely unknown.
- Omit a field only where the specification explicitly makes it optional.
- Do not use empty strings as substitutes for unknown values.
- Missing data in an older import must not be interpreted as permission, confirmation or evidence.

4.4 Original and derived data

Original data includes source message text, source-provided timestamps, source identifiers, participant identifiers and original role information.

Derived data includes extracted claims, categories, subjects, temporal interpretations, evidence assessments, relationships, governance interpretations and retrieval representations.

Derived data must remain traceable to its source and correctable without rewriting the original message.

---

5. Conversation records and participants

5.1 Conversation record

A conversation groups related messages and conversation-local participants.

Illustrative structure:

{
  "id": "con_example001",
  "title": "Work and plans",
  "origin": {
    "type": "mopapa_native",
    "sourceId": null,
    "label": "Created in Mopapa"
  },
  "status": "active",
  "participants": [],
  "createdAt": null,
  "updatedAt": null,
  "receivedAt": "2026-11-20T09:30:00.000Z",
  "governance": {}
}

Field| Requirement| Rule
"id"| Required| Unique Mopapa conversation ID
"title"| Optional or null| Maximum 200 characters
"origin"| Required| Source and import-origin metadata
"origin.type"| Required| "mopapa_native", "user_supplied", "file_import" or "other"
"origin.sourceId"| Optional or null| Original stable source ID, if available
"origin.label"| Optional or null| Human-readable label, maximum 100 characters
"status"| Required| "active" or "archived"
"participants"| Required| Embedded conversation-local participants
"createdAt"| Required, nullable| Original creation time, if known
"updatedAt"| Required, nullable| Latest known original activity time
"receivedAt"| Required| Time received by Mopapa
"governance"| Required| Applicable scope, audience, permissions and restrictions

Rules:

- Participant IDs must be unique within their conversation.
- A participant ID is not a global identity.
- A conversation must not store its complete message history in one text field.
- Message order must be established through message sequence and source timestamps, not array position.
- Conversation deletion is an operation, not a status value.
- A completed deletion must process dependent records under the approved deletion policy.

5.2 Participant records

Participants are embedded in their parent conversation.

Illustrative structure:

{
  "id": "par_example001",
  "sourceParticipantId": "source_user_123",
  "kind": "user",
  "displayName": "User",
  "identityStatus": "unresolved",
  "identityKey": null,
  "identityHistory": []
}

Field| Requirement| Rule
"id"| Required| Unique within the parent conversation
"sourceParticipantId"| Optional or null| Original source identifier, if supplied
"kind"| Required| "user", "assistant", "third_party", "system" or "unknown"
"displayName"| Optional or null| Maximum 200 characters
"identityStatus"| Required| "unresolved", "ambiguous" or "unknown" in the initial model
"identityKey"| Required, null initially| Must remain null under the initial identity boundary
"identityHistory"| Required| Embedded correction history; initially empty

Rules:

- Participants with the same display name must not automatically be merged.
- A person mentioned in a message is not automatically a participant.
- Identity must not be inferred from writing style.
- Initial identity handling is conversation-local.
- Global identity resolution and cross-conversation matching are deferred.
- Corrections must be explicit, traceable and reversible.
- A correction must trigger reassessment of dependent memories and relationships.

The initial model must not use a populated global "identityKey" or a "resolved" state to imply a global identity system that has not been approved.

---

6. Message records, authorship and quoted speakers

6.1 Message record

Messages preserve original statements.

Illustrative structure:

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
  "originalTimestamp": "2026-11-20T09:15+00:00",
  "timestamp": "2026-11-20T09:15:00.000Z",
  "timestampPrecision": "minute",
  "sourceTimezone": "+00:00",
  "timestampStatus": "normalised",
  "receivedAt": "2026-11-20T09:30:00.000Z",
  "origin": {
    "type": "mopapa_native",
    "sourceConversationId": null,
    "sourceMessageId": null
  },
  "quotedSpeakers": [],
  "governance": {}
}

Field| Requirement| Rule
"id"| Required| Unique Mopapa message ID
"conversationId"| Required| Must reference an existing conversation
"sequence"| Required| Non-negative integer, unique within conversation
"role"| Required, nullable| Original source role preserved verbatim as a string; null only when the source supplies no role
"author"| Required| Explicit author attribution, independently represented from source role
"text"| Required| Original, non-empty, unmodified text
"originalTimestamp"| Required, nullable| Exact source timestamp value, retained without normalisation
"timestamp"| Required, nullable| Normalised ISO 8601 timestamp with explicit timezone or UTC designator; null when safe normalisation is not possible
"timestampPrecision"| Required| Precision actually supplied by the source: "year", "month", "day", "minute", "second", "millisecond" or "unknown"
"sourceTimezone"| Required, nullable| Explicit source timezone or offset; null when absent
"timestampStatus"| Required| "normalised", "unknown", "invalid" or "ambiguous"
"receivedAt"| Required| UTC time received or imported by Mopapa
"origin"| Required| Source and import-origin metadata
"origin.type"| Required| "mopapa_native", "user_supplied", "file_import" or "other"
"origin.sourceConversationId"| Required, nullable| Original source conversation identifier; null when unavailable or not applicable
"origin.sourceMessageId"| Required, nullable| Original source message identifier; null when unavailable or not applicable
"quotedSpeakers"| Required| Embedded quoted-speaker annotations
"governance"| Required| Applicable scope, audience, permissions and restrictions

Rules:

- The message's "originalTimestamp" must preserve the source value without modification.
- The message's "timestamp" is a separate normalised interpretation, not a replacement for the original value.
- The "role" field preserves the source-provided role value. It is not a closed enumeration and must not discard an unsupported source role.
- The "author" field represents attribution separately from the source role.
- "origin.sourceConversationId" must identify the same source conversation as the parent conversation's "origin.sourceId" when both are available.
- Source identifiers must remain distinct from Mopapa-generated record identifiers.
- For manual records or sources without stable identifiers, the applicable source identifier fields remain null rather than being invented.
- A source identifier must not be fabricated from message text, timestamps, participant names or array position.

6.2 Author representation

The source role and the actual author are separate fields.

"role" preserves the original source-provided role value exactly as supplied. It is a raw source value, not a closed Mopapa enumeration. It may contain a recognised role, an unsupported role or null when the source provides no role.

"author" identifies the person or system responsible for the message where the source establishes that information. It is represented independently and must not be inferred solely from the source role.

Preserving an unsupported source role does not mean accepting an unsupported author kind or attribution value. The source role remains intact while the author is represented using the defined author model or left unknown.

The proposed author kinds are:

- "participant"
- "system"
- "unknown"

The attribution classes are:

- "user"
- "assistant"
- "third_party"
- "unknown"

A participant author uses:

{
  "kind": "participant",
  "participantId": "par_example001",
  "attribution": "user"
}

A system author uses:

{
  "kind": "system",
  "participantId": null,
  "attribution": "assistant"
}

An unknown author uses:

{
  "kind": "unknown",
  "participantId": null,
  "attribution": "unknown"
}

Source-role mapping requirements:

| Source role | Author handling |
|---|---|
| "user" | Map to a conversation-local participant with "user" attribution only when the source establishes the author. Otherwise use unknown attribution. |
| "assistant" | Map to a conversation-local participant with "assistant" attribution when the source establishes that participant. Do not confuse an assistant participant with a system-originated message. |
| "system" | Use the system author representation where the source establishes a system-originated message. |
| Any other source role | Preserve the exact source role value. Use a known participant with "third_party" attribution only where the source establishes that identity. Otherwise use unknown attribution. |
| No source role | Preserve null. Determine author attribution independently; do not invent a role. |

The source role must not be rewritten or replaced with a normalised value. Any future source-specific normalisation must be stored separately and must not replace the original role.

Validation requirements:

- A participant author must reference an existing participant in the same conversation.
- A system author must have a null participant reference and assistant attribution.
- An unknown author must have a null participant reference and unknown attribution.
- Unsupported author kinds must be rejected.
- A participant reference belonging to another conversation must be rejected.
- A source role must not be rewritten to make it agree with an assumed author.
- Where source role and author information contradict each other, preserve the source role and retain unresolved authorship or reject the affected record. Never guess.
- Import origin must never be used as an authorship value.
- An imported message may still have been written by the user.
- A person mentioned in a message is not automatically its author or a conversation participant.
- Author attribution must not be inferred from writing style or message wording.

6.3 Message invariants

- Original message text must not be rewritten during extraction.
- Each message belongs to exactly one existing conversation.
- Sequence numbers must be unique within their conversation.
- Message ordering must be deterministic.
- Unknown authors remain unknown.
- Assistant statements must not automatically become user facts.
- A message's original timestamp remains separate from its receipt time.
- Original source identifiers remain distinct from Mopapa identifiers.

6.4 Quoted-speaker annotations

Quoted-speaker annotations are embedded in the message. They represent attribution within a message and must remain separate from message authorship and memory subjects.

Illustrative structure:

{
  "id": "quote_example001",
  "participantId": null,
  "speakerLabel": "my manager",
  "attribution": "third_party",
  "textStart": 0,
  "textEnd": 32,
  "status": "unresolved",
  "quotationType": "reported_speech",
  "parentQuoteId": null
}

Required fields:

- "id": Unique within its message.
- "participantId": Existing participant reference or null.
- "speakerLabel": Descriptive source label or null, maximum 200 characters.
- "attribution": "user", "assistant", "third_party" or "unknown".
- "textStart": Inclusive UTF-16 start offset or null.
- "textEnd": Exclusive UTF-16 end offset or null.
- "status": "resolved", "unresolved", "ambiguous" or "unknown".
- "quotationType": "direct_quote", "reported_speech", "paraphrase" or "uncertain".
- "parentQuoteId": Existing quoted-speaker annotation ID or null when the quotation is not nested.

Quotation types:

- "direct_quote": The original message explicitly quotes the represented speaker's words.
- "reported_speech": The author reports what another person said without necessarily quoting exact words.
- "paraphrase": The author restates another person's position in their own wording.
- "uncertain": The source does not establish whether the statement is a quotation, report or paraphrase.

Rules:

- A quoted speaker is not automatically the author of the message.
- A quoted speaker is not automatically a conversation participant.
- A speaker label does not establish identity.
- A quoted-speaker participant reference, when present, must resolve within the exact source message's conversation.
- Unresolved or ambiguous speakers must not be assigned by guesswork.
- A direct quotation is evidence that the original message contains the quotation, not independent proof that the quoted person made the statement.
- Reported speech and paraphrases must not be represented as exact quotations.
- Quoted text must be located in the original, unchanged message text where a reliable span exists.
- Any explicit source-text correction requires affected offsets to be revalidated.
- A quoted speaker's statement must not be treated as direct communication with Mopapa.

The canonical offset convention is defined in Section 8. Where a reliable span is unavailable, use the explicit whole-message evidence representation rather than inventing offsets.

Nested quotations must not flatten multiple speakers into one attribution. If the attribution chain cannot be represented reliably, retain the report with unresolved attribution.

Nested quotation representation:

- A nested quotation references its immediate parent annotation through "parentQuoteId".
- The parent annotation must exist within the same message.
- A quotation cannot reference itself or create a parent-child cycle.
- Where both parent and child have reliable text spans, the child span must be contained within the parent span.
- Separate nested speakers must remain separate annotations.
- A nested speaker must not inherit the parent's identity or attribution.
- If the source does not establish the nesting or speaker reliably, preserve the original message and mark the affected attribution unresolved.
- A missing parent reference must not be interpreted as proof that a quotation is not nested.
- Original message text must remain unchanged. Annotation offsets must continue to use the canonical UTF-16 convention.

Nested quotations, compound claims and conflicting attribution require dedicated evaluation fixtures before implementation.

---

7. Memory records and subjects

7.1 Memory record

A memory is an independently retrievable representation derived from original evidence or, where explicitly permitted, other memories.

Illustrative structure:

{
  "id": "mem_example001",
  "type": "semantic",
  "category": "personal_fact",
  "content": "The user works at Company B.",
  "subjects": [],
  "lifecycleState": "candidate",
  "evidenceState": "unverified",
  "temporal": {
    "timeStatus": "unknown",
    "validFrom": null,
    "validTo": null
  },
  "recordedAt": "2026-11-20T09:35:00.000Z",
  "createdAt": "2026-11-20T09:35:00.000Z",
  "updatedAt": "2026-11-20T09:35:00.000Z",
  "governance": {},
  "derivation": {
    "kind": "direct",
    "method": "deterministic_extraction",
    "sourceMemoryIds": [],
    "createdAt": "2026-11-20T09:35:00.000Z"
  },
  "revision": 1
}

Field| Requirement| Rule
"id"| Required| Unique Mopapa memory ID
"type"| Required| "episodic", "semantic", "relational", "procedural" or "working"
"category"| Required| Defined category, "other" or "unknown"
"content"| Required| Non-empty claim or representation; maximum awaits measurement
"subjects"| Required| Embedded subject records; may be empty only when genuinely unknown
"lifecycleState"| Required| One permitted lifecycle state
"evidenceState"| Required| One permitted evidence state
"temporal"| Required| Canonical temporal object
"recordedAt"| Required| Time Mopapa recorded the memory
"createdAt"| Required| Record creation time
"updatedAt"| Required| Most recent record modification
"governance"| Required| Scope, audience, permissions and restrictions
"derivation"| Required| Canonical derivation metadata
"revision"| Required| Positive integer, incremented on meaningful edit

Every memory must contain a "derivation" object. Direct evidence and memory-to-memory derivation are different relationships and must not be conflated.

7.2 Memory types

- "episodic": A specific event or experience.
- "semantic": A fact, preference or general piece of knowledge.
- "relational": Information about a relationship between subjects.
- "procedural": A method, routine or way of doing something.
- "working": Temporary information relevant to an active task or context.

Procedural memory must not override user intent or application safety rules.

Working memory must have an explicit expiry or review policy before implementation. It must not become permanent merely because it was not cleaned up.

7.3 Categories

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

Type and category are separate dimensions. For example, a preference may be semantic and an event may be episodic.

The category list may be extended only through a documented decision and corresponding validation and evaluation updates.

7.4 Subjects

Subjects are embedded in memories.

Illustrative structure:

{
  "id": "sub_example001",
  "kind": "person",
  "label": "User",
  "identityKey": null,
  "attribution": "user",
  "identityStatus": "unresolved"
}

Subject fields:

- "id": unique within the parent memory.
- "kind": "person", "organisation", "place", "event", "object", "topic" or "unknown".
- "label": required, maximum 200 characters.
- "identityKey": null under the initial identity boundary.
- "attribution": "user", "assistant", "third_party" or "unknown".
- "identityStatus": "unresolved", "ambiguous" or "unknown" in the initial model.

Subject attribution describes who or what the memory concerns. It does not describe who made the statement.

Rules:

- A subject label is not proof of identity.
- Multiple subjects may be present.
- A subject may be unknown.
- Global identity resolution is deferred.
- Subject corrections must trigger reassessment of affected relationships and retrieval eligibility.

7.5 Confidence

Do not introduce an arbitrary numerical confidence score.

Evidence quality, attribution, uncertainty and review status must be represented explicitly. A numerical score may be considered only after its meaning, calibration and evaluation method have been defined and tested.

---

8. Canonical temporal representation and evidence spans

8.1 Temporal object

Every memory uses one "temporal" object.

Canonical structure:

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

Each endpoint is either "null" or an object containing:

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

- Exact instants use ISO 8601 with an explicit timezone or UTC designator.
- Date-only information remains a date-only value.
- A month or year must not be converted into an invented day.
- Unknown endpoints remain "null".
- Approximate information must not be represented as an exact instant.
- "known_interval" requires both endpoints.
- "known_start" requires a start endpoint.
- "known_end" requires an end endpoint.
- "unknown" requires both endpoints to be "null".
- Endpoint ordering must be validated when endpoints are comparable.
- Invalid or contradictory temporal information must not be silently normalised.

This structure replaces earlier timestamp-only validity fields.

Message time, receipt time, record creation time, update time and memory recording time remain separate concepts.

8.2 Canonical evidence offset convention

All offsets into original message text use zero-based UTF-16 code units.

- Start offsets are inclusive.
- End offsets are exclusive.
- The same convention must be used when creating, validating, highlighting, exporting and restoring evidence references.

A located span has this structure:

{
  "kind": "span",
  "textStart": 0,
  "textEnd": 24
}

A whole-message reference must be explicit:

{
  "kind": "whole_message"
}

Rules for a located span:

- Both offsets must be integers.
- Start must be non-negative.
- End must be greater than start.
- End must not exceed the JavaScript string length of the original message.
- The span must point into the original, unchanged text.
- Invalid spans must be rejected or explicitly reviewed.
- Offsets must never be silently clamped.
- Whole-message evidence must never be inferred from a missing span.

Tests must include emoji, surrogate pairs, combining characters and other non-ASCII text.

---

9. Provenance records

9.1 Canonical structure

The "memorySources" collection links a memory to original message evidence.

Illustrative structure:

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

Every provenance record requires:

- A unique provenance ID.
- An existing memory ID.
- An existing message ID.
- One permitted provenance relationship.
- One or more explicit evidence references.
- Source attribution.
- A quoted-speaker reference or "null".
- A creation timestamp.

Permitted provenance relationships:

- "supports"
- "refutes"
- "qualifies"
- "context_only"

Permitted source attribution values:

- "user"
- "assistant"
- "third_party"
- "unknown"

Import origin is not an attribution value.

9.2 Provenance rules

- Every provenance record must reference an existing memory and message.
- A non-null "quotedSpeakerId" must reference an annotation in that exact source message.
- Evidence references must use the canonical Section 8 structures.
- One memory/message pair has one provenance record.
- That record may contain multiple non-overlapping evidence spans.
- If materially different parts of one message have different evidence relationships, use separate independently assessable memories rather than an ambiguous duplicate link.
- One message may support or qualify multiple memories.
- A memory may have multiple provenance records.
- A provenance link does not automatically establish that the complete memory is supported.
- Provenance attribution must be consistent with the original message and any explicitly resolved quoted-speaker annotation.
- A deleted or revoked source must not continue to support ordinary retrieval.

The relationship describes how the source relates to the memory claim. It does not by itself establish truth.

---

10. Memory derivation and semantic relationships

10.1 Derivation metadata

Every memory contains a "derivation" object.

Canonical direct-memory structure:

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

- "direct" memories derive from original message evidence and have no source memory IDs.
- "derived" memories reference one or more existing source memories.
- "user_corrected" memories retain traceable references to the prior interpretation and evidence for the correction.
- "consolidated" memories reference every source memory materially used in the consolidation.
- Source memory references must not be replaced by copied text or a summary.
- Derivation dependencies must be traversable in both directions.
- A derived memory must not become independent merely because it has been rewritten or summarised.
- Dependency cycles are invalid.
- Missing or malformed dependencies block affected retrieval and relevant destructive operations.
- Derivation metadata must not grant broader permissions than the source material permits.

The exact permitted "method" values may expand only after the relevant extraction methods are evaluated. This field does not approve external AI or paid inference.

Derivation metadata is embedded in "memories". It does not create another collection.

10.2 Semantic memory relationships

The "memoryRelations" collection is reserved for semantic relationships between memories.

Permitted types:

- "supersedes"
- "contradicts"
- "related"

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
- "evidenceSourceIds" must reference existing "memorySources" IDs, not message IDs.
- Supersession requires evidence that the newer memory updates the same underlying fact.
- A later timestamp alone is insufficient.
- The older memory remains available as historical information where permitted.
- Contradictory memories must not be silently resolved.
- Related memories require an identifiable reason.
- Supersession cycles are invalid.
- Deletion or revocation of relationship evidence requires reassessment of the relationship.

A semantic relationship is not a derivation dependency. The two must remain separate.

10.3 Derived indexes and retrieval representations

Search indexes, retrieval indexes, summaries, cached context and other derived representations are not authoritative records.

Requirements:

- They must be rebuildable from the authoritative original messages, memories, provenance and applicable relationship records.
- Rebuilding must never modify or replace original messages or authoritative memory records.
- A rebuild must not make partially constructed or inconsistent index data available as a complete result.
- An interrupted or failed rebuild must leave authoritative data intact and preserve either the previous valid index or a safely unavailable index state.
- A completed rebuild must verify that every indexed record retains valid references to its authoritative sources.
- Indexes must not retain deleted or revoked information in a form that remains available to ordinary retrieval.
- Scope, audience, permissions, restrictions, attribution and temporal eligibility must be enforced when building and using derived representations.
- Search results and answers must retain traceable references to their supporting authoritative records.
- A stale or invalid index must not be treated as proof that a record remains valid or eligible for retrieval.

The initial model does not require a separate persistent index collection.

The exact rebuild strategy, including whether an index is held in memory or persisted, remains subject to measured performance and storage constraints.

---

11. Lifecycle and evidence states

11.1 Lifecycle states

Permitted lifecycle states:

- "candidate"
- "active"
- "historical"
- "uncertain"
- "dismissed"

Definitions:

- "candidate": extracted but not accepted as a usable memory.
- "active": accepted for possible retrieval, subject to evidence, temporal and governance checks.
- "historical": retained as previously applicable information.
- "uncertain": meaning, attribution or truth cannot currently be established.
- "dismissed": rejected by the user or an explicit review process.

Deletion is an operation, not a lifecycle state. Do not retain an ordinary memory record with a "deleted" lifecycle state as a substitute for deletion.

11.2 Evidence states

Permitted evidence states:

- "supported"
- "partially_supported"
- "unsupported"
- "disputed"
- "unverified"

Definitions:

- "supported": valid evidence supports the complete memory claim.
- "partially_supported": some parts of the claim are supported but the complete claim is not.
- "unsupported": no remaining valid evidence supports the claim.
- "disputed": evidence conflicts and has not been resolved.
- "unverified": evidence has not been adequately assessed.

11.3 Independent validation

Lifecycle and evidence state are independent dimensions.

An "active" memory is not automatically eligible to be used as an established fact. Attribution, provenance, temporal validity and governance must also permit the requested use.

A dismissed memory must not silently return to active status through ordinary extraction or re-import.

A candidate must not be treated as an accepted memory.

11.4 Lifecycle policy still requiring decisions

The exact transition history representation, candidate acceptance criteria, mandatory confirmation categories and automatic-promotion policy remain unresolved.

The initial implementation must not assume that every candidate can be promoted automatically.

---

12. Governance, scope, audience and permissions

12.1 Purpose

Governance determines whether a memory may be retrieved or used in a particular context.

Governance must be evaluated before retrieval and before information is assembled into an answer or other context.

A memory's existence in storage does not imply permission to use it.

12.2 Required principles

- Missing permission is not permission.
- Unknown scope is not unrestricted scope.
- Unknown audience does not permit disclosure.
- Explicit denial overrides an allow.
- Restrictions from multiple sources must be combined conservatively.
- Derived memories must not receive broader permissions than their source evidence permits.
- Revoked or deleted evidence must not remain usable through a derived memory.
- Restriction provenance must be retained sufficiently to explain why a use was denied.
- If a policy cannot be evaluated safely, exclude the information from that use.
- Restrictions must not be bypassed through summaries, caches, indexes, exports or alternate retrieval paths.

12.3 Proposed restriction vocabulary

The existing proposed vocabulary includes:

- "context_only"
- "no_proactive_use"
- "no_cross_context_reuse"
- "no_inference"
- "no_export"
- "explicit_denial"
- "other"
- "unknown"

A restriction may include a reason, source reference and creation timestamp. The exact field structure and validation rules must be finalised before implementation.

12.4 Permission-combination requirements

Governance must be evaluated separately for every requested use.

The proposed use permissions are:

- "directAnswer"
- "contextualAnswer"
- "proactiveSurfacing"
- "crossContextReuse"
- "inference"
- "export"

Each permission has one of three values:

- "allow"
- "deny"
- "unknown"

Missing, invalid or unknown permission must be treated as denied for the disputed use.

12.5 Scope and audience

The proposed scope types are:

- "personal"
- "conversation"
- "project"
- "topic"
- "event"
- "relationship"
- "other"
- "unknown"

Scope describes where information applies. It does not independently grant permission.

The proposed audience types are:

- "owner_only"
- "named_audience"
- "restricted_context"
- "unknown"

The initial default audience is "owner_only".

Unknown scope must not be treated as unrestricted scope. Unknown audience must not permit disclosure.

External sharing is not authorised.

12.6 Conservative policy-combination algorithm

For each requested use, a future implementation must apply the following sequence.

1. Identify the requested use.
2. Confirm that the memory exists and has valid references.
3. Identify every materially supporting source.
4. Collect applicable conversation-level, message-level and memory-level governance.
5. Collect applicable restrictions, scope, audience and relevant user instructions.
6. Evaluate the requested permission at every applicable level.
7. Check source validity, deletion and revocation status.
8. Check restrictions inherited through derived memories and relationships.
9. Return either an explicit allow or deny decision.

The combination rules are:

- Any applicable explicit denial means deny.
- Any unknown permission means deny.
- Any missing or invalid permission means deny.
- Any applicable restriction that prohibits the use means deny.
- Scope and audience must satisfy every applicable constraint.
- Every materially supporting source must be considered.
- An unrestricted source must not cancel a restriction on another materially supporting source.
- A memory-level permission must not broaden the permission of its supporting sources.
- A derived memory must not gain permissions that its source evidence does not have.

Only explicit permission at every applicable level can allow the requested use.

If governance cannot be evaluated safely, the result must be deny.

12.7 Policy-combination examples

Source A|Source B|Memory policy|Result
allow|allow|allow|Allow, if all other checks pass
allow|deny|allow|Deny
allow|unknown|allow|Deny
deny|allow|allow|Deny
allow|allow|deny|Deny
allow|allow|unknown|Deny
allow|missing|allow|Deny

The most permissive source must never determine the result.

12.8 Use-specific permission

Permission for a direct answer does not imply permission for:

- Proactive resurfacing.
- Cross-context reuse.
- Additional inference.
- Export.

Each requested use must be evaluated independently.

12.9 Restriction changes and governance failure

When a restriction is added or changed, a future implementation must:

1. Identify affected memories.
2. Identify dependent memories and relationships.
3. Recalculate permitted uses.
4. Invalidate prohibited derived indexes and cached context.
5. Prevent future retrieval for denied uses.
6. Preserve the permitted governance change history.
7. Ensure future imports do not silently remove the restriction.

If governance cannot be evaluated:

- Exclude the memory from the requested use.
- Do not pass it into answer context.
- Do not use it as an unstated premise.
- Do not expose it through a summary or alternate retrieval path.
- Do not silently weaken the restriction.

The user may be told that relevant information was excluded because its permission or scope could not be established, without unnecessarily disclosing the restricted content.

12.10 Governance decisions still requiring approval

The following implementation details remain unresolved:

- Exact stored representation of permissions at each level.
- Exact scope and audience reference rules.
- Representation and retention of governance change history.
- Treatment of user-confirmed interpretations.
- Treatment of partially revoked memories with other valid sources.
- Sensitive-information classification and handling.
- Exact interaction between restrictions and backup or export.
- Reliable invalidation of every derived index, cache and summary.

The requirements above establish conservative behaviour. They do not approve a final storage representation or implementation algorithm.

---

13. Identity and attribution boundaries

13.1 Initial identity model

The initial implementation uses conversation-local participants only.

Participant identity, quoted-speaker identity and memory subject identity remain distinct.

Global identity resolution is deferred.

Until a separately approved global identity model exists:

- Participant "identityKey" remains "null".
- Subject "identityKey" remains "null".
- No cross-conversation identity matching is permitted.
- No automatic identity merging is permitted.
- A display name is not proof of identity.
- Corrections remain conversation-local and reversible.
- Identity corrections trigger reassessment of dependent memories and relationships.

13.2 Attribution rules

The system must distinguish:

- Who authored the original message.
- Who is quoted within the message.
- Who or what the memory concerns.
- Where the message originated.
- Which source evidence supports the memory.

These concepts must not be collapsed into one author or identity field.

13.3 Correction history

Identity corrections are embedded in the relevant participant's "identityHistory".

A correction must preserve enough information to identify the previous interpretation, the corrected interpretation, the reason, the supporting source references and the time of correction.

The exact correction record structure and its retention policy require final review.

A correction must not silently overwrite original message attribution or automatically merge all records sharing a name.

13.4 Deferred identity cases

The following require explicit evaluation and decision:

- Nested quotations.
- Compound claims involving multiple people.
- Conflicting attribution.
- Ambiguous pronouns.
- Similar names.
- A participant whose identity changes or is corrected.
- A person mentioned in one conversation and appearing as a participant in another.

Until resolved, uncertainty must remain explicit.

---

14. Candidate formation and memory governance lifecycle

14.1 Separation of stages

The system must distinguish:

1. Original message preservation.
2. Candidate formation.
3. Candidate assessment.
4. Acceptance or dismissal.
5. Stored memory maintenance.
6. Retrieval eligibility.

These stages must not be collapsed into one automatic extraction-and-save operation.

14.2 Candidate formation principles

Candidate extraction must be selective and evidence-grounded.

A candidate must preserve enough information to explain what was extracted and why.

It must retain or reference:

- Original conversation and message.
- Message author.
- Quoted or reported speaker where applicable.
- Memory subject or subjects.
- Exact supporting evidence span.
- Proposed memory claim.
- Proposed memory type and category.
- Known temporal information and uncertainty.
- Applicable scope, audience and restrictions.
- Reason the information was considered potentially useful.
- Extraction and assessment outcome.

A candidate must remain distinguishable from an accepted memory.

Original messages must remain unchanged by extraction.

14.3 Candidate suitability and rejection

Potentially suitable candidate information includes:

- Stable personal preferences.
- Confirmed recurring requirements.
- Ongoing projects and commitments.
- Meaningful personal events.
- Clearly stated facts.
- Explicit corrections.
- Clearly identified relationships.
- Tasks or plans with identifiable time or completion conditions.
- Information the user explicitly asks Mopapa to remember.

Potentially unsuitable information includes:

- Greetings and ordinary conversational filler.
- Incidental wording with no apparent future value.
- One-off assistant suggestions.
- Unconfirmed interpretations.
- Hypothetical statements.
- Fictional or role-play information.
- Temporary details with no apparent future relevance.
- Ambiguous statements whose subject cannot be established.
- Information prohibited from the intended use by governance.

A candidate must be rejected or withheld from promotion when:

1. Its source cannot be identified.
2. Its evidence span is invalid.
3. Its attribution contradicts the source.
4. Its subject is incorrectly inferred.
5. It is clearly hypothetical or fictional and not explicitly intended as a real memory.
6. It is an assistant suggestion without user confirmation.
7. Its meaning is too ambiguous to express without guessing.
8. It has no valid supporting evidence.
9. Its intended use is prohibited.
10. It conflicts with an explicit dismissal or deletion decision.
11. Its extraction would require inventing dates, identities or relationships.
12. Its claim is broader than the original evidence supports.

Rejection must not modify or destroy the original source.

14.4 Candidate assessment

Candidate assessment must consider:

- Message author.
- Quoted speaker.
- Memory subject.
- Exact claim boundaries.
- Supporting, refuting and qualifying evidence.
- Temporal information and uncertainty.
- Scope and audience.
- Permissions and restrictions.
- Existing memories and possible contradictions.
- Whether the statement is hypothetical, fictional, reported or uncertain.
- Whether apparently independent evidence is genuinely independent.
- Whether the claim can be expressed without adding unsupported information.

A candidate may accurately represent what somebody said without establishing the truth of the statement itself.

For example, a user reporting that a colleague said an office would close establishes that the user reported the statement. It does not independently establish that the office will close.

A memory must preserve that distinction.

14.5 Automatic promotion boundaries

The following table defines the proposed treatment. It does not authorise automatic promotion before the relevant implementation decisions and acceptance tests are approved.

Candidate type|Proposed treatment
Explicit request to remember a clear personal fact|Eligible for promotion after validation and governance checks
Clear direct statement of a stable preference|Potentially eligible after attribution, duplication and governance checks
Clear correction of an existing memory|Requires reconciliation with the existing memory
Repeated consistent direct statements|Requires independent evidence assessment
Single incidental personal statement|Candidate only unless a defined rule establishes sufficient value
Assistant-generated suggestion|Not promotable without user confirmation
Quoted third-party statement|Candidate only unless its intended meaning and permitted use are established
Hypothetical or fictional statement|Not promotable as a real personal fact
Ambiguous statement|Review or rejection
Sensitive or restricted information|Subject to applicable governance and any mandatory review requirements

Repetition alone does not establish truth or independent corroboration.

The system must not introduce numerical confidence thresholds without a defined calibration method and evaluation evidence.

Automatic promotion must never introduce additional facts that are not established by the source.

14.6 User confirmation and dismissal

User confirmation must be distinguishable from automatic extraction.

Confirmation may establish that the user intends Mopapa to retain a particular interpretation.

It does not necessarily establish the objective truth of every claim within that interpretation.

A confirmation is a new source of evidence. It must not be represented as though the original message contained the confirmation.

Dismissal must prevent ordinary extraction from silently recreating the rejected memory.

The exact review interface, confirmation categories, suppression mechanism and retention policy remain unresolved.

14.7 Lifecycle and evidence independence

Lifecycle and evidence state remain independent.

A lifecycle transition does not automatically change evidence state, and an evidence-state change does not automatically determine lifecycle.

For example, a memory may become historical while remaining supported by its original evidence.

A supported candidate is not automatically suitable for active retrieval.

The final transition table, user review workflow and audit-history representation require explicit approval before implementation.

---

15. Retrieval eligibility and answer restrictions

15.1 Retrieval gate

A memory may be retrieved for a particular use only after evaluating:

1. Lifecycle state.
2. Evidence state.
3. Source validity and provenance.
4. Author and subject attribution.
5. Temporal validity.
6. Scope and audience.
7. Permissions and restrictions.
8. Revocation and deletion status.
9. Derivation dependencies.
10. Whether the claim is supported for the requested use.

An "active" state alone is insufficient.

15.2 Evidence-grounded use

- Retrieved memories must remain traceable to source evidence.
- Unsupported claims must not be presented as established facts.
- Partially supported claims must not be expanded beyond the supported portion.
- Disputed claims must not be silently resolved.
- Historical information must not be presented as current without temporal support.
- Assistant-generated content must not be represented as user-authored evidence.
- A memory with invalid or missing critical references must be excluded.
- Uncertain attribution must not be converted into certainty during answer generation.

15.3 Fail-closed behaviour

If provenance, identity, governance, temporal validity or dependency integrity cannot be evaluated safely, the affected memory must be excluded from the relevant retrieval.

Restrictions must be checked before context assembly, not merely after an answer has been generated.

Summaries, caches, indexes and alternate retrieval paths must obey the same restrictions.

15.4 Ask boundary

The existing deterministic Ask system remains in place.

The proposed memory model may eventually provide additional evidence to Ask, but it does not authorise replacing Ask with an LLM or hosted inference service.

Any future Ask expansion requires its own implementation stage, regression coverage and approval.

15.5 Answer outcomes

The answer layer must distinguish four possible outcomes:

- Supported answer.
- Qualified answer.
- Clarification request.
- Abstention.

A supported answer must not exceed what the selected evidence establishes.

A qualified answer must identify material uncertainty, historical context, reported information or incomplete support.

A clarification request is appropriate when multiple materially different interpretations remain plausible and the user can resolve the ambiguity.

Abstention is required when the available evidence cannot safely support the requested answer.

15.6 Abstention conditions

The system must abstain from presenting a claim as established when:

- No valid supporting evidence exists.
- The evidence does not support the requested specificity.
- The memory is unsupported.
- Material evidence remains disputed.
- Attribution is materially uncertain.
- Temporal validity cannot establish the requested current fact.
- Governance denies the requested use.
- Required permission is missing or unknown.
- The relevant evidence has been deleted or revoked.
- The answer requires an unsupported inference.
- Critical provenance or dependency references cannot be validated.

A high retrieval score or plausible answer must not override these conditions.

15.7 Evidence explanation

Where a memory-based answer is provided, the system should be able to identify the supporting source evidence.

A source reference must genuinely support the associated claim.

Citing a source that merely mentions the same subject is insufficient.

The answer layer must not manufacture certainty, attribution or temporal precision that is absent from the evidence.

---

16. Deletion, revocation and dependency handling

16.1 Dependency traversal

Deletion and revocation must traverse both:

1. Direct memory-to-message provenance through "memorySources".
2. Memory-to-memory derivation through "memories.derivation.sourceMemoryIds".

Semantic relationships in "memoryRelations" must also be reassessed when their endpoints or supporting provenance are affected.

16.2 Required reassessment

After source deletion or revocation:

- Identify all direct dependencies.
- Traverse all indirect derivation dependencies.
- Recalculate remaining valid evidence.
- Recalculate applicable permissions and restrictions.
- Reassess lifecycle and evidence states.
- Reassess affected semantic relationships.
- Invalidate affected retrieval representations.
- Remove dependent information that cannot remain valid.
- Retain a memory only when remaining permitted evidence independently supports its complete claim.

A memory must not be silently rewritten to survive deletion.

A narrower replacement claim requires an explicit, evidence-grounded correction.

16.3 Operation-specific requirements

Deleting a memory

- Remove the memory from the active dataset.
- Remove its provenance links.
- Remove its semantic relationships.
- Remove affected derived index material.
- Apply the approved re-import policy where the deletion represents a deliberate user decision.
- Do not delete original messages merely because one derived memory is deleted.

Deleting a message

- Remove the original message from the active dataset.
- Remove provenance links that reference it.
- Reassess all dependent memories.
- Reassess semantic relationships that depend on affected provenance.
- Invalidate affected retrieval representations.
- Do not claim dependent memories remain supported without checking their remaining evidence.

Deleting a conversation

- Identify affected messages and participants.
- Traverse direct and indirect memory dependencies.
- Reassess memories with independent supporting sources.
- Reassess affected relationships.
- Explain material consequences to the user before a destructive operation where the impact is not obvious.

Revocation

- Treat revocation as a permission change, not merely a status label.
- Prevent prohibited uses even if the original source remains stored.
- Propagate restrictions through derived memories.
- Invalidate affected summaries, caches and indexes.
- Reassess future imports and retrieval.

Dependent-memory reassessment

After a source is deleted or revoked, reassess every directly and indirectly dependent memory.

| Remaining evidence | Required treatment |
|---|---|
| No remaining valid evidence | Remove the memory through the deletion process. |
| Remaining evidence independently supports the complete claim | It may remain eligible after full validation and governance checks. |
| Remaining evidence supports only part of the claim | Narrow or reformulate only through an explicit, evidence-grounded correction process. |
| Remaining evidence conflicts with the claim | Reassess its evidence state and retrieval eligibility. |
| Remaining evidence has unknown permission | Exclude the memory from the affected use. |
| Remaining evidence is invalid or missing | Do not rely on it. |
| Dependency cannot be established safely | Block affected retrieval and report the unresolved state. |

A previously accepted memory does not retain its status as an established fact merely because it was accepted before its supporting evidence changed.

A deleted source must not be replaced by another source merely because the wording is similar. Alternative evidence must independently support the relevant claim.

16.4 Failure conditions

If dependency traversal encounters a cycle, missing reference, malformed record or uncertain permission, affected retrieval must fail closed.

A destructive operation must not report success until its required postconditions have been verified.

16.5 Deletion and recovery limitations

Deleting a live record does not automatically erase previously exported backups or files outside the application's control.

The application must not claim to have erased external copies it cannot access.

Recovery copies may contain information that has since been deleted or revoked. Their retention, replacement, sanitisation and restoration policy remains a blocking decision.

16.6 Deletion transaction requirements

A future deletion or revocation operation must provide:

- Atomic visibility of the primary dataset change.
- Complete dependency assessment.
- Consistent record references.
- Safe retry behaviour.
- Verified postconditions.
- Recovery from interruption.
- Fail-closed retrieval while the authoritative state is uncertain.

Before changing the active dataset, the operation must:

1. Validate the user's request.
2. Resolve the target record.
3. Identify the complete affected dependency set.
4. Validate the references needed for the operation.
5. Determine the expected changes.
6. Identify affected indexes, summaries, caches and other derived representations.
7. Identify relevant recovery copies.
8. Check storage feasibility.
9. Construct a proposed replacement dataset without modifying the active dataset.
10. Validate the proposed dataset before committing it.

The commit must:

1. Apply the prepared changes to the primary dataset.
2. Read back the stored result.
3. Verify the required deletion or revocation postconditions.
4. Verify that unrelated records remain intact.
5. Validate the resulting dataset.
6. Report completion only after the required checks pass.

The transaction boundary must be explicit.

Replacing the primary dataset does not automatically make previously exported files, recovery copies, browser backups or external copies part of the same transaction.

16.7 Failure, retry and concurrent-operation handling

If preparation fails:

- The active dataset must remain unchanged.
- The operation must not report success.
- The user must receive an accurate failure explanation.

If the primary commit fails:

- The application must inspect the actual stored state.
- A best-effort rollback must not be treated as proof of successful recovery.
- If the authoritative state is uncertain, affected retrieval must remain blocked.
- Ordinary operation must not resume until the state is safely established.

If the primary dataset commits but secondary cleanup fails, the application must distinguish:

- Primary dataset deletion.
- Retrieval and cache invalidation.
- Recovery-copy cleanup.
- Other secondary cleanup.

It must not claim that every copy has been removed while required cleanup remains incomplete.

Repeated operations must be safe:

- A completed deletion must not recreate the deleted record.
- Retrying must not delete unrelated records.
- Retrying must not create duplicate suppression metadata.
- An already absent target must not automatically be treated as proof of successful deletion.
- Repeated requests must not produce contradictory outcomes.

The implementation must eventually distinguish a retry of an existing operation from a genuinely new operation. The exact stable operation identity and persistence mechanism remain unresolved.

Concurrent operations must not overwrite one another's changes.

The implementation must detect stale dataset versions and prevent an operation prepared against an older dataset from committing over a newer valid dataset.

The exact transaction and concurrency mechanism must be selected against the existing storage architecture and measured device constraints.

16.8 Recovery-copy inventory and sanitisation

Deletion and revocation design must account for every location where affected information may remain.

This includes:

- The active dataset.
- The most recent recovery copy.
- Older retained recovery copies.
- Temporary restore or migration data.
- Exported backups created by Mopapa.
- Future indexes, caches and summaries.
- Future import staging areas.

A recovery copy containing information that has subsequently been deleted or revoked must not be treated as an ordinary safe restore source.

A future policy must explicitly select an appropriate treatment for each affected copy:

- Sanitise the copy.
- Replace it with a verified safe copy.
- Remove it.
- Retain it only under an explicitly justified and bounded policy.

The following decisions remain unresolved:

- Maximum number and age of retained recovery copies.
- Whether deletion triggers immediate sanitisation.
- Whether recovery copies are created before every write or selected operations.
- How sanitisation failures are reported.
- Whether minimal non-content deletion metadata may be retained.
- How storage quota limitations affect deletion and cleanup.

Any retained suppression metadata must avoid original message text, complete memory text, extracted summaries, sensitive quotations and unnecessary personal details.

An opaque identifier must not automatically be considered anonymous because it may remain linkable to a person or source.

Previously exported backups cannot be remotely erased by Mopapa. The application must explain that restoring an older external backup may reintroduce information unless a reliable deletion-aware reconciliation policy is available.

If reliable reconciliation cannot be established, the affected restore must be refused rather than silently treated as safe.

---

17. Conversation creation, retry safety and deletion boundaries

17.1 Native conversation creation

Stage 2 creates conversations directly within Mopapa.

Mopapa-generated conversation, participant and message identifiers are distinct from any optional external source identifiers.

Rules:

- A conversation must have a unique Mopapa-generated identifier.
- Every message must have a unique Mopapa-generated identifier.
- Message sequence values must be unique within their conversation.
- Participants are conversation-local and must not imply global identity.
- A message must reference an existing conversation.
- A message author must reference a valid conversation-local participant or an explicitly supported non-participant author representation.
- A failed save must not be reported as successful.
- Retrying the same logical creation or save operation must not silently create duplicate records.
- Identifiers for a logical operation must remain stable across its retry.
- Conflicting identifiers must be rejected rather than silently overwritten.
- Message text, sequence and authorship must not be used to invent identity or merge separate messages.

17.2 Optional future source imports

External platform imports are not part of the initial Stage 2 implementation.

Future import adapters may map external source identifiers into the existing origin fields.

Any future adapter must define:

- Its supported source format and version.
- Source conversation and message identifier handling.
- Participant and author mapping.
- Timestamp and quotation preservation.
- Duplicate and retry behaviour.
- Unsupported-field handling.
- Failure and interruption behaviour.

An adapter must not silently discard unsupported source content or claim reliable duplicate detection where the source does not provide sufficient identity information.

Each adapter requires separate design, fixtures, testing and approval.

17.3 Deletion boundary

Stage 2 does not implement conversation or message deletion.

Deletion remains deferred to Stage 4, where the full effects on derived memories, provenance, relationships, backups and recovery copies can be implemented together.

Before deletion is implemented, Stage 4 must define:

- How deliberate deletion is distinguished from ordinary repeated information.
- How older backups and recovery copies are handled.
- How deleted information is prevented from returning through restore or import.
- How suppression works without retaining deleted message text.
- Whether an existing collection can safely represent the necessary suppression metadata without compromising its data ownership.
- How incomplete cleanup blocks affected retrieval and reports failure.
- How deliberate user-authorised reintroduction differs from ordinary restoration or repeated information.

No sixth collection, persistent import ledger or alternative suppression mechanism is approved by this section.

Raw deleted content must not be retained merely to make future suppression easier.

17.4 Dismissal and explicit reintroduction

A dismissed candidate must not silently return as an accepted memory.

A deliberate user instruction to reintroduce previously deleted information must be distinguishable from ordinary repeated information.

The confirmation, retention and audit behaviour for explicit reintroduction remains a Stage 4 decision.

---

18. Backup, restore and migration

18.1 Version boundaries

The live application uses schema version 2 and the existing "mopapa.v1" storage key.

Stage 1 introduced the five personal-memory collections as empty arrays. Non-empty records remain unsupported until their relevant implementation stages are separately approved and completed.

Application schema version and backup format version are separate concepts. A future backup envelope must identify them separately.

18.2 Backup requirements

A future complete backup must:

- Include every required data domain, including empty collections.
- Identify the application schema version.
- Identify the backup format version.
- Record export time.
- Record app version where available.
- Distinguish complete and scoped exports.
- Identify excluded data where applicable.
- Avoid unnecessary device, account or personal identifiers.
- Validate its structure before restore.

An integrity digest or checksum must not be described as encryption or proof of authenticity unless it actually provides those properties.

The exact backup envelope and integrity mechanism remain unresolved.

18.3 Restore requirements

The default restore is complete, not silently partial.

Before replacing active data:

- Validate the backup envelope.
- Validate supported schema and format versions.
- Validate every required collection.
- Validate every record.
- Validate all cross-collection references.
- Validate provenance, derivation and semantic relationships.
- Validate governance and deletion-related constraints.
- Check size and storage feasibility.
- Secure and verify the required recovery copy.

Malformed records or broken references must not be silently discarded while reporting a complete successful restore.

An older application must refuse to write a newer unsupported schema as though it were compatible.

18.4 Migration preflight

A future migration must:

1. Inventory the complete source dataset.
2. Validate the existing schema and all existing domains.
3. Preserve "entries", "learned", "customRooms" and "ask".
4. Check storage capacity and relevant conflicts.
5. Check that the application can create and verify a recovery copy.
6. Establish that the source dataset has not changed during preparation.
7. Refuse to proceed if required preconditions cannot be secured.

18.5 Candidate construction and commit

A future migration must:

1. Construct the candidate dataset without modifying the active dataset.
2. Initialise all five proposed collections.
3. Validate all records and cross-collection references.
4. Validate provenance, derivation, relationships and governance.
5. Preserve every existing manual entry and learning domain.
6. Check the candidate's serialised size and storage feasibility.
7. Create and verify a distinct recovery copy.
8. Commit only if the source remains unchanged and storage is writable.
9. Read back the committed dataset.
10. Parse and validate the read-back dataset.
11. Update in-memory state only after verified success.

18.6 Failure and rollback

If a write or read-back fails:

- Inspect the actual stored state.
- Do not assume rollback succeeded.
- Do not report success.
- Do not continue writes if the active state is uncertain.
- Preserve the recovery copy.
- Restore or recover only through a verified procedure.
- Ensure interrupted operations cannot leave a mixed or partially migrated dataset reported as valid.

The current storage layer's best-effort rollback must not be described as an absolute database transaction.

18.7 Post-migration verification

A future migration must verify:

- All five new collections.
- All cross-collection references.
- Existing manual entries.
- Existing learned data.
- Custom rooms.
- Ask state and regression behaviour.
- Backup export.
- Restore validation.
- Persistence after application reload.
- Recovery behaviour.

18.8 Deletion-aware backup policy

Restoring an older backup must not silently undo a later deletion, dismissal or revocation.

The reconciliation mechanism, recovery-copy sanitisation and failure policy remain unresolved. If reliable reconciliation cannot be provided, the restore must be refused or restricted under an explicitly approved policy.

18.9 Schema compatibility requirements

Schema compatibility describes whether an application can safely understand and process a dataset.

The schema version does not establish that the dataset is valid. Every supported dataset must still pass complete structural, record, reference, provenance, temporal, governance and deletion-related validation.

The current and proposed schema generations are:

Schema version| Meaning| Current production support
Unversioned / version 0| Supported legacy form of the existing application data| Accepted through the implemented migration to version 2
Version 1| Previous four-domain application schema| Accepted through the implemented migration to version 2
Version 2| Current production schema containing the five additional personal-memory collections as empty arrays| Supported, subject to the implemented empty-collection validation
Version 3| Proposed Stage 2 schema supporting non-empty conversations and messages| Not yet implemented or supported
Version 4 or later| Future schema not yet defined| Unsupported until separately designed and implemented

The intended application-to-backup schema compatibility is:

Application schema| Backup schema 0| Backup schema 1| Backup schema 2| Backup schema 3| Backup schema 4+
Version 2| Accept through the implemented migration| Accept through the implemented migration| Accept if fully supported| Reject safely| Reject safely
Version 3| Accept only through explicitly implemented and tested migrations| Accept only through explicitly implemented and tested migrations| Accept only through explicitly implemented and tested migrations| Accept if fully supported| Reject safely

This matrix distinguishes current production capability from proposed Stage 2 capability.

Schema version 2 is active in production. Its five additional collections must remain empty.

Migrations from schema versions 0 and 1 to version 2 are implemented and supported.

Stage 2 is expected to introduce schema version 3. The version 2 to version 3 migration must be explicitly designed, implemented and tested before non-empty conversation or message records can be accepted.

Version 3 compatibility with older backups is a requirement for the future implementation, not a claim about current production capability.

No future application may accept a backup merely because its schema version is numerically older or equal. It must validate the complete backup and establish that the required migration path is explicitly supported.

Schema version and backup format version must remain separate:

- Schema version identifies the structure of application data.
- Backup format version identifies the outer backup representation, envelope and integrity metadata.
- A backup format version must not be substituted for the application schema version.
- No final backup envelope or backup format version has been approved.
- Backup-format compatibility requires a separate explicit design before implementation.

18.10 Protection against older applications and unsupported data

An application encountering a primary dataset with a schema version it does not support must:

1. Refuse to reconstruct the dataset as an older schema.
2. Refuse ordinary editing and saving against the unsupported dataset.
3. Preserve the original stored data without modifying or discarding unknown collections.
4. Explain that a compatible newer application version is required.
5. Avoid automatic downgrade or conversion by dropping unsupported fields.
6. Offer a recovery route only where it can be performed without modifying or endangering the unsupported primary data.

An older application must never overwrite a newer primary dataset simply because its loader cannot understand that dataset.

The same protection applies when importing a backup:

- A newer unsupported schema must be rejected before the active dataset is modified.
- Unknown collections must not be silently discarded.
- Unsupported fields must not be silently removed during normalisation.
- A failed compatibility check must not change the active dataset.
- The user must receive an accurate explanation that the backup requires a compatible application version.

A version number alone is not proof of compatibility or validity.

Validation must also cover:

- Required top-level fields and collections.
- Record shapes and field types.
- Identifier uniqueness.
- Reference integrity.
- Collection and size limits.
- Lifecycle and evidence-state values.
- Temporal values and precision.
- Governance and use restrictions.
- Deletion, dismissal and revocation constraints.
- Any additional invariants required by the declared schema.

A backup declaring schema version 2 but containing incomplete, malformed or internally inconsistent data must be rejected as an invalid backup.

No automatic downgrade is permitted.

Any future downgrade proposal would require a separate specification identifying every field and capability that would be lost, a tested conversion strategy, recovery safeguards and explicit informed user approval. It must not be introduced as an ordinary restore or migration option.

---

19. Whole-dataset validation and failure handling

19.1 Identifier integrity

A valid dataset requires:

- Every record ID to be non-empty.
- IDs to be unique within the relevant collection or embedded parent.
- Every reference to resolve to the correct record type.
- Participant references to resolve within their parent conversation.
- Message sequence numbers to be unique within their conversation.
- No reference to depend on array position.

19.2 Conversation and message integrity

- Every message references exactly one existing conversation.
- Participant references resolve within that conversation.
- Quoted-speaker references resolve within that conversation and exact message.
- Original message text remains unchanged by extraction.
- Message ordering is deterministic.
- Source identifiers remain distinct from Mopapa identifiers.

19.3 Memory and provenance integrity

- Every provenance record references an existing memory and message.
- Every evidence reference is explicit and valid.
- Every supported memory has sufficient valid evidence for its complete claim.
- Unsupported memories cannot be treated as established facts.
- Provenance attribution is consistent with source attribution.
- Evidence spans are within the original message text under the UTF-16 convention.
- No memory may claim support from deleted or revoked evidence.
- Every memory has valid derivation metadata.
- Every derivation dependency resolves.
- Derivation cycles are rejected.

19.4 Relationship integrity

- Every semantic relationship references two distinct existing memories.
- Every evidence reference resolves to a provenance record.
- Duplicate relationships are rejected.
- Supersession cycles are rejected.
- Contradictory memories remain distinguishable.
- Relationship validity is reassessed when endpoints or evidence change.

19.5 Governance integrity

- Missing permission does not grant permission.
- Explicit denial overrides allow.
- Unknown scope is not unrestricted scope.
- Unknown audience does not permit disclosure.
- Derived memories cannot broaden source permissions.
- Governance is checked before retrieval and context assembly.
- Deleted and revoked evidence is excluded from prohibited use.

19.6 Temporal integrity

- Known timestamps are valid.
- Unknown timestamps remain null.
- Temporal endpoint requirements match "timeStatus".
- Comparable endpoints are correctly ordered.
- Original time and import time remain distinct.
- Historical facts are not automatically treated as current.
- Date precision is not silently increased.

19.7 Connected-dataset validation

The five new collections must be validated as a connected dataset.

The existing application's recovery-oriented handling of malformed legacy entries must not automatically be applied to new records where doing so could leave broken provenance, dependencies or governance.

A malformed relationship or provenance record can change the meaning or safety of an otherwise valid memory.

A complete restore must reject invalid connected data rather than silently dropping individual records.

19.8 Error reporting

An error should identify, where safe:

- The affected collection.
- The record identifier.
- The failed validation rule.
- Whether the operation was rejected.
- Whether the previous data remains unchanged or its state is uncertain.

Error messages must not expose unnecessary personal message content.

---

20. Storage and performance requirements

20.1 Current storage boundary

The live application currently uses localStorage and schema version 2.

The current storage key is "mopapa.v1".

The five additional collections exist as empty arrays only. Stage 1 introduced these collections without enabling non-empty records.

Stage 2 is expected to introduce schema version 3, supporting non-empty conversations and messages. The memories, memorySources and memoryRelations collections must remain empty throughout Stage 2.

The Stage 2 migration must preserve all existing application data and the five collection boundaries. It must not introduce a second authoritative store or change the storage key.

IndexedDB remains a candidate, not an approved migration.

20.2 Measured performance

Existing small-dataset benchmarks do not establish performance for a substantial conversation archive.

Before archive-scale implementation is considered complete, measure:

- Realistic conversation counts.
- Realistic message counts.
- Long message bodies.
- Multiple provenance records per memory.
- Memory derivation chains.
- Relationship-heavy datasets.
- Search and retrieval workloads.
- Backup and restore workloads.
- Deletion and revocation workloads.
- Serialisation and parsing time.
- Storage quota behaviour.
- Interrupted-write behaviour.
- Recovery-copy overhead.
- Actual Android browser performance.

20.3 Limits

Do not invent maximum limits solely for convenience.

The following require representative measurements:

- Maximum conversation count.
- Maximum messages per conversation.
- Maximum message text length.
- Maximum memory count.
- Maximum subjects per memory.
- Maximum provenance links per memory.
- Maximum evidence spans per provenance record.
- Maximum relationship count.
- Maximum serialised dataset size.
- Maximum backup size.

The existing 5 MiB import limit must not be increased without measurements of archive size, serialisation, parsing, validation, storage quota, recovery-copy overhead and Android performance.

20.4 Storage decision

LocalStorage remains the current implementation decision.

A future move to IndexedDB requires measured evidence that the existing storage approach is insufficient, a migration design, recovery safeguards, performance tests and explicit approval.

---

21. Evaluation requirements and unresolved decisions

21.1 Required evaluation coverage

The implementation must be independently evaluated for:

- Message author attribution.
- Subject attribution.
- Quoted-speaker attribution.
- Original message preservation.
- Candidate extraction quality.
- Evidence completeness.
- Provenance integrity.
- Derivation integrity.
- Lifecycle transitions.
- Independent evidence-state transitions.
- Temporal precision and uncertainty.
- Supersession.
- Contradiction handling.
- Scope and audience enforcement.
- Restriction inheritance.
- Identity correction.
- Revocation.
- Direct and indirect deletion.
- Re-import behaviour.
- Duplicate import and retry behaviour.
- Backup and restore integrity.
- Migration failure and recovery.
- Retrieval eligibility.
- Answer support and appropriate abstention.
- Cache and index invalidation.

Critical privacy, attribution, provenance, governance, deletion and restore failures are release blockers. They must not be averaged away by a high overall score.

The evaluation document defines the test corpus and reporting method. This specification defines the technical properties that the evaluation must verify.


### 21.2 Decision register and implementation gates

The following decisions close the initial design-readiness review. A decision marked "resolve before Stage 1" is part of the storage and schema foundation. A decision assigned to a later stage is deliberately deferred and must be resolved before that stage begins. Deferral is not implementation approval.

#### A. Candidate formation and memory lifecycle

| No. | Decision | Disposition |
|---:|---|---|
| 1 | Candidate acceptance and rejection criteria | Defer to Stage 3. Initial extraction must be conservative, deterministic and evidence-linked. No candidate may become an accepted memory merely because it was extracted. |
| 2 | Mandatory user-confirmation categories | Defer to Stage 3 and Stage 4. Until approved, no automatic promotion is permitted. |
| 3 | Review, correction and dismissal workflow | Defer to Stage 4. Candidate inspection and user control must exist before stored memories are treated as usable personal knowledge. |
| 4 | Automatic promotion to active | Not approved for the initial implementation. Stage 3 and Stage 4 must use candidates requiring explicit acceptance unless a later, separately approved policy defines narrowly bounded exceptions. |
| 5 | Working-memory expiry and retention | Defer to Stage 4. Do not create working memories until expiry, retention and retrieval rules are defined. |
| 6 | Historical memory retention | Defer to Stage 4. No automatic age-based deletion of accepted memories is authorised. |
| 7 | Dismissal suppression | Defer to Stage 4. Dismissal must remain distinct from deletion. Repeated extraction must not silently recreate a dismissed candidate. |
| 8 | Deletion suppression | Defer to Stage 4. Do not add a sixth collection or retain raw deleted text as a suppression mechanism. Stable source identifiers may be used where available. Similarity alone is insufficient proof of identity. |
| 9 | Recovery-copy handling after deletion or revocation | Defer to Stage 4. Application-controlled recovery copies must be sanitised, invalidated or otherwise prevented from silently restoring prohibited information. Failure must block a claim of complete deletion. |
| 10 | Older backups and restores after deletion | Defer to Stage 4. An older backup must not silently reverse a deletion or revocation. The application must distinguish its own recovery copies from external files it cannot erase. |
| 11 | Lifecycle transition history | Defer to Stage 4. The initial schema foundation must not invent lifecycle history or imply that a transition audit trail already exists. |
| 12 | Policy combination for multiple sources | Defer to Stage 4. Until the combination algorithm is approved, derived information must not receive broader permissions than any contributing source. Unknown permission remains non-permission. |
| 13 | Revoking one source where other sources remain | Defer to Stage 4. Reassess the memory against its remaining independent evidence. Do not automatically retain or delete it without checking support and restrictions. |
| 14 | Permitted uses of user-confirmed interpretations | Defer to Stage 4. Confirmation may establish that the user accepts an interpretation; it does not rewrite original evidence or prove that a third party made a reported statement. |
| 15 | Sensitive-information classification and handling | Defer to Stage 3 and Stage 4. No sensitive-information auto-extraction or automatic promotion is authorised. Classification, confirmation, access and deletion rules must be approved before handling such memories. |
| 16 | Retrieval of partially supported memories | Defer to Stage 6. Unsupported portions must not be presented as established facts. Retrieval must expose uncertainty or abstain where evidence is insufficient. |

#### B. Derived information and dependencies

| No. | Decision | Disposition |
|---:|---|---|
| 17 | Index, cache and summary invalidation | No persistent derived index, summary store or cache is required for Stage 1 or Stage 2. Reconsider in Stage 6 only if measured retrieval needs justify it. |
| 18 | Derivation dependency representation | Defer to Stage 4. Retain the specified embedded `sourceMemoryIds` as the proposed initial representation. Do not introduce a separate dependency collection. Validate references and reject cycles before derived-memory use is enabled. |

#### C. Message evidence and attribution

| No. | Decision | Disposition |
|---:|---|---|
| 19 | Message role, author kind and attribution combinations | Resolve before Stage 2. Define and test the complete allowed-combination table against actual import formats. Unknown or contradictory attribution must remain unresolved or be rejected, never guessed. |
| 20 | Nested quotations, compound claims and attribution conflicts | Resolve before Stage 2 for message preservation and before Stage 3 for extraction. Preserve the original message unchanged. Keep nested speaker attribution explicit. Do not treat quoted or reported speech as direct evidence from the quoted person. Compound claims must be split into independently assessable claims where safe; otherwise retain them as one uncertain candidate with evidence limitations. |

#### D. Backup, migration and storage

| No. | Decision | Disposition |
|---:|---|---|
| 21 | Backup envelope and format version | Resolve before Stage 1. Retain the current plain JSON data-object backup format. The existing `schemaVersion` identifies the data schema. Do not add a wrapper or independent backup-format version in this stage. A future incompatible backup format requires a separate decision and compatibility plan. |
| 22 | Migration defaults for new fields | Resolve before Stage 1. New collections are created as empty arrays. Existing `entries`, `learned`, `customRooms` and `ask` values are preserved through explicit validation and migration. Unknown information remains unknown; no inferred authors, dates, permissions, identities or memory states are supplied. |
| 23 | Strict restore validation and compatibility | Resolve before Stage 1. Validate the complete proposed dataset before replacing current data. Support the explicitly approved legacy and schema-v1 inputs. Reject unsupported future versions, malformed records, duplicate IDs, broken references and invalid cross-collection relationships. Never silently discard malformed connected records and report the restore as successful. |
| 24 | Recovery-copy sanitisation and retention | Resolve the Stage 1 baseline now; complete deletion-aware sanitisation before Stage 4. Do not weaken or silently replace the existing recovery protections during Stage 1. Retain existing count and byte protections. Do not introduce age-based expiry that could remove the only recoverable copy. Before Stage 4 deletion is enabled, define how affected copies are sanitised or invalidated and how failure is reported. |
| 25 | Archive limits and Android acceptance thresholds | Defer to Stage 7, with representative measurements beginning as soon as a usable archive exists. Do not invent maximum archive limits or treat CI Chromium timings as proof of Android performance. Keep the existing 5 MiB import limit unchanged unless measurements and explicit approval justify a change. |
| 26 | Evaluation thresholds and release criteria | Resolve the release-blocker policy now; defer numerical thresholds until representative fixtures and results exist. Privacy, attribution, provenance, permission, deletion, restore and data-loss failures are critical blockers and cannot be averaged away. Unmeasured results must be reported as unmeasured. |

#### E. Identity, time and evidence structure

| No. | Decision | Disposition |
|---:|---|---|
| 27 | Global identity resolution | Excluded from the initial model. Identity remains conversation-local. No global identity collection, automatic cross-conversation matching or global merge is authorised. Reconsider only through a separate proposal and approval. |
| 28 | Original timestamp preservation | Resolve before Stage 2. Preserve the original supplied timestamp representation separately from any normalised value. Do not overwrite malformed or ambiguous source values with a guessed date. |
| 29 | Approximate dates, partial dates and timezone uncertainty | Resolve before Stage 5. Preserve date precision as supplied. Comparisons must not invent missing days, times or timezones. Ambiguous temporal ordering must remain uncertain. |
| 30 | Nested quoted-speaker structure | Resolve before Stage 2. Preserve parent-child quotation relationships where the source supports them. Do not flatten nested speakers. If a reliable attribution chain cannot be represented, retain unresolved attribution. |
| 31 | Compound-claim provenance | Resolve before Stage 3. Prefer separate independently assessable memory records when a compound statement can be safely divided without changing its meaning. If it cannot, retain the compound candidate with provenance to the complete supporting message and mark unsupported components as uncertain. |
| 32 | Reversible participant correction, merge and unmerge | Defer to Stage 5. Corrections must be explicit, reversible and conversation-local. No global identity merge is implied. Dependent memories and relationships must be reassessed after a correction. |
| 33 | Identity correction or deletion and dependent references | Defer to Stage 5. Define reference handling, historical attribution and dependent-record reassessment before identity deletion or merge functionality is implemented. |

#### F. Indexing and deletion behaviour

| No. | Decision | Disposition |
|---:|---|---|
| 34 | Derived-index rebuild strategy | Defer to Stage 6. No persistent index is part of the initial storage foundation. If an index is later justified, it must be rebuildable from authoritative records and verified before use. |
| 35 | Stale or incomplete index protection | Defer to Stage 6. Incomplete, stale or unverified derived data must never be presented as complete or authoritative. If safe retrieval cannot be established, retrieval must fail closed. |
| 36 | Deliberate reintroduction after deletion | Defer to Stage 4. Reintroduction must require a deliberate, informed user action distinct from ordinary import, duplicate detection and automatic extraction. It must not silently reactivate a deleted memory. |
| 37 | Retrieval during incomplete deletion cleanup | Defer to Stage 4. Block the affected record and all dependent retrieval while required cleanup is unresolved. Unrelated records may remain available only when their independence and safety are established. Never report complete deletion while required cleanup remains incomplete. |

#### G. Transaction and manual-entry boundaries

| No. | Decision | Disposition |
|---:|---|---|
| 38 | Storage transaction strategy | Resolve before Stage 1. Keep the current single-key `mopapa.v1` localStorage architecture for this stage. Prepare and validate the complete next dataset before writing it. Use verified read-back and the existing best-effort restoration approach. Preserve a recoverable pre-migration copy. Do not claim database-grade atomic transactions or guaranteed rollback. If verification or restoration fails, report failure clearly and preserve recovery evidence where possible. |
| 39 | Manual-entry and extracted-memory overlap | Defer to Stage 4. Manual entries and extracted memories remain separate records. Similar wording does not prove identity or justify merging. Creating, correcting or deleting one must not silently replace or delete the other. Any explicit relationship requires a separately validated model. |

#### Readiness result

The decisions above establish the boundaries for the first storage and schema foundation. They do not authorise conversation import, candidate extraction, active memory creation, governance interfaces, deletion-aware memory operations, advanced retrieval or any new AI processing.

A later stage may begin only after its deferred decisions have been resolved in the appropriate master document, its evaluation fixtures have been specified, and that stage has received explicit approval.


21.3 Approval gates

The following require explicit approval before the corresponding work begins:

- Production schema version 3 for Stage 2 conversation and message records.
- A storage-key change.
- IndexedDB migration.
- Global identity resolution.
- Any additional persistent collection.
- External AI or hosted inference.
- Paid services or recurring dependencies.
- Cloud synchronisation.
- Automatic access to other applications.
- Replacement of deterministic Ask.
- A wholesale application rewrite.

A documented proposal is not an implementation approval.

---

Document maintenance rule

This document should change only when a technical decision is resolved, a genuine inconsistency is discovered, a validation requirement changes, or verified implementation evidence requires an update.

Do not recreate supporting specifications that repeat these definitions.

Research rationale belongs in "personal-memory-research-review.md". Product direction belongs in "personal-memory-architecture.md". Implementation sequencing and verified progress belong in "personal-memory-build-plan.md". Evaluation fixtures and results belong in "personal-memory-evaluation.md".

Current position: The live application uses schema version 2 and localStorage under the existing "mopapa.v1" key. The five additional collections exist as empty arrays only. Stage 2 is being specified as native, source-independent conversation and message preservation, with schema version 3 proposed for its implementation. The other three collections remain empty during Stage 2. This specification does not authorise production changes. Stage 2 requires completed documentation, evaluation fixtures, code-alignment review and explicit implementation approval.