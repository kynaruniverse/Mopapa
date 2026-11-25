Mopapa: Identity, Evidence Attribution and Temporal Specification

Status: Historical supporting specification retained during documentation consolidation
Product: Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa
Canonical technical authority: "docs/personal-memory-record-specification.md"
Canonical evaluation authority: "docs/personal-memory-evaluation.md"
Document retirement: Pending final unique-content and reference audit.
Prerequisites:

- "docs/personal-memory-architecture.md"
- "docs/personal-memory-data-model.md"
- "docs/personal-memory-record-specification.md"
- "docs/personal-memory-architecture-decisions.md"
- "docs/personal-memory-schema-consistency-review.md"

Implementation status: Design only. No production changes authorised.

This document preserves the detailed identity, authorship, attribution, provenance and temporal design history.

The canonical record specification takes precedence wherever technical definitions differ. The evaluation master contains the consolidated test and evaluation catalogue.

Sections describing earlier next steps are historical planning notes, not current instructions. Current sequencing and outstanding work are maintained in "docs/personal-memory-build-plan.md".

This document is retained until its remaining unique requirements and references have been audited. It does not independently authorise implementation.

---

1. Purpose

This document resolves the foundational identity, attribution, provenance and temporal questions identified in the schema consistency review.

Mopapa must be able to establish, without guessing:

1. Who authored an original message.
2. Whether a statement within that message is attributed to somebody else.
3. Who or what an extracted memory concerns.
4. Which original evidence supports, refutes or qualifies that memory.
5. Whether the evidence represents a direct statement, a report, a quotation or an unresolved attribution.
6. When the information applied, including when only an approximate or date-only time is known.

These concepts must remain separate.

The specification also defines validation rules, invalid examples, dataset invariants and required tests.

It does not authorise production implementation or a schema migration.

2. Governing decisions

The following are the proposed decisions established by this document.

ID| Decision| Proposed outcome
IET-01| Participant identity| Conversation-local participant records remain authoritative initially.
IET-02| Global identity| Optional global identity resolution is deferred.
IET-03| Identity ownership| A global identity must have an explicit authoritative record before it can be referenced.
IET-04| Message authorship| Every message has an explicit author representation, including unknown authors.
IET-05| Quoted speakers| Quoted speakers are separate annotations within the original message.
IET-06| Evidence attribution| Provenance identifies whose statement the evidence represents.
IET-07| Evidence spans| Offsets use UTF-16 code units, with inclusive starts and exclusive ends.
IET-08| Provenance relationships| "supports", "refutes", "qualifies" and "context_only" are distinct relationships.
IET-09| Temporal representation| Exact instants, date-only values, approximate periods and unknown time remain distinguishable.
IET-10| Historical validity| Validity time is separate from message, import and recording time.
IET-11| Identity corrections| Corrections must be traceable and must trigger dependent-record reassessment.
IET-12| Original evidence| Original message content and original source timestamps are never rewritten by extraction.

All decisions remain proposed until explicitly approved.

3. Identity model

3.1 Two identity levels

The model distinguishes two levels.

Level 1: Conversation-local participant

A participant belongs to one conversation.

Its identifier is unique within that conversation and does not establish that the same person in another conversation is the same real-world person.

Level 2: Optional resolved identity

A participant may eventually reference a separately governed identity record.

That reference is permitted only after an explicit identity-resolution decision.

A display name, email-like string, writing style, relationship description or repeated mention must never independently establish identity.

3.2 Initial implementation boundary

The initial implementation must use conversation-local participants only.

The five approved logical collections remain:

- "conversations"
- "messages"
- "memories"
- "memorySources"
- "memoryRelations"

This specification does not add an "identities" collection.

The proposed "identityKey" field remains "null" unless a separately approved identity model establishes an authoritative target.

Cross-conversation identity matching remains disabled.

No global identity merge, automatic identity linking or inferred identity resolution is permitted.

3.3 Participant record

Proposed participant representation:

{
  "id": "par_example001",
  "sourceParticipantId": "source_user_123",
  "kind": "user",
  "displayName": "Alex",
  "identityStatus": "unresolved",
  "identityKey": null,
  "identityHistory": []
}

Fields:

Field| Type| Required| Rules
"id"| String| Yes| Unique within its conversation.
"sourceParticipantId"| String or null| Yes| Original source identifier, if supplied.
"kind"| Enum| Yes| "user", "assistant", "third_party", "system", "unknown".
"displayName"| String or null| Yes| Display label only, maximum 200 characters.
"identityStatus"| Enum| Yes| Initial model: "unresolved", "ambiguous" or "unknown". "identified" is reserved for a separately approved identity-resolution model.
"identityKey"| String or null| Yes| Must remain null until a global identity model is approved.
"identityHistory"| Array| Yes| Traceable correction history; initially empty.

Participant rules:

- Two participants with identical display names remain separate unless explicitly resolved.
- A person mentioned in a message is not automatically a participant.
- A participant's identity must not be inferred from writing style.
- An unknown participant is valid data.
- An unresolved participant must not be silently promoted to identified.
- Source participant identifiers must not be treated as global identities unless the source explicitly guarantees their scope and stability.
- A correction must preserve the original source information.
- A participant correction must trigger reassessment of memories and relationships dependent on that participant.

3.4 Identity status definitions

Status| Meaning
"unresolved"| A participant exists, but their real-world identity has not been established.
"ambiguous"| More than one plausible identity exists and the correct one is unresolved.
"unknown"| The available source does not establish a usable identity.

"identified" is not an allowed initial-model status. It is reserved for a future, separately approved identity-resolution model.

"unresolved" and "unknown" are not interchangeable.

A participant may be known to exist while their real-world identity remains unresolved.

3.5 Future global identity requirements

Before global identity references are enabled, a separate specification must define:

- Identity record ownership.
- Identity types, including person, organisation and other supported entities.
- Stable identifiers.
- Creation and resolution rules.
- Evidence required for a match.
- Explicit confirmation requirements.
- Merge and unmerge operations.
- Mistaken-identity correction.
- Deletion and reference handling.
- Historical record behaviour after correction.
- Privacy and retention rules.
- Backup and restore behaviour.
- Tests for false matches and mistaken merges.

An identity merge must never rewrite original message authorship or original source attribution.

A merge changes an interpretation of identity, not the historical source.

4. Message authorship

4.1 Author and role are separate

The message "role" describes the source message's role.

The "author" object describes who authored or sent the original message.

These fields must be validated together.

Proposed message structure:

{
  "id": "msg_example001",
  "conversationId": "con_example001",
  "sequence": 1,
  "role": "user",
  "author": {
    "kind": "participant",
    "participantId": "par_example001",
    "attribution": "user"
  },
  "text": "My manager told me that the office will close in December.",
  "timestamp": null,
  "receivedAt": "2026-11-20T09:30:00.000Z",
  "origin": {
    "type": "chatgpt_import",
    "sourceMessageId": "source_message_456"
  },
  "quotedSpeakers": [],
  "governance": {}
}

4.2 Author representation

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

Assistant or system author:

{
  "kind": "system",
  "participantId": null,
  "attribution": "assistant"
}

The proposed author kinds are:

- "participant"
- "system"
- "unknown"

The proposed attribution classes are:

- "user"
- "assistant"
- "third_party"
- "unknown"

Import status describes how Mopapa acquired the record, not who authored it. If the original author cannot be established, attribution must be "unknown". The import source and receipt time must be recorded separately from authorship.

Where a source provides a participant author, the participant reference must be used.

4.3 Author validation

The following combinations are valid:

Author kind| Participant reference| Attribution
"participant"| Existing participant ID| "user", "assistant", "third_party" or another explicitly supported participant class
"system"| Null| "assistant"
"unknown"| Null| "unknown"

The following are invalid:

- A "participant" author with a missing participant reference.
- A "system" author with a participant reference.
- An "unknown" author with a participant reference.
- An unsupported author kind.
- A participant reference belonging to another conversation.
- A role and author combination that contradicts the source data.

The source import adapter must preserve the original role and author information rather than silently changing it to fit an assumed mapping.

4.4 Import origin is not authorship

These concepts must remain distinct:

- Who authored the message.
- Which application or file supplied it.
- When Mopapa received it.

An imported message may have been written by the user, an assistant or a third party.

Import origin must never overwrite authorship.

5. Quoted speakers

5.1 Purpose

A message may contain statements attributed to somebody other than its author.

Example:

«My manager told me that the office will close in December.»

The message author is the user.

The reported speaker is the manager.

The user is the source of the report, but the manager is the person represented as having made the reported statement.

These must not be collapsed into one identity.

5.2 Proposed quoted-speaker annotation

{
  "id": "quote_example001",
  "participantId": null,
  "speakerLabel": "my manager",
  "attribution": "third_party",
  "textStart": 0,
  "textEnd": 58,
  "status": "unresolved",
  "quotationType": "reported_speech"
}

