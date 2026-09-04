# Treasury Quarterly Refunding Announcement (Nov 2026) — treasury-refunding-2026-11-04

**Kind:** macro-print · **Date:** 2026-11-04 (estimate, EST: Treasury's own pages name 2026-11-04 as the next refunding — reached via search, home.treasury.gov timed out on four direct fetches this session) · **Impact:** medium
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{},"vix":15.37,"daysBand":"medium:31+","adjacentIds":["ism-manufacturing-2026-11-02","ism-services-2026-11-04","jobs-2026-11-06","midterm-elections-2026-11-03","sloos-2026-11-02","treasury-borrowing-estimates-2026-11-02"],"screenStreak":0} -->

## At a glance

**TL;DR.** Stand aside on the announcement itself — and this time the refusal is **measured, not
assumed**. Across the 15 quarterly refunding announcements since 2023, TLT closed up 10/15 with a
mean of **+0.390%**, which looks like a real bond bid. It isn't: **7 of those 15 dates were also FOMC
decision days**, and the entire effect lives there. Split them out and the FOMC subset runs 6/7 up at
**+0.879%** (permutation p=**0.010**) while the clean refunding-only subset runs **4/8 up at
−0.037%** — against an unconditional 50.1% / −0.002% — for a permutation p of **0.905**. SPY on the
clean subset is 4/8 at **−0.025%** (p=0.938) versus a 56.7% / +0.086% baseline. **2026-11-04 is not
an FOMC day** (the Fed meets 10-27/28 and 12-08/09), so the clean subset is the one that governs it.
What *is* worth watching is a language line, not a price: Treasury has now held the 3y/10y/30y
refunding at **$58B/$42B/$25B for nine straight quarters** (Aug 2024 → Aug 2026) behind the phrase
*"at least the next several quarters."* Dealers expect the first coupon increase in **2027**, with
the guidance modified several quarters ahead — which makes this edition a live venue for that
modification. The one time the language moved (2025-11-05, when Treasury added that it had "begun to
preliminarily consider" future increases), TLT fell **−1.09%**, the largest clean-subset move in the
set. Two extra things make this edition non-boilerplate: it is the **expiry date of Bessent's doubled
$4B/op long-end buyback program** (which runs 09-09 → 11-04), and it is the morning after the
midterms. All of this is `estimate`-dated and none of it licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-65) | Stand aside | High | Sixty-five days out on an `estimate`-dated announcement whose content does not exist yet; the standing guidance was re-affirmed 2026-08-05 and nothing has changed it. | Treasury publishing an off-cycle statement changing coupon sizes or the "at least" guidance before **2026-11-04** |
| This week | Stand aside | High | Nothing this week keys off this date; the Sep 1→4 macro cluster (ISM-mfg + JOLTS 9/1, ADP 9/2, ISM-svcs 9/3, jobs 9/4) owns the near tape. | A dated Treasury announcement inside the 09-01→09-07 week that moves issuance policy, not just operation size |
| This month | Watch, do not trade | Medium | The one dated Treasury item in September is the enlarged buyback program starting **09-09**; it is a size change to an existing tool, and its own announcement-day reaction fully faded within 24 hours (8/19 → 8/20). | Long-end yields easing durably for multiple sessions after 09-09, which would make the buyback channel a bigger lever than the 8/19 round-trip implies |
| This quarter | Stand aside on the print; watch **one sentence** | Medium | On the measured clean subset a refunding announcement is indistinguishable from an ordinary session for both bonds (p=0.905) and equities (p=0.938). The only thing with a demonstrated tape effect is a *change in the issuance guidance* — and 11-04 is a plausible venue for one. | The **2026-11-04** statement dropping or qualifying "at least the next several quarters", or moving any of $58B/$42B/$25B — the guidance-change case, which on its one clean precedent (2025-11-05) cost TLT −1.09% |

**Signals & conditions** — the buy/sell/hold triggers:

- **The sentence to read first on 11-04:** does *"at least the next several quarters"* survive in the
  nominal-coupon/FRN forward guidance? Retained → the measured non-event case holds, no action.
- **Dropped or qualified** → the one clean precedent (2025-11-05, TLT −1.09%, 81st percentile of its
  own 2026-era |move| distribution) says long duration reprices lower; tighten caution on the
  rate-duration names (CRWV first) into the 11-06 jobs print. Still not an entry — `estimate`-dated.
