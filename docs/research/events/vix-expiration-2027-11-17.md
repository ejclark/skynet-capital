# VIX futures and options November 2027 expiration (SOQ settlement) — vix-expiration-2027-11-17

**Kind:** opex · **Date:** 2027-11-17 (estimate, EST: Cboe's VX settlement rule applied cold — December 2027's third Friday is 2027-12-17, the Wednesday 30 days prior is 2027-11-17, and neither leg is a 2027 closure — and the OIC/OCC expiration calendar independently publishes 2027-11-17 as a "Monthly Volatility Products Expiration date". Stays `estimate` because **`VX/X7` is not listed**: Cboe's settlement surface stops at `VX/K7`, 2027-05-18) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["fomc-minutes-2027-11-17","opex-2027-11-19"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and take the confound, which is what this ledger is for.** The proposal that
seeded this id handed over the fomc-minutes lane's sharpest number and asked this lane to own the
settlement half of it: the family's "VIX falls on minutes days" statistic is **71.0%** on releases that do
*not* share a session with the monthly VIX settlement and exactly **50.0%** on the ones that do. Re-derived
here from an independent parse of **160** minutes releases and an exact settlement engine, **the split
reproduces** — 50.0% (n = 46) against 70.2% (n = 114), **P = 0.019**. Then three measurements take its
mechanism away. **There is no settlement effect to do the killing:** all 217 realized settlements close VIX
down **53.9%** of the time, and settlements *without* minutes run 55.0% against a 54.1% base for sessions
that are neither — **+0.8pp, P = 0.876**. **The collision label is a proxy for the calendar month:** 44 of
78 Feb/May/Aug/Nov releases collide, against **2 of 82** elsewhere, and splitting by month slot alone is
*stronger* (−20.5pp, **P = 0.0080**) while the collision split **collapses to P = 0.261 inside that slot**.
**And the family is riddled with hits** — 3 of 14 arbitrary calendar splits clear P < 0.05 against ~0.7
expected. From the settlement's own side, a minutes release lands on it and changes nothing: four
contemporaneous measures **P = 0.24 – 0.46**, and forward accuracy **+2.78 vs +4.30 points (P = 0.280)**,
*lower* rather than richer. Date stays **`estimate`** — `VX/X7` is unlisted — though the publisher's one
known error is narrowed here to its one **anchorless** row, which this one is not. **Nothing licenses a
position at D-435.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no position this event could be sized into | High | D-435, `symbols: []`, `impact: low`, and a re-grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `opex\|expiration\|witching\|volatility settlement\|SOQ` returns **zero hits in both**, run this session rather than inherited | A house vol/opex instrument built and back-tested before **2027-11-17** — the "nothing is settlement-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside on 2027-11-17; this week's load is the 2026-09-11 CPI and the 2026-09-16 FOMC** | High | Nothing in the 2026-09-08 → 2026-09-11 tape is `VX/X7`-keyed, and `VX/X7` is not even listed; the 2026-09-16 settlement is a *different* configuration (decision-day) with its own ledger, [`vix-expiration-2026-09-16`](vix-expiration-2026-09-16.md) | Cboe listing `VX/X7` on a date other than 2027-11-17 before **2026-09-14**, which would re-date this whole ledger |
| This month | **Do not carry "minutes day" as a property of a settlement into 2026-11-18** — the next collision, 71 days out and itself untracked | High | From the settlement's side the label is inert: 46 collisions vs 171 other settlements are null on `VRO` vs prior close (P = 0.240), the open gap (P = 0.312), the SOQ basis (P = 0.456), the close (P = 0.291), and on forward accuracy (P = 0.280, with an identical 85% overprice rate) | The **2026-11-18** SOQ basis to its own VIX open printing **above +0.64%**, the collision-cell mean, *and* VIX closing down — a minutes premium appearing in the settlement on the first out-of-sample instance |
| This quarter | **Treat the 50.0%/71.0% split as confounded with the calendar month, not as a settlement mechanism** — this is the correction, and it is the opposite of how the number was handed over | Medium | Month slot alone splits the same 160 releases −20.5pp at **P = 0.0080**, larger than collision's −20.2pp at P = 0.019; **within** Feb/May/Aug/Nov the collision split is −14.0pp at **P = 0.261**; and the settlement main effect off minutes days is **+0.8pp, P = 0.876** | The within-slot collision split reaching **P < 0.05** once the four upcoming collisions land (2026-11-18, 2027-02-17, 2027-08-18, 2027-11-17). Registered as **FT-vix-expiration-2027-11-17-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2027-11-17 VIX settlement. The date is
  `estimate`, and `estimate` widens caution rather than licensing anything.
- **Execution guard (Wed 2027-11-17), the only actionable line here:** nothing trades that day's opening
  auction. The expiring VX contract's last trade is **09:00 ET** and the SOQ is struck from the constituent
  SPX series' opening prints; those prints are settlement artifacts, not information. Same guard all eight
  VIX siblings carry — and on this date it stacks with a **14:00 ET** minutes release in the same session.
- **The correction this document banks, and it is the deliverable:** "shares its session with the monthly
  VIX settlement" carries **no information about the settlement**, and no information about the release
  beyond what "mid-February/May/August/November" already carries. The split is real in the data and
  **confounded** in its mechanism.
- **The number that kills the mechanism story, stated plainly:** a settlement day is an *ordinary* day for
  VIX direction — **53.9%** down across all 217, **55.0%** with minutes excluded, against **54.1%** for
  sessions that are neither. There is no settlement effect available to cancel a minutes effect.
- **The multiple-comparisons frame, new to this class:** of 14 arbitrary calendar splits of the same 160
  releases, **3** clear P < 0.05 (settlement day **0.019**, Feb/May/Aug/Nov **0.008**, day-of-month > 15
  **0.049**) with third-Wednesday at **0.051** — roughly 0.7 expected. The predicates are near-collinear;
  any one of them can be told as the story.
- **The provenance finding, and it narrows a sibling's warning rather than inheriting it:**
  [`vix-expiration-2027-10-20`](vix-expiration-2027-10-20.md) showed the OIC/OCC calendar off by a week at
  its own 2027-12-15. Reproduced exactly here (35 of 36) — **and of those 36 volatility rows, exactly one
  has its own +30-day third Friday missing from the same file: 2027-12-15.** This row's anchor,
  **2027-12-17**, is published in that file. The publisher errs where it is unanchored.
- **The status refusal is unchanged and is about the listing, not the calendar:** `VX/X7` appears on no
  Cboe surface (`VX` stops at **K7**, `VXM` at **G7**, zero `X7` rows in 56). Every `OCC:`-prefixed
  promotion in this class rested on the specific contract being listed.
- **A method gotcha for every sibling, measured both ways this session:** Cboe's `VIX_History.csv` is **not
  a trading-day file** — it carries full OHLC rows on exchange closures (Thanksgiving 2025-11-27, Memorial
  Day 2026-05-25, Juneteenth 2024-06-19, the 2025-01-09 funeral closure, 2026-07-03, Labor Day 2026-09-07)
  while omitting New Year's Day and Christmas. Deriving the holiday clause from that file scores **215 of
  218**; deriving it from statute scores **217 of 218**.
- **Structural placement, not a call:** this settlement is **outside any FOMC blackout** (October's gate
  closes 2027-10-28, December's opens 2027-11-27) — only the **third of nine** tracked expirations outside
  one, so the framing three siblings were built on does not apply. Its 30-day reference window runs
  **2027-11-17 → 2027-12-17**: 23 weekdays less the **Thanksgiving 2027-11-25** closure = **22 sessions**,
  the first tracked VIX window to contain the one US closure with an adjacent half-session, and it contains
  [`fomc-2027-12-08`](fomc-2027-12-08.md) at **+21** — the year's final SEP decision.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At D-435
  those describe a different expiry; they become quotable from roughly **2027-11-10**.

## Initial research

### The question

This id arrived as a **proposal from the minutes lane** —
[`fomc-minutes-2027-11-17`](fomc-minutes-2027-11-17.md)'s initial research, which found the collision
while sourcing its own date and, like the blackout lane before it, handed the finding over rather than
banking it: *"the family's standing VIX statistic is not a property of minutes days… split on that the
share is 71.0% on the 107 non-collision releases against exactly 50.0% on the 50 collisions."* It also
told this lane exactly what it had not done: *"the split was not pre-registered — it was handed to the
lane by this very file."*

So the question is not "when does `VX/X7` settle." It is: **does a settlement behave differently when the
FOMC minutes land in the same session — and if the split is real, is the settlement actually the thing
doing the work?** Every prior measurement in this family looked at the release. Nobody has looked at the
settlement.

**One-line verdict:** the split **reproduces** and its **mechanism does not** — there is no settlement main
effect to cancel anything (+0.8pp, P = 0.876), the collision label is **96% a restatement of the
Feb/May/Aug/Nov month slot**, splitting by month alone is *stronger*, and the settlement itself is
untouched on four contemporaneous measures and on forward accuracy.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`,
so no symbol-keyed instrument applies, and `scripts/research/` carries no vol- or settlement-shaped
instrument (`expiration-displacement.mjs` measures *equity-expiration volume*, a different mechanic, and
was not run). Nothing was inherited: every primary was re-fetched and every number recomputed by an
independent implementation, including the proposal's own claims and the sibling ledgers' figures.

**Primaries fetched raw and parsed by machine today (2026-09-08), all HTTP 200:**

- **OIC / OCC expiration calendar** `www.optionseducation.org/api/expirationcalendar` (**34,871 bytes**,
  **155 dated rows**, 2025-01-01 → 2027-12-31) — its legend resolves each row's GUID; **36** rows carry
  "Monthly Volatility Products Expiration date" and **36** carry the third-Friday equity type.
- **Cboe VIX final-settlement series** `cdn.cboe.com/api/global/us_indices/daily_prices/VRO_History.csv`
  (**26,597 bytes**, **1,268 rows**, 2008-07-16 → 2026-09-02) — the actual SOQ prints.
- **Cboe index histories** (`cdn.cboe.com/api/global/us_indices/daily_prices/…`): **VIX** (472,360 b,
  **9,267 bars**), **SPX** (292,573 b, **13,028 bars**), **VIX1D** (53,971), **VIX9D** (200,183),
  **VIX3M** (217,642), **VVIX** (108,498).
- **Cboe settlement CSV** `www-api.cboe.com/us/futures/market_statistics/settlement/csv` (301 → **200**,
  **1,731 bytes**, **56 rows**) — the listing check.
- **Federal Reserve Board FOMC calendars** — `federalreserve.gov/monetarypolicy/fomccalendars.htm`
  (**164,831 bytes**, panels 2021–2027) plus the fourteen historical pages **2007–2020** (200 each),
  parsed for the `(Released <Month> <D>, <YYYY>)` string the Board prints beside every minutes link.

**Nothing was blocked this session** — `probe-ref.blocked` is empty. The two Cboe/OCC 403s the
`vix-expiration-2027-10-20` lane logged were not re-attempted, because this study needed neither.

**Own computation.** A settlement-rule engine implementing Cboe's clause over a statute-derived US
market-holiday set; the minutes parse above; then the direction census, four contemporaneous
difference-in-means measures with 100,000-draw two-sided permutation tests, a settlement × minutes 2×2 over
all 4,594 era sessions, a realized-vol computation over each contract's own 30-day window, a
month-slot confound test, and a 14-predicate multiple-comparisons frame. Seeded (`20260908`) and
reproducible from the sources named.

**House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped;
`src/domain/market-events/` and its `proposals/` for the corridor, the window and the census; the
[`fomc-minutes-2027-11-17`](fomc-minutes-2027-11-17.md),
[`vix-expiration-2027-10-20`](vix-expiration-2027-10-20.md),
[`vix-expiration-2027-09-15`](vix-expiration-2027-09-15.md) and
[`vix-expiration-2027-04-21`](vix-expiration-2027-04-21.md) ledgers for what was already banked. Genre
model: [`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The date is rule-derived and independently published — SUPPORTED.** Applied cold to the November 2027
   contract: third Friday of December 2027 = **2027-12-17**; the Wednesday 30 days prior = **2027-11-17**.
   Neither leg is a 2027 closure (the statute-derived set is Jan 1 · Jan 18 · Feb 15 · Mar 26 · May 31 ·
   Jun 18 · Jul 5 · Sep 6 · Nov 25 · Dec 24), so the holiday clause does not fire. Two validations,
   re-implemented rather than cited:

   | Check | Result |
   |---|---|
   | Rule-derived monthly settlements 2008-07 → 2026-08 | **218** |
   | Present in Cboe's `VRO_History.csv` | **217** — an independent reproduction of two siblings' result |
   | Absent | **1** — 2013-05-22; Cboe's file carries no May-2013 row at any date |
   | Holiday displacements recovered in range | **6** — 2014-03-18, 2019-03-19, 2022-03-15, 2024-06-18, 2025-03-18, 2026-05-19 |
   | Rule vs the OIC/OCC calendar's 36 volatility rows | **35 of 36** |
   | The OIC/OCC calendar's own row for 2027-11-17 | published, **"Monthly Volatility Products Expiration date"** |

2. **A METHOD GOTCHA, measured both ways — the price file is not a trading-day calendar.** The obvious way
   to source exchange closures for the holiday clause is "weekdays missing from Cboe's own VIX history."
   That is **wrong for this venue's data**, and this session ran it before switching. `VIX_History.csv`
   carries **full OHLC rows on days the exchange was shut**: Thanksgiving **2025-11-27** (17.22/17.36/
   17.05/17.21), Memorial Day **2026-05-25**, Juneteenth **2024-06-19**, the **2025-01-09** national day of
   mourning, Independence Day observed **2026-07-03**, and Labor Day **2026-09-07** — while correctly
   omitting New Year's Day and Christmas. Consequences, both computed:

   | Holiday source | Settlements matched in `VRO` | Displacements recovered |
   |---|---|---|
   | The price file's implied calendar | **215 / 218** | **4 of 6** (loses 2024-06-18 and 2026-05-19) |
   | Statute + exchange rule | **217 / 218** | **6 of 6** |

   Both Juneteenth-driven displacements are exactly the ones the price file hides, because Juneteenth is
   the closure it carries a row for. Recorded here so no sibling repeats it.

3. **The `estimate` status survives, and the reason is the listing — SUPPORTED.** Cboe's settlement surface
   lists `VX/U6, V6, X6, Z6, F7, G7, H7, J7, K7` and `VXM/U6, V6, X6, Z6, F7, G7`; a scan of all 56 rows
   returns **zero `X7` contracts**. Every `OCC:`-prefixed promotion in this class rested on the specific
   contract being listed. **Promotion trigger:** `VX/X7` on a Cboe settlement or expiration-calendar
   surface dated 2027-11-17.

4. **The sibling's publisher warning is NARROWED, not inherited — SUPPORTED, and this is the provenance
   contribution.** [`vix-expiration-2027-10-20`](vix-expiration-2027-10-20.md) stayed `estimate` partly
   because "the one calendar naming the date is off by a week one row later." That error reproduces exactly
   here: the calendar's **2027-12-15** against the rule's **2027-12-22** (12-15 + 30d = 2028-01-14, the
   *second* Friday of January 2028). But this session asked a question no sibling did — *where* does the
   publisher err? Of its 36 volatility rows, **exactly one** has its own +30-day reference third Friday
   **absent from the same file**: 2027-12-15, whose anchor 2028-01-14 falls past the file's 2027-12-31 end.
   **2027-11-17's anchor, 2027-12-17, is published in that same file** as a third-Friday equity-expiration
   row. The publisher's single demonstrated error is its single anchorless row. That is a real strengthening
   of this date's provenance — and it changes nothing about the status, which turns on leg 3.

5. **The proposal's headline split REPRODUCES — SUPPORTED.** Independent parse: **160** minutes releases
   2007-02-21 → 2026-08-19 (the minutes lane parsed **157**; the difference is unscheduled-meeting minutes,
   which this parse keeps — 2019, 2020 and 2025 carry 9, 10 and 9 respectively). Against the exact
   settlement engine:

   | Group | n | VIX closes down |
   |---|---|---|
   | Minutes release **on** a settlement | **46** | **50.0%** |
   | Minutes release **off** a settlement | **114** | **70.2%** |

   −20.2pp, **P = 0.019** (20,000 permutations). The minutes lane got 50.0% / 71.0% on n = 50 / 107 using a
   rule 88.9% accurate; this engine is exact and the conclusion is unchanged. **The number is real.**

6. **But there is NO SETTLEMENT MAIN EFFECT — REFUTED, and this is the leg the ledger exists for.** The
   split is normally read as *the settlement washes the minutes effect out*. That requires settlement days
   to be unusual. They are not. Over the 4,594 sessions of the `VRO` era:

   | | not a minutes day | a minutes day |
   |---|---|---|
   | **not a settlement** | **54.1%** down (n = 4,274) | **70.9%** down (n = 103) |
   | **a settlement** | **55.0%** down (n = 171) | **50.0%** down (n = 46) |

   The settlement effect **off** minutes days is **+0.8pp at P = 0.876** — nothing. All 217 settlements run
   **53.9%**, against a **54.5%** era base. And from the settlement's own side the split is null too:
   **50.0% vs 55.0%, P = 0.615**. So there is no settlement mechanism available to cancel a minutes effect;
   what the 2×2 shows is an interaction with a **flat** arm, and the 46-case cell sitting *precisely* on the
   universe base rate is what a small subsample looks like when nothing is happening in it.

7. **And the collision label is a proxy for the calendar month — REFUTED, decisively.** Minutes land ~21
   days after a decision, which puts the January/March-April/June-July/October slots in mid-February, May,
   August and November — exactly where the settlement Wednesday sits.

   | | n | collide with a settlement | VIX down |
   |---|---|---|---|
   | Minutes in **Feb/May/Aug/Nov** | 78 | **44 (56%)** | **53.8%** |
   | Minutes in every other month | 82 | **2 (2%)** | **74.4%** |

   Splitting by month slot alone: **−20.5pp at P = 0.0080** — *larger and more significant* than the
   collision split it is supposed to explain. And **inside** the Feb/May/Aug/Nov slot, where the two labels
   finally come apart, the collision split **collapses**: 47.7% (n = 44) vs 61.8% (n = 34), −14.0pp,
   **P = 0.261**. Controlled for the month, "collides with a settlement" adds nothing that separates from
   noise.

8. **The family of splits is riddled with hits — SUPPORTED, and it is why leg 7 matters.** The split was
   post-hoc by the minutes lane's own admission. Running 14 arbitrary calendar predicates over the same 160
   releases:

   | Split | on | off | diff | P |
   |---|---|---|---|---|
   | **settlement day** | 50.0% (46) | 70.2% (114) | −20.2pp | **0.019** |
   | **Feb/May/Aug/Nov** | 53.8% (78) | 74.4% (82) | −20.5pp | **0.008** |
   | **day-of-month > 15** | 56.8% (81) | 72.2% (79) | −15.4pp | **0.049** |
   | third Wednesday | 52.9% (51) | 69.7% (109) | −16.8pp | 0.051 |
   | opex week | 55.6% (45) | 67.8% (115) | −12.3pp | 0.197 |
   | VIX > 20 prior close | 73.7% (57) | 59.2% (103) | +14.5pp | 0.086 |
   | pre-2017 · even year · H2 · Tue · Wed · month-end · SPX up prior | — | — | — | 0.25 – 1.00 |

   **3 of 14 clear P < 0.05** where ~0.7 is expected. These predicates are near-collinear — they pick out
   roughly the same mid-month Wednesdays — so the family is not 14 independent tests, but that is the point:
   **any one of them can be told as the mechanism, and the data cannot say which.**

9. **The settlement itself is untouched — REFUTED on four contemporaneous measures.** 46 collision
   settlements against 171 others, log points of VIX, 100,000-draw two-sided permutation:

   | Measure | Collision (n = 46) | Other settlements (n = 171) | Diff | P |
   |---|---|---|---|---|
   | `VRO` vs prior close | +1.12% (med +1.02) | +0.08% (med −0.38) | +1.04 | **0.240** |
   | VIX **open** vs prior close | +0.48% (med +0.40) | −0.11% (med −0.17) | +0.59 | **0.312** |
   | **SOQ basis** (`VRO` vs same-session open) | +0.64% (med −0.34) | +0.19% (med +0.07) | +0.45 | **0.456** |
   | VIX close vs `VRO` | −1.50% (med −0.95) | −0.21% (med −0.93) | −1.29 | **0.291** |

   Every point estimate leans the "richer settlement" way and **not one separates from noise**. Stated
   honestly: this is a failure to reject on n = 46, not a demonstration that the effect is zero — the
   direction is worth re-checking as instances accrue, which is what FT-2 exists for.

10. **Forward accuracy is null too, and leans the wrong way — REFUTED.** For all 217 settlements, realized
    close-to-close SPX vol over the contract's own 30-day reference window, differenced against `VRO`:

    | Group | `VRO` | realized | premium | `VRO` > realized |
    |---|---|---|---|---|
    | Collision (n = 46) | 19.98 | 17.20 | **+2.78** (med +4.66) | **39 / 46 = 85%** |
    | Other settlements (n = 171) | 19.73 | 15.43 | **+4.30** (med +5.09) | **145 / 171 = 85%** |

    **−1.52 points, P = 0.280**, with an *identical* overprice rate. A settlement struck in the same
    session as a minutes release is not struck rich; if anything the point estimate says slightly cheap,
    which is the opposite sign to the extra-information story.

11. **This settlement is OUTSIDE any FOMC blackout — SUPPORTED, structural, and it retires the class's
    dominant framing for this id.** The October 2027 gate runs 2027-10-16 → 2027-10-28 and the December
    gate opens 2027-11-27; **2027-11-17 sits between them.** With this id now tracked, **3 of 9** tracked
    expirations are outside a blackout (2027-02-17, 2027-05-18, this one). The blackout legs that
    [`vix-expiration-2027-10-20`](vix-expiration-2027-10-20.md) and
    [`vix-expiration-2027-04-21`](vix-expiration-2027-04-21.md) are built on **do not apply here**, and are
    cited rather than re-derived.

12. **The 30-day window carries a closure and a SEP decision — SUPPORTED, structural only.** `VX/X7`'s
    reference window runs **2027-11-17 → 2027-12-17**: 30 calendar days, 23 weekdays, **one exchange
    closure inside** — **Thanksgiving 2027-11-25** — leaving **22 trading sessions** (both endpoints
    inclusive; the 2027-10-20 sibling reports its own window as 22 under an endpoint-exclusive convention,
    which is a counting convention and not a disagreement). Three of the eight prior tracked windows also
    contain a closure (Presidents' Day, Good Friday, Memorial Day), so a closure is not novel — **Thanksgiving
    is**, as the only US closure with an adjacent half-session (2027-11-26). Contents:
    `fomc-blackout-start-2027-11-27` at **+10**,
    [`consumer-confidence-2027-11-30`](consumer-confidence-2027-11-30.md) and
    [`fhfa-hpi-2027-11-30`](fhfa-hpi-2027-11-30.md) at **+13** (the FHFA print the window's only
    `confirmed` entry), and [`fomc-2027-12-08`](fomc-2027-12-08.md) at **+21** — the year's final SEP
    decision, inside the window, with the contract long settled by then.

13. **Nothing in the house system is settlement-keyed — SUPPORTED, re-verified rather than inherited.**
    `trade-playbooks.md` and `multi-symbol-sweep.md` grepped for
    `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**, matching every sibling
    result since 2026-09-05.

14. **The sweep proposes nothing, and the refusal is computed — SUPPORTED.** The ±5-day corridor
    (2027-11-12 → 2027-11-22) contains exactly two ids, both already owned by the same parent lane:
    [`fomc-minutes-2027-11-17`](fomc-minutes-2027-11-17.md) at **0** (canonical) and `opex-2027-11-19` at
    **+2** (that lane's live proposal). Thanksgiving 2027-11-25 sits at **+8**, outside the corridor, and is
    already proposed as `thanksgiving-market-closure-2027-11-25.from-fomc-minutes-2027-11-17`. Two
    candidates were **declined**: re-proposing `opex-2027-11-19` (legal, and pure noise), and
    `opex-2027-12-17`, this contract's own reference series — declined on the precedent this class has set
    three times since `opex-2027-04-16` corrected the "constitutive input" framing, and in any case already
    proposed twice by other lanes. The **seven remaining untracked** monthly VIX settlements between
    2026-09 and 2027-12 (2026-10-21 · 2026-11-18 · 2026-12-16 · 2027-06-16 · 2027-07-21 · 2027-08-18 ·
    2027-12-22 — the 2027-10-20 lane's list of eight, less this id, now tracked) remain a coverage-policy
    decision no single lane should take. This is the **fourth** ledger in this class to record it, and the
    first able to say the count is going down.

### What the conditions support

Nothing directional, and no sizing. Four outputs, in descending order of value:

- **A confound, computed rather than asserted.** The 50.0%/71.0% minutes-day split reproduces at
  **P = 0.019** and its named mechanism does not survive: there is **no settlement main effect**
  (+0.8pp, P = 0.876), the label is **96% a restatement of the Feb/May/Aug/Nov slot**, month alone splits
  *harder* (**P = 0.0080**), and inside that slot collision collapses to **P = 0.261**.
- **A measured null from the settlement's own side, which no sibling had run** — 46 collision settlements
  against 171 others are null on four contemporaneous measures (**P = 0.24 – 0.46**) and on forward
  accuracy (**+2.78 vs +4.30 pts, P = 0.280**, identical 85% overprice rate).
- **A multiple-comparisons frame for this whole family** — 3 of 14 arbitrary calendar splits clear
  P < 0.05 against ~0.7 expected, which is the honest context for any post-hoc split of 160 releases.
- **Two provenance findings** — the publisher errs exactly where it is **unanchored** (1 of 36 rows, and
  this row is not it), and Cboe's `VIX_History.csv` is **not a trading-day file** (215/218 vs 217/218).

### Honest limits

The **date is `estimate`** and stays so until `VX/X7` is listed; the arithmetic is strong (217/218 and
35/36) and the listing is the missing thing. Leg 9's sample is **46 against 171** and leg 10's the same: a
null on those numbers is a **failure to reject**, not proof of absence, and every point estimate in leg 9
leans the "richer settlement" direction — the honest reading is *unresolved and small*, not *zero*. Leg 7's
within-slot arm is **44 against 34**, small enough that its own null is weak; what it establishes is that
the collision label is **not identified** apart from the month, not that collision is inert. Leg 8's 14
predicates are **near-collinear**, so "3 of 14 versus 0.7 expected" overstates the arithmetic surprise even
as it correctly describes the researcher-degrees-of-freedom problem. The minutes parse takes the Board's
`(Released …)` string at face value and keeps **unscheduled-meeting minutes**, which the 157-release parse
appears to drop; the direction of that difference on the split was not tested separately. Realized vol is
**close-to-close SPX**, not intraday, and `VRO` is a **daily** series, so the SOQ basis compares two prints
struck minutes apart, not simultaneously. Blackout windows in leg 11 are **computed from the Fed's stated
rule**, not decoded from the Board's shaded PDF, and are used only to place this date outside both gates —
a coarse claim the arithmetic supports comfortably. No house instrument tests any of this, which is exactly
why these are refusals rather than inversions into trades. Nothing about same-day VIX open interest by
strike or SPX gamma is quoted: at D-435 that describes a different expiry. Educational, paper-standard
throughout.

## Stance & kill switches

**Stance (date `estimate` as of 2026-09-08 on Cboe rule text validated 217-of-218 against the venue's own
settlement prints and 35-of-36 against the OIC/OCC calendar, which also publishes this exact date; `VX/X7`
unlisted; every event in the reference window `estimate` except `fhfa-hpi-2027-11-30`).** Treat
**2027-11-17, 09:30 ET** as a known-date, **low-impact microstructure marker** and never as a tradeable
event. No position is opened, closed or sized because of it. One guard applies: **nothing executes on that
day's opening auction**, on any name — the expiring VX contract's last trade is 09:00 ET and the SOQ's
first prints are settlement artifacts; on this date the guard stacks with a 14:00 ET minutes release in the
same session. Three findings are carried forward rather than acted on. **(a)** The proposal's headline is
**reproduced and then confounded**: the 50.0%/71.0% split is real (P = 0.019) but its named mechanism is
not — there is no settlement main effect (**+0.8pp, P = 0.876**), the label is 96% the Feb/May/Aug/Nov
month slot (**2 of 82** other-month releases collide), month alone splits harder (**P = 0.0080**), and
within the slot collision collapses (**P = 0.261**). **(b)** The settlement itself is **measured
untouched**, on four contemporaneous measures (P = 0.24 – 0.46) and on forward accuracy (+2.78 vs +4.30
pts, P = 0.280, identical 85% overprice rate) — with the caveat that all four point estimates lean the same
way and n = 46 cannot resolve it. **(c)** The publisher is weak **where it is unanchored**, which is one row
of 36 and not this one. The one thing this ledger will not do is carry "shares a session with the minutes"
forward as a property of a settlement; that is exactly what legs 6–10 measured and refused.

**Kill switches:**

- **Cboe lists `VX/X7` with an expiration date other than 2027-11-17** — leg 1's rule fails on the one
  contract this ledger is about, and the entire document re-dates. Re-check both Cboe surfaces at every
  pulse rather than trusting the arithmetic.
- **`VX/X7` appears on a Cboe settlement or expiration-calendar surface dated 2027-11-17** — the promotion
  trigger; the entry flips `estimate` → `confirmed` under `OCC:` and nothing else changes.
- **The within-Feb/May/Aug/Nov collision split reaches P < 0.05** once the four upcoming collisions land
  (2026-11-18, 2027-02-17, 2027-08-18 and 2027-11-17 itself, plus ten new minutes days) — leg 7's confound
  stops being decisive and the mechanism question reopens. This is
  **`FT-vix-expiration-2027-11-17-1`**, scored at close-out.
- **The OIC/OCC calendar reissues with a 2028-01-21 anchor and still publishes 2027-12-15** — leg 4's
  "errs where unanchored" mechanism fails, and this date's provenance loses the leg that distinguishes it
  from its neighbour. This is **`FT-vix-expiration-2027-11-17-2`**. Re-check the calendar at every pulse.
- **The 2026-11-18 settlement's SOQ basis prints above +0.64% and VIX closes down** — the next collision,
  **71 days out**, showing a minutes premium *in the settlement*; leg 9's null would go back in play on
  out-of-sample data. Not registered as a forward test (see below) but watched.
- **NYSE or Cboe publishes a revised 2027 calendar putting a closure on 2027-11-17 or 2027-12-17** — the
  holiday clause fires, settlement moves to the preceding business day, and this ledger re-dates. Re-fetch
  a 2027 exchange calendar by **2027-01-04**.
- **The October 2027 FOMC moves off 2027-10-26/27** — the minutes date moves with it and the collision
  this document is about ceases to exist; the settlement date is unaffected but the framing is. Observe by
  **2027-09-15**, when the September meeting confirms the October slot.
- **A house vol/opex instrument gets built and back-tested** — legs 9, 10 and 13 stop being
  mechanics-plus-citation and start being data; this sheet is rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2027-11-17.md`](../forward-tests/vix-expiration-2027-11-17.md):
`FT-vix-expiration-2027-11-17-1`, the **confound test** — the within-slot collision split stays null as
four more collisions land, scored at close-out 2027-11-18; and `FT-vix-expiration-2027-11-17-2`, the
**publisher-anchor mechanism** — a reissue that gains the 2028 anchor corrects 2027-12-15 to 2027-12-22.
A third candidate was **declined**: predicting VIX's *direction* on the 2026-11-18 collision, whose base
rate in that cell is **exactly 50.0%** — a coin flip on n = 1 cannot discriminate between the two
explanations, so it is a watch item above rather than a registration. Nothing here scores any sibling's row.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-435 | Initial research on an id that existed only as `proposals/vix-expiration-2027-11-17.from-fomc-minutes-2027-11-17.json`; that proposal was read first and the **canonical `vix-expiration-2027-11-17.json` is written in this PR**, shadowing it. probe-ref seeded (no symbols; **VIX 14.53** at the 2026-09-04 close — the last regular session, since 2026-09-07 was Labor Day; band `low:15+`; 2 adjacents; **nothing blocked**). **THE PROPOSAL'S HEADLINE REPRODUCES AND ITS MECHANISM DOES NOT — the deliverable.** Independent parse of **160** minutes releases 2007-02-21→2026-08-19 (Board calendar + 14 historical pages, all HTTP 200; the minutes lane parsed 157, the delta being unscheduled-meeting minutes) against an exact settlement engine: minutes **on** a settlement **50.0% VIX-down (n=46)** vs **off 70.2% (n=114)**, **−20.2pp, P=0.019** — the lane's 50.0/71.0 on n=50/107 confirmed by a stricter classifier. **(i) NO SETTLEMENT MAIN EFFECT to do the killing.** 2×2 over 4,594 era sessions: not-settlement/not-minutes **54.1% (n=4,274)**, settlement/not-minutes **55.0% (n=171)** → **+0.8pp, P=0.876**; all 217 settlements **53.9%** vs a **54.5%** era base; settlements split by minutes **50.0 vs 55.0, P=0.615**. The 46-cell sits *on* the base rate. **(ii) THE LABEL IS THE MONTH.** 44 of 78 Feb/May/Aug/Nov releases collide vs **2 of 82** elsewhere; month slot alone splits **53.8 vs 74.4, −20.5pp, P=0.0080** — *larger and more significant* than collision; **within** the slot collision collapses to **47.7 (n=44) vs 61.8 (n=34), −14.0pp, P=0.261**. **(iii) THE FAMILY IS RIDDLED.** 14 arbitrary calendar splits of the same 160 releases → **3 clear P<0.05** (settlement 0.019, Feb/May/Aug/Nov 0.008, day>15 0.049; third-Wednesday 0.051) against ~0.7 expected; the predicates are near-collinear, so any one can be told as the mechanism. **THE SETTLEMENT ITSELF IS UNTOUCHED, first time measured in this family:** 46 collisions vs 171 others, 100k permutation — `VRO` vs prior close +1.12 vs +0.08 (**P=0.240**), open gap +0.48 vs −0.11 (**P=0.312**), **SOQ basis +0.64 vs +0.19 (P=0.456)**, close vs `VRO` −1.50 vs −0.21 (**P=0.291**); forward accuracy `VRO` − realized SPX vol over each contract's own window **+2.78 (n=46) vs +4.30 (n=171), P=0.280**, overprice **85% vs 85%** — *lower*, wrong sign for a premium story. Every point estimate leans "richer" and none separates: a failure to reject on n=46, said plainly. **DATE — LEG 1:** rule applied cold gives 2027-11-17 (Dec-2027 third Friday **2027-12-17** −30d), no 2027 closure on either leg; engine reproduces **217 of 218** `VRO` prints (1 absent: 2013-05-22, no May-2013 row at any date) and **6 of 6** displacements, and matches the OIC/OCC calendar **35 of 36**, which **publishes 2027-11-17 outright**. **LEG 4 — PROVENANCE, narrowing the 2027-10-20 sibling's warning:** its 2027-12-15 error reproduces exactly (rule: 2027-12-22; 12-15+30d = 2028-01-14, January's *second* Friday) — **and of 36 volatility rows exactly ONE has its own +30d third Friday missing from the same file: that one**, whose anchor falls past the file's 2027-12-31 end. **This row's anchor, 2027-12-17, IS published in the file.** The publisher errs where it is unanchored. **LEG 3 — stays `estimate` on the LISTING, not the calendar:** `VX/X7` on no Cboe surface (`VX` stops **K7**, `VXM` **G7**, zero `X7` in 56 rows). **LEG 2 — METHOD GOTCHA for the class, run both ways:** Cboe's `VIX_History.csv` is **not a trading-day file** — full OHLC rows on Thanksgiving 2025-11-27, Memorial Day 2026-05-25, Juneteenth 2024-06-19, the 2025-01-09 funeral closure, 2026-07-03 and Labor Day 2026-09-07, while omitting New Year's and Christmas. Sourcing holidays from it scores **215/218** and loses both Juneteenth displacements; statute scores **217/218**. **STRUCTURE — the class's framing does NOT apply here:** 2027-11-17 is **OUTSIDE any blackout** (Oct gate closes 10-28, Dec gate opens 11-27) — **3 of 9** tracked expirations now outside one. Window **2027-11-17→2027-12-17**: 23 weekdays −**Thanksgiving 11-25** = **22 sessions**, first tracked VIX window with the one US closure carrying an adjacent half-session (11-26); contains `fomc-blackout-start-2027-11-27` (+10), `consumer-confidence-` and `fhfa-hpi-2027-11-30` (+13, FHFA the only `confirmed`), **`fomc-2027-12-08` (+21, the year's final SEP)**. Adjacency — **peers:** none (`symbols: []`). **Macro:** the parent minutes lane's autumn-slot findings cited not re-derived. **Volatility regime:** baseline row, nothing to diff; Cboe closes 2026-09-04 **VIX1D 12.03 · VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42**; listed strip U6 **16.2669** → K7 **21.15**, **no `X7`**. **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** playbooks grepped → **zero hits in both**. **NOTHING PROPOSED, refusal computed:** corridor 2027-11-12→11-22 holds only `fomc-minutes-2027-11-17` (0, canonical) and `opex-2027-11-19` (+2, the parent lane's live proposal); Thanksgiving 2027-11-25 is at +8, outside it, and already proposed by that lane; `opex-2027-12-17` declined on the thrice-set constitutive-input precedent and already proposed twice. Untracked monthly settlements now **seven** (the 2027-10-20 lane's eight less this id) — **fourth** ledger to record it, first able to say the count fell. **`FT-vix-expiration-2027-11-17-1` and `-2` registered; a third declined** (VIX direction on the 2026-11-18 collision is a **50.0%** coin flip on n=1 and cannot discriminate — watched, not registered). **Own weaknesses:** 46 vs 171 is a failure to reject, not proof of absence, and all four point estimates lean one way; the within-slot arm is 44 vs 34; the 14 predicates are near-collinear so "3 of 14" overstates the arithmetic surprise; realized vol is close-to-close SPX and `VRO` is daily; blackout gates are computed from the Fed's stated rule, not decoded from the shaded PDF. | Initial stance set: **stand aside** (structural row only); date **`estimate`** — `VX/X7` unlisted, though the naming publisher is shown to err only where unanchored, which this row is not. | 2026-10-08 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-vix-expiration-2027-11-17.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
