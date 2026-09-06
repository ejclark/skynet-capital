# Existing-Home Sales (NAR, October 2026 data) — existing-home-sales-2026-11-12

**Kind:** macro-print · **Date:** 2026-11-12 (**confirmed**, `IR:` NAR's own 2026 Statistical News Release Schedule — nar.realtor/press-releases/nar-statistical-news-release-schedule, fetched direct 2026-09-06, "NOVEMBER | Thu., Nov. 12 | October Existing-Home Sales", plus its .docx twin published 2025-11; promoted this session from the `EST:` single-source proposal) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-summary-of-opinions-2026-11-10","cpi-2026-11-10","import-export-prices-2026-11-17","industrial-production-2026-11-17","msft-ignite-2026-11-17","mtis-2026-11-17","mts-october-2026-11-12","ppi-2026-11-13","retail-sales-2026-11-17","sifma-bond-market-closure-2026-11-11","us-china-tariff-truce-expiry-2026-11-10","wholesale-trade-2026-11-09"],"screenStreak":0,"blocked":[{"url":"https://query1.finance.yahoo.com/v1/test/getcrumb","status":"429","at":"2026-09-06"},{"url":"https://query2.finance.yahoo.com/v8/finance/chart/SPY","status":"429","at":"2026-09-06"},{"url":"https://stooq.com/q/d/l/?s=spy.us&i=d","status":"JS_CHALLENGE","at":"2026-09-06"},{"url":"https://www.atlantafed.org/-/media/documents/cqer/researchcq/gdpnow/GDPNowcastDataReleaseDates.xlsx","status":"404","at":"2026-09-06"},{"url":"https://www.bls.gov/schedule/news_release/cpi.htm","status":"403","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **The session is clean — and that is precisely why it is worth nothing to trade, because the
clean measurement already exists.** This edition was proposed as "the unconfounded control… the one
nearby session where an EHS print's own tape can be read at all," on the premise that the Atlanta Fed
schedules no vintage that day and *"GDPNow posts a vintage only on the release days it schedules."*
Three confound axes were tested and **all three clear** — the Fed's 2026 panel has **eight meetings and
none in November**, a session two trading days after CPI is if anything *narrower* (**ITB 1.705%** vs
**1.877%**, n=111, p=0.084), and the session after a bond-market-only holiday is baseline (1.784% vs
1.873%, n=20, p=0.69). So 11-12 really is clean. But both halves of *why it was said to matter* invert.
**The tape half is spent, not readable:** the unconfounded control has already been run **100 times** —
on the 100 **solo-vintage** EHS release days ITB reads **1.915%** against **1.863%** (p=**0.61**), XHB
1.728% vs 1.660% (p=0.49), SPY 0.897% vs 0.883% (p=0.84). **The nowcast half is present, not absent:**
`PostedUpdates` schedules **48** posting days over the window where the Fed's two workbooks overlap while
`ContribArchives` records **93** actually posted — **45 of 93 (48.4%)** never scheduled, **zero**
scheduled-but-unposted. **All 7** realized 2026 EHS dates got a vintage, **5 of 7 unscheduled**, **all 5
solo**. So 11-12 should carry the year's *cleanest* nowcast reading, not none. Date is now the
publisher's own and `confirmed`; the call is stand aside on every horizon.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-67) | **Stand aside** | High | `symbols: []` re-derived, not inherited, on **2,514** daily sessions (2016-09-06 → 2026-09-04): **114** EHS release days leave ITB (p=**0.58**), XHB (p=0.41) and SPY (p=0.72) at baseline, and the **100 solo** ones — the cleanest analogue to 11-12 — leave them at baseline too (ITB **1.915%** vs **1.863%**, p=**0.61**). A re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** housing hits. No instrument attaches on any date. | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-11-01** — none exists today |
| This week | **Stand aside — the next EHS print is 2026-09-10 and no ledger owns it** | High | NAR's own schedule puts August data on **Thu., Sep. 10, 10:00 ET**, four days out, and unlike 11-12 that one *is* on the Fed's forward schedule ("Wholesale trade, Producer Price Index, Existing-home sales") — a **shared** vintage, which reads nothing cleanly. Last published edition is **July 2026**: **4.06M** SAAR, **−1.7% m/m**, median price **$431,400**, supply **4.6** months. VIX **14.53**, SPY **770.19**, ITB **93.91** (2026-09-04 closes). | NAR moving or dropping the **2026-09-10** row from its own 2026 schedule before **2026-09-10** — the page and its .docx twin agreed on it today |
| This month | **Watch 2026-10-13 — it is the free rehearsal for this ledger's central claim, and costs nothing** | High | 10-13 (September data) carries the **identical status** to 11-12: on NAR's calendar, absent from the Fed's forward schedule. If a `ContribArchives` vintage dated 2026-10-13 appears naming existing-home sales alone, the refutation below is confirmed a month early on live data and 11-12's `-1` is near-settled before it registers. Free — one workbook re-pull at the next pulse, no position, no extra session. | **No** `ContribArchives` vintage dated **2026-10-13** existing by **2026-10-16** — that would make the proposing lane's premise right and this ledger's Leg 2 wrong |
| This quarter | **Read 11-12's solo nowcast line; the clean tape is a refusal, not an observation** | High | The readable thing is the **solo residential** vintage (class median \|Δ residential\| **0.0399pp**; \|Δ inventories\| **0.0001pp** with P(<0.10pp) = **100.0%**, 123/123 — a solo vintage needs no orthogonality argument because there is no co-release to be orthogonal to). The tape is clean and null at n=100, p=0.61. **The sibling's `>3.0%` ITB switch is not broken, it is unconditioned:** 3.0% clears **17.5%** of all sessions but only **5.0%** at **VIX ≤ 16** and **2.2%** of EHS days in that regime. Carry the regime with the number. | The **2026-11-12** vintage either not existing in `ContribArchives` by **2026-11-18**, or existing and naming a co-release alongside existing-home sales — either kills the solo-vintage reading this call rests on |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `symbols: []` is measured inert on 114 EHS days
  and on the 100 solo ones; no macro- or housing-keyed playbook exists. Research is not action.
- **The line to read is residential investment, and on 11-12 it should be readable alone.** Registered
  as `-1` and `-2`.
- **A "no scheduled vintage" note is not evidence of no vintage.** 48.4% of realized vintages were never
  scheduled, and zero scheduled dates went unposted. Registered as `-3`.
- **A kill switch without its volatility regime is not a test.** ITB >3.0% is **p95-class at VIX ≤ 16**
  (5.0%) and unremarkable above it (26.5%). Registered as `-4`, with the clause attached.
- **11-12 is clean, not bare.** Census Business Formation Statistics prints the same 10:00 minute and the
  October Monthly Treasury Statement lands the same day; neither is a homebuilder channel.
- **Do not read "confirmed" as licence.** The date is now the publisher's own; the call is unchanged.
- **Watch (dated)** — August data **09-10** (scheduled, shared) · FOMC **09-16** · September data
  **10-13** (the rehearsal) · FOMC **10-28** · jobs **11-06** · wholesale **11-09** · **CPI 11-10** ·
  bond market closed **11-11** · **this print 11-12** · **PPI 11-13** · the 11-17 stack (retail sales +
  inventories, IP, import/export prices, MTIS) · **11-18 08:30 housing starts (proposed here) and 10:00
  October PHSI, with FOMC minutes at 14:00** · November data **12-09** on the FOMC's SEP day.

## Initial research

### The question, plainly

This event reached the calendar as a single-sourced proposal from the `existing-home-sales-2026-12-09`
sweep, whose note is unusually specific about why it should exist:

> 11-12 is an ordinary Thursday with no FOMC meeting on the Fed's 2026 panel, so it is the one nearby
> session where an EHS print's own tape can be read at all… the Atlanta Fed's PostedUpdates does **not**
> name an existing-home-sales release on 2026-11-12 — GDPNow posts a vintage only on the release days it
> schedules, and 11-12 is not one — so this edition will have no same-day nowcast vintage to read, which
> is exactly what makes its TAPE the thing to measure.

Three questions fall out, and they are separable. **Does NAR's own calendar carry the date?** **Is the
session actually unconfounded, on axes somebody checked rather than asserted?** And — the two the
proposal answers in opposite directions — **is the tape the readable half, and is the nowcast really
absent?**

**One-line verdict:** the date is the publisher's own and the label is promoted to `confirmed`; the
session **is** clean on all three confound axes tested; and both halves of the framing invert anyway —
the nowcast reading is not absent but is the **cleanest of the year** (a solo vintage the Fed's forward
schedule simply does not pre-announce), while the tape is not the readable half but the **spent** one,
already measured null on 100 unconfounded instances.

**A note on provenance.** An earlier attempt on this branch (commit `d448e8d6`, 07:53 UTC the same day)
researched this event and pushed without opening a PR. Its confound-axis work and its diagnosis of the
sibling's kill switch were good and are **carried here, re-derived on this session's own bars rather
than copied** — Legs 3 and 6 below are its contributions with this session's numbers. Its central
claim — that the Fed schedules no vintage on 11-12 *and therefore none will post* — is the one Leg 2
refutes. Nothing of its evidence is discarded silently; what is dropped is named in *Honest limits*.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target; the
equity work below is a purpose-built read of daily bars. Seven inputs, all fetched direct on 2026-09-06:

1. **`nar.realtor/press-releases/nar-statistical-news-release-schedule`** (HTTP 200, 483,177 bytes) and
   its downloadable twin **`/sites/default/files/2025-11/2026-nar-statistical-news-release-schedule.docx`**
   (HTTP 200, 55,384 bytes, published 2025-11), unzipped and read as XML for the full year.
2. **`nar.realtor/research-and-statistics/housing-statistics/existing-home-sales`** (HTTP 200,
   588,410 bytes) — the current edition, the Yun quote and the next-release note.
3. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed) — `PostedUpdates`, **82 dated rows**
   2025-12-23 → 2026-12-23. *This is the forward **schedule**.*
