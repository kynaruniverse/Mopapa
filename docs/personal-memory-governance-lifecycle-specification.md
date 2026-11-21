Mopapa: Memory Governance, Lifecycle and Evidence Decision Specification

Status: Proposed foundational specification. Pending review and explicit approval.
Product: Mopapa Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa
Implementation status: Design only. No production changes authorised.

Prerequisites

- "docs/personal-memory-architecture.md"
- "docs/personal-memory-data-model.md"
- "docs/personal-memory-record-specification.md"
- "docs/personal-memory-schema-consistency-review.md"
- "docs/personal-memory-identity-evidence-temporal-specification.md"
- "docs/personal-memory-build-plan.md"

---

1. Purpose

This document defines how Mopapa should decide:

1. Whether information is suitable for extraction as a memory.
2. Whether an extracted candidate can become an active memory.
3. How evidence quality and contradictory information affect memory eligibility.
4. How memories change over time without silently destroying history.
5. How lifecycle and evidence states transition.
6. How permissions and restrictions are inherited and enforced.
7. When a memory may be retrieved or used in an answer.
8. How dismissal, deletion, correction and revocation affect dependent records.
9. How the system prevents prohibited information from re-entering through future imports.
10. How each behaviour must be evaluated before implementation.

The objective is reliable personal memory, not the maximum possible quantity of extracted information.

A memory that is easy to retrieve but incorrectly attributed, outdated, unsupported or used outside its permitted context is a system failure.

This specification must be read alongside the identity, evidence attribution and temporal specification. It does not replace those rules.

It does not authorise production implementation, a schema migration, a new storage technology, external AI, paid services or cloud processing.

2. Governing principles

The following principles are mandatory design constraints.

2.1 Evidence before interpretation

- Original evidence remains separate from extracted memories.
- An extracted memory must retain traceable provenance.
- The system must not silently rewrite original evidence.
- A memory must not claim more than its evidence establishes.
- The source author's identity must not be confused with the subject of a statement.
- A quotation or report must not be represented as independently verified fact.
- Missing evidence must not be replaced by plausible inference.

2.2 Conservative memory formation

- Not every message deserves to become a memory.
- Repetition alone does not establish truth.
- A candidate is not automatically an accepted memory.
- A supported candidate is not automatically suitable for active retrieval.
- Assistant-generated suggestions are not evidence of user facts.
- Hypothetical, fictional and role-play statements must not silently become personal facts.
- Ambiguous information must remain uncertain or require review.

2.3 Temporal accuracy

- A memory may be true at one time and false later.
- Historical information must not be presented as current.
- A newer statement does not automatically invalidate an older statement.
- The system must distinguish corrections from ordinary changes.
- Unknown dates must remain unknown.
- Import time must not be substituted for event time or validity time.

2.4 User control

- Users must be able to inspect, correct, restrict, dismiss and delete memories.
- Explicit user decisions take precedence over automatic extraction.
- Dismissed information must not silently return through re-import.
- Deletion and revocation must affect derived information.
- The system must not retain prohibited content merely to make internal bookkeeping convenient.

2.5 Conservative use

- Governance is evaluated before retrieval results enter answer context.
- Unknown or missing permission denies the disputed use.
- An explicit denial cannot be overridden by an allow elsewhere.
- Derived memories cannot receive broader permissions than their supporting evidence.
- A memory may be stored but ineligible for a particular use.
- A memory that is ineligible for use must not influence an answer indirectly through a summary, cache or index.

3. Separate dimensions of memory state

Lifecycle, evidence, temporal validity and governance are independent dimensions.

They must not be collapsed into one confidence score or one status field.

Dimension| Question answered
Lifecycle| What stage of memory management has this record reached?
Evidence state| What does the available evidence establish?
Temporal validity| When did the described information apply?
Governance| Which uses are permitted?
Attribution| Whose statement or evidence is represented?
Identity| Who or what does the memory concern?

For example, a memory may be:

- Lifecycle: "active"
- Evidence state: "supported"
- Temporal validity: ended in October 2026
- Attribution: user
- Governance: direct answers allowed
- Retrieval interpretation: historical, not current

The fact that a memory is active does not mean that the described fact remains current.

A memory may also be supported but restricted, disputed but retained for inspection, or historical but still useful when a user explicitly asks about the past.

4. Candidate memory formation

4.1 Definition

A candidate is a proposed memory extracted from an original source but not yet accepted for ordinary retrieval.

Candidate extraction must preserve:

- The original source reference.
- The original message or evidence span.
- The message author.
- Any quoted or reported speaker.
- The subject or subjects.
- The proposed memory claim.
- Its memory type and category.
- Temporal information and uncertainty.
- Any applicable scope, audience and restrictions.
- The reason the extraction was considered potentially useful.

The candidate must remain distinguishable from an accepted memory.

4.2 Candidate suitability

A candidate should be considered only when the information has plausible future value.

Potentially suitable examples include:

- A stable personal preference.
- A confirmed recurring requirement.
- An ongoing project or commitment.
- A meaningful personal event.
- A user-confirmed relationship.
- A correction to an earlier memory.
- A task or plan with an identifiable time or completion condition.
- A fact the user explicitly asks Mopapa to remember.

Potentially unsuitable examples include:

- Incidental conversational wording.
- Greetings and ordinary conversational filler.
- A one-off suggestion from the assistant.
- An unconfirmed interpretation.
- A hypothetical statement.
- Fictional or role-play information.
- A temporary detail with no apparent future relevance.
- An ambiguous statement whose subject cannot be established.
- Information that is prohibited from the intended use by governance.

