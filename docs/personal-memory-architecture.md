Mopapa: Personal Memory Architecture

Status: Approved target architecture direction, implementation not authorised
Product direction: Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa
Implementation policy: Incremental evolution of the existing application
Current architecture: Vanilla JavaScript, ES5-compatible IIFEs, browser DOM and localStorage

---

1. Purpose

Mopapa is intended to evolve from a manually maintained personal-memory application into a local-first personal memory system.

The long-term product should be able to receive information through conversations and other user-authorised sources, identify potentially useful memories, preserve their original evidence, recognise changes over time and retrieve information when asked.

The user should not have to manually organise every piece of information for Mopapa to remember it.

Automatic memory is the intended long-term experience. Users must nevertheless retain meaningful control over what is stored, how it is interpreted, how long it is retained and when it is deleted.

This document defines the intended architecture and the constraints future engineering work must respect.

It does not authorise immediate production implementation of every proposed component.

2. Product principles

The following principles are architectural requirements.

2.1 Local-first

- Personal information should remain on the user's device by default.
- No cloud synchronisation or remote account requirement without a separate product and security decision.
- No external AI API or paid service dependency without an explicit decision supported by evidence.
- Storage technology must be selected using measured requirements, not assumptions.

2.2 Automatic, but controllable

- Mopapa should eventually identify useful memories without requiring the user to create a separate note for every fact.
- Automatically extracted information must remain inspectable.
- Users must be able to correct, dismiss and delete memories.
- Original evidence must remain distinguishable from extracted interpretations.
- The application must not imply that information has been safely remembered if persistence failed.

2.3 Evidence before answers

- Answers must be grounded in stored evidence.
- The system must preserve links between answers, extracted memories and their original sources.
- Unsupported questions must receive an appropriate abstention or clarification.
- Confidence must not be presented as proof.
- A plausible guess must never be substituted for missing evidence.

2.4 Preserve history

- A changed fact must not automatically erase its previous value.
- The system must distinguish current information from historical information.
- Conflicting statements must not be silently resolved when the evidence is insufficient.
- Original timestamps and source information must be retained.

2.5 Incremental engineering

- Preserve existing working functionality wherever possible.
- Avoid replacing established modules without demonstrated need.
- Do not introduce a framework, database or model dependency merely because another memory system uses it.
- Every architectural change must have a defined migration, testing and recovery strategy.

3. Current application baseline

The existing application is the foundation, not disposable prototype code.

Current characteristics:

- Vanilla JavaScript and ES5-compatible IIFEs.
- Browser DOM interface.
- "window.Mopapa" application namespace.
- "localStorage" primary persistence.
- Existing "mopapa.v1" storage key and schema version 1.
- Manual Keep and Ask interaction.
- Entries organised by rooms.
- Existing structured extraction for supported information.
- Deterministic Ask and specialised answer modules.
- Source-backed answers and selected clarification and abstention behaviour.
- Existing backup, restore and recovery safeguards.
- Automated unit and browser testing.

The existing entry model includes fields such as:

- "id"
- "text"
- "room"
- "when"
- "hasTime"
- "amount"
- "fact"
- "amounts"
- "created"
- "done"

The existing Ask system includes specialised handling for dates, costs, locations, people, matching, ranking, aliases and answer resolution.

These capabilities must be assessed and reused before introducing replacements.

The current application does not yet provide a general persistent conversation-history model or a complete automatic personal-memory ingestion lifecycle.

4. Target information model

The eventual architecture must distinguish original information from interpretations derived from it.

There are four principal information concepts.

4.1 Conversations

A conversation represents a continuous interaction or imported conversation history.

Proposed fields:

- "id": stable unique identifier.
- "createdAt": conversation creation timestamp.
- "updatedAt": most recent activity timestamp.
- "origin": source of the conversation.
- "title": optional display title.
- "status": active or archived. Conversation deletion is handled by the deletion operation, not by a retained status value.

A conversation groups messages. It is not itself a substitute for individual message records.

4.2 Messages

A message is an original unit of information within a conversation.

Proposed fields:

