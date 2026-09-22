# Philadelphia Fed Aruoba Term Structure of Inflation Expectations (ATSIX), December 2026 — aruoba-inflation-term-structure-2026-12-29

**Kind:** macro-print · **Date:** 2026-12-29 (estimate, EST: philadelphiafed.org/calendar-of-events re-fetched direct 2026-09-10 HTTP 200 at 130,695 bytes and parsed as data — 237 rows, 18 families, 12 ATSIX rows all at 2:00 p.m., December verbatim "december 2026 | 29 | 2:00 p.m.") · **Impact:** low
**Last assessed:** 2026-09-10
<!-- probe-ref: {"symbols":{},"vix":17.84,"daysBand":"low:15+","adjacentIds":["christmas-eve-half-day-2026-12-24","treasury-coupon-announcement-2026-12-24","christmas-market-closure-2026-12-25","japan-cpi-tokyo-flash-2026-12-25","advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","dallas-fed-mfg-2026-12-28","sifma-japan-early-close-2026-12-28","sifma-uk-bond-market-closure-2026-12-28","treasury-2y-note-2026-12-28","treasury-5y-note-2026-12-28","case-shiller-hpi-2026-12-29","consumer-confidence-2026-12-29","dallas-fed-tssos-2026-12-29","fhfa-hpi-2026-12-29","treasury-7y-note-2026-12-29","fomc-minutes-2026-12-30","china-retaliation-suspension-expiry-2026-12-31","georgia-psc-data-center-cost-shift-2026-12-31","jpx-market-closure-2026-12-31","nerc-computational-load-standards-2026-12-31","russell-style-quarter-end-capping-effective-2026-12-31","sifma-bond-early-close-2026-12-31","sp-select-sector-secondary-reweight-2026-12-31","tic-quarterly-external-debt-2026-12-31","new-years-day-market-closure-2027-01-01","sifma-uk-bond-market-closure-2027-01-01","uk-fuel-duty-rise-2027-01-01"],"screenStreak":0,"blocked":[{"url":"https://api.eia.gov/v2/petroleum/pri/gnd/data/","status":"403","at":"2026-09-10"}]} -->

## At a glance

**TL;DR.** **This row was filed as the ATSIX edition that finally matters — the first curve read after
the December FOMC, the December CPI and the funding cliff all resolve, landing in one of the four
months a sibling ledger measured the long end to actually move. Both halves of that fail, and the
second one fails against the sibling's own data.** **First, the curve cannot see any of those
events, because it contains no market data at all.** The technical note's item 7, fetched and
text-extracted this session, confines market inputs to the *other* sheet — *"For computing the **real
interest rate yield curve**, we use the nominal yield curve averaged over the first 15 calendar days
of the month"* — while the published expectations curve is a factor fit over **survey forecasts
only** (item 2). Measured rather than argued: the monthly change in ATSIX's 10-year point and the
monthly change in the market's own 10-year breakeven correlate at **r = −0.072 (t = −0.79, n = 121)**
over 2016-08…2026-08, from Treasury's own nominal and real curve feeds re-fetched today. **Zero.** The
earliest survey input, SPF Q4, closes **2026-11-16** — three weeks before `fomc-2026-12-09`
(`confirmed`). **Second, and this is the finding: the December long-end seasonal is decaying and is
already gone.** Re-running the sibling's own test by era, the Mar/Jun/Oct/Dec group ratio in the
10-year point falls **2.68 (t = 5.93)** in 1998-2008 → **1.65 (t = 2.16)** in 2009-2016 → **1.39
(t = 1.75)** in 2017-2025, and **December alone in 2017-2025 runs 0.0493pp against 0.0443pp for every
other month — ratio 1.11, t = 0.27**. In the era the spreadsheet is genuinely real-time, December is
an ordinary month, and its direction is a coin flip (**13 up / 15 down** across 28 Decembers).
**Third, the size never mattered.** The market's 10-year breakeven moves **0.1052pp** in an average
month against ATSIX's **0.0437pp**; a typical December ATSIX move is **3.2 trading days** of ordinary
breakeven noise, and only **3.9%** of single days see a breakeven move that big. December is not even
special for real money: breakeven **0.1020 vs 0.1055pp**, ratio **0.97**. **What this document does
own is the date.** 2026-12-29 is the **one 2026 ATSIX row a rule derives** — last Friday (10 of 12
rows), December's is **2026-12-25, Christmas Day** (`christmas-market-closure-2026-12-25`), the next
business day is Monday **12-28**, and the bank puts **3 of its 237** 2026 rows on a Monday (**1.3%**),
none in December. That is strictly better provenance than the November sibling, whose row nothing
explains — and it still stays **`estimate`**, on prefix taxonomy and no-self-confirm. The sibling's
independent results were re-run here and **reproduce exactly** (worst R² **0.99924**, mean
**0.99964**; λ changed once at **2019-08**, 84 vintages since). `symbols: []`, `low`, 14:00 ET in the
year-end week with **28 tracked events inside five days**, a 7-year auction the same afternoon and
FOMC minutes the next. Nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-110) | **Stand aside** | High | `low` impact, `estimate` date, `symbols: []`, 110 days out. No consensus exists for a model-fitted research curve, no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed, and the sibling's three-factor result was reproduced here — 118 published horizons are three free numbers (worst R² **0.99924** over 344 vintages). | The Philadelphia Fed re-dating the December release off **2026-12-29** on the calendar endpoint re-fetched here, which voids the one leg this document owns outright and forces a re-derivation rather than a pulse |
| This week | **Stand aside — and do not carry the proposal's "first read after the FOMC" framing forward** | High | The published expectations curve contains **no market data**: the technical note's item 7 confines the 15-day nominal curve to the *real-rate* sheet, and monthly Δ`infexp120` vs Δ 10-year breakeven correlates **r = −0.072, t = −0.79, n = 121** (2016-08…2026-08, Treasury feeds re-fetched **2026-09-10**). A publication date after `fomc-2026-12-09` (`confirmed`) buys nothing when the earliest survey input closed **2026-11-16**. | Any monthly vintage through **2027-06-30** whose Δ`infexp120` correlates with the same month's breakeven move at **r ≥ 0.30** on a rolling 24-month window — which would mean the curve does absorb market-priced news and this leg's zero was a sample artifact |
| This month | **Stand aside; the December long-end seasonal that justified this row is measured to be gone** | High | Mar/Jun/Oct/Dec vs the other eight in the 10-year point: **2.68 (t = 5.93)** 1998-2008 → **1.65 (t = 2.16)** 2009-2016 → **1.39 (t = 1.75)** 2017-2025. December alone 2017-2025: **0.0493 vs 0.0443, ratio 1.11, t = 0.27**; the level factor gives **1.11, t = 0.33**. Nothing between now and 12-29 changes which era it is. | **The Dec-2026 vintage published 2026-12-29 moving `infexp120` by ≥ 0.0665pp** (the full-history December mean) versus the Nov-2026 vintage — `FT-aruoba-inflation-term-structure-2026-12-29-1` dies and the modern-era decay does not hold where it was tested |
| This quarter | **Decline this row too — the family decline has no December exception** | Medium | The sibling declined the other eleven ATSIX dates and kept December as *"a live long-end month… the single most defensible ATSIX row on the whole calendar."* That was measured on a pooled 344-vintage sample whose signal is entirely pre-2009. Confidence is **medium**, not high, because the modern-era December sample is **n = 9** — the decay is measured, its endpoint is not precise. | The Dec-2026 and Dec-2027 vintages **both** moving `infexp120` by more than their adjacent Novembers *and* both clearing 0.0665pp, which would put the modern-era December mean back above the full-history one and make the n = 9 window the artifact instead |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never trade this print.** `low` impact, `symbols: []`, `estimate` date, no macro-keyed house
  playbook, and no release-hour test is run or claimed here.
