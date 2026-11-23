Mopapa Evaluation Specification

Purpose: Define how Mopapa's existing deterministic Ask system and future Personal Memory Companion capabilities are evaluated.

Status: Consolidated evaluation specification. Existing Ask regression coverage and the 50-question diagnostic corpus are documented separately. Future personal-memory evaluation remains to be implemented.

1. Evaluation boundaries

Mopapa has several distinct evaluation responsibilities. They must not be combined into one misleading score.

Evaluation area| What it checks
Application regression| Existing application functionality continues to work.
Ask regression| Existing deterministic retrieval, answer selection, clarification, abstention and source grounding remain correct.
Ask diagnostic benchmark| Performance on a controlled 50-question dataset.
Personal-memory evaluation| Future extraction, evidence, provenance, identity, temporal, governance, deletion, restore and retrieval behaviour.
External research| Published research and external datasets provide supporting context, not a substitute for Mopapa-specific tests.

A passing result in one area does not establish that another area is correct.

Critical privacy, attribution, provenance, permission, deletion and data-integrity failures are release blockers. They must not be averaged away by a high overall score.

---

2. Existing deterministic Ask regression suite

2.1 Purpose and principles

The existing Ask system is deterministic and source-backed. Its regression suite protects established behaviour.

Ask must:

- Answer only when saved memories provide sufficient evidence.
- Return the memory entries that support the answer.
- Clarify when multiple plausible memories conflict.
- Abstain rather than invent missing facts.
- Distinguish current, previous and original values when the question specifies which is wanted.
- Preserve deterministic behaviour.
- Never treat semantic similarity alone as proof of a factual answer.

A correct-looking answer with an unrelated supporting source is a failure.

2.2 Documented baseline

The existing evaluation document records:

- 33 unit tests explicitly labelled "ask evaluation:" in "tests/run.js".
- 15 structured scenarios.
- 64 returned sources checked across the 33 named tests in the documented CI result.
- Ten negative location-question forms covered by a separate direct regression test.
- A separate intent-classifier regression test covering location-question negation.

These figures describe the documented historical evaluation baseline. They must not be presented as a freshly verified current result without checking the relevant repository commit and CI run.

2.3 Existing named regression tests

The following catalogue records the existing 33 named tests. Do not recreate equivalent tests under different names.

Grounding, abstention and typo handling

1. "ask evaluation: realistic answers are grounded in their supporting memories"
   
   - Checks location, recipient, scheduled appointment and cost answers.
   - Checks expected answer content and supporting source IDs.

2. "ask evaluation: unsupported answers are not invented"
   
   - Checks an unknown location and a cost with no recorded amount.
   - Checks that unsupported information is not fabricated.

3. "ask evaluation: typo suggestions are clearly labelled and source-backed"
   
   - Checks a misspelled query.
   - Requires the relevant suggested memory among the sources.

Conflicts and ambiguity

4. "ask evaluation: conflicting dates, recipients and costs require clarification"
   
   - Checks competing appointment dates, recipients and costs.
   - Requires clarification and the competing source entries.

5. "ask evaluation: two dentist appointments at different times require clarification"
   
   - Checks ambiguity between two appointments on the same date.

6. "ask evaluation: specific appointment questions select the correct overlapping subject"
   
   - Checks whether a more specific question distinguishes overlapping appointments.

7. "ask evaluation: a broad dentist question clarifies across three overlapping appointments"
   
   - Checks that a broad question does not silently choose one of three possible appointments.

8. "ask evaluation: separate appointments at the same time are not silently collapsed"
   
   - Checks that separate appointments remain distinct even when their times match.

9. "ask evaluation: duplicate entries for the same appointment do not create false ambiguity"
   
   - Checks that duplicate representations do not create an artificial conflict.

10. "ask evaluation: unqualified questions do not silently choose between changed costs"
    
    - Checks that an unspecified cost question clarifies when multiple saved amounts exist.

Appointment history and date selection

