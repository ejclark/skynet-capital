# New Residential Sales (November 2026 data) — new-home-sales-2026-12-23

**Kind:** macro-print · **Date:** 2026-12-23 (**confirmed**, `CENSUS:` two independent census.gov primaries — `economic-indicators/calendar-listview.html` row `A202612231000`/`A202611` and `construction/soc/schedule.html`'s terminal row "November 2026 | December 17, 2026 | December 23, 2026" under "(17th Workday) … New Residential Sales - 10:00 a.m.", both fetched direct 2026-09-06; promoted this session from the `EST:` proposal) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-decision-2026-12-18","boj-minutes-2026-12-23","boj-summary-of-opinions-2026-12-28","christmas-eve-half-day-2026-12-24","durable-goods-2026-12-23","gdp-q3-2026-third-2026-12-23","intl-transactions-q3-2026-12-18","japan-cpi-2026-12-18","japan-cpi-tokyo-flash-2026-12-25","opex-2026-12-18","pce-2026-12-23","sifma-japan-early-close-2026-12-28","sifma-uk-bond-market-closure-2026-12-28"],"screenStreak":0,"blocked":[{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=HSN1F","status":"TIMEOUT","at":"2026-09-06"},{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=MSPNHSUS","status":"TIMEOUT","at":"2026-09-06"},{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US","status":"TIMEOUT","at":"2026-09-06"},{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=MSACSR","status":"TIMEOUT","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **This is the exposed half of the 12-17/12-23 pair, and the one thing worth reading off it is
unreadable on the day it prints.** Two corrections the corridor needs. **The schedule statistic does not
transfer from the twin.** New Residential Sales ran a different calendar before 2001 — **78 of 202**
pre-2001 editions published *two* months after their reference month — so the housing-starts lane's "9 of
514 slips since 1984" is not this series' number. On the modern 17th-workday regime (**n=312**, reference
2000-12 onward) this print slipped out of month **12** times against the twin's **9**, and the **three
extra slips are exactly the cases where the twin printed and this one did not**. The precedent that
matters is **2018**: the Nov-2018 edition was due on the 17th workday, **2018-12-26**; the lapse began
**2018-12-22**; it published **2019-01-31**, a **36-day** slip — while its New Residential Construction
twin had printed on time on **12-18**, four days before onset. 2026 straddles `cr-expiry-2026-12-11` the
same way: the twin is 6 days past it, **this print is 12**. **And the nowcast line is not readable here.**
The Atlanta Fed's **2026-12-23 10:00** vintage reads *"GDP (Q3 3rd estimate), Personal income and outlays,
NIPA underlying detail tables, Advance Census manufacturing (M3-1), New-home sales"*; across the **10**
historical vintages of that exact shape the residential contribution was the largest of the eight
component moves **0 times** (PCE took it 7), and the headline moved **0.4207pp** against **0.0528pp** on a
solo new-home vintage. That is not a 12-23 accident: solo new-home vintages ran **91 of 132 (68.9%)**
across 2014–2025 and are **2 of 10** in 2026, with **none** of the four remaining scheduled editions solo.
The tape says stand aside and now says it with the right metric — on Census's own **515** release dates the
**overnight gap is null** (ITB p=**0.84**), correct for a 10:00 print, while the **session range** was real
through 2015 (2010–15 ITB **2.443% vs 2.063%**, p=**0.0061**) and has been null for eleven years
(2016–20 p=0.36; 2021–26 p=0.30). Date is `confirmed` on two Census primaries; `symbols: []`.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-108) | **Stand aside** | High | `symbols: []` is a measurement with a date on it. Across **239** ITB and **242** XHB release days back to 2006 — Census's own file, not a derived cadence — the metric matched to a **10:00** print (session range) is null in both post-2015 eras (ITB **2016–20 p=0.36**, **2021–26 p=0.30**; XHB 0.26, 0.24) and the 08:30 metric never fires at all (ITB gap p=**0.84**). A re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** macro- or housing-keyed hits today. | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-12-01** — none exists today |
| This week | **Stand aside — and note the next edition, 2026-09-24, owns no GDPNow vintage at all** | High | The Atlanta Fed's `PostedUpdates` sheet schedules **no** vintage on 2026-09-24 (the surrounding rows are 09-17 "Housing starts" and 09-25 "Advance Census manufacturing"), so the August-data print has no nowcast channel to read and no tape effect to watch. Current edition is **CB26-128** (July data, 2026-08-25): **607,000** SAAR, **−10.5% (±14.0%)\*** m/m. VIX **14.53**, SPY **770.19**, ITB **93.91** (2026-09-04 closes). | Census moving or suspending the **2026-09-24** slot on either of its own schedules before that date — both carried it today |
| This month | **Do not carry "read the residential line" into 2026 — the readable edition has disappeared** | High | Residential is the largest of eight component moves **97.8%** of the time on a **solo** new-home vintage (n=93) and **25%** on an M3-paired one (4 of 16). Solo editions ran **68.9%** of vintages 2014–2025 and **2 of 10** in 2026; per `PostedUpdates`, **none** of 09-24 (no vintage), 10-27 (M3-paired), 11-25 or 12-23 (GDP+PCE) is solo. | Any GDPNow vintage between now and **2026-12-23** posting new-home sales alone — `PostedUpdates` schedules none, so one would mean the Atlanta Fed re-cut the calendar |
| This quarter | **Treat publication as the open question, and expect this twin to be the one that breaks** | Medium | On the modern regime this series slipped out of month **12/312** against the twin's **9/312**, all 12 lapse-driven, and the **three extra are cases where the twin printed on time**. 2018 is the exact geometry: due **12-26**, lapse **12-22**, published **2019-01-31** (**36 days**), twin unaffected. Medium, not high: this is a forecast about Congress and this session did not verify FY2027 appropriations status. | The **2026-12-23** release publishing on schedule with no lapse having occurred — the base case, and `-1` is registered on exactly that |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** The tape effect died after 2015 on both sector ETFs
  and both post-2015 eras; no macro- or housing-keyed playbook exists. Research is not action.
- **Do not read the 12-23 GDPNow residential line as this print's.** On the **10** GDP-estimate + personal-
  income + M3 + new-home vintages, residential was the largest move **0 times** and PCE took it **7**.
  Registered as `-2`.
- **A quiet 12-23 in homebuilders is the Christmas week, not this print.** The **14** New Residential Sales
  releases that have landed in the Dec 21–23 window ran a median ITB session range of **1.216%** against a
  **2.095%** ordinary-session baseline — **42% narrower**. Registered as `-3`.
