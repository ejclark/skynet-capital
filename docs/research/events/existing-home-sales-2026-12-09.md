# Existing-Home Sales (NAR, November 2026 data) — existing-home-sales-2026-12-09

**Kind:** macro-print · **Date:** 2026-12-09 (**confirmed**, `IR:` NAR's own 2026 Statistical News Release Schedule — nar.realtor/newsroom/nar-statistical-news-release-schedule, fetched direct 2026-09-06, "DECEMBER | Wed., Dec. 9 | November Existing-Home Sales", plus its .docx twin published 2025-11; promoted this session from the `EST:` single-source proposal) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-tankan-2026-12-14","cpi-2026-12-10","cr-expiry-2026-12-11","ecb-quiet-period-start-2026-12-09","ercot-data-center-audit-filing-2026-12-10","fomc-2026-12-09","g20-miami-2026-12-14","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","intl-trade-full-report-2026-12-08","japan-balance-of-payments-2026-12-08","japan-cgpi-2026-12-10","jobs-2026-12-04","productivity-costs-q3-revised-2026-12-08","wholesale-trade-2026-12-09"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **The date is no longer an estimate — NAR's own published 2026 calendar carries it — and the
sibling ledger's central worry about this print is wrong in a useful direction.** The 12-09 GDPNow
vintage carries two releases, and they move **different lines**, so it is *separable*, not muddled:
across **1,822** same-quarter vintage deltas the **140** naming an existing-home-sales release move
the **residential-investment** contribution a median **0.0376pp** against **0.0057pp** for the other
1,682 (permutation p<**0.0001**) while moving change-in-inventory-investment **0.0001pp** against
0.0197pp — on **92.9%** of them residential is the larger move, against a **36.5%** base rate. That is
the model's own wiring: the Atlanta Fed workbook routes `valExHomeSales` into a line literally labelled
**"Brokerage commissions"**, because an existing home is a transfer of an existing asset and only the
commission is output. Inventories belong to the wholesale print; residential belongs to this one.
`symbols: []` is now **measured, not assumed** — over **122** EHS release days since 2016 the
homebuilder ETFs are inert (**ITB 1.911%** median session range vs a **1.839%** baseline, p=**0.40**;
XHB 1.693% vs 1.629%, p=0.46), while the *same* names move hard on the SEP decision this print shares
its day with (**ITB 2.918%**, p=0.0003). And this configuration is **not** unprecedented the way the
sibling's is: EHS has landed on an FOMC decision day **5 times since 2014**. Nothing here licenses an
entry — the call is stand aside on every horizon, and the readable thing is a nowcast line, not a tape.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-94) | **Stand aside** | High | `symbols: []` is a measurement, not a placeholder: 122 EHS release days since 2016 leave ITB (p=**0.40**), XHB (p=0.46) and SPY (p=0.75) at baseline range. No house playbook (S1/S2/E1/S3/S4 + G1) is macro- or housing-keyed — a re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** housing hits today. No instrument attaches on any date. | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-12-01** — none exists today |
| This week | **Stand aside — the next EHS print is 2026-09-10 and it belongs to no ledger** | High | NAR's own schedule puts August data on **Thu., Sep. 10, 10:00 ET**, four days out; the last published edition is **July 2026** (**4.06M** SAAR, **−1.7%** m/m). VIX **14.53**, SPY **770.19**, ITB **93.91** (2026-09-04 closes). | NAR moving or dropping the **2026-09-10** row from its own 2026 schedule before **2026-09-10** — the page and its .docx twin agreed on it today |
| This month | **Treat 2026-09-10 as the unconfounded rehearsal for 12-09 — measure it, do not trade it** | Medium | The Atlanta Fed schedules a GDPNow vintage that morning reading **"Wholesale trade, Producer Price Index, Existing-home sales"** — the same two releases as 12-09, on an ordinary session with no FOMC. It is the one chance before December to watch inventories and residential separate on a clean tape. Medium, not high, because the free-text schedule states what is *posted*, not what is *incorporated*. | The **2026-09-10** vintage moving **neither** the residential nor the inventories contribution by **≥0.02pp**, which would say the co-release labels overstate what the model actually ingests |
| This quarter | **Never attribute the 12-09 tape to this print — read its residential line instead** | High | 12-09 is the **SEP decision day** of the Dec 8–9 meeting. The 14:00–16:00 window takes **85.8%** of SPY's decision-day range and the 10:00 hour containing this print takes **26.0%** against a **40.4%** baseline (721 hourly sessions, p=**0.0006**); homebuilders compress the same way (**ITB 23.3%** vs 35.8%, p=0.0027). The nowcast line, by contrast, *is* attributable. | SPY's **2026-12-09** 10:00–11:00 ET range printing **at or above 31.1%** of that session's 09:30–16:00 range — the p25 of ordinary sessions — registered as `-3` |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `symbols: []` is measured inert, and no
  macro- or housing-keyed playbook exists. Research is not action.
