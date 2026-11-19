Mopapa Personal Memory Companion

Phased Engineering Build Plan

Product: Mopapa Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa
Branch: "main"
Document date: 19 November 2026
Status: Proposed engineering plan. Production implementation not authorised.
Architecture authority: "docs/personal-memory-architecture.md"
Data-model authority: "docs/personal-memory-data-model.md"
Research authority: "docs/personal-memory-research-review.md"
Existing implementation map: "docs/personal-memory-module-map.md"
Storage authority: "docs/storage-architecture.md"

---

1. Purpose

This document converts Mopapa's approved target architecture into a phased engineering programme.

It defines:

- The order in which design and implementation work must happen.
- The prerequisites for each phase.
- The unresolved decisions that must be settled before implementation.
- The responsibilities of existing and proposed modules.
- The required evaluation and regression coverage.
- Storage, backup, migration and recovery requirements.
- Acceptance criteria for each phase.
- The conditions under which production implementation may be authorised.

The purpose is to prevent premature implementation, unnecessary rewrites and the introduction of capabilities that cannot yet be tested or safely maintained.

This plan does not claim that automatic conversation memory exists. It does not authorise production code changes, a live schema change, a storage migration or an AI integration.

2. Product objective

Mopapa is intended to become a local-first Personal Memory Companion.

Its long-term purpose is to preserve useful information from conversations and other sources explicitly supplied or authorised by the user, identify potentially useful memories, retain the evidence behind them and retrieve them appropriately in later interactions.

The product should reduce the amount of information users have to remember and manually organise themselves.

It must not achieve that objective by collecting everything indiscriminately, treating uncertain interpretations as facts or sacrificing privacy and reliability for a higher answer rate.

The intended system must eventually support:

1. Original conversation and message preservation.
2. Automatic identification of candidate memories.
3. Explicit source and author attribution.
4. Separation of statement author from statement subject.
5. Independent memory records.
6. Evidence provenance.
7. Historical changes and contradictions.
8. Contextual scope and enforceable use restrictions.
9. Cross-conversation retrieval.
10. Source-grounded answers and appropriate abstention.
11. User inspection, correction, dismissal, restriction and deletion.

3. Authority and implementation boundary

The target architecture direction and logical data-model direction were approved on 19 November 2026.

That approval establishes the intended design direction. It does not authorise implementation.

The following remain unauthorised:

- Production JavaScript changes for the new memory system.
- A change to the live storage schema.
- A change to the existing "mopapa.v1" storage key.
- An IndexedDB migration.
- A local language model.
- A hosted language model or external AI API.
- Paid services or recurring subscriptions.
- Cloud synchronisation or mandatory accounts.
- Automatic access to other applications.
- Replacement of the existing deterministic Ask engine.
- A wholesale rewrite of the existing application.

A phase being documented, designed or accepted does not automatically authorise the next phase.

Each production phase requires explicit approval after its design, acceptance criteria, tests and recovery strategy are available.

4. Non-negotiable project constraints

4.1 Cost

No new recurring financial obligation is permitted before the product can support it through revenue and a separate decision has been made.

Do not introduce:

- Paid AI APIs.
- Hosted inference.
- Paid embeddings or reranking.
- Paid databases or vector stores.
- Paid cloud storage.
- Hidden paid fallbacks.
- Dependencies with unavoidable usage charges.

Free software is not automatically cost-free. Licensing, device resources, battery consumption, maintenance and storage must also be considered.

4.2 Privacy and source authorisation

Local-first is the default.

Automatic memory means processing information supplied to Mopapa or explicitly authorised for import. It does not mean silently reading other Android applications.

No external transmission or processing is authorised.

4.3 Existing application

Preserve the working foundation:

- Vanilla JavaScript.
- ES5-compatible IIFEs.
- "window.Mopapa".
- Existing script loading and dependency order.
- Existing manual entries.
- Existing rooms, tags and learning data.
- Existing lexical search.
- Existing deterministic Ask.
- Existing backup, restore and recovery safeguards.
- Existing regression tests.

Do not introduce a framework or rewrite an existing module without a demonstrated technical reason.

4.4 Evidence and trust

Original evidence must remain distinct from extracted interpretations.

An assistant statement must not automatically become a user fact. A statement about another person must not automatically become a statement by that person. A newer statement must not automatically supersede an older one.

Unsupported information must not be presented as established knowledge.

4.5 User control

The eventual system must provide meaningful inspection, correction, dismissal, restriction, revocation and deletion.

These operations must have defined effects on source messages, derived memories, relationships, indexes and backups.

5. Existing implementation baseline

The current application uses:

