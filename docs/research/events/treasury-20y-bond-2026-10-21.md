# 20-Year Treasury Bond auction (reopening) — treasury-20y-bond-2026-10-21

**Kind:** rates · **Date:** 2026-10-21 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-05 — `20-Year BOND R` announce 10-15, auction 10-21, settle 10-23; 1:00pm ET by convention, not separately sourced) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["ecb-quiet-period-start-2026-10-21","fomc-blackout-start-2026-10-17","import-export-prices-2026-10-16","opex-2026-10-16","treasury-2y-note-2026-10-26","treasury-5y-tips-2026-10-22","treasury-primary-dealer-agenda-2026-10-16"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The yardstick this calendar has been grading 20-Year auctions with is broken, and fixing
it is the whole of what this doc adds.** Every 20Y ledger here — including the `high`-tiered
[09-15 sibling](treasury-20y-bond-2026-09-15.md) — grades a print against a *pooled* "recent
bid-to-cover range" of roughly 2.53–2.75. Measured this session from Treasury's own `auctions_query`
(44 auctions since 2023-01), that range pools **two populations that do not overlap**: 20Y **new
issues** ($16B) run 2.34–2.58, 20Y **reopenings** ($13B) run 2.50–2.87, and a reopening beat its own
cycle's new issue in **24 of 28** pairs. Worse, the direction everyone infers from that is backwards
— gross competitive **tendered dollars separate the other way and strictly**: every new issue drew
more ($37.3–41.0B) than every reopening ($30.3–37.2B), zero overlap. So the higher reopening ratio
is a **size artifact**, not better demand: the offering falls 19% ($16B→$13B) while tendered dollars
fall only 12%. This sale is a **second** reopening of CUSIP **912810UX4**, so its honest yardstick is
that slot alone: n=15, floor **2.53**, median **2.68**, top **2.86**. Second finding, same data: the
auction is **not** the variance event the sibling docs imply — 20Y auction days average **−1.77bp**
on the 20Y (t = −2.28) and are **no more volatile than an ordinary session** (mean |move| 4.05bp vs
4.19bp), and the strong-vs-weak spread is about **3bp**. Hold the read-don't-trade guard, but hold it
for the correct reason: the auction is small, and everything dangerous near it is on other days. Date
is `estimate`, `symbols: []`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-46) | Stand aside | High | Saturday, no session; 09-07 is Labor Day. The event's own terms do not exist until the **2026-10-15** announcement, and `symbols: []` means there is nothing here to express a view in. | Nothing dated today for this event; its terms are 40 days away |
| This week | Stand aside — and do not read the 09-08…09-11 coupon block as this auction's preview | Medium | The 3Y/10Y/30Y sales 09-08…09-10 are different tenors and different securities; the only genuinely diagnostic predecessor is the **2026-09-15** reopening of this same CUSIP, and it has not happened. | The **2026-09-15** 20Y reopening printing bid-to-cover below **2.50** — the reopening population's 44-auction floor — which would say the population claim is breaking in real time, one cycle early |
| This month | Grade the 09-15 sibling on the reopening yardstick, not the pooled one | Medium | That sale is a *first* reopening (n=14: floor 2.50, median 2.74). Judging its print against the pooled 2.53–2.75 range would repeat the error this doc measures, in the one place it can still be caught before it is written down. | The 09-15 print landing between **2.50 and 2.58** and being graded "in range" — the overlap zone where the pooled yardstick and the correct one give opposite verdicts |
| This quarter | The policy calendar around this sale matters more than the sale | Medium | It sells inside the FOMC blackout (opens **10-17**), **7 days** before fomc-2026-10-28, and 5 days before an unlisted 2Y note auction added this pass — and its own supply number is already published at **$13B**. | The 20Y printing a **>10bp** single-session move on **2026-10-21** — twice the slot's average and outside all but one auction-day move since 2023 — which would say the auction can carry the day on its own after all |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, date is `estimate`, no house playbook (S1/S2/E1/S3/S4 +
  G1) is rates-keyed. This is a read-it-don't-trade-it event.
