# U.S. International Transactions and Investment Position, Q2 2026 — intl-transactions-q2-2026-09-24

**Kind:** macro-print · **Date:** 2026-09-24 (**confirmed**, promoted from `estimate` by this research — `BEA:` bea.gov/news/schedule re-fetched direct 2026-09-15, HTTP 200, 75,123 bytes, first upcoming row verbatim "September 24 | 8:30 AM | News | U.S. International Transactions and Investment Position, 2nd Quarter 2026", corroborated the same session on bea.gov/data/intl-trade-investment/international-transactions, HTTP 200, 61,775 bytes, "Next Release: September 24, 2026") · **Impact:** low
**Last assessed:** 2026-09-15
<!-- probe-ref: {"symbols":{},"vix":17.43,"daysBand":"low:0+","adjacentIds":["bea-international-transactions-q2-2026-09-24","case-shiller-hpi-2026-09-29","census-benchmark-revision-nsa-2026-09-28","consumer-confidence-2026-09-29","costco-q4-fy2026-2026-09-24","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","dmo-pilot-switch-auction-test-2026-09-24","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","fhfa-hpi-2026-09-29","jgb-40y-auction-2026-09-29","jgb-liquidity-enhancement-5-11y-2026-09-25","jolts-2026-09-29","jpx-market-closure-2026-09-21","jpx-market-closure-2026-09-22","jpx-market-closure-2026-09-23","meta-connect-2026-09-23","missouri-map-tro-expiry-2026-09-22","missouri-uocava-ballot-mailing-2026-09-19","new-home-sales-2026-09-24","openai-devday-2026-09-29","retail-benchmark-revision-2026-09-28","russell-quarterly-ipo-review-effective-2026-09-21","scoos-2026-09-24","sp-global-flash-eurozone-pmi-2026-09-23","sp-global-flash-france-pmi-2026-09-23","sp-global-flash-germany-pmi-2026-09-23","sp-global-flash-us-pmi-2026-09-23","sp-quarterly-rebalance-effective-2026-09-21","steel-imports-preliminary-2026-09-24","treasury-2y-frn-2026-09-23","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-20y30y-2026-09-24","treasury-buyback-tips-1y10y-2026-09-29","trump-xi-summit-2026-09-24","uk-consumer-confidence-2026-09-25","uk-public-sector-finances-2026-09-22","umich-sentiment-final-2026-09-25","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-expiry-2026-09-26","unsc-middle-east-2334-2026-09-28"],"adjacentStrongIds":[],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Half of this release is arithmetic; the other half is $1.5 trillion of stock-market
arithmetic that nobody is looking at — and both say stand aside.** The current-account half is
already knowable: Q2 goods-and-services is fully published in three monthly FT-900s (**−$199.8B**),
and the ITA's own quarterly goods-and-services series reproduces that monthly sum **to $0.0B in 15
of the last 16 quarters** — so only the income residual is unknown, and it has held −$43.7B…−$99.2B
for eight quarters. That gives **−$268.8B ±$25B**, ≈**3.3% of GDP**, widening from Q1's −$226.8B.
The *other* half, the net international investment position, is not computable from any monthly at
all — its quarterly change has been driven by a **valuation** term running a median **3.3×** the
size of the current account (sd **$913B**), which flipped the sign of the NIIP move in **5 of 16**
quarters. But it is *modelable*: US-versus-foreign equity performance explains **85%** of it
(LOO RMSE $390B), and Q2 2026's **SPX +14.87% / EFA +8.64%** imply a **−$1.5T** valuation hit and an
end-Q2 NIIP near **−$23.0T** — a **record in dollars**, the **3rd-largest quarterly deterioration
since 2006**, and yet **−70.9% of GDP against 2024Q4's −74.2% record**. That last gap is the whole
point: the NIIP worsens *because* foreigners' US holdings rallied 14.9%, so a "record US foreign
debt" headline on 09-24 has the causality backwards. `symbols: []`, `low`, no macro-keyed playbook,
release class measured inert — **nothing to trade, date now `confirmed`.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-9) | **Stand aside** | High | `symbols: []`, `low`, no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed, no instrument attaches, and the current-account half is computable in advance. The `confirmed` date changes the audit trail, not the call. | A macro-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-09-24** — none exists today |
| This week | **Expect the Q2 current account at −$268.8B, band −$243.5B…−$299.0B — and do not treat it as news** | High | Q2 goods-and-services **−$199.8B** is fully published, and FRED `IEABCGS` proves the ITA's quarterly G&S *is* the monthly sum (wedge exactly **$0.0B in 15 of 16** quarters). Only the income residual moves. | The **2026-09-24** print landing outside **−$243.5B…−$299.0B** — the income residual would have broken its own eight-quarter band |
| This month | **Expect end-Q2 NIIP near −$23.0T (band −$22.63T…−$23.41T) — the release's only real unknown, and it is a market-return readout** | Medium | ΔNIIP = flows + valuation, and valuation has run median **3.3×** the current account. Regressing it on SPX + EFA gives R² **0.849**, LOO RMSE **$390B**; Q2's +14.87% / +8.64% ⇒ **−$1,484B**. Medium because n=16 and the model has never been run out of sample. | The **2026-09-24** NIIP printing outside **−$22.63T…−$23.41T**, or *improving* from −$21.27T — either kills the valuation model |
| This quarter | **Read a "record US foreign debt" headline as an equity-rally readout, not a warning — and never attribute the 09-24 tape to this print** | Medium | −$23.0T is a record in dollars but **−70.9% of GDP vs 2024Q4's −74.2%**; the term that drove it is foreigners' US equity holdings gaining 14.9%. Separately, `trump-xi-summit-2026-09-24` (high, estimate) owns the session. | The end-Q2 NIIP/GDP ratio printing **past −74.2%** — a genuine record in the ratio would make the level argument, not just the headline, worth re-reading |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `symbols: []`, `low` impact, no macro-keyed
  playbook. The 2026-09-24 date is now **`confirmed`** on two BEA primaries — which permits
  date-keyed action in principle and licenses none here.
