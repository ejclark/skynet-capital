# Advance Economic Indicators Report (Oct 2026 data) — advance-economic-indicators-2026-11-27

**Kind:** macro-print · **Date:** 2026-11-27 (estimate, CENSUS: `economic-indicators/calendar-listview.html` re-fetched direct 2026-09-06 (HTTP 200, 91,396 bytes), all 179 rows parsed by this session; the row reads "Advance Economic Indicators Report (International Trade, Retail, & Wholesale) | November 27, 2026 | 8:30 AM | October 2026", release code `A202611270830`, reference `A202610`. Independently corroborated by the Atlanta Fed's `GDPNowcastDataReleaseDates.xlsx`, fetched direct 2026-09-06, whose `InternalUpdates` sheet carries a 2026-11-27 row reading "Advance Economic Indicators" — see Leg 2, the corroboration is of the date and **not** of a public nowcast posting. Filed estimate per this lane's no-self-confirm limit) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["adp-employment-2026-12-02","aws-reinvent-2026","beige-book-2026-11-25","chicago-pmi-2026-11-30","dallas-fed-mfg-2026-11-30","dallas-fed-tssos-2026-12-01","durable-goods-2026-11-25","fomc-blackout-start-2026-11-28","gdp-q3-2026-second-2026-11-25","georgia-senate-runoff-2026-12-01","ism-manufacturing-2026-12-01","japan-cpi-tokyo-flash-2026-11-27","jolts-2026-12-01","pce-2026-11-25","thanksgiving-half-day-2026-11-27"],"screenStreak":0} -->

## At a glance

**TL;DR.** **This is the year's most consequential AEIR that nobody will watch, and the reason is a
rule two sibling ledgers half-saw.** The Atlanta Fed posts a public GDPNow vintage for an Advance
Economic Indicators Report only when that edition is a quarter's **final** nowcast or shares its
morning with a GDP release. Across all ten 2026 editions the split is exact — posted: 02-19, 04-29,
07-28, 09-30, 10-28; internal (non-posting): 05-29, 06-26, 08-27, **11-27**, 12-28. So the
"unreadable December edition" the `-2026-12-28` ledger flagged is not a December quirk; it is the
series' ordinary mid-quarter state, and **11-27 is in it.** The twist is that mid-quarter editions
are the *bigger* movers. Measured over 1,822 GDPNow vintages (2014-05-01 → 2026-07-28, both release-tag
spellings, n=93 AEIR): mid-quarter AEIRs move the net-exports contribution a median **0.313pp against
0.140pp for the final-nowcast editions — 2.23×** — with composition churn 0.646pp vs 0.503pp. Against
everything else on the calendar an AEIR still runs **12.5× the churn and 171× the net-exports move**,
and revises the headline **down 62 of 93 times (66.7%, p = 0.0009)**. This edition also carries the
series' **longest lead of 2026 — 11 days** (the October full trade report is pushed to 12-08 by the
holiday) — and spends it on a **3.5-hour half session** at ~0.4× normal volume. There is exactly one
precedent, **2016-11-25**: that print cut the Q4-2016 nowcast 3.575% → **3.134%** (the cycle's
2nd-largest recomposition) and SPY closed **+0.37%** on 0.407× volume. Date is **estimate**,
`symbols: []`, and the call is stand aside on every horizon.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-82) | **Stand aside** | High | `symbols: []`, D-82, no October-data consensus can exist, and a re-grep of both house playbook docs for macro/holiday keying returns **0 hits**, run this session. There is no instrument to trade even if the print were readable. | A macro-keyed house playbook appearing in `docs/plans/trade-playbooks.md` before **2026-11-20** — none exists today |
| This week | **Stand aside — the live edition is 09-30, not this one** | High | Nothing about an October-reference goods trade balance is knowable in the first week of September. The next actual observation of this series is the **August-data edition on 2026-09-30**, already on the calendar. | Census moving or suspending the **2026-09-30** slot on its own calendar page before **2026-09-30**, which would break the read-ahead this call rests on |
| This month | **Watch the 09-30 edition's net-exports line; still no action** | Medium | 09-30 is the freshest test of the leg this whole ledger rests on — that the AEIR owns the trade line. If it moves GDPNow's net-exports contribution by less than 0.10pp, the premise weakens on the newest possible observation. | The **2026-09-30** edition moving GDPNow's Q3 net-exports contribution by **less than 0.10pp** — below even the all-release median — which retires the "this release owns the net-exports line" read |
| This quarter | **Read 11-27, never trade it — and expect no nowcast to read it against** | High | It is an `InternalUpdates` row, so the GDPNow page publishes nothing that morning; the vintage lands in the downloadable workbook instead. Meanwhile the session is the thinnest of the quarter and the one precedent produced a +0.37% close. | The Atlanta Fed posting a **public GDPNow vintage dated 2026-11-27** (site "latest estimate" advancing off the 11-25 vintage), registered as `FT-advance-economic-indicators-2026-11-27-1` |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** `symbols: []`, no macro-keyed playbook, date `estimate`, and a
  3.5-hour session in which to price it. Date-keyed *action* requires `confirmed` regardless.
