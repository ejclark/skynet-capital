# US equity markets close early at 1:00 p.m. ET — the day after Thanksgiving — thanksgiving-half-day-2027-11-26

**Kind:** sector · **Date:** 2027-11-26 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table, footnote \*\*\*, fetched direct 2026-09-08; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.66,"daysBand":"low:15+","adjacentIds":["consumer-confidence-2027-11-30","fhfa-hpi-2027-11-30","fomc-blackout-start-2027-11-27","thanksgiving-market-closure-2027-11-25"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/schedule/2027/home.htm","status":"403","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** **Stand aside — and stop calling the vol behaviour a Black Friday anomaly.** The
[2026 sibling](thanksgiving-half-day-2026-11-27.md) found exactly one deviation that survived its base
rate — VIX fails to crush on the day-after-Thanksgiving Friday — and registered it with **no mechanism
attached**. This session found the mechanism, and it is not seasonal. Split the tape two ways. **Other
NYSE half sessions** (Dec 24, Jul 3; n=37) print VIX up **48.6%** of the time against a **49.0%**
weekday-matched expectation — dead on the null, so "half session" explains nothing. **The first session
after any market holiday**, on the other hand, prints VIX up **213 of 302 times (70.5%)** against a
**45.6%** weekday-matched base, **p ≈ 2×10⁻¹⁸**, and it runs the same direction on all five weekdays.
Black Friday is simply the Friday slice of that: 52.0% up vs a 35.9% normal-gap Friday base. Two
mechanism stories were tested and both failed — the crush does not scale with calendar days ahead
(37.5% vs 36.3%), and it is not pulled forward onto the pre-holiday session (48.0% vs a 43.7% base).
Separately, two primaries moved: **SIFMA's 2027 US panel is in the page after all** (bonds close 14:00,
so they outlive equities by an hour — the proposal declined to claim this), and **2027-11-26 is the only
NYSE early close in all of calendar 2027**. Nothing here is tradeable: `impact: low`, `symbols: []`, the
date is **`estimate`**. The output is four execution guards and two forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-444) | **Stand aside** — a 3.5-hour session 444 days out is not a position | High | `symbols: []`, `impact: low`, date `estimate`; a market-structure fact changes how other events are *read*, never what anything is worth | A house playbook keyed to holiday-shortened sessions being written and back-tested before **2027-11-26**, which would mean this date can fire something |
| This week | **Stand aside — this week is CPI 2026-09-11 and FOMC 2026-09-16, not a 2027 half day** | High | Nine tracked events land 2026-09-09 → 09-16 including two `high` prints and a decision; none of them touches this session | Any tracked event dated inside 2026-09-08 → 09-14 whose stance depends on 2027-11-26 |
| This month | **Watch one observation — the first session after Thanksgiving 2026, on 2026-11-27** | Medium | It is observation 1 of 11 in `FT-thanksgiving-half-day-2027-11-26-1`, and it is the same geometry as this event a year early | VIX closing **2026-11-27** below its **2026-11-25** close, the first out-of-sample miss for the post-holiday rebound |
| This quarter | **Carry "the vol tell is post-holiday, not Black Friday" — and do not re-derive it from the 2026 ledger's framing** | Medium | 213/302 at 70.5% vs a 45.6% base beats 18/33 at 54.5% vs 36.4% on every axis — n, p, and generality | The post-holiday set printing **5 or fewer** of its next **11** first-sessions up, observed by **2027-11-30** — registered as **FT-thanksgiving-half-day-2027-11-26-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2027-11-26 in any branch. `impact: low`,
  `symbols: []`, date `estimate`; date-keyed action requires `confirmed` regardless.
- **Attribution guard — a VIX uptick on 2027-11-26 is the base rate, not news.** The first session
  after a holiday closes VIX up 70.5% of the time (213/302). Read it as information only above that.
- **Execution guard — bonds outlive equities by an hour, and this is now sourced for 2027.** NYSE
  13:00 equities; SIFMA recommends a **14:00 ET** fixed-income close (2027 US panel, fetched today).
