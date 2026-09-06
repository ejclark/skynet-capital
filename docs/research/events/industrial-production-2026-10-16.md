# Industrial Production and Capacity Utilization (G.17, September 2026 data) — industrial-production-2026-10-16

**Kind:** macro-print · **Date:** 2026-10-16 (**confirmed**, two independent Federal Reserve primaries fetched direct 2026-09-06 — the Board's announcements feed `federalreserve.gov/feeds/g17.html`, verbatim "In 2026, the G.17 release on Industrial Production and Capacity Utilization will be published at 9:15 a.m. on … October 16, November 17, and December 16", and the Board's own release-date table `releases/g17/release_dates.htm`, row "October 2026 | 16-October-2026". Promoted from the `estimate` the `nahb-hmi-2026-10-19` sweep filed, which said in its own notes that it could not self-confirm an in-sweep discovery) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["beige-book-2026-10-14","cpi-2026-10-14","ecb-quiet-period-start-2026-10-21","fomc-blackout-start-2026-10-17","g20-fmcbg-bangkok-2026-10-15","housing-starts-2026-10-20","imf-world-bank-annual-meetings-2026-10-12","import-export-prices-2026-10-16","mtis-2026-10-15","nahb-hmi-2026-10-19","norway-gpfg-ethics-committee-2026-10-15","opex-2026-10-16","ppi-2026-10-15","retail-sales-2026-10-15","sifma-bond-market-closure-2026-10-12","ssa-cola-2027-2026-10-14","treasury-20y-bond-2026-10-21","treasury-buyback-10y20y-2026-10-15","treasury-coupon-announcement-2026-10-15","treasury-primary-dealer-agenda-2026-10-16"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This is the quiet end of a set the calendar has now completed, and the completion is the
finding.** With this file the repo tracks all three reference-month positions of one series — month 1
(`industrial-production-2026-11-17`, October data), month 2 (`…-12-16`, November data) and **month 3
(this print, September data)** — and month 3 is measurably the quietest of the three. Re-derived from
the Board's own 189-date archive joined to the Atlanta Fed's `ContribArchives`, a month-3 G.17 vintage
moves the GDP nowcast a median **0.0975pp (n=48)** against **0.0862pp** on an ordinary vintage day —
**permutation p=0.6456, indistinguishable** — while month 1 reads 0.3524pp and month 2 0.2026pp
(p<0.0001 and p=0.0147 against this class). The report's own Equipment channel moves **0.0071pp** and
**never once reached 0.10pp in 48 vintages.** The publisher agrees more bluntly than for either
sibling: **the Atlanta Fed schedules no GDPNow vintage on 2026-10-16 at all** — it schedules 10-15
(retail + PPI) and 10-20 (housing starts) and skips this date, so September IP is absorbed four days
later. The one thing that makes this date look interesting is that it is **October opex**, and that
survives its own control before dissolving under the right one: a G.17 on an opex Friday gaps
**0.4598%** against **0.2983%** for an opex Friday without one (**p=0.0245**, n=33) — but split by
co-release it is **with-retail 0.5173% (p=0.0707)** and **without-retail 0.3368% (p=0.6692)**.
**Retail sales print 2026-10-15, the day before**, so this print sits in the null cell:
month-3-no-retail, n=30, gap **0.3196% (p=0.5423)**, range **0.6602% (p=0.0775 — narrower)**. Date is
**confirmed**; `symbols: []`; nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-40) | **Stand aside** | High | `symbols: []`, 40 days out, no September data in existence, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed — a re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** macro hits today. No instrument attaches, and promoting the date to `confirmed` changes the assessment cadence and nothing else. | A macro-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-10-01** — none exists today |
| This week | **Stand aside — the series has nothing in the week, and the next edition is not this one** | High | The current published edition is **July 2026** data (released 2026-08-18): IP **+0.2%** m/m, **103.0%** of its 2017 average, **+1.1%** y/y. The next G.17 is **2026-09-18** (August data), twelve days out and itself standalone; this print is the one after it. VIX **14.53**, SPY **770.19**, QQQ **718.96** (2026-09-04 closes). | The Board moving or cancelling the **2026-09-18** slot on `release_dates.htm` before that date — the table's only `NA` rows in six years are the two the 2025 funding lapse produced |
| This month | **Watch one dated question and nothing else: does the annual revision get a date before 2026-10-05?** | Medium | The Board's 2026-05-15 notice says "autumn of 2026" and names no day, but this session bounds it. All **12** revisions on record are **month-end** releases — 11 at day-of-month ≥ 21, the twelfth 2016-04-01 (the day after March 31) — and **none ever landed mid-month**; the **minimum dated-notice lead is 11 days** (2023: 03-17 → 03-28). So a revision preempting a 16th-of-the-month print needs its notice by **2026-10-05**, and the day-of-month record says it will not come. | The Board announcing an annual-revision date **on or before 2026-10-16** — which would make the 2022-base restatement, not this print, the October event, and void every level statement in this ledger |
| This quarter | **Expect an ordinary opex Friday and attribute nothing to the 09:15 print** | Medium | This print's exact tape class — month-3 reference, no 08:30 retail co-release — reads gap **0.3196%** (p=0.5423, n=30) and range **0.6602%** (p=0.0775, *narrower* than the 0.8734% baseline). The two prior October-opex G.17 sessions on record ran gaps of 0.2372% / 0.4201% and ranges of 0.6740% / 1.0510%. On the nowcast side the date carries no scheduled vintage at all. | SPY's 2026-10-16 session range reaching **2.065%** (the 2014-05+ baseline p90) *or* the Atlanta Fed posting a GDPNow vintage on 2026-10-16 after all — either would mean this date has a footprint this apparatus says it does not have |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, no macro-keyed playbook,
  no instrument. A `confirmed` date licenses an *assessment schedule*, never an entry.
