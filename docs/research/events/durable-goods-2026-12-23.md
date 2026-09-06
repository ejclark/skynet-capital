# Advance Durable Goods Orders (Nov 2026 data) — durable-goods-2026-12-23

**Kind:** macro-print · **Date:** 2026-12-23 (confirmed, CENSUS: m3/release_schedule.html grid reads "November 2026 | 12/23/2026 | TBD" and economic-indicators/calendar-listview.html reads "Advance Report on Durable Goods… | December 23, 2026 | 8:30 AM | November 2026", id A202612230830, both fetched direct 2026-09-05) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["opex-2026-12-18","pce-2026-12-23"],"screenStreak":0} -->

## At a glance

**TL;DR.** **This is the edition the funding risk migrated to, and unlike its predecessor the branch is
still open.** The CR signed 2026-09-02 funds the government only through **2026-12-11**; this print lands
**12 days past that cliff**, and as of today none of the 12 FY2027 appropriations bills has cleared
Congress. What is new here is that both halves of the question are now **measured rather than argued**.
On the delay half: the Census release grid itself shows the 2025 lapse pushed this series' publication lag
from a steady-state **25 days to 57**, and the **November-reference-month edition — this print's exact
analogue — was the worst-hit at +34 days**, landing 2026-01-26; the tail took **eight reference months**
to decay. Census *delays* this series (every reference month since Aug 2025 carries a date), while the
same Census page marks two Advance-Economic-Indicators months **"Suspended"** and BEA **cancelled** the
2025 analogue of the PCE print sharing this exact 08:30 slot — three failure modes, one morning. On the
tradeability half: 2026-12-23 is the **last full session before a 13:00 Christmas Eve close**, and across
**33 years** that session's realized range runs **~35% narrower** than an ordinary session — measured, not
inferred, **on the actual release dates** (10 recovered from Census press releases; 8 land exactly on it;
range percentile **p23**, mean close-to-close **+0.03% SPY / −0.13% QQQ**). So the call is a **hard stand
aside** on a **confirmed** date: read ex-transportation, ignore the headline, and watch the funding
calendar, not the tape.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-109) | **Stand aside** | High | `symbols: []`, D-109, no November-data consensus exists or will before release week, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed. There is nothing to act on for fifteen weeks. | A published November-data street consensus appearing before **2026-12-16** — none has appeared earlier than release week anywhere in the 2025–26 sample |
| This week | **Stand aside — the only live variable is legislative, not economic** | High | Nothing about a November reference month is knowable in September. The one thing that can move this row is appropriations progress toward **2026-12-11**, and there is none to date (3 of 12 bills passed the House, 0 reported from Senate Approps). | A full-year FY2027 appropriations package, or a second CR extending past **2026-12-23**, enacted before **2026-09-30** — that closes the delay branch outright, as H.R. 6500 did for the predecessor |
| This month | **Watch the cliff, not the print** | Medium | The measured question is whether 12-23 exists, and the answer is decided in December by Congress. Census's own 2025 precedent is unambiguous on what a lapse does to *this* series: **delay, never delete**, ~28–34 days. | Census publishing a 2027 release schedule before **2026-10-31** that moves the 12-23 slot for ordinary (non-funding) reasons — that makes the `confirmed` flip premature, which is the honest boundary on that word |
| This quarter | **Never trade this session — the compression is measured on the release date itself** | High | Across 33 pre-Christmas sessions the realized range runs **~35% narrower** than ordinary (SPY p19; null control p46), and on the **10 actual release dates** it is p23 / 0.688× with a mean close-to-close of **+0.03%**. The 08:30 slot is also triple-booked with a `high`-tier PCE and the Q3 GDP third estimate. | SPY's **2026-12-23** intraday range closing **at or above** its 2026 median session range — that kills the compression read and is registered as `FT-durable-goods-2026-12-23-1` |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** Three independent refusals now stack: the 12-release overnight-gap
  null carried from the 09-25 ledger, this doc's 33-year pre-Christmas range compression, and the
  same-minute crowd-out by a `high`-tier BEA print.
- **The number to read first** — **ex-transportation** new orders (σ 0.34), then **nondefense
  capital-goods shipments**. Headline last or not at all (σ 3.74 — a 10.9× split). Carried, not re-run.