- **Believe the error bar before the number.** **9 of the 10** headline changes in the current release carry
  Census's "the 90-percent confidence interval includes zero" asterisk, and Census's own explanatory note
  says *"It takes 4 months to establish a trend for new houses sold."* Registered as `-4`.
- **If the cliff bites, expect deferral-and-merge, not deletion.** Census's calendar carries exactly **4**
  `Suspended` rows today and none is this series; its announcements page instead records three merged pairs
  in Census's own words. Registered as `-1`.
- **Watch (dated)** — August data **09-24** (no GDPNow vintage) · September data **10-27** (M3-paired) ·
  October data **11-25** · **CR expiry 12-11** · housing starts **12-17 08:30** · opex **12-18** ·
  **12-23 08:00 revised building permits, 08:30 durable goods + PCE + GDP Q3 third, 10:00 this print and
  its GDPNow vintage** · Christmas Eve half day **12-24** · December data ~**2027-01-2x** (2027 schedule
  unpublished).

## Initial research

### The question, plainly

This id reached the calendar as a single `EST:` proposal from
[`housing-starts-2026-12-17`](housing-starts-2026-12-17.md)'s sweep, which explicitly deferred the analysis:
*"NOT researched by this lane beyond the date and the wiring — a future never-assessed session owns the
analysis, and should measure the new-home-sales vintages' own residential signature the way this lane did
for starts."* It also carried three claims worth testing rather than inheriting: that `valNewHomeSales` is
*"the other half of `valTotalHomeSales`"*, that this print *"sits TWELVE days past `cr-expiry-2026-12-11`,
so it is the corridor's deepest test of a funding lapse on this survey"*, and that the twin's 42-year slip
statistic bears on it.

A second lane had already looked at this exact date and reached the opposite conclusion:
[`durable-goods-2026-12-23`](durable-goods-2026-12-23.md) *declined* to propose it — *"a same-day Census
release, but no tracked name has housing exposure and no argument beyond co-location."* The housing-starts
lane's criterion (a series this calendar tracks **nowhere**) is the one that carried, and it is the right
one; the durable lane's objection is nonetheless the honest summary of the tape finding below.

**Does Census's own calendar carry the date; is the twin's slip statistic this series' statistic; what does
this print actually move in GDPNow on 12-23 specifically; and does it move anything on the tape?**

**One-line verdict:** the date is Census's own on two primaries and promotes to `confirmed`; the twin's slip
statistic **does not transfer** and the corrected one is worse for this print; the wiring claim is right but
its weight is a **sixth**, not a half; and the nowcast line — the only reading either sibling recommends —
is measurably **unreadable on 2026-12-23**.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies to the event; both caches were busted anyway
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) because the tape work below
uses a Yahoo daily-bar pull. Nine inputs, all fetched direct on 2026-09-06:

1. **`census.gov/economic-indicators/calendar-listview.html`** (HTTP 200, 91,396 bytes, **179** table rows
   parsed) — every 2026 Census release with its code, reference month and any `Suspended` marker.
2. **`census.gov/construction/soc/schedule.html`** (HTTP 200, 59,625 bytes) — the Survey of Construction's
   own program schedule, which publishes both halves of the pair in one table.
3. **`census.gov/construction/xls/historic_release_dates.xls`** (HTTP 200, 55,808 bytes) — **515 rows,
   1984-01 → 2026-11**, every New Residential Construction *and* New Residential Sales press-release date
   Census has ever published. Legs 1 and 2 rest on this file, read for the **NRS** column the twin's ledger
   did not use.
4. **`census.gov/construction/nrs/pdf/newressales.pdf`** (HTTP 200, 244,803 bytes) — release **CB26-128**,
   read for content, confidence intervals and the explanatory notes.
5. **`census.gov/construction/nrs/index.html`** (HTTP 200, 496,065 bytes) and
   **`/construction/nrs/announcements.html`** (HTTP 200, 100,416 bytes) — the bureau's own notes on the
   merged releases and on the 2024 Christmas Eve closure.
6. **`census.gov/construction/nrs/xls/sold_cust.xls`** (HTTP 200, 148,992 bytes) — the monthly
   seasonally-adjusted sales series, **732 observations 1963-01 → 2023-12**, used for the base rate in the
   content read. *This file stands in for FRED's `HSN1F`, which could not be fetched — see the blocked note.*
7. **`GDPTrackingModelDataAndForecasts.xlsx`** (**10,875,424 bytes**) — the `Residential` sheet for wiring,
   `ContribArchives` for **1,871 vintages 2014-05-01 → 2026-07-28** = **1,822** same-quarter deltas.
   **`GDPNowcastDataReleaseDates.xlsx`** (**16,944 bytes**) — `PostedUpdates`, 83 rows.
8. **Yahoo daily bars** with highs and lows for SPY (n=8,458 to 2026-09-04), QQQ, ITB, XHB, `^VIX`, DHI,
   LEN and PHM, with 20,000-iteration permutation tests on medians.
9. **A reconstructed federal-holiday set** for the workday arithmetic in Leg 1, validated against 300
   on-schedule modern releases.

**Blocked, recorded rather than substituted silently.** `fred.stlouisfed.org/graph/fredgraph.csv` **timed
out on four series** (`HSN1F`, `MSPNHSUS`, `MORTGAGE30US`, `MSACSR`) across three attempts — curl over
HTTP/2 (`INTERNAL_ERROR`), curl over HTTP/1.1 (90 s timeout) and a node fetch (60 s abort). All four are in
`probe-ref.blocked`. Two consequences stated plainly: the base rate in the content read below comes from
**Census's own `sold_cust.xls`**, whose terminal observation is **2023-12** rather than FRED's live tip, and
is labelled with that vintage everywhere it appears; and the 30-year mortgage rate the two sibling ledgers
carry (**6.71%**, 2026-09-03) is **carried from them, not re-fetched by this session** — it is not used in
any measurement here. Two further Census endpoints were probed and are recorded for the next session:
`api.census.gov/data/timeseries/eits/ressales` returns a **"Missing Key"** HTML page at HTTP 200 (an API key
is required), and `census.gov/econ/currentdata/export/csv` returns **400** for this program.

