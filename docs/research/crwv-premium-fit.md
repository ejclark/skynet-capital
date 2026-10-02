# CRWV on the premium wheel — the premium is not rich, it is cheap

**Kind:** playbook fit · **Date:** 2026-10-02 · **Symbol:** CRWV · **Impact:** high
**Last assessed:** 2026-10-02

**Question (#4469 slice 1, with [#4460](https://github.com/ejclark/skynet-capital/issues/4460)
slice 1):** should CRWV go on a premium-selling playbook (the wheel), and if so on what settings?

Reproduce: `node scripts/research/premium-fit.mjs CRWV --refresh`

## The call

| # | The call | Confidence | The one-line why | The dated observation that proves it wrong |
|---|---|---|---|---|
| 1 | **Stand aside — do not sell CRWV premium at today's chain.** No wheel entry, no suggestion, no settings. | medium | Implied volatility for the next 30 days is **69.9%**; CRWV's own forward-30-day realized has come in **below that in 6% of the last year** (median 88.7%). The seller is short volatility 24 points *under* the mean outcome. | A re-run on or after **2026-11-13** (post-print, fresh chain) puts `iv30` at or above the **50th percentile** of the trailing-year forward-realized distribution **and** the Δ0.20 rung's priced assignment odds above the historical. Either alone is not enough. |
| 2 | **No settings are issued for CRWV.** The playbook stores none. | n/a — policy | #4469 EARS 2: a stand-aside entry shows its reason and accepts no subscription. Settings are the thing a subscriber then runs. | Call 1 flipping. Nothing else. |
| 3 | **Never sell a leg across a CRWV print — and the window is the session *after* the filing date.** | high | The filing session is a decoy: the six prints moved **+6.6 / +6.4 / +1.5 / −0.4 / −6.6 / +2.4%** on the filing date and **−2.5 / −20.8 / −16.3 / −18.5 / −11.4 / +19.3%** on the session after. | Three consecutive prints whose filing-session move exceeds the next session's. The next is projected **2026-11-09**. |
| 4 | **Adopt the instrument as the gate every symbol passes through**, on this comparator: trailing **252 sessions**, not full history. | medium | Against full history the same test called implied cheap on NVDA (17th pct) *and* AAPL (30th) — old crisis eras doing the work. Regime-matched, the cross-section separates: mega-caps rich (AMZN 81st, AAPL 67th), high-beta AI names cheap (CRWV 6th, NVDA 7th, AVGO 12th). | A symbol whose regime-matched verdict is contradicted by a recorded IV-rank reading once `SKYNET_IV_HISTORY_DIR` has a year of CRWV samples (earliest ~2027-09). |
| 5 | **Do not act on the mirror trade** (implied this cheap argues for *owning* gamma, not selling it). Register it, size zero. | low | The claim needs implied-vs-*subsequently*-realized measured pairwise through time. One snapshot cannot do it, and this study will not pretend otherwise. | A year of recorded `iv30` samples, at which point the pairwise test is runnable and either survives or does not. |

**Headline.** CRWV looks like a premium-selling name and is not one. It has every surface feature
the wheel wants — a 70-vol quote, a deep chain, spreads that cost 3–5% of the premium — and fails
on the only thing that matters: the market is charging less for CRWV's next month than CRWV has
delivered in almost every month of the last year. The wheel's edge is the gap between implied and
subsequently realized. Here the gap is **negative 24 volatility points**, and two independent
measurements say so.

---

## 1. The fit test — implied against what follows

The wrong question is "is implied volatility high?" CRWV's is 69.9%, which is high in absolute
terms and tells you nothing: a name is normally priced for the volatility it delivers. The right
question is whether the quote exceeds what *this symbol then realizes* over the same horizon.

