# Monthly Wholesale Trade benchmark revision (2023 + 2024 AIES) — mwts-benchmark-revision-2026-10-26

**Kind:** macro-print · **Date:** 2026-10-26 (estimate, Census-sourced on two primary pages but filed `EST:` — `census.gov/wholesale` announcements block, "tentatively scheduled for release on October 26, 2026 at 10:00 a.m. EDT", corroborated word-for-word on `census.gov/mtis`, both fetched direct 2026-09-06; the date is ABSENT from `economic-indicators/calendar-listview.html`, whose October rows run 10-20 then 10-27) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-10-28","boj-decision-2026-10-30","chicago-pmi-2026-10-30","consumer-confidence-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29","treasury-20y-bond-2026-10-21","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-7y-note-2026-10-29","treasury-buyback-20y30y-2026-10-27","treasury-coupon-announcement-2026-10-22"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This is a restatement of the past, not news about the future — there is no consensus to
surprise against, and the one thing worth watching is whether it happens at all.** Measured this
session from 255 ALFRED vintages: Monthly Wholesale Trade has been benchmark-revised on exactly **12
dates since 2014**, and on **all 12** the revision rode a regular monthly release. **2026 broke that
12-year cadence** — between the 2026-03-28 and 2026-09-06 vintages only five recent months moved,
none by more than 0.01, so no spring benchmark happened. 2026-10-26 is the deferred one, it carries
**two** AIES years instead of one, and it is the **first standalone benchmark revision in the
archive**: no monthly report that day, no GDPNow vintage, and no row on Census's own release
calendar. Size, on months at least 15 months old: all 12 prior revisions restated **126+ months** of
inventories (median **172**, reaching back to 2000–2013) at a median **0.126%** per month. The tape
says nothing — prior revision days ran a 1.055% SPY range against 0.902% (n=11, p=0.247), and even
that is confounded because 11 of 12 landed on retail-sales day. The date is **estimate** and Census's
own word is "tentatively"; `symbols: []`; nothing here licenses an entry. **The decision-relevant
finding is the corridor:** the sibling **retail** benchmark revision is scheduled **2026-09-28**, 28
days earlier, on the same announcement and the same AIES vintages — it is the dress rehearsal, it is
untracked, and it is **proposed in this PR**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-50) | **Stand aside** | High | `symbols: []`, an `estimate` date 50 days out, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed — a re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns 0 macro hits today. Structurally, a benchmark revision has **no consensus forecast**, so the entire surprise-vs-expectation frame every other macro-print ledger uses does not exist here. | A macro-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-10-26** — none exists today |
| This week | **Stand aside — nothing about this event is readable this week** | High | The next wholesale event of any kind is the **July-data print on 2026-09-10**, four days out, which belongs to no ledger and is not a revision. The AIES inputs are already published (2023 AIES **2026-02-26**, 2024 AIES **2026-09-03**), so no new information about this event is due before 09-28. VIX **14.53** (2026-09-04 close). | Census amending or withdrawing the intention-to-revise notice on `census.gov/wholesale` before **2026-09-13** |
| This month | **Watch 2026-09-28 — the retail benchmark revision is this event's dress rehearsal** | Medium | Same announcement, same two AIES vintages, same "tentatively scheduled" wording, same absence from the release calendar, 28 days earlier. Whether Census hits **09-28** is the best dated evidence available about whether it hits 10-26 — and the same page carries a Special Notice that M3 revised history and seasonal-adjustment models "will remain unchanged for the remainder of 2026" for "schedule and resource constraints". Proposed here as `retail-benchmark-revision-2026-09-28`. | Census publishing the restated **retail** estimates on **2026-09-28** exactly as announced — which raises this event's date from a live question to a formality, and is registered as `-1` |
| This quarter | **Never attribute the 2026-10-26 tape to this print, and read the corridor rather than the day** | Medium | 10-26 is the session **immediately before FOMC day 1** (the Oct 27–28 meeting, no SEP) — the quietest class measured here: SPY median range **0.795%** vs a **0.975%** baseline (n=45, p=0.069), a smaller overnight gap (0.211% vs 0.322%), VIX **+0.30**. The restatement's only live channel is two days later: **10-28 is GDPNow's FINAL 2026:Q3 nowcast** and 10-29 is BEA's advance Q3 GDP. | SPY's **2026-10-26** session range printing **at or above 0.975%** — registered as `-4`, base rate 66.7% |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `estimate`-dated, `symbols: []`, no
  macro-keyed playbook, and — uniquely among the macro prints this calendar tracks — **no consensus
  number to be surprised by**. Research is not action.
