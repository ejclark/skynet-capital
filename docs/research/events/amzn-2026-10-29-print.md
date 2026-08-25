# AMZN earnings print — amzn-2026-10-29-print

**Kind:** earnings · **Date:** 2026-10-29 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-08-24

## At a glance

**TL;DR.** No AMZN positioning into this print at any horizon — the one pre-print edge was killed in
the sweep and re-confirmed on a fresh run (p=0.6854), so nothing here pays for taking the date. What
the print *does* carry is measured ±10% single-night tails, which makes it a risk-management event:
be flat across it, sized to those tails. Date is an **estimate** (D-65), so the flat-by rule keys to
the earliest plausible day of the cadence window, never the point estimate. The live question is not
direction but narrative — the first quarter $220B capex reads as a liability rather than AI
conviction changes the reaction function.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | No surviving pre-print edge on AMZN; S1 killed 2026-08-12 and re-confirmed p=0.6854 on 2026-08-17 | ≥3 new prints clearing a base-rate + peer control for the gap family |
| This week | **Nothing to do** — watch for the IR date | High | The date is an estimate; IR normally announces 2–3 weeks out, so no announcement is due yet | An IR announcement landing early, or on a date ≠ **2026-10-29** |
| This month | **Watch consensus drift, don't trade it** | Medium | The light $197–202B guide is the bar; drift against it changes the print's difficulty, not its tradability | Consensus settling above the guide range before ~2026-10-08 |
| This quarter | **Flat across the print night (S2), E1 on any execution** | High | ±10% measured overnight tails with no edge to pay for them — a guard, not a bet | Nothing kills a no-alpha guard; only ≥3 repriced-regime prints revise it |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — carry unhedged AMZN exposure across the print night for the gap; the tails are ±10% and no edge pays for them.
- **Watch (dated)** — IR date announcement expected ~**2026-10-08** to **2026-10-15** · the estimated print **2026-10-29** · FOMC **2026-10-28**, D-1.
- **The narrative tell** — $220B capex read as a liability rather than conviction; that reaction-function shift matters more than the beat.
- **Zero-size observation only** — the S3 direction lean dies if the reaction day closes green on 2 of the next 3 prints.
- **Re-keys everything if** — the IR date lands anywhere other than 2026-10-29.

## Initial research

**The question.** AMZN's Q3 2026 print lands in ~73 days (date **estimate**). After a blowout Q2
(2026-07-30: revenue $200.6B +20%, AWS +37% — fastest in 18 quarters, +9% after hours), what is
likely to happen into and around the Q3 print, and which house playbooks apply?

**One-line verdict.** Guards only: S2 + E1 apply with full force; every AMZN alpha-shaped play
was already killed or shelved by the [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) red team,
and the fresh instrument run (2026-08-17, cache busted) re-confirms each kill — the event-shaped
work here is the *setup*: a bar reset high by Q2, a deliberately light Q3 guide, and a congested
mega-cap week where four peer prints land within 48 hours of this one.

**Method.** `earnings-cycle.mjs AMZN --bench QQQ --peers MSFT,GOOG,META` (87 prints,
2004-10-21 → 2026-04-29) + `intraday-edges.mjs AMZN` (721 sessions, hourly + 5-min), both run
fresh 2026-08-17; read against the sweep's per-symbol verdicts and kill list; sourced web research
for the date, the Q2 baseline, and consensus. **Instrument caveat (known debt, not repaired
here):** the event list ends at 2026-04-29 — the 2026-07-30 print (8-K exists; SEC EDGAR
amzn-20260630 ex-99.1) is missing, consistent with the sweep's forward-window-guard finding that
blinds five of eight tickers to their newest print. Every modern-era n=14 cell below therefore
excludes the single most relevant data point: the AWS-acceleration print that gapped ~+9%.

**Conviction legs tested.**

1. **"Pre-print positioning pays on AMZN" (S1) — REFUTED**, again. Kill-list entry #2
   ([`multi-symbol-sweep.md`](../multi-symbol-sweep.md), 2026-08-12) stands: the fresh run's
   modern-era control shows the D-20 run-up (9/14 positive, mean +4.78%) at **p=0.6854 vs the
   era's own base rate** (887 windows, mean +2.60%, win 67%) — statistically indistinguishable
   from a bull market. The peer control is the tell: GOOG (+5.50%) and META (+6.87%) run *harder*
   over AMZN's own pre-print windows than AMZN does. Sector seasonality, not an AMZN edge.