- **Do not expect a GDPNow number that morning.** 2026-11-27 is an `InternalUpdates` row; the last
  *posted* AEIR vintage of 2026 is 10-28. Registered as `FT-advance-economic-indicators-2026-11-27-1`.
- **The information is not lost — the announcement is.** Internal-update vintages do land in the
  public `GDPTrackingModelDataAndForecasts.xlsx` (2026-05-29 and 2026-06-26 are in `ContribArchives`;
  2026-08-27 is a column in `ContribHistory`). Read the workbook, not the page.
- **The number to read first — the advance goods trade balance, capital-goods imports line.** It is
  where the July edition put **$140.1B, +11.3% m/m / +46.9% y/y** (carried from
  `advance-economic-indicators-2026-10-28`, which read release CB26-141 directly), and it is the line
  a mid-quarter AEIR moves 2.23× harder than the posted final editions do.
- **Expect the revision down, and size nothing on it** — 41 of 64 mid-quarter AEIR vintages cut the
  nowcast (p = 0.0164; 62 of 93 across all editions, p = 0.0009). Registered as
  `FT-advance-economic-indicators-2026-11-27-2`; it is a prediction about a data series, not a position.
- **Read October imports as a policy artifact before reading them as demand.** This report is the
  measured transmission channel for policy-driven trade distortion: the **2025-02-28** edition moved the
  net-exports contribution **−3.294pp** and the headline **−3.798pp** — the largest net-exports move in
  all 1,822 archived vintages. The 2026 analogue is narrower, not absent (Leg 7).
- **Attribution trap.** A move on 2026-11-27 has a half-day-liquidity story, a Wednesday-print story
  (PCE + Q3 GDP 2nd + Beige Book + durable goods all on 11-25), a Tokyo-CPI story and an 8:30-print
  story before it has any one of them — and the print produces no public number to attribute *to*.
- **Watch (dated)** — predecessor **09-30** 08:30 (Aug data) · **10-28** 08:30 (Sep data, the last
  posted vintage of 2026) · truce expiry **11-10** · APEC Shenzhen **11-18/19** · PCE + GDP-2nd +
  Beige Book + durable goods **11-25** · closure **11-26** · **this print 11-27** 08:30 into a 13:00
  close · FOMC blackout opens **11-28** · full October trade report **12-08** (closes this edition's
  11-day lead) · FOMC **12-09** · wholesale trade **12-09** 10:00 (proposed here) · CR expiry **12-11** ·
  successor **12-28** (internal-only and funding-exposed).

## Initial research

### The question, plainly

Does the October-2026 Advance Economic Indicators Report exist on 2026-11-27, what does an 8:30 a.m. ET
release into a 3.5-hour half session actually tell us, and does any of it license an action for a book
holding NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN?

**One-line verdict:** it exists, it is the series' *mid-quarter* shape — which measures as the bigger
mover of the trade line, not the smaller — it carries 2026's longest lead on the goods-trade balance,
and it delivers all of that into the thinnest session of the quarter with **no posted nowcast to read
it against**. Read it from the workbook; never trade the morning.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target. Five
inputs, all fetched direct on 2026-09-06:

1. **`census.gov/economic-indicators/calendar-listview.html`** — all 179 rows parsed, giving this
   event's row, the whole AEIR series, the full-trade-report series (Leg 5) and the `Suspended` rows.
2. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed) — **both** sheets, at the corrected media path
   (the `/-/media/documents/...` path used by earlier sessions now 404s; the live link on
   `atlantafed.org/cqer/research/gdpnow` is `/-/media/Project/Atlanta/FRBA/Documents/...`).
   `PostedUpdates` = 82 dated rows through 2026-12-23; `InternalUpdates` = 56 through 2026-12-28.
   Leg 2 is the difference between them.
3. **`GDPTrackingModelDataAndForecasts.xlsx`** (Atlanta Fed, 10.9MB) — `ContribArchives`
   (**1,871 vintages, 2014-05-01 → 2026-07-28**, each stamped with the releases that produced it) and
   `ContribHistory` (the live Q3-2026 series, 17 vintages through 2026-09-03). Every churn, delta and
   skew number below is computed from those vintages, not quoted.
4. **Yahoo daily bars, SPY and QQQ, 2016** — the 2016-11-25 precedent session and its trailing-20
   baseline (Leg 6). **Yahoo `^VIX` daily** for the probe-ref baseline: **14.53** at the 2026-09-04
   close (range 13.80–14.58).
5. **This repo's own ledgers**, carried rather than re-derived: the half-session measurements from
   [`thanksgiving-half-day-2026-11-27`](thanksgiving-half-day-2026-11-27.md), the July-edition primary
   content from [`advance-economic-indicators-2026-10-28`](advance-economic-indicators-2026-10-28.md),
   the suspension-attribution correction from
   [`intl-trade-full-report-2026-12-08`](intl-trade-full-report-2026-12-08.md), and the tariff legal
   status from [`us-china-tariff-truce-expiry-2026-11-10`](us-china-tariff-truce-expiry-2026-11-10.md).

**One method correction, stated up front.** The release tag in `ContribArchives` has **two spellings** —
`Advance Economic Indicators` and the abbreviated `Adv. Econ. Ind…`. Filtering on the long form alone
returns 79 vintages; both together return **93**. Sibling ledgers computed on 79/81. Nothing flips —
the headline ratio moves 12.2× → **12.5×** — but every number below uses the complete set, and the
largest net-exports move in the archive (Leg 7) is only visible with the short form included.

### Leg 1 — the report exists on 2026-11-27 · **SUPPORTED**, with the residual named

Two independent primaries agree. Census lists the slot at 8:30 AM for October 2026 data under release
code `A202611270830`; the Atlanta Fed independently schedules a GDPNow model update naming
"Advance Economic Indicators" that day. The funding branch is **closed for this edition**: H.R. 6500
(signed 2026-09-02) funds through **2026-12-11**, and 11-27 sits 14 days inside that window.

The residual is real but points at the *successor*. This series' demonstrated failure mode is
**deletion, not delay** — the January-2026 and February-2026 reference months read `Suspended` on the
Census calendar to this day and were never published. The `intl-trade-full-report-2026-12-08` ledger
established that this attribution belongs to *this* series specifically: across eight Census calendar
pages (2019–2026) the full FT-900 report published 84 consecutive reference months with zero gaps,
while every `Suspended` row belongs to the AEIR, Preliminary Steel Imports or the Advance Services
Report. Nothing threatens 11-27. It is `advance-economic-indicators-2026-12-28` that is exposed.

Status stays **estimate** per this lane's no-self-confirm limit, despite two primaries. Understating
the label only widens caution.

### Leg 2 — there is no posted nowcast that morning, and the rule is quarter position · **SUPPORTED**

2026-11-27 is an `InternalUpdates` row. The workbook's own framing makes those non-posting dates, and
`PostedUpdates` ends at 2026-12-23. What is new here is the **rule**, which falls straight out of
listing all ten 2026 editions:

| 2026 AEIR edition | Sheet | What the row says |
|---|---|---|
| 02-19 | Posted | `Final nowcast of 2025:Q4 GDP growth: International trade (Full report), Advance Economic Indicators` |
| 04-29 | Posted | `Final nowcast of 2026:Q1 GDP growth: … Advance Economic Indicators` |
| 05-29 | **Internal** | `Advance Economic Indicators` |
| 06-26 | **Internal** | `Advance Economic Indicators` |
| 07-28 | Posted | `Final nowcast of 2026:Q2 GDP growth: Advance Economic Indicators` |
| 08-27 | **Internal** | `Advance Economic Indicators` |
| 09-30 | Posted | `GDP (Q2 3rd estimate), … Advance Economic Indicators` |
| 10-28 | Posted | `Final nowcast of 2026:Q3 GDP growth: Advance Economic Indicators` |
| **11-27** | **Internal** | `Advance Economic Indicators` |
| 12-28 | **Internal** | `Advance Economic Indicators` |

