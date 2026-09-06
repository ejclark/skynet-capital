# Advance Economic Indicators Report (Sep 2026 data) — advance-economic-indicators-2026-10-28

**Kind:** macro-print · **Date:** 2026-10-28 (estimate, CENSUS: economic-indicators/calendar-listview.html lists "Advance Economic Indicators Report (International Trade, Retail, & Wholesale) | October 28, 2026 | 8:30 AM | September 2026", fetched direct 2026-09-05; corroborated by the Atlanta Fed's own `GDPNowcastDataReleaseDates.xlsx`, fetched direct 2026-09-05, whose 2026-10-28 08:30 row reads "Final nowcast of 2026:Q3 GDP growth: Advance Economic Indicators". Filed estimate per this lane's no-self-confirm limit) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["aapl-2026-10-29-print","amzn-2026-10-29-print","chicago-pmi-2026-10-30","consumer-confidence-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","ism-manufacturing-2026-11-02","meta-2026-10-28-print","msft-2026-10-27-print","pce-2026-10-29","sloos-2026-11-02","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27"],"screenStreak":0} -->

## At a glance

**TL;DR.** **This is the most nowcast-moving release the Atlanta Fed posts on, and it is still not
tradeable — those two facts are not in tension, and separating them is the whole job here.** Measured
across 1,822 GDPNow model vintages back to 2014: on the 81 vintages an Advance Economic Indicators
Report drove, the median composition churn (|Δequipment| + |Δnet exports| + |Δinventories|, in
contribution points) is **0.584pp against 0.048pp for every other vintage — 12.2×**, and on the net-exports
line alone **0.265pp against 0.002pp — 132×**. It out-churns even the days GDP itself prints (0.301pp,
n=71). But the churn goes almost nowhere near the headline: the AEIR's median churn-to-headline ratio is
**1.47** versus 0.449 for everything else, i.e. **it rewrites what the nowcast is made of while barely
moving what the nowcast says.** Two more measurements close the door on acting. First, the address:
08:30 ET on **FOMC decision-day morning** (Oct 27–28 meeting, federalreserve.gov, fetched 2026-09-05) —
and across 21 decision days since Oct 2023 the 09:30–12:00 window makes only **44.8% (SPY) / 51.7% (QQQ)
of the session's full range, against 80.1% / 85.4% on ordinary sessions.** The day is wide; the width is
all after 14:00. Second, the limit on the information itself: this print produces GDPNow's **final** Q3
nowcast, and across 26 quarters where an AEIR was the final vintage that final number still missed BEA's
advance estimate by a **median 0.469pp (p90 2.456pp)** — knowing 10-28 does not tell you 10-29. The one
thing worth pre-registering is a directional asymmetry in the revision itself: **20 of 26 final AEIR
vintages revised the nowcast DOWN** (median −0.192pp, one-sided binomial p=0.0047). Date is
**estimate**; nothing here licenses an entry, and `symbols: []` means there is nothing to enter.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-53) | **Stand aside** | High | `symbols: []`, D-53, no September-data consensus exists, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed. The report has no instrument to trade even if it were readable. | A house playbook keyed to a macro print appearing in `docs/plans/trade-playbooks.md` before **2026-10-20** — none exists today |
| This week | **Stand aside — the read-ahead is 09-30, not this date** | High | Nothing about a September-reference-month trade balance is knowable in the first week of September. The next actual observation of this series is the **August-data edition on 2026-09-30**, proposed as a calendar entry in this PR. | Census moving the **2026-09-30** slot on its own calendar page before **2026-09-30**, which would break the read-ahead this call rests on |
| This month | **Watch the 09-30 edition for the import line, still no action** | Medium | The July edition moved Q3's equipment contribution 0.48 → **1.06pp** and net exports −0.14 → **−1.31pp** in one release. If August repeats it on 09-30, the AI-hardware import surge is a trend rather than a July artifact — a fact about our book's narrative, not a trade in it. | The 2026-09-30 edition moving GDPNow's Q3 net-exports contribution by **less than 0.10pp** — below even the all-release median — which would retire the "this release owns the net-exports line" read |
| This quarter | **Read 10-28 as the composition print; never trade the morning** | High | It is the scheduled **final** Q3 nowcast, and its own session is measurably back-loaded: decision-day mornings make 44.8% of the range vs 80.1% baseline (SPY, n=21). An 08:30 macro print six hours before a live-hike statement is noise the tape has already learned to ignore. | SPY's **2026-10-28** 09:30–12:00 range printing **above 65%** of that session's full range — the p25 of ordinary sessions — registered as `FT-advance-economic-indicators-2026-10-28-2` |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** `symbols: []`, no macro-keyed playbook, and the session measurement
  says the morning is where decision-day variance *isn't*.