Fields:

Field| Type| Required| Rules
"id"| String| Yes| Unique within its message.
"participantId"| String or null| Yes| Existing participant reference only if the speaker is an established conversation participant.
"speakerLabel"| String or null| Yes| Original descriptive label, maximum 200 characters.
"attribution"| Enum| Yes| "user", "assistant", "third_party", "unknown".
"textStart"| Integer or null| Yes| Inclusive UTF-16 start offset.
"textEnd"| Integer or null| Yes| Exclusive UTF-16 end offset.
"status"| Enum| Yes| "resolved", "unresolved", "ambiguous", "unknown".
"quotationType"| Enum| Yes| "direct_quote", "reported_speech", "paraphrase", "uncertain".

5.3 Quotation type definitions

Type| Meaning
"direct_quote"| The original message explicitly quotes the represented speaker's words.
"reported_speech"| The author reports what another person said without necessarily quoting exact words.
"paraphrase"| The author restates another person's position in their own wording.
"uncertain"| The source does not establish whether the statement is a quotation, report or paraphrase.

A direct quotation is not proof that the quoted person actually made the statement.

It is evidence that the original message contains that quotation.

5.4 Quoted-speaker rules

- A quoted speaker is not automatically the author of the whole message.
- A quoted speaker is not automatically a conversation participant.
- A speaker label is not a verified identity.
- An unresolved speaker remains unresolved.
- A quoted-speaker annotation must point to the original message text where a reliable span exists.
- A paraphrase must not be represented as an exact quotation.
- Nested quotations must be represented without confusing the outer speaker with the inner speaker.
- Ambiguous quotations must not be assigned to a person by guesswork.
- A quoted speaker's statement must not be treated as direct communication with Mopapa.

5.5 Nested quotation example

Suppose a user writes:

«My manager said that Sarah told him the office would close.»

There are potentially three distinct roles:

1. The user authored the message.
2. The manager is reported as speaking.
3. Sarah is reported as the manager's source.

The system must not flatten this into a direct statement by Sarah.

If the nested attribution cannot be reliably represented, the extraction must retain the message as a report with unresolved attribution rather than inventing a chain of speakers.

6. Memory subjects

6.1 Subject and speaker are separate

A memory subject identifies who or what the memory concerns.

It does not identify who authored the evidence.

Example:

The user writes:

«My daughter starts school next September.»

Possible interpretation:

- Message author: user.
- Memory subject: daughter.
- Evidence origin: original user message.
- Evidence attribution: user.
- Temporal information: next September, requiring resolution relative to the message's original time.

The daughter must not be recorded as the author of the statement.

6.2 Subject representation

{
  "id": "sub_example001",
  "kind": "person",
  "label": "my daughter",
  "identityKey": null,
  "attribution": "third_party",
  "identityStatus": "unresolved"
}

Supported subject kinds:

- "person"
- "organisation"
- "place"
- "event"
- "object"
- "topic"
- "unknown"

Supported subject attribution classes:

- "user"
- "assistant"
- "third_party"
- "unknown"

Subject rules:

- Subject labels are descriptive, not proof of identity.
- Multiple subjects may be attached to one memory.
- A subject may remain unknown.
- A subject's identity must not be inferred solely from a name.
- Cross-conversation identity resolution remains disabled.
- A subject identity correction must trigger reassessment of dependent memories and relationships.
- Subject attribution must not be copied automatically from message authorship.

7. Evidence attribution and provenance

7.1 Five distinct concepts

Every memory must preserve the distinction between:

1. Message author.
2. Quoted speaker.
3. Evidence origin.
4. Memory subject.
5. Evidence attribution.

These are not interchangeable fields.

Concept| Question answered
Message author| Who wrote or sent the original message?
Quoted speaker| Who is represented as having said the quoted or reported material?
Evidence origin| Which original message or source contains the evidence?
Memory subject| Who or what does the memory concern?
Evidence attribution| Whose statement does this particular evidence represent?

7.2 Provenance record

Proposed structure:

{
  "id": "src_example001",
  "memoryId": "mem_example001",
  "messageId": "msg_example001",
  "relationship": "supports",
  "evidenceSpans": [
    {
      "textStart": 0,
      "textEnd": 58
    }
  ],
  "sourceAttribution": "user",
  "quotedSpeakerId": null,
  "createdAt": "2026-11-20T09:35:00.000Z"
}

