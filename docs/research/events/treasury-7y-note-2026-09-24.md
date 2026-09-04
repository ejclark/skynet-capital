# 7-Year Treasury Note auction — treasury-7y-note-2026-09-24

**Kind:** rates · **Date:** 2026-09-24 (confirmed, TSY: treasury.gov tentative schedule — 1:00pm ET, formal announce ~6bd prior, checked 2026-08-18; re-verified 2026-09-02 against Treasury's own `Tentative-Auction-Schedule.xml` ("Aug2026 Refunding Auction Calendar Official Ver 2"), which carries the 7-Year NOTE at auction 2026-09-24, announce **2026-09-17**, settle **2026-09-30**, `ReOpeningIndicator=N` — a **new issue**, not a reopening) · **Impact:** medium
**Last assessed:** 2026-09-02
<!-- probe-ref: {"symbols":{},"vix":16.34,"daysBand":"medium:8+","adjacentIds":["consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","jolts-2026-09-29","scoos-2026-09-24","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","trump-xi-summit-2026-09-24"],"screenStreak":0} -->

## At a glance

**TL;DR.** This auction **closes the September coupon calendar** — a routine belly-of-the-curve
7-year **new issue** (`ReOpeningIndicator=N`), no tracked tickers. **The risk has migrated from
demand to level.** The demand leg this doc was built on has *weakened*: the two August belly prints
it was waiting on both landed at-or-better than average — the Aug-27 7Y stopped at 4.512% with a
**0.0bp tail**, bid-to-cover 2.50x and indirect **60.8%** (back *above* the 55.6–57.6% pullback band
this doc flagged), and the Aug-26 5Y drew bid-to-cover 2.37x on a +0.2bp tail with indirect 61.5%.
What replaced it is a **rate-level** story: Warsh's 2026-08-28 Jackson Hole keynote plus the Hormuz
oil shock repriced the belly **15–19bp in three sessions** — the 7Y constant maturity ran 4.52%
(08-27) → **4.66%** (09-01), i.e. ~**15bp through where August's 7Y actually cleared** — and September
hike odds went from ~26% to **~65–68%**. So Sep-24 no longer reads a post-*hold* belly; it reads the
first full belly-supply test of a Fed the market expects to have already tightened. Auction **date
confirmed**; every size/when-issued/demand figure remains **estimate/press-sourced** until the
**2026-09-17** announcement. Watch-only, no standalone play.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D22) | Stand aside | High | `symbols: []`, and size/CUSIP/when-issued do not exist until the 09-17 announcement — Treasury's own `upcoming` feed still stops at 09-10. There is nothing to be right or wrong about today. | Nothing dated today; no size, no WI yield, no consensus exists to be surprised against |
| This week | Stand aside | High | Every belly-relevant input this week belongs to *other* events — 09-04 jobs, then 09-11 CPI. Neither is this auction's own data. | A hike being priced **outright** (odds through ~85%) before the 09-16 FOMC, which would change what the whole 2Y/5Y/7Y block prices against |
| This month | Watch the **09-16 FOMC** and the **09-17 announcement**, not the auction | Medium | The FOMC sets the rate the block clears against, and the 09-17 announcement — one day after it — fixes 2Y/5Y/7Y supply. Those two land before any of the three auctions. | The **2026-09-17** announcement raising the 7Y above its recent ~$44B, the first size change of the year, against a belly already ~15bp cheaper |
| This quarter | Watch | Medium | The belly-weak-demand narrative this doc carried is now the *weaker* leg (two clean August prints); the live question is whether a 15–19bp concession is enough to clear a post-hike belly. Duration-sensitivity input for long-duration AI names, never a standalone trade. | A markedly weak 09-24 print (bid-to-cover well under ~2.40, tail beyond ~1.5bp) **despite** that concession — which would say the concession is not the binding constraint |

