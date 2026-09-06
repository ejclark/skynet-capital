# Existing-Home Sales (NAR, October 2026 data) — existing-home-sales-2026-11-12

**Kind:** macro-print · **Date:** 2026-11-12 (**confirmed**, `IR:` NAR's own 2026 Statistical News Release Schedule — nar.realtor/press-releases/nar-statistical-news-release-schedule, fetched direct 2026-09-06, "NOVEMBER | Thu., Nov. 12 | October Existing-Home Sales", plus its .docx twin published 2025-11; promoted this session from the `EST:` single-source proposal) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-summary-of-opinions-2026-11-10","cpi-2026-11-10","import-export-prices-2026-11-17","industrial-production-2026-11-17","msft-ignite-2026-11-17","mtis-2026-11-17","mts-october-2026-11-12","ppi-2026-11-13","retail-sales-2026-11-17","sifma-bond-market-closure-2026-11-11","us-china-tariff-truce-expiry-2026-11-10","wholesale-trade-2026-11-09"],"screenStreak":0,"blocked":[{"url":"https://query1.finance.yahoo.com/v1/test/getcrumb","status":"429","at":"2026-09-06"},{"url":"https://query2.finance.yahoo.com/v8/finance/chart/SPY","status":"429","at":"2026-09-06"},{"url":"https://www.atlantafed.org/-/media/documents/cqer/researchcq/gdpnow/GDPNowcastDataReleaseDates.xlsx","status":"404","at":"2026-09-06"},{"url":"https://stooq.com/q/d/l/?s=spy.us&i=d","status":"JS_CHALLENGE","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **This event was proposed for its tape and its missing nowcast. Both halves are backwards.**
The proposing lane filed 11-12 as "the unconfounded control… the one nearby session where an EHS print's
own tape can be read at all," on the premise that the Atlanta Fed schedules no vintage that day and
*"GDPNow posts a vintage only on the release days it schedules."* That premise is false from the Fed's own
two workbooks: over their overlapping window **PostedUpdates schedules 48 posting days while
ContribArchives records 93 actually posted** — **45 of 93 (48.4%)** realized vintages were never
scheduled, and **zero** scheduled dates went unposted. On this exact class the pattern is not
approximate: **all 7** realized 2026 EHS release dates got a vintage, **5 of the 7 were unscheduled**, and
**every one of those 5 named "Existing-home sales" alone**. So 11-12's likely reading is a **solo** EHS
vintage — the most attributable kind there is (**123 of 140** EHS-naming vintages are solo; a solo one has
moved change-in-inventory-investment under 0.10pp **123 times out of 123**) — which is *cleaner* than the
shared 12-09 vintage, not absent. And the tape it was proposed to supply has **already been run 100 times
unconfounded**: on the **100 solo EHS release days** ITB reads **1.915%** median session range against
**1.863%** baseline (p=**0.61**), XHB 1.728% vs 1.660% (p=0.49), SPY 0.897% vs 0.883% (p=0.84). The control
is spent. The date is now the publisher's own and `confirmed`; the call is stand aside on every horizon.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-67) | **Stand aside** | High | `symbols: []` re-derived independently this session on **2,514** daily sessions (2016-09-06 → 2026-09-04, Nasdaq API after Yahoo hard-429'd): **114** EHS release days leave ITB (p=**0.58**), XHB (p=0.41) and SPY (p=0.72) at baseline, and the **100 solo** ones — the closest analogue to 11-12 — leave them at baseline too (ITB p=**0.61**). A re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** housing hits. No instrument attaches on any date. | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-11-01** — none exists today |
| This week | **Stand aside — the next EHS print is 2026-09-10 and no ledger owns it** | High | NAR's own schedule puts August data on **Thu., Sep. 10, 10:00 ET**, four days out, and unlike 11-12 that one *is* on the Fed's forward schedule ("Wholesale trade, Producer Price Index, Existing-home sales") — so it is a **shared** vintage and reads nothing cleanly. Last published edition is **July 2026**: **4.06M** SAAR, **−1.7% m/m**, median price **$431,400**, supply **4.6** months. VIX **14.53**, SPY **770.19**, ITB **93.91** (2026-09-04 closes). | NAR moving or dropping the **2026-09-10** row from its own 2026 schedule before **2026-09-10** — the page and its .docx twin agreed on it today |
| This month | **Watch 2026-10-13 — it is the free rehearsal for this ledger's central claim, and costs nothing** | High | 10-13 (September data) carries the **identical status** to 11-12: on NAR's calendar, absent from the Fed's forward schedule. If a ContribArchives vintage dated 2026-10-13 appears naming existing-home sales alone, the refutation below is confirmed a month early on live data and 11-12's `-1` is near-settled before it registers. Free — one workbook re-pull, no position, no session cost beyond the next pulse. | **No** ContribArchives vintage dated **2026-10-13** existing by **2026-10-16** — that would make the proposing lane's premise right and this ledger's leg 2 wrong |
| This quarter | **Read 11-12's nowcast line, never its tape — and do not call the session unconfounded** | High | The readable thing is the **solo residential** vintage (class median \|Δ residential\| **0.0399pp**, \|Δ inventories\| **0.0001pp** with P(<0.10pp) = **100.0%**, 123/123). The tape is not: the control is spent at n=100, p=0.61. And 11-12 is not an ordinary Thursday — **CPI 11-10 (D-2)**, **PPI 11-13 (D+1)**, MTS and Census Business Formation Statistics same session, **11-11 a SIFMA bond-market closure**. **6 of 7** 2026 EHS days sit within 3 days of a CPI or PPI vintage; the one that did not (07-09) printed the year's narrowest ITB range (**1.87%**). | The **2026-11-12** vintage either not existing in ContribArchives by **2026-11-18**, or existing and naming a co-release alongside existing-home sales — either kills the solo-vintage reading this quarter's call rests on |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `symbols: []` is measured inert on 114 EHS days
  and on the 100 solo ones; no macro- or housing-keyed playbook exists. Research is not action.