- **The line to read is residential investment, not inventories.** This print's only GDP channel is
  brokerage commissions; it moves inventories a median **0.0001pp**. Registered as `-1`.
- **The corollary the sibling should carry: a large 12-09 inventories move is not this print.**
  On the **109** solo EHS vintages, **100%** move inventories by under 0.10pp.
- **Do not read "confirmed" as licence.** The date is now the publisher's own; the call is unchanged.
- **December is where NAR's new calendar meets the Fed's.** NAR moved EHS from day ~21 to day
  **9–14** in January 2026, and **7 of 14** December decision days on record fall in that window.
- **Watch (dated)** — August data **09-10** (the rehearsal vintage) · FOMC **09-16** · September data
  **10-13** · October data **11-12** (proposed; the unconfounded control) · October PHSI **11-18** ·
  wholesale **12-09** on this vintage · **FOMC SEP decision 12-09 14:00** · CPI **12-10** · **CR expiry
  12-11** · MTIS **12-16** · **12-17 08:30 housing starts (Census, exposed) and 10:00 PHSI (NAR,
  immune)**, both proposed here · December data ~**2027-01-13** (the 2027 NAR schedule is unpublished).

## Initial research

### The question, plainly

This event reached the calendar as a single-sourced proposal from the `wholesale-trade-2026-12-09`
sweep, whose own notes set this session's assignment in one line: *"its own initial research should
re-verify the date against NAR before anything is built on it."* That lane also handed down a framing
— that the 12-09 GDPNow vintage is **harder to attribute** because it is shared, and that the 12-09
session is unreadable because the SEP decision lands at 14:00. **Does NAR's own calendar carry the
date, and does the shared-vintage worry survive contact with what this print actually moves?**

**One-line verdict:** the date is the publisher's own and the label is promoted to `confirmed`; the
attribution worry is **inverted** — the two halves of the 12-09 vintage move orthogonal lines, so the
vintage is the most separable kind of shared vintage there is — and the tape claim survives intact but
is now measured on homebuilders rather than assumed to transfer from SPY.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target; the
equity work below is a purpose-built read of daily and hourly bars. Eight inputs, all fetched direct on
2026-09-06:

1. **`nar.realtor/newsroom/nar-statistical-news-release-schedule`** (HTTP 200, 483,177 bytes) and its
   downloadable twin **`/sites/default/files/2025-11/2026-nar-statistical-news-release-schedule.docx`**
   (HTTP 200, 55,384 bytes, published 2025-11) — the publisher's own forward calendar, full year.
2. **`nar.realtor/research-and-statistics/housing-statistics/existing-home-sales`** (HTTP 200,
   588,410 bytes) — the current edition and the next-release note.
3. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed) — `PostedUpdates`, **82 dated rows**
   2025-12-23 → 2026-12-23.
4. **`GDPTrackingModelDataAndForecasts.xlsx`** — `ContribArchives` (**1,871 vintages 2014-05-01 →
   2026-07-28 = 1,822 same-quarter deltas**) and the **`Residential`** sheet, read for the model's own
   variable wiring rather than for numbers.
5. **`federalreserve.gov/monetarypolicy/fomccalendars.htm`** plus the **2014–2020 historical panels**,
   parsed two ways (statement-PDF filenames `monetary<YYYYMMDD>a` for past meetings, calendar date
   cells for future ones) and unioned — **118** decision days 2014→2027, **28** SEP-flagged.
6. **`census.gov/economic-indicators/calendar-listview.html`** (HTTP 200, 91,396 bytes) — for the
   12-17 New Residential Construction row proposed below.
7. **Yahoo daily bars**, SPY / QQQ / ^VIX / ITB / XHB / DHI / LEN / PHM, **4,194 sessions**, with
   20,000-iteration permutation tests on medians.
8. **Yahoo hourly bars**, SPY and ITB, **721 sessions 2023-10-09 → 2026-09-04**, for the position of
   the 10:00 slot inside the session.

Two collection notes. Yahoo's chart endpoint returned **429** to a plain fetch and needed a
cookie+crumb handshake; every bar below is from the authenticated pull, and the closes reproduce the
sibling ledger's exactly (SPY **770.19**, QQQ **718.96**, VIX **14.53** on 2026-09-04), which is the
cross-check that the two ledgers are reading one tape. **RDFN returned 404** and was dropped rather
than substituted — Redfin is no longer a standalone listing on that endpoint; the homebuilder read
below rests on ITB, XHB, DHI, LEN and PHM.

### Leg 1 — the date, and the source the proposing lane could not find · **SUPPORTED**, and promoted to `confirmed`

The proposal rested on the Atlanta Fed's incorporation schedule alone, having tried
`nar.realtor/newsroom/release-schedule` (404). The real path is linked from NAR's own statistics page
as *"NAR Research Data Release Dates"*: `/newsroom/nar-statistical-news-release-schedule`. Its 2026
table, and the .docx published in November 2025, both read:

> **DECEMBER** — Wed., Dec. 9 · **November Existing-Home Sales** · Thu., Dec. 17 · November Pending
> Home Sales Index

under the page's standing note *"All releases are distributed at 10 a.m. Eastern Time."*

Three independent corroborations. The Atlanta Fed's `PostedUpdates` 2026-12-09 10:00 row reads
"Wholesale trade, Existing-home sales". NAR's live statistics page separately states *"Existing-Home
Sales for August 2026 will be released on Thursday, September 10, 2026 at 10:00 a.m. Eastern"* — the
same schedule's September row. And the seven 2026 EHS dates the GDPNow archive's free text names
(01-14, 02-12, 03-10, 04-13, 05-11, 06-09, 07-09) match NAR's published calendar **7 for 7**, which
validates both the calendar and the archive-derived method used throughout the rest of this document.

**Status promoted `estimate` → `confirmed`, prefix `EST:` → `IR:`.** The precedent is exact and already
on this calendar: `challenger-job-cuts-2026-09-03` is a private publisher's macro series carried
`confirmed`/`IR:` on the publisher's own release. NAR is the producer of this series, not an aggregator
reporting it. Per the lane's hard limits a flip requires a primary source and this is one; per the date
policy it still licenses nothing, and the call below is stand aside either way.

**One correction the promotion carries:** the reference month is **November 2026**, not October. The
sibling ledger frames 12-09 as part of an "October reference cycle" — true of the wholesale print (a
39-day lag) and false of this one (a **9-day** lag). The two halves of one vintage report **different
months**.

### Leg 2 — what this print actually moves · **SUPPORTED**, and it is the model's own wiring

Existing homes are transfers of existing assets. Nothing about the sale enters GDP except the service
rendered — the broker's commission. The Atlanta Fed's workbook says so in its own variable names; the
`Residential` sheet's rows 15–20 read:

| Model variable | Label |
|---|---|
| `FRSBKX_USNAqtr` / `FRSBKZ_USNAqtr` | **Brokerage commissions** |
| `valTotalHomeSales` | Level feeding it |
| **`valExHomeSales`** | **"Real" value of existing home sales** |
| `valNewHomeSales` | "Real" value of new home sales |

Sibling leaves of the same residential node are `FRSPX_USNAqtr` ("Permanent-site", fed by
`SplicedNewHousingConstruction`), manufactured homes, dormitories, improvements and residential
equipment. So this print touches **one leaf of one component**, and the archive agrees:

| Line | EHS vintages (n=140) | Every other vintage (n=1,682) | p |
|---|---|---|---|
| **Residential investment** | **0.0376pp** | **0.0057pp** | **<0.0001** |
| Change in inventory investment | **0.0001pp** | 0.0197pp | 0.0009 |
| Change in net exports | 0.0003pp | 0.0025pp | 0.0256 |
| PCE | 0.0012pp | 0.0124pp | 0.0712 |
| GDP nowcast (headline) | **0.0445pp** | 0.0997pp | 0.0022 |

Median absolute same-quarter change, 20,000-iteration permutation tests. Read the second row as
carefully as the first: an EHS vintage moves the inventories line **two hundred times less** than an
average vintage does, and moves the headline **less than half** as much. Directly: on **130 of 140
(92.9%)** EHS vintages the residential move exceeds the inventories move, against **36.5%** on the
other 1,682. `P(|Δ residential| < 0.10pp)` is **82.1%** for EHS vintages against 91.6% baseline —
this print is the *only* thing that reliably touches that line, and it still moves it by a rounding
correction most of the time.

### Leg 3 — the sibling's shared-vintage worry · **REFUTED**, and this is the ledger's central finding

The proposing lane's note reads: this print *"is the measured reason that print's nowcast reading is
harder to attribute than its 12-08 neighbour's,"* citing its own finding that shared wholesale vintages
move inventories 0.0854pp against 0.0485pp solo (p=0.045). That inference does not survive being asked
*which* co-release does the sharing. Splitting the EHS vintages the same way:

| EHS vintage composition | n | median \|Δ residential\| | P(<0.10pp) | median \|Δ inventories\| | P(<0.10pp) |
|---|---|---|---|---|---|
| **Solo** (`Data releases` reads "Existing-home sales" alone) | **109** | 0.0353pp | 82.6% | **0.0001pp** | **100.0%** |
| Shared with ≥1 other release (the 12-09 shape) | 31 | 0.0507pp | 80.6% | 0.0021pp | 83.9% |
| permutation p | | 0.172 | | **<0.0001** | |

The residential column does **not** separate (p=0.17) — sharing a day does not change what an EHS
release does to the line it owns. The inventories column separates violently, and in the direction that
kills the worry: a **solo** EHS vintage moves inventories by under 0.10pp **109 times out of 109**. The
0.0021pp on shared vintages is the *co-release* moving inventories, not the EHS print.

