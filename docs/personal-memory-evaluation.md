# Mopapa Evaluation Specification

Purpose: Define how Mopapa's existing deterministic Ask system and future Personal Memory Companion capabilities are evaluated.

Status: Consolidated evaluation specification. Existing Ask regression coverage and the 50-question diagnostic corpus are documented separately. Future personal-memory evaluation remains to be implemented.

## 1. Evaluation boundaries

Mopapa has several distinct evaluation responsibilities. They must not be combined into one misleading score.

| Evaluation area | What it checks |
|---|---|
Application regression| Existing application functionality continues to work.
Ask regression| Existing deterministic retrieval, answer selection, clarification, abstention and source grounding remain correct.
Ask diagnostic benchmark| Performance on a controlled 50-question dataset.
Personal-memory evaluation| Future extraction, evidence, provenance, identity, temporal, governance, deletion, restore and retrieval behaviour.
External research| Published research and external datasets provide supporting context, not a substitute for Mopapa-specific tests.

A passing result in one area does not establish that another area is correct.

Critical privacy, attribution, provenance, permission, deletion and data-integrity failures are release blockers. They must not be averaged away by a high overall score.

---

## Stage 2 conversation and message preservation evaluation

Stage 2 must be evaluated as a native, source-independent original-evidence preservation system. It is not an extraction, external-import or retrieval benchmark.

The evaluation must use synthetic conversations created specifically for Mopapa's test fixtures. No personal ChatGPT export or third-party account data is required.

The fixtures must cover:

- A simple conversation with two participants.
- A conversation with multiple participants.
- User-entered and pasted message content.
- Long messages and multi-paragraph messages.
- Messages exceeding the existing Keep input's 1,000-character limit.
- Leading and trailing whitespace preservation.
- Exact preservation of punctuation, line breaks and original message text.
- Empty or whitespace-only message rejection without altering valid message text.
- Explicit message-size boundary validation.
- Message ordering and sequence validation.
- Missing, invalid and ambiguous timestamps.
- Date-only and partial timestamp precision.
- Explicit timezone offsets.
- Unknown authorship.
- Unsupported source-role values where relevant to user-supplied material.
- Quoted speech and nested quotations.
- Conflicting speaker attribution.
- Duplicate Mopapa-generated identifiers.
- Invalid conversation and participant references.
- Repeated save attempts using the same pending operation identifiers.
- Failed saves and interrupted operations.
- In-memory rollback after failed saves.
- Backup and restore of conversations and messages.
- Full backup and restore round trips containing existing application data and non-empty conversations and messages.
- Rejection of malformed conversation and message records during restore.
- Failed restore attempts preserving the previously active dataset.
- Migration from schema version 2 to schema version 3.
- Preservation of existing Keep, Ask, learning and recovery data.
- Confirmation that the three later-stage collections remain empty.

External platform import fixtures are deferred until a particular import adapter has been separately approved.

Required fixture categories:

1. Source-role and author mapping:
   - User-authored messages.
   - Assistant-authored messages.
   - System messages.
   - Third-party participants.
   - Unknown authors.
   - Contradictory source role and author information.
   - User-supplied messages whose author is the user.

2. Quotation attribution:
   - Direct quotations.
   - Reported speech.
   - Paraphrases.
   - Uncertain attribution.
   - Multiple speakers in one message.
   - Nested quotations.
   - Ambiguous or conflicting speaker attribution.
   - Missing or invalid quotation spans.

3. Timestamp preservation:
   - UTC timestamps.
   - Explicit positive and negative offsets.
   - Timestamps without timezone information.
   - Date-only values.
   - Partial dates.
   - Numeric source timestamps where supported.
   - Invalid and ambiguous source timestamps.
   - Different source precision.
   - Receipt time distinct from original message time.

4. Message integrity and ordering:
   - Stable source sequence.
   - Missing sequence values.
   - Duplicate sequence values.
   - Out-of-order source records.
   - Identical timestamps on separate messages.
   - Empty and unusually long messages.
   - Unicode, emoji, surrogate pairs and combining characters.
   - Exact original text preservation.

5. Native creation and retry:
   - Repeated save of the same pending native operation using its original identifiers.
   - Interrupted native conversation or message creation followed by retry.
   - Duplicate Mopapa-generated identifiers already assigned to different records, with identical or conflicting content.
   - Missing conversation or message identifiers in malformed native records.
   - Identical or similar wording in separate messages or conversations must not cause automatic merging.

6. Failure and recovery:
   - Invalid conversation references.
   - Invalid participant references.
   - Broken quotation parent references.
   - Cyclic quotation relationships.
   - Failed persistence.
   - Interrupted native save followed by retry using the same pending identifiers.
   - Backup export and restore of a populated archive.
   - Reload and verification of preserved source text and metadata.

