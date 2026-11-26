Mopapa Personal Memory Research Review

Review date: 19 November 2026
Status: Research review completed; target architecture direction approved on 19 November 2026; Stage 1 storage foundation implemented and verified on 26 November 2026; subsequent production stages remain subject to explicit approval.
Product: Mopapa Personal Memory Companion
Repository: https://github.com/kynaruniverse/Mopapa

---

1. Purpose

This document records research into long-term conversational memory, personal information management, memory governance, retrieval, local execution and evaluation.

Its purpose is to establish what Mopapa should become before further production engineering begins.

The objective is not to reproduce an existing research system. It is to identify the capabilities, architectural principles and failure protections required for a reliable personal memory companion.

The research must inform decisions without turning every published technique into a product requirement.

This document distinguishes:

- Published research findings.
- Benchmark capabilities and limitations.
- Architectural recommendations.
- Architectural recommendations and decisions, with their current approval status recorded in the architecture and data-model specifications.
- Features that have actually been implemented.

A benchmark result is not proof that Mopapa will achieve equivalent performance. Research systems frequently use different models, hardware, prompts, datasets and evaluation methods.

2. Product objective

Mopapa should evolve into a personal information and memory system with a conversational interface.

It should eventually:

- Capture authorised information with minimal manual effort.
- Preserve original conversations and evidence.
- Identify potentially useful personal memories.
- Understand people, events, preferences and relationships.
- Recognise changes over time.
- Retrieve relevant information across separate conversations.
- Use memories appropriately in ordinary conversation.
- Explain the evidence supporting an answer.
- Recognise uncertainty and abstain when necessary.
- Give the user control over inspection, correction, restriction and deletion.

The objective is dependable personal memory, not maximum data collection or maximum answer rate.

3. Non-negotiable economic and privacy constraints

3.1 Zero-cost development requirement

Mopapa must not acquire a recurring financial obligation before the product can support it through revenue.

Not approved before a separate explicit decision:

- Paid AI APIs.
- Hosted language-model inference.
- Paid embedding or reranking services.
- Paid vector databases.
- Paid database hosting.
- Paid cloud storage.
- Paid subscriptions or metered developer services.
- Hidden paid fallbacks.
- External services that introduce unavoidable usage charges.

Permitted for investigation:

- Free and appropriately licensed open-source software.
- Deterministic algorithms.
- Local browser processing.
- Free benchmark datasets, subject to their individual licences and conditions.
- Existing free development and CI allowances.
- User-controlled imports and exports.

Free software does not mean free operation. Hardware, battery use, storage, maintenance, compatibility and licensing must be considered.

A free cloud tier must not be treated as a permanent architectural guarantee.

3.2 Privacy requirement

Personal information must remain on the user's device by default.

No cloud processing, synchronisation, account requirement or external AI processing is authorised by this research review.

Automatic capture means capturing information the user provides to Mopapa or explicitly authorises it to import. It does not mean silently reading other Android applications.

Any future external source or integration requires a separate privacy, security, permission and cost review.

4. Benchmark research

4.1 LoCoMo

Primary sources

- https://aclanthology.org/2024.acl-long.747/
- https://github.com/snap-research/LoCoMo

LoCoMo evaluates very long-term conversational memory.

The published dataset describes conversations averaging approximately 600 turns and 16,000 tokens, extending across as many as 32 sessions.

It includes question answering, event summarisation and multimodal dialogue tasks.

Its question categories cover:

- Single-hop factual recall.
- Multi-hop reasoning.
- Temporal reasoning.
- Open-domain questions.
- Adversarial questions.

What it reveals

A memory system must connect information across separate conversations, understand event chronology and distinguish supported answers from unsupported questions.

It also demonstrates that long context windows and ordinary retrieval do not automatically solve long-range temporal and causal reasoning.

Limitations

LoCoMo is a benchmark built from constructed conversational scenarios, not a representative sample of every real personal-memory use case.

Its multimodal tasks are not an immediate requirement for Mopapa.

Mopapa application

Use LoCoMo as a major external retrieval and reasoning evaluation source. Prioritise text, chronology, multi-session recall and abstention initially.

4.2 LongMemEval

Primary source

- https://github.com/xiaowu0162/LongMemEval

