# ECB quiet period begins (through the 2026-10-29 decision) — ecb-quiet-period-start-2026-10-21

**Kind:** macro-print · **Date:** 2026-10-21 (estimate, EST: ecb.europa.eu "Guiding principles for external communication for high-level officials of the ECB" — the binding text, fetched direct 2026-09-05: the quiet period covers "the seven days prior to each **scheduled monetary policy meeting** of the Governing Council". The ECB's meeting calendar (press/calendars/mgcgc, re-fetched 2026-09-05) puts Day 1 at 28/10/2026, so the seven days before it are 2026-10-21 → 10-27. Stays estimate: the ECB publishes no dated quiet-period calendar, this lane never self-confirms, and CONFIRMED_PREFIX carries no slot for a non-Fed central bank) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["fomc-blackout-start-2026-10-17","import-export-prices-2026-10-16","opex-2026-10-16","treasury-primary-dealer-agenda-2026-10-16"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The date is right, and almost everything the calendar entry assumed about it is
wrong.** Three findings, all from primaries or from the tape. First, **this gate is topic-scoped,
not a silence** — the binding Guiding Principles say officials "will not meet with nor talk to the
media, market participants or other outside interests **on monetary policy matters**", and the
ECB's own weekly speaking calendar shows Chief Economist Philip Lane giving a keynote on
**2026-09-04**, day three of the quiet period that is running *right now* (09-02 → 09-08). Calling
this the ECB analogue of a Fed blackout overstates it. Second, **the quiet window is measurably a
quieter tape, not a riskier one** — across the **13 scheduled meetings since 2025** the seven days
before Day 1 ran **0.97× / 0.99×** an ordinary day for the Euro Stoxx 50 and DAX, **0.69× / 0.68×**
once the two largest windows are trimmed, with **0 of 54** trimmed Euro Stoxx 50 sessions reaching
2× baseline against **10.9%** of ordinary days. That **refutes** the entry's one asserted asymmetry
("removes the offset → edge risk"). Third, **the narrow version of that asymmetry does survive, and
it has a date**: the euro-area **Bank Lending Survey publishes 27/10/2026 10:00 CET** (ECB
statistical calendar, fetched today) — the last day of the quiet period, one day before the
meeting, with no official permitted to interpret it. Proposed to the calendar in this PR. Date is
**estimate**; it widens caution and licenses nothing, and `symbols: []` means nothing here is ours
to hold.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — this is a landmark, not a catalyst | High | D-46, `symbols: []`, no rates-keyed house playbook, and the window it opens is measured **below** an ordinary day in both euro benchmarks | The **2026-09-08** close (the last day of the live 09-02 → 09-08 quiet period) ending a window whose mean daily \|move\| on `^STOXX50E` exceeded **1.50%** — the measured null would have broken on the very next observation |
| This week | **Do not describe 10-21 → 10-29 as "the ECB goes silent"** | High | The gate binds *monetary-policy* comment only; the ECB's weekly calendar already shows a Governing Council member speaking publicly inside the live quiet period on **2026-09-04** | The ECB publishing a quiet-period rule, or a dated quiet-period calendar, that bars public appearances outright rather than monetary-policy comment — the topic-scope reading would be wrong |
| This month | **Diarise 2026-10-27 10:00 CET, not 2026-10-21** | Medium | The Bank Lending Survey (`estimate`, proposed in this PR) lands *inside* the gate on its last day; that, not the gate's start, is the one scheduled euro-area input that arrives unattended | The ECB moving the Bank Lending Survey off **27/10/2026** on its own statistical calendar, or publishing it outside the 10-21 → 10-27 window |
| This quarter | **Expect at least one Governing Council appearance inside 10-21 → 10-27** | Medium | Topic-scoped gate + a literature base rate: breaches "happen regularly" and the ECB's own rule anticipates them ("notify … if they inadvertently do so") | The ECB's weekly speaking calendars covering **2026-10-21 → 10-27** listing **no** Governing Council or Executive Board public engagement at all — registered as **FT-ecb-quiet-period-start-2026-10-21-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-10-21. Measured at **0.69×** an ordinary day, this window is the opposite of a volatility event.
- **The instrument that adjudicates all of this** — the ECB's own weekly schedule of public speaking engagements (`press/calendars/weekly`), published ~one week ahead. The 10-21 window becomes checkable around **2026-10-16**; that is the next pulse's one job.
- **The date to actually diarise** — euro-area **Bank Lending Survey, 27/10/2026 10:00 CET** (= **05:00 ET**; the EU falls back 10-25, the US not until 11-01). A Governing Council input, published inside the gate, with no permitted interpreter.
- **The precision the title papers over** — the seven-day rule's letter covers **10-21 → 10-27**. Silence on **10-28 / 10-29** comes from the meeting itself, not from this clause.
- **The two-gate fact, stated without being traded** — `fomc-blackout-start-2026-10-17` runs 10-17 → 10-29, so **10-21 → 10-29** is the only stretch of Q4 with both gates down for more than two days (the December pair overlaps only 12-09 → 12-10). The last day either central bank may speak freely is **2026-10-20**.
- **What would make this matter (dated)** — a euro-area shock landing 10-21 → 10-27. Measured base rate for a 2× Euro Stoxx 50 session inside a quiet window, trimmed: **0 of 54**.

## Initial research

### The question, plainly

This entry was filed on 2026-09-05 by [`ecb-account-2026-10-08`](ecb-account-2026-10-08.md)'s leg 5,
which needed a date for "when does live Governing Council speech stop before the 10-29 decision."
It arrived with three inherited assumptions: that it is **the ECB analogue of the
`fomc-blackout-start-*` entries**, that the seven days count from **Day 1** (the explainer does not
say), and that its "one asymmetry worth a line" is that **a quiet period removes the offset, so a
euro-area surprise landing inside meets no official interpretation.** None of the three was tested.
So the question is: **is this actually a Fed-style blackout, does the date derive, and is the
asymmetry real?**

**One-line verdict:** the date **derives** — and better than the entry claims, off the binding text
rather than the explainer — but the blackout analogy is **wrong** (the gate is topic-scoped, and a
Governing Council member is scheduled to speak inside the quiet period that is live today), and the
asymmetry as written is **refuted by measurement** (the quiet window is a *quieter* tape than an
ordinary day, with a thinner tail). What survives is a narrower, dated version of the asymmetry:
one scheduled ECB publication, the **Bank Lending Survey on 27/10/2026**, lands inside the gate.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), plus a
measured leg run this session. ECB primaries fetched direct 2026-09-05: the Guiding Principles for
external communication, the quiet-period explainer, the Governing Council meeting calendar, the 2025
and 2026 accounts indexes (for meeting dates), the weekly schedule of public speaking engagements,
the monetary-policy-decisions index, and the Bank Lending Survey release calendar. Price work used
`scripts/research/market-data.mjs` `bars()` with the instrument cache busted first (`rm -rf
node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`, 2026-09-05): Yahoo
split/dividend-adjusted daily bars for `^STOXX50E`, `^GDAXI`, `EURUSD=X`, `^GSPC` and `^VIX`. No
symbol-keyed instrument was run — `symbols: []`, no issuer, and `earnings-cycle.mjs` /
`intraday-edges.mjs` have no macro mode. One academic result is cited by abstract, not read in full.

