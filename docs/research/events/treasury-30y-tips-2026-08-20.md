# 30-Year TIPS auction — treasury-30y-tips-2026-08-20

**Kind:** rates · **Date:** 2026-08-20 (confirmed, TSY: treasurydirect.gov auction schedule — 1:00pm ET, announced 08-13, checked 2026-08-18) · **Impact:** high
**Last assessed:** 2026-08-19

## At a glance

**TL;DR.** This is a real-yield reopening (~$8B per the August refunding statement) landing the day
after the 20-year nominal bond auction, into a long end that has been getting progressively worse
demand: the Aug-13 nominal 30-year cleared at a 15-plus-year-high yield with a small tail (the third
tailed long-end auction in a row), and Aug-18 brought a broad bond selloff that hit NVDA (-2.4%) and
the semiconductor group (SOX -5%). Breakevens, by contrast, have stayed flat — this looks like a
real-rate / term-premium story, not the market repricing inflation higher. Nothing here licenses a
trade; the auction's stop (tail vs. when-issued, bid-to-cover, indirect %) is simply this week's
cleanest read on whether that long-end pressure is easing or continuing into NVDA's Aug 26 print.

| Horizon | Call | Why |
|---|---|---|
| Today (08-19) | Watch | 20Y nominal auction (1pm ET) lands first; its stop sets the tone for tomorrow's TIPS reopening. |
| This week | Stand aside on fresh duration-sensitive entries | Compound long-end supply (20Y 08-19, 30Y TIPS 08-20, 5Y 08-26, 7Y 08-27) into an already-soft demand run — no edge to trade, only variance to respect. |
| This month | Watch, weighted toward caution | Aug-26 NVDA print + PCE + 5Y auction stack the same day; a continuing-tail pattern from this week compounds that risk. |
| This quarter | Stand aside (event-specific) | Belongs to the broader rate-path picture (CPI 09-11, FOMC 09-16) more than to this single auction — reassess there. |

**Signals & conditions.** Read the Aug-20 stop itself: tail ≤0bp (stops through WI) with
bid-to-cover ≥2.6 eases the caution overlay; tail >3bp with bid-to-cover <2.3 (extending the Aug-13
pattern to a fourth straight tailed long-end auction) escalates it. A breakeven move alongside the
auction (up or down) would flip the "real-rate, not inflation-expectations" read below. See
**Stance & kill switches**.

## Initial research

**The question.** What does the Aug-20 30-year TIPS reopening tell us — about long-end demand
generally, about inflation-expectations positioning specifically — landing one day after the 20-year
nominal auction, and which tracked names should sit most cautiously through it?

**One-line verdict:** the setup is a real-yield/term-premium story, not a fresh inflation scare —
breakevens are flat while nominal long yields hit multi-year highs — so the auction's own stop (not
CPI-style headline math) is the signal to watch, and it lands squarely on the two tracked names
(CRWV, NVDA) the calendar already flags as most duration-sensitive.

**Method.** Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md)
(rates-auction mode: primary treasurydirect.gov schedule for the date, press/analyst coverage —
Bloomberg, Reuters wire, CRFB, tipswatch.com, TradingEconomics, FRED/macrotrends — for auction
results and breakeven levels, each claim dated). No treasurydirect.gov result PDF for this specific
auction exists yet (it has not happened); comparison figures are the most recent confirmed prints
found. Run 2026-08-19.

**Conviction legs, tested:**

1. **The long-end backdrop into this auction is deteriorating, not calm — SUPPORTED.** The Aug-13
   nominal 30-year auction cleared at 5.216%, the highest in over 15 years, with an ~2bp tail
   described as the third tailed long-end auction in a row (Bloomberg / CRFB / Yahoo Finance
   coverage, 2026-08-13/14). Aug-18 brought a broad bond selloff — 30-year yield highest since 2007,
   10-year highest since Jan 2025 — tied to fading Middle East ceasefire hopes lifting oil and
   inflation/borrowing-cost concern (Reuters wire, multiple outlets, 2026-08-18). This is the
   concession the calendar's own 20Y-auction note already flags; the 20Y (08-19) and 30Y TIPS
   (08-20) land directly into it.