- **The current account to compute, not wait for:** G&S **−$199.8B** (FRED `BOPGSTB`, Apr/May/Jun
  all published) + income residual **−$68.9B** (8-quarter median) ⇒ **−$268.8B**, ≈3.31% of GDP.
  Q1 was −$226.8B / 2.9%.
- **The NIIP to compute, which nobody publishes:** −$21.27T + (−$268.8B flows) + (−$1,484B
  valuation) ⇒ **−$23.02T**. The valuation input is public market data, not a forecast.
- **If the current account lands outside −$243.5B…−$299.0B, stop using the arithmetic frame.**
  **If the NIIP lands outside −$22.63T…−$23.41T, stop using the valuation model** — and if it
  *improves* from −$21.27T, the model is refuted outright, not re-tuned.
- **Do not read a record-dollar NIIP as a dollar-crisis signal.** Check the ratio: −70.9% projected
  vs the −74.2% record set at 2024Q4. The mechanism is US equity outperformance.
- **A ~$7B revision caveat sits on the arithmetic.** Today's monthly vintage sums $6.9B narrower
  than the ITA's own published Q1 — the one non-zero wedge in 16 quarters, and it opened *after*
  the 06-24 print.
- **Watch (dated)** — **this print 09-24** 08:30 ET (confirmed) · Trump–Xi summit **09-24** ·
  7Y note **09-24** · durable goods **09-25** · GDP Q2 third estimate + NIPA annual update
  **09-30** · funding deadline **09-30** · Aug FT-900 **10-06** · Q3 advance GDP **10-29** · Q3
  edition of this release **12-18**.

## Initial research

### The question, plainly

This id was proposed on 2026-09-15 by the `gdp-q3-2026-advance-2026-10-29` pulse-check sweep, and a
sibling lane proposed the **same BEA release** under a second slug the same day, researched it, and
named **this** id the survivor. So this session inherits two jobs: write the canonical calendar file
and settle the date's status — and then ask the question the sibling ledger's own honest-limits
section left open. That ledger proved the **current-account** half is computable in advance, and
filed two caveats against itself: *"basis is asserted, not reconciled line by line"*, and a single
line disposing of the **net international investment position**. **Is the current-account
arithmetic actually reconcilable? And is the NIIP — the other half of the release title, and a
number four times larger — knowable at all?**