Every posted edition is a quarter's final nowcast or shares its morning with a GDP release; every
internal one is a mid-quarter, AEIR-alone edition. That refines the `-2026-12-28` ledger's reading,
which framed internal-only status as what makes *that* edition "the least readable of the year." It is
not a December property. It is the series' ordinary mid-quarter state, it applies to half of 2026's
editions, and **11-27 is one of them**.

Scope limit, stated: this rule is measured on the one year the release-date workbook covers
(2025-12-23 → 2026-12-28, 138 dated rows). It is a description of the posted schedule, not a published
Atlanta Fed policy.

### Leg 3 — the editions nobody posts are the ones that move the trade line most · **SUPPORTED**

Churn = |Δequipment| + |Δnet exports| + |Δinventories| in contribution points, against the immediately
preceding vintage of the same quarter — the same definition the `-2026-10-28` ledger used, recomputed
here over the complete n=93 AEIR set:

| Vintage class | n | Median churn | Median \|Δ net exports\| | Median \|Δ headline\| | Revised down |
|---|---|---|---|---|---|
| **AEIR, mid-quarter** | **64** | **0.646pp** | **0.313pp** | 0.452pp | 41/64 (64.1%), p = 0.0164 |
| AEIR, final-of-quarter | 29 | 0.503pp | 0.140pp | 0.236pp | 21/29 (72.4%), p = 0.0121 |
| All AEIR | 93 | 0.599pp | 0.265pp | 0.365pp | **62/93 (66.7%), p = 0.0009** |
| Every other vintage | 1,729 | 0.048pp | 0.0015pp | 0.086pp | 897/1,729 (51.9%), p = 0.062 |

Two readings, in order of importance. First, the series-level result survives the recount and is if
anything stronger: an AEIR carries **12.5×** the composition churn and **171×** the net-exports move of
an ordinary vintage, and its down-skew is now significant at p = 0.0009 rather than resting on the
26-quarter final-vintage subsample alone.

Second — the finding this event needed — the **mid-quarter editions out-move the posted ones on the
line that matters**: 0.313pp vs 0.140pp on net exports, a **2.23×** gap, plus more churn (0.646 vs
0.503) and a bigger headline move (0.452 vs 0.236). The obvious mechanical explanation is that a
quarter-final vintage arrives with less left to revise, and this ledger does **not** decompose that;
the claim asserted is the observation, not the cause. But the ranking is the operational point:
the ones the Atlanta Fed does not announce are not the leftovers.