2. **The yield spike reads as real-rate/term-premium, not fresh inflation re-anchoring — MIXED,
   leans SUPPORTED.** Breakevens have stayed rangebound: the 30-year breakeven ran 2.22% → 2.25% →
   2.24% → 2.22% Dec-2025 through Mar-2026 (FRED via macrotrends), and the most current point found
   (10-year tenor, Aug-2026) is 2.25% (TradingEconomics) — essentially flat over the period nominal
   30-year yields climbed to a 15-plus-year high. Nominal-up / breakeven-flat points to real
   yields (deficit, supply, an oil-driven risk premium) carrying the move, not the market pricing
   higher long-run inflation. Caveat: the 30-year breakeven series found tops out in March 2026 —
   stale by roughly five months relative to today — so this leg is confirmed on the nominal/real
   split but not on the most current breakeven level.
3. **The most recent 30-year TIPS print is six months old and predates the current tailing streak —
   MIXED.** The Feb 19 2026 new issue: real yield 2.473% (second-highest in 16 years), bid-to-cover
   2.75, stopped through the when-issued yield (2.49%) by ~1.7bp — a strong auction (tipswatch.com,
   2026-02-19). That was before the Aug-13 tail and the Aug-18 selloff. Whether that demand persists
   into the Aug-20 reopening given the intervening deterioration is exactly what tomorrow's stop
   answers — this leg cannot be scored ahead of the auction. Search results also conflicted on
   whether a 30-year TIPS reopening occurred between February and August 2026; treat February as the
   most recent *confirmed* comparison point until the Aug-20 result PDF is checked directly.
4. **Tracked names already show real-rate sensitivity in the tape, ahead of this auction —
   SUPPORTED.** NVDA fell 2.4% and the Philadelphia semiconductor index fell 5% on Aug-18 as yields
   spiked (Reuters wire, 2026-08-18) — a same-week precedent for the mechanism. The calendar's own
   20Y-auction note already flags CRWV as highest-beta to a weak long-end auction (debt-financed,
   capital-intensive datacenter build — the same mechanism the CPI-event research ranked CRWV as the
   single most rate-sensitive of the nine tracked names, ahead of the high-multiple semis
   NVDA/AVGO/MRVL, the mega-caps MSFT/GOOG/META, and AAPL/AMZN on the consumer-spend channel; see
   [`cpi-2026-09-11.md`](cpi-2026-09-11.md)).
5. **No tracked instrument exists for the auction's other classic read-through (gold/miners) — a
   real gap, not filled here.** A strong TIPS auction historically also reads as
   inflation-expectations-anchored positioning that is gold/miner-relevant; GLD/GDX are not in this
   app's tracked-symbols set (checked `earnings-calendar.ts` and `market-events-data.ts`), so that
   leg of the classic TIPS signal has no instrument to apply it to here.

**What the conditions support.** No equity play flows from a rates auction alone — the app's order
path doesn't touch bonds/TIPS directly, and this event carries `symbols: []` by design. What this
auction and its Aug-19 sibling supply is a same-week information input to how cautiously to sit in
the real-rate-sensitive tracked names (foremost CRWV, then NVDA/AVGO/MRVL) heading into NVDA's Aug 26
print. Guard-shaped, consistent with the S2 discipline already established for NVDA/CPI: no new
duration-sensitive entries timed into the Aug 19–20 auction pair; read the 30Y TIPS stop (tail vs.
WI, bid-to-cover, indirect %) as this week's most direct signal on whether long-end pressure is
easing (tail ≤0bp, cover ≥2.6) or continuing (tail >3bp, cover <2.3, echoing Aug-13) — a continuing
pattern corroborates caution into the Aug-26 NVDA print and the Aug-26/27 5Y/7Y auctions stacked the
same week.