4. **`GDPTrackingModelDataAndForecasts.xlsx`** — `ContribArchives`, **1,871 vintages 2014-05-01 →
   2026-07-28 = 1,822 same-quarter deltas**. *This is what actually **posted**.* The distinction between
   (3) and (4) is this ledger's central finding and was drawn by neither the sibling nor the earlier
   attempt.
5. **`federalreserve.gov/monetarypolicy/fomccalendars.htm`** (HTTP 200, 164,831 bytes) — the 2026 panel,
   parsed for Leg 3.
6. **`census.gov/economic-indicators/calendar-listview.html`** (HTTP 200, 91,396 bytes) — for the 11-18
   New Residential Construction row proposed below and the 11-12 Business Formation Statistics row.
7. **Nasdaq's historical-quote API**, SPY / ITB / XHB, **2,514 daily sessions 2016-09-06 → 2026-09-04**,
   with 20,000-iteration permutation tests on medians; **CBOE `VIX_History.csv`** for the VIX; **FRED**
   for `EXHOSLUSM495S`, `HOSINVUSM495N`, `HOSSUPUSM673N`, `MORTGAGE30US`.

**Collection notes, none substituted silently.** **Yahoo hard-429'd this runner for the whole session** —
six attempts with 8-second backoff, and the cookie+crumb handshake the sibling used never completed
because the crumb endpoint itself returned 429. **Stooq**, tried as a fallback, serves a JavaScript
proof-of-work challenge to a non-browser client. Both are recorded in `probe-ref.blocked`, and the
substitute is named in every number below: Nasdaq's API for bars, CBOE's own file for VIX. The
substitution is **cross-validated rather than asserted** — the closes reproduce the sibling ledger's
Yahoo pull exactly (**SPY 770.19, ITB 93.91, XHB 103.25**, and **VIX 14.53** on 2026-09-04). Separately,
**the Atlanta Fed media path every sibling ledger cites is now a 404**
(`/-/media/documents/cqer/researchcq/gdpnow/…`); the live path, taken from the GDPNow landing page's own
`href`, is `/-/media/Project/Atlanta/FRBA/Documents/cqer/researchcq/gdpnow/…`. The earlier attempt hit
the same 404 and a **`bls.gov` 403**; both are carried in `probe-ref.blocked`. Its FRED timeout is not —
FRED answered this session.

