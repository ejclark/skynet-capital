# 2-Year Treasury Note auction (January new issue, D−2 to the FOMC) — treasury-2y-note-2027-01-25

**Kind:** rates · **Date:** 2027-01-25 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-09 — `2-Year NOTE` with NO trailing `R`, announce 01-21, auction 01-25, settle 02-01; 1:00pm ET by convention, not separately sourced) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["boj-decision-2027-01-22","consumer-confidence-2027-01-26","fhfa-hpi-2027-01-26","fomc-2027-01-27","japan-cpi-2027-01-22","japan-cpi-tokyo-flash-2027-01-29","norway-gpfg-bond-expert-group-2027-01-25","treasury-10y-tips-2027-01-21","treasury-20y-bond-2027-01-20","treasury-2y-frn-2027-01-27","treasury-5y-note-2027-01-26","treasury-7y-note-2027-01-28","treasury-coupon-announcement-2027-01-21","vix-expiration-2027-01-20"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/schedule/2027/home.htm","status":"403","at":"2026-09-09"},{"url":"https://www.bls.gov/bls/news-release/eci.htm","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Do not carry this calendar's ~6bp 2Y auction-day rally into 2027-01-25 — the D−2-to-FOMC
slot does not deliver it, and the reason is not the one the calendar has been recording.** The
[10-26 sibling](treasury-2y-note-2026-10-26.md) read the slot as a *smaller rally* (−2.43bp vs
−6.07bp, n=7). Extending that to the full record this session — all **320** nominal 2Y auctions since
2000 against **6,674** par-curve sessions and **225** FOMC decision dates, every series pulled today —
the level gap is not there: **D−2 closes −0.85bp (n=27, t = −1.40) against far-from-FOMC −0.46bp
(n=200), permutation p = 0.72**, and it is insignificant in every era cut including 2023+ (p = 0.17).
What *is* there, in every cut, is **compression**: |move| on D−2 runs **2.04bp vs 3.90bp far
(p = 0.018)**, holding at 2010+ (p = 0.029), 2015+ (p = 0.024) and 2023+ (**2.43 vs 6.96, p = 0.045**).
And it is **not the auction's** — non-auction D−2 sessions compress the same way (2.74bp vs 3.59bp,
p = 0.019, n=129), so the pre-decision session pins the front end and the auction merely happens
inside it. The practical difference is large: in the live regime a far auction day delivers a ≥6bp
rally **56% of the time (15/27)**; a D−2 auction day has done it **twice in 27 tries across 27 years**.
Second finding, a data-quality correction the whole rates series should inherit: the proposal's
"robust" `original_security_term` filter **drops 11 genuine monthly new issues, including 2026-01-26**
— this event's closest comparator. Third, weakest, flagged as multiple-tested: January D−2 auctions
run **−2.88bp (n=8, t = −2.28)** against other-month D−2 at **0.00bp**. Date `estimate`, `symbols: []`,
nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D−138) | **Stand aside** | High | Nothing about this sale exists. Its size is published nowhere — `sb0590`'s grid ends at `Oct-26` — and its terms arrive at the **2027-01-21** announcement, 134 days out. `symbols: []` leaves nothing to express a view in. | Nothing dated today for this event; the first document that names it is 134 days away |
| This week | **Stand aside — and do not read the 09-09/09-10 coupon block or the 09-16 FOMC as this auction's preview** | High | Different tenors, and a September decision says nothing about a January one. The diagnostic predecessor is the **2026-09-22** 2Y, which has not happened. | The **2026-09-11** CPI, which moves the policy path this auction prices — that print, not the coupon block, is the week's front-end event |
| This month | **Watch the 2026-09-22 predecessor, and grade it on dealer takedown — but do not read it as evidence about this date** | Medium | 09-22 is **D+6** from `fomc-2026-09-16`, so it lands in neither population that matters here. Its value is one more observation on whether the 2023+ regime is still live at all. | A **2026-09-22** dealer takedown above the 2025-04+ p75 of **12.3%** with bid-to-cover below the $69B-era p25 of **2.570** — a genuinely weak print would reopen the demand question this doc treats as settled |
| This quarter | **Expect a SMALL move on 2027-01-25 in either direction, and treat a ≥6bp rally as real news rather than as the prior arriving** | Medium | The D−2 slot compresses dispersion in every era cut (2023+: mean absolute move 2.43bp vs 6.96bp, p = 0.045) while showing no level tilt at all (p = 0.72 on the full record). **86%** of 2023+ D−2 auctions moved ≤4bp; only **30%** of 2023+ far auctions did. | The **2027-01-25** 2Y CMT move exceeding **4bp in absolute value** — the compression failing on a clean D−2 test (registered as **FT-treasury-2y-note-2027-01-25-1**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, the date is `estimate`, and no house playbook
  (S1/S2/E1/S3/S4 + G1) is rates-keyed. This is a read-it-don't-trade-it event.
- **The prior for 01-25 as a distribution, not a number** — D−2 2Y auction days, 2000-2026, n=27:
  p25 **−2.0** · median **0.0** · p75 **+1.0**, sd **3.16**, 17 of 27 at or below zero.
- **The number that changes the read:** ≥6bp rallies run **56% (15/27)** on 2023+ far auction days and
  **7% (2/27)** on D−2 days across the whole record. Same instrument, different session.
- **The pin belongs to the session, not the sale.** Non-auction D−2 sessions run |move| **2.74bp** vs
  **3.59bp** far (p = 0.019, n=129); D−2 |move| ≤4bp on **84%** of them.
- **Demand does not deteriorate in this slot** — $69B-era D−2 bid-to-cover **2.655** (n=6) vs far
  **2.626** (n=16), dealer takedown **10.69%** vs **11.94%**. Dealers eat *less*, not more.
- **The direct precedent printed strong and still barely moved.** 2026-01-26 — January, D−2, $69B —
  covered **2.75** (3rd of 29 in the era) on **7.3%** dealer (2nd-lowest of 29) and moved **−4bp**.
- **Grade the print on dealer takedown**, the 10-26 sibling's correction, carried unchanged:
  2025-04+ p25 **10.2%** / median **11.2%** / p75 **12.3%**. On the $69B-era base (n=29): 10.2 / 11.5 / **13.2**.
- **Bid-to-cover band, $69B era only** (29 auctions, 2024-04-23 → 2026-08-25): mean **2.624**,
  sd 0.095, min **2.41** · p25 2.570 · median **2.640** · p75 2.680 · max **2.81**.
- **The January tilt is suggestive and under-powered — size it as such.** n=8, mean −2.88bp,
  t = −2.28, but one of six month-cuts tested; Bonferroni-adjusted p ≈ **0.16**, not significant.
- **Size is unpublished and must not be asserted.** `sb0590`'s grid ends `Oct-26`; $69B is 29
  consecutive prints plus verbatim flat guidance. The number lands at the **2027-01-21** announcement.
- **The day is not clean, unlike the 11-23 sibling's.** `norway-gpfg-bond-expert-group-2027-01-25`
  shares 01-25, and the 13/26-week bills price at 11:30am ET against the note's 1:00pm.
- **Watch (dated)** — CPI **09-11** · FOMC **09-16** · predecessor 2Y **09-22** · FOMC **10-28** ·
  refunding **11-04** (the first table that could name Jan-27) · FOMC **12-09** · blackout opens
  **2027-01-16** · MLK closure **01-18** · 20Y **01-20** · 10Y TIPS + **this announcement 01-21** ·
  BoJ **01-22** · **this auction 01-25** · 5Y **01-26** · **FOMC 01-27** + FRN · 7Y **01-28** ·
  settlement **02-01**.

## Initial research

**The question, plainly:** this calendar carries a measured prior that a 2-Year auction day rallies the
front end ~6bp, and a sibling's footnote that the pre-FOMC slot delivers less of it (−2.43bp, n=7,
p = 0.167, explicitly not established). 2027-01-25 sells at exactly that slot. Before the next four
months of pulses lean on either number, which of the two is real — and is the mechanism the one the
calendar has written down?

