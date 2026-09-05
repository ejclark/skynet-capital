# 7-Year Treasury Note auction (new issue) — treasury-7y-note-2026-10-29

**Kind:** rates · **Date:** 2026-10-29 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-05 — `7-Year NOTE / Thursday, October 22, 2026 / Thursday, October 29, 2026 / Monday, November 02, 2026`, no `R`; 1:00pm ET by convention, not separately sourced) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["consumer-confidence-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","ism-manufacturing-2026-11-02","midterm-elections-2026-11-03","pce-2026-10-29","sloos-2026-11-02","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-borrowing-estimates-2026-11-02"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The 7-year auction moves the 7-year only against its neighbours, and 2026-10-29 is the
date where even that cannot be seen.** Measured this session from Treasury's own `auctions_query` and
par yield curve (44 nominal 7Y auctions since 2023-01, 919 sessions): the 7Y **level** on its own
auction day moves **−1.43bp** (t = −1.61) — *not* significant, and a flat contradiction of the
[2Y sibling's](treasury-2y-note-2026-10-26.md) −6.07bp front-end result, which does **not** generalise
to the belly. What is significant is the **spread**: **7Y-minus-10Y prints −0.95bp** on auction days
(t = **−5.04**, 27 negative / 4 positive / 13 zero, sign-test **p = 0.000034**) against **+0.02bp** on
875 non-auction sessions, and the placebo passes — 5Y-minus-10Y on the same days is **+0.27bp**
(t = 0.96), so the tenor actually being sold is the only one that outperforms. The effect is confined
to D+0 and about half reverses by D+2 (**+0.55bp**, t = 3.46). **But it is a ~1bp signal, and 10-29 is
the loudest session on the quarter's calendar:** GDP and PCE at 08:30, the ECB decision at 09:15, the
whole thing one session after the **2026-10-28** FOMC — a session whose 7s10s *already* averages
−0.66bp for its own reasons. And the auction's own historical slot is nearly empty: only **two** 7Y
auctions since 2023 have sold the session after an FOMC decision (2023-07-27, 2026-01-29), so there is
no prior to lean on. Size is **$44B**, primary-verified. `symbols: []`, date `estimate`, nothing here
is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-54) | **Stand aside** | High | Size, CUSIP and when-issued do not exist until the **2026-10-22** announcement, and `symbols: []` leaves nothing to express a view in. | Nothing dated today for this event; its terms are 47 days away |
| This week | **Stand aside** | High | Nothing this week is this tenor's own data. The next 7Y-specific fact of any kind is the 10-22 announcement. | The **2026-09-11** CPI — which moves the policy path this auction prices, not the auction |
| This month | **Grade the 09-24 predecessor on dealer takedown, and retire the "indirect < 57%" trigger** | Medium | Indirect and direct shares are substitutes at this tenor too (corr **−0.885**, t = −12.30), so indirect measures channel mix, not demand; the residual dealers must eat is the only bucket that is not a reclassification. | The 09-24 print drawing indirect below 57% **and** dealer above the 2025-04+ p75 of **12.75%** — the two metrics agreeing would say the correction was unnecessary |
| This quarter | **Do not attribute anything on 2026-10-29 to the auction** | Medium | The auction's whole measured signature is ~1bp of 7s10s, inside a session carrying GDP + PCE + ECB + the FOMC's own morning-after. Four candidate causes outrank it. | The 7Y-minus-10Y spread **widening** on 2026-10-29 (7Y underperforms) — the auction-day effect failing in its own slot (registered as **FT-treasury-7y-note-2026-10-29-1**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, date `estimate`, and no house playbook (S1/S2/E1/S3/S4
  + G1) is rates-keyed. Read-it-don't-trade-it.
- **The measured effect, stated so it stops being assumed:** level **−1.43bp** (t = −1.61,
  **not** significant); **7Y−10Y −0.95bp** (t = −5.04); **7Y−5Y −1.23bp** (t = −6.58).
- **The base case for 10-29 is a normal-loudness session for the 7Y** — mean |move| on auction days is
  **4.93bp** vs **4.89bp** all-session. The 2Y's auction day is louder; the 7Y's is not.
- **Grade the print on dealer takedown**, 2025-04+ regime, n=17: p25 **10.42%** · median **11.64%** ·
  p75 **12.75%**. **Weak** = above 12.75%. **Strong** = at or below 10.42%.
- **The retired yardstick, named so it stops being reused** — the "indirect share < ~57%" trigger the
  [08-27](treasury-7y-note-2026-08-27.md) and [09-24](treasury-7y-note-2026-09-24.md) siblings carried.
  It has fired twice in the $44B era with no consequence, and indirect/direct are substitutes.
- **Percentages are on the competitive base** (indirect + direct + dealer), never `total_accepted` —
  SOMA and non-competitive add-ons ran **$4.86–6.59B** on the last four 7Ys, ~11–13% of the offering.
- **Bid-to-cover band, $44B era only** (29 auctions, 2024-04-25 → 2026-08-27): mean **2.554**,
  sd 0.107, min **2.40** · p25 2.490 · median 2.510 · p75 2.640 · max **2.79**. Outside 2.40–2.79 is
  the first in the era.
- **Bid-to-cover does relate to the same-day level move** (corr **−0.430**, t = −3.09) but only weakly
  to the spread (corr −0.328, t = −2.25) — and dealer takedown not at all (corr **0.001**).
- **Size is settled before it opens — $44B**, verbatim from `sb0590` (2026-08-05), read direct this
  session; a deviation at the **2026-10-22** announcement voids every like-for-like claim above.
- **Watch (dated)** — CPI **09-11** · FOMC **09-16** · the predecessor 7Y **09-24** · CPI **10-14** ·
  FOMC blackout opens **10-17** · this announcement **10-22** · 2Y **10-26** · 5Y **10-27** · FOMC
  **10-28** · this auction **10-29** · settlement **11-02** · the next 7Y **11-25** (a Wednesday).

## Initial research

**The question, plainly:** the [2Y sibling](treasury-2y-note-2026-10-26.md) measured a large,
robust front-end rally on 2-year auction days and asked whether it survives selling *into* an FOMC.
This auction poses the mirror question at the other end of the same announcement block — does a
belly auction do anything measurable at all, and does selling the session *after* a decision change
what the day can tell us?

**One-line verdict:** the 2Y's headline does not generalise — at 7 years the auction moves the level
by an amount indistinguishable from noise, and its only reliable signature is a **~1bp
relative-value** one against the 10-year; on 2026-10-29 that signature is smaller than four other
things landing the same morning, which makes the deliverable an **attribution refusal**, not a call.

**Method:** sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode —
the house instruments are symbol-keyed and this event has `symbols: []`, so no `earnings-cycle` /
`intraday-edges` run applies and no cache bust was required. Every figure below is computed this
session from two Treasury primaries fetched today: the Fiscal Data `auctions_query` dataset (all 44
nominal 7-Year note auctions since 2023-01-01) and the daily par yield curve CSVs for 2023–2026 (919
close-to-close observations, 2023-01-03 → 2026-09-04). Schedule provenance is the Tentative Auction
Schedule PDF (home.treasury.gov, HTTP 200, 17,195 bytes, text layer decompressed direct). Size
provenance is press release `sb0590` (2026-08-05), fetched and read as text this session. FOMC
decision dates are parsed from federalreserve.gov's own `fomccalendars.htm` (HTTP 200, 164,831 bytes)
rather than typed from memory; policy pricing is carried from [`fomc-2026-10-28.md`](fomc-2026-10-28.md).
VIX is the 2026-09-04 close. Each claim dated in line.

### Conviction legs, tested

**1. The date and terms are right, and the entry stays `estimate` on purpose — SUPPORTED.** The
tentative schedule carries the row verbatim: `7-Year NOTE · Thursday, October 22, 2026 · Thursday,
October 29, 2026 · Monday, November 02, 2026`. The flag column *is* populated in the same October
block — `20-Year BOND R` (reopening) and `5-Year TIPS T` sit two rows above — so the absence of an
`R` here is a positive signal of a new issue, not a missing field. The entry's own source note
already binds this lane: it may not self-confirm an event it discovered in-sweep, and the confirming
primary is the **2026-10-22** announcement. Every October sibling off this identical PDF
([20Y 10-21](treasury-20y-bond-2026-10-21.md), [5Y TIPS 10-22](treasury-5y-tips-2026-10-22.md),
[2Y 10-26](treasury-2y-note-2026-10-26.md)) chose `estimate` for the same reason. **Recorded so a
later session does not re-litigate it:** this is a consistency call on a 47-day-out tentative
schedule, not a date doubt.

**2. The size is $44B — SUPPORTED, primary-read.** `sb0590`'s anticipated-size table, read directly
this session, has header `2-Year 3-Year 5-Year 7-Year 10-Year 20-Year 30-Year FRN` and **Oct-26 row
`69 58 70 44 39 13 22 30`** — the 7-Year is the fourth column, $44B. The release also states verbatim
that "Treasury anticipates maintaining nominal coupon and FRN auction sizes for at least the next
several quarters." The dataset corroborates: **29 consecutive $44B 7-year auctions**, 2024-04-25 →
2026-08-27, after a monotone ramp 35 → 44 between 2023-01 and 2024-04.

**3. THE FINDING — the 7Y auction is a relative-value event, not a level event, and the 2Y sibling's
result does not generalise — SUPPORTED.** Close-to-close moves over 919 par-curve sessions:

| Population | n | 7Y level | 7Y−10Y | t (7Y−10Y) |
|---|---|---|---|---|
| All sessions | 919 | +0.08bp | — | — |
| **7Y auction days** | **44** | **−1.43bp** (t = −1.61) | **−0.95bp** | **−5.04** |
| Non-auction sessions | 875 | +0.16bp (t = 0.74) | +0.02bp | +0.49 |
| Non-auction Thursdays | 158 | — | −0.09bp | −0.80 |
| Non-auction, last 8 biz days of month | 312 | — | +0.03bp | +0.47 |

The **level** result is the negative one and it matters: at −1.43bp with t = −1.61 it is not
distinguishable from noise, where the 2Y sibling measured **−6.07bp** with t = −4.91 on its own
tenor. Auction days are not even louder here — mean |move| **4.93bp** against **4.89bp** all-session,
where 2Y auction days ran 6.39 vs 4.83. Whatever the front-end effect is, it is a front-end effect.

The **spread** result survives everything this session could throw at it. It is confined to the
session itself (D−3 +0.16, D−2 −0.05, D−1 +0.11, **D+0 −0.95**, D+1 −0.09, D+3 −0.23; only D+0 and
D+2 significant). All 44 auctions fall in the last eight business days of their month and 27 of 44
are Thursdays, and both controls are flat (+0.03bp and −0.09bp). It is stable across halves (−1.09,
t = −3.72 / −0.82, t = −3.37) and 2025-onward (−0.70, t = −2.77), and survives dropping the single
|spread| ≥ 4bp observation (−0.88, t = −4.91). The **sign test** is the cleanest form of it: **27
negative, 4 positive, 13 zero**, two-sided **p = 0.000034**, against a non-auction baseline where
48.3% of non-zero sessions are negative. Bootstrap 95% CI on the mean: **[−1.32, −0.59]bp**.

**4. The placebo passes — the tenor being sold is the only one that outperforms — SUPPORTED.** On the
same 44 sessions, **5Y−10Y is +0.27bp** (t = 0.96) and **30Y−10Y is −0.43bp** (t = −1.40); neither
neighbour shows anything. **7Y−5Y is −1.23bp** (t = −6.58) against +0.08bp on non-auction sessions.
So the effect is not "the belly rallies when Treasury sells the belly" — it is specific to the CUSIP
being auctioned, which is the shape a genuine auction-concession-and-snapback should have. **And it
does snap back:** 7Y−10Y at **D+2 is +0.55bp** (t = 3.46), reversing about 58% of D+0 within two
sessions. That D+2 figure is one cell of a seven-cell window scan and is *not* corrected for multiple
comparisons — it is reported because it is the mechanism's own prediction, not because it was hunted.

**5. The 2026-10-29 slot is nearly empty, and inventing a prior for it would be the error — MIXED,
stated as unresolved.** Exactly **two** 7Y auctions since 2023-01 have sold the session after an FOMC
decision, and they disagree completely:

| Auction | FOMC | 7Y level move | 7Y−10Y | b/c | Dealer% |
|---|---|---|---|---|---|
| 2023-07-27 | 2023-07-26 | **+14bp** | −1.00bp | 2.48 | 14.34% |
| 2026-01-29 | 2026-01-28 | **−4bp** | −2.00bp | 2.45 | 10.93% |

n=2 supports no mean, no band, and no test — and this doc declines to build one. What *is* measurable
is the session itself, independent of any auction: across all **29** FOMC decisions on this record,
the following session moves the 7Y **−1.72bp** (t = −1.29, not significant) with 7Y−10Y at
**−0.66bp** (t = −2.25, significant), on mean |move| **5.59bp** against 4.89bp ordinarily. So the
morning after a decision is a **louder** session that already flattens 7s10s by roughly two-thirds of
the auction's entire signature — before GDP, PCE or the ECB are counted. Note both historical
observations share the same calendar cause (a January or July FOMC that meets Tue–Wed against a
7Y that auctions Thursday), and the next recurrence is **2027-01-28** — FOMC Jan 26–27, 7Y auction
Jan 28, both in the primaries read this session. This slot grows by one observation roughly once a
year, which is the honest reason it will stay under-powered for a long time.

**6. The indirect-share yardstick fails at this tenor too, and two sibling ledgers carried it —
REFUTED.** [08-27](treasury-7y-note-2026-08-27.md) set an "indirect (foreign) bidder share < ~55%"
trigger and [09-24](treasury-7y-note-2026-09-24.md) tightened it to "< ~57%" before standing it down
on one print. Across all 44 auctions the metric cannot bear that weight: **corr(indirect%, direct%) =
−0.885**, t = **−12.30** — near-perfect substitutes, so a fall in one is a rotation between
submission channels, not a loss of buyers. Their sum is less than half as noisy (sd **3.22pt** vs
sd(indirect) **6.85pt**), and it *rose* across the regime break (87.83% → 89.00%) over exactly the
window indirect fell (69.63% → 64.51%) and direct rose (18.20% → 24.50%). Inside the $44B era the
"< 57%" line has been crossed **twice** (56.42% on 2025-09-25, 56.65% on 2025-11-26) with no
consequence either doc recorded. This **replicates the 2Y sibling's finding at an independent tenor**
— which is what turns it from a one-series artifact into a property of the auction data. The residual
that is not a reclassification is **dealer takedown**, and it has fallen structurally (12.17% →
11.00%); 2025-04+ quantiles p25 **10.42** / median **11.64** / p75 **12.75**. 2026-08-27 took 12.26%,
the 66th percentile of the $44B era — ordinary, slightly heavy.

**7. A methodology correction the next rates session should inherit — SUPPORTED.** Filtering
`auctions_query` on `original_security_term:eq:7-Year` returns **45** rows, one of which is
**2025-02-25**: `security_term` **5-Year**, $70B, maturity 2030-02-28, `reopening: Yes`. That is not
a defect — it is a 7-year note from February 2023 being reopened two years later, when five years
remain, and the API is reporting both facts correctly. The right filter for "7-year auctions" is
**`security_term`**, which returns 44 rows and **zero reopenings**. Two consequences. First, every
figure in this doc uses the 44-row set; the level effect is −1.43bp on it and −1.64bp on the
contaminated 45. Second, and offered to the sibling rather than asserted over it: the
[2Y ledger](treasury-2y-note-2026-10-26.md) reads its own 2026-01-26 `reopening: Yes` row as "a
metadata defect… internally inconsistent," because a 2023-01-31 issue maturing 2028-01-31 "is a
five-year note's profile, not a two-year's." Pulled directly this session, that row carries
`security_term = 2-Year`, `original_security_term = 5-Year`, `original_issue_date = 2023-01-31`,
`series U-2028`, `int_rate 3.500%` — which is **exactly self-consistent** under the same reading:
a January-2023 five-year with two years left. The fields are not in conflict; the pair
`security_term` / `original_security_term` was. The one thing this session cannot reconcile is the
`Original CUSIP 91282CPV7` the sibling read from the results PDF against the API's
`cusip 91282CGH8`, so the sibling's "the 2Y is never reopened" claim is left open rather than
overturned — flagged for whoever revisits it.

**8. The corridor is saturated, and that is the practical output — SUPPORTED.** Fourteen tracked
events sit within five days of 2026-10-29, and **three of them share the date**:
[GDP Q3 advance](gdp-q3-2026-advance-2026-10-29.md) and [PCE](pce-2026-10-29.md) at 08:30 ET (both
`confirmed`, both `high`), the [ECB decision](ecb-decision-2026-10-29.md) at 09:15 with its press
conference at 09:45, and this auction at 13:00. One session earlier is
[`fomc-2026-10-28`](fomc-2026-10-28.md), which that ledger prices at roughly a **coin flip** with
**no SEP and no forward guidance** — abolished 2026-08-28 — loading the news onto the statement
itself. Against that, an effect whose entire measured size is ~1bp of 7s10s is not recoverable at
daily resolution, and no honest reading of 10-29's tape can assign a move to $44B of seven-year
paper. **One asymmetry worth carrying forward:** the tracked
`government-funding-deadline-2026-09-30` threatens the 08:30 half of that stack — the
[PCE ledger](pce-2026-10-29.md) records the 2025 precedent, where a September-reference PCE was
delayed five weeks and the advance GDP sharing its slot was cancelled outright — while Treasury's
marketable-debt operations run on permanent authority and continued through the 2013 and 2018–19
lapses. This doc did **not** re-verify that operational point against a primary this session and
flags it as inherited knowledge; if it holds, a lapse would *thin* 10-29's stack and make the
auction's own signature marginally more legible, which is the one path by which this event becomes
readable.

**What plays the conditions support:** none directional, none symbol-keyed — the standing house
answer for this event kind. The usable output is a **reading instruction** for the session that pulls
this ledger on 2026-10-29: expect an ordinary-loudness 7Y session, expect 7s10s to flatten by ~1bp
from the auction and ~0.7bp from the FOMC hangover, and do not report either as the auction's doing.
That is an attribution rule, not a position.

**Honest limits.** The **level** effect is not significant and this doc says so rather than reporting
−1.43bp as a finding. The **spread** effect is a **daily close-to-close** measurement on a fitted CMT
curve rounded to 1bp — adjacent-tenor spreads on a smoothed par curve are exactly where fitting
artifacts would hide, and 13 of 44 auction-day observations are literally zero, which is what
rounding to 1bp looks like. Causation is not established: the auction is one of many things in a
session, and a ~1bp mean sits at the resolution limit of the series. The D+2 reversal is one cell of
a seven-cell scan with no multiple-comparison correction. The post-FOMC slot is **n=2** and this doc
builds nothing on it. The 2023-01 start is a data-availability boundary, not a regime boundary, and
the 2025-04 bidder-share break is identified by inspection, not a structural-break test. FOMC
proximity is measured in trading sessions from the par-curve index, so the two 2026 auctions after
2026-09-04 have no forward FOMC in range — immaterial, since both fall in the far bucket either way.
This auction's own size, CUSIP, when-issued level and demand **do not exist yet**; the announcement
is 2026-10-22. `symbols: []`, `medium` impact, date `estimate`: nothing here licenses a position in
any name.

## Stance & kill switches

**Stance (estimate-dated event; no standalone play):** watch-only, and the specific contribution is a
**measured refusal**. The 7-year auction's only reliable footprint is **−0.95bp of 7Y-minus-10Y on
the day it prices** (t = −5.04, sign-test p = 0.000034, placebo-controlled against 5Y−10Y and
30Y−10Y), about half of which reverses by D+2; its **level** effect, −1.43bp at t = −1.61, is noise,
so the [2Y sibling's](treasury-2y-note-2026-10-26.md) −6.07bp front-end rally is a front-end
phenomenon and must not be carried to the belly. On **2026-10-29** that ~1bp signature lands inside a
session carrying GDP and PCE at 08:30, the ECB at 09:15, and the morning-after of a coin-flip FOMC
that on its own flattens 7s10s **−0.66bp** — so the correct output for that date is *do not
attribute*, and the auction's own historical slot (n=2, +14bp and −4bp) offers nothing to lean on.
Grade the print itself on **dealer takedown** ($44B era: p25 10.42 / median 11.64 / p75 12.75), never
on indirect share, which is a substitute for direct share (corr −0.885) and therefore measures
channel mix — a correction that retires the "indirect < ~55/57%" trigger the
[08-27](treasury-7y-note-2026-08-27.md) and [09-24](treasury-7y-note-2026-09-24.md) siblings carried.
Size is $44B, primary-verified. Nothing here is directional and no house playbook applies.

**Kill switches (what would change this stance):**

- **The core one — 7Y-minus-10Y *widening* (7Y underperforming the 10Y) on 2026-10-29.** The
  auction-day effect failing in its own slot would say either the effect does not survive a loud
  session or it was never causal, and leg 3 stops being usable as a prior for the 2026-11-25 and
  2026-12-29 7Ys. Registered as **FT-treasury-7y-note-2026-10-29-1** in
  [`forward-tests.md`](../forward-tests.md), score by 2026-10-30, with its null pass rates and its
  **asymmetric** informativeness stated up front — the FOMC-D+1 session pushes the *same* direction,
  so a pass is confounded and only a fail is clean evidence.
- **A size change at the 2026-10-22 announcement.** $44B is written guidance in `sb0590` and 29
  consecutive auctions of precedent; any deviation breaks the like-for-like series, voids the
  bid-to-cover band and the forward test, and must be logged off-cadence whenever the next pulse is
  due.
- **Bid-to-cover printing outside 2.40–2.79** on 09-24 or 10-29 — the $44B era's full range dies on
  either side, and with it the base rate this doc hands the November and December 7Ys.
- **The 09-24 predecessor printing dealer takedown above 12.75%** (the 2025-04+ p75) — the first
  evidence that the residual metric this doc promotes is itself deteriorating, which would make
  October a demand question rather than an attribution one and is worth an off-cadence pulse.
- **The FOMC moving off 2026-10-27/28, or the auction moving off 10-29 at the announcement.** The
  post-decision framing is the whole of leg 5; if the pairing breaks, this reverts to an ordinary
  month-end belly sale graded on leg 3 alone, and the forward test still scores (it is a claim about
  the auction, not about the FOMC) but loses its confound and becomes *more* informative.
- **A funding lapse from 2026-10-01 cancelling the 10-29 GDP release** — it would thin the stack this
  doc's whole call rests on, and is the only realistic path to 10-29 becoming legible.
- **Nothing here licenses date-keyed *action*.** The date is `estimate`; observations widen caution
  rather than licensing entries, and `symbols: []` means there is no instrument to express one in.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-54 | Initial research banked (doc above); `probe-ref` populated with real readings so this event's first `interval-elapsed` pulse is screenable rather than automatically material. **Event tape (primary).** Terms re-verified verbatim from home.treasury.gov's Tentative-Auction-Schedule.pdf (HTTP 200, 17,195 bytes, text layer decompressed direct today): announce **Thu 2026-10-22**, auction **Thu 2026-10-29**, settle **Mon 2026-11-02**, no `R` → new issue (the flag column IS populated in the same October block — `20-Year BOND R`, `5-Year TIPS T` — so the blank is a signal, not a gap). Entry stays **`estimate`**: its own source note bars this lane from self-confirming an event it discovered in-sweep, and all three October siblings off the identical PDF chose the same. **Size $44B**, verbatim from `sb0590` (2026-08-05) read as text today — header `2-Year 3-Year 5-Year 7-Year 10-Year 20-Year 30-Year FRN`, **Oct-26 row `69 58 70 44 39 13 22 30`**, plus the release's own "anticipates maintaining nominal coupon and FRN auction sizes for at least the next several quarters"; 29 consecutive $44B 7Ys (2024-04-25 → 2026-08-27) corroborate. **THE LOAD-BEARING FINDING — the 7Y auction is a relative-value event, not a level event, and the 2Y sibling's headline does NOT generalise to the belly.** All 44 nominal 7Y auctions since 2023-01 (fiscaldata `auctions_query`) against 919 par-curve sessions (2023-01-03 → 2026-09-04, CSVs fetched today): 7Y **level** on auction days **−1.43bp, t = −1.61 — not significant**, against the [2Y sibling's](treasury-2y-note-2026-10-26.md) −6.07bp/t = −4.91 on its own tenor; auction days are not even louder (mean \|move\| **4.93** vs **4.89** all-session, where the 2Y ran 6.39 vs 4.83). What IS significant is the spread: **7Y−10Y −0.95bp, t = −5.04**, vs **+0.02bp** on 875 non-auction sessions, **−0.09bp** on 158 non-auction Thursdays and **+0.03bp** on 312 non-auction last-8-business-day sessions (all 44 auctions fall in that window; 27 of 44 are Thursdays). Sign test **27 neg / 4 pos / 13 zero, two-sided p = 0.000034**; bootstrap 95% CI **[−1.32, −0.59]bp**. Confined to D+0 (D−1 +0.11, D+1 −0.09), stable across halves (−1.09/−0.82) and 2025-onward (−0.70, t = −2.77), and robust to dropping the one \|spread\| ≥ 4bp point (−0.88, t = −4.91). **Placebo passes:** 5Y−10Y on the same days **+0.27bp** (t = 0.96) and 30Y−10Y −0.43bp (t = −1.40) — only the auctioned tenor outperforms; 7Y−5Y is **−1.23bp** (t = −6.58). **Mechanism's own prediction holds:** ~58% reverses by **D+2 (+0.55bp, t = 3.46)**, reported as one cell of a seven-cell scan with no multiple-comparison correction. **AND 10-29 IS THE DATE WHERE NONE OF IT IS RECOVERABLE.** Only **two** 7Y auctions since 2023 sold the session after an FOMC decision, and they disagree outright — 2023-07-27 **+14bp** (b/c 2.48, dealer 14.34%) and 2026-01-29 **−4bp** (b/c 2.45, dealer 10.93%); n=2 supports no prior and this doc builds none. The *session* is measurable though: across all 29 FOMC decisions (dates parsed from federalreserve.gov's own `fomccalendars.htm`, HTTP 200, 164,831 bytes — the 2025-08-22 row excluded as "22 (notation vote)", not a rate decision), the following session moves the 7Y −1.72bp (t = −1.29) with **7Y−10Y −0.66bp (t = −2.25)** on mean \|move\| **5.59bp** vs 4.89 — louder, and already flattening 7s10s by two-thirds of the auction's whole signature, before GDP/PCE/ECB. Next recurrence of the slot: **2027-01-28** (FOMC Jan 26–27, 7Y auction Jan 28, both in today's primaries) — it grows ~one observation a year. **SECOND FINDING — the indirect-share yardstick fails at this tenor too, which REPLICATES the 2Y sibling's correction at an independent tenor.** [08-27](treasury-7y-note-2026-08-27.md) set "indirect < ~55%" and [09-24](treasury-7y-note-2026-09-24.md) tightened it to "< ~57%": **corr(indirect%, direct%) = −0.885, t = −12.30**, sd(end-user) **3.22pt** vs sd(indirect) **6.85pt**, and end-user share ROSE 87.83% → 89.00% across the 2025-04 break where indirect fell 69.63% → 64.51% and direct rose 18.20% → 24.50%. The line has been crossed twice in the $44B era (56.42% 2025-09-25, 56.65% 2025-11-26) with no consequence either doc recorded — the trigger is **retired**. Residual metric: dealer takedown, structurally lower (12.17% → 11.00%), 2025-04+ p25 **10.42** / med **11.64** / p75 **12.75**; 2026-08-27 took 12.26%, the 66th percentile of the era. **METHOD CORRECTION for the next rates session:** `original_security_term:eq:7-Year` returns 45 rows including **2025-02-25** (`security_term` 5-Year, $70B, `reopening: Yes`) — a Feb-2023 7Y reopened with five years left, not a defect; **`security_term` is the correct filter**, 44 rows, zero reopenings. Offered to the 2Y sibling rather than asserted over it: its 2026-01-26 "internally inconsistent metadata defect" row reads exactly self-consistently under the same `security_term`/`original_security_term` pairing (2-Year / 5-Year, original issue 2023-01-31, series U-2028, 3.500%); the PDF-vs-API CUSIP discrepancy it also names is left unresolved here. **Macro.** Par curve 2026-09-04: 2Y 4.37, 5Y 4.54, **7Y 4.65**, 10Y 4.78, 30Y 5.24; 2s10s **41bp**, 7s10s **13bp**. Since the 08-27 auction: 2Y +17, 5Y +16, **7Y +13**, 10Y +11, 30Y +5 — front-end-led, and the 7Y now sits **14bp through** where August's 7Y actually cleared (4.512%); 2026 7Y range 3.72–4.66, last 4.65, i.e. at the year's high. **Volatility:** VIX **14.53** (09-04 close) against the 14.43 2026 low of 08-28 — quiet, and inside the 3-point screen threshold. **Peers:** `symbols: []`, none applicable. **Geopolitical:** nothing new touching this tenor beyond the oil→inflation→Fed-path channel the September siblings recorded. **Corridor:** fourteen tracked events within five days, three of them ON the date — GDP + PCE 08:30, ECB 09:15/09:45, auction 13:00 — one session after [`fomc-2026-10-28`](fomc-2026-10-28.md) (coin flip, no SEP, no forward guidance). **No new dated adjacency proposed, and the reason is recorded:** the entire five-day corridor is already tracked, and the tenor's own next sales (7Y **2026-11-25**, a Wednesday for Thanksgiving; 7Y **2026-12-29**) sit far outside it — proposing them would tax the assessment queue for events no sweep of this event needs. Both are in today's PDF and named here so a later session can file them deliberately. **Asymmetry flagged:** `government-funding-deadline-2026-09-30` threatens the 08:30 half of the 10-29 stack (2025 precedent per the [PCE ledger](pce-2026-10-29.md): PCE delayed five weeks, advance GDP cancelled) while Treasury debt operations run on permanent authority — a lapse would make this auction MORE legible, the one path by which 10-29 becomes readable. Inherited knowledge, not re-verified against a primary today. **Forward test registered: FT-treasury-7y-note-2026-10-29-1** — 7Y−10Y strictly negative on 10-29; null pass rates stated up front at **61.4%** (27/44) on auction days vs **48.1%** on FOMC-D+1 non-auction sessions (NOT the naive 31.3% all-session baseline, because the FOMC hangover pushes the same way), so the test is **asymmetric**: a pass is confounded, only a fail is clean. | — (stance set) | 2026-09-26 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