- **The expectations curve carries no market data — the publisher says so and the tape agrees.**
  Technical note item 7, verbatim: *"For computing the real interest rate yield curve, we use the
  nominal yield curve averaged over the first 15 calendar days of the month."* That is the **`Real`**
  sheet. `InfExp` is survey-only (item 2). Monthly Δ`infexp120` vs Δ 10-year breakeven:
  **r = −0.072, t = −0.79, n = 121**.
- **The proposal's premise is therefore refuted.** Filed as *"the first curve read AFTER the FOMC, the
  CPI and the cliff all resolve"* — but the earliest input (SPF Q4) closed **2026-11-16**, three weeks
  before `fomc-2026-12-09`, and no input is a price.
- **The December seasonal decays to nothing.** Mar/Jun/Oct/Dec vs the other eight, 10-year point:
  **2.68 / t = 5.93** (1998-2008) · **1.65 / t = 2.16** (2009-2016) · **1.39 / t = 1.75** (2017-2025).
  December alone 2017-2025: **1.11 / t = 0.27**.
- **And its direction was never predictable.** **13 up, 15 down** across 28 Decembers. Dec→Jan
  reversal correlation **−0.088** against a **−0.204** all-month baseline — December's move reverses
  *less* than an average month, so it is not even a clean scheduled-refresh artifact; it is noise.
- **The market ruler.** 10-year breakeven from Treasury's own feeds (`BC_10YEAR` − `TC_10YEAR`, 2,673
  business days **2016-01-04…2026-09-10**): daily mean |Δ| **0.0211pp**, monthly mean **0.1052pp**,
  against ATSIX's **0.0437pp**. A typical December ATSIX move = **3.2 days** of breakeven noise
  (**2.3** on the 2017-25 December mean); **3.9%** of single days beat it outright.
- **December is not an inflation-expectations month for real money either** — breakeven monthly |Δ|
  **0.1020 (Decembers, n = 10) vs 0.1055 (n = 118)**, ratio **0.97**. Whatever the pre-2009 ATSIX
  December seasonal was, it was a property of the publication schedule, not of expectations.
- **The date is derived, and this is the one thing this row has that its sibling does not.** Ten of
  twelve 2026 rows are the month's last Friday; December's is **2026-12-25**, Christmas Day
  (`christmas-market-closure-2026-12-25`, `estimate`); Monday **12-28** carries **zero** Philadelphia
  Fed releases and the bank schedules only **3 of 237** 2026 rows on a Monday (**1.3%**). Last Friday
  → skip the holiday → skip Monday → **Tuesday 12-29**.
- **The proposal's cadence premise was a misread, and it is corrected here.** It said the calendar
  *"shows only 11-20 and 12-29, which is not obviously monthly."* The same endpoint, the same day,
  carried **all twelve** 2026 rows (Jan 30 … Dec 29), every one at 2:00 p.m.
- **The sibling's own numbers reproduce exactly** — 118 horizons on `[1, L, S, C]` over 344 vintages,
  worst **R² = 0.99924** (h = 120), mean **0.99964**; λ takes **two** values in 344 vintages, changing
  once at **2019-08**, unchanged for **84** vintages since. Both are independent re-runs, not citations.
- **The sibling's `FT-…-2` is under-powered and will probably mis-score.** It kills the Mar/Jun/Oct/Dec
  seasonal if the Dec-2026 vintage moves `infexp120` by **≤** the Nov-2026 vintage. Base rate:
  December beats November in **17 of 28** years (**61%**, one-sided binomial **p = 0.172**), **8/16**
  since 2010, **4/9** since 2017, **1/6** since 2020. A single pair cannot adjudicate a 114-month group
  mean, and this one fires against a live seasonal **39%** of the time.