- **The frame that places this event: it completes the series' position set at the quiet end.** Month
  1 = 11-17 (0.3524pp, n=45), month 2 = 12-16 (0.2026pp, n=48), **month 3 = this print (0.0975pp,
  n=48, p=0.6456 against ordinary days).** The two siblings each argued their own print was quieter
  than its morning looked; this one is quieter than either of them, and it is the only one of the
  three whose date the Atlanta Fed does not schedule a vintage for.
- **This date's one distinguishing feature is opex, and the opex signal is retail's, not the G.17's.**
  G.17-on-opex gaps 0.4598% vs 0.2983% for opex-without-one (p=0.0245, n=33) — but with-retail
  0.5173% (n=10) against without-retail **0.3368%, p=0.6692 (n=22)**. Retail sales print **10-15**.
- **This resolves an apparent disagreement between two sibling ledgers, and both were right.**
  `nahb-hmi-2026-10-19` measured a stacked HMI morning at 0.4828% (p=0.0365) and attributed the lift
  to the 09:15 G.17; `industrial-production-2026-11-17` measured a solo G.17 at 0.3109% (p=0.626) and
  attributed it to the 08:30 retail print. Both classes are reproduced here on a third cut (opex
  Fridays) and the reconciliation is the co-release: with-retail G.17 days gap **0.4285% (p=0.0038,
  n=59)**, without-retail **0.3109% (p=0.4731, n=83)** — the same 0.3109% the November lane reported,
  from an independently parsed archive.
- **The sibling's seasonal does NOT transfer, and that is worth stating rather than assuming.** The
  November lane registered October m/m weakness at p=0.0783 (median −0.340%, down 7 of 9). **This
  print reports September, and September is null**: median **+0.043%** against −0.006% for other
  months, down **4 of 9** against a 50.9% base rate. No seasonal test is registered here on purpose —
  a coin flip is not a hypothesis.
- **The number to read on the day — capacity utilization, not the m/m.** July printed **76.29%** total
  (Fed: manufacturing **76.0%**, 2.2pp below its 1972–2025 average; mining 86.1%), **3.13pp** below
  the all-industry long-run mean of 79.41% and the **20.1st percentile** of 715 months since 1967.
  Manufacturing output sits at **99.31**, i.e. **0.69% below its own 2017 average nine years later**.
- **Funding is not this print's variable.** PL 119-103 funds through **2026-12-11**, well after
  2026-10-16 — the exposure the December twin's ledger reasons about does not reach here at all.
- **Watch (dated)** — August data **09-18** (standalone, no vintage) · CPI **10-14** · Beige Book
  **10-14** · retail sales, PPI and MTIS **10-15** (the GDPNow vintage this corridor actually gets) ·
  **this print 10-16 09:15**, alongside import/export prices and **October opex** · FOMC blackout
  begins **10-17** · NAHB HMI **10-19** (the corridor's unstacked control, and this print is why) ·
  housing starts **10-20** (the vintage that absorbs September IP) · GDPNow rolls to Q4 **10-29** ·
  **the annual revision, autumn 2026, date not yet announced — a pre-print date needs a notice by
  10-05.**

## Initial research

### The question, plainly

This id existed only as a proposal, filed by the `nahb-hmi-2026-10-19` lane while it was resolving a
different question — whether its own HMI morning was "stacked" with a 09:15 federal print. It was
not, because the G.17 lands 10-16, and that discovery is what put this event on the calendar. But the
proposal arrived carrying an argument that a *different* sibling had already considered and rejected:
`industrial-production-2026-11-17` looked at this same date, called it "real, Board-scheduled, dated —
but standalone", and **declined to propose it**, on the grounds that a solo G.17 date is an ordinary
session with no nowcast vintage. So: **two lanes reached opposite conclusions about whether this date
belongs on the calendar. Which was right, and what is this print actually worth?**

**One-line verdict:** the declining lane was right about the *signal* and the proposing lane was right
about the *tracking* — this is the quietest G.17 the calendar carries, measurably quieter than either
sibling, and it earns its file precisely by being the control that makes the other three legible.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no
target. Six inputs, all fetched direct on 2026-09-06, all HTTP 200, **no blocked fetches this
session**:

1. **`federalreserve.gov/feeds/g17.html`** (614,006 bytes) — the Board's announcements feed. Parsed
   into **189 actual release dates, 2010-10-18 → 2026-08-18**, plus every annual-schedule and
   annual-revision notice back to 2007. Primary for every date and revision claim below.
2. **`federalreserve.gov/releases/g17/release_dates.htm`** (117,098 bytes) — the Board's release-date
   table, an independent second primary. Footer "Last Update: August 18, 2026".
3. **`federalreserve.gov/releases/g17/current/default.htm`** (115,934 bytes) — the current release,
   July 2026 data, read directly for content and for the revision notice it still carries.
4. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed, at the `/-/media/Project/Atlanta/FRBA/…` path
   the November lane identified) — `PostedUpdates`, **82** dated rows, 2025-12-23 → 2026-12-23.
5. **`GDPTrackingModelDataAndForecasts.xlsx`** — `ContribArchives`, **1,871 vintages 2014-05-01 →
   2026-07-28 = 1,822 same-quarter deltas**, joined to input 1 **on release date**.
6. **FRED** `INDPRO`, `IPMAN`, `TCU`, and **Yahoo daily bars SPY / QQQ / ^VIX** (4,194 SPY sessions
   from 2010-01-04; the study window is 2014-05-01 → 2026-09-04). 20,000-iteration permutation tests
   on medians throughout.

Plus **a re-run grep** of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
any macro-keyed hook — **0 hits**, reproducing both siblings' finding today.

**One data-quality correction to the shared archive, in this lane's favour and against it.** The
Board's own feed contains three typo'd announcement titles ("February2024", "July2023", "May2022",
each missing a space) and one non-release item that a loose filter reads as a release (the 2025-12-23
*Technical Q&A* about the lapse-delayed editions). Fixing the first three and excluding the fourth,
then adding back the real dual-month 2025-12-23 edition, reproduces the siblings' **189** dates and
**143** joined vintages exactly — so the two independent parses agree, and the numbers below are
comparable to theirs line for line.