- Vanilla JavaScript and ES5-compatible IIFEs.
- Browser DOM interfaces.
- "window.Mopapa".
- "localStorage".
- Storage key "mopapa.v1".
- Existing schema version 1.
- Existing manual entries and learning data.
- Deterministic search and Ask.
- Existing backup and recovery handling.

The main existing ownership boundaries are:

Responsibility| Existing owner
Persistence, validation, backup and restore| "js/store.js"
Manual entry operations| "js/memory/entries.js"
Lexical search| "js/memory/search.js"
Deterministic answer engine| "js/ask/"
Application loading and dependency order| "index.html"
Unit regression tests| "tests/run.js"
Browser regression tests| "tests/browser.js"

The module map is based on a repository inspection at commit "851008f01d3b61df9c94ef53771cb159606cecbe". Before production work, the relevant modules, tests and current branch must be re-inspected. A previous inspection is not proof that the code has remained unchanged.

The current application does not yet provide the complete persistent conversation archive, extracted-memory lifecycle or governance model described in the target architecture.

Baseline verification required before implementation

Record a fresh baseline for:

- Current "main" commit.
- Unit test total and result.
- Browser test total and result.
- GitHub Actions status.
- Deployment status.
- Existing storage schema and backup format.
- Existing Ask regression evaluation.
- Existing 50-question evaluation.
- Existing browser storage and recovery behaviour.

Do not copy old test totals into a new build entry as if they were current.

6. Target architecture and data ownership

The target architecture has six distinct layers.

Layer| Responsibility
1. Original evidence| Preserve messages and other authorised source material
2. Candidate extraction| Identify possible memories without treating candidates as established facts
3. Stored memory| Maintain independently retrievable memory records
4. Relationships and governance| Preserve provenance, temporal relationships, scope and restrictions
5. Retrieval and context assembly| Find relevant information and select what may be used
6. Answering| Produce a supported answer, clarification or abstention

The logical storage model currently proposes five new collections:

- "conversations"
- "messages"
- "memories"
- "memorySources"
- "memoryRelations"

Existing manual entries remain in "entries".

These collections are logical design concepts. They are not present in the live schema merely because they appear in the specification.

Ownership principles

1. Original messages are authoritative evidence.
2. Extracted memories are derived representations.
3. "memorySources" links memories to supporting messages.
4. "memoryRelations" records supported relationships between memories.
5. Search indexes are derived and rebuildable.
6. Existing manual entries remain independently supported by their existing model.
7. No second persistence mechanism may become an unprotected competing source of truth.

7. Outstanding design decisions

These questions must be resolved before the implementation-level schema is approved.

7.1 Participant identity and conversation-local attribution

The logical participant and attribution direction is established in the approved data model.

The implementation-level schema must now define the exact representation and validation rules.

The approved logical requirements are:

- Participants are represented within their originating conversation.
- Source-provided participant identifiers are retained where available.
- Message authorship is separate from message role.
- Quoted speakers are separate from message authors.
- Mentioned people are separate from message authors and quoted speakers.
- Unknown and unresolved participants remain representable.
- Cross-conversation identity matching is not automatic.
- Identity corrections must be traceable.
- Memories affected by identity corrections must be reassessed.

The implementation-level design must specify:

- Exact participant record fields.
- Participant identifier generation and uniqueness.
- Source identifier retention.
- Display-name handling.
- Unknown participant representation.
- Duplicate participant handling within one conversation.
- Identity correction history.
- Behaviour when a participant is removed or reassigned.
- Referential integrity between messages, participants and memories.

Do not assume that two people with the same display name are the same person.

Do not infer identity from writing style, a name mentioned in a message or contextual resemblance.

7.2 Message authorship, quoted speakers and memory subjects

The logical model distinguishes:

- Message role.
- Original message author.
- Quoted speaker.
- Source or import origin.
- Person or entity mentioned.
- Subject of the extracted memory.
- Mopapa's interpretation.

The approved attribution classes are:

- "user"
- "assistant"
- "third_party"
- "imported"
- "unknown"

The implementation-level schema must define:

- How each attribution class is represented.
- How a message author references a conversation participant.
- How quoted speakers are represented.
- How multiple subjects are represented where necessary.
- How unknown and ambiguous subjects are represented.
- How source attribution is retained for memories supported by multiple messages.
- How attribution corrections affect derived memories.
- How original source content remains unchanged.

A statement about the user must not automatically be treated as a statement made by the user.

A statement made by the user must not automatically be treated as a statement about the user.

7.3 Scope, audience visibility and use policy

The logical model now defines three independent governance dimensions.

Scope describes where or in what context information applies.

Audience describes who is permitted to see or receive it.

Use policy describes what Mopapa is permitted to do with it.

The approved logical scope types are:

- "personal"
- "conversation"
- "project"
- "topic"
- "event"
- "relationship"
- "other"
- "unknown"

