# Monthly Wholesale Trade (Aug 2026 data) — wholesale-trade-2026-10-08

**Kind:** macro-print · **Date:** 2026-10-08 (estimate, Census-sourced but filed `EST:` — `economic-indicators/calendar-listview.html` row "Monthly Wholesale Trade: Sales and Inventories | October 8, 2026 | 10:00 AM | August 2026", id `A202610081000`, reference `A202608`, all 179 rows parsed direct 2026-09-06; corroborated by the Atlanta Fed's `GDPNowcastDataReleaseDates.xlsx` `PostedUpdates` row, which reads "Wholesale trade" alone. Stays `estimate`: the lane may not self-confirm an event it discovered in-sweep, and this same page demonstrably carries `Suspended` rows) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.32,"daysBand":"low:15+","adjacentIds":["ecb-account-2026-10-08","fomc-minutes-2026-10-07","imf-world-bank-annual-meetings-2026-10-12","intl-trade-full-report-2026-10-06","ism-services-2026-10-05","mrvl-investor-day-2026-10-06","opec-jmmc-68th-2026-10-04","sifma-bond-market-closure-2026-10-12","treasury-10y-note-2026-10-07","treasury-30y-bond-2026-10-08","treasury-3y-note-2026-10-06","treasury-buyback-20y30y-2026-10-08","treasury-buyback-2y3y-2026-10-06"],"screenStreak":0,"blocked":[{"url":"https://query1.finance.yahoo.com/v8/finance/chart/SPY","status":"429","at":"2026-09-06"},{"url":"https://query2.finance.yahoo.com/v8/finance/chart/SPY","status":"429","at":"2026-09-06"},{"url":"https://stooq.com/q/d/l/?s=spy.us&i=d","status":"JS_CHALLENGE","at":"2026-09-06"},{"url":"https://www.wsj.com/market-data/quotes/etf/SPY/historical-prices/download","status":"401","at":"2026-09-06"},{"url":"https://alfred.stlouisfed.org/graph/alfredgraph.csv?id=WHLSLRIMSA","status":"TIMEOUT","at":"2026-09-06"},{"url":"https://alfred.stlouisfed.org/series/downloaddata?seid=WHLSLRIMSA","status":"HTTP2_RESET","at":"2026-09-06"},{"url":"https://www2.census.gov/wholesale/releases/historical/","status":"404","at":"2026-09-06"},{"url":"https://www.census.gov/wholesale/mwts/www/timeseries1.xlsx","status":"404","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **This print's numbers have an eighteen-day shelf life, and its own nowcast channel is the
quietest one this calendar has ever measured.** Census's intention-to-revise notice, read verbatim
today, restates the whole wholesale history on the 2023 and 2024 AIES on **2026-10-26** — so this is
the **last ordinary monthly wholesale release on the pre-AIES basis**, and any series stored from it
is superseded eighteen days later. On the nowcast, this edition is the **mirror** of its 11-09
sibling rather than a copy of it: **August is the quietest reference month in the whole GDPNow
archive — 6 of 6 editions moved the change-in-inventory-investment contribution by under 0.10pp**
(median **0.0280pp**, max **0.0652pp**), against September's **0.1261pp** and 50%. The mechanism this
session names is not the month but the **calendar position it forces**: a *quarter-end* reference
month must post in the first week of a new nowcast round (n=26, **0.0864pp**, 57.7% quiet) while a
*mid-quarter* month posts late into a well-fed one (n=52, **0.0451pp**, 86.5%; permutation
p=**0.024**) — which reproduces the sibling's classifier-collapse finding at **Jaccard 0.846** and
renames the variable. The tape says the same thing twice: on an independent metric and a different
price series, wholesale release days are a **fifth** null (n=68, **0.610%** vs **0.554%** across all
1,424 sessions, p=0.50), and **wholesale ∩ Thursday — this edition's shape — is dead flat** (n=15,
0.580%, p=0.88), where the sibling's Monday shape was visibly quiet. So 10-08 is not a waiting room;
it is an **ordinary session carrying a number with a fortnight to live**. Date is **estimate**;
`symbols: []`; nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-32) | **Stand aside** | High | `symbols: []`, an `estimate` date 32 days out, no August data in existence, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed — a re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns 0 macro hits today. No instrument attaches to this event on any date. | A macro-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-10-01** — none exists today |
| This week | **Stand aside — the next wholesale number is 09-10, and it belongs to no ledger** | High | The current published edition is **June 2026** data (CB26-120, released 2026-08-06, re-read direct today); the July print lands **2026-09-10**, four days out, is tracked by nobody, and shares its GDPNow vintage with PPI and existing-home sales. VIX **14.32** (2026-09-03 close, FRED `VIXCLS` — Yahoo returned 429 all session). | Census moving or suspending the **2026-09-10** slot on `calendar-listview.html` before **2026-09-10** — unprecedented on an 84/84 record |
| This month | **Read 09-30, not 10-08 — and note that this edition's preview lands on the corridor's loudest morning** | Medium | The **2026-09-30** Advance Economic Indicators Report publishes advance August wholesale inventories at 08:30, eight days ahead of this print, which then moves the number by a median **0.10pp** (8 advance→full pairs, max 0.30pp, unrevised 3 of 8). Unlike the sibling's clean 10-28 preview, this one shares its morning with **PCE**, the **Q2 GDP third estimate** and the **FY2027 funding deadline** — the preview arrives where nobody is reading it. | The **2026-09-30** advance report omitting August wholesale inventories, or the full report on **2026-10-08** revising that advance m/m by **more than 0.1pp** (registered as `-3`, base rate 6 of 8) |
| This quarter | **Expect a small nowcast move and an ordinary session — and treat anything stored from this print as expiring 2026-10-26** | Medium | August is the archive's quietest reference month (**6/6 under 0.10pp**, max 0.0652pp) and this vintage is **solo**; the session class is a null on two metrics. Against that, Census restates the entire series **18 days later**, and the measured size of a wholesale restatement — median **172** months moved at **0.126%** each (carried from `mwts-benchmark-revision-2026-10-26`) — was measured on months **15+ months old**, which is exactly where a just-printed August is not. Medium, not high, because that silence is real. | The **2026-10-08** GDPNow vintage moving the Q3-2026 change-in-inventory-investment contribution by **0.10pp or more** (registered as `-1`, base rate 6/6 against), or the restated August level published on **2026-10-26** matching this print's to within 0.05% (registered as `-2`) |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `estimate`-dated, `symbols: []`, no
  macro-keyed playbook. Research is not action.
