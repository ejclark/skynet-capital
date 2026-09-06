# Pending Home Sales Index (NAR, November 2026 data) — pending-home-sales-2026-12-17

**Kind:** macro-print · **Date:** 2026-12-17 (**confirmed**, `IR:` NAR's own 2026 Statistical News Release Schedule — nar.realtor/newsroom/nar-statistical-news-release-schedule and its .docx twin published 2025-11, both fetched direct 2026-09-06, "DECEMBER | Thu., Dec. 17 | November Pending Home Sales Index"; promoted this session from the `EST:` proposal) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-decision-2026-12-18","boj-tankan-2026-12-14","ecb-decision-2026-12-17","g20-miami-2026-12-14","housing-starts-2026-12-17","import-export-prices-2026-12-17","intl-transactions-q3-2026-12-18","japan-cpi-2026-12-18","mtis-2026-12-16","opex-2026-12-18","pjm-capacity-auction-2026-12","ppi-2026-12-15","puct-batch-zero-report-open-meeting-2026-12-17","retail-sales-2026-12-16"],"screenStreak":0,"blocked":[{"url":"https://web.archive.org/cdx/search/cdx?url=nar.realtor*","status":"503","at":"2026-09-06"},{"url":"https://fred.stlouisfed.org/searchresults/?st=pending+home+sales","status":"CURL_56","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **The date is the publisher's own, and the two things this print was proposed to be good for
both fail on measurement — so it narrows to one job: continuity if the funding cliff bites.** The
proposing lane left one question explicitly open — does the Atlanta Fed ingest the PHSI at all? It does
not, and the answer is structural rather than statistical: GDPNow's `Residential` sheet carries **six**
leaves and none is a pending-sales variable, `pending home` appears **0** times across the workbook's
**3,665** shared strings and 14 comment files (against **22** strings naming existing-home sales, 34
naming housing starts, 42 naming new-home sales), and GDP books the brokerage commission at *closing* —
a signed contract is not a transaction. Belt and suspenders: the 2026-12-17 GDPNow vintage posts at
**08:30**, ninety minutes *before* this 10:00 print. The tape fails too, and instructively. The print's
own 10:00 hour is exactly ordinary — **ITB 33.9%** of session range against a **35.3%** baseline
(723 sessions, p=**0.79**), XHB 30.8% vs 37.1%, SPY 39.5% vs 39.9%. A whole-session read *looks* hot
(ITB median |open→close| **1.825%** vs **0.893%**, p=**0.039**) and that is a **calendar artifact**:
**4 of the 8** realized 2026 PHSI dates carry a homebuilder earnings 8-K within one day and a 5th is an
FOMC SEP decision day, while the 8 existing-home-sales dates carry **zero**. NAR's day-16-to-21 PHSI
slot sits inside the builder reporting window; its day-9-to-14 EHS slot sits before it. Nothing here
licenses an entry — stand aside on every horizon — and the one thing worth writing down is that
**2026-12-17 will be a wide session for homebuilders for reasons that are not this print**: it is
December opex eve (ITB median range **2.691%** vs 1.830%, n=12, p=**0.008**), in the week LEN has
reported its Q4 in six of the last seven years.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-102) | **Stand aside** | High | `symbols: []` survives a direct test rather than an inherited one: on the **8** realized 2026 PHSI release days the print's own 10:00–11:00 hour is indistinguishable from an ordinary hour on **ITB (33.9% vs 35.3%, p=0.79)**, XHB (30.8% vs 37.1%, p=0.36) and SPY (39.5% vs 39.9%, p=0.96), 723 hourly sessions 2023-10-09 → 2026-09-04. No house playbook is macro- or housing-keyed — a re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** housing hits today. No instrument attaches on any date. | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-12-01** — none exists today |
| This week | **Stand aside, and settle which NAR page governs — the next PHSI is 2026-09-17, not the 09-10 NAR's own statistics page names** | Medium | NAR's schedule and its .docx both read "Thu., Sep. 17 | August Pending Home Sales Index", while the PHSI statistics page's "Next release" note names **Thursday, September 10** — which is the *existing-home* sales date from the same schedule. The schedule won on the last edition: NAR's July-data release carries `<time>August 18, 2026</time>`, exactly its scheduled row. Medium, not high, because two publisher surfaces disagree and only one can be right. Registered as `-1`. | The August PHSI publishing on **2026-09-10** — the content page's note would then govern and the 12-17 date this ledger rests on needs re-deriving from that surface instead |
| This month | **Do not build a nowcast read on this print — there is no channel to read** | High | GDPNow's `Residential` node has six leaves (Permanent-site, Manufactured homes, Dormitories, Brokerage commissions, Improvements, Residential equipment) and no pending-sales variable; **0 of 3,665** workbook shared strings mention pending home sales. GDP books the commission at closing, so a contract signed is not yet output. The 12-17 GDPNow vintage posts **08:30**, before the 10:00 print. | Any GDPNow vintage through **2026-12-23** naming a pending-home-sales release in its `Data releases` free text — none of **1,871** archived vintages ever has |
| This quarter | **Expect a wide 12-17 for homebuilders and attribute none of it here — the print's value is contingent continuity, not information** | Medium | 2026-12-17 is **December opex eve** (3rd Friday = 12-18): ITB's median session range on that date class is **2.691%** against **1.830%** since 2014 (n=12, p=**0.008**, 10 of 12 above baseline), and LEN has reported its Q4 in the 12-14…12-19 window in **six of the last seven years** while KBH moved its Q4 into December (2025-12-18). Medium because n=12 and the 2026 builder dates are unpublished. The one thing PHSI uniquely offers: it is a **NAR** release, immune to the 2026-12-11 funding cliff that both 08:30 federal prints that morning are exposed to. | ITB's **2026-12-17** 10:00–11:00 ET range printing **at or above 47.3%** of that session's 09:30–16:00 range — the ordinary-session p75 — which would say the print does own its hour after all. Registered as `-2` |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `symbols: []` is measured inert on the metric
  that isolates the print, and no macro- or housing-keyed playbook exists. Research is not action.