- **The correct yardstick for 2026-10-21** — second-reopening slot only, n=15 since 2023-01:
  floor **2.53** · p25 **2.63** · median **2.68** · p75 **2.77** · top **2.86**.
- **The wrong yardstick, named so it stops being reused** — the pooled "2.53–2.75 recent range" the
  09-15 and 08-19 ledgers carry. It mixes $16B new issues with $13B reopenings.
- **Weak print** = bid-to-cover below **2.60** (the slot clears that in 12 of 15) *or* a print below
  its own predecessor's **2.53** (the 08-19 new issue), which would be a paired failure the base rate
  puts at 4 in 28.
- **Strong print** = bid-to-cover at or above **2.77** (slot p75) with indirect share ≥ **69%**.
- **Composition beats the ratio.** Percentages here are on the **competitive** base
  (indirect + direct + dealer), not `total_accepted`, which includes SOMA add-ons — that is why the
  08-19 numbers read 62.9 / 24.6 / 12.5 here and 55.1 / 21.5 / 10.9 if you divide by the wrong thing.
- **The reaction function, measured, not assumed:** 20Y auction days average **−1.77bp** on the 20Y
  (t = −2.28; **−1.56bp** excluding the 2026-08-19 buyback-doubling confound). Mean absolute move
  **4.05bp** vs **4.19bp** on all 919 sessions since 2023 — auction days are *quieter*, not louder.
- **Correlation of bid-to-cover with the same-day yield move is −0.235 (n=44, t = 1.57) — NOT
  significant.** Stated as a null, not buried: this doc cannot show that a weak 20Y print moves the
  20Y. Strong (b/c ≥2.70) vs weak (<2.55) differ by about 3bp.
- **Supply is settled before it opens** — **$13B**, published in `sb0590` (2026-08-05) and restated
  on 10-15. Already owned by
  [`FT-treasury-coupon-announcement-2026-09-10-1`](../forward-tests.md); this doc deliberately does
  not re-register it.
- **New dated adjacency added this pass:** `treasury-2y-note-2026-10-26` — the front-end auction two
  sessions before the FOMC, unlisted until now.
- **Watch (dated):** coupon announcement 10-01 · 3Y **10-06** · 10Y **10-07** · 30Y **10-08** · CPI
  **10-14** · PPI + retail sales + 10-20Y buyback + **this auction's announcement 10-15** · dealer
  agenda + opex **10-16** · **FOMC blackout opens 10-17** · ECB quiet period **10-21** · **this
  auction 10-21** · 5Y TIPS **10-22** · 2Y note **10-26** · **FOMC 10-28** · ECB **10-29**.

## Initial research

### The question, plainly

The calendar entry for this event was created on 2026-09-05 by the
[`treasury-coupon-announcement-2026-10-15`](treasury-coupon-announcement-2026-10-15.md) sweep, and it
arrived with its own supply number already published and already claimed by a registered forward
test. Its `notes` say so in as many words: *"ITS SUPPLY LEG IS SETTLED BEFORE IT OPENS… a soft sale
here is evidence about DEMAND or policy, never about issuance."* That closes off the obvious doc. So
the question this session actually asked was: **when this sale prints on 2026-10-21, how would we
know whether the demand was good or bad — and is the yardstick this calendar already uses for that
correct?**

**One-line verdict:** it is not. The bid-to-cover range every 20Y ledger here grades against pools
new issues and reopenings, which are two non-overlapping populations sold at different sizes; the
apparent "reopenings do better" is a denominator effect that runs opposite to the gross demand, and
correcting it changes the verdict on prints in the 2.50–2.58 zone. The same dataset also deflates the
premise underneath the pooled range — a 20Y auction day is statistically *calmer* than an average
session, so the guard this calendar holds around these sales is right on the conclusion and wrong on
the reason.

### Method

