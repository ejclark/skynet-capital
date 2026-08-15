# Eight-symbol sweep — the NVDA playbooks meet the rest of the roster

**Date:** 2026-08-12 · **Symbols:** MRVL, CRWV, AMZN, MSFT, GOOG, META, AVGO, AAPL
**Instruments:** [`earnings-cycle.mjs`](../../scripts/research/earnings-cycle.mjs) (SEC 8-K dates,
QQQ benchmark, sector-peer controls) + [`intraday-edges.mjs`](../../scripts/research/intraday-edges.mjs)
(hourly + 5-min, break-even slippage). Every symbol's study was independently red-teamed —
multiple-testing exposure, AI-beta confound, regime splits, date alignment, costs, small-n — and a
red-team kill overrides a researcher "fits." Predecessors: [`nvda-earnings-cycle.md`](nvda-earnings-cycle.md),
[`intraday-volatility.md`](intraday-volatility.md).

## The headline

**Every alpha-shaped claim across all eight symbols failed or wobbled under attack. Both
no-alpha claims survived on all eight.** S2 (never hold the print) and E1 (defer entries past the
open) are universal because they claim no edge — one removes a known-date variance bomb at ~zero
expected cost, the other avoids the day's most expensive microstructure for zero foregone drift.
The sweep's deployable set under current constraints is exactly: **two guard rules everywhere, one
small GOOG long, and a queue of registered zero-size forward-tests.** That hierarchy — risk rules
robust, alpha fragile — is the finding.

## The matrix — does each playbook travel beyond NVDA?