Additional Stage 2 acceptance checks:

1. Origin and authorship:
   - A native conversation containing a user-authored message.
   - A native conversation containing a message explicitly attributed to another participant.
   - A user-supplied conversation containing user-authored material.
   - A user-supplied conversation containing third-party or assistant-authored material.
   - A message whose supplier is known but whose original author is unknown.
   - A conversation and its messages with different valid origin types.
   - Confirmation that neither conversation origin nor message origin determines authorship.
   - Confirmation that the interface operator is not automatically recorded as the original author.

2. Source-role handling:
   - Native messages with no source role.
   - User-supplied messages with no source role.
   - Explicitly supplied source-role values preserved exactly.
   - Author attribution remaining independent of source role.
   - Contradictory role and author information remaining unresolved or being rejected.

3. Exact backup preservation:
   - Export a populated schema-v3 dataset as plain JSON.
   - Confirm that no new backup envelope or independent backup-format version is introduced.
   - Restore the exported backup into a clean application instance.
   - Compare every supported data domain before and after the round trip.
   - Verify exact original message text, including leading and trailing whitespace, punctuation, line breaks and Unicode.
   - Verify conversation and participant identifiers, sequence values, timestamps, roles, authorship, quotation annotations and origin metadata.
   - Verify that memories, memorySources and memoryRelations remain empty.

4. Migration safety:
   - A valid schema-v2 dataset migrates to schema version 3 without changing existing application data.
   - A schema-v2 dataset with any non-empty proposed collection is rejected.
   - A schema-v2 dataset missing a required collection is rejected.
   - A schema-v3 dataset is not migrated a second time.
   - A failure during candidate construction leaves the original dataset unchanged.
   - A failure during recovery-copy creation prevents migration.
   - A failure during commit or read-back does not report success.
   - A failed restoration leaves the application in a blocked or recovery-required state.
   - Reload after an interrupted migration identifies the actual valid primary schema rather than assuming the previous operation succeeded.
   - Legacy version 0 and version 1 inputs continue through their existing migration path before reaching version 3.

5. Existing implementation alignment regressions:

   - A schema-v2 dataset with rejected entries must block schema-v3 migration, even when its original recovery copy was successfully saved.
   - A schema-v2 dataset with rejected learning data must block schema-v3 migration.
   - Rejected custom rooms and rejected Ask data must independently block schema-v3 migration.
   - A `recoveryBlocked` indicator must block migration.
   - Persisted rejection indicators in the original parsed schema-v2 object must still block migration after a reload.
   - Migration must not proceed merely because transient in-memory rejection flags are absent.
   - Every blocked migration must leave the exact original primary storage value unchanged.
   - A blocked migration must not write a schema-v3 candidate or report successful migration.
   - A populated schema-v3 backup must restore every conversation and message without altering original text or metadata.
   - A schema-v3 restore containing an invalid conversation, participant or quotation reference must reject the complete restore.
   - A failed archive save must restore the previous in-memory dataset and must not overwrite a newer primary record after a storage conflict.
   - The separate archive input must preserve leading and trailing whitespace, line breaks, punctuation and Unicode.
   - The archive input must support messages beyond the existing Keep input's 1,000-character limit, within the separately approved archive boundary.
   - The existing Keep and Ask composer must continue to behave as before.
   - Startup must not enable archive writes when migration has been blocked or the storage state is uncertain.

These cases must extend existing migration, restore, rollback and browser tests wherever possible. They must not duplicate existing assertions that already prove the same behaviour.

Release-blocking failures include altered original text, invented authorship, false quotation attribution, invented timestamps, uncontrolled duplicate creation, partial imports reported as successful, and failed restore operations that damage existing data.

Stage 2 results must report each category separately. A single aggregate score must not conceal a critical attribution, evidence-integrity or data-loss failure.

## 2. Existing deterministic Ask regression suite

### 2.1 Purpose and principles

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

### 2.2 Documented baseline

The existing evaluation document records:

- 33 unit tests explicitly labelled "ask evaluation:" in "tests/run.js".
- 15 structured scenarios.
- 64 returned sources checked across the 33 named tests in the documented CI result.
- Ten negative location-question forms covered by a separate direct regression test.
- A separate intent-classifier regression test covering location-question negation.

Date-dependent Ask regression fixtures use a fixed, controlled test-harness clock. Clock control belongs in the test harness, not in the production Ask API.

These figures describe the documented historical evaluation baseline. They must not be presented as a freshly verified current result without checking the relevant repository commit and CI run.

### 2.3 Existing named regression tests

The following catalogue records the existing 33 named tests. Do not recreate equivalent tests under different names.

### Grounding, abstention and typo handling

1. "ask evaluation: realistic answers are grounded in their supporting memories"
   
   - Checks location, recipient, scheduled appointment and cost answers.
   - Checks expected answer content and supporting source IDs.