LongMemEval evaluates long-term memory in assistant conversations.

Its central capabilities include:

- Information extraction.
- Multi-session reasoning.
- Temporal reasoning.
- Knowledge updates.
- Abstention when evidence is unavailable.

The Oracle, S and M resources serve different diagnostic purposes.

- Oracle: evidence is supplied, allowing interpretation and reasoning to be examined separately from retrieval.
- S: tests retrieval over a substantial history containing relevant and irrelevant material.
- M: tests retrieval at a larger history scale.

What it reveals

A system can fail because it did not preserve information, failed to retrieve it, misunderstood the retrieved evidence or answered beyond what the evidence supports.

These failure types must be measured separately.

Mopapa application

Keep the existing Oracle subset separate from retrieval evaluation. Add S and M evaluation only after the ingestion and retrieval interfaces can support a meaningful comparison.

Do not merge LongMemEval scores into Mopapa's existing 50-question note evaluation.

4.3 TimlMemBench

Primary sources

- https://aclanthology.org/2026.findings-emnlp.507/
- https://github.com/lyirs/TimlMemBench

TimlMemBench evaluates governed use of long-term memory.

Its nine dimensions are:

1. Write.
2. Revoke.
3. Supersede.
4. Preserve.
5. Scope.
6. Provenance.
7. Boundary.
8. Activation.
9. Proactive.

The published package describes 208 reviewed samples, 1,566 sessions, 1,715 questions and 1,821 governance or activation cases.

The 1,821 figure is the combined count of governance and activation cases, not the question count.

It provides two distinct evaluation tracks:

- Canonical-pool control, where systems receive a common prepared memory pool.
- Raw-native evaluation, where systems must ingest the original sessions themselves.

The dataset uses synthetic identities and situations.

What it reveals

A memory can be factually correct but still be inappropriate to use.

Information may have been revoked, superseded, restricted to a context or rendered irrelevant.

A system must also know when not to surface information.

Mopapa application

Treat memory governance as a core architectural requirement, not an optional privacy feature.

Prioritise the raw-native evaluation because it tests the entire ingestion and memory lifecycle.

4.4 HaluMem

Primary sources

- https://aclanthology.org/2026.emnlp-main.220/
- https://github.com/MemTensor/HaluMem

HaluMem evaluates hallucination at three separate operational stages:

- Memory extraction.
- Memory updating.
- Memory question answering.

The published research describes HaluMem-Medium and HaluMem-Long, with approximately 15,000 memory points and 3,500 questions.

Its histories extend beyond one million tokens.

What it reveals

Incorrect memories can be introduced during extraction, reinforced during updates and later presented as facts in answers.

End-to-end answer accuracy alone cannot identify where the error originated.

Mopapa application

Create independent evaluation gates for:

- Correct source capture.
- Correct memory extraction.
- Correct update decisions.
- Correct retrieval.
- Correct answer generation.

Measure false memories, omissions and unsupported claims separately.

4.5 HorizonBench

Primary source

- https://arxiv.org/abs/2604.17283

HorizonBench evaluates personalisation when preferences evolve over long periods.

Its research describes 360 simulated users, 4,245 evaluation items and six-month conversational histories averaging approximately 4,300 turns.

It examines preference changes and the ability to track updated user state.

What it reveals

Systems can continue using an earlier preference after a later event has changed the user's circumstances.

The research identifies belief-update failure as a significant problem.

Limitations

The benchmark uses simulated users and generated histories. Its results should not be treated as direct evidence of performance with real people.

A life event does not necessarily prove that a preference has changed.

Mopapa application

Represent preferences with time, context and evidence. Distinguish explicit changes from uncertain inferences. Ask for confirmation when a change cannot safely be established.

4.6 MemArena and MemArena-L

Primary sources

- https://arxiv.org/abs/2608.02613
- https://arxiv.org/html/2608.02613

MemArena investigates on-device personal memory assistants in an ego-centric, multi-session environment.

Its research describes 50 simulated agents over 15 days, approximately 10.3 million dialogue-text tokens overall and multiple recall, reasoning and trustworthiness evaluation dimensions.

MemArena-L is the long-horizon benchmark component.

The paper evaluates open-weight readers and different memory backends, including retrieval baselines and memory systems.

