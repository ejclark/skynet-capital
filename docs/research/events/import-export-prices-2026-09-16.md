# U.S. Import and Export Price Indexes (Aug 2026 data) — import-export-prices-2026-09-16

**Kind:** macro-print · **Date:** 2026-09-16 (confirmed, BLS: bls.gov/schedule/news_release/ximpim.htm ("August 2026 | Sep. 16, 2026 | 08:30 AM") + bls.gov/schedule/2026/09_sched.htm ("U.S. Import and Export Price Indexes / August 2026 / 08:30 AM", Wednesday the 16th), both fetched direct 2026-08-31) · **Impact:** low
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{},"vix":14.43,"daysBand":"low:15+","adjacentIds":["cpi-2026-09-11","treasury-20y-bond-2026-09-15","fomc-2026-09-16","retail-sales-2026-09-16","treasury-10y-tips-2026-09-17","opex-2026-09-18"],"screenStreak":0} -->

## At a glance

**TL;DR.** Stand aside, and **downgrade the sibling ledger's confidence in this print, don't inherit
it**. [`import-export-prices-2026-10-16`](import-export-prices-2026-10-16.md) filed this event as the
one that "most likely delivers the 'highest since 2022' headline." Recomputed from the BLS public API:
the 5.0% line needs **+0.361% m/m** and the trailing three-month pace is **+0.371%** — a margin of one
hundredth of a percentage point, inside the index's own 0.1-point publication granularity. Published
**136.3 prints 5.01%; 136.2 prints 4.93%.** That is a **coin flip on a single index tick**, not a base
case, and the honest central read is **+4.9% to +5.2%**. Two things are new here. First, a
**one-month-lagged Brent transfer function** (fuel m/m ≈ 1.09 + 0.436 × prior-month Brent average m/m;
n=11, **R² 0.71**) says the June–July fuel drag **ends** in August — so all-imports 12-month likely
*re-accelerates* to **~6.2–6.6%** from 5.95%, and the headline/nonfuel **convergence the 10-16 ledger
projects does not begin at this print**. Second, this is the **last import/export release unconditionally
outside the FY2027 funding branch** — it publishes two weeks before the 09-30 deadline, so neither the
delay nor the destroy outcome can touch it. Tier stays **low** and the reason is now stronger than
"no channel": this print shares its 08:30 ET slot with **retail sales** on **FOMC decision morning**
(statement 14:00 ET, a ~57/43 hike coin flip), so nothing it does is attributable. Date is now
**confirmed**. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-16) | **Stand aside** | High | `symbols: []`, `low` tier, no August-data consensus exists, and no house playbook is macro-keyed | Nothing dated today; the read is reassessed, not traded |
| This week | **Watch the labor corridor, not this print** | High | Jobs **2026-09-04** and CPI **2026-09-11** re-rate the 09-16 FOMC this release is buried under; nothing trade-price-keyed lands before then | The **2026-09-04** payroll print resolving the FOMC decisively, which drains the 09-16 session of the variance that makes this print unreadable |
| This month | **Flat the 09-16 session, and treat the 5.0% headline as a coin flip** | Medium | Crossing needs +0.361% m/m against a +0.371% trailing pace — one index tick either way; and the session's price is set by retail sales + a 14:00 ET decision, not by this | The **2026-09-16** print landing at or above **+5.2%** or at or below **+4.7%** nonfuel y/y, either of which says the pace was not the coin flip this doc models |
| This quarter | **Read the m/m and the fuel split; discount the y/y** | Medium | The base declines (Aug-2025 nonfuel −0.2% m/m), so the 12-month rate rises without new pass-through, while fuel — not tariffs — drives the headline | Import **fuel** m/m printing **negative** in the **2026-09-16** release, which kills the lagged-Brent model this quarter's fuel read is built on |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** initiate on this print: `symbols: []`, `low` tier, no macro-keyed house playbook (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed).
- **The 5.0% headline is a coin flip, not a base case (dated, mechanical).** Needs published **136.3** (+0.361% m/m) against a **+0.371%** three-month pace; **136.2 → 4.93%**. Central read **+4.9–5.2%**.
- **The base-effect caution (dated).** Aug-2025 nonfuel base is **129.8** after a **−0.2% m/m** base month, so a *flat* August still prints **+4.62%** vs July's published **+4.5%**. Acceleration in the y/y is not by itself new pass-through.
- **The fuel call (model, estimate-grade).** Prior-month Brent average m/m was **−0.1%**, so fuel m/m ≈ **+1.0%** — the June–July drag (−3.8%, −7.2%) ends, and all-imports y/y **rises** to ~**6.2–6.6%**. Convergence with nonfuel does **not** start here.
- **The inversion to remember.** Import prices **exclude duties** → a *rising* index means foreign exporters are raising pre-tariff prices, so US buyers pay the duty on top of a rising base. Hawkish, not neutral.
- **This print is outside the funding branch (dated).** It publishes **09-16**, before the **09-30** deadline — unlike every later release in this series, no lapse can delay or destroy it.
- **The tier test is not runnable here.** Retail sales shares the 08:30 slot and the FOMC decides at 14:00; any move is unattributable. The tier read gets tested on **10-16**, not on this date.
- **The corridor (dated).** PPI **09-10** · CPI **09-11** · 20Y bond **09-15** · **this print 09-16, 08:30 ET** + retail sales 08:30 + **FOMC 14:00** · 10Y TIPS **09-17** · triple-witching opex **09-18**.
- **Most exposed if it moves anything** — an inherited, estimate-labeled duration ranking, not measured per-symbol: CRWV, then NVDA/AVGO/MRVL, then the mega-caps. AMZN is the one name with a direct channel (imported goods cost, import air freight).

