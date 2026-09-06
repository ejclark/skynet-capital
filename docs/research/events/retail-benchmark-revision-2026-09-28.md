# Monthly Retail Trade benchmark revision (2023 + 2024 AIES) — retail-benchmark-revision-2026-09-28

**Kind:** macro-print · **Date:** 2026-09-28 (estimate — `census.gov/retail` announcements block, "tentatively scheduled for release on September 28, 2026 at 10:00 a.m. EDT", corroborated on `census.gov/mtis`, both re-fetched direct by this lane 2026-09-06; the date is absent from `economic-indicators/calendar-listview.html`) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","apple-eu-dma-terms-2026-10-01","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","census-benchmark-revision-nsa-2026-09-28","chicago-pmi-2026-09-30","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","government-funding-deadline-2026-09-30","ism-manufacturing-2026-10-01","jobs-2026-10-02","jolts-2026-09-29","meta-connect-2026-09-23","pce-2026-09-30","scoos-2026-09-24","sp-select-sector-secondary-reweight-2026-09-30","treasury-2y-frn-2026-09-23","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-10y20y-2026-10-01","treasury-buyback-20y30y-2026-09-24","treasury-coupon-announcement-2026-10-01","trump-xi-summit-2026-09-24","umich-sentiment-final-2026-09-25","unsc-iran-panel-mandate-expiry-2026-09-26"],"screenStreak":0,"blocked":[{"url":"https://alfred.stlouisfed.org/graph/fredgraph.csv?id=RSAFSNA&vintage_date=2025-04-16","status":"404","at":"2026-09-06"},{"url":"https://alfred.stlouisfed.org/series/downloaddata?series_id=RSAFSNA","status":"404","at":"2026-09-06"},{"url":"https://stooq.com/q/d/l/?s=%5Evix&i=d","status":"JS_CHALLENGE","at":"2026-09-06"},{"url":"https://www.census.gov/retail/mrts/www/mrtsinv92-present.xlsx","status":"404","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **This id is a duplicate, and the duplicate is the first finding.**
`census-benchmark-revision-nsa-2026-09-28` (merged today, PR #1772) is the **same Census release** —
one 10:00 a.m. EDT restatement of Monthly Retail Trade on the 2023 and 2024 AIES, found by two lanes
on the same day from different pages and filed under two slugs. Neither lane may delete the other's
file, so the calendar carries one release twice until someone retires an id; the recommendation, and
the twin's, is to **retire this one**. The stance is the twin's and this session does not invent a
second one: a restatement of history has **no consensus to be surprised against**, `symbols: []`, no
macro-keyed playbook, and the 09-28 session class measures inert (the twin's SPY test: n=66, median
range 0.910% vs 0.904%, p=0.942). What this session adds is the number the twin recorded as
**unmeasurable**: ALFRED is closed, but **Census archives its own superseded vintages**, and against
the MRTS workbook published through 2025-02, **all 398** overlapping months of today's headline
not-adjusted series have moved — **372 of 372** pre-2023 months by ≥0.05%, median **−2.098%**, 2023
restated **−$154.7B** and 2024 **−$161.9B**. That window holds more than one revision, so it sizes
*a* retail restatement rather than forecasting 09-28's — and the size is ~**2% of the whole
history**, against the wholesale sibling's 0.126% per month. Date is **estimate**; nothing licenses
an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-22) | **Stand aside** | High | `symbols: []`, an `estimate` date 22 days out, and no consensus number for a restatement to miss. No macro-keyed house playbook exists, and no instrument attaches to this event on any date. The duplicate is a calendar-hygiene problem, not a position. | A macro-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-09-28** — none exists today |
| This week | **Stand aside — nothing about this release becomes readable this week** | High | Both upstream inputs are already published (2023 AIES **2026-02-26**, 2024 AIES **2026-09-03**), so no new information is due before 09-28 itself; the next retail event of any kind is the **09-16** advance print, which is not a revision. VIX **14.53** (2026-09-04 close, re-fetched today). | Census amending or withdrawing the intention-to-revise notice on `census.gov/retail` before **2026-10-06** |
| This month | **Treat 09-28 as a basis change of the whole history, not a print — and refresh any stored retail series after it** | Medium | Measured this session from Census's own archived vintage: a retail restatement moves **every** published month, ~2% at the headline, back to 1992 — 15× the wholesale sibling's 0.126%/month. Census dates where it surfaces: the **2026-10-15** MTIS edition (row `A202610151000`, reference `A202608`), sharing its morning with the 08:30 advance retail sales print. Medium because the measured window bundles more than one revision. | Re-downloading `mrtssales92-present.xlsx` after 09-28 and finding **fewer than 90%** of pre-2023 months changed by ≥0.05% from today's pinned values — scoreable **2026-10-05** |
| This quarter | **Never attribute the 2026-09-28 tape to this release** | High | 09-28 is a Monday with zero scheduled Census releases and one low-impact tracked event; whatever moves that week belongs to the corridor behind it — **09-30** funding deadline and PCE, **10-01** ISM, **10-02** jobs — plus quarter-end and the select-sector reweight. Session class measured inert by the twin. | SPY's **2026-09-28** session range printing above 1.5%, the twin's own `-3`; base rate 80.0% below that line since 2010 |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `estimate`-dated, `symbols: []`, no playbook,
  no consensus. Research is not action.
