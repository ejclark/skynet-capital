# New Residential Sales — new single-family home sales (Sep 2026 data) — new-home-sales-2026-10-27

**Kind:** macro-print · **Date:** 2026-10-27 (confirmed, CENSUS: two primaries fetched direct 2026-09-06 — `economic-indicators/calendar-listview.html` row "New Residential Sales | October 27, 2026 | 10:00 AM | September 2026", code `A202610271000`, reference `A202609`; and the Survey of Construction program's own `construction/soc/schedule.html`, whose "September 2026" row reads "October 20, 2026 | October 27, 2026" under the header "(17th Workday) … New Residential Sales - 10:00 a.m.") · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-10-28","boj-decision-2026-10-30","chicago-pmi-2026-10-30","consumer-confidence-2026-10-27","durable-goods-2026-10-27","eci-q3-2026-10-30","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","mwts-benchmark-revision-2026-10-26","pce-2026-10-29","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-buyback-20y30y-2026-10-27"],"screenStreak":0,"blocked":[{"url":"https://www.spglobal.com/spdji/en/index-family/indicators/sp-corelogic-case-shiller/","status":"403","at":"2026-09-06"},{"url":"https://www.atlantafed.org/cqer/research/gdbnow","status":"404","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **The sibling ledger proved the market does not read this print; this edition adds the
reason it will not matter anyway — 2026-10-27 is FOMC-eve.** The October 2026 FOMC meets
**October 27–28**, so this print lands at 10:00 on **day one of the meeting**, inside the blackout
that began 10-17, with the decision the next morning. That stacks **two independently measured
nulls**. The release-day null replicates cleanly on a fresh pull: eight instruments, **65** sessions
since 2021, **SPY p=0.5957 · QQQ p=0.8604 · ITB p=0.2979 · XHB p=0.3110 · DHI p=0.5637 · LEN
p=0.8847 · PHM p=0.8313 · TOL p=0.2249**, with both homebuilder ETFs *narrower* on release days. And
**FOMC-eve is itself a null** across **45** pairs — SPY **0.924%** vs a 0.976% baseline
(**p=0.6681**), ITB **1.851%** vs 2.012% (**p=0.3068**), XHB **p=0.4538**, TOL **p=0.7063** — while
the **decision day is dramatically louder**: ITB **3.154%** vs 2.012% (**p<0.0001**), XHB **2.869%**
vs 1.865% (**p<0.0001**), TOL **3.964%** vs 2.667% (**p<0.0001**), SPY **1.370%** vs 0.976%
(**p=0.0009**). ITB's eve range is below its own decision-day range in **36 of 45 pairs (80.0%)**,
median ratio **1.68×**. The corridor's housing risk is **10-28**, not this print. On the nowcast the
day is unusually clean: the Atlanta Fed's `PostedUpdates` row for 2026-10-27 names only **two**
items — the M3-1 trigger and this print — and **M3-1 without new-home sales moves the residential
contribution a median 0.0005pp (n=34, 3 of 34 clearing 0.02pp)**, so any residential move that
morning is this print's. Date promoted **`estimate` → `confirmed`** on two Census primaries;
`symbols: []`. Stand aside on 10-27, and do not read the 10-28 tape as this print's answer.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-51) | **Stand aside** | High | `symbols: []`, D-51, no September data in existence, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro/housing/Census keying returns **0 hits** today. The `confirmed` flip changes the honesty label on the date and nothing else. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2026-10-27** — none exists today |
| This week | **Stand aside — the series has nothing in the week, and the newest edition is twelve days old** | High | The current release is **CB26-128**, published **2026-08-25** with July 2026 data: **607,000** SAAR, **−10.5% (±14.0%)\*** m/m off a revised June of 678,000, **−6.3% (±19.6%)\*** y/y. The asterisk is Census's own. The next edition is the August-data print on **2026-09-24**; this event's September data is two editions away. VIX **14.53**, 30-year mortgage **6.71%** (2026-09-03). | Census moving or suspending the **2026-09-24** slot before that date — unprecedented on an 84/84 record across seven calendars |
| This month | **Do not trade the release day, and do not trade the day after it either — for opposite reasons** | High | Two stacked nulls make 10-27 quiet: the release-day null (8 instruments, 65 sessions, all **p≥0.22**) and the FOMC-eve null (45 pairs, all **p≥0.30**, directionally *narrower*). The loud session is **10-28**, and it is loud because of the **Fed** — ITB **3.154%** vs 2.012% (**p<0.0001**) — not because of housing. Only **3 of 77** release sessions since 2020 have touched an FOMC decision at all, so a reader who has never seen this overlap will be tempted to attribute 10-28's range to Tuesday's print. | Any of the eight instruments printing a release-day median session range above its baseline at **p<0.05** on a re-run after **2026-11-25**, or FOMC-eve ranges testing *wider* than baseline on the same re-run — either kills the stacked-null reading |
| This quarter | **Read the inventory line, not the sales line — the overhang is at a level last seen in 2007–09** | Medium | Sales at **607,000** SAAR are **43.7%** of their July-2005 peak, while new houses for sale at **488,000** are **85.3%** of their July-2006 peak — a level last matched in **December 2007** — and months' supply at **9.6** was last matched, outside this cycle, in **April 2009**. Median new-home price **$393,800** is −0.9% y/y against the average **$508,800** at +5.4%: builders are clearing the bottom of the mix. Medium, not high: it is a composition read on the noisiest headline Census publishes, and the app holds no instrument on either side. | Months' supply printing below **8.0** in any edition through **2027-03-31**, or for-sale inventory falling under **450,000** — either would end the overhang this call describes |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, no macro-keyed playbook
  (0 hits, re-grepped today), and a measured tape null across eight instruments. The date being
  **confirmed** widens nothing: research is not action.
- **The date is now confirmed, and this session is what promoted it.** Two Census primaries — the
  economic-indicators calendar and the Survey of Construction's own 17th-workday schedule table —
  plus an Atlanta Fed corroboration. The no-self-confirm rule binds the sweep that discovered an
  event, not its own initial research.
- **The finding this edition adds: 2026-10-27 is FOMC-eve, and eve is quiet.** October 2026 FOMC
  meets **27–28**; this print is 10:00 on day one. Eve sessions are indistinguishable from baseline
  on all five instruments tested (p 0.31–0.85); decision days are wider on all five (four at
  p<0.001). Registered as `-3`.
- **Attribute 10-28's range to the Fed, not to Tuesday's housing print.** Only **3 of 77** release
  sessions since 2020 touched an FOMC decision or its eve (`2022-01-26`, `2022-07-26`, `2023-07-26`);
  10-27 would be the fourth and only the second *eve*. The overlap is rare enough to be mis-read.
- **The line to read first — Δ residential, and this is the cleanest day in the family for it.**
  Registered as `-1`: the 2026-10-27 vintage moves the Q4-2026 residential contribution by **at
  least 0.02pp**. Base rate **78.3%** pooled, **85.0%** since 2021, **8 of 11** on October-dated
  vintages and **4 of 4** since 2021. The attribution is clean because M3-1 without this print moves
  residential a median **0.0005pp**.
- **The headline nowcast on 10-27 belongs to M3-1, the trigger.** Neither the two-item bundle (n=2)
  nor the M3-1 complement distinguishes itself on \|Δ GDP\| (M3-1-without-new-home-sales 0.1155pp vs
  a 0.0961pp baseline, **p=0.5542**) — so no headline claim is made here, only the residential one.
- **The headline is Census-flagged noise, and that is the stance's backbone.** Registered as `-2`:
  the 2026-10-27 release carries the not-statistically-significant asterisk on its m/m. **37 of 40**
  measured editions did; **38 of 40** stated a margin of error of ±12% or wider. September months in
  the revised series are quieter than most: **1 of the last 12** cleared ~13%.
- **The revision is rarely small and often reverses direction.** Registered as `-4`: across **33**
  first→revised pairs, \|revision\| ≥1.0% in **26 of 33 (78.8%)**, median **2.79%**, max **10.09%**,
  moving *against* the first print's own direction in **18 of 33**. Read September on **2026-11-25**,
  not on 10-27.
- **Watch (dated)** — August-data print **09-24** · Oct OPEX **10-16** · FOMC blackout from **10-17**
  · housing starts **10-20** (a live proposal, under research by a sibling lane this cycle) ·
  MWTS benchmark revision **10-26** · **this print 10-27** 10:00, alongside tracked
  `durable-goods-2026-10-27` (8:30, the M3-1 trigger) and `consumer-confidence-2026-10-27`, plus
  **`fhfa-hpi-2026-10-27`** (proposed in this PR, same day) · **FOMC decision 10-28** with
  `advance-economic-indicators-2026-10-28` and **`housing-vacancies-q3-2026-10-28`** (proposed in
  this PR) · GDP Q3 advance, PCE and the ECB decision **10-29** · ECI and Chicago PMI **10-30** ·
  October-data successor **11-25**, already tracked as `new-home-sales-2026-11-25`.

## Initial research

### The question, plainly

This event exists because the `construction-spending-2026-11-02` lane's adjacency sweep proposed it:
that print reads the September 2026 reference month from the put-in-place side, and this one reads
the same month from the new-home demand side, six days earlier. The sibling
[`new-home-sales-2026-11-25`](new-home-sales-2026-11-25.md) already established what the *series* is.
So the honest question for this edition is narrower and harder:

**What does the October edition of a print we have already measured as a null do differently — and
is there anything about 2026-10-27 in particular that a reader needs?**

**One-line verdict:** yes, one thing, and it is the whole ledger — this is the first New Residential
Sales release in seven years to land on the eve of an FOMC decision, which stacks a second measured
null on top of the release-day null and puts the corridor's entire housing-name risk on the *next*
session, where it belongs to the Fed.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no
target. Nine inputs, all fetched direct on 2026-09-06 unless the text says otherwise. Every
measurement below was re-run from scratch by this session; where a number matches the sibling
ledger's, that is an independent replication on a separately harvested corpus, not a citation.

1. **Seven Census release calendars** — `calendar-listview.html` (2026; HTTP 200, 91,396 bytes, 179
   rows) plus `calendar-listview-2020…2025.html`, all HTTP 200, parsed row-wise into
   `(indicator, release date, time, reference month, release code)` — **1,117 unique rows**, giving
   **84 New Residential Sales releases, reference months 2019-12 → 2026-11, zero gaps** and **zero
   rows carrying a `Suspended` marker anywhere on those pages**.
2. **`census.gov/construction/soc/schedule.html`** (HTTP 200, 59,625 bytes) — the Survey of
   Construction's own release-schedule table, the second primary on this date, and the source of the
   release *rule*: New Residential Sales is the **17th workday** of the month following the
   reference month, at 10:00 a.m.
3. **`census.gov/construction/nrs/current/index.html`** (HTTP 200, 236,921 bytes) — the current
   release, **CB26-128**, read for its own figures rather than carried from a sibling.
4. **`federalreserve.gov/monetarypolicy/fomccalendars.htm`** (HTTP 200, 164,831 bytes) — parsed into
   **56 decision days, 2021-01-27 → 2027-12-08**, eight per year. This is the input the sibling
   ledgers did not have, and it is where this ledger's finding comes from.
5. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed, HTTP 200, 16,944 bytes) — both sheets:
   `PostedUpdates` (82 dated rows, 2025-12-23 → 2026-12-23), `InternalUpdates` (56 rows), and the
   two legend columns that define what triggers a public post.
