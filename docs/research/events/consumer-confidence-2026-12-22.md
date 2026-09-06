# Conference Board Consumer Confidence (Dec 2026) — consumer-confidence-2026-12-22

**Kind:** macro-print · **Date:** 2026-12-22 (estimate, EST: derived 2026-09-06 from five sourced December editions — 2021-12-22, 2022-12-21, 2023-12-20, 2024-12-23, 2025-12-23 — none of which fell on the publisher's stated "last Tuesday of every month" and only one of which was a Tuesday; the best fit points at 2026-12-23 and the empirical window is 12-21→12-23, so the id's 12-22 is the middle of that window, ±1 day) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["boj-decision-2026-12-18","boj-minutes-2026-12-23","christmas-eve-half-day-2026-12-24","durable-goods-2026-12-23","ecb-decision-2026-12-17","gdp-q3-2026-third-2026-12-23","housing-starts-2026-12-17","import-export-prices-2026-12-17","intl-transactions-q3-2026-12-18","japan-cpi-2026-12-18","japan-cpi-tokyo-flash-2026-12-25","new-home-sales-2026-12-23","opex-2026-12-18","pce-2026-12-23","pending-home-sales-2026-12-17","puct-batch-zero-report-open-meeting-2026-12-17"],"screenStreak":0,"blocked":[{"url":"https://www.congress.gov/bill/119th-congress/house-bill/6500","status":"403","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Dec-2025","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Dec-2021","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **The date on this entry is derived from a rule that does not exist, but it barely matters —
and the reason it barely matters is the finding.** The proposal that created this id put it at 12-22
as "the fourth Tuesday" off two precedents. Widened to **five sourced December editions**, no Tuesday
rule survives: **Dec-2021 Wed 12-22 · Dec-2022 Wed 12-21 · Dec-2023 Wed 12-20 · Dec-2024 Mon 12-23 ·
Dec-2025 Tue 12-23** — one Tuesday in five, and never the last Tuesday. The date is a **12-21→12-23
window**; best fit is **12-23**. What *is* firm is the **field cut-off: December 16 on all three
editions that state one** (2021, 2024, 2025) — a fixed calendar date, not the floating 7–9 day lag the
11-24 sibling derived from two points. So on any date in the window the panel closes **12-16**, which
makes this **the first Conference Board survey to close after the 12-09 FOMC, after the 12-10 CPI and
across the 12-11 funding cliff** — the mirror of its sibling, which was the *last* read before the
meeting. Second finding, a correction: the series' celebrated tape null **does not cover this print**.
The sibling's n=68 study used the last Tuesday of December — an **FHFA day, not a CB day** — so it
measured five days this print does not sit on and missed the five it does. Re-run on the corrected
set the null **survives** (0 of 7 at p<0.05) but loses its uniformity: SPY **p 0.184 → 0.547**, QQQ
flips to *wider*. The five actual December CB days lean **wider** (SPY median **1.232% vs 0.978%**),
n=5, untestable. So: stand aside — but on *nothing to act on*, not on *measured quiet*. Date
**estimate**; `symbols: []`; **0** macro-keyed playbooks.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-107) | **Stand aside** | High | `symbols: []`, D-107, the December panel does not open for twelve weeks, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits** today. Nothing dated exists to act on. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2026-12-22** — none exists today |
| This week | **Stand aside — the series' live question is the 09-29 print, not this one** | High | The current edition is **August 2026, released 08-25**: headline **89.4** (from 90.2), Present Situation **121.2**, Expectations **68.2**, cut-off **Aug 3–16**. VIX **14.53**, S&P **7,718.60**, Brent **$96.28** (2026-09-04 closes). | The Conference Board naming a December 2026 date before **2026-11-30**, which settles the window this doc leaves open |
| This month | **Do not inherit the sibling's null for this print — it was measured on the wrong days** | High | The n=68 set used the last Tuesday of December (**2021-12-28 · 2022-12-27 · 2023-12-26 · 2024-12-31 · 2025-12-30**) — all FHFA days, none a CB day — and omitted **2021-12-22 · 2022-12-21 · 2023-12-20 · 2024-12-23 · 2025-12-23**. Corrected: still 0 of 7 at p<0.05, but SPY **0.942 vs 0.978** (p=**0.5474**) and QQQ **1.416 vs 1.375** — *wider*, not narrower. | Any of the seven printing a release-day median session range **differing from baseline at p<0.05** on a re-run of the corrected set after **2026-12-31** |
| This quarter | **Watch the cut-off, not the date — and stay flat through the 12-18 → 12-24 corridor** | Medium | A **12-16** cut-off puts the **12-09 FOMC**, **12-10 CPI** and **12-11 CR expiry** inside the field window and the holiday season behind it, so the buying-plans lines describe a season already spent. The corridor runs quad-witching **12-18**, this print **12-22**, a five-print **12-23** (PCE + durables + Q3 third GDP + new home sales + BoJ minutes), a **12-24** half day, **12-25** closed. | The Conference Board publishing a December 2026 cut-off other than **12-16**, which breaks the fixed-date finding every claim in this row rests on |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks,
  and the release-day tape for this specific slot is *unmeasured* rather than quiet.
- **The Conference Board names a December 2026 date** → adopt it verbatim; **do not** assume 12-29,
  and do not file a competing id. Registered as **FT-consumer-confidence-2026-12-22-1**.
- **A stated cut-off other than 12-16** → the fixed-cut-off finding fails and legs 3–4 need re-deriving.
- **A funding lapse on 12-11 that is still running on 12-16** → this becomes the first sentiment read
  taken inside the lapse, and the 10-27 sibling's promoted-read framing revives for this print.
- **Expectations back above 80** → the Board's own recession threshold, breached since Feb 2025 and at
  **68.2** in August, clears; the late-cycle framing this whole series carries dies.
- **Expectations below ~62** → deterioration is accelerating, and it would be the first reading taken
  after the December FOMC saw the same consumer.
- **Buying-plans lines weaken on a post-season panel** → a *backward* read on holiday retail, not a
  forward one. A reading aid, never a position.
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication
  restrictions — structural, established by the 09-29 sibling, not re-spent here.
- **Watch (dated):** FOMC **09-16** · CB print **09-29** · CPI **10-14** · FOMC **10-28** · midterms
  **11-03** (est.) · CB print **11-24** (est.) · **FOMC 12-09** · **CPI 12-10** · **CR expiry 12-11**
  (est.) · retail sales **12-16** = the likely cut-off · **opex 12-18** · **this print 12-22** (est.,
  ±1 day) · the five-print **12-23** stack · half day **12-24** (est.) · FHFA HPI **12-29**.

## Initial research

### The question, plainly

The 11-24 sibling proposed this id at 12-22 and said in its own `notes` that the date "is the honest
problem." So: **is 12-22 right?** Is there anything about the *December* edition that the four
siblings (08-25, 09-29, 10-27, 11-24) have not already covered? Does the series' hard-won
no-tape-effect null — seven instruments, n=68, zero hits — actually **cover this print**, which is the
one edition each year that does not share its day with FHFA HPI? And what should a paper book holding
NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN do about it?

**One-line verdict:** the date's *mechanism* is refuted and its *answer* is off by about a day, and
neither matters — because the field cut-off is a fixed **December 16**, which makes this the first
Conference Board panel to close after the December FOMC, after the December CPI and across the funding
cliff; meanwhile the series' null turns out to have been measured on five days that are FHFA's and not
this print's, so the stand-aside here rests on *nothing to act on* rather than on *measured quiet*.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Five Conference Board sources fetched today (2026-09-06):**
`conference-board.org/topics/consumer-confidence` (HTTP 200 — the cadence sentence, the named next
release, the August 2026 values and cut-off), and the December editions `CCI-Dec-2024` (HTTP 200,
dated December 23, 2024, cut-off December 16), `CCI-Dec-2023` (HTTP 200, dated December 20, 2023) and
`CCI-Dec-2022` (HTTP 200, dated December 21, 2022). **Two slugs failed in a way worth naming
separately from a block:** `CCI-Dec-2025` and `CCI-Dec-2021` returned **HTTP 200 while serving the
*current* August 2026 edition** — a silent substitution, not an error, and the exact failure mode that
would have let a careless session record two fabricated December dates. Both are recorded in
`probe-ref.blocked` as `200-SERVED-CURRENT-EDITION`, and those two dates instead rest on **PRNewswire
datelines** — the Board's own distribution wire — fetched today at HTTP 200: *"December 22, 2021,
10:00 ET"* (cut-off December 16, 2021) and *"December 23, 2025, 10:00 ET"* (cut-off December 16,
2025). **The tape study is this session's own work and was deliberately built to be falsifiable
against the sibling's:** daily OHLC for SPY, QQQ, XLY, XRT, AMZN, AAPL and ^VIX from the Yahoo chart
endpoint for 2020-12-01 → 2026-09-05, session range `(high − low) / open`, two-sided Mann-Whitney U
with tie correction. Run first on the sibling's own set (the last Tuesday of every month, 2021-01 →
2026-08), it **reproduces that ledger's published figures to three decimals** — SPY 0.904 vs 0.981,
p 0.1843 against its 0.1876; QQQ 1.353; XLY 1.291; XRT 1.669; AMZN 2.169; AAPL 1.762; VIX 17.76 —
which is what licenses the corrected re-run in leg 5 as a like-for-like comparison rather than a
different pipeline disagreeing. **One fetch failed and is recorded, not substituted:** congress.gov
H.R.6500 **403** — so the CR facts below are carried at the secondary fidelity the
[`consumer-confidence-2026-11-24`](consumer-confidence-2026-11-24.md) and
[`consumer-confidence-2026-09-29`](consumer-confidence-2026-09-29.md) siblings established, explicitly
labelled, and not re-asserted as primary. Market readings are Yahoo daily closes for **2026-09-04**:
VIX **14.53**, S&P 500 **7,718.60**, SPY **770.19**, Brent (BZ=F) **$96.28**. All four siblings are
read as inputs and cited, never silently restated.