### Leg 1 — the date · **SUPPORTED**, and promoted to `confirmed`

NAR's 2026 table, on the page and in the .docx published November 2025, both read:

> **NOVEMBER** — Thu., Nov. 12 · **October Existing-Home Sales** · Wed., Nov. 18 · October Pending
> Home Sales Index

under the page's standing note *"All releases at 10 a.m. Eastern Time."* One path correction: the
`/newsroom/nar-statistical-news-release-schedule` URL the sibling ledgers cite now **308-redirects** to
`/press-releases/nar-statistical-news-release-schedule`. It resolves, so this is a citation update, not
a blocked source.

Two independent corroborations, one of them new. NAR's live statistics page separately states
*"Existing-Home Sales for August 2026 will be released on Thursday, September 10, 2026 at 10:00 a.m.
Eastern"* — the same schedule's September row. And the seven 2026 EHS dates the Atlanta Fed has
**actually posted vintages for** (01-14, 02-12, 03-10, 04-13, 05-11, 06-09, 07-09) match NAR's published
2026 calendar **7 for 7**. That second check is stronger than the sibling's version of it, because the
sibling read those dates out of free text and treated the match as validating the *calendar*; read the
other way round, it also validates the **archive as a same-day record of the release**, which is what
Leg 2 leans on.

**Status promoted `estimate` → `confirmed`, prefix `EST:` → `IR:`,** on exactly the precedent the sibling
used for 12-09 (`challenger-job-cuts-2026-09-03`: a private publisher's own release carried `IR:`).
Per the lane's hard limits a flip requires a primary source and this is one; per the date policy it still
licenses nothing.

### Leg 2 — "no scheduled vintage" ⇒ "no vintage" · **REFUTED**, and this is the ledger's central finding

Both the proposal and the earlier attempt on this branch rest on the premise that GDPNow posts vintages
only on the days its published schedule names. The Fed ships both artefacts, so the premise is directly
checkable. Over the window where they overlap (**2025-12-23 → 2026-07-28**):

| | count |
|---|---|
| Posting days **scheduled** in `PostedUpdates` | **48** |
| Vintage dates **actually posted** in `ContribArchives` | **93** |
| Realized vintages that were **never scheduled** | **45 (48.4%)** |
| Scheduled dates with **no** realized vintage | **0** |

The forward schedule is a **floor, never a ceiling** — it under-announces by roughly half, and has never
once over-announced. And on the specific class both earlier readings reasoned about, the gap is not
incidental, it is the rule:

| NAR 2026 EHS date | On the Fed's forward schedule? | Vintage actually posted? | Its `Data releases` text |
|---|---|---|---|
| 2026-01-14 | **yes** | yes | Retail trade, Producer Price Index, Existing-home sales |
| 2026-02-12 | no | **yes** | **Existing-home sales** (solo) |
| 2026-03-10 | no | **yes** | **Existing-home sales** (solo) |
| 2026-04-13 | no | **yes** | **Existing-home sales** (solo) |
| 2026-05-11 | no | **yes** | **Existing-home sales** (solo) |
| 2026-06-09 | **yes** | yes | International trade (Full report), Wholesale trade, Existing-home sales |
| 2026-07-09 | no | **yes** | **Existing-home sales** (solo) |
| 2026-08-11 → 2026-12-09 | 09-10 and 12-09 only | archive ends 2026-07-28 | — |

**Seven for seven.** Every 2026 EHS release got a vintage; **five of the seven were unscheduled; all five
of those were solo.** The two the schedule *does* name are precisely the two where EHS rides along with a
Census release the Fed announces for its own sake — which is the actual rule the schedule follows, and it
says nothing about whether a vintage posts.

So the correct expectation for 2026-11-12 is not "no nowcast to read." It is **a solo existing-home-sales
vintage, unannounced** — the same shape as 02-12, 03-10, 04-13, 05-11 and 07-09. Every downstream
statement built on the absence — "the tape is this edition's only observable," "October's residential
story reaches the nowcast only on 11-18" — falls with it. (The 11-18 housing-starts proposal survives on
its own merits, which are the *other* residential leaf and the same reference month, not exclusivity.)

### Leg 3 — is the session actually unconfounded? · **SUPPORTED** on all three axes tested

Carried from the earlier attempt and re-derived here. Three axes, each with a measurement rather than an
assertion:

1. **No FOMC.** The Fed's own 2026 panel, parsed from `fomccalendars.htm`, carries **eight** meetings —
   Jan 27-28, Mar 17-18\*, Apr 28-29, Jun 16-17\*, Jul 28-29, Sep 15-16\*, Oct 27-28, Dec 8-9\* — and
   **none in November**. The nearest are the Oct 27-28 decision (15 days before) and its minutes on
   11-18 (six days after).
2. **CPI proximity does not widen the session.** CPI lands 11-10, two trading days before. Across
   **111** sessions falling two trading days after a CPI vintage, ITB's median range is **1.705%**
   against an **1.877%** baseline — *narrower*, p=**0.084**. If the CPI corridor does anything to a
   homebuilder session two days later, it damps it.
3. **The bond-market holiday does not spill.** 11-11 is a SIFMA closure (Veterans Day, equities open).
   Across **20** such sessions 2016→, the holiday itself is measurably quieter (**1.341%**, p=**0.027**)
   and **the session after is exactly baseline** (**1.784%** vs 1.873%, p=**0.69**).

So the proposal's "clean session" claim is right, and now it is tested rather than asserted. What Leg 4
adds is that a clean session measuring nothing is still nothing.

One correction the axis work does *not* rescue: the proposal's corridor arithmetic. 11-12 is **three**
days after the 11-09 wholesale print (its note says six) and **six** days before the 11-18 October PHSI
(its note says four).

### Leg 4 — "the one session where the tape can be read" · **REFUTED**: it was already read, 100 times

Daily bars, **2016-09-06 → 2026-09-04** (2,514 sessions), median session range, permutation tests
against a baseline excluding all EHS release days:

| | EHS release days (n=114) | p | **Solo-vintage EHS days (n=100)** | **p** | Baseline (n=2,400) |
|---|---|---|---|---|---|
| **SPY** | 0.907% | 0.72 | **0.897%** | **0.84** | 0.883% |
| **ITB** | 1.916% | 0.58 | **1.915%** | **0.61** | 1.863% |
| **XHB** | 1.736% | 0.41 | **1.728%** | **0.49** | 1.660% |

Open-to-close absolute moves say the same and more bluntly — ITB **0.841%** on EHS days against
**0.857%** baseline, i.e. *narrower*. Tail behaviour agrees: only **1 of 114** EHS days exceeded ITB's
baseline p95 range (4.488%).

The middle column is the part nobody had run. A **solo-vintage EHS day** is the strongest available
operational definition of "an unconfounded existing-home-sales session" — the Atlanta Fed ingested
nothing else that day, so no other release in its input set printed. There are **100** of them, and the
homebuilder ETF is indistinguishable from an average Tuesday on every one of the three tests. **The
control 11-12 was proposed to provide has been run a hundred times, and it reads zero.** Watching it a
101st time is not new information; it is the base rate.

### Leg 5 — does the new NAR calendar crowd the print? · **MIXED**, and the weight is "no"

NAR moved its release calendar forward about ten days effective January 2026 — day-of-month median
**11** in 2026 against **21–22** across 2014–2021 — which parks EHS inside the CPI/PPI cluster. **6 of
the 7** 2026 EHS releases sit within three days of a CPI or PPI vintage, where only **19 of 140** did
archive-wide. Whether that crowding *does* anything is underpowered from both directions:

| ITB median session range | n | value | vs baseline |
|---|---|---|---|
| EHS days within **±2 days** of a CPI **or PPI** vintage | 11 | 2.268% | p=0.20 (XHB 2.290%, p=**0.045**) |
| EHS days isolated from both | 103 | 1.913% | — |
| **Sessions exactly 2 trading days after CPI** (Leg 3, the 11-12 shape) | **111** | **1.705%** | **p=0.084, narrower** |
| 2026 EHS days only | 7 | 2.513% | p=0.12 vs 1.910% pre-2026 |

The one 5%-clearing cell is XHB on **n=11**, one of three simultaneous tests, and it is contradicted by
the far better-powered n=111 cut pointing the other way. Graded MIXED, and read as: **there is no
evidence the corridor widens 11-12, and some that it narrows it.** The one 2026 EHS day that was
genuinely isolated — **07-09** — printed **1.87%**, the year's narrowest.

What survives is descriptive, and it is enough to retire the phrase "ordinary Thursday": 11-12 carries
CPI two days before, PPI the day after, the October Monthly Treasury Statement and Census **Business
Formation Statistics** (10:00 ET, October data, release code **A202611121000** — the same minute as this
print) in-session, and a bond-market holiday the day before. Clean on the axes that were tested; not
empty.

### Leg 6 — the sibling's ITB kill switch · **MIXED**, and it needs a clause, not a retirement

The 12-09 ledger's third kill switch reads: *"ITB's session range on any EHS release day between now and
12-09 exceeds 3.0%… with no FOMC, CPI or jobs print that session,"* naming 09-10, 10-13 and **11-12** as
the dated chances to observe it. Because 11-12 is one of the three, this ledger owes the threshold a
check. Unconditionally it fails one:

| ITB session range > 3.0% | rate |
|---|---|
| All EHS release days | **18 / 114 (15.8%)** |
| Solo-vintage EHS days | 17 / 100 (17.0%) |
| **All sessions 2016-09-06 → 2026-09-04** | **441 / 2,514 (17.5%)** |

A trigger that fires on EHS days at 15.8% against an unconditional 17.5% cannot falsify inertness — it
fires slightly *less* often on the class it was written to test. But the earlier attempt on this branch
found the reason, and it is the better diagnosis: **the switch is not broken, it is unconditioned.**
Splitting the same 2,514 sessions by that day's VIX close:

| ITB session range > 3.0% | rate |
|---|---|
| Sessions at **VIX ≤ 16** | **53 / 1,051 (5.0%)** |
| Sessions at VIX > 16 | 388 / 1,463 (26.5%) |
| **EHS release days at VIX ≤ 16** | **1 / 45 (2.2%)** |
| Solo-vintage EHS days at VIX ≤ 16 | 1 / 42 (2.4%) |

So 3.0% is a **p95-class event in today's VIX-14.53 regime** and an unremarkable one above VIX 16. The
switch's false-positive history is entirely the stressed regime: of the 18 EHS days that cleared 3.0%,
five are 2020 and five are 2022, and the most recent is **2026-06-09 at 3.72%** — a triple-release day
with CPI the following morning. For scale, ITB's median range over the last 20 sessions is **1.808%**.

**The fix is a clause, not a deletion:** *ITB > 3.0% on a clean EHS day **with VIX ≤ 16 that session***
is a genuine ~2% tail test, and that is the form this ledger registers as `-4`. Handed back to the
sibling as an amendment to its own kill switch rather than a contradiction of it.

### Primary content read — what the last published edition says

NAR's statistics page, current edition **July 2026 data**, released **August 11, 2026**: existing-home
sales **−1.7% m/m**, median sales price **$431,400**, inventory at a **4.6-month supply**; month over
month sales rose in the Northeast, were steady in the West and declined in the Midwest and South. Chief
Economist Lawrence Yun, verbatim: *"Home sales have been remarkably stable, even amid the rising mortgage
rate environment of the past few months… Year-to-date sales are up 2.4% and there's no doubt that the
housing market would be thriving if average mortgage rates were to return near 6%."*

FRED, fetched the same day: `EXHOSLUSM495S` **4.06M** SAAR for July, from 4.19M (May) and 4.13M (June);
`HOSINVUSM495N` inventory **1.54M** NSA, off a 1.57M May–June plateau; `HOSSUPUSM673N` months' supply
**4.6**, up from **3.5** in December 2025 and **3.8** in January 2026 — supply loosening steadily while
sales flatten. `MORTGAGE30US` **6.71%** on 2026-09-03, the highest of the last eight weekly readings
(6.55 → 6.58 → 6.66 → 6.69 → 6.67 → 6.65 → 6.66 → 6.71).