- **The operational rule is a shelf life, not a level.** Anything read off this print — an August
  inventories level, an inventories/sales ratio, a y/y — is on the **pre-AIES basis** and is
  superseded on **2026-10-26**. Refresh, do not carry.
- **The number arrives 09-30, and it arrives buried.** Advance August wholesale inventories print at
  08:30 that morning alongside PCE, the Q2 GDP third estimate and the funding deadline. The full
  report eight days later has never moved the m/m by more than **0.30pp** in 8 pairs.
- **The line to read is GDPNow's Q3-2026 *inventories* contribution, and expect it to be small.**
  78 wholesale vintages move it a median **0.0639pp** against **0.0142pp** for the other 1,744
  (p<0.0001) while moving net exports **0.0012pp** — but the six August editions run **0.0280pp**
  with none above 0.0652pp. Registered as `-1` in the **quiet** direction, the deliberate mirror of
  the sibling's loud September registration.
- **The corridor risk this edition was born with has already retired.** The **FY2027 funding
  deadline 09-30** is eight days ahead of this print, and August is the one reference month a lapse
  has ever displaced worst — **82 days**, the archive maximum, in 2025. PL 119-103 was signed
  2026-09-02 through **2026-12-11**, so there is no 10-01 lapse and no cliff in this reference cycle.
- **Do not import the sibling's waiting-room reading.** 11-09 was Monday ∩ CPI-eve ∩ wholesale, three
  stacked quiet classes. 10-08 is **Thursday**, and Thursday carries no discount (n=286, 0.618% vs
  0.554%, p=0.081 in the *loud* direction); the joint class is n=15, 0.580%, p=0.88.
- **One watch item that is not about this print at all.** `sifma-bond-market-closure-2026-10-12`
  closes the bond market four days later while equities stay open, and a **30-year bond auction plus
  a 20y/30y buyback** already share 10-08's afternoon — the corridor's liquidity is thinner than the
  event count suggests.
- **Watch (dated)** — July data **09-10** · **advance August wholesale inventories 09-30** 08:30,
  with PCE, Q2 GDP third and the funding deadline · construction spending **10-01** (proposed here) ·
  M3-2 **10-02** (proposed elsewhere) · jobs **10-02** · ISM services **10-05** · FT-900 **10-06** ·
  FOMC minutes **10-07** · **this print 10-08** 10:00, a solo GDPNow vintage · bond market closed
  **10-12** · **CPI 10-14** · **MTIS 10-15** (this print is 34.5% of it by inventory weight), with
  retail sales and PPI · **wholesale benchmark restatement 10-26** · **10-28** GDPNow's final Q3
  nowcast · advance Q3 GDP **10-29** · September data **11-09**.

## Initial research

### The question, plainly

This id existed only as `proposals/wholesale-trade-2026-10-08.from-mtis-2026-10-15.json`. That lane
argued two grounds: this print is **34.5%** of the 10-15 MTIS aggregate by inventory weight, and it
is **"the LAST ordinary monthly wholesale release on the pre-AIES basis"**, the mirror of the 11-09
edition which is the first full one after. **Are both true, does the 11-09 sibling's central nowcast
finding survive an independent rebuild, and what is actually different about the August edition?**

**One-line verdict:** both grounds reproduce, the sibling's classifier-collapse survives at Jaccard
0.846 but is better named *quarter-end vs mid-quarter reference month*, and the difference that
matters is that **August is the quietest reference month in the archive while September is the
loudest** — this edition is the sibling's mirror, not its copy.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no
target. Nine inputs, all fetched direct 2026-09-06, none carried from a sibling except where the
text says so:

1. **Seven Census release calendars** — `calendar-listview.html` (2026, HTTP 200, 91,396 bytes, 179
   rows) plus `calendar-listview-2020/2021/2022/2023/2024/2025.html`, parsed row-wise into
   `(release date, reference month)` pairs → **84 consecutive Monthly Wholesale Trade releases,
   2020-01-10 → 2026-12-09** (reference months 2019-11 → 2026-10).
2. **`census.gov/wholesale/index.html`** (HTTP 200, 527,648 bytes) — the intention-to-revise notice,
   read word-for-word.
3. **`census.gov/wholesale/current/index.html`** (HTTP 200, 194,382 bytes) — the live release,
   **CB26-120**, June 2026 data.
4. **18 Wayback captures** of that same press-release page (CDX API queried 2019→2026, raw `id_`
   fetches), parsed for the two sentences every edition carries — *"…was revised from the advance
   estimate of X to Y"* and *"…was unrevised from the advance estimate of X"* — giving **8 complete
   advance→full pairs**.
