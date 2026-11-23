Mopapa: Personal Memory Record Specification

Status: Consolidated canonical technical specification
Date: 23 November 2026
Repository: https://github.com/kynaruniverse/Mopapa
Authority: This document is the technical authority for the proposed personal-memory record model.
Implementation status: Design only. Production implementation and schema migration remain unauthorised.

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
- Activation of schema version 2.
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

This is an illustrative target structure, not the live schema. Schema version 2 remains proposed and inactive.

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

Known absolute instants use ISO 8601 timestamps with an explicit timezone or UTC designator.

Example:

2026-11-20T09:30:00.000Z

Rules:

- Unknown timestamps are represented as "null".
- Do not invent a timestamp to fill a missing value.
- Original event time, message time, import receipt time, record creation time and update time are distinct.
- A date-only value remains date-only when the source supplies no time.
- A month or year must not be converted into an invented day.
- Original timezone information should be retained separately when supplied and relevant.
- Invalid timestamps must be rejected, not silently normalised into a different date.

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
    "type": "chatgpt_import",
    "sourceId": "source_conversation_123",
    "label": "ChatGPT export"
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
"origin.type"| Required| "manual", "chatgpt_import", "file_import" or "other"
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
  "timestamp": null,
  "receivedAt": "2026-11-20T09:30:00.000Z",
  "origin": {
    "type": "chatgpt_import",
    "sourceMessageId": "source_message_456"
  },
  "quotedSpeakers": [],
  "governance": {}
}

Field| Requirement| Rule
"id"| Required| Unique Mopapa message ID
"conversationId"| Required| Must reference an existing conversation
"sequence"| Required| Non-negative integer, unique within conversation
"role"| Required| "user", "assistant", "system" or "other"
"author"| Required| Explicit author attribution
"text"| Required| Original, non-empty, unmodified text
"timestamp"| Required, nullable| Original message time, if known
"receivedAt"| Required| Time received or imported by Mopapa
"origin"| Required| Source type and original message identifier
"quotedSpeakers"| Required| Embedded quoted-speaker annotations
"governance"| Required| Applicable scope, audience, permissions and restrictions

6.2 Author representation

A participant author may use:

{
  "kind": "participant",
  "participantId": "par_example001",
  "attribution": "user"
}

An unknown author may use:

{
  "kind": "unknown",
  "participantId": null,
  "attribution": "unknown"
}

The attribution classes are:

- "user"
- "assistant"
- "third_party"
- "unknown"

Import origin must never be used as an authorship value. An imported message may still have been written by the user.

The valid combinations of message "role", "author.kind" and "author.attribution" require an explicit validation decision table before implementation. Invalid combinations must be rejected rather than guessed.

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

Quoted-speaker annotations are embedded in the message.

Illustrative structure:

{
  "id": "quote_example001",
  "participantId": null,
  "speakerLabel": "my manager",
  "attribution": "third_party",
  "textStart": 0,
  "textEnd": 32,
  "status": "unresolved"
}

Rules:

- A quoted speaker is not automatically the author of the message.
- A quoted-speaker participant reference, when present, must resolve within the exact source message's conversation.
- A speaker label does not establish identity.
- Unresolved or ambiguous speakers must not be assigned by guesswork.
- Quoted text must be located in the original, unchanged message text.
- Any explicit source-text correction requires affected offsets to be revalidated.

The canonical offset convention is defined in Section 8.

Nested quotations, compound claims and conflicting attribution require dedicated evaluation fixtures. Their complete interpretation rules are not yet settled.

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

12.4 Governance decisions still open

The precise policy-combination algorithm is not settled.

A worked decision table is required for:

- Multiple sources with different permissions.
- One source revoked while other sources remain.
- Conflicting allow and deny rules.
- User-confirmed interpretations.
- Context-only information.
- Cross-context retrieval.
- Export and backup.
- Summaries and derived memories.
- Unknown or incomplete governance metadata.

No implementation may treat a permissive default as a substitute for this decision.

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

Candidate extraction should be conservative and evidence-grounded.

The following must not silently become established personal facts:

- Assistant suggestions.
- Assistant-generated summaries.
- Hypothetical statements.
- Fictional statements.
- Role-play content.
- Questions that do not assert a fact.
- Unclear quotations.
- Statements whose speaker or subject is ambiguous.
- Repetition without independent evidence.
- Unsupported interpretations.

A user confirmation may become a new source of evidence. It must not be misrepresented as though the original message had contained that confirmation.

14.3 Candidate assessment

Assessment must consider:

- Message author.
- Quoted speaker.
- Memory subject.
- Claim boundaries.
- Supporting and refuting evidence.
- Temporal information.
- Scope and audience.
- Permission and restrictions.
- Existing memories and contradictions.
- Whether the statement is hypothetical, fictional or uncertain.

