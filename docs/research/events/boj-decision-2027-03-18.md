# Bank of Japan MPM decision (MPM Mar 17-18, 2027 — no Outlook Report) — boj-decision-2027-03-18

**Kind:** macro-print · **Date:** 2027-03-18 (estimate, NEWS: boj.or.jp "Monetary Policy Meetings" schedule page (en/mopo/mpmsche_minu/), raw HTML re-fetched HTTP 200, 41,959 bytes and column-parsed independently by this session on 2026-09-05 — the 2027 table's second row parses as `["Mar. 17 (Wed.), 18 (Thurs.)", "-", "Mar. 29 (Mon.)", "May 7 (Fri.)"]` against the header "Date of MPM | Outlook Report (The Bank's View) | Summary of Opinions | MPM Minutes", so the empty Outlook column is the primary evidence this is NOT an Outlook Report meeting; filed estimate because the confirmed-prefix taxonomy has `FED:` and no slot for any other central bank, and this lane may not self-confirm an event it discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.32,"daysBand":"medium:31+","adjacentIds":["fomc-2027-03-17","japan-cpi-2027-03-19","opex-2027-03-19"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and stop treating "no Outlook Report" as "the quiet meeting."** Four
sibling ledgers ([09-18](boj-decision-2026-09-18.md), [10-30](boj-decision-2026-10-30.md),
[12-18](boj-decision-2026-12-18.md), [01-22](boj-decision-2027-01-22.md)) frame the BoJ as a rate
question with no channel to a US AI book, and the January one calls this venue a lesser one. This
session parsed the primaries itself and found the opposite structure. **(1) The FOMC concludes
~9 hours earlier, carrying the first SEP of 2027** — the Fed's own calendar, parsed today, puts the
March 2027 meeting at **Mar 16-17\*** with the asterisk defined on the page as a Summary of Economic
Projections; 14:00 ET on 3/17 is **03:00 JST on 3/18**, so the BoJ's second deliberation day begins
after it. Our calendar had **no entry within ±5 days**; this PR files three. **(2) The absence of an
Outlook Report is not evidence of a small meeting** — March never carries one (Outlooks are
Jan/Apr/Jul/Oct), yet **3 of the last 9 March MPMs changed policy or framework**, including the
2024-03-19 NIRP exit and the 2021-03-19 framework assessment, both read off the Bank's own release
archives today. **(3) The FX bracket that had real power in January has none here** — re-running the
sibling method on the Fed's H.10 fixing across **nine March decisions, 2018-2026, 0 of 9** cleared
±2.0%, and no March decision day exceeded **1.41%**. **(4) This event's own calendar notes call it
the best-informed 2027 venue on wages; the cycle they cite says otherwise** — Rengo's 2026 first
tally landed **2026-03-23**, four days *after* that year's decision. Date is **estimate**; it widens
caution and licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing here is ours to hold | High | `symbols: []`, no house playbook is rates- or FX-keyed, and at D-194 — the longest horizon of any BoJ ledger — there is no position this event could be sized into | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05 → 2027-03-17** that the tape attributes to a BoJ headline — the "no price channel" premise would be wrong and this doc is rebuilt |
| This week | **Stand aside; the live BoJ question this week is 09-18, not 03-18** | High | Four prior decisions and January's Outlook stand in front of this one, and Ueda said on **2026-09-02** that the board will decide **09-17/18** "with upside price risks in mind" — nothing in the 09-07 → 09-11 tape is 03-18-keyed | Any BoJ communication before **2026-09-11** naming **March 2027** specifically as a venue, or the BoJ moving the Mar 17-18 MPM — the whole scaffold below is re-derived early |
| This month | **Watch the sequence, not the level** — the FOMC now sits one day in front of this decision | Medium | The Fed's own 2027 calendar (parsed **2026-09-05**) puts its first-SEP meeting at **Mar 16-17**, concluding 03:00 JST on the BoJ's decision day; that ordering is the durable finding, the rate path is not | The Fed moving its March 2027 meeting off Mar 16-17 — its own page calls every 2027 date tentative until the preceding meeting confirms it. Observe by **2027-01-27**, when the January FOMC confirms the March slot |
| This quarter | **Do not price this as the lesser venue for being Outlook-free** | Medium | March carries no Outlook Report by construction, yet 3 of the last 9 March MPMs changed policy or framework — including the two largest regime moves of the era (2024-03-19, 2021-03-19) | The BoJ **not** changing the guideline for money market operations at the **2027-03-18** decision. Registered as **FT-boj-decision-2027-03-18-3**, score by 2027-03-19 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to the 2027-03-18 decision or to the 03-18 US session.
- **The finding that matters most (sequence)** — the **FOMC's first-SEP meeting of 2027 concludes
  2027-03-17 at 14:00 ET = 03:00 JST 2027-03-18**, hours before this decision, per
  [the Fed's own calendar](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) parsed
  today. Filed as [`fomc-2027-03-17`](fomc-2027-03-17.md) (estimate) in this PR.
- **The measurement that makes the sequence expensive** — on the Fed's H.10 **noon-ET** USD/JPY
  fixing (FRED `DEXJPUS`) a single bar spans noon 3/17 → noon 3/18 and therefore contains **both**
  central banks. The two decisions are **not separable on this series**.
- **The 2026 analogue is exact, and it was measured** — FOMC **2026-03-18** then BoJ **2026-03-19**,
  the same +1 ordering. That combined bar moved **-0.81%**, the largest of any March BoJ decision day
  outside 2020 and 2023, with two decisions inside it.
- **The bracket test is dead at this venue** — across **nine** March decisions (2018-2026) on the Fed
  series, **0 of 9** brackets cleared ±2.0% and no decision day exceeded **1.41%** (2020-03-16, the
  COVID emergency meeting). The [01-22 ledger](boj-decision-2027-01-22.md) measured **3 of 5** for
  2026's meetings — so this is meeting-type, not method.
- **And the quiet is decision-specific, not seasonal** — March daily sd since 2018 is **0.601%**
  against **0.559%** for the whole sample. March is a *more* volatile month; BoJ March decisions are
  the calm inside it.
- **"No Outlook Report" ≠ low stakes** — the Bank's own release archives, parsed today: **2024-03-19**
  NIRP exit + YCC abolition, **2021-03-19** framework assessment, **2020-03-16** emergency easing.
  Three regime moves at Outlook-free March meetings in nine years.
- **The correction this ledger books against its own calendar entry** — the notes on
  `boj-decision-2027-03-18` call March the **best-informed 2027 venue on wages**. The cycle they cite
  refutes it: Rengo's 2026 first tally was **2026-03-23**, four days *after* the 2026-03-19 decision.
  Base rate 2024/2025/2026: **2 of 3** before. Registered as **FT-boj-decision-2027-03-18-2**.
- **Worst-informed on prices, and the schedule ends there** — Japan's **February-2027** national CPI
  releases **2027-03-19**, one day after; it is the **last row** the Statistics Bureau's published
  table carries, on a page stamped `Last Update : 23 January 2026`. Filed as
  [`japan-cpi-2027-03-19`](japan-cpi-2027-03-19.md) (estimate) in this PR.
- **The corridor is dense, not empty — the inverse of January's limit** — FOMC + first SEP
  **2027-03-17** → BoJ **2027-03-18** → Japan CPI 08:30 JST **and** US quarterly triple witching
  **2027-03-19** (third Friday, computed today). Four dated events in three sessions.
- **The regime input no BoJ ledger here carries** — a **US Treasury public pressure campaign**.
  Bessent met Ueda at the Asheville G20 on **2026-09-01** (Japan Times photo caption, fetched today);
  wire coverage **2026-08-31 → 09-02** reports him urging hikes with JGB 10y near **3%**, a level
  last seen in **1996**.
- **Watch (dated)** — BoJ decision **2026-09-18** (est) · **2026-10-30** (est, Outlook) ·
  **2026-12-18** (est) · Japan Dec CPI + BoJ decision + Outlook **2027-01-22** (est) · **FOMC
  2027-01-27** (est, confirms the March slot) · FOMC blackout start **2027-03-06** (derived) ·
  **FOMC + first SEP 2027-03-17** (est, proposed here) · **this decision 2027-03-18** (est) · Japan
  Feb CPI + US triple witching **2027-03-19** (est, both proposed here) · this meeting's SoO
  **2027-03-29**, Minutes **2027-05-07** · Japan FY2026 ends **2027-03-31** · food consumption-tax
  cut effective **2027-04-01** (est) · first post-cut Outlook **2027-04-28** (est).

## Initial research

### The question, plainly

Four sibling ledgers have answered the standing BoJ questions for this book: the yen carry channel
is not live enough to matter ([09-18](boj-decision-2026-09-18.md)), a conditional scaffold is the
right shape when an earlier event sets the distribution ([10-30](boj-decision-2026-10-30.md)),
December is the consensus's deadline rather than its date ([12-18](boj-decision-2026-12-18.md)), and
January carries a same-day CPI print, a fiscal shock landing on the fiscal year it must project, and
an AI-to-CPI channel running toward the Bank rather than from it
([01-22](boj-decision-2027-01-22.md)). None of that is re-litigated here, and this session
deliberately does **not** re-derive a rate consensus at D-194, where a survey read is worth almost
nothing.

The January ledger left this venue a one-line character sketch — worst-informed on CPI, best-informed
on wages — and the calendar entry inherited it verbatim. So this entry's question is narrow and
testable: **does the character sketch survive its own primaries, and what does the March venue carry
that the January analysis could not see?**

**One-line verdict: the CPI half survives and the wages half does not; and the fact that dominates
both — the FOMC's first-SEP meeting of 2027 concluding nine hours before this decision — was in
neither the ledger nor the calendar, which had no tracked event within ±5 days at all.** The stance
is unchanged (stand aside, no position). What changes is that this venue is now the *contaminated*
one rather than the *quiet* one, and the sibling FX test that had real power in January has none
here.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md).
Primaries fetched raw and parsed by machine today (2026-09-05), not read through a summarizer: the
**BoJ MPM schedule** (HTTP 200, 41,959 bytes, both year tables parsed cell-by-cell); the **Fed's
FOMC calendar** (HTTP 200, 164,831 bytes, every year panel 2021-2027 parsed); the **Statistics
Bureau CPI release schedule** (HTTP 200, 13,839 bytes, its single table parsed row-by-row); the
**BoJ's own Monetary Policy Releases archives for 2018-2025** (eight pages, HTTP 200, each table
parsed for policy-statement rows). Price work is this session's own: USD/JPY from the Federal
Reserve's H.10 noon-ET fixing (FRED `DEXJPUS`, 13,951 bars 1971-01-04 → 2026-08-28) and VIX from
CBOE via FRED (`VIXCLS`, through 2026-09-03), fetched as CSV and computed locally — the series the
[01-22 ledger](boj-decision-2027-01-22.md) established, used here so its numbers and these are
comparable. No instrument scripts: `symbols: []`, there is no issuer, and
`earnings-cycle.mjs`/`intraday-edges.mjs` have no macro mode. Adjacency computed mechanically
against the live calendar with `event-material-decide.mjs`'s own ±5-day window.