2. **"The gap can be held/traded" (anti-S2) — REFUTED; S2 SUPPORTED.** All-era gap: win 48%,
   median −1.27%, p10 −10.33% / p90 +11.31% (fresh run, 2026-08-17) — a fat-tailed coin flip,
   exactly the sweep's all-eight verdict. The modern cell (win 57%, median +3.79%, n=14) is the
   familiar bull-era gloss over ±9–10% tails; note the missing 2026-07-30 +9% gap would flatter
   it further, which is precisely why hold-the-print theses keep getting re-proposed and keep
   dying (0-for-3 family: AVGO, META, NVDA).
3. **"Fade the reaction-day open" (S3) — MIXED**, unchanged from the sweep's "direction only"
   lean. Fresh run: modern-era reaction session mean −0.60%, win 29% vs an ordinary session's
   +0.05%/52%. Direction lean re-confirmed, but AMZN never cleared significance (MSFT p=3.4e-4
   did; AMZN did not), and shorting is blocked anyway. Inert; observation only.
4. **"Overnight-only beats holding" (S4) — REFUTED**, kill-list #9 stands. Fresh run: overnight
   carries the return (win 56%, +74.4% total gross) but nets +2.4% vs buy-and-hold's +78.0% at
   5bps/side — the market-wide overnight anomaly, value-destroyed by costs.
5. **"E1: defer the open" — SUPPORTED.** First hour carries 30.5% of daily volatility at −0.016%
   mean return (win 48%). Cost rule for non-urgent entries, as everywhere.
6. **The Q3 setup (event-specific, new since the sweep) — MIXED, and the real content.** Q2
   (2026-07-30, CNBC/SEC) reset the bar: AWS +37% to $42.2B, backlog $496B, but capex guided to
   $220B for the year with free cash flow turning negative, and the Q3 revenue guide of
   $197–202B came in *below* the street's $204.1B (LSEG). The market forgave the light guide on
   AWS acceleration. So the Q3 print (date **estimate**) must beat its own conservative guide
   *and* show AWS comps holding near 37% against a much harder bar — while the capex/FCF
   question sharpens each quarter. Consensus is uniformly bullish (Buy, mean PT ~$322 vs ~$267
   spot as of 2026-08-13/16, per MarketBeat/24-7WallSt aggregation — no Sell ratings), which is
   itself positioning information: the crowded side is long.

**Date verification (primary-source hunt, 2026-08-17).** Amazon IR has published **no** Q3 2026
call notice yet (ir.aboutamazon.com news releases end at the Q2 cycle). Wall Street Horizon
forecasts Thu **2026-10-29 AMC, explicitly unconfirmed**, matching the domain table's 8-K-cadence
estimate (Q2 printed Thu 2026-07-30; +91d = Oct 29; prior Q3s were Oct 30 2025, Oct 31 2024 —
last-Thursday-of-October cadence). One aggregator (Bybit wiki) claims "Oct 22, confirmed" with no
primary backing — the exact aggregator trap the seeding of this calendar caught on CPI; rejected.
The date stays **estimate** until an IR press release lands; no domain edit from this session.

**What the conditions support.** Guard rules only, both carrying the **estimate** label: any
AMZN position flat by the close of D (S2), where D itself is estimated — and per the honesty
rules an estimated date only *widens* caution (flat by the earliest plausible print day, not the
latest); E1 for any non-urgent entry regardless. No pre-print long (S1 killed), no gap hold
(kill list), no fade (blocked + sub-significance), no overnight round-trip (killed). The
congestion note matters more than any single-symbol number: MSFT 10/27, GOOG 10/28, META 10/28,
AMZN 10/29, AAPL 10/29 (all **estimates**, 8-K cadence) — five mega-cap prints in 48 hours, so
the never-stack-pre-print-longs rule binds hard that week, including against the one live GOOG
run-up hold. FT-5 (AAPL post-print drift, [`forward-tests.md`](../forward-tests.md)) keys off the
same estimated day; nothing here duplicates or edits it.

**Honest limits.** n=14 modern cells, minus the newest print (instrument debt above); one
bull-regime intraday sample; SEC filing dates stand in for announcement times; date is an
estimate for another ~2 months; consensus/PT figures are aggregator-sourced (no primary
disclosure exists for "consensus"); D-73 means implied move and whisper are not yet quotable —
expect them from ~D-21.

