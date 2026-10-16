# Dry powder on history: a 30% holding band buys AI pullbacks and costs a quarter of the trend

**Kind:** backtest (price + T-bill yield) · **Date:** 2026-10-16 · **Symbols:** NVDA, CRWV, AMD, MU, AVGO, NBIS · **Impact:** high
**Last assessed:** 2026-10-16

**Question (Eric, 2026-10-16, on [#5483](https://github.com/ejclark/skynet-capital/issues/5483)):**
_"playbook strategies should be regulating the portfolio to have cash to invest or capital to
reallocate in these scenarios where there is significant pullback. This requires a balanced
portfolio."_ Shape A of that plan keeps a holding share (cash at the T-bill rate) beside the
active book and moves money back whenever the mix drifts past a band. No forecast. This is slice 1,
"the backtest": what that band earned, what it cost, and which target and band to ship.

Reproduce: `node scripts/research/rebalance-band.mjs`. Paper only; educational.

## The call

| Question | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Default to ship | **30% holding, ±5-point band:** buys after a ~20% fall, trims after a ~29% rise | low | The only width that fires on ordinary AI pullbacks; max drawdown −85% → −71% (NVDA), −55% → −42% (basket) | Re-run **2027-10-15** on the five-name basket from 2026-10-16: band drawdown deeper than 0.85× buy and hold's |
| What it costs | **A quarter to a third of a melt-up's gain.** Insurance, not a return engine | high | Trailed buy and hold by 8.7 pts/yr (NVDA since 2005), 10.8 (basket since 2009), 33.6 (NVDA since 2023) | The band beats buy and hold on the five-name basket to **2027-10-15** while the basket gains > 30% |
| Rebalancing bonus | **Real, small, beaten by the trend.** Never sell it as extra return | medium | Harvest +2 to +7 pts/yr on NVDA and the baskets, yet it lost to not rebalancing on all of them; won on CRWV (+14) | The **2027-10-15** re-run shows a negative harvest at 30%/±5 on NVDA since 2005 |
| Is a band buy a bottom? | **No. Never size up on one** | medium | 18 of 46 buys sat within 5% of the local trough (39%) vs a 14% base rate; 28 did not | Of the first 8 live band buys (first check **2027-04-16**), fewer than 2 within 5% of the trough |
| Signal and gate | **Signal at the band (±5), gate at ±10,** not amendment 3's ±10 / ±20 | medium | A working daily band never drifted past 9.1 points: past ±10, the rebalancer has stopped | An acting rebalancer drifts past ±10 on a < 15% session, before **2027-01-15** |
| Run it first on | **The CRWV books,** the one name where the band beat holding everything | low | 41.0% a year vs 36.3%; drawdown −49% vs −67%. One path, 1.6 years | CRWV re-run **2027-04-16**: the 30%/±5 book trails CRWV buy and hold since listing |

**TL;DR.** Ship 30% holding with a ±5-point band. It deploys cash after a 20% fall, cut max
drawdowns by a sixth to a quarter, and cost a quarter to a third of the trend. It is not extra
return, and a band buy is not the bottom.

**Signals & conditions:**

- **Buy signal:** no. A band buy restores the mix; it licenses no new long.
- Holding is the dial: each 10 points cost about 3–4 pts a year and saved 4–6 pts of drawdown.
- ±10 earned under 1 pt a year more but buys only after a 36% fall (6 in 22 NVDA years).
- Survivorship: the basket is the AI trade's winners; the trend cost reads high.

---

## 1. What was run

**The rule.** An account holds a target share in holding and the rest active. After each close the
active share is read; when it has drifted more than the band from its target, the whole account
moves back to target at that close. A rally past the band trims into holding; a fall past the band
deploys holding into the stock.

**Three books per sample, so each effect is measured against the right comparison:**

| Book | What it is | What the band minus it measures |
|---|---|---|
| Buy and hold | 100% active, never touched | the **trend cost**: what keeping a reserve gave up |
| Static mix | the same starting split, never rebalanced | the **bonus vs not rebalancing**: what moving back added, with the cash rate and split held equal |
| Weighted parts | (1 + stock growth)^active × (1 + cash growth)^holding | the **harvest** (Shannon's demon, measured as Booth and Fama do): what rebalancing earned over its ingredients' average |

**The holding rate (stated).** Holding earns each day's 13-week T-bill yield (Yahoo `^IRX`),
compounded over calendar days: a mean of 1.77% since 2005, 4.47% since 2023. Section 4 reruns at 0%.

**Costs and fills.** Each move pays 5 bps of the amount moved, out of holding. Moves fill at the
close that tripped them (a daily cycle is the nearest analog to the bot's own cycle).

**Samples.** NVDA since 2005 and since 2023; CRWV since listing (2025-03-28); the AI basket (NVDA,
AMD, MU, AVGO, equal weight at the start, never rebalanced inside) from AVGO's 2009 listing and from
2023; the same basket with NBIS from its 2024-10-21 relisting. Adjusted closes (dividends and
splits), through 2026-10-16 mid-session.

**Measures.** CAGR; max drawdown; the share of sessions at least 10% under the book's prior high;
the longest stretch underwater (sessions from a high until a close regains it); moves a year; and
**timing**: a buy counts as near a trough when its close is within 5% of the lowest close in the 21
sessions either side (a sell, within 5% of the highest). The base rate is the share of all sessions
that pass the same test. Only moves with a full 21-session window either side are judged.

## 2. What a band means in price

A band is set in points of active share, so the same ±10 trips at a different price on a 70% active
book than on an 80% one. These are the moves from the last rebalance that trip each band (holding's
interest ignored).

| Holding · band | Buys into the stock after a fall of | Trims to holding after a rise of |
|---|---|---|
| 20% · ±5 | 25% | 42% |
| 20% · ±10 | 42% | 125% |
| 20% · ±15 | 54% | 375% |
| 30% · ±5 | 20% | 29% |
| 30% · ±10 | 36% | 71% |
| 30% · ±15 | 48% | 143% |
| 40% · ±5 | 19% | 24% |
| 40% · ±10 | 33% | 56% |
| 40% · ±15 | 45% | 100% |

## 3. Results by sample

Every number below is the script's own output (`--json` carries the same figures). Bonus,
harvest and trend cost are in CAGR points a year.

### NVDA since 2005: NVDA · 2005-01-03 → 2026-10-16 · 21.8 years

Holding earns the daily 13-week T-bill yield (mean 1.77%); each move pays 5 bps of the amount moved. Buy and hold: CAGR 38.5%, max drawdown −85%, ≥10% under its high 64% of sessions, longest underwater 2137 sessions.

| Holding · band | CAGR | Harvest | Bonus vs static mix | Trend cost vs buy and hold | Max drawdown | ≥10% under | Longest underwater | Moves / year | Buys near a trough | Sells near a peak |
|---|---|---|---|---|---|---|---|---|---|---|
| 20% · ±5 | 33.1% | +2.9 | −4.0 | +5.4 | −77% | 58% | 2028 | 2.2 | 5/16 (31%) | 10/32 (31%) |
| 20% · ±10 | 33.8% | +3.6 | −3.2 | +4.6 | −78% | 60% | 2017 | 0.6 | 2/4 (50%) | 2/10 (20%) |
| 20% · ±15 | 34.5% | +4.3 | −2.5 | +3.9 | −80% | 61% | 2137 | 0.2 | 1/1 (100%) | 0/4 (0%) |
| 30% · ±5 | 29.7% | +3.5 | −6.5 | +8.7 | −71% | 54% | 2011 | 3.7 | 10/28 (36%) | 20/52 (38%) |
| 30% · ±10 | 30.4% | +4.1 | −5.8 | +8.1 | −71% | 56% | 2017 | 1.1 | 0/6 (0%) | 3/17 (18%) |
| 30% · ±15 | 30.7% | +4.5 | −5.5 | +7.7 | −72% | 57% | 2044 | 0.5 | 0/2 (0%) | 3/8 (38%) |
| 40% · ±5 | 25.9% | +3.5 | −9.3 | +12.5 | −66% | 50% | 2005 | 4.3 | 10/32 (31%) | 18/61 (30%) |
| 40% · ±10 | 26.8% | +4.4 | −8.4 | +11.6 | −64% | 51% | 2005 | 1.4 | 3/8 (38%) | 9/23 (39%) |
| 40% · ±15 | 27.2% | +4.8 | −8.0 | +11.2 | −63% | 51% | 1160 | 0.7 | 1/3 (33%) | 2/12 (17%) |

Base rate, any session: 16% sit within 5% of their ±21-session trough, 21% within 5% of the peak.

Rolling one-year windows (252 sessions, stepped 21; overlapping, so not independent):

| Holding · band | Windows | Bonus, median | Bonus, p25 | Bonus > 0 | Trend cost, median |
|---|---|---|---|---|---|
| 20% · ±5 | 250 | −0.0 | −2.7 | 34% | +7.3 |
| 20% · ±10 | 250 | +0.0 | +0.0 | 16% | +7.5 |
| 20% · ±15 | 250 | +0.0 | +0.0 | 2% | +8.0 |
| 30% · ±5 | 250 | −0.1 | −3.6 | 42% | +11.3 |
| 30% · ±10 | 250 | +0.0 | −2.7 | 26% | +11.4 |
| 30% · ±15 | 250 | +0.0 | +0.0 | 12% | +11.8 |
| 40% · ±5 | 250 | −0.1 | −3.9 | 46% | +15.2 |
| 40% · ±10 | 250 | +0.0 | −4.0 | 32% | +14.7 |
| 40% · ±15 | 250 | +0.0 | −0.9 | 17% | +15.4 |

### NVDA since 2023: NVDA · 2023-01-03 → 2026-10-16 · 3.8 years

Holding earns the daily 13-week T-bill yield (mean 4.47%); each move pays 5 bps of the amount moved. Buy and hold: CAGR 104.8%, max drawdown −37%, ≥10% under its high 29% of sessions, longest underwater 120 sessions.

| Holding · band | CAGR | Harvest | Bonus vs static mix | Trend cost vs buy and hold | Max drawdown | ≥10% under | Longest underwater | Moves / year | Buys near a trough | Sells near a peak |
|---|---|---|---|---|---|---|---|---|---|---|
| 20% · ±5 | 83.9% | +4.9 | −10.1 | +20.9 | −30% | 19% | 120 | 2.9 | 1/2 (50%) | 4/8 (50%) |
| 20% · ±10 | 86.6% | +7.6 | −7.5 | +18.2 | −32% | 22% | 120 | 0.8 | – | 2/3 (67%) |
| 20% · ±15 | 88.9% | +9.9 | −5.2 | +15.9 | −33% | 25% | 120 | 0.3 | – | 0/1 (0%) |
| 30% · ±5 | 71.2% | +3.9 | −16.8 | +33.6 | −27% | 14% | 118 | 2.9 | 1/1 (100%) | 2/9 (22%) |
| 30% · ±10 | 75.5% | +8.2 | −12.5 | +29.3 | −25% | 16% | 120 | 1.6 | 1/1 (100%) | 2/5 (40%) |
| 30% · ±15 | 76.6% | +9.3 | −11.4 | +28.2 | −28% | 18% | 120 | 0.5 | – | 0/2 (0%) |
| 40% · ±5 | 61.1% | +4.7 | −20.2 | +43.7 | −23% | 10% | 120 | 4.5 | 2/3 (67%) | 4/13 (31%) |
| 40% · ±10 | 62.0% | +5.6 | −19.3 | +42.8 | −25% | 11% | 120 | 1.3 | – | 0/5 (0%) |
| 40% · ±15 | 64.4% | +8.0 | −16.9 | +40.4 | −23% | 13% | 120 | 0.8 | – | 0/3 (0%) |

Base rate, any session: 12% sit within 5% of their ±21-session trough, 20% within 5% of the peak.

Rolling one-year windows (252 sessions, stepped 21; overlapping, so not independent):

| Holding · band | Windows | Bonus, median | Bonus, p25 | Bonus > 0 | Trend cost, median |
|---|---|---|---|---|---|
| 20% · ±5 | 34 | −1.1 | −10.1 | 32% | +15.0 |
| 20% · ±10 | 34 | +0.0 | −5.1 | 6% | +13.8 |
| 20% · ±15 | 34 | +0.0 | +0.0 | 0% | +13.8 |
| 30% · ±5 | 34 | −0.5 | −14.3 | 38% | +21.6 |
| 30% · ±10 | 34 | +0.0 | −10.1 | 12% | +20.4 |
| 30% · ±15 | 34 | +0.0 | −3.9 | 6% | +20.7 |
| 40% · ±5 | 34 | −0.7 | −16.6 | 44% | +28.1 |
| 40% · ±10 | 34 | −0.8 | −14.0 | 24% | +28.4 |
| 40% · ±15 | 34 | +0.0 | −10.2 | 6% | +27.0 |

### CRWV since listing: CRWV · 2025-03-28 → 2026-10-16 · 1.6 years

Holding earns the daily 13-week T-bill yield (mean 3.84%); each move pays 5 bps of the amount moved. Buy and hold: CAGR 36.3%, max drawdown −67%, ≥10% under its high 92% of sessions, longest underwater 333 sessions.

| Holding · band | CAGR | Harvest | Bonus vs static mix | Trend cost vs buy and hold | Max drawdown | ≥10% under | Longest underwater | Moves / year | Buys near a trough | Sells near a peak |
|---|---|---|---|---|---|---|---|---|---|---|
| 20% · ±5 | 40.7% | +11.5 | +10.5 | −4.3 | −56% | 91% | 333 | 7.7 | 1/4 (25%) | 0/5 (0%) |
| 20% · ±10 | 37.4% | +8.3 | +7.2 | −1.1 | −58% | 91% | 333 | 1.3 | 1/1 (100%) | 0/1 (0%) |
| 20% · ±15 | 30.2% | +1.1 | +0.0 | +6.1 | −63% | 91% | 333 | 0.0 | – | – |
| 30% · ±5 | 41.0% | +15.4 | +14.0 | −4.7 | −49% | 90% | 333 | 13.5 | 1/8 (13%) | 0/10 (0%) |
| 30% · ±10 | 42.2% | +16.5 | +15.1 | −5.8 | −51% | 90% | 333 | 3.9 | 1/2 (50%) | 1/3 (33%) |
| 30% · ±15 | 35.9% | +10.2 | +8.8 | +0.5 | −53% | 91% | 333 | 0.6 | – | 0/1 (0%) |
| 40% · ±5 | 37.8% | +15.5 | +13.9 | −1.5 | −43% | 88% | 333 | 16.1 | 1/10 (10%) | 1/12 (8%) |
| 40% · ±10 | 41.9% | +19.6 | +18.0 | −5.6 | −43% | 87% | 333 | 5.8 | 1/4 (25%) | 1/5 (20%) |
| 40% · ±15 | 39.3% | +17.0 | +15.4 | −3.0 | −43% | 87% | 333 | 1.9 | 0/1 (0%) | 1/2 (50%) |

Base rate, any session: 4% sit within 5% of their ±21-session trough, 6% within 5% of the peak.

Rolling one-year windows (252 sessions, stepped 21; overlapping, so not independent):

| Holding · band | Windows | Bonus, median | Bonus, p25 | Bonus > 0 | Trend cost, median |
|---|---|---|---|---|---|
| 20% · ±5 | 7 | +4.1 | +3.7 | 100% | −8.4 |
| 20% · ±10 | 7 | +1.5 | +0.1 | 71% | −7.0 |
| 20% · ±15 | 7 | +0.0 | +0.0 | 14% | −4.3 |
| 30% · ±5 | 7 | +6.2 | +6.1 | 100% | −12.7 |
| 30% · ±10 | 7 | +5.9 | +4.6 | 100% | −13.9 |
| 30% · ±15 | 7 | +0.0 | +0.0 | 43% | −6.5 |
| 40% · ±5 | 7 | +7.9 | +5.9 | 100% | −18.4 |
| 40% · ±10 | 7 | +9.5 | +8.0 | 100% | −18.0 |
| 40% · ±15 | 7 | +1.2 | +0.0 | 57% | −8.7 |

### AI basket since 2009: NVDA, AMD, MU, AVGO · 2009-08-06 → 2026-10-16 · 17.2 years

Holding earns the daily 13-week T-bill yield (mean 1.45%); each move pays 5 bps of the amount moved. Buy and hold: CAGR 39.9%, max drawdown −55%, ≥10% under its high 44% of sessions, longest underwater 701 sessions.

| Holding · band | CAGR | Harvest | Bonus vs static mix | Trend cost vs buy and hold | Max drawdown | ≥10% under | Longest underwater | Moves / year | Buys near a trough | Sells near a peak |
|---|---|---|---|---|---|---|---|---|---|---|
| 20% · ±5 | 33.2% | +2.0 | −4.9 | +6.7 | −46% | 38% | 697 | 1.6 | 1/7 (14%) | 9/21 (43%) |
| 20% · ±10 | 33.5% | +2.3 | −4.6 | +6.4 | −48% | 40% | 701 | 0.3 | – | 5/6 (83%) |
| 20% · ±15 | 34.8% | +3.6 | −3.3 | +5.1 | −49% | 41% | 701 | 0.2 | – | 1/3 (33%) |
| 30% · ±5 | 29.1% | +2.1 | −7.9 | +10.8 | −42% | 34% | 688 | 2.4 | 7/10 (70%) | 9/31 (29%) |
| 30% · ±10 | 30.0% | +2.9 | −7.1 | +10.0 | −43% | 36% | 660 | 0.8 | 1/2 (50%) | 6/12 (50%) |
| 30% · ±15 | 30.3% | +3.3 | −6.7 | +9.6 | −42% | 38% | 701 | 0.3 | – | 2/6 (33%) |
| 40% · ±5 | 25.4% | +2.3 | −10.5 | +14.5 | −36% | 28% | 659 | 3.1 | 5/15 (33%) | 16/39 (41%) |
| 40% · ±10 | 25.7% | +2.7 | −10.1 | +14.2 | −37% | 32% | 701 | 0.9 | 1/2 (50%) | 6/14 (43%) |
| 40% · ±15 | 26.8% | +3.8 | −9.0 | +13.1 | −37% | 32% | 647 | 0.5 | 1/1 (100%) | 5/8 (63%) |

Base rate, any session: 17% sit within 5% of their ±21-session trough, 26% within 5% of the peak.

Rolling one-year windows (252 sessions, stepped 21; overlapping, so not independent):

| Holding · band | Windows | Bonus, median | Bonus, p25 | Bonus > 0 | Trend cost, median |
|---|---|---|---|---|---|
| 20% · ±5 | 195 | +0.0 | −1.5 | 38% | +7.5 |
| 20% · ±10 | 195 | +0.0 | +0.0 | 4% | +8.3 |
| 20% · ±15 | 195 | +0.0 | +0.0 | 0% | +8.3 |
| 30% · ±5 | 195 | +0.0 | −2.2 | 48% | +12.0 |
| 30% · ±10 | 195 | +0.0 | −0.6 | 13% | +12.3 |
| 30% · ±15 | 195 | +0.0 | +0.0 | 4% | +12.5 |
| 40% · ±5 | 195 | −0.2 | −3.0 | 46% | +16.2 |
| 40% · ±10 | 195 | +0.0 | −2.0 | 22% | +15.6 |
| 40% · ±15 | 195 | +0.0 | +0.0 | 5% | +16.7 |

### AI basket since 2023: NVDA, AMD, MU, AVGO · 2023-01-03 → 2026-10-16 · 3.8 years

Holding earns the daily 13-week T-bill yield (mean 4.47%); each move pays 5 bps of the amount moved. Buy and hold: CAGR 92.5%, max drawdown −37%, ≥10% under its high 21% of sessions, longest underwater 98 sessions.

| Holding · band | CAGR | Harvest | Bonus vs static mix | Trend cost vs buy and hold | Max drawdown | ≥10% under | Longest underwater | Moves / year | Buys near a trough | Sells near a peak |
|---|---|---|---|---|---|---|---|---|---|---|
| 20% · ±5 | 74.0% | +3.6 | −8.7 | +18.5 | −31% | 14% | 95 | 2.1 | 1/1 (100%) | 3/7 (43%) |
| 20% · ±10 | 76.6% | +6.3 | −6.0 | +15.9 | −32% | 15% | 98 | 0.8 | – | 2/3 (67%) |
| 20% · ±15 | 78.6% | +8.2 | −4.1 | +13.9 | −35% | 18% | 98 | 0.3 | – | 0/1 (0%) |
| 30% · ±5 | 64.9% | +4.6 | −12.2 | +27.6 | −27% | 11% | 90 | 4.0 | 2/3 (67%) | 4/11 (36%) |
| 30% · ±10 | 65.7% | +5.4 | −11.5 | +26.9 | −28% | 12% | 98 | 1.1 | – | 0/4 (0%) |
| 30% · ±15 | 67.8% | +7.5 | −9.4 | +24.7 | −29% | 13% | 98 | 0.5 | – | 0/2 (0%) |
| 40% · ±5 | 54.2% | +3.4 | −16.9 | +38.3 | −23% | 8% | 90 | 3.7 | 1/2 (50%) | 3/11 (27%) |
| 40% · ±10 | 57.6% | +6.9 | −13.4 | +34.9 | −22% | 8% | 85 | 1.9 | 1/1 (100%) | 2/6 (33%) |
| 40% · ±15 | 57.7% | +7.0 | −13.3 | +34.8 | −22% | 9% | 91 | 0.8 | – | 1/3 (33%) |

Base rate, any session: 12% sit within 5% of their ±21-session trough, 22% within 5% of the peak.

Rolling one-year windows (252 sessions, stepped 21; overlapping, so not independent):

| Holding · band | Windows | Bonus, median | Bonus, p25 | Bonus > 0 | Trend cost, median |
|---|---|---|---|---|---|
| 20% · ±5 | 34 | −2.3 | −4.0 | 29% | +21.3 |
| 20% · ±10 | 34 | +0.0 | +0.0 | 24% | +18.8 |
| 20% · ±15 | 34 | +0.0 | +0.0 | 0% | +19.5 |
| 30% · ±5 | 34 | −2.8 | −6.2 | 35% | +32.2 |
| 30% · ±10 | 34 | −1.8 | −3.5 | 15% | +31.0 |
| 30% · ±15 | 34 | +0.0 | +0.0 | 6% | +29.2 |
| 40% · ±5 | 34 | −4.1 | −7.9 | 26% | +43.2 |
| 40% · ±10 | 34 | −3.3 | −4.8 | 15% | +42.2 |
| 40% · ±15 | 34 | +0.0 | −1.4 | 15% | +38.6 |

### AI basket + NBIS since 2024: NVDA, AMD, MU, AVGO, NBIS · 2024-10-21 → 2026-10-16 · 2.0 years

Holding earns the daily 13-week T-bill yield (mean 3.94%); each move pays 5 bps of the amount moved. Buy and hold: CAGR 117.2%, max drawdown −43%, ≥10% under its high 41% of sessions, longest underwater 82 sessions.

| Holding · band | CAGR | Harvest | Bonus vs static mix | Trend cost vs buy and hold | Max drawdown | ≥10% under | Longest underwater | Moves / year | Buys near a trough | Sells near a peak |
|---|---|---|---|---|---|---|---|---|---|---|
| 20% · ±5 | 93.1% | +5.7 | −6.6 | +24.1 | −36% | 34% | 82 | 3.0 | 1/1 (100%) | 0/5 (0%) |
| 20% · ±10 | 97.7% | +10.3 | −1.9 | +19.4 | −36% | 33% | 82 | 1.0 | – | 0/2 (0%) |
| 20% · ±15 | 101.5% | +14.0 | +1.8 | +15.7 | −36% | 36% | 82 | 0.5 | – | 0/1 (0%) |
| 30% · ±5 | 80.6% | +6.5 | −9.8 | +36.6 | −32% | 29% | 82 | 4.5 | 0/2 (0%) | 0/7 (0%) |
| 30% · ±10 | 82.3% | +8.2 | −8.0 | +34.8 | −32% | 31% | 82 | 1.5 | – | 0/3 (0%) |
| 30% · ±15 | 88.5% | +14.4 | −1.8 | +28.6 | −32% | 29% | 82 | 1.0 | – | 1/2 (50%) |
| 40% · ±5 | 70.3% | +8.6 | −10.2 | +46.8 | −27% | 23% | 82 | 7.1 | 0/3 (0%) | 3/10 (30%) |
| 40% · ±10 | 68.4% | +6.6 | −12.1 | +48.8 | −28% | 25% | 82 | 1.5 | – | 1/3 (33%) |
| 40% · ±15 | 71.5% | +9.8 | −9.0 | +45.7 | −28% | 26% | 82 | 1.0 | – | 0/2 (0%) |

Base rate, any session: 5% sit within 5% of their ±21-session trough, 8% within 5% of the peak.

Rolling one-year windows (252 sessions, stepped 21; overlapping, so not independent):

| Holding · band | Windows | Bonus, median | Bonus, p25 | Bonus > 0 | Trend cost, median |
|---|---|---|---|---|---|
| 20% · ±5 | 12 | −6.9 | −17.0 | 0% | +40.7 |
| 20% · ±10 | 12 | −3.0 | −10.0 | 25% | +36.8 |
| 20% · ±15 | 12 | +0.0 | +0.0 | 0% | +33.8 |
| 30% · ±5 | 12 | −7.7 | −18.2 | 8% | +58.5 |
| 30% · ±10 | 12 | −8.3 | −17.5 | 8% | +59.0 |
| 30% · ±15 | 12 | −1.6 | −11.6 | 42% | +51.9 |
| 40% · ±5 | 12 | −11.1 | −23.3 | 17% | +78.2 |
| 40% · ±10 | 12 | −10.1 | −20.7 | 17% | +77.9 |
| 40% · ±15 | 12 | −5.5 | −15.3 | 0% | +75.2 |

## 3a. Timing, pooled

**How to read the timing columns.** CRWV and the NBIS basket have low base rates (4–8%) because
they spent most of the window far from any local low; NVDA and the long basket sit near 12–17%.
Pooled across the three samples that are not windows of one another, the band's buys beat the base
rate at every ±5 setting, and its sells beat it at every setting but one:

| Holding · band | Buys near a trough | Base rate those buys faced | Sells near a peak | Base rate those sells faced |
|---|---|---|---|---|
| 20% · ±5 | 7/27 (26%) | 15% | 19/58 (33%) | 22% |
| 20% · ±10 | 3/5 (60%) | 14% | 7/17 (41%) | 22% |
| 20% · ±15 | 1/1 (100%) | 16% | 1/7 (14%) | 23% |
| 30% · ±5 | 18/46 (39%) | 14% | 29/93 (31%) | 21% |
| 30% · ±10 | 2/10 (20%) | 14% | 10/32 (31%) | 22% |
| 30% · ±15 | 0/2 (0%) | 16% | 5/15 (33%) | 22% |
| 40% · ±5 | 16/57 (28%) | 14% | 35/112 (31%) | 21% |
| 40% · ±10 | 5/14 (36%) | 13% | 16/42 (38%) | 21% |
| 40% · ±15 | 2/5 (40%) | 14% | 8/22 (36%) | 22% |

## 4. Sensitivity: the holding rate and the cost

The 30% / ±5 row, rerun with holding earning nothing and with moves costing five times as much.
Fills move slightly between runs (a cost changes the book, so the next trigger lands on a different
close), which is itself a reading of how path-dependent one sample is.

| Sample | Base run (T-bill, 5 bps) | Holding at 0% | Moves at 25 bps |
|---|---|---|---|
| NVDA since 2005 | 29.7% · −71% | 29.0% · −72% | 29.6% · −71% |
| NVDA since 2023 | 71.2% · −27% | 69.2% · −27% | 70.5% · −27% |
| CRWV since listing | 41.0% · −49% | 40.3% · −49% | 40.8% · −49% |
| AI basket since 2009 | 29.1% · −42% | 28.9% · −42% | 29.1% · −42% |
| Pooled buys near a trough | 18/46 (39%) | 16/48 (33%) | 16/45 (36%) |

_CAGR · max drawdown._ The T-bill rate is worth 0.2–2 pts a year (the most since 2023, when bills
paid 4–5%); the cost hardly matters at 2–4 moves a year. The trough hit rate holds at 33–39%
against a 14% base in every run.

## 5. What this sets for the plan's next slices

| Plan item | Reading from this backtest |
|---|---|
| Criterion 1 (holding target and band) | Default **30% holding, ±5 points**; none set = today's behaviour |
| Amendment 3 (signal / gate) | Signal at the band (±5): record, notify, rebalance. Gate at ±10: a daily band never got there, so crossing it means the rebalancer stopped acting |
| Amendment 6 (lean) | Lean range **20–40%** holding, centred on 30%: the tested range, with a peak reading at 40% and a trough reading at 20% |
| Criterion 6 (put collateral is holding) | The trend cost here assumes holding earns only T-bills. A wheel's put collateral earns premium as well, so the real cost of a 30% reserve is lower than these tables show; slice 3 measures it |
| Step 3 of #5494 (observe-only on one bot) | Start on the bot that runs CRWV-WHEEL and CRWV-LONG-CALL: the one book where the band paid outright, and where a ±5 band fired 13 times a year |
| Open question 1 | Answered: 30% / ±5, from the numbers above, with its falsifiers in the call sheet |

**Why ±5, when ±10 earned slightly more.** On the long samples ±10 beat ±5 by under a point a year
and tied it on drawdown, because it trades a third as often and trims winners less. But at 30%
holding it buys only after a 36% fall: 6 buys in 22 years of NVDA, one in the 2023–26 run. The
plan's purpose is cash that gets used in a pullback, and a 20% fall is the pullback this basket has
most years. ±5 does that job for under a point a year, and its buys were timed better (39% near the
trough against 20% for ±10). ±15 almost never fires (0.2–0.7 moves a year): it is a static mix
with extra steps.

## 6. Limits

- **Survivorship.** NVDA, AMD, MU and AVGO are chosen with hindsight: they are the winners of the AI
  trade. Buy and hold looks strong because of who was picked. CRWV, the one name without decades of
  hindsight, is the one where the band won. Forward, the trend cost is probably lower than shown.
- **The stock stands in for the active book.** The app's active capital runs puts, wheels and long
  calls, not shares. No option-price history exists offline, so the overlay's own return is not here.
- **One path per sample.** The rolling one-year tables help, but their windows overlap (stepped 21
  sessions over 252) and are not independent. CRWV (1.6 years) and the NBIS basket (2.0) are short.
- **Close fills, no slippage beyond the stated cost, no taxes.** A real cycle reads intraday; a gap
  through the band fills at the gap, which is how drift reached 9.1 points on a ±5 band.
- **`^IRX` is a discount yield,** slightly under a bill's investment yield. The difference is
  inside the 0% sensitivity run.
- **One asset per book.** An account carries several playbooks; the basket rows are the nearest
  analog to that, and they rebalance the basket as a whole, not each name.

## 7. Builder appendix

- `scripts/research/rebalance-band.mjs`: the CLI. Flags: `--cash=irx|<annual rate>` (default
  `irx`), `--cost=<bps>` (default 5), `--json=<path>` for every number per sample and configuration.
- `scripts/research/rebalance-band-math.mjs`: the pure rules (`simulate`, `triggerMoves`, `harvest`,
  `timing`, `drawdownProfile`, `cashGrowth`, `basketIndex`), specified in
  `tests/research/rebalance-band-math.spec.ts`.
- Bars and `^IRX` come from `scripts/research/market-data.mjs`'s cached Yahoo fetch
  (`node_modules/.cache/earnings-cycle/`).
- Not in this slice: amendment 1's post-print call-entry test (D+1 vs D+6 vs bleed-ended, CRWV and
  NVDA); it is logged on #5483's state block as the remaining slice-1 item.