**Cross-checks that the instruments were read correctly.** Daily closes reproduce all three sibling ledgers
exactly — SPY **770.19**, QQQ **718.96**, VIX **14.53**, ITB **93.91**, XHB **103.25**, DHI **142.75**,
LEN **83.58**, PHM **124.45** (2026-09-04). The GDPNow archive reproduces both published residential
figures exactly: **140** existing-home vintages at **0.0376pp** and **143** housing-starts vintages at
**0.0609pp**, and the [11-25 sibling's](new-home-sales-2026-11-25.md) own two headline numbers — solo
new-home |Δ residential| **0.0543pp** and |Δ headline| **0.0528pp** — come back identical. Four ledgers are
reading one archive.

### Leg 1 — the date · **SUPPORTED**, and promoted to `confirmed`

Two independent census.gov primaries. The bureau-wide calendar carries the row with its machine codes:

> New Residential Sales | **December 23, 2026** | 10:00 AM | **November 2026** | `A202612231000` | `A202611`

The program's own schedule carries it independently, in the same table as the twin:

> **November 2026** | December 17, 2026 | **December 23, 2026**

under the column heads **"(12th Workday) New Residential Construction - 8:30 a.m."** and **"(17th Workday)
Revised Building Permits - 8:00 a.m. / New Residential Sales - 10:00 a.m."**

**Status promoted `estimate` → `confirmed`, prefix `EST:` → `CENSUS:`,** on the two-primary precedent this
calendar already carries for [`durable-goods-2026-12-23`](durable-goods-2026-12-23.md) and
[`housing-starts-2026-12-17`](housing-starts-2026-12-17.md). Per the lane's hard limits a flip requires a
primary source and these are two; per the date policy it licenses nothing.

**Two corroborations beyond the promotion.** Census's own `historic_release_dates.xls` carries the same date
in its terminal row (reference 2026-11 → NRC 2026-12-17, **NRS 2026-12-23**), and the Atlanta Fed's
`PostedUpdates` sheet schedules a GDPNow vintage at **2026-12-23 10:00** naming *"New-home sales"*.

**The workday arithmetic fits this series better than it fits the twin.** Across the **300** on-schedule
modern releases, this print lands on the **17th** workday **179** times, the 18th **92**, the 19th **17**,
and 299 of 300 fall in a 16th–21st band. The 17th workday of December 2026 computes to **exactly 2026-12-23**
— an ordinary placement, and a cleaner fit than the twin's, whose 12-17 date is the **13th** workday rather
than the 12th (its own ledger records that, and 105 of 505 of its releases land there).

### Leg 2 — the funding cliff · the twin's statistic is **REFUTED as this series' statistic**, and the corrected one is worse

This is the load-bearing leg, and it is the one the proposal got directionally right for the wrong reason.

**The pre-2001 regime break, which is why the twin's number cannot be borrowed.** Census's 515-row file
carries both columns. Reading the **NRS** column, **78 of 202** editions with a reference month before
2000-12 published **two** months after their reference month, not one — the release used to sit on ~the 2nd
of the second following month rather than on the 17th workday of the first. A naive "out of the month after
the reference month" test therefore returns **90** slips, and 78 of them are simply the old schedule. The
regime changes cleanly in early 2001 and has held since.

**The corrected statistic, on the modern regime only (reference 2000-12 → 2026-11, n=312):**

| | Out-of-month slips | Of |
|---|---|---|
| New Residential **Construction** (the twin) | **9** | 312 |
| New Residential **Sales** (this print) | **12** | 312 |

**All 12 belong to the three federal funding lapses. Nothing else has moved this schedule in 25 years.**
And the three extra are the interesting ones — they are exactly the cases where **the twin printed on time
and this print did not**:

| Reference month | Twin (NRC) | This print (NRS) | Twin status |
|---|---|---|---|
| 2013-10 | 2013-11-26 | 2013-12-04 | **printed in the right month** |
| **2018-11** | **2018-12-18** | **2019-01-31** | **printed on time, 8 days earlier** |
| 2026-03 | 2026-04-29 | 2026-05-05 | **printed in the right month** |

**2018 is this print's exact geometry, and it is the whole leg.** The Nov-2018 edition was due on the 17th
workday of December 2018, which computes to **2018-12-26**. The lapse began **2018-12-22**. The twin had
already published on **12-18**, four days *before* onset. This print published **2019-01-31** — a **36-day**
slip, and a **64-day** gap from the prior release. In 2026 the pair straddles `cr-expiry-2026-12-11` the
same way, with a wider margin: the twin is **6** days past the cliff, this print is **12**. Being later in
the month is not a mild difference here; it is the mechanism by which one twin survives a lapse and the
other does not.

**The response is deferral-and-merge, in Census's own words for this series.** Census's calendar carries
exactly **four** `Suspended` rows today (Preliminary Steel Imports ×2, Advance Economic Indicators ×2) and
none is this one. The NRS column instead shows four duplicated release dates — 2013-12-04, 2026-01-13,
2026-02-20 and 2026-05-05, each carrying two reference months — and the program's announcements page says so
verbatim: *"1/13/26 - The October New Home Sales release also contains initial estimates for the month of
September"*, *"2/20/26 - The December New Home Sales release also contains initial estimates for the month
of November"*, *"5/5/26 - The March New Home Sales release also contains initial estimates for the month of
February."* The 2025–26 episode cost this series **111 dark days** (2025-09-24 → 2026-01-13); the 2013 and
2018–19 episodes cost **70** and **64**.

**A second, non-lapse schedule risk, precedented and dated — and it does not bind this year.** The same
announcements page records: *"12/20/24 - Due to the executive order issued by President Biden closing the
federal government on December 24, 2024, the U.S. Census Bureau will release the New Residential Sales
report on Monday, December 23, 2024 at 10:00 a.m. The original release date was scheduled for Tuesday,
December 24."* So a Christmas Eve federal-closure order can move this print — and the one precedent moved it
**earlier**, not later. In 2026 the scheduled date is already 12-23 and Christmas Eve falls the day after,
so the same order would not touch it. Recorded because a reader looking at a Dec-23/24 print will ask.

**One limit stated rather than assumed:** whether a lapse actually reaches Commerce and Census depends on
which FY2027 appropriations have passed by 12-11. This session did not verify FY2027 bill status; the
[`durable-goods-2026-12-23`](durable-goods-2026-12-23.md) ledger's 2026-09-05 reading (3 of 12 bills passed
the House, 0 reported from Senate Appropriations) is cited as that lane's, not re-derived here.

### Leg 3 — the nowcast · **MIXED**: the wiring is right, its weight is a sixth not a half, and the 12-23 vintage is unreadable

**The wiring, confirmed and quantified.** `Residential` row 17 puts `valTotalHomeSales` under
`FRSBKZ_USNAqtr` → **`FRSBKX_USNAqtr`, "Brokerage commissions"** — the same line the
[existing-home lane](existing-home-sales-2026-12-09.md) measured — and rows 18–21 give its two inputs as
levels: `valExHomeSales` (*"Real" value of existing home sales*) and **`valNewHomeSales`** (*"Real" value of
new home sales*). The relation is exact addition: across **171** monthly columns 2012-07 → 2026-09,
`valTotalHomeSales − valExHomeSales − valNewHomeSales` is zero in **171 of 171**.

