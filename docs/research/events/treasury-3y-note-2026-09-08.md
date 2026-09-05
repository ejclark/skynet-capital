# 3-Year Treasury Note auction — treasury-3y-note-2026-09-08

**Kind:** rates · **Date:** 2026-09-08 (estimate, EST: now primary-verified — treasurydirect.gov's `TA_WS/securities/upcoming` feed and fiscaldata's `upcoming_auctions` endpoint BOTH return the 3-Year, CUSIP **91282CRL7**, announce 2026-09-03 · auction 2026-09-08 · issue 2026-09-15; filed `estimate` only because this lane may not self-confirm, checked 2026-09-01) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","buyback-blackout-start-2026-09-12","challenger-job-cuts-2026-09-03","cpi-2026-09-11","eia-steo-2026-09-09","fed-waller-outlook-2026-09-03","fomc-blackout-start-2026-09-05","hammack-remarks-2026-09-03","ism-services-2026-09-03","jobs-2026-09-04","mts-august-2026-09-11","opec-plus-meeting-2026-09-06","ppi-2026-09-10","sp-rebalance-proforma-2026-09-04","sp-rebalance-proforma-capped-2026-09-11","treasury-10y-note-2026-09-09","treasury-30y-bond-2026-09-10","treasury-buyback-10y20y-2026-09-10","treasury-buyback-increase-2026-09-09","treasury-coupon-announcement-2026-09-03","treasury-coupon-announcement-2026-09-10","umich-sentiment-prelim-2026-09-11","waller-economic-outlook-2026-09-03"],"screenStreak":0} -->

## At a glance

**TL;DR.** This is **the front-end auction, and the front end is where the Fed shock landed** — but at
D-3 the two things this doc was waiting on have both landed, and they cut opposite ways. **(1) Supply
is settled and boring.** Treasury's 09-03 announcement (11:00 ET, read from the offering announcement
itself) prints the 3Y at **$58,000,000,000**, CUSIP 91282CRL7 — the **ninth straight $58B new issue**,
exactly as the 08-05 refunding guidance said. The cleanest falsifier this doc ever carried has resolved
in the base case's favour, and **FT-20 is live, not void.** **(2) The policy leg went the *other* way
from everything the setup implied.** Waller used the last scheduled Board slot before the blackout
(09-03, 08:30 ET) to say he would back a **hold** if disinflation holds — cutting September hike odds
from ~**65%** to ~**48–50%** in a session. Payrolls then blew out at **+162K vs ~53–56K** with June and
July revised up a combined **+55K**, pushing odds back only to ~**52–61%** (sources disagree, range
quoted). Net across two sessions carrying a hot jobs print *and* Brent through $95: hike odds are
**flat-to-lower than at D-5**, and the 3Y constant maturity gave back 5bp to **4.41%** (H.15, 09-03) —
still **+12bp** through the 08-11 stop of 4.291%, but no longer widening. The blackout started **today**,
so Waller's dovish lean is the **last Fed word before the stop**. And the demand read got *stronger*
this session on a metric this ledger has called uncomputable in every prior row: the **tail** is
published by third-party trackers, and the last two 3Ys both **stopped through** (Jul −0.6bp, Aug
−0.5bp), both graded STRONG. Date stays **estimate** (lane may not self-confirm). Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-3) | Stand aside — and note the setup got *less* hawkish, not more | High | `symbols: []`. Size is now known (**$58B**, primary), so the supply leg is closed; the policy leg is a coin flip at ~**52–61%** after Waller (−15pp) and payrolls (+~4–9pp) roughly cancelled. Still **no when-issued yield published** for 09-08 — searched this session and found none dated. | A dated **when-issued** 3Y level for 09-08 appearing above ~**4.55%** — that would say the market is demanding a real concession, which nothing in the tape currently shows |
| This week | The auction is now the **low-variance** leg of its own week; watch **OPEC+ 09-06** instead | Medium | The two inputs that could have moved this auction have both resolved. What is left before the 1:00pm ET stop is **OPEC+ Sunday in Vienna** (Reuters: expected to hold October output unchanged), which is the only remaining lever on the oil→inflation channel now that no Fed voice may speak. | **OPEC+ on 2026-09-06** announcing a supply *cut* (rather than the expected hold), which would push Brent decisively past the $95 line and re-open the inflation leg two days before the auction |
| This month | No new duration risk through the **9/8→9/11** block; read the 3Y as a **hike-odds** read | High | Four dated risks in four sessions (3Y 9/8 · 10Y 9/9 · 30Y + PPI 9/10 · CPI 9/11), into a genuinely two-sided 9/16 FOMC. The 3Y's own result is information about the policy leg, not a trade. | A **2026-09-08** bid-to-cover outside the entire 2026 range (below 2.54 or above 2.71), which breaks the inelasticity read this call rests on — this is FT-20's kill, unchanged |
| This quarter | Stand aside on the auction; treat the **front end** as where Fed risk now expresses | Medium | Re-confirmed on fresh tape: on 09-04's hot payrolls the 2Y hit **4.4246%** (highest since Jan-2025) while the S&P moved **−0.38%** and **VIX fell to 14.53**. A policy shock still lands in rates and barely touches equity vol. | The **2026-09-16** FOMC moving the S&P ≥1.5% while the 2y moves <5bp — the sibling [`jackson-hole`](jackson-hole-2026-08-28.md) migration test, inherited here |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on this auction**, and no new unhedged duration opened into the 1:00pm ET
  release or carried naked through the 9/8→9/11 stack. No house playbook is macro-keyed.