- **This edition's shipments line matters LESS than the predecessor's** — November is the **first** month
  of Q4, not the third of Q3, so nothing downstream reads it until the Q4 GDP advance in **late January
  2027**. The one genuinely load-bearing channel the 10-27 edition had is absent here.
- **The existence question is the whole event.** CR expires **2026-12-11** (`estimate`); a lapse begins
  00:00 **2026-12-12** and this print sits **11 days inside it**. Census's measured response for this
  series is **delay ~28–34 days** → a late-January landing, matching the Nov-2025 analogue exactly.
- **The headline's swing factor should be public ~14 days early** — Boeing publishes monthly orders around
  the 9th, so November orders land ~**2026-12-09**. Mechanism only; the mapping to the headline is
  **unmeasured** in this repo, and the publication cadence rests on one dated comparable.
- **What this release still cannot tell you** — semiconductor **new orders** are excluded outright, the
  report is **nominal**, and Census disclaims measurable statistical significance (M3 is not a probability
  sample). This is not an AI-capex read and never was.
- **The one historical precedent for a violent version of this session was a shutdown, not the data** —
  **2018-12-21** (SPY −2.62%, range p97) was quad-witching plus post-Powell plus the **eve of the 2018-19
  lapse**. That is the shape to fear here, and it is owned by the funding ledgers, not by this row.
- **Watch (dated)** — predecessor print **09-25** · FOMC **09-16** · midterms **11-03** · successor-slot
  print **11-25** (untracked by decision) · **FOMC 12-09** · Boeing November orders ~**12-09** (inferred) ·
  **CPI 12-10** · **CR EXPIRY 12-11** · **opex 12-18** · **this print 12-23** 08:30 ET, alongside **PCE**
  + **Q3 GDP third estimate** 08:30 and new home sales 10:00 · **Christmas Eve 13:00 close 12-24** ·
  **Advance Economic Indicators 12-28** (estimate, filed in this PR) · FOMC minutes **12-30**.

## Initial research

### The question, plainly

Does the November-2026 advance durable goods report exist on 2026-12-23 given that the continuing
resolution funding the government expires twelve days earlier, and does the session it lands in — the last
full trading day before Christmas Eve — make it tradeable for a book holding NVDA MRVL AVGO CRWV MSFT GOOG
META AAPL AMZN?

**One-line verdict:** the date is confirmed on two Census primaries and its **existence is genuinely
conditional** — this is the one durable-goods edition on the calendar whose funding branch is still open —
but it is **less** tradeable than either predecessor, because the session it lands in is the most reliably
compressed regular session of the trading year and this doc measures that compression **directly on the
release dates themselves** rather than combining two nulls by argument.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target. Five
inputs, all fetched or run 2026-09-05:

1. **Two Census primaries, fetched and parsed directly** — `census.gov/manufacturing/m3/release_schedule.html`
   (the advance/full-report grid, decoded row by row) and `census.gov/economic-indicators/calendar-listview.html`
   (which carries the 08:30 time, the reference month, and the release id). The same two the predecessor
   used, re-fetched rather than carried.
2. **Ten Census press-release PDFs** — `m3/historical_data/pressreleases/adv/<YYYY>/nov<YY>adv.pdf` for
   2013–2024, FlateDecode text layers decompressed in-session, read for the verbatim
   `FOR IMMEDIATE RELEASE <DAY>, <DATE>, AT 8:30 A.M. EST` line. This is what turns the seasonal
   measurement below from a proxy into a direct one.
3. **A whitehouse.gov / congress.gov primary plus dated wire coverage** for the CR, and two
   appropriations trackers (CRFB *Appropriations Watch: FY 2027*; CRA GovAffairs, 2026-09) for progress
   toward 2026-12-11.
4. **An original measurement, run for this doc.** Yahoo daily bars, SPY back to **1993** and QQQ to
   **1999**, reduced to two per-session statistics — the **overnight gap** (prior close → open, the window
   an 08:30 release lands in) and the **intraday range** ((high − low) / prior close, the window a
   day-trade lands in) — with each target session ranked against **its own calendar year's** distribution,
   so a regime-varying baseline cannot manufacture the result. Two target sets: every year's last full
   session before Christmas, and the ten primary-sourced release dates from input 2. Plus a **null
   control** (each year's last session before September 24) and a **known-holiday analogue** (before
   July 3).
