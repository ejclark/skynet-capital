# VIX futures September 2027 expiration (SOQ settlement) — vix-expiration-2027-09-15

**Kind:** opex · **Date:** 2027-09-15 (estimate, EST: Cboe's own VX contract specification fetched direct 2026-09-06 (HTTP 200, 461,261 bytes) gives the settlement rule verbatim, and applying that rule cold to every contract month from 2008-07 to 2026-09 reproduces **217 of 218** monthly settlement dates in Cboe's own published VIX final-settlement series `VRO_History.csv` (HTTP 200, 26,597 bytes, 1,268 rows) — the single absence is a **gap in Cboe's file**, which carries no May-2013 row of any date. `VX/U7` is **not yet listed** on any Cboe settlement surface (the published curve stops at `K7`, 2027-05-18), so the date is rule-and-arithmetic rather than a listing and the `OCC:` prefix is not yet earned) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["fomc-2027-09-15","opex-2027-09-17"],"screenStreak":0,"blocked":[{"url":"https://www.nyse.com/markets/hours-calendars","status":"403","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **Stand aside — and take the one thing this row exists for: the collision that makes this
date interesting is measured, and it does nothing.** `VX/U7` settles on the morning of the
**2027-09-15 FOMC decision** (`estimate`), struck in the 09:30 ET opening auction — **four and a half
hours before the 14:00 ET statement that sits inside its own 30-day reference window**. That invites
exactly one story: the SOQ should print *rich*, because the whole meeting is unresolved at hour zero.
This session measured it on **37 historical collisions, 2008–2026**, using Cboe's actual settlement
prints (`VRO`), and the story dies in three steps. **(1)** The raw comparison has the **wrong sign** —
VIX *opens* **1.30% below** the prior close on collision settlements against **+0.29%** on
non-collision ones. **(2)** That decline is not the collision, it is the ordinary **pre-FOMC morning**:
the same effect appears on FOMC days that are *not* settlements (**−0.52%** against **+0.83%**
elsewhere, P = 0.0015). **(3)** Holding meeting type fixed — quarterly, SEP-carrying decisions only,
varying *only* whether the day is also the settlement — the gap collapses to **−0.88 points at
permutation P = 0.33**, and **reverses in September alone** (**+0.10%** on 11 collisions against
**−1.38%** on 7 non-collisions). The settlement print itself is flat: `VRO` against the same session's
VIX open runs **+0.14%** on collisions and **+0.31%** otherwise, **P = 0.79**. Second output: the rule
is now validated **217 of 218 against eighteen years of Cboe's own prints**, far past the siblings'
nine-listing check, and **all 41 collisions in 21 years fall in March, June, September or December** —
the collision class is the SEP-carrying quarterly meeting and nothing else. Date stays **`estimate`**:
`VX/U7` is not listed. **Nothing here licenses a position at D-374.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no position this event could be sized into | High | D-374, `symbols: []`, `impact: low`, and a re-grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `opex\|expiration\|witching\|volatility settlement\|SOQ` returns **zero hits in both**, run this session rather than inherited from the [`vix-expiration-2027-05-18`](vix-expiration-2027-05-18.md) lane | A house vol/opex instrument being built and back-tested before **2027-09-15** — the "nothing is settlement-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside on 2027-09-15; the live collision this week is 2026-09-16, ten days out** | High | The **2026-09-16** FOMC decision is *also* a monthly VIX settlement — the next instance of this exact configuration — and it has its own ledger, [`vix-expiration-2026-09-16`](vix-expiration-2026-09-16.md); nothing in the 2026-09-07 → 2026-09-11 tape is `VX/U7`-keyed | Cboe listing `VX/U7` on a date other than 2027-09-15 before **2026-09-11**, which would re-date this whole ledger |
| This month | **Do not read the FOMC-day settlement as an event premium** — the collision is measured on 37 instances and adds nothing once meeting type is held fixed | Medium | Controlled test (quarterly SEP-carrying decisions only, varying only the collision): VIX open-vs-prior-close **−1.30%** on 37 collisions against **−0.42%** on 34 non-collisions, **P = 0.33**; it **reverses in September** (**+0.10%** vs **−1.38%**); and the SOQ's own basis to the same session's open is **+0.14% vs +0.31%, P = 0.79** | The **2026-09-16** collision printing a VIX open **at or below −1.30%** relative to the 2026-09-15 close — the pooled collision mean reproducing on the next instance would put the refusal back in play. Registered as **FT-vix-expiration-2027-09-15-2** |
| This quarter | **Treat the date as rulebook-grade and the listing as the only thing missing** | Medium | Cboe's rule applied cold reproduces **217 of 218** monthly settlements across 2008-07 → 2026-09 in Cboe's own `VRO` series, including all six holiday displacements and both branches of the clause; the one absence is a hole in Cboe's file, not a miss | Cboe listing `VX/U7` with an expiration date other than **2027-09-15**, or publishing a 2027 holiday calendar that puts a closure on **2027-09-15** or **2027-10-15**. Re-check both surfaces at every pulse |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2027-09-15 VIX settlement. The date is
  `estimate`, and `estimate` widens caution rather than licensing anything.
- **Execution guard (Wed 2027-09-15), the only actionable line here:** nothing trades that day's
  opening auction. Cboe's own spec, fetched today: *"Trading hours for expiring VX futures contracts
  end at 8:00 a.m. Chicago time on the final settlement date"* — **09:00 ET** — and the SOQ is struck
  from the opening prints of the constituent SPX series. Those prints are settlement artifacts, not
  information. Same guard all six VIX siblings carry; on this date it stacks with the standing
  don't-trade-an-FOMC-open rule rather than replacing it.
- **The refusal this document banks, and it is the deliverable:** the FOMC-day settlement carries **no
  measured price consequence**. On 37 collisions the SOQ-vs-open basis is **+0.14%** against **+0.31%**
  on 180 non-collision settlements (**P = 0.79**), and the morning decline that *looks* like a collision
  effect is the **pre-FOMC drift**, present with the same size and better significance on FOMC days that
  are not settlements.
- **The classification that makes the collision predictable rather than remarkable:** **all 41** FOMC
  decision days 2007–2027 that fall on a monthly VIX settlement are in **March, June, September or
  December** — 11/20 · 10/21 · 13/21 · 7/21 — and **zero** in the other eight months, across 84
  meetings. Every collision is a **SEP-carrying quarterly meeting**, and **41 of those 83** collide.
  A future lane meeting this configuration should reach for that fact, not for an anomaly.
- **The rule validation, which supersedes the siblings' check:** applying Cboe's clause cold to 2008-07
  → 2026-09 yields **218** monthly settlements, **217** of which appear in Cboe's own `VRO_History.csv`.
  The absence is **May 2013**, for which Cboe's file carries **no row at any date** (04/17/2013 →
  06/19/2013). Both branches of the holiday clause are exercised in that span: five Friday-leg
  displacements (**2014-03-18 · 2019-03-19 · 2022-03-15 · 2025-03-18 · 2026-05-19**) and — new to this
  set — **one Wednesday-leg displacement, 2024-06-18**, the 31-day branch the
  [`vix-expiration-2027-05-18`](vix-expiration-2027-05-18.md) ledger could describe only from Cboe's
  hypothetical example. It is not hypothetical.
