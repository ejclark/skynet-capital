# US equity markets closed — Washington's Birthday / Presidents Day (falls INSIDE February opex week in 2027) — presidents-day-market-closure-2027-02-15

**Kind:** sector · **Date:** 2027-02-15 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table, re-fetched 2026-09-05; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["washingtons-birthday-market-closure-2027-02-15","vix-expiration-2027-02-17","japan-cpi-2027-02-19","opex-2027-02-19"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and treat the one framing this entry was seeded on as a trap rather than
an opportunity.** The seeding note's surviving claim was that the three-day weekend "front-loads
three calendar days of decay into a single un-hedgeable gap four sessions before expiry." Measured
this session against SPY and VIX daily bars (2010-01-01 → 2026-09-04, n=84 Monday-holiday weekends
against 755 ordinary ones), **that is half true and dangerously framed**. The extra calendar days
buy no extra price risk: the median absolute Friday→Tuesday opening gap is **0.404%** over three
calendar days versus **0.302%** over two — *per calendar day* that is **0.135% vs 0.151%, lower**,
because both spans contain exactly one non-trading interval and risk accrues in sessions, not days.
And the volatility side is **pre-marked, not harvestable**: VIX falls harder into a long-weekend
Friday close (mean −0.303 vs −0.176) and then **rebounds harder on reopen** — median +0.560 vs
+0.150 with VIX under 15, **+1.075 vs +0.150** in the 15–20 band, +0.160 vs −0.350 above 20, and it
is higher on reopen **71% of the time (60/84) against 56% (422/755)** for an ordinary weekend. The
holiday decay is charged for at the Friday close; carrying short vol through it is a documented
trap, not an edge. Two other things this session establishes: SIFMA's **published 2027 US schedule**
makes 2027-02-15 a plain full fixed-income close with **no** flanking early-close recommendation
(unlike six other 2027 US holidays on the same list) — closing an open question the seeding note
had to leave unasserted — and this calendar carries **the same closure twice**, under two different
ids. Nothing here is tradeable: the date is `estimate`, `symbols: []`, `impact: low`, and a grep of
both house playbook docs for holiday/closure keying returns **zero hits**, re-run this session.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session is not a position and there is nothing to size | High | D-163; `symbols: []`, `impact: low`, and a grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `holiday\|presidents\|washington\|closure\|half-day\|early close` returns **0 hits in both**, run this session rather than cited from the Good Friday sibling | A house playbook keyed on holiday-adjacent sessions being written and back-tested before **2027-02-15** — the "nothing is calendar-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Fix the calendar before touching the thesis** — this closure is filed twice | High | `presidents-day-market-closure-2027-02-15` and `washingtons-birthday-market-closure-2027-02-15` are the same NYSE row, both minted 2026-09-05 by two different adjacency sweeps, both `never-assessed`, each with its own tracking issue (#1598, #1592). `--validate` passes because it only checks that a filename equals its `id`. Filed as **#1609** | The two entries being reconciled to one id — or a stated reason both should stay — recorded on **#1609** before **2026-10-05**; this call retires the moment that decision exists |
| This month | **Do not carry "extra calendar decay" forward as an opportunity** | Medium | The three-day gap is priced into the Friday close and rebounds on reopen (71% vs 56%, n=84 vs 755, SPY/VIX daily bars 2010→2026-09-04). Short-vol carry across it collects the anticipated decay and pays the rebound | The long-weekend VIX rebound failing to appear on **2027-02-16** — VIX closing at or below its **2027-02-12** close. Registered as **FT-presidents-day-market-closure-2027-02-15-1** |
| This quarter | **Watch the promotion, not the tape** — double-primaried and still not confirmable | Medium | NYSE's holiday table and SIFMA's 2027 US schedule independently date it, and 5 U.S.C. 6103's third-Monday rule reproduces 2026/2027/2028 exactly. It stays `estimate` only because `market-events-data.ts`'s prefix taxonomy has no slot for an exchange holiday calendar and this lane may not self-confirm an in-sweep discovery | A `NYSE:`-class (or equivalent exchange-calendar) prefix being added to the source taxonomy before **2026-12-31** — the entry promotes to `confirmed` and this call retires |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-02-15. It is a closed session; the date is
  `estimate`, and date-keyed action requires `confirmed` regardless.
- **The trap, stated so it is not re-derived as an opportunity:** the Friday-before (2027-02-12,
  `estimate`) is when the three holiday days are marked out of implied vol; the rebound lands on
  Tuesday 2027-02-16. A short-vol position carried across the gap collects the part already priced
  and pays the part that is not. This is a caution about a play we do not run, not a play.
- **No cross-asset guard applies here** — the inverse of the Good Friday sibling. SIFMA's published
  2027 US recommendation (fetched 2026-09-05) is a **full** bond close on 2027-02-15 with **no**
  early close on 2027-02-12; equities and fixed income shut and reopen together.
- **The corrected counts, to stop them being re-derived wrong:** the expiration week itself is
  **4 sessions** (Tue 02-16 → Fri 02-19). The last five sessions before the expiration are **five**
  — 02-12, 02-16, 02-17, 02-18, 02-19 — the same as any cycle; only their calendar span changes,
  7 days instead of 4.
- **Attribution trap:** a move on Tuesday **2027-02-16** has a three-day-weekend explanation, a
  pre-VIX-settlement explanation (`vix-expiration-2027-02-17`, confirmed) and an opex-week
  positioning explanation before it has any single one.

## Initial research

### The question

The seeding entry (written during the `opex-2027-02-19` adjacency sweep) filed this closure on the
thesis that a Monday holiday inside February opex week matters — and, to its credit, already
corrected itself twice in the filing: not a seasonal regularity, and not a session-count
compression. What survived was one live claim: that the cycle "front-loads three calendar days of
decay into a single un-hedgeable gap four sessions before expiry — a real asymmetry." Is that
asymmetry real, is it worth anything, and does a day the market is shut earn a calendar row at all?

**One-line verdict:** the gap is real and the asymmetry is **measurably backwards from the way the
seeding note frames it** — the extra calendar days carry *less* price risk per day than an ordinary
weekend, and the extra decay is marked out of implied vol at the Friday close and rebounds on
reopen, so it is a cost to carry across, not a windfall to collect. The row's remaining value is
that correction, one newly-sourced fixed-income fact, and a duplicate calendar entry it surfaced.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). This session did not take the seeding note's
arithmetic on faith; it re-fetched the primaries and recomputed every count, then added the
empirical leg the note did not have.