- **Execution guard — the options close is unsourced for 2027.** NYSE says 13:15 for *eligible
  options*; Cboe publishes **no 2027 schedule** as of today, so the 2026 sibling's 15-minute split
  cannot be re-sourced. Assume **13:00** unless the venue is NYSE American/Arca Options.
- **Execution guard — thin is reliable; calm is not.** SPY volume median **0.429×** its trailing-20
  median across 33 of these sessions, **27 of 33** under 0.70× — but range under 0.70× in only 21.
- **Structural — 2027-11-26 is the ONLY NYSE early close in calendar 2027.** July 4 falls Sunday
  (full closure Monday July 5) and Christmas falls Saturday (full closure Friday Dec 24). No rehearsal.
- **Open question, not a finding — is the session data-empty?** Census's release calendar carries
  **zero 2027 rows** today, so the 2026 sibling's 8:30 a.m. print cannot be reproduced or refuted here.
- **The corridor sits after the half day, not before it.** 2027-11-30 is November month-end and
  carries `consumer-confidence-2027-11-30` + `fhfa-hpi-2027-11-30`, two full sessions later — unlike
  2026, where the single Monday after was month-end.
- **Watch (dated)** — Thanksgiving 2026 rehearsal **2026-11-26/27** (FT-1 observation 1) · Christmas
  **2026-12-25** · FOMC **2027-10-26/27**, the confirmation trigger for the gate · closure
  **2027-11-25** (est) · **this half session 2027-11-26** (est) · blackout opens **2027-11-27** ·
  month-end **2027-11-30** · FOMC **2027-12-08** · bond-only early close **2027-12-23** (proposed here).

## Initial research

### The question, plainly

This event arrived as a proposal from the [`fomc-blackout-start-2027-11-27`](fomc-blackout-start-2027-11-27.md)
sweep, and it has a well-researched twin one year earlier. The
[2026 ledger](thanksgiving-half-day-2026-11-27.md) tested four folk seasonals against weekday base
rates, refuted three, and left one standing: **VIX does not crush on the day-after-Thanksgiving
Friday** (18 of 33 up, 54.5%, against a 36.4% Friday base, p = 0.025). It then tested the obvious
mechanism — a crush pulled forward onto the Wednesday — found nothing, and registered the observation
as a forward test rather than a belief, with an explicit note that the session has *no mechanism
attached*.

Re-running that ledger's twelve legs on a date shifted 364 days would be transcription, not research.
So this session asked the question the sibling left open: **is the missing crush a property of
Thanksgiving, a property of half sessions, or a property of something more general — and does the
2027 instance differ structurally from the 2026 one?**

**One-line verdict.** It is none of the first two. The missing crush is the Friday slice of a **general
post-holiday VIX rebound** — 213 of 302 first-sessions-after-a-holiday close VIX up (70.5%) against a
45.6% weekday-matched base, p ≈ 2×10⁻¹⁸ — while other half sessions show no deviation at all. And two
primaries moved since the proposal was filed: the bond side is now claimable for 2027, and this is the
only NYSE early close of the year. Date `estimate`; no directional call.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) —
`symbols: []`, so no symbol-keyed instrument applies. Instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any bar was
pulled. Every figure below was computed this session; every sibling figure is either re-derived here
and labelled as such, or cited without being repeated.

- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302, 109,180 bytes. Its holiday
  data is JSON-ish `"text":"…"` cells, not table markup; all 133 parsed, footnotes read whole.
- **SIFMA** `sifma.org/resources/general/holiday-schedule` — HTTP 200, 299,159 bytes. The 2027 US
  panel is **not** in the rendered tab; it is in the page's own `self.__next_f` RSC payload, and 109
  holiday cards were parsed out of it. This is where the proposal's claim is corrected.
- **Cboe** `cboe.com/about/hours/us-options/` — HTTP 200, 387,320 bytes. Its options holiday schedule
  covers **2026 only**; the string `2027` appears twice on the page and in neither a schedule row.