11. "ask evaluation: completed appointments do not override an upcoming appointment"
12. "ask evaluation: a specific next recurring service selects the earliest upcoming occurrence"
13. "ask evaluation: past-tense questions clarify between separate past occurrences of the same appointment"
14. "ask evaluation: a rescheduled appointment uses its upcoming date"
15. "ask evaluation: past-tense appointment questions return completed appointment dates"
16. "ask evaluation: past-tense appointment questions do not return future dates"
17. "ask evaluation: past-tense appointment questions select the old date after rescheduling"
18. "ask evaluation: original appointment questions retrieve the earlier scheduled date"
19. "ask evaluation: original appointment follows saved revision chronology when rescheduled earlier"
20. "ask evaluation: previous appointment retrieves the immediately preceding schedule"

These cases cover upcoming versus completed appointments, recurring occurrences, rescheduling, historical questions and revision chronology.

Money and cost history

21. "ask evaluation: direct cost questions exclude quotes, estimates, refunds and money received"
22. "ask evaluation: latest, previous and original costs ignore quotes and estimates"
23. "ask evaluation: excluded quotes do not create false ambiguity between actual costs"
24. "ask evaluation: latest cost questions use the newest corrected amount"
25. "ask evaluation: original-cost questions retrieve the earlier amount"
26. "ask evaluation: previous cost retrieves the immediately preceding amount"
27. "ask evaluation: original cost selects the oldest saved version"

These cases cover confirmed costs, excluded financial statements, ambiguity and historical amounts.

Location history

28. "ask evaluation: newest location is determined by saved timestamp, not storage order"
29. "ask evaluation: a newer location replaces the old location for the same item"
30. "ask evaluation: explicit previous-location questions retrieve the older location"
31. "ask evaluation: previous location selects the second-newest saved version"

Incomplete and negated questions

32. "ask evaluation: punctuation and casing preserve equivalent grounded answers"
    
    - Checks ordinary, uppercase, polite and repeated-punctuation variants.
    - Requires equivalent grounded answers and identical supporting source IDs.

33. "ask evaluation: incomplete prompts preserve safe answer, clarification and suggestion behaviour"
    
    - Checks short topic prompts, short location questions, ambiguous date questions, subject-only prompts and questions without a subject.
    - Requires the correct answer, clarification or suggestion behaviour and checks supporting source IDs.

The direct regression test "ask: negative location questions do not produce positive location claims" covers twenty negated location-question forms: ten beginning with "where" and ten beginning with supported "which" location types. Each form must receive the safe response and return no supporting sources.

A separate regression test checks the intent classifier, including positive location questions and unrelated negation elsewhere in the same sentence or a later sentence.

Neither direct test is included in the count of 33 tests explicitly labelled "ask evaluation:".

2.4 Structured scenario format

New structured evaluation scenarios use "runAskEvaluationCase()" in "tests/run.js".

Each case contains:

Field| Purpose
"id"| Stable scenario identifier
"entries"| Saved memories supplied to Ask
"question"| Exact user question
"expected.behaviour"| "answer", "clarify", "abstain" or "suggest"
"expected.answer"| Regular expression matching the required answer behaviour
"expected.sources"| Expected source IDs and matching mode
"expected.missed"| Optional expected unanswered-question state
"supports"| Optional check that every returned source genuinely supports the answer

Source expectation modes:

- "exact": the complete returned source-ID set must match the expected IDs. Order is ignored.
- "includes": every listed source ID must be returned, but additional sources are permitted.
- "none": Ask must return no supporting sources.

The shared runner checks the answer, expected behaviour category, source expectations and optional missed-question state. A "supports" predicate can additionally verify that each returned source genuinely supports the answer.

The documented initial adoption covers grouped grounded-answer, clarification, abstention and typo-suggestion scenarios. Other specialist regression tests retain their existing direct answer and source-ID assertions. The source-support audit supplements rather than replaces those tests.

2.5 What the existing suite demonstrates

The existing tests provide curated regression evidence for:

- Grounded answers with expected supporting entries.
- Selected unsupported questions and conservative fallback.
- Negative location questions, including clause-scoped negation detection.
- Selected ambiguity and clarification behaviour.
- Appointment history and chronology.
- Cost exclusions and historical amounts.
- Location history and revision order.
- A typo suggestion with a supporting source.

They do not establish a general percentage accuracy for real-world user questions.