- **The line to read is residential investment, and on 11-12 it should be readable alone.** Registered
  as `-1` and `-2`.
- **A "no scheduled vintage" note is not evidence of no vintage.** 48.4% of realized vintages were never
  scheduled. Registered as `-3`.
- **The sibling's ITB kill switch is not a falsifier — hand it back.** `>3.0%` on an EHS day fires at
  **15.8%** (18/114) against an **unconditional 17.5%** (441/2,514). It measures the volatility regime,
  not the print. This ledger registers no tape test in its place, deliberately.
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

Two claims, both load-bearing, and they point in opposite directions from each other: **the tape is the
readable half, the nowcast is absent.** **Does NAR's own calendar carry the date, and do either of those
two claims survive contact with the Fed's own workbooks and ten years of bars?**

**One-line verdict:** the date is the publisher's own and the label is promoted to `confirmed`; and both
halves of the framing invert — the nowcast reading is not absent but is the **cleanest of the year**
(a solo vintage the Fed's forward schedule simply does not pre-announce), while the tape is not the
readable half but the **spent** one, having already been measured null on 100 unconfounded instances.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target; the equity
work below is a purpose-built read of daily bars. Six inputs, all fetched direct on 2026-09-06:

1. **`nar.realtor/press-releases/nar-statistical-news-release-schedule`** (HTTP 200, 483,177 bytes) and
   its downloadable twin **`/sites/default/files/2025-11/2026-nar-statistical-news-release-schedule.docx`**
   (HTTP 200, 55,384 bytes, published 2025-11), unzipped and read as XML for the full year.
2. **`nar.realtor/research-and-statistics/housing-statistics/existing-home-sales`** (HTTP 200,
   588,410 bytes) — the current edition, the Yun quote and the next-release note.
3. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed) — `PostedUpdates`, **82 dated rows**
   2025-12-23 → 2026-12-23. *This is the forward **schedule**.*
4. **`GDPTrackingModelDataAndForecasts.xlsx`** — `ContribArchives`, **1,871 vintages 2014-05-01 →
   2026-07-28 = 1,822 same-quarter deltas**. *This is what actually **posted**.* The distinction between
   (3) and (4) is this ledger's central finding and was not drawn by either sibling.
5. **`census.gov/economic-indicators/calendar-listview.html`** (HTTP 200, 91,396 bytes) — for the 11-18
   New Residential Construction row proposed below and the 11-12 Business Formation Statistics row.
6. **Nasdaq's historical-quote API**, SPY / ITB / XHB, **2,514 daily sessions 2016-09-06 → 2026-09-04**,
   with 20,000-iteration permutation tests on medians; **CBOE `VIX_History.csv`** for the VIX; **FRED**
   for `EXHOSLUSM495S`, `HOSINVUSM495N`, `HOSSUPUSM673N`, `MORTGAGE30US`.