- **The one date that moves this ledger is 2026-09-28, not 2026-10-26.** The retail half of the same
  restatement lands 28 days earlier under identical wording. Registered as `-1`.
- **Size the expectation, don't guess it.** All 12 prior benchmark revisions restated **126+ months**
  of inventories older than 15 months, median **172**, median **0.126%** per month, median worst
  month **1.034%**. Registered as `-2` in the *wide* direction.
- **The sibling ledger's kill switch is a real 25% event, not a formality.** `wholesale-trade-2026-12-09`
  voids its `-3` if this revision restates the **June-2026** I/S ratio by **≥0.03**. Measured here: a
  specific month four months before a revision moved ≥0.03 in **3 of 12** cases, and across 640
  month-level ratio changes P(≥0.03) is **4.2%**. Registered as `-3` in the *quiet* direction.
- **The nowcast channel is real but arrives late and second-hand.** There is **no GDPNow vintage on
  10-26** — the Atlanta Fed's `PostedUpdates` runs 10-20, then 10-27 ("Advance Census manufacturing,
  New-home sales"), then **10-28, the final 2026:Q3 nowcast**. Whether the 10-28 advance report
  carries September wholesale inventories on the restated basis is **not stated by Census** and is
  the open question in this ledger.
- **Watch (dated)** — July data **09-10** · **retail benchmark revision 09-28** (proposed, the
  rehearsal) · August data **10-08** · MTIS on the restated retail basis **10-15** (proposed) ·
  **this revision 10-26** 10:00 EDT, the day before FOMC day 1 · **FOMC decision 10-28**, and
  GDPNow's final Q3 nowcast the same day · **advance Q3 GDP 10-29** · September data **11-09** ·
  MTIS on the restated wholesale basis **11-17** (proposed) · the wholesale print this restatement
  reaches, **12-09**.

## Initial research

### The question, plainly

This event exists because another lane's adjacency sweep read the announcements block on the page
carrying the current wholesale release. Its proposal argued the restatement matters because "every
level comparison written before 2026-10-26 breaks across it." That is a claim about *magnitude* and
about *timing*, and neither had been measured. **How much history does a wholesale benchmark revision
actually restate, does it move anything a book could act on, and — given Census's own "tentatively"
— is 2026-10-26 a date to plan around at all?**

**One-line verdict:** the restatement is genuinely wide and genuinely small — 100+ months moved, by
a tenth of a percent each — and the date is the interesting part, because this is the first
standalone benchmark revision in the archive, the first year in twelve with no spring revision, and
the second of a pair whose first half lands 28 days earlier and tells us whether the schedule holds.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no
target. Eight inputs, all fetched direct on 2026-09-06:

1. **`census.gov/wholesale/index.html`** (HTTP 200, 527,648 bytes) — the announcements block that
   dates this event.
2. **`census.gov/mtis/index.html`** (HTTP 200, 683,571 bytes) — the same restatement described from
   the combined-inventories side, dating **both** halves and both downstream MTIS editions, plus the
   M3 Special Notice.
3. **`census.gov/retail/index.html`** (HTTP 200, 742,392 bytes) — the retail half's own primary.
   `census.gov/manufacturing` and `census.gov/services` were checked the same way and carry **no**
   intention-to-revise notice.
4. **`census.gov/programs-surveys/aies.html`** (HTTP 200, 325,372 bytes) — the upstream survey
   release dates: 2023 AIES main release **2026-02-26**, 2024 AIES **2026-09-03**.
5. **Eight Census release calendars** — `calendar-listview.html` (2026, 179 rows) plus
   `calendar-listview-2019…2025.html`, parsed row-wise into `(release date, reference month)`.
6. **ALFRED vintages of three wholesale series** — `WHLSLRIRSA` (the I/S ratio) at **159 monthly
   grid points 2013-06 → 2026-08 plus 96 daily points** inside the twelve candidate windows, and
   `WHLSLRSMSA`/`WHLSLRIMSA` (sales and inventories levels) at the day before and the day of each
   revision. Current FRED reads: June 2026 sales **$794,101M**, inventories **$944,710M**, ratio
   **1.19**, 414 observations from 1992-01.
