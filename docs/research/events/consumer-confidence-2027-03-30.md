# Conference Board Consumer Confidence (Mar 2027) — consumer-confidence-2027-03-30

**Kind:** macro-print · **Date:** 2027-03-30 (estimate, EST: the publisher's stated "last Tuesday of every month" rule, verified this session against three primary-sourced March editions — 2023-03-28, 2024-03-26, 2025-03-25 — every one the last Tuesday of its March, all three double-sourced by the preceding February edition's own next-release line) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["sifma-bond-early-close-2027-03-25","good-friday-market-closure-2027-03-26","japan-cpi-tokyo-flash-2027-03-26","boj-summary-of-opinions-2027-03-29","ftc-v-amazon-antitrust-trial-2027-03-29","sifma-japan-early-close-2027-03-29","sifma-uk-bond-market-closure-2027-03-29","sp-select-sector-secondary-reweight-2027-03-31","japan-food-tax-cut-2027-04-01"],"screenStreak":0,"blocked":[{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Mar-2021","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Mar-2022","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Mar-2026","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **The February sibling's null replicates — and the control rule it left behind is not strong
enough to protect it.** This id was proposed as the replication instance for that ledger's finding
(the Conference Board release day is statistically ordinary once the FOMC collision is removed), and
the replication passes: this session's pipeline reproduces the sibling's clean-day medians **exactly**
(n=51, **0 of 9** at p<0.05), and CB days with March removed are **0 of 9** as well, so March was never
carrying the null. What March adds is a **methodological upgrade paid for by a near-miss**. March is the
**widest month in the sample — 9 of 9** at p<0.05 against the rest of the year (SPY **1.291 vs 0.936**,
VIX close **21.840 vs 17.750**, both p<0.0001), more than double February's 4 of 9. Run the sibling's own
prescribed control — *compare a March session to March* — and the six March CB days come back
**significantly NARROW, 3 of 9** (SPY **0.662 vs 1.304**, p=**0.0301**). That reads as an effect, and it
is not one. **March's width is front-loaded**: the last five sessions of each March run narrower than
earlier March sessions on **6 of 9** (SPY 1.019 vs 1.353, p=**0.0040**; VIX 19.505 vs 22.965,
p=**0.0012**), and the last-Tuesday rule puts this release in that final week **by construction**.
Against other **late-March** sessions, March CB days are **0 of 9** (SPY 0.662 vs 1.039, p=0.2650).
**So the correct control for a fixed-position monthly release is the same WEEK of the same month, not
the month** — a monthly control is confounded whenever a month's width is not flat across it. The
quarter-end story this print was flagged for is separately measured and empty: quarter-end sessions are
**quieter**, not wilder, and March CB days versus other quarter-end sessions are **0 of 9**. Two
corrections to the proposal that filed this id are banked below (its panel-timing claim is inverted; its
Good Friday flag has **zero** precedent). Date **estimate**; `symbols: []`; **0** macro-keyed playbooks.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-205) | **Stand aside** | High | `symbols: []`, D-205, the March panel does not open for six months, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits**. Nothing dated exists to act on. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2027-03-30** — none exists today |
| This week | **Stand aside — the series' live question is the 09-29 print** | High | The current edition is **August 2026, released 08-25**: headline **89.4** (from 90.2), Present Situation **121.2**, Expectations **68.2**, survey period **Aug 3–16**, cut-off **Aug 16**; the page names **2026-09-29** as the next release. Market state **2026-09-04**: VIX **14.53**, SPY **770.19**. | The Conference Board naming a March 2027 date other than **2027-03-30** before **2027-03-02**, which breaks the March rule this doc's date rests on |
| This month | **Do not model this release day — the null replicates, and March adds nothing to it** | High | Clean (no-FOMC) CB days reproduce the sibling exactly: n=51, **0 of 9**, SPY 0.910. CB days **excluding March**: **0 of 9** (n=62). March CB days vs other late-March sessions: **0 of 9** (SPY 0.662 / 1.039, p=0.2650). 1 of 6 March CB days exceeds the late-March 75th percentile — chance is 25%. | Any of the nine printing p<0.05 for clean CB days, or for March CB days against late-March sessions, on a re-run of the same pipeline after **2027-06-30** |
| This quarter | **Control a fixed-position release against its own WEEK, not its month — March proves the month is not enough** | High | March is 9 of 9 wide vs the rest of the year (SPY 1.291/0.936, p<0.0001) and that width is front-loaded (last-5 vs earlier March: 6 of 9, SPY 1.019/1.353, p=0.0040). The month-level control manufactures a **3 of 9** narrowing that the week-level control kills at **0 of 9**. | The last-five-March-sessions set failing to run narrower than earlier March sessions on at least 4 of 9 when 2027 is added, on a re-run after **2027-06-30** |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks,
  and the release day is null against every control that survives inspection.
- **The Conference Board names a March 2027 date** → adopt it verbatim. The rule says **03-30**;
  registered as **FT-consumer-confidence-2027-03-30-1**.
- **Never control a last-Tuesday release against its calendar month alone** — do it against the same
  **week** of that month. March's month-level control produces a 3-of-9 "effect" that is position, not
  print; registered as **FT-consumer-confidence-2027-03-30-2**.
- **Do not price a quarter-end premium into this print.** Quarter-end-window sessions are measurably
  **quieter** (XRT p=0.0055, AMZN p=0.0160, XLF p=0.0306, all narrower), and this print against other
  quarter-end sessions is 0 of 9. Registered as **FT-consumer-confidence-2027-03-30-4**.
- **Read the March edition's stated cut-off date first** — sourced lags are **8 / 8 / 6** days, which
  puts a 2027 cut-off at **03-22 → 03-24**, i.e. **5–7 days after** the March 16-17 SEP decision. In all
  three sourced Marches the panel closed *before* the decision. Registered as
  **FT-consumer-confidence-2027-03-30-5**.
- **Read the level, never the month-over-month delta** — March restates February in **3 of 3** sourced
  editions (**+0.5 / −1.9 / +1.8**), and Feb-2024's Expectations was restated **79.8 → 76.3**, a 3.5-point
  move *across* the Board's own 80.0 threshold. Registered as **FT-consumer-confidence-2027-03-30-6**.
- **Expectations back above 80** → the Board's own recession threshold, breached since February 2025 and
  at **68.2** in August 2026, clears; the late-cycle framing this series carries dies. Registered as
  **FT-consumer-confidence-2027-03-30-7**.
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication
  restrictions — structural, established by the 09-29 sibling, not re-spent here.
- **Watch (dated):** FOMC **2026-09-16** · CB print **2026-09-29** · CPI **2026-10-14** · FOMC
  **2026-10-28** · CB print **2026-11-24** (est.) · FOMC **2026-12-09** · CB print **2026-12-22**
  (est.) · FOMC **2027-01-27** (est.) · CB print **2027-02-23** (est.) · blackout **2027-03-06**
  (est.) · **FOMC + SEP 2027-03-16/17** (est.) · Japan CPI **03-19** · opex **03-19** · BoJ minutes
  **03-24** · SIFMA bond early close **03-25** · **Good Friday closure 03-26** · Tokyo CPI flash
  **03-26** · BoJ summary + FTC-v-Amazon **03-29** · **this print 03-30** · S&P select-sector
  secondary reweight **03-31**.

## Initial research

### The question, plainly

The [February sibling](consumer-confidence-2027-02-23.md) proposed this id for one job: **be the
replication instance.** That ledger's central finding is that the Conference Board release day is
statistically ordinary once the FOMC collision is removed — 51 clean days, 0 of 9 — and it registered
`FT-consumer-confidence-2027-02-23-2` to re-run the pipeline after 2027-06-30 with 2027's clean prints
added. 2027-03-30 is one of exactly four clean 2027 prints inside that window, so the forward test
cannot be scored without it. Its second stated reason was that this is the first edition whose panel
sits on the far side of the March SEP meeting.

So: **does the null replicate, is the March date sound, and is the panel-timing claim true?** And, since
this is the first edition in the chain to land in a *quarter-end* week and after a *Good Friday*: **do
either of those structures put anything on the tape?**

**One-line verdict:** the date is well-sourced for an `estimate` (three primary-sourced Marches, all
three double-sourced), the null replicates cleanly — **and the control rule the sibling left behind
would have failed here**, because March is the widest month in the sample and its width is front-loaded
onto exactly the part of the month this release can never occupy. The quarter-end and Good-Friday
structures are measured at nothing and no precedent respectively, and the proposal's panel-timing claim
is inverted.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Sources fetched direct 2026-09-06**, all HTTP 200 and each verified
against its own `Source: <Month> <Year> Consumer Confidence Survey` line and its `Updated:` date rather
than trusted by slug: `conference-board.org/topics/consumer-confidence` (the cadence sentence, the named
next release, the August 2026 values, survey period and cut-off) and the publisher's `CCI-Mar-2023`,
`CCI-Mar-2024`, `CCI-Mar-2025`, `CCI-Feb-2023`, `CCI-Feb-2024` and `CCI-Feb-2025` pages. **The FOMC
dates are primary:** `federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200, **164,831 bytes**,
whose 2021–2026 panels and its `Future Year: 2027` panel (**January 26-27, March 16-17\*, April 27-28,
June 8-9\*, July 27-28, September 14-15\*, October 26-27, December 7-8\***) supply every meeting date
used below; it states *"Each meeting date is tentative until confirmed at the meeting immediately
preceding it."* **Three slugs failed the way the February sibling warned:** `CCI-Mar-2021`,
`CCI-Mar-2022` and `CCI-Mar-2026` each returned **HTTP 200 while serving the current August 2026
edition** (byte-identical at 332,019), recorded in `probe-ref.blocked` as `200-SERVED-CURRENT-EDITION`.
**The tape study is this session's own work and was built to be falsifiable against the sibling's:**
daily OHLC for SPY, QQQ, XLY, XRT, AMZN, AAPL, XLF, TLT and ^VIX from the Yahoo chart endpoint for
**2020-12-01 → 2026-09-04** (n=**1,447** sessions), session range `(high − low) / open`, two-sided
Mann-Whitney U with tie correction, VIX measured on close. Run first on the February sibling's own clean
set it **reproduces that ledger's published medians exactly** — SPY **0.910**, QQQ **1.379**, XLY
**1.399**, XRT **1.678**, AMZN **2.154**, AAPL **1.731**, XLF **1.119**, TLT **0.961**, VIX **18.560**,
0 of 9 — on the identical 51/17 clean/collision split of 68 rule-derived days. That replication is what
licenses legs 3–6 as a like-for-like extension of the same set. Easter dates are computed with the
anonymous Gregorian algorithm rather than looked up. Market readings are Yahoo daily closes for
**2026-09-04**: VIX **14.53**, SPY **770.19**.

### Conviction legs, tested

1. **The last-Tuesday rule HOLDS for March — SUPPORTED three-for-three, and all three are
   double-sourced.** The publisher states, fetched today: *"The Conference Board publishes the Consumer
   Confidence Index® at 10 a.m. ET on the last Tuesday of every month."* For December that is refuted on
   five consecutive editions ([12-22 sibling](consumer-confidence-2026-12-22.md) leg 1); for January it
   holds five-for-five and for February four-for-four. For March:

   | Edition | Released | Weekday | Last Tuesday of that March | Sources |
   |---|---|---|---|---|
   | Mar 2023 | 2023-03-28 | Tue | 03-28 | the edition's own `Updated : 2023-03-28` **and** `CCI-Feb-2023`'s *"The next release is Tuesday, March 28 at 10 AM ET"* |
   | Mar 2024 | 2024-03-26 | Tue | 03-26 | `Updated : 2024-03-26` **and** `CCI-Feb-2024`'s *"Tuesday, March 26th"* |
   | Mar 2025 | 2025-03-25 | Tue | 03-25 | `Updated : 2025-03-25` **and** `CCI-Feb-2025`'s *"Tuesday, March 25th"* |

   **2027-03-30 is the last Tuesday of March 2027.** April is a bonus three-for-three from the same
   fetches (`CCI-Mar-2023` → *"Tuesday, April 25"*; `CCI-Mar-2024` → *"April 30th"*; `CCI-Mar-2025` →
   *"April 29th"*) — which is what sources this PR's one proposal. Registered as
   **FT-consumer-confidence-2027-03-30-1**.

2. **The null replicates, and March is not what was carrying it — SUPPORTED.** On the identical
   2020-12 → 2026-09 window, the 68 rule-derived CB days split **51 clean / 17 colliding** exactly as the
   February sibling reported, and the clean set's nine medians match its published table to three
   decimals (SPY 0.910, QQQ 1.379, XLY 1.399, XRT 1.678, AMZN 2.154, AAPL 1.731, XLF 1.119, TLT 0.961,
   VIX 18.560), **0 of 9** at p<0.05 with the smallest p at XLF 0.2654. *(The p-values differ in the
   third decimal from the sibling's — SPY 0.4271 here against its 0.4083 — because the baseline set is
   re-derived from a tape pulled a day later; the medians, which are the claim, are identical. Reported
   rather than smoothed over.)* Removing March entirely, **CB days excluding March are 0 of 9** against
   non-March non-CB sessions (n=62, smallest p 0.3019) — so the null is not an artifact of one month
   being averaged in.

3. **March is the widest month in the sample — SUPPORTED, 9 of 9, and it more than doubles February's
   effect.** All **132** March sessions since 2021 against the other **1,315**:

   | Instrument | March (median rel / base) | p |
   |---|---|---|
   | SPY | **1.291 / 0.936** | **<0.0001** |
   | QQQ | **1.755 / 1.321** | **<0.0001** |
   | XLY | **1.817 / 1.388** | **<0.0001** |
   | XRT | **2.331 / 1.784** | **<0.0001** |
   | AAPL | **2.126 / 1.831** | **0.0001** |
   | XLF | **1.567 / 1.208** | **<0.0001** |
   | VIX close | **21.840 / 17.750** | **<0.0001** |
   | AMZN | 2.436 / 2.238 | **0.0254** |
   | TLT | 0.914 / 0.837 | **0.0090** |

   The February sibling measured its own month at **4 of 9**; March is **9 of 9** and every equity leg is
   below 0.0001. The window's Marches are why — March 2021 (post-COVID rate scare), March 2022 (the
   invasion and the first hike), March 2023 (the bank failures, which `CCI-Mar-2023` itself dates its
   cut-off *"about ten days after"*), March 2025 (the tariff drawdown). **This is a description of a
   six-year sample, not a seasonal law**, and it is stated as such.

4. **THE FINDING — the month-level control fails here, and position-in-month is why.** Applying the
   February sibling's own prescribed control (*compare a February session to February*) to March
   produces what looks like an effect:

   | Instrument | March CB days / other March sessions | p |
   |---|---|---|
   | SPY | **0.662 / 1.304** | **0.0301** |
   | QQQ | **1.093 / 1.763** | **0.0364** |
   | AMZN | **1.604 / 2.454** | **0.0215** |
   | AAPL | 1.550 / 2.145 | 0.0580 |
   | XLF | 0.905 / 1.578 | 0.0641 |
   | VIX close | 19.255 / 22.095 | 0.0936 |

   **3 of 9 at p<0.05, all in the narrow direction** — a March CB day looks like a conspicuously quiet
   session inside a violent month. It is not the print. **March's width is front-loaded.** Splitting each
   March into its last five sessions and everything earlier:

   | Instrument | Last-5 March / earlier March | p |
   |---|---|---|
   | SPY | **1.019 / 1.353** | **0.0040** |
   | QQQ | **1.551 / 1.880** | **0.0029** |
   | AMZN | **2.023 / 2.574** | **0.0013** |
   | AAPL | **1.862 / 2.282** | **0.0029** |
   | VIX close | **19.505 / 22.965** | **0.0012** |
   | XLY | **1.697 / 1.873** | **0.0420** |
   | XRT · XLF · TLT | — | 0.052 → 0.096 |

   **6 of 9**, and the same pattern shows per year: median SPY range early-March vs late-March runs
   1.207/0.999 (2021), 1.781/1.063 (2022), 1.629/0.730 (2023), 0.929/0.350 (2024), 1.717/1.589 (2025),
   1.269/1.538 (2026) — narrower late in five of six. The last-Tuesday rule places this release in that
   final week **in every single year, by construction**. Against other **late-March** sessions the effect
   is gone:

   | Instrument | March CB days / other late-March sessions | p |
   |---|---|---|
   | SPY | 0.662 / 1.039 | 0.2650 |
   | QQQ | 1.093 / 1.576 | 0.2650 |
   | AMZN | 1.604 / 2.052 | 0.1539 |
   | AAPL | 1.550 / 1.975 | 0.3120 |
   | XLF | 0.905 / 1.328 | 0.1861 |
   | XLY · XRT · TLT · VIX | — | 0.62 → 1.00 |

   **0 of 9**, n=6 against 24. And **1 of 6** March CB days exceeds the late-March 75th percentile of SPY
   range against a chance rate of 25%. **The rule that generalizes:** a monthly control is only valid if
   the month's width is roughly flat across it. A release with a **fixed position** in the month — a last
   Tuesday, a first Friday, a third Wednesday — inherits that position's character, so it must be
   compared against **the same week of the same month**. The February sibling's control was right for
   February (whose width is diffuse) and would have manufactured a 3-of-9 finding in March. Registered as
   **FT-consumer-confidence-2027-03-30-2** and **-3**.

5. **The quarter-end structure this print was flagged for is measured and empty — SUPPORTED, and it
   runs the wrong way.** 2027-03-30 is the **penultimate** session of Q1 2027 (Q1 ends Wednesday
   2027-03-31), and every March CB day sits in the quarter-end window: positions from the last session
   of Q1 are **1 / 2 / 3 / 2 / 4 / 0** for 2021 → 2026. Taking the last three sessions of every quarter
   (n=72) against all others, quarter-end sessions are **quieter, not wilder** — 3 of 9 and every one
   narrower: XRT **1.564 / 1.842** (p=**0.0055**), AMZN **1.979 / 2.280** (**0.0160**), XLF **1.026 /
   1.236** (**0.0306**); SPY 0.852/0.973 (0.1493), VIX close 17.345/18.140 (0.2412). And March CB days
   against **other quarter-end-window sessions** are **0 of 9** (SPY 0.662 / 0.848, p=0.5030, n=6). So
   there is no quarter-end premium to price into this print, and the direction of the quarter-end
   effect — toward calm — is the opposite of the rebalancing-turbulence story. Registered as
   **FT-consumer-confidence-2027-03-30-4**.

6. **Per-day, the release is regime and not event — SUPPORTED, with one honest outlier.**

   | | 2021-03-30 | 2022-03-29 | 2023-03-28 | 2024-03-26 | 2025-03-25 | 2026-03-31 |
   |---|---|---|---|---|---|---|
   | SPY range % | 0.616 | 1.063 | 0.707 | **0.610** | **0.473** | **2.122** |
   | SPY close-to-close % | −0.27 | +1.24 | −0.22 | −0.18 | +0.24 | **+2.91** |
   | VIX close | 19.61 | 18.90 | 19.97 | **13.24** | 17.15 | **25.25** |

   Five of six are unremarkable; **2026-03-31 is a 4.5× outlier on range** and it is also the only one of
   the six that fell on the **last** session of a quarter, in a VIX-25 regime. One day is not a pattern
   and it is not treated as one — but it is the single observation that would matter if the next re-run
   moved, so it is stated rather than averaged away. **D+1 after a March CB day is 0 of 9** against other
   late-March sessions (SPY 0.787 / 1.273, p=0.2655), so nothing is displaced onto the following session
   either.

7. **The proposal's panel-timing claim is INVERTED — REFUTED, and the true version is more
   interesting.** The proposal that filed this id called it *"the FIRST edition whose panel opens after
   the March SEP meeting."* Sourced March cut-off dates are **2023-03-20**, **2024-03-18** and
   **2025-03-19**, i.e. lags of **8 / 8 / 6** days before release, which puts a March panel at roughly the
   **1st through the 22nd** of its month. A 2027 panel therefore *opens* around **03-01**, two weeks
   **before** the March 16-17 decision — the claim is false as written. What is true is the mirror image,
   and it is a real structural distinction:

   | Year | March FOMC (decision day) | CB cut-off | CB release | Panel closed… |
   |---|---|---|---|---|
   | 2023 | 03-21/22 (**03-22**) | **03-20** (sourced) | 03-28 | **before** the decision |
   | 2024 | 03-19/20 (**03-20**) | **03-18** (sourced) | 03-26 | **before** the decision |
   | 2025 | 03-18/19 (**03-19**) | **03-19** (sourced) | 03-25 | **on** decision day (announcement 14:00 ET) |
   | **2027** | **03-16/17** (**03-17**) | **~03-22 → 03-24** (rule-derived) | **03-30** | **5–7 days after** the decision |

   In every year with a primary-sourced cut-off, the March panel **closed before** the SEP decision; the
   2027 geometry puts the decision **inside** the field window, so roughly the back half of the responses
   would be collected post-decision. The mechanism is the Fed's own calendar drifting: 2023–2025 all met
   in the *third or fourth* week of March (a 6-day decision→release gap), while 2021, 2022, 2026 and 2027
   meet in the *second or third* (a **13-day** gap). **Two honesty flags.** The 2021, 2022 and 2026 cut-offs
   could **not** be sourced (`CCI-Mar-2021`/`-2022`/`-2026` all served the current edition at HTTP 200), so
   whether those years' panels also straddled their decisions is unknown, not "no" — the claim is
   restricted to the three sourced years. And both dates are `estimate`; the Fed's own caveat applies.
   Registered as **FT-consumer-confidence-2027-03-30-5**.

8. **The Good Friday flag has ZERO precedent and therefore licenses nothing — REFUTED as a tradable
   consideration.** The proposal noted that `good-friday-market-closure-2027-03-26` falls four days
   before this print. Easter 2027 is **March 28** (computed, not looked up), so Good Friday is
   **2027-03-26** — confirmed. But across 2021–2026 the Easter dates are **04-04, 04-17, 04-09, 03-31,
   04-20, 04-05**: only 2024's Good Friday (**03-29**) fell in March at all, and it came **three days
   after** that year's CB print. **No March CB print in the sample has ever followed a Good Friday
   closure.** With n=0 there is nothing to measure, so the correct handling is to state the structure and
   refuse to price it. The one *non*-tape consequence worth carrying forward is survey-mechanical: a
   holiday-shortened week sits inside the ~03-01 → 03-23 field window, which is a plausible reason for
   the Board to move the cut-off, and the cut-off is the first thing to read when the edition lands.

9. **The "read the level, not the delta" aid extends to a third month — SUPPORTED, 3 of 3, and one
   revision crossed the Board's own threshold.** The January sibling measured it on January, February's on
   February; March restates February just as reliably:

   | February, as first printed | Restated in the March edition | Revision |
   |---|---|---|
   | Feb 2023 **102.9** (`CCI-Feb-2023`) | Mar-2023 cites **103.4** ("up from 103.4 in February") | **+0.5** |
   | Feb 2024 **106.7** (`CCI-Feb-2024`) | Mar-2024 cites **"a downwardly revised 104.8 in February"** | **−1.9** |
   | Feb 2025 **98.3** (`CCI-Feb-2025`) | Mar-2025's "fell by 7.2 points in March to 92.9" implies **100.1** | **+1.8** (derived) |

   Present Situation restates the same way (**152.8 → 153.0**, **147.2 → 147.6**, **136.5 → 138.1**
   derived). **The sharpest instance is Expectations in February 2024: first printed 79.8, restated by
   `CCI-Mar-2024` to 76.3 — a 3.5-point move, and it is a move *across* the Board's own 80.0 recession
   threshold in the direction of a worse read.** So a threshold call taken off a first print can be
   wrong by more than the threshold's own resolution. Registered as
   **FT-consumer-confidence-2027-03-30-6**.

10. **March-on-March levels, and the Expectations threshold — SUPPORTED.** Sourced March headline /
    Present Situation / Expectations: **2023** 104.2 / 151.1 / 73.0 · **2024** 104.7 / 151.0 / 73.8 ·
    **2025** 92.9 / 134.5 / 65.2. Expectations sat **below the Board's own 80.0 recession threshold in
    all three**, and `CCI-Mar-2025` calls its 65.2 *"the lowest level in 12 years."* The August 2026
    edition reads **89.4 / 121.2 / 68.2** — Present Situation has fallen from a March-2023 151.1 to
    121.2, and Expectations has not printed above 80 in this series since 2024. **The narrow reading,
    stated:** this describes what the survey has been, not what it will print, and at D-205 the March
    2027 panel has not opened. Registered as **FT-consumer-confidence-2027-03-30-7**.

11. **Tracked-name sensitivity is nil, and the corridor is dense but irrelevant to it — SUPPORTED.**
    `symbols: []`. Only **AAPL** and **AMZN** carry direct consumer exposure; neither reports near
    03-30, and both sit inside leg 2's clean-day null (p=0.4350, p=0.5320). A re-grep of
    `docs/plans/trade-playbooks.md` and [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for any
    macro- or sentiment-keyed playbook returns **0 hits** — the single `sentiment` string at
    `trade-playbooks.md:115` is a portfolio weighting input, not a macro-print playbook. The corridor
    around this date is the densest in the chain — nine tracked events within five days, including
    `good-friday-market-closure-2027-03-26`, `ftc-v-amazon-antitrust-trial-2027-03-29` (an **AMZN**
    docket item the day before) and `sp-select-sector-secondary-reweight-2027-03-31` (the day after) —
    but none of them are keyed to this print and this print is keyed to none of them. Density is a reason
    to attribute carefully, not a reason to act.

### What the conditions support

**A refusal, a confirmed null, and a sharper control rule.** The refusal is unchanged and load-bearing:
**nothing is opened, closed or sized off this print** — `symbols: []`, zero macro-keyed playbooks,
D-205. The February sibling's null **replicates** (leg 2), survives the removal of March, and survives
the two structures this edition was flagged for — quarter-end (leg 5) and Good Friday (leg 8, at n=0).
What is *new* is the control rule, and it is the reusable part: **a fixed-position monthly release must
be controlled against the same week of the same month, not the month.** March demonstrates the failure
concretely — the month-level control, which is exactly what the previous ledger prescribed, returns
3 of 9 at p<0.05 in the narrow direction, and all of it is the last-Tuesday rule inheriting the character
of late March. That rule now applies backward too: any future re-run of the February or January work
should use the week-level control, and any *other* fixed-position release this calendar tracks (an opex
Friday, a first-Friday jobs print) inherits the same requirement. The reading order when the print
lands: the **cut-off date** first (leg 7 says the 2027 window should close 5–7 days after the SEP
decision, and a holiday-shortened week is a reason it might move), **February's restated value** second
(leg 9 — the delta is partly a revision, and one of those revisions crossed 80.0), the **Expectations**
level against 80.0 third, and the headline last.

### Honest limits

**The date is `estimate`.** The CB has not announced March 2027; three sourced Marches and a stated rule
are strong for an estimate and are not an announcement. **Three of the six March CB dates in the tape set
are the rule applied backward** — 2021-03-30, 2022-03-29 and 2026-03-31 were not separately sourced,
because `CCI-Mar-2021`, `CCI-Mar-2022` and `CCI-Mar-2026` all returned HTTP 200 while serving the current
August 2026 edition. That is a worse sourcing rate than February's (one of six) and it means half of
leg 4's treated set rests on the rule rather than a document. **Leg 3's "March is widest" is a six-year
sample, not a seasonality claim** — four of the six Marches contain a named macro shock, and one more
quiet March would move it materially. **Leg 4's treated set is n=6 and the late-March control set is
n=24**; the claim that survives is the **negative** one (the month-level effect does not replicate at
week level), not a positive claim that the print is quiet. **The whole study is at daily-bar resolution
and says nothing about the 10:00–10:30 ET window**, which is the only place a 10:00 macro print could
plausibly live; only an intraday design could look there, and none was run. **Leg 5's quarter-end result
is a by-product** of a comparison run for a different purpose, and its three significant legs are not
pre-registered. **Leg 6's 2026-03-31 outlier is one day** and is deliberately not explained. **Leg 7's
comparison covers three sourced years against a rule-derived fourth**, and the 2021/2022/2026 cut-offs
are unknown rather than known-not-to-straddle. **Leg 9's Feb-2025 revision is derived** from stated
point-changes rather than quoted. **No March consensus exists and structurally will not** (Conference
Board publication restrictions), so there is no measurable surprise gap to model. And **everything about
the March 2027 economy is unknown at D-205** — no part of this doc depends on what the survey prints.

## Stance & kill switches

**Stance (date `estimate`; not primary-confirmed).** Treat the March 2027 Conference Board edition as a
**medium-impact second-tier print that is regime information and never a trading event**. **No position
is opened, closed or sized off it.** This ledger's job was replication, and it replicates: the clean-day
null reproduces the February sibling's medians exactly at **0 of 9**, CB days with March removed are
**0 of 9**, and the two structures unique to this edition are empty — quarter-end sessions are
measurably *quieter* than baseline and this print is 0 of 9 against them, while the Good Friday flag has
**zero** historical instances and is therefore unpriceable rather than small. **What changes is the
method, not the call.** March is the widest month in the sample (9 of 9 vs the rest of the year) and its
width is **front-loaded**, so the sibling's prescribed month-level control manufactures a **3 of 9**
narrowing that dies at **0 of 9** against late-March sessions. The standing instruction is therefore
stronger than "control against the month": **control a fixed-position release against the same week of
the same month.** Two claims inherited from the proposal are corrected on the record — its panel-timing
statement is inverted (the panel opens *before* the March SEP decision and, on the three sourced years,
historically *closed* before it too; 2027's geometry is the first sourced case where the decision lands
*inside* the window), and its Good Friday note has no precedent to price. Base case for the print itself
(**Low** confidence — no consensus exists or will): **Expectations stays below the Board's own 80.0
recession threshold** (below it in all three sourced Marches, at 68.2 in August 2026) and the edition
**restates February 2027's headline by a nonzero amount** (3 of 3: +0.5 / −1.9 / +1.8). Read the level
and Expectations; a threshold read off a first print can be wrong by 3.5 points, as Feb-2024's
79.8 → 76.3 restatement was. Seven predictions are registered in
[`forward-tests/consumer-confidence-2027-03-30.md`](../forward-tests/consumer-confidence-2027-03-30.md).

**Kill switches:**

- **The Conference Board names a March 2027 date other than 2027-03-30** — the March last-Tuesday rule
  breaks despite three double-sourced contrary editions, and this doc's date confidence collapses to the
  December sibling's. Registered as **FT-consumer-confidence-2027-03-30-1**.
- **March CB days print any of the nine instruments at p<0.05 against OTHER LATE-MARCH sessions on a
  re-run after 2027-06-30** — the week-level control stops being clean, the release day becomes something
  to model after all, and the replication this ledger exists to provide fails.
  Registered as **FT-consumer-confidence-2027-03-30-2**.
- **The last five sessions of March stop running narrower than earlier March sessions (under 4 of 9 at
  p<0.05) on that same re-run** — the front-loading mechanism behind leg 4 dies, and with it the
  explanation for why the month-level control failed. The finding would then need a different cause or
  retirement. Registered as **FT-consumer-confidence-2027-03-30-3**.
- **March CB days clear p<0.05 on any instrument against other quarter-end-window sessions on that
  re-run** — leg 5's "no quarter-end premium" reading breaks. Registered as
  **FT-consumer-confidence-2027-03-30-4**.
- **The March 2027 edition states a cut-off date on or before 2027-03-17** — leg 7's geometry dies, the
  panel closes before the SEP decision as it did in 2023–2025, and this edition stops being the first
  sourced post-decision read. Registered as **FT-consumer-confidence-2027-03-30-5**.
- **The March 2027 edition cites a February 2027 headline identical to February's first print, or states
  no revision** — leg 9's extension of the reading aid weakens and the month-over-month delta becomes
  readable as news. Registered as **FT-consumer-confidence-2027-03-30-6**.
- **Expectations back above 80** — the Board's own recession-signal threshold, below which every sourced
  March has printed, clears; the late-cycle framing this whole series carries dies. Registered as
  **FT-consumer-confidence-2027-03-30-7**.
- **Expectations below ~60** — deterioration past the March-2025 12-year low, in the first edition whose
  panel is likely to have seen the March SEP projections; escalate ahead of the banded pulse.
- **The Fed moves the March 2027 meeting off 16-17** — leg 7's geometry needs redoing, and
  `fomc-2027-03-17` plus `fomc-blackout-start-2027-03-06` both need redating by whichever lane owns them.
- **A federal funding lapse runs through the ~03-01 → 03-23 field window** — the Dec-2025 edition is the
  precedent (an explicit upward revision once the Oct 1 – Nov 12 2025 shutdown ended), and the
  collection-period split becomes the thing to read.
- **A macro- or sentiment-keyed playbook lands in `docs/plans/trade-playbooks.md`** — the "0 hits"
  premise under every stand-aside call here stops being true, and the calls need re-derivation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-205 | Initial research banked (above); **canonical `src/domain/market-events/consumer-confidence-2027-03-30.json` written this PR** after reading the one prior proposal (`from-consumer-confidence-2027-02-23`), now inert. **Last-Tuesday rule HOLDS for March, 3 of 3, ALL double-sourced** — `CCI-Mar-2023` (`Updated : 2023-03-28`) + `CCI-Feb-2023`'s "next release is Tuesday, March 28"; `CCI-Mar-2024` (2024-03-26) + `CCI-Feb-2024`'s "March 26th"; `CCI-Mar-2025` (2025-03-25) + `CCI-Feb-2025`'s "March 25th". 2027-03-30 is the last Tuesday of March 2027. **REPLICATION PASSES:** pipeline reproduces the 02-23 sibling's clean-day medians exactly on the same 51/17 split of 68 rule-derived days (SPY 0.910, QQQ 1.379, XLY 1.399, XRT 1.678, AMZN 2.154, AAPL 1.731, XLF 1.119, TLT 0.961, VIX 18.560; **0 of 9**, smallest p 0.2654); p-values differ in the third decimal on a tape pulled a day later, reported not smoothed. **CB days EXCLUDING March: 0 of 9** (n=62) — March was never carrying the null. **THE FINDING — the month-level control the sibling prescribed FAILS in March.** March is the **widest month in the sample: 9 of 9** vs the rest of the year (SPY **1.291/0.936**, QQQ 1.755/1.321, XLY 1.817/1.388, XRT 2.331/1.784, AAPL 2.126/1.831, XLF 1.567/1.208, VIX close **21.840/17.750** all p<0.0001; AMZN 0.0254, TLT 0.0090) — more than double February's 4 of 9. Against other March sessions the six March CB days read **3 of 9 NARROW** (SPY **0.662/1.304 p=0.0301**, QQQ 1.093/1.763 (0.0364), AMZN 1.604/2.454 (**0.0215**)). **It is position-in-month:** March's width is FRONT-LOADED — last-5 March sessions vs earlier March, **6 of 9** (SPY **1.019/1.353 p=0.0040**, QQQ 0.0029, AMZN **0.0013**, AAPL 0.0029, VIX **19.505/22.965 p=0.0012**, XLY 0.0420); per-year early/late SPY medians 1.207/0.999 · 1.781/1.063 · 1.629/0.730 · 0.929/0.350 · 1.717/1.589 · 1.269/1.538. The last-Tuesday rule puts this release in the final week **by construction**. **Against other LATE-March sessions: 0 of 9** (SPY 0.662/1.039, p=0.2650, n=6 vs 24); 1/6 above the late-March p75 vs 25% chance. **So a fixed-position monthly release must be controlled against the same WEEK, not the month** — this upgrades the 02-23 sibling's rule rather than contradicting it. **QUARTER-END IS EMPTY AND RUNS THE WRONG WAY:** last-3-of-quarter sessions (n=72) are **quieter** — 3 of 9, all narrower (XRT 1.564/1.842 **0.0055**, AMZN 1.979/2.280 0.0160, XLF 1.026/1.236 0.0306); March CB days vs other quarter-end sessions **0 of 9** (SPY 0.662/0.848, p=0.5030). Positions from quarter end: 1/2/3/2/4/0. **D+1 vs late-March: 0 of 9.** Per-day SPY ranges 0.616/1.063/0.707/0.610/0.473/**2.122** — 2026-03-31 is a 4.5x outlier at VIX 25.25 on the quarter's last session, stated not explained. **TWO PROPOSAL CORRECTIONS.** (1) "First edition whose panel opens after the March SEP meeting" is **inverted** — sourced cut-off lags 8/8/6 (2023-03-20, 2024-03-18, 2025-03-19) put a 2027 panel at ~03-01→03-23, opening two weeks BEFORE the 03-17 decision; the true claim is that all three sourced Marches CLOSED before their decision (03-20 vs 03-22; 03-18 vs 03-20; 03-19 on decision day) while 2027's ~03-22/24 cut-off falls **5-7 days after** it — the Fed's March meeting drifted from week 3-4 (6-day gap: 2023/24/25) to week 2-3 (13-day gap: 2021/22/26/27). (2) The **Good Friday flag has ZERO precedent** — Easter 2027 is 03-28 (computed), and across 2021-2026 only 2024's Good Friday (03-29) fell in March, three days AFTER that print; n=0 means unpriceable, not small. **Revision rule extends to a third month:** March restates February **3 of 3** — 102.9→103.4 (+0.5) · 106.7→**104.8** (−1.9, stated) · 98.3→100.1 (+1.8, derived); Present Situation 152.8→153.0, 147.2→147.6, 136.5→138.1. Sharpest: Feb-2024 **Expectations 79.8→76.3, a 3.5-pt move ACROSS the Board's own 80.0 threshold**. **March levels:** 2023 104.2/151.1/73.0 · 2024 104.7/151.0/73.8 · 2025 92.9/134.5/**65.2** (12-year low) — Expectations below 80 in all three. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new this session. **Volatility regime:** VIX **14.53**, SPY **770.19** (2026-09-04 closes) — baseline set. **Geopolitical:** unchanged from siblings. **Event tape:** no March consensus exists or is publishable (CB publication restrictions); current edition is August 2026 (89.4/121.2/68.2, survey Aug 3-16, cut-off Aug 16), next release named 2026-09-29. **Sourcing failures:** `CCI-Mar-2021`, `CCI-Mar-2022`, `CCI-Mar-2026` each returned **HTTP 200 serving the current August 2026 edition** (332,019 bytes) — same substitution class the 02-23 sibling logged; three of six March CB dates are therefore rule-derived. **New dated adjacency → ONE proposal filed:** `proposals/consumer-confidence-2027-04-27.from-consumer-confidence-2027-03-30.json` — the next edition, sourced three-for-three for April from this session's own March fetches, and the COLLISION counterpart to this clean print (2027-04-27 is FOMC day one) plus the replication site for the week-level control on a different month. **Corridor (9 tracked events within 5 days):** SIFMA bond early close **03-25** · **Good Friday closure 03-26** · Tokyo CPI flash **03-26** · BoJ summary + FTC-v-Amazon + SIFMA Japan/UK **03-29** · **this print 03-30** · S&P select-sector secondary reweight **03-31** · Japan food tax cut **04-01**. Seven forward tests registered: **FT-consumer-confidence-2027-03-30-1/-2/-3/-4/-5/-6/-7**. | — (stance set) | 2026-09-27 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-consumer-confidence-2027-03-30.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
