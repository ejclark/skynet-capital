# US fixed income closed for Columbus Day inside October expiration week, equities trading a full session — sifma-bond-holiday-close-2027-10-11

**Kind:** rates · **Date:** 2027-10-11 (estimate — NEWS: SIFMA `sifma.org/resources/general/holiday-schedule` US Holiday Recommendations panel, 2027 tab parsed out of the page's embedded payload 2026-09-08; corroborated by two Federal Reserve holiday schedules, OCC's 2027 expiration calendar and NYSE's hours grid. The `estimate` label is a source-prefix taxonomy gap plus a recommendation non-binding by its own terms, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.41,"daysBand":"low:15+","adjacentIds":["fomc-blackout-start-2027-10-16","fomc-minutes-2027-10-06","opex-2027-10-15"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and do not write this event's execution guard yet, because the observation
that would settle it is already scheduled and is 357 days before the event.** The closure itself is as
well sourced as anything on this calendar: SIFMA's US 2027 panel reads `Columbus Day` /
`Monday, October 11, 2027` with an **empty** note paragraph (full close, with the `Monday, July 5, 2027`
early-close card two entries above as the parser's positive control), **both** Federal Reserve schedules
carry `Columbus Day … October 11` in their 2027 column, **OCC's** 2027 calendar marks 2027-10-11 a
**`Bank holiday`** rather than an `Exchange/OCC holiday`, and NYSE's grid has **zero** Columbus rows in
133 cells — so equities and options run a full session while the recommended USD cash-bond tape is dark
for **72 hours**. What this session tested is the one thing that makes this instance different from its
2026 sibling, and the answer is a **null**. **(1) Expiration week does not amplify the closure.** Split
the 33 Columbus sessions (1993–2025) on whether the second Monday and third Friday of October share a
week: the closure-day paired TLT−SPY volume gap is **−0.357** in overlap years against **−0.247**
otherwise (permutation **P = 0.606**), and in the modern 2014+ era the medians are **−0.141** and
**−0.140** (**P = 1.000**). LQD P = 0.529, IEF P = 0.306. **(2) The battery's only sub-0.05 result
dissolved under a matched control.** TLT's volume ratio on the expiration Friday itself reads 0.924× in
overlap years vs 1.441× otherwise (**P = 0.042**) — but paired against SPY's own ratio that same day it
is −0.167 vs −0.040 (**P = 0.420**). It was the general level of an October opex Friday, not the
closure. **(3) The coincidence is not even a 2027 property** — Columbus Day lands inside October
expiration week in **19 of 33** years, and **2026-10-12 is itself an overlap year**, so the sibling is
not a control for this date. **(4) The guard is deferred on purpose.** The depth numbers a reader would
want are downstream of **FT-sifma-bond-market-closure-2026-10-12-1/-2/-3**, which score **2026-10-19 and
2026-10-20**. Everything here carries the event's **`estimate`** label; `symbols: []`, impact `low`, and
no house playbook is calendar-keyed.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — D-398, nothing to size and nothing that can fire | High | `symbols: []`, `impact: low`, status `estimate`; `trade-playbooks.md` and `multi-symbol-sweep.md` re-grepped this session for `holiday\|veterans\|columbus\|closure\|half-day\|early close\|opex\|expiration\|witching` return **0 hits in both** | A holiday- or session-hours-keyed house playbook being written and back-tested before **2027-10-11** — the "nothing can fire on this date" leg dies and this sheet is rebuilt on measured data |
| This week | **Stand aside, and hold the 2027 execution guard OPEN** rather than copying the sibling's | High | The depth guard is downstream of three forward tests on the 2026-10-12 instance that score **2026-10-19/20** — 41 days out, 357 days before this event. Writing a 2027 number today spends the out-of-sample test that is already scheduled | TLT's **2026-10-12** volume ratio printing inside **0.70–0.85×** its trailing-20 median — squarely in the modern band, meaning the deferral bought nothing and the 2027 guard was writable today |
| This month | **Avoid** treating the expiration-week overlap as an amplifier of the closure | Medium | Overlap vs non-overlap closure-day paired gaps: TLT **−0.357 / −0.247** (perm **P = 0.606**), modern era **−0.141 / −0.140** (**P = 1.000**); LQD P = 0.529, IEF P = 0.306. The one P = 0.042 in the battery dissolved to **P = 0.420** when paired against SPY | TLT's **2027-10-11** paired TLT−SPY volume gap coming in **at or below −0.40** — materially deeper than the modern Columbus median. Registered as **FT-sifma-bond-holiday-close-2027-10-11-1**, score by 2027-10-18 |
| This quarter | **Stand aside** on the catch-up story — the closure's lost volume does not reappear at the week's expiration | Low | TLT's paired gap on the October opex Friday is **negative in 10 of 14** overlap years (median −0.167) against 6 of 10 non-overlap and a 52% all-Friday placebo — it stays quieter, it does not spike. But the unconditional pass rate is 88%, so the hit rate carries little information and the confidence is graded accordingly | TLT's paired TLT−SPY volume gap on **2026-10-16** (the next overlap October expiration Friday) **exceeding +0.30** — a catch-up spike. Registered as **FT-sifma-bond-holiday-close-2027-10-11-2**, score by 2026-10-23 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this date.** `symbols: []`, no calendar-keyed playbook, and the date is
  `estimate` — date-keyed *action* requires `confirmed` regardless. Nothing measured below changes that.
- **Do not carry a 2027 depth number yet, and do not copy the sibling's.** The honest guard for
  2027-10-11 is "unwritten, pending 2026-10-19/20." The sibling
  [`sifma-bond-market-closure-2026-10-12`](sifma-bond-market-closure-2026-10-12.md) publishes
  LQD ≈ 0.28× / IEF ≈ 0.57× / TLT ≈ 0.73–0.80× as its *2026* guard and registered three tests on it;
  those tests are the reason to wait rather than a reason to inherit.
- **The expiration-week framing is a reading trap, not an edge.** `opex-2027-10-15` sits at **D+4** and
  OCC's own 2027 calendar confirms it (monthly equity/index expiration 10-15, A.M.-settled index options
  ceasing 10-14). That proximity changes **nothing** measurable about the closure day — three
  permutation tests say so — and it is stated here so the next session does not rediscover it as news.
- **The corridor is thin and that is a limit, not a clean bill.** Within ±5 days the calendar carries
  only `fomc-minutes-2027-10-06` (D-5, `estimate`), `opex-2027-10-15` (D+4, **confirmed**) and
  `fomc-blackout-start-2027-10-16` (D+5, `estimate`). No CPI, PPI or jobs print is tracked in the
  window — but the 2027 calendar is sparse this far out, so read that as *unpopulated*, not *empty*.
- **All three SIFMA panels are dark on 2027-10-11, and the Japan leg is explicitly provisional.** US and
  UK both read `Columbus Day` / `Monday, October 11, 2027`; **Japan** reads `Health and Sports Day` /
  `Monday, October 11, 2027` **with the note `Tentative – Subject to confirmation by the Bank of Japan`**
  — where the 2026 Japan card for the same holiday carries an empty note. The Japan leg is carried as
  provisional and nothing rests on it.
- **Options are open even though banks are shut.** OCC marks 2027-10-11 `Bank holiday`, not
  `Exchange/OCC holiday` — the marker it uses for real exchange closures (e.g. 2025-01-01). Any
  rates-shaped move visible in options or bond ETFs on 10-11 is **ETF/options-only price discovery**;
  the cash market that would confirm it does not open until 10-12.
- **Watch (dated):** FOMC minutes **2027-10-06** (`estimate`) · **this closure 2027-10-11** (equities
  and options full session; USD fixed income dark) · A.M.-settled index options cease **2027-10-14**
  (OCC) · monthly expiration **2027-10-15** (**confirmed**) · FOMC blackout opens **2027-10-16**
  (`estimate`) · VIX expiration **2027-10-20** (`estimate`).
- **The near-dated things that actually move this sheet:** **2026-10-12** (the sibling instance) and its
  scoring on **2026-10-19/20**, plus **2026-10-16** (this ledger's own FT-2).

## Initial research

### The question

This id reached the calendar as a single proposal —
`proposals/sifma-bond-holiday-close-2027-10-11.from-opex-2027-10-15.json`, filed 2026-09-06 by the
`opex-2027-10-15` adjacency sweep — so this session's first job was to read that proposal, re-fetch
everything it cited, and write the canonical `src/domain/market-events/sifma-bond-holiday-close-2027-10-11.json`.
It did, and the proposal's date claim reproduces exactly.

That leaves the real question. A Columbus Day full closure has already been researched to the bone one
year earlier: [`sifma-bond-market-closure-2026-10-12`](sifma-bond-market-closure-2026-10-12.md) measured
the tape signature, corrected the inherited execution guard, split it by era, refuted the deferred-
repricing story with an inverted prediction, and registered three forward tests. Re-running that work
against a date 398 days out would produce the same numbers and no information.

So the question here is the **one structural feature that distinguishes this instance**, and it is the
feature the proposal itself flagged and refused to call an edge: **2027-10-11 is the Monday of October
2027 expiration week**, four sessions before `opex-2027-10-15`. Does a bond-market closure landing
inside expiration week behave differently from one that does not — in the closure day's own thinning, in
the expiration Friday that follows it, or in the next session's repricing?

**One-line verdict:** it does not, on every metric that survives a matched control — the overlap is a
measured null, the battery's single positive result dissolved when paired against SPY, and the
coincidence is not even specific to 2027 — so the honest output of this session is a **stand-aside plus
a deliberately deferred execution guard**, whose deciding observation is already scheduled for
2026-10-19/20.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any pull.
Nothing below is inherited: every source was re-fetched and every statistic recomputed this session,
which is why the sibling's figures are reported as **reproductions**.

- **Sources, all fetched direct 2026-09-08, all HTTP 200 — `blocked` is empty this session.**
  SIFMA `sifma.org/resources/general/holiday-schedule/` (298,772 bytes); the 2027 tab is not in the
  rendered DOM, so the US/UK/Japan 2027 panels were parsed out of the page's embedded Next.js payload
  card by card, attributed by each panel's own contents (the UK panel is identifiable by its
  `Spring Bank Holiday` / `Summer Bank Holiday` / `Boxing Day` cards, Japan by `Vernal Equinox Day` /
  `Emperor's Birthday`). `federalreserve.gov/aboutthefed/k8.htm` (80,538 bytes, page's own
  "Last Update: July 8, 2026") and `frbservices.org/about/holiday-schedules` (93,983 bytes), both parsed
  row by row. `nyse.com/markets/hours-calendars` (109,148 bytes after its 302); all **133** `"text"`
  cells extracted and searched. OCC `optionseducation.org/api/expirationcalendar` (33,471 bytes, JSON,
  155 dated rows, legend codes resolved to their titles).
- **Measured, not sourced:** split/dividend-adjusted daily bars **with volume** for SPY, TLT, LQD, IEF,
  HYG, AGG, SHY and ^VIX, pulled direct from the Yahoo chart endpoint
  `scripts/research/market-data.mjs` uses (`bars()` drops the volume field, so raw payloads were read).
  SPY 8,458 bars 1993-01-29 → 2026-09-04; TLT/LQD/IEF/SHY 6,065 from 2002-07-30; AGG 5,771 from
  2003-09-29; HYG 4,883 from 2007-04-11. ^VIX **15.41** intraday 2026-09-08 (last confirmed close
  **14.53** on 2026-09-04 — see the ^VIX artifact in *Honest limits*).
- **Definitions, pre-stated so they can be refuted.** Volume ratio = session volume ÷ the **median**
  volume of its own trailing 20 sessions. Move ratio = |close-to-close| ÷ the median |close-to-close| of
  its own trailing 20. **Columbus Day session** = the second Monday of October with a SPY bar,
  1993–2025 (n=33 SPY, n=24 for the 2002-inception ETFs). **Opex-week overlap** = the third Friday of
  October falls four calendar days after the second Monday, i.e. they share a Mon–Fri week. Era split at
  2014-01-01, the same pre-stated midpoint the sibling used, so the two ledgers are comparable.
- **Between-group tests are two-sided permutation tests on the difference of medians** (20,000
  relabellings, seeded), because the group sizes are small and unequal and a t-test's assumptions do not
  hold here. Paired within-group tests are sign tests.
- **Not attempted this session:** `cmegroup.com` (403 to this runner across every prior sibling attempt)
  and `treasurydirect.gov`. The futures and settlement legs are left **unstated** rather than assumed.
- **Re-grepped, not cited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`.

### Conviction legs, tested

1. **The 2027 full-closure shape reproduces from four independent primaries — SUPPORTED (and it still
   stays `estimate`).** SIFMA's US 2027 panel renders `Labor Day` / `Monday, September 6, 2027` →
   **`Columbus Day` / `Monday, October 11, 2027`** → `Veterans Day` / `Thursday, November 11, 2027`,
   with an **empty** note paragraph on the Columbus card. The parser's positive control sits two cards
   earlier in the same panel: `U.S. Independence Day` / `Monday, July 5, 2027` /
   `Early Close (2:00 p.m. Eastern Time): Friday, July 2, 2027` — early-close notes are read when they
   exist, so an empty one means a full close and not a parse failure. Both Federal Reserve schedules
   carry `Columbus Day | October 12 | October 11 | October 9 | October 8 | October 14` for 2026–2030, so
   the 2027 column is **October 11**. And the arithmetic is independent of every calendar: Columbus Day
   is the second Monday of October and October 2027's second Monday is the 11th. It stays `estimate`
   regardless, on three counts — the prefix taxonomy in `market-events-data.ts` scopes `FED:` to the
   **FOMC calendar** and has no slot for a holiday schedule or a trade association's recommendation;
   this lane may not self-confirm an event it discovered in-sweep; and the *trading* claim rests on
   SIFMA, non-binding by its own terms.

2. **Equities and options both run a full session — SUPPORTED, and OCC is a source the sibling did not
   use for this.** NYSE's grid states "All NYSE markets observe U.S. holidays as listed below for 2026,
   2027, and 2028" and its 133 text cells contain **zero** occurrences of `Columbus`, `Indigenous`,
   `October 11` or `October 12`. OCC's 2027 calendar goes further and separates the two ideas
   explicitly: 2027-10-11 carries `{"holiday":{"description":"<p>Bank holiday</p>"}}`, where a genuine
   exchange closure in the same feed carries `Exchange/<br />OCC holiday` with `"hatched": true` (e.g.
   2025-01-01). So the options market is open on a day the banks are shut — which is the precise shape
   of the cross-asset split, sourced rather than inferred.

3. **The expiration-week corridor is confirmed by OCC, and is tighter than the calendar alone shows —
   SUPPORTED.** OCC's 2027 rows read `2027-10-14` = "Monthly A.M. settled index options cease trading",
   `2027-10-15` = "Monthly equity, index, and cash-settled currency options expiration date and PM
   settled index options cease trading", `2027-10-20` = "Monthly Volatility Products Expiration date".
   So the closure is **D-3 from the A.M. settlement Thursday** and **D-4 from the monthly expiration**,
   with `fomc-blackout-start-2027-10-16` opening the day after. That is the corridor. Legs 4–6 test
   whether it means anything.

4. **Expiration week does NOT amplify the closure-day thinning — SUPPORTED as a null, and this is the
   leg the event was researched for.** Splitting the 33 Columbus sessions on overlap, closure-day
   paired **bond-ETF minus SPY** volume-ratio gaps:

   | Symbol | Overlap n / median gap | No-overlap n / median gap | Permutation P (all) | Modern 2014+ P |
   |---|---|---|---|---|
   | **TLT** | 14 / **−0.357** | 10 / **−0.247** | **0.606** | **1.000** (−0.141 vs −0.140) |
   | **LQD** | 14 / −0.345 | 10 / −0.226 | 0.529 | 1.000 (−0.602 vs −0.496) |
   | **IEF** | 14 / −0.212 | 10 / −0.139 | 0.306 | 0.497 (−0.285 vs −0.184) |

   The overlap medians *look* slightly deeper pooled, and that difference does not survive a permutation
   test at any conventional threshold; in the modern era the TLT medians are identical to three decimal
   places. The closure thins the bond-ETF tape by the same amount whether or not expiration week is
   running.

5. **The battery's single sub-0.05 result dissolved under a matched control — SUPPORTED, and it is
   reported because it nearly became a finding.** Testing the *expiration Friday itself*, TLT's raw
   volume ratio reads **0.924×** in overlap years against **1.441×** otherwise, permutation
   **P = 0.042** — the only sub-0.05 number produced anywhere in this session, and a tempting story
   ("the week never gets its bond volume back"). Paired against SPY's own ratio the same day, which
   controls for how busy that particular October expiration was, the gap is **−0.167** vs **−0.040**,
   **P = 0.420** pooled and **0.312** modern. The unpaired result was the general level of an October
   opex Friday, not the closure. Stated plainly: this was **one test out of roughly fifteen** run this
   session, so at α = 0.05 about one false positive was expected, and one arrived.

6. **The coincidence is structural and routine, not a 2027 property — SUPPORTED, and it removes the
   sibling as a control.** Columbus Day falls inside October expiration week in **19 of the 33** years
   1993–2025 (58%), because the second Monday and the third Friday share a week whenever October opens
   late in the week. The non-overlap years are 1994, 1995, 2000, 2001, 2005, 2006, 2007, 2011, 2012,
   2016, 2017, 2018, 2022, 2023. Critically, **2026 is an overlap year too** (second Monday 10-12, third
   Friday 10-16) — so `sifma-bond-market-closure-2026-10-12` is not a non-overlap control for this date,
   and any 2026-vs-2027 comparison on that axis would be empty. 2028 (second Monday 10-09, third Friday
   10-20) is the next non-overlap instance.

7. **The base tape signature reproduces exactly — SUPPORTED, independently recomputed.** Over the
   Columbus sessions, each against its own trailing-20 median volume: **LQD 0.395×** (24 of 24 below
   1.0×), **TLT 0.481×** (24 of 24), IEF 0.565×, AGG 0.586×, HYG 0.618×, SHY 0.767×, **SPY 0.712×**.
   Paired gaps: TLT **−0.346** (21 of 24, p = 0.0003), LQD **−0.329** (21 of 24, p = 0.0003), IEF
   −0.196 (p = 0.0066), AGG −0.098 (p = 0.053), HYG −0.161 (p = 0.359), **SHY −0.051 (13 of 24,
   p = 0.839)**. Every figure the sibling published reproduces to three decimals from a fresh pull,
   including SHY's load-bearing counter-observation that the effect is **concentrated, not universal**.

8. **The era split reproduces too, and is therefore not re-litigated here — SUPPORTED.** TLT
   **0.235× (2002–2013) → 0.730× (2014–2025)**, gap −0.416 → −0.140; LQD **0.505× → 0.282×**, gap −0.137
   → **−0.549** (12 of 12 modern, p = 0.0005); IEF 0.521× → 0.593×, gap −0.100 → −0.265. This is the
   sibling's finding, reproduced from independent bars, and this ledger adds nothing to it. What it adds
   instead is leg 9: the reason not to publish a 2027 number off it yet.

9. **The 2027 execution guard is DEFERRED, and the deciding observation is already dated — SUPPORTED as
   a refusal to answer.** The sibling registered three forward tests on exactly these numbers, scoring
   **2026-10-19** (FT-…-1 on LQD ≤ 0.50×, FT-…-2 on TLT > 0.60×) and **2026-10-20** (FT-…-3 on next-session
   |move|). Those score **41 days** after this session and **357 days** before this event. Publishing a
   2027 depth guard today would mean either copying a number that is about to be tested, or inventing a
   second one from the same bars — and the second reading of the era split (that the closure stopped
   mattering for TLT, rather than that TLT simply grew up) is precisely what the 2026 instance
   adjudicates. So the guard is held open on purpose and the deferral is written down with its trigger,
   rather than the gap being papered over with an inherited figure.

10. **The catch-up story does not appear at the expiration Friday either — SUPPORTED as a weak
    refusal, graded low on purpose.** If a shut Monday defers bond-ETF volume, expiration Friday is the
    natural place for it to reappear. It does not: TLT's paired opex-Friday gap is negative in **10 of
    14** overlap years (median **−0.167**) against 6 of 10 non-overlap (−0.040) and a **52%** all-Friday
    placebo (median −0.019). The tape stays quieter rather than spiking. **Stated against my own
    finding:** the pass rate for "no catch-up spike" (gap ≤ +0.30) is **12 of 14 = 86%** in overlap
    years against **21 of 24 = 88%** across all October expiration Fridays — the prediction is that the
    day is *ordinary*, and ordinary is the base rate. FT-…-2 is registered at LOW and sized at zero for
    exactly that reason.

11. **The next session is not measurably different either — SUPPORTED as a null.** TLT's next-session
    move ratio after the closure runs a median **1.169×** in overlap years against **0.450×** in
    non-overlap ones — a large-looking gap that is **P = 0.162** on n=14 vs n=10 and therefore reported
    as noise, not promoted. LQD 0.965× vs 1.021× (P = 0.955); SPY 0.663× vs 0.739× (P = 0.855). This
    leg is kept because the ordering is the *opposite* of the sibling's leg-7 refusal direction and
    someone will otherwise rediscover it as a finding.

12. **All three SIFMA panels are dark on 2027-10-11, and the Japan leg is explicitly provisional —
    SUPPORTED, and this is a real difference from 2026.** The US and UK 2027 panels both render
    `Columbus Day` / `Monday, October 11, 2027`; the Japan 2027 panel renders `Health and Sports Day` /
    `Monday, October 11, 2027` — Japan's own national holiday, which also lands on the second Monday of
    October — **with the note `Tentative – Subject to confirmation by the Bank of Japan`**. The 2026
    Japan card for the same holiday carries an **empty** note. So the three-panel darkness the sibling
    documented reproduces for 2027, but the Japan leg is published as provisional and is carried that
    way here. Nothing is asserted about JGB or gilt trading, which sit outside the recommendation's
    stated scope.

13. **Direction is flat and is reported as flat — SUPPORTED (a null, deliberately kept).** SPY on
    Columbus Day sessions: up **20 of 33 = 60.6%** against a **54.1%** all-session base rate over 8,457
    sessions (sign-test p = 0.296); median +0.097% vs +0.068%. No directional call exists on this date
    in either direction.

14. **No pre-holiday front-load on the preceding Friday — SUPPORTED, reproduced.** The D-1 TLT−SPY gap
    is **+0.075**, negative in only 10 of 24 (p = 0.541) — indistinguishable from noise. LQD's is
    **−0.226** (16 of 24, p = 0.152), also not significant. The reliable Friday liquidity window that
    exists before Veterans Day does not exist here and must not be assumed for 2027-10-09.

15. **Nothing in the house system is calendar- or expiration-keyed — SUPPORTED, re-verified.** A grep of
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|veterans|columbus|closure|half-day|early close|opex|expiration|witching` returns **zero
    hits in both**, run this session. No playbook can fire on this date in either direction.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate`, and the source is a recommendation.
The supported outputs are guards and refusals: the **overlap null** (legs 4–6 — expiration week does not
amplify the closure, and the coincidence is routine), the **dissolved false positive** (leg 5, kept on
the record so it is not rediscovered), the **deliberate deferral of the depth guard** with its dated
trigger (leg 9), the **catch-up refusal at the expiration Friday** (leg 10, low confidence, zero size),
the **withdrawal of any assumed Friday front-load** (leg 14), and the **reading guard** that anything
rates-shaped visible on 10-11 is ETF/options-only price discovery (leg 2).

### Honest limits

- **The overlap nulls are small-n and are consistent with no effect, not proof of none.** n=14 vs n=10
  pooled and n=7 vs n=5 modern. A real effect smaller than roughly half the pooled spread would not be
  detectable here, and nothing in this ledger claims it would.
- **The deferral in leg 9 is a judgment, not a measurement.** It is possible the 2026-10-12 instance
  resolves nothing — three forward tests can all come back ambiguous — in which case this event reaches
  its next pulse with the guard still open and no better reason to write one.
- **Leg 10's refusal predicts "ordinary," and ordinary is the base rate** (86% overlap vs 88%
  unconditional). Its information is in the overlap-vs-not comparison, which is itself a null, so
  FT-…-2 is a low-confidence registration by construction.
- **A ^VIX data artifact worth knowing, because the deterministic screen reads VIX.** The Yahoo ^VIX
  series carries a bar for **2026-09-07** (15.30) — Labor Day, a full market closure with no SPY bar —
  and likewise for 2026-05-25 (Memorial Day), while correctly omitting 2026-07-03, 2026-06-19,
  2026-01-01, 2025-12-25 and 2025-11-27. The reading recorded in this ledger's `probe-ref` is
  **15.41, intraday 2026-09-08**; the last confirmed close is **14.53 on 2026-09-04**. A future screen
  diffing VIX across a holiday should expect an occasional spurious row.
- **The corridor is sparse because the 2027 calendar is sparse.** Three tracked events inside ±5 days is
  *unpopulated*, not *quiet*; CPI, PPI and jobs prints for October 2027 are simply not on this calendar
  yet, and one landing at D-1 or D+1 would change the reading guard materially.
- **CME futures hours and Treasury settlement handling for 2027-10-11 are UNRESOLVED.** `cmegroup.com`
  403s to this runner and was not re-attempted; `treasurydirect.gov` was not fetched. Neither Fed page
  carries an extractable Fedwire-hours sentence. Nothing is asserted about futures or payment rails.
- **The historical sample assumes SIFMA recommended a Columbus Day full closure back to 1993.** The
  published panels cover 2026 and 2027 only; the Fed pages cover 2026–2030. The page's "View Archive"
  link was not followed. If some of those 24 sessions were normal bond sessions, the measured effect is
  understated rather than overstated — but the assumption is real and unchecked.
- **The ETF findings are about ETFs and about share volume only** — nothing here measures spreads,
  depth or market impact, which are what an execution guard would ideally be stated in.
- **398 days is a long time.** Everything measured here is a base rate; the 2027 regime is unknown, and
  every reading is taken in a calm tape (^VIX ~15).
- **Every trading-adjacent statement carries the `estimate` label.** Estimates widen caution and license
  nothing.

## Stance & kill switches

**Stance (2026-09-08):** stand aside on the date, and **hold this event's execution guard deliberately
open** rather than inheriting or inventing one. Concretely: (a) the closure reproduces from four
independent primaries — SIFMA's US 2027 card with an empty note (early-close positive control two cards
above), both Federal Reserve schedules' 2027 column, OCC's `Bank holiday` marker, and NYSE's zero
Columbus rows — while staying `estimate` on a taxonomy gap and a non-binding recommendation; (b) equities
**and options** run full sessions while the USD cash-bond tape is dark 72 hours, so anything rates-shaped
on 10-11 is ETF/options-only price discovery; (c) **the expiration-week overlap that motivated this
research is a null** — closure-day paired gaps −0.357 vs −0.247 (P = 0.606), modern era −0.141 vs −0.140
(P = 1.000), LQD P = 0.529, IEF P = 0.306; (d) **the one sub-0.05 result in the battery dissolved** from
P = 0.042 to P = 0.420 when paired against SPY, and is recorded as the expected false positive out of
~15 tests; (e) **the coincidence is routine and not a 2027 property** — 19 of 33 years, and 2026 is an
overlap year too, so the sibling is not a control; (f) the base signature and era split reproduce
exactly (TLT 0.481×/−0.346, LQD 0.395×/−0.329, SHY −0.051 p = 0.839; TLT 0.235× → 0.730×, LQD 0.505× →
0.282×), which is why this ledger adds no depth number of its own; (g) **the depth guard is deferred to
2026-10-19/20**, when the sibling's three forward tests score, 357 days before this event; (h) the
catch-up story does not appear at the expiration Friday either (10 of 14 negative, median −0.167), but
its 86% pass rate against an 88% unconditional base rate means it is registered at LOW; (i) direction is
flat (SPY 20 of 33 up, p = 0.296) and there is no Friday front-load (+0.075, p = 0.541). Every statement
carries the event's **`estimate`** label, and `symbols: []` with no calendar-keyed playbook means nothing
can act on any of it.

**Kill switches:**

- **TLT's 2027-10-11 paired TLT−SPY volume-ratio gap comes in at or below −0.40** — the overlap null in
  leg 4 fails on the instance that matters and expiration week *does* amplify the closure. Registered as
  **FT-sifma-bond-holiday-close-2027-10-11-1**, score by 2027-10-18.
- **TLT's paired gap on 2026-10-16 exceeds +0.30** — the closure's lost volume does reappear at the
  week's expiration and leg 10's refusal is wrong on the next overlap instance. Registered as
  **FT-sifma-bond-holiday-close-2027-10-11-2**, score by 2026-10-23.
- **TLT's 2026-10-12 volume ratio prints inside 0.70–0.85× its trailing-20 median** — the deferral in
  leg 9 bought nothing, the modern band was already the answer, and the 2027 guard should have been
  written at D-398 rather than held open.
- **The sibling's FT-sifma-bond-market-closure-2026-10-12-1 and -2 both score KILL on 2026-10-19** — the
  era split is wrong in both directions at once, legs 7–9 rest on a reproduction of a broken statistic,
  and this ledger's deferral must be re-argued from scratch rather than simply waiting again.
- **SIFMA revises, moves or withdraws the 2027-10-11 recommendation, or NYSE adds a 2027-10-11 equity
  closure or early close** — the premise changes and legs 1, 2, 4, 10 and 14 all need re-deriving (a
  shortened equity session is not comparable to the 33 full ones every base rate is built from).
- **A CPI, PPI, jobs print or FOMC decision is added to the calendar at D-1 or D+1 of 2027-10-11** — the
  corridor stops being merely unpopulated, the reading guard in leg 2 becomes load-bearing, and the
  comparison to the sibling's "clean instance" framing must be rebuilt.
- **`opex-2027-10-15` is re-dated, or OCC republishes its 2027 calendar with a different expiration
  Friday** — the overlap premise this whole session tested disappears and legs 3–6 and 10 are moot.
- **CME hours for 2027-10-11 become obtainable and show Treasury futures also halted** — the
  exchange-traded-fallback reading of the SHY counter-observation (leg 7) is refuted and the
  concentration of the effect needs a different explanation.
- **A holiday-, expiration- or session-hours-keyed house playbook is written and back-tested** — leg 15
  goes stale and the stand-aside must be re-argued on measured data rather than on absence.
- **A VIX regime shift (≥ 3 points from 15.41) before the next check** — every liquidity reading here is
  a calm-tape measurement.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | 398 | **Initial research; canonical `<id>.json` written from the single proposal (`from-opex-2027-10-15`, 2026-09-06), whose date claim reproduces exactly.** Shape confirmed from **four** primaries, all HTTP 200 this session (`blocked` empty): SIFMA US 2027 card `Columbus Day` / `Monday, October 11, 2027` with an **empty** note (positive control two cards above: `Monday, July 5, 2027` + `Early Close … Friday, July 2, 2027`); `federalreserve.gov` K.8 **and** `frbservices.org` both `Columbus Day \| … \| October 11 \| …` for 2027; **OCC** 2027 calendar marks 10-11 `Bank holiday`, **not** `Exchange/OCC holiday` — options open while banks are shut; NYSE grid **zero** `Columbus`/`October 11` in 133 cells. OCC also fixes the corridor: A.M.-settled index options cease **10-14**, monthly expiration **10-15**, VIX expiration **10-20**. **THE EVENT'S OWN QUESTION — expiration-week overlap — IS A NULL.** Closure-day paired bond−SPY volume gap, overlap vs not (perm test, 20k relabellings): TLT **−0.357 / −0.247, P=0.606**; modern 2014+ **−0.141 / −0.140, P=1.000**; LQD P=0.529; IEF P=0.306. **The battery's only sub-0.05 dissolved**: TLT opex-Friday ratio 0.924× vs 1.441× (**P=0.042**) → paired vs SPY −0.167 vs −0.040 (**P=0.420**) — the general opex-Friday level, not the closure; ~15 tests run, one false positive expected, one arrived. **Coincidence is routine, not a 2027 property**: Columbus inside opex week **19 of 33** years, and **2026-10-12 is an overlap year too**, so the sibling is not a control (2028 is the next non-overlap). Base signature + era split reproduce to 3dp from fresh bars (LQD 0.395×, TLT 0.481×, gaps −0.329/−0.346, **SHY −0.051 p=0.839**; TLT 0.235×→0.730×, LQD 0.505×→0.282×) — so **no new depth number is published here**. No Friday front-load (D-1 +0.075, p=0.541); direction flat (SPY 20/33, p=0.296); next-session move overlap 1.169× vs 0.450× is **P=0.162 → noise, not promoted**. **NEW vs the sibling:** SIFMA's **Japan 2027** card reads `Health and Sports Day` / `Monday, October 11, 2027` **`Tentative – Subject to confirmation by the Bank of Japan`**, where 2026's is empty — carried as provisional. Adjacency — peers n/a (`symbols: []`); macro: corridor ±5d is only `fomc-minutes-2027-10-06` (D-5), `opex-2027-10-15` (D+4, **confirmed**), `fomc-blackout-start-2027-10-16` (D+5) — **unpopulated, not quiet**, the 2027 calendar is sparse; VIX **15.41** intraday 2026-09-08 (last close 14.53 on 09-04; ^VIX carries spurious holiday rows on 2026-09-07 and 2026-05-25 — relevant to the deterministic screen); geopolitical: nothing dated found touching this event. CME 403 / treasurydirect not attempted → futures + settlement legs unstated. **No new dated adjacent event discovered; no calendar proposal filed.** | Initial stance set: **stand aside**, and **defer the execution guard on purpose** — the deciding observation is the sibling's FT-1/-2/-3 scoring **2026-10-19/20**, 357 days before this event. Registers **FT-sifma-bond-holiday-close-2027-10-11-1** (overlap null on the instance) and **-2** (no catch-up at the 2026-10-16 expiration Friday). | 2026-10-08 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sifma-bond-holiday-close-2027-10-11.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
