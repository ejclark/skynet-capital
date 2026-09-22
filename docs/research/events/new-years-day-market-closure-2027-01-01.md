# US equity, options and bond markets closed — New Year's Day (Friday 2027-01-01), and the vol re-mark that is over before it starts — new-years-day-market-closure-2027-01-01

**Kind:** sector · **Date:** 2027-01-01 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table, OCC expiration calendar and SIFMA US panel, all fetched direct 2026-09-09; the `estimate` label is a taxonomy question, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","china-retaliation-suspension-expiry-2026-12-31","consumer-confidence-2026-12-29","fhfa-hpi-2026-12-29","fomc-minutes-2026-12-30","georgia-psc-data-center-cost-shift-2026-12-31","ism-manufacturing-2027-01-05","jpx-market-closure-2026-12-31","nerc-computational-load-standards-2026-12-31","russell-style-quarter-end-capping-effective-2026-12-31","sifma-bond-early-close-2026-12-31","sifma-japan-early-close-2026-12-28","sifma-uk-bond-market-closure-2026-12-28","sp-select-sector-secondary-reweight-2026-12-31"],"screenStreak":0,"blocked":[{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=NASDAQCOM","status":"EGRESS_BLOCKED","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside on the date, and carry one correction that shortens a sibling ledger's
headline claim by a week.** The closure is real and triple-primaried — NYSE's own table gives
**Friday 2027-01-01** as a full close, the OCC marks it a hatched *Exchange/OCC holiday*, and SIFMA
recommends a full US bond close, with a **2:00 p.m. ET early close on Thursday 2026-12-31** in front
of it. The date is `estimate` only because this calendar's confirmed-prefix taxonomy has no slot for
an exchange calendar. The measured content is elsewhere. First, the **session-budget mirror**: the
same Friday holiday that makes December 2026 a **22-session / 140.0-hour month — the 1990–2025
record maximum** — makes January 2027 a **19-session / 123.5-hour month, tying the 1990–2026
minimum**. Budget the pair or you will get one of them backwards. Second, and this is the call with
teeth: [`christmas-market-closure-2026-12-25`](christmas-market-closure-2026-12-25.md) named its
measured post-break VIX rise a *"turn-of-year vol re-mark."* Both of its headline numbers
**replicate exactly** here on an independent session record (+4.32% on 3-day gaps, 16/20; +8.30%
across four sessions, 30/36) — but its four-session window ends inside December in **36 of 36
years** and never once crosses New Year. The re-mark is **Christmas-specific and spent by year-end**,
not a turn-of-year effect. What the New Year break *does* carry is the opposite shape, and it is the
more useful finding: **a big move with no direction.** Signed, VIX runs **−0.20% mean, 16 of 35
years up — the 52nd percentile** of all 9,229 one-session moves since 1990, a coin flip. In
magnitude it is nothing of the sort: on the 3-non-trading-day gaps that match 2026/27, the mean
absolute move is **8.34%, the 84th percentile** of unconditional absolute one-session moves — and
**larger than the Christmas break's own 4.61%**. Christmas is a small, reliable, directional mark;
New Year is a large, unreliable, undirected one. The exact Friday-January-1 analogue leans positive
(+7.62%, 4 of 5) on **n = 5** with a −7.56% to +18.55% range, which is not a number anything may be
sized on. The equity leg is a null both ways (**+0.15%** mean, 19/35). Nothing here is tradeable: `symbols: []`, `impact: low`, no house playbook
is calendar-keyed. Output is one correction, one replication, one asymmetry proved mechanically,
two execution guards, one proposed calendar entry, and three registered forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session 114 days out is not a position, and there is nothing to size | High | D-114. `symbols: []`, `impact: low`, and a grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `holiday\|closure\|new year\|year-end\|half-day\|early close` returns **0 hits in both**, run this session rather than inherited from the sibling ledger | A house playbook that keys on holiday-adjacent or turn-of-year sessions being written and back-tested before **2026-12-31** — the "nothing is calendar-keyed" leg goes stale and this sheet gets rebuilt on measured data |
| This week | **Stand aside; bank the January session budget now, before anyone re-derives it from December's** | High | January 2027 is **19 sessions / 123.5 equity hours**, tying the 1990–2026 minimum — the *mirror* of December 2026's record-max 22 / 140.0, and produced by the same Friday holiday. All five prior Januaries opening on a Friday New Year's Day ran 19 or 20 (1993:20, 1999:19, 2010:19, 2016:19, 2021:19) | The 19-session count failing to reproduce from NYSE's own 2027 table (Jan 1 and Jan 18 the only closures, no January early close in the footnotes), checked any time before **2026-12-31** |
| This month | **Watch the promotion question; note that this date can never get the Treasury-auction proof its Labor Day sibling used** | Medium | Three independent primaries date this event — and the OCC's 10 hatched 2027 holidays agree **one-for-one on all ten dates** with NYSE's 2027 column — yet it still reads `estimate`, because this lane confirms only on `IR:`/`BLS:`/`FED:`/`TSY:`. The `labor-day-market-closure-2026-09-07` technique (a Monday bill slate shifted to Tuesday) has **no analogue here**: Treasury's Monday bill auctions are not displaced by a *Friday* holiday, so no auction shift exists to find, in any year | A ruling that the confirmed `OCC:` prefix covers that calendar's **holiday** markers as well as its expirations, landed before **2026-12-01** — a yes promotes this and every sibling closure entry at once |
| This quarter | **Treat the post-Christmas VIX pop as finished business by 2026-12-31, and hold no directional vol view across the New Year break — size for the move, not the sign** | Medium | Measured this session on 9,268 CBOE VIX rows against an independent 9,241-session Yahoo ^IXIC record: the Christmas four-session window closes inside December in **36/36 years**, and the break that follows is directionally a **−0.20% / 16-of-35 / 52nd-percentile** coin flip while being a **8.34% mean absolute move, 84th percentile**, on the 3-day gaps that match 2026/27 — bigger than Christmas's 4.61% and only half as predictable. Confidence is medium, not high, because the five Friday-January-1 analogues lean positive (**+7.62%, 4/5**) on a sample too small to trust | The 2026-12-31 → 2027-01-04 VIX change landing **inside ±4.32%** — the Christmas 3-day break print — which would kill the "big move" half; 12 of 14 prior 3-day-gap New Year breaks clear it. Registered as **FT-new-years-day-market-closure-2027-01-01-1**, **-2** and **-3** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-01-01. It is a closed session; the date is
  `estimate`, and date-keyed action requires `confirmed` regardless.