5. **FRED `WHLSLRIRSA`** — the inventories/sales ratio, **414 monthly observations 1992-01 → 2026-06**.
6. **FRED `WHLSLRIMSA` / `BUSINV` / `RETAILIMSA`** — inventory levels, to reproduce the weight claim.
7. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed) — `PostedUpdates`, **82 dated rows 2025-12-23
   → 2026-12-23**.
8. **`GDPTrackingModelDataAndForecasts.xlsx`** — `ContribArchives`, **1,871 vintages 2014-05-01 →
   2026-07-28 = 1,822 same-quarter deltas**, joined to input 1 **on release date**.
9. **FRED `SP500` / `NASDAQCOM` / `VIXCLS`** daily, restricted to **1,424 sessions since
   2021-01-01**, with 20,000-iteration permutation tests on medians.

**Three source notes, recorded rather than papered over.** First, **the tape metric had to change.**
Yahoo returned **429** on every symbol and both hosts, Stooq served a JavaScript challenge, and WSJ
returned **401** — so this session has **no high/low bars** and cannot reproduce the sibling's
session-*range* study at all. Leg 5 is therefore denominated in **close-to-close absolute return on
the S&P 500 index (FRED `SP500`)**, a different metric on a different series, and is reported as an
independent measurement rather than a replication. Second, `alfred.stlouisfed.org` timed out and
reset — so the vintage-level restatement size is **carried** from
[`mwts-benchmark-revision-2026-10-26.md`](mwts-benchmark-revision-2026-10-26.md), never re-derived
here, and Census's own wholesale vintage archive (`www2.census.gov/wholesale/xls/mwts/`) holds only
`newformat.xls` and two SIC-era files — there is no wholesale equivalent of the retail vintage
archive that `retail-benchmark-revision-2026-09-28` used. Third, the Atlanta Fed's workbook path in
sibling ledgers now 404s; the live path is `/-/media/Project/Atlanta/FRBA/**Documents**/cqer/…`,
recorded here so the next session does not re-discover it. All eight failures are in
`probe-ref.blocked`.

### Leg 1 — the report exists on 2026-10-08 · **SUPPORTED**, on two primaries

Census lists `A202610081000`, reference `A202608`, 10:00 a.m. The Atlanta Fed independently schedules
a GDPNow posting that morning and — as with the 11-09 edition, and unlike 12-09 — names **nothing
else**: `PostedUpdates` reads "Wholesale trade" alone. Status stays **estimate**: no self-confirm on
an in-sweep discovery, and the same page carries `Suspended` rows. Understating the label only widens
caution.

Two structural facts about the date. **2026-10-08 is a Thursday**, the third-most-common weekday for
this release (Fri 24 · Wed 22 · **Thu 20** · Mon 10 · Tue 8). And its **38-day** reference-month-end
lag sits one day inside the archive median.

### Leg 2 — "the last print on the pre-AIES basis" · **SUPPORTED**, and it is the frame

The weight half reproduces exactly and independently. FRED, June 2026: merchant wholesalers
**$944,710M** of total business inventories **$2,740,239M** = **34.5%** (retail $832,612M = 30.4%).
The proposing lane's arithmetic stands without amendment, as it did for the sibling.

The basis half survives here in a way it did **not** for the 11-09 edition, and the asymmetry is the
point. Census's wholesale notice, quoted verbatim from `census.gov/wholesale`:

> *Intention to Revise — Monthly Wholesale sales, inventories, and inventories/sales ratios estimates
> are anticipated to be revised based on historical corrections and the results of the 2023 and 2024
> Annual Integrated Economic Survey. Revised not adjusted estimates and corresponding adjusted
> estimates are tentatively scheduled for release on October 26, 2026 at 10:00 a.m. EDT.*

The sibling had to weaken *"the first print on the restated basis"* to *"the first **full monthly
report** after it"*, because Census names one date and **no downstream release**, and because the
10-28 advance report gets to the new basis first. **That correction does not apply to this edition.**
Being the *last* release *before* a dated restatement requires no inference about propagation at all
— it is settled by two dates on two primaries. Parsing the 2026 calendar across the corridor:

| Date | Time | Release | Reference | Position relative to the 10-26 restatement |
|---|---|---|---|---|
| 2026-09-30 | 08:30 | Advance Economic Indicators (trade, retail & **wholesale inventories**) | Aug 2026 | −26 days |
| 2026-10-01 | 10:00 | Construction Spending | Aug 2026 | −25 (proposed here) |
| **2026-10-08** | **10:00** | **Monthly Wholesale Trade — this event** | **Aug 2026** | **−18 — the last ordinary monthly release before it** |
| 2026-10-15 | 10:00 | Manufacturing and Trade: Inventories and Sales | Aug 2026 | −11 |
| 2026-10-26 | 10:00 | **Wholesale benchmark restatement** (standalone, absent from the calendar) | history | — |

So the operational content of Leg 2 is a **shelf life**: this print publishes an August level, an
inventories/sales ratio and a y/y on a basis Census has already announced it will discard, eighteen
days later. How much the discarding moves is measured elsewhere and **carried, not re-derived** —
`mwts-benchmark-revision-2026-10-26` puts all 12 prior benchmark revisions at **126+ months restated
(median 172) at a median 0.126% each**. That measurement is explicitly on months **at least 15 months
old**, which is precisely where a two-month-old August is not, so the honest reading is: *the class
is large and the just-printed month is unmeasured*. `-2` registers exactly that gap rather than
asserting past it.

### Leg 3 — the schedule record and the funding exposure · **SUPPORTED**, and August is the interesting month

Re-derived here rather than carried:

| Measure | Value |
|---|---|
| Consecutive reference months published, 2019-11 → 2026-10 | **84**, zero gaps |
| Reference months deleted | **0** |
| Undisrupted releases (lag 34–41 days) | **78 of 84**; median lag **39d** |
| Undisrupted releases landing on days 6–10 of the month | **78 of 81** |

The six exceptions are not scattered — they are one lapse and its monotone recovery: 2025-08
(**82d**), 2025-09 (72d), 2025-10 (69d), 2025-11 (60d), 2025-12 (55d), 2026-01 (47d), then straight
back to 40d. Every `Suspended` row anywhere in the seven calendars belongs to one of exactly three
series — the Advance Economic Indicators Report (5 reference months), Preliminary U.S. Imports for
Consumption of Steel Products (5), and the Advance Services Report (1) — and never to this one. That
is a **fifth** independent arrival at *Census cancels previews and keeps reports*.

The August reference month specifically carries the archive's worst displacement, which is why this
edition's funding exposure deserved a look rather than a carry:

| Reference month | Released | Lag | Weekday |
|---|---|---|---|
| Aug 2020 | 2020-10-09 | 39d | Fri |
| Aug 2021 | 2021-10-08 | 38d | Fri |
| Aug 2022 | 2022-10-07 | 37d | Fri |
| Aug 2023 | 2023-10-10 | 40d | Tue |
| Aug 2024 | 2024-10-09 | 39d | Wed |
| Aug 2025 | 2025-11-21 | **82d** | Fri (lapse-displaced — the archive maximum) |
| **Aug 2026** | **2026-10-08** | **38d** | **Thu** |

And the risk retired four days ago. The **FY2027 funding deadline sits 2026-09-30**, eight days
before this print — but H.R. 6500 was signed **2026-09-02** as **PL 119-103**, funding agencies
through **2026-12-11** (carried from `government-funding-deadline-2026-09-30`, which resolved itself
on 09-05). There is no 10-01 lapse; this print is **64 days inside** funded appropriations. The one
sentence worth carrying forward is the negative one: *the corridor's headline schedule risk for this
edition is already closed, and the next one is somebody else's problem in December.*

### Leg 4 — the sibling's nowcast finding survives, and August is its mirror · **SUPPORTED**, with one renaming

The headline reproduces exactly on an independently rebuilt join (1,871 vintages → 1,822 same-quarter
deltas, matched to the 84-release archive on release date):

| Vintage class | n | median \|Δ inventories\| | P(<0.10pp) | median \|Δ net exports\| |
|---|---|---|---|---|
| **Monthly Wholesale Trade (same-day vintage)** | **78** | **0.0639pp** | 76.9% | **0.0012pp** |
| Every other vintage | 1,744 | 0.0142pp | 82.2% | 0.0020pp |

Permutation p<**0.0001**; inventories exceeds net exports on **72 of 78 (92.3%)** against a 62.0%
base rate. Three sessions have now arrived at this independently.

**The sibling's classifier-collapse replicates, and the replication renames the variable.** Its claim
was that "reference-month position" and "vintage composition" both proxy how early in the nowcast
quarter a vintage lands. Rebuilt here with an explicitly-computed posting index (rank of the vintage
inside its own quarter's round):

| Cut | n | median \|Δ inventories\| | P(<0.10pp) |
|---|---|---|---|
| Reference month = last month of the **prior** quarter (the 11-09 shape) | 25 | 0.0872pp | 56.0% |
| **Vintage posts 1st–6th of the nowcast round** | **23** | **0.0872pp** | **56.5%** |
| Vintage posts 7th or later | 55 | 0.0418pp | 85.5% |

The middle row is the sibling's number to four decimal places on a set that overlaps its own at
**Jaccard 0.846** (22 of 26 in the union; the four that differ are 2021-11-10, 2022-02-09, 2023-05-08
and 2026-01-08). One honest note on how that was reached: at the sibling's literal boundary —
postings **1–5** — the overlap collapses to **Jaccard 0.423**, because prior-quarter vintages cluster
at positions **5, 6 and 7**, not 1–5. The finding is real and the boundary in the sibling's write-up
is one place off; drawn at ≤6 it reproduces exactly.

The better name for the variable is **quarter-end vs mid-quarter reference month**, because that is
the *cause* and the posting position is its consequence — a print of a quarter's last month
necessarily lands in the first week of the next round:

| Reference month class | n | median \|Δ inventories\| | P(<0.10pp) |
|---|---|---|---|
| **Quarter-end month** (Mar/Jun/Sep/Dec) | 26 | **0.0864pp** | 57.7% |
| **Mid-quarter month** (this print: August) | 52 | **0.0451pp** | 86.5% |

Permutation p=**0.024**. And the by-month cut is where this edition separates from its sibling
completely:

| Reference month | n | median \|Δ inventories\| | P(<0.10pp) | max |
|---|---|---|---|---|
| **August — this print's month** | **6** | **0.0280pp** | **100.0%** | **0.0652pp** |
| July | 6 | 0.0096pp | 100.0% | 0.0916pp |
| **September — the sibling's month** | **6** | **0.1261pp** | **50.0%** | 0.2196pp |
| March | 7 | 0.1080pp | 42.9% | — |
| June | 6 | 0.0893pp | 66.7% | — |
| December | 7 | 0.0653pp | 71.4% | — |

The six August editions on record, in full:

| August edition | Δ inventories | Posting | Vintage |
|---|---|---|---|
| 2020-10-09 | 0.0652pp | 32/42 | **solo** |
| 2021-10-08 | 0.0413pp | 32/41 | shared (Employment situation) |
| 2022-10-07 | 0.0094pp | 31/39 | shared (Employment situation) |
| 2023-10-10 | 0.0137pp | 30/38 | **solo** |
| 2024-10-09 | 0.0146pp | 32/41 | **solo** |
| 2025-11-21 | 0.0553pp | 35/44 | **solo** |

**Six of six under 0.10pp, none above 0.0652pp** — against a wholesale-class p90 of **0.1885pp**. The
sibling registered its `-1` in the **loud** direction because its direct analogue (September) fought
its structural cell; this ledger registers `-1` in the **quiet** direction because here the direct
analogue and the structural cell **agree**, which is the rarer and more informative configuration.
The two registrations together adjudicate the mechanism on two dates a month apart: if August is
quiet and September is loud, reference-month class is doing real work; if both come in the same way,
the posting-position mechanism is the whole story.

Graded SUPPORTED rather than qualified because the two cuts agree and the permutation clears 0.05 —
but `n=6` is `n=6`, and the honest-limits section says so.

### Leg 5 — the 10-08 session is a place to act on a 10:00 print · **REFUTED**, and this time not because the day is quiet

**The metric is not the sibling's, and that is stated up front.** Yahoo (429, both hosts), Stooq (JS
challenge) and WSJ (401) all refused this session, so there are no high/low bars and no session-range
study is possible. What follows is **close-to-close absolute return on the S&P 500 index** (FRED
`SP500`), **1,424 sessions since 2021-01-01**, 20,000-iteration permutation tests on medians against
all other sessions:

| Class | n | median \|S&P close-to-close\| | p | median \|Nasdaq\| | median VIX Δ |
|---|---|---|---|---|---|
| Wholesale release day | 68 | **0.610%** | 0.501 | 0.807% | −0.16 |
| **Thursday** | 286 | **0.618%** | 0.081 | 0.857% | −0.12 |
| Monday | 264 | **0.442%** | 0.013 | 0.725% | +0.16 |
| **Wholesale ∩ Thursday (the 10-08 shape)** | **15** | **0.580%** | **0.878** | 0.828% | −0.29 |
| Wholesale ∩ Monday (the 11-09 shape) | 9 | 0.241% | 0.171 | 0.314% | +0.57 |
| CPI release day | 61 | 0.575% | 0.815 | 0.836% | −0.60 |
| **All sessions since 2021-01-01** | **1,424** | **0.554%** | — | 0.798% | −0.14 |

Three readings follow.

**First, the print is inert — a fifth independent null on this class of Census release, and the first
on a metric that is not SPY's range.** 0.610% against 0.554% at p=0.50 is nothing, measured on a
different price series and a different statistic than the four nulls before it. That is a stronger
form of the same result: the finding is a property of the release, not of one estimator.

**Second, this edition's session carries no quiet discount, and the sibling's did.** Monday is the
one weekday that measures significantly quiet (0.442%, p=0.013), and the 11-09 edition stacked Monday
on CPI-eve on a wholesale day. **Thursday runs the other way** (0.618%, p=0.081 — a *loud* lean that
does not clear 0.05), and the joint wholesale ∩ Thursday class is dead flat at p=0.88. The
waiting-room framing is the sibling's and **must not be imported here**: 2026-10-08 is an ordinary
session.

**Third, what does own 10-08's afternoon is not this print.** A **30-year bond auction** (13:00) and a
**20y/30y buyback** share the date, the **FOMC minutes** landed the previous afternoon, and the
**ECB account** publishes that morning. None of them is a channel to a series with `symbols: []`;
they are named because they are why the day is *not* empty, which is the opposite of the sibling's
situation and the reason no compression is expected.

### Primary content read — and what this print actually adds

CB26-120 (released 2026-08-06, June 2026 data, re-read direct today): sales **$794.1B**, down **3.0%**
m/m (±0.5) and up **14.1%** y/y (±0.7); inventories **$944.7B**, up **0.2%** m/m — the 90% confidence
interval includes zero — and up **4.2%** y/y; **inventories/sales ratio 1.19**, against 1.30 in June
2025. FRED's 414-month history puts 1.19 at the **19.8th percentile** since 1992 (**16.7th** since
2010).

The advance→full distribution reproduces the sibling's **exactly**, independently harvested from 18
Wayback captures (its own harvest used 23):

| Reference month | Advance m/m | Full-report m/m | Revision |
|---|---|---|---|
| Oct 2022 | +0.8% | +0.5% | **−0.3pp** |
| Feb 2023 | +0.2% | +0.1% | −0.1pp |
| Sep 2023 | 0.0% ("virtually unchanged") | +0.2% | **+0.2pp** |
| Dec 2023 | +0.4% | +0.4% | **0.0pp** (unrevised) |
| Feb 2025 | +0.3% | +0.3% | **0.0pp** (unrevised) |
| Jul 2025 | +0.2% | +0.1% | −0.1pp |
| Dec 2025 | +0.2% | +0.2% | **0.0pp** (unrevised) |
| Jun 2026 | +0.3% | +0.2% | −0.1pp |

**Mean |revision| 0.100pp · median 0.100pp · max 0.300pp · unrevised 3 of 8 · ≤0.1pp 6 of 8 · sign
flips 0 of 8.** Two ledgers on two crawls now agree to three decimal places, which retires the
sibling's caution that the sample was "whatever the crawler happened to catch" — it is small, but it
is stable. **One limit is specific to this edition and is not the sibling's: there is no
August-reference pair in the sample at all.** The eight captured editions are October, February,
September, December, February, July, December and June references; the crawler has never caught an
August-data release. So `-3` registers the *class* base rate on a month the class has not been
observed in.