- **Structural placement, not a call:** the 30-day reference window runs **2027-09-15 → 2027-10-15**,
  **23 trading sessions with no exchange closure** (Labor Day 2027 is the *first* Monday, 2027-09-06,
  nine days earlier). It contains [`fomc-2027-09-15`](fomc-2027-09-15.md) on **day zero**,
  `opex-2027-09-17` at +2, [`consumer-confidence-2027-09-28`](consumer-confidence-2027-09-28.md) and
  [`fhfa-hpi-2027-09-28`](fhfa-hpi-2027-09-28.md) at +13, and `fomc-minutes-2027-10-06` at +21. Every
  one is `estimate` except the FHFA print.
- **Configuration for the next pulse to diff against** (Cboe primary closes, 2026-09-04): **VIX1D
  12.03 · VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42**; the listed VX strip runs **U6 16.2669
  → K7 21.15**, monotone contango. **`VX/U7` is not on it** — no term-structure statement about this
  contract is available or made.
- **Coverage gap, recorded not filed:** this calendar tracks **7 of the 16** monthly VIX settlements
  between 2026-09 and 2027-12. Missing: **2026-10-21 · 2026-11-18 · 2026-12-16 · 2027-06-16 ·
  2027-07-21 · 2027-08-18 · 2027-10-20 · 2027-11-17 · 2027-12-22**. One VIX ledger should not file nine
  entries unilaterally; this is a coverage-policy question, and it is the second such note in this class.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At D-374
  those describe a different expiry entirely; they become quotable from roughly **2027-09-08**.

## Initial research

### The question

Six VIX expirations are researched here already, and this one arrived as a **proposal from a different
lane** — [`fomc-2027-09-15`](fomc-2027-09-15.md)'s initial research, which found its own ±5-day corridor
empty and filed three adjacencies to fix it. That proposal did something unusual and useful: it wrote
down, in advance, the thing a later lane would be tempted to get wrong. Verbatim: *"the
FOMC-day/VIX-settlement collision is NOT rare — 45 of 167 meetings and 13 of 21 Septembers — and is
calendar-forced whenever October's third Friday is 28 days after September's; a later lane must not
write it up as an anomaly."*

So the question is not "when does `VX/U7` settle." It is: **the collision is not an anomaly — is it
anything at all?** And underneath it, one method question this class has never answered: the sibling
ledgers validate Cboe's settlement rule against **nine listed dates**. Is there a bigger check?

**One-line verdict:** the collision is **nothing** — measured on 37 historical instances with Cboe's own
settlement prints, every apparent effect is the ordinary pre-FOMC morning and the SOQ's own basis is a
clean null (P = 0.79) — and yes, there is a bigger check: the rule reproduces **217 of 218** monthly
settlements across eighteen years of Cboe's published `VRO` series, with the one absence being a hole in
Cboe's file rather than a miss.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`,
so no symbol-keyed instrument applies, and `scripts/research/` carries no vol- or settlement-shaped
instrument (`expiration-displacement.mjs` measures *equity-expiration volume*, a different mechanic, and
was not run). Nothing was inherited: every primary was re-fetched and every number recomputed, including
the proposal's own claims.

