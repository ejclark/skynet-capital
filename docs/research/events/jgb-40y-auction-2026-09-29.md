# Japan 40-Year JGB auction (¥300bn anticipated, second reopening of issue 19) — jgb-40y-auction-2026-09-29

**Kind:** rates · **Date:** 2026-09-29 (estimate, EST: mof.go.jp September calendar `2609e.htm` re-fetched direct 2026-09-08; the size is **not yet announced** — that row carries no announcement link, and MOF announces "about one week prior") · **Impact:** low
**Last assessed:** 2026-09-15
<!-- probe-ref: {"symbols":{},"vix":17.52,"daysBand":"low:0+","adjacentIds":["adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","apple-eu-dma-terms-2026-10-01","bea-international-transactions-q2-2026-09-24","bloomberg-agg-index-rebalance-2026-09-30","boe-dmp-2026-10-02","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","case-shiller-hpi-2026-09-29","census-benchmark-revision-nsa-2026-09-28","chicago-pmi-2026-09-30","construction-spending-2026-10-01","consumer-confidence-2026-09-29","costco-q4-fy2026-2026-09-24","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","dallas-fed-trimmed-mean-2026-09-30","dmo-pilot-switch-auction-test-2026-09-24","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","eia-weekly-petroleum-status-2026-09-30","eurostat-hicp-flash-2026-10-01","fhfa-hpi-2026-09-29","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","google-adtech-final-judgment-2026-10-02","government-funding-deadline-2026-09-30","intl-transactions-q2-2026-09-24","ism-manufacturing-2026-10-01","jgb-2y-auction-2026-09-30","jgb-liquidity-enhancement-5-11y-2026-09-25","jobs-2026-10-02","jolts-2026-09-29","m3-full-report-2026-10-02","new-home-sales-2026-09-24","opec-jmmc-68th-2026-10-04","opec-plus-meeting-2026-10-04","openai-devday-2026-09-29","pce-2026-09-30","pjm-reliability-backstop-procurement-2026-09-30","retail-benchmark-revision-2026-09-28","russell-style-quarter-end-capping-effective-2026-09-30","scoos-2026-09-24","sp-global-manufacturing-pmi-2026-10-01","sp-global-pmi-commodity-price-supply-2026-10-01","sp-select-sector-secondary-reweight-2026-09-30","steel-imports-preliminary-2026-09-24","tic-quarterly-external-debt-2026-09-30","treasury-7y-note-2026-09-24","treasury-buyback-10y20y-2026-10-01","treasury-buyback-20y30y-2026-09-24","treasury-buyback-tips-1y10y-2026-09-29","treasury-coupon-announcement-2026-10-01","trump-xi-summit-2026-09-24","uk-consumer-confidence-2026-09-25","uk-electricity-vat-zero-rate-2026-10-01","uk-quarterly-national-accounts-2026-09-30","umich-sentiment-final-2026-09-25","unsc-iran-panel-mandate-expiry-2026-09-26","unsc-middle-east-2334-2026-09-28"],"adjacentStrongIds":["ism-manufacturing-2026-10-01","jobs-2026-10-02","pce-2026-09-30"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** Japan sells its 40-year bond on **2026-09-29** — an anticipated ¥300bn reopening of the 3.8%
2066. MOF has **still not announced the size** at D-14 (its 09-29 calendar row carried no announcement
link when re-fetched 2026-09-15), so terms are due ~09-18–09-22, after the BoJ. **Nothing here is ours
to trade**, and this document exists to fix reading errors rather than find an edge. The original one
stands: the 40-year is a **single-price (Dutch) auction with no tail**, so the [09-15
20-year](jgb-20y-auction-2026-09-15.md) sibling's "tail ≥ 2bp = soft" test may not be carried over.
**The D-14 pulse adds two, both from primaries.** **(1) The threshold this ledger judges the result by
is calibrated on a regime that has moved.** Clearing yield minus same-session MOF par runs **−0.25bp**
across 95 auctions since 2007, but **+2.45bp** across 2026's four, and **all nine** of 2026's 30-year
auctions cleared positive at a **+4.49bp** mean. The concession is real and rises with tenor, so
"+3bp = the top 4%" is optimistic as a forward probability — **1 of the last 4** 40-years already
cleared past it. **(2) The BoJ purchase number the initial research could not source is now sourced.**
The Bank buys the **"more than 25 years"** zone at **¥75bn per auction, ¥150bn a month** — **16.7%** of
September's ¥900bn gross super-long coupon supply — and by its own rule posts **no** super-long bid on
an MOF auction day. Its Oct–Dec schedule lands **09-30, D+1**, proposed in this PR. Date and size both
**estimate**; they widen caution and license nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/15, D-14) | **Stand aside** — nothing on this calendar is exposed to it | High | `symbols: []`, no house playbook is rates- or FX-keyed, and the size is still unannounced. The week's >2% moves in tracked names (CRWV **−18.9%**, AVGO **−8.0%**, NVDA **−6.1%** since 09-08) carry the **wrong yen sign** for a Japan story — a carry unwind needs a *stronger* yen and USD/JPY went **153.42 → 155.12** | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-15 → 2026-09-29** *while USD/JPY strengthens ≥1% the same session* — the "no price channel" premise would be wrong on the one co-movement that would actually implicate Japan |
| This week | **The BoJ hike is no longer the question — the 09-30 BoJ purchase schedule is** | High | `boj-decision-2026-09-18` is priced **98.25%** for 1.0% → 1.25% (sibling ledger, Polymarket direct, stamp 2026-09-15T16:39:40Z) against the **80–84%** this ledger recorded at D-21, so the "every pre-decision reading is provisional" caveat has largely resolved; what is *not* priced is whether a post-hike BoJ trims the ¥150bn/month >25y bucket on **09-30** | **A BoJ hold at 1.0% on 2026-09-18** — the ~1.8% branch. Every super-long reading here is built on the auction pricing a 1.25% policy rate, and a hold rebuilds the lot rather than patching it |
| This month | **Judge the 09-29 result by cover and the clearing-vs-screen gap — never by a "tail", which does not exist for this tenor — and judge the gap against 2026's +2.45bp, not history's −0.25bp** | High | All 8 result pages 2025-05-28 → 2026-07-22 print `-` for both average columns. 22 of 2026's super-long result pages re-parsed 2026-09-15 and joined to MOF's own par curve: 40Y gap mean **+2.45bp** (n=4), 30Y **+4.49bp** (n=9, all positive), 20Y **+1.29bp** (n=8, four negative) | A **2026-09-29** 40-year result page that prints an actual weighted-average price and average yield — MOF would have changed the auction format, and this ledger's central correction would be obsolete (**FT-jgb-40y-auction-2026-09-29-1**) |
| This quarter | **Track the 30s40s spread, not the auction outcomes — it is the number with real information in it** | Medium | 30s40s: **+31.1bp** (2025-05 auction) · +31.7 · +23.9 · +25.8 · +11.2 · +8.9 · **−6.0** · **−5.9** (2026-07 auction) → **0.0bp** on 09-14, the **1.47th percentile** of **4,611** sessions since 2007-11-06 (median +11.2bp) — flatter still than at D-21 | 30s40s standing **at or above +10bp** on **2026-12-31** (MOF par curve) — the super-long curve would have re-steepened and the "duration pays nothing" condition this ledger reads the auction against would be gone (**FT-jgb-40y-auction-2026-09-29-3**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to this auction or to the 2026-09-29 session.
- **The correction this entry exists for** — the **40-year is single-price (Dutch)**. There is no tail,
  no average yield, and no "tail ≥ 2bp = soft" test. Do not import the 09-15 sibling's framework.
- **Weak print, defined honestly for a tenor with no tail** — cover below **2.5x**, *or* a clearing
  yield more than **+3bp** above MOF's same-session par 40-year (only 4 of 95 auctions since 2007
  cleared that cheap — but **1 of the last 4**, so read it as a live threshold, not a tail event).
- **Strong print** — cover at or above **2.8x** with the clearing yield within **1bp** of the screen,
  i.e. a repeat of 2026-07-22 (2.824x, +2.3bp).
- **Recent 40-year cover** — 2.214 (2025-05) · 2.127 · 2.604 · 2.585 · 2.760 · 2.541 · 2.702 ·
  **2.824** (2026-07-22). Rising *as* MOF cut the size ¥500bn → ¥400bn → **¥300bn**.
- **Do not read a strong cover as demand recovery.** MOF cut this auction **40% in twelve months**; a
  2.8x cover on ¥300bn absorbs the same yen as a 1.7x cover on the old ¥500bn.
- **The size is still not announced at D-14.** MOF's 09-29 row carried **no announcement link** when
  re-fetched **2026-09-15**. Terms now due ~**09-18 to 09-22**, i.e. after the BoJ.
- **The BoJ posts no super-long bid on auction day, by its own rule** — *"On the day of the JGBs
  auctions… the Bank will in principle refrain from announcing auctions for the corresponding maturity
  segments"* (BoJ, `mpr260616b.pdf`, fetched 2026-09-15).
- **Net super-long supply, now computable** — BoJ buys the **>25y** zone at **¥75bn/auction, ¥150bn a
  month** (BoJ `mpr260616a.pdf`) against **¥900bn** of September gross >25y coupon supply: **16.7%**.
- **The 09-30 BoJ purchase schedule is the quarter's real Japan event** — Oct–Dec amounts publish
  **2026-09-30 17:00 JST**, D+1 from this auction (proposed in this PR).
- **The level that says the all-time high is being retested** — the 40-year closing back above
  **4.145%** (MOF par, 2026-09-01, the highest in a series that begins 2007-11-06); it closed
  **4.040%** on 09-14.
- **Watch (dated)** — 20Y JGB **Sep 15** (done: **4.01x** cover, **1.3bp** tail) · **FOMC Sep 16**
  (~90% hike) · **BoJ Sep 18** (98.25% hike) · MOF 40Y terms **~Sep 18–22** (est) · **this auction
  Sep 29** (est) · 2Y JGB **Sep 30** · Japanese fiscal H1 closes **Sep 30** · **BoJ Oct–Dec purchase
  schedule Sep 30** (est) · BoJ Tankan **Oct 1** (est) · 30Y JGB **Oct 8** (est) · MOF Liquidity
  Enhancement 11–39y **Oct 27**.

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

**Two rules added at the D-14 pulse (2026-09-15); the stance itself is unchanged.**

- **Read the clearing gap against 2026, not against 2007–2026.** The +3bp line in kill switch 3 is
  calibrated on 95 auctions whose mean is −0.25bp; 2026's four 40-years average **+2.45bp** and 2026's
  nine 30-years average **+4.49bp**, every one positive. A +3bp print is a live outcome in this regime,
  not the 4-in-95 tail the initial research described — `FT-jgb-40y-auction-2026-09-29-2` is registered
  as written and stays as written, but its honest odds of failing are far above 4%.
- **The BoJ half of net supply is sourced now, and it is small and absent on the day.** The Bank buys
  the >25y zone at ¥75bn per auction / **¥150bn a month** (BoJ `mpr260616a.pdf`), **16.7%** of
  September's ¥900bn gross >25y coupon supply, and by its own standing rule posts **no** super-long
  offer on an MOF auction date. This closes the one gap the initial research flagged as unsourced under
  *Honest limits*; that limit is left standing there as the record of what 09-08 knew.

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

Four predictions carry score-by dates and are registered in
[`forward-tests/jgb-40y-auction-2026-09-29.md`](../forward-tests/jgb-40y-auction-2026-09-29.md) —
three at the 2026-09-08 initial research, and `FT-4` (the 2026 concession regime) at the D-14 pulse.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-21 | Initial research banked (above). **The proposal's premise is corrected: the 40-year has NO TAIL.** It is a **single-price (Dutch) auction** — all eight MOF result pages 2025-05-28 → 2026-07-22 print `-` for Weighted Average Price and Yield at the Average Price, where the 2026-08-20 20-year prints 100.02 / **3.698%** against a 99.85 / **3.713%** low (1.5bp tail); of the 14 tenor sheets in MOF's workbook only 40年債 and the two GX sheets lack an average-price column. The 09-15 sibling's "tail ≥ 2bp = soft" test **cannot be computed here** (`FT-1`). **Replacement metric, measured over all 95 auctions since 2007-11-06:** clearing yield minus same-session MOF par 40Y — mean **−0.25bp**, sd **1.78bp**, p95 **+2.83bp**, max +4.40bp, only **4 of 95** above +3bp (`FT-2`). **Spillover is a null with an unstable sign** — 94 auctions matched to the same-date US 30Y CMT: soft (gap > +0.5bp, n=31) **−1.10bp** vs firm (n=63) **+0.56bp**, t = **−1.45**; but 2023+ (n=22) gives **+1.43** vs **+0.07**, t = **+1.08**; corr(gap, US move) **−0.083**; by cover +0.85 vs −0.83, t = +1.55. Three measures, three signs, none significant — weaker than the 20-year's "sign consistent, magnitude noise." **30s40s has collapsed** to **+0.4bp** (09-07), the **1.7th percentile** of 4,606 sessions (median +11.2bp), after an all-time low of **−11.1bp** on 2026-07-02 — but the last two 40Y auctions BOTH cleared with it negative (−6.0, −5.9bp) and covered **2.702x** / **2.824x**, the best since 2025-03, so the cut size looks like what is doing the work (`FT-3`). **A seasonality story is killed:** raw September cover 2.757 (n=10) vs 3.028 other months (n=85), t = **−2.43**, collapses to **−0.021, t = −0.19** against each auction's own neighbours — regime clustering, not the Japanese H1 close, and the raw result came from an 11-month family. **Hedge gap is WIDER at this tenor:** JGB 40Y minus hedged US 30Y **+298bp** (2023-09) → +318 → +199 → +142 → +138 → **+109bp** (2026-09-04), against +83bp at the 20-year — the super-long is where a yen investor's home advantage is largest, and BoJ hikes are what close it. **Rates (MOF par, primary):** 40Y **4.145% on 09-01** is the all-time high of a series beginning 2007-11-06; **4.013%** on 09-07. **Process:** MOF's 09-29 calendar row carries **NO announcement link** on 09-08 while the 09-15 20Y row does — the **¥300bn size is anticipated, not announced**, with terms due ~09-18–09-22, after the BoJ. **Supply:** 40Y ¥500bn → ¥400bn → **¥300bn** (−40%), 30Y ¥700bn → **¥600bn** (2026-04-07), 20Y −30%; 2.824x on ¥300bn = 1.69x on the old ¥500bn. **Volatility / FX (Yahoo, secondary):** VIX **15.31** (09-08 intraday; ten-session range 14.32–16.34, no regime change); USD/JPY **160.196 (09-01) → 154.235 (09-08)**, −3.7%. **Peers:** n/a, `symbols: []`. **Adjacency:** 35 tracked ids inside the ±5d corridor, headed by `boj-summary-of-opinions-2026-10-01`, `boj-tankan-2026-10-01`, `pce-2026-09-30`, `government-funding-deadline-2026-09-30` and `jobs-2026-10-02`; the auction is **D+11 from `boj-decision-2026-09-18`**, the first super-long auction to price a post-decision rate, and lands one day before the Japanese fiscal H1 closes 09-30. **One new dated event PROPOSED (`estimate`):** `jgb-30y-auction-2026-10-08`, read off MOF's own October calendar (which carries **no 40-year**, confirming the bi-monthly cadence) — the other leg of the collapsed 30s40s spread, which this calendar tracked on neither side. **Unsourced and flagged:** no BoJ primary carrying the current super-long JGB purchase amount was located, so net supply is not computed and nothing is claimed about it; the fetches returned HTTP 200, so `probe-ref.blocked` stays empty. | Initial stance set — **stand aside permanently**; the entry is a corrective and diagnostic instrument, not a signal | 2026-09-15 (low band; interval tightens to 7d once inside 15 days) |
| 2026-09-15 | D-14 | **Why this pulse reached a session:** the cadence band transitioned **low:15+ → low:0+** (interval 30d → 7d). **THE THRESHOLD THIS LEDGER JUDGES BY IS MIS-CALIBRATED, and it is measurable.** All **22** of 2026's 20/30/40-year MOF result pages re-fetched direct 2026-09-15 and each joined to MOF's own same-session par curve (`jgbcm_all.csv` + current-month `jgbcm.csv`, 4,611 sessions): clearing-minus-par gap **40Y mean +2.45bp** (n=4: +2.9, +0.2, +4.4, +2.3) against the **−0.25bp** across 95 auctions since 2007-11-06 this doc calibrated on; **30Y mean +4.49bp** (n=9, **every one positive**, range +0.6 to +9.8); **20Y mean +1.29bp** (n=8, four negative). **The concession is real and rises with tenor**, so kill switch 3's "+3bp = only 4 of 95" is optimistic as a *forward* probability — **1 of the last 4** 40-years (2026-05-27, **+4.4bp**) already cleared past it. `FT-2` stands registered as written; a new **`FT-4`** registers the narrower regime claim (09-29 clears at a **positive** gap). *Limit:* par is an end-of-day reading against a 12:45 JST stop, so a positive gap mixes concession with the post-auction move — the level comparison is what carries, not the decomposition. **THE ONE UNSOURCED NUMBER IS NOW SOURCED** (initial research: *"the next pulse should find that page"*). BoJ `mpr260616a.pdf` (Quarterly Schedule Jul–Sep 2026, fetched direct, HTTP 200, 141,472 bytes): the **">25 years"** zone — the 40-year's only bucket — is **¥75bn per auction, ¥150bn a month, twice monthly**. Against September gross >25y coupon supply of **¥900bn** (30Y **¥600bn** on 09-03 + 40Y **¥300bn** anticipated 09-29, both MOF announcements) the Bank absorbs **16.7%**; net ≈ **¥750bn**. And `mpr260616b.pdf` note 3, verbatim: *"On the day of the JGBs auctions… the Bank will in principle refrain from announcing auctions for the corresponding maturity segments"* — **no BoJ super-long bid on 09-29, by rule**. **Peers (the sibling super-longs):** 09-15 **20Y** (`eresul20260915.htm`, today) **4.005x** cover (¥2,131.3bn / ¥532.1bn), tail **1.3bp** (3.869% low vs 3.856% avg) — **firm** on the sibling's own lines (soft = tail ≥2bp, weak = cover <3.0); its same-session par is not published yet, so the gap is uncomputable today (+6.1bp vs 09-14's 3.808). 09-03 **30Y** cover **3.788x**, tail **2.1bp**, gap **+4.8bp**. **Super-long demand held at the 20-year three days before the hike.** **Macro:** CPI 09-11 printed core **+0.3% m/m** vs 0.2% consensus ([`cpi-2026-09-11.md`](cpi-2026-09-11.md) close-out) and the policy path repriced hard — **FOMC 09-16 ~90% to hike** (91.4% futures-derived / 86.2% venue VWAP, [`fomc-2026-09-16.md`](fomc-2026-09-16.md)); **BoJ 09-18 98.25%** to hike (Polymarket direct, stamp 2026-09-15T16:39:40Z, [`boj-decision-2026-09-18.md`](boj-decision-2026-09-18.md)) against the **80–84%** recorded at D-21. The stance's "provisional until 09-18" caveat has largely resolved. **LEG 6 REVERSED, AND THE MECHANISM IS TWO-SIDED.** Domestic-minus-hedged advantage on the same basis, both primaries, 09-14: JGB 40Y **4.040** − [US 30Y **5.34** − (US 3M **4.11** − JP 1Y **1.553**)] = **+125.7bp**, against **+109bp** on 09-04 — **it widened 17bp in a week**, and the cause is the **Fed**, not the BoJ: US 3M ran **3.91 → 4.11** on the CPI print, which makes dollar hedging dearer and pushes a yen investor *further* toward home. A 25bp BoJ hike takes ~25bp off this number and a 25bp Fed hike adds ~25bp, so with both ~90%+ priced this week the convergence story the initial research carried **stalls this quarter** rather than continuing (approximation unchanged: short-rate differential, cross-currency basis excluded). **Curve (MOF par, primary):** 30s40s **0.0bp** on 09-14 (40Y 4.040, 30Y 4.040), the **1.47th percentile** of 4,611 sessions (median +11.2bp) — flatter than 09-07's +0.4bp, so `FT-3` tracks in favour; 20s40s **+23.2bp**; 40Y **4.040** sits **10.5bp** below the **4.145%** all-time high of 09-01, retest level unfired. **Volatility / FX (Yahoo, secondary):** VIX **15.31 → 17.52** (live, stamp 2026-09-15T19:45:31Z; 09-14 close 17.10), **+2.21** — inside the screen's 3-point band, ten-session range 14.53–17.84 against 14.32–16.34 last row, a step up with no regime break. USD/JPY **155.12** (stamp 2026-09-15T20:00:37Z) against 154.235 last row, after a 09-13/14 low of **153.42**: the −3.7% yen rally **stalled and partly reversed**. **KILL SWITCH 1 CHECKED, NOT FIRED — and the attribution is measured, not assumed.** Tracked names did move >2%: CRWV **−18.9%** (99.83 → 81.00), AVGO **−8.0%**, NVDA **−6.1%**, MRVL −1.7% with a −7.3% session on 09-14. But the **co-movement sign is wrong for a yen story** — a carry unwind needs a *stronger* yen and USD/JPY went **153.42 → 155.12** across exactly those sessions — and the repo's own CPI close-out attributes the damage to the 09-14 policy-path repricing, naming `CRWV −6.89%`. The premise holds; the switch's wording is tightened in the decision header to require the yen leg. **Process:** September calendar re-fetched direct (HTTP 200, **26,451** bytes, up from 25,556 — the new 09-15 result link is the growth); the **09-29 40-year row still carries no Auction Announcement link**, so the size is unannounced at D-14. That **clears the "This week" falsifier** (*terms before 2026-09-15*) and leaves **kill switch 6 unfired**; terms due ~09-18–09-22. October re-checked: still no 40-year. **One new dated event PROPOSED (`estimate`):** `boj-jgb-purchase-schedule-q4-2026-09-30` — the Oct–Dec >25y purchase amounts, published **2026-09-30 17:00 JST** per the Jul–Sep schedule's own verbatim note, **D+1** from this auction and the first scheduled read on whether a post-hike BoJ trims the ¥150bn/month bucket. **Adjacency:** corridor grew **35 → 60** tracked ids within ±5d, of which **3** are confirmed high-impact (`pce-2026-09-30`, `ism-manufacturing-2026-10-01`, `jobs-2026-10-02`) — the prior probe-ref carried no `adjacentStrongIds` key, so this row sets that baseline; `jgb-2y-auction-2026-09-30` is newly tracked at D+1 and does not compete for the >25y bucket. **Geopolitical:** nothing touching yen rates or the event's symbols this week (`symbols: []`). **Peers:** n/a. All fetches returned HTTP 200; `probe-ref.blocked` stays empty. | **No change — stand aside, permanently.** Two *reading* rules added to the Stance section (judge the gap against 2026, not 2007–2026; the BoJ half of net supply is small and absent on the day). Zero capital either way | 2026-09-22 (low band, `low:0+`, 7d) |
| 2026-09-22 | D-7 | **The D-14 pulse's open contingency is resolved, and uneventfully.** [`boj-decision-2026-09-18`](boj-decision-2026-09-18.md) closed out (2026-09-19): the BoJ hiked 25bp to **1.25%**, **7-2** (Asada, Sato dissenting to **hold** — two DOVISH dissents, against July's single hawkish one). USD/JPY moved **155.69 → 157.89** (+1.41%), inside that ledger's own ±2.0% carry-unwind band — the yen **weakened** on the hike rather than strengthening. **THE SIZE IS NOW ANNOUNCED.** MOF's September calendar row for 09-29 now carries a live Auction Announcement link (`announcement/auct20260918eb.htm`, fetched direct today) published **2026-09-18** — inside the "about one week prior" window this ledger flagged at D-14: **¥300bn** (the anticipated size, confirmed exactly), reopening the 40-year 2066-03-20 maturity, Dutch-style auction at 0.5bp intervals, issue date 2026-09-30. **Kill switch 6 checked, not fired** — date and size both unchanged. Still `estimate` (no MOF confirmed-prefix slot). **Rates (MOF par curve, primary — `jgbcm.csv`, CP932-decoded after the English path 302'd to the Japanese one, exactly as initial research recorded):** the file's last row is **09-17** — Tokyo cash was shut **09-21** for Respect for the Aged Day (Silver Week), so no newer session has published as of this fetch (`Last-Modified` header confirms). 40Y **4.036%**, 30Y **4.047%**, **30s40s −1.1bp** — still deep in the collapsed range this ledger has tracked since D-21 (09-14: 0.0bp; 09-07: +0.4bp); no re-steepening, FT-3 unchanged. **Volatility (Yahoo, secondary; raw JSON parsed directly this session — WebFetch's own summarizer hallucinated a 2025 VIX series on first attempt and should not be trusted on this endpoint going forward):** VIX **17.52 (09-15) → 14.81 (09-18 close) → 14.87 (09-21 close, live)** — real decompression through both central-bank decisions, not a regime break upward. **USD/JPY kept weakening: 155.12 (09-15) → 157.54 (09-22, live)**, +1.56%. **Kill switch 1 still cannot fire on sign alone** — tracked names ripped this week (NVDA +7.2%, AVGO +6.9%, MRVL +16.1%, CRWV +5.6%, 09-15→09-21 closes, Yahoo) but a carry unwind needs a *stronger* yen, and USD/JPY has done nothing but rise since D-21. **Adjacency: corridor grew 60 → 65** ids within ±5d; **one new confirmed high/critical id joins `adjacentStrongIds`:** `mu-2026-09-30-print` (Micron earnings, D+1 from this auction), alongside standing `pce-2026-09-30`, `ism-manufacturing-2026-10-01`, `jobs-2026-10-02`; `trump-xi-summit-2026-09-24` and `government-funding-deadline-2026-09-30` (both high) stay `estimate`, not confirmed. **`--on-date` checked for both 09-29 and 09-30 — nothing new to propose**; every id this sweep would surface is already canonical, including `boj-jgb-purchase-schedule-q4-2026-09-30` (this ledger's own D-14 proposal, now on the calendar). **Peers:** n/a, `symbols: []`. All fetches returned HTTP 200 (English-path redirects resolved via the Japanese path); `probe-ref.blocked` stays empty. | **No change — stand aside, permanently.** The BoJ resolution clears the last open contingency this ledger was carrying; nothing here licenses a position | 2026-09-29 (low band, `low:0+`, 7d — lands on the auction date itself) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-jgb-40y-auction-2026-09-29.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.

**Last assessed:** 2026-09-22
<!-- probe-ref: {"symbols":{},"vix":14.87,"daysBand":"low:0+","adjacentIds":["adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","apple-eu-dma-terms-2026-10-01","bea-international-transactions-q2-2026-09-24","bloomberg-agg-index-rebalance-2026-09-30","boe-dmp-2026-10-02","boj-jgb-purchase-schedule-q4-2026-09-30","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","case-shiller-hpi-2026-09-29","census-benchmark-revision-nsa-2026-09-28","chicago-pmi-2026-09-30","construction-spending-2026-10-01","consumer-confidence-2026-09-29","costco-q4-fy2026-2026-09-24","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","dallas-fed-trimmed-mean-2026-09-30","dallas-fed-tssos-2026-09-29","dmo-pilot-switch-auction-test-2026-09-24","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","eia-weekly-petroleum-status-2026-09-30","eurostat-hicp-flash-2026-10-01","fhfa-hpi-2026-09-29","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","google-adtech-final-judgment-2026-10-02","government-funding-deadline-2026-09-30","intl-transactions-q2-2026-09-24","ism-manufacturing-2026-10-01","jgb-2y-auction-2026-09-30","jgb-liquidity-enhancement-5-11y-2026-09-25","jobs-2026-10-02","jolts-2026-09-29","m3-full-report-2026-10-02","mu-2026-09-30-print","new-home-sales-2026-09-24","opec-jmmc-68th-2026-10-04","opec-plus-meeting-2026-10-04","openai-devday-2026-09-29","pce-2026-09-30","pjm-reliability-backstop-procurement-2026-09-30","pmms-2026-10-01","russell-style-quarter-end-capping-effective-2026-09-30","scoos-2026-09-24","sp-global-manufacturing-pmi-2026-10-01","sp-global-pmi-commodity-price-supply-2026-10-01","sp-select-sector-secondary-reweight-2026-09-30","steel-imports-preliminary-2026-09-24","tic-quarterly-external-debt-2026-09-30","treasury-7y-note-2026-09-24","treasury-buyback-10y20y-2026-10-01","treasury-buyback-20y30y-2026-09-24","treasury-buyback-tips-1y10y-2026-09-29","treasury-coupon-announcement-2026-10-01","trump-xi-summit-2026-09-24","uk-consumer-confidence-2026-09-25","uk-electricity-vat-zero-rate-2026-10-01","uk-quarterly-national-accounts-2026-09-30","umich-sentiment-final-2026-09-25","unsc-haiti-gsf-mandate-adoption-2026-09-29","unsc-haiti-gsf-mandate-expiry-2026-09-30","unsc-iran-panel-mandate-expiry-2026-09-26","unsc-middle-east-2334-2026-09-28","us-iip-q2-2026-2026-09-24"],"adjacentStrongIds":["pce-2026-09-30","mu-2026-09-30-print","ism-manufacturing-2026-10-01","jobs-2026-10-02"],"screenStreak":0,"blocked":[]} -->