One important finding is that permission-aware access remains difficult even when retrieval quality is otherwise strong.

What it reveals

On-device execution does not remove the need for careful memory governance.

A system can retrieve information accurately but disclose it incorrectly, or fail to disclose information that it is permitted to use.

Mopapa application

This is a high-priority benchmark for the eventual local-first product.

Investigate its permission and trustworthiness tasks, but do not assume its tested hardware or models are suitable for ordinary Android devices.

The research describes code and benchmark release plans. Verify the actual availability, licence and reproducibility of the relevant materials before depending on them.

4.7 GroupMemBench

Primary source

- https://arxiv.org/abs/2605.14498

GroupMemBench evaluates memory across multi-party conversations.

It focuses on:

- Group dynamics.
- Speaker-grounded belief tracking.
- Audience-adapted language.
- Knowledge updates.
- Ambiguous terms.
- Temporal reasoning.
- Abstention.

Its findings indicate that speaker attribution and multi-user knowledge updates remain difficult.

What it reveals

A statement's speaker is not necessarily the person it concerns.

The system must not merge every statement in a group conversation into a single undifferentiated user profile.

Mopapa application

Preserve participant identity and message authorship separately from the subject of a memory.

Audience and visibility must be explicit if Mopapa ever supports shared or multi-person contexts.

4.8 MemoryAgentBench

Primary source

- https://arxiv.org/abs/2507.05257

MemoryAgentBench evaluates four competencies:

- Accurate retrieval.
- Test-time learning.
- Long-range understanding.
- Selective forgetting.

It uses incremental multi-turn interaction rather than only static completed histories.

What it reveals

Memory quality must be tested while new information is arriving and existing knowledge is changing.

Selective forgetting must be evaluated as a controlled behaviour, not simply as deletion of old information.

Mopapa application

Test repeated ingestion, updates, corrections, revocation and retrieval across successive interactions.

4.9 LoCoMo-Conv

Primary source

- https://aclanthology.org/2026.findings-emnlp.1289/

LoCoMo-Conv reformulates memory questions into natural conversational contexts.

It evaluates:

- Dialog queries.
- Implicit queries.
- Counterfactual queries.
- Composed queries.

The research finds that conventional question-answering benchmarks can miss retrieval failures in implicit and composed conversation.

It also finds that better retrieval does not automatically produce better responses.

What it reveals

A companion must identify relevant history even when the user does not explicitly ask a memory question.

It must also recognise false premises and combine multiple memories without losing their evidence.

Mopapa application

Create a separate conversational-use evaluation set. Include natural, indirect requests and false recollections.

4.10 LoCoMo-Plus

Primary sources

- https://aclanthology.org/2026.acl-long.1150/
- https://github.com/xjtuleeyf/Locomo-Plus

LoCoMo-Plus evaluates cognitive memory beyond factual recall.

It examines whether systems retain and apply implicit constraints, goals and values when a later situation calls for them.

What it reveals

Remembering a fact is not always sufficient. The system may need to retain the reason or constraint that makes the fact relevant.

Mopapa application

Preserve important context when supported by evidence.

Do not turn inferred motives, emotions or values into established personal facts. Such interpretations require explicit provenance and uncertainty.

4.11 BEAM

Primary source

- https://proceedings.iclr.cc/paper_files/paper/2026/hash/d7f0cfa0fe759b033d5262e1bb7d4065-Abstract-Conference.html

BEAM evaluates long-term memory over coherent conversations reaching up to 10 million tokens.

Its dataset contains 100 conversations and 2,000 validated questions.

The paper also proposes LIGHT, using episodic memory, working memory and a scratchpad.

What it reveals

Even very large context windows can struggle with long histories.

A layered memory approach can help, but this does not establish that every system needs a complex multi-agent architecture.

Mopapa application

Use BEAM as a later scalability and long-context research reference. Do not make its scale an initial product requirement.

4.12 MemoryArena agentic evaluation

Primary source

- https://proceedings.mlr.press/v306/he26am.html

MemoryArena also evaluates how accumulated experience affects later actions across interdependent tasks.

It connects memory acquisition, memory use and task outcomes.

What it reveals

A system can perform well at static memory question answering and still fail to apply what it learned in a later situation.

Mopapa application

