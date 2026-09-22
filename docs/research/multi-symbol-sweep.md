# Eight-symbol sweep — the NVDA playbooks meet the rest of the roster

**Date:** 2026-08-12 · **Symbols:** MRVL, CRWV, AMZN, MSFT, GOOG, META, AVGO, AAPL
**Instruments:** [`earnings-cycle.mjs`](../../scripts/research/earnings-cycle.mjs) (SEC 8-K dates,
QQQ benchmark, sector-peer controls) + [`intraday-edges.mjs`](../../scripts/research/intraday-edges.mjs)
(hourly + 5-min, break-even slippage). Every symbol's study was independently red-teamed —
multiple-testing exposure, AI-beta confound, regime splits, date alignment, costs, small-n — and a
red-team kill overrides a researcher "fits." Predecessors: [`nvda-earnings-cycle.md`](nvda-earnings-cycle.md),
[`intraday-volatility.md`](intraday-volatility.md).

## The headline

**Every alpha-shaped claim across all eight symbols failed or wobbled under attack. Both
no-alpha claims survived on all eight.** S2 (never hold the print) and E1 (defer entries past the
open) are universal because they claim no edge — one removes a known-date variance bomb at ~zero
expected cost, the other avoids the day's most expensive microstructure for zero foregone drift.
The sweep's deployable set under current constraints is exactly: **two guard rules everywhere, one
small GOOG long, and a queue of registered zero-size forward-tests.** That hierarchy — risk rules
robust, alpha fragile — is the finding.

## The matrix — does each playbook travel beyond NVDA?