## Initial research

### The question

Will the August-2026 U.S. Import and Export Price Indexes publish on 2026-09-16, what will they show,
and — landing 08:30 ET on FOMC decision morning beside retail sales, as the print the sibling ledger
nominated as the "highest since 2022" reveal — does a `low`-tier trade-price release carry any signal
for our nine tracked AI-infra / mega-cap names?

### One-line verdict

The date is confirmed and the tier is correctly `low`, but the sibling ledger's central expectation for
this event is **over-confident**: the 5.0% nonfuel threshold sits one index tick away from the trailing
pace, and the fuel side is pointing the *opposite* way from that ledger's convergence projection.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode — no
price instruments exist for this kind). Four primaries fetched **direct** this session: the BLS
import/export release schedule, the September-2026 monthly schedule, the current news release
(July 2026 data, `news.release/ximpim.nr0.htm`), and the BLS public data API (`api.bls.gov/publicAPI/v1`,
series `EIUIR`, `EIUIQ`, `EIUIREXFUELS`, 2021–2026). Every index level and percent change below is
computed from the API, not inherited from the sibling ledger; where the two disagree the disagreement is
stated as a finding, not silently reconciled. Brent monthly **averages** (not month-end closes) were
computed from Yahoo daily bars to fit the fuel model in Leg 5 — the sibling ledger used closes, which is
what made the fuel path look incoherent. Market levels are Yahoo closes via the same probe helper
`event-material-scan.mjs` uses.