So the correct reading of 2026-12-09 is the opposite of the one handed down. **Each release owns a
different line, and neither contaminates the other's.** The vintage is decomposable by construction:
whatever the inventories contribution does that morning is the wholesale print, and whatever the
residential contribution does is this one. The sibling's own `-1` (inventories move <0.10pp) and this
ledger's `-1` (residential move <0.10pp) can therefore both be scored from the same vintage without
either confounding the other — which is a better outcome for both ledgers than the caveat it replaces.

Graded REFUTED rather than merely amended because the pairing evidence the worry rested on is thinner
than it looks. Only **2 of 140** EHS vintages in the archive also name wholesale trade — 2019-03-22
(Δresidential +0.2109pp, Δinventories +0.3851pp) and 2026-06-09 (+0.0595pp, +0.0484pp). Two
observations, disagreeing about which line moved more. Neither ledger should lean on them, and this one
does not.

### Leg 4 — the print's own tape, in the sector that should care · **REFUTED** (there is nothing to trade)

The wholesale ledger measured SPY and found the release inert. That is a weak test for a housing print:
if EHS moves anything it should move homebuilders. It does not. Daily bars, **2016-01-01 onward**,
median session range, permutation tests against a baseline that excludes both EHS days and FOMC days:

| | EHS release day (n=122) | p | FOMC decision day (n=90) | p | SEP decision day (n=22) | p | Baseline (n=2,562) |
|---|---|---|---|---|---|---|---|
| **SPY** | 0.894% | 0.75 | 1.127% | **0.0016** | **1.412%** | **0.0025** | 0.874% |
| **ITB** | 1.911% | 0.40 | 2.492% | **<0.0001** | **2.918%** | **0.0003** | 1.839% |
| **XHB** | 1.693% | 0.46 | 2.303% | **<0.0001** | **2.721%** | **0.0002** | 1.629% |

Open-to-close moves say the same (ITB 0.836% on EHS days vs 0.845% baseline, p=0.92). **The sector with
the obvious channel does not move on the print, and moves +59% wider than baseline on the decision this
print shares its day with.** That is the cleanest statement of why `symbols: []` is right here: not
"nothing in the book is exposed to housing" but "the exposed names demonstrably do not respond to this
release, and do respond to the thing that shares its session."

### Leg 5 — is 12-09 unprecedented? · **REFUTED**, and there is a real if small sample

The sibling's framing — *"the first ever on an SEP decision day"* — is true of Monthly Wholesale Trade
and false of this series. Cross-referencing the 140-date EHS archive against the unioned meeting panel:

| EHS release on an FOMC decision day | Month | SPY range | ITB range | ITB open→close |
|---|---|---|---|---|
| 2017-09-20 | Sep | 0.51% | 1.37% | −1.00% |
| 2018-03-21 | Mar | 1.14% | 2.22% | +1.57% |
| 2018-12-19 | Dec | **3.94%** | **4.05%** | −0.98% |
| 2021-09-22 | Sep (SEP-flagged) | 1.44% | 1.62% | +0.01% |
| 2022-09-21 | Sep (SEP-flagged) | 3.09% | 3.30% | −1.95% |

**Five instances since 2014**, every one of them in March, September or December — the Fed's
quarterly-projection months. So 2026-12-09 is the **sixth**, not the first, and the ITB open-to-close
column across the five (−1.00, +1.57, −0.98, +0.01, −1.95) carries no sign the way a data surprise
would. What it carries is the FOMC's: 2018-12-19 and 2022-09-21, the two widest sessions in the table,
are the December-2018 rout and the 75bp September-2022 hike.

The intraday structure explains why, and re-derives the sibling's numbers on the same window rather
than importing them. **721 hourly sessions, 2023-10-09 → 2026-09-04**, share of the session's full
09:30–16:00 range:

| Window | Decision days (n=24) | SEP decision (n=11) | EHS release (n=32) | Baseline (n=665) |
|---|---|---|---|---|
| **SPY 10:00–11:00** (this print's hour) | **26.0%** | **16.8%** | 37.5% (p=0.41) | **40.4%** |
| SPY 14:00–16:00 | **85.8%** | 78.2% | 36.9% | 39.5% |
| **ITB 10:00–11:00** | **23.3%** | 20.9% | 35.7% (p=0.99) | **35.8%** |
| ITB 14:00–16:00 | **63.8%** | 63.3% | 31.6% | 29.9% |

p=**0.0006** (SPY) and p=**0.0027** (ITB) on the 10:00 hour. Baseline 10:00-hour quartiles: SPY p25
**31.1%** / p50 40.4% / p75 52.7%; ITB p25 **28.7%** / p50 35.8% / p75 48.0%. Decision-day quartiles:
SPY 16.8 / 26.3 / 29.9; ITB 13.7 / 23.8 / 25.8. Two readings worth separating. **On an ordinary EHS
release day the print's hour is exactly baseline** — 37.5% SPY, 35.7% ITB, both p>0.4 — which is
another way of saying the release does nothing to its own hour. **On a decision day that hour is the
most compressed part of an unusually wide session**, for homebuilders as much as for the index.

### Leg 6 — why this collision happened now, and whether it recurs · **MIXED**

NAR moved its release calendar forward by about ten days effective January 2026. Day-of-month of every
EHS release the GDPNow archive names:

| Year | n | day-of-month range | median |
|---|---|---|---|
| 2014–2021 | 87 | 19–24 | 21–22 |
| 2022–2024 | 35 | 18–23 | 20–21 |
| 2025 | 11 | 20–26 | 23 |
| **2026** | **7** | **9–14** | **11** |

NAR's published 2026 calendar confirms it across the full year (Jan 14 → December data; Feb 12, Mar 10,
Apr 13, May 11, Jun 9, Jul 9, Aug 11, Sep 10, Oct 13, Nov 12, **Dec 9**) — a ~10-day step, not a drift.
The obvious inference is that a day-9–14 window collides with the FOMC more often. **The count says
otherwise, and the honest answer is that it depends on the month.** Across the 118 decision days
2014–2027, **14 (11.9%)** fall on days 9–14 against **26 (22.0%)** on days 18–26 — so at the level of
the whole year the new window is *less* collision-prone, and 2026-12-09 is bad luck rather than a new
regime.

December is the exception, and it is the month that matters. December decision days on record, by day:
17, 16, 14, 13, 19, 11, 16, 15, 14, 13, 18, 10, **9**, 8 (2014→2027). **Seven of fourteen fall in the
9–14 window NAR now uses**, and the two calendars have been converging — the last three December
decisions are 2025-12-10, **2026-12-09**, 2027-12-08. Graded MIXED because the year-level statistic and
the December-level statistic point opposite ways, and only the second one is load-bearing here: expect
this configuration to recur in Decembers and to stay rare in other months. 2027-12-08 is a near miss
against a December EHS slot that the unpublished 2027 NAR calendar has not yet fixed.

### Primary content read — what the last published edition says

NAR's statistics page, current edition **July 2026 data**: existing-home sales **−1.7% m/m**, with
month-over-month sales up in the Northeast, flat in the West and down in the Midwest and South;
year-over-year up in the Midwest and West, flat in the Northeast and South. Chief Economist Lawrence
Yun, quoted verbatim on that page: *"Home sales have been remarkably stable, even amid the rising
mortgage rate environment of the past few months… Year-to-date sales are up 2.4% and there's no doubt
that the housing market would be thriving if average mortgage rates were to return near 6%."*

FRED, fetched the same day: `EXHOSLUSM495S` **4.06M** SAAR for July, from 4.19M (May) and 4.13M (June)
— three consecutive monthly declines off the May high. `HOSINVUSM495N` inventory **1.54M** (NSA),
`HOSSUPUSM673N` months' supply **4.6**, up from **3.8** in January 2026 — supply loosening while sales
flatten. `MORTGAGE30US` **6.71%** on 2026-09-03, against 6.66% and 6.65% the two prior weeks, which is
the "rising mortgage rate environment" Yun's quote refers to and the variable his 6% counterfactual
turns on.