**Primaries fetched raw and parsed by machine today (2026-09-06):**

- **Cboe VX contract specification** `cboe.com/tradable_products/vix/vix_futures/specifications/`
  (HTTP 200, **461,261 bytes**) — the *Final Settlement Date*, *Termination of Trading* and SOQ clauses
  read verbatim out of the page's embedded payload.
- **Cboe VIX final-settlement series** `cdn.cboe.com/api/global/us_indices/daily_prices/VRO_History.csv`
  (HTTP 200, **26,597 bytes**, **1,268 rows**, 2008-07-16 → 2026-09-02). **The headline source, and new
  to this class** — every sibling ledger worked from futures *settlement prices*; this is the series of
  actual **SOQ prints**, which is what a claim about settlement-day mechanics has to be tested against.
- **Cboe settlement CSV** `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=…` for
  2026-09-04 (HTTP 200, **1,731 b**), 2026-09-03 (**1,733 b**) and 2026-09-02 (**1,717 b**).
- **Cboe index history CSVs** (`cdn.cboe.com/api/global/us_indices/daily_prices/…`, all HTTP 200) for
  **VIX** (472,309 b, 9,266 bars from 1990), **VIX1D** (53,971), **VIX9D** (200,183), **VIX3M** (217,642),
  **VVIX** (108,498), **SPX** (292,573).
- **Cboe US options hours** `cboe.com/about/hours/us-options/` (HTTP 200, **386,016 bytes**) — parsed,
  and it is still a **2026** table (Good Friday April 3, Memorial Day May 25, Labor Day September 7). No
  2027 Cboe options-hours table is published; the sibling's note holds.
- **Federal Reserve Board FOMC calendars** — `federalreserve.gov/monetarypolicy/fomccalendars.htm`
  (HTTP 200, **164,831 bytes**, panels 2021–2027) plus the fourteen historical pages **2007–2020**
  (HTTP 200 each). Parsed heading by heading, excluding `(unscheduled)`, `(cancelled)` and
  `(notation vote)` entries, and expanding the cross-month forms (`April/May 30-1`, `July 31-August 1`,
  `Jan/Feb 31-1`). Returns **167 scheduled meetings, 8 in every year 2007–2027 except 2020's 7** —
  reproducing [`fomc-2027-09-15`](fomc-2027-09-15.md)'s parse exactly, by an independent implementation.

**Failed and recorded, not worked around:** `nyse.com/markets/hours-calendars` returned **HTTP 403** to
this runner, where the `fomc-2027-09-15` lane recorded HTTP 200 the *same day* — the block is
intermittent, as three sibling ledgers have now observed from both sides. Logged in `probe-ref.blocked`.
The consequence is stated rather than papered over in leg 2.

**Own computation.** A settlement-rule engine implementing Cboe's clause (third Friday of the following
month, less 30 days, with the two-legged holiday test and a preceding-business-day fallback) over a US
market-holiday set derived from statute and rule — New Year, MLK, Washington's Birthday, Good Friday
(computed), Memorial Day, Juneteenth from 2022, Independence Day, Labor Day, Thanksgiving, Christmas,
plus the five ad-hoc closures (2007-01-02, 2012-10-29/30, 2018-12-05, 2025-01-09). Then: the collision
census, three difference-in-means measures with 200,000-draw two-sided permutation tests, a
closure × FOMC 2×2, and the controlled quarterly-meeting comparison. Every figure below is reproducible
from the sources named.

