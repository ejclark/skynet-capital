# MRVL earnings print — mrvl-2026-08-27-print

**Kind:** earnings · **Date:** 2026-08-27 (confirmed, IR: investor.marvell.com PR 2026-08-03 — Thu Aug 27 1:45pm PT call (post-close)) · **Impact:** critical
**Last assessed:** 2026-08-26

## At a glance

**TL;DR.** MRVL prints in two days and there is nothing to do about it but get flat. The date is now
**confirmed** (IR, after close). No pre-print entry exists — S1 is killed on this symbol, and the
August re-rating of roughly **+29%** means the seasonal run-up already paid out, to holders of
product-news exposure rather than to print positioning. Implied is about **14%**, which is the live
price of ignoring the flat rule, and there is no researched defined-risk structure here: at that
implied, long premium and short premium are both uninstrumented bets. Post-print is not a chase
either — tested windows win ≤48% with excess near zero, and D+1 is macro-confounded by the Warsh
keynote.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no pre-print entry | High | S1 killed on MRVL; the run-up shape already paid out in the +29% August re-rating | FT-1 passing its registered 2-of-3-prints test with the NVDA-sympathy control clean |
| This week | **Flat by the 2026-08-27 close (S2)** | High | ~14% implied on a confirmed after-close print; nothing pays for carrying that overnight | ≥3 new prints showing a repriced gap regime — the hold-the-print family is 0-for-3 |
| This month | **No post-print chase D+1 → D+6** | High | Tested post windows win ≤48% with excess ≈ 0, and **2026-08-28** is confounded by the Warsh keynote | A registered post-print study clearing its controls; none exists |
| This quarter | **No options structure — stay uninstrumented** | Medium | With ~14% implied and no priced implied-vs-realized history for MRVL, both premium sides are guesses | A study pricing MRVL's implied-vs-realized print history |

**Signals & conditions** — the buy/sell/hold triggers:

- **Flat by the 2026-08-27 close** — the IR-reported 1:45pm PT call is after close, so the deadline only tightens.
- **Never** — hold unhedged MRVL through a ~14% implied print for the gap.
- **Never** — sell or buy premium here; there is no instrumented view, and that is an honesty stance, not a market view.
- **Watch (dated)** — the print **2026-08-27** after close · Warsh's Jackson Hole keynote **2026-08-28**, landing on D+1 · NVDA's print **2026-08-26**, the sympathy input on D-1.
- **Re-opens the late-week bid only if** — FT-1 clears its 2-of-3 test sympathy-decontaminated.

## Initial research

**The question.** MRVL prints fiscal Q2 FY2027 on 2026-08-27 (calendar status: **estimate**;
see the date-confirmation finding below). Ten days out: do any of the house playbooks
(S1/S2/E1/S3/S4, [`multi-symbol-sweep.md`](../multi-symbol-sweep.md)) license a position into
this print, and what does the event tape say about the setup?

**One-line verdict.** Stand aside directionally: every MRVL alpha playbook is killed or
shelved-to-forward-test, the stock has already re-rated ~+29% this month into a ~14% implied
move, and NVDA's confirmed Aug-26 print the night before makes MRVL's own pre-print window
substantially a sympathy bet — the live work is zero-size observation (FT-1) plus the universal
guards (S2, E1), all estimate-labeled.

**Method.** Fresh runs of both instruments today (cache busted 2026-08-17 upstream of this
session): `earnings-cycle.mjs MRVL --bench QQQ --peers NVDA,AVGO,AMD` (21 prints,
2021-06-07..2026-05-27) and `intraday-edges.mjs MRVL` (721 hourly sessions,
2023-09-18..2026-08-14). Read against the sweep's per-symbol verdicts and kill list — the
2026-08-12 red-team is not re-litigated here — plus sourced web research on the date, consensus,
implied move, and adjacencies.

