# 3-Year Treasury Note auction — treasury-3y-note-2026-09-08

**Kind:** rates · **Date:** 2026-09-08 (estimate, EST: now primary-verified — treasurydirect.gov's `TA_WS/securities/upcoming` feed and fiscaldata's `upcoming_auctions` endpoint BOTH return the 3-Year, CUSIP **91282CRL7**, announce 2026-09-03 · auction 2026-09-08 · issue 2026-09-15; filed `estimate` only because this lane may not self-confirm, checked 2026-09-01) · **Impact:** medium
**Last assessed:** 2026-09-01
<!-- probe-ref: {"symbols":{},"vix":14.92,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","challenger-job-cuts-2026-09-03","cpi-2026-09-11","fomc-blackout-start-2026-09-05","ism-services-2026-09-03","jobs-2026-09-04","opec-plus-meeting-2026-09-06","ppi-2026-09-10","treasury-10y-note-2026-09-09","treasury-30y-bond-2026-09-10","treasury-buyback-10y20y-2026-09-10","treasury-buyback-increase-2026-09-09","waller-economic-outlook-2026-09-03"],"screenStreak":0} -->

## At a glance

**TL;DR.** This is **the front-end auction, and the front end is where the Fed shock landed.** Every
other Treasury doc on this calendar is about the *long end* — term premium, the fiscal story, the 30Y
at a 19-year high. This one is not: the 3-year note is a **policy-path** instrument, and on
2026-08-28 Warsh's Jackson Hole keynote drove the 2-year yield **+12bp to ~4.356%** (corrected at
D-7 from the +8bp/4.298% first recorded here), the largest 2Y move after a chair's Jackson Hole
speech this century (JPM). The measurable consequence: the front end has repriced **~6.5bp through**
where the last 3Y actually cleared — the 2026-08-11 auction stopped at **4.291%** — and it has
**held** there (2Y **~4.36%** on 09-01). Since then a *second* driver arrived: the 2026-08-30 US
strike on Larak Island re-escalated the Strait of Hormuz, oil went back over **$88**, and September
hike odds ran to **~60–66%** through the 08-31 session. So Sep-8 is the **first supply test of the post-Warsh front end**,
now also carrying an oil-inflation shock, and it lands **inside the 09-05 FOMC blackout** — no Fed
speaker can walk any of it back before the auction. The base rate still says it goes fine: eight
2026 3Y auctions, all $58B new issues, bid-to-cover **2.54–2.71** (mean 2.62, σ **0.055**) across a
+68bp yield climb — a remarkably inelastic series, and August was its *best* print (2.71) at its
*highest* yield. Date is **estimate** (lane may not self-confirm) but is now verified against two
Treasury primaries. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-7) | Stand aside | High | `symbols: []`, and the size/when-issued still do not exist until the 09-03 announcement — Treasury's own feeds return the auction with `offering_amt: null`. The date is now primary-verified; nothing else about the print is knowable. | Nothing dated today; no size, no WI yield, no consensus exists to be surprised against |
| This week | Watch the **09-03 announcement**, the **09-04 jobs print** and the **09-06 OPEC+ meeting**, not the auction | Medium | All three land before the auction and all three change it: the announcement fixes supply (flat at $58B for eight straight months), jobs moves the hike odds this tenor prices, and OPEC+ is now the supply side of the oil-inflation shock that pushed those odds to ~60–62%. | The **2026-09-03** announcement raising the 3Y above $58B — the first size change of 2026, which would make supply, not the policy path, this auction's story |
| This month | No new duration risk through the **9/8→9/11** block; read the 3Y as a **hike-odds** read | High | Four dated risks in four sessions (3Y 9/8 · 10Y 9/9 · 30Y + PPI 9/10 · CPI 9/11), into a two-sided 9/16 FOMC. The 3Y's own result is information about the policy leg, not a trade. | A **2026-09-08** bid-to-cover outside the entire 2026 range (below 2.54 or above 2.71), which breaks the inelasticity read this call rests on |
| This quarter | Stand aside on the auction; treat the **front end** as where Fed risk now expresses | Medium | The one clean measurement we have (8/28) is that a hawkish Fed shock moves the 2y hard and equities barely at all — VIX *closed at a YTD low* the day hike odds nearly doubled. | The **2026-09-16** FOMC moving the S&P ≥1.5% while the 2y moves <5bp — the sibling [`jackson-hole`](jackson-hole-2026-08-28.md) migration test, inherited here |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on this auction**, and no new unhedged duration opened into the 1:00pm ET
  release or carried naked through the 9/8→9/11 stack. No house playbook is macro-keyed.
