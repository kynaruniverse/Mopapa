
# Ask Evaluation

**Purpose:** maintain a documented, repeatable regression set for Mopapa's deterministic, source-backed Ask system.

**Current baseline:** 31 unit tests explicitly labelled `ask evaluation:` in `tests/run.js`.

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

## 3. What the current suite proves

The existing tests provide useful regression evidence for:

- Grounded answers with expected supporting entries.
- Selected cases of unsupported questions and conservative fallback.
- Selected ambiguity and clarification behaviour.
- Appointment history and chronology.
- Cost exclusions and historical amounts.
- Location history and revision order.
- A typo suggestion with a supporting source.

The suite is an important correctness safeguard. It does not establish a general percentage accuracy for real-world user questions.

## 4. Current measurement limitations

The current 31 tests are distributed throughout `tests/run.js`. They are not yet a separate evaluation runner or a consolidated report.

Important limitations:

- All 31 `ask evaluation:` tests run under a fixed test-harness clock: `2026-11-17T12:00:00.000Z`.
- The test harness applies the same clock to date fixture construction and to the Ask runtime without changing the production Ask API.
- Some cases still use local date construction before conversion to ISO timestamps; calendar interpretation therefore remains subject to the test runtime's local timezone.
- Assertions are individual pass/fail checks rather than an aggregate evaluation report.
- The current suite does not calculate overall answer accuracy, false-positive rate, abstention rate or source precision.
- Source correctness is checked in selected scenarios, not yet audited as a single aggregate metric across every answer.
- The cases are hand-authored regression scenarios, not a representative sample of actual user questions.

Do not describe the current 31 passing tests as 100% Ask accuracy.

## 5. Evaluation metrics to establish

When a reproducible evaluation runner is introduced, report these separately:

| Metric | Meaning |
|---|---|
| Answer correctness | Whether the answer matches the expected outcome |
| False-positive rate | How often Ask gives an unsupported or incorrect factual answer |
| Abstention rate | How often Ask declines to provide a factual answer |
| Appropriate abstention | Whether Ask abstains when evidence is insufficient or conflicting |
| Source precision | Whether every displayed source genuinely supports the answer |
| Clarification correctness | Whether Ask asks for clarification when the evidence requires it |

Do not optimise answer rate at the expense of unsupported answers. A justified abstention is preferable to an invented fact.

## 6. Rules for future additions

Before adding an evaluation case:

1. Search `tests/run.js` and `tests/browser.js` for existing equivalent coverage.
2. Identify the exact behaviour not already covered.
3. Give the case a distinct scenario and expected outcome.
4. Include expected source IDs wherever the answer should be source-backed.
5. Include competing or irrelevant memories where needed to test false positives.
6. Use the fixed evaluation clock for all date-dependent cases. Keep test-only clock control in the test harness, not the production Ask API.
7. Keep evaluation assertions independent of implementation details where possible.
8. Do not weaken an existing assertion merely to make a new case pass.

Keep the evaluation deterministic, local and dependency-free.

## 7. Next evaluation work

The next steps, in order:

1. [x] Make date-dependent evaluation cases use a fixed, controlled clock.
2. Establish a structured case format with expected answer behaviour and expected sources.
3. Add an evaluation summary that reports the metrics above.
4. Audit source precision across the complete evaluation set.
5. Expand only where a genuine coverage gap is demonstrated.

Do not replace the existing regression tests with a new framework or duplicate their scenarios.

---

**Current conclusion:** Mopapa has 31 Ask evaluation regression cases running under one fixed test-harness clock. The next priority is to establish a structured case format and aggregate reporting, not to add more tests indiscriminately.
