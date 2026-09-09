# Treasury Quarterly Refunding Announcement (May 2027) — treasury-refunding-2027-05-05

**Kind:** macro-print · **Date:** 2027-05-05 (estimate, EST: derived from the announcement-date record in Treasury's own auction API — no primary names a 2027 refunding date yet) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.37,"daysBand":"medium:31+","adjacentIds":["russell-style-month-end-capping-effective-2027-04-30","tic-annual-survey-final-2027-04-30","treasury-borrowing-estimates-2027-05-03"],"screenStreak":0,"blocked":[{"url":"https://home.treasury.gov/system/files/221/QuarterlyRefundingStatement.pdf","status":"000","at":"2026-09-09"},{"url":"https://home.treasury.gov/news/press-releases?title=Quarterly+Refunding+Statement","status":"200-EMPTY-JS","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** Stand aside — and for this edition the interesting question is the **date**, not the
price. The sibling [`treasury-refunding-2026-11-04`](treasury-refunding-2026-11-04.md) found that a
refunding announcement is a measured non-event once its FOMC collisions are stripped out; this
session **replicated that independently on a widened window** (16 editions since 2022-11, half of
them FOMC decision days): clean subset TLT **4/8 up at −0.037%** (permutation p=**0.899**) against a
50.1%/+0.003% baseline, while the FOMC subset runs **6/8 up at +0.715%** (p=**0.030**). Read naively
across all 16, IEF looks significant at p=**0.020** and ^TNX at p=**0.040** — the confound is the
whole signal. So everything turns on which Wednesday this lands on, because the only alternative
candidate, **2027-04-28, IS an FOMC decision day** (federalreserve.gov's 2027 panel, fetched direct
today: *April 27-28*). That question is now settled from a **primary, machine-readable source**.
Treasury's own auction API carries an `announcemt_date` on every refunding security; across all 16
editions the announcement is the first Wednesday of the refunding month whenever that Wednesday
falls on the **1st–5th — 9 for 9, no exception** — and is not when it falls on the 7th (0/3),
splitting when it falls on the 6th (1/3). **The first Wednesday of May 2027 is the 5th**, inside the
9-for-9 band. So the base case is a clean, non-FOMC, measured-non-event session. Two things this
session newly measured and both are refusals: the **T-2 borrowing-estimates Monday is also nil**
(TLT clean 4/8, +0.056%, p=0.870; ^TNX p=0.981), and the **May-edition "seasonality" is an artifact**
— IEF's eye-catching 4/4 at +0.426% is half FOMC days, leaving a clean May n of 2. All of this is
`estimate`-dated and none of it licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-238) | Stand aside | High | 238 days out on an `estimate`-dated announcement whose content does not exist yet; the sizes it will set were last re-affirmed 2026-08-05 and nothing has moved them. | Treasury publishing a 2027 refunding calendar, or an off-cycle statement changing coupon sizes or the "at least" guidance, before **2026-09-30** (this event's next scheduled check) |
| This week | Stand aside | High | Nothing this week keys off a May 2027 date; the near tape belongs to the September macro block, not to a 2027 supply announcement. | A dated Treasury announcement inside the 09-09→09-15 week that moves issuance *policy* rather than operation size |
| This month | Stand aside | High | The one thing that could move this ledger in September is a Treasury schedule publication reaching 2027, and Treasury has never published a refunding date more than one quarter ahead on this record. | home.treasury.gov naming any 2027 refunding date before **2026-09-30** — which would settle the date question outright and is a promotion, not a threat |
| This quarter | Stand aside on this event; **read 2026-11-04 as the leading indicator** | Medium | The Nov 2026 refunding (56 days out, the sibling ledger's event) is the live venue for the guidance change dealers expect ahead of a 2027 coupon increase. Whatever it does to *"at least the next several quarters"* resets the base rate this ledger inherits — and it is a free out-of-sample read on the same non-event finding. | The **2026-11-04** statement dropping or qualifying "at least the next several quarters", or moving any of $58B/$42B/$25B — either voids the 10-quarter base rate below and this stance gets re-derived rather than patched |

**Signals & conditions** — the buy/sell/hold triggers:

- **The date is the trigger, and it resolves early.** The **2027-02-03** statement (proposed this
  PR) is where Treasury names its own next refunding. It naming 2027-05-05 promotes this entry to
  `TSY:`/`confirmed`; it naming 2027-04-28 puts this edition on an FOMC day and the clean-subset
  finding no longer governs.
- **Do not read the all-16 numbers.** IEF p=0.020 and ^TNX p=0.040 across all editions are the
  FOMC riding along. The clean subset (p=0.899 / 0.703 / 0.731 for TLT / ^TNX / SPY) is the honest one.
- **The sentence to read on the day:** does *"at least the next several quarters"* survive in the
  nominal-coupon/FRN forward guidance? Retained → the non-event case holds, no action.
- **Any of $58B (3y) / $42B (10y) / $25B (30y) changing** → ten consecutive editions of stability
  broke; this ledger's base rate is void and the stance gets re-derived, not patched.
- **The T-2 Monday is not a second bite.** Measured nil (p=0.87–0.98); do not treat the borrowing
  estimates as an independent tradeable print.
- **Watch (dated):** Nov 2026 refunding **2026-11-04** · Feb 2027 refunding **2027-02-03** (est,
  proposed this PR) · April FOMC **2027-04-28** (`FED:`-corroborated today) · TIC annual final
  **2027-04-30** · borrowing estimates **2027-05-03** (est) · **this, 2027-05-05 08:30 ET**.

## Initial research

**The question, plainly:** for the May 2027 quarterly refunding — is 2027-05-05 actually the right
date, does the announcement have a measurable reaction function once known confounds are removed,
and does anything about *this* edition make it worth more than a calendar slot?

**One-line verdict:** the date is right on a primary-anchored rule that is 9-for-9 in its own band,
and that matters precisely because the alternative date is an FOMC day and the FOMC is where this
event's entire apparent signal lives — strip it out and the announcement, the Monday before it, and
the "May seasonality" are all measured non-events.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode),
plus two first-party measurements built this session. Instrument caches busted before the run per
the cache-discipline rule.

- **The date record — primary and machine-readable.** `api.fiscaldata.treasury.gov/services/api/
  fiscal_service/v1/accounting/od/auctions_query`, fetched direct 2026-09-09 (HTTP 200), for every
  non-reopened 3-Year, 10-Year and 30-Year issue settling on or about the 15th of Feb/May/Aug/Nov
  since 2022-11. Each record carries an `announcemt_date` field, which **is** the refunding
  announcement date; all three tenors agree on all 16 editions. This is a stronger basis than any
  prior ledger in this series has had — the sibling reached its dates through search after four
  home.treasury.gov timeouts.
- **The reaction function.** Yahoo **dividend-adjusted** daily closes (`scripts/research/
  market-data.mjs` → `bars()`), instruments **TLT · IEF · ^TNX · SPY · QQQ · ^VIX**, window
  **2022-11-01 → 2026-09-08, n=964 sessions**. Event set: the **16** announcement dates above.
  Two-sided permutation test, 200,000 iterations, against random same-size draws from the same
  session pool. Placebo columns T−3 … T+3.
- **FOMC dates:** `federalreserve.gov/monetarypolicy/fomccalendars.htm`, fetched direct 2026-09-09
  (HTTP 200, 164,831 bytes) — a primary this series has previously taken on trust.

**Primary-source limit, stated up front.** The refunding *policy statement* itself was not fetched:
`home.treasury.gov/system/files/221/QuarterlyRefundingStatement.pdf` returned no response at all
(curl status 000), and the press-release search listing returned HTTP 200 but renders its results in
JavaScript, so the static body carries none. Both are recorded in `probe-ref.blocked`. Every
quotation of the *guidance sentence* below is therefore carried from the sibling ledger and remains
search-sourced — **but the coupon sizes it governs are now primary**, read straight off the auction
API's `offering_amt`, which is the part that actually needed verifying.

### Conviction legs, tested

**1. The date rule is not "unreliable" — it is reliable inside a band, and this event is inside it —
SUPPORTED, and this refines the sibling.** [`treasury-refunding-2026-11-04`](treasury-refunding-2026-11-04.md)
leg 2 recorded that the "first Wednesday of Feb/May/Aug/Nov" convention "is not reliable," citing
five editions that fell on the *last* Wednesday of the prior month. That is correct but too blunt to
use. Measured against all 16 primary announcement dates, sorted by the day-of-month the first
Wednesday happens to land on:

| First Wednesday falls on | Editions | Announcement was that Wednesday |
|---|---|---|
| the 1st–5th | 9 | **9 of 9** |
| the 6th | 3 | 1 of 3 (2026-05-06 yes; 2024-11-06 and 2025-08-06 moved back) |
| the 7th | 3 | **0 of 3** (all moved to the last Wednesday of the prior month) |

The convention is a settlement constraint, not a naming convention: the 3y/10y/30y refunding
settles on the 15th (or the next business day), the three auctions run Mon–Thu of the week before,
and the announcement is the Wednesday of the week before *that*. When the first Wednesday lands late
in the month, that chain no longer fits and the whole complex slides into the prior month. **The
first Wednesday of May 2027 is the 5th** — day-of-month 5, the top band, 9 for 9. The rule also puts
the other three 2027 editions safely in-band (Feb 3rd, Aug 4th, Nov 3rd), so 2027 is a year in which
the convention holds everywhere. Registered as FT-1 rather than asserted, with a free checkpoint in
February.

**2. That date question is load-bearing, not pedantry — SUPPORTED.** The only plausible alternative
for a May 2027 refunding is the last Wednesday of April, **2027-04-28**. The Fed's own 2027 panel,
fetched direct today, reads *January 26-27 · March 16-17\* · **April 27-28** · June 8-9\* · July
27-28 · September 14-15\* · October 26-27 · December 7-8\**. So the tail case for this event's date
is **exactly an FOMC decision day** — and leg 3 shows that is where the entire measured effect of a
refunding announcement lives. Two dates a week apart, one a measured non-event and one a session
with a p=0.030 bond bid attached. Incidentally, the Fed panel corroborates this repo's `fomc-2027-*`
estimates from a `FED:` primary, with one wrinkle noted for their owners in the ledger row below.

**3. The non-event finding replicates, on a wider window — SUPPORTED.** Re-measured independently,
window widened to 2022-11-01 (which adds the November 2022 edition — itself an FOMC day, so the
split becomes an even 8/8):

| Instrument | All 16 | Clean (8, no FOMC) | FOMC-day (8) | Unconditional |
|---|---|---|---|---|
| TLT | 10/16 up, +0.339% (p=0.145) | **4/8 up, −0.037%** (p=**0.899**) | 6/8 up, **+0.715%** (p=**0.030**) | 50.1% up, +0.003% |
| IEF | 10/16 up, +0.277% (p=**0.020**) | 4/8 up, +0.057% (p=0.779) | 6/8 up, **+0.497%** (p=**0.003**) | 50.3% up, +0.013% |
| ^TNX | 6/16 up, −0.730% (p=**0.040**) | **4/8 up, −0.166%** (p=0.703) | 2/8 up, **−1.293%** (p=**0.013**) | 50.2% up, +0.029% |
| SPY | 7/16 up, −0.107% (p=0.405) | **4/8 up, −0.024%** (p=0.731) | 3/8 up, −0.190% (p=0.383) | 55.8% up, +0.081% |
| QQQ | 7/16 up, −0.139% (p=0.426) | 3/8 up, −0.304% (p=0.341) | 4/8 up, +0.025% (p=0.845) | 56.2% up, +0.110% |

The sibling's clean-subset TLT figure (4/8, −0.037%, p=0.905) reproduces to the third decimal on a
different window (p=0.899 here — permutation noise, same conclusion). Clean placebos stay flat
across T−3…T+3 (TLT −0.141 / +0.056 / +0.180 / **−0.037** / −0.224 / −0.090 / −0.224). **The line
worth carrying forward is the naive one:** across all 16 editions IEF reads p=0.020 and ^TNX p=0.040
— apparently significant, entirely an artifact of eight FOMC collisions. An analyst who never
partitioned this event set would have shipped a false finding on the standard 0.05 threshold.

**4. The T-2 borrowing-estimates Monday is also a non-event — SUPPORTED, and this is new.** The
sibling stated the structure — *"the quantity surprise lives on Monday, the composition and guidance
surprise on Wednesday"* — but measured only Wednesday. Measured here, on the session two trading
days before each announcement (n=15; the November 2022 edition's T−2 falls outside the window):

| Instrument | T-2 Monday, all 15 | T-2 Monday, clean subset (8) |
|---|---|---|
| TLT | 7/15 up, −0.091% (p=0.691) | 4/8 up, +0.056% (p=**0.870**) |
| ^TNX | 8/15 up, +0.189% (p=0.669) | 4/8 up, +0.041% (p=**0.981**) |
| SPY | 10/15 up, +0.175% (p=0.688) | 6/8 up, +0.201% (p=0.699) |

So the aggregate *quantity* release is no more tradeable than the composition statement. This is a
finding about the whole series, not just this edition, and it is why the Feb 2027 borrowing-estimates
Monday was deliberately **not** proposed alongside the Feb refunding: it would be calendar
completeness with no informational content.

**5. "May editions behave differently" is an artifact — REFUTED, and it is the same artifact as leg 3.**
Isolating the four May editions (2023-05-03, 2024-05-01, 2025-04-30, 2026-05-06) produces an
eye-catching IEF result: **4/4 up, +0.426%, p=0.069**, with ^TNX 1/4 at −1.063%. It does not survive
one question — **two of the four are FOMC decision days** (2023-05-03 and 2024-05-01), leaving a
clean May subset of **n=2**. TLT's own May number is already weaker (3/4, +0.312%, p=0.493) and SPY
and QQQ show 2/4 and 1/4. Recorded as a refutation rather than omitted, because it is the exact
shape of the trap leg 3 identified, found again in a smaller sample: **partition first, then look.**

**6. The sizes are stable, and the record is one edition longer than the sibling recorded — SUPPORTED,
minor correction.** Read straight off the auction API's `offering_amt`, the refunding package has
been **$58B (3y) / $42B (10y) / $25B (30y) for ten consecutive editions**, from the May 2024
refunding (announced 2024-05-01) through August 2026. The sibling recorded "nine straight quarters
(Aug 2024 → Aug 2026)"; the primary shows the full triple was already in place one edition earlier —
the 3-year note stepped $54B → $58B at the 2024-05-01 announcement, not at 2024-07-31. The
ramp before that is visible and steep: 3y $40B → $42B → $48B → $54B → $58B and 30y $21B → $23B →
$24B → $25B across 2023. Noted here for the next session rather than edited into the sibling (rows
are append-only, and one file per owner). If nothing changes, 2027-05-05 would be the **thirteenth**
consecutive edition at these sizes.

**7. Tracked-name sensitivity — carried, and deliberately deflated.** `symbols: []` — market-wide,
transmitted through the rate-duration channel, ranked **CRWV** (debt-financed datacenter build; the
long end hits both its discount rate and its literal cost of capital), then the high-multiple semis
**NVDA / AVGO / MRVL**, then **MSFT / GOOG / META**, least **AAPL / AMZN**. This is the standing
house ranking carried from the sibling rates ledgers, not re-derived. Leg 3 says the channel does not
open on this date at all (SPY clean p=0.731, QQQ nothing), so the ranking is what to consult *if* the
guidance sentence moves — never a reason to position for the date.

### What the conditions support

Nothing directional, at 238 days out on an `estimate`-dated event. No house playbook is macro-keyed
(S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed). What travels is a sharpening of the discipline the
sibling banked. That ledger's lesson was *compute an event's reaction function against its collision
set, not its date list*. This session found the same confound twice more in the same series — once in
a "May seasonality" that is half FOMC days, once in a naive all-16 read that clears p<0.05 on two
instruments — and added a second, cheaper rule beside it: **when an event's date is derived rather
than published, check what the alternative date collides with before trusting the base rate.** Here
the two candidate Wednesdays sit in opposite subsets, which is the difference between a non-event and
the one session in this series with a measurable bond bid.

### Honest limits

- **No 2027 refunding date exists from any primary.** The entry is `estimate` and is not promoted.
  The rule is 9-for-9 in its band across 16 editions — that is a strong prior, not a schedule.
- **The policy statement was not fetched.** The Treasury PDF path returned curl status 000 and the
  press-release listing is JS-rendered; both are in `probe-ref.blocked`. The *"at least the next
  several quarters"* wording is carried from the sibling and stays search-sourced. The sizes it
  governs are primary.
- **n=8 on the clean subset means "not distinguishable," never "proven zero."** With TLT's daily σ
  over this window, eight observations have no power against a sub-1% mean effect. The claim is that
  no *large* refunding-day effect exists.
- **Close-to-close only.** The statement lands 08:30 ET, an hour before the equity open; an intraday
  spike that faded by the close is invisible here, and TLT/IEF do not trade the 08:30 window at all,
  so part of the cash-Treasury reaction is absorbed before they open.
- **The FOMC-collision set for 2022–2025 was assembled from published calendars, not re-fetched
  meeting-by-meeting.** Only the 2027 panel was fetched primary this session.
- **Everything about this edition's *content* is a 238-day extrapolation.** The statement does not
  exist; there is no consensus, no whisper, no implied move. Legs 1–6 are about the event's
  structure and its base rates, which is all that is knowable today, and that is the honest scope.

## Stance & kill switches

**Stance (`estimate`-dated — no date-keyed action is licensed regardless of what follows).** Stand
aside on 2027-05-05 as a price event, on a refusal that is measured rather than assumed: on the eight
refunding announcements since 2022-11 that were not also FOMC decision days, TLT closed 4/8 up at a
mean −0.037% (permutation p=0.899) and SPY 4/8 at −0.024% (p=0.731), both indistinguishable from
ordinary sessions — and the T-2 borrowing-estimates Monday is equally flat (p=0.87–0.98), so there
is no second bite. **The live question on this event is its date, and it is a promotion question,
not a risk one.** The base case is 2027-05-05: Treasury's own auction-API record puts the
announcement on the refunding month's first Wednesday 9 times out of 9 when that Wednesday falls on
the 1st–5th, and May 2027's falls on the 5th. The tail case, 2027-04-28, is the April FOMC decision
day (`FED:` primary, fetched 2026-09-09) — the one subset where this event does have a measured
reaction (TLT 6/8 up, +0.715%, p=0.030) — so a date slip would not merely move a calendar row, it
would move this event into the other regime and void the stance. Base case for content
(**estimate-labelled**, and carried dealer consensus rather than this doc's forecast): sizes
unchanged at $58B/$42B/$25B for a thirteenth consecutive edition and the *"at least the next several
quarters"* phrase retained. **Read 2026-11-04 first** — it is the nearer, better-instrumented venue
for the guidance change dealers expect ahead of a 2027 coupon increase, and whatever it does resets
what this ledger inherits.

**Kill switches:**

- **Treasury naming any May 2027 refunding date other than 2027-05-05** — most likely in the
  2027-02-03 statement. If the named date is **2027-04-28**, this event moves into the FOMC-collision
  subset and the stand-aside is re-derived from scratch, not patched.
- **The 2027-02-03 refunding not occurring on 2027-02-03** — the day-of-month rule's first
  out-of-sample test fails; leg 1's 9-for-9 band is no longer a usable prior for the May edition.
- **"At least the next several quarters" dropped or qualified on 2026-11-04 or 2027-02-03** — the
  guidance-change case fires early; the stand-aside on *this* print still holds (it is
  `estimate`-dated), but leg 7's rate-duration ranking becomes live and this stance is re-argued.
- **Any of $58B / $42B / $25B changing at any refunding before 2027-05-05** — ten editions of
  stability broke; leg 6's base rate is void.
- **A clean-subset refunding day producing a TLT move above the 90th percentile of its own
  distribution with no guidance change** — the "language is the only channel" read dies and the
  non-event finding needs re-argument.
- **home.treasury.gov's policy statement becoming directly fetchable** — resolves the gated-primary
  limit; re-verify the exact guidance wording against the primary and clear the `blocked` entries.

Forward tests registered in
[`forward-tests/treasury-refunding-2027-05-05.md`](../forward-tests/treasury-refunding-2027-05-05.md):
**FT-treasury-refunding-2027-05-05-1** (the date rule, with a free February checkpoint),
**-2** (the T-2 Monday non-event, out-of-sample), and **-3** (the coupon-size package survives).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-238 | Initial research banked (above); canonical `src/domain/market-events/treasury-refunding-2027-05-05.json` written this PR from the single prior proposal (`.from-tic-annual-survey-final-2027-04-30`), whose finding — the event, its date derivation and its corridor position — is carried and upgraded, not discarded. **Date:** stays `estimate`; no primary names a 2027 refunding date. **Session's main output: the date basis moved from a loose convention to a primary, measured rule, and the non-event finding replicated.** (1) `api.fiscaldata.treasury.gov` auctions_query fetched direct (HTTP 200) — `announcemt_date` on every non-reopened mid-quarter 3y/10y/30y since 2022-11 gives all **16** announcement dates from a primary, all three tenors agreeing. Sorted by the day-of-month of the month's first Wednesday: **1st–5th → 9 of 9**, 6th → 1 of 3, 7th → **0 of 3**. May 2027's first Wednesday is the **5th** → in-band. This **refines the sibling's leg 2** ("the first-Wednesday rule is not reliable") rather than contradicting it — it is unreliable only at the 6th/7th, where the settlement chain no longer fits. → **FT-1**. (2) The date is load-bearing: the alternative candidate **2027-04-28 is the April FOMC decision day** — `federalreserve.gov/monetarypolicy/fomccalendars.htm` fetched direct (HTTP 200, 164,831 bytes), 2027 panel = Jan 26-27 · Mar 16-17\* · **Apr 27-28** · Jun 8-9\* · Jul 27-28 · Sep 14-15\* · Oct 26-27 · Dec 7-8\*. (3) Reaction function re-measured independently, window **2022-11-01→2026-09-08, n=964**, 200k-iteration permutation: 16 editions split **8 FOMC / 8 clean**. Clean TLT **4/8, −0.037%, p=0.899** (sibling: p=0.905 — replicates); FOMC TLT **6/8, +0.715%, p=0.030**; clean ^TNX 4/8 −0.166% p=0.703, SPY 4/8 −0.024% p=0.731, QQQ 3/8 −0.304%. **Naive all-16 reads IEF p=0.020 and ^TNX p=0.040** — significant on the standard threshold, entirely the confound. Clean placebos flat T−3…T+3. (4) **New:** the **T-2 borrowing-estimates Monday is also nil** — TLT clean 4/8 +0.056% **p=0.870**, ^TNX 4/8 +0.041% **p=0.981**, SPY 6/8 +0.201% p=0.699 (n=15 all / 8 clean). The sibling named the Monday/Wednesday split but never measured Monday. (5) **New, refuted:** "May editions differ" — IEF 4/4 up +0.426% p=0.069 looks real until you note **2 of the 4 are FOMC days**, leaving clean n=2; TLT 3/4 +0.312% p=0.493. Same artifact as (3), found again in miniature. (6) **Minor correction from primary:** `offering_amt` shows $58B/$42B/$25B intact for **ten** consecutive editions (from the 2024-05-01 announcement), not the nine the sibling recorded — the 3y stepped $54B→$58B at 2024-05-01. → **FT-3**. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none bearing on a D-238 supply announcement; nothing carried. **Volatility regime:** ^VIX **16.37** (2026-09-09), ^TNX **4.812** (2026-09-09), TLT **82.20**, SPY **765.96** (2026-09-08 closes) — baseline set, no prior row to diff. **Geopolitical/policy:** none dated into the 2027-05 corridor today. **Event tape:** no consensus exists at D-238; the statement's content does not yet exist. **New dated adjacency found → proposed in this PR:** **`treasury-refunding-2027-02-03`** (`EST:`, medium) — the calendar tracks the Nov 2026 and May 2027 editions with the one between them missing entirely, and that edition is the informational hinge: Treasury names its own next refunding date in each statement, so 2027-02-03 is what promotes this event from derived to `TSY:`-named, and it is FT-1's free checkpoint. **Noted but NOT proposed:** the Feb 2027 borrowing-estimates Monday (2027-02-01, 15:00 ET) — finding (4) measured that session to be a non-event, so filing it would be completeness without content. **Noted for another owner, not edited (one file per owner):** this repo carries **both** `fomc-2027-10-26` and `fomc-2027-10-27`, but the Fed's own panel gives that meeting as October 26-27 — one meeting, decision day the 27th. **Blocked fetches recorded in probe-ref:** the refunding policy-statement PDF (curl status 000) and the press-release search listing (HTTP 200 but JS-rendered, empty static body), so the guidance-sentence wording stays carried and search-sourced while the sizes it governs are primary. | — (stance set) | 2026-09-30 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-refunding-2027-05-05.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