- **US Census** `census.gov/economic-indicators/calendar-listview.html` — HTTP 200, 91,396 bytes; 174
  dated rows spanning 2026-01-07 → 2026-12-28 and **zero** 2027 rows.
- **Yahoo daily bars** — SPY 8,459 sessions from 1993-01-29 and `^VIX` 9,240 from 1990-01-02, last bar
  **2026-09-08**. VIX statistics are windowed to 1993-01-29 so both series cover the same tape.
- **Attempted and failed, recorded rather than worked around:** `bls.gov/schedule/2027/home.htm` —
  **HTTP 403** to this runner even with browser headers, the same block
  [`fomc-blackout-start-2027-11-27`](fomc-blackout-start-2027-11-27.md) recorded the same day. Logged
  in `probe-ref.blocked`; no BLS claim is made about 2027-11-26.

### Conviction legs, tested

1. **The hours are read, not derived — SUPPORTED (and still `estimate`).** NYSE footnote \*\*\*,
   verbatim: *"Each market will close early at 1:00 p.m. (1:15 p.m. for eligible options) on Friday,
   November 27, 2026, Friday, November 26, 2027, and Friday, November 24, 2028 (the day after
   Thanksgiving)."* The page names 2027 explicitly. Statute agrees independently: 5 U.S.C. 6103 fixes
   Thanksgiving on the fourth Thursday of November, which in 2027 is the 25th. **Why it stays
   `estimate`:** `CONFIRMED_PREFIX` in `scripts/event-scan-validation.mjs` has no slot for an exchange
   operator's own hours page, and this lane may not self-confirm an event it discovered in-sweep.

2. **The bond side IS claimable for 2027 — SUPPORTED, and it corrects this event's own proposal.**
   The proposal recorded *"the 2027 tab's contents are not in the fetched HTML, so no SIFMA
   recommendation for 2027-11-26 is asserted."* Re-fetching the same URL today and parsing the RSC
   payload rather than the rendered tab returns the card verbatim: *"Thanksgiving Day | Thursday,
   November 25, 2027 | Early Close (2:00 p.m. Eastern Time): Friday, November 26, 2027."* So from
   **13:00 → 14:00 ET** the Treasury tape is the only US price discovery still running, exactly as in
   2026. The proposal was not wrong to refuse the claim — it read what it fetched — but the claim is
   now available, and the parse difference is the lesson: **a rendered tab is not the payload.**

3. **2027-11-26 is the only NYSE early close in calendar 2027 — SUPPORTED, new here.** The page
   carries exactly three early-close footnotes: \*\* is Monday July 3 2028, \*\*\* is the three
   day-after-Thanksgiving dates, \*\*\*\* is Thursday December 24 2026. 2027's remaining holidays
   leave no room for another: July 4 2027 is a **Sunday**, so Independence Day is observed as a full
   closure on Monday July 5, and Christmas Day 2027 is a **Saturday**, so it is observed as a full
   closure on Friday December 24. 2026 has two half sessions and 2028 has two; **2027 has one.**

4. **"The session is thin" — SUPPORTED, re-derived not inherited, and it is still the only
   large clean effect.** SPY divided by its own trailing-20-session median, day-after-Thanksgiving
   sessions 1993–2025 (n=33):

   | Class | n | median volume ÷ trailing-20 | median range ÷ trailing-20 | under 0.70× on volume |
   |---|---|---|---|---|
   | Day after Thanksgiving | 33 | **0.429×** | 0.542× | **27 of 33 (82%)** |
   | December 24 half sessions | 18 | 0.367× | 0.451× | 16 of 18 (89%) |
   | July 3 half sessions | 19 | 0.584× | 0.814× | 14 of 19 (74%) |

   The other two rows are not decoration: they are how the half-session classification below is
   validated against the tape rather than asserted from a rule.