- **Any of $58B (3y) / $42B (10y) / $25B (30y) changing** → nine quarters of stability broke; this
  ledger's base rate is void and the stance gets re-derived, not patched.
- **The $4B/op long-end buyback program lapsing on 11-04 rather than being extended** → removes the
  fiscal-side support Bessent added 08-19; read it against `treasury-buyback-increase-2026-09-09`.
- **Do not attribute any 11-04 bond move to any single release.** Three events stack that morning:
  this at 08:30, `ism-services-2026-11-04` (est) at 10:00, and the 11-03 midterm result overnight.
- **Watch (dated):** borrowing estimates **11-02** (est, proposed this PR) · SLOOS **11-02** · ISM-mfg
  **11-02** · midterms **11-03** · **this, 11-04 08:30** · ISM-services **11-04 10:00** · jobs **11-06**.

## Initial research

**The question, plainly:** what does the Treasury Quarterly Refunding Announcement actually decide,
what is the consensus expectation for the November 2026 edition, what is the *measured* reaction
function of bonds and equities to past refunding announcements, and which of our tracked names
(NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN) carry meaningful sensitivity — around 2026-11-04?

**One-line verdict:** the refunding announcement is a **measured non-event** once its FOMC collisions
are stripped out — the apparent bond bid on refunding days is the FOMC riding along on 7 of 15 dates
— so the honest call is stand aside on the print and watch exactly one sentence, the *"at least the
next several quarters"* forward guidance, whose only clean change on the record (2025-11-05) is also
the only clean-subset session that produced an outsized bond move.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode),
plus a first-party measurement built on Yahoo **dividend-adjusted** daily closes
(`scripts/research/market-data.mjs` → `bars()`, whose `close` field is the adjusted series; instrument
caches busted before the run per the cache-discipline rule). Instruments: **TLT · IEF · ^TNX · SPY ·
QQQ · XLF · IWM · ^VIX**, window 2023-01-01 → 2026-08-31 (n=916 sessions for the ETFs). Event set: the
**15 quarterly refunding announcement dates** since 2023-02-01. Significance by two-sided permutation
test (200,000 iterations) against random same-size draws from the same session pool — not a t-test,
because daily return distributions are fat-tailed. Placebo columns T−2 … T+2 run on both subsets.

Primary-source limit, stated up front: **home.treasury.gov timed out on four direct fetches this
session** (the quarterly-refunding index, the most-recent-documents page, statement `sb0590`, TBAC
minutes `sb0592`), matching the same gating the sibling
[`treasury-buyback-increase-2026-09-09`](treasury-buyback-increase-2026-09-09.md) ledger recorded.
FRASER's mirror of the Treasury press releases returned **403**, and treasurydirect.gov's upcoming-
auctions table rendered empty. So every Treasury quotation below is reached through search results
citing the release, not a document this session fetched — which is why the calendar entry stays
`estimate` and is not promoted.

### Conviction legs, tested

**1. What the announcement actually decides — SUPPORTED.** At **08:30 ET** on the refunding Wednesday
Treasury publishes the quarterly refunding statement (the coupon sizes for the mid-quarter refunding
and the forward guidance on future sizes), the TBAC report, and the auction/buyback schedules. Two
days earlier, on the Monday, it publishes the **marketable borrowing estimates** — the aggregate
dollar number the Wednesday statement then allocates across the curve. For November 2026 those fall
on **11-02** and **11-04**. That two-part structure matters for attribution: the *quantity* surprise
lives on Monday, the *composition and guidance* surprise on Wednesday.

**2. The date rests on Treasury naming it, not on a cadence rule — SUPPORTED, and this corrects a
sibling's reasoning.** The `treasury-refunding-2026-11-04` entry and the
[`ism-services-2026-11-04`](ism-services-2026-11-04.md) ledger both lean on "the first Wednesday of
February, May, August and November." **That rule is not reliable.** The observed announcement dates
include **2025-04-30**, **2025-07-30**, **2024-10-30**, **2024-07-31** and **2024-01-31** — all the
*last* Wednesday of the preceding month. What actually makes 11-04 credible is that Treasury names
its own next date in each statement: the Feb 2026 statement named "Wednesday, May 6, 2026", and the
buyback release `sb0607` names "the next Quarterly Refunding, scheduled for November 4, 2026". The
2026 editions have in fact all been first Wednesdays (**02-04 · 05-06 · 08-05**), so the rule happens
to hold this year — but the rule is not the evidence, the naming is. Recorded here so the next
session does not re-derive a date from a convention that breaks two years out of four.

