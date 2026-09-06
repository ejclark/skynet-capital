# US equity markets closed — Washington's Birthday (opens a 4-session week carrying two expirations) — washingtons-birthday-market-closure-2027-02-15

**Kind:** sector · **Date:** 2027-02-15 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table re-fetched direct 2026-09-05; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["presidents-day-market-closure-2027-02-15","vix-expiration-2027-02-17","japan-cpi-2027-02-19","opex-2027-02-19"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside on the market and fix the calendar — the finding here is a data defect, not
a trade.** This calendar carries **the same shut Monday twice**: this entry and
`presidents-day-market-closure-2027-02-15` are the identical NYSE holiday, filed 69 seconds apart on
2026-09-05 by two sibling research lanes that each discovered it in their own adjacency sweep
(#1587 from the VIX-expiration sweep, #1591 from the opex sweep). Both are `never-assessed` and both
dispatched a research session **today**, in parallel — verified in this session's own
`event-scan.mjs --due` output. Nothing catches it: `event-scan-validation.mjs` checks for a
duplicate **id**, which git's own filenames already make impossible, and has no same-date check at
all. On the market itself there is nothing to say and this session says it in one line: a closed
session cannot be traded, `symbols: []`, `impact: low`, the date is `estimate`, and a re-run grep of
both playbook docs returns zero calendar-keyed hits. What this session *did* add that no sibling
could: SIFMA's **2027** US schedule now reads from this runner (via the page's embedded payload, the
route the Good Friday ledger found), and it shows Presidents Day 2027-02-15 as a **full fixed-income
close with no flanking early close** — where Good Friday, Memorial Day, July 4th, Thanksgiving,
Christmas and New Year's all carry a 2:00 p.m. ET one. That turns the sibling entry's honest "2026
evidence about a pattern, not a 2027 assertion" into a 2027-sourced fact, and it makes this corridor
the clean inverse of the Good Friday one: **no cross-asset asymmetry on either flank.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session is not a position and there is nothing to size | High | D-163; `symbols: []`, `impact: low`, and a grep of `docs/plans/trade-playbooks.md` + `docs/research/multi-symbol-sweep.md` for `holiday\|washington\|presidents\|closure\|half-day\|early close` returns **0 hits in both**, run this session rather than inherited from the sibling ledgers | A house playbook that keys on holiday-adjacent sessions being written and back-tested before **2027-02-15** — the "nothing is calendar-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside; the live calendar item this week is `fomc-blackout-start-2026-09-05`, not a 2027 holiday** | High | Nothing in the 2026-09-07 → 2026-09-11 tape is keyed to a February-2027 closure, and the nearest thing that *is* live is the 2026-09-16 VIX settlement with its own ledger | NYSE republishing its holiday table with a 2027 Washington's Birthday other than **2027-02-15** before **2026-09-30** — re-fetched today, and independently reproducible from 5 U.S.C. 6103, so no mechanism for this exists |
| This month | **Consolidate the duplicate to one entry — this is the only actionable item on the sheet** | High | Two files, one shut day: both in today's `--due` list, both dispatched a session, and each will carry its own ledger, its own forward-test fragment and its own 30-day pulse cadence to D-15 then 7-day to the date (~8 assessments each) forever. The deterministic tiebreak is **first-merged wins** — #1587 landed 17:10:18 UTC, #1591 landed 17:11:27 UTC — and NYSE's own table names the row **"Washington's Birthday"**, so both rules pick this id | Either entry being removed, or a same-date validation check landing in `event-scan-validation.mjs`, observed on or before **2026-10-05** — the defect is fixed and this call retires. Registered as **FT-washingtons-birthday-market-closure-2027-02-15-1** |
| This quarter | **Carry "no cross-asset asymmetry" — this corridor is the inverse of the Good Friday one, not a copy of it** | Medium | SIFMA's published 2027 US schedule, read this session, gives Presidents Day a full bond close and an **empty** recommendation string; the six holidays that do carry a 2:00 p.m. ET flank in 2027 are Good Friday (Thu 03-25), Memorial Day (Fri 05-28), July 4th (Fri 07-02), Thanksgiving (Fri 11-26), Christmas (Thu 12-23) and New Year's (Fri 12-31) | SIFMA publishing an early-close recommendation adjacent to 2027-02-15 (Fri 02-12 or Tue 02-16) in place of the empty string now on its page, observed on or before **2027-02-12** — the flanks stop being clean and an execution guard is owed. Registered as **FT-washingtons-birthday-market-closure-2027-02-15-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to 2027-02-15. It is a closed session; the
  date is `estimate`, and date-keyed action requires `confirmed` regardless.
- **No execution guard on either flank** (`estimate`, SIFMA 2027 US panel fetched 2026-09-05):
  Friday **2027-02-12** and Tuesday **2027-02-16** are full sessions in *both* equities and fixed
  income. This is the one line worth carrying, because the sibling Good Friday ledger's guard makes
  the opposite look like the house pattern — it is not.
- **The corridor, counted mechanically:** the week of the closure is **4 sessions** — Tue **02-16**,
  Wed **02-17** (February VIX/VXM SOQ, `vix-expiration-2027-02-17`, **confirmed**), Thu 02-18, Fri
  **02-19** (February monthly equity expiration `opex-2027-02-19` + `japan-cpi-2027-02-19`, both
  `estimate`). Two auctions of consequence in four sessions.
- **The structural fact this entry exists to supply, verified this session:** 2027-02-15 falls
  **inside** the 30-day SOQ strip of the *January* VIX contract **VX/F7** (settles 2027-01-20 per
  Cboe's own settlement CSV; strip 2027-01-21 → 2027-02-19), putting that strip at **21 trading
  sessions against a clean 22** — and **outside** the February contract **VX/G7**'s strip
  (2027-02-18 → 2027-03-19, holiday-clean at **22**). That contrast is the data source for the
  paired richness test `FT-vix-expiration-2027-02-17-1`.
- **Attribution trap:** a move on Tuesday **2027-02-16** has a three-day-weekend explanation, a
  VIX-settlement-eve explanation and an opex-week-positioning explanation before it has any single
  one. Never let a post-hoc read promote a hypothesis.

## Initial research

### The question

Does a day the market is shut earn a calendar row, and does the structural claim this entry was
seeded on — that 2027-02-15 sits inside the January VIX contract's settlement strip and opens a
four-session week carrying two expirations — survive being counted rather than asserted?

**One-line verdict:** the structural claim **survives verbatim**, and it is not the most important
thing in this document — **the calendar carries this same shut Monday twice**, and no gate in the
repo can see it.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. Nothing below is taken from the two sibling ledgers on faith; every primary was
re-fetched and every count recomputed in this session:

- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302, 109,180 bytes (needs
  `curl -L`). The Washington's Birthday row parses against the 2026 / 2027 / 2028 headers as
  `Monday, February 16` / `Monday, February 15` / `Monday, February 21`, with **no footnote
  marker** on the row (the `***` / `****` markers belong to Thanksgiving and Christmas), so the
  page recommends no early close on any adjacent session.
- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, 298,926 bytes,
  parsed out of the page's own escaped Next.js payload because the 2027 tab renders empty in the
  plain text. This is the source of the headline cross-asset find and the route that makes it
  readable at all.
- **Cboe** `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04` — HTTP 200,
  1,731 bytes; used to fix the VIX contract settlement dates the strip arithmetic depends on.
- **Cboe** `cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv` — HTTP 200, 472,309
  bytes; VIX close **14.53** on 2026-09-04, read direct rather than inherited from a sibling ledger.
- **Computed, not sourced:** every session count by weekday arithmetic with the full 2027 NYSE
  holiday set removed; the third-Monday and third-Friday placements for February 2027.
- **Read in-repo:** `scripts/event-scan-validation.mjs`, `scripts/event-scan.mjs --due`, and both
  `src/domain/market-events/*-2027-02-15.json` files, plus `git log` merge timestamps for #1587
  and #1591.

### Conviction legs, tested

1. **The date is right, on two independent primaries plus arithmetic — SUPPORTED (and still
   `estimate`).** NYSE's holiday table gives Monday **2027-02-15**. SIFMA's 2027 US schedule
   independently carries `Presidents Day — Monday, February 15, 2027`. 5 U.S.C. 6103 fixes
   Washington's Birthday on the third Monday of February; February 2027 begins on a Monday, so its
   Mondays are the 1st, 8th, **15th** and 22nd, and the same rule reproduces NYSE's 2026-02-16 and
   2028-02-21 rows. **Why it stays `estimate`:** the prefix taxonomy in `market-events-data.ts`
   (`IR:`/`CAL:`/`BLS:`/`FED:`/`PJM:`/`SEC:`/`TSY:`/`OCC:`/`BEA:`/`CENSUS:`/`ISM:`/`CB:`/`UMICH:`)
   has no slot for an exchange holiday calendar, and this lane may not self-confirm an event it
   discovered in-sweep. The label is about the taxonomy, not the evidence — and since every honest
   call here is a stand-aside, it costs nothing.

2. **The calendar carries this shut day twice — SUPPORTED, and it is the finding of this
   document.** `src/domain/market-events/` holds both
   `washingtons-birthday-market-closure-2027-02-15.json` and
   `presidents-day-market-closure-2027-02-15.json`: same `date`, same `kind` (`sector`), same
   `impact` (`low`), same `symbols` (`[]`), same `status` (`estimate`), same NYSE row as their
   source, same discovery date. They differ only in id, title wording and the notes each sweep
   happened to write. Provenance, from `git log`:

   | Entry | Seeded by | PR | Merged (UTC) |
   |---|---|---|---|
   | `washingtons-birthday-…` (this one) | `vix-expiration-2027-02-17` sweep | **#1587** | 2026-09-05 **17:10:18** |
   | `presidents-day-…` | `opex-2027-02-19` sweep | **#1591** | 2026-09-05 **17:11:27** |

   Sixty-nine seconds apart. Two lanes, each correctly running its own mandatory adjacency sweep on
   its own corridor, each finding the same NYSE row, neither able to see the other's open branch.
   This is not a lane behaving badly — it is the predictable output of parallel sweeps over
   overlapping corridors with no cross-lane dedupe.

3. **Nothing in the repo can catch it — SUPPORTED, read rather than assumed.**
   `scripts/event-scan-validation.mjs`'s `validateEvent` pushes `duplicate id` when an id repeats,
   and `validateFileNames` checks a file is named for its own id. Since one event is one file named
   by its id, **git itself already makes a duplicate id impossible** — the check that exists can
   never fire, and the failure mode that actually occurred (two ids, one real-world event) has no
   check at all. There is no same-date, same-kind, or near-duplicate-title test in the file.

4. **The measurable cost — SUPPORTED, computed against `assessment-cadence.json`.** Both entries
   are `never-assessed` and both appear in this session's own `event-scan.mjs --due` output, so the
   duplication has *already* spent two parallel research sessions today. Forward: `impact: low`
   bands are 30-day intervals down to D-15 and 7-day after, so from D-163 to the date each entry
   draws roughly **8 assessments** plus one close-out. Deterministic screening absorbs most of
   them — but its staleness ceiling forces every third screen material, so on the order of **2–3
   full duplicate Claude sessions** and ~8 duplicate commits are already scheduled. The user-facing
   cost is worse than the compute: the observatory's event calendar will render one closed Monday
   as two separate events, which is exactly the kind of thing CLAUDE.md's domain-accuracy rule
   exists to prevent.

5. **Which id should survive — SUPPORTED by two rules that agree.** (a) **First-merged wins** is
   the only tiebreak available to two lanes that cannot see each other: #1587 landed 69 seconds
   before #1591, so this entry is senior. (b) **NYSE's own table names the row "Washington's
   Birthday"** — and so does the statute — while "Presidents Day" is the colloquial name SIFMA
   happens to use. Both rules select `washingtons-birthday-market-closure-2027-02-15`. **This is a
   recommendation, not an action, and it is deliberately not self-serving in effect:** the sibling
   entry's notes are *richer* than this one's on the opex-week arithmetic (the 43%-of-years
   seasonal check, the five-sessions-but-seven-calendar-days decay asymmetry, the proof that a
   Monday holiday cannot move the expiration), and any consolidation must **merge those notes into
   the survivor, not discard them**.

6. **The seeded structural claim survives being counted — SUPPORTED.** Cboe's settlement CSV fixes
   `VX/F7` at **2027-01-20** and `VX/G7` at **2027-02-17**, so the 30-day strips are exactly:

   | Contract | Settles | 30-day strip | Calendar days | Trading sessions | Holiday inside |
   |---|---|---|---|---|---|
   | `VX/Z6` | 2026-12-16 | 2026-12-17 → 2027-01-15 | 30 | **21** | Christmas, New Year's |
   | `VX/F7` | 2027-01-20 | 2027-01-21 → 2027-02-19 | 30 | **21** | **Washington's Birthday 02-15** |
   | `VX/G7` | 2027-02-17 | 2027-02-18 → 2027-03-19 | 30 | **22** | none |
   | `VX/H7` | 2027-03-17 | 2027-03-18 → 2027-04-16 | 30 | **21** | Good Friday 03-26 |

   The seeding note's numbers reproduce exactly: F7 at 21 against G7's clean 22, with 2027-02-15
   three days *outside* G7's strip. This is what makes G7 the control in
   `FT-vix-expiration-2027-02-17-1`, and this entry is that test's data source.

7. **A genuine cross-asset finding, and it is the *absence* of one — SUPPORTED, and it is new.**
   SIFMA's 2027 US panel gives Presidents Day 2027-02-15 a full fixed-income close with an
   **empty** recommendation string, against six 2027 holidays that each carry a 2:00 p.m. ET flank:
   Good Friday (Thu 03-25), Memorial Day (Fri 05-28), Independence Day (Fri 07-02), Thanksgiving
   (Fri 11-26), Christmas (Thu 12-23), New Year's (Fri 12-31). So Fri 02-12 and Tue 02-16 are full
   sessions in both asset classes and there is **no** guard to write — the exact inverse of
   `good-friday-market-closure-2027-03-26`, whose Thursday flank loses its bond reference at 14:00
   ET. The sibling `presidents-day-…` entry's notes record this as unresolved ("the 2027 tab panel
   renders empty from this runner… that is 2026 evidence about a pattern, not a 2027 assertion");
   parsing the page's embedded payload rather than its rendered text resolves it on 2027's own data.

8. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep
   of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|washington|presidents|closure|half-day|early close` returns **zero hits in both files**,
   run this session. No playbook can fire on this date in either direction.

### What plays the conditions support

None. A closed session cannot be traded, `symbols` is empty, impact is `low`, and the date is
`estimate`. The supported outputs are the four in the signals list — the no-guard-on-either-flank
finding, the four-session corridor, the F7-vs-G7 strip contrast, and the Tuesday 02-16 attribution
trap — plus one calendar repair that is not a trade at all.

### Honest limits

- **The consolidation is a recommendation this lane cannot execute.** One file per event means this
  session may write only `washingtons-birthday-market-closure-2027-02-15.json`; touching the
  sibling entry is exactly the cross-lane write the one-file rule exists to forbid, and its own
  research session is running in parallel right now. The escalation ceiling here is a PR.
- **This session did not re-derive the sibling's opex-week arithmetic.** The 43%-of-years seasonal
  check and the calendar-span decay asymmetry are recorded in the `presidents-day-…` notes and are
  *not* independently verified here; they are cited as content that must survive consolidation, not
  as legs of this document.
- **MLK Day 2027-01-18 is a third un-filed NYSE closure sitting 2 days from
  `fomc-blackout-start-2027-01-16`,** and it is deliberately **not** proposed in this PR. Filing a
  third closure entry while the calendar's closure-entry policy is demonstrably producing
  duplicates would be the wrong order of operations. It is banked here as an open question for
  whoever settles the policy, not as an omission.
- **The CME and OCC legs are missing.** No attempt was made to establish futures or options-clearing
  hours for 2027-02-15; the two sibling ledgers that tried CME this week got HTTP 403 from this
  runner. Equity-index futures are widely understood to observe an abbreviated schedule on US
  holidays, but "widely understood" is not a source and nothing is asserted.
- **Four of the five events in this corridor are `estimate`,** including this one. Estimates widen
  caution and license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside on the market, permanently and structurally — and treat the
duplicate calendar entry as the one live item. Concretely: (a) the market call is a refusal, and it
is not close: closed session, `symbols: []`, `impact: low`, `estimate` date, zero calendar-keyed
playbooks. (b) The load-bearing fact is that **`washingtons-birthday-market-closure-2027-02-15` and
`presidents-day-market-closure-2027-02-15` are one NYSE holiday filed twice**, invisible to
`event-scan-validation.mjs`, already costing two parallel sessions and scheduled to cost ~8 more
each. The deterministic resolution is first-merged-wins (this entry, by 69 seconds) with the sibling
entry's richer opex notes **merged in, not dropped** — and the prevention is a same-date check in
`event-scan-validation.mjs`, where the only duplicate check today is one git already enforces.
(c) The one cross-asset statement worth carrying is a negative: SIFMA's **2027** schedule gives this
holiday **no flanking early close**, so both flanks are clean in both asset classes — the inverse of
the Good Friday corridor. Every trading-adjacent statement here carries the event's **`estimate`**
label.

**Kill switches:**

- **Either 2027-02-15 entry is removed, or a same-date/near-duplicate check lands in
  `event-scan-validation.mjs`** — the headline finding is resolved and this stance collapses to an
  ordinary structural stand-aside. Registered as
  **FT-washingtons-birthday-market-closure-2027-02-15-1**, score by 2026-10-05.
- **SIFMA revises the 2027 Presidents Day recommendation** to carry a flanking early close (Fri
  02-12 or Tue 02-16) — the clean-flanks finding inverts and an execution guard is owed. Registered
  as **FT-washingtons-birthday-market-closure-2027-02-15-2**, score by 2027-02-12.
- **NYSE republishes its holiday table with a different 2027 Washington's Birthday date** —
  everything here re-dates. (No mechanism exists; the third Monday is computable. Listed for
  completeness.)
- **A house playbook that keys on holiday-adjacent sessions is written and back-tested** — leg 8
  goes stale and the stand-aside is re-argued on measured data rather than on absence.
- **Cboe relists `VX/F7` or `VX/G7` on different settlement dates** — the 21-vs-22 strip contrast in
  leg 6 re-computes, and `FT-vix-expiration-2027-02-17-1` loses its control.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 163 | **Initial research.** Date double-primaried (NYSE holiday table re-fetched, no footnote on the row; SIFMA 2027 US panel) + 5 U.S.C. 6103 third-Monday check — stays `estimate` on the taxonomy gap alone. **Headline: this shut day is on the calendar TWICE** — this entry (seeded by #1587, merged 17:10:18Z) and `presidents-day-market-closure-2027-02-15` (#1591, 17:11:27Z) are the same NYSE row, same kind/impact/status/symbols; both are in today's `--due` list and both dispatched a session. `event-scan-validation.mjs` checks only for a duplicate **id**, which git's filenames already prevent — no same-date check exists. Resolution proposed (not executed — one-file-per-event): first-merged-wins keeps this id, NYSE's own naming agrees, and the sibling's richer opex-week notes must be merged in. **New find:** SIFMA's 2027 panel (parsed from the page's embedded payload; the rendered 2027 tab is empty) gives Presidents Day a full bond close with **no flanking early close**, vs six 2027 holidays that carry a 2:00 p.m. ET flank — resolving what the sibling entry could only call a 2026 pattern, and making both flanks clean in both asset classes. Strip arithmetic re-verified off Cboe's settlement CSV: `VX/F7` (settles 2027-01-20) = **21** sessions with 02-15 inside; `VX/G7` = **22**, clean. Adjacency — peers: n/a (`symbols: []`); macro: no US release datable to 2027-02-15 (BLS/BEA publish no 2027 schedule yet), Japan CPI prints 02-19; VIX **14.53** (close 2026-09-04, Cboe history CSV); geopolitical: none dated to this corridor; tape: 4-session week Tue 02-16 / Wed 02-17 (VIX SOQ, confirmed) / Thu 02-18 / Fri 02-19 (opex + Japan CPI). CME/OCC hours not attempted. **No new calendar file proposed** — MLK 2027-01-18 is a third un-filed closure but filing it while closure entries are duplicating would be the wrong order. | Initial stance set: **stand aside** on the market; the duplicate entry is the live item. Registers **FT-washingtons-birthday-market-closure-2027-02-15-1** and **-2**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