- "id": stable unique identifier.
- "conversationId": parent conversation.
- "role": user, assistant or other explicitly supported source.
- "text": original message content.
- "timestamp": original message timestamp, when available.
- "sequence": ordering within the conversation.
- "origin": source or import method.
- "createdAt": time received or imported by Mopapa.

Messages must preserve their original content and attribution.

Do not rewrite original messages to make extracted memories easier to search.

If a timestamp is unavailable or uncertain, record that limitation rather than inventing a precise time.

4.3 Memories

A memory is an extracted or manually supplied piece of information that Mopapa can retrieve independently.

Proposed fields:

- "id": stable unique identifier.
- "type": supported memory category.
- "content": concise representation of the information.
- "subject": person, object, event or topic, when identified.
- "validFrom": when the information became true, if known.
- "validTo": when it stopped being current, if known.
- "recordedAt": when Mopapa received or extracted it.
- "sourceMessageIds": original supporting message references.
- "confidence": extraction confidence, where meaningful.
- "status": candidate, active, historical, uncertain or dismissed. Deletion is an operation that removes the applicable record from the active dataset.
- "createdAt": memory creation timestamp.
- "updatedAt": most recent modification timestamp.

Initial memory categories should be limited and evidence-led:

- Personal facts.
- Preferences.
- People and relationships.
- Events and experiences.
- Plans and intentions.
- Tasks and commitments.
- Locations.
- Financial information.
- Corrections and changes.

Categories must not become a rigid requirement for every memory. Uncertain or unclassified information must remain representable.

4.4 Relationships and provenance

A memory must be traceable to its supporting evidence.

The architecture should support relationships such as:

- Memory extracted from message.
- Memory supported by multiple messages.
- Memory supersedes an earlier memory.
- Memory contradicts another memory.
- Memory relates to a person or subject.
- Answer supported by retrieved memories.

Relationships must not be invented merely because two records contain similar words.

A relationship should be stored only when the system has sufficient evidence to justify it.

5. Memory ingestion lifecycle

The intended automatic ingestion lifecycle is:

1. Receive a user-authorised message or information source.
2. Preserve the original information.
3. Identify potentially useful facts, preferences, events and changes.
4. Extract candidate memories.
5. Associate each candidate with its original evidence.
6. Check for duplicates and existing related memories.
7. Identify possible updates or contradictions.
8. Store valid memories without destroying historical evidence.
9. Make the new information available to retrieval.
10. Report meaningful failures and allow user correction.

Ingestion must be safe to retry.

A failed extraction must not corrupt the original message.

A failed memory save must not be reported as successful.

Repeated processing of the same message must not create uncontrolled duplicate memories.

5.1 Automatic memory policy

Automatic memory is the intended experience, but the system must distinguish:

- Original user statements.
- Assistant-generated statements.
- Imported third-party information.
- Extracted interpretations.
- Uncertain inferences.

An assistant-generated statement must not automatically become a user fact.

Information from imported conversations must retain its origin.

The user must be able to inspect what has been extracted and correct or remove it.

5.2 Extraction strategy

Begin with deterministic extraction where it can reliably identify information.

More advanced extraction may be considered later, but only after defining:

- Local execution requirements.
- Privacy implications.
- Resource and performance limits.
- Failure handling.
- Confidence calibration.
- Evidence requirements.
- Dependency and licensing implications.

No external AI service is a prerequisite for this architecture.

6. Knowledge updates and historical information

A central requirement is distinguishing a changed fact from an unrelated fact.

Example:

- Original statement: I work at Company A.
- Later statement: I now work at Company B.

The system should preserve both statements and identify that the newer information may supersede the older information.

It must be possible to answer:

- Where do I work now?
- Where did I work previously?
- When did I change jobs?
- What evidence supports that information?

The system must not assume that every newer statement replaces every older statement.

Updates require a relationship between the relevant facts and sufficient supporting evidence.

When the relationship is uncertain, preserve both facts and ask for clarification when necessary.

Historical values must remain available until the user deletes them or an explicit retention policy applies.

7. Retrieval architecture

Retrieval should evolve progressively.

7.1 Existing deterministic retrieval

Preserve the current Ask engine and its specialised capabilities.