**A limit that shapes every content statement here**, and it is the sibling's limit unchanged: FRED
carries only **13 months** of `EXHOSLUSM495S` (2025-07 → 2026-07) because NAR licenses the series and
restricts redistribution. The inventory and months'-supply series are truncated the same way. **This
ledger therefore registers no content-side forward test** — there is no measured base rate to register
one against, and a pre-scored guess is worse than a refusal. Stated again rather than inherited, because
this session re-checked it rather than taking it on faith.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`. The homebuilder names were read as a *class* (Legs 4, 5 and 6),
  not as holdings: ITB **93.91**, XHB **103.25**, SPY **770.19** (2026-09-04 closes, Nasdaq API; they
  reproduce the sibling's Yahoo pull exactly).
- **Macro surprises** — none since the last row; there is no last row. Ahead of this print: jobs 11-06,
  wholesale 11-09, **CPI 11-10**; behind it: **PPI 11-13** and the 11-17 stack.
- **Volatility regime** — **VIX 14.53** (2026-09-04, CBOE `VIX_History.csv`, matching the sibling's
  reading from a different source). The week ran 14.51 → 14.43 → 14.92 → **16.34** → 15.20 → 14.32 →
  14.53, so the 09-01 spike has fully retraced. This is load-bearing for Leg 6 rather than colour: at
  VIX ≤ 16 the sibling's 3.0% trigger is a 5.0% event. Baseline reading; nothing to diff against yet.
- **Geopolitical / policy** — **`us-china-tariff-truce-expiry-2026-11-10`** sits two days before this
  print and is the corridor's live tail risk; it is `estimate`/high-impact and belongs to its own lane.
  **This print is a NAR release, not a federal one**, so no US funding-cliff mechanism reaches it.
  APEC leaders' summit 11-18. No channel to a series with no symbols.
- **Event tape** — no October consensus exists at D-67 and none will before the **09-10** August edition
  and the **10-13** September edition set the base. Every October-content statement here is a base rate,
  never a forecast.
- **One dated event proposed in this PR**, its own file owned by this lane:
  **`housing-starts-2026-11-18`** (Census `A202611180830`, 08:30 ET, October data; corroborated by the
  Fed's `PostedUpdates` 2026-11-18 row "Housing starts"). It earns a row as the residential node's
  *other* leaf — `SplicedNewHousingConstruction` → `FRSPX_USNAqtr` ("Permanent-site") against this
  print's `valExHomeSales` → `FRSBKX_USNAqtr` ("Brokerage commissions") — carrying the **same reference
  month** six days later. Note the proposal carries forward: whether a 14:00 **minutes** release
  compresses the morning the way a 14:00 SEP decision does is **unmeasured**, and its own initial
  research should test it. Its December twin `housing-starts-2026-12-17` is already on the calendar.
- **Three classes considered and DECLINED**, so their absence reads as a decision. (i) **Census Business
  Formation Statistics 2026-11-12** — same session, same minute, primary-sourced, and genuinely
  interesting as corridor colour, but it has no GDPNow channel and no house playbook, so a row buys no
  decision. (ii) **October PHSI 2026-11-18** — the sibling declined the routine PHSI class on the record
  and nothing found here distinguishes the October edition; sharing a session with FOMC minutes is a
  property of 11-18, which the housing-starts proposal already puts on the calendar. (iii)
  **EHS 2026-10-13** — a routine monthly edition. It matters to *this* ledger (it is the rehearsal named
  in the month horizon) but the thing worth watching is a workbook re-pull at the next pulse, not a
  calendar row; an edition earns a row when it is distinguishable, and being the previous one is not.

### Honest limits

- **The scheduled-vs-realized gap is measured on one overlapping window.** `PostedUpdates` as shipped
  covers 2025-12-23 → 2026-12-23, so the 48-vs-93 comparison is 2025-12-23 → 2026-07-28 — about seven
  months. It is a strong effect (48.4%, with zero counter-examples in the other direction), but it is one
  regime; `-3` registers the generalisation rather than assuming it.
- **"Solo" is read from free text.** The composition split rests on a `Data releases` column whose
  spellings drift across a decade; mine (123/17) differs from the sibling's (109/31) precisely because
  the classifiers differ — mine requires the whole comma-split field to be the one release. The
  substantive readings agree under both, and the release-date join every other number rests on does not
  depend on the classifier at all.
- **The archive is what GDPNow chose to name.** Any EHS release that coincided with no posting day is
  invisible to it, so Leg 4's 140 dates are a sample. The 2026 rows in Leg 2 are a census only because
  NAR's calendar supplied the denominator independently.
- **The bars are a substitute source, cross-validated but not the sibling's.** Yahoo 429'd all session;
  Nasdaq's API caps at 2,514 rows, so the daily study starts 2016-09-06 rather than 2016-01-01 and runs
  114 EHS days against the sibling's 122. No **hourly** source was reachable, so this session did not
  re-derive the 10:00-hour work and does not claim to — the sibling's Leg 5 stands on its own bars.
  **Two forward tests the earlier attempt registered were dropped for exactly this reason**: both keyed
  on the 10:00-hour share, and a test this lane can neither derive now nor score at close-out is not a
  test.
- **Legs 3 and 5 are underpowered in places and say so.** The bond-holiday axis is n=20 and the
  crowded-corridor cut is n=11; only the CPI+2 cut (n=111) and the EHS-class cuts (n=100/114) carry
  real weight. What Leg 5 *does* settle needs no power: it is descriptive.
- **Leg 6's conditioning is one variable at one threshold.** VIX ≤ 16 and 3.0% are both round numbers
  chosen to match the switch being amended, not optimised. The direction is not in doubt (5.0% against
  26.5% is a factor of five); the exact cut is.
- **All the nowcast work measures a model, not a market.** Every Δ describes the Atlanta Fed's estimate
  of GDP. The only price claims here are session-class studies, and all of them are reasons *not* to act.
- **`ContribArchives` ends 2026-07-28** and carries no Q4-2026 vintage, so the class priors behind `-2`
  are out-of-sample for the quarter being nowcast.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date is `confirmed`, promoted this session on the publisher's own calendar).** Stand aside on
2026-11-12 and on every edition of this report. Hold four frames. **On the date:** it is NAR's own,
published in November 2025, corroborated by the live statistics page and by a 7-for-7 match against the
vintages the Atlanta Fed actually posted; the citation path moved to `/press-releases/`. **On the
session:** it genuinely is clean — no FOMC in November on the Fed's own eight-meeting 2026 panel, a
CPI+2 session that is if anything narrower (p=0.084, n=111), and a post-bond-holiday session at baseline
(p=0.69, n=20) — so the control label is earned rather than asserted. **On the nowcast — the reason this
ledger exists:** the premise that GDPNow posts only on scheduled days is refuted (48 scheduled against 93
realized; 45 of 93 unscheduled; zero scheduled-but-unposted), and on this class every one of the seven
realized 2026 EHS dates got a vintage with five of seven unscheduled and all five solo — so 11-12 should
carry a **solo** existing-home-sales vintage, more attributable than the December edition's shared one,
not absent. Read that residential line. **On the tape:** clean and spent are not the same thing — 100
solo EHS release days leave ITB at 1.915% against 1.863% (p=0.61), so the control has already been run,
and the sibling's `>3.0%` ITB trigger needs the clause **VIX ≤ 16** to be a test at all (5.0% of sessions
in that regime against 26.5% above it). Nothing here licenses an entry, and there is no instrument to
enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **No `ContribArchives` vintage dated 2026-10-13 exists by 2026-10-16.** That is the free rehearsal:
  10-13 is on NAR's calendar and off the Fed's forward schedule, exactly like 11-12. Its absence would
  mean the premise Leg 2 refutes is right after all, a month before it matters.
- **A vintage dated 2026-11-12 posts and names a co-release alongside existing-home sales.** The solo
  reading — the basis for calling this the cleanest nowcast of the year — fails, and 11-12 becomes a
  shared vintage to be decomposed like 12-09 rather than read directly.
- **The 2026-11-12 vintage moves the Q4-2026 residential-investment contribution by ≥0.30pp.** Far past
  anything in the 140-vintage class; the commissions leaf would be carrying information the size of a
  real component surprise, and this print would acquire a reading worth waiting for.
- **ITB's session range on 2026-11-12 exceeds 3.0% with VIX ≤ 16 that session.** The amended form of the
  sibling's switch, and a ~2% tail event (1 of 45 EHS days in that regime). Inertness would be falsified
  on the one date built to test it. Registered as `-4`.
- **NAR moves, delays or restructures the 2026-11-12 release on its own schedule.** The `confirmed` label
  reverts to `estimate` and Leg 1 is re-derived; the schedule page and its .docx are the two places that
  would show it.
- **A macro- or housing-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-11-01.**
  The stand-aside is partly an absence-of-instrument argument; a housing-keyed playbook makes it a live
  question rather than a settled one.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-existing-home-sales-2026-11-12-1` — a **GDPNow vintage dated 2026-11-12 exists** in
  `ContribArchives` and its `Data releases` text **names existing-home sales alone**. Score by 2026-11-18.