2. "ask evaluation: unsupported answers are not invented"
   
   - Checks an unknown location and a cost with no recorded amount.
   - Checks that unsupported information is not fabricated.

3. "ask evaluation: typo suggestions are clearly labelled and source-backed"
   
   - Checks a misspelled query.
   - Requires the relevant suggested memory among the sources.

### Conflicts and ambiguity

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

### Appointment history and date selection

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

### Money and cost history

21. "ask evaluation: direct cost questions exclude quotes, estimates, refunds and money received"
22. "ask evaluation: latest, previous and original costs ignore quotes and estimates"
23. "ask evaluation: excluded quotes do not create false ambiguity between actual costs"
24. "ask evaluation: latest cost questions use the newest corrected amount"
25. "ask evaluation: original-cost questions retrieve the earlier amount"
26. "ask evaluation: previous cost retrieves the immediately preceding amount"
27. "ask evaluation: original cost selects the oldest saved version"

These cases cover confirmed costs, excluded financial statements, ambiguity and historical amounts.

### Location history

28. "ask evaluation: newest location is determined by saved timestamp, not storage order"
29. "ask evaluation: a newer location replaces the old location for the same item"
30. "ask evaluation: explicit previous-location questions retrieve the older location"
31. "ask evaluation: previous location selects the second-newest saved version"

### Incomplete and negated questions

32. "ask evaluation: punctuation and casing preserve equivalent grounded answers"
    
    - Checks ordinary, uppercase, polite and repeated-punctuation variants.
    - Requires equivalent grounded answers and identical supporting source IDs.

33. "ask evaluation: incomplete prompts preserve safe answer, clarification and suggestion behaviour"
    
    - Checks short topic prompts, short location questions, ambiguous date questions, subject-only prompts and questions without a subject.
    - Requires the correct answer, clarification or suggestion behaviour and checks supporting source IDs.

The direct regression test "ask: negative location questions do not produce positive location claims" covers twenty negated location-question forms: ten beginning with "where" and ten beginning with supported "which" location types. Each form must receive the safe response and return no supporting sources.

A separate regression test checks the intent classifier, including positive location questions and unrelated negation elsewhere in the same sentence or a later sentence.

Neither direct test is included in the count of 33 tests explicitly labelled "ask evaluation:".

### 2.4 Structured scenario format

New structured evaluation scenarios use "runAskEvaluationCase()" in "tests/run.js".

Each case contains:

| Field | Purpose |
|---|---|
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

### 2.5 What the existing suite demonstrates

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

### 2.6 Existing measurement limitations

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

### 2.7 Regression evaluation metrics

| Metric | Current interpretation |
|---|---|
| Answer correctness | Expected-answer pattern checks are counted. This is not a global semantic accuracy measurement. |
| False-positive rate | Not measured globally. The complete set does not classify every factual claim against ground truth. |
| Abstention rate | Not measured as a product rate. The summary reports only the proportion of curated scenarios designed to abstain. |
| Appropriate abstention | Reports passing expected-abstention scenarios. This is limited to the selected cases. |
| Source precision | Not measured globally. Explicit semantic support checks cover the curated regression set, not a representative sample of real questions. |
| Clarification correctness | Reports passing expected-clarification scenarios. This is limited to the selected cases. |
| Curated source support | Reports semantic source-support checks across the named regression tests. The documented historical result was 64/64 returned sources across 33/33 named tests. |

The test runner's evaluation summary reports structured scenarios passed and failed, expected behaviour coverage by category, expected-answer pattern assertions, expected source-ID assertions, selected clarification and abstention results, and semantic source-support checks.

The 15 structured scenarios are not the complete 33-test evaluation set. Source-ID matching does not itself prove semantic support. Every structured scenario that returns sources has an explicit support predicate; the source-free question-without-subject case has no source to assess.

Do not optimise answer rate at the expense of unsupported answers. A justified abstention is preferable to an invented fact.

---

## 3. Separate 50-note / 50-question Ask diagnostic benchmark

### 3.1 Purpose and status

This is a controlled diagnostic set for retrieval, answer extraction, source grounding, date handling, ambiguity and appropriate abstention.

- Dataset: 50 fictional saved memories and 50 questions.
- Reference date: 17 November 2026, 12:00 UTC.
- All names, contact details, passwords, dates and events are fictional test fixtures, not real personal information.

This benchmark is separate from the existing 33-test Ask regression suite.

It is not statistically representative of all user behaviour. Results must be reported as performance on this particular 50-question set, not as universal Ask accuracy.

### 3.2 Benchmark pass rules

A question passes only when:

1. The answer is factually correct.
2. Returned source entries actually support the answer.
3. Missing information is not invented.
4. Historical information is not presented as current.
5. Ambiguity is clarified rather than guessed.
6. Unanswerable questions receive an appropriate abstention.
7. Extracted values are not added to Ask learning or the unanswered-question list.

