# 10-Year Treasury Note auction (reopening) — treasury-10y-note-2026-09-09

**Kind:** rates · **Date:** 2026-09-09 (confirmed, TSY: treasury.gov tentative schedule — 1:00pm ET, formal announce ~6bd prior, checked 2026-08-18) · **Impact:** high
**Last assessed:** 2026-09-10
<!-- probe-ref: {"symbols":{},"vix":17.84,"daysBand":"high:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","buyback-blackout-start-2026-09-12","canada-counter-tariffs-effective-2026-09-08","cpi-2026-09-11","ecb-decision-2026-09-10","eia-steo-2026-09-09","existing-home-sales-2026-09-10","fomc-blackout-start-2026-09-05","g20-energy-abundance-ministerial-houston-2026-09-14","gastech-2026-09-14","iea-omr-2026-09-11","jgb-liquidity-enhancement-1-5y-2026-09-10","jobs-2026-09-04","labor-day-market-closure-2026-09-07","missouri-map-ballot-deadline-2026-09-08","mts-august-2026-09-11","opec-momr-2026-09-10","opec-plus-meeting-2026-09-06","ppi-2026-09-10","qss-q2-2026-09-09","sp-rebalance-proforma-2026-09-04","sp-rebalance-proforma-capped-2026-09-11","treasury-30y-bond-2026-09-10","treasury-3y-note-2026-09-08","treasury-buyback-10y20y-2026-09-10","treasury-buyback-cash-mgmt-2026-09-09","treasury-buyback-increase-2026-09-09","treasury-coupon-announcement-2026-09-10","umich-sentiment-prelim-2026-09-11"],"screenStreak":0,"blocked":[{"url":"https://www.opec.org/press-releases.html","status":403,"at":"2026-09-09"},{"url":"https://www.bls.gov/news.release/cpi.nr0.htm","status":403,"at":"2026-09-09"},{"url":"https://www.cnbc.com/2026/09/09/treasury-yields-oil-inflation.html","status":403,"at":"2026-09-10"},{"url":"https://www.cnbc.com/2026/09/10/us-treasurys-bonds-yield.html","status":403,"at":"2026-09-10"},{"url":"https://www.cnn.com/2026/09/10/investing/oil-iran-war-diesel","status":451,"at":"2026-09-10"}]} -->

## At a glance

**TL;DR.** **The auction is scored, and it answered its own question while the tape ignored the
answer.** The reopening priced at 1:00pm ET on **2026-09-09** (**confirmed**) and on demand it was
the **best 10-year auction of its lineage**: $39B at a **4.8340%** high yield, **bid-to-cover 2.710 —
the highest of 28 nominal 10Y auctions since June 2024** — indirects **79.18%** (6.5pp *above* the
72.66% reopening mean, 4th of 28), directs 16.51%, and **primary dealers at 4.31%**, the
second-lowest takedown in the same set. It **stopped through by ~1.5bp**. Every figure but the tail
is read straight off Treasury's own `auctions_query` for CUSIP **91282CRF0** (results
`R_20260909_2.pdf`). **So the contagion question this document was built on is answered: no.** The
light-indirect run that ran through the 5Y, 7Y and 3Y did **not** reach the curve-setting tenor —
[FT-treasury-10y-note-2026-09-09-1](../forward-tests/treasury-10y-note-2026-09-09.md) **passes by
11.2pp** — and the next day's 30Y reopening confirmed it harder (indirects **79.48%**, dealers
**2.21%**, the lowest of *its* own 28-auction lineage). **And the curve sold off anyway.** The
best-bid auction in two years bought **1.6 basis points**, of which **0.8bp survived to the close**
(^TNX 4.845 pre-auction → 4.829 low → 4.837 close), and the 10-year gave back **12bp the next day**:
Treasury's par curve reads 10Y **4.80 (9/8) → 4.83 (9/9) → 4.95 (9/10)**, a two-day **+15bp
bear-flattening** to the highest 10-year since November 2023. **The driver is oil, and it is
measurable rather than narrated** — Brent **97.92 → 101.21 → 109.19** (+11.5% in two sessions) after
the US destroyed five Iranian tankers and Trump said on 9/9 he is "not looking for a deal with Iran",
and **4.8bp of 9/10's 10.7bp move was already done before PPI printed at 8:30am ET**. PPI itself was
exactly the divergence this doc named at D0: headline **+0.4% m/m in line**, **5.4% y/y vs 5.3%
expected** on a **+4.2% energy** component, **core +0.2% vs +0.3% expected** — *softer* at the core.
September hike odds went **58.1% (9/8) → ~68.7% (9/10, 06:15PM EDT)**, leaving D10's ~75% threshold
about 6pp away. **The lesson this close-out banks is the one the doc did not have going in:**
primary-market demand and the direction of yields **decoupled completely** — two auctions that drew
near-record real-money sponsorship sat inside the sharpest two-day selloff of the corridor, because
the marginal price was being set by an energy-driven inflation repricing an auction cannot
arbitrate. The guard held and cost nothing; **CPI 9/11 and the 9/16 FOMC are the live documents from
here**, not this one.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/10, D+1) | **Closed — the event is spent, and it is not admissible as a rates signal in either direction** | High | The print is scored from the primary and it was outstanding on every demand metric (cover **2.710**, best of 28; indirects **79.18%**; dealers **4.31%**; stopped through ~1.5bp). It bought **1.6bp**, kept **0.8bp** to the close, and was overwhelmed by **12bp** the following session. There is nothing left in it to trade and nothing in it that forecasts the next session. | A Treasury revision to the 2026-09-09 result on `auctions_query` for CUSIP **91282CRF0** that materially moves the 79.18% indirect share or the 2.710 cover — the only route by which the scored facts change |
| This week | **CPI on 2026-09-11 owns what is left of the week — stay flat the print, exactly as through the auction** | High | The auction-specific risk resolved favourably and the macro risk widened in its place: hike odds **~68.7%**, Brent **$109.19**, 10Y **4.95%**. PPI split the way D0 predicted — energy **+4.2%** pushing the y/y to 5.4% while **core came in softer** at +0.2% vs +0.3% — so Friday's **core** is the one number that arbitrates between the two stories. | A core CPI at or under **+0.2% m/m** on **2026-09-11** that still leaves September hike odds above **~65%** — the energy channel would then have fully decoupled from the gauge the Fed says it watches, and this doc's D0 read of that divergence was too generous to the buyer |
| This month | **Flat the 9/16 FOMC corridor for the high-duration book — the auction result bought no cover** | High | The corridor's remaining stack (CPI+MTS 9/11 · 20Y 9/15 · **FOMC 9/16** · TIPS 9/17 · OpEx 9/18) now runs into a **~68.7%**-priced hike that rose **10.6pp in two sessions on oil alone**, with VIX up from 15.72 to **17.84**. CRWV/NVDA/AVGO/MRVL stay sized for both tails; a well-bid coupon block changed none of that. | September hike odds settling above **~85%** or below **~30%** before **2026-09-16** — a decision the market has already resolved no longer needs corridor discipline |
| This quarter | **Coupon-auction demand has stopped being a readable term-premium signal — read oil and core instead** | Medium | Two consecutive best-in-lineage auctions (10Y 9/9 dealers **4.31%**, 30Y 9/10 dealers **2.21%**, both near-record-low) sat inside a **+15bp** two-day selloff. Supply is clearing at whatever yield the market names, so the auction is a *lagging* read on term premium this quarter, not a leading one. | A 10Y or 30Y auction before **2026-12-31** that tails **≥2bp** with indirects **below 65%** — genuine demand deterioration at the benchmark would restore auctions as the channel this quarter's evidence says they stopped being |

**Signals & conditions** — the closed state; the full switch-by-switch history is in
*Stance & kill switches* below and is not repeated here:

- **The contagion switch fired on its favourable branch, and it is retired.** The 8/30 switch asked
  for a third light indirect print **at the 10Y**; the reopening printed **79.18%** against a
  **72.66%** reopening mean (n=18 prior, primary-measured). The 5Y/7Y/3Y run was a front-end and
  belly phenomenon and did not reach the benchmark. **Leg 3 — "the 10Y is the strong tenor" — is
  SUPPORTED on the strongest evidence this doc ever produced.**
- **The 9/10 30Y was the doc's own named confirm/deny, and it confirmed harder.** $22B reopening,
  high yield **5.3080%**, cover **2.610**, indirects **79.48%** (2nd of 28 since 2024-06 vs a 65.51%
  mean), primary dealers **2.21% — the lowest of the whole set**. Foreign sponsorship is intact at
  *both* ends of the curve.
- **The oil switch fired hard, in the escalation direction, and it is what actually moved rates.**
  Brent **$97.92 (9/8) → $101.21 (9/9) → $109.19 (9/10)**, WTI to **$104.06** — the switch's ~$90
  branch never came close to its ~$85 de-escalation branch. The **Iran–Oman off-ramp is dead**:
  Trump said on 9/9 he is not seeking a deal, and no IMO filing was ever found.
- **The Fed switch's "stall" observation from D0 was wrong within 48 hours.** Hike odds went
  **58.1% (9/8) → ~68.7% (9/10 06:15PM EDT, Investing.com Fed Rate Monitor; ~70% on the Reuters/Globe
  and Mail read, 63% on prediction markets)**. Oil resumed repricing the Fed with force, and D10's
  **~75%** threshold — "the auction's buyer is holding through a policy-uncertainty event" — is now
  the live risk into 9/16 rather than a hypothetical.
- **The VIX ~18 condition arrived one session late.** D5 asked for a re-expansion above ~18 *before*
  9/9 as the tell that the tape had started pricing the corridor. VIX closed **16.46** on auction day
  and **17.84** on 9/10 — the corridor got priced the day *after* the auction, not before it.
- **Leg 5 split its own two forms on consecutive sessions, which is the cleanest read this doc got
  on it.** Its *refuted* form (an ordinary rising-yield session) failed a third time on **9/9**:
  yields +3bp, and **MRVL +4.1%** while CRWV −4.9%. Its *retained* form (an acute rate-**shock**
  session, the 8/18 description) got a confirming observation on **9/10**: 10Y **+12bp** and the
  tier moved as a tier — **CRWV −6.1%, MRVL −3.4%, NVDA −2.4%, AVGO −1.0%**, S&P −0.6%. The
  distinction D0 drew survives; the same-week read-through stays refuted.
- **Never, and it held.** No directional bet was taken on the auction, no new unhedged duration was
  opened into the 1:00pm ET release, and nothing was carried naked through the 9/9→9/11 stack. The
  guard cost nothing and the 9/10 session is what it was for.
- **Watch (dated), what is left** — **CPI + Monthly Treasury Statement + IEA OMR 9/11** ·
  buyback-blackout start 9/12 · G20 energy ministerial + Gastech **9/14** · 20Y reopening 9/15 ·
  **FOMC 9/15–16** · 10Y TIPS 9/17 · quarterly OpEx 9/18 · **OPEC+ ministerial Oct 4**. Everything
  dated before 9/10 is scored in the rows below.

## Initial research

**The question, plainly:** the 10-year note reopening (1:00pm ET, confirmed) is the benchmark of
the September coupon calendar, landing into a live long-end sell-off (30Y at a 19-year high) that
the market reads as term-premium/fiscal, not Fed-policy. It reopens the Aug-12 issue and sits two
days before August CPI. What is priced going in, how has 10Y demand been trending (vs the weaker
long end), how would the market react to a weak vs. strong benchmark result, and which tracked
names carry the most exposure?

**One-line verdict:** the base case is a well-bid reopening — the 10Y has been the *strong* tenor
(near-record foreign demand at the Aug-12 sale, a clean tail, bid-to-cover above average), the
opposite of the tailing 20Y/30Y long end — so the load-bearing question is not "will the 10Y be
weak" but "will the long-end term-premium weakness *contaminate* the benchmark," which would be a
much larger signal if it happened. Stacked two days before CPI, this is a defined-risk, no-new-
duration window, not a rate-direction bet.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md)
(rates/Treasury-auction mode: no price instruments). Primary source for existence/date/time is
treasury.gov's tentative auction schedule (matches the checked-in calendar entry exactly); the
Aug-12 predecessor auction's demand metrics are cross-checked across two independent auction
trackers (KuCoin blog and helious.io, both accessed 2026-08-19) that agree closely, but neither is
the raw TreasuryDirect PDF — flagged for re-check. **A caution: one aggregator surfaced a
conflicting Aug-12 figure ($32B / 4.402% / 2.46 bid-to-cover); it is not corroborated by any other
source and conflicts with the two that agree — treated as aggregator error, the $42B / 4.683% /
2.53 set used below.** Market/Fed context sourced press (CNBC, Yahoo Finance, CRFB), each claim
dated in-line. FOMC odds carried from the sibling [`fomc-2026-09-16.md`](fomc-2026-09-16.md).

**Conviction legs, tested:**

1. **The date, time, and confirmed status are right — SUPPORTED.** treasury.gov's tentative
   auction schedule places the 10-year note reopening at 1:00pm ET on Wednesday 2026-09-09, matching
   the checked-in calendar entry (`TSY:`, formal announce ~6bd prior, checked 2026-08-18) exactly.
   The formal size announcement comes ~6 business days ahead (~2026-09-03), so the reopening size is
   not yet fixed. No date discrepancy found.

