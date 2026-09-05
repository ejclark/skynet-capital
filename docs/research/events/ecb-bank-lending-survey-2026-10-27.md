# Euro area bank lending survey (Q3 2026) — ecb-bank-lending-survey-2026-10-27

**Kind:** macro-print · **Date:** 2026-10-27 (estimate, EST: ecb.europa.eu statistical release calendar, re-fetched direct 2026-09-05 (plain curl, HTTP 200, 114,879 bytes) — the row reads verbatim "27/10/2026 10:00 CET · Euro area Bank Lending Survey (Dataset: BLS) · Reference period: Q3 2026 / Q4 2026 · Includes press release". Independently derived a second way this session: 14 of 14 realized BLS releases since Q1 2023 published exactly one calendar day before Day 1 of the Governing Council monetary-policy meeting, and Day 1 is 28/10/2026. Stays estimate on the lane's no-self-confirm limit and because CONFIRMED_PREFIX has no slot for a non-Fed central bank) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["consumer-confidence-2026-10-27","durable-goods-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29","treasury-2y-note-2026-10-26","treasury-5y-tips-2026-10-22"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The date is right and better-derived than it was filed; the reason it was filed is
wrong.** This entry exists because its parent ledger called the BLS "the **one** euro-area policy
input that publishes INSIDE the ECB quiet period," landing "with no official permitted to interpret
it." Three findings, all from ECB primaries or from the tape, dismantle that. First, **it is not
one — it is one of eight.** The ECB's own statistical calendar puts eight releases inside the
2026-10-21 → 10-27 quiet window, and **three of them at 10:00 CET on 10-27 itself** (the BLS, the
MFI national balance sheet, and euro-area monetary developments / M3 — the last proposed to the
calendar in this PR). The gate stops speech, not publication, for the *whole* statistical calendar.
Second, **the quiet period silences no one who would otherwise have spoken.** The BLS has never
carried an official interpreter in any quarter: the October 2025 release is a data release with a
media-contact name and no quote, no named official, no press conference. And the interpretation is
not absent, it is **two days late** — Lagarde cited the bank lending survey by name at the
2025-10-30 press conference, two days after the 2025-10-28 release. Third, **the tape says
nothing.** Across **14 releases** the euro bank-equity ETF `EXV1.DE` — the instrument most exposed
to a *bank lending* survey — ran **0.94×** an ordinary day, and **0.98×** its own quiet-window
neighbours; Euro Stoxx 50 **1.04× / 0.98×**; EUR/USD **0.74×**. Date is **estimate**; it widens
caution and licenses nothing, and `symbols: []` means nothing here is ours to hold.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a statistical release, not a catalyst | High | D-52, `symbols: []`, no rates-keyed house playbook, and 14 prior releases measure **0.94×** an ordinary day on the one instrument that should feel it | The **2026-10-27** session moving `EXV1.DE` **≥ 1.90%** (2× its measured 0.95% baseline) — registered as **FT-ecb-bank-lending-survey-2026-10-27-1** |
| This week | **Stop calling this "the one input inside the quiet period"** | High | The ECB statistical calendar lists **eight** releases inside 10-21 → 10-27 and **three at the same 10:00 CET slot on 10-27** | The ECB moving M3 (`BSI`, Sep-2026) or the MFI national balance sheet off **27/10/2026 10:00 CET** on its own calendar, leaving the BLS alone in the slot |
| This month | **Diarise 05:00 ET as a three-release slot, not a BLS slot** | Medium | Whatever the tape does at 10:00 CET on 10-27 is **unattributable** — the soft survey and the hard September loan counts publish the same minute | Only one of the three 27/10 10:00 CET entries surviving to release day on the ECB calendar — attribution becomes possible again |
| This quarter | **Expect the ECB to interpret it on 10-29, not to leave it uninterpreted** | Medium | The presser is the standing venue; Lagarde cited the BLS by name two days after the Oct-2025 release | Neither the **2026-10-29** monetary policy statement nor its Q&A mentioning the bank lending survey — registered as **FT-ecb-bank-lending-survey-2026-10-27-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-10-27. Measured at **0.94×** an ordinary day and **0.98×** its own quiet-window control, this release is not a volatility event.
- **The identification problem, stated once** — M3 (Sep-2026) and the MFI national balance sheet publish at the **same 10:00 CET minute**. No 10-27 euro move can be attributed to the BLS.
- **The staleness that explains the null** — the Oct-2025 round was conducted **19 Sep → 7 Oct** and published 10-28: the reference quarter was already over and the freshest response ~3 weeks old.
- **The date to actually diarise is 10-29, not 10-27** — the ECB decision + press conference, where the survey gets read aloud, stacked with US GDP-advance and PCE.
- **What would make this matter (dated)** — a euro-area banking shock inside 10-21 → 10-27. Measured base rate for a 2× `EXV1.DE` session on a BLS day: **1 of 14**, and that one is the April-2025 tariff tape.
- **The precision the title papers over** — 10:00 CET = **05:00 ET** on 10-27 (the EU falls back 10-25, the US not until 11-01), so it prints before the US cash open and before durable goods at 08:30 ET.

## Initial research

### The question, plainly

This entry was filed on 2026-09-05 by
[`ecb-quiet-period-start-2026-10-21`](ecb-quiet-period-start-2026-10-21.md)'s leg 6, which had just
**refuted** that ledger's own broad asymmetry claim by measurement and kept a narrow, dated version
of it: one scheduled ECB publication lands inside the quiet period, so "the gate stops speech, not
publication." The BLS was filed as the evidence for that surviving claim — described in
`market-events-data.ts` as "the **one** euro-area policy input that publishes INSIDE the ECB quiet
period, and the reason `ecb-quiet-period-start-2026-10-21` is more than a landmark," arriving "with
no official permitted to interpret it." So the question is: **does the date hold, is it really the
one, is anybody actually silenced, and does the release move anything?**

**One-line verdict:** the date **holds and derives twice over**, but the surviving asymmetry does
not survive contact with the ECB's own calendar — the BLS is **one of eight** releases inside the
quiet window and **one of three in its own 10:00 CET minute**, it has **never** had an official
interpreter to silence, its interpreter arrives **two days later at the presser**, and across 14
releases it measures **0.94×** an ordinary session on euro bank equities.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), plus a
measured leg run this session. ECB primaries fetched direct 2026-09-05: the statistical calendars
index (plain curl, HTTP 200, 114,879 bytes, parsed from its own text layer), the BLS release
calendar, the BLS landing page and all-releases index, the October 2025 BLS press release, the July
2026 BLS press release, and the December 2025 monetary policy statement; the October 2025 press
conference was read via search summary rather than direct fetch (recorded in the limits). Release
dates were taken from each press release's own `pr<YYMMDD>` slug and cross-checked against the
all-releases index. Price work used `scripts/research/market-data.mjs` `bars()` with the instrument
cache busted first (`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`,
2026-09-05): Yahoo split/dividend-adjusted daily bars for `EXV1.DE`, `^STOXX50E`, `^GDAXI`,
`EURUSD=X`, `^VIX` and `^GSPC`. No symbol-keyed instrument was run — `symbols: []`, no issuer, and
`earnings-cycle.mjs` / `intraday-edges.mjs` have no macro mode.

