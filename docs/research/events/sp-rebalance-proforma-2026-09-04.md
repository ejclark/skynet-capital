# S&P DJI September quarterly rebalance — pro-forma files released — sp-rebalance-proforma-2026-09-04

**Kind:** sector · **Date:** 2026-09-04 (estimate, NEWS: spglobal.com S&P Equity Indices Policies & Practices methodology — float-adjusted pro-forma files release after the close on the first Friday, two weeks before the third-Friday effective date; checked 2026-09-01, re-checked 2026-09-04) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","adp-employment-2026-09-02","beige-book-2026-09-02","challenger-job-cuts-2026-09-03","eia-steo-2026-09-09","fed-waller-outlook-2026-09-03","fomc-blackout-start-2026-09-05","hammack-remarks-2026-09-03","ism-manufacturing-2026-09-01","ism-services-2026-09-03","jobs-2026-09-04","jolts-2026-09-01","opec-plus-meeting-2026-09-06","treasury-10y-note-2026-09-09","treasury-3y-note-2026-09-08","treasury-buyback-increase-2026-09-09","treasury-coupon-announcement-2026-09-03","vmware-explore-2026-08-31","waller-economic-outlook-2026-09-03"],"screenStreak":0} -->

## At a glance

**TL;DR.** After tonight's close S&P Dow Jones Indices drops the float-adjusted pro-forma files for the **2026-09-18** quarterly rebalance, and on 2026's own two-for-two precedent (announced **Fri 2026-03-06** and **Fri 2026-06-05**, both first Fridays) it publishes the S&P 500 add/drop press release the same evening. The date carries this calendar's `estimate` label only because no dated S&P DJI announcement page was fetched — the methodology rule plus two observed precedents make it about as predictable as an unconfirmed date gets, and nothing here is date-keyed action regardless. **The call is stand aside on every horizon, and the reason is measured, not cautious:** the folklore play — buy the announced addition — is one of the best-documented dead edges in equities. Greenwood & Sammon's *The Disappearing Index Effect* puts the S&P 500 inclusion abnormal return at 7.4% in the 1990s, 5.2% in 2000–09, and **~1.0% in 2010–2020, statistically indistinguishable from zero**; deletions ~0.1%. Two more facts kill the "big night" framing: roughly **90% of quarterly rebalance turnover is share/float housekeeping**, not adds and drops (S&P DJI's own Indexology), and a quarter can pass with **no S&P 500 constituent change at all**. The one thing worth carrying forward is a **number, not a name** — the file is the earliest dated read on how large the 09-18 market-on-close imbalance will be, which is exactly the input [`opex-2026-09-18`](opex-2026-09-18.md) named as a kill switch for its "the close is the bigger distortion window" leg. Size color is press-grade only: a rebalance typically touches ~0.8% of index market cap, and September 2025 was the busiest in four years at ~$250B (Piper Sandler). Today's tape is a payrolls tape (**+162k** vs ~53k consensus, U3 4.1%), not a rebalance tape.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D0) | Stand aside | High | Files land *after* tonight's close, the announced-addition edge is measured dead, and the session belongs to the 08:30 payrolls beat and the 09-05 blackout — not to an index-file drop. | An announced S&P 500 addition from tonight's **2026-09-04** release closing **2026-09-18** more than **+3%** vs SPY off the 09-04 close — the 1990s-style inclusion premium this call says is gone |
| This week | Stand aside | High | Nothing between tonight's file and the **2026-09-08** share/IWF freeze is tradeable; the pro-forma tells you flow size, and flow size is not direction. | Any announced addition up **>3%** vs SPY between the 09-04 and **2026-09-11** closes, which would reopen the announcement-drift trade |
| This month | Watch the number, not the names | Medium | The 09-04 file is the first dated read on the size of the **2026-09-18** closing auction — the one input `opex-2026-09-18`'s leg 4 rests on. A light quarter shrinks that guard; a ~$250B-style quarter keeps it. | **2026-09-18** printing closing-auction volume at or near an ordinary Friday's, which would mean the stacked-MOC caution was overbuilt |
| This quarter | Stand aside | Medium | The December cycle (pro-forma ~**2026-12-04**, effective at the **2026-12-18** close) stacks the rebalance on year-end witching and tax-loss flow, but nothing about it is actionable three months out. | An S&P DJI methodology update published before **2026-12-04** moving the pro-forma or effective convention off the first-Friday / third-Friday pair |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` (`NEWS:`) — it may widen caution about the 09-18 close; it licenses no date-keyed action.
- **Never trade the announced addition.** Measured inclusion effect 2010–2020 ≈ **1.0%**, indistinguishable from zero; deletions ≈ 0.1%.
- ~**90%** of quarterly turnover is share/float updates, not adds/drops — the headline names are the small half of the flow.
- Size figures are press/vendor grade, never house stats: ~**0.8%** of index cap typical; Sep-2025 ~**$250B**, tech the only net-buy sector (~$40B).
- The "**$27 trillion** in motion" press line (2026-08-31) is **not adopted** — it reads as indexed-plus-benchmarked assets, not the rebalance trade.
- A quarter with **zero** S&P 500 constituent changes is a normal outcome — absence of names is not absence of a rebalance.
- Dated watch list: freeze after the **2026-09-08** close · capped/alt-weighted pro-forma **2026-09-11** (proposed `estimate`, this PR) · effective at the **2026-09-18** close, the same auction as the triple witching.

## Initial research

**The question.** What exactly is released on 2026-09-04, is that date right, and does anything about the release — the file, the constituent announcement, or the flow it forecasts — support a play, or does it only inform the 2026-09-18 closing auction already tracked by the opex ledger?

**One-line verdict:** the date is right on a methodology rule plus two 2026 precedents, the release is real and observable, and it supports **nothing directional** — the announced-addition trade is measured dead, most of the flow is housekeeping, and the only durable output is a size read that feeds `opex-2026-09-18`'s leg-4 kill switch.

**Method.** Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no symbol-keyed instrument applies (`symbols: []`), and `scripts/research/` carries no index-flow instrument. Sourced web research: S&P DJI's *Equity Indices Policies & Practices* methodology for the pro-forma and freeze schedule, S&P DJI's own press-release archive and Indexology blog for observed precedent and turnover decomposition, the Greenwood & Sammon NBER/HBS working paper for the index effect, CME OpenMarkets and Piper Sandler press citations for scale, and dated same-week press for the adjacency sweep. Cross-read against [`opex-2026-09-18`](opex-2026-09-18.md) (which proposed this entry on 2026-09-01), `docs/plans/trade-playbooks.md` and [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for playbook fit.

### Conviction legs, tested

1. **The 2026-09-04 date is right — SUPPORTED (rule + two precedents).** S&P DJI's *Equity Indices Policies & Practices* (March 2026 version) states that pro-forma files for **float-adjusted market-cap-weighted** indices are released after the market close on the **first Friday, two weeks prior** to the rebalancing effective date, and for **capped and alternatively weighted** indices after the close on the **second Friday, one week prior**. September 2026's third Friday is 09-18, so first Friday = **09-04** and second Friday = **09-11**. Precedent agrees twice this year: the March 2026 changes were announced Friday **2026-03-06** (24/7 Wall St., "S&P 500 Rebalancing Tonight", dated 03-06) and the June 2026 changes Friday **2026-06-05** (S&P DJI press release 1483743 — Marvell Technology and Flex in, Pool Corp. and The Campbell's Company out, effective prior to the open Monday **2026-06-22**). Both are first Fridays two weeks ahead of a third-Friday effective date.

2. **09-04 is both the client file drop and the public constituent announcement — SUPPORTED, and one live claim rejected.** The pro-forma files themselves go to S&P DJI *clients*; what a non-client observes is the press release. On June's precedent those are the same evening. A search-surfaced claim that the September add/drop announcement is "expected around September 11" was **read and rejected** — it traces to an aggregator's estimate page, not a source, and it contradicts both the March and June 2026 dated precedents and a dated 2026-08-31 press piece reporting that the index "is scheduled to announce additions and removals on Friday." Recorded rather than silently dropped, because it is exactly the aggregator-vs-primary trap this calendar was seeded to avoid.

3. **The tradeable folklore — buy the announced addition — is REFUTED.** Greenwood & Sammon, *The Disappearing Index Effect* (NBER w30748 / HBS WP 23-025; published 2024), measure S&P 500 additions 1980–2020: average price impact around inclusion **3.4%** in the 1980s → **7.4%** in the 1990s → **5.2%** in 2000–09 → **~1.0%** in 2010–2020, statistically indistinguishable from zero. Deletions show the mirror decay, ~**0.1%** in 2010–2020. Their explanation matters as much as the number: as index funds grew, the mispricing became an opportunity, and the market adjusted — better anticipation of inclusions, and other institutions standing ready to sell to indexers on the day. This is not a caution; it is a measured null, and it is the single most load-bearing finding in this document.

4. **Most of the flow is housekeeping, not names — SUPPORTED (S&P DJI's own blog).** Indexology's "What Drives S&P 500 Rebalance Turnover?" reports that **company-specific updates account for ~90%** of quarterly rebalance turnover — share counts and investable-weight-factor (float) changes, live since the index went free-float-adjusted in 2004–05 — with constituent changes the remainder. So the press-release names are the *small* half of what index funds actually trade into the 09-18 close, and a headline-free quarter can still carry a heavy auction.

5. **A quarter can pass with no S&P 500 constituent change — SUPPORTED.** S&P DJI's own Indexology has published on exactly this ("Quarterly Changes May Not Be Constant", 2025-06-23). Additions are discretionary against eligibility criteria (press-reported hurdle ~**$22.7B** market cap, ≥250k monthly share volume over six months, US primary listing, positive trailing earnings), and — a correction worth making explicitly — falling *below* the market-cap hurdle does **not** mechanically remove an existing member. So the 2026-08-31 press line that "36 companies appear to qualify for entry, while more than 110 existing members no longer meet the market-cap hurdle" describes an eligibility pool, **not** a forecast of 110 removals.

6. **Scale is real but press-grade — MIXED.** A typical S&P 500 rebalance touches ~**0.8%** of index market cap; September 2025 was the busiest quarterly rebalance in four years at nearly **$250B** of stock, with Piper Sandler putting technology as the only net-buy sector at ~**$40B**. These are directional scale, not primary data, and no house instrument measures index-rebalance flow. The much larger "**nearly $27 trillion** in index-tracking vehicles" figure (2026-08-31 press) is **not adopted here**: it reads as total assets indexed *and* benchmarked to the S&P 500, not the size of the rebalance trade, and quoting it as the latter would be a false statement about a market. Recorded as press color with the conflation named.

7. **The only durable output is an input to the 09-18 witching read — SUPPORTED.** [`opex-2026-09-18`](opex-2026-09-18.md) leg 4 argues the witching *close* is a materially bigger imbalance window than a monthly opex close, because the S&P quarterly rebalance market-on-close stacks with expiring single-stock hedges — and that ledger's own kill switch reads: *"The S&P DJI pro-forma files (est. 2026-09-04) show an unusually small index turnover for this quarter … Read the pro-forma, do not assume the average quarter."* That is precisely what tonight's file answers, and it is the reason this low-impact event is on the calendar at all. The sequence to hold in mind: FMC pro-forma **09-04** → share/IWF freeze after the **09-08** close → capped/alt-weighted pro-forma **09-11** → effective at the **09-18** close (prior to the **09-21** open), inside the same auction as the triple witching.

8. **No house playbook fits, and none is index-flow-keyed — SUPPORTED.** S1/G1 are earnings-dated pre-print run-ups, S2 is the never-hold-the-print guard, S3 an earnings reaction-day fade (blocked on shorting), S4 an overnight-vs-buy-and-hold structural note, E1 a don't-trade-the-open execution rule. None references index membership or rebalance flow, and the sweep's kill list carries no rebalance hypothesis to re-check. The only contact point is **E1/S4 execution hygiene**: on 09-18 both the open (index SET) and the close (single-stock options + this rebalance) are distorted prints, which is a timing guard already recorded in the opex ledger, not a new signal.

9. **Adjacency — today is a payrolls day, and the rebalance is nowhere in it — SUPPORTED.** August nonfarm payrolls printed **+162,000** against a ~53–55k consensus (BLS, released 08:30 ET 2026-09-04), the strongest month since March; unemployment held at **4.1%**, average hourly earnings **+0.3%** to $37.75, and June/July were revised **up** by 11k and 44k. The tape read it "good news is bad news": S&P 500 **7,708.89 (−0.50%)**, Dow 53,325.23 (−0.67%), Nasdaq 26,467.18 (−0.44%) at midday, VIX **13.95 (−2.58%)** — a *lower* VIX on a red equity tape, which is itself the calm-into-the-corridor configuration the opex ledger has been flagging. September hike odds moved to **~59%** post-release (from ~52% same-source pre-release); note this does **not** reconcile cleanly with the ~66% CME FedWatch reading the opex ledger banked on 08-31 — different vendors and different timestamps, recorded side by side rather than averaged into a number neither source published.

**What the conditions support.** Nothing to buy or sell. The support is (a) a **refusal** — no announcement-night addition trade, on measured evidence rather than caution — and (b) one **observation to collect**: the size of the rebalance trade heading into 09-18, which either sustains or shrinks the opex ledger's stacked-MOC guard. Paper-only and educational throughout.

**Honest limits.** The methodology PDF returned **HTTP 403** on a direct fetch on 2026-09-04, so its pro-forma and freeze language was read from the search-indexed text of the March 2026 version rather than the document itself — which is why the calendar date stays `estimate` and not `confirmed`. There is also a **vocabulary gap**: `market-events-data.ts`'s confirmed-source prefixes (`IR:`/`CAL:`/`BLS:`/`FED:`/`PJM:`/`SEC:`/`TSY:`/`OCC:`/`BEA:`/`CENSUS:`/`ISM:`/`CB:`) contain nothing covering an index provider, so even a clean S&P DJI announcement-page fetch could not promote this entry today without adding a prefix — noted for Eric/the calendar owner, **not** self-authorized here. The 09-04 file and press release land *after tonight's close*, i.e. after this session ends, so **no constituent names are quoted** and none are guessed. Turnover and dollar figures are vendor/press aggregates; this repo has no index-flow instrument and no house prior for a rebalance. Every trading-adjacent statement above carries the `estimate` label.

## Stance & kill switches

**Stance (date `estimate`, `NEWS:`-sourced).** Treat 2026-09-04 as a **known-mechanism, low-impact market-structure release**, not a tradeable event. The pro-forma drop and — on two 2026 precedents — the accompanying S&P 500 add/drop announcement land after tonight's close. **No position, paper or otherwise, is licensed by any name in that release**: the inclusion effect is measured at ~1.0% for 2010–2020 and statistically indistinguishable from zero, and ~90% of the quarter's turnover is share/float housekeeping that carries no name at all. The single output worth carrying forward is the **size** of the resulting 2026-09-18 market-on-close imbalance, which is a live kill switch in [`opex-2026-09-18`](opex-2026-09-18.md) and should be read from the file rather than assumed to be an average quarter. Execution hygiene on 09-18 (both the open and the close are distorted prints) is inherited from that ledger unchanged.

**Kill switches:**

- **An announced addition from the 2026-09-04 release runs more than +3% vs SPY into the 2026-09-18 effective close** — the disappearing-index-effect leg (leg 3) would not hold for this cycle, and the refusal at the top of this doc would need re-arguing from data rather than from the 2010–2020 sample. Registered as `FT-sp-rebalance-proforma-2026-09-04-1`.
- **The 09-04 file shows an unusually light quarter** (turnover materially under the ~0.8%-of-index-cap norm) — shrinks `opex-2026-09-18`'s leg 4 toward an ordinary-monthly-opex close and should be written into that ledger, not just this one.
- **No S&P 500 constituent change is announced on 2026-09-04** — voids the forward test (no name to measure) and confirms leg 5; the size read still stands on the share/float half.
- **The announcement does not land on 2026-09-04** (e.g. it appears on 09-11 as one aggregator estimate claimed) — the first-Friday rule inferred from two precedents is weaker than this doc treats it, and the December entry should not be dated off it.
- **A `SPDJI:`-class confirmed prefix is added to `market-events-data.ts`** — this entry and its 09-11 sibling become promotable from `estimate` on a primary S&P DJI page fetch; until then both stay `estimate` by construction, not by doubt.

**Registered forward test.** `FT-sp-rebalance-proforma-2026-09-04-1` — see [`forward-tests.md`](../forward-tests.md). One observation, never a template; a pass corroborates a published 40-year study, it does not promote anything.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-04 | D0 | Initial research banked. **Date/mechanism:** S&P DJI *Equity Indices Policies & Practices* (March 2026) — FMC-weighted pro-formas after the close on the **first Friday, two weeks prior**; capped/alt-weighted on the **second Friday, one week prior**; share/IWF freeze from after the close on the **Tuesday before the second Friday**. Direct PDF fetch **403'd** today; rule read from search-indexed text, so the entry stays `estimate`. Precedent 2-for-2 in 2026: announced **03-06** (Fri) and **06-05** (Fri, S&P DJI PR 1483743 — MRVL + FLEX in, POOL + CPB out, effective prior to the **06-22** open). An aggregator-derived "announcement expected ~09-11" claim was **read and rejected** against both. **The central finding:** Greenwood & Sammon (*The Disappearing Index Effect*, NBER w30748 / HBS 23-025) measure inclusion impact 3.4% (80s) → 7.4% (90s) → 5.2% (00s) → **~1.0% (2010–2020), indistinguishable from zero**; deletions ~0.1% — the announced-addition trade is a measured null, not a caution. Reinforced by S&P DJI's own Indexology: ~**90%** of quarterly turnover is share/float housekeeping, and a quarter can carry **no** constituent change at all. Scale, press-grade only: ~0.8% of index cap typical, Sep-2025 ~$250B (Piper Sandler, busiest in four years, tech the only net-buy sector ~$40B); the "$27T in motion" line is **not adopted** (indexed-plus-benchmarked assets, not the rebalance trade). **Adjacency sweep — peers:** none; `symbols: []`, no tracked-name earnings inside the window (AVGO printed 09-02; next cluster Oct 27–29). **Macro:** August payrolls **+162k** vs ~53k consensus (BLS 08:30 ET today), U3 **4.1%**, AHE +0.3%, June +11k / July +44k revised up — hike odds ~52% → **~59%** post-print (unreconciled with the ~66% CME FedWatch reading `opex-2026-09-18` banked 08-31; both recorded, neither averaged). FOMC blackout starts **09-05**. **Volatility regime:** VIX **13.95** (−2.58%) midday today off a **14.32** 09-03 close (arithmetically self-consistent: 13.95 + 0.37 = 14.32; a sibling ledger banked **14.10** for a different intraday stamp today — recorded, not reconciled), with SPX **7,708.89** (−0.50%), Dow 53,325.23, Nasdaq 26,467.18 — vol *falling* on a red tape, the same calm-into-the-corridor configuration the opex ledger has flagged since 08-29. **Geopolitical:** OPEC+ meets **09-06**; no channel touching index-rebalance mechanics. **Event tape:** the 09-04 file and press release land after tonight's close, so **no constituent names are quoted or guessed**. **New dated adjacency — one proposed to `market-events.ts` as `estimate` in this PR:** `sp-rebalance-proforma-capped-2026-09-11` (kind sector, low) — the capped/alternatively-weighted half of the same pro-forma pair, the final dated read on the 09-18 MOC before it prints, landing on the same day as CPI and UMich prelim. The **09-08 freeze** is dated but deliberately **not** filed: it is a data cut-off with no observable publication. Forward test **`FT-sp-rebalance-proforma-2026-09-04-1`** registered. | — (stance set: stand aside on all four horizons; the refusal is measured, and the only output is a size read for `opex-2026-09-18`) | Close-out by **2026-09-10** — the event passes today, so the scanner flips it to `event-passed-unscored` (low band would be every 7d; `closeOutWithinDays` is 6) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from memory — after which this doc goes quiet.

## Outcome

**Close-out (2026-09-05, ~00:40 UTC = 2026-09-04 ~20:40 ET), roughly 85 minutes after the release
this doc was written to anticipate.** Sector mode runs no `earnings-cycle` / `intraday-edges`
instrument — `symbols: []` by design — so the **release** is scored from the freshly-fetched press
text and the **tape** from Yahoo daily bars pulled this session after the mandated cache bust
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`), never from memory.
Market caps and share counts are stockanalysis.com vendor readings stamped to the 2026-09-04 16:00
ET close. The date stays `estimate` — nothing here promotes it, because the confirming artefact is
still an S&P DJI page this lane cannot fetch and there is still no index-provider source prefix.