- **The number to read first** — the **advance goods trade balance**, specifically the *capital-goods
  imports* line. In July it was $140.1B, **+11.3% m/m and +46.9% y/y** while total imports rose 13.7% y/y;
  capital goods alone rose **$44.7B y/y against a $38.4B rise in total imports**, i.e. every other end-use
  category net-shrank. That single line is the whole story of this report right now.
- **Read the inventories lines second** — retail $838.5B (+0.7% m/m) and wholesale (+5.7% y/y) are the
  other half of what GDPNow revises here, and inventories are the lowest-quality line in the advance GDP
  estimate 10-29 turns on.
- **Expect the revision to be down, and size nothing on it** — 20 of 26 final AEIR vintages cut the
  nowcast (median −0.192pp, p=0.0047). Registered as `FT-advance-economic-indicators-2026-10-28-1`;
  it is a prediction about a data series, not a position.
- **Do not read the final nowcast as the advance GDP number** — median miss 0.469pp, p90 2.456pp across
  26 quarters. The gap between 10-28 and 10-29 is wider than most of what 10-28 will have moved.
- **The funding branch is closed for this edition and open for the December one** — H.R. 6500 (signed
  2026-09-02) funds through **2026-12-11**. This series' own precedent is worse than a delay: the
  **January- and February-2026 reference months were never published at all** ("Suspended" on the Census
  calendar), and December-2025 data slipped 1/28 → 2/19. `advance-economic-indicators-2026-12-28`
  (estimate, proposed in this PR) is the exposed edition.
- **Watch (dated)** — predecessor edition **09-30** 08:30 (Aug data; proposed here) · CPI **10-14** ·
  full international trade report **10-06** and **11-04** · advance durable goods **10-27** 08:30 ·
  **this print 10-28** 08:30 + **FOMC statement 14:00** + GOOG/META AMC (estimate) · **Q3 GDP advance +
  PCE 10-29** + AAPL/AMZN (estimate) · successor **11-27** · **CR expiry 12-11** · **12-28** edition
  (estimate, proposed here).

## Initial research

### The question, plainly

Does the September-2026 Advance Economic Indicators Report exist on 2026-10-28, what does a report that
lands 08:30 on FOMC decision-day morning and 24 hours before the Q3 GDP advance estimate actually tell
us, and does any of it license an action for a book holding NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN?

**One-line verdict:** it exists and it is, measurably, the single most composition-moving release on the
Atlanta Fed's calendar — and that is precisely why it is not tradeable: it moves *what the nowcast is
made of* by 12× the ordinary release while barely moving the headline, on a session whose variance is
back-loaded behind a 14:00 statement, ahead of a print it still cannot predict to better than half a
point.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target. Five
inputs, all fetched direct on 2026-09-05:

1. **`census.gov/economic-indicators/calendar-listview.html`** — the release grid carrying date, 8:30 AM
   time, reference month, and the `Suspended` rows.
2. **The July-2026 edition itself** (`census.gov/econ/indicators/advance_report.pdf`, release CB26-141),
   text layer decompressed locally — Table 1's end-use breakdown is where the capital-goods numbers above
   come from, not from a summary of it.
3. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed) — the posted schedule mapping every GDPNow update
   to the release that triggers it, through 2026-12-28.
4. **`GDPTrackingModelDataAndForecasts.xlsx`** (Atlanta Fed, 10.9MB) — `ContribArchives` and
   `TrackingArchives` give **1,871 model vintages from 2014-05-01 to 2026-07-28**, each stamped with the
   release that produced it, plus `ContribHistory`/`TrackingHistory` for the live Q3 2026 series. Every
   churn, delta and forecast-error number in this doc is computed from those vintages, not quoted.
5. **Yahoo hourly bars, 730 sessions (2023-10-09 → 2026-09-04), SPY and QQQ**, bucketed into ET regular
   hours and split at 12:00, against the FOMC meeting dates on
   `federalreserve.gov/monetarypolicy/fomccalendars.htm` (page footer "Last Update: August 19, 2026").

### Leg 1 — the report exists on 2026-10-28 · **SUPPORTED**, with the residual named