### Conviction legs, tested

1. **The date holds, and this session adds a second, independent derivation.** SUPPORTED. The
   calendar entry's source is the ECB statistical calendar, and re-fetching it today returns the row
   verbatim: **"27/10/2026 10:00 CET · Euro area Bank Lending Survey (Dataset: BLS) · Reference
   period: Q3 2026 / Q4 2026 · Includes press release."** What the entry did not have is a
   *derivation*. Pulling every realized BLS release since Q1 2023 off its own press-release slug and
   cross-checking the all-releases index gives 14 dates, and each sits **exactly one calendar day
   before Day 1** of the Governing Council monetary-policy meeting:

   | Release | BLS date | Day 1 | Gap | Release | BLS date | Day 1 | Gap |
   |---|---|---|---|---|---|---|---|
   | Q1 2023 | 2023-05-02 | 2023-05-03 | 1 | Q1 2025 | 2025-04-15 | 2025-04-16 | 1 |
   | Q2 2023 | 2023-07-25 | 2023-07-26 | 1 | Q2 2025 | 2025-07-22 | 2025-07-23 | 1 |
   | Q3 2023 | 2023-10-24 | 2023-10-25 | 1 | Q3 2025 | 2025-10-28 | 2025-10-29 | 1 |
   | Q4 2023 | 2024-01-23 | 2024-01-24 | 1 | Q4 2025 | 2026-02-03 | 2026-02-04 | 1 |
   | Q1 2024 | 2024-04-09 | 2024-04-10 | 1 | Q1 2026 | 2026-04-28 | 2026-04-29 | 1 |
   | Q2 2024 | 2024-07-16 | 2024-07-17 | 1 | Q2 2026 | 2026-07-21 | 2026-07-22 | 1 |
   | Q3 2024 | 2024-10-15 | 2024-10-16 | 1 | **Q3 2026** | **2026-10-27** | **2026-10-28** | **1** |
   | Q4 2024 | 2025-01-28 | 2025-01-29 | 1 | | | | |

   **14 of 14.** The BLS is meeting-anchored by design — it is a Governing Council input, timed to
   reach the Council the day it convenes. Two independent paths (the published calendar, and the
   rule the sample reveals) put the Q3 2026 round on **2026-10-27**, which is as well-established as
   this lane can make a date. It stays `estimate` regardless: this lane does not self-confirm an
   event it discovered in-sweep, and `CONFIRMED_PREFIX` carries no slot for a non-Fed central bank —
   the same gap `ecb-quiet-period-start-2026-10-21` and `ecb-quiet-period-start-2026-12-09` bank.

