# Conference Board Consumer Confidence (December 2027) — consumer-confidence-2027-12-22

**Kind:** macro-print · **Date:** 2027-12-22 (estimate, EST: not the publisher's last-Tuesday rule, which December refutes 0 of 5, but the one date formulation that fits the five sourced December releases 5 of 5 — *the latest Monday, Tuesday or Wednesday strictly before December 24* — which returns Wednesday 2027-12-22 independently of the 2021 Saturday-Christmas analogue that created this id) · **Impact:** medium
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["christmas-market-closure-2027-12-24","opex-2027-12-17"],"screenStreak":0,"blocked":[{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Dec-2021","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-08"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Dec-2025","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-08"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Nov-2025","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** **December's first print is the least trustworthy number this chain has ever measured, and that is
the finding.** January restates December **+0.7 / −2.7 / +4.8** — a **|Δ| spread of 4.1** against November's
**0.2**, containing the **single largest revision** the chain has sourced. So **November's headline is wrong by
about 1.1 points in an unknown direction; December's is wrong by anywhere from half a point to five, and the
sign is not guessable either.** They are neighbours and they are opposites, which is the strongest evidence yet
that **revision behaviour is a property of the month.** **The date, which the proposal called the weakest in the
chain, is upgraded.** Four candidate rules were tested against the five sourced December releases; exactly one
fits — *latest Mon/Tue/Wed strictly before December 24*, **5 of 5**, against **2 of 5** for both competitors and
**0 of 5** for the publisher's own last-Tuesday rule — and it returns **Wednesday 2027-12-22**, the same day the
2021 Saturday-Christmas twin returns by two other offsets. **It has an out-of-sample test in fifteen weeks:** it
predicts **2026-12-23**, one day off this calendar's own `consumer-confidence-2026-12-22` id. **The corridor
finding is real about its mechanism and marginal about its size.** Post-print Christmas-week sessions read
**8 of 9** narrower and — unlike November's post-Thanksgiving result — this is **not** a half-session artifact
(**8 of 9 survives** removing them, six clearing Bonferroni). But a **block-permutation test returns p=0.0575**,
because **the per-session Mann-Whitney this whole chain uses overstates any channel built from contiguous
blocks.** **And the chain's open VIX discrepancy is closed:** CBOE's `VIX_History.csv` carries rows on **32 NYSE
holidays**, so session-aligning it or not is what separated the 10-26 and 11-30 lanes' figures. Date
**estimate**; `symbols: []`; **0** macro-keyed playbooks.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-470) | **Stand aside** | High | `symbols: []`, D-470, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits**. Nothing dated exists to act on. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2027-12-22** — none exists today |
| This week | **Stand aside — the series' live question is the 09-29 print** | High | The current edition is **August 2026**; the 332,031-byte landing page names **2026-09-29** as the next release. Market state **2026-09-04** closes: VIX **14.53**, SPY **770.19**. | The Conference Board naming a December 2027 date outside **2027-12-20 → 2027-12-23** before **2027-12-01**, which breaks the rule this doc's date rests on |
| This month | **Do not read December's headline as a number — read it as a draft** | Medium | January restates December **+0.7 / −2.7 / +4.8**; the **+4.8** (104.7 → 109.5, stated verbatim in `CCI-Jan-2025`) is the largest revision in the chain. **\|Δ\| spread 4.1 vs November's 0.2.** | The January 2028 edition restating December 2027's headline by an absolute **less than 0.7**, observable on **2028-01-25** (est.) |
| This quarter | **Stop trusting per-session p-values on any block-shaped channel in this chain** | High | The Christmas corridor is **8 of 9** (6 clearing Bonferroni) after half sessions are removed, but **2,000 block permutations of the same 6/6/6/4/4 block lengths reproduce that 5.75% of the time**. | A block-permutation re-run after **2027-12-31** returning **p<0.01** for the corridor's hit count — which would mean the inflation diagnosed here is smaller than measured |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks, and the
  release-day tape for the five actual December CB days is **0 of 9** against every control built here.
- **The date rule is testable before it is needed** — it predicts **2026-12-23** for December 2026, not 12-22.
  Registered as **FT-consumer-confidence-2027-12-22-1**.
- **The November 2027 edition names December's date** → adopt it verbatim, and **read the DATE, never the
  weekday** (1 of 7 forward lines the 11-30 lane read was mislabelled). Registered as
  **FT-consumer-confidence-2027-12-22-2**.
- **Expect December's headline restated by 0.7 to 4.8 points, direction unknown** — the widest band in the
  chain. Registered as **FT-consumer-confidence-2027-12-22-3**.
- **Project December's cut-off from the LAG (6–7 days), not the day of month** — the inverse of November's
  anchor. **2027-12-15 → 2027-12-16.** Registered as **FT-consumer-confidence-2027-12-22-4**.
- **The 2027-12-08 FOMC decision + SEP falls INSIDE this panel's field window** — this is the first sentiment
  read to close after a fresh dot plot. Registered as **FT-consumer-confidence-2027-12-22-5**.
- **The Christmas corridor is not a half-session artifact, but it is not established either** — 8 of 9 both
  ways, block-permutation **p=0.0575**. Registered as **FT-consumer-confidence-2027-12-22-6**.
- **Never build a CB day-set from the last Tuesday of December** — the rule days are **4 of 9** narrower
  because they sit *inside* the corridor; the actual print days are **0 of 9**. Registered as
  **FT-consumer-confidence-2027-12-22-7**.
- **Session-align `VIX_History.csv` before taking a median** — it carries **32 holiday rows** in this window.
  Registered as **FT-consumer-confidence-2027-12-22-8**.
- **Ninth month, ninth directional refusal** — December CB days are 4 of 5 up at **p=0.1729**. Registered as
  **FT-consumer-confidence-2027-12-22-9**.
- **There is no Christmas Eve half session in 2027** — Christmas Day is a Saturday, so 2027-12-24 is a full
  closure. Proposed this PR as `christmas-market-closure-2027-12-24`.
- **Expectations back above 80 and staying there** → the Board's own recession threshold clears; the
  late-cycle framing this whole series carries dies.
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication restrictions —
  structural, established by the 09-29 sibling, not re-spent here.
- **Watch (dated):** CB print **2026-09-29** · CB print **2026-12-22** (est., the scoring venue for FT-1) ·
  CB print **2027-10-26** (est.) · CB print **2027-11-30** (est., the venue that names this date) · **FOMC
  decision + SEP 2027-12-08** (est.) · **opex 2027-12-17** (est., proposed this PR) · **this print
  2027-12-22** (est.) · **market closed 2027-12-24** (est., proposed this PR) · FHFA HPI **2027-12-28**
  (est.) · CB print **2028-01-25** (est., the scoring venue for FT-3).

## Initial research

### The question, plainly

The [November sibling](consumer-confidence-2027-11-30.md) filed this id and, unusually, spent its `notes`
arguing against its own confidence. Three cautions: **this id's date is the weakest in the chain and the file
name says so** (a single-instance structural analogue off 2021, the only other Saturday-Christmas year);
**the promotion trigger is unusually early and cheap** (November names December's date 3 of 3, ~4 weeks
ahead) but **read the date, never the weekday**; and **do not inherit November's cut-off arithmetic**, because
December's lags are the shortest and tightest in the chain.

Separately, two lanes in this calendar hold **contradictory readings of the same field**. The
[`consumer-confidence-2026-12-22`](consumer-confidence-2026-12-22.md) lane calls December's field cut-off
*"a fixed calendar date, not the floating lag"*; the 11-30 proposal calls it *"lags of 6, 6 and 7 — the
SHORTEST and tightest in the chain."* Both cannot be the better projection anchor.

So: **is 12-22 the right date, is the cut-off a date or a lag, and does December have a finding of its own —
or is it only the month where the rule breaks?**

**One-line verdict:** the date is **upgraded, not confirmed** — a four-rule bake-off found one formulation
that fits December **5 of 5** and returns 2027-12-22 independently of the 2021 analogue; the cut-off
disagreement is **settled for the lag**, inverting November's anchor; and December's own finding is that
**its first print is the least trustworthy number in the chain** — January restates it by **+0.7 / −2.7 /
+4.8**, the widest spread and the largest single revision the chain has ever sourced. Alongside those: the
post-print Christmas corridor is **not** the half-session artifact November's was, but a **block-permutation
test cuts it from six-instruments-at-Bonferroni to p=0.0575**, which is a method finding that applies to
every channel in this chain; and the **VIX discrepancy the 11-30 lane banked as unexplained is closed.**

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target.

**Publisher sources fetched direct 2026-09-06 → 2026-09-08, all requests serial**, each verified against its
own `Source: <Month> <Year> Consumer Confidence Survey` line **and** its own `Updated:` stamp rather than
trusted by slug: `conference-board.org/topics/consumer-confidence` (**332,031 bytes** — byte-identical to
the June through November siblings' fetches), `CCI-Dec-2022` (**889,114**), `CCI-Dec-2023` (**1,264,748**),
`CCI-Dec-2024` (**898,445**), `CCI-Jan-2023` (**880,155**), `CCI-Jan-2024` (**852,996**), `CCI-Jan-2025`
(**910,154**). The three December byte counts match the 11-30 sibling's fetches of the same documents
exactly; **`CCI-Jan-2024` and `CCI-Jan-2025` are new to this chain** and are what close the revision leg.

**Three fetches failed and are recorded rather than substituted.** `CCI-Dec-2021`, `CCI-Dec-2025` and
`CCI-Nov-2025` each returned HTTP 200 carrying the **332,031-byte current-edition landing page** instead of
the requested edition — the same artifact the [`consumer-confidence-2026-12-22`](consumer-confidence-2026-12-22.md)
lane recorded for two of them in 2026-09. All three are in `probe-ref.blocked`. **The 2021 and 2025 release
dates and cut-offs used below are therefore inherited from that lane, not re-verified here**, and every leg
that depends on them says so.

**The Fed dates are primary:** `federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200,
**164,831 bytes** — matching the seven ledgers that record that figure. The 2027 panel reads *"January 26-27
· March 16-17\* · April 27-28 · June 8-9\* · July 27-28 · September 14-15\* · October 26-27 · December 7-8\*"*,
with the footnote *"A two-day meeting is scheduled for January 25-26, 2028."*

**The tape.** Equity and ETF daily OHLC from **stockanalysis.com** and VIX from **CBOE's own
`VIX_History.csv`** (**472,360 bytes** — 51 bytes larger than the April–November siblings' 472,309, being the
one row added since: `09/07/2026`, which is itself leg 8's evidence). SPY, QQQ, XLY, XRT, AMZN, AAPL, XLF,
TLT and VIX for **2020-12-01 → 2026-09-04** (n=**1,447** sessions — the siblings' count exactly), session
range `(high − low) / open`, two-sided Mann-Whitney U with tie correction, VIX measured on close. Market
readings: **2026-09-04 closes, SPY 770.19 and VIX 14.53.** **New instrument this session:** a
**block-permutation test** — the observed channel's contiguous blocks, at their observed lengths, re-placed
at 2,000 random non-overlapping positions in the tape, counting how often the random placement matches or
beats the observed hit count.

### Conviction legs, tested

1. **The date is UPGRADED — one rule fits December 5 of 5, and it returns 2027-12-22.** The proposal derived
   the date from 2021 alone and said so. This session ran a bake-off instead, scoring four candidate
   formulations against all five sourced December releases:

   | Rule | Fit | 2026 | 2027 |
   |---|---|---|---|
   | **latest Mon/Tue/Wed strictly before December 24** | **5 of 5** | 2026-12-23 | **2027-12-22 (Wed)** |
   | latest Mon–Thu strictly before December 24 | 2 of 5 | 2026-12-23 | 2027-12-23 |
   | latest weekday on or before December 23 | 2 of 5 | 2026-12-23 | 2027-12-23 |
   | the publisher's own *last Tuesday of the month* | **0 of 5** | 2026-12-29 | 2027-12-28 |

   The observations it explains: **2021-12-22 Wed · 2022-12-21 Wed · 2023-12-20 Wed · 2024-12-23 Mon ·
   2025-12-23 Tue.** The two near-miss competitors fail on exactly the three Wednesday years, where the
   Thursday immediately before December 24 was available and was not used. **SUPPORTED, with the honest
   caveat that the rule is fitted in-sample on the same five points it explains** — five observations, one
   surviving formulation. What makes it more than a curve fit is that **it agrees with an independent
   derivation**: 2021 is the only other Saturday-Christmas year, and its two offsets (rule date − 6 days;
   Christmas − 3 days) both return 2027-12-22 as well. **And it is falsifiable in fifteen weeks** — it
   predicts **2026-12-23** for December 2026, one day off this calendar's own `consumer-confidence-2026-12-22`
   id, which that lane already flagged as "±1 day" with a best fit of 12-23. Registered as
   **FT-consumer-confidence-2027-12-22-1**.

2. **The forward-announcement mechanism HOLDS, and this session adds the return leg the 11-30 lane could not
   reach.** That lane established that the November edition names December's date 3 of 3. Reading the
   *December* editions' own next-release lines closes the loop in the other direction:

   | Edition | Stamp | Next-release line | Lands on | Last Tuesday? |
   |---|---|---|---|---|
   | December 2022 | `Updated : 2022-12-21` | *"The next release is **Wednesday, January 31** at 10 AM ET"* | `CCI-Jan-2023`, `Updated : 2023-01-31` | **yes** (Jan 31 2023) — but the weekday label is wrong; it was a Tuesday |
   | December 2023 | `Updated : 2023-12-20` | *"**Tuesday, January 30th**"* | `CCI-Jan-2024`, `Updated : 2024-01-30` | **yes** |
   | December 2024 | `Updated : 2024-12-23` | *"**Tuesday, January 28th**"* | `CCI-Jan-2025`, `Updated : 2025-01-28` | **yes** |

   **The December break does not propagate.** January returns to the last-Tuesday rule **3 of 3** — 2023-01-31,
   2024-01-30 and 2025-01-28 are each their January's last Tuesday. So December is a **one-month exception**,
   not the start of a drift, which is what makes the whole rest of this chain's rule-derived cadence safe.
   The 11-30 lane's weekday-label caution is **independently reproduced** here (1 error in these 3 lines, the
   same one). Registered as **FT-consumer-confidence-2027-12-22-2**.

3. **THE HEADLINE — December's first print is the least trustworthy in the chain, by a distance.** Reading
   each January edition's restatement of the December it follows:

   | December edition | First print | January's restatement | Δ | Source line |
   |---|---|---|---|---|
   | Dec 2022 | 108.3 | **109.0** | **+0.7** | `CCI-Jan-2023`: *"down from 109.0 in December (an upward revision)"* |
   | Dec 2023 | 110.7 | **108.0** | **−2.7** | `CCI-Jan-2024`: *"up from a revised 108.0 in December"* |
   | Dec 2024 | 104.7 | **109.5** | **+4.8** | `CCI-Jan-2025`: *"December's reading was revised up by 4.8 points to 109.5"* |

   **|Δ| = 0.7 / 2.7 / 4.8 — a spread of 4.1**, against 0.2 for November, 1.1 for October, 2.2 for September,
   2.6 for August and 3.2 for November-restates-October. **The +4.8 is the single largest revision this chain
   has ever sourced**, and it is stated in points by the publisher rather than derived. Mean **+0.93**, 2 of 3
   up — the sign is no more guessable than November's. The six-month sequence now reads **−0.60 / +1.77 /
   +0.53 / −0.97 / +0.43 / +0.93.**

   **The reading rule:** November's headline is wrong by *about 1.1 points* in an unknown direction; December's
   is wrong by *somewhere between half a point and five*, also in an unknown direction. Two adjacent months,
   opposite behaviours — which is the strongest support yet for the 09-28 / 10-26 / 11-30 lanes' shared claim
   that **revision behaviour is a property of the month**, and the sharpest warning yet against borrowing a
   neighbour's numbers. Registered as **FT-consumer-confidence-2027-12-22-3**.

   **The 80-threshold band gains three more out-of-sample pairs, and its actionable half is now 0 of 12.**
   December Expectations first prints and their restatements: 2022 **82.4 → 83.4** (distance 2.4, outside
   ±2.0, no flip), 2023 **85.6 → 81.9** (5.6, outside, no flip), 2024 **81.1 → 86.5** (1.1, **inside**, no
   flip — and it moved **+5.4**, the largest Expectations revision in the record, without crossing). Pooled:
   **outside ±2.0 = 0 of 12** (was 0 of 10); **inside = 3 of 7** (was 3 of 6). That fragment is the 09-28
   lane's to score and is untouched here.

4. **The cut-off disagreement is SETTLED, and it goes to the lag — the inverse of November.** Two lanes held
   incompatible readings. Pooling the three cut-offs re-read from the editions this session with the two
   inherited from the 2026-12-22 lane:

   | Edition | Stated cut-off | Release | Lag | Source |
   |---|---|---|---|---|
   | Dec 2021 | December 16 | 2021-12-22 | 6 | inherited (`CCI-Dec-2021` blocked this session) |
   | Dec 2022 | **December 15** | 2022-12-21 | 6 | re-read: *"cutoff date for the preliminary results was December 15"* |
   | Dec 2023 | **December 14** | 2023-12-20 | 6 | re-read: *"…was December 14"* |
   | Dec 2024 | **December 16, 2024** | 2024-12-23 | 7 | re-read: *"…was December 16, 2024"* |
   | Dec 2025 | December 16 | 2025-12-23 | 7 | inherited (`CCI-Dec-2025` blocked this session) |

   **Lag spans 6–7 (span 1); day of month spans 14–16 (span 2).** So the 2026-12-22 lane's *"a fixed calendar
   date, not the floating lag"* is **REFUTED** on the pooled five — it was true of the three editions that lane
   happened to reach (2021, 2024, 2025, all December 16) and false once 2022 and 2023 are added. The 11-30
   proposal's caution is **SUPPORTED**. **Project December from the lag: a 2027-12-22 release implies a cut-off
   of 2027-12-15 → 2027-12-16.** November is the opposite (day-of-month spread 3 vs lag spread 5), October the
   opposite again — **the anchor is month-specific in both directions, and a neighbour's method travels no
   better than its numbers.** Registered as **FT-consumer-confidence-2027-12-22-4**.

5. **The 2027-12-08 FOMC decision + SEP falls INSIDE this panel's field window — a first for the chain.**
   With a cut-off of 12-15/12-16 and a panel opening around December 1, the field window contains the
   **December 7-8 2027 meeting**, which the Fed's own calendar marks with an SEP. The 11-30 lane recorded that
   **2027-12-07 is the earliest SEP day-one anywhere in the 2021–2027 panel**; the consequence for *this*
   print is that it is **the first Conference Board panel to close after a fresh dot plot** rather than before
   one. It is also comfortably **outside** the blackout (2027-11-27 → 2027-12-09, on the Board's ten-days-earlier
   rule), and the next blackout does not open until mid-January 2028. Contrast the neighbours: December 2024's
   FOMC was 12-17/18, *after* that year's 12-16 cut-off. **The configuration is a property of 2027, not of
   December** — SUPPORTED as a fact, and explicitly **not** generalised. Registered as
   **FT-consumer-confidence-2027-12-22-5**.

6. **The Christmas corridor is NOT a half-session artifact — and this is where November's test flips sign.**
   The 11-30 lane's post-Thanksgiving finding collapsed from 4 of 9 to 1 of 9 once the five Black Fridays came
   out. Running the identical test on the 28 sessions between each December print and that year's end:

   | Set | Hits at p<0.05 | Clearing Bonferroni 0.00556 |
   |---|---|---|
   | corridor, all 28 sessions | **8 of 9** (TLT only miss) | 6 |
   | corridor, **excluding** its 2 half sessions (n=26) | **8 of 9** | **6** — AMZN 0.0000, XLF 0.0000, AAPL 0.0004, XLY 0.0014, XRT 0.0021, QQQ 0.0050 |
   | the 2 corridor half sessions alone | 1 of 9 | 0 |

   The mechanism check that killed November's finding **exonerates** this one: SPY 0.780 vs 0.973 (p=0.0302),
   QQQ 0.969 vs 1.374, AMZN 1.590 vs 2.266, XLF 0.903 vs 1.235, VIX 17.085 vs 18.140 (p=0.0086) — all with the
   half sessions removed. **Half sessions are real and violent when isolated** (all 11 in the window are 8 of 9
   against the tape, SPY 0.465 vs 0.973 at p=0.0003), but they are not what makes the Christmas corridor
   narrow.

7. **…and then the block-permutation test cuts it back to marginal. THIS IS THE METHOD FINDING.** Those 26
   sessions are not 26 independent observations — they are **five contiguous blocks** of lengths 6/6/6/4/4,
   and volatility inside a holiday week is strongly autocorrelated. Re-placing five blocks of exactly those
   lengths at 2,000 random non-overlapping positions in the same tape:

   - **P(≥ 8 of 9 at p<0.05) = 0.0575**
   - **P(≥ 6 of 9 at Bonferroni 0.00556) = 0.0490**

   So the honest reading is **p ≈ 0.05, not six instruments at 0.0000.** The per-year sign test agrees and is
   underpowered: the corridor is narrower than its own year's tape in **4 of 5 years** (2021 0.636/0.853, 2022
   1.357/1.715, 2023 0.661/0.968, 2025 0.401/0.899; 2024 is *wider*, 1.114/0.796) — **two-sided sign test
   p=0.375.** **Corridor status: real in mechanism, marginal in size, not established.**

   **The generalisation is the point.** Every channel in this chain built from contiguous windows — the
   blackout channel, the post-Thanksgiving week, any corridor — carries the same inflation. **The chain's null
   results are unaffected** (an inflated test that still fails to reject is a stronger null, not a weaker one),
   and so is the 11-30 lane's verdict, which was reached by removing half sessions rather than by trusting a
   p-value. What changes is that **a future positive from a block-shaped channel must clear a block
   permutation before it is written up as a signal.** Registered as **FT-consumer-confidence-2027-12-22-6**.

8. **Never build a December CB day-set from the last Tuesday — the wrong days manufacture a signal.** The
   2026-12-22 lane caught this and this session quantifies the cost:

   | Day set | vs rest of tape |
   |---|---|
   | the 5 **actual** December releases (12-22, 12-21, 12-20, 12-23, 12-23) | **0 of 9** (smallest XRT 0.0888) |
   | the 5 **rule-derived** last Tuesdays (12-28, 12-27, 12-26, 12-31, 12-30) | **4 of 9** — XLF **0.0054**, XRT 0.0325, XLY 0.0435, AAPL 0.0493 |

   **And the reason is leg 6.** All five rule days sit *inside* the Christmas corridor; all five actual print
   days sit *just before it opens*. The apparent "December CB effect" a rule-derived set produces is the
   corridor, borrowed. The full corrected CB set is **0 of 9** against the tape (smallest XRT 0.3108), and the
   68 rule-derived days are also **0 of 9** (smallest SPY 0.2015) — both replicating the siblings. The five
   December print days against **other CB days** are **0 of 9** (smallest XRT 0.1586). Registered as
   **FT-consumer-confidence-2027-12-22-7**.

9. **The chain's open VIX discrepancy is CLOSED, and neither lane had a bug.** The 11-30 lane banked three
   unexplained second-decimal gaps against the 10-26 lane (Jun 16.70 vs 16.73, Sep 17.20 vs 17.17, Nov 17.25
   vs 17.21) and guessed *"likely a session-alignment difference in which VIX rows enter a month."* That guess
   is **exactly right, and this session names the mechanism and reproduces both sides.**
   **`VIX_History.csv` carries rows on 32 dates in this window that are not NYSE sessions** — 2022-05-30,
   2022-06-20, 2022-07-04, 2022-09-05, 2022-11-24, 2023-01-16, 2023-02-20, 2023-05-29, 2023-06-19, 2023-07-04,
   2023-09-04, 2023-11-23, 2024-01-15, 2024-02-19, 2024-05-27, 2024-06-19, 2024-07-04, 2024-09-02, 2024-11-28,
   2025-01-09, 2025-01-20, 2025-02-17, 2025-05-26, 2025-06-19, 2025-07-04, 2025-09-01, 2025-11-27, 2026-01-19,
   2026-02-16, 2026-05-25, 2026-06-19, 2026-07-03 — every federal-holiday closure plus **2025-01-09**, the
   national day of mourning for President Carter. Computed both ways:

   | Month | Session-aligned (n) | Raw file (n) |
   |---|---|---|
   | January | **18.14** (120) | 18.07 (125) |
   | May | **18.12** (126) | 18.09 (131) |
   | June | **16.70** (124) | 16.73 (129) |
   | September | **17.20** (107) | 17.17 (111) |
   | November | **17.25** (102) | 17.21 (106) |

   The session-aligned column **is the 11-30 lane's figures**; the raw column **is the 10-26 lane's**. The other
   seven months are identical either way. **Five months differ, not three** — January and May were never
   compared. **The session-aligned reading is the correct one** for any channel whose comparison set is equity
   sessions. **A live instance sits in today's file:** the row added since the siblings' fetch is `09/07/2026`,
   Labor Day, a day the NYSE was closed — which is why this session's download is 472,360 bytes against their
   472,309. Registered as **FT-consumer-confidence-2027-12-22-8**.

10. **Directional: ninth month, ninth refusal.** December CB days are **4 of 5 up** — 2021-12-22 +1.000%,
    2022-12-21 +1.495%, 2023-12-20 −1.386%, 2024-12-23 +0.599%, 2025-12-23 +0.457% — with an SPY
    close-to-close median of **+0.599%** against **−0.010%** on other late-December sessions (≥ the 15th),
    **p=0.1729** at n=5 vs 63. Directionally the friendliest month the scan has produced and still nowhere
    near the bar. The twelve-month scan now reads Apr **0.0150**, Sep 0.3796, Oct 0.1643, Nov 0.5957, Dec
    **0.1729**. Registered as **FT-consumer-confidence-2027-12-22-9**.

11. **2027 has no Christmas Eve half session at all, and the tape proves the pattern both ways.** Christmas
    Day 2027 is a **Saturday**, so the NYSE observes it on **Friday 2027-12-24** — a full closure, not a 1:00
    p.m. close. Verified from the session series rather than asserted: **2021, the structural twin, jumps
    straight from 2021-12-23 to 2021-12-27.** Christmas Eve half sessions exist in the window only on
    2020-12-24, 2024-12-24 and 2025-12-24 (December 24 a Thursday, Tuesday and Wednesday) and are absent in
    2021, 2022 and 2023. Corridors in half-session years are, if anything, **narrower** than in years without
    one (3 of 9: XRT 0.0103, AAPL 0.0329, TLT 0.0329, n=10 vs 18) — which points the wrong way for 2027, but at
    3 years against 3 it is a year effect as much as a session effect and is declined as evidence. Proposed
    this PR as `christmas-market-closure-2027-12-24`.

### What the conditions support

**Nothing to trade, and the reason is structural rather than seasonal.** `symbols: []`, no house playbook is
macro- or sentiment-keyed (a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0 hits**),
the print is **D-470**, and its date is an **estimate**. Every horizon is a stand-aside.

**What the research supports is reading, and three reading rules come out of it.** First: **treat a December
headline as a draft.** It is restated by 0.7 to 4.8 points, and any narrative built on the first print in the
week it lands is built on the chain's least stable number. Second: **project the cut-off from the lag**, which
puts the 2027 field window's close at 12-15/12-16 and therefore **after** the December 7-8 SEP — the panel is
the first read of a consumer who has already seen a fresh dot plot. Third, and the one that travels furthest:
**a block-shaped channel needs a block-shaped test.** The Christmas corridor is the first channel in this chain
to survive the half-session check and then fail the independence check, and that ordering is the useful
artifact.

### Honest limits

- **Three of the five December editions were not re-fetched.** `CCI-Dec-2021`, `CCI-Dec-2025` and `CCI-Nov-2025`
  all served the current-edition landing page; 2021's and 2025's dates and cut-offs are **inherited** from the
  2026-12-22 lane. Legs 1 and 4 each rest on two inherited data points out of five. `probe-ref.blocked` records
  all three.
- **The winning date rule is fitted in-sample.** Five observations, four candidate formulations, one survivor —
  that is a bake-off, not a validation. Its only real test is out of sample, and FT-1 registers it.
- **The corridor is marginal and is reported as marginal.** p=0.0575 on the block permutation and 4-of-5 on the
  per-year sign test (p=0.375) are not a signal. The write-up leads with the number that survives scrutiny, not
  the one that reads best.
- **n=5 everywhere in the December-specific work.** Every December leg has five instances or fewer; the tape
  legs are the weakest for exactly that reason and none of them is load-bearing on a call.
- **The block permutation uses a linear-congruential RNG seeded at 20260908** and 2,000 trials, so its own
  p-values carry roughly ±0.005 of Monte-Carlo error. A re-run will not return 0.0575 to the fourth decimal.
- **No consensus exists and none will.** Conference Board publication restrictions — structural, established by
  the 09-29 sibling, not re-spent here.
- **The FOMC configuration in leg 5 is a 2027 fact, not a December rule.** December meetings have landed both
  before and after the cut-off in the sourced record.

## Stance & kill switches

**Stance (date `estimate`; not primary-confirmed).** Treat the December 2027 Conference Board edition as a
**medium-impact second-tier print that is regime information and never a trading event**. **No position is
opened, closed or sized off it.**

**The finding this ledger exists for is that December's first print is the chain's least trustworthy number.**
January restates December **+0.7 / −2.7 / +4.8** — a **|Δ| spread of 4.1** and the **largest single revision**
the chain has sourced, against November's spread of **0.2**. Two adjacent months with opposite revision
behaviour is the strongest evidence yet that **revision behaviour is a property of the month**, and the
sharpest available warning against borrowing a neighbour's numbers. **Read a December headline as a draft.**

**The date is upgraded from the proposal's own assessment.** A four-rule bake-off found exactly one
formulation that fits the five sourced December releases — *the latest Mon/Tue/Wed strictly before December
24*, **5 of 5**, against **2 of 5** for the two near-miss competitors and **0 of 5** for the publisher's own
last-Tuesday rule — and it returns **Wednesday 2027-12-22**, agreeing with the 2021 Saturday-Christmas
analogue's two offsets. It remains an **estimate** and the honest residual is still the band **2027-12-20 →
2027-12-23**, because the rule is fitted in-sample; but it is now a rule with a **scoreable out-of-sample test
fifteen weeks out** (it predicts **2026-12-23**, one day off this calendar's own `consumer-confidence-2026-12-22`
id) rather than a single-instance guess. **December's break also does not propagate** — January returns to the
last-Tuesday rule **3 of 3**.

**A live disagreement between two lanes is settled, against the more recent one.** The 2026-12-22 lane's
*"fixed calendar date, not the floating lag"* is **REFUTED** on the pooled five cut-offs (December 16 / 15 / 14
/ 16 / 16): the **lag** spans 6–7 and the **day of month** spans 14–16, so December projects from the lag —
**2027-12-15 → 2027-12-16** — the exact inverse of November's anchor and of October's. That cut-off puts the
**2027-12-08 FOMC decision and SEP inside the field window**, making this the chain's first sentiment panel to
close after a fresh dot plot.

**And the chain gets a method correction it will need more than it needs this event.** The post-print Christmas
corridor is **8 of 9** narrower than the tape and — unlike the 11-30 lane's post-Thanksgiving result — it
**survives removing its half sessions at 8 of 9, six clearing Bonferroni**. Then a **block permutation** of the
same five contiguous blocks returns **p=0.0575**, and the per-year sign test returns **4 of 5, p=0.375**. So the
corridor is **real in mechanism and marginal in size**, and the general rule is that **the per-session
Mann-Whitney this chain runs everywhere overstates any channel built from contiguous blocks.** The chain's
existing nulls are unharmed by this — an inflated test that still fails to reject is a stronger null — but a
future *positive* from a block-shaped channel must clear a block permutation first. Two supporting results fall
out: **a December CB day-set built from the last Tuesday reads 4 of 9 while the actual print days read 0 of 9**,
because the rule days sit inside the corridor and the print days sit just before it; and **the chain's open VIX
discrepancy is closed** — `VIX_History.csv` carries **32 NYSE-holiday rows**, five monthly medians differ by
alignment (not three), and both siblings' figures are reproduced exactly, with the session-aligned reading
correct.

Base case for the print itself (**Low** confidence — no consensus exists or will): the edition **restates
November 2027's headline** (the 11-30 lane's forward test, not this one's) and **its own headline should be
expected to move somewhere between 0.7 and 4.8 points in an unknown direction.** Nine predictions are registered
in [`forward-tests/consumer-confidence-2027-12-22.md`](../forward-tests/consumer-confidence-2027-12-22.md).

**Kill switches:**

- **The December 2026 edition publishes on any date other than 2026-12-23** — the 5-of-5 date rule fails its
  first out-of-sample test and this doc's date confidence collapses back to the proposal's band. Registered as
  **FT-consumer-confidence-2027-12-22-1**.
- **A January edition publishes on a date that is not its month's last Tuesday** — the "December's break does
  not propagate" finding fails, and every rule-derived date in this chain becomes suspect. Registered as
  **FT-consumer-confidence-2027-12-22-2**.
- **The January 2028 edition restates December 2027's headline by an absolute less than 0.7** — leg 3's
  wide-and-unbounded finding was a three-case coincidence, and December is not the chain's least trustworthy
  month after all. Registered as **FT-consumer-confidence-2027-12-22-3**.
- **The December 2027 edition states a cut-off before 2027-12-14 or after 2027-12-17** — leg 4's lag anchor is
  no better than the day-of-month anchor it displaced. Registered as **FT-consumer-confidence-2027-12-22-4**.
- **The Fed moves the December 2027 meeting later than 2027-12-15** — the decision falls outside the field
  window and leg 5's "first panel to close after a fresh dot plot" framing dies. Registered as
  **FT-consumer-confidence-2027-12-22-5**.
- **A block-permutation re-run after 2027-12-31 returns p<0.01 for the corridor** — the independence inflation
  diagnosed in leg 7 is smaller than measured and the corridor should have been written up as a signal.
  Registered as **FT-consumer-confidence-2027-12-22-6**.
- **The five actual December CB print days clear p<0.05 on 2 or more of 9 against the tape** on a re-run after
  2027-12-31 — leg 8's clean split between print days and rule days breaks. Registered as
  **FT-consumer-confidence-2027-12-22-7**.
- **A future `VIX_History.csv` download contains no rows on NYSE holidays** — CBOE changed the file and leg 9's
  explanation stops applying to new fetches (the historical rows would still explain the banked gap). Registered
  as **FT-consumer-confidence-2027-12-22-8**.
- **December's directional scan clears p<0.05 once 2026-12-22 is added** — the ninth refusal breaks at the first
  new instance, fifteen weeks out. Registered as **FT-consumer-confidence-2027-12-22-9**.
- **Expectations below ~54** — deterioration past the April-2025 reading the Board itself called the lowest since
  October 2011; escalate ahead of the banded pulse.
- **A federal funding lapse running through the ~2027-12-01 → 2027-12-16 field window** — the Dec-2025 edition is
  the precedent (an explicit upward revision once the Oct 1 – Nov 12 2025 shutdown ended).
- **A macro- or sentiment-keyed playbook lands in `docs/plans/trade-playbooks.md`** — the "0 hits" premise under
  every stand-aside call here stops being true, and the calls need re-derivation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-470 | Initial research banked (above); **canonical `src/domain/market-events/consumer-confidence-2027-12-22.json` written this PR** after reading the one prior proposal (`from-consumer-confidence-2027-11-30`), now inert. **HEADLINE — DECEMBER'S FIRST PRINT IS THE CHAIN'S LEAST TRUSTWORTHY NUMBER.** January restates December **+0.7 / −2.7 / +4.8** (108.3→**109.0**, 110.7→**108.0**, 104.7→**109.5**), read from `CCI-Jan-2023` *"down from 109.0 in December (an upward revision)"*, `CCI-Jan-2024` *"up from a revised 108.0"*, `CCI-Jan-2025` *"revised up by 4.8 points to 109.5"*. **\|Δ\| spread 4.1** vs November's **0.2**; **+4.8 is the largest revision the chain has sourced**. Mean +0.93, 2 of 3 up. Six-month sequence **−0.60 / +1.77 / +0.53 / −0.97 / +0.43 / +0.93**. Two adjacent months, opposite behaviour — strongest support yet for *revision behaviour is a property of the month*. **DATE UPGRADED, NOT CONFIRMED.** Four-rule bake-off vs the five sourced December releases: *latest Mon/Tue/Wed strictly before Dec 24* **5 of 5** → **2027-12-22 (Wed)**; *latest Mon–Thu before Dec 24* **2 of 5**; *latest weekday ≤ Dec 23* **2 of 5**; publisher's *last Tuesday* **0 of 5** (→2027-12-28). Competitors fail on the three Wednesday years. Agrees with the 2021 Saturday-Christmas analogue's two offsets. **Fitted in-sample; out-of-sample test predicts 2026-12-23**, one day off this calendar's `consumer-confidence-2026-12-22` id — **FT-1**, scoreable in ~15 weeks. **DECEMBER'S BREAK DOES NOT PROPAGATE:** January is last-Tuesday **3 of 3** (2023-01-31, 2024-01-30, 2025-01-28), each named by its December predecessor's next-release line; the 11-30 lane's weekday-label error independently reproduced (`CCI-Dec-2022` *"Wednesday, January 31"* — a Tuesday). **CUT-OFF DISAGREEMENT SETTLED FOR THE LAG.** Re-read this session: **December 15** (2022), **December 14** (2023), **December 16, 2024**; inherited from the 2026-12-22 lane: December 16 (2021, 2025). **Lag 6/6/6/7/7 spans 1; day of month 14–16 spans 2** → the 2026-12-22 lane's *"fixed calendar date, not the floating lag"* is **REFUTED** (true only of the three editions it reached), the 11-30 proposal's caution **SUPPORTED**. Projection **2027-12-15 → 2027-12-16**. **THAT PUTS THE 2027-12-08 FOMC + SEP INSIDE THE FIELD WINDOW** — first CB panel in the chain to close after a fresh dot plot; print is **outside** the 11-27→12-09 blackout, next blackout mid-Jan 2028; `fomccalendars.htm` **164,831 B**, 2027 panel *"December 7-8\*"*, footnote *"January 25-26, 2028"*. A 2027 fact, not a December rule (Dec 2024's meeting was 12-17/18, after that cut-off). **CORRIDOR: NOT A HALF-SESSION ARTIFACT — THE INVERSE OF NOVEMBER'S RESULT.** 28 sessions from each December print to year-end are **8 of 9** narrower; **excluding the 2 half sessions still 8 of 9, six clearing Bonferroni 0.00556** (AMZN 0.0000, XLF 0.0000, AAPL 0.0004, XLY 0.0014, XRT 0.0021, QQQ 0.0050; SPY 0.780/0.973 p=0.0302, VIX 17.085/18.140 p=0.0086). All 11 half sessions in the window are **8 of 9** alone (SPY 0.465/0.973 p=0.0003) — real, but not the cause here. **THEN THE BLOCK PERMUTATION CUTS IT TO MARGINAL, AND THAT IS THE METHOD FINDING.** The 26 sessions are **five contiguous blocks (6/6/6/4/4)**, not 26 independent draws. 2,000 random re-placements: **P(≥8 of 9)=0.0575**, **P(≥6 at Bonferroni)=0.0490**. Per-year sign test: narrower in **4 of 5** (2021 .636/.853, 2022 1.357/1.715, 2023 .661/.968, 2025 .401/.899; **2024 wider** 1.114/.796), **p=0.375**. **Corridor = real in mechanism, marginal in size, NOT established.** Generalises: **the per-session Mann-Whitney used across this chain overstates any block-shaped channel** — existing nulls unharmed (an inflated test that still fails to reject is a stronger null), but a future positive must clear a block permutation. **NEVER BUILD A DECEMBER CB SET FROM THE LAST TUESDAY.** Actual print days (12-22/12-21/12-20/12-23/12-23) **0 of 9** vs tape (smallest XRT .0888); **rule-derived last Tuesdays (12-28/12-27/12-26/12-31/12-30) 4 of 9** (XLF **.0054**, XRT .0325, XLY .0435, AAPL .0493) — **because all five rule days sit INSIDE the corridor and all five print days sit just before it opens.** The 2026-12-22 lane's correction is vindicated and priced. Corrected 68-day CB set **0 of 9** (smallest XRT .3108); 68 rule days **0 of 9** (smallest SPY .2015) — both replicate the siblings; Dec print days vs other CB days **0 of 9** (smallest XRT .1586). **THE CHAIN'S OPEN VIX DISCREPANCY IS CLOSED AND NEITHER LANE HAD A BUG.** `VIX_History.csv` carries **32 rows on non-NYSE-session dates** in the window (every federal-holiday closure plus **2025-01-09**, Carter's day of mourning). Session-aligned vs raw medians: **Jan 18.14/18.07 · May 18.12/18.09 · Jun 16.70/16.73 · Sep 17.20/17.17 · Nov 17.25/17.21**; other seven months identical. **Session-aligned = the 11-30 lane's figures; raw = the 10-26 lane's.** **Five months differ, not three** — Jan and May were never compared. Session-aligned is correct for equity-session channels. **Live instance:** this session's file is **472,360 B** vs the siblings' 472,309 — the added row is **09/07/2026, Labor Day, a closed session**. **DIRECTIONAL: NINTH MONTH, NINTH REFUSAL.** December CB days **4 of 5 up** (+1.000 / +1.495 / −1.386 / +0.599 / +0.457 %), SPY median **+0.599%** vs **−0.010%** other late-December (≥15th), **p=0.1729** (n=5 vs 63) — friendliest of the nine, still nowhere near. Scan: Apr **.0150**, Sep .3796, Oct .1643, Nov .5957, Dec **.1729**. Scoring venue **2026-12-22**. **80-THRESHOLD BAND, THREE NEW OUT-OF-SAMPLE PAIRS:** Dec-2022 Exp **82.4→83.4** (dist 2.4, outside), Dec-2023 **85.6→81.9** (5.6, outside), Dec-2024 **81.1→86.5** (1.1, **inside**, moved **+5.4** without crossing). Pooled **outside ±2.0 = 0 of 12** (was 0/10); **inside 3 of 7** (was 3/6). The 09-28 lane's fragment to score; untouched here. **2027 HAS NO CHRISTMAS EVE HALF SESSION.** Christmas Day 2027 is a **Saturday** → NYSE observes Friday **2027-12-24** as a full closure. Verified from the tape, not asserted: **2021, the structural twin, jumps 2021-12-23 → 2021-12-27**. Half sessions exist in-window only 2020-12-24, 2024-12-24, 2025-12-24 (Dec 24 Thu/Tue/Wed), absent 2021/2022/2023. Corridors in half-session years are if anything **narrower** (3 of 9, XRT .0103, AAPL .0329, TLT .0329, n=10 vs 18) — points the wrong way for 2027 but is a year effect at 3 vs 3; declined. **METHOD/REPLICATION.** stockanalysis.com + CBOE, n=**1,447** sessions 2020-12-01→2026-09-04 (siblings' count exactly), 68 CB days, session range (h−l)/o, two-sided Mann-Whitney with tie correction. **7 serial publisher fetches, no captcha**, each validated by byte count and its `Source:` line: landing **332,031 B** (byte-identical to Jun–Nov siblings), `CCI-Dec-2022` **889,114**, `CCI-Dec-2023` **1,264,748**, `CCI-Dec-2024` **898,445** (all three matching the 11-30 lane), `CCI-Jan-2023` **880,155**, and **new to this chain** `CCI-Jan-2024` **852,996**, `CCI-Jan-2025` **910,154**. **THREE FETCHES FAILED AND ARE RECORDED, NOT SUBSTITUTED:** `CCI-Dec-2021`, `CCI-Dec-2025`, `CCI-Nov-2025` each returned HTTP 200 carrying the 332,031-byte current-edition landing page — same artifact the 2026-12-22 lane logged for two of them; **2021's and 2025's dates and cut-offs are INHERITED, and legs 1 and 4 each rest on 2 inherited points of 5.** `probe-ref.blocked` carries all three. Block permutation seeded **20260908**, 2,000 trials, ±~0.005 Monte-Carlo error. Adjacency sweep — **peers:** `symbols: []`, none. **Macro surprises:** none new; the corridor's own is the 12-08 SEP inside the field window. **Volatility regime:** VIX **14.53**, SPY **770.19** (2026-09-04 closes — 2026-09-07 was Labor Day, which is exactly leg 9's artifact). **Geopolitical:** unchanged from siblings. **Event tape:** no December 2027 consensus exists or is publishable (CB publication restrictions); current edition August 2026, next release named **2026-09-29**. **Corridor: ZERO tracked events existed within 5 days of 2027-12-22** before this PR. **TWO proposals filed:** `proposals/christmas-market-closure-2027-12-24.from-consumer-confidence-2027-12-22.json` (leg 11's structural fact — and a caution NOT to file a companion half-day entry, because the absence is the finding) and `proposals/opex-2027-12-17.from-consumer-confidence-2027-12-22.json` (December quad-witching, third Friday, the only other dated event inside the five-day corridor). **NOT filed:** `fhfa-hpi-2027-12-28` (6 days out, outside the corridor, and already proposed by `from-fhfa-hpi-2027-10-26`) and `fomc-2027-12-08` (already proposed by `from-fomc-2027-10-26`) — duplicates would be calendar noise. Nine forward tests registered: **FT-consumer-confidence-2027-12-22-1** through **-9**. | — (stance set) | 2026-09-29 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-consumer-confidence-2027-12-22.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