- **Attribution guard (Mon 2027-01-04):** unlike the Christmas reopen, a higher VIX print here is
  **not** the expected outcome — the base rate across 35 year-end breaks is 16/35 up, mean −0.20%,
  a coin flip. **Expect the size, not the sign:** on 3-day gaps the mean absolute break move is
  8.34% (84th percentile) and only 2 of 14 landed inside ±4.32%. Read the direction of a 2027-01-04
  move as news, positioning or the 2027-01-05 ISM front-run — never as a scheduled mark.
- **Execution guard (Thu 2026-12-31):** the year's last session is a **full** NYSE equity day, an
  **OCC quarterly expiration**, and a **2:00 p.m. ET** SIFMA US bond close, with **Tokyo fixed
  income fully shut** the same day (SIFMA Japan "Bank Holiday" card) and this closure directly
  behind it. Bonds lose two hours to equities, Tokyo is already gone, and there is no follow-on
  session for four calendar days.
- **Execution guard (the seven-to-zero cliff):** **2026-12-31 carries 7 tracked calendar entries**
  — tied 4th-densest of all 428 dated entries — while the first session of 2027, **Mon 2027-01-04,
  carries zero**, and the next entry is `ism-manufacturing-2027-01-05` (high impact). Everything
  outstanding on 12-31 must be closed on 12-31.