- **The hour is the year-end week.** 14:00 ET with **28 tracked events** inside five days:
  `treasury-7y-note-2026-12-29` prices the same afternoon, `fomc-minutes-2026-12-30` lands the next,
  and `christmas-market-closure-2026-12-25` sits four days before.
- **Watch (dated):** SPF Q4 **11-16** (the earliest input to this vintage) · ATSIX Nov **11-20** ·
  PIES **11-25** · FOMC **12-09** · CPI **12-10** · CR expiry **12-11** (`estimate`) · Livingston
  **12-11** (`estimate`) · Christmas closure **12-25** · 7y auction **12-29** · **this release 12-29**
  · FOMC minutes **12-30**.

## Initial research

### The question, plainly

`proposals/aruoba-inflation-term-structure-2026-12-29.from-livingston-survey-2026-12-11.json` filed
this event on **one substantive claim** and **two named tasks**. The claim, verbatim: this is *"the
first curve read AFTER the FOMC, the CPI and the cliff all resolve"* — *"the exact opposite position
from the proposer, whose own content is fixed at a 2026-10-31 base by the publisher's mailed-
questionnaire rule and therefore cannot see any of them."* The tasks: **(a)** *"establishing the update
cadence from an ATSIX-specific page rather than the shared calendar row — the 2026 calendar shows only
11-20 and 12-29, which is not obviously monthly and needs its own check"*; **(b)** *"deciding whether a
model-derived curve rather than a survey response earns a calendar entry at all; a DECLINE with the
reasoning recorded is a perfectly good outcome."*

A **sibling ledger filed the same day** —
[`aruoba-inflation-term-structure-2026-11-20.md`](aruoba-inflation-term-structure-2026-11-20.md) —
already answered (b) for the family: ATSIX is model output, the 118 horizons are three free numbers,
and the family declines. It kept December alive as the one exception: *"a live long-end month, and
deliberately not proposed… the single most defensible ATSIX row on the whole calendar."*

**One-line verdict:** the substantive claim is **REFUTED** — the published expectations curve contains
no market data, so a post-FOMC publication date buys nothing — task **(a)** is **DISCHARGED** with its
premise corrected and the date **derived**, and the sibling's December exception **does not survive its
own test split by era**, so **(b) declines for December too**.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target. This
event existed only as one proposal file, so per the mode contract that proposal was read first and the
canonical `src/domain/market-events/aruoba-inflation-term-structure-2026-12-29.json` written in this
PR. Five inputs, all fetched direct **2026-09-10**:

1. **The Philadelphia Fed calendar endpoint** (`/calendar-of-events`, HTTP 200, **130,695 bytes**),
   parsed as data: **237** release rows across **18** families, of which exactly **12** are ATSIX. The
   payload is **401 bytes smaller** than the sibling read on 2026-09-09 and the row/family counts and
   all twelve ATSIX dates are **unchanged**, so the delta is not in this family.
2. **The ATSIX landing page** (`/surveys-and-data/real-time-data-research/atsix`, HTTP 200,
   **36,808 bytes**) — the ATSIX-specific surface task (a) asked for. Stamped **"28 Aug '26"**;
   carries no forward dates.
3. **The technical note** (`atsix-technical-document.pdf`, HTTP 200, **61,282 bytes**), decompressed
   and text-extracted locally — the source of leg 1's decisive item 7.
4. **The published data, from the publisher's own workbook.** `ATSIX_Vintages.xlsx` (HTTP 200,
   **1,095,255 bytes**) unzipped and its three sheets parsed directly: **344 monthly vintages,
   1998-01 → 2026-08**, at **118 horizons**; `Factors` carries `level`, `slope`, `curvature`,
   `lambda`. Byte-identical in size to the sibling's copy — no new vintage has published (the next is
   **2026-09-25**).
5. **The market's own 10-year inflation expectation, which is new to this shelf.** Treasury's daily
   par yield curves, `home.treasury.gov` XML feeds, **22 requests, every one HTTP 200**: nominal
   (`BC_10YEAR`) and real (`TC_10YEAR`), 2016 through 2026. Breakeven = nominal − real, **2,673
   business days, 2016-01-04 → 2026-09-10**. VIX **17.84** and SPX **7,591.70** are CBOE's own delayed
   feed at 2026-09-10 23:36 UTC (prior closes **16.46** / **7,636.36**). **EIA's petroleum API
   returned 403 `API_KEY_MISSING`** and was not substituted — see *Honest limits* and
   `probe-ref.blocked`. The event's date is **`estimate`**, and that label rides on every
   trading-adjacent line below.

### Conviction legs, tested

