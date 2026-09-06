# World Economic Forum Annual Meeting 2027, Davos (Jan 18–22) — wef-davos-annual-meeting-2027-01-18

**Kind:** geopolitical · **Date:** 2027-01-18 (estimate — NEWS: the host destination's own site `davos.ch`, schema.org `BusinessEvent` JSON-LD, re-fetched direct 2026-09-06 at HTTP 200; `weforum.org` itself is 403 to this runner on three URLs) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["opex-2027-01-15","fomc-blackout-start-2027-01-16","mlk-market-closure-2027-01-18","vix-expiration-2027-01-20","japan-cpi-2027-01-22","boj-decision-2027-01-22"],"screenStreak":0,"blocked":[{"url":"https://www.weforum.org/meetings/","status":"403","at":"2026-09-06"},{"url":"https://www.weforum.org/events/world-economic-forum-annual-meeting-2027/","status":"403","at":"2026-09-06"},{"url":"https://www.weforum.org/press/","status":"403","at":"2026-09-06"},{"url":"https://www.davos.ch/en/experience/events/world-economic-forum-annual-meeting-2028","status":"404","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **Stand aside — and this document's output is a measured null plus the deletion of the
"2027 is special" framing that put the event on the calendar in the first place.** The date survives
independent re-fetching (davos.ch's machine-readable `BusinessEvent`, `startDate 2027-01-18`,
`endDate 2027-01-22`, HTTP 200), and it stays `estimate` because **weforum.org 403s under a browser
User-Agent on three separate URLs** — unlike the nyse.com 403 a sibling ledger resolved as a header
artifact the same day, **this block reproduces**. Everything else here is arithmetic and price data
run over the **30 Annual Meetings of 1995–2026**. Three results. **(1) Opening ON the MLK closure is
the current norm, not a collision:** every in-person January meeting since 2020 has started on the
third Monday of January — 2020, 2023, 2024, 2025, 2026 — against **0 of the 25** meetings 1995–2019;
2027 would be the **sixth**, and the **fifth in a row**. **(2) Davos week has no tape signature:** the
S&P's return over the meeting window sits at percentile **0.501** of same-length January windows
(n=30, **t = 0.02** against uniform), and VIX changes **+0.36 pts** on average (t = 0.94). **(3) The
"day-1 headlines arrive as a batch at Tuesday's open" story fails on its own prediction:** the reopen
after an MLK closure that opened a Davos meeting moved **|0.76%|** (n=5) against **|0.87%|** for all
post-MLK sessions since 1998 and **|0.80%|** for all January sessions — smaller, not larger. The Fed
*is* silent across all five 2027 Davos days (blackout **01-16 → 01-28**, `estimate`), and that is the
**third consecutive year** the meeting sits wholly inside it. Nothing is tradeable: `symbols: []`,
`impact: low`, the date is `estimate`, and a re-run playbook grep returns **zero** hits.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no instrument, no number and no release time to size against | High | D-134; `symbols: []` and a grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `davos\|world economic forum\|summit\|conference` returns **0 hits in both**, run this session. Davos publishes no consensus figure, so there is no surprise to measure and nothing for a playbook to key on | A house playbook that keys on a summit or conference week being written and back-tested before **2027-01-18** — the "nothing keys on this" leg goes stale and the sheet is rebuilt on measured data |
| This week | **Do not carry "Davos opens ON the closure" forward as a signal — it is the fifth straight year** | High | Measured 1995–2026: **5/5** in-person January meetings since 2020 started on the third Monday of January, **0/25** before it. The proposal called it "the tightest possible adjacency"; it is the WEF's standing Monday-start schedule meeting a fixed third-Monday holiday | The Wikipedia-sourced 1995–2026 date table failing to reproduce against any WEF-primary listing read at HTTP 200 before **2026-10-06** — the regime break dissolves and 2027 is a coincidence again |
| This month | **Treat the `estimate` label as a live, reproducing block — not a taxonomy gap** | Medium | `weforum.org` returned **403** on `/meetings/`, `/events/world-economic-forum-annual-meeting-2027/` and `/press/` with a browser User-Agent this session. That is the opposite finding to [`mlk-market-closure-2027-01-18`](mlk-market-closure-2027-01-18.md) leg 2, where the same treatment turned a 403 into a 200 — so the two blocks must not be lumped together. Registered as **FT-wef-davos-annual-meeting-2027-01-18-1** | Any `weforum.org` page listing the Annual Meeting 2027 dates read at **HTTP 200** before **2027-01-15** — the block was a header artifact after all and the entry promotes to `confirmed` |
| This quarter | **Expect no Davos-attributable move, and refuse the post-hoc read that will be offered for one** | Medium | The window study is a clean null (percentile **0.501**, t = 0.02, n=30) and the reopen study cuts against the batch-headline story. Meanwhile 2027-01-19 already has three better explanations than Davos: a three-day weekend, the unpin after `opex-2027-01-15`, and a Fed blackout that silences every official for the whole week | The S&P's return across **2027-01-19 → 2027-01-22** landing outside the **middle 80%** of same-length January windows, or VIX moving more than **±2 pts** across them — registered as **FT-wef-davos-annual-meeting-2027-01-18-2**, score by **2027-01-25** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never.** No entry, exit, hedge or resize is keyed to 2027-01-18 → 01-22. There is no instrument
  and the date is `estimate`; date-keyed action requires `confirmed` regardless.
- **The session map, so it is not re-derived wrong.** Fri **01-15** January expiration → *three-day
  weekend* → **Mon 01-18 US markets CLOSED (MLK) = Davos day 1** → Tue **01-19** (reopen, Davos day 2)
  → Wed **01-20** (VIX/VXM SOQ, Davos day 3) → Thu **01-21** (day 4) → Fri **01-22** (Davos closes;
  BoJ decision + Japan national CPI print 18:30 ET Thu 01-21). FOMC decides **Wed 01-27**, the second
  session after Davos ends.
- **The false inference this document exists to block, #1:** "Davos 2027 opens on a US market closure,
  which is unusual." It is the **fifth consecutive** January meeting to do so and the sixth since 2020.
- **The false inference this document exists to block, #2:** "The Fed is gagged for all five Davos
  days, so the week is information-starved and therefore jumpy." True on the first clause, unsupported
  on the second, and **not new** — 2025, 2026 and 2027 all sit wholly inside the January blackout.
- **The false inference this document exists to block, #3:** "Day-1 headlines price into no US session
  and hit Tuesday's open as a batch." Measured, the reopen is **smaller** than an ordinary post-MLK
  session (|0.76%| vs |0.87%|, n=5) — underpowered, but pointed the wrong way for the story.
- **The anecdote that will be offered as the counter-example:** **2026-01-20**, the reopen into Davos
  day 2, printed **−2.06%** with VIX **+4.23**. It is one observation in a five-observation subset
  whose mean is −0.41%, and 2026's Davos week is also a January-expiration unpin and a blackout week.
  Do not let it promote a Davos explanation.
- **VIX cash 14.53** (Cboe `VIX_History.csv`, close 2026-09-04, fetched this session) and **SPX
  7,718.60** (Cboe `SPX_History.csv`, same close). Quoted as this ledger's probe baseline, not as a
  read on a window 134 days out.

## Initial research

### The question

This event reached the calendar only as
`proposals/wef-davos-annual-meeting-2027-01-18.from-mlk-market-closure-2027-01-18.json` — a sibling
lane's in-sweep finding — so the `never-assessed`-on-a-proposed-id rule applies: read the proposal
first, then write the canonical file. It is the only proposal for this id. Two questions, in order.
**Does the proposal's date survive independent re-fetching**, given it filed `NEWS:` on a 403 it could
not get past? And, since Davos publishes no number, **is there anything about the meeting week that
can be measured at all** — or does this document just repeat the three sibling summit ledgers
([IMF/World Bank](imf-world-bank-annual-meetings-2026-10-12.md),
[APEC](apec-leaders-shenzhen-2026-11-18.md), [G20 Miami](g20-miami-2026-12-14.md)) that already
concluded a summit has no price channel of its own?

**One-line verdict:** the date survives and the 403 does *not* — it reproduces, which is a finding in
itself against a sibling's same-day result — and the measurable content is a **clean null over 30
meetings** plus the discovery that the proposal's headline adjacency is the **WEF's standing schedule
since 2020**, not a 2027 coincidence.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`; `earnings-cycle.mjs` and `intraday-edges.mjs` both
take a ticker) and no summit-shaped instrument exists in `scripts/research/`. Every source below was
fetched this session with an explicit HTTP status and byte count; every statistic is this session's
own computation over the raw price files, not a cited figure.

- **davos.ch** `…/experience/events/world-economic-forum-annual-meeting-2027` (**HTTP 200, 241,201
  bytes**) — the schema.org `BusinessEvent` JSON-LD read for `startDate` / `endDate` /
  `eventStatus` / `organizer` / `location`, independently of the proposal's read of the same URL.
- **Cboe** `cdn.cboe.com/api/global/us_indices/daily_prices/SPX_History.csv` (**HTTP 200, 292,573
  bytes**, 13,028 sessions from 1975-01-02 to 2026-09-04) and `…/VIX_History.csv` (**HTTP 200,
  472,309 bytes**, 9,266 sessions from 1990-01-02) — the two price series every statistic here runs on.
- **Federal Reserve** `federalreserve.gov/monetarypolicy/fomccalendars.htm` (**HTTP 200, 164,831
  bytes**) — January FOMC meeting dates for 2021–2027, read to apply the Board's own blackout rule.
- **Wikipedia** `en.wikipedia.org/wiki/World_Economic_Forum` (**HTTP 200, 999,391 bytes**) — the
  "Overview of past annual meetings" table, the only reachable list of 1995–2026 meeting dates given
  the weforum.org block. **Secondary, and labelled as such** (see Honest limits).
- **Blocked or absent, recorded rather than substituted** (all 2026-09-06, all in `probe-ref.blocked`):
  `weforum.org/meetings/` **403** (382 bytes), `weforum.org/events/world-economic-forum-annual-meeting-2027/`
  **403** (445 bytes), `weforum.org/press/` **403** (379 bytes) — all three with a browser
  User-Agent; `davos.ch/…/world-economic-forum-annual-meeting-2028` **404** (no 2028 page exists yet).
- **Own computation:** the third Monday of every January 1995–2027; the S&P 500's return across every
  meeting window and across all 651 same-length January windows 1995–2026; the VIX change across every
  meeting window; the first US session after every MLK closure 1998–2026; and the Board's blackout
  window (the second Saturday preceding the meeting, through the Thursday after it) for each January
  FOMC 2020–2027.
- **House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped
  for `davos|world economic forum|summit|conference`; the proposal and the
  [`mlk-market-closure-2027-01-18`](mlk-market-closure-2027-01-18.md),
  [`imf-world-bank-annual-meetings-2026-10-12`](imf-world-bank-annual-meetings-2026-10-12.md),
  [`apec-leaders-shenzhen-2026-11-18`](apec-leaders-shenzhen-2026-11-18.md) and
  [`g20-miami-2026-12-14`](g20-miami-2026-12-14.md) ledgers read in full;
  `src/domain/market-events/` scanned for the ±5-day corridor.

### Conviction legs, tested

1. **The date survives independent re-fetching — SUPPORTED.** davos.ch's JSON-LD reads verbatim
   `"@type":"BusinessEvent"`, `"name":"World Economic Forum Annual Meeting 2027"`,
   `"organizer":{"@type":"Organization","name":"World Economic Forum","url":"https://www.weforum.org"}`,
   `"location":{"@type":"Place","name":"Kongresszentrum Davos"}`,
   `"eventStatus":"https://schema.org/EventScheduled"`, `"startDate":"2027-01-18"`,
   `"endDate":"2027-01-22"`. That is the host destination's official site naming the WEF as organizer,
   in machine-readable form — good evidence, and still not the organiser's own listing.

2. **The weforum.org 403 reproduces under a browser User-Agent — SUPPORTED, and it is the opposite of
   the sibling's same-day finding.** Three URLs, all 403 with a browser UA:
   `/meetings/` (382 b), `/events/world-economic-forum-annual-meeting-2027/` (445 b), `/press/`
   (379 b). The [MLK ledger](mlk-market-closure-2027-01-18.md) leg 2 established, on 2026-09-06, that
   `nyse.com`'s 403 was a **User-Agent artifact** that vanished under a browser UA. The two must not be
   lumped into one "egress" story: nyse.com was header sensitivity, weforum.org is a standing block to
   this runner. Registered as **FT-wef-davos-annual-meeting-2027-01-18-1**.

3. **"Davos opens ON the closure" is the WEF's standing schedule, not a 2027 collision — REFUTED (the
   proposal's framing), and this is the finding that justifies the document.** Computing the third
   Monday of January against every Annual Meeting's start date:

   | Era | Meetings | Started on the third Monday (= MLK Day) |
   |---|---|---|
   | 1995–2019 | 25 | **0** |
   | 2020, 2023–2026 (in-person, January) | 5 | **5** |
   | 2027 (scheduled, `estimate`) | 1 | **1** — the sixth, and the fifth in a row |

   The mechanism is visible in the start weekdays: Thursday starts 1995–2002, Wednesday 2004–2016,
   Tuesday 2017–2019, **Monday from 2020 onward**. Once the meeting runs Monday–Friday in the
   15th–21st window, and MLK is the third Monday by statute (5 U.S.C. § 6103) — a window only three US
   closures can ever occupy, per the MLK ledger's leg 3 — day 1 lands on the closure **by
   construction**. 2021 (cancelled, COVID) and 2022 (moved to 22–26 May) are the only interruptions,
   and neither is a January meeting that failed the pattern.

4. **Davos week carries no measurable S&P or VIX signature — REFUTED (any "Davos week is different"
   claim), and this is the cleanest null this calendar has measured.** For each of the 30 meetings
   1995–2026, the S&P's return from the last close before the window to the last close inside it, and
   the same window's VIX change:

   | Statistic | Davos windows | Baseline |
   |---|---|---|
   | Return percentile vs same-length January windows | **mean 0.501**, sd 0.284, n=30 | uniform expects **0.500**; **t = 0.02** |
   | Below the January median | **17 / 30** | 15 expected |
   | S&P return, 3-session windows | mean **−0.20%**, 9/15 up | all-January mean +0.09%, all-year +0.13% (**t = −0.86**) |
   | S&P return, 4-session windows | mean **+0.45%**, 8/14 up | all-January mean +0.11%, all-year +0.17% (**t = +0.59**) |
   | VIX change over the window | mean **+0.36 pts**, med +0.23, 18/30 up | **t = 0.94**, sd 2.08 |

   A mean percentile of 0.501 against an expected 0.500 is not a weak effect; it is the absence of one.

5. **The "day-1 headlines arrive as a batch at Tuesday's open" story fails its own prediction —
   REFUTED as stated, at low power.** The five January meetings that opened on an MLK closure give
   five reopens, all of which the story predicts should be *outsized*:

   | Year | Reopen session | S&P | VIX |
   |---|---|---|---|
   | 2020 | 2020-01-21 | −0.27% | +0.75 |
   | 2023 | 2023-01-17 | −0.20% | +1.01 |
   | 2024 | 2024-01-16 | −0.37% | +1.14 |
   | 2025 | 2025-01-21 | **+0.88%** | −0.91 |
   | 2026 | 2026-01-20 | **−2.06%** | **+4.23** |

   Mean **−0.41%**, mean absolute move **0.76%** — against **0.87%** for all 29 post-MLK sessions
   1998–2026 and **0.80%** for all 586 January sessions over the same span. The batch story predicts a
   *larger* move and the sample delivers a smaller one. With n=5 that does not refute it with power;
   what it does refute is the claim that the tape *supports* it. Separately, the post-MLK session is
   not itself distinguishable: n=29, mean −0.28%, **t = −1.14** against zero and **−1.18** against the
   January daily mean.

6. **The Fed is silent for all five Davos days, and that is the third year running — SUPPORTED as
   fact, REFUTED as novelty.** Applying the Board's own rule (blackout opens 12:00 a.m. ET on the
   second Saturday preceding the meeting, closes the Thursday after it) to the January FOMC dates read
   off `fomccalendars.htm`:

   | Year | January FOMC | Blackout opens | Davos | Wholly inside? |
   |---|---|---|---|---|
   | 2020 | Jan 28–29 | 2020-01-18 | 01-20 → 01-24 | **yes** |
   | 2023 | Jan 31–Feb 1 | 2023-01-21 | 01-16 → 01-20 | no — Davos *precedes* it |
   | 2024 | Jan 30–31 | 2024-01-20 | 01-15 → 01-19 | no — Davos *precedes* it |
   | 2025 | Jan 28–29 | 2025-01-18 | 01-20 → 01-24 | **yes** |
   | 2026 | Jan 27–28 | 2026-01-17 | 01-19 → 01-23 | **yes** |
   | **2027** | **Jan 26–27** | **2027-01-16** | **01-18 → 01-22** | **yes** |

   2027's window reproduces `fomc-blackout-start-2027-01-16` (`estimate`) exactly, and the decision
   (`fomc-2027-01-27`, `estimate`) lands the second session after Davos closes. So the configuration
   is real — and it is what happened in 2025 and 2026 too, both of which sit inside the null in leg 4.

7. **Nothing in the house system keys on a summit week — SUPPORTED, re-verified not inherited.** A grep
   of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `davos|world economic forum|summit|conference` returns **0 hits in both files**, run this session.
   This is the fourth summit ledger to reach that result independently, after IMF/World Bank, APEC and
   G20 Miami.

8. **This document adds to the sibling summit ledgers rather than repeating them — SUPPORTED.** The
   three predecessors each refused their event for a *reason specific to it*: the IMF's flagship
   reports failed to move the tape in the direction of their own message (n=2 instances); APEC's value
   was contingent on an unconfirmed bilateral; G20 Miami's on a bilateral whose marginal information
   was already spent. Davos has **no bilateral, no communiqué and no publication** — which is exactly
   what makes it the one summit in the set with a large enough clean sample (30 windows) to measure the
   null directly rather than argue it. That measurement is this ledger's contribution.

9. **No new dated adjacent event was found to propose — SUPPORTED, as a negative.** The ±5-day corridor
   (`opex-2027-01-15`, `fomc-blackout-start-2027-01-16`, `mlk-market-closure-2027-01-18`,
   `vix-expiration-2027-01-20`, `japan-cpi-2027-01-22`, `boj-decision-2027-01-22`) is already fully
   carried by this calendar, and both events this research leaned on — `fomc-2027-01-27` and
   `fomc-blackout-start-2027-01-16` — exist as canonical files. The one candidate for a new proposal,
   the **2028** Annual Meeting, has no dated source: davos.ch returns **404** for a 2028 event page and
   weforum.org is blocked. Nothing is proposed rather than a date being guessed.

### What plays the conditions support

None. There is no instrument (`symbols: []`), no number, no release time, no surprise to measure, the
impact is `low`, the date is `estimate`, and no house playbook keys on the calendar. The supported
outputs are written, not traded: the measured null (leg 4), the three blocked inferences in the signals
list, the reproducing weforum.org block that separates this event's `estimate` label from the MLK
class's taxonomy gap (leg 2), and the regime break that makes the opening-day adjacency ordinary
(leg 3).

### Honest limits

- **The 1995–2026 date table is Wikipedia's, not the WEF's.** weforum.org is 403 on three URLs, so the
  historical dates every frequency in legs 3–5 depends on come from a secondary source. A WEF-primary
  listing that contradicts it would move legs 3 and 5 and is the falsifier attached to the This-week
  call.
- **n=5 is not power.** Leg 5's reopen study has five observations. It shows the tape does not support
  the batch-headline story; it cannot rule it out, and it is stated that way.
- **Window boundaries are calendar-defined, not market-defined.** A meeting window is 3–6 US sessions
  depending on the year, and leg 4 controls for that by matching window length before taking
  percentiles — but a Thursday-start 1990s meeting and a Monday-start 2020s meeting are not the same
  object, and pooling them is a modelling choice, not a fact.
- **The confounds are worse here than the sample size.** Davos week sits inside Q4 reporting season,
  the January expiration unpin, and — in 2025/2026/2027 — a Fed blackout. Any Davos-week move has
  several better-identified explanations before it has this one. That is the same attribution problem
  the [G20 Miami](g20-miami-2026-12-14.md) ledger recorded, and it applies with more force to an event
  with no publication.
- **Everything here is `estimate`.** This event, the blackout entry, the FOMC decision and the MLK
  closure all carry the label. Estimates widen caution and license nothing.
- **No claim is made about the meeting's content.** Attendance, themes and whether any head of state
  shows up are unknown 134 days out and are not forecast here.

## Stance & kill switches

**Stance (2026-09-06):** stand aside, permanently and structurally. This ledger exists to hold one
measured null and three corrections, not a view. Concretely: (a) the S&P's behaviour across the Davos
window is **indistinguishable** from an ordinary January window — percentile **0.501**, t = 0.02, over
30 meetings — and VIX's is too (**+0.36 pts**, t = 0.94); (b) **opening on the MLK closure is the
WEF's standing Monday-start schedule since 2020** (5/5 in-person January meetings, 0/25 before), so
2027's "tightest possible adjacency" is the fifth consecutive instance and carries no information;
(c) the **Fed blackout covering all five Davos days is the third consecutive year**, not a new
configuration; (d) the reopen after an MLK closure that opened a Davos meeting is **smaller** than an
ordinary post-MLK session (|0.76%| vs |0.87%|, n=5), which is the wrong sign for the batch-headline
story the proposal flagged; (e) this entry's `estimate` label rests on a **reproducing 403**, not on a
taxonomy gap — which distinguishes it from the seven closure entries the MLK ledger catalogued. Every
statement here carries the event's **`estimate`** label.

**Kill switches:**

- **Any `weforum.org` page listing the Annual Meeting 2027 dates is read at HTTP 200 from a repo lane**
  — leg 2 is wrong, the block was a header artifact like nyse.com's, and this entry promotes to
  `confirmed` on a primary. Registered as **FT-wef-davos-annual-meeting-2027-01-18-1**, score by
  2027-01-15.
- **The S&P's return across 2027-01-19 → 2027-01-22 lands outside the middle 80% of same-length
  January windows, or VIX moves more than ±2 points across them** — leg 4's null fails out of sample
  and the window earns a real look. Registered as **FT-wef-davos-annual-meeting-2027-01-18-2**, score
  by 2027-01-25.
- **A WEF-primary listing gives Annual Meeting 2027 dates other than 18–22 January 2027** — the entry
  re-dates, leg 3's "sixth in a row" retires, and the MLK ledger's Davos adjacency dissolves with it.
- **The 2028 Annual Meeting is announced with a start date that is *not* the third Monday of January**
  — the 2020-onward regime identified in leg 3 has ended, and a later Davos entry cannot inherit this
  ledger's framing.
- **A house playbook that keys on summit or conference weeks is written and back-tested** — leg 7 goes
  stale and the stand-aside is re-argued against measured data rather than against absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | 134 | **Initial research**; canonical `<id>.json` written after reading the single `from-mlk-market-closure-2027-01-18` proposal. Date re-verified independently — davos.ch `BusinessEvent` JSON-LD at HTTP 200 (241,201 b), `startDate 2027-01-18` / `endDate 2027-01-22`. **`weforum.org` 403 REPRODUCES under a browser UA on 3 URLs** — the opposite of the MLK ledger's same-day nyse.com result, so the two blocks are not one story; stays `estimate` on a live block, not a taxonomy gap. **Measured over the 30 meetings 1995–2026** (Cboe SPX/VIX CSVs, HTTP 200; dates from Wikipedia, secondary): the S&P's Davos-window return sits at percentile **0.501** of same-length January windows (**t = 0.02**), VIX **+0.36 pts** (t = 0.94) — a clean null. **Opening on MLK is the norm:** Monday starts from 2020, so **5/5** in-person January meetings since 2020 opened on the closure vs **0/25** in 1995–2019; 2027 is the sixth. **Reopen study (n=5):** mean **−0.41%**, |move| **0.76%** vs **0.87%** all post-MLK 1998–2026 and **0.80%** all January — the batch-headline story points the wrong way. Adjacency — peers: n/a (`symbols: []`); macro: Jan FOMC **01-26/27** per fomccalendars.htm (HTTP 200), blackout **01-16 → 01-28** covers all five Davos days, the **third straight year** (2025/26/27) vs Davos preceding it in 2023/24; VIX **14.53**, SPX **7,718.60** (Cboe, close 2026-09-04); geopolitical: none dated; tape: `opex-2027-01-15` precedes, `vix-expiration-2027-01-20` is Davos day 3. **No new proposal** — the ±5-day corridor is fully carried, and davos.ch has **no 2028 page (404)**. | Initial stance set: **stand aside** (measured null + three corrections). Registers **FT-wef-davos-annual-meeting-2027-01-18-1** and **-2**. | 2026-10-06 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-wef-davos-annual-meeting-2027-01-18.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
