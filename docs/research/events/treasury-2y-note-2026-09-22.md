# 2-Year Treasury Note auction — treasury-2y-note-2026-09-22

**Kind:** rates · **Date:** 2026-09-22 (confirmed, TSY: home.treasury.gov Tentative-Auction-Schedule.pdf — announcement Thu 2026-09-17, auction Tue 2026-09-22, settlement Wed 2026-09-30, 1:00pm ET; PDF re-fetched and text-extracted direct 2026-09-02) · **Impact:** medium
**Last assessed:** 2026-09-02
<!-- probe-ref: {"symbols":{},"vix":16.34,"daysBand":"medium:8+","adjacentIds":["durable-goods-2026-09-25","opex-2026-09-18","scoos-2026-09-24","treasury-10y-tips-2026-09-17","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","trump-xi-summit-2026-09-24"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Watch, no play** — but this auction carries a finding that corrects a standing
assumption on this calendar. The 2-year is the tenor absorbing the September repricing hardest
(2Y CMT **4.17 → 4.39%**, **+22bp** over 8/25–9/1, vs 5Y +20, 10Y +15, 30Y +10 — Treasury's own par
curve), and 4.39% is the **2026 high**. Yet front-end demand is not merely holding, it is
*improving*: the 2026-08-25 auction — the first after the front end began repricing — drew
**indirect bidders at 66.0%** of competitive accepted, the **highest of the last twelve** $69B 2Y
auctions (prior-11 mean 57.2%), with dealers taking **10.9%** vs a 12.0% norm and a **−0.4bp
stop-through**. So the calendar's standing "soft foreign demand" read is a **belly** phenomenon
(the 5Y's 61.5% vs a ~65.7% norm), **not** a front-end one. Landing 6 days after the 9/16 FOMC and
4 after OpEx, 9/22 is the first *nominal coupon* auction to price the post-decision policy path,
and the 9/23 5Y and 9/24 7Y inherit its read. Date, announcement and settlement are **confirmed**
from the primary schedule; this auction's own size, CUSIP and demand do not exist yet. No tracked
tickers — nothing here licenses a position in any name.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/2) | **Stand aside** | High | 20 days out, no tickers, size unannounced until **2026-09-17** — there is nothing to act on. | Nothing at D-20; a symbol-less front-end supply event licenses no action on any horizon |
| This week | **Stand aside** | High | The **9/4** jobs print and **9/11** CPI set the hike odds this auction will clear against; the auction sets nothing. | The **2026-09-04** jobs print, which moves the path this auction only prices |
| This month | **Watch** — a real read, not background | Medium | First nominal coupon auction after the **9/16** FOMC; its indirect share is the cleanest test of whether front-end demand survives a hike-modal decision. | The **2026-09-16** FOMC cutting, or hiking more than 25bp — the policy premise changes and the demand read is rebuilt, not patched |
| This quarter | **Watch** | Medium | Strong front-end foreign demand is a *counterweight* to the standing duration caution: a repricing being willingly absorbed is far less dangerous than one meeting a buyers' strike. | Indirect printing **below 57.2%** on **2026-09-22**, which says foreign-demand weakness is not tenor-specific after all (registered as **FT-47**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Benign tell (the base case):** indirect ≥ **57.2%** of competitive accepted on 9/22 → the front
  end is absorbing the policy repricing willingly; the duration caution on long-duration tech stays
  a *belly/long-end* story, not a systemic funding one.
- **Bearish-for-duration tell:** indirect below ~53% (the 12-auction low is 53.2%) **and** dealers
  above ~13% → foreign demand weakness has spread to the front end; raise caution one notch on
  long-duration names, still never a directional trade.
- **Curve tell:** 2s10s at **40bp** (9/1) from 47bp on 8/25 — further bear-flattening into 9/22 means
  supply meets a market already repriced; a bear-steepening says the driver rotated to the long end.
- **Size tell:** any deviation from **$69B** at the **2026-09-17** announcement — unchanged for
  twelve straight auctions, primary-sourced — breaks the like-for-like series and voids FT-47.
- **Never** — no directional bet, no new unhedged duration exposure into the 1:00pm ET release.
- **Watch (dated)** — jobs **Sep 4** · CPI **Sep 11** · **FOMC Sep 15–16** · size announcement
  **Sep 17** · 10Y TIPS **Sep 17** · OpEx **Sep 18** · this auction **Sep 22** · 5Y **Sep 23** ·
  7Y **Sep 24** · settlement **Sep 30**.

## Initial research

**The question, plainly:** the 2-year note is the shortest and most policy-path-sensitive coupon
tenor Treasury issues. What does its 2026-09-22 auction — the first nominal coupon supply after a
FOMC that is now hike-modal — say about who is willing to fund the front end at a repriced rate, and
does it change behavior around the long-duration names this calendar tracks?

**One-line verdict:** front-end demand is *strengthening* into the repricing, not weakening —
the opposite of the belly's story — which makes this a watch-worthy confirming read on an orderly
selloff, and still not a trade: no symbols, no directional edge, no position sized to it.

**Method:** sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (rates
mode — no price instruments; the house instruments are symbol-keyed and this event has
`symbols: []`). Every auction figure below comes from **Treasury's own primary record**, fetched
today: the Fiscal Data auctions dataset (`auctions_query`) for the twelve-auction series, and the
2026-08-25 **TREASURY AUCTION RESULTS press release** (treasurydirect.gov `R_20260825_2.pdf`,
decompressed and read directly) for the allotment denominators. Rate levels are Treasury's own
daily par yield curve (`daily_treasury_yield_curve`, 2026 series, fetched today). Date/announcement
provenance is the tentative auction schedule PDF (home.treasury.gov), re-fetched and text-extracted
independently this session. FOMC pricing is carried from [`fomc-2026-09-16.md`](fomc-2026-09-16.md)
(assessed today) plus press-reported CME FedWatch with as-of dates. Each claim dated in line.

### Conviction legs, tested

**1. The date, announcement and settlement are right — SUPPORTED, and the entry is upgraded to
`confirmed` in this PR.** Treasury's tentative auction schedule carries the row verbatim:
`2-Year NOTE · Thursday, September 17, 2026 · Tuesday, September 22, 2026 · Wednesday, September 30,
2026` (announcement · auction · settlement). This calendar entry was filed `estimate` on 2026-09-02
by the 5Y sibling's adjacency sweep, on the *procedural* ground that a sweep should not self-confirm
an event it just discovered — not on any date doubt. That ground is discharged here: an independent
session re-fetched the same primary PDF, and `TSY:` (treasury.gov / treasurydirect.gov auction
schedule) is an authorized `confirmed` prefix in `market-events-data.ts`'s own source-prefix policy,
already carried by every sibling auction on the identical schedule (3Y 9/8, 10Y 9/9, 30Y 9/10, 20Y
9/15, TIPS 9/17, 5Y 9/23, 7Y 9/24). Leaving it `estimate` while the 5Y one PDF line below is
`confirmed` would imply a date doubt that does not exist. **Note what this does and does not
license:** `confirmed` covers the date; the stance below stays observational, and no date-keyed
action follows from it.

**2. The 2-year is leading the entire selloff — SUPPORTED, and it is sharper than the belly read.**
Treasury's daily par yield curve, 2026-08-25 (the last 2Y auction) → 2026-09-01:

| Tenor | 8/25 | 9/1 | Δ |
|---|---|---|---|
| 3M | 3.86 | 3.92 | +6bp |
| 1Y | 4.01 | 4.18 | +17bp |
| **2Y** | **4.17** | **4.39** | **+22bp** |
| 5Y | 4.35 | 4.55 | +20bp |
| 10Y | 4.64 | 4.79 | +15bp |
| 30Y | 5.17 | 5.27 | +10bp |

Monotone decay with maturity: this is a pure **policy-path** repricing, not a term-premium event.
The 5Y sibling's 2026-09-02 amendment called the move "belly-led" off Fed H.15 covering 8/25–8/31;
extending one session to 9/1 shows it is more precisely **front-end-led**, with the 2Y the single
most-affected tenor. 4.39% is the **2026 high** for the 2Y (2026 range 3.38–4.39, low 2026-02-27),
and 2s10s has flattened **47bp → 40bp**. At today's level this auction would clear roughly **19bp
above** August's 4.204% stop and above the twelve-auction series high of 4.315% (2026-07-27) — i.e.
the highest 2Y stop on the tracked record.

**3. The driver is a genuine base-case flip, and it is hike-modal but contested — SUPPORTED,
with the dispersion named.** Warsh's **2026-08-28** Jackson Hole keynote (PCE cited at 3.7%
12-month, 4.1% 6-month annualized) took September from hold-favored to hike-favored: CME FedWatch
**66%** hike on 8/31 (Forbes) and **~65–68%** on 9/1–9/2 (TechTimes), from ~36% pre-speech.
But the prediction venues disagree — the FOMC sibling records Kalshi/Polymarket at **~41–55%**,
"the widest cross-venue gap this ledger has recorded," and a cut at **0%** everywhere. Supporting
prints since: ISM Manufacturing Aug **54.6** with prices paid **71.1**; JOLTS Jul openings
**7.271M**, quits **1.9%** — cooling labor against sticky input costs, the combination that
sustains hike pricing. Target range has been 3.50–3.75% all year. **The 2Y is pricing the path
explicitly:** 4.39% against a 3.92% 3-month bill is ~**47bp** of expected tightening — roughly two
25bp hikes over the tenor's life. That is what makes this auction a policy read rather than a
supply read.

**4. Front-end demand is strong and *improving* — SUPPORTED, and it corrects a standing calendar
assumption.** Twelve consecutive 2-year note auctions, every one **$69B** (Treasury Fiscal Data,
fetched today; shares computed on **total competitive accepted**, the denominator Treasury's own
results release uses — $68.107B on 8/25):

| Auction | High yield | Median | B/C | Indirect | Direct | Dealer |
|---|---|---|---|---|---|---|
| 2026-08-25 | 4.204% | 4.157% | 2.60 | **66.0%** | 23.1% | **10.9%** |
| 2026-07-27 | 4.315% | 4.270% | 2.66 | 56.6% | 34.1% | 9.4% |
| 2026-06-23 | 4.189% | 4.138% | 2.64 | 55.5% | 34.3% | 10.2% |
| 2026-05-26 | 4.071% | 4.015% | 2.64 | 57.6% | 30.1% | 12.3% |
| 2026-04-27 | 3.812% | 3.750% | 2.65 | 56.5% | 31.6% | 11.9% |
| 2026-03-24 | 3.936% | 3.865% | 2.44 | 59.4% | 16.5% | 24.1% |
| 2026-02-24 | 3.455% | 3.403% | 2.63 | 55.9% | 34.3% | 9.8% |
| 2026-01-26 | 3.580% | 3.540% | 2.75 | 64.4% | 28.3% | 7.3% |
| 2025-12-22 | 3.499% | 3.445% | 2.54 | 53.2% | 34.1% | 12.7% |
| 2025-11-24 | 3.489% | 3.434% | 2.68 | 58.1% | 30.7% | 11.2% |
| 2025-10-27 | 3.504% | 3.453% | 2.59 | 53.7% | 34.8% | 11.6% |
| 2025-09-23 | 3.571% | 3.520% | 2.51 | 57.7% | 30.8% | 11.5% |

Prior-11 means: indirect **57.2%**, dealer **12.0%**, bid-to-cover **2.61**. The 2026-08-25 auction
therefore printed the **series-high indirect share** with **below-average dealer takedown** — the
two legs that together mean end users, not underwriters, cleared the paper. Treasury's own results
release adds `Allotted at High 85.68%` and a median of 4.157% (4.7bp inside the stop); against a
press-reported when-issued of **4.208%** (cryptobriefing, 2026-08-25 — *secondary, not primary*;
flagged as such), the stop is a **−0.4bp stop-through**. **The correction this forces:** the 5Y
ledger's live finding is soft *foreign* demand (indirect 61.5% vs a ~65.7% norm), and the calendar
has been carrying that as the durable weak leg of Treasury demand generally. On the 2Y it is not
merely absent — it is inverted. The honest reading is that indirect appetite is **tenor-selective**:
at 4.2%+ with hikes priced, the 2Y offers carry with minimal duration risk, which is precisely the
reserve-manager parking tenor. Weak belly demand and strong front-end demand are consistent, not
contradictory.

**5. Bid-to-cover is inelastic to the repricing — SUPPORTED, and it corroborates FT-20 on a
second tenor.** Across a **+86bp** climb in the clearing yield (3.455% Feb → 4.315% Jul), 2Y
bid-to-cover ran **2.44–2.75**, mean 2.61 — no trend against yield. That is the same claim
[`forward-tests.md`](../forward-tests.md) FT-20 registered for the 3Y (2.54–2.71, σ 0.055, across
+68bp), measured independently here on a different tenor and a longer series. The single outlier is
2026-03-24 (B/C 2.44, dealers 24.1%, directs 16.5%) — one dealer-absorbed auction inside an
otherwise flat band, not a trend.

**6. The sequencing makes this the read-through, not the echo — SUPPORTED.** 9/22 lands **6 days
after** the 9/16 FOMC and **4 after** the 9/18 quarterly OpEx. The 9/17 10Y TIPS reopening is the
only auction between them, and it reads real yields and breakevens, not nominal front-end demand.
So 9/22 is the **first nominal coupon auction to price the post-decision policy path**, and the
9/23 5Y and 9/24 7Y — both `confirmed`, both announced the same 9/17 — inherit whatever it
establishes. The calendar entry's own `notes` field claims exactly this role; this leg is its
evidence.

**7. No-symbol, medium-impact conditioning event — SUPPORTED.** `symbols: []`; the house playbooks
(S1/S2/E1/S3/S4/G1) are symbol-keyed and none applies. Its role is a conditioning input on the
rate-sensitivity read for long-duration names. Sensitivity tier unchanged from the sibling rates
ledgers: CRWV highest, then NVDA/AVGO/MRVL, then mega-cap MSFT/GOOG/META, least direct AAPL/AMZN.

**What plays the conditions support:** none directional, none symbol-keyed — the guard-shaped house
answer. The one thing this event *does* change is the **character** of the standing duration
caution. A selloff whose front end clears with record indirect participation and below-average
dealer takedown is a repricing being **absorbed**, not a funding stress. That distinction argues
against escalating the duration guard on rate levels alone, and it is worth a sentence, not a
position.

**Honest limits.** This auction's size, CUSIP and demand **do not exist yet** — the announcement is
2026-09-17, and the $69B baseline is a primary-sourced twelve-auction constant, not a fact about
this auction. The when-issued 4.208% behind the "stop-through" characterization is **press-sourced,
not primary**; every other figure in leg 4 is Treasury's own. FOMC odds are point-in-time, drift
daily, and the venues disagree by 10–25 points — the cross-venue band, not a single number, is the
honest input. The `+22bp` front-end lead is measured over five sessions (8/25→9/1); one week is a
short window to call a regime. n=12 auctions is a thin series for any distributional claim, and
the indirect share is a noisy allotment statistic, not a demand curve. No symbols, medium impact:
nothing here licenses a trade in any name.

## Stance & kill switches

**Stance (confirmed-date event; no standalone play):** watch-only. Do not size or time any position
off this auction's expected or actual result, in isolation or otherwise. Its actionable role is a
**conditioning input** on the front-end/policy-path side of the long-duration-tech rate read, and
its specific contribution is a *correction*: the soft-foreign-demand concern this calendar carries
is a **belly** phenomenon (5Y indirect 61.5% vs a ~65.7% norm), not a front-end one — the 2Y's last
auction drew the strongest indirect share of its twelve-auction series (66.0% vs a 57.2% prior-11
mean) with below-average dealer takedown, while the 2Y simultaneously led every other tenor in the
repricing (+22bp, 8/25→9/1). Read 9/22 as the first nominal-coupon verdict on post-FOMC front-end
demand, which the 9/23 5Y and 9/24 7Y then inherit. Nothing here is directional.

**Kill switches (what would change this stance):**

- **The core one — indirect below 57.2% on 2026-09-22.** The tenor-selectivity read (leg 4) is what
  makes this doc more than a restatement of the 5Y's. If the front end's indirect share falls back
  to or below the prior-11 mean, foreign-demand weakness is **not** tenor-specific, the correction
  above is withdrawn, and the belly ledger's read generalizes. Registered as **FT-47** in
  [`forward-tests.md`](../forward-tests.md), score by 2026-09-23.
- **A size change at the 2026-09-17 announcement.** Twelve straight $69B auctions is a
  primary-sourced constant; any deviation breaks the like-for-like series, changes the absorption
  math, and must be logged off-cadence regardless of when the next pulse is due.
- **The FOMC resolving against the hike-modal base case** (a hold with hike odds falling back under
  ~40%, or any cut). The "2Y is pricing ~47bp of tightening" premise (leg 3) lapses and this reverts
  to routine month-end front-end supply — log the reversion rather than carrying the amendment
  forward on momentum.
- **Bid-to-cover printing outside 2.44–2.75.** The inelasticity read (leg 5) dies on either side,
  and with it FT-20's cross-tenor corroboration; the twelve-auction band stops being usable as a
  base rate for the October (10/26) and November (11/23) 2Ys.
- **An extreme result in either direction** — a stop-through with indirect at a new series high, or
  a material tail with indirect at series lows — landing into a hawkish FOMC aftermath escalates
  this from context to an explicit same-day caution note on long-duration names, worth a pulse
  off-cadence.
- **Nothing here licenses date-keyed *action*.** `confirmed` covers the date only; the stance stays
  observational, and observations widen caution rather than licensing entries.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-02 | D-20 | Initial research banked (doc above); `probe-ref` block populated with real readings this pass, so this event's first `interval-elapsed` pulse is screenable rather than automatically material. **Event tape (primary).** Date/announcement/settlement re-verified verbatim from home.treasury.gov's Tentative-Auction-Schedule.pdf (re-fetched and text-extracted independently today): announce **Thu 2026-09-17**, auction **Tue 2026-09-22**, settle **Wed 2026-09-30**. Entry upgraded `estimate` → **`confirmed`** (`TSY:`) in this PR — the original `estimate` was filed on the 5Y sweep's no-self-confirm rule, not on date doubt, and an independent session on an authorized prefix discharges it. This auction's own size/CUSIP/demand still do not exist (announcement 9/17); Treasury's `upcoming_auctions` API returns nothing for the window, consistent with pre-announcement. **The load-bearing finding — front-end demand is strong, and the calendar's "soft foreign demand" read is belly-specific.** Pulled the full twelve-auction 2Y series from Treasury's Fiscal Data auctions dataset plus the 2026-08-25 results press release (`R_20260825_2.pdf`, decompressed and read direct) for the competitive-accepted denominator: every auction **$69B** Sep-2025→Aug-2026 (a primary-sourced constant, not an assumption), bid-to-cover **2.44–2.75** (mean 2.61) across a **+86bp** climb in the clearing yield. The **2026-08-25** print drew **indirect 66.0%** — the **series high**, vs a 57.2% prior-11 mean — with dealers just **10.9%** (12.0% norm), median 4.157% and `Allotted at High 85.68%`; against a press-reported 4.208% WI (secondary, flagged) that is a **−0.4bp stop-through**. This **inverts** the read the 5Y ledger carries (indirect 61.5% vs a ~65.7% norm): indirect appetite is **tenor-selective**, strongest exactly where carry meets minimal duration risk. Leg 5 also corroborates **FT-20** (3Y bid-to-cover inelasticity) independently on a second tenor. **Macro — and a sharpening of the 5Y's "belly-led" call.** Treasury's own par yield curve 8/25→9/1: 2Y **4.17→4.39 (+22bp)**, 5Y +20, 10Y +15, 30Y +10, 3M +6 — monotone decay with maturity, so the move is **front-end-led**, not belly-led; 4.39% is the **2026 high** (range 3.38–4.39) and 2s10s flattened **47→40bp**. 2Y at 4.39 vs a 3.92% 3M bill prices ~**47bp** of tightening (~two hikes). Driver: Warsh's 8/28 Jackson Hole keynote (PCE 3.7% 12-mo / 4.1% 6-mo annualized) → CME FedWatch **66%** hike 8/31 (Forbes) and ~65–68% on 9/1–9/2 (TechTimes) from ~36% pre-speech; **contested** — the FOMC sibling records Kalshi/Polymarket at ~41–55%, cut 0% everywhere, so the honest input is the **band**, not a number. Prints since: ISM Mfg Aug **54.6**, prices paid **71.1**; JOLTS Jul openings **7.271M**, quits **1.9%**. **Peers:** `symbols: []`; NVDA's 8/26 beat and AVGO tonight are AI-demand tape and bear on rate-demand not at all. **Volatility:** VIX **16.34** (own probe, 9/1 close) — up from the 14.43 2026-low struck 8/28, so the FOMC ledger's cheap-convexity window has partly closed. **Geopolitical:** Brent ~$91 after the Hormuz/Larak escalation feeds the *inflation* leg that drives the hike pricing — for this tenor that is a direct transmission channel, not a long-end-only one. **Sequencing:** 9/22 is 6d after the FOMC, 4d after OpEx, and the **first nominal coupon auction** post-decision (the 9/17 10Y TIPS reads real yields, not nominal front-end demand); the 9/23 5Y and 9/24 7Y inherit its read. **New dated adjacencies — none proposed.** Everything the sweep surfaced is already tracked (TIPS 9/17, OpEx 9/18, 5Y 9/23, 7Y 9/24, SCOOS 9/24, Trump–Xi 9/24, durable goods 9/25). Two deliberate non-proposals, recorded: the **2-Year FRN reopening 2026-09-23** on the same PDF (a floating-rate reopening carries no duration or policy-path read — same call the 5Y sibling made) and the **October 2Y (announce 10/22, auction 10/26)**, which is 34 days from this event and not adjacent to it. **Forward test registered: FT-47** — indirect ≥ 57.2% on 9/22; null pass rate stated up front at **5/11 ≈ 45%** of prior auctions, so it is genuinely informative in either direction. | — (stance set) | 2026-09-09 (medium, 8–30d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
