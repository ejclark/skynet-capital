# VIX futures and options February 2028 expiration (SOQ settlement) — vix-expiration-2028-02-16

**Kind:** opex · **Date:** 2028-02-16 (estimate, EST: Cboe's VX specification read direct this session, and its holiday clause tested exhaustively for the first time in this class — 296 of 296 settlement Wednesdays over 2021-2026, with 13 predicted displacements matching 13 realized ones exactly. Stays `estimate` because `VX/G8` is not listed, the live strip stopping at `VX/K7` 2027-05-18, and because the OCC calendar carries no 2028 row) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["fomc-minutes-2028-02-16","opex-2028-02-18","presidents-day-market-closure-2028-02-21"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside on the event, and take the date — this ledger's contribution is that the part of
the settlement rule nobody had tested is now the part that is tested best.** Every prior lane in this class
validated *which Wednesday* a monthly settles on, and each one then asserted the **holiday clause** — the
sentence that decides whether that Wednesday holds or slips to a Tuesday — from the specification's words
alone. Reading the spec direct this session turns up the licence to test it: the same paragraph governs
**weekly** VX contracts, so the clause applies to **every** settlement Wednesday, not twelve a year. Run
against Cboe's own settlement file over the **296** settlement Wednesdays of 2021–2026, the clause is
**296 for 296**: it predicts **13** displacements, the file holds exactly **13** Tuesday settlements, the two
sets are **identical**, and every displaced Wednesday is **missing** from an otherwise-perfect weekly grid.
On February 2028 the clause does not fire — third Friday of March 2028 is **2028-03-17**, minus 30 days is
Wednesday **2028-02-16**, and neither leg is a holiday. The proposing lane's *conclusion* about February
survives; its *reason* is amended — February's Wednesday leg is structurally immune, but its **Friday leg is
not**, merely rare (last **2008**, next **2160**). The collision it flagged is **exact**: 2028-02-16 minus
21 days is **2028-01-26**, the scheduled January meeting's second day. Date stays **`estimate`** — `VX/G8`
is unlisted and the OCC file stops at 2027-12. **Nothing here licenses a position at D−525.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no position this event could be sized into | High | D−525, `symbols: []`, `impact: low`, and a re-grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `opex\|expiration\|witching\|volatility settlement\|SOQ` returns **zero hits in both**, run this session rather than inherited | A house vol/opex instrument built and back-tested before **2028-02-16** — the "nothing is settlement-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Carry 2028-02-16, and carry the clause as tested rather than asserted** | High | Cboe's spec read direct (HTTP 200, 461,361 B) applies its holiday clause to **weeklies as well as monthlies**, which turns 13 annual tests into **296**; the clause is **296/296** on `VRO_History.csv` 2021–2026, and February 2028 is clear on both legs | Any settlement Wednesday in that window shown to hold or slip against the clause's prediction — the exhaustive validation this whole ledger rests on breaks, and the date returns to being asserted |
| This month | **Amend the "February is structurally clean" reason, and keep the conclusion** | High | Washington's Birthday is always a Monday, so February's **Wednesday** leg cannot fire — but the **Friday** leg is the third Friday of March, which *can* be Good Friday. That last happened in **2008** (Good Friday 2008-03-21) and next happens in **2160**; the proposal's stated reason covered only one of the two legs | Good Friday computed at **2028-03-17** by any published Cboe or NYSE 2028 calendar — the Friday leg fires, settlement moves to Tuesday 2028-02-15, and this document re-dates |
| This quarter | **Expect the OCC's 2028 calendar to name 2028-02-16 — and treat a different date as the real warning** | Medium | The publisher's current file reproduces the full clause **35 of 36** (the sole residual being the contested 2027-12-15 row) and is **3 for 3** on February; the 2027 file's own note is dated 12/18/2025, so a 2028 file should publish around **2026-12** | The OIC/OCC 2028 Expiration Calendar publishing any February volatility row **other than 2028-02-16**. Registered as **FT-vix-expiration-2028-02-16-2**, score by **2027-02-28** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2028-02-16 VIX settlement. The date is
  `estimate`, and `estimate` widens caution rather than licensing anything.
- **Execution guard (Wed 2028-02-16), the only actionable line here:** nothing trades that day's opening
  auction. From Cboe's spec, read this session: *"Trading hours for expiring VX futures contracts end at
  8:00 a.m. Chicago time on the final settlement date"* — **09:00 ET** — and the SOQ is calculated *"from
  the sequence of 'opening trade prices' … of the constituent SPX options during the special opening
  auction."* Those prints are settlement artifacts, not information. Same guard all fourteen VIX siblings carry.
- **The deliverable, and it is a method upgrade the class keeps:** the holiday clause is testable on the
  **weekly grid**, because the specification's clause sentence sits under both the monthly and the weekly
  definition and says *"that Wednesday"*. Prior lanes had **13 tests a year**; this one has **52**.
- **The result:** **296 of 296** settlement Wednesdays, 2021-01-06 → 2026-09-02, behave exactly as the
  clause says. **13** predicted displacements, **13** realized Tuesday settlements, the sets **identical**,
  **zero** false positives and **zero** unexplained residual.
- **The amendment to the proposal, stated plainly:** *"February carries no holiday that can move the anchor,
  because Washington's Birthday is always a Monday"* is true of the **Wednesday** leg only. The **Friday**
  leg is the third Friday of March and it **can** be Good Friday — 2008 is the realized instance.
- **The collision is arithmetic, not coincidence:** **2028-02-16 − 21 days = 2028-01-26**, the second day of
  the FOMC's scheduled January 25–26 2028 meeting. The proposer measured the family's collision rate; this
  lane confirms this instance from the settlement side, exactly.
- **Sequencing, for anyone who later builds a window study:** the SOQ prints at the **open** (09:00 ET
  trading halt), the minutes at **14:00 ET**. The settlement is resolved hours before the release.
- **A mechanical detail no sibling has recorded:** a **displaced** settlement computes a **31-day** VIX, not
  a 30-day one — the spec requires the SOQ's time-to-expiration component to *"account for the actual number
  of days and minutes until expiration"*. 2028-02-16 is undisplaced, so its SOQ is a clean 30-day
  measurement against SPX options expiring **2028-03-17**.
- **Structural placement, not a call:** the 30-day reference window runs **2028-02-16 → 2028-03-17**,
  **22 trading sessions with one closure** (Washington's Birthday, 2028-02-21).
- **Configuration for the next pulse to diff against** (Cboe primaries, 2026-09-08 close): **VIX1D 10.43 ·
  VIX9D 14.81 · VIX 15.72 · VIX3M 18.39 · VVIX 88.69** — contango through the front. The listed VX strip
  runs **`U6` → `K7` (2027-05-18)**; **no 2028 contract is on it**, so no term-structure statement about
  this contract is available or made.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At D−525
  those describe a different expiry; they become quotable from roughly **2028-02-09**.

## Initial research

### The question

This id arrived as a **proposal from the January-minutes lane** —
[`fomc-minutes-2028-02-16`](fomc-minutes-2028-02-16.md)'s initial research — and it exists at all because
that lane needed to know whether its release lands on a settlement Wednesday, the one variable the family's
surviving statistic turns on. The proposal derived **2028-02-16** by rule, validated the rule two ways, and
declared February the clean month because *"February carries no holiday that can move the anchor, because
Washington's Birthday is always a Monday."*

That is a claim about the **holiday clause**, and the holiday clause is the one part of the settlement rule
this class has never tested. Nine sibling ledgers have validated *which Wednesday* a monthly settles on —
against `VRO_History.csv`, against publisher calendars, against Cboe's per-contract archive. Every one of
them then took the clause's behaviour on faith, from the words. The 2027-05-18 sibling saw it applied once,
on a live listing, and called that *"the clause's second leg, the one no prior ledger had seen applied."*

So the question this lane asks is: **is the holiday clause testable rather than assertable — and if it is,
does it hold, and does February 2028 survive it?** Underneath, a method question: every prior lane has had
at most **13 monthly settlements a year** to test against. Is there more data hiding in the same file?

**One-line verdict:** **2028-02-16**, and the clause is now the best-tested part of the rule rather than the
worst — because the specification applies it to **weekly** contracts too, which turns 13 tests a year into
**52**, and across **296** of them it is right **296 times** with no residual.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
no symbol-keyed instrument applies, and `scripts/research/` carries no settlement-shaped instrument
(`expiration-displacement.mjs` measures *equity-expiration volume*, a different mechanic, correctly not run).
Nothing was inherited: every primary was fetched raw this session and every number recomputed, including the
proposal's own claims.

**Primaries fetched raw and parsed by machine today (2026-09-09), all HTTP 200:**

- **Cboe VX contract specification** `cboe.com/tradable_products/vix/vix_futures/specifications/`
  (**461,361 bytes**, following the site's 302) — the *Final Settlement Date*, holiday-clause, *Termination
  of Trading* and *Final Settlement Value* text read verbatim out of the page's embedded payload.
- **Cboe VIX final-settlement series** `cdn.cboe.com/api/global/us_indices/daily_prices/VRO_History.csv`
  (**26,597 bytes**, **1,268 rows**, 2008-07-16 → 2026-09-02) — the test bed.
- **Cboe per-contract VX history files**
  `cdn.cboe.com/data/us/futures/market_statistics/historical_data/VX/VX_<expiry>.csv` — probed for every
  2028 date this ledger names, plus `VX_2027-05-18` as a positive control.
- **Cboe settlement CSV** `www.cboe.com/us/futures/market_statistics/settlement/csv` (**1,731 bytes**,
  56 rows) — the live strip.
- **Cboe index histories:** **VIX** (472,411 B), **VIX9D** (200,234), **VIX3M** (217,693), **VVIX**
  (108,519), **VIX1D** (54,020), through the 2026-09-08 close.
- **OIC / OCC expiration calendar JSON** `www.optionseducation.org/api/expirationcalendar` (**34,871
  bytes**, 155 dated rows) — **36** *Monthly Volatility Products Expiration date* rows.

**No fetch failed**, so `probe-ref.blocked` is empty. The 403s this session did see are the per-contract
endpoint answering *"no such contract"* for unlisted 2028 expiries — a designed response and a finding, not
a blocked source; `VX_2027-05-18.csv` returned 200 on the same endpoint in the same run, which is the
control that proves the endpoint was reachable.

**Own computation.** A clause engine implementing Cboe's rule over a statute-derived US market-holiday set
(including the Gregorian Easter computus for Good Friday and Juneteenth from 2022), applied to **every**
settlement Wednesday rather than to monthlies only; a weekday census of `VRO_History.csv`; and a
gap-structure decomposition by expiration month. Every figure below is reproducible from the sources named.

**House sources:** the one proposal for this id;
[`fomc-minutes-2028-02-16`](fomc-minutes-2028-02-16.md) for the collision statistic, cited and **not**
re-derived; [`vix-expiration-2027-12-22`](vix-expiration-2027-12-22.md) for the per-contract-endpoint method
and the OIC/OCC one-dataset correction; `docs/plans/trade-playbooks.md` and
`docs/research/multi-symbol-sweep.md` grepped. Genre model: [`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The rule was read, not cited — SUPPORTED, and it yields 2028-02-16.** Verbatim from today's fetch:

   > "The final settlement date for a contract with the "VX" ticker symbol is on the Wednesday that is 30
   > days prior to the third Friday of the calendar month immediately following the month in which the
   > contract expires. **The final settlement date for a futures contract with the "VX" ticker symbol
   > followed by a number denoting the specific week of a calendar year is on the Wednesday of the week
   > specifically denoted in the ticker symbol.**"
   >
   > "If that Wednesday or the Friday that is 30 days following that Wednesday is a Cboe Options holiday,
   > the final settlement date for the contract shall be on the business day immediately preceding that
   > Wednesday."

   Applied to `VX/G8`: third Friday of March 2028 = **2028-03-17** (a Friday); minus 30 days =
   **2028-02-16** (a Wednesday). Neither leg is a Cboe Options holiday — Washington's Birthday 2028 is
   Monday **2028-02-21**, and Good Friday 2028 is **2028-04-14**. The clause does not fire. Re-validated
   against eighteen years of prints: **218** rule-derived monthly settlements 2008-07 → 2026-08, **217**
   present in `VRO_History.csv`, the one absentee **2013-05-22** carrying no May-2013 row at any date —
   reproducing all three sibling implementations exactly.

2. **The clause governs weeklies too, so it is testable — SUPPORTED, and this is the leg that reframes the
   class.** The bolded sentence above is the licence. The clause sentence follows **both** definitions and
   says *"that Wednesday"*, without restricting itself to the monthly. So the clause is not a rule about
   twelve dates a year; it is a rule about **every** settlement Wednesday, and `VRO_History.csv` records
   every one of them. That is the difference between **13 tests a year** — what every prior ledger in this
   class had — and **52**.

   The file only supports this in the era where it carries a clean weekly grid. Its own row counts say when
   that is: **2008–2014 ≈ 12/yr** (monthlies only), **2015–2020 ranging 30 → 253/yr** (the weekly programme
   phasing in, and a dense 2017–2020 stretch carrying more than one settlement a week), then **2021–2025 at
   52–53/yr** — exactly one per Wednesday. The test window is therefore **2021-01-06 → 2026-09-02**, and
   choosing it on the file's own structure rather than on convenience is the point.

3. **The clause is right 296 of 296 — SUPPORTED, and it is the strongest result in this ledger.** Every
   settlement Wednesday in the window was scored: the clause predicts either *settles here* or *settles on
   the preceding business day*, and both halves were checked against the file — the predicted date present
   **and**, where displacement is predicted, the Wednesday absent.

   | | count |
   |---|---|
   | Settlement Wednesdays scored, 2021-01-06 → 2026-09-02 | **296** |
   | Consistent with the clause (predicted date present, displaced Wednesday absent) | **296** |
   | Displacements predicted | **13** |
   | Non-Wednesday settlements actually in the file | **13** — all Tuesdays |
   | The two sets identical | **yes** |
   | Unexplained holes in the Wednesday grid | **0** |

   The thirteen, each with the holiday that fires it:

   | Settlement Wednesday | moves to | leg | the Cboe Options holiday |
   |---|---|---|---|
   | 2021-03-03 | 2021-03-02 | Friday | Good Friday 2021-04-02 |
   | 2021-11-24 | 2021-11-23 | Friday | Christmas observed 2021-12-24 |
   | 2022-03-16 | 2022-03-15 | Friday | Good Friday 2022-04-15 |
   | 2023-03-08 | 2023-03-07 | Friday | Good Friday 2023-04-07 |
   | 2024-02-28 | 2024-02-27 | Friday | Good Friday 2024-03-29 |
   | **2024-06-19** | 2024-06-18 | **Wednesday** | Juneteenth 2024-06-19 |
   | **2024-12-25** | 2024-12-24 | **Wednesday** | Christmas 2024-12-25 |
   | **2025-01-01** | 2024-12-31 | **Wednesday** | New Year's Day 2025-01-01 |
   | 2025-03-19 | 2025-03-18 | Friday | Good Friday 2025-04-18 |
   | 2025-06-04 | 2025-06-03 | Friday | Independence Day 2025-07-04 |
   | 2026-03-04 | 2026-03-03 | Friday | Good Friday 2026-04-03 |
   | 2026-05-20 | 2026-05-19 | Friday | Juneteenth 2026-06-19 |
   | 2026-06-03 | 2026-06-02 | Friday | Independence Day observed 2026-07-03 |

   Read the shape rather than the rows. A settlement on a **Tuesday** happens in this file **only** when the
   clause fires — thirteen times, never otherwise — and a **hole** in the weekly Wednesday grid happens
   **only** when the clause fires. Both directions, no exceptions. Four of the thirteen are monthlies
   (2022-03-15, 2024-06-18, 2025-03-18, 2026-05-19); the other **nine** are weeklies, i.e. **nine
   observations no prior ledger in this class could see**.

4. **February's Wednesday leg is structurally immune; its Friday leg is not — SUPPORTED, and this AMENDS the
   proposal that created this event.** The proposal's reason was *"February carries no holiday that can move
   the anchor, because Washington's Birthday is always a Monday."* Half of that is exactly right and
   provable: a February settlement Wednesday can only ever fall on **02-13 … 02-20** (the third Friday of
   March spans 03-15 … 03-21, minus 30), and Washington's Birthday can only ever fall on **02-15 … 02-21**
   as a **Monday**. No US market holiday can occupy a February settlement Wednesday. The Wednesday leg is
   dead by construction.

   But the clause has two legs, and the second one is the **third Friday of March** — which **can** be Good
   Friday. Good Friday spans 03-20 … 04-23; the third Friday of March spans 03-15 … 03-21; they overlap at
   **03-20 and 03-21**. Scanning 1990–2300: the third Friday of March is Good Friday in **2008, 2160, 2228
   and 2285**. **2008 is realized** — Good Friday was **2008-03-21**, so the February 2008 settlement moved
   off Wednesday 2008-02-20 to Tuesday **2008-02-19** (Monday 02-18 being Washington's Birthday). It is not
   testable here: `VRO_History.csv` begins **2008-07-16**.

   So the correct statement is **rare, not impossible** — and the next occurrence is **2160**. February 2028
   is clear on both legs, so the proposal's *conclusion* stands untouched; only its *reason* needed the
   second half.

5. **February is also structurally immune to the dispute that consumed the December 2027 ledger —
   SUPPORTED, and it is why this date is uncontested.** That ledger turned on "35-gap" months, where the
   rule (`F_M + 5`) and a naive *Wednesday-before-this-month's-opex* heuristic (`F_M − 2`) disagree.
   Decomposing 1990–2100 by expiration month, February is **107 of 111** at a 28-day gap — the most
   28-dominant month on the calendar, against October's 62 at the other end — and the four exceptions are
   **2008, 2036, 2064 and 2092**, all identical in shape (third Friday of February on the 15th, of March on
   the 21st). **2028 is a 28-gap February**, so rule and heuristic **agree** at 2028-02-16 and there is no
   publisher disagreement available to have.

6. **The publisher corroborates, and its record is better than the last ledger scored it — SUPPORTED, with a
   correction carried forward.** The OIC/OCC calendar's 36 monthly-volatility rows span **2025-01-22 →
   2027-12-15**. Scored against the *third-Friday arithmetic alone* the publisher reproduces **32 of 36**,
   the number the 2027-12-22 sibling recorded. Scored against the **full clause** — which the publisher
   evidently applies — it reproduces **35 of 36**, and the single residual is **2027-12-15**, the row that
   ledger already contests. Three of the sibling's "four misses" were not publisher errors at all; they were
   the publisher correctly moving 2025-03-18, 2026-05-19 and 2027-05-18 off their unadjusted Wednesdays.
   That narrows the OCC's genuine disagreement with Cboe to **exactly one row in three years**, and it
   removes the only route by which the December dispute could contaminate this date. On February
   specifically the file is **3 for 3**: 2025-02-19, 2026-02-18, 2027-02-17, each the unadjusted `F_Feb − 2`.
   It carries **no 2028 row of any kind**, which is why nothing here promotes.

7. **`VX/G8` is unlisted, and the surface that will decide this is silent — SUPPORTED, and it is why the
   status does not promote.** The live settlement strip, re-fetched today, still runs
   `VX/U6 · V6 · X6 · Z6 · F7 · G7 · H7 · J7 · K7` and stops at **`VX/K7` (2027-05-18)** — unchanged from
   both the 2026-09-04 and 2026-09-08 sibling reads. On the per-contract endpoint,
   **`VX_2028-02-16.csv` returns 403**, as do `VX_2028-01-19`, `VX_2028-03-15` and `VX_2028-02-18`, while
   the control **`VX_2027-05-18.csv` returns 200**. Given the observed listing cadence — roughly nine months
   ahead — `G8` should appear around **2027-05**. **Promotion trigger:** `VX/G8` listed dated 2028-02-16, or
   an OCC 2028 calendar naming it.

8. **The collision the proposal flagged is exact — SUPPORTED, verified from the settlement side.**
   **2028-02-16 − 21 days = 2028-01-26**, which is the second day of the FOMC's scheduled **January 25–26,
   2028** meeting, so the D+21 minutes release and the February SOQ coincide by arithmetic rather than by
   luck. The proposing lane's statistical work — 50 on-settlement releases at 50.0% VIX-down against 107
   off-settlement at 71.0%, the split at P = 0.0014, and the matched-window null at P = 1.000 — is **cited
   and deliberately not re-derived**; it is that lane's finding and re-running it here would double-count one
   analysis. What this lane adds is the mechanical half: the collision is certain, and it is **sequential**.
   Trading in the expiring contract ends at **8:00 a.m. Chicago time** (09:00 ET) and the SOQ prints from the
   special opening auction; the minutes drop at **14:00 ET**. The settlement is resolved hours before the
   release.

9. **A displaced settlement is a 31-day VIX — SUPPORTED, new to this class, and it matters only in the
   negative here.** The spec's *Final Settlement Value* section requires the SOQ's time-to-expiration
   component to *"account for the actual number of days and minutes until expiration for the constituent
   option series,"* and gives the worked case: *"when Cboe Options is closed on a Wednesday due to an
   Exchange holiday, the amount of time until expiration used to calculate the final settlement value would
   be increased to reflect the extra calendar day."* The spec's example names the **Wednesday-closure** case;
   the governing sentence is general, so on any displaced settlement the constituent SPX options still expire
   on the same Friday and the measurement spans 31 days. **2028-02-16 is undisplaced**, so its SOQ is a clean
   30-day measurement against SPX options expiring 2028-03-17 — which is the only reason this detail belongs
   in this ledger rather than a displaced sibling's.

10. **Nothing in the house system is settlement-keyed — SUPPORTED, re-verified rather than inherited.**
    `trade-playbooks.md` and `multi-symbol-sweep.md` grepped for
    `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**, matching every sibling
    result since 2026-09-05.

11. **The sweep proposes nothing, and the refusal is computed — SUPPORTED.** The ±5-day corridor
    (2028-02-11 → 2028-02-21) contains **four** entries, **all already owned**:
    [`fomc-minutes-2028-02-16`](fomc-minutes-2028-02-16.md) at 0 (canonical, and this event's proposer),
    its own duplicate proposal `fomc-minutes-2028-02-16.from-fomc-2028-01-26.json` at 0 (shadowed),
    `opex-2028-02-18.from-fomc-minutes-2028-02-16.json` at +2, and
    `presidents-day-market-closure-2028-02-21.from-fomc-minutes-2028-02-16.json` at +5. Two candidates were
    **declined**: **(a)** `opex-2028-03-17`, this contract's own 30-day reference expiry — declined on the
    precedent this class has now set five times, after `opex-2027-04-16`'s research corrected the
    "constitutive input" framing; **(b)** `vix-expiration-2028-03-22`, the next monthly settlement, which
    sits at **D+35** and is outside the corridor this sweep is defined over. Proposing an out-of-corridor
    event because a lane happened to compute it would make the corridor rule decorative.

### What the conditions support

Nothing directional, and no sizing. Four outputs, in descending order of value:

- **A method upgrade the class keeps, and it is the point of this ledger.** The holiday clause is testable on
  the **weekly** settlement grid, because the specification's clause sentence governs weekly contracts too.
  That is **52 tests a year** where every prior lane had 13, and it converts the least-verified part of this
  rule into the most-verified: **296 of 296**, **13 predicted displacements = 13 realized**, zero residual.
- **An amendment to the reason this event was proposed with.** February's **Wednesday** leg is dead by
  construction; its **Friday** leg is merely rare — the third Friday of March was Good Friday in **2008** and
  will be again in **2160**. The conclusion survives; the argument needed its second half.
- **A publisher correction, in the OCC's favour.** With the clause applied the OIC/OCC calendar reproduces
  **35 of 36**, not 32; three of the four apparent misses were the publisher applying the clause correctly.
  Its genuine disagreement with Cboe is **one row in three years**.
- **A date, uncontested by construction.** **2028-02-16**, in a **28-gap** February where the rule and the
  naive heuristic agree, so the dispute that consumed the December 2027 ledger cannot arise here.

### Honest limits

The **date is `estimate`** and stays so until `VX/G8` lists or an OCC 2028 calendar publishes; the arithmetic
is strong and the listing is the missing thing. Leg 3's power comes from the **2021–2026** window, chosen
because the file carries exactly one settlement per Wednesday there — the **2017–2020** stretch runs
113–253 rows a year and was **excluded**, so the clause is not tested on it and this ledger makes no claim
about that era. The test scores **presence and absence in a settlement file**, which establishes *when a
settlement occurred*, not which contract settled; separating monthly from weekly by tenor needs the
per-contract endpoint the 2027-12-22 sibling introduced, and that surface **403s for every 2028 date**. The
**holiday set is statute-derived** and has **no slot for an ad-hoc closure** — a national day of mourning of
the kind that shut the market on 2018-12-05 and 2025-01-09 is unpredictable by construction, and one landing
on 2028-02-16 or 2028-03-17 would move this date; neither of those two fell on a settlement Wednesday, so
the 296/296 result does not test that case either. The 2008 February displacement is **computed, not
observed** — `VRO_History.csv` begins five months later. Leg 8's statistics are the **proposing lane's**,
cited and not re-derived, so any error there propagates here. No house instrument tests any of this, which is
why the outputs are a date, a method and a set of refusals rather than anything tradeable. Educational,
paper-standard throughout.

## Stance & kill switches

**Stance (date `estimate` as of 2026-09-09 on Cboe specification text read direct, with the holiday clause
validated 296-of-296 across the 2021–2026 weekly settlement grid, the underlying rule 217-of-218 against the
venue's own monthly prints, and the OCC calendar 35-of-36 with the clause applied; `VX/G8` unlisted and no
2028 publisher row existing).** Treat **2028-02-16, 09:30 ET** as a known-date, **low-impact microstructure
marker** and never as a tradeable event. No position is opened, closed or sized because of it. One guard
applies: **nothing executes on that day's opening auction**, on any name — the expiring VX contract's last
trade is 09:00 ET and the SOQ's first prints are settlement artifacts. Four findings are carried forward
rather than acted on. **(a)** The holiday clause — the part of this rule every prior sibling asserted from
the words — is now **tested**, because the specification applies it to weekly contracts and therefore to all
**296** settlement Wednesdays of 2021–2026, where it is right **296 times** with **13 predicted displacements
matching 13 realized Tuesday settlements exactly** and no unexplained residual. **(b)** The proposing lane's
reason for February's safety is **amended**: the Wednesday leg is structurally immune, but the Friday leg —
the third Friday of March — **can** be Good Friday, last in **2008** and next in **2160**. The conclusion is
unchanged for 2028. **(c)** The OIC/OCC calendar scores **35 of 36** once the clause is applied rather than
32, narrowing its real disagreement with Cboe to the single contested 2027-12-15 row. **(d)** The collision
with the January 2028 minutes is **exact** — 2028-02-16 − 21 = 2028-01-26 — and **sequential**, the SOQ at
the open and the release at 14:00 ET. The one thing this ledger will not do is promote to `confirmed` on
arithmetic, however exhaustive: no Cboe or OCC surface reaches 2028 yet.

**Kill switches:**

- **Cboe lists `VX/G8` with an expiration date other than 2028-02-16** — the whole document re-dates. Probe
  `VX_2028-02-16.csv` at every pulse; the listing is expected around **2027-05**.
- **`VX/G8` appears on a Cboe settlement or per-contract surface dated 2028-02-16** — the promotion trigger;
  the entry flips `estimate` → `confirmed` under `OCC:` and nothing else changes.
- **Any settlement Wednesday in 2021-01-06 → 2026-09-02 is shown to contradict the clause** — the 296/296
  result is the load-bearing leg of this ledger, and a single counterexample returns the clause to
  *asserted* and this date to *arithmetic on faith*.
- **The clause is shown to fail prospectively on the next two firings it predicts** — **2026-11-25 → Tuesday
  2026-11-24** (Christmas observed 2026-12-25) and **2026-12-02 → Tuesday 2026-12-01** (New Year's Day
  2027-01-01). This is **`FT-vix-expiration-2028-02-16-1`**, scored by **2026-12-03**.
- **The OIC/OCC 2028 Expiration Calendar names any February volatility row other than 2028-02-16** — the
  publisher and the clause diverge on this date rather than on December 2027. Expected to publish around
  **2026-12**. This is **`FT-vix-expiration-2028-02-16-2`**, scored by **2027-02-28**.
- **Cboe revises the VX specification, or a published 2028 calendar puts a Cboe Options holiday on
  2028-02-16 or 2028-03-17** — the clause fires, settlement moves to Tuesday 2028-02-15, and this ledger
  re-dates. Re-fetch the specification and `nyse.com/markets/hours-calendars` by **2027-06-30**.
- **An ad-hoc market closure is announced for 2028-02-16 or 2028-03-17** — a national day of mourning is
  outside every statute-derived holiday set, including this one, and would move the date with no warning the
  arithmetic can give.
- **A house vol/opex instrument gets built and back-tested** — leg 10 stops being mechanics-plus-citation and
  starts being data; this sheet is rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2028-02-16.md`](../forward-tests/vix-expiration-2028-02-16.md):
`FT-vix-expiration-2028-02-16-1`, the **first prospective test of the holiday clause this class has ever
registered** — two consecutive predicted firings 77 and 84 days out, both on the Friday leg, both weeklies,
which is exactly the surface leg 3 introduced; and `FT-vix-expiration-2028-02-16-2`, the **publisher
discriminator** — whether the OCC's 2028 calendar names this date. A third candidate was **declined**:
predicting that `VX/G8` eventually lists at 2028-02-16 is this ledger's own thesis with a close-out score
date and no intermediate information, which duplicates the promotion trigger rather than testing anything —
the same call the 2027-12-22 sibling made. Nothing here scores any sibling's row.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-525 | Initial research on an id that existed only as `proposals/vix-expiration-2028-02-16.from-fomc-minutes-2028-02-16.json`; that proposal was read first and the **canonical `vix-expiration-2028-02-16.json` is written in this PR**, shadowing it. probe-ref seeded (no symbols; **VIX 15.72** at the 2026-09-08 Cboe close; band `low:15+`; 3 adjacents; **no blocked URLs — every fetch returned 200**). **THE HOLIDAY CLAUSE IS NOW TESTED RATHER THAN ASSERTED, WHICH IS THIS LEDGER'S POINT.** **(i) The rule was READ** (spec HTTP 200, **461,361 B**, 302 followed): `VX/G8` = third Friday of Mar-2028 **2028-03-17** −30d = Wed **2028-02-16**; neither leg a holiday (Washington's Birthday 2028 is Mon **02-21**, Good Friday 2028 is **04-14**), clause does not fire. Rule reproduces **217 of 218** monthlies 2008-07→2026-08, matching all three sibling implementations. **(ii) THE LICENCE NO PRIOR LANE USED:** the same spec paragraph defines the **weekly** settlement date and the clause sentence says "*that* Wednesday" — so the clause governs every settlement Wednesday, not 13 a year. `VRO_History.csv`'s own row counts locate the clean weekly grid: 12/yr 2008-14, 30→253/yr 2015-20, **52-53/yr 2021-25**. **(iii) THE RESULT — 296 OF 296.** Every settlement Wednesday 2021-01-06→2026-09-02 scored both ways (predicted date present AND, where displacement is predicted, the Wednesday absent): **296/296**. The clause predicts **13** displacements; the file holds **13** non-Wednesday settlements, **all Tuesdays**, and **the two sets are identical** — zero false positives, zero unexplained grid holes. Firings: 2021-03-03·2021-11-24·2022-03-16·2023-03-08·2024-02-28·2025-03-19·2025-06-04·2026-03-04·2026-05-20·2026-06-03 (**Friday** leg) and 2024-06-19·2024-12-25·2025-01-01 (**Wednesday** leg). **NINE of the thirteen are weeklies — observations no prior ledger in this class could see.** **(iv) THE PROPOSAL'S REASON IS AMENDED, ITS CONCLUSION SURVIVES.** "February carries no holiday that can move the anchor, because Washington's Birthday is always a Monday" covers the **Wednesday** leg only, and that half is provable (Feb settlement Wednesdays span **02-13..02-20**; Washington's Birthday spans 02-15..02-21 **as a Monday**). The **Friday** leg is the third Friday of March, which **can** be Good Friday: overlap at 03-20/03-21, realized in **2008** (Good Friday 2008-03-21 → Feb-2008 settlement moved to Tue **2008-02-19**), next in **2160**. Rare, not impossible. 2028 clear on both. **(v) FEBRUARY IS ALSO IMMUNE TO THE DECEMBER-2027 DISPUTE:** 1990-2100 it is **107 of 111** at a 28-day gap (most 28-dominant month; October is 62), exceptions **2008/2036/2064/2092** only — and **2028 is 28-gap**, so rule and naive heuristic **agree** and no publisher disagreement is available. **(vi) A CORRECTION IN THE OCC'S FAVOUR:** its 36 volatility rows score **32/36** on third-Friday arithmetic alone (the 12-22 sibling's number) but **35/36 with the full clause** — three of the four "misses" were the publisher correctly applying it (2025-03-18, 2026-05-19, 2027-05-18); the **sole** residual is the contested **2027-12-15**. February **3 for 3** (2025-02-19, 2026-02-18, 2027-02-17). File stops at 2027-12-15, **no 2028 row**. **(vii) STATUS STAYS `estimate`:** strip still ends **`VX/K7` 2027-05-18**; **`VX_2028-02-16.csv` 403** (as do 2028-01-19, 2028-02-18, 2028-03-15) with control **`VX_2027-05-18.csv` 200** — the endpoint was reachable, the contract is unlisted; `G8` expected ~**2027-05**. **(viii) THE COLLISION IS EXACT:** 2028-02-16 **−21d = 2028-01-26**, the second day of the scheduled Jan 25-26 2028 FOMC meeting — verified from the settlement side; the proposer's split statistic is **cited, not re-derived**. **Sequential:** VX trading ends **8:00 a.m. Chicago (09:00 ET)**, SOQ at the opening auction, minutes **14:00 ET**. **(ix) NEW MECHANIC:** the spec requires the SOQ's time-to-expiration to "account for the actual number of days and minutes until expiration", so a **displaced** settlement measures **31 days**, not 30; 2028-02-16 is undisplaced → clean 30-day SOQ vs SPX options expiring 2028-03-17. **Window** 2028-02-16→2028-03-17: **22 sessions, one closure** (02-21). Adjacency — **peers:** none (`symbols: []`). **Macro:** proposer's finding cited not re-derived. **Volatility regime:** baseline row, nothing to diff; Cboe closes 2026-09-08 **VIX1D 10.43 · VIX9D 14.81 · VIX 15.72 · VIX3M 18.39 · VVIX 88.69**, contango. **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** playbooks re-grepped → **zero hits in both**. **Blocked:** none; the 2028 403s are the endpoint answering "no such contract", proven by the 200 control. **NOTHING PROPOSED, refusal computed:** all four corridor entries already owned; `opex-2028-03-17` declined on the five-times-set constitutive-input precedent, `vix-expiration-2028-03-22` declined as **D+35, outside the corridor**. **`FT-vix-expiration-2028-02-16-1` and `-2` registered; a third declined** (predicting `VX/G8` lists at 02-16 duplicates the promotion trigger). **Own weaknesses:** the 296/296 window **excludes 2017-2020** (113-253 rows/yr) and makes no claim about it; presence/absence in a settlement file establishes **when** a settlement occurred, not **which contract** settled; the holiday set is statute-derived with **no slot for an ad-hoc closure** (2018-12-05, 2025-01-09 — neither fell on a settlement Wednesday, so that case is untested); the 2008 February displacement is **computed, not observed** (`VRO` begins 2008-07-16). | Initial stance set: **stand aside** (structural row only); date **`estimate`** at **2028-02-16** — rule-derived, with the holiday clause validated 296-of-296 on the weekly grid; `VX/G8` unlisted. | 2026-10-09 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-vix-expiration-2028-02-16.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
