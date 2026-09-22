# US equity markets close early at 1:00 p.m. ET — the day after Thanksgiving 2028 — thanksgiving-half-day-2028-11-24

**Kind:** sector · **Date:** 2028-11-24 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday grid, 2028 column + footnote \*\*\*, fetched direct 2026-09-09; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.05,"daysBand":"low:15+","adjacentIds":["thanksgiving-market-closure-2028-11-23"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and retire the Black Friday vol anomaly, because it was a dose error.**
Two sibling ledgers built a claim on this session. The
[2026 one](thanksgiving-half-day-2026-11-27.md) found VIX rises on **18 of 33** day-after-Thanksgiving
Fridays (54.5%) against a **36.4%** ordinary-Friday base, p = 0.025 — one deviation surviving out of
four folk seasonals tested. The [2027 one](thanksgiving-half-day-2027-11-26.md) generalised it to a
**post-holiday rebound** (213/302 at 70.5% vs a 45.6% weekday-matched base) and honestly recorded that
it could not tell repricing from a marking artifact off daily bars. **This session resolved the dose
question both left open, and the answer removes the anomaly rather than explaining it.** Controlling
for the session's own SPY return, the non-return part of the VIX change is a monotone function of
**calendar days elapsed since the previous session** — **+0.254 VIX points per calendar day, t = 20.2,
n = 8,459** — with raw residual buckets running **−0.113** (1 day) / **+0.323** (2) / **+0.359** (3) /
**+0.770** (4). The day after Thanksgiving is a **two-calendar-day reopening**, and against *other*
two-calendar-day reopenings it is **dead on the null: 18/33 (54.5%) vs 26/47 (55.3%), P = 0.61**. An
ordinary **Monday** — three calendar days — runs *hotter* at **61.1%**. So both siblings' base rates
were wrong in opposite directions: 36% understated it, 70.7% overstates it, and the right number for
2028-11-24 is **~55%**. What survives untouched is the **thinness**, which is a half-session effect and
not a dose effect: SPY volume median **0.429×** trailing-20 against **0.797×** for other two-day
reopenings. Nothing here is tradeable: `impact: low`, `symbols: []`, the date is **`estimate`**. The
output is one retired claim, one law, four guards and three forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-807) | **Stand aside** — a 3.5-hour session 807 days out is not a position | High | `symbols: []`, `impact: low`, date `estimate`; a grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for `holiday\|half.day\|early close\|thanksgiving\|black friday` returns **0 and 0**, run this session | A house playbook keyed to holiday-shortened sessions being written and back-tested before **2028-11-24**, which would mean this date can fire something |
| This week | **Stand aside — this week is CPI 2026-09-11 and FOMC 2026-09-16, not a 2028 half day** | High | 49 tracked events land 2026-09-09 → 09-18 including six `high` prints, a decision and an opex; none of them touches this session | Any tracked event dated inside 2026-09-09 → 09-16 whose stance depends on 2028-11-24 |
| This month | **Stop quoting the 36% ordinary-Friday base for a holiday reopening — anywhere it appears** | Medium | The base is a dose artifact: an ordinary Friday is a 1-calendar-day reopening and this session is a 2-day one; the dose-matched control is **55.3%** (n=47) | Re-fitting `dVIX = a + b·ret + c·calDays` on bars through **2026-12-31** returning **c ≤ 0.15** or **t(c) < 3** — the law that justifies the reframing fails on its own sample |
| This quarter | **Carry "the rebound is calendar-days, not holidays" — and score it on the 2026-11-27 instance first** | Medium | Monotone across four buckets, t = 20.2, and it subsumes the ordinary Monday (+0.359) as the three-day case of one curve; two sibling framings become special cases | The dose coefficient re-fit on bars through **2027-11-30** landing outside **[0.15, 0.36]** or losing significance — registered as **FT-thanksgiving-half-day-2028-11-24-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2028-11-24 in any branch. `impact: low`,
  `symbols: []`, date `estimate`; date-keyed action requires `confirmed` regardless.
- **Attribution guard, restated correctly — a VIX uptick here is a ~55% base rate, not ~36% and not
  ~71%.** Read the day-after-Thanksgiving session against **other two-calendar-day reopenings**
  (26/47, 55.3%), never against an ordinary Friday and never against the pooled post-holiday set.
