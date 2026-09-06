# BoJ Tankan (December 2026 survey) — boj-tankan-2026-12-14

**Kind:** macro-print · **Date:** 2026-12-14 (estimate, EST: boj.or.jp/en/statistics/outline/tkohyos.xlsx "Schedule for Releases of Statistical Data (From July 2026 to June 2027)", re-fetched direct 2026-09-05 (HTTP 200, 48,500 bytes), unzipped and parsed cell-by-cell out of its `Statistics data` sheet by this session: row 230 labels the Dec.-Survey column of "Tankan … / Summary and Outline" at "8:50 a.m.", row 231 gives that column's Excel serial **46370 = 2026-12-14**, and the same row's June-survey serial 46204 = 2026-07-01 matches that survey's already-published date on the Bank's own archive, so the decoding is validated against an observed release. Rows 233/235 put the Comprehensive Data Set and Long-Term Time-Series at serial **46371 = 2026-12-15**. Filed estimate because the confirmed-prefix taxonomy has `FED:` and no slot for the Bank of Japan, and this lane may not self-confirm an event it discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["cpi-2026-12-10","cr-expiry-2026-12-11","ecb-decision-2026-12-17","ecb-quiet-period-start-2026-12-09","ercot-data-center-audit-filing-2026-12-10","fomc-2026-12-09","g20-miami-2026-12-14","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","import-export-prices-2026-12-17","intl-transactions-q3-2026-12-18","japan-cpi-2026-12-18","boj-decision-2026-12-18","opex-2026-12-18","pjm-capacity-auction-2026-12","ppi-2026-12-15","puct-batch-zero-report-open-meeting-2026-12-17","retail-sales-2026-12-16"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and do not let this date be scored as a verdict on the Tankan.** This
event exists because [`boj-tankan-2026-10-01`](boj-tankan-2026-10-01.md) called the December survey
**the one structurally clean cut** — no quarter-start collinearity — and registered a forward test
on it (**FT-boj-tankan-2026-10-01-3**: a Nikkei opening gap above **0.641%** on 2026-12-14 "re-opens
the channel"). **This session measured the cut and it is not clean; it swapped one perfect confound
for another.** Two corrections. **The denominator was wrong:** December Tankan days run 0.80× an
*all-year* baseline but **0.94× (p = 0.77) against December itself**, because December in Tokyo is
simply quiet — 0.85×, **p = 0.010**, the only sub-0.05 result in this whole two-ledger study. **The
weekday was ignored:** 2026-12-14 is a **Monday**, and December Tankans split hard — the 14
non-Monday releases run **0.86× (p = 0.63)**, the 8 Monday ones run **0.947% median, 2.31× other
December Mondays (p = 0.005)**. And the reason is not the survey: **all 22 December Tankans since
2004 published 2–6 days before that year's December BoJ decision (22/22)**, all 8 Monday ones at
exactly **MPM−4** — and 2026 repeats it (BoJ schedule: "Dec. 17 (Thurs.), 18 (Fri.)"). December
sessions at MPM−4 run **2.02× the December pool (p = 0.003) — 1.76× even with every Tankan day
removed**, and only **2** of the 10 December Mondays at MPM−4 lack a Tankan. **n=2 identifies
nothing — the identical failure that made September unusable.** Consequence: the registered
threshold's breach rate on the cell 2026-12-14 actually occupies is **0.60 (6/10)**, not the 0.396
all-session figure behind it. Date is **estimate**; it widens caution and licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no position exists for this to touch | High | `symbols: []`, no house playbook is rates- or FX-keyed, and at **D-100** the December survey has not entered the field | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05 → 2026-12-13** that the tape attributes to a BoJ Tankan |
| This week | **Stand aside; the live BoJ question is the 2026-09-18 decision** | High | The [09-18 ledger](boj-decision-2026-09-18.md) owns the near question; this is a business-conditions survey 100 days out with no policy instrument attached | Any BoJ communication before **2026-09-30** moving the December release off **2026-12-14 / 08:50 JST** — the scaffold below is re-derived early |
| This month | **Read the sibling's qualifier as amended, not as written** | High | [`boj-tankan-2026-10-01`](boj-tankan-2026-10-01.md) closed the channel and nominated December as the clean re-opener; **December is not clean** — 22/22 December Tankans sit 2–6 days before that year's MPM, and MPM−4 December sessions run **2.02× (p = 0.003)** *without* needing a Tankan (**1.76×, p = 0.082, n=6, ex-Tankan**) | A December MPM date landing outside **MPM − 2…6 days** of its Tankan in the Bank's own archive — the 22/22 spacing rule I derive here would be wrong. Registered as **FT-boj-tankan-2026-12-14-2**, score by 2026-12-21 |
| This quarter | **Pre-commit now: a 2026-12-14 gap above 0.641% is NOT evidence of a Tankan channel** | Medium | The sibling's threshold carries a **0.396** all-session base rate but **0.60 (6/10)** on December Mondays at MPM−4 and **0.244** on December Mondays generally; either way it does not measure this release. And 12-14's Tokyo open is the first bar after a weekend holding [FOMC](fomc-2026-12-09.md), [CPI](cpi-2026-12-10.md) and the [funding deadline](government-funding-deadline-2026-12-11.md) | The **2026-12-14** gap staying **at or below 0.641%** — my own recalibration would then have over-corrected, and the sibling's test passes on its own terms. Registered as **FT-boj-tankan-2026-12-14-3**, score by 2026-12-15 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-12-14 or to that Tokyo session, in any
  branch. `impact: medium`, `symbols: []`, date `estimate`.
- **The seasonal correction.** December Tankan Nikkei \|opening gap\| is **0.80×** against an
  all-year baseline (0.399% vs 0.499%, p = 0.41) but **0.94× against December** (0.424%, p = 0.77),
  because **all** December sessions run **0.85×, p = 0.010 (n=437)**. The sibling's "the clean cut
  is quiet" was reading a month, not a release.
- **The weekday split, which is the whole of it.** Non-Monday December Tankans (n=14): **0.368%
  median, 0.86× a matched non-Monday December pool, p = 0.63.** Monday ones (n=8): **0.947%, 2.31×
  the 82 non-Tankan December Mondays, p = 0.005**, jackknife-stable at **2.29–2.32×**. **2026-12-14
  is a Monday.**
- **…but the loud cell is the calendar position, not the survey.** All 8 Monday releases sit at
  **MPM−4** with the decision on that Friday. December sessions at MPM−4: **n=15, 0.854% = 2.02× the
  December pool, p = 0.003** — and **ex-Tankan, n=6, 0.744% = 1.76×, p = 0.082.** The pre-MPM week
  *as a whole* is not loud (MPM−1…8 ex-Tankan **0.456%** ≈ December baseline), so it is specifically
  MPM−4, on thin n.
- **The identification failure is September's, verbatim.** Only **2** of the 10 December Mondays at
  MPM−4 carry no Tankan — 2004-12-13 (**0.63%**) and 2005-12-12 (**0.95%**), i.e. they look exactly
  like the eight that do. The sibling could not separate the September Tankan from quarter-start on
  **n=2**; December's Monday cut fails the same way.
- **The spacing rule, primary and new.** **22/22** December Tankans 2004-2025 published **2–6
  calendar days** before that year's December MPM decision statement (2 days ×2, 4 days ×9, 6 days
  ×11), harvested from the Bank's own `kYYMMDD` statement filenames. **2026: 12-14 → 12-18 = 4
  days**, with the BoJ's own schedule row reading **"Dec. 17 (Thurs.), 18 (Fri.)"**.
- **Base rates against the registered 0.641% threshold.** All 2004+ sessions **0.396** · all Tankan
  days **0.382** · December Tankans **8/22 = 0.364** · December Mondays **0.278 (n=90)** · December
  Mondays ex-Tankan **0.244 (n=82)** · **December Mondays at MPM−4 6/10 = 0.600** · December Tankan
  Mondays **5/8 = 0.625**.
- **2026's own contamination, from the live calendar.** **18** tracked entries sit within ±5 days.
  The 12-14 Tokyo open (**08:50 JST Mon = 18:50 EST Sun 12-13**) is the first Tokyo bar after a
  weekend carrying [FOMC 12-09](fomc-2026-12-09.md) (confirmed, high),
  [CPI 12-10](cpi-2026-12-10.md) (confirmed, high) and the
  [CR expiry](cr-expiry-2026-12-11.md)/[funding deadline 12-11](government-funding-deadline-2026-12-11.md)
  (est, high); [G20 Miami](g20-miami-2026-12-14.md) shares the date; 12-18 stacks
  [BoJ](boj-decision-2026-12-18.md) + [Japan CPI](japan-cpi-2026-12-18.md) +
  [quad-witching](opex-2026-12-18.md).
- **No US bar, no yen bar, and a quieter *day*.** December Tankan days: S&P \|c2c\| **1.12×
  (p = 0.71)**, USD/JPY \|c2c\| **1.33× (p = 0.23)**, Nikkei \|c2c\| **1.00×**, Nikkei
  \|intraday\| **0.59% ratio → 0.288% vs 0.492%, p = 0.13**. Whatever happens, happens in the
  auction and does not persist.
- **One dated adjacent event proposed** from the same schedule sheet: Japan's **Corporate Goods
  Price Index (Nov 2026), serial 46366 = 2026-12-10, 08:50 JST** →
  [`japan-cgpi-2026-12-10`](../../../src/domain/market-events/japan-cgpi-2026-12-10.json)
  (`estimate`, low).
- **Watch (dated)** — **BoJ decision 2026-09-18** (est) · **BoJ decision 2026-10-30** (est) ·
  **September Tankan 2026-10-01** (est, [ledger](boj-tankan-2026-10-01.md) — its DI anchor becomes
  the input to this survey's surprise) · **FOMC 2026-12-09** (confirmed) · **CPI 2026-12-10**
  (confirmed) · **Japan CGPI 2026-12-10** (est, proposed here) · **funding deadline 2026-12-11**
  (est) · **this release 2026-12-14** (est) · **full dataset 2026-12-15** (est) · **BoJ decision
  2026-12-18** (est) + **Japan CPI** + **quad-witching opex** (confirmed).

## Initial research

### The question, plainly

This event was created on 2026-09-05 by the [September Tankan ledger](boj-tankan-2026-10-01.md) for
one reason, stated in its own notes: the March, June and September surveys publish on the first
business day of April, July and October, so a Tankan effect and a quarter-start effect are
**perfectly collinear** on three of the four releases a year, with only two counter-observations in
22 years. **The mid-December survey carries no quarter boundary**, so it was filed as *"the ONLY
clean measurement this calendar can make on the Tankan"* and given a forward test —
**FT-boj-tankan-2026-10-01-3**: a Nikkei opening gap above **0.641%** on 2026-12-14 is *"the first
observation that would genuinely re-open the channel."*

That is a load-bearing designation. So the question here is not the generic one. It is: **is the
clean cut clean, and is 0.641% the right threshold to score it against?**

**One-line verdict: no, twice. The cut's apparent quiet (0.80×) is a December seasonal, not a
Tankan fact — against December's own sessions it is 0.94× at p = 0.77 — and its loud half is a
calendar position: every December Tankan publishes 2–6 days before that year's BoJ decision, the
eight that fall on a Monday all sit at MPM−4, and December sessions at MPM−4 run 2.02× the December
pool with every Tankan day removed leaving 1.76×. Only two December Mondays at MPM−4 lack a Tankan,
which is the same n=2 identification failure that made September unusable — so December swapped one
perfect confound for another, and the registered 0.641% threshold carries a 0.60 breach rate on the
exact cell 2026-12-14 occupies rather than the 0.396 it was calibrated on.**

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) plus
measured legs run entirely in this session, all primaries fetched raw and machine-parsed today
(2026-09-05), never through a summariser:

- the **BoJ's six TANKAN (Summary) year archives** (`…/statistics/tk/gaiyo/{2001,2006,2011,2016,2021,2026}/index.htm`,
  HTTP 200 each), every row parsed to a `(release date, survey)` pair and deduplicated across the
  PDF/ZIP double-listing → **90 releases, 2004-04-01 → 2026-07-01**, of which **22 are December
  surveys**;
- the **forward release schedule** `tkohyos.xlsx` (HTTP 200, 48,500 bytes) unzipped and read
  cell-by-cell out of its `Statistics data` sheet (rows 229-235 for Tankan, row 238 for the CGPI);
- **22 December MPM decision dates**, harvested from the `kYYMMDD` / `mprYYMMDD` statement filenames
  on the Bank's own per-year decision archives (`…/mopo/mpmdeci/mpr_{2004…2025}/index.htm`, HTTP 200
  each) — this is the leg the sibling did not run;