5. **"The missing crush is a half-session effect" — REFUTED, and this is the load-bearing find.**
   If a 3.5-hour session were what suppresses the Friday crush, the other half sessions should show
   the same thing against *their* weekday bases. They do not:

   | Half-session class | VIX up | rate | weekday-matched expectation | P(≥k) |
   |---|---|---|---|---|
   | Day after Thanksgiving | 18 / 33 | 54.5% | 36.4% | **0.026** |
   | December 24 | 9 / 18 | 50.0% | 48.7% | 0.55 |
   | July 3 | 9 / 19 | 47.4% | 49.3% | 0.65 |
   | **Pooled ex-Thanksgiving** | **18 / 37** | **48.6%** | **49.0%** | **0.58** |

   Dead on the null. The half-session story is dead with it.

6. **The missing crush is a general POST-HOLIDAY REBOUND — SUPPORTED at p ≈ 2×10⁻¹⁸.** Classify every
   session by whether its previous session was more than the normal gap back (1 calendar day; 3 for a
   Monday). A larger gap means a market holiday sat in between. Comparing each weekday against its own
   normal-gap base:

   | Weekday | normal-gap VIX-up | n | post-holiday VIX-up | n | P(≥k) |
   |---|---|---|---|---|---|
   | Monday | 61.1% | 1,532 | **80.0%** | 60 | **0.0014** |
   | Tuesday | 43.1% | 1,577 | **74.4%** | 160 | **<0.0001** |
   | Wednesday | 43.5% | 1,720 | 60.0% | 15 | 0.15 |
   | Thursday | 44.9% | 1,685 | 64.7% | 17 | 0.081 |
   | Friday | 35.9% | 1,643 | **52.0%** | 50 | **0.014** |
   | **Pooled** | **45.5%** | **8,158** | **70.5% (213/302)** | **302** | **≈ 2×10⁻¹⁸** |

   Five weekdays out of five point the same way; the two with real n clear 0.05 comfortably. Median
   change is **+0.50** on a post-holiday session against **−0.09** on a normal-gap one. The
   day-after-Thanksgiving result the 2026 ledger isolated is the Friday row of this table, and its
   n=33 is a sixth of the evidence available for the same claim.

7. **It is not specifically about Thursday holidays either — CONSISTENT, but underpowered alone.**
   Fridays whose previous session was two calendar days back number 50 (VIX up 52.0%, P = 0.017 vs
   the Friday base); excluding the 33 Black Fridays leaves 17 — Dec 26, Jan 2 and Jul 5 Fridays, plus
   the 2025-01-10 national day of mourning and the 2025-06-20 Juneteenth Thursday — at **8 of 17
   (47.1%)**, P = 0.25. Same direction, insufficient n. Leg 6 is where the claim rests; this is the
   subsample that fails to contradict it.

8. **Mechanism story A — "the crush scales with calendar days ahead" — REFUTED.** If the Friday
   decline were decay marked in for non-trading days, a Friday before a three-day weekend should crush
   harder. It does not: **60 of 160 up (37.5%)** against an ordinary Friday's **555 of 1,531 (36.3%)**,
   P = 0.65. The crush does not scale with the gap it supposedly prices.

9. **Mechanism story B — "the crush is pulled forward onto the pre-holiday session" — REFUTED, and
   this independently reproduces the 2026 sibling's leg 10 on a 50%-larger set.** Wednesdays
   immediately preceding a Thursday holiday: **24 of 50 up (48.0%)** against a **43.7%** Wednesday
   base — *less* crush than normal, not more, P = 0.78 on the crush side. The sibling measured this
   on the 33 Thanksgiving Wednesdays and got 48.5% vs 43.7%; widening to all 50 changes nothing.

10. **So the pattern is named and the cause is not — stated as a failure rather than dropped.** What
    survives is a strongly-measured regularity (leg 6) with two plausible mechanisms tested and killed
    (legs 8, 9). The remaining candidates — stale holiday-week option quotes, Cboe's own calendar
    convention inside the VIX calculation, or genuine risk repricing on reopening — are named here and
    tested by none of them. **This ledger claims the pattern, not the cause.**

