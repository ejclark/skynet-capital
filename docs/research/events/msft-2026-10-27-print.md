# MSFT earnings print — msft-2026-10-27-print

**Kind:** earnings · **Date:** 2026-10-27 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-08-24

## At a glance

**TL;DR.** No MSFT position and no pre-print entry at any horizon — S1 and the D-10 run-up are killed
on this symbol and stay killed. The guards are the whole stance: flat by the Oct-26 close and stay
flat until the date is IR-confirmed. The S3 fade is blocked twice over (the shorting lock, plus a
queue item on hold until the July 2026 reaction session is measured), and this cycle would be a poor
test regardless — the confirmed FOMC statement owns the afternoon of Oct 28. Azure ≥45% cc is the
guided bar; consensus drift above it argues for *more* caution, never an entry. Date is an
**estimate** (D-63) and every line inherits that label.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no pre-print play exists | High | S1 and the D-10 run-up are both killed on MSFT; nothing since re-opens them | ≥3 new prints showing a repriced gap regime |
| This week | **No action; watch MSFT investor relations** | High | Aggregators split 10-27 vs 10-28, which is why the estimate label stands | An IR posting confirming or moving the **2026-10-27** date |
| This month | **Watch the Azure bar, don't trade it** | Medium | Consensus drifting above the guided ≥45% cc raises the whisper bar — that is a caution input, not an entry | Consensus settling above 45% cc before ~2026-10-06 |
| This quarter | **Flat by the Oct-26 close (S2); S3 stays on hold** | High | A no-alpha guard needs no edge to justify it; and the FOMC statement on Oct 28 contaminates any reaction-day test this cycle | A re-run showing the 2026-07-30 session leg was green, then a second consecutive green October reaction session |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — hold unhedged MSFT exposure through the print; flat by the **2026-10-26** close and stay flat until confirmation narrows the window.
- **Never** — read consensus drift above Azure ≥45% cc as bullish; a higher whisper bar is a caution input.
- **S3 stays on hold** — blocked on the shorting lock, and separately until the July 2026 reaction-session leg is measured from re-run instrument data.
- **Watch (dated)** — IR date confirmation (nothing posted as of 2026-08-24) · estimated print **2026-10-27** · FOMC statement **2026-10-28** 14:00 ET, which owns the D+1 afternoon.
- **Re-keys everything if** — IR confirms any date other than 2026-10-27.

## Initial research

**The question.** MSFT prints fiscal Q1 FY27 in ~10 weeks (date **estimate**). What is likely to
happen, how will the market react, and which house playbooks — if any — does this event license?

**One-line verdict.** Guards only: MSFT is a killed-alpha symbol (S1 and the D-10 run-up are on
the kill list; S3 is blocked and now carries a fresh out-of-sample warning from the July print the
instrument cannot see), and this cycle's reaction window is uniquely contaminated — the estimated
print date sits inside the densest event cluster of the quarter (FOMC decision Oct 28, GOOG/META
est. Oct 28, AMZN/AAPL est. Oct 29).

**Method.** Both instruments re-run fresh 2026-08-17 (cache busted upstream today):
`earnings-cycle.mjs MSFT --bench QQQ --peers GOOG,AMZN,META` (87 prints, 2004-10-21..2026-04-29,
history through 2026-08-14) and `intraday-edges.mjs MSFT` (721 sessions, 2023-09-18..2026-08-14).
Read against the [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) matrix and kill list — the
sweep red-teamed all of this on 2026-08-12; this doc is the event-shaped synthesis plus what
changed since. Sourced web research for the date, consensus, and the July out-of-sample print.

**Instrument integrity caveat (material this cycle).** The sweep's known forward-window-guard
debt applies to MSFT: the study's newest print is **2026-04-29** — it is blind to the
**2026-07-29 FY26-Q4 print**, which was the most dramatic in the modern sample (reported
2026-07-29 AMC; shares +15.5% the next day, the largest one-day market-cap gain on record, per
CNBC/TIKR coverage dated 2026-07-29/30). Every modern-era (2023–26, n=14) cell below therefore
excludes the single largest observation. Numbers are quoted honestly with that hole named, not
repaired here.

