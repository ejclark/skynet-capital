# Treasury liquidity-support buyback operation (10-20Y nominal, 1:40pm ET) — treasury-buyback-10y20y-2026-09-10

**Kind:** rates · **Date:** 2026-09-10 (estimate, EST: treasury.gov Tentative Schedule of Treasury Buyback Operations, Q3 2026 refunding, published 2026-08-05 — announce 09-09, operation 09-10 1:40pm ET, settle 09-11; tentative, and its $2B cap predates press release sb0607 — checked 2026-08-30) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","buyback-blackout-start-2026-09-12","cpi-2026-09-11","eia-steo-2026-09-09","fomc-blackout-start-2026-09-05","g20-energy-abundance-ministerial-houston-2026-09-14","gastech-2026-09-14","mts-august-2026-09-11","opec-plus-meeting-2026-09-06","ppi-2026-09-10","sp-rebalance-proforma-capped-2026-09-11","treasury-10y-note-2026-09-09","treasury-20y-bond-2026-09-15","treasury-30y-bond-2026-09-10","treasury-3y-note-2026-09-08","treasury-buyback-increase-2026-09-09","umich-sentiment-prelim-2026-09-11"],"screenStreak":0} -->

## At a glance

**TL;DR.** This is a **data release, not a catalyst** — and the honest call is to read it, never
trade it. Treasury's tentative Q3 schedule (**estimate**) puts a routine liquidity-support buyback
of 10-20Y nominal paper at **1:40–2:00pm ET on 2026-09-10**, forty minutes after the 30Y reopening
closes and the morning before August CPI. Its own economics are tiny: Bank of America puts the
whole enlarged program at **~1bp of support to the 10-year through end-2026** (~6bp only if run to
2028), and one extra $2B per operation is, in one analyst's words, a rounding error beside the $25B
of 30-year supply the August refunding alone printed. What it *is* worth is information — **offer
volume against the cap** is a free gauge of how much long-end paper dealers still want off their
books, going into CPI (9/11) and a live-hike FOMC (9/15–16). Two dated things to catch: the
**2026-09-09 announcement**, which gives this event its first hard number (does the max step to
sb0607's **$4B**, or stay at the schedule's stale **$2B**?), and the operation's offer total. No
position keyed to any of it.

