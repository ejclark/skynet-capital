# Japan 40-Year JGB auction (¥300bn anticipated, second reopening of issue 19) — jgb-40y-auction-2026-09-29

**Kind:** rates · **Date:** 2026-09-29 (estimate, EST: mof.go.jp September calendar `2609e.htm` re-fetched direct 2026-09-08; the size is **not yet announced** — that row carries no announcement link, and MOF announces "about one week prior") · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.31,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","apple-eu-dma-terms-2026-10-01","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","census-benchmark-revision-nsa-2026-09-28","chicago-pmi-2026-09-30","construction-spending-2026-10-01","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","fhfa-hpi-2026-09-29","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","government-funding-deadline-2026-09-30","ism-manufacturing-2026-10-01","jobs-2026-10-02","jolts-2026-09-29","m3-full-report-2026-10-02","new-home-sales-2026-09-24","opec-jmmc-68th-2026-10-04","opec-plus-meeting-2026-10-04","pce-2026-09-30","retail-benchmark-revision-2026-09-28","russell-style-quarter-end-capping-effective-2026-09-30","scoos-2026-09-24","sp-select-sector-secondary-reweight-2026-09-30","treasury-7y-note-2026-09-24","treasury-buyback-10y20y-2026-10-01","treasury-buyback-20y30y-2026-09-24","treasury-coupon-announcement-2026-10-01","trump-xi-summit-2026-09-24","umich-sentiment-final-2026-09-25","unsc-iran-panel-mandate-expiry-2026-09-26"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** Japan sells its 40-year bond on **2026-09-29** — an anticipated ¥300bn reopening of the 3.8%
2066, though MOF has **not announced the size yet** and will not until roughly 09-18–09-22. **Nothing
here is ours to trade**, and this document exists to fix a reading error rather than to find an edge.
The sibling ledger for the [09-15 20-year](jgb-20y-auction-2026-09-15.md) judges an auction by its
**tail**. **The 40-year has no tail** — it is a **single-price (Dutch) auction**, the only conventional
JGB coupon tenor that is, verified on eight MOF result pages that print `-` in both average-price
columns where the 20-year prints real numbers. So the sibling's framework and its kill switch may not
be carried over here, and the replacement metric is measured instead: clearing yield minus the
same-session par 40-year, **mean −0.25bp, sd 1.78bp** across **95** auctions since 2007-11-06, with
only **4 of 95** above +3bp. Two more findings, both from primaries. **(1) The 30s40s spread has
collapsed to +0.4bp** (09-07) — the **1.7th percentile** of 4,606 sessions — so ten extra years of
duration currently pay almost nothing; but it was *negative* at each of the last two 40-year auctions
and both covered **2.70x** and **2.82x**, the best since March 2025. **(2) "September is weak because
Japanese books close" is an artifact** — raw September cover runs 2.757 vs 3.028 (t = −2.43), but
against each auction's own neighbours the deficit is **−0.021 (t = −0.19)**. Date and size both
**estimate**; they widen caution and license nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/8, D-21) | **Stand aside** — nothing on this calendar is exposed to it | High | `symbols: []`, no house playbook is rates- or FX-keyed, and the auction's own size is not even announced yet (MOF's 09-29 calendar row carries no announcement link as of 2026-09-08) | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-08 → 2026-09-29** that the tape attributes to a JGB or yen headline — the "no price channel" premise would be wrong |
| This week | **Watch nothing here; the live Japan risk is the BoJ on 09-18, not this auction** | High | This is the first super-long JGB auction to price a post-decision policy rate (D+11 from `boj-decision-2026-09-18`), so every pre-decision reading is provisional; USD/JPY has already moved **160.20 (09-01) → 154.24 (09-08)**, −3.7% in five sessions, on that repricing | MOF publishing 40-year terms **before 2026-09-15** — an off-cadence announcement would mean the "about one week prior" note no longer describes MOF's behaviour and every size assumption here needs re-reading |
| This month | **Judge the 09-29 result by cover and the clearing-vs-screen gap — never by a "tail", which does not exist for this tenor** | High | Measured on MOF primaries: all 8 result pages 2025-05-28 → 2026-07-22 print `-` for both weighted-average price and average yield; the replacement metric across n=95 is mean **−0.25bp**, sd **1.78bp**, p95 **+2.83bp** | A **2026-09-29** 40-year result page that prints an actual weighted-average price and average yield — MOF would have changed the auction format, and this ledger's central correction would be obsolete (**FT-jgb-40y-auction-2026-09-29-1**) |
| This quarter | **Track the 30s40s spread, not the auction outcomes — it is the number with real information in it** | Medium | 30s40s: **+31.1bp** (2025-05 auction) · +31.7 · +23.9 · +25.8 · +11.2 · +8.9 · **−6.0** · **−5.9** (2026-07 auction) → **+0.4bp** on 09-07, the **1.7th percentile** of 4,606 sessions since 2007-11-06 | 30s40s standing **at or above +10bp** on **2026-12-31** (MOF par curve) — the super-long curve would have re-steepened and the "duration pays nothing" condition this ledger reads the auction against would be gone (**FT-jgb-40y-auction-2026-09-29-3**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to this auction or to the 2026-09-29 session.
- **The correction this entry exists for** — the **40-year is single-price (Dutch)**. There is no tail,
  no average yield, and no "tail ≥ 2bp = soft" test. Do not import the 09-15 sibling's framework.
- **Weak print, defined honestly for a tenor with no tail** — cover below **2.5x**, *or* a clearing
  yield more than **+3bp** above MOF's same-session par 40-year (only 4 of 95 auctions since 2007
  cleared that cheap).