- **The dose law, for any session in this calendar.** Return-controlled, each calendar day of closure
  adds **0.254** VIX points (t = 20.2, n = 8,459). An ordinary Monday is the 3-day case of the same
  curve; a Tuesday after a Monday holiday is the 4-day case at **+0.770** and **76.0%** VIX-up.
- **Execution guard — thin is reliable; calm is not, and the thinness is the ONE Thanksgiving-specific
  effect.** SPY volume median **0.429×** trailing-20, **27 of 33** under 0.70× — against **0.797×** for
  other two-day reopenings and **0.883×** for ordinary Mondays. Realized range under 0.70× in only 21.
- **Execution guard — the bond side is NOT sourceable for 2028, unlike 2027.** SIFMA's payload carries
  US panels for 2026 and 2027 only (both giving the day after Thanksgiving a **14:00 ET** early close);
  the string `2028` appears 5 times, all inside "New Year's Day 2027/2028" headings, none in a holiday
  row. **Assume nothing about the 2028 fixed-income close** until SIFMA extends.
- **Execution guard — the options close is unsourced for 2028.** NYSE says 13:15 for *eligible
  options*; `cboe.com/about/hours/us-options/` contains `2028` **zero** times. Assume **13:00** unless
  the venue is NYSE American/Arca Options.
- **Structural — 2028 has TWO early closes and NINE holidays, the inverse of 2027.** Monday **July 3
  2028** (footnote \*\*, proposed here) and this one; New Year's Day 2028 is a Saturday with **no
  holiday observed** (footnote \*). Unlike 2027's lone early close, **this instance has a rehearsal.**
- **Structural — four full sessions separate the half day from month-end** (11-27 → 11-30), against one
  in 2026 and two in 2027. November rebalancing lands nowhere near the shortened session.
- **The corridor is the emptiest on this calendar.** Within ±5 days: only its own closure sibling
  `thanksgiving-market-closure-2028-11-23`. Within ±45 days: only `presidential-election-2028-11-07`
  (D−17) and `fed-board-closure-2028-11-10` (D−14). This is the **furthest-out date tracked** at all.
- **Not a finding — the election-year subsample is underpowered and no claim is built on it.** The 8
  election-year instances print VIX up **3 of 8** with a median SPY return of **+0.496%** against
  **+0.062%** for the other 25. n = 8. Recorded so a later session does not rediscover it as a signal.
- **Watch (dated)** — Thanksgiving **2026-11-26/27** (FT-1 and FT-2 observation 1) · Thanksgiving
  **2027-11-25/26** (est) · the July 3 rehearsal **2028-07-03** (est, proposed here) · election
  **2028-11-07** (est) · closure **2028-11-23** (est) · **this half session 2028-11-24** (est) ·
  month-end **2028-11-30**.

## Initial research

### The question, plainly

This event arrived as a proposal from the [`presidential-election-2028-11-07`](presidential-election-2028-11-07.md)
corridor sweep, and it has **two** well-researched twins — one and two years earlier. Between them the
siblings have already tested twelve legs, refuted three folk seasonals, re-derived the thinness twice,
and sourced the hours from the same NYSE footnote that names this date. Re-running any of that on a
date shifted 364 days would be transcription.

What they did *not* settle is the thing the 2027 ledger put in its own Honest limits, verbatim: *"Leg 6
is an association with no mechanism… Whether the rebound is repricing or the unwinding of a stale mark
is not resolvable from daily bars, and this ledger does not claim to have resolved it."* Two of the
three candidate mechanisms it named — genuine repricing on reopening, and Cboe's calendar convention
inside the VIX calculation — make **opposite predictions about dose**. Repricing should track the
*news* that accumulated, which does not scale cleanly with the length of a closure. A day-count
convention should scale with it, exactly and monotonically. Nobody had measured dose.

So this session asked: **does the post-holiday VIX rebound scale with the number of calendar days the
market was shut — and if it does, is the day after Thanksgiving anomalous once you compare it to the
right dose?**