6. **`GDPTrackingModelDataAndForecasts.xlsx`** (Atlanta Fed, HTTP 200, 10,875,424 bytes) —
   `ContribArchives`, **1,871 vintages 2014-05-01 → 2026-07-28 = 1,822 same-quarter deltas**,
   classified by the sheet's own free-text `Data releases` column. 20,000-iteration permutation
   tests on medians throughout.
7. **FRED CSV series** — `HSN1F`, `HNFSEPUSSA`, `MSACSR`, `MSPNHSUS`, `ASPNHSUS`, `TLRESCONS`,
   `HOUST1F`, `COMPUTSA`, `MORTGAGE30US`, all HTTP 200.
8. **Wayback captures of `census.gov/construction/nrs/current/index.html`** — the CDX API returned
   **117 digest-collapsed captures 2022→2026**, **all 117 parsed** into press-release fields (**40
   unique editions, reference months 2022-10 → 2026-07**, **33 complete first→revised pairs**).
   Archived *primary* documents. The sibling harvested 130 captures and reached the same 40
   editions and the same 33 pairs — two different capture sets, one answer.
9. **Yahoo daily bars** — SPY, QQQ, `^VIX`, **ITB**, **XHB**, and **DHI, LEN, PHM, TOL**,
   2014→2026-09-04, with **1,425** sessions used from 2021-01-01.