2.6 Existing measurement limitations

The documented evaluation reports 15 structured scenarios within five named tests:

- 7 expected-answer scenarios.
- 4 expected-clarification scenarios.
- 2 expected-abstention scenarios.
- 2 suggestion scenarios.

The documented summary reports structured scenarios passed and failed, expected behaviour coverage, answer-pattern assertions, source-ID assertions, selected clarification and abstention results, and semantic source-support checks.

Important limitations:

- The 15 structured scenarios are not the complete 33-test evaluation set.
- Every structured scenario that returns sources has an explicit semantic support predicate. The source-free question-without-subject case has no source to assess.
- The documented CI result checked 64/64 returned sources across 33/33 named tests. This is curated regression coverage, not a global source-precision measurement.
- Source-ID matching does not prove semantic support.
- Expected-answer regular expressions are regression assertions, not a complete measure of factual correctness.
- The two expected-abstention scenarios describe this curated test set, not the rate at which real users receive abstentions.
- The suite does not classify every unsupported factual claim, so a global false-positive rate cannot be calculated.
- Some date fixtures use local date construction before conversion to ISO timestamps. Calendar interpretation remains subject to the test runtime's local timezone.
- The cases are hand-authored regression scenarios, not a representative sample of actual user questions.

Do not describe the existing results as general Ask accuracy.

2.7 Regression evaluation metrics

Metric| Current interpretation
Answer correctness| Expected-answer pattern checks are counted; this is not global semantic accuracy.
False-positive rate| Not measured globally.
Abstention rate| Not measured as a product rate.
Appropriate abstention| Reports passing expected-abstention scenarios only.
Source precision| Not measured globally.
Clarification correctness| Reports passing expected-clarification scenarios only.
Curated source support| Semantic source-support checks across the named regression tests.

Do not optimise answer rate at the expense of unsupported answers. A justified abstention is preferable to an invented fact.

---

3. Separate 50-note / 50-question Ask diagnostic benchmark

3.1 Purpose and status

This is a controlled diagnostic set for retrieval, answer extraction, source grounding, date handling, ambiguity and appropriate abstention.

- Dataset: 50 fictional saved memories and 50 questions.
- Reference date: 17 November 2026, 12:00 UTC.
- All names, contact details, passwords, dates and events are fictional test fixtures, not real personal information.

This benchmark is separate from the existing 33-test Ask regression suite.

It is not statistically representative of all user behaviour. Results must be reported as performance on this particular 50-question set, not as universal Ask accuracy.

3.2 Benchmark pass rules

A question passes only when:

1. The answer is factually correct.
2. Returned source entries actually support the answer.
3. Missing information is not invented.
4. Historical information is not presented as current.
5. Ambiguity is clarified rather than guessed.
6. Unanswerable questions receive an appropriate abstention.
7. Extracted values are not added to Ask learning or the unanswered-question list.

A correct answer with an incorrect source is a failure.

3.3 The 50 fictional saved memories

All timestamps are ISO 8601. "created" is the saved-memory timestamp. "when" is the scheduled date where applicable.