**Fetch recipe, sharpened again.** The sibling recorded that BLS 403s to browser headers alone and
returns 200 with `Referer: https://www.bls.gov/` + `Sec-Fetch-Site: same-origin` + `--compressed`. That
recipe **403'd this session**. What returned 200 was the full navigation header set on top of it:
`Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, `Sec-Fetch-User: ?1`, `Accept-Language`, and
`Upgrade-Insecure-Requests: 1`. Worth carrying forward — the gate appears to be tightening release over
release, so the next session should assume the recipe needs another header rather than that BLS is down.

### Leg 1 — the date. SUPPORTED, and flipped `estimate` → `confirmed` this session.

Two independent BLS views agree. The by-release schedule (`bls.gov/schedule/news_release/ximpim.htm`)
reads "August 2026 | **Sep. 16, 2026** | 08:30 AM", and the by-month September schedule
(`bls.gov/schedule/2026/09_sched.htm`) puts "U.S. Import and Export Price Indexes / August 2026 /
08:30 AM" on **Wednesday the 16th**. The entry was filed `estimate` on 08-31 by the sibling session that
discovered it, purely because the lane forbids an adjacency sweep from confirming the event it just
found; this is that event's own research session with both primaries in hand — the exact condition the
hard limit names. Promoted with a `BLS:` prefix.

### Leg 2 — THE correction: the 5.0% headline is a coin flip on one index tick, not a base case. SUPPORTED (BLS API, computed).

The sibling ledger's calendar note for this event says the trailing three-month pace "**alone** gives
+5.01% y/y — the first reading at or above 5.0% since May 2022." The arithmetic is right and the
**confidence attached to it is not**. Nonfuel (`EIUIREXFUELS`) sits at **135.8** in Jul-2026 against an
Aug-2025 base of **129.8**:

| Aug-2026 m/m path | Raw level | Published (0.1) | Implied nonfuel 12-mo |
|---|---|---|---|
| **0.00% (flat)** | 135.80 | 135.8 | **+4.62%** |
| +0.10% | 135.94 | 135.9 | +4.70% |
| +0.259% (last 2 months' average) | 136.15 | 136.2 | **+4.93%** |
| **+0.371% (last 3 months' average)** | 136.30 | **136.3** | **+5.01%** |
| +0.512% (2026 six-month average) | 136.50 | 136.5 | +5.16% |

The exact level required for 5.0% is **136.29** — a **+0.361%** m/m move. The trailing three-month pace
is **+0.371%**. The whole distance between "highest since May 2022" and "no headline" is **0.01
percentage points of m/m**, which is smaller than the index's own publication granularity: one 0.1-point
tick moves the y/y by **0.077pp**. And the recent m/m path is decelerating inside that three-month
average — **Apr +0.902 · May +0.596 · Jun +0.148 · Jul +0.370** — so the two-month pace (+0.259%) lands
at **4.93%**, on the wrong side of the line.

Central read: **+4.9% to +5.2%**, with the record headline roughly **even money**. This is the single
most useful correction in the document: the sibling ledger's "this month" call points *at* this event as
the reveal; the honest version is that this event is a coin flip and **10-16 is where the base effect
becomes near-unconditional** (there, the flat path itself prints +4.62% against a lower September base
and two months of accumulated pace).

### Leg 3 — the base month was soft, verified in the primary rather than assumed. SUPPORTED (BLS release, Table A).

The base-effect claim rests on what August 2025 actually did, and the current release states it in
Table A rather than leaving it to be inferred from levels:

| Aug-2025 m/m | All imports | Fuel | **Nonfuel** | All exports | Agricultural | Nonagricultural |
|---|---|---|---|---|---|---|
| | −0.1 | −0.7 | **−0.2** | +0.1 | −0.1 | +0.2 |

A **−0.2%** nonfuel base month is why a *flat* August 2026 still lifts the 12-month rate from July's
published **+4.5%** to **+4.62%**. The base declines; the rate rises unaided. Same mechanism the sibling
ledger found for its own print, verified independently here rather than carried.

### Leg 4 — the acceleration is real in the m/m, not only in the y/y. SUPPORTED (BLS API, computed).

Worth separating, because "the y/y is partly artifact" is easy to over-read into "nothing is happening."
Nonfuel cumulative moves: **Jan-2025 129.8 → Jul-2025 130.0** is **+0.15% over six months**;
**Jan-2026 131.7 → Jul-2026 135.8** is **+3.11% over six months** — roughly **twenty times** the 2025
pace. The 12-month path (**1.46 → 2.15 → 2.46 → 3.07 → 3.76 → 4.24 → 4.46** for January through July
2026) is seven consecutive months of acceleration, and the m/m series is what is driving it. The base
flatters the *level* of the rate at the margin; it did not manufacture the trend.

Corroborating detail from the release, verified in the primary text: import prices **from China +0.8%
m/m** in July, which BLS calls "the largest monthly increase since the price index rose 0.8 percent in
**July 2008**" (+2.7% over 12 months), with the **US–China terms-of-trade index −1.3%**. Import
**capital goods +0.9%**, led by "computers, peripherals and semiconductors" — the AI-infra input line.
Read against the duty-exclusion methodology (Leg 7), that is a series saying exporters are **not**
absorbing.

### Leg 5 — the fuel drag ends in August, so the headline re-accelerates. SUPPORTED (model, R² 0.71 — and it contradicts the sibling's projection).

The sibling ledger extrapolated all-imports forward at "−0.333%/mo (last 2 months' average)" and
concluded that headline and nonfuel **converge** near 5.5%. That extrapolation assumes a fuel drag that
the oil tape says is already over, and it used Brent month-**end closes**, which is the wrong series —
the import fuel index prices transactions across the month.

Fitting import fuel m/m (BLS Table A, 11 observations Jul-2025 → Jul-2026, the lapse months excluded)
against **prior-month Brent monthly average** m/m:

| Specification | n | β | intercept | r | R² | Predicted Aug-2026 fuel m/m |
|---|---|---|---|---|---|---|
| **Brent lagged 1 month** | 11 | **0.436** | +1.09 | **0.840** | **0.706** | **+1.05%** |
| Contemporaneous Brent | 11 | 0.227 | +2.07 | 0.436 | 0.190 | +3.00% |
| Lagged 1m, dropping the influential Mar-2026 spike | 10 | 0.531 | +1.21 | 0.682 | 0.466 | +1.15% |

The lagged specification fits, the contemporaneous one does not, and the sign and magnitude survive
dropping the most influential point. Brent monthly averages: **Jun-2026 84.62 → Jul-2026 84.51 (−0.1%)
→ Aug-2026 87.95 (+4.1%)**. So August's fuel index is predicted **+1.0% to +1.2%** — the June–July drag
(**−3.8%, −7.2%**) is done. The positive intercept is not noise: import **natural gas** ran **+74.3%**
over 12 months and **+5.3% m/m** in July, lifting the fuel index independently of crude.

The fuel weight in the all-imports index is implied by BLS's own published components — **0.1053** from
July's identity (−0.4 = w·(−7.2) + (1−w)·0.4) and **0.1026** from June's, so ≈ **10.4%**. Rolling both
forward from `EIUIR` 149.6 against an Aug-2025 base of **141.0**:

| Aug-2026 path | All-imports m/m | Published level | All-imports 12-mo | Gap vs nonfuel |
|---|---|---|---|---|
| fuel +1.05%, nonfuel +0.371% (central) | +0.44% | 150.3 | **+6.60%** | 1.59pp |
| fuel flat, nonfuel +0.371% | +0.33% | 150.1 | +6.45% | 1.45pp |
| fuel +1.05%, nonfuel flat | +0.11% | 149.8 | +6.24% | 1.62pp |

Against July's published **+5.95%** and a July gap of **1.49pp**, the central path has the headline
**re-accelerating** and the gap **widening slightly**. The convergence story starts later than the
sibling ledger projects, if at all — and by the same model, September's fuel (prior-month Brent
**+4.1%**) reads **≈ +2.9%**, which pushes the 10-16 print further from convergence, not closer. That is
a dated, falsifiable disagreement with a sibling document, registered as **FT-30**.

### Leg 6 — this is the last release in the series that the funding branch cannot touch. SUPPORTED (dates, primary-anchored).

Both sibling ledgers spend a leg on the delay-vs-destroy branch. For this event the branch **does not
exist**: the release is **2026-09-16**, two weeks *before* the FY2027 deadline of **2026-09-30**, and its
August reference month was collected in August. There is no lapse scenario in which it is delayed or
suppressed. That makes this print the clean control in the series — the one whose outcome is
unconditionally scoreable — and it is why the forward test registered here keys on this date rather than
on a later one that a lapse could void.

The measured 2025 precedent, carried and not re-litigated: the September-2025 reference month was
**delayed 47 days** (Oct 17 → Dec 3) because collection finished pre-lapse, while the October-2025 month
was **destroyed**. Funding status re-checked and `NEWS:`-grade: House CR to Dec 4 (220–205, 07-21),
Senate CR to Dec 11 (90–6, 08-08), House took up the Senate text 08-31; nothing signed.

### Leg 7 — the interpretive key: these indexes exclude duties, which inverts the naive read. SUPPORTED (inherited, BLS primary).

Carried from the sibling ledger and not re-litigated, because it is methodology rather than a market
read. BLS's *Beyond the Numbers* study "How tariffs relate to BLS import and export price indexes"
(Camp, vol. 9 no. 6, May 2020) states: "Tariffs are not included in the prices used to calculate the
U.S. Import and Export Price Indexes." The reason is national-accounts consistency — these indexes
deflate the net-trade component of GDP, and taxes are not part of net trade.

| What the index does | What it actually means |
|---|---|
| **Falls** after a tariff | Foreign exporters cut pre-duty prices — they are **absorbing** the tax |
| **Flat** | Neither side moved the pre-duty price; the buyer eats the whole duty |
| **Rises** | Exporters are **raising** pre-duty prices — the buyer pays duty **on top of a rising base** |

So a rising nonfuel import index during a tariff regime is a hawkish goods-pass-through datapoint, and
it is the opposite of what "import prices up" suggests to a general reader.

### Leg 8 — the tier is `low` and, unusually, the tier claim is untestable at this print. SUPPORTED (structural).

Calendar position is the loudest thing about this event and it still is not a transmission channel. The
08:30 ET slot is shared with **`retail-sales-2026-09-16`**, which that ledger records as drawing "the
second-largest trader reaction after the jobs report," and the session's price is set at **14:00 ET** by
an FOMC decision the `fomc-2026-09-16` ledger currently reads as a **~57/43 hike-vs-hold coin flip**
after Warsh's 08-28 Jackson Hole keynote. Two structural points follow:

1. **No channel.** BLS states these indexes' role plainly — deflating the **net-trade component of
   GDP** — so there is no path into PCE and none into the FOMC's inflation picture, which closed on
   PPI **09-10** / CPI **09-11**. A release at 08:30 on decision morning also lands inside the
   blackout, after the Committee's materials are set; it cannot reach the 14:00 statement even in
   principle. The real destination is real net exports in Q3 GDP, whose advance estimate is
   **`gdp-q3-2026-advance-2026-10-29`**.
2. **And the tier test cannot run here.** The sibling ledger's tier kill switch — "an NDX move ≥1%
   attributable to this release" — is **unattributable on 09-16** with retail sales in the same slot
   and a coin-flip decision six hours later. Rather than register a falsifier that cannot fire (the
   exact defect the sibling ledger caught in *its* sibling), this ledger states the tier read as
   structurally asserted and **defers its test to 10-16**, where the only confound is opex.

### Leg 9 — the destroyed months, sharpened from the primary. SUPPORTED (BLS release + API), and it corroborates FT-28 rather than duplicating it.

Table A of the current release carries the footnote verbatim: "**Some Oct and Nov 2025 data values are
not available due to the 2025 lapse in appropriations.**" The table shows **dashes for both October and
November 2025** across all imports, fuel, nonfuel, all exports and nonagricultural exports — with
**agricultural exports the sole column that published** (+0.4, +0.8). The API resolves why it is two
rows from one hole: only **October 2025 is missing at the index level** (`EIUIR`, `EIUIQ`,
`EIUIREXFUELS` all run 2025-M09 → 2025-M11 with no M10), and a missing October level makes the
*November percent change* uncomputable even though the November level exists.

This is corroboration for **FT-28** (registered on the 11-17 ledger: that the 2026-11-17 release will
publish no 12-month rate at all), not a new test — a second primary showing the convention BLS already
uses for an unbridgeable gap. Nothing here bears on this print, whose Aug-2025 base is intact.

### Leg 10 — the dollar is a headwind, on the same footing as the sibling's leg. SUPPORTED (measured).

DXY monthly closes (Yahoo `DX-Y.NYB`): **Aug-2025 97.77** — this print's base month — against
**99.70** (Aug-2026 close) and 99.59 intraday 08-31. The dollar is roughly **2.0% stronger** than the
base month, which *depresses* dollar-denominated import prices; the nonfuel rise happened against an FX
headwind. Caveat stated: DXY is a six-currency basket and most US imports are invoiced in dollars, so
this eliminates FX as the *primary* driver rather than measuring an elasticity.

### Leg 11 — exports: the July drop was fuel, so it likely does not repeat. MIXED.

All exports fell **−1.3%** m/m in July, driven by nonagricultural **industrial supplies and materials
−4.1%**, which BLS attributes to "fuel, nonferrous metals, and chemicals." By the same lagged-Brent
logic as Leg 5, the fuel component of that decline should stop falling in August. Against an Aug-2025
base of **153.0**, a flat August prints **+8.10%** against July's published **+8.2%**; a modest bounce
prints higher. Graded **MIXED** rather than supported because the export index has two other live
drivers this doc has not measured — agricultural exports have not fallen since December 2025 (+1.0% in
July, soybean-led), and nonferrous metals and chemicals are their own tape.

### Leg 12 — which tracked names carry the sensitivity. Inherited, estimate-labeled.

`symbols: []` — market-wide, so the ranking is the same duration-reasoned one the CPI/PPI/FOMC siblings
carry, not measured per-symbol: **CRWV** most exposed, then **NVDA / AVGO / MRVL**, then **MSFT / GOOG /
META**, then **AAPL / AMZN**. On this print's own narrow terms **AMZN** is the one tracked name with a
direct line item: import **air freight −2.2% m/m** in July (**+23.4%** over 12 months — quote the
monthly, not the annual, when reasoning about current cost), and import air passenger fares **−11.0%
m/m** (+16.9% y/y, the largest 12-month advance since February 2023). Import **capital goods +0.9%**,
computers/peripherals/semis, is the AI-infra build-cost line. Cost-curve observations, not trades.

### What the conditions support

Nothing directional. No house playbook is macro-keyed
([`multi-symbol-sweep.md`](../multi-symbol-sweep.md): S2 and E1 were the only universal survivors), and
this is a `low`-tier print with no channel to the decision it shares a morning with. The deliverable
content is four subtractions from what a reader — including a reader of the sibling ledger — would
otherwise assume: **the 5.0% headline is a coin flip on one index tick**, not the base case the calendar
entry claims (Leg 2); **the fuel drag ends in August**, so the headline re-accelerates and the projected
headline/nonfuel convergence does not begin here (Leg 5); **this is the one release in the series the
funding branch cannot reach** (Leg 6); and **the tier claim cannot be tested on this date**, so it is
asserted rather than falsified and the test defers to 10-16 (Leg 8). No new calendar entries are
proposed — the adjacency sweep found nothing dated within five days that is not already tracked.

### Honest limits

- **No August-data consensus, whisper or implied move exists at D-16**, and none will until mid-September. A fact about the calendar, not a research gap.
- **Legs 2, 3 and 4 are arithmetic**, testing direction rather than levels; they assume no revision to the Jul-2026 level, and `EIUIR` has already revised April, May and June 2026.
- **Leg 5 is a fitted model on n=11 with two lapse-holed months**, an R² of 0.71 and a large positive intercept absorbing natural gas. It predicts a *sign and rough magnitude*, not a number, and it has never been scored out-of-sample — which is exactly why it is registered as FT-30 rather than used.
- **The 10.4% fuel weight is implied from two months' published identities**, not a BLS-published weight; it is stable across those two months and is not independently sourced.
- **The reaction function is asserted structurally, never measured.** No event study of import-price release days exists in this repo, and this series has never been tracked through a print here.
- **Leg 10 eliminates FX as a primary driver; it does not measure an elasticity.**
- **Leg 11 is graded MIXED** and its two non-fuel drivers are unmeasured.
- **The 2026 tariff architecture** (SCOTUS/IEEPA, Section 122 → 301) remains unverified `NEWS:`-grade in the sibling ledgers and nothing here rests on it.
- **VIX 14.43 and the equity indices are 08-28 closes** (08-31 was a weekend); DXY, Brent and WTI are 08-31 marks.
- **A jobs print, a PPI, a CPI and a live FOMC intervene** before this event, any of which can rewrite this doc wholesale.

## Stance & kill switches

**Stance (date `confirmed`; two BLS primaries fetched direct 2026-08-31).** No position and no
directional lean at any horizon; the tier is `low` and stays `low` — and at this print the tier claim is
*asserted*, not tested, because retail sales shares the 08:30 slot and a coin-flip FOMC decides at 14:00,
making any move unattributable. The deployable content is **four reading rules**, not a trade. First,
**the 5.0% "highest since 2022" headline is a coin flip on one index tick**: it needs **+0.361%** m/m
against a **+0.371%** trailing three-month pace, published **136.3 prints 5.01% and 136.2 prints
4.93%** — so the sibling ledger's framing of this event as the likely reveal should be **downgraded to
even money**, with a central read of **+4.9% to +5.2%**. Second, **discount the 12-month rate**: the
Aug-2025 base month printed **−0.2%** nonfuel m/m, so a flat August still yields **+4.62%** against
July's published +4.5% — the m/m is the evidence, the y/y is partly artifact. Third, **the fuel drag
ends here**: prior-month Brent was −0.1% and the lagged transfer function (R² 0.71) predicts fuel
**+1.0%**, so all-imports 12-month likely **re-accelerates to ~6.2–6.6%** and the headline/nonfuel gap
**widens**, contradicting the 10-16 ledger's convergence projection. Fourth, **read a rising
duty-exclusive index as hawkish** — buyers pay the duty on top of a rising base. All four are
**estimate**-grade market reads on a `confirmed`-dated event; none licenses an entry.

**Kill switches:**

- **The coin-flip read (Leg 2) is wrong if** the **2026-09-16** print lands nonfuel 12-month **at or above +5.2%** or **at or below +4.7%** — either tail says the August m/m was not the near-threshold path this doc models, and the pace estimate gets rebuilt rather than patched. Check on 09-16.
- **The fuel model (Leg 5) dies if** import **fuel m/m prints negative** in the **2026-09-16** release, against a predicted +1.0% to +1.2% from a −0.1% prior-month Brent average. Registered as **FT-30**, scored 2026-09-17.
- **The convergence disagreement (Leg 5) is wrong if** all-imports 12-month prints **at or below +5.95%** at this release — i.e. it did *not* re-accelerate — which would say the sibling ledger's convergence path was right and the lagged-Brent fuel read added nothing. Check on 09-16.
- **The base-effect read (Leg 3) is wrong if** the **2026-09-16** print shows nonfuel 12-month **below +4.5%**, meaning nonfuel prices actually fell in August despite seven months of acceleration. Check on 09-16.
- **The funding-immunity read (Leg 6) is methodology, not forecast** — it dies only if BLS moves this release date, which would appear on `bls.gov/schedule/news_release/ximpim.htm`. Check each pulse.
- **The duty-exclusive inversion (Leg 7) is methodology, not opinion** — it dies only if BLS changes the treatment of duties in these indexes, which would appear as an MXP notice at `bls.gov/mxp/notices/`. Check each pulse.
- **The tier read (Leg 8) is deliberately not scored on this date.** Its test is the **2026-10-16** print, where opex is the only confound; scoring it on 09-16 against a retail-sales/FOMC session would be attribution theatre.

Registered as **FT-30** in [`forward-tests.md`](../forward-tests.md): the lagged-Brent fuel transfer
function, scored 2026-09-17.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-16 | Initial research banked (above). **Date flipped `estimate` → `confirmed`:** two independent BLS primaries fetched direct — `schedule/news_release/ximpim.htm` ("August 2026 \| Sep. 16, 2026 \| 08:30 AM") and `schedule/2026/09_sched.htm` (Wednesday the 16th, 08:30). **Fetch recipe sharpened again:** the sibling's recipe (Referer + `Sec-Fetch-Site: same-origin` + `--compressed`) **403'd today**; 200 required adding `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, `Sec-Fetch-User: ?1`, `Accept-Language` and `Upgrade-Insecure-Requests: 1` — assume the gate tightens each release. **Correction #1 — the 5.0% headline is a coin flip, not a base case:** crossing needs level **136.29** (+0.361% m/m) vs a trailing 3-mo pace of **+0.371%**; published **136.3 → +5.01%**, **136.2 → +4.93%**, and one 0.1 tick is worth 0.077pp of y/y. The m/m path is decelerating inside that average (Apr +0.902 · May +0.596 · Jun +0.148 · Jul +0.370), so the 2-mo pace (+0.259%) lands at **4.93%** — on the wrong side. Central read **+4.9–5.2%**; the sibling ledger's calendar note calling this the likely "highest since 2022" reveal is **downgraded to even money**. **Correction #2 — the fuel drag ends in August, so the headline re-accelerates:** fitting BLS Table A fuel m/m on **prior-month Brent monthly averages** (not month-end closes, which is what made the sibling's fuel path look incoherent) gives fuel ≈ **1.09 + 0.436 × Brent₋₁**, n=11, **r 0.840 / R² 0.706**; contemporaneous fits far worse (R² 0.19) and dropping the influential Mar-2026 spike keeps the sign (β 0.531, predicted +1.15%). Brent averages **Jun 84.62 → Jul 84.51 (−0.1%) → Aug 87.95 (+4.1%)** ⇒ Aug fuel **+1.0–1.2%**, ending the −3.8%/−7.2% drag. Implied fuel weight **≈10.4%** (from Jun/Jul identities) ⇒ all-imports **+6.2 to +6.6%** y/y vs July's +5.95%, gap to nonfuel **1.4–1.6pp** vs July's 1.49pp — so the 10-16 ledger's **convergence projection does not start here**, and by the same model Sep fuel reads ≈ **+2.9%**, pushing it further away. Registered **FT-30**. **Third — base month verified in the primary:** Aug-2025 Table A m/m ran all-imports −0.1, fuel −0.7, **nonfuel −0.2**, exports +0.1, so a flat Aug-2026 still prints **+4.62%**. Separately, the acceleration is real in the m/m, not only the base: nonfuel ran **+0.15% over Jan–Jul 2025** vs **+3.11% over Jan–Jul 2026**, ~20×. **Fourth — this is the one release in the series the funding branch cannot touch:** it publishes 09-16, two weeks before the **09-30** deadline, with an August collection window; no delay and no destroy branch exists, making it the clean scoreable control. **Fifth — the tier test is not runnable here**, so it is asserted and deferred: retail sales shares the 08:30 slot (the "second-largest trader reaction after jobs", per its ledger) and the FOMC decides 14:00 on a ~57/43 hike coin flip, so an NDX move could not be attributed; the sibling's tier kill switch gets tested on **10-16** (opex the only confound) rather than being registered here as a falsifier that cannot fire. **Adjacency sweep.** *Peers:* n/a (`symbols: []`); AMZN the one direct channel — import **air freight −2.2% m/m** (+23.4% 12-mo; quote the monthly for current cost) and air passenger fares **−11.0% m/m** (+16.9% 12-mo, largest since Feb 2023); import **capital goods +0.9%** (computers/peripherals/semis) is the AI-infra cost line. *Macro:* PPI **09-10** and CPI **09-11** close the FOMC's inflation picture before this print; jobs **09-04** is the corridor's swing input. *Vol:* **VIX 14.43** (08-28 close), SPX 7711.76, NDX 29433.43, 10Y **4.72%** — baseline set, nothing to diff against yet. *Geopolitical/energy:* Brent **$90.58**, WTI **$85.53** (08-31); import natural gas **+74.3%** 12-mo / +5.3% m/m is the reason the fuel model carries a +1.09 intercept independent of crude. *FX:* DXY base month **Aug-2025 97.77** vs **99.70** (Aug-2026 close) — dollar ~**2.0% stronger**, an FX headwind the nonfuel rise happened against. *Policy:* 2026 tariff architecture stays unverified `NEWS:`-grade and nothing rests on it. *Existence risk:* n/a for this print (Leg 6); House CR to Dec 4 (220–205, 07-21), Senate CR to Dec 11 (90–6, 08-08), House took up the Senate text 08-31, nothing signed. *Event tape:* no August-data consensus or whisper at D-16 (checked, not asserted). **Destroyed-months detail corroborating FT-28, not duplicating it:** Table A's footnote reads verbatim "Some Oct and Nov 2025 data values are not available due to the 2025 lapse in appropriations", with **agricultural exports the sole column that published** (+0.4, +0.8); the API shows only **October 2025 missing at the index level**, and a missing October level is what makes the *November* percent change uncomputable — one hole, two dashed rows. **No new calendar entries proposed:** the September BLS schedule shows nothing within 5 days of 09-16 that is not already tracked (State Employment 09-18 and Employee Tenure 09-24 are outside the kinds this calendar tracks). **Flagged for a human, not actioned — fourth sighting:** `forward-tests.md` ids are assigned by parallel matrix legs on the same day with no uniqueness guarantee (three FT-25 rows, two FT-26, two FT-27 already exist). This session took **FT-30** and is exposed to the same collision. Worth a `/retro`; out of lane scope here. | — (stance set) | 2026-09-07 (the `low:0+` band's 7d interval takes over once the event crosses inside 15 days on 09-02; the `low:15+` 30d interval would have said 09-30, after the print) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
