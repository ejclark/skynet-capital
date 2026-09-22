# Treasury Quarterly Refunding Announcement (Feb 2027) — treasury-refunding-2027-02-03

**Kind:** macro-print · **Date:** 2027-02-03 (estimate, EST: derived from the announcement-date record in Treasury's own auction API — Treasury publishes one quarter ahead and names no 2027 date yet) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.14,"daysBand":"medium:31+","adjacentIds":["japan-cpi-tokyo-flash-2027-01-29","boj-summary-of-opinions-2027-02-01","ism-manufacturing-2027-02-01","ism-services-2027-02-03","jobs-2027-02-05"],"screenStreak":0,"blocked":[{"url":"https://home.treasury.gov/system/files/221/QuarterlyRefundingStatement.pdf","status":"404","at":"2026-09-09"},{"url":"https://www.bls.gov/schedule/news_release/2027_sched.htm","status":"404","at":"2026-09-09"},{"url":"https://www.bls.gov/ces/notices/2026/2025-benchmark-revision.htm","status":"404","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** Stand aside — and this edition's own month is the trap. Isolate the four February
refunding announcements since 2022-11 and you get the most significant-looking number in this whole
series: ^TNX **1/4 up, −2.000%, p=0.010**, IEF 3/4 at +0.529%, p=0.022. **Two of those four are FOMC
decision days**, which leaves a clean February n of 2 and nothing under p=0.267. That is the sibling
[`treasury-refunding-2027-05-05`](treasury-refunding-2027-05-05.md)'s May artifact found a third
time, now inside this ledger's own month. Partitioned honestly, the eight non-FOMC editions are a
measured non-event that replicates for a third time (TLT **4/8 up, −0.037%, p=0.908**). Two things
are new here and both narrow the case rather than widen it. **The geometry of this date is nil:**
2027-02-03 sits seven days after the 2027-01-26/27 FOMC, and the six clean editions that fell exactly
one week after a decision measure **TLT 3/6, +0.036%, p=0.922 · SPY 3/6, +0.011%, p=0.976** — the
FOMC-day bid does not bleed into the following week. **And this session shares its tape:** the
announcement lands on the same day as ISM services whenever the refunding month's first Wednesday is
its third business day, which is true of **all four 2027 editions**. The date itself is `estimate`
and resolves cheaply — Treasury names its next refunding one quarter ahead, so **2026-11-04, 56 days
out**, is where this entry gets a `TSY:` date. None of this licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-147) | Stand aside | High | 147 days out on an `estimate`-dated announcement whose content does not exist; the sizes it will set were last re-affirmed 2026-08-05 and nothing has moved them. | Treasury publishing any 2027 refunding date, or an off-cycle statement changing coupon sizes or the "at least" guidance, before **2026-09-30** (this event's next scheduled check) |
| This week | Stand aside | High | Nothing in the 09-09→09-15 week keys off a February 2027 supply announcement; the near tape belongs to the September macro block. | A dated Treasury announcement inside this week that moves issuance *policy* rather than operation size |
| This month | Stand aside | High | The only September development that reaches this ledger is a Treasury schedule publication running into 2027, and Treasury has never published a refunding date more than one quarter ahead on this 16-edition record. | home.treasury.gov naming any February 2027 refunding date before **2026-09-30** — a promotion, not a threat |
| This quarter | Stand aside on the print; **treat 2026-11-04 as this ledger's date checkpoint** | Medium | The Nov 2026 refunding is 56 days out and by this series' own convention names its successor, so this entry's `estimate` label resolves there rather than at the event. It is also the live venue for the guidance change dealers expect ahead of a 2027 coupon increase. | The **2026-11-04** statement naming a February 2027 date other than **2027-02-03**, naming none at all, or dropping/qualifying "at least the next several quarters" — any of the three re-derives this stance rather than patching it |

**Signals & conditions** — the buy/sell/hold triggers:

- **Do not read the February subset.** ^TNX p=0.010 and IEF p=0.022 across the four February
  editions are two FOMC collisions riding along; clean February n=2, all p≥0.267.
- **Do not read the all-16 numbers either.** IEF p=0.016 and ^TNX p=0.048 clear the standard
  threshold and are the same confound at larger n. The clean-8 subset is the honest one.
- **The date resolves at 2026-11-04, not here.** That statement naming 2027-02-03 promotes this
  entry to `TSY:`/`confirmed`; naming 2027-01-27 instead puts it on the January FOMC decision day.
- **Any bond move on 2027-02-03 is contested tape.** ISM services (high, 10:00 ET) is already on
  this calendar for the same session, 90 minutes after the 08:30 ET statement.
- **The sentence to read on the day:** does *"at least the next several quarters"* survive in the
  nominal-coupon/FRN forward guidance? Retained → the non-event case holds, no action.
- **Any of $58B (3y) / $42B (10y) / $25B (30y) changing** → ten editions of stability broke; this
  ledger's base rate is void and the stance gets re-derived, not patched.
- **Watch (dated):** Nov 2026 refunding **2026-11-04** · Jan 2027 FOMC **2027-01-26/27** (`FED:`) ·
  ISM manufacturing **2027-02-01** · **this, 2027-02-03 08:30 ET** · ISM services **2027-02-03**
  10:00 ET · jobs **2027-02-05** (est, proposed this PR) · May 2027 refunding **2027-05-05** (est).

## Initial research

**The question, plainly:** for the February 2027 quarterly refunding — is 2027-02-03 the right date,
does *this* edition behave differently from the series it belongs to, and does anything about its
position in the calendar make it worth more than a slot?

**One-line verdict:** the date is right on the same primary-anchored rule that governs the sibling
and it resolves 56 days from now rather than at the event, but the February subset that looks like
this edition's edge is two FOMC collisions in a sample of four — and once the confound is removed,
every partition that describes 2027-02-03 (clean, in-band, one week post-FOMC, ISM-colliding)
measures as an ordinary session.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode),
plus three first-party measurements built this session. Instrument caches busted before the run per
the cache-discipline rule.