- the **2026 MPM schedule** (`…/mopo/mpmsche_minu/`, HTTP 200, 41,959 bytes), whose 2026 row reads
  verbatim **"Dec. 17 (Thurs.), 18 (Fri.)"**;
- **JPX's market calendar** (HTTP 200, 33,103 bytes), listing no December 2026 Tokyo closure before
  Dec. 31.

Price work uses the same **Yahoo daily bars `event-material-scan.mjs` itself uses** (`^N225`,
`^GSPC`, `JPY=X`, `^VIX`), pulled today as full OHLC from 2003 so 2004+ has a prior close; the
latest bars (**2026-09-04**: VIX **14.53**, Nikkei **65,020.94**, S&P **7,718.60**, USD/JPY
**156.22**) reconcile exactly with the sibling's probe reading. No instrument scripts: `symbols: []`,
there is no issuer, and `earnings-cycle.mjs`/`intraday-edges.mjs` have no macro mode. Every p-value
is a permutation or bootstrap p computed here against the non-Tankan, non-quarter-start session pool
unless a cut names its own matched pool.

### Conviction legs, tested

1. **The sibling replicates on this pipeline — SUPPORTED, and this leg licenses the rest.** All 89
   Nikkei-bar Tankan days: **0.440% vs 0.499% = 0.88×, p = 0.35**; 2016+ (n=41): **0.610% vs 0.476%
   = 1.28×, p = 0.14**; December-only against the all-year pool: **0.399% vs 0.499% = 0.80×,
   p = 0.41 (n=22)** — the exact figure `boj-tankan-2026-12-14.json`'s notes quote. **Every
   disagreement below is about denominators and cells, never about the data.**