1. **The proposal's claim is REFUTED at the source: the published expectations curve contains no
   market data, so its publication date carries no information about anything the market did.** The
   technical note's item 7, verbatim:

   > "For computing the **real interest rate yield curve**, we use the nominal yield curve averaged
   > over the first 15 calendar days of the month. This method stands in contrast to that Aruoba
   > (2016), which averaged the daily nominal yield curve over the entire month… Because we publish
   > the ATSIX monthly (after the 15-day average nominal yield curve is available but before we can
   > compute a 30-day average), the 15-day average…"

   The 15-day nominal curve is what the publisher builds the **`Real`** sheet from — real rate =
   nominal yield − expected inflation. The `InfExp` sheet, the one this event is about, is item 2's
   object: *"The shortest horizon of survey **forecasts** used in the computation of ATSIX is three
   months and the longest is (approximately) ten years."* Survey forecasts, and nothing else.

   **Verified against the tape rather than left as a reading.** If the expectations curve absorbed
   market-priced information, its monthly changes would move with the market's own 10-year inflation
   expectation. They do not:

   | Monthly, 2016-08 … 2026-08 | value |
   |---|---|
   | corr(Δ ATSIX `infexp120`, Δ 10-year breakeven) | **−0.072** |
   | *t* (n = 121) | **−0.79** |

   **Zero, with the wrong sign.** So `2026-12-29` being three weeks after `fomc-2026-12-09`
   (`confirmed`) and nineteen days after `cpi-2026-12-10` (`confirmed`) tells a reader nothing about
   whether the December vintage saw them — it structurally cannot see them as *prices*, and its
   earliest survey input, the **SPF Q4 published 2026-11-16** (the same calendar payload, Monday
   10:00 a.m.), closed three weeks before the FOMC. The proposal's own sibling instrument, Livingston,
   was refuted on the identical structure by a different route (a mailed questionnaire anchoring
   content at **2026-10-31**); ATSIX inherits the property from its inputs and adds a stronger version
   of it — **not even the yield curve leaks in.**

2. **Task (a) — DISCHARGED, with its premise corrected, and the date DERIVED. This is the one leg
   where this row beats its November sibling.** The proposal's premise was wrong: the calendar does not
   *"show only 11-20 and 12-29."* Parsed as data on **the same day the proposal was written**, the
   payload carried **all twelve** 2026 ATSIX rows, every one at 2:00 p.m. The cadence is monthly and
   unambiguous. Weekday arithmetic reproduced this session, not recalled:

   | | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | **Nov** | **Dec** |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Row | 30 | 27 | 27 | 24 | 29 | 26 | 31 | 28 | 25 | 30 | **20** | **29** |
   | Weekday | Fri | Fri | Fri | Fri | Fri | Fri | Fri | Fri | Fri | Fri | **Fri** | **Tue** |
   | Last Friday | 30 | 27 | 27 | 24 | 29 | 26 | 31 | 28 | 25 | 30 | **27** | **25** |
   | Rule holds? | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** |

   **December's exception is fully derived, and the missing step in the sibling's version is supplied
   here.** The sibling wrote that 12-29 is *"airtight… because 2026-12-25 is Christmas Day"* — but
   that explains moving *off* Friday, not landing on *Tuesday*. The next business day is **Monday
   2026-12-28**. What rules Monday out is the bank's own behaviour, counted from the payload:

   | Weekday | Mon | Tue | Wed | Thu | Fri |
   |---|---|---|---|---|---|
   | 2026 release rows | **3** | 30 | 45 | 80 | 79 |

   **3 of 237 — 1.3%**, and all three are exceptions of their own kind (two mid-month ADS index
   refreshes, one SPF). **Zero** Philadelphia Fed releases of any family fall on **2026-12-28**. So:
   last Friday → the holiday takes 12-25 → the Monday convention takes 12-28 → **Tuesday 2026-12-29**,
   exactly the calendar's row.

   **A transferable correction to the sibling, from data it had and did not query.** It refuted the
   proposal's Thanksgiving explanation for 11-20 on the grounds that *"2026-11-27 is not a federal
   holiday… Reserve Bank offices are open."* True about the statute, and beside the point: the
   November payload carries **zero releases on 2026-11-27** — the bank's November schedule simply ends
   on Wednesday **11-25**. The shift off 11-27 is institutional, not statutory. It still does not
   derive **11-20** (the bank published on both 11-24 and 11-25 and skipped them), so the sibling's
   conclusion holds and only its reasoning needed the fix.

   **The row nevertheless stays `estimate`,** on three counts unrelated to date doubt:
   `market-events-data.ts`'s confirmed-prefix taxonomy has no member for a regional Reserve Bank's own
   data schedule (`FED:` covers the federalreserve.gov FOMC calendar only), this lane never
   self-confirms, and no ATSIX-specific page carries a forward date — the landing page stamps itself
   **"28 Aug '26"**, matching the calendar's Aug 28 row and the workbook's last vintage **2026-08**,
   and defers forward dates to the shared calendar.

3. **The sibling's results reproduce exactly — an independent cross-check, run before anything was
   built on them.** Both were re-derived from the freshly downloaded workbook rather than cited:

   | Claim | Sibling (2026-09-09) | This session (2026-09-10) |
   |---|---|---|
   | Worst R² of 118 horizons on `[1, L, S, C]`, 344 vintages | 0.99924 (h = 120) | **0.99924 (h = 120)** |
   | Mean R² across 118 horizons | 0.99964 | **0.99964** |
   | Distinct λ values in 344 vintages | 2 | **2** (0.11987689, 0.12088537) |
   | λ change vintage / vintages since | 2019-08 / 84 | **2019-08 / 84** |
   | Mar/Jun/Oct/Dec vs other eight, 10-yr \|Δ\| | 0.0599 vs 0.0319, ratio 1.88, t = 5.86 | **identical** |
   | …on the level factor | 0.0698 vs 0.0293, ratio 2.38, t = 7.60 | **identical** |

   So the disagreement in leg 4 is not about the arithmetic. It is about what the pooled sample means.

