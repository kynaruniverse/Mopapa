
# Ask Evaluation

**Purpose:** maintain a documented, repeatable regression set for Mopapa's deterministic, source-backed Ask system.

**Current baseline:** 33 unit tests explicitly labelled `ask evaluation:` in `tests/run.js`, with 15 structured scenarios.

**Status:** existing regression coverage catalogued. This is not yet a statistically measured accuracy benchmark.

## 1. Evaluation principles

Ask must:

- Answer only when saved memories provide sufficient evidence.
- Return the memory entries that support the answer.
- Clarify when multiple plausible memories conflict.
- Abstain rather than invent missing facts.
- Distinguish current, previous and original values when the question specifies which is wanted.
- Preserve deterministic behaviour. Semantic similarity alone must never establish a factual answer.

A passing evaluation requires the expected answer behaviour and the expected supporting sources. An answer that happens to contain the right words but cites an unrelated memory is not a correct result.

## 2. Existing evaluation cases

### Structured case format

New structured evaluation scenarios use `runAskEvaluationCase()` in `tests/run.js`.

Each case contains:

| Field | Purpose |
|---|---|
| `id` | Stable identifier for the scenario |
| `entries` | Saved memories supplied to Ask |
| `question` | Exact user question |
| `expected.behaviour` | `answer`, `clarify`, `abstain` or `suggest` |
| `expected.answer` | Regular expression matching the required answer behaviour |
| `expected.sources` | Expected source IDs and matching mode |
| `expected.missed` | Optional expected unanswered-question state |
| `supports` | Optional check that every returned source supports the answer |

Source expectation modes:

- `exact`: the complete returned source-ID set must match the expected IDs. Order is ignored.
- `includes`: every listed source ID must be returned, but additional sources are permitted.
- `none`: Ask must return no supporting sources.

The shared runner checks the answer, expected behaviour category, source expectations and optional missed-question state. A `supports` predicate can additionally verify that each returned source genuinely supports the answer.

The initial adoption covers grouped grounded-answer, clarification, abstention and typo-suggestion scenarios. Other Specialist regression tests retain their existing direct answer and source-ID assertions. The source-support audit is applied in addition, without duplicating or replacing those tests.

The following cases already exist in `tests/run.js`. Do not recreate them under different names or add equivalent tests without identifying a specific uncovered behaviour.

### Grounding, abstention and typo handling

1. `ask evaluation: realistic answers are grounded in their supporting memories`
   - Checks location, recipient, scheduled appointment and cost answers.
   - Checks expected answer content and supporting source IDs.

2. `ask evaluation: unsupported answers are not invented`
   - Checks an unknown location and a cost with no recorded amount.
   - Checks that unsupported information is not fabricated.

3. `ask evaluation: typo suggestions are clearly labelled and source-backed`
   - Checks a misspelled query.
   - Requires the relevant suggested memory to appear among the sources.

### Conflicts and ambiguity

4. `ask evaluation: conflicting dates, recipients and costs require clarification`
   - Checks competing appointment dates, recipients and costs.
   - Requires clarification and the competing source entries.

5. `ask evaluation: two dentist appointments at different times require clarification`
   - Checks ambiguity between two appointments on the same date.

6. `ask evaluation: specific appointment questions select the correct overlapping subject`
   - Checks whether a more specific question distinguishes overlapping appointments.

7. `ask evaluation: a broad dentist question clarifies across three overlapping appointments`
   - Checks that a broad question does not silently choose one of three possible appointments.

8. `ask evaluation: separate appointments at the same time are not silently collapsed`
   - Checks that separate appointments remain distinct even when their times match.

9. `ask evaluation: duplicate entries for the same appointment do not create false ambiguity`
   - Checks that duplicate representations of the same appointment do not create an artificial conflict.

10. `ask evaluation: unqualified questions do not silently choose between changed costs`
    - Checks that an unspecified cost question clarifies when multiple saved amounts exist.

