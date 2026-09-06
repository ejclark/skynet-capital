# Industrial Production and Capacity Utilization (G.17, November 2026 data) — industrial-production-2026-12-16

**Kind:** macro-print · **Date:** 2026-12-16 (**confirmed**, two independent Federal Reserve primaries fetched direct 2026-09-06 — the Board's announcements feed `federalreserve.gov/feeds/g17.html`, verbatim "In 2026, the G.17 release … will be published at 9:15 a.m. on … November 17, and December 16", and the Board's own release-date table `releases/g17/release_dates.htm`, row "December 2026 | 16-December-2026", a table now maintained through July 2027. Promoted from the `estimate` the `industrial-production-2026-11-17` sweep filed, which said in its own notes that this id's initial research should read the primaries and promote it) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-decision-2026-12-18","boj-tankan-2026-12-14","cr-expiry-2026-12-11","ecb-decision-2026-12-17","g20-miami-2026-12-14","government-funding-deadline-2026-12-11","housing-starts-2026-12-17","import-export-prices-2026-12-17","intl-transactions-q3-2026-12-18","japan-cpi-2026-12-18","mtis-2026-12-16","opex-2026-12-18","pending-home-sales-2026-12-17","pjm-capacity-auction-2026-12","ppi-2026-12-15","puct-batch-zero-report-open-meeting-2026-12-17","retail-sales-2026-12-16"],"screenStreak":0,"blocked":[{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=INDPRO","status":"ETIMEDOUT","at":"2026-09-06"},{"url":"https://query1.finance.yahoo.com/v8/finance/chart/SPY","status":"429","at":"2026-09-06"},{"url":"https://query2.finance.yahoo.com/v8/finance/chart/SPY","status":"429","at":"2026-09-06"},{"url":"https://stooq.com/q/d/l/?s=spy.us&i=d","status":"200-js-challenge-no-data","at":"2026-09-06"},{"url":"https://www.federalreserve.gov/releases/g17/ipdisk/util_sa.txt","status":"404","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **This is the quiet twin of a loud print, and the thing worth watching is whether it
publishes at all.** Its sibling one month earlier — [`industrial-production-2026-11-17`](industrial-production-2026-11-17.md) —
measured its own vintage class as *the loudest in the whole study* (median \|ΔGDP nowcast\|
**0.5833pp**, n=12) and left this December twin as an open control. This session ran the control.
**December G.17 vintages move the GDP nowcast a median 0.1872pp (n=12) against that 0.5833pp,
permutation p=0.0028** — about three times quieter — and against the 1,679 ordinary vintages they are
**not distinguishable at all (p=0.0730)**. The mechanism is structural rather than seasonal: **11 of
the 12 December G.17s on record carry a November reference month**, i.e. **month 2** of the quarter
GDPNow is nowcasting, and the one exception was produced by a government shutdown. The report's own
Equipment channel **never reached 0.10pp in any of the 12** (max 0.0661) and PCE outmoved it **12 of
12**. The tape agrees and goes further: the overnight-gap elevation the sibling found across all G.17
days (0.4156% vs 0.2874%, **p=0.0016**) **does not survive into this print's exact class** —
month-2-with-retail reads **0.2980% at p=0.9052 (n=18)**, dead flat. So the number is a non-event, and
the live variable is **publication**. PL 119-103 funds through **2026-12-11**; a lapse begins **00:00
Sat 2026-12-12** and this 09:15 Wednesday release sits on **day 5** of it — precisely the exposure the
November ledger reasoned it was clear of. Three lapses sit in the Board's own archive and gave three
different outcomes, and the separating variable is **BLS**, not the Fed: 2013 (16 days) **delayed** the
release 11 days, 2018-19 (35 days, partial, BLS funded) **did not touch it**, 2025 (43 days) **deleted
two editions and folded the 2025-12-16 slot into 12-23**. This print's dominant BLS input — the
November employment situation, [`jobs-2026-12-04`](jobs-2026-12-04.md) — publishes **eight days before
the cliff**. Date is **confirmed**; `symbols: []`; nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-101) | **Stand aside** | High | `symbols: []`, 101 days out, no November data in existence, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed — a re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** macro hits today. No instrument attaches to this event on any date, and promoting the date to `confirmed` changes that not at all. | A macro-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-12-01** — none exists today |
| This week | **Stand aside — the series has nothing in the week** | High | The current published edition is **July 2026** data (released **2026-08-18**): IP and manufacturing **each +0.2%** m/m, total IP **103.0%** of its 2017 average, **+1.1%** y/y, capacity utilization **76.3%**. The next G.17 is **2026-09-18** (August data), twelve days out, standalone, with **no scheduled GDPNow vintage**. VIX **14.53** (2026-09-04 close, CBOE). | The Board moving or cancelling the **2026-09-18** slot on `release_dates.htm` before that date — the table's only `NA` rows in six years are the two the 2025 lapse produced |
| This month | **Watch two dates, neither of them this one: the annual revision, and 2026-12-11** | Medium | The Board announced on **2026-05-15** that its annual revision — **2022 base year**, 2023 Census manufacturing benchmark, capacity through Q4-2025 — lands "in the autumn of 2026" and **has still named no date**. Autumn ends **2026-12-21**, five days *after* this print, so unlike the 11-17 edition the base case here is that this is a **post-revision** print. Separately, the CR expiry on **12-11** is what decides whether 12-16 happens on 12-16. | The Board announcing an annual-revision date **on or after 2026-12-17**, which would leave this print pre-revision and void the "first monthly on a 2022 base" framing |
| This quarter | **Treat 2026-12-16 as an ordinary Wednesday of opex week, and the publication risk as the only live question** | Medium | December G.17 sessions are a flat null on both windows a 09:15 print could own: \|gap\| **0.4186%** at **p=0.2207** and range **0.7633%** at **p=0.5605** (n=11, SPY 2016-09→2026-09, baseline n=2,396), and this print's exact vintage class reads \|gap\| **0.2980%** at **p=0.9052**. **8 of the 9 pre-lapse December editions landed 0–3 days before quad witching**; 2026-12-16 is **2 days** before **2026-12-18**. | SPY's 2026-12-16 session range reaching **2.1475%** (the baseline p90) *or* the 12-16 vintage moving \|ΔEquipment\| **above 0.10pp** — neither has happened on any of the 12 December vintages on record |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, no macro-keyed playbook,
  no instrument. A `confirmed` date licenses an *assessment schedule*, never an entry.
- **The one thing to watch is the calendar, not the tape: does 2026-12-16 publish on 2026-12-16?**
  A lapse begins **00:00 Sat 2026-12-12** and this print sits on **day 5**. Registered as `-3`.
