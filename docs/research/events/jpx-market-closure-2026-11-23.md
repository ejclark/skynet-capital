# Tokyo dark in every listed product — Labor Thanksgiving Day plus a JPX group-wide BCP test — jpx-market-closure-2026-11-23

**Kind:** sector · **Date:** 2026-11-23 (estimate — NEWS: JPX `jpx.co.jp/english/derivatives/rules/holidaytrading/` + `…/about-jpx/calendar/` + the exchange's own finalized-holiday-trading file, all fetched direct 2026-09-09; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-11-27","advance-services-q3-2026-11-19","apec-leaders-shenzhen-2026-11-18","beige-book-2026-11-25","consumer-confidence-2026-11-24","durable-goods-2026-11-25","fhfa-hpi-2026-11-24","fomc-blackout-start-2026-11-28","fomc-minutes-2026-11-18","gdp-q3-2026-second-2026-11-25","housing-starts-2026-11-18","japan-cpi-2026-11-20","japan-cpi-tokyo-flash-2026-11-27","jgb-20y-auction-2026-11-18","jgb-40y-auction-2026-11-25","new-home-sales-2026-11-25","opex-2026-11-20","pce-2026-11-25","pending-home-sales-2026-11-18","retail-ecommerce-q3-2026-11-19","sifma-bond-early-close-2026-11-27","thanksgiving-half-day-2026-11-27","thanksgiving-market-closure-2026-11-26","tic-monthly-2026-11-18","treasury-10y-tips-2026-11-19","treasury-20y-bond-2026-11-18","treasury-2y-frn-2026-11-24","treasury-2y-note-2026-11-23","treasury-5y-note-2026-11-24","treasury-7y-note-2026-11-25","treasury-coupon-announcement-2026-11-19","vix-expiration-2026-11-18"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and stop treating "Tokyo is totally dark" as a category that means anything.**
This entry was filed on the premise that 2026-11-23 is special: a JPX BCP test shuts even the Osaka
derivatives session, so unlike an ordinary Japanese holiday the rates leg *and* the equity leg go
dark, two sessions before the 2026-11-25 40-year JGB auction. The premise is **true and verified from
three primaries**, and this session then measured what it is worth. **It is worth nothing.** Using the
exchange's own `Open`/`Not Open` labels — from `List_of_Finalized_Holiday_Trading_Days_E.xlsx`, a
primary **no ledger in this repo had fetched before**, and the exact limit
[`jpx-market-closure-2027-03-22`](jpx-market-closure-2027-03-22.md) recorded as unfetched — the first
`^N225` cash session after a total blackout runs **|close-to-close| 1.536% (n=12) against 1.404%
after a holiday where Osaka traded (n=39), Welch t = 0.39**. The same file also kills the framing both
siblings carry: **`Not Open` is routine, not a BCP one-off** — 16 of 77 finalized entries, nine of them
outside the New Year carve-out and none footnoted as BCP, two to four a year. And it **validates** the
missing-bar holiday classification those ledgers were built on: 62 in-window exchange holidays, 65
weekday cash gaps, **zero mismatches either direction**. Nothing here is tradeable: the date is
`estimate`, `symbols: []`, `impact: low`, and a grep of both house playbook docs for
`holiday|jpx|tokyo|nikkei|closure|thanksgiving|bcp` returns **0 hits in both**, run this session. The
honest output is one retired limit, two corrected sibling claims, one dissolved distinction, and two
registered forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a foreign-exchange holiday 75 days out is not a position | High | D-75; `symbols: []`, `impact: low`, `estimate`, and 0 playbook hits for `holiday\|jpx\|tokyo\|nikkei\|closure\|thanksgiving\|bcp` across `trade-playbooks.md` + `multi-symbol-sweep.md`, re-grepped this session rather than inherited | A house playbook keyed to Japanese sessions or holiday-adjacent bars being written and back-tested before **2026-11-23** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Correct the record, don't trade it** — the write-up is the whole deliverable | High | The two sibling closure ledgers both assert BCP testing is the only mechanism that flips a day to `Not Open`. JPX's own finalized file says otherwise: Coming of Age Day 2023, 2024 **and** 2025, Culture Day 2023, Mountain Day substitute 2024, Respect for the Aged Day 2024 and 2025, Culture Day substitute 2024 | JPX republishing the finalized file with those nine days relabelled `Open`, or footnoting them as BCP tests, observed before **2026-10-09** — the "routine, not a one-off" correction collapses and the siblings were right |
| This month | **Watch the taxonomy, not the tape** — the date is not in doubt and still cannot be confirmed | Medium | Three primaries date it independently (derivatives table, market-holiday panel, the finalized xlsx) and statute fixes Labor Thanksgiving Day on November 23, a Monday in 2026, so no substitution applies. It stays `estimate` only because `market-events-data.ts`'s prefix taxonomy has no slot for a securities exchange's own calendar and this lane may not self-confirm an in-sweep discovery | An exchange-calendar prefix (`JPX:`/`NYSE:`-class) being added to the source taxonomy before **2026-11-23** — the entry promotes to `confirmed` and this call retires |
| This quarter | **Expect an ordinary Tokyo-closure bar on Tue 2026-11-24, not a blackout bar** | Medium | The blackout adds nothing measurable: `Not Open` 1.536% vs `Open` 1.404%, t = 0.39 (n = 12/39); matched on gaps spanning one unmatched US session, 1.497% vs 1.360%, t = 0.38. What *does* move the bar is generic and already known — any Tokyo closure runs ~1.45% against ~1.02% for a session with no unmatched US session behind it | The **2026-11-24** `^N225` cash session printing \|close-to-close\| **at or above 2.09%** (the `Not Open` bucket's mean + 2 se) — one observation in the direction that a total blackout really is a different animal. Registered as **FT-jpx-market-closure-2026-11-23-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2026-11-23. Tokyo is shut, the date is `estimate`,
  and date-keyed action requires `confirmed` regardless.
- **Execution guard (Mon 2026-11-23, cross-asset):** unlike an ordinary Japanese holiday, **no Osaka
  or TOCOM session runs** — index futures, index options, commodity futures and options on commodity
  futures are all unavailable alongside the always-ineligible JGB futures, options on JGB futures,
  interest-rate futures and securities options (`estimate`; JPX holiday-trading page, `Not Open` /
  **Finalized**). Any Japanese leg, equity or rates, is absent for the whole session.
- **Execution guard (order handling):** JPX's GTC/GTD expiry rule is written for a *holiday-trading*
  day. On a `Not Open` day the page states the converse verbatim — *"If the holiday trading is not
  executed, the Good till Date/Good till Cancel orders (GTC/GTD) will not expire."* So resting
  Japanese orders should be assumed **carried** across 2026-11-23, the opposite of the guard the
  [`jpx-market-closure-2027-03-22`](jpx-market-closure-2027-03-22.md) ledger wrote for its `Open` day.
- **Execution guard (rates, D-2 to the 40-year):** JGB futures — the hedging and price-discovery
  instrument for a super-long auction — are dark on the Monday before
  `jgb-40y-auction-2026-11-25`. That auction's own ledger measured the consequence and found none at
  conventional significance (cover **2.820**, n = 19, in holiday-shortened weeks vs **3.044**, n = 76;
  t = −1.69 raw, **−0.168, t = −1.07** neighbour-matched). Structure, not a demand signal.
- **The mirrored week, so nobody re-derives it wrong:** Tokyo is dark Mon **11-23** while the US runs
  a full session carrying `treasury-2y-note-2026-11-23`; the US is dark Thu **11-26** and short Fri
  **11-27** while Tokyo trades both. Each market loses a session the other trades. November's only
  other JPX closure is **11-03** (Culture Day) — Tokyo trades every other November session.
- **Attribution trap (Tue 2026-11-24):** the first cash bar back has a Japan-CPI-11-20 explanation, a
  quarterly-opex-11-20 explanation, an APEC-11-18 explanation and a three-day-weekend explanation
  before it has any single one. The measured effect is a **variance** result with no directional
  content (signed mean **+0.380%** on sd 2.15 — noise).

## Initial research

### The question

`jpx-market-closure-2026-11-23` was proposed during the `jgb-40y-auction-2026-11-25` adjacency sweep
on a specific structural claim: JPX's FY2026 group-wide BCP test shuts the derivatives market as well
as the cash market, so 11-23 is a **total** Tokyo blackout rather than the cash-only closure a
Japanese national holiday normally produces — and it lands two sessions before a 40-year JGB auction
whose hedging instrument is therefore unavailable. Is the total-blackout premise true, and does
"total" measurably differ from "cash-only"?

**One-line verdict:** **the premise is true and the distinction is empty.** Three primaries confirm
Tokyo is shut in every listed product on 2026-11-23. But on the exchange's own `Open`/`Not Open`
labels the first cash session back is statistically indistinguishable between the two treatments
(1.536% vs 1.404%, t = 0.39), and the same file shows `Not Open` is a routine two-to-four-times-a-year
state rather than the BCP one-off both sibling ledgers describe.

### Method

Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. Nothing below is inherited from the proposing entry or the sibling ledgers;
every source was re-fetched and every statistic recomputed in-session.

- **JPX** `jpx.co.jp/english/derivatives/rules/holidaytrading/index.html` (HTTP 200, 48,483 bytes,
  page's own `Update : Jun. 26, 2026`) — the 2026 and 2027 eligible-holiday tables, all seven
  footnotes, the eligible-product table and the full trading-rules section, parsed row by row.
- **JPX** `jpx.co.jp/english/corporate/about-jpx/calendar/index.html` (HTTP 200, 33,103 bytes,
  `Update : Feb. 06, 2026`) — the 2026 and 2027 market-holiday panels, parsed date by date.
- **JPX** `…/holidaytrading/b5b4pj0000050353-att/List_of_Finalized_Holiday_Trading_Days_E.xlsx`
  (HTTP 200, 11,884 bytes) — **the source of two of the three findings below, and new to this repo.**
  77 dated entries, `2022-09-23 → 2027-05-05`, each with the exchange's own `Open` / `Not Open` label.
  This is the file `jpx-market-closure-2027-03-22`'s honest-limits section named as *"NOT fetched this
  session — a first-pulse item that would let the buckets be rebuilt on the exchange's own dates."*
- **Yahoo Finance** `^N225` daily bars — **6,659 sessions, 2000-01-04 → 2026-09-09**, exchange
  timezone `Asia/Tokyo`; `^GSPC` — 6,710 sessions to 2026-09-08; `^VIX` — 6,962 sessions to
  2026-09-08 (close **15.72**, the probe reference). All statistics below are computed from these
  series in-session, not quoted.
- **Fetch note, recorded rather than buried:** the first `^N225`/`^GSPC`/`^VIX` attempt returned
  **HTTP 429** under a browser user-agent and succeeded on retry under the repo's own contact UA
  (`scripts/research/market-data.mjs`). Nothing was substituted and no prefix downgraded, so it is
  **not** entered in `probe-ref.blocked` — that array is for a cited source that stayed unreachable.
- **Grepped, not assumed:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md`
  for `holiday|jpx|tokyo|nikkei|closure|thanksgiving|bcp` — **0 hits in both**.
- **Not fetched, so not asserted:** CME/SGX Nikkei futures holiday calendars, MOF's JGB auction
  results, SIFMA's Japan panel, and any OSE holiday-session volume data.

### Conviction legs, tested

1. **The date and the total-blackout mechanism — SUPPORTED, from three primaries (and still
   `estimate`).** The derivatives table carries `November 23 | Mon. | Labor Thanksgiving Day |
   **Not Open**⁶ | **Finalized**`, and footnote 6 reads verbatim: *"Markets will not be opened on
   November 23, 2026 (Labor Thanksgiving Day) due to a JPX Group-wide BCP testing (disaster recovery
   testing) of FY 2026 which is planned to be implemented for November 21 through 23."* The
   market-holiday panel independently lists `Nov. 23 (Mon.) Labor Thanksgiving Day`, and the finalized
   xlsx carries the same date as `Labor Thanksgiving Day | Not Open`. Statute corroborates: Japan's
   Act on National Holidays fixes the day on November 23, a Monday in 2026, so the panel's own
   substitution footnote (*"National holidays that fall on a Sunday are observed on the closest
   following day that is not a national holiday"*) does not apply. **Why this stays `estimate`:** the
   prefix taxonomy in `market-events-data.ts` has no slot for an exchange holiday calendar, and this
   lane may not self-confirm an in-sweep discovery. The label is about the taxonomy, not the evidence
   — and since every honest call here is a stand-aside, it costs nothing.

2. **"BCP testing is the only mechanism that flips a day to `Not Open`" — REFUTED, on the exchange's
   own file.** Both siblings carry this claim
   ([`2027-03-22`](jpx-market-closure-2027-03-22.md) asserted it; the
   [`2026-12-31`](jpx-market-closure-2026-12-31.md) ledger restated it as *"the BCP-testing one-offs
   (2026-11-23, 2027-09-20) the sibling identified as the only mechanism that flips a day to `Not
   Open`"*). The finalized file lists **16 `Not Open` days among 77 entries** since the 2022-09-23
   launch. Three fall under the standing December 31 / January 2 New Year carve-out the 12-31 ledger
   correctly identified, and one more is `2023-01-02`. That leaves **nine** the page footnotes no
   reason for at all:

   | Date | Day | Holiday |
   |---|---|---|
   | 2023-01-09 | Mon | Coming of Age Day |
   | 2023-11-03 | Fri | Culture Day |
   | 2024-01-08 | Mon | Coming of Age Day |
   | 2024-08-12 | Mon | Substitute Holiday of Mountain Day |
   | 2024-09-16 | Mon | Respect for the Aged Day |
   | 2024-11-04 | Mon | Substitute Holiday of Culture Day |
   | 2025-01-13 | Mon | Coming of Age Day |
   | 2025-09-15 | Mon | Respect for the Aged Day |
   | 2026-11-23 | Mon | Labor Thanksgiving Day *(this event)* |

   Two in 2023, four in 2024, two in 2025 — **a run rate of two to four total blackouts a year**, not a
   rarity. Coming of Age Day was `Not Open` three years running and then flipped to `Open` for
   2026-01-12. **The honest limit on this leg:** the file gives labels, not reasons; this session does
   **not** claim those nine were *not* BCP tests, only that the current page footnotes a BCP reason for
   exactly two forward dates (2026-11-23, 2027-09-20) and that "one-off" is the wrong word for a state
   the exchange enters several times a year.

3. **The blackout is a property of the FY2026 BCP window, not of the holiday — SUPPORTED.**
   `2022-11-23` (Labor Thanksgiving Day) traded **`Open`**, and the `2025-11-24` substitute traded
   **`Open`**; JPX already schedules **`November 23 | Tue. | Labor Thanksgiving Day | Open |
   Scheduled`** for 2027. So nothing about this holiday closes the market — the FY2026 test window does,
   and next year's window moves to `September 18 through 20` (footnote 7, closing 2027-09-20 instead).
   Both published windows are **Saturday–Sunday–Monday** blocks: the exchange picks three consecutive
   days of which exactly one is a market day. That is the cheapest possible shape, and it is why the
   blackout lands on a Monday holiday both years.

4. **`Not Open` vs `Open` makes no measurable difference to the first cash session back — NOT
   SUPPORTED as a distinction, measured.** This is the natural experiment the finalized file makes
   possible for the first time: post-launch every Tokyo holiday carries the exchange's own treatment
   label. Grouping consecutive closures into blocks and taking the first `^N225` cash session after
   each:

   | Treatment of the closure | n | mean \|close-to-close\| | median | mean unmatched-US sessions |
   |---|---|---|---|---|
   | **`Not Open`** (Osaka shut too) | **12** | **1.536%** (se 0.278) | 1.447% | 1.33 |
   | `Open` (Osaka traded through) | 39 | 1.404% (se 0.194) | 1.056% | 1.13 |

   **Welch t = 0.39.** Restricting both arms to gaps spanning exactly one unmatched US session, to
   remove the length confound: **1.497% (n = 9) vs 1.360% (n = 34), t = 0.38.** The twelve `Not Open`
   observations run 0.30% to 3.45%, straddling the `Open` distribution entirely. Whether Osaka prices
   Nikkei futures through the closure or not, the bar that follows is the same. **This is the leg that
   matters for 2026-11-23**, because "total blackout" is the entire reason this entry was proposed
   rather than left banked.

5. **The missing-bar holiday classification is VALID — SUPPORTED, and a sibling's honest limit is
   retired.** `jpx-market-closure-2027-03-22` inferred Tokyo holidays from missing `^N225` weekday
   bars and flagged the risk plainly: *"A stray data outage would be misread as a holiday."* Checked
   both directions across the four-year overlap `2022-09-23 → 2026-09-09`:

   - all **62** finalized-file entries inside the bar window are **absent** from the cash series —
     **0** false negatives;
   - all **65** weekday gaps in the cash series are accounted for by the finalized file plus the New
     Year / December 31 carve-out — **0** unexplained gaps.

   Zero mismatches either direction. The technique is sound and the limit does not need restating in
   any future closure ledger.

6. **The "wider after a JPX closure" statistic is a Tokyo-closure effect, not a Monday effect —
   REPLICATED, not discovered.** Reproduced `2027-03-22`'s leg 5 to the third decimal on five extra
   days of data: holiday-Tuesday **|c2c| 1.492% (se 0.130, n = 151)** vs ordinary Tuesday **0.929%
   (se 0.029, n = 1,170)**, **Welch t = 4.26** (their 4.24). But an ordinary Tuesday holds **zero**
   unmatched US sessions by construction while every holiday-Tuesday holds exactly one, so the
   comparison is not like-for-like. Against the correct control — the **117** other Tokyo sessions
   whose gap spans exactly one unmatched US session (Mondays after a Friday closure, Wednesdays after
   a Tuesday closure, and so on) — the premium is **1.492% vs 1.411%, t = 0.48**, and the overnight
   gap runs the *other* way (0.731% vs 0.793%, t = −0.95). Across all 6,537 Tokyo sessions the effect
   is simply the count of unpriced US sessions: **1.021%** at zero (n = 6,218), **1.457%** at one
   (n = 268), **2.061%** at three (n = 25). **Credit where it is due:** the
   [`2026-12-31`](jpx-market-closure-2026-12-31.md) ledger already ran this control and reported
   t = 0.86; this session's control set is constructed differently and lands at t = 0.48. Two
   independent constructions agreeing that the Monday premium is a confound is worth more than either
   alone — this leg is corroboration, and the finding belongs to that ledger.

7. **Nothing house-side is calendar- or Japan-keyed — SUPPORTED, re-verified not inherited.** A grep
   of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|jpx|tokyo|nikkei|closure|thanksgiving|bcp` returns **zero hits in both files**, run this
   session. No playbook can fire on this date in either direction.

8. **The corridor is mirrored, and both halves are already tracked — SUPPORTED.** Within five days of
   2026-11-23 the calendar carries **32** other events. The structurally interesting ones are the
   closures: Tokyo is dark Monday **11-23** while the US runs a full session carrying
   `treasury-2y-note-2026-11-23` (medium); the US is dark Thursday **11-26**
   (`thanksgiving-market-closure-2026-11-26`) and short Friday **11-27**
   (`thanksgiving-half-day-2026-11-27`, `sifma-bond-early-close-2026-11-27`) while Tokyo trades both —
   JPX's November 2026 panel lists only `Nov. 3` and `Nov. 23`. The calendar coincidence of the two
   Thanksgivings is a coincidence and carries no mechanism; it is noted so the next session does not
   mistake it for one.

9. **No new dated adjacent event to propose — a deliberate empty result.** The finalized file gives
   exchange-authoritative dates for every JPX holiday through 2027-05-05, and 2026-11-23 is the only
   one inside this event's five-day corridor. The one dated discovery worth recording is out of
   corridor and already banked by the sibling: JPX's footnote 7 closes **2027-09-20** (Respect for the
   Aged Day) for the FY2027 BCP window, `Not Open` / `Scheduled`. `2027-03-22` banked it ten months
   ago without proposing it; it stays banked here for the same reason, and belongs to whichever lane's
   corridor it eventually falls inside.

### What plays the conditions support

None. Tokyo is shut in every product, `symbols` is empty, impact is `low`, and the date is `estimate`.
The supported outputs are the execution guards already in the signals list — of which the **GTC/GTD
one is the only guard here that inverts a sibling's**, because JPX's rule is written for holiday
trading and states the converse for a day where it does not run — plus the corridor map and one
attribution warning: leg 4 and leg 6 are both **variance** findings with no directional content
whatsoever (the holiday-Tuesday *signed* mean is **+0.380%** on sd 2.15 — noise, and nothing anyone
should size to).

### Honest limits

- **Leg 4 is n = 12 and will stay small.** Two to four `Not Open` days a year means the treated arm
  grows slowly; a single 2026-11-24 observation cannot settle it either, which is why it is registered
  as a forward test rather than claimed as a result. What the test *does* rule out at this n is a
  large effect: the observed difference is 0.13 percentage points on a standard error of 0.34.
- **The finalized file gives labels, not reasons.** Leg 2 shows the nine non-New-Year `Not Open` days
  exist; it does not establish what closed them. Past JPX announcements were not fetched, so "not a
  BCP one-off" is a claim about the *frequency* of the state, not about the *cause* of every instance.
- **The blackout duration is cited, not recomputed.** The 75h15m figure for a BCP-closed Monday (05:30
  JST Sat 11-21 → 08:45 JST Tue 11-24) is [`2026-12-31`](jpx-market-closure-2026-12-31.md)'s
  arithmetic, reproduced here only as a citation.
- **No CME/SGX leg.** Nikkei futures also list offshore and would price 2026-11-23 regardless of OSE.
  Those calendars were not fetched (the sibling Good Friday ledger met eight HTTP 403s on CME), so
  nothing is asserted about them — none of the legs above needs them.
- **The rates claim is inherited, honestly.** The 40-year cover statistics in the signals list are
  `jgb-40y-auction-2026-11-25`'s measurement, quoted with its own null result intact, not re-run here.
- **Every corridor entry that matters here is `estimate`,** including this one. Estimates widen
  caution and license nothing.

## Stance & kill switches

**Stance (2026-09-09):** stand aside, permanently and structurally — this row exists to correct a
framing and hold four execution guards, not a view. Concretely: (a) the premise this entry was
proposed on is **true** — 2026-11-23 is a total Tokyo blackout in every listed product, verified from
three JPX primaries and corroborated by statute — but it is **empty**: the first cash session back
after a `Not Open` closure is indistinguishable from one after an `Open` closure (**1.536% vs 1.404%,
n = 12/39, t = 0.39**; 1.497% vs 1.360%, t = 0.38 matched on unmatched US sessions). (b) `Not Open` is
**routine**, two to four times a year on the exchange's own finalized file, so both sibling ledgers'
"BCP is the only mechanism" claim is wrong; and the closure is a property of the **FY2026 BCP window**
rather than of Labor Thanksgiving Day, which traded `Open` in 2022 and is scheduled `Open` for 2027.
(c) The same file **validates** the missing-bar holiday classification the sibling ledgers rest on
(62 entries, 65 gaps, zero mismatches), retiring the limit `2027-03-22` flagged. (d) The Monday-holiday
widening is a Tokyo-closure effect, not a Monday effect — replicating, by a differently constructed
control, the correction [`2026-12-31`](jpx-market-closure-2026-12-31.md) already made. Every statement
here carries the event's **`estimate`** label.

**Kill switches:**

- **The 2026-11-24 `^N225` cash session prints |close-to-close| at or above 2.09%** — the `Not Open`
  bucket's mean + 2 se. One observation in the direction that a total blackout is a different animal
  after all. Registered as **FT-jpx-market-closure-2026-11-23-1**, score by 2026-11-25.
- **JPX republishes 2027-11-23 as `Not Open`, or 2027-09-20 as `Open`** — the blackout would track the
  November holiday rather than the fiscal-year BCP window, and leg 3 collapses. Registered as
  **FT-jpx-market-closure-2026-11-23-2**, score by 2027-01-15.
- **JPX republishes 2026-11-23 as `Open`** (the window moves, or the test is cancelled) — the whole
  total-blackout premise goes, and this entry becomes an ordinary cash-only Japanese holiday.
- **The finalized file is reissued with the nine non-New-Year `Not Open` days relabelled or footnoted
  as BCP tests** — leg 2's correction is withdrawn and the siblings' framing is reinstated.
- **A house playbook keyed to Japanese sessions or holiday-adjacent bars is written and back-tested**
  — leg 7 goes stale and the stand-aside is re-argued on measured data rather than on absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 75 | **Initial research.** Canonical `src/domain/market-events/jpx-market-closure-2026-11-23.json` written from the sole proposal (`.from-jgb-40y-auction-2026-11-25`), which is now shadowed. Date verified off **three** JPX primaries re-fetched this session: derivatives table `November 23 \| Mon. \| Labor Thanksgiving Day \| **Not Open**⁶ \| **Finalized**` (HTTP 200, 48,483 B), market-holiday panel `Nov. 23 (Mon.)` (HTTP 200, 33,103 B), and — **new to this repo** — `List_of_Finalized_Holiday_Trading_Days_E.xlsx` (HTTP 200, 11,884 B, 77 entries 2022-09-23 → 2027-05-05), the exact file `jpx-market-closure-2027-03-22` recorded as unfetched. Stays `estimate` on the taxonomy gap alone. **Finding 1 — both siblings' "BCP is the only mechanism that flips a day to `Not Open`" is REFUTED:** 16 of 77 entries are `Not Open`; **nine** sit outside the New Year carve-out with no BCP footnote (Coming of Age Day 2023/2024/2025, Culture Day 2023, Mountain Day sub 2024, Respect for the Aged 2024/2025, Culture Day sub 2024) — **2–4 total blackouts a year**, routine. **Finding 2 — the blackout is the FY2026 BCP *window*, not the holiday:** 2022-11-23 `Open`, 2025-11-24 sub `Open`, **2027-11-23 scheduled `Open`**; both published windows (FY26 Nov 21–23, FY27 Sep 18–20) are Sat–Sun–Mon, costing exactly one market day. **Finding 3 — the total-blackout distinction is EMPTY:** first `^N225` cash session back after `Not Open` **1.536%** (n=12, se 0.278) vs `Open` **1.404%** (n=39, se 0.194), **t=0.39**; matched to one unmatched-US session, 1.497% (n=9) vs 1.360% (n=34), **t=0.38**. **Finding 4 — the missing-bar classification VALIDATES:** 62 in-window finalized entries all absent from the cash series, all 65 weekday cash gaps explained, **0 mismatches either direction** — `2027-03-22`'s honest limit is retired. **Replication (not a find):** reproduced `2027-03-22` leg 5 exactly (1.492%/0.929%, n=151/1,170, **t=4.26** vs their 4.24), then a differently-built control gives **t=0.48** (1.492 vs 1.411, n=117) — corroborating `2026-12-31`'s t=0.86; \|c2c\| by unmatched-US count 1.021%/1.457%/2.061% at 0/1/3. Guard that **inverts** a sibling's: on a `Not Open` day JPX states GTC/GTD orders **do not** expire. Adjacency — peers: n/a (`symbols: []`); macro: corridor holds FOMC minutes + APEC 11-18, Japan CPI + quarterly opex 11-20, PCE + Q3 GDP 2nd + Beige Book 11-25; VIX **15.72** (`^VIX` close 2026-09-08); geopolitical: `apec-leaders-shenzhen-2026-11-18`, nothing dated to the closure itself; tape: mirrored week — Tokyo dark Mon 11-23 (US open, `treasury-2y-note-2026-11-23`), US dark Thu 11-26 and short Fri 11-27 while Tokyo trades. Playbook grep `holiday\|jpx\|tokyo\|nikkei\|closure\|thanksgiving\|bcp` → **0 hits in both**. **No proposal:** 2026-11-23 is the only JPX holiday in corridor on the exchange's own file; 2027-09-20 (FY27 BCP) stays banked, out of corridor, as `2027-03-22` left it. Yahoo 429 on first attempt, succeeded on the repo UA — not a blocked source, not in `probe-ref.blocked`. | Initial stance set: **stand aside** (structural row only). Registers **FT-jpx-market-closure-2026-11-23-1** and **-2**. | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-jpx-market-closure-2026-11-23.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
