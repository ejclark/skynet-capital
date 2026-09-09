# Treasury liquidity-support buyback operation (20-30Y nominal, 1:40pm ET) — treasury-buyback-20y30y-2026-09-24

**Kind:** rates · **Date:** 2026-09-24 (estimate, EST: treasury.gov Tentative Schedule of Treasury Buyback Operations, Q3 2026 refunding, published 2026-08-05 — announce 09-23, operation 09-24 1:40–2:00pm ET, settle 09-25, 20-30Y nominal, maturity range 09/25/2046 - 09/24/2056, max $2B; tentative, and that cap predates press release sb0607 — checked 2026-09-02) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:8+","adjacentIds":["case-shiller-hpi-2026-09-29","census-benchmark-revision-nsa-2026-09-28","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","fhfa-hpi-2026-09-29","jgb-40y-auction-2026-09-29","jolts-2026-09-29","meta-connect-2026-09-23","missouri-map-tro-expiry-2026-09-22","missouri-uocava-ballot-mailing-2026-09-19","new-home-sales-2026-09-24","retail-benchmark-revision-2026-09-28","russell-quarterly-ipo-review-effective-2026-09-21","scoos-2026-09-24","sp-quarterly-rebalance-effective-2026-09-21","steel-imports-preliminary-2026-09-24","treasury-2y-frn-2026-09-23","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-tips-1y10y-2026-09-29","trump-xi-summit-2026-09-24","umich-sentiment-final-2026-09-25","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-expiry-2026-09-26"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** A **read, not a trade**, and as of 9/9 the read has one fewer assumption in it. Treasury's
tentative Q3 schedule (**estimate**) puts a routine 20-30Y liquidity-support buyback at **1:40–2:00pm
ET on 2026-09-24** — the first 20-30Y operation after sb0607's 09-09 effective date, so its announced
maximum should step from the schedule's stale **$2B** to **at least $4B**. Both primaries behind that
sentence now fetch directly (sb0607 and the schedule PDF, read this session), which is new. What
changed in substance: **stop assuming Treasury fills the cap.** Every 2026 operation in a bucket that
*already* carried a $4B cap filled it only partially — 0 of 12 full fills — while this bucket's
perfect 10-of-11 record was set against a $2B cap that was simply low. Priced at $4B, 2026's eleven
20-30Y operations would have run at a **median 6.28x** cover and the last three would all sit
**under 6x**, on an offer book that has shrunk since April ($36.5B → $19.9B). Two standing
corrections hold. (1) This operation still **cannot buy the 30-year bond auctioned 9/10** — and now
prospectively: neither the May-2056 nor the Aug-2056 bond passes a first coupon before 9/24, so the
9/23 eligible list should stop at the **Feb-2056** bond exactly as 8/18's did. (2) **The cap is a
ceiling, not a purchase** (3/19: $36.0B offered, $205M taken). Read the 9/23 announced maximum and
the 9/24 **offers and accepted-vs-cap**; trade nothing. Nothing that afternoon is cleanly attributable
anyway — 7Y auction 1:00pm, this operation 1:40pm, SCOOS 2:00pm, plus the ECB bulletin and the
Trump-Xi summit the same day.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/9, D-15) | Stand aside | High | Operation is 15 days out, its whole enlarged program is worth ~1bp of 10Y support through year-end (BofA via press, 8/26), and its own parameters are still **estimate** — meanwhile Brent ran **+10% to $99.51** in six sessions, an inflation-side force on the long end orders of magnitude larger than this. | Treasury publishing the promised updated buyback schedule before **2026-09-23** with a materially bigger lever than $4B/op — more sectors, higher frequency, or cash-management scale |
| This week | Watch the **2026-09-10** 10-20Y operation as the dress rehearsal | Medium | Its 09-09 announcement (11:00am ET) is the first hard test of whether sb0607's ≥$4B cap reaches a scheduled operation, and its offers-and-fill previews this one. As of 9/8 20:54 ET no 9/10 operation was yet posted to `buybacks_operations` — the announcement had not run. | The **2026-09-09** announcement printing a maximum of $2B — sb0607 would then not be flowing into scheduled operations, and this event's ≥$4B base case dies with it |
| This month | Read the 9/23 announcement and the 9/24 result, don't trade either | Medium | Three numbers now, not two: announced maximum (≥$4B?), **total par offered** (≥$24B is the ~6x cover above which 2026's operations reliably filled), and **par accepted vs cap**. A partial fill is Treasury's price discipline, not weak demand. | The **2026-09-24** 1:40–2:00pm ET window moving 20-30Y yields >5bp on its own with no auction/Fed/fiscal news — that would refute the "too small to matter" read |
| This quarter | Stand aside on the program as a yield driver | Medium | Doubling a cap that only sometimes binds changes a rounding error into a slightly larger rounding error; +$2B × the ~7 long-end operations to 11/4 is ~$14B against **$61B** of 10Y+30Y supply in the week of 9/9 alone. | Long-end yields easing durably across both the 9/10 and 9/24 operations with no macro explanation, or Treasury escalating past $4B/op at the **2026-11-04** refunding |

