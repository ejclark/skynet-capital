# META earnings print — meta-2026-10-28-print

**Kind:** earnings · **Date:** 2026-10-28 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-08-24

## At a glance

**TL;DR.** Stand aside directionally and let the guards do the work. META's print is a known-date
variance bomb — 2026 tails run ±10% in a single night — and no META-specific edge survived the
sweep's red team. The one genuinely new fact, the market's punish-capex-then-forgive reaction to Q2,
*raises* event risk without licensing a trade. Date is an **estimate** (D-64), and an estimate only
ever widens caution.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | No META-specific edge survived the red team, and nothing since 2026-08-12 resurrects one | ≥3 new prints showing a repriced gap regime — the only stated bar |
| This week | **Nothing to do** | High | The date is unconfirmed and no catalyst sits between here and the IR announcement | IR confirms a date ≠ **2026-10-28**, re-keying the S2 flat-by date |
| This month | **Watch FT-4's score, not the tape** | Medium | The July stand-aside window scores ~**2026-08-27**; a real signal either way rewrites the post-print leg | FT-4 scoring on 2026-08-27 with signal in either direction |
| This quarter | **S2 and E1 only — flat across the print** | High | ±10% single-night tails with no edge to pay for them; the capex reaction raises risk, not opportunity | Nothing kills a no-alpha guard; shorting unblocking activates S3 on MSFT first, META only as a lean |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — take a directional META position into the print; the tails are ±10% and nothing pays for them.
- **Never** — treat the punish-capex-then-forgive pattern as a signal; it is a risk observation, not an edge.
- **Watch (dated)** — FT-4 scores ~**2026-08-27** · IR date announcement, expected ~**2026-10-07** · estimated print **2026-10-28**, the same day as the confirmed FOMC statement.
- **If shorting unblocks** — the S3 mega-cap fade activates on MSFT first; META is a direction-only lean, never at MSFT sizing.
- **Re-opens the gap-capture kill only on** — ≥3 new prints showing a repriced gap regime.

## Initial research

**The question, plainly.** META reports Q3 2026 around 2026-10-28 (**estimate**). What is likely
to happen, how will the market react, and do any house playbooks apply — given the sweep already
killed most META-shaped alpha on 2026-08-12?

**One-line verdict:** No directional edge survives on META — this print is a guard-rails event
(S2 flat-by-print, E1 execution discipline) into a newly volatile reaction function: the July
Q2 print showed the market now punishes capex/EPS softness hard (−9.6% after hours) and then
forgives fast (full recovery within ~2 weeks).

**Method.** Both instruments re-run fresh 2026-08-17 (cache busted earlier today):
`earnings-cycle.mjs META --bench QQQ --peers GOOG,MSFT,AMZN` (56 prints, 2012-07-26..2026-04-29,
history through 2026-08-14) and `intraday-edges.mjs META` (721 sessions, 2023-09-18..2026-08-14,
hourly + 5-min). Read against the house playbooks exactly as
[`multi-symbol-sweep.md`](../multi-symbol-sweep.md) characterizes them for META, plus sourced web
research on the Q2 print, Q3 consensus, and the print date. **Instrument caveat (known debt, not
repaired here):** the earnings-cycle event list ends at the 2026-04-29 print — META's real newest
print (2026-07-29) is absent, consistent with the sweep's forward-window-guard blindness
("Pipeline integrity" item 5). Every "modern era n=14" figure below therefore excludes the July
print — whose −9.6% after-hours reaction is precisely the tail the excluded sample understates.

**Conviction legs tested:**