**One-line verdict:** the arithmetic reconciles exactly (15 of 16 quarters, wedge $0.0B), and the
NIIP is *not* arithmetic but *is* modelable — 85% of it is US-versus-foreign equity performance,
which points at **−$23.0T**, a dollar record that is **not** a ratio record and is therefore an
equity-rally readout rather than a warning.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no
target. Everything below was fetched **direct on 2026-09-15**; every fetch returned HTTP 200 and
`probe-ref.blocked` is empty.

1. **`bea.gov/news/schedule`** (75,123 bytes) — the 2026 upcoming block, parsed per `<tr>`.
2. **`bea.gov/data/intl-trade-investment/international-transactions`** (61,775 bytes) — the ITA
   product page's own current/next-release header and last-published figures.
3. **FRED** — `BOPGSTB` (monthly goods-and-services balance, BoP basis, SA), **`IEABCGS`** (the
   ITA's *own* quarterly goods-and-services balance — the reconciliation control the sibling
   ledger did not have), `IEABC` (quarterly current account), **`IIPUSNETIQ`** (quarterly NIIP,
   81 observations back to 2006Q1), `GDP`.
4. **Yahoo monthly bars** — `^GSPC`, `EFA` (developed ex-US, USD-denominated), `DX-Y.NYB`,
   2022-01 → 2026-09; `^VIX` daily, last month.
5. **The repo's own calendar** — all 704 entries (656 canonical + 48 proposal-only) loaded; the
   09-19…09-29 corridor enumerated for the adjacency sweep.

The sibling ledger [`bea-international-transactions-q2-2026-09-24.md`](bea-international-transactions-q2-2026-09-24.md)
is cited where its findings are **carried rather than re-run**, and labelled as such each time.

### Leg 1 — the 2026-09-24 date, and whether this id may now be `confirmed` · **SUPPORTED** — promoted

BEA's upcoming block, tag-stripped, from today's fetch:

| Date | Release |
|---|---|
| **September 24, 8:30 AM · News** | **U.S. International Transactions and Investment Position, 2nd Quarter 2026** |
| September 30, 8:30 AM · News | GDP (Third Estimate), Industries, Corporate Profits, State GDP, and State Personal Income, Q2 2026; State PCE, 2025 |
| September 30, 8:30 AM · News | Personal Income and Outlays, August 2026 |
| October 6, 8:30 AM · News | U.S. International Trade in Goods and Services, August 2026 |

Nothing precedes it — it is the **next BEA release of any kind**. The second primary agrees
verbatim: *"Current Release: June 24, 2026 **Next Release: September 24, 2026**"*, alongside the
last published figures — current account **−$226.8B** for Q1 2026 (widened 2.6% from Q4 2025's
−$221.1B; **2.9% of GDP**), NIIP **−$21.27T** at end-Q1 (assets $43.37T, liabilities $64.64T),
improved from **−$21.87T** at end-Q4 2025 (revised).

