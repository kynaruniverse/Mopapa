Mopapa Ask: 50-Note Evaluation Benchmark

Purpose: Measure real-world-style retrieval, answer extraction, source grounding, date handling and appropriate abstention.

Dataset: 50 fictional saved memories, 50 questions.

Reference date: 17 November 2026, 12:00 UTC, matching the existing Ask evaluation clock.

Important: All names, contact details, passwords, dates and events in this dataset are fictional. They are test fixtures, not real personal information.

1. Evaluation rules

A question passes only when:

1. The answer is factually correct.
2. The returned source entries actually support the answer.
3. Mopapa does not invent missing information.
4. Historical information is not presented as current.
5. Ambiguous information is clarified rather than guessed.
6. Unanswerable questions receive an appropriate abstention.
7. Extracted values are not added to Ask learning or the unanswered-question list.

A correct answer with an incorrect source is a failure.

2. The 50 saved memories

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

3. The 50 evaluation questions

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
17| When did I last mention the boiler problem?| Answer| M38
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
33| Who is the parcel for?| Answer| M23
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

4. Important test distinctions

Location recall

Question 26 must return the last recorded location, not claim to know where the card is now.

Date and appointment recall

Questions 11, 19, 27, 30, 37 and 42 test different date behaviours. A previous appointment must not override a future one. Rescheduled dates must not be confused with original dates.

Multi-source answers

Questions 3 and 30 require more than one source. Returning only one relevant entry is incomplete.

Answer extraction

Questions 7, 8, 9, 13, 28, 29, 31, 35 and 41 require extracting a particular value or relationship from a saved note.

Abstention

Questions 20–25 and 50 have no supporting answer. Question 20 is particularly important: related proposals exist, but no saved memory establishes a final garden decision. Any claim that one proposal was chosen is a failure.

Distractors

M35, M36, M43 and M50 are deliberate distractors. They contain related names or vocabulary but must not be returned as supporting evidence for unrelated questions.

5. Benchmark acceptance criteria

Before retrieval improvements begin:

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

Important: This benchmark is a controlled diagnostic set, not a statistically representative estimate of all user behaviour. Report its results as performance on this 50-question evaluation set, not as universal Ask accuracy.