**Three collection notes, none silently substituted.** **Yahoo hard-429'd this runner for the whole
session** — six attempts with 8-second backoff, and the cookie+crumb handshake the sibling used never
completed because the crumb endpoint itself returned 429. **Stooq**, tried as a fallback, serves a
JavaScript proof-of-work challenge to a non-browser client. Both are recorded in `probe-ref.blocked`, and
the substitute is named in every number below: Nasdaq's API for bars, CBOE's own file for VIX. The
substitution is **cross-validated rather than asserted** — the closes reproduce the sibling ledger's
Yahoo pull exactly (**SPY 770.19, ITB 93.91, XHB 103.25**, and **VIX 14.53** on 2026-09-04). Separately,
**the Atlanta Fed media path both sibling ledgers cite is now a 404**
(`/-/media/documents/cqer/researchcq/gdpnow/…`); the live path, taken from the GDPNow landing page's own
`href`, is `/-/media/Project/Atlanta/FRBA/Documents/cqer/researchcq/gdpnow/…`. Recorded, not worked
around silently.

### Leg 1 — the date · **SUPPORTED**, and promoted to `confirmed`

NAR's 2026 table, on the page and in the .docx published November 2025, both read:

> **NOVEMBER** — Thu., Nov. 12 · **October Existing-Home Sales** · Wed., Nov. 18 · October Pending
> Home Sales Index

under the page's standing note *"All releases at 10 a.m. Eastern Time."* One path correction: the
`/newsroom/nar-statistical-news-release-schedule` URL the sibling ledgers cite now **308-redirects** to
`/press-releases/nar-statistical-news-release-schedule`. It resolves, so this is a citation update, not a
blocked source.

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

The proposing lane's premise is that GDPNow posts vintages only on the days its published schedule names.
The Fed ships both artefacts, so the premise is directly checkable. Over the window where they overlap
(**2025-12-23 → 2026-07-28**):

| | count |
|---|---|
| Posting days **scheduled** in `PostedUpdates` | **48** |
| Vintage dates **actually posted** in `ContribArchives` | **93** |
| Realized vintages that were **never scheduled** | **45 (48.4%)** |
| Scheduled dates with **no** realized vintage | **0** |

The forward schedule is a **floor, never a ceiling** — it under-announces by roughly half, and has never
once over-announced. And on the specific class the proposal reasons about, the gap is not incidental,
it is the rule:

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
vintage, unannounced** — the same shape as 02-12, 03-10, 04-13, 05-11 and 07-09.

### Leg 3 — what a solo vintage is worth · **SUPPORTED**, and it beats the December edition

Reproducing the vintage classification independently (`Data releases` free text, comma-split and
case-normalised; **140** EHS-naming vintages among 1,822 same-quarter deltas):

| Line | EHS vintages (n=140) | Every other vintage (n=1,682) | p |
|---|---|---|---|
| **Residential investment** | **0.0376pp** | **0.0057pp** | **<0.0001** |
| Change in inventory investment | **0.0001pp** | 0.0197pp | 0.0010 |
| GDP nowcast (headline) | **0.0445pp** | 0.0997pp | 0.0023 |
| PCE | 0.0012pp | 0.0124pp | 0.0722 |
| Change in net exports | 0.0003pp | 0.0025pp | 0.0245 |

Median absolute same-quarter change, 20,000-iteration permutation tests — reproducing the sibling's Leg 2
to four decimal places on every line. Splitting by composition:

| Composition | n | median \|Δ residential\| | P(<0.10pp) | median \|Δ inventories\| | P(<0.10pp) |
|---|---|---|---|---|---|
| **Solo** — `Data releases` reads "Existing-home sales" alone | **123** | **0.0399pp** | 81.3% | **0.0001pp** | **100.0% (123/123)** |
| Shared with ≥1 other release (the 12-09 shape) | 17 | 0.0288pp | 88.2% | 0.0232pp | 70.6% |
| permutation p | | 0.423 | | **<0.0001** | |

The reading matches the sibling's — residential does not separate on composition, inventories separates
violently — on a **different split** (123/17 here against their 109/31; the classifiers differ, mine
requiring the whole comma-split field to be the one release, and the substantive conclusion is identical
under both). Two consequences for 11-12 specifically:

1. **A solo vintage is strictly more attributable than 12-09's shared one.** On the 123 solo vintages the
   inventories line has *never* moved 0.10pp, and residential is the larger move on **121 of 123**. If
   11-12 posts solo, whatever the residential contribution does that morning is this print and nothing
   else — no orthogonality argument needed, because there is no co-release to be orthogonal to.
2. **The direction is worth noting and not over-read.** Solo EHS vintages cut the residential
   contribution **76** times and raised it **47** — a lean, not a signal, and this ledger registers no
   directional test on it.

### Leg 4 — "the one session where the tape can be read" · **REFUTED**: it was already read, 100 times

The proposal's tape claim rests on 11-12 being free of the FOMC confound that makes 12-09 unreadable.
That is true — the Fed's 2026 panel has no meeting on 11-12 — and it is also beside the point, because
the unconfounded measurement already exists at n=100. Daily bars, **2016-09-06 → 2026-09-04** (2,514
sessions), median session range, permutation tests against a baseline excluding all EHS release days:

| | EHS release days (n=114) | p | **Solo-vintage EHS days (n=100)** | **p** | Baseline (n=2,400) |
|---|---|---|---|---|---|
| **SPY** | 0.907% | 0.72 | **0.897%** | **0.84** | 0.883% |
| **ITB** | 1.916% | 0.58 | **1.915%** | **0.61** | 1.863% |
| **XHB** | 1.736% | 0.41 | **1.728%** | **0.49** | 1.660% |

Open-to-close absolute moves say the same and if anything more bluntly — ITB **0.841%** on EHS days
against **0.857%** baseline, i.e. *narrower*. Tail behaviour agrees: only **1 of 114** EHS days exceeded
ITB's baseline p95 range (4.488%).

The middle column is the part nobody had run. A **solo-vintage EHS day** is the strongest available
operational definition of "an unconfounded existing-home-sales session" — the Atlanta Fed ingested
nothing else that day, so no other release in its input set printed. There are **100** of them, and the
homebuilder ETF is indistinguishable from an average Tuesday on every one of the three tests. **The
control 11-12 was proposed to provide has been run a hundred times, and it reads zero.** Watching it a
101st time is not new information; it is the base rate.

### Leg 5 — is 11-12 even the clean session it was proposed as? · **MIXED**, leaning no

Setting aside that the tape is null, the "ordinary Thursday" characterisation does not survive the
corridor. 2026-11-12 carries, from primary sources checked today:

- **CPI on 2026-11-10** (D-2, `confirmed` on this calendar) and **PPI on 2026-11-13** (D+1, `confirmed`).
- **Two same-session releases**: the October Monthly Treasury Statement, and Census **Business Formation
  Statistics**, 10:00 ET, October data, release code **A202611121000** — the same minute as this print.
- **2026-11-11 is a SIFMA bond-market closure** (Veterans Day, a Wednesday), so 11-12 is the first full
  rates session of that week.

That is a structural consequence of NAR's own calendar change, not bad luck. The move to day 9–14
effective January 2026 (day-of-month median **11** in 2026 against **21–22** across 2014–2021) parks EHS
inside the CPI/PPI cluster: **6 of the 7** 2026 EHS releases sit within three days of a CPI or PPI
vintage, where **only 19 of 140** did across the whole archive.

Whether the crowding *does* anything is a weaker claim, and graded MIXED because the numbers are
suggestive and underpowered:

| | crowded EHS days (n=11) | isolated EHS days (n=103) | baseline | p vs baseline |
|---|---|---|---|---|
| ITB | 2.268% | 1.913% | 1.863% | 0.20 |
| XHB | **2.290%** | 1.724% | 1.660% | **0.045** |
| SPY | 0.963% | 0.900% | 0.883% | 0.71 |

XHB clears 5% on n=11 and one of three tests, which is not a finding. The 2026-only cut points the same
way and does not clear either (ITB **2.513%** across the 7 2026 EHS days against 1.910% pre-2026,
p=0.12). The honest statement: **there is no evidence the corridor makes 11-12 wider, and no basis at all
for calling it unconfounded.** The one 2026 EHS day that was genuinely isolated — **07-09** — printed
**1.87%**, the year's narrowest.