Continue to use:

- Query interpretation.
- Structured date, cost and location handling.
- Matching and ranking.
- Clarification where multiple memories are plausible.
- Source-backed responses.
- Conservative abstention.

7.2 Fact-aware indexing

Introduce additional searchable information derived from memories.

Potential index fields include:

- Original message text.
- Extracted memory content.
- Subjects and names.
- Supported aliases.
- Dates and temporal references.
- Related memory identifiers.
- Source references.

An index must remain rebuildable from authoritative stored information.

Do not make a derived search index the only copy of a memory.

7.3 Cross-conversation retrieval

The eventual system must retrieve evidence across separate conversations and manual entries.

It should be able to identify information that is:

- Mentioned once.
- Repeated across conversations.
- Updated later.
- Contradicted by another statement.
- Relevant only within a particular time period.

7.4 Semantic retrieval

Semantic search is a possible later capability, not an immediate requirement.

It must be evaluated against the existing lexical and structured retrieval approach.

Any embedding model or semantic index must have a clear local execution, storage, privacy, licensing and performance decision.

Do not introduce semantic search simply because it appears in an external benchmark implementation.

8. Answer generation and trust

The answer layer must remain separate from ingestion and retrieval.

Its responsibilities are:

1. Interpret the question.
2. Retrieve candidate memories.
3. Assess whether the evidence is sufficient.
4. Resolve chronology and conflicting information.
5. Select an appropriate answer, clarification or abstention.
6. Return supporting sources.
7. Avoid unsupported factual claims.

The system must distinguish:

- A directly stated fact.
- A fact supported by several statements.
- A reasonable but uncertain interpretation.
- Information that cannot be established.

Answers must not hide uncertainty.

A source reference must point to information that actually supports the answer.

The existing deterministic Ask engine remains the initial answer implementation. Any future change must demonstrate a measurable improvement without weakening source grounding or abstention.

9. Storage architecture and migration

The existing localStorage implementation must remain stable until a measured requirement justifies changing it.

Conversation history may create larger storage requirements, but this alone is not sufficient evidence for an immediate migration.

Before selecting a new storage technology, measure:

- Expected message volume.
- Typical message size.
- Search and retrieval latency.
- Storage growth.
- Backup and restore performance.
- Quota behaviour.
- Recovery reliability.
- Mobile browser compatibility.

IndexedDB may be evaluated when those measurements demonstrate a need.

9.1 Migration requirements

Any future storage migration must:

- Preserve existing user entries.
- Preserve Ask learning data where applicable.
- Preserve custom rooms and existing settings.
- Validate migrated records.
- Be safe to retry.
- Avoid duplicate records.
- Provide a recoverable failure path.
- Preserve export and restore functionality.
- Never silently discard existing data.

The existing "mopapa.v1" schema must not be changed casually.

Schema changes require explicit versioning, migration tests and backup compatibility tests.

9.2 Backup and restore

Backups must eventually include all supported data domains:

- Existing entries.
- Conversations.
- Messages.
- Extracted memories.
- Memory relationships.
- Relevant indexes or rebuildable index metadata.
- User settings and learning data.

Restore validation must cover the new domains and their relationships.

A partial restore must not leave the application in an inconsistent state.

Existing recovery safeguards remain non-negotiable.

10. Privacy, deletion and user control

Personal memory contains sensitive information even when the user has not explicitly classified it as sensitive.

The architecture must provide:

- A way to inspect stored conversations and memories.
- A way to correct extracted information.
- A way to dismiss an unwanted extraction.
- A way to delete individual memories.
- A way to delete conversations and their associated derived memories.
- Clear behaviour for shared evidence supporting multiple memories.
- Export and backup controls.
- Clear disclosure of local storage limitations.

Deleting a source message must not leave misleading memories that appear to have independent evidence.

Where a memory has multiple supporting sources, deletion must preserve valid remaining evidence and update its provenance.

No cloud transmission or external processing should be introduced without a separate explicit privacy and security review.

11. Performance and reliability requirements

The system must remain usable on ordinary mobile devices.

Future implementation must consider:

- Large conversation histories.
- Bounded extraction work.
- Efficient retrieval.
- Index rebuilds.
- Storage quotas.
- Interrupted writes.
- Browser reloads.
- Duplicate ingestion.
- Corrupt or incomplete records.
- Backup size and recovery time.

No background operation should silently report success when it has failed.

The user must be able to understand when information has been received, processed, stored or rejected.

12. Evaluation strategy

Evaluation must distinguish different capabilities.

12.1 Existing Mopapa regression suite

Preserve the existing curated Ask regression tests.

Do not weaken assertions to improve scores.

Do not describe curated test results as general real-world accuracy.

12.2 Existing 50-question evaluation

Keep the 50-note evaluation independent.

It measures behaviour over the existing note-oriented memory model and should remain a regression safeguard while the product evolves.

12.3 LongMemEval external evaluation

Use LongMemEval as an external research benchmark.

Its capabilities of interest include:

- Single-session recall.
- Multi-session reasoning.
- Knowledge updates.
- Temporal reasoning.
- Abstention when information is unavailable.

The existing 25-question Oracle subset is a diagnostic fixture.

It tests interpretation and reasoning over supplied evidence. It does not establish retrieval performance over a large irrelevant conversation history.

Do not merge its results into the existing 50-question score.

Further evaluation should use non-oracle benchmark material when testing retrieval itself.

Benchmark transformations must preserve source attribution, timestamps, conversation boundaries and original question meaning.

External benchmark results must be reported separately from Mopapa-native regression results.

12.4 Required evaluation measures

As the system develops, measure:

- Answer correctness.
- Retrieval recall.
- Retrieval precision.
- Source support.
- Appropriate abstention.
- Unsupported factual claims.
- Knowledge-update handling.
- Temporal reasoning.
- Duplicate memory creation.
- Memory extraction quality.
- Storage and retrieval performance.

Do not optimise answer rate at the expense of correctness.

13. Architecture boundaries

The following decisions are explicit.

Preserve

- Existing vanilla JavaScript architecture.
- Local-first behaviour.
- Deterministic Ask as the initial answer engine.
- Source-backed answers.
- Existing entry model and functionality.
- Backup, restore and recovery safeguards.
- Existing regression tests.

Extend

- Data model.
- Conversation and message storage.
- Memory provenance.
- Knowledge-update handling.
- Retrieval and indexing.
- Evaluation coverage.
- User inspection and correction.

Defer

- IndexedDB migration until measured need.
- Semantic embeddings until evaluated.
- External AI APIs.
- Cloud synchronisation.
- Accounts and multi-device support.
- Multimodal ingestion.
- Complex knowledge graphs.
- Automatic ingestion from external applications.
- Major interface redesign.

Reject as default architectural direction

- Replacing deterministic Ask with an ungrounded LLM answer.
- Treating an entire conversation as one indivisible memory.
- Discarding original evidence after extracting facts.
- Silently overwriting historical information.
- Saving assistant-generated statements as user facts without attribution.
- Introducing dependencies without a defined need.
- Rewriting reliable existing systems without evidence that replacement is necessary.

14. Phased engineering roadmap

The phases below are ordered dependencies, not permission to implement everything at once.

Phase 1: Architecture and measurement

- [ ] Approve this architecture specification.
- [ ] Map current modules against the target architecture.
- [ ] Identify existing functionality that can be reused.
- [ ] Establish the external benchmark harness separately from existing evaluations.
- [ ] Record current limitations and measurable baselines.

Phase 2: Data model and compatibility

- [ ] Define conversation and message schemas.
- [ ] Define memory and provenance schemas.
- [ ] Define update and contradiction relationships.
- [ ] Define stable identifiers and validation rules.
- [ ] Define backup and restore compatibility.
- [ ] Define migration and rollback requirements.

Phase 3: Storage foundation

- [ ] Evaluate expected conversation storage volume.
- [ ] Measure existing localStorage limits and performance.
- [ ] Decide whether localStorage remains sufficient or IndexedDB is justified.
- [ ] Implement the chosen storage boundary.
- [ ] Test migration, recovery and backup behaviour.

