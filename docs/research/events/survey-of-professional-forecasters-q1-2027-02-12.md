# Philadelphia Fed Q1 2027 Survey of Professional Forecasters — survey-of-professional-forecasters-q1-2027-02-12

**Kind:** macro-print · **Date:** 2027-02-12 (estimate, EST: derived — no page anywhere states this date; the Philadelphia Fed's calendar endpoint re-fetched direct 2026-09-10 HTTP 200 at 130,695 bytes still carries 2026 rows only, and the date is computed from a *one-step* release rule fitted to the publisher's own `spf-release-dates.txt`, 146 quarters) · **Impact:** low
**Last assessed:** 2026-09-10
<!-- probe-ref: {"symbols":{},"vix":16.46,"daysBand":"low:15+","adjacentIds":["eia-steo-2027-02-09","fomc-minutes-2027-02-17","presidents-day-market-closure-2027-02-15","uk-cpi-2027-02-17","uk-labour-market-2027-02-16","vix-expiration-2027-02-17","washingtons-birthday-market-closure-2027-02-15"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/schedule/news_release/2027_sched.htm","status":"403","at":"2026-09-10"},{"url":"https://www.bls.gov/schedule/2027/home.htm","status":"403","at":"2026-09-10"}]} -->

## At a glance

**TL;DR.** **This event was filed one day ago as a deliberately weak proposal whose whole purpose was
to be falsified. It has been — in part. The date stands; the rule that produced it does not.** The
proposal dated 2027-02-12 by chaining two inferences: the SPF response deadline is the *second
Tuesday* of the quarter's middle month, and the release follows three business days later. Run
out-of-sample against Q1 alone — from the publisher's own `spf-release-dates.txt`, re-fetched direct
2026-09-10 (HTTP 200, **8,298 bytes**, byte-identical to yesterday's pull, **146 quarters** parsed) —
**that chain reproduces only 11 of 36 Q1 release dates across the full history and 8 of 13
non-shutdown Q1s since 2012.** It misses 2013, 2014, 2020, 2022 and 2025 outright, because the
deadline is the Tuesday of the month's second *calendar week*, which is the **first** Tuesday of
February whenever Feb 1 falls Wednesday or later. **The replacement skips the deadline entirely and
is one step: the Q1 SPF releases on THE FRIDAY BETWEEN FEBRUARY 9 AND 15 INCLUSIVE** — exactly one
such Friday exists per year — **16 of 16 non-shutdown Q1 releases since 2009, 13 of 13 since 2012,
zero exceptions**, with the weaker day-of-month band alone (Feb 9–15, any weekday) holding **20 of 20
since 2005**. **Both rules land on Fri 2027-02-12**, so the proposal's date survives on much stronger
evidence than it was filed with; they agree only because Feb 1 2027 is a Monday, the one alignment
where the two readings coincide. **Q1 is the structurally cleanest quarter for such a rule:**
Presidents Day is the third Monday of February and so never falls before the 15th, meaning **no
federal holiday can ever land inside a Tuesday-to-Friday Q1 window** — which is why Q1 is 13-of-13
Fridays while Q4, where Veterans Day sits inside the window, is only **4 of 13**. **The tier is
re-measured and stays `low`, but the sibling ledger's emphasis is corrected.** Pooled, the null
holds. Sliced by quarter it scatters both ways: release-day vs other-day mean |Δ| ratios are
**T10YIE Q1 1.00 / Q2 1.32 / Q3 0.85 / Q4 0.70**, **VIX Q1 1.26 / Q2 0.90 / Q3 0.82 / Q4 1.15**,
**DGS10 Q1 1.24 / Q2 1.02 / Q3 1.00 / Q4 0.84** — twelve subsamples, and the largest Welch t is
**−2.47**, *negative*, on Q4's breakeven. **That is a null sliced twelve ways, and it means the
sibling's "23 for 23" November tightness and this session's Q1 elevation are one artifact pointing in
two directions.** **The one fact that genuinely raises risk on this date is shutdown delay, and it is
a Q1 problem specifically:** three of the publisher's four documented delays are Q1s — **3 of 36
(8.3%) against 1 of 110 (0.9%)** — and the 2025-10-01→2025-11-12 shutdown ended in *November* yet
still pushed the 2026Q1 survey from a rule-implied **2026-02-13** to an actual **2026-03-06**, 21
days. This calendar tracks `cr-expiry-2026-12-11` (`high`, `estimate`) **63 days before this print**.
Date is **`estimate`**; `symbols: []`; **nothing here licenses an entry**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-155) | **Stand aside** | High | `low` impact, `estimate` date, `symbols: []`, 155 days out, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed — every one is symbol- or earnings-keyed. There is no instrument in which to hold a view on a quarterly forecaster survey. | The Philadelphia Fed publishing a 2027 calendar that dates the Q1 survey anywhere other than **2027-02-12**, which voids the one-step rule below and forces this document to be re-derived rather than pulsed |
| This week | **Stand aside — and stop carrying the inherited two-step date rule forward** | High | The deadline-plus-three-business-days chain the proposal used reproduces **11 of 36** Q1 release dates over the full history and **8 of 13** non-shutdown Q1s since 2012. The one-step "**Friday between Feb 9 and 15**" rule is **16 of 16** since 2009 and **13 of 13** since 2012. A future lane dating an SPF edition should use the one-step rule for Q1/Q2/Q3 and the holiday-adjusted chain **only** for Q4. | Any non-shutdown Q1 release since 2009 turning out to fall outside the Feb 9–15 Friday — i.e. an error in this session's parse of `spf-release-dates.txt`, checkable by re-fetching the 8,298-byte file and re-running the count |
| This month | **Watch `cr-expiry-2026-12-11`, not this print — it is the only thing that can move the date** | Medium | Three of the four shutdown delays the publisher itself footnotes are **Q1** surveys (1996Q1, 2019Q1, 2026Q1): **3 of 36 Q1s at 8.3%** against **1 of 110 other quarters at 0.9%**. Federal funding lapses cluster October→January and the Q1 panel's jump-off values are exactly the statistics that stop being produced. Confidence is **medium**, not high, because n = 3 delays is a thin base rate however clean the mechanism. | A clean full-year appropriation enacted on or before **2026-12-11**, which removes the only identified channel by which 2027-02-12 moves and would promote the Today call's confidence at the next pulse |
| This quarter | **Do not re-tier on either quarter's subsample — the pooled null is the finding** | High | Twelve quarter-by-series subsamples give release-day ratios from **0.70 to 1.32** with a largest \|Welch t\| of **2.47** that is *negative*. Dropping the three attributable Q1 VIX days (2026-03-06 the shutdown release, 2018-02-09 Volmageddon week, 2022-02-11 the Ukraine warning) takes the Q1 VIX ratio from **1.26 to 0.96**. | The Q1 2027 release day showing a T10YIE close-to-close move above **0.05** — breached on only 3 of 24 Q1 release days since 2003 — which on an otherwise empty date would be the first evidence that a quarter subsample is real rather than noise |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never trade this print.** `low` impact, `symbols: []`, `estimate` date, no macro-keyed house
  playbook exists, and only close-to-close data is used — no release-hour test is run or claimed.
- **Use the one-step rule to date any future SPF Q1/Q2/Q3.** The Friday in the **9th–15th** of the
  quarter's middle month: **16/16 since 2009**, **13/13 since 2012**, non-shutdown.
- **Do not use it for Q4.** Q4 is **4 of 13** Fridays since 2012 — Veterans Day sits inside its
  window. Q4 needs the deadline chain plus the holiday skip.
- **Q1 is holiday-proof by construction.** Presidents Day is the third Monday of February, never
  before the 15th, so it cannot fall inside a Tue→Fri Q1 window. **Presidents Day 2027 = Mon
  2027-02-15**, three days *after* this release.
- **The dated shutdown precedent is recent and it is the falsifier that matters.** The
  2025-10-01→2025-11-12 lapse ended in November and the 2026Q1 survey still slipped
  **2026-02-13 → 2026-03-06**, **21 days**. 2019Q1 slipped 35.
- **Watch (dated):** `government-funding-deadline-2026-09-30` (`high`) · **`cr-expiry-2026-12-11`
  (`high`, `estimate`) — the live channel** · Philadelphia Fed 2027 calendar publication, date
  unknown · `jobs-2027-02-05` (`high`) · derived deadline **2027-02-09** · **this print 2027-02-12** ·
  Presidents Day **2027-02-15** · `fomc-minutes-2027-02-17` (proposed).
- **2027-02-12 carries no other tracked event** — canonical or proposed. Same clean-tape property
  the Q4 edition had, and the same reason a breach there would be informative.
- **The derived deadline is NOT CPI day, unlike Q4's.** This calendar tracks no 2027 CPI at all —
  the `cpi-*` series stops at `cpi-2026-12-10`. Recorded as a gap, **not** filled by a guess.
- **Two fetches were blocked and were not substituted.** `bls.gov` returned **403** twice (the
  documented Actions-lane blind spot); no 2027 CPI date is proposed. FRED and every Philadelphia Fed
  endpoint were reachable. VIX **16.46** is FRED `VIXCLS`, 2026-09-09 close, the latest published.

## Initial research

### The question, plainly

This event exists because a sibling lane invented it. `survey-of-professional-forecasters-q4-2026-11-16`'s
initial research, run 2026-09-09, derived a construction rule for SPF release dates and then filed
`proposals/survey-of-professional-forecasters-q1-2027-02-12.from-survey-of-professional-forecasters-q4-2026-11-16.json`
as, in its own words, *"deliberately weak … and exists to be falsified"* — a date **no publisher has
printed**, computed purely from that rule, so that the Philadelphia Fed's eventual 2027 calendar
would adjudicate the rule instead of leaving it unfalsified in a document. It assigned this session
three tasks: **(a)** replace the derived date with the bank's published 2027 row the moment one
exists, **(b)** record whether the rule held, and **(c)** score the sibling's forward test if the Q4
print had not already settled it.

So: has the bank published 2027 yet, does the rule hold, and is `low` still right for a Q1 edition?

**One-line verdict:** the bank has published nothing, the **date survives but the rule does not** —
the inherited two-step chain is **8 of 13** on non-shutdown Q1s since 2012 and is replaced here by a
one-step rule that is **16 of 16 since 2009** and lands on the same **2027-02-12** — and the tier
stays `low` while the sibling's quarter-level *emphasis* is corrected: a Q1 slice looks *elevated*
exactly as much as its Q4 slice looked tight, and both are noise.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies as written and the cache-busting rule
has no target. This event existed only as one proposal, so per the mode contract that proposal was
read first and the canonical
`src/domain/market-events/survey-of-professional-forecasters-q1-2027-02-12.json` is written in this
PR. Four inputs, all fetched direct **2026-09-10**:

1. **`spf-release-dates.txt`, re-fetched rather than trusted** — HTTP 200, **8,298 bytes**,
   byte-identical to the sibling lane's 2026-09-09 pull. Parsed independently to **146
   (deadline, release) pairs, 1990Q2 → 2026Q3**; **36** of them are Q1. Re-parsing rather than
   quoting the sibling's summary is what surfaced the rule error in leg 1.
2. **The bank's calendar endpoint** (`philadelphiafed.org/calendar-of-events`) — HTTP 200,
   **130,695 bytes**. Searched for 2027: **zero rows**. The four SPF rows it carries are all 2026,
   and the Q4 row still reads `"day":"16"`, `"year":"2026"`, `"time":"10:00 a.m."` — an independent
   same-day re-verification of the sibling event's date, recorded here and **not** written into that
   event's ledger, which this lane does not own.
3. **Four FRED daily series, pulled this session** — `T10YIE` (97,904 B), `T5YIE` (97,960),
   `VIXCLS` (161,170), `DGS10` (268,663) — joined to the release-date file for legs 3–5. VIX
   **16.46** is `VIXCLS` at its latest published close, 2026-09-09 (prior 15.72).
4. **The calendar itself, read as data.** The corridor census in leg 6 queries
   `src/domain/market-events/` and its `proposals/` directory directly, not from memory. The
   event's date is **`estimate`** and that label rides every trading-adjacent line below.

**Blocked, and recorded rather than substituted:** `bls.gov/schedule/news_release/2027_sched.htm`
and `bls.gov/schedule/2027/home.htm` both returned **403** — the Actions-lane blind spot
[`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) already documents. Both are in
`probe-ref.blocked`, and the consequence is stated in leg 6 rather than papered over: **no 2027 CPI
date is proposed by this session**.

### Conviction legs, tested

1. **The inherited two-step rule is wrong for Q1 — REFUTED, and this is the session's main finding.**
   The proposal and its parent ledger both state the rule as: deadline = **second Tuesday** of the
   quarter's middle month; release = **+3 business days** excluding weekends and federal holidays.
   Run against every Q1 in the file, predicting from the calendar alone:

   | Q1 reproduction, second-Tuesday chain | Result |
   |---|---|
   | Exact release-date hits, full history (n = 36) | **11** |
   | Deadline hits, non-shutdown 2012–2026 (n = 13) | **5** |
   | Deadline hits under the *second-calendar-week* reading, same 13 | **8** |
   | Release hits under the second-calendar-week reading, same 13 | **9** |

   The failure is systematic, not scattered. In **2013, 2014, 2020 and 2025** the actual deadline is
   the **second** Tuesday and the second-calendar-week reading misses; in **2012, 2017, 2018, 2023
   and 2024** it is the **first** Tuesday of February and the second-Tuesday reading misses. The
   discriminator is where Feb 1 falls: when Feb 1 is **Wednesday or later**, the Tuesday of the
   month's second *calendar week* is the month's *first* Tuesday. Neither reading covers both
   families, and **2022** (a Monday deadline, Feb 7) is outside both.

2. **A one-step rule that skips the deadline is 16 of 16 — SUPPORTED, and it is a strictly simpler
   object than what it replaces.** Reading the release dates directly rather than deriving them:

   | Rule, non-shutdown Q1 only | Since 2005 | Since 2009 | Since 2012 |
   |---|---|---|---|
   | Release day-of-month in **Feb 9–15** (any weekday) | **20 / 20** | 16 / 16 | 13 / 13 |
   | Release is **the Friday** in Feb 9–15 | 16 / 20 | **16 / 16** | **13 / 13** |

   Exactly one Friday falls in a 9th-to-15th window, so the two clauses together name **one date per
   year with no arithmetic**. The four pre-2009 misses are all *inside* the day-of-month band and
   merely not yet on the Friday convention — 2005-02-14 (Mon), 2006-02-13 (Mon), 2007-02-13 (Tue),
   2008-02-12 (Tue) — which dates the convention's adoption to **2009** rather than treating those
   years as exceptions.

   **For 2027: Feb 1 is a Monday, the Fridays are 5, 12, 19, 26, and the one in the window is Fri
   2027-02-12.** The old chain gives the same answer here — second Tuesday = Feb 9, +3 business
   days = Feb 12 — because a Monday Feb 1 is precisely the alignment where "second Tuesday" and
   "Tuesday of the second calendar week" coincide. **The proposal's date is right for a reason
   partly different from the one it gave.**

3. **The rule is a Q1/Q2/Q3 rule and must not be carried into Q4 — SUPPORTED, and it explains the
   sibling ledger's "Friday trap" from the other side.** Same window rule, 2012+ non-shutdown:

   | Quarter | n | Release is a Friday | Release in the 9–15 band | Both |
   |---|---|---|---|---|
   | Q1 | 13 | 13 | 13 | **13** |
   | Q2 | 15 | 15 | 13 | 13 |
   | Q3 | 15 | 15 | 14 | 14 |
   | **Q4** | 13 | **4** | 10 | **4** |

   Q4 collapses because **Veterans Day (Nov 11) sits inside its Tuesday-to-Friday window** and pushes
   the release to Monday. Q1 cannot suffer the same thing **by construction**: February's only
   federal holiday is Presidents Day, the **third Monday**, which cannot fall before the 15th — and a
   Monday cannot lie between a Tuesday and the Friday of the same week. **Q1 is the one quarter whose
   window is provably holiday-free**, which is why it is the quarter where a naive rule works and the
   quarter on which a rule should be tested. The sibling ledger reached the same fact from the Q4
   side ("45 of 45 Fridays in Q1–Q3, 15 of 21 Mondays in Q4"); stated from the Q1 side it becomes
   usable as a *dating rule* rather than a trap warning.

4. **The tier question — `low` SURVIVES, but the sibling's quarter-level emphasis is MIXED and is
   corrected here.** Absolute close-to-close change on SPF release days vs all non-release days,
   sliced by quarter (T10YIE from 2003, VIX and DGS10 from 1990):

   | Series | Q1 | Q2 | Q3 | Q4 |
   |---|---|---|---|---|
   | **T10YIE** ratio (Welch t) | **1.00** (−0.03) | 1.32 (+1.45) | 0.85 (−0.91) | **0.70 (−2.47)** |
   | **VIXCLS** ratio (t) | **1.26** (+1.14) | 0.90 (−0.57) | 0.82 (−1.23) | 1.15 (+0.67) |
   | **DGS10** ratio (t) | **1.24** (+1.49) | 1.02 (+0.13) | 1.00 (−0.01) | 0.84 (−1.23) |

   n = 23–24 per cell on T10YIE, 36–37 on VIX and DGS10. **Twelve subsamples, ratios spanning
   0.70–1.32, and the single largest |t| is −2.47 — on the quarter the sibling ledger described as
   the tightest null in the study.** A Q1-only reader of this table would say the SPF moves markets;
   a Q4-only reader would say it *suppresses* volatility. Both readings are the same artifact. **The
   honest statement is the pooled one the sibling ledger led with, and neither quarter's subsample
   should be quoted as a property of that quarter** — including, explicitly, its own "23 for 23 at or
   under 5bp."

   Attribution supports the noise reading on VIX and only partly on DGS10, which is stated rather
   than smoothed. The three largest Q1 release-day VIX moves all have obvious non-SPF causes —
   **2026-03-06 (5.74**, the shutdown-delayed release itself), **2018-02-09 (4.40**, inside the
   February 2018 volatility spike), **2022-02-11 (3.45**, the Ukraine-invasion warning). Removing
   those three takes the **Q1 VIX ratio from 1.26 to 0.96** on the remaining 33 days. **DGS10 does
   not follow: it stays at 1.25.** That residual is recorded as unexplained, not argued away.

   One confound was tested and **did not explain anything**. If mid-February were simply a busy
   calendar slot, non-SPF days in the same window would be elevated too. They are not: for other
   **Feb 9–15** days, ratios against all other days are **T10YIE 0.92, T5YIE 1.11, VIX 0.77, DGS10
   0.98** (n = 97–160). The slot is if anything *quieter*. So the Q1 elevation is specific to the
   release days themselves — which, given the scatter above and the three attributable days, reads as
   small-sample noise, but is **not** disposed of by a calendar-slot story and is not claimed to be.

5. **On the one series most comparable to what the SPF publishes, the Q1 null is exact — SUPPORTED.**
   The 10-year TIPS breakeven is the market's own version of the survey's headline long-run inflation
   line. Across **24** Q1 release days with breakeven data (2003–2026): mean |Δ| **0.0229** against
   **0.0230** on all other days — a ratio of **1.00** and a Welch **t of −0.03**, the flattest cell
   in the entire table. Maximum **0.070**; **21 of 24** at or under **0.05**. The three breaches are
   2009-02-13, 2016-02-12 (both 0.070) and 2019-03-22 (0.060, the shutdown-delayed release). This is
   the leg the This-quarter falsifier is written against, because it is the one place a Q1 result is
   clean enough to be worth pre-registering.

6. **The corridor — an empty date, a deadline that is *not* CPI day, and a gap this session refused
   to fill.** Querying `src/domain/market-events/` and `proposals/` directly:

   | Date | Tracked (incl. proposals) | Notables |
   |---|---|---|
   | 2027-02-05 | 1 | `jobs-2027-02-05` (`high`, `estimate`) |
   | 2027-02-09 | 1 | `eia-steo-2027-02-09` (`low`) — **the derived collection deadline** |
   | **2027-02-12** | **0** | **this print would be the only tracked event on its date** |
   | 2027-02-15 | 2 | Presidents Day closures |
   | 2027-02-17 | 3 | `fomc-minutes-2027-02-17` (proposed, medium), `vix-expiration-2027-02-17` |

   **The empty date reproduces the Q4 edition's cleanest property**, and it is why leg 5's falsifier
   is worth registering: a breach on a date carrying nothing else is hard to blame on something else.

   **The deadline is not CPI day, and that is a difference from Q4, not a similarity.** The sibling
   ledger's most striking corridor fact was that its derived deadline **2026-11-10** was CPI day.
   Here the derived deadline **2027-02-09** is not — because **this calendar tracks no 2027 CPI at
   all**: the `cpi-*` series runs `cpi-2026-09-11` → `cpi-2026-12-10` and stops. That is a genuine
   hole, since a January CPI print would land squarely in this corridor. **It is recorded and not
   filled**: `bls.gov` returned 403 twice this session, CPI release dates are not rule-derivable the
   way the SPF's are, and proposing a guessed date would be exactly the failure this document spends
   legs 1–3 correcting.

7. **Shutdown delay is a Q1 risk specifically — SUPPORTED, and it is the only channel by which this
   date realistically moves.** The publisher's own footnotes name four delayed surveys: **2026Q1,
   2019Q1, 2013Q4, 1996Q1**. **Three of the four are Q1s.**

   | Group | Delayed | Total | Rate |
   |---|---|---|---|
   | **Q1** | **3** | 36 | **8.3%** |
   | Q2 + Q3 + Q4 | 1 | 110 | 0.9% |

   The mechanism is not a coincidence of the sample: federal funding lapses cluster in the **October
   → January** window (fiscal-year start, then continuing-resolution cliffs), and the Q1 survey's
   *jump-off values* — the Q4 GDP, December CPI and PCE actuals the panel forecasts *from* — are
   precisely the statistics a dark agency stops producing. The magnitude is documented, not guessed:
   **2019Q1** slipped from a rule-implied 2019-02-15 to **2019-03-22** (35 days); **2026Q1** slipped
   from a rule-implied **2026-02-13** to **2026-03-06** (**21 days**) even though the
   2025-10-01→2025-11-12 shutdown had **ended in November** — the data backlog, not the lapse itself,
   carried the delay into the following February.

   This calendar tracks **`cr-expiry-2026-12-11`** and **`government-funding-deadline-2026-12-11`**
   (both `high`, both `estimate`) at **D-63**, and `government-funding-deadline-2026-09-30` at D-135.
   A lapse at either is the identified path from those dates to this one. It is a **schedule** risk,
   not a market one, and it is why the This-month call watches the funding cliff rather than the
   print.

### What plays the conditions support

**None.** Explicitly, and for reasons measured rather than assumed:

- `symbols: []` — no tracked name carries a forecaster-survey channel, so there is nothing in which
  to express a view.
- No house playbook (**S1/S2/E1/S3/S4 + G1**) is macro-keyed; all are symbol- or earnings-keyed. The
  kill list in [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) has no entry this could revive.
- The date is **`estimate`** — and more weakly sourced than most, since *no publisher has printed
  it*. Per the date policy ([`trade-playbooks.md`](../../plans/trade-playbooks.md) decision log),
  date-keyed action requires `confirmed`.
- Leg 4 is a null pooled and a coin-flip sliced; leg 5 is a null on the one series that matters.
  Neither supports a position, and a 1.24 DGS10 ratio at t = +1.49 on n = 36 is not an edge, it is a
  number that has not yet decided what it is.

The output of this session is a **corrected construction rule** (legs 1–3), a **methodological
correction to a sibling ledger's emphasis** (leg 4), a **quantified Q1-specific schedule risk**
(leg 7) — and a canonical calendar entry. Not a position.

### Adjacency sweep

**Peer prints** — the Philadelphia Fed's calendar payload lists no 2027 events at all, so no sibling
bank release can be dated into this corridor yet; the SPF family this repo tracks
(`philly-fed-mfg-*`, `philly-fed-price-inflation-expectations-q4-2026-11-25`,
`livingston-survey-2026-12-11`, `aruoba-inflation-term-structure-*`) all sit in 2026 and none
reaches February 2027. **Macro surprises** — `jobs-2027-02-05` (`high`) is the load-bearing print in
range at D-7; there is no tracked 2027 CPI (leg 6). **Volatility regime** — VIX **16.46** (FRED
`VIXCLS`, 2026-09-09 close; prior 15.72, a +0.74 day); no options-shaped play is contemplated, so the
regime is baseline only. **Geopolitical / policy** — `cr-expiry-2026-12-11` and
`government-funding-deadline-2026-12-11` (`high`, `estimate`) are the shutdown channel of leg 7, and
they are the reason this event's This-month call points 63 days upstream of itself. **Event tape** —
no consensus, whisper or implied move exists for a quarterly forecaster survey, and none is
manufactured here.

**No new file is proposed by this sweep**, and that is a deliberate outcome rather than an empty one.
Two candidates were considered and both declined:

| Candidate | Why it was declined |
|---|---|
| A 2027 CPI entry (a January print would sit in this corridor) | `bls.gov` returned **403** twice this session and CPI dates are not derivable from a cadence rule the way SPF dates are. Proposing a guessed date would repeat exactly the error legs 1–3 correct. Recorded as a **gap** in leg 6 instead |
| The remaining 2027 SPF editions (Q2/Q3/Q4) | Their dates *are* derivable and they are pre-registered as forward test **-2** below rather than filed as calendar entries — a prediction under test is the honest home for four dates no publisher has printed, and filing three more derived rows before the first one scores would multiply an untested rule across the calendar |

### Honest limits

- **The one-step rule is fitted to 16 observations and has never been tested forward.** Sixteen of
  sixteen since 2009 is a strong in-sample record and nothing more; **2027-02-12 is its first
  out-of-sample test**, which is why it is registered rather than asserted. It is also *descriptive*
  — it names where the bank has put the release, not why.
- **The pre-2009 record is a different regime and is not evidence for the rule.** Before 2009 Q1
  releases ran late February and into March (1993-03-01, 1996-03-11, 2003-02-24), and the modern
  band only holds from 2005. Any claim beyond "since 2009" is unsupported.
- **Close-to-close only; no release-hour test was run or claimed.** The SPF prints at 10:00 ET and
  daily FRED data cannot isolate that window. A large intraday move fully reversing by the close is
  invisible to legs 4 and 5.
- **Leg 4's Q1 elevation is not fully explained.** VIX collapses to 0.96 once three attributable days
  are removed; **DGS10 stays at 1.25** and this document does not know why. Called noise on the
  strength of the twelve-cell scatter, not on a mechanism.
- **The shutdown base rate rests on three events.** 3 of 36 is 8.3% with a wide interval; the
  *mechanism* is documented by the publisher, the *rate* is thin, and the This-month call is
  `medium` for that reason.
- **The Q4 2026 edition has not printed yet.** So the sibling's forward test
  `FT-survey-of-professional-forecasters-q4-2026-11-16-1` is still open and this session **scores
  nothing** — task (c) of the proposal is not yet dischargeable, and the score-by date on it is
  2026-11-20.
- **This session did not edit the sibling ledger**, though leg 1 materially weakens the rule half of
  its forward test. Rows are append-only and a lane never writes another event's fragment; the
  finding is recorded here and the Q4 close-out will find it.
- **Two fetches were blocked and were not silently substituted.** Both `bls.gov` endpoints returned
  403, recorded in `probe-ref.blocked`, with the consequence stated in leg 6.

## Stance & kill switches

**Permanent stand-aside on the `estimate`-dated 2027-02-12 print — and this document's contribution
is a corrected rule, not a view.** The date the proposal filed is right; the derivation it filed is
not. A future lane dating any SPF edition should use **the Friday between the 9th and 15th of the
quarter's middle month** for Q1, Q2 and Q3 (16/16 since 2009 on Q1), and the **deadline-plus-three-
business-days-skipping-Veterans-Day** chain for Q4 only (Q4 is 4-of-13 Fridays; the two rules
*disagree* for Q4 2027, which is what makes forward test **-2** a real test).

**The tier stays `low` and the sibling ledger's pooled null stands — but its quarter-level emphasis
does not.** Sliced twelve ways, release-day ratios run 0.70 to 1.32 and the largest Welch t is
**−2.47** on Q4's breakeven. A lane quoting "23 for 23 at or under 5bp" as a *November* property, or
quoting this session's **1.26 VIX / 1.24 DGS10** as a *February* property, is quoting noise in both
directions. The pooled statement — **the SPF does not move a tape** — is the one that survives.

**The stance is not "ignore the document."** Its value is informational: a Q1 edition carries the
panel's first full-year view of the year just begun, on a date that carries nothing else. Read the
near-term revision; the 10-year line moved **6bp a quarter** for twenty-four years (leg 4 of the
sibling ledger) and carries nothing a breakeven does not already price.

**What would change the stance:**

- **The Philadelphia Fed publishing a 2027 calendar dating the Q1 survey anywhere but 2027-02-12.**
  That kills the one-step rule on its first out-of-sample test and forces a re-derivation rather
  than a pulse.
- **A funding lapse at `cr-expiry-2026-12-11`.** The publisher's own footnotes make Q1 the
  shutdown-exposed quarter (**3 of 4 documented delays**, 8.3% vs 0.9%), and the 2026Q1 precedent
  shows a November-ending shutdown still moving a February release by **21 days**.
- **A T10YIE close-to-close move above 0.05 on 2027-02-12** — breached on only 3 of 24 Q1 release
  days since 2003, on a date carrying no other tracked event, which would be the first real evidence
  that a quarter subsample is signal rather than noise and would reopen the tier question.
- **A tracked name acquiring a forecaster-survey channel**, which would give `symbols: []` something
  to hold and change the "no instrument" leg of every stand-aside above.

Three predictions with score-by dates are registered in
[`forward-tests/survey-of-professional-forecasters-q1-2027-02-12.md`](../forward-tests/survey-of-professional-forecasters-q1-2027-02-12.md).
All carry **zero capital** — this is an `estimate`-dated `low`-impact event with `symbols: []`, and a
registered prediction here is an accuracy record, never a position.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-10 | D-155 | **Initial research.** Canonical entry written from the one proposal that existed for this id — a proposal that asked to be falsified and **was, in part: the date stands, its rule does not.** **(a) Bank has published nothing** — `calendar-of-events` re-fetched (HTTP 200, **130,695 B**) carries **zero 2027 rows**; its Q4 2026 row still reads `day 16 / 2026 / 10:00 a.m.` (independent re-verification, **not** written into the sibling's ledger, which this lane does not own). **(b) THE RULE FAILED OUT-OF-SAMPLE AND IS REPLACED.** `spf-release-dates.txt` re-fetched (HTTP 200, **8,298 B**, byte-identical) and re-parsed to **146 pairs, 36 of them Q1**: the inherited second-Tuesday+3-business-day chain reproduces **11 of 36** Q1 releases all-history and **8 of 13** non-shutdown Q1s since 2012 — it misses whenever Feb 1 falls Wed or later, when the deadline is February's **first** Tuesday. **One-step replacement: the Q1 release is THE FRIDAY IN FEB 9–15** — **16/16 since 2009, 13/13 since 2012**; day-of-month band alone **20/20 since 2005**. Both rules give **2027-02-12** (Feb 1 2027 is a Monday, the alignment where they coincide). **Q1 is holiday-proof by construction** (Presidents Day = 3rd Monday, never before the 15th, and a Monday can't sit in a Tue→Fri window) — which is why Q1 is 13/13 Fridays and **Q4 only 4/13**; the rule is Q1/Q2/Q3 only. **(c) Tier `low` re-measured; sibling's quarter-level emphasis CORRECTED.** Release-day |Δ| ratios by quarter — **T10YIE 1.00/1.32/0.85/0.70**, **VIX 1.26/0.90/0.82/1.15**, **DGS10 1.24/1.02/1.00/0.84**; twelve cells, largest \|t\| **−2.47** and *negative*. The sibling's "23/23 ≤5bp" November tightness and this session's Q1 elevation are one artifact facing two ways. Three largest Q1 VIX days are attributable (2026-03-06 shutdown release 5.74, 2018-02-09 Volmageddon 4.40, 2022-02-11 Ukraine warning 3.45); drop them and **VIX 1.26→0.96**, but **DGS10 stays 1.25** — recorded unexplained. Calendar-slot confound **tested and refuted**: other Feb 9–15 days run 0.77–1.11. **T10YIE Q1 is exact: 1.00, t=−0.03, n=24, 21/24 ≤0.05.** **(d) SHUTDOWN IS A Q1 RISK** — 3 of the publisher's 4 documented delays are Q1s: **3/36 (8.3%) vs 1/110 (0.9%)**; 2026Q1 slipped **02-13→03-06 (21 days)** though the shutdown ended in November. `cr-expiry-2026-12-11` (`high`) sits at **D-63**. **Corridor: 2027-02-12 carries nothing else**; derived deadline 2027-02-09 is **not** CPI day because **no 2027 CPI is tracked at all** (`cpi-*` stops 2026-12-10) — recorded as a gap, **not** filled: `bls.gov` **403 twice**, in `probe-ref.blocked`. **Sweep proposed 0 files, deliberately** — the 2027 CPI declined (no source), the Q2/Q3/Q4 2027 SPF dates registered as forward test **-2** instead of filed. **Nothing scored**: the sibling's Q4 test is still open (score-by 2026-11-20). VIX **16.46** (FRED `VIXCLS` 2026-09-09; prior 15.72). Three forward tests registered. | **Stance set: permanent stand-aside; date affirmed on a NEW one-step rule, inherited rule retired for Q1–Q3; tier stays `low` with the sibling's per-quarter reading corrected to noise** | 2026-10-10 (`low` band, 30-day interval; ~D-125) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay, and a stance *change* earns its sentence in the Stance section with
the row as its receipt. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape) runs in every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-survey-of-professional-forecasters-q1-2027-02-12.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