**Signals & conditions** (confirmed-status auction; a weak print only *widens caution*, never
licenses a trade):
- 7Y bid-to-cover **< ~2.40** or a tail **> ~1.5bp** vs when-issued → weak-demand read. The bar is
  now *higher* than when this doc was written: it must be weak **against** a belly already ~15bp
  cheaper than August's stop, so a soft print would be more informative, not less.
- Indirect (foreign) share **< ~57%** → **stood down 2026-09-02.** Aug-27 printed 60.8% and Aug-26's
  5Y printed 61.5%, both above the band; the two-print pullback pattern did not extend to a third.
  Re-arms only on a fresh sub-57% belly print.
- **The 09-17 announcement is the next real datapoint** — 2Y, 5Y and 7Y are all announced together
  that day, one day after the FOMC and one day before OpEx. Size is the first post-FOMC supply tell.
- **The block settles 2026-09-30** — the same day as the tracked federal funding deadline. Not a
  demand argument, but the 2Y/5Y/7Y cash actually changes hands into that headline.
- 5Y auction (9/23) tails badly the day before → raises the bar for a "clean" 7Y; a clean 7Y after a
  dirty 5Y is itself informative about where belly demand sits.
- **Never** — no directional bet; no new unhedged duration exposure into the 1:00pm ET release.
- **Watch (dated)** — jobs **Sep 4** · CPI **Sep 11** · **FOMC Sep 15–16** · **the 2Y/5Y/7Y
  announcement Sep 17** · quarterly OpEx **Sep 18** · 2Y **Sep 22** (estimate) · 5Y **Sep 23** ·
  **same day as this auction: Trump–Xi summit** (estimate, high) and SCOOS at 14:00, after the
  13:00 stop · funding deadline **Sep 30**, the block's settlement date.

## Initial research

**The question, plainly:** does the 7-year's reputation as the coupon block's weakest-demand tenor
still hold in the 2026 cycle, and — landing after the Sep-16 FOMC, after Sep-18 OpEx, and the day
after the Sep-23 5-year that closes the coupon calendar — does its result change how the tape or our
tracked long-duration names should sit?

**One-line verdict:** the reputation is real but not currently the sharpest edge in the belly — the
**5-year**, not the 7-year, is 2026's weakest print — and this auction is a second-order signal that
closes the Sep coupon block, reads the post-Fed belly landscape, and inherits the 5-year's tone the
day before. No symbols; monitoring, not entries.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md)
(rates/Treasury-auction mode: no price instruments). Primary source for existence/date/time is
treasury.gov's tentative auction schedule (matches the checked-in calendar entry exactly); recent
7-year auction metrics are from helious.io (accessed 2026-08-19), consistent with the sibling
[`treasury-7y-note-2026-08-27.md`](treasury-7y-note-2026-08-27.md) (which cross-checked
investinglive.com / cryptobriefing.com / Exante Data). FOMC odds from
[`fomc-2026-09-16.md`](fomc-2026-09-16.md). Each claim dated in-line.

**Conviction legs, tested:**

1. **The date, time, and confirmed status are right — SUPPORTED.** treasury.gov's tentative
   auction schedule places the 7-year note auction at 1:00pm ET on Thursday 2026-09-24, matching the
   checked-in calendar entry (`TSY:`, formal announce ~6bd prior, checked 2026-08-18) exactly — the
   last coupon auction of the September calendar. Formal size announcement ~6 business days ahead
   (~2026-09-18). No date discrepancy found.

2. **2026's 7-year prints reflect real-but-modest belly softness (soft-not-disastrous) — SUPPORTED.**
   Two most recent 7-year auctions (helious.io, 2026-08-19):

   | 7Y auction | High yield | B/C | Tail | Indirect | Direct | Dealer | Note |
   |---|---|---|---|---|---|---|---|
   | 2026-06-25 | 4.26% | 2.50 | — | 57.6% (vs ~64.8% 6-mo avg) | 29.7% | 12.8% | indirect below avg, direct/dealer absorbed slack |
   | 2026-07-28 | 4.473% | 2.49 | +0.2bp | 70.1% | 16.9% | 13.0% | bid-to-cover flat, yield up ~21bp m/m — "a little lower than average," not a rout |

   Bid-to-cover held essentially flat (2.50→2.49) while the stop-out yield rose ~21bp with the broader
   rate backdrop; indirect in June ran below its own average, a modest foreign-demand pullback, before
   recovering to 70.1% in July. Soft, ordinary, in line with reputation — not an outlier.