14.4 Acceptance and dismissal

A candidate is not an accepted memory.

The exact acceptance criteria, mandatory confirmation categories, user review workflow and permitted automatic-promotion rules remain open decisions.

Dismissal must be respected by future ordinary extraction. The mechanism for reliably preserving that decision across re-import remains unresolved.

14.5 Lifecycle and evidence independence

A lifecycle transition does not automatically change the evidence state, and an evidence-state change does not automatically determine lifecycle.

For example, a memory may become historical while remaining supported by its original evidence.

The exact transition table and audit-history representation must be settled before implementation.

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

16.4 Failure conditions

If dependency traversal encounters a cycle, missing reference, malformed record or uncertain permission, affected retrieval must fail closed.

A destructive operation must not report success until its required postconditions have been verified.

16.5 Deletion and recovery limitations

Deleting a live record does not automatically erase previously exported backups or files outside the application's control.

The application must not claim to have erased external copies it cannot access.

Recovery copies may contain information that has since been deleted or revoked. Their retention, replacement, sanitisation and restoration policy remains a blocking decision.

---

17. Re-import and deletion suppression

17.1 Required behaviour

Ordinary re-import or extraction must not silently reverse a deliberate deletion, dismissal or revocation decision.

The initial model contains five proposed personal-memory collections. No sixth collection or persistent import ledger is approved.

17.2 Source identity

- Prefer stable source identifiers supplied by the original source.
- Keep source identifiers separate from Mopapa-generated IDs.
- Text similarity alone must not establish source identity.
- Do not claim reliable duplicate detection when source identity is unavailable.
- Do not retain raw deleted message text solely to recognise a future import.

17.3 Ambiguous re-import

Where the system cannot establish whether an import would reverse a prior deletion or revocation:

- Do not silently recreate the affected information.
- Do not claim that suppression is reliable.
- Block the affected operation or require a separately designed explicit review process.
- Do not treat similar wording as proof that two records are the same source.

17.4 Dismissal and explicit reintroduction

A dismissed candidate must not silently return as an accepted memory.

A deliberate user instruction to reintroduce previously deleted information must be distinguishable from ordinary repeated import.

The confirmation, retention and audit behaviour for explicit reintroduction remain unresolved.

17.5 Suppression decision

The minimum metadata, storage location, retention period, deletion behaviour, backup inclusion and restore behaviour remain unresolved.

No import ledger, fingerprint scheme, sixth collection or alternative persistent suppression mechanism is approved.

Raw deleted content must not be retained merely to make suppression easier.

---

18. Backup, restore and migration

18.1 Version boundaries

The live application remains on schema version 1 and uses the existing "mopapa.v1" storage key.

The proposed schema version 2 is inactive.

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

The live application currently uses localStorage and schema version 1.

The current storage key is "mopapa.v1".

No schema change is implied by this specification.

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

21.2 Unresolved implementation-readiness decisions

The following remain open and must not be represented as settled:

1. Exact candidate acceptance and rejection criteria for each memory type.
2. Mandatory user-confirmation categories.
3. The exact user review, correction and dismissal workflow.
4. Whether any candidate type may be automatically promoted to active.
5. Working-memory expiry and retention.
6. Historical memory retention policy.
7. Dismissal suppression metadata and retention.
8. Deletion suppression mechanism and its privacy implications.
9. How recovery copies are sanitised or invalidated after deletion and revocation.
10. How deletion decisions are reconciled with older backups and restores.
11. Exact lifecycle transition history representation.
12. Exact policy-combination algorithm for memories with multiple sources.
13. Treatment of a memory when one source is revoked but other sources remain.
14. Permitted uses of user-confirmed interpretations.
15. Sensitive-information classification and handling.
16. Retrieval policy for partially supported memories.
17. Reliable invalidation of indexes, caches and summaries.
18. Exact derivation dependency representation beyond the canonical embedded "sourceMemoryIds".
19. Exact message role, author-kind and attribution validation combinations.
20. Nested quotations, compound claims and attribution conflicts.
21. Exact backup envelope and integrity requirements.
22. Exact migration defaults for every new field.
23. Strict restore validation and compatibility rules.
24. Recovery-copy sanitisation and retention.
25. Archive-size limits and Android device acceptance thresholds.
26. Evaluation thresholds and release criteria.
27. Any future global identity-resolution model.

Each decision must be recorded in the appropriate master document, with its rationale, alternatives considered, consequences, tests and approval status.

21.3 Approval gates

The following require explicit approval before the corresponding work begins:

- Production schema version 2.
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

Current position: The five-collection personal-memory model is a proposed target. The live application remains on its existing schema and storage implementation. The record model is not permission to begin production changes. Implementation readiness must be established through the remaining decisions and approval gates in this specification and the build plan.