Fields:

Field| Type| Required| Rules
"id"| String| Yes| Unique provenance ID.
"memoryId"| String| Yes| Existing memory reference.
"messageId"| String| Yes| Existing original message reference.
"relationship"| Enum| Yes| "supports", "refutes", "qualifies", "context_only".
"evidenceSpans"| Array| Yes| Valid source spans or an explicitly declared whole-message reference.
"sourceAttribution"| Enum| Yes| Attribution of the represented evidence.
"quotedSpeakerId"| String or null| Yes| Reference to a quoted-speaker annotation in the same message, where applicable.
"createdAt"| Timestamp| Yes| Time the provenance link was created.

7.3 Provenance relationship types

"supports"

The source provides evidence in favour of the memory claim.

"refutes"

The source provides evidence against the memory claim.

"qualifies"

The source narrows, limits or adds conditions to the memory claim.

"context_only"

The source is relevant context but does not establish whether the memory claim is true.

A provenance link must never be treated as supporting evidence merely because it exists.

7.4 Evidence attribution rules

"sourceAttribution" identifies whose statement the evidence represents.

Examples:

Evidence| Source attribution| Quoted speaker
User directly states a personal fact| "user"| Null
Assistant makes a suggestion| "assistant"| Null
User reports what their manager said| "third_party"| Manager annotation
User writes an unattributed report| "unknown" or explicitly "user", depending on the actual claim| Null
Imported content with unknown original author| "unknown"| Null

A user reporting a third-party statement is evidence that the user reported it. It is not independent confirmation that the third party made the statement.

Where the memory concerns the existence of the report itself, the user may be the evidence attribution.

Where the memory concerns the truth of the reported statement, the quoted or reported speaker must be represented where established, and the evidence must retain its reported nature.

7.5 Provenance validation

- Every provenance record must reference an existing memory.
- Every provenance record must reference an existing message.
- A non-null "quotedSpeakerId" must reference an annotation within that exact message.
- A quoted-speaker reference must never point to another message.
- A provenance record must not claim a speaker absent from the source.
- Duplicate memory/message provenance links must be rejected unless a later approved model explicitly supports separate claim-level links.
- Evidence relationship values must be from the defined enum.
- A provenance link with "context_only" must not increase the memory's supported evidence state.
- A "refutes" link must not be counted as support.
- A "qualifies" link must be assessed for its effect on the complete claim.
- Deleting or revoking a source must trigger reassessment of all dependent memories.
- The original source must remain unchanged during extraction and correction.

7.6 Compound memories

A memory should represent one coherent, independently assessable claim wherever practical.

Avoid combining claims that have different:

- Subjects.
- Evidence.
- Attribution.
- Validity periods.
- Permissions.
- Correction histories.

For example:

«The user works at Company B and lives in Oxford.»

Employment and location may have different sources and different validity periods.

They should normally be separate memories.

A compound memory may be retained only where splitting it would materially damage meaning and the evidence model can still assess each claim independently.

8. Evidence span convention

8.1 Selected convention

The proposed convention is UTF-16 code units.

This matches JavaScript string indexing and the behaviour of:

- "String.prototype.slice"
- "String.prototype.substring"
- JavaScript string ".length"

This is the most practical convention for the current vanilla JavaScript application.

Offsets are:

- Zero-based.
- Inclusive at the start.
- Exclusive at the end.

8.2 Example

Original message:

I now work at Company B.

If the selected span starts at the first character and ends after the final full stop:

{
  "textStart": 0,
  "textEnd": 24
}

The exact value must be validated against the original message text at runtime.

8.3 Unicode behaviour

UTF-16 code units are not the same as Unicode code points or visible characters.

An emoji may occupy two UTF-16 code units.

A combining character may be represented by more than one code point.

The application must use the same indexing convention when:

- Creating evidence spans.
- Validating evidence spans.
- Displaying highlighted source text.
- Revalidating spans after an explicit source correction.
- Exporting and restoring records.

Offsets must never be converted between conventions implicitly.

8.4 Span validation

A span is valid only when:

- "textStart" and "textEnd" are integers.
- "textStart" is greater than or equal to zero.
- "textEnd" is greater than "textStart".
- "textEnd" does not exceed the original message's UTF-16 ".length".
- The message exists.
- The original message text is available.
- The span points to the intended evidence.

An invalid span must be rejected or explicitly downgraded to an unlocated whole-message reference.

It must not be silently clamped to a different substring.

