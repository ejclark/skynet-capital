# GOOG earnings print — goog-2026-10-28-print

**Kind:** earnings · **Date:** 2026-10-28 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-08-24

## At a glance

**TL;DR.** GOOG is the one name on the roster with a *planned* pre-print play — and it is not open,
and cannot open while the date is an **estimate**. IR confirmation is the unlock; without it there is
no entry, full stop. If it confirms, the run-up hold is small (the pooled −3.39% p10 is the sizing
anchor), exits at the close of D, and never rides through the print. Two overhangs could sour the
window itself: the pending ad-tech remedies ruling and capex/equity supply. Everything below inherits
the estimate label.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — D-64 is outside the window and the date is unconfirmed | High | The run-up entry point is ~D-20; an estimated date never keys an entry at any distance | IR confirms the date, moving the ~**2026-09-28** entry point into play |
| This week | **No action; watch abc.xyz/investor** | High | Aggregators split on 10-27 vs 10-28, which is exactly why the label stays estimate | An IR posting that confirms or moves the **2026-10-28** date |
| This month | **Prepare the run-up, don't pre-empt it** | Medium | Entry is only live if confirmation lands before the ~D-20 point; no confirmation, no cycle | No IR-confirmed date by ~**2026-09-28** — the play dies for this cycle |
| This quarter | **Flat by the Oct-26 close (S2); exit at D's close if long** | High | Never hold through the print; and if any other pre-print long is live, GOOG takes the slot alone — stacking is one leveraged AI-beta bet | A mid-window break below the pooled −3.39% p10 stops the position out |

**Signals & conditions** — the buy/sell/hold triggers:

- **No confirmation, no entry** — the single hard gate on this play; date-keyed action requires `confirmed`.
- **Size small, one slot** — the pooled p10 **−3.39%** is the sizing anchor, and GOOG takes the pre-print slot alone or not at all.
- **Exit at the close of D** — never through the print, whatever the run-up did.
- **Discretionary early exit** — an adverse ad-tech remedies ruling or a fresh equity-supply event landing inside the window; logged when taken.
- **Watch (dated)** — IR confirmation (nothing posted as of 2026-08-24) · entry point ~**2026-09-28** · FOMC **2026-10-28** on the estimated print day itself.

## Initial research

**The question.** Alphabet prints Q3 2026 in ~10 weeks (date **estimate**). What is likely to
happen, how will the market react, and which house playbooks — if any — does this event license?

**One-line verdict.** This is the roster's one live directional candidate — GOOG's pre-print
run-up hold (long close D-20 → close of D) is the sole sweep survivor and today's fresh run still
passes its base-rate control — but the entry stays gated on IR date confirmation, sized small,
never stacked with peers, and this cycle carries two new hazards the instrument cannot see: a
July print that *fell on a beat* (capex), and an estimated print date that lands on FOMC
statement day.

**Method.** Both instruments run fresh 2026-08-17 (cache busted upstream today):
`earnings-cycle.mjs GOOG --bench QQQ --peers MSFT,META,AMZN` (43 prints,
2015-10-22..2026-04-29, history through 2026-08-14) and `intraday-edges.mjs GOOG` (721 sessions,
2023-09-18..2026-08-14). Read against the [`multi-symbol-sweep.md`](../multi-symbol-sweep.md)
matrix and kill list — the sweep red-teamed all of this on 2026-08-12; this doc is the
event-shaped synthesis plus what changed since. Sourced web research for the date, the July
out-of-sample print, and the regulatory tape.

**Instrument integrity caveat (material this cycle).** The sweep's known forward-window-guard
debt applies to GOOG: the study's newest print is **2026-04-29** — it is blind to the
**2026-07-22 Q2 print** (CNBC live coverage dated 2026-07-22; IR transcript filed under
`doc_events/2026/Jul/22`). That print is the modern sample's most important stress case: revenue
$119.8B (+24%), Cloud +82%, EPS beat — and the stock *fell* (~3.65% after hours per Investing.com
recap) on a 2026 capex guide raised to $195–205B and negative Q2 free cash flow (−$5.9B). Every
modern-era (2023–26, n=14) cell below excludes it. Numbers are quoted honestly with that hole
named, not repaired here.

**Conviction legs, tested.**