4. **THE LEG THIS EVENT TURNS ON — the December seasonal that justified keeping this row decays
   monotonically, and in the real-time era it is gone.** The sibling's group test pools 1998-2026.
   Split by era, on the same 10-year point:

   | Era | Mar/Jun/Oct/Dec | Other eight | Ratio | Welch *t* |
   |---|---|---|---|---|
   | 1998-2008 (n = 44 / 87) | 0.0707 | 0.0263 | **2.68** | **5.93** |
   | 2009-2016 (n = 32 / 64) | 0.0501 | 0.0304 | **1.65** | 2.16 |
   | 2017-2025 (n = 36 / 72) | 0.0545 | 0.0394 | **1.39** | **1.75** |

   **The entire effect is pre-2009, and by 2017 the group is no longer distinguishable at the 5%
   level.** December alone, over 2017-2025 — the window in which the workbook is genuinely real-time
   and the post-2016 model rewrite is in force:

   | 2017-2025, December (n = 9) vs every other month (n = 107) | December | Other | Ratio | *t* |
   |---|---|---|---|---|
   | level factor | 0.0484 | 0.0435 | **1.11** | 0.33 |
   | slope | 0.1436 | 0.1242 | 1.16 | 0.46 |
   | curvature | 0.1232 | 0.1168 | 1.06 | 0.19 |
   | h = 3 | 0.1539 | 0.1104 | 1.39 | 0.94 |
   | h = 12 | 0.1180 | 0.0765 | 1.54 | 1.16 |
   | **h = 120** | **0.0493** | **0.0443** | **1.11** | **0.27** |

   **Not one cell reaches significance, and the long end — the whole basis of the sibling's
   exception — sits at 1.11× with t = 0.27.** The nine values are on the record so a later session can
   check the claim without re-running anything: **2017 0.0453 · 2018 0.0672 · 2019 0.0411 · 2020 0.0129
   · 2021 0.0258 · 2022 0.1818 · 2023 0.0470 · 2024 0.0058 · 2025 0.0166.** Seven of nine sit below the
   full-history December mean (0.0665); the one that dominates the mean is **2022**, the regime break.

   **And the December move was never directional.** Across 28 Decembers, **13 up and 15 down** —
   a coin flip, so even a large December would have nothing to be a call about. Nor is it a clean
   scheduled-refresh artifact: the correlation between a December move and the following January's is
   **−0.088**, against a **−0.204** baseline for any month following any month (n = 342). December
   reverses *less* than an ordinary month, which is what noise looks like, not what a mechanical
   annual refresh followed by a correction looks like.

5. **The magnitude never mattered, and this shelf now has a ruler for it.** The instrument's own stated
   use is *"pricing securities whose returns are linked to inflation expectations at arbitrary
   horizons."* The market prices the ten-year point of that continuously. Treasury's own feeds,
   re-fetched this session, **2,673 business days**:

   | 10-year breakeven (`BC_10YEAR` − `TC_10YEAR`), 2016-01-04 … 2026-09-10 | value |
   |---|---|
   | Mean daily \|Δ\| | **0.0211pp** |
   | Median daily \|Δ\| | 0.0200pp |
   | Mean monthly \|Δ\| (n = 128) | **0.1052pp** |
   | Mean monthly \|Δ\| in ATSIX's 10-year point, same window | **0.0437pp** |

   **The market's own ten-year inflation expectation moves 2.4× as much per month as ATSIX's does, and
   it moves every day.** Put on the December question directly: a typical December ATSIX move
   (**0.0665pp** full history, **0.0493pp** in 2017-2025) is **3.2 trading days** — **2.3** on the
   modern mean — of ordinary breakeven noise, and **3.9%** of individual trading days produce a
   breakeven move that beats it outright. In **93 of 120** months (**78%**) since 2016-09 the breakeven
   moved more than ATSIX's 10-year point did; in December specifically, **8 of 10**.

   **The closing observation is that December is not an inflation-expectations month for real money
   either:** breakeven monthly |Δ| is **0.1020pp in Decembers (n = 10) versus 0.1055pp in the other
   118**, ratio **0.97**. If December genuinely refreshed the ten-year inflation outlook, the asset
   that prices it would show something. It shows nothing. Whatever the pre-2009 ATSIX December
   seasonal was, the most economical reading is that it was a property of the **publication schedule**
   — plausibly the semiannual Blue Chip long-range issues, still an unverified hypothesis on this
   shelf — and not a property of expectations.

   For scale on the live gap: the market's 10-year breakeven closed **2.40%** on **2026-09-10**, while
   ATSIX's 10-year point on the Aug-2026 vintage is **2.2736%**. The two disagree by **0.13pp** —
   about **two** full "live December" moves, in the same direction, just to close.

6. **The sibling's out-of-sample forward test is under-powered and is likely to mis-score, which is
   worth saying before it is scored rather than after.** `FT-aruoba-inflation-term-structure-2026-11-20-2`
   registers the Mar/Jun/Oct/Dec seasonal as alive if *"the Dec-2026 vintage published 2026-12-29 moves
   `infexp120` by more than the Nov-2026 vintage did,"* and kills it otherwise. Measured against the
   28 available Nov/Dec pairs:

   | Sample | December beats November |
   |---|---|
   | Full history (n = 28) | **17 (61%)** — one-sided binomial **p = 0.172** |
   | 2010 onward (n = 16) | 8 (50%) |
   | 2017 onward (n = 9) | 4 (44%) |
   | 2020 onward (n = 6) | **1 (17%)** |

   **A single pair cannot adjudicate a claim about a 114-month group mean.** Even taking the pooled
   seasonal entirely at face value, that kill switch fires **39%** of the time on a live effect; on the
   last six years' behaviour it fires **83%** of the time. This document does not edit that
   registration — ledger rows and registered predictions are append-only, and the sibling owns its own
   fragment. It registers **better-powered tests in its own fragment** (below), states the base rate
   here so whoever scores `FT-…-2` on **2027-01-05** reads it with the right prior, and notes that leg
   4 predicts the kill on grounds that have nothing to do with November: **December is an ordinary
   month now**, so the pair is a coin flip in both directions.

