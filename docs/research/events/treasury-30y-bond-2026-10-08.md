# 30-Year Treasury Bond auction (second reopening) — treasury-30y-bond-2026-10-08

**Kind:** rates · **Date:** 2026-10-08 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-05 — row reads `30-Year BOND R / Thursday, October 01, 2026 / Thursday, October 08, 2026 / Thursday, October 15, 2026`) · **Impact:** medium
**Last assessed:** 2026-09-15
<!-- probe-ref: {"symbols":{},"vix":17.1,"daysBand":"medium:8+","adjacentIds":["consumer-credit-2026-10-07","ecb-account-2026-10-08","eia-steo-2026-10-06","existing-home-sales-2026-10-13","fomc-minutes-2026-10-07","imf-world-bank-annual-meetings-2026-10-12","intl-trade-full-report-2026-10-06","ism-services-2026-10-05","jgb-30y-auction-2026-10-08","mrvl-investor-day-2026-10-06","opec-jmmc-68th-2026-10-04","opec-plus-meeting-2026-10-04","sifma-bond-market-closure-2026-10-12","sp-global-investment-manager-index-2026-10-13","sp-global-services-pmi-2026-10-05","treasury-10y-note-2026-10-07","treasury-3y-note-2026-10-06","treasury-buyback-20y30y-2026-10-08","treasury-buyback-2y3y-2026-10-06","wholesale-trade-2026-10-08"],"adjacentStrongIds":["ism-services-2026-10-05"],"screenStreak":0,"blocked":[{"url":"https://stooq.com/q/d/l/?s=^vix","status":"JS_CHALLENGE","at":"2026-09-15"},{"url":"https://stooq.com/q/d/l/?s=^move","status":"JS_CHALLENGE","at":"2026-09-15"},{"url":"https://stooq.com/q/d/l/?s=cb.f","status":"JS_CHALLENGE","at":"2026-09-15"}]} -->

## At a glance

**TL;DR.** **Two of this ledger's own kill switches fired, and the re-derivation they demanded flips which
way this auction is likely to miss.** The 09-10 first reopening of this exact CUSIP printed bid-to-cover
**2.610** — outside the 2.30–2.52 band, **3.60σ** above the prior-20 mean, the strongest 30Y *reopening*
since 2022, with the lowest dealer take (**2.21%** of competitive) of all 57 nominal 30Y auctions on file.
The intuitive follow-on — a hot first reopening means a hot second — is this doc's **third refuted
intuition**: across 18 complete cycles R1→R2 correlates **−0.506**, the five hottest R1s were followed by
R2s averaging **−0.130**, and the regression puts 10-08 at **2.309**, the *bottom* edge of the band. So
FT-1's risk has flipped from breaking the ceiling to breaking the floor. Today's 20Y reopening is the
counter-test and it agrees: five sessions after the 30Y's 79.5% indirect / 2.2% dealer print, the 20Y
cleared at **5.420%** on indirect **52.5%** and dealer **16.9%** — the 09-10 strength did not generalise
across the long end. Separately, `sb0607`'s replacement buyback schedule finally published **09-09** and
moved the 10-08 operation's size line from a hard **$2B cap** to a **"= or > $4 billion" floor**, which
**voids FT-2 by its own clause** without touching the mechanism it tested — so the eligibility claim is
re-registered as FT-4, with a free early read on **09-23**. And the tape is no longer the calm one this doc
baselined: MOVE **83.90** (a 3-month high), Brent **$109.24** (+14% off the 09-04 anchor), 2s30s **69bp**
(18bp flatter). Date is `estimate`, `symbols: []`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-15, D-23) | Stand aside | High | `symbols: []`, no house playbook is rates-keyed, and today's own long-end print (20Y at **5.420%**, dealer **16.9%**) says the regime is still repricing rather than settling. The 10-01 announcement is 16 days out; nothing before it is actionable. | Treasury moving coupon issuance off the published grid before **2026-10-01** — an off-cycle size change or a coupon CMB kills the "already in writing" premise this whole doc rests on |
| This week | Watch the **09-23 11:00am ET** preliminary CUSIP list, not the tape | High | The 09-24 20Y–30Y operation is the first long-end buyback under the new **"≥ $4B"** floor, and its eligible list tests the on-the-run/first-coupon exclusion **15 days before** the 10-07 list does, at zero cost. | **912810UW6 appearing on the 2026-09-23 preliminary list** — the FAQ's clauses are not applied as written, and the eligibility finding dies a fortnight before the auction it was written for |
| This month | Expect the 10-08 print **below 2.610**, nearer the band's floor than its ceiling | Medium | R1→R2 correlates **−0.506** over 18 cycles, the five hottest R1s reverted **−0.130** on average, and the regression's point estimate at R1=2.61 is **2.309**. Medium, not high, because **2.61 is out of sample** (in-sample R1 max 2.52) so the extrapolation is the weak link. | **The 2026-10-08 auction clearing at or above 2.610** — mean reversion fails on the one cycle it was registered for, and the persistence reading takes over |
| This quarter | The supply grid is knowable only through **2026-11-04**; do not carry naked duration through the 10-14/10-28 stack | Medium | MOVE **83.90** is a 3-month high (+14.8% since 09-04), Brent is +14%, and August PPI printed **+0.40%** m/m against +0.3% — the long end is being repriced by inflation, not by supply, and `sb0590`'s size table stops at Oct-26. | The **2026-11-04** refunding statement dropping the "maintain nominal coupon auction sizes for at least the next several quarters" language, or raising the 30Y off $22B — the fiscal-supply leg firing directly rather than by narrative |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an auction.** `symbols: []`, date is `estimate`, no house playbook
  (S1/S2/E1/S3/S4 + G1) is rates-keyed. This is a no-new-duration window, not a trade.
