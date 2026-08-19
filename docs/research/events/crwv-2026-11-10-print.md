# CRWV earnings print — crwv-2026-11-10-print

**Kind:** earnings · **Date:** 2026-11-10 (estimate, 8-K cadence off 2026-08-11 midday print) · **Impact:** critical
**Last assessed:** 2026-08-17

## At a glance

**TL;DR.** No CRWV play survives scrutiny — every alpha-shaped read (pre-print run-up, gap
direction, reaction fade, post-print bleed) is kill-listed or under a live forward-test on just
n=4 prints of anecdote. The only durable rules are the universal guards: **S2 — never hold through
the print**, and **E1 — don't trade the open**. Treat CRWV as a two-sided variance name (±10–19%
single-night tails, both directions), not a trend. The Nov-10 print is an **estimate** (IR silent;
honest window Nov 9–16) and would land on a **confirmed CPI day**.

| Horizon | Call | Why |
|---|---|---|
| Today | Stand aside · E1 | No CRWV-specific catalyst; two-sided variance — defer the open. |
| This week | Watch FT-3 | [Forward-test 3](../forward-tests.md) scores ~Aug 19/26 — settles whether the post-Q2 melt-up holds or bleeds. Observe, don't position. |
| This month | Trades by proxy | High-beta to the semi complex — NVDA 8/26, MRVL 8/27, AVGO 9/2 reprice AI-infra long before CRWV's own print. |
| This quarter | Flat the print (S2) | Stand aside directionally into the est. Nov 9–16 window; guide bar $3.45–3.6B, backlog $104B, from a price that already paid ~+37% for Q2. |

**Signals & conditions** — the buy/sell/hold triggers, from the stance's kill switches:

- **No buy signal exists** — S1 pre-print positioning is kill-listed (its +8% D-5→D cell fails its own base-rate *and* peer controls; NVDA/AMZN rally over CRWV's own windows).
- **Hold-aside is the base case** — implied has *under*-priced realized; ±10–19% tails both ways.
- **Sell / avoid** — never hold through the print (S2); no directional gap bet either way (kill-list #4); no post-print chase until FT-3 scores.
- **Watch (dated)** — FT-3 **Aug 19 / 26** · semi-complex reprice **Aug 26–Sep 2** · IR date confirm **~late Oct** · CPI collision **Nov 10** · VIX regime (2026-low ~14.6, elevated tail-hedge demand).

## Initial research

**The question.** CoreWeave prints Q3 2026 on 2026-11-10 (calendar status: **estimate** — IR has
announced nothing; see the date finding below). Eighty-five days out: do any of the house
playbooks ([`multi-symbol-sweep.md`](../multi-symbol-sweep.md)) license anything into this print,
and what does the post-Q2 tape change?

**One-line verdict.** Stand aside directionally and treat every CRWV print as a two-sided
variance bomb: n=4 is anecdote, every alpha-shaped CRWV read is killed or under live forward-test
(FT-3 scores Aug 19/26), the stock has already re-rated ~+37% in the week since the Q2 beat, and
the only house rules that apply are the universal guards S2 and E1 — all estimate-labeled, with
the date itself only cadence-derived and a confirmed CPI release sitting on the same day.

**Method.** Fresh runs of both instruments today (cache busted 2026-08-17 upstream of this
session): `earnings-cycle.mjs CRWV --bench QQQ --peers NVDA,MSFT,AMZN` (4 prints,
2025-08-12..2026-05-07) and `intraday-edges.mjs CRWV` (341 hourly sessions,
2025-03-31..2026-08-14). Read against the sweep's per-symbol verdicts and kill list — the
2026-08-12 red-team is not re-litigated — plus sourced web research on the date, the Q2 print's
out-of-sample reaction, and adjacencies.

**Instrument integrity caveat (verified live, not repaired).** The sweep's known CRWV pipeline
debt is still present in this run: the study's event list ends at **2026-05-07**, so the newest
print (**2026-08-11**) is excluded by the forward-window guard even though price history runs
through 2026-08-14 — every earnings cell below is blind to the freshest and most contrarian
out-of-sample point. Separately, that 8-K carries a **midday** filing timestamp (the calendar
source string) while press coverage reports an after-close release and call
(investors.coreweave.com PR + call transcript, both 2026-08-11; CNBC 2026-08-11) — either way the
instrument's after-close reaction template misaligns for that print. And the first study print is
2025-08-12: the 2025-05-14 IPO-era print is excluded too (the one that gapped green — the root of
kill-list #4). Treat all n=4 cells as directional anecdote, not evidence.

**Conviction legs, tested:**

1. **S1 pre-print positioning bid — REFUTED** (kill list, sweep 2026-08-12; unchanged today).
   Fresh run agrees: D-5→D is +8.14%/75% win but the D-20 control gives P(2/4 | own base rate)
   = 0.638, D-20→D excess is **−10.36%** vs baseline, and the peer control is decisive — NVDA
   (+6.13%/75%) and AMZN (+3.08%) rally over CRWV's *own* pre-print windows. AI-beta, not a
   CRWV edge, on an n=4 anecdote besides. No re-proposal; the kill list's new-evidence bar is
   unmet.
2. **S2 never hold the print — SUPPORTED, with feeling.** The study's four gaps: mean −10.35%,
   win 0%, p10 −13.74%. The excluded newest print then gapped **~+18.6% up** (D+1 2026-08-12;
   NEWS: Motley Fool 08-12, trendspider 08-12). That is not a contradiction — it is the S2 case
   stated twice: single-night tails of 10–19% in *both* directions, on a name whose options
   implied ~15.5% into Q2 vs a ~16.75% average realized print move (NEWS: TipRanks pre-print
   preview, Aug 2026). Flat through the print for any unhedged paper position — and because the
   date is an **estimate**, "the print" means the whole honest window (see leg 8), not one
   night. Estimates widen caution; they never license.
3. **Directional gap read ("CRWV gaps always down") — stays REFUTED** (kill list #4). This
   fresh run's 0%-win gap cell is the windowing artifact wearing new paint: the excluded
   2025-05-14 print gapped green and the excluded 2026-08-11 print gapped ~+18.6% up. Recorded
   here so the clean-looking n=4 table never resurrects the kill.
4. **Post-print bleed (the ugly D+1..D+21) — MIXED, under live test.** Fresh cells are
   maximally ugly: D+1→D+6 −12.95%/0% win, D+1→D+11 −10.67%/25%, all deeply negative vs QQQ.
   But every one of those cells excludes the 2026-08-11 print, whose post-window did the exact
   opposite: +18.6% D+1, "pause" Friday 08-14 (NEWS: Benzinga 08-14), a multi-month high
   ~$117.30 by the 08-15/16 press cycle vs ~$85 pre-print (NEWS: Motley Fool 08-15, TipRanks
   pre-print) — roughly +37% in a week. FT-3 ([`forward-tests.md`](../forward-tests.md),
   registered 2026-08-12, not duplicated here) scores exactly this at D+6 ≈ 08-19 and D+11 ≈
   08-26. Until it scores, the bleed template is neither deployable nor dead — but the newest
   observation is loudly against it.
5. **S3 reaction-day fade — REFUTED as deployable.** n=4 (fade mean −7.16%, win 0% — same
   blind cells), decaying per the sweep (−11.4→−3.6 across the sequence), contradicted by the
   newest print's up-and-hold reaction day, and shorting is blocked regardless. Nothing here
   meets any bar.
6. **E1 defer the open — SUPPORTED.** First hour carries 34.5% of daily volatility at −0.139%
   mean return (win 45%); the 09:30 half-hour shows 2.45x average 5-min range. Cost rule for
   any non-urgent entry, print week or not.
7. **S4 overnight carry, ex-print nights — conditional, still blocked, and not about this
   event.** Fresh run: overnight-only Sharpe 2.00 vs buy-and-hold 1.22, break-even ~29.7 bps —
   fatter than the sweep's measured ~13.4 bps/side kill line because this window now contains
   the post-Q2 overnight rally; the gate is unchanged (MOC/MOO + measured slippage
   instrumentation, the blocked queue for Eric). By construction it excludes print nights, so
   it licenses nothing here.
8. **The date and the event tape — MIXED, and the date is the finding.** IR has **not**
   announced a Q3 date (checked investors.coreweave.com overview + events, 2026-08-17; the Q2
   cycle got its own date-announcement PR, so expect the Q3 one ~2–3 weeks prior).
   Aggregator cadence models say **Nov 16** (NEWS: TipRanks/Nasdaq earnings pages, checked
   2026-08-17) vs our 8-K-cadence **Nov 10** — honest window **~Nov 9–16** until IR speaks.
   And **CPI (Oct data) is confirmed for 2026-11-10, 08:30 ET** (BLS, on our own calendar) —
   if the print lands on the cadence date, print day opens with a macro release: a
   compound-risk day like the Oct-28 FOMC/GOOG/META collision already flagged on the calendar.
   The bar: management guided Q3 revenue **$3.45–3.6B** vs $3.43B prior consensus (~158% y/y
   mid), FY26 raised to $12.4–13.2B on $35–39B capex, backlog $104B excluding $25B+ of
   fresh Q3 commitments (IR PR 2026-08-11; Seeking Alpha 08-11) — so consensus will re-form
   at the guide and the whisper above it, from a share price that already paid ~+37% for the
   Q2 news. Press risk framing: debt-funded capex, customer concentration (NEWS: Benzinga
   08-15). Implied move for a November expiry is not meaningfully quotable at D-85; the Q2
   pattern (implied ~15.5%, realized ~18.6%) is the working prior.

**What the conditions support.** Nothing directional, at D-85 on an estimated date. The
deployable set is the universal pair: S2 (flat through the honest print window, estimate-dated)
and E1 (no open-auction entries). The live work between now and the next check is free
observation: FT-3 scores Aug 19/26 and settles whether the post-print bleed template is dead;
the fall semi prints (NVDA confirmed 08-26, MRVL 08-27, AVGO 09-02 — see
[`nvda-2026-08-26-print.md`](nvda-2026-08-26-print.md) /
[`mrvl-2026-08-27-print.md`](mrvl-2026-08-27-print.md)) will reprice the whole AI-infra complex
CRWV trades inside long before November.

**Honest limits.** n=4 print cells — anecdote, not evidence — and all four blind to the newest,
template-breaking print (caveat above); one intraday regime (2025–26, IPO-era, includes a
post-print melt-up week); SEC filing dates proxy announcement times and demonstrably misalign on
this symbol (midday filing vs press-reported after-close release); consensus/implied-move
figures are press-reported (NEWS-grade), not exchange-derived by us; and the event date is a
cadence **estimate** disagreeing with aggregator models by ~a week — research reports the
window, action may not use it.

## Stance & kill switches

**Stance (event date: estimate, 8-K cadence; IR silent as of 2026-08-17; honest window
~Nov 9–16).**

- **No pre-print directional entry** (estimate) — S1 is killed on CRWV; the fresh run's pretty
  D-5→D cell fails its own base-rate and peer controls on n=4. *Killed by:* nothing short of
  the kill list's stated new-evidence bar (new prints with clean controls); no fall setup can
  meet it before this event.
- **Flat through the honest print window (~Nov 9–16) for any unhedged paper CRWV position
  until IR confirms the date, then flat through the confirmed print night** (estimate) — S2,
  priced live: ±10–19% single-night tails in both directions, implied moves that have
  *under*-priced realized. *Killed by:* the kill-list bar only — ≥3 new prints showing a
  repriced gap regime; the hold-the-print family is 0-for-3 (AVGO/META/NVDA) and CRWV's Q2
  +18.6% gap is one observation, not a license.
- **No directional gap read, either way** (estimate) — "always down" is kill-list #4; "now it
  gaps up" is one print. *Killed by:* n/a — this is a refusal to bet a coin flip, not a view.
- **No post-print bleed fade and no post-print chase** (estimate) — the bleed template (4/4
  negative D+1→D+6) is under live FT-3 test with the newest print running hard against it;
  until FT-3 scores (~Aug 19/26) neither direction has evidence. *Killed/changed by:* FT-3's
  scored outcome — a confirmed template break retires the bleed read entirely; a surprise
  reversion revives it as forward-test-only. Either way the update lands in this ledger.
- **No options structure proposed** (estimate) — no researched implied-vs-realized study exists
  for CRWV beyond one quarter's NEWS-grade figures; at D-85 there is nothing quotable to
  structure against. *Killed by:* a registered study pricing CRWV's implied-vs-realized print
  history; until then this is an honesty stance, not a market view.

Scoreable predictions this stance implies are listed for registration via this scan's
structured output (date-window test; implied-vs-realized underpricing; bleed-template
observation #2) — FT-3 already owns the August print's post-window and is not duplicated.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-85 | Initial research banked. Instruments fresh (cache busted upstream): S1 cells fail controls (P=0.638, peers rally same windows); gap cell 0%-win but blind to the excluded 08-11 print's ~+18.6% up-gap — forward-window blindness confirmed live and caveated, not repaired. Date: IR silent; aggregators model **Nov 16** vs our cadence **Nov 10** — honest window ~Nov 9–16 (estimate); **CPI (Oct data) confirmed same day 11-10, 08:30 ET** — compound-risk day if cadence holds. Tape (all NEWS-grade): Q2 beat 08-11 ($2.6B, +112% y/y), Q3 guide $3.45–3.6B vs $3.43B consensus, FY26 $12.4–13.2B on $35–39B capex, backlog $104B ex-$25B+ new commitments; stock ~$117 multi-month high, ~+37% post-print wk — bleed template broken so far, FT-3 scores 08-19/08-26. Peers: no prints since 08-15 (weekend); NVDA **confirmed** 08-26 + MRVL 08-27 + AVGO 09-02 reprice the complex well before Nov (dated confirmations already proposed by the sibling scans, see their docs). Macro since 08-15: none; Jul CPI (08-12) in-line 3.4% predates. VIX 14.56 on 08-15 — 2026 low — with elevated SKEW/tail-hedge demand (per today's NVDA scan). Geopolitical: standing export/tariff regime, no new action touching CRWV's GPU supply chain. CoreWeave "Fully Connected" conference reported for September — no exact date discoverable, so not proposable yet. | — (stance set) | 2026-08-24 (critical, 61+d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