The system must not interpret every sentence about a person as a personal memory about the user.

4.3 Candidate rejection conditions

A candidate must be rejected or withheld from promotion when:

1. Its source cannot be identified.
2. Its evidence span is invalid.
3. Its attribution contradicts the source.
4. Its subject is incorrectly inferred.
5. It is clearly hypothetical or fictional and not explicitly intended as a real memory.
6. It is an assistant suggestion presented without user confirmation.
7. Its meaning is too ambiguous to express without guessing.
8. It has no valid supporting evidence.
9. Its intended use is prohibited.
10. It conflicts with an explicit user dismissal or deletion decision.
11. Its extraction would require inventing dates, identities or relationships.
12. It contains a claim broader than the original evidence.

Rejection must not modify or destroy the original source.

4.4 Candidate extraction is not confirmation

A candidate may accurately represent what someone said without establishing whether the statement itself is true.

Example:

Original message:

«My colleague says the new office opens in January.»

Possible candidate:

«The user reported that their colleague said the new office opens in January.»

This is supported as a report made by the user.

It does not establish independently that the office opens in January.

A separate memory claiming the opening date as an established fact would require stronger evidence or explicit qualification.

4.5 Automatic promotion policy

Automatic promotion must be conservative and limited.

The following proposed policy applies:

Candidate type| Proposed treatment
Explicit request to remember a clear personal fact| Eligible for automatic promotion after validation
Clear direct statement of a stable preference| Eligible after attribution, duplication and governance checks
Clear correction of an existing memory| Requires reconciliation with the existing record
Repeated consistent direct statements| Eligible for promotion after independent assessment
Single incidental personal statement| Candidate only unless a defined rule establishes sufficient value
Assistant-generated suggestion| Not promotable without user confirmation
Quoted third-party statement| Candidate only unless its intended meaning and use are established
Hypothetical or fictional statement| Not promotable as a real personal fact
Ambiguous statement| Candidate requiring review, or rejection
Sensitive or restricted information| Must follow explicit applicable governance and review requirements

Automatic promotion is not permission to infer additional facts.

The system must not introduce a numerical confidence threshold without a defined calibration and evaluation method.

4.6 User confirmation

User confirmation must be recorded as a distinct event from automatic extraction.

Confirmation may establish that the user intends Mopapa to retain a particular interpretation.

It does not necessarily establish the objective truth of every claim within that interpretation.

For example, confirming that a colleague made a statement confirms the user's intended report, not necessarily the truth of the colleague's statement.

The system must preserve this distinction.

5. Evidence assessment

5.1 Evidence states

The five proposed evidence states remain:

- "supported"
- "partially_supported"
- "unsupported"
- "disputed"
- "unverified"

These states describe the evidence, not the lifecycle of the memory.

5.2 Supported

A memory is supported when:

- At least one valid source supports the complete claim.
- The attribution is consistent.
- The evidence is relevant to the claim.
- The source is not deleted or revoked for the intended use.
- No unresolved contradiction makes the complete claim misleading.
- The claim does not exceed what the source establishes.

A single direct statement can support the fact that the user made that statement.

It does not necessarily provide independent verification of an external event or third-party claim.

5.3 Partially supported

Use "partially_supported" when some components of a memory are established but the complete claim is not.

Example:

Evidence:

«I started working at Company B in March 2026.»

Supported:

- The user reported starting work at Company B.
- The reported start month is March 2026.

Not established:

- The exact start date.
- Whether the user still works there.
- Whether the job was full-time.

The memory must not present unsupported details as established facts.

Where possible, split independent claims into separate memories rather than keeping a broad compound claim.

5.4 Unsupported

Use "unsupported" when no remaining valid evidence supports the claim.

Examples:

- All supporting messages have been deleted.
- All supporting sources have been revoked for the relevant use.
- A source reference is invalid.
- The only evidence was an assistant suggestion.
- A previous interpretation was shown to be unsupported.

Unsupported memories must not be used as established facts.

The system must reassess their lifecycle and dependencies.

5.5 Disputed

Use "disputed" when valid evidence conflicts and the conflict has not been resolved.

Example:

- An earlier direct statement gives one current preference.
- A later direct statement gives a different current preference.
- The system cannot establish whether the later statement is a correction, a temporary exception or a change.

The system must not arbitrarily select one statement as true.

It may retain both with their original temporal and provenance information.

5.6 Unverified

Use "unverified" when evidence exists but has not been adequately assessed.

This includes:

- Imported records with unresolved attribution.
- Incomplete evidence.
- Unclear quotation boundaries.
- Ambiguous source meaning.
- A candidate awaiting validation.

Unverified information must not be treated as established fact.

5.7 Evidence quality rules

Evidence assessment must consider:

1. Directness.
2. Attribution.
3. Source integrity.
4. Temporal relevance.
5. Specificity.
6. Whether the source is independent.
7. Whether the source actually supports the complete claim.
8. Whether a source has been corrected, deleted or revoked.

No arbitrary numeric score should replace these explicit checks.

5.8 Independent evidence

Two statements are not automatically independent merely because they appear in different messages.

For example:

- A user repeats something they previously said.
- An assistant repeats a fact from an earlier conversation.
- An imported summary repeats the contents of an original conversation.

These may all derive from the same original source.

The system must not count copied or repeated information as independent corroboration.

Where source independence cannot be established, it must remain unknown.

5.9 Assistant-generated content

Assistant-generated content must not independently establish user facts.

Examples:

- The assistant suggests that a user might prefer a certain approach.
- The assistant summarises an unconfirmed interpretation.
- The assistant generates a hypothetical plan.