**Conviction legs, tested.**

- **"Pre-print positioning pays on MSFT" — REFUTED (kill list, standing).** S1 killed on MSFT in
  the 2026-08-12 sweep; the D-10 run-up is kill-list item 8 (modern net-of-QQQ a literal 7/14
  coin flip; win rate decays 76%→57%→58%→50% by era). Today's fresh run reproduces the surface
  numbers that seduced the original study (D-10 modern win 79%, excess +0.90%) and the same
  controls that killed it: the D-20 window fails the base-rate binomial (P=0.2088, NOT
  significant), and peers run harder over MSFT's own windows (GOOG +6.49%/93% win, AMZN +4.46%,
  META +4.19%) — sector seasonality, not MSFT edge. One new print since the kill (July, unseen by
  the instrument) does not meet the re-proposal bar. No pre-print positioning (date **estimate**).
- **"Never hold the print" (S2) — SUPPORTED, universal.** Fresh run: modern gap win 36%, mean
  +0.19%, p10 −5.33 / p90 +8.18 — a fat-tailed coin flip, exactly the sweep's read. The unseen
  July print (+15.5% next day) is one more fat tail; a tail landing green does not change the
  policy, it *is* the policy's premise. Flat through the print window (date **estimate**, so the
  no-hold window widens to cover Oct 27–29).