**3. The reaction function is NIL once FOMC collisions are removed — SUPPORTED, and this is the
session's central finding.** Measured on the 15 announcement dates:

| Instrument | All 15 | Clean (8, no FOMC) | FOMC-day (7) | Unconditional |
|---|---|---|---|---|
| TLT | 10/15 up, **+0.390%** | **4/8 up, −0.037%** (perm p=**0.905**) | 6/7 up, **+0.879%** (perm p=**0.010**) | 50.1% up, −0.002% |
| IEF | 10/15 up, +0.306% | 4/8 up, +0.057% | 6/7 up, +0.592% | 50.7% up, +0.010% |
| ^TNX | 5/15 up, −0.790% | **4/8 up, −0.166%** (perm p=**0.741**) | 1/7 up, **−1.503%** (perm p=**0.007**) | 49.8% up, +0.035% |
| SPY | 7/15 up, +0.053% | **4/8 up, −0.025%** (perm p=**0.938**) | 3/7 up, +0.141% (p=0.675) | 56.7% up, +0.086% |
| QQQ | 7/15 up, +0.080% | 3/8 up, −0.304% | 4/7 up, +0.519% | 56.9% up, +0.119% |

The seven FOMC collisions are **2023-02-01 · 2023-05-03 · 2023-11-01 · 2024-01-31 · 2024-05-01 ·
2024-07-31 · 2025-07-30** — dates where an 08:30 refunding statement and a 14:00 FOMC statement shared
a Wednesday. The collision is structural, not coincidental: refunding week and the Jan/Apr–May/Jul/
Oct–Nov FOMC meetings both land at the turn of those months. The placebo columns confirm the reading —
on the FOMC subset TLT continues **+0.676%** on T+1 and ^TNX runs **0/7 up, −1.544%** on T+1, which
is the shape of a post-FOMC drift, not of a supply announcement being digested; on the clean subset
every placebo column is flat (TLT T−2 +0.056 / T−1 +0.180 / **T+0 −0.037** / T+1 −0.224 / T+2 −0.090).
**Note that the single most-cited "refunding day" in market memory — 2023-11-01, TLT +2.17%, the 97th
percentile of its own distribution — is an FOMC decision day.** The famous "Treasury under-issued the
long end and bonds ripped" story is permanently confounded with Powell's presser the same afternoon
and cannot be separated on daily data.

**4. The exceptions inside the clean subset are guidance changes, not size surprises — MIXED
(directionally right, n=3).** Three of the eight clean observations exceeded the 76th percentile of
TLT's own |move| distribution, and each has an issuance-language story attached:

- **2025-11-05, TLT −1.090% (81st pctile)** — the edition that added that Treasury "has begun to
  preliminarily consider future increases to nominal coupon and FRN auction sizes, with a focus on
  evaluating trends in structural demand." Right sign for a supply signal. The cleanest single data
  point this ledger has.
- **2023-08-02, TLT −1.070% (80th pctile)** — the edition that actually *raised* coupon sizes. Right
  sign, but **confounded**: Fitch downgraded the US sovereign the evening of **2023-08-01**, so this
  session is not attributable to the refunding alone and is not counted as clean evidence.
- **2025-02-05, TLT +1.651% (93rd pctile)** — Bessent's first refunding as Secretary, which kept sizes
  and guidance unchanged against expectations he would tilt issuance longer. Right sign for a
  *not*-happening supply increase, but the attribution here is press framing, not measurement.

So the honest statement is: **n=3, one clean, one confounded, one narratively attributed.** That is a
hypothesis with the right sign and nowhere near enough observations to be a template — which is
exactly why it is registered as a forward test below rather than asserted as a finding.