7. **Atlanta Fed `GDPNowcastDataReleaseDates.xlsx`** (`PostedUpdates`, 82 dated rows;
   `InternalUpdates`, 95) and **`GDPTrackingModelDataAndForecasts.xlsx`** (`ContribArchives`, **1,871
   vintages 2014-05-01 → 2026-07-28 = 1,822 same-quarter deltas**).
8. **`federalreserve.gov/monetarypolicy/fomccalendars.htm`** (2021–2027 panels, 57 rows) and **Yahoo
   daily bars for SPY / QQQ / ^VIX**, 4,194 sessions from 2010, with 20,000-iteration permutation
   tests on medians.

One method note that changes how a reader should read every magnitude below. The published I/S ratio
carries **two decimals**, so its revision granularity is 0.01 — a resolution floor, not a measurement.
Every claim about *how much* the history moves is therefore taken from the **level** series, where a
restatement is expressible as a percentage; the ratio series is used only for *when* a revision
happened and for grading the sibling ledger's ratio-denominated kill switch.

### Leg 1 — the event is real and dated 2026-10-26 · **SUPPORTED**, on two Census pages, and still `estimate`

Two independent Census program pages carry the same date in the same sentence structure. The
wholesale page:

> "Intention to Revise - Monthly Wholesale sales, inventories, and inventories/sales ratios estimates
> are anticipated to be revised based on historical corrections and the results of the 2023 and 2024
> Annual Integrated Economic Survey. Revised not adjusted estimates and corresponding adjusted
> estimates are tentatively scheduled for release on **October 26, 2026 at 10:00 a.m. EDT**."

And the MTIS page, which dates both halves at once:

> "…tentatively scheduled for release on **September 28, 2026** and **October 26, 2026**,
> respectively. Revisions to the retail estimates are anticipated to be reflected in the August 2026
> MTIS release scheduled for **October 15, 2026**. Revisions to the wholesale estimates are
> anticipated to be reflected in the September 2026 MTIS release scheduled for **November 17, 2026**."

The upstream inputs both exist: the 2023 AIES main release was **2026-02-26** and the 2024 AIES
estimates published **2026-09-03**, three days before this research. So the reason a two-year
benchmark is possible at all is on the record and dated.

Status stays **estimate** on three counts, and the third is the one worth carrying: Census's own word
is "tentatively"; the lane may not self-confirm an in-sweep discovery; and **the date is not on the
release calendar**. All 179 rows of `calendar-listview.html` were parsed, and October 2026 runs
`New Residential Construction 10-20` → `Advance Durable Goods 10-27`. There is no 10-26 row of any
kind. Neither is there a 09-28 row for the retail half. That is not evidence against the dates — it
appears to be simply how Census handles off-cycle revisions — but it does mean the release calendar,
which is this lane's usual second primary, cannot corroborate either one.

### Leg 2 — "a benchmark revision restates the whole history" · **SUPPORTED**, and the size is now measured rather than asserted

ALFRED's `WHLSLRIRSA` archive was walked at 159 monthly grid points and then bisected daily inside
every window showing a mass restatement. Twelve benchmark revisions, and the cadence is unmistakable:

| Revision | Months of I/S ratio moved | Oldest month touched | Worst single month |
|---|---|---|---|
| 2014-04-14 | 83 | 2005-11 | 0.03 |
| 2015-04-14 | 95 | 2001-09 | 0.02 |
| 2016-04-13 | 43 | 2001-09 | 0.02 |
| 2017-04-14 | 34 | 2001-09 | 0.01 |
| **2018-06-14** | 80 | 2000-04 | **0.04** |
| 2019-04-18 | 42 | 2008-07 | 0.02 |
| 2020-04-15 | 42 | 2008-05 | 0.03 |
| 2021-04-15 | 42 | 2006-01 | 0.03 |
| 2022-04-14 | 50 | 2008-05 | 0.01 |
| 2023-04-14 | 56 | 2009-04 | **0.04** |
| 2024-04-15 | 46 | 2009-04 | 0.01 |
| 2025-04-16 | 27 | 2008-05 | 0.01 |

