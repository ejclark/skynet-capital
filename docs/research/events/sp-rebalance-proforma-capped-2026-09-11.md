# S&P DJI September quarterly rebalance — capped / alternatively weighted pro-forma files released — sp-rebalance-proforma-capped-2026-09-11

**Kind:** sector · **Date:** 2026-09-11 (estimate, NEWS: spglobal.com S&P Equity Indices Policies & Practices (March 2026) — capped / alternatively weighted pro-formas release after the close on the second Friday, one week before the third-Friday effective date; the PDF 403'd on direct fetch 2026-09-04, so the rule is search-indexed text. Mechanism corroborated primary: SEC EDGAR, Select Sector SPDR Trust 497 filed 2026-01-31, fetched direct 2026-09-04) · **Impact:** low
**Last assessed:** 2026-09-15
<!-- probe-ref: {"symbols":{},"vix":17.77,"daysBand":"low:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","bund-30y-auction-2026-09-16","buyback-blackout-start-2026-09-12","canada-counter-tariffs-effective-2026-09-08","cpi-2026-09-11","ecb-decision-2026-09-10","eia-steo-2026-09-09","empire-state-mfg-2026-09-15","existing-home-sales-2026-09-10","fomc-2026-09-16","g20-energy-abundance-ministerial-houston-2026-09-14","gastech-2026-09-14","google-adtech-opinion-unseal-2026-09-16","iea-omr-2026-09-11","import-export-prices-2026-09-16","jgb-20y-auction-2026-09-15","jgb-liquidity-enhancement-1-5y-2026-09-10","labor-day-market-closure-2026-09-07","missouri-map-ballot-deadline-2026-09-08","mts-august-2026-09-11","nahb-hmi-2026-09-16","opec-momr-2026-09-10","opec-plus-meeting-2026-09-06","ppi-2026-09-10","qss-q2-2026-09-09","retail-sales-2026-09-16","sp-global-investment-manager-index-2026-09-15","tic-monthly-2026-09-16","treasury-10y-note-2026-09-09","treasury-20y-bond-2026-09-15","treasury-30y-bond-2026-09-10","treasury-3y-note-2026-09-08","treasury-buyback-10y20y-2026-09-10","treasury-buyback-cash-mgmt-2026-09-09","treasury-buyback-increase-2026-09-09","treasury-buyback-tips-10y30y-2026-09-15","treasury-coupon-announcement-2026-09-10","uk-cpi-2026-09-16","uk-labour-market-2026-09-15","umich-sentiment-prelim-2026-09-11","vix-expiration-2026-09-16"],"adjacentStrongIds":["cpi-2026-09-11","fomc-2026-09-16","retail-sales-2026-09-16","treasury-10y-note-2026-09-09","treasury-20y-bond-2026-09-15","treasury-30y-bond-2026-09-10"],"screenStreak":0} -->

## At a glance

**TL;DR.** 2026-09-11 is the **second half** of the September rebalance pair, and it is a different animal from the 09-04 file its sibling ledger covered. That one carried the add/drop names, whose measured effect is dead. This one carries the **capped and alternatively weighted** indices — the Select Sector SPDRs (XLK, XLC, …) and the S&P 500 Equal Weight family — where the flow is not names but **forced weight**, and where a binding cap once made XLK sell ~$11B of Apple in a single afternoon (June 2024). One thing here is stronger than its sibling: the date's *mechanism* is primary-sourced. The Select Sector SPDR Trust's own SEC filing (497, filed 2026-01-31) says these indices rebalance "at the closing prices of the **second Friday** of March, June, September and December," effective after the close of the third Friday. So **09-11's close is not just a publication date — it is the reference price date** that sets the size of the 09-18 trade, and it is struck on a **CPI + UMich-prelim tape**. The calendar entry stays `estimate` because what the title dates is the *file release*, and S&P DJI's own methodology PDF still returns HTTP 403. **The call is stand aside on every horizon — but the reason is arithmetic, not folklore.** From current holdings, XLK's over-4.8% cohort sums to **~42%** against a 50% trigger: no cap binds, no repeat of 2024. XLC's sums to **~55%**, so a cap does bind — and applying S&P DJI's own iterative rule, the whole trim is **~0.7pp ≈ $161M**, two orders of magnitude below the 2024 event. The big flow in this file is the **Equal Weight reset** (~$194M per 0.2% slot in RSP alone), and it lands on mid- and small-cap names this repo does not track and cannot see before the file prints.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-7) | Stand aside | High | The file is a week away, its inputs are not struck until the **2026-09-11** close, and today's tape is a payrolls tape (+162k vs ~53k consensus). Nothing about 09-11 is knowable today that changes a position now. | Any dated S&P DJI announcement published before the **2026-09-11** close naming the September capped/alt-weighted changes — the reference-close mechanism would not be what the SEC filing describes |
| This week | Stand aside | High | The 09-08 share/IWF freeze and the **09-10 PPI / 09-11 CPI** prints own the week; the capped file is a consequence of the 09-11 close, not a driver into it. | A Select Sector index publishing an **off-cycle** capping change between **2026-09-04** and **2026-09-11**, which would mean the quarterly reference-date frame is not the whole rule |
| This month | Watch the arithmetic, not the names | Medium | The 09-11 file is the last dated read on the **2026-09-18** market-on-close before it prints — the input `opex-2026-09-18` leg 4 rests on. Today's cap headroom says the capped half is small this quarter. | A vendor or desk reporting a September-2026 Select Sector capping trade above **$1B** in any single name, scored by **2026-09-21** — my ~$161M XLC figure would be wrong by an order of magnitude |
| This quarter | Stand aside | Medium | The December pair (capped file ~**2026-12-11**, effective at the **2026-12-18** close) stacks on year-end witching, and the conditional **2026-09-30** secondary reweighting is a quarter-end backstop, not a plan. | An S&P DJI methodology change published before **2026-12-11** moving the second-Friday reference or the 24%/4.8%/50% thresholds |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` (`NEWS:`) — it widens caution about the 09-18 close and licenses no date-keyed action.
- **The reference close is 2026-09-11, and it is a CPI close.** A large CPI surprise mechanically resizes the 09-18 capped trade — a mechanism, never a signal.
- **XLK: no cap binds.** Over-4.8% cohort **~42.0%** vs a 50% trigger (holdings 2026-08-07); largest name NVDA **14.46%** vs a 24% cap.
- **XLC: a cap binds, and it is small.** Cohort **~55.2%** (holdings 2026-08-28) → trim NFLX and CMCSA to 4.5% ≈ **0.72pp ≈ $161M** on $22.43B.
- Those cohorts are clustered **4.55–5.20%**, so membership flips on ordinary daily moves — illustration of scale, never a name forecast.
- **Equal Weight is the bigger flow**: RSP (~$96.8B, mid-July 2026) resets each name to 0.2% ≈ **$194M per slot**; the trade is the deviation, concentrated in the quarter's biggest movers.
- Size anchor, press/vendor grade: the **Sep-2025** cycle's Select Sector + Equal Weight round trip was **US$19.6bn** (Smartkarma/Freitas), vs ~$250B for the whole rebalance — the capped half is ~6–8% of the flow, and far more concentrated per name.
- **Never trade the file.** It goes to S&P DJI clients, lands after the 09-11 close, and no house playbook (S1/S2/E1/S3/S4/G1) is index-flow-keyed.
- Dated watch list: freeze after the **2026-09-08** close · capped file **2026-09-11** · effective at the **2026-09-18** close · conditional secondary reweighting effective **2026-09-30** (proposed `estimate`, this PR).

## Initial research

**The question.** What is actually in the 2026-09-11 release that was not in the 09-04 one, is the date right, and does the capped / alternatively weighted half of the rebalance support anything the 09-04 ledger's flat refusal did not already cover?

**One-line verdict:** it is a genuinely different mechanism — forced *weight* rather than forced *membership*, and one that has moved billions in a single name before — but this quarter's cap headroom, computed from current holdings, says the capped trade is small, and the part that could matter (the Equal Weight reset) lands on names this repo neither tracks nor can see before the file prints, so the call is stand aside on **un-instrumented** grounds rather than the sibling's **measured-null** grounds.

**Method.** Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` carries no index-flow instrument. Sourced web research, primaries first: SEC EDGAR for the Select Sector SPDR Trust's own rebalancing and capping language, the S&P DJI methodology and Indexology text (search-indexed only — both 403'd on direct fetch), PRNewswire for S&P DJI's June 2026 MegaCap consultation results, vendor holdings pages for current weights and AUM, and dated press for the 2024 XLK precedent and the Sep-2025 flow anchor. Cross-read against the sibling [`sp-rebalance-proforma-2026-09-04`](sp-rebalance-proforma-2026-09-04.md), [`opex-2026-09-18`](opex-2026-09-18.md), `docs/plans/trade-playbooks.md` and [`multi-symbol-sweep.md`](../multi-symbol-sweep.md).