**5. Consensus for November 2026 is "no change, again" — SUPPORTED, with a real tail.** Treasury has
held the refunding at **$125B total, $58B 3y / $42B 10y / $25B 30y for nine consecutive quarters**
(Aug 2024 → Aug 2026 inclusive), behind the standing sentence *"Based on current projected borrowing
needs, Treasury anticipates maintaining nominal coupon and FRN auction sizes for at least the next
several quarters."* The August 2026 statement retained it and added that Treasury "continues to
evaluate potential future changes to nominal coupon and FRN auction sizes, with a focus on trends in
structural demand" — a *softening* of November 2025's "begun to preliminarily consider," not an
escalation. The tail is genuine and dated-adjacent: dealer consensus is that coupon sizes next
increase **in 2027**, and that Treasury modifies its forward guidance **several quarters ahead** of
such a change. Several quarters ahead of 2027 is *now* — which is what makes this a live edition
rather than a formality. Precedent that the market watches this exact phrase: at the **May 2026**
refunding, Deutsche Bank and JPMorgan both expected the words "at least" to be removed; Treasury kept
them and yields edged lower (measured: TLT **+0.761%**, ^TNX **−1.359%** on 2026-05-06).

**6. This edition carries two decisions the boilerplate ones do not — SUPPORTED.** First, **11-04 is
the expiry date of Bessent's doubled long-end buyback program**: the 08-19 announcement raised the
maximum from $2B to at least $4B per operation for the 10-20Y and 20-30Y sectors, running **09-09
through 11-04**, and `sb0607` states that more information on future buyback sizes comes "at the next
Quarterly Refunding, scheduled for November 4, 2026." So this statement decides whether that program
continues, expands, or lapses — a scheduled new-information item, not a formality. Its own
announcement-day reaction, for calibration, fully round-tripped inside 24 hours (10Y −5.7bp to 4.647%
on 08-19, then back above 4.70% on 08-20). Second, **it is the morning after the midterms** — the
first fiscal-supply statement into whatever Congress the 11-03 vote produces, though the borrowing
estimates were locked in the Monday before and no post-election fiscal change can be in these numbers.

**7. Tracked-name sensitivity — ranked, with mechanism, and deliberately deflated.** `symbols: []` —
market-wide, transmitted through the rate-duration channel. Ranked: **CRWV** (debt-financed
datacenter build; long-end yields hit both its discount rate and its literal cost of capital), then
the high-multiple semis **NVDA / AVGO / MRVL**, then **MSFT / GOOG / META** (mega-cap duration, but
fortress balance sheets mute the financing leg), least **AAPL / AMZN**. That ranking is the standing
house one, carried from the sibling rates ledgers — **and leg 3 says the channel does not open on
this date at all**: SPY's clean-subset permutation p is 0.938 and QQQ shows nothing. The ranking is
what to consult *if* the guidance sentence changes, not a reason to position for the date.

### What the conditions support

Nothing directional. No house playbook is macro-keyed (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed),
and the measurement here is a refusal rather than an edge. What travels is one reusable discipline
this session banked for the whole calendar: **an event's measured reaction function must be computed
against its collision set, not its date list.** Seven of fifteen refunding days were FOMC days, and
that single confound flips the conclusion from "bonds rally on refunding day" to "refunding day is
an ordinary session." The `event-material-scan` corridor logic already tracks adjacency for
*scheduling*; this is the same idea applied to *measurement*.

### Honest limits

- **No Treasury primary was fetched this session.** Four direct home.treasury.gov fetches timed out,
  FRASER returned 403, treasurydirect.gov rendered empty. Every quotation is via search results
  citing the release. The date stays `estimate` and is **not** promoted — this lane cannot self-confirm.
- **n=8 on the clean subset is small, and p=0.905 means "not distinguishable," never "proven zero."**
  With TLT's daily σ of 0.896% over the window, 8 observations only have ~80% power against a mean
  effect of roughly **±0.89%** — so a real effect of, say, 0.4% would likely be missed. The claim
  supported here is that no *large* refunding-day effect exists, not that no effect exists.
- **Close-to-close only.** The statement lands at 08:30 ET, an hour before the equity open; an
  intraday spike that faded by the close is invisible to this measurement and is a live possibility.
  The bond ETFs also do not trade the 08:30 window, so the cash-Treasury reaction to the statement is
  partly absorbed before TLT/IEF open.
