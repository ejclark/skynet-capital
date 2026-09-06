# US equity markets close early at 1:00 p.m. ET — the day after Thanksgiving — thanksgiving-half-day-2026-11-27

**Kind:** sector · **Date:** 2026-11-27 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table, footnote \*\*\*, re-fetched direct 2026-09-05; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-12-02","advance-economic-indicators-2026-11-27","aws-reinvent-2026","beige-book-2026-11-25","chicago-pmi-2026-11-30","dallas-fed-mfg-2026-11-30","dallas-fed-tssos-2026-12-01","durable-goods-2026-11-25","fomc-blackout-start-2026-11-28","gdp-q3-2026-second-2026-11-25","georgia-senate-runoff-2026-12-01","ism-manufacturing-2026-12-01","japan-cpi-tokyo-flash-2026-11-27","jolts-2026-12-01","pce-2026-11-25"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and stop calling this session empty.** Two sibling ledgers filed 2026-11-27
as a structural void that makes the US tape unreadable. Reading Census's own release calendar
cell-by-cell today **refutes the "void" half**: the **Advance Economic Indicators Report** (advance
goods trade + retail/wholesale inventories, October data) is scheduled **2026-11-27 at 8:30 a.m. ET**,
and this calendar has September, October and December entries for that series and **no November one** —
it is proposed here. So an 8:30 macro print lands into the thinnest tape of the quarter. *How* thin is
now measured, not assumed: across 32 day-after-Thanksgiving sessions (1994–2025) SPY traded a median
**0.411×** its trailing-20-session median volume, against **1.033×** on an ordinary Friday. What is
**not** true is nearly everything folklore claims. "Black Friday is bullish" — 20 of 33 up (60.6%),
median **+0.079%** against an all-session median of +0.064%, p = **0.26**. "The Monday gives it back" —
the −0.328% mean is **one observation** (2008-12-01, −8.86%); drop it and it is −0.061%. "VIX pops the
Monday after" — 69.7% up against an ordinary Monday's **61.8%**, p = 0.23. Exactly **one** deviation
survives its base rate: **the Friday vol crush does not arrive.** VIX rose on **18 of 33** of these
Fridays (54.5%) against **36.4%** for an ordinary Friday, p = **0.025**, median **+0.06** vs −0.27 —
while realized range runs at half normal. Nothing here is tradeable: `impact: low`, `symbols: []`, the
date is **`estimate`**, and a re-grep of both house playbook docs for holiday keying returns **0 hits**.
The output is three execution guards, three calendar entries this sweep found missing, and two
forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a 3.5-hour session 83 days out is not a position | High | `symbols: []`, `impact: low`, date `estimate`; `trade-playbooks.md` and `multi-symbol-sweep.md` grep to **0 hits** on `holiday\|half.day\|early close\|thanksgiving\|black friday`, run this session | A house playbook keyed to holiday-shortened sessions being written and back-tested before **2026-11-27** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Stand aside; the live calendar item this week is 2026-09-05, not a November half-day** | High | `fomc-blackout-start-2026-09-05` is today's event; nothing between **2026-09-07 → 2026-09-11** touches this session | Any tracked event dated inside 2026-09-07 → 09-11 whose stance depends on 2026-11-27, which would mean this date is load-bearing months early |
| This month | **Watch the calendar holes this sweep found, not the tape** | Medium | Census schedules an **8:30 a.m. ET** release on the half day and an 8:30 durable-goods release on **2026-11-25**; neither had a calendar entry before this PR | Census re-publishing `calendar-listview.html` with the Advance Economic Indicators Report off **2026-11-27**, observed before **2026-10-05** — the headline find re-dates and both proposals are amended |
| This quarter | **Carry "thin, data-bearing, and no vol crush" — not "empty"** | Medium | Volume median **0.411×** normal (n=32) with an 8:30 print landing in it; VIX up 54.5% of these Fridays vs a 36.4% base (p = 0.025) | VIX closing **2026-11-27** more than **0.27** points below its **2026-11-25** close — the ordinary Friday crush arrives after all. Registered as **FT-thanksgiving-half-day-2026-11-27-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-11-27 in any branch. `impact: low`,
  `symbols: []`, date `estimate`; date-keyed action requires `confirmed` regardless.