### Conviction legs, tested

1. **The 2026-09-11 date is right, and its mechanism is primary-sourced — SUPPORTED, and stronger than the sibling's.** The Select Sector SPDR Trust's 497 (SEC EDGAR, filed **2026-01-31**, fetched direct 2026-09-04) states verbatim: *"the rebalancing of the Select Sector Indices … occurs at the closing prices of the second Friday of March, June, September and December. Changes will become effective after the market close on the third Friday of March, June, September and December."* September 2026's Fridays are 09-04 / **09-11** / 09-18, so the second Friday is 09-11 and the third is 09-18. That is an SEC-filed primary confirming the *reference and effective dates*; the S&P DJI methodology rule that the **pro-forma file** publishes after that same close is still only search-indexed text (the PDF 403'd again today, the same wall the 09-04 session hit). **Why the entry stays `estimate` anyway:** what the title dates is the file release, not the reference close, and this lane does not re-title an entry to promote it. Recorded for the calendar owner: a re-titled entry keyed to the reference close would be promotable today on a `SEC:` prefix, which the prefix list already carries.

2. **The 09-11 file is a different mechanism from the 09-04 one — SUPPORTED.** 09-04 released the float-market-cap-weighted pro-formas and (on 2026 precedent) the add/drop press release: forced **membership**. 09-11 releases the capped and alternatively weighted pro-formas: forced **weight** inside an unchanged membership. The 09-04 ledger's central finding — Greenwood & Sammon's inclusion effect decaying to ~1.0% in 2010–2020, indistinguishable from zero — is a measurement of *membership* and does not transfer to this file. Treating it as if it did would be the mistake this leg exists to prevent.

3. **A binding cap has moved billions in one name — SUPPORTED (June 2024 XLK).** Under the Select Sector rules as filed, no single component may exceed **24%** of its index, and the sum of components weighing more than **4.8%** may not exceed **50%**. When NVDA's market cap passed AAPL's, the June 2024 XLK rebalance forced the ETF to sell roughly **$11B of Apple** and buy nearly **$10B of NVIDIA**, taking AAPL's weight to the 4.5% cap and NVDA's above 20%. Press reported an AAPL pullback into that week. So the capped file's tail is real, not theoretical — which is precisely why the headroom arithmetic in leg 4 is the load-bearing work here rather than a footnote.

4. **This quarter, the cap headroom says small — SUPPORTED by arithmetic, with its precision named.** S&P DJI's own capping rule (Indexology, read search-indexed): if the over-4.8% group exceeds 50%, reduce the **smallest** company in that group to 4.5% and repeat until no threshold is breached. Applying it to current vendor holdings:
   - **XLK** (AUM **$119.67B**, holdings as of **2026-08-07**): NVDA 14.46 + AAPL 12.26 + MSFT 9.90 + AVGO 5.40 = **42.02%**, roughly **8pp below** the 50% trigger; largest name is 14.46% against a 24% cap; the next candidate, AMD at 4.00%, is 0.80pp below the 4.8% line. **No cap binds — the base case is no XLK capping trade at all**, and the 2024 precedent does not repeat this quarter.
   - **XLC** (AUM **$22.43B**, holdings as of **2026-08-28**): META 16.71 + GOOGL 10.38 + GOOG 8.27 + T 5.20 + VZ 4.96 + CMCSA 4.88 + NFLX 4.84 = **55.24%**, over the line. Iterating the rule: NFLX → 4.5% leaves 50.40%, still over; CMCSA → 4.5% leaves **45.52%**, done. Total trim **0.72pp ≈ $161M** on XLC's own assets. Against 2024's ~$11B, that is two orders of magnitude smaller.

   **The precision limit, stated plainly:** these are *ETF holdings* weights from vendor pages on stale dates, not index float-market-cap weights struck at the 09-11 close with membership and IWFs as of the effective date. XLC's cohort is clustered between **4.55% and 5.20%**, so which names sit above 4.8% flips on ordinary daily moves. This is an illustration of **scale**, and it is deliberately not a forecast of names.

