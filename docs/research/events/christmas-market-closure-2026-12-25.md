# US markets closed — Christmas Day (Friday 2026-12-25), and the turn-of-year vol re-mark it front-loads — christmas-market-closure-2026-12-25

**Kind:** sector · **Date:** 2026-12-25 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table, fetched direct 2026-09-08; the `estimate` label is a taxonomy question, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-minutes-2026-12-23","boj-summary-of-opinions-2026-12-28","christmas-eve-half-day-2026-12-24","consumer-confidence-2026-12-22","consumer-confidence-2026-12-29","durable-goods-2026-12-23","fhfa-hpi-2026-12-29","fomc-minutes-2026-12-30","gdp-q3-2026-third-2026-12-23","japan-cpi-tokyo-flash-2026-12-25","new-home-sales-2026-12-23","pce-2026-12-23","sifma-japan-early-close-2026-12-28","sifma-uk-bond-market-closure-2026-12-28"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside on the date; carry three corrections and one attribution guard.** The
closure is real and triple-primaried — NYSE's own holiday table gives **Friday 2026-12-25** as a
full close with footnote `****` naming Thursday 12-24 a 1:00 p.m. ET half session, the OCC marks
12-25 a hatched *Exchange/OCC holiday*, and SIFMA recommends a full US bond close the same day.
The interesting part is what the closure does to everything around it. **December 2026 is a
22-session month — the record maximum** (1990–2025 range 19–22), verified 5 of 5 against every
prior Friday-Christmas December, so it must not be budgeted as a short month; it is merely the
shortest 22 by hours (**140.0** vs December 2027's 143.0). **The last full session, Wed 2026-12-23,
carries four confirmed US macro prints including PCE** — one of only 8 dates out of 90 in this
calendar to carry four or more — and then the tape gives you a 3.5-hour session, a dark Friday and
a weekend before you can adjust. And the headline correction, which sharpens rather than
contradicts the 2027 sibling ledger: the **+4.32% VIX pop across a 3-day Christmas gap is not
caused by the gap.** VIX marks *down* **−5.67%** into the break (26 of 36 years) and back *up*
**+8.30%** by four sessions after it (30 of 36, the **80th percentile** of all 9,263 four-session
windows since 1990, against an unconditional mean of +0.77%), while the round trip nets to
**+1.09%** — indistinguishable from noise. The gap length decides only how much of the re-mark
lands in the first print. **Nasdaq shows no counterpart at all** (+0.11% across the break, every
one of 20 three-day-gap years inside ±1.4%). So a post-Christmas VIX pop is a scheduled mark, not
news. Nothing here is tradeable: the date is `estimate`, `symbols: []`, and no house playbook is
calendar-keyed. Output is three corrections, two execution guards, two proposed calendar entries,
one methodological trap banked for the whole closure family, and three registered forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session 108 days out is not a position, and there is nothing to size | High | D-108. `symbols: []`, `impact: low`, and a grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `holiday\|christmas\|closure\|half-day\|early close` returns **0 hits in both**, run this session rather than inherited from a sibling ledger | A house playbook that keys on holiday-adjacent sessions being written and back-tested before **2026-12-23** — the "nothing is calendar-keyed" leg goes stale and this sheet gets rebuilt on measured data |
| This week | **Stand aside; bank the session budget before anyone re-derives it wrong** | High | The live tape this week is the September macro block, not a December holiday. The one thing worth writing down now: December 2026 is **22 sessions / 140.0 equity hours**, tying the 1990–2025 maximum, not a shortened month — and 2026-12-23 is a **four-confirmed-print** session with nothing behind it until 12-28 | The 22-session count failing to reproduce from NYSE's own 2026 table plus FRED's session record, or 2026-12-23's four confirmed prints being rescheduled by BEA/Census, either observed before **2026-12-18** |
| This month | **Watch the promotion question, and note the Treasury cross-check is retrospective only** | Medium | Three independent primaries now date this event (NYSE table, OCC hatched holiday marker, SIFMA US panel) and it still reads `estimate`, because this lane confirms only on `IR:`/`BLS:`/`FED:`. The seeding proposal asked this lane to reproduce the labor-day Treasury-auction proof; it was **run and is unavailable by construction** — `api.fiscaldata.treasury.gov` returned HTTP 200 on 2026-09-08 but publishes only announced auctions, latest **2026-09-10** | A ruling on whether the confirmed `OCC:` prefix covers that calendar's **holiday** markers as well as its expirations, landed before **2026-11-08** — a yes promotes this and every sibling closure entry at once. Or Treasury announcing its December bill slate (expected ~**2026-12-14**), which makes the mechanical proof available before the event |
| This quarter | **Treat the post-break VIX pop as a scheduled mark, not information — this is the one call with teeth** | Medium | Measured this session on 9,267 CBOE VIX sessions: run-in **−5.67%** (26/36 down), break print **+4.32%** on a 3-day gap vs **−0.15%** on a 1-day gap, convergence to **+9.17%** / **+7.21%** by four sessions after — and a round trip of **+1.09%**, median +1.27%, 19/36 positive, against an unconditional four-session mean of +0.77%. The equity leg has no counterpart. Confidence is medium, not high, because the mechanism (holiday calendar-day decay accounting) is inference, not a sourced convention | VIX closing **at or below** its 2026-12-24 level on **2026-12-31** — the up-leg's first out-of-sample miss (base rate 30/36). Registered as **FT-christmas-market-closure-2026-12-25-1**, **-2** and **-3** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2026-12-25. It is a closed session; the date is
  `estimate`, and date-keyed action requires `confirmed` regardless.
- **Attribution guard (Mon 2026-12-28):** a higher VIX print on the reopen is the *expected*
  outcome of a 3-non-trading-day gap (+4.32% mean, 16 of 20 years), not evidence that something
  happened over the holiday. Nasdaq's own break move across the same 20 years is **+0.11%**, every
  year inside ±1.4%. Read the vol print and the tape as two different things.
- **Execution guard (Thu 2026-12-24):** NYSE closes equities at **1:00 p.m. ET** (options 1:15,
  late sessions 5:00 p.m.) while SIFMA recommends US fixed income close at **2:00 p.m. ET** — bonds
  outlive equities by an hour, the inverse of the common shape. Any cross-asset construction loses
  its equity reference first, and the next session is dark in all three.
- **Execution guard (Thu 2026-12-31):** the year's last session is a **full** equity day, an **OCC
  quarterly expiration**, and a **2:00 p.m. ET** SIFMA bond close, with a real observed holiday
  behind it (Fri 2027-01-01). This is the inverse of 2027, whose year-end early close sits in front
  of no holiday at all.
- **The corrected session budget, to stop it being re-derived wrong:** December 2026 = **22
  sessions**, tying the record maximum, but **140.0 equity hours** (21 × 6.5 + 1 × 3.5) against
  December 2027's 143.0. Sessions from 2026-12-21 to year-end inclusive = **8** (12-21, 12-22,
  12-23, 12-24 half, 12-28, 12-29, 12-30, 12-31).