- **Strong print** — cover at or above **2.8x** with the clearing yield within **1bp** of the screen,
  i.e. a repeat of 2026-07-22 (2.824x, +2.3bp).
- **Recent 40-year cover** — 2.214 (2025-05) · 2.127 · 2.604 · 2.585 · 2.760 · 2.541 · 2.702 ·
  **2.824** (2026-07-22). Rising *as* MOF cut the size ¥500bn → ¥400bn → **¥300bn**.
- **Do not read a strong cover as demand recovery.** MOF cut this auction **40% in twelve months**; a
  2.8x cover on ¥300bn absorbs the same yen as a 1.7x cover on the old ¥500bn.
- **The size is not announced.** MOF's 09-29 row had **no announcement link** on 2026-09-08 while the
  09-15 20-year row already linked its own. Expect terms ~**09-18 to 09-22**.
- **The BoJ is D−11, and it comes first** — `boj-decision-2026-09-18` (~80–84% priced for 1.0% → 1.25%,
  per the [sibling ledger](boj-decision-2026-09-18.md), which owns that channel). This is the first
  super-long auction to price the outcome.
- **The level that says the all-time high is being retested** — the 40-year closing back above
  **4.145%** (MOF par, 2026-09-01, the highest in a series that begins 2007-11-06); it closed
  **4.013%** on 09-07.
- **Watch (dated)** — 20Y JGB **Sep 15** (est) · **FOMC Sep 16** · **BoJ Sep 18** (est) · MOF 40Y terms
  **~Sep 18–22** (est) · **this auction Sep 29** (est) · Japanese fiscal H1 closes **Sep 30** ·
  BoJ Tankan **Oct 1** (est) · 30Y JGB **Oct 8** (est, proposed in this PR) · MOF Liquidity Enhancement
  11–39y **Oct 27**.

## Initial research

### The question, plainly

This entry was proposed on 2026-09-08 by the
[`jgb-20y-auction-2026-09-15`](jgb-20y-auction-2026-09-15.md) adjacency sweep, as "the next read on
the same super-long demand question, at the tenor where MOF's issuance cuts are deepest." That framing
invites one obvious move: re-run the 20-year's playbook nine tenors up. So the question here is
first a methodological one, and only then a market one:

**does the 09-15 ledger's framework actually transfer to the 40-year — and if this auction is
genuinely unowned by anything we trade, what is the entry for?**

**One-line verdict:** the framework **does not transfer**, because the 40-year is a **single-price
auction with no tail at all**; the entry's job is to hold the replacement metric, the collapsed
30s40s spread, and a seasonality story that turns out to be a statistical artifact — and the
spillover null is if anything *stronger* here than at the 20-year, because its **sign does not even
hold across samples**.

### Method

Sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode — no price
instruments, `symbols: []`. Every number below is computed this session from a primary fetched direct
on **2026-09-08** unless labelled otherwise:

- **MOF auction calendars** `calendar/2609e.htm` (HTTP 200, 25,556 bytes) and `calendar/2610e.htm`
  (HTTP 200, 24,853 bytes) — the September and October slates, and the absence of an October 40-year.
- **MOF individual auction result pages**, nine of them, parsed cell by cell:
  `eresul/eresul2025{0528,0723,0925,1126}.htm`, `eresul2026{0128,0324,0527,0722}.htm` (the eight most
  recent 40-year auctions) and `eresul20260820.htm` (the 20-year, as the format control).
- **MOF Auction Results for JGBs workbook**
  (`past_auction_results/Auction_Results_for_JGBs.xls`, 492,032 bytes, last saved 2026-08-13) — all
  **95** 40-year auctions from 2007-11-06 to 2026-07-22, plus the 30-year sheet and the column
  structure of all 14 tenor sheets.
- **MOF JGB par yield curve** — `jgbs/reference/interest_rate/data/jgbcm_all.csv` (4,606 sessions with
  a 40-year reading, 2007-11-06 → 2026-08-31) and the current-month `jgbcm.csv` (2026-09-01 → 09-07).
  As the 09-15 sibling recorded, the `english/` path 404s; the Japanese path serves the same
  CP932-encoded file and is what was used.
- **US Treasury daily par yield curve** `home.treasury.gov/.../daily-treasury-rates.csv`, every year
  2007–2026 (HTTP 200 each) — the US side of the spillover and hedge tests, through 2026-09-04.
- **Yahoo Finance** for USD/JPY (`JPY=X`) and VIX, cache busted. Labelled secondary wherever cited.

No fetch of a cited source failed; `probe-ref.blocked` is empty.

### Conviction legs, tested

**1. The 40-year is a single-price (Dutch) auction and has no tail — SUPPORTED, and it invalidates
the framework this entry was proposed under.** This is the load-bearing finding, so it was verified
three ways rather than asserted once.

MOF's own result pages for the 40-year publish the same fourteen columns every tenor does, and print
`-` in three of them. Verbatim from the 2026-07-22 page:

| Field | 40-year, 2026-07-22 | 20-year, 2026-08-20 (control) |
|---|---|---|
| Price at the Highest Accepted Yield | 98.68 | 99.85 |
| Highest Accepted Yield | **3.865%** | **3.713%** |
| Allotment at the Highest Accepted Yield | 28.8888% | 83.5648% |
| Weighted Average Price | **`-`** | **100.02** |
| Yield at the Average Price | **`-`** | **3.698%** |

All eight 40-year result pages from 2025-05-28 to 2026-07-22 print `-` in both average columns. And
in MOF's results workbook, **of the 14 tenor sheets, only 40年債 and the two GX green-bond sheets lack
an average-price column at all** — every conventional tenor from 2-year to 30-year has one. The
30-year, the nearest neighbour, reports a real tail (2026-07-07: 3.993% average vs 3.996% lowest
accepted, 0.3bp).

So the 09-15 sibling's central instrument — *"soft = tail ≥ 2.0bp"*, and the kill switch built on it
— **cannot be computed here at all**. An assessment that reported a 40-year "tail" would be reporting
a number that does not exist. That is the correction this document was worth writing for.

**2. The replacement metric, measured rather than invented — SUPPORTED.** With no tail, the honest
question is how cheap the auction had to clear relative to where the bond was trading. Computed as
the **clearing (highest accepted) yield minus MOF's own par 40-year for the same session**, across
all 95 auctions 2007-11-06 → 2026-07-22:

| Statistic | Value |
|---|---|
| mean | **−0.25bp** |
| median | −0.20bp |
| standard deviation | **1.78bp** |
| p10 / p90 | −2.50bp / +1.90bp |
| p95 / max | **+2.83bp** / **+4.40bp** (2026-05-27) |
| auctions above +3bp | **4 of 95** |