- **A weak print** — bid-to-cover below **2.54** (the 2026 low), or dealer takedown well above the
  13.7% 2026 mean — says the front end's repricing is now dragging on demand, not just on yield.
- **A strong print** — bid-to-cover at/above **2.71** with indirects near/above 64% — says the higher
  yield is *attracting* the bid, and the policy repricing is being absorbed cleanly.
- **The 09-03 announcement is the supply tell**: $58B has been the constant all year; any change is
  new information about the front end's issuance path, not about this one auction.
- **The buyback lever does not reach this tenor** — Bessent's doubled operations are **10–30Y**; the
  3Y gets no technical support from it.
- **The auction sits inside the FOMC blackout** (starts **09-05**): between 09-05 and the 1:00pm ET
  stop, no Fed official can soften or confirm the hawkish read the front end is pricing. The 3Y
  clears into the calendar's quietest official-guidance window of the month — and **Waller on 09-03**
  (8:30 ET, Reuters NEXT, Q&A) is the last scheduled Board voice before that silence starts.
- **Oil is now a live input to this tenor** — a Hormuz supply shock feeds the inflation leg the
  front end prices, which is the one channel through which a geopolitical event reaches a 3Y note.
- **Watch (dated):** ISM Services + Challenger + **3Y announcement 09-03** · jobs **09-04** ·
  **FOMC blackout starts 09-05** · **OPEC+ 09-06** · **this auction 09-08** (estimate) ·
  10Y reopening + iPhone launch + buyback increase **09-09** · PPI + 30Y reopening + 10–20Y buyback
  **09-10** · **CPI 09-11** · 20Y **09-15** · **FOMC 09-16** · 10Y TIPS **09-17** · OpEx **09-18**.

## Initial research

### The question, plainly

The September 3-year note auction (1:00pm ET) opens the September coupon block. What is this tenor
actually exposed to — and is it the same thing the 10Y/30Y siblings on this calendar are exposed to?
What do the recent 3Y auctions actually show about demand, how has the front end repriced since
Jackson Hole, is the 2026-09-08 date right, and what should a paper book holding long-duration tech
(NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN) do about it?

**One-line verdict:** the 3Y is a **policy-path** auction, not a term-premium auction — which makes
it the *first* supply test of a front end that repriced hard on 2026-08-28 and now yields more than
the last 3Y cleared at — but eight primary-sourced 2026 auctions show short-coupon demand that is
close to inelastic to yield (bid-to-cover σ **0.055** across a +68bp climb), so the base case is an
uneventful print and the doc's value is the **reframe**, not a call.

### Method