ID| Room| Created| When| Saved memory
M01| notes| 2026-11-10| —| Mum said she loves the lemon drizzle cake from the Italian bakery on Station Road
M02| wishlist| 2026-11-11| —| Buy Mum a green wool scarf for Christmas
M03| ideas| 2026-11-16| —| Garden idea: build raised wooden beds along the back fence and add a small herb section
M04| wishlist| 2026-11-09| —| Need a new kitchen kettle, preferably stainless steel
M05| wishlist| 2026-11-08| —| Film to watch: The Grand Budapest Hotel
M06| notes| 2026-11-12| —| Sarah recommended a chicken and mushroom pie for the birthday meal
M07| notes| 2026-11-12| —| Home Wi-Fi password is fictional-test-4821
M08| notes| 2026-11-13| —| Plumber's phone number: 07700 900123
M09| notes| 2026-11-14| —| Plumber estimated the bathroom repair at £280; this is a quote, not a confirmed final cost
M10| notes| 2026-11-16| —| Lent my cordless drill to Dave on Monday 16 November
M11| appointments| 2026-11-15| 2026-11-26T10:40:00Z| Routine dentist check-up, Thursday 26 November at 10:40. This is separate from the dentist follow-up appointment.
M12| notes| 2026-11-13| —| The blue exterior paint I wanted is sold at Northside Builders Merchants
M13| notes| 2026-11-10| —| Weekend trip shortlist: York and Lincoln. Originally planned to visit York on 21 November
M14| wishlist| 2026-11-12| —| Jasmine's birthday present: silver star necklace
M15| notes| 2026-11-14| —| Original weekend plan was a coastal walk; changed it to a museum visit if it rains
M16| notes| 2026-11-16| —| Last recorded location of bank card: blue zipped pocket inside the black rucksack, after the supermarket
M17| appointments| 2026-11-16| 2026-11-24T09:15:00Z| GP appointment, Tuesday 24 November at 09:15
M18| ideas| 2026-11-16| —| Game idea: a one-button lighthouse keeper game. Rotate the light to guide ships through a storm, avoid rocks and earn points for safe arrivals
M19| notes| 2026-11-13| —| Jasmine's favourite TV show is The Great British Bake Off
M20| todo| 2026-11-16| 2026-11-25| Wednesday 25 November: book boiler service and post the birthday parcel
M21| wishlist| 2026-11-15| —| Noah's birthday: saved ideas are a Lego space rover and a blue football shirt
M22| notes| 2026-11-12| —| Spare house key is inside the small ceramic pot in the hallway cupboard
M23| notes| 2026-11-12| —| Parcel is for Morgan
M24| notes| 2026-11-13| —| Car service originally cost £100
M25| notes| 2026-11-16| —| Corrected car service cost: £150
M26| notes| 2026-11-14| —| Passport is in the grey document wallet in the desk drawer
M27| appointments| 2026-11-16| 2026-11-27T14:30:00Z| Separate dentist follow-up appointment was rescheduled from 20 November to Friday 27 November at 14:30. This is not the routine dentist check-up.
M28| ideas| 2026-11-12| —| Sofa idea: originally considered a grey sofa, but decided on a dark green one
M29| notes| 2026-11-11| —| Recipe to try: roasted tomato and red pepper soup
M30| todo| 2026-11-15| 2026-11-20| Remember to collect the prescription on Friday 20 November
M31| notes| 2026-11-14| —| Received a £35 refund for the cancelled delivery
M32| appointments| 2026-11-10| 2026-11-30| Boiler service reminder for Monday 30 November
M33| appointments| 2026-11-15| 2026-11-23T11:00:00Z| Car tyre inspection on Monday 23 November at 11:00
M34| notes| 2026-11-12| —| The garden fence needs two replacement panels
M35| notes| 2026-11-13| —| Meeting notes: discussed quarterly plans and the website redesign
M36| feelings| 2026-11-14| —| Felt anxious about the amount of work planned for next month
M37| wishlist| 2026-11-15| —| Birthday gift idea for Sarah: a botanical illustration book
M38| notes| 2026-11-16| —| Need to compare boiler service providers before booking; no provider chosen yet
M39| notes| 2026-11-12| —| The parcel for Morgan should be sent using tracked delivery
M40| notes| 2026-11-10| —| The spare room needs measuring before buying a desk
M41| ideas| 2026-11-14| —| App idea: a simple household inventory that records where items are stored
M42| ideas| 2026-11-15| —| Garden project: add solar lights beside the path
M43| notes| 2026-11-13| —| Jasmine also enjoys nature documentaries
M44| notes| 2026-11-14| —| Car tyre inspection is for the front left tyre, which has been losing pressure
M45| notes| 2026-11-09| —| Spare batteries are in the labelled box in the utility cupboard
M46| todo| 2026-11-16| 2026-11-25| Wednesday 25 November: measure the spare room for the new desk
M47| notes| 2026-11-11| —| Coffee to buy: medium roast ground coffee
M48| wishlist| 2026-11-12| —| Need new walking shoes, size 9
M49| notes| 2026-11-15| —| The hallway light bulb needs replacing
M50| notes| 2026-11-16| —| Read about how lighthouse lenses work; this is unrelated to the saved lighthouse game idea