Two base rates for the August number itself, since no consensus exists and none will before 09-30:
wholesale inventories m/m in August runs a median **+0.482%** since 2010 (n=16, positive 12 of 16),
against **+0.202%** across the last 24 months of any month. And the inventories/sales ratio in August
is at or below June's **61.8%** of the time (n=34, median change **0.000**) — the same base rate the
sibling computed for September, which is why no ratio test is registered here either.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`.
- **Macro surprises** — none since the last row; there is no last row. In the corridor: PCE, the Q2
  GDP third estimate and the funding deadline **09-30**, ISM manufacturing **10-01**, jobs **10-02**,
  ISM services **10-05**, the FT-900 **10-06**, FOMC minutes **10-07**; then **CPI 10-14** and PPI
  **10-15** after.
- **Volatility regime** — VIX **14.32** (2026-09-03 close, FRED `VIXCLS`; Yahoo 429 all session, so
  this is one day staler than the sibling's 14.53 and from a different source — stated, not
  smoothed). S&P 500 **7,718.60** (2026-09-04). Baseline reading; nothing to diff against yet.
- **Geopolitical / policy** — PL 119-103 funds through **2026-12-11**, 64 days past this print; the
  09-30 deadline eight days ahead is **already resolved** (signed 2026-09-02) and is named here
  because August is the reference month a lapse has historically hurt worst. The IMF/World Bank
  annual meetings open **10-12** and OPEC's JMMC meets **10-04**; neither has a channel to a series
  with no symbols.
- **Event tape** — no August consensus exists at D-32 and none will before the **09-30** advance
  report sets the headline. Every August-content statement here is a base rate, never a forecast.
- **One dated event proposed in this PR**, its own file owned by this lane:
  `construction-spending-2026-10-01` (Census, August data, 10:00, `A202610011000`, sharing a posted
  GDPNow vintage with the already-tracked ISM print). The same hole this lane's 11-09 sibling found
  one cycle later: the ISM half of that morning is tracked and the Census half is not, and the
  series' next two editions (11-02, 12-01) already exist, so this completes a run.
- **Two CONSIDERED AND DECLINED**, so their absence reads as a decision: **Business Formation
  Statistics 10-14** 10:00 (September data, `A202610141000` — real and primary-sourced, but no
  GDPNow vintage and no channel to inventories, the same call the sibling made on its 11-12 twin);
  and the **July-data wholesale print 09-10** (real, four days out, and genuinely untracked — but
  this lane owns the August edition, and filing the immediately-prior edition of one's own series
  four days before it prints would create an event that ages out before any assessment could reach
  it). Every other Census release in the ±7-day window is already tracked or already proposed
  (intl trade **10-06**; M3-2 **10-02**, proposed by the `m3-full-report-2026-10-02` lane; retail
  sales and MTIS **10-15**), and the corridor's non-Census items — the 30y auction and buyback, the
  ECB account, FOMC minutes, OPEC's JMMC, the IMF/World Bank meetings — all carry ids already.

### Honest limits

- **The tape metric is not the sibling's, and cannot be compared cell-for-cell to it.** Three bar
  sources refused this session, so Leg 5 measures close-to-close absolute return where every prior
  ledger in this family measured intraday range. The two agree on the null (wholesale days are
  ordinary) and on the ordering (Monday quiet, Thursday not), but a 0.610% close-to-close median and
  a 0.974% range median are **not the same number** and must never be quoted as one.
- **`n=6` on the August cell.** Leg 4's registration leans on six observations that happen to agree
  with a 52-observation structural cell. If `-1` fails, the honest read is that agreement was luck
  and the class is noisier than either cut says.
- **The restatement size is carried, not measured.** ALFRED refused and Census keeps no wholesale
  vintage archive, so the 0.126%/month figure comes from `mwts-benchmark-revision-2026-10-26`
  wholesale — and that figure describes months **15+ months old**. What a benchmark revision does to
  a month printed **eighteen days earlier** is, as far as this corridor has measured, unknown. `-2`
  is registered to find out, not to confirm.
- **No August advance→full pair exists in the 8-pair sample.** The base rate `-3` rides on has never
  been observed in this print's own reference month.
- **The CPI class is built on a proxy.** `bls.gov` is a known 403 from this runner
  ([`ppi-2026-11-13.md`](ppi-2026-11-13.md)), so CPI release dates come from `ContribArchives` free
  text (135 dates 2014→2026, thin for 2025–26). It matters less here than for the sibling, since
  10-08 is not CPI-adjacent and the CPI rows are reported only for context.
- **All the nowcast work measures a model, not a market.** Every Δ describes the Atlanta Fed's
  estimate. The only price claims here are the session-class studies, and both are reasons *not* to
  act.
- **`ContribArchives` ends 2026-07-28** and holds no 2026:Q3 vintages at all, so `-1`'s class priors
  are entirely out-of-sample for the quarter being nowcast.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has
  no instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date is `estimate`).** Stand aside on 2026-10-08 and on every edition of this report. Hold
four frames. **On the premise:** both of the proposing lane's grounds reproduce — 34.5% by weight,
and last-before-the-restatement — and unlike the 11-09 sibling, the basis claim here needs **no
inference**, because being the last release before a dated restatement is settled by two dates rather
than by how a restatement propagates. **On what this print is:** a number with an **eighteen-day
shelf life**. Refresh anything stored from it after 2026-10-26; do not carry it. **On the nowcast:**
this edition is the sibling's **mirror**, not its copy — August is the archive's quietest reference
month (6/6 under 0.10pp, max 0.0652pp) where September is its loudest (50%), and the sibling's
classifier-collapse survives an independent rebuild at Jaccard 0.846 once the boundary is drawn at
posting ≤6 rather than ≤5. The better name for the variable is *quarter-end vs mid-quarter reference
month*: the cause, not its calendar consequence. **On the tape:** do **not** import the waiting-room
reading. 11-09 stacked three quiet classes; 10-08 is a Thursday, and Thursday leans loud if anything
(p=0.081), with the joint class dead flat at p=0.88. Nothing here licenses an entry, and there is no
instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The 2026-10-08 GDPNow vintage moves the Q3-2026 change-in-inventory-investment contribution by
  ≥0.10pp.** No August edition on record has (6 of 6, max 0.0652pp). A break would mean the quietest
  cell in the study is not a cell at all, and Leg 4 gets rebuilt rather than patched.
- **Census amends or withdraws the 2026-10-26 intention-to-revise notice before 2026-10-08.** The
  entire shelf-life frame, and `-2`, rest on a restatement Census's own word calls "tentatively
  scheduled".
- **The August-2026 reference month is deleted rather than delayed** — a `Suspended` row where a date
  belongs. 84/84 becomes 84/85 and Leg 3's central finding is overturned. (Funding is not the
  channel: PL 119-103 runs to 2026-12-11.)
- **The 2026-09-30 advance report omits August wholesale inventories.** It would leave this print
  with no preview to be redundant against, which is the one condition under which the "read 09-30,
  not 10-08" rule inverts.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-10-01.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it a live
  question.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-wholesale-trade-2026-10-08-1` — the 2026-10-08 GDPNow vintage moves the **Q3-2026 change in
  inventory investment** by **less than 0.10pp**. Score by 2026-10-08.
