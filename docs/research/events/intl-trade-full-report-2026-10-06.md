# U.S. International Trade in Goods and Services, full FT-900 report (Aug 2026 data) — intl-trade-full-report-2026-10-06

**Kind:** macro-print · **Date:** 2026-10-06 (estimate, CENSUS: `economic-indicators/calendar-listview.html` row "U.S. International Trade in Goods and Services | October 6, 2026 | 8:30 AM | August 2026", internal id `A202610060830`, reference period `A202608`, fetched direct 2026-09-05; corroborated by the July release itself — CB 26-142 / BEA 26-40, whose summary box reads "Next release: Tuesday, October 6, 2026" — and by the Atlanta Fed's `GDPNowcastDataReleaseDates.xlsx`. Filed estimate per this lane's no-self-confirm limit) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["apple-eu-dma-terms-2026-10-01","ecb-account-2026-10-08","fomc-minutes-2026-10-07","ism-manufacturing-2026-10-01","ism-services-2026-10-05","jobs-2026-10-02","mrvl-investor-day-2026-10-06","opec-jmmc-68th-2026-10-04","treasury-10y-note-2026-10-07","treasury-30y-bond-2026-10-08","treasury-3y-note-2026-10-06","treasury-buyback-20y30y-2026-10-08","treasury-buyback-2y3y-2026-10-06","treasury-coupon-announcement-2026-10-01"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The sibling ledger [`advance-economic-indicators-2026-09-30`](advance-economic-indicators-2026-09-30.md)
deferred to this date — "the number lands 09-30, the meaning lands 10-06" — and left a kill switch here.
This session measured that switch against the actual revision record and found it cannot fire.** Across
**70 consecutive FT-900 vintages** (2020-09 → 2026-07, every monthly xlsx bundle fetched direct today),
the one-month revision to the prior month's Census-basis capital-goods import level is a median **$12M**,
a p90 of **$266M**, and a 70-vintage **maximum of $898M**. Killing the sibling's claim needs a **−$4.4B**
revision to July — **4.9× the largest revision ever observed in the sample.** A test that passes by
construction is not a test, so this ledger registers one that can actually fail. What 10-06 genuinely adds
is **clean attribution**: the Atlanta Fed schedules it as a **solo** GDPNow vintage — no co-release — the
exact mirror of the four-release bundle that made 09-30 hard to read. But there is little left to
attribute: the full report moves GDPNow's net-exports line a median **0.065pp** against the advance
report's **0.265pp**, and across 45 advance→full pairs it reverses more than half the advance move only
**5 times (11%)**. Date is **estimate**; `symbols: []`. On 2026-10-06 the item with an instrument attached
is **MRVL's investor day**, not this print.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-31) | **Stand aside** | High | `symbols: []`, no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed, and there is no instrument attached to this event at any date. | A macro-keyed playbook appearing in `docs/plans/trade-playbooks.md` before **2026-10-01** — none exists today |
| This week | **Stand aside — nothing before 09-30 changes the read** | High | This report attributes a number the **09-30** advance report sets; no trade release lands between today and then. GDPNow Q3 sits at **4.749%** (09-03 vintage), net exports **−1.456pp**. | Census moving or suspending the **2026-10-06** slot on `calendar-listview.html` before **2026-09-30** — suspension, not delay, is this series' demonstrated failure mode |
| This month | **Read the 10-06 report for the August end-use split; the inherited kill switch will pass, and that is the finding** | Medium | The revision channel it depends on has a 70-vintage max of $898M against the $4.4B it needs. Registered as `FT-intl-trade-full-report-2026-10-06-1`; the nowcast half as `-2`. | The **2026-10-06** FT-900 revising July's capital-goods import level by **≥$1.0B** — which would be the largest one-month revision in the 70-vintage record and would make the sibling's switch a live test after all |
| This quarter | **The AI-hardware attribution is the only channel from this series to the book — and it is a 2026 regime, not a constant** | Medium | Capital goods was the largest-magnitude m/m mover among the six major import end-use categories in **5 of the last 7 months**, against a **16.9%** base rate over 71 months (binomial p=**0.002**). Registered as `-3`. | Capital goods failing to be the largest-\|change\| major import end-use category in **both** the 2026-10-06 (Aug data) and 2026-11-04 (Sep data) reports — two consecutive misses end the regime claim |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print, and the tape says the same thing twice.** On the **32** solo FT-900
  release days since 2020 — the exact shape of 10-06 — SPY's median overnight gap is **0.267%** against a
  **0.331%** baseline (permutation p=0.40) and its median session range **0.990%** against **1.020%**
  (p=0.86); QQQ reads 0.287% vs 0.439% (p=0.17) and 1.430% vs 1.417% (p=0.94). A solo FT-900 day is, if
  anything, *quieter* than an ordinary session.
- **What 2026-10-06 actually carries is MRVL.** `mrvl-investor-day-2026-10-06` is **confirmed**,
  `impact: medium`, and has symbols; the day also holds `treasury-3y-note-2026-10-06` and
  `treasury-buyback-2y3y-2026-10-06`, with `fomc-minutes-2026-10-07` the next morning. Route any 10-06
  attention to those ledgers, not this one.
- **The number to read first — July's revised capital-goods import level.** July printed **$140,264M**
  (+$14,396M m/m). Anything inside **±$1.0B** of that is the modal outcome and confirms the sibling's
  switch was unfirable; the record's worst case is $898M.
- **The number to read second — August's end-use split.** July's rise was computers **+$6.9B**, accessories
  **+$6.6B**, semiconductors **+$1.2B** — 102% of the whole capital-goods rise. The YTD levels say buildout,
  not spike: computers **$220.8B vs $109.9B** a year ago, accessories **$133.3B vs $80.0B**, semis
  **$75.0B vs $43.8B**.
- **Attribution is clean here and was not on 09-30.** The Atlanta Fed's posted schedule row for 2026-10-06
  reads `International trade (Full report)**` with nothing beside it. Whatever GDPNow's trade line does that
  morning is this report's — which is why the 0.10pp test is worth registering here even though the expected
  move is smaller.
- **One test deliberately NOT registered.** A "SPY's 10-06 gap stays under 0.90%" prediction would pass
  ~90% of the time on the solo-day record. That is the same defect this ledger just found in the inherited
  switch, so the tape finding stays a stance reason and never becomes a scoreable claim.
- **Watch (dated)** — advance report **09-30** 08:30 (sets the number) · ISM mfg **10-01** · jobs **10-02** ·
  ISM services **10-05** · **this print 10-06** 08:30, alongside MRVL investor day + 3Y auction + 2-3Y
  buyback · FOMC minutes **10-07** · successor **11-04** (proposed in this PR, closes Q3 trade) ·
  CR expiry **12-11** · **12-08** edition sits three days before it.

## Initial research

### The question, plainly

A neighbouring ledger staked a kill switch on this release and told its reader to wait for it. **Is that
switch a real test, is the release readable on 2026-10-06, and does the report carry anything the advance
report on 09-30 will not already have said?**

**One-line verdict:** the release exists on three primaries and its vintage is cleanly attributable for the
first time in the series — but the inherited kill switch is unfirable by a factor of 4.9 on the actual
revision record, and the report itself moves the nowcast's trade line a quarter as far as the advance
report it follows, so the honest output is a replacement test, not a stance.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target. Five inputs,
all fetched direct on 2026-09-05:

1. **`census.gov/economic-indicators/calendar-listview.html`** — the release grid, parsed row-wise; it
   carries every 2026 FT-900 date with its internal id and reference period.
2. **The July-2026 FT-900 itself** (`.../current_press_release/ft900.pdf`, CB 26-142 / BEA 26-40, released
   08:30 ET 2026-09-03), text layer extracted locally — the next-release line, the end-use narrative, and
   the published **Revision Procedure**.
3. **71 consecutive FT-900 xlsx bundles**, `ft900xlsx_2009.zip … ft900xlsx_2607.zip` (statistical months
   2020-09 → 2026-07), each unpacked for **Exhibit 8** (*U.S. Imports of Goods by End-Use Category and
   Commodity*). Because each release prints the current month **and** the revised prior month, 71 vintages
   give **70 paired revision observations** per line item — this ledger's own archive, built this session.
4. **`GDPTrackingModelDataAndForecasts.xlsx`** (Atlanta Fed) — `ContribArchives`, **1,871 model vintages
   2014-05-01 → 2026-07-28** = **1,822 same-quarter deltas**; plus `GDPNowcastDataReleaseDates.xlsx` for
   the posted release-to-vintage map. Fetched from the current `/-/media/Project/Atlanta/FRBA/Documents/...`
   path — the older `/-/media/documents/...` path now serves a 404 page under HTTP 200 (noted so the next
   pulse does not read a bot-challenge body as data).
5. **Yahoo daily bars, SPY and QQQ, 2020-01-01 → 2026-09-04** (1,678 sessions), classified against the
   release-date map above, with a 20,000-iteration permutation test on medians.

### Leg 1 — the report exists on 2026-10-06 · **SUPPORTED**, on three primaries

Census lists the slot at 8:30 AM for August 2026 data (id `A202610060830`, reference period `A202608`). The
**July edition names its own successor** — CB 26-142's page-1 summary box reads verbatim "Next release:
Tuesday, October 6, 2026". The Atlanta Fed independently schedules a GDPNow posting that morning naming it.
A release series naming its own next date is the strongest form this evidence takes.

Publication risk is closed for this edition: H.R. 6500 (PL 119-103, signed 2026-09-02) funds through
2026-12-11, so no lapse touches 10-06. The exposed edition in this series is **2026-12-08**, three days
before the CR expiry — and the failure mode is deletion, not delay (the January- and February-2026
reference months read `Suspended` on the Census calendar to this day).

Status stays **estimate** per this lane's no-self-confirm limit, despite three primaries. Understating the
label only widens caution.

### Leg 2 — the inherited kill switch can fire · **REFUTED**, and this is the ledger's central finding

The sibling registered: *"The 2026-10-06 FT-900 revises July's capital-goods import rise below +$10B, or
attributes under half of it to computers/accessories/semiconductors."* July's published rise is **+$14,396M**
(capital goods except automotive, $125,869M → $140,264M), with computers +$6,895M, accessories +$6,647M and
semiconductors +$1,215M summing to **102.5%** of it. So the switch needs a **−$4.4B** revision to July's
level, or a **~$7.5B** reallocation away from the three named lines.

The FT-900's own published *Revision Procedure* says what 10-06 will restate: "Each month, the U.S. Census
Bureau revises the aggregate seasonally adjusted … export, import, and trade balance figures, **as well as
the end-use totals for the prior month**." So the channel exists. Its measured size does not:

| Exhibit 8 import line | n | median revision | median \|revision\| | p90 \|revision\| | max \|revision\| | share >\$1B |
|---|---|---|---|---|---|---|
| Total, Census basis | 70 | +$2M | $77M | $785M | $3,359M | 7.1% |
| **Capital goods, except automotive** | 70 | $0M | **$12M** | **$266M** | **$898M** | **0.0%** |
| Computers | 70 | $0M | $1M | $102M | $697M | 0.0% |
| Computer accessories | 70 | $0M | $1M | $21M | $614M | 0.0% |
| Semiconductors | 70 | $0M | $1M | $44M | $301M | 0.0% |
| Telecommunications equipment | 70 | $0M | $1M | $34M | $391M | 0.0% |

One-month revisions to the prior month's level, from 70 consecutive release pairs. **In 70 releases the
capital-goods import level has never been revised by as much as $1B**, and the largest revision on record
($898M, statistical month 2023-03) is **4.9× short** of the $4.4B the switch needs. The attribution clause
is further out of reach still: moving under half the rise away from computers/accessories/semiconductors
needs roughly $7.5B against a $697M record maximum on the largest of those three lines.

The revision record is not uniform, and the exception is worth carrying forward because it is the one month
a future pulse should not treat as quiet:

| Statistical month | 01 | 02 | **03** | 04 | 05 | 06 | 07 | 08 | 09 | 10 | **11** | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| median \|capital-goods revision\| | $16M | $14M | **$766M** | $10M | $26M | $4M | **$5M** | $11M | $15M | $11M | $178M | $10M |

March carries the annual seasonal-adjustment recalculation and is the only revision-heavy month in the
series; the three largest revisions on record are all March (2023-03, 2022-03, 2026-03). **July — the month
this switch is about — has a median revision of $5M.**

So the sibling's switch is a near-certain pass. That is not a criticism of registering it; it is a
measurement nobody had made, and it is the reason this ledger's own version is stated as a bound
(**<$1.0B**) that the record can actually break rather than as a threshold the record has never come near.

### Leg 3 — the full report changes the Q3 read the advance report sets · **REFUTED**

Re-derived here from `ContribArchives` rather than quoted from the sibling, and the shared numbers
reproduce exactly (129 full-report vintages, median 0.065pp; 45 pairs, 51% sign agreement) — the internal
validity check on this whole re-derivation:

| Vintage class | n | median \|Δ net exports\| | median \|Δ nowcast\| | P(\|Δ net exports\| < 0.10pp) |
|---|---|---|---|---|
| International trade, full report (no AEIR in vintage) | 129 | **0.065pp** | 0.134pp | **62.8%** |
| Advance Economic Indicators (any) | 81 | **0.265pp** | 0.366pp | 24.7% |
| Every other vintage | 1,612 | 0.001pp | 0.083pp | 96.2% |

Pairing each advance vintage with the next full-report vintage in the same quarter (n=45), three numbers
matter and the third is new here:

- the follow-up move is a median **0.29×** the size of the advance move;
- its **sign agrees 51%** of the time — a coin flip, so the full report neither confirms nor refutes;
- it **reverses more than half the advance move in 5 of 45 cases (11.1%)**, and reaches 0.10pp at all in
  only 14 of 45 (31.1%).

Read together: an 11% chance of a meaningful reversal is the honest size of "wait for the full report."
The live instance agrees — July advance goods deficit **$118.8B** (08-27) → full-report **$119.6B** (09-03),
a 0.7% revision; on the model, Q3 net exports −0.142 → **−1.312pp** (advance) → **−1.456pp** (full).

### Leg 4 — 10-06 is where the trade line becomes cleanly attributable · **SUPPORTED**, and it is the mirror of 09-30

The sibling's hard problem was contamination: GDPNow's 2026-09-30 08:30 row bundles four releases
(`GDP (Q2 3rd estimate), Personal income and outlays, NIPA underlying detail tables, Advance Economic
Indicators`), so a move that morning is not obviously the advance report's. The Atlanta Fed's row for
**2026-10-06 reads `International trade (Full report)**` and nothing else** — a solo vintage.

The archive says this matters as a *class*, not just on the date. Splitting the 130 full-report vintages by
whether anything shared the vintage: **47 solo, 83 bundled**, and the bundled ones are bundled with the
employment situation, ISM non-manufacturing or M3 manufacturing — releases with their own large channels.
So 10-06 is the first date in this pair where a trade-line reading needs no attribution argument at all.

The uncomfortable pairing is the point of this ledger: **09-30 is where the information is and the
attribution is muddy; 10-06 is where the attribution is clean and there is little information left.** That
is why `impact: low` is right on market impact and why the release still earns a ledger on information value.

### Leg 5 — the 10-06 session is a place to act on an 08:30 print · **REFUTED**, measured on the matching day class

The sibling closed this question for a quarter-end date; 10-06 is an ordinary Tuesday, so the argument is
re-derived on the release class itself. Daily bars, 1,678 sessions since 2020-01-01, split by the posted
release map:

| SPY (2020-01-01 →) | n | median \|overnight gap\| | median session range |
|---|---|---|---|
| **Solo FT-900 release day (the 10-06 shape)** | 32 | **0.267%** | **0.990%** |
| Bundled FT-900 release day | 34 | 0.427% | 1.090% |
| All other sessions | 1,612 | 0.331% | 1.020% |

Permutation tests (20,000 iterations, solo vs. all other sessions): **p=0.40** on the gap, **p=0.86** on the
range. QQQ reproduces it — 0.287% vs 0.439% (p=0.17) and 1.430% vs 1.417% (p=0.94). The bundled column is
the tell: FT-900 days that *are* wide are wide because the employment situation or ISM services shares the
morning, not because of the trade print.

What 2026-10-06 does carry is elsewhere on the calendar: `mrvl-investor-day-2026-10-06` (**confirmed**,
`impact: medium`, a name with symbols and its own ledger), `treasury-3y-note-2026-10-06`,
`treasury-buyback-2y3y-2026-10-06`, with `fomc-minutes-2026-10-07` the next morning. On any ranking of that
day, this print is the least market-relevant item on it.

### Leg 6 — the AI-hardware attribution is a durable property of this series · **MIXED**, and it is a 2026 regime

The book's only channel into this series is the end-use split, so the question is whether that split keeps
reading "datacenter hardware." Across the 71 parsed months, capital goods was the largest-magnitude m/m
mover among the six major import end-use categories in just **12 (16.9%)**. Across 2026 it is **5 of 7**
(Jan, Feb, Apr, Jun, Jul) — binomial p=**0.002** against the full-sample rate, **0.015** against the
2024-onward rate of 8/31. Level and trend agree: capital-goods imports ran $120.7B in March 2026 and
$140.3B in July, YTD **$870.0B against $638.7B** a year earlier (+36.2%), with computers **+101% YTD**,
accessories **+67%** and semiconductors **+71%**.

Graded MIXED, for two reasons stated rather than waved away. First, the trio's share of the capital-goods
move is not stable: across the 43 months with a ≥$1B capital-goods change the median share is **52.2%**, and
it clears 50% only **58%** of the time — 2026 has run 100%+ repeatedly (Jan 109%, Feb 102%, Jun 110%, Jul
103%) but also −28% (Mar) and −105% (May), where the trio moved against the aggregate. Second, a seven-month
regime is a seven-month regime; `n=7` supports a registered test, not a conclusion.

### What the conditions support

Nothing to open. The output is one measured refutation of an inherited kill switch, one attribution finding
that reverses the sibling's problem, three registered predictions, and one calendar proposal.

### Honest limits

- **The revision archive is Exhibit 8 only.** It measures what the release restates about the prior month.
  It says nothing about the *annual* revision each June, which restates a full year at once and is out of
  scope for a one-month kill switch — but a future close-out reading July's figure long after the fact
  should not treat these bounds as applying to it.
- **All the nowcast work measures a model, not a market.** Every Δ describes the Atlanta Fed's estimate.
  This doc makes no price claim except the session-class study, which is measured on SPY/QQQ directly and is
  a reason *not* to act.
- **n=32 on solo FT-900 days, and the null is the claim.** Failing to reject at p=0.40 is not proof of no
  effect; it is the absence of one large enough to see in 32 sessions, which is the direction in which a
  thin sample is safe for a stand-aside.
- **n=7 on the 2026 capital-goods regime.** Enough to register `-3` as an out-of-sample test, not enough to
  assert the regime holds. That asymmetry is deliberate.
- **No August consensus exists at D-31**, and none will before the 09-30 advance print sets the headline.
  Every August-content statement here is a base rate, never a forecast.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date is `estimate`).** Stand aside on 2026-10-06 and on every edition of this report. The reason