**Honest limits.** Every rates figure here is press/aggregator-sourced (Bloomberg, Reuters wire,
CRFB, Yahoo Finance, tipswatch.com, TradingEconomics, FRED/macrotrends) — none pulled directly from a
treasurydirect.gov result PDF for this specific auction (it hasn't happened yet) or independently
confirmed via the raw PDF for the February 2026 comparison auction; re-verify against the primary at
the next assessment once results post. The 20-year auction (Aug-19, same-day, 1pm ET) had not
posted results at the time of this research — the adjacency note below describes the scheduled event,
not its outcome. The 30-year breakeven series found is stale (latest point ~March 2026); no
current-month 30-year breakeven confirmed, only the 10-year proxy. Could not confirm whether a
30-year TIPS reopening occurred between February and August 2026 (conflicting search results). No
gold/miner tracked instrument (leg 5). This event is `confirmed` by primary source and date — no
estimate-labeled claims appear here — but every forward read of what the auction *will* show is
unconfirmed until it posts, and none of the above licenses a trade.

## Stance & kill switches

**Stance (date confirmed, TSY primary checked 2026-08-18).** Treat 2026-08-19/08-20 as a compound
long-end supply week (20Y then 30Y TIPS), high-impact. No directional or duration-sensitive equity
action is licensed by this research; hold normal caution on fresh entries in the real-rate-sensitive
tracked names — CRWV first, then NVDA/AVGO/MRVL — through both auctions' results, layered on top of
each name's own event-specific stance (e.g., NVDA's dead-zone discipline). Read the Aug-20 TIPS stop
(tail vs. WI, bid-to-cover, indirect %) as the week's cleanest signal on inflation-expectations
positioning per legs 2/3 above.

**Kill switches:**

- **30Y TIPS stops through WI (negative tail) with bid-to-cover ≥2.6** — signals absorbed demand /
  eased long-end pressure; downgrades this week's caution overlay on CRWV/NVDA.
- **30Y TIPS tails >3bp with bid-to-cover <2.3**, extending the Aug-13 pattern to a fourth
  consecutive tailed long-end auction — escalates caution into the Aug-26 NVDA print and the
  Aug-26/27 5Y/7Y auctions.
- **A fresh breakeven move (either direction) alongside the auction** — flips leg 2 from a
  real-rate story to an inflation-expectations story, changing which mechanism is driving
  tracked-name pressure.
- **A Middle East de-escalation reversing the Aug-18 oil/yield spike** — removes the immediate
  catalyst behind this week's supply concession (mirrors the CPI event's own kill switch on the same
  geopolitical driver).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-19 | D1 | Initial research banked. Adjacency — peer/event: the 20-Year Treasury Bond auction lands 08-19, the day before, already tracked separately as `treasury-20y-bond-2026-08-19` (results not yet posted at research time); the Aug-13 nominal 30-year auction cleared 5.216% (15+yr high) with an ~2bp tail, the third consecutive tailed long-end auction (Bloomberg/CRFB, 08-13/14); Aug-18 broad bond selloff (30Y yield highest since 2007, 10Y highest since Jan 2025) drove NVDA -2.4% and the semiconductor index -5% (Reuters wire, 08-18); most recent 30Y TIPS comparison is the Feb-19-2026 new issue (2.473% real yield, 2.75 cover, stopped through WI) — six months old, demand persistence into 08-20 is the open question this auction answers. Macro: breakevens flat (30Y ~2.22-2.25% Dec25-Mar26; 10Y 2.25% Aug-2026) against the nominal yield spike — real-rate story, not inflation re-anchoring. VIX/geopolitical: Aug-18 selloff geopolitically driven (Middle East ceasefire hopes fading, oil up); no new export-control action found. No new dated adjacency discovered beyond events already in `market-events-data.ts` (20Y 08-19, 5Y 08-26, 7Y 08-27, 10Y 09-09, 30Y 09-10, 20Y 09-15, 10Y TIPS 09-17, CPI 09-11, FOMC 09-16 all already present). | — (stance set) | 2026-08-20 (high, 0-7d band: every 1d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