Eleven of twelve land between **April 13 and April 18**; the exception is 2018, which slipped to
June 14 — the single precedent for this series' schedule moving.

On the level series, restricted to months **at least 15 months older** than the revision so ordinary
monthly revisions are excluded, the restatement is far wider than the rounded ratio suggests:

| Series | Months restated per revision (min / median / max) | Median \|%Δ\| per month | Median worst month | Largest observed |
|---|---|---|---|---|
| Inventories (`WHLSLRIMSA`) | 126 / **172** / 226 | **0.126%** | 1.034% | **4.29%** (2015) |
| Sales (`WHLSLRSMSA`) | 61 / **158** / 201 | 0.067% | 1.192% | **5.23%** (2015) |

So the proposal's claim is upheld in the direction it mattered — **every level comparison written
before the revision does break across it**, because 126–226 months move every time — and corrected in
magnitude: the typical month moves about a **tenth of a percent**, not a headline amount. Two
revisions (2015, 2021) reached 3–5% on their worst months; the other ten stayed under 2.6%.

### Leg 3 — 2026-10-26 is an ordinary edition of that series · **REFUTED** on three counts, and this is the ledger's central finding

**It is the first standalone one.** On every one of the twelve dates above, the vintage that carried
the restatement also **added a new reference month** — the benchmark rode a regular monthly report,
which is why the GDPNow archive files eleven of the twelve under "Retail trade". 2026-10-26 adds no
reference month: the Census calendar puts August data on **10-08** and September data on **11-09**,
and 10-26 sits between them with no report attached.

**2026 is the first year in twelve with no spring revision.** Comparing the `2026-03-28` and
`2026-09-06` vintages directly: six months were **added** and five were revised — 2025-01, 2025-02,
2025-05, 2025-06, 2025-12 — none by more than **0.01**. That is the ordinary monthly-revision
footprint and nothing else. The April 2026 slot, which had produced a benchmark in 2014, 2015, 2016,
2017, 2019, 2020, 2021, 2022, 2023, 2024 and 2025, produced none. And the 2023 AIES had already
published on **2026-02-26**, seven weeks before that slot — so the deferral was a choice to batch two
AIES vintages, not a missing input.

**It carries two survey years, not one.** Every prior revision in the table benchmarked a single
annual survey. This one names "the 2023 **and** 2024 Annual Integrated Economic Survey" plus
"historical corrections". The archive offers one loose analogue — 2018-06-14, the other off-cycle
revision — and it sits at the wide end: 182 old inventory months, median 0.209%, back to 2000-03.

### Leg 4 — the revision moves the nowcast · **MIXED**, and the honest reading is "unmeasurable, and this time unconfounded"

Joining the twelve revision dates to `ContribArchives`:

| Class | n | median \|Δ change-in-inventory-investment\| |
|---|---|---|
| Vintage on (or first after) a benchmark-revision date | 12 | **0.0348pp** |
| Every same-quarter vintage | 1,822 | 0.0153pp |

Permutation p = **0.185** over 20,000 iterations — **not significant**. And the comparison is
contaminated in a way that cannot be cleaned: eleven of the twelve revision-day vintages are
`Data releases` = "Retail trade" (± industrial production, CPI, import/export prices), because the
benchmark always rode the mid-month release. The nowcast moved on those days for reasons that have
nothing to do with wholesale history.

Graded MIXED rather than REFUTED because 2026-10-26 removes the confound and, with it, the
measurement. **There is no GDPNow vintage on 2026-10-26 at all** — `PostedUpdates` runs 10-20, then
**10-27** ("Advance Census manufacturing (M3-1), New-home sales"), then **10-28**, whose own label
reads *"Final nowcast of 2026:Q3 GDP growth: Advance Economic Indicators"*, then **10-29**, *"Initial
nowcast of 2026:Q4 GDP growth: GDP (Q3 1st estimate)…"*. `InternalUpdates` has nothing between 10-16
and 11-02.