- **Do not use CBOE's `VIX_History.csv` to decide whether a day was a session.** Since 2022 it
  publishes rows on days the US equity market is shut (see leg 6). It happens to be correct for
  Christmas and New Year's and wrong for the other six US closures.
- **Attribution trap:** a move on Monday **2026-12-28** has a 3-day-gap vol-remark explanation, a
  year-end-positioning explanation, a delayed reaction to the four prints of **2026-12-23**, and a
  thin-liquidity explanation before it has any single one.

## Initial research

### The question

This id reached the calendar as **one sibling proposal**, not as a seeded entry — discovered by the
`sp-select-sector-secondary-reweight-2026-12-31` initial research while counting sessions in its
own drift window. Per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), this session read it
first and then wrote the canonical file. That proposal is honest about its own limit: it derived
the date from statute and weekday arithmetic alone, fetched **no** exchange calendar, and left two
explicit instructions — fetch a primary schedule, and try the Treasury-auction technique that the
`labor-day-market-closure-2026-09-07` entry used. So the question is three-part: **is the date
right from primaries rather than arithmetic, does the Treasury cross-check work for a forward-dated
closure, and does anything in the year-end corridor behave differently because the closure is
there?**

**One-line verdict:** the date is right and now rests on three independent primaries; the Treasury
cross-check **cannot** work forward and the reason is structural rather than a blocked fetch; and
the corridor does behave differently — but the effect everyone attributes to the Christmas gap is
a **turn-of-year vol re-mark that the gap merely front-loads**, with no equity counterpart at all.