**Updated 9/5 (D-5) — the watch finally has a number.** fiscaldata.treasury.gov's
`buybacks_operations` dataset, unreachable at D-11 and D-7, **answered this session**, closing this
doc's largest open gap with the primary rather than press. The 10-20Y bucket's own 2026 baseline:
**11 operations, every one filling the full $2B cap**, offers averaging **$20.2B** (median $18.4B,
range $7.4–36.1B) — so the cap, never demand, has been the binding constraint all year. And the
**most recent** one, **2026-08-11, drew just $7.40B — the 2026 low by a wide margin** (next-lowest
$15.7B), a **3.7x** cover against a mean near 10x. Its 20-30Y sibling did the same thing a week later
($19.87B on 8/18, now primary-verified as the smallest of that bucket's own eleven). Both long-end
queues printed their thinnest volumes of the year in the two operations immediately *before* sb0607
doubled the cap — which sits awkwardly beside sb0607's stated rationale of "significant volume of
high-quality offers." Nothing here is a trade; it sharpens the read into 9/10 and is registered as
**FT-treasury-buyback-10y20y-2026-09-10-1**. Unchanged: the schedule PDF still reads "For Publication
August 5, 2026" with **max $2 billion** on the 9/10 row (re-fetched 9/5, 17 days after sb0607), so the
**09-09 announcement** is still the only path to a hard number, and Bessent's 8/20 "could be more than
the 4 billion per issue" keeps **$4B a floor with an open ceiling**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/5, D-5) | Stand aside | High | Five days out, parameters re-verified off the primary and unchanged, and the whole enlarged program is worth ~1bp of 10Y support through year-end (BofA, 8/26) — there is nothing here to trade. A hot jobs print (9/4: **162K** vs ~53K cons.) bear-flattened again and the long end *eased* into it (30Y 5.27→**5.24**), which mutes the program's urgency rather than raising it. | A Treasury statement before **2026-09-09** expanding the program past sb0607's $4B/op, or adding sectors/frequency — a materially bigger lever than what's dated here |
| This week | Watch the **2026-09-09** operation announcement | Medium | Announced one business day prior, it carries this event's first hard number: whether the maximum steps to **$4B** (sb0607, effective 09-09), stays at the schedule's stale **$2B**, or clears $4B on Bessent's 8/20 "could be more" — all three are live. Estimate-labeled until posted. | The **2026-09-09** announcement not posting, or posting a sector/date other than 10-20Y / 09-10 — which breaks the tentative schedule this whole entry rests on |
| This month | Read the offer print against its own baseline, don't trade it | Medium | The watch is now numeric: 2026's eleven 10-20Y operations averaged **$20.2B offered** and filled the **$2B** cap every time, but 8/11 drew only **$7.40B** (fiscaldata, primary, 9/5). At a $4B cap that queue is ~1.9x, not ~10x. The same-day 30Y reopening (**$22B**, announced 9/3) and CPI on 9/11 will own any tape move, so crediting a 1:40pm buyback for it is a misread. | The **2026-09-10** 1:40–2:00pm ET window moving 10-20Y yields >5bp on its own, with no auction/CPI/Fed news — that would refute the "too small to matter" read |
| This quarter | Stand aside on the program as a yield driver | Medium | ~1bp of 10Y support is the best quantification available, and the long end sits at 10Y **4.78** / 20Y **5.25** / 30Y **5.24** (9/4 par curve) — off the 9/1–9/2 highs but still near 2026 extremes, with deficits, corporate issuance and the Fed path the actual drivers. | Long-end yields easing durably across both the 9/10 and **2026-09-24** operations with no macro explanation, or Treasury escalating beyond $4B/op or confirming TGA funding before **2026-11-04** |

**Signals & conditions** — the buy/sell/hold triggers:

- **9/9 announced max = $4B** — sb0607 supersedes the stale tentative schedule; propose flipping this
  entry to `confirmed` only against the posted primary (`TSY:`), never against press.
- **9/9 announced max > $4B** — added 9/3: Bessent's 8/20 "could be more than the 4 billion per
  issue," conditioned on market conditions, and long-end yields have made fresh highs since. Read it
  as a Treasury escalating into weakness, not as a bullish surprise; still not a trigger.
- **9/9 announced max = $2B** — the increase did not reach this operation; the correction belongs to
  the `treasury-buyback-increase-2026-09-09` sibling's stance, not this one.
- **Offers ≫ cap on 9/10 with long-end yields still rising** — size was never the binding constraint;
  the structural-supply read holds, caution stays wide on high-duration names into 9/11 and 9/15–16.
  Numerically: **≳$20B offered**, this bucket's 2026 mean (added 9/5, fiscaldata primary).
- **Offers thinning toward the cap with yields stabilizing** — "well-timed plumbing"; a mild positive
  for the long-end technical, still not a trigger for anything. Numerically: **≲$8B offered**, i.e.
  8/11's $7.40B repeating against a doubled cap (added 9/5).
- **Offers below $15.7B on 9/10** — added 9/5: the registered forward test
  **FT-treasury-buyback-10y20y-2026-09-10-1**. Below every 2026 10-20Y print except 8/11's, it says
  the queue thinned *structurally* rather than August being a one-off. A read, not a trigger.
- **Treasury accepts less than the announced maximum** — would be the first miss in 11/11 of 2026's
  10-20Y operations. Not impossible on price alone: on 2026-03-19 the 20-30Y bucket took just **$0.20B**
  against a $2B cap with **$36.0B** offered (fiscaldata), so a full fill is never mechanical.
- **Never** — no position keyed to this operation, and no attribution of 9/10's tape to it.
- **Watch (dated)** — 3Y **9/8** · 10Y reopening + buyback-size effective date **9/9** · this
  operation + 30Y reopening **9/10** · CPI **9/11** · 20Y **9/15** · FOMC **9/15–16** · next 20-30Y
  operation **9/24** (deliberately untracked — see Stance).

## Initial research

**The question, plainly:** a routine Treasury buyback operation is scheduled for 1:40pm ET on
2026-09-10 — forty minutes after the 30Y reopening closes, the morning before August CPI, and one
day after Bessent's doubled buyback cap takes effect. What is this operation mechanically, how big
will it actually be, does an individual operation move the long end at all, what does its result
tell us that nothing else does, and which tracked names carry exposure worth flagging?

**One-line verdict:** it is a **read, not a catalyst** — an ordinary plumbing operation whose entire
enlarged program is worth roughly one basis point of 10-year support through year-end, sandwiched
between two events (a $22B-ish 30Y reopening and a CPI print) that will own the day's tape; its
value to us is one number, the **offer volume against the announced cap**, as a dealer-inventory
stress gauge into the 9/11→9/16 leg of the corridor.

**Method.** Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (rates
mode: no price instruments). Primary documents targeted directly — the Q3 2026 tentative buyback
schedule PDF, press release sb0607, refunding statement sb0590 — **all three direct fetches timed
out**, the same gated-primary limit the `treasury-buyback-increase-2026-09-09` sibling logged on
2026-08-28; parameters were recovered from a search index over those same treasury.gov files plus
convergent press. Operation-level statistics from FXStreet (2026-08-19, direct read), quantification
from Bank of America via Breitbart's citation of the note (2026-08-26), program-design framing from
CFR (2026-08-19/20) and TreasuryDirect's buyback FAQ. Current rates/vol levels inherited from the
same-day sibling ledgers (`treasury-30y-bond-2026-09-10`, `treasury-10y-note-2026-09-09`, both
assessed 2026-08-30), each figure dated where used.

### Conviction legs, tested

1. **The operation exists with these parameters — SUPPORTED (gated-primary caveat).** Treasury's
   *Tentative Schedule of Treasury Buyback Operations* for the Q3 2026 refunding quarter (published
   2026-08-05) schedules a **liquidity-support operation on 2026-09-10, 1:40–2:00pm ET, in the
   10-year to 20-year nominal sector, settling 2026-09-11**, announced the prior business day
   (09-09). Two direct fetches of that PDF timed out this session; the parameters are read from a
   search index over the treasury.gov file itself. The entry stays `status: "estimate"` — a
   tentative schedule is tentative by construction, and CFR notes Treasury **already overrode this
   very schedule two weeks after publishing it** (the 8/19 size increase), which is precisely why
   the `estimate` label is the honest one rather than a formality.

2. **The schedule's $2B cap is stale; $4B is the live expectation — SUPPORTED, and testable on
   2026-09-09.** Press release sb0607 (2026-08-19) raises the maximum size of nominal long-end
   liquidity-support buybacks from **$2B to at least $4B per operation**, in both the 10-20Y and
   20-30Y sectors, **effective 2026-09-09 through 2026-11-04**, with further sizing to be addressed
   at the 2026-11-04 refunding. The 9/10 operation is the first **10-20Y** operation on or after
   that effective date, so its announced maximum should print $4B. Both numbers are
   **estimate**-labeled until the 09-09 announcement posts — that announcement is the cheapest,
   cleanest falsifier this event has.

3. **This is liquidity support, not stimulus — SUPPORTED.** Treasury buys back older, seasoned,
   less-traded (off-the-run) securities and funds the purchases with new on-the-run issuance: no new
   bank reserves, no balance-sheet expansion, closer to an Operation Twist than to QE. The stated
   mechanism is market functioning — giving dealers a regular outlet for off-the-run inventory,
   releasing balance-sheet capacity and reducing fragmentation; Treasury's own dealer feedback calls
   the program "moderately supportive" of off-the-run liquidity, and the modifier is Treasury's, not
   this doc's. sb0607's own rationale is demand-side, not price-side: it cites "consistent strong
   sponsorship" and the "significant volume of high-quality offers" Treasury routinely receives.

4. **The measured effect is about one basis point — SUPPORTED, and load-bearing for the stance.**
   Bank of America's rates strategists (note published ~2026-08-26, figures via Breitbart's
   citation) put the enlarged program at **~1bp of support to the 10-year yield through end-2026**,
   rising to **~6bp only if maintained through end-2028**. FXStreet's Gibson (2026-08-19) makes the
   same point from the supply side: "two extra billion an operation, four times a quarter, is a
   rounding error beside the $25 billion of 30-year supply the August refunding alone put on the
   screen." The counterweight is real but sits in the *announcement* channel, not the operation
   channel: the 30Y Treasury-swap spread narrowed to its tightest since February (Bloomberg via
   Breitbart, 2026-08-26) — before a single enlarged purchase had occurred. And the program's own
   first market test faded inside a day (10Y −6bp on 8/19, fully round-tripped +5bp by 8/20, CNBC),
   the finding the sibling doc already banked. Net: real, small, and mostly signal.

