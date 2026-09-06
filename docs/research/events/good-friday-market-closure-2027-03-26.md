# US equity markets closed — Good Friday (falls BEFORE quarter-end in 2027) — good-friday-market-closure-2027-03-26

**Kind:** sector · **Date:** 2027-03-26 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table, re-fetched 2026-09-05; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["ftc-v-amazon-antitrust-trial-2027-03-29","japan-cpi-tokyo-flash-2027-03-26","sifma-bond-early-close-2027-03-25"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside, and delete most of the reason this entry was filed.** The seeding note
(written during the `opex-2027-03-19` sweep) argued that Good Friday landing in March compresses
both the post-witching unpin window and quarter-end. Counting actual sessions this session
**refutes most of that**. The witching→quarter-end corridor is **7 sessions in 2027 — identical to
2026's 7, and more than 2025's 6**; the "3-session stub week" is a consequence of March 31 falling
on a Wednesday, not of the closure, and 2027's 3-session stub is *longer* than 2026's 2 and 2025's
1. Exactly **one** compression leg survives: the week after the witching is **4 sessions (Mon 03-22
→ Thu 03-25) instead of 5**. What the sweep did NOT know, and what is the real find here, is a
**cross-asset schedule asymmetry on Thursday 2027-03-25**: SIFMA's published 2027 US recommendation
(fetched from its own page today) is a **full** fixed-income close on Good Friday **plus an early
close at 2:00 p.m. ET on Thursday 03-25** — so the last session before the holiday runs a full
equity day against a bond tape that shuts two hours early. That is the opposite configuration from
**2026**, where SIFMA recommends **no** full close and a **12:00 p.m. ET half session on Good Friday
itself** (2026-04-03 is a first-Friday jobs date; 2027-03-26 is not). Nothing here is tradeable: the
date is `estimate`, no house playbook is calendar- or holiday-keyed (re-grepped to zero hits this
session), and `symbols: []`. The honest output is one corrected framing, one execution guard, one
proposed calendar entry and one registered forward test.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session is not a position, and there is nothing to size | High | D-202; `symbols: []`, `impact: low`, and a grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `holiday\|good friday\|closure` returns **0 hits** in both — re-run this session, not cited from the sibling ledger | A house playbook that keys on holiday-adjacent sessions being written and back-tested before **2027-03-26** — the "nothing is calendar-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside; correct the sibling ledger's framing, don't act on it** | High | The live calendar item this week is `fomc-blackout-start-2026-09-05`, not a 2027 holiday. The one thing worth doing now is written down, not traded: the compression thesis this entry was filed on is mostly arithmetic that holds without the closure | Any session count in the table below failing to reproduce from NYSE's own 2027 holiday table before **2026-09-30** — the corrective legs collapse and the seeding note stands |
| This month | **Watch the promotion, not the tape** — this entry is now double-primaried and still cannot be confirmed | Medium | Two independent primaries now date it (NYSE holiday table; SIFMA's 2027 US schedule) plus a Gregorian-Easter computation, and Cboe lists Good Friday as an options-exchange closure. It stays `estimate` only because `market-events-data.ts`'s prefix taxonomy has no slot for an exchange holiday calendar and this lane may not self-confirm an in-sweep discovery | A `NYSE:`-class (or equivalent exchange-calendar) prefix being added to the source taxonomy before **2026-10-05** — the entry promotes to `confirmed` and this call retires |
| This quarter | **Do not carry "compressed quarter-end" forward; carry the Thursday 03-25 asymmetry instead** | Medium | Sessions witching→quarter-end: 2027 = **7**, 2026 = **7**, 2025 = 6, 2024 = 9, 2023 = 10. The corridor is mid-range, not compressed. What IS unusual is Thu 03-25 running a full equity session against a SIFMA-recommended 2:00 p.m. ET bond close | SIFMA publishing a **12:00 p.m. ET early close on Good Friday 2027-03-26 itself** (the 2026 shape) in place of the full close now on its page, observed on or before **2027-03-25** — the asymmetry inverts. Registered as **FT-good-friday-market-closure-2027-03-26-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-03-26. It is a closed session; the date is
  `estimate`, and date-keyed action requires `confirmed` regardless.
- **Execution guard (Thu 2027-03-25):** equities trade a full session; SIFMA recommends fixed
  income close at **2:00 p.m. ET** (`estimate`, SIFMA 2027 page fetched 2026-09-05). Anything
  cross-asset — a rate-sensitive hedge, a duration leg against an equity leg — loses its bond-side
  reference two hours before the equity close. A timing caution, never a signal.
- **Execution guard (Thu 03-25 evening):** the Tokyo March CPI flash + FY2026 Tokyo fiscal yearly
  average (`japan-cpi-tokyo-flash-2027-03-26`, `estimate`) prints 08:30 JST = **19:30 ET Thursday**,
  after the US equity close and with **no** Friday session to price it. First US venue open is
  Monday **2027-03-29**.
- **The corrected count, to stop it being re-derived wrong:** post-witching week = **4 sessions**
  (03-22 → 03-25). Witching → quarter-end = **7 sessions**, the same as 2026. Q1 final week =
  **3 sessions** (03-29/30/31), which is *longer* than 2026's 2 and 2025's 1.
- **The rule-keyed quarter-end flows do NOT move.** The SEC-filed Select Sector secondary-reweight
  test is the *second-to-last business day of March* (**Tue 2027-03-30**), effective after the
  *last* (**Wed 2027-03-31**) — re-fetched verbatim from EDGAR this session. Removing 03-26 from
  the month changes neither date.
- **Attribution trap:** a gap on Monday **2027-03-29** has a Tokyo-CPI explanation, a three-day-
  weekend explanation, a quarter-end-rebalance explanation and an FTC-v-Amazon-trial explanation
  (trial opens 03-29) before it has any single one. Never let a post-hoc read promote a hypothesis.

## Initial research

### The question

The seeding entry filed this closure on a specific thesis: Easter 2027 is early, so Good Friday
lands in March *between* the quarterly triple witching and quarter-end, and the post-witching
"unpin" and quarter-end rebalancing flows are therefore "compressed into fewer sessions than the
same corridor carries in a normal quarter." Is that true, and does a day the market is shut earn a
calendar row at all?

**One-line verdict:** the thesis is **mostly wrong on the arithmetic and right for a reason it did
not name** — the witching→quarter-end corridor and the quarter-end stub week are *not* compressed
(both are at or above their 2025/2026 values), only the post-witching week is (4 sessions vs 5); the
finding that actually justifies the row is a cross-asset schedule asymmetry on **Thursday
2027-03-25** that no prior ledger in this repo has recorded.

### Method

Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. This session did not take the seeding note's conclusions on faith; it fetched
primaries and computed the session counts mechanically:

- **NYSE** `nyse.com/markets/hours-calendars` — holiday table re-read; the Good Friday row gives
  Friday **April 3, 2026** / Friday **March 26, 2027** / Friday **April 14, 2028**, and the
  early-close list (1:00 p.m. ET) carries **no** entry adjacent to 2027-03-26.
- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` (HTTP 200, 298,926 bytes),
  parsed out of the page's own embedded payload because the 2027 panel is a hidden tab that the
  rendered text drops — this is the source of the headline find, and both years were read.
- **SIFMA** press release *"SIFMA changes early close recommendation policy"* — for the stated
  policy behind Good-Friday-adjacent early closes.
- **SEC EDGAR** Select Sector SPDR Trust Form 497, accession `0001193125-26-031948`
  (HTTP 200, 226,434 bytes after a 403 on a non-compliant User-Agent) — both rebalance clauses
  re-extracted verbatim rather than quoted from the sibling `opex-2027-03-19` ledger.
- **Cboe** `cboe.com/about/hours/us-options/` — options-exchange holiday list.
- **BLS** `bls.gov/schedule/news_release/` — to test whether any US statistical release lands on
  2027-03-26.
- **Attempted and failed, recorded rather than worked around:** `cmegroup.com` holiday calendar and
  its 2026 Good Friday clearing advisory PDF (HTTP 403 to this runner, twice, plus a WebFetch
  timeout); Cboe's 2026/2027 holiday-calendar PDFs on `cdn.cboe.com` (HTTP 403).
- **Computed, not sourced:** Easter by the anonymous Gregorian algorithm for 2026–2028, and every
  session count below by weekday arithmetic with the Good Friday closure removed.

### Conviction legs, tested

1. **The date is right, and now rests on two independent primaries — SUPPORTED (and still
   `estimate`).** NYSE's own holiday table gives Friday 2027-03-26. SIFMA's 2027 US schedule
   independently carries `Good Friday — Friday, March 26, 2027`. Cboe lists Good Friday as a US
   options-exchange closure. The anonymous Gregorian algorithm returns Easter 2027 = **2027-03-28**
   (→ Good Friday 2027-03-26) and reproduces 2026-04-05 / 2028-04-16, matching the NYSE rows for
   both neighbouring years. **Why this stays `estimate`:** the prefix taxonomy in
   `market-events-data.ts` (`IR:`/`CAL:`/`BLS:`/`FED:`/`PJM:`/`SEC:`/`TSY:`/`OCC:`/`BEA:`/
   `CENSUS:`/`ISM:`/`CB:`/`UMICH:`) has no slot for an exchange holiday calendar, and this lane may
   not self-confirm an event it discovered in-sweep. The label is about the taxonomy, not the
   evidence — and since every honest call here is a stand-aside, it costs nothing.

2. **"The post-witching unpin window is compressed" — SUPPORTED, and it is the only surviving
   compression leg.** The week following the 2027-03-19 witching runs Mon **03-22**, Tue 03-23, Wed
   03-24, Thu **03-25** — **4 sessions**, against 5 in each of 2023, 2024, 2025, 2026 and 2028.
   That is a real, closure-caused difference and it is exactly what the sibling ledger's
   `FT-opex-2027-03-19-1` measures.

3. **"Quarter-end flows are compressed into fewer sessions" — REFUTED.** Sessions strictly after the
   March witching through the last business day of March, holiday removed:

   | Year | Good Friday | 3rd Fri Mar | Last biz day Mar | Witching → quarter-end | Post-witching week |
   |---|---|---|---|---|---|
   | 2023 | 04-07 | 03-17 | 03-31 | 10 | 5 |
   | 2024 | **03-29** | 03-15 | 03-28 | 9 | 5 |
   | 2025 | 04-18 | 03-21 | 03-31 | 6 | 5 |
   | 2026 | 04-03 | 03-20 | 03-31 | **7** | 5 |
   | **2027** | **03-26** | 03-19 | 03-31 | **7** | **4** |
   | 2028 | 04-14 | 03-17 | 03-31 | 10 | 5 |

   2027's corridor is **7 sessions — identical to 2026's and one more than 2025's**. It is
   mid-range, not compressed. The seeding note conflated "one session removed from one week" with
   "the whole corridor shortened"; removing 03-26 costs the corridor a session it had slack for.

4. **"The quarter's final week is a 3-session stub" — TRUE BUT MIS-ATTRIBUTED, so REFUTED as
   evidence.** Q1 2027 ends Wednesday 2027-03-31, so the final week is Mon 03-29 / Tue 03-30 / Wed
   03-31. That is arithmetic on which weekday March 31 falls, entirely independent of the closure
   two weeks earlier. Recent Q1 final weeks: **2025 = 1 session**, **2026 = 2**, **2027 = 3**,
   2024 = 4, 2023 and 2028 = 5. 2027's stub is *longer* than either of the two years before it —
   the opposite of the point the seeding note used it to make.

5. **The rule-keyed quarter-end flows are unmoved by the closure — SUPPORTED.** The SEC 497 states
   verbatim that "the rebalancing of the Select Sector Indices … occurs at the closing prices of the
   second Friday of March, June, September and December. Changes will become effective after the
   market close on the third Friday," and separately that a conditional secondary reweighting is
   tested on "the second to last business day of March, June, September, or December … with the
   reweighting effective date being after the close of the last business day of the month." For Q1
   2027 that is a **Tue 2027-03-30** test and a **Wed 2027-03-31** effective close. Deleting
   Friday 03-26 from March changes neither — the last two business days are unaffected.

6. **A genuine cross-asset asymmetry on Thursday 2027-03-25 — SUPPORTED, and it is new.** SIFMA's
   published 2027 US recommendation, read out of its own page today, is:
   `Good Friday | Friday, March 26, 2027 | Early Close (2:00 p.m. Eastern Time): Thursday, March 25,
   2027` — a **full** fixed-income close on the holiday plus a two-hour-early bond close the day
   before. Its 2026 entry has the opposite shape: `Good Friday | Early Close (12:00 p.m. Eastern
   Time): Friday, April 3, 2026`, i.e. **no full close at all** and a bond half-session on Good
   Friday itself. So 2027-03-25 is a full equity day whose fixed-income reference disappears at
   14:00 ET, and 2027-03-26 is dark in both asset classes. SIFMA's own policy release states early
   closes "around the Good Friday, Memorial Day, Thanksgiving (day after), Christmas and New Year's
   Day holidays will remain unchanged in recognition of the very limited global activity late on
   those days" — which explains the *Thursday* early close but **not** the 2026-vs-2027 difference.

7. **Why 2026 and 2027 differ — PLAUSIBLE INFERENCE, explicitly not sourced.** 2026-04-03 is the
   **first Friday** of April, the standing slot for the March employment report (this calendar's own
   jobs entries are all first Fridays: 2026-09-04, 10-02, 11-06, 12-04). 2027-03-26 is the **last**
   Friday of March; the March-2027 jobs report would fall 2027-04-02. A bond market held open to
   noon for a payrolls print, and fully closed when there is none, fits both rows exactly — but
   **SIFMA states no such rule** in the policy release fetched, so this is a reading of two data
   points, not a sourced mechanism. It is the reasoning behind the forward test, not a finding.

8. **No US statistical release can be shown to land on 2027-03-26 — UNRESOLVED, and it will stay
   that way for months.** BLS publishes no 2027 schedule yet (`bls.gov/schedule/news_release/`
   lists 2026 months only; the 2027 URL 404s), and BEA's full schedule ends at **2026-12-23**. So
   the question the 2026 comparison makes interesting — does a major print land into a shut equity
   tape — is simply unanswerable today and is left open rather than guessed. The one dated release
   this calendar *does* carry on 2027-03-26 is Japanese: `japan-cpi-tokyo-flash-2027-03-26`
   (`estimate`), 08:30 JST = 19:30 ET Thursday 03-25.

9. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep
   of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|good friday|closure|half-day|early close` returns **zero hits in both files**, run this
   session. No playbook can fire on this date in either direction.

### What plays the conditions support

None. A closed session cannot be traded, `symbols` is empty, impact is `low`, and the date is
`estimate`. The supported outputs are the four already in the signals list: the Thursday 03-25
cross-asset execution guard, the Thursday-evening Tokyo-print guard, the corrected session counts,
and the Monday 03-29 attribution trap.

### Honest limits

- **The CME leg is missing.** Two attempts at CME's holiday calendar and its Good Friday clearing
  advisory returned HTTP 403 / timed out, so this ledger does **not** assert what CME Globex does
  on the Thursday evening of 2027-03-25 or on Good Friday itself. Equity-index futures are widely
  understood to be shut on Good Friday, but "widely understood" is not a source and it is left
  unstated rather than asserted. First pulse with a working CME fetch closes it.
- **The Thursday-shift expiration question is open.** Weekly options that would expire 2027-03-26
  conventionally roll to the preceding business day, but no Cboe rule text stating that was
  retrievable (the exchange-notice URL 404s, the holiday PDFs 403). Not claimed here.
- **Leg 7 is inference, not evidence** — see above. It is the hypothesis the forward test exists to
  settle.
- **Six of the events in this corridor are `estimate`,** including this one. Estimates widen
  caution and license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside, permanently and structurally — this row exists to hold a
corrected framing and two execution guards, not a view. Concretely: (a) the compression thesis this
entry was seeded on survives only for the **post-witching week (4 sessions vs 5)**; the
witching→quarter-end corridor (7) and the Q1 final week (3) are at or above their 2026 values and
are **not** evidence of anything. (b) The load-bearing new fact is that SIFMA's published 2027
recommendation makes 2027-03-26 a **full** fixed-income close with a **2:00 p.m. ET early close on
Thursday 2027-03-25** — the inverse of 2026's noon half-session on the holiday itself — so the last
pre-holiday session carries a cross-asset schedule asymmetry. Every statement here carries the
event's **`estimate`** label.

**Kill switches:**

- **SIFMA revises the 2027 Good Friday recommendation** to an early close on 2027-03-26 itself (the
  2026 shape) — the asymmetry inverts and guard (b) is rewritten. Registered as
  **FT-good-friday-market-closure-2027-03-26-1**, score by 2027-03-25.
- **NYSE republishes its holiday table with a different 2027 Good Friday date** — everything here
  re-dates. (No mechanism for this exists; Easter is computable. Listed for completeness.)
- **A house playbook that keys on holiday-adjacent sessions is written and back-tested** — leg 9
  goes stale and the stand-aside is re-argued on measured data rather than on absence.
- **A US statistical agency publishes a 2027 schedule placing a major release on 2027-03-26** —
  leg 8 resolves and this event stops being purely structural.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 202 | **Initial research.** Date double-primaried (NYSE holiday table; SIFMA 2027 US schedule) + Gregorian-Easter check — stays `estimate` on the taxonomy gap alone. **Seeding thesis largely refuted:** witching→quarter-end = **7** sessions (2026 = 7, 2025 = 6) and the Q1 final week = **3** (2026 = 2, 2025 = 1); only the post-witching week is genuinely short (**4 vs 5**). **New find:** SIFMA 2027 = full bond close 03-26 **plus 2:00 p.m. ET early close Thu 03-25**, vs 2026's 12:00 p.m. half-session on Good Friday itself — a cross-asset asymmetry on 03-25. SEC 497 re-fetched: quarter-end reweight test 03-30 / effective 03-31, unmoved by the closure. Adjacency — peers: n/a (`symbols: []`); macro: no US release datable to 03-26 (BLS has no 2027 schedule; BEA ends 2026-12-23), Tokyo CPI flash prints 19:30 ET Thu 03-25 into no US session; VIX **14.53** (close 2026-09-04); geopolitical: none dated to this corridor; tape: `ftc-v-amazon-antitrust-trial-2027-03-29` opens the next session. CME holiday hours **unretrievable** (403 ×2 + timeout) — the futures leg is left unstated. Proposes `sifma-bond-early-close-2027-03-25.json` (`estimate`). | Initial stance set: **stand aside** (structural row only). Registers **FT-good-friday-market-closure-2027-03-26-1**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