The approved audience types are:

- "owner_only"
- "named_audience"
- "restricted_context"
- "unknown"

The use-policy model must distinguish permission for:

- Direct answers.
- Contextual answers.
- Proactive surfacing.
- Cross-context reuse.
- Inference.
- Export.

The implementation-level design must define:

- Exact fields and allowed values.
- Scope reference formats.
- Named audience representation.
- Context matching rules.
- Default behaviour when metadata is missing.
- Permission evaluation order.
- How explicit denial is represented.
- How conflicting policies are handled.
- How multiple source restrictions combine.
- How restrictions propagate to derived memories.
- How source deletion or revocation affects derived permissions.
- How policy changes are audited.
- How permission metadata is preserved in backup and restore.
- How export handles metadata it cannot preserve.

The approved conservative direction is:

- Owner-only visibility by default.
- Unknown scope is not unrestricted scope.
- Unknown audience is not permission to disclose.
- Proactive surfacing is not permitted without explicit permission.
- Cross-context reuse is not permitted without explicit permission.
- External sharing is not authorised.
- Explicit denial takes precedence.
- Missing or conflicting permissions deny the disputed use.

7.4 Governance enforcement and evidence spans

Governance must be enforced before information enters retrieval or answer context.

The implementation-level design must specify:

- The exact point at which governance checks run.
- How current conversation and project context are established.
- How scope applicability is evaluated.
- How audience permissions are checked.
- How each use permission is checked.
- How restrictions from multiple sources are combined.
- How deleted and revoked evidence is excluded.
- How prohibited information is prevented from entering summaries, caches and derived indexes.
- How governance failures are recorded and tested.
- How evidence spans identify supporting portions of original messages.
- How evidence spans remain valid if records are migrated or corrected.

Permission to answer a direct question must not automatically grant permission for proactive surfacing or cross-context reuse.

Information that fails a governance check must be excluded before context assembly, not merely ignored by the answer layer.

The design must specify exact behaviour for unknown, missing, invalid and conflicting metadata.

A missing permission must never silently become permission.

The implementation-level schema and governance rules remain unapproved until their fields, validation, evaluation fixtures and acceptance criteria are complete.

7.5 Candidate acceptance

Define which candidate types may become active automatically and which require user review.

The system must distinguish:

- Directly stated information.
- Repeated information.
- Information supported by multiple independent sources.
- Interpretations.
- Uncertain statements.
- Hypothetical statements.
- Assistant-generated suggestions.
- Quoted or imported third-party information.

No arbitrary confidence percentage should be introduced without a defined and calibrated meaning.

7.6 Deletion, revocation and re-import

Define how the system remembers that a user dismissed, deleted or revoked a memory without retaining prohibited content unnecessarily.

A repeated import must not silently recreate information the user deliberately removed.

The design must also address:

- Deleting one source message.
- Deleting an entire conversation.
- Deleting a memory.
- Revoking permission to use information.
- Restricting future use.
- Removing derived indexes.
- Existing backups and recovery copies.
- Future imports of the same source.

7.7 Temporal validity

Define the relationship between:

- Original statement time.
- Import or receipt time.
- Time the described fact became true.
- Time it stopped being true.
- Memory creation time.
- Memory update time.

Unknown dates must remain unknown.

An import timestamp must not be substituted for the original event date.

7.8 Schema and validation

Finalise exact fields, types, required values, optional values, null behaviour, enum values, identifier rules, reference integrity and validation failure policy.

The logical model is not a substitute for an implementation-level schema.

8. Phased engineering programme

The following phases are sequential dependencies. They are not blanket authorisation to implement the whole system.

Phase 0: Documentation and baseline control

Purpose: Establish one consistent engineering specification and a trustworthy baseline.

Work:

- Reconcile the research review, architecture decisions, architecture specification, data model, module map and build log.
- Create and maintain this build plan.
- Re-inspect the live repository before implementation.
- Record the current test and deployment baseline.
- Identify existing test coverage before adding new tests.
- Identify the exact files and modules affected by each future phase.

Acceptance criteria:

- All architecture documents agree about what is approved and what is not.
- No document describes a proposed feature as implemented.
- The module map matches the current code inspection.
- Existing test totals and CI status are recorded accurately.
- The build plan identifies the remaining design decisions.
- No production code has been changed as part of this phase.

Exit gate: Documentation reconciliation is complete and the build plan is accepted as the planning authority.

Phase 1: Finalise the implementation-level data model

Purpose: Turn the approved logical model into a precise, testable schema without authorising production implementation.

Work:

1. Finalise conversation records.
2. Finalise message records.
3. Define conversation-local participant records and identifiers.
4. Define message roles and original author attribution.
5. Define quoted-speaker representation.
6. Define memory subject representation and unresolved identity handling.
7. Define evidence spans and source references.
8. Finalise memory records and memory types.
9. Define candidate and lifecycle transitions.
10. Define independent evidence states.
11. Define temporal validity and historical relationships.
12. Define scope types and scope references.
13. Define audience visibility and named-audience representation.
14. Define independent use permissions.
15. Define explicit restrictions and denial rules.
16. Define restriction inheritance across derived memories.
17. Define policy combination when multiple sources support one memory.
18. Define behaviour for unknown, missing and conflicting permissions.
19. Define governance enforcement before retrieval and context assembly.
20. Define provenance and relationship records.
21. Define deletion, revocation and identity-correction operations.
22. Define stable identifier generation.
23. Define validation rules for individual records and the complete dataset.
24. Define valid, invalid, ambiguous and conflicting example datasets.

The schema must specify exact behaviour for missing, null, unknown and invalid values.

It must not rely on undocumented assumptions.

Acceptance criteria:

- Every required field has a defined type, allowed values and validation rule.
- Every relationship has a defined direction and integrity rule.
- Participant identifiers are unique within their defined conversation scope.
- Message role, message author, quoted speaker and memory subject are independently represented.
- Cross-conversation identity is not inferred automatically.
- Unknown and ambiguous identity remain representable.
- Evidence spans can be validated against their original messages.
- Every memory can identify its supporting sources.
- Candidate, active, historical, uncertain, dismissed and unsupported states have defined transitions.
- Evidence state is independent from lifecycle state.
- Temporal validity is independent from record creation and update timestamps.
- Scope and audience visibility are independently represented.
- Use permissions are independent from visibility.
- Owner-only visibility is the conservative default.
- Missing or conflicting permission metadata cannot grant permission.
- Explicit denials take precedence over permissive rules.
- Restrictions from multiple sources combine conservatively.
- Derived memories cannot silently weaken source restrictions.
- Governance checks occur before prohibited information enters retrieval or answer context.
- Summaries, caches and derived indexes cannot bypass governance.
- Existing manual entries remain separate and retain their current meaning.
- Invalid records have a defined rejection or quarantine policy.
- A complete valid example dataset and invalid example dataset exist.
- Ambiguous identity and permission cases have explicit expected outcomes.
- The schema can be validated without relying on UI behaviour.

Exit gate: The implementation-level schema, attribution rules, scope model, audience model, use-policy model, validation rules and governance enforcement specification are complete and explicitly approved.

Phase 2: Deletion, provenance and governance design

Purpose: Ensure that the system can safely manage evidence and user decisions.

Work:

- Define source deletion behaviour.
- Define conversation deletion choices.
- Define memory deletion behaviour.
- Define revocation.
- Define restrictions.
- Define dismissal and correction.
- Define how shared evidence affects multiple memories.
- Define what happens when the final supporting source disappears.
- Define how relationships are reassessed after deletion.
- Define protection against unwanted re-import.
- Define derived-index cleanup and rebuilding.
- Define the treatment of existing backups and recovery copies.

Acceptance criteria:

- No active memory can silently remain established after losing all valid support.
- A memory with remaining independent evidence is not unnecessarily destroyed when one source is deleted.
- Deletion cannot leave orphaned provenance or relationship records.
- Revoked or restricted information is excluded from prohibited retrieval contexts.
- Dismissed information is not silently reactivated by repeated extraction.
- The user-facing consequences of conversation deletion are explicit.
- Operations either complete consistently or leave the prior valid state intact.
- The behaviour can be tested independently of the interface.

Exit gate: Deletion, revocation, restriction and provenance rules are approved and testable.

Phase 3: Storage workload and migration decision

Purpose: Establish whether the current storage architecture can support the new workload.

The existing storage decision is to retain "localStorage" for the current application. IndexedDB is a candidate, not an approved migration.

Do not reopen that decision merely because conversation history is larger than manual notes.

Work:

- Define realistic conversation and message volumes.
- Define typical and upper-bound message sizes.
- Estimate memory and provenance growth.
- Estimate backup growth.
- Measure serialisation, save, load and search costs.
- Measure backup export and restore time.
- Measure recovery-copy growth.
- Test quota and write-failure behaviour.
- Test on representative Android devices and additional browser engines where available.
- Compare the existing storage design with an IndexedDB prototype only if evidence justifies the comparison.

Use the provisional targets in "docs/storage-architecture.md" as investigation thresholds, not proven guarantees.

The existing save benchmark is not sufficient to establish p95 performance. Search latency on the same large dataset and representative device measurements remain important gaps.

Acceptance criteria:

- A representative workload is documented.
- Measurements include browser, device, data volume and repetition count.
- Median and p95 are reported where the sample size supports them.
- Backup and recovery costs are included.
- Quota failures and interrupted operations are tested.
- The decision explicitly states whether localStorage remains suitable for the first implementation.
- Any proposal to adopt IndexedDB includes a migration, rollback and recovery design.
- No second authoritative store is introduced.

Exit gate: A separate storage decision is approved. If localStorage remains suitable, the plan must say so and explain the evidence. If IndexedDB is proposed, migration approval is still required separately.

Phase 4: Backup, restore and migration specification

Purpose: Ensure new data can be recovered before it is introduced into production.

Work:

- Define backup format compatibility.
- Define version 1 backup restoration.
- Define the proposed future schema backup.
- Define complete relationship validation.
- Define migration ordering.
- Define interrupted migration handling.
- Define rollback behaviour.
- Define recovery-copy creation and retention implications.
- Define backup size limits using measured data.
- Define the treatment of invalid and partially recoverable backups.

Acceptance criteria:

- Existing version 1 backups remain restorable.
- Existing entries, rooms, learning data and Ask state remain intact.
- New collections are included in future backups.
- Restore validates the complete dataset before replacing current data.
- Invalid backups cannot partially replace valid data.
- Failed migration cannot leave mixed schema versions.
- Failed restore leaves the existing state unchanged.
- Recovery behaviour is tested for every new data domain.
- Backup limits are evidence-based rather than increased arbitrarily.
- The user receives truthful success and failure messages.

Exit gate: Backup, restore, migration and rollback specifications are approved, with tests designed before production persistence changes.

Phase 5: Evaluation harness and fixtures

Purpose: Make the new capabilities measurable before implementing them.

Evaluation must be divided by capability. A good final answer must not conceal a failure in attribution, extraction or deletion.

Create separate fixtures for:

- Original-message preservation.
- Message role attribution.
- Original message author attribution.
- Quoted-speaker attribution.
- Subject attribution.
- Participant identity within a conversation.
- Unknown and ambiguous participant identity.
- Cross-conversation identity separation.
- Identity correction and reassessment of derived memories.
- Evidence-span accuracy.
- Candidate extraction.
- Candidate rejection.
- Provenance.
- Multiple supporting sources.
- Duplicate imports.
- Retry behaviour.
- Temporal changes.
- Contradictions.
- Scope applicability.
- Conversation-only scope.
- Project and topic scope.
- Unknown scope.
- Owner-only visibility defaults.
- Named-audience restrictions.
- Unknown audience.
- Direct-answer permission.
- Contextual-answer permission.
- Proactive-use denial.
- Cross-context reuse denial.
- Inference restrictions.
- Export restrictions.
- Explicit permission denial.
- Missing permission metadata.
- Conflicting permissions.
- Multiple-source restriction inheritance.
- Derived-memory restriction inheritance.
- Source deletion and restriction reassessment.
- Revocation.
- Deletion.
- Governance enforcement before context assembly.
- Restricted information excluded from summaries.
- Restricted information excluded from caches and derived indexes.
- Backup and restore preserving permission metadata.
- Export behaviour when permission metadata cannot be preserved.
- Retrieval.
- Answer support and abstention.

Preserve the existing regression suites and existing 50-question Ask evaluation.

Keep the LongMemEval diagnostic and external benchmark material separate from Mopapa-native regression totals.

Acceptance criteria:

- Each evaluation has a defined purpose and scoring method.
- Expected outputs are fixed and reviewable.
- Positive and negative cases are represented.
- Ambiguous cases test whether the system abstains or requests clarification.
- Attribution failures are reported separately from extraction and answer accuracy.
- Participant identity errors are reported separately from subject attribution errors.
- Scope and audience violations are reported separately from ordinary retrieval errors.
- Prohibited proactive use and cross-context reuse are treated as governance failures.
- Missing or conflicting permissions never produce an unintended permission grant.
- Restriction inheritance is tested across single-source and multiple-source memories.
- Derived indexes, summaries and caches are tested for restricted-information leakage.
- Backup, restore and export tests verify that permissions are not silently broadened.
- Deletion and restriction failures are treated as critical, not averaged away.
- Benchmark licensing and permitted use are recorded.
- Evaluation data can be rerun consistently.

Exit gate: The evaluation harness is ready to assess the first implementation phase.

Phase 6: Authorise and implement original evidence preservation

Purpose: Introduce the smallest safe persistent conversation and message capability.

This is the first potential production implementation phase.

It must not begin until Phases 1 to 5 have been completed to the required level and the user has explicitly approved this phase.

Potential responsibilities:

- Conversation creation and retrieval.
- Message preservation.
- Stable source identity.
- Original author attribution.
- Message ordering.
- Unknown timestamp handling.
- Duplicate import protection.
- Backup and restore participation.