5. **The larger flow in this file is Equal Weight, and it is the part we cannot see — SUPPORTED.** The S&P 500 Equal Weight family resets every constituent to a fixed **0.2%** at each quarterly rebalance, mechanically selling the quarter's winners and buying its laggards. RSP alone held roughly **$96.82B** as of mid-July 2026, so one 0.2% slot is about **$194M** and the trade in any name is its deviation from that slot. For a mega-cap that is noise; for a smaller S&P member that has doubled since the June reset it is a real fraction of daily volume. The vendor anchor agrees on where the weight sits: Smartkarma's Brian Freitas put the **September 2025** "Select Sector Indices and S&P Equal Weight Rebalance" round trip at **US$19.6bn**, *"a big chunk from the Equal Weight Index, XLK and XLC"*, with the largest named flows in APP, HOOD, TTD, NVDA, AAPL, GOOGL, MSFT, XOM and CVX; a sibling brief on another cycle carried **US$16bn**. Both are press/vendor grade, read from search snippets because smartkarma.com 403s, and **the $19.6bn is the Sep-2025 cycle, not a Sep-2026 forecast**. Against the ~$250B whole-rebalance figure the 09-04 ledger banked, the capped/alt-weighted family is roughly **6–8%** of the flow — the smaller half by dollars, the more concentrated half per name.