**One-line verdict:** the level story is **refuted** at eleven times the sibling's sample and the
mechanism is **misattributed** — what the D−2 slot does is halve the *size* of the move in both
directions, that compression is a property of the pre-decision session rather than of the auction, and
the honest output for 2027-01-25 is a narrow band plus a registered test of the band.

**Method:** sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode —
the house instruments are symbol-keyed and this event has `symbols: []`, so no `earnings-cycle` /
`intraday-edges` run applies and no cache bust was required. Every figure below is computed this
session from four primaries fetched today: the Fiscal Data `auctions_query` dataset (1,687 Note rows,
filtered to **320** nominal 2-Year new issues 2000-01-26 → 2026-08-25), the daily par yield curve CSVs
for 2000–2026 (**6,674** sessions, 2000-01-03 → 2026-09-08), the Federal Reserve's own FOMC calendars —
the current page plus 21 historical year pages, giving **225** decision dates 2000-02-02 → 2027-12-08
with notation votes excluded — and the Tentative Auction Schedule PDF (HTTP 200, 17,195 bytes,
decompressed stream-by-stream to 909 text tokens). VIX is CBOE's own `VIX_History.csv`. Significance
is permutation-tested (50,000–100,000 draws) rather than assumed normal, because several populations
are n<10. **Two fetches failed and are recorded, not substituted:** `bls.gov/schedule/2027/home.htm`
and `bls.gov/bls/news-release/eci.htm` both returned **403** — the known blind spot this lane already
documents — so no BLS-dated adjacency was proposed. Each claim dated in line.