### Conviction legs, tested

1. **The FOMC's first-SEP meeting of 2027 concludes ~9 hours before this decision — SUPPORTED,
   primary, and it is the single most useful fact in this document.** The Fed's
   [FOMC calendar](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm), fetched raw and
   parsed today, gives the 2027 panel verbatim as `January 26-27 | March 16-17* | April 27-28 |
   June 8-9* | July 27-28 | September 14-15* | October 26-27 | December 7-8*`, with the page's own
   footnote `* Meeting associated with a Summary of Economic Projections`. So the March 2027 FOMC
   concludes **2027-03-17** and carries the **first SEP of the year** — the first published dot plot
   since December 2026. The statement lands 14:00 ET, which is **03:00 JST on 2027-03-18**: the BoJ
   board's second deliberation day *starts* after it, and the midday-JST announcement follows by
   about nine hours. Our calendar had **zero** tracked events within ±5 days of 2027-03-18 before
   this PR; filed as [`fomc-2027-03-17`](fomc-2027-03-17.md), estimate. The Fed's page states every
   2027 date is tentative until confirmed at the preceding meeting, which is why it is an estimate
   and why the [`fomc-2027-01-27`](fomc-2027-01-27.md) meeting is the dated observation that
   promotes or kills it.

2. **On the Fed's own USD/JPY fixing the two decisions are inseparable — SUPPORTED, measured, and it
   is a constraint on what this venue can even register.** `DEXJPUS` is a **noon-ET** fixing, so its
   2027-03-18 bar spans noon 3/17 → noon 3/18 and contains the FOMC statement (14:00 ET 3/17) *and*
   the BoJ announcement (midday JST 3/18). There is no decomposition on this series. The 2026
   analogue is exact and was measured here: FOMC **2026-03-18**, BoJ **2026-03-19**, the same +1
   ordering, and that combined bar moved **-0.81%** — the largest March BoJ decision-day reading
   outside 2020 (-1.41%) and 2023 (-1.00%), with two central banks inside it. The
   [01-22 ledger](boj-decision-2027-01-22.md)'s discipline — *name the series* — is necessary but
   not sufficient here; at this venue a test must also name the confound, which is why
   **FT-boj-decision-2027-03-18-1** states it in the hypothesis rather than in a footnote.