**So "the other half" overstates it.** The new-home input is a median **17.75%** of the total over the last
60 months (full sample 16.03%, range 13.75–20.93%). This print carries roughly **one part in six** of the
brokerage-commissions driver that the 12-09 existing-home print supplies the rest of.

**And it moves the residential line harder anyway.** Classifying all **1,822** same-quarter deltas by the
archive's own `Data releases` free text:

| Vintage class | n | \|Δ residential\| | vs others | p | \|Δ headline\| |
|---|---|---|---|---|---|
| **New-home sales (all)** | **138** | **0.0507pp** | 0.0058 | **<0.0001** | 0.0692 |
| Existing-home sales | 140 | 0.0376pp | 0.0057 | <0.0001 | 0.0445 |
| Housing starts | 143 | 0.0609pp | 0.0058 | <0.0001 | 0.0687 |

**1.35× the existing-home leaf on a sixth of the weight** — the small component is the volatile one, which
is the same fact the content read below states from the other end (a ±14.0% error bar on the headline). The
two neighbouring figures reproduce their own ledgers exactly, which is the cross-check that this is a real
ordering and not a parsing artifact.

**Attribution is superb — on a solo vintage.** Splitting the 138:

| Configuration | n | \|Δ residential\| | \|Δ headline\| | residential is largest of 8 |
|---|---|---|---|---|
| **Solo new-home** | **93** | 0.0543pp | **0.0528pp** | **97.8%** |
| M3/durable-paired | 16 | 0.0396pp | — | **25.0%** (4 of 16) |
| **GDP-estimate + personal income + M3** | **10** | 0.0728pp | **0.4207pp** | **0.0%** (0 of 10) |
| baseline (all other vintages) | 1,684 | 0.0058pp | 0.0961pp | 16.5% |

A solo new-home vintage is the **cleanest** residential signature on this calendar — 97.8% against the
housing-starts lane's 96.0% and the existing-home lane's 92.9% — and it is a *quieter* headline day than
average (0.0528 vs 0.0961pp), both figures reproducing the 11-25 sibling exactly.

**But 2026-12-23 is not that vintage.** `PostedUpdates` reads, verbatim: *"GDP (Q3 3rd estimate), Personal
income and outlays, NIPA underlying detail tables, Advance Census manufacturing (M3-1), New-home sales"* —
five releases, of which this is the fifth-billed and the only `low`-impact one. On the **10** historical
vintages of that shape, residential was never the largest move:

| Date | Δ residential | Δ PCE | Largest component |
|---|---|---|---|
| 2017-12-22 | −0.0013 | −0.1464 | inventories |
| 2018-11-29 | +0.0486 | +0.4166 | PCE |
| 2019-03-29 | +0.0592 | −0.2409 | PCE |
| 2020-11-25 | −0.1343 | +2.4550 | PCE |
| 2021-11-24 | +0.2749 | −0.8875 | net exports |
| 2022-02-25 | +0.1606 | −1.0895 | PCE |
| 2022-12-23 | −0.1838 | +0.1804 | inventories |
| 2023-02-24 | −0.0636 | +0.1182 | PCE |
| 2023-12-22 | −0.0820 | −0.4012 | PCE |
| 2026-05-28 | +0.0255 | −0.2043 | PCE |

**PCE takes it 7 of 10, inventories 2, net exports 1 — residential 0.** This is the mirror image of the
housing-starts lane's finding for its own shared vintage (5 of 10, still 2.4× base rate); here the crowd-out
is complete. Note what it does *not* say: the residential *line itself* is still this print's, exactly as
the 11-25 sibling measured on the personal-income pairing (0.0820pp vs 0.0018pp, p=0.0003). The claim is
narrower and more useful — you cannot **find** this print by looking for the biggest mover on 12-23, because
the biggest mover will be PCE's.

**And that is a 2026-wide condition, not a 12-23 accident.** Counting solo share by year of vintage:

| | 2014–2025 | 2026 (archive to 07-28) | 2026 remaining scheduled |
|---|---|---|---|
| Solo new-home vintages | **91 of 132 (68.9%)** | **2 of 6** | **0 of 4** |

Per `PostedUpdates`, **none** of the four remaining 2026 editions is readable: **09-24** draws no GDPNow
vintage at all, **10-27** is M3-paired (the 25% class), and **11-25** and **12-23** are both the GDP-estimate
class. The corridor's standing advice — *"the one thing worth reading is the GDPNow residential line"* —
has no clean instance left this year. Offered as an observation with a mechanism held loosely: the post-lapse
2026 calendar pushed the 17th-workday slot onto BEA's month-end cluster, and whether that persists is a
question the 2027 schedule answers.

### Leg 4 — the tape · **REFUTED for today**, and the metric is the finding

The proposal inherited a homebuilder question from the twin without noticing that the two prints need
**different metrics**. The twin lands at **08:30**, an hour before the open, so its ledger measured the
**overnight gap**. This print lands at **10:00**, thirty minutes *after* the open, so the gap cannot contain
it and the **session range** is the pre-specified metric — the same choice the two NAR siblings made.

**Both metrics, run on Census's own 515 release dates:**

| | Release days | Baseline | p |
|---|---|---|---|
| **ITB session range** (2006-05 →) | **2.297%** (n=239) | 2.085% | **0.019** |
| **ITB overnight gap** | 0.445% (n=239) | 0.454% | **0.84** |
| **XHB session range** (2006-02 →) | **2.054%** (n=242) | 1.888% | **0.049** |
| **XHB overnight gap** | 0.432% (n=242) | 0.447% | 0.72 |
| SPY session range (1993 →) | 1.088% (n=396) | 1.043% | 0.28 |
| QQQ session range | 1.453% (n=325) | 1.460% | 0.91 |

**The metric matched to the release time fires and the other does not** — the sector moves on the session,
never on the open, which is exactly the fingerprint a 10:00 print should leave and the inverse of the twin's
(whose gap ran p=0.0020 and whose range its ledger never tested). Two twins, two metrics, each firing on its
own release time, is the cleanest evidence either lane has that these tests measure the print rather than
the day.

**It is a real effect. It is also over, and it died in the same year the twin's did.** Splitting the
session-range result by era:

| ITB session range | 2006–09 | 2010–15 | **2016–20** | **2021–26** |
|---|---|---|---|---|
| release / baseline | 4.042% / 3.625% | **2.443% / 2.063%** | 1.790% / 1.674% | 1.901% / 2.034% |
| p | 0.37 (n=43) | **0.0061** (n=71) | 0.36 (n=60) | 0.30 (n=65) |
| **XHB** p | 0.23 | **0.040** | 0.26 | 0.24 |