| Playbook | Travels? | Per-symbol verdicts |
|---|---|---|
| **S1** positioning bid (long D-20, flat D-5) | **No — NVDA-only.** | Killed on MRVL, CRWV, AMZN, MSFT, META, AAPL (fails binomial/base-rate/peer controls on each — e.g. AAPL's pre-print window *underperforms* its own base rate, p=0.80). Shape-inverted-but-insignificant on AVGO. Sole partial survivor GOOG needs a different exit (close of D, not D-5). |
| **S2** never hold the print | **Yes — all eight.** | Every print gap is a fat-tailed coin flip (±8–24% single-night tails). Both "the gap actually pays" objections died under attack (AVGO win 57% vs 56% ordinary-overnight base, p=0.567; META's +4.74% mean is t=1.69-fragile with a −24.3% p10 in the one bear era sampled). On META, label it bought insurance. |
| **E1** don't trade the open | **Yes — all eight, and QQQ itself.** | First ~hour carries 28–34% of daily volatility at ~zero drift everywhere — market-wide open-auction microstructure, immune to multiple testing because it claims no alpha. **Caveat:** on GOOG and AAPL the first hour carries most/all of the session's *return* — E1 stays a cost rule for non-urgent entries, never a systematic skip-the-open. |
| **S3** fade the reaction-day open | **Partially — it's a mega-cap software/ads class effect.** | Replicates event-locked on MSFT (59/87 red vs 49.2% base, **p=3.4e-4** — clears the ~0.001 family-corrected bar unaided, red-majority in all four eras, 10/10 red since 2024), GOOG (p=0.0014), META/AMZN (direction only). **Absent** on the semis (MRVL, AVGO) and AAPL. ~1/4 of NVDA's magnitude where it exists. Inert until shorting unblocks. |
| **S4** overnight-only | **No — beats buy-and-hold nowhere at realistic costs.** | The overnight/session split is the documented market-wide overnight anomaly (QQQ shows ~87% itself), not symbol edge. Fails *before* costs on MSFT; outright value-destroying on GOOG and AAPL (AAPL's overnight edge is exactly zero, t=−0.04). Keep only as structure: prefer close-side executions. Lone conditional case: CRWV ex-print-night carry, gated on MOC/MOO + measured slippage < ~13bps/side. |

## What survived — deployment, ranked

1. **S2 everywhere** (all eight + NVDA) — universal risk policy, not a bet. Removes known-date
   ±8–24% single-night tails at ~zero EV cost.
2. **E1 everywhere** — universal execution rule for *non-urgent* entries. On GOOG/AAPL an urgent
   or alpha-driven entry may still take the open; the rule is about not paying the widest spreads
   of the day for free.
3. **GOOG pre-print run-up hold** (long D-20 → **close of D**, still never holding the print) —
   the sweep's only surviving directional long. Pooled 37/43 prints positive, p=0.0008 vs the
   measured 63% base (degrading to 0.003–0.012 under overlapping-window base-rate uncertainty);
   excess and net-of-QQQ positive in all three eras. Deploy **small**: the evidence sits AT the
   corrected significance bar, not past it; size for the pooled −3.39% p10; attribution is partly
   mega-cap earnings-season seasonality, so never stack with other pre-print longs.
4. **Registered zero-size forward-tests** (predictions logged before outcomes): the semi late-week
   bid (MRVL/AVGO — Aug/Sep prints are observation #1), AAPL post-print drift (start at the Oct
   print), CRWV's 2026-08-11 print scoring (windows close ~Aug 19–26), META's stand-aside window
   (~Aug 27). Each carries a pre-stated kill switch.
5. **The blocked queue for Eric, evidence attached:** shorting unlock → mega-cap S3 fade (MSFT
   first, sized to the pooled −0.5%/event, not the possibly-lucky modern −1.13%); MOC/MOO +
   slippage instrumentation → CRWV overnight carry (kill line ~13bps/side realized).

## New playbook candidates (post-red-team status)

- **Mega-cap reaction-day fade** (S3 generalized) — MSFT strongest, GOOG, META/AMZN lean.
  *Deploy small on MSFT when shorting unblocks.* Genuine independent replication (different print
  calendars). Regime-bound: inverts pre-2013.
- **GOOG pre-print run-up hold** — deploy small now (above).
- **Semi late-week bid** (long close D-5 → close D on MRVL/AVGO — the window S1 declares dead
  money is where semis pay) — *shelved*: statistically indistinguishable from the battery's
  expected false positives (MRVL p=0.080, AVGO p=0.161), and on MRVL 8/14 of those windows
  contain NVDA's print, with NVDA-sympathy gaps supplying ~70% of the return — it is substantially
  a conditional NVDA-beat sympathy bet. Forward-test only.
- **Mega-cap post-print digestion vs QQQ** — *shelved as class hypothesis, killed per-symbol*:
  the apparent 4-symbol replication is illusory (windows overlap the same calendar days; QQQ is
  weighted in these very names). Requires a new registered overlap-aware study before any trade.
- **AAPL post-earnings drift** (long close D+1 → close D+11) — *shelved*: positive excess in all
  four eras but sign-only (p=0.0625 at best). Run the kill switch forward ~6 prints on paper.
- **CRWV overnight carry, ex-print nights** — *deploy_small when MOC/MOO lands*, paper-only,
  never represented as an edge over buy-and-hold (superiority is within one standard error);
  kill at ~13.4bps/side realized.

## Kill list — recorded so they are never re-proposed

- **NVDA earnings-gap hold (anti-S2)** — added 2026-08-15 ([`nvda-aug-2026-print.md`](nvda-aug-2026-print.md)):
  win 9/14 vs the 60% ordinary-overnight base (p=0.486 — indistinguishable from any overnight);
  the +5.35% mean is carried entirely by four 2023-24 gaps (ex-top-4 +1.72%) against a pooled
  −5.49% p10; 3 of the last 5 prints gapped down. Third member of the 0-for-3 hold-the-print
  family (AVGO, META, NVDA) — any future "the gap pays on X" must clear a win-rate test vs the
  ordinary-overnight base *before* citing a mean. Do not re-propose without ≥3 new prints showing
  a repriced gap regime.
- **S1 beyond NVDA** (six symbols killed outright; see matrix).
- **MRVL "session drag"** — the load-bearing session mean is t=−0.28, pure noise.
- **CRWV directional gap read** ("gaps are always down") — windowing artifact; the excluded
  2025-05-14 print gapped green, and the newest print's reaction was positive.
- **AVGO hold-the-print** (anti-S2) — win rate indistinguishable from an ordinary overnight
  (p=0.567), mean one-print-carried, and the latest print gapped −14.66%.
- **META gap-capture** (hold the print, sell D+1 open) — no significance at any cut; contradicts
  S2 with evidence far too weak to license the exception.
- **AAPL late run-up** — vanishes net-of-QQQ (t≤0.6); a QQQ bet in an AAPL costume.
- **MSFT D-10 run-up** — modern era net-of-QQQ is a literal coin flip (7/14); edge decays
  monotonically to nothing (win 76%→57%→58%→50% by era).
- **S4 daily round-trip on AMZN/MSFT/GOOG/META/AAPL** — dominated by buy-and-hold at every cost
  level tested, including 2bps/side.
- **S3 on MRVL** — absent, not inverted (corrected +0.45%/50% vs an ordinary session's +0.01%/51%).

## Portfolio-level critique — what no single-symbol view sees

1. **Multiple testing.** ~40–70 statistical looks across eight tickers; the family-corrected bar
   is ~0.001. What clears it: MSFT S3 (p=3.4e-4, and pre-registered from NVDA, which blunts the
   penalty) and GOOG S3 (p=0.0014, at the line). GOOG's run-up sits at the bar. Everything else is
   indistinguishable from the battery's expected false positives.
2. **Eight slots, one trade.** Peers rally over each other's pre-print windows in *every* study;
   QQQ itself ran +3.7% over GOOG's windows. Running multiple S1-family longs is one leveraged
   AI-beta bet, not diversification.
3. **Regime concentration.** Every intraday number rests on one 2023–26 bull regime; the n=14
   modern earnings cells vanish or invert in 2020–22 on symbol after symbol.
4. **Decay.** Wherever per-event sequences were inspected, edges decay monotonically toward zero
   (CRWV's fade −11.4→−3.6; MSFT's D-10 run-up by era). Pooled means overstate forward
   expectation, sometimes ~2×. Size to the most recent era, not the pool.
5. **Pipeline integrity (instrument debt, must fix before the next sweep).** Two of eight event
   lists were corrupted: MRVL's quarter-dedup kept a pre-market 8-K and an investor-day filing
   while dropping two real prints; CRWV's newest print was filed **midday**, breaking the
   after-close reaction template silently. Separately, the forward-window guard excludes the
   newest print on five of eight tickers — blinding each study to its freshest out-of-sample
   point. The red teams caught all three; the instrument did not.

## Time-sensitive (as of 2026-08-12)

- **CRWV printed yesterday** (8-K filed midday 2026-08-11 — not in the study's n=4). Today is the
  D+1 window where all four *prior* prints were ugly — but the first post-print hours ran green
  (+2.42%), already against the shelved bleed hypothesis. **Do nothing; score the free
  out-of-sample experiment** when the D+6/D+11 windows close (~Aug 19 / ~Aug 26).
- **MRVL** — print est. **2026-08-27** (cadence estimate; confirm vs IR). Today is ~D-11. The
  shelved late-week window opens ~Aug 20: log it as forward-test observation #1, zero size. Any
  MRVL position flat by the Aug-26 close per S2.
- **AVGO** — print est. **2026-09-03**, honest window Aug 27–Sep 10 (83–98-day cadence spread —
  an estimated D-5 entry could land *after* the real print; confirm the date this week). S2
  applies with feeling: the last AVGO print gapped −14.66%.
- **NVDA** — print est. ~Aug 26 (unconfirmed). The peer evidence says part of NVDA's celebrated
  run-up is sector seasonality: keep existing paper size, do **not** scale up on the cross-ticker
  "confirmation," flat by D-1 per S2.
- **AAPL / META** — post-print windows from the late-July prints close ~Aug 14 / ~Aug 27; no
  action, log outcomes as forward-test data.

## Honest limits

Same as the parent studies, sharpened: n=14 modern-era cells everywhere (n=4 on CRWV — anecdote,
not evidence); one intraday regime; SEC filing dates stand in for announcement times (and midday
filings break the template, per the pipeline finding); estimated print dates are estimates. The
red-team layer caught two corrupted event lists and several researcher overstatements — treat any
number in this doc that lacks a control clause with suspicion, and prefer the per-symbol journals
for the full attack transcripts.