8.5 Whole-message evidence

Where a source does not provide reliable offsets, the model must explicitly identify whole-message evidence.

Do not fabricate a span covering an arbitrary section.

The final representation of whole-message evidence must be agreed before implementation. It may use a documented "whole_message" marker or an equivalent explicit structure.

A missing span must not be interpreted as proof that the entire message supports the memory.

9. Temporal model

9.1 Separate time concepts

The following timestamps have different meanings.

Field| Meaning
"timestamp"| Original message time supplied by the source.
"receivedAt"| Time Mopapa received or imported the source.
"createdAt"| Time the record was created.
"updatedAt"| Time the record was last modified.
"recordedAt"| Time the memory was recorded.
"validFrom"| Beginning of the period in which the information applies.
"validTo"| End of the period in which the information applies.

A timestamp must not be copied into another field merely because the correct value is unknown.

For example, "recordedAt" must never be substituted for "validFrom".

9.2 Temporal representation

The proposed temporal object is:

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

The exact field structure remains proposed, but the semantic distinctions in this section are required.

Each known endpoint must preserve:

- Its value.
- Its precision.
- Its timezone where relevant.
- Whether it is exact or approximate.

9.3 Time status values

Value| Meaning
"known_interval"| Both validity boundaries are known to the represented precision.
"known_start"| The start is known; the end is unknown or open.
"known_end"| The end is known; the start is unknown.
"approximate"| The validity period is estimated or bounded approximately.
"unknown"| No reliable validity boundary is established.

These values describe the state of temporal knowledge, not the memory's lifecycle.

9.4 Precision values

The proposed precision values are:

- "instant"
- "day"
- "month"
- "year"
- "approximate"
- "unknown"

Definitions:

"instant"

An exact instant with an explicit timezone or UTC designator.

"day"

A calendar date without a known time of day.

"month"

A calendar month without a known day or time.

"year"

A calendar year without a known month, day or time.

"approximate"

An estimated time or interval that cannot honestly be represented as an exact calendar boundary.

"unknown"

No reliable temporal value is available.

9.5 Exact instants

Exact instants must use ISO 8601 timestamps with an explicit timezone or UTC designator.

Example:

2026-11-20T09:30:00.000Z

If the source provides an offset, retain the original source representation where required for auditability.

Do not silently interpret a timezone-free local time as UTC.

9.6 Date-only information

Date-only information must remain date-only.

Example:

{
  "value": "2026-11-20",
  "precision": "day",
  "timezone": null
}

Do not convert it into:

2026-11-20T00:00:00.000Z

That conversion invents a time and timezone that the source did not provide.

Where the source explicitly associates the date with a timezone or locale, preserve that information where necessary to interpret it correctly.

9.7 Month-only and year-only information

Examples:

{
  "value": "2026-11",
  "precision": "month",
  "timezone": null
}

{
  "value": "2026",
  "precision": "year",
  "timezone": null
}

Do not convert a month-only value into its first day or a year-only value into 1 January as though those dates were stated.

9.8 Approximate time

Approximate information must remain approximate.

Example:

«I moved here around spring 2024.»

This must not become an exact date.

Where an interval can be represented reliably, retain the earliest and latest plausible boundaries and identify the interval as approximate.

If the source only supplies a vague phrase that cannot be bounded reliably, preserve the original temporal expression in the source and leave the normalised validity boundaries unknown.

Do not invent numerical date ranges for phrases such as:

- Recently.
- A while ago.
- Sometime last year.
- Around the beginning of the year.

Any future normalisation rules for these expressions require a separately tested interpretation policy.

9.9 Validity interval semantics

The proposed interval convention is:

Start inclusive, end exclusive.

A memory is valid at time "t" when:

validFrom <= t < validTo

This convention avoids ambiguity where one period ends at the exact instant another begins.

For date-only endpoints, comparison must use the represented calendar precision and must not invent an instant or timezone.

If both endpoints are known at compatible precision:

- The start must be earlier than the end.
- Equal start and end values represent an invalid empty interval.
- A start later than the end is invalid.

The implementation must not compare incompatible precision values as though they were exact instants.

9.10 Open boundaries

A known start with no known end is represented as "known_start".

A known end with no known start is represented as "known_end".

An unknown boundary is not equivalent to a claim that the information existed forever.

Open boundaries must not be interpreted as unlimited historical certainty.

9.11 Relative expressions

Expressions such as:

- Tomorrow.
- Next Friday.
- Last month.
- Two years ago.
- When I started the job.

Must be resolved only when the relevant reference time is known.

The preferred reference is the original message timestamp.

If that timestamp is unknown, the system must not use import time or recording time as a substitute without explicitly representing the uncertainty.

If the expression cannot be resolved reliably, preserve the original wording and leave the normalised temporal value uncertain or unknown.

9.12 Temporal rules

- Original message timestamps must never be rewritten during extraction.
- Import time must not become event time.
- Recording time must not become validity start.
- A later statement must not automatically supersede an earlier statement.
- Approximate dates must not be displayed as exact.
- Date-only information must not acquire an invented time.
- Timezone-free timestamps must not be silently assigned UTC.
- A correction must preserve the original evidence timestamp.
- Unknown temporal information must remain representable.
- Historical memories must remain retrievable as historical information where permitted.
- Temporal uncertainty must be visible to retrieval and answering.

10. Worked examples

10.1 Direct personal statement

Original message:

«I started working at Company B in March 2026.»

Interpretation:

- Author: user.
- Subject: user.
- Evidence attribution: user.
- Provenance: supports.
- Temporal status: known_start.
- Temporal validity start: March 2026, month precision.
- Validity end: unknown.
- No exact day may be invented.

10.2 Reported third-party statement

Original message:

«My manager told me the office will close in December.»

Interpretation:

- Author: user.
- Reported speaker: manager.
- Subject: office or organisation, depending on the extracted claim.
- Evidence attribution: third party, with the quoted-speaker annotation.
- Provenance: supports the fact that the user reported this statement.
- It does not independently establish that the office will close.

The memory must retain the reported nature of the claim.

10.3 Assistant-generated suggestion

Original message:

«You might benefit from moving to a larger flat.»

Interpretation:

- Author: assistant.
- Evidence attribution: assistant.
- The statement is a suggestion, not a user preference or confirmed personal fact.
- It must not become an active user memory without separate user evidence or explicit confirmation.

10.4 Changing preference

Earlier message:

«I prefer working in the morning.»

Later message:

«I've started preferring afternoons.»

Interpretation:

- Two separate evidence records.
- Both statements retain their original timestamps.
- The later statement may qualify or supersede the earlier preference only if the context establishes a genuine change.
- The earlier preference may become historical.
- A later message timestamp alone is not sufficient proof of supersession.

10.5 Unknown date

Original message:

«I lived there for a few years.»

If the start and end cannot be established:

- Preserve the original wording.
- Do not invent dates.
- Use "unknown" or an explicitly approximate temporal representation.
- Do not use import time as a substitute.

11. Identity correction and dependent records

11.1 Correction principles

A correction changes Mopapa's interpretation, not the original evidence.

A correction must preserve:

- Previous interpretation.
- Corrected interpretation.
- Reason for correction where supplied.
- Time the correction was recorded.
- Records affected by the correction.

11.2 Correction effects

An identity correction must trigger reassessment of:

- Participant identity references.
- Quoted-speaker annotations.
- Memory subjects.
- Evidence attribution.
- Provenance links.
- Memory relationships.
- Temporal interpretations where identity affects context.
- Retrieval eligibility and answer context.

A correction must not automatically rewrite original message authorship.

11.3 Unresolved corrections

If a correction cannot establish the correct identity:

- Preserve the unresolved state.
- Do not select the most likely person automatically.
- Prevent the affected memory from being presented as an established fact where attribution is essential.
- Allow explicit review later.

11.4 Identity deletion

The global identity deletion model remains unresolved and must be specified before global identity records are introduced.

At minimum, it must define:

- Whether references are detached or reassigned.
- How historical identity corrections are retained.
- How dependent memories are reassessed.
- How deleted identities are handled in backups.
- Whether identity suppression metadata is required.
- How restoration of older backups avoids silently recreating a deliberately deleted identity.

No identity deletion mechanism is authorised by this document.

12. Dataset invariants

The following invariants are required for any future implementation.

12.1 Participant invariants

1. Every participant belongs to exactly one conversation.
2. Participant IDs are unique within their conversation.
3. A participant reference must resolve within the relevant conversation.
4. An unresolved participant is valid.
5. A display name is not a global identity.
6. Global identity references remain disabled until separately approved.

12.2 Message invariants

1. Every message references exactly one existing conversation.
2. Every message has an explicit author object.
3. Participant authors reference a participant in the same conversation.
4. Unknown authors remain valid.
5. Original message text is preserved.
6. Original timestamps are not overwritten.
7. Sequence numbers are valid and unique within their conversation.
8. Import origin is separate from authorship.

