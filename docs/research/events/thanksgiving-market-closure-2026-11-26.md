# US markets closed — Thanksgiving Day (Thursday 2026-11-26), the year's shortest closure and its hardest vol mark-down — thanksgiving-market-closure-2026-11-26

**Kind:** sector · **Date:** 2026-11-26 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table, re-fetched direct 2026-09-09; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["consumer-confidence-2026-11-24","fhfa-hpi-2026-11-24","beige-book-2026-11-25","durable-goods-2026-11-25","gdp-q3-2026-second-2026-11-25","new-home-sales-2026-11-25","pce-2026-11-25","advance-economic-indicators-2026-11-27","japan-cpi-tokyo-flash-2026-11-27","thanksgiving-half-day-2026-11-27","fomc-blackout-start-2026-11-28","aws-reinvent-2026","chicago-pmi-2026-11-30","dallas-fed-mfg-2026-11-30","russell-recon-lockdown-2026-11-30","russell-style-month-end-capping-effective-2026-11-30","construction-spending-2026-12-01","dallas-fed-tssos-2026-12-01","georgia-senate-runoff-2026-12-01","ism-manufacturing-2026-12-01","jolts-2026-12-01"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/schedule/2026/home.htm","status":"403","at":"2026-09-09"},{"url":"https://www.dol.gov/ui/data.pdf","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside on the date; carry one correction, one causation proof and one live trap.**
The closure is real and triple-primaried — NYSE's holiday table gives **Thursday 2026-11-26** as a
full close, the OCC marks it a hatched *Exchange/OCC holiday*, SIFMA recommends a full US bond
close — and it stays `estimate` on the taxonomy alone. Everything interesting is what it does to
the days around it, and the first fact is the opposite of how the holiday reads: **this is the
shortest closure of the US year.** Wed 16:00 ET → Fri 09:30 ET is **41.5 hours** shut, against
**65.5** for an ordinary weekend and **92.5** for Christmas — Thanksgiving is the only US full
closure sitting mid-week with a session on both sides, so the market is shut **24 hours less than
it is every weekend**. And yet its vol mark-down is the **largest of the ten US closures**: VIX
falls **5.83% mean / 6.56% median** over the four sessions into the Wednesday before, down in
**25 of 35** years, **p = 0.017** against a 52.4% base over 9,229 four-session windows. That is
the **correction**: the sibling `christmas-market-closure-2026-12-25` named this shape *"the
turn-of-year vol re-mark"*; it reproduces a month earlier with no year-end anywhere near it, and
at **8 of 10** US closures across the whole calendar. It is a **closure** effect — the mark tracks
the one trading day each closure removes from VIX's 30-calendar-day window, not the wall clock.
The **reopen pop does not survive its base rate** (+2.97%, 20/35, p = 0.135); the mark-up accrues
over the next four sessions (+5.34%), not in the first print. Separately, the release-compression
**causation** question that sibling handed forward is now answered from Treasury's own auction
record: the Thursday bill slate moved to the Wednesday before Thanksgiving in **7 of 7** years,
and **zero auctions of any kind** have been held on Thanksgiving Thursday in **17** consecutive
years. Nothing here is tradeable: `impact: low`, `symbols: []`, the date is **`estimate`**, and a
re-grep of both house playbook docs returns **0 hits** on holiday keying. Output is one correction,
one causation proof, one dated promotion path, a live methodological trap, one proposed calendar
entry and three forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session 78 days out is not a position | High | D-78. `symbols: []`, `impact: low`, date `estimate`; `grep -icE 'holiday\|thanksgiving\|black.?friday\|half.?day\|early.?close\|closure'` over `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0 and 0**, run this session rather than inherited | A house playbook keyed to holiday-adjacent sessions being written and back-tested before **2026-11-25** — the "nothing is calendar-keyed" leg dies and this sheet gets rebuilt on measured data |
| This week | **Stand aside; bank the corrected shut-time budget before it is re-derived wrong** | High | The live tape this week is the September macro block. The thing worth writing down now: this closure is **41.5 h** shut — the *shortest* of 2026 (weekend 65.5, Labor Day 89.5, Christmas 92.5) — while Wed 16:00 → Mon 09:30 is **113.5 h wall clock with 3.5 tradeable hours**, a window 2026 contains exactly **twice** (the Christmas configuration is identical to the tenth of an hour) | The 41.5-hour figure failing to reproduce from NYSE's own 2026 hours, or NYSE republishing 2026-11-27 with hours other than 13:00, observed before **2026-11-20** |
| This month | **Watch the promotion date, which is real and dated here for the first time** | Medium | `TSY:` is already in `CONFIRMED_PREFIX` (`event-scan-validation.mjs:15`), and Treasury announces the displaced Wednesday bill slate **one day ahead** in Thanksgiving weeks (2023-11-21, 2024-11-26, 2025-11-25). So primary `TSY:` evidence naming **2026-11-25** lands about **2026-11-24** — the first date this entry is promotable on evidence rather than on a taxonomy ruling. No sibling closure entry has had one | Treasury's November 2026 bill announcement placing the 4-Week/8-Week slate on **Thursday 2026-11-26** after all — the displacement rule breaks on the instance that matters, and the promotion path closes. Registered as **FT-thanksgiving-market-closure-2026-11-26-1** |
| This quarter | **Read the pre-closure vol mark-down as scheduled, not as information — this is the call with teeth** | Medium | Measured this session on 9,232 CBOE VIX closes with FRED as the session filter: run-in **−5.83% mean / −6.56% median**, down **25 of 35**, **p = 0.017**; the same window at **8 of 10** US closures is negative, and the neighbouring November windows are not (−2.78%, −1.91%, +2.96% at −3, −2, −1 weeks). Confidence is medium, not high, because the mechanism — one trading day removed from a 30-calendar-day window — is inference, not a sourced convention | VIX closing **2026-11-25 at or above its 2026-11-19 close** — the down-leg's first out-of-sample miss (base rate 25/35). Registered as **FT-thanksgiving-market-closure-2026-11-26-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-11-26 in any branch. It is a closed
  session; the date is `estimate`, and date-keyed action requires `confirmed` regardless.
- **Attribution guard (the run-in, 2026-11-19 → 11-25):** a softening VIX into the Wednesday is the
  *expected* shape of a closure, not evidence the tape has calmed. It happens in 25 of 35 years and
  at 8 of the 10 US closures. Realized risk is unchanged; one trading day left the window.
- **Attribution guard (the reopen, 2026-11-27):** the mirror-image expectation is **not** supported.
  The break print is +2.97% mean, up in only 20 of 35 (**p = 0.135** against a 46.4% base) — a
  higher VIX on the half day is an ordinary session's worth of noise. The mark-up is measurable only
  by **+4 sessions** (+5.34%), i.e. by **2026-12-03**.
- **Execution guard — three closes, three times, and bonds outlive equities.** NYSE equities out at
  **13:00** on 2026-11-27, eligible options **13:15**, SIFMA fixed income **14:00**, NYSE
  American/Arca/National/Texas late sessions **17:00**. Every listed bond proxy prints its official
  close an hour before the cash tape it tracks stops trading.
- **The corridor's cost is Wednesday 2026-11-25, not the closure.** Read off this repo's own **428**
  canonical entries, 11-25 carries **five confirmed** US prints — `pce` (high),
  `gdp-q3-2026-second` (high), `beige-book`, `durable-goods`, `new-home-sales` — the **second most
  confirmed-dense date in the entire calendar** (behind 2026-09-16's six) and the only one of the
  top three where *every* entry is confirmed. Behind it: a dark Thursday, a 3.5-hour Friday, a
  weekend.
- **And the compression is causal, not coincidence.** Treasury's 4-Week/8-Week bill slate prices on
  a Thursday **96.5%** of the time since 2019 and moved to the Wednesday before Thanksgiving in
  **7 of 7** years; **0 of 17** years since 2009 held any auction on Thanksgiving Thursday.
- **Do not measure this corridor off CBOE's `VIX_History.csv` unfiltered.** It publishes a **phantom
  row on Thanksgiving Thursday every year since 2022**, and the values differ from both neighbours
  (2022: Wed **20.35** → phantom **20.42** → Fri **20.50**), so a dedupe-on-repeated-value filter
  will not catch them. Every number here uses FRED's session record as the filter.
- **Watch (dated)** — five confirmed prints **11-25** (PCE + GDP-Q3-2nd both high) · Treasury's
  displaced bill announcement **~11-24**, auction **11-25** · **this closure 11-26** · half session
  **11-27** (equities 13:00, bonds 14:00) · FOMC blackout opens **11-28** · Chicago PMI + Russell
  month-end capping **11-30** · ISM + Georgia runoff **12-01** · the +4 mark-up window closes
  **12-03** · jobs **12-04**.

## Initial research

### The question

This id reached the calendar as **one sibling proposal**, not as a seeded entry — filed by the
`christmas-market-closure-2026-12-25` initial research on 2026-09-08 as an explicit hand-off from a
third lane. Per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), this session read it first
and then wrote the canonical file. Two sibling ledgers already own most of this corridor: the
half-day ledger measured the **Friday** session exhaustively, and the Christmas ledger measured the
**vol behaviour around a closure** and stated its mechanism as inference. So the question this
session is actually in a position to answer is not "what is Thanksgiving" but: **does the Christmas
ledger's finding survive an out-of-sample closure, and is the release compression both siblings
observed actually caused by the closure?**

**One-line verdict:** the finding survives and its **label does not** — the vol mark-down is a
property of *closures*, not of the turn of the year, and it does **not** scale with how long the
market is shut; and the compression is **causal**, proven from Treasury's own auction record
against a primary that depends on no holiday calendar at all.

### Method

Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) —
`symbols: []`, so no symbol-keyed instrument applies and no closure-shaped instrument exists in
`scripts/research/`. Every primary was re-fetched this session and every statistic computed here;
nothing was inherited from either sibling ledger or from the proposal.

- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302, 109,180 bytes. Holiday table
  and all four footnotes parsed cell by cell.
- **OCC** `www.optionseducation.org/api/expirationcalendar` — HTTP 200, 34,871 bytes.
- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, 299,272 bytes; US,
  UK and Japan panels parsed out of the embedded payload and attributed by content.
- **Treasury** `api.fiscaldata.treasury.gov` `auctions_query` — HTTP 200, 942,253 bytes, **6,023
  auctions 2009-01-05 → 2026-09-10** with announcement dates. The causation test.
- **CBOE** `cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv` — HTTP 200, 472,411
  bytes, 1990-01-02 → 2026-09-08. Used for VIX levels and **audited** as a session record.
- **FRED** `fredgraph.csv?id=NASDAQCOM` (280,556 b) and `?id=SP500` — the independent session record
  and the equity leg.
- **US Census** `census.gov/economic-indicators/calendar-listview.html` — HTTP 200, 91,396 bytes.
- **This repo's own calendar** — all **428** canonical entries read and ranked by date, to measure
  release density rather than assert it.
- **Blocked, recorded rather than worked around** (`probe-ref.blocked`): `bls.gov/schedule/2026/home.htm`
  **403** and `dol.gov/ui/data.pdf` **403**, both with browser headers. The known lane blind spot
  (see [`ppi-2026-11-13.md`](ppi-2026-11-13.md)). Consequence: the jobless-claims displacement — the
  most-cited example of an agency moving for this holiday — is **not asserted here**. Treasury
  carries the causation leg instead, on a source that answered.

### Conviction legs, tested

1. **The date is right, on three primaries plus statute — SUPPORTED (and still `estimate`).** NYSE's
   Thanksgiving row parses as `["Thursday, November 26***", "Thursday, November 25***", "Thursday,
   November 23*** "]` for 2026/2027/2028 — a full closure, no observance shift. The OCC marks
   2026-11-26 `{"holiday":{"description":"Exchange/OCC holiday","hatched":true}}`, and that marker
   is meaningful rather than generic because the same file labels 2026-11-11 (bond-only) `"Bank
   holiday"`, unhatched. SIFMA's 2026 US panel gives *"Thanksgiving Day | Thursday, November 26,
   2026"* a full fixed-income close. 5 U.S.C. 6103 plus weekday arithmetic reproduces it. **Why it
   stays `estimate`:** `CONFIRMED_PREFIX` has no slot for an exchange's or a trade association's
   hours page, and this lane may not self-confirm.

2. **A small IA observation the calendar had backwards — SUPPORTED, from NYSE's own typography.**
   NYSE hangs footnote `***` on the **Thanksgiving Day row**, and the footnote's text describes the
   *following Friday*. The exchange treats the half day as a footnote to the closure. This calendar
   carried `thanksgiving-half-day-2026-11-27` and **not** the closure — the footnote without the
   row it hangs off. That is exactly the inversion the seeding proposal named, and NYSE's own page
   is the receipt for it.

3. **This is the shortest closure of the US year — SUPPORTED, and it is the counter-intuitive
   result.** Continuous market-shut time, computed from NYSE hours (09:30–16:00, half days to
   13:00):

   | Closure | Last close → next open | Hours shut |
   |---|---|---|
   | **Thanksgiving 2026-11-26** | Wed 11-25 16:00 → Fri 11-27 09:30 | **41.5** |
   | *ordinary weekend* | Fri 16:00 → Mon 09:30 | *65.5* |
   | Thanksgiving half day → Monday | Fri 11-27 13:00 → Mon 11-30 09:30 | 68.5 |
   | Labor Day 2026-09-07 | Fri 09-04 16:00 → Tue 09-08 09:30 | 89.5 |
   | New Year 2027-01-01 | Thu 12-31 16:00 → Mon 01-04 09:30 | 89.5 |
   | Christmas 2026-12-25 | Thu 12-24 13:00 → Mon 12-28 09:30 | 92.5 |

   Thanksgiving is the **only** US full closure that sits mid-week with a session on both sides, so
   the market is shut **24 hours less than it is every weekend**. The *corridor* is a different
   number and worth having beside it: Wed 11-25 16:00 → Mon 11-30 09:30 is **113.5 hours wall clock
   with 3.5 tradeable hours (3.1%)** — and the Christmas configuration (Wed 12-23 16:00 → Mon 12-28
   09:30) is **113.5 hours with 3.5 tradeable** as well. 2026 contains that window exactly twice,
   identical to the tenth of an hour.

4. **The pre-closure vol mark-down is real, and it is the largest of the ten — SUPPORTED
   (p = 0.017).** VIX over the four sessions into the last full session before each US closure,
   1990–2025, sessions taken from FRED:

   | Window | Mean | Median | Down |
   |---|---|---|---|
   | **−4 → the Wednesday before Thanksgiving** | **−5.83%** | **−6.56%** | **25 / 35** |
   | 3 weeks earlier (same construction) | −2.78% | −5.06% | 23 / 36 |
   | 2 weeks earlier | −1.91% | −2.38% | 22 / 36 |
   | 1 week earlier | +2.96% | +0.20% | 18 / 36 |
   | 1 week *after* (the mark-up leg) | **+4.72%** | +3.12% | 10 / 35 |
   | *unconditional 4-session window (n = 9,229)* | *+0.77%* | *−0.61%* | *52.4%* |

   `P(≥25 of 35 down | p = 0.524) = 0.0173`. The shape is a **V centred on the closure**, not a
   November-long drift: the two windows before it are milder, the one after it is sharply positive.
   The mean is fat-tailed (2025 **−34.94%**, 2008 **−32.08%**) — the median and the 25/35 count are
   the load-bearing statistics, and neither depends on those two years.

5. **It is a closure effect, not a turn-of-year one — a CORRECTION to how the Christmas ledger's
   finding reads.** That ledger titled the same shape *"the turn-of-year vol re-mark"* and measured
   the run-in at **−5.67%**. Run here at every US equity closure, 1990–2025:

   | Closure | n | Run-in (−4 → pre) | Down | Break print | pre → +4 |
   |---|---|---|---|---|---|
   | Thanksgiving | 35 | **−5.83%** | 25/35 | +2.97% | +5.34% |
   | Christmas | 35 | −5.81% | 25/35 | +2.14% | +8.06% |
   | July 4 | 36 | −5.60% | 24/36 | +4.30% | +2.71% |
   | Presidents | 36 | −5.31% | 27/36 | +5.34% | +6.94% |
   | Memorial | 36 | −4.24% | 27/36 | +5.52% | +5.37% |
   | Good Friday | 35 | −4.13% | 25/35 | +3.88% | −0.39% |
   | MLK | 28 | −3.42% | 18/28 | +5.11% | +11.15% |
   | Juneteenth | 4 | −1.09% | 2/4 | +2.46% | −5.94% |
   | Labor Day | 36 | −0.56% | 20/36 | +5.87% | +4.00% |
   | New Year | 30 | **+8.10%** | 5/30 | −0.44% | −1.68% |

   Negative at **8 of 10**, spread across February, April, May, June, July, November and December.
   The Christmas ledger reproduces here to within 0.14 points on the run-in and its break print to
   within 0.2 (its all-years figure was +2.34% on n=36; this session counts n=35 under a stricter
   adjacency filter). **New Year's is the one clean exception, and it has a mechanical reason
   rather than being noise:** its own −4 → pre window *contains the Christmas closure's mark-up
   leg*, so the two overlap and the sign flips. So the sibling's **mechanism** — calendar-day decay
   accounting, which it flagged honestly as inference — is *strengthened* by replicating across the
   calendar year; only its **seasonal attribution** fails.

6. **And it does not scale with the length of the shutdown — SUPPORTED, and this is what pins the
   mechanism.** Thanksgiving is shut **41.5 hours**, the least of any closure (leg 3), and Labor
   Day **89.5**, more than twice as long. Their run-ins are **−5.83%** and **−0.56%** — the
   *shortest* closure marks down hardest and the longer one barely at all. What every closure in
   leg 5 does share is that it removes **exactly one trading day** from VIX's 30-calendar-day
   window, and the run-ins cluster in a −3% to −6% band consistent with that. Wall-clock gap length
   explains nothing here; lost trading days explains the band. Stated as inference, not as a sourced
   convention — which is why the quarter-horizon confidence is medium.

7. **The reopen pop does NOT survive its base rate — NOT SUPPORTED, and the negative matters.**
   Wed → Fri across the closure: mean **+2.97%**, up **20 of 35 (57.1%)**. VIX rises on **46.4%** of
   all 9,232 single sessions since 1990, so `P(≥20 of 35 | p = 0.464) = 0.135`. The break print is
   an ordinary session. The mark-up is only measurable by **+4 sessions** (+5.34%, 23/35). This is
   the asymmetry the two attribution guards are written against: the **down-leg** into the closure
   is a scheduled mark you can expect; the **reopen pop** is not.

8. **The release compression is CAUSAL — SUPPORTED, and it closes an open question the Christmas
   ledger handed forward.** Its leg 4 established the stack and said in terms that whether agencies
   pull releases forward *because* of the closure was not tested. Tested here on Treasury's own
   auction record, a primary depending on no holiday calendar:

   - The **4-Week** and **8-Week** bills price on a **Thursday 96.5%** of the time since 2019
     (n = 402 each).
   - In **7 of 7** Thanksgiving weeks 2019–2025 the entire slate moved to the **Wednesday before**,
     joined since 2022 by the 17-Week (itself a 98.5%-Wednesday auction) — a **triple** slate on one
     morning.
   - **0 of 17** years since 2009 held an auction of **any** kind on Thanksgiving Thursday.

   Treasury moves for the closure. This does not prove BEA or Census do — but it removes "the
   cadence simply lands there" as a general explanation, on at least one issuer.

9. **The `TSY:` promotion path is real and dated — a NEW find, and no sibling closure entry has
   one.** `TSY:` is already in `CONFIRMED_PREFIX` (`scripts/event-scan-validation.mjs:15`). The
   Christmas ledger's leg 2 established that the auction technique is **retrospective only** —
   Treasury publishes announced auctions roughly a week out, so a closure 100+ days away cannot be
   proven from it. True, and reproduced (the series ends at 2026-09-10). But the displaced
   Thanksgiving slate is announced **one day ahead**: 2023-11-21 for 11-22, 2024-11-26 for 11-27,
   2025-11-25 for 11-26. So a `TSY:`-prefixed primary naming **Wednesday 2026-11-25** becomes
   available around **2026-11-24** — a dated, mechanical route to `confirmed` that needs no taxonomy
   ruling. That is a **better** use of the technique than the one the sibling correctly ruled out.

10. **The corridor's density is real, and it sits on the Wednesday — SUPPORTED against the whole
    corpus rather than asserted.** Across all **428** canonical entries, **2026-11-25** carries
    **five confirmed** prints — `pce` (high), `gdp-q3-2026-second` (high), `beige-book`,
    `durable-goods`, `new-home-sales`. Only **2026-09-16** carries more (six), and 11-25 is the only
    date in the top three where *every* entry is confirmed. Then a dark Thursday, a 3.5-hour Friday
    carrying one `estimate` 8:30 print, and `fomc-blackout-start-2026-11-28`.

11. **The sibling's banked CBOE trap is LIVE on this event, not latent — an extension worth having.**
    The Christmas ledger established that `VIX_History.csv` publishes rows on shut US holidays since
    2022 and called it *"latent, not live"*, because it happens to be correct for Christmas.
    **Thanksgiving is one of the six it gets wrong**, so on this ledger the trap is load-bearing.
    Re-verified here and extended with a detail that ledger did not have — the phantom values are
    **independent prints, not copies of a neighbouring close**:

    | Year | Wed close | Thanksgiving-Thursday phantom | Fri close |
    |---|---|---|---|
    | 2022 | 20.35 | **20.42** | 20.50 |
    | 2023 | 12.85 | **12.80** | 12.46 |
    | 2024 | 14.10 | **13.90** | 13.51 |
    | 2025 | 17.19 | **17.21** | 16.35 |

    So a filter that dedupes on repeated values will not catch them, and a lane measuring the break
    print off the file unfiltered would read Wed → *phantom* as the closure gap. Every statistic in
    this ledger uses FRED's Nasdaq series as the session filter and CBOE only for the level. FRED
    has **no** row on any of these four dates.

12. **The equity leg through the corridor is up 80% of the time — MIXED, registered rather than
    believed.** Nasdaq Composite over the same −4 → +4 window (2026: **11-19 → 12-03**): mean
    **+1.20%**, median +1.61%, up **28 of 35**. The unconditional 8-session base is **59.6%** up
    over 9,230 windows, so `P(≥28 of 35 | p = 0.596) = 0.0089`. It clears 0.05 and survives a
    Bonferroni correction across the five hypotheses tested here (0.05/5 = 0.010) — **barely**. It
    is reported as an observation with a forward test attached, not as a finding, and it licenses
    nothing: `impact: low`, `symbols: []`, date `estimate`.

13. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.**
    `grep -icE 'holiday|thanksgiving|black.?friday|half.?day|early.?close|closure'` over
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` returns **0 and 0**,
    run this session. No playbook can fire on this date in either direction.

### What plays the conditions support

None, and that is the honest output rather than a hedge. `symbols` is empty, impact is `low`, the
date is `estimate`, and no playbook keys on it. What the conditions support:

- **A corrected shut-time budget** — 41.5 hours, the year's shortest, not the long gap the holiday
  reads as; and a 113.5-hour / 3.5-tradeable-hour corridor that 2026 contains twice.
- **Two attribution guards** whose asymmetry is the point: expect the run-in mark-down, do **not**
  expect the reopen pop.
- **One causation proof** that upgrades a sibling's open question, and **one dated promotion path**
  that gets this entry to `confirmed` without a taxonomy ruling.
- **One live methodological trap** and **one proposed calendar entry**, each written so the next
  lane does not re-derive it.

### Honest limits

- **The date is `estimate` and stays there.** Three primaries do not promote it; only a taxonomy
  ruling or an `IR:`/`BLS:`/`FED:`/`TSY:` source would — see leg 9 for when the last becomes
  available.
- **The BLS and DOL legs are missing, not worked around.** Both returned **403** to this runner
  (recorded in `probe-ref.blocked`), so the jobless-claims displacement — the most-cited example of
  an agency moving for this holiday — is **not asserted**. Treasury carries leg 8 alone.
- **Leg 6's mechanism is inference.** "One trading day removed from a 30-calendar-day window" is
  consistent with the −3% to −6% band and with the wall-clock non-relationship, but no published
  VIX-calculation convention about holidays was read this session, and none was sought.
- **Leg 8 proves Treasury, not the statistical agencies.** BEA's and Census's November scheduling is
  untested; leg 10 establishes the stack, not its cause on the release side.
- **Multiple comparisons.** Five hypotheses were tested; two cleared 0.05 (legs 4 and 12) and leg 12
  clears the corrected threshold only barely. Leg 12 is registered, not promoted, for exactly that
  reason.
- **n is small.** 35 Thanksgivings, one observation per year, overlapping macro regimes. The p-values
  are binomial against unconditional base rates, not a corrected panel.
- **Futures were not researched.** CME hours on 2026-11-26/27 are not asserted; the guards cover
  NYSE, OCC and SIFMA-recommended bond hours only.
- **Eight events in this corridor are `estimate`,** including this one and the proposal. Estimates
  widen caution and license nothing.

## Stance & kill switches

**Stand aside.** This is a structural row: a scheduled full closure 78 days out, `estimate`,
`symbols: []`, `impact: low`. No entry, exit or hedge is keyed to it, and date-keyed action would
require `confirmed` in any case. The stance is not "nothing to see" — it is that everything worth
carrying is a **budget**, a **guard**, a **correction** or a **proof**, none of which is a position.

The four findings the stance rests on, each with what kills it:

- **This is the year's shortest closure (41.5 h shut), and the vol mark-down does not scale with
  that.** Killed by the hours failing to reproduce from NYSE's own 2026 table, observed before
  **2026-11-20**.
- **The pre-closure vol mark-down is a scheduled mark, not information — and it is a closure effect,
  not a turn-of-year one.** Killed by VIX closing **2026-11-25 at or above its 2026-11-19 close**
  (base rate 25/35). Registered as **FT-thanksgiving-market-closure-2026-11-26-2**.
- **Treasury displaces its Thursday bill slate for the closure, 7 of 7.** Killed by Treasury's
  November 2026 announcement putting the 4-Week/8-Week slate on **Thursday 2026-11-26**, or by any
  auction being dated on the closure. Registered as
  **FT-thanksgiving-market-closure-2026-11-26-1**.
- **CBOE's VIX file carries a phantom Thanksgiving row with an independent value.** Killed by CBOE
  publishing **no** row dated 2026-11-26, or by the row exactly equalling the 2026-11-25 close,
  observed on any refetch before **2026-12-04**.

The equity-leg observation (leg 12) is registered as
**FT-thanksgiving-market-closure-2026-11-26-3** rather than carried as a finding; at p = 0.0089
against a corrected threshold of 0.010 it is one out-of-sample print away from either state.

Registered this session in
[`forward-tests/thanksgiving-market-closure-2026-11-26.md`](../forward-tests/thanksgiving-market-closure-2026-11-26.md).
All three are measurements of a scheduled structure, registered to be scored — none is a position,
and the `estimate` label licenses no entry either way.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 78 | **Initial research**; canonical `<id>.json` written after reading the one `from-christmas-market-closure-2026-12-25` proposal. Date **triple-primaried at HTTP 200** — NYSE table (109,180 b; footnote `***` hangs on the Thanksgiving row and describes the *following* Friday, so NYSE itself treats the half day as a footnote to the closure this calendar was missing), OCC hatched *Exchange/OCC holiday* (vs unhatched *Bank holiday* for 11-11), SIFMA 2026 US panel — plus 5 U.S.C. 6103. Stays `estimate` on the taxonomy gap; prefix `NEWS:`. **Computed:** this is the year's **shortest** closure — **41.5 h** shut (Wed 16:00 → Fri 09:30) vs a weekend's 65.5, Labor Day 89.5, Christmas 92.5 — the only US closure with a session on both sides; the corridor Wed→Mon is **113.5 h / 3.5 tradeable**, a window 2026 holds twice (Christmas is identical). **Headline correction:** the run-in vol mark-down reproduces (**−5.83%** mean / **−6.56%** median, **25/35** down, **p=0.017** vs a 52.4% base over 9,229 windows) but is **not turn-of-year** — negative at **8 of 10** US closures across the calendar, and the neighbouring November windows are milder (−2.78/−1.91/+2.96 at −3/−2/−1 weeks) with +4.72% a week after. New Year's is the lone exception and overlaps Christmas's mark-up leg. **And it does not scale with the gap:** Thanksgiving 41.5 h → −5.83%, Labor Day 89.5 h → −0.56%; what they share is one lost trading day. **Negative find:** the reopen pop fails its base rate (+2.97%, **20/35**, p=0.135); the mark-up needs +4 sessions (+5.34%). **Causation proof closing the Christmas ledger's open leg 4:** Treasury 4-Week/8-Week bills are Thursday **96.5%** since 2019 yet moved to the Wednesday before Thanksgiving in **7/7** years, and **0/17** years held any auction on the holiday (6,023 auctions, fiscaldata HTTP 200). **New:** a dated `TSY:` promotion path — the displaced slate is announced **1 day ahead**, so primary evidence lands ~**2026-11-24**. **Trap extended:** CBOE's phantom Thanksgiving rows (2022-25) carry **independent** values, not copies of a neighbour (2022 20.35/20.42/20.50) — latent for Christmas, **live here**; FRED used as the session filter throughout. **Corpus:** 2026-11-25 carries **5 confirmed** prints, 2nd-densest of 428 entries and the only top-three date fully confirmed. Adjacency — peers n/a (`symbols: []`); macro: the 11-25 stack, `fomc-blackout-start-2026-11-28`; VIX **15.72** (2026-09-08 close); geopolitical: none dated; tape: equities 13:00 / options 13:15 / bonds 14:00 / late sessions 17:00 on 11-27. **Blocked:** bls.gov **403**, dol.gov **403** — the jobless-claims leg is unasserted, not substituted. Proposes `sifma-bond-early-close-2026-11-27` (`estimate`), the seeding proposal's explicit hand-off and the only 2026 SIFMA early close with no entry. | Initial stance set: **stand aside** (structural row only). Registers **FT-thanksgiving-market-closure-2026-11-26-1**, **-2** and **-3**. | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