- **The lapse question has a measured answer shape, and it is BLS, not the Fed.** The Board's own
  explanatory notes: where physical-product data are unavailable, output is inferred from
  *"production-worker hours … collected in the monthly establishment survey conducted by the Bureau
  of Labor Statistics."* Through the **35-day** 2018-19 partial shutdown, in which BLS was funded and
  Census was not, the G.17 published **exactly on its scheduled date** (2019-01-18, December data).
  Through 2013 (16 days) and 2025 (43 days), where BLS stopped, the release slipped 11 days and lost
  two whole editions respectively. **This print's BLS input publishes 2026-12-04**, eight days early.
- **The December edition is the month-2 edition, by construction.** 11 of 12 December G.17 vintages
  carry a November reference month; the exception, 2025-12-03, was a shutdown catch-up. Month-2
  vintages move \|ΔGDP\| **0.2007pp** (n=46) against month-1's **0.3515pp** (n=44), and on the report's
  own channel the decay is sharper and cleaner: \|ΔEquipment\| **0.0173pp** vs **0.0399pp**, **p=0.0002**.
- **The sibling's loudest class is specifically not this one.** December G.17 **0.1872pp** (n=12) vs
  the November shape's **0.5833pp** (n=12), **p=0.0028**; December vs all 1,679 non-G.17 vintages,
  **p=0.0730**. Registered as `-4` as a paired test on the two 2026 vintages.
- **Strip the 08:30 retail print out and the month-2 class is an ordinary day.** Month-2 with retail
  **0.4147pp** (n=18) vs without **0.1096pp** (n=28), p=0.0001; without-retail against ordinary
  vintages, **p=0.4324**.
- **The report's quietest nowcast channel is its fastest-growing market group** — Business equipment
  IP ran **96.3 → 100.4** Feb→Jul 2026 and is **+6.6% y/y**, the strongest major market group on the
  page, while consumer goods is **−1.8% y/y**. Growth in the series and movement in the nowcast are
  different things, and this event is evidence of the difference.
- **The number to read on the day — capacity utilization, not the m/m.** Total utilization is
  **76.29%**, **3.13pp** below the 1972–2025 mean of 79.41% and the **20.1st percentile** of 715
  months since 1967; manufacturing output sits at **99.31**, i.e. **0.69% below its own 2017 average**
  nine years later. All of it pre-revision, on a 2017 base the Board has announced it will replace.
- **What this ledger declines to register, and why.** The sibling registered October's seasonal tilt
  (median **−0.340%** m/m, p=0.0783) at low confidence. **November's own tilt does not survive the
  same test**: median **−0.178%** against **+0.007%** for other months, up **4 of 9**, permutation
  **p=0.4492**. No forward test is registered on it. A refusal is a call.
- **Watch (dated)** — August data **09-18** (standalone, no GDPNow vintage) · September data **10-16**
  (same) · GDPNow rolls to Q4 **10-29** · **the annual revision, autumn 2026, still undated** · October
  data and the sibling print **11-17** · jobs (November) **12-04** · FOMC **12-09** · CPI **12-10** ·
  **CR expiry 12-11** · PPI **12-15** · advance retail **12-16** 08:30 · **this print 12-16** 09:15 ·
  MTIS **12-16** 10:00 · **quad witching 12-18** · autumn ends **12-21** · December data **2027-01-15**.

## Initial research

### The question, plainly

The `industrial-production-2026-11-17` lane proposed this id and named the reason precisely: 2026-12-16
carries three releases in one GDPNow vintage, the calendar tracked two of them, and this one is *"the
natural control for the November print — same 09:15 hour, same retail co-release, but November 2026
data is month 2 of the nowcast quarter rather than month 1."* That lane measured its own class as the
loudest in its study and could not measure this one, because this vintage does not exist yet.
**Does the control hold — is the December twin quieter than the November print, and by how much? And
is there anything about 12-16 that the November analysis could not have seen?**

**One-line verdict:** the control holds and the gap is larger than the month-position table implied
(0.1872pp vs 0.5833pp, p=0.0028), and yes — there is one thing 11-17 could not see, because it did not
apply to 11-17: **this is the print the funding cliff actually reaches.**

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target. Eight
inputs, all fetched direct on 2026-09-06:

1. **`federalreserve.gov/feeds/g17.html`** (HTTP 200, 614,006 bytes) — the Board's announcements feed,
   parsed row-wise into **189 actual release dates, 2010-10-18 → 2026-08-18**, each read off a dated
   "G.17 Data for *&lt;month&gt;* are now available" announcement, plus every annual-schedule, delay and
   annual-revision notice back to 2005. **Primary** for every date, every reference-month mapping and
   every lapse claim below.
2. **`federalreserve.gov/releases/g17/release_dates.htm`** (HTTP 200, 117,098 bytes) — the Board's own
   release-date table, an independent second primary.
3. **`federalreserve.gov/releases/g17/current/default.htm`** (HTTP 200, 115,934 bytes) — the current
   release, July 2026 data, for the primary content read.
4. **`federalreserve.gov/releases/g17/IpNotes.htm`** (HTTP 200, 100,620 bytes) — the Board's
   explanatory notes, which name the source-data dependencies Leg 4 turns on.
5. **`releases/g17/ipdisk/ip_sa.txt`** (200, 2,746,416 bytes) and **`ipdisk/cap_sa.txt`** (200, 507,938
   bytes) — the Board's own seasonally-adjusted index and capacity files, **321 and 57 series**, used
   in place of FRED (see the fetch-failure note below).
6. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed, at the `/-/media/Project/Atlanta/FRBA/…` path the
   November sibling identified) — `PostedUpdates`, **82** dated rows, 2025-12-23 → 2026-12-23.
7. **`GDPTrackingModelDataAndForecasts.xlsx`** — `ContribArchives`, **1,871 vintages 2014-05-01 →
   2026-07-28 = 1,822 same-quarter deltas**, joined to input 1 **on release date**; the sheet's
   free-text `Data releases` column is used only to classify co-releases.
8. **CBOE `VIX_History.csv`** (200, 472,309 bytes, 9,266 sessions from 1990) and **Nasdaq's historical
   API** for SPY and QQQ (**2,514 sessions, 2016-09-06 → 2026-09-04**), with 20,000-iteration
   permutation tests on medians throughout.

Plus **a re-run grep** of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
any macro-keyed hook — **0 hits**, reproducing every sibling ledger's finding today.