3. **The 5-year, not the 7-year, is 2026's weakest coupon tenor — SUPPORTED.** Per the sibling docs
   and helious.io: the Jul-27 5-year tailed +0.9bp on indirect 59.2% (bid-to-cover 2.28, "one of the
   ugliest in years"), while the Jul-28 7-year tailed only +0.2bp on indirect 70.1% (bid-to-cover
   2.49). The belly softness in mid-2026 is real but concentrates at the 5-year — the 7-year's
   reputation is directionally right, not the most precise description of where 2026 weakness sits.

4. **The 7-year reads the post-FOMC belly and inherits the 5-year's tone — SUPPORTED as a sequencing
   fact.** Sep-24 lands **after** the Sep-16 FOMC (two-sided: hawkish hold ~60–70%, hike ~30–40%, cut
   0% per [`fomc-2026-09-16.md`](fomc-2026-09-16.md)) and Sep-18 OpEx, and the **day after** the
   Sep-23 5-year. So it reads the belly's *post-Fed* pricing and inherits whatever concession tone the
   5-year sets the day before — a clean 7Y after a dirty 5Y (or vice versa) is itself informative.

5. **The fresher belly read is the Aug-27 7-year, not this one — SUPPORTED.** The Aug-27 7-year
   (sibling doc; lands the day after NVDA's 8/26 print and the same day as MRVL's) is the nearer
   confirm/deny of belly demand and should be read straight into this stance at the next pulse. This
   Sep-24 auction inherits whatever Aug-27 (and the FOMC) establish.

6. **No-symbol, medium-impact conditioning event, not a market-mover — SUPPORTED.** No tracked
   tickers; the house playbooks are symbol-keyed. Its role is a conditioning input on long-duration-
   tech rate sensitivity — a weak print modestly raises caution, never a directional signal.
   Sensitivity tier unchanged: CRWV highest, then NVDA/AVGO/MRVL, then mega-cap MSFT/GOOG/META, least
   direct AAPL/AMZN.

**What plays the conditions support:** none directional and none symbol-keyed — the guard-shaped house
answer. This event introduces no new play; it is a receipt that the duration-sensitivity guard on
long-duration tech names holds on the belly/rate side too, read *after* the FOMC and after the Sep-23
5-year that precedes it.

**Honest limits.** The Sep-24 auction's size/CUSIP is not yet announced (formal announcement
~2026-09-18) — nothing about *this* auction's supply/demand exists yet. Recent 7-year metrics come
from a secondary tracker (helious.io) consistent with the sibling doc; the raw TreasuryDirect Jul-28
PDF is image-based and was not parsed to text — re-verify bidder shares against
fiscaldata.treasury.gov before citing exact figures. The nearer Aug-27 7-year result (the fresher
data point) does not exist yet. "Weakest tenor" reputation claims come from press/aggregator
characterizations, not a from-scratch multi-tenor statistical study. No symbols, medium impact:
nothing here licenses a trade.

## Stance & kill switches

**Stance: stand aside / watch-only.** No new position is initiated or implied by this auction. Treat
it as the closing read of the September coupon block — a conditioning input on the belly/rate side of
the long-duration-tech duration-sensitivity picture, read *after* the Sep-16 FOMC, Sep-18 OpEx, and
the fresher Aug-27 and Sep-23 prints that precede it. The 5-year (not the 7-year) is 2026's weakest
belly tenor; the 7-year is soft-not-disastrous.