2. **"The ONE euro-area policy input inside the quiet period" is REFUTED by count — off the same
   primary the parent used.** REFUTED, and this is the leg that changes what the entry is for. The
   quiet period runs **2026-10-21 → 10-27** (the seven days before Day 1, per the binding Guiding
   Principles as established by the parent ledger). Parsing the ECB's statistical calendars index
   directly, **eight** releases land inside that window, verbatim:

   | Date/time (CET) | Release |
   |---|---|
   | 21/10 13:00 | EDP general government deficit/debt, Autumn notification (Eurostat) (`GFS`), ref 2025 |
   | 23/10 10:00 | Monthly indicators on government debt securities (`GFS`), Sep-2026 — *Tentative* |
   | 23/10 10:00 | Quarterly data on government deficit/debt (Eurostat) (`GFS`), Q2 2026 |
   | 26/10 10:00 | Annual government finance statistics, Autumn release (ESCB) (`GFS`), ref 2025 — *Tentative* |
   | 26/10 10:00 | **Survey on the access to finance of enterprises** (`SAFE`), Q3 2026 / H1 2026 · *includes press release* |
   | **27/10 10:00** | **Euro area Bank Lending Survey** (`BLS`), Q3 2026 / Q4 2026 · *includes press release* |
   | **27/10 10:00** | National balance sheet of euro area MFIs excl. the Eurosystem (`BSI`), Sep-2026 |
   | **27/10 10:00** | **Monetary developments in the euro area** (`BSI`), Sep-2026 · *includes press release* |

   Three consequences. **(a)** "The gate stops speech, not publication" is true and is a property of
   the ECB's *entire* statistical calendar, which runs straight through every quiet period — it is
   not a feature of this event and cannot be the reason it earns a slot. **(b)** The BLS is not even
   alone in its own minute: two other `BSI` releases share **27/10 10:00 CET**, one of which
   (monetary developments / M3) carries its own press release and reports the **hard September loan
   counts** — newer data than the survey covers. **(c)** Therefore **no move at 10:00 CET on 10-27
   is attributable to the BLS**, which is an identification problem, not a nuance. M3 is proposed to
   `market-events.ts` as `ecb-monetary-developments-2026-10-27` (`estimate`) in this PR; the other
   six are recorded here and deliberately **not** filed (see the limits).