**Two fetch failures are recorded in `probe-ref.blocked` rather than papered over.** The Atlanta
Fed's landing page at `/cqer/research/gdbnow` returns **404** (it is a typo path that appears in
older notes); the workbook links were scraped off `/cqer/research/gdpnow` and resolve under
`/-/media/Project/Atlanta/FRBA/Documents/…`, after which both workbooks arrive at the sibling
session's exact byte counts. **S&P Global returned 403** to a plain fetch of the CoreLogic
Case-Shiller index page, which is why the house-price proposal below is FHFA's and not S&P's — no
primary, no entry. Yahoo serves normally with a contactable User-Agent.

### Leg 1 — the release exists on 2026-10-27 · **SUPPORTED**, on two primaries, and promoted to `confirmed`

Census lists `A202610271000`, reference `A202609`, 10:00 a.m., and the Survey of Construction's own
schedule independently reads `September 2026 | October 20, 2026 | October 27, 2026` under a header
naming New Residential Sales at 10:00. The same table's neighbouring rows are `October 2026 |
November 18, 2026 | November 25, 2026` (`new-home-sales-2026-11-25`, tracked) and `November 2026 |
December 17, 2026 | December 23, 2026` (`new-home-sales-2026-12-23`, tracked). The 12th-workday twin
for this reference month is **2026-10-20**, which is `housing-starts-2026-10-20` — already a live
proposal from the `construction-spending-2026-11-02` lane and under research by a sibling lane this
cycle, so it is not re-proposed here.

Status moves `estimate` → **`confirmed`**, on the precedent the `construction-spending-2026-12-01`
and `new-home-sales-2026-11-25` lanes set: the "a lane may not self-confirm an event it discovered
in-sweep" convention binds the *discovering* sweep, and this is the independent second look. Across
the seven calendars, **no New Residential Sales row has ever been suspended**, and this session's
parse finds **no `Suspended` marker on any row of any of the seven pages** — the suspensions the
sibling recorded belong to indicator families whose rows sit on pages this parse also covers.

### Leg 2 — the 2026-10-27 bundle is the cleanest in the 2026 set · **SUPPORTED**

`GDPNowcastDataReleaseDates.xlsx` names **eight trigger** inputs — construction spending · ISM
Manufacturing · international trade (full report) · wholesale trade · retail sales + inventories ·
housing starts · advance Census manufacturing (M3-1) · personal income and outlays — against **ten
"other releases … incorporated when they are released on the same day as the releases in column
J"**, of which **new-home sales is one** (the others: employment situation, ISM Services, M3-2 full
report, import/export prices, PPI, CPI, industrial production, Advance Economic Indicators,
existing-home sales).

Mapped against the 12 New Residential Sales release dates on the 2026 Census calendar:

| 2026 new-home-sales release dates | Count |
|---|---|
| Drew a **posted** GDPNow update | **7 of 12** (02-20, 03-19, 05-05, 05-28, **10-27**, 11-25, 12-23) |
| Appeared only as an **internal** update | **4** (06-24, 07-24, 08-25, 09-24) |
| Named on neither sheet | 1 (01-13) |

What makes this edition different is the *shape* of its row, not the fact of it. The four other
posted 2026 vintages that name this print pair it with a GDP estimate, NIPA underlying detail tables
and personal income — five items each. **The `PostedUpdates` row for 2026-10-27 reads, in full:
`Advance Census manufacturing (M3-1) , New-home sales`. Two items.** One trigger, one other
release, nothing else. That is the cleanest attribution surface any 2026 edition of this print gets,
and it sets up Leg 3.

### Leg 3 — the footprint replicates, and on 10-27 the attribution is unusually clean · **SUPPORTED**

`ContribArchives` gives 1,822 same-quarter deltas. Classifying each vintage by its own `Data
releases` free text (the release is spelled 21 different ways across the decade — all matched):

| Vintage class | n | \|Δ Residential\| | \|Δ Fixed inv\| | \|Δ GDP\| |
|---|---|---|---|---|
| **New-home sales named ALONE** | **93** | **0.0543pp** | 0.0559pp | **0.0528pp** |
| New-home sales named at all | 138 | 0.0507pp | 0.0544pp | 0.0692pp |
| Every vintage naming no new-home sales | 1,684 | **0.0058pp** | 0.0286pp | **0.0961pp** |

Permutation p (20,000 iterations, on medians): alone-vs-baseline **resid p<0.0001**, **fixed
p=0.0029**, **GDP p=0.0295**. That reproduces the sibling's figures to the third decimal on an
independently re-parsed workbook — **9.4×** on residential, and a *quieter-than-average* headline
day rather than merely a null one.

**The new work is the attribution test for this specific date.** 2026-10-27's bundle is M3-1 + this
print. The exactly-matching historical class is only **n=2** (2023-06-27, 2024-12-24), far too thin
to lean on — but its **complement is well-powered**, and the complement is what the argument needs:

| Class | n | \|Δ Residential\| | share ≥0.02pp | \|Δ GDP\| |
|---|---|---|---|---|
| **M3-1 named WITHOUT new-home sales** | **34** | **0.0005pp** | **3 of 34** | 0.1155pp |
| M3-1 named alone, nothing else | 20 | 0.0002pp | — | 0.0834pp |
| New-home sales + M3-1 only (this date's shape) | 2 | 0.0501pp | 2 of 2 | 0.0754pp |
| Baseline (no new-home sales) | 1,684 | 0.0058pp | — | 0.0961pp |

The two-vs-thirty-four comparison reads p=0.0611 and the two-vs-twenty reads **p=0.0036**, but with
n=2 neither is the point. The point is the middle column: **M3-1 by itself essentially never moves
the residential contribution** — a median of 0.0005pp, with 3 of 34 vintages clearing 0.02pp against
78.3% of new-home-sales vintages. So on 2026-10-27 a residential move is this print's by
elimination, on the only other release named in the row.

**No headline claim is made for this date.** M3-1-without-new-home-sales moves \|Δ GDP\| 0.1155pp
against a 0.0961pp baseline at **p=0.5542** — not distinguishable. The honest statement is that
10-27's headline move belongs to the trigger by construction, not that the trigger is measurably
louder.

**One seasonal observation, recorded and deliberately not leaned on.** October-dated new-home-sales
vintages are the *quietest* month in the archive on residential — **0.0246pp (n=11)** against
**0.0537pp** for non-October ones, **p=0.0984** — and the baseline is not itself depressed in October
(0.0047pp vs non-October, p=0.4968). This runs opposite to the sibling's loud-November finding and
is weaker than it (p=0.0984 vs p=0.0004, no surviving controls run). It matters only as a caution on
`-1`, and the caution does not bite: **8 of 11** October vintages still clear the 0.02pp bar, and
**4 of 4** since 2021, because the bar is low relative to even a quiet October median.

### Leg 4 — the tape null replicates, and FOMC-eve stacks a second one on it · **REFUTED (the market does not read this print)**

The sibling made the tape claim and it was a no. This session re-ran it from a fresh Yahoo pull:

| Class (session high-low range, % of close, since 2021-01-01) | n | Median | Baseline | p |
|---|---|---|---|---|
| SPY on new-home-sales days | 65 | 1.032% | 0.976% | 0.5957 |
| QQQ on new-home-sales days | 65 | 1.385% | 1.368% | 0.8604 |
| **ITB** on new-home-sales days | 65 | **1.876%** | 2.012% | 0.2979 |
| **XHB** on new-home-sales days | 65 | **1.744%** | 1.865% | 0.3110 |
| DHI on new-home-sales days | 65 | 2.592% | 2.503% | 0.5637 |
| LEN on new-home-sales days | 65 | 2.551% | 2.575% | 0.8847 |
| PHM on new-home-sales days | 65 | 2.617% | 2.580% | 0.8313 |
| **TOL** on new-home-sales days | 65 | **2.477%** | 2.667% | 0.2249 |

Nothing clears p=0.22; both homebuilder ETFs and Toll Brothers lean *narrower*. Absolute
close-to-close agrees (SPY p=0.9295, ITB p=0.8638, XHB p=0.6951, DHI p=0.9516), and the **17**
Census-solo sessions are quieter still (SPY 0.793%, ITB 1.711%, XHB 1.629%). **28 of 81** release
dates carry no other Census release, so the class is separable and the null has power behind it.

**Now the part that is this ledger's own.** The October 2026 FOMC meets **October 27–28**
(federalreserve.gov's own calendar, parsed to 56 decision days). This print is 10:00 a.m. on day
one. Measuring every session against its FOMC position since 2021:

| Class (session high-low range, % of close) | n | Median | Baseline | p |
|---|---|---|---|---|
| **SPY, FOMC-eve** | 45 | **0.924%** | 0.976% | 0.6681 |
| SPY, FOMC decision day | 45 | **1.370%** | 0.976% | **0.0009** |
| **QQQ, FOMC-eve** | 45 | 1.347% | 1.368% | 0.8499 |
| QQQ, decision day | 45 | 1.667% | 1.368% | **0.0288** |
| **ITB, FOMC-eve** | 45 | **1.851%** | 2.012% | 0.3068 |
| ITB, decision day | 45 | **3.154%** | 2.012% | **<0.0001** |
| **XHB, FOMC-eve** | 45 | 1.760% | 1.865% | 0.4538 |
| XHB, decision day | 45 | 2.869% | 1.865% | **<0.0001** |
| **TOL, FOMC-eve** | 45 | 2.599% | 2.667% | 0.7063 |
| TOL, decision day | 45 | 3.964% | 2.667% | **<0.0001** |

**Eve is a null on every instrument tested; the decision day is wider on every one, four of five at
p<0.001, and the housing names are where the widening is largest.** Pairwise, holding the meeting
fixed, the eve range is below the decision-day range in **SPY 37/45 (82.2%) · ITB 36/45 (80.0%) ·
XHB 36/45 (80.0%) · QQQ 35/45 · DHI 35/45 · TOL 34/45**, at median ratios of 1.33–1.72×. VIX closes
lower on the decision day than on the eve in 26 of 45 (57.8%), median −0.56 — the classic
resolution, and another reason the eve is the coiled session rather than the moving one.

**The overlap is rare, which is exactly why it is worth writing down.** Of **77** New Residential
Sales release sessions since 2020 with bars, only **three** touched an FOMC decision or its eve:
`2022-01-26` and `2023-07-26` were decision *days*, `2022-07-26` was the only *eve*. 2026-10-27
would be the fourth, and the second eve. A reader who sees ITB trade a 3% range on Wednesday
2026-10-28 and reaches back to Tuesday's housing print for the reason will be wrong, and the base
rates above are the dated form of why.

### Leg 5 — the number itself · **REFUTED as a day-one reading**, on Census's own error bars

Two facts from 40 unique editions parsed out of 117 Wayback captures, both stated by Census itself.

**The headline m/m is flagged not statistically significant in 37 of 40 editions (92.5%).** Only
three cleared: **October 2024 (−17.3%, ±12.8%)**, **May 2025 (−13.7%, ±13.1%)** and **January 2026
(−17.6%, ±13.3%)**. The median stated margin of error is **±15.5%** (range ±10.6% to ±24.2%; **38 of
40** editions state ±12% or wider) against a median absolute move of **5.8%** — the typical print
moves **37.7%** of its own error bar, and clearing it takes roughly a **13%** swing, which happened
**3 of 40** times. FRED's `HSN1F` agrees independently: median \|m/m\| over the last 60 months is
**5.85%**, p75 **9.38%**, max **20.33%**.

**And September specifically is a quiet month in the revised series.** The last twelve
September month-over-month changes read **+3.1 · −12.0 · −3.0 · +14.6 · +0.3 · 0.0 · −3.6 · +6.5 ·
−12.9 · +5.7 · +4.1 · +2.3 %** (2014→2025) — a median absolute move of **3.85%**, and exactly
**one** (2017's +14.6%) would have cleared a ±13% bar. The archive holds only two September-reference
*editions* (2023-09 at +12.3%\*, 2024-09 at +4.1%\*), both asterisked; that thinness is an honest
limit, and the FRED read above is what carries the seasonal claim.

**The revision is large and directionally random.** Each release restates the prior month, so
pairing a month's first-published level with the next release's restatement isolates one month of
revision. Across **33 first→revised pairs**: mean \|revision\| **3.26%**, median **2.79%**, max
**10.09%** (April 2024, 634,000 → 698,000), p75 **4.63%**, p90 **5.94%**; **17 up-revisions to 14
down**; **≥1.0% in 26 of 33 (78.8%)**; **larger than the first print's own m/m in 10 of 33**; and
**opposite in sign to the first print's reported direction in 18 of 33 (54.5%)**. For this event the
restating edition is **2026-11-25**, six days inside the close-out window's reach.

### Leg 6 — the schedule survived the lapse intact · **SUPPORTED**

**84 reference months, 2019-12 through 2026-11, zero missing and zero deleted.** Median
reference-month-end → release lag **25 days** (min 22, max 105, n=84) — the tightest in this family,
which is what the deterministic 17th-workday rule buys. The lapse catch-up doubled up rather than
queueing: three release dates carried **two reference months each** (2026-01-13, 2026-02-20,
2026-05-05). Normal cadence resumed with the **2026-05-28** edition, and the September-2026
reference lands on **2026-10-27 at a 27-day lag** — the sixth consecutive on-schedule release, and
two days slower than the 25-day median only because the 17th workday falls late in a month with an
early-October weekend pattern. `cr-expiry-2026-12-11` sits well past this print and does not reach
it.

### Primary content read — what the newest edition says, and what it hides

**CB26-128** (released 2026-08-25, July 2026 data, read direct from the release page this session):
new single-family home sales **607,000** SAAR, **10.5% (±14.0%)\* below** the revised June rate of
678,000 and **6.3% (±19.6%)\* below** July 2025's 648,000. New houses for sale at month end
**488,000**, +1.9% (±1.2%) m/m — **a supply of 9.6 months**. Median sales price **$393,800** (−2.3%
±7.4%\* m/m, −0.9% ±6.9%\* y/y); average **$508,800** (+4.1% ±11.8% m/m, +5.4% ±13.1% y/y).

Both asterisked headline moves are inside their error bars. The inventory line is not:

| Series (Jul 2026, SAAR / level) | Level | y/y | Position |
|---|---|---|---|
| **New houses for sale** | **488,000** | −1.6% | **85.3% of its Jul-2006 all-time peak — last matched Dec 2007** |
| **Months' supply** | **9.6** | +4.3% | **last matched outside this cycle in Apr 2009 (10.7)** |
| New single-family sales | 607,000 | −6.3% | **43.7%** of its Jul-2005 peak |
| Single-family starts | 808,000 | −15.7% | −55.7% off its Jan-2006 peak |
| Residential construction put in place | $871.2B | −7.3% | −11.7% off its May-2022 peak |
| Median new-home price | $393,800 | −0.9% | −14.4% off its Oct-2022 peak |
| Average new-home price | $508,800 | +5.4% | −6.0% off its Jul-2022 peak |
| 30-year fixed mortgage (2026-09-03) | 6.71% | +0.21pp | vs 6.50% on 2025-09-04 |

**Inventory at 85% of an all-time peak against sales at 44% of theirs** is the story, and the split
between the median (−0.9% y/y) and the average (+5.4% y/y) says builders are clearing the bottom of
the mix. That is a composition read this app has no instrument on — which is why it is the
`This quarter` call and not a position.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`.
- **Macro surprises** — none since the last row; there is no last row. The corridor is the densest
  this print has ever landed in: October OPEX **10-16**, FOMC blackout from **10-17**, housing
  starts **10-20** (live proposal, sibling lane), 2y note **10-26** and the MWTS benchmark revision
  **10-26**, **this print 10-27** 10:00 alongside tracked `durable-goods-2026-10-27` (8:30, the M3-1
  trigger), `consumer-confidence-2026-10-27`, two ECB releases and a 5y note, then the
  **`high`-tier `fomc-2026-10-28`** with the AEIR, then GDP Q3 advance + PCE + the ECB decision
  **10-29**, ECI + Chicago PMI + the BoJ **10-30**. **Eighteen tracked events sit within five days
  of this print, three of them `high`-tier — and the print is the smallest item in the corridor.**