**Two consecutive null eras on both sector ETFs, n=125 combined.** This both **reproduces** the 11-25
sibling's post-2021 null (eight instruments, 65 sessions) on a window four times longer and **dates** it —
and the date is the same 2015 boundary the housing-starts lane found on its own metric. The honest statement
is not "this print never mattered"; it is *"the release-day effect decayed after 2015 and has not returned
in eleven years,"* now established twice, on two releases, with two different metrics.

**What will actually be true of 12-23: the year's quietest tape.** The
[`durable-goods-2026-12-23`](durable-goods-2026-12-23.md) lane measured the pre-Christmas session on
SPY and QQQ across 33 years (range p19 / p17, ~35% narrower). This session extends it to the sector and,
more usefully, **to this print's own release dates**:

| Dec 21–23 sessions (2006 →, n=42) | Median range | Ordinary baseline | p | Volume ratio |
|---|---|---|---|---|
| ITB | 1.692% | 2.095% | 0.055 | **0.68×** (p=0.032) |
| XHB | 1.391% | 1.896% | **0.015** | 0.73× |
| QQQ | 0.852% | 1.272% | **0.0040** | 0.78× |
| SPY | 0.769% | 0.966% | 0.093 | 0.88× |

And conditioned on the configuration itself — **14** New Residential Sales releases have landed in the
Dec 21–23 window (2004, 2005, 2008–11, 2014–16, 2019–22, 2024) — the median ITB session range is **1.216%**
against the 2.095% ordinary baseline, **42% narrower**, with 10 of 14 below the baseline median. **2026-12-23
is this series' modal December slot, not an unusual one.** Registered as `-3`.

### Primary content read — what the last edition says, and how little of it survives its own error bars

The current release is **CB26-128**, July 2026 data, published **2026-08-25**:

- **New houses sold 607,000** SAAR — **−10.5% (±14.0%)\*** from a revised June **678,000**;
  **−6.3% (±19.6%)\*** y/y from July 2025's 648,000.
- **New houses for sale 488,000** — **+1.9% (±1.2%)** m/m, the **only** unasterisked change in the release;
  −1.6% (±4.0%)\* y/y.
- **Months' supply 9.6** — +12.9% (±21.3%)\* m/m.
- **Median price $393,800** — −2.3% (±7.4%)\* m/m, −0.9% (±6.9%)\* y/y; average **$508,800**, +4.1% (±11.8%)\*.

**Nine of the ten headline changes carry the asterisk**, whose footnote reads: *"If a range does not contain
zero, the change is statistically significant. If it does contain zero, the change is not statistically
significant; that is, it is uncertain whether there was an increase or decrease."* Census goes further in
the same explanatory notes, and this is the sentence to remember: **"It takes 4 months to establish a trend
for new houses sold."** It also states that *"the preliminary seasonally adjusted estimate of total sales is
revised about 5.0 percent"* on average — against the twin's 2.9%.

**Quantified against the series rather than left as a caveat.** From Census's own `sold_cust.xls` monthly
seasonally-adjusted series (**732 observations, 1963-01 → 2023-12** — this file's vintage, FRED being
blocked): median **|m/m| 4.78%** full sample, **5.42%** over the last ten years of the file (n=121), p75
**9.21%**, p90 **12.88%**. **Only 5.8% of months in the last ten produced a change exceeding the ±14.0%
error bar Census attached to the last print.** Roughly nineteen months in twenty, this series publishes a
headline its own sampling error cannot distinguish from zero — a far wider gap than the twin's (median 4.87%
against ±9.5%), and the arithmetic reason nine of ten changes carry an asterisk. Registered as `-4`.

The inventory read is the exception and belongs to the [11-25 sibling](new-home-sales-2026-11-25.md), which
made it first and in more detail: for-sale inventory **488,000** with **9.6** months' supply is the overhang,
and the ±1.2% interval on the inventory change is the one number in this release that clears its own bar.
This ledger does not re-litigate it.

### The adjacency sweep

- **Peer prints** — n/a for the event, `symbols: []`. ITB **93.91**, XHB **103.25**, DHI **142.75**, LEN
  **83.58**, PHM **124.45** (2026-09-04 closes) were read as a *class* and as Leg 4's subject, never as
  holdings; none is tracked by this calendar.
- **Macro surprises** — none since the last row; there is no last row. The **12-23** morning is quadruple-
  booked ahead of this print: `durable-goods-2026-12-23` (08:30), `pce-2026-12-23` (**high**, 08:30) and
  `gdp-q3-2026-third-2026-12-23` (08:30) all land first and all three are named on this print's own GDPNow
  vintage — the confound Leg 3 measured. `housing-starts-2026-12-17` is six days earlier; the December FOMC
  is **12-09**, two weeks before, so this session carries no decision.
- **Volatility regime** — VIX **14.53**, SPY **770.19**, QQQ **718.96** (2026-09-04 closes). Baseline;
  nothing to diff against yet. The `opex-2026-12-18` widening the twin's ledger measured is **five days
  before** this print and does not reach it; Leg 4's Christmas-week compression does.
- **Geopolitical / policy** — PL 119-103 / H.R. 6500 funds through **2026-12-11**, carried from the
  corridor's own ledgers rather than re-derived. Leg 2 is the full treatment and it is this event's central
  question.
- **Event tape** — no November consensus exists at D-108 and none will before the **11-25** October edition
  sets the base. Every November-content statement above is a base rate, never a forecast.
- **No dated event PROPOSED this session, and that is the finding rather than an omission.** Every release
  this sweep surfaced is already on the calendar: the three louder co-releases on 12-23
  (`durable-goods-2026-12-23`, `pce-2026-12-23`, `gdp-q3-2026-third-2026-12-23`), `boj-minutes-2026-12-23`,
  `christmas-eve-half-day-2026-12-24`, and — filed by three different lanes within one day — this series'
  other two remaining 2026 editions, `new-home-sales-2026-10-27` (proposed from
  `construction-spending-2026-11-02`) and `new-home-sales-2026-11-25` (now canonical and researched). The
  series that "this calendar tracks nowhere" on 2026-09-06 was fully tracked by the end of it.
