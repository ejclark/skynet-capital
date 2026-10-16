# Buying intraday dips for a small bounce — two names clear costs, three don't

**Kind:** strategy study (5-minute bars, price only) · **Date:** 2026-10-16 · **Symbols:** CRWV, NBIS, MU, AMD, NVDA · **Impact:** medium
**Last assessed:** 2026-10-16

**Question (Eric, 2026-10-16, plan #5489):** _"high frequency stocks, that are volatile throughout
the day and week.. you can still do 50 separate 1k trades with 50k capital to take small profits on
volatility. This is also very risky; what happens when recovery cycle is delayed needs defined."_
Does any version of "buy a dip below VWAP, sell a small bounce" clear costs, and what should the
rule be for the buy that doesn't bounce?

Reproduce: `node scripts/research/dip-bounce.mjs CRWV,NBIS,MU,AMD,NVDA`. Every number below is
printed by it. Paper only; educational.

## The call

| Name · trade | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| MU · dip 2 ranges below VWAP, sell +1 range | Build it dark; size zero | low | +0.39%/trade after 5 bps/side, t 5.3 over 36 days; both halves up | **2027-01-15** re-run on fresh bars: t under 2, or dark run's net ≤ 0 |
| NBIS · same setting | Observe beside MU; size zero | low | +0.62%/trade, but t 2.2 (below the 45-test bar) and fat-tailed | **2027-01-15** re-run: net at 5 bps ≤ 0 |
| CRWV · any setting | Don't | medium | Best cell +0.05%/trade, t 0.3; a held buy fell 28% | **2027-01-15** re-run: a k=2 cell over +0.2%/trade with t over 3 |
| AMD · any setting | Don't | medium | Best cell +0.10%/trade, t 1.4; second half lost | Same test, **2027-01-15** |
| NVDA · any setting | Don't | medium | Loses after 5 bps in all 9 settings; a 1-range target is 24 bps | **2027-01-15** re-run: any cell above 0 at 2 bps, t over 2 |
| The 50 × $1k book on all five | Don't; two names, not five | medium | +2.3% in 58 sessions, nearly all from MU and NBIS | **2027-01-15** re-run: the five-name book beats MU+NBIS alone |
| Late-recovery rule | Keep the day-3 signal; the day-5 hand-off keeps the target | low | 18 of 22 buys held past day 5 bounced later (median day 9) | **2026-12-31** dark run: under half of day-5 holds hit target by day 15 |

**TL;DR.** Mostly don't. MU, maybe NBIS, earn a dark run, not money. **Signals & conditions:**

- **Buy signal:** no — nothing goes live from a 58-session sample; slice 2 records in observe-only.
- Enter only 2 ranges below VWAP, after 10:00 ET, never on a print day ±1. A 1-range dip loses.
- The stuck buys come in waves: CRWV and NBIS stuck on the same days. One bet, not fifty.
- Today (10-16) is such a wave: the cycle-phase study reads a sector-wide pullback.
- "Adapt HC-SAURON" is moot: it was dissolved on 2026-10-16, its tranche-buys moved here (see §6).

## The calls in full

**Summary.** A buy 2 of the name's own 5-minute ranges below the session's VWAP, sold one range
higher, made money after costs on MU and NBIS over the last 58 sessions, and did not on CRWV, AMD
or NVDA. Shallower dips (1 range) lost on four of five names. About 7 in 10 such buys hit their
target the same day and 93–99% by day 5; the rest got stuck in four sector-wide selloffs
(Aug 17–18, Aug 27, Sep 8–11, Oct 6–8), and in those the stuck buys were the same bet across
names. Of the buys still held after day 5, most bounced later, at a median of 9 sessions. Booking
them out at day 5, as the plan's gate does, lost money they would have made back. So keep the day-3
signal, and let the day-5 hand-off carry the buy's target sell with it rather than ending it.

Sixty days of 5-minute bars is all the data source keeps. That is one market regime, and every
setting was picked after looking. MU's result clears a strict bar for 45 tests; NBIS's does not.
Both get a dark run (slice 2), not capital.

## 1. What was tested

| | |
|---|---|
| **Bars** | Yahoo 5-minute, regular hours, **2026-07-24 → 2026-10-15**: 59 sessions, 1 warm-up, 55 eligible per name after print days |
| **Range unit** | Mean high−low of the previous 78 bars (one session). NVDA 0.24% of price · AMD 0.40% · MU 0.46% · CRWV 0.59% · NBIS 0.71% |
| **Entry** | A bar from 10:00 ET closes ≤ VWAP − k × range; buy at that close. One buy per cross; a further one only another k ranges lower |
| **Exit** | Sell at entry + m × range, filled only when a bar trades through it (a gap open above it fills at the open) |
| **Late rule** | Unsold at the close of day 5 → handed off at that close (day 0 = entry day) |
| **Excluded** | Print day ±1 session: CRWV 08-10..12, NBIS 08-11..13, MU 09-29..10-01, AMD 08-03..05, NVDA 08-25..27 |
| **Costs** | No quote history is reachable offline, so spread is **assumed and swept**: 2, 5, 10 bps per side, plus the break-even |
| **Control** | The same target and day-5 hand-off from **every** eligible bar. A dip rule that only matches it found drift, not a bounce |

NBIS files its results on a 6-K, not an 8-K, so its print date (2026-08-12) comes from the
inline-XBRL 6-K. Every other name's comes from SEC 8-K Item 2.02 filings.

## 2. Net per buy, every setting

Net % per $1k buy after 5 bps/side, with the day-5 hand-off as the exit; in brackets, the t-stat
clustered by day (buys on one day count as one draw).

| k / m | CRWV | NBIS | MU | AMD | NVDA |
|---|---|---|---|---|---|
| 1 / 0.5 | −0.25 (−1.2) | −0.06 (1.1) | +0.07 (0.3) | −0.09 (0.0) | −0.08 (−1.2) |
| 1 / 1 | −0.31 (−0.8) | −0.11 (1.0) | +0.20 (0.8) | −0.19 (0.0) | −0.12 (−0.8) |
| 1 / 1.5 | −0.55 (−0.9) | −0.05 (1.1) | +0.16 (0.4) | −0.17 (0.3) | −0.14 (−0.8) |
| 1.5 / 0.5 | −0.03 (−0.1) | +0.13 (1.2) | +0.08 (0.2) | −0.10 (−0.2) | −0.13 (−1.4) |
| 1.5 / 1 | −0.43 (−0.8) | +0.34 (1.1) | +0.28 (1.4) | −0.14 (0.2) | −0.06 (−0.6) |
| 1.5 / 1.5 | −0.53 (−0.7) | +0.56 (1.3) | +0.22 (0.5) | −0.17 (0.0) | −0.20 (−0.8) |
| 2 / 0.5 | −0.05 (−0.1) | +0.41 (2.6) | +0.14 (2.3) | +0.05 (0.8) | −0.14 (−1.2) |
| **2 / 1** | +0.05 (0.3) | **+0.62 (2.2)** | **+0.39 (5.3)** | +0.10 (1.4) | −0.20 (−0.9) |
| 2 / 1.5 | −0.25 (−0.2) | +0.70 (1.6) | +0.52 (3.7) | −0.20 (−0.1) | −0.34 (−0.9) |

With 45 cells, a single cell needs about t ≥ 3.5 to stand on its own. MU at 2/1 (5.3) and 2/1.5
(3.7) clear it; nothing else does.

**The k = 2, m = 1 row in full:**

| | CRWV | NBIS | MU | AMD | NVDA |
|---|---|---|---|---|---|
| buys (per day) | 152 (2.8) | 157 (2.9) | 117 (2.1) | 138 (2.5) | 156 (2.8) |
| sold same day | 76% | 72% | 68% | 79% | 69% |
| sold by day 1 · 3 · 5 | 89 · 92 · 93% | 88 · 92 · 96% | 91 · 97 · 99% | 93 · 96 · 99% | 86 · 90 · 97% |
| handed off at day 5 | 11 | 7 | 1 | 1 | 5 |
| gross % per buy | +0.15 | +0.72 | +0.49 | +0.20 | −0.10 |
| net at 2 · 5 · 10 bps/side | +0.11 · +0.05 · −0.05 | +0.68 · +0.62 · +0.52 | +0.45 · +0.39 · +0.29 | +0.16 · +0.10 · 0.00 | −0.14 · −0.20 · −0.30 |
| break-even cost, bps/side | 7 | 36 | 24.5 | 10 | −5 |
| control (every bar), gross % | −0.63 | +0.06 | +0.15 | +0.13 | −0.12 |
| first half · second half, gross % | +0.56 · −0.15 | +1.02 · +0.49 | +0.80 · +0.23 | +0.61 · −0.27 | +0.36 · −0.50 |
| worst low a held buy sat through | −28.4% | −22.6% | −18.9% | −15.6% | −7.9% |
| holding the stock over the window | −5.4% | −4.3% | −0.1% | +6.6% | +4.4% |

Read the break-even row first. NVDA has the smallest range of the five, so a one-range target is
a quarter of a percent, and its dip buys lose on average even before costs (7 of 9 settings). The
same thin-target problem sank the open's swing in [`intraday-volatility.md`](intraday-volatility.md). MU and NBIS clear any
plausible spread with room to spare. CRWV beats its control by a lot (+0.78) only because the
control loses: CRWV fell 5.4% over the window, so every buy lost, and dip buys lost less.

Every name did better in the first half of the window than the second. That is the strongest reason
for "dark, not live": the edge could be the regime (a choppy, range-bound tape) rather than the
rule.

## 3. Day 1, 3 and 5 — what a delayed recovery looks like

- **Most buys never need the rule.** At 2/1, 68–79% sell the same day and 93–99% by day 5.
- **The stuck ones arrive together.** The buys still held past day 5 were bought in four stretches
  of sector-wide selling: **Aug 17–18, Aug 27, Sep 8–11, Oct 6–8**. CRWV and NBIS got stuck on the
  same three of them, as the plan's cohort note expects (CRWV moves with NBIS). Fifty tranches
  across correlated names in a selloff are one position.
- **Today is one of those stretches.** The cycle-phase study
  ([`cycle-phase-crwv-nvda-2026-10.md`](cycle-phase-crwv-nvda-2026-10.md)) reads 10-16 as a
  sector-wide pullback: CRWV 41% and NBIS 38% under their 60-session highs, MU 18%, AMD 16%, with
  CRWV's floor probably still lower. A dark run that starts now starts in the weather where these
  buys get stuck, which is one more reason it records and does not trade.
- **Most of them came back, slowly.** With no hand-off, buys held past day 5 that later hit target:
  **18 of 22** at 2/1 and **42 of 57** at 1/1, at a **median of 9 sessions** (range 6–15). The ones
  that did not: two CRWV buys from 09-09 still under water 26 sessions later (worst −39%), and one
  NBIS buy from 08-18 still under water after 41.
- **How deep it gets before it comes back:** a held CRWV or NBIS buy sat 22–28% under its entry
  at the worst; MU 19%, AMD 16%, NVDA 8%.

## 4. The book — 50 × $1k across all five, three versions of the rule

At 2/1, 5 bps/side, 58 sessions. "Tied up" = the share of $50k in buys held past their entry day,
at each close. Holding the five names equally over the same window: **+0.2%**.

| Rule | Buys | Sold at target | Handed off | P/L | Mean · max tied up | Days ≥ 30% · ≥ 50% |
|---|---|---|---|---|---|---|
| **As planned** (day-3 signal, day-5 hand-off) | 614 | 584 | 25 (−$2,233) | **+$1,151 (+2.3%)** | 11% · 26% | 0 · 0 |
| Signal only (pauses; target keeps working) | 432 | 423 | 0 | +$1,379 (+2.8%) | 13% · 28% | 0 · 0 |
| No rule (buy whenever a slot is free) | 720 | 698 | 0 | +$2,331 (+4.7%) | 19% · 54% | 12 · 2 |

- **The hand-off is where the planned rule loses.** The 25 handed-off buys cost the book $2,233. If
  the receiving playbook just holds them, the member's account ends the window at **−2.2%**, not
  +2.3%: the hand-offs kept falling into the window's end. Kept with their target sell, most of
  them would have sold at a profit (§3).
- **The signal does its job.** It held capital tied up under 30% every day; with no rule it passed
  30% on 12 days and peaked at 54%. With a 1-range entry and no rule, the book hit 100% tied up
  and stayed over 50% for 26 days.
- **The 8% weekly stop never tripped** in any version or setting.
- **Nearly all the P/L is MU and NBIS.** NVDA and AMD added little or lost; CRWV's buys were roughly
  flat. A five-name book is two names carrying three.

## 5. The late-recovery rule, amended

| When | Plan | Amended by this study |
|---|---|---|
| Held at the close | holds overnight, target stays | unchanged |
| Day 3, or 30% tied up | **signal**: no new buys in that name | unchanged; it kept tied-up capital under 28% |
| Day 5, or 50% tied up | **gate**: hand off to the wheel or holding | hand off **with its target sell still working**; the receiver owns it, but the original exit stays |
| Below the cycle detector's floor band | stop | unchanged; the two CRWV buys still under water at day 26 are this case |
| Down 8% in a week | gate on new buys | unchanged; never tripped here, so it is untested |

The evidence for the amendment is four selloffs, so its confidence is low. That makes it something
the dark run should check first, not a reason to hold up slice 2.

## 6. HC-SAURON's own record

Not measured. Its decisions live in the decision store on the bot host
(`src/autonomous/decision-db.ts`), and no export or fixture of real records is in the repo. The one
copy, `scripts/study/worlds/inputs/profile-today.json`, is sanitized sample data. Its buys trigger
on sentiment and momentum readings (`src/playbooks/registry.ts`), not on a distance below VWAP, and
no sentiment history is stored to backtest them (see [`dip-entries-nvda-crwv.md`](dip-entries-nvda-crwv.md)). So this study cannot
settle "make it an HC-SAURON setting", and the playbook stays separate.

**Update 2026-10-16.** HC-SAURON was dissolved (`docs/BOTS-SAURON.md` → adaptation ledger): `SAURON`
runs hardcore Sauron's rules exactly, and his tranche-buys at extremes move to this playbook rather
than staying a setting on his. The question this section left open is closed.

## 7. Where this could be wrong

1. **One regime, 58 sessions.** The data source only keeps 60 days of 5-minute bars. Every name was
   stronger in the first half. The falsifier re-runs on a disjoint window, from 2027-01-15.
2. **Settings chosen after looking.** k = 2, m = 1 is the best row for the two names that pass. The
   dark run and the re-run test it fresh; neither may move k or m.
3. **Costs are assumed.** There is no quote history. MU's break-even of 24.5 bps/side and NBIS's 36
   are far above a normal large-cap half-spread, but a dip is when spreads widen. The dark run
   should record the quote at each signal.
4. **Fills are bar-level.** A buy at the signal bar's close and a sell only on a trade-through are the
   cautious readings. Neither models queue position.
5. **The account view after hand-off** uses the window's last close (2026-10-15), and CRWV fell
   into it. A different end date moves that −2.2% a lot. The direction (hand-offs lose the bounce)
   comes from §3's count, not from this mark.

## Builder appendix

- `scripts/research/dip-bounce.mjs` — the CLI: fetch, print-day exclusion (8-K 2.02, or the
  inline-XBRL 6-K for foreign filers), grid, control, book. `--json=PATH` dumps every cell.
- `scripts/research/dip-bounce-sim.mjs` — pure: VWAP and range annotation, entries, tranche walk,
  recovery rates. Pinned by `tests/research/dip-bounce-sim.spec.ts`.
- `scripts/research/dip-bounce-book.mjs` — pure: the 50 × $1k book under `rule: full | signal | off`.
- `scripts/research/intraday-bars.mjs` — the Yahoo bar fetch, moved out of `intraday-edges.mjs` so
  both studies share it and its cache (`node_modules/.cache/intraday-edges/`). The cache never
  expires; delete `<SYM>-5m-60d.json` to take a fresh window.
- A session still trading when the cache was taken (fewer than 78 bars) is dropped.