- **Volatility regime** — VIX **14.53**, SPY **770.19**, QQQ **718.96**, ITB **93.91**, XHB
  **103.25**, DHI **142.75**, LEN **83.58**, PHM **124.45**, TOL **141.73** (2026-09-04 closes,
  Yahoo daily bars). Baseline reading; nothing to diff against yet.
- **Geopolitical / policy** — PL 119-103 funds through 2026-12-11 (carried from the sibling
  ledgers), well after this print. Tariffs reach new-home sales through lumber and appliance input
  costs rather than through this statistic's publication, and there is no channel to a series with
  no symbols. The mortgage channel is the live one and it is flat: 6.71% on 2026-09-03 against 6.50%
  a year earlier. The **live policy fact for this date is the FOMC itself** — the print speaks into
  a blackout, one morning before a decision.
- **Event tape** — no September consensus exists at D-51 and none will before the **09-24**
  August-data edition sets the base. Every September-content statement here is a base rate.
- **Two dated events proposed in this PR**, each its own file owned by this lane:
  **`fhfa-hpi-2026-10-27`** — the FHFA House Price Index *monthly* release (August 2026 data), on
  fhfa.gov's own forward release-date table, landing the **same day** as this print. The calendar
  tracks housing *quantity* in six places and has no house-price entry at all, while this print
  publishes a median and an average price monthly with no independent read beside it. The sibling's
  `fhfa-hpi-2026-11-24` proposal is the *quarterly* edition a month later, so the two stack rather
  than collide. And **`housing-vacancies-q3-2026-10-28`** — Census's quarterly Housing Vacancies and
  Homeownership release (Q3 2026, 10:00), the *stock* side of the same market and the independent
  check on the inventory-overhang argument this ledger's `This quarter` call rests on.