### Conviction legs, tested

1. **The publisher's stated cadence rule is false in December — REFUTED on five consecutive editions,
   not two.** `conference-board.org` states verbatim, fetched today: **"The Conference Board publishes
   the Consumer Confidence Index® at 10 a.m. ET on the last Tuesday of every month,"** and names only
   **"Tuesday, September 29th at 10 AM ET."** December is not named. The record:

   | Edition | Released | Weekday | Last Tuesday of that December | Days before Christmas | Source |
   |---|---|---|---|---|---|
   | Dec 2021 | 2021-12-22 | **Wed** | 12-28 | 3 | PRNewswire dateline, HTTP 200 |
   | Dec 2022 | 2022-12-21 | **Wed** | 12-27 | 4 | conference-board.org `CCI-Dec-2022`, HTTP 200 |
   | Dec 2023 | 2023-12-20 | **Wed** | 12-26 | 5 | conference-board.org `CCI-Dec-2023`, HTTP 200 |
   | Dec 2024 | 2024-12-23 | **Mon** | 12-31 | 2 | conference-board.org `CCI-Dec-2024`, HTTP 200 |
   | Dec 2025 | 2025-12-23 | **Tue** | 12-30 | 2 | PRNewswire dateline, HTTP 200 |

   **Five for five off the last Tuesday, and four of five not even a Tuesday.** The 11-24 sibling
   reached the same conclusion from Dec-2024 plus a snippet; three additional primaries make it a
   settled property of the series rather than an exception observed twice.