Measured against the *prior* session's close instead — which folds in the overnight move and is
therefore noisier — the same series reads mean −0.27bp, sd 3.20bp (n=94; the first auction is
dropped because MOF's 40-year par series begins that same day and has no prior reading). The
same-session version is the one this ledger will use. Cover ratio and the marginal-allotment
percentage are the two other survivable readings; recent allotment at the highest accepted yield runs
33.33% · 29.63% · 12.44% · 16.50% · 65.21% · 90.65% · 15.45% · **28.89%**, where a *higher* number
means the auction had to fill nearly everything bid at the margin. Registered as
`FT-jgb-40y-auction-2026-09-29-1`.

**3. There is no measurable 40-year-JGB-auction → US-30Y spillover, and the sign is not even stable —
REFUTED more decisively than at the 20-year.** Same method as the sibling, one tenor up: each of the
94 auctions with a matching US session, "soft" defined by leg 2's metric (clearing gap > +0.5bp),
matched to the **same-date** change in the US 30-year CMT.

| Sample | Soft | Firm | Difference | t |
|---|---|---|---|---|
| Full, 2007-11-06 → 2026-07-22 | **−1.10bp** (n=31) | +0.56bp (n=63) | **−1.65bp** | **−1.45** |
| Since 2023-01 | **+1.43bp** (n=7) | +0.07bp (n=15) | +1.36bp | +1.08 |

Correlation of the clearing gap against the same-date US 30-year move is **−0.083** (n=94, t = −0.80).
Splitting by cover instead gives low-cover +0.85bp vs high-cover −0.83bp, difference +1.68bp,
t = +1.55. The US 30-year's own daily standard deviation on those dates is **3.14bp** in the modern
subsample and 5.37bp across the full sample.

The 09-15 sibling could at least say *"the sign is consistent, the magnitude is noise."* **Here even
that is unavailable**: the full sample points one way at t = −1.45 and the modern subsample points the
other at t = +1.08, and the two cover-based and gap-based splits disagree with each other on the same
data. Three measures, three signs, none significant. **Verdict: no spillover, and no directional prior
either.** Registered as `FT-jgb-40y-auction-2026-09-29-2`.

**4. The 30s40s spread has collapsed to its 1.7th percentile — SUPPORTED, and it is the number worth
carrying forward.** Ten extra years of duration currently pays essentially nothing:

| Date | JGB 20Y | JGB 30Y | JGB 40Y | 20s40s | **30s40s** |
|---|---|---|---|---|---|
| 2026-09-01 | 3.859 | 4.131 | **4.145** | +28.6bp | **+1.4bp** |
| 2026-09-02 | 3.864 | 4.122 | 4.134 | +27.0bp | +1.2bp |
| 2026-09-03 | 3.806 | 4.052 | 4.063 | +25.7bp | +1.1bp |
| 2026-09-04 | 3.717 | 3.965 | 3.966 | +24.9bp | **+0.1bp** |
| 2026-09-07 | 3.751 | 4.009 | **4.013** | +26.2bp | **+0.4bp** |

Across the full 4,606-session series (2007-11-06 → 2026-09-07) 30s40s has a median of **+11.2bp** and
a 5th percentile of **+1.6bp**. **+0.4bp sits at the 1.7th percentile**; only 189 of 4,606 sessions
have ever been at or below +1.5bp. It ran *negative* through June and July 2026 (monthly means −6.03bp
and −5.29bp, an all-time low of **−11.1bp on 2026-07-02**) and has since crept back to roughly flat.

Two readings of that, and the tape favours the second. The bearish one: a buyer of the 09-29 auction
is asked to take a 2066 maturity for no pickup over a 2056, which is the setup for a poor clearing.
The evidentiary one: **the last two 40-year auctions both cleared with 30s40s *negative*** — −6.0bp on
2026-05-27 and −5.9bp on 2026-07-22 — and covered **2.702x** and **2.824x**, the two best covers since
March 2025. A flat-to-inverted super-long curve has already failed twice to break this auction at
¥300bn. On that evidence 09-29 sets up marginally *better* than its two predecessors, not worse — the
curve is +0.4bp rather than −6bp — and the honest inference is that the **cut size is doing the work**,
not the curve shape. Registered as `FT-jgb-40y-auction-2026-09-29-3`.

**5. "September is weak because Japanese institutions close their H1 books" is a statistical artifact —
REFUTED, and worth recording precisely because it is the plausible story.** The auction lands one day
before the Japanese fiscal half-year ends on 2026-09-30, which makes a demand-seasonality hypothesis
natural. The raw data appears to support it: across all 95 auctions, September 40-year auctions cover
**2.757x** (n=10) against **3.028x** for every other month (n=85) — a −0.271 deficit at **t = −2.43**.

That evaporates under the right control. September auctions cluster in periods when the *level* of
cover happened to be lower, so the raw comparison is measuring regime, not seasonality. Comparing each
auction instead to the mean of its own two immediately neighbouring auctions:

| Month | n | cover − neighbours | t |
|---|---|---|---|
| September | 10 | **−0.021** | **−0.19** |
| March (fiscal year-end) | 10 | −0.077 | −0.74 |
| March + September combined | 20 | −0.049 | −0.66 |
| July | 11 | −0.107 | −1.13 |
| January | 11 | +0.172 | +1.93 |

The September effect is **−0.021 at t = −0.19** — nothing. And the honest note on the raw result: it
came from testing **11 calendar months**, so a |t| > 2 somewhere in that family is roughly what chance
produces. **No fiscal-period-end seasonality is claimed by this ledger**, in either direction.

**6. The FX-hedge gap is *wider* at the 40-year than at the 20-year, and closing on the same
mechanism — SUPPORTED.** The 09-15 sibling measured the domestic-minus-hedged advantage at the
20-year; the same computation at this tenor (JGB 40-year against a hedged US 30-year, hedging
approximated by the short-rate differential, cross-currency basis excluded — see limits):

| Date | US 3M | US 30Y | JP 1Y | JGB 40Y | Hedged US 30Y | **Domestic advantage** |
|---|---|---|---|---|---|---|
| 2023-09-05 | 5.55 | 4.38 | −0.076 | 1.738 | −1.25 | **+298bp** |
| 2024-09-05 | 5.15 | 4.02 | 0.250 | 2.301 | −0.88 | **+318bp** |
| 2025-09-05 | 4.07 | 4.78 | 0.686 | 3.388 | 1.40 | **+199bp** |
| 2026-03-05 | 3.70 | 4.74 | 1.006 | 3.462 | 2.05 | **+142bp** |
| 2026-06-05 | 3.78 | 5.01 | 1.140 | 3.753 | 2.37 | **+138bp** |
| **2026-09-04** | **3.91** | **5.24** | **1.546** | **3.966** | **2.88** | **+109bp** |

At the 20-year the sibling measured +242bp falling to +83bp on the same basis. **The super-long is
where a yen investor's home-market advantage is largest** — +109bp against +83bp today — which is a
mechanical reason lifers concentrate at this end of the curve, and a reason the 40-year keeps clearing
despite paying nothing over the 30-year. It has fallen by roughly two-thirds from its 2024 peak, and
the mechanism closing it is the same one: a higher *Japanese short rate* shrinks the yen leg of the
hedge, so a BoJ hike on 09-18 takes another ~25bp off it. The BoJ meeting, not this auction, is what
moves cross-border allocation.

**7. The size is anticipated, not announced — SUPPORTED, and it is a live process fact.** MOF's
September calendar page carries an "Auction Announcement → Detail" cell per row. On 2026-09-08 the
09-15 20-year row links a live announcement (`announcement/auct20260908e.htm`); **the 09-29 40-year
row carries no link at all.** MOF's own note on that page reads *"Each issue amount will be announced
about one week prior to each auction date"*, putting terms around **09-18 to 09-22** — after the BoJ
meeting. The ¥300bn in the title is therefore an inference from the workbook (issue 19 sold at ¥300bn
on 2026-05-27 and reopened at ¥300bn on 2026-07-22), not a sourced number, and that is half of why
this entry is `estimate`.

**8. Supply is managed, and the 40-year is where the cuts are deepest — SUPPORTED, independently
reproduced.** The 09-15 sibling made this argument; it reproduces cleanly at this tenor from the
workbook, and it now covers the 30-year too:

| Tenor | Old size | Cuts | Current | Total |
|---|---|---|---|---|
| 40-year | ¥500bn (2025-05-28) | ¥400bn (2025-07-23) | **¥300bn** (from 2026-05-27) | **−40%** |
| 30-year | ¥700bn (through 2026-03) | — | **¥600bn** (from 2026-04-07) | **−14%** |
| 20-year | ¥1,000bn (through 2025-06) | ¥800bn (2025-07-10) | **¥700bn** (from 2026-04-14) | **−30%** |

40-year cover across those cuts, in order: 2.214 · 2.127 · 2.604 · 2.585 · 2.760 · 2.541 · 2.702 ·
**2.824** — it *rose* as size fell. **A 2.824x cover on ¥300bn absorbs ¥847bn of bids; the same yen
would have been a 1.69x cover on the old ¥500bn.** That is the sentence to apply on the day.

**9. October carries no 40-year, and the calendar's next super-long read is a 30-year — SUPPORTED.**
MOF's October slate (fetched direct) lists a 30-year on 10-08, a 20-year on 10-20, a Liquidity
Enhancement Auction for remaining maturities of **11–39 years** on 10-27, and **no 40-year** —
confirming the bi-monthly cadence independently of the workbook. So 09-29 is the last 40-year coupon
supply of the quarter and the next is November. `jgb-30y-auction-2026-10-08` is **proposed in this PR**
because the 30-year is the other leg of leg 4's spread and this calendar tracked neither side of it.

**10. Volatility and FX context — SUPPORTED (Yahoo, secondary).** VIX **15.31** on 2026-09-08
(intraday), against 15.30 on 09-07 and a 14.32–16.34 range over the prior ten sessions — no regime
change. USD/JPY **160.196 (09-01) → 158.923 → 155.660 → 156.197 → 154.235 (09-08 intraday)**,
**−3.7%** in five sessions. As at the 20-year, the BoJ repricing is being expressed in the yen rather
than in the bond; a stronger yen cuts imported inflation, which is a *reason* the long end could rally
into supply rather than sell off.

### What plays the conditions support

**None**, and one tenor further out than the 09-15 sibling the refusal is firmer rather than softer.
No tracked symbol has yen-rates exposure; no house playbook is rates-keyed; the one channel that could
have justified an entry was tested and returned a null whose sign flips between samples. The entry's
value is entirely diagnostic and largely **corrective**: it stops the next session computing a "tail"
for a tenor that does not have one, it hands that session a measured replacement metric with a real
distribution behind it, and it kills a seasonality story that would otherwise have looked convincing
at t = −2.43.

### Honest limits

- **The 30s40s reading has a small, one-sided evidence base.** Exactly two 40-year auctions have
  cleared with the spread negative, both at ¥300bn, both in 2026. "A flat super-long curve does not
  break this auction" rests on n=2 and should not survive a third contrary observation.
- **The spillover test is n=94, confounded, and underpowered.** Most 40-year auction dates carry US
  prints of their own. A null at t < 1.6 is "no evidence of an effect," not "evidence of no effect";
  this test would not detect an effect below roughly 3bp at conventional power. The modern subsample
  is n=22.
- **The seasonality control is a neighbour comparison, not a model.** It removes slow regime drift
  and nothing else; a genuine September effect that alternated with its neighbours would be invisible
  to it. The conclusion is "the raw −0.271 is not evidence," not "a seasonal effect is impossible."
- **The hedge-cost calculation is an approximation** — short-rate differential, **cross-currency basis
  excluded**, which has historically been negative for JPY and would make hedging *more* expensive, so
  the true domestic advantage is probably wider than +109bp and the convergence read is conservative.
  It also compares a 40-year to a 30-year because no US 40-year exists, and ignores credit, liquidity
  and capital treatment.
- **The BoJ's own super-long purchase schedule was not sourced.** Net super-long supply is MOF
  issuance *minus* BoJ purchases, and the BoJ's JGB purchase plan is the other half of that
  arithmetic. No BoJ primary carrying the current super-long purchase amount was located this session
  (the pages fetched returned HTTP 200 but did not carry it, so nothing is recorded in
  `probe-ref.blocked`). **This ledger makes no claim about BoJ purchases**; the next pulse should find
  that page.
- **The auction result does not exist**, and neither does its size. Everything here is prior, drawn
  from 95 predecessors and a workbook that stops at 2026-08-13.
- **The precise result-publication clock is derived, not sourced** — MOF publishes each result on a
  same-dated page inside the Tokyo session (09:00–15:00 JST = 20:00 ET 09-28 → 02:00 ET 09-29); the
  exact minute was not found on a MOF primary.
- **USD/JPY and VIX are Yahoo, i.e. secondary**, and the 09-08 readings are intraday, not settles.
  The US par curve runs through 2026-09-04.
- **The date and the size are both `estimate`.** MOF is a primary and the date is not in doubt; the
  label reflects an unannounced size plus a gap in `market-events-data.ts`'s prefix taxonomy, which
  has no slot for a non-US sovereign debt office. Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-08, D-21; date and size both `estimate`).** **Stand aside, permanently.** No entry,