### What actually landed

**The release hit at 19:15 ET on 2026-09-04, the exact evening this doc predicted.** Primary text:
*"Bloom Energy, Illumina, and Everpure Set to Join S&P 500; Others to Join S&P 100, S&P MidCap 400,
and S&P SmallCap 600"* (PRNewswire 302870517, dateline **Sep 04, 2026, 19:15 ET**), read through two
independent renderings that agree line-for-line. Changes are **"effective prior to the open of
trading on Monday, September 21, 2026, to coincide with the quarterly rebalance"** — i.e. executed
in the **2026-09-18** closing auction, exactly the session `opex-2026-09-18` tracks.

| S&P 500 | Company | Ticker | Sector | Mkt cap | 09-04 close | Day | After hours |
|---|---|---|---|---|---|---|---|
| **Add** | Bloom Energy | BE | Industrials | **$74.48B** | $252.87 | **+7.35%** | **+7.5%** |
| **Add** | Everpure | P | Info Tech | $33.08B | $99.51 | +1.39% | +2.2% |
| **Add** | Illumina | ILMN | Health Care | $32.95B | $218.22 | −1.55% | +2.0% |
| **Drop** | Molson Coors | TAP | Cons. Staples | $7.55B | $40.50 | −0.17% | −1.8% (see note) |
| **Drop** | The Trade Desk | TTD | Comm. Svcs | $6.78B | $14.43 | −4.37% | — |
| **Drop** | Builders FirstSource | BLDR | Industrials | $7.08B | $65.79 | +2.51% | — |

