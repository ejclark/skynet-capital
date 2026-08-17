# AAPL earnings print — aapl-2026-10-29-print

**Kind:** earnings · **Date:** 2026-10-29 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-08-17

## Initial research

**The question.** AAPL's FQ4 2026 print is estimated for 2026-10-29 (8-K cadence — the same day
as AMZN's estimate, one day after the est. GOOG/META prints and the confirmed 2026-10-28 FOMC
decision). Do any of the house playbooks give us a pre-positioned play into it, and what is the
honest state of the one AAPL hypothesis still alive?

**One-line verdict.** No pre-print play exists on AAPL — the sweep killed every positioning-shaped
hypothesis on this symbol — so the event is a guards-plus-observation date: S2/E1 apply, and the
print is the first scoreable observation for the registered FT-5 post-print drift test
(zero size by design).

**Method.** Both instruments re-run fresh 2026-08-17 (caches busted that morning; price history
through 2026-08-14; 87 prints, 2004-10-13..2026-04-30): `earnings-cycle.mjs AAPL --bench QQQ
--peers MSFT,GOOG,AMZN` + `intraday-edges.mjs AAPL`. Read against the
[`multi-symbol-sweep.md`](../multi-symbol-sweep.md) matrix and kill list (red-teamed 2026-08-12) —
this is the event-shaped synthesis, not a re-litigation. Plus sourced web research on the date,
the July print, and the quarter's known catalysts.

**Instrument integrity caveat.** The event list ends at the 2026-04-30 print — AAPL's newest
print (2026-07-30) is absent, the sweep's known forward-window-guard blindness ("Pipeline
integrity" #3: five of eight tickers blinded to their freshest print). Every modern-era cell
below is n=14 and excludes the July print; treat them as pre-July numbers. No MRVL/CRWV-style
event-list corruption observed on AAPL (dates align with after-close 8-K cadence).

**Conviction legs, tested:**

- **S1 pre-print positioning — REFUTED (kill list, stands).** The sweep killed S1 on AAPL
  (pre-print window underperforms its own base rate) and separately killed the "AAPL late
  run-up" (vanishes net-of-QQQ, t≤0.6 — a QQQ bet in an AAPL costume). Today's fresh run
  confirms both: modern-era pre-earnings 20d mean +1.27%/win 57% vs the era's every-20d base
  +2.20%/win 64%, P(8/14 | base) = 0.7975 — the pre-print window is *worse* than a random
  20-day window. Peers run harder over AAPL's own windows (GOOG +7.02%, AMZN +6.47%, both win
  86%) — whatever runs pre-print is sector seasonality, not AAPL. No new prints since the kill;
  the re-propose bar is not met.
- **S2 never hold the print — SUPPORTED (universal guard).** Modern-era gap: mean +0.33%,
  win 50% — a literal coin flip with a −3.39% p10 (all-era p10 −4.95%). Flat by D-1 for
  unhedged paper positions (date **estimate** — an estimated date only *widens* the flat
  window, never licenses an entry timed to it).
- **S3 reaction-day fade — REFUTED for AAPL (sweep: "absent").** Fresh run: reaction-day
  fade mean −0.07%/win 57% vs an ordinary session's +0.13%/55% — nothing there. Stays inert.