6. **"The index effect is dead" and "rebalance flows move prices" are not in conflict — MIXED, and the reconciliation is the point.** Greenwood & Sammon measure S&P 500 *inclusions* and find ~1.0% for 2010–2020. A separate line of work on index *reconstitution* across a broader universe (the Financial Analysts Journal's 2023 "Earning Alpha by Avoiding the Index Rebalancing Crowd", plus a 2025 arXiv working paper on passive-investing costs) reports prices moving adversely by more than **4%** over the 20 trading days into reconstitution with a **−5.7%** reversal the following month, and roughly **half** the initial impact persisting past ten days. The reconciling variable is flow **relative to liquidity**: $10B of AAPL is absorbed, $190M of a small S&P member into a single closing auction is not. This is MIXED and not SUPPORTED for one honest reason — both the FAJ article and the alphaarchitect summary of it returned HTTP 403, so those figures are search-indexed summaries of a study this session did not read. They shape the *frame*, and no number from them is used to size anything.

7. **The rules are not moving under us this quarter — SUPPORTED, with one unreconciled conflict.** S&P DJI's *Consultation on Treatment of MegaCap Companies — Results* (**2026-06-04**, fetched direct via PRNewswire) decided **no changes** to the S&P 500 / MidCap 400 / SmallCap 600 eligibility criteria; the only approved changes hit SPTMI, SPCMI and DWCF, effective **2026-06-08**. Separately, Morningstar describes a **"23/4.5/50"** capping methodology applied to the eleven sector indices in late 2024, which does **not** reconcile with the **24% / 4.8% / 50%** language in the Select Sector SPDR Trust's own 2026-01-31 SEC filing. Both are recorded; the SEC filing is preferred as the primary and the more recent, and the conflict is named rather than averaged into a number neither source published. If the true live threshold is 4.5% rather than 4.8%, leg 4's XLC cohort and trim both change — which is exactly why it is flagged rather than buried.

8. **No house playbook fits — SUPPORTED, unchanged from the sibling.** S1/G1 are earnings-dated pre-print run-ups, S2 the never-hold-the-print guard, S3 an earnings reaction-day fade (blocked on shorting), S4 an overnight-vs-buy-and-hold structural note, E1 a don't-trade-the-open execution rule. None is index-flow-keyed, and the sweep's kill list carries no rebalance hypothesis. The only contact point is **E1/S4 execution hygiene** on 09-18, where both the open (index SET) and the close (single-stock options + this rebalance) are distorted prints — a guard already recorded in [`opex-2026-09-18`](opex-2026-09-18.md), not a new signal.

9. **Adjacency — the reference close is a CPI close, and that is this ledger's one new contribution to the corridor read — SUPPORTED.** Within five days of 09-11 the calendar tracks twenty events, including **ppi-2026-09-10**, **cpi-2026-09-11**, **umich-sentiment-prelim-2026-09-11**, **mts-august-2026-09-11**, **buyback-blackout-start-2026-09-12**, **fomc-2026-09-16**, **vix-expiration-2026-09-16**, **retail-sales-2026-09-16** and five Treasury auctions. Because the capped weights are struck **at the 09-11 close**, a large CPI surprise that day does not merely move the tape — it changes the size of the trade that must clear at the 09-18 close, since relative weights on that one close are the input. That is a mechanism worth holding, never a signal to act on. Today's own readings, for the record: SPY **$769.66 (−0.45%)** and VIX **14.01 (−0.31, −2.16%)** at ~14:52 ET on 2026-09-04, off a **14.32** VIX close on 09-03 (arithmetically consistent); the 09-04 sibling banked **13.95** at a different intraday stamp today — recorded side by side, not reconciled. Geopolitics: OPEC+ meets 09-06 and the G20 energy ministerial 09-14; neither touches index-rebalance mechanics.

**What the conditions support.** Nothing to buy or sell. Two outputs: a **refusal** grounded in this quarter's own cap arithmetic rather than in a general claim about index effects, and one **observation to collect** — whether the capped half of the 09-18 market-on-close is as small as leg 4 computes, which either shrinks or sustains `opex-2026-09-18`'s stacked-MOC guard. Paper-only and educational throughout.

**Honest limits.** The pro-forma files go to S&P DJI **clients** and land after the 09-11 close, i.e. a week after this session — **no names are quoted and none are guessed**. Every weight in leg 4 is a vendor ETF-holdings figure from a stale date (XLK 08-07, XLC 08-28), not an index FMC weight at the reference close, and the capping arithmetic assumes ETF weights track index weights and that freed weight redistributes pro rata; it is illustrative of scale only. Four sources returned **HTTP 403** on direct fetch — S&P DJI's methodology PDF, S&P DJI's Indexology blog, the FAJ article and its alphaarchitect summary, and smartkarma.com — so the capping algorithm, the reconstitution study and the flow anchors are all search-indexed text rather than documents this session read. The `23/4.5/50` vs `24/4.8/50` conflict in leg 7 is unresolved. This repo has no index-flow instrument and no house prior for a rebalance, and `symbols: []` means no `earnings-cycle`/`intraday-edges` run applies. Every trading-adjacent statement above carries the entry's `estimate` label.

## Stance & kill switches

**Stance (date `estimate`, `NEWS:`-sourced; reference-close mechanism `SEC:`-corroborated).** Treat 2026-09-11 as a **known-mechanism, low-impact market-structure release** and, more usefully, as the **reference close** that sizes the capped and alternatively weighted half of the 09-18 rebalance. **No position is licensed by it.** The refusal rests on this quarter's own arithmetic rather than on folklore: XLK carries roughly 8pp of headroom under the 50% trigger so no cap binds, and XLC's binding cap trims about 0.72pp ≈ $161M — two orders of magnitude below the June 2024 XLK event that makes this file worth tracking at all. The larger flow, the Equal Weight reset, is real (~$194M per 0.2% slot in RSP alone) but lands on names this repo does not track and cannot see before the file prints, so the stand-aside is on **un-instrumented** grounds, not on a claim that the effect is dead. Carry forward one thing: the 09-11 close is a **CPI close**, so a large surprise that day resizes the 09-18 market-on-close — the input [`opex-2026-09-18`](opex-2026-09-18.md) leg 4 rests on. Execution hygiene on 09-18 is inherited from that ledger unchanged.

**Kill switches:**

- **A vendor or desk reports a September-2026 Select Sector capping trade above $1B in any single name** — leg 4's headroom arithmetic is wrong by an order of magnitude, and the "small quarter" half of this stance dies. Registered as `FT-sp-rebalance-proforma-capped-2026-09-11-1` in its measurable form.
- **XLC's over-4.8% cohort does not breach 50% at the 09-11 close** — no capping trade to measure, the forward test voids, and the 55.24% figure was an artefact of stale ETF weights rather than a live index reading.
- **The live threshold turns out to be 4.5%, not 4.8%** (leg 7's unreconciled Morningstar-vs-SEC conflict resolves against the SEC filing) — every cohort sum and trim in leg 4 must be recomputed before being cited again.
- **The capped/alt-weighted file does not land on 2026-09-11** — the second-Friday rule read from search-indexed methodology text is weaker than this doc treats it, and the December sibling should not be dated off it.
- **The 09-18 closing auction prints at or near an ordinary Friday's volume** — the stacked-MOC caution in `opex-2026-09-18` was overbuilt, and this ledger's "watch the arithmetic" call was watching something that did not matter.
- **A `SPDJI:`-class confirmed prefix is added, or this entry is re-titled to its reference close** — it becomes promotable from `estimate`; until then it stays `estimate` by construction, not by doubt.

**Registered forward test.** `FT-sp-rebalance-proforma-capped-2026-09-11-1` — see [`forward-tests.md`](../forward-tests.md). One observation, never a template.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-04 | D-7 | Initial research banked. **Mechanism, primary-sourced:** SEC EDGAR — Select Sector SPDR Trust 497 (filed **2026-01-31**, fetched direct today) states the Select Sector indices rebalance *"at the closing prices of the second Friday"* of Mar/Jun/Sep/Dec, effective after the close of the third Friday. So **09-11's close is the reference price date** for the 09-18 capped trade, not merely a publication date — and it is a **CPI + UMich-prelim close**, so a large surprise that day resizes the 09-18 MOC. Entry stays `estimate`: the title dates the *file release*, and S&P DJI's methodology PDF 403'd again. **Different mechanism from the 09-04 sibling** — forced weight, not forced membership; Greenwood & Sammon's dead inclusion effect does not transfer. **Precedent tail is real:** June 2024 XLK sold ~**$11B** AAPL / bought ~**$10B** NVDA when the 4.8%/50% rule bound. **This quarter's arithmetic says small** (S&P DJI rule: cut the *smallest* over-4.8% name to 4.5%, iterate) — **XLK** ($119.67B AUM, holdings 08-07): cohort **42.02%** vs the 50% trigger, top name 14.46% vs a 24% cap → **no cap binds**; **XLC** ($22.43B, holdings 08-28): cohort **55.24%** → trim NFLX + CMCSA to 4.5% ≈ **0.72pp ≈ $161M**. Vendor ETF weights on stale dates, cohort clustered 4.55–5.20% → **scale, not a name forecast**. **Bigger flow is Equal Weight**: RSP ~$96.8B resets each name to 0.2% ≈ **$194M per slot**. Anchor, press-grade: Sep-**2025** Select Sector + Equal Weight round trip **US$19.6bn** (Smartkarma/Freitas; sibling cycle $16bn) vs ~$250B whole-rebalance → capped half ≈ 6–8% of flow. **Rules not moving:** S&P DJI MegaCap consultation results 2026-06-04 — no S&P 500/400/600 changes; only SPTMI/SPCMI/DWCF, effective 06-08. **Unreconciled:** Morningstar's "23/4.5/50" sector capping vs the SEC filing's 24/4.8/50 — SEC preferred, conflict named. **Adjacency — peers:** none (`symbols: []`). **Macro:** 20 tracked events within 5 days, incl. PPI 09-10, **CPI 09-11**, UMich prelim 09-11, FOMC 09-16, VIX expiry 09-16, five Treasury auctions. **Vol regime:** VIX **14.01** (−2.16%) ~14:52 ET off a **14.32** 09-03 close; SPY **$769.66** (−0.45%) — sibling banked 13.95 at a different stamp, recorded not reconciled. **Geopolitical:** OPEC+ 09-06, G20 energy 09-14 — no channel to rebalance mechanics. **New dated adjacency proposed as `estimate` in this PR:** `sp-select-sector-secondary-reweight-2026-09-30` — the Select Sector secondary reweighting, tested on the second-to-last business day of the quarter (**Tue 09-29**) and effective after the close of the last (**Wed 09-30**); conditional on a breach, so filed as a backstop, not a base case. Forward test **`FT-sp-rebalance-proforma-capped-2026-09-11-1`** registered. **Four 403s** (S&P DJI methodology + Indexology, FAJ, alphaarchitect, Smartkarma) — algorithm and flow anchors are search-indexed text. | — (stance set: stand aside on all four horizons; the refusal is arithmetic — no XLK cap binds, XLC's binds small — and the un-seeable Equal Weight reset is the honest reason it stays a refusal rather than a null) | **2026-09-11** (low band, D-7 → every 7d), then close-out by **2026-09-17** |
| 2026-09-11 | D-0 | **Deterministic screen (no Claude session).** Readings — VIX 15.6 (+1.6pt since last), band unchanged (low:0+), 42 adjacent event(s) tracked, new in corridor since last pulse: `bund-30y-auction-2026-09-16`, `canada-counter-tariffs-effective-2026-09-08`, `ecb-decision-2026-09-10`, `eia-weekly-petroleum-status-2026-09-16`, `empire-state-mfg-2026-09-15`, `existing-home-sales-2026-09-10` +16 more (recorded, not assessed). Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-09-18 |

| 2026-09-15 | D+4 | **Close-out — see `## Outcome`.** Weights reconstructed at the reference close from SSGA's own daily holdings workbooks for **all eleven** Select Sector SPDRs (HTTP 200, as of 14-Sep-2026, fetched today) × Yahoo closes; the method reproduces the published 09-14 weights to **±0.005pp**. **XLC's cap did not bind** — group **47.44%** vs the 50% trigger (47.69% at 09-09) — so **FT-…-1 is VOID** on its own written clause. Not an arithmetic error: this session reconstructs **55.33%** on 08-28, the ledger's own data date, and the same seven names' weight *rose* to 56.61% while CMCSA and NFLX fell under 4.8% and left the cohort. The trigger is a **discontinuous statistic**; leg 4's clustering caveat outranked its headline. **XLK held wider** (36.97%). **But a cap bound in two funds never opened here: XLE** (**58.37%**, breaching 25 straight sessions from 08-07 — including the 09-04 research date, and driven by the Hormuz energy shock that row called "no channel to rebalance mechanics") **and XLY** (AMZN **24.94%** vs the 24% cap, 30 sessions from 07-31). **Two rules were wrong:** the algorithm leg 4 applied was replaced **2024-09-23** (group aggregate now cut to **45%** pro rata) *because of* the June-2024 XLK event this doc cited as precedent; and 24%/23% is **trigger-vs-target**, resolving leg 7's conflict. Quarter size **$1.2B–$5.8B** one-way vs **$161M** estimated (8–36×); PSX's trim is **63% of 20d ADV**. **Adjacency:** 41 within 5 days (6 strong); **no new dated event** — chain 09-04→09-11→09-18→09-21→09-29/30 fully tracked. **Tape (intraday ~11:09 ET):** VIX **17.77**, SPY **756.83**, XLE **65.36**. | — (refusal upheld, arithmetic refuted: zero cost, but "small quarter" is dead and the named fund was wrong) | closed |
**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from memory — after which this doc goes quiet.

## Outcome

**Close-out (2026-09-15, D+4 — inside the `closeOutWithinDays: 6` deadline of 09-17).** Sector mode
runs no `earnings-cycle` / `intraday-edges` instrument (`symbols: []` by design), so the mandated
cache bust (`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) had no
target. Every number below was **re-fetched today**, never recalled — and this close-out's main
deliverable is the instrument it had to build to do that.

**The headline: the refusal was right and free, and every load-bearing number under it was wrong.**
XLC's cap **did not bind** at the reference close, so the one thing this ledger registered a test on
never happened. The cap bound instead in **XLE** and **XLY** — two of the eleven Select Sector funds
this ledger never opened, both already breaching on the day the initial research ran. And the
capping algorithm leg 4 applied had been **replaced two years before the event**, *because of* the
June-2024 XLK event this ledger cited as its own precedent.

### The instrument this close-out built — reconstructable index weights, validated

The 09-04 session's binding constraint was that every weight it had was a vendor ETF-holdings
figure on a stale date. That constraint is removable, and the fix is three steps:

1. **SSGA publishes each Select Sector SPDR's full basket daily**, with **share counts**, at
   `https://www.ssga.com/us/en/intermediary/library-content/products/fund-data/etfs/us/holdings-daily-us-en-<fund>.xlsx`
   — **HTTP 200** for all eleven funds today (19–24 KB each, `As of 14-Sep-2026`). No 403.
2. **Share counts are weight-invariant between rebalance effective dates.** Creations and
   redemptions are in-kind and scale the whole basket, so `shares_i × close_i(d) / Σ(shares × close(d))`
   recovers the fund's weights on **any** past date inside the quarter.
3. **AUM comes free from the fund's own cash line** — `US DOLLAR` shares ÷ its published weight.
   XLC checks out twice (`$23.107B` from the dollar line, `$23.107B` from the money-market line).

**It validates.** Reconstructing 09-14 — the workbooks' own as-of date — reproduces every published
weight to **±0.005pp** (META 18.938 vs 18.935777 published; XLC cohort 47.669 vs 47.663). The 09-11
reference close is three sessions of drift from a basket that is exact by construction.

### The reference close, measured across all eleven funds

| Fund | AUM | largest name | >4.8% group (n) | 24% single-name | 50% group test |
|---|---|---|---|---|---|
| XLB | $8.3B | LIN 12.99% | 37.16% (5) | clear | clear |
| **XLC** | **$22.6B** | **META 18.83%** | **47.44% (5)** | clear | **clear — the ledger said 55.24%** |
| **XLE** | **$42.5B** | XOM 20.17% | **58.37% (6)** | clear | **BREACH** |
| XLF | $55.5B | JPM 11.82% | 30.19% (4) | clear | clear |
| XLI | $31.0B | CAT 6.97% | 18.12% (3) | clear | clear |
| **XLK** | **$121.8B** | **NVDA 14.12%** | **36.97% (3)** | clear | **clear — ledger said 42.02%** |
| XLP | $14.2B | WMT 10.24% | 40.31% (5) | clear | clear |
| XLRE | $8.0B | WELL 11.60% | 43.62% (6) | clear | clear |
| XLU | $22.0B | NEE 13.03% | 39.56% (5) | clear | clear |
| XLV | $43.0B | LLY 14.79% | 44.84% (5) | clear | clear |
| **XLY** | **$21.4B** | **AMZN 24.94%** | 48.02% (3) | **BREACH** | clear |

### Why 55.24% became 47.44% — the trigger is a discontinuous statistic

This is the most transferable finding here, and it is **not** that the ledger's arithmetic was
sloppy. Reconstructing XLC on **2026-08-28** — the ledger's own holdings date — gives **55.33%**
against its stated **55.24%**. Leg 4 computed the number correctly. The number then decayed:

| XLC, reconstructed | 08-28 | 09-04 | 09-08 | **09-09** | 09-10 | **09-11** |
|---|---|---|---|---|---|---|
| >4.8% group | **55.33%** | 51.45% | 51.58% | **47.69%** | 47.35% | **47.44%** |
| names in group | 7 | 6 | 6 | **5** | 5 | **5** |
| same **seven** names' total weight | 55.33% | 56.02% | 56.28% | 56.49% | 56.41% | **56.61%** |

**Concentration went up while the trigger measure went down 7.9pp.** META alone ran 578.02 → 648.03
(**+12.1%**) over the window and gained ~2.1pp of weight. What fell below 50% was the *membership*
of the cohort: **CMCSA 4.88 → 4.57** and **NFLX 4.84 → 4.61** crossed under 4.8% and stopped
counting. XLK tells the same story in reverse — its cohort widened from 42.02% to 36.97% mostly
because **AVGO 5.40 → 4.58** left it.

Leg 4 wrote the caveat that mattered — *"XLC's cohort is clustered between 4.55% and 5.20%, so which
names sit above 4.8% flips on ordinary daily moves… an illustration of scale, deliberately not a
forecast of names."* **The caveat was load-bearing and the headline was not**, and the stance
promoted the headline to the At-a-glance table anyway. Over the 58 sessions from 06-22 to the
reference close, XLC's cohort breached 50% in **17 of them (29%)** — a breach is XLC's *minority*
state, and 08-28 happened to be one.

**The rule this banks, for any registration keyed to a threshold-defined aggregate:** when the
statistic under test is *a sum over a set defined by a threshold*, and the marginal members sit
within a few tenths of that threshold, the uncertainty is dominated by **membership flips**, not by
drift in the sum. Forecast it fourteen days out and you are forecasting which side of a coin four
names land on. Either register the test on a **continuous** measure (top-*n* weight, HHI, the named
cohort's total regardless of membership) or register it **on the reference date itself**.

### The cap bound in two funds this ledger never opened

The initial research examined **XLK and XLC** — the two funds the June-2024 precedent and the
mega-cap cluster made salient. The rule applies to **eleven**. Both breaching funds were breaching
**on 2026-09-04, the day the research ran**, and had been for weeks:

| Fund | Test breached | At the 09-11 close | Consecutive sessions breaching into 09-11 | First session |
|---|---|---|---|---|
| **XLE** | >4.8% group ≤ 50% | **58.37%** (XOM 20.17, CVX 15.23, COP 6.36, MPC 5.66, PSX 5.52, VLO 5.43) | **25** | **2026-08-07** |
| **XLY** | single name ≤ 24% | **AMZN 24.94%** | **30** | **2026-07-31** |

**And the energy breach has a cause this ledger explicitly ruled out.** The 09-04 row's adjacency
sweep noted *"OPEC+ 09-06, G20 energy 09-14 — no channel to rebalance mechanics."* The channel is
weights. Over 09-04 → 09-11 the Hormuz shipping escalation took WTI to **$102.48 (+6.7% on 09-10
alone)** and Brent to **$107.63** (measured independently in the [`opec-momr-2026-09-10`](opec-momr-2026-09-10.md)
close-out), and XLE's cohort ran **57.49% → 58.37%** on XOM **+4.09%**, VLO **+5.31%**, COP
**+2.30%** against a flat tape. A geopolitical shock that moves one sector 4–5% against the index
**is** a rebalance input, because the capping test is a *relative* weight test. The sweep asked "does
this touch the mechanism?" and answered from topic. It should have asked "does this move relative
sector weights?" — which is the only question the mechanism has.

### The capping algorithm was replaced two years before the event

Leg 4's arithmetic applied this rule, cited to Indexology: *"if the over-4.8% group exceeds 50%,
reduce the smallest company in that group to 4.5% and repeat."* That is the **legacy** mechanism.
S&P DJI replaced it **effective prior to the open on 2024-09-23**: when the group breaches 50%, *"the
aggregate weight of the larger companies will be reduced to **45%** and the larger companies'
individual weights will be determined by their relative proportions, after checking for any breaches
in the single company cap. The minimum index weight of each of the larger companies will be 4.5%."*

**The reason for the change is this ledger's own headline precedent.** Both S&P DJI's blog and
ETF.com's coverage give the rationale as the legacy rule causing *"flip flops"* in index weights,
citing the **June 2024 Technology Select Sector rebalance** — the ~$11B AAPL sale / ~$10B NVDA
purchase leg 3 held up as proof that the tail is real. The ledger cited the event as precedent and
the mechanism that produced it as current, unaware the first had caused the second's retirement.

**The 24% / 23% "conflict" was never a conflict.** Leg 7 recorded Morningstar's "23/4.5/50" against
the SEC filing's "24/4.8/50" as unreconciled and preferred the SEC text. An SEC-filed primary pulled
direct today (Bank of Montreal 424B2, **filed 2026-07-21**, EDGAR full-text search, fetched
`sec.gov` HTTP 200) states both numbers in one sentence: *"each Component Stock that exceeds **24%**
of the total value of the Select Sector Index will be reduced to **23%**… the excess amount will be
redistributed proportionally."* **24% is the trigger, 23% is the target** — and the same shape holds
for the group test (**4.8%** trigger, **4.5%** target). They are not competing figures, and leg 7's
warning that "if the true threshold is 4.5% rather than 4.8%, leg 4's cohort and trim both change"
was a false alarm resting on that misread.

### What the quarter's capping trade actually is — a bounded range, not a point

Applying each candidate algorithm to the reconstructed 09-11 weights:

| Algorithm | XLE one-way sell | XLY one-way sell | Total | Largest single name |
|---|---|---|---|---|
| **Legacy** (rank descending, cut the first name causing the breach to 4.5%, iterate) — the wording in the SEC-filed 424B2 | PSX $435M + VLO $396M = **$831M** | AMZN 24.94→23.00 = **$414M** | **$1.25B** | PSX **$435M** |
| **Current** (group aggregate → 45% pro rata, 4.5% floor) — effective 2024-09-23 | XOM $1,961M + CVX $1,481M + COP $618M + MPC $493M + PSX $435M + VLO $396M = **$5.38B** | **$414M** | **$5.80B** | XOM **$1.96B** |

Against the ledger's **$161M** for the quarter, that is **8× to 36×**. The range is honest and it is
the deciding question this close-out hands forward — see *Honest limits*.

### Trim ÷ liquidity — the variable leg 6 named and nobody sized

Leg 6 said the reconciling variable between "the index effect is dead" and "rebalance flows move
prices" is **flow relative to liquidity**, then sized nothing against it. Sized now, against 20-day
dollar ADV pulled today:

| Name | Trim (legacy algo) | 20d dollar ADV | Trim as % of one day's volume |
|---|---|---|---|
| **PSX** | $435M | $693M | **63%** |
| **VLO** | $396M | $941M | **42%** |
| AMZN | $200–414M | $8,360M | 2.4–5.0% |
| *CMCSA (the ledger's own case)* | *$80M* | *$597M* | *13%* |
| *NFLX (the ledger's own case)* | *$81M* | *$2,174M* | *3.7%* |

**This is where "small quarter" actually dies.** $1.25B is still an order of magnitude under 2024's
~$11B, so the *absolute* framing survives. But a **63%-of-ADV** print in PSX going through one
closing auction is a different object from the ledger's imagined case — $161M spread across two of
the most liquid names in the index, which is 3.7% and 13% of a day. The ledger picked the
low-liquidity-ratio case and generalised from it.

### Forward test — VOID, by the clause it wrote itself

| Test | Void condition, verbatim | Outcome |
|---|---|---|
| `FT-sp-rebalance-proforma-capped-2026-09-11-1` | *"**Void** (not killed) if XLC's over-4.8% group does **not** breach 50% at the 09-11 reference close (no capping trade to measure — the 55.24% was a stale-ETF-weights artefact)"* | **VOID** — group **47.44%** at 09-11, **47.69%** at 09-09 |

The clause fires on both candidate reference dates, and its stated reason is exactly what happened.
Two things are worth saying beyond the score.

**The void is not why the test would have failed.** Its prediction was that four XLC names would
show **< ±2%** excess vs XLC across 09-11 → 09-18. With two of five sessions gone (09-15 readings
**intraday**, ~11:09 ET, never a close), **CMCSA is already at −2.60% raw / −3.76% excess** vs XLC's
+1.40% — past the ±2% band, with no capping trade anywhere near it and CMCSA not even in the
breaching cohort. A single-name move against its own sector of 3.8% in two sessions on ordinary
tape is **larger than any effect a $161M trim across two mega-liquid names could produce**. The band
was wider than the mechanism it was built to detect, so a clean run would have measured noise and
scored it as signal. That compounds the CPI close-out's void-hole lesson in a different shape:
**calibrate the band to the size of the effect, not to what looks like a round number.**

**The test is not scored a pass.** It was registered to observe that this quarter's flow was small.
This quarter's flow was **8–36× the estimate**, in a different fund, at up to 63% of a name's daily
volume. Scoring void and calling the thesis vindicated would be the dishonest reading.

**No legacy row references this event** — `grep 'sp-rebalance-proforma-capped' docs/research/forward-tests/legacy.md`
returns **0**, recorded as a negative result. **No new forward test is registered**, for the reason
the [`ppi-2026-09-10`](ppi-2026-09-10.md) close-out gives: this doc goes silent the moment `## Outcome`
exists and nothing independently scores due rows (#2884), so a new row would be born an orphan. The
open question is routed in this PR's body instead.

### Kill switches, settled

1. **"A vendor or desk reports a September-2026 Select Sector capping trade above $1B in any single
   name"** — **fires on substance under the current rule, not under the legacy one, and not on the
   instrument it named.** No vendor report was obtainable (smartkarma.com 403s; its one
   September-cycle-shaped piece, *"US$15.5bn Flow Post Capping"*, dates to **2025-04-03** and is a
   different cycle). This session's own reconstruction puts XOM at **$1.96B** and CVX at **$1.48B**
   under the post-2024 rule and **$435M** maximum under the legacy one. The switch's *substance* —
   *"leg 4's headroom arithmetic is wrong by an order of magnitude, and the 'small quarter' half of
   this stance dies"* — **fires either way**: $1.25B vs $161M is 8×. Recorded as fired on
   reconstruction, an evidentiary grade below the vendor report it asked for.
2. **"XLC's over-4.8% cohort does not breach 50% at the 09-11 close"** — **FIRED, exactly as
   written**, down to its stated cause (*"an artefact of stale ETF weights"* — 09 sessions of decay
   from a correctly-computed 08-28 reading).
3. **"The live threshold turns out to be 4.5%, not 4.8%"** — **dissolved, not resolved.** 4.8% is the
   trigger and 4.5% the target; there was never a competing figure to choose between.
4. **"The capped/alt-weighted file does not land on 2026-09-11"** — **unresolvable, as predicted.**
   The files go to S&P DJI clients; `spglobal.com/spdji` returned **403** to every direct fetch again
   today (methodology PDF, Indexology, index-news, the 2024 capping impact analysis). What *is*
   confirmed is the surrounding chain: S&P DJI's **2026-09-04** announcement (Bloom Energy, Illumina
   and Everpure joining the S&P 500) with changes effective **before the open Monday 2026-09-21**,
   consistent with a third-Friday-close effective date.
5. **"The 09-18 closing auction prints at or near an ordinary Friday's volume"** — **not yet
   observable.** 09-18 is three sessions after this close-out. It belongs to
   [`opex-2026-09-18`](opex-2026-09-18.md), whose leg 4 this ledger fed; that doc now has a **larger**
   input than the $161M it was handed — see the note below.
6. **"A `SPDJI:` confirmed prefix is added, or this entry is re-titled to its reference close"** —
   **the calendar already did the second half, for December only.** The December sibling is tracked as
   `sp-rebalance-reference-close-2026-12-11`, and March/December 2027 likewise, while September's
   entry kept the file-release title. Recorded for the calendar owner: the naming the ledger asked
   for exists; September's row is the one left behind.

### The four horizon calls, scored

| Horizon | Call | Verdict |
|---|---|---|
| Today (D-7) | Stand aside | **Right, and free.** Falsifier (a dated S&P DJI announcement of the September capped changes before the 09-11 close) never fired. Zero capital, zero loss |
| This week | Stand aside | **Right.** Falsifier (an off-cycle Select Sector capping change between 09-04 and 09-11) never fired. The week belonged to PPI/CPI exactly as stated |
| This month | *"Watch the arithmetic, not the names"* | **Right instruction, wrong arithmetic — and the falsifier is the one that fired.** It named *"a September-2026 Select Sector capping trade above $1B in any single name, scored by 2026-09-21"*; XOM $1.96B under the current rule clears it, PSX $435M under the legacy one does not. The instruction was correct and is the reason this close-out found anything |
| This quarter | Stand aside; December stacks on year-end witching | **Unfalsified and unhelped.** Its falsifier (an S&P DJI methodology change before 2026-12-11 moving the second-Friday reference or the thresholds) never fired — but a methodology change **had already happened in 2024** and this document did not know it, so the switch was watching a door that was already open |

### What the stance cost, and what it bought

Zero capital deployed; realised P&L **zero**, the correct P&L for a stand-aside. The refusal itself
needs no re-argument: no house playbook is index-flow-keyed, the pro-forma file is client-only, and
the Equal Weight reset — **RSP $96.8B at 0.2% per slot ≈ $194M a name** — still lands on names this
repo neither tracks nor could see before the file printed. What the quarter bought is the
**instrument**: eleven funds' weights are now reconstructable to ±0.005pp on any date inside a
quarter, from a source that does not 403, which turns every future capping question from an estimate
off stale vendor pages into a measurement.

### Honest limits

- **The live algorithm is the one thing that matters and it is not settled.** Two sources say the
  group is cut to a **45% aggregate** (S&P DJI's own Indexology post and ETF.com's coverage, both
  naming **2024-09-23** and both read as **search-indexed text** — `indexologyblog.com`,
  `etf.com` and `spglobal.com/spdji` all returned **403** to direct fetch today). One **SEC-filed
  primary read in full today** (BMO 424B2, 2026-07-21) still describes the **legacy** rule. The
  reconciliation this session prefers is that a structured-note prospectus carries stale third-party
  boilerplate about someone else's index and S&P DJI is the authority on its own methodology — but
  that is a judgment, not a document. **The deciding question for the next session:** fetch the
  *current* `methodology-dj-us-select-sector-specialty.pdf` (or the Sept-2024 announcement PDF) from
  a host that serves it, and read the group-capping paragraph. It moves the quarter's number from
  $1.25B to $5.80B, and moves kill switch 1 from not-fired to fired.
- **The reference date has a competing rule, and it does not change any conclusion.** S&P DJI's
  methodology (search-indexed) gives the weighting reference date as *"the Wednesday before the
  second Friday"* = **2026-09-09**; the SEC-filed 424B2 says *"the closing prices of the second
  Friday"* = **2026-09-11**. Every finding here was computed at **both**: XLC 47.44% / 47.69%, XLE
  58.37% / 57.99%, AMZN 24.94% / 24.61%. No call flips. Leg 1's confidence that 09-11 was
  primary-sourced was misplaced; its *consequence* was not.
- **Reconstructed weights are ETF weights, not index float-market-cap weights.** They coincide for a
  full-replication fund up to its ~0.2% cash, and the method is exact on its as-of date, but index
  membership, shares outstanding and IWFs as of the effective date are S&P's and not visible here.
  Reconstruction error grows going back: exact at 09-14, ~3 sessions at 09-11, ~7 at 09-04. **The
  25-session and 30-session breach streaks are the weakest claims in this document** — they reach
  back six weeks on a constant basket — and they are cited for the fact that both breaches predate
  the research date, which holds at any reasonable error, not for their exact length.
- **The file itself was never seen**, by anyone outside S&P DJI's client list. Nothing here observes
  the pro-forma release; it measures the *inputs* the rule says the release is computed from.
- **$5.38B is a computed trade, not an executed one.** It is what the rule as this session reads it
  requires from the reconstructed weights. No print, tape, or desk report corroborates it, and the
  09-18 auction that would is three sessions away.
- Nothing was traded. The date stays **`estimate`**; every figure above is a measurement of index
  mechanics and licenses no date-keyed action.
- **Adjacency, closing.** 41 tracked events within 5 days of 09-11 (6 confirmed high/critical: CPI
  09-11, FOMC 09-16, retail sales 09-16, and the 10Y/20Y/30Y). **No new dated adjacent event is
  proposed** — recorded as a negative result rather than passed over: the rebalance chain is already
  tracked end to end (`sp-rebalance-proforma-2026-09-04` → this entry → `opex-2026-09-18` →
  `sp-quarterly-rebalance-effective-2026-09-21` → `sp-select-sector-secondary-reweight-2026-09-30`),
  and a targeted search for an undated-in-our-calendar S&P DJI consultation or methodology event in
  October–November 2026 returned nothing dated. **Tape at close-out (intraday ~11:09 ET 2026-09-15,
  never a close):** VIX **17.77** (vs **15.84** at the 09-11 close, **+1.93**), SPY **756.83**
  (−0.98% from 09-11), XLE **65.36** (+0.35%), XLK **183.98** (−1.97%), XLC **114.18** (+1.40%),
  XLY **111.23** (−1.53%), RSP **213.70** (−0.54%).

### One thing to carry to `opex-2026-09-18`

That ledger's leg 4 rests on this one's estimate of the capped half of the 09-18 market-on-close.
The input it was handed was **$161M**. The input it should hold is **$1.25B–$5.80B one-way, with
PSX at ~63% and VLO at ~42% of a day's dollar volume**, concentrated in **energy**, not tech or
communication services. That strictly *strengthens* its stacked-MOC caution rather than shrinking
it — the opposite of what this ledger expected to hand over — and it is the one live consequence of
this close-out for a document still open.

**This document is now closed.** No trade was taken, none is authorized, and the stance registered
into the event — stand aside, zero capital — stands as the final word on it.