Phase 4: Memory ingestion

- [ ] Implement original message preservation.
- [ ] Implement deterministic candidate extraction.
- [ ] Implement source provenance.
- [ ] Implement duplicate detection.
- [ ] Implement historical update handling.
- [ ] Implement user correction and dismissal.
- [ ] Measure extraction quality.

Phase 5: Retrieval

- [ ] Index original messages and extracted memories.
- [ ] Extend existing lexical retrieval.
- [ ] Add evidence-aware cross-conversation retrieval.
- [ ] Improve temporal and knowledge-update reasoning.
- [ ] Evaluate semantic retrieval only if lexical retrieval has demonstrated limitations.
- [ ] Preserve grounded answers and abstention.

Phase 6: User experience

- [ ] Introduce persistent conversation history.
- [ ] Show memory-processing state accurately.
- [ ] Provide a memory inspection interface.
- [ ] Provide correction and deletion controls.
- [ ] Integrate conversation recall into Ask.
- [ ] Test the complete mobile experience.

Phase 7: Long-term expansion

- [ ] Evaluate additional user-authorised input sources.
- [ ] Evaluate optional import and export integrations.
- [ ] Assess multi-device requirements separately.
- [ ] Reassess privacy, security and storage architecture as usage grows.

15. Rules for future engineering decisions

Before implementing a new capability:

1. Identify the user problem it solves.
2. Identify which architectural layer owns it.
3. Inspect existing code for reusable functionality.
4. Check existing tests for duplicate coverage.
5. Define expected behaviour and failure behaviour.
6. Define data and migration implications.
7. Add tests for the actual requirement.
8. Preserve existing safeguards.
9. Verify the pushed repository and CI results.
10. Update the project checklist only after the work is verified.

Do not implement future phases prematurely.

The live repository remains the source of truth for implementation status.

This document defines intended architecture, not completed functionality.

---

Current architectural conclusion

Mopapa should evolve into a local-first personal memory system that automatically identifies and preserves useful information from user-authorised conversations and other sources.

The original evidence, extracted memories and generated answers must remain distinct and traceable.

The existing application is the foundation. Its reliability, deterministic reasoning, source attribution and recovery work should be preserved and extended.

The next engineering task after approving this specification is a detailed module-by-module architecture mapping, followed by a separate external benchmark harness.

No production rewrite is authorised by this document.

---

16. Approved target architecture alignment

Decision date: 19 November 2026

Authority: This section records the approved target direction. Where earlier sections contain a conflicting proposal, this section takes precedence. The existing implementation remains unchanged until individual engineering stages are separately authorised.

16.1 Product objective

Mopapa is to evolve into a personal memory companion that can automatically identify, preserve, organise and retrieve useful information from conversations and other sources explicitly provided or authorised by the user.

The objective is dependable memory, not maximum collection or maximum answer rate.

The system must preserve original evidence, distinguish it from interpretations, recognise changes over time, respect memory restrictions and provide evidence-grounded answers.

16.2 Six distinct architectural layers

The target architecture must keep the following responsibilities separate.

1. Original evidence
   
   - Preserve original messages and authorised source material.
   - Retain source identity, authorship, ordering and timestamps where available.
   - Never rewrite original evidence to make it easier to process.
   - Preserve uncertainty about missing or unreliable metadata.

2. Candidate extraction
   
   - Identify potentially useful information.
   - Produce candidate memories rather than immediately treating every extraction as established fact.
   - Preserve the exact supporting evidence.
   - Distinguish explicit statements from interpretations and inferences.
   - Permit extraction to fail without damaging original evidence.

3. Stored memory
   
   - Represent useful information independently of the original message.
   - Support episodic, semantic and relational memory.
   - Preserve historical information and changes.
   - Keep temporary working context separate from permanent memory.
   - Defer procedural memory until the foundational lifecycle is reliable.

4. Memory relationships and governance
   
   - Track evidence, attribution, subjects, scope and restrictions.
   - Represent support, contradiction and supersession explicitly.
   - Handle correction, dismissal, revocation and deletion.
   - Prevent unsupported, restricted or deleted information from being used as established knowledge.

