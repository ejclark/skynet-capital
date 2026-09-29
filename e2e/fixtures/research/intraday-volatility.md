# Opening & closing volatility — where the motion is, and why it isn't the money

**Question (Eric's, 2026-08-11):** _"The first 30 minutes tend to also be the most volatile part
of the day. Volatility is a double edged sword but wielding it effectively enables us to compound
interest. Research strategies exploiting volatility swings in the opening/closing periods."_

**Verdict: the premise is right, and the conclusion it points to is backwards.** The first 30
minutes is emphatically the most volatile part of the day — 2.17× the average half-hour's range,
32% of the day's volume. It is also the **only** part of the trading day with *negative* average
drift. Over 721 sessions, roughly **87% of NVDA's total return happened while the market was
closed**, and every strategy that trades the opening swing loses money after realistic costs.

Reproduce: `node scripts/research/intraday-edges.mjs NVDA --slippage 2`

---

## 1. The premise, confirmed — the open really is where the motion is

NVDA, hourly bars, 721 sessions (2023-09 → 2026-08):

| bar (ET) | mean abs move | mean range | share of day's volume |
|---|---|---|---|
| **09:30** | **1.122%** | **2.324%** | **32.0%** |
| 10:30 | 0.648% | 1.358% | 15.9% |
| 11:30 | 0.510% | 1.071% | 11.9% |
| 12:30 | 0.450% | 0.947% | 10.0% |
| 13:30 | 0.435% | 0.912% | 9.7% |
| 14:30 | 0.403% | 0.902% | 10.4% |
| 15:30 | 0.433% | 0.819% | 10.1% |

At 5-minute resolution (60 sessions — small, corroborating only), the first half-hour runs
**2.17×** the day's average range and it decays monotonically to a 14:30 trough at 0.66×, then
ticks back up into the close. Textbook U-shape, and the left arm of the U is much taller.

## 2. Where the *return* is — motion is not direction

This is the table that answers the question.

| segment | mean/session | sd | win rate | **3-year total** |
|---|---|---|---|---|
| **overnight** (prev close → open) | **+0.229%** | 1.84 | 60% | **+164.8%** |
| first hour (09:30 → 10:30) | **−0.038%** | 1.49 | 49% | **−27.5%** |
| midday (10:30 → 15:30) | +0.067% | 1.65 | 54% | +48.0% |
| final 30m (15:30 → close) | +0.006% | 0.61 | 52% | +4.5% |
| full session (open → close) | +0.037% | 2.40 | 54% | +26.6% |

**The most volatile hour of the day has negative expected return.** All the motion, none of the
drift. That is the precise definition of noise — and noise cannot be compounded, it can only be
paid for in spread.

Meanwhile the market's entire directional contribution arrives **overnight**, when nobody can
trade it: +164.8% overnight against +26.6% for every regular session combined.

**This replicates out-of-sample on every name tested** (same 721 sessions, gross):

| symbol | overnight total | full-session total | overnight share of return | first hour |
|---|---|---|---|---|
| NVDA | +164.8% | +26.6% | 87% | −27.5% |
| AMD | +166.8% | +34.6% | 84% | +23.1% |
| MRVL | +217.5% | −23.1% | >100% | −15.6% |
| QQQ | +62.8% | +8.7% | 87% | −3.8% |

This is the documented **overnight-drift ("night effect") anomaly**, and it is present in our own
data with no coaxing.

## 3. Every opening/closing strategy tested, costed

Judged against buy-and-hold on the same window (Sharpe **1.40**), net of 2bps/side:

| strategy | gross %/day | net %/day | net total | win% | Sharpe | break-even |
|---|---|---|---|---|---|---|
| **buy & hold (benchmark)** | +0.263 | +0.263 | **+189.9%** | 55% | **1.40** | — |
| hold OVERNIGHT only | +0.229 | +0.189 | +136.0% | 60% | 1.63 ✳ | **11.4 bps** |
| opening-range breakout → close | +0.089 | +0.054 | +39.1% | 46% | 0.57 | 5.1 bps |
| skip first hour, 10:30 → close | +0.073 | +0.033 | +23.7% | 55% | 0.30 | 3.6 bps |
| first-hour momentum → close | +0.055 | +0.015 | +10.6% | 51% | 0.13 | 2.7 bps |
| hold SESSION only (open→close) | +0.037 | −0.003 | −2.2% | 54% | −0.02 | 1.8 bps |
| opening-range **fade** → close | −0.089 | −0.124 | −89.6% | 41% | −1.30 | −5.1 bps |
| last-30m sign → hold overnight | −0.116 | −0.155 | −112.1% | 45% | −1.33 | −5.8 bps |

**Read the break-even column first.** It is the slippage at which each edge is exactly zero.
Opening-range breakout dies at 5.1 bps/side and its break-even is wildly unstable across
symbols (QQQ 2.0, AMD 2.6, **MRVL −0.5**) — an "edge" that changes sign by ticker is a
measurement of someone else's execution infrastructure, not a strategy.

**Two negative results are informative, not just failures.** Fading the opening range and
trading last-30m momentum into the overnight are both *strongly* negative (Sharpe −1.34, −1.33).
A reliably-wrong signal is a reliably-right signal inverted: **closing weakness precedes
overnight strength.** That is the same overnight-drift effect showing up a second way, and it is
the only thing in the closing period that carries information.

(Both are still one finding, not two independent ones — inverting a negative result costs the
same round trips it did before inverting, and the b/e columns of −5.8 and −5.1 bps say the
inverted versions clear costs by a similar thin margin. Treat them as corroboration of the
overnight effect, not as separate strategies.)

## 4. The one survivor, and the exact condition it survives under

**Overnight-only is the only strategy in the study that beats buy-and-hold risk-adjusted — and
whether it does depends entirely on execution cost.**

| slippage/side | overnight-only Sharpe | buy & hold Sharpe | verdict |
|---|---|---|---|
| 0 bps | 1.97 | 1.40 | wins decisively |
| 1 bps | 1.80 | 1.40 | wins |
| 2 bps | 1.63 | 1.40 | wins |
| 3 bps | 1.46 | 1.40 | wins, barely |
| **~3.5 bps** | **≈1.40** | **1.40** | **the crossover** |
| 5 bps | 1.11 | 1.40 | loses |

It earns 87% of the return with 62% of the daily volatility — but it pays for that 504 times a
year, and 504 × anything is how a small execution cost eats a real edge.

**This converts a strategy question into a measurement question we can actually answer.** We do
not need to guess our slippage; the paper account will tell us. Every fill we take gives us a
realized-vs-expected price, and a few dozen of them settle whether this strategy is live or dead.

### Three reasons to be careful with it anyway

1. **Sharpe is the wrong yardstick for a gap-only strategy.** Its entire exposure is overnight
   jumps, which are fat-tailed by construction — this same name gapped +26% (May 2023) and
   −19% (Nov 2018). Sharpe assumes away exactly the risk this strategy concentrates. Judge it on
   worst-gap and drawdown, not on Sharpe alone.
2. **It cannot be built on the current order path.** Harvesting the overnight move properly needs
   **market-on-close** and **market-on-open** orders. `src/alpaca/alpaca-trading-client.ts:95-96`
   hardcodes `type: "market"`, `time_in_force: "day"` — so today we would be buying *near* the
   close, not *at* it, and the difference is precisely the slippage the whole thesis hinges on.
   Same prerequisite as options: the order path has to widen first.
3. **One regime, three years.** Hourly data only reaches back to 2023-09. The overnight anomaly
   has a long literature behind it, but our measurement of it covers a single bull market.

---

## What this says to do

**Do not build an opening-volatility bot.** The volatility Eric correctly identified is real and
it is symmetric — it widens both tails and pays no drift. Trading into it converts a certain cost
(spread, 252×/yr) into an uncertain edge, which is the one trade that reliably compounds in the
wrong direction. The sword really is double-edged; the finding is that we are holding it by the
blade.

**The defensible uses of the same observation, in order:**

1. **Use opening volatility as an execution constraint, not a signal.** If the first 30 minutes
   is 2.17× normal range, that is when a market order costs the most. Any bot that fires at the
   open is paying the day's worst price for no reason. *Delay non-urgent entries past 10:00 ET* —
   a free improvement to every strategy we run, and the cheapest thing on this list.
2. **Measure our actual slippage.** It is the single input that decides overnight-only, and it
   costs nothing but instrumentation on fills we are already taking.
3. **Widen the order path (MOC/MOO).** Unlocks overnight-only and shares the prerequisite with
   the options roadmap.
4. **Then, and only then, test overnight-only in paper** with a hard gap-risk cap and no
   position held through an earnings print (see `nvda-earnings-cycle.md` F3).