Do not add automatic memory extraction in this phase.

Acceptance criteria:

- Original message text is preserved without rewriting.
- Conversation boundaries and message ordering are preserved.
- Source origin and author attribution remain available.
- Unknown timestamps remain unknown.
- Duplicate processing of the same stable source identifier does not create duplicate messages.
- Failed imports do not corrupt existing data.
- Existing manual entries and Ask behaviour remain unchanged.
- New records participate in validation, backup and restore.
- The complete existing regression suite passes.
- Browser tests cover reload, invalid data and recovery.
- No information is reported as stored unless persistence has been verified.

Exit gate: Evidence preservation is verified before candidate extraction is considered.

Phase 7: Authorise and implement deterministic candidate extraction

Purpose: Identify useful information without requiring a paid or hosted model.

Initial extraction should be conservative and deterministic.

Potential supported cases:

- Explicit dates.
- Explicit amounts.
- Directly stated preferences with unambiguous wording.
- Clearly stated facts.
- Explicit corrections.
- Explicit changes to an earlier fact.
- Unambiguous named relationships.

Do not force ambiguous statements into established memories.

Do not treat questions, hypotheticals, examples, assistant suggestions or quoted third-party statements as user facts.

Candidate extraction must remain separate from acceptance as an established memory.

Acceptance criteria:

- Every candidate points to its original supporting message.
- Author and subject are preserved separately.
- Uncertain attribution remains uncertain.
- Unsupported or ambiguous statements do not become active facts.
- Candidate creation is safe to retry.
- Reprocessing does not create uncontrolled duplicates.
- Candidate rejection is respected on later processing.
- Extraction failure does not affect preserved messages.
- Candidate quality is measured against a fixed evaluation set.
- No model or external service is required.

Exit gate: Candidate extraction demonstrates acceptable precision and safe failure behaviour before automatic activation is considered.

Phase 8: Authorise and implement stored memories and provenance

Purpose: Turn accepted candidates into independently retrievable memories.

Work:

- Implement memory records.
- Implement memory-source relationships.
- Implement evidence-state assessment.
- Implement lifecycle transitions.
- Implement duplicate review.
- Implement source removal and reassessment.
- Preserve independent support from multiple messages.

Acceptance criteria:

- A memory can have multiple supporting messages.
- A message can support multiple memories.
- Invalid source links are rejected.
- Duplicate provenance links are rejected.
- A memory without valid evidence cannot be presented as established.
- Source deletion reassesses all dependent memories.
- Existing manual entries are not duplicated automatically.
- Memory records remain independently inspectable.
- Every change is safe to retry or recover from.

Exit gate: Memory and provenance integrity pass the complete fixture suite.

Phase 9: Authorise and implement temporal relationships

Purpose: Support changing facts without destroying history.

Initial relationships:

- "supersedes"
- "contradicts"
- "related"

Work:

- Define matching criteria for the same changing fact.
- Define evidence requirements for supersession.
- Preserve historical records.
- Preserve unresolved contradictions.
- Define how temporal retrieval selects current and historical information.

Acceptance criteria:

- A newer timestamp alone never proves supersession.
- A supported update preserves the older memory as historical.
- Contradictory memories remain available and unresolved.
- Related memories are not linked merely because their wording is similar.
- Historical questions can retrieve earlier values.
- Current-state questions do not silently select an unsupported value.
- Ambiguous changes result in clarification or abstention where appropriate.

Exit gate: Temporal and contradiction evaluation passes before these relationships influence ordinary answers.

Phase 10: Authorise and implement governance controls

Purpose: Give users practical control over extracted information.

Work:

- Memory inspection.
- Evidence inspection.
- Correction.
- Dismissal.
- Restriction.
- Revocation.
- Deletion.
- Conversation deletion choices.
- Clear status and failure reporting.

Acceptance criteria:

- Users can identify why a memory exists.
- Users can inspect its supporting evidence.
- Users can correct an incorrect extraction without rewriting original evidence.
- Dismissed memories are not silently reactivated.
- Restricted memories are excluded from prohibited contexts.
- Revoked information is not available to ordinary retrieval.
- Deletion updates dependent records consistently.
- The interface distinguishes saved, candidate, uncertain, unsupported and failed states.
- No success message is shown before the operation has actually succeeded.

Exit gate: Governance and deletion tests pass, including cross-record and recovery scenarios.

Phase 11: Extend retrieval and deterministic Ask

Purpose: Make the new information useful without weakening the existing answer system.

Work:

- Search original messages.
- Search eligible extracted memories.
- Retrieve supporting evidence.
- Apply author and subject attribution.
- Apply temporal validity.
- Apply scope and restrictions.
- Resolve conflicts.
- Assemble a bounded evidence set.
- Extend deterministic answer handling only where justified.

The existing Ask engine remains the initial answer implementation.

Acceptance criteria:

- Existing Ask regression tests remain intact.
- Existing manual entries remain searchable.
- New results include valid source references.
- Restricted and revoked memories are excluded.
- Historical information is distinguished from current information.
- Contradictions are not silently resolved.
- Unsupported questions receive appropriate abstention.
- Retrieval precision and recall are measured separately.
- Answer correctness and source support are measured separately.
- No answer is presented as supported by a source that does not establish it.

Exit gate: Cross-conversation retrieval demonstrates measurable benefit without regression in existing Ask behaviour.

Phase 12: Controlled expansion

Purpose: Expand only when evidence supports doing so.

Possible later investigations:

- More advanced deterministic extraction.
- Local model inference.
- Semantic retrieval.
- Larger archive workloads.
- Additional authorised import formats.
- Procedural memory.
- More advanced participant and relationship handling.

Each requires its own research, cost, privacy, licensing, performance and evaluation decision.

No capability in this phase is automatically approved by completion of earlier phases.

9. Evaluation and quality standards

The following quality dimensions must be reported separately.

Dimension| What must be measured
Capture| Completeness and fidelity of original evidence
Attribution| Correct message author and source identity
Subject| Correct person or entity the statement concerns
Extraction| Correct candidate identification and interpretation
Provenance| Valid evidence links and source support
Updating| Correct handling of changes and historical facts
Contradictions| Preservation and correct handling of conflicts
Governance| Correct scope and restriction enforcement
Deletion| Complete removal or reassessment of dependent data
Retrieval| Relevant evidence found and irrelevant evidence excluded
Answering| Correctness, source support and appropriate abstention
Reliability| Retry safety, persistence, backup and recovery
Performance| Save, load, search and backup latency at measured volumes

A high aggregate score cannot compensate for a serious privacy, attribution, deletion or provenance failure.

Critical failure categories

The following must be treated as release-blocking defects:

- Assistant-generated information represented as a user statement.
- A third-party statement incorrectly attributed to the user.
- An unsupported memory presented as established fact.
- A restricted memory used in a prohibited context.
- Revoked information remaining available to ordinary retrieval.
- Deleted evidence silently reappearing.
- A failed write reported as successful.
- A failed restore partially replacing valid user data.
- An invalid relationship silently corrupting the dataset.
- A historical fact silently overwritten.

10. Test ownership and regression policy

Before adding tests:

1. Inspect "tests/run.js".
2. Inspect "tests/browser.js".
3. Identify existing tests that already cover the scenario.
4. Extend existing tests where appropriate.
5. Add a new test only when it covers a genuinely missing behaviour.

Avoid duplicate assertions that test the same condition without adding meaningful coverage.

Every implementation phase must report:

- Unit test result.
- Browser test result.
- Additional validation or benchmark result.
- GitHub Actions result.
- Deployment result.
- Manual verification, where required.
- Known limitations.

A passing unit suite does not prove browser download, mobile storage or real-device performance.

A successful deployment does not prove that the new functionality works.

No test total should be reported without the commit against which it was run.

11. Storage, backup and recovery rules

Until a separate decision changes it:

- Keep "localStorage" as the current primary persistence mechanism.
- Keep the existing storage key and schema unchanged.
- Do not introduce IndexedDB as a second authoritative store.
- Do not increase the 5 MB import limit without evidence.
- Preserve existing recovery-copy safeguards.
- Keep backup and restore compatibility as a requirement for every new data domain.

Any future migration must:

1. Preserve the original data.
2. Validate the source before migration.
3. Write to the destination safely.
4. Read back and verify the migrated data.
5. Preserve the original source until verification succeeds.
6. Handle interruption and retry.
7. Provide a tested rollback or recovery path.
8. Preserve existing manual entries and learning data.
9. Test normal, empty, large, malformed and partially recoverable datasets.
10. Verify backup compatibility.

Recovery copies stored in the same browser profile are not independent backups. The interface must not imply otherwise.

12. Performance and device requirements

Mopapa must remain usable on ordinary mobile devices.

Performance work must measure:

- Complete save operations.
- Load and initialisation.
- Search execution.
- Search result rendering.
- Backup export.
- Restore validation and completion.
- Recovery-copy creation.
- Large archive behaviour.

Use the provisional targets in "docs/storage-architecture.md" as investigation thresholds. They are not guarantees.

For meaningful performance comparisons:

- Use the same dataset.
- Record browser and device.
- Warm up the code.
- Collect enough repetitions to report median and p95.
- Separate CI measurements from real-device measurements.
- Include failure rates as well as successful operation timings.