5. **The operation's information value exceeds its price value — SUPPORTED, and the reason to
   watch.** At the **2026-08-18** 20-30Y operation, dealers offered close to **$20B** and Treasury
   took the full permitted **$2B** ($1B of a 2048 maturity, $1B across two 2051s) — roughly a
   ten-times cover — and even that drew, per FXStreet, **the smallest volume of offers of the eleven
   20-30Y operations conducted in 2026**. Aggregate scale corroborates: dealers offered **$520.4B**
   of 10-30Y paper across 2026 against caps permitting roughly **$42.2B** of purchases
   (navnoorbawaresearch, 2026-08 preview; the full operation-level table sits behind a paywall).
   Gibson names **9/10 and 9/24 as the next two test dates** with an explicit two-branch read —
   offers arriving at multiples of the new cap while yields keep rising means size was never the
   constraint; offers thinning while yields stabilise means the announcement was well-timed
   plumbing. That is this doc's central watch, adopted verbatim as a framework rather than a
   forecast. *(One caution: a search summary attributed a cover series — 2.53 Aug / 2.55 May / 2.75
   Jun / 2.64 Jul — to these operations; the direct read of the same article did not reproduce it,
   and it is inconsistent with ~$20B offered against $2B taken. Not carried.)*

6. **Sector nuance — this is NOT a bid for the bond being auctioned the same day.** The 1:00pm ET
   event on 9/10 is the **30Y reopening** (20-30Y bucket); the 1:40pm operation covers the **10-20Y**
   remaining-maturity bucket, which is mostly seasoned old 30Y bonds, not the paper being sold. Any
   support for the auction is therefore **indirect** — dealer balance-sheet relief forty minutes
   after taking down roughly $22B of fresh long-end supply — and should not be described as Treasury
   buying back what it just sold. The next **20-30Y** operation is **2026-09-24**.