**Signals & conditions** — the buy/sell/hold triggers:

- **9/23 announced max ≥ $4B** — sb0607 supersedes the stale schedule; propose flipping this entry
  to `confirmed` only against the posted primary (`TSY:`), never against press.
- **9/23 announced max = $2B** — the increase did not reach this operation; reassess this doc and the
  `treasury-buyback-increase-2026-09-09` sibling, whose stance carries the same premise.
- **9/24 offers ≥ ~$24B** — ~6x cover at a $4B cap, the band in which 2026's operations filled; a
  full fill would then be unremarkable rather than informative.
- **9/24 offers well under $24B and a partial fill** — the price test binding, as it does in every
  other $4B bucket. That is a *pricing* signal about the long end, not a demand signal, and it
  belongs in the corridor's stance docs as one sentence.
- **9/23 eligible list extending past 912810UR7 (2056-02-15)** — the first-coupon reading is wrong;
  correct this doc and the 30Y sibling immediately.
- **Never** — no position keyed to this operation, and no attribution of 9/24's tape to it; four
  other dated events share that afternoon.
- **Watch (dated)** — 10-20Y operation **9/10** · CPI **9/11** · FOMC **9/15–16** · 7-10Y operation
  **9/17** · 2Y **9/22** · 5Y + 2Y FRN + this operation's announcement **9/23** · 7Y auction, this
  operation, SCOOS, ECB bulletin, Trump-Xi **9/24** · JGB 40Y **9/29** · refunding **11/4**.

## Initial research

**The question, plainly:** a 20-30Y liquidity-support buyback is scheduled for 1:40pm ET on
2026-09-24, the first in its sector after Bessent's doubled cap took effect. Is it mechanically
what the calendar says it is, does it support the long bond auctioned two weeks earlier, how big
will it actually be, what does its result tell us, and does any of it justify a position?

**One-line verdict:** it is a **data release with two corrections attached** — it cannot bid for the
bond the calendar says it covers, and its cap has never been a promise of what Treasury buys; read
the 09-23 announced maximum and the 09-24 **accepted-vs-cap fill rate**, and trade nothing.

**Method.** Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (rates
mode: no price instruments). The material advance this session is that
**`api.fiscaldata.treasury.gov` is reachable from this sandbox** — the sibling
[`treasury-buyback-10y20y-2026-09-10`](treasury-buyback-10y20y-2026-09-10.md) logged its
unreachability on 2026-08-30 as that doc's "largest open gap," so every operation-level figure below
is now primary rather than press-narrated: the `buybacks_operations` and `buybacks_security_details`
endpoints, queried 2026-09-02. Eligibility rules from TreasuryDirect's buyback FAQ (direct read,
2026-09-02). Programme parameters from press release sb0607 and the Q3-2026 tentative schedule —
**both direct fetches timed out again this session**, the same gated-primary limit both siblings
logged; sb0607's terms are recovered from a search index over the treasury.gov file plus convergent
press, and the schedule row is inherited from the 2026-09-02 direct PDF text-layer read recorded in
this event's own `market-events-data.ts` source string. Rates/vol levels from the same-day
`treasury-30y-bond-2026-09-10` ledger (assessed 2026-09-02) and the repo's own probe (VIX 16.34).