**House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped;
`src/domain/market-events/` and its `proposals/` for the corridor, the window and the coverage census;
the [`vix-expiration-2027-05-18`](vix-expiration-2027-05-18.md) and [`fomc-2027-09-15`](fomc-2027-09-15.md)
ledgers for what was already banked. Genre model: [`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The date is rule-derived and the rule now rests on eighteen years of the venue's own prints —
   SUPPORTED, and this is the method contribution.** Cboe's VX specification, verbatim:

   > "The final settlement date for a contract with the "VX" ticker symbol is on the Wednesday that is
   > 30 days prior to the third Friday of the calendar month immediately following the month in which
   > the contract expires."
   >
   > "If that Wednesday **or the Friday that is 30 days following that Wednesday** is a Cboe Options
   > holiday, the final settlement date for the contract shall be on the business day immediately
   > preceding that Wednesday."

   Applied cold to the September 2027 contract with no knowledge of the answer: third Friday of October
   2027 = **2027-10-15**; the Wednesday 30 days prior = **2027-09-15**; neither leg is a holiday, so the
   second clause does not fire and settlement stands on **Wednesday 2027-09-15**.

   The siblings validate this rule against **9 listed dates**. This session ran it against **218
   contract months, 2008-07 → 2026-09**, and checked each derived date against Cboe's own published
   VIX final-settlement series:

   | Check | Result |
   |---|---|
   | Rule-derived monthly settlements in range | **218** |
   | Present in Cboe's `VRO_History.csv` | **217** |
   | Absent | **1** — 2013-05-22 |
   | …and the reason | Cboe's file carries **no May-2013 row at any date** (04/17/2013 → 06/19/2013). A **gap in the series**, not a rule failure. |
   | Currently listed VX curve reproduced | **9 of 9** (U6 → K7, including the Juneteenth-displaced K7 Tuesday) |
   | Displacements the holiday clause produced in range | **6** — 2014-03-18, 2019-03-19, 2022-03-15, 2025-03-18, 2026-05-19 (Friday leg) and **2024-06-18 (Wednesday leg)** |

   The last row matters beyond arithmetic. The `vix-expiration-2027-05-18` ledger distinguished the
   rule's two branches and could evidence only the tenor-preserving one, describing the other — a
   Wednesday holiday moving settlement without moving the Friday, producing a **31-day** contract — from
   Cboe's own hypothetical example. **2024-06-18 is a dated instance of it**: Juneteenth fell on
   Wednesday 2024-06-19, settlement moved back to Tuesday 2024-06-18, the reference Friday stayed
   2024-07-19, and Cboe printed `VRO` at **12.39** on that Tuesday. The branch is real.

   Re-running the sibling's forward scan independently: across the **28** contract months 2026-09 →
   2028-12 there is **exactly one** displacement, `2027-05-19 → 2027-05-18`. That reproduces
   `vix-expiration-2027-05-18`'s claim from a separate implementation. **`VX/U7` is not displaced.**

2. **The date is `estimate`, and the honest reason is a listing rather than a doubt — SUPPORTED, with a
   blocked fetch stated.** `VX/U7` does **not** appear on Cboe's settlement surface: the published VX
   curve stops at **`K7` (2027-05-18)** on all three dates fetched, `VXM` stops at **`G7` (2027-02-17)`**,
   and the S&P 500 Variance rows carry `VA/M7 — 2027-06-17` and `VA/Z7 — 2027-12-17` but **no `VA/U7`**,
   so even the reference series is unlisted. The `OCC:` prefix this class promotes under is a *listing*
   prefix; it is not earned by arithmetic, however well validated. Two of the three sibling promotions in
   this class had a listing; this one does not, and stays `estimate`.

   The blocked fetch bears on exactly one claim and it is named here rather than buried: **NYSE's 2027
   holiday column was not read this session (HTTP 403).** The "neither leg is a holiday" test therefore
   rests on the rule-derived US market-holiday set — which is the same set that produced the
   **217-of-218** reproduction in leg 1, including all six displacements, so it is validated evidence
   rather than an assumption. Independently: Labor Day is fixed by **5 U.S.C. 6103** to the *first*
   Monday in September, which in 2027 is **2027-09-06** — nine days before this settlement — and no US
   market holiday falls in October at all. Cboe's own options-hours page was fetched successfully and is
   a **2026** table, so it could not have answered the 2027 question either way.

3. **The collision is real, common, and confined to one meeting class — SUPPORTED, and it is what makes
   the event predictable rather than remarkable.** Intersecting the 167 parsed decision days with the
   rule engine's settlement dates:

   | Month | Meetings 2007–2027 | …that are also a monthly VIX settlement |
   |---|---|---|
   | March | 20 | **11** |
   | June | 21 | **10** |
   | September | 21 | **13** |
   | December | 21 | **7** |
   | Jan · Feb · Apr · May · Jul · Aug · Oct · Nov | 84 | **0** |
   | **Total** | **167** | **41** |

   **Every collision in twenty-one years is a SEP-carrying quarterly meeting**, and **41 of those 83**
   collide — a coin flip, not a rarity. The other eight months cannot produce one: a VX settlement is
   always a Wednesday 30 days before the *following* month's third Friday, which puts it in the middle
   third of its own month, and the non-quarterly meetings sit in the last week.

   **One number disagrees with the proposal and is reported rather than reconciled away.** The seeding
   proposal recorded **45 of 167**; this session's independent re-derivation returns **41 of 167**. The
   September counts agree **exactly (13 of 21)**, and the structural claim — calendar-forced, not rare —
   is unaffected either way. The four-meeting difference is **unexplained**: it is not weekly VIX
   expirations (including those would give 95 of the 144 meetings inside the `VRO` range, not 45), and
   this session's meeting parse reproduces the proposing lane's own 167-meeting count and monthly table.
   Recorded as a discrepancy for whichever lane next needs an exact figure.

4. **The event-premium story the collision invites — REFUTED, in three steps, and this is the leg the
   ledger exists for.** *The setup.* Cboe's spec ends trading in the expiring contract at **08:00
   Chicago (09:00 ET)** and strikes the SOQ from the constituent SPX series' **opening prints (09:30
   ET)**. The FOMC statement lands at **14:00 ET**. So on a collision the contract cash-settles with the
   meeting **inside its own 30-day reference window and entirely unresolved** — the maximum-uncertainty,
   zero-information configuration. The natural claim is that the SOQ prints rich.

   *The sample.* All monthly settlements 2008-07 → 2026-09 with both a `VRO` print and a VIX bar:
   **217**, of which **37 are collisions** and 180 are not. Measures in log points of VIX.

   *Step one — the raw comparison, which has the wrong sign.*

   | Measure | Collision (n = 37) | Other settlements (n = 180) | Difference | Permutation P |
   |---|---|---|---|---|
   | `VRO` vs prior close | **−1.16%** | +0.60% | −1.76 | 0.066 |
   | VIX **open** vs prior close | **−1.30%** | +0.29% | −1.59 | **0.012** |
   | VIX close vs `VRO` | −0.75% | −0.43% | −0.32 | 0.81 |

   Vol does not arrive at a collision settlement *rich*. It arrives **low**. Whatever is happening, the
   unresolved-event premium is not it.

   *Step two — the control that explains the sign, and it is not the settlement.* Split every session
   2008-07 → 2026-09 on both dimensions (VIX open vs prior close):

   | | no FOMC | FOMC |
   |---|---|---|
   | **no settlement** | +0.83% (n = 4,282) | **−0.52%** (n = 107) |
   | **settlement** | +0.29% (n = 180) | **−1.30%** (n = 37) |

   The FOMC effect off settlements is **−1.36 points at P = 0.0015**; within settlements it is **−1.59 at
   P = 0.012**. The morning decline is a property of **FOMC days**, not of collisions — the well-known
   pre-announcement drift, present with better significance in the cell that has nothing to do with
   settlement.

   *Step three — the controlled test, which is the honest one.* Hold the meeting class fixed: quarterly,
   SEP-carrying decisions only (the only class that ever collides, per leg 3), varying **only** whether
   the day is also the settlement.

   | Measure | Collision (n = 37) | Non-collision quarterly meeting (n = 34) | Diff (mean) | P | Diff (median) | P |
   |---|---|---|---|---|---|---|
   | VIX open vs prior close | −1.30% (med −1.02) | −0.42% (med −0.30) | −0.88 | **0.33** | −0.72 | 0.40 |
   | VIX close vs open | −0.61% (med −3.19) | −1.86% (med −1.16) | +1.25 | 0.63 | −2.03 | 0.50 |
   | VIX close vs prior close | −1.91% (med −2.87) | −2.28% (med −1.38) | +0.36 | 0.89 | −1.49 | 0.53 |

   **Null on every measure, on mean and on median.** And within September — the subsample 2027-09-15
   actually belongs to — it **reverses**: 11 September collisions open **+0.10%** against 7 September
   non-collisions at **−1.38%** (P = 0.23). The apparent effect was a meeting-class artifact, exactly as
   [`fomc-2027-09-15`](fomc-2027-09-15.md)'s corridor rule turned out to be.

   *Step four — the settlement print itself, the most direct question, and also null.* `VRO` against the
   **same session's** VIX open, which removes the overnight move entirely and asks only whether the SOQ
   is struck rich relative to the concurrent index: **+0.14%** on 37 collisions against **+0.31%** on
   180 non-collision settlements, difference **−0.17, P = 0.79**. The small positive basis is the known
   SOQ artifact, and it is **the same size on both**.

   *Verdict.* **REFUTED.** The collision has no measured price consequence in any of the four ways this
   session could ask.