**One-line verdict.** It scales, cleanly and monotonically at **+0.254 VIX points per calendar day**
(return-controlled, t = 20.2, n = 8,459), and once dose-matched **the Thanksgiving session stops being
anomalous at all** — 18/33 against a 26/47 control, P = 0.61. Both siblings' base rates were wrong in
opposite directions. The thinness claim is untouched and stays. Date `estimate`; no directional call.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) —
`symbols: []`, so no symbol-keyed instrument applies. Instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any bar was
pulled. Every figure below was computed this session from bars fetched today; every sibling figure is
either re-derived here and labelled as such, or cited without being repeated.

- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302, 109,180 bytes. Its holiday data
  is JSON-ish `"text":"…"` cells, not table markup; all 133 parsed, the grid recovered as ten
  four-column rows (Holiday / 2026 / 2027 / 2028) and every footnote read whole.
- **SIFMA** `sifma.org/resources/general/holiday-schedule` — HTTP 200, 299,159 bytes. The RSC payload
  was unescaped and searched in full, the same technique the 2027 sibling used to correct its own
  proposal. It yields 2026 and 2027 US cards and **no 2028 panel**.
- **Cboe** `cboe.com/about/hours/us-options/` — HTTP 200, 386,116 bytes. The string `2028` appears
  **zero** times; `2027` twice, in neither a schedule row.
- **Yahoo daily bars** — SPY 8,460 sessions from 1993-01-29 and `^VIX` 9,241 from 1990-01-02, last bar
  **2026-09-09**. Joined on SPY's session dates, so both series cover one tape (8,460 rows).