### Conviction legs, tested

1. **The operation exists with these parameters — SUPPORTED (gated-primary caveat).** Announce
   **09-23**, operate **09-24 1:40–2:00pm ET**, settle **09-25**, Liquidity Support, Nominal Coupons
   **20Y to 30Y**, maturity range **09/25/2046 - 09/24/2056**, min $0 / max $2B. The entry stays
   `status: "estimate"`: a tentative schedule is tentative by construction, sb0607 explicitly says
   "an updated tentative Treasury buyback schedule will be released at a later date," and Treasury
   already overrode this very schedule two weeks after publishing it (the 8/19 size increase). The
   `estimate` label here is substantive, not a formality.

2. **The $2B cap is stale; ≥$4B is the live expectation, testable 2026-09-23 — SUPPORTED.** sb0607
   (2026-08-19) raises the maximum for nominal long-end liquidity-support buybacks from **$2B to at
   least $4B per operation** in both the 10-20Y and 20-30Y sectors, **effective 2026-09-09 through
   2026-11-04**, with further sizing addressed at the 2026-11-04 refunding. No 20-30Y operation falls
   between 09-09 and 09-24, so this is the **first** operation in its sector at the new cap. Both
   numbers are **estimate**-labeled until the 09-23 announcement posts.

3. **This operation cannot buy the bond auctioned on 2026-09-10 — REFUTES the calendar's own note.**
   The `market-events-data.ts` entry (written during the 09-02 30Y sweep) says this is "the operation
   whose maturity range actually COVERS the bond sold at treasury-30y-bond-2026-09-10 (CUSIP
   912810UW6, maturing 2056)." True on range, false on eligibility. TreasuryDirect's buyback FAQ
   (direct read 2026-09-02) excludes, verbatim, **on-the-run securities** — "the most recently issued
   Treasury security of a given maturity" — and **securities "not past their first coupon payment
   date"** (plus anything trading significantly special in repo). 912810UW6 was auctioned 2026-08-13
   at 5.216% and issued 2026-08-17, matures **2056-08-15**, and pays its first coupon **2027-02-15**;
   the 9/10 event reopens it, which leaves it on-the-run. It fails both tests. The primary data
   confirms the rule mechanically: the **2026-08-18** 20-30Y operation's eligible list ran 912810RV2
   (2047-02-15) through 912810UR7 (**2056-02-15**) and omitted both the May-2056 and Aug-2056 issues
   — exactly the two bonds not yet past a first coupon. **So the nearest direct liquidity support for
   the reopened long bond is not 14 days after its auction; on current rules it does not exist**, and
   the calendar note is corrected in this PR.

4. **The cap is a ceiling, not a purchase — SUPPORTED, and the leg that most changes how to read the
   result.** Treasury accepts offers "based on their proximity to prevailing market prices at the
   close of the operation, as well as measures of relative value" (FAQ, direct read 2026-09-02) — a
   price test, not a quota. On **2026-03-19**, in this exact sector, 35 issues were eligible, dealers
   offered **$36,003,000,000**, and Treasury accepted **$205,000,000** across 5 issues — **10% of the
   then-$2B cap** on the largest offer book of the year (`buybacks_operations`, primary, 2026-09-02).
   Every commentary framing that treats the cap as the purchase — including the "$4B of buying" read
   in the August press — is therefore wrong once every eleven operations, in the direction that
   matters.

5. **The 2026 20-30Y series, now from primary data — SUPPORTED, and it kills a floating number.**
   Eleven operations, offered vs accepted (par, `buybacks_operations`, 2026-09-02): 01-14 $25.1B/$2B
   · 02-05 $25.5B/$2B · 02-24 $25.0B/$2B · 03-19 **$36.0B/$0.205B** · 04-09 $36.5B/$2B · 04-28
   $35.6B/$2B · 06-03 $21.3B/$2B · 06-25 $21.3B/$2B · 07-16 $30.5B/$2B · 07-28 $21.9B/$2B · 08-18
   **$19.9B/$2B**. Two readings fall out. (a) 8/18 was indeed the **smallest offer book of the 2026
   run**, as FXStreet reported — but the trend since April is a *shrinking* offer book (36.5 → 19.9),
   which is the opposite of an inventory-stress story and argues the doubled cap is answering a
   condition that was already easing. (b) The "cover came in at **2.53**" figure circulating in press
   summaries of the 8/18 operation is **not** offers-to-accepted, which is **9.93x** on the primary
   numbers; the sibling ledger flagged it as unreproducible and it is now positively excluded rather
   than merely doubted. Not carried anywhere.