### Conviction legs, tested

1. **The date derives, and the explainer's ambiguity is closed by the binding text.** SUPPORTED,
   and it upgrades the source. The calendar entry filed this `estimate` partly because "the
   explainer does not state whether the seven days count from Day 1 or the decision day." The
   **Guiding principles for external communication for high-level officials of the ECB** — the
   document the explainer is a summary *of* — states it: the quiet period covers speeches and
   public remarks "given in the **seven days prior to each scheduled monetary policy meeting of the
   Governing Council**." The unit is the *meeting*, not the decision, and the ECB's own calendar
   (re-fetched today) marks **28/10/2026** as "monetary policy meeting in Frankfurt (Day 1)". Seven
   days prior to 10-28 is **10-21 → 10-27**. Two precisions follow. The rule's letter does **not**
   cover 10-28 and 10-29 themselves — silence on those days comes from the meeting being in
   session, not from this clause — so the entry's title ("through the 2026-10-29 decision") is right
   in effect and loose in derivation. And the rule binds only **scheduled** meetings, which is why
   the ad-hoc **25 June 2025** meeting in the ECB's accounts index is excluded from leg 3's sample.
   The date stays `estimate` regardless: this lane does not self-confirm, and CONFIRMED_PREFIX has
   no non-Fed slot.