3. **Nobody is silenced: the BLS has never had an official interpreter, and the one it gets arrives
   two days late.** REFUTED as filed, and the correct version is more useful. Reading the **October
   2025 BLS press release** (ECB primary, published 2025-10-28) end to end: it is a data release
   with four headline bullets, a stated conduct window and a media-contact name — **no named
   official, no attributed quote, no press conference.** That is the standing form of every BLS
   round. So the quiet period removes nothing that would otherwise exist; the entry's "no official
   permitted to interpret it" describes a counterfactual that has never obtained in any quarter,
   quiet period or not. What *does* happen is a **two-day lag**: at the **2025-10-30** press
   conference — two days after that release, the meeting the survey was timed to feed — Lagarde
   cited it by name ("Based on the bank lending survey, banks showed a more cautious attitude…").
   Checked against a control, the **2025-12-18** statement, which followed no BLS round: it cites
   the *hard* series instead ("Bank lending rates for firms… In October they stood at 3.5 per
   cent"; "Bank lending to firms grew by 2.9 per cent on a yearly basis in October") and does not
   name the survey. The honest statement of the asymmetry is therefore: **the interpreter is
   delayed by two days and arrives at the highest-attention moment of the ECB cycle**, not absent.

4. **Measured: the BLS release day is not a tape event — including on the one instrument that
   should feel it.** SUPPORTED, and it is the load-bearing leg. The parent ledger measured the
   quiet *window*; this measures the *release day itself*, and adds the euro bank-equity proxy
   (`EXV1.DE`, iShares STOXX Europe 600 Banks, Frankfurt-listed — so the 10:00 CET release lands
   mid-session and a daily close-to-close actually captures it, which a US-hours instrument would
   not). Mean close-to-close **|ret|** on the 14 release days vs an all-days baseline,
   2023-01-01 → 2026-09-04, with a like-for-like control of *other* quiet-window days:

   | Instrument | Baseline \|ret\| | BLS day | vs baseline | vs quiet-window control | 2× days: BLS vs ordinary |
   |---|---|---|---|---|---|
   | Euro bank equities (`EXV1.DE`) | 0.95% (n=918) | 0.89% (n=14) | **0.94×** | **0.98×** | **1/14** vs 96/918 (10.5%) |
   | Euro Stoxx 50 (`^STOXX50E`) | 0.71% (n=905) | 0.73% (n=14) | 1.04× | **0.98×** | 2/14 vs 106/905 (11.7%) |
   | DAX (`^GDAXI`) | 0.70% (n=920) | 0.60% (n=14) | **0.86×** | **0.82×** | 1/14 vs 109/920 (11.8%) |
   | EUR/USD (`EURUSD=X`) | 0.33% (n=941) | 0.24% (n=14) | **0.74×** | **0.74×** | 1/14 vs 114/941 (12.1%) |
   | VIX (`^VIX`) | 5.31% (n=908) | 4.63% (n=14) | **0.87×** | **0.87×** | **0/14** vs 114/908 (12.6%) |
   | S&P 500 (`^GSPC`) | 0.66% (n=907) | 0.54% (n=14) | **0.83×** | **0.65×** | **0/14** vs 114/907 (12.6%) |

   The **quiet-window control column is the sharp one**: measured against its own neighbours inside
   the same seven-day window, the release day adds **nothing** on either euro equity instrument
   (0.98× / 0.98×) and is *quieter* everywhere else. The largest release-day session in the sample
   is `EXV1.DE` **+3.08% on 2025-04-15**, which sits inside the April-2025 tariff tape the parent
   ledger already attributes (`^GSPC` +9.52% on 2025-04-09 is in the same fortnight) — the one 2×
   observation has a story, and it is not the BLS. Second largest is `^STOXX50E` **−1.87% on
   2024-10-15**, recorded **unattributed**: no cause was sourced this session.

5. **The structural reason for the null: the BLS is old news by construction, and there is no
   consensus to surprise.** SUPPORTED, with one honest qualifier. The October 2025 round was
   **conducted 19 September → 7 October** and published **28 October** (ECB primary): the reference
   quarter had ended four weeks earlier and the freshest bank response was ~3 weeks old at release.
   The Q3 2026 round will follow the same shape. Meanwhile the **hard** version of the same story —
   MFI loan growth to firms and households — has already published monthly throughout the quarter
   in the `BSI` releases, and again at the same minute on 10-27. On the expectations side, no
   published numeric consensus for the BLS was located: sell-side coverage (ING, Capital
   Economics) is **reaction-side**, published after each release, not a pre-release poll. The
   qualifier, recorded because it cuts against the clean version of this leg: one such note
   describes the **Q1 2026** round as banks tightening "more aggressively than **expected**", so an
   informal expectation clearly exists even without a poll. That round is the best available test of
   a "surprising" BLS — and on **2026-04-28** `EXV1.DE` returned **+0.86%**, *below* its own 0.95%
   baseline, with `^STOXX50E` at −0.41%. A release described by analysts as a surprise produced an
   ordinary session.

6. **`kind: "macro-print"` is a loose fit, and `impact: "low"` is correct.** MIXED on the label,
   SUPPORTED on the tier. This calendar's `macro-print` entries (CPI, PCE, GDP, durable goods) share
   a shape the BLS does not have: a scheduled numeric series, a published consensus, and a surprise
   axis. The BLS has a fixed time and a press release and nothing else from that list — it is a
   qualitative net-percentage survey about a quarter that has already closed. The label is not worth
   changing (no `survey` kind exists, and inventing one to hold a single measured null would be
   worse than the loose fit), but a reader should not infer print-like behaviour from it. `low` is
   right and, on leg 4's numbers, generous.

7. **No price channel to this book, and 10-27 belongs to the US calendar anyway.** SUPPORTED.
   `symbols: []`; the house playbooks (S1/S2/E1/S3/S4 + G1,
   [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed, none
   rates-keyed, and this book's exposure to euro policy is second-order via dollar translation and
   global term premium, both owned by the FOMC entries. Leg 4 puts `^GSPC` at **0.83×** and `^VIX`
   at **0.87×** on BLS days — the US side is a null on its own terms. And the corridor makes the
   ordering plain: on **10-27** the BLS prints **05:00 ET**, then durable goods **08:30 ET**
   ([`durable-goods-2026-10-27`](durable-goods-2026-10-27.md)) and Conference Board consumer
   confidence **10:00 ET**, on **FOMC Day 1**; then FOMC **10-28**; then the ECB decision, GDP-advance
   and PCE all on **10-29**. Within a 72-hour window carrying at least eight tracked events, this
   is the first and by a wide margin the smallest.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2026-10-27. Three rules and one diary line:

- **This is a statistical release, not a catalyst.** Leg 4 is the whole argument: **0.94×** an
  ordinary day on euro bank equities, **0.98×** its own quiet-window neighbours, **0 of 14** at 2×
  on the VIX and the S&P.
- **Fix the language in the calendar entry.** It is not "the one" input inside the quiet period —
  it is one of eight, and one of three in its own minute (amended in this PR).
- **Treat 10:00 CET / 05:00 ET on 10-27 as unattributable.** The soft survey and the hard September
  loan counts publish simultaneously; anyone reading a euro move off "the BLS" that morning is
  guessing between three releases.
- **The check the next pulse runs.** Confirm the three 27/10 10:00 CET entries still stand on the
  ECB statistical calendar, and that Day 1 is still 28/10. That single fetch re-derives the date
  both ways; nothing else about this event needs re-doing before the release.

### Honest limits

The measurement is **daily close-to-close** and cannot see an intraday reaction that fires and fades
inside a session — the same limit the parent ledger records, and the same channel Gnan & Rieder's
quiet-period work says matters; leg 4 is a claim about *daily* significance only. **n is 14 and no
significance test is run** against a ~918-day baseline, so the honest statement is that the BLS-day
mean sits at or below the ordinary distribution, not that a difference has been excluded. The
quiet-window control (n≈54) is itself a small sample drawn from the same 14 meetings, so it is not
independent of the treatment. **The joint-release confound is verified only for 2026-10-27**: the
three-releases-in-one-minute collision was read off the primary for that date, and I did **not**
check per-date collisions across the 14-release history — the BLS is meeting-anchored while M3 is
reference-month-anchored, so they coincide only when Day 1 falls near the 28th, and leg 4 must not
be read as a measurement of joint-release days. `EXV1.DE` is an ETF tracking STOXX Europe 600 Banks,
so it is **Europe-wide rather than euro-area**, includes UK and Swiss constituents, and its Yahoo
series is adjusted; `^STOXX50E` and `^GDAXI` are index series unadjusted for dividends by
construction. The **2024-10-15 `^STOXX50E` −1.87%** session is recorded with **no attribution
established here**. Leg 3's press-conference evidence is **one quotation** from the 2025-10-30
presser, read via a search summary rather than a direct fetch of the transcript, against **one**
control statement (2025-12-18) — it establishes that the ECB does cite the BLS at the presser, not
how reliably. Leg 5's "no published consensus" is a **negative finding from a search**, which is
weaker than a primary, and it is explicitly qualified by the "more aggressively than expected"
phrasing in the ING/Capital Economics reaction coverage. Day-1 dates for 2023–2024 in leg 1 come
from the ECB's published meeting calendars rather than being re-fetched from the accounts indexes
this session (2025–2026 Day-1 dates are the ones the parent ledger established from those indexes).
**Six of the eight in-window releases in leg 2 are not proposed to the calendar** — two are marked
*Tentative* by the ECB itself, four are government-finance statistics with no plausible channel to
this book, and filing them would spend six sibling research sessions to re-establish the null this
ledger establishes once; only M3 is filed, because it alone changes how a 10-27 move must be read.
Finally, the date stays **estimate** despite deriving twice, per this lane's no-self-confirm limit
and the `CONFIRMED_PREFIX` gap — it widens caution and licenses nothing.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside — and correct the reason this entry exists.** The
2026-10-27 date holds on the ECB's own statistical calendar and derives independently from a 14-of-14
rule (the BLS publishes one day before Day 1 of every Governing Council monetary-policy meeting),
which is as well-established as this lane can make a date without self-confirming. Beyond the date,
this ledger's contribution is corrective, against the framing it was filed under. First, **it is not
"the one" input inside the quiet period**: the ECB statistical calendar puts **eight** releases
inside 10-21 → 10-27 and **three at 10:00 CET on 10-27 itself**, so "the gate stops speech, not
publication" describes the whole statistical calendar and cannot be this event's reason to exist —
and the collision makes any 10-27 euro move **unattributable**. Second, **nobody is silenced**: the
BLS has never carried a named official, a quote or a press conference in any quarter, and its
interpreter is not absent but **two days late** — Lagarde cited it by name at the 2025-10-30 presser.
Third, **the tape refuses the premise**: across 14 releases, euro bank equities ran **0.94×** an
ordinary day and **0.98×** their own quiet-window neighbours, with the sample's only 2× session
belonging to the April-2025 tariff tape. The one durable output is a scheduling correction:
**10:00 CET on 2026-10-27 is a three-release slot, not a BLS slot.** `symbols: []`, no position, no
play. Estimates widen caution and license nothing.

**Kill switches:**

- **Null kill (registered):** the **2026-10-27** session producing an `EXV1.DE` close-to-close move
  **≥ 1.90%** (2× the measured 0.95% baseline). Leg 4's measurement would have missed a regime —
  though per the joint-release finding in leg 2, a fail could not be attributed to the BLS anyway.
  Registered as **FT-ecb-bank-lending-survey-2026-10-27-1**, score by **2026-10-28**.
- **Interpreter kill (registered):** neither the **2026-10-29** ECB monetary policy statement nor
  its press-conference Q&A mentioning the bank lending survey. Leg 3's "delayed by two days, not
  absent" reading would be wrong and the entry's original "no permitted interpreter" framing would
  be right after all. Registered as **FT-ecb-bank-lending-survey-2026-10-27-2**, score by
  **2026-10-30**.
- **Date kill:** the ECB moving the Q3 2026 BLS off **27/10/2026** on its own statistical calendar,
  or moving the 28–29 October Governing Council meeting. Leg 1's two derivations move together, so
  either one moving is the tell. Re-check every pulse.
- **Collision kill (the one that would restore the entry's original framing):** the ECB moving M3
  (`BSI`, Sep-2026) or the MFI national balance sheet off **27/10/2026 10:00 CET**, leaving the BLS
  alone in its slot. Leg 2's identification problem dissolves and attribution becomes possible.
  Re-check at the pulse after 2026-10-05.
- **Staleness kill:** the ECB publishing a Q3 2026 round whose conduct window closes **after
  2026-10-14** (i.e. under two weeks before release). Leg 5's "old news by construction" explanation
  for the null weakens. Score by **2026-10-28** on the release's own stated conduct window.
- **Channel kill:** any tracked name (NVDA/AVGO/MRVL/CRWV/AAPL/AMZN) moving **>2%** on 2026-10-27
  in a way the tape attributes to the euro-area bank lending survey. Leg 7's null would be false on
  its own date. Score by **2026-10-28**.

Two forward tests registered in [`forward-tests.md`](../forward-tests.md) —
**FT-ecb-bank-lending-survey-2026-10-27-1** (the daily-tape null, whose asymmetry is stated at
registration: 13 of 14 prior releases would have passed, so a pass is weak and only a fail informs,
and even a fail is unattributable per leg 2) and **FT-ecb-bank-lending-survey-2026-10-27-2** (the
interpreter test, scored on an ECB primary rather than on price, and genuinely uncertain). No
market-shaped test is registered because the stance takes no position and this book has no
instrument that would price one.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-52 | Initial research banked (above). **Date SUPPORTED twice.** ECB statistical calendar re-fetched direct (plain curl, HTTP 200, 114,879 bytes) still reads verbatim **"27/10/2026 10:00 CET · Euro area Bank Lending Survey (Dataset: BLS) · Reference period: Q3 2026 / Q4 2026 · Includes press release"**; independently, **14 of 14** realized BLS releases since Q1 2023 (each date off its own `pr<YYMMDD>` slug, cross-checked on the all-releases index) published **exactly one day before Day 1** of the Governing Council meeting — Day 1 is 28/10/2026. Stays `estimate` (no self-confirm; no non-Fed `CONFIRMED_PREFIX`). **Correction 1 — "the ONE input inside the quiet period" is REFUTED by count**, off the same primary: **eight** releases land inside 10-21 → 10-27, and **three share 10:00 CET on 10-27** (BLS; MFI national balance sheet `BSI`; monetary developments / M3 `BSI`, which carries its own press release and the **hard Sep-2026 loan counts**). SAFE publishes 26/10 10:00 CET. So "the gate stops speech, not publication" is a property of the whole ECB statistical calendar, and **no 10-27 euro move is attributable to the BLS**. **Correction 2 — nobody is silenced:** the Oct-2025 BLS release is a data release with a media contact and **no named official, no quote, no press conference** — the standing form every quarter — so the quiet period removes nothing; the interpreter is **two days late**, with Lagarde citing the survey by name at the **2025-10-30** presser (control: the 2025-12-18 statement, following no BLS round, cites the hard series instead). **Correction 3 — the tape refuses the premise.** Across the **14 releases**, mean close-to-close \|ret\| vs an all-days baseline (2023-01-01 → 2026-09-04, Yahoo adjusted, cache busted): `EXV1.DE` euro bank equities **0.89% vs 0.95% (0.94×)**, `^STOXX50E` **0.73% vs 0.71% (1.04×)**, `^GDAXI` **0.86×**, `EURUSD=X` **0.74×**, `^VIX` **0.87×**, `^GSPC` **0.83×**. Against the like-for-like **quiet-window control**, the release adds nothing: **0.98× / 0.98×** on both euro equity instruments. 2× sessions: `EXV1.DE` **1/14** vs 10.5% of ordinary days, `^VIX` and `^GSPC` **0/14**. The one 2× observation (`EXV1.DE` +3.08%, 2025-04-15) is the April-2025 tariff tape; `^STOXX50E` −1.87% on 2024-10-15 is recorded **unattributed**. **Why it is null:** the Oct-2025 round was conducted **19 Sep → 7 Oct** for a 10-28 release — the reference quarter closed four weeks before publication — and no numeric consensus is published (sell-side coverage is reaction-side). Counterweight kept: ING/Capital Economics called Q1 2026 a tightening "more aggressively than **expected**", and that release day ran `EXV1.DE` **+0.86%**, *below* baseline. Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — 10-27 is FOMC Day 1 and stacks BLS 05:00 ET, durable goods 08:30 ET, consumer confidence 10:00 ET; then FOMC 10-28; then ECB decision + GDP-advance + PCE all 10-29. **Volatility** — VIX **14.53** (09-04 close, own `^VIX` bars, cache busted), unchanged from the sibling ECB ledgers. **Geopolitical** — energy shock is the euro credit cycle's driver and is owned by the decision ledgers; no channel here. **Event tape** — no pre-release consensus poll located for this series at all. **One dated adjacency proposed to `market-events.ts` as `estimate`:** **`ecb-monetary-developments-2026-10-27`** (M3, same minute, hard data — it is what makes 10-27 unattributable). The other six in-window releases are **deliberately not filed**: two are ECB-marked *Tentative*, four are government-finance statistics with no channel, and filing them would spend six sibling sessions re-establishing a null this row establishes once. **Cross-ledger:** [`ecb-quiet-period-start-2026-10-21`](ecb-quiet-period-start-2026-10-21.md) leg 6 is the parent claim corrected here; its own measured refutation of the broad asymmetry stands and is strengthened. | — (stance set: stand aside, no position, no play; three corrections to the filed framing — one of eight not one, nobody silenced with the interpreter two days late, and the release day measured at 0.94× / 0.98×) | 2026-10-05 (low band, 15+d: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