6. **The economics are tiny, and Treasury buys deep-discount paper — SUPPORTED.** Bank of America
   puts the whole enlarged programme at **~1bp of 10Y support through end-2026** (~6bp only if run to
   2028; note ~2026-08-26 via press). CFR's Patterson (2026-08-19/20) calls buybacks "more signal
   than substance… holding actions, not solutions," and notes even a doubled operation is absorbed
   into ordinary supply/demand. One mechanical detail the headline caps obscure: the cap is in
   **par**, and Treasury buys seasoned low-coupon bonds trading far below par — on 8/18 it took
   912810SC3 (2048) at **$71.469**, 912810SX7 (2051) at **$59.070** and 912810SU3 (2051) at
   **$52.375**, so $2B par cost roughly **$1.3B cash**. A "$4B operation" is not $4B of cash into the
   long end.

7. **Nothing on 2026-09-24 is cleanly attributable — SUPPORTED.** The afternoon carries the **7Y
   auction at 1:00pm** (`confirmed`), this operation at 1:40pm (**estimate**), **SCOOS at 2:00pm**,
   and the **Trump-Xi summit** (**estimate**) the same day, after 2Y on 9/22 and 5Y on 9/23. Any
   20-30Y move in the 1:40–2:00pm window has at least three other candidate causes; attributing it to
   the buyback is a misread by construction.

8. **Tracked-name sensitivity — ranked, but honestly de-weighted.** `symbols: []` — market-wide,
   through the rate-duration channel. At ~1bp of programme effect no tracked name's exposure to
   *this operation* is distinguishable from noise; the ranking is inherited context, not a live
   signal: **CRWV** most exposed (debt-financed datacenter build — cost of capital and discount rate
   both; **-3.58% to $81.85** on 9/1), then high-multiple semis **NVDA / AVGO / MRVL**, then **MSFT /
   GOOG / META**, least **AAPL / AMZN**.

**What the conditions support.** Nothing directional — the house playbooks (S1/S2/E1/S3/S4 + G1) are
symbol- and earnings-keyed, and no macro/rates playbook exists. What travels is a sharper reading
discipline than the sibling docs carried: **fill rate over offer volume** (leg 4), and **eligibility
over maturity range** when asking whether a buyback supports a specific auction (leg 3).

**Honest limits.** sb0607 and the Q3 schedule PDF both timed out on direct fetch again; their terms
rest on a search index over those same treasury.gov files plus convergent press, and on the 09-02
PDF text-layer read recorded in this event's calendar source string. The 3/19 under-fill has **no
published explanation** found — the price-test rule explains *how* it can happen, not *why* it did
that day; treat it as a demonstrated possibility with an unknown trigger, not a predictable one. The
BofA ~1bp figure is press narration of a client note, not the note. No 9/24-specific forecast exists
anywhere; the 09-23 announced maximum will be this event's first hard number.

## Stance & kill switches