2. **The December cut's quiet is December, not the Tankan — SUPPORTED, and it is correction one.**

   | Cut | n | Median \|gap\| | Baseline | Ratio | p |
   |---|---|---|---|---|---|
   | December Tankan vs **all-year** pool | 22 | 0.399% | 0.499% | **0.80×** | 0.41 |
   | December Tankan vs **December** pool | 22 | 0.399% | 0.424% | **0.94×** | 0.77 |
   | December Tankan vs **mid-Dec (10-20)** pool | 22 | 0.399% | 0.456% | 0.87× | 0.62 |
   | **All December sessions** vs all-year pool | 437 | 0.424% | 0.499% | **0.85×** | **0.010** |

   The bottom row is **the only result under p = 0.05 anywhere in this study, and it is a seasonal,
   not a signal.** Against its own month the December Tankan is indistinguishable from an ordinary
   session — which is a *weaker* claim than "0.80×" and the honest one.

3. **December Tankans split by weekday, and 2026 lands in the loud half — SUPPORTED, correction
   two.** 2026-12-14 is a **Monday**; a Monday Tokyo open prices a weekend.

   | Cut | n | Median \|gap\| | Matched pool | Ratio | p |
   |---|---|---|---|---|---|
   | Non-Monday December Tankans | 14 | 0.368% | 0.428% (non-Mon Dec) | 0.86× | 0.63 |
   | **Monday December Tankans** | **8** | **0.947%** | 0.410% (Mon Dec, n=82) | **2.31×** | **0.005** |
   | Monday December Tankans | 8 | 0.947% | 0.573% (all Mondays, n=979) | 1.65× | 0.094 |

   The eight: 2008-12-15 **1.38%** · 2009-12-14 0.19% · 2013-12-16 0.03% · 2014-12-15 **1.50%** ·
   2015-12-14 **1.79%** · 2020-12-14 0.03% · 2021-12-13 0.94% · 2025-12-15 0.95%. **Jackknife:**
   dropping any single one leaves the ratio at **2.29–2.32×**, so no observation carries it.