### Method

Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. Nothing was inherited from the proposal; every primary was fetched fresh and
every count recomputed:

- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302 (the page needs `curl -L`),
  109,180 bytes. The full holiday table and **all four footnotes** parsed cell by cell.
- **OCC** `www.optionseducation.org/api/expirationcalendar` — HTTP 200, 34,871 bytes. Holiday
  markers and the expiration-type legend decoded by GUID; the *Bank holiday* vs *Exchange/OCC
  holiday* distinction read off the file's own vocabulary rather than assumed.
- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, 299,272 bytes. US,
  UK and Japan panels parsed; the US panel is identified by content (only it quotes Eastern Time).
- **Treasury** `api.fiscaldata.treasury.gov` `auctions_query` — HTTP 200. Queried for the latest
  announced bill auctions, to test the `labor-day-market-closure-2026-09-07` technique.
- **CBOE** `cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv` — HTTP 200, 472,360
  bytes, 9,267 rows 1990-01-02 → 2026-09-07. Used for the vol measurements, and **audited** as a
  session record rather than trusted as one.
- **FRED** `fredgraph.csv?id=NASDAQCOM` — HTTP 200, 14,014 rows. Used as the independent session
  record and for the equity leg of the break measurement.
- **This repo's own calendar** — all 406 canonical entries in `src/domain/market-events/` read and
  ranked by date, to measure release density rather than assert it.
- **Computed, not sourced:** every session count, every gap classification, and every statistic
  below.
- **Nothing was blocked.** `probe-ref.blocked` is empty; every source above answered on the first
  or second attempt.

### Conviction legs, tested

1. **The date is right, on three primaries plus statute — SUPPORTED (and still `estimate`).**
   NYSE's Christmas Day row parses as `["Friday, December 25****", "Friday, December 24 (Christmas
   Day observed)", "Monday, December 25"]` for 2026 / 2027 / 2028, so 2026 is a full closure on the
   day itself with no observance shift. Footnote `****` reads verbatim: *"Each market will close
   early at 1:00 p.m. (1:15 p.m. for eligible options) on Thursday, December 24, 2026…"* The OCC
   marks 2026-12-25 `{"holiday":{"description":"Exchange/OCC holiday","hatched":true}}`, and that
   marker is meaningful rather than generic because the same file labels the bond-only holidays
   differently — 2026-10-12 and 2026-11-11 are `"Bank holiday"`, unhatched. SIFMA's 2026 US panel
   gives *"Christmas Day | Friday, December 25, 2026"* a full fixed-income close. And 5 U.S.C. 6103
   plus weekday arithmetic reproduces it: December 25 2026 is a Friday.

2. **The Treasury cross-check the proposal asked for cannot work forward — REFUTED as a method for
   this event, and it is a structural limit rather than a blocked source.** The
   `labor-day-market-closure-2026-09-07` entry proved that closure mechanically by noticing Treasury
   had moved an entire Monday bill slate to Tuesday. Run here, `auctions_query` returned HTTP 200
   and its latest bill auction is **2026-09-10** — Treasury publishes only *announced* auctions, and
   announcements run roughly a week ahead. The technique is **retrospective only**: it can confirm a
   closure that has happened or is about to, never one 108 days out. Worth re-running at close-out,
   and worth knowing before another closure lane spends a session on it.

3. **December 2026 is a maximum-length month, not a short one — SUPPORTED, and it is the
   counter-intuitive result.** December 2026 has 31 days, 8 of them weekend, leaving 23 weekdays;
   removing the single 12-25 closure gives **22 sessions**. That ties the 1990–2025 record maximum
   (range **19–22**, counted off FRED's session record; 2018's 19 reflects the one-off national day
   of mourning). The count is not just arithmetic — it reproduces **5 of 5** against every prior
   Friday-Christmas December in the record: **1992, 1998, 2009, 2015 and 2020 are all 22-session
   months**, because the configuration mechanically produces one. The honest caveat the sibling
   ledger's 2027 version does not need: 2026 is the **shortest 22 by hours**, at 21 full sessions ×
   6.5h plus one half session × 3.5h = **140.0**, against December 2027's 22 × 6.5 = **143.0**.