**Five fetch failures are recorded in `probe-ref.blocked`, and the substitutes are better primaries than
what they replaced.** FRED's `fredgraph.csv` returned **ETIMEDOUT** on six attempts across two runs —
the reverse of the November sibling's session, which recorded FRED responding 200 where its own sibling
had seen a timeout two hours earlier; this source is intermittent from this lane's runners and neither
observation generalises. Yahoo's chart API returned **429** on all six attempts across `query1` and
`query2`, and both Stooq mirrors answered 200 with a JavaScript challenge and no data. So **every IP,
capacity and utilization number in this ledger comes from the Board's own `ipdisk` flat files rather
than FRED, and every price number from CBOE and Nasdaq rather than Yahoo** — and the swap is a
cross-validation, not a compromise: the Board's files reproduce the sibling's FRED-sourced levels
**to the decimal** (utilization 76.29%, 3.13pp below the 79.41% long-run mean, 20.1st percentile of 715
months, manufacturing 99.31 = −0.69% vs its 2017 average), and CBOE/Nasdaq reproduce its Yahoo closes
exactly (VIX **14.53**, SPY **770.19**, QQQ **718.96** on 2026-09-04). Two costs are honest to state:
the Nasdaq API caps at ten years, so **this ledger's tape window is 2016-09 → 2026-09 (baseline
n=2,396) against the sibling's 2014-05 → 2026-09 (n=2,961)** — a shorter, partly overlapping window
that re-tests the sibling's tape claims rather than merely restating them — and `ipdisk/util_sa.txt`
**404s**, so utilization is computed as index ÷ capacity from the two files that do serve.

### Leg 1 — the release exists on 2026-12-16 at 9:15 a.m., and the date promotes to `confirmed` · **SUPPORTED**, on two Board primaries

The announcements feed states the year's schedule in one sentence: *"In 2026, the G.17 release on
Industrial Production and Capacity Utilization will be published at 9:15 a.m. on January 16, February
18, March 16, April 16, May 15, June 15, July 17, August 18, September 18, October 16, November 17, and
**December 16**."* The Board's release-date table lists the same date independently, and it has since
been extended a full year further:

| Release month | Date, per the Board's own table |
|---|---|
| September 2025 | 16-September-2025 |
| **October 2025** | **NA** |
| **November 2025** | **NA** |
| December 2025 | **03-December-2025 and 23-December-2025** |
| … | … |
| November 2026 | 17-November-2026 |
| **December 2026** | **16-December-2026** |
| January 2027 | 15-January-2027 |
| … through July 2027 | maintained |

**One correction to how a sibling read this table.** Its rows are keyed by **release month, not
reference month** — which is why December 2025 shows two dates (both the 12-03 and 12-23 releases fell
in it) and why October and November 2025 read `NA` (no release occurred in either calendar month). The
December 2025 *reference month* was published on 2026-01-16. Nothing in either ledger's conclusions
turns on this; it changes what the `NA` rows mean from "a cancelled month of data" to "a month in which
the series did not publish at all," which is if anything the sharper reading.