3.4 The 50 evaluation questions

"Answer" means a supported answer is expected. "Clarify" means the available information is genuinely ambiguous. "Abstain" means the dataset does not contain the answer.

#| Question| Expected behaviour| Expected source
1| What cake does Mum like?| Answer| M01
2| What was that Italian bakery Mum mentioned?| Answer| M01
3| What ideas have I saved for improving the garden?| Answer| M03, M34, M42
4| What did I say I wanted to buy for the kitchen?| Answer| M04
5| What was the name of the film I wanted to watch?| Answer| M05
6| What did Sarah recommend for the birthday meal?| Answer| M06
7| What's the Wi-Fi password?| Answer| M07
8| What is the plumber's phone number?| Answer| M08
9| How much did I say the repair would cost?| Answer with quote qualification| M09
10| Who did I lend my drill to?| Answer| M10
11| What time is the dentist appointment?| Clarify if multiple appointments remain plausible| M11, M27
12| Which shop sells the paint I wanted?| Answer| M12
13| Who has my drill, and when did I lend it to them?| Answer| M10
14| What were the two places I considered for the weekend trip?| Answer| M13
15| Which birthday present did I choose, and who was it for?| Answer| M14
16| What was the original plan, and what did I change it to?| Answer| M15
17| When did I last save a note about comparing boiler service providers?| Answer| M38
18| What date did I originally plan to visit York?| Answer| M13
19| Did I change the dentist appointment? What is the latest date and time?| Answer| M27
20| Which version of the garden plan did I settle on?| Abstain; do not infer a final decision from the saved proposals| None
21| What is my bank account PIN?| Abstain| None
22| What did the doctor tell me about my blood test results?| Abstain| None
23| What is the registration number of my neighbour's car?| Abstain| None
24| Which hotel did I book for my holiday?| Abstain| None
25| What did I decide about moving house?| Abstain| None
26| Where did I leave my bank card?| Answer with last-recorded-location qualification| M16
27| When is my next doctor's appointment?| Answer| M17
28| What was the idea I had yesterday about a game I could build?| Answer| M18
29| What is Jasmine's favourite TV show?| Answer| M19
30| Do I have anything planned or todo next Wednesday?| Answer with all relevant items| M20, M46
31| What did I save for Noah's birthday?| Answer with all saved gift ideas| M21
32| Where did I put the spare house key?| Answer| M22
33| Who is the parcel for?| Answer| M23, M39
34| How much was the car service originally?| Answer| M24
35| What is the latest car service cost I saved?| Answer| M25
36| Where is my passport?| Answer| M26
37| What was the old dentist appointment date before it changed?| Answer| M27
38| What colour sofa did I eventually choose?| Answer| M28
39| Which soup recipe did I want to try?| Answer| M29
40| What do I need to collect on Friday?| Answer| M30
41| How much money did I receive back for the cancelled delivery?| Answer| M31
42| When is the boiler service reminder?| Answer| M32
43| When is the car tyre inspection?| Answer| M33
44| What was wrong with the car tyre?| Answer| M44
45| Where are the spare batteries?| Answer| M45
46| What did I want to measure before buying a desk?| Answer| M40
47| What kind of coffee did I want to buy?| Answer| M47
48| What size walking shoes do I need?| Answer| M48
49| What household job did I save about the hallway?| Answer| M49
50| What is my neighbour's dog's name?| Abstain| None

3.5 Important benchmark distinctions

Location recall

Question 26 must return the last recorded location, not claim to know where the card is now.

Date and appointment recall

Questions 11, 19, 27, 30, 37 and 42 test different date behaviours. A previous appointment must not override a future one. Rescheduled dates must not be confused with original dates.

Multi-source answers

Questions 3 and 30 require more than one source. Returning only one relevant entry is incomplete.

Answer extraction

Questions 7, 8, 9, 13, 28, 29, 31, 35 and 41 require extracting a particular value or relationship from a saved note.

Abstention

Questions 20–25 and 50 have no supporting answer.

Question 20 is particularly important: related proposals exist, but no saved memory establishes a final garden decision. Claiming that one proposal was chosen is a failure.