4. **The closure's real cost is release compression, and it is measured — a NEW finding.** Read off
   this repo's own 406 canonical entries: Wednesday **2026-12-23**, the last *full* session before
   the break, carries **four confirmed US macro prints** — `pce-2026-12-23` (high),
   `gdp-q3-2026-third-2026-12-23`, `durable-goods-2026-12-23`, `new-home-sales-2026-12-23`. Only
   **8 of the 90 dates** in this calendar that carry any confirmed entry carry four or more, and
   2026-12-23 is among the top three by confirmed high/medium impact. Behind it: a 3.5-hour session
   on 12-24 with **zero** scheduled US prints, a dark 12-25, and no reopen until 12-28. The shape
   is not a one-corridor coincidence — the same calendar puts **five** confirmed prints on Wednesday
   **2026-11-25**, ahead of this year's other closure and its half day. Two closures, two stacked
   last-full-sessions. *What is not established here:* whether the agencies pull releases forward
   *because* of the closure, or whether the ordinary end-of-month release cadence simply lands there.
   The structural consequence holds either way, and that is what the guard is written against.

5. **The Christmas-break VIX move is the turn-of-year re-mark, not a gap effect — a CORRECTION to
   how the 2027 sibling's finding reads.** That ledger measured, correctly, that the break print is
   a function of gap length. Reproduced here to the hundredth: 3-non-trading-day gaps give **mean
   +4.32%, median +4.01%, 16 of 20 positive**; 1-day gaps give **−0.15%, median +0.08%, 8 of 16**.
   *(Its 1-day cell reports n=14 where this session counts n=16 over 1990–2025; the 3-day cell
   reproduces exactly. Flagged for whichever lane next touches it — the discrepancy does not move
   either conclusion.)* Extending the window is what changes the reading:

   | Window (sessions, relative to the last pre-break close) | 3-day gap | 1-day gap | All 36 years |
   |---|---|---|---|
   | −4 → pre (the run-in) | — | — | **−5.67%**, 26/36 down |
   | pre → post (the break print) | **+4.32%**, 16/20 | **−0.15%**, 8/16 | +2.34%, 24/36 |
   | pre → +4 sessions | **+9.17%**, 17/20 | **+7.21%**, 13/16 | **+8.30%**, median +9.92%, **30/36** |
   | −4 → +4 (the round trip) | — | — | **+1.09%**, median +1.27%, 19/36 |

   The two gap classes **converge** by four sessions after the break. So the gap does not create the
   re-mark; it decides how much of it lands in the first print. The magnitude is real against
   control: +8.30% sits at the **80th percentile** of all **9,263** four-session VIX windows since
   1990, whose unconditional mean is +0.77% and median **−0.61%** (47.4% positive), and an
   early-December control window over the same 36 years runs **−2.22%**, only 15 of 36 positive.
   And it does not decay — +7.08% at +6 sessions, +7.01% at +10.

6. **There is no equity counterpart — a NEW finding, and the reason the mechanism reads as
   mechanical.** The 2027 sibling measured VIX only. Measured here on FRED's Nasdaq Composite over
   the identical windows: the break move is **+0.11% (median +0.24%, 14/20)** on 3-day gaps and
   **+0.69% (10/16)** on 1-day gaps — the latter entirely an artifact of 2018's +5.84%, without
   which it is +0.35%. Every one of the twenty 3-day-gap years falls inside **±1.4%**. So the vol
   surface marks down into the holiday and back up out of it while the underlying does essentially
   nothing, and the round trip nets to noise. That is the signature of **calendar-day decay
   accounting**, not of information arriving. Stated as inference, not as a sourced convention —
   which is why the quarter-horizon confidence is medium.

7. **Friday-Christmas has no signature of its own — NOT SUPPORTED, and the negative is the point.**
   2026's configuration has occurred five times since 1990 (**1992, 1998, 2009, 2015, 2020**), and
   it is the only 3-day-gap configuration whose last pre-break session is a *half* day. Its break
   print is **+5.12%, 5 of 5 positive**, against **+4.06%, 11 of 15** for the other three-day-gap
   years. Five of five looks striking and is not evidence: under the class base rate of 16/20, five
   positives from five draws has p ≈ 0.33. This **replicates on a different subset** what the 2027
   ledger found for Saturday-Christmas — the day-of-week configuration carries nothing that gap
   length has not already explained — and two independent negatives are worth more than either
   alone.