A correct answer with an incorrect source is a failure.

### 3.3 The 50 fictional saved memories

All timestamps are ISO 8601. "created" is the saved-memory timestamp. "when" is the scheduled date where applicable.

| ID | Room | Created | When | Saved memory |
|---|---|---|---|---|
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

### 3.4 The 50 evaluation questions

"Answer" means a supported answer is expected. "Clarify" means the available information is genuinely ambiguous. "Abstain" means the dataset does not contain the answer.

| # | Question | Expected behaviour | Expected source |
|---|---|---|---|
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

### 3.5 Important benchmark distinctions

### Location recall

Question 26 must return the last recorded location, not claim to know where the card is now.

### Date and appointment recall

Questions 11, 19, 27, 30, 37 and 42 test different date behaviours. A previous appointment must not override a future one. Rescheduled dates must not be confused with original dates.

### Multi-source answers

Questions 3 and 30 require more than one source. Returning only one relevant entry is incomplete.

### Answer extraction

Questions 7, 8, 9, 13, 28, 29, 31, 35 and 41 require extracting a particular value or relationship from a saved note.

### Abstention

Questions 20–25 and 50 have no supporting answer.

Question 20 is particularly important: related proposals exist, but no saved memory establishes a final garden decision. Claiming that one proposal was chosen is a failure.

### Distractors

M35, M36, M43 and M50 are deliberate distractors. They contain related names or vocabulary but must not be returned as supporting evidence for unrelated questions.

### 3.6 Benchmark readiness checklist

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

## 4. Future Personal Memory Companion evaluation

The 50-question Ask benchmark does not evaluate the proposed conversation and personal-memory architecture.

The future system requires a separate evaluation programme. It must test the complete lifecycle, not merely whether a memory can be retrieved.

### 4.1 Source ingestion and preservation

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

### 4.2 Candidate extraction

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

### 4.3 Evidence and provenance

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

### 4.4 Temporal reasoning

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

### 4.5 Identity, authorship and attribution

Evaluate these dimensions independently:

- Message author attribution.
- Quoted-speaker attribution.
- Memory subject attribution.
- Conversation-local participant identity.
- Real-world identity uncertainty.
- Identity correction and dependent-record reassessment.

Required fictional fixtures:

- User speaking about themselves.
- User speaking about a partner or family member.
- A third party speaking about the user.
- A third party speaking about another third party.
- Assistant repeating a fact originally supplied by the user.
- Assistant introducing a claim unsupported by the original conversation.
- Direct quotation with an explicitly identified speaker.
- Reported speech without an exact quotation.
- Paraphrased speech.
- A quotation whose speaker is unknown.
- Nested quotations involving multiple speakers.
- Multiple participants in an imported conversation.
- Different participants sharing the same display name.
- One participant using different labels within the same conversation.
- Similar names appearing in separate conversations without established identity.
- Missing author metadata.
- Source role contradicting structured author attribution.
- A participant reference belonging to another conversation.
- Ambiguous pronouns and conflicting subject references.
- Identity correction after dependent memories have been extracted.
- Deletion or revocation of evidence supporting an identity decision.

Verify that:

- Message author and memory subject are never automatically treated as the same identity.
- Quoted speakers are not automatically treated as message authors.
- Reported statements are not independent proof that the reported claim is true.
- Unknown attribution remains unknown.
- Conversation-local participant identity does not imply global identity.
- Identity corrections trigger reassessment of dependent memories and relationships.
- Original message authorship and source text remain unchanged.

A correct answer about the wrong person is a critical failure.

Attributing an assistant or third-party statement to the user is a critical failure.

Global identity resolution remains unapproved.

### 4.6 Cross-domain evidence and temporal integration fixtures

This section tests combinations of evidence, provenance and temporal information across complete records. It complements the focused evidence and temporal checks in Sections 4.3 and 4.4 rather than creating a second independent list of basic field-validation tests.

Evaluate:

- Direct supporting evidence.
- Refuting evidence.
- Qualifying evidence.
- Context-only evidence.
- Multiple independent sources.
- Several memories supported by one message.
- One memory supported by several messages.
- Missing or invalid provenance references.
- Duplicate provenance relationships.
- Deleted or revoked evidence.
- Evidence spans against unchanged original messages.
- Compound claims with different evidence.
- Contradictory claims.
- Corrections to previously extracted information.

Required temporal fixtures:

- Exact UTC timestamp.
- Timestamp with an explicit offset.
- Date-only information.
- Month-only information.
- Year-only information.
- Approximate dates and intervals.
- Unknown time.
- Known start with unknown end.
- Known end with unknown start.
- Invalid start and end ordering.
- Relative dates with known source timestamps.
- Relative dates with unknown source timestamps.
- Historical information after supersession.
- Timezone information supplied by the source.
- Missing timezone information.