exit or hedge is keyed to the 2026-09-29 auction or to the 09-29 session. The entry is kept for three
diagnostic jobs, in descending order of value:

1. **It corrects a reading rule.** The 40-year is a **single-price (Dutch) auction with no tail**. Any
   future assessment that reports a 40-year "tail" is reporting a fabricated number. Judge this tenor
   by **cover** and by the **clearing-vs-same-session-screen gap** (n=95: mean −0.25bp, sd 1.78bp).
2. **It carries the 30s40s spread**, at **+0.4bp** and the 1.7th percentile of its history — the one
   number here with real information, and the one this ledger will keep scoring.
3. **It banks a killed hypothesis.** September super-long weakness is regime clustering, not the
   Japanese H1 book-close, and the raw t = −2.43 that suggested otherwise came out of an 11-way family.

Three reading rules attach to the day itself:

- **A strong cover is not demand recovery.** MOF cut this auction **40%** in twelve months. Judge the
  result against the ¥300bn it is, then restate it against the old ¥500bn before comparing to 2025.
- **A flat 30s40s is not automatically a failed auction.** Both 2026 auctions cleared with the spread
  *negative* and covered better than anything since March 2025.
- **Credit the BoJ, not the auction.** The decision is D−11 and its channel is owned by
  [`boj-decision-2026-09-18`](boj-decision-2026-09-18.md). This is the first super-long auction to
  price the outcome, which makes every pre-09-18 reading here provisional.