**Instrument integrity caveat (verified live, not repaired).** The sweep's known MRVL event-list
corruption is still present in this run: the quarter-dedup kept **2021-08-03** (a non-print
Item-2.02 8-K) and dropped the real **2021-08-26** print, and kept **2025-05-06** (the
investor-day-adjacent filing) while dropping the real **2025-05-29** print — confirmed by
re-deriving the filing list from EDGAR today. So the modern-era cells (n=14) carry one corrupt
event date and are missing one real print; treat all per-window means as directional, not exact.
The newest print (2026-05-27) **is** included this run — the forward-window guard did not blind
MRVL this time.

**Conviction legs, tested:**

1. **S1 pre-print positioning bid (long D-20, flat D-5) — REFUTED** (kill list, sweep
   2026-08-12; unchanged today). Fresh run agrees: modern-era D-20→D is +9.70%/79% win but
   P(11/14 | its own base rate) = 0.083, not significant, and the peer control is decisive —
   NVDA (+10.66%/79%), AVGO (+6.38%/71%) and AMD (+8.63%/57%) all rally over MRVL's *own*
   pre-print windows. Sector/AI-beta seasonality, not a MRVL edge. No re-proposal; the kill
   list's new-evidence bar is not met.
2. **Semi late-week bid (long close D-5 → close D) — MIXED, forward-test only** (FT-1,
   [`forward-tests.md`](../forward-tests.md) — registered 2026-08-12, not duplicated here).
   Fresh run: modern-era D-5→D +4.87%/79% win, but the sweep measured p=0.080 and ~70% of the
   window return arriving via NVDA-sympathy gaps. This cycle the confound is live by
   construction: NVDA's **confirmed** Aug-26 print sits inside MRVL's D-5→D window
   (est.-dated Aug 21→27). Observation #1, zero size; FT-1's registered kill switch already
   covers the sympathy case.
3. **S2 never hold the print — SUPPORTED, with feeling.** Fresh run: modern-era overnight gap
   mean −0.28%, win 43%, p10 −16.44% / p90 +17.12% — a fat-tailed coin flip, exactly the
   sweep's all-eight verdict. The options market currently agrees: ~14% implied move
   (TipRanks, Aug 2026), a ~$36B market-cap swing priced for one night. Flat by the Aug-27
   close (estimate-dated) for any unhedged paper position.
4. **S3 reaction-day fade — REFUTED on MRVL** (kill list: absent, not inverted). Fresh run
   unchanged: reaction-day session +0.67%/57% vs an ordinary session's +0.01%/51% — no fade
   edge, and the S3 class effect lives in mega-cap software/ads, not semis. (Cell subject to
   the corruption caveat above.)
5. **E1 defer the open — SUPPORTED.** First hour carries 30.3% of daily volatility at −0.019%
   mean return; 5-min resolution shows 2.35x average range at 09:30. Cost rule for any
   non-urgent entry, print week or not.
6. **S4 overnight-only — no deployment.** Overnight-only Sharpe 1.19 edges buy-and-hold's 1.06
   but needs 15.8 bps/side break-even against our 5 bps assumption ceiling being generous;
   the sweep already filed this as the market-wide overnight anomaly, not symbol edge. Keep
   only as structure (prefer close-side executions).
7. **The event tape: the bar is high and already partly paid — MIXED.** Date: an IR press
   release dated **2026-08-03** (investor.marvell.com) sets the Q2 FY2027 call for **Thursday,
   Aug 27, 2026, 1:45pm PT** — after the close, matching the calendar's estimate exactly; the
   IR page was re-verified centrally and the `confirmed` flip ships in the same PR as this doc
   (estimate labels below were written pre-flip and stay as the cautious floor). Consensus:
   non-GAAP EPS ~$0.93 on
   ~$2.71B revenue (+35% y/y); a Polymarket contract implies ~67.5% beat probability. But MRVL
   is up roughly +29% since early August on the AI-memory infrastructure portfolio unveil
   (Bravera SC6 / Structera X / Photonic Fabric, ~Aug 6–12) — the "run-up" the killed S1 shape
   would have chased has substantially already happened, pre-D-10, on product news rather than
   print positioning. Elevated expectations into a ~14% two-sided implied move is a setup that
   punishes in-line results.