These statements cannot become established personal memories merely because they appear in a conversation.

If the user explicitly confirms an assistant suggestion, the confirmation becomes a new user-authored source with its own provenance.

6. Memory claims and compound information

A memory should represent a claim that can be assessed, updated and retrieved without changing unrelated claims.

Avoid combining unrelated assertions into one record.

Example of an unsuitable compound memory:

«The user lives in Oxford, works at Company B, prefers remote work and is planning to move in 2027.»

These are separate claims with potentially different evidence, temporal validity and permissions.

They should be represented separately.

A memory may contain multiple related facts when they form one coherent event or relationship, but each component must remain independently assessable.

The system must not allow one supported component to make an unsupported component appear valid.

7. Lifecycle states and transitions

7.1 Permitted lifecycle states

The proposed lifecycle states are:

- "candidate"
- "active"
- "historical"
- "uncertain"
- "dismissed"


Deletion is an operation, not a lifecycle state.

This specification follows the later schema consistency decision that deletion must not be represented as an ordinary memory lifecycle state. The earlier record specification still lists "deleted" in its proposed lifecycleState enum and describes it as a deletion workflow state. That definition is a known cross-document inconsistency and must be reconciled before implementation. Until reconciliation is complete, "deleted" must not be treated as an approved ordinary lifecycle value.


7.2 Candidate

A candidate is awaiting validation or acceptance.

It must not be treated as an established memory in ordinary retrieval.

A candidate may be:

- Promoted.
- Retained for review.
- Rejected.
- Dismissed by the user.
- Removed through the deletion operation.


7.3 Active

An active memory has been accepted for permitted retrieval.

It must still pass:

- Evidence eligibility.
- Temporal assessment.
- Attribution checks.
- Scope checks.
- Audience checks.
- Use-policy checks.
- Restriction checks.

Active does not mean current, universally true or unrestricted.

7.4 Historical

A historical memory describes information that previously applied but is no longer current.

Examples:

- A previous job.
- An earlier preference that has changed.
- A completed plan.
- A former address.
- A past relationship status.

Historical information may remain useful when a user asks about the past.

It must not be presented as current without supporting evidence.

7.5 Uncertain

An uncertain memory has unresolved meaning, attribution, identity or truth.

It may be retained for inspection and correction.

It must not be presented as established fact.

If the uncertainty is resolved, it may transition to another appropriate state.

7.6 Dismissed

A dismissed memory has been explicitly rejected by the user or an authorised review operation.

Dismissal is a meaningful user decision.

It must not silently return to active status because:

- The same source is imported again.
- A similar statement appears later.
- An extraction process runs again.
- A derived summary repeats the claim.

A new, explicit user instruction may create a new memory, but it must not silently erase the original dismissal history where retention of that minimal decision metadata is permitted.

7.7 Transition table

Current state| Proposed next state| Permitted trigger
candidate| active| Validation and acceptance requirements satisfied
candidate| uncertain| Meaning, attribution or truth unresolved
candidate| dismissed| User or authorised review rejects it
active| historical| Validity has ended or a confirmed change supersedes it
active| uncertain| New evidence creates unresolved ambiguity
active| dismissed| User explicitly rejects the memory
historical| active| New evidence establishes that the same fact applies again
historical| uncertain| Historical interpretation becomes disputed
historical| dismissed| User rejects retention or interpretation
uncertain| active| Uncertainty is resolved and acceptance requirements pass
uncertain| historical| Evidence establishes a past validity period
uncertain| dismissed| User rejects the interpretation
dismissed| candidate| Explicit new user instruction to reconsider, or genuinely new independent source requiring review; never an ordinary re-import, duplicate, paraphrase or derived summary


Deletion is handled by the deletion operation defined in section 12, not by a lifecycle transition. A deletion request may originate from any lifecycle state.

A dismissed memory must never transition automatically to active.

A deletion operation removes the memory from the active dataset according to the approved deletion and recovery rules. It does not create a "deleted" lifecycle state.

7.8 Invalid transitions

The following are invalid:

- Candidate to active without validation.
- Dismissed to active through automatic re-import.
- Unsupported evidence to established active memory without new valid evidence.
- Historical to active merely because the system cannot determine the end date.
- Uncertain to active because a confidence score happens to be high.
- Active to historical solely because a newer message exists.
- Deleted information reappearing through a stale index or cache.

7.9 Transition history

Consequential transitions should be traceable.

The design must preserve enough information to explain:

- Previous state.
- New state.
- Operation or event causing the change.
- Time of the change.
- Relevant source or user action.
- Whether the transition was automatic or user-confirmed.

This history must not become a reason to retain deleted personal content.

The exact storage and retention model for transition history remains subject to the deletion and privacy design.

8. Updating, correction and supersession

8.1 Distinguish different changes

Mopapa must distinguish:

1. Correction of an earlier mistake.
2. A genuine change in circumstances.
3. A temporary exception.
4. A new event.
5. A contradiction that cannot yet be resolved.
6. A change in the user's intended scope or permission.

These are not interchangeable.

8.2 Correction

A correction means the earlier memory or interpretation was inaccurate.

Example:

Earlier memory:

«The user's appointment is on 12 June.»

New direct correction:

«I made a mistake. The appointment is on 14 June.»

The system should:

- Preserve the original source.
- Preserve the correction source.
- Mark the earlier interpretation as corrected or superseded through the appropriate relationship.
- Make the corrected information eligible for retrieval after validation.
- Avoid presenting the incorrect date as current.

The system must not silently edit the original message.