**Refined 2026-09-02 (D22) — same stance, but the thesis's two legs traded places.** Nothing turns:
stand-aside and watch-only both hold, and this event still licenses no trade. Two things moved, in
opposite directions. (1) **The demand leg got weaker as a worry.** Both August belly auctions — the
data this doc's last two rows were explicitly waiting on — printed at-or-better than average:
Aug-27 7Y stopped at **4.512%** on a **0.0bp tail**, bid-to-cover **2.50x**, indirect **60.8%**;
Aug-26 5Y drew **2.37x** on a **+0.2bp tail**, indirect **61.5%** (both figures primary-sourced in
the [`Aug-27 7Y`](treasury-7y-note-2026-08-27.md) and [`Aug-26 5Y`](treasury-5y-note-2026-08-26.md)
close-outs, from the TreasuryDirect result PDF and the Fiscal Data API respectively). The "indirect
below ~57%" signal condition is therefore **stood down**, and leg 3's "5-year is 2026's weakest
tenor" claim is now the *stale* half of this doc — the 5Y's own July weakness did not extend into
August. (2) **The rate-level leg got much stronger.** Warsh's 2026-08-28 Jackson Hole keynote and
the 09-01 Hormuz escalation repriced the whole belly: 7Y constant maturity **4.52% → 4.66%**, 5Y
**4.38% → 4.55%**, 2Y **4.20% → 4.39%** between 08-27 and 09-01 (Treasury's own daily par yield
curve + Fed H.15), taking the 7Y ~**15bp through** where the August 7Y actually cleared, with
September hike odds at **~65–68%** against the ~26% this doc's own 08-26 row recorded. Leg 4's
sequencing framing survives but its content inverts: Sep-24 reads the belly after a Fed the market
expects to have *hiked*, not held. The receipt is the D22 row.

**Kill switches (what would change this stance):**
- A markedly weak 7Y print (bid-to-cover well under ~2.40, tail beyond ~1.5bp, indirect materially
  below the ~57% floor of the last two prints) **landing into a soft rate tape / hawkish-FOMC
  aftermath** — escalates from "context" to a compounding risk-off factor worth naming in the
  long-duration-tech stance, not just this doc.
- A clean 7Y print (bid-to-cover back near/above the ~2.50 recent band, tail near zero) removes the
  belly-of-curve concern for this cycle and would be noted at the next pulse.
- If the Aug-27 7-year (the nearer print) breaks decisively in either direction, the belly read shifts
  and should be logged at the next pulse.
- **The concession is not enough (added 2026-09-02)** — a markedly weak 09-24 print landing *despite*
  a belly already ~15bp cheaper than August's stop would say price is not the binding constraint on
  belly demand, which is a different and more serious finding than the demand-softness story this
  doc was originally built on. Its mirror: a clean print on that concession retires the demand
  question for this cycle outright.
- **Supply, not demand, becomes the story (added 2026-09-02)** — the **09-17** announcement raising
  the 7Y above its recent ~$44B would be the first size change of the year, and would land on a
  belly that has already repriced 15–19bp. Size is knowable a week before the auction; nothing else
  about the print is.