**Stance (date and parameters `estimate`-labeled — tentative schedule, primaries not directly
fetchable this session).** The 2026-09-24 20-30Y liquidity-support buyback is a **data release, not
a catalyst**: no position keyed to it, and no attribution of that afternoon's tape to it. Read two
numbers — the **09-23 announced maximum** (does it step to sb0607's ≥$4B?) and the **09-24 par
accepted against that cap**. Base case (**estimate**-labeled): the announcement prints ≥$4B, dealers
offer a high-teens-to-low-twenties multiple of it as they have all year, Treasury fills to the cap,
and the operation passes without a tape effect distinguishable from the 7Y auction, SCOOS and the
summit sharing the day.

**Base case amended 2026-09-09 (D-15) — "Treasury fills to the cap" is withdrawn; see that row.**
The 10-of-11 full-fill record in this bucket was set against a **$2B** cap, and 2026's own tape shows
that record does not survive the cap doubling: across all 54 operations this year, **every**
nominal-coupon bucket already carrying a **$4B** cap fills it only partially (7-10Y, 5-7Y, 3-5Y,
2-3Y — 0 of 12 full fills), while the $4B fills that do occur are all in the 1Mo-2Y bills bucket,
which is not an analogue. Re-pricing this bucket's own eleven 2026 operations at $4B puts cover at
**4.97–9.12x, median 6.28x**, with the three most recent (06-25 **5.33x**, 07-28 **5.48x**, 08-18
**4.97x**) all under the ~6x line above which 2026's nominal operations reliably filled, and only
**1 of the last 5** drawing the ~$24B that clears it. The amended base case: the announcement prints
≥$4B, offers land in the low-$20Bs, and the fill is **conditional on the offer book, not automatic**
— a partial fill would be Treasury's relative-value price discipline (the 2026-03-19 lesson
generalized), never a demand signal, and still not a trigger for anything. This bucket nonetheless
enters the $4B regime better covered than the 10-20Y sibling, whose own 2026 operations land under
6x nine times in eleven.

**Kill switch 6 discharged 2026-09-09 — both gated primaries now read directly, and neither moves the
status.** sb0607 fetched direct (home.treasury.gov/news/press-releases/sb0607, HTTP 200) and its terms
are verbatim what press reported: "The current maximum size of $2 billion per operation will be at
least $4 billion per operation," effective **September 9, 2026** through **November 4, 2026**, in the
10Y-20Y and 20Y-30Y sectors, with future sizing addressed at the 11-04 refunding. The Tentative
Buyback Schedule PDF also fetched direct (HTTP 200, 125,547 bytes, md5 `79b65955…`) and this ledger
read **its own row** at the primary for the first time — announce 9/23/2026, operate 9/24/2026
1:40 pm–2:00 pm, settle 9/25/2026, Liquidity Support, Nominal Coupons 20Y to 30Y,
09/25/2046 - 09/24/2056, min $0, **max $2 billion** — under a masthead still reading "For Publication
August 5, 2026", **21 days** after sb0607. So the status stays `estimate` for the reason it always
did (a tentative schedule is tentative, and its cap is known stale), not for want of a reachable
source; the 09-23 announcement remains the only path to a `TSY:`-sourced hard number.

**Two corrections this doc owns.** (1) The calendar's note that this operation covers CUSIP
912810UW6 is wrong on eligibility — corrected in `market-events-data.ts` in this PR, with the FAQ
rule and the 8/18 eligible-list evidence in the note itself. (2) The cap is not the purchase: the
2026-03-19 precedent ($205M accepted of a $2B cap on $36.0B offered) is the standing counterexample,
and any future row reading "$4B of support" without checking `total_par_amt_accepted` is repeating
the error.

**Kill switches:**

- **The 2026-09-23 announcement prints a maximum other than ≥$4B, or the operation is pulled/moved**
  — leg 2's premise fails; reassess, and flag the `treasury-buyback-increase-2026-09-09` sibling,
  which carries the same premise.
- **The 09-23 preliminary eligible-securities list includes CUSIP 912810UW6** — leg 3 is wrong (or
  the first-coupon rule was waived); correct this doc and the calendar note immediately, because the
  30Y ledger's stance leans on the same eligibility reading.
- **9/24 par accepted lands well under the announced cap** — the 3/19 case repeating; a pricing
  signal about the long end worth one sentence in the corridor's stance docs, still not a trigger.
- **The 1:40–2:00pm ET window on 2026-09-24 moves 20-30Y yields >5bp with no auction/Fed/fiscal
  news** — refutes leg 6's "too small to matter" read, and would make each operation a genuinely
  tracked event rather than plumbing.
- **Treasury publishes the promised updated buyback schedule, escalates past $4B/op, or adds sectors
  or frequency before 2026-11-04** — a materially bigger fiscal lever than anything dated here;
  propose it as its own dated calendar entry rather than folding it into this stance.