Distractors

M35, M36, M43 and M50 are deliberate distractors. They contain related names or vocabulary but must not be returned as supporting evidence for unrelated questions.

3.6 Benchmark readiness checklist

The original benchmark specification sets out these requirements:

- [ ] All 50 notes are represented in a deterministic fixture.
- [ ] All 50 questions have an expected behaviour.
- [ ] Every answerable question has expected source IDs.
- [ ] Every abstention question has been checked against all 50 notes.
- [ ] Ambiguous questions have an explicit expected clarification rule.
- [ ] Multi-source questions check completeness, not just one matching source.
- [ ] Date-dependent cases use a fixed reference clock.
- [ ] The evaluation can run repeatedly with identical results.
- [ ] Existing 33 named Ask evaluation tests remain intact.
- [ ] No duplicate tests are added to "tests/run.js" or "tests/browser.js".

These are benchmark requirements, not a claim that every item has been independently re-verified against the current repository.

---

4. Future Personal Memory Companion evaluation

The 50-question Ask benchmark does not evaluate the proposed conversation and personal-memory architecture.

The future system requires a separate evaluation programme. It must test the complete lifecycle, not merely whether a memory can be retrieved.

4.1 Source ingestion and preservation

Evaluate:

- Correct conversation and message ownership.
- Original message preservation.
- Message ordering and sequence integrity.
- Correct author attribution.
- Correct separation of author, quoted speaker and memory subject.
- Conversation-local identity boundaries.
- Handling of missing, ambiguous or conflicting attribution.
- Safe handling of repeated imports and retries.
- No silent creation of duplicate source records.

4.2 Candidate extraction

Evaluate:

- Whether useful candidate memories are identified.
- Whether irrelevant statements are excluded.
- Whether direct statements are distinguished from interpretations.
- Whether hypothetical, fictional and role-play statements are prevented from becoming personal facts.
- Whether statements about another person are attributed correctly.
- Whether assistant-generated suggestions are prevented from becoming user evidence.
- Whether repetition is prevented from being treated as proof of truth.
- Whether compound claims can be represented without losing important qualifications.
- Whether uncertainty is preserved.

A candidate must not be treated as an accepted memory merely because extraction produced it.

4.3 Evidence and provenance

Evaluate:

- Every memory's supporting evidence.
- Correct provenance relationship types: "supports", "refutes", "qualifies" and "context_only".
- Evidence-span validity under the specified UTF-16 code-unit convention.
- Correct exclusive end offsets.
- Explicit whole-message evidence references.
- Correct source attribution.
- Multiple sources supporting one claim.
- Conflicting or qualifying sources.
- Missing or deleted evidence.
- Broken references and malformed provenance.
- Whether the complete memory claim is supported, rather than only part of it.

4.4 Temporal reasoning

Evaluate:

- Known versus unknown dates.
- Date precision and uncertainty.
- Original time versus import time.
- Historical versus current information.
- Corrections and changed values.
- Recurring events.
- Rescheduled events.
- Conflicting temporal evidence.
- Partial dates and timezone handling.
- Prevention of invented date precision.
- Correct handling of future, past and ongoing validity.

4.5 Identity and attribution

Evaluate:

- Distinction between message author and memory subject.
- Quoted-speaker attribution.
- Conversation-local identity references.
- Ambiguous names and pronouns.
- Similar names that refer to different people.
- Identity corrections.
- Conflicting attribution.
- Nested quotations and compound statements.

Global identity resolution is not approved. Evaluation must not assume that similar names or references establish a shared identity.

4.6 Governance and permissions

Evaluate:

- Missing permission.
- Explicit denial overriding an allow.
- Scope restrictions.
- Audience restrictions.
- Use restrictions.
- Permission inheritance through derived memories.
- Multiple sources with different permissions.
- Revocation.
- Restrictions applied before retrieval and context assembly.
- Restrictions across summaries, caches and indexes.
- Prevention of derived memories broadening source permissions.

Unknown or disputed permission must not grant access.

4.7 Lifecycle and memory quality

Evaluate:

- Candidate creation.
- User review.
- Acceptance.
- Dismissal.
- Correction.
- Supersession.
- Contradiction.
- Expiry and historical retention.
- Evidence-state changes.
- Lifecycle-state changes.
- Prevention of dismissed candidates silently returning.
- Prevention of unsupported memories being presented as established facts.

Lifecycle state and evidence state must be evaluated independently.

4.8 Deletion, revocation and re-import

Evaluate:

- Direct memory deletion.
- Message deletion.
- Conversation deletion.
- Direct provenance dependencies.
- Indirect memory derivation dependencies.
- Semantic relationship reassessment.
- Revocation propagation.
- Cache and index invalidation.
- Retry and idempotency behaviour.
- Interruption during deletion.
- Re-import after deliberate deletion.
- Re-import after dismissal.
- Re-import after revocation.
- Explicit user reintroduction.
- Recovery-copy limitations.

Critical failure examples include:

- Deleted information remains available to ordinary retrieval.
- Revoked information is used in a prohibited context.
- A derived memory survives without sufficient permitted evidence.
- A dismissed candidate silently returns as an accepted memory.
- A stale index or cache restores prohibited information.
- A backup silently reverses a later deletion decision.

The application must not claim to erase external backup files it cannot access.

4.9 Backup, restore and migration

Evaluate:

- Complete backup contents.
- Empty required collections.
- Schema and backup-format version handling.
- Invalid records.
- Missing references.
- Duplicate identifiers.
- Invalid provenance and relationships.
- Invalid governance data.
- Newer unsupported schemas.
- Older-version compatibility.
- Recovery-copy creation and verification.
- Storage quota and size failures.
- Interrupted writes.
- Failed read-back.
- Rollback uncertainty.
- Preservation of existing manual entries and learning data.
- Deletion-aware restore behaviour.
- Persistence after reload.

A restore must not silently discard malformed connected data and report complete success.

A failed write must not be reported as a successful operation. If the actual stored state is uncertain, further writes must be blocked until it is verified.

4.10 Retrieval and answering

Evaluate:

- Relevant memory selection.
- Source-backed answer correctness.
- Complete source selection.
- Contradictory evidence.
- Historical versus current answers.
- Permission enforcement.
- Uncertainty communication.
- Appropriate clarification.
- Appropriate abstention.
- No unsupported personal claims.
- No leakage from unrelated or restricted memories.
- Correct use of derived memories.
- Correct behaviour when evidence is deleted or revoked.

The existing deterministic Ask baseline remains protected. A future expansion must be separately evaluated and approved; this document does not authorise replacing Ask with an LLM.

---

5. Evaluation fixture and test design

5.1 Fixture requirements

Future personal-memory fixtures should be:

- Deterministic.
- Fictional.
- Local and dependency-free unless separately approved.
- Reproducible.
- Explicit about expected outcomes.
- Stable under a fixed reference clock where time is relevant.
- Designed to test both valid and invalid data.
- Designed to expose misleading success messages and partial failures.

Fixtures should include realistic combinations of records, not just isolated happy-path examples.

5.2 Negative and adversarial cases

Include cases involving:

- Missing fields.
- Invalid field types.
- Unknown enum values.
- Duplicate IDs.
- Broken references.
- Incorrect record ownership.
- Invalid evidence spans.
- Conflicting sources.
- Ambiguous identity.
- Uncertain dates.
- Missing permission.
- Explicit denial.
- Revoked sources.
- Deleted sources.
- Derivation cycles.
- Supersession cycles.
- Stale backups.
- Re-import after deletion.
- Quota exhaustion.
- Interrupted storage operations.
- Recovery-copy failure.
- Corrupt restore data.
- Older application versions encountering newer schemas.

5.3 Test placement and duplication control

Before adding any evaluation test:

1. Inspect "tests/run.js" and "tests/browser.js".
2. Search for equivalent existing coverage.
3. Identify the precise uncovered behaviour.
4. Add the smallest test that demonstrates the gap.
5. Preserve existing assertions unless evidence shows they are incorrect.
6. Avoid duplicating an existing test under another name.
7. Keep test-only controls out of production APIs wherever possible.

The evaluation specification does not authorise changes to production code or test files.

---

