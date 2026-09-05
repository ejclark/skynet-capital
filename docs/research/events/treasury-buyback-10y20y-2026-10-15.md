# Treasury liquidity-support buyback operation (10-20Y nominal, 1:40pm ET) — treasury-buyback-10y20y-2026-10-15

**Kind:** rates · **Date:** 2026-10-15 (estimate, EST: treasury.gov Tentative Schedule of Treasury Buyback Operations, August 2026 refunding, published 2026-08-05 — PDF re-fetched and text-layer decompressed direct 2026-09-05, row reads announce 10/14, operation 10/15 1:40–2:00pm ET, settle 10/16, Nominal Coupons 10Y to 20Y, 10/16/2036–10/15/2046, min $0, max $2B **superseded** by sb0607) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["beige-book-2026-10-14","cpi-2026-10-14","fomc-blackout-start-2026-10-17","g20-fmcbg-bangkok-2026-10-15","imf-world-bank-annual-meetings-2026-10-12","import-export-prices-2026-10-16","opex-2026-10-16","ppi-2026-10-15","retail-sales-2026-10-15","ssa-cola-2027-2026-10-14","treasury-coupon-announcement-2026-10-15","treasury-primary-dealer-agenda-2026-10-16"],"screenStreak":0} -->

## At a glance

**TL;DR.** Still **a read, not a trade** — but this session finally got the data the
[09-10 sibling](treasury-buyback-10y20y-2026-09-10.md) named as its largest open gap, and the data
changes what the read is *for*. Treasury's own operation-level history is reachable after all
(`fiscaldata` `buybacks_operations`, pulled direct 2026-09-05: **25 operations** in this exact
10Y-20Y bucket, back to 2024-07-02). Three things fall out of it. **One —** offers in this sector
**collapsed** at the most recent operation: **$7.40B on 2026-08-11**, the lowest since 2024-11-25
and **53% below 2026's next-lowest** ($15.72B), against a 2026 median of $18.39B. **Two —** that
print landed **eight days before** `sb0607` doubled the cap citing *"the significant volume of
high-quality offers Treasury routinely receives"*; both long-end sectors printed their **2026
minimum** offer volumes in the two operations immediately preceding it. At August's volume a $4B
cap is covered **1.85x**, not the ~10x the press framing assumes — so "offers arrive at a multiple
of the cap" is a claim with a dated counter-example now. **Three —** the eligible-CUSIP list says
this operation **cannot bid for the 20Y bond being reopened on 10-21**: a 20Y enters the buyback
universe only after two subsequent 20Y new issues have priced (3 of 3 cases), so 912810UX4 and
912810UV8 are both out. Date and cap are `estimate`; `symbols: []`; no position, and no attribution
of 10-15's tape to a 1:40pm plumbing operation on a day already carrying PPI, retail sales and a
coupon announcement.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-40) | Stand aside | High | Saturday, no session. Forty days out, `symbols: []`, no house playbook is macro-keyed, and the whole enlarged program is worth ~1bp of 10Y support through year-end (BofA, 8/26, via press). | Treasury acting on the long end past `sb0607` — a cap above $4B, added sectors or frequency, or a confirmed TGA-funded programme — before **2026-10-14**; that is a materially bigger lever than anything dated here |
| This week | Watch the **2026-09-09** announcement and the **2026-09-10** operation as this event's free out-of-sample check | High | Same sector, same cap regime, five days away, and it costs nothing. It publishes three numbers this doc needs: the announced maximum (the first hard number the doubled cap ever gets), the eligible-CUSIP list, and the offer total against the 8/11 collapse. | The 09-09 announcement not posting, or posting a maximum below $4B, or the 09-10 eligible list not containing **912810UT3** and **912810RT7** — the last of these kills this doc's eligibility model outright ([`FT-…-1`](../forward-tests.md)) |
| This month | Read the **2026-10-01** operation, hold nothing through it | Medium | It is the same 10-20Y sector two weeks before this event and the second data point under the doubled cap. Two consecutive sub-$12B offer totals would make 8/11 a regime, not an outlier — the single most decision-relevant unknown this doc has. | Offers on **2026-10-01** printing back at 2026's $15–36B range — 8/11 was then an idiosyncratic hole and the sector's demand story is unchanged |
| This quarter | Stand aside on the programme as a yield driver; the **2026-11-04** refunding is where sizing is actually decided | Medium | `sb0607`'s doubling expires 11-04 by its own text, and the 11-04 operation is the last one inside it. Long-end yields have made fresh highs *since* the doubling was announced (10Y 4.78, 30Y 5.24 on 09-04) — deficits and the Fed path are the drivers, not $2B a fortnight. | Long-end yields easing durably across the 09-10, 10-01 and 10-15 operations with no macro explanation, or the 11-04 refunding statement making the enlarged size permanent and larger — either would mean the lever is bigger than ~1bp |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a position keyed to this operation**, and never an attribution of 10-15's tape to it. `symbols: []`, date and cap `estimate`, no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed.
- **The one number to read: total par offered.** 2026 base rate in this exact sector — median **$18.39B**, range **$7.40–36.05B**, n=11 (`fiscaldata`, primary).
- **The 8/11 collapse, stated precisely:** $7.40B offered / $2.00B taken, cover **3.70x**, the only sub-$15B reading in the 21 operations since 2025-02-06.
- **Acceptance is near-deterministic in this sector: 25 of 25 operations took the full announced maximum.** Expect **$4B accepted** if $4B is announced.
- **…but the cap is a ceiling, not a forecast.** On **2026-03-19** Treasury took **$0.20B of a $2.00B** cap against $36.00B offered (20-30Y). One precedent, and the only one.
- **The eligible list excludes what was just sold.** 912810UX4 (20Y, reopened 10-21) and 912810UV8 are both out; 912810UT3 and 912810RT7 should be newly in from 09-10.
- **Cap arithmetic:** at 8/11's offer volume a $4B cap covers **1.85x**; at the 2026 median it covers **4.6x**.
- **Watch (dated):** 10-20Y operations **09-10** · **10-01** · **10-15** (this) · **11-04** · 20-30Y **09-24** · **10-08** · **10-27** · CPI **10-14** · PPI + retail sales + coupon announcement + this operation **10-15** · dealer agenda + opex **10-16** · FOMC blackout opens **10-17** · FOMC **10-28** · refunding **11-04**, where `sb0607` expires.