- **One release, two calendar ids.** Retire `retail-benchmark-revision-2026-09-28`; keep
  `census-benchmark-revision-nsa-2026-09-28`, which holds the ledger, the forward tests and the
  tracking issue. Neither lane can do it alone.
- **The retail vintage route is OPEN, and the twin's "unmeasurable" is superseded.**
  `www2.census.gov/retail/releases/historical/mrts/` serves Census's own superseded workbooks.
- **Size, measured:** 398/398 headline months moved; pre-2023 median **−2.098%**, worst **−3.201%**
  (1992). Read 09-28 as a new basis, never as a data point.
- **Anchors pinned for the after-comparison** (currently published NSA headline, $M, fetched
  2026-09-06): 1992-06 **163,417** · 2010-06 **351,056** · 2019-06 **505,132** · 2023-06 **688,753**.
- **Watch (dated)** — advance retail sales **09-16** · **this restatement 09-28** 10:00 · funding
  deadline and PCE **09-30** · ISM **10-01** · jobs **10-02** · **MTIS 10-15**, the first edition on
  the restated retail basis · **wholesale benchmark revision 10-26**.

## Initial research

### The question, plainly

This id reached the calendar from the `mwts-benchmark-revision-2026-10-26` lane's adjacency sweep on
2026-09-06. Hours later, and independently, the `census-benchmark-revision-nsa-2026-09-28` lane wrote
a full initial-research ledger for **the same Census release** (PR #1772). So the question this
session actually faces is not "what is the 09-28 retail benchmark revision" — that is answered — but
**what is left to establish once a twin ledger exists, and what should happen to the duplicate?**

**One-line verdict:** the twin's stance is correct and is adopted rather than re-derived (a second
ledger disagreeing with the first about one release would be noise, not research); this id should be
retired; and the one gap the twin recorded as closed — the *size* of a retail restatement — is
measurable after all, from Census's own vintage archive, and is large.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no
target. Everything below was fetched by this session on 2026-09-06; anything belonging to the twin
ledger is named as its work and is not re-run.

1. **The two Census primaries, re-fetched rather than inherited** — `census.gov/retail/index.html`
   (HTTP 200, **743,183** bytes) and `census.gov/mtis/index.html` (HTTP 200, **684,348** bytes),
   announcement blocks parsed to text. Byte counts match the twin's to the byte.
2. **Census's own vintage archive** — `www2.census.gov/retail/releases/historical/mrts/` (HTTP 200,
   36,760 bytes, 107 entries), from which `mrtssales92-present25.xlsx` (**428,539** bytes,
   sha256 `ccafd894cb8d252b…`) is the MRTS sales workbook as published with data through **2025-02**,
   compared against the current `www.census.gov/retail/mrts/www/mrtssales92-present.xlsx`
   (**440,847** bytes, sha256 `2c58dce5119a7ff2…`, data through **2026-06**). Both parsed
   sheet-by-sheet (35 year sheets each) with month columns read from each sheet's own header row.
3. **Yahoo `^VIX` daily bars** — re-fetched for the probe-ref (14.53 on the 2026-09-04 close).
4. **This repo** — `assessment-cadence.json`, every `src/domain/market-events/*.json` and every
   `proposals/*.json`, for the adjacency corridor and the duplicate check.