2. **It is not a Fed-style blackout — the gate is topic-scoped, and someone is speaking inside the
   live one today.** SUPPORTED, primary, and this is the finding that most changes how the entry
   should be read. The Guiding Principles bind members to "not meet with nor talk to the media,
   market participants or other outside interests **on monetary policy matters** during that
   period," and the same document elsewhere treats general and academic speaking engagements as
   unaffected. The observable proof is live: the quiet period for the **09-09/10** meeting runs
   **2026-09-02 → 09-08**, and the ECB's own weekly schedule of public speaking engagements (fetched
   today, covering 09-04 → 09-13) lists **Philip R. Lane, keynote on "Diversity in the European
   Central Bank", Irish Society for Women in Economics, Dublin, 2026-09-04 11:10 CET** — the Chief
   Economist, in public, on day three of a quiet period, on a permitted topic. The rule itself
   anticipates leakage in the other direction too, instructing members to "immediately notify both
   the communications and compliance functions … if they inadvertently do so." **"The ECB goes
   silent 10-21 → 10-29" is the wrong mental model**; the correct one is "monetary-policy comment
   is off the record while the diary keeps running."

3. **Measured: the quiet window is an ordinary-to-*quieter* tape, and its tail is thinner.**
   SUPPORTED, and it is the load-bearing leg. Day-1 dates for every **scheduled** monetary-policy
   meeting come verbatim from the ECB's 2025 and 2026 accounts indexes (fetched today): 2024-12-11,
   2025-01-29, 03-05, 04-16, 06-03, 07-23, 09-10, 10-29, 12-17, and 2026-02-04, 03-18, 04-29, 06-10,
   07-22. Defining the quiet window as the seven calendar days before each Day 1 and measuring
   close-to-close mean **|ret|** against the all-days baseline over 2025-01-01 → 2026-09-04:

   | Instrument | Baseline \|ret\| | Quiet window | Ratio | Trimmed (drop 2 largest windows) | 2× days: quiet vs ordinary |
   |---|---|---|---|---|---|
   | Euro Stoxx 50 (`^STOXX50E`) | 0.75% (n=417) | 0.73% (n=64) | **0.97×** | **0.69×** (0.52%, n=54) | **0/54** vs 37/340 (10.9%) |
   | DAX (`^GDAXI`) | 0.81% (n=424) | 0.80% (n=65) | **0.99×** | **0.68×** (0.55%, n=55) | 1/55 vs 38/346 (11.0%) |
   | EUR/USD (`EURUSD=X`) | 0.33% (n=433) | 0.38% (n=64) | 1.16× | **0.99×** (0.33%, n=54) | 7/54 vs 44/357 (12.3%) |
   | S&P 500 (`^GSPC`) | 0.70% (n=419) | 0.83% (n=65) | 1.18× | **0.83×** (0.58%, n=55) | 4/55 vs 43/341 (12.6%) |
   | VIX (`^VIX`) | 5.85% (n=420) | 6.32% (n=65) | 1.08× | **0.89×** (5.22%, n=55) | 7/55 vs 43/342 (12.6%) |

   The window-level view is cleaner still: the **median** of the 13 window ratios is **0.69×**
   (Euro Stoxx 50) / 0.79× (DAX) / 0.89× (EUR/USD), and **9 of 13** / 10 of 13 / 7 of 13 windows came
   in below baseline. This is the direct test of the entry's asserted asymmetry, and the asymmetry
   **fails**: if removing the official offset created edge risk, the quiet window would show a fatter
   tail. It shows a **thinner** one — zero 2× sessions in 54 trimmed Euro Stoxx 50 observations.