2. **The long-end sell-off is a term-premium/supply story, not a Fed story — SUPPORTED.** The
   30-year yield touched a fresh **19-year high ~5.323% intraday on 2026-08-18** before easing to
   ~5.282% (CNBC, businessstory.org, 2026-08-18), up **>40bp since its late-June low**, *despite* the
   Fed on hold at 3.50–3.75% and July core CPI tame (+0.2% m/m). Drivers cited across independent
   outlets: July's federal deficit ($432B, full-year pace ~$2T), ~$1.7T corporate bond issuance YTD
   (+27% YoY, AI-capex-driven, long-duration), and an oil spike (Yahoo Finance / CRFB "Treasury
   auction yield hits highest in 25 years," 2026-08-14). This is the backdrop the 10Y reopens into.

3. **The 10Y is the STRONG part of the curve — belly/foreign demand has held up — SUPPORTED, and
   this is the key differentiator vs the long end.** The Aug-12 10-year **new issue** ($42B) drew:

   | 10Y auction | High yield | B/C | Tail | Indirect | Direct | Dealer | Grade |
   |---|---|---|---|---|---|---|---|
   | 2026-05-12 (new) | 4.468% | 2.40 | — | 64.0% | 24.1% | 12.0% | — |
   | 2026-06-10 (reopen) | 4.538% | 2.57 | — | 78.2% | 12.3% | 9.5% | — |
   | 2026-07-08 (reopen) | 4.58% | 2.59 | −0.6bp | **81.5%** | 10.7% | 7.8% | **STRONG** |
   | 2026-08-12 (new) | **4.683%** (highest since 2007) | 2.53 | **+0.1bp** | **76.7%** (vs ~71.3% avg) | 14.7% | 8.6% | strong / "on the screws" |

   The Aug-12 sale "stopped on the screws against the when-issued yield" with indirect demand well
   above its ~71.3% average and bid-to-cover above the 2.47 six-month average (KuCoin, helious.io,
   2026-08-19). Foreign central-bank appetite for the benchmark at 2007-high yields is robust — the
   opposite of the tailing 20Y/30Y. **The Sep-9 auction is a reopening of exactly this well-bid
   Aug-12 issue**, so the recent-demand prior is favorable, not adverse.

4. **The load-bearing risk is contagion, not a standalone weak 10Y — SUPPORTED as the correct
   framing.** Because the 10Y has been the strong tenor, a weak Sep-9 print would be a *bigger*
   signal than a soft 20Y/30Y: it would mean the long-end term-premium weakness has reached the
   benchmark that lifts the entire curve. Two specific channels make Sep-9 riskier than a routine
   reopening: it is a **reopening into a still-moving long-end selloff**, and it sits **two days
   before August CPI (9/11)** — a hot core print would force a concession right after the auction.
   The 30Y reopening the very next day (9/10) is the intervening confirm/deny.

5. **A weak benchmark print hits high-duration, debt-financed AI names hardest and fastest —
   SUPPORTED, live tape.** On 2026-08-18, on long-end rate fear alone, CoreWeave (CRWV) fell
   **−12.1%** (Motley Fool / DailyPolitical, 2026-08-18) on debt-financing and capex concerns
   ($35–39B forward capex, debt/equity >14); NVDA −2.4% and the semis (SOX −5%) the same session
   (per the sibling [`treasury-30y-tips-2026-08-20.md`](treasury-30y-tips-2026-08-20.md) 8/18 read);
   Nasdaq −1.33%. The 10Y benchmark moving the whole curve would transmit this mechanism
   market-wide, not just to the longest-duration names. Sensitivity tier: **CRWV** highest, then
   **NVDA/AVGO/MRVL** (high-multiple semis), then mega-cap MSFT/GOOG/META (fortress balance sheets
   mute financing), least direct AAPL/AMZN.

6. **The Fed-path channel (Sep-16 FOMC) is separate and still live — SUPPORTED**, per
   [`fomc-2026-09-16.md`](fomc-2026-09-16.md): hawkish-hold base case ~60–70%, a 25bp **hike** live
   at ~30–40%, cut priced at 0%. This auction tests fiscal/supply-driven term premium; the FOMC one
   week later tests the policy-rate path. They compound but are distinct, and neither resolves the
   other.

**What plays the conditions support:** none directional — the same guard-shaped house answer as
every rates event. No new duration-sensitive entries into the 1:00pm ET release, and none carried
naked through the 9/9→9/10→9/11 (10Y · 30Y · CPI) corridor; any existing high-duration exposure
(CRWV highest-beta, then NVDA/AVGO/MRVL) sized as if both tails are live through the Sep-16 FOMC.

**Honest limits.** The reopening size and when-issued yield for Sep-9 do not exist yet (formal
announcement ~2026-09-03) — everything about *this* auction's supply/demand is forward-looking. The
Aug-12 predecessor metrics come from two secondary trackers agreeing closely, not the raw
TreasuryDirect PDF; a third aggregator reported a conflicting figure ($32B/4.402%) that is treated
as an error — re-verify against the posted result. n=4 recent 10Y prints is thin for a "trend,"
though the direction (strong foreign bid) is consistent. This doc is written **before** the Sep-9
result and before the intervening 30Y (9/10) and CPI (9/11) — those are the load-bearing facts the
next assessment must carry.

## Stance & kill switches

**Stance (date confirmed; size/WI-yield/recent-auction figures **estimate**/press-sourced).** No
new duration-sensitive positions opened into the 1:00pm ET release or carried naked through the
9/9→9/11 stack. The base case is a well-bid reopening (the 10Y has been the strong tenor, Aug-12
drew near-record foreign demand and stopped on the screws); the watched risk is contagion — the
long-end term-premium weakness reaching the benchmark, or a hot 9/11 CPI forcing a post-auction
concession. Existing exposure in high-duration names — **CRWV** (highest beta, −12.1% on 8/18 fear
alone), then **NVDA/AVGO/MRVL** — held only sized for both tails. No directional rates bet; a
no-new-risk window, not a trade.

**Refinement (2026-08-30, receipt: the D10 ledger row) — the stance holds, the risk mix rotates.**
Warsh's 8/28 Jackson Hole keynote (primary: federalreserve.gov) put a September **hike** at ~56–60%
from ~35%, bear-flattening the curve (2Y +12bp, 10Y +4–6bp to ~4.72–4.73%, 30Y +2bp). The
load-bearing risk into 9/9 is no longer principally long-end contagion but **Fed-path repricing**,
with the auction one week ahead of a coin-flip FOMC — which cuts both ways for the reopening: more
yield concession than the Aug-12 sale (4.683%), but more policy uncertainty for a buyer to hold
through. Two offsetting new facts: Treasury's ≥$4B/op buyback increase covers the **10–20Y** bucket
and takes effect **on auction day** (a same-day technical bid in the sector being reopened), while
two consecutive belly auctions (5Y 8/26, 7Y 8/27) printed indirects ~4pp below trend. Nothing here
licenses an entry — this remains guard-shaped.

**Refinement (2026-09-02, receipt: the D7 ledger row) — the evidence hardened, the setup got hotter,
the stance is unchanged.** Two things happened at once. First, the doc's weakest joint closed: the
Aug-12 predecessor is now read straight off Treasury's own auction record (fiscaldata
`auctions_query`, CUSIP **91282CRF0**) — **$42B offered, 4.6830% high yield, B/C 2.53, indirect
76.73%, dealers 8.60%** — every figure matching the two secondary trackers to the decimal, and the
conflicting `$32B / 4.402%` aggregator number is now definitively an error. The same source confirms
9/9 reopens **that exact CUSIP** (9Y11M, announce 9/3, issue 9/15), so leg 3's "this is a reopening
of the well-bid Aug-12 issue" is primary-sourced rather than inferred. Second, the conditions
worsened in three places since 8/30: hike odds ran to **~66–68%** (from ~56–60%); the **Iran/Hormuz
confrontation re-escalated** on 8/31–9/1, taking Brent +4.4% to ~$91–92 and putting back the
oil/inflation-uncertainty leg the 8/30 row had scored *out*; and the 10Y reached **4.79%** (H.15,
9/1), 11bp above where the Aug-12 note stopped. That last one cuts both ways and is why the stance
does not move: more concession makes the reopening cheaper to buy, while a live-hike FOMC six days
later makes it harder to hold. Still guard-shaped, still no entry.

**Refinement (2026-09-04, receipt: the D5 ledger row) — the supply leg closes, the Fed leg cools, the
stance is unchanged and better evidenced than at any prior row.** Three of this doc's open questions
resolved in one session, all toward the base case. (1) **The size exists and it is benign.** Treasury
announced the reopening on 9/3 at **$39B** — primary-sourced twice (fiscaldata `upcoming_auctions`
and the TreasuryDirect announcements web service, announcement PDF `A_20260903_1.pdf`, CUSIP
91282CRF0, coupon 4.625%). That is the **run-rate reopening size, not an increase**: Jun-10 and
Jul-08 were both $39B off the same lineage, and the whole block came at run-rate (3Y $58B, unchanged
three months; 30Y reopening $22B, matching Jun/Jul). Despite the fiscal narrative leg 2 rests on,
Treasury did not add coupon supply — the D7 supply kill switch fired *for* the base case, and the
supply leg is now closed rather than watched. It also improves the demand prior: the two prior $39B
reopenings drew **better** stats than the $42B new issues (B/C 2.57/2.59 vs 2.40/2.53; indirects
78.2%/81.5% vs 64.0%/76.7%) — smaller size plus concession is the favourable combination. (2) **The
Fed leg cooled on net, in both directions.** Waller's 9/3 remarks ("give disinflation a chance")
knocked September hike odds from ~66–68% to **~48–50%**; a hot **+162k** August payroll print on 9/4
(vs ~53–56k consensus, u/e 4.1%) pulled them back only to **~52–60%** — still below D7, with the
Chair and a Governor now publicly split and blackout starting 9/5, so nothing but CPI can move them
before the auction. Neither of D10's thresholds (~35% / ~75%) was reached. (3) **Oil escalated
against all of it** — Brent ~$95–96, a six-week high, on Iranian strikes against Kuwait, Jordan and
Bahrain. Net: the auction-specific risks shrank, the macro backdrop did not, and the stance stays
guard-shaped because the load-bearing event that week is CPI, not this auction.

**Refinement (2026-09-05, receipt: the D4 ledger row) — the auction side is unchanged; two of D5's own
readings get walked back, both in the cautious direction.** Nothing about the sale moved: fiscaldata
re-read this session still shows **$39B / CUSIP 91282CRF0 / announced 9/3**, and the 9/4 close leaves
**~9.7bp of concession** above the Aug-12 4.683% stop (10Y **4.78%**, Treasury's own par-yield curve).
What changed is the confidence in two things D5 recorded. (1) **The oil counterweight is weaker than
banked.** D5 offset the Brent spike with Wright's ">17mb/d wartime record" through Hormuz; independent
tanker tracking (TankerTrackers.com, cited by Fortune 9/2) puts 8/31 at **~9.14mb/d**, a 7-day average
of **8.27mb/d** and a 28-day average of **6.85mb/d**, against a pre-war ~15mb/d baseline, with Kpler
at ~65% of pre-war regional exports — and characterises the administration's method as aggregating
multi-day ship-to-ship transfers into one day. The shock therefore carries a real supply-loss
component, so the inflation-uncertainty leg into 9/11 CPI is **stronger** than D5 scored it. (2) **Leg
5's transmission did not fire.** The name-level gap open since D10 is closed and the answer is
awkward: on 9/4, with yields up on a hot print and the index down, **CRWV +5.68% (84.56→89.36)** and
**MRVL +7.05% (208.83→223.55)**; NVDA +0.84%, AVGO +0.21%. A >5% CRWV session was written as a kill
switch *confirming* leg 5 — it fired with the sign inverted. Leg 5 is not refuted (it describes
rate-*fear* sessions, and 8/18 remains the evidence) but it is demoted from a reliable read-through to
a conditional one, and name-level moves that week cannot be read as an auction tell. Housekeeping, not
stance: hike odds settled at the band's **low end (52.6%)**, blackout is live, VIX closed **14.53**,
and the 10Y high-water-mark conflict is resolved from the primary series in D7's favour. Still
guard-shaped, still no entry.

**Refinement (2026-09-06, receipt: the D3 ledger row) — the auction is unchanged; the *calendar around
it* is not what this doc has been assuming.** Nothing on the sale moved: fiscaldata re-read a third
consecutive session still returns **$39B / CUSIP 91282CRF0 / announced 9/3 / issues 9/15**, no
when-issued yield, and with markets shut since Friday the rate and vol readings are Friday's (10Y
**4.78%**, 30Y 5.24%, VIX **14.53**, ~9.7bp of concession above the Aug-12 stop). What this row adds is
a **structural correction**: every prior row, and both sibling auction ledgers, have called 9/8→9/11 a
"four-day corridor" without recording that **Monday 9/7 is Labor Day** and those four days are the
week's *only* sessions. Three consequences follow, and all of them tighten rather than loosen the
guard. (1) **The pre-auction runway is one session, not two.** D5 called the 3Y "the block's first hard
demand read"; with the holiday it is the *only* one. (2) **That session is crowded.** Treasury shifted
the Monday bill slate onto Tuesday — 13-week $92B, 26-week $79B, 6-week $75B — so 9/8 auctions
**~$304B** including the 3Y, against a normal week's two-day split. A tail on 9/8 is therefore a
*noisier* signal than a tail on a clean day, and the next row must read it with that discount rather
than as a clean demand verdict. (3) **Two days of escalation arrive unpriced.** On 9/5 the IRGC said it
targeted three tankers on "an unauthorized route" through Hormuz plus three US-affiliated vessels; US
forces destroyed one Iranian tanker and permanently disabled two more after ballistic missiles were
fired toward a US carrier and destroyer (no US ship hit) — the fourth Iranian tanker disabled since 9/1
under a stated "tanker for tanker" policy. None of it can price before 9/8. Separately, the oil leg
strengthened twice over: D4's downgrade of the "17mb/d wartime record" claim is now **three commercial
trackers against the official series** rather than one dispute, and Kpler supplies the mechanism that
was missing — the shortfall has been absorbed by inventory, and that inventory **thins from September**.
The stance does not move because none of this is directional and the load-bearing event of the week is
still CPI; but this is the second consecutive row whose net is *away* from optimism.

**Refinement (2026-09-08, receipt: the D1 ledger row) — the auction side is unchanged for a fourth
session; what moved is the *price*, and for the first time in this doc the mover is identifiable.**
Nothing on the sale moved: fiscaldata still returns **$39B / CUSIP 91282CRF0 / announced 9/3 / issues
9/15**, no when-issued yield, and the same endpoint independently corroborates D3's Labor Day finding
— 9/8's bills are the displaced Monday slate ($92B 13-week + $79B 26-week + $75B 6-week, all announced
9/3, alongside the $58B 3Y = **~$304B in one session**), with the following week's back on Monday 9/14.
Three prices moved together against the holder: the **10Y at 4.81%** (a fresh high; **~12.7bp of
concession** above the Aug-12 4.683% stop, from ~9.7bp), September **hike odds at 58.7%** (from 52.6%
on 9/4), and **VIX at 15.75** pre-open (from the 14.53 carried since D4) — the first break off the YTD
lows after ten sessions of the "the tape has not begun pricing the corridor" observation. The cause is
identifiable because the Fed is in blackout and the 3Y had not yet priced: **oil did all of it.** And
the oil leg widened qualitatively, not just in price — every prior row's mechanism was Hormuz
*transit*; on 9/8 Houthi strikes ignited fires at Saudi oil facilities and utilities in the southern
region (the 400kb/d Jazan refinery's area, third-plus strike since 8/9), which is producing and
refining infrastructure inside a producer. Brent **~$98.7**, +3.8% since 9/4. **OPEC+ is scored** —
the 9/6 meeting held October quotas at September levels (31.01mb/d ex-compensations, next meeting
Oct 4), so no supply relief arrives from that direction. Two findings cut the other way and are
recorded as such. **Iran says an Iran–Oman Hormuz agreement is "days away"** (9/7, to be documented
with the IMO) — the first credible route to the oil switch's ~$85 branch since D7, reported rather
than signed. And the CPI consensus consistent with **BLS's own series** has **core easing to ~2.4%**
against a July actual of **2.48%** — so the market is pricing a hike off *energy* while the core gauge
points down. For a buyer of this reopening that divergence is net favourable (it argues 58.7% is rich,
and the concession is real), but it resolves on **9/11**, two days after the auction prices. The
stance does not move: more concession is more compensation, and more macro uncertainty is more risk to
hold it through — the same two-sided balance every row since D7 has struck, now at wider levels on
both sides.

**Refinement (2026-09-09, receipt: the D0 ledger row) — the block's first demand read arrived, it split,
and for the first time since D10 the net moves *toward* the base case.** Run 20:12 ET on 9/8, so this
row sees what D1 could not: the 3Y result and the full cash session. **The 3Y stopped through** (high
yield 4.4740% against a 4.475% when-issued, −0.1bp) *into* the ~$304B of same-session crowding, on the
**best 3Y cover of 2026** (2.720 vs a 2.620 six-auction average) with **dealers at 10.91% against a
14.07% average** — real money took it down, not the syndicate. That is the favourable branch of D3's
amended switch, fired exactly as written. **But the mix went the other way:** indirects **62.15%**
against a 65.51% average, 3.4pp light, with directs at **26.94%** against 20.4% — the third consecutive
coupon auction where foreign demand fell short and domestics filled in. So the read is honestly
two-sided: *supply is clearing at these yields*, and *the buyer mix is rotating domestic*. Only today's
1:00pm ET print says whether the second half reaches the benchmark, and this doc's own kill switch is
keyed to exactly that. **Three structural findings change how that print must be read.** (1) **Today is
uncrowded** — $39B plus a single 17-week bill ($72B) ≈ $111B against yesterday's ~$304B, so the crowding
discount D3 installed does not apply and the print is clean in both directions. (2) **Reopenings are not
new issues**: measured from the primary this session (n=27 since 2024-06), 10Y reopenings average
**72.66%** indirect against **67.45%** for new issues. Every prior row benchmarked this reopening against
a blended ~71% — which the same pull confirms at 70.92% but which is the wrong basis — and against
Aug-12's 76.7%, which is a *new-issue* print. The honest bar today is ~72–73%, and ~68% is "light by the
same margin the 3Y/5Y/7Y ran." (3) **The aggregator phantom is identified**: the "$39B / 4.033% /
indirect 83.1% / dealers 4.2%" result flagged since D7 is the **2025-09-10** 10Y reopening, one year to
the day before this one, now read out of `auctions_query` — five rows of warning replaced by a name.
**The tape moved mildly and mostly the holder's way.** The curve barely budged on the quarter's most
crowded session (Treasury par curve 9/8: 2Y 4.39, 10Y **4.80**, 30Y 5.25 — 10Y +2bp on the session), so
D1's pre-open 4.81 secondary is corrected against the primary close and the concession is **~11.7bp**,
not 12.7bp. The blackout-era hike-odds climb **stalled at 58.1%** (from 58.7%) even as Brent rose again
— the first session in which oil rose and the Fed path did not follow. Against all of that: **Brent
$99.51**, at the $100 handle on the onshore mechanism, with **no evidence found** of the Iran–Oman IMO
filing D1 named as the de-escalation tell, so that leg stays in. And **leg 5 failed a second time**,
harder — CRWV **+11.72%** while NVDA **−2.01%** on a down-tape, rising-yield session, the tier splitting
internally on idiosyncratic news; it is downgraded from conditional to refuted as a same-week
read-through, which removes the last reason to read name-level moves as an auction tell. The stance
does not move, because none of this is directional and the week's load-bearing event is still CPI — but
the reason it does not move has changed from "the evidence is two-sided" to "the auction-specific risk
has largely resolved and what remains is macro." One forward test registered
([FT-treasury-10y-note-2026-09-09-1](../forward-tests/treasury-10y-note-2026-09-09.md)).

**Final stance (2026-09-10, receipt: the D+1 ledger row and `## Outcome` below) — the guard is stood
down because the event is spent, not because the risk resolved.** The reopening printed and it
vindicated the doc's central leg on the strongest evidence it ever produced: cover **2.710** (best of
28), indirects **79.18%** against a **72.66%** reopening mean, dealers **4.31%**, a **~1.5bp
stop-through**, and a 30Y the next day that was better still on sponsorship (dealers **2.21%**). The
no-new-naked-duration guard therefore expired unused — no position was ever taken, so there is
nothing to close and no P&L either way. What the doc must hand forward is the finding it did **not**
hold going in: **auction demand and the direction of yields decoupled**. The two best-sponsored
coupon auctions of their respective lineages sat inside a **+15bp** two-day bear-flattening driven by
an **11.5% two-session move in Brent**, with **4.8bp of 9/10's move done before PPI even printed**.
For every downstream rates ledger that reads "a strong auction is relief," the correct amendment is:
a strong auction says supply is clearing, and says nothing about the path — in a regime where the
marginal price is set by an energy-driven inflation repricing, the coupon block is a lagging read.
The live documents from here are [`cpi-2026-09-11`](cpi-2026-09-11.md) and
[`fomc-2026-09-16`](fomc-2026-09-16.md), and nothing in this event licenses an entry in either.