8.3 Genuine change

A genuine change means the earlier fact was valid but no longer applies.

Example:

«I now work at Company C instead of Company B.»

The system should:

- Retain the historical Company B memory where permitted.
- Establish the Company C memory with its own evidence.
- Represent the temporal change.
- Avoid treating the earlier information as a mistake.
- Ensure current retrieval selects the appropriate period.

8.4 Temporary exception

A temporary exception must not automatically replace a stable preference.

Example:

«I normally prefer remote meetings, but this one needs to be in person.»

The system must not change the stable preference to in-person meetings.

It should preserve the exception and its scope.

8.5 Contradiction handling

When two claims conflict:

1. Preserve both original sources.
2. Compare attribution.
3. Compare temporal validity.
4. Compare scope.
5. Check whether one is explicitly a correction.
6. Check whether one is a temporary exception.
7. Check whether both could be true in different contexts.
8. If unresolved, retain the conflict as disputed or uncertain.
9. Do not silently select the newest statement as universally correct.

8.6 Supersession relationships

A supersession relationship must identify:

- The earlier memory.
- The later memory.
- The reason for supersession.
- The supporting evidence.
- The relevant temporal boundary where known.
- Whether the relationship represents correction or genuine change.

Supersession must not create cycles.

A memory must not supersede itself.

A supersession relationship must not be created merely because two memories contain similar words.

8.7 Historical retention

Historical information should be retained only when its future value and permissions justify retention.

The system must not preserve every obsolete detail indefinitely by default.

The user must be able to inspect and delete historical memories.

Retention policy remains subject to the wider privacy and deletion specification.

9. Governance model

9.1 Governing principle

Governance must be evaluated for every requested use.

A memory is not globally permitted merely because one use is permitted.

The proposed use permissions remain:

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

Missing, invalid or unknown permission must be treated as denied.

9.2 Scope

Scope describes where information applies.

The proposed scope types remain:

- "personal"
- "conversation"
- "project"
- "topic"
- "event"
- "relationship"
- "other"
- "unknown"

Scope is not permission.

A memory scoped to a project is not automatically permitted for use in another project.

An unknown scope must not be treated as unrestricted.

9.3 Audience

The proposed audience types remain:

- "owner_only"
- "named_audience"
- "restricted_context"
- "unknown"

The initial default remains "owner_only".

Unknown audience must not be interpreted as public or unrestricted.

External sharing is not authorised.

9.4 Governance inheritance

A memory may be supported by multiple sources.

Every source that materially supports the memory must be considered when determining permitted use.

A memory-level permission cannot broaden the permissions of its supporting sources.

Conversation-level, message-level and memory-level restrictions must all be evaluated.

9.5 Conservative policy-combination algorithm

For each requested use, apply the following algorithm.

Step 1: Identify the requested use.

Examples:

- Direct answer.
- Contextual answer.
- Proactive surfacing.
- Cross-context reuse.
- Inference.
- Export.

Step 2: Identify the memory.

Confirm that it exists, is not deleted and has valid references.

Step 3: Identify every materially supporting source.

Include all valid provenance links that contribute to the claim.

Do not ignore a restricted source simply because another source is unrestricted.

Step 4: Collect applicable governance.

Collect:

- Conversation-level policy.
- Message-level policy.
- Memory-level policy.
- Applicable restrictions.
- Scope constraints.
- Audience constraints.
- Revocation decisions.
- Relevant user instructions.

Step 5: Evaluate each applicable permission.

For the requested use:

- Any explicit "deny" means deny.
- Any "unknown" means deny.
- Any missing or invalid value means deny.
- Only explicit "allow" at every applicable level can permit the use.

Step 6: Evaluate restrictions.

Any applicable restriction denying the requested use overrides an allow.

Step 7: Evaluate audience and scope.

The current context and audience must satisfy all applicable requirements.

Step 8: Evaluate source validity.

Deleted, revoked or invalid evidence must not contribute to the permitted memory.

Step 9: Decide.

Return either:

- "allow"
- "deny"

The system must not return a permissive result when evaluation fails.

9.6 Policy-combination examples

Source A| Source B| Memory policy| Result
allow| allow| allow| Allow, if all other checks pass
allow| deny| allow| Deny
allow| unknown| allow| Deny
deny| allow| allow| Deny
allow| allow| deny| Deny
allow| allow| unknown| Deny
allow| missing| allow| Deny

The most permissive source must never determine the result.

9.7 Permission is use-specific

Permission for a direct answer does not imply permission for:

- Proactive resurfacing.
- Cross-context reuse.
- Additional inference.
- Export.

Each use must be evaluated independently.

9.8 Restriction changes

When a restriction is added or changed:

1. Identify affected memories.
2. Identify dependent memories and relationships.
3. Recalculate permitted uses.
4. Invalidate prohibited derived indexes and cached context.
5. Prevent future retrieval for denied uses.
6. Record the permitted governance change history.
7. Ensure future imports do not silently remove the restriction.

9.9 Governance failure

If the system cannot determine whether a use is permitted:

- Exclude the memory from that use.
- Do not pass it into answer context.
- Do not use it as an unstated premise.
- Do not expose it through a summary.
- Do not silently downgrade the restriction.

The user may be told that relevant information was excluded because its permission or scope could not be established, without unnecessarily disclosing restricted content.

10. Retrieval eligibility

10.1 Retrieval is not the same as storage

A stored memory is not automatically eligible for every retrieval request.

Retrieval eligibility requires separate checks.

10.2 Eligibility requirements

A memory may enter ordinary retrieval results only if:

1. The memory record is valid.
2. Its lifecycle state permits the requested retrieval.
3. Its evidence state is suitable for the intended answer.
4. Its attribution is valid.
5. Its temporal interpretation is appropriate.
6. Its scope matches the current context.
7. Its audience permits the use.
8. Its use policy permits the requested use.
9. No applicable restriction denies the use.
10. No deletion or revocation operation invalidates the relevant evidence.
11. Its supporting provenance references resolve.
12. The memory does not depend on a prohibited derived record.

10.3 State-specific retrieval

Lifecycle| Ordinary retrieval treatment
candidate| Exclude
active| Eligible subject to all other checks
historical| Eligible for historical questions; not current-fact answers without qualification
uncertain| Exclude from established-fact answers; may be shown as uncertain when relevant and permitted
dismissed| Exclude
deleted| Must not exist in ordinary retrieval

An active memory with "unsupported" evidence must not be used as an established fact.

An active memory with "disputed" evidence must not be presented as settled.

10.4 Historical retrieval

When the user asks about a previous period, historical memories may be eligible.

The answer must preserve the temporal distinction.

Example:

Question:

«Where did I work before Company C?»

A historical Company B memory may be relevant.

Question:

«Where do I work now?»

The historical Company B memory must not be presented as current unless new evidence supports that conclusion.

10.5 Uncertain retrieval

Uncertain information may be surfaced only when:

- It is relevant to the question.
- Its use is permitted.
- Its uncertainty is made explicit.
- The system does not present it as an established fact.

Where uncertainty cannot be explained clearly, the system should abstain.

10.6 Retrieval must not repair evidence gaps

The answer layer must not fill missing evidence with plausible assumptions.

If the memory establishes only a month, the system must not invent a day.

If the subject is unresolved, the answer must not invent an identity.

If a memory is disputed, the answer must not silently choose one side.

11. Answering and abstention

11.1 Answering requirements

Before an answer uses a memory, the system must establish:

- What claim is being used.
- Which evidence supports it.
- Whether the evidence is sufficiently specific.
- Whether the source attribution is appropriate.
- Whether the memory is temporally relevant.
- Whether the requested use is permitted.
- Whether conflicting evidence exists.

11.2 Abstention conditions

The system must abstain from making an established factual claim when:

1. No valid supporting evidence exists.
2. The evidence is insufficient for the requested specificity.
3. The memory is unsupported.
4. The memory is disputed and the conflict is unresolved.
5. Attribution is materially uncertain.
6. Temporal validity is insufficient to answer a current-fact question.
7. Governance denies the requested use.
8. Required permissions are unknown.
9. The relevant source has been deleted or revoked.
10. The answer would require an unsupported inference.

11.3 Qualified answers

A qualified answer may be used when the evidence supports a narrower statement.

Example:

Evidence:

«I started working there in March 2026.»

Question:

«When did I start?»

Permitted answer:

«You said you started in March 2026. The exact day was not recorded.»

Not permitted:

«You started on 1 March 2026.»

11.4 Evidence explanations

Where useful and permitted, Mopapa should be able to explain:

- Which source supports the memory.
- Whether it was directly stated or reported.
- Whether the evidence is incomplete.
- Whether the information is historical.
- Whether a conflict remains unresolved.

Explanations must not expose restricted source content.

11.5 Deterministic answer boundary

This specification does not authorise replacing Mopapa's deterministic Ask engine with an external or hosted language model.

Any future answer-generation change requires a separate architecture, privacy, cost and evaluation decision.

12. Deletion, dismissal and revocation

These operations have different meanings and must not be treated as interchangeable.

12.1 Dismissal

Dismissal means the user does not want a candidate or interpretation accepted.

The system should:

- Stop the candidate from being promoted.
- Prevent automatic reactivation.
- Remove it from ordinary retrieval.
- Preserve only the minimum permitted decision metadata.
- Avoid retaining prohibited original content merely to remember the dismissal.

Dismissal does not automatically delete the original conversation.

12.2 Deleting a memory

Deleting a memory means removing that derived record.

The operation must:

1. Identify the memory.
2. Identify its provenance links.
3. Identify relationships involving it.
4. Identify dependent memories and derived indexes.
5. Remove the memory and its associated derived records.
6. Remove or rebuild affected indexes and caches.
7. Preserve original source messages unless the user separately requests their deletion.
8. Apply the approved re-import suppression policy where applicable.

Deleting one memory must not automatically delete an entire conversation.

12.3 Deleting a source message

Deleting a source message must:

1. Identify every memory supported by it.
2. Remove the source message.
3. Remove provenance links to it.
4. Reassess the remaining evidence for each affected memory.
5. Reassess dependent relationships.
6. Remove derived information that depends exclusively on the deleted message.
7. Preserve memories supported by valid independent sources where appropriate.
8. Recalculate governance.
9. Remove prohibited index and cache material.
10. Ensure no orphaned references remain.

A memory with no valid remaining support must become ineligible for established-fact retrieval and be reassessed.

12.4 Deleting a conversation

Deleting a conversation must identify:

- All messages in the conversation.
- All provenance links to those messages.
- All affected memories.
- All relationships depending on affected memories.
- All derived summaries and indexes.
- All governance restrictions originating from the conversation.

The user must be informed of the consequences where independent memories or other sources are involved.

The deletion operation must not silently preserve unsupported derived memories as though their original evidence still existed.

12.5 Revocation

Revocation means that a previously permitted use is no longer permitted.

It is a governance operation, not merely a lifecycle transition.

Revocation must:

- Deny the affected use immediately after successful application.
- Reassess dependent memories.
- Reassess indexes and caches.
- Prevent the revoked source from contributing to prohibited future answers.
- Apply to future retrieval and future imports.
- Preserve only the minimum permitted metadata needed to enforce the revocation.

Revocation does not automatically mean that the original content must be deleted for every other permitted purpose.

The exact scope of revocation must be explicit.

12.6 Deletion versus revocation

Operation| Primary effect
Dismiss memory| Reject an extraction or interpretation
Delete memory| Remove a derived memory
Delete message| Remove original evidence and reassess dependent records
Delete conversation| Remove the conversation and process its dependent records
Revoke use| Deny a specified use of information
Restrict use| Narrow the permitted contexts or uses

12.7 Backups and recovery copies

Live deletion must be distinguished from deletion in:

- Existing recovery copies.
- Previously exported backups.
- Downloaded files.
- Restored older backups.

Mopapa must not claim that a live deletion erased copies that it cannot access.

The backup and recovery specification must define:

- Which copies are retained.
- For how long.
- How deletion affects recoverable copies.
- How restored backups are checked against valid deletion decisions.
- What happens when deletion suppression metadata is unavailable.

This document does not authorise an import ledger or a new persistent collection.

The retention and privacy design for deletion-suppression metadata remains a separate blocking decision.

13. Re-import and duplicate protection

13.1 General rule

Repeated imports must not silently recreate dismissed, deleted or revoked information.

13.2 Stable source identity

Where available, stable source identifiers should be used to recognise previously imported material.

Text similarity alone must not be treated as proof that two records are identical.

13.3 No stable source identity

If an import source does not provide a stable identifier:

- The system must not claim reliable duplicate or deletion suppression.
- Similarity may be used to flag a possible duplicate for review.
- It must not automatically restore dismissed information.
- It must not automatically override a deletion decision.

13.4 Re-import after deletion

A deliberate deletion must not be undone by an ordinary repeat import.

Restoration requires an explicit user decision and must follow the approved deletion and recovery policy.

13.5 Import suppression privacy

Suppression metadata must not retain raw deleted message text merely to identify a previous import.

Any retained identifier or fingerprint must have:

- A defined purpose.
- A minimum necessary data policy.
- A retention period.
- A deletion policy.
- A documented privacy assessment.

No additional persistent collection is approved by this specification.

14. Derived information and dependency propagation

A derived memory may depend on:

- One or more original messages.
- Other memories.
- A relationship between memories.
- A summary or consolidation operation.
- A user-confirmed correction.

The system must know which sources materially support a derived claim.

14.1 Dependency requirements

Every derived memory must be traceable to its supporting evidence.

A derived memory must not become independent merely because it has been summarised or copied.

14.2 Source removal

When a source is deleted or revoked:

1. Identify direct dependent memories.
2. Identify indirect dependencies.
3. Recalculate remaining evidence.
4. Recalculate permissions.
5. Reassess lifecycle.
6. Remove invalid derived content.
7. Rebuild or invalidate affected indexes and caches.

14.3 No permission laundering

A restricted source must not become unrestricted through:

- Summarisation.
- Rewording.
- Consolidation.
- Relationship creation.
- Memory-to-memory derivation.
- Search indexing.
- Answer context assembly.

Changing the wording does not remove the original source restrictions.

14.4 Dependency cycles

The dependency model must reject cycles where a derived memory indirectly becomes its own supporting evidence.

Relationships and provenance must remain distinguishable.

15. User inspection and correction

Users must be able to understand what Mopapa believes it remembers.

The future interface should make it possible to inspect:

- The memory claim.
- Its subject.
- Its attribution.
- Its original evidence.
- Its temporal validity.
- Its lifecycle state.
- Its evidence state.
- Its scope and audience.
- Its permitted uses.
- Its restrictions.
- Any corrections or supersession relationships.

15.1 Correction

A user correction must create a traceable change.

It must not silently rewrite the original source.

The system must reassess:

- The corrected claim.
- Its supporting evidence.
- Its provenance.
- Its temporal interpretation.
- Related memories.
- Relationships and retrieval eligibility.

15.2 User override

A user may explicitly instruct Mopapa to remember a particular interpretation.

This must be recorded as a user-directed memory operation.

It does not authorise the system to invent supporting evidence or misrepresent an original message.

15.3 User deletion

Deletion must be available without requiring the user to understand the internal dependency graph.

The system should explain material consequences in understandable terms before a destructive operation where appropriate.

16. Worked examples

16.1 Stable preference

Original message:

«I prefer short, direct explanations.»

Interpretation:

- Candidate type: preference.
- Author: user.
- Subject: user.
- Evidence attribution: user.
- Provenance: supports.
- Evidence state: supported.
- Lifecycle: eligible for active promotion after validation.
- Temporal validity: unknown start unless established elsewhere.
- Governance: owner-only by default.
- Retrieval: permitted only for uses explicitly allowed by policy.

The system must not infer that the user dislikes every detailed explanation.

16.2 Preference change

Earlier message:

«I prefer short explanations.»

Later message:

«I've changed my mind. I now want more detailed explanations.»

Interpretation:

- Preserve both sources.
- Treat the later message as an explicit correction or preference change according to its wording.
- Retain the earlier preference as historical where permitted.
- Establish the newer preference as the current candidate.
- Do not erase the original statement.
- Ensure current retrieval does not return the old preference as current.

16.3 Temporary exception

Original message:

«I normally prefer remote meetings.»

Later message:

«This meeting needs to be in person.»

Interpretation:

- The stable preference remains unchanged.
- The in-person requirement is specific to one meeting.
- Scope must distinguish the meeting from the general preference.
- No supersession relationship should be created unless the user indicates a genuine preference change.

16.4 Reported third-party statement

Original message:

«My manager told me the office will close in December.»

Interpretation:

- Author: user.
- Quoted or reported speaker: manager.
- Evidence attribution: third party for the reported statement.
- The evidence establishes that the user reported the statement.
- It does not independently establish that the office will close.
- Any memory about the closure must preserve its reported nature.
- A direct factual assertion about the closure must not be promoted without sufficient evidence.

16.5 Conflicting dates

Earlier message:

«The appointment is on 12 June.»

Later message:

«I think the appointment might be on 14 June.»

Interpretation:

- Both sources remain preserved.
- The later statement is tentative.
- It does not automatically correct the earlier date.
- The memory becomes uncertain or disputed if the conflict affects the same appointment.
- Mopapa should ask for clarification or qualify its answer.

16.6 Deleted source with another valid source

Two independent sources support a memory.

The user deletes one source.

Interpretation:

- Remove the deleted source and its provenance link.
- Reassess the remaining source.
- Preserve the memory only if the remaining evidence still supports the claim.
- Recalculate governance using the remaining valid evidence.
- Do not claim that the deleted source remains available as evidence.

16.7 Restricted source

A message allows direct answers but denies cross-context reuse.

A memory derived from it is later relevant to a different project.

Interpretation:

- The source restriction applies to the derived memory.
- Cross-context reuse is denied.
- The memory must be excluded before answer context assembly.
- A summary of the memory must not bypass the restriction.

16.8 Unknown permission

A source has no recorded permission for proactive surfacing.

Interpretation:

- Proactive surfacing is denied.
- A separate explicit permission may allow direct answers.
- The system must not infer proactive permission from direct-answer permission.

16.9 Assistant suggestion

Assistant:

«You might prefer working in the morning.»

User does not confirm.

Interpretation:

- No personal preference memory is established.
- The assistant suggestion is not evidence of the user's preference.
- It must not be promoted.

16.10 User confirms a suggestion

Assistant:

«You might prefer working in the morning.»

User:

«Yes, I do prefer working in the morning.»

Interpretation:

- The user's confirmation is a new source.
- Attribution is user.
- The confirmed preference may become a candidate.
- The assistant's original suggestion is not the supporting user evidence.

17. Validation invariants

A valid implementation must enforce the following invariants.

17.1 Candidate invariants

- Candidates are not ordinary established memories.
- Every candidate has traceable source evidence.
- Every candidate has valid attribution or explicitly unresolved attribution.
- Every candidate has an explicit validation outcome.
- Rejected candidates cannot silently become active.
- Automatic promotion must follow defined acceptance rules.

17.2 Evidence invariants

- Every supported memory has valid supporting provenance.
- Evidence spans conform to the identity and temporal specification.
- Unsupported memories cannot be used as established facts.
- Partially supported claims cannot be presented as fully supported.
- Disputed evidence cannot be silently resolved.
- Repeated derived content is not automatically independent corroboration.
- Deleted and revoked evidence cannot support prohibited uses.

17.3 Lifecycle invariants

- Lifecycle and evidence states are independent.
- Every transition has a permitted trigger.
- Dismissed memories cannot automatically return to active.
- Historical memories are not automatically current.
- Active memories still require temporal and governance checks.
- Deleted records do not remain in ordinary retrieval.
- Supersession relationships cannot form cycles.

17.4 Governance invariants

- Missing permission denies the disputed use.
- Unknown permission denies the disputed use.
- Explicit denial overrides allow.
- Multiple sources are combined conservatively.
- Derived memories cannot broaden source permissions.
- Unknown scope is not unrestricted scope.
- Unknown audience is not permission to disclose.
- Governance is checked before retrieval and answer context assembly.
- Restrictions propagate through derived information.

17.5 Deletion invariants

- Deleting a memory does not automatically delete its original messages.
- Deleting a message triggers dependent-memory reassessment.
- Deleting a conversation processes all dependent records.
- Revocation prevents the prohibited use through derived information.
- Re-import cannot silently undo a deliberate deletion or dismissal.
- Stale indexes and caches cannot restore deleted or revoked information.
- The application does not claim to erase external backup files it cannot access.

17.6 Retrieval invariants

- Candidate memories are excluded from ordinary established-fact retrieval.
- Dismissed memories are excluded.
- Unsupported memories are not treated as established facts.
- Uncertain memories are qualified or excluded.
- Historical information is temporally qualified.
- Governance is checked before answer context assembly.
- The answer layer cannot bypass retrieval restrictions.
- Missing evidence results in qualification or abstention.

18. Required evaluation fixtures

Before implementation, the evaluation dataset must include at least the following cases.

Fixture| Required expected behaviour
Clear direct personal fact| Correct attribution and candidate formation
Explicit remember request| Correct user-directed memory candidate
Assistant suggestion without confirmation| No user memory promotion
Assistant suggestion with confirmation| New user-authored evidence
Repeated copied statement| No false independent corroboration
Independent supporting sources| Correct provenance aggregation
Partial claim support| Partial support, not full factual assertion
Contradictory direct statements| Disputed or uncertain state
Explicit correction| Correct supersession handling
Genuine preference change| Historical and current records distinguished
Temporary exception| Stable preference retained
Hypothetical statement| No real personal fact promotion
Quoted third-party statement| Correct author and quoted-speaker separation
Unknown attribution| No invented identity
Unknown temporal validity| No invented date
Candidate dismissal| No automatic reactivation
User deletion| Derived information removed or reassessed
Source deletion| Dependent memories reassessed
Conversation deletion| All dependent records processed
Revoked direct-answer permission| Direct-answer use denied
Revoked cross-context permission| Cross-context use denied
Unknown permission| Disputed use denied
Conflicting source permissions| Conservative denial
Restricted source in summary| No permission laundering
Deleted source in cached context| Cache invalidated
Re-import after dismissal| No silent restoration
Re-import after deletion| No silent restoration
Historical memory in current question| No presentation as current
Uncertain memory in factual answer| Qualification or abstention
Unsupported memory| No established-fact answer
Supersession cycle| Validation rejects it
Dependency cycle| Validation rejects it