Two independent primaries agree. Census lists the slot at 8:30 AM for September 2026 data; the Atlanta
Fed's release-date workbook independently schedules a GDPNow posting for that morning naming this report.
The existence risk that justified a sibling ledger's whole first row — a funding lapse — closed by
signature on **2026-09-02** (H.R. 6500, funding through 2026-12-11), and 10-28 sits comfortably inside
that window.

The residual is worth stating precisely because this series behaves *worse* than its neighbours under a
lapse. Advance durable goods **delayed** ~27–29 days in 2025. This report **deleted editions**: the
January-2026 and February-2026 reference months read `Suspended` on the Census calendar to this day and
were never published, and December-2025 data moved 1/28 → 2/19 under a Census bulletin whose own wording
is "delayed due to the recent lapse in federal funding." Nothing threatens 10-28. It does mean the label
on the December edition should be read as *may not exist*, not *may be late* — which is why that entry is
proposed here as its own calendar row.

Status stays **estimate** per this lane's no-self-confirm limit, despite two primaries. Understating the
label only widens caution.

### Leg 2 — this release is the GDP nowcast's composition engine · **SUPPORTED**, and by more than expected

The sibling `gdp-q3-2026-advance-2026-10-29` ledger observed that the 2026-08-27 edition was the largest
single-day mover of Q3's nowcast composition. That was one observation. Extending it to the full vintage
archive turns it into a measurement:

| Vintage class | n | Median composition churn | Median \|Δ net exports\| | Median \|Δ nowcast\| |
|---|---|---|---|---|
| Advance Economic Indicators | 81 | **0.584pp** | **0.265pp** | 0.366pp |
| AEIR alone on the day (control) | 39 | **0.569pp** | 0.243pp | 0.441pp |
| Vintages naming a GDP release (control) | 71 | 0.301pp | — | — |
| Every other vintage | 1,741 | **0.048pp** | **0.002pp** | 0.086pp |

Churn = |Δequipment| + |Δnet exports| + |Δinventories|, in contribution points, versus the immediately
preceding vintage of the same quarter. The AEIR-alone control matters: some AEIR days share a date with a
GDP release, and stripping those *raises* the ratio rather than lowering it. The report out-churns even
the days GDP itself prints.

The asymmetry between composition and headline is the finding. The AEIR's median churn-to-headline ratio
is **1.47** against **0.449** for all other vintages — the ordinary release moves the headline about twice
as much as it moves the parts; this one moves the parts about 1.5× as much as the headline. Q3 2026's own
July edition is the extreme case, above this distribution's p90:

| 2026-08-27 (July data) | before | after | Δ |
|---|---|---|---|
| Equipment contribution | 0.48pp | 1.06pp | **+0.58** |
| Net exports contribution | −0.14pp | −1.31pp | **−1.17** |
| Inventories contribution | 1.71pp | 2.10pp | **+0.39** |
| **GDP nowcast headline** | **4.61%** | **4.40%** | **−0.21** |

2.14pp of composition moved to produce 0.21pp of headline — a 10.2× ratio. The report is a
recomposition instrument that happens to be reported as a growth number.

### Leg 3 — 10-28 is the *final* Q3 nowcast, and final AEIR vintages skew down · **SUPPORTED**