4. **The mechanism behind Mondays is arithmetic, not information — SUPPORTED.** In the pool, median
   \|gap\| by calendar days since the prior session: **1 day 0.481%** (P(≥0.641%) = 0.372) · **3 days
   0.573%** (0.461) · **4 days 0.580%** (0.465) · **2 days 0.839%** (0.639). Tokyo Mondays carry a
   median **3** days of accumulation against **1** for every other weekday, and gap 1.15× as a
   result. **This is why leg 3 compares Mondays to Mondays** rather than to the all-session pool the
   0.641% threshold came from.

5. **Every December Tankan publishes into the run-up to that year's BoJ decision — SUPPORTED,
   primary, and new to this calendar.** Spacing from the December Tankan to that year's December MPM
   decision statement, 2004-2025: **22 of 22 fall in 2–6 calendar days** (2 days ×2, 4 days ×9,
   6 days ×11; min 2, max 6). All **eight** Monday releases sit at exactly **MPM−4**, with the
   decision on that Friday. **2026 repeats the configuration precisely:** Tankan Mon 2026-12-14 →
   decision Fri 2026-12-18, per the Bank's own schedule row **"Dec. 17 (Thurs.), 18 (Fri.)"**.

6. **And the loud cell is that position, with the Tankan removed — SUPPORTED, and it is the leg that
   dissolves the "clean cut."**

   | Cut | n | Median \|gap\| | vs December pool (0.424%) | p |
   |---|---|---|---|---|
   | December sessions at **MPM−4**, all | 15 | 0.854% | **2.02×** | **0.003** |
   | December sessions at MPM−4, **ex-Tankan** | 6 | 0.744% | **1.76×** | 0.082 |
   | December **Mondays** at MPM−4 | 10 | 0.943% | 2.22× | — |
   | December Mondays **not** at MPM−4 | 80 | 0.405% | 0.96× | — |

   Dec Mondays at MPM−4 vs other Dec Mondays: **2.33×, p = 0.002.** And the pre-MPM week as a whole
   is **not** loud — December sessions at MPM−1…8 ex-Tankan run **0.456%**, MPM−9…30 run 0.494%,
   MPM-day-or-later 0.346% — so the elevation is specific to MPM−4 and rests on 15 observations.

7. **The two cannot be separated, on exactly the n that defeated September — SUPPORTED, and this is
   the honest limit rather than a finding.** Of the 10 December Mondays at MPM−4, only **two** carry
   no Tankan: **2004-12-13 (0.63%)** and **2005-12-12 (0.95%)** — both above the 0.641% threshold,
   both indistinguishable from the eight that do. The sibling wrote that the Apr/Jul/Oct cuts can
   never be clean because *"at n=2 the quarter-start effect and the Tankan effect are not separable
   on those dates by any test."* **December's Monday cut fails identically, at the identical n.**
   The clean cut is not clean; it is confounded with a different thing.