**Kill switches.**

1. **The no-price-channel premise breaks** — a tracked name (NVDA/AVGO/MRVL/CRWV) moves **>2%** on a
   session between **2026-09-08** and **2026-09-29** that the tape attributes to a JGB or yen
   headline. This document is rebuilt, not patched.
2. **The auction-format finding breaks** — the **2026-09-29** result page prints an actual weighted
   average price and yield at the average price. MOF would have changed the 40-year to a multiple-price
   auction and this ledger's central correction would be obsolete
   (`FT-jgb-40y-auction-2026-09-29-1`).
3. **The supply-managed reading breaks** — the 09-29 reopening covers **below 2.5x**, *or* clears more
   than **+3bp** above MOF's same-session par 40-year (the top 4% of 95 auctions). Either would mean
   the cuts are no longer buying a clean clearing price
   (`FT-jgb-40y-auction-2026-09-29-2`).
4. **The flat-curve tolerance breaks** — 09-29 covers below 2.5x *while* 30s40s is under +5bp, which
   would be the third observation of a flat super-long curve at this auction and the first bad one,
   overturning the n=2 evidence in leg 4.
5. **The super-long curve re-steepens** — 30s40s stands **at or above +10bp** on **2026-12-31** on
   MOF's par curve (`FT-jgb-40y-auction-2026-09-29-3`).
