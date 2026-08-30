# AAPL earnings print — aapl-2026-10-29-print

**Kind:** earnings · **Date:** 2026-10-29 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-08-30
<!-- probe-ref: {"symbols":{"AAPL":319.7},"vix":14.43,"daysBand":"critical:21+","adjacentIds":["amzn-2026-10-29-print","consumer-confidence-2026-10-27","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","meta-2026-10-28-print","midterm-elections-2026-11-03","msft-2026-10-27-print","pce-2026-10-29"],"screenStreak":0} -->

## At a glance

**TL;DR.** There is no AAPL trade here, and that is the finding — the sweep killed every
positioning-shaped playbook on this symbol, so the print is a **guards-plus-observation date**, not
an opportunity. The pre-print window is measurably *worse* than a random 20-day window (+1.27%/win
57% against the era's +2.20%/win 64%), and holding the print unhedged is a coin flip with a fat left
tail (gap mean +0.33%, win 50%, p10 −3.39%). Date is an **estimate** (8-K cadence, D-65) — that only
widens the flat window, it never licenses an entry. The one live interest is FT-5, at zero size.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no pre-print play exists | High | S1, the late run-up, S3 and S4 are all killed on AAPL; the pre-print window underperforms its own base rate | ≥3 new prints clearing the sweep's bars for a killed hypothesis (earliest read ~2027-07) |
| This week | **Nothing to do** — the date is unconfirmed | High | At D-65 no consensus or implied move is findable, and an estimated date never keys action | An IR announcement confirming or moving the **2026-10-29** print (notice window ~2026-10-01) |
| This month | **Watch the date, not the trade** | Medium | The pre-print catalysts are now dated, not tradeable: the iPhone 18 event is Apple-confirmed for **2026-09-09**, and the Ternus CEO handover takes effect **2026-09-01** | AAPL closes ≥10% below the 2026-08-28 close of $319.90 on iPhone-18 or CEO-transition news, which would be a fundamentals move this no-play stance does not model |
| This quarter | **Flat by D-1 (S2); FT-5 only, zero size** | Medium | The gap is a coin flip with a −3.39% p10 — nothing pays for holding it; post-print drift is the only untested edge left | FT-5 vs-QQQ excess ≤ 0 or win ~50% over ~6 prints, scored after D+11 (~2026-11-16) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — hold unhedged AAPL shares through the print for the gap (killed: win 50%, p10 −3.39%).
- **Never** — open a pre-print position off the estimated date; date-keyed action needs `confirmed`.
- **FT-5 only** — long close D+1 → close D+11, zero size, scored from re-run instrument data.
- **Watch (dated)** — IR print-date confirmation ~**2026-10-01** · Ternus CEO handover **2026-09-01** ·
  iPhone 18 event **2026-09-09** (Apple-confirmed 08-26, 10:00 PT) · FOMC **2026-10-28**, landing D-1 of
  the estimated print, ahead of GDP + PCE both **2026-10-29**.
- **Re-opens the no-play only if** — ≥3 new prints show a repriced regime for a killed hypothesis.

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
| 2026-08-24 | D-66 | Adjacency sweep. Event tape: iPhone 18 event date unchanged at rumored **9/9**, still no official Apple announcement this session (Forbes/9to5mac/MacRumors coverage through 8/22 all still frame it as the leading prediction, invitation itself predicted ~8/26, two days from now) — stays proposed-estimate, not upgraded. **New fundamental thread since D-73:** press (tradingkey, checked 8/24) now flags 3nm-chip-supply shortages and rising memory prices constraining iPhone/Mac/iPad shipment volumes into Q4 — a supply-side risk distinct from the tariff-cost thread the D-73 row logged; worth carrying into the October print's bar alongside the ~$1.1B tariff-cost guide. AAPL stock **$301.86 as of 8/21**, lowest since July — softer than the $305.93 cited at D-73, continued drift down, not a reversal. Consensus price target $326.34 (+5.5% implied) unchanged in direction. Peers: NVDA/MRVL both report this week (own docs); AVGO's XPV overhang deepened (own doc). Macro: no CPI/jobs surprise since 8/17; Sep-16 FOMC read is 68.4% hold/31.6% hike as of 8/20 (FOMC sibling doc). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs; the 10% blanket tariff regime unchanged. No new dated adjacency found beyond the already-proposed iPhone 18 event. | — (no change; supply-constraint thread noted as a new watch item, not yet a stance trigger) | 2026-08-31 (critical, 61+d band: every 7d) |
| 2026-08-30 | D-60 | Full pulse (this ledger carried **no probe-ref block**, so the deterministic screen could not run — `no-reference-baseline`; baseline established in this row's header). Band transition **critical:61+ → critical:21+**, reassessment interval 7d → 3d. **Event tape — the iPhone 18 date is now primary-confirmed.** Apple sent press invitations 08-26 ("Surprise and Shine"), and apple.com/apple-events/ states "Watch a special Apple Event on **9/9 at 10 a.m. PT**" (fetched 2026-08-30) — so `aapl-iphone-18-launch-2026-09-09` flips estimate → **confirmed** with an `IR:` primary in this PR. The D-66 row's this-month falsifier (Apple confirming a date *away* from 9/9) did **not** fire. **New fundamental thread — the CEO handover.** John Ternus becomes CEO effective **2026-09-01**, Tim Cook to executive chairman (apple.com newsroom, announced 2026-04-20, re-checked 08-30); press flags analyst-downgrade risk at the handover. The 10-29 print (date **estimate**) would be the **first print under a new CEO** — guide credibility is an untested unknown, which widens S2's case and proposes no play. No calendar entry filed for it: `EventKind` has no corporate-governance slot (gap banked in `docs/IDEAS.md`). **Symbol** — AAPL **$319.70** (probe; the 08-28 close corroborated at $319.90 by CNN/stockanalysis) vs **$301.86** on 08-21: **+5.9%**, past the probe's 5% materiality bar, erasing the post-print drawdown and back within ~7% of the $344.27 52-week high. Consensus PT **$324.45** (44 analysts, S&P Global via stockanalysis, checked 08-30) vs $326.34 at D-66 — the target sat still while spot rallied, so sell-side implied upside compressed **+5.5% → +1.5%**. Context for a stand-aside, not a signal. **Peers** — no AAPL peer (MSFT/GOOG/AMZN) printed; all report inside the 10-27/10-29 cluster. Sector reads are uniformly beat-and-sell: NVDA 08-26 beat ($96.22B rev / $2.22 EPS vs $92.37B / $2.10) on a decelerating Q3 guide, +8.7% on 08-27 then **−3.40%** on 08-28; MRVL 08-27 clean beat, **−7.6% AH** on margin compression (sibling [`avgo`](avgo-2026-09-02-print.md) doc, checked 08-29). Three beat-then-sell reactions in one week — the same shape AAPL's own 07-30 print made, and exactly what S2 exists for. **Macro** — Warsh's first Jackson Hole keynote as chair landed hawkish 08-28 (12-month PCE 3.7%, core 3.3%, "underlying trends" not improved): September hike odds repriced **~35% → 56–59%** on CME futures, ~47–48% on Kalshi (CNBC/Benzinga, checked 08-30). That repricing runs straight into the **confirmed 10-28 FOMC** sitting D-1 to this print. **New adjacency in the ±5d corridor since D-66** (all registered by sibling research, nothing proposed here): `consumer-confidence-2026-10-27` (estimate), `gdp-q3-2026-advance-2026-10-29` (confirmed), `pce-2026-10-29` (confirmed), `midterm-elections-2026-11-03`, plus `msft-2026-10-27-print` — the compound-risk day is now three federal releases, five mega-cap prints and an FOMC inside 72 hours, and the FY2027 funding-lapse branch (10-01) could delete or delay the federal legs. **Volatility** — VIX **14.43** vs 15.13 at D-66 (−0.70, well inside the 3-point bar): a calm index against a hawkish repricing, no regime shift. **Geopolitical** — the Trump–Xi summit **2026-09-24** is already on the calendar as an estimate keyed to semis; AAPL carries its China exposure directly, carried here as sector risk with no edit to that entry. India cut 7.5%/5% tariffs on phone components in July 2026 (MacRumors/9to5Mac), a partial offset to the ~$1.1B tariff-cost guide; the 10% blanket regime is unchanged. | — (no change; the iPhone-18 date upgrades rumour → confirmed and the new-CEO thread is added — both widen S2's caution, neither opens a play) | 2026-09-02 (critical, 21+d band: every 3d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