The seven November editions in the archive (this event's own calendar analogue) sit right on the
population: median churn 0.546pp, |Δ net exports| 0.268pp, five of seven revised down —
2016-11-25 (−0.441), 2017-11-28 (−0.463), 2019-11-26 (+0.828), 2020-11-25 (+5.028, a pandemic
vintage co-released with GDP), 2022-11-30 (−0.255), 2023-11-29 (−0.056), 2024-11-27 (−0.115).

### Leg 4 — "you will not be able to see it" is about the announcement, not the data · **SUPPORTED**

An internal update is un-*announced*, not unpublished. Both 2026-05-29 and 2026-06-26 — `InternalUpdates`
rows — appear as ordinary vintages in `ContribArchives` with their release tag intact, and the
2026-08-27 edition has its own column in `ContribHistory`, which is how the `-2026-10-28` ledger was
able to quote that vintage's before/after at all. The vintage exists in the same public workbook
everything else in this document is computed from.

What cannot be checked from a single snapshot is *when* it lands there — whether the workbook picks up
an internal vintage the same day or at its next posted refresh. That is left open and named in the
limits; the operational instruction ("read the workbook, not the page") does not depend on it.

### Leg 5 — this edition carries the series' longest lead of 2026 · **SUPPORTED**

The AEIR exists to precede the full **U.S. International Trade in Goods and Services** report on the
same reference month. Both series' 2026 dates, from the same Census fetch:

| Reference month | AEIR | Full FT-900 | Lead |
|---|---|---|---|
| Mar | 04-29 | 05-05 | 6d |
| Apr | 05-29 | 06-09 | 11d |
| May | 06-26 | 07-07 | 11d |
| Jun | 07-28 | 08-04 | 7d |
| Jul | 08-27 | 09-03 | 7d |
| Aug | 09-30 | 10-06 | 6d |
| Sep | 10-28 | 11-04 | 7d |
| **Oct** | **11-27** | **12-08** | **11d** |

Median 7 days, maximum 11 — corroborating the `-2026-12-28` ledger's "6–11 days, median 7," and putting
this edition at the top of the range. The mechanism is worth stating precisely because it is the
opposite of the intuitive one: **the AEIR is not pulled forward.** It lands 27 days after the reference
month ends, exactly like the September-data edition (10-28, also 27 days) and the July-data one (08-27).
It is the *full report* that the holiday pushes out, to 38 days versus 35 for September data. So the
extra lead is a gift of the calendar, and it is spent on a session running at a median **0.411×** its
trailing-20 volume with 3.5 hours of trading (measured across 32 day-after-Thanksgiving sessions,
1994–2025, by [`thanksgiving-half-day-2026-11-27`](thanksgiving-half-day-2026-11-27.md); carried, not
re-derived). Maximum product, minimum audience.

### Leg 6 — the one precedent says the print does the work and the tape ignores it · **SUPPORTED (n = 1)**

Across the archive's 93 AEIR vintages exactly **one** landed on a US half session: **2016-11-25**, the
day after Thanksgiving 2016. It is a single observation and is named as such, but it is the only one
there is, and it is unusually clean — an AEIR-alone edition at the same point in its quarter
(vintage 12 of 38; 11-27 will be ~12th of Q4-2026's cycle).

| 2016-11-25 (Oct 2016 data) | before | after | Δ |
|---|---|---|---|
| Net exports contribution | +0.050pp | **−0.218pp** | **−0.268** |
| Inventories contribution | 0.559pp | 0.396pp | −0.164 |
| Equipment contribution | 0.377pp | 0.375pp | −0.002 |
| **GDP nowcast headline** | **3.575%** | **3.134%** | **−0.441** |

That was the **2nd-largest composition move of the entire Q4-2016 nowcast cycle** (37 vintages) — and
the top three were all AEIR editions (12-29, 11-25, 2017-01-26). What the tape did with it: SPY closed
**+0.372%** on volume **0.407×** its trailing-20 median (QQQ 0.286×), with a true range **0.361×**
normal; the following Monday opened −0.163% and closed −0.469%. The largest scheduled recomposition of
that quarter's first half arrived, and the session it arrived in was ordinary-for-a-half-day in every
dimension. Note the 0.407× volume reading lands essentially on the 0.411× median the sibling ledger
measured over 32 years — the print did not bring anyone in.

### Leg 7 — the policy front-running channel · **MIXED**

The mechanism is proven and it runs through this exact report. In Q1 2025, an announced tariff date
pulled imports forward and the AEIR is where it hit the nowcast: the **2025-02-28** edition moved the
net-exports contribution **−3.294pp** and the headline **−3.798pp** in one release — the **largest
net-exports move among all 1,822 archived vintages** — and the 2025-03-28 edition added another
−0.998pp. Q1-2025's net-exports contribution went **−0.365pp → −5.265pp** across the quarter while the
nowcast went **2.89% → −2.732%**. If a policy date distorts trade flows, this 8:30 release is the
instrument that prices it into the nowcast first.

Why this is MIXED rather than SUPPORTED for *this* edition: the nearest 2026 policy date is
`us-china-tariff-truce-expiry-2026-11-10`, 17 days before this print — but that ledger establishes
that the **US-side tariff leg is legally dead** (SCOTUS held IEEPA does not authorize tariffs on
2026-02-20; collection stopped 2026-02-24), and what actually expires on 11-10 is **China's**
suspension of its October-2025 export controls. So any front-running landing in October import data
would be *export-control stockpiling* of rare earths and derived inputs, not tariff avoidance — a
narrower channel, with no measurement in this document and no symbol attribution in the report. The
mechanism is measured; this instance's channel is not.

### What the conditions support

Nothing to open. The honest output is four reading instructions and three registered predictions, all
listed under **Signals & conditions** above, plus one calendar entry: `wholesale-trade-2026-12-09`
(Census Monthly Wholesale Trade, October data, 10:00 a.m. ET — a *posted* GDPNow update per the same
workbook, and the release that closes the inventories half of this print's 11-day lead), proposed in
this PR. The goods-trade half's successor, `intl-trade-full-report-2026-12-08`, is already tracked.

### Honest limits

- **The churn measurement is about a model, not about the market.** It shows how much the AEIR moves
  the Atlanta Fed's nowcast. It says nothing about how much it moves prices, and this doc makes no
  such claim — Leg 6 is the only price observation here and it is n = 1.
- **The mid-quarter > final gap is an observation, not an explanation.** A quarter-final vintage has
  less left to revise; that confound is named and not decomposed. The gap is used for ranking, not
  for any causal story about what the Atlanta Fed chooses to post.
- **The posted/internal rule rests on one year of schedule.** The workbook covers 2025-12-23 →
  2026-12-28. Ten editions is enough to see the pattern and not enough to call it policy.
- **n = 7 November editions, n = 1 half-session precedent.** Both named where used, neither sized on.
  The November subsample includes a pandemic vintage (2020-11-25) that distorts its mean.
- **Workbook refresh timing for internal vintages is unobserved.** One snapshot cannot show when a
  non-posting vintage appears in the public file (Leg 4).
- **This ledger adds no independent legal primary on the 11-10 policy date.** Leg 7's legal status is
  carried wholesale from `us-china-tariff-truce-expiry-2026-11-10`.
- **`symbols: []` is doing real work.** Even if every measurement here were twice as strong, this event
  has no instrument attached and no house playbook keyed to it (grep: 0 hits, this session).

## Stance & kill switches

**Stance (date is `estimate`).** Stand aside on 2026-11-27 and on every edition of this report. Read
the advance goods trade balance — capital-goods imports first, retail/wholesale inventories second —
from the **Atlanta Fed workbook rather than the GDPNow page**, because this edition posts no public
vintage; expect it to move the nowcast's net-exports line harder than the posted "final nowcast"
editions do, and expect the revision to be down. Treat the 8:30 slot as inert: the session closes at
13:00 ET at roughly 0.4× normal volume, and the one precedent for this exact configuration produced
the quarter's second-largest recomposition and a +0.37% close. Nothing about this event licenses an
entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The Atlanta Fed posts a public GDPNow vintage dated 2026-11-27.** That kills Leg 2's rule on the
  exact date it is being applied to and makes this a readable print like 10-28.
- **The 2026-09-30 edition moves GDPNow's Q3 net-exports contribution by less than 0.10pp.** That
  refutes "this release owns the trade line" on the freshest possible observation and demotes this
  event to an ordinary macro print.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-11-20.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it a live
  question rather than a settled one.
- **Census moves or suspends the 2026-11-27 slot on its own calendar page.** Suspension is this
  series' demonstrated failure mode — a `Suspended` row ends this ledger rather than rescheduling it.
- **SPY's 2026-11-27 true range prints above 1.0× its trailing-20 median.** The precedent read 0.361×
  and the sibling's 32-year sample put 21 of 32 below 1.0; a normal-range half session with an 8:30
  print in it would be the first evidence the print reaches the tape.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-advance-economic-indicators-2026-11-27-1` — no public GDPNow vintage dated **2026-11-27** is
  posted; the site's latest estimate on that date still carries the 2026-11-25 vintage. Score by
  2026-11-27.
- `FT-advance-economic-indicators-2026-11-27-2` — the 2026-11-27 vintage revises the Q4-2026 nowcast
  **down** versus the immediately preceding vintage. Score by 2026-12-08.
- `FT-advance-economic-indicators-2026-11-27-3` — the 2026-11-27 vintage's |Δ net-exports contribution|
  is **at least 0.10pp**. Score by 2026-12-08.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-82 | **Initial research. The finding is a rule, and it inverts the hierarchy the two sibling AEIR ledgers implied.** Date re-verified against two primaries fetched today: Census `calendar-listview.html` (179 rows; "November 27, 2026 \| 8:30 AM \| October 2026", code `A202611270830`) and the Atlanta Fed's `GDPNowcastDataReleaseDates.xlsx` — at the **corrected media path**, the `/-/media/documents/…` URL earlier sessions used now 404s. Status stays `estimate` (no self-confirm). **Leg 2 — the rule:** the Atlanta Fed posts a public vintage for an AEIR only when it is a quarter's *final* nowcast or shares its morning with a GDP release. All ten 2026 editions split exactly — posted 02-19/04-29/07-28/09-30/10-28, internal 05-29/06-26/08-27/**11-27**/12-28. So `-2026-12-28`'s "least readable edition of the year" is not a December property; it is the ordinary mid-quarter state and this event is in it. **Leg 3 — and mid-quarter editions are the bigger movers:** over 1,822 vintages (2014-05-01 → 2026-07-28), mid-quarter AEIRs move net exports a median **0.313pp vs 0.140pp** for final-nowcast editions (**2.23×**), churn 0.646 vs 0.503, headline 0.452 vs 0.236; series-wide an AEIR runs **12.5× churn / 171× net exports** against 1,729 other vintages and revises **down 62 of 93 (p = 0.0009)**. **Method correction:** the release tag has two spellings (`Advance Economic Indicators`, `Adv. Econ. Ind…`); filtering on the long form alone returns 79, both return **93** — sibling ledgers computed on 79/81, nothing flips (12.2× → 12.5×) but the archive's largest net-exports move is only visible with both. **Leg 4 — sharpened, not contradicted:** internal-update vintages *are* in the public workbook (05-29 and 06-26 in `ContribArchives`, 08-27 a column in `ContribHistory`), so "you will not be able to see it" is about the announcement, not the data; refresh timing is unobservable from one snapshot. **Leg 5 — longest lead of 2026:** AEIR → full FT-900 by reference month runs 6/11/11/7/7/6/7 days, and October is **11** — the max. The AEIR is not pulled forward (27 days after month-end, same as 10-28); the holiday pushes the *full report* to 12-08. That maximum lead is spent on a 13:00-close session at a median **0.411×** volume (carried from `thanksgiving-half-day-2026-11-27`). **Leg 6 — the one precedent:** exactly one AEIR in the archive landed on a US half session, **2016-11-25**. It cut the Q4-2016 nowcast **3.575% → 3.134%** (net exports +0.050 → **−0.218pp**), the cycle's 2nd-largest recomposition of 37 vintages, with all top-three moves being AEIRs — and SPY closed **+0.372%** on **0.407×** volume, 0.361× range, the Monday after −0.469%. **Leg 7 — MIXED:** this report is the measured transmission channel for policy-driven trade distortion (2025-02-28 moved net exports **−3.294pp**, headline **−3.798pp** — largest in the archive; Q1-2025 net exports −0.365 → −5.265pp), but per `us-china-tariff-truce-expiry-2026-11-10` the US tariff leg is legally dead and the live 11-10 expiry is China's export-control suspension, so October front-running would be stockpiling, not tariff avoidance — unmeasured here. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** CR signed 2026-09-02 funds through 12-11, so this edition's funding branch is **closed** (14 days inside); the deletion-not-delay failure mode belongs to this series and exposes 12-28, per `intl-trade-full-report-2026-12-08`'s correction. **Volatility:** VIX **14.53** at the 2026-09-04 close (13.80–14.58) — baseline, nothing to diff against yet. **Geopolitical:** 11-10 truce expiry, APEC Shenzhen 11-18/19 — carried, see Leg 7. **Event tape:** no October-data consensus exists at D-82 and none will before release week; playbook grep for macro/holiday keying returns **0 hits**. **One dated event proposed in this PR:** `wholesale-trade-2026-12-09` (Census Monthly Wholesale Trade, Oct data, 10:00 ET, a *posted* GDPNow update — the release that closes the inventories half of this print's lead; the goods half's successor 12-08 is already tracked). **Three forward tests registered:** `-1` (no posted vintage on 11-27), `-2` (revision down), `-3` (\|Δ net exports\| ≥ 0.10pp). | **Initial stance set: stand aside; read it from the workbook, not the page; never trade the morning.** | 2026-09-27 (medium, 31+ band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-advance-economic-indicators-2026-11-27.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
