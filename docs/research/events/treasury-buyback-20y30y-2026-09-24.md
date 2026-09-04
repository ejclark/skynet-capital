# Treasury liquidity-support buyback operation (20-30Y nominal, 1:40pm ET) — treasury-buyback-20y30y-2026-09-24

**Kind:** rates · **Date:** 2026-09-24 (estimate, EST: treasury.gov Tentative Schedule of Treasury Buyback Operations, Q3 2026 refunding, published 2026-08-05 — announce 09-23, operation 09-24 1:40–2:00pm ET, settle 09-25, 20-30Y nominal, maturity range 09/25/2046 - 09/24/2056, max $2B; tentative, and that cap predates press release sb0607 — checked 2026-09-02) · **Impact:** medium
**Last assessed:** 2026-09-02
<!-- probe-ref: {"symbols":{},"vix":16.34,"daysBand":"medium:8+","adjacentIds":["consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","jolts-2026-09-29","mu-2026-09-29-print","scoos-2026-09-24","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","trump-xi-summit-2026-09-24"],"screenStreak":0} -->

## At a glance

**TL;DR.** A **read, not a trade** — and this doc's job is to correct two things the calendar
currently believes. Treasury's tentative Q3 schedule (**estimate**) puts a routine 20-30Y
liquidity-support buyback at **1:40–2:00pm ET on 2026-09-24**. It is the first 20-30Y operation on
or after sb0607's 09-09 effective date, so its announced maximum should step from the schedule's
stale **$2B** to **at least $4B**. Correction one: this operation **cannot buy the 30-year bond
auctioned on 9/10** — CUSIP 912810UW6 (matures 2056-08-15) sits inside the maturity range but fails
Treasury's own eligibility rules twice over (on-the-run, and not past its first coupon date of
2027-02-15), and the 8/18 operation's eligible list proves it mechanically by stopping at the
Feb-2056 bond. Correction two: **the cap is a ceiling, not a purchase** — on 2026-03-19 Treasury was
offered **$36.0B** in this exact sector and took **$205M**, a tenth of the then-$2B cap. So the
number to read on 9/24 is not offers, it is **accepted vs the announced cap**. No position keyed to
any of it, and nothing that afternoon is cleanly attributable anyway (7Y auction 1:00pm, this
operation 1:40pm, SCOOS 2:00pm, the Trump-Xi summit the same day).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/2, D-22) | Stand aside | High | Operation is 22 days out, its whole enlarged program is worth ~1bp of 10Y support through year-end (BofA via press, 8/26), and its own parameters are still **estimate** — there is nothing here to trade. | Treasury publishing the promised updated buyback schedule before **2026-09-23** with a materially bigger lever than $4B/op — more sectors, higher frequency, or cash-management scale |
| This week | Watch the **2026-09-10** 10-20Y operation as the dress rehearsal | Medium | Its 09-09 announcement is the first hard test of whether sb0607's ≥$4B cap actually reaches a scheduled operation, and its accepted-vs-cap fill rate previews what this one will do. | The **2026-09-09** announcement printing a maximum of $2B — sb0607 would then not be flowing into scheduled operations, and this event's ≥$4B base case dies with it |
| This month | Read the 9/23 announcement and the 9/24 result, don't trade either | Medium | Two numbers matter: the announced maximum (≥$4B?) and **par accepted vs that cap** — the 3/19 precedent ($205M of $2B on $36.0B offered) makes fill rate, not offer volume, the honest gauge. | The **2026-09-24** 1:40–2:00pm ET window moving 20-30Y yields >5bp on its own with no auction/Fed/fiscal news — that would refute the "too small to matter" read |
| This quarter | Stand aside on the program as a yield driver | Medium | Eleven 20-30Y operations in 2026 bought $2B par each (bar 3/19's $205M) against $19.9–36.5B of offers — the constraint was never dealer willingness, so doubling the cap changes a rounding error into a slightly larger rounding error. | Long-end yields easing durably across both the 9/10 and 9/24 operations with no macro explanation, or Treasury escalating past $4B/op at the **2026-11-04** refunding |

**Signals & conditions** — the buy/sell/hold triggers:

- **9/23 announced max ≥ $4B** — sb0607 supersedes the stale schedule; propose flipping this entry
  to `confirmed` only against the posted primary (`TSY:`), never against press.
- **9/23 announced max = $2B** — the increase did not reach this operation; reassess this doc and the
  `treasury-buyback-increase-2026-09-09` sibling, whose stance carries the same premise.
- **9/24 accepted ≈ the full announced cap** — normal; the 2026 pattern (ten of eleven operations
  filled to the cap) held. Not a trigger for anything.
- **9/24 accepted well under the cap** — the 3/19 case repeating: offers arrived off Treasury's
  relative-value marks. That is a *pricing* signal about the long end, not a demand signal, and it
  belongs in the corridor's stance docs as one sentence.
- **Never** — no position keyed to this operation, and no attribution of 9/24's tape to it; three
  other dated events share that afternoon.
- **Watch (dated)** — 10-20Y operation **9/10** · CPI **9/11** · FOMC **9/15–16** · 2Y **9/22** ·
  5Y + this operation's announcement **9/23** · 7Y auction, this operation, SCOOS, Trump-Xi **9/24**
  · refunding **11/4**.

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

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