All three deletions drop **two tiers to the S&P SmallCap 600**, not to the MidCap 400. ILMN and P
are promoted **out of** the MidCap 400. After-hours figures are press (Yahoo/Bloomberg wire, 17:10
CDT); **TAP is unreconciled** — the wire reads −1.8%, stockanalysis reads **+0.07% to $40.53** at a
later stamp. Both recorded, neither averaged.

### Scoring the stance — the mechanism calls were right, the refusal is not yet decidable, and the test built to decide it is broken

- **Leg 1 (the 09-04 date) — CONFIRMED.** The first-Friday-two-weeks-prior rule, inferred from a
  403'd methodology PDF plus two 2026 precedents, produced the right evening on its first live test.
- **Leg 2 (09-04 is the public announcement) — CONFIRMED, and the rejection was the load-bearing
  half.** The aggregator-derived *"announcement expected ~09-11"* claim this doc read and **rejected**
  was wrong; the primary-over-aggregator discipline that seeded this calendar paid on the tape.
- **Leg 4 (~90% housekeeping) — NOT PUBLICLY READABLE, and this is a finding about the kill switch,
  not about the leg.** The pro-forma files go to S&P DJI *clients*; the public artefact is the
  press release, which carries names and nothing else. No share/float turnover decomposition and
  **no desk dollar estimate had been published by 20:35 ET on announcement night.**
