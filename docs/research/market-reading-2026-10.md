# Market reading: a bull-vs-bear score tells you how deep the next dip can go, not which way the market goes

**Kind:** research instrument (price + VIX history) · **Date:** 2026-10-16 · **Symbols:** SPY, QQQ, ^VIX, ^VIX3M, nine SPDR sector funds · **Impact:** high
**Last assessed:** 2026-10-16

**Question (Eric, [#5154](https://github.com/ejclark/skynet-capital/issues/5154) round 0, 2026-10-16; plan [#5496](https://github.com/ejclark/skynet-capital/issues/5496)):**
_"visual feedback that provides temperature of bull vs bear across a spectrum of time"_, because it
_"helps prevent dumb playbook executions when market conditions are bad"_, and _"I would like to
forecast market sentiment"_. This study builds that reading as a research instrument, then checks
it against history: what each reading led to over the next 21 sessions. Nothing is wired live.

Reproduce: `node scripts/research/market-reading.mjs` (add `--json=<file>` for the daily history).
Paper only; educational.

## The call

| Question | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| The reading on 10-16 | **Leaning bull, +30 and sliding** (+80 on 10-13, +50 at 10-15's close). No playbook narrows on it | high | Trend still up on SPY and QQQ; VIX jumped 16.5 → 20.4, so the VIX level and term votes went neutral; 4 of 9 sectors sit above their 50-day | SPY's lowest close by **2026-11-16** (21 sessions) is 6.7% or more under 10-16's last price (the 15:00 ET read, not a close): the leaning-bull 1-in-10 tail |
| What a reading predicts | **The size of the next dip, not its direction** | high | After a bear reading SPY dipped 5% or more within 21 sessions 42% of the time, against 11% after bull; yet the median return after bear was not lower: +3.9% vs +0.6% per episode, +1.5% vs +1.2% per session (up in 58% of windows vs 66%, so direction does not sort) | The **2027-10-15** re-run, with the new year added, shows bear's 5%-dip odds under twice bull's |
| Inform or gate? | **Inform and narrow; never block an entry on direction.** A reading may only narrow a playbook, as a conviction does (#5482) | medium | A hard stand-aside at bear would have skipped entries whose median return was no worse than bull's (bear: +3.9% per episode, +1.5% per session; 58% up). What the reading should change is size and strike distance on sold premium, the side a dip hurts | The **2027-10-15** re-run shows bear's median 21-session SPY return below zero per episode: then a direction gate earns its place |
| Signal and gate levels (#5483 amendment 3) | **Signal at leaning bear (−20 or lower); gate at bear (−60 or lower), observe-only first** | low | −20 is where the 5%-dip odds double (11% → 28%); −60 is where they quadruple (42%). The gate would halve new short-premium size; it logs what it would have narrowed until scored, like S1-NVDA's `mixedSignals: observe` dial | Of the first 30 shadow gate hits, or by **2027-04-16**, the entries it would have narrowed finish their 21 sessions no worse than that playbook's other entries |
| Which inputs | **All five votes stay; the house call mix stays out of the score** | high | Every vote alone sorts the tail the same way (bear vote: 27–40% 5%-dip odds; bull vote: 12–15%). The call mix read 88–100% stand-aside every week since 08-24 while the score ranged 52 to 92 | By **2026-12-31** the weekly stand-aside share moves 20 points or more between weeks: then test it as a sixth vote |
| Drawing it on Events | **Draw the 5-session mean, not the daily label** | medium | The three middle readings last a median 2 sessions day to day, so a daily strip flickers; the 5-session mean lifts that to 4–5 and bull runs from 5 to 20 | Over **2026-10-19 → 2026-12-18** the smoothed reading changes more often than once a week on average |
| Forecasting sentiment | **Forecast the outcome band each reading carries, never the score itself** | medium | A score forecast would be the score's own persistence restated. The band (median, 1-in-10 tail, dip odds) is a claim the tape can grade | On the **2027-10-15** re-run, sessions after 2026-10-16 land 15 points or more off this table's 5%-dip odds for two or more readings |

**TL;DR.** The market today reads leaning bull (+30), sliding from bull in three sessions as the VIX
jumped. History says a bad reading means a fatter left tail, not a falling market: the median return
after a bear reading is no lower than after bull (+3.9% vs +0.6% per episode; +1.5% vs +1.2% per
session), but the odds of a 5% dip are four times bull's. So the
reading should narrow sold premium in bad conditions and never stop a playbook on direction alone.

**Signals & conditions:**

- **Buy signal:** no. A bear reading is not a bottom call; it widens the range both ways.
- Bear readings cluster in 2000–02, 2008–09, 2022 and April 2025: 25 episodes since 2000, not 768 sessions.
- The reading lags turns by design: April 2025 read bear from 04-03 to 04-29, through the low and most of the rebound.
- 4 of 9 sectors above their 50-day while SPY sits near its high: narrow leadership, the breadth vote's bear side.

---

## 1. What was run

**The score.** One number per session, −100 (every vote bear) to +100 (every vote bull): 100 × the
mean of five votes. Each vote is +1, 0 or −1 (the two index votes can land on ±0.5 when SPY and QQQ
disagree). A vote is missing, not neutral, when its input does not exist yet, and a score needs four
of the five votes.

| Vote | Input | +1 (bull) | −1 (bear) |
|---|---|---|---|
| Trend | SPY and QQQ, each: close and 50-session average vs the 200-session average | both above | both below |
| Drawdown | SPY and QQQ, each: close vs the 60-session closing high (the house drawdown rule, `cycle-phase-math.mjs`) | within 3% | 10% or more under |
| VIX level | ^VIX close, the house buckets | calm, under 20 | fear, 25 or more |
| VIX term | ^VIX / ^VIX3M | under 0.90 (the near month calmer than the quarter) | 1.00 or more (stress priced as now) |
| Breadth | share of the nine original SPDR sector funds above their own 50-session average | 60% or more | 40% or fewer |

**The readings.** 60 or more: bull · 20 to 59: leaning bull · −19 to 19: mixed · −59 to −20: leaning
bear · −60 or lower: bear. Equal weights and these cut points were set before any forward return was
read; nothing here is fitted to the outcomes it is graded on.

**No look-ahead.** A vote on a session reads closes on that session and before (a spec pins it:
appending a crash after a series leaves every earlier vote unchanged). The forward returns are an
outcome, never an input.

**Why sector funds for breadth.** A basket of today's largest stocks is a survivor pick: their
histories are, by construction, the ones that went up. The nine sector funds have existed unchanged
since 1998-12, so their breadth reads the same in 2002 as today.

**Grading.** For every session since 2000-01-01: SPY's and QQQ's return over the next 21 sessions,
and the lowest close on the way (the number a sold put cares about). Sessions with the same reading
arrive in runs, so the honest n is the **episode** count (house rule: a gap of more than 21 sessions
starts a new one), and the episode median weighs a one-year bull run the same as a one-month one.

**Data.** Yahoo daily bars, adjusted: SPY from 1993, QQQ from 1999-03, ^VIX from 1990, ^VIX3M from
2006-07, sector funds from 1998-12. The score exists from 1999-03-05; all five votes from 2006-07-17.

## 2. Today

| Session | Score | Reading | Trend | Drawdown | VIX level | VIX term | Breadth | Inputs |
|---|---|---|---|---|---|---|---|---|
| 10-13 | +80 | bull | +1 | +1 | +1 | +1 | 0 | |
| 10-15 | +50 | leaning bull | +1 | +0.5 | +1 | +1 | −1 | SPY −0.9%, QQQ −4.2% off the high; VIX 16.46 / 18.49 = 0.890; 3/9 sectors |
| 10-16 (15:00 ET, last price) | +30 | leaning bull | +1 | +0.5 | 0 | 0 | 0 | SPY −2.2%, QQQ −6.7% off the high; VIX 20.38 / 20.71 = 0.984; 4/9 sectors |

The trend vote has been bull since 2026-04-08; the slide is the VIX (16.5 → 20.4 in one
session) and the term structure going flat. The 5-session mean is still +62 (bull). What a
leaning-bull session led to since 2000: SPY median +1.9% over 21 sessions, a 1-in-10 tail of −5.0%,
the lowest close on the way −6.7% at the 1-in-10 mark, and a 5% dip in 20% of sessions (QQQ: 28%).

## 3. The history

| Year | Mean score | Low (date) | Bear + leaning bear | Bull + leaning bull | SPY that year |
|---|---|---|---|---|---|
| 2000 | 11 | −100 (11-13) | 26% | 39% | −9.7% |
| 2001 | −48 | −100 (02-28) | 67% | 8% | −11.8% |
| 2002 | −46 | −100 (06-13) | 72% | 12% | −21.6% |
| 2003 | 50 | −100 (02-12) | 16% | 73% | +28.2% |
| 2007 | 45 | −60 (11-12) | 16% | 71% | +5.1% |
| 2008 | −50 | −100 (02-05) | 75% | 16% | −36.8% |
| 2009 | 13 | −100 (01-20) | 30% | 54% | +26.4% |
| 2011 | 23 | −100 (08-19) | 28% | 59% | +1.9% |
| 2013 | 83 | −20 (06-20) | 1% | 98% | +32.3% |
| 2017 | 94 | 20 (04-13) | 0% | 100% | +21.7% |
| 2018 | 45 | −100 (12-18) | 22% | 72% | −4.6% |
| 2020 | 26 | −90 (03-31) | 24% | 67% | +18.3% |
| 2022 | −27 | −100 (04-29) | 57% | 26% | −18.2% |
| 2024 | 77 | −50 (08-05) | 2% | 96% | +24.9% |
| 2025 | 56 | −100 (04-16) | 15% | 78% | +17.7% |
| 2026 to date | 68 | −70 (03-27) | 8% | 90% | +12.6% |

Selected years; the CLI prints every year from 1999. Every down year for SPY had a negative mean
score or a bear share over 20%. The last 252 sessions: 191 bull, 34 leaning bull, 8 mixed, 13
leaning bear, 6 bear.

**Two recent turns, read by the score.** April 2025: +20 on 03-25, bear (−80) from 04-03, −100 from
04-16 to 04-24, back to mixed on 05-02 and bull on 05-15. The reading went bear after the first two
crash sessions and stayed bear through the low (04-08) and most of the rebound. March 2026: −40 to
−70 from 03-20 to 03-31, −60 again on 04-07, then +50 the next session and +90 the session after.
The reading follows the tape; it does not lead it.

## 4. What followed each reading

**SPY, next 21 sessions, sessions from 2000-01-01**

| Reading | Sessions | Episodes | Median (per episode) | Median (sessions) | 1-in-10 return | Up | Lowest close, median | Lowest close, 1-in-10 | 5% dip |
|---|---|---|---|---|---|---|---|---|---|
| bull | 3,699 | 32 | +0.6% | +1.2% | −3.6% | 66% | −1.3% | −5.2% | 11% |
| leaning bull | 1,005 | 82 | +2.5% | +1.9% | −5.0% | 66% | −1.8% | −6.7% | 20% |
| mixed | 660 | 68 | +3.8% | +1.8% | −6.1% | 63% | −2.3% | −8.1% | 24% |
| leaning bear | 585 | 64 | +3.9% | +2.2% | −6.9% | 64% | −2.7% | −9.6% | 28% |
| bear | 768 | 25 | +3.9% | +1.5% | −9.4% | 58% | −4.0% | −15.4% | 42% |
| all | 6,717 | – | – | +1.4% | −4.8% | 65% | −1.7% | −7.3% | 19% |

**QQQ, same sessions**

| Reading | Median (per episode) | Median (sessions) | 1-in-10 return | Up | Lowest close, 1-in-10 | 5% dip |
|---|---|---|---|---|---|---|
| bull | +1.3% | +1.4% | −5.0% | 64% | −7.1% | 20% |
| leaning bull | +2.5% | +2.4% | −7.6% | 66% | −9.8% | 28% |
| mixed | +4.0% | +2.0% | −10.7% | 59% | −14.0% | 39% |
| leaning bear | +3.7% | +1.9% | −11.1% | 60% | −13.8% | 46% |
| bear | +2.4% | +1.8% | −12.9% | 58% | −17.8% | 52% |

**What sorts and what does not.** The tail sorts cleanly and in order: the 1-in-10 lowest close runs
−5.2% → −6.7% → −8.1% → −9.6% → −15.4% from bull to bear, and the 5%-dip odds 11% → 42%. The
direction does not: the share of up windows drifts down a little (66% → 58%) while the median
return does not fall with it (bull has the lowest per-episode median, +0.6%; per session the five sit
between +1.2% and +2.2%, bear +1.5%). That is volatility clustering plus mean reversion: bad weather
means a wide range, and wide ranges in a rising market resolve up more often than not.

**Check, sessions from 2006-07-17 (all five votes present).** Same shape: SPY 5%-dip odds 12% bull,
19% leaning bull, 21% mixed, 29% leaning bear, 41% bear; episode medians +0.7% bull to +4.3% bear.

## 5. Each vote alone (SPY, next 21 sessions, from 2000)

| Vote | Bull side: median · 5% dip | Neutral: median · 5% dip | Bear side: median · 5% dip |
|---|---|---|---|
| Trend | +1.4% · 13% (n 4,774) | +2.4% · 21% (n 389) | +0.7% · 37% (n 1,554) |
| Drawdown | +1.3% · 13% (n 4,356) | +2.4% · 19% (n 1,128) | +1.1% · 40% (n 1,233) |
| VIX level | +1.2% · 12% (n 4,162) | +1.0% · 29% (n 1,283) | +3.0% · 32% (n 1,272) |
| VIX term | +1.4% · 12% (n 2,628) | +2.0% · 22% (n 1,892) | +2.7% · 31% (n 555) |
| Breadth | +1.2% · 15% (n 4,107) | +1.5% · 21% (n 895) | +2.3% · 27% (n 1,715) |

Every vote sorts the dip odds the same way, so each earns its seat. Trend and drawdown sort the tail
hardest (37–40% on their bear side); the VIX votes carry the mean reversion (the best medians sit on
their bear side). The combined score spreads the dip odds a little wider (11% → 42%) than the best
single vote (drawdown, 13% → 40%), and its middle readings grade the steps in between.

## 6. How sticky a reading is

| Reading | Daily: runs · median length · 1-in-10 longest | 5-session mean: runs · median · 1-in-10 longest |
|---|---|---|
| bull | 249 · 5 · 42 | 118 · 20 · 74 |
| leaning bull | 407 · 2 · 6 | 203 · 4 · 12 |
| mixed | 269 · 2 · 6 | 141 · 4 · 13 |
| leaning bear | 236 · 2 · 5 | 96 · 5 · 11 |
| bear | 97 · 3 · 26 | 41 · 14 · 37 |

Daily, the middle readings flip every other session; a calendar strip drawn from them would
flicker. The 5-session mean halves the number of changes. The cost is lag on a V-turn: in April
2026 the daily score went −60 → +50 → +90 on 04-07 to 04-09, while the smoothed one read mixed on
04-08 and 04-09 and reached leaning bull only on 04-10.

## 7. The house call mix (context, not scored)

| Event week | Stand aside | Watch | Act | Specific instruction | Market score (week mean) |
|---|---|---|---|---|---|
| 08-24 | 6 | 0 | 0 | 0 | 92 |
| 08-31 | 15 | 0 | 0 | 0 | 86 |
| 09-07 | 21 | 0 | 2 | 1 | 55 |
| 09-14 | 35 | 0 | 2 | 0 | 52 |
| 09-21 | 35 | 0 | 0 | 0 | 60 |
| 09-28 | 48 | 0 | 2 | 0 | 60 |
| 10-05 | 17 | 1 | 0 | 0 | 60 |
| 10-12 | 33 | 0 | 0 | 0 | 62 |

The Today row of every event ledger, sorted by the app's own classifier (`app/src/live/call-mix.ts`).
88–100% stand-aside whatever the market did: the ledgers' posture is a house rule about single
events, not a market reading. It stays beside the score as context and out of it.

## 8. What this means for playbooks

- **The reading narrows, never widens.** #5482's rule for convictions fits unchanged: a bad reading
  may shrink a new entry's size or push a sold strike further out; a good reading never licenses
  more size. The data agree: bull has the *lowest* median forward return of the five readings.
- **Sold premium is the side to narrow.** The wheel's cash-secured puts and any short put lose on
  the dip, and the dip is what the reading sorts. Long calls bought in a bear reading did not
  face a lower median return than in a bull one (+1.5% vs +1.2% per session, QQQ +1.8% vs +1.4%);
  narrowing them on the reading has no direction case behind it.
- **Two levels, per #5483 amendment 3.** Signal at −20: record the reading on every new entry and
  notify, change nothing. Gate at −60: halve new short-premium size, observe-only (a shadow log of
  what it would have narrowed) until 30 hits or 2027-04-16 grade it. The gate never touches exits.
- **No option-price history.** The bear reading's fatter tail comes with richer premium (the VIX
  is high by definition). Whether that premium pays for the tail is untested here; the shadow gate
  is how it gets tested.

## 9. Red team

- **Few independent bears.** 768 bear sessions are 25 episodes, dominated by 2000–02, 2008–09 and
  2022. One new regime could move the bear row a lot; the 2027 re-run is the check.
- **Index, not AI names.** SPY and QQQ are the market. The house books trade NVDA, CRWV and peers,
  which move two to four times the index: read a 5% index dip as a 10–20% single-name one.
- **Overlapping windows.** Sessions-level quantiles count overlapping 21-session windows; the episode
  column is the defensible n. The ordering survives both counts.
- **Coarse breadth.** Nine funds give a share in steps of 11 points; a wider basket would be finer
  but either a survivor pick (today's large caps) or a data source we do not have offline.
- **Closes only.** Intraday lows go deeper; a put's assignment is decided at expiry, not by the
  lowest close, so the dip odds overstate assignment risk for a put that recovers in time.
- **The score itself is unfitted, but the study chose its readings' cut points (±20, ±60) and the
  vote thresholds from house conventions before reading outcomes.** Other reasonable cuts would move
  the row counts, not the ordering.

## 10. Ledger

- 2026-10-16: first run. Instrument `scripts/research/market-reading.mjs` (pure rules in
  `market-reading-math.mjs`, specified in `tests/research/market-reading-math.spec.ts`). Today
  leaning bull +30, intraday. Next scheduled read: 2026-11-16 (the today-row falsifier).