- **The size is still the null at $22B** — `sb0590` (2026-08-05) Oct-26 row, and 21 consecutive completed
  $22B reopenings since 2024-03-13 including 09-10. Read only a **deviation** as information.
- **The band broke, but on the R1 leg, not the R2 leg.** With 09-10 the modern $22B series is n=21, mean
  **2.419**, σ **0.069**, range **2.30–2.61** — yet **all 18 R2s on record still sit inside 2.30–2.52**.
  FT-1 stands, on the narrower base it always had.
- **Mean reversion, not persistence, is the R1→R2 relation** — corr **−0.506**, OLS `R2 = 3.484 − 0.450·R1`,
  residual σ **0.052**, 1-sd interval at R1=2.61 of **2.24–2.38**. Registered as
  **FT-treasury-30y-bond-2026-10-08-3**.
- **The 09-10 strength did not generalise.** Today's 20Y reopening cleared **5.420%** (+21.6bp over the
  08-19 new issue) on indirect **52.5%** and dealer **16.9%** — against the 30Y's 79.5% / 2.2% five
  sessions earlier. Treat 2.610 as auction-specific until a second long-end print repeats it.
- **The same-day buyback still cannot bid for this bond; only the size line moved.** The 09-09 schedule
  keeps the 10-08 operation's date, 1:40pm ET time, 20Y–30Y sector and **10/09/2046–10/08/2056** range and
  raises the size to a **"= or > $4 billion"** floor. Eligibility is the FAQ's on-the-run and first-coupon
  clauses, untouched by a size line. Re-registered as **FT-treasury-30y-bond-2026-10-08-4**.
- **Predicted top of both the 09-23 and 10-07 eligible lists: 912810UR7 (2056-02-15)** — 912810UU0's first
  coupon is **2026-11-15**, unpaid on both dates, so it stays excluded exactly as on 2026-08-18.
- **The buyback's channel is unchanged; its scale is not.** The first enlarged operation (09-10, 10Y–20Y)
  took **$5.187B against $10.489B offered** — the first 10Y–20Y op since 2024-05 not to fill its ceiling.
  It is still a bid for illiquid off-the-runs, now roughly 2.5x the size the initial research assumed.
- **Watch (dated):** FOMC **09-16** · 09-24 buyback's CUSIP list **09-23 11:00am ET** · OPEC+ **10-04** ·
  ISM Services **10-05** · 3Y **10-06** · 10Y **10-07** + FOMC minutes **10-07** + the preliminary CUSIP
  list **10-07 11:00am ET** · **this auction 10-08 1:00pm ET** + ECB account **10-08** + 20-30Y buyback
  **10-08 1:40pm ET** · bond market closed **10-12** · CPI + Beige Book **10-14** · settlement **10-15** ·
  blackout **10-17** · 20Y auction **10-21** · FOMC **10-28** · borrowing estimates **11-02** ·
  refunding **11-04**.

## Initial research

### The question, plainly

The September sibling ([`treasury-30y-bond-2026-09-10.md`](treasury-30y-bond-2026-09-10.md)) has already
argued the long-end term-premium case at length, and this event's own calendar note already predicts its
size (**$22B**) and its CUSIP (**912810UW6**). Restating either would be a non-question.

So the question this session actually asked was: **what does the *second* reopening pose that the first
did not — and does the intuitive answer survive the primary record?** Two candidates, both intuitive,
both testable, and both wrong:

1. Selling the same CUSIP a third time in three months should show **demand fatigue** — the "force-fed
   duration" story the September ledger's framing invites.
2. The buyback operation **40 minutes after** the 1:00pm close is a **same-day bid** for the bond just
   sold — because unlike September's operation, October's is the right sector and its maturity range
   genuinely covers this security.

**One-line verdict:** neither survives. The second reopening is the *most* stable leg of a 30Y cycle, not
the weakest; and the same-day operation cannot bid for this line — not because of its sector this time,
but because Treasury's revealed eligibility has excluded the on-the-run 30Y in every one of the 20 nominal
20Y–30Y operations on record. Both answers arrive with **dated, free falsifiers before the auction**,
which is what makes this event worth a stance at D-33 rather than a shrug.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no symbol-keyed
instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and the mandated cache
bust has nothing to bust (recorded, not silently skipped). Everything quantitative below was fetched from
a primary this session (**2026-09-05**) and derived here rather than inherited from a sibling:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, 17,195 bytes, four content streams decompressed and the text layer read directly.
- **The buyback schedule** — `home.treasury.gov/system/files/221/Tentative-Buyback-Schedule.pdf`, plain
  curl, HTTP 200, **125,547 bytes**, text layer decompressed directly.