- **A weak print** — bid-to-cover below **2.54** (the 2026 low), or dealer takedown well above the
  13.7% 2026 mean — says the front end's repricing is now dragging on demand, not just on yield.
- **A strong print** — bid-to-cover at/above **2.71** with indirects near/above 64% — says the higher
  yield is *attracting* the bid, and the policy repricing is being absorbed cleanly.
- **Read the tail alongside the cover** (added 09-05, new metric): the last two 3Ys **stopped through**
  their when-issued level (**−0.6bp** Jul, **−0.5bp** Aug), both graded STRONG. A 09-08 print that
  covers inside 2.54–2.71 but **tails** would be a softer result than the cover alone reads, and is the
  one way FT-20 can pass on its letter while the demand story underneath it weakens.
- **The supply leg is closed** (resolved 09-03): the announcement prints **$58B**, the ninth straight,
  matching the 08-05 refunding guidance. The size kill switch did not fire and cannot fire again before
  the auction; FT-20's void condition is not met, so it scores on 09-08 as registered.
- **The buyback lever does not reach this tenor** — Bessent's doubled operations are **10–30Y**; the
  3Y gets no technical support from it.
- **The blackout is now in force** (from **09-05**): between today and the 1:00pm ET stop, no Fed
  official can soften or confirm anything. **Waller's 09-03 dovish lean is the last Fed word before the
  auction**, and it is the reason a hot payroll print left hike odds roughly where they were.
- **Oil is a live input to this tenor** — a Hormuz supply shock feeds the inflation leg the front end
  prices, the one channel through which a geopolitical event reaches a 3Y note. Brent has now settled
  **≥$95 for three straight sessions** (95.63 · 95.52 · **95.83**, front-month closes 09-02→09-04) and
  touched **$99.38** intraday on 09-03 after Iran struck Kuwait and the UAE. **The $95 leg of the oil
  kill switch has fired — and its predicted consequence has not** (see the stance).
- **Both macro legs now point hawkish, and the odds went nowhere** (added 09-05) — payrolls **+162K**
  vs ~53–56K with June/July revised up **+55K**, on top of ISM Services 55.4 and prices-paid **72.6**.
  A jobs beat of that size moving hike odds only to ~52–61% is itself the observation: the Waller
  channel outweighed the data channel. The sub-35% switch is not close; the ~75% switch is not close.
- **Equity vol never caught up to rates vol** — VIX **15.20** (09-02) → **14.32** (09-03) → **14.53**
  (09-04), i.e. it *fell* through a Kuwait strike, a $99 Brent print and a jobs blowout. The
  divergence the siblings have logged since 08-18 is intact, not closing, so an options-shaped hedge
  over the 9/8→9/11 stack remains cheap in absolute terms — which is a statement about price, never a
  reason to buy one.
- **Watch (dated), all pre-auction items now resolved except one:** ~~ISM Services + Challenger + 3Y
  announcement 09-03~~ · ~~jobs 09-04~~ · ~~blackout starts 09-05~~ · **OPEC+ 09-06 — the only live
  input left before the stop** · **this auction 09-08** (estimate) · 10Y reopening + iPhone launch +
  buyback increase **09-09** · PPI + 30Y reopening + 10–20Y buyback + **the 20Y/10Y-TIPS coupon
  announcement 09-10** · **CPI 09-11** · 20Y **09-15** · **FOMC 09-16** · 10Y TIPS **09-17** ·
  OpEx **09-18**.

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

**Refined 2026-09-03 (D-5) — same stance; the supply leg quiets down and the policy leg turns
two-sided.** Base case, stand-aside and FT-20 all unchanged. Three things moved. (1) **The measurement
got better.** This doc has argued leg 5 with the *2Y* against the 3Y's own August stop, flagging the
comparison as cross-tenor and explicitly not a WI proxy. The Fed's H.15 carries the **3-year constant
maturity** directly: **4.46% on 09-01 vs the 4.291% 08-11 stop — +17bp like-for-like**, against the
~6.5bp the 2Y proxy implied. The premise is roughly 2.5x stronger than it was written, and Warsh day
alone moved the 3Y CMT +11bp (4.30 → 4.41). A CMT is a par-curve interpolation, not a when-issued
yield either — closer, still not the auction's own pricing, and no WI exists before the announcement.
(2) **The supply question is close to settled, from the primary.** Treasury's 2026-08-05 quarterly
refunding statement states verbatim that it "anticipates maintaining nominal coupon and FRN auction
sizes for at least the next several quarters," having announced the August 3Y at $58B. Leg 3's
"$58B for eight straight months" stops being an observed pattern and becomes *stated policy* — the
size kill switch stays on the list, but as a tail requiring Treasury to break guidance one month old,
not as an open question. (3) **The policy leg split in two.** Inflation inputs ran hot (ISM
prices-paid 71.1; the 09-02 Beige Book has prices up moderately in eight districts with contacts
naming energy) while labor cooled hard (ADP +38K vs ~47K, weakest since January; JOLTS 7.27M light;
Beige Book employment "rose very slightly"). The front end is pricing a hike off the inflation leg
while the labor leg erodes underneath it — which makes **09-04 payrolls** (consensus **+50–55K**,
dispersion −25K to +90K) the largest single input to how this auction prices, and it is genuinely
two-sided in a way it was not at D-7. The receipt is the D-5 row.