6. **MOF changes the terms or the cadence** — an announced size other than **¥300bn**, a date other
   than **09-29**, or terms published **before 2026-09-15** (off the "about one week prior" note).
   MOF's calendar allows changes "in light of changes in circumstances."

Three predictions carry score-by dates and are registered in
[`forward-tests/jgb-40y-auction-2026-09-29.md`](../forward-tests/jgb-40y-auction-2026-09-29.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-21 | Initial research banked (above). **The proposal's premise is corrected: the 40-year has NO TAIL.** It is a **single-price (Dutch) auction** — all eight MOF result pages 2025-05-28 → 2026-07-22 print `-` for Weighted Average Price and Yield at the Average Price, where the 2026-08-20 20-year prints 100.02 / **3.698%** against a 99.85 / **3.713%** low (1.5bp tail); of the 14 tenor sheets in MOF's workbook only 40年債 and the two GX sheets lack an average-price column. The 09-15 sibling's "tail ≥ 2bp = soft" test **cannot be computed here** (`FT-1`). **Replacement metric, measured over all 95 auctions since 2007-11-06:** clearing yield minus same-session MOF par 40Y — mean **−0.25bp**, sd **1.78bp**, p95 **+2.83bp**, max +4.40bp, only **4 of 95** above +3bp (`FT-2`). **Spillover is a null with an unstable sign** — 94 auctions matched to the same-date US 30Y CMT: soft (gap > +0.5bp, n=31) **−1.10bp** vs firm (n=63) **+0.56bp**, t = **−1.45**; but 2023+ (n=22) gives **+1.43** vs **+0.07**, t = **+1.08**; corr(gap, US move) **−0.083**; by cover +0.85 vs −0.83, t = +1.55. Three measures, three signs, none significant — weaker than the 20-year's "sign consistent, magnitude noise." **30s40s has collapsed** to **+0.4bp** (09-07), the **1.7th percentile** of 4,606 sessions (median +11.2bp), after an all-time low of **−11.1bp** on 2026-07-02 — but the last two 40Y auctions BOTH cleared with it negative (−6.0, −5.9bp) and covered **2.702x** / **2.824x**, the best since 2025-03, so the cut size looks like what is doing the work (`FT-3`). **A seasonality story is killed:** raw September cover 2.757 (n=10) vs 3.028 other months (n=85), t = **−2.43**, collapses to **−0.021, t = −0.19** against each auction's own neighbours — regime clustering, not the Japanese H1 close, and the raw result came from an 11-month family. **Hedge gap is WIDER at this tenor:** JGB 40Y minus hedged US 30Y **+298bp** (2023-09) → +318 → +199 → +142 → +138 → **+109bp** (2026-09-04), against +83bp at the 20-year — the super-long is where a yen investor's home advantage is largest, and BoJ hikes are what close it. **Rates (MOF par, primary):** 40Y **4.145% on 09-01** is the all-time high of a series beginning 2007-11-06; **4.013%** on 09-07. **Process:** MOF's 09-29 calendar row carries **NO announcement link** on 09-08 while the 09-15 20Y row does — the **¥300bn size is anticipated, not announced**, with terms due ~09-18–09-22, after the BoJ. **Supply:** 40Y ¥500bn → ¥400bn → **¥300bn** (−40%), 30Y ¥700bn → **¥600bn** (2026-04-07), 20Y −30%; 2.824x on ¥300bn = 1.69x on the old ¥500bn. **Volatility / FX (Yahoo, secondary):** VIX **15.31** (09-08 intraday; ten-session range 14.32–16.34, no regime change); USD/JPY **160.196 (09-01) → 154.235 (09-08)**, −3.7%. **Peers:** n/a, `symbols: []`. **Adjacency:** 35 tracked ids inside the ±5d corridor, headed by `boj-summary-of-opinions-2026-10-01`, `boj-tankan-2026-10-01`, `pce-2026-09-30`, `government-funding-deadline-2026-09-30` and `jobs-2026-10-02`; the auction is **D+11 from `boj-decision-2026-09-18`**, the first super-long auction to price a post-decision rate, and lands one day before the Japanese fiscal H1 closes 09-30. **One new dated event PROPOSED (`estimate`):** `jgb-30y-auction-2026-10-08`, read off MOF's own October calendar (which carries **no 40-year**, confirming the bi-monthly cadence) — the other leg of the collapsed 30s40s spread, which this calendar tracked on neither side. **Unsourced and flagged:** no BoJ primary carrying the current super-long JGB purchase amount was located, so net supply is not computed and nothing is claimed about it; the fetches returned HTTP 200, so `probe-ref.blocked` stays empty. | Initial stance set — **stand aside permanently**; the entry is a corrective and diagnostic instrument, not a signal | 2026-09-15 (low band; interval tightens to 7d once inside 15 days) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-jgb-40y-auction-2026-09-29.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