- **Definitions, fixed here so the test cannot be re-specified later.** A session's *calendar days
  elapsed* is the difference between its date and the previous session's date. A session is
  *post-holiday* when that exceeds its weekday's normal gap (3 for a Monday, 1 otherwise) — the 2027
  sibling's classifier, reused unchanged so the two sets are comparable. **This does capture Good
  Friday** (Thursday → Monday is a 4-day gap, one more than a Monday's normal 3), which was checked
  explicitly rather than assumed.
- **Nothing was blocked this session.** All four sources returned HTTP 200; `probe-ref.blocked` is
  empty. The 2027 sibling's `bls.gov` 403 was not re-attempted — no BLS claim is made here.

### Conviction legs, tested

1. **The hours are read, not derived — SUPPORTED (and still `estimate`).** NYSE footnote \*\*\*,
   verbatim: *"Each market will close early at 1:00 p.m. (1:15 p.m. for eligible options) on Friday,
   November 27, 2026, Friday, November 26, 2027, and **Friday, November 24, 2028** (the day after
   Thanksgiving)."* The 2028 column of the Thanksgiving Day row reads `Thursday, November 23***`.
   Statute agrees independently: 5 U.S.C. 6103 fixes Thanksgiving on the fourth Thursday of November,
   which in 2028 is the 23rd. **Why it stays `estimate`:** `CONFIRMED_PREFIX` in
   `scripts/event-scan-validation.mjs` has no slot for an exchange operator's own hours page (open
   issue #2552), and this lane may not self-confirm an event it discovered in-sweep.

2. **The 2027 sibling's headline is re-derived first, so this session argues against its own base —
   SUPPORTED.** Post-holiday sessions close VIX up **215 of 304 (70.7%)** against a **45.6%**
   weekday-matched normal-gap base, P ≈ 6.8×10⁻¹⁹; median ΔVIX **+0.505** against **−0.090**. The
   sibling reported 213/302 at 70.5% on bars one day older. Nothing below is a quarrel with *that*
   measurement — it is a quarrel with what it is a measurement **of**.

3. **The rebound is NOT return-driven — SUPPORTED, and this is the first load-bearing find.** If the
   reopening were repricing accumulated news, VIX should rise because the market *fell*. Split by the
   session's own SPY return:

   | Set | SPY UP: n | VIX-up | median ΔVIX | SPY DOWN: n | VIX-up | median ΔVIX |
   |---|---|---|---|---|---|---|
   | Post-holiday | 154 | **45.5%** | −0.050 | 150 | **96.7%** | +1.160 |
   | Normal-gap | 4,382 | 19.4% | −0.550 | 3,773 | 75.8% | +0.520 |

   On sessions where the market **went up**, VIX still rose 45.5% of the time against a **19.0%**
   weekday-matched base, P ≈ 7×10⁻¹⁴. Both halves are elevated by a similar amount, which is the
   signature of a **level shift**, not of a return effect. Formally: fitting
   `ΔVIX = α + β·ret` on normal-gap sessions alone gives `α = 0.022`, `β = −114.29`; the mean residual
   on post-holiday sessions is **+0.686** (t = 11.53, n = 304), positive in **81.9%** of them against
   **48.8%** normally. Re-running the residual against the session's own **open-to-close** return
   instead of close-to-close gives **+0.702** — so it is not the overnight gap either.

4. **The level shift SCALES with the number of calendar days closed — SUPPORTED, and this is what
   discriminates the mechanisms.** Same residual, split by how many extra calendar days the closure
   added:

   | Extra calendar days closed | n | mean residual ΔVIX | median | VIX-up |
   |---|---|---|---|---|
   | 1 (e.g. a Thursday holiday) | 139 | **+0.517** | +0.419 | 91/139 |
   | 3 (e.g. a Monday holiday) | 162 | **+0.813** | +0.726 | 121/162 |
   | 4 | 3 | +1.650 | +0.768 | 3/3 |
   | **≥2 pooled** | **165** | **+0.828** | — | — |

   Monotone. Repricing has no reason to scale with the *length* of a closure; a day-count convention
   inside an annualized-vol calculation has exactly that reason.

5. **The pre-holiday session shows NOTHING — SUPPORTED, and it is the asymmetry that picks the
   winner.** The 2027 sibling tested pull-forward on 50 Wednesdays before Thursday holidays. Widened
   to **all 304** pre-holiday sessions: VIX up **119/304 (39.1%)** against a **40.4%** weekday-matched
   base, P = 0.34 — dead on the null. Return-conditioned it is equally flat (SPY-up 18.6% vs 14.1%;
   SPY-down 65.9% vs 69.6%). The paired round trip does **not** wash: median pre **−0.200** plus median
   post **+0.505** leaves **+0.310** net across the closure. A "traders mark vol down into the holiday
   and it snaps back" story requires a pre-holiday crush and there is none. A day-count story predicts
   exactly this: the last session before a closure has no extra calendar days in *its own* step, so the
   whole effect appears on the reopening.

6. **The shift does NOT revert — SUPPORTED, against a matched control.** A raw look suggests reversal
   (VIX falls a median −0.310 over the next three sessions after a post-holiday one, against −0.080
   from a normal-gap one), but VIX mean-reverts after *any* jump, so that comparison is unfair.
   Matching on the jump itself — normal-gap sessions with ΔVIX in the same **[+0.20, +0.90]** window —
   the reversal disappears: median 3-session change **+0.040** (post, n = 86) vs **−0.120** (normal,
   n = 1,591), and **43.0%** give back more than half the jump within three sessions against **46.4%**
   normally. **Stale marks unwind; this does not.** That is the third of the sibling's three candidate
   mechanisms weakened.

7. **All of it collapses into ONE law — SUPPORTED, and it subsumes the ordinary Monday.** Drop the
   holiday/non-holiday split entirely and regress on calendar days:

   ```
   ΔVIX = −0.322 + (−114.42)·ret + 0.254·(calendar days since last session)
            se 0.021          se 0.95        se 0.0126,  t = 20.17,  n = 8,459
   ```

   In log form, **+1.297% of VIX per calendar day** (t = 22.50). The model-free buckets trace the same
   curve, and the third row is the punchline:

   | Calendar days elapsed | n | mean residual ΔVIX | median | VIX-up |
   |---|---|---|---|---|
   | 1 (ordinary Tue–Fri) | 6,625 | −0.113 | −0.117 | 41.9% |
   | **2 (the day after Thanksgiving lives here)** | **80** | **+0.323** | +0.240 | **55.0%** |
   | 3 (ordinary Monday) | 1,530 | +0.359 | +0.342 | 61.1% |
   | 4 (Tuesday after a Monday holiday) | 221 | +0.770 | +0.673 | 76.0% |

   The ordinary weekend is not a control for this effect — **it is the 3-day dose of it.**

8. **Dose-matched, the day after Thanksgiving is not anomalous — SUPPORTED, and it retires the 2026
   sibling's one surviving deviation.** Against *other* two-calendar-day reopenings (n = 47; 15 in
   December, 15 in January, 14 in July, 3 elsewhere):

   | Comparison set | VIX up | rate | median ΔVIX |
   |---|---|---|---|
   | Day after Thanksgiving | 18 / 33 | **54.5%** | +0.060 |
   | Other 2-calendar-day reopenings | 26 / 47 | **55.3%** | +0.130 |
   | *(the 2026/2027 base: ordinary Friday, 1 day)* | — | *35.9%* | — |
   | *(ordinary Monday, 3 days)* | — | *61.1%* | — |

   **P(≥18 | n=33, p=0.553) = 0.61.** Dead on the null. The 2026 ledger's p = 0.025 came from comparing
   a two-calendar-day reopening against a one-calendar-day base; the 2027 ledger's 70.5% pools all
   doses and therefore *overstates* this particular session. An ordinary Monday is a hotter VIX-up bet
   than Black Friday is.