- `FT-existing-home-sales-2026-11-12-2` — the **2026-11-12 vintage, or the next one after it if none
  posts**, moves the Q4-2026 **change-in-inventory-investment** contribution by **<0.10pp**. Score by
  2026-11-18.
- `FT-existing-home-sales-2026-11-12-3` — over **2026-09-07 → 2026-11-12**, `ContribArchives` records
  **strictly more** distinct vintage dates than the **16** `PostedUpdates` schedules for that span.
  Score by 2026-11-18.
- `FT-existing-home-sales-2026-11-12-4` — **ITB's 2026-11-12 session range stays below 3.0%** on a
  session whose **VIX close is ≤ 16** — the sibling's kill switch with the regime clause it was missing.
  Score by 2026-11-18.

No content forward test is registered (FRED's 13-month NAR-licensed window leaves no base rate), and no
**hourly** test is registered (no hourly bar source was reachable, so this lane could neither derive nor
score one) — both refusals argued above.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-67 | **Initial research on an id that existed only as a proposal. The session is clean on all three confound axes tested — and both halves of the reason it was proposed still invert: the nowcast reading is not absent but the cleanest of the year, and the tape is not the readable half but the spent one.** Canonical `src/domain/market-events/existing-home-sales-2026-11-12.json` written this session after reading the single proposal (`from-existing-home-sales-2026-12-09`), now shadowed. **Provenance:** an earlier attempt on this branch (`d448e8d6`, 07:53 UTC) researched this event and pushed without opening a PR; its confound-axis work and its kill-switch diagnosis are carried here **re-derived on this session's own bars**, its premise is what Leg 2 refutes, and the two hourly-keyed forward tests it registered are dropped with the reason stated. **Leg 1 — the date:** NAR's own 2026 schedule (HTTP 200, 483,177 bytes; the `/newsroom/` path now **308-redirects** to `/press-releases/`) and its `.docx` twin published **2025-11** (55,384 bytes) both read "NOVEMBER \| Thu., Nov. 12 \| **October** Existing-Home Sales" under "All releases at 10 a.m. Eastern Time". Status `estimate`→**`confirmed`**, prefix `EST:`→**`IR:`**, on the `challenger-job-cuts-2026-09-03` precedent. Corroborated by NAR's live page naming the next edition 2026-09-10, and by the seven 2026 EHS dates the Fed has actually posted vintages for matching NAR's calendar **7/7**. **Leg 2 — the central finding, and it kills a premise both the proposal and the earlier attempt shared:** over the two workbooks' overlapping window (**2025-12-23 → 2026-07-28**) `PostedUpdates` schedules **48** posting days while `ContribArchives` records **93** posted — **45/93 (48.4%) unscheduled, 0 scheduled-but-unposted**. The forward schedule is a floor, never a ceiling. On this class: **all 7** realized 2026 EHS dates got a vintage, **5/7 unscheduled** (02-12, 03-10, 04-13, 05-11, 07-09), **all 5 named "Existing-home sales" alone**; the 2 that were scheduled (01-14, 06-09) are the 2 where EHS rides a Census release. **Expect 11-12 to post a SOLO EHS vintage, unannounced** — so "October's residential story reaches the nowcast only on 11-18" is withdrawn. **Leg 3 — the session IS clean, tested not asserted** (carried from `d448e8d6`, re-derived): the Fed's own 2026 panel has **eight** meetings (Jan 27-28, Mar 17-18\*, Apr 28-29, Jun 16-17\*, Jul 28-29, Sep 15-16\*, Oct 27-28, Dec 8-9\*) and **none in November**; **111** sessions two trading days after a CPI vintage give ITB **1.705%** vs an **1.877%** baseline — *narrower*, p=**0.084**; the **20** SIFMA bond-only closures give a quieter holiday session (**1.341%**, p=**0.027**) and a **baseline** next session (**1.784%** vs 1.873%, p=**0.69**). **Leg 4 — the tape, and the control is already spent:** Nasdaq API daily bars, **2,514 sessions 2016-09-06 → 2026-09-04** (Yahoo hard-429'd all session — 6 attempts, the crumb endpoint itself 429'd; stooq serves a JS proof-of-work challenge; both in `probe-ref.blocked`, and the substitute closes reproduce the sibling's Yahoo pull **exactly**: SPY **770.19**, ITB **93.91**, XHB **103.25**, VIX **14.53** from CBOE). Median session range vs a 2,400-session baseline excluding EHS days: **all 114 EHS days** SPY 0.907% (p=0.72), ITB 1.916% (p=0.58), XHB 1.736% (p=0.41); **the 100 SOLO-vintage EHS days — the unconfounded control this event was proposed to supply — SPY 0.897% (p=0.84), ITB 1.915% (p=0.61), XHB 1.728% (p=0.49)**. ITB open→close is *narrower* on EHS days (0.841% vs 0.857%) and only **1/114** cleared ITB's baseline p95 (4.488%). **The control has been run 100 times and reads zero.** **Leg 5 — the new NAR window crowds the calendar but not the tape:** the day-9–14 move (2026 day-of-month median **11** vs **21–22** in 2014–2021) puts **6 of 7** 2026 EHS days within 3 days of a CPI or PPI vintage against **19 of 140** archive-wide. Effect is MIXED and the weight says no: crowded n=11 ITB 2.268% (p=0.20), XHB 2.290% (p=**0.045**, one cell of three at n=11); 2026-only ITB 2.513% vs 1.910% (p=0.12); against the far better-powered CPI+2 cut at n=111 pointing *narrower*. The one isolated 2026 EHS day, **07-09**, printed the year's narrowest ITB range (**1.87%**). Descriptively 11-12 is clean but not bare — **CPI 11-10**, **PPI 11-13**, October MTS and Census **Business Formation Statistics** (`A202611121000`, 10:00, same minute), **11-11 a SIFMA bond-market closure**. **Two arithmetic corrections to the proposal:** 11-12 is **3** days after the 11-09 wholesale print (it says six) and **6** days before the 11-18 PHSI (it says four). **Leg 6 — the sibling's ITB kill switch needs a clause, not a retirement** (the earlier attempt's diagnosis, re-derived and adopted over this session's own first reading): unconditionally `>3.0%` fires **18/114 (15.8%)** on EHS days against **441/2,514 (17.5%)** on all sessions — useless as stated. Conditioned on VIX it becomes a real test: **53/1,051 (5.0%) at VIX ≤ 16** against **388/1,463 (26.5%) above it**, and **1/45 (2.2%)** on EHS days at VIX ≤ 16. The 18 clear-throughs cluster in 2020 (5) and 2022 (5); latest **2026-06-09 at 3.72%**, a triple-release day. ITB's last-20-session median range is **1.808%** and VIX is **14.53**, so the amended switch is a ~2% tail today. **Handed back to the sibling as an amendment.** **Collection corrections:** the Atlanta Fed media path every sibling ledger cites (`/-/media/documents/cqer/…`) now **404s**; the live path from the GDPNow page's own href is `/-/media/Project/Atlanta/FRBA/Documents/cqer/…`. **Primary content:** current edition **July 2026** (released 08-11) — **−1.7% m/m**, median price **$431,400**, supply **4.6 months**; Northeast up, West steady, Midwest and South down; Yun quoted "remarkably stable… year-to-date sales are up 2.4%… thriving if average mortgage rates were to return near 6%". FRED: `EXHOSLUSM495S` **4.06M** SAAR, `HOSINVUSM495N` **1.54M** NSA, `HOSSUPUSM673N` **4.6** (from 3.5 in Dec-25), `MORTGAGE30US` **6.71%** (2026-09-03, an 8-week high). **FRED carries only 13 months of the NAR-licensed series**, so **no content forward test** — the sibling's refusal, re-checked rather than inherited. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** jobs 11-06, wholesale 11-09, CPI 11-10 ahead; PPI 11-13 and the 11-17 stack behind. **Volatility:** VIX **14.53**; the week ran 14.51/14.43/14.92/16.34/15.20/14.32/14.53 — the 09-01 spike fully retraced. Load-bearing for Leg 6, not colour. **Geopolitical:** `us-china-tariff-truce-expiry-2026-11-10` is the corridor's live tail risk two days out, its own lane's file; **this is a NAR release, so no federal funding mechanism reaches it**. **Event tape:** no October consensus at D-67; 09-10 and 10-13 set the base first. **One dated event proposed** (own file, `estimate`): **`housing-starts-2026-11-18`** (Census `A202611180830`, 08:30, October data; Fed `PostedUpdates` 2026-11-18 "Housing starts") — the residential node's *other* leaf (`SplicedNewHousingConstruction`→`FRSPX_USNAqtr` "Permanent-site" against this print's `valExHomeSales`→`FRSBKX_USNAqtr` "Brokerage commissions"), same reference month, six days later, with the unmeasured 14:00-minutes-compression question left open for its own research. **Three classes declined on the record:** Business Formation Statistics 11-12 (same minute, no GDPNow channel, no decision bought), October PHSI 11-18 (the sibling declined the routine PHSI class and nothing here distinguishes it), EHS 10-13 (routine — it is this ledger's rehearsal, watched via a workbook re-pull, not a calendar row). **Four forward tests registered**, all scoreable from one workbook re-pull plus one day of bars: `-1` (a 2026-11-12 vintage exists and names EHS alone; base 7/7 with 5/7 unscheduled), `-2` (that vintage, or the next if none posts, moves inventories <0.10pp; base 123/123 solo), `-3` (realized vintage dates 09-07→11-12 exceed the 16 scheduled; base 93 vs 48), `-4` (ITB range <3.0% at VIX ≤ 16; base 95.0% of sessions, 97.8% of EHS days in that regime). Two hourly-keyed tests from the superseded attempt were **dropped**, with the reason on the record: no hourly bar source was reachable, so this lane could neither derive nor score them. | **Initial stance set: stand aside on every horizon; date promoted to `confirmed` on NAR's own calendar, the session's cleanliness CONFIRMED on all three confound axes tested (no November FOMC, CPI+2 narrower at p=0.084, post-bond-holiday at baseline p=0.69), the proposing lane's "no vintage will post" premise REFUTED (48 scheduled vs 93 realized; 7/7 of 2026's EHS dates posted, 5/7 unscheduled and all 5 solo) so 11-12 is expected to carry the year's cleanest SOLO residential vintage, the "readable tape" framing REFUTED because the unconfounded control already exists at n=100 with ITB p=0.61, and the sibling's 3.0% ITB kill switch amended rather than retired — it is a 17.5%-unconditional coin toss but a 5.0% event at VIX ≤ 16, so it is carried here with that clause and registered as `-4`.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-existing-home-sales-2026-11-12.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