8. **The registered threshold measures the calendar, not the release — SUPPORTED, and it is the
   practical consequence.** P(\|gap\| ≥ **0.641%**): all 2004+ sessions **0.396** · non-Tankan pool
   0.395 · all Tankan days 0.382 · December Tankans **8/22 = 0.364** · **December Mondays 0.278
   (n=90)** · December Mondays ex-Tankan **0.244 (n=82)** · **December Mondays at MPM−4 6/10 =
   0.600** · December Tankan Mondays **5/8 = 0.625**. FT-boj-tankan-2026-10-01-3 reads a breach as
   re-opening the channel on the strength of a 0.396 base rate. **On the cell 2026-12-14 occupies
   the honest null rate is 0.244 (if this release does nothing and the position is noise) or 0.600
   (if the historical cell is the guide) — and a test whose null rate is unknown to within a factor
   of 2.5 cannot adjudicate anything.**

9. **2026's bar is contaminated beyond the historical pattern — SUPPORTED, from the live calendar.**
   The ±5-day corridor returns **18** other tracked entries. **08:50 JST Mon 12-14 = 18:50 EST Sun
   12-13**, so the open prices two US sessions plus a weekend containing
   [FOMC 12-09](fomc-2026-12-09.md) (confirmed, high), [CPI 12-10](cpi-2026-12-10.md) (confirmed,
   high) and the [CR expiry](cr-expiry-2026-12-11.md) /
   [funding deadline 12-11](government-funding-deadline-2026-12-11.md) (est, high) — the single most
   loaded pre-weekend this calendar tracks in Q4. [G20 Miami](g20-miami-2026-12-14.md) (est, medium)
   shares the date. **The direction of that loading is toward a breach**, which is exactly why leg 8
   matters before the fact rather than after it.

10. **Whatever moves happens in the auction and does not persist — SUPPORTED.** December Tankan days:
    Nikkei \|intraday\| (\|close ÷ open − 1\|) **0.288% vs a 0.492% pool median = 0.59×, p = 0.13**,
    **15/22** below the pool median; Monday-matched, **6/8** below it (December Monday non-Tankan:
    50/82). Nikkei \|c2c\| **1.00×**, S&P \|c2c\| **1.12× (p = 0.71)**, USD/JPY \|c2c\| **1.33×
    (p = 0.23)**. **This has never been a US equity event or an FX event**, and it is not a
    full-session Tokyo event either.

11. **The era split is thin in December and points nowhere — SUPPORTED, reported for completeness.**
    December-only Nikkei \|gap\| vs each era's own baseline: **2004-2010 0.50× (n=7) · 2011-2015
    1.49× (n=5) · 2016-2020 0.75× (n=5) · 2021-2026 1.11× (n=5).** At n=5 per era these are noise;
    the sibling's headline 2021-2026 elevation (1.37× on all releases) **does not reproduce in
    December**.

12. **The schedule is primary and internally validated — SUPPORTED.** `tkohyos.xlsx` row 231 gives
    the Dec.-Survey serial **46370 = 2026-12-14** for "Summary and Outline" at 8:50 a.m.; the same
    row's June serial **46204 = 2026-07-01** matches an already-published release, so the decoding is
    checked against an observation. Rows 233/235 put the **Comprehensive Data Set** and **Long-Term
    Time-Series** at **46371 = 2026-12-15**. The Bank's methodology page states the survey is
    released *"at the beginning of April, July, October, and mid-December in principle (released at
    8:50 a.m. Japan Standard Time)"*, and all 22 December releases since 2004 landed on the **13th
    through 16th**. JPX lists no December 2026 Tokyo closure before Dec. 31.