8. **CBOE's `VIX_History.csv` is not a session record, and has not been since 2022 — a NEW
   methodological finding that protects the whole closure family.** Diffed against FRED's Nasdaq
   series, the CBOE file contains **34 dates FRED lacks**, and they are not scattered: one stray in
   2004 (the Reagan national day of mourning), then **5 in 2022, 7 in 2023, 7 in 2024, 8 in 2025 and
   6 in 2026** — MLK, Washington's Birthday, Memorial Day, Juneteenth, Independence Day, Labor Day
   and Thanksgiving, every year. It publishes **no** Christmas or New Year's row. So a lane using
   this file to test whether a US holiday was a session gets **Christmas right and the other six
   wrong**. Checked against the corpus before writing this: 50+ ledgers cite the file, but the
   closure ledgers (`mlk-market-closure-2027-01-18`, `washingtons-birthday-market-closure-2027-02-15`)
   use it only for the **VIX level**, and the only session-record uses are the 2027 Christmas ledger
   and its `fhfa-hpi-2027-12-28` sibling proposal — which studied the one holiday the file handles
   correctly. **A latent trap, not a live error.** The concrete instance is small and worth naming
   anyway: the 2027 ledger's probe-ref quotes `"vix": 15.30` from **2026-09-07**, which was Labor
   Day; this ledger records **14.53** from 2026-09-04, the last regular-session close.

9. **FRED is not a clean session record either, and the sibling's correction runs both ways — a
   NEW finding.** The 2027 ledger corrected CBOE using FRED, having found 1999-12-31 present in one
   and absent from the other. Run in full, FRED has **five** dates CBOE lacks: 1991-03-01,
   1997-01-31, 1997-11-26 and 1999-12-31 are all real sessions and genuine CBOE gaps — but
   **2019-04-19 is Good Friday**, so on that date FRED is the wrong one. Neither series alone is a
   session record; their **agreement** is. They agree on December session counts for all 36 years
   except 1999, which is why leg 3's count is safe.

### What the conditions support

Nothing to trade, and that is the honest output rather than a hedge. What they support:

- **A session budget** that says 22 sessions / 140.0 hours for December 2026, not a decremented
  short-month template.
- **Two dated execution guards** in the corridor (12-24 and 12-31), both cross-asset, both timing
  cautions rather than signals.
- **One attribution guard** that stops a scheduled vol mark being read as a holiday-weekend event —
  the finding most likely to change how a future recap or bot narrates 2026-12-28.
- **Two proposed calendar entries** and **one banked methodological trap**, each written so the next
  lane does not spend a session re-deriving it.

### Honest limits

- The date is `estimate` and stays there. Three primaries do not promote it; only a taxonomy ruling
  or an `IR:`/`BLS:`/`FED:` source would.
- Leg 5's mechanism is **inference**. The measurement is solid; the *reason* — holiday calendar-day
  decay accounting — was not read off any published convention this session, and no attempt was
  made to source it.
- Leg 4 establishes the release **stack**, not its **cause**. Whether the agencies move for the
  closure or merely land there was not tested.
- n is small everywhere it is cut finely: 36 Christmases, 20 three-day gaps, 5 Friday-Christmases.
  Leg 7 is a *failure to find* a subset effect at n=5, which is not the same as showing there is none.
- CME and other futures venues were **not** researched. The 12-24 and 12-31 guards cover NYSE,
  OCC and SIFMA-recommended bond hours only.

## Stance & kill switches

**Stand aside.** This is a structural row: a scheduled full closure 108 days out, `estimate`,
`symbols: []`, `impact: low`. No entry, exit or hedge is keyed to it, and date-keyed action would
require `confirmed` in any case. The stance is not "nothing to see" — it is that everything worth
carrying from this event is a *budget*, a *guard* or a *correction*, none of which is a position.

The three findings the stance rests on, each with what kills it:

- **December 2026 is 22 sessions / 140.0 equity hours.** Killed by the count failing to reproduce
  from NYSE's 2026 table plus FRED's session record, observed before **2026-12-18**.