- **The date record — primary and machine-readable.** `api.fiscaldata.treasury.gov/services/api/
  fiscal_service/v1/accounting/od/auctions_query`, fetched direct 2026-09-09 (HTTP 200) for every
  3-Year, 10-Year and 30-Year issue with an auction date since 2022-10-01. Refunding editions were
  isolated mechanically — maturity on the **15th of Feb/May/Aug/Nov** with `original_issue_date`
  null (a new issue, not a reopening) — giving **16 editions**, all three tenors agreeing on every
  `announcemt_date`. This reproduces the sibling's set exactly and independently.
- **The reaction function.** Yahoo **dividend-adjusted** daily closes (`scripts/research/
  market-data.mjs` → `bars()`), instruments **TLT · IEF · ^TNX · SPY · QQQ · ^VIX**, window
  **2022-11-01 → 2026-09-08, n=965 sessions**. Two-sided permutation test, 200,000 iterations,
  against random same-size draws from the same session pool. Placebo columns T−3 … T+3.
- **FOMC dates:** `federalreserve.gov/monetarypolicy/fomccalendars.htm`, fetched direct 2026-09-09
  (HTTP 200, 164,831 bytes) — the 2022–2027 panels read off one primary in one fetch.
- **Treasury's own forward schedule:** `home.treasury.gov/policy-issues/financing-the-government/
  quarterly-refunding/most-recent-quarterly-refunding-documents`, fetched direct 2026-09-09
  (HTTP 200, 73,519 bytes).

**Primary-source limit, stated up front.** The refunding *policy statement* itself was again not
fetched: `home.treasury.gov/system/files/221/QuarterlyRefundingStatement.pdf` returned **HTTP 404**
this session (the sibling recorded curl status 000 on the same path a few hours earlier — a
different failure, the same gap), and the documents page carries no `href` to the statement at all
because its links are JS-rendered. Recorded in `probe-ref.blocked`. Every quotation of the
*guidance sentence* below is therefore carried from the sibling ledgers and stays search-sourced;
the coupon sizes it governs are primary, read off the auction API's `offering_amt`.

### Conviction legs, tested

**1. 2027-02-03 is in-band on the primary-anchored rule — SUPPORTED, replicating the sibling
independently.** Re-derived from the API rather than carried: sorted by the day-of-month on which
the refunding month's first Wednesday falls, the announcement **is** that Wednesday 9 times out of 9
when it lands on the 1st–5th, 1 of 3 on the 6th, and **0 of 3** on the 7th (those three slid to the
last Wednesday of the prior month, because the settlement chain — 3y/10y/30y settle the 15th,
auctions run Mon–Thu the week before, announcement the Wednesday before that — no longer fits).
**February 2027 begins on a Monday, so its first Wednesday is the 3rd** — day-of-month 3, the top
band. The tail case is the last Wednesday of January 2027, **2027-01-27**.

**2. The February edition is structurally the most FOMC-exposed of the four, by two routes —
SUPPORTED, and this is new.** Both of this series' February collisions came from the *January* FOMC,
but by different mechanisms. **2023-02-01** was in-band (first Wednesday, day-of-month 1) and the
Jan 31–Feb 1 2023 meeting simply ran into February. **2024-01-31** was out-of-band (February 2024's
first Wednesday was the 7th) and slid back onto the Jan 30–31 2024 decision day. The late-January
FOMC and the late-January slide-back target the same week, which is why 2 of 4 February editions
collide against 6 of 12 elsewhere. For 2027 the in-band route is closed — the January FOMC is the
**26th–27th** and the announcement is the 3rd — so the collision risk lives entirely in the date
slipping, and a slip would land it on **2027-01-27, the decision day itself**. Same shape as the
sibling's 2027-04-28 tail case, arrived at from the opposite direction.

**3. The "February editions behave differently" read is an artifact — REFUTED, and it is the most
seductive number in the study.** Isolating the four February announcements (2023-02-01, 2024-01-31,
2025-02-05, 2026-02-04):

| Instrument | February, all 4 | February, clean (2) |
|---|---|---|
| ^TNX | 1/4 up, **−2.000%** (p=**0.010**) | 1/2 up, −0.997% (p=0.317) |
| IEF | 3/4 up, **+0.529%** (p=**0.022**) | 1/2 up, +0.280% (p=0.361) |
| TLT | 3/4 up, +0.895% (p=0.054) | 1/2 up, +0.699% (p=0.267) |
| SPY | 2/4 up, −0.162% (p=0.710) | 1/2 up, −0.039% (p=0.946) |

p=0.010 on the 10-year yield is the strongest single result anywhere in this event's record, and it
is **2023-02-01 and 2024-01-31 — both FOMC decision days**. This is the third independent instance
of one confound: the sibling found it in a "May seasonality" (clean n=2) and in a naive all-editions
read; it recurs here in the month this ledger is about. **Partition first, then look** is now a
measured rule of this series, not a caution.

**4. The FOMC-day bid does not bleed into the following week — SUPPORTED, and this is exactly
2027-02-03's geometry.** This edition sits **seven days** after the 2027-01-26/27 FOMC. That is not
an unusual position: of the 8 clean editions, **6 fall exactly 7 days after a decision** (the other
two at 42 days), so the question is directly measurable rather than hypothetical:

| Instrument | Clean & ≤10d post-FOMC (6) | Clean & >10d post-FOMC (2) | FOMC-day (8) |
|---|---|---|---|
| TLT | 3/6 up, +0.036% (p=**0.922**) | 1/2 up, −0.258% (p=0.677) | 6/8 up, **+0.715%** (p=**0.029**) |
| IEF | 3/6 up, +0.074% (p=0.683) | 1/2 up, +0.004% (p=0.989) | 6/8 up, **+0.497%** (p=**0.003**) |
| ^TNX | 3/6 up, −0.206% (p=0.725) | 1/2 up, −0.046% (p=0.963) | 2/8 up, **−1.293%** (p=**0.015**) |
| SPY | 3/6 up, +0.011% (p=**0.976**) | 1/2 up, −0.131% (p=0.821) | 3/8 up, −0.190% (p=0.556) |

A p=0.003 bond bid on the decision day is gone one week later. So "this refunding follows an FOMC
closely" is not a reason to expect anything from it.

**5. The non-event finding replicates a third time — SUPPORTED.** Clean 8 (no FOMC collision):
TLT **4/8 up, −0.037%, p=0.908**; IEF 4/8, +0.057%, p=0.718; ^TNX 4/8, −0.166%, p=0.747; SPY 4/8,
−0.025%, p=0.940; QQQ 3/8, −0.304%, p=0.500. Against `treasury-refunding-2026-11-04`'s p=0.905 and
the sibling's p=0.899 on TLT — three independent runs, same conclusion, permutation noise apart.
Clean placebos stay flat T−3…T+3 (TLT −0.141 / +0.056 / +0.180 / **−0.037** / −0.224 / −0.090 /
−0.223). And the naive all-16 read still clears the standard threshold on two instruments — IEF
**p=0.016**, ^TNX **p=0.048** — which is the whole warning restated at full sample.

**6. The ISM-services collision is a rule, and 2027 is a clean sweep — SUPPORTED, and this is the
session's second new finding.** [`treasury-refunding-2026-11-04`](treasury-refunding-2026-11-04.md)
observed that the refunding announcement and the ISM services release collide on some dates, and
caught one ledger mis-attributing a yield move because of it. That observation generalises exactly:
ISM services is the **third business day**; the in-band refunding announcement is the **first
Wednesday**; those are the same date precisely when the month starts on a Saturday, Sunday or
Monday. Measured across the 16 editions, **5 collide** (2023-05-03, 2025-02-05, 2025-11-05,
2026-02-04, 2026-08-05). **Every 2027 refunding month starts on a weekend or a Monday** — Feb 1 Mon,
May 1 Sat, Aug 1 Sun, Nov 1 Mon — so **all four 2027 editions collide**, beginning with this one.
The collision does not change the price result; it changes who can claim it:

| Clean subset, split by collision | TLT | ^TNX | SPY |
|---|---|---|---|
| With ISM services same day (4) | 2/4 up, +0.131% (p=0.768) | 2/4 up, −0.137% (p=0.848) | 2/4 up, +0.017% (p=0.969) |
| Without (4) | 2/4 up, −0.206% (p=0.648) | 2/4 up, −0.196% (p=0.783) | 2/4 up, −0.066% (p=0.880) |

Indistinguishable, and both nil. So the finding is an **attribution** finding: `ism-services-2027-02-03`
(high) is already on this calendar for the same session, and neither event has a measured claim on
that morning's bond move. Whichever ledger writes it up first will be wrong to.

**7. The promotion path is short, and it is this ledger's real live question — SUPPORTED.** Treasury
publishes exactly one quarter ahead. Its documents page, fetched direct today, reads *"DOCUMENTS
RELEASED at 8:30 AM Wednesday, august 5, 2026 … (The next release is scheduled for November 4 ,
2026)"* and stops there — no 2027 date exists from any primary, which is why this entry is
`estimate`. But the same convention means the **2026-11-04** statement names the February 2027 date.
That is **56 days out**, against the 147 days to the event itself and against the sibling's wait for
*this* statement to settle *its* date. The date question on this ledger is therefore cheap and
near-term, not a 147-day hold. Sizes read off the API's `offering_amt` are **$58B (3y) / $42B (10y) /
$25B (30y) for ten consecutive editions** since the 2024-05-01 announcement; if nothing changes,
2027-02-03 is the twelfth.

**8. Tracked-name sensitivity — carried, and deliberately deflated.** `symbols: []` — market-wide,
transmitted through the rate-duration channel, ranked **CRWV** (debt-financed datacenter build; the
long end hits both its discount rate and its literal cost of capital), then the high-multiple semis
**NVDA / AVGO / MRVL**, then **MSFT / GOOG / META**, least **AAPL / AMZN**. Standing house ranking
carried from the sibling rates ledgers, not re-derived. Legs 4–5 say the channel does not open on
this date, so the ranking is what to consult *if* the guidance sentence moves — never a reason to
position for the date.

### What the conditions support

Nothing directional, at 147 days out on an `estimate`-dated event. No house playbook is macro-keyed
(S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed). What travels is a third confirmation and one new
rule. The confirmation: the sibling's lesson — *compute an event's reaction function against its
collision set, not its date list* — held when a fresh analyst went looking for this edition's own
edge and found p=0.010 on the 10-year yield in a sample of four. The new rule is cheaper and
mechanical: **before trusting an event's subset, check whether the subset is defined by a date
convention that shares a mechanism with the confound.** February's date convention is anchored to
the last week of January, and so is the year's first FOMC; that is not coincidence, it is one
calendar constraint producing two events. The same reasoning found the ISM-services collision (two
different "first week of the month" conventions resolving to one session) and predicts it for all
four 2027 editions rather than noticing it after the fact.

### Honest limits

- **No 2027 refunding date exists from any primary.** The entry is `estimate` and is not promoted.
  The rule is 9-for-9 in its band across 16 editions — a strong prior, not a schedule.
- **The policy statement was not fetched** (HTTP 404 on the PDF path; the documents page's links are
  JS-rendered and carry no `href`). The *"at least the next several quarters"* wording is carried
  from the sibling ledgers and stays search-sourced. The sizes it governs are primary.
- **n=6 and n=2 on the sub-partitions in legs 4 and 6 are small even by this study's standards.**
  They can say "not distinguishable from an ordinary session"; they cannot say "zero." The claim
  throughout is the absence of a *large* effect.
- **Leg 3's refutation cuts both ways.** Clean February n=2 is not evidence that February is
  ordinary — it is evidence that the apparent February effect is unsupported. Those are different
  claims and only the second is made here.
- **The ISM-services collision rule is derived from two published conventions, not from a fetched
  ISM 2027 calendar.** `ism-services-2027-02-03` is itself an `estimate` on this calendar; if its
  date moves, leg 6's forward claim moves with it.
- **Close-to-close only.** The statement lands 08:30 ET, an hour before the equity open; TLT and IEF
  do not trade that window at all, so part of the cash-Treasury reaction is absorbed before they
  open, and an intraday spike that faded is invisible here.
- **Everything about this edition's *content* is a 147-day extrapolation.** The statement does not
  exist; there is no consensus, no whisper, no implied move.

## Stance & kill switches

**Stance (`estimate`-dated — no date-keyed action is licensed regardless of what follows).** Stand
aside on 2027-02-03 as a price event, on a refusal that survived a deliberate attempt to break it.
The February subset — this edition's own month — carries the strongest-looking result in the series
(^TNX 1/4 up, −2.000%, p=0.010), and it is two FOMC decision days in a sample of four; clean February
n=2 and nothing under p=0.267. Every partition that actually describes this date measures nil: clean
of an FOMC collision (TLT 4/8, −0.037%, p=0.908), one week after a decision (TLT 3/6, +0.036%,
p=0.922; SPY 3/6, +0.011%, p=0.976), and sharing its session with ISM services (TLT 2/4, +0.131%,
p=0.768). **The live question on this ledger is its date, and it resolves early and cheaply.**
Treasury names its next refunding one quarter ahead, so the **2026-11-04** statement — 56 days out —
is where 2027-02-03 becomes a `TSY:` date or does not. Base case for content (**estimate-labelled**,
and carried dealer consensus rather than this doc's forecast): sizes unchanged at $58B/$42B/$25B for
a twelfth consecutive edition and *"at least the next several quarters"* retained. **One standing
caution for other lanes:** ISM services (high) shares this session 90 minutes after the statement,
and by leg 6's rule shares all four 2027 refunding sessions — neither event has a measured claim on
that morning's bond move, and attributing one is the error
[`treasury-refunding-2026-11-04`](treasury-refunding-2026-11-04.md) already caught once.

**Kill switches:**

- **The 2026-11-04 statement naming a February 2027 refunding date other than 2027-02-03, or naming
  none at all.** If the named date is **2027-01-27**, this edition moves onto the January FOMC
  decision day — the one subset with a measured reaction (TLT 6/8, +0.715%, p=0.029) — and the
  stand-aside is re-derived from scratch, not patched.
- **The refunding announcement and ISM services *not* sharing the 2027-02-03 session** — leg 6's
  two-convention rule is wrong and the attribution caution comes off.
- **A clean-subset refunding day producing a TLT move above the 90th percentile of its own trailing
  distribution with no guidance change** — the "language is the only channel" read dies and the
  non-event finding needs re-argument.
- **"At least the next several quarters" dropped or qualified on 2026-11-04 or here** — the
  guidance-change case fires; the stand-aside on *this* print still holds (it is `estimate`-dated),
  but leg 8's rate-duration ranking becomes live and this stance is re-argued.
- **Any of $58B / $42B / $25B changing at any refunding before 2027-02-03** — ten editions of
  stability broke; leg 7's base rate is void.
- **home.treasury.gov's policy statement becoming directly fetchable** — resolves the gated-primary
  limit; re-verify the guidance wording against the primary and clear the `blocked` entries.

Forward tests registered in
[`forward-tests/treasury-refunding-2027-02-03.md`](../forward-tests/treasury-refunding-2027-02-03.md):
**FT-treasury-refunding-2027-02-03-1** (the February effect is an artifact — this edition behaves
like an ordinary session), **-2** (the two-convention ISM-services collision rule), and **-3** (the
2026-11-04 statement names this date, scored 56 days out).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-147 | Initial research banked (above); canonical `src/domain/market-events/treasury-refunding-2027-02-03.json` written this PR from the single prior proposal (`.from-treasury-refunding-2027-05-05`), whose finding — the event, its derived date and its role as the sibling's promotion hinge — is carried and upgraded, not discarded. **Date:** stays `estimate`; no primary names any 2027 refunding date. **Session's two new outputs are a refutation and a rule.** (1) **REFUTED — the February subset.** Isolating the 4 February editions gives the strongest result in this event's whole record: ^TNX 1/4 up, **−2.000%, p=0.010**; IEF 3/4, +0.529%, p=0.022; TLT 3/4, +0.895%, p=0.054. **2 of the 4 (2023-02-01, 2024-01-31) are FOMC decision days** → clean February n=2, all p≥0.267. Third independent instance of the sibling's confound, now in this ledger's own month. → **FT-1**. (2) **NEW mechanism — why February is the most exposed edition:** both its collisions came from the *January* FOMC by different routes — 2023-02-01 in-band with the Jan 31–Feb 1 meeting running into February, 2024-01-31 out-of-band and sliding back onto the Jan 30–31 decision day. For 2027 the in-band route is closed (FOMC 01-26/27, announcement 02-03); a date slip would land on **2027-01-27, the decision day**. (3) **NEW — the geometry of this date measures nil.** 2027-02-03 is 7 days post-FOMC; 6 of the 8 clean editions are exactly 7 days post-decision: TLT 3/6 **+0.036%, p=0.922**, SPY 3/6 **+0.011%, p=0.976**, ^TNX 3/6 −0.206% p=0.725, IEF 3/6 +0.074% p=0.683. The p=0.003 FOMC-day bond bid does not bleed one week forward. (4) **Replication, third run.** Clean 8: TLT **4/8, −0.037%, p=0.908** (2026-11-04 ledger p=0.905; sibling p=0.899). Naive all-16 still clears 0.05 on IEF (**p=0.016**) and ^TNX (**p=0.048**). Placebos flat T−3…T+3. Window 2022-11-01→2026-09-08, n=965, 200k-iteration permutation; the 16 editions re-derived independently from `api.fiscaldata.treasury.gov` auctions_query (HTTP 200) by maturity-15th + null `original_issue_date`. (5) **NEW rule — the ISM-services collision is derivable, not incidental.** ISM services = 3rd business day; the in-band refunding = 1st Wednesday; identical exactly when the month starts Sat/Sun/Mon. **5 of 16** editions collided, and **all four 2027 editions do** (Feb 1 Mon, May 1 Sat, Aug 1 Sun, Nov 1 Mon). Price effect nil either way (clean+ISM TLT 2/4 +0.131% p=0.768; clean−ISM 2/4 −0.206% p=0.648) — the cost is **attribution**, the error `treasury-refunding-2026-11-04` caught retroactively. → **FT-2**. (6) **Promotion path is 56 days, not 147:** home.treasury.gov's documents page fetched direct (HTTP 200, 73,519 bytes) reads *"(The next release is scheduled for November 4 , 2026)"* and stops — Treasury names one quarter ahead, so **2026-11-04** names this date. → **FT-3**. Sizes $58B/$42B/$25B intact for 10 editions (`offering_amt`, primary). Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none bearing on a D-147 supply announcement. **Volatility regime:** ^VIX **16.14**, ^TNX **4.80**, TLT **82.21**, SPY **763.66** (2026-09-09 closes) — baseline set, no prior row to diff. **Geopolitical/policy:** none dated into the 2027-02 corridor today. **Event tape:** no consensus exists at D-147; the statement's content does not yet exist. **Corridor (±5d), all `estimate`:** japan-cpi-tokyo-flash-2027-01-29 · boj-summary-of-opinions-2027-02-01 · **ism-manufacturing-2027-02-01 (high)** · **ism-services-2027-02-03 (high, same session)**. **New dated adjacency found → proposed in this PR:** **`jobs-2027-02-05`** (`EST:`, high) — the January Employment Situation at D+2, filling this calendar's gap between jobs-2026-12-04 and jobs-2027-05-07, derived on the BLS third-Friday-after-the-reference-week rule (ref week Sun 2027-01-10 → Sat 2027-01-16). Notable: **bls.gov returned HTTP 200 to this runner**, not the 403 recorded as a standing blind spot in EVENT-RESEARCH.md — but its schedule page publishes 2026 only (Jan. 09 → Dec. 04, 2026) and both 2027 schedule paths 404, so the prefix stays `EST:`. **Noted but deliberately NOT proposed:** the Feb 2027 borrowing-estimates Monday (2027-02-01, 15:00 ET). The sibling measured that session to be a non-event (TLT clean 4/8, +0.056%, p=0.870; ^TNX p=0.981) and declined to file it; this session honours that measured refusal rather than silently re-deciding — **but flags the resulting asymmetry for whoever owns that series**: the calendar carries `treasury-borrowing-estimates-2026-11-02` and `-2027-05-03` and would now be missing only the February one. **Blocked fetches recorded in probe-ref:** the refunding policy-statement PDF (**HTTP 404** here; the sibling saw curl 000 on the same path hours earlier) and both BLS 2027 schedule paths (404), so the guidance-sentence wording stays carried and search-sourced while the sizes it governs are primary. | — (stance set) | 2026-09-30 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-refunding-2027-02-03.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