- **Leg 5 (a quarter can pass with no constituent change) — UNTESTED this cycle.** Three in, three
  out; the forward test's "void if no addition is named" branch does not fire.
- **Leg 7 (the durable output is the size read for `opex-2026-09-18` leg 4) — DELIVERED, and it
  points the OPPOSITE way from that ledger's kill switch.** See below.
- **Leg 8 (no house playbook is index-flow-keyed) — UNCHANGED.** S1/S2/E1/S3/S4/G1 still contain no
  index-membership hypothesis; the sweep's kill list still carries no rebalance entry.
- **Leg 9 (a payrolls tape, not a rebalance tape) — CONFIRMED, with one reading of this doc's own
  corrected.** The D0 row banked midday **VIX 13.95 (−2.58%)** and **SPX 7,708.89 (−0.50%)** and
  read "vol *falling* on a red tape" as the calm-into-the-corridor configuration. **The closes
  reverse the vol half:** VIX closed **14.53, up +0.21 (+1.47%)** from 14.32; SPX closed
  **7,718.60 (−0.376%)**, SPY 770.19 (−0.385%), QQQ 718.96 (**+0.18%**). Vol rose on a mixed tape.
  The sibling `opex-2026-09-18` D-14 row banked **14.07** as "a new 2026 low" off an intraday
  stamp — the session's **close was 14.53**, and that is the number its next pulse should carry.