- **Auction history** — `api.fiscaldata.treasury.gov` `auctions_query`, filtered
  `original_security_term:eq:30-Year, auction_date:gte:2022-01-01`, 67 rows, grouped by CUSIP into sale
  cycles here.
- **Buyback history** — the same API's `buybacks_operations` (filtered `maturity_bucket:eq:20Y to 30Y`,
  20 operations) and `buybacks_security_details` (444 rows, `maturity_date:gte:2050-01-01`), which lists
  every **eligible** CUSIP per operation with its par accepted — so "eligible but not purchased" and "not
  eligible at all" are distinguishable, which is the distinction leg 3 turns on.
- **The tape** — `home.treasury.gov` daily par yield curve CSV; VIX / MOVE / Brent daily closes.

**Cycle vocabulary used throughout:** a nominal 30-year bond is sold three times — a **NEW** issue, then
**R1** (`29-Year 11-Month`) the following month, then **R2** (`29-Year 10-Month`) the month after. This
auction is the **R2** of the cycle whose NEW issue sold 2026-08-13 and whose R1 sells 2026-09-10.

### Conviction legs, tested

**1. The date, security and settlement are what the calendar says — SUPPORTED, primary.** The tentative
schedule's row reads verbatim `30-Year BOND R / Thursday, October 01, 2026 / Thursday, October 08, 2026 /
Thursday, October 15, 2026`, matching the checked-in entry exactly, with the PDF's own legend confirming
`R --denotes reopening`. 1:00pm ET is Treasury's standing coupon convention and is **not** separately
sourced. Status correctly stays `estimate`: a tentative schedule is tentative by construction, and the
10-01 announcement is what fixes it.

**2. The size and CUSIP are over-determined — SUPPORTED, and this is why they are not the question.**
`sb0590`'s Oct-26 anticipated-size row puts the 30-Year at **$22 billion**; 20 consecutive completed 30Y
reopenings since 2024-03-13 printed exactly $22.0B; and every one of the 15 completed 30Y new-issue cycles
back to 2022-11 was reopened exactly twice, in the two following months. **A correction to this event's own
calendar note, primary-sourced:** it states that completing this auction "makes 912810UW6 a $69B security
(25 + 22 + 22)". That is offering-amount arithmetic and it understates the line. The 2026-08-13 sale's
**total accepted was $31.32B**, of which **$6.32B was a SOMA add-on** — so the line already stands above
$31B before either reopening, and $69B is a floor, not the figure.

**3. There is no second-reopening demand fatigue — REFUTED as a hypothesis, on 18 complete cycles.** This
is the session's first real finding, and it runs against the intuition the long-end narrative supplies.
Grouping every nominal ($≥15B) 30Y auction 2022-01 → 2026-08 by CUSIP gives 18 cycles with all three
sales completed:

| Leg | Bid-to-cover mean | σ | Range | Indirect (mean) | Dealer (mean) |
|---|---|---|---|---|---|
| NEW issue | 2.371 | **0.115** | 2.24 – 2.66 | 66.6% | 14.0% |
| R1 (first reopening) | 2.405 | 0.064 | 2.25 – 2.52 | 66.7% | 12.9% |
| **R2 (second reopening)** | **2.401** | **0.057** | 2.30 – 2.52 | **67.8%** | **12.6%** |

Paired within each cycle, **R2 − R1 averages −0.004** and is positive in **8 of 18** — a coin flip around
zero, not a decay. Three secondary readings all point the same way: R2 has the **tightest** dispersion of
the three legs, the **highest** indirect (end-investor) share, and the **lowest** dealer absorption — the
opposite of what "force-feeding the same line" predicts, where dealers would be left holding more each
time. The mechanism is unsurprising once stated: by the second reopening the security has a month of
secondary trading history, an established repo market and a known coupon, so it is *easier* to bid, not
harder. **Honest limits:** n=18 cycles, and bid-to-cover is a demand *proxy* — the tail (stop vs.
when-issued) is the sharper metric and **is not in fiscaldata**, because it requires a dealer when-issued
quote Treasury does not publish. Every tail figure in this ledger family is therefore secondary-sourced,
and this leg deliberately makes no tail claim.

**4. The modern $22B band is narrow and yield-insensitive — SUPPORTED, and it is the usable bar.** The 20
completed reopenings at the flat $22B size (since 2024-03-13, R1s and R2s together) printed bid-to-cover
**mean 2.409, σ 0.056, range 2.30 – 2.52**. What makes that band worth registering rather than merely
reporting is what it survived: over those same 20 auctions the clearing yield ran **4.015% (2024-09-12) to
5.058% (2026-07-09)**, a **104bp** climb spanning the entire long-end selloff the sibling ledgers document
— and the demand band did not widen for it. Split by leg, the 10 R2s average **2.413** and the 10 R1s
**2.405**, which is leg 3 again on the modern subsample. This is the long-end analogue of **FT-20**'s
front-end claim, filed on the tenor whose narrative is that it is broken.

**5. The same-day buyback cannot bid for this bond — SUPPORTED, and the September reasoning does not
transfer.** The buyback schedule places an operation on **2026-10-08, 1:40–2:00pm ET** (announce 10-07,
settle 10-09), Liquidity Support, Nominal Coupons **20Y to 30Y**, maturity range **10/09/2046 –
10/08/2056**, min $0 / max $2 billion. CUSIP 912810UW6 matures **2056-08-15**, which is **inside** that
range — so the September ledger's answer ("the operation is 10-20Y and cannot buy this CUSIP") is
**unavailable here**, and a reader stopping at the range would conclude the opposite of the truth.

The rule that actually excludes it is published, and this repo already carries it: TreasuryDirect's buyback
FAQ excludes **on-the-run securities** and any security **not past its first coupon payment date** (read
directly 2026-09-02 by [`treasury-buyback-20y30y-2026-09-24.md`](treasury-buyback-20y30y-2026-09-24.md);
the FAQ was **not reachable this session** — four candidate treasurydirect.gov/home.treasury.gov URLs
returned 404 — so the rule text is inherited and the arithmetic below is this session's independent check
of it). **912810UW6 fails both clauses on 10-08:** it is still on-the-run through this very reopening, and
its first coupon is **2027-02-15**.

The session's own contribution is showing that the *pattern* everyone would summarise as "Treasury skips
the two most recent 30Y issues" is **generated by the first-coupon clause**, not by a separate recency
rule. Across all **20** nominal 20Y–30Y operations on record (2025-04-02 → 2026-08-18), checking each
operation's published eligible-CUSIP list against the 30Y issues outstanding that day:

| Security at the time of the operation | Eligible |
|---|---|
| On-the-run 30Y | **0 / 20** |
| First-off-the-run 30Y | **0 / 20** |
| Second-off-the-run 30Y | **20 / 20** |

Taking the most recent operation (**2026-08-18**) apart issue by issue shows the clause doing the work:
912810UW6 (issued 08-17, first coupon 2027-02-15) fails both clauses; **912810UU0** (issued 2026-05-15,
coupons May/Nov 15, first coupon **2026-11-15**) is not on-the-run but has not reached its first coupon, so
it fails the second clause alone; **912810UR7** (issued 2026-02-17, coupons Feb/Aug 15, first coupon
**2026-08-15** — three days before the operation) clears both and **is** the top of that list. The single
direct precedent runs the same arithmetic: **2026-04-09**, the only prior date on which a nominal 20Y–30Y
operation and a 30Y auction shared a calendar day, excluded that morning's bond 912810UR7 (first coupon
2026-08-15, not yet reached) *and* 912810UP1 (first coupon 2026-05-15, not yet reached), topping out at
912810UM8 (first coupon 2026-02-15, past). Applied forward to **10-08**: 912810UU0's first coupon
(2026-11-15) still has not arrived, so the predicted top of the 10-07 list is **912810UR7** again.

**6. The buyback is a bid for old paper, not a term-premium backstop — SUPPORTED.** Even inside the
eligible list, purchases concentrate far from the current line. On **2026-08-18** the $2B cap filled from
just **three** issues — 912810SC3 (2048-05), 912810SU3 (2051-02), 912810SX7 (2051-05) — against **$19.87B
offered** across 36 eligible CUSIPs, a ~10:1 oversubscription of low-coupon, deeply-discounted off-the-runs.
Across all 20 operations the cap ($2B) bound in 18 of 20, and the number of issues actually bought ran 2–14.
"Liquidity support" is doing what its name says. Read together with leg 5, the practical consequence is
that **`sb0607`'s doubled long-end buyback capacity — which this event's calendar note names as the thing
this leg "sells into" — reaches this auction through the sector's general liquidity, never through a bid
for CUSIP 912810UW6.** Note also that `sb0607`'s (2026-08-19) promised updated buyback schedule is **still
unpublished 17 days on**: the posted PDF re-fetched this session is **byte-identical at 125,547 bytes** to
the 2026-09-03 pull the September ledger recorded, still mastheaded "For Publication August 5, 2026", with
both long-end rows capped at $2B.

**7. The corridor is dense but its inputs are mostly non-US or backward-looking — SUPPORTED.** 10-06 3Y ·
10-07 10Y reopening **and FOMC minutes** (Sep 15-16 meeting) · 10-08 this auction, the **ECB account** of
the 09-09/10 meeting, and the buyback · then CPI + Beige Book **10-14** and settlement **10-15**. Two
observations keep this honest rather than alarming. First, the two central-bank documents landing 10-07 and
10-08 are both **records of meetings already held** — the FOMC minutes are three weeks stale and the ECB
account four, and that account's own ledger measured publication-day moves at ~1.1x baseline across 13
editions. Second, the 09-10 sibling established across three observations (Warsh 8/28, Waller 9/3, payrolls
9/4) that **the long end is not trading the Fed path at all** — front-end repricing in either direction left
the 30Y roughly unchanged. Both cut toward "the 10-07/10-08 stack is quieter than its density suggests," and
neither is a reason to hold duration through it.

**8. The tape going in is calm and the concession is not building — SUPPORTED, primary, and 33 days
stale by construction.** Par curve at the 2026-09-04 close: 2Y **4.37** · 10Y **4.78** · 20Y **5.25** · 30Y
**5.24**, with **2s30s at 87bp**. The 30Y sits ~9bp under its 8/17 cycle-high close of 5.31%. Cross-asset:
**VIX 14.53**, **MOVE 73.10** (having round-tripped a +12% five-session climb in two sessions), **Brent
$95.83** — oil is the one leg holding at an elevated level rather than retracing. None of this is a
forecast for 10-08; it is the baseline the next pulse diffs against, and the probe-ref line above records
it mechanically.

### What plays the conditions support

None directional — the guard-shaped house answer, and here it is unusually well supported rather than
merely conservative. `symbols: []`, the date is `estimate`, and the two intuitions that would motivate a
position (fatigue on the third sale; a same-day official bid) are the two this session **refuted**. No new
duration-sensitive exposure into the 1:00pm ET release and none carried naked through the 10-06 → 10-08
corridor or the 10-14 CPI; existing high-duration exposure sized for both tails.

### Honest limits

The 10-01 announcement, the when-issued yield and the 09-10 first reopening's result **do not exist yet** —
this doc is written 33 days out and 5 days before the R1 print that is its own best falsifier, and it says
so rather than implying otherwise. Bid-to-cover is a demand proxy and the tail is not in the primary
dataset (leg 3). The buyback FAQ carrying the eligibility rule was **not reachable this session** (four
URLs 404), so its text is inherited from a sibling ledger's 2026-09-02 direct read and only the arithmetic
against it is first-hand (leg 5); the buyback record itself reaches back only to 2025-04, so "20 of 20" is
20 operations, not 20 years. n=18 complete cycles for leg 3 spans one issuance regime (2022–2026) with sizes ranging $18B to
$25B, so the level comparisons are cleaner than the cross-era ones — which is why leg 4 re-cuts the modern
flat-$22B subsample separately. Nothing here forecasts the clearing yield; every claim is about **demand
mechanics and eligibility**, which are the parts the primary record can actually settle.

## Stance & kill switches

**Stance (date `estimate`; size, CUSIP and eligibility all `estimate`/inference until their dated
confirmations).** No new duration-sensitive positions opened into the 1:00pm ET release or carried naked
through the 10-06 → 10-08 corridor. This is a **non-event with two free checks in front of it**, and the
research value is in the checks, not the auction: the 09-10 first reopening (D-28) tests the demand band a
month early, and the 10-07 preliminary eligible-CUSIP list (D-1) settles the same-day-buyback question
mechanically. The second reopening carries **no measured demand penalty** — it is the steadiest leg of a
30Y cycle on 18 cycles of evidence — and the same-day buyback **cannot bid for the line being sold**, on a
published FAQ clause corroborated 20/20, despite a maturity range that covers it. Both of those are findings
that would change the stance if falsified, not as reasons to size anything. `symbols: []`: no symbol-keyed
action exists to take.

**Predictions registered with a score-by date** (per the TEMPLATE rule, these also register in
[`forward-tests.md`](../forward-tests.md)):

- **FT-treasury-30y-bond-2026-10-08-1** — the 10-08 reopening clears bid-to-cover **inside 2.30–2.52**.
- **FT-treasury-30y-bond-2026-10-08-2** — **912810UW6 does not appear** on the preliminary eligible-CUSIP
  list published 11:00am ET **2026-10-07** for that day's 20Y–30Y operation.

**Stance change, 2026-09-15 (D-23) — receipt: the ledger row of the same date.** The guard-shaped
conclusion survives and hardens; the word *non-event* does not. Two kill switches fired. The 09-10 first
reopening printed **2.610**, outside the band, so the re-derivation the first kill switch demanded has been
done rather than patched: the band's failure is confined to the **R1** leg (all 18 R2s on record remain
inside 2.30–2.52), and the R1→R2 relation is **mean-reverting at corr −0.506**, which moves FT-1's risk
from the ceiling to the floor. `sb0607`'s replacement buyback schedule published **09-09**, moving the
10-08 operation's size line, which fires FT-2's own **void** clause verbatim — recorded as such rather than
argued away, with the mechanism re-registered as FT-4 under the new schedule. Meanwhile the baseline this
doc was written against no longer holds: MOVE at a **3-month high**, Brent **+14%**, an **18bp**
bear-flattening, and August PPI at **+0.40%** against +0.3%. So this is no longer "a non-event with two free
checks" — it is **a live demand test inside a repriced long end**, still stand-aside because `symbols: []`
and the date is `estimate`, but now carrying three dated checks rather than two and a directional
expectation about *how* the print will miss.

**Predictions registered 2026-09-15** (same TEMPLATE rule; rows in the fragment, not here):

- **FT-treasury-30y-bond-2026-10-08-3** — the 10-08 second reopening clears bid-to-cover **below 2.610**,
  the 09-10 first reopening's print.
- **FT-treasury-30y-bond-2026-10-08-4** — re-registration of the voided FT-2 under the **2026-09-09**
  schedule: **912810UW6 does not appear** on the 10-07 11:00am ET preliminary eligible-CUSIP list, with the
  **09-23** list for the 09-24 operation as its free early read.

**Kill switches:**

- **The 09-10 first reopening printing outside 2.30–2.52** — the band leg 4 rests on breaks a month before
  this auction, and both the band and leg 3's "no fatigue" reading get re-derived rather than patched.
- **912810UW6 on the 10-07 preliminary list** — the FAQ's on-the-run/first-coupon clauses are not applied
  as written, the same-day operation becomes a genuine bid for this line, and leg 5 dies outright. This is
  the single observation most likely to change what this event *is*.
- **A 10-01 announcement away from $22B** — Treasury departing from `sb0590`'s published guidance is the
  fiscal-supply leg firing directly, and it would also **void** FT-1 (the series stops being like-for-like).
- **A confirmed-weak print** — bid-to-cover below **2.30** (under the 20-auction floor), or indirect share
  below the low 60s — elevates this from "non-event" to "the second-reopening finding does not survive the
  current regime," read together with the 10-07 10Y the day before.
- **A superseded buyback schedule** — `sb0607`'s updated schedule finally publishing and moving the 10-08
  operation's sector, cap or date **voids** FT-2's setup rather than killing it; the 20/20 exclusion would
  still stand, but this auction would no longer test it.
- **The 11-04 refunding statement dropping "maintain nominal coupon and FRN auction sizes for at least the
  next several quarters"** — the guidance every size claim in this doc chains to.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-33 | Initial research banked (doc above). **The schedule is primary-verified:** the tentative auction PDF (HTTP 200, 17,195 bytes, text layer decompressed direct) reads `30-Year BOND R / Thursday, October 01, 2026 / Thursday, October 08, 2026 / Thursday, October 15, 2026`, matching the calendar entry exactly; status stays `estimate`. **Finding 1 — no second-reopening fatigue (leg 3):** 18 complete nominal 30Y cycles from `auctions_query` give bid-to-cover NEW **2.371** (σ 0.115) · R1 **2.405** (σ 0.064) · **R2 2.401 (σ 0.057)**, paired R2−R1 **−0.004** and positive in 8/18, with R2 carrying the highest indirect share (67.8%) and lowest dealer take (12.6%) of the three legs — the intuitive "force-fed duration" read is refuted on the tenor where it is most often asserted. **Finding 2 — the modern band (leg 4):** the 20 completed $22B reopenings since 2024-03-13 printed **2.30–2.52** (mean 2.409, σ 0.056) across clearing yields **4.015% → 5.058%**, a 104bp span the band did not widen for; registered as FT-treasury-30y-bond-2026-10-08-1. **Finding 3 — the same-day buyback cannot bid for this bond, for a different reason than September's (leg 5):** the 10-08 1:40pm ET operation is **20Y–30Y**, range **10/09/2046–10/08/2056**, which **does** cover 912810UW6 (matures 2056-08-15) — so the September ledger's "wrong sector" answer does not transfer. What excludes it is TreasuryDirect's buyback FAQ (on-the-run securities, and any not past their first coupon payment date; 912810UW6 fails both, first coupon **2027-02-15**). This session's addition is that the clause **generates** the eligibility record rather than a recency habit doing so: across all 20 nominal 20Y–30Y operations the on-the-run 30Y was eligible **0/20**, the first-off-the-run **0/20** and the second-off-the-run **20/20**, and taking 2026-08-18 apart issue by issue, 912810UU0 (first coupon 2026-11-15) fails the coupon clause alone while 912810UR7 (first coupon 2026-08-15, three days earlier) clears both and tops the list. Direct precedent: **2026-04-09**, the only prior date a 20-30Y operation shared a day with a 30Y auction, excluded both that morning's bond (912810UR7, first coupon 2026-08-15) and 912810UP1 (2026-05-15), topping out at 912810UM8. Registered as FT-treasury-30y-bond-2026-10-08-2; predicted top of the 10-07 list is **912810UR7**, since 912810UU0's first coupon is still unpaid on 10-08. Honest limit: the FAQ was **not reachable this session** (four URLs 404), so its text is inherited from the 09-24 buyback sibling's 2026-09-02 direct read and only the arithmetic against it is first-hand. **Correction to this event's own calendar note:** "$69B security (25 + 22 + 22)" is offering-amount arithmetic; the 08-13 sale's total accepted was **$31.32B including a $6.32B SOMA add-on**, so $69B is a floor. **`sb0607` (2026-08-19) still unfulfilled at 17 days:** the buyback PDF re-fetched this session is **byte-identical at 125,547 bytes** to the 09-03/09-05 pulls, still mastheaded "For Publication August 5, 2026", both long-end rows capped at $2B. Adjacency — **peers:** n/a (`symbols: []`). **Macro:** the 10-06/10-07/10-08 stack pairs the 3Y and 10Y with **FOMC minutes 10-07** and the **ECB account 10-08**, both records of meetings already held (three and four weeks stale respectively; the account's own ledger measured ~1.1x baseline publication-day moves over 13 editions); CPI + Beige Book land 10-14, after settlement. **Volatility:** VIX **14.53**, MOVE **73.10** (09-04 closes), the latter having surrendered ~three-quarters of a +12.3% five-session climb in two sessions — the September sibling's standing rule that a sub-week MOVE swing is noise until it survives a week is adopted here rather than re-derived. **Geopolitical:** Brent **$95.83** (09-04), holding the post-09-01 Hormuz level rather than extending; OPEC+ JMMC meets **10-04** inside the corridor. **Event tape:** par curve 09-04 — 2Y 4.37 · 10Y 4.78 · 20Y 5.25 · **30Y 5.24**, 2s30s **87bp**, ~9bp under the 8/17 cycle-high close; the 09-10 R1 of this same CUSIP is confirmed at **$22.0B** on treasurydirect and prints 28 days before this auction, making it this doc's free intermediate falsifier. **New dated adjacency PROPOSED as `estimate` in the same PR:** `treasury-buyback-20y30y-2026-10-08` — announce 10-07, operation 10-08 1:40–2:00pm ET, settle 10-09, 20Y–30Y nominal coupons, range 10/09/2046–10/08/2056, cap $2B, off the same tentative buyback PDF. It is the load-bearing object of finding 3 and was previously undated in this calendar; its 10-07 11:00am ET preliminary CUSIP list is where FT-2 scores. | — (stance set: guard-shaped, no new duration; `symbols: []` so no symbol-keyed action exists) | 2026-09-26 (medium, 31+d band: every 21d) |
| 2026-09-15 | D-23 | **Two kill switches fired; both re-derived, neither patched.** **(1) The 09-10 first reopening broke the band.** `auctions_query` (plain curl, HTTP 200, 241,289 bytes, re-pulled this session): 912810UW6's `29-Year 11-Month` leg cleared **5.3080%** at bid-to-cover **2.610** on $22.0B offered / $22.000B accepted, **no SOMA add-on** — outside the registered **2.30–2.52** band and **3.60σ** above the prior-20 mean (2.409, σ 0.056). Composition was the extreme, not just the ratio: indirect **79.48%** of competitive (2nd-highest of all 57 nominal 30Y auctions since 2022, behind 80.47% on 2024-10-10) and dealer **2.21%** (the **lowest of all 57**, next lowest 5.88%). Modern $22B series updated to **n=21, mean 2.419, σ 0.069, range 2.30–2.61**. **Re-derivation, as that kill switch required — and it produces this doc's third refuted intuition.** The natural follow-on ("a hot R1 means a hot R2") is backwards: across the 18 complete cycles, **corr(R1,R2) = −0.506**, OLS `R2 = 3.484 − 0.450·R1` with residual σ **0.052**, and the **five hottest R1s** (2.46–2.52) were followed by R2s averaging **−0.130**. At R1 = 2.610 the point estimate is **2.309** (1-sd interval 2.24–2.38). Two consequences stated plainly: **all 18 R2s on record still sit inside 2.30–2.52 (18/18)**, so FT-1 survives on the R2 leg even though the pooled band broke on an R1 — but its risk has **flipped from the ceiling to the floor**, since 2.309 sits 0.009 above the band's bottom. **Honest limit:** R1 = 2.61 is **outside the regression's in-sample R1 range (2.25–2.52)**, so this is extrapolation, which is why the month call is Medium. Registered as **FT-treasury-30y-bond-2026-10-08-3** (10-08 clears below 2.610). **(2) `sb0607`'s replacement buyback schedule published — FT-2 is void by its own clause.** Re-fetched direct this session: **89,250 bytes, md5 c49a5351bf2d31a367817abc62be51bd**, masthead **"For Publication September 9, 2026"**, against the stale edition's 125,547 bytes / md5 79b65955e74a59f6bebff3adf8ba7b35 that every prior row in this family recorded — independently matching the md5 the `treasury-buyback-increase-2026-09-09` close-out logged. The 10-08 row reads verbatim announce **10/7**, operation **10/8 1:40pm–2:00pm**, settle **10/9**, Liquidity Support, Nominal Coupons **20Y to 30Y**, range **10/09/2046–10/08/2056** — date, time, sector and range **all unchanged** — with the size line moving from a hard **`$0 / $2 billion`** to **`$0 / = or > $4 billion`**, a floor with discretion carried by every 10Y–20Y and 20Y–30Y row from 09-24 through 11-04 while every other sector keeps a hard number. FT-2's registered void clause names "sector, **date or cap**"; the cap moved, so **FT-2 is recorded void rather than argued around** — even though a purchase-size floor has no bearing on which CUSIPs are eligible, which is the FAQ's on-the-run and first-coupon clauses and is untouched. The mechanism is therefore **re-registered under the new schedule as FT-treasury-30y-bond-2026-10-08-4**, and this pulse's genuine addition is a **new free dated check two weeks earlier than 10-07**: the **09-24** 20Y–30Y operation (range 09/25/2046–09/24/2056, which also covers 912810UW6) publishes its preliminary eligible list **09-23 11:00am ET**, and 912810UW6 fails both clauses there too — on-the-run through 10-08, first coupon **2027-02-15**. Predicted top of the 09-23 list is **912810UR7**, same as 10-07. **Eligibility record unchanged at 0/20:** `buybacks_operations` shows **no 20Y–30Y operation since 2026-08-18** (only 09-03/09-09 1Mo–2Y, 09-10 10Y–20Y, and the 09-15 TIPS 10Y–30Y in flight), so no new observation has been added either way. **Leg 6 amended on scale, not on channel:** the first enlarged operation (09-10, 10Y–20Y) was set at **$6B** and took **$5,187,000,000 against $10,489,000,000 offered** — the first 10Y–20Y op since 2024-05 not to fill its ceiling — so the 10-08 20Y–30Y operation can plausibly run ~2.5x the $2B the initial research assumed, still ~4:1 oversubscribed and still buying off-the-runs. Adjacency — **peers:** n/a (`symbols: []`). **Macro:** the single mover named by a primary is **August PPI final demand +0.40% m/m SA / +5.44% y/y NSA vs +0.3% consensus** on 09-10 (BLS API, recorded on `treasury-buyback-increase-2026-09-09`); **FOMC decides 09-16**, and the minutes of that meeting publish **10-07**, inside this corridor. **Volatility — the September sibling's "a sub-week MOVE swing is noise until it survives a week" rule resolves to REGIME for the first time:** MOVE **83.90** (09-14) vs **73.10** (09-04), **+10.8 points / +14.8%**, the **3-month high** (3mo range 65.39–83.90, mean 73.24), and above 76 for **five consecutive sessions** (76.14 · 76.74 · 82.09 · 82.21 · 83.90). VIX **17.10** (09-14) vs 14.53, **+2.57** — below the screen's 3-point bar but the same direction. **Geopolitical:** Brent front-month **$109.24** (09-15) vs **$95.83** (09-04), **+14.0%**; Brent spot (EIA via FRED) ran 102.24 → **109.51** through 09-09. The initial research called oil "the one leg holding at an elevated level rather than retracing" — it did not hold, it extended, and OPEC+ meets **10-04** inside the corridor. **Event tape:** par curve 09-14 — 2Y **4.65** · 10Y **4.97** · 20Y **5.37** · **30Y 5.34**, **2s30s 69bp** against 87bp on 09-04, an **18bp bear-flattening** on 2Y **+28bp** vs 30Y **+10bp** — which *corroborates* leg 7's "the long end is not trading the Fed path" rather than contradicting it. The 30Y printed **5.37%** on 09-10, its highest par close of 2026. **The cleanest counter-test is today's own auction:** the **09-15 20Y reopening** (912810UX4, $13B) cleared **5.4200%** — **+21.6bp** over the 08-19 new issue's 5.204% — at bid-to-cover **2.57** but indirect **52.47%** and dealer **16.85%**, against the 30Y's 79.48%/2.21% five sessions earlier. The 09-10 composition **did not generalise across the long end**, which is the strongest single reason to read 2.610 as auction-specific rather than as a demand regime, and it points the same way the mean-reversion regression does. **Corridor grew from 9 adjacent ids to 20**, and the cadence band **transitioned medium:31+ → medium:8+** (21d → 7d interval). New in the corridor since the last row and worth naming: **sifma-bond-market-closure-2026-10-12** (the bond market is shut two sessions after this auction), **jgb-30y-auction-2026-10-08** (same-day foreign long-end supply, which the initial research did not have), **opec-plus-meeting-2026-10-04** beside the JMMC, and **ism-services-2026-10-05** — the corridor's only **confirmed high-impact** adjacent and now this event's sole `adjacentStrongIds` entry. **No new dated adjacency proposed, and the check is recorded rather than assumed:** every row of the new buyback schedule (09-15 → 11-05, twelve operations) and every Oct/Nov row of the auction schedule, including the **10-01 coupon announcement** where this event's `estimate` resolves, is **already a tracked calendar entry** — the first pulse in this family to find the corridor fully covered. Status stays **estimate**; the 10-01 announcement is 16 days out and `sb0590`'s **$22B** remains the null. | **CHANGED** — from "a non-event with two free checks" to **a live demand test in a repriced long end**: same stand-aside (still `symbols: []`, still `estimate`), but FT-1's risk flips ceiling → floor, FT-2 is void and re-registered as FT-4, and FT-3 adds a directional expectation about *how* 10-08 misses | 2026-09-22 (medium, 8+d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
</content>
</invoke>