Treat task-oriented memory as a later-stage capability. Mopapa should not become an autonomous agent merely to improve a benchmark score.

4.13 DolphinBench

Primary source

- https://arxiv.org/html/2609.24971

DolphinBench examines agent memory through a long-horizon evaluation framework, including the trade-off between capability, latency and cost.

What it reveals

Memory quality must be considered alongside operational efficiency.

Mopapa application

Use cost, latency and resource consumption as evaluation dimensions if local model execution is eventually investigated.

Do not introduce an agentic task framework into the initial product.

5. Research synthesis: what the benchmarks collectively reveal

The research points to several distinct failure classes.

5.1 Capture failures

- Important information is never preserved.
- The wrong message or conversation is stored.
- Speaker attribution is lost.
- Original timestamps or sequence are changed.
- Duplicate imports create repeated records.

5.2 Extraction failures

- A hypothetical statement becomes a fact.
- Assistant-generated text becomes a user belief.
- A temporary intention becomes a permanent preference.
- A statement about another person becomes a statement about the user.
- A causal or emotional interpretation is invented.
- An important qualification is removed during summarisation.

5.3 Update failures

- An outdated preference remains active.
- A new fact incorrectly overwrites a historical fact.
- A contradiction is silently resolved.
- A correction is ignored.
- A revoked memory remains available for use.
- Consolidation destroys important distinctions.

5.4 Retrieval failures

- Relevant evidence is missed.
- Irrelevant memories dominate results.
- Multiple sessions are not connected.
- The wrong person or entity is matched.
- Historical information is confused with current information.
- A relevant constraint is missed because the user did not explicitly ask for it.

5.5 Governance failures

- Private information is used in the wrong context.
- Information about another person is attributed to the user.
- A restricted memory is surfaced.
- A deleted memory reappears through another source.
- A user correction is not respected.
- The system reveals more personal information than the request requires.

5.6 Answer failures

- An answer is plausible but unsupported.
- The system gives an answer despite insufficient evidence.
- A source is cited but does not support the claim.
- Uncertainty is hidden.
- The answer ignores a relevant historical change.
- Retrieved evidence is correct but interpreted incorrectly.

These failure classes should become separate evaluation categories.

6. Architectural research

6.1 Episodic memory

Episodic memory preserves events and their context.

It should answer questions such as:

- What happened?
- When did it happen?
- Who was involved?
- What was discussed?
- What evidence supports the event?

Original messages should remain available independently of any summary or extracted memory.

6.2 Semantic memory

Semantic memory represents information that can be retrieved as facts, preferences or enduring knowledge.

Examples:

- A current preference.
- A person's occupation.
- A recurring constraint.
- A known relationship.

Semantic records must remain linked to evidence and time.

6.3 Relational memory

Relational memory represents connections between people, subjects, events and facts.

A structured relationship model is useful, but it does not require a dedicated graph database.

A small set of validated relationship records may provide the required capabilities.

6.4 Procedural memory

Procedural memory represents learned ways of completing tasks or applying preferences.

Example:

- A user prefers a particular sequence when carrying out a recurring task.

This is a possible later capability. It should not be implemented until the basic memory lifecycle is reliable.

6.5 Working memory and context assembly

The system needs a temporary representation of what matters to the current interaction.

This is distinct from permanent memory.

The response process should retrieve only the evidence needed for the current request, subject to scope and permission checks.

A working context must not silently become permanent memory.

6.6 Consolidation

Consolidation can reduce duplication and organise information.

However, consolidation must never destroy original evidence.

It must preserve:

- Source references.
- Historical distinctions.
- Conflicting evidence.
- User corrections.
- Memory scope.
- Deletion and revocation decisions.

Consolidation should be deterministic where possible and reviewable where uncertain.

7. Architecture systems reviewed

MemGPT

https://arxiv.org/abs/2310.08560

Useful idea: separate limited working context from longer-term memory.

Caution: its agent-managed context architecture is more complex than Mopapa currently requires.

Mem0

https://arxiv.org/abs/2504.19413

Useful ideas: memory extraction, consolidation, retrieval and relational representations.

Caution: published implementations and evaluations use model-based processing and infrastructure that cannot be assumed free or locally practical.

Zep and Graphiti

https://github.com/getzep/graphiti