| | |
|---|---|
| `iv30` (Cboe, delayed, 2026-10-02 20:56 ET) | **69.9%** |
| forward 21-session realized, last 252 sessions — p10 | 75.3% |
| — median | **88.7%** |
| — mean | 94.1% |
| — p90 | 125.6% |
| where `iv30` sits in that distribution | **6th percentile** |
| paid over the mean outcome | **−24.3 vol points** |
| sample | n = 232 overlapping ≈ **11 independent** months |

Read the row that matters plainly: in the last trading year, CRWV delivered a 30-day stretch as
quiet as the one now being quoted **6% of the time**. A seller collects the premium and wears the
other 94%.

## 2. The first objection, measured rather than assumed

*"CRWV has calmed down — trailing 10-day realized is 38.9%, so the year's distribution is the
wrong comparator."* It is the right objection and it does not survive its own test.

- **Volatility does not persist on this name.** corr(trailing 10-day, forward 21-day) = **−0.125**
  over 222 overlapping pairs (regime-matched to the same 252 sessions as the distribution above). The current calm carries essentially no information about the next
  month.
- **The conditional sample is empty.** Only **2** windows in CRWV's entire history followed a
  trailing-10-day read under 45%, and they are overlapping neighbours of one episode. There is no
  conditional distribution to appeal to.
- **The calm is not even the recent regime.** Trailing 20-day is 69.6%, 30-day 60.8%, 60-day
  97.4%. Quarter by quarter since listing: **144.5% · 87.1% · 96.1% · 93.1%**. Drop the IPO
  quarter and CRWV has realized 87–96% every quarter of its life.

## 3. The second measurement — assignment odds, priced against delivered

The ladder reads the price distribution rather than the volatility distribution, so it is an
independent check. At **2026-11-06** (35 days, the richest print-clean expiry in the 21–45 day
band, ATM IV 71.4%):

| Δ | strike | bid | spread / premium | OI | priced P(assign) | CRWV's own history | edge | ann. yield |
|---|---|---|---|---|---|---|---|---|
| 0.15 | $75 | $2.09 | 4.2% | 240 | 17.9% | **31.1%** | **−13.3%** | 29.1% |
| 0.20 | $76 | $2.31 | 5.1% | 139 | 19.4% | **33.3%** | **−13.9%** | 31.7% |
| 0.25 | $79 | $3.15 | 4.7% | 62 | 24.4% | **36.4%** | **−12.0%** | 41.6% |
| 0.30 | $82 | $4.15 | 4.7% | 27 | 29.9% | **42.1%** | **−12.2%** | 52.8% |

Every rung is priced for *fewer* assignments than CRWV has actually delivered, by 12–14 points.
The 29–53% annualized yields in the last column are what make this symbol look irresistible and
are exactly what the gate exists to refuse: they are the market's fair price for a tail the quoted
volatility is under-describing. **Two methods, two data sources, one answer.**

## 4. What is *not* wrong with CRWV

Worth stating, because the stand-aside is narrow and a later re-run should not have to rediscover
these:

- **Liquidity is excellent.** 1,802 contracts across 20 expiries, 2.61M total open interest,
  322k contracts traded on the day. Spreads at the candidate rungs cost **3–5% of the premium** —
  comfortably inside the 15% ceiling. The ladder fails on edge, never on tradeability.
- **The print cadence leaves room.** Median gap 90 days; the next is projected 2026-11-09, so a
  21–45 day leg has clean expiries on either side of it.
- **The print is not CRWV's main danger.** Of the **19** sessions that moved ≥10% in the last 252,
  only **4** were print-adjacent. There were **90** sessions of ≥5% — more than one a week. CRWV's
  tail arrives on ordinary days with no scheduled catalyst, which is precisely why a calendar-based
  avoid-window cannot fix the fit.

## 5. Method, and the two places it was wrong before it was right