5. **What the collision *does* change is an execution fact, not a price fact — SUPPORTED.** Two rules
   that are ordinarily separate land on the same morning. Cboe's own text: *"Trading hours for expiring
   VX futures contracts end at 8:00 a.m. Chicago time on the final settlement date"* — so the expiring
   tenor's last trade is at **09:00 ET**, and anyone holding it into settlement is cash-settled at a
   price struck from opening prints **before the meeting resolves**, with no ability to exit after it.
   That is not a premium (leg 4) and not an edge; it is a **liquidity and control fact**, and it belongs
   in the same place E1 (the don't-trade-the-open rule) already lives. It sharpens an existing guard
   rather than adding a signal.

6. **The 30-day window is holiday-clean and denser than any sibling's — SUPPORTED, structural only.**
   `VX/U7`'s reference window runs **2027-09-15 → 2027-10-15**: 30 calendar days, **23 trading sessions,
   zero exchange closures** (Labor Day 2027-09-06 falls nine days before it). The comparison worth
   recording is with `VX/K7`, whose window has **21 sessions and one closure** — this contract measures
   **two more sessions** with no holiday drag, which is exactly the term the sibling's controlled pair had
   to hold fixed. Contents, all `estimate` except the FHFA print: [`fomc-2027-09-15`](fomc-2027-09-15.md)
   at **day zero**, `opex-2027-09-17` at +2, [`consumer-confidence-2027-09-28`](consumer-confidence-2027-09-28.md)
   and [`fhfa-hpi-2027-09-28`](fhfa-hpi-2027-09-28.md) at +13, `fomc-minutes-2027-10-06` at +21. Unlike
   `VX/K7` — which expired *before* everything it measured — this contract's headline event is the one it
   settles **on**.

7. **No term-structure statement about this contract is available, and the temptation to make one anyway
   is named — SUPPORTED.** `VX/U7` is unlisted, so there is no settlement price, no residual, no
   duration fit and no basis to VIX cash for this contract. The listed strip as of 2026-09-04 runs
   **U6 16.2669 · V6 18.1384 · X6 18.7688 · Z6 18.9750 · F7 19.9997 · G7 20.4603 · H7 20.7295 ·
   J7 21.0267 · K7 21.15** — monotone contango, with K7 **+6.62 over VIX cash (14.53)**. The sibling's
   generalisation holds and is *not* re-derived here: `log(days-to-expiry)` explains 97–98% of that
   cross-section, so the far curve prices duration rather than contents. Extrapolating a `U7` level from
   that fit and then reading it as a September-2027 forecast would be the single most available error on
   this event, and is refused rather than performed.

8. **Nothing in the house system is settlement-keyed — SUPPORTED, re-verified rather than inherited.**
   `trade-playbooks.md` and `multi-symbol-sweep.md` grepped for
   `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**, matching the
   `vix-expiration-2027-05-18` lane's 2026-09-05 result. `scripts/research/` carries one
   expiration-shaped instrument, `expiration-displacement.mjs`, and it measures *equity-expiration
   volume* on single names — a different mechanic, no VIX or SOQ content, correctly not run here.

9. **The sweep proposes nothing, and the refusal is computed — SUPPORTED.** The ±5-day corridor
   (2027-09-10 → 2027-09-20) carries [`fomc-2027-09-15`](fomc-2027-09-15.md) (canonical, `high`,
   `estimate`) and `opex-2027-09-17` (a sibling lane's proposal, currently due for its own initial
   research). Both are already owned. Three candidates were considered and **declined**:
   **(a)** `opex-2027-09-17` — re-proposing it as `opex-2027-09-17.from-vix-expiration-2027-09-15.json`
   would be legal under the one-file-per-owner rule and pure noise; the lane researching it right now
   writes the canonical file. **(b)** `opex-2027-10-15`, this contract's own reference series — declined
   on the precedent this class has already set twice, where `vix-expiration-2027-04-21` and
   `-2027-05-18` both refused to file a monthly opex as a "constitutive input" after
   `opex-2027-04-16`'s research corrected that framing. **(c)** The **nine untracked monthly VIX
   settlements** between 2026-09 and 2027-12 (2026-10-21 · 2026-11-18 · 2026-12-16 · 2027-06-16 ·
   2027-07-21 · 2027-08-18 · 2027-10-20 · 2027-11-17 · 2027-12-22, all rule-derived by leg 1's engine) —
   filing nine entries from one VIX ledger's sweep is a coverage-policy decision, not an adjacency
   finding, and one lane should not take it unilaterally. It is **recorded**, which is the second such
   note this class has left (the sibling recorded the parallel monthly-opex gaps), and two ledgers
   noting it is the signal.

### What the conditions support

Nothing directional, and no sizing. Four outputs, in descending order of value:

- **A measured refusal.** The FOMC-day VIX settlement carries **no price consequence** — the raw
  difference has the wrong sign for the premium story, dies to the pre-FOMC drift under control
  (P = 0.33), reverses in September, and the SOQ's own basis is a flat null (P = 0.79) on 37 instances.
- **A rule validated 217-of-218 across eighteen years**, superseding this class's nine-listing check,
  with both branches of the holiday clause now evidenced by dated instances — including **2024-06-18**,
  the 31-day branch a sibling could only describe hypothetically.
- **A classification.** All **41** collisions in 21 years are **SEP-carrying quarterly meetings**, about
  half of that class; the other eight months cannot produce one. The configuration is predictable, and
  the next instance is **2026-09-16**, ten days out.
- **An execution guard.** Nothing enters, exits or resizes on the **2027-09-15 opening auction** — the
  expiring contract's last trade is 09:00 ET and the SOQ's first prints are artifacts, five and four and
  a half hours respectively before a statement that cannot be traded around after settlement.

### Honest limits

The **date is `estimate`** and stays so until `VX/U7` is listed; the arithmetic is strong and the listing
is the only missing thing, which is a taxonomy fact rather than a doubt. **NYSE's 2027 holiday column was
not read (HTTP 403)** — leg 2 states exactly which claim that touches and what carries it instead, and
Cboe has still published no 2027 options-hours table. Leg 4's sample is **37 collisions**, and its
controlled arm compares 37 against 34; a null on those numbers is a **failure to reject**, not proof of
absence — the effect it can exclude at conventional power is roughly the size of the pooled difference it
was testing, and nothing smaller. Its September arm rests on **11 against 7**. `VRO` is a **daily
settlement series**, not intraday: the SOQ-vs-open basis in step four uses the index open as the
concurrent reference and those are struck minutes apart, not simultaneously. The holiday set behind the
rule engine is **derived from statute and rule, not read off a 2027 exchange calendar** — validated by
the 217-of-218 reproduction, which is strong evidence for the *past* and an inference for 2027. The
collision census disagrees with the seeding proposal by **four meetings** and this session could not
explain the difference. Every event inside the 30-day window is `estimate` except one, and
[`fomc-2027-09-15`](fomc-2027-09-15.md) carries the Fed's own *tentative-until-confirmed* caveat with the
**2027-07-27/28** meeting as its confirming venue. No house instrument tests any of this — which is
exactly why these are refusals rather than inversions into trades. Nothing about same-day VIX open
interest by strike or SPX gamma is quoted: at D-374 that describes a different expiry. Educational,
paper-standard throughout.

## Stance & kill switches

**Stance (date `estimate` as of 2026-09-06 on Cboe rule text validated 217-of-218 against the venue's own
settlement prints; `VX/U7` unlisted; every adjacent event `estimate` except `fhfa-hpi-2027-09-28`).**
Treat **2027-09-15, 09:30 ET** as a known-date, **low-impact microstructure marker** and never as a
tradeable event. No position is opened, closed or sized because of it. One guard applies: **nothing
executes on that day's opening auction**, on any name — the expiring VX contract's last trade is 09:00 ET
and the SOQ's first prints are settlement artifacts. Three facts are carried forward rather than acted
on. **(a)** The **collision is measured and inert**: on 37 instances 2008–2026 the raw signal has the
wrong sign for the premium story it invites, it dies to the pre-FOMC drift under a controlled comparison
(**−0.88 points, P = 0.33**), it **reverses in September** (**+0.10%** vs **−1.38%**), and the SOQ's own
basis to the concurrent index is **+0.14% vs +0.31%, P = 0.79**. **(b)** The collision class is
**exclusively the SEP-carrying quarterly meeting** — 41 of 41 in March, June, September or December, zero
in 84 meetings across the other eight months — so a future lane should reach for the classification, not
for an anomaly. **(c)** Cboe's rule is now **rulebook plus eighteen years of its own prints**, and both
branches of its holiday clause have dated instances, the 31-day one being **2024-06-18**. The one thing
this ledger will not do is extrapolate a `U7` level off the listed curve's duration fit and read it as a
2027 volatility forecast.

**Kill switches:**

- **Cboe lists `VX/U7` with an expiration date other than 2027-09-15** — leg 1's rule fails on the one
  contract this ledger is about, and the entire document re-dates. Re-check both Cboe settlement surfaces
  at every pulse rather than trusting the arithmetic.
- **`VX/U7` appears on a Cboe settlement or expiration-calendar surface dated 2027-09-15** — the promotion
  trigger; the entry flips `estimate` → `confirmed` under `OCC:` and nothing else about this sheet changes.
- **The 2026-09-16 collision opens at or below −1.30% relative to the 2026-09-15 VIX close** — the pooled
  collision mean would reproduce on the next instance, leg 4's step-three null becomes a live question, and
  the sheet is rebuilt on the newer data. Ten days out. This is **`FT-vix-expiration-2027-09-15-2`**.
- **The controlled quarterly comparison reaches P < 0.05 once the upcoming collisions are added** —
  2026-09-16, 2027-03-17 and 2027-09-15 itself are the next three; if the collision effect is real it
  should strengthen, not stay at 0.33. This is **`FT-vix-expiration-2027-09-15-1`**, scored at close-out.
- **NYSE or Cboe publishes a 2027 calendar putting a market closure on 2027-09-15 or 2027-10-15** — the
  holiday clause fires, settlement moves to the preceding business day, and this ledger re-dates.
  Re-attempt `nyse.com/markets/hours-calendars` and `cboe.com/about/hours/us-options/` by **2027-01-04**.
- **The September 2027 FOMC moves off 2027-09-15** — the collision this document is about ceases to
  exist; the settlement date is unaffected but every framing above is. Observe by **2027-07-29**, when
  the July meeting confirms the September slot.
- **A house vol/opex instrument gets built and back-tested** — legs 4, 5, 7 and 8 stop being
  mechanics-plus-citation and start being data; this sheet is rebuilt on measured results.
- **`VRO_History.csv` is revised such that the 217-of-218 reproduction no longer holds** — leg 1's
  validation, and with it the confidence attached to an unlisted date, weakens back to the siblings'
  nine-listing check.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2027-09-15.md`](../forward-tests/vix-expiration-2027-09-15.md):