**Refined 2026-09-05 (D-3) — same stance; the supply question closes at $58B, and the policy leg
resolved *against* the hawkish setup.** Base case, stand-aside and FT-20 all hold, and no new forward
test is registered (nothing about the stance moved, so there is no new prediction to pre-register).
Four things moved, one of them a correction to this doc's own method. (1) **The supply leg is settled
from the offering announcement itself.** Treasury's `A_20260903_3.pdf` (embargoed until 11:00 A.M.,
2026-09-03; PDF text layer read directly this session) reads **Offering Amount $58,000,000,000**,
CUSIP **91282CRL7**, Currently Outstanding **$0**, auction 09-08, maturity 09-15-2029, competitive
close 1:00 p.m. ET — the **ninth consecutive $58B 3Y new issue**, and confirmation that the 08-05
refunding guidance held. The size kill switch is now spent: it cannot fire again before the auction,
and **FT-20's void condition is not met**, so it scores on 09-08 exactly as registered. (2) **The
policy leg went the other way.** Waller (09-03, 08:30 ET, Reuters NEXT) said he would support holding
at 3.50–3.75% on 09-16 if the next two weeks of data keep showing disinflation, and would only
"consider" a hike on a hot print — cutting September hike odds from ~**65%** to ~**48–50%** in a
session. Payrolls (09-04) then printed **+162K** against ~53–56K consensus, u-rate **4.1%**, AHE
**+0.3% m/m / +3.1% y/y**, participation 61.6%, with June revised **+11K** (to +31K) and July revised
**+44K** (from −23K to **+21K**) — and pushed odds back only to ~**52–61%** (Reuters/Yahoo read
"nearly 52%", Investing.com reads 61%; range quoted, not a point). **Net over two sessions that
contained a jobs blowout and a $99 Brent intraday, hike odds are flat-to-lower than the ~65–68% this
doc carried at D-5.** The Fed-communication channel outweighed both data channels — and with the
blackout live from today, that is the state the auction clears into. (3) **The oil kill switch fired
on its trigger and its predicted consequence did not follow — so the mechanism is refuted, not the
stance.** The switch as written was "Brent holding above **$95** on sustained Hormuz disruption, or
hike odds through ~75%, would move this auction from 'prices a coin-flip' to 'prices a near-certain
hike'." Brent has now settled ≥$95 three straight sessions (95.63 · 95.52 · **95.83**, front-month
closes 09-02→09-04), touched **$99.38** intraday 09-03 after Iran fired missiles and drones at Kuwait
and the UAE, and Hormuz traffic is genuinely impaired — six commodity vessels transited Wednesday
against a ~13 ten-day average. The price leg is therefore **triggered**. But hike odds *fell* over the
same window, so the auction is pricing **more** of a coin flip, not less. The honest reading is that
the switch encoded a bad implication (oil ⇒ hike priced outright) rather than a bad observation; it is
annotated below rather than quietly retired, and the stance it was supposed to overturn is untouched.
(4) **A method correction, and a metric this doc has wrongly called unobtainable.** Every prior row
recorded the tail as not computable because Treasury's dataset carries no when-issued level. Two
third-party trackers publish it — and they agree with this doc's primary-computed bidder shares on
**21 of 21** overlapping figures across Feb–Aug, which is what licenses using the one field the
primary lacks: the **2026-07-07 3Y stopped through by 0.6bp** and the **2026-08-11 3Y stopped through
by 0.5bp**, both graded STRONG. Leg 3's inelasticity read is therefore stronger than written — the
last two auctions did not merely cover well, they priced *better* than the market expected. Tail data
does not exist before July 2026, so this is n=2 and a secondary source; the primary remains the
bidder-share record. Also corrected: the D-5 row's VIX figure of **17.17 for 09-02 does not exist** in
the daily series — Yahoo's 09-02 close is **15.20**, exactly what the repo probe read, so the "~2-point
gap" that row logged unresolved resolves **in the probe's favour**. The receipt is the D-3 row.

**Kill switches:**

- **Bid-to-cover outside 2.54–2.71 on 2026-09-08** — either direction kills leg 3's inelasticity
  read; front-end demand *does* respond to the policy repricing, and the base rate stops being usable
  for the October and November 3Ys. This is FT-20's kill.