- **"GOOG pre-print run-up pays" (the sweep's lone surviving long) — SUPPORTED, with sharpened
  caveats.** Fresh run: D-20 → D modern era n=14 mean +7.77%, win 93%, excess vs QQQ +5.31%;
  pooled 43 prints mean +4.99%, win 86%, p10 −3.39%. The base-rate control still passes:
  P(13/14 positive | the era's own 65% every-20d base) = 0.0191 → SURVIVES, matching the sweep's
  2026-08-12 read (pooled p=0.0008, degrading to 0.003–0.012 under overlapping-window
  uncertainty — evidence AT the corrected bar, not past it). The attribution caveat also
  reproduces: peers run hard over GOOG's own windows (META +6.81%/79% win, AMZN +5.81%/79%,
  MSFT +3.14%) — a large share is mega-cap earnings-season seasonality, so this is **never
  stacked** with any other pre-print long. New this cycle, unseen by the instrument: the July
  capex-punished reaction and the ~$84.75B equity raise (Simply Wall St / tradingkey coverage,
  Aug 2026 — largest US equity raise on record; stock ~−11% over the past month into ~$345).
  A month-long supply/capex overhang is exactly the regime in which a seasonality-heavy run-up
  can fail; it does not kill the leg (the kill list's bar is unmet), it argues for the sweep's
  own instruction: deploy **small**, sized to the pooled −3.39% p10.
- **"Never hold the print" (S2) — SUPPORTED, universal.** Fresh run: gap modern win 57%, mean
  +0.67%, p10 −7.03 / p90 +6.89 — a fat-tailed coin flip. The unseen July print (beat → fell on
  capex) is one more demonstration that the overnight verdict is not predictable from the
  fundamentals. The run-up hold's exit at the **close of D** is designed around exactly this.
  Flat through the print (date **estimate**, so the no-hold window widens to cover Oct 27–29).
- **"Reaction-day fade" (S3) — SUPPORTED as a measurement, blocked as a trade.** Fresh run
  reproduces the sweep: modern fade mean −0.59%, win 29% (pooled win 30%, sweep p=0.0014 — at
  the family-corrected line, behind MSFT). Shorting is locked, so this stays observation-only.
  This cycle's D+1 is additionally a poor test: if the print lands 10/28 (**estimate**), day D
  itself is **FOMC statement day** (confirmed, federalreserve.gov calendar: meeting Oct 27–28,
  statement 14:00 ET — already in this calendar as `fomc-2026-10-28`) and D+1 carries AMZN/AAPL
  est. prints — any reaction move is contaminated in both directions.
- **"S4 / intraday structure" — REFUTED for round-trips, SUPPORTED as execution shape.** Fresh
  intraday run: every timing strategy loses to buy-and-hold net of 5bps (best b/e 4.6bps);
  kill-list item 9 stands — S4 was outright value-destroying on GOOG. E1 holds *as a cost rule
  only*: the 09:30 bar carries 30.0% of daily volatility, **but** on GOOG the first hour carries
  most of the return (+0.081%/bar, 58.1 of the 67.0 total session points) — the sweep's explicit
  caveat that E1 on GOOG is never a systematic skip-the-open, just don't pay the open's spread
  for a non-urgent entry.
- **"The fundamental bar" — SUPPORTED as context (not a trade).** The July print self-raised the
  bar: 24% revenue growth and 82% Cloud growth *was not enough* against a $195–205B capex guide
  and negative FCF. October's likely fight is the same one — Cloud acceleration vs. the capex /
  equity-supply narrative — now with the DOJ ad-tech **remedies ruling still pending** from Judge
  Brinkema (closing arguments were 2025-11-21; Digiday/AdExchanger coverage confirms no ruling as
  of Aug 2026; no date → not a calendar event, but it can land any day, including inside the
  D-20 window). The search-case final judgment (Dec 2025, behavioral remedies) is the settled
  half.

**What the conditions support.** One small conditional long plus guards: the GOOG D-20 run-up
hold (entry ~close of D-20, ≈ late Sep, exit close of D) — **licensed only after the date is
IR-confirmed** per the date policy, sized small per the sweep, never stacked with other pre-print
longs; S2 flat through the estimate-widened Oct 27–29 window; E1 as execution hygiene. **Honest
limits:** modern cells are n=14 *minus the July print*; the date is a cadence estimate with
aggregators split 10/27 vs 10/28; one intraday regime (2023–26 bull); the run-up's attribution
is part sector seasonality; and this cycle's event week (FOMC + four mega-cap prints in three
days) makes single-name reads suspect.

## Stance & kill switches

**Stance (date is an estimate — every statement below inherits that label).** The pre-print
run-up hold is the *planned* play, not an open one: no entry today (D-72 is outside the window
and the date is unconfirmed), and no date-keyed entry ever occurs while the date stays
**estimate** — IR confirmation is the unlock, small size (pooled p10 −3.39% is the sizing
anchor), exit at the close of D, never through the print (estimate). If the date confirms and
other pre-print longs are live anywhere on the roster, GOOG takes the slot alone or not at all —
stacking is one leveraged AI-beta bet (estimate). S2 with the estimate-widened window: any paper
GOOG exposure flat by the Oct-26 close, flat through Oct 29 until confirmation narrows it
(estimate). S3 fade stays blocked on the shorting lock and this cycle would be a contaminated
test regardless (FOMC on est. day D, AMZN/AAPL on D+1) (estimate). The capex/equity-supply
overhang and the pending ad-tech remedies ruling are the two watch items that could sour the
run-up window itself (estimate).

**Kill switches.**

- *Date leg:* IR confirmation (abc.xyz/investor — nothing posted as of 2026-08-17) on any date
  other than 10-28 re-derives every D-count here; aggregators already split (TipRanks 10-27 vs
  WallStreetHorizon 10-28-unconfirmed), which is exactly why the estimate label stays.
- *Run-up leg:* dies for this cycle without an IR-confirmed date before the D-20 entry point
  (~Sep 28, estimate) — no confirmation, no entry, full stop. Dies structurally per the sweep's
  own terms if the window fails its base-rate control on fresh prints (the close-out re-run is
  observation #1); an adverse ad-tech remedies ruling or a fresh equity-supply event landing
  inside the window is a discretionary early-exit trigger, logged when taken, and a mid-window
  break below the pooled p10 (−3.39% from entry) is the sizing stop.
- *S2/no-hold leg:* nothing kills it — it is a no-alpha guard; the only revision path is the
  kill list's new-evidence bar (≥3 new prints showing a repriced gap regime).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-72 | Initial research banked. Instruments fresh but blind to the 2026-07-22 Q2 print (event list ends 2026-04-29 — known forward-window-guard debt); that print is the headline new info: big beat (rev $119.8B +24%, Cloud +82%) yet fell ~3.65% AH on the capex raise to $195–205B and negative FCF — plus the ~$84.75B equity raise and a ~−11% month into ~$345, an overhang the run-up thesis has never been tested against. Run-up control still SURVIVES on fresh data (13/14, P=0.0191). Date hunt: Alphabet IR has no Q3 date posted; aggregators split 10/27 (TipRanks) vs 10/28 (WallStreetHorizon, unconfirmed) — stays **estimate**. Adjacency: est. day D collides with the FOMC statement (confirmed, 14:00 ET 10/28, already in calendar as `fomc-2026-10-28`); peer prints MSFT est. 10/27, META est. 10/28, AMZN/AAPL est. 10/29 already in earnings-calendar; near-term NVDA 8/26 confirmed, MRVL 8/27, AVGO 9/2 (proposed in the NVDA doc's 8/17 row) — no new dated events to propose. DOJ ad-tech remedies ruling still pending, undated (Brinkema; closings 2025-11-21) — tail risk inside the run-up window, tracked here not on the calendar. No macro prints since 8/15 (weekend). VIX 14.56 Fri 8/15 (2026 low) but SKEW +6.6% m/m and Brent +6.0%/wk — calm index, rising tail-hedge demand. | — (stance set) | 2026-08-24 (critical, 61+d band: every 7d) |
| 2026-08-24 | D-65 | Adjacency sweep. Event tape: date split unchanged (TipRanks "confirmed" 10/27 vs Wall Street Horizon "unconfirmed" 10/28) — Alphabet IR still has no Q3 date posted, stays **estimate**. DOJ ad-tech remedies ruling **still pending** — checked SEC 10-Q filings (Q1/Q2 2026) and press, no ruling issued since the September 2025 remedy hearings; tail risk stays undated and untracked on the calendar, as before. Peers: NVDA/MRVL both report this week (own docs); AVGO's XPV overhang deepened (own doc). Macro: no CPI/jobs surprise since 8/17; Sep-16 FOMC read is 68.4% hold/31.6% hike as of 8/20 (FOMC sibling doc). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs. No new dated adjacency found. | — (no change; too far out, DOJ ruling remains the live undated tail risk) | 2026-08-31 (critical, 61+d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