- **The post-break VIX pop is a scheduled mark, not information.** Killed by the up-leg missing —
  VIX closing at or below its 2026-12-24 level on **2026-12-31** — or by the equity leg breaking, a
  Nasdaq move of more than ±1.5% from 12-24 to 12-28 against 20 of 20 prior three-day-gap years
  inside ±1.4%. Registered as **FT-…-1**, **-2** and **-3** below.
- **CBOE's VIX file is unusable as a session record post-2021.** Killed by CBOE removing the
  holiday rows, or by finding a Christmas or New Year's row in the file, observed on any refetch
  before **2027-01-04**.

Registered this session in
[`forward-tests/christmas-market-closure-2026-12-25.md`](../forward-tests/christmas-market-closure-2026-12-25.md):
**FT-christmas-market-closure-2026-12-25-1** (the down-leg into the break),
**-2** (the up-leg out of it) and **-3** (the absent equity counterpart). All three are
measurements of a scheduled mark, registered to be scored — none is a position, and the `estimate`
label licenses no entry either way.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | 108 | **Initial research**; canonical `<id>.json` written after reading the one `from-sp-select-sector-secondary-reweight-2026-12-31` proposal, which had fetched no exchange calendar. Date now **triple-primaried at HTTP 200** — NYSE table (109,180 b, footnote `****` names the 12-24 1:00 p.m. half session), OCC hatched *Exchange/OCC holiday* marker (the file reserves *Bank holiday* for bond-only days), SIFMA 2026 US panel — plus 5 U.S.C. 6103. Stays `estimate` on the taxonomy gap alone; prefix upgraded `EST:` → `NEWS:`. **The proposal's Treasury-auction ask was run and is unavailable BY CONSTRUCTION**, not blocked: `auctions_query` HTTP 200, latest announced bill auction **2026-09-10** — the labor-day technique is retrospective only. **Computed:** December 2026 = **22 sessions** (record max, range 19–22) but the shortest 22 by hours, **140.0** vs 2027's 143.0; verified 5/5 against every prior Friday-Christmas December (1992, 1998, 2009, 2015, 2020). **Headline correction:** the 3-day-gap VIX pop reproduces exactly (**+4.32%**, 16/20 vs **−0.15%**, 8/16) but is **not a gap effect** — run-in **−5.67%** (26/36 down), convergence to **+9.17%** / **+7.21%** by +4 sessions, all-years **+8.30%** (30/36, **80th pct** of 9,263 four-session windows, unconditional +0.77% / median −0.61%), round trip **+1.09%** (19/36). **New leg:** no equity counterpart — Nasdaq **+0.11%** across 3-day gaps, all 20 years inside ±1.4%. **Negative find:** Friday-Christmas (n=5, +5.12%, 5/5) is indistinguishable from the other 3-day years (+4.06%, 11/15) — p ≈ 0.33; replicates the 2027 ledger's Saturday negative on a different subset. **Methodological trap banked:** CBOE `VIX_History.csv` publishes rows on shut US holidays since 2022 (5/7/7/8/6 per year, MLK through Thanksgiving) but never Christmas or New Year's — latent, not live (closure ledgers use it only for the VIX level); the 2027 ledger's probe-ref `15.30` is a 2026-09-07 Labor Day row, this one uses **14.53** (2026-09-04). FRED is not clean either — it carries **2019-04-19, a Good Friday**. **New find:** the closure's cost is release compression — **2026-12-23 carries 4 confirmed prints** incl. PCE, 1 of only 8 such dates in 90; **2026-11-25 carries 5** ahead of the other 2026 closure. Adjacency — peers: n/a (`symbols: []`); macro: the 12-23 stack above, `fomc-minutes-2026-12-30` inside the corridor; VIX **14.53**; geopolitical: `china-retaliation-suspension-expiry-2026-12-31` shares the year-end session, not researched here; tape: Thu 12-24 equities 1:00 p.m. vs SIFMA bonds 2:00 p.m. (bonds outlive equities), Thu 12-31 full equity session + **OCC quarterly expiration** + 2:00 p.m. bond close + year's last, behind a real Fri 2027-01-01 holiday. Proposes `thanksgiving-market-closure-2026-11-26.json` (the seeding proposal's explicit hand-off) and `new-years-day-market-closure-2027-01-01.json` (both `estimate`). | Initial stance set: **stand aside** (structural row only). Registers **FT-christmas-market-closure-2026-12-25-1**, **-2** and **-3**. | 2026-10-08 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