Required Unicode evidence-span fixtures:

- Basic ASCII.
- Emoji represented by surrogate pairs.
- Combining characters.
- Accented characters.
- Non-Latin scripts.
- Mixed Unicode and punctuation.
- Invalid negative and out-of-range offsets.
- Empty spans.
- Incorrect substring boundaries.

Verify that:

- UTF-16 offsets use inclusive starts and exclusive ends.
- The same offset convention is used for extraction, validation and highlighting.
- Import time is not substituted for event time.
- Recording time is not substituted for validity time.
- Approximate dates are never presented as exact.
- Original timestamps and original message text are not rewritten.
- Context-only and refuting sources never establish support.
- Evidence-state assessments reflect all relevant remaining provenance.

### 4.7 Candidate formation, lifecycle and memory quality

Evaluate candidate suitability and rejection.

Required fixtures:

- Explicit request to remember a clear personal fact.
- Stable personal preference.
- Confirmed recurring requirement.
- Ongoing project or commitment.
- Meaningful personal event.
- User-confirmed relationship.
- Incidental conversational detail.
- Ordinary conversational filler.
- Assistant suggestion without user confirmation.
- Hypothetical statement.
- Fictional or role-play statement.
- Ambiguous statement.
- Incorrectly inferred subject.
- Invalid evidence span.
- Unsupported claim broader than the original evidence.
- Candidate conflicting with an explicit dismissal or deletion decision.

Evaluate lifecycle behaviour:

- Candidate creation.
- Candidate rejection.
- User review.
- Acceptance.
- Dismissal.
- Correction.
- Genuine change in circumstances.
- Temporary exception.
- Supersession.
- Contradiction.
- Historical retention.
- Evidence-state changes.
- Lifecycle-state changes.
- Invalid lifecycle transitions.
- Supersession cycles.
- Dependency cycles.
- Re-import after dismissal.
- Reassessment after loss of supporting evidence.

Verify that:

- Candidate status does not imply evidence support.
- Evidence support does not automatically imply acceptance.
- Repetition is not automatically treated as independent corroboration.
- Assistant-generated suggestions do not become user facts.
- Hypothetical and fictional information is not silently promoted.
- A correction is distinguished from a genuine change in circumstances.
- Historical information is not silently presented as current.
- Dismissed information does not silently return as an accepted memory.
- Lifecycle and evidence state remain independent.

### 4.8 Governance, permissions and retrieval eligibility

Evaluate:

- Missing permission.
- Unknown permission.
- Explicit denial overriding an allow.
- Scope restrictions.
- Audience restrictions.
- Use restrictions.
- Conversation-level restrictions.
- Message-level restrictions.
- Memory-level restrictions.
- Multiple sources with different permissions.
- Permission inheritance through derived memories.
- Revocation of one supporting source.
- Revocation of the final supporting source.
- User-confirmed restrictions.
- Restricted information in summaries.
- Restricted information in cached context.
- Restricted information in search indexes.
- Proactive-use restrictions.
- Cross-context-use restrictions.

Required adversarial fixtures:

- One source allows a use while another denies it.
- A derived memory attempts to broaden source permissions.
- A summary contains information from a restricted source.
- A source is revoked after a memory has been indexed.
- A memory remains supported but is no longer permitted for the requested use.
- Permission is unknown at one applicable governance level.
- A previously permitted use is explicitly withdrawn.
- A restricted memory is retrieved through an indirect relationship.

Verify that:

- Explicit denial takes precedence.
- Unknown required permission denies the disputed use.
- Every materially supporting source participates in permission evaluation.
- Derived memories cannot gain broader permissions than their evidence.
- Governance is evaluated before retrieval and answer-context assembly.
- Restricted information cannot influence an answer indirectly through a summary, cache or index.
- Revocation triggers reassessment of dependent records and derived representations.

### 4.9 Deletion, revocation, re-import and recovery

Evaluate the distinct operations:

- Individual memory deletion.
- Individual message deletion.
- Entire conversation deletion.
- Source revocation.
- Memory dismissal.
- Memory correction.
- Memory restriction.
- Explicit user reintroduction.
- Backup restoration.
- Re-import of previously processed information.

Required dependency fixtures:

- Memory with one supporting source.
- Memory with multiple independent supporting sources.
- Memory with a mixture of supporting and refuting evidence.
- Memory with dependent memories.
- Memory with semantic relationships.
- Deleted source with remaining independent evidence.
- Deleted final supporting source.
- Revoked source with alternative permitted evidence.
- Deleted source referenced by a derived summary.
- Deletion affecting a cached or indexed representation.

Required transaction and failure fixtures:

- Invalid deletion request.
- Missing target record.
- Broken dependency reference.
- Failure during preparation.
- Failure before commit.
- Failure during commit.
- Failure during read-back verification.
- Interrupted operation.
- Retry of an already completed operation.
- Repeated deletion request.
- Concurrent dataset modification.
- Storage quota exhaustion.
- Recovery-copy creation failure.
- Incomplete secondary cleanup.
- Uncertain final storage state.

Required re-import fixtures:

- Re-import using a reliable existing source identifier.
- Re-import of a deleted source.
- Re-import of a revoked source.
- Re-import of a dismissed candidate.
- Similar text with a different source identifier.
- Source with no reliable identifier.
- Explicitly authorised reintroduction.
- Attempted restoration through an older backup.
- Suppression metadata without original message content.

Verify that:

- Deletion propagates through direct and indirect dependencies.
- Independently supported memories are reassessed rather than automatically discarded or retained.
- Revoked information cannot enter prohibited retrieval or answer context.
- Failed deletion is never reported as successful.
- Uncertain cleanup blocks affected information from use.
- Retries do not create inconsistent duplicate operations.
- Unrelated records remain intact.
- Stale indexes, summaries and caches cannot restore deleted information.
- Dismissal and deletion remain distinct operations.
- The application does not claim to erase external backup files it cannot access.

Additional unresolved-policy fixtures:

- Ordinary re-import cannot deliberately bypass deletion suppression.
- Explicit user-authorised reintroduction follows the approved policy.
- Repeated extraction cannot silently restore deleted or dismissed information.
- Missing suppression information cannot be treated as proof that re-import is safe.
- Incomplete secondary cleanup blocks affected records and dependent retrieval.
- Unrelated, independently validated records remain available only where the approved partial-cleanup policy permits.
- The application does not report complete deletion while required cleanup remains unresolved.
- Interrupted deletion can be retried without creating inconsistent duplicate operations.
- Manual entries and extracted memories containing similar information remain separate.
- Creating an extracted memory cannot overwrite an existing manual entry.
- Deleting a manual entry does not silently delete an overlapping extracted memory.
- Deleting an extracted memory does not silently delete an overlapping manual entry.
- Conflicting manual and extracted information is not silently merged into one established fact.

A deletion or revocation failure that permits prohibited information to influence an answer is a critical failure.

### 4.10 Backup, restore, migration and storage reliability

Evaluate the complete proposed five-collection dataset alongside existing application data.

Required compatibility fixtures:

- Supported unversioned legacy data.
- Valid schema version 1.
- Current schema version 2 with all five additional collections empty.
- Proposed schema version 3 with valid native conversations and messages.
- Unsupported future schema version 4 or later.
- Invalid schema version.
- Missing required collections.
- Valid empty collections.
- Null collections.
- Malformed records.
- Duplicate identifiers.
- Missing references.
- Cross-collection reference errors.
- Invalid provenance.
- Invalid relationships.
- Invalid governance.
- Invalid attribution.
- Invalid temporal data.
- Invalid derivation dependencies.

Required migration and recovery fixtures:

- Successful version 0 to version 2 migration.
- Successful version 1 to version 2 migration.
- Successful version 2 to version 3 migration.
- Version 2 to version 3 migration preserving all existing application data.
- Version 2 to version 3 migration leaving memories, memorySources and memoryRelations empty.
- Migration with existing manual entries.
- Migration with existing learning data.
- Migration with Ask aliases and boosts.
- Failure during migration preparation.
- Failure during migration commit.
- Failed read-back verification.
- Interrupted migration.
- Rollback after failure.
- Recovery-copy creation and verification.
- Corrupt recovery copy.
- Older application encountering newer data.
- Attempted downgrade.
- Restore of a backup predating a deletion.
- Restore of a backup predating a revocation.
- Restore with malformed connected data.
- Restore with missing references.
- Storage quota failure.
- Persistence after application reload.

Required archive-performance measurements:

- Small archive.
- Medium archive.
- Large archive.
- Many short messages.
- Fewer long messages.
- Many conversations.
- Many provenance links.
- Many relationships.
- Full validation.
- Backup export.
- Backup import.
- Restore.
- Migration.
- Recovery-copy creation.

Measure:

- Serialised size.
- Save latency.
- Load latency.
- Export time.
- Import time.
- Validation time.
- Migration time.
- Recovery-copy overhead.
- Peak memory use where measurable.
- Failure behaviour near storage limits.

CI Chromium measurements must not be presented as proof of actual Android-device performance.

Required derived-index reliability fixtures:

- Build an index from valid authoritative messages and memories.
- Verify every indexed result retains its correct source references.
- Rebuild an index without modifying original messages or memory records.
- Interrupt a rebuild before completion and verify authoritative data remains unchanged.
- Interrupt a rebuild after staging but before replacement.
- Verify an incomplete index is never exposed as a complete search result.
- Verify the previous valid index remains usable when safe, or that retrieval fails clearly when it is not.
- Verify a completed rebuild replaces the previous index only after validation.
- Verify stale index generations are detected and rejected.
- Verify deleted source information is not returned through an old index.
- Verify revoked information is not returned through an index or cached context.
- Verify restricted information cannot enter results through summaries or derived representations.
- Verify a missing or malformed source reference makes the affected result ineligible.
- Verify rebuilding after deletion or revocation does not recreate prohibited information.
- Verify search and retrieval remain traceable to authoritative records after rebuilding.

Critical failure conditions:

- An index changes or replaces authoritative source records.
- A failed rebuild destroys the only valid authoritative data.
- Incomplete or stale index content is presented as current.
- Deleted or revoked information remains available through derived representations.
- A derived index bypasses source permissions or attribution rules.

Verify that:

- Existing entries, learned data, custom rooms and Ask data remain intact.
- No unsupported newer schema is silently loaded and overwritten.
- Invalid connected data is not silently discarded during successful restore.
- A failed write is not reported as successful.
- Rollback limitations are reported accurately.
- Deletion and revocation decisions are not silently reversed by older backups.
- The existing 5 MiB import limit is not changed without measured evidence and explicit approval.
- IndexedDB remains deferred unless representative workload measurements justify reconsideration.


### 4.11 Retrieval and answering

Evaluate:

- Relevant memory selection.
- Source-backed answer correctness.
- Complete source selection.
- Contradictory evidence.
- Historical versus current answers.
- Permission enforcement during retrieval.
- Uncertainty communication.
- Appropriate clarification.
- Appropriate abstention.
- No unsupported personal claims.
- No leakage from unrelated or restricted memories.
- Correct use of derived memories.
- Correct behaviour when evidence is deleted or revoked.

A correct answer about the wrong person is a critical failure.

An answer that presents unsupported information as an established personal fact is a critical failure.

The existing deterministic Ask baseline remains protected. Future memory retrieval may supply evidence to Ask, but this document does not authorise replacing Ask with an LLM. Any expansion must preserve source grounding, uncertainty and appropriate abstention, and must be separately evaluated and approved.

---

## 5. Evaluation fixture and test design

### 5.1 Fixture requirements

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

### 5.2 Negative and adversarial cases

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

### 5.3 Test placement and duplication control

Before adding any evaluation test:

1. Inspect `tests/run.js` and `tests/browser.js`.
2. Search for equivalent existing coverage.
3. Identify the precise uncovered behaviour.
4. Add the smallest test that demonstrates the gap.
5. Preserve existing assertions unless evidence shows they are incorrect.
6. Avoid duplicating an existing test under another name.
7. Keep test-only controls out of production APIs wherever possible.

For new structured Ask scenarios:

- Use `runAskEvaluationCase()` for answer, clarification, abstention and suggestion scenarios.
- Include expected source IDs wherever an answer should be source-backed.
- Use `exact`, `includes` or `none` source expectation modes according to the intended assertion.
- Include competing or irrelevant memories where needed to test false positives.
- Use the fixed evaluation clock for date-dependent cases.
- Keep evaluation assertions independent of implementation details wherever possible.
- Do not weaken an existing assertion merely to make a new case pass.

Keep evaluation deterministic, local and dependency-free.

The evaluation specification does not authorise changes to production code or test files. Do not replace the existing regression tests with a new framework or duplicate their scenarios.

---

## 6. Reporting and release gates

### 6.1 Report separate results

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

### 6.2 Report failure categories

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

### 6.3 Critical release blockers

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

### 6.4 Thresholds remain unresolved

No final numerical accuracy threshold, minimum benchmark score, acceptable false-positive rate, or Android performance acceptance threshold is approved by this document.

Those thresholds require explicit decisions recorded in the build plan, supported by representative fixtures and measured evidence.

---

## 7. Evaluation maintenance and next work

### Existing Ask regression

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

### Personal-memory evaluation

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

## 8. Document authority and maintenance

This document defines evaluation methods, fixtures and reporting requirements.

The other master documents retain their separate authority:

- "personal-memory-architecture.md": product direction and architectural principles.
- "personal-memory-record-specification.md": canonical technical data and lifecycle requirements.
- "personal-memory-build-plan.md": implementation order, approval gates and verified engineering progress.
- "personal-memory-research-review.md": supporting research and rationale.

The technical specification defines what must be correct. This evaluation document defines how those properties should be tested. The build plan determines when implementation and verification are authorised.

Do not duplicate the canonical data model or create a second implementation roadmap here.