**A limit that shapes every content statement below:** FRED carries only **13 months** of
`EXHOSLUSM495S` (2025-07 → 2026-07), because NAR licenses the series and restricts redistribution. No
long history was available to this session, so this ledger registers **no content-side forward test** —
there is no measured base rate to register one against, and a pre-scored guess is worse than a
refusal. The wholesale sibling could register its `-3` because FRED carries 414 months of
`WHLSLRIRSA`; this ledger cannot, and says so rather than inventing a threshold.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`. The homebuilder names were read as a *class* (Leg 4), not as
  holdings: ITB **93.91**, XHB **103.25**, DHI **142.75**, LEN **83.58**, PHM **124.44** (2026-09-04
  closes), none tracked by this calendar.
- **Macro surprises** — none since the last row; there is no last row. Jobs 12-04 and the FT-900 12-08
  precede this print; CPI 12-10 follows the FOMC.
- **Volatility regime** — VIX **14.53**, SPY **770.19**, QQQ **718.96** (2026-09-04 closes, Yahoo daily
  bars via the authenticated endpoint). Baseline reading; nothing to diff against yet.
- **Geopolitical / policy** — PL 119-103 funds through 2026-12-11 (carried from the sibling ledgers,
  not re-derived). **This print is a NAR release, not a federal one, and is therefore immune** — which
  is what makes the 12-17 pair proposed below the corridor's cleanest read on whether the cliff bites.
  G20 sherpa 12-10, G20 Miami 12-14; no channel to a series with no symbols. Noted again for their
  owners that `cr-expiry-2026-12-11` and `government-funding-deadline-2026-12-11` appear to describe
  one deadline under two ids — not this lane's files to touch.
- **Event tape** — no November consensus exists at D-94 and none will before the 11-12 October edition
  sets the base. Every November-content statement here is a base rate, never a forecast.
- **Three dated events proposed in this PR**, each its own file owned by this lane:
  `existing-home-sales-2026-11-12` (the unconfounded control edition, NAR primary),
  `pending-home-sales-2026-12-17` (the contracts-signed leading half, NAR primary, immune to the
  cliff) and `housing-starts-2026-12-17` (Census `A202612170830`, the residential node's *other* leaf,
  six days past the cliff, 08:30 the same morning as the PHSI). **One class considered and DECLINED**,
  so its absence reads as a decision: the remaining monthly editions on NAR's 2026 calendar — EHS
  10-13, PHSI 09-17 / 10-20 / 11-18, and the Q3 Metro Home Prices release 10-29. All are real, dated
  and primary-sourced, and seeding every monthly edition of a `low`-impact series with no attached
  instrument would flood the calendar for no decision gained. The criterion applied: an edition earns a
  row when it is *distinguishable* — the control for a confound (11-12), the leading half of a print we
  now track (12-17), or a funding-cliff test (12-17). A routine edition does not.

### Honest limits

- **The release-date archive is what GDPNow chose to name.** The 140 dates are `ContribArchives` free
  text, so any EHS release that did not coincide with a GDPNow posting day is invisible to it — 2026
  shows 7 dates against NAR's 12 scheduled, and 2024 is missing November. Every date it *does* carry
  matched NAR 7 for 7 in 2026, so the archive is accurate where it is populated and incomplete
  everywhere else. Leg 6's day-of-month table is therefore a sample, not a census.
- **The free-text classifier is free text.** Solo-vs-shared in Leg 3 is read from a column whose
  spellings drift across a decade (the archive contains both "Existing-home sales" and "Existing home-
  sales"); the 109/31 split is case-normalised but not otherwise cleaned. The release-date join every
  other number rests on does not depend on it.
- **SEP status is verified for two of the five collisions, not five.** The Fed's current-format panel
  carries per-meeting projection links only from 2021; 2017-09-20, 2018-03-21 and 2018-12-19 sit in
  quarterly-projection months on the standing convention, but this session did not confirm them from a
  per-meeting link and does not claim to have.
- **All the nowcast work measures a model, not a market.** Every Δ describes the Atlanta Fed's estimate
  of GDP. The only price claims here are the session-class studies, and both are reasons *not* to act.
- **`ContribArchives` ends 2026-07-28** and carries no Q4-2026 vintage, so `-1`'s class priors are
  out-of-sample for the quarter being nowcast.
- **No content forward test, by choice.** FRED's 13-month EHS window (above) leaves no base rate to
  register against. If a longer history becomes available — NAR's own historical tables, or a licensed
  source — a level or momentum test is the obvious next registration.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it. A housing-keyed playbook would change that
  and does not exist today.

## Stance & kill switches

**Stance (date is `confirmed`, promoted this session on the publisher's own calendar).** Stand aside on
2026-12-09 and on every edition of this report. Hold four frames. **On the date:** it is NAR's own,
published in November 2025 and corroborated three ways, and the reference month is **November**, not the
October the sibling's corridor framing implies — the two halves of this vintage report different months.
**On the nowcast:** this is the **residential** vintage and its only channel is brokerage commissions,
the model's own wiring; the shared-vintage attribution worry is refuted, because a solo EHS vintage moves
inventories under 0.10pp **109 times out of 109** and the 12-09 vintage is therefore separable line by
line rather than muddled. **On the tape:** treat 12-09 as *unreadable* — the SEP decision at 14:00 takes
85.8% of the session's range and the 10:00 hour containing this print takes 26.0% against a 40.4%
baseline — and note that the compression is just as strong for homebuilders (23.3% vs 35.8%), which is
the class that would have to be the exception for this print to be tradeable. **On the sector:** the
exposed names are measured inert on EHS release days and measured wide on decision days, so
`symbols: []` is a finding rather than an omission. Nothing here licenses an entry, and there is no
instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The 2026-12-09 GDPNow vintage moves the Q4-2026 residential-investment contribution by ≥0.30pp.**
  That is far past anything in the 140-vintage class and would mean the brokerage-commissions leaf is
  carrying information the size of a real component surprise — this print would acquire a reading worth
  waiting for rather than a rounding correction.
- **The 2026-12-09 vintage moves the inventories contribution by ≥0.10pp while the residential
  contribution moves by <0.01pp.** That is the pattern Leg 3 says cannot come from this print; if it
  appears, the orthogonality finding is wrong and both this ledger's `-1` and the sibling's must be
  re-derived on a joint basis rather than separately.
- **ITB's session range on any EHS release day between now and 12-09 exceeds 3.0%** (about the p95 of
  the 122-day class, and above the SEP-decision-day median of 2.918%) **with no FOMC, CPI or jobs print
  that session.** Leg 4's inertness claim is then falsified on a clean instance and `symbols: []` is
  back in question. The dated chances to observe it: **09-10**, **10-13** and **11-12**.
- **NAR moves, delays or restructures the 2026-12-09 release on its own schedule.** The `confirmed`
  label reverts to `estimate` and Leg 1 is re-derived; the schedule page and its .docx are the two
  places that would show it.
- **A macro- or housing-keyed house playbook lands in `docs/plans/trade-playbooks.md` before
  2026-12-01.** The stand-aside is partly an absence-of-instrument argument; a housing-keyed playbook
  makes it a live question rather than a settled one.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-existing-home-sales-2026-12-09-1` — the 2026-12-09 GDPNow vintage moves the **Q4-2026 residential
  investment** contribution by **<0.10pp**. Score by 2026-12-09.