5. Retrieval and context assembly
   
   - Retrieve relevant evidence and memories.
   - Respect temporal validity, attribution, scope and restrictions.
   - Distinguish current from historical information.
   - Assemble only the context needed for the current request.
   - Keep temporary context separate from permanent storage.

6. Answering
   
   - Preserve the existing deterministic Ask engine as the initial answer system.
   - Use retrieved evidence rather than unsupported inference.
   - Identify conflicting or insufficient evidence.
   - Clarify or abstain when appropriate.
   - Make the supporting source inspectable.

These layers are logical responsibilities. They do not require six separate databases or six separate application frameworks.

16.3 Memory categories

The target system distinguishes the following memory types.

- Episodic: events and experiences with their context.
- Semantic: facts, preferences and other general knowledge.
- Relational: supported connections between people, subjects, events and memories.
- Procedural: learned methods or recurring ways of completing tasks. Deferred.
- Working memory: temporary context assembled for the current interaction. Not automatically permanent.

These types describe the nature of information, not its evidence quality or permission to use it.

A memory may be semantic and historical, episodic and disputed, or relational and restricted. These dimensions must remain independent.

16.4 Attribution, participants and subject identity

The architecture must distinguish the following concepts:

- The conversation containing the original information.
- The participant who authored the original message.
- The role assigned to the message by its source.
- A speaker quoted or described inside the message.
- The person or entity the information concerns.
- The source or import mechanism through which Mopapa received it.
- Mopapa's interpretation of the information.

These concepts must not be collapsed into a single author or subject field.

Participant identity

The initial participant identity model must be conversation-local.

Each participant must have a stable identifier within its originating conversation.

A source-provided participant identifier should be retained where available, alongside any display name or other source metadata.

The logical model must not assume that a participant in one conversation is the same person as a participant in another conversation.

Cross-conversation identity matching requires a separate, explicit identity-resolution process. Similar names, writing style, quoted names or contextual resemblance are insufficient evidence to establish identity.

Unknown participants must remain representable without inventing an identity.

Message authorship and quoted speakers

The original message author must remain distinct from:

- The role assigned to the message by the source.
- A person quoted within the message.
- A person mentioned within the message.
- The subject of a memory extracted from the message.

A quoted speaker must not automatically be treated as the message author.

A person mentioned in a message must not automatically be treated as its author or as the subject of every extracted statement.

Attribution classes

Supported attribution classes must include:

- User.
- Assistant.
- Third party.
- Unknown.

Import origin must be represented separately from authorship. An imported source may contain information authored by the user, an assistant or a third party.

These classes describe authorship or unresolved attribution. They do not establish whether the information is true.

Subject representation

The subject of a memory must be represented independently from the message author.

A statement about the user is not necessarily a statement made by the user.

A statement made by the user is not necessarily about the user.

A statement about a third party must not become a personal fact about the user merely because it appears in the user's conversation history.

Where the subject cannot be established reliably, it must remain unknown or unresolved.

Evidence spans and attribution corrections

Where a memory is supported by only part of a message, its evidence reference should identify the relevant source span where the source format permits this.

Evidence spans must retain their relationship to the original, unchanged message.

Corrections to participant identity, authorship or subject attribution must be traceable.

An identity correction must not silently rewrite original message content or erase the previous attribution decision.

Affected memories and relationships must be reassessed when an attribution correction changes their interpretation.

Imported material must retain its original speaker attribution wherever that information is available.

Unknown authorship or subject identity must remain explicitly unknown. The system must not infer either from conversational wording alone.

16.5 Memory lifecycle and state separation

Memory processing must distinguish the following stages:

1. Authorised source received.
2. Original evidence preserved.
3. Candidate information identified.
4. Candidate attributed to its source.
5. Candidate linked to its supporting evidence.
6. Existing memories checked for duplication, updates and contradictions.
7. Scope and restrictions assessed.
8. Candidate validated or rejected.
9. Memory stored in an appropriate state.
10. Memory made available to permitted retrieval.
11. Memory inspected, corrected, restricted, dismissed or deleted when required.

The following dimensions must not be collapsed into one status field:

- Memory lifecycle state.
- Evidence state.
- Attribution.
- Subject.
- Temporal validity.
- Scope.
- Use restrictions.
- Deletion operation and outcome.

The permitted memory lifecycle states are:

- Candidate.
- Active.
- Historical.
- Uncertain.
- Dismissed.

Evidence state is independent and uses:

- Supported.
- Partially supported.
- Unsupported.
- Disputed.
- Unverified.

Deletion is not a lifecycle state. A completed deletion removes the applicable record from the active dataset under the approved deletion and recovery policy.

A newer statement must not automatically supersede an older memory. Supersession requires evidence that the information concerns the same subject and changing fact.

Contradictory evidence must remain visible until the conflict can be resolved appropriately.

16.6 Scope, audience visibility and use policy

The architecture must treat scope, audience visibility and use permissions as three independent dimensions.

They answer different questions:

- Scope: Where, when or in what context does this information apply?
- Audience: Who is permitted to see or receive this information?
- Use policy: What is Mopapa permitted to do with this information?

These dimensions must not be collapsed into a single privacy, visibility or permission flag.

Scope

The logical model must support the following scope types:

- Personal.
- Conversation.
- Project.
- Topic.
- Event.
- Relationship.
- Other explicitly defined context.
- Unknown.

A scope reference must identify the context to which it applies where that context can be established.

Unknown scope must remain explicitly unknown.

Information originating in a conversation must not automatically become general personal knowledge.

Information associated with a project must not automatically become applicable to unrelated projects or general personal contexts.

Repeated mentions within a narrow context must not, by themselves, broaden that information into unrestricted personal scope.

Audience visibility

The logical model must distinguish:

- Owner-only information.
- Information available to an explicitly named audience.
- Information restricted to a particular context.
- Information with unknown or unresolved audience permissions.

The initial single-user, local-first product must default to owner-only visibility.

Imported conversation participants must not automatically become authorised recipients of stored information.

A memory about another person must not automatically become shareable with that person.

Unknown audience permissions must be treated conservatively.

Use policy

Use permissions must be represented independently from audience visibility.

The logical model must distinguish permission for:

- Direct answers to the owner.
- Contextual use in an answer to the owner.
- Proactive surfacing.
- Cross-context reuse.
- Inference or derivation.
- Export or disclosure.

Permission for one use must not automatically grant permission for another.

Proactive surfacing and cross-context reuse must be denied unless explicitly permitted.

External sharing must not be inferred from permission to retain or retrieve information locally.

Restrictions and inheritance

Restrictions must be capable of expressing prohibitions such as:

- No proactive surfacing.
- No cross-context reuse.
- No use outside a specified audience.
- No use for a specified purpose.
- No inference or derivation.
- No export or external disclosure.
- No use outside a specified time period.

Derived memories must inherit applicable restrictions from their supporting evidence.

Where several sources support one memory, their applicable restrictions must be combined conservatively.

A less restrictive source must never override an explicit restriction from another applicable source.

An explicit denial must take precedence over an otherwise permissive rule.

Unknown, missing or conflicting permission information must result in denial of the disputed use until it is resolved.

Retrieval enforcement

Governance must be checked before information enters retrieval context or answer context.

Retrieval must consider:

- Current conversation and project context.
- Scope applicability.
- Audience permissions.
- Use permissions.
- Source restrictions.
- Temporal validity.
- Evidence state.
- Deletion and revocation.
- Supersession and contradiction.

Information that is prohibited from the current use must not enter the answer context merely because it was found by search.

The same restrictions must apply to summaries, caches, derived indexes and other secondary representations.

Proactive use requires its own permission check. Permission to answer a direct question does not grant permission to surface the same information proactively.

Backup and export

Internal backup and restore must be distinguished from external export or disclosure.

Backup and restore must preserve the applicable scope, audience and use-policy metadata.

An export process must not silently remove restrictions or broaden permissions.

If an export format cannot preserve the applicable restrictions, restricted information must be excluded or the user must be clearly informed before proceeding.

Implementation boundary

These are logical architecture requirements, not approval to implement new sharing or access capabilities.

They do not authorise:

- External sharing.
- Multi-user access.
- Cloud synchronisation.
- Third-party processing.
- Automatic access to other applications.
- Proactive notifications.
- Production schema changes.
- Changes to existing manual-entry behaviour.
- Storage migration.

All such changes require separate design, security review and explicit approval.

16.7 Automatic processing without paid services

The first implementation strategy must investigate deterministic processing.

Potential initial capabilities include:

- Original message preservation.
- Stable identity and duplicate detection.
- Source attribution.
- Rule-based classification.
- Explicitly stated facts and preferences.
- Structured dates and entities.
- User-confirmed updates.
- Evidence-linked memory records.
- Lexical and structured retrieval.

Deterministic processing will not reliably solve every conversational extraction problem. Mopapa must preserve uncertain candidates rather than manufacture certainty.

A local language model may be investigated only if deterministic processing demonstrates a material limitation that affects the product.

Any such investigation must consider device compatibility, memory use, battery consumption, offline operation, model size, licence, accuracy and false-memory rates.

No local model, external model, AI API or hosted inference service is approved for implementation by this architecture decision.

16.8 Storage decision

The current localStorage implementation remains in place.

IndexedDB is a serious candidate for future conversation archive storage, but no migration is approved.

A storage decision must follow measurements of:

- Expected conversation and message volume.
- Typical message size.
- Storage growth.
- Save and retrieval latency.
- Search performance.
- Backup and restore time.
- Quota behaviour.
- Recovery after interrupted writes.
- Mobile browser compatibility.

Do not introduce two competing authoritative storage systems.

Any eventual migration requires a separate approved design, compatibility plan, tests and recovery procedure.

16.9 Cost and privacy constraints

Development must remain free of recurring financial obligations.

No paid APIs, hosted inference, paid databases, cloud storage, paid subscriptions or hidden paid fallbacks may be introduced without a separate explicit decision.

Personal information remains on the device by default.

Automatic memory means processing information the user provides to Mopapa or explicitly authorises it to import. It does not authorise silent access to other Android applications or collection without permission.

No cloud synchronisation, account system or external processing is approved by this architecture decision.

16.10 Evaluation boundaries

Memory quality must be evaluated as separate capabilities:

- Source capture and preservation.
- Attribution accuracy.
- Extraction precision and recall.
- False-memory rate.
- Duplicate handling.
- Update and contradiction handling.
- Evidence integrity.
- Scope and restriction compliance.
- Deletion and revocation compliance.
- Retrieval precision and recall.
- Answer correctness.
- Abstention quality.
- Performance and storage reliability.

The existing Mopapa regression suite, existing 50-question evaluation, LongMemEval fixtures and any future external benchmarks must remain separately identifiable.

No single aggregate score may hide a serious provenance, privacy, deletion or governance failure.

16.11 Approved engineering order

The target direction is to proceed in this order:

1. Align the architecture and data-model specifications.
2. Complete the module-to-responsibility mapping.
3. Finalise record schemas, attribution, scope and restrictions.
4. Define lifecycle transitions and evidence rules.
5. Define deletion, revocation and provenance behaviour.
6. Define backup, restore, migration and rollback requirements.
7. Measure realistic storage requirements.
8. Make a separate storage decision.
9. Extend storage only after that decision.
10. Preserve authorised conversations and messages.
11. Implement deterministic candidate extraction.
12. Implement provenance and memory governance.
13. Extend retrieval while preserving deterministic Ask.
14. Build inspection and correction controls.
15. Evaluate the complete lifecycle.

Each stage requires its own implementation plan and approval. Documentation approval does not authorise production implementation.

16.12 Final architectural decision

Mopapa will evolve as a local-first, evidence-preserving personal memory system.

Original evidence, extracted memories, memory governance, retrieval context and answers remain distinct.

The existing application is the foundation. Its manual entries, deterministic Ask, storage safeguards and recovery behaviour must be preserved.

Automatic memory is the long-term product objective. It must be achieved without silently collecting information, inventing facts, losing provenance or introducing recurring costs during development.

No wholesale rewrite, paid AI dependency, cloud service or immediate storage migration is approved.