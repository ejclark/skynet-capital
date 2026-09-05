# 2-Year Treasury Note auction (new issue) — treasury-2y-note-2026-10-26

**Kind:** rates · **Date:** 2026-10-26 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-05 — `2-Year NOTE` announce 10-22, auction 10-26, settle 11-02; 1:00pm ET by convention, not separately sourced) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["consumer-confidence-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-quiet-period-start-2026-10-21","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29","treasury-20y-bond-2026-10-21","treasury-5y-tips-2026-10-22"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The 2-Year auction day is a real, measurable event for the front end — and 2026-10-26
is the one slot where that effect does not apply.** Measured this session from Treasury's own
`auctions_query` and par yield curve (44 nominal 2Y auctions since 2023-01, 920 sessions): on a 2Y
auction day the 2Y CMT closes **−4.70bp** against a **0.00bp** all-session mean (t = −4.60), and away
from FOMC weeks it is **−6.07bp** (t = −4.91, n=27) versus **+0.19bp** on the 579 comparable
non-auction sessions. The effect is real, not a calendar artifact: it is **absent on D−1 and D+1**
(−0.25bp and +0.48bp, both insignificant), survives every control this session could build
(weekday, last-8-business-days-of-month, outlier removal, both sample halves), and is
**tenor-specific** — the 10Y moves only −0.95bp on the same days, so 2Y-minus-10Y prints −3.75bp with
t = −6.47. **But 2026-10-26 sells two sessions before `fomc-2026-10-28`, and every one of the seven
prior pre-FOMC 2Y auctions on this record sold at exactly D−2 as well.** That slot averaged
**−2.43bp** with four of seven printing 0 or −1bp — because FOMC-eve pins the front end generally
(D−2 non-auction sessions run mean |move| **2.86bp** vs 4.55bp ordinarily), not because demand is
worse (bid-to-cover 2.673 pre-FOMC vs 2.661 far). At n=7 that gap is **not statistically established**
(permutation p = 0.167) and this doc says so. Second finding, same data: the indirect-share yardstick
the [09-22 sibling](treasury-2y-note-2026-09-22.md) grades this tenor with is **not a demand
measure** — indirect and direct shares are near-perfect substitutes (corr **−0.866**, t = −11.23), so
their sum is half as noisy, and 2026-08-25's "series-high" 66.0% ranks **#11 of 44** once the window
opens past twelve auctions. Size is **$69B**, now primary-verified. `symbols: []`, date `estimate`,
nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-51) | **Stand aside** | High | Saturday, no session; 09-07 is Labor Day. This auction's size, CUSIP and demand do not exist until the **2026-10-22** announcement, and `symbols: []` leaves nothing to express a view in. | Nothing dated today for this event; its terms are 47 days away |
| This week | **Stand aside — and do not read the 09-08…09-10 coupon block as this auction's preview** | High | The 3Y/10Y/30Y sales that week are different tenors and different reaction functions; the only diagnostic predecessor is the **2026-09-22** 2Y, and it has not happened. | The **2026-09-11** CPI, which moves the policy path this auction only prices — that print, not the coupon block, is the week's front-end event |
| This month | **Grade the 09-22 sibling on dealer takedown, not indirect share** | Medium | Indirect and direct shares are substitutes (corr −0.866); their sum is half as volatile (sd 3.72pt vs 7.28pt). Dealer takedown is the residual underwriters are forced to eat, and it is the only bucket that is not a reclassification of another. | The **2026-09-22** print drawing indirect ≥ 57.2% *and* dealer above the 2025-04+ p75 of **12.3%** — a "strong" verdict on the indirect yardstick with a weak residual would say the two metrics agree after all and the correction is unnecessary |
| This quarter | **Expect a muted 10-26 tape, and do not read a flat 2Y as a failed auction** | Medium | All seven prior D−2-before-FOMC 2Y auctions averaged −2.43bp (median −1bp) against −6.07bp away from FOMC weeks. Suggestive, n=7, **p = 0.167 — not significant**, and stated as such. | The 2Y CMT moving **−6.0bp or worse on 2026-10-26** — the far-auction mean arriving anyway, which kills the FOMC-pinning read (registered as **FT-treasury-2y-note-2026-10-26-1**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, the date is `estimate`, and no house playbook
  (S1/S2/E1/S3/S4 + G1) is rates-keyed. This is a read-it-don't-trade-it event.
- **The measured auction-day effect, so it stops being assumed either way:** −4.70bp on all 44
  auction days (t = −4.60); **−6.07bp** away from FOMC weeks (t = −4.91, n=27); **−2.43bp** in the
  D−2-before-FOMC slot (n=7). Mean |move| on auction days is **6.39bp** vs 4.83bp all-session — the
  2Y auction is a *louder* session, the opposite of the 20Y's, which its
  [10-21 sibling](treasury-20y-bond-2026-10-21.md) measured as quieter than ordinary.
- **The base case for 2026-10-26** is therefore a **small** move, not a large one: 4 of the 7 prior
  D−2 auctions printed 0 or −1bp, and the slot's worst was −10bp (2025-01-27).
- **The correct yardstick for the print itself — dealer takedown**, 2025-04+ regime, n=17:
  min **7.3%** · p25 **10.2%** · median **11.2%** · p75 **12.3%** · max 24.1% (one outlier,
  2026-03-24). **Weak print** = dealer above **12.3%**. **Strong print** = dealer at or below
  **10.2%**.
- **The wrong yardstick, named so it stops being reused** — a twelve-auction indirect-share window.
  2026-08-25's 66.0% is a series high inside twelve auctions and **#11 of 44** across the full record;
  the "prior-11 mean 57.2%" the 09-22 sibling grades against sits entirely inside one regime.
- **Percentages are on the competitive base** (indirect + direct + dealer), never `total_accepted`,
  which includes SOMA add-ons — SOMA ran $7.6–10.3B on the last four 2Ys, so the wrong denominator
  shifts every share by 4–5 points.
- **Bid-to-cover band, $69B era only** (29 auctions, 2024-04-23 → 2026-08-25): mean **2.624**,
  sd 0.095, min **2.41** · p25 2.57 · median **2.64** · p75 2.68 · max **2.81**. A print outside
  2.41–2.81 is the first in the era.
- **Bid-to-cover does relate to the same-day move here** (corr **−0.388**, t = −2.73, n=44 —
  significant, unlike the 20Y's −0.235): strong prints (b/c ≥ 2.68) average −7.56bp, weak (≤ 2.56)
  +0.40bp, a **~8bp** spread.
- **Size is settled before it opens — $69B**, verbatim from `sb0590` (2026-08-05), read direct this
  session; a deviation at the **2026-10-22** announcement voids every like-for-like claim above.
- **Watch (dated)** — CPI **09-11** · FOMC **09-16** · the predecessor 2Y **09-22** · CPI **10-14** ·
  20Y **10-21** · FOMC blackout opens **10-17** · 5Y TIPS **10-22** · this announcement **10-22** ·
  this auction **10-26** · FOMC **10-28** · settlement **11-02**.

## Initial research

**The question, plainly:** the 2-year note is the most policy-path-sensitive coupon Treasury issues,
and this one sells two sessions before a genuinely undecided FOMC. Does the auction itself do
anything measurable to the front end — and if so, does that effect survive selling into a policy
meeting?

**One-line verdict:** the 2Y auction day carries a large, robust, tenor-specific front-end rally that
this calendar had never measured (−6.07bp away from FOMC weeks, t = −4.91), and **2026-10-26 is
precisely the slot where the historical record says not to expect it** — which makes the practical
output a caution against misreading a flat tape, not a trade.

**Method:** sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode —
the house instruments are symbol-keyed and this event has `symbols: []`, so no `earnings-cycle` /
`intraday-edges` run applies and no cache bust was required. Every figure below is computed this
session from two Treasury primaries fetched today: the Fiscal Data `auctions_query` dataset (all 44
nominal 2-Year note auctions since 2023-01-01, FRNs excluded on the dataset's own `floating_rate`
field) and the daily par yield curve CSVs for 2023–2026 (920 sessions, 2023-01-03 → 2026-09-04).
Schedule provenance is the Tentative Auction Schedule PDF (home.treasury.gov, HTTP 200, 17,195
bytes, text layer decompressed direct). Size provenance is press release `sb0590` (2026-08-05),
fetched and read as text this session. The 2026-01-26 metadata check is Treasury's own auction
results release (`R_20260126_3.pdf`, decompressed and read directly). FOMC meeting dates are the
published calendar; policy pricing is carried from [`fomc-2026-10-28.md`](fomc-2026-10-28.md). VIX
is the 2026-09-04 close. Each claim dated in line.

### Conviction legs, tested

**1. The date and terms are right, and the entry stays `estimate` on purpose — SUPPORTED.** The
tentative schedule carries the row verbatim: `2-Year NOTE · Thursday, October 22, 2026 · Monday,
October 26, 2026 · Monday, November 02, 2026` (announcement · auction · settlement). The absence of
an `R` marks a new issue. `TSY:` is an authorized `confirmed` prefix and the
[09-22 sibling](treasury-2y-note-2026-09-22.md) used it to upgrade its own entry — but that sale was
20 days out with its announcement 15 days away, and this one is **51 days out with the announcement
47 days away**. Two same-day October siblings off the identical PDF —
[`treasury-20y-bond-2026-10-21`](treasury-20y-bond-2026-10-21.md) and
[`treasury-5y-tips-2026-10-22`](treasury-5y-tips-2026-10-22.md) — each chose `estimate` and named the
divergence. Holding `estimate` keeps the October block internally consistent and costs nothing:
estimates only widen caution, and no date-keyed action follows from this event at any label. The
confirming primary is the 2026-10-22 announcement. **Recorded so a later session does not
re-litigate it:** this is a consistency call about a 47-day-out tentative schedule, not a date doubt.

**2. The size is $69B, and the calendar's own caution on that number is DISCHARGED — SUPPORTED.**
The entry's source note flags $69B as "unverified against the primary… transcribed by this
calendar's own sweeps before the FRN-column correction of 2026-09-05." Read directly from `sb0590`
this session, the anticipated-size table's header is `2-Year 3-Year 5-Year 7-Year 10-Year 20-Year
30-Year FRN` and its **Oct-26 row is `69 58 70 44 39 13 22 30`**. The 2-Year is the **first** column
and the FRN is the **last**; the column that caused the transcription error cannot reach the 2-Year
figure. The release also states verbatim that "Treasury anticipates maintaining nominal coupon and
FRN auction sizes for at least the next several quarters." So $69B is written guidance, primary-read,
and consistent with **29 consecutive $69B auctions** (2024-04-23 → 2026-08-25) on the dataset. This
leg is the entry's caution being answered, not repeated.

**3. The 2Y auction day moves the 2Y — SUPPORTED, and this is the finding.** Close-to-close 2Y CMT
moves, computed over all 920 sessions:

| Population | n | Mean move | Mean \|move\| | t |
|---|---|---|---|---|
| All sessions | 919 | **0.00bp** | 4.83bp | −0.01 |
| **2Y auction days** | 44 | **−4.70bp** | **6.39bp** | **−4.60** |
| Auction days, >7d from any FOMC | 27 | **−6.07bp** | 6.96bp | **−4.91** |
| Non-auction days, >7d from any FOMC | 579 | +0.19bp | 4.55bp | +0.70 |

The effect is **confined to the auction session itself** — D−3 +0.43, D−2 +0.61, D−1 −0.25, **D+0
−4.70**, D+1 +0.48, D+2 +1.55, D+3 +0.41, and only D+0 is significant. Every control this session
could build leaves it standing: 2Y auctions fall on Mondays (19) and Tuesdays (25), and Mon/Tue/Wed
**non-auction** sessions run **+0.13bp** (n=503); they cluster in the last week of the month, and
non-auction sessions in the last 8 business days of a month run **+0.19bp** (n=312); dropping the one
|move| ≥ 20bp gives −4.21bp (t = −4.60); the two sample halves give −4.36bp (t = −2.55) and −5.05bp
(t = −4.37); 2025-onward alone gives −4.75bp (t = −4.27, n=20). It is also **tenor-specific**: the
10Y moves only **−0.95bp** on the same days (t = −1.13, insignificant), so 2Y-minus-10Y prints
**−3.75bp** with **t = −6.47** — a bull-steepening of 2s10s, not a general rally.

**4. But the FOMC pins the front end, and 2026-10-26 sells inside that pin — MIXED, and the
uncertainty is the honest part.** Every one of the seven pre-FOMC 2Y auctions on this record sold at
**exactly D−2** — both events are calendar-anchored (FOMC meets Tue–Wed; the 2Y auctions Monday or
Tuesday of the last week), so this is a homogeneous slot, not a proximity gradient. Its moves:

| Auction | Days to FOMC | 2Y move | Bid-to-cover |
|---|---|---|---|
| 2023-07-24 | D−2 | −1bp | 2.78 |
| 2025-01-27 | D−2 | −10bp | 2.66 |
| 2025-07-28 | D−2 | 0bp | 2.62 |
| 2025-10-27 | D−2 | 0bp | 2.59 |
| 2026-01-26 | D−2 | −4bp | 2.75 |
| 2026-04-27 | D−2 | 0bp | 2.65 |
| 2026-07-27 | D−2 | −2bp | 2.66 |

Mean **−2.43bp**, median **−1bp**, mean |move| **2.43bp**; four of seven printed 0 or −1. **Demand is
not what differs** — pre-FOMC bid-to-cover averages **2.673** against **2.661** away from FOMC weeks.
What differs is that the price does not move. And the control says the pinning is a property of the
day, not of the auction: **D−2-before-FOMC non-auction sessions** (n=22) run **+1.14bp** with mean
|move| **2.86bp**, against 4.55bp on ordinary far-from-FOMC sessions — the front end is roughly a
third quieter on FOMC-eve whether or not Treasury is selling. **What cannot be separated at this
sample size:** whether the auction effect is specifically suppressed or merely swamped by a quiet
regime. A permutation test of the far-versus-pre difference (−3.65bp, 200,000 draws) returns
**p = 0.167** — not significant, and stated here rather than buried. The practical output survives the
ambiguity intact, because both readings predict the same thing: a small move on 2026-10-26.

**5. The indirect-share yardstick is not a demand measure — REFUTED, and this corrects the
09-22 sibling.** That ledger's load-bearing finding is that 2026-08-25's **66.0%** indirect share was
"the highest of the last twelve" against a 57.2% prior-11 mean, therefore front-end demand is
"strengthening." Across all 44 auctions, three things break it:

| Regime | n | Indirect | Direct | Dealer | End-user (ind+dir) |
|---|---|---|---|---|---|
| 2023-01 … 2025-03 | 27 | **66.4%** | 19.1% | 14.5% | 85.5% |
| 2025-04 … 2026-08 | 17 | **58.1%** | **30.2%** | **11.8%** | **88.2%** |

First, **66.0% is #11 of 44 all-time** — it is #1 only inside the 2025-04+ regime, and the "prior-11
mean" it is graded against sits entirely inside that same regime, so the comparison is a window
artifact. Second, the two end-user buckets are **near-perfect substitutes**: corr(indirect%,
direct%) = **−0.866**, t = −11.23, n=44. Indirect fell 8.3 points across the regime break while
direct rose 11.1 — a rotation between submission channels, not a loss of buyers. Third, and
decisively, **their sum is half as noisy**: sd(end-user) **3.72pt** against sd(indirect) **7.28pt**,
and end-user share *rose* 85.5% → 88.2% over exactly the window the indirect share fell. What is
left is **dealer takedown** — the residual primary dealers are obliged to absorb, the one bucket that
is not a reclassification of another — and it has fallen structurally, 14.5% → 11.8%. **This does not
say the 09-22 sibling's print was weak.** It says the metric it was graded on cannot support either
verdict, and that the same data read on the residual gives a cleaner and quieter answer: dealers took
10.9% on 2026-08-25, inside the 2025-04+ p25–median band, which is ordinary.

**6. "The 2Y is never reopened" is too strong, and the exception is a data-quality flag rather than
a policy fact — MIXED.** The calendar entry's source note reads "the 2Y prices monthly as a new issue
and is never reopened," used to interpret the schedule's missing `R`. The dataset flags **one**
exception in the tracked record: 2026-01-26, `reopening: Yes`. Treasury's own results release for
that sale (`R_20260126_3.pdf`, read direct) carries the fields verbatim — `2-Year Note`, CUSIP
`91282CGH8`, `Original CUSIP 91282CPV7`, `Series U-2028`, `Original Issue Date January 31, 2023`,
`Maturity Date January 31, 2028`. Those fields are **internally inconsistent**: an original issue date
of 2023-01-31 maturing 2028-01-31 is a five-year note's profile, not a two-year's, and the stated
CUSIP and "Original CUSIP" belong to different vintages. So the honest reading is a **metadata
defect on one row**, not evidence that Treasury reopens the 2Y. Two consequences, both small: the
entry's absolute "never" is softened to "has not been reopened on the tracked record, with one
row carrying inconsistent reopening metadata," and 2026-01-26 is **kept** in every series above,
because its auction economics ($69B offered, b/c 2.75, competitive $68.645B) are ordinary and
excluding it would change no conclusion.

**7. The corridor around this sale is the densest on the Q4 calendar — SUPPORTED, and it is why the
auction is not the risk.** Ten tracked events sit within five days of 2026-10-26: the
[20Y](treasury-20y-bond-2026-10-21.md) and
[ECB quiet period](ecb-quiet-period-start-2026-10-21.md) on 10-21, the
[5Y TIPS](treasury-5y-tips-2026-10-22.md) on 10-22, then
[consumer confidence](consumer-confidence-2026-10-27.md),
[durable goods](durable-goods-2026-10-27.md) and the
[euro-area bank lending survey](ecb-bank-lending-survey-2026-10-27.md) on 10-27,
[`fomc-2026-10-28`](fomc-2026-10-28.md), and [GDP](gdp-q3-2026-advance-2026-10-29),
[PCE](pce-2026-10-29) and the [ECB decision](ecb-decision-2026-10-29.md) all on 10-29. The FOMC
ledger prices 10-28 at roughly a **coin flip** with **no SEP and no forward guidance** (abolished
2026-08-28), which loads the news onto the statement itself. Against a 2Y auction whose historical
D−2 slot moves the front end ~2bp, the attribution problem on this week runs entirely one way: a
large 10-26 move is far more likely to be positioning for 10-28 than a verdict on $69B of two-year
paper.

**8. Two dated adjacencies proposed, one deliberately not — SUPPORTED.** The same schedule row block
sells the **5-Year NOTE on 2026-10-27** (D+1) and the **7-Year NOTE on 2026-10-29** (D+3) off this
auction's own **10-22** announcement, both inside this sweep's five-day corridor and neither on the
calendar. Both are proposed as `estimate` entries in this PR, sized from `sb0590`'s Oct-26 row ($70B
and $44B). The 09-22 sibling recorded that its own 5Y and 7Y "inherit whatever it establishes"; the
same holds here, and it is the reason they earn rows rather than a mention. **Not proposed, with the
reason named:** the **2-Year FRN on 2026-10-28**, also on the 10-22 announcement and also inside the
corridor. The 09-22 sibling's rule — a floating-rate note carries no duration or policy-path read —
still holds, and this doc does not overturn a sibling's call without evidence. Flagged for whoever
revisits it: that FRN prices at **1:00pm ET on FOMC decision day**, one hour before the 2:00pm
statement, which is a genuinely unusual collision even if the instrument itself reads nothing.

**What plays the conditions support:** none directional, none symbol-keyed — the standing house
answer for this event kind. The usable output is a **prior on the tape**: on 2026-10-26 the base case
is a 2Y move of roughly 0 to −2bp, and both the −6bp far-auction rally and any large move in either
direction would be information. That is a reading instruction for the session that pulls this ledger
on auction day, not a position.

**Honest limits.** The pre-FOMC slot is **n=7** and its difference from the far population is **not
significant** (p = 0.167); it is reported as suggestive and the stance is written to survive being
wrong about it. The −6.07bp far-auction effect is a **daily close-to-close** measurement on a CMT
series rounded to 1bp — it cannot see an intraday concession before the 1:00pm award, so "the auction
causes a rally" overstates what is measured; what is measured is that the auction-day close sits ~6bp
below the prior close with no offset in surrounding days. Causation is not established at all: the
auction result is one of many things in a session. Bid-to-cover's −0.388 correlation with the same-day
move is significant but explains ~15% of variance. The 2023-01 start is a data-availability boundary,
not a regime boundary, and the 2025-04 regime break in bidder shares is identified by inspection
rather than a structural-break test. This auction's own size, CUSIP and demand **do not exist yet**
— the announcement is 2026-10-22. FOMC odds drift daily. `symbols: []`, `medium` impact, date
`estimate`: nothing here licenses a position in any name.

## Stance & kill switches

**Stance (estimate-dated event; no standalone play):** watch-only, and the specific contribution is a
**measured prior on the auction-day tape** that this calendar did not previously have. The 2Y auction
session is a real front-end event — **−6.07bp** away from FOMC weeks against **+0.19bp** on
comparable non-auction sessions, confined to the session itself and absent from the 10Y — which makes
it the opposite of its [20Y sibling](treasury-20y-bond-2026-10-21.md), where auction days are quieter
than ordinary and bid-to-cover has no significant price link. **2026-10-26 is the exception slot:**
all seven prior D−2-before-FOMC 2Y auctions averaged −2.43bp with a −1bp median, because FOMC-eve
pins the front end regardless of supply (D−2 non-auction sessions run mean |move| 2.86bp vs 4.55bp).
So the base case for 10-26 is a **small** move, and a flat 2Y that day is the expected outcome rather
than evidence of a failed sale. Grade the print itself on **dealer takedown** (2025-04+ p25 10.2% /
median 11.2% / p75 12.3%), not on indirect share, which is a substitute for direct share
(corr −0.866) and therefore measures channel mix rather than demand. Size is $69B, primary-verified.
Nothing here is directional and no house playbook applies.

**Kill switches (what would change this stance):**

- **The core one — the 2Y CMT moving −6.0bp or worse on 2026-10-26.** The far-auction mean arriving
  anyway would say the FOMC does not pin the front end through a supply event, leg 4 dies, and the
  D−2 slot stops being usable as a prior for the 2026-11-23 and 2026-12-22 2Ys. Registered as
  **FT-treasury-2y-note-2026-10-26-1** in [`forward-tests.md`](../forward-tests.md), score by
  2026-10-27, with its null pass rate stated up front.
- **A size change at the 2026-10-22 announcement.** $69B is written guidance in `sb0590` and 29
  consecutive auctions of precedent; any deviation breaks the like-for-like series, voids the
  bid-to-cover band and the forward test, and must be logged off-cadence regardless of when the next
  pulse is due.
- **The 09-22 predecessor printing dealer takedown above 12.3%** (the 2025-04+ p75) — the first
  evidence the residual metric this doc promotes is itself deteriorating, which would make the
  October sale a demand question rather than a policy-path one and is worth an off-cadence pulse.
- **Bid-to-cover printing outside 2.41–2.81** on 09-22 or 10-26. The $69B era's full range dies on
  either side, and with it the base rate this doc hands the November and December 2Ys.
- **The FOMC meeting moving off 2026-10-27/28**, or the auction moving off 10-26 at the announcement.
  The D−2 premise is the whole of leg 4; if the pairing breaks, this event reverts to an ordinary
  month-end front-end sale graded on leg 3's far-auction prior, and the forward test **voids** rather
  than scoring.
- **Nothing here licenses date-keyed *action*.** The date is `estimate`; observations widen caution
  rather than licensing entries, and `symbols: []` means there is no instrument to express one in.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-51 | Initial research banked (doc above); `probe-ref` populated with real readings so this event's first `interval-elapsed` pulse is screenable rather than automatically material. **Event tape (primary).** Terms re-verified verbatim from home.treasury.gov's Tentative-Auction-Schedule.pdf (HTTP 200, 17,195 bytes, text layer decompressed direct today): announce **Thu 2026-10-22**, auction **Mon 2026-10-26**, settle **Mon 2026-11-02**, no `R` → new issue. Entry stays **`estimate`** deliberately — 47 days from its own announcement, and the two same-day October siblings off the identical PDF (20Y 10-21, 5Y TIPS 10-22) both chose `estimate`; this is a consistency call, not a date doubt. **Size caution DISCHARGED.** `sb0590` (2026-08-05) read as text this session: the anticipated-size header is `2-Year 3-Year 5-Year 7-Year 10-Year 20-Year 30-Year FRN` and the **Oct-26 row is `69 58 70 44 39 13 22 30`** — the 2-Year is column 1, the FRN column 8, so the FRN-transcription error the entry flags cannot reach the $69B figure. Release also states verbatim that Treasury "anticipates maintaining nominal coupon and FRN auction sizes for at least the next several quarters"; 29 consecutive $69B auctions corroborate. **THE LOAD-BEARING FINDING — the 2Y auction day is a measurable front-end event, and this calendar had never measured it.** All 44 nominal 2Y auctions since 2023-01 (fiscaldata `auctions_query`, FRNs excluded on `floating_rate`) against 920 par-curve sessions (2023-01-03 → 2026-09-04, CSVs fetched today): auction days close **−4.70bp** on the 2Y (t = **−4.60**) vs **0.00bp** all-session; away from FOMC weeks **−6.07bp** (t = −4.91, n=27) vs **+0.19bp** on 579 comparable non-auction sessions. Confined to D+0 (D−1 −0.25, D+1 +0.48, both insignificant), survives weekday control (Mon/Tue/Wed non-auction +0.13bp, n=503), month-position control (last-8-biz-days non-auction +0.19bp, n=312), outlier removal (−4.21bp, t=−4.60), both halves (−4.36 / −5.05) and 2025-onward (−4.75, t=−4.27). **Tenor-specific:** 10Y only −0.95bp (t=−1.13); 2Y−10Y **−3.75bp**, t = **−6.47**. Auction days are also **louder** (mean \|move\| 6.39 vs 4.83) — the opposite of the 20Y sibling's measured result, and bid-to-cover's link to the same-day move is **significant** here (corr −0.388, t=−2.73; strong ≥2.68 −7.56bp vs weak ≤2.56 +0.40bp, ~8bp spread) where the 20Y's was not. **AND 10-26 IS THE SLOT WHERE IT DOES NOT APPLY.** All seven prior pre-FOMC 2Y auctions sold at exactly **D−2** (both events calendar-anchored): moves −1, −10, 0, 0, −4, 0, −2 → mean **−2.43bp**, median −1, four of seven at 0 or −1. Demand is unchanged (b/c 2.673 pre vs 2.661 far); the price simply does not move, and the control shows the pin is a property of the day — D−2 **non-auction** sessions run mean \|move\| **2.86bp** vs 4.55bp ordinarily. **Stated as unproven:** permutation test of the far-minus-pre difference (−3.65bp, 200k draws) gives **p = 0.167**, n=7. Both readings predict the same small move, so the stance survives either way. **SECOND FINDING — the 09-22 sibling's indirect-share yardstick is corrected.** Its headline (66.0% = "highest of the last twelve", prior-11 mean 57.2%, therefore demand strengthening) is a window artifact: 66.0% ranks **#11 of 44** all-time and #1 only inside the 2025-04+ regime the benchmark itself sits in. Indirect and direct are near-perfect substitutes (**corr −0.866**, t=−11.23), so their sum is half as noisy (sd 3.72pt vs 7.28pt) and **rose** 85.5% → 88.2% across the same break where indirect fell 66.4% → 58.1% and direct rose 19.1% → 30.2%. The metric that is not a reclassification is **dealer takedown**, structurally lower at 11.8% (from 14.5%); 2025-04+ quantiles p25 10.2 / median 11.2 / p75 12.3. This does NOT relabel 08-25 as weak — dealers took 10.9%, ordinary — it says the yardstick cannot support either verdict. **Data-quality flag:** the entry's "the 2Y … is never reopened" is too strong — 2026-01-26 carries `reopening: Yes` and Treasury's own `R_20260126_3.pdf` shows `Original CUSIP 91282CPV7` with `Original Issue Date January 31, 2023` / `Maturity January 31, 2028`, an internally inconsistent five-year profile. Read as a metadata defect, not a policy fact; the row is kept in every series (economics ordinary: $69B, b/c 2.75). **Macro.** Par curve 2026-09-04: 3M 3.91, **2Y 4.37**, 5Y 4.54, 10Y 4.78, 30Y 5.24; 2s10s **41bp**. Since the 08-25 auction: 3M +5, 2Y **+20**, 5Y +19, 10Y +14, 30Y +7 — still front-end-led, and 2026's 2Y high is **4.39** (09-01; range 3.38–4.39). **Volatility:** VIX **14.53** (09-04 close), a hair above the 14.43 2026 low struck 08-28 — a quiet tape into a coin-flip FOMC. **Peers:** `symbols: []`, none applicable. **Geopolitical:** nothing new touching this tenor beyond the oil-inflation channel the 09-22 sibling recorded. **Corridor:** ten tracked events within 5 days, and [`fomc-2026-10-28`](fomc-2026-10-28.md) prices ~50/50 with no SEP and no forward guidance — attribution on this week runs toward the statement, not the sale. **New dated adjacencies proposed (2):** `treasury-5y-note-2026-10-27` (D+1, $70B) and `treasury-7y-note-2026-10-29` (D+3, $44B), both off this auction's own 10-22 announcement, both inside the corridor, both previously unlisted. **Deliberate non-proposal, recorded:** the 2-Year FRN 2026-10-28, on the same announcement and inside the corridor — the 09-22 sibling's rule (a floating-rate note carries no duration or policy-path read) holds, though it prices 1:00pm ET on FOMC decision day, one hour before the statement. **Forward test registered: FT-treasury-2y-note-2026-10-26-1** — the 2Y CMT move on 10-26 is greater than −6.0bp; null pass rate stated up front at **12/27 ≈ 44%** on far-from-FOMC auctions against **6/7 ≈ 86%** in the D−2 slot, so it is informative in either direction. | — (stance set) | 2026-09-26 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