- **Three considered and declined**, so their absence reads as a decision: **`housing-starts-2026-10-20`**
  (the 12th-workday twin on the very SOC schedule table used as a primary here) is already a live
  proposal from the `construction-spending-2026-11-02` lane and under research by a sibling lane
  this cycle; **S&P CoreLogic Case-Shiller**, which shares FHFA's last-Tuesday slot, is **not**
  proposed because its publisher returned **403** and this lane does not file a date it could not
  read on a primary (recorded in `probe-ref.blocked`); and **Preliminary U.S. Imports for
  Consumption of Steel Products**, which shares this print's exact 10:00 Census slot on 10-27, is
  not proposed because it is one of the release families this calendar's own history shows Census
  suspending, it appears on neither Atlanta Fed column, and it has no bearing on housing.

### Honest limits

- **The FOMC-eve result is about a session type, not about this print.** 45 pairs is a real n and
  the effect sizes are large, but the eve null is an *absence* on five instruments, and a coiled
  pre-FOMC session that resolves violently at 2:00 p.m. the next day is a well-known market
  regularity, not a discovery. What is new here is only the *conjunction* — that this particular
  release lands on that particular session — and that conjunction has an n of 1 going forward.
- **The exact 2026-10-27 nowcast bundle has n=2.** The attribution argument deliberately runs
  through the complement (M3-1 without this print, n=34) rather than through the matching class,
  because two observations cannot carry a claim. A reader should treat "the residential move is this
  print's" as an elimination argument, not a measured effect for this bundle.
