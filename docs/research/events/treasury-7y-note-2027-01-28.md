# 7-Year Treasury Note auction (January new issue, the day after the FOMC) — treasury-7y-note-2027-01-28

**Kind:** rates · **Date:** 2027-01-28 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-09, HTTP 200, 17,195 bytes — `7-Year NOTE / Thursday, January 21, 2027 / Thursday, January 28, 2027 / Monday, February 01, 2027`, no `R`; the 1:00 p.m. ET close is sourced from `closing_time_comp`, not assumed) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["boj-summary-of-opinions-2027-02-01","consumer-confidence-2027-01-26","fhfa-hpi-2027-01-26","fomc-2027-01-27","ism-manufacturing-2027-02-01","japan-cpi-tokyo-flash-2027-01-29","norway-gpfg-bond-expert-group-2027-01-25","treasury-2y-frn-2027-01-27","treasury-2y-note-2027-01-25","treasury-5y-note-2027-01-26"],"screenStreak":0,"blocked":[{"url":"https://www.bea.gov/news/schedule","status":"200-no-dates-in-static-html","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **This event was filed because it sells "into a known policy setting" the day after the FOMC. Measured, that is a null on the auction and a real effect on the session — and those are different claims, which is the whole finding.** Across the **16** 7-year auctions since 2014 that sold one session after a decision, demand is unchanged (bid-to-cover **2.487** vs **2.494** for the other 136, Welch t = **−0.21**) and so is price: the residual against the inherited dealer model `7s10s = −1.894 + 0.090 × dealer%` is **−0.260bp (t = −0.83)** against **+0.031bp** for the rest (Welch t = **−0.88**). The cleanest control this calendar has produced says the same thing from the other side — the **81** day-after-FOMC sessions carrying **no auction at all** move 7s10s by **−0.148bp (t = −0.89)**, statistically identical to the 16 that do. **The auction adds nothing to a day-after-FOMC session.** What the FOMC *does* add is noise: session 7s10s standard deviation on D+1 is **1.493bp** against **1.194bp** more than three sessions from a decision — a **variance ratio of 1.56** — and the tail `P(|Δ7s10s| ≥ 2bp)` runs **22.7%** vs **11.8%**. The same fitted **−0.8bp** effect therefore needs **28** auctions to detect here against **18** on an ordinary session. **2027-01-28 is the least readable date in this tenor's calendar, and the reason is the denominator, not the crowd** — a distinction the [11-25 sibling's](treasury-7y-note-2026-11-25.md) corridor-saturation version of "do not attribute" did not make. Size **$44B**, `symbols: []`, date `estimate`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-141) | **Stand aside** | High | Size, CUSIP and when-issued do not exist until the **2027-01-21** announcement, `symbols: []` leaves nothing to express a view in, and no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. | Nothing dated today reaches this event; its terms are 134 days away and its size cell is set at the **2026-11-04** refunding |
| This week | **Stand aside** | High | Nothing this week is this tenor's own data. The next 7Y-specific fact of any kind is the **2026-09-24** predecessor auction. | The **2026-09-11** CPI — which moves the policy path this auction prices, not the auction |
| This month | **Retire "the day after the FOMC is a harder auction" before any ledger inherits it — it is a null on both channels** | Medium-high | b/c **2.487** vs **2.494** (Welch t = **−0.21**) and model residual **−0.260bp** vs **+0.031bp** (Welch t = **−0.88**) over n=16; and the **81** no-auction D+1 sessions print **−0.148bp**, indistinguishable from the 16 auction ones. | The **2026-09-24** and **2026-10-29** prints landing 7s10s more than **2bp** off `−1.894 + 0.090 × dealer%` — the model this null is measured against failing out of sample twice running, where only **9.2%** of the 152-auction history misses by that much |
| This quarter | **Do not attribute anything on 2027-01-28 to the auction — and log WHY: the session's variance is 1.56× an ordinary one, not the corridor's crowding** | Medium | D+1 session 7s10s sd **1.493bp** vs **1.194bp** (Welch on \|move\| = **2.32**); detection of a **0.8bp** effect needs **28** auctions here vs **18** elsewhere. Only **10** tracked events sit within five days — a quiet corridor by this calendar's standards, so crowding is not the story here. | The 2027-01-28 print's residual landing outside **±1.5bp** — the "FOMC adds a concession" story finally appearing (registered as **FT-treasury-7y-note-2027-01-28-1**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, date `estimate`, no rates-keyed house playbook.
  Read-it-don't-trade-it.
- **The inherited model is re-derived here, not quoted:** **`7s10s(bp) = −1.894 + 0.090 × dealer%`**,
  n=152, slope **t = 7.83**, residual sd **1.248bp** — coefficients reproducing the
  [11-25 sibling's](treasury-7y-note-2026-11-25.md) to three decimals from an independent pull, which
  is what validates this session's pipeline before it disagrees with anything.
- **The FOMC straddle is a null on the auction.** D+1 (n=16): b/c **2.487** vs **2.494** (Welch
  t = −0.21); indirect **61.5%** vs **62.5%**; model residual **−0.260bp (t = −0.83)** vs **+0.031bp**
  (Welch t = −0.88).
- **The control that makes it a null rather than an absence of evidence** — D+1 sessions with **no
  auction** (n=81) move 7s10s **−0.148bp (t = −0.89)**; the 16 with one move **−0.125bp (t = −0.32)**.
  Same number. The day, not the auction, is what is moving.
- **What IS real: D+1 is a 1.56× variance session.** 7s10s sd **1.493** (n=97 D+1) vs **1.194**
  (n=2,492 at \|offset\| > 3); mean \|Δ7s10s\| **1.072** vs **0.823bp** (Welch t = **2.32**); mean
  \|Δ7Y\| **4.65** vs **4.00bp**; `P(|Δ7s10s| ≥ 2bp)` **22.7%** vs **11.8%**; `P(|Δ7Y| ≥ 10bp)`
  **12.4%** vs **6.5%**. Decision day itself is wider still (sd **1.646**, \|Δ7s10s\| **1.237**).
- **Read that as a power statement, because that is what it is.** Detecting a **0.8bp** mean at 80%
  power needs **n = 18** at ordinary-session sd and **n = 28** at D+1 sd. Nothing about the effect
  changes; the number of prints needed to see it rises **56%**.
- **The January structure is the norm, not this event's distinguishing feature.** **9 of the 13**
  January 7-Year auctions since 2014 sat within one session of an FOMC decision — six exactly at D+1
  (2014, 2015, 2016, 2021, 2022, **2026**), three at D−1 (2019, 2020, 2025) — because the January
  month-end coupon block and the January FOMC are both locked to the last week of the month.
- **A month split was found and killed, not reported.** January D+1 residuals mean **+0.571** (n=6,
  t = 1.32), non-January **−0.759** (n=10, t = −2.14) — but all 13 January auctions at any offset mean
  **+0.030 (t = 0.09)**, and the non-January leg is carried by two members (2022-07-28 at −3.06,
  2015-10-29 at −2.22). One uncorrected cell of a post-hoc split; it is not a finding.
- **The one live-but-unproven conditional** — b/c against the FOMC session's own 2-year move (a
  hawkish-surprise proxy): **corr −0.419, t = −1.73, n = 16**. Suggestive, not significant, one cell,
  no correction. Registered as **FT-treasury-7y-note-2027-01-28-2** rather than asserted.
- **The close here is 1:00 p.m. ET.** `closing_time_comp` reads `01:00 PM` on **143 of 152**; the nine
  exceptions are all half-days. The [11-25 ledger's](treasury-7y-note-2026-11-25.md) 11:30 a.m. finding
  **does not transfer** — 2027-01-28 is an ordinary full Thursday.
- **Size is $44B** — **29 consecutive** 7-Year auctions at that size (2024-04-25 → 2026-08-27; the one
  before was $43B). The January-2027 cell sits three months past `sb0590`'s last published row and is
  set at the **2026-11-04** refunding.
- **Grade the print on dealer takedown**, $44B era (n=29): p25 **9.34%** · median **11.64%** ·
  p75 **12.75%** · range **4.06–17.00%**. Fitted 7s10s at 2026's **11.72%** mean is **−0.84bp**.
- **Bid-to-cover band, $44B era**: min **2.40** · p25 2.49 · median 2.51 · p75 2.64 · max **2.79**;
  **0 of 28** below 2.40 since 2024-05.
- **Percentages are on the competitive base** (indirect + direct + dealer), never `total_accepted` —
  2026's eight SOMA add-ons ran **$3.10–6.59B**.
- **Watch (dated)** — CPI **2026-09-11** · FOMC **2026-09-16** · predecessor 7Y **2026-09-24** ·
  7Y **2026-10-29** · refunding **2026-11-04** (first document to name a January-2027 size) ·
  7Y **2026-11-25** · FOMC **2026-12-09** (confirms the 2027 calendar, per
  [`fomc-2027-01-27`](fomc-2027-01-27.md)) · 7Y **2026-12-29** · this announcement **2027-01-21** ·
  2Y **01-25** · 5Y **01-26** · **FOMC 01-27** · FRN **01-27** · **this auction 01-28** ·
  settlement **2027-02-01**.

## Initial research

**The question, plainly:** the [2027-01-21 announcement ledger](treasury-coupon-announcement-2027-01-21.md)
proposed this event and named its hook in one line — it is "the only leg of the block that sells into a
KNOWN policy setting rather than an unknown one," the first coupon auction after the statement. That
ledger tested the straddle on **demand** across all block legs (a null, mean z +0.31 vs −0.04,
t = +1.84) and handed the tenor-specific question forward. So the honest first job was to test the same
claim on the **price** channel, on this tenor alone, against the model the
[11-25 sibling](treasury-7y-note-2026-11-25.md) built to replace the −0.95bp constant it retired — and
to find out whether "day after the FOMC" does anything at all before three more January ledgers inherit
the framing.

**One-line verdict:** the straddle is **a null on the auction and a 1.56× variance effect on the
session** — the auction is indistinguishable from a day-after-FOMC session with no auction in it, while
the session itself is wide enough that the model's own fitted effect needs **56% more prints** to
detect here than anywhere else in this tenor's calendar.

**Method:** sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode. The
house instruments are symbol-keyed and this event has `symbols: []`, so no `earnings-cycle` /
`intraday-edges` run applies and no cache bust was required. Every figure below is computed this session
from three primaries fetched today: the Fiscal Data `auctions_query` dataset filtered on `security_term`
(**259 rows, zero reopenings**, of which **152** auction on or after 2014-01-01), the daily par yield
curve CSVs for **2014–2026** (**3,172** close-to-close sessions, 2014-01-02 → 2026-09-08, thirteen files
fetched individually), and the Federal Reserve Board's own FOMC calendars
(`fomchistorical<year>.htm` 2013–2020 plus `fomccalendars.htm`, HTTP 200, 164,831 bytes) parsed to
**116** scheduled decision days. Schedule provenance is the Tentative Auction Schedule PDF
(home.treasury.gov, HTTP 200, 17,195 bytes), decompressed stream-by-stream and read here as an
independent second pass after the proposal. VIX is the **2026-09-08** close (**15.72**) from the same
Yahoo daily endpoint `scripts/event-material-scan.mjs` uses. This event was `never-assessed` and existed
only as one sibling proposal; it was read in full before the canonical
`src/domain/market-events/treasury-7y-note-2027-01-28.json` was written this session. Each claim dated
in line.

### Conviction legs, tested

**1. The date and terms are right, and the entry stays `estimate` on purpose — SUPPORTED.** The
tentative schedule carries the row verbatim: `7-Year NOTE · Thursday, January 21, 2027 · Thursday,
January 28, 2027 · Monday, February 01, 2027`. The flag column *is* populated within twenty rows —
`20-Year BOND R` (auction 01-20) and `10-Year TIPS T` (auction 01-21) both sit in the same January
block — so the absence of an `R` is a positive signal of a new issue, not a missing field. The entry
stays `estimate` for the two reasons the proposal recorded and this session does not overturn: a
tentative schedule is tentative by construction, and this lane may not self-confirm an event it
discovered in-sweep. The confirming primary is the **2027-01-21** announcement.

**2. This is the LAST 7-Year row the schedule publishes — SUPPORTED, and it is why no successor is
proposed.** The PDF carries exactly six 7-Year rows (2026-08-27, 09-24, 10-29, 11-25, 12-29,
**2027-01-28**) and its window terminates on **2027-02-04**. The [11-25 sibling](treasury-7y-note-2026-11-25.md)
could propose its own successor because December sat inside the window; this event's cannot be sourced
from this primary and none is filed. That is also the honest frame for the whole ledger: **2027-01-28
is the furthest-out row Treasury has published**, which is the same guidance position the
[01-21 announcement ledger](treasury-coupon-announcement-2027-01-21.md) capped its own confidence at
medium for.

**3. Size is $44B — SUPPORTED, inherited and independently corroborated.** Today's pull shows **29
consecutive** 7-Year auctions at $44B, 2024-04-25 → 2026-08-27, with the offering taking exactly one
distinct value across that span; the auction immediately before it (2024-03-27) was **$43B**, so the
run has a clean boundary rather than being an artifact of a short window. `sb0590`'s published columns
end in Oct-26 and are read from the [11-25](treasury-7y-note-2026-11-25.md) and
[01-21](treasury-coupon-announcement-2027-01-21.md) ledgers rather than re-fetched here — this session
says so and does not re-quote it as its own reading. The January-2027 cell is set at the **2026-11-04**
refunding.

**4. THE HEADLINE THIS EVENT WAS FILED ON IS A NULL — SUPPORTED, on both channels.** The 7-Year sold
one session after an FOMC decision **16** times since 2014:

| | D+1 (n=16) | all others (n=136) | Welch t |
|---|---|---|---|
| bid-to-cover | **2.487** | **2.494** | **−0.21** |
| indirect share | 61.54% | 62.46% | — |
| dealer share | 22.67% | 20.00% | — |
| 7s10s, raw | −0.125bp (t = −0.32) | −0.074bp (t = −0.58) | — |
| **residual vs `−1.894 + 0.090 × dealer%`** | **−0.260bp (t = −0.83)** | **+0.031bp (t = 0.29)** | **−0.88** |

The demand row replicates the [01-21 announcement ledger's](treasury-coupon-announcement-2027-01-21.md)
7Y-at-D+1 figure (2.480 on its n=14 window) at **n=16** on this session's own independent pull. The
residual row is the new one — the price channel that ledger did not test — and it is equally dead. Note
the raw 7s10s and the residual disagree slightly in size for a mechanical reason worth stating: the D+1
cohort's **dealer share is higher** (22.67% vs 20.00%), because two-thirds of it predates the 2022
takedown collapse, so the model correctly expects a *less* negative print there and the residual is the
number to read, not the raw mean.

**5. THE CONTROL, and it is the strongest single result here — SUPPORTED.** A null at n=16 is a failure
to detect until it has a control that says what the day would have done without an auction in it. This
one exists and is large: of the **97** day-after-FOMC sessions since 2014, **81 carry no 7-Year
auction**, and they move 7s10s by **−0.148bp (sd 1.493, t = −0.89)** — against the 16 auction days'
**−0.125bp (sd 1.544, t = −0.32)**. The two are indistinguishable, and the *non-auction* leg is if
anything marginally more negative. Whatever mild flattening shows up on a day-after-FOMC session is a
property of the **session**, not of $44B of seven-year paper being sold into it. This is the same shape
of control the [11-25 sibling](treasury-7y-note-2026-11-25.md) used (a non-auction last-8-business-day
calendar control), matched on the FOMC offset instead of the calendar position.

**6. WHAT IS REAL IS THE VARIANCE, and it is this ledger's actual contribution — SUPPORTED.** The FOMC
does not move the day-after auction's *mean*. It very clearly moves its *spread*:

| Session class | n | mean \|Δ7s10s\| | sd Δ7s10s | mean \|Δ7Y\| | `P(|Δ7s10s| ≥ 2bp)` |
|---|---|---|---|---|---|
| decision day (D0) | 97 | 1.237bp | **1.646** | 5.39bp | — |
| **D+1 (this event)** | **97** | **1.072bp** | **1.493** | **4.65bp** | **22.7%** |
| \|offset\| > 3 | 2,492 | **0.823bp** | **1.194** | 4.00bp | **11.8%** |

Welch t on \|Δ7s10s\|, D+1 vs far, is **+2.32**; the **variance** ratio is **1.56**. The 7-year's own
level is wider too (sd 6.23 vs 5.27bp; `P(|Δ7Y| ≥ 10bp)` **12.4%** vs **6.5%**). Translated into the
only form that matters for this lane — detecting the model's fitted **0.8bp** at 80% power needs
**n = 18** auctions at ordinary-session sd and **n = 28** at D+1 sd. **The effect does not change; the
number of prints needed to see it rises 56%.** That is a genuinely different reason for "do not
attribute" than the [11-25 sibling's](treasury-7y-note-2026-11-25.md), which rested on 26 tracked events
inside five days. This corridor is quiet by comparison — **10** tracked entries, none sharing the
date — so crowding cannot be the excuse here, and the honest one is the denominator.

**7. A MONTH SPLIT WAS FOUND AND KILLED — reported because it failed, not because it worked.** Splitting
the 16 D+1 auctions by month produces exactly the kind of cell a lane could ship as a finding: January
D+1 residuals mean **+0.571** (n=6, t = 1.32), non-January **−0.759** (n=10, **t = −2.14**). Three
things kill it. All **13** January 7-Year auctions at any offset mean **+0.030 (t = 0.09)** — dead flat,
so "January is different" has no support outside the D+1 subset. The non-January leg is carried by two
members (**2022-07-28 at −3.06** and **2015-10-29 at −2.22**); drop them and it is noise. And it is one
uncorrected cell of a post-hoc split on n=16 — the same failure mode the
[11-25 ledger](treasury-7y-note-2026-11-25.md) documented when a t = −5.04 result reversed sign out of
sample. It is recorded here so the next session does not rediscover it alone.

**8. The January D+1 position is structural, not special — SUPPORTED.** Offsets for all 13 January
7-Year auctions since 2014: **2014 +1 · 2015 +1 · 2016 +1 · 2017 +28 · 2018 −4 · 2019 −1 · 2020 −1 ·
2021 +1 · 2022 +1 · 2023 +28 · 2024 −4 · 2025 −1 · 2026 +1.** **Nine of thirteen** sit within one
session of a decision and **six** are exactly D+1, because both the month-end coupon block and the
January FOMC are locked to the last week of January by calendar arithmetic. Across all months, +1 is one
of the 7-Year's two most common FOMC offsets (**16** of 152, against 18 at +6). The nearest structural
precedent is **2026-01-29** — same January block, same D+1 position, one year earlier — which printed
b/c **2.45**, dealer **10.93%**, 7s10s **−2.0bp** against a fitted **−0.92**, residual **−1.08bp**. One
observation, inside the ±1.5bp band, and named here as the comparison the next session will reach for
rather than as evidence.

**9. The one conditional that is alive but unproven — MIXED, and registered rather than claimed.** If
the straddle does anything, the plausible channel is the *content* of the decision, not its proximity.
Using the FOMC session's own 2-year move as a hawkish-surprise proxy across the 16: the auction
**residual** is unrelated (corr **+0.123, t = 0.46**) and so is dealer share (corr +0.089), but
**bid-to-cover** carries **corr −0.419, t = −1.73** — a hawkish decision session associating with weaker
next-day demand, in the direction the intuitive story predicts. It is not significant, it is one cell of
a small scan with no multiple-comparison correction, and the |Δ2Y| on those 16 decision days averaged
only **3.44bp**, so half of them barely register as surprises at all. Registered as
**FT-treasury-7y-note-2027-01-28-2** with its trigger condition stated up front.

**10. No new adjacency, and the reasons are three separate dead ends — SUPPORTED.** The five-day
corridor holds **10** tracked entries and is fully covered: [FOMC 01-27](fomc-2027-01-27.md), the block's
three sibling legs (`treasury-2y-note-2027-01-25`, `treasury-5y-note-2027-01-26`,
`treasury-2y-frn-2027-01-27`, all proposal-only and stood in by the loader),
[consumer confidence](consumer-confidence-2027-01-26.md), FHFA HPI 01-26,
`norway-gpfg-bond-expert-group-2027-01-25`, Tokyo CPI 01-29, BoJ Summary of Opinions 02-01 and
[ISM manufacturing 02-01](ism-manufacturing-2027-02-01.md). Three candidate gaps were checked and none
is proposable today: **(a)** the schedule's own window terminates at 2027-02-04, so this tenor's
successor has no primary (leg 2); **(b)** the 01-28 session's other Treasury activity is all weekly
bills — 4-week and 8-week auctioning, 13/26/6-week settling, 13/26/6-week announcing — a genre this
calendar does not track individually; **(c)** the January-2027 macro corridor still cannot be sourced.
`bea.gov/news/schedule` was fetched this session (HTTP 200, 75,122 bytes) and its **static HTML carries
no dates at all** — the table is JS-rendered — so this session could not extend
[`fomc-2027-01-27`](fomc-2027-01-27.md)'s 2026-08-31 finding that BEA's schedule ends 2026-12-23, and
does not claim to. That fetch is recorded in `probe-ref.blocked`. A Q4-advance GDP print would ordinarily
land in this week and would be a same-date 08:30 release; **it is not proposed, because no primary names
it**, and this lane does not file a date it has only inferred from seasonality.

**What plays the conditions support:** none directional, none symbol-keyed — the standing house answer
for this event kind. The usable output is a **reading instruction with a stated reason**: on 2027-01-28
expect an ordinary Thursday 1:00 p.m. auction, expect roughly **−0.8bp** of 7s10s conditional on a
dealer takedown near 11–12%, and **do not attribute the day's 7s10s move to the auction** — not because
the corridor is crowded (it is not), but because a day-after-FOMC session's spread variance is **1.56×**
an ordinary one and the auction's own contribution is indistinguishable from zero against an 81-session
no-auction control.

**Honest limits.** This is a **daily close-to-close** measurement on a fitted CMT par curve **rounded to
1bp**, and adjacent-tenor spreads on a smoothed curve are exactly where fitting artifacts would hide —
inherited from the [11-25 sibling](treasury-7y-note-2026-11-25.md) and not re-litigated. The central
null rests on **n = 16**; a null at that size is a failure to detect, not a demonstration of absence,
and it is only worth stating because leg 5's **n = 81** control agrees with it from the other direction.
The variance result is the more robust half (n = 97 vs 2,492) but it is a claim about **sessions**, not
about this auction, and a single print on 2027-01-28 cannot test it — the forward test registered below
says so up front rather than pretending otherwise. The FOMC-date parse is the Board's own calendars but
**2027 dates are tentative until confirmed at the preceding meeting** (the Fed's own rule, per
[`fomc-2027-01-27`](fomc-2027-01-27.md)), so this event's D+1 position is itself conditional on the
2026-12-09 confirmation. The dealer model is **explanatory, not predictive** — takedown prints after the
auction — so every fitted value here can only be scored post-hoc. The hawkish-surprise conditional in
leg 9 is one cell of a small uncorrected scan. And this auction's own size, CUSIP, when-issued level and
demand **do not exist yet**: the announcement is 2027-01-21, the size cell is set at the 2026-11-04
refunding, and 2027-01-28 is the furthest-out row Treasury publishes. `symbols: []`, `medium` impact,
date `estimate` — nothing here licenses a position in any name.

## Stance & kill switches

**Stance (estimate-dated event; no standalone play):** watch-only, and this session's specific
contribution is to **separate two claims the proposal had fused**. "The day after the FOMC" does
**nothing** to this auction: demand is unchanged (b/c **2.487** vs **2.494**, Welch t = **−0.21**,
n=16), the price residual against `7s10s = −1.894 + 0.090 × dealer%` is **−0.260bp (t = −0.83)** against
**+0.031bp** for the other 136 (Welch t = **−0.88**), and — the load-bearing control — the **81**
day-after-FOMC sessions carrying **no auction** move 7s10s **−0.148bp (t = −0.89)**, statistically
identical to the 16 that do. **The auction adds nothing to the day.** What the day adds is **variance**:
D+1 session 7s10s sd **1.493bp** against **1.194bp** at \|offset\| > 3 (ratio **1.56**), mean \|move\|
**1.072** vs **0.823bp** (Welch t = **2.32**), `P(|Δ7s10s| ≥ 2bp)` **22.7%** vs **11.8%** — which raises
the sample needed to detect the model's fitted **0.8bp** from **18** auctions to **28**. So the correct
output for 2027-01-28 is *do not attribute*, with a **measured reason that is not the
[11-25 sibling's](treasury-7y-note-2026-11-25.md)**: this corridor is quiet (**10** tracked entries,
none sharing the date) and the obstacle is the denominator. The model itself is **re-derived**
independently this session (−1.894 + 0.090 × dealer%, slope **t = 7.83**, n=152, residual sd
**1.248bp**), reproducing the sibling's coefficients to three decimals — the pipeline check that
licenses everything above. Grade the print on **dealer takedown** ($44B era p25 **9.34** / median
**11.64** / p75 **12.75**), never on indirect share. The close is **1:00 p.m. ET**, not the 11:30 a.m.
the November ledger measured — that finding does not transfer to an ordinary Thursday. Size **$44B**,
subject to the 2026-11-04 refunding, on a date that is the **furthest-out row Treasury publishes**.
Nothing here is directional and no house playbook applies.

**Kill switches (what would change this stance):**

- **The core one — the 2027-01-28 print's residual landing outside ±1.5bp of `−1.894 + 0.090 ×
  dealer%`.** That is the FOMC-adds-a-concession story finally appearing and it would reinstate this
  event's original headline. Registered as **FT-treasury-7y-note-2027-01-28-1** in
  [`forward-tests/treasury-7y-note-2027-01-28.md`](../forward-tests/treasury-7y-note-2027-01-28.md),
  score by **2027-02-01**, with its null pass rate stated up front (**79.6%** in-sample; **62.5%** on
  the D+1 cohort at the tighter ±1.0bp band) — a weak test by construction, registered as a weak one.
- **The 2027-01-27 FOMC session moving the 2-year by ≥ 3bp and the next-day bid-to-cover NOT moving
  with it** — the leg-9 conditional (corr **−0.419, t = −1.73**) is the only channel through which the
  straddle could still be real, and a clean contradiction retires it. Registered as
  **FT-treasury-7y-note-2027-01-28-2**, score by **2027-02-01**, un-triggered if \|Δ2Y\| < 3bp (stated
  up front, and roughly a coin flip given the 3.44bp mean on the 16 precedent decision days).
- **The model failing out of sample — 7s10s more than 2bp off fitted on 2026-09-24, 10-29, 11-25 or
  12-29.** Only **9.2%** of the 152-auction history misses by that much; two consecutive misses would
  mean the null in legs 4–5 is measured against a broken yardstick and every residual in this doc is
  void.
- **A size change at the 2026-11-04 refunding or the 2027-01-21 announcement.** $44B is 29 consecutive
  auctions of precedent; any deviation breaks the like-for-like series, voids the bid-to-cover band and
  the dealer-share quantiles, and must be logged off-cadence — this event sits three months past
  `sb0590`'s published grid, so it has the weakest guidance of any 7-Year in this calendar.
- **The 2026-12-09 FOMC confirming a 2027 calendar whose first meeting is not January 26–27.** The
  entire D+1 framing — and therefore legs 4 through 8 — is conditional on that date, which the Fed's own
  rule holds tentative until then. If January's meeting moves, this reverts to an ordinary month-end
  belly sale graded on the dealer model alone.
- **The auction moving off 2027-01-28 at the 2027-01-21 announcement**, or the schedule's February
  extension revealing a displacement — the tentative schedule is the only primary this date has.
- **Dealer takedown printing outside 4.06–17.00%** (the $44B era's full range) on any 7-Year between
  now and then, or **bid-to-cover outside 2.40–2.79** — the variables every fitted value and base rate
  here is keyed to moving outside their observed support.
- **Nothing here licenses date-keyed *action*.** The date is `estimate`; observations widen caution
  rather than licensing entries, and `symbols: []` means there is no instrument to express one in.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-141 | Initial research banked (doc above); canonical `src/domain/market-events/treasury-7y-note-2027-01-28.json` written this session after reading the one prior proposal (`.from-treasury-coupon-announcement-2027-01-21`), now shadowed and inert; `probe-ref` populated with real readings so the first `interval-elapsed` pulse is screenable. **Event tape (primary).** Terms verified independently from home.treasury.gov's Tentative-Auction-Schedule.pdf (HTTP 200, 17,195 bytes, text layer decompressed today — a second read of the same primary): announce **Thu 2027-01-21**, auction **Thu 2027-01-28**, settle **Mon 2027-02-01**, no `R` → new issue (the flag column IS populated within twenty rows — `20-Year BOND R`, `10-Year TIPS T`). **This is the LAST 7-Year row the PDF publishes** (six rows: 08-27, 09-24, 10-29, 11-25, 12-29, 2027-01-28; window ends 2027-02-04), so no successor is proposable from this primary and none is filed. Close is **1:00 p.m. ET** — `closing_time_comp` reads `01:00 PM` on **143 of 152**, the nine exceptions all half-days, so the [11-25 ledger's](treasury-7y-note-2026-11-25.md) 11:30 a.m. finding does NOT transfer. Entry stays **`estimate`** on the proposal's stated grounds. Size **$44B**: **29 consecutive** at that size, 2024-04-25 → 2026-08-27, the prior auction (2024-03-27) **$43B**; `sb0590` read from the 11-25 and [01-21](treasury-coupon-announcement-2027-01-21.md) ledgers, not re-fetched today, said so. **PIPELINE VALIDATED FIRST:** the inherited dealer model re-derived from an independent pull reproduces the sibling's coefficients to three decimals — **`7s10s = −1.894 + 0.090 × dealer%`, slope t = 7.83, n = 152, residual sd 1.248bp** (fiscaldata `auctions_query` on `security_term`, 259 rows, zero reopenings, 152 since 2014; 3,172 par-curve sessions 2014-01-02 → 2026-09-08 from thirteen CSVs; **116** FOMC decision days parsed from federalreserve.gov's own `fomchistorical<year>.htm` 2013–2020 + `fomccalendars.htm`, HTTP 200, 164,831 bytes). **THE LOAD-BEARING FINDING — the event's own headline ("sells into a KNOWN policy setting") is a NULL on the auction, and the effect that IS real belongs to the session, not the auction.** Of 152 7-Year auctions since 2014, **16** sold one session after a decision: b/c **2.487** vs **2.494** for the other 136 (Welch t = **−0.21**), indirect **61.54%** vs 62.46%, raw 7s10s **−0.125bp (t = −0.32)** vs −0.074, and — the new channel the [01-21 announcement ledger](treasury-coupon-announcement-2027-01-21.md) did not test — **model residual −0.260bp (t = −0.83)** vs **+0.031bp** (Welch t = **−0.88**). The demand row replicates that ledger's n=14 figure (2.480) at n=16 on an independent pull. Note the D+1 cohort's dealer share is HIGHER (22.67% vs 20.00%, two-thirds of it predating the 2022 takedown collapse), so the residual — not the raw mean — is the number to read. **THE CONTROL, and the strongest single result here:** of the **97** D+1 sessions since 2014, **81 carry no 7-Year auction**, and they move 7s10s **−0.148bp (sd 1.493, t = −0.89)** against the 16 auction days' **−0.125bp (sd 1.544, t = −0.32)** — indistinguishable, with the NON-auction leg marginally more negative. Whatever flattening a day-after-FOMC session shows is a property of the day, not of $44B of paper. Same shape of control the 11-25 sibling used, matched on FOMC offset instead of calendar position. **THE ACTUAL CONTRIBUTION — D+1 is a 1.56× VARIANCE session:** 7s10s sd **1.493bp** (n=97 D+1) vs **1.194bp** (n=2,492 at \|offset\|>3); mean \|Δ7s10s\| **1.072** vs **0.823** (Welch t = **+2.32**); decision day itself wider still (sd **1.646**, \|Δ\| 1.237); mean \|Δ7Y\| **4.65** vs **4.00bp** (sd 6.23 vs 5.27); tails `P(|Δ7s10s|≥2bp)` **22.7%** vs **11.8%** and `P(|Δ7Y|≥10bp)` **12.4%** vs **6.5%**. In power terms: detecting the model's fitted **0.8bp** at 80% power needs **n=18** at ordinary sd and **n=28** at D+1 sd — the effect is unchanged, the prints needed to see it rise **56%**. This is a DIFFERENT reason for "do not attribute" than 11-25's corridor saturation: this corridor is **quiet** (10 tracked entries, none sharing the date), so the obstacle is the denominator. **A MONTH-SPLIT TRAP FOUND AND KILLED, recorded because it failed:** January D+1 residuals mean **+0.571** (n=6, t=1.32) vs non-January **−0.759** (n=10, **t = −2.14**) — killed on three counts: all **13** January auctions at any offset mean **+0.030 (t = 0.09)**; the non-January leg is carried by two members (2022-07-28 **−3.06**, 2015-10-29 **−2.22**); and it is one uncorrected cell of a post-hoc split on n=16. **STRUCTURE, not specialness:** January offsets 2014 +1 · 2015 +1 · 2016 +1 · 2017 +28 · 2018 −4 · 2019 −1 · 2020 −1 · 2021 +1 · 2022 +1 · 2023 +28 · 2024 −4 · 2025 −1 · 2026 +1 — **9 of 13 within one session of a decision, 6 exactly D+1**, because the month-end block and the January FOMC are both locked to the last week. Across all months +1 is one of the two most common offsets (16 of 152, vs 18 at +6). Nearest precedent **2026-01-29**: b/c 2.45, dealer 10.93%, 7s10s −2.0 vs fitted −0.92, residual **−1.08bp** — inside the band, n=1. **THE ONE LIVE CONDITIONAL (MIXED):** vs the FOMC session's own Δ2Y as a hawkish proxy, the residual is unrelated (corr +0.123, t = 0.46) and dealer share is too (+0.089), but **b/c carries corr −0.419, t = −1.73** — right direction, not significant, one uncorrected cell, and \|Δ2Y\| on those 16 decision days averaged only **3.44bp**. **Macro.** Par curve 2026-09-08: 2Y **4.39**, 3Y 4.44, 5Y **4.57**, 7Y **4.68**, 10Y **4.80**, 20Y 5.26, 30Y **5.25**; 2s10s **41bp**, **7s10s −12bp**. Last 7Y cleared **4.512%** (2026-08-27). **Volatility:** VIX **15.72** (2026-09-08 close) vs 14.53 on 09-04 and the 14.43 2026 low of 08-28 — quiet. **Peers:** `symbols: []`, none applicable. **Geopolitical:** nothing new touching this tenor beyond the oil→inflation→Fed-path channel the September siblings recorded. **Corridor — 10 tracked entries within five days, NONE sharing the date**: [FOMC 01-27](fomc-2027-01-27.md), the block's three sibling legs (`treasury-2y-note-2027-01-25`, `treasury-5y-note-2027-01-26`, `treasury-2y-frn-2027-01-27` — all proposal-only, stood in by the loader), [consumer confidence 01-26](consumer-confidence-2027-01-26.md), `fhfa-hpi-2027-01-26`, `norway-gpfg-bond-expert-group-2027-01-25`, `japan-cpi-tokyo-flash-2027-01-29`, `boj-summary-of-opinions-2027-02-01`, [ISM manufacturing 02-01](ism-manufacturing-2027-02-01.md). Settlement **2027-02-01** carries the 2Y, 5Y and FRN too — four coupon settlements on one Monday, month-START not month-end. **Adjacency sweep: NO new event proposed, three dead ends recorded rather than a guess** — (a) the schedule window terminates 2027-02-04 so this tenor's successor has no primary; (b) 01-28's other Treasury activity is weekly bills only (4/8-week auctioning, 13/26/6-week settling and announcing), a genre this calendar does not track individually; (c) the January-2027 macro corridor still cannot be sourced — `bea.gov/news/schedule` fetched today HTTP 200, 75,122 bytes, but its **static HTML carries no dates at all** (JS-rendered table), so [`fomc-2027-01-27`](fomc-2027-01-27.md)'s 2026-08-31 finding that BEA's schedule ends 2026-12-23 could not be extended and is NOT claimed as re-verified; logged in `probe-ref.blocked`. A Q4-advance GDP print would ordinarily land this week and is deliberately NOT proposed — no primary names it, and this lane does not file a seasonally-inferred date. **Forward tests registered: FT-treasury-7y-note-2027-01-28-1** (the residual stays inside ±1.5bp — the concession story stays dead; null pass **79.6%** in-sample, **62.5%** on the D+1 cohort at ±1.0bp, registered as WEAK and scoreable only after takedown prints) and **FT-treasury-7y-note-2027-01-28-2** (the leg-9 hawkish-surprise conditional, un-triggered if \|Δ2Y\| < 3bp on 01-27 — stated up front as roughly a coin flip). | — (stance set; the proposal's "sells into a known policy setting" hook is retired as a null on the auction and replaced by a measured 1.56× session-variance statement) | 2026-09-30 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-7y-note-2027-01-28.json` (`status: "estimate"`)
in the same PR — this event's own file, never another lane's canonical one. Close-out fills `## Outcome`
below from re-run instrument data (cache busted first), never from memory — after which this doc goes
quiet.