**The status flips to `confirmed`, and the reasoning is mechanical rather than a judgment call.**
Four conditions, all met: `BEA:` is a confirmed-tier prefix in `market-events-data.ts`; this is a
**sole-publisher** BEA release, so the joint-publisher objection that keeps the Census/BEA FT-900
entries at `estimate` does not reach it; **two** BEA primaries were read this session, the bar the
`advance-services-q3-2026-11-19` precedent set; and the no-self-confirm limit does not bind, because
this lane did **not** discover the event in-sweep — a different lane proposed it, and the proposal
string itself reserved the flip for exactly this pass (*"A later pass citing this same BEA primary
independently may flip it to confirmed with the BEA: prefix"*). The confirmed sibling
[`intl-transactions-q3-2026-12-18`](intl-transactions-q3-2026-12-18.md) was promoted on identical
grounds. **This changes the audit trail, not the call** — a `confirmed` date permits date-keyed
action; nothing in this ledger licenses any.

### Leg 2 — "the current-account half is computable in advance" · **SUPPORTED, and now reconciled line by line**

The sibling ledger established the claim and then filed the honest limit that it rested on an
assumption: *"`BOPGSTB` (SA, BoP basis) and `IEABC` are both BEA series and reproduce Q1 2026's
−$226.8B exactly … this lane did not verify that BEA applies no further coverage adjustment between
the monthly and quarterly vintages."* That check reduces to one series it did not pull — FRED
**`IEABCGS`**, the ITA's *own* quarterly goods-and-services balance. Pulled today, against the sum
of the three monthly `BOPGSTB` observations in each quarter:

| Quarter | ITA G&S | Monthly sum | Wedge |
|---|---|---|---|
| 2022Q2 … 2025Q4 (15 quarters) | — | — | **$0.00B in every one** |
| **2026Q1** | **−$165.75B** | **−$158.83B** | **−$6.92B** |

**The concept is identical.** Fifteen consecutive quarters at exactly zero is not "no material
adjustment" — it is the same number. The limit is closed, and the arithmetic frame is stronger than
the lane that proposed it could claim.

**The one exception is a vintage artifact, and it is the caveat that replaces the old limit.** The
ITA locked Q1 on **2026-06-24**; the monthly series has been revised since (the July FT-900 landed
2026-09-04 carrying revisions to prior months), so today's monthly vintage sums **$6.9B narrower**
than what BEA actually printed. The wedge opened *after* the print, not before it — which is why 15
quarters read zero. Practically: **a ~$7B revision band sits on top of the income-residual band**,
and it is small enough not to move any conclusion here.

Re-deriving the income residual off the *clean* series (`IEABC` − `IEABCGS`, rather than
`IEABC` − monthly sum) over the last eight quarters:

| | 2024Q2 | 2024Q3 | 2024Q4 | 2025Q1 | 2025Q2 | 2025Q3 | 2025Q4 | 2026Q1 |
|---|---|---|---|---|---|---|---|---|
| Income residual ($B) | −70.4 | **−99.2** | −73.8 | −63.5 | −69.1 | −68.8 | **−43.7** | −61.1 |

Median **−$68.9B**, range **−$43.7B … −$99.2B**, sd $15.4B. (Only 2026Q1 differs from the sibling's
table — −$61.1B rather than −$68.0B — because that is exactly the quarter carrying the wedge. The
median and the band are unchanged.) So, independently replicated:

- **Q2 2026 goods and services: −$199.8B** (Apr −$52.883B, May −$75.752B, Jun −$71.182B), against
  Q1's −$165.8B.
- **Point estimate: −$199.8B − $68.9B = −$268.8B**, ≈**3.31%** of GDP annualized (Q2 SAAR
  $32,486.1B), against Q1's 2.79% on today's GDP vintage — BEA published 2.9% on its own.
- **Band: −$243.5B … −$299.0B**, the residual's eight-quarter range.

### Leg 3 — "so the release carries no information" · **MIXED** — true of the current account, false of the NIIP

The release title has two halves. Everything above disposes of the first. The second — the **net
international investment position** — is not derivable from any monthly this calendar tracks,
and it is the larger number by a wide margin. Decomposing ΔNIIP into the flow the current account
implies and the residual (valuation changes plus other-volume changes), over 16 quarters:

| Quarter | NIIP | ΔNIIP | Current account | Valuation + other | Ratio |
|---|---|---|---|---|---|
| 2024Q3 | −$20.35T | −$1,369.7B | −$330.6B | −$1,039.0B | 3.1× |
| 2024Q4 | −$22.13T | −$1,779.8B | −$326.2B | −$1,453.6B | 4.5× |
| **2025Q1** | −$20.95T | **+$1,176.5B** | −$438.2B | **+$1,614.7B** | 3.7× |
| 2025Q2 | −$21.42T | −$465.5B | −$254.9B | −$210.6B | 0.8× |
| 2025Q3 | −$22.04T | −$624.2B | −$262.9B | −$361.3B | 1.4× |
| 2025Q4 | −$21.87T | +$167.4B | −$221.1B | +$388.5B | 1.8× |
| **2026Q1** | −$21.27T | **+$603.3B** | −$226.8B | **+$830.2B** | 3.7× |

Across all 16: the valuation term runs a **median 3.3×** the size of the current account, with a
standard deviation of **$913B** against the current account's own ~$50B, and in **5 of 16** quarters
it was large enough to flip the sign of the NIIP move — the position **improved** while the country
ran a deficit. Median |ΔNIIP| is **$614B** against median |current account| **$251B**.

**This is the finding the "it is bookkeeping" frame misses.** The half of the release that is
arithmetic is also the half that is small. The half that actually moves is unpublished anywhere
else, and no monthly FT-900 contains a single input to it.

### Leg 4 — "but the NIIP is unknowable" · **REFUTED** — 85% of it is two equity returns

The valuation term is not noise; it is a revaluation of two stacks of assets. Foreigners hold
~$64.6T of US liabilities, heavily US equities; the US holds ~$43.4T of foreign assets, heavily
foreign equities and FDI. So US equities rallying *worsens* the NIIP and foreign equities rallying
*improves* it. Regressing the quarterly valuation term on quarterly index returns, 2022Q2–2026Q1
(n=16):

| Model | Fit | R² | LOO RMSE |
|---|---|---|---|
| SPX only | −77.0 × SPX% | 0.414 | — |
| **SPX + EFA** | **18.0 − 161.4 × SPX% + 104.0 × EFA%** | **0.849** | **$390B** |
| SPX + EFA + DXY | −87.9 − 171.7 × SPX% + 145.2 × EFA% + 66.9 × DXY% | 0.866 | $436B |

**The two-regressor model is the one to use**, and the reason is out-of-sample rather than
aesthetic: adding DXY buys 1.7pp of in-sample R² and *loses* $46B of leave-one-out accuracy, and its
coefficient carries the **wrong sign** — a stronger dollar should shrink the USD value of US foreign
assets. That sign is the tell that DXY is collinear noise here: `EFA` is USD-denominated and already
embeds the FX translation, so the third regressor has no independent channel left to explain.

Both surviving coefficients have the economically correct sign and a sensible magnitude: **−$161B
per 1% of S&P 500**, **+$104B per 1% of EFA**. Residuals are well behaved at the extremes — 2025Q1's
+$1,615B swing fits to +$1,611B, 2026Q1's +$830B to +$988B.

**Applying it to a quarter that is already over.** Q2 2026 (2026-03-31 → 2026-06-30 closes):
**SPX 6,528.52 → 7,499.36 = +14.87%**, **EFA 95.617 → 103.880 = +8.64%**. Both are settled public
prices, not forecasts.

- **Valuation term: −$1,484B** (three-regressor variant: −$1,304B).
- **End-Q2 NIIP: −$21,270B − $269B − $1,484B = −$23,023B ≈ −$23.02T**, band **−$22.63T … −$23.41T**
  at ±1 LOO RMSE.

### Leg 5 — "a record NIIP is a warning about the US external position" · **REFUTED** — it is an equity-rally readout

If Leg 4 is right, the 09-24 print produces a headline number. Three measurements say the obvious
reading of it is backwards.

1. **It is a record in dollars.** −$23.02T would pass 2024Q4's −$22.13T, the deepest in the
   81-quarter series back to 2006Q1.
2. **It is not a record in the ratio.** −$23,023B against Q2 GDP SAAR $32,486B is **−70.9%**, well
   short of **2024Q4's −74.2%**. The denominator grew ~9% since. A "record" that shrinks when
   scaled to the economy is a nominal artifact.
3. **The mechanism runs the other way.** Of the projected $1,754B deterioration, **$1,484B (85%) is
   valuation** and only $269B is the trade-and-income deficit. The valuation term is negative
   *because* the S&P 500 gained 14.87% — foreigners' US holdings got more valuable, which is what
   "the US owes more" mechanically means here. A projected deterioration of $1,754B would rank
   **3rd largest since 2006** (behind 2021Q4's −$1,964B and 2024Q4's −$1,780B), and both of those
   were also equity-rally quarters.

So the honest sentence is: *the US net investment position deteriorated by a near-record amount in
Q2 because US equities outperformed foreign ones by ~6pp.* That is not a solvency signal and not a
dollar signal; it is the accounting shadow of the rally. Anyone reading 09-24's number as a
warning has the causality inverted.

### Leg 6 — the 2026-09-24 session is a place to act on an 08:30 print · **REFUTED**, twice

**The release class is measured inert.** Carried, not re-run, from
[`intl-transactions-q3-2026-12-18`](intl-transactions-q3-2026-12-18.md) via the sibling ledger: SPY,
6,709 sessions since 2000-01-01, ITA release days ex-opex (n=94) median |gap| 0.210% vs a 0.290%
baseline (p=0.040), median range 1.200% vs 1.046% (p=0.068) — and **QQQ reproduces neither**
(p=0.43 / p=0.35). A single-index effect that inverts sign between gap and range and vanishes on a
correlated index is a calendar artifact. Nothing about 2026-09-24 changes that sample.

**And the session belongs to something else.** The 09-19…09-29 corridor carries **45 tracked ids**,
**11 on 09-24 itself**: `trump-xi-summit-2026-09-24` (estimate · **high**), `treasury-7y-note`
(confirmed · medium), `treasury-buyback-20y30y` (estimate · medium), `costco-q4-fy2026` ·
`new-home-sales` · `scoos` · `steel-imports-preliminary` (confirmed · low),
`dmo-pilot-switch-auction-test` · `ecb-economic-bulletin` (estimate · low), plus this entry and its
duplicate. **Zero confirmed high/critical events sit within ±5 days**, so `adjacentStrongIds` is
empty and the next pulse is screenable.

### What the conditions support

Nothing to open, on any horizon. The output is a **canonical calendar file promoted to `confirmed`**
on two BEA primaries, a **closed reconciliation limit** (the ITA's quarterly goods-and-services *is*
the monthly FT-900 sum, 15 of 16 quarters exactly), an **independently replicated** current-account
projection, a **new quantitative result** on the half of the release nobody had costed — the NIIP's
valuation term, 85% explained by two equity returns — a **refuted headline reading** with the ratio
that refutes it, **three registered predictions**, and **zero calendar proposals**.

### Honest limits

- **The NIIP model is n=16 and has never run out of sample.** LOO RMSE $390B is an honest
  cross-validation, not a track record; 2026-09-24 is its first real test, which is exactly why it
  is registered as a forward test rather than asserted. Medium confidence is doing real work.
- **The valuation term is "valuation + other," not valuation.** It is computed as
  ΔNIIP − current account, so it absorbs the capital account, the statistical discrepancy and
  other-volume changes along with price and FX revaluation. Those are small relative to $913B of
  quarterly variance, but they are in there.
- **`EFA` is a proxy for the US foreign asset stack, and an imperfect one** — developed-markets
  equity only, no emerging markets, no FDI, no debt. It works because it correlates with what the US
  actually holds, not because it *is* it.
- **The income-residual band is the current account's whole uncertainty, and it is not tight.**
  2024Q3 moved it $29B in one quarter. "±$25B" is an eight-quarter empirical range, not a confidence
  interval, and a tariff- or repatriation-driven shift in investment income would break it.
- **A ~$7B revision wedge is now measured but not modelled.** Leg 2 shows the monthly vintage can
  drift from the printed ITA after the fact; this lane did not check whether such drift is
  systematically signed.
- **No published analyst consensus exists for this release**, and none was found — the ITA is not a
  consensus-surveyed print. Every content statement here is a last-published reading or an explicit
  arithmetic projection, never a survey.
- **Leg 6's tape measurement is inherited twice over** — measured by the Q3 sibling, carried through
  the duplicate's ledger, and re-carried here. It is labelled at every hop and was not re-run.
- **This ledger does not touch the duplicate's file.** One file per owner: retiring
  `bea-international-transactions-q2-2026-09-24` is not this lane's to do, and the class is already
  filed as a bottleneck (#3101).
- **`symbols: []` and `low` are doing the real work.** Even if every measurement here were twice as
  strong, this event has no instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date `confirmed` as of this research — `BEA:`, two primaries, 2026-09-15).** Stand aside
on 2026-09-24 and on every edition of this release. Hold three frames. **On the current account:**
it is arithmetic and the arithmetic is now reconciled — expect **−$268.8B**, band **−$243.5B …
−$299.0B**, ≈3.31% of GDP, widening from Q1's −$226.8B, because Q2 goods-and-services (**−$199.8B**)
is fully published and the ITA's own quarterly series equals the monthly sum in 15 of 16 quarters.
**On the NIIP:** this is the release's only real unknown, it is ~4× larger, and it is a market-return
readout — expect **−$23.02T**, band **−$22.63T … −$23.41T**, from a valuation term of **−$1,484B**
implied by SPX +14.87% and EFA +8.64%. **On the headline it will generate:** a record in dollars is
**not** a record in the ratio (−70.9% vs 2024Q4's −74.2%), and 85% of the deterioration is US equity
outperformance — reading it as a warning about the US external position inverts the causality.
Nothing here licenses an entry, and the `confirmed` date changes only the audit trail.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The 2026-09-24 current account lands outside −$243.5B … −$299.0B.** The income residual would
  have broken its eight-quarter band and Leg 2 is re-derived rather than patched.
- **The 2026-09-24 NIIP lands outside −$22.63T … −$23.41T.** The valuation model is wrong at its
  first real test; Leg 4 is refit or abandoned, not tuned.
- **The 2026-09-24 NIIP *improves* from −$21.27T.** That is the model's sign failing, not its
  magnitude, and it would refute Leg 4 outright.
- **The end-Q2 NIIP/GDP ratio prints past −74.2%.** A genuine ratio record makes Leg 5's
  "nominal artifact" reading wrong and the level argument worth re-reading.
- **The 2026-09-24 release title contains "Annual Update."** That would put the ITA on the same
  vintage as the 09-30 NIPA update and change what the print's revisions mean.
- **The 2026-09-24 slot moves or disappears from `bea.gov/news/schedule` before 2026-09-24.** The
  date is `confirmed` on two primaries today; a move means Leg 1 is re-read and the status re-argued.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-09-24.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it live.
- **The ITA release class reproduces on QQQ at p<0.05 in any re-run before 2026-12-31.** Leg 6's
  inertness rests on that cross-index failure.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory) —
[`forward-tests/intl-transactions-q2-2026-09-24.md`](../forward-tests/intl-transactions-q2-2026-09-24.md):

- `FT-intl-transactions-q2-2026-09-24-1` — the Q2 2026 current-account deficit prints **between
  −$243.5B and −$299.0B**, point estimate **−$268.8B**, and **wider than Q1's −$226.8B**. The
  computability claim, tested directly and reconciled via `IEABCGS`. Score by 2026-09-24.
- `FT-intl-transactions-q2-2026-09-24-2` — the end-Q2 2026 NIIP prints **between −$22.63T and
  −$23.41T**, point estimate **−$23.02T**, and **worse than end-Q1's −$21.27T**. The new result:
  the valuation model's first out-of-sample run. Score by 2026-09-24.
- `FT-intl-transactions-q2-2026-09-24-3` — the end-Q2 NIIP is a **record in dollars** (past
  −$22.13T) but **not** in the ratio: NIIP/GDP stays **less negative than −74.2%**. The headline
  trap, stated so the tape can settle it. Score by 2026-09-24.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-15 | D-9 | **Initial research. Canonical file written and promoted to `confirmed`; the current-account half reconciles exactly, and the NIIP half — four times larger — is modelled for the first time.** **Leg 1 SUPPORTED** — date on two BEA primaries fetched today (`/news/schedule` 75,123 bytes, first upcoming row verbatim, the next BEA release of any kind; product page 61,775 bytes, "Next Release: September 24, 2026"). **Promoted `estimate` → `confirmed`** (`BEA:`): confirmed-tier prefix, sole-publisher release, two primaries per the `advance-services-q3-2026-11-19` bar, and no-self-confirm does not bind because another lane proposed this id and its proposal string reserved the flip for this pass. **Leg 2 SUPPORTED, and it closes the sibling's open limit** — FRED `IEABCGS` (the ITA's own quarterly G&S) equals the `BOPGSTB` monthly sum to **$0.00B in 15 of 16 quarters**; the sole exception is **2026Q1** (ITA −$165.75B vs today's monthly sum −$158.83B, wedge **−$6.92B**), a **vintage** artifact that opened after the 06-24 print, so a ~$7B revision caveat replaces the old "asserted, not reconciled" limit. Clean income residual (`IEABC`−`IEABCGS`) over 8 quarters: median **−$68.9B**, range **−$43.7B…−$99.2B**, sd $15.4B ⇒ Q2 **−$199.8B − $68.9B = −$268.8B**, **3.31% of GDP** vs Q1's 2.79%, band **−$243.5B…−$299.0B**. Independently replicates the sibling's −$268.8B. **Leg 3 MIXED** — the "no information" frame holds only for the current account: ΔNIIP's valuation term ran a **median 3.3×** the current account over 16 quarters, **sd $913B**, and **flipped the sign of the NIIP move in 5 of 16**; median \|ΔNIIP\| $614B vs \|CA\| $251B. No monthly contains an input to it. **Leg 4 REFUTES "unknowable"** — valuation ≈ **18.0 − 161.4×SPX% + 104.0×EFA%**, R² **0.849**, **LOO RMSE $390B** (n=16, 2022Q2–2026Q1); adding DXY raises in-sample R² to 0.866 but **worsens LOO to $436B** and carries the wrong sign — `EFA` is USD-denominated and already embeds FX. Q2 2026: **SPX +14.87%** (6,528.52→7,499.36), **EFA +8.64%** (95.617→103.880) ⇒ valuation **−$1,484B** ⇒ end-Q2 NIIP **−$23.02T**, band **−$22.63T…−$23.41T**. **Leg 5 REFUTED (the headline reading)** — −$23.02T is a **record in dollars** (past 2024Q4's −$22.13T, deepest of 81 quarters since 2006Q1) but **−70.9% of GDP vs 2024Q4's −74.2% record**, and **85%** of the $1,754B deterioration is valuation, i.e. foreigners' US holdings rallying — a 3rd-largest-ever quarterly move caused by the S&P gaining 14.87%. **Leg 6 REFUTED** — class inertness carried (SPY n=94, gap p=0.040 / range p=0.068, **QQQ reproduces neither**, p=0.43/0.35), and the session belongs to `trump-xi-summit-2026-09-24` (estimate, **high**) plus a confirmed 7Y note and a 20y/30y buyback. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** 09-23 flash PMIs, 09-25 durable goods + final UMich, **09-30 GDP Q2 third estimate + NIPA annual update** and the **09-30 funding deadline**, 10-06 Aug FT-900. **Volatility:** VIX **17.43** (09-15) vs **14.53** on 09-04 — **+2.90**, just under the 3-point screen threshold, after a 09-10 spike to 17.84; Q2's rally ran with VIX falling 25.25 (Mar) → 16.45 (Jun). **Geopolitical:** `trump-xi-summit-2026-09-24` (high) on the date; UNGA-81 general debate from 09-22; `unsc-iran-panel-mandate-expiry-2026-09-26`. **Event tape:** no consensus survey exists for this release; last published CA **−$226.8B** (2.9% of GDP), NIIP **−$21.27T** (assets $43.37T, liabilities $64.64T), improved from −$21.87T. **Corridor:** 45 tracked ids 09-19…09-29, 11 on 09-24 itself, **zero confirmed high/critical within ±5 days** ⇒ `adjacentStrongIds: []`, next pulse screenable. **Duplicate:** `bea-international-transactions-q2-2026-09-24` is the same release under a second slug, already self-annotated as the duplicate naming this id the survivor; class filed as #3101, and this lane does not touch that file. **No new dated event proposed** — BEA's schedule carries "Services Supplied Through Affiliates, 2024" (10-06, 10:00, Data not News) and "Activities of U.S. Multinational Enterprises, 2024" (11-20), both annual structural statistics with `symbols: []`, no nowcast channel and no playbook; proposing them would repeat the over-proposal the duplicate documents. **Three forward tests registered:** `-1` (CA in −$243.5B…−$299.0B and wider than Q1), `-2` (**NIIP in −$22.63T…−$23.41T and worse than −$21.27T** — the model's first out-of-sample run), `-3` (record in dollars, **not** in the ratio). **All fetches HTTP 200; `blocked: []`.** | **Initial stance set: stand aside, date promoted to `confirmed`. The current-account half is arithmetic and now reconciled line by line (−$268.8B ±$25B); the NIIP half is the release's only real unknown, ~4× larger, and modelable from two equity returns to −$23.02T ±$390B; and the record-dollar headline it will generate is an equity-rally readout, not a warning — −70.9% of GDP against 2024Q4's −74.2% record.** | 2026-09-22 (low, 0+ band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome`
below from re-run instrument data (cache busted first), never from memory — after which this doc
goes quiet.