**What the conditions support.** Nothing directional. The deployable set is the sweep's
universal pair: S2 (flat through the print night, estimate-dated Aug 27) and E1 (no open-auction
entries). FT-1 gets its first observation scored after the window closes (~Aug 28). Post-print
windows (D+1→D+6/D+11) tested flat-to-negative with win ≤48% in every cut — no post-print
chase either, and the D+1 session (Aug 28) collides with the new Fed chair's first Jackson Hole
keynote (see ledger), macro-confounding any reaction-day read.

**Honest limits.** n=14 modern-era print cells, one of them corrupt and one real print missing
(caveat above); one intraday regime (2023–26 bull); SEC filing dates proxy announcement times;
the implied-move and consensus figures are press-reported (NEWS-grade), not exchange-derived by
us; and the calendar date remains an estimate in the domain table until a PR carries the IR
confirmation — research reports it, action may not use it.

## Stance & kill switches

**Stance (event date: estimate in the calendar; IR press release 2026-08-03 matches it —
confirmation is reportable here, not actionable until the calendar PR flips the status).**

**Update, 2026-08-19 pulse:** the calendar's `status` field now reads `confirmed`, resolving this
date-confirmation caveat — future assessments may drop the "estimate" softening on the date
itself, while every other estimate-labeled figure below (implied move, consensus, run-up
characterization) keeps its label. No leg below changed in substance; see the 2026-08-19 ledger
row for the adjacency sweep that confirmed this.

- **No pre-print directional entry** (estimate) — S1 is killed on MRVL and the kill list's
  new-evidence bar is unmet; the August re-rating (+~29%) means the seasonal run-up shape has
  largely paid out already, to holders of product-news exposure, not print positioning.
  *Killed by:* FT-1 passing its registered 2-of-3-prints test with the NVDA-sympathy control
  clean — that promotes the late-week bid and reopens the question; nothing short of that does.
- **Flat by the Aug-27 close for any unhedged paper MRVL position** (estimate; the IR-reported
  1:45pm PT call time is after-close, so the estimate date only tightens this, never widens
  it) — S2, with a ~14% implied move as the live price of ignoring it. *Killed by:* the
  kill-list bar only — ≥3 new prints showing a repriced gap regime (the hold-the-print family
  is 0-for-3 across AVGO/META/NVDA).
- **No options structure proposed** (estimate) — unlike NVDA's P1, MRVL has no researched
  defined-risk structure, and with ~14% implied both long-premium and short-premium are
  uninstrumented bets here. *Killed by:* a future study that prices MRVL's implied-vs-realized
  print history; until then this is an honesty stance, not a market view.
- **No post-print chase D+1→D+6** (estimate) — post windows tested win ≤48%, excess ≈ 0, and
  Aug 28 is macro-confounded by the Warsh keynote. *Killed by:* a registered post-print study
  clearing controls; none exists.