- **Any treasury.gov primary (sb0607, the Q3 schedule PDF) becoming directly fetchable** — closes
  this doc's remaining gated-primary limit; re-verify parameters, and if the posted announcement
  gives a primary `TSY:` source, propose flipping this entry's `status` to `confirmed` in that PR.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-02 | D-22 | Initial research banked (above). **Method advance:** `api.fiscaldata.treasury.gov` is reachable this session — the 10-20Y sibling's "largest open gap" (2026-08-30) is closed, and every operation figure here is now primary. **Two corrections.** (1) This operation **cannot bid for CUSIP 912810UW6**: TreasuryDirect's buyback FAQ excludes on-the-run securities and any "not past their first coupon payment date"; that bond was issued 08-17, is reopened 09-10 (so still on-the-run) and first pays 2027-02-15. Proven mechanically by the 08-18 operation's eligible list, which ran 912810RV2 (2047-02-15) → 912810UR7 (**2056-02-15**) and omitted the May- and Aug-2056 issues. The calendar note claiming range coverage = support is corrected in this PR. (2) **Cap ≠ purchase**: on **2026-03-19**, same sector, 35 eligible, **$36.003B offered, $205M accepted** — 10% of the then-$2B cap; acceptance is a relative-value price test, not a quota. **Event tape:** full 2026 20-30Y series pulled (11 ops, $19.9–36.5B offered, $2B accepted every time bar 3/19); 08-18's **$19.868B** was the smallest offer book of the run, and offers have *shrunk* since April ($36.5B → $19.9B), arguing the doubled cap answers an easing condition. The floating "cover 2.53" figure is positively excluded — offers/accepted on 08-18 is **9.93x**. Cash-vs-par nuance: 08-18's $2B par cost ~$1.3B cash (accepted at $71.469 / $59.070 / $52.375). **Macro:** ISM Mfg **54.6** (cons. 55.2) with Prices Paid **71.1**; JOLTS **7.271M**, quits **1.9%**; Sep-16 hike odds **65-68%** (CME FedWatch via press, 08-31/09-01), up from 56-59% a week earlier. **Rates:** 09-01 par curve 2Y **4.39** / 10Y **4.79** / 20Y **5.27** / 30Y **5.27**, 2s30s **88bp**; 30Y quoted **5.286%** on 09-02 — Bloomberg 09-01 calls it the long bond's "worst stretch since 2006." **Volatility:** VIX **16.34** (repo probe, 09-01 close) vs 14.35–14.43 in late August — a two-week high, still inside the 3-point screen threshold. **Geopolitical:** Brent ~$91+ with CFR projecting sub-$76 by year-end; the oil leg of the term-premium story re-fired into 09-01 per the 30Y sibling. **Peers:** n/a (`symbols: []`); high-duration proxy CRWV **-3.58% to $81.85** on 09-01, inside the >5% threshold. **New dated adjacency found, NOT proposed:** sb0607 promises an updated tentative buyback schedule "at a later date" — no date, so it lives in the kill switches, not the calendar. Nothing else new: 09-10 buyback, CPI 09-11, FOMC 09-15/16, 2Y 09-22, 5Y 09-23, 7Y + SCOOS + Trump-Xi 09-24 are all tracked. | — (stance set) | 2026-09-09 (medium, 8-30d band: every 7d) |