11. **The 2026 sibling's other legs, re-derived independently — all four conclusions hold.**
    Half-day SPY return up **20 of 33 (60.6%)** against a 53.6% all-session base, median **+0.079%**
    vs +0.064%, P = 0.27 → *"Black Friday is bullish"* stays refuted. Next session up **14 of 33
    (42.4%)** against a 55.5% Monday base, mean **−0.328%** collapsing to **−0.061%** once 2008-12-01
    is dropped → *"the Monday gives it back"* stays refuted. Next-open |gap| median **0.253%** (n=33)
    against an all-Monday **0.277%** (n=1,590) → *"repricing is pushed into Monday"* stays refuted.
    VIX next session up **23 of 33 (69.7%)** against a 61.8% Monday base, P = 0.23 → *"VIX pops the
    Monday after"* stays refuted as a seasonal. Note the last one is now doubly explained: a Monday
    following a half day is not a post-holiday session, so leg 6 predicts nothing extra there.

12. **The 2027 corridor is shaped differently from the 2026 one — SUPPORTED, structural.** In 2026 the
    half day was followed by a single Monday that was also November month-end. In 2027 the half day is
    followed by **two** full sessions, 11-29 and 11-30, and month-end is the Tuesday — so November
    rebalancing lands entirely clear of the shortened session, and both tracked corridor prints
    (`consumer-confidence-2027-11-30`, `fhfa-hpi-2027-11-30`) sit on it. The blackout
    (`fomc-blackout-start-2027-11-27`) opens the next calendar day, making this the deadline session
    for the December 2027 meeting — that lane measured 4 of 167 gates with this geometry since 2007,
    cited here and not re-derived. **n = 4 is not a testable sample and no claim is built on it.**

13. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.**
    `grep -icE 'holiday|half.day|early close|thanksgiving|black friday'` over
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` returns **0 and 0**, run
    this session. No playbook can fire on this date in either direction.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate`, and no playbook keys on it. The
supported outputs are the guards already listed: the 14:00 bond overhang (now sourced for 2027), the
unsourced options close, "thin is reliable / calm is not," the once-a-year structure, and — the one
that actually changes how a future session reads a tape — **a VIX uptick on any first-session-after-a-
holiday is the base rate at 70.5%, not news.**

### Honest limits

- **The historical half-session regime is assumed, not sourced.** NYSE's page states early closes for
  2026–2028 only. Applying the day-after-Thanksgiving / Dec 24 / Jul 3 rule back to 1993 is inference;
  leg 4's volume ratios corroborate it (all three classes run far under 1.0×) but corroboration is not
  a citation, and a handful of the derived Dec 24 / Jul 3 dates may have been full sessions.
- **Leg 6 is an association with no mechanism.** Two candidate causes were tested and killed; the
  ledger names three more and tests none. A measured regularity with no cause is exactly the thing
  that decays out of sample, which is why it is registered rather than believed.
- **Leg 6 may be partly a measurement artifact.** VIX after a holiday is struck against a book that
  has been closed for two or more calendar days. Whether the rebound is repricing or the unwinding of
  a stale mark is not resolvable from daily bars, and this ledger does not claim to have resolved it.
- **The data-emptiness question is open, not answered.** Census publishes no 2027 calendar today, so
  the 2026 sibling's load-bearing 8:30 a.m. find has no 2027 counterpart either way. BLS 2027 returned
  403. Both are recorded; neither is guessed at.
- **The options close is unsourced for 2027** and the futures leg is untouched — no CME fetch was
  attempted this session.
- **Every event in this corridor except `opex` is `estimate`,** including this one and the proposal
  filed with it. Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-08):** stand aside, permanently — this document holds a corrected framing and four