Useful idea: temporal relationships, historical facts and explicit changes in validity.

Caution: adopting a full temporal graph stack would add complexity and operational requirements. Mopapa can investigate the data principles without adopting the infrastructure.

A-MEM

https://proceedings.neurips.cc/paper_files/paper/2025/hash/19909c36f51abc4856b4560aff3d36d6-Abstract-Conference.html

Useful idea: interconnected memory notes and evolving links.

Caution: automatic link creation and memory rewriting require strong evidence controls.

MemoryBank

https://arxiv.org/abs/2305.10250

Useful idea: selective retention and memory management.

Caution: age-based forgetting must not become a substitute for explicit deletion, revocation or retention rules.

8. Proposed target architecture

The research supports a layered architecture.

1. Authorised information sources.
2. Immutable original evidence archive.
3. Memory formation and validation.
4. Episodic, semantic and relational memory.
5. Memory governance and lifecycle.
6. Search and retrieval indexes.
7. Context assembly.
8. Evidence-grounded response.
9. User inspection and control.

Procedural memory and advanced proactive behaviour should be later capabilities.

The system should separate:

- Original information.
- Extracted interpretations.
- User-confirmed information.
- Inferences.
- Temporary working context.
- Derived indexes.

The system must never treat a derived index or summary as the sole authoritative record.

9. Local-first and storage research

9.1 localStorage

MDN documentation:

https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API

localStorage is synchronous. Large serialisation, reads and writes can block application execution.

It is appropriate for relatively small application state, but a large conversation archive creates different requirements.

9.2 IndexedDB

MDN documentation:

https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

IndexedDB provides:

- Asynchronous operations.
- Structured object storage.
- Object stores and indexes.
- Transactional updates.
- Support for larger amounts of structured data and binary objects.

It is a stronger candidate for a substantial local conversation archive.

However, it does not guarantee permanent data retention.

Browser quotas, eviction and private-browsing behaviour vary.

Further documentation:

https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

9.3 Storage recommendation

Do not begin a migration immediately.

The existing application has working persistence, validation, recovery and backup behaviour. These should not be discarded.

However, IndexedDB should now be treated as a serious candidate for the eventual archive storage layer.

Before deciding, measure:

- Expected conversation volume.
- Typical message size.
- Save and read performance.
- Search latency.
- Storage growth.
- Backup and restore time.
- Quota behaviour.
- Mobile browser compatibility.
- Recovery after interruption.
- Migration and rollback reliability.

Do not maintain two competing authoritative stores.

If migration is approved, there must be one clearly defined source of truth and a verified migration path from the existing "mopapa.v1" data.

9.4 Local model research

Technologies worth evaluating later:

- https://github.com/mlc-ai/web-llm
- https://huggingface.co/docs/transformers.js
- https://onnxruntime.ai/

These demonstrate possible local inference approaches.

They do not establish that an appropriate model will run reliably on all ordinary Android devices.

Evaluation must include:

- Device memory requirements.
- Model download size.
- Battery and processing consumption.
- Browser compatibility.
- Offline operation.
- Licensing and redistribution terms.
- Extraction accuracy.
- False-memory rate.
- Update accuracy.
- Performance on real devices.

No local model is approved for integration at this stage.

9.5 Deterministic memory processing

Mopapa should investigate what can be achieved without language models.

Potential capabilities include:

- Message preservation.
- Stable identity and duplicate detection.
- Timestamp normalisation without inventing missing dates.
- Rule-based classification.
- Explicit user-confirmed preference updates.
- Structured entity references.
- Lexical and field-based retrieval.
- Provenance validation.
- Deterministic lifecycle transitions.

Deterministic processing will not solve every extraction or conversational reasoning task.

It is nevertheless a valuable foundation because it is inspectable, predictable and does not create inference costs.

10. Expanded architectural requirements

The original six requirements are insufficient. The target architecture should address all of the following.