- No forward-test entry is registered in `forward-tests.md` — a Treasury auction result is not a
  directional equity prediction of the kind that ledger scores; `confirmed` covers the date only, and
  the stance stays observational.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-19 | D36 | Initial research banked (doc above). Adjacency — peers: no tracked-name prints since 8/17 (NVDA 8/26, MRVL 8/27, AVGO 9/2 ahead); live peer signal macro-driven — CRWV −12.1%, NVDA −2.4% on 8/18 rate fear, though the belly is less directly driven by the long-end term-premium move. Macro: 7-year is soft-not-disastrous (Jun-25 B/C 2.50 indirect 57.6%; Jul-28 B/C 2.49 tail +0.2bp indirect 70.1%) — the *sharpest* 2026 belly weakness sits at the 5-year (Jul-27 tailed +0.9bp, indirect 59.2%), not the 7-year. Sep-24 closes the coupon block, reads the belly **after** the Sep-16 FOMC (~60–70% hold / ~30–40% hike / 0% cut per the FOMC sibling) and Sep-18 OpEx, and inherits the Sep-23 5Y's tone the day before. Fresher belly read is the Aug-27 7Y (sibling doc; day after NVDA, same day as MRVL). VIX ~15.2–15.9 on 8/18 (sources disagree), up from the 14.56 2026-low — mild vol pickup. Geopolitical: US–Iran deadline expired, oil spike — more a long-end than a belly driver. Event tape (date **confirmed**; size/yield figures **estimate**/press-sourced): Sep-24 size/CUSIP not yet announced (~9/18). No new dated adjacencies beyond what the calendar already tracks (Aug-27 7Y, FOMC 9/16, OpEx 9/18, 5Y 9/23). | — (stance set) | 2026-09-09 (medium, ≥31d band: every 21d) |