Rates/Treasury-auction mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols:
[]`, so no symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run,
and the cache-busting rule has no target. **The demand table below is primary**: fetched today
directly from Treasury's own `fiscaldata.treasury.gov` `auctions_query` dataset (all eight 2026 3Y
rows, with `reopening`, CUSIP, offering amount, high yield, bid-to-cover and the three bidder-class
allocations), and the per-class percentages are computed here from those raw dollar figures rather
than taken from an aggregator — a deliberate upgrade on the sibling 10Y doc, which flagged its own
two-tracker sourcing for re-check and caught an aggregator error doing so. Date verification was
attempted against three primaries and **all three failed today** (leg 1). Fed-path context is carried
from the [`jackson-hole`](jackson-hole-2026-08-28.md) close-out and [`fomc-2026-09-16`](fomc-2026-09-16.md)
rather than re-researched; the 8/28 rate moves are press-sourced (CNBC/Benzinga/Yahoo via search,
2026-08-28) because the CNBC article itself returned 403 on direct fetch. Volatility is the repo's own
`event-material-scan` probe (VIX **14.51**). Every figure is dated in-line; the date is **estimate**
and that label rides on every trading-adjacent line below.

### Conviction legs, tested

1. **The date is almost certainly right, and it stays `estimate` — SUPPORTED, with all three
   primaries unreachable today.** `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`
   was fetched **three separate times** today and timed out at 60s each time; `treasurydirect.gov/auctions/upcoming/`
   renders its table client-side and returned headers with no rows; and `fiscaldata`'s
   `upcoming_auctions` endpoint — the source the calendar entry itself cites — returned **2024-dated
   rows** on re-fetch. So the `TSY:` confirmed-tier prefix is unreachable from this session, which is
   moot anyway: this lane may not self-confirm. What *does* support 09-08 is the cadence, verified
   against primary results: the 2026 3Y auctions fell on **Mon 01-12 · Tue 02-10 · Tue 03-10 · Tue
   04-07 · Mon 05-11 · Tue 06-09 · Tue 07-07 · Tue 08-11** — always the Monday or Tuesday of the
   first-or-second week. **2026-09-08 is a Tuesday, and the Monday before it (09-07) is Labor Day**,
   which makes Tuesday the only slot the pattern allows. **A calendar inconsistency worth flagging,
   not fixing:** the 10Y one day later is filed `confirmed` off *the same* tentative schedule (checked
   2026-08-18) while this one is `estimate`. Both cannot be right about that document; nothing here
   rests on it, and promoting a date from this lane is forbidden.

2. **The 3Y is a monthly NEW ISSUE, not a reopening — SUPPORTED, primary-verified, and it separates
   this event from its own auction block.** Treasury's dataset returns `reopening: "No"` for every
   2026 3Y auction, each with its own CUSIP (`91282CRG8` Aug · `91282CQZ7` Jul · `91282CQV6` Jun).
   The 9/9 10Y and 9/10 30Y in the same week are both **reopenings**. That matters for how a soft
   print reads: a reopening's demand can be judged against the original issue's, a new issue's cannot
   — there is no prior stop to compare against, only the series base rate below.

3. **Front-end auction demand in 2026 is close to inelastic to yield — SUPPORTED, and it is the leg
   this doc exists to supply.** All eight 2026 3Y auctions, primary (`fiscaldata`), with bidder
   shares computed from raw accepted dollars:

   | Auction | High yield | B/C | Indirect | Direct | Dealer | Size |
   |---|---|---|---|---|---|---|
   | 2026-01-12 | 3.609% | 2.65 | 56.5% | 29.5% | 14.0% | $58B |
   | 2026-02-10 | 3.518% | 2.62 | 57.1% | 31.9% | 10.9% | $58B |
   | 2026-03-10 | 3.579% | 2.55 | 59.8% | 20.7% | **19.5%** | $58B |
   | 2026-04-07 | 3.897% | 2.68 | **74.8%** | 11.9% | 13.3% | $58B |
   | 2026-05-11 | 3.965% | **2.54** | 63.0% | 20.1% | 16.9% | $58B |
   | 2026-06-09 | 4.192% | 2.64 | 63.7% | 21.0% | 15.3% | $58B |
   | 2026-07-07 | 4.179% | 2.60 | 67.5% | 24.8% | **7.7%** | $58B |
   | 2026-08-11 | **4.291%** | **2.71** | 64.2% | 24.0% | 11.7% | $58B |

   Bid-to-cover mean **2.624**, sample σ **0.055**, total range **2.54–2.71** — a 0.17 spread across
   a year in which the clearing yield rose **+68bp** and the size never moved off $58B. Indirect
   share averaged **63.3%**; dealer takedown averaged **13.7%**. The August print is the year's
   *strongest* bid-to-cover struck at the year's *highest* yield, with dealers taking 2pp less than
   average — i.e. the last observation runs against any "demand is fatiguing" story. **Honest caveat:**
   eight points is a thin series and all eight sit inside one policy regime (Fed on hold at
   3.50–3.75%); the inelasticity claim is a within-regime one, and leg 5 is precisely the argument
   that the regime may be changing.

4. **This tenor's risk is the policy path, not term premium — SUPPORTED, and it is the reframe.**
   The sibling [`10Y`](treasury-10y-note-2026-09-09.md) and 20Y/30Y docs on this calendar all rest on
   one story: a term-premium/fiscal sell-off (30Y ~5.32% intraday on 8/18, a 19-year high, +40bp off
   the June low, on a $432B July deficit and ~$1.7T of corporate issuance). **A 3-year note is barely
   exposed to that.** Three years of duration prices the expected policy rate over the FOMC meetings
   inside that window and carries very little term premium. So this auction is not a second data point
   on the long-end story — it is a *different* measurement, and treating a soft 3Y as confirmation of
   long-end contagion would be a category error in the same family the ISM doc called out about
   Chicago.

5. **The front end has repriced through the August stop — SUPPORTED, and it is what makes 09-08
   different from 08-11.** On **2026-08-28**, Warsh's first Jackson Hole keynote abandoned forward
   guidance while stating inflation is still too high and the Fed has "more work to do"; the market
   read it hawkish. Reported that session: the **2-year yield +6 to +8bp to ~4.298%**, described by
   JPM as the largest 2Y move after a chair's Jackson Hole speech this century, and September hike
   odds **35.4% → 45.7–57.5%** depending on the source (CME FedWatch via CNBC/Benzinga/Yahoo, all
   2026-08-28; the sibling close-out records 57–59% futures and 48% Kalshi). The 2Y had been ~4.20–4.24%
   on 8/27 with 2s10s ~47bp; the move was a bear-flattening from the front. **The comparison that
   matters: the 2Y at ~4.298% now sits above the 4.291% at which the 3Y itself stopped on 08-11.**
   That is a cross-tenor comparison, not a when-issued level — the 3Y should normally clear above the
   2Y — so read it as a *magnitude* statement about how far the front end moved in 17 days, not as a
   forecast of the Sep-8 stop.

6. **Corridor position — this auction is the first supply event after the data that resets the odds —
   SUPPORTED.** Order of the window: **ISM Services 09-03** · **jobs 09-04** · **3Y 09-08** · **10Y
   reopening + iPhone launch + buyback increase 09-09** · **PPI + 30Y reopening 09-10** · **CPI
   09-11** → **FOMC 09-16**. Two consequences. First, the 9/4 payrolls print lands four days before
   this auction and is, per the sibling FOMC doc, one of the two things that can move the September
   base case — so the 3Y prices *into* a freshly-repriced policy path rather than a stale one. Second,
   the 3Y goes **before** CPI while the 10Y and 30Y go before it by less; a hot 9/11 core print would
   force a concession on the *reopenings*, and this auction would already be behind it.

7. **The buyback lever does not reach this tenor — SUPPORTED, and it is a live way to get this
   event wrong.** Treasury Secretary Bessent's move to double long-end buyback operations (to
   ~$4B/operation) is a **10–30Y** program — recorded in the [`20Y`](treasury-20y-bond-2026-09-15.md)
   and 10Y siblings, and separately tracked as `treasury-buyback-increase-2026-09-09`, which lands
   the day *after* this auction. It is a demand technical for the long end. Reading it as support for
   the September coupon block *as a whole*, this auction included, would be wrong.

8. **Tracked-name sensitivity is real but runs through the odds, not the auction — SUPPORTED,
   inherited.** `symbols: []`. The duration channel that hit CRWV −12.1% and SOX −5% on 2026-08-18 was
   a *long-end* move; a 3Y auction does not transmit that way. What this tenor does carry is the
   cleanest read on the hike probability, and that probability is the live equity risk. Ranking
   unchanged and not re-derived: **CRWV** most exposed (debt-financed buildout — the policy rate hits
   its cost of capital directly, which is the one channel where the *front* end matters more than the
   long end), then the high-multiple semis **NVDA / AVGO / MRVL**, then **MSFT / GOOG / META**, least
   **AAPL / AMZN**. The 8/28 tape is the caution: equities barely moved (S&P −0.13% to −0.25%) while
   the front end took the whole shock, and VIX *closed at a YTD low*.

9. **Nothing about this specific auction's supply or pricing exists yet — SUPPORTED, and it caps the
   doc.** The formal announcement is ~6 business days prior (~**2026-09-03**), so the September size
   is not fixed and no when-issued yield, dealer forecast or "consensus" exists at D-10. Every
   forward statement here is a base-rate extrapolation from leg 3, stated as such.

### What the conditions support

Nothing directional — the same guard-shaped answer every rates event on this calendar gets, and for
the ordinary reason: no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed, `symbols: []`, and the
date is `estimate`. What the conditions support is a **reading discipline**: (a) do not read this
auction as a second vote on the long-end term-premium story — it measures a different thing (leg 4);
(b) read a soft print as evidence about the *policy* leg, alongside the 9/4 jobs and 9/11 CPI, not
about fiscal supply; and (c) hold no new unhedged duration through the 9/8→9/11 four-session stack,
with existing high-duration exposure sized as if both FOMC branches are live. The single genuinely
new thing this doc can be scored on is the base-rate prediction registered below.

### Honest limits

**The tail cannot be computed here.** Treasury's dataset carries the high yield but not the
when-issued level, so "stopped through / tailed" — the metric the sibling docs lean on hardest — is
unavailable for all eight rows; bid-to-cover, bidder shares and the yield path are the only demand
evidence in leg 3. The date is `estimate` and all three primary schedules failed today (leg 1), one
of them being the very endpoint the calendar entry cites. Leg 3's series is **n=8 within a single
policy regime**, and leg 5's whole argument is that the regime may be changing — so the base rate is
being asked to forecast the one condition it has never seen. The 8/28 rate and odds figures are
press-sourced and **the sources disagree materially** (hike odds reported at 45.7%, 56%, 57.5% and
59–60% across four outlets the same day); the range is quoted rather than a point picked. The 2Y/3Y
comparison in leg 5 is cross-tenor and explicitly not a WI estimate. One unresolved discrepancy left
on the record rather than laundered: this session's probe reads VIX **14.51** while the
[`jackson-hole`](jackson-hole-2026-08-28.md) close-out records a **14.43** close for the same
session — an 0.08 gap between a Yahoo daily close and a press figure; nothing here rests on it.

## Stance & kill switches

**Stance (date `estimate` — cadence-derived, all three primaries unfetchable today; all demand
figures primary-sourced from Treasury's own auction dataset, 2026-08-29).** Treat 2026-09-08 1:00pm
ET as a **medium-impact known-date read with no tradeable edge**: no position opened, closed or sized
off it, and no new unhedged duration carried through the 9/8→9/11 stack. Base case (**Medium**
confidence, base-rate extrapolation — no size or WI exists at D-10): an ordinary print, bid-to-cover
inside the 2026 **2.54–2.71** range, clearing at a yield above August's 4.291% because the front end
has repriced, with the higher yield doing the work of attracting the bid. The doc's actual
contribution is the reframe in leg 4 — **this is the policy-path auction, and the rest of this
calendar's Treasury docs are about the long end.** A soft print here is evidence about the Fed leg,
not about fiscal supply, and confusing the two is the specific error this event exists to prevent.
Forward test **FT-20** registered in [`forward-tests.md`](../forward-tests.md), scoreable 2026-09-08.

**Refined 2026-09-01 (D-7) — same stance, one added driver and one corrected number.** Nothing here
turns; the base case, the stand-aside and FT-20 are unchanged. Two things moved. (1) The 08-28 2Y
move is better measured at **+12bp to ~4.356%** against the H.15 08-27 baseline of 4.20% (CNBC
08-28, as the [`10Y sibling`](treasury-10y-note-2026-09-09.md) recorded on 08-30) than the
+6–8bp/~4.298% this doc's D-10 row carried from a search summary — which *widens* leg 5's gap over
the August 3Y stop from ~0.7bp to **~6.5bp**, and the 2Y has since held it (~4.36% on 09-01). The
premise is stronger than it was written, not weaker. (2) The hawkish repricing now has a **second,
independent driver**: the 2026-08-30 Larak Island strike put a Hormuz supply premium back into oil,
and hike odds went to **~60–66%** through the 08-31 session on a channel — energy into inflation — that the
09-06 OPEC+ meeting can move again two days before the auction. Leg 4's front-end/long-end separation is *not*
broken by 08-31's both-ends selloff (10Y to a Jan-2025 high, 30Y +5bp): a common inflation shock
lifting both tenors is exactly what leg 4 predicts, and the kill switch it carries is specifically
about *fiscal* news reaching the front end, which has not happened. The receipt is the D-7 row.

**Kill switches:**

- **Bid-to-cover outside 2.54–2.71 on 2026-09-08** — either direction kills leg 3's inelasticity
  read; front-end demand *does* respond to the policy repricing, and the base rate stops being usable
  for the October and November 3Ys. This is FT-20's kill.
- **The 09-03 announcement moves the size off $58B** — supply becomes a live variable for the first
  time in 2026, and leg 3's like-for-like series breaks at exactly the auction it is being used on.
- **A hot 9/11 core CPI** — reprices the whole policy path two sessions after this auction; the
  auction is the weather, CPI is the climate, exactly as the 10Y sibling put it.
- **Hike odds collapsing back below ~35%** (a weak 9/4 payrolls, or a Fed speaker restoring guidance)
  — leg 5's "repriced through the August stop" premise dies and this becomes an ordinary 3Y again.
- **Cut odds moving off 0%** — the question stops being hold-vs-hike; per the FOMC sibling that is a
  rebuild-from-scratch signal, not a patch, and it inverts what a strong 3Y bid would mean.
- **A long-end-style move showing up in the front end** — a >10bp single-session 2Y/3Y move on fiscal
  rather than policy news would mean term premium has reached this tenor, merging leg 4's two stories
  back into one.
- **An oil shock big enough to price a hike outright** (added 2026-09-01) — Brent holding above
  **$95** on sustained Hormuz disruption, or hike odds through **~75%**, would move this auction from
  "prices a coin-flip" to "prices a near-certain hike," and the base rate in leg 3 has no observation
  of a 3Y clearing into a committed tightening. Its mirror is the existing sub-35% switch.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-29 | D-10 | Initial research banked (above). **Date:** stays `estimate` — the tentative-schedule PDF timed out on three separate fetches today, treasurydirect's upcoming page renders client-side and returned no rows, and fiscaldata's `upcoming_auctions` (the endpoint the calendar entry itself cites) returned **2024-dated rows**; the cadence carries the date instead — 2026's 3Y auctions ran Mon/Tue of the first-or-second week (01-12 Mon · 02-10 · 03-10 · 04-07 · 05-11 Mon · 06-09 · 07-07 · 08-11, all Tue but the two Mondays), 09-08 is a Tuesday and 09-07 is Labor Day. Flagged not fixed: the 9/9 10Y is filed `confirmed` off the same schedule document while this is `estimate`. **Base rates established (primary, `fiscaldata` auctions_query, bidder shares computed from raw accepted dollars):** all eight 2026 3Y auctions were **$58B new issues** (`reopening: "No"`, distinct CUSIPs — unlike the 9/9 10Y and 9/10 30Y reopenings in the same block); B/C 2.65 · 2.62 · 2.55 · 2.68 · **2.54** · 2.64 · 2.60 · **2.71** (mean **2.624**, σ **0.055**, range 0.17) across a **+68bp** climb in the clearing yield (3.609% → **4.291%**); indirect share mean **63.3%** (56.5–74.8%), dealer takedown mean **13.7%**. August is the year's best B/C at the year's highest yield with dealers 2pp under average — front-end demand is close to yield-inelastic *within this regime*. Tail not computable: the dataset carries no when-issued level. Adjacency sweep — **peers:** n/a, `symbols: []`; AVGO's 09-02 print is the only tracked print near the window and is not a rates channel. **Macro surprises:** Warsh's 08-28 keynote is the event of the sweep — 2y **+8bp to ~4.298%**, called the largest 2Y move after a chair's Jackson Hole speech this century (JPM), September hike odds **35.4% → 45.7–57.5%** (CME FedWatch via CNBC/Benzinga/Yahoo, 08-28; sibling close-out records 57–59% futures / 48% Kalshi — sources disagree, range quoted). 2Y was ~4.20–4.24% on 08-27, 2s10s ~47bp; a bear-flattening from the front. **The measurable consequence: the 2Y now yields more than the 4.291% at which the 3Y itself stopped 17 days earlier** — cross-tenor, a magnitude statement not a WI estimate. **Volatility regime:** VIX **14.51** (`event-material-scan` probe) — baseline set, nothing to diff against yet; noted that VIX *closed at a YTD low* on the session hike odds nearly doubled, and that the sibling records 14.43 for the same close (0.08 gap, unresolved, nothing rests on it). **Geopolitical/policy:** Bessent's doubled buybacks are **10–30Y** — explicitly no support for this tenor, and the tracked `treasury-buyback-increase-2026-09-09` lands the day *after* this auction; recorded as a way to get the event wrong, not as a positive. **Event tape:** size and when-issued do not exist until the ~**09-03** announcement, so no consensus can exist at D-10. **No new dated adjacency found** — the 09-03..09-13 corridor (ISM Svcs 09-03 · jobs 09-04 · 10Y + iPhone + buyback 09-09 · PPI + 30Y 09-10 · CPI 09-11) is already fully on the calendar. **Forward test FT-20 registered** (B/C inside 2.54–2.71 on 09-08; scoreable from primary data that day). | — (stance set) | 2026-09-05 (medium, 8–30d band: every 7d) |
| 2026-09-01 | D-7 | Adjacency sweep; band tightened **medium:8+ → medium:0+** (every 2d now). **Date — leg 1's failure mode is gone.** Both primaries that were unreachable on 08-29 now resolve and agree: treasurydirect's `TA_WS/securities/upcoming` feed returns the 3-Year at CUSIP **91282CRL7**, announce **2026-09-03** · auction **2026-09-08** · issue **2026-09-15**, and fiscaldata's `upcoming_auctions` — which returned **2024-dated rows** at D-10 — now returns the 2026 September block (3Y + 13/26/6-week bills 09-08, **9-Year 11-Month** note 09-09, **29-Year 11-Month** bond 09-10, the two term labels independently re-confirming leg 2's reopening/new-issue split). `offering_amt` is **null** on both feeds, so the $58B question is untouched and the 09-03 announcement is still the supply tell. Status stays **`estimate`** — this lane may not self-confirm; the calendar entry's source line is refreshed with the CUSIP and both endpoints in the same PR, no status flip. **Macro — a corrected number that strengthens leg 5.** The 08-28 2Y move is better measured at **+12bp to ~4.356%** vs the H.15 08-27 baseline of **4.20%** (CNBC 08-28; the 10Y sibling's 08-30 row carries the same figures, 10Y +4–6bp to ~4.72–4.73%, 30Y +2bp to ~5.21%) than the +6–8bp/~4.298% this doc's D-10 row took from a search summary — the direct CNBC article 403'd both sessions, so this is the sibling's cross-read, not a new fetch. **Consequence: leg 5's gap over the 08-11 3Y stop of 4.291% widens from ~0.7bp to ~6.5bp, and the front end has HELD it** — 2Y **~4.36%** on 09-01, +0.6bp on the session (TradingEconomics, aggregator). Two sessions and a war escalation later, none of the post-Warsh repricing has faded. **Geopolitical — the material new driver.** The **2026-08-30** US strike on Larak Island hit Iranian rocket launchers preparing to mine the **Strait of Hormuz**; Iran struck Jordan in reply, and both sides read as far apart on a ceasefire (Yahoo Finance live blog, 08-31). Brent back **over $88** (same source; one aggregator says >$90 — range quoted, not a point). This matters to a 3Y specifically because energy feeds the **inflation** leg the front end prices: September hike odds ran to **60.4%** (CME FedWatch, 08-31 morning, TechTimes) → **62%** (Yahoo, 08-31, "up from ~40% a week prior") → **~66%** (CME FedWatch via Forbes, 11:40 ET 08-31, as the `waller-economic-outlook-2026-09-03` entry records) from the 45.7–59% spread at D-10 — the odds climbed *through* the session, they did not spike and fade. **The auction now has two independent hawkish drivers where it had one.** **Volatility regime:** VIX **14.92** (repo probe) — and Yahoo's 08-31 close reads **14.92, +3.40%**, an exact match, which is the same cross-check that showed an 0.08 gap at D-10; Δ **+0.41** from 14.51 is far under the 3-point threshold. VIX below 15 with a Hormuz escalation, a coin-flip hike and the 10Y at a Jan-2025 high is the same equity-vol/rates-vol divergence the siblings have logged since 08-18 — it is widening, not resolving. **Long end:** 10Y **4.76%** intraday 08-31, +4bp, its highest since **January 2025** (Yahoo) — aggregators disagree (TradingEconomics reads ~4.72%, another ~4.67%; the D-10 doc's own caution about press disagreement applies); 30Y **5.26%**, +5bp, still under the 5.32–5.33% 08-18 high. Both ends sold off together on an oil-inflation shock — **not** a counterexample to leg 4, whose kill switch is specifically about *fiscal* news reaching the front end. **Peers:** n/a, `symbols: []`. **Event tape:** no WI, no size, no dealer forecast — unchanged and unchangeable before 09-03. **Adjacency — four new tracked entries inside the 5-day corridor since the last probe-ref**, all already added to `market-events.ts` by sibling sweeps, so **nothing new to propose**: `challenger-job-cuts-2026-09-03`, `fomc-blackout-start-2026-09-05`, `opec-plus-meeting-2026-09-06`, `treasury-buyback-10y20y-2026-09-10`, and — landing on main mid-session, after this branch was cut — `waller-economic-outlook-2026-09-03`. Three change how this auction reads: **OPEC+ on 09-06** is the supply side of the oil shock, two days out; **blackout from 09-05** means no Fed official can walk the hawkishness back before the stop; and **Waller 09-03 8:30 ET** (Reuters NEXT, Q&A, per federalreserve.gov's September calendar) is the *only* scheduled Board voice left before that silence — my own pre-rebase search for pre-blackout Fed speakers missed it, and the `fomc-blackout-start-2026-09-05` sweep found it the same day. Nothing new to propose: every one of the five is already a tracked entry. Also searched scheduled US-Iran talks — none found with a date. **FT-20 unchanged and still scoreable 09-08.** | **Refined, not reversed** — base case, stand-aside and FT-20 all hold; leg 5 strengthens on the corrected 2Y measurement, and a second driver (oil→inflation→hike odds) is added, with a new kill switch at Brent >$95 / odds >~75% | 2026-09-03 (medium, 0–7d band: every 2d — the 3Y announcement lands that day) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