Two arithmetic corrections to the proposal's corridor while it is on the table: 11-12 is **three** days
after the 11-09 wholesale print (its note says six) and **six** days before the 11-18 October PHSI (its
note says four).

### Leg 6 — the sibling's ITB kill switch · **REFUTED**, and it should be retired

The 12-09 ledger's third kill switch reads: *"ITB's session range on any EHS release day between now and
12-09 exceeds 3.0%… with no FOMC, CPI or jobs print that session,"* naming 09-10, 10-13 and **11-12** as
the dated chances to observe it. Because 11-12 is one of the three, this ledger owes the threshold a
check, and it does not survive one:

| ITB session range > 3.0% | rate |
|---|---|
| Solo EHS release days | **17 / 100 (17.0%)** |
| All EHS release days | **18 / 114 (15.8%)** |
| **All sessions 2016-09-06 → 2026-09-04** | **441 / 2,514 (17.5%)** |

A trigger that fires on EHS days at **15.8%** against an unconditional **17.5%** is not a falsifier of
inertness — it is a reading of the volatility regime, and it fires slightly *less* often on the class it
was written to test. Its false-positive history is on the record: of the 18 EHS days that cleared 3.0%,
the cluster is 2020 (five) and 2022 (five), and the most recent is **2026-06-09 at 3.72%** — a day
carrying international trade and wholesale trade as well, with CPI the following morning. For scale, ITB's
median range over the last 20 sessions is **1.808%**, so 3.0% is roughly a p82 event in the current
regime.

**This ledger registers no tape forward test in its place, deliberately.** With the class measured null
at n=100 and p=0.61, any threshold picked now would be a prediction about the volatility regime dressed
as a prediction about this print — the same trap, one ledger later. The sibling's own precedent is the
model: it declined a content test rather than invent a base rate.

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