So the corridor, stated plainly: a restatement of the wholesale inventories history publishes at
10:00 on Monday 10-26; the Atlanta Fed's next two vintages are **the final Q3 nowcast** and **the
first Q4 one**; BEA's advance Q3 GDP prints 10-29. Whether the 10-28 advance economic indicators
report carries September wholesale inventories on the restated basis is **not stated anywhere Census
publishes** — the MTIS announcement names 11-17 as where the restated wholesale estimates surface,
and says nothing about the advance report. That is the single open question in this ledger, and it
belongs to whoever next assesses `advance-economic-indicators-2026-10-28`, not to this lane.

### Leg 5 — 2026-10-26 is a session to act on · **REFUTED**, and for a third distinct reason from either sibling

Two questions, and the answers point the same way.

**Do benchmark-revision days move the tape?** SPY, full history, the eleven revision dates that were
trading sessions: median range **1.055%** against **0.902%** across 4,194 sessions, permutation
p = **0.247**. Inert — and again confounded by retail-sales day, so even the null is soft.

**What kind of session is 2026-10-26 on its own terms?** It is the trading day immediately before
FOMC day 1 (the panel reads `October 27-28`, **no SEP**). Across 45 meetings since 2021-01-01:

| Class | n | median SPY range | p | median \|overnight gap\| | median QQQ range |
|---|---|---|---|---|---|
| **Session before FOMC day 1 (the 10-26 shape)** | 45 | **0.795%** | **0.069** | **0.211%** | 1.143% |
| FOMC day 1 | 45 | 0.924% | 0.650 | 0.265% | 1.347% |
| FOMC decision day | 45 | 1.370% | **0.0002** | 0.161% | 1.667% |
| Baseline (none of the above) | 1,290 | 0.975% | — | 0.322% | 1.369% |

The pre-meeting session is the **quietest** class in the table on both range and gap, and VIX rises a
median **+0.30** points into it. Quartiles: pre-day-1 p25 **0.570%** / p50 0.795% / p75 **1.176%**
against a baseline p25 0.677% / p50 0.974% / p75 1.415%. **30 of 45** pre-day-1 sessions printed
below the baseline median — a 66.7% base rate, which is what `-4` is registered at.

This is a third independent shape in the family, and worth stating because the two siblings reached
opposite framings: `intl-trade-full-report-2026-12-08` called its session a **waiting room** (day 1),
`wholesale-trade-2026-12-09` called its session **unreadable** (decision day, width belongs to 14:00).
This one is neither — it is a **coil**: compressed range, narrow gap, rising implied vol, ahead of a
decision two days out. Nothing about that is caused by the revision; it is what the calendar slot is.

### Leg 6 — the reaction-function frame applies at all · **REFUTED**, structurally, and it is why the call is a refusal

`EVENT-RESEARCH.md`'s macro-print mode asks for "consensus expectation, the whisper if findable, the
market's recent reaction function to surprises in each direction." For this event **none of the four
exists**, and not because the search failed:

- A benchmark revision has **no forecast**. Nobody publishes a consensus for how much of 2015's
  wholesale inventories will move. There is no surprise to measure and no direction to be surprised in.
- It reports **no new period**. The most recent reference month on 10-26 will be **August 2026**,
  published 10-08 and already priced.
- Its content is **arithmetic already determined** — the 2023 and 2024 AIES results published on
  2026-02-26 and 2026-09-03. The information is public; only its application to the monthly series is
  pending.

The right frame is therefore a **basis change**, not a print: the thing that can bite is a comparison
written on one basis and read on another. That is exactly what `-3` is registered to bound, and it is
the whole of this event's contact with anything this book holds.

### Primary content read — what the series looks like going in