### Appointment history and date selection

11. `ask evaluation: completed appointments do not override an upcoming appointment`
12. `ask evaluation: a specific next recurring service selects the earliest upcoming occurrence`
13. `ask evaluation: past-tense questions clarify between separate past occurrences of the same appointment`
14. `ask evaluation: a rescheduled appointment uses its upcoming date`
15. `ask evaluation: past-tense appointment questions return completed appointment dates`
16. `ask evaluation: past-tense appointment questions do not return future dates`
17. `ask evaluation: past-tense appointment questions select the old date after rescheduling`
18. `ask evaluation: original appointment questions retrieve the earlier scheduled date`
19. `ask evaluation: original appointment follows saved revision chronology when rescheduled earlier`
20. `ask evaluation: previous appointment retrieves the immediately preceding schedule`

These cases cover upcoming versus completed appointments, recurring occurrences, rescheduling, historical questions and revision chronology.

### Money and cost history

21. `ask evaluation: direct cost questions exclude quotes, estimates, refunds and money received`
22. `ask evaluation: latest, previous and original costs ignore quotes and estimates`
23. `ask evaluation: excluded quotes do not create false ambiguity between actual costs`
24. `ask evaluation: latest cost questions use the newest corrected amount`
25. `ask evaluation: original-cost questions retrieve the earlier amount`
26. `ask evaluation: previous cost retrieves the immediately preceding amount`
27. `ask evaluation: original cost selects the oldest saved version`

These cases cover confirmed costs, excluded financial statements, ambiguity and historical cost selection.

### Location history

28. `ask evaluation: newest location is determined by saved timestamp, not storage order`
29. `ask evaluation: a newer location replaces the old location for the same item`
30. `ask evaluation: explicit previous-location questions retrieve the older location`
31. `ask evaluation: previous location selects the second-newest saved version`

These cases cover current and historical locations, including the distinction between storage order and saved chronology.

### Incomplete and negated questions

32. `ask evaluation: punctuation and casing preserve equivalent grounded answers`
   - Checks ordinary, uppercase, polite and repeated-punctuation variants of the same question.
   - Requires equivalent grounded answers and identical supporting source IDs.

33. `ask evaluation: incomplete prompts preserve safe answer, clarification and suggestion behaviour`
   - Checks short topic prompts, short location questions, ambiguous date questions, subject-only prompts and questions without a subject.
   - Requires the correct answer, clarification or suggestion behaviour and checks supporting source IDs.

The direct regression test ask: negative location questions do not produce positive location claims covers ten negated location-question forms, including can't, cannot, won't and mustn't. Each form must receive the safe response and return no supporting sources. A separate regression test checks that negation is part of the location-question construction itself, rather than an unrelated negative expression elsewhere in the same sentence or a later sentence. Neither test is counted among the 33 tests explicitly labelled ask evaluation:.

## 3. What the current suite proves

The existing tests provide useful regression evidence for:

- Grounded answers with expected supporting entries.
- Selected cases of unsupported questions and conservative fallback.
- Conservative handling of negative location questions, including clause-scoped negation detection.
- Selected ambiguity and clarification behaviour.
- Appointment history and chronology.
- Cost exclusions and historical amounts.
- Location history and revision order.
- A typo suggestion with a supporting source.

The suite is an important correctness safeguard. It does not establish a general percentage accuracy for real-world user questions.

## 4. Current measurement scope

The current evaluation suite contains 33 named tests beginning with `ask evaluation:`.

Fifteen individual scenarios currently use the structured runner. They are grouped within five named tests:

- 7 expected-answer scenarios.
- 4 expected-clarification scenarios.
- 2 expected-abstention scenarios.
- 2 suggestion scenarios.

The test runner prints an evaluation summary after the full unit suite.

The summary reports:

- Structured scenarios passed and failed.
- Expected behaviour coverage by category.
- Expected-answer pattern assertion results.
- Expected source-ID assertion results.
- Selected clarification and abstention scenario results.
- Explicit semantic source-support checks.

Important limitations:

- The 15 structured scenarios are not the complete 33-test evaluation set.
- Every structured scenario that returns sources has an explicit semantic support predicate. The source-free question-without-subject case has no source to assess. All 33 named tests are included in the source-support audit.
- The latest CI run checked 64/64 returned sources across 33/33 named tests. This is curated regression coverage, not a global source-precision measurement.
- Source-ID matching does not prove that a source semantically supports the answer.
- The expected-answer regular expressions are regression assertions, not a complete measure of factual correctness.
- The two expected-abstention scenarios describe the composition of this curated test set, not the rate at which real users receive abstentions.
- The suite does not yet classify every unsupported factual claim, so a global false-positive rate cannot be calculated.
- Some date fixtures use local date construction before conversion to ISO timestamps. Calendar interpretation therefore remains subject to the test runtime's local timezone.
- The cases are hand-authored regression scenarios, not a representative sample of actual user questions.

Do not describe the current results as general Ask accuracy.

## 5. Evaluation metrics and reporting

| Metric | Current reporting and limitation |
|---|---|
| Answer correctness | Expected-answer pattern checks are counted. This is not a global semantic accuracy measurement. |
| False-positive rate | Not measured. The complete set does not classify every factual claim against ground truth. |
| Abstention rate | Not measured as a product rate. The summary reports only the proportion of curated scenarios designed to abstain. |
| Appropriate abstention | Reports passing expected-abstention scenarios. This is limited to the selected cases. |
| Source precision | Not measured globally. Explicit semantic support checks cover only scenarios with a `supports` predicate. |
| Clarification correctness | Reports passing expected-clarification scenarios. This is limited to the selected cases. |

Curated-set semantic source support is reported across all 33 named tests. Global source precision remains unmeasured; the fixtures are not a representative sample of real user questions.

Do not optimise answer rate at the expense of unsupported answers. A justified abstention is preferable to an invented fact.

## 6. Rules for future additions

Before adding an evaluation case:

1. Search `tests/run.js` and `tests/browser.js` for existing equivalent coverage.
2. Identify the exact behaviour not already covered.
3. Use `runAskEvaluationCase()` and the structured case format for new answer, clarification, abstention and suggestion scenarios.
4. Include expected source IDs wherever the answer should be source-backed.
5. Include competing or irrelevant memories where needed to test false positives.
6. Use the fixed evaluation clock for all date-dependent cases. Keep test-only clock control in the test harness, not the production Ask API.
7. Keep evaluation assertions independent of implementation details where possible.
8. Do not weaken an existing assertion merely to make a new case pass.

Keep the evaluation deterministic, local and dependency-free.

## 7. Next evaluation work

The next steps, in order:

1. [x] Make date-dependent evaluation cases use a fixed, controlled clock.
2. [x] Establish a structured case format with expected answer behaviour and expected sources.
3. [x] Add an evaluation summary that reports the metrics above.
4. [x] Audit semantic source support across all 33 named regression tests in the curated evaluation set.
5. Expand only where a genuine coverage gap is demonstrated.

Do not replace the existing regression tests with a new framework or duplicate their scenarios.

---

**Current conclusion:** Mopapa has 33 Ask evaluation regression tests running under a fixed test-harness clock. A shared structured case runner checks 15 scenarios covering grounded answers, clarification, abstention and suggestions. The latest completed CI baseline passed all 15 structured scenarios and all 64 semantic source-support checks across the 33 named tests. Direct regression coverage also protects ten negative location-question forms and checks that negation is scoped to the first location-question clause. The CI summary correctly leaves global source precision and global answer accuracy unmeasured. The next priority is to investigate only demonstrated gaps, without duplicating existing regression coverage.