1. **S1 pre-print positioning on META — REFUTED** (sweep kill list, re-confirmed by today's
   re-run). Modern-era D-20 run-up is +4.91%/win 71%, but the control kills it: P(10/14 | the
   era's own 63% base) = 0.3762, not significant — and peers run *harder* over META's own
   pre-print windows (GOOG +5.85%/86%, AMZN +5.14%, MSFT +3.69%): sector seasonality wearing a
   META costume. No pre-print entry, at any window (date **estimate** — irrelevant, since no
   entry exists to time).
2. **Hold-the-print / gap-capture — REFUTED** (kill list #6; anti-S2). The 2023–26 gap mean
   +4.74%/win 64% looks seductive; the sweep showed it t=1.69-fragile against a −24.26% p10 in
   2020–22, win rate indistinguishable from an ordinary overnight. Today's re-run reproduces the
   same shape (ALL-era gap win 59%, p10 −7.48%). The 2026-07-29 print — outside the instrument's
   corrupted window — gapped ~−9.6% after hours on a *revenue beat* (EPS miss on legal/severance
   charges, FCF $784M, capex guide raised to $130–145B; tradingkey.com / investing.com
   transcripts, 2026-07-29/30). Fresh out-of-sample confirmation that the gap is bought
   insurance, not income. S2 applies with feeling (date **estimate**: flat-by-D-1 must key off
   the IR-confirmed date, not the cadence estimate).
3. **S3 reaction-day fade — MIXED, inert.** Direction-only lean per the sweep (META never
   cleared the corrected bar; MSFT/GOOG did). Re-run: modern reaction-day session −0.70%/win 29%
   vs an ordinary session's +0.07%/51% — the lean persists but shorting is blocked, so this stays
   observation-only (registered below as a zero-size forward-test candidate, subject to the
   caller's register).
4. **Post-print drift — MIXED, negative-leaning.** D+1→D+21 vs QQQ is negative in 3 of 4 eras
   (modern −1.25%/win 43%); the stand-aside read is already registered as FT-4 in
   [`forward-tests.md`](../forward-tests.md) (scores ~2026-08-27 on the July print — do not
   duplicate). Nothing here licenses a post-print entry either way.
5. **The reaction function has repriced — SUPPORTED (new since the sweep).** Q2 2026 (07-29):
   revenue $60.8B beat (+28% y/y) yet the stock fell ~9.6% after hours on the EPS miss and capex
   fear, dropped toward a 52-week low, then rallied ~25% off the low with reports of a fresh
   all-time high by mid-August (barchart/nasdaq, 2026-08-12; vantagemarkets August outlook). The
   October print's bar is therefore **margins and capex discipline, not revenue** — Q3 guide is
   $61–64B (company, 07-29), street consensus ~$63.1–63.3B revenue / ~$6.95 EPS (TipRanks /
   Investing.com aggregates, checked 2026-08-17). Both surprise directions are live: another
   EPS/FCF miss meets a stock that has round-tripped back to highs.
6. **Intraday structure — E1/S4 as characterized.** First hour carries 31.7% of daily vol at
   −0.003% mean (E1 supported: defer non-urgent entries); overnight carries ~75 of the 87.2
   total buy-and-hold points, but no timing strategy beats buy-and-hold net of 5bps (S4 kill
   stands; keep only the close-side execution preference).

**What the conditions support:** guard rails only. S2 (universal, no-edge claim): any paper
position flat by D-1 of the **IR-confirmed** date — until confirmation, the cadence estimate
only widens caution (treat the whole 10/26–10/30 mega-cap week as the danger window). E1 for any
execution near the event. No S1-family entry; no gap-hold; no stacking with the GOOG pre-print
long (GOOG prints the same estimated day — the sweep's one-trade-eight-slots warning applies
verbatim).

**Honest limits.** Instrument sample excludes the July 2026 print (known pipeline debt); all
modern intraday numbers are one 2023–26 bull regime; the date is a cadence **estimate** (Meta IR
listed no upcoming events as of 2026-08-17 — aggregators converge on Wed 10-28 AMC, and Meta's
own Q3 cadence, 2024-10-30 and 2025-10-29, both last-Wednesday-of-October, is consistent);
implied move is not meaningfully quotable at D-72 and was not found from a primary source.

## Stance & kill switches

**Stance (date estimate throughout):** stand aside directionally; enforce S2 and E1. The print
is a known-date variance bomb whose 2026 tails run ±10% single-night; no META-specific edge
survived the sweep's red team and nothing since 2026-08-12 resurrects one. The one genuinely new
fact — the market's punish-capex-then-forgive reaction to Q2 — raises event risk without
licensing a trade (estimates only widen caution, never license action).

**Kill switches / what changes this stance:**

- **IR confirms a date ≠ 2026-10-28** → the S2 flat-by date re-keys immediately; the estimate
  never anchors action.
- **≥3 new prints showing a repriced gap regime** → the only stated bar for revisiting the
  gap-capture kill (sweep rule); nothing less reopens it.
- **Shorting unblocks** → the S3 mega-cap fade class activates on MSFT first, META only as the
  lean it is (direction-only, never at MSFT sizing).
- **FT-4 scores ~2026-08-27** → if the July stand-aside window shows real signal either way, the
  post-print leg of this stance gets rewritten with that receipt.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-72 | Initial research banked; both instruments fresh (event list ends 2026-04-29 — the 2026-07-29 print is missing per the sweep's known forward-window blindness; caveated, not repaired). Date hunt: Meta IR lists no upcoming events (checked 2026-08-17); aggregators converge Wed 10-28 AMC — stays **estimate**. Adjacency: no peer prints since 08-15 (weekend); NVDA 08-26 confirmed / MRVL 08-27 confirmed / AVGO 09-02 announced — all already proposed via the NVDA doc's 08-17 row; no macro prints since 08-15; VIX 14.56 Fri 08-15 (2026 low) with SKEW +6.6% m/m and Brent +6.0%/wk — calm index, rising tail-hedge demand; no new export-control/policy action touching META. Event tape (**estimate**): Q3 consensus ~$63.1–63.3B rev / ~$6.95 EPS vs company guide $61–64B; stock has round-tripped the July −9.6% AH selloff back toward highs (~25% off the low); implied move not quotable at D-72. FT-4 (META post-print stand-aside) scores ~08-27, before this doc's next check. | — (stance set) | 2026-08-24 (critical, 61+d band: every 7d) |
| 2026-08-24 | D-65 | Adjacency sweep. Event tape: date convergence on 10/28 holds (TipRanks/Investing.com "confirmed," one Wall Street Horizon page still flags "unconfirmed") — no Meta IR primary posted, stays **estimate**. Consensus drifted slightly: EPS ~$6.75 (from ~$6.95 at D-72), revenue ~$63.26B (essentially unchanged from ~$63.1-63.3B) — normal estimate-revision noise, not material. Peers: NVDA/MRVL both report this week (own docs); AVGO's XPV overhang deepened (own doc). Macro: no CPI/jobs surprise since 8/17; Sep-16 FOMC read is 68.4% hold/31.6% hike as of 8/20 (FOMC sibling doc). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs. No new dated adjacency found. | — (no change; too far out for a substantive stance shift) | 2026-08-31 (critical, 61+d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