7. **The release hour, and why there would be nothing to read even if there were something to say.**
   Querying `src/domain/market-events/` directly, **28 tracked events** fall within five days of
   2026-12-29:

   | Date | ET | Event | Impact | Status |
   |---|---|---|---|---|
   | 12-24 | — | `christmas-eve-half-day-2026-12-24`, `treasury-coupon-announcement-2026-12-24` | low / medium | estimate |
   | 12-25 | — | `christmas-market-closure-2026-12-25` | low | estimate |
   | 12-28 | — | `treasury-2y-note-2026-12-28`, `treasury-5y-note-2026-12-28`, `advance-economic-indicators-2026-12-28` | medium | estimate |
   | **12-29** | — | **`treasury-7y-note-2026-12-29`** | medium | estimate |
   | **12-29** | **14:00** | **this release** | **low** | **estimate** |
   | 12-29 | — | `case-shiller-hpi-2026-12-29`, `consumer-confidence-2026-12-29`, `fhfa-hpi-2026-12-29` | low | mixed |
   | **12-30** | — | **`fomc-minutes-2026-12-30`** | medium | **confirmed** |

   *(Only this release's 14:00 ET is read from a source this session fetched — the Philadelphia Fed
   calendar payload. The other rows' clock times are not asserted, only their dates.)*

   Two things finish it. **The slot is the year-end holiday week** — the thinnest liquidity of the
   calendar, four days after a full market closure — so a `low`-impact model-fitted research curve
   published at 14:00 has no identifiable tape, and none is claimed here in either direction. And
   **the same afternoon a 7-year note auction prices real duration with real money**, with FOMC
   minutes the following day at the same hour; the ten-year point of the breakeven curve that leg 5
   measures is being repriced continuously through both. A monthly, four-parameter, survey-smoothing
   estimate published into that window cannot inform a market that has already voted — the sibling's
   version of this argument used the 10-year TIPS auction the day before; the December version is
   stronger, because the competing price is set **the same afternoon**.

### What plays the conditions support

**None.** Explicitly, and for reasons measured here rather than assumed:

- `symbols: []` — no tracked name carries an expected-inflation-curve channel, so there is nothing to
  express a view in.
- No house playbook (**S1/S2/E1/S3/S4 + G1**) is macro-keyed; all are symbol- or earnings-keyed, and
  the kill list in [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) has no entry this could revive.
- The date is **`estimate`**, and per the date policy
  ([`trade-playbooks.md`](../../plans/trade-playbooks.md) decision log) date-keyed *action* requires
  `confirmed`. An estimate widens caution and licenses nothing — even one whose date, unusually for
  this family, a rule derives (leg 2).
- Leg 5 removes any hypothetical identification even before the hour is considered: the quantity this
  release estimates monthly is priced daily, 2.4× more actively, by an instrument a reader can already
  see.

The output of this session is a **refutation** (leg 1), a **discharged task with a corrected premise
and a derived date** (leg 2), an **independent reproduction** (leg 3), a **measured decline of the one
exception the family decline had left** (leg 4), a **magnitude ruler this shelf did not have** (leg 5),
and a **power warning on a sibling's pending forward test** (leg 6) — not a position.

### Adjacency sweep, and why it proposes nothing

All five dimensions run, and the sweep files **zero proposals**:

- **Peer prints / sibling instruments.** ATSIX's inputs are the SPF and the two Blue Chip titles. SPF
  Q4 (**2026-11-16**) is already on the shelf; the Blue Chip titles remain **paid, non-public** Wolters
  Kluwer publications with no citable release calendar this session could reach, so no dated event
  exists to propose. Leg 1 shows their timing is the binding constraint on what this vintage can see,
  which makes their absence from any public calendar the sharpest open question on this shelf.
- **The eleven other 2026/2027 ATSIX rows are dated and deliberately NOT proposed** — the sibling
  declined them on the pooled seasonal, and leg 4 removes the one exception it kept, so filing any of
  them would contradict both ledgers. **A sweep that finds twelve dated events a year and files none is
  a first-class outcome**, and the reasoning is now on the record twice.
- **Macro surprises.** The load-bearing dates before this release are FOMC **12-09**, CPI **12-10** and
  the funding cliff **12-11** (`cr-expiry-2026-12-11`, `estimate`) — all already tracked, and leg 1
  establishes that none of them can reach this vintage.
- **Volatility regime.** VIX **17.84** at the 2026-09-10 close, against **16.46** the prior close
  (**+1.38, +8.4%**) and the **16.07** the sibling recorded intraday on 2026-09-09 — the sharpest
  single-day VIX move on this shelf in the last week, with SPX **7,591.70** (**−0.58%**). Recorded as
  the baseline this event's first pulse diffs against; no options-shaped play is contemplated, and a
  **3-point** move is the deterministic screen's own threshold.
- **Geopolitical / policy.** `china-retaliation-suspension-expiry-2026-12-31` sits two days after this
  release and `uk-fuel-duty-rise-2027-01-01` three; both are `estimate` and neither reaches a monthly
  survey fit whose inputs closed weeks earlier.
- **Event tape.** No consensus, whisper or implied move exists for a Federal Reserve Bank research
  series, and none is manufactured here. The energy pass-through question standing across this shelf
  was **not re-measured** — EIA returned **403** — so the sibling's **2026-09-09** reading (regular
  gasoline **$4.157/gal, +30.2% y/y**) is cited with its date and nothing is inferred from it; the
  sibling's own leg 3 forbids reading ATSIX's flat long end as evidence about pass-through in any case.

### Honest limits