**Kill switches:**

- **Weak benchmark print** (bid-to-cover materially below ~2.47, a positive tail, or indirect share
  falling toward the mid-60s from the ~76% Aug-12 level) — this is the contagion signal: the
  long-end weakness has reached the curve-setting tenor. Escalates all high-duration names into the
  9/11 CPI; read together with the 9/10 30Y reopening the day before.
- **Strong print** (bid-to-cover ≥2.53, negative tail, indirect near/above 76%) — confirms the
  well-bid belly pattern, near-term relief; does **not** kill the structural long-end/fiscal stance
  or the Fed-path risk.
- **A hot August CPI (9/11)** landing two days after the auction would re-price the whole curve and
  is the more likely trigger for a duration selloff than the auction itself — the auction is the
  weather, CPI is the climate that week.
- **A repeat >5% single-session move in CRWV or another high-duration name** on or around auction
  day confirms leg 5's reaction-function read live in the current cycle.
- **Added 2026-08-30 — a third consecutive light indirect print, this time at the 10Y** (below the
  ~71% six-month average, well off Aug-12's 76.7%) would turn the 5Y/7Y pattern into a genuine
  foreign-demand deterioration at the benchmark, which leg 3 currently rates SUPPORTED against.
- **Added 2026-08-30 — the Fed-path leg is now the louder channel, so it kills in both directions**:
  September hike odds falling back under ~35% (a soft 9/4 jobs print would do it) restores the
  term-premium-only framing; odds pushing above ~75% makes the auction a policy-uncertainty event
  rather than a supply event, and widens caution on the whole duration book into 9/16.
- **Added 2026-09-02 — the reopening size itself, published 9/3.** A size materially above the
  Aug-12 $42B run-rate turns this from a demand test into a supply test and should be read alongside
  the 3Y (9/8) as the block's first read; a size at or below $42B removes the supply leg entirely
  and leaves only the Fed-path and oil channels live.
- **Added 2026-09-02 — the oil channel is live again and can kill in both directions.** Brent
  sustaining above ~$90 into the 9/11 CPI keeps the inflation-uncertainty leg of term premium in
  play through the auction; a de-escalation taking Brent back under ~$85 (the ~$88.3 level of 8/28
  was already a >5% weekly fall before the 8/31 re-escalation reversed it) removes it again, as the
  8/30 row had it.
- **Resolved 2026-09-04 — the 9/3 size switch and the 9/4 jobs switch both fired, neither adversely.**
  The size came at the **$39B run-rate** (supply leg closed, not a supply test), and the jobs print
  was **hot, not soft** (+162k vs ~53–56k), so the "odds back under ~35% restores term-premium-only
  framing" branch did not happen — but Waller's 9/3 dovish signal outweighed it and odds still net
  **fell** to ~52–60%. Both switches are retired as live watches; they stand as receipts.
- **Added 2026-09-04 — the 9/8 3Y result is now the block's first hard demand read.** With supply
  settled and the Fed silent from 9/5, the 3Y (and the 9/10 30Y after) are the only demand evidence
  that arrives before this reopening prices. A tailing 3Y on 9/8 would be the first genuine warning
  that concession is not clearing supply this block; a stop-through would all but settle the base case.
- **Added 2026-09-04 — equity vol is at YTD lows while the risk stack is at its densest.** VIX
  **14.03–14.05** on 9/4, down from 16.44 at D7, with Brent at a six-week high and a four-day
  corridor (3Y · 10Y · 30Y · CPI+MTS) one week ahead of a coin-flip FOMC. This is an observation, not
  a signal to act: it means protection is cheaper than it has been, which *supports* the existing
  no-new-naked-duration guard rather than licensing any new position. A VIX re-expansion above ~18
  before 9/9 would say the tape has started pricing the corridor and would widen caution further.
  *(9/5: VIX closed **14.53**, +0.21 — still at YTD lows, nowhere near the ~18 trigger. The condition
  holds and the observation is now a full week old without the tape starting to price the corridor.)*
- **Fired 2026-09-04 with the sign inverted — the CRWV switch.** The D21 switch read "a repeat >5%
  single-session move in CRWV or another high-duration name on or around auction day confirms leg 5's
  reaction-function read live." CRWV moved **+5.68%** and MRVL **+7.05%** on 9/4, *upward*, into rising
  yields and a lower index. Recorded as fired-and-not-confirming: the switch was written assuming the
  only >5% mover would be a rate-fear selloff, and it was not. Retired as a live watch — the honest
  version of the question is now the "name-level decoupling" signal bullet above, not a threshold.
- **Added 2026-09-05 — the oil counterweight itself is now the thing to watch, not just the price.**
  D5's reason to discount the Brent spike (Hormuz flows at a claimed wartime record) is disputed by
  independent tanker tracking at roughly half that level. A credible, independently-sourced Hormuz
  throughput reading back near the ~15mb/d pre-war baseline would restore the counterweight and pull
  the inflation-uncertainty leg back out; continued tracker readings in the 6–9mb/d range through
  9/11 keep it in and argue for reading a hot CPI as the more likely branch.
- **Amended 2026-09-06 — the 9/8 3Y switch now needs a crowding discount.** The D5 switch read "a
  tailing 3Y on 9/8 would be the first genuine warning that concession is not clearing supply this
  block; a stop-through would all but settle the base case." Labor Day changes what that print means,
  not whether it matters: the 3Y now prices alongside ~$246B of bills displaced off Monday, so a
  **tail attributable to same-session crowding is not evidence about the 10Y** and must not be read as
  such. The switch survives with a tighter reading — a **tailing 3Y with weak indirects** is the
  warning; a tail on cover alone is inconclusive this week, and a **stop-through despite the crowding**
  is a stronger positive than the original switch credited.
- **Added 2026-09-06 — the oil cushion has a date, so the oil switch is no longer price-only.** Prior
  rows tested the oil leg on Brent's level (~$90 in, ~$85 out). Kpler's ~550mb shortfall "bridged by
  inventory draws and truce-window buffers that thin from September" means the leg can now tighten
  **without** Brent moving. A dated read showing Gulf floating storage or crude-on-water rebuilding
  from the ~16mb trough would restore the cushion and pull the leg back out; continued draws through
  9/11 keep it in even if Brent is flat, and argue for reading a hot CPI as the more likely branch.
- **Resolved 2026-09-08 — the OPEC+ switch fired, mildly adversely.** D3 carried the 9/6 meeting
  unscored. The seven-country group **held October quotas at September levels** (Saudi 10.478, Russia
  9.949, Iraq 4.431, Kuwait 2.676, Kazakhstan 1.628, Algeria 1.007, Oman 0.841 mb/d; **31.01mb/d**
  ex-compensations), citing that the Hormuz disruption limits its ability to move physical supply and
  that 2027 baselines must be set before further unwinding. So the pause the pre-meeting sourcing
  expected did happen, and it means **no offsetting barrels** against a shock that has now reached
  onshore infrastructure. Next checkpoint **4 October** (already a tracked/proposed entry). Retired as
  a live watch.
- **Added 2026-09-08 — the oil switch is no longer a Hormuz switch.** Prior rows tested the oil leg on
  transit volumes and on Brent's level. The 9/8 strikes on Saudi facilities move the mechanism onshore,
  so a Hormuz throughput recovery alone **no longer restores the counterweight**. The switch now needs
  both: a credible Hormuz reading back near the ~15mb/d pre-war baseline **and** no fresh strike on
  producing/refining assets. Conversely, a confirmed outage at a named facility with a stated duration
  would push this from an uncertainty leg to a realised-supply leg, and should widen caution on the
  whole duration book regardless of what the auction prints.
- **Added 2026-09-08 — the Iran–Oman deal is the oil switch's off-ramp, and it now has a tell.** Iran
  said on 9/7 the agreement is days away and will be lodged with the **IMO**. An IMO filing or a joint
  Iran–Oman announcement is the dated, checkable event; a Brent break back under ~$85 on it fires the
  existing oil switch's de-escalation branch. Absent that filing by **9/11 CPI**, treat the "days away"
  framing as negotiating posture and keep the leg in.
- **Added 2026-09-08 — the energy/core divergence, which kills the *Fed* leg in either direction.**
  Hike odds moved **52.6% → 58.7% during blackout** on oil alone, while August CPI consensus consistent
  with the BLS primary has **core easing to ~2.4%** (July actual 2.48%). Two branches on **9/11**: a
  core print at or under ~2.4% that pulls odds back under ~50% means the energy channel was noise and
  the 12.7bp concession this auction is taking was overpayment in the buyer's favour; a core print that
  *confirms* the hawkish pricing (odds through ~75%, D10's standing threshold) makes 9/16 a
  policy-uncertainty event and widens caution on the whole duration book into it.
- **Resolved 2026-09-09 — the 9/8 3Y switch fired, and it fired on its favourable branch.** D5 wrote it
  and D3 amended it to "a tailing 3Y **with weak indirects** is the warning; a tail on cover alone is
  inconclusive this week; a **stop-through despite the crowding** is a stronger positive than the
  original switch credited." The 3Y **stopped through** by 0.1bp into ~$304B of same-session supply,
  with the best cover of 2026 and a below-average dealer takedown. The warning branch did not fire —
  there was no tail to weigh the light indirects against. Retired as a live watch; it stands as the
  receipt that concession is clearing supply this block.
- **Re-based 2026-09-09 — the indirect thresholds in this doc were measured against the wrong series.**
  The 8/30 switch reads "below the ~71% six-month average, well off Aug-12's 76.7%." Both anchors are
  now known to be mis-specified for a *reopening*: from the primary (n=27 since 2024-06), 10Y
  reopenings average **72.66%** indirect and new issues **67.45%**, and Aug-12's 76.7% is a new issue.
  The switch survives with corrected numbers rather than being retired — **below ~68% is the light
  print** (the same margin the 3Y/5Y/7Y ran below their own tenors), **below the mid-60s is the
  contagion signal**, and ~72–73% is merely par for a reopening rather than the strong read a
  71%-anchored reading would have scored it as. Registered as
  [FT-treasury-10y-note-2026-09-09-1](../forward-tests/treasury-10y-note-2026-09-09.md), score-by
  2026-09-10, base rate stated (12 of the last 18 reopenings cleared 68.0%).
- **Retired 2026-09-09 — leg 5's name-level switch, refuted rather than merely demoted.** D4 demoted the
  rates→high-duration read-through from reliable to conditional after 9/4 inverted it. 9/8 inverted it
  again and split the tier: **CRWV +11.72%, NVDA −2.01%** in one session, with yields at a fresh high,
  VIX up and the S&P −0.58%. Two consecutive failed tests, the second with the tier's own members moving
  in opposite directions on idiosyncratic news (Nvidia's raised stake in CoreWeave, a Truist target
  lift). Leg 5 is **refuted as a same-week read-through** and retained only as a description of an acute
  rate-*shock* session (8/18). Consequence for the close-out: today's and tomorrow's name-level moves
  are **not** admissible as evidence about this auction, in either direction.
- **Added 2026-09-09 — the Fed leg now has a stall to watch, not just a level.** Hike odds went 52.6%
  (9/4) → 58.7% (9/7) → **58.1% (9/8, timestamped 07:55PM EDT)** while Brent rose another 3.4% to
  $99.51. The oil→Fed channel that D1 identified as the sole mover **did not transmit** on 9/8. If odds
  keep flattening or fall through ~55% while Brent holds the $100 handle, the energy channel is
  exhausting itself and the 9/11 core print becomes the only thing left that can move 9/16; if they
  resume climbing on oil alone, D10's ~75% threshold is the live risk and the auction's buyer is holding
  through a policy-uncertainty event.
- **Added 2026-09-06 — the corridor has no spare session, which is itself the condition.** Every one of
  the week's four sessions carries a corridor event (9/8 3Y+bills · 9/9 10Y+buyback start+STEO ·
  9/10 30Y+PPI+ECB+buyback op · 9/11 CPI+MTS+UMich). There is no day on which a bad print can be
  digested before the next one lands. A **second** adverse print inside the corridor — a weak 3Y
  followed by a weak 10Y, or a weak 10Y followed by a hot CPI — compounds rather than averages, and
  is the specific sequence the no-new-naked-duration guard exists for. *(Scored 2026-09-10: the
  compounding sequence **did** run, but not through the auctions. 9/9 and 9/10 both printed
  best-in-lineage demand and the corridor still added **+15bp** of 10-year, because the second and
  third adverse inputs were **oil** (Brent +11.5% over the pair) and a **hot y/y PPI on energy**, not
  a weak print. The guard was correctly specified and correctly held; the trigger it named was the
  wrong one.)*
- **Resolved 2026-09-10 — the contagion switch fired on its favourable branch and is retired.** The
  8/30 switch, re-based on 9/9, read "below ~68% is the light print, below the mid-60s is the
  contagion signal." The reopening printed **79.18%** indirect — **11.2pp above the light threshold
  and 6.5pp above the 72.66% reopening mean**, 4th of 28 in the nominal 10Y lineage since 2024-06.
  The 5Y/7Y/3Y light run was a front-end and belly phenomenon; it did not reach the benchmark. **Leg
  3 is SUPPORTED**, and [FT-treasury-10y-note-2026-09-09-1](../forward-tests/treasury-10y-note-2026-09-09.md)
  is **scored PASS** — with its own stated caveat honoured: a pass was the two-in-three base-rate
  outcome, so the informative part is the **margin**, not the binary.
- **Resolved 2026-09-10 — the strong-print switch fired, and its own stated limit is the whole
  finding.** The switch read "bid-to-cover ≥2.53, negative tail, indirect near/above 76% → confirms
  the well-bid belly pattern, near-term relief; does **not** resolve the structural long-end/fiscal
  story or the Fed-path risk." All three conditions were met (**2.710 / ~−1.5bp / 79.18%**) and the
  qualifier is what actually happened: the relief was **1.6bp intraday, 0.8bp to the close**, and the
  structural story took the 10-year **12bp higher the next day**. Retired with the note that this
  doc's own switch under-promised correctly and over-promised nowhere.
- **Resolved 2026-09-10 — the oil switch fired on escalation, and the de-escalation branch is dead.**
  Brent **$97.92 → $101.21 → $109.19** over 9/8–9/10 (WTI to **$104.06**), far above the ~$90
  "inflation-uncertainty stays in" level and never near the ~$85 exit. The Iran–Oman off-ramp added
  on 9/8 is closed: no IMO filing was found, and **Trump said on 9/9 he is "not looking for a deal
  with Iran"** while the US destroyed five Iranian tankers. Retired as a live watch for this event;
  it belongs to [`cpi-2026-09-11`](cpi-2026-09-11.md) and [`fomc-2026-09-16`](fomc-2026-09-16.md) now.
- **Refuted 2026-09-10 — D0's "the oil→Fed channel stalled" reading lasted 48 hours.** The 9/9 switch
  said "if odds keep flattening or fall through ~55% while Brent holds the $100 handle, the energy
  channel is exhausting itself." It did not exhaust: odds went **58.1% (9/8) → ~68.7% (9/10, 06:15PM
  EDT)**, a **+10.6pp** move on oil, through blackout, with **~6pp left to D10's ~75% threshold**.
  Recorded as a wrong call rather than an ambiguous one — a single flat session was read as a trend
  and it was noise.