The fixtures must include both valid and invalid cases.

Expected outcomes must be explicit and machine-testable where possible.

The test suite must not rely only on successful happy-path examples.

19. Acceptance criteria

This specification is ready for implementation review only when all the following conditions are satisfied.

Memory formation

- [ ] Candidate formation criteria are explicit.
- [ ] Rejection criteria are explicit.
- [ ] Automatic promotion is limited to defined cases.
- [ ] Assistant-generated content cannot silently become user fact.
- [ ] Repeated evidence is not mistaken for independent corroboration.
- [ ] User confirmation is distinguishable from automatic extraction.

Evidence and lifecycle

- [ ] Evidence states have unambiguous definitions.
- [ ] Lifecycle states have unambiguous definitions.
- [ ] Every permitted transition has a defined trigger.
- [ ] Invalid transitions are rejected.
- [ ] Correction, change and temporary exception are distinguished.
- [ ] Historical information cannot silently become current.
- [ ] Supersession and dependency cycles are rejected.

Governance

- [ ] All use permissions are independently evaluated.
- [ ] Missing and unknown permissions deny the requested use.
- [ ] Explicit denial overrides allow.
- [ ] Multi-source permissions are combined conservatively.
- [ ] Restrictions propagate through derived information.
- [ ] Scope and audience are evaluated separately from permission.
- [ ] Governance runs before retrieval and context assembly.

Retrieval and answering

- [ ] Candidate, dismissed and deleted memories are excluded from ordinary retrieval.
- [ ] Unsupported memories cannot be presented as established facts.
- [ ] Disputed and uncertain memories are qualified or excluded.
- [ ] Historical memories are temporally qualified.
- [ ] Evidence gaps cause abstention or a narrower answer.
- [ ] The answer layer cannot bypass governance.

Deletion and revocation

- [ ] Memory deletion behaviour is explicit.
- [ ] Message deletion behaviour is explicit.
- [ ] Conversation deletion behaviour is explicit.
- [ ] Revocation behaviour is explicit.
- [ ] Derived information and caches are addressed.
- [ ] Re-import suppression has a privacy-approved design.
- [ ] Backup and recovery behaviour is reconciled.
- [ ] No deletion claim exceeds what the application can actually guarantee.

Evaluation

- [ ] Every required fixture has an expected result.
- [ ] Existing Ask regression tests remain intact.
- [ ] Existing 50-question evaluation remains separate.
- [ ] Oracle diagnostics remain separate from non-oracle retrieval evaluation.
- [ ] Negative and adversarial cases are included.
- [ ] Evaluation measures false memories and unsafe retrieval, not only recall.

20. Unresolved decisions

The following remain blocking decisions for implementation.

1. The precise candidate acceptance rules for each memory type.
2. Whether any memory categories require mandatory user confirmation.
3. The exact user-facing review and correction workflow.
4. The retention policy for historical memories.
5. The retention policy for dismissed-memory suppression metadata.
6. The deletion-suppression mechanism and its privacy implications.
7. The backup and recovery interaction with deletion decisions.
8. The exact representation of lifecycle transition history.
9. The exact representation of dependency relationships.
10. The scope and permitted uses of user-confirmed interpretations.
11. How sensitive information is identified and governed without introducing unsupported classification assumptions.
12. The exact retrieval behaviour for partially supported memories.
13. The exact policy for multiple supporting sources when one source is revoked.
14. How derived indexes and caches are invalidated reliably.
15. Whether any future automatic promotion rules require explicit user-configurable controls.

These decisions must be resolved against the architecture, record specification, storage design and evaluation fixtures before production implementation.

21. Implementation boundaries

This document does not approve:

- Production JavaScript changes.
- A live schema change.
- Schema version 2 activation.
- A new persistent collection.
- An import ledger.
- IndexedDB migration.
- A replacement storage engine.
- External AI inference.
- Paid APIs or recurring services.
- Cloud synchronisation.
- Automatic ingestion from other applications.
- External sharing.
- Replacing manual entries.
- Replacing deterministic Ask.
- Unrestricted automatic memory extraction.

The current application must remain operational throughout future development.

Existing manual entries remain separate from extracted memories.

The current local-first architecture remains the implementation baseline.

Any future implementation proposal must identify its exact files, data changes, migration path, rollback strategy, test coverage and acceptance criteria before code changes are authorised.

22. Required next work

After review of this specification, the next design work should address:

1. Deletion, revocation, recovery and re-import suppression as one complete transaction specification.
2. Backup and restore compatibility across the proposed memory collections.
3. Evaluation dataset design and measurable acceptance thresholds.
4. Identity and governance interactions with the existing manual-entry system.
5. A final cross-document consistency review.
6. An implementation readiness review identifying every remaining blocker.

No production implementation should begin until those items are reconciled and explicitly approved.

---

Final status: Proposed specification complete for review. Implementation remains unauthorised.