to open the file at all is the August end-use split, and the reason not to wait for it before acting on
anything is that the full report reverses more than half the advance report's move 11% of the time. Treat
the sibling ledger's inherited kill switch as **effectively pre-scored**: its revision channel has a
70-vintage maximum of $898M against the $4.4B it needs, so a pass on 10-06 is information about the test,
not about the claim — and this ledger's `-1` replaces it with a bound the record can break. Read the 10-06
vintage's net-exports move as the one **cleanly attributable** trade reading in the pair (solo vintage), and
expect it under 0.10pp. Treat the 08:30 slot as inert: solo FT-900 days are statistically indistinguishable
from ordinary sessions on both gap and range, and what 2026-10-06 actually carries is MRVL's investor day, a
3Y auction and a 2-3Y buyback. Nothing here licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The 2026-10-06 FT-900 revises July's capital-goods import level by ≥$1.0B.** That is a new record in a
  70-vintage series and would mean the revision channel is live after all — the sibling's switch becomes a
  real test and Leg 2 gets re-derived rather than patched.
- **The 2026-10-06 GDPNow vintage moves the Q3 net-exports contribution by ≥0.30pp** (above the advance
  report's own 0.265pp median). On a solo vintage that is unambiguously this report, and it would refute
  Leg 3's "the advance report is the trade information" ordering outright.
- **Capital goods is not the largest-\|change\| major import end-use category in both the 10-06 and 11-04
  reports.** Two consecutive misses end the 2026 regime claim, and with it the only channel from this series
  to the names this book holds.
- **Census moves or suspends the 2026-10-06 slot on its own calendar page.** Suspension, not delay, is this
  series' demonstrated failure mode — a `Suspended` row ends this ledger rather than rescheduling it.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-10-01.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it a live question.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-intl-trade-full-report-2026-10-06-1` — the 10-06 report revises July's Census-basis capital-goods
  import level by **<$1.0B** in absolute value. Score by 2026-10-06.
- `FT-intl-trade-full-report-2026-10-06-2` — the 10-06 GDPNow vintage moves the Q3-2026 net-exports
  contribution by **<0.10pp**. Score by 2026-10-06.
- `FT-intl-trade-full-report-2026-10-06-3` — **capital goods, except automotive** is the largest-magnitude
  m/m mover among the six major import end-use categories in the August data. Score by 2026-10-06.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-31 | **Initial research. The kill switch this event inherited from `advance-economic-indicators-2026-09-30` was measured against the actual revision record and cannot fire.** Date on three primaries fetched today: Census `calendar-listview.html` ("October 6, 2026 \| 8:30 AM \| August 2026", id `A202610060830`), the July FT-900's own "Next release: Tuesday, October 6, 2026" (CB 26-142 / BEA 26-40), and the Atlanta Fed schedule. Status stays `estimate` (no self-confirm). **The revision finding:** 71 consecutive FT-900 xlsx bundles (statistical months 2020-09 → 2026-07) parsed for Exhibit 8 give 70 paired one-month revisions; capital goods except automotive revises a median **$12M**, p90 **$266M**, **max $898M — never $1B in 70 releases**, against the **−$4.4B** the switch needs (4.9× short), and ~$7.5B for its attribution clause. March is the only revision-heavy statistical month (median $766M, annual seasonal recalculation); July's median is **$5M**. **Attribution, reversed from the sibling's problem:** the Atlanta Fed schedules 2026-10-06 as a **solo** `International trade (Full report)**` vintage — no co-release — where 09-30 bundles four; class-wide the full report is solo in 47 of 130 vintages. **Magnitude re-derived** from `ContribArchives` (1,871 vintages → 1,822 same-quarter deltas): full report median \|Δ net exports\| **0.065pp** (n=129, **62.8%** under 0.10pp) vs advance **0.265pp** (n=81); across 45 advance→full pairs the follow-up is **0.29×**, sign agreement **51%**, and it reverses >half the advance move only **5/45 (11.1%)** — reproducing the sibling's shared figures exactly. **Session leg re-derived on the release class:** 1,678 SPY/QQQ daily sessions since 2020; on the **32 solo FT-900 days** SPY's median \|gap\| is **0.267%** vs **0.331%** baseline (permutation p=0.40) and range **0.990%** vs **1.020%** (p=0.86), QQQ 0.287%/0.439% (p=0.17) and 1.430%/1.417% (p=0.94) — bundled FT-900 days are the wide ones and the width belongs to the co-release. **Content regime:** capital goods was the largest-\|change\| major import end-use category in **5 of the last 7 months** vs a **16.9%** rate over 71 months (binomial p=0.002); YTD capital-goods imports **$870.0B vs $638.7B**, computers +101%, accessories +67%, semis +71%. Trio share of the capital-goods move is median **52.2%** and clears 50% only **58%** of months — graded MIXED. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** GDPNow Q3 **4.749%** (09-03 vintage), net exports **−1.456pp**; jobs 10-02 and ISM services 10-05 precede this print, FOMC minutes 10-07 follows. **Volatility:** VIX **14.53** (2026-09-04 close, range 13.80–14.58) — baseline, nothing to diff against yet. **Geopolitical:** PL 119-103 funds through 2026-12-11, so no publication risk on this edition; the exposed one is 2026-12-08. **Event tape:** no August consensus at D-31; 2026-10-06 also carries `mrvl-investor-day-2026-10-06` (confirmed, medium, has symbols), a 3Y auction and a 2-3Y buyback — the tradeable items that day. **Fetch note for the next pulse:** the Atlanta Fed's `/-/media/documents/...` xlsx paths now return a 404 page under HTTP 200; the live path is `/-/media/Project/Atlanta/FRBA/Documents/cqer/researchcq/gdpnow/`. **One dated event proposed in this PR:** `intl-trade-full-report-2026-11-04` (September data, closes Q3 trade; EST: Census `calendar-listview.html` + Atlanta Fed schedule). **Three forward tests registered:** `-1` (July capital-goods revision <$1.0B), `-2` (net-exports move <0.10pp), `-3` (capital goods the largest end-use mover in August), all score-by 2026-10-06. | **Initial stance set: stand aside; the inherited kill switch is unfirable and is replaced by a breakable bound; read 10-06 for the August end-use split only.** | 2026-10-05 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