- ~~**The 09-03 announcement moves the size off $58B**~~ — **SPENT 2026-09-05, did not fire.** The
  announcement printed **$58,000,000,000** (primary: Treasury offering announcement `A_20260903_3.pdf`,
  embargoed until 11:00 A.M. 09-03), the ninth straight. Leg 3's series stays like-for-like and FT-20
  is **not** void. Kept on the list struck through rather than deleted, because a switch's non-firing
  is evidence and this one carried the doc's single cleanest falsifier for eight days.
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
  *(**Trigger fired 2026-09-05, consequence refuted.** Brent settled ≥$95 on 09-02/03/04 — 95.63,
  95.52, 95.83 front-month, $99.38 intraday 09-03 — on genuine Hormuz impairment, so the price leg is
  met. Hike odds nevertheless FELL over the same window, ~65% → ~52–61%, because Waller's 09-03
  remarks outweighed the oil channel. **The switch was mis-specified**: it treated Brent>$95 as
  sufficient for a hike being priced outright, and the tape says a single dovish governor beats it.
  Restated for any future use: the switch that matters is the **odds** leg alone (>~75%); the Brent
  level is a *contributing input*, not a trigger. The rewrite is recorded here rather than applied to
  the D-7 row that coined it, which stays as written.)*

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-29 | D-10 | Initial research banked (above). **Date:** stays `estimate` — the tentative-schedule PDF timed out on three separate fetches today, treasurydirect's upcoming page renders client-side and returned no rows, and fiscaldata's `upcoming_auctions` (the endpoint the calendar entry itself cites) returned **2024-dated rows**; the cadence carries the date instead — 2026's 3Y auctions ran Mon/Tue of the first-or-second week (01-12 Mon · 02-10 · 03-10 · 04-07 · 05-11 Mon · 06-09 · 07-07 · 08-11, all Tue but the two Mondays), 09-08 is a Tuesday and 09-07 is Labor Day. Flagged not fixed: the 9/9 10Y is filed `confirmed` off the same schedule document while this is `estimate`. **Base rates established (primary, `fiscaldata` auctions_query, bidder shares computed from raw accepted dollars):** all eight 2026 3Y auctions were **$58B new issues** (`reopening: "No"`, distinct CUSIPs — unlike the 9/9 10Y and 9/10 30Y reopenings in the same block); B/C 2.65 · 2.62 · 2.55 · 2.68 · **2.54** · 2.64 · 2.60 · **2.71** (mean **2.624**, σ **0.055**, range 0.17) across a **+68bp** climb in the clearing yield (3.609% → **4.291%**); indirect share mean **63.3%** (56.5–74.8%), dealer takedown mean **13.7%**. August is the year's best B/C at the year's highest yield with dealers 2pp under average — front-end demand is close to yield-inelastic *within this regime*. Tail not computable: the dataset carries no when-issued level. Adjacency sweep — **peers:** n/a, `symbols: []`; AVGO's 09-02 print is the only tracked print near the window and is not a rates channel. **Macro surprises:** Warsh's 08-28 keynote is the event of the sweep — 2y **+8bp to ~4.298%**, called the largest 2Y move after a chair's Jackson Hole speech this century (JPM), September hike odds **35.4% → 45.7–57.5%** (CME FedWatch via CNBC/Benzinga/Yahoo, 08-28; sibling close-out records 57–59% futures / 48% Kalshi — sources disagree, range quoted). 2Y was ~4.20–4.24% on 08-27, 2s10s ~47bp; a bear-flattening from the front. **The measurable consequence: the 2Y now yields more than the 4.291% at which the 3Y itself stopped 17 days earlier** — cross-tenor, a magnitude statement not a WI estimate. **Volatility regime:** VIX **14.51** (`event-material-scan` probe) — baseline set, nothing to diff against yet; noted that VIX *closed at a YTD low* on the session hike odds nearly doubled, and that the sibling records 14.43 for the same close (0.08 gap, unresolved, nothing rests on it). **Geopolitical/policy:** Bessent's doubled buybacks are **10–30Y** — explicitly no support for this tenor, and the tracked `treasury-buyback-increase-2026-09-09` lands the day *after* this auction; recorded as a way to get the event wrong, not as a positive. **Event tape:** size and when-issued do not exist until the ~**09-03** announcement, so no consensus can exist at D-10. **No new dated adjacency found** — the 09-03..09-13 corridor (ISM Svcs 09-03 · jobs 09-04 · 10Y + iPhone + buyback 09-09 · PPI + 30Y 09-10 · CPI 09-11) is already fully on the calendar. **Forward test FT-20 registered** (B/C inside 2.54–2.71 on 09-08; scoreable from primary data that day). | — (stance set) | 2026-09-05 (medium, 8–30d band: every 7d) |
| 2026-09-01 | D-7 | Adjacency sweep; band tightened **medium:8+ → medium:0+** (every 2d now). **Date — leg 1's failure mode is gone.** Both primaries that were unreachable on 08-29 now resolve and agree: treasurydirect's `TA_WS/securities/upcoming` feed returns the 3-Year at CUSIP **91282CRL7**, announce **2026-09-03** · auction **2026-09-08** · issue **2026-09-15**, and fiscaldata's `upcoming_auctions` — which returned **2024-dated rows** at D-10 — now returns the 2026 September block (3Y + 13/26/6-week bills 09-08, **9-Year 11-Month** note 09-09, **29-Year 11-Month** bond 09-10, the two term labels independently re-confirming leg 2's reopening/new-issue split). `offering_amt` is **null** on both feeds, so the $58B question is untouched and the 09-03 announcement is still the supply tell. Status stays **`estimate`** — this lane may not self-confirm; the calendar entry's source line is refreshed with the CUSIP and both endpoints in the same PR, no status flip. **Macro — a corrected number that strengthens leg 5.** The 08-28 2Y move is better measured at **+12bp to ~4.356%** vs the H.15 08-27 baseline of **4.20%** (CNBC 08-28; the 10Y sibling's 08-30 row carries the same figures, 10Y +4–6bp to ~4.72–4.73%, 30Y +2bp to ~5.21%) than the +6–8bp/~4.298% this doc's D-10 row took from a search summary — the direct CNBC article 403'd both sessions, so this is the sibling's cross-read, not a new fetch. **Consequence: leg 5's gap over the 08-11 3Y stop of 4.291% widens from ~0.7bp to ~6.5bp, and the front end has HELD it** — 2Y **~4.36%** on 09-01, +0.6bp on the session (TradingEconomics, aggregator). Two sessions and a war escalation later, none of the post-Warsh repricing has faded. **Geopolitical — the material new driver.** The **2026-08-30** US strike on Larak Island hit Iranian rocket launchers preparing to mine the **Strait of Hormuz**; Iran struck Jordan in reply, and both sides read as far apart on a ceasefire (Yahoo Finance live blog, 08-31). Brent back **over $88** (same source; one aggregator says >$90 — range quoted, not a point). This matters to a 3Y specifically because energy feeds the **inflation** leg the front end prices: September hike odds ran to **60.4%** (CME FedWatch, 08-31 morning, TechTimes) → **62%** (Yahoo, 08-31, "up from ~40% a week prior") → **~66%** (CME FedWatch via Forbes, 11:40 ET 08-31, as the `waller-economic-outlook-2026-09-03` entry records) from the 45.7–59% spread at D-10 — the odds climbed *through* the session, they did not spike and fade. **The auction now has two independent hawkish drivers where it had one.** **Volatility regime:** VIX **14.92** (repo probe) — and Yahoo's 08-31 close reads **14.92, +3.40%**, an exact match, which is the same cross-check that showed an 0.08 gap at D-10; Δ **+0.41** from 14.51 is far under the 3-point threshold. VIX below 15 with a Hormuz escalation, a coin-flip hike and the 10Y at a Jan-2025 high is the same equity-vol/rates-vol divergence the siblings have logged since 08-18 — it is widening, not resolving. **Long end:** 10Y **4.76%** intraday 08-31, +4bp, its highest since **January 2025** (Yahoo) — aggregators disagree (TradingEconomics reads ~4.72%, another ~4.67%; the D-10 doc's own caution about press disagreement applies); 30Y **5.26%**, +5bp, still under the 5.32–5.33% 08-18 high. Both ends sold off together on an oil-inflation shock — **not** a counterexample to leg 4, whose kill switch is specifically about *fiscal* news reaching the front end. **Peers:** n/a, `symbols: []`. **Event tape:** no WI, no size, no dealer forecast — unchanged and unchangeable before 09-03. **Adjacency — four new tracked entries inside the 5-day corridor since the last probe-ref**, all already added to `market-events.ts` by sibling sweeps, so **nothing new to propose**: `challenger-job-cuts-2026-09-03`, `fomc-blackout-start-2026-09-05`, `opec-plus-meeting-2026-09-06`, `treasury-buyback-10y20y-2026-09-10`, and — landing on main mid-session, after this branch was cut — `waller-economic-outlook-2026-09-03`. Three change how this auction reads: **OPEC+ on 09-06** is the supply side of the oil shock, two days out; **blackout from 09-05** means no Fed official can walk the hawkishness back before the stop; and **Waller 09-03 8:30 ET** (Reuters NEXT, Q&A, per federalreserve.gov's September calendar) is the *only* scheduled Board voice left before that silence — my own pre-rebase search for pre-blackout Fed speakers missed it, and the `fomc-blackout-start-2026-09-05` sweep found it the same day. Nothing new to propose: every one of the five is already a tracked entry. Also searched scheduled US-Iran talks — none found with a date. **FT-20 unchanged and still scoreable 09-08.** | **Refined, not reversed** — base case, stand-aside and FT-20 all hold; leg 5 strengthens on the corrected 2Y measurement, and a second driver (oil→inflation→hike odds) is added, with a new kill switch at Brent >$95 / odds >~75% | 2026-09-03 (medium, 0–7d band: every 2d — the 3Y announcement lands that day) |
| 2026-09-03 | D-5 | Adjacency sweep; band unchanged (**medium:0+**, every 2d). **Timing frame first, because it bounds everything below:** this session ran at **00:32 ET**, so the entire 09-03 stack it was scheduled to catch is still ahead of it — Challenger 07:30 · Waller 08:30 · ISM Services 10:00 · **the 3Y announcement ~11:00** · Hammack 15:00 (pre-recorded). Both Treasury feeds re-fetched this session still return the 3Y at CUSIP **91282CRL7**, announce 09-03 · auction 09-08 · issue 09-15, `offering_amt` **null**; treasurydirect's `announced` feed's most recent notes are still the 08-20 batch (7Y $44B · 5Y $70B · 2Y $69B). So no size, no WI, no consensus — the **09-05 pulse is the one that reads the announcement**, not this one. **Supply — the material upgrade, and it is primary.** Treasury's quarterly refunding statement of **2026-08-05** (`home.treasury.gov/news/press-releases/sb0590`) announced the August 3Y at **$58B** and states verbatim: *"Based on current projected borrowing needs, Treasury anticipates maintaining nominal coupon and FRN auction sizes for at least the next several quarters."* Leg 3's "$58B for eight straight months" was an observed pattern; it is now **stated policy**. The size kill switch is not retired — it is repriced from open question to guidance-break tail, annotated as such above. **Rates — the like-for-like measurement this doc never had.** H.15 (primary, Fed, released 09-02, data through 09-01) carries the **3-year constant maturity**, which every prior row proxied with the 2Y and flagged as cross-tenor: 3Y CMT **4.30% (08-27) → 4.41% (08-28) → 4.40% (08-31) → 4.46% (09-01)**; 2Y **4.20 → 4.34 → 4.34 → 4.39**; 10Y **4.67 → 4.73 → 4.75 → 4.79**; 30Y **5.19 → 5.22 → 5.25 → 5.27**. **The 3Y now sits +17bp through its own 08-11 stop of 4.291%**, against the ~6.5bp the 2Y proxy implied at D-7 — the premise is ~2.5x stronger, Warsh day alone moved the 3Y CMT **+11bp**, and the front end added **+6bp on 09-01 alone** rather than fading. Caveat kept: a CMT is a par-curve interpolation, not a when-issued yield. **Macro — the policy leg split in two, which is this row's real news.** *Dovish/labor:* ADP **+38K** vs ~47K consensus, weakest since January, goods −10K incl. manufacturing −17K (mediacenter.adp.com + CNBC, 09-02); JOLTS openings **7.27M** (BLS July, released 09-01), below consensus, quits 1.9%; the **09-02 Beige Book** has employment "rose very slightly," five of twelve districts unchanged. *Hawkish/inflation:* ISM Manufacturing **prices-paid 71.1** (09-01 — write-ups disagree on the headline itself, 55.2 vs 54.6, range quoted, nothing rests on it); the same Beige Book has prices up **moderately in eight districts**, with contacts naming energy, transportation and metals, and "heightened uncertainty surrounding higher energy prices." **So the front end is pricing a hike off the inflation leg while the labor leg erodes underneath it** — making **09-04 payrolls** (consensus **+50–55K**, u-rate 4.1%, AHE +0.2% m/m; dispersion −25K Fifth Third to +90K Capital Economics) the auction's largest input and genuinely two-sided. Receipt that the sub-35% kill switch is live and not theoretical: the **08-07** July jobs miss already tumbled these same September odds once (CNBC 08-07). **Odds:** **~65–68%** (CME FedWatch via TechTimes 09-01 "68% as JOLTS and ISM release"; Forbes 66% on 08-31), from 45.7–59% at D-10 and 60–66% at D-7 — still rising, but decelerating, and short of the ~75% switch. **Geopolitical/oil — the D-7 switch reached its doorstep and did NOT trigger.** Brent **94.86** on 09-02 (TradingEconomics), "around $95, highest in nearly six weeks" (Bloomberg/Yahoo 09-02) after fresh US strikes on Iranian targets around Hormuz, Trump framing them as retaliation for mine-laying. The switch is Brent *holding* above **$95**; 94.86 is below it and one session is not "holding" — **not triggered, ~0.15 away**. Counterweight recorded rather than omitted: **17 mb/d transited Hormuz on Monday 08-31**, i.e. Tehran does not control the waterway and the physical disruption is far smaller than the premium implies. Two dated tests follow: **OPEC+ 09-06** and **EIA STEO 09-09**. **Volatility regime — the divergence is closing.** VIX **14.92 (08-31) → 16.34 (09-01) → 17.17 (09-02)** (Yahoo daily closes); Δ **+2.25** from the last recorded row is the largest VIX move this ledger has logged and still under the 3-point probe threshold. **Probe discrepancy, recorded not resolved:** the repo probe read **15.2** this session, a ~2-point gap against Yahoo's 09-02 close — at D-10 the same cross-check gapped 0.08 and at D-7 it matched exactly, so the gap is new. The probe-ref above carries **15.2**, because that is the figure the next deterministic screen diffs against; the 17.17 is what a human should read. Also discarded: a search summary attributing 16.34 to 09-02, which is Yahoo's **09-01** value — an off-by-one. Substantively, equity vol sitting at YTD lows through a Hormuz escalation was the anomaly the siblings logged since 08-18; it is normalizing upward, which raises what any options hedge over the 9/8→9/11 stack costs. **Peers:** n/a, `symbols: []`. AVGO printed 09-02 AMC; no post-print figures were retrievable this session (~8h after release) and it is not a rates channel — its own ledger owns it. **Adjacency — two entries newly inside the 5-day corridor, BOTH already tracked, nothing new to propose:** `hammack-remarks-2026-09-03` (15:00 ET, pre-recorded so it cannot react to the morning stack, filed `low`) and `eia-steo-2026-09-09` (the official read on how many Gulf barrels are actually stranded — the oil leg's scorecard, landing the day after this auction). A "week ahead" search returned a **contaminated 2019 Benzinga calendar** (Powell/Evans/Kashkari) and was discarded unused. **FT-20 unchanged, still scoreable 09-08.** | **Refined, not reversed** — base case, stand-aside and FT-20 hold; leg 5 re-measured like-for-like at +17bp, the size switch downgraded to a guidance-break tail on primary Treasury guidance, and the policy leg now two-sided into 09-04 payrolls | 2026-09-05 (medium, 0–7d band: every 2d — reads the 09-03 announcement and the 09-04 payrolls print) |
| 2026-09-05 | D-3 | Adjacency sweep; band unchanged (**medium:0+**, every 2d). Session ran **2026-09-04 20:32 ET**, i.e. after the 09-04 cash close, so this row sees the whole 09-03/09-04 stack the D-5 row was scheduled ahead of. **Event tape — the supply question closes, from the offering announcement itself.** Treasury's `A_20260903_3.pdf` (fetched and its PDF text layer decompressed direct this session; header reads *"Embargoed Until 11:00 A.M. … September 03, 2026 … TREASURY OFFERING ANNOUNCEMENT"*) carries **Offering Amount `$58,000,000,000`**, CUSIP **91282CRL7**, **Currently Outstanding `$0`** (leg 2's new-issue claim confirmed a third way), Auction Date September 08 2026, Issue/Dated September 15 2026, Maturity **September 15 2029**, Series AS-2029, Maximum Award $20,300,000,000, noncompetitive close 12:00 Noon ET, **competitive close 1:00 p.m. ET**. Cross-checked against treasurydirect's `announced` feed, which now carries the full 09-03 batch — 3Y **$58B** · 9Y-11M reopening **$39B** · 29Y-11M reopening **$22B** · bills 6wk $75B / 13wk $92B / 26wk $79B. **So the ninth consecutive $58B 3Y new issue, and the 08-05 refunding guidance held.** The size kill switch is **spent without firing** (struck through above); **FT-20's void condition is NOT met**, so it scores 09-08 exactly as registered. Still **no dated when-issued yield** for 09-08 — searched this session across auction-preview publishers and found none; a preview desk (Newsquawk, 08-12) shows the format exists but its September edition was not retrievable. **Method upgrade — the tail is obtainable, and this doc has been wrong to call it uncomputable.** Every prior row recorded "stopped through / tailed" as unavailable because Treasury's dataset carries no WI level. Third-party auction trackers publish it: **2026-07-07 stopped through 0.6bp** (B/C 2.60, indirect 67.5 / direct 24.8 / dealer 7.7) and **2026-08-11 stopped through 0.5bp** (B/C 2.71, indirect 64.2 / direct 24.0 / dealer 11.7), **both graded STRONG**. What licenses the secondary source on the one field the primary lacks: its bidder shares match this ledger's own primary-computed figures on **21 of 21** overlapping numbers, Feb through Aug. **Leg 3 is therefore stronger than written** — the last two 3Ys did not merely cover inside the range, they priced *through* the market's own level. Honest bounds: tail data does not exist before July 2026, so this is **n=2** on a secondary source, and it changes nothing about the stance. **Macro — the two inputs that could move this auction both landed, and they cut opposite ways.** *(a) Waller, 09-03 08:30 ET (Reuters NEXT):* said he would support holding at **3.50–3.75%** on 09-16 if the next two weeks keep showing disinflation, and would only "consider" a hike on a hot inflation print — September hike odds fell from ~**63–65%** to ~**48–50%** in a session, ~**15pp**, the single largest one-speaker move this ledger has logged after Warsh's. The D-5 row's framing was right and the direction was not: the last Board voice before the blackout was called "the highest-variance Fed voice left," and it broke **dovish**. Same morning, **ISM Services 55.4** (from 54.1, est 54.3) with **prices-paid 72.6** (from 70.3) — an upside surprise on both growth and prices that the odds ignored in favour of Waller. Challenger printed **52,881** (−38% y/y). *(b) Payrolls, 09-04 08:30 ET (BLS primary, `empsit.nr0.htm`):* **+162,000** against ~**53–56K** consensus, unemployment **unchanged at 4.1%**, AHE **+$0.10 / +0.3% m/m to $37.75** and **+3.1% y/y**, participation **61.6%**, June revised **+11K** (+20K → **+31K**) and July revised **+44K** (−23K → **+21K**) — a combined **+55K** of upward revision that also unwinds the July payroll shock this whole hawkish/dovish debate was partly built on. Odds went back to ~**52–61%** (Reuters/Yahoo wire reads "nearly 52%"; Investing.com reads "61% … up from 52% pre-data" — **sources disagree materially, range quoted, no point picked**, the same discipline this doc applied at D-10). **The observation this row exists to record: across two sessions containing a 3x jobs beat AND Brent's highest print since July, September hike odds ended flat-to-lower than the ~65–68% carried at D-5.** One dovish governor outweighed both data channels — and the **blackout is live from today (09-05)**, so no Fed voice can revise it before the 1:00pm ET stop on 09-08. **Rates:** H.15 (primary, released 09-04, data through 09-03) — **3Y CMT 4.41 (08-28) → 4.40 (08-31) → 4.46 (09-01) → 4.45 (09-02) → 4.41 (09-03)**; 2Y 4.34 → 4.34 → 4.39 → 4.39 → **4.34**; 10Y 4.73 → 4.75 → 4.79 → 4.79 → **4.77**; 30Y 5.22 → 5.25 → 5.27 → 5.27 → **5.25**. **The 3Y gave back 5bp from its 09-01 peak and now sits +12bp through its own 08-11 stop of 4.291%**, against +17bp at D-5 — the premise still holds but stopped widening, and the give-back is Waller-shaped. H.15 has no 09-04 reading yet (next release 09-08, Labor Day intervening); for 09-04 the press has the **2Y +4bp at 4.37% with an intraday peak of 4.4246%, its highest since January 2025** (Reuters/Yahoo), and `^TNX` closes 4.76 (09-03) → **4.78** (09-04). **Geopolitical/oil — the D-7 kill switch's price leg fired.** Iran struck **Kuwait and the UAE** with missiles and drones on 09-03; Brent front-month settled **95.63 (09-02) · 95.52 (09-03) · 95.83 (09-04)** — **three consecutive settles above the $95 line**, with an intraday **$99.38** on 09-03 (corroborating the figure the `umich-sentiment-prelim` entry carries) and one desk quoting $97.62 on the week. Hormuz is genuinely impaired: **six commodity vessels transited Wednesday** against a ~13 ten-day average. **This contradicts the D-5 row's "17 mb/d transited Monday 08-31" counterweight**, which came from a different and lower-grade source; the conflict is recorded, not resolved, and the vessel count is the narrower claim. TradingEconomics reads Brent ~0.4–0.8 lower than Yahoo's front month throughout (94.86 on 09-02, 95.23 on 09-04) — both series cross $95, the level does not turn on which is used. **The switch fired and its consequence did not follow** (annotated above): odds fell, so the auction prices *more* of a coin flip, not less. **Volatility regime:** VIX **15.20 (09-02) → 14.32 (09-03) → 14.53 (09-04)** — it **fell** through a Kuwait strike, a $99 Brent print and a jobs blowout. Δ from the probe-ref's 15.2 is **−0.67**, far under the 3-point threshold. **The D-5 probe discrepancy resolves in the probe's favour:** that row logged the repo probe's **15.2** as a "~2-point gap" against a claimed Yahoo 09-02 close of **17.17** — but **17.17 does not appear anywhere in the daily series** (08-27 14.51 · 08-28 14.43 · 08-31 14.92 · 09-01 16.34 · 09-02 **15.20** · 09-03 14.32 · 09-04 14.53). The probe was right; the 17.17 was a bad press figure. Equity vol has **not** caught up to rates vol — the divergence the siblings have logged since 08-18 is intact, and the D-5 row's "it is normalizing upward" read is superseded. **Equities (the 8/28 migration read, re-tested):** on 09-04's hot print the S&P closed **7718.60, −0.38%**, Nasdaq −0.29%, Dow −0.51%, while the 2Y made a 20-month high — a policy shock landing in rates and barely touching equities, the third clean observation of that pattern. (09-03's +1.06% S&P session belongs to Waller, not to this auction.) **Peers:** n/a, `symbols: []`. **Adjacency — seven entries newly inside the 5-day corridor since the last probe-ref, all seven already tracked, and one genuinely new dated event PROPOSED.** Already tracked: `treasury-coupon-announcement-2026-09-03` (the announcement this row reads), `fed-waller-outlook-2026-09-03` — which a sibling has already documented as a **duplicate** of `waller-economic-outlook-2026-09-03` and closed out; treated as one event here — plus `mts-august-2026-09-11`, `umich-sentiment-prelim-2026-09-11`, `sp-rebalance-proforma-2026-09-04`, `sp-rebalance-proforma-capped-2026-09-11` and `buyback-blackout-start-2026-09-12`. **Proposed (new, `estimate`):** `treasury-coupon-announcement-2026-09-10` — treasurydirect's upcoming feed (re-fetched this session, `updatedTimestamp` 2026-09-04) carries announce date **2026-09-10** for the **20Y reopening** (CUSIP 912810UX4, auction 09-15) and the **10Y TIPS reopening** (CUSIP 91282CRE3, auction 09-17), both with `offeringAmount` still empty. It is the exact sibling of the tracked 09-03 entry, two days after this auction and inside the corridor, and the `treasury-20y-bond-2026-09-15` ledger already names 09-10 as the date it is waiting on without a dated event to attach it to — the same gap the 09-03 entry was created to close. **FT-20 unchanged, live, and scoreable 09-08; no new forward test registered** — the stance did not move, so there is no new prediction to pre-register. | **Refined, not reversed** — base case, stand-aside and FT-20 all hold. Supply resolved at **$58B** (switch spent, FT-20 not void); the policy leg resolved **against** the hawkish setup (~65% → ~52–61% through a jobs beat, on Waller); the oil switch's price leg **fired with its consequence refuted** and is restated as odds-only; leg 3 strengthened by two stop-throughs; the D-5 VIX figure corrected | 2026-09-07 (medium, 0–7d band: every 2d — the last pulse before the 09-08 auction, and it reads OPEC+ 09-06) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