- **Peer prints** — n/a, `symbols: []`. The homebuilder names were read as a *class* (Legs 4 and 6), not
  as holdings: ITB **93.91**, XHB **103.25**, SPY **770.19** (2026-09-04 closes, Nasdaq API; they
  reproduce the sibling's Yahoo pull exactly).
- **Macro surprises** — none since the last row; there is no last row. Ahead of this print: jobs 11-06,
  wholesale 11-09, **CPI 11-10**; behind it: **PPI 11-13** and the 11-17 stack.
- **Volatility regime** — **VIX 14.53** (2026-09-04, CBOE `VIX_History.csv`, matching the sibling's
  reading from a different source). The week ran 14.51 → 14.43 → 14.92 → **16.34** → 15.20 → 14.32 →
  14.53, so the 09-01 spike has fully retraced. Baseline reading; nothing to diff against yet.
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
  month** six days later, so October's existing and new residential activity can be read against each
  other. Its December twin `housing-starts-2026-12-17` is already on the calendar from the sibling's
  sweep.
- **Three classes considered and DECLINED**, so their absence reads as a decision. (i) **Census Business
  Formation Statistics 2026-11-12** — same session, same minute, primary-sourced, and genuinely
  interesting as corridor colour, but it has no GDPNow channel and no house playbook, so a row buys no
  decision. (ii) **October PHSI 2026-11-18** — the sibling declined the routine PHSI class on the record
  and nothing found here distinguishes the October edition; sharing a session with FOMC minutes is a
  property of 11-18, which the housing-starts proposal above already puts on the calendar. (iii)
  **EHS 2026-10-13** — a routine monthly edition. It matters to *this* ledger (it is the rehearsal named
  in the month horizon) but the thing worth watching is a workbook re-pull at the next pulse, not a
  calendar row; an edition earns a row when it is distinguishable, and being the previous one is not.

### Honest limits

- **The scheduled-vs-realized gap is measured on one overlapping window.** `PostedUpdates` as shipped
  covers 2025-12-23 → 2026-12-23, so the 48-vs-93 comparison is 2025-12-23 → 2026-07-28 — about seven
  months. It is a strong effect (48.4%, with zero counter-examples in the other direction), but it is one
  regime, and an older `PostedUpdates` vintage would be needed to say it has always been true.
- **"Solo" is read from free text.** The composition split rests on a `Data releases` column whose
  spellings drift across a decade; mine differs from the sibling's (123/17 vs 109/31) precisely because
  the classifiers differ. The substantive readings agree under both, and the release-date join every
  other number rests on does not depend on the classifier at all.
- **The archive is what GDPNow chose to name.** Any EHS release that coincided with no posting day is
  invisible to it, so Leg 3's 140 dates are a sample. The 2026 rows are a census only because NAR's
  calendar supplied the denominator independently.
- **The bars are a substitute source, cross-validated but not the sibling's.** Yahoo 429'd all session;
  Nasdaq's API caps at 2,514 rows, so the daily study starts 2016-09-06 rather than 2016-01-01 and runs
  114 EHS days against the sibling's 122. No **hourly** source was reachable, so this session did not
  re-derive the 10:00-hour work and does not claim to — the sibling's Leg 5 stands on its own bars.
- **Leg 5 is underpowered and says so.** n=11 crowded days and n=7 2026 days cannot settle whether the
  CPI/PPI corridor widens an EHS session. What Leg 5 *does* settle is descriptive and needs no power:
  11-12 has CPI two days before it, PPI the day after, two same-session releases and a bond holiday the
  day before, so "unconfounded" is not an available description.
- **All the nowcast work measures a model, not a market.** Every Δ describes the Atlanta Fed's estimate
  of GDP. The only price claims here are session-class studies, and all of them are reasons *not* to act.
- **`ContribArchives` ends 2026-07-28** and carries no Q4-2026 vintage, so the class priors behind `-2`
  are out-of-sample for the quarter being nowcast.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date is `confirmed`, promoted this session on the publisher's own calendar).** Stand aside on
2026-11-12 and on every edition of this report. Hold three frames. **On the date:** it is NAR's own,
published in November 2025, corroborated by the live statistics page and by a 7-for-7 match against the
vintages the Atlanta Fed actually posted; the citation path moved to `/press-releases/`. **On the
nowcast — the reason this ledger exists:** the proposing lane's premise that GDPNow posts only on
scheduled days is refuted (48 scheduled against 93 realized; 45 of 93 unscheduled; zero scheduled-but-
unposted), and on this class every one of the seven realized 2026 EHS dates got a vintage with five of
seven unscheduled and all five solo — so 11-12 should carry a **solo** existing-home-sales vintage, which
is more attributable than the December edition's shared one, not absent. Read that residential line.
**On the tape:** it is not the readable half, it is the spent half — 100 solo EHS release days leave ITB
at 1.915% against a 1.863% baseline (p=0.61), and the sibling's `>3.0%` ITB trigger fires at the
unconditional base rate (15.8% vs 17.5%) and should be retired rather than watched on 11-12. And the
session is not unconfounded in any case: CPI D-2, PPI D+1, two same-session releases, a bond-market
holiday the day before. Nothing here licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **No ContribArchives vintage dated 2026-10-13 exists by 2026-10-16.** That is the free rehearsal: 10-13
  is on NAR's calendar and off the Fed's forward schedule, exactly like 11-12. Its absence would mean the
  proposing lane's premise is right after all and Leg 2 must be re-derived, a month before it matters.
- **A vintage dated 2026-11-12 posts and names a co-release alongside existing-home sales.** The solo
  reading — the whole basis for calling this the cleanest nowcast of the year — fails, and 11-12 becomes
  a shared vintage to be decomposed like 12-09 rather than read directly.
- **The 2026-11-12 vintage moves the Q4-2026 residential-investment contribution by ≥0.30pp.** Far past
  anything in the 140-vintage class; the commissions leaf would be carrying information the size of a
  real component surprise, and this print would acquire a reading worth waiting for.
- **ITB's session range on 2026-11-12 exceeds 4.488%** — the baseline p95, cleared by **1 of 114** EHS
  days in ten years, and chosen precisely because the sibling's 3.0% is not discriminating. That would
  put the inertness finding back in question on an instance with no FOMC and no same-session CPI or jobs
  print.
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

No tape forward test and no content forward test are registered, both by choice and both argued above
(Leg 6; *Primary content read*).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-67 | **Initial research on an id that existed only as a proposal. Both halves of the proposing lane's framing are refuted: the nowcast reading is not absent but the cleanest of the year, and the tape is not the readable half but the spent one.** Canonical `src/domain/market-events/existing-home-sales-2026-11-12.json` written this session after reading the single proposal (`from-existing-home-sales-2026-12-09`), now shadowed. **Leg 1 — the date:** NAR's own 2026 schedule (HTTP 200, 483,177 bytes; the `/newsroom/` path now **308-redirects** to `/press-releases/`) and its `.docx` twin published **2025-11** (55,384 bytes) both read "NOVEMBER \| Thu., Nov. 12 \| **October** Existing-Home Sales" under "All releases at 10 a.m. Eastern Time". Status `estimate`→**`confirmed`**, prefix `EST:`→**`IR:`**, on the `challenger-job-cuts-2026-09-03` precedent the sibling used. Corroborated by NAR's live page naming the next edition 2026-09-10, and by the seven 2026 EHS dates the Fed has actually posted vintages for matching NAR's calendar **7/7**. **Leg 2 — the central finding, and it kills the proposal's premise:** the proposal asserted "GDPNow posts a vintage only on the release days it schedules". Over the two workbooks' overlapping window (**2025-12-23 → 2026-07-28**) `PostedUpdates` schedules **48** posting days while `ContribArchives` records **93** posted — **45/93 (48.4%) unscheduled, 0 scheduled-but-unposted**. The forward schedule is a floor, never a ceiling. On this class: **all 7** realized 2026 EHS dates got a vintage, **5/7 unscheduled** (02-12, 03-10, 04-13, 05-11, 07-09), and **all 5 named "Existing-home sales" alone**; the 2 that were scheduled (01-14, 06-09) are the 2 where EHS rides a Census release. **Expect 11-12 to post a SOLO EHS vintage, unannounced.** **Leg 3 — what that is worth:** reproducing the classification on **1,822 same-quarter deltas**, the **140** EHS-naming vintages move residential a median **0.0376pp** vs **0.0057pp** (p<**0.0001**), inventories **0.0001pp** vs 0.0197pp (p=0.0010), headline **0.0445pp** vs 0.0997pp — matching the sibling to four decimals. Split by composition: **solo n=123** moves inventories **0.0001pp with P(<0.10pp) = 100.0% (123/123)** and residential 0.0399pp (81.3%); **shared n=17** moves inventories 0.0232pp (70.6%); residential does not separate (p=0.423), inventories does (p<0.0001). My 123/17 differs from the sibling's 109/31 by classifier only; both readings agree. **A solo vintage needs no orthogonality argument — there is no co-release to be orthogonal to**, which makes 11-12 a cleaner nowcast read than 12-09. Solo residential direction leans down (76 down / 47 up); no directional test registered on it. **Leg 4 — the tape, and the control is already spent:** Nasdaq API daily bars, **2,514 sessions 2016-09-06 → 2026-09-04** (Yahoo hard-429'd all session — 6 attempts, the crumb endpoint itself 429'd; stooq serves a JS proof-of-work challenge; both recorded in `probe-ref.blocked`, and the substitute closes reproduce the sibling's Yahoo pull **exactly**: SPY **770.19**, ITB **93.91**, XHB **103.25**, VIX **14.53** from CBOE). Median session range vs a 2,400-session baseline excluding EHS days: **all 114 EHS days** SPY 0.907% (p=0.72), ITB 1.916% (p=0.58), XHB 1.736% (p=0.41); **the 100 SOLO-vintage EHS days — the unconfounded control this event was proposed to supply — SPY 0.897% (p=0.84), ITB 1.915% (p=0.61), XHB 1.728% (p=0.49)**. ITB open→close is *narrower* on EHS days (0.841% vs 0.857%) and only **1/114** cleared ITB's baseline p95 (4.488%). **The control has been run 100 times and reads zero.** **Leg 5 — and 11-12 is not the clean session claimed:** **CPI 11-10 (D-2)**, **PPI 11-13 (D+1)**, the October MTS and Census **Business Formation Statistics** (`A202611121000`, 10:00, October data) share the session, and **11-11 is a SIFMA bond-market closure**. Structural, not luck: NAR's day-9–14 move (2026 day-of-month median **11** vs **21–22** in 2014–2021) parks EHS in the CPI/PPI cluster — **6 of 7** 2026 EHS days sit within 3 days of a CPI or PPI vintage against **19 of 140** archive-wide. Whether crowding widens the tape is underpowered and graded MIXED (crowded n=11: ITB 2.268% p=0.20, XHB 2.290% p=**0.045**, SPY 0.963% p=0.71; 2026-only ITB 2.513% vs 1.910% p=0.12); the one isolated 2026 EHS day, **07-09**, printed the year's narrowest ITB range (**1.87%**). **Two arithmetic corrections to the proposal:** 11-12 is **3** days after the 11-09 wholesale print (it says six) and **6** days before the 11-18 PHSI (it says four). **Leg 6 — the sibling's ITB kill switch should be retired:** `>3.0%` on an EHS day fires **18/114 (15.8%)** and **17/100 (17.0%)** on solo days against an **unconditional 441/2,514 (17.5%)** — it measures the volatility regime, not the print, and fires *less* often on the class it tests. The 18 clear-throughs cluster in 2020 (5) and 2022 (5); the latest is **2026-06-09 at 3.72%**, a triple-release day with CPI the next morning. ITB's last-20-session median range is **1.808%**, so 3.0% ≈ p82 today. **No tape forward test registered in its place, deliberately** — any threshold now would predict the vol regime, not this print. **Collection corrections:** the Atlanta Fed media path both sibling ledgers cite (`/-/media/documents/cqer/…`) now **404s**; the live path from the GDPNow page's own href is `/-/media/Project/Atlanta/FRBA/Documents/cqer/…`. **Primary content:** current edition **July 2026** (released 08-11) — **−1.7% m/m**, median price **$431,400**, supply **4.6 months**; Northeast up, West steady, Midwest and South down; Yun quoted "remarkably stable… year-to-date sales are up 2.4%… thriving if average mortgage rates were to return near 6%". FRED: `EXHOSLUSM495S` **4.06M** SAAR, `HOSINVUSM495N` **1.54M** NSA, `HOSSUPUSM673N` **4.6** (from 3.5 in Dec-25), `MORTGAGE30US` **6.71%** (2026-09-03, an 8-week high). **FRED carries only 13 months of the NAR-licensed series**, so **no content forward test** — the sibling's refusal, re-checked rather than inherited. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** jobs 11-06, wholesale 11-09, CPI 11-10 ahead; PPI 11-13 and the 11-17 stack behind. **Volatility:** VIX **14.53**; the week ran 14.51/14.43/14.92/16.34/15.20/14.32/14.53 — the 09-01 spike fully retraced. Baseline; nothing to diff yet. **Geopolitical:** `us-china-tariff-truce-expiry-2026-11-10` is the corridor's live tail risk two days out, its own lane's file; **this is a NAR release, so no federal funding mechanism reaches it**. **Event tape:** no October consensus at D-67; 09-10 and 10-13 set the base first. **One dated event proposed** (own file, `estimate`): **`housing-starts-2026-11-18`** (Census `A202611180830`, 08:30, October data; Fed `PostedUpdates` 2026-11-18 "Housing starts") — the residential node's *other* leaf (`SplicedNewHousingConstruction`→`FRSPX_USNAqtr` "Permanent-site" against this print's `valExHomeSales`→`FRSBKX_USNAqtr` "Brokerage commissions"), same reference month, six days later. **Three classes declined on the record:** Business Formation Statistics 11-12 (same minute, no GDPNow channel, no decision bought), October PHSI 11-18 (the sibling declined the routine PHSI class and nothing here distinguishes it), EHS 10-13 (routine — it is this ledger's rehearsal, watched via a workbook re-pull, not a calendar row). **Three forward tests registered**, all structural and all scoreable from one workbook re-pull: `-1` (a 2026-11-12 vintage exists and names EHS alone; base 7/7 with 5/7 unscheduled), `-2` (that vintage, or the next if none posts, moves inventories <0.10pp; base 123/123 solo), `-3` (realized vintage dates 09-07→11-12 exceed the 16 scheduled; base 93 vs 48). | **Initial stance set: stand aside on every horizon; date promoted to `confirmed` on NAR's own calendar, the proposing lane's "no vintage will post" premise REFUTED (48 scheduled vs 93 realized; 7/7 of 2026's EHS dates posted, 5/7 unscheduled and all 5 solo) so 11-12 is expected to carry the year's cleanest SOLO residential vintage, the "readable tape" framing REFUTED because the unconfounded control already exists at n=100 with ITB p=0.61, the "ordinary Thursday" description withdrawn (CPI D-2, PPI D+1, two same-session releases, bond holiday D-1), and the sibling's 3.0% ITB kill switch shown to fire at the unconditional base rate and recommended for retirement.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-existing-home-sales-2026-11-12.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