- **There is no nowcast line to read.** Unlike its 12-09 sibling, this print feeds no GDPNow variable —
  so the sibling's "read the residential contribution" advice has no analogue here.
- **A wide 12-17 in homebuilders is opex eve and a builder's own print, not the PHSI.** Registered as
  `-2` (the print's hour stays ordinary) and `-3` (a builder reports within a day of 12-17).
- **Do not read "confirmed" as licence.** The date is now the publisher's own; the call is unchanged.
- **The one contingent use: if the cliff bites, this is the only US data release on 2026-12-17.** Both
  08:30 prints that morning are federal (Census housing starts, BLS import/export prices); the 10:00
  PHSI is not. That is continuity, not an edge.
- **Watch (dated)** — August data **09-17** (the date-source resolution, `-1`) · FOMC **09-16** ·
  September data **10-20** · October data **11-18** · **EHS 12-09** (the lagging half, FOMC SEP day) ·
  **CR expiry 12-11** · MTIS **12-16** · **12-17 08:30 housing starts + import/export prices (federal,
  exposed) and 10:00 PHSI (NAR, immune)** · **opex 12-18** · GDPNow vintage **12-23** (the last chance
  for a PHSI mention, `-2`'s companion) · December data ~**2027-01-21** (2027 NAR schedule unpublished).

## Initial research

### The question, plainly

This event reached the calendar as an `EST:` proposal from the `existing-home-sales-2026-12-09`
adjacency sweep, and that lane wrote its own open question into the proposal: *"NOT verified this
session: whether the Atlanta Fed incorporates PHSI into GDPNow at all… the initial research should treat
a nowcast channel as unproven rather than assumed."* It also handed down a framing — that 12-17 is *"the
corridor's cleanest natural experiment on whether the cliff bites, two residential prints ninety minutes
apart with opposite funding exposure"* — and noted that unlike the 12-09 sibling this print lands on an
ordinary session, so *"the PHSI tape is readable where the EHS tape is not."* **Does NAR's own calendar
carry the date; is there a nowcast channel; and is the tape actually readable?**

**One-line verdict:** the date is the publisher's own and promotes to `confirmed`; there is **no**
nowcast channel and the negative is structural rather than statistical; and the tape is **not** readable
in the way the framing hoped — the print's own hour is ordinary, the session is wide for reasons that
are not the print, and the "natural experiment" is better understood as a **continuity asset**, because
only one of its two arms can be measured at all.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies to the event itself; the instrument caches were
busted anyway (`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) because
the builder-earnings work below uses `market-data.mjs`'s SEC 8-K path. Six inputs, all fetched direct on
2026-09-06:

1. **`nar.realtor/newsroom/nar-statistical-news-release-schedule`** (302 → `/press-releases/…`, HTTP 200,
   483,177 bytes) and its downloadable twin
   **`/sites/default/files/2025-11/2026-nar-statistical-news-release-schedule.docx`** (HTTP 200, 55,384
   bytes, published 2025-11) — the publisher's forward calendar. The .docx carries all twelve months;
   the live page carries September onward.
2. **`nar.realtor/research-and-statistics/housing-statistics/pending-home-sales`** (HTTP 200, 565,653
   bytes) — the current edition, the methodology statement and the next-release note.
3. **`nar.realtor/newsroom/NAR-Pending-Home-Sales-Report-Shows-2-3-Decrease-in-July`** (HTTP 200,
   695,423 bytes) — read for its `<time>` element, i.e. the date a scheduled release *actually* went out.
4. **`GDPTrackingModelDataAndForecasts.xlsx`** (10,875,424 bytes) — the `Residential` sheet for the
   model's own variable wiring, and the whole workbook's **3,665 shared strings + 14 comment files** for
   a release-name census. **`GDPNowcastDataReleaseDates.xlsx`** (16,944 bytes) — `PostedUpdates`,
   **82 dated rows** 2025-12-23 → 2026-12-23, plus `InternalUpdates`.
5. **`federalreserve.gov/monetarypolicy/fomccalendars.htm`** (HTTP 200, 164,831 bytes) — the 2026
   decision days, parsed from statement-PDF filenames (`monetary<YYYYMMDD>a`) and calendar cells.
6. **Yahoo bars** — daily OHLC for SPY/QQQ/ITB/XHB/^VIX (SPY n=8,458 to 2026-09-04) and **60-minute
   bars, 723 sessions 2023-10-09 → 2026-09-04**, with 20,000-iteration permutation tests on medians;
   plus **SEC 8-K Item 2.02** filing dates for DHI, LEN, PHM, NVR, TOL, KBH via `market-data.mjs`.

Two collection notes, both recorded in `probe-ref.blocked` rather than papered over. **The Wayback
Machine CDX API returned 503 ("Internet Archive services are temporarily offline")**, which is what
closed off a long PHSI release-date history — see *Honest limits*. **FRED's series search failed**
(curl exit 56 after a 120s hang); FRED carries no PHSI series to find, for the licensing reason NAR
states on its own page. Daily closes reproduce the sibling ledger's exactly — SPY **770.19**, QQQ
**718.96**, VIX **14.53**, ITB **93.91**, XHB **103.25** on 2026-09-04 — the cross-check that both
ledgers read one tape.

### Leg 1 — the date, and a conflict between two of the publisher's own pages · **SUPPORTED**, and promoted to `confirmed`

NAR's 2026 schedule, in both surfaces, reads:

> **DECEMBER** — Wed., Dec. 9 · November Existing-Home Sales · **Thu., Dec. 17 · November Pending Home
> Sales Index**

under *"All releases are distributed at 10 a.m. Eastern Time."* The .docx published in November 2025
carries the same row, so the date has been fixed for ten months.

**Status promoted `estimate` → `confirmed`, prefix `EST:` → `IR:`,** on the precedent the sibling
established and this calendar already carries: `challenger-job-cuts-2026-09-03`, a private publisher's
macro series, is `confirmed`/`IR:` on the publisher's own release. NAR *produces* this index; it is not
an aggregator reporting someone else's. Per the lane's hard limits a flip requires a primary source and
this is one; per the date policy it licenses nothing, and the call below is stand aside either way.

A stronger corroboration than a second calendar: **a scheduled date that was actually met.** NAR's
July-data press release carries `<time>August 18, 2026</time>` — exactly the schedule's "Tue., Aug. 18 |
July Pending Home Sales Index". The schedule is not merely published, it is honored.

**And one conflict, recorded rather than smoothed over.** The PHSI *statistics* page states: *"Next
release: Pending Home Sales for August 2026 will be released on Thursday, September 10, 2026 at 10 a.m.
Eastern."* The schedule says **September 17**; September 10 is the *existing-home sales* date from the
same table. Two more artifacts on that same page point the same way — it says NAR issues its release
*"on or near the 20th of each month"* (the cadence NAR abandoned in January 2026, per the sibling's Leg
6), and its snapshot infographic is dated **July 16** while describing **July** data (July data released
August 18; July 16 was the *June*-data date). The reading: that page's next-release block is populated
from its sibling series and is stale in at least two other places, while the schedule, the .docx and the
actual `<time>` on the last release all agree. **The schedule governs.** This is not left as an
assertion — it is registered as `FT-pending-home-sales-2026-12-17-1`, scored on **2026-09-17**, eleven
days out. That single observation is what tells the next pulse whether the surface this ledger's 12-17
date rests on is the right one.

### Leg 2 — is there a nowcast channel? · **REFUTED**, and this closes the proposing lane's open question

The proposal asked the question and declined to answer it. The answer is no, and it is a *structural*
no rather than a statistical one — which is a stronger result than a null p-value.

**The model's own variable list.** `GDPTrackingModelDataAndForecasts.xlsx`'s `Residential` sheet
enumerates every leaf of `FRZ_USNAqtr` (residential investment):

| Leaf | Model variable | Fed by |
|---|---|---|
| Permanent-site | `FRSPX_USNAqtr` | `SplicedNewHousingConstruction` (the 12-17 08:30 housing-starts print) |
| Manufactured homes | `FRSHMX_USNAqtr` | `MobileHomeVal` |
| Dormitories | `FRSHDX_USNAqtr` | — |
| **Brokerage commissions** | **`FRSBKX_USNAqtr`** | `valTotalHomeSales` = **`valExHomeSales`** (the 12-09 print) + `valNewHomeSales` |
| Improvements | `FRSINX_USNAqtr` | `SplicedBuildingMaterials`, residential-remodeler payrolls |
| Residential equipment | `FREX_USNAqtr` | `RetSalesResEquip` |

**Six leaves; no pending-sales variable.** The reason is the same wiring the sibling documented, read one
step further: an existing home is a transfer of an existing asset, so only the broker's commission is
output — and the commission is booked when the sale **closes**. A contract signed in November is not a
transaction until it settles, which is why the *closings* series feeds GDP and the *contracts* series
does not.

**A release-name census over the whole workbook confirms it.** Across **3,665 shared strings** — which is
where `ContribArchives`' `Data releases` free text for all **1,871 vintages** lives — and 14 comment
files:

| Phrase | Distinct strings |
|---|---|
| `existing-home` / `existing home` | **22** |
| `housing starts` | **34** |
| `new-home sales` | **42** |
| **`pending home`** | **0** |
| `PHSI` | **0** |
| `contract` | **0** |

Zero, in either workbook. `GDPNowcastDataReleaseDates.xlsx` — both `PostedUpdates` (82 dated rows) and
`InternalUpdates` — names it zero times too.

**And the ordering settles the specific date.** The Atlanta Fed's 2026-12-17 row reads
**"Housing starts, Import and export prices" at 08:30** — ninety minutes *before* the 10:00 PHSI. Even a
model that wanted the PHSI could not put it in that vintage. The next posting is **2026-12-23 10:00**
("GDP Q3 3rd estimate, Personal income and outlays, NIPA underlying detail tables, Advance Census
manufacturing (M3-1), New-home sales") and it does not name it either.

So the sibling's central asset — *the nowcast line is attributable even when the tape is not* — has **no
analogue here.** This print's only possible read is the tape, which puts the whole weight of the
question on Leg 3.

### Leg 3 — is the tape readable? · **REFUTED**, and the way it fails is the finding

The proposing lane's hope was reasonable: 12-17 is an ordinary session with no FOMC, so unlike 12-09 the
tape should be readable. It is readable. It just does not say anything about this print.

**The direct test — the print's own hour.** If a 10:00 release moves an instrument, its own hour should
take an unusual share of the session's range. Sixty-minute bars, **723 sessions 2023-10-09 → 2026-09-04**,
10:00–11:00 ET high-low as a share of the 09:30–16:00 high-low, against the **8** realized 2026 PHSI
release days (NAR's own calendar: 01-21, 02-19, 03-17, 04-21, 05-19, 06-17, 07-16, 08-18):

| | PHSI days (n=8) | p | EHS days (n=8) | p | Baseline (n=707) |
|---|---|---|---|---|---|
| **ITB 10:00-hour share** | **33.9%** | **0.79** | 39.7% | 0.42 | **35.3%** (p25 27.3 / p75 47.3) |
| **XHB 10:00-hour share** | 30.8% | 0.36 | 38.2% | 0.90 | 37.1% |
| **SPY 10:00-hour share** | 39.5% | 0.96 | 45.1% | 0.49 | 39.9% (p25 29.6 / p75 51.9) |

**The release does nothing to its own hour on any of the three.** These baselines independently reproduce
the sibling's (its ITB p25/p50/p75 of 28.7/35.8/48.0 against this session's 27.3/35.3/47.3, on the same
window with a different range denominator), which is a second cross-check that the two ledgers agree on
the tape as well as on the closes.

**The trap, and why it is worth writing down.** A whole-session read of the same 8 days says the
opposite. Daily bars, 2026 sessions to 2026-09-04, permutation against a 150-session baseline excluding
FOMC decision days and both release classes:

| | PHSI (n=7, FOMC day removed) | p | EHS (n=8) | p | Baseline |
|---|---|---|---|---|---|
| **ITB median \|open→close\|** | **1.825%** | **0.039** | 1.374% | 0.18 | **0.893%** |
| **XHB median \|open→close\|** | **1.872%** | **0.019** | 1.241% | 0.28 | 0.833% |
| SPY median \|open→close\| | 0.238% | 0.36 | 0.548% | 0.19 | 0.368% |
| ITB median session range | 2.366% | 0.74 | 2.407% | — | 2.159% |

Two significant p-values, on the sector with the obvious channel, and *not* on the index — which is
exactly what a real housing-specific effect would look like. It is not one. Checking each date against
SEC 8-K Item 2.02 filings:

| 2026 PHSI date | ITB open→close | What else was on it |
|---|---|---|
| 2026-01-21 | **+2.22%** | **DHI reported 2026-01-20** (prior session) |
| 2026-02-19 | −1.26% | — |
| 2026-03-17 | −0.18% | FOMC meeting day 1 (decision 03-18) |
| 2026-04-21 | **−2.51%** | **DHI reported 2026-04-21 — same day**; NVR 04-22 |
| 2026-05-19 | −0.66% | **TOL reported 2026-05-19 — same day** |
| 2026-06-17 | −2.64% | **FOMC SEP decision day** (excluded above) |
| 2026-07-16 | **+2.66%** | — (unexplained by this session's checks) |
| 2026-08-18 | −1.83% | **TOL reported 2026-08-18 — same day** |

**Four of eight carry a homebuilder earnings report within one day; a fifth is an FOMC SEP decision. The
eight existing-home-sales dates in the same year carry zero such collisions.** The mechanism is the
calendar change the sibling's Leg 6 documented, seen from the other side: NAR moved EHS to day **9–14**
and the PHSI sits **6–8 days later**, at day **16–21** — which is precisely when DHI (fiscal quarters
ending Dec/Mar/Jun, reporting ~Jan 20 / Apr 21 / Jul 21) and TOL (~Feb 17 / May 19 / Aug 18) report.
**The PHSI slot is structurally inside the builder reporting window and the EHS slot is structurally
before it.** With three uncontaminated observations left there is nothing to test, so the honest verdict
is not "measured inert on the session" but *"the session-level question cannot be answered on available
data, and the hour-level question can, and it says nothing happens."*

### Leg 4 — what 2026-12-17 actually is · **SUPPORTED**, and it is opex eve

The one thing about this date worth acting on is not the print. **2026-12-18 is the third Friday of
December — quarterly quad-witching — so 12-17 is December opex eve.** Daily bars 2014-01-01 onward,
n=12 eves against a 3,164-session baseline:

| | Dec-opex eve (n=12) | p | Dec opex day | Baseline (2014+) |
|---|---|---|---|---|
| **ITB median session range** | **2.691%** | **0.008** | 1.856% | **1.830%** |
| ITB median \|open→close\| | 1.392% | 0.044 | — | 0.829% |
| SPY median session range | 1.085% | 0.25 | 0.976% | 0.873% |
| SPY median \|open→close\| | 0.712% | 0.036 | — | 0.379% |

**Ten of twelve December opex eves exceed ITB's baseline median**; the class p25 is 1.705% and its
minimum since 2014 is 1.209%. And the same builder-earnings mechanism is very likely part of *why*:
**LEN has reported its Q4 on 12-14 … 12-19 in six of the last seven years** (2020-12-16, 2021-12-15,
2022-12-14, 2023-12-14, 2024-12-18, 2025-12-16) and **KBH moved its Q4 into December** in 2025
(2025-12-18, after 2023-01-11 / 2024-01-10 / 2025-01-13). Neither 2026 date is published yet, so neither
is proposed as an event below — but the expectation is registered as `-3`.

**Practical form:** expect a wide 12-17 in homebuilders, and attribute none of it to the PHSI. This is
the same conclusion the sibling reached for 12-09 by a completely different route — there the session
belongs to the 14:00 SEP decision, here it belongs to opex eve and a builder's own print.

### Leg 5 — the "natural experiment" framing · **MIXED**, and it reframes to continuity

The proposing lane called 12-17 *"the corridor's cleanest natural experiment on whether the cliff
bites."* The setup is real. The corridor's funding events are `cr-expiry-2026-12-11` and
`government-funding-deadline-2026-12-11` (both `estimate`, `high`, `NEWS:`-sourced on the 2026-09-01 CR
vote), six days earlier. On the morning of 12-17:

| Time | Release | Publisher | Cliff exposure |
|---|---|---|---|
| 08:30 | New Residential Construction (housing starts) | Census (federal) | **exposed** |
| 08:30 | Import and Export Price Indexes | BLS (federal) | **exposed** |
| 08:30 | GDPNow vintage posts | Atlanta Fed | — |
| **10:00** | **Pending Home Sales Index** | **NAR (private trade association)** | **immune** |

**The immunity is certain** — NAR's release does not depend on appropriations. But an experiment needs
both arms measurable, and Legs 2 and 3 have just shown that the immune arm has **no nowcast channel and
no tape signature**. So there is nothing to compare. Graded MIXED rather than REFUTED because the *setup*
survives and only the *inference* changes: on 12-17 the PHSI is not the control in an experiment, it is
the **continuity asset**. In the base case (Census and BLS print) it adds nothing measurable. In the
cliff case, the entire 08:30 slot goes dark, GDPNow's vintage has nothing to ingest, and **the PHSI is
the only US data release that day** — which is worth knowing and is still not worth trading.

One limit stated rather than assumed: whether a lapse actually suspends Census and BLS depends on which
appropriations have passed by 12-11, and partial lapses have historically funded some statistical
agencies and not others. This session did not verify the FY2027 bill status and does not claim to.

### Primary content read — what the last published edition says

NAR's PHSI statistics page, current edition **July 2026 data**: the index **fell 2.3% m/m to 71.2** and
**2.2% y/y**, with month-over-month declines **across all four major U.S. regions, led by the West** —
described on the page as *"the lowest level since January 2026."* Chief Economist Lawrence Yun, quoted
verbatim: *"The highest mortgage rates of the year hit right in the middle of summer, and that's pulling
back contract signings"*, and *"Right now, pending contracts are 30% below their pre-pandemic 2019
level, while payroll employment is 5% above. That gap points to sizable pent-up demand."*

The same page states the definition this ledger's framing rests on: *"The Pending Home Sales Index (PHS),
a leading indicator of housing activity, measures housing contract activity, and is based on signed real
estate contracts for existing single-family homes, condos, and co-ops. Because a home goes under contract
a month or two before it is sold, the Pending Home Sales Index generally leads Existing-Home Sales by a
month or two."*

**A correction to the corridor framing that follows from it.** Both 12-09 and 12-17 report reference month
**November 2026** — but they are different cohorts of that month: 12-09 counts closings (contracts signed
roughly September–October) and 12-17 counts contracts signed in November. So the PHSI is *not* the
leading half of the print that lands eight days earlier; it leads the editions that land **2027-01-21**
and later. Read for a turn in demand, 12-09 is the lagging half and 12-17 is the forward one, and the two
never describe the same buyers.

Context from series this repo can actually redistribute, fetched 2026-09-06: `MORTGAGE30US` **6.71%**
(2026-09-03, up from 6.65% and 6.66% the two prior weeks) — the "highest mortgage rates of the year" Yun
names; `HSN1F` new-home sales **607k** SAAR (July, from 678k in June).

**A limit that shapes every content statement above:** NAR's page carries an explicit redistribution
restriction — *"No part of the data may be reproduced, stored in a retrieval system, transmitted or
redistributed in any form… without NAR's prior written consent"* — which is why FRED carries no PHSI
series and why this ledger quotes only the figures NAR publishes in its own release. There is no base
rate available to register a content forward test against, so **this ledger registers none**, exactly as
its sibling did for the same licensing reason.

### The adjacency sweep

- **Peer prints** — n/a for the event, `symbols: []`. The homebuilder names were read as a *class* and as
  a **confound** (Legs 3 and 4), never as holdings: ITB **93.91**, XHB **103.25** (2026-09-04 closes),
  none tracked by this calendar. SEC 8-K Item 2.02 dates for DHI/LEN/PHM/NVR/TOL/KBH were pulled solely
  to date the collisions.
- **Macro surprises** — none since the last row; there is no last row. 2026 FOMC decision days parsed
  fresh from the Fed's own calendar: 01-28, 03-18, 04-29, **06-17 (SEP)**, 07-29, **09-16 (SEP)**, 10-28,
  **12-09 (SEP)**. The December decision is 12-09, eight days before this print, so unlike its sibling
  this event's session carries no FOMC.
- **Volatility regime** — VIX **14.53**, SPY **770.19**, QQQ **718.96** (2026-09-04 closes). 2026's VIX
  has run a **14.25 – 31.05** range with a **17.48** median, so today's reading is at the calm end of its
  own year. Baseline; nothing to diff against yet.
- **Geopolitical / policy** — PL 119-103 funds through **2026-12-11** (carried from the corridor's own
  ledgers, not re-derived). Leg 5 is the full treatment. G20 Miami 12-14 and the ECB decision 12-17
  itself are in the window; no channel to a series with no symbols.
- **Event tape** — no November consensus exists at D-102 and none will before the 11-18 October edition
  sets the base. Every November-content statement here is a base rate, never a forecast.
- **No new dated event is proposed in this PR**, and the absence is a decision rather than an omission.
  Everything dated that this sweep surfaced is already on the calendar (`housing-starts-2026-12-17` and
  `import-export-prices-2026-12-17` at 08:30, `mtis-2026-12-16`, `opex-2026-12-18`, the 12-11 cliff pair)
  or already proposed by another lane. **Two classes considered and declined.** *(a)* The routine monthly
  PHSI editions on NAR's 2026 calendar — 09-17, 10-20, 11-18 — declined on the criterion the sibling set
  and this lane inherits: an edition earns a row only when it is *distinguishable*, and these are not
  (09-17's date question is answered by a forward test, which is cheaper than an event). *(b)* **LEN's and
  KBH's Q4 reports**, which Leg 4 shows are very likely to land within days of 12-17 — declined because
  **neither company has published a 2026 date**, and a pattern is not a source; proposing an `estimate`
  off six years of history would fabricate the provenance the `EST:`/`IR:` prefixes exist to carry. The
  expectation is registered as a scored forward test instead, which is the honest instrument for it.

### Honest limits

- **The tape sample is one year, n=8, because the release-date history is not obtainable.** GDPNow's
  archive dates existing-home sales 140 times and the PHSI **zero** times; NAR's newsroom prunes (its
  sitemap carries exactly **2** PHSI press releases); FRED carries no series; and the Wayback CDX API —
  the one route to NAR's archived annual schedules — returned **503, "Internet Archive services are
  temporarily offline"**, recorded in `probe-ref.blocked`. A later session with the archive back up
  should rebuild the date history and re-run Leg 3 properly.
- **The derivable-dates shortcut was available and deliberately not taken.** PHSI lands 6–8 days after
  EHS in every 2026 month, and the sibling has 140 EHS dates — so a longer PHSI series could have been
  *computed*. Computing dates and then testing a tape on them would manufacture the observations the test
  is supposed to weigh. n=8 with the limit stated beats n=140 with the limit hidden.
- **Leg 3's exploratory pass tested 8 symbol×metric combinations** before the collision check explained
  the two that came in under 0.05, and ITB and XHB are near-duplicates rather than independent tests.
  The hour-level result reported as the finding is the *pre-specified* one — it is the metric that
  isolates a 10:00 release — and it is a null, which is the direction that costs nothing to be wrong in.
- **2026-07-16 (ITB +2.66%) is unexplained.** No builder reported within a day and it is not an FOMC
  date; this session did not identify what moved it and does not claim the collision story covers all
  eight days.
- **Leg 4's opex-eve class is n=12** and its overlap with LEN's Q4 print is described as plausible, not
  decomposed — this session did not separate the opex effect from the earnings effect, and with 12
  observations it could not.
- **Neither builder's 2026 Q4 date is published**, so `-3` is a forecast about a calendar, and the LEN
  and KBH patterns it rests on are 7 and 1 observations respectively.
- **The FY2027 appropriations status was not verified**, so Leg 5's exposure column is "federal, and
  therefore conditional on which agencies lapse", never a claim that they will.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it. A housing-keyed playbook would change that and
  does not exist today.

## Stance & kill switches

**Stance (date is `confirmed`, promoted this session on the publisher's own calendar).** Stand aside on
2026-12-17 and on every edition of this report. Hold four frames. **On the date:** it is NAR's own,
published in November 2025, honored on the last edition (`<time>August 18, 2026</time>` matching its
scheduled row) — and NAR's *statistics* page contradicts its own schedule about the next release, so the
schedule is named as the governing surface and the conflict is registered rather than resolved by
assertion. **On the nowcast:** there is **no channel** — six residential leaves, none of them
pending-sales; **0 of 3,665** workbook strings; and the 12-17 vintage posting 08:30, before the 10:00
print. The sibling's best asset has no analogue here, and the proposing lane's open question is closed
negatively. **On the tape:** the print's own 10:00 hour is ordinary on ITB, XHB and SPY (p = 0.79, 0.36,
0.96), while the session-level signal that looked real is a **calendar artifact** — 4 of 8 PHSI dates
carry a builder earnings 8-K within a day and a 5th is an FOMC SEP decision, against **zero** collisions
on the 8 EHS dates, because NAR's day-16-to-21 PHSI slot sits inside the builder reporting window.
**On 12-17 itself:** expect a wide homebuilder session — December opex eve runs ITB **2.691%** against
**1.830%** (n=12, p=0.008), in the week LEN has printed its Q4 six of the last seven years — and
attribute none of it here. The print's only distinctive property is that it is **not federal**: if the
2026-12-11 cliff bites it is the only US data release standing on 12-17. That is continuity, not an
edge. Nothing here licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **Any GDPNow vintage through 2026-12-23 names a pending-home-sales release in its `Data releases` free
  text.** Zero of 1,871 archived vintages ever has, and the model carries no variable for it, so this
  would mean the Atlanta Fed added an input — and this print would acquire the attributable nowcast line
  Leg 2 says it does not have.
- **ITB's 10:00–11:00 ET range on any PHSI release day between now and 12-17 exceeds 47.3%** (the
  ordinary-session p75) **with no homebuilder earnings within one day and no FOMC, CPI or jobs print that
  session.** Leg 3's hour-level null is then falsified on a clean instance and `symbols: []` is back in
  question. The dated chances to observe it: **09-17**, **10-20** and **11-18**.
- **NAR publishes the August PHSI on 2026-09-10 rather than 2026-09-17.** The statistics page's
  next-release note would then be the governing surface and the schedule the stale one, which puts the
  12-17 date — and Leg 1's promotion to `confirmed` — back on the estimate side pending re-derivation.
- **NAR moves, delays or restructures the 2026-12-17 release on its own schedule.** The `confirmed` label
  reverts to `estimate`; the schedule page and its .docx are the two places that would show it.
- **A macro- or housing-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-12-01.**
  The stand-aside is partly an absence-of-instrument argument; a housing-keyed playbook makes it a live
  question rather than a settled one.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-pending-home-sales-2026-12-17-1` — NAR publishes the **August** PHSI on **2026-09-17**, the
  schedule's date, not the **2026-09-10** its own statistics page names. Score by 2026-09-17.
- `FT-pending-home-sales-2026-12-17-2` — **ITB's 2026-12-17 10:00–11:00 ET range is below 47.3%** of that
  session's 09:30–16:00 range (the ordinary-session p75). Score by 2026-12-17.
- `FT-pending-home-sales-2026-12-17-3` — **at least one of LEN, KBH, TOL, DHI, NVR or PHM files an 8-K
  Item 2.02 dated within one calendar day of 2026-12-17** — the operational form of "the PHSI slot is
  structurally inside the builder reporting window". Score by 2026-12-19.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-102 | **Initial research on an id that existed only as a proposal. The date promotes to `confirmed` on the publisher's own calendar; the proposing lane's open nowcast question closes NEGATIVELY and structurally; and the tape hope fails in a way that explains itself.** Canonical `src/domain/market-events/pending-home-sales-2026-12-17.json` written this session after reading the single proposal (`from-existing-home-sales-2026-12-09`), now shadowed. **Leg 1 — the date:** NAR's schedule (302→`/press-releases/…`, HTTP 200, 483,177 bytes) and its `.docx` twin published **2025-11** (HTTP 200, 55,384 bytes) both read "DECEMBER \| Thu., Dec. 17 \| **November** Pending Home Sales Index" under "All releases are distributed at 10 a.m. Eastern Time"; `estimate`→**`confirmed`**, `EST:`→**`IR:`**, on the `challenger-job-cuts-2026-09-03` precedent. Corroborated on EXECUTION, not just schedule: NAR's July-data release carries `<time>August 18, 2026</time>`, exactly its scheduled row. **One publisher-internal conflict recorded, not smoothed:** the PHSI statistics page's "Next release" note names **Thursday, September 10** — the EXISTING-home date from the same table — and that page carries two more stale artifacts (a day-20 cadence NAR dropped in Jan-2026; an infographic dated July 16 describing July data). The schedule governs; registered as `-1`, scored **09-17**. **Leg 2 — no nowcast channel, REFUTED structurally:** `GDPTrackingModelDataAndForecasts.xlsx`'s `Residential` sheet enumerates SIX leaves (`FRSPX` Permanent-site ← `SplicedNewHousingConstruction`; `FRSHMX` Manufactured homes; `FRSHDX` Dormitories; **`FRSBKX` Brokerage commissions ← `valTotalHomeSales` = `valExHomeSales` + `valNewHomeSales`**; `FRSINX` Improvements; `FREX` Residential equipment) and **none is a pending-sales variable** — GDP books the commission at CLOSING, so a signed contract is not yet a transaction. Census over the workbook's **3,665 shared strings + 14 comment files** (where all 1,871 vintages' `Data releases` free text lives): `existing-home` **22**, `housing starts` **34**, `new-home sales` **42**, **`pending home` 0**, `PHSI` 0, `contract` 0; `GDPNowcastDataReleaseDates.xlsx` (82 dated rows + `InternalUpdates`) also 0. **And the ordering settles the date:** the 2026-12-17 vintage posts **08:30** ("Housing starts, Import and export prices"), NINETY MINUTES BEFORE the 10:00 print; the next posting is 12-23 and does not name it either. So the sibling's best asset — an attributable nowcast line — has no analogue here. **Leg 3 — the tape, REFUTED, and the failure mode is the finding:** hourly bars, **723 sessions 2023-10-09 → 2026-09-04**, 10:00–11:00 share of the 09:30–16:00 range on the **8** realized 2026 PHSI dates (NAR's calendar: 01-21, 02-19, 03-17, 04-21, 05-19, 06-17, 07-16, 08-18) — **ITB 33.9% vs a 35.3% baseline (p=0.79)**, XHB 30.8% vs 37.1% (p=0.36), SPY 39.5% vs 39.9% (p=0.96); baselines reproduce the sibling's (its ITB p25/p50/p75 28.7/35.8/48.0 vs this session's 27.3/35.3/47.3). **The print does nothing to its own hour.** A WHOLE-SESSION read says the opposite — ITB median \|open→close\| **1.825% vs 0.893%, p=0.039**; XHB **1.872% vs 0.833%, p=0.019**; SPY null (0.238% vs 0.368%) — and that is a **CALENDAR ARTIFACT**: SEC 8-K Item 2.02 dates put **DHI on 2026-01-20 and 2026-04-21, NVR 04-22, TOL 05-19 and 08-18**, so **4 of 8** PHSI dates carry a builder print within a day, and a 5th (**06-17**) is an FOMC SEP decision day; the **8 EHS dates in the same year carry ZERO** collisions. Mechanism: NAR's EHS slot is day **9–14** and PHSI sits 6–8 days later at day **16–21**, which is exactly when DHI (~Jan 20 / Apr 21 / Jul 21) and TOL (~Feb 17 / May 19 / Aug 18) report — **the PHSI slot is structurally inside the builder reporting window and the EHS slot is before it.** Three uncontaminated observations remain, so the session-level question is UNTESTABLE on available data rather than answered. **Leg 4 — what 12-17 actually is:** **December opex eve** (3rd Friday = 12-18). Daily bars 2014+, n=12 eves vs a 3,164-session baseline — **ITB median session range 2.691% vs 1.830% (p=0.008)**, 10 of 12 above baseline, class p25 1.705%, min 1.209%; ITB \|o→c\| 1.392% vs 0.829% (p=0.044); SPY \|o→c\| 0.712% vs 0.379% (p=0.036). And **LEN has printed Q4 on 12-14…12-19 in six of the last seven years** (2020-12-16, 2021-12-15, 2022-12-14, 2023-12-14, 2024-12-18, 2025-12-16) while **KBH moved Q4 into December** (2025-12-18, after 2023-01-11/2024-01-10/2025-01-13). Expect a wide 12-17 in homebuilders; attribute none of it here. **Leg 5 — the "natural experiment" reframed, MIXED:** on 12-17 both 08:30 releases are federal and cliff-exposed (Census housing starts; BLS import/export prices) and the 10:00 PHSI is NAR and immune — but an experiment needs two measurable arms and Legs 2–3 just removed the immune one's. So the PHSI is not the control, it is the **continuity asset**: in the base case it adds nothing measurable; if the 2026-12-11 cliff bites, the 08:30 slot goes dark and it is the only US data release standing that day. FY2027 appropriations status NOT verified. **Primary content:** current edition July 2026 — PHSI **71.2**, **−2.3% m/m**, **−2.2% y/y**, all four regions down led by the West, "lowest level since January 2026"; Yun quoted "the highest mortgage rates of the year hit right in the middle of summer" and "pending contracts are 30% below their pre-pandemic 2019 level, while payroll employment is 5% above". NAR's own definition anchors the framing: PHSI "generally leads Existing-Home Sales by a month or two". **Corridor correction:** 12-09 and 12-17 BOTH report reference month **November** but different cohorts — 12-09 counts closings (contracts signed ~Sep–Oct), 12-17 counts November contracts — so the PHSI leads the editions from **2027-01-21** on, not the print eight days before it. `MORTGAGE30US` **6.71%** (2026-09-03); `HSN1F` **607k** (July). **NAR's redistribution restriction blocks any PHSI history** (which is why FRED carries no series), so this ledger registers **no content forward test**, exactly as its sibling did. **Adjacency sweep — peers:** n/a, `symbols: []`; builders read as a class and as a CONFOUND (ITB 93.91, XHB 103.25). **Macro:** 2026 FOMC decision days parsed fresh — 01-28, 03-18, 04-29, 06-17 (SEP), 07-29, 09-16 (SEP), 10-28, 12-09 (SEP); the December decision is 12-09, so this session carries no FOMC. **Volatility:** VIX **14.53** against a 2026 range of 14.25–31.05, median 17.48 — the calm end of its own year; baseline, nothing to diff yet. **Geopolitical:** PL 119-103 through 12-11 — see Leg 5. **Event tape:** no November consensus at D-102. **NO new dated event proposed, as a decision:** everything dated is already on the calendar or proposed by another lane; **two classes declined** — the routine 09-17/10-20/11-18 PHSI editions (not distinguishable; 09-17's date question is a forward test, cheaper than an event), and **LEN's/KBH's Q4 reports** (very likely adjacent per Leg 4, but **neither 2026 date is published** and a pattern is not a source — proposing an `estimate` off six years of history would fabricate provenance). **Blocked sources recorded in `probe-ref.blocked`:** the Wayback CDX API (**503**, "Internet Archive services are temporarily offline"), which is what capped Leg 3 at n=8, and FRED's series search (curl 56). **Three forward tests registered:** `-1` (August PHSI publishes 09-17, not 09-10 — which NAR surface governs), `-2` (ITB's 12-17 10:00-hour range below the 47.3% ordinary p75), `-3` (a builder files an 8-K Item 2.02 within a day of 12-17). | **Initial stance set: stand aside on every horizon; date promoted to `confirmed` on NAR's own calendar with the governing surface named and its conflicting sibling page registered as `-1`, the nowcast channel REFUTED structurally (six residential leaves, none pending-sales; 0 of 3,665 strings; the 12-17 vintage posts 08:30 before the 10:00 print), the tape REFUTED at the hour level with its session-level signal traced to builder-earnings collisions on 4 of 8 dates, and 12-17 reframed from "natural experiment" to "continuity asset" because only one of its two arms is measurable at all.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-pending-home-sales-2026-12-17.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