| Playbook | Travels? | Per-symbol verdicts |
|---|---|---|
| **S1** positioning bid (long D-20, flat D-5) | **No — NVDA-only.** | Killed on MRVL, CRWV, AMZN, MSFT, META, AAPL (fails binomial/base-rate/peer controls on each — e.g. AAPL's pre-print window *underperforms* its own base rate, p=0.80). Shape-inverted-but-insignificant on AVGO. Sole partial survivor GOOG needs a different exit (close of D, not D-5). |
| **S2** never hold the print | **Yes — all eight.** | Every print gap is a fat-tailed coin flip (±8–24% single-night tails). Both "the gap actually pays" objections died under attack (AVGO win 57% vs 56% ordinary-overnight base, p=0.567; META's +4.74% mean is t=1.69-fragile with a −24.3% p10 in the one bear era sampled). On META, label it bought insurance. |
| **E1** don't trade the open | **Yes — all eight, and QQQ itself.** | First ~hour carries 28–34% of daily volatility at ~zero drift everywhere — market-wide open-auction microstructure, immune to multiple testing because it claims no alpha. **Caveat:** on GOOG and AAPL the first hour carries most/all of the session's *return* — E1 stays a cost rule for non-urgent entries, never a systematic skip-the-open. |
| **S3** fade the reaction-day open | **Partially — it's a mega-cap software/ads class effect.** | Replicates event-locked on MSFT (59/87 red vs 49.2% base, **p=3.4e-4** — clears the ~0.001 family-corrected bar unaided, red-majority in all four eras, 10/10 red since 2024), GOOG (p=0.0014), META/AMZN (direction only). **Absent** on the semis (MRVL, AVGO) and AAPL. ~1/4 of NVDA's magnitude where it exists. Inert until shorting unblocks. |
| **S4** overnight-only | **No — beats buy-and-hold nowhere at realistic costs.** | The overnight/session split is the documented market-wide overnight anomaly (QQQ shows ~87% itself), not symbol edge. Fails *before* costs on MSFT; outright value-destroying on GOOG and AAPL (AAPL's overnight edge is exactly zero, t=−0.04). Keep only as structure: prefer close-side executions. Lone conditional case: CRWV ex-print-night carry, gated on MOC/MOO + measured slippage < ~13bps/side. |

## What survived — deployment, ranked

1. **S2 everywhere** (all eight + NVDA) — universal risk policy, not a bet. Removes known-date
   ±8–24% single-night tails at ~zero EV cost.
2. **E1 everywhere** — universal execution rule for *non-urgent* entries. On GOOG/AAPL an urgent
   or alpha-driven entry may still take the open; the rule is about not paying the widest spreads
   of the day for free.
3. **GOOG pre-print run-up hold** (long D-20 → **close of D**, still never holding the print) —
   the sweep's only surviving directional long. Pooled 37/43 prints positive, p=0.0008 vs the
   measured 63% base (degrading to 0.003–0.012 under overlapping-window base-rate uncertainty);
   excess and net-of-QQQ positive in all three eras. Deploy **small**: the evidence sits AT the
   corrected significance bar, not past it; size for the pooled −3.39% p10; attribution is partly
   mega-cap earnings-season seasonality, so never stack with other pre-print longs.
4. **Registered zero-size forward-tests** (predictions logged before outcomes): the semi late-week
   bid (MRVL/AVGO — Aug/Sep prints are observation #1), AAPL post-print drift (start at the Oct
   print), CRWV's 2026-08-11 print scoring (windows close ~Aug 19–26), META's stand-aside window
   (~Aug 27). Each carries a pre-stated kill switch.
5. **The blocked queue for Eric, evidence attached:** shorting unlock → mega-cap S3 fade (MSFT
   first, sized to the pooled −0.5%/event, not the possibly-lucky modern −1.13%); MOC/MOO +
   slippage instrumentation → CRWV overnight carry (kill line ~13bps/side realized).

## New playbook candidates (post-red-team status)

- **Mega-cap reaction-day fade** (S3 generalized) — MSFT strongest, GOOG, META/AMZN lean.
  *Deploy small on MSFT when shorting unblocks.* Genuine independent replication (different print
  calendars). Regime-bound: inverts pre-2013.
- **GOOG pre-print run-up hold** — deploy small now (above).
- **Semi late-week bid** (long close D-5 → close D on MRVL/AVGO — the window S1 declares dead
  money is where semis pay) — *shelved*: statistically indistinguishable from the battery's
  expected false positives (MRVL p=0.080, AVGO p=0.161), and on MRVL 8/14 of those windows
  contain NVDA's print, with NVDA-sympathy gaps supplying ~70% of the return — it is substantially
  a conditional NVDA-beat sympathy bet. Forward-test only.
- **Mega-cap post-print digestion vs QQQ** — *shelved as class hypothesis, killed per-symbol*:
  the apparent 4-symbol replication is illusory (windows overlap the same calendar days; QQQ is
  weighted in these very names). Requires a new registered overlap-aware study before any trade.
- **AAPL post-earnings drift** (long close D+1 → close D+11) — *shelved*: positive excess in all
  four eras but sign-only (p=0.0625 at best). Run the kill switch forward ~6 prints on paper.
- **CRWV overnight carry, ex-print nights** — *deploy_small when MOC/MOO lands*, paper-only,
  never represented as an edge over buy-and-hold (superiority is within one standard error);
  kill at ~13.4bps/side realized.

## Kill list — recorded so they are never re-proposed

- **Long-end demand read as price-elastic off a single reopening, and the test written to check
  whether that travels to the next long-duration auction (FT-treasury-30y-bond-2026-09-10-2)** —
  added 2026-09-22 from the
  [treasury-30y-bond-2026-09-10 close-out](events/treasury-30y-bond-2026-09-10.md). The 09-10
  reopening of CUSIP 912810UW6 stopped 2.7bp **through** a 5.335% when-issued at bid-to-cover 2.61,
  indirects 79.33% — the best-demanded 30Y auction of 2026 on every published measure, against a
  founding leg that read three prior tailed long-end auctions as demand deterioration. The test
  chose the nearest confound-free long-duration tenor to check whether that reading generalizes:
  the 2026-09-15 20Y reopening (CUSIP 912810UX4), size fixed at $13.0B two hours before the 09-10
  auction's own close, so no supply surprise was available to it. It printed bid-to-cover **2.57**
  (clears the ≥2.45 half) but a **positive tail of 2.0bp** against a ~5.400% when-issued (TreasuryDirect
  publishes no WI; three independent secondary reports agree on 2.0bp) — the tail half of the kill
  switch alone is enough to kill it, regardless of the cover reading. Indirect participation fell to
  ~52%, well below the 09-10 reading and below this ledger's tracked 2026 range. **What this does and
  does not refute:** the 09-10 auction's own strong print stands as a primary-sourced fact; what dies
  is the claim that its price-elasticity generalizes to the next long-duration reopening five sessions
  later. Do not re-propose "one auction's strong indirect bid signals a durable long-end demand shift"
  without a second confirming instance at a comparably elevated yield level — n=1 killed on its first
  out-of-sample test, same shape as the housing-starts ladder above.

- **A positional nowcast "ladder" derived from a post-hoc subdivision of one archive, falsified on
  its first out-of-sample instance (FT-housing-starts-2026-09-17-1)** — added 2026-09-18 from the
  [housing-starts-2026-09-17 close-out](events/housing-starts-2026-09-17.md). Leg 2 of that
  document's initial research (2026-09-06) subdivided the `housing-starts-2026-10-20` sibling's
  in-quarter/post-quarter GDPNow-contribution split into three positions per nowcast quarter (R1/R2/R3
  at 0.1020/0.0726/0.0250pp, n=48/47/48, monotone, p=0.038 and p<0.0001) and placed the 2026-09-17
  vintage on the louder **R2** rung, predicting \|Δ residential\| ≥ 0.0250pp (the R3 rung's own
  median — registered against the quiet rung, not a flattering one). The actual 2026-09-17 08:30
  vintage moved residential by **0.01737pp** — below the floor, an R2 vintage landing in the R3 band.
  **Why this is a clean kill and not bad luck: the test was written to be falsifiable at exactly this
  bar, and the base rate it was scored against (77.1% of R2-solo vintages clear 0.0250pp) already
  said roughly 1 in 4 would not — this was that one, on the very first live instance.** The two
  controls that motivated the ladder (pooled non-starts and construction-spending vintages both
  "hump" instead of declining monotonically) remain correctly measured; what breaks is the claim that
  *this specific print* would land on the louder rung. **One detail that must travel with the kill:**
  the parent stance — *stand aside, `symbols: []`, no instrument* — was never contingent on the
  ladder and does not change; a killed nowcast-positioning test costs nothing because nothing was
  risked on it. **What is still open:** `housing-starts-2026-10-20`'s own `FT-…-10-20-1` (scoring
  2026-10-23) is the corridor's next live test of whether this is one miss or a pattern — the
  archive it depends on (`GDPTrackingModelDataAndForecasts.xlsx`'s `ContribArchives` sheet) has not
  extended past 2026-07-28 as of this kill, so that scoring session may hit the same staleness this
  one worked around via the workbook's live `Contributions` sheet instead.

- **An execution base rate built entirely under one cap, left unrevised once a later forward test
  in the same document found the mechanism was cover rather than cap identity
  (FT-treasury-buyback-7y10y-2026-09-17-2)** — added 2026-09-18 from the
  [treasury-buyback-7y10y-2026-09-17 close-out](events/treasury-buyback-7y10y-2026-09-17.md). Leg 2
  of that document's initial research (2026-09-08) built its headline finding — "the least-used
  instrument in the entire program" — on nine operations run entirely under the bucket's **old $2B**
  cap: zero full fills, mean accepted $414M, median $210M. `FT-…-2`, registered the same day,
  extrapolated that regularity forward against the **new, doubled $4B** cap sb0607 had just set,
  correctly re-deriving the percentage bound (30% of $4B = $1.2B) but predicting accepted par would
  still land under **$1.066B** (the old-cap era's all-time high). The operation accepted **$2.385B —
  59.6% of cap, 2.24× the prior maximum** — clearing both legs of the kill line by roughly 2x. **The
  base rate was not wrong; it was never re-priced against a mechanism the same document already
  had.** Two days after leg 2, at D-7 (2026-09-10), this document registered `FT-…-3`: fill against
  cap is a step function of **cover** (offered ÷ cap), not of bucket identity, across all 100 nominal
  liquidity-support operations ever run. Once the cap doubled, this bucket's historical dealer-offer
  volume (this operation offered $9.74B — its second-highest ever) produces a **lower** cover against
  the larger denominator, and lower cover was already known, by 09-10, to sit in a much-higher-fill
  band above 1.5x. **Why this is a clean kill and not bad luck: the same document's own later test
  supplies the correct joint prediction.** Priced against `FT-…-2`'s history-only frame, $2.385B is
  an outlier; priced against `FT-…-3`'s cover mechanism (2.435x cover, the 1.5–3x band's own 58.8%
  historical mean fill), the realized 59.6% fill is close to exactly what the mechanism predicts.
  **Do not leave a bucket-level execution bound standing once a later test in the same document
  identifies the real driving variable — re-price the earlier bound jointly, or restate it
  conditionally** (here: *"under $1.2B if cover stays below 1.5x; a materially larger take if the
  doubled cap runs at this bucket's historical offer volumes"* would have described 09-17 exactly).
  **One detail that must travel with the kill:** the parent stance — *read it, do not trade it* —
  was **correct and cost nothing**, and the eligible-list derivation (legs 4–5) and the cap-parity
  correction (leg 3) both held. A killed execution test broke the doc's headline framing
  ("least-used instrument"), not the stance, and not the cover mechanism it also carries — which
  passed its own first live test in this bucket, in direction, on the same print.

- **A base rate read off one regime, when the sibling forward test in the same document predicts
  crossing into the other (FT-treasury-buyback-tips-10y30y-2026-09-15-1)** — added 2026-09-16 from
  the [treasury-buyback-tips-10y30y-2026-09-15 close-out](events/treasury-buyback-tips-10y30y-2026-09-15.md).
  It held that in long TIPS "the cap is decoration and Treasury's bid is the constraint," and
  predicted the 2026-09-15 operation would accept **under $250M** of a $500M cap. It accepted
  **$500M — the full cap**, on **$2,088M** offered: the first cap fill in the label's history and
  the largest par ever offered into a long-TIPS buyback. **The base rate was not wrong; its
  universe was.** The claim rested on the four operations under the current `10Y to 30Y` label
  ($142M/$108M/$110M/$91M, 9.1–14.5% hit rates) with the predecessor `7.5Y to 30Y` history
  **deliberately excluded** as "not the same instrument." Pool all **15** long-TIPS operations since
  2024-04-17 and the excluded half carries the regime the test walked into: **every operation with
  ≥ $1.49B offered filled ≥ 81% of cap (6 of 6, five at 100%); every one with ≤ $1.40B filled ≤ 65%
  (8 of 8)**. Fill tracks **par offered**, not a fixed Treasury reservation posture. **Why this is a
  clean kill rather than bad luck: the same document predicted the crossing.** Its sibling
  FT-…-**2** argued the 110-day gap — the longest in the series — would rebuild offers past **$900M**,
  and it **passed at $2,088M**. Priced marginally the two are consistent (9.1–14.5% of $900M is
  $82–130M); priced jointly against the pooled record they are contradictory, because the cap starts
  binding around $1.4–1.5B. **Do not register an execution base rate from a sub-sample when another
  test in the same document predicts moving the variable that defines the sub-sample** — when two
  forward tests share a mechanism, state the joint region (here: *"$60M–$200M if offers stay under
  ~$1.4B; a cap fill above it"*), which would have described the print exactly. **The tell,
  generalized:** an honest limit that says *"this history is not pooled here"* is a flag on the
  live load-bearing assumption, not a disclaimer to be discharged by writing it down — go and check
  what the excluded data would have predicted before the test is registered. **One detail that must
  travel with the kill:** the parent stance — *read it, do not trade it* — was **correct and cost
  nothing**, and the framing leg strengthened (the 2026 long-end selloff is **88% real yield**, the
  30Y breakeven never left 2.15–2.34%). A killed execution test is not licence to drop the
  operation type from coverage, and the offer-threshold finding it produced is worth more than the
  test would have been had it passed.

- **A published elasticity applied to a realized price where the paper's regressor is an
  *expectation* (FT-umich-sentiment-prelim-2026-09-11-2)** — added 2026-09-15 from the
  [umich-sentiment-prelim-2026-09-11 close-out](events/umich-sentiment-prelim-2026-09-11.md). It
  bounded the September UMich year-ahead inflation expectation at **≤4.2%** (an up-move of ≤0.2pp)
  by multiplying FRBSF Economic Letter **2026-24**'s **+0.24pp per 10pp** coefficient against the
  **realized** in-window pump move of **+2.2% m/m**. The print was **4.6%** — three times the bound,
  and past the row's own **≥4.3%** kill line. **The coefficient was not wrong; the input was.** That
  paper keys to a revision in **expected** gas-price growth, and +0.6pp through it requires a
  **~25pp** expectational revision — which no realized series in the window approaches (EIA Jul
  **$3.932** → Aug **$4.058** → AAA at the 09-07 cut-off **$4.1505** is **+5.6%** cumulative; BLS's
  seasonally-adjusted August gasoline index **+3.9%**) and which the window's *forward-looking* shock
  supplies easily: **Brent +8.7%** (88.58 on 08-25 → 96.28 on 09-04), US strikes across Iran on
  09-01, Iran's 09-07 Hormuz headline, a record Labor Day pump average and a record diesel print.
  **The survey separates the two channels itself, which is why this is a clean kill rather than a
  near miss:** the **Expectations** sub-index fell **−11.1% m/m** against **−1.9%** for **Current
  Economic Conditions**, a 5.8x split, and the director's commentary names year-ahead expectations
  for personal finances and business conditions as what "plunged." A realized-price shock lands on
  current conditions; this one did not touch it. **Do not re-propose a magnitude bound built from a
  realized price when the cited coefficient's regressor is an expectation** — read the paper's
  left- and right-hand variables before sizing anything with it. **The tell, generalized and worth
  more than the rule:** the parent doc's *prose* had been carrying a war for four rows while its
  *arithmetic* carried a pump price. When those two disagree inside one document, the arithmetic is
  the part to re-derive. **One detail that must travel with the kill:** the sibling direction test
  (`-1`, "year-ahead prints above 4.0%") **passed** on the same print, so the transmission mechanism
  is intact and only its sizing died — a kill here is not licence to drop the energy→expectations
  channel from the next UMich ledger.

- **The Gulf shut-in recovery showing up in the IEA's August-month figure
  (FT-iea-omr-2026-09-11-2)** — added 2026-09-15 from the
  [iea-omr-2026-09-11 close-out](events/iea-omr-2026-09-11.md). It predicted the September 2026 OMR
  would put August Middle East production shut in **under 8.3 mb/d**, the July figure, on Goldman's
  2026-08-28 read that Gulf exports had recovered to 15–16 mb/d (~2/3 of pre-war). The September
  edition printed **10.1 mb/d below pre-war** — supply **21.9 mb/d**, down 2.0 m/m — and Gulf exports
  at **~13 mb/d, "nearly half their pre-war level."** Both halves of the thesis died: the shut-in
  widened and the export recovery reversed. **Do not re-propose a Gulf-supply recovery off a
  sell-side export estimate while the US–Iran standoff is unresolved** — the IEA deferred full
  Middle East recovery to 2027 in the same edition, and the EIA's September STEO independently has
  shut-ins *rising* 4.98 → 6.72 mb/d over the same two months. **One detail that must travel with
  the kill:** this does not reinstate the unsourced "~10 mb/d" figure that
  [`opec-plus-meeting-2026-09-06`](events/opec-plus-meeting-2026-09-06.md) carried for **July** —
  July really was 8.3, and the number reached ~10 a month later by escalation.

- **The 10-Year-over-5-Year sector ordering in JGB 1–5y liquidity-enhancement auctions
  (FT-jgb-liquidity-enhancement-1-5y-2026-09-10-1)** — added 2026-09-15 from the
  [jgb-liquidity-enhancement-1-5y-2026-09-10 close-out](events/jgb-liquidity-enhancement-1-5y-2026-09-10.md).
  It predicted 10-Year overweight above 5-Year on the 2026-09-10 page, on a 5-of-5 ¥700bn-era record
  (means 1.28× vs 0.27×); the page printed **10-Year 0.468× against 5-Year 0.500×**. **The ordering
  died, not the arithmetic.** The hypothesis's own defence — that a pairwise ratio is immune to the
  missing-bond error in the shared ¥321.15tn denominator — held exactly: on the uncorrected basis it
  reads 0.464× vs 0.496×, the same way. What killed it is that the whole page moved somewhere else.
  **2-Year No.488 — nine days old, coupon 1.7% — took ¥273.7bn, 39.2% of a ¥697.9bn auction**, so
  the 10-Year and 5-Year were competing for a residual, and their gap is **¥1.9bn**. Do not
  re-propose a sector-pair ordering without conditioning on the front-end take: at a 2-Year
  overweight of 3.75× the remaining four sectors are not being ranked by preference, they are
  splitting what is left. **Two details that must travel with the kill:** the margin is thin enough
  that the 5-of-6 record is still 83%, so this is a kill of the *test as written* (a strict
  inequality with no tolerance band), not a demonstration that the 10-Year is no longer favoured;
  and the sibling `FT-jgb-liquidity-enhancement-1-5y-2026-11-20-1` registered the same observation
  from the other side and scores in its own lane, so it is not killed by this row.

- **`corr(pocket, ≥1% coupon share)` as evidence that JGB menu composition drives reopening demand**
  — added 2026-09-15 from the same close-out, a **self-kill** with no forward-test id: the number was
  published in that ledger's own initial research six days earlier and did not survive its first
  out-of-sample print. Across the five ¥700bn prints the "≥1% coupon pocket" slid monotonically
  **+1.205 → −0.878** and the correlation read **−0.978 (t = −8.04, n = 5)**. 2026-09-10 printed
  **+1.050** — the second-highest of the era, at the same ¥700bn on a menu identical bar the 2-Year
  window — and the same code over the same six menus now gives **−0.492 (t = −1.13, n = 6)**. Do not
  cite a correlation computed on five points as a mechanism, however large the t-statistic; an n = 5
  fit has one degree of freedom to spare and a single reversal spends it. **What survives and must
  travel with the kill:** the *size* refutation is untouched (the decay ran at a constant ¥700bn, so
  "a bigger auction reached deeper into the menu" is still dead), and the composition-contamination
  claim itself **strengthened** — the +1.050 pocket was **43.0pp 2-Year against 21.9pp 20-Year**, a
  statistic built for seasoned pre-2012 super-long paper carried by the newest bond on the menu.
  The ±2sd cover and excess-bid bands from the same n = 5 sample **also both broke on this print**
  (cover 4.418 against a 2.49–4.37 band), which is the same lesson on a second instrument.

- **An end-horizon projection cell as a standalone terminal-policy test
  (FT-ecb-decision-2026-09-10-1)** — added 2026-09-15 from the
  [ecb-decision-2026-09-10 close-out](events/ecb-decision-2026-09-10.md). It predicted the September
  2026 ECB staff round holding **2028 headline HICP at or below 2.0%**; the round printed **2.1%**,
  so the ECB raised its own end-horizon path and the row is killed **by one tenth**. **The framing
  died, not the economics.** A single cell three years out, one tenth wide, cannot carry a
  terminal-rate verdict: the same round states *"Headline inflation is expected to stabilise close
  to 2.0% over the medium term, as the contribution from energy inflation is seen to be close to
  zero"* — 2.1% is a path arriving at target, not a permanent overshoot — and the cell is mechanically
  anchored by a **backwardated** oil strip (Brent assumptions **$89.5 / $78.0 / $73.6**), so it can
  read benign while the near horizon is marked sharply higher. Which is exactly what happened:
  **2027 went to 2.5% from 2.3%** and core to 2.6%, the joint read being "above target through 2027",
  i.e. the argument **for** more tightening. Do not re-propose an end-horizon projection cell alone;
  pair it with the near-horizon cell, as `FT-ecb-decision-2026-09-10-3` did — that sibling was
  registered two days before the print for precisely this confound and **passed**. **One detail that
  cuts both ways and must travel with the kill:** the timing argument attached to FT-3 was wrong on
  the facts (the round's cut-off is **19 August 2026**, 22 days, not the ~8 inferred from the
  March-2026 precedent), so the energy spike sat **outside** the assumptions and the staff marked
  inflation up anyway — the bad premise made the lane's inference too *dovish*, not too hawkish.

- **A channel kill written as an absolute percent move on a high-beta name
  (the ECB "tracked name moves >2% in the 08:15–09:30 ET window" test)** — added 2026-09-15 from the
  same close-out, and this one is a **method** kill with no forward-test id because it never had a
  chance to be informative either way. Re-run `intraday-edges.mjs` gap distributions:
  **|overnight gap| > 2% occurs on 19% of NVDA sessions, 20% AVGO, 32% MRVL and 54% CRWV**, whose
  **median |gap| is 2.19%** — the kill line sat *below* CRWV's median, so "fired" and "did not fire"
  carried almost the same information. On the event day two names crossed the raw line (MRVL
  **-2.88%**, CRWV **-5.33%**) and **none** crossed on attribution: against QQQ's own **-1.22%** gap,
  every beta-adjusted residual landed inside **±1σ** (NVDA +0.54σ, AVGO +0.53σ, MRVL **-0.04σ**,
  CRWV -0.83σ, n=729 / CRWV n=367). Do not re-propose an absolute-percent event-attribution
  threshold; use a **beta-adjusted residual in σ against the bench**. **And do not lay the window
  over another tracked event's release time** — 08:15–09:30 ET contained the **08:30 ET PPI** print
  (`ppi-2026-09-10`), so the window could not have attributed even a real move to the right cause.

- **"A STEO release hour is quieter than an ordinary noon hour" as a citable base rate (FT-47)** —
  added 2026-09-10 from the [eia-steo-2026-09-09 close-out](events/eia-steo-2026-09-09.md). The null
  was built on **n=8 in-sample 2026 release days** (CL=F noon-hour median |move| 0.16% vs 0.27%) and
  **failed on its first out-of-sample observation**: 2026-09-09's 12:00–13:00 ET bar returned
  **−1.005%** against a recomputed **p90 of 0.816%** (n=503) — the **94th percentile**. **The
  publication is not what died; the base rate is.** A ~90%-pass-by-construction null measured
  in-sample on one war-distorted calendar year, with no significance test, cannot support a "the
  release window is a non-event" claim — it had one degree of freedom and spent it. Do not
  re-propose a scheduled-publication release-window null from a single-year in-sample bucket; require
  an out-of-sample holdout and a confound-dated attribution before citing one. **Two details that
  cut both ways and must travel with the kill:** only **1 of 4** instruments breached (BZ=F p86.5,
  USO p80.6, XLE p26.2 all stayed inside), and the move was **fully retraced within two hours** on a
  day that closed **+3.246%** — so "the hour is not reliably quiet" is the honest claim, not "the
  STEO moves crude." The sibling tracked-name nulls in
  [`eia-steo-2026-10-06`](events/eia-steo-2026-10-06.md) and
  [`eia-steo-2026-11-10`](events/eia-steo-2026-11-10.md) are measured on different instruments and
  are **not** killed by this — they inherit the caveat, not the verdict.

- **3Y front-end auction demand fenced by a range-of-n band (FT-20)** — added 2026-09-09 from the
  [treasury-3y-note-2026-09-08 close-out](events/treasury-3y-note-2026-09-08.md). The 2026-09-08 3Y
  covered **2.72** against a `2.54–2.71` band drawn as the observed range of the eight prior 2026
  auctions — **outside by one tick, on the strong side**, at the series' highest stop (**4.474%**,
  +18.3bp through August) on its largest competitive tender. **The mechanism is not what died; the
  fence is.** A range of n draws is broken by a new max or min with probability **2/(n+1) ≈ 22%** at
  n=8, so the test carried a ~22% false-kill rate before any economics — and against the 29-auction
  constant-size era (mean 2.608, σ 0.098, range 2.43–2.85) the print is a routine **+1.1σ**. Do not
  re-propose a demand test fenced by an observed range; use a dispersion interval on the full
  constant-size sample, as `FT-treasury-3y-note-2026-10-06-1` already does — it was registered
  2026-09-05, three days before the kill landed, having written down that FT-20's band *"holds in
  only 19 of 29 (66%)."* **And do not re-propose bid-to-cover alone as the demand read:** this print
  covered at a series high while **indirect fell to 62.1%** (below its 63.3% mean) and the
  stop-through decayed to **−0.1bp**, so the cover and the foreign bid moved in opposite directions
  — a composition change no cover band of any width can see.

- **A revision-direction test built on revision guidance quoted from an earlier vintage of the same
  bulletin (FT-uk-labour-market-2026-09-15-2)** — added 2026-09-16 from the
  [uk-labour-market-2026-09-15 close-out](events/uk-labour-market-2026-09-15.md). It predicted the
  September ONS bulletin would restate July payrolled employees **better than −94,000**, on the
  August bulletin's own statement that early-tax-year months *"have received larger-than-average
  upward revisions in recent years."* July was restated **−101,000**, and the September bulletin now
  says the opposite in its own words: *"Revisions in recent months have tended to be made downwards,
  as shown in our LFS quality update: January 2026 article."* **The series was not misread; its
  guidance had changed under the test.** A statistical agency's revision-bias language is itself a
  revised quantity, republished monthly, and a one-print directional bet on it is a bet on last
  month's methodology note. Do not re-propose a revision-direction test without re-reading the
  publisher's *current* revisions section in the same pass that registers it — and prefer a
  threshold on the underlying level, which does not decay. **One detail that must travel with the
  kill:** it killed toward *more* contraction (August provisional **−145,000** y/y), so the loose
  -labour-market read it was attached to is strengthened, not damaged — a kill here is not licence
  to soften the payroll story in the next UK ledger.

- **A one-print test on administrative wording, registered off an intent letter
  (FT-uk-labour-market-2026-09-15-3)** — added 2026-09-16 from the same close-out. It predicted the
  September bulletin would drop *"in development"* from its LFS-derived outputs, on ONS's
  **11 August 2026** letter to OSR stating *"LFS and APS derived outputs that are currently official
  statistics in development will move to official statistics."* The September release repeats that
  sentence **verbatim and still in the future tense** — the same construction the 18 August bulletin
  carried a week after the letter. A stated-intent letter is not a publication schedule, and the lag
  from announcement to flagship-release wording has no published date to key on. Do not re-propose a
  designation/paperwork change as a single-print test; register it as a standing watch item on the
  series instead, scored whenever the phrasing moves. **The detail that must travel with the kill:**
  the substantive read was never at stake — the publisher has stopped defending the LFS series and
  says so in the same bulletin (*"The ONS will not be seeking reaccreditation"*) — so this kills the
  **timing** claim only, and the instruction to prefer accredited PAYE RTI over the LFS unemployment
  rate stands untouched.

- **A single-print earnings-gap-sign bet conditioned on a fundamental regime classification, on a
  session sharing its close with FOMC and its next open with a macro print
  (FT-lennar-q3-fy2026-2026-09-16-1)** — added 2026-09-18 from the
  [lennar-q3-fy2026-2026-09-16 close-out](events/lennar-q3-fy2026-2026-09-16.md). It predicted that if
  Lennar's Q3 release left its margin-compression regime intact (gross margin ≤16.0% or incentives
  ≥12.9%), the 2026-09-17 open gap would be **negative** — the direction LEN's own modern-era record
  (3-up-in-14, p=0.029) implied for a name still compressing. Gross margin printed **15.8%** (regime
  intact by that clause) and the gap printed **+3.37%** — positive, the single largest modern-era move
  on record for this name in either direction, and the kill condition named verbatim in the test's own
  text. **The regime classification was not wrong on its own terms and it still lost, because the gap's
  actual driver was mostly upstream of it:** LEN's earnings landed after FOMC's same-day close and
  before `housing-starts-2026-09-17`'s 08:30 print, and every peer plus the broad tape gapped the same
  direction the same morning (DHI +2.34%, PHM +1.60%, TOL +2.53%, ITB +1.71%, QQQ +1.59%, SPY +1.21%)
  — a sector/market-wide move LEN's own gap (+3.37%) merely exceeded rather than caused alone. **Do not
  condition a single-name gap-sign bet on that name's fundamentals alone when the release shares its
  reaction window with a confirmed high-impact macro corridor** — a fundamentals-only regime read has
  no term for the beta the session is soaked in, and this calendar already tracks exactly which
  sessions carry that risk (the adjacency sweep's own corridor table). Score the fundamentals against a
  peer- or index-adjusted gap next time, not the raw one. **One detail that must travel with the kill:**
  the sibling test on the same print (`FT-lennar-q3-fy2026-2026-09-16-2`, overnight repricing dominates
  the reaction day) **passed** — the *shape* of LEN's reaction (front-loaded into the gap, not the
  session) held even though the *sign* prediction did not, so this kill is about conditioning a
  direction call on fundamentals inside a confounded window, not about the overnight-vs-intraday
  finding itself.

- **NVDA earnings-gap hold (anti-S2)** — added 2026-08-15 ([`nvda-aug-2026-print.md`](nvda-aug-2026-print.md)):
  win 9/14 vs the 60% ordinary-overnight base (p=0.486 — indistinguishable from any overnight);
  the +5.35% mean is carried entirely by four 2023-24 gaps (ex-top-4 +1.72%) against a pooled
  −5.49% p10; 3 of the last 5 prints gapped down. Third member of the 0-for-3 hold-the-print
  family (AVGO, META, NVDA) — any future "the gap pays on X" must clear a win-rate test vs the
  ordinary-overnight base *before* citing a mean. Do not re-propose without ≥3 new prints showing
  a repriced gap regime.
- **S1 beyond NVDA** (six symbols killed outright; see matrix).
- **MRVL "session drag"** — the load-bearing session mean is t=−0.28, pure noise.
- **CRWV directional gap read** ("gaps are always down") — windowing artifact; the excluded
  2025-05-14 print gapped green, and the newest print's reaction was positive.
- **AVGO hold-the-print** (anti-S2) — win rate indistinguishable from an ordinary overnight
  (p=0.567), mean one-print-carried, and the latest print gapped −14.66%.
- **AVGO late-week bid** (long close D-5 → close D; FT-2) — added 2026-09-03 from the
  [avgo-2026-09-02-print close-out](events/avgo-2026-09-02-print.md). The 2026-09-02 print's window
  returned **+3.28%** and cleared its base rate on paper (+3.58pp vs QQQ, +2.57pp vs the +0.71%
  non-earnings 5-day baseline) — but **NVDA printed at the window's own open (2026-08-26 AMC)** and
  the single 08-27 sympathy session returned **+4.49%**, i.e. **137% of the whole window**; ex that
  session the window is **−1.16%**. The pre-registered sympathy clause fires, harder than the ~70%
  that gutted the MRVL original. Do not re-propose without a D-5→D window carrying **no peer print
  inside it** — which, on this calendar's AI-semis cadence, means checking NVDA/MRVL dates first.
- **META gap-capture** (hold the print, sell D+1 open) — no significance at any cut; contradicts
  S2 with evidence far too weak to license the exception.
- **AAPL late run-up** — vanishes net-of-QQQ (t≤0.6); a QQQ bet in an AAPL costume.
- **MSFT D-10 run-up** — modern era net-of-QQQ is a literal coin flip (7/14); edge decays
  monotonically to nothing (win 76%→57%→58%→50% by era).
- **S4 daily round-trip on AMZN/MSFT/GOOG/META/AAPL** — dominated by buy-and-hold at every cost
  level tested, including 2bps/side.
- **S3 on MRVL** — absent, not inverted (corrected +0.45%/50% vs an ordinary session's +0.01%/51%).

## Portfolio-level critique — what no single-symbol view sees

1. **Multiple testing.** ~40–70 statistical looks across eight tickers; the family-corrected bar
   is ~0.001. What clears it: MSFT S3 (p=3.4e-4, and pre-registered from NVDA, which blunts the
   penalty) and GOOG S3 (p=0.0014, at the line). GOOG's run-up sits at the bar. Everything else is
   indistinguishable from the battery's expected false positives.
2. **Eight slots, one trade.** Peers rally over each other's pre-print windows in *every* study;
   QQQ itself ran +3.7% over GOOG's windows. Running multiple S1-family longs is one leveraged
   AI-beta bet, not diversification.
3. **Regime concentration.** Every intraday number rests on one 2023–26 bull regime; the n=14
   modern earnings cells vanish or invert in 2020–22 on symbol after symbol.
4. **Decay.** Wherever per-event sequences were inspected, edges decay monotonically toward zero
   (CRWV's fade −11.4→−3.6; MSFT's D-10 run-up by era). Pooled means overstate forward
   expectation, sometimes ~2×. Size to the most recent era, not the pool.
5. **Pipeline integrity (instrument debt, must fix before the next sweep).** Two of eight event
   lists were corrupted: MRVL's quarter-dedup kept a pre-market 8-K and an investor-day filing
   while dropping two real prints; CRWV's newest print was filed **midday**, breaking the
   after-close reaction template silently. Separately, the forward-window guard excludes the
   newest print on five of eight tickers — blinding each study to its freshest out-of-sample
   point. The red teams caught all three; the instrument did not.

## Time-sensitive (as of 2026-08-12)

- **CRWV printed yesterday** (8-K filed midday 2026-08-11 — not in the study's n=4). Today is the
  D+1 window where all four *prior* prints were ugly — but the first post-print hours ran green
  (+2.42%), already against the shelved bleed hypothesis. **Do nothing; score the free
  out-of-sample experiment** when the D+6/D+11 windows close (~Aug 19 / ~Aug 26).
- **MRVL** — print est. **2026-08-27** (cadence estimate; confirm vs IR). Today is ~D-11. The
  shelved late-week window opens ~Aug 20: log it as forward-test observation #1, zero size. Any
  MRVL position flat by the Aug-26 close per S2.
- **AVGO** — print est. **2026-09-03**, honest window Aug 27–Sep 10 (83–98-day cadence spread —
  an estimated D-5 entry could land *after* the real print; confirm the date this week). S2
  applies with feeling: the last AVGO print gapped −14.66%.
- **NVDA** — print est. ~Aug 26 (unconfirmed). The peer evidence says part of NVDA's celebrated
  run-up is sector seasonality: keep existing paper size, do **not** scale up on the cross-ticker
  "confirmation," flat by D-1 per S2.
- **AAPL / META** — post-print windows from the late-July prints close ~Aug 14 / ~Aug 27; no
  action, log outcomes as forward-test data.

## Honest limits

Same as the parent studies, sharpened: n=14 modern-era cells everywhere (n=4 on CRWV — anecdote,
not evidence); one intraday regime; SEC filing dates stand in for announcement times (and midday
filings break the template, per the pipeline finding); estimated print dates are estimates. The
red-team layer caught two corrupted event lists and several researcher overstatements — treat any
number in this doc that lacks a control clause with suspicion, and prefer the per-symbol journals
for the full attack transcripts.