- **Split-decision 2026-09-10 — leg 5's two forms went opposite ways on consecutive sessions.** The
  *refuted* same-week read-through failed a third time on **9/9** (yields +3bp, **MRVL +4.1%** while
  CRWV −4.9% — the tier again did not move as a tier). The *retained* acute-rate-**shock** form got a
  confirming observation on **9/10** (10Y **+12bp**; CRWV **−6.1%**, MRVL **−3.4%**, NVDA **−2.4%**,
  AVGO **−1.0%**, S&P −0.6% — the tier moved together and in the predicted direction). One
  confirmation does not reinstate a read-through that failed three times, so the D0 downgrade stands;
  what it earns is a sharper boundary — the channel needs a **shock**, not a drift.
- **Added 2026-09-10, and it is the finding this event hands forward — the auction is a lagging read
  on term premium, not a leading one.** 9/9 and 9/10 produced the best cover of the 10Y lineage and
  the lowest dealer takedown of the 30Y lineage, and the curve bear-flattened **+15bp** across the
  pair. This is not a switch for this closed event; it is an amendment every downstream rates ledger
  should carry, and it has a falsifier: **a 10Y or 30Y auction before 2026-12-31 that tails ≥2bp with
  indirects below 65%** would show demand deterioration is still capable of leading the tape, and
  restore the framing this pair of prints removed.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-19 | D21 | Initial research banked (doc above). Adjacency — peers: no tracked-name prints since 8/17 (NVDA 8/26, MRVL 8/27, AVGO 9/2 still ahead); live peer signal is macro-driven — CRWV −12.1%, NVDA −2.4%, SOX −5% on 8/18 long-end rate fear. Macro: 30Y at 19-yr high (~5.33% intraday 8/18, +40bp since June) on term-premium/fiscal drivers ($432B July deficit, ~$1.7T corp issuance, oil); Sep-16 FOMC odds ~60–70% hold / ~30–40% hike / 0% cut per the FOMC sibling doc — unchanged. VIX ~15.2–15.9 on 8/18 (sources disagree on exact print), up from the 14.56 2026-low — mild vol pickup tracking the selloff. Geopolitical: US–Iran deadline expired, WTI/oil spike — live inflation-uncertainty leg of the term-premium story. Event tape (date **confirmed**; size/yield figures **estimate**/press-sourced): this is a **reopening of the well-bid Aug-12 10Y** (that new issue: $42B, 4.683% highest-since-2007, tail +0.1bp, B/C 2.53 vs 2.47 avg, indirect 76.7% near-record); the 10Y is the *strong* tenor vs the tailing 20Y/30Y — the risk is contagion, not a standalone weak 10Y. Reopening size/WI for 9/9 not yet announced (~9/3). No new dated adjacencies beyond what the calendar already tracks (30Y 9/10, CPI 9/11, jobs 9/4, 20Y+FOMC 9/15–16, TIPS 9/17, OpEx 9/18). Conflicting Aug-12 aggregator figure ($32B/4.402%) flagged as un-corroborated error. | — (stance set) | 2026-08-26 (high, ≥21d band: every 7d) |