5. **The Census calendar's own suspension rows**, read off the same page as input 1, used as a
   same-agency counterexample to the delay-not-delete claim.

Baselines end at the **2026-09-04 close** (SPY 770.19, QQQ 718.96, VIX 14.53). The 2026 dispersion table,
the semiconductor exclusion and the reading order are **carried** from the
[`durable-goods-2026-09-25`](durable-goods-2026-09-25.md) and
[`durable-goods-2026-10-27`](durable-goods-2026-10-27.md) ledgers, not re-fetched. Genre model:
[`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The date and time are right, and this doc promotes them to `confirmed` — SUPPORTED, two primaries.**
   The M3 grid's terminal row decoded to `November 2026 | 12/23/2026 | TBD` (the advance report, then the
   full report, which has no date yet), and the indicator calendar carries
   `Advance Report on Durable Goods--Manufacturers' Shipments, Inventories, and Orders | December 23, 2026 |
   8:30 AM | November 2026`, id `A202612230830`. Both fetched direct 2026-09-05. The entry was filed
   `estimate` on 2026-09-04 only because this lane never self-confirms an event in the PR that discovers
   it, and its own initial research is the named condition for the flip — the same promotion both
   predecessors made. Flipped with a `CENSUS:` prefix. **Two stated boundaries on that word:**
   `confirmed` describes the *published schedule as of today*, not immunity from a re-dating, and
   emphatically **not** immunity from the funding branch in leg 2 — a lapse-driven slip is a schedule
   change Census makes unilaterally, and the label does not price it.

2. **The existence risk is real, still open, and is the reason this row exists — SUPPORTED.** H.R. 6500,
   the *Continuing Appropriations and Extensions Act, 2027*, was signed **2026-09-02** (whitehouse.gov
   briefing-room notice; House 370–48 on 09-01, Senate 90–6 on 08-08), funding agencies **through
   2026-12-11**. This print lands **12 days past** that date. The predecessor's branch closed by signature;
   this one cannot close the same way, because the signature *created* the cliff it sits behind. Progress
   toward closing it before December is negligible: FY2027 begins 2026-10-01 and **none of the 12 FY2027
   appropriations bills has cleared Congress — 3 passed the House, 0 reported from Senate Appropriations**
   (CRFB *Appropriations Watch: FY 2027*; CRA GovAffairs FY2027 September update). The CR itself is
   tracked twice, at [`cr-expiry-2026-12-11`](cr-expiry-2026-12-11.md) and
   `government-funding-deadline-2026-12-11` — a known duplicate, flagged by the former and deliberately
   not fixed here, since neither is this event's to consolidate.

3. **Census DELAYS this series rather than deleting it, and the 2025 tail is far longer than previously
   recorded — SUPPORTED, and this is the doc's first original finding.** Read off the M3 grid directly, the
   publication lag from reference-month end:

   | Reference month | Released | Lag from month end | vs. the year-ago normal slot |
   |---|---|---|---|
   | Aug 2025 | 2025-09-25 | **25d** (steady state) | on time |
   | Sep 2025 | 2025-11-26 | **57d** | **+30d** |
   | Oct 2025 | 2025-12-23 | **53d** | **+28d** |
   | **Nov 2025** | **2026-01-26** | **57d** | **+34d** |
   | Dec 2025 | 2026-02-18 | 49d | — |
   | Jan 2026 | 2026-03-13 | 41d | — |
   | Feb 2026 | 2026-04-07 | 38d | — |
   | Mar 2026 | 2026-04-29 | 29d | — |
   | Apr 2026 | 2026-05-28 | 28d | — |
   | May 2026 | 2026-06-25 | **25d** (normalized) | — |

   Three things this sharpens over the "~27–29 days" the calendar entry was filed with. First, the
   **November-reference-month edition — this print's exact analogue — took the worst of it at +34 days**,
   not the middle of the range. Second, the disruption is not a one-print event: it took **eight reference
   months** (Sep-2025 through Apr/May-2026) for the lag to decay back to 25 days, so a lapse here
   contaminates the whole H1-2027 release calendar, not just 12-23. Third, **every reference month from
   Aug 2025 to Nov 2026 carries a date** — the series was never deleted, only pushed.

4. **…but "Census delays" is a property of *this series*, not of Census — SUPPORTED, from a same-page
   counterexample, and this is the finding that keeps leg 3 honest.** The same
   `calendar-listview.html` fetch shows the word `Suspended` in the date column for
   **Advance Economic Indicators, January 2026 and February 2026** reference months, and for
   **Preliminary U.S. Imports for Consumption of Steel Products, December 2025 and January 2026**. So
   Census cancelled outright in the lapse aftermath — just not here. Combined with BEA, which **cancelled**
   the 2025 analogue of the PCE print sharing this exact 08:30 slot (its own release page states the
   Oct+Nov 2025 report "replaces releases originally scheduled for November 26 and December 19, 2025",
   published combined 34 days late — see [`pce-2026-12-23`](pce-2026-12-23.md)), the 2026-12-23 morning
   carries **three different documented failure modes on one date**: this print delays, its slot-mate is
   cancelled, and a sibling Census series five days later is suspended. That is the precise reason the
   delay-not-delete claim is stated for the durable-goods advance report specifically and nowhere else.

5. **The last full session before Christmas is the most reliably compressed regular session of the year —
   MEASURED, and it is this doc's second original finding.** Method above; each target ranked against its
   own calendar year, so no cross-regime baseline is involved.

   | Target set | n | Gap: median pctile (above p50) | Range: median pctile (above p50) | Range ÷ same-year median |
   |---|---|---|---|---|
   | **SPY — last full session before Christmas** | 33 (1993–2025) | p40 (10/33) | **p19 (8/33)** | **0.655** |
   | **QQQ — last full session before Christmas** | 27 (1999–2025) | p41 (10/27) | **p17 (4/27)** | **0.658** |
   | SPY — null control (before Sep 24) | 33 | p43 (12/33) | p46 (13/33) | 0.958 |
   | QQQ — null control (before Sep 24) | 27 | p46 (13/27) | p40 (10/27) | 0.906 |
   | SPY — before July 3 (holiday analogue) | 28 | p42 (10/28) | p46 (13/28) | 0.949 |
   | QQQ — before July 3 (holiday analogue) | 23 | p27 (6/23) | p28 (7/23) | 0.769 |

   **The Christmas rows are large and the control rows are not.** A realized range at the **19th (SPY) /
   17th (QQQ) percentile** of its own year, roughly **35% narrower** than that year's median session, with
   only 8/33 and 4/27 above the median — against a null of ~50%. The **null control returns almost exactly
   p50 and ~0.95×**, which is the check that matters: the method does not find compression on an arbitrary
   late-month session, so it is measuring the holiday and not the procedure. The **July-3 analogue is
   reported because it cuts against the tidy story** — QQQ compresses (0.769) but SPY essentially does not
   (0.949), so "holidays compress sessions" is *not* established generally; what is established is that
   the pre-Christmas session specifically does, on both instruments, by a wide margin.

6. **And unlike the predecessor's FOMC finding, this one is measured ON the configuration, not argued into
   it — SUPPORTED, ten primary-sourced release dates.** The 10-27 ledger's honest limit was that no
   durable-goods release in its sample had *ever* landed on an FOMC day-1, so its two nulls were "combined
   by argument rather than by data." That limit does not apply here. Ten November-data release dates were
   recovered verbatim from Census press releases: **2013-12-24 · 2014-12-23 · 2015-12-23 · 2016-12-22 ·
   2017-12-22 · 2018-12-21 · 2019-12-23 · 2021-12-23 · 2023-12-22 · 2024-12-23**. **Every one falls in the
   Dec 21–24 holiday corridor, and 8 of the 10 are exactly the compressed session leg 5 measures.** (The
   two misses: 2013 released *on* the Christmas Eve half-day, 2016 one session early.) Re-running the
   measurement on those ten dates alone:

   | Target set | n | Gap pctile (above p50) | Range pctile (above p50) | Range ÷ same-year median | Close-to-close |
   |---|---|---|---|---|---|
   | **SPY — actual Nov-data release sessions** | 10 | p34 (2/10) | **p23 (2/10)** | **0.688** | median **+0.175%**, 7/10 positive, **mean +0.034%** |
   | **QQQ — actual Nov-data release sessions** | 10 | p33 (3/10) | **p22 (2/10)** | **0.698** | median +0.050%, 6/10 positive, **mean −0.129%** |

   The compression survives conditioning on the release being present, at ~**31%** narrower. And the
   close-to-close column is the direct answer to the tradeability question: **a mean of +0.03% on SPY and
   −0.13% on QQQ is zero.** This also cross-checks the [`pce-2026-12-23`](pce-2026-12-23.md) ledger's
   independent observation that a green Christmas-week session "is the null, not a signal" — that ledger
   measured direction on n≈4; this measures dispersion *and* direction on n=10 primary-dated sessions and
   agrees.

7. **The one violent instance in the sample was a shutdown, and that is the shape worth respecting —
   SUPPORTED.** The sole outlier is **2018-12-21**: SPY −2.62% with a range at the **97th** percentile
   (3.94%), QQQ −3.10% at the **99th** (4.84%). It was quadruple witching, two days after the "autopilot"
   FOMC presser, and **the eve of the 2018-19 lapse, which began 2018-12-22**. Strip it and the sample's
   compression is near-total. Two readings follow, and both point the same way: this session's tail risk is
   real but is **never sourced from the orders survey**, and the one configuration that produced it —
   opex plus a Fed shock plus a funding cliff — is a recognisable partial match for December 2026 (opex
   12-18, FOMC 12-09, cliff 12-11). The difference is direction of travel: in 2018 the lapse began the day
   *after* the print, whereas a 2026 lapse would begin **eleven days before** it, which is the branch where
   the print does not happen at all rather than the branch where it happens into a panic.

8. **The 08:30 slot is triple-booked, and this crowd-out is worse than the predecessor's — SUPPORTED.**
   At the identical minute on 2026-12-23: **PCE / Personal Income & Outlays (Nov data)**, tracked `high`
   and **confirmed** on a BEA primary, and — per that same BEA schedule line — the **GDP third estimate,
   industries, corporate profits, state GDP** for Q3 2026. Census adds **New Residential Sales at 10:00**
   (`A202612231000`). The 10-27 edition at least owned its own minute, with the FOMC statement a day later;
   this one is a `medium`-tier survey released **simultaneously** with a `high`-tier inflation print. Any
   move attributed to durable goods on this morning is almost certainly PCE.

9. **This edition's shipments channel is weaker than the predecessor's — SUPPORTED by mechanism, and it is
   a deliberate downgrade.** Nondefense capital-goods shipments are BEA's monthly source input for
   equipment investment. The 10-27 edition supplied the *third* month of Q3 and printed two days before the
   Q3 advance estimate — a tight, dated channel. November 2026 is the **first month of Q4**, and the Q4
   advance estimate does not print until **late January 2027**. Nothing downstream reads this edition's
   shipments line for over a month. The one leg that made the predecessor genuinely load-bearing is absent.

10. **The reading order and its definitional limits are inherited unchanged — SUPPORTED (carried, not
    re-run).** Ex-transportation new orders first, **nondefense capital-goods shipments** second, headline
    last: across 2026 reference months σ(headline) **3.74** vs σ(core) **0.34** (**10.9×**), mean absolute
    forecast miss **3.30pp vs 0.44pp**, core positive **7/7**. Census's explanatory notes state *"Figures
    on new and unfilled orders exclude data for semiconductor manufacturing"* — M3 is a voluntary survey
    and the large chipmakers do not answer the order questions — so **no part of this release is an
    AI-order-flow read**. Shipments include semis; orders do not. The report is **nominal**, and Census
    computes no confidence interval for any figure quoted here.

11. **Tracked-name sensitivity is nil directly and weaker than the predecessor's indirectly — SUPPORTED.**
    `symbols: []`, and leg 10 removes the only direct channel. What remains is inherited and now
    *degraded* by leg 9: the **rate path** (weakly — nominal, no price component) and **equipment
    investment via GDP**, which for this edition is a January-2027 channel rather than a two-day one. The
    honest ranking for this morning is that **PCE at the same minute** outranks it on every axis that
    reaches a tracked name.

### What the conditions support

**A reading exercise with three refusals attached, and one thing genuinely worth watching.** The refusals
now stack three deep: the 09-25 ledger's 12-release overnight-gap null (p46 SPY / p45 QQQ), this doc's
33-year pre-Christmas range compression measured directly on ten actual release dates (p23, 0.688×, mean
close-to-close +0.03%), and a same-minute `high`-tier BEA print that owns whatever the tape does at 08:30.
When it prints: read ex-transportation, then nondefense capital-goods shipments, and treat the headline as
a transportation readout whose biggest input was probably visible on Boeing's site two weeks earlier. What
*is* worth watching is not the number but the **calendar**: whether Congress funds past **2026-12-11**. If
it does not, the base case is not "a bad print" — it is **no print until late January**, on this series'
own measured precedent, with the whole H1-2027 release schedule shifted behind it.

### Honest limits

The **release-date sample is n=10, not 12** — the 2020 and 2022 press-release PDFs use subset-font
encodings this session could not decode, and 2022's date (2026-12-22 by PDF creation metadata) is
**metadata-derived and excluded from every statistic above** rather than counted. The **pre-Christmas
sample is n=33 SPY / 27 QQQ**, which is large for a seasonal study but spans overlapping macro regimes and
carries **no significance test**; the effect is big enough that the null control's clean p46 is doing the
work a p-value would. The target definition — "last session dated before Dec 24" — is a rule, not a
judgment, and it misclassifies 2013 (where the release itself fell on the half-day). The **close-to-close
statistics are dominated by one observation** (2018-12-21); the medians are given alongside the means for
exactly that reason. The **compression finding says nothing about direction or about options pricing** —
a narrow realized range is not a claim about implied vol, and no options data was pulled. The **2026
dispersion table, the semiconductor exclusion and the nominal caveat are carried**, inheriting the
09-25 ledger's single-source (mql5) provenance. **Boeing's publication timing rests on one dated
comparable** and the orders-to-headline mapping is unmeasured. **No November-data consensus exists at
D-109** and none will before release week, so this doc has no surprise benchmark and does not pretend to
one. And the largest limit is stated plainly in leg 2: the **funding branch is unresolved**, so the single
most consequential fact about this event — whether it happens — is not knowable today and is not forecast
here.

## Stance & kill switches

**Stance (date `confirmed`, two Census primaries fetched 2026-09-05; the funding branch `estimate` and
open).** Treat 2026-12-23 08:30 ET as a **reading exercise, never an event** — no position is opened,
closed or sized off it, and no house playbook targets it. The refusal now rests on three independent
measurements rather than the predecessors' two: the 12-release overnight-gap null, this doc's finding that
**the last full session before Christmas runs ~35% narrower than an ordinary session across 33 years
(p19 SPY / p17 QQQ, null control p46) and ~31% narrower measured on the ten actual release dates (p23 /
p22) with a mean close-to-close of +0.03% SPY and −0.13% QQQ**, and a same-minute `high`-tier PCE print
that owns the morning. The standing reading order is unchanged — **ex-transportation first, nondefense
capital-goods shipments second, headline last** — but this edition's shipments line is **weaker** than the
predecessor's, being the first month of Q4 with no downstream reader until late January 2027. **This
release is not an AI-capex read** (new orders exclude semiconductor manufacturing by construction).
**The funding branch that the 10-27 ledger closed for itself is open here and is the whole event**: the CR
expires **2026-12-11** (`estimate`), this print sits **12 days past it**, no FY2027 appropriations bill has
cleared Congress, and Census's own grid shows what a lapse does to *this* series — **delay, never delete,
+28 to +34 days with the November edition worst-hit, and an eight-month decay tail**. That is a materially
different exposure from its slot-mate PCE, which BEA **cancelled** outright in 2025.

**Kill switches:**

- **SPY's 2026-12-23 intraday range printing at or above its 2026 median session range** — the
  pre-Christmas compression read does not survive its first out-of-sample observation, and legs 5–6 need
  re-deriving rather than patching. Registered as `FT-durable-goods-2026-12-23-1`.
- **The release not publishing at 08:30 on 2026-12-23** — leg 1's `confirmed` flip and leg 3's whole delay
  model become the live story instead of the background; the impact tier goes up and the successor slot
  needs filing. Registered as `FT-durable-goods-2026-12-23-2`.
- **A full-year FY2027 appropriations package or a second CR extending past 2026-12-23, enacted before
  2026-12-11** — leg 2's branch closes exactly as H.R. 6500 closed the predecessor's, and this row
  degrades to an ordinary print with no distinguishing argument left.
- **A lapse beginning 2026-12-12 that produces a slip shorter than 28 days or longer than 34** — leg 3's
  measured range is the only quantitative claim this doc makes about the delay, and either tail breaks it.
- **Census marking any durable-goods reference month `Suspended` on its indicator calendar** — leg 4's
  series-specific delay-not-delete property falls, and this event becomes a cancellation risk like its
  slot-mate rather than a timing risk.
- **The 2026-12-23 close-to-close move on SPY exceeding ±1.5%** — the mean-zero result in leg 6 held on
  9 of 10 historical observations; a second 2018-style session says the corridor's tail is fatter than a
  10-observation sample can see.
- **Ex-transportation printing negative on 2026-12-23** — the first negative core month since at least
  January 2025 ends the "slow persistent drift" reading; the order survives, the impact tier goes up.
- **Census begins publishing semiconductor new orders** — leg 10's definitional exclusion falls and this
  event's place in the calendar needs re-deriving from scratch.
- **BEA moving PCE off the 2026-12-23 08:30 slot** — leg 8's crowd-out argument is address-dependent, and
  a moved slot-mate voids it rather than killing it.

**Registered forward tests** (see [`forward-tests/durable-goods-2026-12-23.md`](../forward-tests/durable-goods-2026-12-23.md)):
`FT-durable-goods-2026-12-23-1` (pre-Christmas range compression, score by 2026-12-24) and
`FT-durable-goods-2026-12-23-2` (on-schedule publication through the CR cliff, score by 2026-12-24).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-109 | Initial research banked (above). **Date promoted `estimate` → `confirmed`** on two Census primaries fetched direct today: the M3 grid's terminal row (`November 2026 | 12/23/2026 | TBD`) and the indicator calendar (`December 23, 2026 | 8:30 AM | November 2026`, id `A202612230830`). **Finding 1 — the funding branch is OPEN here, unlike the predecessor.** H.R. 6500 signed 2026-09-02 funds through **2026-12-11**; this print is **12 days past** the cliff, and none of the 12 FY2027 bills has cleared Congress (3 passed House, 0 out of Senate Approps — CRFB *Appropriations Watch: FY 2027*, CRA GovAffairs 2026-09). **Finding 2 — the 2025 delay tail is longer and worse-targeted than the calendar entry recorded.** Read straight off the M3 grid, lag from reference-month end: steady state **25d**, then Sep-2025 **57d** (+30 vs the year-ago slot), Oct **53d** (+28), **Nov 57d (+34 — this print's exact analogue, worst-hit, landing 2026-01-26)**, Dec 49d, Jan-26 41d, Feb 38d, Mar 29d, Apr 28d, May **25d**. So **eight reference months to normalize**, and every month carries a date — delayed, never deleted. **Finding 3 — but that is a property of this SERIES, not of Census.** The same calendar page reads `Suspended` for **Advance Economic Indicators, Jan + Feb 2026** and **Preliminary Steel Imports, Dec 2025 + Jan 2026**; BEA meanwhile *cancelled* the 2025 analogue of the PCE print sharing this exact 08:30 slot. Three documented failure modes on one morning. **Finding 4 — the original measurement.** Yahoo daily bars, SPY 1993→ and QQQ 1999→, each target session ranked against **its own calendar year** (no cross-regime baseline). Last full session before Christmas: **SPY n=33, gap p40 (10/33), range p19 (8/33), 0.655× the year's median range; QQQ n=27, gap p41, range p17 (4/27), 0.658×** — roughly **35% narrower** than an ordinary session. **Null control** (last session before Sep 24) returns **p46/p46, 0.958×** (SPY) and p46/p40, 0.906× (QQQ) — the method finds nothing on an arbitrary date, which is why the Christmas result is worth believing. The **July-3 analogue is reported against the story**: QQQ compresses (0.769×) but SPY does not (0.949×), so "holidays compress" is not established generally. **Finding 5 — and it is measured ON the configuration, unlike the 10-27 ledger's FOMC day-1 result.** Ten Nov-data release dates recovered verbatim from Census press-release PDFs (2013-12-24, 2014-12-23, 2015-12-23, 2016-12-22, 2017-12-22, 2018-12-21, 2019-12-23, 2021-12-23, 2023-12-22, 2024-12-23): **all ten in the Dec 21–24 corridor, 8 of 10 exactly on the compressed session.** Re-run on those ten: **SPY range p23 (2/10), 0.688×, close-to-close median +0.175%, 7/10 positive, mean +0.034%; QQQ p22 (2/10), 0.698×, median +0.050%, mean −0.129%.** Compression survives conditioning; direction is zero. This independently cross-checks [`pce-2026-12-23`](pce-2026-12-23.md)'s "a green session here is the null, not a signal." **Finding 6 — the sample's one violent session was a shutdown:** 2018-12-21 (SPY −2.62%, range p97; QQQ −3.10%, p99) was quad-witching + post-Powell + the eve of the 2018-19 lapse. Partial shape-match to Dec 2026 (opex 12-18, FOMC 12-09, cliff 12-11) — but a 2026 lapse starts **11 days before** the print, not the day after, which is the branch where it does not print at all. **Finding 7 — the 08:30 slot is triple-booked** with `high`-tier confirmed **PCE** and the **Q3 GDP third estimate** (same BEA line), plus new home sales 10:00: a worse crowd-out than 10-27's. **Finding 8 — this edition's shipments channel is WEAKER:** November is the first month of Q4, so nothing reads it until the Q4 advance in late January 2027, where the predecessor fed a GDP print two days later. **Carried, not re-fetched:** the 10.9× dispersion split (σ 3.74 vs 0.34; core positive 7/7), the semiconductor exclusion, nominal-not-real, and the no-measurable-significance disclaimer. **Adjacency sweep.** *Peers:* n/a, `symbols: []`. *Macro:* the CR signature is the material one, and its cliff is upstream of this print; no November-data consensus exists at D-109 and none will before release week. *Volatility regime:* VIX **14.53**, SPY **770.19**, QQQ **718.96** at the 2026-09-04 close (own Yahoo pull) — baseline established, nothing to diff against yet. *Geopolitical:* nothing new touching this release; it is nominal, so an oil-driven price effect flatters the dollar figure without changing volumes. *Event tape:* the 12-23 morning carries PCE + GDP-third at the same minute; opex 12-18 sits 5 days earlier. **Adjacency proposal (1, filed in this PR): `advance-economic-indicators-2026-12-28`** — `medium`, `estimate` per the no-self-confirm limit despite coming off today's Census calendar (`A202612280830`, Nov-2026 reference month). Non-generic on two counts: it fills the gap in an already-tracked series whose only entry is [`advance-economic-indicators-2026-10-28`](advance-economic-indicators-2026-10-28.md), and it is **the series Census actually suspended in 2026** (finding 3) landing **five days after this print and 17 days after the cliff** — the corroborating observation for whether a lapse bit, on the same reference month. **Considered and declined, with reasons:** **New Residential Sales 2026-12-23 10:00** (`A202612231000`) — a same-day Census release, but no tracked name has housing exposure and no argument beyond co-location; **Preliminary Steel Imports 2026-12-22** — suspended twice in 2026 and market-irrelevant; **`durable-goods-2026-11-25`** — declined again for the reason the 10-27 ledger gave, it sits inside the CR window with only the generic "a macro print precedes an FOMC" claim; and the **full M3 report for this reference month**, which the grid lists as **TBD** and which therefore has no date to file. **Forward tests registered:** `FT-durable-goods-2026-12-23-1` (SPY's 12-23 range closes below its 2026 median; base rate 8/10 on measured release sessions and 25/33 on the full pre-Christmas sample, vs an unconditional 50%) and `FT-durable-goods-2026-12-23-2` (the release publishes on schedule — genuinely uncertain here, unlike the predecessor's near-certain version, because the CR expires 12 days earlier). | — (stance set) | 2026-09-26 per the `medium:31+` band (every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new `src/domain/market-events/<id>.json` (`status: "estimate"`)
in the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