2. **The proposal's "fourth Tuesday" mechanism does not survive — REFUTED; the fit points at 12-23,
   and the defensible statement is a window.** The proposal that created this id derived 12-22 as the
   fourth Tuesday. Dec-2023 was a **Wednesday** and Dec-2024 a **Monday**, so no Tuesday rule of any
   kind fits. The rule that does fit all five is **"the latest Monday, Tuesday or Wednesday strictly
   before December 24"** — it reproduces 2021-12-22, 2022-12-21, 2023-12-20, 2024-12-23 and
   2025-12-23 exactly, and applied to 2026 (Christmas Eve is Thursday 12-24) gives **Wednesday
   2026-12-23**. **The honest weight to put on that:** it is a rule fitted post-hoc to five points
   with freedom over the weekday set, which is close to the worst evidential shape there is, and it is
   offered as the best available point estimate rather than a discovered mechanism. The claim that
   *is* robust is the empirical one — every edition landed **2 to 5 days before Christmas**, which for
   2026 is the window **12-21 → 12-23**. **What this doc deliberately does not do:** file a competing
   `consumer-confidence-2026-12-23` id. Those three dates are one real-world print; a second entry
   would be calendar pollution, and the Board names each date about a month ahead, so late November
   settles it for free. The id keeps **12-22**, the middle of the window, explicitly ±1 day.
   Registered as **FT-consumer-confidence-2026-12-22-1**.