3. **The March BoJ meeting is chronically FOMC-contaminated, and 2027 replicates 2026 exactly —
   SUPPORTED, primary, from a single parse.** Signing the gap as BoJ-minus-FOMC across the seven
   years the Fed's page covers:

   | Year | FOMC statement | BoJ decision | Gap (days) |
   |---|---|---|---|
   | 2021 | 03-17\* | 03-19 | +2 |
   | 2022 | 03-16\* | 03-18 | +2 |
   | 2023 | 03-22\* | 03-10 | -12 |
   | 2024 | 03-20\* | 03-19 | -1 |
   | 2025 | 03-19\* | 03-19 | 0 |
   | 2026 | 03-18\* | 03-19 | +1 |
   | 2027 | 03-17\* | 03-18 | +1 |

   **Six of seven fall within ±2 calendar days; three of seven within ±1; every one carries the SEP
   asterisk.** BoJ dates are the Bank's own (2021-2025 from its release archives, 2026-2027 from its
   schedule page). This is not a 2027 coincidence — it is the structural reason a "clean" March
   attribution has essentially never existed, and it makes leg 5's null harder to interpret than the
   equivalent null at any other venue.

4. **"No Outlook Report" is not evidence of a low-stakes meeting — REFUTED as a reading, and this is
   the correction that matters most for how the next pulses treat this date.** The BoJ's schedule
   table shows `-` in this row's Outlook column (Outlook Reports are January, April, July, October
   — March never has one). It would be natural to read that as the lesser venue; the Bank's own
   [Monetary Policy Releases archives](https://www.boj.or.jp/en/mopo/mpmdeci/), 2018-2025, parsed
   today for policy-statement rows, say otherwise:

   | March MPM | Outcome |
   |---|---|
   | 2018-03-09 | Statement on Monetary Policy (hold) |
   | 2019-03-15 | Statement on Monetary Policy (hold) |
   | **2020-03-16** | **Enhancement of Monetary Easing** (COVID emergency, meeting moved up) |
   | **2021-03-19** | **Further Effective and Sustainable Monetary Easing** (framework assessment) |
   | 2022-03-18 | Statement on Monetary Policy (hold) |
   | 2023-03-10 | Statement on Monetary Policy (Kuroda's last, hold) |
   | **2024-03-19** | **Changes in the Monetary Policy Framework** (NIRP exit, YCC abolished) |
   | 2025-03-19 | Statement on Monetary Policy (hold) |
   | 2026-03-19 | Statement on Monetary Policy (hold) |

   **Three of nine changed policy or framework, and they include the two largest regime moves of the
   era.** The Outlook Report is a projection vehicle, not a permission slip. **The corollary cuts the
   other way too, and it is the sharper half:** because there is no Outlook here, this meeting
   **cannot re-frame FY2027 projections** — so the food-tax-cut footnote fork that the
   [01-22 ledger](boj-decision-2027-01-22.md) registered as its FT-1 is **not resolvable at this
   venue**. It resolves at January (Jan 21-22) or at April (Apr 27-28), and this meeting can only
   *act*. That is the same shape as [`fomc-2027-01-27`](fomc-2027-01-27.md)'s "no SEP, so it can only
   act on the dots," one central bank over.

5. **The FX bracket test has essentially no power at March venues — SUPPORTED, measured, and it
   inverts the sibling result.** Re-running the [01-22 ledger](boj-decision-2027-01-22.md)'s own
   method (largest single close-to-close move in the D-1 → D+2 window) on the Fed's H.10 fixing,
   across every March BoJ decision 2018-2026:

   | Decision | Decision-day move | D-1 → D+2 largest session | Clears ±2.0%? |
   |---|---|---|---|
   | 2018-03-09 | +0.62% | +0.62% (03-09) | no |
   | 2019-03-15 | -0.13% | -0.14% (03-18) | no |
   | 2020-03-16 | **-1.41%** | +1.68% (03-17) | no |
   | 2021-03-19 | -0.11% | -0.17% (03-22) | no |
   | 2022-03-18 | +0.61% | +1.27% (03-22) | no |
   | 2023-03-10 | -1.00% | -1.42% (03-13) | no |
   | 2024-03-19 | +1.07% | +1.07% (03-19) | no |
   | 2025-03-19 | +0.35% | -0.79% (03-20) | no |
   | 2026-03-19 | -0.81% | -0.81% (03-19) | no |

   **0 of 9 clear ±2.0%. No March decision day in nine years exceeded 1.41%, and that one was the
   COVID emergency meeting.** The single most consequential BoJ decision in seventeen years — the
   **2024-03-19** NIRP exit — moved this fixing **1.07%** and never approached the threshold, because
   it was fully pre-signalled (leg 4's own sources describe the March 2024 move being telegraphed
   from 03-08 onward). Against the January ledger's **3 of 5** for 2026's meeting set, this is a
   meeting-type effect, not a method artefact. **Practical consequence:** where the January venue's
   bracket test is a genuine coin flip, the same test here is a near-certain pass — which is exactly
   why **FT-boj-decision-2027-03-18-1** is registered as the *null* and framed as a weak test rather
   than dressed up as a finding.

6. **And the calm is decision-specific, not a March seasonal — SUPPORTED, measured, and it is the
   check that keeps leg 5 honest.** The obvious objection to 0/9 is that March is simply a quiet
   month. It is not: on the same series since 2018, March sessions have a daily sd of **0.601%**
   (n=198) against **0.559%** for all sessions (n=2,163). March is *more* volatile than the average
   month; BoJ March decisions are the calm inside it. Trailing 60-session sd is **0.511%** and the
   ≥2.0% tail counts are **3/166 in 2026, 2/250 in 2025, 5/251 in 2024** — replicating the
   [01-22 ledger](boj-decision-2027-01-22.md)'s numbers exactly, as they should, since it is the
   same series.

7. **This event's own calendar notes overstate its wage information, and the cycle they cite is the
   evidence against them — MIXED, corrected, and registered rather than asserted.** The notes on
   `src/domain/market-events/boj-decision-2027-03-18.json` (written during the January research)
   read: *"It is the BEST-informed 2027 meeting on wages: Rengo's shunto first tally has landed
   mid-March in recent cycles (2026: demand 5.94% reported 2026-03-02, result 5.26% reported
   2026-03-23)."* The parenthetical refutes the sentence. **2026-03-23 is four days after the
   2026-03-19 decision.** The three-cycle base rate:

   | Cycle | Concentrated reply day | Rengo first tally | March MPM decision | Tally before? |
   |---|---|---|---|---|
   | 2024 | 03-13 | **03-15** (5.28%) | 03-19 | yes |
   | 2025 | 03-12 | **03-14** (>5%) | 03-19 | yes |
   | 2026 | 03-18 | **03-23** (5.26%) | 03-19 | **no** |

   **2 of 3** — and the one that failed is the most recent. The reply day is not on a fixed calendar
   rule (2024-03-13, 2025-03-12, 2026-03-18 are all Wednesdays, in different weeks of the month), and
   **no 2027 reply day is published**. Note the real nuance, because it is what keeps this MIXED
   rather than REFUTED: in 2026 the reply day fell on **day 1 of the MPM**, so the board saw
   reply-day headlines — major firms accepting demands in full — even without Rengo's aggregate. The
   2027 MPM (Mar 17-18) sits a week earlier in the month than 2026's, so the same alignment is
   plausible and so is a clean miss. **The honest statement is that wage information at this venue is
   a coin flip on a date nobody has published**, not "best-informed." Registered as
   **FT-boj-decision-2027-03-18-2**.

8. **The CPI half of the sketch does survive, and the schedule's own last row is where it sits —
   SUPPORTED, primary.** The Statistics Bureau's
   ["Schedule of Release"](https://www.stat.go.jp/english/data/cpi/1582.html), parsed cell-by-cell
   today, ends at row 16: `["February", "March 19", "March", "March 26", "2026 fiscal yearly average
   of Ku-area of Tokyo"]`. So the **February-2027 national CPI releases 2027-03-19**, one day after
   this decision, and the board rules on **January data released 2027-02-19** (row 15). On prices,
   January 2027 is the best-informed venue of the year and this is the worst — the January ledger's
   claim, independently reproduced from the same table by a different session. Two things it did not
   record. First, **this is the final row the published table carries**, so both the confirming and
   the killing observation live on a page whose own stamp reads `Last Update : 23 January 2026` —
   ~19 months stale at fetch. Second, the page this session retrieved is **13,839 bytes** against the
   **2,823** the January ledger records for the same URL on the same day; the parsed rows are
   consistent, so nothing here is in doubt, but the discrepancy is worth a note for whoever diffs
   these next. Filed as [`japan-cpi-2027-03-19`](japan-cpi-2027-03-19.md), estimate.

9. **The corridor is dense, and that is the exact inverse of the January ledger's limit —
   SUPPORTED, from this calendar's own entries plus arithmetic done today.** Before this PR,
   `event-material-decide.mjs`'s ±5-day window returned **nothing** — not one tracked event beside
   this one. The January ledger found one and correctly warned that an empty corridor past 2026 is a
   thin-calendar artefact, not quiet. It is worth stating plainly that this session tested that
   warning and it was right: three of the four events now in the window were discoverable from
   primaries in one sitting. The corridor as filed:

   | Date | Event | Status |
   |---|---|---|
   | 2027-03-17 | FOMC decision + first SEP of 2027 | estimate (proposed here) |
   | **2027-03-18** | **this decision** | estimate |
   | 2027-03-19 | Japan February national CPI, 08:30 JST | estimate (proposed here) |
   | 2027-03-19 | US quarterly options expiration (triple witching) | estimate (proposed here) |

   The opex date is the third Friday of March 2027, computed mechanically today; it is filed
   **estimate**, not confirmed, because theocc.com returned **HTTP 403** to this runner and the
   sibling opex entries carry an `OCC:` source that was not obtained. **Four dated events in three
   sessions** — and the attribution rule that falls out is stricter than January's: a 2027-03-19 US
   tape move has an opex explanation, a Japanese-CPI explanation and a two-central-bank explanation
   before it has a BoJ one.

10. **This is the last MPM of FY2026 and the last before the food-tax cut takes effect, and it can
    do nothing about either — SUPPORTED, and it is a structural limit rather than a catalyst.**
    Japan's FY2026 ends **2027-03-31**; the 8%→1% food consumption-tax cut the
    [01-22 ledger](boj-decision-2027-01-22.md) documents takes effect **2027-04-01**
    ([`japan-food-tax-cut-2027-04-01`](japan-food-tax-cut-2027-04-01.md), estimate, still pending
    Diet passage as of that ledger's 2026-08-07 source). So this meeting is the last venue before a
    mechanical CPI shock the January ledger sizes at roughly 1.0-1.4pp — and, per leg 4, the one
    venue in the sequence with no projection vehicle to address it. The first post-cut Outlook is
    **2027-04-28** ([`boj-decision-2027-04-28`](boj-decision-2027-04-28.md), estimate). One dated
    item moved since the January ledger's fiscal leg and is recorded as a headline only: the Japan
    Times "Latest News" rail, read on the page fetched today (**2026-09-05**), carries *"Government
    may fully cover local losses from consumption tax cut"*, timestamped ~6 hours before the fetch.
    **The body was not read** — it is a lead for the next pulse, not evidence.

11. **A US Treasury pressure campaign is now an input to the BoJ's reaction function — MIXED on
    sourcing, and no BoJ ledger here carries it.** The four siblings frame the political constraint
    as domestic (Takaichi as a deterrent; the 12-18 ledger's 59%-of-52 survey; the January ledger's
    August counter-evidence). A different actor has appeared. The Japan Times piece this session
    fetched in full carries, as its own photo caption, verbatim: *"U.S. Treasury Secretary Scott
    Bessent meets with Bank of Japan Gov. Kazuo Ueda on the sidelines of a Group of 20 finance
    ministers' and central bankers' meeting in Asheville, North Carolina, on Tuesday"* — i.e.
    **2026-09-01**, dated and primary to the fetched page. Around it, search-surfaced wire coverage
    **2026-08-31 → 2026-09-02** reports Bessent publicly urging BoJ hikes (Reuters' own summary:
    his comments *"effectively lock the bank into doing so"*), a Bloomberg framing of a *"no-win
    situation,"* and a CNBC report of Japan's 10-year JGB yield touching **3% for the first time
    since 1996** amid a weak yen. **Honest weakness, and it is the same wall the January ledger hit:
    bloomberg.com, cnbc.com and idnfinancials.com all returned 403 to this runner, so everything
    beyond the caption is a headline plus a syndicated summary, not a body this session read.** What
    survives that discount is still material: the Bessent–Ueda meeting is confirmed and dated, and
    an externally-pressured normalization is a *global duration* story rather than a yen-carry one —
    which is a different second-order channel from the one the siblings tested, and one the FOMC
    ledgers, not this one, would own.

12. **No tracked symbol carries a channel this calendar instruments — SUPPORTED, inherited, and
    unchanged.** `symbols: []`. The house playbooks (S1/S2/E1/S3/S4 + G1,
    [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed; none is
    rates-, FX- or funding-keyed. The [01-22 ledger](boj-decision-2027-01-22.md)'s correction stands
    — the causality the Bank itself asserts runs **AI demand → semiconductor prices → Japanese CPI →
    BoJ reaction function**, so a strong AI capex cycle reads hawkish for the BoJ — and nothing
    found here changes it in either direction. Leg 11 adds a second inbound channel (US Treasury
    pressure), also not tradable from our side.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2027-03-18. Four rules:

- **Read-only.** This entry's marginal value is the FOMC sequence, the measured death of the bracket
  test at March venues, the Outlook-free-≠-quiet correction, and the wage-timing correction to this
  event's own notes — not a view.
- **Do not re-derive the consensus at D-194.** The [12-18 ledger](boj-decision-2026-12-18.md) warned
  about stale survey instruments; at 194 days, with four decisions in front, a poll read would be
  worse than nothing. Leg 3's and leg 5's structures are the durable parts.
- **Search order when it lands** — (1) whether the **guideline for money market operations** changed
  (FT-3, and the only thing this Outlook-free venue *can* do); (2) the **vote split**; (3) whether
  Rengo's first tally was in hand (FT-2); (4) the yen, on the **named series**, with the FOMC
  confound stated (FT-1).
- **The attribution rule, and it is stricter than January's.** Any read of the 2027-03-18 Tokyo
  session that has not first ruled out the **FOMC decision and first SEP of 2027, published nine
  hours earlier**, is not entitled to attribute it to the BoJ — and on the Fed's own H.10 fixing the
  two are in the same bar and cannot be separated at all. On 2027-03-19, add Japan's February CPI and
  US quarterly triple witching before crediting anything to the BoJ.

### Honest limits

**Everything in legs 1-9 is machine-parsed primary; everything in leg 11 is not.** bloomberg.com,
cnbc.com and idnfinancials.com each returned **403** to this runner, so the Bessent campaign is a
dated photo caption from a page this session did read plus search-surfaced headlines and syndicated
summaries — the same wall the [01-22 ledger](boj-decision-2027-01-22.md) recorded, now measured on
three more domains. **theocc.com also returned 403** (5,704 bytes, no calendar), which is why the
opex proposal carries a derived date rather than an `OCC:` source. **`DEXJPUS` publishes with a lag
and its last bar is 2026-08-28** (159.97), so every FX number here stops there and the VIX reading is
2026-09-03's (14.32); the January ledger recorded the same lag, so nothing has changed on that front
in this session's favour. **Leg 5's n is nine and its power is low by construction** — a 0-of-9 null
on a threshold no observation approached is weak evidence for the threshold and strong evidence only
that the threshold is badly chosen for this venue; that is precisely how FT-1 is worded. **Leg 3
compounds it:** six of seven March BoJ decisions sit within two days of an FOMC, so the March FX
record is contaminated throughout and "the BoJ does not move the yen in March" is *not* a claim this
data can support — only "the March window does not produce ±2% sessions" is. **Leg 7's 2027 reply
day does not exist yet**, so its base rate is three cycles wide and its forward test is genuinely
open. **The Statistics Bureau schedule's byte count differs from the January ledger's reading of the
same URL on the same day** (13,839 vs 2,823); parsed rows agree and no claim depends on the
difference, but it is unexplained. And most importantly: **this is a D-194 initial research on an
event that four prior decisions and one Outlook Report stand in front of.** Every rate-path statement
here is conditional on the 09-18, 10-30, 12-18 and 01-22 outcomes, and it says so rather than
dressing a fork as a call.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside completely.** No position, no play, no size, in any
branch. What this ledger takes are four analytical positions, none of them positional.

First, **this is the contaminated venue, not the quiet one, and the contamination is American.** The
Fed's own calendar — parsed today — puts its first-SEP meeting of 2027 at **Mar 16-17**, concluding
14:00 ET on 2027-03-17 = **03:00 JST on the BoJ's decision day**. The BoJ board deliberates its
second day and announces after it. On the Fed's H.10 noon-ET USD/JPY fixing the two decisions sit in
**the same bar** and cannot be decomposed; the 2026 analogue is exact in ordering and its combined
bar was **-0.81%**. Six of the seven years the Fed's page covers put the two decisions within ±2
days. Our calendar carried **nothing** in this corridor; this PR files three entries into it.

Second, **"no Outlook Report" is a fact about projections, not about stakes — and it cuts both
ways.** Three of the last nine March MPMs changed policy or framework (**2024-03-19** NIRP exit and
YCC abolition, **2021-03-19** framework assessment, **2020-03-16** emergency easing), all from the
Bank's own release archives parsed today, and none of them had an Outlook Report. So the venue can
act. The sharper corollary is what it *cannot* do: with no projection vehicle, the food-tax-cut
footnote fork the [01-22 ledger](boj-decision-2027-01-22.md) registered is **not resolvable here** —
it resolves at Jan 21-22 or Apr 27-28. This meeting can only act on projections it did not write,
the same shape as [`fomc-2027-01-27`](fomc-2027-01-27.md)'s no-SEP structure.

Third, **the sibling FX bracket test is dead at this venue, and this session can measure that rather
than argue it.** Across nine March decisions (2018-2026) on the Fed series, **0 of 9** brackets
cleared ±2.0% and no decision day exceeded **1.41%** — including the 2024 NIRP exit at **1.07%**,
because it was pre-signalled. The [01-22 ledger](boj-decision-2027-01-22.md) measured **3 of 5** for
2026's meeting set with the identical method, so this is meeting-type, not method. And it is not a
March seasonal: March daily sd since 2018 is **0.601%** against **0.559%** all-sample. The
consequence is registered honestly — FT-1 is a near-certain null with the FOMC confound named in the
hypothesis, framed as a weak test rather than dressed as a finding.

Fourth, **this ledger books a correction against its own calendar entry.** The notes on
`boj-decision-2027-03-18` call it the best-informed 2027 venue on wages, citing a 2026 cycle whose
first tally (**2026-03-23**) landed **four days after** that year's decision. Base rate across
2024/2025/2026 is **2 of 3**, the failure is the most recent, the reply day follows no fixed calendar
rule, and no 2027 date is published. The CPI half of the same sketch **is** confirmed — February-2027
CPI on **2027-03-19**, one day after, independently reproduced from the Statistics Bureau's table
today, and it is the last row that table carries. Estimates widen caution and license nothing.

**Kill switches:**

- **Date kill (three ways):** the BoJ moving the Mar 17-18 MPM; the **Fed** moving its Mar 16-17
  meeting (its own page calls every 2027 date tentative until the preceding meeting confirms it —
  observe at [`fomc-2027-01-27`](fomc-2027-01-27.md)); or the Statistics Bureau moving the
  2027-03-19 CPI. Any one breaks the header or the corridor. Re-check every pulse — the CPI page's
  own last-update stamp is **2026-01-23**, making its far-forward rows the most movable.
- **Sequence kill (the one that guts legs 1-3):** the March 2027 FOMC being rescheduled such that
  its statement no longer precedes the BoJ decision by ≤2 days. Score by **2027-01-28**, the day
  after the January FOMC confirms the 2027 calendar.
- **FX-null kill (registered, series- and confound-specified):** **any single close-to-close move
  beyond ±2.0% in the 2027-03-16 → 2027-03-22 window** of the Federal Reserve H.10 noon-ET USD/JPY
  fixing (FRED `DEXJPUS`). Registered as **FT-boj-decision-2027-03-18-1**, score by **2027-03-23**.
  The window deliberately contains the FOMC; a clear is not attributable to the BoJ and the test
  says so.
- **Wage-timing kill (registered):** **Rengo publishing its first aggregate tally of the 2027 shunto
  on or before 2027-03-18**, i.e. in the board's hands at the decision. Registered as
  **FT-boj-decision-2027-03-18-2**, score by **2027-03-19**. This is the test of this event's own
  calendar notes, not of a sibling ledger.
- **Venue kill (registered):** the BoJ **changing the guideline for money market operations at the
  2027-03-18 decision**. Registered as **FT-boj-decision-2027-03-18-3**, score by **2027-03-19**,
  and registered at **Low** confidence on purpose: 3 of 9 March meetings acted, and four decisions
  plus an Outlook Report stand in front of this one. Distinct from
  FT-boj-decision-2027-01-22-3, which tests a move at the **January** venue.
- **Outlook-vehicle kill:** the BoJ publishing an Outlook Report, or an interim projection revision,
  at this meeting — the schedule's `-` would be wrong and leg 4's corollary voids. Re-check every
  pulse.
- **Political kill:** the **Bessent pressure campaign reversing** (US Treasury publicly urging
  restraint), or the Takaichi government publicly pressing the BoJ against a move. Either re-weights
  the This-quarter call. Re-check every pulse.
- **Channel kill:** a tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05
  → 2027-03-17** that the tape attributes to a BoJ headline. Leg 12's "no price channel" claim would
  be false. Re-check every pulse.

Three forward tests registered in
[`forward-tests/boj-decision-2027-03-18.md`](../forward-tests/boj-decision-2027-03-18.md) — **-1**
(the series- and confound-specified FX null), **-2** (the shunto-timing test of this event's own
notes) and **-3** (no change to the operations guideline at this venue). Three dated adjacent events
proposed as `estimate` in the same PR, into a corridor that was previously empty:
[`fomc-2027-03-17`](fomc-2027-03-17.md), [`japan-cpi-2027-03-19`](japan-cpi-2027-03-19.md) and
[`opex-2027-03-19`](opex-2027-03-19.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-194 | Initial research banked (above). **The fact that dominates this venue was in neither the January ledger nor this event's own notes: the FOMC concludes ~9h earlier carrying the FIRST SEP of 2027.** federalreserve.gov/monetarypolicy/fomccalendars.htm parsed today — 2027 panel reads `January 26-27 \| March 16-17* \| April 27-28 \| June 8-9* \| July 27-28 \| September 14-15* \| October 26-27 \| December 7-8*`, footnote `* Meeting associated with a Summary of Economic Projections`. 14:00 ET 3/17 = **03:00 JST 3/18**. On FRED `DEXJPUS` (noon-ET fixing) one bar spans noon 3/17→noon 3/18 and holds **both** banks — inseparable. 2026 analogue exact (FOMC 03-18 → BoJ 03-19): combined bar **-0.81%**. Structural, both primaries: BoJ-minus-FOMC gap 2021 +2, 2022 +2, 2023 -12, 2024 -1, 2025 0, 2026 +1, **2027 +1** — **6 of 7 within ±2 days, every March FOMC carries the SEP asterisk**. **"No Outlook Report" REFUTED as "low stakes"** — BoJ release archives 2018-2025 parsed: **3 of 9** March MPMs changed policy/framework (**2024-03-19** NIRP exit + YCC abolition, **2021-03-19** framework assessment, **2020-03-16** emergency easing), none with an Outlook. Corollary: with no projection vehicle this venue **cannot resolve** the food-tax footnote fork (FT-boj-decision-2027-01-22-1) — that is Jan 21-22 or Apr 27-28; this meeting can only act. **The sibling FX bracket test is dead here:** same method, Fed H.10 series, nine March decisions 2018-2026 — decision days +0.62 / -0.13 / **-1.41** / -0.11 / +0.61 / -1.00 / +1.07 / +0.35 / -0.81%, brackets **0 of 9** clear ±2.0%, max 1.41% (2020 COVID emergency); the 2024 NIRP exit moved **1.07%**. Against the 01-22 ledger's **3 of 5** for 2026's set — meeting-type, not method. **Not seasonal:** March sd since 2018 **0.601%** (n=198) vs **0.559%** all (n=2,163); 60-session sd **0.511%**, tails 3/166 (2026), 2/250 (2025), 5/251 (2024) — replicating 01-22 exactly. **Correction booked against this event's OWN calendar notes:** they call March best-informed on wages, citing Rengo's 2026 tally of **2026-03-23** — **four days AFTER** the 2026-03-19 decision. Base rate 2024 (tally 03-15 vs MPM 03-19), 2025 (03-14 vs 03-19), 2026 (03-23 vs 03-19) = **2 of 3**, failure most recent; reply days 03-13/03-12/03-18 follow no fixed rule and **no 2027 date is published**. Nuance keeping it MIXED: 2026's reply day was day 1 of the MPM, so headlines reached the board without the aggregate. **CPI half CONFIRMED independently:** stat.go.jp table row 16 `["February","March 19","March","March 26","2026 fiscal yearly average of Ku-area of Tokyo"]` — Feb-2027 CPI **2027-03-19**, one day after; board rules on Jan data (02-19). It is the table's **last row**, page stamped `Last Update : 23 January 2026`. Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — leg 11's US-Treasury channel, new to all five BoJ ledgers: Japan Times photo caption (page fetched in full today) *"U.S. Treasury Secretary Scott Bessent meets with Bank of Japan Gov. Kazuo Ueda on the sidelines of a Group of 20... in Asheville, North Carolina, on Tuesday"* = **2026-09-01**; wires 08-31→09-02 report him urging hikes, JGB 10y ~**3%** first since **1996** (headlines only — bloomberg/cnbc/idnfinancials all **403**). **Volatility** — VIX **14.32** (2026-09-03, CBOE via FRED); USD/JPY **159.97** (Fed H.10, last bar 2026-08-28). **Geopolitical** — Japan Times "Latest News" rail read today: *"Government may fully cover local losses from consumption tax cut"* (~6h old, **body not read** — a lead for the next pulse, not evidence). **Event tape** — **the corridor was EMPTY (zero tracked events within ±5 days) and is now dense**, which is the inverse of the 01-22 ledger's limit and confirms its warning that emptiness past 2026 is a thin-calendar artefact: FOMC+SEP **03-17** → this decision **03-18** → Japan Feb CPI 08:30 JST **and** US triple witching **03-19** (third Friday, computed today). Also the last MPM of **FY2026** (ends 2027-03-31) and the last before the **2027-04-01** food-tax cut; first post-cut Outlook 2027-04-28. **Three adjacencies proposed as `estimate`:** `fomc-2027-03-17` (high), `japan-cpi-2027-03-19` (low), `opex-2027-03-19` (high; theocc.com **403**, so the date is derived third-Friday arithmetic, not an `OCC:` source). **Own weaknesses:** leg 5's n is 9 and no observation approached the threshold, so the null is weak evidence for the threshold and strong evidence only that it is the wrong threshold here; 6 of 7 March BoJ decisions are FOMC-contaminated, so "the BoJ doesn't move the yen in March" is NOT supportable — only "the March window produces no ±2% sessions" is; `DEXJPUS` lags (last bar 08-28); the stat.go.jp fetch was **13,839 bytes** vs the 01-22 ledger's **2,823** for the same URL same day (rows agree, difference unexplained); and this is D-194 with four decisions and an Outlook in front. | — (stance set: stand aside, no position, no play; **this is the contaminated venue, not the quiet one** — at **Medium**, because the FOMC ordering is primary but every 2027 Fed date is tentative until the preceding meeting confirms it; four commitments — rule out the **FOMC + first SEP** before crediting the BoJ with anything in the 03-18 session and accept that on `DEXJPUS` they cannot be separated at all, read **"no Outlook Report"** as "cannot re-frame projections, can still change the regime" rather than "quiet," treat the **bracket test as near-dead at March venues** and register FT-1 as the weak null it is, and stop repeating the **best-informed-on-wages** line until a 2027 reply day is published) | 2026-09-26 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