- **The October-quiet observation has no controls and no mechanism.** p=0.0984 on n=11, and unlike
  the sibling's November result no co-release or baseline control was run on it. It is recorded
  because suppressing an inconvenient seasonal would be dishonest, and it is explicitly not allowed
  to move `-1`'s bar.
- **The tape null is a null.** Eight instruments failing to reject at n=65 is a strong absence of
  evidence, but the smallest detectable effect is not computed here, and a real intraday effect
  confined to the 10:00–10:15 window would be invisible in a daily bar. The claim is "the session
  does not widen," not "no price moves at 10:00."
- **The identification on the nowcast is weaker than the sibling construction-spending lane's.**
  The median effect is large and the distribution clearly shifted, but you could not read the
  release calendar off the residential column.
- **The classifier is free text.** `ContribArchives`'s `Data releases` column spells this input 21
  ways across the decade; the matcher is a broad regex on "new home(s)"/"new-home", comma-tokenised
  but not otherwise cleaned. A vintage whose text silently omits the release would be misfiled into
  the baseline, biasing every test **toward** finding no difference.
- **All the nowcast work measures a model, not a market.** `ContribArchives` ends 2026-07-28 and
  carries no Q4-2026 vintages, so `-1`'s class priors are out-of-sample for the quarter being
  nowcast.
- **The revision series is 33 pairs, archive-sourced, and not a clean difference.** The restated
  figure is the value as of the *next* release, which incorporates one month of survey revision
  **and** any seasonal or benchmark revision landing in between. Coverage is 2022–2026 with gaps,
  determined by what the archive holds rather than by sampling. Only **two** September-reference
  editions are in it, which is why the September seasonal claim leans on FRED instead.
- **The component read is on revised data.** The inventory, months-supply and price figures come
  from FRED's current series, which is the *revised* basis — not the basis a day-one headline is on.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has
  no instrument attached and no macro-keyed house playbook. ITB, XHB, DHI, LEN, PHM and TOL were
  measured because they are the obvious candidates, not because anything holds them.

## Stance & kill switches

**Stance (date is `confirmed`).** Stand aside on 2026-10-27 and on every edition of this report.
Hold four frames. **On identity:** the proposal is right — this is an "other release" on the Atlanta
Fed's own list, drawing a posted update on 7 of 12 2026 editions, and 2026-10-27's `PostedUpdates`
row is the cleanest of them, naming only the M3-1 trigger and this print. **On the model:** the
footprint replicates independently — vintages naming this print alone (n=93) move residential
0.0543pp against a 0.0058pp baseline, p<0.0001, while moving \|Δ GDP\| *less* than baseline (0.0528
vs 0.0961, p=0.0295) — and on 10-27 a residential move is this print's by elimination, because M3-1
without it moves residential a median 0.0005pp with 3 of 34 vintages clearing 0.02pp. No headline
claim is made for this date. **On the tape — the frame this edition adds:** the release-day null
replicates on all eight instruments (p 0.22–0.88, homebuilders narrower), and **2026-10-27 is
FOMC-eve**, which is itself a measured null (five instruments, 45 pairs, p 0.31–0.85) sitting one
session before a measured *loud* day (ITB 3.154% vs 2.012%, p<0.0001; XHB and TOL likewise at
p<0.0001; SPY p=0.0009). Two stacked nulls, and the corridor's housing risk belongs to Wednesday's
Fed, not to Tuesday's print — a distinction only 3 of 77 release sessions since 2020 have ever
forced. **On the print itself:** Census flags the m/m as not statistically distinguishable from zero
in 37 of 40 measured editions — median stated error ±15.5% against a median move of 5.8%, needing
~13% to clear, and September is quieter than most months (1 of the last 12 would have cleared) — and
the one-month revision runs a median 2.79%, is ≥1.0% in 26 of 33 pairs, and moves *against* the
first print's own direction in 18 of 33. Read September on 2026-11-25. Nothing here licenses an
entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **ITB's 2026-10-27 session high-low range comes in at or above its 2026-10-28 range.** This is the
  single most decision-relevant claim in the ledger — that the print's session is the quiet one and
  the Fed's is the loud one — and its base rate is 36 of 45 pairs (80.0%). A reversal would mean
  either that this print does move housing names after all, or that the pre-FOMC coil has stopped
  being a regularity; both would force Leg 4 to be re-derived rather than patched.
- **Any of the eight measured instruments prints a release-day median session range above its own
  baseline at p<0.05** on a re-run after 2026-11-25. The release-day null now has two independent
  measurements behind it; one instrument crossing would mean the 2021–2026 window is a regime rather
  than a fact about this print.
- **FOMC-eve sessions test *wider* than baseline at p<0.05** on the same re-run. The stacked-null
  reading needs both halves; the eve half is the newer and the more fragile.
- **The 2026-10-27 headline m/m clears its own stated margin of error.** 3 of 40 measured editions
  did, all of them ≥13% moves, and only 1 of the last 12 Septembers moved that far. A statistically
  significant September print makes this a reading rather than a noise print.
- **The 2026-11-25 restatement of September 2026 is under 1.0% in absolute value.** 26 of 33 pairs
  cleared that bar. One observation would not overturn a 33-pair median of 2.79%, but a run of them
  would kill the "read it on the revision" framing entirely.