7. **Tracked-name sensitivity — ranked, but honestly de-weighted.** `symbols: []` — market-wide,
   through the same rate-duration channel every event in the Sep 8→16 corridor feeds. At ~1bp of
   program effect, no tracked name's exposure to *this operation* is distinguishable from noise; the
   ranking is inherited context, not a live signal: **CRWV** most exposed (debt-financed,
   capital-intensive datacenter build — cost of capital and discount rate both), then the
   high-multiple semis **NVDA / AVGO / MRVL**, then **MSFT / GOOG / META** (mega-cap duration,
   fortress balance sheets mute the financing leg), least **AAPL / AMZN**.

**What the conditions support.** Nothing directional — the house playbooks (S1/S2/E1/S3/S4 + G1)
are symbol- and earnings-keyed, and no macro/rates playbook exists. What travels is a discipline:
treat 9/10 as a **data release with no trade attached**, and refuse the attribution error the day
invites — a 1:00pm auction and a next-morning CPI will own the tape, and a 1:40pm plumbing operation
will not.

**Honest limits.** Every treasury.gov primary targeted here (the Q3 schedule PDF, sb0607, sb0590)
timed out on direct fetch; parameters rest on a search index over those same files plus convergent
press — the same bounded limit the sibling logged, a real one, not an unconfirmed fact.
Operation-level history for the **10-20Y bucket specifically** could not be pulled at all:
fiscaldata.treasury.gov's API is unreachable from this session's sandbox and TreasuryDirect's
results table renders client-side, so every operation statistic quoted above is either 20-30Y
(Aug-18) or aggregate — the 10-20Y bucket's own offer-volume baseline is this doc's largest open
gap, and the first thing to close when the data becomes reachable. The BofA ~1bp figure is press
narration of a client note, not the note. No 9/10-specific forecast exists anywhere; the 09-09
announced maximum is the first hard number this event will ever have.

## Stance & kill switches

**Stance (date and parameters `estimate`-labeled — tentative schedule, primaries not directly
fetchable this session).** The 2026-09-10 10-20Y liquidity-support buyback is a **data release, not
a catalyst**: no position keyed to it, and no attribution of that day's tape to it. Read it for one
number — **offer volume against the announced cap** — as a gauge of long-end dealer-inventory
pressure heading into CPI (9/11) and a live-hike FOMC (9/15–16). Base case
(**estimate**-labeled): the 09-09 announcement prints a $4B maximum per sb0607, offers arrive at a
multiple of that cap as they have all year, and the operation passes without a tape effect anyone
can distinguish from the auction and the CPI print bracketing it.

**Refinements (2026-09-03, D-7 — the stance itself is unchanged; receipts in that ledger row).**

1. **The oil leg is re-activated — this reverses D-11's own adjacency read.** That row recorded Brent
   "~$88–90 on 8/28, >5% lower on the week as the Iran package read as sanctions not supply — the oil
   leg of the term-premium story has eased." As of 9/3 that is wrong: Brent is **~$95.2**, up three
   straight sessions and ~+20% on the month, with OPEC+ (**2026-09-06**, estimate) ahead. It changes
   nothing about the call and everything about attribution — the 9/10 tape has one more macro owner.