## Initial research

### The question, plainly

This event was filed on 2026-09-05 by the
[`treasury-coupon-announcement-2026-10-15`](treasury-coupon-announcement-2026-10-15.md) adjacency
sweep, on the warrant that it shares a date with that announcement and carries the superseded-cap
finding. It arrives with a sibling doc that already reached a verdict — the
[09-10 operation](treasury-buyback-10y20y-2026-09-10.md) is *"a data release, not a catalyst"* — so
restating that verdict forty days later would add nothing. What this session asked instead: **the
09-10 sibling named one specific open gap — "the 10-20Y bucket's own offer-volume baseline is this
doc's largest open gap, and the first thing to close when the data becomes reachable." Is it
reachable now, and does closing it change the read?**

**One-line verdict:** it is reachable, it does, and the change is not to the *call* but to what the
call is watching — the sector's offer volume **collapsed at the last observation before Treasury
doubled the cap**, which converts the inherited "offers always arrive at ~10x the cap" framing from
a background assumption into a live, dated question with a free answer on 2026-09-10.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and
the mandated cache bust has nothing to bust (recorded rather than skipped silently). Everything
quantitative below was fetched this session (2026-09-05):

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Buyback-Schedule.pdf`, plain
  curl, **HTTP 200, 125,547 bytes** (byte-identical in size to the 09-03 and 09-05 fetches on
  record, i.e. unrevised), PDF streams inflated and the text layer reconstructed.
- **The operation history** — `api.fiscaldata.treasury.gov` `buybacks_operations`, **219 rows**
  (2000-03-09 → 2026-09-03), and `buybacks_security_details` at CUSIP level. This is the source the
  09-10 sibling recorded as unreachable from its sandbox; it answers on a plain curl here.
- **The auction history** — the same API's `auctions_query`, for 20-Year and 30-Year CUSIPs,
  vintages and dates.
- **The tape** — Yahoo daily closes for `^VIX`, `^TNX`, `^TYX`.
- **`sb0607`** — quoted from the primary text already read verbatim into this event's own
  `market-events.ts` `notes` field on 2026-09-05, cited rather than re-fetched.

### Conviction legs, tested

**1. The operation exists with these parameters — SUPPORTED, verbatim off the primary.** The
August-2026-refunding *Tentative Schedule of Treasury Buyback Operations* (masthead: *"For
Publication August 5, 2026"*) carries the row **announce 10/14/2026 · operation 10/15/2026
1:40 pm–2:00 pm · settle 10/16/2026 · Liquidity Support · Nominal Coupons 10Y to 20Y ·
10/16/2036–10/15/2046 · min $0 · max $2 billion.** The entry stays `estimate`: a tentative schedule
is tentative by construction, the $2B is known stale, and the confirming primary is the **10-14
announcement**, not this document. The same PDF's footnotes are load-bearing for leg 5 — *"A
preliminary list of eligible CUSIPs will be disclosed at 11:00 am ET on the Announcement Date"* and
*"The final list of eligible CUSIPs will be disclosed at 11:00 am ET on the Operation Date."*

**2. This is the third of four 10-20Y operations in the quarter, and the second-to-last inside the
doubled-cap window — SUPPORTED.** Read off the same PDF, this sector's operations are **09-10 ·
10-01 · 10-15 · 11-04**. `sb0607`'s increase runs *"effective September 9, 2026 … through November
4, 2026"* — so all four sit inside it, and the **11-04 operation falls on the refunding date that
resets its own authority**. Two consequences worth carrying: by 10-15 there will be **two prior
same-sector observations** under the enlarged cap (09-10, 10-01), and nothing about this operation
is a first.

**3. The sector's offer volume collapsed at the last observation — SUPPORTED, and this is the
session's finding.** Every 10Y-20Y liquidity-support operation ever run, from `fiscaldata`
(par offered / accepted, $B):

| Operation | Offered | Accepted | Cover | Eligible CUSIPs |
|---|---|---|---|---|
| 2024 (4 ops) | 6.43 – 7.24 | 2.00 each | 3.2–3.6x | 20–28 |
| 2025 (10 ops) | 18.24 – 29.96 | 2.00 each | 9.1–15.0x | 28–34 |
| 2026-01-08 → 07-23 (10 ops) | 15.72 – 36.05 | 2.00 each | 7.9–18.0x | 34–38 |
| **2026-08-11** | **7.40** | 2.00 | **3.70x** | 37 |

**$7.40B is the lowest since 2024-11-25 and the only sub-$15B print in the 21 operations since
2025-02-06** — 53% below 2026's next-lowest ($15.72B, 07-01) and 60% below the 2026 median
($18.39B). Normalising for a universe that has nearly doubled makes it starker: **$200M offered per
eligible CUSIP**, below even the 2024 start-up phase ($242M on 2024-11-25) and 40% of 2026's median
($497M). **The obvious explanation is refuted by a matched control:** 8/11 was the day of the $58B
3-Year refunding auction, but so was **2026-02-10** (3Y 02-10 · 10Y 02-11 · 30Y 02-12, `auctions_query`)
— and that operation drew **$20.85B**. The May analogue (2026-05-06, refunding week) drew $19.69B.
Refunding-week crowding does not explain 8/11.

**4. `sb0607`'s stated rationale and the tape immediately before it point opposite ways — SUPPORTED,
and stated as a tension rather than an accusation.** Treasury's 2026-08-19 release justifies the
doubling by *"consistent strong sponsorship from market participants, as evidenced by the
significant volume of high-quality offers Treasury routinely receives in longer-dated buyback
operations."* The two long-end operations immediately preceding it were **2026-08-11 (10-20Y,
$7.40B — the sector's 2026 minimum)** and **2026-08-18 (20-30Y, $19.87B — that sector's 2026
minimum, from 11 operations)**. The FXStreet claim the sibling carried — that 8/18 drew the smallest
offer volume of 2026's eleven 20-30Y operations — is **CONFIRMED exactly** against the primary, as
is its $20B-offered/$2B-taken/3-issues description. The honest reading is not that Treasury misstated
anything: *"routinely receives"* is a claim about the run of operations, not the last one, and a
liquidity-support programme sized for a market under stress is forward-looking by design. But it does
mean the increase is **price-support-motivated rather than demand-responsive**, which is exactly what
CFR called a *"buyback surprise"* and what Bessent's *"make a market"* language implies.

**5. The eligible list cannot contain the bond being reopened on 10-21 — SUPPORTED, 3 of 3, and this
is the structural point specific to this date.** The tempting story on 2026-10-15 is that Treasury
announces a 20Y reopening at ~11:00 ET and bids for 20Y paper at 1:40pm. It cannot. Tracing 20Y
CUSIPs through `buybacks_security_details`:

| 20Y CUSIP | New issue | Final reopening | Second later new issue | First buyback-eligible |
|---|---|---|---|---|
| 912810UL0 (5.000% 2045-05-15) | 2025-05 | 2025-07-23 | 2025-11-19 | **2025-12-04** |
| 912810UN6 (4.875% 2045-08-15) | 2025-08-20 | 2025-10-22 | 2026-02-18 | **2026-03-05** |
| 912810UQ9 (4.625% 2045-11-15) | 2025-11-19 | 2026-01-21 | 2026-05-20 | **2026-06-09** |
| 912810UT3 (4.625% 2046-02-15) | 2026-02-18 | 2026-04-22 | 2026-08-19 | not yet (predicted 09-10) |

In all three completed cases the security appears at **the first operation after its second
subsequent 20Y new issue prices** — i.e. once it is no longer the on-the-run or first-off-the-run.
The cleanest single demonstration: on **2026-03-26** the eligible list ended at **912810RQ3 (2.500%
2046-02-15**, a 2016-vintage 30Y**)** while **912810UT3, maturing the same day**, was absent — same
maturity date, different vintage, only the old one eligible. Applied to 10-15: **912810UX4** (sold
2026-08-19, reopened 10-21) and **912810UV8** are both excluded, and the next 20Y new issue is not
until November. *Treasury is not buying back what it is selling* — the same attribution error the
09-10 sibling flagged in its sector form, now demonstrated at CUSIP level.

**6. The eligible universe for 10-15 is predictable, and predicting it is the cheapest falsifier
this doc has — SUPPORTED.** The list is stable except at its top edge, where the rolling maturity
window admits securities. On 2026-08-11 it held **37** CUSIPs. Two should join by 09-10:
**912810RT7** (2.250% 2046-08-15, a 2016-vintage 30Y with 24 prior appearances in the *20-30Y*
bucket, which its 2026-08-19 twenty-year crossover ejects) and **912810UT3** (leg 5). Nothing
matures between 2046-08-15 and this event's 2046-10-15 range end, so **09-10, 10-01 and 10-15 should
all show 39**. That is registered as [`FT-…-1`](../forward-tests.md) and scores on **2026-09-11**,
five days from now.

**7. Acceptance is near-deterministic; the cap is the binding constraint, not demand — SUPPORTED,
with the one exception named.** Treasury took **exactly the full announced maximum in 25 of 25**
10-20Y operations, including 8/11's $2.00B against only $7.40B offered. The number of *issues* taken
has compressed as the universe grew (5–12 issues in 2024; 1–5 since), and 8/11's two purchases were
deep-discount 2012-vintage 30Y bonds — **912810TH1 (3.250% 2042-05-15) $1.485B at 79.516** and
**912810TK4 (3.375% 2042-08-15) $0.515B at 80.555** — which is what liquidity support is supposed to
look like. **The exception, and it matters:** on **2026-03-19** the 20-30Y operation drew **$36.00B**
and Treasury accepted **$0.20B** of a $2.00B cap. One occurrence in 2026, unexplained by this
session, and the reason "$4B announced" is not the same claim as "$4B bought."

**8. The programme aggregate corroborates the press figure and corrects its label — MIXED.** The
sibling carried *"dealers offered $520.4B of 10-30Y paper across 2026 against caps permitting roughly
$42.2B of purchases"* (navnoorbawaresearch, paywalled). Recomputed from the primary over 2026's 22
long-end operations: **offered $520.40B** — exact — but **$42.20B is what Treasury *accepted*, not
what the caps permitted.** Cap capacity was **$44.00B**; the $1.80B gap is entirely the 2026-03-19
operation from leg 7. Small, and the direction matters: the programme has been running at
**99.996% of offered-vs-capacity utilisation on the cap side**, so there was never spare
authorised capacity going unused — which is the honest case *for* `sb0607` and against reading 8/11
as evidence the increase was unnecessary.

**9. Scale, inherited and unchanged — SUPPORTED.** Bank of America puts the whole enlarged programme
at **~1bp of 10-year support through end-2026** (~6bp only if run to 2028; note ~2026-08-26, via
press narration, not the note). The same PDF's front-end operations already carry **$4B** caps and a
**$12.5B** cash-management buyback ran 2026-09-03 (offered $28.27B, accepted the full $12.50B) — so
`sb0607` brings the long end to parity with the rest of the curve rather than privileging it, and a
single routine front-end operation is three times the entire long-end step-up. Nothing in this
session's data moves that.

**10. No tracked name is exposed through this channel — SUPPORTED, inherited.** `symbols: []`;
market-wide, through the rate-duration channel. At ~1bp of programme effect no tracked name's
exposure to *this operation* is distinguishable from noise. The inherited ranking (CRWV most exposed,
then NVDA/AVGO/MRVL, then MSFT/GOOG/META, least AAPL/AMZN) is context, not a live signal.

**11. This operation's own tape effect will not be measurable, and that is stated now — SUPPORTED.**
2026-10-15 already carries **PPI 08:30 · advance retail sales 08:30 · a coupon announcement ~11:00
(20Y reopening + 5Y TIPS new issue) · the G20 FMCBG in Bangkok**, with **CPI and the Beige Book the
previous day** and **opex plus the dealer agenda the next**. No intraday attribution to a 1:40–2:00pm
window is defensible in that session and none will be attempted at close-out. The honest measurables
are the **announced maximum, the eligible list, the offer total and the accepted total** — four
numbers, all published, none requiring a reaction study.

**12. Current tape, as the baseline the next pulse diffs against — no directional read.** **VIX
14.53** (2026-09-04 close, Yahoo, fetched this session; 15.20 on 09-02). **10Y 4.784 · 30Y 5.246**
(`^TNX`/`^TYX`, 09-04), agreeing with the Treasury par curve the coupon sibling read off the primary
the same day (2Y 4.37 · 10Y 4.78 · 20Y 5.25 · 30Y 5.24). **2026-09-05 is a Saturday**, Labor Day is
09-07, so 09-04 is the freshest close available and nothing here is stale by neglect. Long-end yields
sit **above** where they were when `sb0607` was announced — the doubling has not visibly bought a
lower long end, which is leg 9's ~1bp finding showing up in the tape rather than in a model.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What
the conditions do support is three things.

**Retire the "~10x cover" assumption and replace it with a measured base rate.** This calendar has
been carrying a press-sourced framing (offers arrive at a multiple of the cap; the constraint is
Treasury's size, not dealer supply) that is true of 20 of 21 operations since 2025 and **false of the
most recent one**. The replacement is a distribution: median $18.39B, range $7.40–36.05B, and a
$4B cap covered anywhere from 1.85x to 9.0x depending on which of those two worlds 10-15 lands in.

**Sequence the free checks and do not wait for 10-15 to learn anything.** The order is **09-09**
(announced maximum + preliminary eligible list) → **09-10** (offer total, accepted total, the
eligibility model's score) → **10-01** (the second same-sector reading under the doubled cap; two
sub-$12B totals would make 8/11 a regime) → **10-14/10-15** (this event) → **11-04** (refunding,
where `sb0607` expires and sizing is actually decided). Three of those five arrive before this doc's
next scheduled pulse.

**Keep the calendar honest about what a basis point deserves.** The remaining operations on the
schedule — 20-30Y **10-08** and **10-27**, TIPS 1Y-10Y **10-21**, 10-20Y **11-04**, and this event's
own immediate predecessor **10-01** — are dated and known, and are deliberately **not** proposed as
calendar entries, on the 09-10 sibling's rule: tracking each ~1bp operation would bloat the calendar
against this doc's own finding. They sit in the dated watch list.

### Honest limits

**Nothing about 10-15 has happened**; every number here is a schedule read or a base rate. **The
announced maximum is unknown and will stay unknown until 10-14** — `sb0607` says *"at least $4
billion"* and Bessent said on 2026-08-20 it *"could be more than the 4 billion per issue"*, so $4B is
a floor with an open ceiling, and the schedule PDF's $2B is superseded and must not be quoted. **The
eligibility model is empirical, not documentary** — 31 CFR Part 375 and the operation announcements
were not fetched this session, so "two subsequent new issues" is a 3-of-3 regularity, not a quoted
rule, and it is registered as a test precisely because it could be a coincidence of three. **A real
hole in that model is disclosed:** the eligible list's *floor* has sat at 912810SR0 (2040-05-15)
across all 25 operations, and pre-2011 30Y bonds that fall squarely inside the stated maturity range
— 912810QE1 and 912810QH4, both verified outstanding — have **never appeared in any buyback operation
in the dataset**. This session could not explain why, and the count prediction in leg 6 depends on
that floor staying put. **The 2026-03-19 exception is characterised, not explained.** **The ~1bp
scale figure is press narration of a BofA note, not the note.** **Macro context beyond rates and VIX
is inherited** from same-day sibling ledgers and dated where used, not re-derived. **`sb0607` is
quoted from text read into this repo on 2026-09-05, not re-fetched today.**

## Stance & kill switches

**Stance (date and cap `estimate`-labeled — tentative schedule, published cap superseded, confirming
primary is the 10-14 announcement).** The 2026-10-15 10-20Y liquidity-support buyback is a **data
release, not a catalyst**: no position keyed to it, no attribution of that day's tape to it. Base
case (**estimate**-labeled): the 10-14 announcement prints a maximum of **at least $4B**, the
eligible list holds **39 CUSIPs** excluding both current 20Y issues, Treasury accepts **the full
announced maximum** as it has in 25 of 25 operations in this sector, and the operation passes without
a tape effect distinguishable from PPI, retail sales and a coupon announcement on the same date.

**What this initial research changes versus the sibling's stance, which it otherwise inherits.** The
09-10 doc's central watch was *"offer volume against the cap"* as a dealer-inventory gauge, read
against a press-sourced ~10x prior. That prior is now measured, and its most recent observation
broke: **$7.40B on 2026-08-11, cover 3.70x, the sector's lowest since 2024-11-25**. The watch is
unchanged; what changed is that it now has a distribution, a matched control ruling out the obvious
explanation, and a dated tension with `sb0607`'s own stated rationale.

**Two forward tests registered** in [`forward-tests.md`](../forward-tests.md):

- **`FT-treasury-buyback-10y20y-2026-10-15-1`**, scoreable **2026-09-11** — the eligibility model:
  the 2026-09-10 operation's eligible CUSIP list contains **39** securities, adding exactly
  **912810UT3** and **912810RT7** to 08-11's 37, and excluding **912810UV8** and **912810UX4**.
- **`FT-treasury-buyback-10y20y-2026-10-15-2`**, scoreable **2026-10-16** — the 2026-10-15 operation
  **accepts the full announced maximum**, against a 25-of-25 base rate in this sector and one 2026
  counter-example at 10% of cap (2026-03-19, 20-30Y).

**Deliberate non-proposal.** No new `market-events.ts` entries are proposed by this sweep. Every
dated adjacency found — the 10-01, 10-08, 10-21, 10-27 and 11-04 buyback operations — is a
~1bp liquidity-support operation of exactly the kind this doc concludes is not worth a calendar slot,
and the 12 tracked events already inside this event's ±5-day corridor cover the date. The 09-10
sibling's rule is followed rather than re-litigated: a specific warrant (as when a maturity range
first covers a CUSIP being reopened) earns an entry; sector cadence alone does not.

**Kill switches:**

- **The 2026-09-10 eligible list not containing 912810UT3 and 912810RT7, or not numbering 39** —
  kills `FT-…-1` and the leg-5/6 eligibility model with it; the "cannot bid for what it just sold"
  claim gets re-derived from the rule text rather than patched.
- **The 2026-09-09 or 2026-10-14 announcement printing a maximum below $4B, or the operation being
  pulled or moved** — `sb0607`'s supersession premise is wrong, and the
  [`treasury-buyback-increase-2026-09-09`](treasury-buyback-increase-2026-09-09.md) sibling carries
  the same premise and needs flagging.
- **A second consecutive sub-$12B offer total (09-10 or 10-01)** — 8/11 was a regime change, not an
  outlier; long-end dealer inventory has cleared and the demand-side case for the enlarged programme
  weakens materially. Worth a sentence in every rates ledger in the corridor.
- **Offers reverting to $15–36B while long-end yields keep making highs** — size was never the
  binding constraint; the structural-supply read holds and caution stays wide on high-duration names
  into the 10-28 FOMC.
- **Treasury accepting materially less than the announced maximum on 09-10, 10-01 or 10-15** — breaks
  a 25-of-25 record and would make the 2026-03-19 outcome a pattern rather than an exception.
- **The 1:40–2:00pm ET window on 2026-10-15 moving 10-20Y yields >5bp with no PPI/retail-sales/
  announcement explanation** — refutes the "too small to matter" read; a single operation moving the
  tape would make each one a genuinely tracked event rather than plumbing.
- **Treasury escalating past $4B/op, adding sectors or frequency, publishing the promised updated
  schedule, or making the increase permanent at the 2026-11-04 refunding** — a materially bigger
  fiscal lever than anything dated here; propose it as its own dated calendar entry rather than
  folding it into this stance.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-40 | **Initial research.** **The finding: `fiscaldata`'s buyback datasets are reachable, closing the [09-10 sibling](treasury-buyback-10y20y-2026-09-10.md)'s explicitly named largest gap** — `buybacks_operations` (219 rows, 2000-03-09→2026-09-03) and `buybacks_security_details`, plain curl HTTP 200. **All 25 10Y-20Y operations ever run, measured:** accepted **exactly the full cap in 25 of 25**; 2024 offers $6.43–7.24B, 2025 $18.24–29.96B, 2026-01→07 $15.72–36.05B — and **2026-08-11 offered just $7.40B** (cover 3.70x), the lowest since 2024-11-25, the **only sub-$15B print in 21 operations since 2025-02-06**, 53% below 2026's next-lowest and 60% below the $18.39B median; per eligible CUSIP **$200M vs $497M**. **Matched control refutes the obvious explanation:** 8/11 was 3Y-refunding-auction day ($58B), but so was **2026-02-10**, which drew **$20.85B** (May analogue 05-06: $19.69B). **Dated tension recorded:** both long-end sectors printed 2026 minima in the two operations immediately before `sb0607` (10-20Y $7.40B on 08-11; 20-30Y **$19.87B** on 08-18), whose rationale cites *"the significant volume of high-quality offers."* FXStreet's "smallest of 2026's eleven 20-30Y operations" claim **CONFIRMED exactly** against the primary, as is $20B offered/$2B taken/3 issues. **Press aggregate corroborated and its label corrected:** 2026's 22 long-end operations offered **$520.40B** (exact match) but **$42.20B is accepted, not cap capacity** — capacity was $44.00B, the $1.80B gap being **2026-03-19**, where Treasury took **$0.20B of $2.00B against $36.00B offered** (the one 2026 precedent that "announced max" ≠ "bought"). **Structural finding specific to this date — the operation cannot bid for the bond reopened 10-21:** a 20Y enters the eligible universe only after its second subsequent 20Y new issue prices, **3 of 3** (912810UL0 first eligible 2025-12-04, 912810UN6 2026-03-05, 912810UQ9 2026-06-09); cleanest demonstration is 2026-03-26, where the 2016-vintage 912810RQ3 was eligible and **912810UT3, maturing the same day**, was not. So **912810UX4** and **912810UV8** are excluded on 10-15. **Two forward tests registered** — `FT-…-1` (09-10 eligible list = **39**, adding 912810UT3 and 912810RT7 to 08-11's 37; scores 2026-09-11) and `FT-…-2` (10-15 accepts the full announced maximum; scores 2026-10-16). **Event tape (primary):** buyback schedule PDF re-fetched HTTP 200, **125,547 bytes — unrevised**, row verbatim announce 10/14 · operation 10/15 1:40–2:00pm · settle 10/16 · 10Y-20Y · 10/16/2036–10/15/2046 · max **$2B (superseded)**; masthead still "For Publication August 5, 2026", so `sb0607`'s promised updated schedule is **still unpublished 17 days on**. Sector cadence read off the same PDF: **09-10 · 10-01 · 10-15 · 11-04**, all inside `sb0607`'s 09-09→11-04 window, the last landing on the refunding date that resets it. **Adjacency — peers:** n/a (`symbols: []`). **Rates:** 10Y **4.784** · 30Y **5.246** (`^TNX`/`^TYX`, 09-04), agreeing with the Treasury par curve the coupon sibling read direct the same day (2Y 4.37 · 20Y 5.25) — **above** where they sat when the doubling was announced. **Volatility:** VIX **14.53** (09-04 close) vs 15.20 on 09-02; calm. 2026-09-05 is a **Saturday**, Labor Day 09-07, next session 09-08. **Macro (inherited, dated):** Aug payrolls **+162K vs ~53K** (09-04) reversed Waller's 09-03 dovish turn; FOMC blackout live 09-05→09-17. **Adjacency — 12 tracked entries already inside the ±5-day corridor; NOTHING new proposed:** the 10-01, 10-08, 10-21, 10-27 and 11-04 operations are dated and known and are deliberately not filed, on the 09-10 sibling's ~1bp rule. | **Stance set** — read-not-trade, inherited from the 09-10 sibling; what is new is that its central watch now has a measured base rate whose most recent observation broke | 2026-09-15 (medium; D-40 sits in the 31+/21d band → 09-26, but the band tightens to 7d once days-out crosses 30 on 09-15, which makes 09-15 the real first due date) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