1. Original evidence preservation.
2. Source attribution.
3. Temporal understanding.
4. Entity resolution.
5. Episodic memory.
6. Semantic memory.
7. Relational memory.
8. Preference evolution.
9. Knowledge updates.
10. Memory scope and permissions.
11. Selective memory formation.
12. Consolidation.
13. Retrieval activation.
14. Context assembly.
15. Uncertainty and abstention.
16. Memory inspection and correction.
17. Deletion and forgetting.
18. Processing reliability.
19. Evaluation and observability.
20. User-controlled import and export.
21. Duplicate and retry safety.
22. Historical version preservation.
23. Multi-party attribution where applicable.
24. Explicit distinction between current, historical, disputed and unsupported information.
25. Protection against deleted or revoked information being reintroduced.
26. Resource and storage limits.
27. Rebuildable search indexes.
28. Transparent processing status and failure reporting.

11. Critical distinctions the data model must support

The following concepts must not be collapsed into one status field.

Memory lifecycle

The proposed memory lifecycle contains five states:

- Candidate: a proposed memory awaiting assessment.
- Active: a memory eligible for use when its evidence and governance permit.
- Historical: a memory that applies to an earlier period or has been superseded for a particular purpose.
- Uncertain: a memory whose interpretation or evidential status requires caution.
- Dismissed: a proposed memory rejected by the user.

Evidence state

Evidence assessment is independent from lifecycle state.

The proposed evidence states are:

- Supported.
- Partially supported.
- Unsupported.
- Disputed.
- Unverified.

Temporal validity

A fact may have been true at an earlier time but no longer be current.

A later fact may supersede an earlier fact for a particular purpose or period. The original evidence and historical validity must not be silently overwritten.

Governance and operations

The following are not ordinary memory lifecycle states:

- Revoked: permission to use information has been withdrawn.
- Deleted: a deletion operation has removed information under the applicable deletion policy.
- Restricted: information is subject to a limitation on permitted use or context.

Deletion is an operation, not a lifecycle state.

Revocation changes permitted use. It must not be confused with deletion.

Restriction is a governance rule, not evidence that a memory is false or inactive.

These distinctions have different implications for retrieval, retention, export, recovery and future ingestion. The detailed proposed rules are defined in the personal-memory governance and deletion specifications.

12. Proposed evaluation framework

Mopapa should maintain separate evaluation suites.

Existing regression suite

Preserve all existing unit and browser tests.

Do not weaken existing assertions to improve new evaluation results.

Existing 50-question note evaluation

Keep the current note-based evaluation independent.

It remains useful for ensuring that existing Ask behaviour does not regress.

External benchmark evaluation

Use the relevant subsets of:

- LongMemEval Oracle.
- LongMemEval-S.
- LongMemEval-M.
- LoCoMo.
- TimlMemBench.
- HaluMem.
- HorizonBench.
- MemArena-L.
- GroupMemBench.
- MemoryAgentBench.
- LoCoMo-Conv.
- LoCoMo-Plus.
- BEAM.

Do not attempt to run every benchmark immediately.

Prioritise the benchmarks that test capabilities Mopapa is actually implementing.

Mopapa-native evaluation

Create a controlled dataset containing:

- Multiple conversations.
- Multiple people.
- Explicit and implicit preferences.
- Preference changes.
- Historical facts.
- Contradictions.
- Corrections.
- Hypothetical statements.
- Uncertain information.
- Deleted memories.
- Revoked memories.
- Restricted information.
- Duplicate imports.
- Interrupted ingestion.
- Questions with no answer.
- Natural conversational requests.

The dataset should include both answerable and deliberately unanswerable questions.

Required metrics

Measure independently:

- Capture completeness.
- Extraction precision.
- Extraction recall.
- False-memory rate.
- Duplicate rate.
- Update accuracy.
- Historical-state accuracy.
- Retrieval precision.
- Retrieval recall.
- Source attribution accuracy.
- Evidence support.
- Answer correctness.
- Abstention quality.
- Scope and boundary compliance.
- Deletion and revocation compliance.
- Processing latency.
- Storage growth.
- Backup and restore reliability.
- Resource consumption.

Do not combine all metrics into a single score that hides critical failures.

A serious privacy, deletion or provenance failure must not be offset by a high answer-accuracy score.

Benchmark licensing and data handling

Before importing any benchmark dataset into the repository:

1. Inspect its licence.
2. Check redistribution conditions.
3. Check whether the benchmark permits local derivative test fixtures.
4. Keep original benchmark data separate from Mopapa's own authored tests.
5. Record dataset versions and source URLs.
6. Avoid committing large datasets unnecessarily.
7. Never use real private conversation exports as public test fixtures.