### Conviction legs, tested

**1. The date, the terms and the slot are right, and the entry stays `estimate` — SUPPORTED.** The
tentative schedule carries the row verbatim: `2-Year NOTE · Thursday, January 21, 2027 · Monday,
January 25, 2027 · Monday, February 01, 2027`. No `R`, and the same PDF's legend reads
`R --denotes reopening`, so it is a new issue by Treasury's own marker. Read in the same fetch, the
**same 01-21 announcement** carries `5-Year NOTE` on Tuesday 01-26, `2-Year FRN` on Wednesday 01-27 and
`7-Year NOTE` on Thursday 01-28, all settling 02-01, plus the holiday line `Holiday - Monday, January
18, 2027 - Birthday of Martin Luther King, Jr.` The Fed's own calendar page (fetched direct today,
HTTP 200, 164,831 bytes) puts the January 2027 meeting on **January 26-27**, so this auction is **D−2
from the decision and D−1 from the day the committee sits** — the only coupon in the block that prices
before the meeting convenes. `TSY:` is an authorised `confirmed` prefix, but this sale is **138 days
out with its announcement 134 days away**, further out than either 2026 sibling was when it chose
`estimate`. Holding `estimate` costs nothing: estimates only widen caution and no date-keyed action
follows at any label. **The confirming primary is the 2027-01-21 announcement.** Note that the Fed's
page also states each meeting date "is tentative until confirmed at the meeting immediately preceding
it," so the D−2 classification rests on a tentative date too — a kill switch below, not a footnote.

**2. The filter this calendar was told to use drops 11 real auctions, one of which is this event's
closest comparator — SUPPORTED, and it is a correction the whole rates series inherits.** The
proposal that created this entry recommends a "robust filter" intersecting `security_term` **and**
`original_security_term` (plus the two boolean flags), reporting n=130 since 2015. That intersection
returns **309** rows since 2000 where the plain filter returns **320**. The 11 dropped rows are not
seasoned reopenings:

| Test | Result |
|---|---|
| Duplicate CUSIPs across the 320 | **0** — no row is a reopening of another |
| Auctions per calendar month, 2000-01 → 2026-08 | **exactly one**, with a single two-sided exception |
| The exception | **no 2Y in 2015-10, two in 2015-11** — the debt-ceiling postponement, the October sale rescheduled to **2015-11-04** (settling next-day 11-05) |
| Of the 11 dropped rows, how many are the ONLY 2-Year in their month | **10** (the 11th is 2015-11-04) |
| Do the dropped rows carry their era's new-issue size | **yes** — $69B (2026-01-26), $40B (2019-03, 2019-04), $26B (2015-17), $10B (2000-10) |

So `original_security_term` is simply mislabelled on those rows, and excluding them opens exactly the
holes they fill. **The one that matters here is 2026-01-26** — January, D−2, $69B — the single most
directly comparable auction to 2027-01-25, and the "robust" filter hides it. The correct filter is
`security_term: '2-Year'` **+** `floating_rate: 'No'` **+** `inflation_index_security: 'No'`; the
`floating_rate` flag alone removes the FRN rows the proposal was rightly worried about (2026-01-28,
2026-04-28 and 2026-07-29 all carry `security_term: 2-Year`). The
[11-23 sibling](treasury-2y-note-2026-11-23.md) used n=320 and was right to; the
[01-21 announcement ledger](treasury-coupon-announcement-2027-01-21.md) flagged the field as a trap and
was right to; what neither did is say which filter to use, so this doc says it.