13. **No tracked symbol carries a channel this calendar instruments — SUPPORTED, inherited.**
    `symbols: []`. The house playbooks (S1/S2/E1/S3/S4 + G1,
    [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed; none is
    rates- or FX-keyed.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2026-12-14. Four rules:

- **Read-only.** This entry's marginal value is a correction to a *scoring rule* that already
  exists, delivered before the score — not a view on the DI or the tape.
- **Amend the sibling's designation, do not reverse it.** "December is the one structurally clean
  cut" should become **"December is free of the quarter-start confound and collinear with MPM−4
  instead; its Monday releases are the loud half and cannot be separated from that position at
  n=2."** The sibling's *conclusion* — no measurable Tankan channel — survives intact and is if
  anything strengthened: leg 6 shows the December elevation surviving the removal of every Tankan
  day.
- **Never score 2026-12-14 as a verdict on this release**, in either direction. Leg 9 says the open
  prices an FOMC, a CPI print and a US funding deadline over a weekend before it prices anything the
  Bank of Japan published at 08:50.
- **The next genuinely clean observation is a non-Monday December Tankan away from MPM−4** — and on
  the Bank's own pattern that combination may not exist, which is the finding, not a to-do.

### Honest limits

**Every headline here is a null or a confound, and both are weak claims.** 0.94× at p = 0.77 is "not
distinguishable from an ordinary December session," not "proven inert." **The MPM−4 cell is n=15
(n=6 ex-Tankan) and its p-values are unadjusted.** This session ran roughly **30** cuts; a
Bonferroni haircut over 30 turns p = 0.002-0.005 into 0.06-0.15 and p = 0.082 into nothing. Two
things partially defend it: the Monday/MPM−4 cell was selected **a priori from 2026-12-14's own
calendar position** — its weekday and its MPM spacing were known before any statistic was computed,
which is conditioning on a known covariate rather than dredging — and the median at n=8 is
jackknife-stable. Neither makes it significant. **The n=2 counterfactual is fatal by construction:**
two non-Tankan December Mondays at MPM−4 cannot separate a position effect from a release effect,
and this ledger claims only that the separation is impossible, never that the position wins.
**Why MPM−4 rather than the pre-MPM week generally is unexplained** — the week as a whole is not
elevated, which is either a real anticipation-window effect or 15 observations of nothing, and this
data cannot tell. **The December MPM dates are harvested from statement filenames** (`kYYMMDD`),
which encode the decision date reliably across 22 years but were not cross-read against each
statement's own text. **No DI-surprise leg is run here.** The sibling measured Spearman(\|surprise\|,
\|gap\|) = +0.17 (p = 0.44) across 22 machine-readable releases; the December subset is n=5, too
small to report, and this survey's own anchor — the September 2026 survey's published forecast —
does not exist until 2026-10-01. **Pooling 2004-2026 spans several BoJ regimes**, every p is a
same-day association rather than a causal identification, and the bootstrap draws i.i.d., ignoring
volatility clustering. **The date is `estimate`** despite a primary source, per the taxonomy. And
this is **D-100** initial research on a survey that has not entered the field: nothing here forecasts
the DI, only what the print is worth to a book that does not trade it.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside completely**, and **pre-commit the interpretation of
2026-12-14 before the observation exists.** No position, no play, no size, in any branch. Three
analytical positions, none of them positional.

First, **the designation this event was created under does not survive measurement.** It was filed
as *"the ONLY clean measurement this calendar can make on the Tankan"* because December carries no
quarter boundary. It carries a different one. **All 22 December Tankans since 2004 published 2-6
calendar days before that year's December BoJ decision — 22/22** — and the eight that fell on a
Monday sit at exactly **MPM−4**, the configuration **2026-12-14 → 2026-12-18 reproduces**. December
sessions at MPM−4 run **2.02× the December pool (p = 0.003)** and **1.76× with every Tankan day
removed (n=6, p = 0.082)**, while only **two** December Mondays at MPM−4 lack a Tankan — the same
**n=2** that made September's quarter-start cut unusable. High confidence on the spacing rule
(primary, 22/22); **Medium** on the position effect, which is 15 observations and unadjusted.

Second, **the sibling's 0.80× was a denominator artifact and its threshold is calibrated to the
wrong population.** Against December's own sessions the December Tankan is **0.94×, p = 0.77**; the
0.80× came from comparing December to the whole year, and **all** December sessions run **0.85×,
p = 0.010**. The registered threshold (**0.641%**, from an all-session pool with a 0.396 breach rate)
faces a breach rate of **0.244** on December Mondays generally and **0.600** on December Mondays at
MPM−4. **A test whose null rate is uncertain to a factor of 2.5 cannot adjudicate the hypothesis it
was written for.**

Third, **the sibling's actual conclusion is untouched and mildly strengthened.** "No measurable
Tankan channel" stands: the non-Monday December releases run **0.86× (p = 0.63)**, the day's
intraday range runs **0.59×**, the S&P and the yen show nothing, and the one loud cell survives
deleting every Tankan day from it. **What is struck is the promise that December could re-open the
channel** — it cannot, because the observation it offers is confounded before it is taken.

**Kill switches:**

- **Date kill (registered):** the Bank publishing the December 2026 Tankan on any date other than
  **2026-12-14**, or at any time other than **08:50 JST**, or the Comprehensive Data Set on any date
  other than **2026-12-15**. Registered as **FT-boj-tankan-2026-12-14-1**, score by **2026-12-16**.
  Re-check every pulse against `boj.or.jp/en/statistics/outline/`.
- **Spacing kill (registered):** the Bank's December 2026 decision statement landing outside
  **2026-12-16 … 2026-12-20**, breaking the 22/22 "Tankan 2-6 days before the December MPM" rule
  this ledger derives — the rule is the entire basis for calling December confounded. Registered as
  **FT-boj-tankan-2026-12-14-2**, score by **2026-12-21**.
- **Recalibration kill (registered):** the **2026-12-14** Nikkei opening gap landing **at or below
  0.641%**. This ledger predicts a **breach** on the matched cell's 0.600 base rate; a pass means my
  correction over-fit 10 observations and the sibling's test stood on its own terms. **Low**
  confidence — a low-confidence call is a stand-aside, never a small bet. Registered as
  **FT-boj-tankan-2026-12-14-3**, score by **2026-12-15**.
- **Persistence kill (registered):** the **2026-12-14** Tokyo **intraday** range
  (\|close ÷ open − 1\|) exceeding **0.492%** (the pool median). December Tankan days sit below it
  15/22, Monday-matched 6/8; a move that survives the auction is the one shape this study has never
  seen and would be the first honest sign of repricing rather than accumulation. Registered as
  **FT-boj-tankan-2026-12-14-4**, score by **2026-12-15**.
- **Position kill:** a December Tankan appearing **outside** the MPM−2…6 window in a future year, or
  a December MPM moving off the third full week — either creates the counterfactual this study
  lacks, and the next such year is the observation that could still separate release from position.
  Re-check every pulse.
- **Anchor kill:** the Bank ceasing to publish the prior-survey forecast alongside the actual, or
  changing the headline DI's construction — the surprise leg the sibling ran (and this one defers
  for n) would stop being extendable. Re-check every pulse.