13. Revised architectural direction

Preserve

- Existing vanilla JavaScript application.
- Current manual Keep functionality.
- Deterministic Ask as the initial response engine.
- Source-backed answers.
- Existing room and entry functionality.
- Backup and restore safeguards.
- Recovery-copy handling.
- Existing regression tests.

Reconsider

- Long-term primary storage.
- Conversation archive representation.
- Message and participant attribution.
- Memory lifecycle.
- Search and indexing strategy.
- Automatic memory processing boundaries.

Extend

- Conversation and message records.
- Episodic, semantic and relational memory.
- Provenance and source evidence.
- Temporal relationships.
- Scope and permissions.
- User correction and deletion.
- Cross-conversation retrieval.
- Evaluation coverage.

Defer

- Local language-model integration.
- Embeddings and vector search.
- Procedural memory.
- Advanced proactive behaviour.
- Multimodal ingestion.
- Multi-user or shared household memory.
- Cloud synchronisation.
- Accounts.
- Autonomous task execution.
- Major interface redesign.

Reject as default direction

- Replacing deterministic Ask with ungrounded generation.
- Treating a whole conversation as one memory.
- Discarding original evidence after extraction.
- Silently overwriting history.
- Treating assistant statements as user facts.
- Automatically inferring sensitive personal facts.
- Building a complex graph database without measured need.
- Introducing paid dependencies before revenue.
- Rewriting reliable systems without evidence.

14. Research limitations

This review combines peer-reviewed publications, conference papers, preprints, benchmark repositories and technical documentation.

Not all research has the same evidence status.

- Peer-reviewed papers provide stronger publication scrutiny than unreviewed preprints, but do not guarantee reproducibility.
- Synthetic benchmarks provide controlled evaluation but cannot fully represent real human conversations.
- Results using large hosted models do not establish that equivalent performance is achievable on local mobile hardware.
- Benchmark scores are not directly comparable across different datasets and evaluation methods.
- Repository availability does not guarantee that a dataset is licensed for redistribution or commercial use.
- Research systems may rely on infrastructure or costs that are unsuitable for Mopapa.

Every future architecture decision must record these limitations.

15. Research conclusion

The research supports a structured, evidence-preserving memory architecture with explicit lifecycle and governance rules.

It does not establish that Mopapa needs a hosted LLM, vector database, knowledge graph platform or multi-agent architecture.

The strongest direction is:

- Preserve original evidence.
- Form independently addressable memories.
- Keep episodic, semantic and relational information distinct.
- Track source, time, subject and scope.
- Make updates and deletion explicit.
- Retrieve evidence through rebuildable indexes.
- Keep the answer layer grounded.
- Evaluate each memory operation independently.
- Maintain local control and zero recurring costs during development.

The existing application should not be discarded without evidence. However, its storage and data architecture should be reconsidered before large-scale conversation capture is implemented.

Research recommendation: complete the target architecture, data model, storage decision and evaluation plan before production memory-ingestion work begins.

---

15.1 Research verification addendum - 19 November 2026

This addendum records additional source verification and qualifications identified during the architecture review.

MemArena-L dataset details:

The dataset card reports:

- 50 simulated agents.
- 15 simulated days.
- 13,343 sessions.
- 137,279 conversational turns.
- Approximately 10.3 million tokens.
- Approximately 401 sessions and 4,186 turns per agent on average.
- Evaluation covering recall, reasoning and trustworthiness, including permission-aware access.

Sources:
- https://github.com/dereksodo/MemArena-Bench/blob/main/docs/DATASET_CARD.md
- https://arxiv.org/abs/2608.02613

The dataset card and a mirrored dataset README report different evaluation-instance totals. One reports 1,523 and the other 1,579. Treat this as unresolved metadata until the released dataset version is inspected directly. Do not use either figure as an unquestioned benchmark total.

GroupMemBench:

The published research reports that its strongest evaluated system achieved 46.0% average accuracy, with 27.1% on knowledge updates and 37.7% on term ambiguity.

These results reinforce the need to preserve speaker identity, conversational structure and ambiguous terminology rather than flattening multi-party information into one profile.

Source:
- https://arxiv.org/abs/2605.14498