- **The corrected session budget, to stop it being re-derived wrong:** January 2027 = **19 sessions
  / 123.5 equity hours**, no half days; December 2026 = **22 sessions / 140.0 hours**. The pair is
  **41 sessions**, and the record max sits directly in front of the record min.
- **Do not use CBOE's `VIX_History.csv` to decide whether a day was a session.** Re-verified this
  session: it publishes rows on **33** weekdays since 2022 that were not equity sessions, including
  2026-09-07 (Labor Day, two days ago). It happens to be correct for New Year's and Christmas and
  wrong for the other six US closures.
- **Attribution trap:** the *stated* reason a vol print moves on 2027-01-04 will almost always be
  the New Year gap, because that is the salient thing. On this measurement it is the one explanation
  the data does not support.

## Initial research

### The question

This id reached the calendar as **one sibling proposal**, not as a seeded entry — discovered by the
[`christmas-market-closure-2026-12-25`](christmas-market-closure-2026-12-25.md) initial research on
2026-09-08 while it counted its own corridor. Per
[`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), this session read that proposal first, then
wrote the canonical `src/domain/market-events/new-years-day-market-closure-2027-01-01.json`. The
proposal is unusually well-sourced for a proposal — it had already fetched NYSE, SIFMA and the OCC —
so the useful question was never "is the date right." It is the one the proposal itself set up and
could not answer from inside its own event:

> the proposer's ledger claims the post-Christmas VIX pop is a **turn-of-year** re-mark rather than a
> gap effect, and scores that claim on **2027-01-04** — the reopen after *this* closure. Does the
> turn of the year actually carry it?

So: **is the date right from primaries fetched independently, does the sibling's headline claim
survive being measured at the other end of the corridor, and does anything in the corridor behave
differently because this closure is there?**

**One-line verdict:** the date is right and now rests on three primaries re-fetched today plus a
ten-for-ten cross-check between two of them; the sibling's *numbers* replicate exactly but its
**name for them does not** — the re-mark completes inside December in 36 of 36 years and the New
Year break itself is a measured null; and the corridor's real asymmetry is not vol at all, it is a
seven-entry session running straight into an empty one.

### Method

Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. **Nothing was inherited from the proposal**; every primary was re-fetched and
every statistic recomputed from raw series:

- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302 (the page needs `curl -L`),
  109,180 bytes. The holiday table parsed cell by cell and **all four footnotes** read verbatim.
- **OCC** `www.optionseducation.org/api/expirationcalendar` — HTTP 200, 34,871 bytes. All 155 dated
  rows walked; the 36 holiday rows classified by the file's own legend GUIDs, and the
  *Bank holiday* vs hatched *Exchange/OCC holiday* distinction **counted** rather than assumed.
- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, 299,272 bytes. All
  three panels (US / UK / Japan) segmented by the page's own `Holiday Recommendations` headings and
  their full-close cards normalised to ISO dates.
- **CBOE** `cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv` — HTTP 200, 472,411
  bytes, **9,268 rows** 1990-01-02 → 2026-09-08. Used for every vol measurement, and **audited**
  against the session record rather than trusted as one.
- **Yahoo** `query1.finance.yahoo.com/v8/finance/chart/^IXIC` — HTTP 200, **9,241 sessions**
  1989-12-27 → 2026-09-08. The independent session record and the equity leg.
- **This repo's own calendar** — all 428 canonical entries in `src/domain/market-events/` read and
  ranked by date, to measure release density rather than assert it.
- **Computed, not sourced:** every session count, every gap classification, every percentile and
  every base rate below.
- **One source was blocked.** `fred.stlouisfed.org/graph/fredgraph.csv?id=NASDAQCOM` — the series
  the sibling ledger used for its equity leg — returned **curl exit 0 / HTTP 000** (connection
  never established) on two attempts from this runner. Recorded in `probe-ref.blocked`; Yahoo
  `^IXIC` is the stated substitute, and the equity numbers below are therefore **not** byte-identical
  to the sibling's even where they agree in shape. `stooq.com` was tried as a second fallback and is
  JavaScript-gated (796-byte `noscript` shell).

### Conviction legs, tested

**1. The date is right, on three primaries plus a ten-for-ten cross-check — SUPPORTED (and still
`estimate`).** NYSE's New Year's Day row parses as `["Thursday, January 1", "Friday, January 1",
"—*"]` for 2026 / 2027 / 2028, so 2027 is a full closure on the day itself with no observance shift.
SIFMA's US panel card reads `["New Year's Day 2026/2027", "Friday, January 1, 2027", "Early Close
(2:00 p.m. Eastern Time): Thursday, December 31, 2026"]`. The OCC marks 2027-01-01
`{"holiday":{"description":"Exchange/OCC holiday","hatched":true}}`. The new evidence this session
adds is a **cross-check between two independent primaries across a whole year**: the OCC file
carries exactly **10 hatched 2027 holidays** (01-01, 01-18, 02-15, 03-26, 05-31, 06-18, 07-05,
09-06, 11-25, 12-24) and NYSE's 2027 column carries exactly **10 rows**, and they agree **one-for-one
on all ten dates** with zero disagreement. The status stays `estimate` for the taxonomy reason
alone — `market-events-data.ts` has no confirmed prefix for an exchange's or a trade association's
own calendar. Understating the label only widens caution.

**2. The OCC's holiday marker is load-bearing, not decorative — SUPPORTED, by counting.** The
sibling ledger asserted that the OCC reserves hatched *Exchange/OCC holiday* for full closures and
uses *Bank holiday* for bond-only days. Verified here across every holiday row the file carries for
2025–2027: **30 hatched, 6 unhatched**, and all six unhatched are `Bank holiday` — 2025-10-13,
2025-11-11, 2026-10-12, 2026-11-11, 2027-10-11, 2027-11-11, every one a Columbus or Veterans Day, the
two days this calendar already tracks as `sifma-bond-market-closure-*` entries with equities open.
The vocabulary is exceptionless in the file's own data. 2027-01-01 is hatched.

**3. New Year's Day is the only US market holiday *dropped* rather than *shifted* on a Saturday —
SUPPORTED, proved mechanically from the session record.** NYSE footnote `*` states it for 2028:
*"Because the holiday falls on Saturday, January 1, 2028, no New Year's Day holiday is observed."*
That is a statement about a future year, so it was tested against the past instead, by asking the
session record whether the adjacent Friday was a trading day:

| Holiday on a Saturday | Adjacent Friday | Was it an equity session? |
|---|---|---|
| Jan 1 1994 / 2005 / 2011 / 2022 | Dec 31 1993 / 2004 / 2010 / 2021 | **Yes — 4 of 4** |
| Jul 4 2015 / 2020 | Jul 3 2015 / 2020 | **No — 0 of 2** |
| Dec 25 2010 / 2021 | Dec 24 2010 / 2021 | **No — 0 of 2** |

4/4 one way against 4/4 the other, with no exceptions in 36 years. The mechanism is obvious once
stated: shifting New Year's Day backwards would shut **the last session of the year**, which is the
one session the exchange will not give up. A sibling lane reaching 2028 should expect **no
New Year's entry at all** — the absence is the rule, not an oversight.

**4. The session-budget mirror — SUPPORTED, computed both sides.** The sibling ledger banked
December 2026 at **22 sessions / 140.0 equity hours** (21 × 6.5 + one 3.5-hour half day), tying the
1990–2025 record maximum. Recomputed here and confirmed. Its mirror had not been computed: January
2027 has 21 weekdays, minus Fri 01-01 and Mon 01-18 (MLK), = **19 sessions / 123.5 hours**, with no
early close anywhere in NYSE's January footnotes. Against the 1990–2026 January range of **19–22**,
that **ties the minimum**. And the pattern holds in every prior instance — the five Januaries that
opened on a Friday New Year's Day ran 1993:20, 1999:19, 2010:19, 2016:19, 2021:19, never more than
20. **One Friday holiday produces the record-max December and the record-min January back to back.**
Anyone budgeting the turn of the year from December alone will over-provision January by up to three
sessions.

**5. The sibling's numbers replicate — SUPPORTED — but its name for them does not — REFUTED.** The
Christmas ledger's two headline statistics were recomputed here from raw CBOE rows against a Yahoo
session record rather than FRED, and they land on the same values:

| Statistic | Sibling ledger | Reproduced here | Verdict |
|---|---|---|---|
| VIX break print, 3-non-trading-day Christmas gaps | +4.32%, 16/20 | **+4.32%, 16/20** | exact |
| VIX break print, 1-day gaps | −0.15% | **−0.15%** | exact |
| VIX four sessions after, all years | +8.30%, 30/36 | **+8.30%, 30/36** | exact |
| VIX run-in into the break | −5.67%, 26/36 | **−5.16%, 26/36** | shape identical; level differs on window definition |

That is a clean independent replication and it strengthens the sibling's mechanical claim. What does
**not** survive is the label. The ledger calls the rise a *"turn-of-year vol re-mark."* Measured
directly: **the fourth session after the Christmas break falls in the next calendar year in 0 of 36
years.** It lands on 12-30 or 12-31 every single time. So the entire +8.30% convergence the sibling
measured is a **December** phenomenon that has already completed before this event's closure begins.
Its own forward test `FT-christmas-market-closure-2026-12-25-2` scores on 2026-12-31 for exactly
this reason — the score-by date is right; the name is a week too wide.

**6. The New Year break is directionally a null and dimensionally a large move — REFUTED as a
source of edge, SUPPORTED as an execution hazard.** Same method, applied to the year-end gap (last
session of year Y → first session of Y+1), 35 usable turns 1990→2026:

| Window | Mean | Median | Positive | Percentile vs unconditional |
|---|---|---|---|---|
| VIX across the New Year break | **−0.20%** | −0.79% | **16 / 35** | **52nd** of 9,229 one-session moves |
| VIX four sessions past the break | −1.03% | −0.41% | 16 / 35 | 48th of 9,226 four-session moves |
| Nasdaq across the break | +0.15% | +0.17% | 19 / 35 | — |

A 52nd percentile is the definition of an average *signed* session, against a Christmas break that
sits at the 80th on the same measure. The gap-length structure the sibling identified does survive
— **+2.66% mean, 8/14** on 3-non-trading-day New Year gaps against **−3.61%, 5/16** on 1-day gaps,
a 6.3-point spread wider than Christmas's own 4.5 — but the hit rate collapses from 16/20 (80%) to
8/14 (57%).

**And the signed mean hides the fact that actually matters.** Measured in absolute terms on the same
rows, the New Year break is not a quiet session at all:

| Break, 3-non-trading-day gaps | Mean absolute VIX move | Percentile vs unconditional \|move\| (4.89%) |
|---|---|---|
| **New Year** | **8.34%** | **84th** |
| Christmas | 4.61% | ~50th |

Only **2 of 14** 3-day-gap New Year breaks landed inside ±4.32% — the Christmas break's own signed
print. So the two holidays are opposite instruments a week apart: **Christmas is a small, reliable,
directional mark; New Year is a large, unreliable, undirected one.** That combination — above-average
magnitude with a coin-flip sign — is the worst possible shape to carry a directional vol position
across, and it is the whole reason this leg produces a guard rather than a play.

**7. The exact 2026/27 analogue leans positive on a sample too small to use — MIXED, and stated as
such.** 2026-12-31 is a Thursday, 2027-01-01 a Friday closure, 2027-01-04 the reopen: a
3-non-trading-day gap. Five prior turns share that exact shape (a Friday January 1):

| Turn | Last session | First session | VIX break | Nasdaq break |
|---|---|---|---|---|
| 1992→1993 | 1992-12-31 | 1993-01-04 | +6.28% | −0.76% |
| 1998→1999 | 1998-12-31 | 1999-01-04 | +7.17% | +0.70% |
| 2009→2010 | 2009-12-31 | 2010-01-04 | −7.56% | +1.73% |
| 2015→2016 | 2015-12-31 | 2016-01-04 | +13.67% | −2.08% |
| 2020→2021 | 2020-12-31 | 2021-01-04 | +18.55% | −1.47% |
| **mean** | | | **+7.62%, 4/5 up** | **−0.38%, 2/5 up** |

+7.62% and 4-of-5 is the strongest number on this page, and it is the one the sheet **declines to
act on**. n = 5, a −7.56% to +18.55% range, and the two largest draws sit on regime events that owe
nothing to a calendar — January 2016's China devaluation and January 2021's retail-vol episode. Per
the house rule that confidence drives size, five observations with that dispersion is a
stand-aside, not a small position. It is registered as a forward test instead, which is what a
sample this thin is for.

**8. The corridor's real asymmetry is release density, not vol — SUPPORTED.** Reading all 428
canonical entries: **2026-12-31 carries 7**, tying 4th-densest in the whole calendar (behind only
2026-09-30 at 10 and 2026-10-27 / 2026-10-15 at 9) — `china-retaliation-suspension-expiry`,
`georgia-psc-data-center-cost-shift`, `jpx-market-closure`, `nerc-computational-load-standards`,
`russell-style-quarter-end-capping-effective`, `sifma-bond-early-close` and
`sp-select-sector-secondary-reweight`. **Mon 2027-01-04, the first session of 2027, carries zero**,
and the next entry on the calendar is `ism-manufacturing-2027-01-05` (high impact). The closure is
the wall between a seven-entry session and an empty one — which is the honest reason this event
matters to anything, and it has nothing to do with volatility.

**9. The Labor Day mechanical proof cannot be run here — REFUTED as an available technique, on
structure rather than on a blocked fetch.** `labor-day-market-closure-2026-09-07` proved its closure
from Treasury's own auction record: a ten-week run of Monday 13-week bill auctions with exactly one
Tuesday exception, on the holiday week. The Christmas sibling found that proof unavailable because
Treasury publishes only announced auctions and the December slate is not out. The reason here is
stronger and permanent: **Treasury's recurring bill auctions are Monday-anchored, and 2027-01-01 is
a Friday**, so no Friday holiday can displace them — there is no shift to find, in this year or any
other. Recording it so a later pulse does not spend a session re-attempting it.

### What plays this supports

**None.** `symbols: []`, `impact: low`, and the grep in the *Today* row returns zero calendar-,
holiday- or turn-of-year-keyed hypotheses in either `docs/plans/trade-playbooks.md` or
`docs/research/multi-symbol-sweep.md`. The date is `estimate`, and date-keyed action requires
`confirmed`. Every output above is a **guard or a correction** — something that stops a wrong
inference — rather than a trade.

### Honest limits

- **FRED was blocked**, so the equity leg runs on Yahoo `^IXIC` rather than the `NASDAQCOM` series
  the sibling used. Both are the Nasdaq Composite and the numbers agree in shape, but a future
  reconciliation between the two ledgers should expect small level differences, not identity.
- **The run-in level differs from the sibling's** (−5.16% vs −5.67%) because the window is defined
  from the session record rather than from CBOE rows. The direction and the 26/36 count match; the
  level is window-dependent and neither is more correct.
- **n = 5 on the exact analogue**, and 35 on the aggregate. Thirty-five year-ends is a real sample
  for a null result and a thin one for a positive; the null is the better-supported half.
- **The mechanism is inference, not a sourced convention.** Nobody publishes "we deflate implied vol
  for holiday calendar days." The measurements are consistent with it; they do not establish it.
- **The 2026-12-31 density count is this calendar's density, not the market's.** It measures what
  this repo tracks, which over-weights rates and market-structure events by construction.
- **The OCC file ends 2027-12-31**, so the 2028 non-observance rests on NYSE's footnote plus the
  four-for-four historical pattern in leg 3, not on a third primary.

## Stance & kill switches

**Stand aside on the date; carry the corrections.** (The event is `estimate` — the label is a
taxonomy artifact, and even a `confirmed` closure would license nothing here.)

The position has three parts, in descending order of how much they should change behaviour:

1. **Do not carry a *directional* post-Christmas vol expectation across the New Year break — but do
   not treat the break as quiet either.** The re-mark completes inside December, 36/36; the break's
   signed move is a 52nd-percentile coin flip while its absolute move is an 84th-percentile 8.34%.
   *Killed by:* the 2026-12-31 → 2027-01-04 VIX change landing inside ±4.32%, which would mean the
   break is genuinely quiet rather than merely undirected (12 of 14 prior 3-day gaps clear it).
2. **Budget the turn of the year as a pair: 22 sessions / 140.0 hours, then 19 / 123.5.** *Killed
   by:* the January count failing to reproduce from NYSE's 2027 table, checkable today.
3. **Everything outstanding on 2026-12-31 closes on 2026-12-31** — seven tracked entries, an OCC
   quarterly expiration, a 2:00 p.m. ET bond close, Tokyo already dark, then nothing for four
   calendar days and an empty first session. *Killed by:* NYSE or SIFMA amending the 12-31 hours,
   or this calendar's 12-31 cluster thinning below three entries before year-end.

Three predictions carry score-by dates and are registered in
[`forward-tests/new-years-day-market-closure-2027-01-01.md`](../forward-tests/new-years-day-market-closure-2027-01-01.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 114 | **Initial research.** Canonical `src/domain/market-events/new-years-day-market-closure-2027-01-01.json` written from the one prior proposal (`from-christmas-market-closure-2026-12-25`, 2026-09-08) after re-fetching every primary. Date verified on NYSE + OCC + SIFMA, all HTTP 200 today, with the OCC's 10 hatched 2027 holidays agreeing one-for-one with NYSE's 10-row 2027 column. **Adjacency sweep:** no peer-print concept applies (`symbols: []`); no macro surprise bears on a 114-day-out closure; VIX 15.72 (2026-09-08 close), a quiet regime; no geopolitical item touches a scheduled exchange closure; event tape is the corridor itself — 15 tracked entries within 5 days, 7 of them on 2026-12-31 alone against 0 on the 2027-01-04 reopen. **Findings:** (a) January 2027 = 19 sessions / 123.5 hours, tying the 1990–2026 minimum, mirroring December 2026's record-max 22 / 140.0; (b) the sibling ledger's +4.32% / +8.30% Christmas statistics replicate **exactly** on an independent session record, but its four-session window ends inside December in **36/36** years, so "turn-of-year" is a week too wide — the re-mark is Christmas-specific; (c) the New Year break is directionally **−0.20% mean, 16/35, 52nd percentile** of 9,229 one-session VIX moves (3-day gaps **+2.66%, 8/14** vs 1-day **−3.61%, 5/16**) while being dimensionally an **8.34% mean absolute move, 84th percentile**, on 3-day gaps — bigger than Christmas's 4.61%: a large move with no direction; (d) equity leg null, **+0.15%, 19/35**; (e) New Year's Day is the only US market holiday **dropped** rather than shifted on a Saturday — Dec 31 was a session in 4/4 Saturday-Jan-1 years, while Jul 3 and Dec 24 were closed in 4/4 Saturday-Jul-4 / Saturday-Christmas years; (f) the Labor Day Treasury-auction proof is **structurally unavailable** for a Friday holiday, not merely unpublished. **Blocked:** `fred.stlouisfed.org` HTTP 000 twice, substituted with Yahoo `^IXIC` and recorded in `probe-ref.blocked`; `stooq.com` JS-gated. **Proposed:** `sifma-uk-bond-market-closure-2027-01-01` (SIFMA U.K. panel full close, same-date, following the existing U.K.-entry precedent). | Stance opened: stand aside, carry three corrections. Registered FT-…-1, -2, -3 | 2026-10-09 (low band, 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-new-years-day-market-closure-2027-01-01.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