Sourced primary research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (rates mode: no
price instruments apply, `symbols: []`). Every auction statistic below is computed this session from
Treasury's own **`auctions_query`** dataset (fiscaldata API, `original_security_term:eq:20-Year`,
44 auctions with `auction_date >= 2023-01-01`, HTTP 200) — not from a third-party tracker, which is
where the 08-19 ledger's own honest-limits note said its figures came from. Yield levels and
auction-day reactions are computed from Treasury's **daily par yield curve (CMT)** CSVs for 2023–2026
(four fetches, HTTP 200), 919 sessions. Existence, date and settlement are read from the **Tentative
Auction Schedule PDF** (home.treasury.gov, fetched direct 2026-09-05, HTTP 200, 17,195 bytes, text
layer decompressed and glyph tokens reassembled). Market and Fed-path context is dated press, cited
in line.

### Conviction legs, tested

**1. The date, time and `estimate` status are right — SUPPORTED.** The schedule PDF carries the row
verbatim: `20-Year BOND R · Announcement Thursday, October 15, 2026 · Auction Wednesday, October 21,
2026 · Settlement Friday, October 23, 2026`. That matches the checked-in entry exactly. The 1:00pm ET
time is Treasury's standing convention and is **not** separately sourced — the entry says so and this
doc does not upgrade it. `estimate` is correct on both stated counts: a tentative schedule is
tentative, and this lane may not self-confirm an event it discovered in-sweep.

**2. The supply leg is settled in writing and is not this doc's to test — SUPPORTED.** `sb0590`
(2026-08-05) puts the Oct-26 20-Year at **$13B**, and
[`FT-treasury-coupon-announcement-2026-09-10-1`](../forward-tests.md) already predicts that number
against a 37-consecutive-auction grid, scoring 2026-10-16. Re-registering it would double-count one
observation. Everything below is therefore about **demand**, which is the only leg still open.

**3. New-issue and reopening bid-to-cover are two non-overlapping populations — SUPPORTED,
strictly.** From `auctions_query`, 44 20Y auctions since 2023-01:

| Slot | n | min | p25 | median | p75 | max | mean |
|---|---|---|---|---|---|---|---|
| New issue ($16B) | 15 | 2.34 | 2.42 | 2.53 | 2.54 | **2.58** | 2.487 |
| 1st reopening, 19Y11M ($13B) | 14 | **2.50** | 2.58 | 2.74 | 2.76 | 2.87 | 2.686 |
| 2nd reopening, 19Y10M ($13B) | 15 | **2.53** | 2.63 | 2.68 | 2.77 | 2.86 | 2.697 |

The overlap is a five-observation sliver between 2.50 and 2.58. The paired test is cleaner because it
holds the rate regime fixed — comparing each reopening to **its own CUSIP's** new issue, the
reopening won **24 of 28** times. The four exceptions are 2024-09-17 (2.51 vs 2.54), 2024-01-17 (2.53
vs 2.58), 2023-12-20 (2.55 vs 2.58) and 2023-03-21 (2.53 vs 2.54) — all narrow, all in the sliver.

**4. …and the inference everyone draws from that is backwards — SUPPORTED, and this is the finding.**
"Reopenings cover better" reads as "reopenings are better received." Gross competitive **tendered
dollars** say the opposite, and they separate *strictly*:

| Slot | n | mean tendered | min | max |
|---|---|---|---|---|
| New issue | 15 | **$39.32B** | $37.3B | $41.0B |
| Reopening | 29 | **$34.45B** | $30.3B | **$37.2B** |

Every 20Y new issue since 2023 drew more bid dollars than every 20Y reopening. The ratio inverts only
because the offering shrinks faster than the bidding does: **$16B → $13B is −19%**, while tendered
dollars fall **−12%**. A pure size effect would predict a ratio **1.23×** higher at reopenings; the
observed gap is **1.08×** (2.692 / 2.487). So the reopening's better-looking cover is the size effect
*partially offset* by genuinely weaker gross demand — the exact opposite of the story the pooled
range tells. Consequence for grading: bid-to-cover is a **within-slot** statistic and comparing across
slots is meaningless in either direction.