- **The modern-era December sample is n = 9.** Leg 4's headline — ratio 1.11, t = 0.27 — is a small
  sample, and a *failure to reject* is not proof of absence. What the leg actually establishes is that
  the sibling's pooled t = 5.86 does **not** license a claim about December 2026: the effect is
  monotonically decaying across three eras and the modern window cannot distinguish December from any
  other month. That is a reason to decline the row, not proof the seasonal is dead. The `This quarter`
  call is graded **medium** for exactly this reason.
- **The era boundaries are chosen, not derived.** 1998-2008 / 2009-2016 / 2017-2025 splits at the
  financial crisis and at the October-2016 model rewrite, which is defensible and is also a
  researcher's choice. The monotone decay is robust to the exact cut — the sibling independently found
  1.42 and 1.74 on a 2017-onward split of its own — but no formal break test was run.
- **The breakeven is not the same object as ATSIX's curve, and the comparison is a ruler, not an
  identity.** The 10-year breakeven contains an inflation risk premium and a TIPS liquidity premium;
  ATSIX's technical note says the same of its own real rates (*"the real rate computed here also
  contains inflation risk premium"*). Leg 5 uses the breakeven to size *movement*, never to claim the
  two should be equal — the **0.13pp** level gap is reported as a scale reference, not a mispricing.
- **The correlation in leg 1 is monthly and contemporaneous.** A zero there rules out the curve
  tracking the market within the month; it does not rule out a lag. No lead-lag scan was run, and the
  `This week` falsifier is written as a rolling-window test so a later session can settle it cheaply.
- **The Blue Chip long-range explanation remains unverified**, exactly as the sibling left it. This
  session did not reach a primary Wolters Kluwer schedule either. Leg 5's finding that the *market*
  shows no December seasonal (ratio 0.97) is evidence the ATSIX December effect was schedule-driven
  rather than expectations-driven, which is suggestive of the Blue Chip story and confirms nothing.
- **No November 2026 vintage exists yet.** The workbook's last vintage is **2026-08**; the next
  publishes **2026-09-25**. Every December claim here is about the *distribution*, and the first
  observation that touches it lands on **2026-11-20**.
- **EIA returned 403 and was not substituted.** `api.eia.gov/v2` requires a key this runner does not
  carry (`API_KEY_MISSING`), so the energy tape is one day old and cited as the sibling's, with its
  date. Recorded in `probe-ref.blocked`.
- **The technical note was text-extracted from a PDF locally**, not read in a viewer. Item 7's quoted
  passage reproduces cleanly and its *claim* is independently corroborated by leg 1's measured zero
  correlation — which is why the leg does not rest on the transcription alone.
- **`low` impact and `symbols: []` are inherited from the proposal and not re-litigated** — but legs 1,
  4, 5 and 7 each independently support them, and nothing measured here argues for a re-tier.

## Stance & kill switches

**Permanent stand-aside on the `estimate`-dated 2026-12-29 release, and this row joins the family
decline rather than standing outside it.** Nothing about a `low`-impact, `symbols: []` model-fitted
research curve published at 14:00 in the year-end holiday week supports a position, no house playbook
is macro-keyed, and the quantity it estimates monthly is priced daily and 2.4× more actively by the
breakeven curve — whose ten-year point is being repriced by a 7-year auction the same afternoon and
FOMC minutes the next morning.

**The proposal's thesis is retired on the publisher's own words.** It filed this row as *"the first
curve read AFTER the FOMC, the CPI and the cliff all resolve."* The technical note confines market data
to the real-rate sheet (item 7) and the expectations curve to survey forecasts (item 2), and the tape
agrees: **r = −0.072, t = −0.79, n = 121** between monthly changes in ATSIX's 10-year point and the
market's own 10-year breakeven, 2016-08…2026-08. The vintage's earliest input closed **2026-11-16**.
A publication date after an event is not a reading of it (`estimate` date; nothing here licenses an
entry).

**And the sibling's December exception does not survive the era split.** The Mar/Jun/Oct/Dec long-end
seasonal falls **2.68 (t = 5.93) → 1.65 (t = 2.16) → 1.39 (t = 1.75)** across 1998-2008 / 2009-2016 /
2017-2025, and December alone in 2017-2025 runs **1.11, t = 0.27** on the 10-year point and **1.11,
t = 0.33** on the level factor. The market shows no December effect either (**0.97**). The
[November sibling](aruoba-inflation-term-structure-2026-11-20.md) declined eleven rows and kept this
one as *"the single most defensible ATSIX row on the whole calendar"* — on the arithmetic reproduced
exactly in leg 3, and on a pooled sample whose signal ended in 2008. **The correct count is twelve
non-events a year, not eleven.**

**What survives, and is worth carrying.** Two things this shelf did not have. First, **the date rule**:
ATSIX publishes on the month's last Friday, skipping federal holidays and skipping Mondays (3 of 237
2026 rows), which derives 2026-12-29 exactly and is the first ATSIX date on this calendar that any rule
explains. Second, **the ruler**: the 10-year breakeven from Treasury's own daily feeds, mean daily
|Δ| **0.0211pp** and monthly **0.1052pp**, is the honest yardstick for any future claim that a monthly
survey-fit move is large. Both are reusable by the three sibling Philadelphia Fed ledgers.

**What would change the stance:**

- **A re-tier to `medium` or above**, or a tracked name acquiring an expected-inflation channel, which
  would give the release something to be a call about. Neither is in view.
- **The Dec-2026 vintage moving `infexp120` by ≥ 0.0665pp** on 2026-12-29 — the full-history December
  mean, cleared by only 2 of the last 9 Decembers. Registered as `FT-…-1`.