Scoreable predictions this stance implies are listed for registration in
[`forward-tests.md`](../forward-tests.md) via the structured output of this scan (implied-move
overstatement; NVDA-sympathy D-1 coupling) — FT-1 already covers the late-week window and is
not duplicated.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-10 | Date: IR press release 2026-08-03 sets the call Thu Aug 27 1:45pm PT (after-close) — matches the calendar estimate; confirmation PR proposed, table untouched. Tape: consensus ~$0.93/$2.71B (+35% y/y), implied move ~14% (~$36B swing), Polymarket ~67.5% beat-implied; MRVL +~29% since early Aug on the AI-memory portfolio unveil — bar elevated, run-up pre-paid. Peers: no prints since 08-15; NVDA **confirmed** Aug 26 = the night before (sympathy channel ~70% of MRVL window returns, per sweep). Macro: Jul CPI (08-12) in-line at 3.4%, Sep hike odds faded; Jul jobs soft; **Jackson Hole Aug 27–29, Fed chair Warsh's first keynote Fri Aug 28 morning = MRVL's D+1** (proposed as event). VIX 14.56 on 08-15, 2026 low, with reported tail-hedging demand — cheap index vol vs fat single-name implied. Geopolitical: no new MRVL-touching export action (Jan-2026 25% Section 232 semi tariff regime unchanged; China chip-tariff decision deferred to 2027). Also proposed: MRVL Investor Day Oct 6, NYC (IR release 08-03). Instruments fresh; known MRVL event-list corruption confirmed live and caveated. | — (stance set) | 2026-08-19 (critical, 8-20d band: every 2d) |
| 2026-08-19 | D-8 | Instruments re-run (cache busted, fresh 08-19): every conviction leg reproduces the 08-17 figures near-exactly (S1 D-20→D +9.70%/79%, p=0.084; FT-1 D-5→D +4.87%/79%; S2 overnight −0.28%/43% win, p10 −16.44/p90 +17.12; S3 reaction-day +0.67%/57% vs ordinary +0.01%/51%; peer control NVDA +10.66%/AVGO +6.38%/AMD +8.63% over MRVL's own windows; E1 first-hour 30.4% of vol; S4 overnight Sharpe 1.16 vs buy-hold 1.06, still needs 15.5bps break-even) — no instrument-level change. **Date status: calendar now reads `confirmed`**, resolving the prior estimate caveat. Peers: NVDA's Aug-26 print unchanged/confirmed; consensus firmed to ~$91.8B rev (+67% y/y), Vera Rubin-ramp commentary now the headline watch item — sympathy-gap read unchanged. AVGO: VMware vCenter CVE-2026-59310 active-exploit news hit the stock, then a "buy the dip" rebound; AVGO's own print stays Sept 2 (already tracked, outside MRVL's window) — noise, not signal, for MRVL. Macro: no CPI/jobs/FOMC decision since 08-17; July FOMC minutes released today (08-19) showing a 9-3 vote with the first three-way hawkish dissent since 2016 — same-day release, no forward calendar entry proposed (would age out immediately). Vol: VIX 15.86 close 08-18, up from the 08-15 low of 14.56 but still a low regime — no term-structure stress. Geopolitical: no new export-control/tariff action; Jan-2026 H200-to-China framework unchanged. Tape: MRVL +5.54% Mon 08-17 (close $234.33) then **−8.32% Tue 08-18** in a broad AI-capex-fear semis selloff tied to rising Treasury yields (MU −7.16%, SNDK −9.05%, AVGO/AMD/INTC also down), partially offset by a same-day bullish UBS AI note — the run-up has **stalled and partially round-tripped**, not extended cleanly; consensus and the ~14% implied move unchanged. | Confirmed-status caveat resolved (see Stance note); substantive stance unchanged | 2026-08-21 (critical, 8-20d band: every 2d) |
| 2026-08-24 | D-3 | Instruments re-run clean, cache busted (history through 8/21): S1 run-up 11/14 positive, p=0.086, still NOT SIGNIFICANT (unchanged read — same as every prior row, this leg has never survived its control for MRVL); D-5→D leg +4.87%/79% win, reaction-day +0.67%/57% — all figures reproduce near-exactly, no instrument-level change. **Major tape event since D-8:** Marvell disclosed a Google/Alphabet commercial deal 8/19 (warrant for ~7% of MRVL shares at $206.58, ~$12.2B strike, vesting on business Google drives to Marvell) — MRVL spiked **+5.79% to $251.01 on 8/20**, then gave essentially the entire move back, closing **$237.04 on 8/21** and trading ~$236 intraday 8/24 — a round trip, not a sustained re-rating. Implied move for the 8/27 print has **jumped to ~18.4%** (~$40 swing, ~$36B market-cap implied) from ~14% at D-8/D-10 — the Google-deal uncertainty priced meaningfully more volatility into the print itself, not just a one-day pop. Peers: NVDA reports the night before (8/26) as already tracked; NVDA's own implied move dropped to ~5.3% over the same window — MRVL's elevated implied move is idiosyncratic (Google-deal-driven), not sympathy with NVDA. AVGO still unreported (9/2). Macro: no CPI/jobs/FOMC surprise since 8/19; VIX 15.13, calm regime. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the escalation — same finding as sibling docs. No new dated adjacency found. | — (S2/E1 discipline unchanged; the Google deal is a fundamental re-rating question for the post-print stance, not a pre-print entry signal) | 2026-08-27 (event day; next assessment is this event's own outcome) |
| 2026-08-26 | D-1 | Instruments re-run clean, cache busted (history through 8/25): every conviction leg reproduces the D-3 figures near-exactly — S1 modern-era run-up 11/14 positive, p=0.0871, still NOT significant; D-5→D +4.87%/79% win; reaction-day +0.67%/57% vs ordinary +0.01%/51%; peer control unchanged (NVDA +10.66%/79%, AVGO +6.38%/71%, AMD +8.63%/57% over MRVL's own windows); E1 first-hour still the vol-heavy no-edge window; S4 overnight Sharpe 1.23 vs buy-and-hold 1.12, needs 16.2bps break-even — no instrument-level change, the kill-list verdicts stand. **Load-bearing new finding: the implied move has repriced sharply back down.** Fresh options reads (Barchart/TipRanks, checked today) show **~8.5%** implied — down hard from the ~18.4% recorded at D-3 (8/24) and even below the ~14% level at D-8/D-10 — the Google-deal volatility premium has substantially deflated in the 2 sessions since. One aggregator page (MarketBeat) surfaced a conflicting "$0.67 EPS / $2.01B revenue, Aug 28" figure that is almost certainly a stale cached 2025-vintage page (its own URL slug reads "2025-08-21") — disregarded, not used; the operative consensus stays the IR-era ~$0.93 EPS / ~$2.71B revenue figure from the D-10 row, unchanged. Tape: MRVL **+4.49% to $239.60 on 8/25** (pre-earnings call volume 2.7x normal, calls leading puts 2:1) — a continuation of the recovery off the 8/21 round-trip low, not a fresh leg down; the Google-deal digestion reads net-constructive into the print, even as its priced-volatility premium fades. Peers: NVDA reported this evening (after this pulse ran) — the D-1 sympathy window closes with today's session; AVGO still unreported (9/2). Macro: FOMC Sep 15–16 odds now ~73% hold/26% hike/1% cut (Kalshi, checked today), firming toward hold since the D-8 hawkish-hold-60-70% read. Volatility regime: VIX ~15.8, still calm, no break. Geopolitical: Strait of Hormuz escalated further (tanker hit off Oman 8/25) — no MRVL-specific export-control change found. No new dated adjacency to propose. | — (S2/E1 discipline unchanged into the print; the sharp implied-move deflation is noted as tape context, not a stance trigger — no options structure is proposed either way per the standing honesty stance) | 2026-08-27 (event day; next assessment is this event's own outcome) |
| 2026-08-26 (post-NVDA print, ~22:45 UTC) | D-1 | **The sympathy input resolved POSITIVE:** NVDA reported after today's close — revenue **$96.2B** vs ~$93–95B consensus (+106% y/y), EPS $2.22, stock **+4.2% after hours** (Kiplinger live blog / marketbeat, checked tonight). This is precisely FT-1's conditional (NVDA-beat sympathy supplied ~70% of MRVL's D-5→D return historically) — expect a sympathy gap-up bias at MRVL's 8/27 open; **observation #1 scores after tomorrow's close, zero size, per FT-1's registration.** Note NVDA's +4.2% AH lands *below* its ~5.3% implied (D-3 row) — a beat, not a repricing shock. Tape: TipRanks tonight reads MRVL implied ~**10.6%** (vs ~8.5% Barchart earlier today — source/time spread, both well off the 18.4% peak); Polymarket beat-probability ~**0.88** (up from 0.675 at D-10) — a beat is now consensus; only guidance above the elevated bar pays. Owner context: Eric's directional conviction (AI data-center demand, backlog) is registered as a potential conviction-lane entry — it is an anti-S2 override that only he can size and flip, on the record; nothing in tonight's data meets the kill-list bar to change the house calls. | — (stance unchanged; sympathy gap now expected but FT-1 is observation-only; S2 flat-by-close stands with ~10.6% implied as its live price) | 2026-08-27 (event day; next assessment is this event's own outcome) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