**5. The 09-15 and 08-19 ledgers' kill switches are mis-calibrated by legs 3–4 — MIXED (their
conclusions survive; their thresholds do not).** Both grade against "bid-to-cover materially below
the ~2.53–2.75 recent range." Under leg 3 that band is the union of two distributions. Two concrete
errors it produces: (a) the 08-19 close-out reads that sale's **2.53** as "at the very floor of the
range (not materially below it)" when 2.53 was in fact the **second-highest of 15 new issues** and
above the new-issue median — a firm print graded as a weak one; (b) applied to 2026-10-21, a **2.60**
print would read as comfortably in range when it is in fact bottom-quintile for the second-reopening
slot. Their *stance* — no directional bet, read don't trade — is unaffected and this doc keeps it.

**6. The auction is not a variance event — SUPPORTED, and it deflates the framing rather than the
stance.** Across the same 44 auctions, measuring the 20Y CMT change from prior close to auction-day
close against all 919 sessions since 2023:

| Measure | 20Y auction days | All sessions |
|---|---|---|
| Mean change | **−1.77bp** (t = −2.28) | +0.13bp |
| Mean absolute change | **4.05bp** | 4.19bp |

Auction days are, if anything, *calmer* than average, and the drift is toward **lower** yields —
concession into the sale, relief out of it. Excluding 2026-08-19, whose −11bp the 08-19 close-out
attributes to Treasury's same-day buyback doubling rather than the auction, the drift is −1.56bp
(t = −2.04). By slot, this event's own 19Y10M slot averages −1.87bp with a mean absolute move of
4.13bp; the largest auction-day move in the whole sample is −16bp on 2023-01-18, on a **strong**
2.83 print.

**7. Whether a weak print moves anything is UNPROVEN — reported as a null.** Correlation between
bid-to-cover and the same-day 20Y change is **−0.235** (n=44, t = 1.57, not significant at any
conventional level). The sign is the intuitive one. Splitting the sample, strong prints (b/c ≥2.70,
n=14) average −3.07bp and weak ones (<2.55, n=15) average −0.07bp — about **3bp** of separation. That
is the honest magnitude of this event's own reaction function, and it is smaller than a single
ordinary session's average move.

**8. The load-bearing adjacencies are structural, not tape — SUPPORTED, and they justify `medium`.**
This sale lands inside the FOMC communications blackout that opens **2026-10-17** and **7 days**
before `fomc-2026-10-28`; the 09-15 sibling sold the day *before* an FOMC and is tiered `high`
precisely for that compound, which this one does not carry. Within the 5-day corridor sit opex and
the primary-dealer agenda (10-16), the ECB quiet period (10-21), the 5Y TIPS new issue (10-22) and —
found this session and missing from the calendar — the **2-Year note auction on 10-26**, the tenor
that actually prices policy risk and the last coupon sale before the meeting. `medium` is the right
tier.

**9. Current conditions are logged and are close to worthless at D-46 — stated so rather than
dressed up.** As of the 2026-09-04 close: CMT 2Y **4.37** · 10Y **4.78** · 20Y **5.25** · 30Y
**5.24**; 20s30s **+1bp**, the first positive reading since 08-18, so the 20Y has cheapened back
against the 30Y since the buyback announcement richened it to −3bp on 08-20. VIX **14.53**, Brent
**$95.83**. The session's macro was a large upside surprise — August payrolls **+162,000** against a
**53,000** Dow Jones consensus with June and July revised up, unemployment steady at **4.1%** — which
took CME FedWatch September hike odds from **49.4% to 58%**, moved the 2Y **+8bp** to an intraday
**4.416%** (highest since January 2025) and left the 20Y unchanged on the day. All of it resolves
through the **09-16 FOMC, 35 days before this auction**. It is recorded as the baseline the next
pulse diffs against, not as information about 10-21.

### What plays the conditions support

None. `symbols: []`, the date is `estimate`, no house playbook is rates-keyed, and legs 6–7 say the
event's own price impact is a few basis points at the tenor nobody here trades. The supported
behavior is a **read**, and the read this doc adds is a measuring instrument, not a position.