`FT-vix-expiration-2027-09-15-1`, the **controlled collision null** re-scored with the upcoming
instances added, scored at close-out 2027-09-21; and `FT-vix-expiration-2027-09-15-2`, a **near-term,
genuinely uncertain single observation** — the 2026-09-16 collision, ten days out, discriminating
between the pooled story and the controlled null. A third candidate was **declined**: predicting that
`VX/U7` is eventually listed on 2027-09-15 is near-certain given a 217-of-218 reproduction, and a test
that cannot plausibly fail is a kill switch, not a forward test — it is filed as one above. Nothing here
scores any sibling's row.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-374 | Initial research banked; canonical `vix-expiration-2027-09-15.json` written after reading the one prior proposal (`from-fomc-2027-09-15`), whose claims were **re-derived from primaries, not inherited** — all held except the **collision count** (proposal 45 of 167, this session **41 of 167**; Septembers agree exactly at 13 of 21, difference unexplained and recorded, not reconciled away). probe-ref seeded (no symbols, **VIX 14.53** at the 2026-09-04 Cboe close; band `low:15+`; 2 adjacent; **one blocked fetch logged**). **Leg 1 — the method contribution: the rule is validated 217-of-218 against EIGHTEEN YEARS of Cboe's own settlement prints**, where every sibling in this class checked 9 listings. Cboe's VX spec (HTTP 200, 461,261B) applied cold to 218 contract months 2008-07→2026-09; **217 appear in `VRO_History.csv`** (HTTP 200, 26,597B, 1,268 rows) — the one absence, 2013-05-22, is a **hole in Cboe's file** (no May-2013 row at any date). All **6** displacements reproduced, and **2024-06-18 is a dated instance of the 31-day WEDNESDAY-leg branch** the `vix-expiration-2027-05-18` lane could describe only from Cboe's hypothetical. Forward scan 2026-09→2028-12 independently reproduces that lane's "exactly one displacement". For U7: 3rd Friday Oct 2027 = 2027-10-15, less 30d = **Wed 2027-09-15**, neither leg a holiday. **Leg 2 — stays `estimate`, and the reason is a listing not a doubt:** the VX curve stops at **K7**, `VXM` at **G7**, and there is **no `VA/U7`** either; `OCC:` is a listing prefix. **Blocked, recorded:** nyse.com **HTTP 403** to this runner where the fomc lane got 200 the same day; Cboe's options-hours page (200, 386,016B) is still a **2026** table. The holiday claim rests on the rule-derived set that produced the 217-of-218, plus 5 U.S.C. 6103 putting Labor Day 2027 on **09-06**. **Leg 3 — the classification: ALL 41 collisions 2007-2027 are SEP-carrying QUARTERLY meetings** — Mar 11/20 · Jun 10/21 · Sep 13/21 · Dec 7/21 · **0 of 84** in the other eight months — and **41 of 83** of that class collides. Predictable, not remarkable; the proposal's "do not write this up as an anomaly" is upheld with a mechanism. **Leg 4 — THE DELIVERABLE, and it is a REFUSAL in four steps.** Cboe's spec ends expiring-VX trading at **09:00 ET** and strikes the SOQ from opening prints at **09:30 ET**, so a collision settles with the 14:00 statement unresolved inside its own 30-day window — the story is that the SOQ prints rich. **(i) Raw, 217 settlements / 37 collisions: WRONG SIGN** — `VRO` vs prior close **−1.16% vs +0.60%** (P=0.066); VIX **open** vs prior close **−1.30% vs +0.29%** (**P=0.012**); close vs `VRO` −0.75 vs −0.43 (P=0.81). **(ii) The 2×2 explains the sign and it is NOT the settlement:** no-FOMC/no-settle **+0.83%** (n=4,282) · FOMC/no-settle **−0.52%** (n=107) · settle/no-FOMC **+0.29%** (n=180) · both **−1.30%** (n=37); FOMC effect **off** settlements −1.36 at **P=0.0015**, within settlements −1.59 at P=0.012 — the pre-FOMC morning drift. **(iii) CONTROLLED (quarterly SEP meetings only, varying only the collision): NULL on every measure** — open-gap −1.30 vs −0.42, **P=0.33** (median P=0.40); day return −0.61 vs −1.86, P=0.63; close-to-close −1.91 vs −2.28, P=0.89. And it **REVERSES in September**: 11 collisions **+0.10%** vs 7 non-collisions **−1.38%** (P=0.23). **(iv) The SOQ's own basis to the same session's open: +0.14% vs +0.31%, P=0.79** — the known SOQ artifact, identical on both. **REFUTED.** **Leg 5:** what the collision does change is an **execution** fact — the expiring tenor's last trade is 09:00 ET and it cash-settles before the statement with no post-resolution exit; sharpens E1, adds no signal. **Leg 6 — window:** 2027-09-15 → 2027-10-15, **23 sessions, ZERO closures** (Labor Day is 09-06), against K7's 21-with-one; contains **fomc-2027-09-15 at day zero**, opex-2027-09-17 (+2), consumer-confidence & fhfa-hpi 2027-09-28 (+13), fomc-minutes-2027-10-06 (+21). Unlike K7 this contract settles **on** its headline event. **Leg 7:** `VX/U7` unlisted, so **no** residual, duration fit or basis is computed or extrapolated — the sibling's "the far curve prices duration" is cited, not re-derived. Strip 2026-09-04: U6 **16.2669** → K7 **21.15**, contango, K7 +6.62 over cash. **Adjacency — peers:** none (`symbols: []`). **Macro:** window contents above, all `estimate` bar the FHFA print. **Volatility regime:** baseline row, nothing to diff; Cboe closes 09-04 **VIX1D 12.03 · VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42**. **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** playbooks grepped → **zero hits** (matches the sibling's 09-05 result); `scripts/research/`'s one expiration instrument measures equity-expiration VOLUME, not vol settlement, and was correctly not run. **Leg 9 — NOTHING PROPOSED, refusal computed:** `opex-2027-09-17` is a sibling lane's live proposal (re-proposing = legal noise); `opex-2027-10-15` declined on this class's twice-set constitutive-input precedent; the **nine untracked monthly VIX settlements** 2026-09→2027-12 (2026-10-21 · 11-18 · 12-16 · 2027-06-16 · 07-21 · 08-18 · 10-20 · 11-17 · 12-22) are a **coverage-policy** question one lane must not take unilaterally — **recorded**, the second such note in this class. **`FT-vix-expiration-2027-09-15-1` and `-2` registered; a third declined** as near-certain and filed as a kill switch instead. **Own weaknesses:** leg 4's controlled arm is 37 vs 34 and its September arm 11 vs 7 — a failure to reject, not proof of absence; `VRO` is daily, so the step-(iv) basis compares two prints struck minutes apart, not simultaneously; the 2027 holiday set is inferred from statute and validated on history, not read off a 2027 calendar (403); and the 4-meeting census disagreement with the proposal is unexplained. | Initial stance set: **stand aside** (structural row only); date **`estimate`** — `VX/U7` unlisted. | 2026-10-06 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-vix-expiration-2027-09-15.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
