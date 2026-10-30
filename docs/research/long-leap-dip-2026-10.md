# Long LEAPs after a pullback: the contract matters, the dip does not

**Kind:** event study (price only, options modeled) · **Date:** 2026-10-30 · **Symbols:** NVDA, CRWV · **Impact:** medium
**Last assessed:** 2026-10-30

**Question (Eric, 2026-10-30):** after a steep pullback in a bearish market, is a long LEAP (12+
months to expiry) a good way to lever the recovery? NVDA and CRWV were the names he offered.
`dip-entries-nvda-crwv.md` answered this over 30 sessions and said no; this measures the year-plus
horizon the idea actually claims.

Reproduce: `node scripts/research/leap-dip-study.mjs`. Every number below is printed by it. Paper
only; educational; not investment advice.

## The call

| Name · question | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Any name · does a dip make a LEAP better? | **No measured edge. Don't size up on the dip** | medium | 30%+ off the high won 60% (ordinary days 63%); mean gap −28%..+14%, 90% interval, 25 names since 1990 | **2028-01-31**: recorded dip entries beat recorded ordinary-day entries, at real prices, by more than that interval's top |
| Any name · require a bearish market too? | **Don't gate on it** | medium | QQQ 20%+ off its high won 53%, the worst tested; it also keeps 2000–03, which lost | The same forward record shows entries with QQQ 10%+ off high beating the rest over two separate sell-offs |
| Any name · the contract | **24 months, 0.80 delta, half sold at double, rest out with 6 months left** | low | Modeled mean +83%, win 63%, lost over half 22%; 18m 0.50 lost over half 41%. It holds 18 months, others 12 | **2028-01-31**: real marks show the 0.80 losing over half as often as the 0.50 |
| NVDA · today | **Not at the line yet: fires at 15% off high, about $203** | low | $204.84 is 14% off $239.24, 0.4% over its 200-day. 16 past 30%+ entries won 56% | NVDA closes 15%+ off high and the first such entry, bought at the real quote, is under water at **2027-10-29** |
| CRWV · today | **Far past the line, but the worst lever. Wait out the print** | low | 60% off high; 90% vol makes the modeled 18m premium 41% of spot (NVDA 23%), leverage ~1.7x vs ~3.0x. The conviction's fence bars buys until 6 sessions after the ~11-10 print | CRWV's real 18-month 0.70-delta ask, read after the print, is under 30% of spot |
| Both · how much | **Size for a total loss** | medium | 22–41% of modeled entries lost over half by shape; dot-com entries 63%, 2021–23 entries 57% | Nothing dated proves this wrong. It is a risk stance |

**TL;DR.** Buying a long-dated call after a dip did about as well as buying one on any other day.
What moved the result was the contract and the exit. The era moved it most of all, and nothing here
tells you the era in advance.

**Signals & conditions:**

- **Buy signal:** a close 15%+ under the 252-session high. Chosen for simplicity, not edge; no dip rule beat ordinary days.
- **Time:** 12 months is the floor. The modeled best shape starts near 24 and is out with 6 left.
- **Print:** a bought call may hold through one, but none opens inside a blackout.

## Findings

All rows: an 18-month 0.70-delta call sold at double or after 12 months, unless the row says otherwise.

| Entry rule | Entries | Years | Stock median | LEAP mean | Won | Lost over half |
|---|---:|---:|---:|---:|---:|---:|
| Ordinary day (every 21 sessions) | 7,041 | 36 | +20% | +38% | 63% | 25% |
| 30%+ off high | 284 | 36 | +22% | +31% | 60% | 32% |
| 30%+ off high, QQQ 10%+ off high | 206 | 24 | +23% | +29% | 60% | 33% |
| 30%+ off high, QQQ 20%+ off high | 133 | 9 | +20% | +20% | 53% | 35% |
| 15–30% off high, above 200-day | 350 | 35 | +24% | +38% | 63% | 26% |
| 30%+ off high, just reclaimed 50-day | 150 | 32 | +20% | +16% | 49% | 34% |
| 50%+ off high, vol 70%+ (shaped like CRWV) | 85 | 23 | +57% | +32% | 64% | 35% |

Every gap to ordinary days has a 90% interval that includes zero or touches it (reclaimed 50-day:
−41%..+0%). Waiting for a confirmed turn did worse, not better.

**The era decides it.** Same rule, same contract: dot-com win 25%, financial crisis 52%, 2010–19
82%, covid 100%, 2021–23 43%, 2024 on 58%. The bet is really on which of these you are in.

**Contract and exit,** on the 206 entries with QQQ 10%+ off high:

| Shape | LEAP mean | Won | Lost over half |
|---|---:|---:|---:|
| 18m 0.50, sold at 2x | +25% | 55% | 41% |
| 18m 0.70, sold at 2x | +29% | 60% | 33% |
| 18m 0.70, no take-profit | +86% | 53% | 37% |
| 18m 0.70, half at 2x, rest runs | +58% | 60% | 33% |
| 18m 0.80, half at 2x, rest runs | +55% | 62% | 27% |
| 24m 0.80, sold at 2x | +40% | 63% | 22% |
| 24m 0.80, half at 2x, rest runs | +83% | 63% | 22% |

The stock itself returned a mean +39% on the same entries, so selling everything at double gave up
more than the lever added. Double arrived on 51% of entries, median 68 sessions in, and that early
cash could be put back to work, which this table does not count. Means are not annualized.

## What this cannot say

- **No real LEAP prices.** Implied vol is a realized-vol proxy. At 0.8x and 1.25x the proxy the
  reference shape's mean runs +37% to +18%. After a crash the proxy may overprice long-dated vol.
- **Survivorship.** No delisted name is in the set. Today's winners won 66% on the trigger; names
  that fell and stayed down won 55%. A CRWV that fails is the case this sample lacks.
- **CRWV has no sample.** 401 sessions, no completed year-plus history after a drop this size, and
  about $50B of debt, which the analogs do not capture.
- **Today's bar** was read on 2026-10-30 and may be a partial session.