- **Execution guard — the options close is not uniform, and two primaries disagree by 15 minutes.**
  Cboe's own US-options hours page gives `Thanksgiving Early Close | November 27 | 09:30:00 -
  13:00:00`; NYSE's footnote \*\*\* says **1:15 p.m.** "for eligible options" on its own markets.
  Both fetched today. Assume **13:00** unless the venue is NYSE American/Arca Options.
- **Execution guard — bonds outlive equities by an hour.** SIFMA's 2026 US schedule recommends a
  **2:00 p.m. ET** fixed-income close. From **13:00 → 14:00 ET** the Treasury tape is the only US
  price discovery still running, and any cross-asset leg loses its equity reference first. This is
  the **inverse** of `good-friday-market-closure-2027-03-26`, where equities outlive bonds.
- **Execution guard — thin is reliable; calm is not.** SPY volume came in under **0.70×** its
  trailing-20 median in **27 of 32** years (84%), but realized range did so in only **21 of 32**
  (66%). The worst case in the sample is **2021-11-26** (Omicron): SPY **−2.23%**, VIX **+10.04** —
  the 22nd-largest single-session VIX jump of 8,459 sessions since 1993, inside 3.5 hours.
- **An 8:30 a.m. ET print lands in it** (`estimate`) — Advance Economic Indicators Report, October
  data, per Census's own calendar. Recorded so no later session calls 2026-11-27 data-empty; it is
  a *reading* caution about attribution, never a signal.
- **The corridor is front-loaded onto Wednesday 2026-11-25**, not onto the half day: `pce-2026-11-25`
  and `gdp-q3-2026-second-2026-11-25` (both `high`, `confirmed`) plus `beige-book-2026-11-25`, and —
  found today — Census durable goods 8:30, new residential sales 10:00, steel imports 10:00.
- **Last session before the Fed goes quiet.** `fomc-blackout-start-2026-11-28` gates FOMC speech
  through **2026-12-10**, so 2026-11-27's 13:00 close is the last bell before an 11-day silence.
- **Attribution trap:** a move on **2026-11-30** has a half-day-liquidity story, a Wednesday-print
  story, an 8:30-Friday-print story, a Tokyo-CPI story and an ordinary-Monday story before it has
  any one of them. The Monday-open gap after these Fridays is **ordinary** — median **0.242%** vs
  **0.277%** for all Mondays (n=32) — so "the half day pushed repricing into Monday" is measured false.
- **Watch (dated)** — PCE + GDP-2nd + Beige Book + durable goods **11-25** · full closure **11-26** ·
  **this half session 11-27** (Census 8:30 print, est) · FOMC blackout opens **11-28** · Chicago PMI
  **11-30** · ISM + Georgia runoff **12-01** · jobs **12-04** · FOMC **12-09** · CPI **12-10** ·
  **the next NYSE half-day 12-24** (proposed here) · closure **12-25**.

## Initial research

### The question

Two sibling ledgers put this date on the calendar as a *negative* fact. `japan-cpi-tokyo-flash-2026-11-27`
records that "the first US session is a half-day already emptied by the holiday," and the seeding note
in this event's own entry says "no US tape reaction should be read off 2026-11-27." Both are claims
about a session neither measured. So: **is the day-after-Thanksgiving session actually empty, is it
actually quiet, and does anything about it differ from an ordinary Friday once you control for the
fact that it is a Friday?**

**One-line verdict:** it is **not empty** — Census schedules an 8:30 a.m. ET release into it, which
this calendar did not know — it **is** reliably thin (volume 0.411× normal) but only unreliably calm,
and after controlling for weekday base rates **exactly one** of the four seasonal claims folklore
attaches to this session survives: the ordinary Friday implied-vol crush does not happen.

### Method

Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`,
so no symbol-keyed instrument applies and no session-structure instrument exists in `scripts/research/`.
Every number below was computed this session from bars re-fetched after busting the instrument caches
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`), and every schedule
claim was parsed cell-by-cell out of a primary rather than quoted from a sibling ledger.

- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302, 109,180 bytes. Its holiday
  data is JSON-ish `"text":"..."` cells, not table markup; footnotes \*\*\* and \*\*\*\* read whole.
- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, 298,926 bytes; the
  2026 US panel read out of the page's own embedded payload.
- **Cboe** `cboe.com/about/hours/us-options/` — HTTP 200, 387,220 bytes; the 2026 early-close rows.
- **US Census** `census.gov/economic-indicators/calendar-listview.html` — HTTP 200, 91,396 bytes; all
  **179** table rows parsed. This is the source of the headline find.
- **BLS** `bls.gov/schedule/2026/home.htm` — HTTP 200, 100,849 bytes, page stamp *"Last Modified Date:
  February 18, 2026"*; the November 2026 grid read in full.
- **Yahoo daily bars** (SPY 8,458 sessions from 1993-01-29, QQQ, `^VIX` 9,238 sessions from
  1990-01-02), last bar **2026-09-04**. Day-after-Thanksgiving dates were computed as the calendar day
  after the 4th Thursday of November, not looked up.
- **Attempted and failed, recorded rather than worked around:** `cmegroup.com` holiday calendar —
  connection failure (curl exit code 0 bytes, HTTP 000) to this runner. The futures leg is left
  unstated, exactly as `good-friday-market-closure-2027-03-26` left it.

### Conviction legs, tested

1. **The hours are right and now rest on three independent primaries — SUPPORTED (and still
   `estimate`).** NYSE footnote \*\*\*, verbatim: *"Each market will close early at 1:00 p.m. (1:15
   p.m. for eligible options) on Friday, November 27, 2026, Friday, November 26, 2027, and Friday,
   November 24, 2028 (the day after Thanksgiving). NYSE American Equities, NYSE Arca Equities, NYSE
   National, and NYSE Texas late trading sessions will close at 5:00 p.m."* Cboe's US-options hours
   page independently lists `Thanksgiving Early Close | November 27 | 09:30:00 - 13:00:00`. SIFMA's
   2026 US schedule reads `Thanksgiving Day | Thursday, November 26, 2026 | Early Close (2:00 p.m.
   Eastern Time): Friday, November 27, 2026`. **Why it stays `estimate`:** the confirmed-prefix
   taxonomy (`IR:`/`CAL:`/`BLS:`/`FED:`/`PJM:`/`SEC:`/`TSY:`/`OCC:`/`BEA:`/`CENSUS:`/`ISM:`/`CB:`/
   `UMICH:`) has no slot for an exchange or trade-association hours page, and this lane may not
   self-confirm an event it discovered in-sweep. The label is about the taxonomy, not the evidence.

2. **The two options primaries disagree by 15 minutes — SUPPORTED, and it is an execution fact, not
   an error.** NYSE says 1:15 p.m. for *eligible options*; Cboe says 13:00 for its own exchanges.
   Read together they are consistent statements about different venues (NYSE American/Arca Options
   vs Cboe), not a contradiction — but "the options market closes at 1:15" is false as a general
   statement about 2026-11-27, and no ledger in this repo had recorded that.

3. **"The session is empty of data" — REFUTED, and this is the load-bearing find.** Census's own
   release calendar carries `Advance Economic Indicators Report (International Trade, Retail, &
   Wholesale) | November 27, 2026 | 8:30 AM | October 2026`, release code `A202611270830`. This
   calendar tracks `advance-economic-indicators-2026-09-30`, `-2026-10-28` and `-2026-12-28` and had
   **no November entry** — a hole, not a decision. Proposed here as `estimate`. BLS is the contrast
   that makes the point sharp: its 2026 schedule runs Nov 20 (State Employment) → Nov 26
   (Thanksgiving, no release) → Dec 1, with **nothing on Nov 27**. So the half session is macro-quiet
   on the labour side and *not* quiet on the trade/inventories side.

4. **"The session is thin" — SUPPORTED, and it is the only claim here with a large, clean effect.**
   SPY volume divided by its own trailing-20-session median, day-after-Thanksgiving sessions
   **1994–2025** (n=32; 1993 excluded — SPY was ten months old and traded ~130k shares a day, giving
   a meaningless 7.84× ratio):

   | Measure | Half-day sessions | Ordinary Friday | n |
   |---|---|---|---|
   | Volume ÷ trailing-20 median volume | **0.411×** (median) | 1.033× | 32 vs 1,689 |
   | Range ÷ trailing-20 median range | **0.517×** (median) | 0.954× | 32 vs 1,689 |
   | Sessions under 0.70× on volume | **27 of 32 (84%)** | — | 32 |
   | Sessions under 0.70× on range | 21 of 32 (66%) | — | 32 |

   Depth roughly halves against an ordinary Friday and does so **reliably**. Realized range also
   falls, but far less reliably — which is the distinction the guards above are built on.

5. **"Black Friday is bullish" — REFUTED at any usable size.** SPY on the half session, 1993–2025
   (n=33): mean **+0.137%**, median **+0.079%**, sd 0.868, **20 of 33 up (60.6%)**, t = **0.90**.
   The all-session base over the same 8,457 sessions is **53.6%** up with a **+0.064%** median — so
   the median half-day is fifteen thousandths of a percent better than an average day. Binomially,
   P(≥20 of 33 | p = 0.536) = **0.265**. There is nothing here.

6. **"The Monday after gives it back" — REFUTED, and the appearance is one observation.** Next-session
   return: mean −0.328%, median −0.212%, **14 of 33 up (42.4%)**, t = −0.99. Against the ordinary
   Monday base (55.5% up) that is P = **0.091** — suggestive, not a finding. And the mean is carried
   entirely by **2008-12-01 (−8.86%)**: excluding it, the mean is **−0.061%**. The three worst are
   2008 (−8.86%), 1998 (−2.82%) and 2007 (−2.21%) — all crisis tapes, none a holiday effect.

7. **"The truncated Friday pushes repricing into Monday's open" — REFUTED.** |Monday open ÷ half-day
   close − 1|: median **0.242%**, n=32. All Mondays 1993–2026: median **0.277%**, n=1,590. The gap
   after a half session is, if anything, *smaller* than an ordinary Monday's.

8. **"VIX pops on the Monday after" — REFUTED as a Thanksgiving effect; it is a Monday effect.**
   VIX rose on **23 of 33** following sessions (69.7%, median +0.53). But VIX rises on **61.8%** of
   all Mondays (n=1,591, mean +0.355, median +0.25) — its single strongest weekday. P(≥23 of 33 |
   p = 0.618) = **0.227**. The seasonal story is the weekday, and the same control is what kills it.

9. **The one deviation that survives its base rate: the Friday vol crush does not arrive —
   SUPPORTED (p = 0.025).** VIX's weekday profile over the same window is unambiguous: Friday is its
   most negative day, **−0.19 mean / −0.27 median, up only 36.4%** of the time. On the
   day-after-Thanksgiving Friday, VIX rose **18 of 33** times (**54.5%**), median **+0.06**.
   P(≥18 of 33 | p = 0.364) = **0.0254**. It is not a 2021 artifact: dropping the Omicron session
   leaves mean **+0.180**, median **+0.06** — still no crush. Paired with leg 4 (realized range at
   ~0.52× normal), the implied-to-realized gap widens on precisely this session.

10. **The mechanism for leg 9 — NOT SUPPORTED, and stated as a failure rather than dropped.** The
    obvious explanation is that the crush is pulled forward into the Wednesday close, ahead of a
    3.5-calendar-day gap. Tested directly: VIX on the Wednesday before Thanksgiving rose **16 of 33**
    times (48.5%) against a Wednesday base of **43.7%** — i.e. slightly *less* crush than normal, not
    more, and nowhere near significance. So the corridor's implied vol simply does not decay the way
    the calendar says it should, and this session has **no mechanism attached to it here**. That is
    the honest state; leg 9 is the observation the forward test exists to keep testing.

11. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.**
    `grep -icE 'holiday|half.day|early close|thanksgiving|black friday'` over
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` returns **0 and 0**,
    run this session. No playbook can fire on this date in either direction.