### Honest limits

- **No tail and no when-issued yield.** `auctions_query` publishes high/low/median yield but not the
  WI level, so the single most diagnostic auction statistic — the tail — cannot be computed from the
  primary here and has to come from press at the time. Every tail figure this calendar carries is
  press-sourced, including July's +0.5bp.
- **n=44 and t≈2.** Leg 6's drift is marginal (p ≈ 0.03; ≈ 0.05 dropping the buyback session), and
  this session tested several splits of one dataset, so no multiple-comparison correction has been
  applied. Treat −1.77bp as "small and probably real," not as a result.
- **Auction-day CMT is a 3pm-close measure against a 1:00pm auction**, so it captures the whole
  session, not the auction window. It over-attributes macro to the auction, which cuts *against* leg
  6's finding rather than for it — the true auction-window variance is smaller still.
- **The direct predecessor has not happened.** 912810UX4's first reopening is 2026-09-15; this doc is
  written before it, and its print is the single most load-bearing fact the next assessment carries.
- **Percentages are on the competitive base** (indirect + direct + dealer), which is what press
  reports; dividing by `total_accepted` includes SOMA add-ons and gives materially different numbers.
- **The 2Y size in the new calendar entry is second-hand.** `sb0590`'s Oct-26 2Y column (69) is
  carried from another sweep's transcription of that row, not re-read from the primary this session,
  and that same row had its FRN column corrected on 2026-09-05.

## Stance & kill switches

**Stance (date `estimate`; size `$13B` primary-sourced and already owned by another forward test).**
No position, no directional bet, no exposure sized off this event — `symbols: []` and the date is an
`estimate`, which widens caution and licenses nothing. The substantive stance is a **grading rule**:
when the 2026-10-21 print lands, it is judged against the **second-reopening slot alone** (n=15,
floor 2.53, median 2.68, p75 2.77), against its own predecessor's 2.53, and on composition on the
competitive base — never against the pooled 2.53–2.75 range this calendar has been using. The
accompanying expectation, registered as
[`FT-treasury-20y-bond-2026-10-21-1`](../forward-tests.md), is that the print clears **2.60**.

**Kill switches:**

- **Bid-to-cover below 2.53 on 2026-10-21** — the second-reopening slot's 15-auction floor breaks and
  its own new issue is beaten. The population claim in legs 3–4 fails out of sample and the pooled
  range was, accidentally, not the worse tool.
- **The 2026-09-15 reopening printing below 2.50** — the reopening population's 44-auction floor,
  breaking one cycle early on the same CUSIP. Would say deterioration is live now, not a yardstick
  question, and the stance here would be rewritten before this event's own announcement.
- **A >10bp single-session move in the 20Y on 2026-10-21** — outside all but one auction-day move
  since 2023. Leg 6's "auction days are quiet" would be refuted in the one observation it was written
  for, and the guard would go back to being about the auction rather than its neighbours.
- **Treasury announcing the 20Y at a size other than $13B on 2026-10-15** — the supply leg stops
  being settled, and every claim above that treats issuance as a constant gets re-derived rather than
  patched. Owned and scored by `FT-treasury-coupon-announcement-2026-09-10-1`; listed here because it
  invalidates this doc too.