Instruments: [`premium-fit.mjs`](../../scripts/research/premium-fit.mjs) over
[`option-chain.mjs`](../../scripts/research/option-chain.mjs) and
[`premium-fit-math.mjs`](../../scripts/research/premium-fit-math.mjs). Sources: Yahoo daily bars
(split/dividend adjusted), SEC EDGAR 8-K Item 2.02 filing dates, Cboe delayed option quotes. No
credential, so the run works offline from any session; the quotes are delayed and would **not** be
good enough to route an order against.

Both corrections came from the controls, not from the CRWV run, and both changed the answer:

1. **The comparator was full history.** On that basis the test called implied cheap on nearly
   everything, because AAPL's and MSFT's files reach back through 2000, 2008 and 2020. Regime-
   matched to 252 sessions, the cross-section becomes legible:

   | | CRWV | NVDA | AVGO | AMD | MRVL | META | MSFT | GOOG | AAPL | AMZN |
   |---|---|---|---|---|---|---|---|---|---|---|
   | `iv30` | 69.9% | 28.8% | 35.2% | 50.2% | 61.1% | 42.3% | 32.0% | 34.6% | 25.4% | 38.1% |
   | median forward realized | 88.7% | 38.7% | 43.0% | 65.8% | 67.5% | 44.7% | 26.4% | 30.4% | 23.3% | 28.9% |
   | **percentile** | **6** | 7 | 12 | 18 | 35 | 46 | 60 | 67 | 67 | **81** |

   The gate is not a rubber stamp in either direction: AMZN scores **fits**, AAPL and MSFT
   **thin**, CRWV and NVDA **stand aside**.

2. **The print move was scored on the filing session.** EDGAR publishes a filing date and no time
   of day. Scoring that session alone reported CRWV's worst print as **+6.6%** — while the session
   after the 2025-08-12 filing was **−20.8%**. `printMoves` now returns both candidate sessions and
   takes the worse, which is what produced call 3.

**Honest limits.** The windows overlap, so 232 observations are ~11 independent months and the
true interval is far wider than the sample count suggests — which is why confidence is medium and
why this instrument cannot grade `high` by construction. `iv30` is one snapshot: **IV rank and
percentile are absent**, with the named reason `no-recorded-history-offline`
(`src/research/iv-rank.ts` owns that metric, and its series lives on the production volume). The
comparison is therefore today's implied against *past* realized, not the pairwise implied-vs-
subsequently-realized test a desk would run. CRWV has traded for 381 sessions; nothing here
survives a claim about its behaviour over a cycle.

## 6. What this cost — the number #4469 asked for

| | |
|---|---|
| wall clock, cold cache | **0.74s** |
| wall clock, warm | 0.05s |
| network reads | 3 (Yahoo, EDGAR, Cboe) |
| credentials | none |
| LLM tokens | **zero** |

The mechanical run is free. **The expensive half is the judgment** — reading the output,
red-teaming it, and writing the call sheet above, which is one Claude session (this one). That
splits #4469's open question "who may add a symbol to a list" cleanly: the *screen* is cheap
enough for any member to trigger on any symbol, and the thing worth gating is the **written
verdict**, not the compute. Recommended shape, for the slice that builds it: let anyone run the
screen; let a fit verdict that unlocks subscriptions be house-written.

## Stance

**Stand aside on CRWV for the wheel, reviewed after the 2026-11-09 print.** The symbol stays a
candidate — it is liquid, well-covered and its cadence is workable — and the entry on the
playbook's list should read *stand aside* with this document as its reason, exactly as #4469 EARS
2 describes. Re-run the instrument on or after **2026-11-13** against call 1's falsifier.

### Kill switches

- The stand-aside is wrong, and CRWV fits, if a post-print re-run clears **both** halves of call
  1's falsifier (percentile ≥ 50 **and** priced assignment > historical at Δ0.20).
- The whole comparator is wrong if, once a year of recorded IV samples exists, the regime-matched
  verdict disagrees with the IV-percentile reading for the same symbol on the same day.
- Call 3 is wrong if three consecutive prints react on the filing session rather than the one
  after.