4. **The two windows that *were* big were shocks, and one of them is already in this repo's
   ledgers.** SUPPORTED, and it is why the trim in leg 3 is honest rather than convenient. The
   trimmed cut drops the two largest windows **mechanically** (by size, not by story), and both sit
   in 2025 Q1–Q2. The larger — Day 1 **2025-04-16**, window 04-09 → 04-15, **3.15×** baseline with a
   4.26% max Euro Stoxx 50 session — is the tape after the **2025-04-02** US reciprocal-tariff
   announcement, the same shock [`ecb-account-2026-10-08`](ecb-account-2026-10-08.md) leg 2 already
   attributes (SPX −4.84%, VIX +39.6% → 30.02 on 2025-04-03); `^GSPC`'s single largest quiet-window
   session in the whole sample is **9.52% on 2025-04-09**, which is a US tariff-pause session and has
   nothing to do with the ECB. The second — Day 1 **2025-03-05**, window 02-26 → 03-04, **1.81×**,
   max 2.77% — is **not attributed here**; it is recorded as the sample's second-largest window with
   no story attached, because none was sourced. The correct reading of both: **the quiet period
   neither manufactures volatility nor suppresses it.** When something real lands inside, the window
   is enormous; absent that, it is quieter than an ordinary day. That is a statement about shocks,
   not about silence.

5. **The literature says the opposite thing at a resolution this measurement cannot see — and both
   are true.** MIXED, deliberately. Gnan & Rieder, *"The (not so) quiet period: Communication by ECB
   decision-makers during monetary policy blackout days"* (Journal of International Money and
   Finance 130, 102744; CEPR DP15735), using **confidential data over 2008–2021**, find that
   "breaches of blackout rules happen regularly," that their frequency is "heterogeneous across ECB
   Governing Council members," and that breaches "trigger high-frequency market reactions that are
   **up to twice as large as the median market reaction to speeches in inter-meeting periods**."
   Read against leg 3 this is not a contradiction, it is a resolution mismatch, and the synthesis is
   the useful part: **at daily resolution the quiet window is a non-event; conditional on a breach,
   at intraday resolution it is the most informative speech of the cycle.** Leg 3 measures daily
   closes and therefore cannot see a breach that fires and fades within a session — stated here
   rather than in the limits, because it is the one channel by which this event could ever matter.
   Cited by abstract (CEPR returned HTTP 403 to direct fetch; the abstract was read on IDEAS/RePEc
   and corroborated by the WU Vienna and ScienceDirect listings), not read in full.

6. **The surviving asymmetry is narrow, dated, and worth the entry on its own: the Bank Lending
   Survey publishes inside the gate.** SUPPORTED, ECB primary, and this is the leg that pays for the
   calendar slot. The ECB's release calendar for the euro-area Bank Lending Survey
   (`press/calendars/statscal/mfm/html/stpbls`, fetched today) reads verbatim: **"27/10/2026 10:00
   CET · Euro area Bank Lending Survey (Dataset: BLS) · Reference period: Q3 2026 / Q4 2026 ·
   Includes press release."** That is the **last day of the quiet period**, the day before Day 1,
   and the BLS is a Governing Council input rather than a market curiosity. **The gate stops speech,
   not publication** — so the one scheduled euro-area policy input in this corridor arrives with no
   official permitted to comment on it, which is the entry's asserted asymmetry reduced from "any
   euro surprise" to one dated release. Clock: the EU falls back **2026-10-25** and the US not until
   **2026-11-01**, so 10:00 CET on 10-27 is **05:00 ET**, before the US open (same five-hour gap the
   [`ecb-decision-2026-10-29`](ecb-decision-2026-10-29.md) clock correction established). Proposed to
   `market-events.ts` as `ecb-bank-lending-survey-2026-10-27` (`estimate`) in this PR.

7. **The corridor: this is the only tracked event in an eight-session void, and it opens Q4's only
   real two-gate window.** SUPPORTED, from this repo's own calendar.
   [`fomc-blackout-start-2026-10-17`](fomc-blackout-start-2026-10-17.md) established that
   **10-19 → 10-26 carries no tracked event at all**; querying `market-events.ts` today, the last
   entries before the void are `import-export-prices-2026-10-16`, `opex-2026-10-16` and
   `treasury-primary-dealer-agenda-2026-10-16`, then `fomc-blackout-start-2026-10-17`, then nothing
   until `consumer-confidence-2026-10-27` and `durable-goods-2026-10-27`. **`ecb-quiet-period-start-2026-10-21`
   is now the only entry inside that void** — and the BLS proposal in leg 6 makes a second. On the
   two gates: the Fed's blackout runs **10-17 → 10-29** and this one **10-21 → 10-27/29**, so
   **10-21 → 10-29** is nine days with both central banks gated, spanning FOMC 10-28, the ECB
   decision 10-29, GDP-advance and PCE 10-29, and the MSFT/GOOG/META/AMZN/AAPL print stack. The
   December pair barely overlaps by comparison — the Fed's 11-28 → 12-10 blackout against an ECB
   quiet period of 12-09 → 12-15 (seven days before the tracked 16/12 Day 1) is **two days**. So
   **2026-10-20 is the last session in Q4 on which either bank may speak freely**, and that is this
   event's single most usable output. It is a scheduling fact, not a trade.