execution guards, not a view. Concretely: (a) **the vol tell is not seasonal.** The one deviation the
[2026 sibling](thanksgiving-half-day-2026-11-27.md) left standing with no mechanism is the Friday slice
of a general post-holiday VIX rebound — **213 of 302 (70.5%)** against a **45.6%** weekday-matched base,
p ≈ 2×10⁻¹⁸, while other half sessions sit dead on their null (**18 of 37, 48.6% vs 49.0%**). A VIX
uptick on 2027-11-26 (`estimate`) is therefore the base rate and never news. (b) **The cause is
unidentified and said so** — calendar-days-ahead scaling and pre-holiday pull-forward were both tested
and both failed. (c) **Two primaries moved:** SIFMA's 2027 US panel gives bonds a **14:00 ET** close, so
the one-hour Treasury overhang is now sourced rather than assumed, and 2027-11-26 is the **only NYSE
early close in all of 2027** — there is no second instance that year to rehearse on. (d) **Thin is
reliable, calm is not** — SPY volume median **0.429×**, 27 of 33 under 0.70×, range under 0.70× in only
21 of 33. Every statement carries the event's **`estimate`** label.

**Kill switches:**

- **The post-holiday rebound prints 5 or fewer of its next 11 first-sessions up**, measured across the
  eleven US market holidays from 2026-11-26 to 2027-11-25 — the leg this whole stance rests on fails
  out of sample. Registered as **FT-thanksgiving-half-day-2027-11-26-1**, score by 2027-11-30.
- **SPY's 2027-11-26 volume comes in at or above 0.70× its trailing-20-session median** — the
  thinness premise every execution guard rests on fails on the instance that matters. Registered as
  **FT-thanksgiving-half-day-2027-11-26-2**, score by 2027-11-30.
- **NYSE republishes its hours page with a second 2027 early close, or without 2027-11-26** — leg 3
  and the "no rehearsal" framing both go, and the calendar entry is amended rather than deleted.
- **Cboe publishes a 2027 options holiday schedule** — the unsourced-options-close guard either
  retires or hardens into the 2026 sibling's 15-minute split, and either way stops being an unknown.
- **Census publishes a 2027 release calendar carrying an 8:30 a.m. print on 2027-11-26** — the open
  data-emptiness question closes, and this session becomes data-bearing exactly as 2026-11-27 is.
- **A house playbook keyed to holiday-shortened sessions is written and back-tested** — leg 13 goes
  stale and the stand-aside is re-argued on measured data rather than on absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | 444 | **Initial research**; canonical `<id>.json` written, promoting the `from-fomc-blackout-start-2027-11-27` proposal. **Hours re-read from NYSE** (13:00 equities, 13:15 eligible options; 2027 named verbatim in footnote \*\*\*) — stays `estimate` on the taxonomy gap. **Proposal corrected:** SIFMA's 2027 US panel *is* in the page's RSC payload — bonds **14:00 ET**, so the one-hour Treasury overhang is sourced for 2027. **New structural fact:** 2027-11-26 is the **only NYSE early close in calendar 2027** (July 4 falls Sunday, Christmas Saturday). **Load-bearing measurement (SPY/VIX bars re-fetched, caches busted):** the 2026 sibling's one surviving deviation is **not** a Black Friday or half-session effect — other half sessions run **18/37 up (48.6%) vs 49.0% expected**, while first-sessions-after-any-holiday run **213/302 (70.5%) vs a 45.6% weekday-matched base, p ≈ 2e-18**, same direction on all five weekdays. Mechanisms A (days-ahead scaling, 37.5% vs 36.3%) and B (pre-holiday pull-forward, 48.0% vs 43.7%) both **refuted**; cause unidentified. Sibling legs re-derived independently — all four stay refuted. Thinness re-derived: volume median **0.429×**, 27/33 under 0.70×. Adjacency — peers n/a (`symbols: []`); macro: Census has **zero 2027 rows** so the 2026 "8:30 print" find has no 2027 counterpart, BLS 2027 **403** (logged in `probe-ref.blocked`); VIX **15.66** (close 2026-09-08); geopolitical: none dated; tape: blackout opens 11-27, month-end 11-30 sits two full sessions after the half day. Cboe publishes no 2027 schedule → options close unsourced. Proposes `bond-market-early-close-2027-12-23` (`estimate`) — the mirror geometry, bonds shut 14:00 while equities run full. | Initial stance set: **stand aside** (structural row only). Registers **FT-thanksgiving-half-day-2027-11-26-1** and **-2**. | 2026-10-08 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-thanksgiving-half-day-2027-11-26.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