| 2026-09-09 | D-15 | **Both gated primaries answered a plain curl this session — kill switch 6 discharged, status unmoved.** `sb0607` read direct (HTTP 200): "$2 billion per operation will be **at least $4 billion** per operation," effective **09-09 through 11-04**, 10-20Y and 20-30Y, sizing revisited at the 11-04 refunding — verbatim what press had carried. The Tentative Buyback Schedule PDF also direct (HTTP 200, 125,547 bytes, md5 `79b65955…`, byte-identical to the siblings' 09-03/05/06/08 pulls), and **this ledger read its own row at the primary for the first time**: announce 9/23, operate 9/24 1:40–2:00pm, settle 9/25, Liquidity Support, Nominal Coupons 20Y to 30Y, 09/25/2046 - 09/24/2056, min $0, **max $2 billion**, masthead still "For Publication August 5, 2026" — **21 days** on, sb0607's promised updated schedule is still unpublished. Status stays `estimate` on tentativeness, no longer on reachability. **Stance change — the base case's "Treasury fills to the cap" is withdrawn.** All 54 of 2026's `buybacks_operations` rows pulled: every nominal-coupon bucket **already** at a $4B cap fills it only partially (7-10Y, 5-7Y, 3-5Y, 2-3Y — **0 of 12** full fills); this bucket's 10-of-11 record was a **$2B** artifact. Re-priced at $4B, its own eleven 2026 operations run **4.97–9.12x** cover (median **6.28x**) versus 9.93–18.00x at $2B, and the three most recent (06-25 5.33x · 07-28 5.48x · **08-18 4.97x**) all sit under the ~6x line; only **1 of the last 5** drew the ~$24B that clears it, the offer book having fallen $36.5B → $19.9B since April. Awkward beside sb0607's own rationale — "significant volume of high-quality offers." Still better covered than the 10-20Y sibling (9 of 11 under 6x). **Leg 3 now holds prospectively, not just retrospectively:** `auctions_query` (direct) dates 912810UU0 (2056-05-15) to a **2026-05-15** issue → first coupon **2026-11-15**, and 912810UW6 (2056-08-15) to **2026-08-17** → first coupon **2027-02-15**, so **neither passes a first coupon before 9/24** and the 09-23 eligible list should stop at **912810UR7 (2056-02-15)**, exactly where 08-18's 36-CUSIP list stopped — the maturity range's top ~2.5 years empty by rule. **Two forward tests registered** (`-1` eligible-list ceiling, score 09-24; `-2` offers < $24.0B, score 09-25). **No escalation:** Treasury's press index re-read direct — latest **sb0623**, two newer than the sibling's 09-08 read, and **no buyback release since sb0607**; kill switch 5 unfired. **Dress rehearsal not yet observable:** at 09-08 20:54 ET the operations dataset's newest row was 09-09's $12.5B 1Mo-2Y cash-management op (results pending) — **no 09-10 operation posted**, its 11:00am ET announcement falling after this session. **Rates — flat, not stressed:** par curve direct (09-08 close) 2Y **4.39** · 10Y **4.80** · 20Y **5.26** · 30Y **5.25** vs 09-02's 4.39/4.79/5.27/5.27 — **30Y −2bp**, 20Y −1bp, 10Y +1bp over the seven days; 20s/30s **+1bp**. No fresh long-end high; the 09-01 "worst stretch since 2006" framing did not extend. **Supply:** 3Y **$58B** stopped 09-08 at **4.474%** (2026's highest 3Y stop) on **2.72x** cover — the best of the last seven 3Y auctions (2.54–2.71) — indirects **61.7%**; 10Y reopening **$39B** 09-09 and 30Y reopening **$22B** (912810UW6) 09-10 still ahead. Front-end demand is not the problem. **Volatility:** VIX **15.72** (09-08 close) vs **16.34** in the probe-ref — **−0.62pt**, inside the 3-point bar; the 09-07 bar is a Labor Day artifact. **Geopolitical — the oil leg is extending:** Brent **$99.51** (09-08 20:47 ET) vs $96.28 on 09-04 and $90.49 on 08-31 — **+10% in six sessions** on resumed US-Iran strikes, with OPEC+ having held October levels 09-06. That is inflation-side pressure on the long end orders of magnitude larger than ~1bp of buyback support. **Peers:** n/a (`symbols: []`). **Adjacency — nothing new to propose:** corridor 11 → **28** ids, every one already tracked; the two worth naming are **`jgb-40y-auction-2026-09-29`** (global long-end supply, a term-premium channel this doc had not carried) and **`ecb-economic-bulletin-2026-09-24`**, a fifth candidate cause on the day itself. `mu-2026-09-29-print` has left the calendar under that id since 09-02. `<id>.json` notes updated; no proposal filed. | **Changed** — base case amended: "Treasury fills to the cap" withdrawn, replaced by a fill conditional on the offer book (~6x cover at $4B); kill switch 6 discharged, kill switch 5 re-checked and unfired | 2026-09-16 (medium, 8-30d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