**3. The D−2 "discount" is not a level effect — REFUTED at eleven times the sibling's n, and this is
the load-bearing leg.** Close-to-close 2Y CMT moves, all 320 auctions against 225 decision dates:

| Population | n | Mean move | t |
|---|---|---|---|
| D−2 before an FOMC decision, 2000-2026 | **27** | **−0.85bp** | −1.40 |
| >7 days from any FOMC ("far"), 2000-2026 | 200 | −0.46bp | −1.17 |
| D−2, 2010+ | 23 | −0.48bp | — |
| D−2, 2015+ | 20 | −0.65bp | — |
| D−2, 2023+ (the sibling's window) | 7 | −2.43bp | −1.76 |

The head-to-head, permutation-tested: **2000+ diff −0.40bp, p = 0.72** · 2010+ **+0.67bp, p = 0.55** ·
2015+ **+0.90bp, p = 0.50** · 2023+ **+3.65bp, p = 0.17**. Not one cut reaches significance, the sign
flips across cuts, and the only cut that even looks like the sibling's story is the one it was measured
in. The sibling said so itself — it graded the finding n=7, p = 0.167 and "not statistically
established" — so this is not a correction of a claim, it is the out-of-sample answer to a question
that ledger left open. **The level reading should stop being carried.**

**4. What the D−2 slot actually does is halve the move in both directions — SUPPORTED in every era
cut, and this is the finding that replaces leg 3's.**

| Cut | D−2 mean \|move\| (n) | Far mean \|move\| (n) | Permutation p |
|---|---|---|---|
| 2000+ | **2.04bp** (27) | 3.90bp (200) | **0.018** |
| 2010+ | **1.61bp** (23) | 3.45bp (119) | **0.029** |
| 2015+ | **1.75bp** (20) | 4.03bp (87) | **0.024** |
| 2023+ | **2.43bp** (7) | 6.96bp (27) | **0.045** |

Signed standard deviation tells the same story (**3.16 vs 5.50** on the full record; **3.64 vs 6.43**
in 2023+), and so does the tail: a move of 8bp or more occurs on **7% of D−2 days (2/27)** against
**15% of far days (30/200)**, and in the live regime **14% (1/7) against 37% (10/27)**. Unlike the level
result this survives every cut, and unlike the sibling's it does not depend on the 2023+ window.

**5. The compression is the pre-decision session's, not the auction's — SUPPORTED, and it is why the
finding should generalise.** If the auction were doing the pinning, ordinary D−2 sessions would look
like any other session. They do not. Across 2000-2026, **non-auction** sessions two days before a
decision run mean |move| **2.74bp** against **3.59bp** on non-auction far sessions (**p = 0.019**,
n=129 vs 4,200), with |move| ≤4bp on **84%** of them against 71%; in 2023+ the same comparison reads
**2.65 vs 4.61** (p = 0.059, n=20). The mechanism is unmysterious and is on this calendar already: the
Fed's blackout opens for the January 2027 meeting on **2027-01-16** ([`fomc-blackout-start-2027-01-16`](fomc-blackout-start-2027-01-16.md)), so
by 01-25 there is no Fed speech left to reprice the path and no data of consequence between the auction
and the decision. **Practical consequence: this is a claim about the session, so it applies to
2027-01-25 whether or not the 2023+ auction-day regime is still live in January — which is exactly what
makes it a better thing to register than the regime itself.**

**6. Demand does not deteriorate in the slot, and the direct precedent printed strong — SUPPORTED.**
The compression story would be uninteresting if it came with a worse sale. It does not:
bid-to-cover in the D−2 slot runs **2.725 vs 2.691** (2000+), **2.656 vs 2.699** (2015+) and **2.655
(n=6) vs 2.626 (n=16)** in the $69B era, and dealer takedown — the residual underwriters are forced to
eat, and the 10-26 sibling's correction to the indirect-share yardstick — runs **10.69% vs 11.94%** in
that era. Dealers take *less* into the pin, not more. The six $69B-era D−2 prints read: **2025-01-27**
(−10bp, b/c 2.66, dealer 13.7%) · **2025-07-28** (0bp, 2.62, 10.3%) · **2025-10-27** (0bp, 2.59, 11.6%)
· **2026-01-26** (−4bp, **2.75**, **7.3%**) · **2026-04-27** (0bp, 2.65, 11.9%) · **2026-07-27** (−2bp,
2.66, 9.4%). The January 2026 sale is the sharpest single data point this doc has: **3rd-highest cover
and 2nd-lowest dealer takedown of all 29 auctions in the era** — an unambiguously strong auction — and
it moved **−4bp**, not −6 or −10. A strong sale in this slot does not produce the far-auction rally.

**7. The January tilt is the strongest thing on the board and the least trustworthy — MIXED, and it
is graded down on purpose.** Cutting D−2 auctions by calendar month, January runs **−2.88bp (n=8,
t = −2.28)** against other-month D−2 at **0.00bp (n=19)**, permutation **p = 0.027**; 7 of the 8 closed
at or below zero (2008 −3, 2013 +1, 2019 0, 2020 −5, 2021 0, 2022 −2, 2025 −10, 2026 −4). It is not an
outlier artifact — dropping 2025's −10 leaves −1.86bp at t = −2.17. Three reasons it is still graded
weak. **(a) It is one of six cuts.** Only six calendar months contain any D−2 2Y auction at all
(01, 04, 06, 07, 09, 10, counts 8/6/2/8/1/2); testing the family and reporting the best member gives a
Bonferroni-adjusted **p ≈ 0.16**. **(b) "January" alone does nothing** — all-January auctions run
−0.48bp against all-other −0.31bp, **p = 0.88** — so the claim requires the interaction, which is the
shape a spurious result usually takes. **(c) No mechanism was found**, and this doc will not invent
one; the plausible candidates (first meeting of the year, voter rotation, year-start index extension)
are stories, not measurements. Registered as a forward test at **low** confidence so the tape
adjudicates it, and sized at nothing.

**8. Two tempting narratives, both killed before they got written — REFUTED.** First, *"the January
2027 block is unusual because it straddles the meeting."* It is not: **27 of 211** 7-Year auctions
since 2009 have sold on the day after a decision (13%), and nine of those are Januaries — 2010-01-28,
2011-01-27, 2012-01-26, 2014-01-30, 2015-01-29, 2016-01-28, 2021-01-28, 2022-01-27 and 2026-01-29. The
straddle is what a late-January meeting and a fixed month-end coupon cycle *always* produce. The
[01-21 announcement ledger](treasury-coupon-announcement-2027-01-21.md) already measured the straddle's
effect on demand as a null across 43 straddling auctions and this doc defers to it rather than
re-deriving it. Second, *"D−2 is a weekday effect."* It is very nearly the same variable — **25 of the
27** D−2 auctions were Mondays — so the two cannot be separated on this record, and any Monday-specific
claim about this date would be the D−2 claim wearing a different label. Stated so no later pulse
reports it as an independent confirmation.

**9. Nothing about the auction forecasts the decision — SUPPORTED, and it bounds what this event is
worth.** The 2Y close on the decision day two sessions later, following a D−2 auction: **+0.59bp,
t = 0.64, n=27**, sd 4.84 — no signal, and the decision day is the *louder* of the two in 63% of pairs
(17/27). The auction is also not tenor-specific here the way it is far from FOMC: on D−2 the 10Y moves
−0.44bp against the 2Y's −0.85bp, and 2Y-minus-10Y is **−0.41bp at t = −0.92** — insignificant, where
the 10-26 sibling measured −3.75bp at t = −6.47 on the full auction-day population. Consistent with
leg 5: what is happening on a D−2 session is the whole curve waiting, not the front end absorbing paper.

**What plays the conditions support:** none directional, none symbol-keyed — the standing house answer
for this event kind. The usable output is a **narrow band to read 01-25 against** and a registered test
of the band. Nothing about this event licenses a position.

**Honest limits.** All moves are **daily close-to-close on a CMT series rounded to 1bp**, which matters
more here than in the sibling ledgers: this doc's central claim is about *small* moves, and 1bp
rounding compresses measured dispersion in the population where moves are smallest. That biases the
D−2 |move| downward relative to far — a real confound, partially answered by leg 5 (the non-auction
comparison suffers the same rounding and still separates) but not eliminated. Nothing here can see an
intraday concession before the 1:00pm award. Causation is not established: a D−2 session contains
everything else that happened that day, and "the blackout pins the front end" is a mechanism proposed,
not tested. The 2023+ D−2 population is **n=7** and the January-D−2 population **n=8** — leg 7 is
explicitly under-powered and leg 3's 2023+ cell is too, so a reader should treat the 2000+ and 2010+
rows as the load-bearing ones. The FOMC date list excludes notation votes (2025-08-22) and includes the
2020 unscheduled meetings; reclassifying either moves a handful of sessions but no headline. This
auction's size, CUSIP and demand **do not exist yet**, and no Treasury document published today names
January 2027. `symbols: []`, `medium` impact, date `estimate`: nothing here licenses a position in any
name.

## Stance & kill switches

**Stance (estimate-dated event; no standalone play):** watch-only, and the contribution is **a prior
this calendar should stop carrying into pre-FOMC auctions, replaced by one that survives**. The
~6bp 2Y auction-day rally is a far-from-FOMC phenomenon; at **D−2 it does not appear as a level effect
at all** (−0.85bp vs −0.46bp, n=27 vs 200, p = 0.72, and insignificant in every era cut). What the slot
does is **compress**: |move| 2.04bp vs 3.90bp (p = 0.018), holding at 2010+, 2015+ and 2023+, with
≥8bp moves on 7% of D−2 days against 15% of far days — and the compression is the **pre-decision
session's**, not the auction's, since non-auction D−2 sessions do the same (2.74 vs 3.59, p = 0.019)
and the Fed's blackout for this meeting opens **2027-01-16**. So the base case for **2027-01-25** is a
**move inside ±4bp** (89% of D−2 auctions historically; 86% in 2023+; against only 30% of 2023+ far
auctions), with a **≥6bp rally counting as real news** — that has happened on 2 of 27 D−2 days in
27 years while running 56% on 2023+ far days. Demand is not the risk: the slot's bid-to-cover and
dealer takedown are both *better* than far, and the direct precedent (**2026-01-26**: January, D−2,
$69B, cover 2.75 = 3rd of 29, dealer 7.3% = 2nd-lowest of 29) was a strong auction that still moved only
−4bp. Grade the print itself on **dealer takedown** (2025-04+ p25 10.2% / median 11.2% / p75 12.3%),
never on indirect share. Size is **not published** and must not be asserted before the **2027-01-21**
announcement. A January-specific tilt exists in the data (−2.88bp, n=8, t = −2.28) and is deliberately
**not** in the base case: it is one of six month-cuts, Bonferroni-adjusted p ≈ 0.16, with no mechanism.
Nothing here is directional and no house playbook applies.

**Forward tests registered** in
[`forward-tests/treasury-2y-note-2027-01-25.md`](../forward-tests/treasury-2y-note-2027-01-25.md):
**FT-treasury-2y-note-2027-01-25-1** (the compression band, |move| ≤4bp) and
**FT-treasury-2y-note-2027-01-25-2** (the January tilt, move ≤0bp — the weak one, registered at low
confidence precisely so it can be killed).

**Kill switches (what would change this stance):**

- **The core one — |2Y CMT move on 2027-01-25| exceeding 4.0bp.** The compression failing on a clean
  D−2 test. Base rates stated up front and they disagree sharply: **89% of all D−2 auctions (24/27)**
  and **86% of 2023+ D−2 auctions (6/7)** cleared this bar, against **30% of 2023+ far auctions
  (8/27)** and 84% of non-auction D−2 sessions. Registered as **FT-treasury-2y-note-2027-01-25-1**,
  score by 2027-01-26.
- **A move of −6.0bp or worse on 2027-01-25.** The specific failure mode that would mean the
  far-auction prior reaches this slot after all: 2 of 27 D−2 days on the whole record, 1 of 7 in the
  live regime, against 15 of 27 (56%) on 2023+ far days. It kills the stance in the *direction* the
  calendar previously assumed, which is why it is named separately from the symmetric test.
- **The 2026-10-26 and 2026-11-23 siblings both printing at or below −6bp.** Those two score on
  2026-10-27 and 2026-11-24, before this event's third pulse. Two far-style rallies — one of them from
  the D−2 slot itself ([FT-treasury-2y-note-2026-10-26-1](../forward-tests/treasury-2y-note-2026-10-26.md))
  — would say the regime has strengthened enough to overrun the pin, and this doc's band should be
  widened *before* the auction rather than after it. Worth an off-cadence pulse.
- **The January-D−2 tilt failing** — a move above 0bp on 2027-01-25. 7 of 8 prior January D−2 auctions
  closed at or below zero against 10 of 19 in other months. Registered as
  **FT-treasury-2y-note-2027-01-25-2** at **low** confidence; a fail retires the interaction rather
  than surprising anyone.
- **The 2027-01-26/27 FOMC moving**, or the auction moving off 2027-01-25. Either destroys the D−2
  classification that is the entire premise, and both forward tests **void** rather than score. The
  Fed's own calendar states each meeting date is tentative until confirmed at the meeting before it —
  so the confirming event here is the **2026-12-08/09 meeting**, not an announcement.
- **A size change at the 2026-11-04 refunding or the 2027-01-21 announcement.** $69B is 29 consecutive
  prints plus written flat guidance, not a published January-2027 number. Any deviation breaks the
  like-for-like series and voids the bid-to-cover and dealer bands quoted above.
- **A D−2 print with weak cover AND a forced dealer residual** — bid-to-cover below the $69B-era p25
  of **2.570** *and* dealer takedown above **12.3%** — would break leg 6 and reopen the demand question.
  The [01-21 announcement ledger](treasury-coupon-announcement-2027-01-21.md) already owns the
  block-wide version of this test (`FT-treasury-coupon-announcement-2027-01-21-2`); this doc defers to
  it and does not re-register it.
- **Nothing here licenses date-keyed *action*.** The date is `estimate`; observations widen caution
  rather than licensing entries, and `symbols: []` means there is no instrument to express one in.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D−138 | Initial research banked (doc above); canonical `src/domain/market-events/treasury-2y-note-2027-01-25.json` written this session after reading the one prior proposal (`from-treasury-coupon-announcement-2027-01-21`, 2026-09-09), per EVENT-RESEARCH.md; `probe-ref` populated with real readings so the first `interval-elapsed` pulse is screenable. **Event tape (primary).** Schedule row re-verified verbatim from the Tentative-Auction-Schedule PDF (HTTP 200, 17,195 bytes, decompressed to 909 tokens today): announce **Thu 01-21**, auction **Mon 01-25**, settle **Mon 02-01**, no `R` → new issue; same fetch gives `5-Year NOTE` 01-26, `2-Year FRN` 01-27, `7-Year NOTE` 01-28 and `Holiday - Monday, January 18, 2027 - Birthday of Martin Luther King, Jr.` **Slot fixed from the Fed's own calendar** (federalreserve.gov/monetarypolicy/fomccalendars.htm, HTTP 200, 164,831 bytes, fetched today): January 2027 FOMC is **26-27**, so this is **D−2 from the decision, D−1 from the day the committee sits** — the only coupon in the block pricing before the meeting convenes. That page also states each meeting date is tentative until confirmed at the preceding meeting. **CORRECTION TO THE PROPOSAL, inherited by the whole rates series:** its recommended "robust filter" (intersecting `security_term` AND `original_security_term`) returns 309 rows where the plain filter returns **320**, and the 11 it drops are genuine monthly new issues — 0 duplicate CUSIPs across the 320, exactly one auction per calendar month 2000-01→2026-08 with one two-sided exception (none in 2015-10, two in 2015-11 = the debt-ceiling postponement to 2015-11-04), 10 of the 11 the only 2-Year in their month, each at its era's new-issue size. **One of them is 2026-01-26** — January, D−2, $69B — this event's closest comparator. Correct filter: `security_term: '2-Year'` + `floating_rate: 'No'` + `inflation_index_security: 'No'`. **LOAD-BEARING FINDING — the D−2 "discount" is not a level effect.** Across all 320 auctions, 6,674 par-curve sessions (2000-01-03→2026-09-08) and **225** FOMC decision dates (Fed calendars, notation votes excluded), D−2 closes **−0.85bp (n=27, t=−1.40)** against far-from-FOMC **−0.46bp (n=200)**: diff **−0.40bp, permutation p = 0.72**; 2010+ +0.67 (p=0.55), 2015+ +0.90 (p=0.50), 2023+ +3.65 (p=0.17). No cut significant, sign flips, only the sibling's own window resembles its −2.43-vs-−6.07 reading — which that ledger already graded n=7/p=0.167. **WHAT REPLACES IT — compression, in every cut:** mean absolute move, D−2 vs far, runs **2.04/3.90 (p=0.018)**, **1.61/3.45 (p=0.029, 2010+)**, **1.75/4.03 (p=0.024, 2015+)** and **2.43/6.96 (p=0.045, 2023+)**; sd 3.16 vs 5.50; ≥8bp moves on **7% (2/27)** of D−2 days vs **15% (30/200)** far, and 14% (1/7) vs 37% (10/27) in 2023+. **And the pin is the SESSION's, not the auction's:** non-auction D−2 sessions run mean absolute move **2.74 vs 3.59** (p=0.019, n=129 vs 4,200), and land inside 4bp on 84% vs 71%; blackout for this meeting opens 2027-01-16. **Demand is fine in the slot:** b/c 2.725/2.691 (2000+), 2.655/2.626 ($69B era, n=6/16); dealer 10.69%/11.94%. **2026-01-26 is the sharpest precedent** — cover 2.75 (3rd of 29 in the era), dealer 7.3% (2nd-lowest of 29), a strong auction that moved only −4bp. **JANUARY TILT, graded weak on purpose:** Jan-D−2 −2.88bp (n=8, t=−2.28, 7/8 ≤0) vs other-month D−2 0.00bp (n=19), perm p=0.027 — but one of six month-cuts (only 01/04/06/07/09/10 contain any), Bonferroni p ≈ 0.16, all-January vs all-other p = 0.88, no mechanism found; robust to dropping 2025's −10 (−1.86, t=−2.17). **TWO NARRATIVES KILLED:** the block "unusually" straddling the FOMC (27 of 211 7Y auctions since 2009 sold at decision+1, nine of them Januaries incl. 2026-01-29 — it is the norm, and the 01-21 announcement ledger already measured the straddle as a demand null), and D−2 as a weekday effect (**25 of 27** D−2 auctions were Mondays, so the two are the same variable on this record). **No forecast value for the meeting:** decision-day 2Y after a D−2 auction is +0.59bp (t=0.64, n=27), and the decision day is louder in 17 of 27 pairs. **Macro.** Par curve 2026-09-08: 3M 3.94, **2Y 4.39** (its 2026 high; year range 3.38–4.39), 5Y 4.57, 10Y 4.80, 30Y 5.25. **Volatility:** VIX **15.72** (09-08 close, CBOE `VIX_History.csv`). **Peers:** `symbols: []`, none applicable. **Geopolitical:** nothing new touching this tenor. **Adjacency: 14 tracked events within 5 days, and 01-25 is NOT clean** — `norway-gpfg-bond-expert-group-2027-01-25` shares the day, and the 13/26-week bills price at 11:30am ET. **NO new proposals filed, and the reason is recorded rather than papered over:** every dated coupon in the corridor is already proposed by the 01-14/01-21 announcement lanes (20Y 01-20, 5Y 01-26, FRN 01-27, 7Y 01-28) and this sweep does not compete; the three genuine gaps it found — Q4-2026 GDP advance, December PCE and the February 2027 refunding, all conventionally in this corridor — **could not be primary-sourced today**: BEA's published release schedule stops at **2026-12-23**, `bls.gov` returned **403** twice (recorded in `probe-ref.blocked`), and Treasury's tentative schedule ends **2027-02-04**, before the refunding coupons. Inventing those dates from a rule of thumb is exactly what this lane may not do. **Forward tests registered: FT-treasury-2y-note-2027-01-25-1** (absolute move ≤4bp; null pass rates stated up front at 89% D−2 / 86% D−2-2023+ vs **30%** far-2023+) and **FT-treasury-2y-note-2027-01-25-2** (move ≤0bp, the January tilt, low confidence). | — (stance set) | 2026-09-30 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-2y-note-2027-01-25.json` (`status:
"estimate"`) in the same PR — this sweep's own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