- **Three classes considered and DECLINED, on the record.** *(a)* **Revised Building Permits, 2026-12-23
  08:00** — a genuinely distinct, dated, primary-sourced release sharing this morning (the SOC schedule's
  own 17th-workday column head names it). Declined: it is a revision publication with no press release, no
  GDPNow channel in 1,871 vintages, and no market channel; it is noted here so the next session does not
  rediscover it as new. *(b)* The **2026-09-24** August-data edition — real and dated on both Census
  primaries, and distinguishable in one respect (it is the only 2026 edition drawing no GDPNow vintage at
  all), but handled as a **dated kill switch** rather than an event, which is cheaper and is the precedent
  the housing-starts lane set with its own 11-18 edition. *(c)* The **~2027-01** December-data edition —
  declined because Census's schedule stops at November 2026 data and a derived date is not a source.
- **Blocked sources recorded:** four FRED CSV endpoints, `probe-ref.blocked`, with the substitution named in
  *Method* rather than made silently.

### Honest limits

- **`-1` is a prediction about Congress, not about Census.** Its base rate is three lapses out of three and
  the conditioning event has not happened. This session did not verify FY2027 appropriations status.
- **The 12-23 vintage class is n=10.** "0 of 10" is a small-sample statement about one exact configuration.
  The well-powered figures are the solo one (n=93, 97.8%) and the all-vintage one (n=138), and they are not
  interchangeable with it. A single vintage in which residential *is* the largest move would take it to
  1 of 11 without touching the underlying point, which is the *ordering* of magnitudes (0.4207pp against
  0.0528pp), not the count.
- **The free-text classifier is free text.** Solo/paired/GDP-day is read from a column the Atlanta Fed writes
  by hand, in at least sixteen spellings of "new-home sales". The classifier is deliberately loose and its
  errors are unmeasured.
- **Leg 4's era split was not pre-specified.** The pre-specified test was the session range on all release
  days, which came back **significant** on the full history (ITB p=0.019). The era decomposition was run
  after seeing the post-2015 subsample disagree. It is reported as the finding because two consecutive
  independent eras on two ETFs read null *and* because it independently reproduces the twin's boundary year
  — but a reader should weight it as an explanation of a result, not a clean out-of-sample test.
- **ITB and XHB are near-duplicates.** Their agreement across all four eras is one observation reported twice.
- **The Christmas-week compression is not this session's discovery** — the `durable-goods-2026-12-23` lane
  measured it first on SPY and QQQ across 33 years, and `FT-durable-goods-2026-12-23-1` already registers the
  SPY form. This session's `-3` is deliberately the **sector** form on **this print's own release dates**, so
  the two are not one prediction counted twice.
- **The content base rate stops at 2023-12.** `sold_cust.xls` is the file Census serves at that path and its
  terminal observation is 2023-12; FRED's live `HSN1F` was blocked. The ±14.0% comparison uses the last ten
  years *of that file*, and the next session should re-run it against a live series.
- **The workday arithmetic used a reconstructed federal-holiday set.** It matched 299 of 300 on-schedule
  modern releases into a 16th–21st-workday band, so the reconstruction is sound, but Leg 1's "exactly the
  17th workday" claim and Leg 2's "due 2018-12-26" both rest on it.
- **`symbols: []` is doing real work.** Even were Leg 3 twice as strong, this event has no instrument
  attached and no house playbook keyed to it. The nowcast line is a *reading*, not a position — and on this
  date, not even a reading.

## Stance & kill switches

**Stance (date is `confirmed`, promoted this session on two Census primaries).** Stand aside on 2026-12-23
and on every edition of this report. Hold four frames. **On the date:** it is Census's own on the bureau
calendar (`A202612231000`, reference `A202611`) and on the Survey of Construction's program schedule, with
the 42-year release-date file and the Atlanta Fed's vintage calendar corroborating; **exactly** the 17th
workday, which is where 179 of 300 modern editions land. **On the cliff — the load-bearing frame:** the
twin's "9 of 514 slips since 1984, all lapse-driven" is **not this series' statistic**, because 78 of 202
pre-2001 editions ran on a two-month schedule; corrected to the modern regime, this print slipped **12 of
312** against the twin's **9 of 312**, all twelve lapse-driven, and **the three extra are precisely the
episodes where the twin printed and this one did not**. **2018 is the exact geometry** — due on the 17th
workday, 2018-12-26; lapse began 12-22; published 2019-01-31, a 36-day slip, while the twin had printed on
time on 12-18. In 2026 the twin sits 6 days past `cr-expiry-2026-12-11` and this print sits **12**. If it
bites, precedent says **deferral and merge**, in Census's own announced words for this series, never
deletion — and a missing print is a funding event, never a housing signal. **On the nowcast:** the wiring
the proposal carried is right and its weight is overstated — `valTotalHomeSales = valExHomeSales +
valNewHomeSales` exactly (171 of 171 months) and the new-home input is a median **17.75%** of it, a sixth
rather than a half — yet it moves the residential contribution **0.0507pp** against a 0.0058pp baseline,
**1.35×** the existing-home leaf. On a **solo** vintage that is the cleanest residential signature the
calendar has (**97.8%** largest of eight, n=93). **On 2026-12-23 it is unreadable**: the vintage carries the
Q3 GDP third estimate, personal income and outlays, NIPA detail and M3-1 alongside it, and across the ten
historical vintages of that shape residential was the largest move **0 times** while PCE took it **7** and
the headline moved **8×** what a solo new-home vintage moves. That is a 2026-wide condition — solo editions
ran 68.9% of vintages through 2025 and **none** of the four remaining 2026 editions is one. **On the tape:**
the metric must match the release time, and when it does the sector effect is real through 2015 (ITB range
2010–15 **2.443% vs 2.063%**, p=**0.0061**) and **null for eleven years** since (p=0.36, 0.30; XHB 0.26,
0.24), while the 08:30 metric never fires at all (gap p=0.84) — so `symbols: []` is a measurement with a
date rather than an assumption, reproducing the 11-25 sibling's null on a four-times-longer window and
dating it to the same year the twin's died. What will be true of 12-23 is the year's quietest tape: on the
14 editions that have landed in the Dec 21–23 window, ITB's median session range is **1.216%** against a
2.095% ordinary baseline. Nothing here licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The 2026-12-23 release does not publish on 2026-12-23.** The cliff bit, and Leg 2's deferral-and-merge
  expectation becomes the live scenario: watch for the November reference month reappearing alongside
  December's on a single later date. If it is instead marked `Suspended` on Census's calendar, this series
  has changed its lapse behaviour and Leg 2 needs rewriting.
- **The twin publishes on 2026-12-17 and this print does not.** The 2018 asymmetry repeats, the corridor's
  "one cliff test" framing collapses into two with different answers, and the twin's ledger's `-1` and this
  one's `-1` score in opposite directions off one lapse.
- **ITB's session range on any New Residential Sales release day between now and 12-23 exceeds 3.099%** (the
  ordinary-session p75) **with no FOMC, CPI or jobs print that morning and no opex or holiday proximity.**
  Leg 4's post-2015 null is then falsified on a clean instance. The dated chances to observe it: **09-24**,
  **10-27**, **11-25**.