**Horizon calls.** *Today (D0) — right, and it cost nothing:* the files and the release both landed
after the close, so no session existed in which to be wrong. *This month ("watch the number, not
the names") — the number came back, and it is the readable quarter of the number.* *This week* and
*this quarter* stand unchanged; 2026-09-07 is Labor Day, so the **first session that prices this
announcement is Tuesday 2026-09-08**.

### The size read, and what it does to `opex-2026-09-18` leg 4

That ledger's kill switch reads: *"The S&P DJI pro-forma files (est. 2026-09-04) show an unusually
small index turnover for this quarter … Read the pro-forma, do not assume the average quarter."

**It does not fire.** On the readable half, this is a **normal-to-heavy** constituent-change quarter:

- Additions bring **$140.51B** of market cap into the index against **$21.41B** leaving — a **6.6×**
  net upsizing, **+$119.10B**. June 2026 moved two names each way; this quarter moves three.
- Against a vendor S&P 500 aggregate of **~$70.30T**, the additions alone are **~0.200%** of index
  cap of one-way buying, versus the **~0.8%** all-sources turnover norm this doc carries as press
  color. My own first-order arithmetic on full (not float-adjusted) vendor caps — **not** a house
  stat, and it is an upper bound on the float-weighted number.
- **Liquidity is where this bites.** Index demand as multiples of each name's own 20-session dollar
  ADV, across a 10–20% assumed indexed share of cap (the assumption is stated because no primary
  gives it): **BE 2.5–5.0 days** ($2.97B ADV), **ILMN 8.3–16.6 days** ($397M ADV), **Everpure
  9.1–18.3 days** ($362M ADV). Two of the three additions face roughly **two to three weeks** of
  their own average volume arriving in a single closing print.

So the close-side half of `opex-2026-09-18`'s "the close is the bigger distortion window" guard
**stands, and is if anything reinforced** — the stacked MOC on 09-18 carries a heavier-than-average
constituent-change leg, on top of the $6.2T notional roll-off that ledger banked. **But the kill
switch as written is not answerable by a non-client**: it asks a session to read a file it can never
see. Its readable substitute is the pair this doc now supplies — the announced add/drop cap ratio,
and the capped/alt-weighted file due **2026-09-11**, which the live sibling
[`sp-rebalance-proforma-capped-2026-09-11`](sp-rebalance-proforma-capped-2026-09-11.md) owns.

### The forward test is broken, and the arithmetic says so

`FT-sp-rebalance-proforma-2026-09-04-1` kills leg 3 if **any** announced addition posts **≥ +3%**
excess vs SPY over 09-04 → 09-18. Registered before the names were known, that threshold looked
neutral. Measured against the names that arrived, it is not. Over the trailing year of overlapping
10-session windows (n=242, Yahoo daily closes through 2026-09-04, excess vs SPY):

| | BE | Everpure (P) | ILMN |
|---|---|---|---|
| Annualized vol | **113.5%** | 68.6% | 47.2% |
| Median abs. 10-session excess | **12.82%** | 5.90% | 4.67% |
| p90 signed 10-session excess | **+34.93%** | +10.72% | +12.72% |
| Windows ≥ +3% excess | **52%** | 40% | 48% |

**At least one of the three cleared +3% excess in 200 of 242 windows — 83%.** That is the empirical
base rate of the test's own kill trigger, with no index effect required. A test that fires on noise
five times in six cannot adjudicate a 40-year published null, and a "kill" scored on 2026-09-21
would carry almost no information. **The registered prediction is not edited — that is falsification
and never happens** — so it stays open, is scored honestly on its stated terms, and its verdict is
read with this base rate attached. The properly-scaled companion,
**`FT-sp-rebalance-proforma-2026-09-04-2`**, is registered instead: the equal-weight BE/P/ILMN
basket's 10-session excess vs SPY runs mean **+3.46%**, median **+1.96%**, **p90 +15.81%** on the
same n=242 — so the basket test uses **+15.81%** and carries a ~10% false-kill rate rather than 83%.

**The generalizable lesson, and it is the most durable output of this event:** a forward test
registered *before* its subjects are known must set its threshold from the subjects' own realized
dispersion, not from the effect size in the literature. Greenwood & Sammon's ~1.0% is an average
across a large sample; +3% on a single 113%-vol name is inside one ordinary week. Sizing the
threshold to the sample, not to the claim, is what makes a null falsifiable.

### Honest limits

The announcement's own price effect is **not scored here and cannot be** — it landed at 19:15 ET
Friday, 09-07 is Labor Day, and the first pricing session is Tuesday **2026-09-08**. The after-hours
prints are press, not bars. Market caps are vendor and full-cap, not float-adjusted, so every
percentage-of-index figure above is an upper bound. The indexed-share range used for the days-of-ADV
arithmetic is an assumption, stated as one, and no primary source for it was found. `FT-...-1` and
`FT-...-2` both score **2026-09-21**, after this doc goes quiet — the forward-test register carries
them, and the live capped sibling is the natural place to read the result. Nothing above is a
position: shorting is blocked house-wide, no house playbook is index-flow-keyed, and the event's
date is still `estimate`. The `SPDJI:`-class prefix gap in `market-events-data.ts` stands unchanged
and remains **Eric's / the calendar owner's** call, not this lane's.

**No new dated adjacency to propose.** The 09-21 effective open and the 09-18 execution close are
both the same session `opex-2026-09-18` already owns; the 09-11 capped file already has its own
entry and ledger; the 09-08 share/IWF freeze is a data cut-off with no observable publication, and
this doc declined to file it at D0 for that reason — the release changes nothing about that.