- **Attribution kill:** any 2026-12-14 Tokyo move being credited to the Tankan, in this repo or
  outside it, without first ruling out the FOMC/CPI/funding-deadline weekend (leg 9) and the MPM−4
  position (legs 5-7). If a future session writes it anyway, this ledger is the receipt.
- **Channel kill (tracked names):** a tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any
  session **2026-09-05 → 2026-12-13** that the tape attributes to a BoJ Tankan. Leg 13's claim would
  be false. Re-check every pulse.

Four forward tests registered in
[`forward-tests/boj-tankan-2026-12-14.md`](../forward-tests/boj-tankan-2026-12-14.md) — **-1** (the
release date and minute), **-2** (the 22/22 MPM-spacing rule), **-3** (the recalibration, predicting
the sibling's threshold breaks) and **-4** (the move does not survive the auction). One dated
adjacent event proposed as `estimate` in the same PR:
[`japan-cgpi-2026-12-10`](../../../src/domain/market-events/japan-cgpi-2026-12-10.json).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-100 | Initial research banked (above). **This event was filed yesterday as "the ONLY clean measurement this calendar can make on the Tankan" — no quarter-start collinearity — and given a forward test on that basis. It is not clean.** *Scaffold:* the Bank's six TANKAN (Summary) archives re-parsed today (HTTP 200 each) → **90 releases, 2004-04-01 → 2026-07-01, 22 of them December surveys**; `tkohyos.xlsx` (HTTP 200, 48,500 bytes) unzipped, row 231 serial **46370 = 2026-12-14** at 8:50 a.m., rows 233/235 serial **46371 = 2026-12-15** for the Comprehensive Data Set (June serial 46204 = 2026-07-01 validates the decoding); **22 December MPM decision dates** harvested from `kYYMMDD` statement filenames on the Bank's per-year decision archives — a leg the sibling never ran. **Finding 1 — the denominator was wrong.** December Tankan Nikkei \|opening gap\| is 0.399% = **0.80× an all-year pool (p = 0.41)**, the figure this event was filed on, but **0.94× against December's own sessions (0.424%, p = 0.77)** — because **all** December sessions run **0.85×, p = 0.010 (n=437)**, the only sub-0.05 cut in this two-ledger study. The quiet was a month. **Finding 2 — the weekday splits it, and 2026 is a Monday.** Non-Monday December Tankans (n=14) **0.368% = 0.86×, p = 0.63**; Monday ones (n=8) **0.947% = 2.31× the 82 non-Tankan December Mondays, p = 0.005**, jackknife-stable **2.29-2.32×**. Mechanism is arithmetic: pool gap by days since the prior bar runs 1d **0.481%** · 3d **0.573%** · 2d 0.839%, and Tokyo Mondays carry a median 3 days against 1 elsewhere. **Finding 3 — the loud cell is the calendar position, not the survey.** **22/22** December Tankans published **2-6 calendar days** before that year's December MPM decision (2d ×2, 4d ×9, 6d ×11); all **8** Monday releases sit at **MPM−4** with a Friday decision — and **2026 repeats it exactly** (BoJ schedule row, fetched today: **"Dec. 17 (Thurs.), 18 (Fri.)"**). December sessions at MPM−4: **n=15, 0.854% = 2.02× the December pool, p = 0.003**; **ex-Tankan n=6, 0.744% = 1.76%, p = 0.082**; Dec Mondays at MPM−4 vs other Dec Mondays **2.33×, p = 0.002**. The pre-MPM week as a whole is NOT loud (MPM−1…8 ex-Tankan **0.456%** ≈ December baseline), so it is MPM−4 specifically, on thin n. **Finding 4 — the identification failure is September's, verbatim.** Only **2** of the 10 December Mondays at MPM−4 lack a Tankan — 2004-12-13 (**0.63%**) and 2005-12-12 (**0.95%**), both above the threshold, both indistinguishable from the eight that carry one. **n=2 identifies nothing**, which is the sibling's own words about quarter-start. **Finding 5 — the registered threshold measures the calendar.** P(\|gap\| ≥ **0.641%**): all sessions **0.396** · all Tankan 0.382 · December Tankan **8/22 = 0.364** · December Mondays **0.278** · December Mondays ex-Tankan **0.244** · **December Mondays at MPM−4 6/10 = 0.600** · December Tankan Mondays 5/8. FT-boj-tankan-2026-10-01-3 reads a breach as re-opening the channel against a 0.396 null; the honest null on this cell is 0.244 or 0.600. **Finding 6 — nothing persists past the auction.** Nikkei \|intraday\| on December Tankan days **0.288% vs 0.492% = 0.59×, p = 0.13** (15/22 below the pool median, 6/8 Monday-matched); Nikkei \|c2c\| 1.00×, S&P \|c2c\| **1.12× (p = 0.71)**, USD/JPY **1.33× (p = 0.23)**. December-only era split is n=5 per era and reproduces nothing (0.50× / 1.49× / 0.75× / 1.11×). Adjacency sweep: **peers** — none, `symbols: []`, no tracked-name print on this bar. **Macro** — **18** tracked entries in the ±5d corridor; **08:50 JST Mon 12-14 = 18:50 EST Sun 12-13**, so the open prices a weekend carrying [FOMC 12-09](fomc-2026-12-09.md) (confirmed, high), [CPI 12-10](cpi-2026-12-10.md) (confirmed, high) and the [CR expiry](cr-expiry-2026-12-11.md)/[funding deadline](government-funding-deadline-2026-12-11.md) 12-11 (est, high); [G20 Miami](g20-miami-2026-12-14.md) shares the date; 12-18 stacks [BoJ](boj-decision-2026-12-18.md) + [Japan CPI](japan-cpi-2026-12-18.md) + [quad-witching](opex-2026-12-18.md). **The 2026 loading runs toward a breach**, which is why Finding 5 is banked before the fact. **Volatility** — VIX **14.53**, Nikkei **65,020.94**, S&P **7,718.60**, USD/JPY **156.22** (2026-09-04 closes, Yahoo; reconciles with the sibling's probe). **Geopolitical** — nothing new beyond the channels the [09-18 decision ledger](boj-decision-2026-09-18.md) owns. **Event tape** — the 09-18 decision is ~80-84% priced to hike 1.0%→1.25%; a hiking cycle raises the stakes on the December MPM this survey feeds, which sharpens Finding 3 rather than softening it. **Proposed:** Japan's **Corporate Goods Price Index (Nov 2026)**, same schedule sheet row 238, serial **46366 = 2026-12-10** at 8:50 a.m. → [`japan-cgpi-2026-12-10`](../../../src/domain/market-events/japan-cgpi-2026-12-10.json) (`estimate`, low). **Own weaknesses:** ~**30** cuts run and every p is unadjusted — Bonferroni over 30 turns 0.002-0.005 into 0.06-0.15 and 0.082 into nothing; the Monday/MPM−4 cell was chosen **a priori from 2026-12-14's own weekday and MPM spacing** (conditioning on a known covariate, not dredging) and is jackknife-stable, neither of which makes it significant; the n=2 counterfactual is fatal by construction, so this ledger claims only that release and position are inseparable, never that position wins; MPM−4 being loud while the pre-MPM week is not is unexplained at n=15; MPM dates come from statement filenames, not statement text; **no DI-surprise leg** (the December subset of machine-readable releases is n=5, and this survey's anchor does not exist until 2026-10-01); 2004-2026 pools several BoJ regimes; the bootstrap draws i.i.d.; the date is `estimate` despite a primary source. | — (stance set: stand aside, no position, no play; **the "one clean cut" designation this event was created under does not survive — December trades a quarter-start confound for an MPM−4 confound (22/22 December Tankans publish 2-6 days before that year's decision; the 8 Monday releases all sit at MPM−4; December MPM−4 sessions run 2.02× the December pool and 1.76× with every Tankan day deleted; only 2 counter-observations exist)**, and **the sibling's 0.641% threshold carries a 0.244-0.600 breach rate on this cell rather than the 0.396 it was calibrated on**. **High** on the spacing rule (primary, 22/22), **Medium** on the position effect (n=15, unadjusted). Three commitments — **amend** "the one structurally clean cut" to "free of quarter-start, collinear with MPM−4, inseparable at n=2"; **pre-commit** that a 2026-12-14 gap above 0.641% is not evidence of a Tankan channel, before the observation exists; and note the sibling's *conclusion* — no measurable channel — is untouched and mildly strengthened, since the loud cell survives deleting every Tankan day from it) | 2026-09-26 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