- **NYSE** `nyse.com/markets/hours-calendars` re-fetched direct (HTTP 200 after its 302, 109,180
  bytes; the page needs `curl -L` and renders holiday data as JSON-ish `"text":"…"` cells rather
  than table markup), parsed cell-by-cell — the holiday rows *and* the full footnote list.
- **SIFMA** `sifma.org/resources/general/holiday-schedule/` (HTTP 200, 298,899 bytes), parsed out
  of the page's own embedded React payload because the 2027 tab panel is hidden in the rendered
  text. All four 2027 panels (US, UK, Japan) were extracted, not just the row of interest.
- **Yahoo daily bars** for **SPY** (8,458 sessions) and **^VIX** (9,238 sessions) via this repo's
  own `scripts/research/market-data.mjs`, **cache busted first** per the process doc's cache
  discipline. Every long-weekend statistic below is computed from those bars over 2010-01-01 →
  2026-09-04, never recalled.
- **Computed, not sourced:** third-Monday and third-Friday dates for February 2015–2035 by weekday
  arithmetic; every session and calendar-span count.
- **Re-grepped this session:** `docs/plans/trade-playbooks.md` and
  `docs/research/multi-symbol-sweep.md` for holiday/closure keying.
- **Not re-fetched, and therefore inherited rather than verified:** the seeding note's Cboe
  settlement-page read (see leg 7).

### Conviction legs, tested