HorizonBench:

The benchmark contains 4,245 items from 360 simulated users, with six-month histories averaging approximately 4,300 turns and 163,000 tokens.

The research reports persistent preference-update failures, including cases where systems continue selecting an earlier preference.

This supports temporal preference evaluation. It does not justify automatically inferring a preference change from a life event without sufficient evidence.

Source:
- https://arxiv.org/abs/2604.17283

HaluMem:

The research evaluates memory extraction, memory updating and memory question answering separately. Its datasets contain approximately 15,000 memory points and 3,500 questions, with histories averaging approximately 1,500 and 2,600 turns in the two variants.

Source:
- https://aclanthology.org/2026.emnlp-main.220/

LoCoMo-Conv:

The benchmark distinguishes dialog, implicit, counterfactual and composed queries. It reports that implicit and composed conversational requests expose retrieval gaps not adequately represented by ordinary question-answering tests.

Source:
- https://aclanthology.org/2026.findings-emnlp.1289/

LoCoMo-Plus:

The benchmark tests whether systems retain and apply implicit constraints across long histories. Its findings support retaining evidence-backed context, but do not justify turning inferred motives, emotions or values into established facts.

Source:
- https://aclanthology.org/2026.acl-long.1150/

BEAM:

BEAM contains 100 conversations and 2,000 validated questions, with generated histories reaching up to 10 million tokens. Its LIGHT architecture uses episodic memory, working memory and a scratchpad.

This is a scalability and architecture reference, not a requirement to adopt its architecture.

Source:
- https://proceedings.iclr.cc/paper_files/paper/2026/hash/d7f0cfa0fe759b033d5262e1bb7d4065-Abstract-Conference.html

DolphinBench:

DolphinBench evaluates memory through task completion and requires accuracy, latency and cost to be considered together.

It is relevant to future resource-efficiency evaluation, but does not justify making Mopapa an autonomous task agent.

Source:
- https://arxiv.org/abs/2609.24971

Local browser inference:

Transformers.js documents WebGPU support at approximately 85% global browser availability as of March 2026.

This is an API compatibility estimate, not a guarantee of model compatibility, available GPU memory, acceptable inference speed or suitability for Android devices.

Any future local model evaluation must measure actual device performance, model size, memory consumption, battery impact and licence conditions.

Source:
- https://huggingface.co/docs/transformers.js/guides/webgpu

Research interpretation:

These findings reinforce the existing approved architecture direction. They do not independently authorise new production capabilities, a local model, a storage migration or a change to deterministic Ask.

16. Primary research and technical source index

Research or documentation| Primary source
LoCoMo| https://aclanthology.org/2024.acl-long.747/
LongMemEval| https://github.com/xiaowu0162/LongMemEval
TimlMemBench| https://aclanthology.org/2026.findings-emnlp.507/
HaluMem| https://aclanthology.org/2026.emnlp-main.220/
HorizonBench| https://arxiv.org/abs/2604.17283
MemArena| https://arxiv.org/abs/2608.02613
GroupMemBench| https://arxiv.org/abs/2605.14498
MemoryAgentBench| https://arxiv.org/abs/2507.05257
LoCoMo-Conv| https://aclanthology.org/2026.findings-emnlp.1289/
LoCoMo-Plus| https://aclanthology.org/2026.acl-long.1150/
BEAM| https://proceedings.iclr.cc/paper_files/paper/2026/hash/d7f0cfa0fe759b033d5262e1bb7d4065-Abstract-Conference.html
MemoryArena agentic benchmark| https://proceedings.mlr.press/v306/he26am.html
DolphinBench| https://arxiv.org/html/2609.24971
MemGPT| https://arxiv.org/abs/2310.08560
Mem0| https://arxiv.org/abs/2504.19413
A-MEM| https://proceedings.neurips.cc/paper_files/paper/2025/hash/19909c36f51abc4856b4560aff3d36d6-Abstract-Conference.html
Graphiti| https://github.com/getzep/graphiti
localStorage documentation| https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
IndexedDB documentation| https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
Browser storage quotas| https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
WebLLM| https://github.com/mlc-ai/web-llm
Transformers.js| https://huggingface.co/docs/transformers.js
ONNX Runtime| https://onnxruntime.ai/