### Leg 1 — the release exists on 2026-10-16 at 9:15 a.m., and the date promotes to `confirmed` · **SUPPORTED**, on two Board primaries

The announcements feed states the year's schedule in one sentence: *"In 2026, the G.17 release on
Industrial Production and Capacity Utilization will be published at 9:15 a.m. on January 16, February
18, March 16, April 16, May 15, June 15, July 17, August 18, September 18, **October 16**, November
17, and December 16."* The Board's release-date table lists the same date independently:

| Release month | Release date, per the Board's own table |
|---|---|
| September 2025 | 16-September-2025 |
| **October 2025** | **NA** |
| **November 2025** | **NA** |
| December 2025 | 03-December-2025 and 23-December-2025 |
| … | … |
| September 2026 | 18-September-2026 |
| **October 2026** | **16-October-2026** |
| November 2026 | 17-November-2026 |
| December 2026 | 16-December-2026 |

The two `NA` rows are the 2025 funding lapse, recorded by the publisher itself, and they are the
honest counterweight to a `confirmed` label: this label is a claim about the *schedule*, not about
immunity. It does not bite here — PL 119-103 funds through **2026-12-11**, nearly two months after
this print, which is a materially safer position than the December twin's (day 5 of a possible lapse).

The promotion is what the proposal asked for. The `nahb-hmi-2026-10-19` lane filed `estimate` and said
so in its own notes: it may not self-confirm an in-sweep discovery, and the `FED:`/`confirmed`
precedent was "available in one step to whichever lane researches this id." This is that session. The
Board's verb is **"will be published"** — not the "anticipated" that correctly keeps the Census
siblings at `estimate`. The feed additionally publishes the full 2027 schedule, so this date sits
inside a two-year forward calendar rather than at its edge.

### Leg 2 — the reference month is September, this is the month-3 print, and that is structural · **SUPPORTED**, and it is the classification the whole ledger turns on

GDPNow rolls from Q3-2026 to Q4-2026 on **2026-10-29** (the Atlanta Fed's own `PostedUpdates` row:
*"Initial nowcast of 2026:Q4 GDP growth"*). So on 2026-10-16 the model is still nowcasting Q3, and
September is **month 3** of that quarter — the last month before it closes. That is not an accident of
this year:

| October edition | Reference month |
|---|---|
| 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2022, 2023, 2024 | **September** (14 of 15) |
| 2021-10-18 | feed-titled "August 2021" — **a mis-titled announcement**, since 2021-09-15 already carried August and 2021-11-16 resumed at October |
| 2025 | no October edition — the funding lapse |

**The October edition IS the month-3 edition**, and the calendar now carries one of each:

| Event | Data month | Position in the nowcast quarter |
|---|---|---|
| `industrial-production-2026-11-17` | October 2026 | month **1** |
| `industrial-production-2026-12-16` | November 2026 | month **2** |
| **`industrial-production-2026-10-16` (this print)** | **September 2026** | **month 3** |

### Leg 3 — the month-3 vintage is indistinguishable from an ordinary day · **SUPPORTED**, and this is the ledger's central finding

Joining the Board's 189-date archive to `ContribArchives` gives **143** G.17 release dates carrying a
same-quarter GDPNow delta, against **1,679** non-G.17 vintages — the same split both siblings report,
reached from an independently parsed date series. Splitting those 143 by reference-month position:

| Class | n | median \|ΔGDP\| | \|ΔPCE\| | \|ΔEquipment\| |
|---|---|---|---|---|
| month 1 (the **11-17** class) | 45 | **0.3524pp** | 0.1509pp | 0.0399pp |
| month 2 (the **12-16** class) | 48 | 0.2026pp | 0.0994pp | 0.0160pp |
| **month 3 (THIS print's class)** | **48** | **0.0975pp** | 0.0654pp | **0.0071pp** |
| every other vintage | 1,679 | 0.0862pp | 0.0054pp | 0.0034pp |

And the tests that matter, 20,000-iteration permutation on medians:

| Comparison | \|ΔGDP\| | \|ΔPCE\| | \|ΔEquipment\| | \|Δinventories\| |
|---|---|---|---|---|
| all G.17 vs every other vintage | p<0.0001 | p<0.0001 | p=0.0009 | p<0.0001 |
| **month 3 vs every other vintage** | **p=0.6456** | p=0.0016 | **p=0.2205** | p=0.0048 |
| month 3 vs month 1 | p<0.0001 | p=0.0602 | p<0.0001 | p<0.0001 |
| month 3 vs month 2 | p=0.0147 | p=0.3948 | p=0.0017 | p=0.0045 |
| month 3, **no retail co-release** (n=31) vs other | p=0.2964 | p=0.2148 | p=0.2885 | p=0.0163 |

**The all-G.17 separation that both siblings built on is entirely absent in this print's class.**
0.0975pp against 0.0862pp at p=0.6456 is a failure to reject on n=48 — the loudest number in this
table is that there is nothing to see. Narrow to this print's exact configuration (month 3, no 08:30
retail print) and the median falls to **0.0571pp** and every channel but inventories goes quiet.

Two honest qualifications, both against the simple story. **PCE still separates** (p=0.0016), which is
the residual co-release effect — 17 of 48 month-3 vintages do carry a retail print — and the
**inventory-investment line separates even retail-free** (p=0.0163), which is the manufacturing-IP →
inventories bridge doing its job. The report is quiet in this position; it is not inert.

And the forward-testable asymmetry: **\|ΔEquipment\| never once reached 0.10pp in any of the 48
month-3 vintages** (maximum 0.0972pp), with PCE outmoving Equipment on **83.3%** of them against a
70.3% base rate elsewhere. The report's own channel is the smallest number in every row above.

### Leg 4 — the Atlanta Fed does not schedule a vintage on this date at all · **SUPPORTED**, and it is stronger here than for either sibling