1. **The date is right and now rests on two independent primaries — SUPPORTED (and still
   `estimate`).** NYSE's holiday table, parsed against its own `2026 / 2027 / 2028` year headers,
   gives `Washington's Birthday → ['Monday, February 16', 'Monday, February 15', 'Monday,
   February 21']`. SIFMA's 2027 US panel independently carries `Presidents Day — Monday,
   February 15, 2027`. The third Monday of February 2027 is 2027-02-15 by 5 U.S.C. 6103, and the
   same rule returns 2026-02-16 and 2028-02-21, matching NYSE on both neighbouring years. **It
   stays `estimate`** because the prefix taxonomy in `market-events-data.ts`
   (`IR:`/`CAL:`/`BLS:`/`FED:`/`PJM:`/`SEC:`/`TSY:`/`OCC:`/`BEA:`/`CENSUS:`/`ISM:`/`CB:`/`UMICH:`)
   has no slot for an exchange holiday calendar and this lane may not self-confirm an in-sweep
   discovery — a label about the taxonomy, not the evidence, and it costs nothing while every
   honest call here is a stand-aside.

2. **No NYSE early close attaches to this holiday — SUPPORTED, verified against the whole footnote
   list rather than the row.** The 2027 column carries exactly four footnote markers, and all of
   them were read: `*` (no New Year's holiday in 2028), `**` (July 3, 2028), `***` (the day after
   Thanksgiving, incl. Friday 2027-11-26), `****` (Thursday 2026-12-24). None attaches to the
   Washington's Birthday row, so no adjacent equity session shortens.

3. **The same closure is on this calendar TWICE — SUPPORTED, and it is the operationally load-
   bearing find.** `presidents-day-market-closure-2027-02-15` and
   `washingtons-birthday-market-closure-2027-02-15` are the same NYSE row, both dated 2027-02-15,
   both `status: estimate`, both `impact: low`, both filed **2026-09-05** — one discovered by the
   `opex-2027-02-19` sweep, the other by the `vix-expiration-2027-02-17` sweep, neither able to see
   the other. Both were `never-assessed` and dispatched in parallel today; both carry a tracking
   issue (#1598, #1592). `node scripts/event-scan.mjs --validate` passes because it enforces
   *filename == id*, which two distinct ids satisfy. The naming is genuinely ambiguous in the
   sources themselves — **NYSE** heads the row `Washington's Birthday`, **SIFMA** calls the same
   day `Presidents Day` — which is exactly why an id-keyed dedupe could not catch it. Consequence
   if left: two ledgers, two probe-ref baselines, two screen streaks and two pulse cadences for one
   shut day, forever. Filed as **#1609** rather than fixed here: deleting a sibling lane's file mid-flight
   would re-create the cross-lane merge conflict that one-file-per-event exists to prevent (#1449).

4. **"Not a seasonal regularity" — SUPPORTED, reproduced independently.** Whether the third Monday
   of February falls inside the third-Friday week depends on which weekday February starts on.
   Recomputed 2015–2035 from scratch: it does in **9 of 21 years (43%)** — 2015, 2016, 2020, 2021,
   2025, 2026, 2027, 2031, 2032 — exactly the years whose third Friday is the 19th, 20th or 21st,
   and 2025–2027 is the only unbroken three-year run in the window. In the other 12 the holiday is
   the *following* Monday and expiration week is an ordinary five sessions. The seeding note's
   figure and year list both reproduce exactly.

5. **"It compresses nothing in session terms" — SUPPORTED.** February 2027 begins on a Monday, so
   its Mondays are the 1st, 8th, 15th and 22nd and its Fridays the 5th, 12th, 19th and 26th. The
   expiration week is **4 sessions** (Tue 02-16, Wed 02-17, Thu 02-18, Fri 02-19). The last five
   sessions *before* the expiration are 02-12, 02-16, 02-17, 02-18, 02-19 — **five**, the same as
   any cycle; the window simply reaches one day further back. What changes is calendar span:
   **7 days instead of 4**.

6. **"It front-loads three calendar days of decay into an un-hedgeable gap — a real asymmetry" —
   MIXED, and the framing is the trap.** The gap exists. What it is worth is the opposite of what
   the phrasing suggests, on two measurements from SPY/VIX daily bars 2010-01-01 → 2026-09-04:

   | Friday → next session | n | median \|open gap\| | per calendar day | median \|Fri→next close\| | median ΔVIX over the gap | mean ΔVIX on the Friday itself |
   |---|---|---|---|---|---|---|
   | Ordinary weekend (→ Mon) | 755 | 0.302% | 0.151% | 0.449% | +0.150 | −0.176 |
   | Monday holiday (→ Tue) | 84 | 0.404% | **0.135%** | 0.545% | **+0.575** | **−0.303** |

   **(a) Price risk does not scale with the extra calendar days.** Both spans contain exactly one
   non-trading interval and one session boundary; the long weekend's gap is ~34% wider against 50%
   more calendar time, so *per calendar day it is smaller*. Risk accrues in sessions, not days —
   which is the standard weekend-effect result, reproduced here on our own data rather than cited.

   **(b) The extra decay is anticipated and charged for, not collected.** Implied vol is marked
   down harder into the long-weekend Friday close (mean ΔVIX −0.303 vs −0.176) and rebounds harder
   on reopen, at every regime:

   | VIX level on the Friday | Ordinary weekend (n) | median ΔVIX | Monday holiday (n) | median ΔVIX |
   |---|---|---|---|---|
   | < 15 | 273 | +0.240 | 34 | **+0.560** |
   | 15–20 | 262 | +0.150 | 24 | **+1.075** |
   | ≥ 20 | 220 | −0.350 | 26 | **+0.160** |

   VIX closes higher on reopen after **71% (60/84)** of Monday-holiday weekends against **56%
   (422/755)** of ordinary ones. So the honest statement is the inverse of the seeding note's: the
   three calendar days are priced out at the Friday close, and carrying short vol across the gap
   buys the already-paid decay and sells the rebound.

7. **The opex-week coincidence adds nothing measurable — REFUTED as evidence.** The six realized
   instances of this exact structure (2015, 2016, 2020, 2021, 2025, 2026) give mean ΔVIX over the
   gap **+0.455** / median **+0.845**, against **+0.975** / **+0.410** for the eleven other
   February Presidents-Day weekends in the sample. Mean and median disagree on which set is larger
   — the signature of n=6 noise, not of an effect. Nothing about expiration week is claimed here.

8. **A Monday holiday cannot move the expiration — SUPPORTED structurally, INHERITED on the
   source.** The monthly equity expiration is the third Friday; a Monday closure cannot shift it.
   The seeding note's stronger evidence — that the only third-Friday break in Cboe's 2026-09 →
   2027-12 settlement listing (VA/M7 on 2027-06-17, VX/K7 on 2027-05-18) is caused by Juneteenth
   falling on a **Friday** — was not re-fetched this session and is recorded as inherited rather
   than verified.

9. **SIFMA's published 2027 US schedule makes this a plain full bond close — SUPPORTED, and it
   closes the seeding note's one explicitly open question.** That note could only reach SIFMA's
   2026 panel (the 2027 tab rendered empty) and refused to assert 2027. Parsed out of the page's
   own payload today, the **2027 US** list reads: MLK 01-18 (no note), **Presidents Day 02-15 (no
   note)**, Good Friday 03-26 (early close 2:00 p.m. ET Thu 03-25), Memorial Day 05-31 (2:00 p.m.
   Fri 05-28), Independence Day 07-05 (2:00 p.m. Fri 07-02), Labor Day 09-06 (no note), Thanksgiving
   11-25 (2:00 p.m. Fri 11-26), Christmas 12-24 (2:00 p.m. Thu 12-23), New Year's (2:00 p.m. Fri
   12-31). Six of the 2027 US holidays carry a flanking early close and **this one does not** — so
   no `sifma-bond-early-close` entry is proposed alongside it, and the cross-asset execution guard
   the Good Friday sibling needed has no analogue here.

10. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A
    grep of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|presidents|washington|closure|half-day|early close` returns **zero hits in both files**,
    run this session. No playbook can fire on this date in either direction.

### What plays the conditions support

None. A closed session cannot be traded, `symbols` is empty, impact is `low`, and the date is
`estimate`. The supported outputs are the four already in the signals list: the short-vol carry
trap, the explicit *absence* of a cross-asset guard, the corrected session and span counts, and the
Tuesday 2027-02-16 attribution trap.

### Honest limits

- **The empirical legs measure a mechanism, not this event.** n=84 Monday-holiday weekends is a
  usable sample for "does a three-day gap behave differently"; the six realized
  Presidents-Day-inside-opex-week instances are not a sample of anything, and leg 7 says so rather
  than reporting a number as a finding.
- **^VIX is an index, not a tradeable.** Every vol statistic here is spot-VIX close-to-close. It
  supports the claim that implied vol is pre-marked and rebounds; it does **not** price any
  specific option, spread or futures roll, and no such number is asserted.
- **Cboe and CME were not fetched this session** — leg 8's settlement evidence is inherited from
  the seeding note. The first pulse with a working fetch can promote or correct it.
- **The duplicate is flagged, not resolved.** Which id survives is a calendar-ownership call this
  lane deliberately does not make from inside one of the two.
- **The event is `estimate`,** as are `opex-2027-02-19` and `japan-cpi-2027-02-19` in the same
  corridor. Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside, permanently and structurally — this row exists to hold a
corrected framing, one sourced negative, and a flagged duplicate, not a view. Concretely: (a) the
seeding note's surviving "three calendar days of decay into an un-hedgeable gap" claim is
**re-framed as a trap** — measured on 84 Monday-holiday weekends against 755 ordinary ones, the
extra calendar days carry *less* price risk per day and the extra decay is marked out at the Friday
close and rebounds 71% of the time on reopen, so carrying short vol across it is a cost, not a
carry. (b) There is **no** cross-asset schedule asymmetry here: SIFMA's published 2027 US
recommendation is a full bond close on 2027-02-15 with no flanking early close, the inverse of the
Good Friday sibling's configuration. (c) This closure is on the calendar **twice**, and that is a
calendar defect to reconcile before either copy accrues more pulses. Every statement carries the
event's **`estimate`** label.

**Kill switches:**

- **The long-weekend vol rebound fails to appear** — VIX closes at or below its 2027-02-12 close on
  Tuesday 2027-02-16. Leg 6(b) loses its live instance and the stance's headline caution weakens to
  a historical base rate. Registered as **FT-presidents-day-market-closure-2027-02-15-1**, score by
  2027-02-17.
- **The duplicate is reconciled on #1609** (or a reason for keeping both is recorded) — the "This week" call
  retires and this ledger either becomes the survivor or is superseded by
  `washingtons-birthday-market-closure-2027-02-15`.
- **SIFMA revises its 2027 US recommendation** to add an early close flanking 2027-02-15 — leg 9
  inverts and a cross-asset execution guard appears where this ledger says there is none.
- **A house playbook that keys on holiday-adjacent sessions is written and back-tested** — leg 10
  goes stale and the stand-aside is re-argued on measured data rather than on absence.
- **NYSE republishes its holiday table with a different 2027 date** — everything re-dates. (No
  mechanism exists; 5 U.S.C. 6103 fixes the third Monday. Listed for completeness.)

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 163 | **Initial research.** Date double-primaried (NYSE holiday table re-parsed with its full footnote list — no early close attaches; SIFMA 2027 US panel) + 5 U.S.C. 6103 arithmetic; stays `estimate` on the taxonomy gap alone. **Seeding thesis re-framed as a trap:** SPY/VIX daily bars 2010→2026-09-04 (cache busted) give median \|open gap\| **0.404%** over a 3-day weekend vs **0.302%** over 2 — *per calendar day 0.135% vs 0.151%, lower* — while ΔVIX over the gap is **+0.575 vs +0.150** median and higher on reopen **71% (60/84) vs 56% (422/755)**; the extra decay is marked out at the Friday close, not collected. Opex-week subset **n=6, no signal** (mean/median disagree). **New sourced fact:** SIFMA 2027 US = full bond close 02-15 with **no** flanking early close, unlike six other 2027 US holidays — closes the seeding note's unasserted fixed-income question; **no** `sifma-bond-early-close` proposal follows. **Calendar defect:** the same closure is filed twice (`washingtons-birthday-market-closure-2027-02-15`, #1592) — filed as **#1609**, not fixed from inside one copy. Adjacency — peers: n/a (`symbols: []`); macro: none dated to 02-15, `japan-cpi-2027-02-19` (estimate) prints in the same corridor; VIX **14.53** (close 2026-09-04); geopolitical: none dated here; tape: `vix-expiration-2027-02-17` (confirmed) and `opex-2027-02-19` (estimate) both sit in the 4-session week. Playbook grep **0 hits**. No new dated adjacent event found — no calendar proposal. | Initial stance set: **stand aside** (structural row only). Registers **FT-presidents-day-market-closure-2027-02-15-1**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