2. **$4B is a floor with an open ceiling, not a point estimate.** Bessent told CNBC on **2026-08-20**
   that buybacks "could be more than the 4 billion per issue," declining a figure and tying it to
   market conditions while pledging to "make a market" in long-dated paper where liquidity is weak.
   D-11 framed the 9/9 print as a binary ($4B vs the stale $2B); it is three-way, and a print above
   $4B is a Treasury escalating into fresh yield highs rather than a premise failure.
3. **"Too small to matter" now has a same-issuer yardstick.** Read off the same schedule PDF: the
   1Mo-2Y, 3-5Y, 5-7Y and 7-10Y liquidity operations all carry **$4B** caps already, and a **$12.5B**
   cash-management buyback runs on **9/9**. sb0607 brings the long end to parity with the rest of the
   curve; it does not privilege it — and Treasury's own routine operation the day prior is three
   times the whole long-end step-up. Leg 4's ~1bp finding is corroborated from a second direction.
4. **The gated-primary limit is closed for the schedule, and the status does not move.** The Q3 PDF
   fetched direct (curl, HTTP 200) on 9/3 and every parameter matched verbatim. The entry stays
   `estimate` on purpose: a tentative schedule is tentative by construction, its $2B cap is known
   stale, and the confirming primary is the **09-09 operation announcement**, not this document.

**Refinements (2026-09-05, D-5 — the stance itself is unchanged; receipts in that ledger row).**

5. **The central watch is no longer a framework, it is a number — and the trend runs against
   sb0607's stated rationale.** fiscaldata's `buybacks_operations` dataset answered this session
   (unreachable at D-11 and D-7), giving this doc the 10-20Y baseline it called its largest open gap.
   **Eleven 10-20Y operations in 2026, all eleven filling the full $2B cap**, offers mean **$20.17B**
   / median **$18.39B** / range **$7.40–36.05B**. The cap, not demand, has bound every time. But the
   **latest — 2026-08-11 — drew $7.40B, less than half the next-lowest ($15.72B, 7/1)** and a **3.7x**
   cover where the year averages ~10x; the 20-30Y sibling's 8/18 print (**$19.87B**) is now
   primary-verified as *that* bucket's smallest of eleven too. So both long-end queues hit 2026 lows
   in the two operations immediately before Treasury doubled the cap, while sb0607 justified the
   increase by "the significant volume of high-quality offers Treasury routinely receives." Honest
   reading: the release's *routinely* is true of the year and false of the two most recent prints, and
   which of those the 9/10 operation resembles is exactly what makes the offer number worth reading.
   Registered as **FT-treasury-buyback-10y20y-2026-09-10-1** (offers below $15.7B, score by 09-11).
6. **A full fill is not mechanical, so "accepted" carries information too.** Same dataset: on
   **2026-03-19** the 20-30Y operation drew **$36.0B** of offers and Treasury accepted **$0.20B**
   against a $2B cap — price, not volume, was the constraint that day. Any read of the 9/10 result
   therefore needs both numbers, not just the cover ratio.
7. **The D-11 aggregate is superseded by the primary, in Treasury's favour.** That row carried
   "~$520.4B offered vs ~$42.2B of cap capacity" from a preview article. Computed off fiscaldata over
   2026's 24 long-end liquidity operations (10-20Y, 20-30Y, 10-30Y TIPS): **$521.9B offered · $45.0B
   of cap capacity · $42.4B actually accepted**. The offered figure holds; the aggregator's "$42.2B"
   was approximately the *accepted* total, not the capacity. Rows are append-only, so the correction
   lives here rather than in that row.
8. **The last kill switch is fully discharged — and it did not move the status.** "Any treasury.gov
   primary becoming directly fetchable" fired for the schedule PDF at D-7 and now for the
   operation-level dataset. Both are closed, every parameter re-verified, and the entry stays
   `estimate`: the schedule remains tentative with a known-stale $2B cap, and the confirming primary
   is still the **09-09 operation announcement**, which does not exist yet.