Current position: Existing deterministic Ask regression coverage and its 50-question diagnostic corpus remain separate evaluation assets. Stage 1 schema version 2 is implemented and verified. Stage 2 native, source-independent conversation and message preservation has been specified and explicitly approved for implementation on 27 November 2026. Schema version 3 is not yet implemented. Its specified evaluation fixtures, migration requirements and end-to-end acceptance criteria remain mandatory implementation acceptance requirements. Unit and browser tests must be extended alongside the corresponding production changes. Approval does not establish that any Stage 2 production behaviour has already been implemented or verified.

---

## 9. External research benchmark crosswalk

External benchmarks must inform Mopapa's evaluation design without being confused with existing Mopapa test results.

They measure different capabilities and must remain separate evaluation tracks.

| Research | Mopapa evaluation responsibility | Intended stage |
|---|---|---|
| LoCoMo | Single-hop, multi-hop, temporal, open-domain and adversarial long-term recall | Retrieval and answering |
| LongMemEval Oracle | Evidence interpretation when relevant evidence is already supplied | Extraction and reasoning |
| LongMemEval S | Retrieval across substantial histories containing relevant and irrelevant information | Retrieval |
| LongMemEval M | Retrieval at larger history scale | Later scalability evaluation |
| TimlMemBench | Write, revoke, supersede, preserve, scope, provenance, boundary, activation and proactive governance | Memory lifecycle and governance |
| HaluMem | Extraction, updating and answering errors measured independently | Extraction, updating and answering |
| HorizonBench | Preference evolution and belief updates across time | Temporal memory |
| MemArena | On-device memory, multi-session recall and permission-aware use | Storage, retrieval and governance |
| GroupMemBench | Speaker attribution, multi-party identity and knowledge updates | Evidence preservation and identity |
| MemoryAgentBench | Incremental learning, long-range understanding and selective forgetting | Ingestion and lifecycle |
| LoCoMo-Conv | Natural, implicit, composed and counterfactual conversational queries | Retrieval and conversational use |
| LoCoMo-Plus | Retention and application of supported constraints, goals and values | Contextual retrieval |
| BEAM | Very long-history retrieval and scalability | Later scalability evaluation |
| MemoryArena agentic evaluation | Application of accumulated experience to later tasks | Later product evaluation |
| DolphinBench | Capability, latency and resource-cost trade-offs | Later operational evaluation |

### 9.1 LongMemEval separation

The Oracle, S and M resources must not be treated as interchangeable.

Oracle evaluation supplies the evidence so that interpretation and reasoning can be examined without retrieval being the primary variable.

S and M evaluate retrieval over increasingly large histories.

Mopapa must retain these as separate measurements.

Do not combine Oracle, S and M into one score that hides whether a failure came from evidence interpretation or retrieval.

### 9.2 Independent failure measurement

Personal-memory evaluation must distinguish at least:

1. Source capture failure.
2. Original evidence preservation failure.
3. Candidate extraction failure.
4. Attribution or identity failure.
5. Evidence and provenance failure.
6. Memory update or supersession failure.
7. Temporal reasoning failure.
8. Governance or permission failure.
9. Retrieval failure.
10. Answer interpretation failure.
11. Abstention failure.
12. Deletion, revocation or re-import failure.
13. Backup, restore or migration failure.
14. Performance or resource failure.

A correct final answer must not conceal an unsafe intermediate memory or governance failure.

### 9.3 Evaluation sequence

External benchmark work must follow implementation readiness.

1. Preserve the existing deterministic Ask regression suite.
2. Verify the existing 50-question diagnostic corpus separately.
3. Create Mopapa-authored fictional fixtures for evidence preservation and attribution.
4. Evaluate candidate extraction and rejection.
5. Evaluate provenance, identity and temporal handling.
6. Evaluate governance, restriction propagation and revocation.
7. Evaluate deletion, re-import and recovery.
8. Evaluate retrieval and answer grounding.
9. Introduce relevant external benchmark subsets when the corresponding ingestion and evaluation interfaces exist.
10. Evaluate large-history performance only after the underlying system can process representative archives.

The LongMemEval Oracle subset must remain distinct from retrieval testing.

LongMemEval S and M must not be claimed as completed until meaningful retrieval evaluation is possible.

TimlMemBench governance cases must not be replaced by ordinary factual question answering.

### 9.4 Benchmark limitations and permissions

Before using an external dataset:

- Inspect its licence.
- Check redistribution and commercial-use conditions.
- Check whether derivative fixtures are permitted.
- Keep original benchmark material separate from Mopapa-authored tests.
- Record dataset versions and source references.
- Do not commit large datasets unnecessarily.
- Never use real private conversation exports as public fixtures.

Published benchmark scores are not direct proof of Mopapa performance.

No numerical benchmark threshold, acceptable false-positive rate or Android performance threshold is approved by this section.

Those thresholds require explicit decisions in the build plan and measured evidence.