FRED, fetched direct 2026-09-06: June 2026 sales **$794,101M**, inventories **$944,710M**, I/S ratio
**1.19** (`WHLSLRIRSA`, 414 observations from 1992-01), matching Census release **CB26-120**. The
2026 ratio path reads 1.25 → 1.23 → 1.21 → 1.19 → 1.15 → 1.19 across January–June, and the
`wholesale-trade-2026-12-09` ledger places 1.19 at the 19.8th percentile since 1992 after a 21-month
slide from 1.33. By 10-26 the published series will run through **August 2026** (the 10-08 print).
Every one of those numbers is **pre-revision**, which is the point of this ledger.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`.
- **Macro surprises** — none since the last row; there is no last row. Jobs **09-04**, ADP and Beige
  Book 09-02, Challenger 09-03 precede this research; the FOMC blackout starts **09-05**.
- **Volatility regime** — VIX **14.53** (2026-09-04 close, Yahoo `^VIX` daily). SPY **770.19**, QQQ
  **718.96** same close. Baseline reading; nothing to diff against yet.
- **Geopolitical / policy** — no channel to a series with no symbols. The relevant *policy* fact is
  administrative rather than geopolitical: the MTIS announcement carries a **Special Notice** that
  M3 revised historical data and seasonal-adjustment models "will remain unchanged for the remainder
  of 2026" due to "schedule and resource constraints" — Census is publicly rationing revision work in
  the same window this revision is scheduled in.
- **Event tape** — no consensus, no whisper, no implied move: see Leg 6. There is nothing to drift.
- **Three dated events proposed in this PR**, each its own file owned by this lane, all `estimate`,
  and the last two under a rule stated in their notes so the selection is not arbitrary (*track the
  MTIS editions Census itself names as carrying an AIES restatement, and no others*):
  `retail-benchmark-revision-2026-09-28` (the rehearsal, and filed **medium** impact because the
  retail series is one this calendar already tracks as high), `mtis-2026-10-15` (where the restated
  **retail** basis first reaches the combined series) and `mtis-2026-11-17` (where **this event's**
  restated basis does). Each carries the same collision caution the 12-16 proposal recorded: a tracked
  `retail-sales-<date>` entry already occupies both MTIS dates and is the **08:30 advance retail
  sales** report for a different reference month.
- **Two considered and DECLINED, so their absence reads as a decision.** The **2024 AIES data release
  of 2026-09-03** and the **2023 AIES main release of 2026-02-26** are real, dated and primary-sourced,
  and they are this event's upstream inputs — but both are in the past, so neither can be assessed or
  scored, and a calendar of forward events is the wrong home for them. They are recorded here instead.
- **One cross-ledger note, for the lane that owns it.** `advance-economic-indicators-2026-10-28` is
  GDPNow's final 2026:Q3 nowcast and lands two days after this restatement. Whether its September
  wholesale inventories arrive on the restated basis is unstated by Census and is the highest-value
  open question in this corridor. Not this lane's file to touch.

### Honest limits

- **The archive is ALFRED's, not Census's.** `WHLSLRIRSA` vintages begin **2013-06**, so "twelve
  revisions" means twelve since then, not twelve ever. A revision before 2013 would not appear.
- **Revision dates are inferred from vintage diffs, not read from a Census notice.** Each is the
  first date on which a mass restatement of months older than ~13 months appears; bisection narrows
  it to a day, but a revision published after that day's ALFRED snapshot would be attributed to the
  next day.
- **The ratio's two decimals are a resolution floor.** P(\|Δ ratio\| ≥ 0.02) = 23.0% and P(≥ 0.03) =
  4.2% across 640 month-level changes are statements about a **rounded** series. `-3` is registered
  on the ratio anyway, because that is the quantity the sibling ledger's kill switch names.
- **n = 12 carries every schedule claim, and n = 1 carries the two-year claim.** "All 12 rode a
  monthly release" is a strong pattern on a small archive; "a two-AIES benchmark is wider" rests on
  2018-06-14 as a loose analogue and on nothing else.
- **The GDPNow null is soft and the tape null is softer.** Both are confounded by retail-sales day,
  and p = 0.185 / p = 0.247 are non-rejections, not demonstrations of absence.
- **The one thing that would make this event matter is the thing this ledger cannot resolve** —
  whether the 10-28 advance report and the final Q3 nowcast run on the restated basis. Census does
  not say, and no archive answers it, because there has never been a standalone revision to observe.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has
  no instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date is `estimate`).** Stand aside on 2026-10-26 and on every benchmark revision of this
series. Hold four frames. **On what this is:** a restatement of the past with no consensus, no
whisper, no new reference month and no direction to be surprised in — the surprise-vs-expectation
frame every other macro-print ledger in this calendar uses simply does not apply, which makes the
refusal structural rather than statistical. **On the date:** it is genuinely uncertain in a way the
sibling Census entries are not — "tentatively scheduled", absent from the release calendar, on a
series that has already skipped one benchmark this year, announced beside a Special Notice rationing
M3 revision work for the rest of 2026. The dated evidence arrives **2026-09-28**, when the retail
half of the same restatement is due, and that is why the This-month call watches 09-28 rather than
10-26. **On the size:** wide and shallow — 126+ months every time, at a median tenth of a percent —
so the honest caution is about **basis**, not about magnitude: any level or ratio comparison spanning
10-26 is comparing two different series, and the sibling `wholesale-trade-2026-12-09` ledger is right
to score its ratio test on the value **as printed**. **On the tape:** 10-26 is the pre-FOMC coil, the
quietest session class measured here (0.795% vs 0.975%, gap 0.211% vs 0.322%, VIX +0.30) — and none
of that quiet, or any width that replaces it, will have anything to do with this release. Nothing
here licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The 2026-09-28 retail benchmark revision does not publish that day.** The rehearsal failing is
  the strongest available evidence that 10-26 slips too, and it would move this event's date from
  "tentatively scheduled and plausible" to "announced and unscheduled" — a different object, and one
  the `estimate` label would then be understating.
- **Census puts 2026-10-26 on `economic-indicators/calendar-listview.html`.** A calendar row is the
  second primary this lane could not find; it would raise the date's standing and is the cleanest
  route to a `CENSUS:`-confirmed status flip that this lane may not perform itself.
- **The revision restates the June-2026 inventories/sales ratio by ≥0.03.** Measured at a 25% base
  rate for a month at that distance. It voids `wholesale-trade-2026-12-09`'s `-3` by that ledger's own
  terms, and it would make "basis change" an operational caution rather than a bookkeeping one.
- **The 2026-10-28 GDPNow vintage — the final 2026:Q3 nowcast — moves the change-in-inventory-investment
  contribution by ≥0.30pp.** That is past the p90 of every wholesale class the sibling ledger measured
  and would say the restatement reached the final Q3 nowcast, answering this ledger's open question in
  the affirmative and making the corridor worth watching in future years.
- **Census withdraws or re-dates the intention-to-revise notice on `census.gov/wholesale`.** The event
  becomes undated, and an undated event is not assessable on a cadence.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-10-26.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it live.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-mwts-benchmark-revision-2026-10-26-1` — the **retail** benchmark revision publishes on
  **2026-09-28** as announced. Score by 2026-10-05.