The feed also carries the **2027** schedule (*"January 15, February 17, March 15, April 15, May 17,
June 16, July 16, August 17, September 16, October 18, November 17, and December 16"*), so this date
sits inside a two-year forward calendar rather than at its edge. The promotion is what the proposal
asked for: the November lane filed `estimate`, said it could not self-confirm an in-sweep discovery,
and deferred to *"its own initial research … on the same two Federal Reserve primaries this one
cites."* This is that session. The Board's verb is **"will be published"**, not the "anticipated" that
correctly keeps the Census siblings at `estimate`.

### Leg 2 — the December edition is the month-2 edition by construction, not by coincidence · **SUPPORTED**, and it is why the control is clean

Joining the Board's 189-date archive to `ContribArchives` gives **143** G.17 release dates carrying a
same-quarter GDPNow delta; on **141 of the 143** the Atlanta Fed's own free text independently names
industrial production, so the two sources cross-validate without either being assumed. Twelve of those
143 fall in December:

| Vintage | Reference month | \|ΔGDP\| | \|ΔPCE\| | \|ΔEquipment\| | What shared the vintage |
|---|---|---|---|---|---|
| 2014-12-15 | 2014-11 | 0.3268 | 0.0439 | 0.0405 | industrial production |
| 2015-12-16 | 2015-11 | 0.0316 | 0.0243 | 0.0239 | + housing starts |
| 2016-12-14 | 2016-11 | 0.1664 | 0.0978 | 0.0226 | **+ retail trade**, PPI |
| 2017-12-15 | 2017-11 | 0.1842 | 0.0686 | 0.0182 | industrial production |
| 2018-12-14 | 2018-11 | 0.4951 | 0.5199 | 0.0135 | **+ retail trade** |
| 2019-12-17 | 2019-11 | 0.3908 | 0.1973 | **0.0661** | + housing starts |
| 2020-12-15 | 2020-11 | 0.1995 | 0.1871 | 0.0082 | + import/export prices |
| 2021-12-16 | 2021-11 | 0.1902 | 0.1513 | 0.0059 | + housing starts |
| 2022-12-15 | 2022-11 | 0.3571 | 0.1981 | 0.0294 | **+ retail trade**, CPI, import/export |
| 2023-12-15 | 2023-11 | 0.0248 | 0.0181 | 0.0065 | industrial production |
| 2024-12-17 | 2024-11 | 0.1530 | 0.0069 | 0.0064 | **+ retail trade** |
| **2025-12-03** | **2025-09** | 0.0078 | 0.0131 | 0.0039 | *the shutdown catch-up* |
| **median** | — | **0.1872** | **0.0832** | **0.0159** | — |

**Eleven of the twelve carry a November reference month.** The December G.17 is not *sometimes* the
month-2 print; it is *structurally* the month-2 print, and the single year it wasn't, the reason was a
government shutdown — which is this ledger's other subject, arriving in its own evidence table
uninvited.

That matters because the reference-month position is where the movement lives, and this session
re-derives the sibling's table on the same data:

| Reference-month position | n | \|ΔGDP\| | \|ΔPCE\| | \|ΔEquipment\| |
|---|---|---|---|---|
| month 1 of the nowcast quarter (**the 11-17 sibling**) | 44 | **0.3515pp** | 0.1419pp | **0.0399pp** |
| **month 2 (this print)** | **46** | **0.2007pp** | 0.0994pp | **0.0173pp** |
| month 3 | 48 | 0.0975pp | 0.0654pp | 0.0071pp |

Month 1 against month 2 is **p=0.0680** on \|ΔGDP\| — suggestive — but on **the report's own channel it
is decisive: \|ΔEquipment\| p=0.0002.** Whatever the G.17 contributes to a nowcast, it contributes
roughly **2.3× less** in December than in November, and that separation is the cleanest number in this
ledger.

### Leg 3 — the December twin is measurably quieter than the November print · **SUPPORTED**, and this is the control the sibling could not run

| Class | n | median \|ΔGDP\| | \|ΔPCE\| | \|ΔEquipment\| | \|Δinventories\| |
|---|---|---|---|---|---|
| **December G.17 vintages (this print)** | **12** | **0.1872pp** | 0.0832pp | **0.0159pp** | 0.0582pp |
| **November-shape (retail + imp/exp + IP, month 1)** | **12** | **0.5833pp** | 0.3800pp | 0.0338pp | 0.1023pp |
| every non-G.17 vintage | 1,679 | 0.0862pp | 0.0054pp | 0.0034pp | 0.0118pp |
| permutation p, December vs November-shape | — | **0.0028** | — | — | — |
| permutation p, December vs non-G.17 | — | **0.0730** | — | — | — |

**The sibling's class is the loudest in the study; this one is not distinguishable from an ordinary
day.** That is the control holding, and holding harder than the month-position table alone predicted —
n=12 against n=12, p=0.0028.

Two properties of the December class are worth registering separately, because they are the ones a
forward test can score. **\|ΔEquipment\| never reached 0.10pp in any of the twelve** (max **0.0661**, at
2019-12-17), and **PCE outmoved Equipment on 12 of 12** — against a 70.3% base rate among ordinary
vintages and 124 of 143 (86.7%) across all G.17 days. The report moves the nowcast; it does not move
the nowcast's headline, and in December it barely moves the nowcast.

Now the counterfactual, run inside the month-2 class rather than across all G.17 days:

| Month-2 G.17 vintages, split by co-release | n | \|ΔGDP\| | \|ΔPCE\| | \|ΔEquipment\| |
|---|---|---|---|---|
| **with the 08:30 retail-sales report** (the 12-16 configuration) | **18** | **0.4147pp** | 0.3747pp | 0.0225pp |
| **without it** | **28** | **0.1096pp** | 0.0401pp | 0.0159pp |
| permutation p, the two against each other | — | **0.0001** | — | — |
| **without-retail vs all 1,679 non-G.17 vintages** | — | **p=0.4324** | — | — |
| with-retail vs all non-G.17 vintages | — | **p<0.0001** | — | — |

Same verdict as the sibling reached across all G.17 days, now specific to this print's own position: a
month-2 G.17 vintage with no retail co-release **moves the GDP nowcast no more than an ordinary day**.
The 12-16 configuration *does* have the retail co-release, which is why its class reads 0.4147pp — and
which is exactly why none of that loudness is attributable here. Narrowing to the precise 12-16 shape
(retail **and** inventories **and** IP, month 2, **no** import/export prices — that pair moved to 12-17
this year) gives **11** instances at a median **0.4231pp**, in which **\|ΔEquipment\| never exceeded
0.0569pp and PCE outmoved Equipment 11 of 11.**

### Leg 4 — the funding cliff reaches this print, and the archive says what that does · **SUPPORTED**, and it is this ledger's live question

The November edition's ledger closed this door for itself in one line: *"PL 119-103 funds through
2026-12-11, i.e. after this print, so the lapse exposure that cancelled the October and November 2025
editions does not reach this one."* It reaches this one. A lapse begins **00:00 Saturday 2026-12-12**
and 2026-12-16 is **day 5**.

The Board is not appropriations-funded and does not itself close, so the mechanism is second-order,
and the Board states it in its own cancellation notices: *"The industrial production indexes … incorporate
a range of data from other government agencies, the publication of which has been delayed as a result
of the federal government shutdown."* Its explanatory notes name which agency matters most: where
physical-product data are unavailable, *"estimates of output are based on production-worker hours by
industry. Data on hours worked by production workers are collected in the monthly establishment survey
conducted by the Bureau of Labor Statistics."* For a first estimate, *"about 78 percent of the source
data (in value-added terms) are available."*

Three federal funding lapses sit inside the Board's 189-date archive, and they produced three different
outcomes:

| Lapse | Length | What happened to the G.17 | Board's notice |
|---|---|---|---|
| **2013-10-01 → 10-17** | 16 days | September data slipped **2013-10-17 → 2013-10-28** (+11 days); back on schedule by 11-15 | 2013-10-18, the day after the lapse ended |
| **2018-12-22 → 2019-01-25** | 35 days, **partial** | **Nothing.** December data published **2019-01-18 — its scheduled date — inside the shutdown**, and every month after was on time | none needed |
| **2025-10-01 → 11-12** | 43 days | **10-17 cancelled** (Sept data → 12-03, +47d); **11-18 cancelled** (Oct data → 12-23); **the 2025-12-16 slot itself cancelled** (Nov data → 12-23, +7d), the two months published together | 2013-style notices on **10-10**, **11-14** and **12-03** |

The separating variable is not lapse length; it is **whether BLS stopped**. The 2018-19 shutdown was
partial and left BLS funded, and the G.17 published on its scheduled day *inside* it. 2013 and 2025
took BLS down, and the G.17 went with it — in 2025 so thoroughly that the notice cancelling the
**11-18** release landed on **11-14, two days after funding was restored**, because the source-data
queue had not cleared. **The exposure outlives the lapse.**

Applied to 12-16: **this print's dominant BLS input is the November employment situation, scheduled
2026-12-04** — eight days before the cliff, and already in hand when a 12-12 lapse would begin. That is
precisely what was not true in 2025, where the lapse began 10-01, *before* the September employment
report could publish. So the base case is that a 12-12 lapse does **not** stop this print, and the
first edition genuinely at risk is the **December-data release due 2027-01-15**, whose CES input would
fall inside the lapse. Registered as `-3`, and stated at medium confidence rather than high, because
the 2025 precedent for this exact slot — the 2025-12-16 release, cancelled — is one row away in the
same table.

### Leg 5 — the 09:15 print moves the pre-open tape on a December morning · **REFUTED**, on a window that is not the sibling's

09:15 sits inside the close-to-open window, so the overnight gap is the one measure a G.17 could own.
SPY, **2016-09-07 → 2026-09-04**, baseline **n=2,396**, 20,000-iteration permutation tests on medians —
a shorter and only partly overlapping window from the sibling's, which makes this a re-test rather than
a restatement:

| Class | n | median \|overnight gap\| | p | median session range | p |
|---|---|---|---|---|---|
| **All G.17 days** | **117** | **0.4156%** | **0.0016** | 0.8100% | 0.2495 |
| — with the 08:30 retail report | 57 | 0.4285% | **0.0065** | 0.9927% | 0.2532 |
| — without retail | 60 | 0.3725% | 0.0797 | 0.7208% | 0.0780 |
| — **month 1 (the sibling's class)** | 34 | **0.4251%** | **0.0340** | 0.8273% | 0.6051 |
| — **month 2 (this print's class)** | 37 | 0.4144% | 0.0473 | 0.7794% | 0.3454 |
| — **month 2 + retail (the exact 12-16 class)** | **18** | **0.2980%** | **0.9052** | 0.9313% | 0.7882 |
| — **December G.17 days** | **11** | 0.4186% | **0.2207** | 0.7633% | 0.5605 |
| Baseline | 2,396 | 0.2874% | — | 0.8867% | — |

The sibling's headline result reproduces on a different window — G.17 days gap wider than baseline, and
the retail co-release carries it. **But it does not survive into this print's exact class.**
Month-2-with-retail — the precise configuration of 2026-12-16 — reads **0.2980% against a 0.2874%
baseline at p=0.9052**, which is as flat as a result gets, and December G.17 days as a group read
p=0.2207. **No class in the table separates on session range at all.** The individual December
sessions, one per year:

| Date | Ref month | \|gap\| | Range | Return |
|---|---|---|---|---|
| 2016-12-14 | 2016-11 | 0.154% | 1.268% | −0.83% |
| 2017-12-15 | 2017-11 | 0.079% | 0.619% | +0.32% |
| 2018-12-14 | 2018-11 | 0.908% | 1.605% | −1.85% |
| 2019-12-17 | 2019-11 | 0.132% | 0.241% | +0.02% |
| 2020-12-15 | 2020-11 | 0.751% | 0.993% | +1.35% |
| 2021-12-16 | 2021-11 | 0.419% | 1.730% | −0.88% |
| 2022-12-15 | 2022-11 | 1.277% | 1.890% | −2.45% |
| 2023-12-15 | 2023-11 | 0.534% | 0.698% | −0.57% |
| 2024-12-17 | 2024-11 | 0.429% | 0.378% | −0.41% |
| 2025-12-03 | 2025-09 | 0.141% | 0.763% | +0.35% |
| 2025-12-23 | 2025-10/11 | 0.133% | 0.629% | +0.46% |

Nine of eleven under a 1.90% range; QQQ reproduces the null (**p=0.7456** on gap, **p=0.3363** on
range). Baseline percentiles for the falsifiers below: session range p50 **0.8867%**, p75 **1.3771%**,
p90 **2.1475%**, p95 2.7982%; \|gap\| p50 0.2874%, p75 0.5492%, p90 0.9493%.

**One structural feature the November edition does not share: this is an opex-week print.** Distance
from each December G.17 to that year's quad witching: 2 · 0 · 7 · 3 · 3 · 1 · 1 · 0 · 3 days — **8 of
the 9 pre-lapse editions inside three days**, two of them *on* quad witching itself. 2026-12-16 is **2
days before 2026-12-18**. This is context for reading the tape that day, not a finding about the
release: nothing in the table above separates, and any December G.17 session range is measuring opex
week at least as much as it is measuring a 09:15 print.

### Primary content read — what the last published edition says, and the revision hanging over it

The current release (2026-08-18, July 2026 data) reads: IP and manufacturing production **each grew 0.2
percent** in July after **+0.3%** in June; mining **+0.2%**, utilities **+0.5%**; manufacturing
excluding motor vehicles and parts **+0.4%**. **Total IP at 103.0% of its 2017 average, +1.1% y/y.**
Capacity utilization **76.3%**, *"3.1 percentage points below its long-run (1972–2025) average."*

Computed from the Board's own `ipdisk` files rather than quoted, the level statements sharpen:

- Total capacity utilization is **76.29%**, **3.13pp** below the 1972–2025 mean of **79.41%** and the
  **20.1st percentile** of **715** months since 1967. Manufacturing utilization is **75.96%**, 2.16pp
  below its own 78.12% mean.
- Manufacturing output (`GMF`) is **99.31** against its own 2017 average of 100.0 — **0.69% below where
  it was nine years ago.** That is the post-revision picture, after the **2025-11-24** annual revision
  put manufacturing output at *"declines more than 1-1/2%, on net, from Feb 2020 through Aug 2025,
  whereas output was previously estimated to have risen over that period."*
- **The composition is more interesting than the headline.** Business equipment ran **96.3 → 100.4**
  from February to July 2026 and is **+6.6% y/y** — the strongest major market group on the page —
  while consumer goods is **−1.8% y/y**. The channel GDPNow bridges to equipment investment is the
  fastest-growing thing in the report *and* the smallest mover in the nowcast. Growth in a series and
  movement in an estimate of a series are different quantities, and this event is the cleanest example
  of the difference in this calendar.
- Momentum is unremarkable: ex-COVID (2015+, excluding 2020-21) the median month is **−0.002%** with an
  0.515 sd, and only **30.4%** of months land inside ±0.20pp. Last fourteen m/m: +0.51, +0.41, −0.26,
  +0.04, −0.44, −0.18, +0.45, −0.45, +0.86, −0.15, +0.75, −0.01, +0.27, +0.20.

**And the seasonal asymmetry this ledger declines to register.** The sibling found October — its own
reference month — running a median **−0.340%** m/m against +0.034% for other months, down 7 of 9,
permutation p=0.0783, and registered it at low confidence. This session reproduces that number exactly
(**−0.340%, p=0.0887**) and then runs the same test on **November**, this print's reference month:

| | n | median m/m | up months | permutation p |
|---|---|---|---|---|
| October (the sibling's month) | 9 | **−0.340%** | 2 / 9 | 0.0887 |
| **November (this print's month)** | **9** | **−0.178%** | **4 / 9** | **0.4492** |
| every other month | 106 | +0.007% | 50.0% base | — |

The individual November readings are −0.74, −0.42, +0.24, +0.08, +0.50, −0.29, +0.39, −0.18, −0.18 —
a coin flip. **No forward test is registered on November seasonality**, and the absence is deliberate:
the honest thing a sibling's suggestive result earns in the next ledger is a re-test, not an inherited
prior.

**The open question the November ledger flagged, one month closer to its deadline.** On **2026-05-15**
the Board announced: *"The Federal Reserve Board plans to issue its annual revision to the indexes of
industrial production (IP) and the related measures of capacity utilization in the autumn of 2026. The
base year for the revised indexes will be 2022. New annual benchmark data for manufacturing from the
Census Bureau for 2023 will be incorporated…"* — capacity revised through Q4-2025 from the Census
Quarterly Survey of Plant Capacity Utilization. **No date has been announced as of 2026-09-06.** The
recent record:

| Revision year | Window the Board announced | Date announced | Published |
|---|---|---|---|
| 2021 | — | — | 2021-05-28, noon EDT, standalone |
| 2022 | — | — | 2022-06-28, noon EDT, standalone |
| 2023 | "the spring of 2023" | 2023-03-28 named in advance | 2023-03-28, noon EDT, standalone |
| 2024 | — | — | 2024-06-28, standalone; superseded the 06-18 monthly |
| **2025** | "the fourth quarter of 2025" | **2025-11-12** (12 days' notice) | **2025-11-24**, noon EST, standalone |

Two things follow, and they point in opposite directions for this ledger against its sibling's. Every
revision since 2021 was a **standalone noon release**, never folded into a 9:15 monthly — 5 of 5 — so
the base case for 12-16 being an ordinary monthly print is strong. But **autumn 2026 ends 2026-12-21**,
five days *after* this print, and the Board has hit its stated window every time it has stated one. So
where the 11-17 ledger's base case was "this is a pre-revision print", **this ledger's base case is
that 12-16 is a post-revision print** — the first or second monthly on a **2022 base year** with
restated history — and every level, percentile and base rate above is arithmetic about a series that
will by then have been re-estimated. Registered as `-5`.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`.
- **Macro surprises** — none since the last row; there is no last row. The corridor is dense: jobs
  (November data) **12-04**, FOMC **12-09**, CPI **12-10**, **CR expiry 12-11**, BoJ Tankan and G20
  Miami **12-14**, PPI **12-15**; advance retail 08:30, **this print 09:15** and MTIS 10:00 all on
  **12-16**; ECB, housing starts, import/export prices and pending home sales **12-17**; BoJ decision,
  Japan CPI and **quad witching 12-18**. This print lands **seven days after the December FOMC** and
  fourteen before its minutes (12-30) — it grades the decision, it cannot inform it.
- **Volatility regime** — VIX **14.53** (2026-09-04 close, CBOE `VIX_History.csv`, the primary); the
  prior five closes ran 14.43 / 14.92 / 16.34 / 15.20 / 14.32. SPY **770.19**, QQQ **718.96** same close
  (Nasdaq). Baseline reading; nothing to diff against yet.
- **Geopolitical / policy** — the funding cliff (Leg 4) is the item. Beyond it: the China retaliation
  suspension expires **12-31**, after this print, and the G20 Miami leaders' meeting **12-14** falls two
  days before it. One plumbing item touches this lane directly and is worth more than a footnote: the
  Board's notice removes the Data Download Program's "Build Your Package" option **the week of November
  9** *"in preparation for the eventual retirement of the DDP"*, pointing users to **FRED** — and FRED
  is the source that **timed out six times from this runner today** while the Board's own `ipdisk` flat
  files served every number in this ledger. The recommended replacement is, from here, the less
  reliable path.
- **Event tape** — no November consensus exists at D-101 and none will before the October edition
  prints on **11-17**. Every November-content statement here is a base rate, never a forecast.
- **No dated event is proposed in this PR, and the two candidates are declined on the record.** The
  **2027-01-15** edition is real, Board-scheduled and dated — but standalone with no known GDPNow
  vintage (the Atlanta Fed's sheet ends 2026-12-23), which is exactly the ground on which the November
  lane declined 09-18 and 10-16; tracking every monthly edition of a `low`-impact series would flood
  the calendar for no measured signal. **The instruction to the next pulse is conditional and
  explicit:** if a lapse begins on 12-12, 2027-01-15 becomes the first edition whose BLS input falls
  *inside* it (Leg 4), and it should be proposed then. The **2026 annual revision** is declined for the
  same reason its sibling declined it — it has no date, and it cannot be a calendar entry until the
  Board names one. It lives here as `-5` and as a kill switch.

### Honest limits

- **The archive is release *dates*, not release *contents*.** Legs 1–5 measure whether, when and beside
  what the report published — never what it said. The content read is a single current edition plus the
  Board's own index history.
- **`p=0.0730` and `p=0.4324` are failures to reject, not demonstrations of equality.** n=12 December
  vintages and n=28 retail-free month-2 vintages cannot prove this print moves nothing.
- **n=12 is n=12.** The headline comparison (December vs the November shape, p=0.0028) rests on two
  twelve-observation classes, and the sibling's own ledger records a result of its own that reversed
  when its sample went from 10 to 37. This one should be re-derived, not inherited.
- **The tape window is shorter than the sibling's** — 2016-09 onward, n=2,396, because the Nasdaq API
  caps at ten years and Yahoo was rate-limited. It overlaps the sibling's window substantially, so the
  two are not independent samples.
- **The December class carries opex week inside it.** 8 of 9 pre-lapse December G.17s sat within three
  days of quad witching, so "December G.17 sessions look ordinary" is a statement about a compound
  condition that cannot be decomposed at n=11.
- **Leg 4's central claim is a mechanism, not a measurement.** "The BLS input is already in hand" is
  read off the Board's explanatory notes and the 2018-19 counterexample; the archive has **three**
  lapses, one of which was partial. That is a small n for a structural argument, and it is why `-3` is
  registered at medium confidence.
- **The annual revision sits between this research and this print, and this ledger cannot price it** —
  more so than its sibling's, because 12-16 is five days from the end of the Board's stated window. Last
  year's revision reversed the sign of five years of manufacturing output.
- **`ContribArchives` ends 2026-07-28** and carries no Q4-2026 vintages, so every class prior is
  out-of-sample for the quarter being nowcast.
- **All the nowcast work measures a model, not a market.** Every Δ describes the Atlanta Fed's estimate.
  The only price claims here are the session and gap studies, and both are reasons *not* to act.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it. A `confirmed` date changes the assessment
  cadence and nothing else.

## Stance & kill switches

**Stance (date is `confirmed`).** Stand aside on 2026-12-16 and on every edition of this report. Hold
three frames. **On identity:** this is the 9:15 a.m. Federal Reserve G.17 for **November 2026** data —
**month 2** of the Q4-2026 quarter GDPNow began nowcasting on 10-29 — printing before the cash open on
a morning it shares with advance retail sales (08:30) and MTIS (10:00), two days before quad witching.
**On magnitude, which is where this ledger's own work lands:** the sibling one month earlier measured
its vintage class as the loudest in the study at **0.5833pp**; this class reads **0.1872pp (n=12,
p=0.0028 against it)** and is **not distinguishable from an ordinary vintage day (p=0.0730)**. That is
structural — **11 of 12 December G.17s carry a November reference month**, and month-2 vintages move
the report's own Equipment channel **0.0173pp against month-1's 0.0399pp, p=0.0002**. Equipment has
never reached 0.10pp on any December vintage (max 0.0661) and PCE outmoved it 12 of 12. The tape says
the same: this print's exact class reads an overnight gap of **0.2980% at p=0.9052**, flat against a
0.2874% baseline. **On what actually matters here — and it is not the number:** PL 119-103 funds through
**2026-12-11**, a lapse would begin **00:00 Sat 2026-12-12**, and this print sits on **day 5**. The
2025 analogue is one slot away: the **2025-12-16** release was itself cancelled and folded into 12-23.
The base case is still that it publishes, because the separating variable across three archived lapses
is **BLS**, and this print's BLS input — the November employment situation on **2026-12-04** — lands
eight days before the cliff; through the 35-day 2018-19 partial shutdown, with BLS funded, the G.17
published on its scheduled day. Nothing here licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **A funding lapse begins on 2026-12-12 and the Board issues a delay notice for the 12-16 release.**
  The 2013 and 2025 notices are the template and both came *before* the affected date. The event's
  identity changes from "an ordinary month-2 print" to "the one the cliff took", and Leg 4's BLS
  argument is refuted on its first live test.
- **The Board announces its 2026 annual-revision date, whatever the date is.** If it lands on or before
  12-16 this becomes a post-revision print on a **2022 base year** and every level and percentile here
  is arithmetic about a superseded series; if the Board lets autumn expire without one, its stated-window
  record breaks for the first time in this ledger's table. Either observation is new information.
- **The 2026-12-16 GDPNow vintage moves the Q4-2026 Equipment contribution by 0.10pp or more.** That has
  never happened on any of the twelve December vintages on record (max 0.0661pp) nor on any of the
  eleven in the exact 12-16 shape (max 0.0569pp). It would mean this report has an attributable nowcast
  footprint after all and Leg 3 is re-derived rather than patched.
- **The 2026-12-16 vintage moves \|ΔGDP\| by more than the 2026-11-17 vintage did.** The month-2-quieter-
  than-month-1 claim is the whole control, and this is its paired, same-year test.
- **SPY's 2026-12-16 session range reaches 2.1475% or more** — the 2016-09+ baseline p90. The
  ordinary-opex-Wednesday frame fails on the one date it was registered for, and Leg 5 gets re-derived.
- **A December G.17 vintage moves the nowcast more than a month-1 vintage over the next three
  Decembers.** The class comparison that is this ledger's method would then be measuring something other
  than what it claims.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-12-01.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it a live
  question.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-industrial-production-2026-12-16-1` — the 2026-12-16 GDPNow vintage moves the **Q4-2026 Equipment
  contribution** by **less than 0.10pp** in absolute value. Score by 2026-12-16.
- `FT-industrial-production-2026-12-16-2` — **SPY's 2026-12-16 session high-low range is below 1.3771%**
  of its close (the 2016-09+ baseline p75). Score by 2026-12-16.
- `FT-industrial-production-2026-12-16-3` — **the G.17 scheduled for 2026-12-16 is published on
  2026-12-16**, not delayed or cancelled, whatever happens to appropriations on 12-11. Score by
  2026-12-16.
- `FT-industrial-production-2026-12-16-4` — **the 2026-12-16 GDPNow vintage's \|ΔGDP\| is smaller than
  the 2026-11-17 vintage's**, the paired same-year test of the month-2-is-quieter control. Score by
  2026-12-16.
- `FT-industrial-production-2026-12-16-5` — **the 2026 G.17 annual revision is published on or before
  2026-12-21**, the last day of the Board's own stated "autumn of 2026" window. Score by 2026-12-21.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-101 | **Initial research on the control its own proposer asked for — and the control holds, harder than the month-position table predicted.** Canonical `src/domain/market-events/industrial-production-2026-12-16.json` written this session after reading the single proposal (`from-industrial-production-2026-11-17`), now shadowed. **Leg 1 — date PROMOTED `estimate` → `confirmed`** on two Board primaries fetched direct today: `feeds/g17.html` (200, 614,006 bytes) verbatim *"…will be published at 9:15 a.m. on … November 17, and December 16"*, and `releases/g17/release_dates.htm` (200, 117,098 bytes) row "December 2026 \| 16-December-2026", a table now maintained through **July 2027**; the feed also carries the full **2027** schedule. One correction to a sibling's reading: that table is keyed by **release month, not reference month** — which is why "December 2025" shows two dates and "October/November 2025" read `NA` (no release occurred in those calendar months at all). **Leg 2 — the December edition is the month-2 edition by construction:** of the **12** December G.17 vintages in the archive, **11 carry a November reference month**, and the single exception (2025-12-03, September data) was a shutdown catch-up. Re-derived position table: month 1 n=44 **0.3515pp** \|ΔGDP\| / **0.0399pp** \|ΔEq\|; **month 2 (this print) n=46 0.2007 / 0.0173**; month 3 n=48 0.0975 / 0.0071 — month 1 vs 2 is p=0.0680 on GDP but **p=0.0002 on the report's own Equipment channel**. **Leg 3 — THE FINDING.** Board's 189-date archive joined to `ContribArchives` (1,871 vintages 2014-05-01 → 2026-07-28 = 1,822 same-quarter deltas) gives **143** G.17 vintages, **141/143** independently naming IP in the Atlanta Fed's own free text. **December G.17 vintages: n=12, median \|ΔGDP\| 0.1872pp — against the November-shape class's 0.5833pp (n=12), permutation p=0.0028, and against all 1,679 non-G.17 vintages p=0.0730 (indistinguishable).** \|ΔEquipment\| **never reached 0.10pp in any of the 12** (max **0.0661**, 2019-12-17) and **PCE outmoved Equipment 12 of 12** (vs 124/143 = 86.7% across all G.17 days, 70.3% base elsewhere). Counterfactual run inside the month-2 class: with retail (n=18) **0.4147pp**, without (n=28) **0.1096pp**, p=0.0001 against each other, and **without-retail vs ordinary vintages p=0.4324**. The exact 12-16 shape (retail + inventories + IP, month 2, **no** import/export prices — those moved to 12-17) has **n=11** at 0.4231pp with **\|ΔEq\| max 0.0569** and PCE outmoving Eq **11/11**. **Leg 4 — the cliff the sibling reasoned it was clear of reaches THIS print.** PL 119-103 funds through **12-11**; a lapse begins **00:00 Sat 12-12** and 12-16 is **day 5**. The Board is not appropriations-funded, so the mechanism is second-order and it names it: *"…incorporate a range of data from other government agencies, the publication of which has been delayed…"*, and its explanatory notes name the agency — where physical product data are unavailable, output is inferred from *"production-worker hours … collected in the monthly establishment survey conducted by the Bureau of Labor Statistics"* (about **78%** of first-estimate source data is available). **Three lapses, three outcomes, and the separating variable is BLS not length: 2013 (16d) slipped 10-17 → 10-28 (+11d, notice 10-18); 2018-19 (35d, PARTIAL, BLS funded) did not touch it — December data published 2019-01-18, its SCHEDULED date, inside the shutdown; 2025 (43d) cancelled 10-17 and 11-18 and folded the 2025-12-16 slot itself into 12-23 (+7d).** In 2025 the notice killing the 11-18 release landed **11-14, two days AFTER funding was restored** — the exposure outlives the lapse. Applied here: this print's BLS input is **jobs-2026-12-04** (November data), **eight days before the cliff** and already in hand — exactly what was not true in 2025, whose lapse began 10-01 before the September employment report could publish. Base case: 12-16 publishes; the first edition genuinely at risk is **2027-01-15**. **Leg 5 — REFUTED on a re-test window.** SPY **2016-09-07 → 2026-09-04**, baseline **n=2,396** (shorter than the sibling's n=2,961 — Nasdaq's API caps at 10 years; see blocked sources). All G.17 days (n=117) \|gap\| **0.4156%** vs 0.2874%, **p=0.0016** — the sibling's headline reproduces on a different window — and with-retail (n=57) 0.4285% p=0.0065 carries it. **But it does not survive into this print's class: month-2 + retail (the exact 12-16 configuration, n=18) reads 0.2980% at p=0.9052**, and December G.17 days (n=11) 0.4186% at **p=0.2207**, range 0.7633% at p=0.5605. No class separates on range; QQQ reproduces the null (p=0.7456 / p=0.3363). Baseline percentiles: range p50 0.8867 / p75 **1.3771** / p90 **2.1475**; \|gap\| p50 0.2874 / p75 0.5492 / p90 0.9493. **One structural feature the November print does not share: this is an opex-week release** — distance to quad witching across the 9 pre-lapse December editions is 2/0/7/3/3/1/1/0/3 days, **8 of 9 inside three days**, two of them ON quad witching; 2026-12-16 is **2 days** before **12-18**. Context for reading that session, not a finding about the release. **Primary content** (2026-08-18, July data): IP and manufacturing **each +0.2%** m/m after +0.3%; **103.0% of the 2017 average, +1.1% y/y**; capacity utilization **76.3%**, 3.1pp below the 1972–2025 average. Computed from the Board's own `ipdisk` files: total utilization **76.29%**, **3.13pp** below the **79.41%** mean, **20.1st percentile** of 715 months since 1967; manufacturing utilization 75.96%; **manufacturing output `GMF` 99.31 — 0.69% BELOW its own 2017 average nine years on**. **Composition is the interesting part: Business equipment ran 96.3 → 100.4 Feb→Jul and is +6.6% y/y, the strongest major market group, while consumer goods is −1.8% y/y — the channel GDPNow bridges to equipment is the fastest-growing thing in the report and the smallest mover in the nowcast.** Ex-COVID (2015+, excl. 2020-21) the median month is −0.002% (sd 0.515), 30.4% inside ±0.20pp. **A seasonal registered by the sibling is NOT registered here:** October reproduces at −0.340%, p=0.0887, but **November — this print's reference month — reads median −0.178%, up 4 of 9, permutation p=0.4492** (values −0.74/−0.42/+0.24/+0.08/+0.50/−0.29/+0.39/−0.18/−0.18). A coin flip; no forward test on it, deliberately. **THE OPEN QUESTION, one month closer:** the Board announced **2026-05-15** that the **annual revision** lands *"in the autumn of 2026"* — base year to **2022**, 2023 Census manufacturing benchmark, capacity through Q4-2025 — and **has still named no date**. Every revision since 2021 was a **standalone noon release** (2021-05-28, 2022-06-28, 2023-03-28, 2024-06-28, 2025-11-24), 5 of 5, never folded into a 9:15 monthly; but **autumn ends 2026-12-21, five days AFTER this print**, and the Board has hit every window it has stated. So where 11-17's base case was a pre-revision print, **this ledger's base case is a POST-revision print**. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** jobs 12-04, FOMC 12-09, CPI 12-10, **CR expiry 12-11**, Tankan + G20 Miami 12-14, PPI 12-15; retail 08:30 / **this print 09:15** / MTIS 10:00 all 12-16; ECB, housing starts, import/export prices, pending home sales 12-17; BoJ and **quad witching 12-18**. This print lands **7 days after the December FOMC** and 14 before its minutes — it grades the decision, it cannot inform it. **Volatility:** VIX **14.53**, SPY **770.19**, QQQ **718.96** (2026-09-04 closes) — baseline, nothing to diff yet. **Geopolitical:** the funding cliff is the item; China retaliation suspension expires 12-31, after this print. One plumbing item worth more than a footnote — the Board removes the DDP's "Build Your Package" option **the week of Nov 9** *"in preparation for the eventual retirement of the DDP"* and points users to **FRED**, which **timed out six times from this runner today** while the Board's own `ipdisk` flat files served every number here: the recommended replacement is, from this lane, the less reliable path. **Event tape:** no November consensus at D-101; the 11-17 edition sets the first read. **NO event proposed, two declined on the record:** **2027-01-15** (real, Board-scheduled, dated — but standalone with no known GDPNow vintage, the same ground on which the November lane declined 09-18 and 10-16), with an explicit conditional instruction to the next pulse: **if a lapse begins 12-12, 2027-01-15 becomes the first edition whose BLS input falls inside it and should be proposed then**; and the **2026 annual revision**, which still has no date. **Five fetch failures recorded in `probe-ref.blocked`, and the substitutes are better primaries:** FRED `fredgraph.csv` **ETIMEDOUT ×6** (the reverse of the sibling's session, which saw FRED 200 where *its* sibling saw a timeout — this source is intermittent from this lane's runners and neither observation generalises); Yahoo `query1`/`query2` **429 ×6**; both Stooq mirrors 200-with-JS-challenge; `ipdisk/util_sa.txt` **404**. So every IP/capacity/utilization figure comes from the Board's own files and every price from CBOE and Nasdaq — and the swap **cross-validates**: the Board's files reproduce the sibling's FRED-sourced levels to the decimal (76.29% / 3.13pp / 20.1st pct / 99.31) and CBOE+Nasdaq reproduce its Yahoo closes exactly (14.53 / 770.19 / 718.96). **Five forward tests registered:** `-1` (Equipment moves <0.10pp — 12/12 on record), `-2` (SPY 12-16 range below the 1.3771% baseline p75), `-3` (**the release publishes on 12-16** — the cliff test, medium confidence because the 2025-12-16 slot is one row away in the same table), `-4` (the 12-16 vintage's \|ΔGDP\| is smaller than 11-17's — the paired same-year control), `-5` (the annual revision publishes on or before **2026-12-21**, the Board's own window). | **Initial stance set: stand aside; this is the quiet twin, and the only live question is whether it publishes.** The sibling's loudest-in-study class (0.5833pp) is specifically not this one — December G.17 vintages read 0.1872pp, p=0.0028 against it and p=0.0730 against an ordinary day, because the December edition is structurally the month-2 edition (11 of 12) and the report's own channel decays from 0.0399 to 0.0173pp (p=0.0002). The tape null is sharper here than there: the exact 12-16 class gaps 0.2980% at p=0.9052. What replaces the number as the subject is publication — a lapse starting 00:00 12-12 puts this print on day 5, the 2025-12-16 slot was itself cancelled, and the base case that it survives rests on BLS being eight days early, not on the Fed being self-funded. | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-industrial-production-2026-12-16.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