3. **The field cut-off is a fixed December 16, not a floating lag — SUPPORTED, and this is the finding
   that makes leg 2's ambiguity harmless.** Three of the five editions state a cut-off, and all three
   state the same calendar date: **December 16, 2021** · **December 16, 2024** · **December 16, 2025**.
   The *lag* to release therefore varies (6, 7 and 7 days) while the *date* does not — which inverts
   the 11-24 sibling's derivation, honestly built from two points across different months as "cut-off
   runs 7–9 days pre-release." In December the lag is the derived quantity and the cut-off is the
   fixed one. **Consequence:** on any date in the 12-21→12-23 window, the December 2026 panel closes
   **2026-12-16** and runs from roughly **2026-12-01**. The date debate in legs 1–2 is calendar
   hygiene; it does not touch a single claim about what this survey will have seen.

4. **A 12-16 cut-off makes this the first consumer read after the December FOMC and across the funding
   cliff — SUPPORTED, structurally, and it is the exact mirror of the 11-24 sibling.** Inside the
   implied ~12-01 → 12-16 field window sit **FOMC 12-09** (`confirmed`), **CPI 12-10** (`confirmed`),
   the **CR expiry / government funding deadline 12-11** (both `estimate`), **PPI 12-15**
   (`confirmed`) and **retail sales 12-16** (`confirmed`, the boundary day). The sibling's claim was
   that 11-24 is the **last** Conference Board datapoint to exist before the committee meets; this
   print is the **first** to exist after it — and unlike the Beige Book, whose district cut-off
   precedes it, this panel genuinely spans the decision. **Two further consequences of the same
   window.** It reads the holiday season **retrospectively**: Black Friday (11-27), Cyber Monday and
   roughly three weeks of December trading are all behind the cut-off, so the six-month buying-plans
   lines describe a season largely spent — the precise mirror of the sibling's pre-Black-Friday slot,
   where they described a season not yet begun. And it is the **last consumer-confidence datapoint of
   2026**, published nine days before the **12-30 FOMC minutes**. **The narrow reading, stated:** this
   is a claim about what the panel *saw*, not evidence that anyone trades it.