9. **The THINNESS is not a dose effect and stays fully intact — SUPPORTED, re-derived not inherited.**
   SPY volume ÷ its own trailing-20-session median: day after Thanksgiving **0.429×** (n = 33, 27 under
   0.70×), against **0.797×** for other two-calendar-day reopenings, **0.883×** for ordinary Mondays and
   **0.995×** across all sessions. Range ÷ trailing-20 median is **0.542×**, under 0.70× in only 21 of
   33. So the session is genuinely, uniquely thin — that comes from the 3.5 hours, not the closure —
   while its vol behaviour is ordinary for its dose. **Two claims about one session, and only one of
   them survives.**

10. **2028 has two early closes and nine holidays — SUPPORTED, new here, and it inverts 2027's
    structural leg.** The NYSE grid's three early-close footnotes resolve for 2028 to exactly two
    dates: \*\* is **Monday July 3, 2028** (Independence Day falls Tuesday July 4) and \*\*\* includes
    **Friday November 24, 2028**; \*\*\*\* is 2026 only. Christmas Day 2028 is a **Monday** and carries
    no footnote. And footnote \* reads *"Because the holiday falls on Saturday, January 1, 2028, no New
    Year's Day holiday is observed"* — so 2028 runs **nine** NYSE holidays, not ten. Where the 2027
    sibling's structural finding was *"the only early close of the year, no rehearsal,"* this instance
    has a rehearsal five months ahead of it, proposed here as `independence-day-half-day-2028-07-03`.
    On the sibling's own measurements July 3 is the least thin of the three half-session classes
    (0.584× against 0.429× and Dec 24's 0.367×), which makes it an honest calibration point rather
    than a proxy.

11. **The bond side is NOT claimable for 2028 — recorded as a limit, not worked around.** SIFMA's page
    returned HTTP 200 and its payload parses; it simply stops at 2027. Its Thanksgiving cards name
    *"Thursday, November 26, 2026 || Friday, November 27, 2026 — Early Close (2:00 p.m. Eastern Time)"*
    and the same shape for 2027, and the string `2028` appears 5 times, every one inside a "New Year's
    Day 2027/2028" heading. **SIFMA publishes two years forward where NYSE publishes three.** This is
    the inverse of the 2027 sibling's correction, where the data was present but unrendered — here it
    is genuinely absent, so no 14:00 ET overhang is asserted for 2028-11-24.

12. **The corridor is the emptiest on this calendar — SUPPORTED, checked mechanically.** Run over all
    **942** tracked entries (canonical + proposals): within ±5 days of 2028-11-24 there is exactly one
    other event, its own closure sibling `thanksgiving-market-closure-2028-11-23`; within ±45 days,
    only `presidential-election-2028-11-07` (D−17) and `fed-board-closure-2028-11-10` (D−14).
    2028-11-24 is the **furthest-out date this calendar tracks at all**. Four full sessions separate
    the half day from month-end (11-27 → 11-30), against one in 2026 and two in 2027 — so November
    rebalancing is nowhere near it in either direction.

13. **The election-year subsample is underpowered and is recorded as a NON-finding.** The eight
    election-year instances (1996, 2000, 2004, 2008, 2012, 2016, 2020, 2024) print VIX up **3 of 8**,
    median ΔVIX **−0.130**, median SPY return **+0.496%** against **+0.062%** for the other 25 — the
    opposite direction to the dose law, on n = 8. That is what n = 8 looks like. It is written down so
    a later session finds it already tested rather than rediscovering it as a signal, and **nothing is
    registered on it.**

14. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.**
    `grep -icE 'holiday|half.day|early close|thanksgiving|black friday'` over
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` returns **0 and 0**, run
    this session. No playbook can fire on this date in either direction.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate`, and no playbook keys on it. The
supported outputs are the guards already listed — and the one that actually changes how future sessions
read a tape is a **correction, not an addition**: a VIX uptick on a day-after-Thanksgiving session is a
**~55%** base rate, the same as any other two-calendar-day reopening and *lower* than an ordinary
Monday's 61%. Anywhere the 36% ordinary-Friday base or the 70.7% pooled post-holiday rate is quoted for
this session, it is the wrong number.

### Honest limits

- **The dose law is measured, not derived from the VIX formula.** Legs 3–7 eliminate return-driven
  repricing and stale-mark unwinding and leave a day-count convention as the best surviving
  explanation, but no SPX option chain was pulled and no term of Cboe's calculation was inspected. This
  is inference to the best explanation from daily bars — stronger than the sibling's "no mechanism," and
  still not a verification.
- **The 4-extra-day cell is n = 3.** Leg 4's monotonicity rests on the 1-day (n = 139) and 3-day
  (n = 162) rows; the top row is decoration and carries no weight.
- **The dose buckets are not independent of season.** Two-calendar-day reopenings cluster in December,
  January and July; the weekday-matched control handles day-of-week but not month. A December
  volatility seasonal would contaminate both the treatment and its control here, which blunts rather
  than reverses leg 8.
- **The historical half-session regime is assumed, not sourced** — the same limit the 2027 sibling
  recorded. NYSE publishes early closes for 2026–2028 only; applying the rule back to 1993 is
  inference, corroborated by leg 9's volume ratios but not cited.
- **The bond and options closes for 2028 are unknown, not assumed.** SIFMA stops at 2027 and Cboe
  publishes no 2028 schedule. The 2026 and 2027 instances both had a 14:00 ET fixed-income close; this
  one may or may not, and this ledger does not guess.
- **Data-emptiness is untested at this horizon.** Neither Census nor BLS publishes a 2028 release
  calendar today, so whether an 8:30 a.m. print lands on 2028-11-24 — the 2026 sibling's load-bearing
  find — cannot be checked either way. Not asserted, not denied.
- **Every event in this corridor is `estimate`,** including this one, its closure sibling, the election
  and the July proposal filed with it. Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-09):** stand aside, permanently — this document holds a **retraction, a law and four
