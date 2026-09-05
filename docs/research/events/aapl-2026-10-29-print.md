# AAPL earnings print — aapl-2026-10-29-print

**Kind:** earnings · **Date:** 2026-10-29 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{"AAPL":319.97},"vix":14.32,"daysBand":"critical:21+","adjacentIds":["amzn-2026-10-29-print","consumer-confidence-2026-10-27","durable-goods-2026-10-27","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","ism-manufacturing-2026-11-02","meta-2026-10-28-print","midterm-elections-2026-11-03","msft-2026-10-27-print","pce-2026-10-29","sloos-2026-11-02","treasury-borrowing-estimates-2026-11-02"],"screenStreak":0} -->

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
| This month | **Watch the date, not the trade** | Medium | The pre-print catalysts are dated, not tradeable: the iPhone 18 keynote is Apple-confirmed for **2026-09-09** and the Ternus handover **executed 2026-09-01**. The one live *fundamental* thread is supply — Apple's own FQ4 guide (+9–11% rev, iPhone mid-teens vs 17.6% est) blamed chip/memory shortages, and Nikkei (09-04) puts foldable output at a few hundred units/day against the tens of thousands needed | AAPL closes ≥10% below the 2026-08-28 close of $319.90 on iPhone-18 or CEO-transition news, which would be a fundamentals move this no-play stance does not model |
| This quarter | **Flat by D-1 (S2); FT-5 only, zero size** | Medium | The gap is a coin flip with a −3.39% p10 — nothing pays for holding it; post-print drift is the only untested edge left | FT-5 vs-QQQ excess ≤ 0 or win ~50% over ~6 prints, scored after D+11 (~2026-11-16) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — hold unhedged AAPL shares through the print for the gap (killed: win 50%, p10 −3.39%).
- **Never** — open a pre-print position off the estimated date; date-keyed action needs `confirmed`.
- **FT-5 only** — long close D+1 → close D+11, zero size, scored from re-run instrument data.
- **Watch (dated)** — IR print-date confirmation ~**2026-10-01** · Ternus CEO handover **effective
  2026-09-01, executed** ·
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
| 2026-09-02 | D-57 | Full pulse — the deterministic probe fired **material** on adjacency alone (`new-adjacent-event` ×3); price and VIX both sat inside their bars. **New adjacency in the ±5d corridor** — all three registered by sibling research on 08-31, nothing proposed here: `ism-manufacturing-2026-11-02` (estimate, high), `sloos-2026-11-02` (confirmed, low), `treasury-borrowing-estimates-2026-11-02` (confirmed, low). All three land **11-02**, which sits *inside* FT-5's D+1→D+11 window (~10-30 → ~11-13) alongside the `midterm-elections-2026-11-03` entry — logged now as a scoring caveat: FT-5's first scoreable observation will be contaminated at both ends (five mega-cap prints + FOMC on the front, three macro releases + the midterms on the back), which is a reason to read its vs-QQQ excess sceptically, not a reason to skip the zero-size test. **Symbol** — AAPL **$325.13** (09-01 close) vs $319.70 at D-60: **+1.70%**, well inside the 5% bar; path was $316.85 on 08-31 then **+2.61%** on 09-01, the handover session. Consensus PT **$324.45** unchanged (44 analysts, S&P Global via stockanalysis, checked 09-02) while spot rallied through it — sell-side implied upside **+1.5% → −0.2%**, i.e. the average target now sits *below* the tape. Rosenblatt lifted its PT $300 → $303 on 09-01 and kept **Neutral**, an explicit ~4% downside call framed on the CEO transition. Context for a stand-aside; never a signal. **Event tape — the handover executed.** John Ternus became CEO effective **2026-09-01**, Tim Cook to executive chairman (apple.com newsroom; US News / The Apple Post, 09-01) — the D-60 row's watch item is now fact, and the 10-29 print (date **estimate**) is confirmed as the first under a new CEO. The tape did not punish it. **Event tape — the 09-09 lineup narrowed.** Apple's confirmed 09-09 "Surprise and shine" event is now expected to carry only iPhone 18 Pro / Pro Max / foldable Ultra, with the base iPhone 18, 18e and Air 2 deferred to **spring 2027** (9to5Mac / AppleInsider 08-26; Tom's Guide / Yahoo Tech through 09-01); Pro tier rumoured +$200–350, Ultra ~$1,999–2,500. That reshapes the FQ1 *guide* this print delivers — higher ASP on a narrower unit base — not FQ4's reported quarter (~2 weeks of sales, unchanged from D-73). **Supply — the price hike now reads as margin defence, not expansion.** TechInsights puts the increase needed to fully offset memory-cost inflation and hold gross margin at ~**+$270** on the iPhone 18 Pro; Counterpoint sees DRAM up to **+40%** through Q2 2026 and IDC cuts 2026 smartphone shipments on memory costs (checked 09-02). The rumoured increase roughly *matches* the cost — so the D-66 supply-constraint thread sharpens into a specific GM risk on the FQ1 guide rather than an earnings tailwind. **Geopolitical — tariff basis clarified, and it is durable.** The 07-24 regime the D-73 row logged is **Section 301** forced-labour tariffs (10–12.5%, 60 countries), which replaced the Section 122 surcharge when that hit its 150-day statutory ceiling on 07-24 (Orrick / Holland & Knight / Morgan Lewis, Jul 2026) — there is no sunset date to wait for. Live challenge: 25 states filed in the Court of International Trade on 08-03, *State of Oregon v. Trump*, No. 26-03467; **no hearing or decision date findable**, so nothing dated to propose. A vacatur would be a margin *upside* the ~$1.1B tariff-cost guide does not carry — noted as an asymmetry, not a play. **Macro** — two prints since D-60, both mildly soft: ISM Manufacturing (Aug data, 09-01) **54.6** vs 55.6 prior with new orders 53.7 (−3.0) and prices stuck at 71.1; JOLTS (Jul, 09-01) **7.271M** vs ~7.300M consensus. The tape sold anyway (S&P 500 −0.71%, Nasdaq −1.03% on 09-01). September hike odds firmed **56–59% → ~66%** on CME FedWatch (08-31, Forbes) after Warsh — a path that runs into the confirmed **10-28 FOMC** sitting D-1 to this print. **Volatility** — VIX **16.34** vs 14.43 at D-60 (+1.91, inside the 3-point bar), off a sub-15 close on 08-31 that was the lowest monthly close since Nov 2024. Calm-but-lifting; no regime shift. **Peers** — no AAPL peer (MSFT/GOOG/AMZN) printed; all remain inside the 10-27/10-29 cluster. AVGO prints 09-02 AMC (sector read, own doc). Band unchanged at **critical:21+** (3d). | — (no change; the handover executed without incident, the tariff basis firmed and the memory-cost math sharpened the FQ1-guide margin risk — all widen S2's caution, none opens a play) | 2026-09-05 (critical, 21+d band: every 3d) |
| 2026-09-05 | D-54 | Full pulse — the probe fired **material** on adjacency (`new-adjacent-event`); price and VIX both sat well inside their bars. **Event tape — the supply thread turned into a specific, sourced constraint on the highest-ASP SKU.** Nikkei Asia (**09-04**) reports early foldable "iPhone Ultra" output running at **a few hundred units/day** against the *tens of thousands/day* industry executives say the plan requires, on surface-flatness and hinge yields, with commercial production "pushed back weeks" (corroborated MacRumors/9to5Mac 09-04; Apple's July order book was ~**10M** units for the year). AAPL closed **−2.51%** on it. This is the first *evidence* against the leg the sell side has been underwriting: DA Davidson's 09-02 Neutral/$270 note argued FY2027 needs the foldable **and** broad price increases together. It also re-anchors the D-57 "price hike as margin defence" read — a ~$270-of-cost offset only earns its margin on units that ship. **Reported-quarter caveat, unchanged:** FQ4 ends late September, so this prices the **FQ1 guide** the 10-29 print delivers, not the quarter it reports. **The bar is now company-sourced, not press-inferred:** Apple's own FQ4 guide (07-30) was **+9–11% revenue** and **mid-teens iPhone growth vs a 17.6% street estimate**, explicitly blamed on advanced-chip and memory shortages — the D-66 supply thread is management's own framing, and it is what the print gets measured against. **Symbol** — AAPL **$319.97** (09-04 close) vs $325.13 in the probe-ref: **−1.59%**, inside the 5% bar. Path matters more than the delta: $324.96 (09-02) → **$328.21** (09-03, spot closing the entire gap to the sell-side mean) → $319.97 (09-04). Week-over-week that is **+0.02%** on the 08-28 close of $319.90 — the "third straight weekly gain" headline is a rounding error Friday erased. Consensus PT **$324.53** (44 analysts, S&P Global via stockanalysis, checked 09-05) vs $324.45 at D-57: targets sat still for a third row while spot moved, so implied upside went **−0.2% → +1.43%** on price alone. Context for a stand-aside; never a signal. (The [09-09 keynote ledger](aapl-iphone-18-launch-2026-09-09.md) tracks a different 41-analyst panel at $328.62 — the two series are not interchangeable; this doc stays on the S&P Global one.) **Peers** — no AAPL peer (MSFT/GOOG/AMZN) printed; all four remain inside the 10-27/10-29 cluster. Sector read: **AVGO** printed 09-02 AMC, beat revenue and EPS, gapped **−7.76%** after hours and settled **−0.82%** on 09-03 ([own doc's close-out](avgo-2026-09-02-print.md)). That is the **fourth** beat-then-sell reaction in three weeks (NVDA 08-26, MRVL 08-27, AVGO 09-02, and AAPL's own 07-30) — the exact shape S2 exists for, and still not the ≥3-*AAPL*-print evidence the kill list requires to re-open anything. **Macro — the corridor's biggest print landed and the fork moved off it.** August payrolls (09-04, BLS primary) **+162k vs ~55k consensus**, U3 **4.1%**, participation **61.6% (+0.2pt)**, AHE **+3.1% y/y**; June/July revised **+55k combined**, turning July's −23k into **+21k**. The curve *flattened* on the beat (2y +5bp to 4.38%, 10y +1bp to 4.776%, 30y −0.5bp to 5.239%) — one hike priced, not a re-rated path. Sep-16 hike odds ran **~66% (D-57) → ~48% after Waller's 09-03 remarks → ~59–60% post-payrolls**; Waller said the decision hinges on the **09-11 CPI**, and the **FOMC blackout began today (09-05)**, so no official voice can move it before that print. Equities read it mildly negative (S&P **7,718 −0.38%**, Nasdaq −0.29%, Dow −0.51%). This is the path that runs into the **confirmed 10-28 FOMC** sitting D-1 to this print. **Volatility** — VIX **14.32** (09-04 close) vs 16.34 in the probe-ref: **−2.02**, inside the 3-point bar. The regime datum is the streak, not the level: VIX has held **14–17 for 25 consecutive sessions**, one shy of the May-1992 record of 26 (Investrade market review, 09-04). A record-length compression running into a corridor holding an FOMC, five mega-cap prints and three federal releases inside 72 hours is an asymmetry worth naming — cheap optionality if any play existed here, which none does. **Adjacency — one new dated entry in the ±5d corridor** since D-57: **`durable-goods-2026-10-27`** (estimate, medium; Census release schedule, registered by sibling research 09-01). Nothing proposed here — the corridor is now two macro prints on 10-27, the FOMC on 10-28, two confirmed federal releases on 10-29, three more on 11-02 and the midterms on 11-03, around four mega-cap peers. **Geopolitical** — no change: the Section 301 basis (10–12.5%, 60 countries, no sunset) stands, and *State of Oregon v. Trump* (CIT 1:26-cv-01472, filed 08-03) still has **no findable hearing or decision date** on a second consecutive check, so there is again nothing dated to propose. Band unchanged at **critical:21+** (3d). | — (no change; the foldable-yield report is the first hard evidence against the FQ1-guide upside leg and a fourth beat-then-sell peer reaction reinforces S2 — both widen caution, neither opens a play, and neither meets the kill list's re-propose bar) | 2026-09-08 (critical, 21+d band: every 3d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