12.3 Quoted-speaker invariants

1. Every quoted-speaker annotation belongs to one message.
2. Quoted-speaker IDs are unique within that message.
3. A participant reference must resolve within the same conversation.
4. A quotation span must be valid against the original message text.
5. An unresolved speaker remains unresolved.
6. A quoted speaker is not automatically the message author.
7. Reported speech is not independent confirmation.

12.4 Memory subject invariants

1. Subject identity is separate from evidence attribution.
2. A subject may remain unknown.
3. A subject label is not proof of identity.
4. Cross-conversation identity matching is disabled.
5. Corrections trigger dependent-record reassessment.

12.5 Provenance invariants

1. Every provenance record references an existing memory.
2. Every provenance record references an existing message.
3. Every non-null quoted-speaker reference resolves within that message.
4. Every evidence span is valid against the original message text.
5. Every relationship has one defined meaning.
6. "context_only" never establishes support.
7. "refutes" never establishes support.
8. "qualifies" must be assessed for its effect on the complete claim.
9. Deleted or revoked evidence is not treated as currently valid support.
10. A memory's evidence state must reflect all relevant remaining provenance.

12.6 Temporal invariants

1. Original message time is separate from import time.
2. Import time is separate from recording time.
3. Recording time is separate from validity time.
4. Unknown values remain unknown.
5. Date-only values remain date-only.
6. Approximate values remain approximate.
7. Timezone information is not invented.
8. Known intervals have valid boundary ordering.
9. Later recording does not automatically establish later validity.
10. Historical information remains distinguishable from current information.

13. Invalid data examples

The following must be rejected or explicitly treated as unresolved.

Invalid condition| Required behaviour
Participant author references a missing participant| Reject the record.
Participant belongs to another conversation| Reject the reference.
Unknown author has a participant ID| Reject the record.
Quoted-speaker ID is referenced from another message| Reject the provenance link.
Evidence span ends beyond message length| Reject the span or require explicit whole-message evidence.
Evidence span uses negative offsets| Reject.
Evidence start is equal to or greater than end| Reject.
Unknown timezone is silently treated as UTC| Reject the conversion.
Date-only value is converted to midnight UTC| Reject the conversion.
Approximate date is represented as exact| Reject the normalisation.
Validity start is later than validity end| Reject the temporal object.
Source attribution conflicts with known author and quotation data| Mark unresolved or reject the inconsistent record.
Global identity key has no approved authoritative target| Reject the reference.
A context-only source is counted as supporting evidence| Reject the evidence calculation.
A reported third-party statement is treated as direct communication| Reject the attribution.

Invalid new records must not be silently discarded while the application reports a fully successful import or restore.

14. Required tests

Before adding tests, inspect "tests/run.js" and "tests/browser.js" for existing coverage.

The following are required test scenarios, not instructions to create duplicate tests.

14.1 Participant tests

- Valid conversation-local participant.
- Duplicate participant ID in one conversation.
- Same display name in two separate conversations.
- Missing participant reference.
- Cross-conversation participant reference.
- Unknown participant.
- Unresolved participant.
- Ambiguous participant.
- Global identity reference rejected while global identity is disabled.
- Identity correction triggers dependent-record reassessment.

14.2 Author tests

- User-authored message.
- Assistant-authored message.
- System message.
- Third-party participant message.
- Unknown author.
- Imported message retaining original authorship.
- Invalid role and author combinations.
- Participant author referencing another conversation.

14.3 Quoted-speaker tests

- Direct quotation.
- Reported speech.
- Paraphrase.
- Uncertain quotation type.
- Unresolved speaker.
- Ambiguous speaker.
- Speaker who is not a conversation participant.
- Nested quotation.
- Multiple quoted speakers in one message.
- Quoted-speaker reference to a missing annotation.
- Quoted-speaker reference to another message.
- Reported statement not treated as independent confirmation.

14.4 Provenance tests

- User directly supports a memory.
- Assistant statement does not become a user fact.
- Third-party reported statement retains quoted-speaker attribution.
- One message supports multiple memories.
- Several messages support one memory.
- Source refutes a memory.
- Source qualifies a memory.
- Context-only source does not establish support.
- Duplicate provenance link rejected.
- Missing memory reference rejected.
- Missing message reference rejected.
- Missing quoted-speaker reference rejected.
- Deletion of one source triggers reassessment.
- Deletion of the final supporting source triggers reassessment.