- **The September-2026 reference month is deleted rather than delayed** — a `Suspended` row where a
  date belongs on a Census calendar. 84/84 becomes 84/85 and Leg 6's record argument is overturned.
- **The October 2026 FOMC meeting moves off 10-27/10-28.** The whole tape frame of this ledger is
  the eve/decision adjacency; if the Fed reschedules, 10-27 becomes an ordinary release day and only
  the first kill switch survives, in weaker form.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-10-27.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it a live
  question — though on this ledger's own measurements the answer would still be no.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-new-home-sales-2026-10-27-1` — the **2026-10-27 GDPNow vintage moves the Q4-2026 residential
  contribution by at least 0.02pp**. Base rate 78.3% pooled, 85.0% since 2021, 8 of 11 on
  October-dated vintages. Score by 2026-11-02.
- `FT-new-home-sales-2026-10-27-2` — the **2026-10-27 release carries Census's
  not-statistically-significant asterisk on its new-single-family-home-sales m/m**. 37 of 40
  measured editions did. Score by 2026-11-02.
- `FT-new-home-sales-2026-10-27-3` — **ITB's 2026-10-27 session high-low range is below its
  2026-10-28 range** (the FOMC decision day). Base rate 36 of 45 pairs (80.0%), median ratio 1.68×.
  Score by 2026-11-02.