- **S4 overnight-only — REFUTED (kill list #9, stands).** Sweep: AAPL's overnight edge is
  exactly zero (t=−0.04). Fresh intraday run: overnight mean −0.004%/day; overnight-only nets
  −74.9% vs buy-and-hold's +64.6% over 721 sessions. Value-destroying; keep only the
  close-side-execution preference.
- **E1 defer-the-open — SUPPORTED as a cost rule, with the AAPL caveat.** First hour carries
  29.5% of daily volatility — but also ~62% of the cumulative session return (+0.086%/day mean,
  the session's only consistently positive segment). E1 stays a
  don't-pay-the-widest-spreads rule for non-urgent entries, never a systematic skip-the-open
  (the sweep's explicit GOOG/AAPL caveat).
- **AAPL post-print drift (FT-5, the one live leg) — MIXED, registered, zero size.** Shelved by
  the sweep (positive vs-QQQ excess in all four eras but sign-only, p=0.0625 at best);
  registered as FT-5 in [`forward-tests.md`](../forward-tests.md) with this Oct print as its
  first scoreable observation. Fresh run: D+1→D+11 modern era +2.68%/win 71%, vs QQQ
  +0.65%/win 50% — still sign-only, still no promotion. Context (not a scored test, per FT-5's
  own registration note): the 07-30 post-print window ran *against* the drift — AAPL printed a
  record quarter (rev $109.4B +16%, EPS $2.02 vs $1.89 est, iPhone +22%, GM 50.1%; MacRumors/
  CNBC 2026-07-30) but guided weak on supply constraints, and the stock fell from its 07-28
  all-time-high close of $339.79 to $305.93 by 08-14 (−10%; Macrotrends/Yahoo, checked
  2026-08-17). A beat-the-quarter/lose-the-guide reaction is exactly the shape S2 exists for.

**What the quarter itself carries (sourced, 2026-08-17):**

- **Date:** Apple IR has not announced the FQ4 call; Apple confirms ~2–3 weeks before each
  report. Aggregators (WallStreetHorizon, TipRanks) carry 2026-10-29 as the cadence estimate —
  consistent with the domain table. Status stays **estimate** until the IR notice (expect it
  ~mid-October).
- **Tariffs are the quarter's swing factor.** New 10% US tariffs on imports from 60 countries
  (including all iPhone/Mac assembly countries) took effect 2026-07-24 with no exemptions
  (AppleInsider). Apple guided ~$1.1B of tariff costs into this quarter after ~$800M last
  quarter — and the July beat was flattered by an estimated $2.19B tariff *refund*
  (Axios/Yahoo Finance, 2026-07-30). India is now ~25% of iPhone production. The Oct print's
  margin line inherits the cost without the refund.
- **iPhone 18 launch sits inside the quarter but barely inside the numbers.** Event rumored
  Wed 2026-09-09 (iPhone 18 Pro/Pro Max + foldable "iPhone Ultra"; announcement expected
  ~08-26; pre-orders ~09-11, stores ~09-18 — MacRumors/Forbes/9to5Mac, Aug 2026). FQ4 ends
  late September, so only ~2 weeks of iPhone 18 sales land in the reported quarter — the
  FQ1 *guide* (launch quarter, rumored $100–200 price increases, ~$2,000 foldable) is where
  the launch actually prices.
- **Compound-risk cluster.** The confirmed FOMC decision (2026-10-28, statement 14:00 ET,
  no SEP) lands the day before this estimated print, with GOOG/META estimated the same day
  and AMZN estimated on the print day itself — the calendar already flags it as a
  compound-risk day. Any post-print read on AAPL will be contaminated by mega-cap peers
  printing within ±24h.

**What the conditions support.** Guards only: S2 (flat through the print) and E1 (non-urgent
entries after the first hour) — both no-alpha claims, both universal. Zero-size observation:
FT-5's first scoreable window, D+1→D+11 off the actual print date once confirmed. Nothing else:
no pre-print long (killed twice over), no fade (absent), no overnight structure (killed).

**Honest limits.** Date is a cadence estimate (D-73 today — well before the IR notice window).
Modern-era cells are n=14 and blind to the 2026-07-30 print (instrument debt, not repaired
here). No consensus estimates or implied move are findable this far out. The tariff-cost and
launch-quarter reads are directional context, not tested hypotheses.

## Stance & kill switches

**Stance (date: estimate).** No position, no pre-positioned play — AAPL is a kill-list symbol
for every positioning-shaped playbook (S1, late run-up, S4, S3). S2 applies to any paper AAPL
exposure a bot happens to hold: flat by D-1 of whatever date IR eventually confirms; while the
date is an **estimate**, the flat window is read conservatively wide, never used to time an
entry. E1 applies to any non-urgent AAPL execution as a standing cost rule. The single live
interest is **FT-5** (post-print drift, long close D+1 → close D+11, zero size, registered in
[`forward-tests.md`](../forward-tests.md)) — this print is its first scoreable observation,
scored from re-run instrument data after D+11.

**Kill switches.**

- *Stance itself (no-play):* killed only by evidence clearing the sweep's stated bars — ≥3 new
  prints showing a repriced regime for a killed hypothesis, or FT-5 completing its 2–3-print
  pass count. Nothing short of that re-opens a pre-print play.
- *FT-5:* vs-QQQ excess ≤ 0 or win ~50% over ~6 prints → kill (as registered; not restated
  here as a new test).
- *The date:* an IR announcement that moves the print off 2026-10-29 re-keys every window in
  this doc — recompute D-counts on confirmation, and nothing date-keyed becomes actionable
  before `confirmed`.
- *The cluster read:* if GOOG/META/AMZN dates confirm away from the 10-28/10-29 cluster, drop
  the compound-risk framing rather than carrying it stale.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-73 | Initial research banked (above); both instruments fresh (cache busted today), event list blind to the 07-30 print (known guard debt). Adjacency: **peer prints** — none since 08-15; next NVDA 08-26 (confirmed) · MRVL 08-27 (confirmed) · AVGO 09-02 (announced, a day before the calendar's 09-03 estimate — already proposed via the NVDA doc's same-day row). **Macro** — none since 08-15 (weekend); next CPI 09-11, FOMC 09-16 (both on calendar); the 10-28 FOMC (confirmed) lands D-1 before this estimated print — compound-risk cluster with GOOG/META (est. 10-28) and AMZN (est. 10-29). **VIX** — 14.56 Fri 08-15, a 2026 low, but SKEW +6.6% m/m and Brent +6%/wk: calm index, rising tail-hedge demand. **Geopolitical** — 10% tariffs on 60 countries in effect since 07-24, no exemptions; AAPL guided ~$1.1B tariff cost into this quarter after a ~$2.19B refund flattered the July beat. **Event tape** (date **estimate**) — no consensus/implied move findable at D-73; stock −10% off the 07-28 ATH ($339.79→$305.93 by 08-14) on the weak-guide reaction, logged as FT-5 context only. Dated find: iPhone 18 event rumored Wed **09-09** (announcement expected ~08-26) — proposed as an estimate event. | — (stance set) | 2026-08-24 (critical, 61+d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