## Stance & kill switches

**Stance (date: estimate).** No positioning into this print at any horizon — AMZN carries no
surviving pre-print edge (S1 killed 2026-08-12; re-confirmed p=0.6854 on 2026-08-17). S2 and E1
apply as universal guards: flat across the print night, sized to the measured ±10% overnight
tails; because the date is an **estimate**, the flat-by rule keys to the earliest plausible print
day of the cadence window, never the point estimate. The event-shaped watch items are (a) the IR
date announcement (expected ~2–3 weeks before the print; it flips the label to confirmed), (b)
consensus drift against the light $197–202B guide, and (c) the capex/FCF narrative — the first
quarter where $220B capex reads as a liability rather than AI conviction changes the reaction
function.

**Kill switches.** The no-positioning stance is killed only by the sweep's stated bar: new-print
evidence that clears a base-rate + peer control (≥3 prints for the gap family) — not by any
in-window rally. The S2 guard has no kill switch; it is a risk rule, not a bet. The
S3-direction-lean observation (zero size) dies if the reaction day closes green on 2 of the next
3 prints. If the IR announcement lands on a date ≠ Oct 29, the calendar entry gets a same-PR
correction proposal (estimate → confirmed) and every window in this doc re-keys.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-73 | Initial research banked. Instruments fresh (cache busted): S1 kill re-confirmed (D-20 control p=0.6854; GOOG/META outrun AMZN over its own windows); gap all-era win 48% ±10% tails (S2); fade direction-lean only (29% win modern, inert); S4 net +2.4% vs B&H +78% (killed stands). Instrument debt: event list ends 2026-04-29 — the 2026-07-30 print is missing (forward-window guard, known sweep debt), so all n=14 modern cells exclude the +9%-gap AWS print. Date hunt: IR silent; WSH forecasts 10/29 AMC unconfirmed (matches 8-K cadence); Bybit "Oct 22 confirmed" rejected as unsourced aggregator. Adjacency: no peer prints or macro releases since 8/15 (weekend); VIX 14.56 Fri 8/15 (2026 low) but SKEW +6.6% m/m and Brent +6%/wk — calm index, rising tail-hedge demand (shared with the NVDA 8/17 row); no new AMZN-specific tariff/policy action found, capex-driven memory-cost pressure noted (CNBC 7/30); tape: consensus Buy, mean PT ~$322 vs ~$267 spot, zero Sells — crowded long; Q3 guide $197–202B vs street $204.1B is the bar; implied move not yet quotable at D-73. Dated discovery: AWS re:Invent Nov 30–Dec 4 2026, Las Vegas — proposed as estimate. Congestion: MSFT 10/27 · GOOG/META 10/28 · AMZN/AAPL 10/29 (all est.) — never-stack binds that week. | — (stance set) | 2026-08-24 (critical, 61+d band: every 7d) |
| 2026-08-24 | D-66 | Adjacency sweep. Event tape: date estimate still 10/29, no IR notice this session, unchanged. AMZN spot **$260.11** (8/24), down from the ~$267 cited at D-73 — a modest pullback, not a break. One search returned an internally inconsistent "$267.30 PT, 21.5% upside" figure that doesn't reconcile arithmetically with the quoted spot (267.30/260.11 ≈ +2.8%, not +21.5%) — likely conflated with the D-73 row's own ~$322 mean PT; discarded as an unreliable extraction, the D-73 PT figure stands uncorrected. Peers: NVDA/MRVL both report this week (own docs); AVGO's XPV overhang deepened, MRVL's implied move jumped on its Google deal (own docs) — AI-capex sentiment context, not AMZN-specific (AMZN's own capex-driven memory-cost pressure thread from D-73 unchanged, no update found). Macro: no CPI/jobs surprise since 8/17; Sep-16 FOMC read is 68.4% hold/31.6% hike as of 8/20 (FOMC sibling doc). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs. No new dated adjacency found — AWS re:Invent (Nov 30-Dec 4) already proposed at D-73. | — (no change; too far out for a substantive stance shift) | 2026-08-31 (critical, 61+d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see [EVENT-RESEARCH.md](../../process/EVENT-RESEARCH.md)) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