5. **The series' measured tape null does not cover this print — its release-day set was mislabeled in
   exactly the five days that are this edition's own slot. MIXED: the call survives, one of its
   supporting claims does not.** The 11-24 sibling built the strongest evidence in this series — n=68,
   seven instruments, zero hits at p<0.05 — on "the last Tuesday of each month from 2021-01 through
   2026-08," reasoning that the Conference Board and FHFA both key on the last Tuesday. Leg 1 is
   precisely the case where that stops being true. Its set therefore **contains five days the
   Conference Board did not release on** — 2021-12-28, 2022-12-27, 2023-12-26, 2024-12-31,
   2025-12-30, all FHFA days — and **omits the five it did**: 2021-12-22, 2022-12-21, 2023-12-20,
   2024-12-23, 2025-12-23. Re-run with those five swapped, on the same pipeline that reproduces the
   sibling's own numbers to three decimals:

   | Instrument | Sibling's set (median rel / base, p) | **Corrected set** (median rel / base, p) |
   |---|---|---|
   | SPY | 0.904 / 0.982, p=0.1843 | **0.942 / 0.978, p=0.5474** |
   | QQQ | 1.353 / 1.375, p=0.3915 | **1.416 / 1.375, p=0.7561** |
   | XLY | 1.291 / 1.448, p=0.1626 | **1.354 / 1.447, p=0.3803** |
   | XRT | 1.669 / 1.841, p=0.2405 | **1.690 / 1.840, p=0.2916** |
   | AMZN | 2.169 / 2.274, p=0.6108 | **2.188 / 2.272, p=0.7871** |
   | AAPL | 1.762 / 1.862, p=0.4041 | **1.796 / 1.862, p=0.5796** |
   | VIX close | 17.760 / 17.990, p=0.7952 | **17.985 / 17.990, p=0.7861** |

   **What survives: the no-trade call.** Still **0 of 7 at p<0.05**, and the corrected p-values are
   uniformly *larger* — the null is, if anything, more null. **What does not survive: the flourish.**
   The sibling's memorable line was that all seven point the same way, release days being *narrower*,
   "which is the wrong sign for a 'the survey adds variance' story." On the corrected set **QQQ's
   median flips to wider** (1.416 vs 1.375) and the SPY tail goes with it (p75 **1.555 vs 1.418**,
   against the sibling's 1.490). Seven-of-seven directional agreement was an artifact of which five
   December days were in the sample. **This is a correction to a supporting claim, not to a verdict** —
   the sibling's stand-aside was right and is right for the same reason it always was.

6. **The December slot itself is unmeasured, the five days that exist lean *wider*, and the obvious
   calendar explanation fails its own test — MIXED, deliberately not claimed.** Because December is
   the one month the two publishers separate (FHFA holds the last Tuesday — the tracked
   `fhfa-hpi-2026-12-29` sits a week after this print), the December CB days are the **only
   de-confounded read of this release's own tape effect** that exists. There are five of them:

   | | 2021-12-22 | 2022-12-21 | 2023-12-20 | 2024-12-23 | 2025-12-23 | median | baseline median |
   |---|---|---|---|---|---|---|---|
   | SPY range | 1.130% | 1.232% | 1.705% | 1.293% | 0.633% | **1.232%** | 0.978% |
   | SPY close-to-close | +1.00% | +1.50% | −1.39% | +0.60% | +0.46% | +0.60% | — |
   | VIX close | 18.63 | 20.07 | 13.67 | 16.78 | 14.00 | **16.78** | 17.99 |

   Four of five sit above the baseline median range, and the median is **26% wider**. **n=5 supports
   no test and this doc runs none** — it is reported because it is the opposite of what the inherited
   null would lead a reader to expect, and because a reader who assumed the null covered this print
   would be assuming something nobody has measured. **The tempting explanation also fails.** "It is
   Christmas week, the tape is thin" predicts the neighbouring sessions behave the same way; they do
   not — all Dec 21–24 sessions 2021-2025 (n=13) run a SPY median range of **0.985% vs a 0.975%
   baseline, p=0.9587**, indistinguishable. So the five wide days are not a holiday-week property, and
   with n=5 the honest verdict is **noise until shown otherwise**. Registered as
   **FT-consumer-confidence-2026-12-22-2**.

7. **Volatility in this window is directionally lower and not established — SUPPORTED only as a cost
   observation.** VIX on the five December CB days runs a median **16.78** against a **17.99**
   baseline, and the Dec 21–24 corridor runs **16.78 vs 17.995** at **p=0.1153** — the familiar
   holiday vol crush, visible but not significant at n=13. **The only legitimate use of this** is
   pricing: anything options-shaped in the 12-18 → 12-24 corridor is bought cheaper and sold cheaper
   than the annual average. That is a statement about **cost**, never about entry, and no entry
   follows from it here.

8. **The corridor repeats the sibling's shape exactly, with two differences that matter — SUPPORTED.**
   Sixteen tracked events sit within five days of 12-22: **12-17** ECB decision + housing starts +
   pending home sales + import/export prices + the PUCT batch-zero meeting · **12-18** **quad-witching
   opex** (`high`) + BoJ decision + Japan CPI + Q3 international transactions · weekend · **12-22 this
   print** · **12-23 stacks five** — **PCE** (`high`) + durable goods + **Q3 third-estimate GDP** +
   new home sales + BoJ minutes · **12-24** a half day · **12-25** closed (Tokyo CPI flash prints into
   it). The echo of 11-24 is near-exact: a second-tier survey sitting the day before a five-print
   pre-holiday Wednesday, into a shortened week. **The two differences.** This corridor follows
   **quad-witching by two sessions**, so December-expiry dealer positioning has just rolled off — a
   structural reason for the corridor's tape to behave unlike November's, and a candidate explanation
   for leg 6 that this doc does not have the sample to test. And it sits in **the thinnest liquidity
   of the year**, not merely of the quarter. If the release slips to **12-23** as leg 2's fit
   suggests, it lands *inside* the five-print stack rather than the day before it — which changes its
   salience completely and changes the call not at all.

9. **The funding cliff is the one genuinely live conditional, and it is a structure, not a direction —
   SUPPORTED.** The CR signed **2026-09-02** funds agencies through **2026-12-11**; the tracked
   `cr-expiry-2026-12-11` and `government-funding-deadline-2026-12-11` are both `estimate` and both
   `high` impact. **Carried at secondary fidelity:** congress.gov H.R.6500 **403**'d again today
   (recorded in `probe-ref.blocked`), so this rests on the 11-24 and 09-29 siblings' independently
   sourced rows, not on a primary this session read. The structure is symmetric and worth stating
   before the fact: a lapse beginning **12-11** would still be running when the panel closes **12-16**,
   making this **the first sentiment reading taken inside it** — and if federal statistical agencies
   go dark, the 10-27 sibling's "promoted read" framing (a private survey filling a federal data
   blackout) revives for *this* print, having missed the November one. Averted, the panel captures the
   relief instead. **Neither branch is a trade** — both are reasons the December edition is worth
   *reading*, which is the only thing this series has ever been worth.