- **"Reaction-day fade" (S3, MSFT's strongest sweep result) — MIXED, downgraded from SUPPORTED.**
  Fresh run reproduces the sweep stat: modern fade mean −1.13%, win 7% (1/14 green), pooled
  p=3.4e-4 — still the only alpha clearing the family-corrected bar. **But** the July 2026
  reaction day (+15.5% close-to-close, then +3.02% more on D+2) is out-of-sample and unmeasured:
  the instrument cannot show the open→close leg, and a day that closes +15.5% is at real risk of
  having been a green session — which would be the first break in the post-2024 red streak.
  Unverifiable until the guard is fixed or close-out re-runs with the print in-window; treated as
  a live caution, not a kill. S3 stays **blocked** (shorting locked) regardless — so this costs
  nothing today, but the "deploy small on MSFT when shorting unblocks" queue item should not be
  acted on until the July point is scored. Additionally this cycle: if the print is 10/27 AMC
  (**estimate**), D+1 is **FOMC statement day** (Oct 28, 14:00 ET) — the reaction session would
  be macro-contaminated and a poor test of the fade either way.
- **"S4 / intraday structure" — REFUTED for round-trips, SUPPORTED as execution shape.** Fresh
  intraday run: every timing strategy loses to buy-and-hold net of 5bps (best b/e 2.7bps —
  someone else's infrastructure); kill-list item 9 stands. E1 holds: the 09:30 bar carries 30.2%
  of daily volatility at −0.003% mean return — defer non-urgent entries past the open.
- **"The fundamental bar" — SUPPORTED as context (not a trade).** July print: EPS $4.74 vs $4.33
  est., revenue $90.0B vs $89.4B est., Azure +43% and past $100B annual revenue; management
  guided FY27-Q1 to revenue $89.85–90.95B, EPS ~$4.70 mid, capex ~$50B, and **Azure +45% cc —
  above the ~41.4% StreetAccount consensus** (CNBC 2026-07-29, Investing.com preview). The
  October bar is therefore self-raised: Azure ≥45% cc plus a calm capex narrative is the
  expectation, not the upside case. A stock that just repriced +18% in two sessions on that guide
  has already paid for a chunk of the October beat.

**What the conditions support.** Guards only, sized zero: S2 (flat through the est. Oct 27–29
window), E1 (execution hygiene), and observation — this print is a scoring opportunity for the
S3-fade regime question, not a trade. **Honest limits:** modern cells are n=14 *minus the most
important print*; the date is a cadence estimate with aggregators split 10/27 vs 10/28; one
intraday regime (2023–26 bull); the reaction-week cluster (FOMC + four mega-cap prints in three
days) makes any single-name attribution this cycle suspect.

## Stance & kill switches

**Stance (date is an estimate — every statement below inherits that label).** No position, no
pre-print entry at any horizon: S1 and the D-10 run-up are killed on MSFT and stay killed
(estimate). S2 with the estimate-widened window — any paper MSFT exposure flat by the Oct-26
close and stays flat through Oct 29 until the date is IR-confirmed (estimate). S3 fade remains
blocked on the shorting lock; independent of the lock, the "deploy small when unblocked" queue
item is **on hold** until the July 2026 reaction-session leg is measured — and this cycle's D+1
is a poor test anyway if the print lands 10/27, because the FOMC statement (confirmed,
federalreserve.gov calendar: meeting Oct 27–28, statement 14:00 ET Oct 28) owns that afternoon
(estimate). Fundamental bar: Azure ≥45% cc guided; consensus drift above that raises the whisper
bar and only argues for *more* caution, never an entry (estimate).

**Kill switches.**

- *Date leg:* IR confirmation (microsoft.com/en-us/investor — nothing posted as of 2026-08-17)
  on any date other than 10-27 re-derives every D-count here; aggregators already split
  (TipRanks/Investing 10-27 vs WallStreetHorizon 10-28-unconfirmed), which is exactly why the
  estimate label stays.
- *S3-caution leg:* if the re-run instrument (guard fixed, or close-out) shows the 2026-07-30
  session leg was **red** despite the +15.5% day, the caution downgrade reverses and S3 returns
  to its sweep-strength standing; if it was **green**, that is one streak-break — a second
  consecutive green reaction session (October) kills MSFT S3 pending a new registered study.
- *S2/no-position leg:* nothing kills it — it is a no-alpha guard; the only revision path is the
  kill list's own new-evidence bar (≥3 new prints showing a repriced gap regime), which one
  July tail does not meet.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-71 | Initial research banked. Instruments fresh but blind to the 2026-07-29 print (event list ends 2026-04-29 — known forward-window-guard debt); July print itself is the headline new info: beat + Azure +45%-cc FY27-Q1 guide → +15.5% D+1, largest one-day cap gain on record — unmeasured out-of-sample stress on the S3 red streak. Date hunt: MSFT IR has no FY27-Q1 date posted; aggregators split 10/27 (TipRanks, Investing.com) vs 10/28 (WallStreetHorizon, unconfirmed) — stays **estimate**. Adjacency: reaction window collides with FOMC Oct 27–28 (statement 14:00 ET 10/28; already in calendar as `fomc-2026-10-28`) and peer prints GOOG/META est. 10/28, AMZN/AAPL est. 10/29 (already in earnings-calendar) — densest cluster of the quarter, no new dated events to propose. Near-term peers: NVDA 8/26 confirmed, MRVL 8/27 confirmed, AVGO announced 9/2 (proposed in the NVDA doc's same-day row). No macro prints since 8/15 (weekend). VIX 14.56 Fri 8/15 (2026 low) but SKEW +6.6% m/m and Brent +6.0%/wk — calm index, rising tail-hedge demand. No MSFT-specific export-control/policy action noted; capex-policy narrative benign since July. | — (stance set) | 2026-08-24 (critical, 61+d band: every 7d) |
| 2026-08-24 | D-64 | Adjacency sweep. Event tape: date split unchanged — TipRanks still labels 10/27 "confirmed" (third-party, not IR-primary), Wall Street Horizon still lists 10/28 "unconfirmed," MarketChameleon still gives an estimate-range 10/28–30; MSFT's own IR still has no FY27-Q1 date posted this session — stays **estimate**, no flip. Peers: NVDA/MRVL both report this week (own docs); AVGO's XPV overhang deepened, MRVL's implied move jumped on its Google deal (own docs) — near-term AI-capex sentiment context, not MSFT-specific. Macro: no CPI/jobs surprise since 8/17; Sep-16 FOMC read is 68.4% hold/31.6% hike as of 8/20 (FOMC sibling doc). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs. No new dated adjacency found — the Oct 27–28 FOMC / GOOG-META 10/28 / AMZN-AAPL 10/29 cluster is unchanged. | — (no change; too far out for a substantive stance shift) | 2026-08-31 (critical, 61+d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
