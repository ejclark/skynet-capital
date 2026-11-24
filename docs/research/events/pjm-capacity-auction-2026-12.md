# PJM capacity auction window closes — pjm-capacity-auction-2026-12

**Kind:** sector · **Date:** 2026-12-15 (confirmed 2026-11-15, PJM: pjm.com RPM auction schedule — window 2026-12-09 → 2026-12-15, results posted 2026-12-22; was an EST: watch-list estimate) · **Impact:** medium
**Last assessed:** 2026-09-08 (first pair; the live pair is the last in this file)
<!-- probe-ref: {"symbols":{},"vix":15.42,"daysBand":"medium:31+","adjacentIds":["boj-decision-2026-12-18","boj-tankan-2026-12-14","cpi-2026-12-10","cr-expiry-2026-12-11","ecb-decision-2026-12-17","ercot-data-center-audit-filing-2026-12-10","g20-miami-2026-12-14","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","housing-starts-2026-12-17","import-export-prices-2026-12-17","industrial-production-2026-12-16","intl-transactions-q3-2026-12-18","japan-cgpi-2026-12-10","japan-cpi-2026-12-18","mtis-2026-12-16","mts-november-2026-12-10","nahb-hmi-2026-12-16","opex-2026-12-18","pending-home-sales-2026-12-17","ppi-2026-12-15","puct-batch-zero-report-open-meeting-2026-12-17","qss-q3-2026-12-10","retail-sales-2026-12-16","russell-reconstitution-2026-12-11"],"screenStreak":0,"blocked":[{"url":"https://insidelines.pjm.com/pjm-reliability-backstop-proposal-outlines-steps-to-secure-new-supply-and-maintain-reliability/","status":"EMPTY_BODY","at":"2026-09-08"},{"url":"https://www.pjm.com/-/media/DotCom/documents/ferc/filings/2026/20260904-el26-101-000.pdf","status":"PDF_UNPARSED","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** Still **watch-only** — no action on any tracked name. The date is now **confirmed** by PJM's
own schedule: bidding window **2026-12-09 → 2026-12-15** (closes 5:00 PM EPT), results posted
**2026-12-22**, a week *after* the date this event carries. The base case is unchanged — a fourth
straight at-cap clear with a persistent shortfall — but the cap is **$337.83/MW-day** (floor $181.91),
not the $325 this ledger first quoted: PJM's 2029/30 planning parameters moved the reference-resource
UCAP factor from 79% to 76%. The two-print December sequence died: FERC suspended the backstop
procurement (2026-09-29) and PJM refiled it for a **2027-05-10** result, so this auction is again the
only December print. FERC also **rejected** (2026-10-09) the exclusion of new large loads from this
auction's demand curve, so the curve PJM posted in September stands.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — watch-only | High | The collar still makes the clearing price a known number (cap $337.83); nothing to trade before results | FERC or PJM modifying the collar or postponing the auction before 2026-12-15 |
| This week | **No action** | High | Date is now confirmed, but the print lands 2026-12-22, and the only live dockets (EL27-11 prompt-auction complaint, EL26-67 large-load filings) cannot be ruled on in time to change this auction | A FERC order or PJM notice moving the window, or re-opening the demand curve, before 2026-12-09 |
| This month | **Watch the window, not the tape** | Medium | Bidding opens 2026-12-09; results are a week after the window closes, so nothing is observable here until 2026-12-22 | PJM posting revised VRR curves or a schedule change (updated curves were due ~30 days before, about 2026-11-09) |
| This quarter | **Hold the sleeve's Tier-2 gate closed** | Medium | A fourth at-cap clear is not the cap sunset the gate names; the first uncapped print is the 2030/31 auction (est. 2027-05) | Credible cap-sunset signalling before or at the 2026-12-22 results |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — take a date-keyed position; the date is an estimate and this auction's price is collared.
- **Read at the print** — shortfall MW against the **158,712 MW** RTO reliability requirement, any LDA price adders (PJM WEST is newly modeled), and PJM's uncapped-price simulation; the RTO price itself is pinned.
- **The tell that de-risks the whole layer** — an RTO-wide clear below the **$337.83** cap (supply actually responding; `constraint-watch.md` Phase 4).
- **Upgrades this event's impact tier if** — the collar is modified or vacated, or Exelon's EL27-11 complaint (prompt auction schedule from 2030/31) is granted in a way that reaches this auction.
- **Peers are not the read** — the AI-power complex sold off roughly 10-26% in the week to 2026-11-20 with VIX at 35.89; a collared price does not move with it, so a drawdown there is not a capacity signal (row 2026-11-22).
- **Watch (dated)** — window opens **2026-12-09** · closes **2026-12-15** 5:00 PM EPT · results **2026-12-22** · FERC action on EL27-11 (Exelon asks for an order by January 2027, beyond this event) · backstop results ~2027-05-10 (estimate).

## Initial research

**The question, plainly.** PJM's Base Residual Auction for the 2029/30 delivery year runs in
December 2026 — the annual "purest public price of scarcity" print the
[`ai-energy-constraint.md`](../ai-energy-constraint.md) thesis watches. What is likely to happen,
how will the market react, and does anything here touch the nine tracked names?

**One-line verdict.** With the FERC-approved $325/$175 collar confirmed to cover this auction
(accepted 2026-04-28), the December print is near-pre-scripted to clear at or near the cap; the
tradable information is the **shortfall size** and any **cap-sunset signal for the 2030/31
auction** — a thesis-maintenance checkpoint for the AI-energy sleeve, not a direct play on any of
the nine tracked names.

**Method.** Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md)
(sector kind — no price instruments): primary sources (pjm.com press releases and public
disclosures, FERC filing coverage) over aggregators, all checked 2026-08-17; the market's
reaction function reconstructed from the last three auction results; sensitivity read against
[`ai-energy-constraint.md`](../ai-energy-constraint.md) and
[`constraint-watch.md`](../constraint-watch.md).

**Legs tested.**

1. **The date — "December 2026, results ~Dec 15."** MIXED (stays an estimate). PJM's own July
   2026 results release and its Inside Lines coverage confirm the 2029/30 BRA is "scheduled for
   December" 2026 as PJM works back toward the three-year-forward cycle (pjm.com newsroom
   release 2026-07-14; insidelines.pjm.com, checked 2026-08-17), and ESAI Power's auction
   calendar lists "December 2026: Base Residual Auction (2029/30)" (esaipower.com, checked
   2026-08-17). No primary source publishes the exact day yet. The December 2025 analog ran
   offer window Dec 4–10 with results posted **Dec 17**, so the calendar's 2026-12-15 estimate
   is honest but could slip a few days either way. Confirm against PJM's posted auction
   schedule when it lands.
2. **"The cap is the base case"** (the thesis's non-negotiable). SUPPORTED. PJM filed
   2026-03-02 to extend the price collar (cap ~$325/MW-day, floor $175) and **FERC accepted it
   on 2026-04-28 for both the 2028/29 and 2029/30 delivery years** — this auction is explicitly
   inside the collar (insidelines.pjm.com "FERC Approves Capacity Auction Price Collar to Next
   Two Capacity Auctions"; troutmanenergyreport.com 2026-05, checked 2026-08-17). Three straight
   auctions have cleared at their cap: $329.17 (2026/27, results 2025-07-22), $333.44 (2027/28,
   results 2025-12-17), $325.00 (2028/29, results 2026-07-14). PJM's own simulations put the
   uncapped price far higher each time (~$389, ~$530, $554–777 per the companion doc). Any
   thesis needing the cap to expire remains a lottery ticket.
3. **"The auction is the purest public price of scarcity."** MIXED — the collar now censors the
   price signal. With the clearing price pinned, the informative variables are the **shortfall
   vs the reliability requirement** (6,625 MW short in Dec 2025; 6,831 MW short in July 2026 per
   the companion doc) and PJM's published uncapped-price simulation. A below-cap clear — supply
   actually responding — would be the genuine surprise, and a bearish one for the whole
   scarcity-rent layer.
4. **Reaction function — how do IPP equities trade the print?** SUPPORTED, and **decaying**.
   Results 2025-07-22 ($329.17 cap): CEG +4.6%, VST +6% after-hours (investing.com/Yahoo
   Finance). Results 2025-12-17 ($333.44 cap): TLN +3.7%, CEG +2.7%, VST +1.6% after-hours
   (Reuters via investing.com). Results 2026-07-14 ($325 cap): no surge reported; VST drifted
   ~−1.9% over the following 30 days amid sector rotation (Yahoo Finance/Simply Wall St
   coverage, checked 2026-08-17). An at-cap clear is now a known number — each successive
   at-cap print has moved the group less. The asymmetry going in: at-cap-again ≈ pre-traded;
   below-cap = negative surprise for IPPs; a large shortfall + hawkish PJM reliability language
   = the bullish-margin surprise.
5. **Do the nine tracked names (NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN) carry
   sensitivity?** REFUTED as a direct play. None is an IPP or PJM equipment name. Second-order
   only: **CRWV** is the most exposed of the nine (leveraged datacenter operator; PJM-footprint
   power costs are its input costs), then **MSFT/AMZN/GOOG/META** as PJM-region power buyers —
   capacity costs are a rounding error against ~$725B combined 2026 capex, but the auction
   feeds the "energy constrains the buildout" narrative that prices their capex productivity.
   NVDA/AVGO/MRVL touch it only through that narrative channel. The names this event actually
   moves (VST, CEG, TLN — plus the sleeve names SPXC/CMI/BWXT/ET) live in
   [`ai-energy-constraint.md`](../ai-energy-constraint.md), where **VST's Tier-2 entry
   condition is explicitly gated on this auction** ("the Dec-15-2026 auction passing with
   credible cap-sunset signals" plus the Texas audit resolving).
6. **Whisper.** Not findable as a number. The functional consensus in coverage (Utility Dive,
   ESAI, sell-side commentary via TipRanks/Morgan Stanley note on Talen) is a fourth straight
   at-cap clear on continued data-center-driven load growth; nobody publishes a
   below-cap-probability estimate. The first *potentially uncapped* print is the 2030/31 BRA,
   ~May 2027 per ESAI's calendar — that, not this, is where price discovery returns.

**What the conditions support.** Nothing on the tracked nine. For the paper sleeve (all labeled
**estimate** while the date is unconfirmed): treat the December print as a scheduled
information event — read shortfall MW, the uncapped simulation, and any regulator language
about the 2030/31 collar; a fourth at-cap clear with a persistent shortfall maintains the
thesis without licensing new entries (the reaction function says at-cap is pre-traded); a
below-cap clear de-risks the merchant-scarcity leg of the sleeve.

**Honest limits.** The exact auction day is unpublished — the 2026-12-15 date is an estimate
and PJM has moved auction schedules repeatedly (the compressed-cycle era ran auctions in July,
December, and June/July). Reaction-function n=3, all after-hours moves from news coverage, not
from an instrument. The whisper section is an absence-of-evidence read. No price instrument
exists for the sector kind, so close-out will score against sourced results, not cached tape.

## Stance & kill switches

**Stance (date estimate — no date-keyed action is licensed regardless).** No action on any
tracked name; this event carries **watch-only** status for the AI-energy sleeve. Base case
(estimate): the 2029/30 BRA clears at the ~$325/MW-day cap for a fourth straight year with a
persistent shortfall vs the reliability requirement, and the equity reaction in IPPs is small —
the collar (confirmed, FERC 2026-04-28) has turned the price into a known number. The
information to harvest at the print: shortfall MW, PJM's uncapped-price simulation, and any
credible cap-sunset signaling toward the ~May 2027 (estimate) 2030/31 auction — the named gate
on VST's Tier-2 entry condition in [`ai-energy-constraint.md`](../ai-energy-constraint.md).

**Stance amendment, 2026-09-08 (receipt: the D-98 ledger row below).** The *call* does not move —
watch-only, no action, date still an estimate. What moves is the claim underneath it. Initial
research (Leg 6) held that "the first *potentially uncapped* print is the 2030/31 BRA, ~May 2027."
That is now wrong on its own terms: PJM's one-time **Reliability Backstop Procurement** (estimate;
FERC docket ER26-3380-000, filed 2026-07-31) carries a **$555/MW-day** cap — 70% above the RPM
collar — with a central bid window ~2026-09-30 to ~2026-10-21 and results targeted ~**2026-12-02**,
i.e. inside this event's own corridor and *ahead* of it. So the December sequence is two prints, not
one: an uncollared-relative-to-$325 procurement first, this collared BRA second. Three consequences,
all held as estimates. **(1)** The information this ledger told itself to wait until May 2027 for
arrives ~2026-12-02 instead; the RBP clearing price is the first observable market price for new PJM
supply in the collar era. **(2)** Whatever the RBP procures (plus PJM's parallel bilateral matching,
opened 2026-08) is supply that did not exist when the 6,831 MW shortfall was measured, so this
auction's shortfall figure is no longer a clean read on the same quantity — a smaller December
shortfall may mean the backstop worked, not that scarcity eased. **(3)** VST's Tier-2 gate stays
**closed**: a separate emergency procurement paying up to $555 is evidence that PJM and FERC will
price scarcity above the collar when reliability forces it, which is *not* the RPM cap sunsetting
that the gate names. Registered as `FT-pjm-capacity-auction-2026-12-1` and `-2` so the tape, not this
paragraph, settles it.

**Stance amendment, 2026-11-15 (receipt: the D-30 ledger row below).** The call does not move —
watch-only, no action. Three things underneath it do. **(1)** The date is **confirmed** by PJM's own
schedule workbook (window 2026-12-09 to 2026-12-15, results 2026-12-22), so the 2026-09-08 amendment's
"two prints, the backstop first" sequence is dead: FERC accepted the backstop on 2026-09-29 but
suspended it to 2027-02-28, and PJM refiled for a 2027-05-10 result (sibling
[`pjm-reliability-backstop-results-2026-12-02`](pjm-reliability-backstop-results-2026-12-02.md)).
The first uncapped-relative-to-the-collar price is therefore not before this auction, and Leg 6's
"first potentially uncapped print is ~May 2027" reading is restored. **(2)** The cap is **$337.83**, not
$325 (PJM planning parameters, 2026-09-03), which makes FT-1's "$325" prediction wrong on its face;
FT-3 re-registers the hypothesis at the right number and a score-by after the results post.
**(3)** FERC's 2026-10-09 order in ER26-3515 rejected the exclusion of new large loads from the
2029/30 demand curve, so the demand side of this auction is the planning-parameters curve, not a
trimmed one. All estimates elsewhere in this paragraph keep their labels; the auction date itself is
**confirmed**.

**Kill switches.**

- **The sequence leg (new, 2026-09-08)** dies if FERC rejects, materially rewrites, or fails to act
  on **ER26-3380** by ~**2026-09-29** — PJM has said it intends to open the window 2026-09-30 only
  if the framework is accepted by then. On that outcome the December sequence collapses back to one
  collared print and the 2026-08-17 "no price discovery until ~May 2027" reading is restored intact.
- **The date leg** dies if PJM's posted schedule moves the auction out of December 2026 or
  publishes a day materially different from Dec 15 → update the calendar entry (as a proposal,
  per the honesty rules) and re-band the cadence.
- **The pre-scripted-print read** dies if FERC or PJM modifies/vacates the collar before the
  auction (a live docket — LS Power and others contested the extension) → the event upgrades
  toward a genuine price-discovery print and likely a higher impact tier.
- **The scarcity leg** (and with it the sleeve's merchant-rent maintenance case) dies on a
  below-cap RTO-wide clear → that is the capacity-response tell from
  [`constraint-watch.md`](../constraint-watch.md) Phase 4, and it de-risks the whole layer.
- **The watch-only stance itself** upgrades to an Eric-facing decision item only if cap-sunset
  signals appear (VST's gate) — never on an at-cap-again print alone.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-120 | Initial research banked (above). Collar confirmed to cover this auction (FERC accepted 2026-04-28, cap ~$325/floor $175 for 2028/29 + 2029/30); last three auctions all cleared at cap with IPP reaction decaying (+6%/+4.6% → +3.7/+2.7/+1.6% → ~flat); exact December day still unpublished — 2026-12-15 stays an estimate (Dec-2025 analog posted results Dec 17). Adjacency: peer prints — none since 8/15 (weekend); NVDA 8/26 confirmed, MRVL 8/27 confirmed, AVGO 9/2 announced per the [NVDA event doc](nvda-2026-08-26-print.md) same-day row. Macro — no prints since 8/15; CPI 9/11 and FOMC 9/16-17 ahead. VIX 14.56 Fri 8/15 close (2026 low) but SKEW +6.6% m/m, Brent +6%/wk — calm index, rising tail-hedge demand. Geopolitical/policy — no new PJM/FERC action since the April collar acceptance found; LS Power collar protest is the live docket. Event tape — consensus = fourth at-cap clear; no published whisper; first potentially uncapped print is the 2030/31 BRA ~May 2027 (est., ESAI calendar) — proposed to the calendar this PR, with the Texas PUCT audit meetings from 8/20 (est., companion-doc dashboard). | — (stance set) | 2026-09-07 (medium, 31+d band: every 21d) |
| 2026-09-08 | D-98 | **Adjacency sweep — this ledger's own "no price discovery until May 2027" claim died, and the December corridor grew a second, louder print.** Probe materiality reason was **`no-reference-baseline`** — the 2026-08-17 initial research never populated a `probe-ref` block, so this pulse could not be screened and was automatically material; that block is written this PR, so the next pulse is screenable. **Event tape — the finding of this row.** PJM filed a one-time **Reliability Backstop Procurement** at FERC on **2026-07-31**, docket **ER26-3380-000**, against the 6,831 MW shortfall from the 2028/29 BRA: central bid window **2026-09-30 → 2026-10-21**, **$555/MW-day** price cap (vs the $325 RPM collar cap), **$20B** maximum budget, commitments up to **15 years**, resources operating by **2032-06-01**, results **targeted 2026-12-02 — before this auction opens** (utilitydive.com/news/pjm-backstop-capacity-auction-ferc-data-centers/826792/, fetched direct 2026-09-08 HTTP 200; corroborated on window-open and term by cpvretail.com 2026-08-14 and on sequencing by foleyhoag.com's note on the PJM Board's 2026-07-27 decisional letter). Both dates proposed this PR as `proposals/pjm-reliability-backstop-procurement-2026-09-30.from-…` and `proposals/pjm-reliability-backstop-results-2026-12-02.from-…`, `estimate`. **The whole chain is conditional:** PJM intends to open on 09-30 only if FERC accepts by **2026-09-29**, and **no FERC order accepting ER26-3380 was found on any search run 2026-09-08** — recorded as an absence, not a denial. **Date leg — unchanged, and actively corroborated.** pjm.com/markets-and-operations/rpm (fetched direct 2026-09-08, HTTP 200) still publishes **no auction day** for the 2029/30 BRA, but it does show the prep sequence running on time for a December auction: Planning Period Parameters posted 7.10.2026, Default New Entry MOPR Offer Prices and Transitional System Capability Study Results 8.25.2026, RPM Existing Resource List 8.27.2026. One source now says "early December" rather than mid- (utilitydive.com/…/826347/), which if anything pulls the estimate *earlier* than 2026-12-15 — the date stays **estimate** and is not amended on a single relayed adjective. **Collar leg — no change.** No FERC or PJM action on the $325/$175 collar found since the 2026-04-28 acceptance; LS Power's opposition remains on the record (its 2026-02-03 letter to the PJM Board) with no rehearing order located. **Peer/equity tape — the IPP complex did NOT trade as one bloc, and none of the dispersion is a capacity read.** Closes 2026-08-17 → 2026-09-04 (09-07 was a full market closure; 09-08 had not settled at write time): **CEG +7.5%** (278.20 → 298.96), **VST +2.2%** (146.11 → 149.30), **NRG −2.7%**, **TLN −11.2%** (356.92 → 317.00, a 52-week low of 301.35 on 08-27), **CRWV −15.7%** (106.00 → 89.36). TLN's decline is attributed in coverage to Q2 earnings digestion and a Cornerstone-acquisition resale overhang — *not* to capacity policy — which is the honest reading: an event whose price is collared did not move these names, and this row makes no attempt to attribute CEG's or CRWV's moves either. **Macro — one genuine surprise, no capacity channel.** 09-04 payrolls **+162k** vs ~53–56k consensus, U-3 4.1%, AHE +3.1% y/y; hike odds ~**58.7%** CME as of 09-07 with Kalshi/Polymarket ~51–52% — the cross-venue gap collapsed to ~6–7 points (sibling [`fomc-2026-09-16`](fomc-2026-09-16.md), which owns that read). Fed blackout runs 09-05 → 09-17; PPI 09-10 and CPI 09-11 land inside it. No transmission to a December capacity auction; recorded to close the sweep, not because it bears on the stance. **Volatility regime — quiet.** VIX **15.42** (09-08, probe `^VIX` bar-close) vs **14.56** at the 2026-08-17 row: **+0.86pt**, under the 3-point materiality bar, still near the 2026 lows. **Geopolitical/policy — one unread item, logged.** PJM filed something at FERC under **EL26-101-000** on **2026-09-04**; the PDF would not parse in this session (no `pdftotext`, WebFetch returned raw binary) and it is recorded in `probe-ref.blocked` rather than characterised. The PJM Inside Lines RBP article returned an **empty body** to WebFetch and is likewise recorded; its content is sourced from Utility Dive and CPV instead, with the prefix left at `NEWS:`. | **Amended, not reversed** — call stays watch-only/stand-aside; the underlying "first uncapped print is ~May 2027" claim is retired and replaced by the two-print December sequence (see the Stance amendment above). Registers `FT-pjm-capacity-auction-2026-12-1` and `-2`. | 2026-09-29 (medium, 31+d band: every 21d) |
| 2026-11-15 | D-30 | **Full session (reason `interval-elapsed`); the last row was D-98 and nothing was recorded since.** **Date leg — now confirmed from a primary source.** PJM's `rpm-auction-schedule.xlsx` (fetched direct 2026-11-15, HTTP 200, 28,146 bytes; unzipped, read as XML) lists the 2029/2030 BRA **window opens 2026-12-09, closes 2026-12-15, results posted 2026-12-22**, all at 12:01 AM / 5:00 PM EPT; PJM's planning-parameters report (2026-09-03, read) says the BRA is 'conducted in December of 2026'. Calendar entry flipped `estimate` -> `confirmed`, source `PJM:`; the date stays 12-15 (the window closing, as titled). **The results land 7 days after the event date and 1 day after FT-1/FT-2's 2026-12-21 score-by**, so FT-1 and FT-2 cannot be scored from results as registered; the close-out should record them `unscoreable — settles 2026-12-22, pjm.com` (or `n/a`/`kill` as their own terms say) and FT-3, registered this PR with score-by 2026-12-23, carries the live test. **Cap leg — a number in this ledger was wrong.** PJM's 2029/30 planning parameters (FERC ER26-1556) set the cap at **$337.83/MW-day** and the floor at **$181.91**, up from $325.00/$175.00 because the reference-resource UCAP factor moved 79% -> 76%; RTO reliability requirement **158,712 MW** (+2,699 MW, +1.7% vs 2028/29), forecast peak 171,916 MW (+3.6%); **PJM WEST newly modeled** (CETL/CETO under 115%); COMED CETL -68%. **Sequence leg — dead.** FERC's 2026-09-29 order accepted but suspended the backstop procurement to 2027-02-28 and PJM refiled 2026-10-29 for a 2027-05-10 result (per the sibling ledger, NEWS-sourced), so FT-2 half (a) fails by the calendar; left open for its scorer, not scored here. **Demand-curve leg.** FERC's 2026-10-09 ER26-3515 order (PJM-hosted order PDF listed; coverage via APPA/mgrid/energynewsbeat, per the IRAS ledger) **rejected** excluding new large loads from the 2029/30 curve; updated VRR curves, if any, were due ~30 days before the auction (about 2026-11-09) and I did not find a posting. **New docket — Exelon complaint, EL27-11-000, filed 2026-11-03** (PJM-hosted PDF, 111 pages, read locally with pypdf): asks FERC under FPA 206 to find RPM's three-year-forward period unjust and unreasonable and order a 'prompt' auction two months before each delivery year **starting with 2030/2031**, fast-track, order requested by January 2027. It does not touch this auction (2029/30) and cannot be ruled on before it runs; it is the live threat to the ~May 2027 2030/31 auction's schedule. **Other dated items, named not proposed (horizon leash):** the EL26-67 large-load tariff-reform filings are due 2026-11-16 per search-relayed coverage (1 day out, one-day notice, no primary read, no capacity-auction channel); results 2026-12-22 is this event's own milestone and is 37 days out (past the 30-day floor for medium). **Maryland OPC** wrote PJM's Board 2026-08-28 against running the auction on this timeline and PJM's CEO replied 2026-09-01 (PDF unreadable to the fetcher, content not characterised); the schedule in the workbook is unchanged since. **Peers (not read as a capacity signal), closes 09-04 -> 11-13, `market-data.mjs`, caches busted:** VST 149.06 -> 133.01 (-10.8%), CEG 298.96 -> 280.20 (-6.3%), TLN 317.00 -> 376.01 (+18.6%), NRG 118.43 -> 97.10 (-18.0%), CRWV 89.36 -> 53.13 (-40.5%); nothing sourced ties any move to this auction, which is collared. **Macro:** no capacity channel; CPI 12-10 and retail sales 12-16 are strong-set neighbors. **VIX 19.30** (11-13 close) vs 15.42 at the last row, **+3.9pt**, a regime break; options-shaped plays on the sleeve cost more. **Event tape:** analyst expectation in coverage is a fourth at-cap clear (Jefferies); Mizuho earlier argued prices 'could land anywhere within the collar, potentially at the floor' (search-relayed, undated, not primary). Conviction proposals and declared intents: none printed. | **Amended, not reversed** — stand aside on all four horizons; date confirmed, cap restated to $337.83, December sequence collapsed to one print. Registers `FT-pjm-capacity-auction-2026-12-3`. | 2026-11-17 (medium, 8+d band: every 7d) |
| 2026-11-22 | D-23 | Pulse (reason `interval-elapsed`; last row D-30). **Date leg — unchanged, re-verified.** PJM's `rpm-auction-schedule.xlsx` re-fetched direct 2026-11-22 (HTTP 200, 28,146 bytes) is **byte-identical** to the 2026-11-15 read (sha256 `4769218c…b6f45`): window 12-09 to 12-15, results 12-22. The RPM page (pjm.com/markets-and-operations/rpm, fetched direct) lists dated 2029/30 postings through 11-20 (Transitional System Capability Study Results BRA 11-11, FRR Resource List 11-13, Unit Specific Parameter Adjustment FAQs 11-20) and **no revised VRR curve, notice or schedule change**; the ~11-09 updated-curve posting the last row could not find is still not found (absence, not a denial). **Collar leg — no change** found: no FERC or PJM action on the $337.83/$181.91 collar since ER26-1556 and the 10-09 ER26-3515 order. **Cap restated** in WebSearch snippets still as $325 (a 2028/29 figure); PJM's own parameters report stays the source for $337.83. **Docket leg.** Exelon EL27-11 (filed 11-03) still pending; its own text says it does not touch December and asks for an order by 2027-01-31, so it cannot reach this auction. The EL26-67 large-load abeyance ran to **2026-11-16** and PJM planned several FPA 205 filings 'on or about' that day; search returned the setup but **no filing text**, so what was filed is unread here (no capacity-auction channel; the demand-curve question is settled by ER26-3515). A 2026-09-30 PJM filing (ER26-3898) asks FERC to accept default-CONE revisions tied to the periodic VRR review by **2026-11-29** (effective 11-30); outcome unconfirmed and its auction applicability unread, so it is named, not proposed, and watched as a possible demand-curve input. **Volatility regime — a break, and the largest move this ledger has recorded.** VIX **35.89** (11-20 close, intraday high 40.03) vs 19.30 at the 11-15 row, **+16.6pt** (path 22.91 / 25.46 / 24.56 / 28.44 / 35.89 since 11-13); sibling ledgers date the backdrop to a hot CPI 11-10, hike pricing for the 12-09 FOMC and an S&P 500 correction (SPY -8.6% in five sessions). Options-shaped plays on the sleeve now cost far more; nothing here is options-shaped, and a collared auction price is not a function of VIX. **Peers (not read as a capacity signal), closes 11-13 -> 11-20, `market-data.mjs`, caches busted:** VST 133.01 -> 115.25 (-13.4%), CEG 279.77 -> 237.41 (-15.1%), TLN 376.01 -> 332.92 (-11.5%), NRG 97.10 -> 87.80 (-9.6%), CRWV 53.13 -> 39.51 (-25.6%); every name fell on 11-20 alone (VST -7.2%, CEG -5.8%, TLN -6.5%, NRG -6.4%, CRWV -12.0%), the day VIX closed +7.5pt, so the move is a risk-off tape across the AI-power complex, not a capacity-policy print; no sourced news ties any of it to this auction, whose price is collared. Cumulative since the 09-04 row: VST -22.7%, CEG -20.6%, CRWV -55.8%, TLN +5.0%, NRG -25.9%. The 11-05 midterm result (Democrats took both chambers; coverage ties a VIX spike to AI data-center build-out risk) is context for the group's de-rating, not a dated event for this auction. **Event tape:** no preview, whisper or consensus change found; coverage still reads a fourth at-cap clear (Jefferies, last row), BMO expects the RBP target to shrink (10-01, pre-refiling). **Peers/macro prints:** NVDA printed 11-18 (sibling ledger owns it); no capacity channel. **Corridor:** 12-10 to 12-20 holds CPI 12-10, the 12-11 funding cliff, retail sales 12-16 and opex 12-18, all tracked; `--on-date` for 12-09 and 12-22 shows no un-tracked PJM item. **Results day 12-22 is now 30 days out (inside the horizon) but is this event's own milestone** and already sits in the canonical notes and FT-3's score-by, so it is not proposed as a second entry; the calendar date stays the window close and the close-out is held for FT-3. Conviction proposals: none (`conviction-proposals.mjs`). Declared intents: none (`intents.mjs`). FT-1..3 unchanged and unscored. | — (stance holds on all four horizons; date, cap and one-print sequence reconfirmed) | 2026-11-29 (medium, 8+d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.

**Last assessed:** 2026-11-15
<!-- probe-ref: {"symbols":{},"vix":19.3,"daysBand":"medium:8+","adjacentIds":["boe-decision-2026-12-17","boj-decision-2026-12-18","boj-tankan-2026-12-14","cpi-2026-12-10","cr-expiry-2026-12-11","ecb-decision-2026-12-17","empire-state-mfg-2026-12-15","ercot-data-center-audit-filing-2026-12-10","g20-miami-2026-12-14","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","housing-starts-2026-12-17","import-export-prices-2026-12-17","industrial-production-2026-12-16","intl-transactions-q3-2026-12-18","japan-cgpi-2026-12-10","japan-cpi-2026-12-18","livingston-survey-2026-12-11","mtis-2026-12-16","mts-november-2026-12-10","mu-2026-12-16-print","nahb-hmi-2026-12-16","ndx-annual-reconstitution-announcement-2026-12-11","opex-2026-12-18","pending-home-sales-2026-12-17","philly-fed-mfg-2026-12-17","ppi-2026-12-15","puct-batch-zero-report-open-meeting-2026-12-17","qss-q3-2026-12-10","retail-sales-2026-12-16","russell-reconstitution-2026-12-11","sp-global-investment-manager-index-2026-12-15","sp-rebalance-reference-close-2026-12-11","tic-monthly-2026-12-15","treasury-30y-bond-2026-12-10","treasury-coupon-announcement-2026-12-17","uk-cpi-2026-12-16","uk-gdp-monthly-2026-12-11","uk-labour-market-2026-12-15","uk-ppi-2026-12-16","uk-retail-sales-2026-12-18"],"adjacentStrongIds":["cpi-2026-12-10","opex-2026-12-18","retail-sales-2026-12-16"],"screenStreak":0,"blocked":[{"url":"https://www.pjm.com/-/media/DotCom/about-pjm/who-we-are/public-disclosures/2026/20260901-pjm-president-ceo-response-to-md-office-of-peoples-counsel-letter-regarding-base-residual-auction-2029-2030.pdf","status":"PDF_UNPARSED","at":"2026-11-15"}]} -->

**Last assessed:** 2026-11-22
<!-- probe-ref: {"symbols":{},"vix":35.89,"daysBand":"medium:8+","adjacentIds":["boe-decision-2026-12-17","boj-decision-2026-12-18","boj-tankan-2026-12-14","cpi-2026-12-10","cr-expiry-2026-12-11","ercot-data-center-audit-filing-2026-12-10","g20-miami-2026-12-14","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","housing-starts-2026-12-17","import-export-prices-2026-12-17","industrial-production-2026-12-16","intl-transactions-q3-2026-12-18","japan-cgpi-2026-12-10","japan-cpi-2026-12-18","jgb-20y-auction-2026-12-17","livingston-survey-2026-12-11","mtis-2026-12-16","mts-november-2026-12-10","mu-2026-12-16-print","nahb-hmi-2026-12-16","ndx-annual-reconstitution-announcement-2026-12-11","opex-2026-12-18","pending-home-sales-2026-12-17","philly-fed-mfg-2026-12-17","ppi-2026-12-15","puct-batch-zero-report-open-meeting-2026-12-17","qss-q3-2026-12-10","retail-sales-2026-12-16","russell-reconstitution-2026-12-11","sp-rebalance-reference-close-2026-12-11","tic-monthly-2026-12-15","treasury-30y-bond-2026-12-10","treasury-coupon-announcement-2026-12-17","uk-cpi-2026-12-16","uk-gdp-monthly-2026-12-11","uk-labour-market-2026-12-15","uk-ppi-2026-12-16","uk-retail-sales-2026-12-18","vix-expiration-2026-12-16"],"adjacentStrongIds":["cpi-2026-12-10","cr-expiry-2026-12-11","government-funding-deadline-2026-12-11","mu-2026-12-16-print","opex-2026-12-18","retail-sales-2026-12-16"],"screenStreak":0,"blocked":[]} -->