- `FT-mwts-benchmark-revision-2026-10-26-2` — the 2026-10-26 revision restates **at least 126
  months** of wholesale inventories older than 15 months. Score by 2026-11-02.
- `FT-mwts-benchmark-revision-2026-10-26-3` — the restated **June-2026 I/S ratio** differs from
  **1.19** by **less than 0.03**. Score by 2026-11-02.
- `FT-mwts-benchmark-revision-2026-10-26-4` — **SPY's 2026-10-26 session range is below 0.975%**.
  Score by 2026-10-27.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-50 | **Initial research on an id that existed only as a proposal. The restatement is wide and shallow; the date is the uncertain part, and its dated evidence arrives 28 days early.** Canonical `src/domain/market-events/mwts-benchmark-revision-2026-10-26.json` written this session after reading the single proposal (`from-wholesale-trade-2026-12-09`), now shadowed. **Leg 1 — date:** two Census primaries fetched today carry the same wording — `census.gov/wholesale` ("tentatively scheduled for release on October 26, 2026 at 10:00 a.m. EDT") and `census.gov/mtis`, which dates both halves ("September 28, 2026 and October 26, 2026, respectively") and both downstream MTIS editions (retail → 10-15, wholesale → 11-17). Upstream inputs exist and are dated: 2023 AIES main release **2026-02-26**, 2024 AIES **2026-09-03**. Status stays `estimate`: Census's own "tentatively", no self-confirm, and **the date is absent from `calendar-listview.html`** (179 rows parsed; October runs 10-20 → 10-27) — so is 09-28. **Leg 2 — size, measured not asserted:** 159 monthly + 96 daily ALFRED vintages of `WHLSLRIRSA` bisected to **12 benchmark revisions since 2014** — 04-14, 04-14, 04-13, 04-14, **06-14 (2018)**, 04-18, 04-15, 04-15, 04-14, 04-14, 04-15, 04-16 — 11 of 12 between April 13–18. On `WHLSLRIMSA`/`WHLSLRSMSA`, restricted to months ≥15m old: inventories **126/172/226** months restated (min/median/max) at a median **0.126%** and a median worst month **1.034%**; sales 61/158/201 at 0.067%/1.192%; the 2015 and 2021 revisions reached **4.29%/5.23%**. **Leg 3 — and this is the finding:** on **all 12** the revision rode a regular monthly release (a new reference month was added the same day); 2026-10-26 adds none (August data 10-08, September data 11-09), making it the **first standalone benchmark revision in the archive**. And **2026 broke a 12-year cadence** — `2026-03-28` → `2026-09-06` moved only 2025-01, 2025-02, 2025-05, 2025-06, 2025-12, none by >0.01 — despite the 2023 AIES having published seven weeks before the April slot, so the deferral batched two survey years by choice. **Leg 4 — nowcast, MIXED:** `ContribArchives` (1,871 vintages → 1,822 same-quarter deltas) gives revision-day \|Δ inventories\| median **0.0348pp** vs **0.0153pp** baseline, permutation p=**0.185** — not significant, and confounded because 11 of 12 revision-day vintages read "Retail trade". **No GDPNow vintage exists on 2026-10-26**: `PostedUpdates` runs 10-20 → **10-27** ("Advance Census manufacturing, New-home sales") → **10-28, "Final nowcast of 2026:Q3"** → **10-29, "Initial nowcast of 2026:Q4 … GDP (Q3 1st estimate)"**. Whether the 10-28 advance report carries September wholesale inventories on the restated basis is unstated by Census — the open question, flagged for that lane. **Leg 5 — session:** 11 revision dates that were sessions ran SPY median range **1.055%** vs **0.902%** over 4,194 sessions, p=**0.247**, inert. 2026-10-26 is the session **before FOMC day 1** (panel `October 27-28`, no SEP): n=45 since 2021, SPY median range **0.795%** vs a **0.975%** baseline (p=**0.069**), gap **0.211%** vs 0.322%, VIX **+0.30** — the quietest class measured, and a third distinct shape after the 12-08 "waiting room" and the 12-09 "unreadable". **30/45** printed below the baseline median. **Leg 6 — REFUTED structurally:** no consensus, no whisper, no new reference month, no direction to be surprised in; the right frame is a **basis change**, not a print. **Cross-ledger:** `wholesale-trade-2026-12-09`'s void condition (this revision restating the June-2026 ratio by ≥0.03) is a measured **3/12 = 25%** event for a month at that distance; across 640 month-level ratio changes P(≥0.02)=**23.0%**, P(≥0.03)=**4.2%**. **Adjacency — peers:** n/a, `symbols: []`. **Macro:** jobs 09-04, ADP/Beige Book 09-02, Challenger 09-03; FOMC blackout starts 09-05. **Volatility:** VIX **14.53**, SPY **770.19**, QQQ **718.96** (2026-09-04 closes) — baseline. **Policy:** the MTIS page's **Special Notice** — M3 revised history and seasonal-adjustment models "will remain unchanged for the remainder of 2026" for "schedule and resource constraints" — Census is publicly rationing revision work in this window. **Event tape:** nothing to drift; see Leg 6. **Three dated events proposed** (own files, `estimate`): **`retail-benchmark-revision-2026-09-28`** — the same AIES restatement applied to retail, 28 days earlier, untracked, filed **medium** impact and registered as this ledger's `-1`; `mtis-2026-10-15` and `mtis-2026-11-17` — the two MTIS editions Census itself names as carrying the restatements, under a rule stated in their notes, each with the 08:30-advance-retail-sales collision caution. **Two declined on the record:** the 2024 AIES release (2026-09-03) and the 2023 AIES main release (2026-02-26) — real, dated, primary-sourced, but in the past and so unassessable. **Four forward tests registered:** `-1` (retail rehearsal publishes 09-28), `-2` (≥126 months restated, 12/12 base rate), `-3` (June-2026 ratio moves <0.03, 9/12 base rate), `-4` (SPY 10-26 range <0.975%, 30/45 = 66.7%). | **Initial stance set: stand aside; this is a basis change rather than a print, with no consensus to surprise against, the first standalone benchmark revision in a 12-revision archive, a date whose real evidence arrives on 2026-09-28, and a pre-FOMC coil for a session.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-mwts-benchmark-revision-2026-10-26.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
