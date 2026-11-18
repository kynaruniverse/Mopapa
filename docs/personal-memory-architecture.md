Mopapa: Personal Memory Architecture

Status: Proposed architecture
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
- "status": active, archived or deleted.

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
- "status": active, historical, uncertain, dismissed or deleted.
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