- **A GDPNow vintage between now and 2026-12-23 posts new-home sales alone.** `PostedUpdates` schedules none,
  so it would mean the Atlanta Fed re-cut its calendar — and it would restore the one readable instance Leg 3
  says 2026 no longer has.
- **Census moves, merges or restructures the 2026-12-23 release on either of its own schedules.** The
  `confirmed` label reverts to `estimate`; `economic-indicators/calendar-listview.html` and
  `construction/soc/schedule.html` are the two places that would show it.
- **A macro- or housing-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-12-01.**
  The stand-aside is partly an absence-of-instrument argument; a housing-keyed playbook makes it a live
  question rather than a settled one.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-new-home-sales-2026-12-23-1` — the November-2026 New Residential Sales release **publishes on
  2026-12-23**, not deferred by a funding lapse. Score by 2026-12-24.
- `FT-new-home-sales-2026-12-23-2` — on the GDPNow vintage posted **2026-12-23 10:00**, |Δ residential
  contribution| is **NOT** the largest of the eight component moves. Score by 2026-12-24.
- `FT-new-home-sales-2026-12-23-3` — **ITB's 2026-12-23 session range is below 2.095%**, the ordinary-session
  median — the sector form of "the print does not own the session." Score by 2026-12-24.
- `FT-new-home-sales-2026-12-23-4` — the **headline sold m/m change in the November-2026 edition carries
  Census's confidence-interval asterisk** (its 90% interval includes zero). Score by 2026-12-24.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-108 | **Initial research on an id that existed only as a proposal. The date promotes to `confirmed` on two Census primaries; the twin's 42-year slip statistic is REFUTED as this series' statistic and the corrected one is worse; the nowcast wiring is right but a sixth not a half; and the 12-23 GDPNow vintage is measurably unreadable for this print.** Canonical `src/domain/market-events/new-home-sales-2026-12-23.json` written this session after reading the single proposal (`from-housing-starts-2026-12-17`), now shadowed; note [`durable-goods-2026-12-23`](durable-goods-2026-12-23.md) DECLINED this same event ("no argument beyond co-location") and the housing-starts lane's "a series this calendar tracks nowhere" criterion is the one that carried. **Leg 1 — the date:** `calendar-listview.html` (HTTP 200, 91,396 bytes, 179 rows) row "New Residential Sales \| December 23, 2026 \| 10:00 AM \| November 2026", `A202612231000`/`A202611`; independently `construction/soc/schedule.html` (HTTP 200, 59,625 bytes) terminal row "November 2026 \| December 17, 2026 \| December 23, 2026" under "(17th Workday) Revised Building Permits - 8:00 a.m. / New Residential Sales - 10:00 a.m."; `estimate`→**`confirmed`**, `EST:`→**`CENSUS:`** on the `durable-goods-2026-12-23` / `housing-starts-2026-12-17` two-primary precedent. Corroborated by `historic_release_dates.xls` (515 rows 1984-01→2026-11) terminal row and the Atlanta Fed `PostedUpdates` 2026-12-23 10:00 row. **12-23 is EXACTLY the 17th workday** — 179 of 300 modern editions land there, 92 on the 18th, 299/300 in a 16th–21st band — a cleaner fit than the twin's 13th-workday 12-17. **Leg 2 — the cliff, and the corridor's number CORRECTED:** reading the **NRS** column of Census's own 515-row file (the twin's ledger used only the NRC column), **78 of 202 pre-2001 editions published TWO months after their reference month** — a schedule regime that broke in early 2001 — so the twin's "9 of 514 slips" is not transferable. On the modern regime (reference 2000-12→2026-11, **n=312**) this print slipped out-of-month **12 times vs the twin's 9**, **all 12 lapse-driven**, and the **three extra are exactly the cases where the twin printed and this one did not** (ref 2013-10, **2018-11**, 2026-03). **2018 is this print's exact geometry:** Nov-2018 was due on the 17th workday, **2018-12-26**; the lapse began **2018-12-22**; it published **2019-01-31** — a **36-day slip, 64-day gap** — while the twin printed **on time 2018-12-18**, four days before onset. 2026 repeats the straddle: twin **6** days past `cr-expiry-2026-12-11`, this print **12**. Response is **deferral-and-merge**: 4 duplicated NRS release dates (2013-12-04, 2026-01-13, 2026-02-20, 2026-05-05) and Census's own announcements — "1/13/26 - The October New Home Sales release also contains initial estimates for the month of September", plus 2/20/26 and 5/5/26 twins; **none of Census's 4 `Suspended` rows is this series**; the 2025-26 episode cost **111 dark days** (2025-09-24→2026-01-13), 2013 cost 70, 2018-19 cost 64. **Second, non-lapse risk recorded and dated:** Census's announcements page, "12/20/24 - Due to the executive order … closing the federal government on December 24, 2024 … will release … on Monday, December 23, 2024. The original release date was scheduled for Tuesday, December 24" — a Christmas Eve closure order CAN move this print, and the precedent moved it **earlier**; it does not bind 2026, where 12-23 already precedes the half day. FY2027 appropriations status NOT verified. **Leg 3 — the nowcast, MIXED:** `Residential` rows 17–21 confirm `valTotalHomeSales` → `FRSBKZ_/FRSBKX_USNAqtr` "Brokerage commissions" with `valExHomeSales` + **`valNewHomeSales`** as additive level inputs — exact in **171 of 171** months 2012-07→2026-09 — but the new-home half is a median **17.75%** of the total (full sample 16.03%), **a sixth, not "the other half"**. It moves the line harder anyway: across **1,822 same-quarter deltas** (1,871 vintages 2014-05-01→2026-07-28) the **138** new-home vintages move residential **0.0507pp vs 0.0058pp** (p<0.0001) — **1.35×** the existing-home leaf's **0.0376** and below housing starts' **0.0609**, both of which this session **reproduced exactly** as cross-checks, as were the 11-25 sibling's solo figures (**0.0543pp** residential, **0.0528pp** headline, n=93). Attribution splits hard by configuration: **solo n=93 → residential largest of 8 97.8%** (the calendar's cleanest, vs starts 96.0% / existing-home 92.9%); **M3-paired n=16 → 25.0%**; and the **12-23 shape — GDP estimate + personal income/outlays + NIPA detail + M3-1 + new-home sales — n=10 → 0.0%**, PCE taking it **7**, inventories 2, net exports 1, with the headline moving **0.4207pp vs 0.0528pp** on a solo vintage. The residential *line* is still this print's (the 11-25 sibling measured 0.0820 vs 0.0018, p=0.0003) — you simply cannot **find** it as the largest mover. **And it is a 2026-wide condition:** solo vintages ran **91 of 132 (68.9%) 2014–2025** and **2 of 6** in 2026, with **0 of the 4 remaining scheduled editions** solo (09-24 draws **no vintage at all**, 10-27 is M3-paired, 11-25 and 12-23 are GDP-class). Registered as `-2`. **Leg 4 — the tape, REFUTED for today, and the METRIC is the finding:** this print lands **10:00**, thirty minutes after the open, so the pre-specified metric is the **session range**, not the twin's 08:30 overnight gap. On Census's own 515 release dates: **ITB range 2.297% vs 2.085% (n=239, p=0.019)** and **XHB 2.054% vs 1.888% (p=0.049)**, while **ITB gap 0.445% vs 0.454% (p=0.84)** and XHB gap p=0.72 — **the metric matched to the release time fires and the other does not**, the exact inverse of the twin's fingerprint. Era split: **2006-09 p=0.37**, **2010-15 2.443%/2.063% p=0.0061**, **2016-20 p=0.36**, **2021-26 p=0.30** (XHB 0.23 / 0.040 / 0.26 / 0.24); SPY and QQQ null throughout. **The edge died after 2015 — the same boundary year the twin found on its own metric** — and this reproduces the 11-25 sibling's post-2021 null on a 4× longer window. What WILL be true of 12-23 is Christmas-week compression, extended here from the `durable-goods-2026-12-23` lane's SPY/QQQ result to the sector and to this print's own dates: **Dec 21–23 sessions (n=42) XHB 1.391% vs 1.896% (p=0.015), QQQ 0.852% vs 1.272% (p=0.0040), ITB 1.692% vs 2.095% (p=0.055) on 0.68× volume (p=0.032)**; and on the **14** NRS releases that have landed in that window, **ITB's median range is 1.216% vs 2.095% — 42% narrower**, 10 of 14 below the baseline median. 12-23 is this series' **modal December slot**. Registered as `-3`. **Primary content (CB26-128, July 2026 data, released 08-25):** sold **607,000** SAAR, **−10.5% (±14.0%)\*** m/m off a revised 678,000, **−6.3% (±19.6%)\*** y/y; for sale **488,000**, **+1.9% (±1.2%)** — the only unasterisked change; months' supply **9.6** (+12.9% ±21.3%\*); median **$393,800**, average $508,800. **9 of the 10 headline changes carry the asterisk**, and Census's own explanatory note says **"It takes 4 months to establish a trend for new houses sold"** and that preliminary SA total sales are **"revised about 5.0 percent"** (twin: 2.9%). Quantified from Census's `sold_cust.xls` (**732 obs 1963-01→2023-12**, this file's vintage): median \|m/m\| **4.78%** full / **5.42%** last-10y (n=121), p90 **12.88%**, and **only 5.8%** of the last ten years' months exceeded the **±14.0%** bar on the last print — roughly nineteen months in twenty publish a headline their own sampling error cannot distinguish from zero. Registered as `-4`. Inventory/overhang read left to the [11-25 sibling](new-home-sales-2026-11-25.md), which made it first. **Adjacency sweep — peers:** n/a, `symbols: []`; ITB **93.91** / XHB **103.25** / DHI 142.75 / LEN 83.58 / PHM 124.45 read as a class and as Leg 4's subject. **Macro:** 12-23 is quadruple-booked ahead of this print — `durable-goods-2026-12-23`, `pce-2026-12-23` (**high**) and `gdp-q3-2026-third-2026-12-23` all at 08:30 and all three named on this print's own GDPNow vintage, the confound Leg 3 measured; `housing-starts-2026-12-17` is 6 days earlier; the December FOMC is 12-09. **Volatility:** VIX **14.53**, SPY 770.19, QQQ 718.96 (2026-09-04 closes) — baseline, nothing to diff yet; `opex-2026-12-18` is 5 days before and does not reach this print. **Geopolitical:** H.R. 6500 through 12-11 — Leg 2 is the full treatment. **Event tape:** no November consensus at D-108; the 11-25 October edition sets the base. **NO dated event PROPOSED, and that is the finding:** every release this sweep surfaced is already tracked, including — filed by three different lanes inside one day — this series' other two remaining 2026 editions (`new-home-sales-2026-10-27` proposal, `new-home-sales-2026-11-25` canonical and researched). **Three classes DECLINED on the record:** **Revised Building Permits 2026-12-23 08:00** (a real dated same-morning Census release named in the SOC schedule's own column head, but a revision publication with no press release, no GDPNow channel in 1,871 vintages and no market channel — recorded so the next sweep does not rediscover it), the **2026-09-24** August-data edition (distinguishable only by drawing **no** GDPNow vintage; handled as a dated kill switch, the housing-starts lane's 11-18 precedent) and the **~2027-01** December-data edition (Census's schedule stops at November 2026 data). **BLOCKED and recorded, never silently substituted:** four FRED CSV endpoints (`HSN1F`, `MSPNHSUS`, `MORTGAGE30US`, `MSACSR`) timed out across three transports — the content base rate uses Census's own `sold_cust.xls` (terminal obs **2023-12**, labelled as such) and the siblings' `MORTGAGE30US` **6.71%** is **carried, not re-fetched** and used in no measurement here. Also probed: `api.census.gov/.../ressales` returns "Missing Key" HTML at HTTP 200, `econ/currentdata/export/csv` returns 400. **Four forward tests registered:** `-1` (publishes on 12-23), `-2` (residential NOT the largest move on the 12-23 vintage), `-3` (ITB's 12-23 range below the 2.095% ordinary-session median — deliberately the **sector** form on **this print's own dates**, so it is not `FT-durable-goods-2026-12-23-1`'s SPY prediction counted twice) and `-4` (the November headline m/m carries Census's asterisk). | **Initial stance set: stand aside on every horizon; date promoted to `confirmed` on two Census primaries, the twin's 42-year slip statistic REFUTED as this series' (78 of 202 pre-2001 editions ran a two-month schedule) and replaced with a modern-regime 12-of-312 that is strictly worse than the twin's 9 — the three extra slips being exactly the episodes where the twin printed and this one did not, 2018 being the geometry — the nowcast wiring confirmed but weighted at a sixth rather than a half, the 12-23 GDPNow vintage measured UNREADABLE for this print (residential largest 0 of 10) as part of a 2026-wide collapse in solo editions, and the homebuilder release-day effect dated as real through 2015 and null for eleven years on the metric matched to a 10:00 print.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-new-home-sales-2026-12-23.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