**Deliberate non-proposal.** The next 20-30Y operation (**2026-09-24**) is dated and known, and is
**not** proposed as a calendar entry — this doc's own verdict is that a single operation is worth
about a basis point, so tracking each one would bloat the calendar against its own finding. It sits
in the dated watch list instead. If the kill switches below fire on 9/10 (a visible tape effect, or
a cap that doesn't step to $4B), 9/24 earns its own entry at that point.

**Updated 9/3 — the 9/24 half of that non-proposal is moot, the principle isn't.** The
`treasury-buyback-20y30y-2026-09-24` entry was filed on 2026-09-02 by the
`treasury-30y-bond-2026-09-10` sweep, on a reason this doc did not have: its maturity range is the
first that *covers* the CUSIP being reopened on 9/10. That is a specific warrant, not a reversal of
the rule. The rest of the Q3 schedule — cash-management operations 9/3 and 9/9, TIPS 9/15 and 9/29,
7-10Y 9/17, and this event's own next-in-sector operation on **2026-10-01** — is read off the primary
and deliberately **not** proposed: each is worth about a basis point through a channel no tracked name
is meaningfully exposed to, and filing them would bloat the calendar against this doc's own finding.
They live in the watch list. The 9/9 cash-management operation is carried as a *scale comparison*
(refinement 3), which is the only reason it is mentioned at all.

**Kill switches:**

- **The 2026-09-09 announcement prints a maximum other than $4B, or the operation is pulled/moved**
  — leg 2's "sb0607 supersedes the stale schedule" premise is wrong; reassess this doc and flag the
  `treasury-buyback-increase-2026-09-09` sibling, whose stance carries the same premise.
- **The 1:40–2:00pm ET window on 2026-09-10 moves 10-20Y yields >5bp with no auction/CPI/Fed news**
  — refutes leg 4's "too small to matter" read; a single operation moving the tape would make the
  9/24 operation a genuine tracked event rather than plumbing.
- **Offers on 2026-09-10 arriving near or below the announced cap** — a real break from 2026's
  roughly ten-times pattern; dealer inventory pressure has cleared, mildly positive for the long-end
  technical and worth a sentence in the corridor's stance docs.
- **Treasury escalating past $4B/op, adding sectors or frequency, or confirming TGA funding at scale
  before 2026-11-04** — a materially bigger fiscal lever than anything dated here; propose it as its
  own dated calendar entry rather than folding it into this stance.
- **Any treasury.gov primary becoming directly fetchable** — closes this doc's gated-primary limit;
  re-verify the schedule parameters against it, and if the posted announcement gives a primary
  `TSY:` source, propose flipping this entry's `status` to `confirmed` in that same PR.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-30 | D-11 | Initial research banked (above). **Event tape:** operation parameters (2026-09-10, 1:40–2:00pm ET, 10-20Y nominal, settle 09-11, announce 09-09) read from a search index over treasury.gov's Q3-2026 tentative buyback schedule after two direct PDF fetches timed out — same gated-primary limit as the `treasury-buyback-increase-2026-09-09` sibling; sb0607's $2B→**$4B/op** minimum (10-20Y and 20-30Y, effective 09-09 through 11-04) makes this the first 10-20Y operation at the new cap, so the **09-09 announced maximum is this event's first hard number** and its cleanest falsifier. Scale quantified for the first time: BofA puts the whole enlarged program at **~1bp of 10Y support through end-2026** (~6bp only if run to 2028, note ~8/26 via Breitbart); FXStreet 8/19 — "$2B extra an operation, four times a quarter, is a rounding error beside $25B of 30Y supply." Counterweight in the *announcement* channel: 30Y swap spread tightest since February (Bloomberg via Breitbart 8/26), before any enlarged purchase. Aug-18 20-30Y operation drew **~$20B offers / $2B taken** ($1B 2048s, $1B across two 2051s) — yet the smallest offer volume of 2026's eleven 20-30Y operations; 2026 aggregate ~$520.4B offered vs ~$42.2B of cap capacity. Sector correction worth carrying: this operation is **10-20Y, not the 20-30Y bucket the same-day 30Y reopening sits in** — support for that auction is indirect (dealer balance-sheet relief 40 min after ~$22B of supply), never "buying back what it just sold." **Adjacency — peers:** n/a (`symbols: []`); high-duration proxy CRWV −2.96% on 8/28, inside noise. **Macro:** Warsh's 8/28 Jackson Hole keynote turned hawkish and bear-flattened the curve (2Y 4.20→**4.34**, 10Y ~4.72–4.73, 30Y 5.19→**5.22**; 2s30s ~99→88bp), Sep-16 hike odds ~35%→**56–60%** — the long end was the beneficiary, which mutes the urgency behind this whole program. **Volatility:** VIX **14.35** on 8/28, a 2026 low (the 30Y sibling cites 14.43 from a different source — sources disagree, both are "calm"); no post-Warsh MOVE print published, last reachable is the week of 8/17. **Geopolitical:** Brent ~$88–90 on 8/28, >5% lower on the week as the Iran package read as sanctions not supply — the oil leg of the term-premium story has eased. **New dated adjacency found but deliberately NOT proposed:** the next 20-30Y operation, 2026-09-24 — see the Stance's non-proposal note (tracking each ~1bp operation would bloat the calendar against this doc's own verdict). Nothing else new: 3Y 9/8, 10Y 9/9, 30Y 9/10, CPI 9/11, 20Y+FOMC 9/15–16 are all already tracked. | — (stance set) | 2026-09-06 (medium, 8-30d band: every 7d) |