Do not adopt an index, database or model merely to improve a synthetic benchmark if it does not solve a demonstrated product problem.

13. Build-log and documentation rules

"docs/personal-memory-build-log.md" is the permanent history of completed engineering work.

For every completed batch, record:

- Date and batch name.
- Exact commit SHA.
- Files changed.
- Actual implementation or documentation changes.
- Unit test results.
- Browser test results.
- GitHub Actions status.
- Deployment status.
- Manual verification.
- Evidence and limitations.
- Outstanding issues.
- Decision and next approved task.

Preserve historical entries.

Correct outdated status summaries without rewriting the historical record.

Do not record a task as verified merely because a file exists or a commit was pushed.

The build plan itself must be updated when an approved decision materially changes the implementation sequence or acceptance criteria.

14. Explicit exclusions

The following are not part of the initial implementation programme:

- Paid APIs or subscriptions.
- Hosted AI inference.
- Cloud synchronisation.
- Mandatory accounts.
- Automatic access to other applications.
- An external vector database.
- A mandatory embedding model.
- A mandatory local language model.
- A replacement for deterministic Ask.
- A wholesale framework migration.
- A complete UI redesign.
- Procedural memory before foundational memory reliability.
- Autonomous agent behaviour.
- Unbounded background extraction.
- Unrestricted collection of personal information.

A future proposal must identify the problem it solves, evidence that the problem exists, its cost and maintenance burden, privacy implications and measurable acceptance criteria.

15. Implementation authorisation gates

No production implementation begins until the following conditions are satisfied.

Design readiness

- [ ] Architecture and logical data-model documents are consistent.
- [ ] Participant identity and attribution are fully specified.
- [ ] Subject representation is fully specified.
- [ ] Scope, visibility and restrictions are enforceable and specified.
- [ ] Candidate and memory lifecycle transitions are defined.
- [ ] Provenance and temporal relationships are defined.
- [ ] Deletion, revocation and re-import behaviour is defined.
- [ ] Implementation-level schema and validation rules are complete.

Reliability readiness

- [ ] Storage workload has been measured.
- [ ] Storage decision has been documented.
- [ ] Backup and restore compatibility is defined.
- [ ] Migration and rollback behaviour is defined where applicable.
- [ ] Recovery requirements cover all new data domains.
- [ ] Failure and interruption scenarios are testable.

Evaluation readiness

- [ ] Evaluation fixtures exist.
- [ ] Attribution tests exist.
- [ ] Extraction tests exist.
- [ ] Provenance tests exist.
- [ ] Temporal and contradiction tests exist.
- [ ] Restriction and deletion tests exist.
- [ ] Existing regression suites are preserved.
- [ ] Acceptance thresholds are documented.

Phase authorisation

- [ ] The exact first production phase is identified.
- [ ] Its files and module responsibilities are identified.
- [ ] Its acceptance criteria are measurable.
- [ ] Its regression coverage is identified.
- [ ] Its recovery plan is documented.
- [ ] Its exclusions are explicit.
- [ ] The user has explicitly approved that production phase.

Approval of this document does not tick these gates automatically.

16. Current position and next work

Current status: Target architecture and logical data-model direction approved. Documentation and engineering planning underway. Production implementation not authorised.

The following documents form the current design set:

- "docs/personal-memory-research-review.md"
- "docs/personal-memory-architecture-decisions.md"
- "docs/personal-memory-architecture.md"
- "docs/personal-memory-data-model.md"
- "docs/personal-memory-module-map.md"
- "docs/storage-architecture.md"
- "docs/personal-memory-build-log.md"
- "docs/personal-memory-build-plan.md"

The next work is to review this plan against the existing specifications and close the remaining implementation-level design gaps.

The remaining design work should concentrate on:

1. Exact implementation-level record fields and validation.
2. Participant identifier generation and identity-correction behaviour.
3. Message author, quoted-speaker and subject representation.
4. Evidence-span validation and provenance integrity.
5. Candidate acceptance and lifecycle transitions.
6. Temporal validity and contradiction handling.
7. Deletion, revocation and re-import protection.
8. Scope references and applicability rules.
9. Audience visibility and named-audience representation.
10. Independent use permissions and explicit denial behaviour.
11. Multiple-source restriction inheritance.
12. Governance enforcement before retrieval and context assembly.
13. Backup, restore, migration and rollback compatibility.
14. Storage workload and storage decision criteria.
15. Evaluation fixtures, critical failure rules and acceptance thresholds.

Only after these are resolved should the first production phase be proposed for approval.

Final boundary: Mopapa remains an existing working application while this programme is designed. No new automatic memory capability should be claimed until it has been implemented, tested and verified.