The Atlanta Fed's schedule row for 2026-10-28 reads, verbatim, `Final nowcast of 2026:Q3 GDP growth:
Advance Economic Indicators`. This is not incidental: the AEIR has been the last vintage before BEA's
advance estimate in **26 of the 49 quarters** in the archive, and in **every one of the last seven**
(2024-07-24, 2024-10-29, 2025-01-29, 2025-04-29, 2025-07-29, 2026-02-19, 2026-07-28). 10-28 is the eighth.

Across those 26 final vintages the revision is not symmetric: **20 were negative** (median −0.192pp, mean
−0.10pp; one-sided binomial p = 0.0047). A plausible mechanism is that the final month's goods-trade
balance arrives after the model has already absorbed the quarter's domestic strength, so the import line
is the last thing to land and it lands as a drag — consistent with the July edition's −1.17pp net-exports
move. That mechanism is *not* separately measured here; only the sign asymmetry is. It is registered as a
forward test rather than asserted.

### Leg 4 — the final nowcast tells you 10-29's headline · **REFUTED**

Across the same 26 quarters, |final nowcast − BEA advance estimate| has a **median of 0.469pp, a mean of
0.874pp and a p90 of 2.456pp** (all-final-vintage baseline: median 0.523pp). The best information state
that exists before the advance estimate is still, at the median, wrong by more than twice the size of the
revision the AEIR itself just made. Anyone tempted to read the 10-28 nowcast as a preview of the 10-29
print is trading a 0.19pp signal inside a 0.47pp error bar.

### Leg 5 — the FOMC decision-day slot makes the 08:30 print matter · **REFUTED**

The report lands at 08:30 ET on the second day of the Oct 27–28 FOMC, six hours before the statement. The
adjacent `durable-goods-2026-10-27` ledger measured that FOMC **day-1** sessions run ~17–19% narrower than
ordinary ones. Day 2 is the opposite shape and a stronger result for this event:

| SPY (n, hourly bars 2023-10-09 → 2026-09-04) | Morning share of session range | Full-session range | \|morning return\| | \|afternoon return\| |
|---|---|---|---|---|
| FOMC decision day (21) | **44.8%** | 1.122% | 0.176% | 0.295% |
| FOMC day 1 (21) | 82.1% | 0.831% | — | — |
| All other sessions (681) | **80.1%** | 0.854% | 0.310% | 0.215% |

QQQ reproduces it: 51.7% versus 85.4%. Decision day is a **wide** session — its full range beats baseline
— but the width is entirely back-loaded, and the morning is quieter than an ordinary morning in absolute
terms (SPY 0.176% vs 0.310%). The market spends decision-day morning waiting, and an 08:30 macro release
is what it waits *through*. This is the leg that closes the tradeability question, not the `symbols: []`
technicality.

### Leg 6 — the capital-goods import surge is the channel into our book's names · **MIXED**

The mechanism is real and now quantified from the primary. July capital-goods imports were **$140.1B,
+11.3% m/m and +46.9% y/y**, against total imports +13.7% y/y — capital goods rose $44.7B y/y while total
imports rose $38.4B, so on net every other end-use category shrank. That is the AI-hardware buildout
passing through the customs data, and it is the same flow that adds to equipment investment and subtracts
from net exports inside GDP.

What it is *not* is a trade. The report carries no symbol attribution, no vendor split, and no way to map
a dollar of capital-goods imports to any of NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN. It confirms the
cycle we already hold a view on; it adds no position-sizing information to it. Graded MIXED because the
mechanism is measured and the channel to the book is not.

### What the conditions support

Nothing to open. The honest output of this research is three reading instructions and two registered
predictions, all listed under **Signals & conditions** above. The one operational change is calendar
hygiene: the predecessor (09-30) and the funding-exposed successor (12-28) both earn rows, proposed in
this PR.

### Honest limits

- **The churn measurement is about a model, not about the market.** It shows how much the AEIR moves the
  Atlanta Fed's nowcast. It says nothing about how much it moves prices, and this doc makes no such claim.
- **The vintage archive is a snapshot.** GDPNow's own methodology has changed over 2014–2026, and a
  release's leverage on the model is partly a function of the model. The AEIR-alone control guards against
  co-release contamination, not against methodology drift.
- **n = 26 on the final-vintage skew and n = 21 on the decision-day session.** Both clear conventional
  significance on their own terms (p=0.0047; a 35-point gap in range share), and both are small enough
  that one anomalous quarter or one anomalous meeting moves them. Neither is sized on.
- **The 12-28 funding exposure is a precedent, not a forecast.** It rests on this series having deleted
  two reference months in 2026 under a prior lapse — which is what makes it worth a calendar row, and
  nothing more than that until the CR outcome is known.
- **`symbols: []` is doing real work.** Even if every measurement here were twice as strong, this event
  has no instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date is `estimate`).** Stand aside on 2026-10-28 and on every edition of this report. Read the
advance goods trade balance — capital-goods imports first, inventories second — as the composition tell
for `gdp-q3-2026-advance-2026-10-29`, and expect the release to rewrite the nowcast's parts far more than
its headline. Treat the 08:30 slot as inert: the session's variance lives after the 14:00 FOMC statement.
Nothing about this event licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The 2026-09-30 edition moves GDPNow's Q3 net-exports contribution by less than 0.10pp**, below even
  the all-release median. That would refute Leg 2's "this release owns the net-exports line" on the
  freshest possible observation and demote this event to an ordinary macro print.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-10-20.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook would make it a live
  question rather than a settled one.
- **Census moves or suspends the 2026-10-28 slot on its own calendar page.** Suspension is this series'
  demonstrated failure mode, not delay — a `Suspended` row would end this ledger, not reschedule it.
- **SPY's 2026-10-28 morning range exceeds 65% of that session's full range.** That kills the
  decision-day back-loading finding on the exact session it is being applied to.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-advance-economic-indicators-2026-10-28-1` — the 2026-10-28 final Q3 nowcast prints **below** the
  2026-10-27 vintage. Score by 2026-10-28.