6. Reporting and release gates

6.1 Report separate results

Reports must distinguish:

- Application unit-test results.
- Browser-test results.
- Ask named regression-test results.
- Structured Ask scenario results.
- Semantic source-support results.
- 50-question benchmark results.
- Personal-memory lifecycle results.
- Privacy and governance failures.
- Deletion and recovery failures.
- Performance results.

Do not combine these into one headline percentage.

6.2 Report failure categories

At minimum, report:

- Incorrect answer.
- Unsupported factual claim.
- Incorrect or incomplete source.
- Failure to clarify.
- Failure to abstain.
- Incorrect temporal interpretation.
- Incorrect identity or attribution.
- Evidence or provenance failure.
- Permission or scope violation.
- Deletion or revocation failure.
- Restore or migration failure.
- Data loss or corruption.
- Performance failure.

Where a result cannot be measured reliably, label it unmeasured rather than estimating it.

6.3 Critical release blockers

The following are critical failures:

- Unsupported personal information presented as established fact.
- Original evidence altered or lost unexpectedly.
- Incorrect author or subject attribution.
- Invalid provenance accepted as valid evidence.
- Restricted information used in a prohibited context.
- Revoked information remaining available to prohibited retrieval.
- Deleted information silently reintroduced.
- Failed writes reported as successful.
- Failed restores partially replacing valid user data.
- Broken relationships silently corrupting the dataset.
- Historical facts silently overwritten.
- Migration losing existing manual entries or learning data.

A high aggregate benchmark score cannot compensate for these failures.

6.4 Thresholds remain unresolved

No final numerical accuracy threshold, minimum benchmark score, acceptable false-positive rate, or Android performance acceptance threshold is approved by this document.

Those thresholds require explicit decisions recorded in the build plan, supported by representative fixtures and measured evidence.

---

7. Evaluation maintenance and next work

Existing Ask regression

- [x] Existing named regression suite catalogued.
- [x] Structured scenario format documented.
- [x] Existing measurement limitations documented.
- [x] Semantic source-support audit documented.
- [x] Negative location-question coverage documented.

The historical completion marks above describe the existing documented work. They do not replace verification against the current repository.

50-question diagnostic benchmark

- [x] Original 50 fictional notes preserved in this document.
- [x] Original 50 questions and expected behaviours preserved.
- [x] Multi-source, ambiguity, distractor and abstention distinctions documented.
- [ ] Verify the fixture and all 50 questions against the current repository.
- [ ] Confirm deterministic repeatability using the fixed reference clock.
- [ ] Record the first complete benchmark result without changing existing regression expectations.

Personal-memory evaluation

- [ ] Define the first end-to-end fictional conversation fixtures.
- [ ] Define candidate extraction evaluation cases.
- [ ] Define provenance and evidence validation fixtures.
- [ ] Define identity and temporal edge-case fixtures.
- [ ] Define governance and permission fixtures.
- [ ] Define deletion, revocation and re-import fixtures.
- [ ] Define backup, restore and migration failure fixtures.
- [ ] Define retrieval and answer-grounding fixtures.
- [ ] Establish numerical thresholds and release criteria through explicit decisions.
- [ ] Verify performance on representative Android devices.

These are future evaluation tasks, not claims that the proposed personal-memory functionality already exists.

---

8. Document authority and maintenance

This document defines evaluation methods, fixtures and reporting requirements.

The other master documents retain their separate authority:

- "personal-memory-architecture.md": product direction and architectural principles.
- "personal-memory-record-specification.md": canonical technical data and lifecycle requirements.
- "personal-memory-build-plan.md": implementation order, approval gates and verified engineering progress.
- "personal-memory-research-review.md": supporting research and rationale.

The technical specification defines what must be correct. This evaluation document defines how those properties should be tested. The build plan determines when implementation and verification are authorised.

Do not duplicate the canonical data model or create a second implementation roadmap here.

Current position: Existing deterministic Ask regression coverage and its 50-question diagnostic corpus are now documented together but remain separate evaluation assets. The future Personal Memory Companion requires its own end-to-end evaluation before implementation can be considered reliable. No production implementation or schema activation is authorised by this document.