Of the **twelve** G.17 dates the Board scheduled for 2026, the Atlanta Fed's `PostedUpdates` sheet
schedules a GDPNow vintage on **five** — 02-18, 07-17, 08-18, 11-17, 12-16 — and **every one of the
five has a co-release**. The seven standalone dates get none, and **2026-10-16 is one of the seven.**
The corridor around it makes the point sharply:

| Date | Scheduled GDPNow vintage? | What it carries |
|---|---|---|
| 2026-10-15 | **yes** | Retail sales + inventories, Producer Price Index |
| **2026-10-16 (this print)** | **no** | — |
| 2026-10-20 | **yes** | Housing starts |
| 2026-10-28 | yes | *Final* nowcast of 2026:Q3 — Advance Economic Indicators |
| 2026-10-29 | yes | *Initial* nowcast of 2026:Q4 |

So September industrial production is not merely quiet in the nowcast — **on the publisher's own
forward calendar it does not get its own vintage day.** It is absorbed on **2026-10-20**, four days
later, alongside housing starts, which this calendar already tracks. Stated as a forward-calendar
observation rather than a proven policy change: historically **143 of 145** in-span G.17 dates carried
a vintage, including plenty of solo ones, so this is a recent narrowing and a vintage could still post.

### Leg 5 — the opex-Friday elevation is real, and it is the retail print's · **MIXED**, and it is the one leg that nearly went the other way

2026-10-16 is **October opex**. That is the single feature distinguishing this date from the seven
other standalone 2026 G.17 dates, and it is the proposing lane's stated reason for filing it. Testing
it honestly required two controls, and it survived the first:

| Class (SPY, 2014-05-01 → 2026-09-04) | n | median \|overnight gap\| | p | median session range | p |
|---|---|---|---|---|---|
| baseline — every non-G.17 session | 2,961 | 0.2822% | — | 0.8741% | — |
| all G.17 days | 145 | 0.3624% | **0.0075** | 0.8100% | 0.238 |
| **month-3 G.17 days** | 47 | 0.3624% | 0.1191 | 0.7846% | 0.339 |
| month-2 G.17 days | 49 | 0.4098% | **0.0172** | 0.8351% | 0.658 |
| month-1 G.17 days | 48 | 0.3375% | 0.2818 | 0.8273% | 0.597 |
| opex Fridays, **no** G.17 | 111 | 0.2983% | 0.610 | 0.8496% | 0.686 |
| **G.17 on an opex Friday** | **33** | **0.4598%** | **0.0245** vs opex-no-G.17 | 0.7441% | 0.360 |

A G.17 landing on an opex Friday gaps measurably wider than an opex Friday without one, and an opex
Friday on its own is ordinary (p=0.118 against non-opex sessions). Taken there, this date would be the
one G.17 configuration with a real pre-open footprint. **The second control dissolves it:**

| Opex-Friday G.17 days, split by 08:30 retail co-release | n | median \|gap\| | p vs opex-no-G.17 |
|---|---|---|---|
| **with** the retail print | 10 | **0.5173%** | 0.0707 |
| **without** it | 22 | **0.3368%** | **0.6692** |

And the same split across all days reproduces the November lane exactly, from a separately parsed
archive:

| All G.17 days, split by retail co-release | n | median \|gap\| | p vs baseline |
|---|---|---|---|
| with retail | 59 | **0.4285%** | **0.0038** |
| without retail | 83 | 0.3109% | 0.4731 |
| **month 3, without retail (THIS print's class)** | **30** | **0.3196%** | **0.5423** |

0.4285% at p≈0.004 on n=59, and 0.3109% for the retail-free class, are the November lane's numbers to
four decimal places. **Retail sales print 2026-10-15 — the day before this one** — so this print sits
in the null cell, and its session range is if anything *narrower* than baseline (0.6602% vs 0.8741%,
p=0.0775).

**This also reconciles two sibling ledgers that appeared to disagree.** `nahb-hmi-2026-10-19` measured
its stacked HMI mornings at a gap of **0.4828% (p=0.0365, n=34)** and attributed the lift to the 09:15
G.17; `industrial-production-2026-11-17` measured a solo G.17 at **0.3109% (p=0.626, n=37)** and
attributed the lift to the 08:30 retail print. Both are reproduced here. The reconciliation is that an
HMI morning falls mid-month, where a G.17 very often shares the tape with retail sales — so the
"stacked" class the HMI lane isolated is disproportionately the *with-retail* class, and the lift it
measured is the one the November lane named. Neither lane was wrong about its own measurement; the
missing variable was the co-release, and this event's date supplies the clean case.

The direct analogues, for what a small sample is worth. Every October G.17 session on record:

| 2014-10-16 | 2015-10-16* | 2016-10-17 | 2017-10-17 | 2018-10-16 | 2019-10-17 | 2020-10-16* | 2021-10-18 | 2022-10-18 | 2023-10-17 | 2024-10-17 |
|---|---|---|---|---|---|---|---|---|---|---|
| gap 1.808% | 0.237% | 0.014% | 0.024% | 0.802% | 0.429% | 0.420% | 0.426% | 2.265% | 0.741% | 0.620% |
| range 2.518% | 0.674% | 0.574% | 0.211% | 1.694% | 0.575% | 1.051% | 0.957% | 2.137% | 1.305% | 0.680% |

\* the two that were also opex Fridays, i.e. the only true analogues of 2026-10-16: **gaps 0.237% and
0.420%, ranges 0.674% and 1.051%** — both under the 1.325% baseline p75. October G.17 days as a class
read 0.4290% at **p=0.148** (n=11); the median is carried by 2014-10-16 and 2022-10-18, two sessions
whose macro context had nothing to do with industrial production. Baseline percentiles for the
falsifiers below: session range p50 **0.873%**, p75 **1.325%**, p90 **2.065%**; \|gap\| p50 0.282%,
p75 **0.542%**, p90 0.926%.

### Primary content read — what the last published edition says, and what September's own seasonal does not

The current release (2026-08-18, July 2026 data) reads: IP and manufacturing production **each grew
0.2 percent** in July after **+0.3%** in June; mining **+0.2%**, utilities **+0.5%**; nondurable goods
**−0.4%**; motor vehicles and parts **−2.1%**. **Capacity utilization for manufacturing edged up to
76.0 percent**, *"a rate that is 2.2 percentage points below its long-run (1972–2025) average"*;
mining's operating rate 86.1%, utilities 70.0%.

Against FRED the level statements sharpen:

- Total capacity utilization is **76.29%**, **3.13pp** below the 1972–2025 mean of **79.41%** and the
  **20.1st percentile** of **715** months since 1967.
- Manufacturing output (`IPMAN`) is **99.31** against its own 2017 average of 100.0 — **0.69% below
  where it was nine years ago**, the post-revision picture the 2025-11-24 annual revision produced.
- Total IP is **102.99** (103.0% of the 2017 average), **+1.08% y/y**. The last fourteen m/m readings:
  +0.51, +0.41, −0.26, +0.04, −0.44, −0.18, +0.45, −0.45, +0.86, −0.15, +0.75, −0.01, +0.27, +0.20.

**And the seasonal claim that does *not* carry over from the sibling.** The November lane registered
`FT-industrial-production-2026-11-17-3` on a measured October weakness — ex-COVID (2015+, excluding
2020-21) median **−0.340%** against +0.034% for other months, down 7 of 9, permutation p=0.0783. **This
print reports September**, and the same apparatus on the same window says September is nothing:

| Month | n | median m/m | other months | negative | base rate |
|---|---|---|---|---|---|
| **September** (this print) | 9 | **+0.043%** | −0.006% | **4 of 9** | 50.9% |
| October (the sibling's) | 9 | −0.340% | +0.034% | 7 of 9 | 48.1% |

September readings, in full: −0.279, −0.106, +0.103, +0.065, −0.338, +0.193, +0.180, −0.620, +0.043.
That is a coin flip, and **no seasonal forward test is registered here** — registering one would be
manufacturing a hypothesis out of nine observations of noise, which is exactly the failure mode the
sibling flagged when it registered its own at low confidence.

### The annual revision — the one live variable, and this session bounds it

On **2026-05-15** the Board announced, in text the current release still carries verbatim: *"The
Federal Reserve Board plans to issue its annual revision to the indexes of industrial production (IP)
and the related measures of capacity utilization in the autumn of 2026. The base year for the revised
indexes will be **2022**. New annual benchmark data for manufacturing from the Census Bureau for
**2023** will be incorporated… Capacity and capacity utilization will be revised to incorporate data
for manufacturing through the **fourth quarter of 2025**…"* **No date has been announced as of
2026-09-06** — the feed's most recent item is the 2026-08-18 monthly.

Astronomical autumn runs **2026-09-22 → 2026-12-21**, so this print sits inside the announced window
and the risk is real: the 2024 revision **superseded a monthly** (*"Data referred to in the release
dated June 18, 2024, were superseded by the data issued at the time of the annual revision"*). But the
Board's own release pattern bounds it, and neither sibling ran this:

| Revision | Released | Day of month | Dated notice → release |
|---|---|---|---|
| 2025 | 2025-11-24 | 24 | 12 days |
| 2024 | 2024-06-28 | 28 | 43 days |
| 2023 | 2023-03-28 | 28 | 11 days |
| 2022 | 2022-06-28 | 28 | 42 days |
| 2021 | 2021-05-28 | 28 | 14 days |
| 2019 | 2019-03-27 | 27 | 40 days |
| 2018 | 2018-03-23 | 23 | 36 days |
| 2017 | 2017-03-31 | 31 | 14 days |
| 2016 | 2016-04-01 | 1 (the day after March 31) | — |
| 2015 · 2014 · 2013 | 07-21 · 03-28 · 03-22 | 21 · 28 · 22 | — |

**Every one of the twelve is a month-end release, always standalone and always at noon; none has ever
landed mid-month**, and the shortest dated notice on record is **11 days**. A revision preempting a
**16th-of-the-month** print would therefore be unprecedented in shape *and* would need its notice by
**2026-10-05**. The natural autumn-2026 slots on this pattern are the month-ends: 2026-09-28/30,
2026-10-26/30, 2026-11-23/30, 2026-12-14/21 — three of the four fall *after* this print. That is a
materially tighter statement than "autumn, no date", and it is what `-4` registers.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`.
- **Macro surprises** — none since the last row; there is no last row. Within the corridor: IMF/World
  Bank annual meetings and the SIFMA bond-market closure **10-12**; **CPI**, the Beige Book and the
  2027 SSA COLA **10-14**; **PPI, advance retail sales, MTIS**, a Treasury buyback and a coupon
  announcement **10-15**; **this print, import/export prices, the Treasury primary-dealer agenda and
  October opex 10-16**; the FOMC blackout begins **10-17**; NAHB HMI **10-19**; housing starts
  **10-20**; the ECB quiet period and the 20Y bond **10-21**.
- **Volatility regime** — VIX **14.53** (2026-09-04 close, Yahoo `^VIX` daily); the prior five closes
  ran 14.43 / 14.92 / 16.34 / 15.20 / 14.32. SPY **770.19**, QQQ **718.96** same close. Baseline
  reading; nothing to diff against yet.
- **Geopolitical / policy** — PL 119-103 funds through **2026-12-11**, nearly two months after this
  print, so the lapse exposure that produced the two `NA` rows does not reach this date at all. The
  G20 finance ministers meet in Bangkok **10-15** and the IMF/World Bank annual meetings run 10-12→18,
  i.e. this print lands mid-way through the corridor's international-policy week. The Board's
  2026-07-16 notice removing the DDP's "Build Your Package" option lands the week of **November 9**,
  after this print, and is a data-access change for a later pulse rather than this one.
- **Event tape** — no September consensus exists at D-40 and none will before the August edition
  prints on **09-18**. Every September-content statement here is a base rate, never a forecast.
- **No dated event proposed in this PR**, and the declines are on the record so their absence reads as
  a decision. The **2027 editions** the Board has already scheduled (01-15, 02-17, …) are real and
  dated but standalone with no known vintage — the same grounds on which the November lane declined
  09-18 and this date, and the December lane declined 2027-01-15; tracking every monthly edition of a
  `low`-impact series would flood the calendar for no measured signal, and this ledger's own Leg 3
  strengthens that argument rather than weakening it. The **2026 annual revision** is the most
  consequential item here and still **has no date**, so it cannot be a calendar entry; it lives as
  `-4` and as a kill switch. **`industrial-production-2026-09-18`** already exists as
  `proposals/…from-nahb-hmi-2026-10-19.json` and is due for its own initial research — filing a
  competing proposal for it would be exactly the add/add collision #1717 removed.

### Honest limits

- **The archive is release *dates*, not release *contents*.** Legs 1–5 measure whether, when and
  beside what the report published — never what it said. The content read is a single current edition
  plus FRED history.
- **`p=0.6456` is a failure to reject, not a demonstration of equality.** n=48 month-3 vintages cannot
  prove this print moves nothing; it can only say the movement is not distinguishable from ordinary at
  this sample size — and PCE and inventories *do* separate even here.
- **The co-release classifier is free text** from `ContribArchives`'s `Data releases` column, whose
  spellings drift across a decade; it is case-normalised but not otherwise cleaned, and one of the 33
  opex-Friday G.17 days carries no vintage row at all, so the opex split is n=32 of 33. The
  release-date join every count depends on does not use it.
- **The opex split is the smallest sample in this ledger.** With-retail-on-opex is **n=10**. The
  reason to trust the conclusion is not that cell but that it agrees with the n=59/n=83 all-days split
  and with the November lane's independently parsed version of the same test — three cuts, one story.
- **The reconciliation of the two sibling ledgers is an argument, not a measurement.** This session did
  not re-run the HMI lane's stacking test on its own dates; it reproduced both endpoint classes and
  observed that mid-month G.17 days disproportionately carry retail. A lane holding the NAHB date
  series could test it directly, and should.
- **`ContribArchives` ends 2026-07-28** and carries no Q4-2026 vintages, so every class above is
  out-of-sample for the quarter being nowcast — and this print's quarter, Q3-2026, closes eleven
  business days after it.
- **Every level, percentile and seasonal base rate here is pre-revision**, on a 2017 base year the
  Board has already announced it will replace with 2022. Last year's revision reversed the sign of
  five years of manufacturing output; nothing here bounds what this one does, only *when* it is likely
  to land.
- **All the nowcast work measures a model, not a market.** Every Δ describes the Atlanta Fed's
  estimate. The only price claims here are the gap and range studies, and both are reasons *not* to act.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it. A `confirmed` date changes the assessment
  cadence and nothing else.

## Stance & kill switches

**Stance (date is `confirmed`).** Stand aside on 2026-10-16 and on every edition of this report. Hold
four frames. **On identity:** this is the 9:15 a.m. Federal Reserve G.17 for **September 2026** data —
month **3** of the quarter GDPNow closes on 10-28 — and with it the calendar now carries one G.17 of
each reference-month position. **On the nowcast:** this is the quiet end of that set. A month-3 vintage
moves the GDP nowcast **0.0975pp against 0.0862pp on an ordinary day, p=0.6456**, where month 1 reads
0.3524pp and month 2 0.2026pp; the report's own Equipment channel moves **0.0071pp** and has never
reached 0.10pp in 48 vintages. The Atlanta Fed does not schedule a vintage on this date at all — it
schedules 10-15 and 10-20 and skips it. **On the tape:** treat 10-16 as an ordinary opex Friday. The
one class that looked like an exception — a G.17 on an opex Friday, gapping 0.4598% against 0.2983%,
p=0.0245 — splits into **with-retail 0.5173% and without-retail 0.3368% at p=0.6692**, and **retail
sales print 10-15**. This print's exact class reads gap **0.3196% (p=0.5423)** and range **0.6602%
(p=0.0775, narrower)**. **On what actually matters:** not the monthly number and not the funding
calendar — PL 119-103 runs to 12-11, past this date — but the **annual revision** the Board announced
for autumn 2026 with no date. This session bounds it: twelve revisions on record, all month-end, none
mid-month, minimum notice 11 days, so a pre-print revision needs a notice by **2026-10-05**. Nothing
here licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The Board announces its 2026 annual-revision date on or before 2026-10-16.** This print then
  becomes the first monthly G.17 on a 2022 base year with restated history — or is superseded by it,
  as June 2024's monthly was — every level and percentile here becomes arithmetic about a series that
  no longer exists in that form, and the month-end pattern this ledger leans on is broken in the same
  stroke.
- **The Atlanta Fed posts a GDPNow vintage on 2026-10-16.** Leg 4's publisher-side corroboration is a
  forward calendar, not a policy, and this observation retires it — and with it the cleanest single
  reason this print is the quietest of the three.
- **A 2026-10-16 or later G.17 vintage moves the same-quarter Equipment contribution by 0.10pp or
  more.** That never happened in any of the 48 month-3 vintages on record (maximum 0.0972pp). It would
  mean this position class has an attributable nowcast footprint after all and Leg 3 gets re-derived
  rather than patched.
- **SPY's 2026-10-16 session range reaches 2.065% or more** — the 2014-05+ baseline p90. The
  ordinary-opex-Friday frame fails on the one date it was registered for, and Leg 5 gets re-derived.
- **The retail-free G.17 class gaps wider than the retail-carrying class over the next 12 releases.**
  The co-release attribution is this ledger's whole reconciliation of two siblings; if it inverts, the
  reconciliation was a story about a sample, not a mechanism.
- **The September or October 2026 edition is cancelled rather than delayed** — an `NA` in the Board's
  release-date table where a date belongs, as October and November 2025 still read. The `confirmed`
  label survives a *delay*; a cancellation nearly two months before the funding cliff would mean the
  publication risk has a source this ledger has not identified.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-10-01.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it a live
  question.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-industrial-production-2026-10-16-1` — **the Atlanta Fed posts no GDPNow vintage dated
  2026-10-16**; September industrial production is absorbed into the 2026-10-20 vintage instead. Score
  by 2026-10-21.
- `FT-industrial-production-2026-10-16-2` — **SPY's 2026-10-16 overnight gap is below 0.542%** of the
  prior close (the 2014-05+ baseline p75). Score by 2026-10-16.
- `FT-industrial-production-2026-10-16-3` — **SPY's 2026-10-16 session high-low range is below 1.325%**
  of its close (the baseline p75). Both prior October-opex G.17 sessions cleared it. Score by 2026-10-16.
- `FT-industrial-production-2026-10-16-4` — **the 2026 G.17 annual revision is not published on or
  before 2026-10-16**, so this print lands on the current 2017-base vintage. Score by 2026-10-16.
- `FT-industrial-production-2026-10-16-5` — **SPY's overnight gap into 2026-10-16 is smaller than its
  gap into 2026-10-15**, the morning carrying advance retail sales and PPI. This is the co-release
  attribution stated as a single paired observation on this corridor's own dates. Score by 2026-10-16.

**Not registered, deliberately:** a September m/m directional call. The sibling registered October
weakness at p=0.0783; September's ex-COVID record is +0.043% median, 4 of 9 negative against a 50.9%
base rate. A coin flip is not a hypothesis, and pre-registering one would inflate this register's n
without adding information.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-40 | **Initial research on an id two sibling lanes disagreed about, and both turn out to have been right about different things.** Canonical `src/domain/market-events/industrial-production-2026-10-16.json` written this session after reading the single proposal (`from-nahb-hmi-2026-10-19`), now shadowed. `industrial-production-2026-11-17` had **declined** to propose this date as "real, Board-scheduled, dated — but standalone"; `nahb-hmi-2026-10-19` proposed it anyway because it is the fact that makes 10-19 the corridor's unstacked HMI control. Verdict: the decliner was right about the signal, the proposer right about the tracking. **Leg 1 — date PROMOTED `estimate` → `confirmed` on two Board primaries** fetched direct today: `feeds/g17.html` (200, 614,006 bytes) verbatim *"In 2026, the G.17 release … will be published at 9:15 a.m. on … October 16, November 17, and December 16"*, and `releases/g17/release_dates.htm` (200, 117,098 bytes, footer "Last Update: August 18, 2026") row "October 2026 \| 16-October-2026", restated a third time inside `current/default.htm` (200, 115,934 bytes). The 2025 `NA` rows remain the honest counterweight — but PL 119-103 funds through **2026-12-11**, nearly two months after this print, so the lapse exposure the December twin reasons about does not reach here. **Leg 2 — this is the MONTH-3 print, structurally.** GDPNow rolls to Q4 on **2026-10-29**, so September is month 3 of the quarter still being nowcast; **14 of 15** October editions in the Board's 189-date archive carry September data, and the 15th (2021-10-18, feed-titled "August 2021") is a mis-titled announcement — 2021-09-15 already carried August and 2021-11-16 resumed at October. With this file the calendar carries one G.17 of **each** position: month 1 = 11-17, month 2 = 12-16, **month 3 = this**. **Leg 3 — the central finding, and it is a null.** Board archive (**189** dates 2010-10-18 → 2026-08-18, after fixing three typo'd feed titles — "February2024"/"July2023"/"May2022" — and excluding the 2025-12-23 Technical Q&A a loose filter reads as a release) joined on release date to `ContribArchives` (1,871 vintages 2014-05-01 → 2026-07-28 = **1,822** same-quarter deltas) gives **143** G.17 vintages vs **1,679** others — reproducing both siblings exactly from an independently parsed series. By position: month 1 \|ΔGDP\| **0.3524pp** (n=45), month 2 **0.2026pp** (n=48), **month 3 0.0975pp (n=48)** against **0.0862pp** for non-G.17 vintages — **permutation p=0.6456, indistinguishable from an ordinary day** (20,000 iterations), where all-G.17 vs other is p<0.0001. Month 3 vs month 1 p<0.0001; vs month 2 p=0.0147. **\|ΔEquipment\| 0.0071pp (p=0.2205) and NEVER reached 0.10pp in any of the 48** (max 0.0972), PCE outmoving it 83.3%. Narrowed to this print's exact configuration (month 3, no retail, n=31) \|ΔGDP\| **0.0571pp, p=0.2964**. Two honest qualifications: PCE still separates (p=0.0016 — 17 of 48 month-3 vintages do carry retail) and the inventory line separates retail-free (p=0.0163), the manufacturing-IP → inventories bridge. **Leg 4 — the publisher skips this date entirely.** The Atlanta Fed's `PostedUpdates` (82 rows, 2025-12-23 → 2026-12-23, fetched at the `/-/media/Project/Atlanta/FRBA/…` path) schedules a vintage on **five** of the twelve 2026 G.17 dates (02-18, 07-17, 08-18, 11-17, 12-16), each with a co-release; **2026-10-16 is one of the seven with none.** The corridor: **10-15 yes** (retail + PPI), **10-16 no**, **10-20 yes** (housing starts — where September IP is actually absorbed), 10-28 final Q3 nowcast, 10-29 initial Q4. Historically 143 of 145 in-span dates carried a vintage, so this is a recent narrowing, stated as a forward calendar not a policy. **Leg 5 — MIXED, the one leg that nearly went the other way.** SPY 2014-05-01 → 2026-09-04, non-G.17 baseline **n=2,961**, gap 0.2822% / range 0.8741%: all G.17 (n=145) gap **0.3624% p=0.0075**; month-3 (n=47) 0.3624% **p=0.1191**; month-2 (n=49) 0.4098% p=0.0172; month-1 (n=48) 0.3375% p=0.2818. **2026-10-16 is October opex**, and opex Fridays alone are ordinary (n=144, 0.3299%, p=0.118) — but **a G.17 on an opex Friday gaps 0.4598% against 0.2983% for an opex Friday without one, p=0.0245, n=33.** The second control dissolves it: **with-retail 0.5173% (n=10, p=0.0707), WITHOUT-retail 0.3368% (n=22, p=0.6692)**. Across all days: with-retail **0.4285% p=0.0038 (n=59)**, without **0.3109% p=0.4731 (n=83)** — the November lane's numbers to four decimals, independently parsed. **Retail sales print 10-15, the day before**, so this print's class (month 3, no retail, n=30) reads gap **0.3196% p=0.5423**, range **0.6602% p=0.0775 (narrower)**. **This reconciles the two siblings:** the HMI lane's stacked class (0.4828%, p=0.0365) is mid-month and therefore disproportionately *with-retail*, which is exactly the lift the November lane attributed to the 08:30 print — neither measurement was wrong, the missing variable was the co-release, and this date is the clean case. Only **2 of 11** October G.17 sessions were also opex (2015-10-16, 2020-10-16): gaps 0.237% / 0.420%, ranges 0.674% / 1.051%, both under the p75. Baseline percentiles: range p50 0.873 / p75 **1.325** / p90 **2.065**; \|gap\| p50 0.282 / p75 **0.542** / p90 0.926. **Primary content** (2026-08-18, July data): IP and manufacturing **each +0.2%** after +0.3%; mining +0.2%, utilities +0.5%, nondurables −0.4%, motor vehicles −2.1%; manufacturing capacity utilization **76.0%**, 2.2pp below its 1972–2025 average. FRED: total capacity utilization **76.29%**, **3.13pp** below the 79.41% long-run mean and the **20.1st percentile** of 715 months since 1967; `IPMAN` **99.31 — 0.69% BELOW its own 2017 average nine years on**; total IP 102.99, **+1.08% y/y**. **The sibling's seasonal does NOT transfer:** the November lane registered October weakness (median −0.340%, 7 of 9 negative, p=0.0783); **September, this print's month, is null — median +0.043% vs −0.006%, 4 of 9 negative against a 50.9% base rate** (−0.279, −0.106, +0.103, +0.065, −0.338, +0.193, +0.180, −0.620, +0.043). No seasonal test registered here on purpose. **THE LIVE VARIABLE, and this session bounds it where the siblings could not:** the Board announced **2026-05-15** (text still carried in the current release) that the **annual revision** lands *"in the autumn of 2026"* — base year **2022**, 2023 Census manufacturing benchmark, capacity through Q4-2025 — and has **named no date as of today**. Autumn runs to 12-21 and a revision *can* supersede a monthly (2024: *"Data referred to in the release dated June 18, 2024, were superseded"*). But **all 12 revisions on record are month-end, standalone, noon releases** — 2025-11-24, 2024-06-28, 2023-03-28, 2022-06-28, 2021-05-28, 2019-03-27, 2018-03-23, 2017-03-31, 2016-04-01, 2015-07-21, 2014-03-28, 2013-03-22 — **11 at day-of-month ≥ 21 and none ever mid-month**, and the shortest dated notice on record is **11 days** (median 36). So a revision preempting a 16th-of-the-month print would be unprecedented in shape **and** needs its notice by **2026-10-05**. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** IMF/World Bank + SIFMA closure 10-12; CPI, Beige Book, SSA COLA 10-14; PPI, retail sales, MTIS, Treasury buyback + coupon announcement 10-15; **this print, import/export prices, primary-dealer agenda and October opex 10-16**; FOMC blackout 10-17; NAHB HMI 10-19; housing starts 10-20; ECB quiet period + 20Y bond 10-21. **Volatility:** VIX **14.53**, SPY **770.19**, QQQ **718.96** (2026-09-04 closes); prior five VIX closes 14.43 / 14.92 / 16.34 / 15.20 / 14.32 — baseline, nothing to diff yet. **Geopolitical:** funding clear (PL 119-103 to 12-11); the G20 finance ministers meet Bangkok 10-15 and the IMF/World Bank meetings run 10-12→18, so this print sits mid-way through the corridor's international-policy week; the Board's DDP "Build Your Package" removal lands the week of Nov 9, after this print. **Event tape:** no September consensus at D-40; the 09-18 edition sets the last read before it. **NO event proposed, and the declines are on the record:** the Board's already-published **2027** dates are real but standalone with no known vintage (the same grounds the November lane used to decline 09-18 and this date, and the December lane to decline 2027-01-15 — and Leg 3 strengthens that argument); the **annual revision** still has no date; and **`industrial-production-2026-09-18`** already exists as another lane's proposal and is due for its own research, so filing a competing one would be the add/add collision #1717 removed. **No blocked fetches this session** — all six sources returned 200, including both Atlanta Fed workbooks at the `Project/Atlanta/FRBA` path and FRED. **Five forward tests registered:** `-1` (no GDPNow vintage dated 10-16 — the publisher-side claim), `-2` (SPY gap below the 0.542% p75), `-3` (SPY range below the 1.325% p75), `-4` (the annual revision does not publish on or before 10-16 — the month-end-pattern claim), `-5` (the 10-16 gap is smaller than the 10-15 gap — the co-release attribution as one paired observation). | **Initial stance set: stand aside; this is the quietest G.17 the calendar carries and it earns its file as the control that makes the other three legible — month-3 vintages are indistinguishable from ordinary days (p=0.6456), the Atlanta Fed schedules no vintage on this date at all, and the opex-Friday elevation that looked like this print's footprint is the 08:30 retail print's, which lands 10-15.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-industrial-production-2026-10-16.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