guards**, not a view. Concretely: (a) **the Black Friday vol anomaly is retired as a dose error.**
Against the correct control — other two-calendar-day reopenings — the day after Thanksgiving runs
**18/33 (54.5%)** against **26/47 (55.3%)**, **P = 0.61**. The [2026 sibling's](thanksgiving-half-day-2026-11-27.md)
p = 0.025 compared a two-day reopening to a one-day base; the [2027 sibling's](thanksgiving-half-day-2027-11-26.md)
70.5% pools all doses and overstates this session. (b) **The replacement is one law:** return-controlled,
**+0.254 VIX points per calendar day** the market is shut (t = 20.2, n = 8,459), monotone across buckets
at −0.113 / +0.323 / +0.359 / +0.770, subsuming the ordinary Monday as its three-day case. (c) **Three
mechanisms are now discriminated, not merely listed** — the shift is not return-driven (leg 3, including
on an open-to-close basis), has no pre-holiday mirror (leg 5), and does not revert against a matched-jump
control (leg 6); a day-count convention is the only survivor, and it is inference, not verification.
(d) **The thinness survives untouched and is the one Thanksgiving-specific effect** — volume **0.429×**
against **0.797×** for the dose-matched control. (e) **2028 inverts 2027's structure:** two early closes,
nine holidays, and a July 3 rehearsal. (f) **The bond and options closes are unsourced for 2028** —
SIFMA stops at 2027, Cboe has no 2028 schedule. Every statement carries the event's **`estimate`** label.

**Kill switches:**

- **The dose coefficient re-fit on bars through 2027-11-30 lands outside [0.15, 0.36] or loses
  significance (t < 3)** — the law this whole stance rests on fails out of sample and both siblings'
  framings are restored. Registered as **FT-thanksgiving-half-day-2028-11-24-1**, score by 2027-11-30.
- **The next three day-after-Thanksgiving sessions behave like a different dose** — mean return-controlled
  residual above **+0.70** (the 4-day bucket) or below **−0.10** (the 1-day bucket) across 2026-11-27,
  2027-11-26 and 2028-11-24. Registered as **FT-thanksgiving-half-day-2028-11-24-2**, score by 2028-11-30.
- **SPY's 2028-11-24 volume comes in at or above 0.70× its trailing-20-session median** — the one claim
  that survived this session fails on the instance that matters. Registered as
  **FT-thanksgiving-half-day-2028-11-24-3**, score by 2028-11-30.
- **SIFMA publishes a 2028 US panel** — the bond-side unknown closes and the 14:00 ET overhang either
  becomes a sourced guard for 2028 or is affirmatively absent.
- **Cboe publishes a 2028 options holiday schedule** — the unsourced-options-close guard either retires
  or hardens into the 2026 sibling's 15-minute split.
- **NYSE republishes its hours page with a third 2028 early close, or without 2028-11-24** — leg 10 and
  the "two early closes, one rehearsal" framing both go, and the calendar entry is amended, not deleted.
- **A house playbook keyed to holiday-shortened sessions is written and back-tested** — leg 14 goes stale
  and the stand-aside is re-argued on measured data rather than on absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 807 | **Initial research**; canonical `<id>.json` written, promoting the `from-presidential-election-2028-11-07` proposal. **Hours re-read from NYSE** (13:00 equities, 13:15 eligible options; 2028 named verbatim in footnote \*\*\*) — stays `estimate` on the taxonomy gap (#2552). **Load-bearing measurement (SPY+VIX bars re-fetched, caches busted, n=8,459):** the sibling ledgers' vol claim is a **dose error**. Return-controlled, ΔVIX rises **+0.254 pts per calendar day** the market is shut (t = 20.2), monotone at **−0.113 / +0.323 / +0.359 / +0.770** for 1/2/3/4 days — the ordinary Monday is the 3-day case of the same curve. The day after Thanksgiving is a **2-day** reopening and against other 2-day reopenings is **dead on the null: 18/33 (54.5%) vs 26/47 (55.3%), P = 0.61**; the 2026 base (ordinary Friday, 35.9%) was one dose too low and the 2027 pooled rate (70.7%) is too high. Mechanism narrowed, not just named: **not return-driven** (SPY-up post-holiday sessions still 45.5% VIX-up vs a 19.0% base, p ≈ 7e-14; holds on an open-to-close basis), **no pre-holiday mirror** (119/304, 39.1% vs 40.4%, P = 0.34, widened from the sibling's n=50), **no reversal** against a matched-jump control (43.0% vs 46.4% give-back). **Thinness survives and is the only Thanksgiving-specific effect:** volume **0.429×** vs **0.797×** for the dose-matched control, **0.883×** for Mondays. **New structure:** 2028 has **two** early closes (Jul 3, Nov 24) and **nine** holidays (New Year's Day 2028 is a Saturday, not observed) — inverting 2027's "only early close, no rehearsal". Adjacency — peers n/a (`symbols: []`); macro: no 2028 Census/BLS calendar exists, data-emptiness untestable; VIX **16.05** (close 2026-09-09); geopolitical: none dated; tape: corridor is the emptiest tracked (±5 days holds only its closure sibling; ±45 days adds only the election at D−17 and `fed-board-closure-2028-11-10`), 4 full sessions to month-end. **SIFMA has no 2028 panel** (HTTP 200, payload stops at 2027) and **Cboe none either** (`2028` appears 0×) → bond and options closes unsourced for 2028, unlike 2027. Election-year subsample **3/8 VIX-up** recorded as an explicit **non-finding** (n=8). Proposes `independence-day-half-day-2028-07-03` (`estimate`) — the year's other early close and this one's only rehearsal. | Initial stance set: **stand aside** (structural row only), and the 2026 sibling's surviving deviation is **retired as a dose artifact**. Registers **FT-thanksgiving-half-day-2028-11-24-1**, **-2** and **-3**. | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-thanksgiving-half-day-2028-11-24.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