- **The FOMC-collision list was assembled from the published 2023–2026 FOMC calendars, not from a
  primary re-fetch this session.** 2026's dates (Jan 27-28, Mar 17-18, Apr 28-29, Jun 16-17, Jul 28-29,
  Sep 15-16, Oct 27-28, Dec 8-9) are corroborated by this repo's own `fomc-2026-10-28` and
  `fomc-2026-12-09` entries; the 2023–2025 dates are search-sourced.
- **Leg 4's exception story is n=3, one of which is confounded by the Fitch downgrade and one of which
  rests on press attribution.** It is registered as FT-39, not claimed.
- **The impact tier is left at `medium` and not re-litigated.** The measurement argues `low` for the
  generic edition; the buyback-expiry decision and the live guidance-change window argue `medium` for
  *this* one. Rather than churn the calendar entry, the tension is recorded — if the guidance survives
  11-04 unchanged, the next comparable refunding entry should be filed `low`.

## Stance & kill switches

**Stance (`estimate`-dated — no date-keyed action is licensed regardless of what follows).** Stand
aside on 2026-11-04 as a price event. The refusal is measured, not assumed: on the eight refunding
announcements since 2023 that were *not* also FOMC decision days, TLT closed 4/8 up at a mean −0.037%
(permutation p=0.905) and SPY 4/8 up at −0.025% (p=0.938), both indistinguishable from ordinary
sessions; 2026-11-04 is not an FOMC day. **Read the statement for exactly one thing** — whether
*"at least the next several quarters"* survives in the nominal-coupon/FRN forward guidance — because
the only clean-subset session that produced an outsized bond move (2025-11-05, TLT −1.09%) was the
one where that language moved, and dealer consensus places the first coupon increase in 2027 with
guidance modified several quarters ahead. Base case (**estimate-labeled**, and it is dealer consensus
rather than this doc's own forecast): sizes unchanged at $58B/$42B/$25B for a tenth consecutive
quarter and the "at least" phrase retained. Secondarily, read whether the $4B/op long-end buyback
program is extended past its 11-04 expiry. **Attribute no 11-04 bond move to this release alone** —
ISM services (est) prints 90 minutes later and the midterm result lands overnight.

**Kill switches:**

- **"At least the next several quarters" dropped or qualified on 2026-11-04** — the guidance-change
  case fires; the stand-aside on the *print* still holds (it is `estimate`-dated), but the
  rate-duration ranking in leg 7 becomes live and CRWV caution tightens into the 11-06 jobs print.
- **Any of $58B / $42B / $25B changing** — nine quarters of stability broke; leg 5's base rate is void
  and this stance gets re-derived from scratch, not patched.
- **A clean-subset refunding day producing a TLT move above the 90th percentile of its own
  distribution with no guidance change** — the "language is the only channel" read dies and the
  non-event finding needs re-argument.
- **home.treasury.gov becoming directly fetchable** — resolves the gated-primary limit; re-verify the
  11-04 date and the exact August guidance wording against the primary, and only then consider
  promoting the entry to `confirmed` with a `TSY:` prefix.
- **The $4B/op buyback program lapsing rather than extending on 11-04** — removes the fiscal-side
  support added 08-19; reassess `treasury-buyback-increase-2026-09-09` rather than this doc.

Forward tests registered in [`forward-tests.md`](../forward-tests.md): **FT-39** (the guidance
sentence survives, scored 2026-11-05) and **FT-40** (the buyback program is extended past its 11-04
expiry, scored 2026-11-05).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-65 | Initial research banked (above). **Date:** stays `estimate` — home.treasury.gov timed out on **four** direct fetches (refunding index, most-recent-documents, `sb0590`, `sb0592`), FRASER's press-release mirror 403'd, treasurydirect.gov's upcoming table rendered empty; no primary fetched, so no `TSY:` promotion. **Session's main output — a measured refusal plus one correction.** Method: Yahoo dividend-adjusted closes, 2023-01-01→08-31, n=916, eight instruments vs the **15** refunding announcements since 2023-02-01; two-sided permutation test, 200k iters. **(1) The refunding-day bond bid is an FOMC artifact.** All 15: TLT 10/15 up, mean **+0.390%**. But **7 of 15 dates are FOMC decision days** (2023-02-01 · 05-03 · 11-01, 2024-01-31 · 05-01 · 07-31, 2025-07-30) — 08:30 statement, 14:00 FOMC, same Wednesday. Split: FOMC subset **6/7 up, +0.879%, p=0.010**; clean subset **4/8 up, −0.037%, p=0.905** vs unconditional 50.1%/−0.002%. ^TNX the same shape (FOMC 1/7, −1.503%, p=0.007; clean 4/8, −0.166%, p=0.741). SPY clean **4/8, −0.025%, p=0.938** vs 56.7%/+0.086%; QQQ 3/8, −0.304%. Placebos confirm: FOMC T+1 keeps going (TLT +0.676%, ^TNX 0/7 at −1.544%) — post-FOMC drift, not supply digestion — while every clean placebo is flat (TLT −2/−1/0/+1/+2 = +0.056/+0.180/−0.037/−0.224/−0.090). **2023-11-01, the famous "refunding rally" (TLT +2.17%, 97th pctile), is an FOMC day** and is permanently confounded on daily data. **2026-11-04 is NOT an FOMC day** (Oct 27-28, Dec 8-9), so the clean subset governs. **(2) The only channel with a signal is the guidance sentence.** Three clean observations cleared TLT's 76th pctile: **2025-11-05 −1.090%** (the edition that added "begun to preliminarily consider future increases" — clean, right sign), **2023-08-02 −1.070%** (sizes actually raised, but confounded by the 08-01 Fitch downgrade), **2025-02-05 +1.651%** (Bessent's first refunding held sizes against a longer-tilt expectation — press attribution, not measurement). n=3, one clean → registered **FT-39**, not asserted. **(3) Correction banked: the "first Wednesday" cadence rule is unreliable** — 2025-04-30, 2025-07-30, 2024-10-30, 2024-07-31 and 2024-01-31 were all the *last* Wednesday of the prior month. 11-04 is credible because Treasury *names* it (`sb0607`), not because of the rule; the entry's own source note and the [ism-services sibling](ism-services-2026-11-04.md) both lean on the rule, so this is recorded for the next session rather than edited into them. **(4) Consensus:** $125B / $58B-$42B-$25B unchanged **nine straight quarters** (Aug 2024→Aug 2026); Aug 2026 kept "at least the next several quarters" and softened Nov 2025's "begun to preliminarily consider" to "continues to evaluate." Dealers put the first coupon increase in **2027** with guidance moved several quarters ahead — i.e. this edition is a live venue. At the May 2026 refunding DB and JPM both expected "at least" removed; it was kept, TLT +0.761% / ^TNX −1.359%. **(5) This edition is the expiry date of the doubled $4B/op long-end buyback** (09-09→11-04, `sb0607` promises future sizing "at the next Quarterly Refunding") → registered **FT-40**. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new; the Warsh 08-28 repricing (Sep hike odds ~35%→57-59%) is carried from the [Jackson Hole close-out](jackson-hole-2026-08-28.md), not re-derived. **Volatility regime:** ^VIX **15.37** (in-session 08-31 bar) vs 14.43 at the 08-28 close, +0.94pt, inside noise; ^TNX **4.756** (08-31), TLT **82.88** (08-28). **Geopolitical/policy:** carried — the 08-30 Larak Island strike re-escalated Hormuz (Brent >$90), and the Senate CR to Dec 11 is with the House; both feed the deficit/inflation backdrop that is the long end's actual driver. **Event tape:** no November consensus exists at D-65; the statement's content does not yet exist. **New dated adjacency found → proposed in this PR:** the **Treasury Marketable Borrowing Estimates, 2026-11-02 at ~15:00 ET** — the Monday quantity release the Wednesday statement then allocates, named on Treasury's own refunding-documents page alongside 11-04 but absent from this calendar. Added as `treasury-borrowing-estimates-2026-11-02`, `status: estimate` (`EST:`), rule-and-secondary-sourced with home.treasury.gov timing out, filed `low` per this session's own measurement. **Noted but NOT proposed:** an ADP report on 11-04 08:15 ET is plausible on the tracked 09-02 entry's first-Wednesday cadence, but no confirming source was obtained today — same conclusion the ISM sibling reached. | — (stance set) | 2026-09-21 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