**Failed fetches are recorded, not substituted.** `alfred.stlouisfed.org` 404s on both
`/graph/fredgraph.csv?...&vintage_date=…` and `/series/downloaddata` from this runner too — an
independent second confirmation of the twin's finding, from a different session on the same day.
`stooq.com` answers a JavaScript challenge instead of CSV. The MRTS **inventories** workbook is a 404
at the path the sales one uses, so every number below is sales only. All four are in the `probe-ref`
`blocked` array.

### Leg 1 — "this id names an event the calendar is not already tracking" · **REFUTED**

`census-benchmark-revision-nsa-2026-09-28.json` (canonical, merged today) and this id describe one
release: same date, same 10:00 a.m. EDT hour, same two AIES vintages, same Census announcement
sentence quoted in both `source` fields. The twin's own notes say so and recommend retiring this id.
The mechanism that produced the duplicate is worth stating plainly, because it will recur: two
sweeps found the same release on the same day from *different pages* — `census.gov/mtis` (which
compresses retail and wholesale into one sentence) and `census.gov/wholesale` — and #1717's
proposal-naming rule prevents two lanes from colliding on a *path*, not from choosing two *slugs*
for one real-world event. Nothing in the process resolves that afterwards: a lane may not delete
another lane's proposal or write another event's canonical file, and there is no `supersededBy`
field or retirement state in `event-scan.mjs`. Absent a retirement, both ids draw research forever.

### Leg 2 — "the twin's stance needs re-deriving from scratch" · **REFUTED, deliberately**

The twin tested the stance to a refusal on evidence this session has no reason to doubt and every
reason not to duplicate: no consensus forecast exists for a restatement; `symbols: []`; a re-run grep
of `trade-playbooks.md` and `multi-symbol-sweep.md` returns zero macro-keyed hits; and the 09-28
session class is measured inert (SPY quarter-end-minus-2, n=66 of 4,189 sessions since 2010, median
range 0.910% vs 0.904%, 20,000-iteration permutation p=0.942). **Adopted with attribution.** Two
ledgers on one release must not carry two stances — the honest structure is one stance and one
receipt, and the receipt is the twin's, not a paraphrase presented as independent confirmation.

### Leg 3 — "the size of a retail restatement cannot be measured from here" · **REFUTED**

This is the one leg where this session adds a number. The twin closed it as unmeasurable after
ALFRED refused six times; the mistake was looking only at the aggregator. **Census archives its own
superseded vintages** under `www2.census.gov/retail/releases/historical/mrts/`, which makes a
vintage-to-vintage comparison a *primary-source* measurement rather than a third-party one.

Comparing the archived workbook (data through **2025-02**) against today's published file, headline
**Retail and food services sales, total**:

| Measure | Not adjusted | Seasonally adjusted |
|---|---|---|
| Overlapping months compared | 398 | 398 |
| Months that moved (\|Δ\| ≥ 0.005%) | **398** | **398** |
| Median absolute move | **2.071%** | 2.066% |
| Largest move | **−3.201%** (1992-04) | −3.211% (1992-08) |
| Pre-2023 months moved ≥ 0.05% | **372 of 372** (median −2.098%) | — |
| 2023 annual total | 8,294.2B → **8,139.5B** (−1.866%, −$154.7B) | — |
| 2024 annual total | 8,547.9B → **8,386.0B** (−1.894%, −$161.9B) | — |

Two checks make the numbers usable. **The parser is validated against an independent source:** the
restated 2023 and 2024 annual totals it computes, **$8,139.5B** and **$8,386.0B**, reproduce the
twin's FRED-derived `RSAFSNA` annual sums exactly — two different files, two different sessions, same
figures. **And the shape is not a single revision.** The move is monotone in age (−1.8% for 2023–24,
−2.1% median before 2023, −3.0% for 1992) and the kind-of-business row set itself changed: the old
workbook's `Department stores(excl. discount department stores)`, `Discount dept. stores`,
`Other general merchandise stores` and `Warehouse clubs and superstores` are replaced by
`Gen. merchandise stores incl. warehouse clubs & supercenters` and `Warehouse clubs and
supercenters`, with the surviving `Department stores` line down **−60.1%** in 2019. 58 of 59
comparable kinds of business moved that year. So the window spans at least one annual revision plus a
general-merchandise reclassification.