- `FT-new-home-sales-2026-10-27-4` — the **one-month revision to the September 2026 level, as
  restated by the 2026-11-25 edition, is at least 1.0% in absolute value**. 26 of 33 pairs cleared
  it. Score by 2026-11-30.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-51 | **Initial research on an id that existed only as a proposal. The series was already measured by the 11-25 sibling; what this edition adds is the date — 2026-10-27 is FOMC-eve, which stacks a second measured null on top of the release-day null and moves the corridor's housing risk onto 10-28.** Canonical `src/domain/market-events/new-home-sales-2026-10-27.json` written this session after reading the single proposal (`from-construction-spending-2026-11-02`), now shadowed. **Leg 1 — date promoted `estimate` → `confirmed`** on two Census primaries fetched today: `calendar-listview.html` (`A202610271000`, period `A202609`, 10:00) and `construction/soc/schedule.html`, whose `September 2026` row reads `October 20, 2026 \| October 27, 2026` under a header naming New Residential Sales at 10:00 (17th-workday rule). The 12th-workday twin **2026-10-20** is `housing-starts-2026-10-20`, a live sibling proposal — not re-proposed. **Leg 2 — the bundle is the cleanest of 2026:** `GDPNowcastDataReleaseDates.xlsx` puts new-home sales in the **other-releases** column (10 items) not the **8 triggers**; **7 of 12** 2026 editions drew a *posted* update, **4** internal-only, 1 neither — and the `PostedUpdates` row for **2026-10-27** reads, in full, `Advance Census manufacturing (M3-1) , New-home sales` — **two items, where the other four posted 2026 vintages naming this print carry five each.** **Leg 3 — footprint replicated independently on 1,822 same-quarter deltas (1,871 vintages 2014-05-01 → 2026-07-28):** new-home-sales-ALONE vintages (**n=93**) move \|Δ resid\| **0.0543pp** vs a **0.0058pp** baseline (**p<0.0001**), \|Δ fixed\| 0.0559 vs 0.0286 (p=0.0029), \|Δ GDP\| **0.0528 vs 0.0961 (p=0.0295** — a quieter headline day). **New for this date, the attribution runs through the complement because the matching class is n=2 (2023-06-27, 2024-12-24): M3-1 named WITHOUT new-home sales moves \|Δ resid\| a median 0.0005pp (n=34) with only 3 of 34 clearing 0.02pp, and M3-1-alone reads 0.0002pp (n=20)** — so a residential move on 10-27 is this print's by elimination. **No headline claim is made:** M3-1-without-NHS \|Δ GDP\| 0.1155 vs 0.0961 baseline is **p=0.5542**. **Recorded and not leaned on:** October-dated NHS vintages are the *quietest* month — 0.0246pp (n=11) vs 0.0537pp non-October, **p=0.0984** — with baseline October NOT depressed (p=0.4968); opposite in sign to the sibling's loud-November result and weaker than it, with no controls run, so `-1` keeps the pooled bar and the caution does not bite (**8 of 11** Octobers still clear 0.02pp, **4 of 4** since 2021). **Leg 4 — the tape null REPLICATES on a fresh pull and then gains a second layer:** SPY 1.032% vs 0.976% **p=0.5957**, QQQ **p=0.8604**, ITB 1.876 vs 2.012 **p=0.2979**, XHB 1.744 vs 1.865 **p=0.3110**, DHI **p=0.5637**, LEN **p=0.8847**, PHM **p=0.8313**, TOL 2.477 vs 2.667 **p=0.2249** (n=65 each since 2021); close-to-close agrees (SPY p=0.9295, ITB p=0.8638, XHB p=0.6951, DHI p=0.9516); 28 of 81 dates are Census-solo and the 17 solo sessions are quieter still (SPY 0.793, ITB 1.711, XHB 1.629). **THE FINDING: federalreserve.gov's FOMC calendar (HTTP 200, 164,831 bytes, 56 decision days 2021→2027) puts the October 2026 meeting on 10-27/10-28, so this print is 10:00 on day one, inside the blackout from 10-17.** FOMC-**eve** is a null on every instrument — SPY 0.924 vs 0.976 **p=0.6681**, QQQ **p=0.8499**, ITB 1.851 vs 2.012 **p=0.3068**, XHB **p=0.4538**, TOL **p=0.7063** (n=45) — while the **decision day is much louder: ITB 3.154 vs 2.012 p<0.0001, XHB 2.869 vs 1.865 p<0.0001, TOL 3.964 vs 2.667 p<0.0001, SPY 1.370 vs 0.976 p=0.0009, QQQ p=0.0288.** Pairwise, eve-range < decision-range in **SPY 37/45 (82.2%), ITB 36/45 (80.0%), XHB 36/45, QQQ 35/45, DHI 35/45, TOL 34/45**, median ratios 1.33–1.72×; VIX closes lower on the decision day in 26/45 (57.8%), median −0.56. **Rarity: only 3 of 77 release sessions since 2020 touched an FOMC decision or its eve (2022-01-26 and 2023-07-26 were decision days, 2022-07-26 the only eve) — 10-27 would be the 4th and the 2nd eve, which is why the mis-attribution risk on 10-28 is worth a written call.** **Leg 5 — the number, from 117 Wayback captures (all parsed; 40 unique editions 2022-10 → 2026-07, a DIFFERENT capture set from the sibling's 130 reaching the same 40):** m/m flagged **not significant in 37 of 40 (92.5%)**, exceptions Oct-2024 (−17.3%, ±12.8%), May-2025 (−13.7%, ±13.1%), Jan-2026 (−17.6%, ±13.3%); median stated MoE **±15.5%** (38 of 40 ≥±12%) vs median \|m/m\| **5.8%** — the typical print moves 37.7% of its own error bar and needs ~13% to clear (3 of 40 did). FRED `HSN1F`: median \|m/m\| 60m **5.85%**, p75 9.38%, max 20.33%. **September-specific:** the last twelve September m/m readings (2014→2025) are +3.1/−12.0/−3.0/+14.6/+0.3/0.0/−3.6/+6.5/−12.9/+5.7/+4.1/+2.3%, median \|move\| **3.85%**, and **only 2017's +14.6% would have cleared ~13%**; the archive holds just two September editions (2023-09 +12.3%\*, 2024-09 +4.1%\*), an honest thinness. **33 first→revised pairs:** mean **3.26%**, median **2.79%**, max **10.09%** (Apr-2024 634k→698k), p75 4.63%, p90 5.94%; **≥1.0% in 26 of 33 (78.8%)**, 17 up / 14 down, larger than the first print's own m/m in 10 of 33, and **opposite in sign to the first print's direction in 18 of 33 (54.5%)**. September's restating edition is **2026-11-25**. **Leg 6 — schedule intact:** **84 reference months 2019-12 → 2026-11, zero gaps, zero `Suspended` rows on any of the seven calendars (1,117 unique rows)**, median lag **25d** (22–105); three dates carried two reference months each (2026-01-13, 02-20, 05-05) clearing the lapse backlog; cadence resumed 2026-05-28 and **10-27 is the 6th consecutive on-schedule edition, at a 27-day lag**. **Primary content — CB26-128 read direct (2026-08-25, July data):** **607,000** SAAR, **−10.5% (±14.0%)\*** m/m off a revised 678,000, **−6.3% (±19.6%)\*** y/y; for-sale **488,000**, **9.6 months' supply**; median **$393,800** (−0.9% y/y), average **$508,800** (+5.4% y/y). **For-sale inventory is 85.3% of its Jul-2006 all-time peak (last matched Dec 2007) and months' supply of 9.6 was last matched outside this cycle in Apr 2009 (10.7), while sales are 43.7% of their Jul-2005 peak** — median −0.9% y/y against average +5.4% says builders are clearing the bottom of the mix. Mortgage 30y **6.71%** (2026-09-03) vs **6.50%** (2025-09-04). **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** OPEX 10-16, blackout from 10-17, housing starts 10-20 (sibling proposal), MWTS benchmark revision + 2y note 10-26, **this print 10-27 alongside tracked durable-goods (8:30, the M3-1 trigger), consumer-confidence, two ECB releases, a 5y note and a 20y/30y buyback**, **`high`-tier FOMC + AEIR 10-28**, GDP Q3 advance + PCE + ECB decision 10-29, ECI + Chicago PMI + BoJ 10-30 — **eighteen tracked events within five days, three `high`-tier, and this print is the smallest item in the corridor.** **Volatility:** VIX **14.53**, SPY **770.19**, QQQ **718.96**, ITB **93.91**, XHB **103.25**, DHI **142.75**, LEN **83.58**, PHM **124.45**, TOL **141.73** (2026-09-04 closes) — baseline, nothing to diff against yet. **Geopolitical:** PL 119-103 through 12-11 (carried), after this print; the live channel is mortgages and it is flat; the live *policy* fact for this date is the FOMC itself. **Event tape:** no September consensus at D-51; the 09-24 August-data edition sets the base. **Two dated events proposed** (own files, `estimate`): **`fhfa-hpi-2026-10-27`** — the FHFA House Price Index **monthly** release (Aug 2026 data) on fhfa.gov's own forward table, **the same day as this print**; the calendar tracks housing quantity in six places and has **no house-price entry at all**, and the sibling's `fhfa-hpi-2026-11-24` is the *quarterly* edition a month later, so the two stack rather than collide. And **`housing-vacancies-q3-2026-10-28`** — Census's quarterly Housing Vacancies and Homeownership release (Q3 2026, 10:00, `A202610281000`), the **stock** side of the market and the independent check on the inventory-overhang argument, landing on the FOMC decision day where its own move would be unreadable. **Three declined on the record:** `housing-starts-2026-10-20` (already a live sibling proposal), **S&P CoreLogic Case-Shiller** (publisher returned **403**; no primary, no entry — recorded in `probe-ref.blocked`), and **Preliminary Steel Imports**, which shares this print's exact 10:00 Census slot on 10-27 but is in the release family Census has historically suspended, appears on neither Atlanta Fed column, and has no housing bearing. **Two fetch failures recorded in `probe-ref.blocked`:** S&P Global 403, and `atlantafed.org/cqer/research/gdbnow` **404** (a typo path in older notes) — the working landing page is `/cqer/research/gdpnow`, off which both workbook links were scraped and resolved under `/-/media/Project/Atlanta/FRBA/Documents/…`, arriving at 16,944 and 10,875,424 bytes. **Four forward tests registered:** `-1` (10-27 vintage moves residential ≥0.02pp; 78.3% pooled, 8/11 Octobers), `-2` (the 10-27 release carries the not-significant asterisk; 37 of 40), `-3` (**ITB's 10-27 range is below its 10-28 range**; 36 of 45 pairs, 80.0%), `-4` (the 11-25 restatement of September differs by ≥1.0%; 26 of 33). | **Initial stance set: stand aside; the date is promoted to `confirmed` on two Census primaries. The series-level findings replicate independently — the model reads this print on the residential line only, the market does not read it at all — and this edition adds the date-specific frame: 2026-10-27 is FOMC-eve, a measured null one session before a measured loud day, so the corridor's housing-name risk sits on 10-28 and belongs to the Fed, not to this print.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-new-home-sales-2026-10-27.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