- `FT-existing-home-sales-2026-12-09-2` — on that same vintage, the **inventories** move exceeds the
  **residential** move in absolute value — the operational form of "each release owns its own line".
  Score by 2026-12-09.
- `FT-existing-home-sales-2026-12-09-3` — **ITB's 2026-12-09 10:00–11:00 ET range is below 28.7%** of
  that session's 09:30–16:00 range. Score by 2026-12-09.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-94 | **Initial research on an id that existed only as a proposal. The date is promoted to `confirmed` on the publisher's own calendar, and the sibling's shared-vintage attribution worry is refuted — the two halves of the 12-09 vintage move orthogonal lines.** Canonical `src/domain/market-events/existing-home-sales-2026-12-09.json` written this session after reading the single proposal (`from-wholesale-trade-2026-12-09`), which is now shadowed. **Leg 1 — the date:** the proposing lane could not find NAR's schedule (tried `/newsroom/release-schedule`, 404); the real path is linked from NAR's statistics page as "NAR Research Data Release Dates" — `nar.realtor/newsroom/nar-statistical-news-release-schedule` (HTTP 200, 483,177 bytes) and its `.docx` twin published **2025-11** (HTTP 200, 55,384 bytes), both reading "DECEMBER \| Wed., Dec. 9 \| **November** Existing-Home Sales" under "All releases are distributed at 10 a.m. Eastern Time". Status `estimate`→**`confirmed`**, prefix `EST:`→**`IR:`**, on the `challenger-job-cuts-2026-09-03` precedent (a private publisher's own release carried `IR:`/`confirmed`). Corroborated three ways: Atlanta Fed `PostedUpdates` 2026-12-09 10:00 "Wholesale trade, Existing-home sales"; NAR's live page naming the next edition 2026-09-10; and the seven 2026 EHS dates in the GDPNow archive matching NAR's calendar **7/7**. **Reference month is November, not October** — a 9-day lag against the wholesale print's 39-day one, so the two halves of one vintage report different months. **Leg 2 — the channel:** the workbook's `Residential` sheet routes `valExHomeSales` ("Real value of existing home sales") into **`FRSBKX_USNAqtr` — "Brokerage commissions"**, an existing home being a transfer of an existing asset. `ContribArchives` (**1,871 vintages 2014-05-01 → 2026-07-28 = 1,822 same-quarter deltas**) agrees: the **140** EHS-naming vintages move residential a median **0.0376pp** vs **0.0057pp** for the other 1,682 (permutation p<**0.0001**), inventories **0.0001pp** vs 0.0197pp (p=0.0009), net exports 0.0003 vs 0.0025, and the headline **0.0445pp** vs 0.0997pp — an EHS vintage is *quieter* than an average one. On **130/140 (92.9%)** residential is the larger move vs a **36.5%** base rate. **Leg 3 — the central finding, and it inverts the sibling's:** splitting EHS vintages solo (**n=109**) vs shared (**n=31**), residential does NOT separate (0.0353 vs 0.0507pp, p=0.172) while inventories separates violently — solo **0.0001pp with P(<0.10pp) = 100.0%**, shared 0.0021pp/83.9%, p<0.0001. A solo EHS vintage has never moved inventories by 0.10pp in 109 tries, so the 0.0021pp on shared ones is the *co-release*. **The 12-09 vintage is therefore separable, not muddled** — inventories are the wholesale print's, residential is this one's, and both ledgers' `-1` can be scored off one vintage without confounding. The pairing evidence the worry rested on is 2 observations (2019-03-22: Δresid +0.2109 / Δinv +0.3851; 2026-06-09: +0.0595 / +0.0484), disagreeing. **Leg 4 — the tape, tested where it should show:** daily bars 2016→ (permutation vs a 2,562-session baseline excluding EHS and FOMC days), median session range — **EHS release days (n=122): SPY 0.894% (p=0.75), ITB 1.911% (p=0.40), XHB 1.693% (p=0.46)**, all baseline; the same names on **SEP decision days (n=22): SPY 1.412% (p=0.0025), ITB 2.918% (p=0.0003), XHB 2.721% (p=0.0002)**. The sector with the obvious channel is inert on the print and +59% wide on the decision it shares its day with — `symbols: []` is a MEASUREMENT, not a placeholder. **Leg 5 — not unprecedented:** unioning the Fed's statement-filename parse (past) with its calendar cells (future) gives **118 decision days 2014→2027**; EHS has landed on one **5 times** — 2017-09-20, 2018-03-21, 2018-12-19, 2021-09-22, 2022-09-21, all in Mar/Sep/Dec — so 12-09 is the **sixth**, against the sibling's "first ever" (true of wholesale, false here). ITB open→close across the five: −1.00, +1.57, −0.98, +0.01, −1.95 — no sign. Hourly (**721 sessions 2023-10-09 → 2026-09-04**): the 10:00 hour makes **SPY 26.0% / ITB 23.3%** of a decision-day session range vs **40.4% / 35.8%** baseline (p=**0.0006** / **0.0027**), while 14:00–16:00 makes SPY **85.8%**; on ordinary EHS days that hour is exactly baseline (37.5% / 35.7%, p>0.4). Baseline 10:00-hour p25: SPY **31.1%**, ITB **28.7%**. Closes reproduce the sibling's exactly (SPY 770.19, QQQ 718.96, VIX 14.53) after a cookie+crumb handshake — Yahoo returned 429 to a plain fetch; **RDFN 404, dropped not substituted**. **Leg 6 — why now:** NAR moved EHS from day 19–24 (2014–2021, n=87) to day **9–14** (2026, n=7, median 11) effective January 2026, confirmed across the full year by its own calendar. The year-level count argues the new window is *less* collision-prone (14/118 decision days on day 9–14 vs 26/118 on day 18–26), so 12-09 is bad luck — but **7 of 14 December decision days fall in the 9–14 window**, and the two calendars are converging (2025-12-10, 2026-12-09, 2027-12-08). Expect December recurrence, not general recurrence. **Primary content:** NAR's current edition is July 2026 — **−1.7% m/m**, Northeast up / West flat / Midwest and South down, Yun quoted "year-to-date sales are up 2.4%… thriving if average mortgage rates were to return near 6%". FRED: `EXHOSLUSM495S` **4.06M** SAAR (from 4.19M May, 4.13M June — three straight declines), inventory **1.54M** NSA, months' supply **4.6** (from 3.8 in Jan-26), `MORTGAGE30US` **6.71%** (2026-09-03). **FRED carries only 13 months of the EHS series (NAR licensing)**, so this ledger registers **no content forward test** rather than inventing a base rate. **Adjacency sweep — peers:** n/a, `symbols: []`; the homebuilder names were read as a class, none tracked (ITB 93.91, XHB 103.25, DHI 142.75, LEN 83.58, PHM 124.44). **Macro:** jobs 12-04 and FT-900 12-08 precede; CPI 12-10 follows the FOMC. **Volatility:** VIX 14.53 — baseline, nothing to diff against yet. **Geopolitical:** PL 119-103 through 12-11; **this is a NAR release and is immune to it**. **Event tape:** no November consensus at D-94. **Three dated events proposed** (own files, `estimate`): `existing-home-sales-2026-11-12` (NAR primary; the unconfounded control edition, and the Atlanta Fed does NOT schedule a vintage that day so its tape is the readable thing), `pending-home-sales-2026-12-17` (NAR primary; the contracts-signed leading half of these closings, and no GDPNow channel was found for it in 1,871 vintages) and `housing-starts-2026-12-17` (Census `A202612170830`, 08:30; the residential node's *other* leaf via `SplicedNewHousingConstruction`, six days past the cliff and 90 minutes before the immune PHSI — the corridor's cleanest cliff test). **One class declined on the record:** the routine monthly editions on NAR's 2026 calendar (EHS 10-13; PHSI 09-17/10-20/11-18; Q3 Metro Home Prices 10-29) — real and dated, but an edition earns a row only when it is distinguishable, and these are not. **Three forward tests registered:** `-1` (Q4 residential move <0.10pp, base rate 82.1%), `-2` (inventories move exceeds residential on the shared vintage — the operational form of orthogonality), `-3` (ITB 10:00–11:00 range <28.7% of session range). | **Initial stance set: stand aside; date promoted to `confirmed` on NAR's own calendar with the reference month corrected to November, the shared-vintage attribution worry REFUTED because each release owns an orthogonal line, `symbols: []` upheld as a measurement after the homebuilder ETFs tested inert, and the 12-09 tape unreadable because the SEP decision at 14:00 owns it.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-existing-home-sales-2026-12-09.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