8. **No price channel, and now measured on the US side too.** SUPPORTED. `symbols: []`; the house
   playbooks (S1/S2/E1/S3/S4 + G1, [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are
   equity- and earnings-keyed, none rates-keyed, and the dollar-translation and term-premium channels
   are owned by the FOMC entries. Leg 3 adds the substantiation the parent ledger could not: on the
   trimmed cut, `^GSPC` runs **0.83×** and `^VIX` **0.89×** an ordinary day inside ECB quiet windows.
   The untrimmed 1.18× / 1.08× readings are carried by **2025-04-09**, a US tariff-pause session that
   happens to fall inside a quiet window — a coincidence of the calendar, not a channel. There is no
   reading of this table in which the ECB's speech gate reaches a US equity book.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2026-10-21. Three rules and one diary line:

- **This is a landmark, not a catalyst.** Leg 3 is the whole argument: **0.69×** an ordinary day,
  **0 of 54** trimmed sessions at 2× baseline. `low` impact is correct and generous.
- **Fix the language.** Stop calling it the ECB analogue of a Fed blackout. It gates
  *monetary-policy comment*, not appearances, and the diary keeps running — leg 2 has a dated
  example inside a live window.
- **The one date to diarise is 2026-10-27, 10:00 CET / 05:00 ET** — the Bank Lending Survey inside
  the gate. Read-only; there is nothing to trade and no instrument here that would price it.
- **The check the next pulse runs.** The ECB's weekly speaking calendar publishes ~one week ahead,
  so around **2026-10-16** the 10-21 → 10-27 window becomes observable. That single fetch scores
  leg 2 and `FT-ecb-quiet-period-start-2026-10-21-2`; nothing else about this event needs re-doing.

### Honest limits

The measurement is **daily close-to-close** and cannot see an intraday breach — which, per leg 5, is
precisely the channel the literature says matters, so leg 3 is a claim about *daily* significance
only and is not a claim that quiet-period breaches are inert. **n is small and no significance test
is run**: 13 windows, ~64 observations against a ~420-day baseline, and the trimmed cut removes 2 of
13 windows, which is a large fraction of a small sample — the honest statement is that the
quiet-window mean sits at or below the ordinary distribution, not that a difference has been
excluded. The trim is **mechanical (by window size)** rather than causal; the 2025-04 window's
attribution is sourced from this repo's own parent ledger, and the 2025-03 window's is **not
established here at all**. `^STOXX50E` and `^GDAXI` are Yahoo index series, unadjusted for dividends
by construction. Leg 5 is cited **from an abstract**, not from the paper — CEPR returned HTTP 403 to
direct fetch — so its "up to twice as large" figure is carried as the authors state it, with no
independent check of the sample or method. Leg 2's evidence is **one scheduled appearance in one
live window**, which establishes that the topic-scope carve-out is used, not how often. The Day-1
dates in leg 3 are taken from the ECB's accounts-index titles, and two entries there read oddly —
"Meeting of 3-5 June 2025" (a three-day span) and the ad-hoc "Meeting of 25 June 2025" (excluded as
unscheduled) — so one window's start may be off by a day, which cannot move a 13-window ratio
materially but is recorded rather than smoothed. Leg 7's "only two-gate window in Q4" rests on the
December ECB quiet period being *derived* from the same seven-day rule against a meeting date that
is itself `estimate` — it is arithmetic on an estimate, not a published window. The BLS clock in
leg 6 is stated on the ECB primary (10:00 CET); its ET conversion is exact arithmetic on the
published DST dates. Finally, the date stays **estimate** despite deriving off the binding text,
per this lane's no-self-confirm limit and the CONFIRMED_PREFIX gap — it widens caution and licenses
nothing.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside — and correct the entry's own framing in three
places.** The 2026-10-21 quiet-period start derives cleanly from the ECB's binding Guiding
Principles ("the seven days prior to each scheduled monetary policy meeting") applied to the 28/10
Day 1, giving **10-21 → 10-27**. Beyond the date, this ledger's contribution is corrective. First,
**it is not a Fed-style blackout**: the rule gates *monetary-policy comment*, not public
appearances, and the ECB's own weekly calendar shows the Chief Economist speaking on **2026-09-04**,
inside the quiet period running today. Second, **the entry's asserted asymmetry is refuted by
measurement**: across 13 scheduled meetings since 2025 the quiet window ran **0.97× / 0.99×** an
ordinary day for the Euro Stoxx 50 and DAX (**0.69× / 0.68×** trimmed), with **0 of 54** trimmed
Euro Stoxx 50 sessions at 2× baseline against 10.9% of ordinary days — a *thinner* tail, not a
fatter one, and the two big windows were exogenous shocks. Third, **the narrow version of that
asymmetry survives and has a date**: the euro-area **Bank Lending Survey publishes 27/10/2026 10:00
CET**, inside the gate, on the day before the meeting — the gate stops speech, not publication. The
one durable output is a scheduling fact: **2026-10-20 is the last session in Q4 on which either the
Fed or the ECB may speak freely.** `symbols: []`, no position, no play. Estimates widen caution and
license nothing.

**Kill switches:**

- **Null kill (registered):** the quiet window **2026-10-21 → 10-27** producing any `^STOXX50E`
  close-to-close move **≥ 1.50%** (2× the measured 0.75% baseline). Leg 3's measurement would have
  missed a regime — though per leg 4 the likelier reading of a fail is that a shock landed, not that
  the silence did it. Registered as **FT-ecb-quiet-period-start-2026-10-21-1**, score by
  **2026-10-28**.
- **Topic-scope kill (registered):** the ECB's weekly speaking calendars covering **2026-10-21 →
  10-27** listing **no** Governing Council or Executive Board public engagement. Leg 2's
  "topic-scoped, not silent" reading would be wrong and the Fed-blackout analogy would be right
  after all. Registered as **FT-ecb-quiet-period-start-2026-10-21-2**, score by **2026-10-28**.
- **Date kill:** the ECB moving the 28–29 October meeting, or publishing a quiet-period rule or
  dated calendar that anchors the seven days on the decision day (10-29 → start 10-22) rather than
  the meeting. Leg 1's derivation moves with it. Re-check every pulse.
- **Asymmetry kill (the one that would rebuild this doc):** the ECB moving the **Bank Lending
  Survey** off **27/10/2026** on its own statistical calendar, or publishing it outside 10-21 →
  10-27. Leg 6 is the only surviving reason this entry is more than a landmark. Re-check at the
  pulse after 2026-10-08.
- **Channel kill:** any tracked name (NVDA/AVGO/MRVL/CRWV/AAPL/AMZN) moving **>2%** on a session
  inside **2026-10-21 → 10-27** in a way the tape attributes to an ECB speaker or to the quiet
  period. Leg 8's null would be false on its own window. Score by **2026-10-28**.
- **Corridor kill:** any dated tracked event appearing inside **2026-10-19 → 10-26** other than this
  one and the proposed BLS. Leg 7's "eight-session void" framing dies and the corridor stops being
  empty — the same shape kill [`fomc-blackout-start-2026-10-17`](fomc-blackout-start-2026-10-17.md)
  already carries. Re-check every pulse.

Two forward tests registered in [`forward-tests.md`](../forward-tests.md) —
**FT-ecb-quiet-period-start-2026-10-21-1** (the daily-tape null, whose asymmetry is stated at
registration: 11 of 13 prior windows would have passed, so a pass is weak and only a fail informs)
and **FT-ecb-quiet-period-start-2026-10-21-2** (the topic-scope test, scored on an ECB primary
rather than on price, and genuinely uncertain). No market-shaped test is registered because the
stance takes no position and this book has no instrument that would price one.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-46 | Initial research banked (above). **Date SUPPORTED and its source upgraded:** the binding **Guiding principles for external communication** (ECB primary, fetched today) say the quiet period covers "the seven days prior to each **scheduled monetary policy meeting**" — the *meeting*, not the decision — so against Day 1 **28/10/2026** the window is **10-21 → 10-27**; the explainer's stated Day-1-vs-decision ambiguity is closed. Stays `estimate` (no self-confirm; no non-Fed CONFIRMED_PREFIX). **Correction 1 — not a Fed-style blackout:** the rule gates comment "**on monetary policy matters**", not appearances, and the ECB's own weekly speaking calendar (fetched today) lists **Lane, keynote, Dublin, 2026-09-04 11:10 CET** — inside the quiet period running **right now** (09-02 → 09-08). **Correction 2 — the entry's asserted asymmetry is REFUTED by measurement.** Across the **13 scheduled meetings since 2025** (Day-1 dates verbatim from the ECB's 2025/2026 accounts indexes; ad-hoc 25 Jun 2025 excluded), the seven days before Day 1 ran mean \|ret\| **0.73% vs 0.75%** baseline on `^STOXX50E` (**0.97×**, n=64), **0.80% vs 0.81%** on `^GDAXI` (**0.99×**), **0.38% vs 0.33%** EUR/USD (1.16×); trimming the two largest windows gives **0.69× / 0.68× / 0.99×** with **0 of 54** `^STOXX50E` sessions at 2× baseline vs **10.9%** of ordinary days — a **thinner** tail, and median window ratio **0.69×** with 9 of 13 windows below baseline. The two big windows are shocks: Day 1 2025-04-16 (**3.15×**) is the April-2025 tariff tape (`^GSPC` **+9.52%** on 2025-04-09 sits inside it), Day 1 2025-03-05 (**1.81×**) is recorded unattributed. US side, trimmed: `^GSPC` **0.83×**, `^VIX` **0.89×** — no channel. **Counterweight kept, not buried:** Gnan & Rieder (JIMF 130, 102744; confidential data 2008–2021) find blackout breaches happen regularly and move markets **up to 2× the median inter-meeting speech reaction** — intraday, which a daily measurement cannot see. **Correction 3 — the surviving asymmetry, dated:** ECB statistical calendar reads verbatim **"27/10/2026 10:00 CET · Euro area Bank Lending Survey · Reference period: Q3 2026 / Q4 2026 · Includes press release"** — inside the gate, day before the meeting, no permitted interpreter (10:00 CET = **05:00 ET**; EU falls back 10-25, US 11-01). Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — this entry is the **only tracked event inside the 10-19 → 10-26 void** [`fomc-blackout-start-2026-10-17`](fomc-blackout-start-2026-10-17.md) named; last entries before it are import/export prices + opex + primary-dealer agenda **10-16** and the Fed blackout **10-17**. **Two-gate fact:** Fed 10-17 → 10-29 ∩ ECB 10-21 → 10-27/29 = **nine days**, vs **two** for the December pair (Fed 11-28 → 12-10, ECB 12-09 → 12-15) — so **2026-10-20 is Q4's last free-speech session** for either bank. **Volatility** — VIX **14.53** (09-04 close, own `^VIX` bars, cache busted), unchanged from the sibling ledgers. **Geopolitical** — energy shock is the euro cycle's driver and is owned by the decision ledgers; no channel here. **Event tape** — no dated quiet-period calendar exists anywhere (itcmarkets.com, the one aggregator that describes the rule, last updated 2017 and publishes no dates); the **weekly speaking calendar** (`press/calendars/weekly`, ~1 week lead) is the instrument that adjudicates this event, checkable ~**2026-10-16**. **Cross-ledger:** [`ecb-decision-2026-10-29`](ecb-decision-2026-10-29.md) recorded the 14:15 CET decision slot as conventional and unsourced — the ECB's monetary-policy-decisions index states it verbatim ("published in a press release at **14:15 CET** on the day of the Governing Council monetary policy meeting", fetched today); the 14:45 presser slot remains conventional. **One dated adjacency proposed to `market-events.ts` as `estimate`:** **`ecb-bank-lending-survey-2026-10-27`**. The December quiet-period start (~12-09) is **deliberately not filed** — this row's own measurement says the class is a landmark, not a catalyst, and one instance is enough to date it. | — (stance set: stand aside, no position, no play; three corrections to the entry's filed framing — not a Fed-style blackout, the asserted asymmetry refuted at 0.69× with a thinner tail, and the surviving asymmetry narrowed to the 10-27 Bank Lending Survey) | 2026-10-05 (low band, 15+d: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