| 2026-08-26 | D29 | Adjacency sweep — now inside the 8-30d medium band (interval 7d, tighter than D36's 21d). The fresher belly read (Aug-27 7Y, sibling doc) has not posted yet — it's tomorrow. That sibling's own D1 pulse today notes peer de-stress (NVDA implied move ~6%, MRVL's deflating to ~8.5% from 18.4%) heading into tomorrow's auction, and a same-window 8/12 10Y comparison (bid-to-cover 2.53x, strong 76.7% indirect) — belly-adjacent context, not this tenor's own demand data. Macro: Sep 15–16 FOMC odds firmed to ~73% hold/26% hike/1% cut (Kalshi, checked today) from the ~60-70%/30-40%/0% split carried since D36 — hold conviction building. Volatility regime: VIX ~15.8, calm, no shift. Geopolitical: Strait of Hormuz escalated further overnight (tanker hit off Oman 8/25) — more a long-end than belly driver, per the standing read. Size/CUSIP for this Sep-24 auction still not announced (~9/18). No new dated adjacency to propose. | — (no change; watch-only stance holds, awaiting the fresher Aug-27 7Y result tomorrow) | 2026-09-09 (medium, 8-30d band: every 7d) |
| 2026-09-02 | D22 | **Adjacency sweep — the awaited data landed, and the thesis's two legs traded places.** **Event tape (the headline).** The Aug-27 7Y this doc had been waiting on since D36 printed **clean, not weak**: high yield **4.512%** exactly at when-issued → **0.0bp tail**, bid-to-cover **2.50x**, indirect **60.8%**, direct 27.0%, dealer 12.3% (sibling close-out, from the TreasuryDirect result PDF, CUSIP `91282CRJ2`); the Aug-26 5Y likewise drew **2.37x** on a **+0.2bp tail** with indirect **61.5%** (sibling close-out, Fiscal Data API, CUSIP `91282CRK9`). Indirect at 60.8/61.5% sits **above** the 55.6–57.6% band this doc named — the two-print foreign-demand pullback did **not** extend to a third, so the "indirect < ~57%" signal condition is **stood down** and leg 3's "5Y is the weakest tenor" reads stale rather than wrong. **Macro surprises — the base case inverted.** Warsh's 2026-08-28 Jackson Hole keynote ("work to do"; summer inflation readings show no "meaningful" improvement) put September **hike** at **~65–68%** on CME FedWatch as of 09-01 (CNBC 08-28 "now a coin flip"; techtimes/cryptobriefing 09-01), against the **~73% hold / 26% hike** this doc's own 08-26 row recorded — a complete flip of the branch Sep-24 will read. Since then: ISM Manufacturing **54.6** (09-01, below the ~55.2 consensus but an eighth straight expansion, Prices index still **71.1**) and JOLTS openings **7.271M** vs 7.300M consensus with June revised **down** 177k — neither soft enough to unwind the hawkish repricing. **The measured consequence for this tenor.** The belly repriced 15–19bp in three sessions: 7Y constant maturity **4.52% (08-27) → 4.59 (08-28) → 4.62 (08-31) → 4.66% (09-01)**, 5Y 4.38 → 4.55, 2Y 4.20 → 4.39 (Fed H.15 released 09-01 + Treasury's own daily par yield curve XML for 09-01, both fetched direct today). That puts the 7Y ~**15bp through where the August 7Y actually cleared (4.512%)** — the same "repriced through the last stop" measurement the [`3Y sibling`](treasury-3y-note-2026-09-08.md) made on the front end, now true of the belly. Risk has migrated **from demand to level**. **Volatility regime.** VIX **14.92** close 08-31 (its lowest monthly close since Nov 2024) → **16.34** on 09-01, +1.42/+9.5% on a 16.80 intraday high (Yahoo history, fetched today) — up but **under** the 3-point regime threshold vs the ~15.8 this doc last recorded; the 08-28 divergence (hike odds up, VIX at a 2026 low) has now closed. **Geopolitical — a standing read needs amending.** Fresh US strikes on IRGC sites 09-01, retaliation for Hormuz mining, took Brent **+4.6% to ~$94.65** (settling near $95) and WTI **+5.2% to $90.22**; the 10Y hit **4.796%** and Japan's 10Y touched 3% for the first time in 30 years in a global bond selloff. Prior rows called Hormuz "more a long-end than a belly driver" — that is **no longer right**: at ~$95 Brent the channel is oil → inflation → Fed path, which is precisely what the belly prices, and it is the second independent hawkish driver behind the 15–19bp move above. **Event tape (this auction's own facts, newly primary-sourced).** Treasury's `Tentative-Auction-Schedule.xml` ("Aug2026 Refunding Auction Calendar Official Ver 2", fetched direct today) carries the 7-Year NOTE: auction **09-24**, announce **09-17** (this doc's initial research estimated "~09-18" — corrected), settle **09-30**, `ReOpeningIndicator=N` → a **new issue**. Size/CUSIP still do not exist: treasurydirect's `TA_WS/securities/upcoming` feed stops at 09-10 (3Y `91282CRL7` / 10Y `91282CRF0` / 30Y `912810UW6`, all `offering_amt` null). Two consequences worth naming: the 2Y/5Y/7Y block is announced **together on 09-17**, one day *after* the FOMC and one *before* OpEx — making that announcement the first post-FOMC supply tell; and the block **settles 09-30**, the same day as the tracked `government-funding-deadline-2026-09-30`. **Corridor.** Denser than at D29: `scoos-2026-09-24` (same day, 14:00 — *after* the 13:00 stop, so it cannot affect the result, only share the tape) and `trump-xi-summit-2026-09-24` (same day, high impact, **estimate**) both landed on main since; also `durable-goods-2026-09-25`, `dallas-fed-mfg-2026-09-28`, and the `jolts`/`consumer-confidence`/`crwv-fully-connected` cluster on 09-29. The same-day high-impact summit revives the Aug-27 dynamic the sibling scored as correct — the 7Y result is likelier to be overshadowed than to move the tape. **New dated adjacency PROPOSED:** the **2-Year Note auction 2026-09-22** (new issue, announce 09-17, settle 09-30) is in the same primary XML and was **not tracked at all** — this calendar has no 2Y entry despite three docs framing the month-end "2Y/5Y/7Y block" around one. Filed `estimate` (`EST:`) per this lane's no-self-confirm limit. The 2-Year **FRN reopening 09-23** is in the same XML and deliberately **not** proposed: a floating-rate reopening carries almost no rate-path signal and would tax the assessment queue for nothing. Date **confirmed**; all size/demand figures **estimate**. Nothing here is a trade. | **Refined, not reversed** — stand-aside holds; the demand-weakness leg is stood down and the rate-level leg replaces it (Stance section updated, two kill switches added) | 2026-09-09 (medium, 8-30d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