| 2026-09-03 | D-7 | **Event tape (primary, directly fetched — closes this doc's largest limit):** the Q3-2026 *Tentative Schedule of Treasury Buyback Operations* PDF now retrieves on a plain curl (**HTTP 200**, 125,547 bytes, text layer parsed 2026-09-03) where D-11's two attempts timed out. Every D-11 parameter verified **verbatim** — announce 9/9/2026, operation 9/10/2026 1:40pm-2:00pm, settle 9/11/2026, Liquidity Support, Nominal Coupons 10Y to 20Y, 09/11/2036-09/10/2046, min $0, **max $2 billion** — and the masthead still reads "For Publication August 5, 2026", so sb0607's promised updated schedule is **still unpublished 15 days on**; the 09-09 announcement remains this event's only path to a hard number. Status stays `estimate` (tentative by construction, cap known stale, confirming primary is the announcement — Stance refinement 4). **New scale leg from the same PDF:** the 1Mo-2Y (8/6), 3-5Y (8/20), 5-7Y (8/25) and 7-10Y (9/17) liquidity operations all already carry **$4B** caps — only the two long-end buckets sat at $2B, so sb0607 brings the long end to **parity**, not to privilege; and a **$12.5B cash-management buyback (1Mo-2Y) runs 9/9**, one day prior and ~3x the entire long-end step-up (refinement 3, corroborating leg 4 from a second direction). **Missed at D-11, now carried:** Bessent told CNBC **8/20** buybacks "could be more than the 4 billion per issue," declining a figure, conditioning on market conditions, pledging to "make a market" in long-dated paper — the 9/9 print is three-way, not binary (refinement 2; new signal bullet added). **Macro (hawkish on inflation, soft on labor at once):** ADP **+38K** August (cons ~47K; July revised 44K→46K), slowest since January, base pay +3.2% y/y (release read direct, 9/2 08:15 ET); ISM Mfg **54.6** with Prices Paid **71.1**; JOLTS **7.271M**, quits **1.9%**; Beige Book 9/2 "modest" growth, 10 of 12 districts, data-center demand named the driver. Sep-16 hike odds **~66%** (9/1) vs 56-60% at D-11. **Rates (treasury.gov daily par curve, fetched direct 9/3):** 10Y **4.79** (9/1 and 9/2) vs **4.73** on 8/28 — **+6bp**, press putting the intraday high above 4.81%, highest since Oct-2023; 30Y **5.27** vs 5.22 (+5bp); 20Y **5.27** vs 5.21, so 20s/30s closed from **-1bp to 0bp** — inside noise, but the wrong direction for the sector this operation supports. Fresh long-end highs a week before the enlarged operations begin is exactly the sibling's registered "limited relief" condition. **Volatility:** VIX **15.20** (9/2 close, probe) vs **14.35** at D-11 — **+0.85pt**, inside the 3-point threshold, after spiking to 16.34 on 9/1; still calm. **Geopolitical — reverses D-11's own read:** Brent **~$95.2** on 9/3, three straight up sessions, ~**+20% on the month**, against the "$88-90 and easing, sanctions not supply" this ledger recorded at D-11; the term-premium leg is re-activated into OPEC+ **9/6** (est) — refinement 1. **Peers:** n/a (`symbols: []`). **Adjacency — nothing new to propose:** the 5-day corridor gained `fomc-blackout-start-2026-09-05`, `opec-plus-meeting-2026-09-06` and `eia-steo-2026-09-09` since D-11, all already tracked, as are `treasury-buyback-20y30y-2026-09-24` (filed 9/2 by the 30Y sweep) and `treasury-refunding-2026-11-04`. The schedule's remaining operations (CMB 9/3 and 9/9, TIPS 9/15 and 9/29, 7-10Y 9/17, next 10-20Y **10/01**) are dated and deliberately **not** proposed — see the Stance's updated non-proposal note. | — (stance unchanged; four refinements banked — oil leg reversed, the $4B cap is a floor not a point estimate, the ~1bp read gained a same-issuer yardstick, the gated-primary limit closed without moving the status) | 2026-09-05 (medium, 0-8d band: every 2d) |
| 2026-09-05 | D-5 | **Event tape (primary — this doc's largest open gap is closed):** fiscaldata.treasury.gov's `buybacks_operations` dataset, unreachable at D-11 and D-7, **answered on a plain curl this session**, yielding the 10-20Y bucket's own 2026 baseline for the first time: **11 operations, 11 full-cap fills at $2B**, offers mean **$20.17B** / median **$18.39B** / range **$7.40–36.05B** — the cap, never demand, has bound all year. The **most recent, 2026-08-11, drew only $7.40B**, under half the next-lowest ($15.72B on 7/1) and a **3.7x** cover against a ~10x mean; and 8/18's 20-30Y print (**$19.87B**) is now primary-verified as that bucket's smallest of its own eleven, confirming FXStreet's 8/19 claim off the source. So **both long-end queues hit 2026 lows in the two operations immediately before sb0607 doubled the cap** — awkward beside sb0607's "significant volume of high-quality offers" rationale (refinement 5). Two further reads off the same dataset: 2026-03-19's 20-30Y operation took **$0.20B against a $2B cap on $36.0B offered**, so a full fill is never mechanical (refinement 6); and 2026's 24 long-end liquidity operations total **$521.9B offered / $45.0B cap capacity / $42.4B accepted**, correcting D-11's press-sourced "~$42.2B of cap capacity," which was approximately the *accepted* figure (refinement 7). **Forward test registered:** `FT-treasury-buyback-10y20y-2026-09-10-1` — 9/10 offers print **below $15.7B**, score by 09-11 off this same dataset. **Schedule:** PDF re-fetched direct (HTTP 200, 9/5) and still reads "For Publication August 5, 2026" with the 9/10 row at **max $2 billion** — **17 days** after sb0607 and still no updated schedule, so the 09-09 announcement remains the only path to a hard number; status stays `estimate` (refinement 8). **Macro — a hot print that the long end shrugged off:** August payrolls **+162K** vs ~53K consensus with **+55K** of prior-month upward revisions, U-3 steady at **4.1%** (BLS, 9/4); the 2Y hit its highest since January 2025 and Sep-16 hike odds moved to **~65%** from ~55% pre-print (Investrade 9/4 — the D-7 row's ~66% came from a different source on 9/1; sources disagree on the level, agree a hike is majority-priced). ISM Services **55.4** vs 57.1 expected on 9/3 was the week's offsetting miss. **Rates (treasury.gov par curve, fetched direct 9/5):** 9/4 close 2Y **4.37** · 10Y **4.78** · 20Y **5.25** · 30Y **5.24**, against 9/2's 4.39 / 4.79 / 5.27 / 5.27 — the long end **eased 2–3bp through a big upside labour surprise**, bear-flattening again, and 20s/30s re-inverted to **−1bp**. That is the opposite of D-7's "fresh long-end highs a week out" and it mutes, rather than raises, the urgency behind this program. **Volatility:** VIX **14.53** (9/4 close, Yahoo) vs **15.20** at D-7 — **−0.67pt**, well inside the 3-point threshold; calm, with 14.32 on 9/3 the local low. **Geopolitical:** Brent **~$95.0–95.2** on 9/4, essentially flat on D-7's ~$95.2 — the re-activated oil leg is holding, not extending — with OPEC+ **9/6** (est) widely expected to leave October policy unchanged; one aggregator reports Strait of Hormuz throughput at roughly a fifth of pre-war levels, single-sourced and carried as unverified. **Peers:** n/a (`symbols: []`). **Corridor:** FOMC blackout began **today (9/5)**, so CPI on 9/11 and the 9/10 supply lands with no Fed speak to absorb it; the 30Y reopening bracketing this operation is now **confirmed at $22B** (9/3 coupon announcement), sharpening D-11's "roughly $22B." **Adjacency — nothing new to propose:** the 5-day corridor gained `mts-august-2026-09-11`, `sp-rebalance-proforma-capped-2026-09-11`, `umich-sentiment-prelim-2026-09-11`, `buyback-blackout-start-2026-09-12`, `g20-energy-abundance-ministerial-houston-2026-09-14` and `gastech-2026-09-14` since D-7, all already tracked; the schedule's own remaining operations (TIPS 9/15 and 9/29, 7-10Y 9/17, next 10-20Y **10/01**) stay deliberately unfiled per the Stance's non-proposal note. `market-events.ts` unchanged this pulse. | — (stance unchanged and now quantified; four refinements banked — the offer-volume watch got its primary baseline and a registered forward test, full fills shown to be non-mechanical, D-11's aggregate corrected off the source, the gated-primary kill switch fully discharged without moving the status) | 2026-09-07 (medium, 0-8d band: every 2d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