| 2026-08-24 | D16 | Adjacency sweep (band now 8-20d, cadence shortens to every 3d per the scanner's own recompute). Event tape: reopening size/WI for 9/9 still not announced (~9/3 expected) — no update. 10Y cash yield **4.71-4.72%** as of 8/24, up modestly from the 4.683% Aug-12 new-issue print cited at D21 — continued, gradual climb, consistent with the broader long-end selloff already logged across the sibling 20Y/30Y-TIPS docs, not a sharp break. Peers: AVGO's XPV overhang deepened (-4.61% on 8/19, own doc); MRVL's implied move jumped to ~18.4% (own doc) — sector context, not 10Y-specific. Macro: no CPI/jobs/FOMC surprise since 8/19; Sep-16 read unchanged (hawkish-hold ~60-70%/hike ~30-40%/cut ~0%, per FOMC sibling doc). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs. No new dated adjacency found. | — (no change; 10Y stays the relatively strong tenor, contagion-from-20Y/30Y still the risk to watch, not standalone weakness) | 2026-08-27 (high, 8-20d band: every 3d) |
| 2026-08-27 | D13 | Adjacency sweep (8-20d band holds, every 3d). Peers: not directly applicable (no symbols on this event); tracked-name earnings continue on schedule (NVDA beat 8/26, MRVL 8/27, AVGO 9/2 ahead) — sensitivity tier unchanged. Macro: GDP Q2 2nd estimate held **+1.5%** annualized, <0.1pp revision, no surprise (BEA 26-38, 8/26; closed out in open PR #683). PCE (8/26): core **+0.2% m/m / 3.3% y/y** in-line; headline **+3.7% y/y**, 0.1pt hot vs the 3.6% street consensus but flat vs June — a mild upside surprise on headline only, core (the load-bearing gauge) unmoved (closed out in open PR #684). Session reaction flat/mixed (S&P flat, Dow -0.21%, Nasdaq -0.08%), no distinguishable GDP/PCE-specific move. 10Y cash yield eased to **~4.66%** on 8/26 (down from 4.71-4.72% at D16) despite the hot headline print — consistent with core landing in-line. Prior context: the same-day 5Y note auction (8/26) drew primary-sourced **2.37x bid-to-cover** (above its ~2.32-2.33x average) and **+0.2bp tail** — a moderate improvement, not the fourth-consecutive-tail confirmation feared, though indirect demand (61.5%) stayed ~4pp below trend (closed out in open PR #685; corrects an earlier secondhand 2.39x/2.46avg figure). Volatility regime: MOVE index reversed its two-week decline to **73 (54th percentile)** as of the week of 8/24 (Cboe), cross-asset rates vol ticking up on Treasury-market stress even as VIX stayed calm at **15.21** on 8/26 (down slightly from 15.13) — a bond/equity vol divergence worth tracking, not yet a regime break. Geopolitical/policy: Treasury Secretary Bessent's late-week (~8/19-21) move to **double long-end buyback operations** (10-30Y, to $4B/operation, per the sibling `treasury-20y-bond-2026-08-19.md` finding) is a direct fiscal lever supporting long-end demand technicals into the Sep coupon block; that doc's own follow-through found the relief faded within a day, so it tempers but doesn't remove the contagion watch. No new Iran/oil escalation since 8/24. Event-specific tape: reopening size/WI for 9/9 still unannounced (~9/3 expected); external 2026 auction-trend sourcing corroborates the Aug-12 76.7% indirect print as resilient, not deteriorating — the "10Y is the strong tenor" read holds. Jackson Hole (8/28), ISM Mfg/Services (9/1, 9/3) and the jobs report (9/4) are all still ahead of this row's run date — nothing to score from them yet. No new dated adjacency found (all already tracked in the calendar). | — (no change; base case still a well-bid reopening, contagion from the long end / a hot 9/11 CPI remains the risk to watch — the 5Y's cleaner print and eased 10Y yield are mild positives for the read, not a resolution) | 2026-08-30 (high, 8-20d band: every 3d) |
| 2026-08-30 | D10 | Adjacency sweep (8-20d band holds, every 3d). **Macro — the material change.** Warsh's Jackson Hole keynote (8/28, primary: federalreserve.gov/newsevents/speech/warsh20260828a.htm, "In Our Time") repriced the Fed path: this summer's PCE/CPI prints "do not tell me that underlying trends have meaningfully improved," and the Fed may "have work to do." September **hike** odds jumped to **~56-60%** from ~35% the prior day (CME FedWatch via CNBC/Benzinga/TheStreet, 8/28) — the ~30-40% hike read this doc has carried since D21 is now the *minority* case. Curve reaction was a bear flattener: 2Y **+12bp to ~4.356%**, 10Y **+4-6bp to ~4.72-4.73%**, 30Y **+2bp to ~5.21%** (CNBC 8/28, against the H.15 8/27 baseline of 2Y 4.20 / 10Y 4.67 / 20Y 5.18 / 30Y 5.19) — the impulse is now Fed-path at the front, not term-premium at the back, a genuine rotation of the driver mix. Equities: S&P -0.25%, Nasdaq -0.52%, Dow -0.02%. **Prior auctions (the belly-demand leg, the one most at risk):** the 8/27 7Y note drew B/C **2.50 vs a 2.49 six-month average** with a **0.0bp tail** (stopped on the screws) but indirects **60.8% vs a 65.1% average** — the second consecutive belly auction with indirects ~4pp light (5Y 8/26: 61.5%, also ~4pp light), domestics filling the gap both times. This tempers rather than refutes leg 3: 5Y/7Y indirect averages sit structurally below the 10Y's ~71%, and Aug-12's 76.7% remains the only direct evidence for *this* tenor. **Event tape:** reopening size and WI for 9/9 still unannounced (formal announce ~9/3). Directly on-point and new to this doc: Treasury's buyback increase — **at least $4B/operation, up from $2B, in the 10-20Y and 20-30Y nominal sectors** — takes effect **2026-09-09, auction day**, through the refunding quarter's close 2026-11-04 (treasury.gov press release sb0607; title and terms verified via a home.treasury.gov-restricted search after two direct page fetches timed out). Prior rows framed this as 30Y/long-end support; the **10-20Y** bucket makes it a same-day technical bid in the sector being reopened. Volatility regime: VIX **14.35** on 8/28, a YTD low (Cboe/CNBC), *down* from 15.21 at D13 despite the hawkish repricing — the equity-vol / rates-vol divergence logged at D13 (MOVE 73, 54th pctile) widened rather than resolved. Geopolitical: Brent **~$88.3-89.4** on 8/28, down **>5% on the week**, as the Iran confrontation read as sanctions rather than supply (Hormuz flows improving; Gulf exports ~15-16 mb/d vs 22-24 pre-conflict, per Goldman) — removes part of the oil/inflation-uncertainty leg of the term-premium story. Corridor now runs **four days**: 3Y (9/8) → **10Y + buyback start (9/9)** → 30Y (9/10) → CPI (9/11), one week ahead of a live-hike FOMC (9/15-16). No new dated adjacency found — the 3Y (9/8) and the buyback (9/9) are already tracked calendar entries. Bookkeeping (not acted on here): `treasury-buyback-increase-2026-09-09` is still `status: "estimate"` with a `NEWS:` prefix though its source line already cites the primary treasury.gov release; left for that event's own 9/4 pulse, since this session verified the release by search summary rather than a direct read. | **Refined, not reversed** — base case is still a well-bid reopening, but the dominant risk channel rotates from long-end contagion to Fed-path repricing into a coin-flip September hike; two kill switches added (a third light indirect print at the 10Y; hike odds breaking ~35% or ~75%) | 2026-09-02 (high, 8-20d band: every 3d) |
| 2026-09-02 | D7 | Adjacency sweep. **Cadence band transition: 7 days out crosses into the `high:0+` band — this event now reassesses DAILY through the auction.** **Event tape — the material upgrade, and it is a sourcing one.** Two Treasury primaries, fetched direct this session (api.fiscaldata.treasury.gov, 2026-09-02): (a) `upcoming_auctions` lists the 9/9 security as a **9-Year 11-Month Note, reopening = Yes, CUSIP 91282CRF0**, announce **2026-09-03**, issue 2026-09-15, `offering_amt` still **null** — so the reopened security is primary-confirmed and the size genuinely does not exist yet, exactly as every row since D21 has said; (b) `auctions_query` on that same CUSIP returns the **Aug-12 predecessor's raw record**: offering **$42,000,000,000**, high yield **4.6830%**, bid-to-cover **2.530**, competitive accepted $41.82B of which **indirect $32.088B = 76.73%**, direct $6.136B = 14.67%, primary dealers $3.598B = **8.60%**, allocation 65.27%, single-price, coupon 4.625%, dated 2026-08-15. Every one of those matches the two secondary trackers this doc has leaned on since D21 to the decimal, and the un-corroborated `$32B / 4.402% / 2.46` aggregator figure flagged in *Honest limits* is now **definitively an error** — that limit is closed, and leg 3 no longer rests on secondaries. (One aggregator hit during this sweep described a "$39B 10Y at 4.033%, indirect 83.1%, dealers 4.2%" as a September result; those are **2025** figures and were discarded — the same aggregator-error trap the initial research warned about.) **Macro.** ISM Manufacturing (9/1, closed out on its own lane): PMI **54.6** vs 55.6 July, New Orders **53.7** vs 56.7 (−3.0pp), Employment **51.2** vs 52.8 — expansion, decelerating; **Prices Index 71.1, unchanged from July**, a 23rd straight month of increases, which is the sticky-inflation datapoint the hawkish case leans on and it neither accelerated nor relented. JOLTS (9/1): **7.271M** vs a 7.33–7.36M consensus, with June revised **down 177k** to 7.182M — the largest downward revision since 2025; softer labor, yet it did not dent hike pricing. **Fed path — hotter.** September hike odds **66.1%** on CME FedWatch (Forbes, 11:40 ET 8/31), ~**68%** by 9/1 (Trading Economics) — up from the ~56–60% this doc carried at D10 and roughly double the pre-Warsh ~35%; CNBC's own 8/31 follow-up ("Markets see Warsh endorsing a rate hike in September. Not everyone is convinced") notes the read is contested, and Goldman is publicly against hawkish bets, so the number is high but not consensus-settled. **Rates.** H.15 primary, 9/1 close: 2Y **4.39**, 10Y **4.79**, 20Y **5.27**, 30Y **5.27** — against the 8/28 baseline (2Y 4.34 / 10Y 4.73 / 30Y 5.22) that is 2Y +5bp, 10Y +6bp, 30Y +5bp, i.e. a roughly **parallel** shift, not the bear flattener of D10; the fifth consecutive higher session for the 10Y and its highest since **January 2025**. The 10Y now sits **~11bp above the 4.683% at which the Aug-12 note stopped** — real concession into the reopening, which cuts both ways (cheaper entry, more policy risk to hold). 20Y and 30Y converged flat at 5.27. **Volatility regime.** VIX **16.44** on 9/1, **+1.52 (+10.2%)** on the session, after closing under 15 on 8/31 for its lowest monthly close since Nov 2024 — up from the 14.35 YTD low logged at D10. The equity-vol/rates-vol divergence tracked since D13 has begun to close from the equity side. **Geopolitical — a reversal of the D10 finding.** The Iran confrontation re-escalated 8/31–9/1: US forces struck Iranian assets over reported mine-laying near Hormuz, Iran launched missile/drone attacks on US facilities in Jordan, and Trump warned of harder retaliation. Brent **+4.4%** from an $88.37 close to a ~$92.31 session high (~$91.3 settle), **+8.96% on the month**. D10 recorded the oil/inflation-uncertainty leg as *removed*; it is back. Equities 9/1: S&P **−0.71%** (7,631), Dow −0.79%, Nasdaq **−1.03%** — index-level risk-off; no independently sourced same-day CRWV/NVDA print was found for 9/1, so the name-level sensitivity read (leg 5) is not re-scored here. **Peers/adjacency:** ADP (9/2, 08:15 ET) had not published at this row's run time — nothing to score. New to this ledger, already tracked in the calendar: `treasury-buyback-10y20y-2026-09-10`, a **10–20Y liquidity-support buyback operation announced on 9/9 (auction day) and executed 9/10 at 1:40pm ET** — the announcement of a same-sector buyback lands the same day as the reopening it supports, sharpening the D10 finding that sb0607's 10–20Y bucket is a technical bid in the tenor being sold. **New dated adjacency PROPOSED in this PR:** `treasury-coupon-announcement-2026-09-03` (`estimate`) — the coupon-block announcement that fixes the 3Y/10Y/30Y sizes, primary-sourced to the same fiscaldata record; it is the one input this doc has flagged as missing in every row since D21 and it was not a tracked event. | **No change** — base case is still a well-bid reopening and the stance stays guard-shaped; the Aug-12 evidence is now primary-verified (an *Honest limits* item closed, not a stance move), and the setup got hotter on three fronts (hike odds ~66–68%, oil shock back, 10Y at a Jan-2025 high) with the added concession offsetting the added policy risk. Two kill switches added (the 9/3 size; the oil channel in both directions) | 2026-09-03 (high, 0-7d band: daily) |
| 2026-09-04 | D5 | Adjacency sweep. Dispatched material by the probe on **six new adjacent calendar entries**, all filed by sibling lanes since 9/2 (`eia-steo-2026-09-09`, `mts-august-2026-09-11`, `umich-sentiment-prelim-2026-09-11`, `sp-rebalance-proforma-2026-09-04`, `g20-energy-abundance-ministerial-houston-2026-09-14`, `gastech-2026-09-14`) — the corridor's **energy-and-fiscal** adjacency thickened, two of them directly on-point: **EIA STEO lands on auction day** into a live Hormuz shock, and the **August Monthly Treasury Statement lands 9/11 alongside CPI**, refreshing the deficit datapoint leg 2 rests on (July: $432B). **Event tape — THE material change, and it resolves the question every row since D21 has flagged.** Treasury announced the September coupon block on **2026-09-03**. The 9/9 reopening is **$39,000,000,000**, CUSIP **91282CRF0**, coupon 4.625%, announcement PDF `A_20260903_1.pdf` — sourced twice from Treasury primaries fetched direct this session: fiscaldata `upcoming_auctions` (the same endpoint that showed `offering_amt: null` at D7) and the TreasuryDirect `securities/announced` web service, which agree exactly. **$39B is the run-rate reopening size, not an increase.** From `auctions_query`: the **2026-06-10** reopening was **$39B** (B/C 2.570, indirect **78.21%**, direct 12.32%, dealers 9.46%, HY 4.538%) and the **2026-07-08** reopening was **$39B** (B/C 2.590, indirect **81.49%**, direct 10.73%, dealers 7.78%, HY 4.580%); the $42B figure this doc has been benchmarking against is the *new-issue* size (May-12 and Aug-12), so the quarterly step-down from $42B→$39B is Treasury's standing pattern and carries no supply signal. The rest of the block is equally unremarkable — **3Y $58B** (identical for three consecutive months: Jun $58B, Jul $58B, Aug $58B) and **30Y reopening $22B** (matching Jun-11 and Jul-09 at $22B; Aug-13's $25B was the refunding new issue). **Despite the deficit/term-premium narrative, Treasury added no coupon supply anywhere in this block** — the D7 supply kill switch fired in the base case's favour and the supply leg is now closed. Second-order: the two prior $39B reopenings both drew *better* demand than the $42B new issues (B/C 2.57/2.59 vs 2.40/2.53; indirects 78.2%/81.5% vs 64.0%/76.7%), so a smaller reopening arriving with ~11bp of concession is the favourable historical combination, not the adverse one. **Macro — the jobs print, hot.** BLS Employment Situation (9/4 08:30 ET, primary: bls.gov/news.release/empsit.nr0.htm): payrolls **+162,000** vs a ~53–56k consensus (roughly 3x), unemployment **unchanged at 4.1%**, average hourly earnings **+0.3% m/m to $37.75** and **+3.1% y/y**, with June revised +11k (to +31k) and July revised +44k (to **+21k**, from a reported *loss*) — **+55k** combined. Two honest counter-currents: 162k stands against a **31k** 12-month average, i.e. one large outlier rather than an established trend; and information-sector employment *fell*, attributed in press coverage to AI investment. Wage growth at 3.1% y/y is not an inflationary tell. **Fed path — cooled on net, despite the hot print.** Governor Waller's 9/3 economic-outlook remarks (primary: federalreserve.gov/newsevents/speech/waller20260903a.htm; "give disinflation a chance", "if this continues in the data due over the next two weeks, I would be inclined to support holding the target ... at its current setting") cut September hike odds from the ~66–68% this doc carried at D7 to **~48–50%** — about 15pp in a session — and drove a risk-on rally. The 9/4 payroll beat pulled odds back only to **~52–60%** (sources disagree within that band: Trading Economics ~52%, a CNBC-sourced read 60% "up from 49% one day ago"). Net vs D7: **lower**, and now genuinely two-sided, with **Chair Warsh (8/28 hawkish) and Governor Waller (9/3 dovish) publicly split**. Waller's caveat is explicit — "it may not take much acceleration in inflation to nudge me into supporting tighter policy" — so 9/10 PPI and 9/11 CPI are what settle it. Neither of D10's thresholds (~35% / ~75%) was reached. **Blackout begins 9/5**, so no Fed voice can move this before the auction. **Rates.** H.15 (release 9/3, primary) confirms 9/1 and 9/2 both at 2Y **4.39** / 10Y **4.79** / 20Y **5.27** / 30Y **5.27** — flat session-over-session and unchanged from D7. Market quotes then round-tripped: 10Y **4.818%** intraday 9/2 (described by one outlet as the highest since **November 2023** — this conflicts with D7's press-sourced "highest since January 2025"; both are secondary characterisations of the same series and neither is load-bearing, flagged rather than resolved), **4.77%** on 9/3 as Waller rallied bonds, then **+~3bp to ~4.78–4.79%** on the 9/4 payroll beat. Net for the week: **~+5bp**, and the **~11bp of concession above the Aug-12 4.683% stop is intact** — unchanged from D7 but now paired with a smaller offering. 30Y ~5.24%. **Volatility regime.** VIX **14.32** close 9/3 (**−5.79%**, day range 14.23–15.44) and **14.03–14.05** on 9/4 — down **~2.4 points** from the 16.44 logged at D7 and back at the YTD lows of D10 (14.35). Below the 3-point materiality threshold, but the *context* is the finding: equity vol is at its lows of the year while Brent sits at a six-week high, Iran is striking three US allies, and a four-day compound corridor sits one week out. The equity-vol/rates-vol divergence tracked since D13 has **re-opened** after briefly closing at D7. **Geopolitical — escalated further, reversing D7's direction of travel too.** Iran struck US bases and regional allies **Kuwait, Jordan and Bahrain**; Kuwait reported "ongoing Iranian aggression" with air defences engaging missiles and drones. Brent broke **above $96** on 9/3 (CNBC) and settled ~**$95.23** on 9/4 — up from the ~$91.3 recorded at D7 and ~$88.4 at D10, a six-week high. Two genuine counterweights: Energy Secretary Wright told CNBC **>17mb/d transited Hormuz on 9/1, a wartime record**, under US naval protection (so the shock is priced on risk, not on realised supply loss), and Trump said the renewed hostilities would not last "too long". **OPEC+ meets 9/6** (already tracked) with pre-meeting sourcing suggesting a **pause in Q4 output increases** — which would be oil-supportive on top of the geopolitical bid. The oil/inflation-uncertainty leg of term premium is firmly in through 9/11 CPI. **Equities.** 9/3 risk-on on Waller: S&P **+1.1%** to 7,747.71, Nasdaq **+1.4%** to 26,584.06, Dow **+1.18%** (+624 pts). 9/4 lower on the hot print (Dow −~300 intraday); this row was written at ~14:40 ET with the session still open, so 9/4 closes are **not** recorded here. No independently sourced same-day CRWV/NVDA print found for either session — leg 5's name-level sensitivity is again **not re-scored**, the third consecutive row with that gap. **The aggregator trap re-fired, and is now more dangerous.** This sweep again surfaced a "$39B 10Y, 4.033% high yield, indirect **83.1%**, dealers **4.2%**, B/C 2.65" result presented as current; those are **2025** figures, discarded exactly as at D7 — but note that this year's size genuinely *is* $39B, so the row now half-matches and would pass a careless read. Recording it explicitly so a future session does not adopt it. **Adjacency proposals: none.** Every dated item found this sweep is already a tracked calendar entry. Bookkeeping, not acted on here: `waller-economic-outlook-2026-09-03` and `fed-waller-outlook-2026-09-03` appear to be duplicate entries for the same 9/3 speech — left for those events' own lanes. | **No change to the stance; the base case is now the best-evidenced it has been.** Still guard-shaped, still no entry — but the supply leg is **closed** on a primary-sourced run-rate $39B, the Fed leg **cooled** to ~52–60% and goes silent 9/5, and the reopening-size history favours demand. Offsetting: oil at a six-week high keeps inflation uncertainty live into CPI, which remains the week's load-bearing event rather than this auction. Two kill switches resolved (the 9/3 size; the 9/4 jobs print); two added (the 9/8 3Y as the block's first demand read; VIX at YTD lows against a dense risk stack), plus a Fed-silence signal bullet | 2026-09-05 (high, 0-7d band: daily) |
| 2026-09-05 | D4 | Adjacency sweep. **Run timing matters for this row:** the session executed at ~16:30 ET on **Friday 9/4**, after the close — so it records the closes D5 explicitly could not (that row was written ~14:40 ET with the session open), and nothing further can price until the 3Y auction on Monday 9/8. **Event tape — unchanged, re-verified.** fiscaldata `upcoming_auctions` re-fetched this session still returns the 9/9 security as **9-Year 11-Month, reopening = Yes, CUSIP 91282CRF0, offering $39,000,000,000, announced 2026-09-03, issue 2026-09-15**, with 3Y **$58B** (91282CRL7) and 30Y **$22B** (912810UW6) alongside — no size revision, no re-announcement, nothing new since D5 settled the supply leg. The same endpoint's newest record (dated 2026-09-04) adds the **20Y reopening 9/15** (912810UX4, announce 9/10) and the **10Y TIPS reopening 9/17** (91282CRE3, announce 9/10); both are already tracked calendar entries. No when-issued yield published. **Rates — primary, and the concession narrowed slightly.** Treasury's own Daily Par Yield Curve (home.treasury.gov CSV, fetched direct) for **9/4**: 2Y **4.37**, 3Y 4.45, 5Y 4.54, 7Y 4.65, 10Y **4.78**, 20Y **5.25**, 30Y **5.24**; H.15 through 9/3 agrees at 10Y 4.77. Week-over-week from the 8/28 baseline: 10Y **+5bp**, 2Y +3bp, 30Y +2bp — a mild parallel drift, not a break. The 10Y sits **~9.7bp above the 4.683% at which the Aug-12 note stopped**, down from the ~11bp carried at D7 and D5: still real concession into the reopening, marginally less of it. **A flagged conflict, resolved from the primary series.** D7 called the 9/1–9/2 4.79% print "highest since January 2025", D5 recorded a secondary source saying "highest since November 2023" and flagged the two as unresolved; a 9/4 wire added a third ("three-year highs"). Read straight off **FRED DGS10** (the H.15 10Y constant-maturity series, pulled 2022-01-01→2026-09-04), the most recent close at or above 4.79 before this run is **2025-01-13 (4.79%)** — so **D7 is correct** and both other characterisations are wrong on this series. Caveat kept honest: DGS10 is constant-maturity and daily, so on-the-run quotes and intraday prints (the 4.818% of 9/2) are outside it. This closes an *Honest limits* item; it is not a stance move. **Macro / Fed path — the band collapses to its low end.** CME FedWatch put September hike odds at **52.6%** immediately after the 9/4 payroll print, against **49.4%** the prior day (IBTimes, 9/4) — i.e. the bottom of the ~52–60% range D5 carried, still well below D7's ~66–68% and nowhere near either D10 threshold (~35% / ~75%). **Blackout began 9/5**, so this is now frozen until 9/10 PPI and 9/11 CPI; consensus for August core CPI is ~**+0.2% m/m**, a mild reacceleration but slightly under the trailing 12-month average. **Equities — the 9/4 closes D5 owed.** S&P **7,718 (−0.38%)**, Nasdaq **26,506 (−0.29%)**, Dow **53,413 (−0.51%)** — a modest risk-off session on the hot print, giving back part of 9/3's Waller rally. **Volatility regime.** VIX closed **14.53** on 9/4 (from 14.32 on 9/3) — **+0.21**, far inside the 3-point materiality threshold and still at the YTD lows first logged at D10. Eight days from the corridor, the tape has still not begun pricing it. **Leg 5 — the three-row name-level gap is CLOSED, and the read did not fire.** 9/4 closes vs 9/3 (Yahoo chart API daily bars, cross-checked against the same session's hourly series, both fetched this session): **CRWV 84.56→89.36 = +5.68%**, **MRVL 208.83→223.55 = +7.05%**, NVDA 228.45→230.36 = +0.84%, AVGO 357.16→357.89 = +0.21%. So on a session with yields **up** on a hot jobs print and the index **down**, the two highest-duration names in the sensitivity tier **rallied hard** — the opposite of the 8/18 mechanism leg 5 rests on. Attribution is sector-idiosyncratic, not rates: 24/7 Wall St. (9/4) frames Marvell's ~5–6% move as beaten-down AI silicon bouncing on a positioning unwind. This is recorded as a **fired kill switch with an inverted sign** (the D21 switch expected a >5% CRWV move to *confirm* leg 5), and it demotes the rates→duration read-through from reliable to conditional. **Geopolitical — D5's counterweight does not survive scrutiny, and this is the row's most consequential finding.** D5 offset the Brent spike with Energy Sec. Wright's claim (CNBC, 9/2) that **>17mb/d** transited Hormuz on 8/31, a wartime record under US naval escort, concluding the shock was "priced on risk, not on realised supply loss." Independent tanker tracking contradicts it: TankerTrackers.com co-founder Samir Madani, cited by **Fortune (9/2)**, puts 8/31 at **~9.14mb/d** exiting the Arabian Sea, a **7-day average 8.27mb/d** and a **28-day average 6.85mb/d**, against a pre-war baseline of roughly **15mb/d** through Hormuz (~20mb/d including products), and calls the administration's method "mathemagics" — aggregating multi-day ship-to-ship transfers into a single day's count. **Kpler** independently has Middle Eastern exports at **~65% of pre-war levels** in August. Two independent trackers against one official claim, so the honest read is that a material realised-supply component *is* present and the D5 counterweight is downgraded rather than discarded. Prices: Brent settled **$95.04** on 9/4 (a six-week high, +>7% on the week), WTI **$91.48**. **OPEC+ meets 9/6** (already tracked): delegates have signalled quotas held steady for the rest of 2026 after September's 188kb/d increase completed the voluntary-cut rollback, with the Q4 pause still unconfirmed in any statement — the meeting is the next real signal. Net: the oil/inflation-uncertainty leg into 9/11 CPI is **stronger** than D5 scored it. **Adjacency — two new tracked entries since D5, no new proposals.** `buyback-blackout-start-2026-09-12` (filed by a sibling lane; the corporate bid begins withdrawing the day after CPI, removing an equity demand support from exactly this doc's sensitivity-tier names right as the corridor clears) and `sp-rebalance-proforma-capped-2026-09-11` (lands on CPI day). Adjacent tracked entries within 5 days now number **18**, up from 16 at D5. **No new dated adjacency found this sweep that is not already a calendar entry — nothing proposed in this PR.** **The aggregator trap:** no new instance this sweep, but the 2025 "$39B / 4.033% / indirect 83.1%" result flagged at D7 and D5 remains the live hazard precisely because this year's size genuinely is $39B. | **No change to the stance — but this is the first row since D10 whose net movement is *away* from the prior row's optimism.** Still guard-shaped, still no entry; the auction side is unchanged and well-set ($39B re-verified, ~9.7bp concession, blackout freezing the Fed at 52.6%). Two of D5's own readings walk back: the Hormuz counterweight is disputed by two independent trackers at roughly half the claimed flow, strengthening the inflation-uncertainty leg into CPI; and leg 5's rates→duration transmission failed to operate on 9/4, so name-level moves are not an auction tell. One *Honest limits* item closed (the 10Y high-water-mark conflict, resolved in D7's favour from FRED DGS10). One kill switch fired inverted and retired (the >5% CRWV move); one added (Hormuz throughput as the oil counterweight's own test); one signal bullet added (name-level decoupling) | 2026-09-06 (high, 0-7d band: daily) |
| 2026-09-06 | D3 | Adjacency sweep, run on a **Sunday with the tape shut since Friday's close** — so every rate, vol and equity reading below is Friday 9/4's, carried unchanged from D4, and nothing in this row is a new price observation. **Event tape — unchanged, re-verified a third consecutive session.** fiscaldata `upcoming_auctions` re-fetched direct this session still returns the 9/9 security as **9-Year 11-Month, reopening = Yes, CUSIP 91282CRF0, offering $39,000,000,000, announced 2026-09-03, issue 2026-09-15**, with 3Y **$58B** (91282CRL7, 9/8) and 30Y **$22B** (912810UW6, 9/10) alongside; the 20Y reopening (912810UX4, 9/15) and 10Y TIPS reopening (91282CRE3, 9/17) both still show `offering_amt: null` pending their 9/10 announcement. No size revision, no re-announcement, no when-issued yield. The supply leg stays closed. **THE MATERIAL FINDING — the corridor is one session shorter than this doc has been assuming, and nobody had written it down.** **Monday 2026-09-07 is Labor Day and US markets are closed.** Sourced three ways: nyse.com/markets/hours-calendars fetched direct this session lists 'Labor Day: Monday, September 7' among its 2026 full closures with no September early close; SIFMA's US Holiday Recommendations panel recommends a **full** fixed-income close (not an early one) the same day; and 5 U.S.C. 6103 fixes Labor Day on the first Monday in September, which in 2026 is the 7th. **Confirmed mechanically from a Treasury primary that does not depend on either holiday calendar:** `auctions_query` for the 13-Week bill shows a **Monday** auction for ten consecutive weeks (2026-07-06 through 2026-08-31, every one $92B) with exactly one exception in the series — **2026-09-08, a Tuesday**. Treasury moved the entire Monday bill slate a day because the market is shut. **Three consequences, all of which tighten the guard.** (1) **The runway is one session, not two.** D5 called the 9/8 3Y 'the block's first hard demand read'; with 9/7 gone it is the *only* read before this reopening prices. (2) **That session is crowded.** The displaced Monday slate — 13-week **$92B** (912797VG9), 26-week **$79B** (912797WK9), 6-week **$75B** (912797UL9) — lands on 9/8 *on top of* the $58B 3Y, so **~$304B auctions in a single session** where a normal week splits it across two. This is a read-quality problem, not a supply-signal one: a 3Y tail attributable to same-session crowding says nothing about the 10Y, so the D5 switch is amended rather than kept verbatim (a tailing 3Y **with weak indirects** is the warning; a tail on cover alone is inconclusive this week; a stop-through *despite* the crowding is a stronger positive than originally credited). (3) **Two calendar days of escalation arrive unpriced**, and they arrive into that same compressed session. The week's four corridor days are now the week's only four sessions — 9/8 3Y+bills · 9/9 10Y+buyback start+EIA STEO+Apple event · 9/10 30Y+PPI+ECB+10–20Y buyback op+20Y/TIPS announcement · 9/11 CPI+MTS+UMich — with no day on which a bad print can be digested before the next lands. **PROPOSED in this PR as a new calendar entry:** `labor-day-market-closure-2026-09-07` (`estimate`, `NEWS:`, impact low, kind `sector` — the same least-wrong kind the three sibling closure entries documented, EventKind having no market-structure member). Filed estimate, not confirmed, on the sibling precedent: the source taxonomy has no prefix for an exchange's or a trade association's own holiday calendar and this lane may not self-confirm what it discovered in-sweep. The date is not in doubt; the label is about taxonomy. **Geopolitical — escalated over the closed weekend.** On Saturday **9/5** the IRGC navy said it targeted **three oil tankers** transiting Hormuz on 'an unauthorized route' plus three US-affiliated vessels elsewhere; US forces **destroyed one Iranian tanker and permanently disabled two more** after the IRGC fired ballistic missiles toward a US aircraft carrier and destroyer (neither hit, no injuries) — the **fourth** Iranian tanker disabled since 9/1 under a stated 'tanker for tanker' policy (ABC News live updates, 9/5). Vance's 9/3 line that the US will not talk to Tehran until attacks on commercial shipping stop is the diplomatic backdrop and predates D4's cut-off, so it is context, not new. **Oil — D4's downgrade of the counterweight is now corroborated, and it gained a forward mechanism.** D4 disputed Energy Sec. Wright's '>17mb/d wartime record' on one tracker (TankerTrackers via Fortune). Al Jazeera's 9/3 tracker comparison makes it **three independent commercial trackers against the official series**: **Kpler** 6 vessels Wednesday, 11 Tuesday, 5 Monday, **10-day average 13/day**; **Lloyd's List Intelligence** ~**12 transits/day** for 8/26–9/1 (~14 non-Iranian-linked/day 8/17–23); **PortWatch** ~**7/day** since March — against a pre-war baseline of ~**100 ships and ~20mb/d**. Officials on the other side: Trump '~30 ships every night', two US officials '40 ships / 18mb/d on Tuesday', Bessent 'at least 10mb/d, 15–17mb/d on Monday'. Trackers attribute the gap to a US operational count that sweeps in naval auxiliaries, offshore support, tugs, coastal craft and dhows, plus dark transits with transponders off. **The new mechanism, and it is the most consequential thing in this row after the holiday:** Kpler (8/19) puts the MoU window's Hormuz average at **6.1mb/d vs a ~15mb/d 2025 baseline — ~40%** — a **~550mb crude shortfall** 'bridged so far by inventory draws and truce-window buffers **that thin from September**', with floating storage falling **61mb at signing → 16mb within three weeks** and total crude on water closing ~130mb. So the muted price pass-through has been a *physical cushion*, and that cushion depletes in the same month as this auction and the 9/11 CPI. This is the first forward-looking argument this doc has for the inflation-uncertainty leg rather than a re-reading of a past claim. Prices unchanged from D4 (Brent settled **$95.04** on 9/4, ~$96 intraday, +~9% on the week, its strongest since mid-July; WTI $91.48). **OPEC+ (9/6) — met today, UNRESOLVED at this row's run time.** The seven core members convened on October quotas; no statement was published or indexed when this session ran, so nothing is scored. Pre-meeting sourcing is unchanged from D4 — delegates via Bloomberg point to holding quotas steady for the rest of 2026 after September's +188kb/d completed the 1.65mb/d voluntary-cut rollback, with the 8/2 statement making no Q4 reference. A pause would be oil-supportive on top of the geopolitical bid. **Carried to the next row explicitly rather than guessed at.** **Fed path — frozen, unchanged.** Blackout live since 9/5; no Fed voice is legal before the auction. September hike odds last read **52.6%** (CME FedWatch, 9/4), still below D7's ~66–68% and inside neither D10 threshold (~35% / ~75%). Nothing can move them until 9/10 PPI and 9/11 CPI. **Rates / volatility — no new prints.** Treasury par-yield curve 9/4 (carried): 2Y **4.37**, 10Y **4.78**, 20Y 5.25, 30Y **5.24**; concession above the Aug-12 4.683% stop stands at **~9.7bp**. VIX **14.53** (9/4 close), still YTD lows, unchanged and nine days into the observation that the tape has not begun pricing the corridor. **Peers / name level.** No sessions since 9/4, so D4's CRWV +5.68% / MRVL +7.05% decoupling stands unchallenged with no new tape; the next test is 9/8. **Adjacency — 22 tracked entries now sit within 5 days of this event, up from 18 at D4.** Three arrived from sibling lanes since D4: **`ecb-decision-2026-09-10`** (new to this doc and directly on-point — the ECB Governing Council decision and press conference land the *same day* as the 30Y reopening and PPI, putting a foreign policy-rate anchor inside the corridor on a day this doc had treated as purely domestic supply), `treasury-coupon-announcement-2026-09-10` (fixes the 20Y and 10Y TIPS sizes) and `missouri-map-ballot-deadline-2026-09-08`. **One new dated adjacency PROPOSED in this PR:** `labor-day-market-closure-2026-09-07`, above. **The aggregator trap:** no new instance this sweep; the 2025 '$39B / 4.033% / indirect 83.1%' result flagged at D7, D5 and D4 remains the live hazard precisely because this year's size genuinely is $39B. | **No change to the stance — but this is the second consecutive row whose net movement is *away* from the prior row's optimism, and the first to correct a structural assumption rather than a reading.** Still guard-shaped, still no entry; the auction side is unchanged and well-set ($39B re-verified a third time, ~9.7bp concession, Fed frozen at 52.6%). What changed is the shape of the runway: Labor Day removes the week's spare session, leaving one crowded ~$304B day (9/8) as the only pre-auction read and the only place two days of Hormuz escalation can price. The oil leg strengthened on both evidence (three trackers, not one) and mechanism (the inventory cushion thins from September). One kill switch amended (the 9/8 3Y, now with a crowding discount); two added (oil-cushion depletion as a non-price test; the no-spare-session compounding condition); two signal bullets added (the compressed 9/8 session; oil cushion exhaustion). OPEC+ carried unscored | 2026-09-07 (high, 0-7d band: daily) |
| 2026-09-08 | D1 | Adjacency sweep, run **pre-open at ~07:40 ET on 9/8** — so the 3Y (1:00pm ET) and today's cash session both price *after* this row, and every equity/name-level reading below is still Friday 9/4's. **Event tape — unchanged, re-verified a fourth consecutive session, and it corroborates D3 from the other side.** fiscaldata `upcoming_auctions` re-fetched direct still returns the 9/9 security as **9-Year 11-Month, reopening = Yes, CUSIP 91282CRF0, offering $39,000,000,000, announced 2026-09-03, issue 2026-09-15** — no revision, no re-announcement, still no when-issued yield. The same endpoint independently confirms the Labor Day displacement D3 inferred from the 13-week series: 9/8 carries **13-week $92B (912797VG9) + 26-week $79B (912797WK9) + 6-week $75B (912797UL9), all announced 9/3**, alongside the **$58B 3Y (91282CRL7)** — **~$304B in one session**, now primary-sourced rather than reconstructed — while the *following* week's 13-week and 26-week bills (912797VH7, 912797UD7) sit back on **Monday 9/14**. The displacement was holiday-specific, not a schedule change. Supply leg stays closed. **Rates — a new high, and the high-water-mark question settles at the new level.** The 10Y printed **4.81%** on 9/8 (Trading Economics quote; **secondary** — H.15 and Treasury's par-yield curve have no print after 9/4 because of the holiday, and both still read 10Y **4.78** / 2Y 4.37 / 30Y 5.24 there). At 4.81 the concession above the Aug-12 **4.683%** stop is **~12.7bp**, up from the ~9.7bp carried since D4 — the largest of any row in this doc. Pulled **FRED DGS10** (2022-01-01→2026-09-08) this session to adjudicate: the most recent close at or above **4.81** is **2023-10-31 (4.88)**, and the most recent at or above **4.79** is **2025-01-13**. So D7's "highest since January 2025" was correct *at 4.79* and today's "highest since October 2023" is correct *at 4.81* — the conflict D5 flagged and D4 resolved dissolves entirely: both characterisations are right at their own thresholds, and the series has simply crossed the next one. **Fed path — odds rose during blackout, and that identifies the mover.** CME FedWatch put a September 25bp **hike at 58.7% as of 9/7**, up from the **52.6%** recorded on 9/4 — **+6.1pp with no Fed voice legal since 9/5 and no 3Y result yet**. D3 wrote that only oil, the 9/8 3Y and positioning could reprice this event before the auction; this row answers which one did. Still inside both D10 thresholds (~35% / ~75%). **Macro — the August CPI consensus, and the aggregator trap fires in a genuinely new place.** One aggregator gave August consensus as headline **+0.3% m/m to 2.9% y/y "after 2.7% in July"** and core **+0.3% m/m to 3.1% y/y "after 3.1%"**. Computed straight from **BLS's own API** this session (`CUUR0000SA0` and `CUUR0000SA0L1E`, 2025–2026), July 2026 actuals are headline **+3.36% y/y** and core **+2.48% y/y** — that July baseline is wrong by ~0.66pp on headline and ~0.62pp on core and does not describe this series. The consensus consistent with the primary is headline **holding ~3.4%** and core **easing to ~2.4%**. Recorded prominently because this is the **third distinct aggregator error** in this doc and the first on the *macro* side rather than the auction side. **The implication is not housekeeping:** hike odds rose 6.1pp on the energy channel while the core gauge the Fed says it looks to is expected to *ease*. **Blocked sources, recorded not substituted:** `bls.gov/news.release/cpi.nr0.htm` returned **403** even with browser headers (the known lane blind spot) — `api.bls.gov` was used instead and is equally primary; `opec.org/press-releases.html` returned **402** and the 8/2 `pr-detail` page still shows no 9/6 communiqué, so the OPEC+ outcome below is `NEWS:`-sourced, not `EST:`-primary. Both are in this ledger's `probe-ref.blocked`. **Geopolitical — OPEC+ scored, and the oil mechanism moved onshore.** (a) **D3's carried item closes.** The seven OPEC+ countries met virtually 9/6 and **held October quotas at September levels**: Saudi **10.478**, Russia **9.949**, Iraq **4.431**, Kuwait **2.676**, Kazakhstan **1.628**, Algeria **1.007**, Oman **0.841** mb/d, group total ex-compensations **31.01mb/d**; next meeting **4 October**. Rationale reported: the Hormuz disruption limits the group's ability to move physical supply, and members' sustainable-capacity audits must set 2027 baselines before further unwinding. The pause pre-meeting sourcing expected did happen — so **no offsetting barrels**. (b) **The new mechanism, and it is this row's most consequential finding after the pricing.** Every prior row's oil leg was a *transit* story. On **9/8**, Houthi drone/missile attacks **ignited fires at Saudi oil facilities and utilities in the southern region**, temporarily suspending operations, with **73 wounded** — the area of the **400kb/d Jazan refinery**, and the third-plus strike on it since 8/9. That is producing and refining infrastructure **inside a producer**, a materially wider channel than chokepoint transit. Prices followed: Brent **$97.89** on 9/7 and **~$98.65 (+1.54%)** intraday 9/8, against the **$95.04** 9/4 settle — **+3.8% in two sessions, +12.5% on the month**, approaching $100. (c) **The counter-vector, stated because a doc that only logs escalation is not honest.** On **9/7** Iran's foreign-ministry spokesman Esmail Baghaei said an **Iran–Oman agreement on Hormuz shipping is "days away"**, in final stages, covering a temporary safe route and **to be documented with the IMO**; Brent briefly pared gains on it. This is the first credible path to the oil switch's ~$85 de-escalation branch since D7 — reported, not signed. **Volatility — the first break off the YTD lows.** VIX reads **15.75** pre-open on 9/8 (Cboe global-trading-hours session via the Yahoo chart feed) against the **14.53** 9/4 close carried since D4 — **+1.22**, inside the 3-point materiality threshold but the first directional move after **ten sessions** of the standing "the tape has not begun pricing the corridor" observation. Honesty note: the same feed also shows a **15.30 bar dated 9/7**, a session on which **^GSPC and ^TNX show no bar at all** and NYSE/SIFMA were fully closed; that is not reconcilable with a full holiday, so it is flagged and **not adopted** as a close. **Equities / name level — no new closes, so leg 5 is still untested.** Pre-open 9/8 futures: **Dow −0.8% (53,013), S&P 500 −0.3% (7,691.3), Nasdaq 100 flat (29,593)** — risk-off into the crowded session, but led by the **Dow** rather than the duration-sensitive index, the opposite ordering leg 5 would predict. The 9/4 closes were re-verified this session (CRWV **89.36**, MRVL **223.55**, NVDA **230.36**, AVGO **357.90**; S&P 7,718.60), so D4's CRWV +5.68% / MRVL +7.05% decoupling still stands unchallenged with no new tape — **today's session is its test, and it lands after this row.** **Adjacency — 25 tracked entries now sit within 5 days, up from 22 at D3.** D3's own `labor-day-market-closure-2026-09-07` proposal is now the canonical file. Three arrived from sibling lanes since D3, and two of them matter more than they would have a week ago because the oil leg is the live one: **`opec-momr-2026-09-10`** and **`iea-omr-2026-09-11`** put both major agencies' supply/demand balances *inside* the corridor, on the 30Y and CPI days respectively; `qss-q2-2026-09-09` is the third. **No new dated adjacency proposed in this PR.** The one dated item this sweep surfaced — OPEC+'s next ministerial on **4 October** — is already proposed twice by sibling lanes (`opec-plus-meeting-2026-10-04.from-opec-plus-meeting-2026-09-06.json` and `.from-treasury-3y-note-2026-09-08.json`), and `opec-jmmc-68th-2026-10-04` already tracks the same-day JMMC; a third proposal would be noise, not information. The Iran–Oman deal carries no date. **The aggregator trap:** the 2025 "$39B / 4.033% / indirect 83.1%" auction result flagged at D7, D5, D4 and D3 remains live precisely because this year's size genuinely is $39B — and it now has a macro-side sibling (the wrong July CPI baseline, above). | **No change to the stance — but this is the third consecutive row whose net is *away* from optimism, and the first where the movement is in the tape rather than in the evidence.** Still guard-shaped, still no entry. The auction side is unchanged and well-set for a fourth session ($39B, and the concession has *widened* to ~12.7bp, which is compensation). What moved is all three prices at once — 10Y to a fresh 4.81%, hike odds to 58.7% *during blackout*, VIX off the YTD lows — with oil identifiable as the sole mover, and the oil mechanism itself widened from Hormuz transit to onshore Saudi infrastructure. Offsetting and recorded honestly: an Iran–Oman Hormuz deal is reportedly days away, and core CPI consensus points *down* to ~2.4%, so the hike is being priced off energy rather than off the Fed's own gauge. One kill switch resolved (OPEC+, mildly adverse); three added (the oil switch is no longer a Hormuz switch; the IMO filing as the de-escalation tell; the energy/core divergence, which kills the Fed leg in either direction on 9/11). Two signal bullets added, one answered (Fed silence — oil did it). The 10Y high-water-mark question is settled at both thresholds from FRED DGS10. OPEC+ scored | 2026-09-09 (high, 0-7d band: daily) |
| 2026-09-09 | D0 | Adjacency sweep, run **20:12 ET on Tue 9/8** — the evening before the 1:00pm ET reopening, so this row sees the two things D1 (pre-open, 07:40 ET) explicitly could not: **the 3Y result and the full 9/8 cash session**. The auction prices ~17 hours after this row. **THE MATERIAL FINDING — the block's only pre-auction demand read came in, and it splits cleanly along this doc's two open questions.** Primary (`api.fiscaldata.treasury.gov` `auctions_query`, CUSIP **91282CRL7**, results `R_20260908_3.pdf`, fetched direct this session): $58B offered, high yield **4.4740%**, bid-to-cover **2.720**, competitive accepted $57,619,163,700 of which indirect $35,809,000,000 = **62.15%**, direct $15,525,163,700 = **26.94%**, primary dealers $6,285,000,000 = **10.91%**, allocation at the high 29.35%, single-price, coupon 4.375%. The **tail is secondary-sourced** and stated as such — fiscaldata publishes no when-issued level; investinglive puts WI at **4.475%** against the 4.474% stop, a **−0.1bp stop-through**, and rttnews independently reports the same $58B / 4.474% / 2.72 with a ten-auction cover average of 2.65. **The clearing side is strong.** Cover 2.720 against a **2.620** six-auction average computed from the primary this session is the **best 3Y bid-to-cover of 2026** (Aug 2.71, Jul 2.60, Jun 2.64, May 2.54, Apr 2.68, Mar 2.55) and the best since 2025-11-10; dealers took **10.91% against a 14.07% average**, so real money absorbed the paper rather than the syndicate. And it did that *into* the ~$304B of displaced same-session supply — the favourable branch of D3's amended switch, fired exactly as written. **The mix side is not.** Indirects **62.15%** against a **65.51%** six-auction average is **3.4pp light**, with directs at 26.94% against a 20.4% average filling the gap — the **third consecutive coupon auction** with that signature (5Y 8/26 61.5% vs ~65%; 7Y 8/27 60.8% vs 65.1%). Read the 8/30 switch's wording precisely: it asks for a third light print ***at the 10Y***, and the third light print landed at a different tenor, so the pattern strengthened while the switch's own condition stays pending on today's result. **A discrepancy resolved by arithmetic, not by preference.** investinglive prints indirects at **64.2%** against the primary's 62.15%; its three shares sum to **102.0%** while the primary's sum to exactly **100.00%**, and its cover, directs and dealers match the primary to the decimal. The primary figure stands and the shortfall is 3.4pp, not 1.3pp — which matters because this is the metric the 10Y's own kill switch keys on. **STRUCTURAL FINDING 1 — today is uncrowded, and every prior row's crowding framing was about 9/8 only.** `upcoming_auctions`, re-fetched direct (a **fifth** consecutive verification of the reopening: 9-Year 11-Month, reopening = Yes, CUSIP **91282CRF0**, offering **$39,000,000,000**, announced 2026-09-03, issue 2026-09-15, still no when-issued), shows **9/9 carrying the $39B 10Y plus one 17-week bill ($72B, 912797WP8, announced 9/8) ≈ $111B**, against 9/8's ~$304B, with the day's other Treasury operation a **buy**. So the discount D3 installed does not apply here and today's print is a clean read in both directions: a tail cannot be excused as crowding, a stop-through cannot be inflated by it. **STRUCTURAL FINDING 2 — this doc has been benchmarking a reopening against the wrong series.** Pulling the full 10Y lineage from the primary (`original_security_term = 10-Year`, which is the only way to catch reopenings — they file under *9-Year 11-Month* and *9-Year 10-Month*, so a `security_term:eq:10-Year` filter silently returns new issues only; n=27, 2024-06 → 2026-08): **reopenings average 72.66% indirect and cover 2.570; new issues average 67.45% and cover 2.453** — a **+5.2pp** demand gap nobody had recorded. The blended average is 70.92%, which vindicates the '~71%' this doc has carried since D21 as a *number* while showing it is the **wrong basis** for a reopening; and Aug-12's 76.7%, the doc's other anchor, is a **new-issue** print, so it overstates the bar from the other side. Corrected reading for today: **~72–73% is par**, **~68% is light by the same margin the 3Y/5Y/7Y ran**, mid-60s is the contagion signal. **STRUCTURAL FINDING 3 — the five-row aggregator phantom now has a name.** The '$39B 10Y / 4.033% / indirect 83.1% / dealers 4.2%' result discarded at D7, D5, D4, D3 and D1 as 'some 2025 figure' is, in the primary, the **2026-09-10 minus one year** auction: **2025-09-10, $39B, HY 4.0330, B/C 2.650, indirect 83.13%, dealers 4.21%** — the September 10Y reopening one year to the day before this one, which is exactly why it keeps surfacing on searches for this event and why the size matches. Identified rather than merely flagged. **Rates — the curve barely moved on the most crowded session of the quarter, and D1's reading is corrected against the primary.** Treasury's Daily Par Yield Curve (home.treasury.gov CSV, fetched direct) for **9/8**: 2Y **4.39**, 3Y 4.44, 5Y 4.57, 7Y 4.68, 10Y **4.80**, 20Y **5.26**, 30Y **5.25** — against 9/4 that is 10Y **+2bp**, 2Y +2bp, 30Y +1bp, 3Y −1bp. D1 recorded a pre-open **4.81** from Trading Economics and computed ~12.7bp of concession; on the primary close the figure is **4.80** and the concession above the Aug-12 **4.683%** stop is **~11.7bp** — still the widest of any row in this doc, and the correction is 1bp, not a reversal. That ~$304B cleared with a 2bp move is itself a supportive datapoint. **Fed path — the blackout climb stalled, which is new information about the mover.** Investing.com's Fed Rate Monitor (CME 30-day fed-funds futures), timestamped **2026-09-08 07:55PM EDT**: September hike **58.1%** / hold 41.9%, against the **58.7%** of 9/7. So on a session where Brent added another 3.4%, the oil→Fed channel D1 identified as the sole mover **did not transmit**. Still inside both D10 thresholds (~35% / ~75%). A Trading Economics summary the same day puts it 'roughly 60%', consistent as a band; an untimestamped search summary claiming 'nearly 56%' is **not adopted**. **Volatility — the break off the YTD lows is confirmed at the close.** VIX closed **15.72** on 9/8 (Yahoo/Cboe daily bar) against the 15.75 pre-open D1 carried and the **14.53** of 9/4 — **+1.19** on the session, inside the 3-point materiality threshold but the first close off the lows after ten sessions. D1's flagged anomaly **persists and is still not adopted**: the same feed shows a 15.30 VIX bar dated **9/7**, a full NYSE/SIFMA holiday on which ^GSPC shows no bar at all. **Leg 5 — the test D1 said 'lands after this row' ran, and it inverted a second time, harder.** 9/8 closes vs 9/4, taken from Yahoo daily bars and cross-checked against the same session's hourly series: **CRWV 89.36 → 99.83 = +11.72%**, **NVDA 230.36 → 225.73 = −2.01%**, MRVL 223.55 → 225.41 = +0.83%, AVGO 357.90 → 368.56 = +2.98%; **S&P 7,718.60 → 7,673.52 = −0.58%**, Nasdaq 26,506.99 → 26,421.41 = −0.32%. So on a session with the 10Y at a fresh high, VIX up and the index down, the single highest-duration, most debt-financed name in the sensitivity tier rose **11.7%** — and **NVDA fell 2.0% in the same session**, meaning the tier did not move as a tier at all. Attribution is idiosyncratic and dated: Nvidia raised its stake in CoreWeave, Truist lifted its target to $165, and Q2's ~$104B backlog is still repricing the name. Two consecutive failed tests, the second with an internal split, so **leg 5 is downgraded from D4's 'conditional' to refuted as a same-week read-through**, retaining only 8/18 as evidence about an acute rate-*shock* session. **The aggregator trap fired twice more, once in a new place.** (a) A stock aggregator reported CRWV '+14.68%, latest close $102.48'; the hourly cross-check puts the 9/8 close at **99.83** with an intraday high near 103.2, so 102.48 is an intraday level quoted as a close — the **sixth** instance in this doc and the second on the equity side, and note the Motley Fool's 'soared 12%' matches the verified close. (b) A search summary served **stale 3Y figures** ($42B / 3.202% / B/C 2.50) attributed to 9/8; the underlying rttnews article itself is correct ($58B / 4.474% / 2.72), so the error was the summary layer, not the source — recorded because the two failure modes need different defences. **Geopolitical / oil — the $100 handle, and the de-escalation tell did not fire.** Brent front-month **$99.51** and WTI **$94.57** at 20:03 ET 9/8, **+3.4%** from the $96.28 close of 9/4; CNBC 9/8 ('Brent crude nears $100 after strikes on Saudi energy sites') records Brent's highest since **July 23**, with the Houthis claiming the **400kb/d Jazan refinery** and other domestic-market facilities and **73 wounded**. D1's onshore mechanism is confirmed as the price driver. On the other side, **no evidence was found** of the Iran–Oman IMO filing D1 named as the tell: this sweep surfaced only the *August* track of the same negotiation (a temporary two-lane Hormuz route reported 8/26; an 8/7 report that the arrangement bars US and Israeli vessels) and nothing dated 9/8 or later. Stated as 'not found', not 'did not happen' — and per the switch's own wording the leg **stays in** absent a filing by 9/11. **Blocked sources, re-tested rather than carried or dropped:** `bls.gov/news.release/cpi.nr0.htm` still **403** with browser headers and `opec.org/press-releases.html` now **403** (it was 402 at D1); both re-recorded in this ledger's `probe-ref.blocked` with today's date. Nothing in this row depends on either. **Adjacency — 27 distinct tracked entries within 5 days, up from 25 at D1.** Two arrived from sibling lanes, and the on-point one needs its caveat carried, not just its name: **`treasury-buyback-cash-mgmt-2026-09-09`** is a **$12.5B-cap** cash-management buyback at **1:40pm ET on auction day**, forty minutes after this reopening prices — but its own initial research is explicit that the sector is **1Mo–2Y** and that it 'buys nothing at any tenor the long-end ledgers care about, so this is a cash/front-end supply signal, not duration support.' Recorded with that caveat precisely so this doc does not mis-bank it as a same-day bid for the tenor being sold; the same-sector operation is the **10–20Y** one on 9/10. The second is `existing-home-sales-2026-09-10`, a rate-sensitive print on the 30Y day. **No new dated adjacency proposed in this PR** — every dated item this sweep surfaced is already tracked, and the Iran–Oman agreement still carries no date. **One forward test registered:** `FT-treasury-10y-note-2026-09-09-1`, the doc's first — leg 3's 'the 10Y is the strong tenor' put where it can be scored, predicting an indirect share **≥ 68.0%** at today's reopening, base rate stated (12 of the last 18 reopenings cleared it, 66.7%), score-by 2026-09-10 from the primary. | **No change to the stance — but this is the first row since D10 whose net moves *toward* the base case, and the reason it does not move has itself changed.** Still guard-shaped, still no entry. The auction side is verified a fifth time ($39B, ~11.7bp concession) and the block's first demand read **cleared**: a stop-through into ~$304B of crowding, the best 3Y cover of 2026, a below-average dealer takedown, a 2bp curve move on the quarter's most crowded session, and a hike-odds climb that stalled at 58.1%. What is unresolved is narrower than it was: the light-indirect run reached a third tenor but not yet the benchmark, and today's session is clean enough to settle it. Against that, Brent is at $100 with no IMO filing found. Prior rows held the stance because the evidence was two-sided; this one holds it because the auction-specific risk has largely resolved and **what remains is macro — CPI on 9/11, not this print**. One kill switch resolved on its favourable branch (the 9/8 3Y); one re-based rather than retired (the indirect thresholds, now reopening-relative); one retired as refuted (leg 5's name-level read-through); one added (the Fed-path stall). Three signal bullets added, three answered. Leg 5 downgraded to refuted-as-same-week-read-through. The five-row aggregator phantom identified as the 2025-09-10 reopening. One forward test registered | 2026-09-10 (high, 0-7d band: daily — but the event passes today, so the next assessment is the close-out) |
| 2026-09-10 | D+1 | **Close-out row — the auction is scored from the primary, and so is the tape it produced.** Instrument caches busted first (`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`); rates events carry `symbols: []` so the scoring sources are Treasury's own `auctions_query` and daily par-yield-curve CSV, both re-fetched this session, plus Yahoo 5-minute bars for the intraday reaction. **The result** (CUSIP 91282CRF0, results `R_20260909_2.pdf`): $39B, high yield **4.8340%**, **bid-to-cover 2.710 — the highest of 28 nominal 10Y auctions since 2024-06** — competitive accepted $38.902B of which indirect $30.804B = **79.18%**, direct $6.421B = **16.51%**, primary dealers $1.677B = **4.31%** (2nd-lowest of the same 28), allocation at the high **89.25%**, avg/median yield 4.769%. Tail is secondary-sourced as ever (fiscaldata publishes no when-issued): **stopped through ~1.5bp**. **The doc's central question is answered — no contagion.** 79.18% sits **6.5pp above the 72.66% reopening mean** this doc measured at D0 (n=18 prior reopenings, reproduced exactly this session) and **11.2pp above** the 68.0% light threshold, so the 5Y/7Y/3Y light-indirect run was front-end/belly and did not reach the benchmark. `FT-treasury-10y-note-2026-09-09-1` **scored PASS**, with its own stated caveat honoured — a pass was the two-in-three base-rate outcome (12 of 18, reproduced), so the margin is the information, not the binary. **The 9/10 30Y — this doc's own named confirm/deny — confirmed harder:** $22B, 5.3080%, cover 2.610, indirects **79.48%** (2nd of 28 vs a 65.51% mean), dealers **2.21%**, the lowest of its whole lineage. **And the tape moved the other way.** Intraday (Yahoo 5m, ^TNX): **4.845 at 12:55pm ET → 4.829 low at 2:00pm → 4.837 close** — the best-bid auction in two years bought **1.6bp** and kept **0.8bp**; TLT +0.20% over the same window and back to +0.13% by the bell. Treasury par curve: 10Y **4.80 (9/8) → 4.83 (9/9) → 4.95 (9/10)**, 2Y 4.39 → 4.43 → 4.56, 30Y 5.25 → 5.28 → 5.37 — a **two-day +15bp bear-flattening** to the highest 10-year since **November 2023**. **Adjacency sweep — the cause is oil, and the decomposition is measured, not narrated.** Brent **97.92 → 101.21 → 109.19** (+11.5% over the pair), WTI to **104.06**, after the US destroyed five Iranian tankers following ballistic-missile attempts on a US warship and **Trump said on 9/9 he is "not looking for a deal with Iran"** — which closes the Iran–Oman off-ramp D1 added and D0 could not find an IMO filing for. Of 9/10's **+10.7bp** in ^TNX, **+4.8bp printed overnight before PPI** (4.837 close → 4.885 at 8:25am ET) and only **+1.2bp** on the 8:30am print itself; the 1:00pm 30Y auction — best sponsorship of its lineage — produced **+0.8bp of yield**, and yields rose 2bp further in the hour after. **PPI (BLS, 9/10)** split exactly as D0 predicted: headline **+0.4% m/m in line** with the Dow Jones consensus, **5.4% y/y vs 5.3% expected** on a **+4.2% energy** component, but **core +0.2% vs +0.3% expected** — hot on energy, *softer* at the core. **Fed:** September hike odds **58.1% (9/8) → ~68.7% (Investing.com Fed Rate Monitor, timestamped 2026-09-10 06:15PM EDT; ~70% on the Reuters/Globe and Mail read, 63% on prediction markets)** — D0's "the oil→Fed channel stalled" reading is **refuted within 48 hours**, and D10's ~75% threshold is ~6pp away. **Vol:** VIX **15.72 (9/8) → 16.46 (9/9) → 17.84 (9/10)** — D5's "above ~18 before 9/9" tell arrived a session late, after the auction rather than before it. **Names, recorded and bounded:** leg 5's refuted same-week form failed a **third** time on 9/9 (yields +3bp, **MRVL +4.1%** against CRWV −4.9%), while its retained acute-shock form got a confirming observation on 9/10 (10Y +12bp; **CRWV −6.1%, MRVL −3.4%, NVDA −2.4%, AVGO −1.0%**, S&P −0.6%) — one confirmation does not reinstate a read-through that has failed three times. **Blocked sources, recorded not substituted:** cnbc.com 403 ×2 and cnn.com 451 today, all three logged in `probe-ref.blocked`; every figure above is from a primary or an explicitly-named secondary. **No new dated adjacency proposed** — the two ids added to the corridor since D0 (`canada-counter-tariffs-effective-2026-09-08`, `jgb-liquidity-enhancement-1-5y-2026-09-10`) were both already tracked by other lanes. | **Closed. Leg 3 SUPPORTED on the strongest evidence this doc produced; the guard expired unused and cost nothing; leg 5's same-week form stays refuted.** The stance is stood down because the event is spent, not because the risk resolved — the finding handed forward is that **auction demand and the direction of yields decoupled**, so a coupon auction is a *lagging* read on term premium in an energy-driven regime. Live documents from here: `cpi-2026-09-11`, `fomc-2026-09-16`. | — (closed; `## Outcome` filled, no further checks) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.

## Outcome

**Close-out (2026-09-10, D+1 — the morning after the 30Y reopening, this doc's own named
confirm/deny, closed its session).** Rates-auction mode runs no `earnings-cycle` / `intraday-edges`
instrument (`symbols: []` by design), so the caches were busted as the protocol requires
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) and the scoring is
done from three sources re-fetched **this session**, never from memory of the tape:
`api.fiscaldata.treasury.gov`'s `auctions_query` for the auction itself, Treasury's **daily par
yield curve** CSV for the rate path, and Yahoo **5-minute** bars for the intraday reaction window.

**The headline verdict: the doc got its question right, got its answer right, and learned that the
answer does not price.** This document was built on one load-bearing question — *will the long-end
term-premium weakness contaminate the benchmark?* The answer is an emphatic **no**. And the curve
bear-flattened **15 basis points** across the two auction sessions anyway.

### What printed — the best 10-year auction of its lineage

Primary: `auctions_query`, CUSIP **91282CRF0**, results `R_20260909_2.pdf`, announced 2026-09-03,
issues 2026-09-15.

| Metric | 2026-09-09 (this reopening) | 2026-08-12 (predecessor, new issue) | Reopening mean, n=18 prior | Verdict |
|---|---|---|---|---|
| Offering | **$39.0B** | $42.0B | $39B run-rate | run-rate, as announced 9/3 |
| High yield | **4.8340%** | 4.6830% | — | **+15.1bp** of concession vs the predecessor |
| **Bid-to-cover** | **2.710** | 2.530 | 2.570 | **highest of 28 nominal 10Y auctions since 2024-06** |
| **Indirect** | **79.18%** | 76.73% | **72.66%** | **+6.5pp vs the reopening mean**, 4th of 28 |
| Direct | 16.51% | 14.67% | — | ordinary |
| **Primary dealers** | **4.31%** | 8.60% | 10.32% | **2nd-lowest of 28** — real money took it down |
| Allocation at high | 89.25% | 65.27% | — | — |
| Tail | **~−1.5bp (stopped through)** | +0.1bp (on the screws) | — | **secondary-sourced** — fiscaldata publishes no when-issued |

**The 9/10 30Y reopening, which this doc named at D21 as the intervening confirm/deny, confirmed
harder:** $22B, CUSIP 912810UW6, high yield **5.3080%**, cover **2.610**, indirects **79.48%** (2nd
of 28 30Y auctions since 2024-06, against a **65.51%** mean), primary dealers **2.21% — the lowest
of that entire lineage**. Foreign sponsorship was intact at *both* ends of the curve in the same
48 hours.

### The rate path, from Treasury's own par curve — and the number that scores this doc

| Tenor | 09-08 | 09-09 (10Y auction) | 09-10 (30Y auction + PPI) | 2-day Δ |
|---|---|---|---|---|
| 2y | 4.39 | 4.43 | **4.56** | **+17bp** |
| 3y | 4.44 | 4.49 | 4.63 | +19bp |
| 5y | 4.57 | 4.61 | 4.75 | +18bp |
| **10y** | 4.80 | **4.83** | **4.95** | **+15bp** |
| 20y | 5.26 | 5.28 | 5.39 | +13bp |
| **30y** | 5.25 | 5.28 | **5.37** | **+12bp** |

**2s30s flattened 5bp** (86 → 81) — a bear-flattening, i.e. the market repricing *policy*, not a
higher long-run inflation path. The 10-year at **4.95%** is its highest since **November 2023**.

**The intraday reaction, which is the measurement that scores the auction rather than the week**
(Yahoo 5-minute bars, `^TNX`, 2026-09-09; 1:00pm ET = 17:00 UTC):

| Clock (ET) | `^TNX` | Note |
|---|---|---|
| 09:35 open | 4.808 | the session went on to close **+2.9bp** from here, all of it before 1pm |
| **12:55 (pre-auction)** | **4.845** | the concession the auction was bid into |
| 13:00 (bid deadline) | 4.833 | −1.2bp |
| **14:00 (post-auction low)** | **4.829** | **−1.6bp — the whole rally the result bought** |
| 16:00 close | **4.837** | **−0.8bp survives to the bell** |

TLT ran 81.629 → 81.790 (**+0.20%**) over the same window and gave half of it back, closing 81.735.
**A 2.710 cover, a 79.18% indirect share and a 1.5bp stop-through were worth 1.6 basis points, and
0.8 of them stuck.** The following session took 12bp back.

### Why the tape ignored it — the decomposition, measured

`^TNX` moved **+10.7bp** on 9/10 (4.837 → 4.944). Where it came from:

| Window | `^TNX` | Δ | What was happening |
|---|---|---|---|
| 9/9 close → 8:25am ET | 4.837 → **4.885** | **+4.8bp** | **overnight, before any US data** — Brent 101.36 → 105.16 |
| 8:30am ET (PPI) | 4.885 → 4.897 | +1.2bp | the print itself |
| 8:30am → 12:55pm | 4.897 → 4.914 | +1.7bp | Brent grinding to ~106.75 |
| **1:00pm (30Y auction)** | 4.914 → **4.922** | **+0.8bp** | the **best-sponsored 30Y of its lineage** — yields *rose* |
| 1:05pm → close | 4.922 → **4.944** | +2.2bp | Brent 107.18 → 108.95 |

**Forty-five percent of the day's move was done before the US inflation print, and the auction
contributed nothing.** The engine, priced: **Brent 97.92 (9/8) → 101.21 (9/9, +3.4%) → 109.19 (9/10,
+7.9%)**, WTI to **104.06** — an **11.5% two-session move** after the US destroyed five Iranian
tankers following ballistic-missile attempts on a US warship, and **Trump said on 9/9 he is "not
looking for a deal with Iran."** That statement closes the **Iran–Oman Hormuz off-ramp** D1 added on
9/8 and D0 could not find an IMO filing for; the switch's ~$85 de-escalation branch never came within
$20 of firing.

**PPI (BLS, released 2026-09-10) split exactly the way D0's "the Fed is priced off energy, not off
core" read said it would:** headline **+0.4% m/m, in line** with the Dow Jones consensus; **5.4% y/y
against 5.3% expected**, on a **+4.2%** energy component; **core +0.2% against +0.3% expected** —
*softer* at the core. September hike odds nonetheless went **58.1% (9/8) → ~68.7%**
(Investing.com Fed Rate Monitor, timestamped **2026-09-10 06:15PM EDT**; ~70% on the Reuters/Globe
and Mail read the same day, 63% on prediction markets). VIX **15.72 → 16.46 → 17.84**.

### What this scores

| Claim | Verdict | On what evidence |
|---|---|---|
| **Leg 3 — the 10Y is the *strong* tenor** | **SUPPORTED**, on the best evidence the doc produced | 79.18% indirect (+6.5pp vs the reopening mean), best cover of 28, 2nd-lowest dealer takedown, ~1.5bp stop-through |
| **Leg 4 — the load-bearing risk is contagion, not a standalone weak 10Y** | **Correct framing, and the risk did not materialise** | the 5Y/7Y/3Y light-indirect run stopped at the belly; the 30Y next day printed 79.48% indirect |
| **Leg 2 — the long-end sell-off is term-premium/fiscal, not Fed** | **Partly REFUTED for this window** | 2s30s *flattened* 5bp on a 15bp selloff and hike odds rose 10.6pp — this leg of the move was a **policy** repricing off energy, not term premium |
| **Leg 5 — a weak print hits high-duration names fastest** | **Same-week read-through stays REFUTED; the acute-shock form survives** | 9/9 split the tier again (**MRVL +4.1%** vs CRWV −4.9% on +3bp); 9/10's +12bp shock moved it as a tier (**CRWV −6.1%, MRVL −3.4%, NVDA −2.4%, AVGO −1.0%**) |
| **Leg 6 — the Fed channel is separate and still live** | **SUPPORTED, and it turned out to be the dominant one** | odds 58.1% → ~68.7% in two sessions with the Fed in blackout — moved entirely by oil |
| **The stance (no new duration, no directional bet)** | **Held; expired unused; cost nothing** | no position was taken at any point, so there is no P&L either way — and the 9/10 session is what the guard existed for |

**Forward test:** [FT-treasury-10y-note-2026-09-09-1](../forward-tests/treasury-10y-note-2026-09-09.md)
**scored PASS** — indirect **79.18% ≥ 68.0%**, clearing by **11.2pp**. Its own honesty clause is
honoured: the base rate it stated up front (**12 of the last 18 reopenings cleared 68.0%**) was
reproduced exactly from the primary this session, so a pass was the two-in-three outcome and the
binary carries little information. **The margin is what carries it** — 79.18% is not a marginal pass
at the threshold but 6.5pp *above* the reopening mean and 4th of 28 in the lineage. Even so, per the
test's own wording, **a pass does not promote leg 3 beyond SUPPORTED**, and no legacy `FT-N` row in
`forward-tests/legacy.md` names this event.

### The finding this event hands forward

**Primary-market demand and the direction of yields decoupled completely, and that is a general
lesson, not a curiosity about one week.** Two coupon auctions with near-record real-money
sponsorship — a 10Y with the best cover of its 28-auction lineage and a 30Y with the lowest dealer
takedown of its own — sat inside the sharpest two-day selloff of the corridor. The mechanism is not
mysterious: **a concession large enough to draw exceptional sponsorship is itself the evidence that
something else is setting the price.** Real money bought 4.83% precisely *because* an energy-driven
inflation repricing had put it there, and the auction has no ability to arbitrate that repricing.

For every downstream rates ledger in this calendar, the amendment is one sentence: **a strong
auction says supply is clearing; it says nothing about the path.** The falsifier is dated and
specific — **a 10Y or 30Y auction before 2026-12-31 that tails ≥2bp with indirects below 65%**
would show demand deterioration is still capable of *leading* the tape, and would restore the
framing this pair of prints removed.

**Honest limits.** The tail (~1.5bp stop-through) is the one figure here that is **not** primary —
`auctions_query` publishes no when-issued yield, so it rests on a secondary auction tracker, as it
has in every row of this doc. Three cited sources were **blocked** this session (cnbc.com 403 ×2,
cnn.com 451) and are recorded in `probe-ref.blocked` rather than silently substituted; nothing
above depends on them. The 9/11 CPI — the event this doc has called the week's load-bearing one
since D21 — had **not printed** when this close-out was written, so the energy-versus-core question
is handed to [`cpi-2026-09-11`](cpi-2026-09-11.md) unresolved, and the 9/16 FOMC to
[`fomc-2026-09-16`](fomc-2026-09-16.md). The intraday decomposition attributes the overnight 4.8bp
to oil on co-movement and timing, not on a causal test; no other dated headline was found in that
window, but co-movement is weaker evidence than a print with a timestamp. This doc goes quiet here.