- `FT-wholesale-trade-2026-10-08-2` — the **August 2026 wholesale inventories level** published
  2026-10-08 differs by **0.05% or more** from the August 2026 value in the 2026-10-26 restatement.
  Score by 2026-10-27.
- `FT-wholesale-trade-2026-10-08-3` — the **August 2026 wholesale inventories m/m**, as printed on
  2026-10-08, differs from the 2026-09-30 advance estimate by **0.1pp or less**. Score by 2026-10-08.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-32 | **Initial research on an id that existed only as a proposal. Both of its grounds reproduce, the sibling's central nowcast finding survives an independent rebuild, and this edition turns out to be that sibling's mirror rather than its copy.** Canonical `src/domain/market-events/wholesale-trade-2026-10-08.json` written this session after reading the single proposal (`from-mtis-2026-10-15`), now shadowed. Date on two primaries fetched today: Census `calendar-listview.html` (`A202610081000`, period `A202608`, 10:00) and Atlanta Fed `PostedUpdates` — **"Wholesale trade" alone, a SOLO vintage**. Status stays `estimate` (no self-confirm; the page carries `Suspended` rows). **Leg 2 — the premise:** weight reproduces exactly from FRED (wholesale $944,710M / business $2,740,239M = **34.5%**, June 2026). Basis survives too, and *without* the inference the sibling needed: Census's notice, quoted verbatim, dates the 2023/2024 AIES restatement to **2026-10-26 10:00 EDT**, so this print's data has an **18-day shelf life** and is the last ordinary monthly release before it — settled by two dates, not by how a restatement propagates. Restatement size **carried** from `mwts-benchmark-revision-2026-10-26` (12 revisions, 126+ months each, median 172, **0.126%/month**) and explicitly **not** re-derived: ALFRED timed out and `www2.census.gov/wholesale/xls/mwts/` holds no vintage archive. That carried figure covers months **15+ months old**, so what a benchmark does to a month printed 18 days earlier is unmeasured — `-2` registers the gap. **Leg 3 — schedule:** seven Census calendar pages give **84 consecutive reference months, 2019-11 → 2026-10, zero suspensions**, **78 of 84** at lag 34–41 (median **39d**), 78 of 81 on days 6–10. The six exceptions are one lapse and its monotone recovery (2025-08 **82d** ← the archive maximum, 2025-09 72d, 2025-10 69d, 2025-11 60d, 2025-12 55d, 2026-01 47d). August editions ran 2020-10-09/39d, 2021-10-08/38d, 2022-10-07/37d, 2023-10-10/40d, 2024-10-09/39d, Aug-2025 lapse-displaced to 2025-11-21; **2026-10-08 is a 38d lag and a Thursday** (20 of 84). Every `Suspended` row in the archive belongs to the Advance Economic Indicators Report, Preliminary Steel Imports or the Advance Services Report — a **fifth** independent arrival at "Census cancels previews and keeps reports". **The corridor's headline schedule risk is already retired:** the FY2027 funding deadline sits **09-30**, eight days ahead, and August is the month a lapse has hurt worst — but PL 119-103 was signed **2026-09-02** through **2026-12-11** (carried), so this print is 64 days inside appropriations. **Leg 4 — nowcast, and the finding:** `ContribArchives` (1,871 vintages → 1,822 same-quarter deltas) joined on the release archive reproduces the family headline exactly — **78** wholesale vintages, median \|Δ inventories\| **0.0639pp** vs **0.0142pp** (permutation p<**0.0001**), \|Δ net exports\| **0.0012pp**, inventories larger on **72/78** vs a 62.0% base rate. The 11-09 sibling's classifier-collapse **replicates**: prior-quarter-month (n=25, 0.0872pp, 56.0%) and **postings 1st–6th of the round** (n=23, **0.0872pp, 56.5%**) are the same number on sets overlapping at **Jaccard 0.846**, against postings 7+ at 0.0418pp/85.5%. One correction: at the sibling's literal 1–5 boundary the overlap is only **Jaccard 0.423**, because prior-quarter vintages cluster at positions **5/6/7** — the finding holds, the boundary is one place off. Better name for the variable: **quarter-end vs mid-quarter reference month** (n=26, **0.0864pp**, 57.7% vs n=52, **0.0451pp**, 86.5%; permutation p=**0.024**) — the cause, of which posting position is the consequence. **And the by-month cut separates this edition from its sibling completely: August is the QUIETEST reference month in the archive — n=6, median 0.0280pp, 6/6 under 0.10pp, max 0.0652pp** (2020-10-09 0.0652 solo, 2021-10-08 0.0413 shared, 2022-10-07 0.0094 shared, 2023-10-10 0.0137 solo, 2024-10-09 0.0146 solo, 2025-11-21 0.0553 solo) — against **September at 0.1261pp / 50%**, July 0.0096/100%, March 0.1080/42.9%, June 0.0893/66.7%, December 0.0653/71.4%; wholesale-class p90 is **0.1885pp**. `-1` is registered in the **QUIET** direction, the deliberate mirror of the sibling's loud September registration, so the two dates adjudicate the mechanism together. **Leg 5 — session, on a changed metric:** Yahoo returned **429** on both hosts, Stooq served a JS challenge and WSJ **401**, so no high/low bars exist this session and the sibling's range study cannot be reproduced. Measured instead on **close-to-close absolute return, S&P 500 (FRED `SP500`), 1,424 sessions since 2021**: wholesale release days **0.610%** vs **0.554%** across all sessions (p=**0.50**) — a **fifth** null on this release class and the first on a non-SPY, non-range estimator; **Thursday n=286, 0.618%, p=0.081** (a *loud* lean); **Monday n=264, 0.442%, p=0.013**; **wholesale ∩ Thursday — this edition's shape — n=15, 0.580%, p=0.878, dead flat**, against wholesale ∩ Monday (the sibling's shape) n=9, **0.241%**. Nasdaq reproduces the ordering. **So the sibling's waiting-room reading must NOT be imported: 10-08 is an ordinary session**, with a 30y auction, a 20y/30y buyback and the ECB account on it and FOMC minutes the afternoon before — none a channel to a series with no symbols. **Content:** 18 Wayback captures of `census.gov/wholesale/current` yield **8 advance→full pairs** reproducing the sibling to three decimals — Oct-22 +0.8→+0.5, Feb-23 +0.2→+0.1, Sep-23 0.0→+0.2, Dec-23/Feb-25/Dec-25 unrevised, Jul-25 +0.2→+0.1, Jun-26 +0.3→+0.2 — **mean \|rev\| 0.100pp, median 0.100pp, max 0.300pp, unrevised 3/8, ≤0.1pp 6/8, sign flips 0/8**; two crawls agreeing retires the sibling's "whatever the crawler caught" caution. **But no August-reference pair exists in the sample**, so `-3` rides a class rate never observed in this print's own month. CB26-120 (June data, re-read): sales **$794.1B** (−3.0% m/m, +14.1% y/y), inventories **$944.7B** (+0.2%, CI includes zero), **I/S 1.19** vs 1.30 — **19.8th percentile** since 1992 (16.7th since 2010, FRED `WHLSLRIRSA`, 414 months). August base rates: inventories m/m median **+0.482%** since 2010 (12/16 positive); the I/S ratio at or below June's **61.8%** of the time (n=34) — no ratio test registered, the sibling's `-3` owns that question. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** PCE + Q2 GDP third + funding deadline 09-30, ISM mfg 10-01, jobs 10-02, ISM services 10-05, FT-900 10-06, FOMC minutes 10-07 precede; CPI 10-14 and PPI 10-15 follow. **Volatility:** VIX **14.32** (2026-09-03 close, **FRED `VIXCLS`** — one day staler and a different source than the sibling's 14.53, stated not smoothed), S&P 500 **7,718.60** (09-04). **Geopolitical:** PL 119-103 to 12-11; IMF/World Bank meetings 10-12; OPEC JMMC 10-04. **Event tape:** no August consensus at D-32; the 09-30 advance report sets the headline. **One dated event proposed** (own file, `estimate`): `construction-spending-2026-10-01` (August data, `A202610011000`, sharing a GDPNow vintage with the tracked ISM print — the same tracked-ISM/untracked-Census hole the 11-09 sibling found one cycle later; 11-02 and 12-01 already exist, so this completes a run). **Two declined on the record:** Business Formation Statistics 10-14 (`A202610141000`, no nowcast vintage), the July-data wholesale print 09-10 (real and untracked, but four days out — it would age out before any assessment reached it); every other Census release in the ±7-day window is already tracked or already proposed. **Sources blocked and recorded (eight):** Yahoo ×2 (429), Stooq (JS challenge), WSJ (401), ALFRED ×2 (timeout / HTTP2 reset), `www2.census.gov/wholesale/releases/historical/` (404), `timeseries1.xlsx` (404). Also recorded for the next session: the Atlanta Fed workbook path in sibling ledgers now 404s — the live one is `/-/media/Project/Atlanta/FRBA/Documents/cqer/…`. **Three forward tests registered:** `-1` (Q3 inventories move **<0.10pp**, QUIET, base rate 6/6), `-2` (the printed August level does **not** survive the 10-26 restatement to within 0.05% — the corridor's unmeasured gap), `-3` (August m/m within 0.1pp of the 09-30 advance estimate, class base rate 6/8, never observed in August). | **Initial stance set: stand aside; both proposal grounds reproduce and the basis one needs no inference here, this print's numbers have an 18-day shelf life, the sibling's nowcast finding survives an independent rebuild but is better named quarter-end-vs-mid-quarter, August is the archive's quietest reference month where September is its loudest, and the 10-08 session carries none of the sibling's quiet — it is ordinary.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-wholesale-trade-2026-10-08.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