- **A hawkish 09-16 FOMC that re-opens the long end** — leg 9's tape is a baseline, not a forecast,
  and a policy repricing between now and the 10-17 blackout would change what this sale sells into
  even though it changes nothing about the grading rule.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-46 | Initial research banked (doc above); the calendar entry itself is one day old, created by the 10-15 coupon-announcement sweep. Written Saturday, so all readings are the 09-04 close. **Event tape — the finding, computed from Treasury primaries this session, not carried.** `auctions_query` (`original_security_term:eq:20-Year`, 44 auctions since 2023-01) shows 20Y **new issues** ($16B) covering 2.34–2.58 and **reopenings** ($13B) covering 2.50–2.87, with reopenings beating their own cycle's new issue in **24/28** pairs — so the pooled "~2.53–2.75 recent range" the 08-19 and 09-15 ledgers grade against mixes two near-disjoint populations. Competitive **tendered dollars** separate strictly the other way (new issue $37.3–41.0B vs reopening $30.3–37.2B, zero overlap): the higher reopening ratio is a **denominator effect** (offering −19%, bids −12%), so it is not evidence of better demand. Correct yardstick for this event's slot (2nd reopening, 19Y10M, n=15): floor **2.53** · p25 2.63 · median **2.68** · p75 2.77 · max 2.86. Second measurement, same data + CMT 2023–2026 (919 sessions): 20Y auction days average **−1.77bp** on the 20Y (t = −2.28; −1.56bp, t = −2.04 excluding the 2026-08-19 buyback-doubling confound) with mean absolute move **4.05bp vs 4.19bp** on all sessions — auction days are *quieter* than average and drift toward lower yields. corr(bid-to-cover, same-day 20Y move) = **−0.235** (n=44, t = 1.57, **not significant**); strong (≥2.70) vs weak (<2.55) prints differ by ~3bp. Reported as a null. **Primary verification:** Tentative Auction Schedule PDF (fetched direct today, HTTP 200, 17,195 bytes) carries `20-Year BOND R / ann Thursday, October 15, 2026 / auc Wednesday, October 21, 2026 / set Friday, October 23, 2026` verbatim — entry exact; size $13B stays with `FT-treasury-coupon-announcement-2026-09-10-1` and is deliberately not re-registered here. **Macro:** August payrolls **+162,000** vs a **53,000** Dow Jones consensus (09-04, BLS via CNBC/UPI), unemployment **4.1%**, June and July revised up — CME FedWatch September hike odds **49.4% → 58%**, 2Y **+8bp** to an intraday **4.416%** (highest since Jan 2025), Dow −0.51% / S&P −0.38% / Nasdaq −0.29%. This **reverses** the hold-modal read the 09-15 sibling recorded at its D-11 row on ADP/Challenger/Waller — but it resolves at the **09-16 FOMC, 35 days before this auction**, so it is logged as baseline, not signal. **Rates levels (CMT 09-04):** 2Y 4.37 · 5Y 4.54 · 10Y 4.78 · 20Y **5.25** · 30Y **5.24**; **20s30s +1bp**, first positive since 08-18, undoing the −3bp richening that followed the 08-19 buyback doubling — a small measured point *against* the "20Y is the awkward tenor getting worse" framing, in the same direction the 09-15 sibling found at D-11. **Volatility:** VIX **14.53** (09-04 close), up 0.21 from 14.32 on 09-03, still near the 2026 low; no regime change. **Geopolitical / energy:** Brent **$95.83** (09-04), the same Hormuz-driven leg the sibling ledgers carry; unchanged in kind this pass. **Peers:** n/a — `symbols: []`. **New dated adjacency found → proposed in this PR:** the **2-Year Note auction 2026-10-26** (schedule PDF: announce 10-22, auction 10-26, settle 11-02), unlisted on this calendar and sitting **two sessions before fomc-2026-10-28** inside the blackout — the front-end tenor that actually prices policy risk (it moved +8bp on 09-04 while the 20Y moved 0). Added `status: estimate` (`EST:`) per this lane's no-self-confirm limit. The **5Y (10-27)** and **7Y (10-29)** rows of the same announcement were seen in the same fetch and **deliberately not added** — outside the 5-day corridor this sweep governs; named here so the next sweep that owns them can. Everything else dated in the corridor is already tracked (import/export prices + opex + dealer agenda 10-16, blackout 10-17, ECB quiet period 10-21, 5Y TIPS 10-22). **Forward test registered:** `FT-treasury-20y-bond-2026-10-21-1` — the print clears bid-to-cover **2.60**, base rate 12/15 disclosed up front, scores 2026-10-22. | — (stance set: read-don't-trade, plus a corrected grading rule for every future 20Y print) | 2026-09-26 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