10. **Tracked-name sensitivity is the thinnest of the series — SUPPORTED.** `symbols: []`. Only
    **AAPL** and **AMZN** carry direct consumer exposure and neither reports anywhere near 12-22;
    both are inside leg 5's corrected null (p=0.5796, p=0.7871) and their December-slot ranges are
    unremarkable. A re-grep of `docs/plans/trade-playbooks.md` and
    [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for any macro- or sentiment-keyed playbook
    returns **0 hits** today, as it has for every sibling. The other seven names feel this only
    through the shared rate-path channel, which the **12-09** FOMC owns and this print post-dates.

### What the conditions support

**A refusal, a correction the calendar should *not* act on yet, and a reading order.** The refusal is
unchanged from the whole series and is load-bearing: **nothing is opened, closed or sized off this
print**, and the standing instruction for the corridor is to be **flat through 12-18 → 12-24**, the
thinnest liquidity of the year carrying quad-witching, a five-print Wednesday and a half day. What has
changed is the *reason*: the refusal here rests on `symbols: []`, zero macro-keyed playbooks and a
D-107 horizon — **not** on the sibling's measured quiet, which leg 5 shows was measured on days this
print does not sit on. The correction is legs 1–2: the id's date is a **window**, the best fit is
**12-23**, and the right response is to adopt the Board's own next-release line when it appears in
late November rather than to file a competing id now. The reading order when it lands: the **cut-off
date** first (it validates or breaks leg 3, on which legs 4 and 9 depend), the **Expectations** level
against the Board's own 80.0 threshold second, the **subcomponent split** third — the first look at
the consumer after the December FOMC — and the headline last.

### Honest limits

**The date is `estimate` and the rule behind it is fitted, not discovered** — five points, freedom over
the weekday set, and a post-hoc fit is the weakest evidential shape available; the window 12-21→12-23
is the part worth trusting. **Two December editions rest on wire datelines rather than the publisher's
own page**, because `CCI-Dec-2025` and `CCI-Dec-2021` returned HTTP 200 while serving the current
August 2026 edition — a silent substitution that a less suspicious session would have recorded as two
fabricated dates, which is why it is in `probe-ref.blocked` under its own status rather than folded in
with the 403s. **The 12-16 cut-off is three observations**, and two of the five editions state no
cut-off at all; leg 3 would be broken by a single December publishing a different one. **Leg 6 is n=5
and is reported, not tested** — it says the December slot is *unmeasured*, which is a weaker and more
honest claim than either "quiet" or "wide." **Leg 5 corrects a sibling's supporting claim, not its
verdict**, and the correction cuts in the direction of *less* signal, not more. **The CR facts are
secondary-sourced** after a repeat 403. **No December consensus exists and structurally will not**
(Conference Board publication restrictions), so there is no measurable surprise gap. And the **December
FOMC outcome, the CPI print and the funding outcome are all unknown at D-107** — legs 4 and 9 are about
what the panel will have *seen*, and no part of this doc depends on what any of them says.

## Stance & kill switches

**Stance (date `estimate`, ±1 day; not primary-verified).** Treat the December 2026 Conference Board
edition as a **medium-impact second-tier print that is regime information and never a trading event**.
**No position is opened, closed or sized off it**, and the standing instruction for the corridor is to
be **flat through 12-18 → 12-24**. Two things distinguish this stance from its four siblings'. First,
the refusal is **not** inherited from the series' measured null: leg 5 shows that null was computed on
the last Tuesday of December, which is FHFA's day and not this print's, and the five days that are
this print's slot lean *wider* at n=5 — so the honest position is that **this specific release day is
unmeasured**, and the stand-aside rests on there being nothing to act on rather than on proven quiet.
Second, the edition's information content is now pinned to a **fixed 12-16 field cut-off** rather than
to its uncertain release date: this is the **first Conference Board panel to close after the 12-09
FOMC, after the 12-10 CPI and across the 12-11 funding cliff**, and it reads the holiday season
retrospectively. Base case for the print itself (**Low** confidence — no consensus exists or will):
the December panel is dominated by the funding outcome and the post-FOMC rate path rather than by the
holiday season it nominally covers, and **Expectations stays below the Board's own 80.0 recession
threshold**, unbroken since February 2025 and at **68.2** in August. Date handling is explicit: the id
keeps **12-22**, the window is **12-21→12-23**, the fit says **12-23**, and the resolution is the
Board's own next-release line in late November — **not** a competing calendar id. Two predictions are
registered in
[`forward-tests/consumer-confidence-2026-12-22.md`](../forward-tests/consumer-confidence-2026-12-22.md).

**Kill switches:**

- **The Conference Board names a December 2026 date** — adopt it verbatim and rewrite every date-keyed
  line here. If it is **12-29**, legs 1–2 are wrong and the naive last-Tuesday rule was right all
  along despite five contrary editions. Registered as **FT-consumer-confidence-2026-12-22-1**.
- **The December 2026 edition states a cut-off other than 12-16** — leg 3 fails, and legs 4 and 9,
  which rest entirely on what the field window contains, need re-deriving from scratch.
- **The corrected n=68 set prints any of the seven instruments differing from baseline at p<0.05 on a
  re-run after 2026-12-31** — the null leg 5 preserved breaks, and the series' refusal needs a new
  foundation. Registered as **FT-consumer-confidence-2026-12-22-2**.
- **A December CB release day prints a SPY session range at or below the baseline median** — leg 6's
  wide-lean gets its sixth observation pointing the other way, and the "unmeasured" verdict resolves
  toward the inherited null rather than away from it.
- **A funding lapse begins 12-11 and is still running on 12-16** — this becomes the first sentiment
  read taken inside a lapse, and the 10-27 sibling's promoted-read framing revives for this print.
- **Expectations back above 80** — the Board's own recession-signal threshold, breached since February
  2025, clears; the late-cycle framing this whole series carries dies.
- **Expectations below ~62** — deterioration is accelerating, in the first panel to see the consumer
  after the December FOMC; escalate ahead of the banded pulse rather than waiting.
- **A macro- or sentiment-keyed playbook lands in `docs/plans/trade-playbooks.md`** — the "0 hits"
  premise under every stand-aside call here stops being true, and the calls need re-derivation against
  an actual playbook.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-107 | Initial research banked (above); **canonical `src/domain/market-events/consumer-confidence-2026-12-22.json` written this PR** after reading the one prior proposal (`proposals/consumer-confidence-2026-12-22.from-consumer-confidence-2026-11-24.json`), now inert. **Date stays `estimate` and its mechanism is REFUTED:** five sourced December editions — **2021-12-22 Wed · 2022-12-21 Wed · 2023-12-20 Wed · 2024-12-23 Mon · 2025-12-23 Tue** — are five-for-five off the publisher's stated last Tuesday and four-of-five not even Tuesdays, so the proposal's "fourth Tuesday" derivation fails. Best fit (latest Mon/Tue/Wed before Dec 24) → **2026-12-23**; robust claim is the window **12-21→12-23**; id keeps 12-22 as its middle. **No competing id filed** — one real print. **Cut-off is FIXED at Dec 16** (2021, 2024, 2025 all state it), not the 7–9 day floating lag derived from two points; lag varies 6/7/7. **Consequence:** panel runs ~12-01→12-16 on any date in the window, so it is the **first CB survey to close after FOMC 12-09, CPI 12-10 and the CR expiry 12-11**, and it reads the holiday season retrospectively — the mirror of the 11-24 sibling. **Sibling's n=68 null CORRECTED:** its set used the last Tuesday of December (**2021-12-28 · 2022-12-27 · 2023-12-26 · 2024-12-31 · 2025-12-30**, all FHFA days) and omitted the five actual CB days; pipeline first **reproduced the sibling's published figures to three decimals** (SPY 0.904/0.981 p=0.1843 vs its 0.1876; VIX 17.76), then re-ran corrected: SPY **0.942/0.978 p=0.5474**, QQQ **1.416/1.375** (*wider*), XLY 1.354/1.447 (0.3803), XRT 1.690/1.840 (0.2916), AMZN 2.188/2.272 (0.7871), AAPL 1.796/1.862 (0.5796), VIX 17.985/17.990 (0.7861). **Call survives (0 of 7 at p<0.05, p-values uniformly larger); the "all seven narrower" flourish does not.** **December slot is de-confounded but unmeasured:** the 5 CB December days run SPY ranges 1.130/1.232/1.705/1.293/0.633 (median **1.232 vs 0.978 baseline**, 4 of 5 wider), c2c +1.00/+1.50/−1.39/+0.60/+0.46; the holiday explanation fails its own test — Dec 21-24 sessions n=13 run SPY **0.985 vs 0.975, p=0.9587**. n=5, reported not tested. VIX: Dec CB days median **16.78 vs 17.99**; corridor 16.78/17.995 p=0.1153 — a cost observation only. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new this session; CR signed **09-02** funding through **12-11** carried at secondary fidelity after congress.gov H.R.6500 **403**'d again (recorded in `probe-ref.blocked`). **Volatility regime:** VIX **14.53**, S&P **7,718.60**, SPY **770.19**, Brent **$96.28** (all 2026-09-04 closes) — baseline set. **Geopolitical:** unchanged from the 11-24 sibling; Brent elevated, pass-through belongs to nearer prints. **Event tape:** no December consensus exists or is publishable (CB publication restrictions). **Sourcing failure worth naming:** `CCI-Dec-2025` and `CCI-Dec-2021` returned **HTTP 200 serving the current August 2026 edition** — silent substitution, recorded as `200-SERVED-CURRENT-EDITION`; both dates rest on PRNewswire datelines instead. **No new dated adjacency found → no proposal filed** (all 16 corridor events already tracked). **Corridor:** ECB + housing starts + pending home sales + import/export 12-17 · **quad-witching opex** + BoJ + Japan CPI 12-18 · **this print 12-22** · PCE + durables + Q3 third GDP + new home sales + BoJ minutes **12-23** · half day 12-24 · closed 12-25 · **FHFA HPI 12-29** (the de-bundling). Two forward tests registered: **FT-consumer-confidence-2026-12-22-1/-2**. | — (stance set) | 2026-09-27 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-consumer-confidence-2026-12-22.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