**What it therefore establishes, stated narrowly:** the *scale* of a retail restatement — the whole
published history, every month, on the order of 2% — against the wholesale sibling's measured median
of 0.126% per month across 12 revisions. It does **not** forecast 09-28's own magnitude, and this
ledger does not pretend it does. It is a prior about the class of object, and the class is "a new
basis", not "a data point".

### Honest limits

- **Sales only.** The MRTS inventories workbook 404s at the analogous path, so the inventories half
  of the restatement — which is what reaches MTIS on 10-15 — is unmeasured here.
- **One vintage pair.** Census archives exactly one superseded MRTS sales workbook today
  (`…present25.xlsx`); there is no `…24`/`…23`, so there is no retail equivalent of the wholesale
  ledger's twelve-revision distribution, only a single observed inter-vintage window.
- **The window is not attributable to one date.** See Leg 3 — it bundles a revision and a
  reclassification, and Census publishes no dated decomposition this session could reach.
- **The stance is the twin's.** Nothing in the call sheet above is an independent second confirmation
  of the refusal; it is one stance, cited.

## Stance & kill switches

**Stand aside, and retire this id.** The date is `estimate`, `symbols` is empty, no house playbook is
macro-keyed to it, and a restatement of 2023–2024 history has no consensus to be surprised against —
so this event licenses no entry on any date, exactly as its twin concluded. The one operational
instruction it carries is a reading rule: **2026-09-28 is a basis change, and 2026-10-15 is where it
surfaces** — any retail series compared across 09-28 is comparing two different series, and this
session measured that a retail restatement moves ~2% of the entire published history rather than a
handful of recent months.

Kill switches, each dated:

- **A macro-keyed retail playbook landing before 2026-09-28** would make the restatement's basis
  question a live input rather than a note — none exists today.
- **The 09-28 release not happening** (Census's own word is "tentatively", and the same MTIS page
  carries a Special Notice deferring M3 revisions for the rest of 2026 on "schedule and resource
  constraints") would move everything downstream, including the 10-15 MTIS edition.
- **Fewer than 90% of pre-2023 months changing** on a post-09-28 re-download would refute the
  whole-history reading and confine the revision to the survey years — registered as `-1`.
- **Census not archiving a superseded workbook after 09-28** would close the measurement route this
  ledger just opened, and the next session would have to say so rather than assume it — registered
  as `-2`.
- **This id still drawing its own research after both close-outs** is the process kill switch: it
  would mean the duplicate was never resolved and two lanes are permanently scoring one release.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-22 | **Initial research.** Canonical `<id>.json` written from the single proposal (`from-mwts-benchmark-revision-2026-10-26`), impact corrected **medium → low** to match the twin and halve this duplicate's future session cost. **Duplicate confirmed:** `census-benchmark-revision-nsa-2026-09-28` (PR #1772, merged today) is the same Census release; retirement of *this* id recommended, and neither lane may execute it. Primaries re-fetched independently (`census.gov/retail` 743,183 B; `census.gov/mtis` 684,348 B) — text identical to the twin's quotes. **New measurement:** Census's own vintage archive is open (`www2.census.gov/retail/releases/historical/mrts/`), refuting the twin's "unmeasurable" — against the workbook published through 2025-02, **398/398** headline NSA months have moved, 372/372 pre-2023 months by ≥0.05% (median **−2.098%**, worst −3.201% in 1992), 2023 −$154.7B and 2024 −$161.9B; the restated annual totals reproduce the twin's FRED reads exactly. Window bundles a revision plus a general-merchandise reclassification, so it sizes the class, not this date. **Adjacency sweep:** no symbols and no peers; no CPI/FOMC/jobs print since (next is PCE 09-30, jobs 10-02); VIX **14.53** (09-04 close), an unchanged low-vol regime; no policy item touches a Census restatement; corridor unchanged at 30 tracked events within ±5 days, four of them high-impact. No dated adjacent event found that the calendar does not already carry — **no proposal filed**. Blocked: ALFRED ×2 (404), stooq (JS challenge), MRTS inventories workbook (404). | Stance **adopted from the twin**, not re-derived — stand aside; one operational reading rule added (09-28 is a basis change, 10-15 is where it surfaces). Two forward tests registered. | 2026-10-06 (low band, 30d) — in practice the 09-28 close-out arrives first |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