12. **The corridor's density is real but sits on the Wednesday — SUPPORTED.** Within ±5 days,
    2026-11-25 alone carries `pce-2026-11-25` and `gdp-q3-2026-second-2026-11-25` (both `high`,
    `confirmed`) plus `beige-book-2026-11-25`, and Census adds advance durable goods (8:30), new
    residential sales (10:00) and preliminary steel imports (10:00) to the same morning — the
    durable-goods November entry being a second calendar hole, proposed here. Then a full closure,
    then this half session, then `fomc-blackout-start-2026-11-28`.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate`, and no playbook keys on it. The
supported outputs are the guards already listed: the split options close, the one-hour bond overhang,
"thin is reliable / calm is not," the 8:30 print that makes the session non-empty, and the Monday
attribution trap.

### Honest limits

- **The historical regime is assumed, not sourced.** NYSE's page states the early close for
  2026/2027/2028 only. Whether the 1:00 p.m. close applied in every year 1994–2025 is not sourced
  here; the volume ratios are consistent with a half session in all 32 (max 2.15×, and that year
  was Omicron), but consistency is inference, not a citation.
- **Leg 9 may be a measurement artifact.** VIX's final print on this session is struck at 13:00
  against holiday-thin SPX option quotes. Whether the missing crush is real repricing or a stale
  book is not resolvable from daily bars, and this ledger does not claim to have resolved it.
- **The futures leg is missing.** CME's holiday calendar would not load for this runner (HTTP 000).
  What Globex does on 2026-11-26/27 is not asserted.
- **Weekly-expiration mechanics are not claimed.** 2026-11-27 is a Friday, and eligible options
  close early on it, but no Cboe rule text about the expiration timestamp of that day's weeklies was
  retrieved, so nothing is said about it.
- **n = 32/33 with overlapping macro regimes.** Every statistic here is one observation per year;
  the p-values are binomial against weekday base rates, not a multiple-comparison-corrected panel.
  Four claims were tested and one cleared 0.05 — which is roughly what chance would deliver. That
  is exactly why leg 9 is registered as a forward test instead of promoted to a finding.
- **Six of the events in this corridor are `estimate`,** including this one and both proposals.
  Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside, permanently — this row holds a corrected framing and three
execution guards, not a view. Concretely: (a) **the session is not empty.** Census schedules the
Advance Economic Indicators Report at **8:30 a.m. ET on 2026-11-27** (`estimate`), and the two
sibling ledgers that called this date a structural void were written without that fact; the missing
November calendar entry is proposed in this PR. (b) **It is reliably thin and only unreliably calm** —
SPY volume median **0.411×** normal (84% of years under 0.70×) but realized range under 0.70× in only
66%, with **2021-11-26** as the standing counterexample (SPY −2.23%, VIX +10.04 in 3.5 hours).
(c) **Three of the four folk seasonals do not survive their weekday base rates**; the fourth — no
Friday vol crush, 54.5% VIX-up vs a 36.4% base, p = 0.025 — survives, has **no mechanism attached**,
and is registered rather than believed. Every statement carries the event's **`estimate`** label.

**Kill switches:**

- **VIX closes 2026-11-27 more than 0.27 points below its 2026-11-25 close** — the ordinary Friday
  crush arrives and leg 9, the only surviving deviation, fails on the instance that matters.
  Registered as **FT-thanksgiving-half-day-2026-11-27-1**, score by 2026-11-30.
- **SPY's 2026-11-27 volume comes in at or above 0.70× its trailing-20-session median** — the
  thinness premise every guard rests on fails; historically that has only happened in stress tapes
  (1996, 1998, 2009, 2019, 2021). Registered as **FT-thanksgiving-half-day-2026-11-27-2**, score by
  2026-11-30.
- **Census re-publishes `calendar-listview.html` with the Advance Economic Indicators Report off
  2026-11-27** — the headline find re-dates and the proposed entry is amended, not deleted.
- **Cboe or NYSE republishes 2026-11-27 hours that agree** — guard (2) collapses to one number and
  the split-close warning retires.
- **A house playbook keyed to holiday-shortened sessions is written and back-tested** — leg 11 goes
  stale and the stand-aside is re-argued on measured data rather than on absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 83 | **Initial research.** Hours triple-primaried (NYSE 13:00 / 13:15 eligible options; Cboe 13:00; SIFMA bonds 14:00) — stays `estimate` on the taxonomy gap alone, and the **NYSE-vs-Cboe 15-minute options split** is new to this repo. **Sibling framing refuted:** Census schedules the **Advance Economic Indicators Report 2026-11-27 08:30 ET** (all 179 calendar rows parsed) — the session is not data-empty, and the November entry was missing from this calendar. **Measured (SPY/VIX bars re-fetched, caches busted):** volume median **0.411×** trailing-20 (n=32) vs 1.033× an ordinary Friday; range **0.517×** vs 0.954×. Folk seasonals vs weekday base rates — bullish half-day 60.6% vs 53.6% (p=0.27); Monday give-back mean −0.328% → **−0.061% ex-2008**; Monday VIX pop 69.7% vs a 61.8% Monday base (p=0.23); Monday-open gap 0.242% vs 0.277% — all refuted. **Survives:** no Friday vol crush, VIX up **18/33 (54.5%)** vs 36.4% base, **p=0.025**, mechanism tested on the Wednesday and **not** found. Adjacency — peers n/a (`symbols: []`); macro: BLS has nothing on 11-27, corridor front-loads onto 11-25; VIX **14.53** (close 2026-09-04); geopolitical: none dated; tape: FOMC blackout opens 11-28. CME hours unretrievable (HTTP 000) — futures leg unstated. Proposes `advance-economic-indicators-2026-11-27`, `durable-goods-2026-11-25`, `christmas-eve-half-day-2026-12-24` (all `estimate`). | Initial stance set: **stand aside** (structural row only). Registers **FT-thanksgiving-half-day-2026-11-27-1** and **-2**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