- **The Dec-2026 vintage moving `infexp120` by more than the 10-year breakeven moved over the same
  window**, which would mean the survey fit outran the asset that prices the same quantity — 78% of
  months since 2016 go the other way. Registered as `FT-…-2`.
- **The 2027 calendar, when it publishes, failing to put ATSIX on the month's last Friday in at least
  9 of 12 months**, which would mean leg 2's rule is a 2026 coincidence and this row's one advantage
  over its sibling evaporates. Registered as `FT-…-3`.
- **A rolling 24-month correlation between Δ`infexp120` and the 10-year breakeven's monthly change
  reaching r ≥ 0.30** through 2027-06-30, which would mean the curve does absorb market-priced news and
  leg 1's zero was a sample artifact rather than the structure the technical note describes.
- **The Philadelphia Fed re-dating the December release off 2026-12-29**, which voids leg 2 and forces
  a re-derivation rather than a pulse.

Three predictions with score-by dates are registered in
[`forward-tests/aruoba-inflation-term-structure-2026-12-29.md`](../forward-tests/aruoba-inflation-term-structure-2026-12-29.md).
All carry **zero capital** — this is an `estimate`-dated `low`-impact event with `symbols: []`, and a
registered prediction here is an accuracy record, never a position.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-10 | D-110 | **Initial research.** Canonical entry written from the one proposal for this id; both tasks and the claim it was filed on answered. **CLAIM REFUTED — the expectations curve holds no market data.** Technical note item 7 confines the 15-day nominal yield curve to the **`Real`** sheet; `InfExp` is survey-only (item 2). Measured, not read: **corr(Δ `infexp120`, Δ 10-yr breakeven) = −0.072, t = −0.79, n = 121** (monthly, 2016-08…2026-08, Treasury `BC_10YEAR`−`TC_10YEAR` re-fetched today, 22 requests all HTTP 200, 2,673 business days). Earliest input SPF Q4 closed **2026-11-16**, three weeks before FOMC 12-09 — so "first read after the FOMC/CPI/cliff" buys nothing. **(a) DISCHARGED, premise corrected, DATE DERIVED.** The proposal said the calendar "shows only 11-20 and 12-29"; the same endpoint the same day carried **all 12** rows, every one 2:00 p.m. Rule: last Friday (10 of 12) → Dec's is **12-25, Christmas** → next business day **Mon 12-28** → the bank puts **3 of 237** 2026 rows on a Monday (**1.3%**) and **zero** on 12-28 → **Tue 12-29**. First ATSIX date on this calendar any rule explains. *Transferable fix to the sibling:* the payload carries **zero** releases on **2026-11-27**, so the shift off it is institutional not statutory — its conclusion (no rule derives 11-20) still holds. **SIBLING REPRODUCED EXACTLY** before anything was built on it: worst R² **0.99924** (h=120), mean **0.99964**; λ two values, changed once **2019-08**, **84** vintages since; Mar/Jun/Oct/Dec **0.0599 vs 0.0319, t=5.86** and level **0.0698 vs 0.0293, t=7.60**. **THE DECEMBER EXCEPTION DIES ON AN ERA SPLIT.** Group ratio in the 10-yr point: **2.68 (t=5.93)** 1998-2008 → **1.65 (t=2.16)** 2009-2016 → **1.39 (t=1.75)** 2017-2025. **December alone 2017-2025: 0.0493 vs 0.0443, ratio 1.11, t=0.27**; level **1.11, t=0.33**; no cell of six significant. Nine values on the record (2022's 0.1818 carries the mean). Direction was never there: **13 up / 15 down** of 28; Dec→Jan reversal **−0.088** vs a **−0.204** all-month baseline. **MAGNITUDE RULER, new to this shelf.** Breakeven mean daily |Δ| **0.0211pp**, monthly **0.1052pp**, vs ATSIX's **0.0437pp** — the market moves **2.4×** more; a typical December ATSIX move = **3.2 trading days** of breakeven noise (2.3 modern), beaten outright by **3.9%** of single days, and by the breakeven in **93/120 months (78%)**, **8/10** Decembers. **December is not a breakeven month either: 0.1020 vs 0.1055, ratio 0.97** — the old ATSIX seasonal was schedule-driven, not expectations-driven. Live gap: breakeven **2.40%** (2026-09-10) vs ATSIX 10-yr **2.2736%** (Aug-26 vintage) = **0.13pp**, two "live Decembers" apart. **POWER WARNING on the sibling's `FT-…-2`,** filed before it is scored: December beats November in **17/28 (61%, binomial p=0.172)**, **8/16** since 2010, **4/9** since 2017, **1/6** since 2020 — a single pair fires against a live seasonal **39%** of the time and cannot adjudicate a 114-month group mean; its 2027-01-05 scorer should read this row first. **Hour:** 14:00 ET in the year-end holiday week, **28 tracked events** within 5 days, `treasury-7y-note-2026-12-29` pricing real duration the same afternoon and `fomc-minutes-2026-12-30` the next. **Zero proposals filed, deliberately** — the other eleven ATSIX rows are dated and declined by both ledgers. **VIX 17.84** at the 2026-09-10 close vs **16.46** prior (**+1.38, +8.4%**), SPX **7,591.70** (−0.58%); baseline set. **Blocked, not substituted:** EIA `403 API_KEY_MISSING`, so the shelf's pass-through reading stays the sibling's 2026-09-09 one, cited with its date. Three forward tests registered. | **Stance set: permanent stand-aside, and this row joins the family decline instead of standing outside it — the count is twelve non-events a year, not eleven.** The proposal's founding claim is retired on the publisher's own item 7, and the sibling's December exception is retired on its own data split by era | 2026-10-10 (`low:15+` band, 30-day interval; ~D-80) |