14.5 Unicode span tests

Use actual source text containing:

- Basic ASCII.
- Emoji represented by surrogate pairs.
- Combining characters.
- Accented characters.
- Non-Latin scripts.
- Mixed Unicode and punctuation.

Verify:

- UTF-16 offset calculation.
- Inclusive start.
- Exclusive end.
- Correct extracted substring.
- Out-of-range rejection.
- Negative offset rejection.
- Empty span rejection.
- Correct highlighting using the same convention.
- No silent offset conversion.

14.6 Temporal tests

- Exact UTC timestamp.
- Timestamp with explicit offset.
- Date-only value.
- Month-only value.
- Year-only value.
- Approximate interval.
- Unknown time.
- Known start with unknown end.
- Known end with unknown start.
- Invalid start/end ordering.
- Equal start/end boundaries.
- Timezone-free timestamp.
- Relative date with known original message timestamp.
- Relative date with unknown original message timestamp.
- Import time not substituted for event time.
- Recording time not substituted for validity time.
- Historical information retained after supersession.
- Approximate dates never displayed as exact.

14.7 Integration tests

- User reports a third-party statement about another person.
- User quotes an assistant suggestion.
- Imported conversation contains multiple participant roles.
- One memory has evidence from several conversations without global identity matching.
- Participant correction triggers memory reassessment.
- Quoted-speaker correction triggers provenance reassessment.
- Temporal correction does not rewrite original message time.
- Backup and restore preserve all attribution and temporal fields.
- Invalid attribution or temporal data cannot partially replace existing data.

14.8 Duplicate test prevention

Before implementing any test:

1. Search for an existing equivalent scenario.
2. Extend the existing test if it already covers the same behaviour.
3. Add a new test only when it establishes a genuinely distinct invariant.
4. Avoid duplicate test titles.
5. Confirm both unit and browser test suites remain consistent.

No test files are changed by this specification.

15. Unresolved decisions

The following issues remain open and must not be silently decided during implementation.

ID| Issue| Required resolution
U1| Global identity ownership| Separate identity specification and explicit approval.
U2| Global identity storage| Decide whether a sixth collection is justified.
U3| Identity merge and unmerge| Define reversible operations and evidence requirements.
U4| Whole-message evidence| Select exact representation for missing or unreliable offsets.
U5| Source timestamp preservation| Decide whether the original raw timestamp string must be retained alongside normalised time.
U6| Approximate temporal bounds| Define deterministic normalisation rules and limits.
U7| Nested quotation representation| Define whether nested annotations require explicit parent-child relationships.
U8| Compound claims| Define whether claim-level provenance requires a later schema refinement.
U9| Identity deletion| Complete privacy, retention and reference-handling policy.
U10| Attribution conflicts| Define the final validation and abstention behaviour for conflicting source attribution.

These are design questions, not permission to improvise during implementation.

16. Approval and implementation boundary

This document proposes a foundational model.

It does not authorise:

- Production JavaScript changes.
- Live schema changes.
- Schema version 2 activation.
- A new storage key.
- IndexedDB migration.
- Any sixth top-level collection, including a global "identities" collection or an "importLedger" collection.
- Global identity matching.
- Automatic identity merging.
- Automatic ingestion from other applications.
- External AI or paid APIs.
- Cloud synchronisation.
- External sharing.
- Replacing manual entries.
- Replacing deterministic Ask.

The five logical collections remain the current proposed storage model.

Conversation-local participants remain the initial identity boundary.

The original message remains the authoritative evidence.

Extracted memories remain derived interpretations.

The existing application remains unchanged until the full design, migration, backup, restore, governance and evaluation requirements have been reviewed and explicitly approved.

17. Next work

After this document has been reviewed, the next design work should address:

1. Lifecycle transition rules.
2. Evidence-state calculation.
3. Governance policy-combination tables.
4. Scope and audience reference rules.
5. Deletion and revocation transactions.
6. Import idempotency and deletion suppression.
7. Backup and restore compatibility matrix.
8. Representative conversation archive benchmark.

Only after those areas are complete should migration design be finalised.

Production implementation requires a separate explicit approval.

---

Current decision: Identity, authorship, quoted-speaker attribution, provenance and temporal semantics have been specified as a proposed model. Conversation-local identity remains the initial boundary. Global identity resolution remains disabled. The live application and schema remain unchanged.