- `FT-advance-economic-indicators-2026-10-28-2` — SPY's 2026-10-28 09:30–12:00 ET range is **below 65%**
  of that session's full 09:30–16:00 range. Score by 2026-10-28.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-53 | **Initial research. The event's own justification is upgraded from "a composition tell" to a measurement, and the tradeability question is closed against it.** Date re-verified against two primaries fetched today: Census `calendar-listview.html` ("October 28, 2026 | 8:30 AM | September 2026") and the Atlanta Fed's `GDPNowcastDataReleaseDates.xlsx`, whose 10-28 08:30 row reads "**Final nowcast of 2026:Q3 GDP growth: Advance Economic Indicators**" — this print is the last GDPNow vintage before BEA's advance estimate on 10-29. Status stays `estimate` (no self-confirm). **The headline measurement**, from 1,871 GDPNow model vintages (2014-05-01 → 2026-07-28, `ContribArchives`/`TrackingArchives`, fetched direct): AEIR-driven vintages carry median composition churn **0.584pp vs 0.048pp** for all 1,741 others (**12.2×**), and median \|Δ net exports\| **0.265pp vs 0.002pp** (**132×**); the AEIR-alone control (n=39) reads 0.569pp, higher than vintages naming a GDP release (0.301pp, n=71). Churn-to-headline ratio **1.47 vs 0.449** — it rewrites the parts, not the total. Q3's own July edition (08-27) was above p90: equipment 0.48→**1.06pp**, net exports −0.14→**−1.31pp**, inventories 1.71→**2.10pp** for a **−0.21pp** headline move (10.2×), reproducing the sibling `gdp-q3-2026-advance-2026-10-29` row exactly from the raw workbook. **Directional asymmetry found and registered:** the AEIR has been the final vintage in 26 of 49 quarters and all of the last seven; **20 of 26 revised the nowcast down** (median −0.192pp, one-sided binomial **p=0.0047**). **And the limit on it:** those same final vintages missed BEA's advance estimate by a median **0.469pp** (p90 2.456pp) — 10-28 does not tell you 10-29. **Tradeability closed:** 08:30 lands on FOMC **decision-day** morning (Oct 27–28, federalreserve.gov fetched today); across 21 decision days in 723 hourly sessions the 09:30–12:00 window makes **44.8% (SPY) / 51.7% (QQQ)** of the session range vs **80.1% / 85.4%** baseline, with \|morning return\| *below* baseline (0.176% vs 0.310%) and \|afternoon return\| above (0.295% vs 0.215%) — the day is wide and entirely back-loaded, complementing `durable-goods-2026-10-27`'s day-1 compression finding rather than repeating it. **Primary content read:** the July edition (CB26-141) gives a $118.8B goods deficit (+$17.4B m/m) on capital-goods imports of **$140.1B, +11.3% m/m / +46.9% y/y** — capital goods rose $44.7B y/y against $38.4B for total imports, so every other end-use category net-shrank; retail inventories $838.5B (+0.7% m/m), wholesale +5.7% y/y. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** the 09-04 payrolls (+162k vs +55k) and the CR signature (H.R. 6500, 2026-09-02, funding through 12-11) are carried from `jobs-2026-09-04` and `durable-goods-2026-10-27`, not re-derived; the funding branch is closed for this edition. **Volatility:** VIX **14.53** (Cboe delayed-quote API, 09-04 close; range 13.93–14.58) — the baseline reading for this event, nothing to diff against yet. **Geopolitical:** the capital-goods import surge is the tariff/AI-hardware channel and is measured above; no stance effect. **Event tape:** no September-data consensus exists at D-53 and none will before release week. **Suspension precedent found:** this series *deletes* editions rather than delaying them — the January- and February-2026 reference months read `Suspended` on the Census calendar and were never published, while December-2025 data slipped 1/28 → 2/19 ("delayed due to the recent lapse in federal funding," Census bulletin). **Two dated events proposed in this PR:** `advance-economic-indicators-2026-09-30` (Aug data, the read-ahead) and `advance-economic-indicators-2026-12-28` (Nov data, 17 days past `cr-expiry-2026-12-11` — the exposed edition). **Two forward tests registered:** `FT-advance-economic-indicators-2026-10-28-1` (final nowcast revises down) and `-2` (SPY morning range < 65% of session range), both score-by 2026-10-28. | **Initial stance set: stand aside, read the report, never trade the morning.** | 2026-09-26 (medium, 31+ band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
